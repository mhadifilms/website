import { useCallback, useRef } from "react"
import { AnimatePresence, m } from "framer-motion"
import { Mail } from "lucide-react"

import {
  InstagramIcon,
  LinkedinIcon,
  SubstackIcon,
  TwitterIcon,
  YouTubeIcon,
} from "@/components/social-icons"
import { site } from "@/content/generated"
import { useFooterMode } from "@/hooks/use-footer-mode"
import { useSectionContext } from "@/hooks/section-context"
import { cn } from "@/lib/utils"

const SOCIAL_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Linkedin: LinkedinIcon,
  Twitter: TwitterIcon,
  Instagram: InstagramIcon,
  Substack: SubstackIcon,
  YouTube: YouTubeIcon,
}

const PILL_TRANSITION = { type: "spring", stiffness: 220, damping: 28, mass: 0.7 } as const

export function PillNav() {
  const ctx = useSectionContext()
  const isFooter = useFooterMode()
  const buttonsRef = useRef<Array<HTMLButtonElement | null>>([])

  const handleKey = useCallback(
    (event: React.KeyboardEvent<HTMLButtonElement>, currentIndex: number) => {
      if (!ctx) return
      const buttons = buttonsRef.current.filter(Boolean) as HTMLButtonElement[]
      if (buttons.length === 0) return
      const last = buttons.length - 1
      let nextIndex: number | null = null
      if (event.key === "ArrowRight" || event.key === "ArrowDown") nextIndex = currentIndex === last ? 0 : currentIndex + 1
      else if (event.key === "ArrowLeft" || event.key === "ArrowUp") nextIndex = currentIndex === 0 ? last : currentIndex - 1
      else if (event.key === "Home") nextIndex = 0
      else if (event.key === "End") nextIndex = last
      if (nextIndex === null) return
      event.preventDefault()
      buttons[nextIndex].focus()
    },
    [ctx],
  )

  if (!ctx) return null
  const { sections, activeId, scrollToId } = ctx

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-40 flex justify-center px-4 sm:bottom-8">
      <m.nav
        layout
        aria-label={isFooter ? "Contact" : "Sections"}
        transition={PILL_TRANSITION}
        className={cn(
          "pointer-events-auto flex items-center rounded-full border border-border/70 bg-card/85 shadow-pill backdrop-blur-xl",
          isFooter
            ? "h-16 w-full max-w-[1400px] justify-between gap-2 px-3 sm:gap-4 sm:px-5"
            : "h-auto gap-1 p-1",
        )}
      >
        <AnimatePresence mode="wait" initial={false}>
          {!isFooter ? (
            <m.div
              key="sections"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="flex items-center gap-1"
            >
              {sections.map((section, index) => {
                const isActive = section.id === activeId
                return (
                  <button
                    key={section.id}
                    ref={(node) => {
                      buttonsRef.current[index] = node
                    }}
                    type="button"
                    aria-current={isActive ? "page" : undefined}
                    onClick={() => scrollToId(section.id)}
                    onKeyDown={(event) => handleKey(event, index)}
                    className={cn(
                      "relative isolate flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-medium transition-colors duration-200 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:px-6 sm:py-3 sm:text-[15px]",
                      isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {isActive && (
                      <m.span
                        layoutId="pill-indicator"
                        transition={{ type: "spring", stiffness: 380, damping: 32 }}
                        className="absolute inset-0 -z-10 rounded-full bg-card shadow-soft ring-1 ring-border/80"
                      />
                    )}
                    <span className="relative">{section.label}</span>
                  </button>
                )
              })}
            </m.div>
          ) : (
            <m.div
              key="footer"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22, delay: 0.08 }}
              className="flex w-full items-center justify-between gap-2 sm:gap-4"
            >
              <ul className="flex items-center gap-1 sm:gap-2">
                {site.socials.map((social) => {
                  const Icon = SOCIAL_ICONS[social.label]
                  if (!Icon) return null
                  return (
                    <li key={social.label}>
                      <a
                        href={social.href}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={social.label}
                        className="grid size-10 place-items-center rounded-full text-foreground/75 transition-colors hover:bg-muted hover:text-foreground"
                      >
                        <Icon className="size-[18px]" />
                      </a>
                    </li>
                  )
                })}
              </ul>

              <a
                href={`mailto:${site.email}`}
                className="inline-flex items-center gap-2 rounded-full bg-foreground px-4 py-2.5 text-sm font-medium text-background shadow-soft transition hover:bg-foreground/90 sm:px-5 sm:py-3"
              >
                <Mail className="size-4" strokeWidth={2} />
                <span className="hidden sm:inline">{site.email}</span>
                <span className="sm:hidden">email</span>
              </a>
            </m.div>
          )}
        </AnimatePresence>
      </m.nav>
    </div>
  )
}
