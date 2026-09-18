import { ArrowLeft, ArrowUpRight } from "lucide-react"
import { Link } from "react-router-dom"
import { PhotoGallery } from "@/components/photo-gallery"
import { PillNav } from "@/components/pill-nav"
import type { ArchiveItem } from "@/content/types"
import { contentYear } from "@/lib/content-date"
import "@/components/photo-gallery.css"

export function PhotographyEntry({ item, bodyHtml, pathname }: { item: ArchiveItem; bodyHtml?: string; pathname: string }) {
  return (
    <main id="content" className="photography-page" data-reading-route={bodyHtml !== undefined ? pathname.replace(/\/$/, "") : undefined}>
      <PillNav />
      <article>
        <header className="photography-heading">
          <Link className="photography-back" to="/archives/photography" aria-label="Back to archives"><ArrowLeft size={16} /> Photography</Link>
          <div className="photography-heading-meta">
            <time dateTime={item.date}>{item.displayDate ?? contentYear(item.date)}</time>
            <span>{item.gallery?.length ?? 0} photographs</span>
            {item.unlisted && <span>Unlisted collection</span>}
          </div>
          <h1>{item.title}</h1>
          <p>{item.dek}</p>
        </header>

        <PhotoGallery key={item.slug} item={item} />

        <footer className="photography-footer">
          <details>
            <summary>About this collection</summary>
            {bodyHtml && <div className="prose-content" dangerouslySetInnerHTML={{ __html: bodyHtml }} />}
            {item.credits && <p className="photography-credits">{item.credits}</p>}
          </details>
          <Link to="/archives/photography">Explore photography <ArrowUpRight size={16} /></Link>
        </footer>
      </article>
    </main>
  )
}
