import { defineConfig, devices } from "@playwright/test";

const localBaseURL = "http://127.0.0.1:4191";
const externalBaseURL = process.env.PLAYWRIGHT_BASE_URL;
const browserCompatTests = /browser-compat\.spec\.ts/;

export default defineConfig({
  testDir: "e2e",
  timeout: externalBaseURL ? 120_000 : 90_000,
  fullyParallel: true,
  workers: externalBaseURL ? 2 : 4,
  retries: 0,
  reporter: "line",
  webServer: externalBaseURL
    ? undefined
    : {
        command: "npm.cmd run preview -- --host 127.0.0.1 --port 4191 --strictPort",
        url: localBaseURL,
        reuseExistingServer: true,
        timeout: 120_000,
      },
  use: {
    baseURL: externalBaseURL || localBaseURL,
    bypassCSP: !externalBaseURL,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "compat-firefox-desktop",
      testMatch: browserCompatTests,
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "compat-webkit-desktop",
      testMatch: browserCompatTests,
      use: { ...devices["Desktop Safari"] },
    },
    {
      name: "compat-android-chrome",
      testMatch: browserCompatTests,
      use: { ...devices["Pixel 7"] },
    },
    {
      name: "compat-iphone-safari",
      testMatch: browserCompatTests,
      use: { ...devices["iPhone 14"] },
    },
  ],
});
