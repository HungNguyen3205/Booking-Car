import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({
    channel: 'msedge',
    args: ['--enable-webgl', '--ignore-gpu-blocklist']
  });
  const results = {};

  try {
    // 1. Desktop 1440x900
    {
      const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
      await page.addInitScript(() => sessionStorage.setItem('danava_go_intro_played', 'true'));
      await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
      await page.waitForTimeout(2000);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
      results.desktop1440 = { hasOverflow: overflow };
      await page.screenshot({ path: 'docs/screenshots/step2_danava_coach_1440x900.png' });
      await page.close();
    }

    // 2. Desktop 1280x800
    {
      const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
      await page.addInitScript(() => sessionStorage.setItem('danava_go_intro_played', 'true'));
      await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
      await page.waitForTimeout(1800);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
      results.desktop1280 = { hasOverflow: overflow };
      await page.screenshot({ path: 'docs/screenshots/step2_danava_coach_1280x800.png' });
      await page.close();
    }

    // 3. Mobile 390x844
    {
      const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
      await page.addInitScript(() => sessionStorage.setItem('danava_go_intro_played', 'true'));
      await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
      await page.waitForTimeout(1800);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
      results.mobile390 = { hasOverflow: overflow };
      await page.screenshot({ path: 'docs/screenshots/step2_danava_coach_390px.png' });
      await page.close();
    }

    // 4. Vehicle Tab Switch Regression Check (Sleeper -> Limousine -> Cabin VIP)
    {
      const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
      await page.addInitScript(() => sessionStorage.setItem('danava_go_intro_played', 'true'));
      await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
      await page.waitForTimeout(1500);

      const errors = [];
      page.on('pageerror', err => errors.push(err.message));

      // Click Limousine
      const limoBtn = page.locator('button:has-text("Limousine")').first();
      await limoBtn.click();
      await page.waitForTimeout(1000);
      const limoBadge = await page.locator('text=LIMOUSINE').first().isVisible();

      // Click Cabin VIP
      const cabinBtn = page.locator('button:has-text("Cabin VIP")').first();
      await cabinBtn.click();
      await page.waitForTimeout(1000);
      const cabinBadge = await page.locator('text=CABIN').first().isVisible();

      // Click back to Giường nằm
      const sleeperBtn = page.locator('button:has-text("Giường nằm")').first();
      await sleeperBtn.click();
      await page.waitForTimeout(1000);
      const sleeperBadge = await page.locator('text=GIƯỜNG NẰM').first().isVisible();

      results.vehicleSwitch = {
        limoBadge,
        cabinBadge,
        sleeperBadge,
        hasNoErrors: errors.length === 0,
        errors
      };
      await page.close();
    }

    // 5. Downstream Booking Flow Regression Check
    {
      const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
      await page.addInitScript(() => sessionStorage.setItem('danava_go_intro_played', 'true'));
      await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
      await page.waitForTimeout(1200);

      const searchBtn = page.locator('button:has-text("Tìm chuyến")').first();
      await searchBtn.click();
      await page.waitForTimeout(1500);

      const currentUrl = page.url();
      const hasResults = await page.locator('text=chuyến').first().isVisible();

      results.downstreamBooking = {
        currentUrl,
        hasResults,
        regressionPassed: currentUrl.includes('step=search') && hasResults
      };
      await page.close();
    }

    console.log('FINAL_STEP2_TEST_RESULTS:', JSON.stringify(results, null, 2));
  } catch (err) {
    console.error('TEST_ERROR:', err);
  } finally {
    await browser.close();
  }
})();
