export type SocialLink = {
  label: string
  href: string
  embedSrc?: string
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
  company: string
  role: string
  location?: string
  dateStart: string
  dateEnd?: string
  summary: string
  tags?: string[]
  href?: string
  logo?: string
  html: string
}

export type ArchivePlatform = "Linkedin" | "Twitter" | "Instagram" | "Substack" | "YouTube"

export type ArchiveItem = {
  slug: string
  platform: ArchivePlatform
  title: string
  image?: string
  href: string
  date: string
  summary?: string
}
