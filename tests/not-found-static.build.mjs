import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'

test('built 404 is noindex and has readable missing-page content without JavaScript', async () => {
  const html = await fs.readFile(new URL('../dist/404.html', import.meta.url), 'utf8')
  assert.match(html, /<title>Page not found \| M Hadi<\/title>/)
  for (const robot of ['robots', 'googlebot', 'bingbot']) {
    assert.match(html, new RegExp(`<meta name="${robot}" content="noindex, follow"`))
  }
  assert.match(html, /data-static-not-found/)
  assert.match(html, /<h1[^>]*>404 \/ Page not found<\/h1>/)
  assert.match(html, /href="\/archives">Archives<\/a>/)
  assert.match(html, /href="\/">Home<\/a>/)
  assert.doesNotMatch(html, /<link\s+rel="canonical"/)
  assert.doesNotMatch(html, /<meta\s+property="og:url"/)
  assert.doesNotMatch(html, /<h1[^>]*>Muhammad Hadi Yusufali<\/h1>/)
  assert.doesNotMatch(html, /<script\s+type="application\/ld\+json">/)
})
