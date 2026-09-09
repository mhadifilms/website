import type { JSONContent } from "@tiptap/react"
export type SocialVariant = {
  id: string
  platform: "Twitter / X" | "LinkedIn" | "Instagram" | "Substack"
  parts: string[]
  url: string
  linked?: boolean
  baseRevision: number
}
export type Snapshot = {
  title: string
  subtitle: string
  slug: string
  format: "essay" | "note" | "photo-set" | "video"
  date: string
  tags: string[]
  project: string
  cover: string
  coverAlt: string
  document: JSONContent
  html: string
  text: string
  variants: SocialVariant[]
  newsletter: { subject: string; preview: string; intro: string }
}
export type Post = {
  id: string
  version: number
  draft_revision: number
  content_revision: number
  published_revision: number | null
  canonical_path: string | null
  created_at: string
  updated_at: string
  archived_at: string | null
  scheduled_at: string | null
  scheduled_revision: number | null
  source_id: string | null
  import_notes: string | null
  snapshot: Snapshot
}
export type PublicPost = {
  id: string
  path: string
  revision: number
  snapshot: Snapshot
}
export type Media = {
  id: string
  url: string
  name: string
  width: number
  height: number
  bytes: number
  created_at: string
}
export type Session = {
  authenticated: boolean
  csrf: string | null
  development: boolean
  oauthConfigured: boolean
  owner: string
}
export type Settings = {
  owner: string
  origin: string
  production: boolean
  signInReady: boolean
  newsletterReady: boolean
  newsletterMessage: string
  postCount: number
  mediaCount: number
}
export type Revision = { revision: number; title: string; created_at: string }
