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
        className="pointer-events-auto flex h-11 w-full max-w-[420px] items-center rounded-full bg-[#dddddd]/95 p-1 shadow-pill backdrop-blur-sm sm:h-12"
      >
        <div className="grid w-full grid-cols-4">
          {sections.map((section, index) => {
            const isActive = section.id === activeId
            return (
              <m.a
                key={section.id}
                ref={(node) => {
                  linksRef.current[index] = node
                }}
                href={section.path}
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
                aria-current={isActive ? "page" : undefined}
                onClick={(event) => {
                  event.preventDefault()
                  scrollToId(section.id)
                }}
                onKeyDown={(event) => handleKey(event, index)}
                className={cn(
                  "relative isolate flex h-9 items-center justify-center rounded-full px-2 text-[13px] font-light text-black/60 transition-colors duration-200 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:h-10 sm:text-sm",
                  isActive && "font-normal text-black",
                )}
              >
                {isActive && (
                  <m.span
                    layoutId="pill-indicator"
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                    className="absolute inset-0 -z-10 rounded-full bg-white shadow-[5px_0_30px_rgba(0,0,0,0.15)]"
                  />
                )}
                <span className="relative">{section.label}</span>
              </m.a>
            )
          })}
        </div>
      </m.nav>
    </m.div>
  )
}
