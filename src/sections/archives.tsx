import { useRef } from "react"
import { m } from "framer-motion"

import { ArchiveFolders } from "@/components/archive-folders"
import { Section } from "@/components/section"
import { useSectionMotion } from "@/hooks/use-section-motion"
import { archives, projects } from "@/content/generated"

export function ArchivesSection() {
  const ref = useRef<HTMLDivElement>(null)
  const { opacity, scale, translateY } = useSectionMotion(ref)

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
        <header className="mx-auto mb-10 max-w-[760px] text-center">
          <m.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.1 }}
            transition={{ duration: 0.65, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
            className="text-balance text-[clamp(2.15rem,5.7vw,3.8rem)] font-light leading-none tracking-[-0.05em] text-foreground/90"
          >
            The <span className="font-display font-normal text-black/90">Archives</span>
          </m.h2>
          <m.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.1 }}
            transition={{ duration: 0.65, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
            className="mx-auto mt-5 max-w-[40rem] text-sm font-light leading-6 text-black/55"
          >
            Being creative is mostly learning how to experiment across formats: essays, vlogs, films,
            commercial work, photos, tools, and whatever weird folder the next idea needs to live in.
          </m.p>
        </header>

        <div className="mx-auto w-full max-w-[1540px]">
          <ArchiveFolders items={archives} projects={projects} />
        </div>
      </m.div>
    </Section>
  )
}
