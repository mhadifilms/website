import { useEffect, useState } from "react"

export const NAV_REVEAL_TRANSITION = { duration: 0.22, ease: [0.22, 1, 0.36, 1] } as const

export function useNavReveal(gated: boolean) {
  const [hasEnteredMac, setHasEnteredMac] = useState(false)
  const [hasFocusWithin, setHasFocusWithin] = useState(false)

  useEffect(() => {
    if (!gated) return

    const updateVisibility = () => {
      const viewportHeight = document.documentElement.clientHeight || window.innerHeight
      const next = window.scrollY > viewportHeight * 0.55
      setHasEnteredMac((current) => (current === next ? current : next))
    }

    updateVisibility()
    window.addEventListener("scroll", updateVisibility, { passive: true })
    window.addEventListener("resize", updateVisibility)
    return () => {
      window.removeEventListener("scroll", updateVisibility)
      window.removeEventListener("resize", updateVisibility)
    }
  }, [gated])

  return { visible: !gated || hasEnteredMac || hasFocusWithin, setHasFocusWithin }
}
