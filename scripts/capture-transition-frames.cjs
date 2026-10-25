const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ channel: 'msedge' });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  const outDir = path.resolve('docs/screenshots/motion_demo');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  // 1. Initial State
  await page.screenshot({ path: path.join(outDir, '01_sleeper_idle.png') });
  console.log('Saved 01_sleeper_idle.png');

  // 2. Click Limousine and capture mid-exit
  await page.locator('button:has-text("Limousine")').first().click();
  await page.waitForTimeout(200); // 200ms into transition (sleeper is accelerating out to right)
  await page.screenshot({ path: path.join(outDir, '02_sleeper_exiting_right.png') });
  console.log('Saved 02_sleeper_exiting_right.png');

  // 3. Capture mid-entry (around 650ms, limousine is entering from left)
  await page.waitForTimeout(450); // total 650ms
  await page.screenshot({ path: path.join(outDir, '03_limousine_entering_left.png') });
  console.log('Saved 03_limousine_entering_left.png');

  // 4. Limousine fully settled
  await page.waitForTimeout(500); // total 1150ms
  await page.screenshot({ path: path.join(outDir, '04_limousine_settled.png') });
  console.log('Saved 04_limousine_settled.png');

  // 5. Click Cabin VIP and capture transition
  await page.locator('button:has-text("Cabin VIP")').first().click();
  await page.waitForTimeout(200);
  await page.screenshot({ path: path.join(outDir, '05_limousine_exiting_right.png') });
  console.log('Saved 05_limousine_exiting_right.png');

  await page.waitForTimeout(450);
  await page.screenshot({ path: path.join(outDir, '06_cabin_entering_left.png') });
  console.log('Saved 06_cabin_entering_left.png');

  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(outDir, '07_cabin_settled.png') });
  console.log('Saved 07_cabin_settled.png');

  await browser.close();
  console.log('All motion phase screenshots captured successfully in:', outDir);
})();
