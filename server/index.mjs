import path from "node:path"
import { randomBytes } from "node:crypto"
import { writeFileSync } from "node:fs"
import { openStore } from "./store.mjs"
import { createApp } from "./app.mjs"

const production = process.env.NODE_ENV === "production"
const origin = process.env.CMS_ORIGIN || "http://localhost:5174"
if (
  production &&
  (!process.env.CMS_DATA_DIR ||
    !process.env.GITHUB_CLIENT_ID ||
    !process.env.GITHUB_CLIENT_SECRET ||
    !process.env.CMS_OWNER_ID ||
    !origin.startsWith("https://"))
) {
  throw new Error(
    "Production requires a persistent CMS_DATA_DIR, HTTPS CMS_ORIGIN, GitHub OAuth credentials, and CMS_OWNER_ID.",
  )
}
const directory = path.resolve(process.env.CMS_DATA_DIR || ".cms-data")
const store = openStore(directory)
const config = {
  production,
  origin,
  ownerId: process.env.CMS_OWNER_ID || "71292747",
  ownerLogin: process.env.CMS_OWNER_LOGIN || "mhadifilms",
  githubClientId: process.env.GITHUB_CLIENT_ID,
  githubClientSecret: process.env.GITHUB_CLIENT_SECRET,
  localCodeFile: path.join(directory, "local-signin-code"),
  dist: path.resolve("dist"),
}
if (!production) {
  writeFileSync(config.localCodeFile, randomBytes(24).toString("hex"), {
    mode: 0o600,
  })
  console.log(`Local sign-in code saved privately to ${config.localCodeFile}`)
}
const server = createApp(store, config).listen(
  Number(process.env.PORT || 8788),
  production ? "0.0.0.0" : "127.0.0.1",
  () => console.log("Publishing server ready."),
)
const scheduler = setInterval(() => {
  for (const result of store.runScheduled())
    if (result.error)
      console.error("Scheduled post needs attention:", result.id, result.error)
}, 30_000)
scheduler.unref()
const stop = () => {
  clearInterval(scheduler)
  server.close(() => {
    store.close()
    process.exit(0)
  })
}
process.on("SIGINT", stop)
process.on("SIGTERM", stop)
