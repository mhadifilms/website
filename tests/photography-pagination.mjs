import { expect } from "@playwright/test"

export async function expectPhotographyPages(page, hidden = []) {
  const folder = page.locator(".archive-library")
  const rows = folder.locator(".archive-library-entry")
  const navigation = folder.getByRole("navigation", { name: "Pages (top)" })
  await expect(folder.locator(".archive-library-header")).toContainText("12 collections")
  await expect(navigation.getByRole("combobox")).toHaveValue("1")
  const paths = new Set()
  for (const number of [1, 2]) {
    await expect(rows).toHaveCount(6)
    await expect(navigation.getByRole("combobox")).toHaveValue(String(number))
    for (const href of await rows.evaluateAll(items => items.map(item => item.getAttribute("href")))) {
      expect(paths.has(href)).toBe(false)
      expect(hidden.some(slug => href.endsWith(`/${slug}`))).toBe(false)
      paths.add(href)
    }
    if (number === 1) await navigation.getByRole("button", { name: "Next" }).click()
  }
  expect(paths.size).toBe(12)
  await expect(navigation.getByRole("button", { name: "Next" })).toBeDisabled()
  await navigation.getByRole("button", { name: "Previous" }).click()
  await expect(navigation.getByRole("combobox")).toHaveValue("1")
  await expect(rows).toHaveCount(6)
}
