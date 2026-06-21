import type { ArchiveCategory, ArchiveFormat, ArchiveItem, Project } from "@/content/types"

export const ARCHIVE_OPEN_FOLDER_EVENT = "archive:open-folder"

export type ArchiveOpenFolderDetail = {
  category: ArchiveCategory
  series?: string
}

export const ARCHIVE_CATEGORY_ORDER: ArchiveCategory[] = [
  "Writings",
  "Vlogumentaries",
  "Films & Commercials",
  "Photography",
  "Tools",
  "Miscellaneous",
]

const CATEGORY_SLUGS: Record<ArchiveCategory, string> = {
  Writings: "writings",
  Vlogumentaries: "vlogumentaries",
  "Films & Commercials": "films-commercials",
  Photography: "photography",
  Tools: "tools",
  Miscellaneous: "miscellaneous",
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

export type ExperienceWorkGroup = {
  project: Project
  entries: ArchiveItem[]
}

/**
 * The bodies of work produced during an experience: every series whose
 * `relatedExperience` points back at it, paired with its real archive entries
 * (newest first). Used to draw the "work from this chapter" contact sheets.
 */
export function relatedSeriesForExperience(
  experienceSlug: string,
  projects: Project[],
  items: ArchiveItem[],
): ExperienceWorkGroup[] {
  return projects
    .filter((project) => project.relatedExperience === experienceSlug)
    .sort((a, b) => a.order - b.order)
    .map((project) => ({
      project,
      entries: items
        .filter((item) => item.project === project.slug)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    }))
    .filter((group) => group.entries.length > 0)
}

/**
 * Opens an Archives folder in place (same-page) and asks it to highlight a
 * series. Updates the hash too, so the deep link is shareable.
 */
export function openArchiveFolder(category: ArchiveCategory, series?: string) {
  if (typeof window === "undefined") return
  window.history.replaceState(null, "", `/archives#${archiveCategorySlug(category)}`)
  window.dispatchEvent(
    new CustomEvent<ArchiveOpenFolderDetail>(ARCHIVE_OPEN_FOLDER_EVENT, {
      detail: { category, series },
    }),
  )
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
