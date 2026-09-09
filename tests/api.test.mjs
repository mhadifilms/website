import { test } from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import sharp from "sharp"
import { openStore } from "../server/store.mjs"
import { createApp } from "../server/app.mjs"

async function fixture(t, production = false) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "cms-api-test-")),
    store = openStore(path.join(dir, ".private"))
  const localCodeFile = path.join(dir, "code")
  fs.writeFileSync(localCodeFile, "test-once")
  const config = {
    production,
    origin: "http://localhost:5174",
    ownerLogin: "test",
    localCodeFile,
  }
  const server = createApp(store, config).listen(0, "127.0.0.1")
  await new Promise((resolve) => server.once("listening", resolve))
  const base = `http://127.0.0.1:${server.address().port}`
  t.after(async () => {
    await new Promise((resolve) => server.close(resolve))
    store.close()
    fs.rmSync(dir, { recursive: true, force: true })
  })
  return { store, base, config }
}
async function login(base) {
  const response = await fetch(`${base}/api/session/local`, {
    method: "POST",
    headers: {
      Origin: "http://localhost:5174",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ code: "test-once" }),
  })
  assert.equal(response.status, 200)
  const session = await response.json()
  return {
    Cookie: response.headers.get("set-cookie").split(";")[0],
    "X-CSRF-Token": session.csrf,
    Origin: "http://localhost:5174",
    "Content-Type": "application/json",
  }
}
test("private endpoints require authentication, exact origin, CSRF, and single-use login", async (t) => {
  const { base } = await fixture(t)
  for (const endpoint of [
    "/admin/posts",
    "/admin/media",
    "/admin/export",
    "/admin/settings",
  ])
    assert.equal((await fetch(`${base}/api${endpoint}`)).status, 401)
  const headers = await login(base)
  const once = await fetch(`${base}/api/session/local`, {
    method: "POST",
    headers,
    body: JSON.stringify({ code: "test-once" }),
  })
  assert.equal(once.status, 401)
  let result = await fetch(`${base}/api/admin/posts`, {
    method: "POST",
    headers: { ...headers, Origin: "https://evil.example" },
    body: "{}",
  })
  assert.equal(result.status, 403)
  result = await fetch(`${base}/api/admin/posts`, {
    method: "POST",
    headers: { ...headers, "X-CSRF-Token": "wrong" },
    body: "{}",
  })
  assert.equal(result.status, 403)
  result = await fetch(`${base}/api/admin/posts`, {
    method: "POST",
    headers,
    body: "{}",
  })
  assert.equal(result.status, 201)
  assert.equal(result.headers.get("cache-control"), "no-store")
  await fetch(`${base}/api/admin/logout`, {
    method: "POST",
    headers,
    body: "{}",
  })
  assert.equal(
    (await fetch(`${base}/api/admin/posts`, { headers })).status,
    401,
  )
})
test("production never accepts local authentication", async (t) => {
  const { base } = await fixture(t, true)
  const result = await fetch(`${base}/api/session/local`, {
    method: "POST",
    headers: {
      Origin: "http://localhost:5174",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ code: "test-once" }),
  })
  assert.equal(result.status, 403)
})
test("uploaded media stays private until referenced in a published revision and is revoked on archive", async (t) => {
  const { base } = await fixture(t),
    headers = await login(base)
  const form = new FormData()
  form.append(
    "file",
    new Blob(
      [
        await sharp({
          create: { width: 10, height: 10, channels: 3, background: "#fff" },
        })
          .png()
          .toBuffer(),
      ],
      { type: "image/png" },
    ),
    "image.png",
  )
  const uploadHeaders = { ...headers }
  delete uploadHeaders["Content-Type"]
  const uploaded = await fetch(`${base}/api/admin/media`, {
    method: "POST",
    headers: uploadHeaders,
    body: form,
  })
  assert.equal(uploaded.status, 201)
  const media = await uploaded.json()
  assert.equal((await fetch(base + media.url)).status, 404)
  assert.equal((await fetch(base + media.url, { headers })).status, 200)
  let response = await fetch(`${base}/api/admin/posts`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      snapshot: {
        title: "Photo post",
        document: {
          type: "doc",
          content: [
            { type: "image", attrs: { src: media.url, alt: "A white square" } },
          ],
        },
      },
    }),
  })
  let post = await response.json()
  response = await fetch(`${base}/api/admin/posts/${post.id}/publish`, {
    method: "POST",
    headers,
    body: JSON.stringify({ version: post.version }),
  })
  post = await response.json()
  assert.equal(response.status, 200)
  assert.equal((await fetch(base + media.url)).status, 200)
  await fetch(`${base}/api/admin/posts/${post.id}/archive`, {
    method: "POST",
    headers,
    body: JSON.stringify({ version: post.version, archived: true }),
  })
  assert.equal((await fetch(base + media.url)).status, 404)
})
