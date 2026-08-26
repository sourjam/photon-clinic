import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/smoke",
  timeout: 45_000,
  use: {
    baseURL: process.env.SMOKE_BASE_URL ?? "http://localhost:3000",
  },
  reporter: [["list"]],
});
