import { useMemo, useRef, useState } from "react"
import { m } from "framer-motion"
import { ArrowUpRight } from "lucide-react"

import { ArchiveGrid } from "@/components/archive-grid"
import { Section } from "@/components/section"
import { SocialSwitcher } from "@/components/social-switcher"
import {
  InstagramIcon,
  LinkedinIcon,
  SubstackIcon,
  TwitterIcon,
  YouTubeIcon,
} from "@/components/social-icons"
import { useSectionMotion } from "@/hooks/use-section-motion"
import { archives, site } from "@/content/generated"
import type { ArchivePlatform } from "@/content/types"

const PLATFORM_ICONS: Partial<Record<ArchivePlatform, React.ReactNode>> = {
  Linkedin: <LinkedinIcon className="size-3.5" />,
  Twitter: <TwitterIcon className="size-3.5" />,
  Instagram: <InstagramIcon className="size-3.5" />,
  Substack: <SubstackIcon className="size-3.5" />,
  YouTube: <YouTubeIcon className="size-3.5" />,
}

const PLATFORM_ORDER: ArchivePlatform[] = ["Linkedin", "Twitter", "Instagram", "Substack", "YouTube"]

export function ArchivesSection() {
  const ref = useRef<HTMLDivElement>(null)
  const { opacity, scale, translateY } = useSectionMotion(ref)
  const [active, setActive] = useState<ArchivePlatform>("Instagram")

  const platforms = useMemo<ArchivePlatform[]>(() => {
    const present = new Set<ArchivePlatform>(archives.map((item) => item.platform))
    const ordered = PLATFORM_ORDER.filter((p) => present.has(p))
    return ordered.length > 0 ? ordered : PLATFORM_ORDER
  }, [])

  const filtered = useMemo(() => archives.filter((item) => item.platform === active), [active])
  const profileHref = useMemo(
    () => site.socials.find((s) => s.label === active)?.href ?? "#",
    [active],
  )

  return (
    <Section
      id="archives"
      label="Archives"
      className="bg-background"
      innerClassName="mx-auto flex w-full max-w-[1600px] flex-1 flex-col justify-center px-4 py-20 sm:px-8 sm:py-24"
    >
      <m.div
        ref={ref}
        style={{ opacity, scale, y: translateY }}
        className="flex w-full flex-col"
      >
        <header className="mx-auto mb-10 text-center sm:mb-14">
            <m.p
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.1 }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              className="font-mono text-xs uppercase tracking-[0.4em] text-muted-foreground"
            >
              Bits and pieces, by platform
            </m.p>
          <m.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.1 }}
            transition={{ duration: 0.65, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
            className="mt-4 font-display text-5xl leading-[1] tracking-tight text-foreground sm:text-6xl md:text-7xl"
          >
            the <span className="italic">archives</span>
            <span className="font-display">.</span>
          </m.h2>
        </header>

        <div className="grid w-full gap-8 lg:grid-cols-[180px_minmax(0,1fr)] lg:gap-14">
          <SocialSwitcher
            platforms={platforms}
            active={active}
            onSelect={setActive}
            icons={PLATFORM_ICONS}
            className="justify-center lg:sticky lg:top-24"
          />

          <div className="flex min-w-0 flex-col">
            <ArchiveGrid items={filtered} platformKey={active} />

            <div className="mt-8 flex justify-center sm:justify-start sm:pl-[2%]">
              <a
                href={profileHref}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-sm font-medium text-foreground transition hover:text-accent"
              >
                <span>
                  view more on{" "}
                  <span className="font-semibold underline-offset-4 hover:underline">{active}</span>
                </span>
                <ArrowUpRight className="size-4" strokeWidth={2} />
              </a>
            </div>
          </div>
        </div>
      </m.div>
    </Section>
  )
}
