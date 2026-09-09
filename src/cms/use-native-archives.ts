import { useEffect, useState } from "react"
import { archives } from "@/content/generated"
import type { ArchiveItem } from "@/content/types"
import { api } from "./api"
import type { PublicPost } from "./types"
export function useNativeArchives() {
  const [data, setData] = useState<{
    posts: PublicPost[]
    managedPaths: string[]
  }>({ posts: [], managedPaths: [] })
  const native = data.posts
  useEffect(() => {
    let active = true
    api<{ posts: PublicPost[]; managedPaths: string[] }>(
      "/public/archive-index",
    )
      .then((result) => {
        if (active) setData(result)
      })
      .catch(() => {
        /* The static site remains usable before runtime cutover. */
      })
    return () => {
      active = false
    }
  }, [])
  const entries: ArchiveItem[] = native.map((post) => ({
    slug: post.path.split("/").pop()!,
    nativePath: post.path,
    platform: "Website",
    category: "Writings",
    format: post.snapshot.format === "note" ? "essay" : post.snapshot.format,
    entryType:
      post.snapshot.format === "photo-set"
        ? "Photo"
        : post.snapshot.format === "video"
          ? "Video"
          : "Article",
    project: "creative-chaos",
    title: post.snapshot.title,
    dek: post.snapshot.subtitle,
    image: post.snapshot.cover || firstImage(post.snapshot.document) || "/media/polaroid-camera.webp",
    href: post.path,
    date: post.snapshot.date,
    summary: post.snapshot.text.slice(0, 200),
  }))
  const paths = new Set(data.managedPaths),
    slugs = new Set(entries.map((p) => p.slug))
  return [
    ...entries,
    ...archives.filter(
      (item) =>
        !slugs.has(item.slug) && !paths.has(`/archives/writings/${item.slug}`),
    ),
  ]
}

function firstImage(node: import("@tiptap/react").JSONContent): string {
  if (node.type === "image" && typeof node.attrs?.src === "string") return node.attrs.src
  for (const child of node.content || []) { const found = firstImage(child); if (found) return found }
  return ""
}
