import type { ArchiveCategory, ArchiveFormat, ArchiveItem } from "@/content/types"

export const ARCHIVE_CATEGORY_ORDER: ArchiveCategory[] = [
  "Writings",
  "Vlogumentaries",
  "Films & Commercials",
  "Photography",
  "Tools",
  "Freelance",
]

const CATEGORY_SLUGS: Record<ArchiveCategory, string> = {
  Writings: "writings",
  Vlogumentaries: "vlogumentaries",
  "Films & Commercials": "films-commercials",
  Photography: "photography",
  Tools: "tools",
  Freelance: "freelance",
}

const FORMAT_LABELS: Record<ArchiveFormat, string> = {
  essay: "Essay",
  video: "Vlogumentary",
  podcast: "Podcast Episode",
  "short-film": "Short Film",
  commercial: "Commercial",
  "photo-set": "Photo Set",
  tool: "Tool",
}

export function archiveCategorySlug(category: ArchiveCategory) {
  return CATEGORY_SLUGS[category]
}

export function archiveCategoryFromSlug(slug = ""): ArchiveCategory | undefined {
  return ARCHIVE_CATEGORY_ORDER.find((category) => archiveCategorySlug(category) === slug)
}

export function archiveEntryPath(item: Pick<ArchiveItem, "category" | "slug">) {
  return `/archives/${archiveCategorySlug(item.category)}/${item.slug}`
}

export function archiveFormatLabel(format: ArchiveFormat) {
  return FORMAT_LABELS[format] ?? "Entry"
}

export function archiveSourceCtaLabel(item: Pick<ArchiveItem, "platform" | "format">) {
  if (item.format === "essay") {
    return item.platform === "Substack" ? "Read the full essay" : "Read the full post"
  }
  if (item.format === "podcast") return "Listen to the episode"
  if (item.format === "tool") return "See the build"
  if (item.format === "photo-set") return "View the set"
  if (item.platform === "YouTube") return "Watch the original"
  return "Open the original"
}

export function youtubeId(href = "") {
  return href.match(/[?&]v=([^&]+)/)?.[1] ?? href.match(/youtu\.be\/([^?]+)/)?.[1]
}

/**
 * Entries in the same series, sorted oldest-to-newest, so prev/next reads as a
 * chronological run rather than a reverse feed.
 */
export function seriesRun(items: ArchiveItem[], item: ArchiveItem) {
  const run = items
    .filter((candidate) => candidate.project === item.project)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  const index = run.findIndex((candidate) => candidate.slug === item.slug)
  return {
    previous: index > 0 ? run[index - 1] : undefined,
    next: index >= 0 && index < run.length - 1 ? run[index + 1] : undefined,
    position: index + 1,
    total: run.length,
  }
}
