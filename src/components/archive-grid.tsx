import { AnimatePresence, m } from "framer-motion"
import { ArrowUpRight } from "lucide-react"

import type { ArchiveItem, Project } from "@/content/types"
import { cn } from "@/lib/utils"

const CARD_TRANSITION = { type: "spring", stiffness: 340, damping: 28, mass: 0.7 } as const

type ArchiveGridProps = {
  items: ArchiveItem[]
  categoryKey: string
  projects: Map<string, Project>
  className?: string
}

export function ArchiveGrid({ items, categoryKey, projects, className }: ArchiveGridProps) {
  const isSingle = items.length <= 1
  const categoryId = categoryKey.replace(/\s+/g, "-").toLowerCase()
  const panelId = `archive-panel-${categoryId}`
  const tabId = `archive-tab-${categoryId}`

  return (
    <div
      className={cn("relative w-full", className)}
      role="tabpanel"
      id={panelId}
      aria-labelledby={tabId}
    >
      <AnimatePresence mode="wait">
        <m.ul
          key={categoryKey}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className={cn(
            "grid gap-5 lg:gap-[34px]",
            isSingle && "mx-auto w-full max-w-[520px] grid-cols-1",
            !isSingle && "grid-cols-1 sm:grid-cols-2 xl:grid-cols-3",
          )}
        >
          {items.map((item, index) => (
            <ArchiveCard
              key={`${categoryKey}-${item.slug}`}
              item={item}
              project={item.project ? projects.get(item.project) : undefined}
              index={index}
            />
          ))}
        </m.ul>
      </AnimatePresence>
    </div>
  )
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
        "relative flex h-full min-h-[420px] w-full transform-gpu flex-col overflow-hidden border border-black/10 bg-white/35",
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
        <div className="flex flex-1 flex-col p-5 text-black">
          <div className="flex flex-wrap items-center gap-2 text-[10px] font-light uppercase tracking-[0.22em] text-black/45">
            <span>{item.platform}</span>
            <span aria-hidden="true">/</span>
            <span>{new Date(item.date).toLocaleDateString("en", { month: "short", year: "numeric" })}</span>
          </div>
          <p className="mt-3 text-2xl font-light leading-tight tracking-[-0.025em]">{item.title}</p>
          {item.summary && (
            <p className="mt-3 line-clamp-3 text-sm font-light leading-6 text-black/60">
              {item.summary}
            </p>
          )}
          {project && (
            <span className="mt-auto inline-flex pt-5 text-xs font-light uppercase tracking-[0.18em] text-black/45">
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
          Project
          <ArrowUpRight className="size-3.5" strokeWidth={1.8} />
        </a>
      )}
    </li>
  )
}
