import { defineConfig, devices } from "@playwright/test";

const configuredPort = Number(process.env.PLAYWRIGHT_PORT || "4191");
const localPort = Number.isFinite(configuredPort) && configuredPort > 0 ? Math.floor(configuredPort) : 4191;
const localBaseURL = `http://127.0.0.1:${localPort}`;
const externalBaseURL = process.env.PLAYWRIGHT_BASE_URL;
const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
const chromiumChannel = process.env.PLAYWRIGHT_CHROMIUM_CHANNEL;
const browserCompatTests = /browser-compat\.spec\.ts/;
const configuredWorkers = Number(process.env.PLAYWRIGHT_WORKERS || "1");
const localWorkers = Number.isFinite(configuredWorkers) && configuredWorkers > 0 ? Math.floor(configuredWorkers) : 1;
const reuseExistingServer = process.env.PLAYWRIGHT_REUSE_SERVER === "1" || process.env.PLAYWRIGHT_REUSE_SERVER === "true";

export default defineConfig({
  testDir: "e2e",
  timeout: externalBaseURL ? 120_000 : 90_000,
  fullyParallel: false,
  workers: externalBaseURL ? 1 : localWorkers,
  retries: 0,
  reporter: "line",
  webServer: externalBaseURL
    ? undefined
    : {
        command: `${npmCommand} run preview -- --host 127.0.0.1 --port ${localPort} --strictPort`,
        url: localBaseURL,
        reuseExistingServer,
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
      use: { ...devices["Desktop Chrome"], ...(chromiumChannel ? { channel: chromiumChannel } : {}) },
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
