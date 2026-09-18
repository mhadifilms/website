/* global document, getComputedStyle, DOMMatrixReadOnly, MouseEvent, innerHeight, scrollTo, clearTimeout */
import { chromium, expect } from "@playwright/test"

const base = process.env.AUDIT_TEST_URL || "http://127.0.0.1:5213"
const browser = await chromium.launch({ channel: "chrome", headless: true })
const deadline = setTimeout(() => {
  console.error("Audit regressions exceeded 120 seconds")
  process.exitCode = 1
  void browser.close()
}, 120000)

async function sectionInView(page, id) {
  await expect.poll(() => page.locator(`#${id}`).evaluate(element => {
    const rect = element.getBoundingClientRect()
    return rect.top <= innerHeight / 2 && rect.bottom > innerHeight / 2
  }), { timeout: 15000 }).toBe(true)
}

async function modifierClicks(page) {
  const home = page.getByRole("navigation", { name: "Sections", exact: true }).getByRole("link", { name: "Home", exact: true })
  for (const modifier of ["metaKey", "ctrlKey", "shiftKey", "altKey"]) {
    const intercepted = await home.evaluate((element, key) => {
      let prevented = false
      // Observe after React handles the click, then suppress native tab/window
      // creation so the test can check every modifier in the same page.
      document.addEventListener("click", event => {
        prevented = event.defaultPrevented
        event.preventDefault()
      }, { once: true })
      element.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, button: 0, [key]: true }))
      return prevented
    }, modifier)
    expect(intercepted, `${modifier} must keep native link behavior`).toBe(false)
  }
}

try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce", timezoneId: "America/Los_Angeles" })
  const page = await context.newPage()
  page.setDefaultTimeout(10000)
  const errors = []
  page.on("pageerror", error => errors.push(error.message))

  await page.goto(`${base}/about/`)
  await sectionInView(page, "about")
  await modifierClicks(page)
  await page.getByRole("navigation", { name: "Sections", exact: true }).getByRole("link", { name: "Archives", exact: true }).click()
  await page.locator("button#tools").click()
  await page.locator('.archive-library-entry[href="/archives/tools/chorus"]').click()
  await expect(page.locator("h1")).toHaveText("chorus")
  await modifierClicks(page)
  await page.getByRole("link", { name: "Back to archives", exact: true }).click()
  await sectionInView(page, "archives")

  // A fresh request must still honor its initial category deep link.
  await page.goto(`${base}/archives/photography/`)
  await expect(page.locator(".archive-library h3")).toHaveText("Photography")
  await expect.poll(() => page.locator(".archive-library").evaluate(element => Math.abs(element.getBoundingClientRect().top - 32))).toBeLessThan(8)

  await page.goto(`${base}/archives/tools/chorus/`)
  await expect(page.locator('time[datetime="2026-05-16"]').first()).toHaveText("May 16, 2026")
  await expect(page.locator('script[data-page-jsonld]')).toHaveCount(1)
  const articleSchema = JSON.parse(await page.locator('script[data-page-jsonld]').textContent())
  expect(articleSchema.some(node => node["@type"] === "Article" && node.url?.replace(/\/$/, "") === "https://mhadifilms.com/archives/tools/chorus")).toBe(true)
  const siteSchema = await page.locator('script[type="application/ld+json"]:not([data-page-jsonld])').allTextContents()
  expect(siteSchema.length).toBeGreaterThan(0)
  await page.getByRole("navigation", { name: "Sections", exact: true }).getByRole("link", { name: "Home", exact: true }).click()
  await sectionInView(page, "home")
  await expect(page.locator('script[data-page-jsonld]')).toHaveCount(0)
  expect(await page.locator('script[type="application/ld+json"]').allTextContents()).toEqual(siteSchema)

  const frame = page.locator("[data-mac-frame]")
  const scale = () => frame.evaluate(element => new DOMMatrixReadOnly(getComputedStyle(element).transform).a)
  await expect(page.locator("[data-reduced-hero-cover]")).toHaveCount(1)
  expect(await scale()).toBeCloseTo(1)
  await page.evaluate(() => scrollTo({ top: innerHeight * 0.6, behavior: "instant" }))
  expect(await scale()).toBeCloseTo(1)
  await page.getByRole("navigation", { name: "Sections", exact: true }).getByRole("link", { name: "About", exact: true }).click()
  await sectionInView(page, "about")
  await expect.poll(() => page.locator('[data-hero-polaroid="2"]').evaluate(element => {
    const marker = document.querySelector('[data-hero-polaroid-marker="about-2"]')
    return Math.abs(parseFloat(element.style.top) - marker.getBoundingClientRect().top)
  })).toBeLessThan(2)
  await page.goto(`${base}/archives/photography/stills-from-sync-hq/`)
  await expect(page.locator('.photography-heading-meta time')).toHaveText("January 1st, 2025")
  expect(errors).toEqual([])
  await context.close()

  const normal = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: "no-preference" })
  normal.setDefaultTimeout(10000)
  await normal.goto(`${base}/`)
  await expect.poll(() => normal.locator('[data-hero-polaroid="2"]').evaluate(element => element.getBoundingClientRect().width)).toBeGreaterThan(0)
  await normal.evaluate(() => scrollTo({ top: innerHeight * 0.6, behavior: "instant" }))
  await expect.poll(() => normal.locator("[data-mac-frame]").evaluate(element => new DOMMatrixReadOnly(getComputedStyle(element).transform).a)).toBeGreaterThan(1.5)
  // Switching preferences also tears down active GSAP scroll animations.
  await normal.emulateMedia({ reducedMotion: "reduce" })
  await expect(normal.locator("[data-reduced-hero-cover]")).toHaveCount(1)
  await expect.poll(() => normal.locator("[data-mac-frame]").evaluate(element => new DOMMatrixReadOnly(getComputedStyle(element).transform).a)).toBeCloseTo(1)
  await normal.close()
  console.log("PASS: initial deep links, article return, modifier clicks, calendar dates, route schema, reduced motion and normal cinematic zoom")
} finally {
  clearTimeout(deadline)
  await browser.close()
}
