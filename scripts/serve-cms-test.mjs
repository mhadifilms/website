import fs from "node:fs"
import path from "node:path"
import { openStore } from "../server/store.mjs"
import { createApp } from "../server/app.mjs"
const directory = path.resolve(".cms-data/browser-tests")
fs.rmSync(directory, { recursive: true, force: true })
const store = openStore(directory)
const localCodeFile = path.join(directory, "local-signin-code")
fs.writeFileSync(localCodeFile, "browser-tests-only", { mode: 0o600 })
createApp(store, {
  production: false,
  origin: "http://localhost:5180",
  ownerLogin: "test",
  localCodeFile,
}).listen(8790, "127.0.0.1")
