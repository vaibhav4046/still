import path from "node:path";
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: path.join(__dirname, "e2e"),
  timeout: 60_000,
  workers: process.env.CI ? 2 : 1,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:3100",
    trace: "retain-on-failure",
    ...devices["Desktop Chrome"],
  },
  webServer: [
    {
      command: "node scripts/start-e2e-api.mjs",
      cwd: "../..",
      url: "http://127.0.0.1:8788/health",
      timeout: 120_000,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: "npm run dev -- --hostname 127.0.0.1 --port 3100",
      cwd: ".",
      env: {
        NEXT_PUBLIC_STILL_API_URL: "http://127.0.0.1:8788",
      },
      url: "http://127.0.0.1:3100/book",
      timeout: 120_000,
      reuseExistingServer: !process.env.CI,
    },
  ],
});
