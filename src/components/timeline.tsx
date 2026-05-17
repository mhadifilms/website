import { m } from "framer-motion"
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
  if (items.length === 0) {
    return (
      <p className={cn("mx-auto max-w-md text-center text-sm italic text-muted-foreground", className)}>
        Add experiences in <code className="font-mono text-xs">content/experiences/</code>.
      </p>
    )
  }

  return (
    <ol
      className={cn(
        "relative mx-auto w-full max-w-3xl",
        "before:absolute before:bottom-2 before:left-[7px] before:top-2 before:w-px before:bg-border sm:before:left-[11px]",
        className,
      )}
    >
      {items.map((item, index) => (
        <TimelineEntry key={item.slug} item={item} index={index} />
      ))}
    </ol>
  )
}

type TimelineEntryProps = {
  item: Experience
  index: number
}

function TimelineEntry({ item, index }: TimelineEntryProps) {
  return (
    <m.li
      initial={{ opacity: 0, x: -16 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: "-10%" }}
      transition={{ duration: 0.5, delay: 0.06 * index, ease: [0.22, 1, 0.36, 1] }}
      className="relative pb-10 pl-8 last:pb-0 sm:pl-12"
    >
      <span
        aria-hidden="true"
        className="absolute left-0 top-2 grid size-[15px] place-items-center rounded-full bg-background sm:size-[23px]"
      >
        <span className="size-2 rounded-full bg-foreground sm:size-2.5" />
      </span>

      <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
        {formatDateRange(item.dateStart, item.dateEnd)}
        {item.location ? ` \u00b7 ${item.location}` : ""}
      </p>

      <h3 className="mt-2 font-display text-3xl leading-tight tracking-tight text-foreground sm:text-4xl">
        {item.role} <span className="italic text-foreground/70">at {item.company}</span>
      </h3>

      <p className="mt-3 max-w-[60ch] text-base leading-7 text-foreground/80 sm:text-[17px] sm:leading-8">
        {item.summary}
      </p>

      {item.tags && item.tags.length > 0 && (
        <ul className="mt-4 flex flex-wrap gap-2">
          {item.tags.map((tag) => (
            <li
              key={tag}
              className="rounded-full border border-border/70 bg-card/70 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground"
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
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-foreground hover:text-accent"
        >
          Visit
          <ArrowUpRight className="size-3.5" strokeWidth={2} />
        </a>
      )}
    </m.li>
  )
}
