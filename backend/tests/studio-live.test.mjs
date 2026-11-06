// Studio (/api/admin/*) on the live operator model: what customers book online
// must appear in the operator's Studio, money/boarding rules hold, and every
// role/operator only sees and changes its own data.
// Default DB is a throwaway SQLite; API_TEST_DB=mysql uses DB_HOST/... (wiped!).
import { request as httpRequest } from "node:http";
import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawn, spawnSync } from "node:child_process";
import { randomBytes } from "node:crypto";

const dir = mkdtempSync(join(tmpdir(), "danava-studio-"));
const token = randomBytes(24).toString("hex");
const base = "http://127.0.0.1:18789";
const php = process.env.PHP_BINARY || "php";
const mysql = process.env.API_TEST_DB === "mysql";
const env = {
  ...process.env,
  APP_ENV: "local", APP_KEY: "base64:" + randomBytes(32).toString("base64"), APP_DEBUG: "false", APP_URL: base,
  ...(mysql ? { DB_CONNECTION: "mysql" } : { DB_CONNECTION: "sqlite", DB_DATABASE: join(dir, "db.sqlite") }),
  SESSION_FILES: join(dir, "sessions"), CACHE_PATH: join(dir, "cache"), SESSION_SECURE_COOKIE: "false",
  DANAVA_SETUP_TOKEN: token, DANAVA_ALLOW_DEMO_SEED: "true", BCRYPT_ROUNDS: "4", TENANT_WILDCARD_READY: "true",
};
mkdirSync(join(dir, "sessions"), { recursive: true });
mkdirSync(join(dir, "cache"), { recursive: true });
const migration = spawnSync(php, ["backend/artisan", mysql ? "migrate:fresh" : "migrate", "--force"], { env, encoding: "utf8" });
if (migration.status !== 0) throw new Error(migration.stderr + migration.stdout);
const child = spawn(php, ["-S", "127.0.0.1:18789", "-t", "backend/public", "backend/server.php"], { env, stdio: ["ignore", "pipe", "pipe"] });
let log = "";
child.stdout.on("data", (d) => (log += d));
child.stderr.on("data", (d) => (log += d));

function httpFetch(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = httpRequest(url, { method: options.method || "GET", headers: options.headers || {} }, (res) => {
      const chunks = [];
      res.on("data", (c) => chunks.push(c));
      res.on("end", () => resolve({
        status: res.statusCode,
        cookies: res.headers["set-cookie"] || [],
        text: Buffer.concat(chunks).toString(),
      }));
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
  const a = await anon();
  const r = await call(a, "/auth/login", { method: "POST", body: { email, password } });
  assert.equal(r.status, 200, JSON.stringify(r.data));
  return { cookie: r.cookie, csrf: r.data.csrf };
}
const pw = () => randomBytes(12).toString("hex");
const vnDay = (offset = 0) => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh" }).format(new Date(Date.now() + offset * 864e5));

test("Studio runs on the live booking model with operator isolation", async (t) => {
  t.after(() => {
    child.kill("SIGTERM");
    setTimeout(() => rmSync(dir, { recursive: true, force: true }), 300).unref();
  });
  for (let i = 0; i < 100; i++) {
    try { if ((await httpFetch(base + "/api/health")).status === 200) break; } catch {}
    await new Promise((r) => setTimeout(r, 50));
  }

  let platform, ownerA, ownerB, salesA, tenantA, tenantB, tripA, online;
  const passwords = { platform: pw(), ownerA: pw(), ownerB: pw(), salesA: pw() };

  await t.test("Anonymous users cannot reach Studio", async () => {
    for (const p of ["/admin/bookings", "/admin/statistics", "/admin/cashbook", "/admin/staff"]) {
      assert.equal((await call(null, p)).status, 401, p);
    }
  });

  await t.test("Platform sets up two operators and their owners", async () => {
    const setup = await call(await anon(), "/auth/setup", { method: "POST", body: { setupToken: token, name: "QA Platform", email: "platform@qa.test", password: passwords.platform } });
    assert.equal(setup.status, 201, JSON.stringify(setup.data));
    platform = { cookie: setup.cookie, csrf: setup.data.csrf };
    const demo = await call(platform, "/platform/demo", { method: "POST", body: {} });
    assert.ok([200, 201].includes(demo.status), JSON.stringify(demo.data));
    tenantA = demo.data.tenant.id;
    const b = await call(platform, "/admin/partners", { method: "POST", body: { name: "Nhà xe B QA", phone: "0905000000", commission_rate: 8 } });
    assert.equal(b.status, 200, JSON.stringify(b.data));
    tenantB = b.data.data.id;
    for (const [key, tid, email] of [["ownerA", tenantA, "owner.a@qa.test"], ["ownerB", tenantB, "owner.b@qa.test"]]) {
      const r = await call(platform, "/admin/staff", { method: "POST", body: { partner_id: tid, ho_ten: key, email, password: passwords[key], role: "owner" } });
      assert.equal(r.status, 200, JSON.stringify(r.data));
    }
    ownerA = await login("owner.a@qa.test", passwords.ownerA);
    ownerB = await login("owner.b@qa.test", passwords.ownerB);
    const s = await call(ownerA, "/admin/staff", { method: "POST", body: { ho_ten: "Bán vé A", email: "sales.a@qa.test", password: passwords.salesA, role: "sales" } });
    assert.equal(s.status, 200, JSON.stringify(s.data));
    salesA = await login("sales.a@qa.test", passwords.salesA);
  });

  await t.test("Owners only see their own operator", async () => {
    const a = await call(ownerA, "/admin/partners");
    assert.deepEqual(a.data.data.map((p) => p.id), [tenantA]);
    assert.equal((await call(ownerA, `/admin/partners?partner_id=${tenantB}`)).status, 403);
    assert.equal((await call(ownerA, "/admin/partners", { method: "POST", body: { name: "x", phone: "1", commission_rate: 1 } })).status, 403);
    assert.equal((await call(ownerA, "/admin/settings")).status, 403);
    assert.equal((await call(ownerA, `/admin/partners/${tenantA}`, { method: "PATCH", body: { commission_rate: 0 } })).status, 403);
    const trips = await call(ownerA, "/admin/trips");
    assert.equal(trips.status, 200);
    assert.ok(trips.data.data.data.length > 0);
    assert.ok(trips.data.data.data.every((x) => x.partner_id === tenantA));
    assert.equal((await call(ownerB, "/admin/trips")).data.data.data.length, 0);
    tripA = trips.data.data.data.find((x) => x.status === "scheduled" && x.available_seats_count > 3);
    assert.ok(tripA, "a published trip with seats");
  });

  await t.test("Sales role is limited to its area", async () => {
    assert.equal((await call(salesA, "/admin/bookings")).status, 200);
    assert.equal((await call(salesA, "/admin/staff")).status, 403);
    assert.equal((await call(salesA, "/admin/cashbook")).status, 403);
    assert.equal((await call(salesA, "/admin/trips", { method: "POST", body: {} })).status, 403);
  });

  await t.test("A customer's online booking appears in the operator's Studio only", async () => {
    const detail = await call(ownerA, `/admin/trips/${tripA.id}`);
    assert.equal(detail.status, 200);
    const seat = detail.data.data.seats.find((s) => s.status === "available").code;
    const pickup = detail.data.data.route.stops.find((s) => s.stop_type === "pickup").id;
    const dropoff = detail.data.data.route.stops.filter((s) => s.stop_type === "dropoff").pop().id;
    const customerToken = randomBytes(24).toString("hex");
    const customer = await anon();
    const hold = await call(customer, "/public/holds", { method: "POST", headers: { "X-Booking-Token": customerToken }, body: { tripId: tripA.id, seats: [seat] } });
    assert.equal(hold.status, 201, JSON.stringify(hold.data));
    const booked = await call(customer, "/public/bookings", {
      method: "POST", headers: { "X-Booking-Token": customerToken, "Idempotency-Key": "studio-live-online-1" },
      body: { tripId: tripA.id, seats: [seat], holdId: hold.data.id, passenger: { fullName: "Khách Online", phone: "0912345678", email: "", pickupStopId: pickup, dropoffStopId: dropoff, agreedTerms: true } },
    });
    assert.equal(booked.status, 201, JSON.stringify(booked.data));
    online = { id: booked.data.id, seat, total: booked.data.totalAmount };
    const list = await call(ownerA, "/admin/bookings?search=" + online.id);
    const row = list.data.data.data.find((b) => b.id === online.id);
    assert.ok(row, "online booking visible to its operator");
    assert.equal(row.source, "online");
    assert.equal(row.payment_status, "unpaid");
    assert.equal(row.final_amount, online.total);
    assert.equal((await call(ownerB, `/admin/bookings/${online.id}`)).status, 404);
    assert.equal((await call(ownerB, "/admin/bookings")).data.data.total, 0);
    const all = await call(platform, "/admin/bookings");
    assert.ok(all.data.data.data.some((b) => b.id === online.id), "platform sees every operator");
  });

  await t.test("Boarding requires full payment; payment goes to the ledger", async () => {
    assert.equal((await call(salesA, `/admin/checkin/${online.id}`, { method: "POST", body: {} })).status, 409);
    const pay = await call(salesA, `/admin/bookings/${online.id}/confirm-payment`, { method: "POST", body: { method: "cash" } });
    assert.equal(pay.status, 200, JSON.stringify(pay.data));
    assert.equal(pay.data.data.payment_status, "paid");
    assert.equal((await call(salesA, `/admin/bookings/${online.id}/confirm-payment`, { method: "POST", body: { method: "cash" } })).status, 409);
    const board = await call(salesA, `/admin/checkin/${online.id}`, { method: "POST", body: {} });
    assert.equal(board.status, 200, JSON.stringify(board.data));
    assert.equal(board.data.data.booking_status, "checked_in");
    const again = await call(salesA, `/admin/checkin/${online.id}`, { method: "POST", body: {} });
    assert.match(again.data.message, /đã được soát/);
    const lookup = await call(salesA, "/admin/checkin/lookup?q=0912345678");
    assert.ok(lookup.data.data.some((x) => x.id === online.id));
  });

  await t.test("Boarded customer can review; operator sees and replies", async () => {
    const bad = await call(null, "/public/reviews", { method: "POST", body: { code: online.id, phone: "0900000000", rating: 5 } });
    assert.equal(bad.status, 404);
    const ok = await call(null, "/public/reviews", { method: "POST", body: { code: online.id, phone: "0912345678", rating: 4, comment: "Xe đúng giờ" } });
    assert.equal(ok.status, 201, JSON.stringify(ok.data));
    const reviews = await call(ownerA, "/admin/reviews");
    assert.equal(reviews.data.data.items.length, 1);
    assert.equal((await call(ownerB, "/admin/reviews")).data.data.items.length, 0);
    assert.equal((await call(ownerB, `/admin/reviews/${reviews.data.data.items[0].id}`, { method: "PATCH", body: { reply: "x" } })).status, 404);
  });

  await t.test("Counter sale uses server price and seat locking", async () => {
    const taken = await call(salesA, "/admin/bookings", { method: "POST", body: { trip_id: tripA.id, customer_name: "Quầy", customer_phone: "0987654321", seats: [online.seat], total_amount: 1 } });
    assert.equal(taken.status, 409, JSON.stringify(taken.data));
    assert.equal((await call(salesA, `/admin/trips/${tripA.id}`, { method: "PATCH", body: { status: "cancelled" } })).status, 403, "sales reads trips but cannot change them");
    const trips = await call(salesA, `/admin/trips/${tripA.id}`);
    const seat = trips.data.data.seats.find((s) => s.status === "available").code;
    const sold = await call(salesA, "/admin/bookings", { method: "POST", body: { trip_id: tripA.id, customer_name: "Quầy", customer_phone: "0987654321", seats: [seat], total_amount: 1, payment_status: "paid", payment_method: "cash" } });
    assert.equal(sold.status, 200, JSON.stringify(sold.data));
    assert.equal(sold.data.data.final_amount, tripA.base_price, "price comes from the trip, not the client");
    assert.equal(sold.data.data.payment_status, "paid");
    assert.equal(sold.data.data.source, "counter");
    const otherTenant = await call(ownerB, "/admin/bookings", { method: "POST", body: { trip_id: tripA.id, customer_name: "x", customer_phone: "0987654321", seats: ["B9"] } });
    assert.equal(otherTenant.status, 403);
  });

  await t.test("Seat map: owner places seats and price groups; customers pay per seat", async () => {
    const vid = tripA.bus_vehicle_id;
    const v = (await call(ownerA, `/admin/vehicles/${vid}`)).data.data;
    assert.ok(v.seat_map?.cells?.length === v.capacity, "every vehicle exposes its seat map");
    const detail = (await call(ownerA, `/admin/trips/${tripA.id}`)).data.data;
    const [vipSeat, plainSeat, blockedSeat] = detail.seats.filter((x) => x.status === "available").map((x) => x.code);
    const map = structuredClone(v.seat_map);
    map.groups = [{ id: "vip", name: "VIP", surcharge: 70000 }];
    map.cells = map.cells.map((c) => (c.code === vipSeat ? { ...c, group: "vip" } : c.code === blockedSeat ? { ...c, disabled: true } : c));
    const dup = structuredClone(map);
    dup.cells[1] = { ...dup.cells[1], floor: dup.cells[0].floor, row: dup.cells[0].row, col: dup.cells[0].col };
    assert.equal((await call(ownerA, `/admin/vehicles/${vid}`, { method: "PATCH", body: { seat_map: dup } })).status, 422, "two seats on one spot");
    const ghost = structuredClone(map);
    ghost.cells[0] = { ...ghost.cells[0], group: "nope" };
    assert.equal((await call(ownerA, `/admin/vehicles/${vid}`, { method: "PATCH", body: { seat_map: ghost } })).status, 422, "unknown price group");
    assert.equal((await call(ownerB, `/admin/vehicles/${vid}`, { method: "PATCH", body: { seat_map: map } })).status, 404, "other operators cannot edit");
    const saved = await call(ownerA, `/admin/vehicles/${vid}`, { method: "PATCH", body: { seat_map: map } });
    assert.equal(saved.status, 200, JSON.stringify(saved.data));
    assert.equal(saved.data.data.seat_map.groups[0].surcharge, 70000);
    // Same seat codes: the already scheduled trip picks up the new prices and blocked seat.
    const token = randomBytes(24).toString("hex");
    const customer = await anon();
    assert.equal((await call(customer, "/public/holds", { method: "POST", headers: { "X-Booking-Token": token }, body: { tripId: tripA.id, seats: [blockedSeat] } })).status, 409, "blocked seat is not sold");
    const hold = await call(customer, "/public/holds", { method: "POST", headers: { "X-Booking-Token": token }, body: { tripId: tripA.id, seats: [vipSeat, plainSeat] } });
    assert.equal(hold.status, 201, JSON.stringify(hold.data));
    const pickup = detail.route.stops.find((x) => x.stop_type === "pickup").id;
    const dropoff = detail.route.stops.filter((x) => x.stop_type === "dropoff").pop().id;
    const booked = await call(customer, "/public/bookings", {
      method: "POST", headers: { "X-Booking-Token": token, "Idempotency-Key": "studio-live-seatmap-1" },
      body: { tripId: tripA.id, seats: [vipSeat, plainSeat], holdId: hold.data.id, paymentMethod: "bank_transfer", passenger: { fullName: "Khách VIP", phone: "0911222333", email: "", pickupStopId: pickup, dropoffStopId: dropoff, agreedTerms: true } },
    });
    assert.equal(booked.status, 201, JSON.stringify(booked.data));
    assert.equal(booked.data.totalAmount, 2 * tripA.base_price + 70000, "fare + VIP surcharge, charged by the server");
    assert.equal(booked.data.paymentMethod, "bank_transfer");
    const vip = booked.data.trip.seats.find((x) => x.code === vipSeat);
    assert.equal(vip.note, "VIP");
    assert.equal(booked.data.trip.seats.find((x) => x.code === blockedSeat).status, "disabled");
  });

  await t.test("Checkout creates a customer account; first login forces a new password", async () => {
    // The online booking above (phone 0912345678) created the account.
    const login = async (password) => {
      const a = await anon();
      return call(a, "/auth/login", { method: "POST", body: { phone: "0912345678", password } });
    };
    assert.equal((await login("sai-mat-khau")).status, 401);
    const first = await login("123456");
    assert.equal(first.status, 200, JSON.stringify(first.data));
    assert.equal(first.data.user.role, "customer");
    assert.equal(first.data.user.mustChangePassword, true);
    const c = { cookie: first.cookie, csrf: first.data.csrf };
    assert.equal((await call(c, "/customer/bookings")).status, 403, "temporary password must be changed first");
    assert.equal((await call(c, "/admin/bookings")).status, 403, "customers never reach Studio");
    assert.equal((await call(c, "/manage/bookings")).status, 403, "customers never reach operator APIs");
    assert.equal((await call(c, "/auth/password", { method: "PATCH", body: { currentPassword: "123456", newPassword: "12345678" } })).status, 422, "weak password refused");
    const changed = await call(c, "/auth/password", { method: "PATCH", body: { currentPassword: "123456", newPassword: "KhachMoi@2026" } });
    assert.equal(changed.status, 200, JSON.stringify(changed.data));
    assert.equal(changed.data.user.mustChangePassword, false);
    const c2 = { cookie: changed.cookie || c.cookie, csrf: changed.data.csrf };
    const mine = await call(c2, "/customer/bookings");
    assert.equal(mine.status, 200, JSON.stringify(mine.data));
    assert.ok(mine.data.items.some((b) => b.id === online.id), "own ticket listed");
    assert.ok(mine.data.items.every((b) => b.passenger.phone === "0912345678"), "only own tickets");
    assert.equal((await login("123456")).status, 401, "temporary password no longer works");
    // A new booking with the same phone never resets the account.
    const detail = (await call(ownerA, `/admin/trips/${tripA.id}`)).data.data;
    const seat = detail.seats.find((x) => x.status === "available").code;
    const token = randomBytes(24).toString("hex");
    const guest = await anon();
    const hold = await call(guest, "/public/holds", { method: "POST", headers: { "X-Booking-Token": token }, body: { tripId: tripA.id, seats: [seat] } });
    const again = await call(guest, "/public/bookings", {
      method: "POST", headers: { "X-Booking-Token": token, "Idempotency-Key": "studio-live-account-2" },
      body: { tripId: tripA.id, seats: [seat], holdId: hold.data.id, passenger: { fullName: "Khách Online", phone: "0912345678", email: "", pickupStopId: detail.route.stops.find((x) => x.stop_type === "pickup").id, dropoffStopId: detail.route.stops.filter((x) => x.stop_type === "dropoff").pop().id, agreedTerms: true } },
    });
    assert.equal(again.status, 201, JSON.stringify(again.data));
    assert.deepEqual(again.data.account, { created: false, username: "0912345678" });
    assert.equal((await login("KhachMoi@2026")).status, 200, "password unchanged");
    // Studio edits the ticket and notifies the customer.
    const pickups = detail.route.stops.filter((x) => x.stop_type === "pickup");
    const edit = await call(ownerA, `/admin/bookings/${again.data.id}`, { method: "PATCH", body: { customer_name: "Khách Online Đã Sửa", notes: "Mang theo vali lớn", pickup_stop_id: pickups[pickups.length - 1].id } });
    assert.equal(edit.status, 200, JSON.stringify(edit.data));
    assert.equal(edit.data.notified, true);
    assert.equal(edit.data.data.customer_name, "Khách Online Đã Sửa");
    assert.equal((await call(ownerB, `/admin/bookings/${again.data.id}`, { method: "PATCH", body: { customer_name: "x" } })).status, 404);
    const bad = await call(ownerA, `/admin/bookings/${again.data.id}`, { method: "PATCH", body: { pickup_stop_id: "khong-ton-tai" } });
    assert.equal(bad.status, 422, "stop must belong to the trip");
    const notes = await call(c2, "/customer/notifications");
    assert.equal(notes.status, 200);
    assert.ok(notes.data.items.some((n) => n.bookingId === again.data.id && n.title === "Vé của bạn đã được cập nhật"), JSON.stringify(notes.data));
    assert.ok(notes.data.unread > 0);
    await call(c2, "/customer/notifications/read", { method: "POST", body: {} });
    assert.equal((await call(c2, "/customer/notifications")).data.unread, 0);
  });

  await t.test("Owners manage routes, vehicles and trips; approval rules apply", async () => {
    const route = await call(ownerB, "/admin/routes", { method: "POST", body: { name: "Huế → Quảng Bình", from_city: "Huế", to_city: "Quảng Bình", duration_minutes: 240, base_price: 250000, stops: [{ name: "Bến xe phía Nam Huế", stop_type: "pickup", time_offset_minutes: 0 }, { name: "Bến xe Đồng Hới", stop_type: "dropoff", time_offset_minutes: 240 }] } });
    assert.equal(route.status, 200, JSON.stringify(route.data));
    const vehicle = await call(ownerB, "/admin/vehicles", { method: "POST", body: { name: "Limousine 9 chỗ", plate_number: "75B-123.45", category: "limousine", capacity: 9 } });
    assert.equal(vehicle.status, 200, JSON.stringify(vehicle.data));
    const day = vnDay(2);
    const trip = await call(ownerB, "/admin/trips", { method: "POST", body: { route_id: route.data.data.id, bus_vehicle_id: vehicle.data.data.id, depart_time: `${day} 07:00`, base_price: 250000, status: "scheduled" } });
    assert.equal(trip.status, 200, JSON.stringify(trip.data));
    assert.equal(trip.data.data.status, "pending", "new operators need platform approval to sell");
    const search = await call(null, `/public/search?from=${encodeURIComponent("Huế")}&to=${encodeURIComponent("Quảng Bình")}&date=${day}`);
    assert.equal(search.data.items.length, 0);
    const approve = await call(platform, `/admin/trips/${trip.data.data.id}`, { method: "PATCH", body: { status: "scheduled" } });
    assert.equal(approve.status, 200, JSON.stringify(approve.data));
    const after = await call(null, `/public/search?from=${encodeURIComponent("Huế")}&to=${encodeURIComponent("Quảng Bình")}&date=${day}`);
    assert.equal(after.data.items.length, 1, "approved trip is bookable");
    assert.equal((await call(ownerA, `/admin/routes/${route.data.data.id}`)).status, 404);
    assert.equal((await call(ownerA, `/admin/trips/${trip.data.data.id}`, { method: "PATCH", body: { status: "cancelled" } })).status, 404);
  });

  await t.test("Studio promotion codes work in customer checkout", async () => {
    const promo = await call(ownerA, "/admin/promotions", { method: "POST", body: { code: "QA10", title: "Giảm 10%", discount_type: "percent", discount_value: 10, start_date: vnDay(-1), end_date: vnDay(30) } });
    assert.equal(promo.status, 200, JSON.stringify(promo.data));
    const detail = await call(ownerA, `/admin/trips/${tripA.id}`);
    const seat = detail.data.data.seats.find((s) => s.status === "available").code;
    const pickup = detail.data.data.route.stops.find((s) => s.stop_type === "pickup").id;
    const dropoff = detail.data.data.route.stops.filter((s) => s.stop_type === "dropoff").pop().id;
    const tk = randomBytes(24).toString("hex");
    const c = await anon();
    const hold = await call(c, "/public/holds", { method: "POST", headers: { "X-Booking-Token": tk }, body: { tripId: tripA.id, seats: [seat] } });
    const b = await call(c, "/public/bookings", { method: "POST", headers: { "X-Booking-Token": tk, "Idempotency-Key": "studio-live-promo-1" },
      body: { tripId: tripA.id, seats: [seat], holdId: hold.data.id, promoCode: "qa10", passenger: { fullName: "Khách KM", phone: "0933333333", pickupStopId: pickup, dropoffStopId: dropoff, agreedTerms: true } } });
    assert.equal(b.status, 201, JSON.stringify(b.data));
    assert.equal(b.data.discount, Math.floor(tripA.base_price * 0.1));
    const list = await call(ownerA, "/admin/promotions");
    assert.equal(list.data.data.promotions.find((p) => p.code === "QA10").used_count, 1);
  });

  await t.test("Money views reflect live collections, per operator", async () => {
    const report = await call(ownerA, `/admin/reports?start_date=${vnDay(-1)}&end_date=${vnDay(1)}`);
    assert.equal(report.status, 200);
    assert.equal(report.data.data.gross_revenue, online.total + tripA.base_price, "online + counter collections");
    assert.equal((await call(ownerB, `/admin/reports?start_date=${vnDay(-1)}&end_date=${vnDay(1)}`)).data.data.gross_revenue, 0);
    const debts = await call(ownerA, "/admin/debts");
    assert.ok(debts.data.data.receivables.some((d) => d.customer_phone === "0933333333"), "unpaid promo booking is a receivable");
    const cash = await call(ownerA, "/admin/cashbook", { method: "POST", body: { type: "out", category: "fuel", amount: 500000, method: "cash", occurred_on: vnDay() } });
    assert.equal(cash.status, 200, JSON.stringify(cash.data));
    assert.equal((await call(ownerB, "/admin/cashbook")).data.data.entries.length, 0);
    const stats = await call(ownerA, "/admin/statistics?range=month");
    assert.equal(stats.data.data.total_revenue, online.total + tripA.base_price);
    const compare = await call(ownerA, `/admin/reports/compare?from=${vnDay(-1)}&to=${vnDay(30)}`);
    assert.deepEqual(compare.data.data.rows.map((x) => x.id), [tenantA]);
  });

  await t.test("Payroll credits the seller's commission", async () => {
    const staff = await call(ownerA, "/admin/staff");
    const seller = staff.data.data.find((s) => s.email === "sales.a@qa.test");
    assert.equal((await call(ownerA, `/admin/staff/${seller.id}/compensation`, { method: "PUT", body: { base_salary: 7800000, commission_rate: 5, standard_days: 26, shift_start: "08:00" } })).status, 200);
    assert.equal((await call(ownerA, "/admin/attendance", { method: "POST", body: { admin_id: seller.id, work_date: vnDay(), status: "present", check_in: "08:30" } })).status, 200);
    const payroll = await call(ownerA, "/admin/payroll");
    const row = payroll.data.data.rows.find((x) => x.id === seller.id);
    assert.equal(row.late_days, 1);
    assert.equal(row.salary, 300000);
    assert.equal(row.commission, Math.round(tripA.base_price * 0.05), "commission on the counter sale they made");
    assert.equal((await call(ownerB, `/admin/staff/${seller.id}/compensation`, { method: "PUT", body: { base_salary: 1, commission_rate: 1, standard_days: 26, shift_start: "08:00" } })).status, 404);
  });

  await t.test("Cancelling a trip cancels tickets and flags refunds", async () => {
    const cancel = await call(ownerA, `/admin/trips/${tripA.id}`, { method: "DELETE" });
    assert.equal(cancel.status, 200, JSON.stringify(cancel.data));
    const list = await call(ownerA, "/admin/bookings?trip_id=" + tripA.id);
    assert.ok(list.data.data.data.every((b) => b.booking_status === "cancelled" || b.booking_status === "checked_in"));
    const refundDue = list.data.data.data.filter((b) => b.payment_status === "refund_due");
    assert.ok(refundDue.length >= 1, "paid tickets become refund_due");
  });

  await t.test("Locked accounts lose access immediately", async () => {
    const staff = await call(ownerA, "/admin/staff");
    const seller = staff.data.data.find((s) => s.email === "sales.a@qa.test");
    assert.equal((await call(ownerA, "/admin/staff/status", { method: "POST", body: { id: seller.id } })).status, 200);
    assert.equal((await call(salesA, "/admin/bookings")).status, 401);
    const owner = staff.data.data.find((s) => s.email === "owner.a@qa.test");
    assert.equal((await call(ownerA, "/admin/staff/status", { method: "POST", body: { id: owner.id } })).status, 409, "cannot lock yourself / last owner");
  });
});
