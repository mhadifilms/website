import { AnimatePresence, m } from "framer-motion"

import type { ArchiveItem } from "@/content/types"
import { cn } from "@/lib/utils"

const CARD_TRANSITION = { type: "spring", stiffness: 340, damping: 28, mass: 0.7 } as const

type ArchiveGridProps = {
  items: ArchiveItem[]
  platformKey: string
  className?: string
}

export function ArchiveGrid({ items, platformKey, className }: ArchiveGridProps) {
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
          className="grid grid-cols-2 gap-5 sm:grid-cols-4 lg:gap-[34px]"
        >
          {items.slice(0, 4).map((item, index) => (
            <ArchiveCard key={`${platformKey}-${item.slug}`} item={item} index={index} />
          ))}
        </m.ul>
      </AnimatePresence>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-[-40px] right-[-8px] hidden w-[56%] bg-gradient-to-l from-background via-background/75 to-transparent lg:block"
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
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={!isPlaceholder ? { y: -6, rotate: index % 2 === 0 ? -0.35 : 0.35, scale: 1.01 } : undefined}
      whileTap={!isPlaceholder ? { scale: 0.985 } : undefined}
      transition={CARD_TRANSITION}
      className={cn(
        "relative aspect-[312/485] w-full overflow-hidden bg-[#d9d9d9] transform-gpu",
        !isPlaceholder && "transition-shadow",
      )}
    >
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

      {!isPlaceholder && item.title && (
        <div className="absolute inset-x-0 bottom-0 translate-y-2 bg-gradient-to-t from-background/95 via-background/75 to-transparent p-4 pt-16 text-black opacity-0 transition duration-200 ease-out group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100">
          <p className="text-xs font-light uppercase tracking-[0.22em] text-black/55">
            {new Date(item.date).toLocaleDateString("en", { month: "short", year: "numeric" })}
          </p>
          <p className="mt-1 text-lg font-light leading-tight">{item.title}</p>
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
          className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-background"
        >
          {inner}
        </a>
      ) : (
        inner
      )}
    </li>
  )
}
