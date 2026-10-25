import { defineConfig } from "@playwright/test";
import { existsSync } from "node:fs";
const chrome = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
export default defineConfig({
  testDir: "./tests/browser", workers: 1, timeout: 60_000,
  use: { baseURL: "http://localhost:3100", headless: true, launchOptions: existsSync(chrome) ? { executablePath: chrome } : {}, trace: "retain-on-failure" },
  reporter: [["list"], ["html", { open: "never" }]]
});
