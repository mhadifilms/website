import { useMemo, useRef, useState } from "react"
import { m } from "framer-motion"
import { Search } from "lucide-react"

import { ArchiveGrid } from "@/components/archive-grid"
import { Section } from "@/components/section"
import { CategorySwitcher } from "@/components/social-switcher"
import { useSectionMotion } from "@/hooks/use-section-motion"
import { archives, projects } from "@/content/generated"
import type { ArchiveItem, Project, ProjectType } from "@/content/types"

const PROJECT_TYPE_ORDER: ProjectType[] = ["Writing", "Video", "Tools", "Profiles"]

export function ArchivesSection() {
  const ref = useRef<HTMLDivElement>(null)
  const { opacity, scale, translateY } = useSectionMotion(ref)
  const [active, setActive] = useState<ProjectType>("Writing")
  const [query, setQuery] = useState("")

  const categories = useMemo<ProjectType[]>(() => {
    const present = new Set(archives.map((item) => item.projectType))
    const ordered = PROJECT_TYPE_ORDER.filter((category) => present.has(category))
    const rest = [...present].filter((category) => !PROJECT_TYPE_ORDER.includes(category)).sort()
    return ordered.length > 0 || rest.length > 0 ? [...ordered, ...rest] : PROJECT_TYPE_ORDER
  }, [])

  const projectBySlug = useMemo(() => new Map(projects.map((project) => [project.slug, project])), [])
  const filtered = useMemo(
    () =>
      archives
        .filter((item) => item.projectType === active)
        .filter((item) => matchesArchiveQuery(item, projectBySlug.get(item.project ?? ""), query))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [active, projectBySlug, query],
  )
  const totalForCategory = useMemo(() => archives.filter((item) => item.projectType === active).length, [active])
  const trimmedQuery = query.trim()

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
            className="text-balance text-[clamp(2.15rem,5.7vw,3.8rem)] font-light leading-none tracking-[-0.05em] text-foreground/90"
          >
            The <span className="font-display font-normal text-black/90">Archives</span>
          </m.h2>
        </header>

        <div className="mx-auto grid w-full max-w-[1540px] gap-8 lg:grid-cols-[180px_minmax(0,1fr)] lg:gap-[22px]">
          <CategorySwitcher
            categories={categories}
            active={active}
            onSelect={(category) => setActive(category as ProjectType)}
            className="mx-auto self-center lg:mx-0 lg:self-start lg:pt-[62px]"
          />

          <div className="flex min-w-0 flex-col overflow-hidden">
            <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <label className="group relative flex h-9 w-full max-w-[360px] items-center border border-black/10 bg-white/25 px-3 transition focus-within:border-black/25 sm:w-[42vw] xl:w-[320px]">
                <Search className="mr-2 size-3.5 text-black/30 transition group-focus-within:text-black/55" strokeWidth={1.6} />
                <span className="sr-only">Search archives</span>
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search archives"
                  className="h-9 min-w-0 flex-1 bg-transparent text-xs font-light text-black outline-none placeholder:text-black/30"
                  type="search"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    className="ml-3 text-[10px] font-light uppercase tracking-[0.18em] text-black/40 transition hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-background"
                  >
                    Clear
                  </button>
                )}
              </label>

              <p className="whitespace-nowrap text-[10px] font-light uppercase tracking-[0.18em] text-black/35">
                {filtered.length} of {totalForCategory}
                {trimmedQuery ? " matches" : " latest"}
              </p>
            </div>

            <ArchiveGrid
              key={`${active}-${trimmedQuery}`}
              items={filtered}
              categoryKey={active}
              projects={projectBySlug}
            />
          </div>
        </div>
      </m.div>
    </Section>
  )
}

function matchesArchiveQuery(item: ArchiveItem, project: Project | undefined, query: string) {
  const normalizedQuery = query.trim().toLowerCase()
  if (!normalizedQuery) return true

  return [
    item.title,
    item.summary,
    item.platform,
    item.entryType,
    item.date,
    project?.title,
    project?.summary,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .includes(normalizedQuery)
}

