import { useEffect, useRef } from "react"
import { m } from "framer-motion"

import type { ArchiveCategory } from "@/content/types"
import { useSectionContext } from "@/hooks/section-context"
import { NAV_REVEAL_TRANSITION, useNavReveal } from "@/hooks/use-nav-reveal"
import { ARCHIVE_CATEGORY_ORDER, archiveCategorySlug, openArchiveFolder } from "@/lib/archive-utils"

const LINK_STYLE = "block px-4 py-3 text-[13px] font-medium text-black/75 hover:bg-black hover:text-background focus-visible:bg-black focus-visible:text-background focus-visible:outline-none"

export function ArchiveNav() {
  const menuRef = useRef<HTMLDetailsElement>(null)
  const ctx = useSectionContext()
  const { visible, setHasFocusWithin } = useNavReveal(Boolean(ctx))

  useEffect(() => {
    const closeOutside = (event: PointerEvent) => {
      const menu = menuRef.current
      if (menu && !menu.contains(event.target as Node)) menu.open = false
    }
    const closeOnEscape = (event: KeyboardEvent) => {
      const menu = menuRef.current
      if (event.key === "Escape" && menu?.open) {
        menu.open = false
        menu.querySelector("summary")?.focus()
      }
    }
    document.addEventListener("pointerdown", closeOutside)
    document.addEventListener("keydown", closeOnEscape)
    return () => {
      document.removeEventListener("pointerdown", closeOutside)
      document.removeEventListener("keydown", closeOnEscape)
    }
  }, [])

  const link = (category: ArchiveCategory) => (
    <a
      key={category}
      href={`/archives#${archiveCategorySlug(category)}`}
      className={LINK_STYLE}
      onClick={(event) => {
        if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
        event.preventDefault()
        if (menuRef.current?.open) {
          menuRef.current.open = false
          menuRef.current.querySelector("summary")?.focus()
        }
        openArchiveFolder(category, undefined, "instant")
      }}
    >
      {category}
    </a>
  )

  return (
    <m.nav
      aria-label="Archives"
      initial={false}
      animate={visible ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
      transition={NAV_REVEAL_TRANSITION}
      style={{ pointerEvents: visible ? "auto" : "none" }}
      onFocus={() => setHasFocusWithin(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setHasFocusWithin(false)
      }}
      className="fixed right-4 top-[calc(0.75rem+env(safe-area-inset-top))] z-50 sm:right-7 sm:top-5"
    >
      <details
        ref={menuRef}
        className="group relative"
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) event.currentTarget.open = false
        }}
      >
        <summary
          aria-label="Open archive menu"
          title="Archives"
          className="flex size-11 cursor-pointer list-none items-center justify-center text-black/55 transition-colors hover:text-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring group-open:text-black [&::-webkit-details-marker]:hidden"
        >
          <svg aria-hidden="true" viewBox="0 0 24 20" className="h-5 w-6" fill="none" shapeRendering="crispEdges">
            <path d="M2 6V3H9L12 6H22V17H2Z" fill="var(--color-background)" stroke="currentColor" strokeWidth="1.5" />
            <path d="M2 8H22" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </summary>
        <div className="absolute right-0 top-full mt-1 w-56 border border-black/70 bg-background shadow-[3px_3px_0_rgba(0,0,0,0.18)]">
          <div aria-hidden="true" className="flex h-7 items-center gap-2 border-b border-black/60 px-2">
            <span className="h-2 flex-1 border-y border-black/20" />
            <span className="text-[10px] text-black/55">Archives</span>
            <span className="h-2 flex-1 border-y border-black/20" />
          </div>
          <div className="py-1">{ARCHIVE_CATEGORY_ORDER.map(link)}</div>
        </div>
      </details>
    </m.nav>
  )
}
