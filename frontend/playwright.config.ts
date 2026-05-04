import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  retries: 0,
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  webServer: [
    {
      command: "cd ../backend && .venv/bin/uvicorn app.main:app --port 8000",
      url: "http://localhost:8000/health",
      reuseExistingServer: true,
      timeout: 30000,
    },
    {
      command: "npm run dev",
      url: "http://localhost:3000",
      reuseExistingServer: true,
      timeout: 120000,
    },
  ],
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        launchOptions: {
          executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
        },
      },
    },
  ],
});
