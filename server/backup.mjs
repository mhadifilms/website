import { DatabaseSync, backup } from "node:sqlite"
import {
  mkdirSync,
  existsSync,
  copyFileSync,
  readFileSync,
  writeFileSync,
  chmodSync,
  lstatSync,
} from "node:fs"
import { createHash } from "node:crypto"
import path from "node:path"
const checksum = (file) =>
  createHash("sha256").update(readFileSync(file)).digest("hex")
const regular = (file) => {
  if (!lstatSync(file).isFile())
    throw new Error("Backup requires regular files.")
}
const mediaName = (id) => {
  if (!/^[a-f0-9-]{36}$/.test(id))
    throw new Error("Invalid media ID in backup.")
  return `media/${id}.webp`
}
export async function createBackup(source, destination) {
  if (existsSync(destination))
    throw new Error("Backup destination must not exist.")
  const sourceFile = path.join(source, "publishing.sqlite")
  regular(sourceFile)
  mkdirSync(destination, { recursive: true, mode: 0o700 })
  const sourceDb = new DatabaseSync(sourceFile, { readOnly: true })
  const databaseFile = path.join(destination, "publishing.sqlite")
  try {
    await backup(sourceDb, databaseFile)
  } finally {
    sourceDb.close()
  }
  const snapshot = new DatabaseSync(databaseFile)
  let media
  try {
    // A restored host must issue fresh sessions; credentials never belong in a bundle.
    snapshot.exec(
      "DELETE FROM sessions; DELETE FROM login_states; PRAGMA journal_mode=DELETE; VACUUM;",
    )
    if (
      snapshot.prepare("PRAGMA integrity_check").get().integrity_check !== "ok"
    )
      throw new Error("Database integrity check failed.")
    media = snapshot.prepare("SELECT id FROM media").all()
  } finally {
    snapshot.close()
  }
  chmodSync(databaseFile, 0o600)
  mkdirSync(path.join(destination, "media"), { mode: 0o700 })
  const files = ["publishing.sqlite"]
  for (const { id } of media) {
    const name = mediaName(id)
    regular(path.join(source, name))
    copyFileSync(path.join(source, name), path.join(destination, name))
    chmodSync(path.join(destination, name), 0o600)
    files.push(name)
  }
  const manifest = {
    schema: 1,
    createdAt: new Date().toISOString(),
    files: files.map((name) => ({
      name,
      sha256: checksum(path.join(destination, name)),
    })),
  }
  writeFileSync(
    path.join(destination, "manifest.json"),
    JSON.stringify(manifest, null, 2),
    { mode: 0o600 },
  )
  return { files: files.length, media: media.length }
}
export function restoreBackup(source, destination) {
  if (existsSync(destination))
    throw new Error(
      "Restore destination must not exist. Restore to a fresh directory first.",
    )
  const manifest = JSON.parse(
    readFileSync(path.join(source, "manifest.json"), "utf8"),
  )
  if (manifest.schema !== 1 || !Array.isArray(manifest.files))
    throw new Error("Unsupported backup format.")
  const names = new Set()
  for (const item of manifest.files) {
    if (
      !item ||
      typeof item.name !== "string" ||
      !(
        item.name === "publishing.sqlite" ||
        /^media\/[a-f0-9-]{36}\.webp$/.test(item.name)
      ) ||
      names.has(item.name)
    )
      throw new Error("Invalid backup file manifest.")
    names.add(item.name)
    const file = path.join(source, item.name)
    regular(file)
    if (checksum(file) !== item.sha256)
      throw new Error("Backup checksum verification failed.")
  }
  if (!names.has("publishing.sqlite"))
    throw new Error("Backup database is missing.")
  const check = new DatabaseSync(path.join(source, "publishing.sqlite"), {
    readOnly: true,
  })
  try {
    if (check.prepare("PRAGMA integrity_check").get().integrity_check !== "ok")
      throw new Error("Backup database is corrupt.")
    for (const { id } of check.prepare("SELECT id FROM media").all())
      if (!names.has(mediaName(id))) throw new Error("Backup image is missing.")
  } finally {
    check.close()
  }
  mkdirSync(destination, { recursive: true, mode: 0o700 })
  mkdirSync(path.join(destination, "media"), { mode: 0o700 })
  for (const name of names) {
    copyFileSync(path.join(source, name), path.join(destination, name))
    chmodSync(path.join(destination, name), 0o600)
  }
  const restored = new DatabaseSync(path.join(destination, "publishing.sqlite"))
  try {
    restored.exec("DELETE FROM sessions; DELETE FROM login_states; VACUUM;")
  } finally {
    restored.close()
  }
  return { files: names.size }
}
