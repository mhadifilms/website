import type { CSSProperties, MouseEvent } from "react"
import { m, useReducedMotion } from "framer-motion"
import { ChevronDown } from "lucide-react"

import { cn } from "@/lib/utils"

type ScrollWorkCtaProps = {
  variant?: "page" | "mac"
  className?: string
}

const CTA_VARIANTS = {
  page: {
    root: "min-h-14 min-w-36 rounded-full px-8 py-3 text-sm shadow-[0_12px_28px_rgba(0,0,0,0.08)]",
    iconSize: "2rem",
    icon: "size-4",
    gap: "gap-3",
    text: "leading-tight",
    lineShift: "1px",
  },
  mac: {
    root: "h-[8.4%] w-[34%] rounded-full px-[5%] text-[1.35px] shadow-[0_0.5px_1.6px_rgba(0,0,0,0.1)]",
    iconSize: "3.8px",
    icon: "size-[2px]",
    gap: "gap-[1.6px]",
    text: "leading-none",
    lineShift: "0.15px",
  },
} as const

export function ScrollWorkCta({ variant = "page", className }: ScrollWorkCtaProps) {
  const reduced = useReducedMotion()
  const styles = CTA_VARIANTS[variant]

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault()
    window.history.pushState(null, "", "/experiences")
    document.getElementById("experiences")?.scrollIntoView({
      behavior: reduced ? "auto" : "smooth",
      block: "start",
    })
  }

  return (
    <m.a
      href="/experiences"
      aria-label="Scroll to see some of my work"
      whileHover={reduced ? undefined : { y: -1 }}
      whileTap={reduced ? undefined : { scale: 0.985 }}
      onClick={handleClick}
      style={{
        "--scroll-work-icon-size": styles.iconSize,
        "--scroll-work-line-shift": styles.lineShift,
      } as CSSProperties}
      className={cn(
        "scroll-work-cta group pointer-events-auto relative isolate inline-flex items-center justify-center overflow-hidden bg-accent/20 text-black outline-none ring-offset-background transition-colors duration-300 hover:bg-accent/28 focus:bg-accent/28 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4",
        styles.root,
        styles.gap,
        className,
      )}
    >
      <m.span
        aria-hidden="true"
        className="scroll-work-cta-shine absolute inset-y-0 left-0 -z-10 w-1/2 rotate-12 bg-white/60 blur-[1px]"
      />

      <span className={cn("relative flex flex-col items-center justify-center whitespace-nowrap", styles.text)}>
        <span className="scroll-work-cta-line-a font-light italic transition-transform duration-300 ease-out">
          scroll to see
        </span>
        <span className="scroll-work-cta-line-b transition-transform duration-300 ease-out">
          some of my work
        </span>
      </span>

      <span
        aria-hidden="true"
        className={cn(
          "scroll-work-cta-icon-slot grid shrink-0 place-items-center overflow-hidden rounded-full bg-black text-background shadow-[0_4px_12px_rgba(0,0,0,0.18)]",
        )}
      >
        <span className="scroll-work-cta-arrow">
          <ChevronDown className={styles.icon} strokeWidth={1.8} />
        </span>
      </span>
    </m.a>
  )
}
