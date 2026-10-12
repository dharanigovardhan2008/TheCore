import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import fs from 'fs';

test.describe('Axe and Screenshots', () => {
  const viewports = [
    { width: 360, height: 800 },
    { width: 768, height: 1024 },
    { width: 1280, height: 800 },
    { width: 1920, height: 1080 }
  ];
  
  const pages = [
    { name: 'home', path: '/' },
    { name: 'privacy', path: '/privacy' },
    { name: 'terms', path: '/terms' },
    { name: 'cookies', path: '/cookies' }
  ];

  for (const pageInfo of pages) {
    test(`Check ${pageInfo.name}`, async ({ page }) => {
      // First ensure the server is responding
      let res;
      try {
        res = await page.goto(`http://localhost:3000${pageInfo.path}`);
      } catch (e) {
        console.error('Failed to load page. Is the server running?', e);
        return;
      }
      if (res?.status() === 404) {
        console.log(`Page ${pageInfo.path} returned 404. Skipping.`);
        return;
      }

      for (const theme of ['light', 'dark'] as const) {
        // Mock prefers-color-scheme
        await page.emulateMedia({ colorScheme: theme });
        // Force Next.js theme if possible (or reload)
        await page.evaluate((t) => {
          if (t === 'dark') document.documentElement.classList.add('dark');
          else document.documentElement.classList.remove('dark');
        }, theme);

        for (const viewport of viewports) {
          await page.setViewportSize(viewport);
          // Wait for layout to settle
          await page.waitForTimeout(500);

          // Screenshot
          const filename = `audit/screenshots/${pageInfo.name}_${theme}_${viewport.width}x${viewport.height}.png`;
          await page.screenshot({ path: filename, fullPage: true });

          // Check horizontal scroll
          const hasScroll = await page.evaluate(() => {
            return document.documentElement.scrollWidth > document.documentElement.clientWidth;
          });
          if (hasScroll) {
             console.log(`WARN: Horizontal scroll detected on ${pageInfo.name} at ${viewport.width}x${viewport.height} (${theme})`);
          }
        }
        
        // Axe Accessibility Check
        try {
          const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
          if (accessibilityScanResults.violations.length > 0) {
            console.log(`Axe violations on ${pageInfo.name} (${theme}):`, accessibilityScanResults.violations.length);
          } else {
            console.log(`Axe passed on ${pageInfo.name} (${theme})`);
          }
        } catch (e) {
          console.error(`Axe failed on ${pageInfo.name}`, e);
        }
      }
    });
  }
});

