/* global document, innerWidth, getComputedStyle, DataTransfer */
import { chromium, expect } from '@playwright/test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import { POST_REDIRECTS } from '../shared/post-redirects.js'

const base = process.env.NOT_FOUND_TEST_URL || 'http://127.0.0.1:5197'
const browser = await chromium.launch({ channel: 'chrome', headless: true })
const missing = '/a-missing-page'
try {
  for (const width of [1440, 390, 320]) {
    const context = await browser.newContext({ viewport: { width, height: 900 } })
    const page = await context.newPage()
    const errors = []
    page.on('pageerror', error => errors.push(error.message))
    await page.goto(base + missing)
    await expect(page.locator('[data-not-found]')).toBeVisible()
    await expect(page).toHaveTitle('Page not found | M Hadi')
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/)
    await expect(page.locator('.lost-path')).toHaveText(missing)
    await expect(page.locator('.lost-mac')).toHaveAttribute('src', /figma-macintosh\.svg$/)
    await expect(page.locator('[data-disk]')).toHaveCount(3)
    await expect(page.locator('.lost-screen-title')).toHaveText('Page not found')
    await expect(page.locator('.lost-screen-code')).toHaveText('404')
    const fontFamilies = await page.locator('.lost-wordmark, .lost-screen-code, .lost-screen-title, .lost-screen-detail, .lost-disk-label, .lost-prompt, .lost-path').evaluateAll(elements =>
      elements.map(element => getComputedStyle(element).fontFamily.split(',')[0].replace(/["']/g, '').trim()),
    )
    assert(fontFamilies.every(font => font === 'Raleway'), `One typeface throughout the 404: ${fontFamilies.join(', ')}`)
    for (const disk of await page.locator('[data-disk]').all()) {
      const bounds = await disk.boundingBox()
      assert(bounds && bounds.x >= -.5 && bounds.x + bounds.width <= width + .5, `Disk edges visible at ${width}px`)
    }
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
    const footer = await page.locator('.lost-footer').boundingBox()
    assert(footer && footer.y + footer.height <= 900, `Footer visible at ${width}px`)
    await page.screenshot({ path: `/private/tmp/not-found-${width}.png` })

    await page.locator('[data-disk="archives"]').hover()
    await expect(page.locator('.lost-screen-title')).toHaveText('Archives')
    await expect(page.locator('.lost-screen-detail')).toHaveText('/archives')
    await page.mouse.move(0, 0)
    await expect(page.locator('.lost-screen-title')).toHaveText('Page not found')
    await page.locator('[data-disk="random"]').focus()
    await expect(page.locator('.lost-screen-title')).toHaveText('Random')
    await expect(page.locator('.lost-screen-detail')).toHaveText(await page.locator('[data-disk="random"]').getAttribute('href'))

    // Keyboard activates the same actual links as touch/click; metadata recovers.
    await page.locator('[data-disk="home"]').focus()
    await page.keyboard.press('Enter')
    await page.waitForURL(url => url.pathname === '/')
    await expect(page.locator('[data-not-found]')).toHaveCount(0)
    await expect(page.locator('meta[name="robots"]')).not.toHaveAttribute('content', /noindex/)
    await page.goto(base + missing)
    await page.locator('[data-disk="archives"]').click()
    await page.waitForURL(/\/archives\/?$/)
    await expect(page.locator('[data-not-found]')).toHaveCount(0)
    assert.deepEqual(errors, [])
    console.log(`PASS responsive and navigation: ${width}px`)
    await context.close()
  }

  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  for (const path of ['/unknown/deeper/path', '/archives/not-a-category', '/archives/photography/not-a-real-entry', '/writing/not-a-real-post']) {
    await page.goto(base + path)
    await expect(page.locator('[data-not-found]')).toBeVisible()
    assert.equal(new URL(page.url()).pathname, path)
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/)
  }
  for (const path of ['/', '/about', '/experiences', '/archives', '/archives/photography', '/archives/writings', '/writing']) {
    await page.goto(base + path)
    await expect(page.locator('#content')).toBeVisible()
    await expect(page.locator('[data-not-found]')).toHaveCount(0)
  }
  const publication = JSON.parse(await fs.readFile('public/publishing/manifest.json', 'utf8'))
  await page.goto(base + publication.posts[0].path)
  await expect(page.locator('.native-post')).toBeVisible()
  const redirect = Object.entries(POST_REDIRECTS).find(([, to]) => publication.posts.some(post => post.path === to))
  assert(redirect)
  await page.goto(base + redirect[0])
  await page.waitForURL(url => url.pathname.replace(/\/$/, '') === redirect[1])
  await expect(page.locator('.native-post')).toBeVisible()
  console.log('PASS missing slugs, known routes, published article, and legacy redirect')

  await page.goto(base + missing)
  const disk = page.locator('[data-disk="archives"]')
  const data = await page.evaluateHandle(() => new DataTransfer())
  await disk.dispatchEvent('dragstart', { dataTransfer: data })
  await disk.dispatchEvent('dragend', { dataTransfer: data })
  await expect(page.locator('[data-drive]')).not.toHaveAttribute('data-ready')
  assert.equal(new URL(page.url()).pathname, missing)
  await disk.dragTo(page.locator('[data-drive]'))
  await page.waitForURL(/\/archives\/?$/)
  console.log('PASS drag cancellation and drive insertion')

  // Force the last candidate to make visibility filtering observable rather
  // than relying on a few random samples never selecting an unlisted entry.
  await page.addInitScript(() => { Math.random = () => .999999 })
  await page.goto(base + missing)
  const randomHref = await page.locator('[data-disk="random"]').getAttribute('href')
  assert(randomHref?.startsWith('/archives/') || randomHref?.startsWith('/writing/'))
  await page.locator('[data-disk="random"]').click()
  await page.waitForURL(url => url.pathname.replace(/\/$/, '') === randomHref?.replace(/\/$/, ''))
  await expect(page.locator('[data-not-found]')).toHaveCount(0)
  await expect(page.locator('meta[name="robots"]')).not.toHaveAttribute('content', /noindex/)
  console.log('PASS Random opens an indexed public entry')

  const reduced = await browser.newPage({ reducedMotion: 'reduce' })
  await reduced.goto(base + missing)
  const transitionSeconds = await reduced.locator('[data-disk="home"]').evaluate(el =>
    getComputedStyle(el).transitionDuration.split(',').map(duration => Number.parseFloat(duration)),
  )
  assert(transitionSeconds.every(duration => duration <= .00001), 'Reduced-motion transitions must be at most 0.01ms')
  await reduced.locator('[data-disk="home"]').click()
  await reduced.waitForURL(url => url.pathname === '/')
  console.log('PASS reduced motion navigation')
} finally {
  await browser.close()
}
