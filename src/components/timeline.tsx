import { useEffect, useMemo, useState } from "react"
import { AnimatePresence, m } from "framer-motion"
import { ArrowUpRight, ChevronDown, ChevronUp } from "lucide-react"

import type { Experience, ExperienceMedia as ExperienceMediaItem } from "@/content/types"
import { cn } from "@/lib/utils"

const DRAWER_TRANSITION = { type: "spring", stiffness: 260, damping: 30, mass: 0.8 } as const
const PREVIEW_OFFSET = { x: 22, y: 18 }

function formatYear(date?: string) {
  if (!date) return ""
  return new Date(date).getUTCFullYear().toString()
}

function formatDateRange(start: string, end?: string) {
  const startYear = formatYear(start)
  if (end && formatYear(end) === startYear) return startYear
  const endYear = end ? formatYear(end) : "Present"
  return `${startYear} to ${endYear}`
}

function withBase(path?: string) {
  if (!path) return undefined
  if (/^https?:/.test(path)) return path
  const base = import.meta.env.BASE_URL.replace(/\/+$/, "")
  const clean = path.replace(/^\//, "")
  return `${base}/${clean}`
}

type TimelineProps = {
  items: Experience[]
  className?: string
}

type PreviewState = {
  src?: string
  meta: string
  x: number
  y: number
  visible: boolean
}

export function Timeline({ items, className }: TimelineProps) {
  const getHashSlug = () => (typeof window === "undefined" ? "" : window.location.hash.replace(/^#/, ""))
  const hashSlug = getHashSlug()
  const initialSlug = items.some((item) => item.slug === hashSlug) ? hashSlug : ""
  const [activeSlug, setActiveSlug] = useState(initialSlug)
  const [preview, setPreview] = useState<PreviewState>({
    src: undefined,
    meta: "",
    x: 0,
    y: 0,
    visible: false,
  })
  const indexedItems = useMemo(() => items.map((item, index) => ({ item, index })), [items])

  useEffect(() => {
    if (typeof window === "undefined") return

    const openSlug = (slug?: string) => {
      if (slug && items.some((item) => item.slug === slug)) setActiveSlug(slug)
    }

    const openFromHash = () => openSlug(window.location.hash.replace(/^#/, ""))
    const openFromEvent = (event: Event) => openSlug((event as CustomEvent<{ slug?: string }>).detail?.slug)

    openFromHash()
    window.addEventListener("hashchange", openFromHash)
    window.addEventListener("experience:open", openFromEvent)
    return () => {
      window.removeEventListener("hashchange", openFromHash)
      window.removeEventListener("experience:open", openFromEvent)
    }
  }, [items])

  if (items.length === 0) {
    return (
      <p className={cn("mx-auto max-w-md text-center text-sm italic text-muted-foreground", className)}>
        Add experiences in <code className="font-mono text-xs">content/experiences/</code>.
      </p>
    )
  }

  const toggleDrawer = (slug: string) => {
    const nextSlug = activeSlug === slug ? "" : slug
    setActiveSlug(nextSlug)
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", nextSlug ? `/experiences#${nextSlug}` : "/experiences")
    }
  }

  const showPreview = (item: Experience, x: number, y: number) => {
    setPreview({
      src: withBase(item.logo),
      meta: item.role,
      x,
      y,
      visible: true,
    })
  }

  const movePreview = (item: Experience, x: number, y: number, pointerType?: string) => {
    if (pointerType === "touch") return
    showPreview(item, x, y)
  }

  const hidePreview = () => {
    setPreview((current) => ({ ...current, visible: false }))
  }

  return (
    <div
      className={cn(
        "relative mx-auto w-full max-w-[1180px]",
        className,
      )}
    >
      <div
        role="tablist"
        aria-label="Experiences"
        aria-orientation="vertical"
        className="relative overflow-hidden bg-background/30"
      >
        {indexedItems.map(({ item, index }) => {
          const isActive = item.slug === activeSlug
          return (
            <ExperienceDrawer
              key={item.slug}
              item={item}
              index={index}
              isActive={isActive}
              onOpen={() => toggleDrawer(item.slug)}
              onPreview={movePreview}
              onPreviewLeave={hidePreview}
            />
          )
        })}
      </div>

      <AnimatePresence>
        {preview.visible && preview.src && (
          <m.div
            initial={{
              opacity: 0,
              scale: 0.96,
              rotate: -1,
              x: preview.x + PREVIEW_OFFSET.x,
              y: preview.y + PREVIEW_OFFSET.y,
            }}
            animate={{
              opacity: 1,
              scale: 1,
              rotate: 0,
              x: preview.x + PREVIEW_OFFSET.x,
              y: preview.y + PREVIEW_OFFSET.y,
            }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 420, damping: 34, mass: 0.55 }}
            className="pointer-events-none fixed left-0 top-0 z-50 hidden w-[156px] overflow-hidden bg-[#efede2] p-2 pb-7 shadow-polaroid lg:block"
            aria-hidden="true"
          >
            <img
              src={preview.src}
              alt=""
              className="aspect-4/5 w-full object-cover saturate-[0.9] contrast-[0.96] sepia-[0.08]"
            />
            <div className="sr-only">{preview.meta}</div>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  )
}

type ExperienceMediaProps = {
  items?: ExperienceMediaItem[]
}

function getYouTubeId(url: string) {
  return url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{6,})/)?.[1]
}

function getVimeoId(url: string) {
  return url.match(/vimeo\.com\/(?:video\/)?(\d+)/)?.[1]
}

function embedSrcFor(item: ExperienceMediaItem) {
  if (item.type === "youtube") {
    const id = getYouTubeId(item.url)
    return id ? `https://www.youtube-nocookie.com/embed/${id}` : item.url
  }
  if (item.type === "vimeo") {
    const id = getVimeoId(item.url)
    return id ? `https://player.vimeo.com/video/${id}` : item.url
  }
  if (item.type === "iframe") return item.url
  return undefined
}

function ExperienceMedia({ items }: ExperienceMediaProps) {
  if (!items || items.length === 0) return null

  return (
    <div className="mt-7 grid gap-4">
      {items.map((item, index) => {
        const title = item.title ?? "Experience media"
        const embedSrc = embedSrcFor(item)

        if (item.type === "image") {
          return (
            <figure key={`${item.url}-${index}`} className="overflow-hidden border border-black/10 bg-white/35 p-2">
              <img
                src={withBase(item.url)}
                alt={title}
                loading="lazy"
                decoding="async"
                className="aspect-video w-full object-cover"
              />
            </figure>
          )
        }

        if (embedSrc) {
          return (
            <div key={`${item.url}-${index}`} className="overflow-hidden border border-black/10 bg-white/35 p-2">
              <iframe
                src={embedSrc}
                title={title}
                loading="lazy"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="aspect-video w-full"
              />
            </div>
          )
        }

        return (
          <m.a
            key={`${item.url}-${index}`}
            href={item.url}
            target="_blank"
            rel="noreferrer"
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.985 }}
            transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
            className="group inline-flex w-fit items-center gap-2 rounded-full border border-black/15 bg-white/35 px-4 py-2 text-sm font-light uppercase tracking-[0.18em] text-black/60 transition hover:border-black/30 hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-background"
          >
            {title}
            <ArrowUpRight className="size-4 transition-transform duration-200 ease-out group-hover:-translate-y-0.5 group-hover:translate-x-0.5" strokeWidth={1.8} />
          </m.a>
        )
      })}
    </div>
  )
}

type ExperienceDrawerProps = {
  item: Experience
  index: number
  isActive: boolean
  onOpen: () => void
  onPreview: (item: Experience, x: number, y: number, pointerType?: string) => void
  onPreviewLeave: () => void
}

function ExperienceDrawer({
  item,
  index,
  isActive,
  onOpen,
  onPreview,
  onPreviewLeave,
}: ExperienceDrawerProps) {
  const imageSrc = withBase(item.logo)
  const visitLabel = item.visitLabel ?? (item.href ? "visit" : "work sample coming soon")

  return (
    <m.article
      layout
      transition={DRAWER_TRANSITION}
      className={cn(
        "relative border-t border-black/15 first:border-t-0",
        isActive ? "bg-white/35" : "bg-transparent",
      )}
    >
      <m.button
        type="button"
        layout="position"
        role="tab"
        aria-selected={isActive}
        aria-expanded={isActive}
        aria-controls={`experience-panel-${item.slug}`}
        id={`experience-tab-${item.slug}`}
        onClick={onOpen}
        onPointerEnter={(event) => onPreview(item, event.clientX, event.clientY, event.pointerType)}
        onPointerMove={(event) => onPreview(item, event.clientX, event.clientY, event.pointerType)}
        onPointerLeave={onPreviewLeave}
        onFocus={(event) => {
          const rect = event.currentTarget.getBoundingClientRect()
          onPreview(item, rect.right - 120, rect.top + rect.height / 2)
        }}
        onBlur={onPreviewLeave}
        whileHover={!isActive ? { x: 6 } : undefined}
        whileTap={{ scale: 0.995 }}
        transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
        className="group grid w-full grid-cols-[3.25rem_minmax(0,1fr)] gap-4 px-4 py-5 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-background sm:grid-cols-[4.25rem_minmax(0,1fr)_auto] sm:px-7 sm:py-6"
      >
        <span className="pt-1 font-display text-2xl leading-none text-black/30 sm:text-3xl">
          {String(index + 1).padStart(2, "0")}
        </span>

        <span className="min-w-0">
          <span className="block text-balance text-3xl font-light leading-none tracking-[-0.045em] text-black/85 sm:text-[2.85rem]">
            {item.company}
          </span>
          <span className="mt-2 block text-sm font-light uppercase tracking-[0.24em] text-black/45">
            {item.role}
          </span>
        </span>

        <span className="col-span-2 flex items-center justify-between gap-4 text-sm font-light uppercase tracking-[0.22em] text-black/45 sm:col-span-1 sm:justify-end">
          <span>{formatDateRange(item.dateStart, item.dateEnd)}</span>
          <m.span
            aria-hidden="true"
            animate={isActive ? { y: -1 } : { y: 1 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="grid size-8 place-items-center rounded-full border border-black/15 text-black/55 transition-colors group-hover:border-black/30 group-hover:text-black"
          >
            {isActive ? <ChevronUp className="size-4" strokeWidth={1.8} /> : <ChevronDown className="size-4" strokeWidth={1.8} />}
          </m.span>
        </span>
      </m.button>

      <AnimatePresence initial={false}>
        {isActive && (
          <m.div
            key="content"
            id={`experience-panel-${item.slug}`}
            role="tabpanel"
            aria-labelledby={`experience-tab-${item.slug}`}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={DRAWER_TRANSITION}
            className="overflow-hidden"
          >
            <div className="grid gap-8 px-4 pb-8 pt-1 sm:px-7 lg:grid-cols-[minmax(0,1fr)_220px] lg:gap-12">
              <div className="pl-17 sm:pl-21">
                <p className="max-w-[720px] text-pretty text-xl font-light leading-[1.34] text-black/75 sm:text-2xl">
                  {item.summary}
                </p>

                {item.html && (
                  <div
                    className="prose-content mt-6 max-w-[720px] text-base font-light leading-7 text-black/70 sm:text-lg sm:leading-8"
                    dangerouslySetInnerHTML={{ __html: item.html }}
                  />
                )}

                <ExperienceMedia items={item.media} />

                {item.href ? (
                  <m.a
                    href={item.href}
                    target="_blank"
                    rel="noreferrer"
                    whileHover={{ y: -1 }}
                    whileTap={{ scale: 0.985 }}
                    transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
                    className="group mt-7 inline-flex items-center gap-2 rounded-full border border-black/15 px-5 py-2.5 text-sm font-light uppercase tracking-[0.18em] text-black/70 transition hover:border-black/35 hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-background"
                  >
                    {visitLabel}
                    <ArrowUpRight className="size-5 transition-transform duration-200 ease-out group-hover:-translate-y-0.5 group-hover:translate-x-0.5" strokeWidth={1.8} />
                  </m.a>
                ) : (
                  <span className="mt-7 inline-flex items-center rounded-full border border-black/10 px-5 py-2.5 text-sm font-light uppercase tracking-[0.18em] text-black/35">
                    {visitLabel}
                  </span>
                )}
              </div>

              {imageSrc && (
                <figure className="group hidden rotate-[1.6deg] self-start bg-[#efede2] p-3 pb-9 shadow-polaroid transition-transform duration-300 ease-out hover:rotate-0 lg:block">
                  <img
                    src={imageSrc}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    className="polaroid-photo aspect-4/5 w-full object-cover saturate-[0.9] contrast-[0.96] sepia-[0.08]"
                  />
                </figure>
              )}
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </m.article>
  )
}
