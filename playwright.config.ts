import { defineConfig } from "@playwright/test"
export default defineConfig({
  testDir: "./tests/browser",
  fullyParallel: false,
  workers: 1,
  timeout: 45000,
  use: {
    baseURL: "http://localhost:5180",
    browserName: "chromium",
    channel: process.env.CI ? undefined : "chrome",
    headless: true,
    viewport: { width: 1440, height: 1000 },
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: [
    {
      command: "node scripts/serve-cms-test.mjs",
      url: "http://127.0.0.1:8790/api/health",
      reuseExistingServer: false,
    },
    {
      command: "CMS_TEST_PROXY=1 npx vite --port 5180",
      url: "http://localhost:5180",
      reuseExistingServer: false,
    },
  ],
})
