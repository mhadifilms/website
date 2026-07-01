import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useLocation } from "react-router-dom"

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

function currentBrowserPath(fallback: string) {
  const path = typeof window === "undefined" ? fallback : window.location.pathname
  return path.replace(/\/+$/, "") || "/"
}

const BOOT_BROWSER_PATH = currentBrowserPath("/")

function scrollElementToTop(element: HTMLElement, behavior: ScrollBehavior) {
  const top = window.scrollY + element.getBoundingClientRect().top
  window.scrollTo({ top: Math.max(0, top), behavior })
}

export function useSectionRouter(sections: SectionDescriptor[]): SectionRouterState {
  const location = useLocation()
  const elementsRef = useRef<Map<string, HTMLElement>>(new Map())
  const [activeId, setActiveId] = useState<string>(sections[0]?.id ?? "")
  const lastPushedPathRef = useRef<string>("")
  const passivePathRef = useRef<string>("")
  const initialBrowserPath = sections.some((section) => section.path === BOOT_BROWSER_PATH)
    ? BOOT_BROWSER_PATH
    : currentBrowserPath(location.pathname)
  const initialBrowserPathRef = useRef(initialBrowserPath)
  const pendingRoutePathRef = useRef(initialBrowserPath)
  const suppressObserverUntilRef = useRef(0)
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
      scrollElementToTop(element, behavior)
    },
    [],
  )

  useEffect(() => {
    const initialPath = pendingRoutePathRef.current || currentBrowserPath(location.pathname)
    const passivePath = passivePathRef.current.replace(/#.*$/, "")
    if (passivePath === initialPath) {
      passivePathRef.current = ""
      return
    }

    const match = sections.find((section) => section.path === initialPath)
    const targetId = match?.id ?? sections[0]?.id
    if (!targetId) return
    const targetPath = match?.path ?? "/"
    const currentTarget = elementsRef.current.get(targetId)
    if (
      initialScrollDoneRef.current &&
      lastPushedPathRef.current === targetPath &&
      currentTarget &&
      Math.abs(currentTarget.getBoundingClientRect().top) < 2
    ) {
      return
    }

    pendingRoutePathRef.current = targetPath
    initialScrollDoneRef.current = false
    let cancelled = false

    const finishRouteScroll = () => {
      setActiveId(targetId)
      lastPushedPathRef.current = targetPath
      pendingRoutePathRef.current = ""
      suppressObserverUntilRef.current = performance.now() + 500
      initialScrollDoneRef.current = true
    }

    const tryScroll = (attempt = 0) => {
      if (cancelled) return
      const element = elementsRef.current.get(targetId)
      if (!element) {
        requestAnimationFrame(() => tryScroll(attempt))
        return
      }
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (cancelled) return
          scrollElementToTop(element, "auto")
          requestAnimationFrame(() => {
            if (cancelled) return
            const remainingTop = Math.abs(element.getBoundingClientRect().top)
            if (remainingTop > 2 && attempt < 45) {
              requestAnimationFrame(() => tryScroll(attempt + 1))
              return
            }
            finishRouteScroll()
          })
        })
      })
    }
    tryScroll()
    return () => {
      cancelled = true
    }
  }, [sections, location.pathname])

  useEffect(() => {
    if (typeof window === "undefined") return

    const ratios = new Map<string, number>()

    const observer = new IntersectionObserver(
      (entries) => {
        if (pendingRoutePathRef.current) return
        if (performance.now() < suppressObserverUntilRef.current) return
        if (initialBrowserPathRef.current !== "/" && lastPushedPathRef.current !== initialBrowserPathRef.current) return
        if (!initialScrollDoneRef.current) return

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
          if (section) {
            const path = section.id === "experiences" && window.location.hash ? `${section.path}${window.location.hash}` : section.path
            if (path !== lastPushedPathRef.current) {
              passivePathRef.current = path
              window.history.replaceState(null, "", path)
              lastPushedPathRef.current = path
            }
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
