/* Run after npm run build. Optional PLAYWRIGHT_CHROMIUM_EXECUTABLE and
   JOURNEY_QA_DIR support CI or a locally installed Chromium. No remote writes. */
const { chromium } = require('playwright');
const { spawn } = require('node:child_process');
const { mkdirSync, writeFileSync } = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const out = process.env.JOURNEY_QA_DIR || path.join(root, 'test-results', 'journey');
mkdirSync(out, { recursive: true });
const base = 'http://127.0.0.1:5198';
const server = spawn(process.execPath, [path.join(root, 'node_modules/vite/bin/vite.js'), 'preview', '--host', '127.0.0.1', '--port', '5198', '--strictPort'], { cwd: root, stdio: 'ignore' });
let browser;
const results = [];
const check = (name, value = true) => { assert.ok(value, name); results.push(name); };
const scene = (p) => p.locator('.danava-go-hero');
const vehicle = (p) => scene(p).locator('[data-vehicle]');
const matrix = (p) => vehicle(p).evaluate((el) => { const m = new DOMMatrix(getComputedStyle(el).transform); return { scale: m.a, x: m.e, y: m.f, origin: getComputedStyle(el).transformOrigin }; });
async function choose(p, field, city) {
  await p.locator(`#search-${field}`).click();
  await p.locator(`#search-${field}-list [role=option]`).filter({ has: p.getByText(city, { exact: true }) }).click();
}
(async () => {
  try {
    for (let i = 0; i < 100; i++) { try { if ((await fetch(base)).ok) break; } catch {} await new Promise(r => setTimeout(r, 100)); }
    browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || undefined, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
    const errors = [];
    const p = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: 'no-preference' });
    p.on('pageerror', e => errors.push(e.message));
    await p.goto(`${base}/?from=Đà%20Nẵng&to=Hội%20An`, { waitUntil: 'domcontentloaded' });
    await vehicle(p).waitFor();
    const first = await matrix(p);
    await p.screenshot({ path: path.join(out, 'intro-near-start.png') });
    await p.waitForTimeout(500);
    const middle = await matrix(p);
    await p.screenshot({ path: path.join(out, 'intro-middle.png') });
    await p.waitForTimeout(1500);
    const last = await matrix(p);
    check('Bus grows and moves down/right along the near lane', first.scale < middle.scale && middle.scale <= last.scale && first.x < last.x && first.y < last.y);
    check('Bus settles at its measured wheel anchor', Math.abs(last.scale - 1) < .001 && Math.abs(last.x - 1000) < .1 && Math.abs(last.y - 785) < .1 && last.origin === '0px 0px');
    await p.screenshot({ path: path.join(out, 'desktop-1440.png') });
    await p.locator('[data-testid=journey-fixed-road]').evaluate(el => { window.journeyRoadBefore = el; });
    const roadBox = () => p.locator('[data-testid=journey-fixed-road]').evaluate(el => { const r = el.getBoundingClientRect(), stage = el.closest('[data-testid=danava-go-stage-scaffold]').getBoundingClientRect(); return { x: r.x - stage.x, y: r.y - stage.y, width: r.width, height: r.height }; });
    const roadBefore = await roadBox();
    await p.locator('#search-date').fill('2026-11-15');
    await p.locator('#search-passengers').click(); await p.getByRole('option', { name: '3 người', exact: true }).click();
    const tabs = scene(p).getByRole('group', { name: 'Chọn dòng xe trải nghiệm' });
    for (const name of ['Limousine', 'Cabin VIP', 'Giường nằm', 'Cabin VIP']) {
      await tabs.getByRole('button', { name, exact: true }).click(); await p.waitForTimeout(60);
    }
    let maxVisible = 0;
    for (let i = 0; i < 24; i++) { maxVisible = Math.max(maxVisible, await vehicle(p).count()); await p.waitForTimeout(100); }
    check('Rapid vehicle switches show only one bus', maxVisible === 1);
    check('Last selected vehicle wins', await vehicle(p).getAttribute('data-vehicle') === 'cabin');
    await choose(p, 'to', 'Huế'); await choose(p, 'to', 'Nha Trang'); await choose(p, 'to', 'Hội An');
    await p.waitForTimeout(2400);
    check('Last selected destination wins', await p.locator('[data-landmark-slot=destination]').getAttribute('data-city') === 'hoi-an');
    await p.getByRole('button', { name: 'Đổi nơi đi và nơi đến', exact: true }).click();
    await p.waitForTimeout(2300);
    check('Reverse moves origin left and destination right without mirroring architecture', await p.locator('[data-landmark-slot=origin]').getAttribute('data-city') === 'hoi-an' && await p.locator('[data-landmark-slot=destination]').getAttribute('data-city') === 'da-nang');
    check('Road is the same DOM node after route/vehicle switches', await p.locator('[data-testid=journey-fixed-road]').evaluate(el => window.journeyRoadBefore === el));
    assert.deepEqual(await roadBox(), roadBefore); results.push('Road position and dimensions stay fixed');
    check('Date and passenger count survive all switches', await p.locator('#search-date').inputValue() === '2026-11-15' && (await p.locator('#search-passengers').innerText()).includes('3 người'));
    await choose(p, 'from', 'Đà Nẵng'); await choose(p, 'to', 'Huế');
    await p.waitForTimeout(2300); await p.screenshot({ path: path.join(out, 'desktop-hue.png') });
    await p.setViewportSize({ width: 1280, height: 800 }); await p.waitForTimeout(200);
    check('1280px has no horizontal overflow', await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await p.screenshot({ path: path.join(out, 'desktop-1280.png') });
    await p.setViewportSize({ width: 390, height: 844 }); await p.waitForTimeout(200);
    check('390px has one scene and no horizontal overflow', await p.locator('[data-testid=danava-go-stage-scaffold]').count() === 1 && await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await scene(p).screenshot({ path: path.join(out, 'mobile-390.png') });
    await p.locator('#search-from').click();
    const option = p.locator('#search-from-list [role=option]').first();
    await option.click(); check('Mobile dropdown remains clickable outside scene bounds');
    await p.emulateMedia({ reducedMotion: 'reduce' });
    await tabs.getByRole('button', { name: 'Limousine', exact: true }).click();
    await p.waitForTimeout(150);
    check('Reduced motion commits final vehicle directly', await vehicle(p).getAttribute('data-vehicle') === 'limousine' && Math.abs((await matrix(p)).scale - 1) < .001);
    await choose(p, 'to', 'Đà Lạt'); await p.waitForTimeout(150);
    check('Unsupported city uses neutral terrain with its own name', await p.locator('[data-landmark-slot=destination]').getAttribute('data-city') === 'đà lạt' && (await p.locator('[data-landmark-slot=destination]').innerText()).includes('Miền đất mới'));
    // Error paths: block a fresh image request, not an already-decoded cache hit.
    const failed = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
    failed.on('pageerror', e => errors.push(e.message));
    await failed.route('**/journey_landmarks_atlas.webp', r => r.abort());
    await failed.route('**/bus_cabin_right.png', r => r.abort());
    await failed.goto(`${base}/?from=Đà%20Nẵng&to=Huế`, { waitUntil: 'domcontentloaded' }); await failed.waitForTimeout(600);
    check('Failed landmark shows neutral fallback, never another city', (await failed.locator('[data-landmark-slot=destination]').innerText()).includes('Miền đất mới'));
    await scene(failed).getByRole('button', { name: 'Cabin VIP', exact: true }).click(); await failed.waitForTimeout(300);
    check('Failed vehicle retains previous vehicle and reports error', await vehicle(failed).getAttribute('data-vehicle') === 'sleeper' && await scene(failed).getByRole('status').count() === 1);
    await failed.close();
    // Booking smoke checks use the existing flow and do not change its code.
    await p.setViewportSize({ width: 1440, height: 900 });
    await choose(p, 'from', 'Đà Nẵng'); await choose(p, 'to', 'Huế');
    await p.locator('#search-passengers').click(); await p.getByRole('option', { name: '1 người', exact: true }).click();
    await scene(p).getByRole('button', { name: 'Tìm chuyến', exact: true }).click();
    await p.getByRole('button', { name: /Chọn chuyến đi lúc/ }).first().click();
    await p.getByText('Tiếp tục điền thông tin', { exact: true }).waitFor();
    check('Search still opens the existing seat-selection flow');
    await p.getByRole('checkbox', { name: /Ghế .*Còn trống/ }).first().click();
    await p.getByRole('button', { name: 'Tiếp tục điền thông tin', exact: true }).click();
    await p.locator('#passenger-name').fill('Nguyễn Kiểm Thử');
    await p.locator('#passenger-phone').fill('0905123456');
    await p.locator('#passenger-email').fill('qa@example.com');
    await p.locator('input[name=pickupStop]').first().check();
    await p.locator('input[name=dropoffStop]').first().check();
    await p.getByRole('checkbox').check();
    await p.getByRole('button', { name: 'Chuyển sang thanh toán', exact: true }).click();
    await p.getByRole('button', { name: /Xác nhận thanh toán mô phỏng|Xác nhận nhận vé/ }).click();
    await p.getByRole('button', { name: 'Lưu vé / In PDF', exact: true }).waitFor();
    check('Existing passenger, demo payment, and ticket issuance flow completes');
    const empty = await browser.newPage({ reducedMotion: 'reduce' });
    await empty.goto(`${base}/?step=search&from=Đà%20Lạt&to=Huế`);
    await empty.getByText(/hiện chưa có lịch trình xe khách/).waitFor();
    check('Unsupported trip search stays empty without route fallback');
    await empty.close();
    check('No browser runtime errors', errors.length === 0);
    writeFileSync(path.join(out, 'results.json'), JSON.stringify({ results, first, middle, last, errors }, null, 2));
    console.log(JSON.stringify({ passed: results.length, results, out }, null, 2));
  } finally { if (browser) await browser.close(); server.kill(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
