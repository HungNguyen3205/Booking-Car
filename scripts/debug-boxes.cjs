const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('http://localhost:5173');
  await page.waitForTimeout(1000);
  const bbox = await page.locator('.journey-landmark-origin').boundingBox();
  const labelBbox = await page.locator('.journey-landmark-origin .journey-landmark-label').boundingBox();
  console.log('Origin landmark bbox:', bbox);
  console.log('Origin label bbox:', labelBbox);
  const tabsBbox = await page.locator('.hero-vehicle-selector').boundingBox();
  console.log('Tabs bbox:', tabsBbox);
  const busBbox = await page.locator('.journey-bus').boundingBox();
  console.log('Bus bbox:', busBbox);
  await browser.close();
})();
