// Crew roles (tài xế / lơ xe) and live trip tracking:
// - the owner creates driver + assistant logins and assigns them to a trip,
// - crew only see and board tickets of their own trip; a ticket of another
//   bus is refused with which bus it belongs to,
// - crew phone GPS: start -> positions -> finish, off-route detection against
//   the route's stop coordinates, and the trip log a customer sees.
// Throwaway SQLite DB; never touches backend/database/database.sqlite.
import { request as httpRequest } from "node:http";
import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawn, spawnSync } from "node:child_process";
import { randomBytes } from "node:crypto";

const dir = mkdtempSync(join(tmpdir(), "danava-crew-"));
const token = randomBytes(24).toString("hex");
const port = 18791;
const base = `http://127.0.0.1:${port}`;
const php = process.env.PHP_BINARY || "php";
const env = {
  ...process.env,
  APP_ENV: "local", APP_KEY: "base64:" + randomBytes(32).toString("base64"), APP_DEBUG: "false", APP_URL: base,
  DB_CONNECTION: "sqlite", DB_DATABASE: join(dir, "db.sqlite"),
  SESSION_FILES: join(dir, "sessions"), CACHE_PATH: join(dir, "cache"), SESSION_SECURE_COOKIE: "false",
  DANAVA_SETUP_TOKEN: token, DANAVA_ALLOW_DEMO_SEED: "true", BCRYPT_ROUNDS: "4", TENANT_WILDCARD_READY: "true",
  DANAVA_OFF_ROUTE_M: "3000",
};
mkdirSync(join(dir, "sessions"), { recursive: true });
mkdirSync(join(dir, "cache"), { recursive: true });
const migration = spawnSync(php, ["backend/artisan", "migrate", "--force"], { env, encoding: "utf8" });
if (migration.status !== 0) throw new Error(migration.stderr + migration.stdout);
const child = spawn(php, ["-S", `127.0.0.1:${port}`, "-t", "backend/public", "backend/server.php"], { env, stdio: ["ignore", "pipe", "pipe"] });
child.stdout.on("data", () => {});
child.stderr.on("data", () => {});

function httpFetch(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = httpRequest(url, { method: options.method || "GET", headers: options.headers || {} }, (res) => {
      const chunks = [];
      res.on("data", (c) => chunks.push(c));
      res.on("end", () => resolve({ status: res.statusCode, cookies: res.headers["set-cookie"] || [], text: Buffer.concat(chunks).toString() }));
    });
    req.on("error", reject);
    if (options.body) req.write(options.body);
    req.end();
  });
}
const sessionCookie = (r) => r.cookies.find((c) => c.startsWith("danava_session="))?.split(";")[0];
async function anon() {
  const r = await httpFetch(base + "/api/auth/me");
  return { cookie: sessionCookie(r), csrf: JSON.parse(r.text).csrf };
}
async function call(session, path, { method = "GET", body, headers = {} } = {}) {
  const s = session || (await anon());
  const r = await httpFetch(base + "/api" + path, {
    method,
    headers: { "Content-Type": "application/json", Cookie: s.cookie, "X-CSRF-Token": s.csrf, ...headers },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  let data = {};
  try { data = JSON.parse(r.text); } catch { data = { raw: r.text.slice(0, 300) }; }
  return { status: r.status, data, cookie: sessionCookie(r) };
}
async function login(email, password) {
  const r = await call(await anon(), "/auth/login", { method: "POST", body: { email, password } });
  assert.equal(r.status, 200, JSON.stringify(r.data));
  return { cookie: r.cookie, csrf: r.data.csrf };
}
const pw = () => randomBytes(12).toString("hex");
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function book(tripId, phone, owner) {
  const detail = await call(owner, `/admin/trips/${tripId}`);
  const seat = detail.data.data.seats.find((s) => s.status === "available").code;
  const pickup = detail.data.data.route.stops.find((s) => s.stop_type === "pickup").id;
  const dropoff = detail.data.data.route.stops.filter((s) => s.stop_type === "dropoff").pop().id;
  const t = randomBytes(24).toString("hex");
  const c = await anon();
  const hold = await call(c, "/public/holds", { method: "POST", headers: { "X-Booking-Token": t }, body: { tripId, seats: [seat] } });
  assert.equal(hold.status, 201, JSON.stringify(hold.data));
  const b = await call(c, "/public/bookings", {
    method: "POST", headers: { "X-Booking-Token": t, "Idempotency-Key": "crew-" + randomBytes(6).toString("hex") },
    body: { tripId, seats: [seat], holdId: hold.data.id, passenger: { fullName: "Khách " + phone, phone, email: "", pickupStopId: pickup, dropoffStopId: dropoff, agreedTerms: true } },
  });
  assert.equal(b.status, 201, JSON.stringify(b.data));
  const pay = await call(owner, `/admin/bookings/${b.data.id}/confirm-payment`, { method: "POST", body: { method: "cash" } });
  assert.equal(pay.status, 200, JSON.stringify(pay.data));
  return b.data.id;
}

test("Crew roles board only their own bus and share the trip's GPS", async (t) => {
  t.after(() => {
    child.kill("SIGTERM");
    setTimeout(() => rmSync(dir, { recursive: true, force: true }), 300).unref();
  });
  for (let i = 0; i < 100; i++) {
    try { if ((await httpFetch(base + "/api/health")).status === 200) break; } catch {}
    await wait(50);
  }

  const pass = { platform: pw(), owner: pw(), driver: pw(), assistant: pw(), sales: pw() };
  let owner, driver, assistant, sales, tenant, tripA, tripB, ticketA, ticketB, crew;

  await t.test("Owner creates a driver and a 'lơ xe' login with crew records", async () => {
    const setup = await call(await anon(), "/auth/setup", { method: "POST", body: { setupToken: token, name: "QA", email: "platform@qa.test", password: pass.platform } });
    assert.equal(setup.status, 201, JSON.stringify(setup.data));
    const platform = { cookie: setup.cookie, csrf: setup.data.csrf };
    const demo = await call(platform, "/platform/demo", { method: "POST", body: {} });
    tenant = demo.data.tenant.id;
    assert.equal((await call(platform, "/admin/staff", { method: "POST", body: { partner_id: tenant, ho_ten: "Chủ", email: "owner@qa.test", password: pass.owner, role: "owner" } })).status, 200);
    owner = await login("owner@qa.test", pass.owner);

    const noPhone = await call(owner, "/admin/staff", { method: "POST", body: { ho_ten: "Tài xế", email: "driver@qa.test", password: pass.driver, role: "driver", license: "E" } });
    assert.equal(noPhone.status, 422, "crew needs a phone for the crew record");
    const d = await call(owner, "/admin/staff", { method: "POST", body: { ho_ten: "Tài xế Hùng", email: "driver@qa.test", password: pass.driver, role: "driver", so_dien_thoai: "0905111222", license: "E" } });
    assert.equal(d.status, 200, JSON.stringify(d.data));
    const a = await call(owner, "/admin/staff", { method: "POST", body: { ho_ten: "Lơ xe Nam", email: "lo@qa.test", password: pass.assistant, role: "assistant", so_dien_thoai: "0905333444" } });
    assert.equal(a.status, 200, JSON.stringify(a.data));
    assert.equal(a.data.data.role_label, "Lơ xe");
    assert.equal((await call(owner, "/admin/staff", { method: "POST", body: { ho_ten: "Bán vé", email: "sales@qa.test", password: pass.sales, role: "sales" } })).status, 200);
    driver = await login("driver@qa.test", pass.driver);
    assistant = await login("lo@qa.test", pass.assistant);
    sales = await login("sales@qa.test", pass.sales);

    const list = await call(owner, "/admin/crew");
    assert.equal(list.status, 200, JSON.stringify(list.data));
    crew = Object.fromEntries(list.data.data.map((c) => [c.position, c]));
    assert.equal(crew.driver.login, "driver@qa.test");
    assert.equal(crew.assistant.login, "lo@qa.test");
  });

  await t.test("Owner assigns the crew after tickets are sold", async () => {
    const trips = (await call(owner, "/admin/trips")).data.data.data.filter((x) => x.status === "scheduled" && x.available_seats_count > 2);
    assert.ok(trips.length >= 2, "two published trips");
    [tripA, tripB] = trips;
    ticketA = await book(tripA.id, "0912000111", owner);
    ticketB = await book(tripB.id, "0912000222", owner);

    const wrong = await call(owner, `/admin/trips/${tripA.id}/crew`, { method: "PATCH", body: { driver_id: crew.assistant.id } });
    assert.equal(wrong.status, 422, "an assistant cannot be the driver");
    assert.equal((await call(sales, `/admin/trips/${tripA.id}/crew`, { method: "PATCH", body: { driver_id: crew.driver.id } })).status, 403);
    const ok = await call(owner, `/admin/trips/${tripA.id}/crew`, { method: "PATCH", body: { driver_id: crew.driver.id, assistant_id: crew.assistant.id } });
    assert.equal(ok.status, 200, JSON.stringify(ok.data));
    assert.equal(ok.data.data.driver.name, "Tài xế Hùng");
    assert.equal(ok.data.data.assistant.name, "Lơ xe Nam");
  });

  await t.test("Crew see only their trip and board only its tickets", async () => {
    const day = tripA.depart_time.slice(0, 10);
    for (const s of [driver, assistant]) {
      const mine = await call(s, `/admin/checkin/trips?date=${day}`);
      assert.equal(mine.status, 200, JSON.stringify(mine.data));
      assert.deepEqual(mine.data.data.trips.map((x) => x.id), [tripA.id]);
      assert.equal((await call(s, "/admin/bookings")).status, 403, "crew cannot open the bookings desk");
    }
    const other = await call(assistant, `/admin/checkin/lookup?q=${ticketB}&trip_id=${tripA.id}`);
    assert.equal(other.status, 409, JSON.stringify(other.data));
    assert.match(other.data.error, /thuộc chuyến khác/);
    assert.equal((await call(assistant, `/admin/checkin/${ticketB}`, { method: "POST", body: { trip_id: tripA.id } })).status, 404, "not on their trip");
    const found = await call(assistant, `/admin/checkin/lookup?q=${ticketA}&trip_id=${tripA.id}`);
    assert.equal(found.data.data.length, 1);
    const board = await call(assistant, `/admin/checkin/${ticketA}`, { method: "POST", body: { trip_id: tripA.id } });
    assert.equal(board.status, 200, JSON.stringify(board.data));
    assert.equal(board.data.data.booking_status, "checked_in");
    // Sales (not crew) scanning on bus A is still bound to bus A.
    const salesWrong = await call(sales, `/admin/checkin/${ticketB}`, { method: "POST", body: { trip_id: tripA.id } });
    assert.equal(salesWrong.status, 409, JSON.stringify(salesWrong.data));
  });

  await t.test("GPS: start, on/off route, trip log for the customer", async () => {
    // Route Đà Nẵng -> Huế with stop coordinates (added after the trip was scheduled).
    const route = (await call(owner, `/admin/routes/${tripA.route_id}`)).data.data;
    const stops = route.stops.map((s) => ({
      id: s.id, name: s.name, address: s.address, stop_type: s.stop_type, time_offset_minutes: s.time_offset_minutes,
      ...(s.stop_type === "pickup" ? { lat: 16.0544, lng: 108.2022 } : { lat: 16.4637, lng: 107.5909 }),
    }));
    const saved = await call(owner, `/admin/routes/${tripA.route_id}`, { method: "PATCH", body: { stops } });
    assert.equal(saved.status, 200, JSON.stringify(saved.data));
    assert.deepEqual(saved.data.data.stops.map((s) => s.id), route.stops.map((s) => s.id), "editing keeps stop ids for scheduled trips");

    assert.equal((await call(driver, `/admin/trips/${tripA.id}/tracking/position`, { method: "POST", body: { lat: 16.1, lng: 108.1 } })).status, 409, "start first");
    assert.equal((await call(driver, `/admin/trips/${tripB.id}/tracking/start`, { method: "POST", body: {} })).status, 403, "not their trip");
    assert.equal((await call(sales, `/admin/trips/${tripA.id}/tracking/start`, { method: "POST", body: {} })).status, 403, "sales cannot drive GPS");

    const before = await call(null, "/public/tracking", { method: "POST", body: { code: ticketA, phone: "0912000111" } });
    assert.equal(before.status, 200, JSON.stringify(before.data));
    assert.equal(before.data.state, "scheduled");
    assert.equal(before.data.routeChecked, true);
    assert.equal((await call(null, "/public/tracking", { method: "POST", body: { code: ticketA, phone: "0912999999" } })).status, 404);

    const start = await call(driver, `/admin/trips/${tripA.id}/tracking/start`, { method: "POST", body: { lat: 16.259, lng: 107.896 } });
    assert.equal(start.status, 200, JSON.stringify(start.data));
    assert.equal(start.data.data.state, "running");
    assert.equal(start.data.data.position.offRoute, false);

    await wait(5200);
    const off = await call(assistant, `/admin/trips/${tripA.id}/tracking/position`, { method: "POST", body: { lat: 15.9, lng: 108.6, speed: 15 } });
    assert.equal(off.status, 200, JSON.stringify(off.data));
    assert.equal(off.data.data.kept, true);
    assert.equal(off.data.data.offRoute, true);
    assert.ok(off.data.data.routeDistanceM > 3000);
    const notices = await call(owner, "/manage/notices");
    assert.ok(JSON.stringify(notices.data).includes("lệch tuyến"), "owner is notified");

    await wait(5200);
    assert.equal((await call(driver, `/admin/trips/${tripA.id}/tracking/position`, { method: "POST", body: { lat: 16.26, lng: 107.9 } })).data.data.offRoute, false);

    const live = await call(owner, "/admin/tracking/live?date=" + tripA.depart_time.slice(0, 10));
    const row = live.data.data.trips.find((x) => x.trip.id === tripA.id);
    assert.equal(row.state, "running");
    assert.equal(row.driver.name, "Tài xế Hùng");

    assert.equal((await call(driver, `/admin/trips/${tripA.id}/tracking/finish`, { method: "POST", body: {} })).status, 200);
    const after = await call(null, "/public/tracking", { method: "POST", body: { code: ticketA, phone: "0912000111" } });
    assert.equal(after.data.state, "finished");
    assert.deepEqual(after.data.events.map((e) => e.type), ["boarded", "started", "off_route", "back_on_route", "finished"], "boarding at the station comes before departure");
    assert.equal(after.data.path.length, 3);
    const otherTicket = await call(null, "/public/tracking", { method: "POST", body: { code: ticketB, phone: "0912000222" } });
    assert.equal(otherTicket.data.state, "scheduled", "another trip's log is separate");
  });
});
