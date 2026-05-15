export type SocialLink = {
  label: string
  href: string
}

export type SiteConfig = {
  name: string
  role: string
  description: string
  email: string
  socials: SocialLink[]
}

export type Page = {
  title: string
  slug: string
  summary: string
  html: string
}

export type Project = {
  title: string
  slug: string
  year: number
  featured?: boolean
  summary: string
  tags: string[]
  href?: string
  html: string
}

export type Post = {
  title: string
  slug: string
  date: string
  published?: boolean
  summary: string
  tags: string[]
  html: string
}
