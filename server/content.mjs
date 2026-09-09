import { generateText } from "@tiptap/core"
import sanitizeHtml from "sanitize-html"
import { generateHTML, generateJSON } from "@tiptap/html/server"
import { documentExtensions } from "../shared/editor-extensions.js"

export const formats = ["essay", "note", "photo-set", "video"]
export const platforms = ["Twitter / X", "LinkedIn", "Instagram", "Substack"]
export class HttpError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}
export const requireValue = (condition, message, status = 400) => {
  if (!condition) throw new HttpError(status, message)
}
export const cleanText = (html) =>
  sanitizeHtml(html, { allowedTags: [], allowedAttributes: {} })
export const slugify = (text) =>
  text
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 100)
const text = (value, limit = 500) =>
  String(value ?? "")
    .trim()
    .slice(0, limit)
export function safeUrl(value, image = false) {
  if (!value) return ""
  if (image && /^\/api\/media\/[a-f0-9-]{36}$/.test(value)) return value
  try {
    const url = new URL(value)
    if (url.protocol === "https:" || (!image && url.protocol === "http:"))
      return url.href
  } catch {
    /* Invalid URLs are rejected. */
  }
  throw new HttpError(400, "Use a valid HTTPS link.")
}
export function sanitize(html) {
  return sanitizeHtml(html, {
    allowedTags: [
      "p",
      "br",
      "h2",
      "h3",
      "strong",
      "em",
      "u",
      "s",
      "a",
      "blockquote",
      "ul",
      "ol",
      "li",
      "hr",
      "pre",
      "code",
      "img",
      "figure",
      "figcaption",
      "iframe",
      "div",
    ],
    allowedAttributes: {
      a: ["href", "rel", "target"],
      img: ["src", "alt", "title", "width", "height", "loading", "decoding"],
      iframe: ["src", "width", "height", "allowfullscreen", "title"],
      div: ["data-youtube-video"],
      ol: ["start"],
    },
    allowedSchemes: ["https", "http", "mailto"],
    allowedSchemesByTag: { img: ["https"], iframe: ["https"] },
    allowProtocolRelative: false,
    allowedIframeHostnames: ["www.youtube-nocookie.com", "www.youtube.com"],
    transformTags: {
      img: sanitizeHtml.simpleTransform("img", {
        loading: "lazy",
        decoding: "async",
      }),
      a: sanitizeHtml.simpleTransform("a", { rel: "noopener noreferrer" }),
    },
    exclusiveFilter: (frame) =>
      frame.tag === "img" &&
      !(
        /^https:\/\//.test(frame.attribs.src || "") ||
        /^\/api\/media\/[a-f0-9-]{36}$/.test(frame.attribs.src || "")
      ),
  })
}
export function renderDocument(document) {
  requireValue(
    document?.type === "doc" && Array.isArray(document.content),
    "The document is not valid.",
  )
  requireValue(
    JSON.stringify(document).length <= 1_000_000,
    "This post is too large. Split it into smaller posts.",
  )
  try {
    return sanitize(generateHTML(document, documentExtensions()))
  } catch {
    throw new HttpError(400, "This document contains an unsupported block.")
  }
}
export function importHtml(html) {
  return generateJSON(sanitize(html), documentExtensions())
}
export function validateSnapshot(input) {
  const html = renderDocument(input.document)
  const slug = slugify(input.slug || input.title || "")
  const tags = Array.isArray(input.tags)
    ? input.tags
        .map((t) => text(t, 40))
        .filter(Boolean)
        .slice(0, 20)
    : []
  const variants = (Array.isArray(input.variants) ? input.variants : [])
    .slice(0, 30)
    .map((v) => {
      requireValue(
        platforms.includes(v.platform),
        "Choose a supported social platform.",
      )
      const url = text(v.url, 2000)
      // Incomplete links remain editable in drafts. A valid link is marked as linked in the UI.
      let parsed
      try {
        parsed = new URL(url)
      } catch {
        /* Keep unfinished input. */
      }
      if (parsed) {
        const hosts = {
          "Twitter / X": ["twitter.com", "x.com"],
          LinkedIn: ["linkedin.com"],
          Instagram: ["instagram.com"],
          Substack: ["substack.com"],
        }
        const host = parsed.hostname
        if (
          !["https:", "http:"].includes(parsed.protocol) ||
          !hosts[v.platform].some((h) => host === h || host.endsWith(`.${h}`))
        )
          parsed = null
      }
      return {
        id: text(v.id, 80),
        platform: v.platform,
        parts: (v.parts || [""]).slice(0, 30).map((p) => text(p, 15000)),
        url,
        linked: Boolean(parsed),
        baseRevision: Math.max(1, Number(v.baseRevision) || 1),
      }
    })
  const date = input.date ? new Date(input.date) : new Date()
  requireValue(
    !Number.isNaN(date.valueOf()),
    "Choose a valid publication date.",
  )
  return {
    title: text(input.title, 300),
    subtitle: text(input.subtitle, 1000),
    slug,
    format: formats.includes(input.format) ? input.format : "essay",
    date: date.toISOString(),
    tags,
    project: text(input.project, 120),
    cover: safeUrl(input.cover, true),
    coverAlt: text(input.coverAlt, 500),
    document: input.document,
    html,
    text: generateText(input.document, documentExtensions(), { blockSeparator: "\n\n" }),
    variants,
    newsletter: {
      subject: text(input.newsletter?.subject, 200),
      preview: text(input.newsletter?.preview, 300),
      intro: text(input.newsletter?.intro, 5000),
    },
  }
}
export function publicSnapshot(snapshot) {
  const {
    variants: _variants,
    newsletter: _newsletter,
    ...published
  } = snapshot
  return published
}
export function referencedMedia(snapshot) {
  const text = JSON.stringify(snapshot)
  return [
    ...new Set(
      [...text.matchAll(/\/api\/media\/([a-f0-9-]{36})/g)].map((m) => m[1]),
    ),
  ]
}
