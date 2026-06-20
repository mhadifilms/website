import { m, useTransform } from "framer-motion"
import type { MotionStyle, MotionValue } from "framer-motion"
import type { CSSProperties, MouseEvent, ReactNode } from "react"

import { Section } from "@/components/section"
import { ScrollWorkCta } from "@/components/scroll-work-cta"
import { site } from "@/content/generated"

const HERO_POLAROID_INDEX = 2

const POLAROID_LAYOUT = [
  {
    x: "10%",
    threadY: "clamp(5.4rem, 13svh, 8rem)",
    top: "clamp(10.2rem, 25.5svh, 14.8rem)",
    width: "clamp(50px, 11.8vw, 116px)",
    rotate: -6,
  },
  {
    x: "30%",
    threadY: "clamp(4.75rem, 12svh, 7.4rem)",
    top: "clamp(8.6rem, 21.5svh, 12.8rem)",
    width: "clamp(50px, 11.8vw, 116px)",
    rotate: 4,
  },
  {
    x: "50%",
    threadY: "clamp(5rem, 12.8svh, 7.9rem)",
    top: "clamp(9.2rem, 23svh, 13.6rem)",
    width: "clamp(58px, 12.8vw, 132px)",
    rotate: -3,
  },
  {
    x: "70%",
    threadY: "clamp(4.95rem, 12.5svh, 7.8rem)",
    top: "clamp(9.1rem, 22.8svh, 13.4rem)",
    width: "clamp(50px, 11.8vw, 116px)",
    rotate: -4,
  },
  {
    x: "90%",
    threadY: "clamp(5.4rem, 13.6svh, 8.25rem)",
    top: "clamp(10.1rem, 25.8svh, 15rem)",
    width: "clamp(50px, 11.8vw, 116px)",
    rotate: 6,
  },
] as const

const BIO_LINKS: Record<string, { slug: string; label: string }> = {
  "Chief of Staff at sync. labs": { slug: "sync-labs", label: "Open sync. labs experience" },
  "UCLA professors": { slug: "ucla-summer-sessions", label: "Open UCLA Summer Sessions experience" },
  "Emmy-winning filmmakers": { slug: "awaiten-films", label: "Open Awaiten Films experience" },
}

const BIO_LINK_PATTERN = new RegExp(`(${Object.keys(BIO_LINKS).map((key) => key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`, "g")

type AboutSectionProps = {
  transitionProgress: MotionValue<number>
}

export function AboutSection({ transitionProgress }: AboutSectionProps) {
  const paragraphs = site.bio.split(/\n+/).map((p) => p.trim()).filter(Boolean)
  const revealOpacity = useTransform(transitionProgress, [0.72, 0.92], [0, 1])
  const threadOpacity = useTransform(transitionProgress, [0.58, 0.76], [0, 1])
  const threadPathLength = useTransform(transitionProgress, [0.58, 0.84], [0, 1])
  const copyOpacity = useTransform(transitionProgress, [0.82, 1], [0, 1])
  const copyY = useTransform(transitionProgress, [0.82, 1], [28, 0])

  return (
    <Section
      id="about"
      label="About"
      className="mt-[-100svh] snap-none overflow-hidden bg-background"
      innerClassName="relative min-h-svh overflow-hidden"
    >
      <m.div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          opacity: revealOpacity,
          backgroundImage:
            "linear-gradient(to right, var(--grid-line) 1px, transparent 1px), linear-gradient(to bottom, var(--grid-line) 1px, transparent 1px)",
          backgroundSize: "80.7px 80.7px",
          backgroundPosition: "46.6px 21.4px",
        }}
      />

      <m.svg
        style={{ opacity: threadOpacity }}
        viewBox="0 0 100 6"
        preserveAspectRatio="none"
        aria-hidden="true"
        className="absolute left-[4vw] top-[clamp(4.9rem,12.7svh,7.9rem)] z-4 h-[clamp(1.2rem,3svh,2.4rem)] w-[92vw]"
      >
        <m.path
          style={{ pathLength: threadPathLength }}
          animate={{
            d: [
              "M50 3.4 C38 3.8 18 2.4 0 1.1",
              "M50 3.2 C38 3.5 18 2.1 0 0.9",
              "M50 3.6 C38 4 18 2.5 0 1.2",
              "M50 3.4 C38 3.8 18 2.4 0 1.1",
            ],
          }}
          transition={{ duration: 8.5, repeat: Infinity, ease: "easeInOut" }}
          fill="none"
          stroke="var(--color-accent)"
          strokeWidth="0.35"
          strokeOpacity="0.78"
          strokeLinecap="round"
        />
        <m.path
          style={{ pathLength: threadPathLength }}
          animate={{
            d: [
              "M50 3.4 C62 3.8 82 2.4 100 1.1",
              "M50 3.2 C62 3.5 82 2.1 100 0.9",
              "M50 3.6 C62 4 82 2.5 100 1.2",
              "M50 3.4 C62 3.8 82 2.4 100 1.1",
            ],
          }}
          transition={{ duration: 8.5, repeat: Infinity, ease: "easeInOut" }}
          fill="none"
          stroke="var(--color-accent)"
          strokeWidth="0.35"
          strokeOpacity="0.78"
          strokeLinecap="round"
        />
      </m.svg>

      {POLAROID_LAYOUT.map((layout, index) => (
        <HangingPolaroid
          key={`string-slot-${index}`}
          layout={layout}
          delay={index * 0.35}
          index={index}
          transitionProgress={transitionProgress}
        />
      ))}

      <m.div
        style={{ opacity: copyOpacity, y: copyY }}
        className="relative z-10 mx-auto flex min-h-svh w-[min(92vw,680px)] flex-col items-center px-4 pb-36 pt-[clamp(18rem,40svh,26rem)] text-center lg:pt-[clamp(19rem,43svh,29rem)] xl:pt-[clamp(20rem,45svh,31rem)]"
      >
        <h2 className="text-balance text-[clamp(2.25rem,6vw,4rem)] font-light leading-none tracking-[-0.04em] text-black">
          Hey, I&apos;m <span className="font-display font-normal">Hadi</span>.
        </h2>

        <div className="mt-6 space-y-5 text-pretty text-[clamp(1rem,2.6vw,1.45rem)] font-light leading-[1.42] text-black/75">
          {paragraphs.map((paragraph, index) => (
            <p key={index}>{renderBioParagraph(paragraph)}</p>
          ))}
        </div>

        <ScrollWorkCta className="mt-9" />
      </m.div>
    </Section>
  )
}

function renderBioParagraph(paragraph: string) {
  return paragraph.split(BIO_LINK_PATTERN).map((part, index) => {
    const link = BIO_LINKS[part]
    if (!link) return <span key={`${part}-${index}`}>{part}</span>

    return (
      <ExperienceBioLink key={`${part}-${index}`} slug={link.slug} ariaLabel={link.label}>
        {part}
      </ExperienceBioLink>
    )
  })
}

type ExperienceBioLinkProps = {
  slug: string
  ariaLabel: string
  children: ReactNode
}

function ExperienceBioLink({ slug, ariaLabel, children }: ExperienceBioLinkProps) {
  const href = `/experiences#${slug}`

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault()
    window.history.pushState(null, "", href)
    window.dispatchEvent(new CustomEvent("experience:open", { detail: { slug } }))
    document.getElementById("experiences")?.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
      block: "start",
    })
  }

  return (
    <a
      href={href}
      aria-label={ariaLabel}
      onClick={handleClick}
      className="font-normal text-black underline decoration-accent decoration-[0.08em] underline-offset-[0.18em] transition decoration-skip-ink hover:decoration-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-background"
    >
      {children}
    </a>
  )
}

type HangingPolaroidProps = {
  layout: (typeof POLAROID_LAYOUT)[number]
  delay?: number
  index: number
  transitionProgress: MotionValue<number>
}

function HangingPolaroid({
  layout,
  delay = 0,
  index,
  transitionProgress,
}: HangingPolaroidProps) {
  const isHero = index === HERO_POLAROID_INDEX
  const distanceFromHero = Math.abs(index - HERO_POLAROID_INDEX)
  const revealStart = isHero ? 0.6 : 0.62 + distanceFromHero * 0.055
  const revealEnd = isHero ? 0.76 : revealStart + 0.18
  const rootOpacity = useTransform(transitionProgress, [revealStart, revealEnd], [0, 1])
  const threadScaleY = useTransform(transitionProgress, [revealStart - 0.04, revealEnd], [0.08, 1])
  const style = {
    "--polaroid-x": layout.x,
    "--polaroid-width": layout.width,
    "--thread-y": layout.threadY,
    "--thread-drop": `max(2rem, calc(${layout.top} - ${layout.threadY}))`,
    opacity: rootOpacity,
  } as unknown as CSSProperties & MotionStyle

  return (
    <m.div
      style={style}
      className="pointer-events-none absolute left-(--polaroid-x) top-(--thread-y) z-5 w-(--polaroid-width) origin-top -translate-x-1/2"
    >
      <m.span
        className="absolute left-1/2 top-0 w-px -translate-x-1/2 origin-top bg-accent/70"
        style={{ height: "var(--thread-drop)", scaleY: threadScaleY }}
      />
      <m.span
        className="absolute left-1/2 top-0 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent"
        animate={{ y: [0, -0.5, 0.5, 0] }}
        transition={{ duration: 4.8 + delay, repeat: Infinity, repeatType: "mirror", ease: "easeInOut", delay }}
      />
      <m.div
        data-hero-polaroid-marker={`about-${index}`}
        data-hero-polaroid-center={isHero ? "true" : undefined}
        aria-hidden="true"
        className="absolute left-1/2 top-(--thread-drop) aspect-188/254 w-full -translate-x-1/2 origin-top"
      />
    </m.div>
  )
}
