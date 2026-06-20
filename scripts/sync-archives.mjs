import fs from "node:fs/promises"
import path from "node:path"

const root = process.cwd()
const archivesDir = path.join(root, "content", "archives")

const SOURCES = {
  substack: {
    platform: "Substack",
    projectType: "Writing",
    project: "creative-chaos",
    feedUrl: "https://mhadimedia.substack.com/feed",
    prefix: "substack",
    limit: 4,
  },
  youtube: {
    platform: "YouTube",
    projectType: "Video",
    project: "youtube-films",
    feedUrl: "https://www.youtube.com/feeds/videos.xml?channel_id=UC3tjIqn37AFGX-M7CWHc_xw",
    prefix: "youtube",
    limit: 4,
  },
}

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
  for (const [key, value] of Object.entries(fields)) {
    if (value === undefined || value === "") continue
    if (Array.isArray(value)) {
      lines.push(`${key}:`)
      for (const item of value) lines.push(`  - ${JSON.stringify(item)}`)
    } else {
      lines.push(`${key}: ${JSON.stringify(value)}`)
    }
  }
  lines.push("---", "")
  return lines.join("\n")
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
  const { limit, projectType, project } = source
  return matchAll(xml, "item").slice(0, limit).map((item, index) => {
    const title = matchOne(item, "title")
    const href = matchOne(item, "link")
    const date = new Date(matchOne(item, "pubDate")).toISOString().slice(0, 10)
    const body = matchOne(item, "content:encoded") || matchOne(item, "description")
    const image = matchAttr(item, "enclosure", "url") || matchAttr(body, "img", "src")
    return {
      slug: `substack-${slugify(title)}-${index + 1}`,
      platform: "Substack",
      projectType,
      project,
      title,
      date,
      href,
      image,
      summary: excerpt(body),
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
  const { limit, projectType, project } = source
  return Promise.all(matchAll(xml, "entry").slice(0, limit).map(async (entry, index) => {
    const title = matchOne(entry, "title")
    const href = matchAttr(entry, "link", "href")
    const date = new Date(matchOne(entry, "published")).toISOString().slice(0, 10)
    const image = await youtubeThumbnail(href, matchAttr(entry, "media:thumbnail", "url"))
    const description = matchOne(entry, "media:description")
    return {
      slug: `youtube-${slugify(title)}-${index + 1}`,
      platform: "YouTube",
      projectType,
      project,
      title,
      date,
      href,
      image,
      summary: excerpt(description || title),
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

async function removeGenerated(prefix) {
  const entries = await fs.readdir(archivesDir, { withFileTypes: true }).catch(() => [])
  await Promise.all(
    entries
      .filter((entry) => entry.isFile() && entry.name.startsWith(`${prefix}-`) && entry.name.endsWith(".md"))
      .map((entry) => fs.unlink(path.join(archivesDir, entry.name))),
  )
}

async function writeItems(prefix, items) {
  await Promise.all(
    items.map((item, index) => {
      const filename = `${prefix}-${String(index + 1).padStart(2, "0")}.md`
      return fs.writeFile(path.join(archivesDir, filename), frontmatter(item))
    }),
  )
}

async function syncSource(key, source) {
  const xml = await fetchText(source.feedUrl)
  const items = key === "substack"
    ? parseSubstack(xml, source)
    : await parseYouTube(xml, source)

  if (items.length === 0) throw new Error(`No ${source.platform} items found`)
  await removeGenerated(source.prefix)
  await writeItems(source.prefix, items)
  console.log(`Synced ${items.length} ${source.platform} archive items`)
}

await fs.mkdir(archivesDir, { recursive: true })

for (const [key, source] of Object.entries(SOURCES)) {
  await syncSource(key, source)
}

console.log("LinkedIn, Instagram, and X/Twitter are profile-connected through curated archive entries.")
console.log("Use official APIs or add curated post URLs for those platforms; public feed scraping is not reliable.")
