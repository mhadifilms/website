// One-off importer for the Journey Tellers Podcast playlist (@JourneyTellers).
// The RSS feed only returns the latest 15 items, so the full ordered episode
// list is hardcoded here from the playlist. These entries live in their own
// folder so the RSS-based archive sync (which wipes substack/ and youtube/)
// never deletes them.
import fs from "node:fs/promises"
import path from "node:path"

const root = process.cwd()
const outDir = path.join(root, "content", "archives", "podcast")

// id, date, title — in playlist order (newest first)
const EPISODES = [
  ["LOo1FpDaw9E", "2025-01-14", "Law Enforcement Myths & Being a Muslim Cop: Irfan Zaidi"],
  ["qCmr3NFFIdE", "2025-01-06", "The Secret to Getting 1 Billion Views with Comedy: Azfar Khan"],
  ["kG734uJ01Hk", "2024-10-27", "The Ultimate Guide to Reclaiming Your Identity ft. Maulana Abidi, Sheikh Salim, and Sheikh Mehdi"],
  ["kJlH3zx1jVs", "2024-08-18", "Showing the Media That Muslims Also Have Fun: Irfan Rydhan and the Story of HalalFest"],
  ["opZHgqnkh7s", "2024-08-02", "From College Dropout to Renowned Restaurateur: Hisham Abdelfattah and the Story of El Halal Amigos"],
  ["YqRCuN6HBv8", "2024-02-17", "Shattering Hijabi Tech Stereotypes ft. Fatima Ali"],
  ["zzhpV-RlarI", "2024-02-03", "The Real Way to Become a Young Millionaire ft. Zain Zaidi"],
  ["8BYQncSGFcc", "2024-01-28", "Navigating Medicine: Healthcare, Equity, and Empathy ft. Naseem Rangwala"],
  ["3FcAWSa1Ldg", "2023-12-14", "Escaping Iraq: War, Refugee Camps, and the Power of Faith ft. Jawad Almamori"],
  ["RJN_m5PglPs", "2023-11-03", "The Power of Education & Mindset ft. Raza Ali"],
  ["c9s8OEdERuA", "2023-07-11", "The Secrets Behind Pixar's Most Famous Movies ft. Eman Abdul-Razzak"],
  ["lR72xZBrkZs", "2023-07-04", "43 Years Volunteering at a Mosque ft. Muzaffer Khan"],
  ["BQEJyiOT3kg", "2023-06-24", "Cooking, Creativity, and Community ft. Abbas Mohamed"],
  ["A4zGTaW6vfU", "2023-06-18", "Unlocking Global Impact through Business ft. Mir Aamir"],
  ["a7jMrGHX5P4", "2023-05-27", "AI - the Good, the Bad, and the Ugly ft. Nazneen Rajani"],
  ["OJP0fubChH0", "2023-05-07", "From Punk Rock to PhD: The Journey of David Coolidge"],
  ["tg5nFaIgVFg", "2023-04-24", "From Corporate Climber to Spiritual Seeker: The Journey of Mahdi Falahati"],
  ["3Y02YIphMAA", "2023-04-12", "Friends, Faith, and Family Advocates: The Journey of Natima Neily"],
  ["cvx4cxLYVh4", "2023-04-01", "Risks, Startups, and Unconventional Routes: The Journey of Ali Mir"],
  ["JgU_n00d0JU", "2023-03-24", "Entrepreneurs, Leaders, and Mentors: The Journey of Ahmad Ahmadzia"],
]

const SLUG_STOPWORDS = new Set(
  "a an the and or but nor of to in into onto on at by for from with as my your our his her their its this that these those".split(" "),
)
const SLUG_MAX_WORDS = 7
const SLUG_MAX_LENGTH = 56

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
  return picked.join("-") || "episode"
}

function decodeHtml(value = "") {
  return value
    .replace(/\\u0026/g, "&")
    .replace(/\\n/g, " ")
    .replace(/\\"/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim()
}

function cleanDescription(raw = "") {
  let text = raw
  // Prefer the editorial blurb after an "ABOUT THE EPISODE" style marker.
  const aboutMatch = text.match(/about (?:the|this) episode[:\s]*/i)
  if (aboutMatch) text = text.slice(aboutMatch.index + aboutMatch[0].length)
  // Drop a leading "if you enjoyed this episode, you'll love ..." recommendation.
  text = text.replace(/^.*?if you enjoyed this episode,?\s*you'?ll love\s*/i, "")
  // Cut off the link/credits/timestamps tail.
  text = text.split(/\b(?:connect with|follow|subscribe|timestamps?|chapters?|credits|produced by|hosted by|available on|help support|social|instagram|tiktok|patreon|buymeacoffee)\b/i)[0]
  return text
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2190}-\u{21FF}\u{2B00}-\u{2BFF}\uFE0F]/gu, " ")
    .replace(/#\w+/g, " ")
    .replace(/@\w+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

async function fetchDescription(id) {
  const res = await fetch(`https://www.youtube.com/watch?v=${id}`, {
    headers: { "user-agent": "Mozilla/5.0" },
  })
  const html = await res.text()
  const match = html.match(/"shortDescription":"((?:[^"\\]|\\.)*)"/)
  return match ? cleanDescription(decodeHtml(match[1])) : ""
}

function firstSentences(text = "", count = 3, max = 320) {
  const clean = text.replace(/\s+/g, " ").trim()
  const sentences = clean.split(/(?<=[.!?])\s/).slice(0, count).join(" ")
  if (sentences.length <= max) return sentences
  return `${sentences.slice(0, max).replace(/\s+\S*$/, "")}…`
}

function guestFrom(title) {
  const ft = title.match(/(?:ft\.|featuring)\s+(.+)$/i)
  if (ft) return ft[1].replace(/\.$/, "")
  const colon = title.match(/:\s*([^:]+)$/)
  if (colon) return colon[1].replace(/(?:and the Story of|the Journey of)\s+/i, "").replace(/\.$/, "").trim()
  return ""
}

function dek(title, guest) {
  if (guest) return `A Journey Tellers Podcast conversation with ${guest}.`
  return "An episode of the Journey Tellers Podcast."
}

function body(title, href, desc, guest) {
  const blurb = desc ? firstSentences(desc, 4, 480) : ""
  const parts = [
    blurb || `A Journey Tellers Podcast conversation${guest ? ` with ${guest}` : ""}.`,
    `[Watch on YouTube](${href})`,
  ].filter(Boolean)
  return parts.join("\n\n")
}

async function run() {
  await fs.mkdir(outDir, { recursive: true })
  const usedSlugs = new Set()
  for (const [id, date, rawTitle] of EPISODES) {
    const title = rawTitle.replace(/&/g, "&")
    const href = `https://www.youtube.com/watch?v=${id}`
    const image = `https://i.ytimg.com/vi/${id}/maxresdefault.jpg`
    const guest = guestFrom(title)
    let desc = ""
    try {
      desc = await fetchDescription(id)
    } catch {
      desc = ""
    }
    let slug = conciseSlug(title)
    let n = 2
    while (usedSlugs.has(slug)) slug = `${conciseSlug(title)}-${n++}`
    usedSlugs.add(slug)

    const summary = desc ? firstSentences(desc, 2, 200) : dek(title, guest)
    const fm = [
      "---",
      `slug: ${JSON.stringify(slug)}`,
      `platform: "YouTube"`,
      `category: "Miscellaneous"`,
      `project: "journey-tellers-podcast"`,
      `format: "podcast"`,
      `entryType: "Video"`,
      `title: ${JSON.stringify(title)}`,
      `dek: ${JSON.stringify(dek(title, guest))}`,
      `date: ${JSON.stringify(date)}`,
      `href: ${JSON.stringify(href)}`,
      `image: ${JSON.stringify(image)}`,
      `summary: ${JSON.stringify(summary)}`,
      `role: "Host & Producer"`,
      guest ? `credits: ${JSON.stringify(`Guest: ${guest}`)}` : null,
      "---",
      "",
      body(title, href, desc, guest),
      "",
    ].filter((line) => line !== null)

    await fs.writeFile(path.join(outDir, `${slug}.md`), fm.join("\n"))
    console.log(`wrote ${slug}.md  (${guest || "no guest"})`)
  }
  console.log(`\nDone: ${EPISODES.length} episodes -> content/archives/podcast/`)
}

run()
