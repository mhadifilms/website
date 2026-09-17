import { useMemo, useState } from "react"
import { ArticleMedia } from "@/cms/article-media"
import type { ArchiveItem } from "@/content/types"
import "@/cms/cms.css"
import "./photo-gallery.css"

const escape = (value: string) => value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]!)

export function PhotoGallery({ item }: { item: ArchiveItem }) {
  const [category, setCategory] = useState<string | null>(null)
  const groups: [string | null, string[]][] = [[null, item.gallery ?? []], ...Object.entries(item.galleryCategories ?? {})]
  const html = useMemo(() => {
    const photos = (category && item.galleryCategories?.[category]) || item.gallery || []
    const dimensions = new Map(item.gallery?.map((src, index) => [src, item.galleryDimensions?.[index]]))
    return `<figure class="photography-contact-sheet"><div class="photography-frames">${photos.map((src, index) => {
      const thumbnail = src.startsWith("https://cdn.awaiten.com/cdn-cgi/image/")
        ? src.replace(/\/cdn-cgi\/image\/[^/]+\//, "/cdn-cgi/image/width=960,quality=80,format=auto/")
        : src
      const [width, height] = dimensions.get(src) ?? [3, 2]
      return `<a href="${escape(src)}" data-gallery-image style="--photo-ratio:${width / height}" aria-label="Enlarge ${escape(item.title)} — photo ${index + 1}"><img src="${escape(thumbnail)}" alt="${escape(item.title)} — photo ${index + 1}" width="${width}" height="${height}" loading="${index < 6 ? "eager" : "lazy"}" decoding="async" /></a>`
    }).join("")}</div><figcaption class="sr-only">${escape(item.title)}${category ? `, ${escape(category)}` : ""}</figcaption></figure>`
  }, [item.gallery, item.galleryCategories, item.galleryDimensions, item.title, category])

  return (
    <section className="photo-gallery" aria-label={`${item.title} photographs`}>
      {groups.length > 1 && (
        <div className="photography-filters" role="group" aria-label="Photo collections">
          {groups.map(([name, images]) => (
            <button
              key={name ?? "all"}
              type="button"
              aria-pressed={category === name}
              onClick={() => setCategory(name)}
              className="photography-filter"
            >
              {name ? name.toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase()) : "All photos"} <span>({images.length})</span>
            </button>
          ))}
        </div>
      )}
      <ArticleMedia key={category ?? "all"} html={html} />
    </section>
  )
}
