import { useCallback, useEffect, useRef, useState } from "react"
import { api, ApiError } from "./api"
import type { Post, Snapshot } from "./types"

type Recovery = { snapshot: Snapshot; version: number; savedAt: string }
export function useDraft(initial: Post) {
  const [post, setPost] = useState(initial)
  const [status, setStatus] = useState<
    "saved" | "saving" | "unsaved" | "error" | "conflict"
  >("saved")
  const [error, setError] = useState("")
  const key = `creative-chaos:draft:${initial.id}`
  const [recovery, setRecovery] = useState<Recovery | null>(() => {
    try {
      const value = JSON.parse(localStorage.getItem(key) || "null")
      return value?.snapshot?.document ? value : null
    } catch {
      return null
    }
  })
  const current = useRef(initial),
    generation = useRef(0),
    savedGeneration = useRef(0)
  const inflight = useRef<Promise<Post> | null>(null),
    blocked = useRef(false),
    mounted = useRef(true)
  const keep = useCallback(
    (p: Post) => {
      try {
        localStorage.setItem(
          key,
          JSON.stringify({
            snapshot: p.snapshot,
            version: p.version,
            savedAt: new Date().toISOString(),
          }),
        )
      } catch {
        setError(
          "This browser cannot keep a recovery copy. Keep this tab open until the server confirms your changes are saved.",
        )
      }
    },
    [key],
  )
  const update = useCallback(
    (changes: Partial<Snapshot>) => {
      generation.current++
      const next = {
        ...current.current,
        snapshot: { ...current.current.snapshot, ...changes },
      }
      current.current = next
      setPost(next)
      keep(next)
      if (!blocked.current) setStatus("unsaved")
    },
    [keep],
  )
  const flush = useCallback(async (): Promise<Post> => {
    if (inflight.current) return inflight.current
    if (blocked.current)
      throw new Error("Resolve the newer version before saving.")
    const run = async () => {
      while (savedGeneration.current < generation.current) {
        const captured = generation.current,
          draft = current.current
        if (mounted.current) setStatus("saving")
        try {
          const saved = await api<Post>(`/admin/posts/${draft.id}`, {
            method: "PUT",
            body: { version: draft.version, snapshot: draft.snapshot },
          })
          current.current = {
            ...saved,
            snapshot:
              captured === generation.current
                ? saved.snapshot
                : current.current.snapshot,
          }
          savedGeneration.current = captured
          if (mounted.current) {
            setPost(current.current)
            setError("")
          }
          if (captured === generation.current) {
            try {
              localStorage.removeItem(key)
            } catch {
              /* Server save succeeded. */
            }
          } else keep(current.current)
        } catch (cause) {
          const conflict = cause instanceof ApiError && cause.status === 409
          blocked.current = conflict
          if (mounted.current) {
            setStatus(conflict ? "conflict" : "error")
            setError(
              cause instanceof Error
                ? cause.message
                : "Save failed. Please retry.",
            )
          }
          throw cause
        }
      }
      if (mounted.current) setStatus("saved")
      return current.current
    }
    inflight.current = run().finally(() => {
      inflight.current = null
    })
    return inflight.current
  }, [key, keep])
  useEffect(() => {
    if (status !== "unsaved") return
    const timer = window.setTimeout(() => {
      void flush().catch(() => {})
    }, 900)
    return () => window.clearTimeout(timer)
  }, [post.snapshot, status, flush])
  useEffect(() => {
    mounted.current = true
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (generation.current > savedGeneration.current) {
        event.preventDefault()
        event.returnValue = ""
      }
    }
    const online = () => {
      if (!blocked.current && generation.current > savedGeneration.current)
        void flush().catch(() => {})
    }
    window.addEventListener("beforeunload", beforeUnload)
    window.addEventListener("online", online)
    return () => {
      mounted.current = false
      window.removeEventListener("beforeunload", beforeUnload)
      window.removeEventListener("online", online)
    }
  }, [flush])
  const acceptServer = (saved: Post) => {
    current.current = saved
    setPost(saved)
  }
  const recover = () => {
    if (recovery) {
      update(recovery.snapshot)
      setRecovery(null)
    }
  }
  const discardRecovery = () => {
    localStorage.removeItem(key)
    setRecovery(null)
  }
  const copyRecovery = async () =>
    api<Post>("/admin/posts", {
      method: "POST",
      body: {
        snapshot: {
          ...(recovery?.snapshot || current.current.snapshot),
          slug: "",
          title: `${(recovery?.snapshot || current.current.snapshot).title} (recovered)`,
        },
      },
    })
  return {
    post,
    status,
    error,
    recovery,
    update,
    flush,
    acceptServer,
    recover,
    discardRecovery,
    copyRecovery,
  }
}
