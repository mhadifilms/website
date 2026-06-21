import { useEffect, useMemo } from "react"
import { useMotionValue } from "framer-motion"
import { useLocation } from "react-router-dom"

import { HeroPolaroidLayer } from "@/components/hero-polaroid-layer"
import { PillNav } from "@/components/pill-nav"
import { SeoMetadata } from "@/components/seo-metadata"
import { SiteFooter } from "@/components/site-footer"
import { AboutSection } from "@/sections/about"
import { ArchivesSection } from "@/sections/archives"
import { ExperiencesSection } from "@/sections/experiences"
import { HomeSection } from "@/sections/home"
import { SectionContext } from "@/hooks/section-context"
import { buildSections, useSectionRouter } from "@/hooks/use-section-router"

export default function SitePage() {
  const location = useLocation()
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

  useEffect(() => {
    const path = location.pathname.replace(/\/+$/, "") || "/"
    const target = sections.find((section) => section.path === path)
    if (!target) return

    const timeout = window.setTimeout(() => {
      scrollToId(target.id, { behavior: "auto" })
    }, 120)

    return () => window.clearTimeout(timeout)
  }, [location.pathname, scrollToId, sections])

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
      <HeroPolaroidLayer />
      <PillNav />
    </SectionContext.Provider>
  )
}
