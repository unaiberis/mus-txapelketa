// NOTE: These tests are intended to be executed by the MCP Playwright agent only.
// Do NOT run locally with `npx playwright test` per project policy.

import { test, expect } from '@playwright/test';

test('Mesa badges appear for first-round matches', async ({ page }) => {
  // Navigate to app root (MCP should start the dev server beforehand via `npm run dev`)
  await page.goto('/');

  // Click the "Create Random Bracket" button to generate a bracket and first-round matches
  await page.click('text=Create Random Bracket');

  // Wait for at least one mesa badge to appear
  await page.waitForSelector('.mesa-badge', { timeout: 5000 });

  const badges = await page.$$eval('.mesa-badge', els => els.map(e => e.textContent?.trim()));
  expect(badges.length).toBeGreaterThan(0);
  // First badge should indicate table 1 (localized text may vary; basic check for digit)
  expect(badges[0]).toMatch(/\d+/);
});