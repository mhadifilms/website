import { test } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, rmSync } from "node:fs"
import os from "node:os"
import path from "node:path"
import { createHash } from "node:crypto"
import { openStore } from "../server/store.mjs"
import { createApp } from "../server/app.mjs"

async function fixture(t, userId = 71292747, failure = false) {
  const directory = mkdtempSync(path.join(os.tmpdir(), "cms-oauth-"))
  const store = openStore(directory)
  const exchanges = []
  const config = {
    production: true,
    origin: "https://writing.example",
    ownerLogin: "mhadifilms",
    ownerId: "71292747",
    githubClientId: "client",
    githubClientSecret: "secret",
    githubFetch: async (url, options) => {
      if (failure) throw new Error("provider detail must stay private")
      if (url.includes("access_token")) {
        exchanges.push(JSON.parse(options.body))
        return {
          ok: true,
          json: async () => ({ access_token: "private-token" }),
        }
      }
      assert.equal(options.headers.Authorization, "Bearer private-token")
      return { ok: true, json: async () => ({ id: userId }) }
    },
  }
  const server = createApp(store, config).listen(0, "127.0.0.1")
  await new Promise((resolve) => server.once("listening", resolve))
  const base = `http://127.0.0.1:${server.address().port}`
  t.after(async () => {
    await new Promise((resolve) => server.close(resolve))
    store.close()
    rmSync(directory, { recursive: true, force: true })
  })
  async function start(returnTo = "/admin?post=post-123") {
    const response = await fetch(
      `${base}/api/auth/github?returnTo=${encodeURIComponent(returnTo)}`,
      { redirect: "manual" },
    )
    const url = new URL(response.headers.get("location"))
    const cookie = response.headers
      .getSetCookie()
      .find((value) => value.startsWith("cms_oauth="))
      .split(";")[0]
    assert.match(response.headers.get("set-cookie"), /Secure/)
    assert.equal(url.searchParams.get("scope"), "")
    assert.equal(url.searchParams.get("code_challenge_method"), "S256")
    return { url, cookie, state: url.searchParams.get("state") }
  }
  async function finish(login, query = "code=valid") {
    return fetch(`${base}/api/auth/callback?state=${login.state}&${query}`, {
      redirect: "manual",
      headers: { Cookie: login.cookie },
    })
  }
  return { base, store, start, finish, exchanges }
}

test("hosted owner login uses PKCE, secure cookies, returns to the draft and consumes state once", async (t) => {
  const { base, start, finish, exchanges } = await fixture(t)
  const login = await start()
  const response = await finish(login)
  assert.equal(response.status, 302)
  assert.equal(response.headers.get("location"), "/admin?post=post-123")
  assert.equal(
    createHash("sha256").update(exchanges[0].code_verifier).digest("base64url"),
    login.url.searchParams.get("code_challenge"),
  )
  const cookie = response.headers
    .getSetCookie()
    .find((value) => value.startsWith("cms_session="))
  assert.match(cookie, /HttpOnly/)
  assert.match(cookie, /Secure/)
  assert.match(cookie, /SameSite=Lax/)
  const session = await fetch(`${base}/api/session`, {
    headers: { Cookie: cookie.split(";")[0] },
  }).then((r) => r.json())
  assert.equal(session.authenticated, true)
  assert.ok(session.csrf)
  assert.equal(
    (await finish(login)).headers.get("location"),
    "/admin?signin=expired",
  )
  assert.equal(exchanges.length, 1)
})

test("other GitHub accounts are denied without creating a session", async (t) => {
  const { start, finish, store } = await fixture(t, 999)
  const response = await finish(await start())
  assert.equal(
    response.headers.get("location"),
    "/admin?post=post-123&signin=owner",
  )
  assert.equal(
    store.db.prepare("SELECT COUNT(*) AS count FROM sessions").get().count,
    0,
  )
})

test("cancelled, expired, mismatched, and malformed callbacks return to usable sign-in", async (t) => {
  const { start, finish, store, exchanges } = await fixture(t)
  let login = await start()
  assert.match(
    (await finish(login, "error=access_denied")).headers.get("location"),
    /signin=cancelled/,
  )
  login = await start()
  store.db.prepare("UPDATE login_states SET expires_at=0").run()
  assert.equal(
    (await finish(login)).headers.get("location"),
    "/admin?signin=expired",
  )
  login = await start()
  assert.equal(
    (await finish({ ...login, cookie: "cms_oauth=invalid" })).headers.get(
      "location",
    ),
    "/admin?signin=expired",
  )
  assert.match(
    (await finish(login, "code%5Bbad%5D=value")).headers.get("location"),
    /signin=expired/,
  )
  assert.equal(exchanges.length, 0)
})

test("provider failures never disclose details; return paths cannot redirect off-site", async (t) => {
  const { start, finish } = await fixture(t, 71292747, true)
  for (const path of [
    "https://evil.example",
    "//evil.example",
    "/api/admin/export",
  ]) {
    const response = await finish(await start(path))
    assert.equal(response.headers.get("location"), "/admin?signin=unavailable")
    assert.ok(!(await response.text()).includes("provider detail"))
  }
})
