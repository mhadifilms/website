import { useCallback, useRef } from "react"
import { m } from "framer-motion"

import { cn } from "@/lib/utils"

type CategorySwitcherProps = {
  categories: string[]
  active: string
  onSelect: (category: string) => void
  className?: string
  label?: string
}

export function CategorySwitcher({ categories, active, onSelect, className, label = "Archives by project type" }: CategorySwitcherProps) {
  const buttonsRef = useRef<Array<HTMLButtonElement | null>>([])

  const handleKey = useCallback(
    (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
      const buttons = buttonsRef.current.filter(Boolean) as HTMLButtonElement[]
      if (buttons.length === 0) return
      const last = buttons.length - 1
      let next: number | null = null
      if (event.key === "ArrowDown" || event.key === "ArrowRight") next = index === last ? 0 : index + 1
      else if (event.key === "ArrowUp" || event.key === "ArrowLeft") next = index === 0 ? last : index - 1
      else if (event.key === "Home") next = 0
      else if (event.key === "End") next = last
      if (next === null) return
      event.preventDefault()
      buttons[next].focus()
      onSelect(categories[next])
    },
    [onSelect, categories],
  )

  return (
    <div
      role="tablist"
      aria-label={label}
      className={cn(
        "scrollbar-none flex max-w-full flex-row gap-5 overflow-x-auto pb-2 lg:flex-col lg:items-start lg:gap-5 lg:overflow-visible lg:pb-0 [&::-webkit-scrollbar]:hidden",
        className,
      )}
    >
      {categories.map((category, index) => {
        const isActive = category === active
        const categoryId = category.replace(/\s+/g, "-").toLowerCase()
        const tabId = `archive-tab-${categoryId}`
        const panelId = `archive-panel-${categoryId}`
        return (
          <m.button
            key={category}
            ref={(node) => {
              buttonsRef.current[index] = node
            }}
            type="button"
            whileHover={!isActive ? { y: -1 } : undefined}
            whileTap={{ scale: 0.985 }}
            transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
            role="tab"
            id={tabId}
            aria-selected={isActive}
            aria-controls={panelId}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onSelect(category)}
            onKeyDown={(event) => handleKey(event, index)}
            className={cn(
              "group relative inline-flex shrink-0 items-center gap-2 text-base font-light leading-none text-black transition-colors duration-200 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-background sm:text-lg",
              isActive ? "font-medium" : "hover:text-black/70",
            )}
          >
            <span>{category}</span>
            {isActive && (
              <m.span
                layoutId="archive-category-underline"
                aria-hidden="true"
                className="absolute -bottom-2 left-0 h-px w-full bg-black"
                transition={{ type: "spring", stiffness: 420, damping: 34 }}
              />
            )}
          </m.button>
        )
      })}
    </div>
  )
}
