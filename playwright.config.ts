import { defineConfig } from '@playwright/test';

// Playwright config intended for MCP Playwright agent runs only.
export default defineConfig({
  testDir: 'tests/mcp',
  timeout: 30_000,
  expect: { timeout: 5000 },
  retries: 0,
  use: {
    baseURL: 'http://localhost:3000',
    headless: true,
    viewport: { width: 1280, height: 720 },
  },
});