import { site } from "@/content/generated"

export type ScenePolaroid = {
  src: string
  alt?: string
  caption?: string
}

function withBase(path?: string) {
  if (!path) return undefined
  if (/^https?:/.test(path)) return path
  const base = import.meta.env.BASE_URL.replace(/\/+$/, "")
  const clean = path.replace(/^\//, "")
  return `${base}/${clean}`
}

function getReloadOffset(length: number) {
  if (length <= 1 || typeof window === "undefined") return 0
  return Math.floor(Math.random() * length)
}

function buildScenePolaroids(): ScenePolaroid[] {
  const images = site.polaroids ?? []
  const normalized = images.reduce<ScenePolaroid[]>((acc, image) => {
    const src = withBase(image.src)
    if (!src) return acc
    acc.push({
      src,
      alt: image.alt,
      caption: image.caption,
    })
    return acc
  }, [])

  const offset = getReloadOffset(normalized.length)
  return normalized.map((_, index) => normalized[(index + offset) % normalized.length])
}

export const scenePolaroids = buildScenePolaroids()
