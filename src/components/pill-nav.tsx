import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { m } from "framer-motion"

import { useSectionContext } from "@/hooks/section-context"
import { buildSections } from "@/hooks/use-section-router"
import { cn } from "@/lib/utils"

const PILL_TRANSITION = { type: "spring", stiffness: 220, damping: 28, mass: 0.7 } as const
const MOBILE_LABELS: Record<string, string> = {
  experiences: "Work",
  archives: "Archive",
}

const STANDALONE_SECTIONS = buildSections([
  { id: "home", slug: "", label: "Home" },
  { id: "about", slug: "about", label: "About" },
  { id: "experiences", slug: "experiences", label: "Experiences" },
  { id: "archives", slug: "archives", label: "Archives" },
])

export function PillNav() {
  const ctx = useSectionContext()
  const navigate = useNavigate()
  const location = useLocation()
  const linksRef = useRef<Array<HTMLAnchorElement | null>>([])
  const [hasEnteredMac, setHasEnteredMac] = useState(false)
  const [hasFocusWithin, setHasFocusWithin] = useState(false)

  // On the main page the nav stays out of the way until the hero scroll scene
  // is underway. Standalone pages (archive entries) always show it.
  const gated = Boolean(ctx)

  useEffect(() => {
    if (!gated || typeof window === "undefined") return

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

  const sections = ctx?.sections ?? STANDALONE_SECTIONS
  const standaloneActiveId = useMemo(() => {
    const first = location.pathname.split("/").filter(Boolean)[0] ?? ""
    const match = STANDALONE_SECTIONS.find((section) => section.slug === first)
    return match?.id ?? "home"
  }, [location.pathname])
  const activeId = ctx?.activeId ?? standaloneActiveId

  const handleKey = useCallback(
    (event: React.KeyboardEvent<HTMLAnchorElement>, currentIndex: number) => {
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
    [],
  )

  // Visible when past the hero, or whenever a link inside holds focus so
  // keyboard users always see where they are.
  const visible = !gated || hasEnteredMac || hasFocusWithin
  const activeIndex = Math.max(
    sections.findIndex((section) => section.id === activeId),
    0,
  )

  return (
    <m.div
      initial={false}
      animate={visible ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      onFocus={() => setHasFocusWithin(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setHasFocusWithin(false)
      }}
      className="pointer-events-none fixed inset-x-0 bottom-[calc(0.75rem+env(safe-area-inset-bottom))] z-40 flex justify-center px-2 sm:bottom-7 sm:px-3"
    >
      <m.nav
        layout
        aria-label="Sections"
        transition={PILL_TRANSITION}
        className={cn(
          "flex h-12 w-[calc(100vw-1rem)] max-w-[420px] items-center overflow-hidden rounded-full border border-black/10 bg-white/75 p-1.5 shadow-pill backdrop-blur-md sm:w-full sm:bg-white/60 sm:p-1",
          visible ? "pointer-events-auto" : "pointer-events-none",
        )}
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
            const mobileLabel = MOBILE_LABELS[section.id] ?? section.label
            const hasMobileLabel = mobileLabel !== section.label
            return (
              <m.a
                key={section.id}
                ref={(node) => {
                  linksRef.current[index] = node
                }}
                href={section.path}
                aria-label={section.label}
                animate={{ color: isActive ? "#000000" : "rgba(0,0,0,0.58)" }}
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                aria-current={isActive ? "page" : undefined}
                onClick={(event) => {
                  event.preventDefault()
                  if (ctx) {
                    ctx.scrollToId(section.id)
                  } else {
                    navigate(section.path)
                  }
                }}
                onKeyDown={(event) => handleKey(event, index)}
                className={cn(
                  "relative z-10 flex h-9 min-w-0 items-center justify-center rounded-full px-1 text-[11px] font-normal outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background min-[380px]:text-xs sm:h-10 sm:px-2 sm:text-sm",
                )}
              >
                <span className="relative block min-w-0 truncate">
                  {hasMobileLabel ? (
                    <>
                      <span className="min-[390px]:hidden">{mobileLabel}</span>
                      <span className="hidden min-[390px]:inline">{section.label}</span>
                    </>
                  ) : (
                    section.label
                  )}
                </span>
              </m.a>
            )
          })}
        </div>
      </m.nav>
    </m.div>
  )
}
