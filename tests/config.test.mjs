import { test } from "node:test"
import assert from "node:assert/strict"
import { readConfig } from "../server/config.mjs"
const production = {
  NODE_ENV: "production",
  CMS_ORIGIN: "https://writing.example",
  CMS_DATA_DIR: "/data/publishing",
  CMS_OWNER_ID: "71292747",
  GITHUB_CLIENT_ID: "client",
  GITHUB_CLIENT_SECRET: "secret",
}
test("hosted startup requires exact HTTPS origin, persistent path and owner identity", () => {
  assert.equal(readConfig(production).origin, "https://writing.example")
  for (const origin of [
    "https://writing.example/",
    "https://writing.example/admin",
    "https://user:pass@writing.example",
    "http://writing.example",
    "https://",
  ])
    assert.throws(() => readConfig({ ...production, CMS_ORIGIN: origin }))
  for (const key of [
    "CMS_ORIGIN",
    "CMS_DATA_DIR",
    "CMS_OWNER_ID",
    "GITHUB_CLIENT_ID",
    "GITHUB_CLIENT_SECRET",
  ])
    assert.throws(() => readConfig({ ...production, [key]: "" }))
  assert.throws(() => readConfig({ ...production, CMS_DATA_DIR: ".cms-data" }))
  assert.throws(() => readConfig({ ...production, CMS_OWNER_ID: "mhadifilms" }))
})
test("proxy trust applies only to hosted Render; development keeps local defaults", () => {
  assert.equal(readConfig({}).production, false)
  assert.equal(readConfig({}).trustProxy, false)
  assert.equal(readConfig({ ...production, RENDER: "true" }).trustProxy, 1)
  assert.equal(readConfig({ ...production }).trustProxy, false)
})
