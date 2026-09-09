import express from "express"
import helmet from "helmet"
import multer from "multer"
import sharp from "sharp"
import { randomUUID } from "node:crypto"
import { mkdirSync, writeFileSync, existsSync, readFileSync } from "node:fs"
import path from "node:path"
import { attachAuth } from "./auth.mjs"
import { HttpError, requireValue, sanitize } from "./content.mjs"

export function createApp(store, config) {
  const app = express()
  app.disable("x-powered-by")
  app.use(
    helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }),
  )
  app.use(express.json({ limit: "2mb" }))
  attachAuth(app, store, config)
  app.get("/api/health", (_request, response) => response.json({ ok: true }))
  app.get("/api/admin/posts", (_request, response) =>
    response.json(store.list()),
  )
  app.post("/api/admin/posts", (request, response) =>
    response.status(201).json(store.create(request.body.snapshot)),
  )
  app.get("/api/admin/posts/:id", (request, response) =>
    response.json(store.get(request.params.id)),
  )
  app.put("/api/admin/posts/:id", (request, response) =>
    response.json(
      store.save(
        request.params.id,
        request.body.version,
        request.body.snapshot,
      ),
    ),
  )
  app.get("/api/admin/posts/:id/revisions", (request, response) =>
    response.json(store.revisions(request.params.id)),
  )
  app.get("/api/admin/posts/:id/revisions/:revision", (request, response) =>
    response.json(
      store.snapshot(request.params.id, Number(request.params.revision)),
    ),
  )
  app.post("/api/admin/posts/:id/restore", (request, response) =>
    response.json(
      store.save(
        request.params.id,
        request.body.version,
        store.snapshot(request.params.id, Number(request.body.revision)),
      ),
    ),
  )
  app.post("/api/admin/posts/:id/publish", (request, response) =>
    response.json(store.publish(request.params.id, request.body.version)),
  )
  app.post("/api/admin/posts/:id/schedule", (request, response) =>
    response.json(
      store.schedule(request.params.id, request.body.version, request.body.at),
    ),
  )
  app.post("/api/admin/posts/:id/archive", (request, response) =>
    response.json(
      store.archive(
        request.params.id,
        request.body.version,
        request.body.archived === true,
      ),
    ),
  )
  app.get("/api/admin/export", (_request, response) => {
    response
      .attachment(
        `creative-chaos-${new Date().toISOString().slice(0, 10)}.json`,
      )
      .json({
        schema: 1,
        exportedAt: new Date().toISOString(),
        posts: store.list(),
      })
  })
  app.get("/api/admin/settings", (_request, response) =>
    response.json({
      owner: config.ownerLogin,
      origin: config.origin,
      production: config.production,
      signInReady: Boolean(config.githubClientId && config.githubClientSecret),
      newsletterReady: false,
      newsletterMessage:
        "Newsletter delivery and subscriber migration are not connected yet. You can prepare and preview an email edition in each post.",
      postCount: store.list().length,
      mediaCount: store.db.prepare("SELECT COUNT(*) AS count FROM media").get()
        .count,
    }),
  )
  app.post("/api/admin/posts/:id/email-preview", (request, response) => {
    const post = store.get(request.params.id)
    requireValue(
      post.version === request.body.version,
      "Save the latest changes before previewing.",
      409,
    )
    const snapshot = post.snapshot
    const escape = (value) =>
      String(value).replace(
        /[&<>"']/g,
        (c) =>
          ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;",
          })[c],
      )
    const body = sanitize(snapshot.html).replaceAll(
      'src="/api/media/',
      `src="${config.origin}/api/media/`,
    )
    response.json({
      subject: snapshot.newsletter.subject || snapshot.title,
      html: `<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"><style>body{margin:0;background:#fffff6;color:#000;font:18px/1.7 Georgia,serif}main{max-width:640px;margin:auto;padding:40px 24px}img{max-width:100%;height:auto}h1{font-size:38px;line-height:1.15}a{color:#000}iframe{display:none}figcaption,footer{font:14px/1.6 Arial,sans-serif;color:#666}footer{margin-top:40px;border-top:1px solid #ddd;padding-top:20px}</style></head><body><main><p style="font:14px Arial">Creative Chaos / M Hadi</p><h1>${escape(snapshot.title)}</h1>${snapshot.subtitle ? `<p>${escape(snapshot.subtitle)}</p>` : ""}${snapshot.newsletter.intro ? `<p>${escape(snapshot.newsletter.intro).replaceAll("\n", "<br>")}</p>` : ""}${body}${snapshot.html.includes("<iframe") ? "<p>Watch the video in the website edition.</p>" : ""}<footer>Preview only. Delivery will include the website link and unsubscribe preferences.</footer></main></body></html>`,
      text: [
        snapshot.newsletter.intro,
        snapshot.title,
        snapshot.subtitle,
        snapshot.text,
      ]
        .filter(Boolean)
        .join("\n\n"),
    })
  })
  const uploads = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 20 * 1024 * 1024, files: 1 },
  })
  const mediaDirectory = path.join(store.directory, "media")
  mkdirSync(mediaDirectory, { recursive: true, mode: 0o700 })
  app.get("/api/admin/media", (_request, response) =>
    response.json(
      store.db
        .prepare("SELECT * FROM media ORDER BY created_at DESC")
        .all()
        .map((m) => ({ ...m, url: `/api/media/${m.id}` })),
    ),
  )
  app.post(
    "/api/admin/media",
    uploads.single("file"),
    async (request, response) => {
      requireValue(request.file, "Choose an image to upload.")
      let buffer, metadata
      try {
        const original = await sharp(request.file.buffer, {
          limitInputPixels: 60_000_000,
        }).metadata()
        requireValue(
          ["jpeg", "png", "webp", "gif", "avif"].includes(original.format),
          "Choose a JPEG, PNG, WebP, GIF, or AVIF image.",
        )
        buffer = await sharp(request.file.buffer, {
          limitInputPixels: 60_000_000,
        })
          .rotate()
          .resize({
            width: 2400,
            height: 2400,
            fit: "inside",
            withoutEnlargement: true,
          })
          .webp({ quality: 88 })
          .toBuffer()
        metadata = await sharp(buffer).metadata()
      } catch {
        throw new HttpError(
          400,
          "This image could not be read. Try a JPEG, PNG, WebP, GIF, or AVIF under 20 MB.",
        )
      }
      const id = randomUUID(),
        created = new Date().toISOString()
      writeFileSync(path.join(mediaDirectory, `${id}.webp`), buffer, {
        mode: 0o600,
      })
      store.db
        .prepare(
          "INSERT INTO media (id,name,mime,width,height,bytes,created_at) VALUES (?,?,?,?,?,?,?)",
        )
        .run(
          id,
          request.file.originalname.slice(0, 200),
          "image/webp",
          metadata.width,
          metadata.height,
          buffer.length,
          created,
        )
      response.status(201).json({
        id,
        name: request.file.originalname,
        url: `/api/media/${id}`,
        width: metadata.width,
        height: metadata.height,
        bytes: buffer.length,
        created_at: created,
      })
    },
  )
  app.get("/api/media/:id", (request, response) => {
    requireValue(
      /^[a-f0-9-]{36}$/.test(request.params.id),
      "Image not found.",
      404,
    )
    const media = store.db
      .prepare("SELECT * FROM media WHERE id=?")
      .get(request.params.id)
    const published = store.db
      .prepare("SELECT media_id FROM published_media WHERE media_id=? LIMIT 1")
      .get(request.params.id)
    requireValue(media && (request.admin || published), "Image not found.", 404)
    response
      .set({
        "Cache-Control": "private, no-store",
        "Content-Type": media.mime,
        "X-Content-Type-Options": "nosniff",
      })
      .sendFile(path.join(mediaDirectory, `${media.id}.webp`), {
        dotfiles: "allow",
      })
  })
  app.get("/api/public/archive-index", (_request, response) =>
    response.json({
      posts: store.publicPosts(),
      managedPaths: store.db
        .prepare(
          "SELECT canonical_path FROM posts WHERE canonical_path IS NOT NULL",
        )
        .all()
        .map((row) => row.canonical_path),
    }),
  )
  app.get("/api/public/posts", (_request, response) =>
    response.json(store.publicPosts()),
  )
  app.get("/api/public/post", (request, response) => {
    const canonical = String(request.query.path || "")
    const managed = store.db
      .prepare(
        "SELECT id,published_revision,archived_at FROM posts WHERE canonical_path=?",
      )
      .get(canonical)
    requireValue(
      !managed || (managed.published_revision && !managed.archived_at),
      "This article is no longer published.",
      410,
    )
    response.json(store.publicPost(canonical))
  })
  app.use("/api", (_request, _response, next) =>
    next(new HttpError(404, "This endpoint is not available.")),
  )
  if (config.dist && existsSync(path.join(config.dist, "index.html"))) {
    // Render native publications before static legacy archive files; keep previews private.
    app.use((request, response, next) => {
      if (request.method !== "GET") return next()
      if (request.path.startsWith("/admin"))
        response.set({
          "Cache-Control": "no-store",
          "X-Robots-Tag": "noindex, nofollow",
        })
      const managed = store.db
        .prepare(
          "SELECT id,published_revision,archived_at FROM posts WHERE canonical_path=?",
        )
        .get(request.path)
      if (managed && (!managed.published_revision || managed.archived_at))
        return response
          .status(410)
          .sendFile(path.join(config.dist, "index.html"))
      try {
        const post = store.publicPost(request.path)
        const esc = (v) =>
          String(v).replace(
            /[&<>"']/g,
            (c) =>
              ({
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#39;",
              })[c],
          )
        const base = readFileSync(path.join(config.dist, "index.html"), "utf8")
          .replace(
            /<title>.*?<\/title>/s,
            `<title>${esc(post.snapshot.title)} | M Hadi</title>`,
          )
          .replace(
            /<meta\s+name="description"[^>]*>/,
            `<meta name="description" content="${esc(post.snapshot.subtitle || post.snapshot.text.slice(0, 160))}">`,
          )
          .replace(
            /<link\s+rel="canonical"[^>]*>/,
            `<link rel="canonical" href="${esc(config.origin + post.path)}">`,
          )
        response.send(
          base.replace(
            '<div id="root"></div>',
            `<div id="root"><article><h1>${esc(post.snapshot.title)}</h1>${post.snapshot.html}</article></div>`,
          ),
        )
      } catch {
        next()
      }
    })
    app.use(express.static(config.dist, { index: false }))
    app.get("/{*path}", (request, response) => {
      if (request.path.startsWith("/writing/"))
        return response
          .status(404)
          .sendFile(path.join(config.dist, "index.html"))
      response.sendFile(path.join(config.dist, "index.html"))
    })
  }
  app.use((error, _request, response, _next) => {
    const status =
      error instanceof HttpError
        ? error.status
        : error.code === "LIMIT_FILE_SIZE"
          ? 413
          : error.type === "entity.too.large"
            ? 413
            : 500
    if (status === 500) console.error("CMS request failed:", error.message)
    response.status(status).json({
      error:
        status === 500
          ? "The request could not be completed. Your writing is still on this device. Please try again."
          : status === 413
            ? "That file is too large."
            : error.message,
    })
  })
  return app
}
