import { useRef } from "react"
import { m } from "framer-motion"

import { Section } from "@/components/section"
import { Timeline } from "@/components/timeline"
import { useSectionMotion } from "@/hooks/use-section-motion"
import { experiences } from "@/content/generated"

export function ExperiencesSection() {
  const ref = useRef<HTMLDivElement>(null)
  const { opacity, scale, translateY } = useSectionMotion(ref)

  return (
    <Section
      id="experiences"
      label="Experiences"
      className="bg-background"
      innerClassName="mx-auto flex w-full max-w-[1728px] flex-1 flex-col items-center justify-center px-6 py-24 sm:px-8"
    >
      <m.div
        ref={ref}
        style={{ opacity, scale, y: translateY }}
        className="flex min-h-[760px] w-full flex-col items-center justify-center lg:min-h-[920px]"
      >
        <header className="mx-auto mb-14 max-w-3xl text-center sm:mb-20">
          <m.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.1 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="mb-5 text-[10px] font-medium tracking-[0.36em] text-black/35"
          >
            02 · Where I&apos;ve Been
          </m.p>
          <m.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.1 }}
            transition={{ duration: 0.65, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
            className="text-balance text-5xl font-light leading-none tracking-[-0.04em] text-foreground sm:text-6xl"
          >
            The <span className="font-display font-normal">Experiences</span>
          </m.h2>
        </header>

        <Timeline items={experiences} />
      </m.div>
    </Section>
  )
}
