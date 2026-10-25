const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ channel: 'msedge' });

  // 1. Desktop Sleeper (default Da Nang -> Hoi An)
  {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: 'docs/screenshots/hero_review_desktop_sleeper.png' });
    
    // 2. Click Limousine
    await page.locator('button:has-text("Limousine")').first().click();
    await page.waitForTimeout(800);
    await page.screenshot({ path: 'docs/screenshots/hero_review_desktop_limousine.png' });

    // 3. Click Cabin VIP
    await page.locator('button:has-text("Cabin VIP")').first().click();
    await page.waitForTimeout(800);
    await page.screenshot({ path: 'docs/screenshots/hero_review_desktop_cabin.png' });

    await page.close();
  }

  // 4. Mobile 390x844
  {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1200);
    await page.screenshot({ path: 'docs/screenshots/hero_review_mobile_390px.png' });

    await page.locator('button:has-text("Limousine")').first().click();
    await page.waitForTimeout(600);
    await page.screenshot({ path: 'docs/screenshots/hero_review_mobile_limousine.png' });

    await page.locator('button:has-text("Cabin VIP")').first().click();
    await page.waitForTimeout(600);
    await page.screenshot({ path: 'docs/screenshots/hero_review_mobile_cabin.png' });

    await page.close();
  }

  // 5. Desktop Hue route
  {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto('http://localhost:5173?from=Đà%20Nẵng&to=Huế', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: 'docs/screenshots/hero_review_desktop_hue.png' });
    await page.close();
  }

  await browser.close();
  console.log('All review screenshots captured successfully!');
})();
