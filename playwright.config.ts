import { defineConfig } from "@playwright/test";
import { existsSync } from "node:fs";
const edge = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
export default defineConfig({
  testDir: "./src/tests/browser",
  workers: 1,
  fullyParallel: false,
  timeout: 180000,
  reporter: [["list"], ["json", { outputFile: "audit/browser-results.json" }]],
  use: {
    baseURL: "http://127.0.0.1:3100",
    headless: true,
    viewport: { width: 1440, height: 1000 },
    launchOptions: existsSync(edge) ? { executablePath: edge } : {},
  },
  webServer: {
    command:
      "node scripts/init-db.mjs && node node_modules/next/dist/bin/next start --hostname 127.0.0.1 -p 3100",
    url: "http://127.0.0.1:3100",
    reuseExistingServer: false,
    timeout: 120000,
    env: { DATABASE_URL: `file:./browser-${Date.now()}.db` },
  },
});
