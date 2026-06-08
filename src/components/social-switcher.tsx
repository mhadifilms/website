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
      className={cn(
        "scrollbar-none flex max-w-full flex-row gap-6 overflow-x-auto pb-2 lg:flex-col lg:items-start lg:gap-[37px] lg:overflow-visible lg:pb-0 [&::-webkit-scrollbar]:hidden",
        className,
      )}
    >
      {platforms.map((platform, index) => {
        const isActive = platform === active
        return (
          <m.button
            key={platform}
            ref={(node) => {
              buttonsRef.current[index] = node
            }}
            type="button"
            whileHover={!isActive ? { y: -1 } : undefined}
            whileTap={{ scale: 0.985 }}
            transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
            role="tab"
            id={`archive-tab-${platform}`}
            aria-selected={isActive}
            aria-controls={`archive-panel-${platform}`}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onSelect(platform)}
            onKeyDown={(event) => handleKey(event, index)}
            className={cn(
              "group relative inline-flex shrink-0 items-center gap-2 text-xl font-light leading-none text-black transition-colors duration-200 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-background sm:text-2xl",
              isActive ? "font-medium" : "hover:text-black/70",
            )}
          >
            {icons?.[platform] && (
              <span
                aria-hidden="true"
                className="hidden size-4 place-items-center transition-colors"
              >
                {icons[platform]}
              </span>
            )}
            <span>{platform}</span>
            {isActive && (
              <m.span
                layoutId="archive-platform-underline"
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
