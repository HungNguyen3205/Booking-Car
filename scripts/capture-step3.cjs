const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });

  // 1. Desktop 1440x900 - Sleeper Coach
  {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.resolve('docs/screenshots/step3_desktop_1440x900_sleeper.png') });
    console.log('Saved step3_desktop_1440x900_sleeper.png');

    // Switch to Limousine
    try {
      const limoBtn = page.getByRole('button', { name: 'Limousine', exact: true });
      if (await limoBtn.count() > 0) {
        await limoBtn.click();
        await page.waitForTimeout(1000);
        await page.screenshot({ path: path.resolve('docs/screenshots/step3_desktop_1440x900_limousine.png') });
        console.log('Saved step3_desktop_1440x900_limousine.png');
      }
    } catch (e) {
      console.log('Limousine switch error:', e.message);
    }

    // Switch to Cabin VIP
    try {
      const cabinBtn = page.getByRole('button', { name: 'Cabin VIP', exact: true });
      if (await cabinBtn.count() > 0) {
        await cabinBtn.click();
        await page.waitForTimeout(1000);
        await page.screenshot({ path: path.resolve('docs/screenshots/step3_desktop_1440x900_cabin.png') });
        console.log('Saved step3_desktop_1440x900_cabin.png');
      }
    } catch (e) {
      console.log('Cabin switch error:', e.message);
    }

    await page.close();
  }

  // 2. Desktop 1280x800 - Proportions and scaling check
  {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.resolve('docs/screenshots/step3_desktop_1280x800.png') });
    console.log('Saved step3_desktop_1280x800.png');
    await page.close();
  }

  await browser.close();
  console.log('Step 3 capture complete.');
})();
