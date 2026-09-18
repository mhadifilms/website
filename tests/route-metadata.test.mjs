import { test } from "node:test"
import assert from "node:assert/strict"
import { Window } from "happy-dom"
import { applyPageMeta } from "../src/lib/seo.ts"

test("route schema survives hydration, leaves with its route, and preserves site schema", async () => {
  const window = new Window()
  const original = globalThis.document
  globalThis.document = window.document
  try {
    window.document.head.innerHTML = '<script type="application/ld+json">{"@type":"Person","name":"M Hadi"}</script><script type="application/ld+json" data-page-jsonld="https://mhadifilms.com/archives/tools/chorus">{"@type":"Article","headline":"Chorus"}</script>'
    applyPageMeta({ title: "Chorus", description: "Tool", canonicalPath: "/archives/tools/chorus" })
    assert.equal(window.document.querySelectorAll("script[data-page-jsonld]").length, 1)
    applyPageMeta({ title: "Home", description: "Home", canonicalPath: "/" })
    assert.equal(window.document.querySelectorAll("script[data-page-jsonld]").length, 0)
    assert.equal(window.document.querySelectorAll('script[type="application/ld+json"]').length, 1)
    const jsonLd = { "@type": "BlogPosting", headline: "New article" }
    applyPageMeta({ title: "New article", description: "New", canonicalPath: "/writing/new/", jsonLd })
    applyPageMeta({ title: "New article", description: "New", canonicalPath: "/writing/new/", jsonLd })
    assert.equal(window.document.querySelectorAll('script[type="application/ld+json"]').length, 2)
    assert.equal(window.document.querySelectorAll("script[data-page-jsonld]").length, 1)
    applyPageMeta({ title: "Other tool", description: "Tool", canonicalPath: "/archives/tools/other" })
    assert.equal(window.document.querySelectorAll('script[type="application/ld+json"]').length, 1)
    assert.equal(JSON.parse(window.document.querySelector("script").textContent)["@type"], "Person")
  } finally {
    if (original === undefined) delete globalThis.document
    else globalThis.document = original
    await window.happyDOM.close()
  }
})
