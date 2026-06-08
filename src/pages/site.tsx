import { useMemo } from "react"

import { PillNav } from "@/components/pill-nav"
import { SeoMetadata } from "@/components/seo-metadata"
import { AboutSection } from "@/sections/about"
import { ArchivesSection } from "@/sections/archives"
import { ExperiencesSection } from "@/sections/experiences"
import { HomeSection } from "@/sections/home"
import { SectionContext } from "@/hooks/section-context"
import { buildSections, useSectionRouter } from "@/hooks/use-section-router"

export default function SitePage() {
  const sections = useMemo(
    () =>
      buildSections([
        { id: "home", slug: "", label: "Home" },
        { id: "about", slug: "about", label: "About" },
        { id: "experiences", slug: "experiences", label: "Experiences" },
        { id: "archives", slug: "archives", label: "Archives" },
      ]),
    [],
  )

  const { activeId, register, scrollToId } = useSectionRouter(sections)

  const contextValue = useMemo(
    () => ({ sections, activeId, register, scrollToId }),
    [sections, activeId, register, scrollToId],
  )

  return (
    <SectionContext.Provider value={contextValue}>
      <SeoMetadata activeId={activeId} />
      <main id="content">
        <HomeSection />
        <AboutSection />
        <ExperiencesSection />
        <ArchivesSection />
      </main>
      <PillNav />
    </SectionContext.Provider>
  )
}
