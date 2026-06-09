import { m } from "framer-motion"
import { ArrowUpRight } from "lucide-react"

import { site } from "@/content/generated"

const MARQUEE_WORDS = ["filmmaker", "storyteller", "editor", "creator", "operator"]

function MarqueeRun() {
  return (
    <span className="flex shrink-0 items-center">
      {MARQUEE_WORDS.map((word) => (
        <span key={word} className="flex items-center">
          <span className="px-7 font-display text-xl italic text-black/55 sm:px-10 sm:text-2xl">
            {word}
          </span>
          <span className="text-sm text-accent">✳</span>
        </span>
      ))}
    </span>
  )
}

export function SiteFooter() {
  const year = new Date().getFullYear()

  return (
    <footer className="relative border-t border-black/10 bg-background">
      <div aria-hidden="true" className="overflow-hidden border-b border-black/10 py-3.5">
        <div className="footer-marquee flex w-max">
          <MarqueeRun />
          <MarqueeRun />
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-[1180px] flex-col items-center px-6 pb-36 pt-20 text-center sm:pt-24">
        <p className="mb-6 text-[10px] font-medium uppercase tracking-[0.5em] text-black/35">
          04 · say hello
        </p>

        <m.a
          href={`mailto:${site.email}`}
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.99 }}
          transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
          className="group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-8 focus-visible:ring-offset-background"
        >
          <span className="block text-balance text-[clamp(2.2rem,7vw,4.75rem)] font-light leading-[1.04] tracking-[-0.04em] text-black">
            let&apos;s tell <span className="font-display italic">your</span> story
            <span className="inline-block transition-transform duration-300 ease-out group-hover:-translate-y-1 group-hover:translate-x-1">
              .
            </span>
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
              className="text-sm font-light lowercase tracking-[0.14em] text-black/55 underline-offset-4 transition-colors duration-200 hover:text-black hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-background"
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
