const SITE_URL = "https://mhadifilms.com"

export const DEFAULT_SOCIAL_IMAGE = `${SITE_URL}/media/social-card.png`
export const DEFAULT_SOCIAL_IMAGE_ALT =
  "A black-and-white film strip from Muhammad Hadi Yusufali's creative work."

export type PageMeta = {
  title: string
  description: string
  /** Path used for canonical + og:url, e.g. "/archives/writings/some-post". */
  canonicalPath: string
  socialTitle?: string
  socialDescription?: string
  socialImage?: string
  image?: string
  jsonLd?: unknown
  imageAlt?: string
  noindex?: boolean
}

function setMeta(selector: string, attr: "content" | "href", value: string) {
  let element = document.head.querySelector(selector)
  // The static 404 deliberately omits a canonical URL. SPA navigation away
  // from it must recreate that metadata for the destination page.
  if (!element) {
    const match = selector.match(/^(meta|link)\[(name|property|rel)="([^"]+)"\]$/)
    if (match) {
      element = document.createElement(match[1])
      element.setAttribute(match[2], match[3])
      document.head.append(element)
    }
  }
  if (element) {
    element.setAttribute(attr, value)
  }
}

/**
 * Updates the document head for SPA navigations. Crawlers get the statically
 * prerendered head from scripts/build-static-routes.mjs; this keeps titles,
 * descriptions, and share cards correct for humans navigating client-side.
 */
export function applyPageMeta(meta: PageMeta) {
  const canonical = `${SITE_URL}${meta.canonicalPath === "/" ? "/" : meta.canonicalPath}`
  const image = meta.socialImage ?? meta.image ?? DEFAULT_SOCIAL_IMAGE
  const imageAlt = meta.imageAlt ?? DEFAULT_SOCIAL_IMAGE_ALT

  let structured = document.head.querySelector<HTMLScriptElement>('script[data-post-jsonld]')
  if(meta.jsonLd){
    document.head.querySelectorAll('script[type="application/ld+json"]').forEach(el=>el.remove())
    structured = document.createElement('script'); structured.type='application/ld+json'; structured.dataset.postJsonld='true';structured.textContent=JSON.stringify(meta.jsonLd);document.head.append(structured)
  } else if(structured) structured.remove()
  setMeta('meta[property="og:type"]', 'content', meta.jsonLd ? 'article' : 'website')
  document.title = meta.title
  for (const name of ["robots", "googlebot", "bingbot"]) {
    setMeta(`meta[name="${name}"]`, "content", meta.noindex ? "noindex, follow" : "index, follow, max-image-preview:large")
  }
  setMeta('meta[name="description"]', "content", meta.description)
  setMeta('meta[property="og:title"]', "content", meta.socialTitle ?? meta.title)
  setMeta('meta[property="og:description"]', "content", meta.socialDescription ?? meta.description)
  setMeta('meta[property="og:url"]', "content", canonical)
  setMeta('meta[property="og:image"]', "content", image)
  setMeta('meta[property="og:image:secure_url"]', "content", image)
  setMeta('meta[property="og:image:type"]', "content", meta.socialImage ? "image/jpeg" : "")
  setMeta('meta[property="og:image:width"]', "content", meta.socialImage ? "1200" : "")
  setMeta('meta[property="og:image:height"]', "content", meta.socialImage ? "630" : "")
  setMeta('meta[property="og:image:alt"]', "content", imageAlt)
  setMeta('meta[name="twitter:title"]', "content", meta.socialTitle ?? meta.title)
  setMeta('meta[name="twitter:description"]', "content", meta.socialDescription ?? meta.description)
  setMeta('meta[name="twitter:image"]', "content", image)
  setMeta('meta[name="twitter:image:alt"]', "content", imageAlt)
  setMeta('link[rel="canonical"]', "href", canonical)
}

export function absoluteAssetUrl(value?: string) {
  if (!value) return undefined
  if (/^https?:\/\//.test(value)) return value
  return `${SITE_URL}${value.startsWith("/") ? value : `/${value}`}`
}
