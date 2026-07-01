import fs from "node:fs/promises"
import path from "node:path"
import matter from "gray-matter"

const root = process.cwd()
const archivesDir = path.join(root, "content", "archives")

const SOURCES = {
  substack: {
    platform: "Substack",
    category: "Writings",
    project: "creative-chaos",
    entryType: "Article",
    feedUrl: "https://mhadimedia.substack.com/feed",
    folder: "substack",
    limit: 100,
  },
  youtube: {
    platform: "YouTube",
    category: "Vlogumentaries",
    project: "school-years",
    entryType: "Video",
    feedUrl: "https://www.youtube.com/feeds/videos.xml?channel_id=UC3tjIqn37AFGX-M7CWHc_xw",
    folder: "youtube",
    limit: 100,
  },
}

const PRESERVED_FIELDS = ["slug", "category", "project", "format", "entryType", "dek", "role", "credits", "gallery", "relatedEntries", "seoTitle", "seoDescription", "featured"]
const ARCHIVE_FIELD_ORDER = ["slug", "platform", "category", "project", "format", "entryType", "title", "dek", "date", "href", "image", "summary", "role", "credits", "featured"]

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

function firstParagraphs(value = "", max = 3) {
  const paragraphs = [...value.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)]
    .map((match) => stripHtml(match[1]))
    .filter((text) => text.length > 35 && !/subscribe|share|upgrade|substack/i.test(text))
    .slice(0, max)
  return paragraphs
}

// Pull real, readable prose out of a YouTube description: drop the promo
// links / timestamps / credits tail and any leading "if you enjoyed" plug,
// then keep the first few sentences.
function youtubeDescriptionText(raw = "", max = 480) {
  let text = decodeHtml(raw)
  const about = text.match(/about (?:the|this) (?:episode|video|film)[:\s]*/i)
  if (about) text = text.slice(about.index + about[0].length)
  text = text.replace(/^.*?if you enjoyed this (?:episode|video),?\s*you'?ll love\s*/i, "")
  text = text.split(/\b(?:connect with|follow|subscribe|timestamps?|chapters?|credits|produced by|directed by|hosted by|available on|help support|social|instagram|tiktok|patreon|buymeacoffee|sign up for)\b/i)[0]
  text = text
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2190}-\u{21FF}\u{2B00}-\u{2BFF}]/gu, " ")
    .replace(/\uFE0F/gu, " ")
    .replace(/#\w+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
  const sentences = text.split(/(?<=[.!?])\s/).slice(0, 4).join(" ")
  const clipped = sentences.length > max ? `${sentences.slice(0, max).replace(/\s+\S*$/, "")}…` : sentences
  return clipped
}

function sourceBody(item, sourceBody = "") {
  if (item.platform === "Substack") {
    const paragraphs = firstParagraphs(sourceBody)
    const body = [
      item.summary,
      ...paragraphs,
      `[Read the rest on Substack](${item.href})`,
    ].filter(Boolean)
    return body.join("\n\n")
  }

  if (item.platform === "YouTube") {
    const prose = youtubeDescriptionText(sourceBody) || item.summary
    return [prose, `[Watch on YouTube](${item.href})`].filter(Boolean).join("\n\n")
  }

  return ""
}

function classifyProject(item, source) {
  const haystack = `${item.title ?? ""} ${item.summary ?? ""} ${item.href ?? ""}`.toLowerCase()

  if (source.platform === "Substack") {
    if (/\b(app|code|coding|mcp|ai|tool|software|cursor|claude|davinci|resolve)\b|building an app|google search|hack google/.test(haystack)) {
      return { project: "creative-tools", category: "Tools", entryType: "Article", projectTitle: "Creative Tools" }
    }
    if (/(podcast|target audience)/.test(haystack)) {
      return { project: "journey-tellers-podcast", category: "Miscellaneous", entryType: "Article", projectTitle: "Journey Tellers Podcast" }
    }
    if (/\b(movie|film|filmmaking|short film|production|editing|documentary|camera|video|hollywood|logan paul)\b/.test(haystack)) {
      return { project: "short-films", category: "Films & Commercials", entryType: "Article", projectTitle: "Short Films" }
    }
    return { project: source.project, category: source.category, entryType: source.entryType, projectTitle: "Creative Chaos" }
  }

  if (source.platform === "YouTube") {
    if (/(journey tellers|podcast)/.test(haystack)) {
      return { project: "journey-tellers-podcast", category: "Miscellaneous", entryType: "Video", projectTitle: "Journey Tellers Podcast" }
    }
    if (/(camp noor|youth camp|tanzania|orphanage|middle east)/.test(haystack)) {
      return { project: "journey-tellers", category: "Vlogumentaries", entryType: "Video", projectTitle: "Journey Tellers in the World" }
    }
    if (/(music video|pain you hide|reedoftawheed)/.test(haystack)) {
      return { project: "music-videos", category: "Films & Commercials", entryType: "Video", projectTitle: "Music Videos" }
    }
    if (/(movie|film|documentary|commercial|production|behind the scenes)/.test(haystack)) {
      return { project: "short-films", category: "Films & Commercials", entryType: "Video", projectTitle: "Short Films" }
    }
    return { project: source.project, category: source.category, entryType: source.entryType, projectTitle: "School Years" }
  }

  return { project: source.project, category: source.category, entryType: source.entryType }
}

const SLUG_STOPWORDS = new Set(
  "a an the and or but nor of to in into onto on at by for from with as my your our his her their its this that these those".split(" "),
)
const SLUG_MAX_WORDS = 7
const SLUG_MAX_LENGTH = 56

// Short, readable slugs: drop the platform prefix, trim function words, keep
// numbers, and cap the length. Mirrors scripts/shorten-archive-slugs.mjs.
function conciseSlug(value = "") {
  const cleaned = value
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/&/g, " and ")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")

  const words = cleaned.split(/[^a-z0-9]+/).filter(Boolean)
  let meaningful = words.filter((word) => !SLUG_STOPWORDS.has(word) && (word.length > 1 || /\d/.test(word)))
  if (meaningful.length < 3) meaningful = words

  const picked = []
  let length = 0
  for (const word of meaningful) {
    if (picked.length >= SLUG_MAX_WORDS) break
    if (length + word.length + 1 > SLUG_MAX_LENGTH && picked.length >= 3) break
    picked.push(word)
    length += word.length + 1
  }

  return picked.join("-") || "post"
}

function dedupeSlugs(items) {
  const used = new Set()
  for (const item of items) {
    let slug = item.slug
    let n = 2
    while (used.has(slug)) {
      slug = `${item.slug}-${n}`
      n += 1
    }
    used.add(slug)
    item.slug = slug
  }
  return items
}

function frontmatter(fields, body = "") {
  const lines = ["---"]
  const cleanFields = { ...fields }
  delete cleanFields.projectTitle
  delete cleanFields.body
  const keys = [...ARCHIVE_FIELD_ORDER, ...Object.keys(cleanFields).filter((key) => !ARCHIVE_FIELD_ORDER.includes(key))]
  for (const key of keys) {
    const value = cleanFields[key]
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
  lines.push("---", "", body.trim(), "")
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
    const { data, content } = matter(markdown)
    if (data.href) byHref.set(data.href, { data, content })
  }

  return byHref
}

function mergePreservedFields(item, existing) {
  if (!existing) return item
  const merged = { ...item }

  for (const field of PRESERVED_FIELDS) {
    if (existing.data[field] !== undefined && existing.data[field] !== "") {
      merged[field] = existing.data[field]
    }
  }

  if (existing.content.trim()) {
    merged.body = existing.content.trim()
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
  const { limit, category, project, entryType } = source
  return matchAll(xml, "item").slice(0, limit).map((item) => {
    const title = matchOne(item, "title")
    const href = matchOne(item, "link")
    const date = new Date(matchOne(item, "pubDate")).toISOString().slice(0, 10)
    const body = matchOne(item, "content:encoded") || matchOne(item, "description")
    const image = matchAttr(item, "enclosure", "url") || matchAttr(body, "img", "src")
    const base = {
      slug: conciseSlug(title),
      platform: "Substack",
      title,
      date,
      href,
      image,
      summary: excerpt(body),
    }
    const classification = classifyProject(base, source)
    return {
      ...base,
      ...classification,
      category,
      project,
      entryType,
      ...classification,
      body: sourceBody({ ...base, ...classification }, body),
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
  const { limit, category, project, entryType } = source
  return Promise.all(matchAll(xml, "entry").slice(0, limit).map(async (entry) => {
    const title = matchOne(entry, "title")
    const href = matchAttr(entry, "link", "href")
    const date = new Date(matchOne(entry, "published")).toISOString().slice(0, 10)
    const image = await youtubeThumbnail(href, matchAttr(entry, "media:thumbnail", "url"))
    const description = matchOne(entry, "media:description")
    const base = {
      slug: conciseSlug(title),
      platform: "YouTube",
      title,
      date,
      href,
      image,
      summary: excerpt(description || title),
    }
    const classification = classifyProject(base, source)
    return {
      ...base,
      ...classification,
      category,
      project,
      entryType,
      ...classification,
      body: sourceBody({ ...base, ...classification }, description),
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
      const filename = `${item.slug}.md`
      return fs.writeFile(path.join(dir, filename), frontmatter(item, item.body))
    }),
  )
}

async function syncSource(key, source) {
  const xml = await fetchText(source.feedUrl)
  const items = key === "substack"
    ? parseSubstack(xml, source)
    : await parseYouTube(xml, source)
  const existing = await existingGeneratedByHref(source)
  const mergedItems = dedupeSlugs(items.map((item) => mergePreservedFields(item, existing.get(item.href))))

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
