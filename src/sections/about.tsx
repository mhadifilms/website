import { m } from "framer-motion"
import type { CSSProperties, MouseEvent, ReactNode } from "react"

import { Section } from "@/components/section"
import { ScrollWorkCta } from "@/components/scroll-work-cta"
import { site } from "@/content/generated"
import { scenePolaroids } from "@/lib/polaroid-scene"

const POLAROID_LAYOUT = [
  { x: -8, threadY: 20.5, top: 25.5, width: "clamp(76px,8vw,132px)", rotate: -5, hideOnSmall: false },
  { x: 14, threadY: 22.2, top: 29, width: "clamp(72px,7.4vw,124px)", rotate: 4, hideOnSmall: true },
  { x: 86, threadY: 22.2, top: 29, width: "clamp(72px,7.4vw,124px)", rotate: -3, hideOnSmall: true },
  { x: 108, threadY: 20.5, top: 25.5, width: "clamp(76px,8vw,132px)", rotate: 5, hideOnSmall: false },
] as const

const BIO_LINKS: Record<string, { slug: string; label: string }> = {
  "Chief of Staff at sync. labs": { slug: "sync-labs", label: "Open sync. labs experience" },
  "UCLA professors": { slug: "ucla-summer-sessions", label: "Open UCLA Summer Sessions experience" },
  "Emmy-winning filmmakers": { slug: "awaiten-films", label: "Open Awaiten Films experience" },
}

const BIO_LINK_PATTERN = new RegExp(`(${Object.keys(BIO_LINKS).map((key) => key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`, "g")

export function AboutSection() {
  const paragraphs = site.bio.split(/\n+/).map((p) => p.trim()).filter(Boolean)
  const slots = POLAROID_LAYOUT.map((_, index) => scenePolaroids[index % Math.max(scenePolaroids.length, 1)])

  return (
    <Section
      id="about"
      label="About"
      className="snap-none overflow-hidden bg-background"
      innerClassName="relative min-h-svh overflow-hidden"
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-80"
        style={{
          backgroundImage:
            "linear-gradient(to right, var(--grid-line) 1px, transparent 1px), linear-gradient(to bottom, var(--grid-line) 1px, transparent 1px)",
          backgroundSize: "80.7px 80.7px",
          backgroundPosition: "46.6px 21.4px",
        }}
      />

      <m.svg
        initial={{ opacity: 0, pathLength: 0 }}
        whileInView={{ opacity: 1, pathLength: 1 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
        viewBox="0 0 100 16"
        preserveAspectRatio="none"
        aria-hidden="true"
        className="absolute left-[4vw] top-[17svh] z-[4] h-[7svh] w-[92vw]"
      >
        <m.path
          d="M0 5.5 C24 14 76 14 100 5.5"
          fill="none"
          stroke="var(--color-accent)"
          strokeWidth="0.35"
          strokeOpacity="0.78"
        />
      </m.svg>

      {slots.map((polaroid, index) => (
        <HangingPolaroid
          key={`${polaroid?.src ?? "missing"}-${index}`}
          src={polaroid?.src}
          alt={polaroid?.alt}
          caption={polaroid?.caption}
          layout={POLAROID_LAYOUT[index]}
          delay={index * 0.35}
        />
      ))}

      <m.div
        initial={{ opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.45 }}
        transition={{ duration: 0.75, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 mx-auto flex min-h-svh w-[min(92vw,620px)] flex-col items-center justify-center px-4 text-center"
      >
        <h2 className="text-balance text-4xl font-light leading-none tracking-[-0.04em] text-black sm:text-6xl">
          Hey, I&apos;m <span className="font-display font-semibold">{site.shortName ?? site.name}</span>.
        </h2>

        <div className="mt-7 space-y-5 text-pretty text-lg font-light leading-[1.45] text-black/75 sm:text-2xl">
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
  src?: string
  alt?: string
  caption?: string
  layout: (typeof POLAROID_LAYOUT)[number]
  delay?: number
}

function HangingPolaroid({ src, alt, caption, layout, delay = 0 }: HangingPolaroidProps) {
  const drop = Math.max(layout.top - layout.threadY, 1.5)
  const style = {
    "--polaroid-x": `${layout.x}%`,
    "--polaroid-top": `${layout.top}svh`,
    "--polaroid-width": layout.width,
    "--thread-drop": `${drop}svh`,
  } as CSSProperties

  return (
    <div
      aria-hidden="true"
      style={style}
      className={[
        "pointer-events-none absolute left-[var(--polaroid-x)] top-[var(--polaroid-top)] z-[5] w-[var(--polaroid-width)]",
        layout.hideOnSmall ? "max-sm:hidden" : "",
      ].join(" ")}
    >
      <span
        className="absolute bottom-[calc(100%-1px)] left-1/2 w-px -translate-x-1/2 bg-accent/70"
        style={{ height: "var(--thread-drop)" }}
      />
      <span
        className="absolute left-1/2 size-2 -translate-x-1/2 rounded-full bg-accent"
        style={{ bottom: "calc(100% + var(--thread-drop) - 0.25rem)" }}
      />
      <m.figure
        animate={{
          rotate: [layout.rotate - 0.7, layout.rotate + 0.9, layout.rotate - 0.4],
          y: [0, -2, 1],
        }}
        transition={{
          y: { duration: 4.8 + delay, repeat: Infinity, repeatType: "mirror", ease: "easeInOut", delay },
          rotate: { duration: 4.8 + delay, repeat: Infinity, repeatType: "mirror", ease: "easeInOut", delay },
        }}
        className="relative origin-top"
      >
        <div className="relative aspect-[188/254] bg-[#efede2] p-[5%] pb-[18%] shadow-polaroid">
          {src ? (
            <img
              src={src}
              alt={alt ?? ""}
              loading="lazy"
              decoding="async"
              className="block size-full object-cover saturate-[0.88] contrast-[0.96] sepia-[0.08]"
            />
          ) : (
            <div className="size-full bg-[#d9d9d9]" />
          )}
          {caption && (
            <figcaption className="absolute inset-x-[8%] bottom-[5%] truncate text-center text-[10px] font-light lowercase tracking-[0.08em] text-black/50">
              {caption}
            </figcaption>
          )}
        </div>
      </m.figure>
    </div>
  )
}
