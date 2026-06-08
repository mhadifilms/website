import { useState } from "react"
import { AnimatePresence, m } from "framer-motion"
import { ArrowUpRight } from "lucide-react"

import type { Experience } from "@/content/types"
import { cn } from "@/lib/utils"

function formatYear(date?: string) {
  if (!date) return ""
  return new Date(date).getUTCFullYear().toString()
}

function formatDateRange(start: string, end?: string) {
  const startYear = formatYear(start)
  const endYear = end ? formatYear(end) : "Present"
  return `${startYear} \u2014 ${endYear}`
}

type TimelineProps = {
  items: Experience[]
  className?: string
}

export function Timeline({ items, className }: TimelineProps) {
  const [activeSlug, setActiveSlug] = useState(items[0]?.slug ?? "")

  if (items.length === 0) {
    return (
      <p className={cn("mx-auto max-w-md text-center text-sm italic text-muted-foreground", className)}>
        Add experiences in <code className="font-mono text-xs">content/experiences/</code>.
      </p>
    )
  }

  const active = items.find((item) => item.slug === activeSlug) ?? items[0]

  return (
    <div
      className={cn(
        "mx-auto grid w-full max-w-[1120px] gap-8 lg:grid-cols-[260px_minmax(0,1fr)] lg:items-start lg:gap-20",
        className,
      )}
    >
      <div
        role="tablist"
        aria-label="Experiences"
        aria-orientation="vertical"
        className="flex gap-3 overflow-x-auto pb-2 [scrollbar-width:none] lg:flex-col lg:gap-6 lg:overflow-visible lg:pb-0 [&::-webkit-scrollbar]:hidden"
      >
        {items.map((item) => {
          const isActive = item.slug === active.slug
          return (
            <button
              key={item.slug}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls={`experience-panel-${item.slug}`}
              id={`experience-tab-${item.slug}`}
              onClick={() => setActiveSlug(item.slug)}
              className={cn(
                "group relative shrink-0 text-left text-xl font-light leading-none text-black/55 transition outline-none hover:text-black focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-background sm:text-2xl",
                isActive && "font-medium text-black",
              )}
            >
              <span className="block whitespace-nowrap">{item.company}</span>
              <span
                aria-hidden="true"
                className={cn(
                  "mt-2 block h-px bg-black transition-all duration-300",
                  isActive ? "w-full opacity-100" : "w-0 opacity-0 group-hover:w-8 group-hover:opacity-40",
                )}
              />
            </button>
          )
        })}
      </div>

      <AnimatePresence mode="wait">
        <TimelineEntry key={active.slug} item={active} />
      </AnimatePresence>
    </div>
  )
}

type TimelineEntryProps = {
  item: Experience
}

function TimelineEntry({ item }: TimelineEntryProps) {
  return (
    <m.article
      role="tabpanel"
      id={`experience-panel-${item.slug}`}
      aria-labelledby={`experience-tab-${item.slug}`}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
      className="min-h-[360px] border-l border-[#c0bca9]/35 pl-8 text-left sm:pl-10"
    >
      <p className="text-sm font-light uppercase tracking-[0.28em] text-black/45">
        {formatDateRange(item.dateStart, item.dateEnd)}
        {item.location ? ` · ${item.location}` : ""}
      </p>

      <h3 className="mt-5 max-w-[760px] text-balance text-4xl font-light leading-[1.05] tracking-[-0.03em] text-black sm:text-6xl">
        {item.role} <span className="font-display font-normal">{item.company}</span>
      </h3>

      <p className="mt-6 max-w-[680px] text-pretty text-xl font-light leading-[1.32] text-black/75 sm:text-2xl">
        {item.summary}
      </p>

      {item.tags && item.tags.length > 0 && (
        <ul className="mt-8 flex flex-wrap gap-3">
          {item.tags.map((tag) => (
            <li
              key={tag}
              className="rounded-full bg-[#c0bca9]/20 px-4 py-2 text-xs font-light uppercase tracking-[0.2em] text-black/55"
            >
              {tag}
            </li>
          ))}
        </ul>
      )}

      {item.href && (
        <a
          href={item.href}
          target="_blank"
          rel="noreferrer"
          className="mt-8 inline-flex items-center gap-2 text-2xl font-light text-black underline-offset-4 transition hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-background"
        >
          visit
          <ArrowUpRight className="size-5" strokeWidth={1.8} />
        </a>
      )}
    </m.article>
  )
}
