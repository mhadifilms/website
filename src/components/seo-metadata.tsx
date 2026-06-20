import { useEffect } from "react"

import { site } from "@/content/generated"

const SITE_URL = "https://mhadifilms.com"
const SOCIAL_IMAGE = `${SITE_URL}/media/social-card.png`
const SOCIAL_IMAGE_ALT = "A black-and-white film strip from Muhammad Hadi Yusufali's creative work."

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

function setMeta(selector: string, attr: "content" | "href", value: string) {
  const element = document.head.querySelector(selector)
  if (element) {
    element.setAttribute(attr, value)
  }
}

export function SeoMetadata({ activeId }: SeoMetadataProps) {
  useEffect(() => {
    const meta = ROUTE_META[activeId] ?? ROUTE_META.home
    const canonicalPath = meta.canonicalPath ?? meta.path
    const canonical = `${SITE_URL}${canonicalPath === "/" ? "/" : canonicalPath}`

    document.title = meta.title
    setMeta('meta[name="description"]', "content", meta.description)
    setMeta('meta[property="og:title"]', "content", meta.title)
    setMeta('meta[property="og:description"]', "content", meta.description)
    setMeta('meta[property="og:url"]', "content", canonical)
    setMeta('meta[property="og:image"]', "content", SOCIAL_IMAGE)
    setMeta('meta[property="og:image:secure_url"]', "content", SOCIAL_IMAGE)
    setMeta('meta[property="og:image:alt"]', "content", SOCIAL_IMAGE_ALT)
    setMeta('meta[name="twitter:title"]', "content", meta.title)
    setMeta('meta[name="twitter:description"]', "content", meta.description)
    setMeta('meta[name="twitter:image"]', "content", SOCIAL_IMAGE)
    setMeta('meta[name="twitter:image:alt"]', "content", SOCIAL_IMAGE_ALT)
    setMeta('link[rel="canonical"]', "href", canonical)
  }, [activeId])

  return null
}
