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
      innerClassName="mx-auto flex w-full max-w-[1500px] flex-1 flex-col items-center justify-center px-4 py-20 sm:px-8 sm:py-24"
    >
      <m.div
        ref={ref}
        style={{ opacity, scale, y: translateY }}
        className="flex w-full flex-col items-center"
      >
        <header className="mx-auto mb-10 max-w-3xl text-center sm:mb-14">
          <m.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.1 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="font-mono text-xs uppercase tracking-[0.4em] text-muted-foreground"
          >
            A working timeline
          </m.p>
          <m.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.1 }}
            transition={{ duration: 0.65, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
            className="mt-3 text-balance font-display text-5xl leading-[1] tracking-tight text-foreground sm:text-6xl md:text-7xl"
          >
            <span className="italic">experiences</span>
            <span className="font-display">.</span>
          </m.h2>
        </header>

        <Timeline items={experiences} />
      </m.div>
    </Section>
  )
}
