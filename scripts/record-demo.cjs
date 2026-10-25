const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function record() {
  const videoDir = path.resolve(__dirname, '../docs/videos');
  if (!fs.existsSync(videoDir)) fs.mkdirSync(videoDir, { recursive: true });

  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    recordVideo: {
      dir: videoDir,
      size: { width: 1440, height: 900 },
    },
  });

  const page = await context.newPage();
  await page.goto('http://localhost:5173');
  await page.waitForTimeout(1500);

  console.log('1. Switching to Limousine...');
  const limoButton = page.locator('button:has-text("Limousine")');
  await limoButton.click();
  await page.waitForTimeout(2200);

  console.log('2. Switching to Cabin VIP...');
  const cabinButton = page.locator('button:has-text("Cabin VIP")');
  await cabinButton.click();
  await page.waitForTimeout(2200);

  console.log('3. Returning to Giường nằm...');
  const sleeperButton = page.locator('button:has-text("Giường nằm")');
  await sleeperButton.click();
  await page.waitForTimeout(2200);

  console.log('4. Testing rapid consecutive clicks (spam clicking)...');
  await limoButton.click();
  await page.waitForTimeout(120);
  await cabinButton.click();
  await page.waitForTimeout(120);
  await sleeperButton.click();
  await page.waitForTimeout(2800);

  console.log('5. Clicking active Giường nằm button (should be no-op)...');
  await sleeperButton.click();
  await page.waitForTimeout(1200);

  await context.close();
  await browser.close();
  console.log('Video recording successfully completed in:', videoDir);
}

record().catch((err) => {
  console.error(err);
  process.exit(1);
});
