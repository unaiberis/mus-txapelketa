import { test, expect } from '@playwright/test';

const BASE = process.env.BASE_URL || 'http://localhost:4321';

test.describe('Visual smoke tests', () => {
  test('Homepage renders main board', async ({ page }) => {
    await page.goto(`${BASE}/`);
    await page.waitForSelector('.card-board', { timeout: 7000 });
    const el = await page.$('.card-board');
    expect(el).toBeTruthy();
    // Capture and compare screenshot to baseline
    const shot = await page.screenshot({ fullPage: true });
    expect(shot).toMatchSnapshot('homepage.png');
  });

  test('Koadroa page renders bracket viewer', async ({ page }) => {
    await page.goto(`${BASE}/koadroa/`);
    await page.waitForSelector('#brackets-viewer-wrapper', { timeout: 7000 });
    const wrapper = await page.$('#brackets-viewer-wrapper');
    expect(wrapper).toBeTruthy();
    const shot = await page.screenshot({ fullPage: true });
    expect(shot).toMatchSnapshot('koadroa.png');
  });
});
