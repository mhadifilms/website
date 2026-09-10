import { test } from "node:test"
import assert from "node:assert/strict"
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
  rmSync,
  existsSync,
} from "node:fs"
import os from "node:os"
import path from "node:path"
import { openStore } from "../server/store.mjs"
import { createBackup, restoreBackup } from "../server/backup.mjs"
test("backup restores private drafts, revisions and image bytes without login sessions; rejects tampering and overwrite", async (t) => {
  const dir = mkdtempSync(path.join(os.tmpdir(), "cms-backup-test-"))
  const store = openStore(path.join(dir, "source"))
  t.after(() => {
    store.close()
    rmSync(dir, { recursive: true, force: true })
  })
  const post = store.create({ title: "A private idea" })
  const id = "00000000-0000-0000-0000-000000000000"
  store.db
    .prepare(
      "INSERT INTO media (id,name,mime,bytes,created_at) VALUES (?,?,?,?,?)",
    )
    .run(id, "photo", "image/webp", 5, new Date().toISOString())
  mkdirSync(path.join(store.directory, "media"))
  writeFileSync(path.join(store.directory, "media", `${id}.webp`), "image")
  store.db
    .prepare("INSERT INTO sessions VALUES (?,?,?)")
    .run("private-session", "csrf", 9999999999999)
  await createBackup(store.directory, path.join(dir, "bundle"))
  restoreBackup(path.join(dir, "bundle"), path.join(dir, "restored"))
  const restored = openStore(path.join(dir, "restored"))
  try {
    assert.equal(restored.get(post.id).snapshot.title, "A private idea")
    assert.equal(
      restored.db.prepare("SELECT COUNT(*) AS count FROM sessions").get().count,
      0,
    )
    assert.equal(restored.revisions(post.id).length, 1)
    assert.equal(
      readFileSync(path.join(dir, "restored", "media", `${id}.webp`), "utf8"),
      "image",
    )
  } finally {
    restored.close()
  }
  assert.equal(
    store.db.prepare("SELECT COUNT(*) AS count FROM sessions").get().count,
    1,
  )
  assert.throws(
    () => restoreBackup(path.join(dir, "bundle"), store.directory),
    /must not exist/,
  )
  writeFileSync(path.join(dir, "bundle", "media", `${id}.webp`), "tampered")
  assert.throws(
    () => restoreBackup(path.join(dir, "bundle"), path.join(dir, "invalid")),
    /checksum/,
  )
  assert.equal(existsSync(path.join(dir, "invalid")), false)
})
