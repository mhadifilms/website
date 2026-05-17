import { useCallback, useRef } from "react"
import { m } from "framer-motion"

import type { ArchivePlatform } from "@/content/types"
import { cn } from "@/lib/utils"

type SocialSwitcherProps = {
  platforms: ArchivePlatform[]
  active: ArchivePlatform
  onSelect: (platform: ArchivePlatform) => void
  className?: string
  icons?: Partial<Record<ArchivePlatform, React.ReactNode>>
}

export function SocialSwitcher({ platforms, active, onSelect, className, icons }: SocialSwitcherProps) {
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
      onSelect(platforms[next])
    },
    [onSelect, platforms],
  )

  return (
    <div
      role="tablist"
      aria-label="Archives by platform"
      aria-orientation="vertical"
      className={cn(
        "flex flex-row flex-wrap gap-x-6 gap-y-3 lg:flex-col lg:items-start lg:gap-3",
        className,
      )}
    >
      {platforms.map((platform, index) => {
        const isActive = platform === active
        return (
          <button
            key={platform}
            ref={(node) => {
              buttonsRef.current[index] = node
            }}
            type="button"
            role="tab"
            id={`archive-tab-${platform}`}
            aria-selected={isActive}
            aria-controls={`archive-panel-${platform}`}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onSelect(platform)}
            onKeyDown={(event) => handleKey(event, index)}
            className={cn(
              "group relative inline-flex items-center gap-2 rounded-sm text-base transition-colors duration-200 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-background sm:text-lg",
              isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            <span
              className={cn(
                "relative h-px bg-foreground transition-[width] duration-300",
                isActive ? "w-5" : "w-0",
              )}
              aria-hidden="true"
            />
            {icons?.[platform] && (
              <span aria-hidden="true" className="grid size-4 place-items-center text-muted-foreground">
                {icons[platform]}
              </span>
            )}
            <span className={cn("font-medium", isActive && "font-semibold")}>{platform}</span>
            {isActive && (
              <m.span
                layoutId="social-active-dot"
                transition={{ type: "spring", stiffness: 360, damping: 30 }}
                className="size-1.5 rounded-full bg-accent"
                aria-hidden="true"
              />
            )}
          </button>
        )
      })}
    </div>
  )
}
