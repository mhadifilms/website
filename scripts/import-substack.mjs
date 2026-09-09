import fs from "node:fs"
import path from "node:path"
import { randomUUID, createHash } from "node:crypto"
import { parse } from "csv-parse/sync"
import matter from "gray-matter"
import { Window } from "happy-dom"
import sharp from "sharp"
import { openStore } from "../server/store.mjs"
import { importHtml, slugify } from "../server/content.mjs"

const source = process.argv[2]
if (!source)
  throw new Error(
    "Usage: npm run cms:import -- /private/path/to/extracted/export [--download-media]",
  )
const download = process.argv.includes("--download-media")
const directory = path.resolve(process.env.CMS_DATA_DIR || ".cms-data")
const store = openStore(directory)
const mediaDirectory = path.join(directory, "media")
fs.mkdirSync(mediaDirectory, { recursive: true, mode: 0o700 })
const rows = parse(fs.readFileSync(path.join(source, "posts.csv")), {
  columns: true,
  skip_empty_lines: true,
})
const legacy = new Map()
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const name = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(name)
    else if (entry.name.endsWith(".md")) {
      const { data } = matter(fs.readFileSync(name, "utf8"))
      if (data.platform === "Substack" && data.href)
        legacy.set(
          new URL(data.href).pathname.split("/").pop(),
          `/archives/writings/${data.slug}`,
        )
    }
  }
}
walk("content/archives")
const mediaCache = new Map(),
  report = {
    imported: 0,
    skipped: 0,
    published: 0,
    privateDrafts: 0,
    preservedPaths: 0,
    media: 0,
    mediaFailures: [],
    review: [],
  }
async function migrateImage(url, fallback) {
  if (mediaCache.has(url)) return mediaCache.get(url)
  const parsed = new URL(url)
  if (
    parsed.protocol !== "https:" ||
    !["substack-post-media.s3.amazonaws.com", "substackcdn.com"].includes(
      parsed.hostname,
    )
  )
    throw new Error("Image host requires manual review")
  const response = await fetch(parsed, {
    redirect: "error",
    signal: AbortSignal.timeout(30000),
  })
  if (!response.ok) throw new Error(`Image returned ${response.status}`)
  const chunks = []
  let bytes = 0
  for await (const chunk of response.body) {
    bytes += chunk.length
    if (bytes > 25 * 1024 * 1024) throw new Error("Image exceeds 25 MB")
    chunks.push(chunk)
  }
  const original = Buffer.concat(chunks)
  const metadata = await sharp(original, {
    limitInputPixels: 60_000_000,
  }).metadata()
  if (!["png", "jpeg", "webp", "gif", "avif"].includes(metadata.format)) {
    if (!fallback) throw new Error("Unsupported image format")
    const converted = await migrateImage(fallback)
    mediaCache.set(url, converted)
    return converted
  }
  const buffer = await sharp(original)
    .rotate()
    .resize({
      width: 2400,
      height: 2400,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: 88 })
    .toBuffer()
  const output = await sharp(buffer).metadata(),
    id = randomUUID()
  fs.writeFileSync(path.join(mediaDirectory, `${id}.webp`), buffer, {
    mode: 0o600,
  })
  store.db
    .prepare(
      "INSERT INTO media (id,name,mime,width,height,bytes,created_at) VALUES (?,?,?,?,?,?,?)",
    )
    .run(
      id,
      `Substack ${parsed.pathname.split("/").pop().slice(0, 120)}`,
      "image/webp",
      output.width,
      output.height,
      buffer.length,
      new Date().toISOString(),
    )
  const value = `/api/media/${id}`
  mediaCache.set(url, value)
  report.media++
  return value
}
try {
  for (const row of rows) {
    if (!/^[\w.-]+$/.test(row.post_id)) throw new Error("Invalid post filename")
    if (
      store.db
        .prepare("SELECT id FROM posts WHERE source_id=?")
        .get(`substack:${row.post_id}`)
    ) {
      report.skipped++
      continue
    }
    const original = fs.readFileSync(
      path.join(source, "posts", `${row.post_id}.html`),
      "utf8",
    )
    const window = new Window({
      settings: {
        disableJavaScriptEvaluation: true,
        disableCSSFileLoading: true,
        disableJavaScriptFileLoading: true,
        disableIframePageLoading: true,
        enableFileSystemHttpRequests: false,
      },
    })
    const document = window.document
    document.body.innerHTML = original
    document
      .querySelectorAll(
        "script,style,svg,button,label.hide-text,.subscription-widget-wrap,.subscribe-widget",
      )
      .forEach((node) => node.remove())
    // Keep unsupported embeds as readable links rather than silently removing them.
    const notes = []
    document.querySelectorAll("iframe").forEach((frame) => {
      const src = frame.getAttribute("src") || ""
      if (!/^https:\/\/(www\.)?youtube(-nocookie)?\.com\//.test(src)) {
        const link = document.createElement("a")
        link.href = src
        link.textContent = "View the original embedded media"
        frame.replaceWith(link)
        notes.push("An embedded player was preserved as a link.")
      }
    })
    for (const image of document.querySelectorAll("img")) {
      const url = image.getAttribute("src") || ""
      const fallback = image
        .closest("picture")
        ?.querySelector('source[type="image/webp"]')
        ?.getAttribute("srcset")
        ?.split(/,\s+/)
        .pop()
        ?.split(/\s+/)[0]
      const figure = image.closest("figure"),
        caption = figure?.querySelector("figcaption")?.textContent || ""
      if (download && url) {
        try {
          image.setAttribute("src", await migrateImage(url, fallback))
        } catch (error) {
          report.mediaFailures.push({
            sourceId: row.post_id,
            url,
            error: error.message,
          })
          notes.push("One image still uses its original remote address.")
        }
      }
      // Flatten Substack's image controls and nested links, retaining the photograph and caption.
      if (figure) {
        const replacement = document.createElement("figure")
        replacement.appendChild(image.cloneNode())
        if (caption) {
          const label = document.createElement("figcaption")
          label.textContent = caption
          replacement.appendChild(label)
        }
        figure.replaceWith(replacement)
      }
    }
    const slug = row.post_id.split(".").slice(1).join(".") || slugify(row.title)
    const sourcePath = legacy.get(slug)
    const documentJson = importHtml(document.body.innerHTML)
    const post = store.create(
      {
        title: row.title,
        subtitle: row.subtitle,
        slug,
        format: "essay",
        date: row.post_date || new Date().toISOString(),
        document: documentJson,
        project: "Creative Chaos",
      },
      {
        id: `substack:${row.post_id}`,
        html: original,
        path: sourcePath,
        notes: [
          "Full Substack export imported. Original HTML retained privately. Review captions, links, and any unusual formatting before cutover.",
          ...notes,
        ].join(" "),
      },
    )
    const audience = row.audience === "everyone"
    if (row.is_published === "true" && audience) {
      store.publish(post.id, post.version)
      report.published++
    } else report.privateDrafts++
    if (sourcePath) report.preservedPaths++
    report.imported++
    if (notes.length) report.review.push({ sourceId: row.post_id, notes })
    await window.happyDOM.close()
  }
  fs.writeFileSync(
    path.join(directory, "import-report.json"),
    JSON.stringify(
      {
        ...report,
        sourceChecksum: createHash("sha256")
          .update(fs.readFileSync(path.join(source, "posts.csv")))
          .digest("hex"),
        importedAt: new Date().toISOString(),
      },
      null,
      2,
    ),
    { mode: 0o600 },
  )
  console.log(
    JSON.stringify({
      imported: report.imported,
      skipped: report.skipped,
      published: report.published,
      privateDrafts: report.privateDrafts,
      preservedPaths: report.preservedPaths,
      media: report.media,
      mediaFailures: report.mediaFailures.length,
      needsReview: report.review.length,
    }),
  )
} finally {
  store.close()
}
