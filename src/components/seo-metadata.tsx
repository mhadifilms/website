import { useEffect } from "react"

import { site } from "@/content/generated"
import { applyPageMeta } from "@/lib/seo"

const ROUTE_META: Record<string, { title: string; description: string; path: string; canonicalPath?: string }> = {
  home: {
    title: "Muhammad Hadi Yusufali | M Hadi",
    description: site.description,
    path: "/",
  },
  about: {
    title: "About Muhammad Hadi Yusufali | M Hadi",
    description:
      "Learn about Muhammad Hadi Yusufali, a creator and filmmaker working across storytelling, video production, creative technology, and digital media.",
    path: "/about",
    canonicalPath: "/",
  },
  experiences: {
    title: "Experiences | Muhammad Hadi Yusufali",
    description:
      "Explore Muhammad Hadi Yusufali's work across sync. labs, Journey Tellers, Awaiten Films, selected collaborators, and freelance filmmaking.",
    path: "/experiences",
  },
  archives: {
    title: "Archives | Muhammad Hadi Yusufali",
    description:
      "Selected public posts and creative work from Muhammad Hadi Yusufali across LinkedIn, Twitter/X, Instagram, Substack, and YouTube.",
    path: "/archives",
  },
}

type SeoMetadataProps = {
  activeId: string
}

export function SeoMetadata({ activeId }: SeoMetadataProps) {
  useEffect(() => {
    const meta = ROUTE_META[activeId] ?? ROUTE_META.home
    applyPageMeta({
      title: meta.title,
      description: meta.description,
      canonicalPath: meta.canonicalPath ?? meta.path,
    })
  }, [activeId])

  return null
}
