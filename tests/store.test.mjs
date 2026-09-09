import { test } from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { openStore } from "../server/store.mjs"
import { importHtml, sanitize } from "../server/content.mjs"
const doc = (text) => ({
  type: "doc",
  content: [{ type: "paragraph", content: [{ type: "text", text }] }],
})
function fixture(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "cms-test-"))
  const store = openStore(dir)
  t.after(() => {
    store.close()
    fs.rmSync(dir, { recursive: true, force: true })
  })
  return store
}
const create = (store) =>
  store.create({
    title: "A real draft",
    document: doc("Private first version"),
  })
test("drafts and social/email preparations never appear in public output", (t) => {
  const store = fixture(t)
  let post = create(store)
  assert.deepEqual(store.publicPosts(), [])
  post = store.save(post.id, post.version, {
    ...post.snapshot,
    variants: [
      {
        id: "a",
        platform: "LinkedIn",
        parts: ["Private social copy"],
        url: "",
        baseRevision: 1,
      },
    ],
    newsletter: { subject: "Private subject", intro: "Private intro" },
  })
  store.publish(post.id, post.version)
  const result = store.publicPosts()[0]
  assert.equal(result.snapshot.variants, undefined)
  assert.equal(result.snapshot.newsletter, undefined)
  assert.ok(!JSON.stringify(result).includes("Private social copy"))
})
test("editing a published article cannot change the public revision until explicit publish", (t) => {
  const store = fixture(t)
  let post = create(store)
  post = store.publish(post.id, post.version)
  post = store.save(post.id, post.version, {
    ...post.snapshot,
    document: doc("The changed version"),
  })
  assert.match(store.publicPosts()[0].snapshot.html, /Private first version/)
  assert.doesNotMatch(store.publicPosts()[0].snapshot.html, /changed/)
  store.publish(post.id, post.version)
  assert.match(store.publicPosts()[0].snapshot.html, /The changed version/)
})
test("optimistic concurrency rejects stale edits and retains every saved revision", (t) => {
  const store = fixture(t)
  const original = create(store)
  const updated = store.save(original.id, original.version, {
    ...original.snapshot,
    title: "Saved in tab one",
  })
  assert.throws(
    () =>
      store.save(original.id, original.version, {
        ...original.snapshot,
        title: "Stale tab two",
      }),
    (e) => e.status === 409,
  )
  assert.equal(store.get(original.id).snapshot.title, "Saved in tab one")
  assert.equal(store.snapshot(original.id, 1).title, original.snapshot.title)
  assert.equal(store.revisions(original.id).length, 2)
  assert.equal(store.get(original.id).version, updated.version)
})
test("social-only saves do not make the original look edited or invalidate other social versions", (t) => {
  const store = fixture(t)
  let p = create(store)
  p = store.publish(p.id, p.version)
  const contentRevision = p.content_revision
  p = store.save(p.id, p.version, {
    ...p.snapshot,
    newsletter: { subject: "Inbox title", preview: "", intro: "" },
  })
  assert.equal(p.content_revision, contentRevision)
  assert.ok(p.draft_revision > p.published_revision)
  p = store.save(p.id, p.version, {
    ...p.snapshot,
    document: doc("New original"),
  })
  assert.ok(p.content_revision > contentRevision)
})
test("scheduled publication uses its frozen revision and survives database reopening", (t) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "cms-schedule-"))
  let store = openStore(dir)
  t.after(() => {
    store.close()
    fs.rmSync(dir, { recursive: true, force: true })
  })
  let p = create(store)
  p = store.schedule(
    p.id,
    p.version,
    new Date(Date.now() + 60000).toISOString(),
  )
  p = store.save(p.id, p.version, {
    ...p.snapshot,
    document: doc("Later private edits"),
  })
  store.db
    .prepare("UPDATE posts SET scheduled_at=? WHERE id=?")
    .run("2000-01-01T00:00:00.000Z", p.id)
  store.close()
  store = openStore(dir)
  assert.equal(store.runScheduled()[0].published, true)
  assert.match(store.publicPosts()[0].snapshot.html, /Private first version/)
  assert.match(store.get(p.id).snapshot.html, /Later private edits/)
  assert.deepEqual(store.runScheduled(), [])
})
test("archiving removes public visibility and restores only as a private draft", (t) => {
  const store = fixture(t)
  let p = create(store)
  p = store.publish(p.id, p.version)
  p = store.archive(p.id, p.version, true)
  assert.deepEqual(store.publicPosts(), [])
  p = store.archive(p.id, p.version, false)
  assert.equal(p.published_revision, null)
  assert.equal(p.archived_at, null)
  assert.equal(store.revisions(p.id).length, 1)
})
test("permalinks freeze, conflict transaction rolls back, and imports can retain legacy routes", (t) => {
  const store = fixture(t)
  let p = create(store)
  p = store.publish(p.id, p.version)
  assert.throws(
    () =>
      store.save(p.id, p.version, { ...p.snapshot, slug: "changed-address" }),
    /permanent address/,
  )
  const duplicate = create(store)
  assert.throws(
    () => store.publish(duplicate.id, duplicate.version),
    (e) => e.status === 409,
  )
  assert.equal(store.get(duplicate.id).published_revision, null)
  const imported = store.create(
    {
      title: "Imported article",
      slug: "imported",
      document: doc("Original article"),
    },
    {
      id: "substack:1",
      path: "/archives/writings/old-url",
      html: "<p>original private backup</p>",
    },
  )
  store.publish(imported.id, imported.version)
  assert.equal(
    store.publicPost("/archives/writings/old-url").snapshot.title,
    "Imported article",
  )
  assert.ok(
    !JSON.stringify(store.get(imported.id)).includes("original private backup"),
  )
})
test("unknown nodes, executable HTML, unsafe images, and embeds are not publishable", (t) => {
  const store = fixture(t)
  assert.throws(
    () =>
      store.create({
        document: { type: "doc", content: [{ type: "script" }] },
      }),
    /unsupported block/,
  )
  const html = sanitize(
    '<script>alert(1)</script><img src="/secret" onerror="alert(2)"><a href="javascript:alert(3)">link</a><iframe src="https://evil.example/embed"></iframe><p>Kept words</p>',
  )
  assert.doesNotMatch(html, /alert|onerror|javascript|\/secret|evil\.example/)
  assert.match(html, /Kept words/)
})
test("imported figures retain images, caption and emphasis through editor schema", () => {
  const document = importHtml(
    '<figure><img src="https://example.com/photo.png" alt="A camera"><figcaption>A caption</figcaption></figure><p>The <em>full</em> article.</p>',
  )
  assert.equal(document.content[0].type, "image")
  assert.equal(document.content[0].attrs.caption, "A caption")
  assert.equal(document.content[1].content[1].marks[0].type, "italic")
})

test("plain text keeps paragraph boundaries and punctuation", (t) => {
  const store = fixture(t)
  const post = store.create({ title: "Spacing", document: importHtml("<p>One &amp; two.</p><p>Three.</p>") })
  assert.equal(post.snapshot.text, "One & two.\n\nThree.")
})
