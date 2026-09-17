import { useEffect, useMemo, useRef, useState } from "react"
import { AnimatePresence, m, useReducedMotion } from "framer-motion"
import { Link } from "react-router-dom"
import { ArrowLeft, ArrowUpRight, Search, X } from "lucide-react"

import type { ArchiveCategory, ArchiveItem, Project } from "@/content/types"
import {
  ARCHIVE_CATEGORY_ORDER,
  ARCHIVE_OPEN_FOLDER_EVENT,
  archiveCategoryFromSlug,
  archiveEntryPath,
  archiveFormatLabel,
  openArchiveFolder,
  type ArchiveOpenFolderDetail,
} from "@/lib/archive-utils"
import { cn } from "@/lib/utils"
import { PixelImage } from "@/components/pixel-image"

import "./archive-folders.css"

const EASE = [0.22, 1, 0.36, 1] as const

type ArchiveFoldersProps = {
  items: ArchiveItem[]
  projects: Project[]
}

type CategoryFolder = {
  category: ArchiveCategory
  items: ArchiveItem[]
  projects: Project[]
  cover?: string
}

export function ArchiveFolders({ items, projects }: ArchiveFoldersProps) {
  const [openCategory, setOpenCategory] = useState<ArchiveCategory | null>(null)
  const [hoverCategory, setHoverCategory] = useState<ArchiveCategory | null>(null)
  const [focusSeries, setFocusSeries] = useState<string | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)

  // Deep links from elsewhere (e.g. the Experiences timeline) open a folder in
  // place, scroll it into view, and highlight the requested series.
  useEffect(() => {
    if (typeof window === "undefined") return

    const focusFolder = (category: ArchiveCategory, series?: string, behavior?: ScrollBehavior) => {
      setOpenCategory(category)
      setFocusSeries(series ?? null)
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          rootRef.current?.scrollIntoView({
            behavior: behavior ?? (window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth"),
            block: "start",
          })
        })
      })
    }

    const handleOpen = (event: Event) => {
      const detail = (event as CustomEvent<ArchiveOpenFolderDetail>).detail
      if (detail?.category) focusFolder(detail.category, detail.series, detail.behavior)
    }

    window.addEventListener(ARCHIVE_OPEN_FOLDER_EVENT, handleOpen)

    // Open a folder from a deep link: /archives/<category> or /archives#<category>.
    const pathSlug = window.location.pathname.match(/\/archives\/([^/]+)\/?$/)?.[1]
    const deepLinkCategory =
      archiveCategoryFromSlug(pathSlug ?? "") ?? archiveCategoryFromSlug(window.location.hash.replace(/^#/, ""))
    if (deepLinkCategory) {
      if (pathSlug) window.history.replaceState(window.history.state, "", `/archives#${pathSlug}`)
      focusFolder(deepLinkCategory)
    }

    return () => window.removeEventListener(ARCHIVE_OPEN_FOLDER_EVENT, handleOpen)
  }, [])

  const folders = useMemo<CategoryFolder[]>(() => {
    return ARCHIVE_CATEGORY_ORDER.map((category) => {
      const categoryItems = items
        .filter((item) => item.category === category)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      const categoryProjects = projects
        .filter((project) => project.category === category && categoryItems.some((item) => item.project === project.slug))
        .sort((a, b) => a.order - b.order)
      return {
        category,
        items: categoryItems,
        projects: categoryProjects,
        cover: categoryItems.find((item) => item.image)?.image ?? categoryProjects.find((project) => project.image)?.image,
      }
    })
  }, [items, projects])

  const openFolder = folders.find((folder) => folder.category === openCategory) ?? null

  return (
    <div ref={rootRef} className="w-full scroll-mt-24">
      <AnimatePresence mode="wait">
        {openFolder ? (
          <FolderView
            key={`${openFolder.category}:${focusSeries || ""}`}
            folder={openFolder}
            focusSeries={focusSeries}
            onBack={() => {
              const category = openFolder.category
              window.history.replaceState(window.history.state, "", "/archives")
              setOpenCategory(null)
              setFocusSeries(null)
              window.setTimeout(() => document.getElementById(category.toLowerCase())?.focus({preventScroll:true}), 360)
            }}
          />
        ) : (
          <m.div
            key="folder-grid"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.28, ease: EASE }}
            className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3"
          >
            {folders.map((folder, index) => (
              <FolderCard
                key={folder.category}
                folder={folder}
                index={index}
                peeking={hoverCategory === folder.category}
                onHoverStart={() => setHoverCategory(folder.category)}
                onHoverEnd={() => setHoverCategory((current) => (current === folder.category ? null : current))}
                onOpen={() => {
                  openArchiveFolder(folder.category)
                }}
              />
            ))}
          </m.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function FolderCard({
  folder,
  index,
  peeking,
  onHoverStart,
  onHoverEnd,
  onOpen,
}: {
  folder: CategoryFolder
  index: number
  peeking: boolean
  onHoverStart: () => void
  onHoverEnd: () => void
  onOpen: () => void
}) {
  const peekItems = folder.items.slice(0, 3)

  return (
    <m.button
      type="button"
      id={folder.category.toLowerCase().replace(/[^a-z0-9]+/g, "-")}
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.5, delay: index * 0.04, ease: EASE }}
      onMouseEnter={onHoverStart}
      onMouseLeave={onHoverEnd}
      onFocus={onHoverStart}
      onBlur={onHoverEnd}
      onClick={onOpen}
      className={cn(
        "group relative min-h-[330px] border-2 bg-[#fffdf0] p-5 text-left outline-none transition-all duration-300",
        "shadow-[5px_5px_0_0_rgba(0,0,0,0.14)] hover:-translate-y-1 hover:border-black hover:shadow-[8px_8px_0_0_rgba(0,0,0,0.82)]",
        "focus-visible:border-black focus-visible:shadow-[8px_8px_0_0_rgba(0,0,0,0.82)]",
        peeking ? "border-black" : "border-black/15",
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-light uppercase tracking-[0.24em] text-black/45">Folder</span>
        <span className="border border-black/20 px-2 py-0.5 text-[10px] font-light text-black/55">
          {folder.items.length} {folder.items.length === 1 ? "file" : "files"}
        </span>
      </div>

      <div className="mt-5 flex items-end justify-center gap-4">
        <PixelFolder open={peeking} thumbnail={folder.cover} />
      </div>

      <p className="mt-5 font-display text-[1.7rem] font-normal leading-none tracking-[-0.035em] text-black/90">
        {folder.category}
      </p>
      <p className="mt-2 text-xs font-light leading-5 text-black/55">
        {folder.projects.length > 0
          ? folder.projects.map((project) => project.title).slice(0, 3).join(" / ")
          : "No files here yet."}
      </p>

      <div className={cn("grid transition-all duration-300", peeking ? "mt-4 grid-rows-[1fr] opacity-100" : "mt-0 grid-rows-[0fr] opacity-0")}>
        <div className="overflow-hidden">
          {peekItems.length > 0 ? (
            <ul className="space-y-1.5 border-t border-black/10 pt-3">
              {peekItems.map((item) => (
                <li key={item.slug} className="flex items-center gap-2 text-[11px] font-light text-black/65">
                  <span className="size-2 shrink-0 border border-black/30 bg-background" aria-hidden="true" />
                  <span className="truncate">{item.title}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="border-t border-black/10 pt-3 font-hand text-xl text-black/45">empty for now</p>
          )}
        </div>
      </div>

      <span className="mt-4 inline-flex items-center gap-1 text-[10px] font-light uppercase tracking-[0.2em] text-black/45 transition group-hover:text-black">
        Open folder
        <ArrowUpRight className="size-3.5" strokeWidth={1.8} />
      </span>
    </m.button>
  )
}

function PixelFolder({ open, thumbnail }: { open: boolean; thumbnail?: string }) {
  return (
    <div className="relative h-[112px] w-[148px]" aria-hidden="true">
      {thumbnail && (
        <div
          className={cn(
            "absolute left-1/2 top-3 h-16 w-24 -translate-x-1/2 overflow-hidden border-2 border-black bg-white transition-transform duration-300",
            open ? "-translate-y-5 rotate-[-2deg]" : "translate-y-0",
          )}
        >
          <PixelImage src={thumbnail} resolution={22} aspect={96 / 64} className="size-full grayscale transition group-hover:grayscale-0" />
        </div>
      )}
      <svg
        viewBox="0 0 56 46"
        width={148}
        height={112}
        shapeRendering="crispEdges"
        className="absolute inset-x-0 bottom-0"
        style={{ imageRendering: "pixelated" }}
      >
        <g stroke="#000" strokeWidth={2} strokeLinejoin="miter">
          <path d="M5 12 V7 H21 L25 12 Z" fill="#a9a48d" />
          <rect x={5} y={12} width={46} height={29} fill="#b3ae98" />
          <g style={{ transform: open ? "translateY(-7px)" : "translateY(0)", transition: "transform 300ms cubic-bezier(0.22, 1, 0.36, 1)" }}>
            <rect x={14} y={16} width={28} height={21} fill="#fffff6" />
            <rect x={20} y={21} width={14} height={2} fill="#c0bca9" stroke="none" />
          </g>
          <path d="M5 19 H51 V41 H5 Z" fill="#c0bca9" />
          <rect x={9} y={37} width={38} height={2} fill="#a9a48d" stroke="none" />
        </g>
      </svg>
    </div>
  )
}

const FOLDER_DESCRIPTIONS: Record<ArchiveCategory, string> = {
  Writings: "Essays, notes, and things I’m figuring out.",
  Vlogumentaries: "Life as it happens, stories as I find them.",
  "Films & Commercials": "Stories made for the screen.",
  Photography: "Places, people, and moments worth keeping.",
  Tools: "Things I’ve built to make other things possible.",
  Miscellaneous: "The experiments that found their own way here.",
}
type FolderFilters = { query: string; collection: string; sort: string }
const DEFAULT_FILTERS: FolderFilters = {query:"", collection:"all", sort:"newest"}

function savedFilters(category: string): FolderFilters {
  try {
    const saved = JSON.parse(sessionStorage.getItem(`archive-filters:${category}`) || "null")
    if (saved && typeof saved.query === "string" && typeof saved.collection === "string" && ["newest", "oldest", "title"].includes(saved.sort)) return saved
  } catch { /* Storage is optional, including in private browsing. */ }
  return DEFAULT_FILTERS
}

function FolderView({ folder, focusSeries, onBack }: {
  folder: CategoryFolder
  focusSeries: string | null
  onBack: () => void
}) {
  const reducedMotion = useReducedMotion()
  const heading = useRef<HTMLHeadingElement>(null)
  const entered = useRef(false)
  const search = useRef<HTMLInputElement>(null)
  const [filters, setFilters] = useState<FolderFilters>(() => ({
    ...savedFilters(folder.category),
    ...(focusSeries ? {collection:focusSeries} : {}),
  }))
  const collections = folder.projects.filter(project => folder.items.some(item => item.project === project.slug))
  const hasLoose = folder.items.some(item => !collections.some(project => project.slug === item.project))
  const collection = collections.some(p => p.slug === filters.collection) || (hasLoose && filters.collection === "loose") ? filters.collection : "all"
  const activeProject = collections.find(p => p.slug === collection)
  const query = filters.query.trim().toLocaleLowerCase()
  const visible = folder.items.filter(item => {
    const inCollection = collection === "all" || (collection === "loose" ? !collections.some(p => p.slug === item.project) : item.project === collection)
    return inCollection && `${item.title} ${item.dek} ${item.summary || ""}`.toLocaleLowerCase().includes(query)
  }).sort((a,b) => filters.sort === "title" ? a.title.localeCompare(b.title) : (new Date(b.date).getTime() - new Date(a.date).getTime()) * (filters.sort === "oldest" ? -1 : 1))
  const update = (change: Partial<FolderFilters>) => setFilters(previous => ({...previous, ...change}))
  useEffect(() => {
    try { sessionStorage.setItem(`archive-filters:${folder.category}`, JSON.stringify(filters)) } catch { /* Optional persistence. */ }
  }, [filters, folder.category])

  return (
    <m.div
      initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
      transition={{duration:reducedMotion ? 0 : .2}}
      onAnimationComplete={() => {
        if (entered.current) return
        entered.current = true
        heading.current?.closest(".archive-library")?.scrollIntoView({block:"start",behavior:"instant"})
        heading.current?.focus({preventScroll:true})
      }}
      className="archive-library"
    >
      <button type="button" onClick={onBack} className="archive-library-back">
        <ArrowLeft size={17} aria-hidden="true" /> All folders
      </button>
      <header className="archive-library-header">
        <h3 ref={heading} tabIndex={-1}>{folder.category}</h3>
        <p>{FOLDER_DESCRIPTIONS[folder.category]}</p>
        {folder.category === "Writings" && <Link to="/writing" className="archive-writing-link">Visit Creative Chaos <ArrowUpRight size={16} aria-hidden="true" /></Link>}
      </header>
      <div className="archive-library-controls">
        <label className="archive-library-search">
          <Search size={19} aria-hidden="true" />
          <span className="sr-only">Search {folder.category.toLowerCase()}</span>
          <input ref={search} type="search" placeholder={folder.category === "Writings" ? "Find a thought…" : "Find something…"} value={filters.query} onChange={e => update({query:e.target.value})} />
        </label>
        <label className="archive-library-sort">Sort by
          <select value={filters.sort} onChange={e => update({sort:e.target.value})}>
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="title">Title A–Z</option>
          </select>
        </label>
      </div>
      {(collections.length > 1 || (collections.length > 0 && hasLoose)) && <div className="archive-library-collections" role="group" aria-label="Filter by collection">
        <button type="button" aria-pressed={collection === "all"} onClick={() => update({collection:"all"})}>All work <span>{folder.items.length}</span></button>
        {collections.map(project => <button key={project.slug} type="button" aria-pressed={collection === project.slug} onClick={() => update({collection:project.slug})}>{project.title}<span>{folder.items.filter(item => item.project === project.slug).length}</span></button>)}
        {hasLoose && <button type="button" aria-pressed={collection === "loose"} onClick={() => update({collection:"loose"})}>Other work</button>}
      </div>}
      {activeProject && <p className="archive-collection-description">{activeProject.summary}</p>}
      <div className="archive-library-results">
        <p role="status">{visible.length} {folder.category === "Writings" ? (visible.length === 1 ? "piece" : "pieces") : (visible.length === 1 ? "entry" : "entries")}{query ? ` matching “${filters.query.trim()}”` : collection !== "all" ? ` in ${activeProject?.title || "Other work"}` : " to explore"}</p>
        {(query || collection !== "all") && <button type="button" onClick={() => {update({query:"",collection:"all"}); search.current?.focus()}}>Clear filters <X size={14} aria-hidden="true" /></button>}
      </div>
      <div className="archive-library-list">
        {visible.map((item, index) => <Link key={item.slug} to={archiveEntryPath(item)} className={cn("archive-library-entry", index === 0 && !query && filters.sort === "newest" && "is-featured")}>
          {item.image && <div className="archive-entry-image"><img src={item.image} alt="" loading="lazy" decoding="async" /></div>}
          <div className="archive-entry-copy">
            <div className="archive-entry-meta"><time dateTime={item.date}>{new Date(item.date).toLocaleDateString("en-US", {month:"short",day:"numeric",year:"numeric",timeZone:"UTC"})}</time><span>{archiveFormatLabel(item.format)}</span></div>
            <h4>{item.title}</h4>
            {(item.dek || item.summary) && <p>{item.dek || item.summary}</p>}
            {collection === "all" && collections.length > 1 && <span className="archive-entry-collection">{collections.find(p => p.slug === item.project)?.title || "Other work"}</span>}
          </div>
          <ArrowUpRight className="archive-entry-arrow" size={20} aria-hidden="true" />
        </Link>)}
      </div>
      {visible.length === 0 && <div className="archive-library-empty">
        <h4>{folder.items.length ? "Nothing here matches yet." : "This folder is still taking shape."}</h4>
        <p>{folder.items.length ? "Try another word or browse all the work in this folder." : "Come back for new work, or explore another folder."}</p>
        <button type="button" onClick={() => {if (!folder.items.length) onBack(); else {setFilters(DEFAULT_FILTERS); search.current?.focus()}}}>{folder.items.length ? "Show all work" : "Explore folders"}</button>
      </div>}
    </m.div>
  )
}
