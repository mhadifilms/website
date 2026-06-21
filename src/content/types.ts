export type SocialLink = {
  label: string
  href: string
  embedSrc?: string
  embedScriptSrc?: string
  embedAppId?: string
  embedTitle?: string
  embedHeight?: number
}

export type PolaroidImage = {
  src: string
  alt?: string
  caption?: string
}

export type SiteConfig = {
  name: string
  shortName?: string
  role: string
  description: string
  email: string
  bio: string
  polaroids?: PolaroidImage[]
  socials: SocialLink[]
}

export type Experience = {
  title: string
  slug: string
  order: number
  company: string
  role: string
  location?: string
  dateStart: string
  dateEnd?: string
  summary: string
  tags?: string[]
  href?: string
  visitLabel?: string
  logo?: string
  media?: ExperienceMedia[]
  html: string
}

export type ExperienceMedia = {
  type: "youtube" | "vimeo" | "iframe" | "image" | "link"
  url: string
  title?: string
  thumbnail?: string
}

export type ArchivePlatform = "Linkedin" | "Twitter" | "Instagram" | "Substack" | "YouTube"
export type ProjectType = "Writing" | "Video" | "Tools" | "Profiles"
export type ProjectStatus = "Active" | "Archive" | "Profile"
export type ArchiveEntryType = "Article" | "Video" | "Post" | "Profile" | "Tool" | "Prototype" | "Project"

export type Project = {
  slug: string
  title: string
  order: number
  type: ProjectType
  status?: ProjectStatus
  dateStart?: string
  dateEnd?: string
  image?: string
  summary: string
  href?: string
  relatedExperience?: string
  platforms?: ArchivePlatform[]
  featured?: boolean
  html: string
}

export type ArchiveItem = {
  slug: string
  platform: ArchivePlatform
  projectType: ProjectType
  entryType: ArchiveEntryType
  project?: string
  title: string
  image?: string
  href: string
  date: string
  summary?: string
  featured?: boolean
}
