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

export type ArchivePlatform = "Linkedin" | "Twitter" | "Instagram" | "Substack" | "YouTube" | "Website"
export type ArchiveCategory = "Writings" | "Vlogumentaries" | "Films & Commercials" | "Photography" | "Tools" | "Freelance"
export type ProjectType = ArchiveCategory
export type ProjectStatus = "Active" | "Archive"
export type ArchiveEntryType = "Article" | "Video" | "Post" | "Tool" | "Prototype" | "Project" | "Photo"

export type Project = {
  slug: string
  title: string
  order: number
  category: ArchiveCategory
  type?: ProjectType
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
  category: ArchiveCategory
  projectType?: ProjectType
  entryType: ArchiveEntryType
  project?: string
  title: string
  image?: string
  href: string
  date: string
  summary?: string
  featured?: boolean
  html: string
}
