import { useEffect, useRef } from "react"
import { ChevronDown } from "lucide-react"

import type { ArchiveCategory } from "@/content/types"
import { ARCHIVE_CATEGORY_ORDER, archiveCategorySlug, openArchiveFolder } from "@/lib/archive-utils"

const QUICK_LINKS: ArchiveCategory[] = ["Writings", "Photography", "Vlogumentaries", "Tools"]
const LINK_STYLE = "rounded-sm py-2 text-xs font-medium text-black/60 transition-colors hover:text-black focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"

export function ArchiveNav() {
  const menuRef = useRef<HTMLDetailsElement>(null)

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

  const link = (category: ArchiveCategory, className = "") => (
    <a
      key={category}
      href={`/archives#${archiveCategorySlug(category)}`}
      className={`${LINK_STYLE} ${className}`}
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
    <nav
      aria-label="Explore archives"
      className="fixed right-4 top-[calc(0.75rem+env(safe-area-inset-top))] z-50 flex items-center gap-5 rounded-lg bg-background/85 px-3 backdrop-blur-sm sm:right-7 sm:top-5"
    >
      <div className="hidden items-center gap-5 md:flex">
        {QUICK_LINKS.map((category) => link(category))}
      </div>
      <details
        ref={menuRef}
        className="group relative"
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) event.currentTarget.open = false
        }}
      >
        <summary className={`${LINK_STYLE} flex min-h-11 cursor-pointer list-none items-center gap-1.5 [&::-webkit-details-marker]:hidden`}>
          <span className="md:hidden">Explore</span>
          <span className="hidden md:inline">More</span>
          <ChevronDown aria-hidden="true" className="size-3 transition-transform group-open:rotate-180" />
        </summary>
        <div className="absolute right-0 top-full mt-2 flex w-52 flex-col rounded-lg border border-black/10 bg-background p-3 shadow-sm">
          {ARCHIVE_CATEGORY_ORDER.map((category) => link(
            category,
            `px-2 py-3 hover:bg-black/5 ${QUICK_LINKS.includes(category) ? "md:hidden" : ""}`,
          ))}
        </div>
      </details>
    </nav>
  )
}
