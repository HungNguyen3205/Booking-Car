const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });

  // 1. Desktop 1440x900
  {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.resolve('docs/screenshots/step1_current_desktop_1440x900.png') });
    console.log('Saved step1_current_desktop_1440x900.png');
    await page.close();
  }

  // 2. Mobile 390x844
  {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.resolve('docs/screenshots/step1_current_mobile_390px.png') });
    console.log('Saved step1_current_mobile_390px.png');
    await page.close();
  }

  await browser.close();
  console.log('Step 1 baseline capture complete.');
})();
