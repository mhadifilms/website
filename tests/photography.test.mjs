import assert from "node:assert/strict"
import test from "node:test"
import fs from "node:fs/promises"
import matter from "gray-matter"
import { createHash } from "node:crypto"
import { relatedSeriesForExperience, seriesRun } from "../src/lib/archive-utils.ts"

const source = JSON.parse(await fs.readFile("content/sources/awaiten-projects.json", "utf8"))
const projects = source.projects.filter((project) => project.category === "Photography")
const webPath = (value) => `https://cdn.awaiten.com/cdn-cgi/image/width=1800,quality=82,format=auto${value.replace("/images/gallery-optimized/", "/images/gallery/").split("/").map(encodeURIComponent).join("/")}`

test("all Awaiten photography collections retain their photos, order, subfolders and source details", async () => {
  assert.equal(projects.length, 17)
  let count = 0
  for (const project of projects) {
    const { data, content } = matter(await fs.readFile(`content/archives/photography/${project.slug}.md`, "utf8"))
    assert.equal(data.category, "Photography")
    assert.equal(data.project, "awaiten-photography")
    assert.equal(data.displayDate, project.duration)
    assert.equal(data.href, `https://awaiten.com/photography/${project.slug}`)
    assert.deepEqual(data.gallery, project.gallery.map(webPath))
    assert.equal(data.galleryDimensions.length, data.gallery.length)
    assert(data.galleryDimensions.every(([width, height]) => width > 0 && height > 0))
    assert.deepEqual(data.galleryCategories, Object.fromEntries(Object.entries(project.galleryCategories || {}).map(([name, photos]) => [name.replaceAll("_", " "), photos.map(webPath)])))
    assert(content.replace(/<[^>]+>/g, " ").trim().length >= 180)
    count += data.gallery.length
  }
  assert.equal(count, 1154)
})

test("the five requested collections remain unlisted", async () => {
  const expected = ["wali-aylia-wedding", "rise-academy-lower-school", "senior-portraits", "sync-boilermake-winners", "tanzania-2025"].sort()
  const unlisted = []
  let publicPhotos = 0
  for (const project of projects) {
    const { data } = matter(await fs.readFile(`content/archives/photography/${project.slug}.md`, "utf8"))
    if (data.unlisted) unlisted.push(data.slug)
    else publicPhotos += data.gallery.length
  }
  assert.deepEqual(unlisted.sort(), expected)
  assert.equal(publicPhotos, 828)
})

test("unlisted collections never appear in series navigation or experience previews", async () => {
  const items = await Promise.all(projects.map(async (project) => matter(await fs.readFile(`content/archives/photography/${project.slug}.md`, "utf8")).data))
  for (const item of items) {
    const run = seriesRun(items, item)
    assert(!run.previous?.unlisted)
    assert(!run.next?.unlisted)
    assert.equal(run.total, item.unlisted ? 0 : 12)
  }
  const groups = relatedSeriesForExperience("awaiten-films", [{ slug: "awaiten-photography", relatedExperience: "awaiten-films", order: 1 }], items)
  assert.equal(groups[0].entries.length, 12)
  assert(groups[0].entries.every(item => !item.unlisted))
})

test("every catalog photograph and cover uses Cloudflare with a preserved original checksum", async () => {
  const manifest = JSON.parse(await fs.readFile("content/sources/awaiten-photography-assets.json", "utf8"))
  assert.equal(manifest.assets.length, 1156)
  await assert.rejects(fs.access("public/media/photography"))
  const byImage = new Map(manifest.assets.map((asset) => [asset.image, asset]))
  for (const project of projects) {
    for (const source of [project.thumbnail, ...project.gallery]) assert(byImage.has(webPath(source)), source)
  }
  for (const asset of manifest.assets) {
    assert.match(asset.sha256, /^[a-f0-9]{64}$/)
    assert(asset.bytes > 0 && asset.width > 0 && asset.height > 0)
    if (process.env.VERIFY_PHOTOGRAPHY_ORIGINALS === "1") {
      const original = await fs.readFile(asset.original)
      assert.equal(original.length, asset.bytes, asset.original)
      assert.equal(createHash("sha256").update(original).digest("hex"), asset.sha256, asset.original)
    }
    for (const [field, transform] of [["image", "width=1800,quality=82,format=auto"], ["thumbnail", "width=640,quality=75,format=auto"]]) {
      const url = new URL(asset[field])
      assert.equal(url.origin, "https://cdn.awaiten.com")
      assert.equal(url.pathname, `/cdn-cgi/image/${transform}${new URL(asset.source).pathname}`)
    }
  }
})
