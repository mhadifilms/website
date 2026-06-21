import fs from "node:fs/promises"
import path from "node:path"
import matter from "gray-matter"
import { marked } from "marked"

const root = process.cwd()
const contentDir = path.join(root, "content")
const outputFile = path.join(root, "src", "content", "generated.ts")
const PROJECT_TYPES = ["Writing", "Video", "Tools", "Profiles"]
const PROJECT_STATUSES = ["Active", "Archive", "Profile"]
const ARCHIVE_ENTRY_TYPES = ["Article", "Video", "Post", "Profile", "Tool", "Prototype", "Project"]
const ARCHIVE_PLATFORMS = ["Linkedin", "Twitter", "Instagram", "Substack", "YouTube"]

marked.use({
  gfm: true,
  breaks: false,
})

const byExperienceOrder = (a, b) => {
  const orderDelta = Number(a.order ?? Number.MAX_SAFE_INTEGER) - Number(b.order ?? Number.MAX_SAFE_INTEGER)
  if (orderDelta !== 0) return orderDelta
  return new Date(b.dateStart ?? 0) - new Date(a.dateStart ?? 0)
}
const byProjectOrder = (a, b) => {
  const orderDelta = Number(a.order ?? Number.MAX_SAFE_INTEGER) - Number(b.order ?? Number.MAX_SAFE_INTEGER)
  if (orderDelta !== 0) return orderDelta
  return String(a.title).localeCompare(String(b.title))
}
const byDateDesc = (a, b) => new Date(b.date ?? 0) - new Date(a.date ?? 0)

async function readJson(relativePath) {
  const file = path.join(contentDir, relativePath)
  try {
    return JSON.parse(await fs.readFile(file, "utf8"))
  } catch (error) {
    if (error.code === "ENOENT") return null
    throw error
  }
}

async function readCollection(name, { renderBody = true } = {}) {
  const dir = path.join(contentDir, name)
  const markdownFiles = await markdownFilesIn(dir)

  const items = await Promise.all(
    markdownFiles.map(async (file) => {
      const source = await fs.readFile(file, "utf8")
      const { data, content } = matter(source)
      const item = {
        ...data,
        slug: data.slug ?? path.basename(file, ".md"),
      }
      if (renderBody) {
        item.html = marked.parse(content, { async: false })
      }
      return item
    }),
  )

  return items
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

  return files.flat().sort()
}

function assertRequiredFields(items, collection, fields) {
  for (const item of items) {
    for (const field of fields) {
      if (item[field] === undefined || item[field] === "") {
        throw new Error(`${collection}/${item.slug ?? "unknown"} is missing "${field}"`)
      }
    }
  }
}

function assertUniqueSlugs(items, collection) {
  const seen = new Set()
  for (const item of items) {
    if (seen.has(item.slug)) throw new Error(`${collection}/${item.slug} has a duplicate slug`)
    seen.add(item.slug)
  }
}

function assertEnum(value, allowed, field, item) {
  if (value === undefined || value === "") return
  if (!allowed.includes(value)) {
    throw new Error(`${item.slug ?? "unknown"} has invalid ${field} "${value}". Use one of: ${allowed.join(", ")}`)
  }
}

function assertProjectRefs(archives, projects) {
  const projectSlugs = new Set(projects.map((project) => project.slug))
  for (const archive of archives) {
    if (archive.project && !projectSlugs.has(archive.project)) {
      throw new Error(`archives/${archive.slug} references missing project "${archive.project}"`)
    }
  }
}

function defaultProjectTypeForPlatform(platform) {
  if (platform === "Substack") return "Writing"
  if (platform === "YouTube") return "Video"
  if (platform === "Linkedin") return "Writing"
  if (platform === "Instagram" || platform === "Twitter") return "Profiles"
  return "Writing"
}

function defaultEntryTypeForPlatform(platform) {
  if (platform === "Substack") return "Article"
  if (platform === "YouTube") return "Video"
  if (platform === "Linkedin") return "Post"
  if (platform === "Instagram" || platform === "Twitter") return "Profile"
  return "Project"
}

function normalizeProject(project, index) {
  return {
    ...project,
    order: Number(project.order ?? index + 1),
    platforms: project.platforms ?? [],
  }
}

function normalizeArchive(archive, projectBySlug) {
  const linkedProject = archive.project ? projectBySlug.get(archive.project) : undefined
  const projectType = archive.projectType ?? linkedProject?.type ?? defaultProjectTypeForPlatform(archive.platform)

  return {
    ...archive,
    projectType,
    entryType: archive.entryType ?? defaultEntryTypeForPlatform(archive.platform),
  }
}

function assertProjectShape(projects) {
  for (const project of projects) {
    assertEnum(project.type, PROJECT_TYPES, "type", project)
    assertEnum(project.status, PROJECT_STATUSES, "status", project)
    for (const platform of project.platforms ?? []) {
      assertEnum(platform, ARCHIVE_PLATFORMS, "platforms[]", project)
    }
  }
}

function assertArchiveShape(archives, projectBySlug) {
  for (const archive of archives) {
    assertEnum(archive.platform, ARCHIVE_PLATFORMS, "platform", archive)
    assertEnum(archive.projectType, PROJECT_TYPES, "projectType", archive)
    assertEnum(archive.entryType, ARCHIVE_ENTRY_TYPES, "entryType", archive)
    const project = archive.project ? projectBySlug.get(archive.project) : undefined
    if (project && archive.projectType !== project.type) {
      throw new Error(`archives/${archive.slug} has projectType "${archive.projectType}" but project "${archive.project}" is "${project.type}"`)
    }
  }
}

const site = (await readJson("site.json")) ?? {}

const experiences = (await readCollection("experiences")).sort(byExperienceOrder)
const projects = (await readCollection("projects")).map(normalizeProject).sort(byProjectOrder)
const projectBySlug = new Map(projects.map((project) => [project.slug, project]))
const archives = (await readCollection("archives", { renderBody: false }))
  .map((archive) => normalizeArchive(archive, projectBySlug))
  .sort(byDateDesc)

assertRequiredFields(experiences, "experiences", ["title", "slug", "order", "company", "role", "dateStart", "summary"])
assertRequiredFields(projects, "projects", ["slug", "title", "order", "type", "summary"])
assertRequiredFields(archives, "archives", ["slug", "platform", "projectType", "entryType", "title", "href", "date"])
assertUniqueSlugs(experiences, "experiences")
assertUniqueSlugs(projects, "projects")
assertUniqueSlugs(archives, "archives")
assertProjectRefs(archives, projects)
assertProjectShape(projects)
assertArchiveShape(archives, projectBySlug)

const output = `// This file is generated by scripts/build-content.mjs. Do not edit by hand.
import type { ArchiveItem, Experience, Project, SiteConfig } from "./types"

export const site = ${JSON.stringify(site, null, 2)} satisfies SiteConfig

export const experiences = ${JSON.stringify(experiences, null, 2)} satisfies Experience[]

export const projects = ${JSON.stringify(projects, null, 2)} satisfies Project[]

export const archives = ${JSON.stringify(archives, null, 2)} satisfies ArchiveItem[]
`

await fs.mkdir(path.dirname(outputFile), { recursive: true })
await fs.writeFile(outputFile, output)
