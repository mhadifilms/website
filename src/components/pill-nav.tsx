import { useCallback, useEffect, useRef, useState } from "react"
import { m } from "framer-motion"

import { useSectionContext } from "@/hooks/section-context"
import { cn } from "@/lib/utils"

const PILL_TRANSITION = { type: "spring", stiffness: 220, damping: 28, mass: 0.7 } as const

export function PillNav() {
  const ctx = useSectionContext()
  const linksRef = useRef<Array<HTMLAnchorElement | null>>([])
  const [hasEnteredMac, setHasEnteredMac] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined") return

    const updateVisibility = () => {
      setHasEnteredMac(window.scrollY > window.innerHeight * 0.55)
    }

    updateVisibility()
    window.addEventListener("scroll", updateVisibility, { passive: true })
    window.addEventListener("resize", updateVisibility)
    return () => {
      window.removeEventListener("scroll", updateVisibility)
      window.removeEventListener("resize", updateVisibility)
    }
  }, [])

  const handleKey = useCallback(
    (event: React.KeyboardEvent<HTMLAnchorElement>, currentIndex: number) => {
      if (!ctx) return
      const links = linksRef.current.filter(Boolean) as HTMLAnchorElement[]
      if (links.length === 0) return
      const last = links.length - 1
      let nextIndex: number | null = null
      if (event.key === "ArrowRight" || event.key === "ArrowDown") nextIndex = currentIndex === last ? 0 : currentIndex + 1
      else if (event.key === "ArrowLeft" || event.key === "ArrowUp") nextIndex = currentIndex === 0 ? last : currentIndex - 1
      else if (event.key === "Home") nextIndex = 0
      else if (event.key === "End") nextIndex = last
      if (nextIndex === null) return
      event.preventDefault()
      links[nextIndex].focus()
    },
    [ctx],
  )

  if (!ctx) return null
  const { sections, activeId, scrollToId } = ctx
  const activeIndex = Math.max(
    sections.findIndex((section) => section.id === activeId),
    0,
  )

  return (
    <m.div
      initial={false}
      animate={hasEnteredMac ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      className="pointer-events-none fixed inset-x-0 bottom-5 z-40 flex justify-center px-3 sm:bottom-7"
      aria-hidden={!hasEnteredMac}
    >
      <m.nav
        layout
        aria-label="Sections"
        transition={PILL_TRANSITION}
        className="pointer-events-auto flex h-11 w-full max-w-[420px] items-center rounded-full border border-black/10 bg-white/60 p-1 shadow-pill backdrop-blur-md sm:h-12"
      >
        <div className="relative grid h-full w-full grid-cols-4">
          <m.span
            aria-hidden="true"
            animate={{ x: `${activeIndex * 100}%` }}
            transition={{ type: "spring", stiffness: 260, damping: 34, mass: 0.8 }}
            className="pointer-events-none absolute inset-y-0 left-0 z-0 w-1/4 rounded-full bg-white shadow-[5px_0_30px_rgba(0,0,0,0.15)]"
          />
          {sections.map((section, index) => {
            const isActive = section.id === activeId
            return (
              <m.a
                key={section.id}
                ref={(node) => {
                  linksRef.current[index] = node
                }}
                href={section.path}
                animate={{ color: isActive ? "#000000" : "rgba(0,0,0,0.58)" }}
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                aria-current={isActive ? "page" : undefined}
                onClick={(event) => {
                  event.preventDefault()
                  scrollToId(section.id)
                }}
                onKeyDown={(event) => handleKey(event, index)}
                className={cn(
                  "relative z-10 flex h-9 items-center justify-center rounded-full px-2 text-[13px] font-light outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:h-10 sm:text-sm",
                )}
              >
                <span className="relative">{section.label}</span>
              </m.a>
            )
          })}
        </div>
      </m.nav>
    </m.div>
  )
}
