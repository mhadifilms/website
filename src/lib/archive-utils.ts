import type { ArchiveCategory, ArchiveItem } from "@/content/types"

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

export function archiveCategorySlug(category: ArchiveCategory) {
  return CATEGORY_SLUGS[category]
}

export function archiveCategoryFromSlug(slug = ""): ArchiveCategory | undefined {
  return ARCHIVE_CATEGORY_ORDER.find((category) => archiveCategorySlug(category) === slug)
}

export function archiveEntryPath(item: Pick<ArchiveItem, "category" | "slug">) {
  return `/archives/${archiveCategorySlug(item.category)}/${item.slug}`
}

export function youtubeId(href = "") {
  return href.match(/[?&]v=([^&]+)/)?.[1] ?? href.match(/youtu\.be\/([^?]+)/)?.[1]
}
