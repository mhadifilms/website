import { randomBytes } from "node:crypto"
import { writeFileSync } from "node:fs"
import { openStore } from "./store.mjs"
import { createApp } from "./app.mjs"
import { readConfig } from "./config.mjs"

const config = readConfig()
const { production, directory } = config
const store = openStore(directory)
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
