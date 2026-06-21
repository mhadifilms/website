import fs from "node:fs/promises"
import path from "node:path"
import matter from "gray-matter"

const root = process.cwd()
const archivesDir = path.join(root, "content", "archives")

const SOURCES = {
  substack: {
    platform: "Substack",
    projectType: "Writing",
    project: "creative-chaos",
    entryType: "Article",
    feedUrl: "https://mhadimedia.substack.com/feed",
    folder: "substack",
    limit: 100,
  },
  youtube: {
    platform: "YouTube",
    projectType: "Video",
    project: "youtube-films",
    entryType: "Video",
    feedUrl: "https://www.youtube.com/feeds/videos.xml?channel_id=UC3tjIqn37AFGX-M7CWHc_xw",
    folder: "youtube",
    limit: 100,
  },
}

const PRESERVED_FIELDS = ["project", "projectType", "entryType", "featured"]
const ARCHIVE_FIELD_ORDER = ["slug", "platform", "projectType", "project", "entryType", "title", "date", "href", "image", "summary", "featured"]

function decodeHtml(value = "") {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&#(\d+);/g, (_, codepoint) => String.fromCodePoint(Number(codepoint)))
    .replace(/&#x([0-9a-f]+);/gi, (_, codepoint) => String.fromCodePoint(parseInt(codepoint, 16)))
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
}

function stripHtml(value = "") {
  return decodeHtml(value)
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function excerpt(value = "", max = 160) {
  const clean = stripHtml(value)
  if (clean.length <= max) return clean
  return `${clean.slice(0, max).replace(/\s+\S*$/, "")}...`
}

function classifyProject(item, source) {
  const haystack = `${item.title ?? ""} ${item.summary ?? ""} ${item.href ?? ""}`.toLowerCase()

  if (source.platform === "Substack") {
    if (/\b(app|code|coding|mcp|ai|tool|software|cursor|claude|davinci|resolve)\b|building an app|google search|hack google/.test(haystack)) {
      return { project: "creative-tools", projectType: "Tools", entryType: "Article" }
    }
    if (/\b(movie|film|filmmaking|short film|production|editing|documentary|camera|video)\b/.test(haystack)) {
      return { project: "awaiten-films", projectType: "Video", entryType: "Article" }
    }
    return { project: source.project, projectType: source.projectType, entryType: source.entryType }
  }

  if (source.platform === "YouTube") {
    if (/(journey tellers|camp noor|youth camp|podcast)/.test(haystack)) {
      return { project: "journey-tellers", projectType: "Video", entryType: "Video" }
    }
    if (/(movie|film|documentary|commercial|production|behind the scenes)/.test(haystack)) {
      return { project: "awaiten-films", projectType: "Video", entryType: "Video" }
    }
    return { project: source.project, projectType: source.projectType, entryType: source.entryType }
  }

  return { project: source.project, projectType: source.projectType, entryType: source.entryType }
}

function slugify(value = "") {
  const slug = value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
  return slug || "post"
}

function frontmatter(fields) {
  const lines = ["---"]
  const keys = [...ARCHIVE_FIELD_ORDER, ...Object.keys(fields).filter((key) => !ARCHIVE_FIELD_ORDER.includes(key))]
  for (const key of keys) {
    const value = fields[key]
    if (value === undefined || value === "") continue
    const normalizedValue = value instanceof Date
      ? value.toISOString().slice(0, 10)
      : typeof value === "string" && /^\d{4}-\d{2}-\d{2}T/.test(value)
        ? value.slice(0, 10)
        : value
    if (Array.isArray(value)) {
      lines.push(`${key}:`)
      for (const item of value) lines.push(`  - ${JSON.stringify(item)}`)
    } else {
      lines.push(`${key}: ${JSON.stringify(normalizedValue)}`)
    }
  }
  lines.push("---", "")
  return lines.join("\n")
}

async function markdownFilesIn(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true }).catch(() => [])
  const files = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(dir, entry.name)
      if (entry.isDirectory()) return markdownFilesIn(entryPath)
      if (entry.isFile() && entry.name.endsWith(".md")) return [entryPath]
      return []
    }),
  )

  return files.flat()
}

async function existingGeneratedByHref(source) {
  const files = await markdownFilesIn(path.join(archivesDir, source.folder))
  const byHref = new Map()

  for (const file of files) {
    const markdown = await fs.readFile(file, "utf8")
    const { data } = matter(markdown)
    if (data.href) byHref.set(data.href, data)
  }

  return byHref
}

function mergePreservedFields(item, existing) {
  if (!existing) return item
  const merged = { ...item }

  for (const field of PRESERVED_FIELDS) {
    if (existing[field] !== undefined && existing[field] !== "") {
      merged[field] = existing[field]
    }
  }

  return merged
}

function matchAll(xml, tag) {
  return [...xml.matchAll(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, "gi"))].map((match) => match[1])
}

function matchOne(xml, tag) {
  return decodeHtml(matchAll(xml, tag)[0] ?? "")
}

function matchAttr(xml, tag, attr) {
  const match = xml.match(new RegExp(`<${tag}\\b[^>]*\\s${attr}=["']([^"']+)["'][^>]*>`, "i"))
  return decodeHtml(match?.[1] ?? "")
}

function parseSubstack(xml, source) {
  const { limit, projectType, project, entryType } = source
  return matchAll(xml, "item").slice(0, limit).map((item) => {
    const title = matchOne(item, "title")
    const href = matchOne(item, "link")
    const date = new Date(matchOne(item, "pubDate")).toISOString().slice(0, 10)
    const body = matchOne(item, "content:encoded") || matchOne(item, "description")
    const image = matchAttr(item, "enclosure", "url") || matchAttr(body, "img", "src")
    const base = {
      slug: `substack-${slugify(title)}`,
      platform: "Substack",
      title,
      date,
      href,
      image,
      summary: excerpt(body),
    }
    return {
      ...base,
      ...classifyProject(base, source),
      projectType,
      project,
      entryType,
      ...classifyProject(base, source),
    }
  })
}

async function isReachable(url = "") {
  if (!url) return false
  try {
    const response = await fetch(url, { method: "HEAD" })
    return response.ok
  } catch {
    return false
  }
}

async function youtubeThumbnail(href = "", fallback = "") {
  const id = href.match(/[?&]v=([^&]+)/)?.[1] ?? fallback.match(/\/vi\/([^/]+)/)?.[1]
  if (!id) return fallback

  const candidates = [
    `https://i.ytimg.com/vi/${id}/maxresdefault.jpg`,
    `https://i.ytimg.com/vi/${id}/hq720.jpg`,
    `https://i.ytimg.com/vi/${id}/sddefault.jpg`,
    `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
    fallback,
  ].filter(Boolean)

  for (const candidate of candidates) {
    if (await isReachable(candidate)) return candidate
  }

  return fallback
}

async function parseYouTube(xml, source) {
  const { limit, projectType, project, entryType } = source
  return Promise.all(matchAll(xml, "entry").slice(0, limit).map(async (entry) => {
    const title = matchOne(entry, "title")
    const href = matchAttr(entry, "link", "href")
    const date = new Date(matchOne(entry, "published")).toISOString().slice(0, 10)
    const image = await youtubeThumbnail(href, matchAttr(entry, "media:thumbnail", "url"))
    const description = matchOne(entry, "media:description")
    const base = {
      slug: `youtube-${slugify(title)}`,
      platform: "YouTube",
      title,
      date,
      href,
      image,
      summary: excerpt(description || title),
    }
    return {
      ...base,
      ...classifyProject(base, source),
      projectType,
      project,
      entryType,
      ...classifyProject(base, source),
    }
  }))
}

async function fetchText(url) {
  const response = await fetch(url, {
    headers: {
      "user-agent": "mhadifilms.com archive sync (+https://mhadifilms.com)",
      accept: "application/rss+xml, application/atom+xml, application/xml, text/xml",
    },
  })
  if (!response.ok) throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`)
  return response.text()
}

async function removeGenerated(source) {
  const dir = path.join(archivesDir, source.folder)
  const files = await markdownFilesIn(dir)
  await Promise.all(files.map((file) => fs.unlink(file)))
}

async function writeItems(source, items) {
  const dir = path.join(archivesDir, source.folder)
  await fs.mkdir(dir, { recursive: true })
  await Promise.all(
    items.map((item) => {
      const filename = `${slugify(item.title)}.md`
      return fs.writeFile(path.join(dir, filename), frontmatter(item))
    }),
  )
}

async function syncSource(key, source) {
  const xml = await fetchText(source.feedUrl)
  const items = key === "substack"
    ? parseSubstack(xml, source)
    : await parseYouTube(xml, source)
  const existing = await existingGeneratedByHref(source)
  const mergedItems = items.map((item) => mergePreservedFields(item, existing.get(item.href)))

  if (mergedItems.length === 0) throw new Error(`No ${source.platform} items found`)
  await removeGenerated(source)
  await writeItems(source, mergedItems)
  console.log(`Synced ${mergedItems.length} ${source.platform} archive items`)
}

await fs.mkdir(archivesDir, { recursive: true })

for (const [key, source] of Object.entries(SOURCES)) {
  await syncSource(key, source)
}

console.log("LinkedIn, Instagram, and X/Twitter are profile-connected through curated archive entries.")
console.log("Use official APIs or add curated post URLs for those platforms; public feed scraping is not reliable.")
