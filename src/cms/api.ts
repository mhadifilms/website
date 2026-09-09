let csrf: string | null = null
export function setCsrf(value: string | null) {
  csrf = value
}
export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}
export async function api<T>(
  path: string,
  options: { method?: string; body?: unknown; signal?: AbortSignal } = {},
): Promise<T> {
  let response: Response
  try {
    response = await fetch(`/api${path}`, {
      method: options.method || "GET",
      signal: options.signal,
      credentials: "same-origin",
      headers: {
        ...(options.body !== undefined
          ? { "Content-Type": "application/json" }
          : {}),
        ...(csrf ? { "X-CSRF-Token": csrf } : {}),
      },
      body:
        options.body !== undefined ? JSON.stringify(options.body) : undefined,
    })
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") throw error
    throw new ApiError(
      "Cannot reach the writing desk. Check your connection, then retry. Your unsaved writing stays on this device.",
      0,
    )
  }
  const body = await response.json().catch(() => null)
  if (!response.ok || !body)
    throw new ApiError(
      body?.error ||
        "The publishing server is not available. Please try again.",
      response.status,
    )
  return body as T
}
export function uploadImage(
  file: File,
  progress: (value: number) => void,
): Promise<import("./types").Media> {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest()
    request.open("POST", "/api/admin/media")
    if (csrf) request.setRequestHeader("X-CSRF-Token", csrf)
    request.timeout = 90000
    request.upload.onprogress = (event) => {
      if (event.lengthComputable)
        progress(Math.round((event.loaded / event.total) * 100))
    }
    request.onerror = request.ontimeout = () =>
      reject(
        new Error("Upload failed. Keep this image selected and try again."),
      )
    request.onload = () => {
      let body
      try {
        body = JSON.parse(request.responseText)
      } catch {
        reject(new Error("Upload could not be completed. Please try again."))
        return
      }
      if (request.status >= 400)
        reject(new Error(body.error || "Upload failed."))
      else resolve(body)
    }
    const body = new FormData()
    body.append("file", file)
    request.send(body)
  })
}
export const formatDate = (date: string) =>
  new Date(date).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
export const formatTime = (date: string) =>
  new Date(date).toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  })
export const postState = (p: import("./types").Post) =>
  p.archived_at
    ? "Archived"
    : p.scheduled_at
      ? Date.parse(p.scheduled_at) < Date.now()
        ? "Schedule needs attention"
        : "Scheduled"
      : p.published_revision
        ? p.published_revision < p.content_revision
          ? "Unpublished changes"
          : "Published"
        : "Draft"
export const slugify = (text: string) =>
  text
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 100)
