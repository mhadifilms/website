import { useMemo, useState } from "react"
import { AnimatePresence, m } from "framer-motion"
import { ArrowLeft, ArrowRight, ArrowUpRight } from "lucide-react"

import type { ArchiveItem, Project } from "@/content/types"
import { cn } from "@/lib/utils"

const CARD_TRANSITION = { type: "spring", stiffness: 340, damping: 28, mass: 0.7 } as const
const PAGE_SIZE = 4
const PAGINATION_RADIUS = 1

type ArchiveGridProps = {
  items: ArchiveItem[]
  categoryKey: string
  projects: Map<string, Project>
  className?: string
}

export function ArchiveGrid({ items, categoryKey, projects, className }: ArchiveGridProps) {
  const [selectedPage, setSelectedPage] = useState(1)
  const pageCount = Math.max(1, Math.ceil(items.length / PAGE_SIZE))
  const page = Math.min(selectedPage, pageCount)
  const visibleItems = useMemo(() => items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [items, page])
  const pageItems = useMemo(() => paginationItems(page, pageCount), [page, pageCount])
  const isSingle = visibleItems.length <= 1
  const categoryId = categoryKey.replace(/\s+/g, "-").toLowerCase()
  const panelId = `archive-panel-${categoryId}`
  const tabId = `archive-tab-${categoryId}`
  const hasPagination = pageCount > 1

  return (
    <div
      className={cn("relative w-full", className)}
      role="tabpanel"
      id={panelId}
      aria-labelledby={tabId}
    >
      {items.length > 0 ? (
        <AnimatePresence mode="wait">
          <m.ul
            key={`${categoryKey}-${page}`}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
              "grid gap-4 lg:gap-5",
              isSingle && "mx-auto w-full max-w-[440px] grid-cols-1",
              !isSingle && "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
            )}
          >
            {visibleItems.map((item, index) => (
              <ArchiveCard
                key={`${categoryKey}-${item.slug}`}
                item={item}
                project={item.project ? projects.get(item.project) : undefined}
                index={index}
              />
            ))}
          </m.ul>
        </AnimatePresence>
      ) : (
        <m.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto flex min-h-[280px] w-full max-w-[560px] flex-col items-center justify-center border border-black/10 bg-white/30 px-8 text-center"
        >
          <p className="font-display text-3xl font-normal tracking-[-0.04em] text-black/80">Nothing here yet.</p>
          <p className="mt-3 max-w-[34rem] text-sm font-light leading-6 text-black/55">
            Try a different search, sort, or archive category.
          </p>
        </m.div>
      )}

      {hasPagination && (
        <nav
          className="mt-8 flex items-center justify-center"
          aria-label={`${categoryKey} archive pages`}
        >
          <div className="inline-flex items-center gap-1 rounded-full border border-black/10 bg-white/40 p-1 shadow-[0_18px_50px_rgba(0,0,0,0.06)] backdrop-blur">
            <button
              type="button"
              onClick={() => setSelectedPage((current) => Math.max(1, current - 1))}
              disabled={page === 1}
              aria-label="Go to previous archive page"
              className="inline-flex size-9 items-center justify-center rounded-full text-black/55 transition hover:bg-black hover:text-background disabled:pointer-events-none disabled:opacity-25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-background"
            >
              <ArrowLeft className="size-4" strokeWidth={1.6} />
            </button>

            <div className="flex items-center gap-1 px-1">
              {pageItems.map((item, index) =>
                item === "ellipsis" ? (
                  <span
                    key={`ellipsis-${index}`}
                    className="inline-flex size-9 items-center justify-center text-xs font-light text-black/30"
                    aria-hidden="true"
                  >
                    ...
                  </span>
                ) : (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setSelectedPage(item)}
                    aria-label={`Go to archive page ${item}`}
                    aria-current={item === page ? "page" : undefined}
                    className={cn(
                      "inline-flex size-9 items-center justify-center rounded-full text-xs font-light transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-background",
                      item === page
                        ? "bg-black text-background shadow-[0_10px_24px_rgba(0,0,0,0.18)]"
                        : "text-black/55 hover:bg-black/5 hover:text-black",
                    )}
                  >
                    {item}
                  </button>
                ),
              )}
            </div>

          <button
            type="button"
            onClick={() => setSelectedPage((current) => Math.min(pageCount, current + 1))}
            disabled={page === pageCount}
            aria-label="Go to next archive page"
            className="inline-flex size-9 items-center justify-center rounded-full text-black/55 transition hover:bg-black hover:text-background disabled:pointer-events-none disabled:opacity-25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-background"
          >
            <ArrowRight className="size-4" strokeWidth={1.6} />
          </button>
          </div>
        </nav>
      )}
    </div>
  )
}

function paginationItems(currentPage: number, pageCount: number) {
  if (pageCount <= 7) return Array.from({ length: pageCount }, (_, index) => index + 1)

  const items: Array<number | "ellipsis"> = [1]
  const start = Math.max(2, currentPage - PAGINATION_RADIUS)
  const end = Math.min(pageCount - 1, currentPage + PAGINATION_RADIUS)

  if (start > 2) items.push("ellipsis")
  for (let page = start; page <= end; page += 1) items.push(page)
  if (end < pageCount - 1) items.push("ellipsis")
  items.push(pageCount)

  return items
}

type ArchiveCardProps = {
  item: ArchiveItem
  project?: Project
  index: number
}

function ArchiveCard({ item, project, index }: ArchiveCardProps) {
  const isPlaceholder = !item.title
  const inner = (
    <m.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={!isPlaceholder ? { y: -6, rotate: index % 2 === 0 ? -0.35 : 0.35, scale: 1.01 } : undefined}
      whileTap={!isPlaceholder ? { scale: 0.985 } : undefined}
      transition={CARD_TRANSITION}
      className={cn(
        "relative flex h-full min-h-[340px] w-full transform-gpu flex-col overflow-hidden border border-black/10 bg-white/35",
        !isPlaceholder && "transition-shadow",
      )}
    >
      <div className="aspect-video w-full overflow-hidden bg-[#d9d9d9]">
        {item.image ? (
          <img
            src={item.image}
            alt={item.title}
            loading="lazy"
            decoding="async"
            className="block size-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.045]"
          />
        ) : (
          <div className="size-full bg-[#d9d9d9]" />
        )}
      </div>

      {!isPlaceholder && item.title && (
        <div className="flex flex-1 flex-col p-4 text-black">
          <div className="flex flex-wrap items-center gap-2 text-[10px] font-light uppercase tracking-[0.22em] text-black/45">
            <span>{item.platform}</span>
            <span aria-hidden="true">/</span>
            <span>{item.entryType}</span>
            <span aria-hidden="true">/</span>
            <span>{new Date(item.date).toLocaleDateString("en", { month: "short", year: "numeric" })}</span>
            {item.featured && (
              <>
                <span aria-hidden="true">/</span>
                <span>Featured</span>
              </>
            )}
          </div>
          <p className="mt-3 text-[1.12rem] font-light leading-tight tracking-[-0.035em] text-black/85">{item.title}</p>
          {item.summary && (
            <p className="mt-2 line-clamp-2 text-xs font-light leading-5 text-black/60">
              {item.summary}
            </p>
          )}
          {project && (
            <span className="mt-auto inline-flex pt-4 text-[10px] font-light uppercase tracking-[0.18em] text-black/45">
              {project.title}
            </span>
          )}
        </div>
      )}
    </m.div>
  )

  return (
    <li className={cn(isPlaceholder && "opacity-60")}>
      {!isPlaceholder && item.href ? (
        <a
          href={item.href}
          target="_blank"
          rel="noreferrer"
          aria-label={`${item.title} on ${item.platform}`}
          className="group block h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-background"
        >
          {inner}
          <span className="sr-only">Open external archive item</span>
        </a>
      ) : (
        inner
      )}
      {project?.href && (
        <a
          href={project.href}
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-flex items-center gap-1 text-xs font-light uppercase tracking-[0.18em] text-black/45 transition hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-background"
        >
          {project.title}
          <ArrowUpRight className="size-3.5" strokeWidth={1.8} />
        </a>
      )}
    </li>
  )
}
