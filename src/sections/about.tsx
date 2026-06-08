import { Section } from "@/components/section"

export function AboutSection() {
  return (
    <Section
      id="about"
      label="About"
      className="h-px min-h-0 snap-none overflow-hidden bg-background"
      innerClassName="h-px"
    >
      <p className="sr-only">
        About content is revealed inside the Macintosh screen during the opening scroll sequence.
      </p>
    </Section>
  )
}
