/* global document, innerWidth */
import { chromium, expect } from "@playwright/test"
import assert from "node:assert/strict"
import { expectPhotographyPages } from "./photography-pagination.mjs"

const base = process.env.PHOTOGRAPHY_TEST_URL || "http://127.0.0.1:5213"
const hidden = ["wali-aylia-wedding", "rise-academy-lower-school", "senior-portraits", "sync-boilermake-winners", "tanzania-2025"]
const browser = await chromium.launch({ channel: "chrome", headless: true })
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
  const hubResponse = await page.goto(`${base}/archives/photography/`)
  const hub = await hubResponse.text()
  const sitemap = await (await page.request.get(`${base}/sitemap.xml`)).text()
  await expectPhotographyPages(page, hidden)
  for (const slug of hidden) {
    assert(!hub.includes(`/photography/${slug}`), `${slug} absent from prerendered hub`)
    assert(!sitemap.includes(`/photography/${slug}`), `${slug} absent from sitemap`)
    await expect(page.locator(`a[href$="/photography/${slug}"]`)).toHaveCount(0)
  }
  await page.getByRole("searchbox", { name: "Search photography" }).fill("FX3")
  await expect(page.locator(".archive-library-entry")).toHaveCount(0)
  await page.goto(`${base}/experiences`)
  for (const slug of hidden) await expect(page.locator(`a[href$="/photography/${slug}"]`)).toHaveCount(0)
  for (const slug of hidden) {
    const response = await page.goto(`${base}/archives/photography/${slug}/`)
    assert.equal(response.status(), 200)
    assert.match(await response.text(), /name="robots" content="noindex, follow"/)
    await page.locator(".photography-heading h1").waitFor()
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "noindex, follow")
    await expect(page.locator(".photography-heading-meta")).toContainText("Unlisted collection")
    assert(await page.locator("a[data-gallery-image]").count() > 0)
    for (const other of hidden) await expect(page.locator(`a[href$="/photography/${other}"]`)).toHaveCount(0)
  }
  await expect(page.locator("a[data-gallery-image]")).toHaveCount(223)
  await page.getByRole("button", { name: "Safari (60)", exact: true }).click()
  await expect(page.locator("a[data-gallery-image]")).toHaveCount(60)
  await expect.poll(() => page.locator("a[data-gallery-image] img").evaluateAll((images) => images.slice(0, 6).every((image) => image.complete && image.naturalWidth > 0)), { timeout: 30000 }).toBe(true)
  await page.screenshot({ path: "/private/tmp/photography-tanzania-desktop.png" })
  await page.setViewportSize({ width: 390, height: 900 })
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
  await page.screenshot({ path: "/private/tmp/photography-tanzania-mobile.png" })
  await page.getByRole("link", { name: "Back to archives", exact: true }).click()
  await page.getByRole("searchbox", { name: "Search photography" }).fill("")
  await expectPhotographyPages(page, hidden)
  await expect(page.locator('meta[name="robots"]')).not.toHaveAttribute("content", /noindex/)
  console.log({ unlisted: hidden.length, publicCollections: 12, directLinks: true, searchExcluded: true, sitemapExcluded: true, noindex: true, tanzaniaFilter: true, noOverflow: true })
} finally { await browser.close() }
