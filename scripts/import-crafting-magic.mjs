import fs from "node:fs/promises"
import path from "node:path"

// Imports the sync. labs "crafting magic in sf" YouTube playlist into the
// archive as the sync. Crafting Magic vlogumentary series. Kept in its own
// folder (content/archives/crafting-magic) so the daily sync-archives job —
// which wipes content/archives/youtube — never touches these entries.
//
// Usage: node scripts/import-crafting-magic.mjs
const root = process.cwd()
const outDir = path.join(root, "content", "archives", "crafting-magic")
const PLAYLIST = "PLX8i0P_zBTmfhZ37gzthqXRvFeZfs3_vi"

// Playlist order (newest → oldest as listed on the channel).
const VIDEO_IDS = [
  "oLdqiNVnaDc", "KsGSF5ITDcg", "sBgIwpqIfIs", "ulOZtWeN9zo", "PD91BusM-CU",
  "cgzhchOediw", "vDJ4_wmQr4k", "6f0kKEQl79k", "qR2WehcqlZA", "7AGWH2y1RyA",
  "uge0T51DNec", "n7bCOA7rhL0", "bIeTQ0an_KQ", "roBRsbM5RTM", "kK3CKyU5xAY",
  "hX5w7DmQwtI", "cOpYQKtzpi8", "pWIkiIpbYt4", "vwkkTQlk4H8", "sf0bxX1wE9s",
]

const SLUG_STOPWORDS = new Set(
  "a an the and or but nor of to in into onto on at by for from with as my your our his her their its this that these those".split(" "),
)

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
    if (picked.length >= 8) break
    if (length + word.length + 1 > 56 && picked.length >= 3) break
    picked.push(word)
    length += word.length + 1
  }
  return picked.join("-") || "video"
}

function decodeEntities(value = "") {
  return value
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
}

function unescapeJson(value = "") {
  try {
    return JSON.parse(`"${value}"`)
  } catch {
    return value.replace(/\\n/g, "\n").replace(/\\"/g, '"').replace(/\\\//g, "/")
  }
}

// Trim promo/links/hashtags/timestamps out of a YouTube description and keep
// only the opening prose sentences.
function cleanDescription(raw = "", max = 420) {
  // Drop timestamp/chapter lines (e.g. "0:00 intro") and keep prose lines.
  const proseLines = raw
    .replace(/\r/g, "")
    .split("\n")
    .filter((line) => !/^\s*\d{1,2}:\d{2}(?::\d{2})?\b/.test(line))
  let text = proseLines.join(" ")

  // Cut at the first promo/credits cue.
  text = text.split(
    /\b(?:subscribe|follow us|follow me|connect with|timestamps?|chapters?|credits|produced by|directed by|shot on|social|instagram|tiktok|twitter|discord|check out|link in|sign up|try sync|try it out|watch more|learn more)\b/i,
  )[0]

  text = text
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2190}-\u{21FF}\u{2B00}-\u{2BFF}]/gu, " ")
    .replace(/\uFE0F/gu, " ")
    .replace(/#\w+/g, " ")
    .replace(/[ \t]+/g, " ")
    .trim()

  const sentences = text.split(/(?<=[.!?])\s/)
  // Drop a trailing dangling clause left by a stripped URL (e.g. "try sync. now at").
  const kept = []
  for (const sentence of sentences.slice(0, 5)) {
    if (/\b(?:now\s+at|available\s+at|here|below)\s*$/i.test(sentence.trim())) break
    kept.push(sentence.trim())
    if (kept.length >= 4) break
  }
  const joined = kept.join(" ").replace(/\s+/g, " ").trim()
  if (!joined) return ""
  return joined.length > max ? `${joined.slice(0, max).replace(/\s+\S*$/, "")}…` : joined
}

function firstSentence(value = "", max = 150) {
  const clean = value.replace(/\s+/g, " ").trim()
  const sentence = clean.split(/(?<=[.!?])\s/)[0] ?? clean
  if (sentence.length <= max) return sentence
  return `${sentence.slice(0, max).replace(/\s+\S*$/, "")}…`
}

async function fetchVideo(id) {
  const href = `https://www.youtube.com/watch?v=${id}`
  const res = await fetch(href, { headers: { "user-agent": "Mozilla/5.0", "accept-language": "en-US,en" } })
  const html = await res.text()

  const title =
    decodeEntities(html.match(/<meta name="title" content="([^"]*)"/)?.[1] ?? "") ||
    unescapeJson(html.match(/"title":"((?:[^"\\]|\\.)*)","lengthSeconds"/)?.[1] ?? "")
  const description = unescapeJson(html.match(/"shortDescription":"((?:[^"\\]|\\.)*)"/)?.[1] ?? "")
  const uploadDate =
    html.match(/<meta itemprop="uploadDate" content="([^"]*)"/)?.[1] ??
    html.match(/"uploadDate":"([^"]*)"/)?.[1] ??
    html.match(/"publishDate":"([^"]*)"/)?.[1] ??
    ""

  return { id, href, title: title.trim(), description, uploadDate: uploadDate.slice(0, 10) }
}

function frontmatter(fields, body) {
  const order = ["slug", "platform", "category", "project", "format", "entryType", "title", "dek", "date", "href", "image", "summary", "role", "featured"]
  const lines = ["---"]
  for (const key of order) {
    const value = fields[key]
    if (value === undefined || value === "") continue
    lines.push(`${key}: ${JSON.stringify(value)}`)
  }
  lines.push("---", "", body.trim(), "")
  return lines.join("\n")
}

async function run() {
  await fs.mkdir(outDir, { recursive: true })
  // Clear any prior import so re-runs stay clean.
  for (const file of await fs.readdir(outDir).catch(() => [])) {
    if (file.endsWith(".md")) await fs.unlink(path.join(outDir, file))
  }

  const used = new Set()
  let count = 0
  for (const id of VIDEO_IDS) {
    const video = await fetchVideo(id).catch(() => null)
    if (!video || !video.title) {
      console.warn(`skip ${id}: no metadata`)
      continue
    }

    const prose = cleanDescription(video.description)
    const dek = firstSentence(prose || video.title)
    const summary = (prose || video.title).slice(0, 180)
    const seriesLine =
      "Part of sync. Crafting Magic — field notes and vlogs from building an AI video startup in San Francisco."
    const body = [prose, seriesLine, `[Watch on YouTube](${video.href})`].filter(Boolean).join("\n\n")

    let slug = conciseSlug(video.title)
    let n = 2
    while (used.has(slug)) slug = `${conciseSlug(video.title)}-${n++}`
    used.add(slug)

    const fields = {
      slug,
      platform: "YouTube",
      category: "Vlogumentaries",
      project: "sync-crafting-magic",
      format: "video",
      entryType: "Video",
      title: video.title,
      dek,
      date: video.uploadDate || "2025-01-01",
      href: video.href,
      image: `https://i.ytimg.com/vi/${id}/sddefault.jpg`,
      summary,
      role: "Producer & Editor",
    }

    await fs.writeFile(path.join(outDir, `${slug}.md`), frontmatter(fields, body))
    count++
    console.log(`+ ${slug}  (${fields.date})  ${video.title}`)
  }

  console.log(`\nImported ${count} Crafting Magic videos from playlist ${PLAYLIST}`)
}

run()
