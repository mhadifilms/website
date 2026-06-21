import { Link, Navigate, useParams } from "react-router-dom"
import { ArrowLeft, ArrowUpRight } from "lucide-react"

import { archives, projects } from "@/content/generated"
import type { ArchiveItem } from "@/content/types"
import { archiveCategoryFromSlug, archiveEntryPath, youtubeId } from "@/lib/archive-utils"

export default function ArchiveEntryPage() {
  const { categorySlug = "", entrySlug = "" } = useParams()
  const category = archiveCategoryFromSlug(categorySlug)
  const item = category
    ? archives.find((archive) => archive.category === category && archive.slug === entrySlug)
    : undefined

  if (!item) return <Navigate to="/archives" replace />

  const project = item.project ? projects.find((candidate) => candidate.slug === item.project) : undefined
  const related = archives
    .filter((candidate) => candidate.slug !== item.slug && candidate.project === item.project)
    .slice(0, 3)

  return (
    <main id="content" className="min-h-svh bg-background px-6 py-14 text-foreground sm:px-8">
      <article className="mx-auto w-full max-w-[980px]">
        <Link
          to="/archives"
          className="inline-flex items-center gap-2 text-xs font-light uppercase tracking-[0.2em] text-black/45 transition hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-background"
        >
          <ArrowLeft className="size-4" strokeWidth={1.6} />
          Back to archives
        </Link>

        <header className="mt-12">
          <div className="flex flex-wrap items-center gap-2 text-[10px] font-light uppercase tracking-[0.22em] text-black/45">
            <span>{item.category}</span>
            {project && (
              <>
                <span aria-hidden="true">/</span>
                <span>{project.title}</span>
              </>
            )}
            <span aria-hidden="true">/</span>
            <span>{new Date(item.date).toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" })}</span>
          </div>

          <h1 className="mt-4 text-balance font-display text-[clamp(2.35rem,7vw,5.25rem)] font-normal leading-[0.92] tracking-[-0.055em] text-black/90">
            {item.title}
          </h1>

          {item.summary && (
            <p className="mt-6 max-w-[44rem] text-base font-light leading-7 text-black/60">
              {item.summary}
            </p>
          )}
        </header>

        <ArchiveHero item={item} />

        <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_220px] lg:gap-14">
          <div
            className="prose-content max-w-none text-[0.98rem] font-light leading-8 text-black/72"
            dangerouslySetInnerHTML={{ __html: item.html }}
          />

          <aside className="space-y-6 lg:pt-1">
            <a
              href={item.href}
              target="_blank"
              rel="noreferrer"
              className="inline-flex w-full items-center justify-center gap-2 border border-black bg-black px-5 py-3 text-xs font-light uppercase tracking-[0.18em] text-background shadow-[4px_4px_0_0_rgba(0,0,0,0.22)] transition hover:-translate-y-0.5 hover:shadow-[6px_6px_0_0_rgba(0,0,0,0.38)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-background"
            >
              {item.platform === "YouTube" ? "Watch original" : item.platform === "Substack" ? "Read the rest" : "Open original"}
              <ArrowUpRight className="size-4" strokeWidth={1.8} />
            </a>

            {project && (
              <div className="border border-black/10 bg-white/30 p-4">
                <p className="text-[10px] font-light uppercase tracking-[0.22em] text-black/40">Series</p>
                <p className="mt-2 font-display text-2xl font-normal leading-none tracking-[-0.035em] text-black/85">{project.title}</p>
                <p className="mt-3 text-xs font-light leading-5 text-black/55">{project.summary}</p>
              </div>
            )}
          </aside>
        </div>

        {related.length > 0 && (
          <section className="mt-16 border-t border-black/10 pt-8">
            <p className="text-[10px] font-light uppercase tracking-[0.24em] text-black/40">More from this series</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              {related.map((relatedItem) => (
                <Link
                  key={relatedItem.slug}
                  to={archiveEntryPath(relatedItem)}
                  className="group border border-black/10 bg-white/25 p-4 transition hover:-translate-y-1 hover:border-black/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-background"
                >
                  <p className="text-[10px] font-light uppercase tracking-[0.18em] text-black/40">
                    {relatedItem.platform} / {new Date(relatedItem.date).getFullYear()}
                  </p>
                  <p className="mt-2 line-clamp-3 text-sm font-light leading-5 text-black/75 group-hover:text-black">{relatedItem.title}</p>
                </Link>
              ))}
            </div>
          </section>
        )}
      </article>
    </main>
  )
}

function ArchiveHero({ item }: { item: ArchiveItem }) {
  const id = youtubeId(item.href)

  if (item.platform === "YouTube" && id) {
    return (
      <div className="mt-10 overflow-hidden border-2 border-black bg-black shadow-[8px_8px_0_0_rgba(0,0,0,0.18)]">
        <iframe
          title={item.title}
          src={`https://www.youtube.com/embed/${id}`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="aspect-video w-full"
        />
      </div>
    )
  }

  if (!item.image) return null

  return (
    <div className="mt-10 overflow-hidden border-2 border-black bg-white shadow-[8px_8px_0_0_rgba(0,0,0,0.18)]">
      <img
        src={item.image}
        alt={item.title}
        loading="eager"
        decoding="async"
        className="block aspect-video w-full object-cover"
      />
    </div>
  )
}
