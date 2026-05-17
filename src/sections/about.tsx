import { useRef } from "react"
import { m } from "framer-motion"

import { PolaroidString } from "@/components/polaroid-string"
import type { StringPolaroid } from "@/components/polaroid-string"
import type { PolaroidPlaceholderKind } from "@/components/polaroid-placeholder"
import { Section } from "@/components/section"
import { useSectionMotion } from "@/hooks/use-section-motion"
import { site } from "@/content/generated"

function withBase(path?: string) {
  if (!path) return undefined
  if (/^https?:/.test(path)) return path
  const base = import.meta.env.BASE_URL.replace(/\/+$/, "")
  const clean = path.replace(/^\//, "")
  return `${base}/${clean}`
}

export function AboutSection() {
  const ref = useRef<HTMLDivElement>(null)
  const { opacity, scale, translateY } = useSectionMotion(ref)

  const bioParagraphs = site.bio.split(/\n+/).map((p) => p.trim()).filter(Boolean)

  const DEFAULTS: { kind: PolaroidPlaceholderKind; caption: string }[] = [
    { kind: "on-set", caption: "on set" },
    { kind: "lens", caption: "the lens" },
    { kind: "sync", caption: "sync." },
    { kind: "podcast", caption: "journey tellers" },
  ]

  const polaroids: StringPolaroid[] = DEFAULTS.map((defaults, index) => {
    const cms = site.polaroids?.[index]
    return {
      src: withBase(cms?.src),
      alt: cms?.alt ?? defaults.caption,
      caption: cms?.caption ?? defaults.caption,
      placeholderKind: defaults.kind,
    }
  })

  const left = polaroids.slice(0, 2)
  const right = polaroids.slice(2, 4)

  return (
    <Section
      id="about"
      label="About"
      className="bg-background"
      innerClassName="mx-auto flex w-full max-w-[1500px] flex-1 flex-col items-center justify-center px-4 py-16 sm:px-8 sm:py-24"
    >
      <m.div
        ref={ref}
        style={{ opacity, scale, y: translateY }}
        className="flex w-full flex-col items-center justify-center"
      >
          <PolaroidString left={left} right={right} className="w-full">
            <div className="mx-auto flex max-w-[560px] flex-col items-center text-center">
              <m.h2
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.1 }}
                transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
                className="text-balance text-3xl font-light text-foreground sm:text-4xl md:text-5xl"
              >
                <span aria-hidden="true" className="mr-2 inline-block">👋</span>
                Hey, I&apos;m{" "}
                <span className="font-display italic">{site.shortName ?? site.name}</span>
              </m.h2>

              <div className="mt-8 space-y-5 text-pretty text-base leading-7 text-foreground/85 sm:text-[17px] sm:leading-8">
                {bioParagraphs.map((paragraph, index) => (
                  <m.p
                    key={index}
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.1 }}
                    transition={{
                      duration: 0.6,
                      delay: 0.08 * (index + 1),
                      ease: [0.22, 1, 0.36, 1],
                    }}
                  >
                    {paragraph}
                  </m.p>
                ))}
              </div>
            </div>
          </PolaroidString>
      </m.div>
    </Section>
  )
}
