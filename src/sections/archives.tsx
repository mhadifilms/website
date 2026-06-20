import { useMemo, useRef, useState } from "react"
import { m } from "framer-motion"

import { ArchiveGrid } from "@/components/archive-grid"
import { Section } from "@/components/section"
import { CategorySwitcher } from "@/components/social-switcher"
import { useSectionMotion } from "@/hooks/use-section-motion"
import { archives, projects } from "@/content/generated"

const PROJECT_TYPE_ORDER = ["Writing", "Video", "Tools", "Profiles"]

export function ArchivesSection() {
  const ref = useRef<HTMLDivElement>(null)
  const { opacity, scale, translateY } = useSectionMotion(ref)
  const [active, setActive] = useState<string>("Writing")

  const categories = useMemo<string[]>(() => {
    const present = new Set(archives.map((item) => item.projectType))
    const ordered = PROJECT_TYPE_ORDER.filter((category) => present.has(category))
    const rest = [...present].filter((category) => !PROJECT_TYPE_ORDER.includes(category)).sort()
    return ordered.length > 0 || rest.length > 0 ? [...ordered, ...rest] : PROJECT_TYPE_ORDER
  }, [])

  const filtered = useMemo(() => archives.filter((item) => item.projectType === active), [active])
  const projectBySlug = useMemo(() => new Map(projects.map((project) => [project.slug, project])), [])

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
            className="text-balance text-[clamp(2.25rem,6vw,4rem)] font-light leading-none tracking-[-0.04em] text-foreground"
          >
            The <span className="font-display font-normal">Archives</span>
          </m.h2>
        </header>

        <div className="mx-auto grid w-full max-w-[1540px] gap-8 lg:grid-cols-[180px_minmax(0,1fr)] lg:gap-[22px]">
          <CategorySwitcher
            categories={categories}
            active={active}
            onSelect={setActive}
            className="mx-auto self-center lg:mx-0 lg:self-start lg:pt-[62px]"
          />

          <div className="flex min-w-0 flex-col overflow-hidden">
            <ArchiveGrid items={filtered} categoryKey={active} projects={projectBySlug} />
          </div>
        </div>
      </m.div>
    </Section>
  )
}
