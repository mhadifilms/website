import { randomBytes, createHash, timingSafeEqual } from "node:crypto"
import { readFileSync, unlinkSync } from "node:fs"
import { rateLimit } from "express-rate-limit"
import { HttpError, requireValue } from "./content.mjs"

export const hash = (value) => createHash("sha256").update(value).digest("hex")
const equal = (a, b) =>
  typeof a === "string" &&
  typeof b === "string" &&
  a.length === b.length &&
  timingSafeEqual(Buffer.from(a), Buffer.from(b))
const cookie = (request, name) =>
  (request.headers.cookie || "")
    .split(";")
    .map((v) => v.trim())
    .find((v) => v.startsWith(`${name}=`))
    ?.slice(name.length + 1)
export function attachAuth(app, store, config) {
  const secure = config.production
  const cookieOptions = {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 86400_000,
  }
  const loginLimit = rateLimit({
    windowMs: 15 * 60_000,
    limit: 20,
    standardHeaders: "draft-8",
    legacyHeaders: false,
  })
  const issue = (response) => {
    const token = randomBytes(32).toString("hex"),
      csrf = randomBytes(32).toString("hex")
    store.db.prepare("DELETE FROM sessions WHERE expires_at<?").run(Date.now())
    store.db
      .prepare("INSERT INTO sessions VALUES (?,?,?)")
      .run(hash(token), csrf, Date.now() + 7 * 86400_000)
    response.cookie("cms_session", token, cookieOptions)
    return csrf
  }
  app.use("/api", (request, response, next) => {
    response.set("Cache-Control", "no-store")
    const token = cookie(request, "cms_session")
    request.admin =
      token &&
      store.db
        .prepare("SELECT * FROM sessions WHERE token_hash=? AND expires_at>?")
        .get(hash(token), Date.now())
    next()
  })
  const sameOrigin = (request, _response, next) => {
    if (request.get("Origin") !== config.origin)
      return next(
        new HttpError(
          403,
          "Please use the CMS in its original browser window.",
        ),
      )
    next()
  }
  const authenticated = (request, _response, next) =>
    request.admin
      ? next()
      : next(
          new HttpError(
            401,
            "Sign in to continue. Your unsaved writing is still on this device.",
          ),
        )
  app.get("/api/session", (request, response) =>
    response.json({
      authenticated: Boolean(request.admin),
      csrf: request.admin?.csrf || null,
      development: !secure,
      oauthConfigured: Boolean(config.githubClientId),
      owner: config.ownerLogin,
    }),
  )
  app.post(
    "/api/session/local",
    loginLimit,
    sameOrigin,
    (request, response) => {
      requireValue(
        !secure &&
          ["127.0.0.1", "::1", "::ffff:127.0.0.1"].includes(
            request.socket.remoteAddress,
          ),
        "Local sign-in is unavailable.",
        403,
      )
      let code = ""
      try {
        code = readFileSync(config.localCodeFile, "utf8").trim()
      } catch {
        /* A code is single use. */
      }
      requireValue(
        code && equal(request.body.code, code),
        "That code has expired or is incorrect. Restart the local server for a new code.",
        401,
      )
      unlinkSync(config.localCodeFile)
      response.json({ csrf: issue(response) })
    },
  )
  app.get("/api/auth/github", loginLimit, (request, response) => {
    requireValue(
      config.githubClientId && config.githubClientSecret && config.ownerId,
      "Owner sign-in has not been connected yet.",
      503,
    )
    const state = randomBytes(32).toString("hex")
    store.db
      .prepare("DELETE FROM login_states WHERE expires_at<?")
      .run(Date.now())
    store.db
      .prepare("INSERT INTO login_states VALUES (?,?)")
      .run(hash(state), Date.now() + 10 * 60_000)
    response.cookie("cms_oauth", state, {
      ...cookieOptions,
      maxAge: 10 * 60_000,
    })
    const url = new URL("https://github.com/login/oauth/authorize")
    url.search = new URLSearchParams({
      client_id: config.githubClientId,
      redirect_uri: `${config.origin}/api/auth/callback`,
      state,
    }).toString()
    response.redirect(url.href)
  })
  app.get("/api/auth/callback", loginLimit, async (request, response) => {
    const state =
      typeof request.query.state === "string" ? request.query.state : ""
    requireValue(
      equal(state, cookie(request, "cms_oauth")) &&
        store.db
          .prepare(
            "DELETE FROM login_states WHERE state_hash=? AND expires_at>? RETURNING state_hash",
          )
          .get(hash(state), Date.now()),
      "Sign-in expired. Please try again.",
      401,
    )
    response.clearCookie("cms_oauth", { ...cookieOptions, maxAge: undefined })
    const result = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        client_id: config.githubClientId,
        client_secret: config.githubClientSecret,
        code: request.query.code,
        redirect_uri: `${config.origin}/api/auth/callback`,
      }),
      signal: AbortSignal.timeout(15000),
    })
    const token = await result.json()
    requireValue(
      result.ok && token.access_token,
      "GitHub could not complete sign-in. Please try again.",
      401,
    )
    const identity = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${token.access_token}`,
        "User-Agent": "mhadifilms-publishing",
        Accept: "application/vnd.github+json",
      },
      signal: AbortSignal.timeout(15000),
    })
    const user = await identity.json()
    requireValue(
      identity.ok && String(user.id) === config.ownerId,
      "This writing desk is private.",
      403,
    )
    issue(response)
    response.redirect("/admin")
  })
  app.use("/api/admin", authenticated, (request, response, next) => {
    if (["GET", "HEAD", "OPTIONS"].includes(request.method)) return next()
    sameOrigin(request, response, (error) => {
      if (error) return next(error)
      if (!equal(request.get("X-CSRF-Token"), request.admin.csrf))
        return next(
          new HttpError(
            403,
            "Your session changed. Sign in again before saving.",
          ),
        )
      next()
    })
  })
  app.post("/api/admin/logout", (request, response) => {
    store.db
      .prepare("DELETE FROM sessions WHERE token_hash=?")
      .run(request.admin.token_hash)
    response
      .clearCookie("cms_session", { ...cookieOptions, maxAge: undefined })
      .json({ ok: true })
  })
}
