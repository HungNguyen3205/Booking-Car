const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });

  // 1. Desktop 1440x900
  {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.resolve('docs/screenshots/step2_desktop_1440x900.png') });
    console.log('Saved step2_desktop_1440x900.png');

    // Test dropdown opening to ensure no overflow clipping
    try {
      const fromInput = await page.$('#hero-search button, #hero-search [role="button"], #hero-search input');
      if (fromInput) {
        await fromInput.click();
        await page.waitForTimeout(500);
        await page.screenshot({ path: path.resolve('docs/screenshots/step2_dropdown_check_1440x900.png') });
        console.log('Saved step2_dropdown_check_1440x900.png');
      }
    } catch (e) {
      console.log('Dropdown test note:', e.message);
    }
    await page.close();
  }

  // 2. Desktop 1280x800
  {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.resolve('docs/screenshots/step2_desktop_1280x800.png') });
    console.log('Saved step2_desktop_1280x800.png');
    await page.close();
  }

  await browser.close();
  console.log('Step 2 capture complete.');
})();
