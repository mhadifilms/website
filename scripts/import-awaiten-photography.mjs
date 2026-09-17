import fs from "node:fs/promises"
import path from "node:path"
import { createHash } from "node:crypto"
import sharp from "sharp"
import matter from "gray-matter"

// The source snapshot is kept verbatim; originals stay outside the deployed site.
const root = process.cwd()
const source = JSON.parse(await fs.readFile("content/sources/awaiten-projects.json", "utf8"))
const projects = source.projects.filter((project) => project.category === "Photography")
const normalize = (value) => value.replace("/images/gallery-optimized/", "/images/gallery/")
const assets = [...new Set(projects.flatMap((project) => [
  project.thumbnail, ...(project.gallery || []), ...Object.values(project.galleryCategories || {}).flat(),
  ...[...JSON.stringify(project).matchAll(/\/images\/[^"\\<>]+\.(?:jpe?g|png|webp)/gi)].map(([value]) => value),
]).filter(Boolean).map(normalize))].sort()
const originalRoot = path.join(root, "awaiten-originals.local")
const cdnPath = (value) => normalize(value).split("/").map(encodeURIComponent).join("/")
const webPath = (value) => `https://cdn.awaiten.com/cdn-cgi/image/width=1800,quality=82,format=auto${cdnPath(value)}`
const thumbPath = (value) => `https://cdn.awaiten.com/cdn-cgi/image/width=640,quality=75,format=auto${cdnPath(value)}`
const url = (value) => `https://cdn.awaiten.com${value.split("/").map(encodeURIComponent).join("/")}`
async function pool(values, action, concurrency = 8) {
  let cursor = 0
  await Promise.all(Array.from({ length: concurrency }, async () => {
    while (cursor < values.length) { const index = cursor++; await action(values[index], index) }
  }))
}
async function request(value, method = "GET") {
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const response = await fetch(url(value), { method, signal: AbortSignal.timeout(120000) })
      if (!response.ok) throw new Error(`${response.status}: ${value}`)
      if (!response.headers.get("content-type")?.startsWith("image/")) throw new Error(`Not an image: ${value}`)
      return response
    } catch (error) {
      if (attempt === 3) throw error
      await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)))
    }
  }
}
if (!process.argv.includes("--content-only")) {
  await fs.mkdir(originalRoot, { recursive: true })
  const sizes = new Map()
  let remainingBytes = 0
  await pool(assets, async (asset, index) => {
    const response = await request(asset, "HEAD")
    const bytes = Number(response.headers.get("content-length"))
    if (!bytes) throw new Error(`Missing original size: ${asset}`)
    sizes.set(asset, bytes)
    const local = await fs.stat(path.join(originalRoot, asset)).catch(() => null)
    if (local?.size !== bytes) remainingBytes += bytes
    if ((index + 1) % 100 === 0) console.log(`Inventoried ${index + 1}/${assets.length}`)
  })
  const disk = await fs.statfs(root)
  const available = disk.bavail * disk.bsize
  console.log(JSON.stringify({ originals: assets.length, totalBytes: [...sizes.values()].reduce((a, b) => a + b, 0), remainingBytes, availableBytes: available }))
  if (remainingBytes + 2 * 1024 ** 3 > available) throw new Error("Insufficient disk space for originals plus 2 GiB headroom")
  const manifest = []
  let completed = 0
  await pool(assets, async (asset) => {
    const local = path.join(originalRoot, asset)
    await fs.mkdir(path.dirname(local), { recursive: true })
    const stat = await fs.stat(local).catch(() => null)
    if (stat?.size !== sizes.get(asset)) {
      const data = Buffer.from(await (await request(asset)).arrayBuffer())
      if (data.length !== sizes.get(asset)) throw new Error(`Truncated download: ${asset}`)
      await fs.writeFile(`${local}.part`, data)
      await fs.rename(`${local}.part`, local)
    }
    const buffer = await fs.readFile(local)
    const metadata = await sharp(buffer).metadata()
    manifest.push({ source: url(asset), original: path.relative(root, local), image: webPath(asset), thumbnail: thumbPath(asset), bytes: buffer.length, sha256: createHash("sha256").update(buffer).digest("hex"), width: metadata.width, height: metadata.height })
    completed++
    if (completed % 25 === 0 || completed === assets.length) console.log(`Saved and verified ${completed}/${assets.length}`)
  }, 4)

  manifest.sort((a, b) => a.source.localeCompare(b.source))
  await fs.writeFile("content/sources/awaiten-photography-assets.json", JSON.stringify({ sourceRepository: "https://github.com/mhadifilms/awaiten.com", sourceCommit: "4139f9b82bc6db4cd509c0a383753c0d8dc11c92", collections: projects.length, galleryPhotos: new Set(projects.flatMap((p) => p.gallery || [])).size, assets: manifest }, null, 2) + "\n")
  console.log(`Imported ${projects.length} collections and ${manifest.length} original assets.`)

}

const inventory = JSON.parse(await fs.readFile("content/sources/awaiten-photography-assets.json", "utf8"))
const dimensions = new Map(inventory.assets.map(asset => [asset.image, [asset.width, asset.height]]))

const clean = (value = "") => value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
const brand = (value) => value.replace(/sync\.hq/g, "sync. labs HQ").replace(/\bsync\.(?! labs)/g, "sync. labs").replace(/\bsync @/g, "sync. labs @")
await fs.mkdir("content/archives/photography", { recursive: true })
await fs.writeFile("content/projects/awaiten-photography.md", matter.stringify("Photography from Awaiten Films, including travel, portraits, weddings, events, and life behind the scenes. Each collection preserves its original photographs and project details.\n", {
  slug: "awaiten-photography", title: "Awaiten Photography", order: 4, category: "Photography", type: "Photography", status: "Archive", image: thumbPath(projects[0].thumbnail), summary: "Travel, portraits, weddings, events, and behind-the-scenes photography from Awaiten Films.", href: "https://awaiten.com/photography", relatedExperience: "awaiten-films", platforms: ["Website"],
}))
for (const project of projects) {
  const existing = matter(await fs.readFile(`content/archives/photography/${project.slug}.md`, "utf8").catch(() => "")).data
  const unlisted = existing.unlisted ?? project.gallerySettings?.unlisted ?? false
  const title = brand(project.title)
  const gallery = [...new Set([...(project.gallery || []), ...Object.values(project.galleryCategories || {}).flat()])]
  const date = new Date(project.duration.replace(/(\d+)(st|nd|rd|th)/g, "$1"))
  if (!Number.isFinite(date.getTime())) throw new Error(`Unrecognized date: ${project.duration}`)
  const description = brand(clean(project.about))
  const html = [project.content, project.otherInfo1, project.otherInfo2].filter(Boolean).join("\n")
    .replace(/<img\b[^>]*>/gi, "")
    .replace(/<h[1-6]>\s*(?:<br\s*\/?>\s*)*<\/h[1-6]>/gi, "")
  const body = `${description}\n\n${title} is a ${project.deliverables.toLowerCase()} collection from Awaiten Films, dated ${project.duration}. The collection includes ${gallery.length} photographs in the original collection order${project.client !== "Personal" ? `, created for ${brand(project.client)}` : ""}.\n\n${brand(html)}\n`
  await fs.writeFile(`content/archives/photography/${project.slug}.md`, matter.stringify(body.trim(), {
    unlisted, galleryDimensions: gallery.map(photo => dimensions.get(webPath(photo))),
    slug: project.slug, title, platform: "Website", category: "Photography", format: "photo-set", entryType: "Photo", project: "awaiten-photography", dek: description, summary: description, image: thumbPath(project.thumbnail), href: `https://awaiten.com/photography/${project.slug}`, date: date.toISOString().slice(0, 10), displayDate: project.duration, credits: `Awaiten Films\nClient: ${brand(project.client)}\n${project.deliverables}`, gallery: gallery.map(webPath), galleryCategories: Object.fromEntries(Object.entries(project.galleryCategories || {}).map(([name, photos]) => [name.replaceAll("_", " "), photos.map(webPath)])),
  }))
}
console.log(`Wrote ${projects.length} photography collections.`)
