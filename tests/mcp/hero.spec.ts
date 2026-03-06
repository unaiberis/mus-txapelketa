import { test, expect } from '@playwright/test';

const BASE = process.env.BASE_URL || 'http://localhost:4321';

test.describe('Hero visual test', () => {
  test('Homepage hero renders and is accessible', async ({ page }) => {
    await page.goto(`${BASE}/`);
    await page.waitForSelector('#hero-title', { timeout: 7000 });
    const title = await page.$('#hero-title');
    expect(title).toBeTruthy();

    const region = await page.$('section[role="region"][aria-labelledby="hero-title"]');
    expect(region).toBeTruthy();

    // Capture only the hero region to avoid full-page screenshot issues
    const regionEl = await page.$('section[role="region"][aria-labelledby="hero-title"]');
    const shot = regionEl ? await regionEl.screenshot() : await page.screenshot();
    expect(shot).toMatchSnapshot('hero-homepage.png');
  });
});
