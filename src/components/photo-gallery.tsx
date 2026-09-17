import { useMemo, useState } from "react"
import { ArticleMedia } from "@/cms/article-media"
import type { ArchiveItem } from "@/content/types"
import { cn } from "@/lib/utils"
import "@/cms/cms.css"

const escape = (value: string) => value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]!)

export function PhotoGallery({ item }: { item: ArchiveItem }) {
  const [category, setCategory] = useState<string | null>(null)
  const groups: [string | null, string[]][] = [[null, item.gallery ?? []], ...Object.entries(item.galleryCategories ?? {})]
  const html = useMemo(() => {
    const photos = (category && item.galleryCategories?.[category]) || item.gallery || []
    return `<figure class="photography-contact-sheet"><div class="grid grid-cols-2 gap-3 sm:grid-cols-3">${photos.map((src, index) => {
      const thumbnail = src.startsWith("https://cdn.awaiten.com/cdn-cgi/image/")
        ? src.replace(/\/cdn-cgi\/image\/[^/]+\//, "/cdn-cgi/image/width=640,quality=75,format=auto/")
        : src
      return `<a href="${escape(src)}" data-gallery-image class="block overflow-hidden border border-black/15 bg-white/40 focus-visible:outline-2 focus-visible:outline-offset-4" aria-label="Enlarge ${escape(item.title)} — photo ${index + 1}"><img src="${escape(thumbnail)}" alt="${escape(item.title)} — photo ${index + 1}" loading="lazy" decoding="async" style="display:block;width:100%;height:100%;aspect-ratio:1;object-fit:contain;margin:0" /></a>`
    }).join("")}</div><figcaption>${escape(item.title)} · ${photos.length} photographs${category ? ` · ${escape(category)}` : ""}</figcaption></figure>`
  }, [item.gallery, item.galleryCategories, item.title, category])

  return (
    <section className="mt-10" aria-label={`${item.title} photographs`}>
      {groups.length > 1 && (
        <div className="mb-5 flex flex-wrap gap-2" role="group" aria-label="Photo collections">
          {groups.map(([name, images]) => (
            <button
              key={name ?? "all"}
              type="button"
              aria-pressed={category === name}
              onClick={() => setCategory(name)}
              className={cn("min-h-11 border px-3 py-2 text-xs transition focus-visible:outline-2 focus-visible:outline-offset-4", category === name ? "border-black bg-black text-background" : "border-black/20 hover:border-black")}
            >
              {name || "All photos"} <span className="opacity-60">({images.length})</span>
            </button>
          ))}
        </div>
      )}
      <ArticleMedia key={category ?? "all"} html={html} />
    </section>
  )
}
