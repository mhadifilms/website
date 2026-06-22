import { useEffect, useMemo, useRef, useState } from "react"
import { AnimatePresence, m } from "framer-motion"
import { Link } from "react-router-dom"
import { ArrowLeft, ArrowUpRight } from "lucide-react"

import type { ArchiveCategory, ArchiveItem, Project } from "@/content/types"
import {
  ARCHIVE_CATEGORY_ORDER,
  ARCHIVE_OPEN_FOLDER_EVENT,
  archiveCategoryFromSlug,
  archiveEntryPath,
  type ArchiveOpenFolderDetail,
} from "@/lib/archive-utils"
import { cn } from "@/lib/utils"
import { PixelImage } from "@/components/pixel-image"

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

    const focusFolder = (category: ArchiveCategory, series?: string) => {
      setOpenCategory(category)
      setFocusSeries(series ?? null)
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          rootRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
        })
      })
    }

    const handleOpen = (event: Event) => {
      const detail = (event as CustomEvent<ArchiveOpenFolderDetail>).detail
      if (detail?.category) focusFolder(detail.category, detail.series)
    }

    window.addEventListener(ARCHIVE_OPEN_FOLDER_EVENT, handleOpen)

    // Open a folder from a deep link: /archives/<category> or /archives#<category>.
    const pathSlug = window.location.pathname.match(/\/archives\/([^/]+)\/?$/)?.[1]
    const deepLinkCategory =
      archiveCategoryFromSlug(pathSlug ?? "") ?? archiveCategoryFromSlug(window.location.hash.replace(/^#/, ""))
    if (deepLinkCategory) focusFolder(deepLinkCategory)

    return () => window.removeEventListener(ARCHIVE_OPEN_FOLDER_EVENT, handleOpen)
  }, [])

  useEffect(() => {
    if (!focusSeries) return
    const timeout = window.setTimeout(() => setFocusSeries(null), 2600)
    return () => window.clearTimeout(timeout)
  }, [focusSeries])

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
    }).filter((folder) => folder.items.length > 0)
  }, [items, projects])

  const openFolder = folders.find((folder) => folder.category === openCategory) ?? null

  return (
    <div ref={rootRef} className="w-full scroll-mt-24">
      <AnimatePresence mode="wait">
        {openFolder ? (
          <FolderView
            key={openFolder.category}
            folder={openFolder}
            focusSeries={focusSeries}
            onBack={() => {
              setOpenCategory(null)
              setFocusSeries(null)
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
                  setOpenCategory(folder.category)
                  setFocusSeries(null)
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

function FolderView({
  folder,
  focusSeries,
  onBack,
}: {
  folder: CategoryFolder
  focusSeries: string | null
  onBack: () => void
}) {
  const grouped = folder.projects
    .map((project) => ({
      project,
      items: folder.items.filter((item) => item.project === project.slug),
    }))
    .filter((group) => group.items.length > 0)
  const ungrouped = folder.items.filter((item) => !item.project || !folder.projects.some((project) => project.slug === item.project))

  const focusRef = useRef<HTMLElement>(null)
  useEffect(() => {
    if (!focusSeries || !focusRef.current) return
    const timeout = window.setTimeout(() => {
      focusRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })
    }, 360)
    return () => window.clearTimeout(timeout)
  }, [focusSeries])

  return (
    <m.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.32, ease: EASE }}
      className="mx-auto w-full max-w-[1180px]"
    >
      <button
        type="button"
        onClick={onBack}
        className="mb-5 inline-flex items-center gap-2 text-xs font-light uppercase tracking-[0.2em] text-black/45 transition hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-background"
      >
        <ArrowLeft className="size-4" strokeWidth={1.6} />
        Back to folders
      </button>

      <div className="overflow-hidden border-2 border-black bg-[#fffdf0] shadow-[8px_8px_0_0_rgba(0,0,0,0.18)]">
        <header className="border-b-2 border-black px-5 py-5 sm:px-7">
          <p className="text-[10px] font-light uppercase tracking-[0.24em] text-black/45">{folder.items.length} files</p>
          <h3 className="mt-1 break-words font-display text-[clamp(2.15rem,7vw,3.25rem)] font-normal leading-none tracking-[-0.045em] text-black/90">
            {folder.category}
          </h3>
          <p className="mt-2 max-w-[42rem] break-words text-xs font-light leading-5 text-black/55">
            Subfolders separate the experiments inside this format.
          </p>
        </header>

        <div className="p-5 sm:p-7">
          <div className="grid min-w-0 gap-5 lg:grid-cols-2">
            {[...grouped, ...(ungrouped.length > 0 ? [{ project: undefined, items: ungrouped }] : [])].map((group) => {
              const isFocused = Boolean(group.project && focusSeries === group.project.slug)
              return (
              <section
                key={group.project?.slug ?? "ungrouped"}
                ref={isFocused ? focusRef : undefined}
                className={cn(
                  "min-w-0 overflow-hidden border bg-white/25 p-4 transition-all duration-500",
                  isFocused
                    ? "border-black bg-white/55 shadow-[5px_5px_0_0_rgba(0,0,0,0.82)]"
                    : "border-black/10",
                )}
              >
                <p className="break-words font-display text-[clamp(1.35rem,6vw,1.5rem)] font-normal tracking-[-0.035em] text-black/85">
                  {group.project?.title ?? "Loose Files"}
                </p>
                {group.project?.summary && (
                  <p className="mt-2 line-clamp-3 break-words text-xs font-light leading-5 text-black/55">
                    {group.project.summary}
                  </p>
                )}
                <div className="mt-4 space-y-2">
                  {group.items.map((item) => (
                    <Link
                      key={item.slug}
                      to={archiveEntryPath(item)}
                      className="group/file flex gap-3 border-2 border-black/10 bg-[#fffff6] p-2.5 transition hover:-translate-y-0.5 hover:border-black hover:shadow-[3px_3px_0_0_rgba(0,0,0,0.82)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-background"
                    >
                      <div className="h-14 w-20 shrink-0 overflow-hidden border border-black/15 bg-[#d9d9d9]">
                        {item.image ? <img src={item.image} alt="" loading="lazy" decoding="async" className="size-full object-cover grayscale transition group-hover/file:grayscale-0" /> : null}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-2 break-words text-sm font-light leading-5 text-black/80">{item.title}</p>
                        <p className="mt-1 text-[9px] font-light uppercase tracking-[0.16em] text-black/40">
                          {item.platform} / {item.entryType} / {new Date(item.date).getFullYear()}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
              )
            })}
          </div>
        </div>
      </div>
    </m.div>
  )
}
