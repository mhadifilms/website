import type { RefObject } from "react"
import { useScroll, useTransform, type MotionValue } from "framer-motion"

type SectionMotion = {
  /** Progress of the section moving through the viewport (0 → 1). */
  progress: MotionValue<number>
  /** 0 while section is in view, ramps to 1 as the section scrolls past. */
  exit: MotionValue<number>
  /** 1 while the section is comfortably in view, fades toward 0 on exit. */
  opacity: MotionValue<number>
  /** Slight downscale on exit to give a "collapsing" feel. */
  scale: MotionValue<number>
  /** Drift the content slightly upward as the section exits. */
  translateY: MotionValue<number>
}

function prefersReducedMotion() {
  if (typeof window === "undefined") return false
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

/**
 * Drives a subtle scroll-driven "collapse" animation for a full-viewport
 * section. While the section sits in view the content is at rest; as the
 * section scrolls upward past the viewport top the content compresses and
 * fades, so consecutive sections feel like they hand off smoothly rather
 * than abruptly cutting over.
 */
export function useSectionMotion(targetRef: RefObject<HTMLElement | null>): SectionMotion {
  const { scrollYProgress: progress } = useScroll({
    target: targetRef,
    offset: ["start start", "end start"],
  })

  const reduced = prefersReducedMotion()

  const exit = useTransform(progress, [0.6, 1], reduced ? [0, 0] : [0, 1])
  const opacity = useTransform(progress, [0.6, 0.95], reduced ? [1, 1] : [1, 0])
  const scale = useTransform(progress, [0.6, 1], reduced ? [1, 1] : [1, 0.92])
  const translateY = useTransform(progress, [0.6, 1], reduced ? [0, 0] : [0, -32])

  return { progress, exit, opacity, scale, translateY }
}
