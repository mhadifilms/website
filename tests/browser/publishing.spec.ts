import { test, expect, type BrowserContext, type Page } from "@playwright/test"
import sharp from "sharp"
test.describe.configure({ mode: "serial" })
let auth: Awaited<ReturnType<BrowserContext["storageState"]>>
let id: string
async function ready(page: Page) {
  await page.goto("/admin")
  await expect(page.getByRole("heading", { name: "Your posts" })).toBeVisible()
}
async function saved(page: Page) {
  await expect(
    page.getByRole("status").filter({ hasText: "All changes saved" }),
  ).toBeVisible()
}
async function csrf(page: Page) {
  return (await (await page.request.get("/api/session")).json()).csrf as string
}
test.beforeAll(async ({ browser }) => {
  const context = await browser.newContext({
    baseURL: "http://localhost:5180",
  })
  const result = await context.request.post("/api/session/local", {
    headers: { Origin: "http://localhost:5180" },
    data: { code: "browser-tests-only" },
  })
  expect(result.ok()).toBeTruthy()
  auth = await context.storageState()
  await context.close()
})
test.beforeEach(async ({ context }) => {
  await context.addCookies(auth.cookies)
})
test("write, autosave, image caption, preview, publish, and keep later changes private", async ({
  page,
}) => {
  await ready(page)
  await page.getByRole("button", { name: "New post", exact: true }).click()
  await page
    .getByRole("textbox", { name: "Post title", exact: true })
    .fill("An idea becomes a story")
  await page
    .getByRole("textbox", { name: "Post subtitle" })
    .fill("A short field note from the writing desk.")
  await page
    .getByRole("textbox", { name: "Post body" })
    .fill("The first version belongs here, with room to keep writing.")
  await saved(page)
  id = new URL(page.url()).searchParams.get("post")!
  await page.getByRole("button", { name: "Image", exact: true }).click()
  await page.getByLabel("Upload a photo").setInputFiles({
    name: "square.png",
    mimeType: "image/png",
    buffer: await sharp({
      create: { width: 800, height: 450, channels: 3, background: "#a9b4a2" },
    })
      .png()
      .toBuffer(),
  })
  await page.getByRole("button", { name: "Upload square.png" }).click()
  await page.getByLabel("Describe the image").fill("A small white square")
  await page
    .getByLabel("Caption", { exact: false })
    .last()
    .fill("A caption that stays with the picture.")
  await page.getByRole("button", { name: "Insert image", exact: true }).click()
  await saved(page)
  await expect(page.locator(".cms-prose img")).toHaveJSProperty(
    "naturalWidth",
    800,
  )
  await page.getByRole("button", { name: "Preview", exact: true }).click()
  await expect(
    page.getByRole("heading", { name: "An idea becomes a story" }),
  ).toBeVisible()
  await expect(
    page.getByText("A caption that stays with the picture."),
  ).toBeVisible()
  await page.getByRole("button", { name: "Phone preview", exact: true }).click()
  expect(
    await page
      .locator(".cms-preview-phone")
      .evaluate((el) => el.scrollWidth <= el.clientWidth),
  ).toBeTruthy()
  await page.screenshot({
    path: "test-results/phone-preview.png",
    fullPage: true,
  })
  await page.getByRole("button", { name: "Keep writing", exact: true }).click()
  await page.screenshot({
    path: "test-results/editor-desktop.png",
    fullPage: true,
  })
  await page.getByRole("button", { name: "Publish", exact: true }).click()
  await page.getByRole("button", { name: "Publish now", exact: true }).click()
  await expect(
    page.getByText("Published to the website.", { exact: true }),
  ).toBeVisible()
  let result = await (
    await page.request.get(
      "/api/public/post?path=/writing/an-idea-becomes-a-story",
    )
  ).json()
  expect(result.snapshot.html).toContain("The first version")
  await page
    .getByRole("textbox", { name: "Post body" })
    .press("ControlOrMeta+End")
  await page.getByRole("textbox", { name: "Post body" }).press("Enter")
  await page
    .getByRole("textbox", { name: "Post body" })
    .pressSequentially("A private addition that is not live yet.")
  await saved(page)
  result = await (
    await page.request.get(
      "/api/public/post?path=/writing/an-idea-becomes-a-story",
    )
  ).json()
  expect(result.snapshot.html).not.toContain("A private addition")
  await page.reload()
  await expect(page.getByRole("textbox", { name: "Post body" })).toContainText(
    "A private addition",
  )
})
test("social versions and email preparation persist without changing published article", async ({
  page,
}) => {
  await page.goto(`/admin?post=${id}`)
  await page
    .getByRole("button", { name: "Social versions", exact: true })
    .click()
  await page
    .getByRole("button", { name: "Add social version", exact: true })
    .click()
  await page
    .getByLabel("Post copy")
    .fill("The LinkedIn version is a little shorter.")
  await page
    .getByLabel("Link to the social post")
    .fill("https://www.linkedin.com/posts/example")
  await saved(page)
  await expect(page.getByText("Link saved", { exact: true })).toBeVisible()
  await expect(
    page.getByText("Based on an earlier version of this post."),
  ).toHaveCount(0)
  await page.getByRole("button", { name: "Email edition", exact: true }).click()
  await page
    .getByLabel("Subject", { exact: true })
    .fill("A letter from the writing desk")
  await page
    .getByLabel("Introduction")
    .fill("A note just for the email edition.")
  await page.getByRole("button", { name: "Preview email", exact: true }).click()
  await expect(page.getByRole("dialog")).toContainText(
    "A letter from the writing desk",
  )
  await page.getByRole("button", { name: "Plain text", exact: true }).click()
  await expect(page.locator(".cms-email-text")).toContainText(
    "A note just for the email edition.",
  )
  const result = await (await page.request.get("/api/public/posts")).json()
  expect(JSON.stringify(result)).not.toContain("LinkedIn version")
  expect(JSON.stringify(result)).not.toContain("email edition")
})
test("failed saves keep writing recoverable, and a stale tab cannot overwrite the server", async ({
  page,
}) => {
  await page.goto(`/admin?post=${id}`)
  await page.getByRole("textbox", { name: "Post title", exact: true }).waitFor()
  await page.route(`**/api/admin/posts/${id}`, async (route) => {
    if (route.request().method() === "PUT") await route.abort()
    else await route.continue()
  })
  await page
    .getByRole("textbox", { name: "Post subtitle" })
    .fill("This survives a failed connection.")
  await expect(
    page.getByText("Changes need saving", { exact: true }),
  ).toBeVisible()
  expect(
    await page.evaluate(
      (id) => !!localStorage.getItem(`creative-chaos:draft:${id}`),
      id,
    ),
  ).toBeTruthy()
  await page.unroute(`**/api/admin/posts/${id}`)
  await page.getByRole("button", { name: "Retry save", exact: true }).click()
  await saved(page)
  const current = await (
    await page.request.get(`/api/admin/posts/${id}`)
  ).json()
  await page.request.put(`/api/admin/posts/${id}`, {
    headers: {
      Origin: "http://localhost:5180",
      "X-CSRF-Token": await csrf(page),
    },
    data: {
      version: current.version,
      snapshot: { ...current.snapshot, subtitle: "Saved from another tab." },
    },
  })
  await page
    .getByRole("textbox", { name: "Post subtitle" })
    .fill("The stale tab’s unsaved writing.")
  await expect(
    page.getByText("Newer version found", { exact: true }),
  ).toBeVisible()
  const after = await (await page.request.get(`/api/admin/posts/${id}`)).json()
  expect(after.snapshot.subtitle).toBe("Saved from another tab.")
  await page
    .getByRole("button", { name: "Save my writing as a new post" })
    .click()
  await page.waitForURL((url) => url.searchParams.get("post") !== id)
  await expect(
    page.getByRole("textbox", { name: "Post subtitle" }),
  ).toHaveValue("The stale tab’s unsaved writing.")
  expect(new URL(page.url()).searchParams.get("post")).not.toBe(id)
})
test("mobile editor, inspector, library, and reader fit the viewport", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await ready(page)
  await page.screenshot({
    path: "test-results/library-mobile.png",
    fullPage: true,
  })
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy()
  await page.goto(`/admin?post=${id}`)
  await expect(
    page.getByRole("textbox", { name: "Post title", exact: true }),
  ).toBeVisible()
  await expect(
    page.getByRole("complementary", { name: "Post inspector" }),
  ).toHaveCount(0)
  await page.screenshot({
    path: "test-results/editor-mobile.png",
    fullPage: true,
  })
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy()
  await page.getByRole("button", { name: "Toggle post details" }).click()
  await expect(page.getByLabel("Website address")).toBeVisible()
  await page
    .getByRole("button", { name: "Close inspector", exact: true })
    .click()
  await page.goto("/writing/an-idea-becomes-a-story")
  await expect(
    page.getByRole("heading", { name: "An idea becomes a story" }),
  ).toBeVisible()
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy()
  await expect(page.getByText("The stale tab’s unsaved writing.")).toHaveCount(
    0,
  )
})
