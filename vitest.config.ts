import {playwright} from "@vitest/browser-playwright";
import {defineConfig} from "vitest/config";
import {frontend} from "vitest-config-silverwind";

export default defineConfig(frontend({
  url: import.meta.url,
  test: {
    browser: {
      enabled: true,
      headless: true,
      screenshotFailures: false,
      provider: playwright(),
      instances: [
        {browser: "chromium"},
        {browser: "firefox"},
        {browser: "webkit"},
      ],
    },
  },
}));
