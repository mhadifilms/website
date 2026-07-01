import { Suspense, lazy, useMemo } from "react"
import { useMotionValue } from "framer-motion"

import { PillNav } from "@/components/pill-nav"
import { SeoMetadata } from "@/components/seo-metadata"
import { SiteFooter } from "@/components/site-footer"
import { AboutSection } from "@/sections/about"
import { ArchivesSection } from "@/sections/archives"
import { ExperiencesSection } from "@/sections/experiences"
import { HomeSection } from "@/sections/home"
import { SectionContext } from "@/hooks/section-context"
import { buildSections, useSectionRouter } from "@/hooks/use-section-router"

// GSAP (plus ScrollTrigger/Flip) only serves the hero polaroid scene, so it
// loads as its own chunk without blocking the initial render.
const HeroPolaroidLayer = lazy(() =>
  import("@/components/hero-polaroid-layer").then((module) => ({ default: module.HeroPolaroidLayer })),
)

export default function SitePage() {
  const homeScrollProgress = useMotionValue(0)
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
        <HomeSection transitionProgress={homeScrollProgress} />
        <AboutSection transitionProgress={homeScrollProgress} />
        <ExperiencesSection />
        <ArchivesSection />
        <SiteFooter />
      </main>
      <Suspense fallback={null}>
        <HeroPolaroidLayer />
      </Suspense>
      <PillNav />
    </SectionContext.Provider>
  )
}
