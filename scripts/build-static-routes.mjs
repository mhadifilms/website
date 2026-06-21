import fs from "node:fs/promises"
import path from "node:path"
import matter from "gray-matter"
import { marked } from "marked"

const root = process.cwd()
const distDir = path.join(root, "dist")
const contentDir = path.join(root, "content")
const SITE_URL = "https://mhadifilms.com"
const SOCIAL_IMAGE = `${SITE_URL}/media/social-card.png`
const SOCIAL_IMAGE_ALT = "A black-and-white film strip from Muhammad Hadi Yusufali's creative work."

marked.use({
  gfm: true,
  breaks: false,
})

const routes = [
  {
    path: "/",
    output: "index.html",
    title: "Muhammad Hadi Yusufali | M Hadi",
    description:
      "Writing my story as you read it. A creator experimenting across many mediums at the intersection of tech and creativity.",
  },
  {
    path: "/about",
    canonicalPath: "/",
    output: "about/index.html",
    title: "About Muhammad Hadi Yusufali | M Hadi",
    description:
      "Learn about Muhammad Hadi Yusufali, a creator and filmmaker working across storytelling, video production, creative technology, and digital media.",
  },
  {
    path: "/experiences",
    output: "experiences/index.html",
    title: "Experiences | Muhammad Hadi Yusufali",
    description:
      "Explore Muhammad Hadi Yusufali's work across sync. labs, Journey Tellers, Awaiten Films, selected collaborators, and freelance filmmaking.",
  },
  {
    path: "/archives",
    output: "archives/index.html",
    title: "Archives | Muhammad Hadi Yusufali",
    description:
      "Selected public posts and creative work from Muhammad Hadi Yusufali across LinkedIn, Twitter/X, Instagram, Substack, and YouTube.",
  },
]

const fallbackRoute = {
  path: "/",
  output: "404.html",
  title: "Page not found | M Hadi",
  description: "This page could not be found. Return to Muhammad Hadi Yusufali's portfolio and creative archive.",
  noindex: true,
}

const CATEGORY_SLUGS = {
  Writings: "writings",
  Vlogumentaries: "vlogumentaries",
  "Films & Commercials": "films-commercials",
  Photography: "photography",
  Tools: "tools",
  Miscellaneous: "miscellaneous",
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

async function readCollection(name) {
  const files = await markdownFilesIn(path.join(contentDir, name))
  return Promise.all(
    files.map(async (file) => {
      const source = await fs.readFile(file, "utf8")
      const { data, content } = matter(source)
      return {
        ...data,
        slug: data.slug ?? path.basename(file, ".md"),
        html: marked.parse(content, { async: false }),
      }
    }),
  )
}

function archivePath(item) {
  return `/archives/${CATEGORY_SLUGS[item.category]}/${item.slug}`
}

function absoluteAsset(value) {
  if (!value) return SOCIAL_IMAGE
  if (/^https?:\/\//.test(value)) return value
  return `${SITE_URL}${value.startsWith("/") ? value : `/${value}`}`
}

function escapeAttr(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
}

function escapeText(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
}

function canonicalFor(routePath) {
  return `${SITE_URL}${routePath === "/" ? "/" : routePath}`
}

function replaceTag(html, regex, replacement) {
  if (!regex.test(html)) {
    throw new Error(`Unable to update expected head tag: ${regex}`)
  }
  return html.replace(regex, replacement)
}

function setTitle(html, title) {
  return replaceTag(html, /<title>[\s\S]*?<\/title>/, `<title>${escapeText(title)}</title>`)
}

function setLink(html, rel, href) {
  const re = new RegExp(`<link\\s+rel="${rel}"[\\s\\S]*?>`)
  return replaceTag(html, re, `<link rel="${rel}" href="${escapeAttr(href)}" />`)
}

function setMetaName(html, name, content) {
  const re = new RegExp(`<meta\\s+name="${name}"[\\s\\S]*?>`)
  return replaceTag(html, re, `<meta name="${name}" content="${escapeAttr(content)}" />`)
}

function setMetaProperty(html, property, content) {
  const re = new RegExp(`<meta\\s+property="${property}"[\\s\\S]*?>`)
  return replaceTag(html, re, `<meta property="${property}" content="${escapeAttr(content)}" />`)
}

function injectPrerenderedRoot(html, route) {
  if (!route.prerenderHtml) return html
  return replaceTag(
    html,
    /<div id="root"><\/div>/,
    `<div id="root">${route.prerenderHtml}</div>`,
  )
}

function injectJsonLd(html, route) {
  if (!route.jsonLd) return html
  const json = JSON.stringify(route.jsonLd).replace(/</g, "\\u003c")
  return html.replace("</head>", `<script type="application/ld+json">${json}</script>\n</head>`)
}

function routeHtml(template, route) {
  const canonical = canonicalFor(route.canonicalPath ?? route.path)
  const image = route.image ?? SOCIAL_IMAGE
  const imageAlt = route.imageAlt ?? SOCIAL_IMAGE_ALT
  let html = template

  html = setTitle(html, route.title)
  html = setLink(html, "canonical", route.noindex ? SITE_URL : canonical)
  html = setMetaName(html, "description", route.description)
  html = setMetaName(html, "robots", route.noindex ? "noindex, follow" : "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1")
  html = setMetaName(html, "googlebot", route.noindex ? "noindex, follow" : "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1")
  html = setMetaName(html, "bingbot", route.noindex ? "noindex, follow" : "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1")
  html = setMetaProperty(html, "og:title", route.title)
  html = setMetaProperty(html, "og:description", route.description)
  html = setMetaProperty(html, "og:url", route.noindex ? SITE_URL : canonical)
  html = setMetaProperty(html, "og:image", image)
  html = setMetaProperty(html, "og:image:secure_url", image)
  html = setMetaProperty(html, "og:image:type", "image/png")
  html = setMetaProperty(html, "og:image:width", "1200")
  html = setMetaProperty(html, "og:image:height", "630")
  html = setMetaProperty(html, "og:image:alt", imageAlt)
  html = setMetaName(html, "twitter:title", route.title)
  html = setMetaName(html, "twitter:description", route.description)
  html = setMetaName(html, "twitter:image", image)
  html = setMetaName(html, "twitter:image:alt", imageAlt)
  html = injectJsonLd(html, route)
  html = injectPrerenderedRoot(html, route)

  return html
}

async function writeRoute(template, route) {
  const outputFile = path.join(distDir, route.output)
  await fs.mkdir(path.dirname(outputFile), { recursive: true })
  await fs.writeFile(outputFile, routeHtml(template, route))
}

function archiveJsonLd(item, project, canonical) {
  const description = item.seoDescription || item.summary || item.dek
  const isVideo = item.platform === "YouTube"
  const thing = isVideo
    ? {
        "@context": "https://schema.org",
        "@type": "VideoObject",
        name: item.title,
        description,
        thumbnailUrl: item.image ? [absoluteAsset(item.image)] : undefined,
        uploadDate: item.date,
        embedUrl: item.href.replace("watch?v=", "embed/"),
        url: canonical,
      }
    : {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: item.title,
        description,
        image: item.image ? [absoluteAsset(item.image)] : undefined,
        datePublished: item.date,
        author: {
          "@type": "Person",
          name: "Muhammad Hadi Yusufali",
          alternateName: "M Hadi",
        },
        url: canonical,
      }

  return [
    thing,
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Archives",
          item: `${SITE_URL}/archives`,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: item.category,
          item: `${SITE_URL}/archives#${CATEGORY_SLUGS[item.category]}`,
        },
        {
          "@type": "ListItem",
          position: 3,
          name: project?.title ?? item.title,
          item: canonical,
        },
      ],
    },
  ]
}

function archivePrerenderHtml(item, project) {
  const canonical = canonicalFor(archivePath(item))
  const kicker = `${escapeText(item.category)}${project ? ` / ${escapeText(project.title)}` : ""} / ${escapeText(item.format)} / ${escapeText(item.date)}`
  const meta = [
    item.role ? `Role: ${escapeText(item.role)}` : "",
    `Format: ${escapeText(item.format)}`,
    `Source: ${escapeText(item.platform)}`,
  ]
    .filter(Boolean)
    .join(" · ")
  return `<main class="bg-background text-foreground"><article style="max-width:1040px;margin:0 auto;padding:56px 24px"><p>${kicker}</p><h1>${escapeText(item.title)}</h1>${item.dek ? `<p>${escapeText(item.dek)}</p>` : ""}<p>${meta}</p>${item.image ? `<img src="${escapeAttr(item.image)}" alt="${escapeAttr(item.title)}" style="width:100%;height:auto" />` : ""}<div>${item.html}</div>${item.credits ? `<aside><h2>Credits</h2><p>${escapeText(item.credits)}</p></aside>` : ""}<p><a href="${escapeAttr(item.href)}">Open original</a></p><p><a href="${escapeAttr(canonical)}">${escapeText(canonical)}</a></p></article></main>`
}

function archiveRoute(item, project) {
  const routePath = archivePath(item)
  const canonical = canonicalFor(routePath)
  const description = item.seoDescription || item.summary || item.dek || `A ${item.category} archive entry from Muhammad Hadi Yusufali.`
  return {
    path: routePath,
    output: `${routePath.replace(/^\/+/, "")}/index.html`,
    title: item.seoTitle || `${item.title} | Archives | M Hadi`,
    description,
    image: absoluteAsset(item.image),
    imageAlt: item.title,
    jsonLd: archiveJsonLd(item, project, canonical),
    prerenderHtml: archivePrerenderHtml(item, project),
    lastmod: item.date,
  }
}

function sitemap(routesToInclude) {
  const seen = new Set()
  const urls = routesToInclude
    .filter((route) => !route.noindex)
    .filter((route) => {
      const canonical = canonicalFor(route.canonicalPath ?? route.path)
      if (seen.has(canonical)) return false
      seen.add(canonical)
      return true
    })
    .map((route) => {
      const canonical = canonicalFor(route.canonicalPath ?? route.path)
      const lastmod = route.lastmod ? `\n    <lastmod>${escapeText(route.lastmod)}</lastmod>` : ""
      return `  <url>\n    <loc>${escapeText(canonical)}</loc>${lastmod}\n  </url>`
    })
    .join("\n")

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`
}

const template = await fs.readFile(path.join(distDir, "index.html"), "utf8")
const projects = await readCollection("projects")
const projectBySlug = new Map(projects.map((project) => [project.slug, project]))
const archives = (await readCollection("archives"))
  .filter((item) => item.category && CATEGORY_SLUGS[item.category])
  .sort((a, b) => new Date(b.date ?? 0) - new Date(a.date ?? 0))
const archiveRoutes = archives.map((item) => archiveRoute(item, projectBySlug.get(item.project)))

for (const route of [...routes, ...archiveRoutes]) {
  await writeRoute(template, route)
}

await writeRoute(template, fallbackRoute)
await fs.writeFile(path.join(distDir, "sitemap.xml"), sitemap([...routes, ...archiveRoutes]))
