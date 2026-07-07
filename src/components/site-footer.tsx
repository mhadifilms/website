import { useEffect, useRef, useState } from "react"
import { m, useMotionValue, useSpring } from "framer-motion"
import { ArrowUpRight } from "lucide-react"

import { site } from "@/content/generated"
import {
  GitHubIcon,
  InstagramIcon,
  LinkedinIcon,
  SubstackIcon,
  TwitterIcon,
  YouTubeIcon,
} from "@/components/social-icons"

const CURSOR_SPRING = { stiffness: 480, damping: 40, mass: 0.55 } as const

const SOCIAL_META = {
  Substack: { note: "essays", Icon: SubstackIcon },
  YouTube: { note: "films", Icon: YouTubeIcon },
  Instagram: { note: "frames", Icon: InstagramIcon },
  Twitter: { note: "notes", Icon: TwitterIcon },
  Linkedin: { note: "work", Icon: LinkedinIcon },
  GitHub: { note: "code", Icon: GitHubIcon },
} as const

type ViewfinderCursorProps = {
  zoneRef: React.RefObject<HTMLElement | null>
}

function ViewfinderCursor({ zoneRef }: ViewfinderCursorProps) {
  const x = useMotionValue(-200)
  const y = useMotionValue(-200)
  const springX = useSpring(x, CURSOR_SPRING)
  const springY = useSpring(y, CURSOR_SPRING)
  const [enabled] = useState(() => {
    if (typeof window === "undefined") return false
    return (
      window.matchMedia("(pointer: fine)").matches &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
  })
  const [visible, setVisible] = useState(false)
  const [engaged, setEngaged] = useState(false)
  const [pressed, setPressed] = useState(false)

  const visibleRef = useRef(false)
  const engagedRef = useRef(false)
  const pressedRef = useRef(false)
  const lastPos = useRef({ x: -200, y: -200 })

  useEffect(() => {
    if (!enabled) return
    const zone = zoneRef.current
    if (!zone) return

    let rafId = 0
    let pendingTarget: Element | null = null

    // Coalesce every pointermove in a frame into a single state/motion update,
    // so fast movement (multiple events per frame) can't pile up work.
    const flush = () => {
      rafId = 0
      x.set(lastPos.current.x)
      y.set(lastPos.current.y)
      if (!visibleRef.current) {
        visibleRef.current = true
        setVisible(true)
      }
      const nextEngaged = Boolean(pendingTarget?.closest("a, button"))
      if (nextEngaged !== engagedRef.current) {
        engagedRef.current = nextEngaged
        setEngaged(nextEngaged)
      }
    }

    const handleMove = (event: PointerEvent) => {
      lastPos.current = { x: event.clientX, y: event.clientY }
      pendingTarget = event.target as Element | null
      if (!rafId) rafId = requestAnimationFrame(flush)
    }

    const hide = () => {
      if (rafId) {
        cancelAnimationFrame(rafId)
        rafId = 0
      }
      if (visibleRef.current) {
        visibleRef.current = false
        setVisible(false)
      }
      if (pressedRef.current) {
        pressedRef.current = false
        setPressed(false)
      }
    }

    const handleDown = () => {
      pressedRef.current = true
      setPressed(true)
    }
    const handleUp = () => {
      pressedRef.current = false
      setPressed(false)
    }

    // Scroll/blur don't emit pointer events, so the cursor could otherwise get
    // stranded "inside" a footer that has scrolled out from under the pointer.
    const handleScroll = () => {
      if (!visibleRef.current) return
      const rect = zone.getBoundingClientRect()
      const { x: px, y: py } = lastPos.current
      const inside = px >= rect.left && px <= rect.right && py >= rect.top && py <= rect.bottom
      if (!inside) hide()
    }

    zone.addEventListener("pointermove", handleMove, { passive: true })
    zone.addEventListener("pointerleave", hide)
    zone.addEventListener("pointercancel", hide)
    zone.addEventListener("pointerdown", handleDown)
    zone.addEventListener("pointerup", handleUp)
    window.addEventListener("scroll", handleScroll, { passive: true })
    window.addEventListener("blur", hide)

    return () => {
      if (rafId) cancelAnimationFrame(rafId)
      zone.removeEventListener("pointermove", handleMove)
      zone.removeEventListener("pointerleave", hide)
      zone.removeEventListener("pointercancel", hide)
      zone.removeEventListener("pointerdown", handleDown)
      zone.removeEventListener("pointerup", handleUp)
      window.removeEventListener("scroll", handleScroll)
      window.removeEventListener("blur", hide)
    }
  }, [enabled, zoneRef, x, y])

  if (!enabled) return null

  return (
    <m.div
      aria-hidden="true"
      style={{ x: springX, y: springY }}
      className="pointer-events-none fixed left-0 top-0 z-70"
    >
      <m.div
        animate={{
          scale: pressed ? 0.82 : engaged ? 1.4 : 1,
          rotate: engaged ? 45 : 0,
          opacity: visible ? 1 : 0,
        }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        className="relative size-9 -translate-x-1/2 -translate-y-1/2"
      >
        {/* Camera viewfinder corner brackets */}
        <span className="absolute left-0 top-0 size-2.5 border-l-[1.5px] border-t-[1.5px] border-black/75" />
        <span className="absolute right-0 top-0 size-2.5 border-r-[1.5px] border-t-[1.5px] border-black/75" />
        <span className="absolute bottom-0 left-0 size-2.5 border-b-[1.5px] border-l-[1.5px] border-black/75" />
        <span className="absolute bottom-0 right-0 size-2.5 border-b-[1.5px] border-r-[1.5px] border-black/75" />
        <m.span
          animate={{ scale: engaged ? 0.6 : 1, opacity: engaged ? 0.55 : 1 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          className="absolute left-1/2 top-1/2 size-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-black/75"
        />
      </m.div>
    </m.div>
  )
}

export function SiteFooter() {
  const year = new Date().getFullYear()
  const footerRef = useRef<HTMLElement>(null)

  return (
    <footer ref={footerRef} className="footer-cursor-zone relative border-t border-black/10 bg-background">
      <ViewfinderCursor zoneRef={footerRef} />

      <div className="mx-auto flex w-full max-w-[1180px] flex-col items-center px-6 pb-36 pt-20 text-center sm:pt-24">
        <m.a
          href={`mailto:${site.email}`}
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.99 }}
          transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
          className="group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-8 focus-visible:ring-offset-background"
        >
          <span className="block text-balance text-[clamp(2.25rem,6vw,4rem)] font-light leading-none tracking-[-0.04em] text-black">
            What&apos;s <span className="font-display italic">your</span> story?
          </span>
          <span className="mt-5 inline-flex items-center gap-2 text-base font-light text-muted-foreground transition-colors duration-200 group-hover:text-black sm:text-lg">
            {site.email}
            <ArrowUpRight
              className="size-5 transition-transform duration-200 ease-out group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
              strokeWidth={1.6}
            />
          </span>
        </m.a>

        <nav aria-label="Social links" className="mt-12 flex w-full max-w-[620px] flex-col items-center gap-5">
          <p className="text-[10px] font-light uppercase tracking-[0.28em] text-black/30">Elsewhere</p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {site.socials.map((social) => (
              <SocialLinkChip key={social.label} social={social} />
            ))}
          </div>
        </nav>

        <p className="mt-14 text-xs font-light tracking-[0.08em] text-black/35">
          © {year} {site.name}
        </p>
      </div>
    </footer>
  )
}

type SocialLinkChipProps = {
  social: (typeof site.socials)[number]
}

function SocialLinkChip({ social }: SocialLinkChipProps) {
  const meta = SOCIAL_META[social.label as keyof typeof SOCIAL_META]
  const Icon = meta?.Icon

  return (
    <m.a
      href={social.href}
      target="_blank"
      rel="noreferrer"
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.985 }}
      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
      className="group inline-flex items-center gap-2 border border-black/10 bg-white/20 px-3 py-2 text-black/50 transition hover:border-black/30 hover:bg-white/35 hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-background"
    >
      <span className="grid size-5 place-items-center">
        {Icon ? <Icon className="size-3.5" /> : <ArrowUpRight className="size-3.5" strokeWidth={1.6} />}
      </span>
      <span className="text-xs font-light lowercase tracking-[0.14em]">{social.label}</span>
      <span className="hidden text-[9px] font-light uppercase tracking-[0.18em] text-black/30 transition group-hover:text-black/45 sm:inline">
        {meta?.note ?? "open"}
      </span>
      <ArrowUpRight
        className="size-3 text-black/25 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-black/65"
        strokeWidth={1.7}
      />
    </m.a>
  )
}
