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
const travelDate = new Date(Date.now() + 20 * 86400000).toISOString().slice(0,10);
const check = (name, value = true) => { assert.ok(value, name); results.push(name); };
const scene = (p) => p.locator('.danava-go-hero');
const vehicle = (p) => scene(p).locator('[data-vehicle]');
const matrix = (p) => vehicle(p).evaluate((el) => { const m = new DOMMatrix(getComputedStyle(el).transform); return { scale: m.a, x: m.e, y: m.f, origin: getComputedStyle(el).transformOrigin, opacity: Number(getComputedStyle(el).opacity) }; });
async function visibleBus(p) {
  return vehicle(p).locator('[data-vehicle-photo]').evaluate(async el => {
    const source = new Image(); source.src = el.getAttribute('href'); await source.decode();
    const canvas = document.createElement('canvas'); canvas.width=source.width;canvas.height=source.height;
    const ctx=canvas.getContext('2d');ctx.drawImage(source,0,0);
    const pixels=ctx.getImageData(0,0,canvas.width,canvas.height).data;
    let left=canvas.width,top=canvas.height,right=0,bottom=0;
    for(let y=0;y<canvas.height;y++)for(let x=0;x<canvas.width;x++)if(pixels[(y*canvas.width+x)*4+3]>24){left=Math.min(left,x);right=Math.max(right,x+1);top=Math.min(top,y);bottom=Math.max(bottom,y+1);}
    const scale=Number(el.getAttribute('width'))/source.width,matrix=el.getScreenCTM();
    const a=new DOMPoint(left*scale,top*scale).matrixTransform(matrix),b=new DOMPoint(right*scale,bottom*scale).matrixTransform(matrix);
    return {left:a.x,top:a.y,right:b.x,bottom:b.y,width:b.x-a.x,center:(a.x+b.x)/2,formTop:document.querySelector('#hero-search form').getBoundingClientRect().top,viewport:innerWidth};
  });
}
async function choose(p, field, city) {
  await p.locator(`#search-${field}`).click();
  await p.locator(`#search-${field}-list [role=option]`).filter({ has: p.getByText(city, { exact: true }) }).click();
}
(async () => {
  try {
    for (let i = 0; i < 100; i++) { try { if ((await fetch(base)).ok) break; } catch {} await new Promise(r => setTimeout(r, 100)); }
    browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || undefined, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
    const errors = [];
    const httpErrors = [];
    const p = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: 'no-preference' });
    p.on('pageerror', e => errors.push(e.message));
    p.on('response', r => { if(r.url().startsWith(base) && r.status() >= 400) httpErrors.push(`${r.status()} ${r.url()}`); });
    await p.goto(`${base}/?from=Đà%20Nẵng&to=Hội%20An`, { waitUntil: 'domcontentloaded' });
    await vehicle(p).waitFor();
    const first = await matrix(p);
    await p.screenshot({ path: path.join(out, 'intro-near-start.png') });
    await p.waitForTimeout(500);
    const middle = await matrix(p);
    await p.screenshot({ path: path.join(out, 'intro-middle.png') });
    await p.waitForTimeout(2500);
    const last = await matrix(p);
    check('Bus grows and moves down/right along the near lane', first.scale < middle.scale && middle.scale <= last.scale && first.x < last.x && first.y < last.y);
    check('Approach becomes opaque early, without a long ghost fade', middle.opacity > .99);
    check('Bus settles at its measured wheel anchor', Math.abs(last.scale - 1) < .001 && Math.abs(last.x - 800) < .1 && Math.abs(last.y - 800) < .1 && last.origin === '0px 0px');
    const layout = await p.evaluate(() => ({ hero: document.querySelector('.danava-go-hero').getBoundingClientRect().toJSON(), form: document.querySelector('#hero-search form').getBoundingClientRect().toJSON(), font:getComputedStyle(document.querySelector('h1')).fontFamily, canvas:document.querySelectorAll('canvas').length, overflow:document.documentElement.scrollWidth > innerWidth }));
    check('Fullscreen hero, sans typography and no WebGL canvas', layout.hero.height >= 900 && layout.hero.width === 1440 && layout.font.includes('Be Vietnam Pro') && layout.canvas === 0 && !layout.overflow);
    check('Full horizontal form fits the first viewport', layout.form.bottom <= 900 && layout.form.width > 1200);
    await p.screenshot({ path: path.join(out, 'desktop-1440.png') });
    await p.locator('[data-testid=journey-fixed-road]').evaluate(el => { window.journeyRoadBefore = el; });
    const roadBox = () => p.locator('[data-testid=journey-fixed-road]').evaluate(el => { const r = el.getBoundingClientRect(), stage = el.closest('[data-testid=danava-go-stage-scaffold]').getBoundingClientRect(); return { x: r.x - stage.x, y: r.y - stage.y, width: r.width, height: r.height }; });
    const roadBefore = await roadBox();
    await p.locator('#search-date').fill(travelDate);
    await p.locator('#search-passengers').click(); await p.getByRole('option', { name: '3 người', exact: true }).click();
    const tabs = scene(p).getByRole('group', { name: 'Chọn dòng xe trải nghiệm' });
    for (const name of ['Limousine', 'Cabin VIP', 'Giường nằm', 'Cabin VIP']) {
      await tabs.getByRole('button', { name, exact: true }).click(); await p.waitForTimeout(60);
    }
    let maxVisible = 0;
    for (let i = 0; i < 32; i++) { maxVisible = Math.max(maxVisible, await vehicle(p).count()); await p.waitForTimeout(100); }
    check('Rapid vehicle switches show only one bus', maxVisible === 1);
    check('Last selected vehicle wins', await vehicle(p).getAttribute('data-vehicle') === 'cabin');
    const visibleWidths=[];
    for (const [label, id] of [['Giường nằm','sleeper'],['Limousine','limousine'],['Cabin VIP','cabin']]) {
      await tabs.getByRole('button',{name:label,exact:true}).click();
      await p.waitForFunction(id => document.querySelector('[data-vehicle]')?.dataset.vehicle === id, id);
      const drive = await p.evaluate(() => new Promise(resolve => {
        const samples=[], started=performance.now(); let last=0;
        const frame = now => {
          const el=document.querySelector('[data-vehicle]');
          if(now-last>45 && el) {
            const m=new DOMMatrix(getComputedStyle(el).transform);
            samples.push({x:m.e,y:m.f,scale:m.a,rear:Number(getComputedStyle(el.querySelector('[data-travel-view="rear-left"]')).opacity)});last=now;
          }
          if(now-started<3000) requestAnimationFrame(frame); else resolve(samples);
        };
        requestAnimationFrame(frame);
      }));
      const steps=drive.slice(1).map((pose,i)=>pose.x-drive[i].x);
      check(`${label} follows the S bend in both horizontal directions`, steps.some(dx=>dx < -1) && steps.some(dx=>dx > 1));
      check(`${label} uses a rear view at the bend and grows toward the camera`, drive.some(pose=>pose.rear>.8) && drive[0].scale<.5 && drive.at(-1).scale>.999);
      check(`${label} stops without an animation loop`, await vehicle(p).getAttribute('data-drive-state')==='parked');
      check(`${label} curved approach settles opaque at full scale`, await vehicle(p).getAttribute('data-vehicle')===id && (await matrix(p)).opacity>.99 && Math.abs((await matrix(p)).scale-1)<.001);
      const box=await visibleBus(p); visibleWidths.push(box.width);
      check(`${label} is centered, correctly sized and clear of form`, Math.abs(box.center-box.viewport/2)<box.viewport*.025 && box.width/box.viewport>.48 && box.width/box.viewport<.53 && box.formTop-box.bottom>=8);
      await p.screenshot({path:path.join(out,`vehicle-${id}.png`)});
    }
    check('All three visible vehicle widths match the sleeper within 1 pixel',Math.max(...visibleWidths)-Math.min(...visibleWidths)<1);
    await vehicle(p).evaluate(el=>window.busBeforeRoute=el);
    await choose(p, 'to', 'Huế'); await choose(p, 'to', 'Nha Trang'); await choose(p, 'to', 'Hội An');
    await p.waitForTimeout(120);
    check('Atlas clips and masks stay unique during crossfade', await p.evaluate(()=>{const ids=[...document.querySelectorAll('.journey-landmark [id]')].map(el=>el.id);return new Set(ids).size===ids.length}));
    let routeStable=true;
    for(let i=0;i<8;i++){const m=await matrix(p);routeStable&&=Math.abs(m.scale-1)<.001&&m.opacity>.99&&await vehicle(p).evaluate(el=>el===window.busBeforeRoute);await p.waitForTimeout(70);}
    check('Route changes preserve the opaque full-size vehicle DOM node throughout',routeStable);
    check('Last selected destination wins', await p.locator('[data-landmark-slot=destination]').getAttribute('data-city') === 'hoi-an');
    await p.getByRole('button', { name: 'Đổi nơi đi và nơi đến', exact: true }).click();
    await p.waitForTimeout(600);
    check('Reverse does not remount or shrink the vehicle',await vehicle(p).evaluate(el=>el===window.busBeforeRoute) && Math.abs((await matrix(p)).scale-1)<.001);
    check('Reverse moves origin left and destination right without mirroring architecture', await p.locator('[data-landmark-slot=origin]').getAttribute('data-city') === 'hoi-an' && await p.locator('[data-landmark-slot=destination]').getAttribute('data-city') === 'da-nang');
    check('Road is the same DOM node after route/vehicle switches', await p.locator('[data-testid=journey-fixed-road]').evaluate(el => window.journeyRoadBefore === el));
    assert.deepEqual(await roadBox(), roadBefore); results.push('Road position and dimensions stay fixed');
    check('Date and passenger count survive all switches', await p.locator('#search-date').inputValue() === travelDate && (await p.locator('#search-passengers').innerText()).includes('3 người'));
    await choose(p, 'from', 'Đà Nẵng'); await choose(p, 'to', 'Huế');
    await p.waitForTimeout(600); await p.screenshot({ path: path.join(out, 'desktop-hue.png') });
    await p.setViewportSize({ width: 1280, height: 800 }); await p.waitForTimeout(200);
    check('Resize keeps the bus at rest', Math.abs((await matrix(p)).scale-1)<.001);
    check('1280px date text is not clipped', await p.locator('[data-search-field=date] .overflow-hidden').evaluate(el=>el.scrollWidth<=el.clientWidth));
    check('1280px has no horizontal overflow', await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await p.screenshot({ path: path.join(out, 'desktop-1280.png') });
    await p.setViewportSize({width:1440,height:760});await p.waitForTimeout(250);
    const wideBox=await visibleBus(p);
    check('Short desktop grows hero without hiding wheels behind form',wideBox.formTop-wideBox.bottom>=8);
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
    await p.emulateMedia({reducedMotion:'no-preference'});await p.waitForTimeout(250);
    check('Turning reduced motion off does not replay intro',Math.abs((await matrix(p)).scale-1)<.001 && (await matrix(p)).opacity>.99);
    await p.emulateMedia({reducedMotion:'reduce'});
    if (process.argv.includes('--hero-only')) {
      check('Hero has no runtime or unexpected HTTP errors', errors.length === 0 && httpErrors.length === 0);
      writeFileSync(path.join(out,'hero-results.json'),JSON.stringify({mode:'hero',results,errors,httpErrors},null,2));
      console.log(JSON.stringify({mode:'hero',passed:results.length,out},null,2));
      return;
    }
    const cities = [['Đà Nẵng','da-nang'],['Hội An','hoi-an'],['Huế','hue'],['Nha Trang','nha-trang'],['TP. Hồ Chí Minh','ho-chi-minh'],['Hà Nội','ha-noi'],['Quy Nhơn','quy-nhon'],['Đà Lạt','da-lat'],['Hải Phòng','hai-phong'],['Cần Thơ','can-tho'],['Đồng Nai','dong-nai'],['Quảng Ninh','quang-ninh'],['Bắc Ninh','bac-ninh']];
    for (const [name,id] of cities) {
      await choose(p, 'to', name); await p.waitForTimeout(300);
      const dest = p.locator('[data-landmark-slot=destination]');
      check(`Destination ${name} has its matching image and label`, await dest.getAttribute('data-city') === id && await dest.locator('image').count() === 1 && await dest.locator('[data-bank-role=destination]').count()===1 && !(await dest.innerText()).includes('Miền đất mới'));
      await p.setViewportSize({ width: 1440, height: 900 }); await p.waitForTimeout(100); await p.evaluate(()=>window.scrollTo(0,0)); await p.waitForTimeout(100); await p.screenshot({path:path.join(out,`location-${id}.png`)});
      await p.getByRole('button', {name:'Đổi nơi đi và nơi đến',exact:true}).click(); await p.waitForTimeout(120);
      check(`Origin ${name} keeps the same architecture after reverse`, await p.locator('[data-landmark-slot=origin]').getAttribute('data-city') === id && await p.locator('[data-landmark-slot=origin] image').count() === 1);
    }
    await p.goto(`${base}/?from=Điểm%20mới&to=Huế`); await p.waitForTimeout(300);
    check('Unknown city uses neutral terrain with its own name', (await p.locator('[data-landmark-slot=origin]').innerText()).includes('Miền đất mới') && await p.locator('[data-landmark-slot=origin] image').count() === 0);
    // Error paths: block a fresh image request, not an already-decoded cache hit.
    const failed = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
    failed.on('pageerror', e => errors.push(e.message));
    await failed.route('**/banks-heritage.webp', r => r.abort());
    await failed.route('**/limousine-premium.webp', r => r.abort());
    await failed.goto(`${base}/?from=Đà%20Nẵng&to=Huế`, { waitUntil: 'domcontentloaded' }); await failed.waitForTimeout(600);
    check('Failed landmark shows neutral fallback, never another city', (await failed.locator('[data-landmark-slot=destination]').innerText()).includes('Miền đất mới'));
    await scene(failed).getByRole('button', { name: 'Limousine', exact: true }).click(); await failed.waitForTimeout(300);
    check('Failed vehicle retains previous vehicle and reports error', await vehicle(failed).getAttribute('data-vehicle') === 'cabin' && await scene(failed).getByRole('status').count() === 1);
    await failed.close();
    const initialFailure = await browser.newPage({reducedMotion:'reduce'});
    await initialFailure.route('**/bus_cabin_right.png',r=>r.abort());
    await initialFailure.goto(base); await initialFailure.waitForTimeout(600);
    check('Failed initial vehicle loads an available fallback without blocking form', await vehicle(initialFailure).getAttribute('data-vehicle') === 'sleeper' && await initialFailure.locator('#search-from').isEnabled());
    await initialFailure.close();
    const atlasFailure = await browser.newPage({ reducedMotion: 'reduce' });
    await atlasFailure.route('**/fleet-turns.webp',r=>r.abort());
    await atlasFailure.goto(base); await vehicle(atlasFailure).waitFor();
    check('Missing turn atlas keeps the near vehicle and usable form', await atlasFailure.locator('[data-travel-view]').count()===0 && Math.abs((await matrix(atlasFailure)).scale-1)<.001 && await atlasFailure.locator('#search-from').isEnabled());
    await atlasFailure.close();
    // Category-specific floor layouts must keep actual inventory and selection.
    for (const [category,kind,total] of [['sleeper','sleeper',17],['limousine','seat',16],['cabin','cabin',11]]) {
      const seatPage = await browser.newPage({viewport:{width:1440,height:900},reducedMotion:'reduce'});
      await seatPage.goto(`${base}/?step=search&from=Đà%20Nẵng&to=Huế&date=${travelDate}&passengers=2`);
      await seatPage.locator(`[data-trip-category=${category}]`).filter({has:seatPage.getByRole('button',{name:/Chọn chuyến đi lúc/})}).first().getByRole('button',{name:/Chọn chuyến đi lúc/}).click();
      await seatPage.locator(`[data-seat-map=${category}]`).waitFor();
      check(`${category} renders its own seat artwork and actual floor inventory`, await seatPage.locator(`[data-seat-kind=${kind}]`).count()===total);
      check(`${category} booked seats remain disabled`, await seatPage.locator('[data-seat-state=booked]').first().isDisabled());
      const one=seatPage.locator('[data-seat-state=available]').first(); const code=await one.getAttribute('data-seat-code');
      await one.click();
      if(category!=='limousine') await seatPage.getByRole('button',{name:/Tầng 2/}).click();
      await seatPage.locator('[data-seat-state=available]').first().click();
      const proceed=seatPage.getByRole('button',{name:'Tiếp tục điền thông tin',exact:true});
      check(`${category} preserves selections across floors and enables the next step`,await proceed.isEnabled());
      await seatPage.locator('[data-seat-state=available]').first().click();
      check(`${category} prevents a third selection without replacing existing seats`,await proceed.isEnabled() && await seatPage.getByText(/Bạn đã chọn đủ 2 ghế/).isVisible());
      if(category!=='limousine') await seatPage.getByRole('button',{name:/Tầng 1/}).click();
      await seatPage.locator(`[data-seat-code=${code}]`).focus(); await seatPage.keyboard.press('Space');
      check(`${category} keyboard deselection updates the passenger limit`,await proceed.isDisabled());
      await seatPage.locator(`[data-seat-code=${code}]`).click();
      await seatPage.screenshot({path:path.join(out,`seat-map-${category}-desktop.png`),fullPage:true});
      await seatPage.setViewportSize({width:390,height:844});await seatPage.getByRole('button',{name:'Dọc',exact:true}).click();
      check(`${category} mobile layout has no page overflow`,await seatPage.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
      await seatPage.screenshot({path:path.join(out,`seat-map-${category}-mobile.png`),fullPage:true});
      await seatPage.close();
    }
    // Navigation waits for the real departure, rejects duplicate submissions,
    // and remains usable with missing imagery and reduced motion.
    const departure = await browser.newPage({viewport:{width:1440,height:900},reducedMotion:'reduce'});
    await departure.goto(base);await vehicle(departure).waitFor();
    await departure.locator('#search-date').fill(travelDate);
    await departure.emulateMedia({reducedMotion:'no-preference'});
    await departure.evaluate(()=>{window.searchWrites=0;const old=history.replaceState.bind(history);history.replaceState=(...args)=>{if(String(args[2]).includes('step=search'))window.searchWrites++;return old(...args)}});
    await scene(departure).getByRole('button',{name:'Tìm chuyến',exact:true}).click();
    check('Valid search starts departure before leaving the homepage',await scene(departure).getAttribute('data-search-transition')==='departing' && !departure.url().includes('step=search'));
    await departure.evaluate(()=>{const form=document.querySelector('#hero-search form');form.requestSubmit();form.requestSubmit()});
    await departure.waitForFunction(()=>{const el=document.querySelector('[data-vehicle]');return el && new DOMMatrix(getComputedStyle(el).transform).f<790});
    check('Search vehicle moves forward/upward with a rear-view asset',await departure.locator('[data-departure-photo]').count()===1);
    await departure.waitForURL(/step=search/);
    check('Departure performs exactly one search navigation',await departure.evaluate(()=>window.searchWrites)===1);
    await departure.getByRole('button',{name:/Chọn chuyến đi lúc/}).first().waitFor();
    await departure.close();
    // Booking smoke checks use the existing flow and do not change its code.
    await p.setViewportSize({ width: 1440, height: 900 });
    await choose(p, 'from', 'Đà Nẵng'); await choose(p, 'to', 'Huế');
    await p.locator('#search-passengers').click(); await p.locator('#search-passengers-list [role=option]').filter({has:p.getByText('1 người',{exact:true})}).click();
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
    check('No unexpected local HTTP errors', httpErrors.length === 0);
    writeFileSync(path.join(out, 'results.json'), JSON.stringify({ results, first, middle, last, errors }, null, 2));
    console.log(JSON.stringify({ passed: results.length, results, out }, null, 2));
  } finally { if (browser) await browser.close(); server.kill(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
