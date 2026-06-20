import fs from "node:fs/promises"
import path from "node:path"

const root = process.cwd()
const distDir = path.join(root, "dist")
const SITE_URL = "https://mhadifilms.com"
const SOCIAL_IMAGE = `${SITE_URL}/media/social-card.png`
const SOCIAL_IMAGE_ALT = "A black-and-white film strip from Muhammad Hadi Yusufali's creative work."

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

function routeHtml(template, route) {
  const canonical = canonicalFor(route.canonicalPath ?? route.path)
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
  html = setMetaProperty(html, "og:image", SOCIAL_IMAGE)
  html = setMetaProperty(html, "og:image:secure_url", SOCIAL_IMAGE)
  html = setMetaProperty(html, "og:image:type", "image/png")
  html = setMetaProperty(html, "og:image:width", "1200")
  html = setMetaProperty(html, "og:image:height", "630")
  html = setMetaProperty(html, "og:image:alt", SOCIAL_IMAGE_ALT)
  html = setMetaName(html, "twitter:title", route.title)
  html = setMetaName(html, "twitter:description", route.description)
  html = setMetaName(html, "twitter:image", SOCIAL_IMAGE)
  html = setMetaName(html, "twitter:image:alt", SOCIAL_IMAGE_ALT)

  return html
}

async function writeRoute(template, route) {
  const outputFile = path.join(distDir, route.output)
  await fs.mkdir(path.dirname(outputFile), { recursive: true })
  await fs.writeFile(outputFile, routeHtml(template, route))
}

const template = await fs.readFile(path.join(distDir, "index.html"), "utf8")

for (const route of routes) {
  await writeRoute(template, route)
}

await writeRoute(template, fallbackRoute)
