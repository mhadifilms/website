import { Link, Navigate, useParams } from "react-router-dom"
import { ArrowLeft, ArrowRight, ArrowUpRight } from "lucide-react"

import { archives, projects } from "@/content/generated"
import type { ArchiveItem } from "@/content/types"
import {
  archiveCategoryFromSlug,
  archiveEntryPath,
  archiveFormatLabel,
  archiveSourceCtaLabel,
  seriesRun,
  youtubeId,
} from "@/lib/archive-utils"

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" })
}

export default function ArchiveEntryPage() {
  const { categorySlug = "", entrySlug = "" } = useParams()
  const category = archiveCategoryFromSlug(categorySlug)
  const item = category
    ? archives.find((archive) => archive.category === category && archive.slug === entrySlug)
    : undefined

  if (!item) return <Navigate to="/archives" replace />

  const project = projects.find((candidate) => candidate.slug === item.project)
  const run = seriesRun(archives, item)
  const related = archives
    .filter((candidate) => candidate.slug !== item.slug && candidate.project === item.project)
    .slice(0, 3)

  return (
    <main id="content" className="min-h-svh bg-background px-6 py-14 text-foreground sm:px-8">
      <article className="mx-auto w-full max-w-[1040px]">
        <Link
          to="/archives"
          className="inline-flex items-center gap-2 text-xs font-light uppercase tracking-[0.2em] text-black/45 transition hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-background"
        >
          <ArrowLeft className="size-4" strokeWidth={1.6} />
          Back to archives
        </Link>

        <header className="mt-12">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] font-light uppercase tracking-[0.22em] text-black/45">
            <span>{item.category}</span>
            {project && (
              <>
                <span aria-hidden="true">/</span>
                <span>{project.title}</span>
              </>
            )}
            <span aria-hidden="true">/</span>
            <span>{archiveFormatLabel(item.format)}</span>
            <span aria-hidden="true">/</span>
            <span>{formatDate(item.date)}</span>
          </div>

          <h1 className="mt-4 text-balance font-display text-[clamp(2.35rem,7vw,5.25rem)] font-normal leading-[0.92] tracking-[-0.055em] text-black/90">
            {item.title}
          </h1>

          {item.dek && (
            <p className="mt-6 max-w-[46rem] text-pretty text-lg font-light leading-8 text-black/65 sm:text-xl">
              {item.dek}
            </p>
          )}

          <dl className="mt-8 flex flex-wrap gap-x-10 gap-y-4 border-y border-black/10 py-4">
            <Field label="Role" value={item.role} />
            <Field label="Format" value={archiveFormatLabel(item.format)} />
            <Field label="Source" value={item.platform} />
            {run.total > 1 && <Field label="In series" value={`${run.position} of ${run.total}`} />}
          </dl>
        </header>

        <ArchiveArtifact item={item} />

        <div className="mt-12 grid gap-10 lg:grid-cols-[minmax(0,1fr)_260px] lg:gap-14">
          <div
            className="prose-content max-w-none text-[1.02rem] font-light leading-8 text-black/72"
            dangerouslySetInnerHTML={{ __html: item.html }}
          />

          <aside className="space-y-5 lg:pt-1">
            <a
              href={item.href}
              target="_blank"
              rel="noreferrer"
              className="inline-flex w-full items-center justify-center gap-2 border border-black bg-black px-5 py-3 text-xs font-light uppercase tracking-[0.18em] text-background shadow-[4px_4px_0_0_rgba(0,0,0,0.22)] transition hover:-translate-y-0.5 hover:shadow-[6px_6px_0_0_rgba(0,0,0,0.38)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-background"
            >
              {archiveSourceCtaLabel(item)}
              <ArrowUpRight className="size-4" strokeWidth={1.8} />
            </a>

            {item.credits && (
              <div className="border border-black/10 bg-white/30 p-4">
                <p className="text-[10px] font-light uppercase tracking-[0.22em] text-black/40">Credits</p>
                <p className="mt-2 whitespace-pre-line text-sm font-light leading-6 text-black/65">{item.credits}</p>
              </div>
            )}

            {project && (
              <div className="border border-black/10 bg-white/30 p-4">
                <p className="text-[10px] font-light uppercase tracking-[0.22em] text-black/40">Series</p>
                <p className="mt-2 font-display text-2xl font-normal leading-none tracking-[-0.035em] text-black/85">{project.title}</p>
                <p className="mt-3 text-xs font-light leading-5 text-black/55">{project.summary}</p>
              </div>
            )}
          </aside>
        </div>

        {(run.previous || run.next) && (
          <nav className="mt-16 grid gap-4 border-t border-black/10 pt-8 sm:grid-cols-2">
            <SeriesNavLink item={run.previous} direction="prev" />
            <SeriesNavLink item={run.next} direction="next" />
          </nav>
        )}

        {related.length > 0 && (
          <section className="mt-12 border-t border-black/10 pt-8">
            <p className="text-[10px] font-light uppercase tracking-[0.24em] text-black/40">More from this series</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              {related.map((relatedItem) => (
                <Link
                  key={relatedItem.slug}
                  to={archiveEntryPath(relatedItem)}
                  className="group border border-black/10 bg-white/25 p-4 transition hover:-translate-y-1 hover:border-black/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-background"
                >
                  <p className="text-[10px] font-light uppercase tracking-[0.18em] text-black/40">
                    {archiveFormatLabel(relatedItem.format)} / {new Date(relatedItem.date).getFullYear()}
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

function Field({ label, value }: { label: string; value?: string }) {
  if (!value) return null
  return (
    <div className="min-w-0">
      <dt className="text-[10px] font-light uppercase tracking-[0.22em] text-black/40">{label}</dt>
      <dd className="mt-1 text-sm font-normal text-black/80">{value}</dd>
    </div>
  )
}

function SeriesNavLink({ item, direction }: { item?: ArchiveItem; direction: "prev" | "next" }) {
  if (!item) return <div className="hidden sm:block" aria-hidden="true" />
  const isNext = direction === "next"
  return (
    <Link
      to={archiveEntryPath(item)}
      className={`group flex flex-col gap-2 border border-black/10 bg-white/25 p-4 transition hover:-translate-y-0.5 hover:border-black/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-background ${isNext ? "sm:text-right" : ""}`}
    >
      <span className={`inline-flex items-center gap-1 text-[10px] font-light uppercase tracking-[0.2em] text-black/40 ${isNext ? "sm:justify-end" : ""}`}>
        {!isNext && <ArrowLeft className="size-3.5" strokeWidth={1.6} />}
        {isNext ? "Next in series" : "Previous in series"}
        {isNext && <ArrowRight className="size-3.5" strokeWidth={1.6} />}
      </span>
      <span className="line-clamp-2 text-sm font-light leading-5 text-black/80 group-hover:text-black">{item.title}</span>
    </Link>
  )
}

function ArchiveArtifact({ item }: { item: ArchiveItem }) {
  const id = youtubeId(item.href)
  const isVideoFormat = ["video", "podcast", "short-film", "commercial"].includes(item.format)

  if (isVideoFormat && id) {
    return (
      <figure className="mt-10">
        <div className="overflow-hidden border-2 border-black bg-black shadow-[8px_8px_0_0_rgba(0,0,0,0.18)]">
          <iframe
            title={item.title}
            src={`https://www.youtube.com/embed/${id}`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="aspect-video w-full"
          />
        </div>
        <figcaption className="mt-2 text-[10px] font-light uppercase tracking-[0.2em] text-black/40">
          {archiveFormatLabel(item.format)} · {item.platform}
        </figcaption>
      </figure>
    )
  }

  if (item.format === "photo-set" && item.gallery && item.gallery.length > 0) {
    return (
      <figure className="mt-10">
        <div className="grid gap-3 sm:grid-cols-2">
          {item.gallery.map((src, index) => (
            <div key={src} className="overflow-hidden border-2 border-black bg-white shadow-[6px_6px_0_0_rgba(0,0,0,0.16)]">
              <img
                src={src}
                alt={`${item.title} — frame ${index + 1}`}
                loading={index === 0 ? "eager" : "lazy"}
                decoding="async"
                className="block aspect-[4/3] w-full object-cover"
              />
            </div>
          ))}
        </div>
        <figcaption className="mt-2 text-[10px] font-light uppercase tracking-[0.2em] text-black/40">
          Photo set · {item.gallery.length} frames
        </figcaption>
      </figure>
    )
  }

  if (!item.image) return null

  return (
    <figure className="mt-10">
      <div className="overflow-hidden border-2 border-black bg-white shadow-[8px_8px_0_0_rgba(0,0,0,0.18)]">
        <img
          src={item.image}
          alt={item.title}
          loading="eager"
          decoding="async"
          className="block aspect-video w-full object-cover"
        />
      </div>
      <figcaption className="mt-2 text-[10px] font-light uppercase tracking-[0.2em] text-black/40">
        {archiveFormatLabel(item.format)} · {item.platform}
      </figcaption>
    </figure>
  )
}
