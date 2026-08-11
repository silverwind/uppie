import {playwright} from "@vitest/browser-playwright";
import {defineConfig} from "vitest/config";
import {browser} from "vitest-config-silverwind";

export default defineConfig(browser({
  url: import.meta.url,
  test: {
    browser: {
      provider: playwright(),
      instances: [
        {browser: "chromium"},
        {browser: "firefox"},
        {browser: "webkit"},
      ],
    },
  },
}));
