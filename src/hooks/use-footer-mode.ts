import { useEffect, useState } from "react"

/**
 * Watches window scroll and reports `true` when the user is within `threshold`
 * pixels of the page bottom. Used by the pill nav to morph into a wide footer
 * showing social glyphs + email.
 */
export function useFooterMode(threshold = 120): boolean {
  const [atBottom, setAtBottom] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined") return
    let rafId = 0

    const measure = () => {
      const scrollY = window.scrollY || window.pageYOffset
      const viewport = window.innerHeight || document.documentElement.clientHeight
      const docHeight = Math.max(
        document.body.scrollHeight,
        document.documentElement.scrollHeight,
      )
      const distanceFromBottom = docHeight - (scrollY + viewport)
      setAtBottom(distanceFromBottom <= threshold)
    }

    const onScroll = () => {
      if (rafId) return
      rafId = requestAnimationFrame(() => {
        rafId = 0
        measure()
      })
    }

    measure()
    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", onScroll)
    return () => {
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", onScroll)
      if (rafId) cancelAnimationFrame(rafId)
    }
  }, [threshold])

  return atBottom
}
