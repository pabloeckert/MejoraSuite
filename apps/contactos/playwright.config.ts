import { defineConfig, devices } from "@playwright/test";

const PORT = process.env.CI ? 4173 : 8080;
const BASE_URL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI ? "github" : "list",
  timeout: 30000,

  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  webServer: {
    command: process.env.CI ? "npx vite preview --port 4173" : "npm run dev",
    port: PORT,
    reuseExistingServer: !process.env.CI,
    timeout: process.env.CI ? 30000 : 15000,
  },
});
