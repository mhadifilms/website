import { DatabaseSync } from "node:sqlite"
import { mkdirSync, chmodSync } from "node:fs"
import path from "node:path"
import { randomUUID } from "node:crypto"
import {
  requireValue,
  validateSnapshot,
  publicSnapshot,
  referencedMedia,
} from "./content.mjs"

export function openStore(directory) {
  mkdirSync(directory, { recursive: true, mode: 0o700 })
  chmodSync(directory, 0o700)
  const db = new DatabaseSync(path.join(directory, "publishing.sqlite"), {
    timeout: 5000,
  })
  db.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;
    CREATE TABLE IF NOT EXISTS posts (
      id TEXT PRIMARY KEY, version INTEGER NOT NULL, draft_revision INTEGER NOT NULL,
      published_revision INTEGER, canonical_path TEXT UNIQUE, created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL, archived_at TEXT, scheduled_at TEXT, scheduled_revision INTEGER,
      source_id TEXT UNIQUE, source_html TEXT, import_notes TEXT
    );
    CREATE TABLE IF NOT EXISTS revisions (
      post_id TEXT NOT NULL REFERENCES posts(id), revision INTEGER NOT NULL,
      snapshot TEXT NOT NULL, created_at TEXT NOT NULL, PRIMARY KEY(post_id, revision)
    );
    CREATE TABLE IF NOT EXISTS media (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, mime TEXT NOT NULL, width INTEGER, height INTEGER,
      bytes INTEGER NOT NULL, created_at TEXT NOT NULL, alt TEXT NOT NULL DEFAULT ''
    );
    CREATE TABLE IF NOT EXISTS published_media (
      post_id TEXT NOT NULL REFERENCES posts(id), media_id TEXT NOT NULL REFERENCES media(id),
      PRIMARY KEY(post_id, media_id)
    );
    CREATE TABLE IF NOT EXISTS sessions (token_hash TEXT PRIMARY KEY, csrf TEXT NOT NULL, expires_at INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS login_states (state_hash TEXT PRIMARY KEY, expires_at INTEGER NOT NULL);
  `)
  if (
    !db
      .prepare("PRAGMA table_info(posts)")
      .all()
      .some((column) => column.name === "content_revision")
  )
    db.exec(
      "ALTER TABLE posts ADD COLUMN content_revision INTEGER NOT NULL DEFAULT 1",
    )
  const now = () => new Date().toISOString()
  const transaction = (fn) => {
    db.exec("BEGIN IMMEDIATE")
    try {
      const result = fn()
      db.exec("COMMIT")
      return result
    } catch (error) {
      db.exec("ROLLBACK")
      throw error
    }
  }
  function row(id) {
    const post = db.prepare("SELECT * FROM posts WHERE id=?").get(id)
    requireValue(post, "Post not found.", 404)
    return post
  }
  function snapshot(id, revision) {
    const revisionRow = db
      .prepare("SELECT snapshot FROM revisions WHERE post_id=? AND revision=?")
      .get(id, revision)
    requireValue(revisionRow, "Revision not found.", 404)
    return JSON.parse(revisionRow.snapshot)
  }
  function get(id) {
    const post = row(id)
    const { source_html: _source, ...metadata } = post
    return { ...metadata, snapshot: snapshot(id, post.draft_revision) }
  }
  function check(post, version) {
    requireValue(
      post.version === version,
      "This post changed in another tab. Your writing is kept on this device. Reload the latest version or save your recovered copy as a new post.",
      409,
    )
  }
  function create(input = {}, source = {}) {
    const id = randomUUID(),
      time = now()
    const value = validateSnapshot({
      document: { type: "doc", content: [{ type: "paragraph" }] },
      ...input,
    })
    transaction(() => {
      db.prepare(
        "INSERT INTO posts (id,version,draft_revision,created_at,updated_at,source_id,source_html,import_notes,canonical_path) VALUES (?,1,1,?,?,?,?,?,?)",
      ).run(
        id,
        time,
        time,
        source.id || null,
        source.html || null,
        source.notes || null,
        source.path || null,
      )
      db.prepare("INSERT INTO revisions VALUES (?,1,?,?)").run(
        id,
        JSON.stringify(value),
        time,
      )
    })
    return get(id)
  }
  function save(id, version, input) {
    const value = validateSnapshot(input)
    return transaction(() => {
      const post = row(id)
      check(post, version)
      const current = snapshot(id, post.draft_revision)
      if (post.canonical_path)
        requireValue(
          current.slug === value.slug,
          "This post already has a permanent address. Its URL cannot be changed here.",
        )
      if (JSON.stringify(value) === JSON.stringify(current)) return get(id)
      const revision = post.draft_revision + 1,
        time = now()
      db.prepare("INSERT INTO revisions VALUES (?,?,?,?)").run(
        id,
        revision,
        JSON.stringify(value),
        time,
      )
      const contentRevision =
        JSON.stringify(publicSnapshot(current)) ===
        JSON.stringify(publicSnapshot(value))
          ? post.content_revision
          : revision
      db.prepare(
        "UPDATE posts SET version=version+1,draft_revision=?,content_revision=?,updated_at=? WHERE id=?",
      ).run(revision, contentRevision, time, id)
      return get(id)
    })
  }
  function publishInside(id, revision) {
    const post = row(id),
      value = snapshot(id, revision)
    requireValue(
      value.title &&
        value.slug &&
        (value.text.trim() ||
          referencedMedia(value).length ||
          value.html.includes("<iframe")),
      "Add a title and some writing or media before publishing.",
    )
    requireValue(!post.archived_at, "Restore this post before publishing.")
    const canonical = post.canonical_path || `/writing/${value.slug}`
    requireValue(
      !db
        .prepare("SELECT id FROM posts WHERE canonical_path=? AND id<>?")
        .get(canonical, id),
      "That address is already used. Choose another slug.",
      409,
    )
    db.prepare(
      "UPDATE posts SET version=version+1,published_revision=?,canonical_path=?,scheduled_at=NULL,scheduled_revision=NULL,updated_at=? WHERE id=?",
    ).run(revision, canonical, now(), id)
    db.prepare("DELETE FROM published_media WHERE post_id=?").run(id)
    for (const asset of referencedMedia(publicSnapshot(value))) {
      if (db.prepare("SELECT id FROM media WHERE id=?").get(asset))
        db.prepare("INSERT INTO published_media VALUES (?,?)").run(id, asset)
    }
    return get(id)
  }
  function publish(id, version) {
    return transaction(() => {
      const post = row(id)
      check(post, version)
      return publishInside(id, post.draft_revision)
    })
  }
  function schedule(id, version, at) {
    requireValue(
      at === null ||
        (Number.isFinite(Date.parse(at)) && Date.parse(at) > Date.now()),
      "Choose a future publication time.",
    )
    return transaction(() => {
      const post = row(id)
      check(post, version)
      const value = snapshot(id, post.draft_revision)
      requireValue(!post.archived_at, "Restore this post before scheduling.")
      requireValue(
        at === null ||
          (value.title &&
            value.slug &&
            (value.text.trim() ||
              value.html.includes("<img") ||
              value.html.includes("<iframe"))),
        "Add a title and content before scheduling.",
      )
      db.prepare(
        "UPDATE posts SET version=version+1,scheduled_at=?,scheduled_revision=?,updated_at=? WHERE id=?",
      ).run(at, at ? post.draft_revision : null, now(), id)
      return get(id)
    })
  }
  function runScheduled() {
    const results = []
    for (const post of db
      .prepare(
        "SELECT * FROM posts WHERE scheduled_at<=? AND archived_at IS NULL",
      )
      .all(now())) {
      try {
        transaction(() => publishInside(post.id, post.scheduled_revision))
        results.push({ id: post.id, published: true })
      } catch (error) {
        results.push({ id: post.id, error: error.message })
      }
    }
    return results
  }
  function archive(id, version, archived) {
    return transaction(() => {
      const post = row(id)
      check(post, version)
      db.prepare(
        "UPDATE posts SET version=version+1,archived_at=?,published_revision=NULL,scheduled_at=NULL,scheduled_revision=NULL,updated_at=? WHERE id=?",
      ).run(archived ? now() : null, now(), id)
      db.prepare("DELETE FROM published_media WHERE post_id=?").run(id)
      return get(id)
    })
  }
  function list() {
    return db
      .prepare("SELECT id FROM posts ORDER BY updated_at DESC")
      .all()
      .map((p) => get(p.id))
  }
  function publicPost(canonical) {
    const post = db
      .prepare(
        "SELECT * FROM posts WHERE canonical_path=? AND published_revision IS NOT NULL AND archived_at IS NULL",
      )
      .get(canonical)
    requireValue(post, "This post is not published.", 404)
    return {
      id: post.id,
      path: post.canonical_path,
      revision: post.published_revision,
      snapshot: publicSnapshot(snapshot(post.id, post.published_revision)),
    }
  }
  function publicPosts() {
    return db
      .prepare(
        "SELECT canonical_path FROM posts WHERE published_revision IS NOT NULL AND archived_at IS NULL",
      )
      .all()
      .map((p) => publicPost(p.canonical_path))
      .sort((a, b) => b.snapshot.date.localeCompare(a.snapshot.date))
  }
  function revisions(id) {
    row(id)
    return db
      .prepare(
        "SELECT revision,created_at,snapshot FROM revisions WHERE post_id=? ORDER BY revision DESC LIMIT 100",
      )
      .all(id)
      .map((r) => ({
        revision: r.revision,
        created_at: r.created_at,
        title: JSON.parse(r.snapshot).title,
      }))
  }
  return {
    db,
    directory,
    create,
    get,
    save,
    publish,
    archive,
    schedule,
    runScheduled,
    list,
    snapshot,
    publicPost,
    publicPosts,
    revisions,
    close: () => db.close(),
  }
}
