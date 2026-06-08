import { useMemo, useRef, useState } from "react"
import { m } from "framer-motion"
import { ArrowUpRight } from "lucide-react"

import { ArchiveGrid } from "@/components/archive-grid"
import { Section } from "@/components/section"
import { SocialSwitcher } from "@/components/social-switcher"
import { useSectionMotion } from "@/hooks/use-section-motion"
import { archives, site } from "@/content/generated"
import type { ArchivePlatform } from "@/content/types"

const PLATFORM_ORDER: ArchivePlatform[] = ["Linkedin", "Twitter", "Instagram", "Substack", "YouTube"]

export function ArchivesSection() {
  const ref = useRef<HTMLDivElement>(null)
  const { opacity, scale, translateY } = useSectionMotion(ref)
  const [active, setActive] = useState<ArchivePlatform>("YouTube")

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
      innerClassName="mx-auto flex w-full max-w-[1728px] flex-1 flex-col justify-center px-6 py-24 sm:px-8"
    >
      <m.div
        ref={ref}
        style={{ opacity, scale, y: translateY }}
        className="flex min-h-[760px] w-full flex-col justify-center lg:min-h-[920px]"
      >
        <header className="mx-auto mb-9 text-center">
          <m.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.1 }}
            transition={{ duration: 0.65, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
            className="text-5xl font-light leading-none tracking-[-0.04em] text-foreground sm:text-6xl"
          >
            the <span className="font-display font-semibold">archives</span>.
          </m.h2>
        </header>

        <div className="mx-auto grid w-full max-w-[1540px] gap-8 lg:grid-cols-[180px_minmax(0,1fr)] lg:gap-[22px]">
          <SocialSwitcher
            platforms={platforms}
            active={active}
            onSelect={setActive}
            className="mx-auto self-center lg:mx-0 lg:self-start lg:pt-[62px]"
          />

          <div className="flex min-w-0 flex-col">
            <ArchiveGrid items={filtered} platformKey={active} />

            <div className="mt-8 flex justify-center">
              <a
                href={profileHref}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-2xl font-light text-[#808080] transition hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-background"
              >
                <span>
                  view more on{" "}
                  <span className="font-medium text-black underline underline-offset-4">{active}</span>
                </span>
                <ArrowUpRight className="size-5 text-black" strokeWidth={1.8} />
              </a>
            </div>
          </div>
        </div>
      </m.div>
    </Section>
  )
}
