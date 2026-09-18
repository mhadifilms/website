import { test } from "node:test"
import assert from "node:assert/strict"
import { contentYear, formatContentDate } from "../src/lib/content-date.ts"

test("calendar dates retain their day and year across reader timezones", () => {
  const original = process.env.TZ
  try {
    for (const timezone of ["America/Los_Angeles", "Pacific/Honolulu", "Asia/Tokyo"]) {
      process.env.TZ = timezone
      assert.equal(formatContentDate("2026-05-16", "en-US"), "May 16, 2026")
      assert.equal(formatContentDate("2025-01-01", "en-US"), "Jan 1, 2025")
      assert.equal(contentYear("2025-01-01"), 2025)
    }
    process.env.TZ = "America/Los_Angeles"
    assert.equal(formatContentDate("2025-01-01T01:00:00Z", "en-US"), "Dec 31, 2024")
    assert.equal(contentYear("2025-01-01T01:00:00Z"), 2024)
  } finally {
    if (original === undefined) delete process.env.TZ
    else process.env.TZ = original
  }
})
