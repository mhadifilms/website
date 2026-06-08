import { useCallback, useEffect, useMemo, useRef, useState } from "react"

export type SectionDescriptor = {
  id: string
  slug: string
  path: string
  label: string
}

type SectionRouterState = {
  activeId: string
  register: (id: string, element: HTMLElement | null) => void
  scrollToId: (id: string, options?: { behavior?: ScrollBehavior }) => void
}

const PILL_OFFSET_PX = 96

function prefersReducedMotion() {
  if (typeof window === "undefined") return false
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

export function buildSections(items: Array<Omit<SectionDescriptor, "path">>): SectionDescriptor[] {
  return items.map((item) => ({
    ...item,
    path: item.slug === "" ? "/" : `/${item.slug}`,
  }))
}

export function useSectionRouter(sections: SectionDescriptor[]): SectionRouterState {
  const elementsRef = useRef<Map<string, HTMLElement>>(new Map())
  const [activeId, setActiveId] = useState<string>(sections[0]?.id ?? "")
  const lastPushedPathRef = useRef<string>("")
  const initialScrollDoneRef = useRef(false)

  const register = useCallback((id: string, element: HTMLElement | null) => {
    if (element) {
      elementsRef.current.set(id, element)
    } else {
      elementsRef.current.delete(id)
    }
  }, [])

  const scrollToId = useCallback<SectionRouterState["scrollToId"]>(
    (id, options) => {
      const element = elementsRef.current.get(id)
      if (!element) return
      const behavior: ScrollBehavior = options?.behavior ?? (prefersReducedMotion() ? "auto" : "smooth")
      element.scrollIntoView({ behavior, block: "start" })
    },
    [],
  )

  useEffect(() => {
    if (initialScrollDoneRef.current) return
    const initialPath = window.location.pathname.replace(/\/+$/, "") || "/"
    const match = sections.find((section) => section.path === initialPath)
    const targetId = match?.id ?? sections[0]?.id
    if (!targetId) return

    const tryScroll = () => {
      const element = elementsRef.current.get(targetId)
      if (!element) {
        requestAnimationFrame(tryScroll)
        return
      }
      element.scrollIntoView({ behavior: "auto", block: "start" })
      setActiveId(targetId)
      lastPushedPathRef.current = match?.path ?? "/"
      initialScrollDoneRef.current = true
    }
    tryScroll()
  }, [sections])

  useEffect(() => {
    if (typeof window === "undefined") return

    const ratios = new Map<string, number>()

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const id = entry.target.getAttribute("data-section-id")
          if (!id) continue
          ratios.set(id, entry.intersectionRatio)
        }

        let bestId = ""
        let bestRatio = 0
        for (const [id, ratio] of ratios.entries()) {
          if (ratio > bestRatio) {
            bestRatio = ratio
            bestId = id
          }
        }

        if (bestId && bestRatio > 0.18) {
          setActiveId((prev) => (prev === bestId ? prev : bestId))
          const section = sections.find((s) => s.id === bestId)
          if (section && section.path !== lastPushedPathRef.current) {
            window.history.replaceState(null, "", section.path)
            lastPushedPathRef.current = section.path
          }
        }
      },
      {
        threshold: [0, 0.1, 0.18, 0.25, 0.45, 0.6, 0.8, 1],
      },
    )

    for (const [, element] of elementsRef.current.entries()) {
      observer.observe(element)
    }

    return () => observer.disconnect()
  }, [sections])

  useEffect(() => {
    if (typeof window === "undefined") return
    const handlePopState = () => {
      const path = window.location.pathname.replace(/\/+$/, "") || "/"
      const section = sections.find((s) => s.path === path)
      if (section) {
        scrollToId(section.id, { behavior: "auto" })
        setActiveId(section.id)
        lastPushedPathRef.current = section.path
      }
    }
    window.addEventListener("popstate", handlePopState)
    return () => window.removeEventListener("popstate", handlePopState)
  }, [sections, scrollToId])

  return useMemo(
    () => ({ activeId, register, scrollToId }),
    [activeId, register, scrollToId],
  )
}

export { PILL_OFFSET_PX }
