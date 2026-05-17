import { AnimatePresence, m } from "framer-motion"

import type { ArchiveItem } from "@/content/types"
import { cn } from "@/lib/utils"

type ArchiveGridProps = {
  items: ArchiveItem[]
  platformKey: string
  className?: string
}

export function ArchiveGrid({ items, platformKey, className }: ArchiveGridProps) {
  const slots = items.slice(0, 4)
  while (slots.length < 4) {
    slots.push({
      slug: `placeholder-${platformKey}-${slots.length}`,
      platform: items[0]?.platform ?? "Instagram",
      title: "",
      href: "",
      date: "",
    })
  }

  return (
    <div
      className={cn("relative w-full", className)}
      role="tabpanel"
      id={`archive-panel-${platformKey}`}
      aria-labelledby={`archive-tab-${platformKey}`}
    >
      <AnimatePresence mode="wait">
        <m.ul
          key={platformKey}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="grid grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-5"
        >
          {slots.map((item, index) => (
            <ArchiveCard key={`${platformKey}-${item.slug}`} item={item} index={index} />
          ))}
        </m.ul>
      </AnimatePresence>

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 right-0 w-1/2 bg-gradient-to-l from-background via-background/70 to-transparent sm:w-[55%]"
      />
    </div>
  )
}

type ArchiveCardProps = {
  item: ArchiveItem
  index: number
}

function ArchiveCard({ item, index }: ArchiveCardProps) {
  const isPlaceholder = !item.title
  const inner = (
    <m.div
      whileHover={!isPlaceholder ? { y: -4 } : undefined}
      transition={{ type: "spring", stiffness: 280, damping: 22 }}
      className={cn(
        "relative aspect-[3/4] w-full overflow-hidden rounded-2xl bg-muted/80 ring-1 ring-border/60",
        !isPlaceholder && "shadow-soft",
      )}
    >
      {item.image ? (
        <img
          src={item.image}
          alt={item.title}
          loading="lazy"
          decoding="async"
          className="block size-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
        />
      ) : (
        <div className="grid size-full place-items-center px-4 text-center text-[11px] font-medium uppercase tracking-[0.28em] text-muted-foreground/70">
          {isPlaceholder ? "" : item.platform}
        </div>
      )}

      {!isPlaceholder && item.title && (
        <div className="absolute inset-x-0 bottom-0 flex flex-col gap-1 bg-gradient-to-t from-foreground/85 to-transparent p-4 pt-12 text-background">
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] opacity-80">
            {new Date(item.date).toLocaleDateString("en", { month: "short", year: "numeric" })}
          </p>
          <p className="text-sm font-medium leading-tight">{item.title}</p>
        </div>
      )}
    </m.div>
  )

  return (
    <li
      style={{
        opacity: isPlaceholder ? 0.45 - index * 0.08 : 1,
        transform: `translateY(${index * 4}px)`,
      }}
    >
      {!isPlaceholder && item.href ? (
        <a
          href={item.href}
          target="_blank"
          rel="noreferrer"
          aria-label={`${item.title} on ${item.platform}`}
          className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          {inner}
        </a>
      ) : (
        inner
      )}
    </li>
  )
}
