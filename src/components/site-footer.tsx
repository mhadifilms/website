import { useEffect, useRef, useState } from "react"
import { m, useMotionValue, useSpring } from "framer-motion"
import { ArrowUpRight } from "lucide-react"

import { site } from "@/content/generated"

const MARQUEE_WORDS = ["filmmaker", "storyteller", "editor", "creator", "operator"]

function MarqueeRun() {
  return (
    <span className="flex shrink-0 items-center">
      {MARQUEE_WORDS.map((word) => (
        <span key={word} className="flex items-center">
          <span className="px-7 font-display text-xl italic text-black/55 transition-colors duration-300 hover:text-black sm:px-10 sm:text-2xl">
            {word}
          </span>
          <span className="footer-marquee-star text-sm text-accent">✳</span>
        </span>
      ))}
    </span>
  )
}

const CURSOR_SPRING = { stiffness: 480, damping: 40, mass: 0.55 } as const

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

  useEffect(() => {
    if (!enabled) return
    const zone = zoneRef.current
    if (!zone) return

    const handleMove = (event: PointerEvent) => {
      x.set(event.clientX)
      y.set(event.clientY)
      setVisible(true)
      setEngaged(Boolean((event.target as Element | null)?.closest("a, button")))
    }
    const handleLeave = () => {
      setVisible(false)
      setPressed(false)
    }
    const handleDown = () => setPressed(true)
    const handleUp = () => setPressed(false)

    zone.addEventListener("pointermove", handleMove)
    zone.addEventListener("pointerleave", handleLeave)
    zone.addEventListener("pointerdown", handleDown)
    zone.addEventListener("pointerup", handleUp)
    return () => {
      zone.removeEventListener("pointermove", handleMove)
      zone.removeEventListener("pointerleave", handleLeave)
      zone.removeEventListener("pointerdown", handleDown)
      zone.removeEventListener("pointerup", handleUp)
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

      <div aria-hidden="true" className="overflow-hidden border-b border-black/10 py-3.5">
        <div className="footer-marquee flex w-max">
          <MarqueeRun />
          <MarqueeRun />
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-[1180px] flex-col items-center px-6 pb-36 pt-20 text-center sm:pt-24">
        <p className="mb-6 text-[10px] font-medium tracking-[0.36em] text-black/35">
          04 · Say Hello
        </p>

        <m.a
          href={`mailto:${site.email}`}
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.99 }}
          transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
          className="group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-8 focus-visible:ring-offset-background"
        >
          <span className="block text-balance text-[clamp(2.2rem,7vw,4.75rem)] font-light leading-[1.04] tracking-[-0.04em] text-black">
            What&apos;s <span className="font-display italic">your</span> story?
          </span>
          <span className="mt-5 inline-flex items-center gap-2 text-lg font-light text-muted-foreground transition-colors duration-200 group-hover:text-black sm:text-xl">
            {site.email}
            <ArrowUpRight
              className="size-5 transition-transform duration-200 ease-out group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
              strokeWidth={1.6}
            />
          </span>
        </m.a>

        <nav aria-label="Social links" className="mt-12 flex flex-wrap items-center justify-center gap-x-7 gap-y-3">
          {site.socials.map((social) => (
            <a
              key={social.label}
              href={social.href}
              target="_blank"
              rel="noreferrer"
              className="footer-social-link text-sm font-light lowercase tracking-[0.14em] text-black/55 transition-colors duration-200 hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-background"
            >
              {social.label}
            </a>
          ))}
        </nav>

        <p className="mt-14 text-xs font-light tracking-[0.08em] text-black/35">
          © {year} {site.name} · <span className="font-hand text-sm text-black/45">shot on a vintage macintosh</span>
        </p>
      </div>
    </footer>
  )
}
