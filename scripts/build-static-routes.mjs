import fs from "node:fs/promises"
import path from "node:path"
import matter from "gray-matter"
import { marked } from "marked"

const root = process.cwd()
const distDir = path.join(root, "dist")
const contentDir = path.join(root, "content")
const SITE_URL = "https://mhadifilms.com"
const PERSON_ID = `${SITE_URL}/#person`
const WEBSITE_ID = `${SITE_URL}/#website`
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
      "Selected public posts and creative work from Muhammad Hadi Yusufali across writings, vlogumentaries, films, the Journey Tellers Podcast, and creative tools.",
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

const CATEGORY_META = {
  Writings: {
    title: "Writings & Essays by M Hadi | Archives",
    description:
      "Creative Chaos — essays and reflections by Muhammad Hadi Yusufali on storytelling, technology, creativity, and the experiments in between.",
  },
  Vlogumentaries: {
    title: "Vlogumentaries & Documentary Vlogs | M Hadi",
    description:
      "Documentary-style vlogs by Muhammad Hadi Yusufali — Journey Tellers travels and school-year films that blend diary and documentary.",
  },
  "Films & Commercials": {
    title: "Films & Commercials by Muhammad Hadi Yusufali",
    description:
      "Short films, documentaries, music videos, and commercial work directed and edited by Muhammad Hadi Yusufali.",
  },
  Photography: {
    title: "Photography by M Hadi | Archives",
    description: "Photography sets and stills by Muhammad Hadi Yusufali.",
  },
  Tools: {
    title: "Creative Tools & AI Workflows | M Hadi",
    description:
      "Creative tools and AI-assisted workflows built by Muhammad Hadi Yusufali for editing, research, and media production.",
  },
  Miscellaneous: {
    title: "Journey Tellers Podcast & More | M Hadi",
    description:
      "The Journey Tellers Podcast and other cross-format work from Muhammad Hadi Yusufali that doesn't fit a single category.",
  },
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

function categoryPath(category) {
  return `/archives/${CATEGORY_SLUGS[category]}`
}

function archivePath(item) {
  return `/archives/${CATEGORY_SLUGS[item.category]}/${item.slug}`
}

function absoluteAsset(value) {
  if (!value) return SOCIAL_IMAGE
  if (/^https?:\/\//.test(value)) return value
  return `${SITE_URL}${value.startsWith("/") ? value : `/${value}`}`
}

function youtubeId(href = "") {
  return (
    href.match(/[?&]v=([^&]+)/)?.[1] ??
    href.match(/youtu\.be\/([^?&/]+)/)?.[1] ??
    href.match(/\/embed\/([^?&/]+)/)?.[1] ??
    ""
  )
}

function embedUrlFor(href) {
  const id = youtubeId(href)
  return id ? `https://www.youtube.com/embed/${id}` : href
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

function injectBeforeHead(html, snippet) {
  if (!snippet) return html
  return html.replace("</head>", `${snippet}\n</head>`)
}

function injectJsonLd(html, route) {
  if (!route.jsonLd) return html
  const json = JSON.stringify(route.jsonLd).replace(/</g, "\\u003c")
  return injectBeforeHead(html, `<script type="application/ld+json">${json}</script>`)
}

function extraMetaTags(route) {
  if (!route.extraMeta?.length) return ""
  return route.extraMeta
    .map((tag) =>
      tag.property
        ? `<meta property="${tag.property}" content="${escapeAttr(tag.content)}" />`
        : `<meta name="${tag.name}" content="${escapeAttr(tag.content)}" />`,
    )
    .join("\n    ")
}

function injectPrerenderedRoot(html, route) {
  if (!route.prerenderHtml) return html
  return replaceTag(html, /<div id="root"><\/div>/, `<div id="root">${route.prerenderHtml}</div>`)
}

function routeHtml(template, route) {
  const canonical = canonicalFor(route.canonicalPath ?? route.path)
  const image = route.image ?? SOCIAL_IMAGE
  const imageAlt = route.imageAlt ?? SOCIAL_IMAGE_ALT
  const robots = route.noindex
    ? "noindex, follow"
    : "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1"
  let html = template

  html = setTitle(html, route.title)
  html = setLink(html, "canonical", route.noindex ? SITE_URL : canonical)
  html = setMetaName(html, "description", route.description)
  html = setMetaName(html, "robots", robots)
  html = setMetaName(html, "googlebot", robots)
  html = setMetaName(html, "bingbot", robots)
  html = setMetaProperty(html, "og:type", route.ogType ?? "website")
  html = setMetaProperty(html, "og:title", route.title)
  html = setMetaProperty(html, "og:description", route.description)
  html = setMetaProperty(html, "og:url", route.noindex ? SITE_URL : canonical)
  html = setMetaProperty(html, "og:image", image)
  html = setMetaProperty(html, "og:image:secure_url", image)
  html = setMetaProperty(html, "og:image:type", route.imageType ?? "image/png")
  html = setMetaProperty(html, "og:image:width", "1200")
  html = setMetaProperty(html, "og:image:height", "630")
  html = setMetaProperty(html, "og:image:alt", imageAlt)
  html = setMetaName(html, "twitter:title", route.title)
  html = setMetaName(html, "twitter:description", route.description)
  html = setMetaName(html, "twitter:image", image)
  html = setMetaName(html, "twitter:image:alt", imageAlt)
  html = injectBeforeHead(html, extraMetaTags(route))
  html = injectJsonLd(html, route)
  html = injectPrerenderedRoot(html, route)

  return html
}

async function writeRoute(template, route) {
  const outputFile = path.join(distDir, route.output)
  await fs.mkdir(path.dirname(outputFile), { recursive: true })
  await fs.writeFile(outputFile, routeHtml(template, route))
}

function breadcrumbList(item, project, canonical) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Archives", item: `${SITE_URL}/archives` },
      { "@type": "ListItem", position: 2, name: item.category, item: `${SITE_URL}${categoryPath(item.category)}` },
      { "@type": "ListItem", position: 3, name: project?.title ?? item.title, item: canonical },
    ],
  }
}

function archiveJsonLd(item, project, canonical) {
  const description = item.seoDescription || item.summary || item.dek
  const isVideo = item.platform === "YouTube"
  const thing = isVideo
    ? {
        "@context": "https://schema.org",
        "@type": "VideoObject",
        "@id": `${canonical}#video`,
        name: item.title,
        description,
        thumbnailUrl: item.image ? [absoluteAsset(item.image)] : undefined,
        uploadDate: item.date,
        contentUrl: item.href,
        embedUrl: embedUrlFor(item.href),
        url: canonical,
        author: { "@id": PERSON_ID },
        publisher: { "@id": PERSON_ID },
        isPartOf: project ? { "@type": "CreativeWorkSeries", name: project.title } : undefined,
        mainEntityOfPage: canonical,
      }
    : {
        "@context": "https://schema.org",
        "@type": "Article",
        "@id": `${canonical}#article`,
        headline: item.title,
        description,
        image: item.image ? [absoluteAsset(item.image)] : undefined,
        datePublished: item.date,
        dateModified: item.dateModified || item.date,
        articleSection: item.category,
        author: { "@id": PERSON_ID },
        publisher: { "@id": PERSON_ID },
        isPartOf: { "@id": WEBSITE_ID },
        mainEntityOfPage: canonical,
        url: canonical,
      }

  return [thing, breadcrumbList(item, project, canonical)]
}

function seriesLinksHtml(item, siblings) {
  const others = siblings.filter((s) => s.slug !== item.slug).slice(0, 6)
  if (others.length === 0) return ""
  const links = others
    .map((s) => `<li><a href="${escapeAttr(archivePath(s))}">${escapeText(s.title)}</a></li>`)
    .join("")
  return `<nav aria-label="More in this series"><h2>More in this series</h2><ul>${links}</ul></nav>`
}

function archivePrerenderHtml(item, project, siblings) {
  const canonical = canonicalFor(archivePath(item))
  const kicker = `${escapeText(item.category)}${project ? ` / ${escapeText(project.title)}` : ""} / ${escapeText(item.format)} / ${escapeText(item.date)}`
  const meta = [
    item.role ? `Role: ${escapeText(item.role)}` : "",
    `Format: ${escapeText(item.format)}`,
    `Source: ${escapeText(item.platform)}`,
  ]
    .filter(Boolean)
    .join(" · ")
  const breadcrumb = `<nav aria-label="Breadcrumb"><a href="/archives">Archives</a> / <a href="${escapeAttr(categoryPath(item.category))}">${escapeText(item.category)}</a> / <span>${escapeText(item.title)}</span></nav>`
  return `<main class="bg-background text-foreground"><article style="max-width:1040px;margin:0 auto;padding:56px 24px">${breadcrumb}<p>${kicker}</p><h1>${escapeText(item.title)}</h1>${item.dek ? `<p>${escapeText(item.dek)}</p>` : ""}<p>${meta}</p>${item.image ? `<img src="${escapeAttr(item.image)}" alt="${escapeAttr(item.title)}" loading="eager" decoding="async" style="width:100%;height:auto" />` : ""}<div>${item.html}</div>${item.credits ? `<aside><h2>Credits</h2><p>${escapeText(item.credits)}</p></aside>` : ""}${seriesLinksHtml(item, siblings)}<p><a href="${escapeAttr(item.href)}">Open original on ${escapeText(item.platform)}</a></p><p><a href="${escapeAttr(canonical)}">${escapeText(canonical)}</a></p></article></main>`
}

function archiveRoute(item, project, siblings) {
  const routePath = archivePath(item)
  const canonical = canonicalFor(routePath)
  const description = item.seoDescription || item.summary || item.dek || `A ${item.category} archive entry from Muhammad Hadi Yusufali.`
  const isVideo = item.platform === "YouTube"
  const extraMeta = isVideo
    ? [
        { property: "og:video", content: embedUrlFor(item.href) },
        { property: "og:video:secure_url", content: embedUrlFor(item.href) },
        { property: "og:video:type", content: "text/html" },
        { property: "og:video:width", content: "1280" },
        { property: "og:video:height", content: "720" },
        { name: "twitter:label1", content: "Source" },
        { name: "twitter:data1", content: item.platform },
      ]
    : [
        { property: "article:published_time", content: String(item.date) },
        { property: "article:modified_time", content: String(item.dateModified || item.date) },
        { property: "article:author", content: "Muhammad Hadi Yusufali" },
        { property: "article:section", content: item.category },
      ]
  return {
    path: routePath,
    output: `${routePath.replace(/^\/+/, "")}/index.html`,
    title: item.seoTitle || `${item.title} | Archives | M Hadi`,
    description,
    image: absoluteAsset(item.image),
    imageAlt: item.title,
    imageType: /\.png($|\?)/i.test(item.image || "")
      ? "image/png"
      : /\.webp($|\?)/i.test(item.image || "")
        ? "image/webp"
        : "image/jpeg",
    ogType: isVideo ? "video.other" : "article",
    extraMeta,
    jsonLd: archiveJsonLd(item, project, canonical),
    prerenderHtml: archivePrerenderHtml(item, project, siblings),
    lastmod: item.date,
    media: {
      image: absoluteAsset(item.image),
      video: isVideo
        ? {
            thumbnail: absoluteAsset(item.image),
            title: item.title,
            description,
            playerLoc: embedUrlFor(item.href),
            publicationDate: item.date,
          }
        : null,
    },
  }
}

function categoryRoute(category, entries, projectBySlug) {
  const slug = CATEGORY_SLUGS[category]
  const meta = CATEGORY_META[category] ?? {
    title: `${category} | Archives | M Hadi`,
    description: `${category} from Muhammad Hadi Yusufali.`,
  }
  const routePath = categoryPath(category)
  const canonical = canonicalFor(routePath)
  const sorted = [...entries].sort((a, b) => new Date(b.date ?? 0) - new Date(a.date ?? 0))

  // Group entries by series/project for a readable, crawlable hub.
  const groups = new Map()
  for (const entry of sorted) {
    const key = entry.project ?? "_loose"
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(entry)
  }
  const groupsHtml = [...groups.entries()]
    .map(([key, items]) => {
      const project = projectBySlug.get(key)
      const heading = project?.title ?? "Selected work"
      const lis = items
        .map((entry) => `<li><a href="${escapeAttr(archivePath(entry))}">${escapeText(entry.title)}</a>${entry.dek ? ` — ${escapeText(entry.dek)}` : ""}</li>`)
        .join("")
      return `<section><h2>${escapeText(heading)}</h2>${project?.summary ? `<p>${escapeText(project.summary)}</p>` : ""}<ul>${lis}</ul></section>`
    })
    .join("")

  const prerenderHtml = `<main class="bg-background text-foreground"><article style="max-width:1040px;margin:0 auto;padding:56px 24px"><nav aria-label="Breadcrumb"><a href="/archives">Archives</a> / <span>${escapeText(category)}</span></nav><h1>${escapeText(category)}</h1><p>${escapeText(meta.description)}</p>${groupsHtml}<p><a href="/archives">Back to all archives</a></p></article></main>`

  const itemList = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${canonical}#collection`,
    name: meta.title,
    description: meta.description,
    url: canonical,
    isPartOf: { "@id": WEBSITE_ID },
    about: { "@id": PERSON_ID },
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: sorted.length,
      itemListElement: sorted.map((entry, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: canonicalFor(archivePath(entry)),
        name: entry.title,
      })),
    },
  }
  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Archives", item: `${SITE_URL}/archives` },
      { "@type": "ListItem", position: 2, name: category, item: canonical },
    ],
  }

  return {
    path: routePath,
    output: `archives/${slug}/index.html`,
    title: meta.title,
    description: meta.description,
    image: absoluteAsset(sorted.find((entry) => entry.image)?.image),
    imageAlt: `${category} by Muhammad Hadi Yusufali`,
    jsonLd: [itemList, breadcrumb],
    prerenderHtml,
    lastmod: sorted[0]?.date,
  }
}

function sectionPrerender(routePath, experiences, categoryRoutes) {
  if (routePath === "/archives") {
    const links = categoryRoutes
      .map((route) => `<li><a href="${escapeAttr(route.path)}">${escapeText(route.title)}</a> — ${escapeText(route.description)}</li>`)
      .join("")
    return `<main class="bg-background text-foreground"><article style="max-width:1040px;margin:0 auto;padding:56px 24px"><h1>Archives</h1><p>Being a creative means experimenting across formats. This is the working archive — writings, vlogumentaries, films, the Journey Tellers Podcast, and creative tools.</p><nav aria-label="Archive categories"><ul>${links}</ul></nav></article></main>`
  }
  if (routePath === "/experiences") {
    const items = [...experiences]
      .sort((a, b) => Number(a.order ?? 0) - Number(b.order ?? 0))
      .map((exp) => `<li><strong>${escapeText(exp.role)}</strong>, ${escapeText(exp.company)}${exp.summary ? ` — ${escapeText(exp.summary)}` : ""}</li>`)
      .join("")
    return `<main class="bg-background text-foreground"><article style="max-width:1040px;margin:0 auto;padding:56px 24px"><h1>Experiences</h1><p>Muhammad Hadi Yusufali's work across sync. labs, Journey Tellers, Awaiten Films, collaborators, and freelance filmmaking.</p><ul>${items}</ul><p><a href="/archives">Browse the archive</a></p></article></main>`
  }
  if (routePath === "/about" || routePath === "/") {
    return `<main class="bg-background text-foreground"><article style="max-width:1040px;margin:0 auto;padding:56px 24px"><h1>Muhammad Hadi Yusufali</h1><p>M Hadi is a filmmaker and creator experimenting across many mediums at the intersection of tech and creativity. He is Chief of Staff at sync. labs and works across filmmaking, storytelling, video production, podcasting, and creative technology.</p><nav aria-label="Primary sections"><a href="/about">About</a> · <a href="/experiences">Experiences</a> · <a href="/archives">Archives</a></nav></article></main>`
  }
  return undefined
}

function mediaBlocks(route) {
  if (!route.media) return ""
  const parts = []
  if (route.media.image) {
    parts.push(`    <image:image>\n      <image:loc>${escapeText(route.media.image)}</image:loc>\n    </image:image>`)
  }
  if (route.media.video) {
    const v = route.media.video
    parts.push(
      `    <video:video>\n      <video:thumbnail_loc>${escapeText(v.thumbnail)}</video:thumbnail_loc>\n      <video:title>${escapeText(v.title)}</video:title>\n      <video:description>${escapeText((v.description || v.title).slice(0, 2000))}</video:description>\n      <video:player_loc>${escapeText(v.playerLoc)}</video:player_loc>\n      <video:publication_date>${escapeText(v.publicationDate)}</video:publication_date>\n    </video:video>`,
    )
  }
  return parts.length ? `\n${parts.join("\n")}` : ""
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
      return `  <url>\n    <loc>${escapeText(canonical)}</loc>${lastmod}${mediaBlocks(route)}\n  </url>`
    })
    .join("\n")

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1" xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">\n${urls}\n</urlset>\n`
}

const template = await fs.readFile(path.join(distDir, "index.html"), "utf8")
const projects = await readCollection("projects")
const projectBySlug = new Map(projects.map((project) => [project.slug, project]))
const experiences = await readCollection("experiences")
const archives = (await readCollection("archives"))
  .filter((item) => item.category && CATEGORY_SLUGS[item.category])
  .sort((a, b) => new Date(b.date ?? 0) - new Date(a.date ?? 0))

// Series siblings for "more in this series" internal links.
const siblingsByProject = new Map()
for (const item of archives) {
  const key = item.project ?? "_loose"
  if (!siblingsByProject.has(key)) siblingsByProject.set(key, [])
  siblingsByProject.get(key).push(item)
}

const archiveRoutes = archives.map((item) =>
  archiveRoute(item, projectBySlug.get(item.project), siblingsByProject.get(item.project ?? "_loose") ?? []),
)

// Category hub pages (only categories that actually have entries).
const entriesByCategory = new Map()
for (const item of archives) {
  if (!entriesByCategory.has(item.category)) entriesByCategory.set(item.category, [])
  entriesByCategory.get(item.category).push(item)
}
const categoryRoutes = [...entriesByCategory.entries()].map(([category, entries]) =>
  categoryRoute(category, entries, projectBySlug),
)

// Prerender the main section pages for crawlers.
for (const route of routes) {
  route.prerenderHtml = sectionPrerender(route.path, experiences, categoryRoutes)
}

const allRoutes = [...routes, ...categoryRoutes, ...archiveRoutes]
for (const route of allRoutes) {
  await writeRoute(template, route)
}

await writeRoute(template, fallbackRoute)
await fs.writeFile(path.join(distDir, "sitemap.xml"), sitemap(allRoutes))

console.log(`Static routes: ${routes.length} sections, ${categoryRoutes.length} category hubs, ${archiveRoutes.length} entries`)
