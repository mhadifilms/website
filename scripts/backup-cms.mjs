import path from "node:path"
import { createBackup, restoreBackup } from "../server/backup.mjs"
const [mode, source, destination] = process.argv.slice(2)
if (!["create", "restore"].includes(mode) || !source || !destination)
  throw new Error(
    "Usage: node scripts/backup-cms.mjs create|restore SOURCE_DIRECTORY NEW_DESTINATION_DIRECTORY",
  )
console.log(
  mode === "create"
    ? await createBackup(path.resolve(source), path.resolve(destination))
    : restoreBackup(path.resolve(source), path.resolve(destination)),
)
