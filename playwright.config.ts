import {defineConfig, devices} from "@playwright/test";

export default defineConfig({
  testMatch: /\.e2e\.ts$/,
  fullyParallel: true,
  projects: [
    {name: "chromium", use: devices["Desktop Chrome"]},
    {name: "firefox", use: devices["Desktop Firefox"]},
    {name: "webkit", use: devices["Desktop Safari"]},
  ],
});
