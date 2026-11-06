import { request as httpRequest } from "node:http";
import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawn, spawnSync } from "node:child_process";
import { randomBytes } from "node:crypto";
const dir = mkdtempSync(join(tmpdir(), "danava-api-")),
  token = randomBytes(24).toString("hex"),
  base = "http://127.0.0.1:18787";
const php = process.env.PHP_BINARY || "php";
const env = {
  ...process.env,
  APP_ENV: "local",
  APP_KEY: "base64:" + randomBytes(32).toString("base64"),
  APP_DEBUG: "false",
  APP_URL: base,
  // Default: throwaway SQLite. API_TEST_DB=mysql runs the same contract on the
  // MySQL/MariaDB given by DB_HOST/DB_PORT/DB_DATABASE/DB_USERNAME/DB_PASSWORD
  // (the database is wiped with migrate:fresh, so never point it at real data).
  ...(process.env.API_TEST_DB === "mysql"
    ? { DB_CONNECTION: "mysql" }
    : { DB_CONNECTION: "sqlite", DB_DATABASE: join(dir, "db.sqlite") }),
  SESSION_FILES: join(dir, "sessions"),
  CACHE_PATH: join(dir, "cache"),
  SESSION_SECURE_COOKIE: "false",
  DANAVA_SETUP_TOKEN: token,
  DANAVA_ALLOW_DEMO_SEED: "true",
  BCRYPT_ROUNDS: "4",
  TENANT_WILDCARD_READY: "true",
};
mkdirSync(join(dir, "sessions"), { recursive: true });
mkdirSync(join(dir, "cache"), { recursive: true });
const migration = spawnSync(php, ["backend/artisan", process.env.API_TEST_DB === "mysql" ? "migrate:fresh" : "migrate", "--force"], {
  env,
  encoding: "utf8",
});
if (migration.status !== 0)
  throw new Error(migration.stderr + migration.stdout);
const child = spawn(
  php,
  ["-S", "127.0.0.1:18787", "-t", "backend/public", "backend/server.php"],
  {
    env,
    stdio: ["ignore", "pipe", "pipe"],
  },
);
let log = "";
child.stdout.on("data", (d) => (log += d));
child.stderr.on("data", (d) => (log += d));
const password = randomBytes(18).toString("hex");
function httpFetch(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = httpRequest(
      url,
      { method: options.method || "GET", headers: options.headers || {} },
      (res) => {
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () =>
          resolve({
            status: res.statusCode,
            ok: res.statusCode >= 200 && res.statusCode < 300,
            headers: { getSetCookie: () => res.headers["set-cookie"] || [] },
            json: async () => JSON.parse(Buffer.concat(chunks).toString()),
          }),
        );
      },
    );
    req.on("error", reject);
    if (options.body) req.write(options.body);
    req.end();
  });
}
let anonymous = null;
const cookie = (r) =>
  r.headers
    .getSetCookie()
    .find((c) => c.startsWith("danava_session="))
    ?.split(";")[0];
async function request(path, options = {}) {
  if (!anonymous && path !== "/health") {
    const bootstrap = await httpFetch(base + "/api/auth/me");
    const data = await bootstrap.json();
    anonymous = { cookie: cookie(bootstrap), csrf: data.csrf };
  }
  const session = options.session || anonymous;
  const r = await httpFetch(base + "/api" + path, {
    method: options.method || "GET",
    headers: {
      "Content-Type": "application/json",
      ...(session
        ? {
            Cookie: session.cookie,
            "X-CSRF-Token": session.csrf,
          }
        : {}),
      ...(options.tenant ? { "X-Tenant-Id": options.tenant } : {}),
      ...(options.headers || {}),
    },
    ...(options.body !== undefined
      ? { body: JSON.stringify(options.body) }
      : {}),
  });
  const data = await r.json().catch(() => ({}));
  if (path.startsWith("/auth/") && r.ok && path !== "/auth/me")
    anonymous = null;
  return {
    status: r.status,
    data,
    cookie: cookie(r),
  };
}
let admin, tenant, trip, booking, hold;
test("Full operator/marketplace API with tenant and financial invariants", async (t) => {
  t.after(() => {
    child.kill("SIGTERM");
    setTimeout(
      () => rmSync(dir, { recursive: true, force: true }),
      300,
    ).unref();
  });
  for (let i = 0; i < 80; i++) {
    try {
      if ((await request("/health")).status === 200) break;
    } catch {}
    await new Promise((r) => setTimeout(r, 50));
    if (i === 79) throw Error(log.slice(-2000));
  }
  await t.test("Setup token required and only one platform owner", async () => {
    const bad = await request("/auth/setup", {
      method: "POST",
      body: { setupToken: "wrong" },
    });
    assert.equal(bad.status, 403);
    const r = await request("/auth/setup", {
      method: "POST",
      body: {
        setupToken: token,
        email: "platform@example.test",
        password,
        name: "QA Platform",
      },
    });
    assert.equal(r.status, 201, JSON.stringify(r.data));
    admin = { cookie: r.cookie, csrf: r.data.csrf };
    assert.equal(
      (
        await request("/auth/setup", {
          method: "POST",
          body: {
            setupToken: token,
            email: "second@example.test",
            password,
            name: "QA",
          },
        })
      ).status,
      409,
    );
  });
  await t.test("Unauthorized requests rejected", async () => {
    assert.equal((await request("/manage/trips")).status, 401);
    assert.equal(
      (
        await request("/platform/demo", {
          method: "POST",
          session: { cookie: admin.cookie, csrf: "wrong" },
          body: {},
        })
      ).status,
      419,
    );
  });
  await t.test(
    "Create DANAVAGO sample operator with 3 vehicles/15 published trips",
    async () => {
      const r = await request("/platform/demo", {
        method: "POST",
        session: admin,
        body: {},
      });
      assert.equal(r.status, 201, JSON.stringify(r.data));
      tenant = r.data.tenant;
      assert.equal(tenant.name, "DANAVAGO");
      const trips = await request("/manage/trips", {
        session: admin,
        tenant: tenant.id,
      });
      assert.equal(trips.data.items.length, 15);
      trip = trips.data.items.find(
        (t) => t.from === "Đà Nẵng" && t.to === "Huế",
      );
    },
  );
  await t.test("Sample initialization is idempotent", async () => {
    const r = await request("/platform/demo", {
      method: "POST",
      session: admin,
      body: {},
    });
    assert.equal(r.data.alreadyExists, true);
  });
  await t.test("Published trip appears on public marketplace", async () => {
    const r = await request(
      "/public/search?" +
        new URLSearchParams({
          from: "Đà Nẵng",
          to: "Huế",
          date: trip.date,
          passengers: "1",
        }),
    );
    assert.equal(r.status, 200);
    assert.ok(r.data.items.some((t) => t.id === trip.id));
    assert.equal(
      (await request("/public/search?from=Huế&to=Hà%20Nội&date=" + trip.date))
        .data.items.length,
      0,
    );
  });
  const publicToken = randomBytes(24).toString("hex");
  await t.test("Seat hold blocks duplicate public/counter sales", async () => {
    const r = await request("/public/holds", {
      method: "POST",
      headers: { "X-Booking-Token": publicToken },
      body: { tripId: trip.id, seats: ["A1"] },
    });
    assert.equal(r.status, 201, JSON.stringify(r.data));
    hold = r.data;
    const other = await request("/public/holds", {
      method: "POST",
      headers: { "X-Booking-Token": randomBytes(24).toString("hex") },
      body: { tripId: trip.id, seats: ["A1"] },
    });
    assert.equal(other.status, 409);
  });
  const passenger = {
    fullName: "Khách QA",
    phone: "0901234567",
    email: "qa@example.test",
    pickupStopId: "pickup-office",
    dropoffStopId: "dropoff-office",
    agreedTerms: true,
  };
  await t.test(
    "Public booking computes price server-side and retries once",
    async () => {
      const body = {
        tripId: trip.id,
        seats: ["A1"],
        passenger,
        holdId: hold.id,
        totalAmount: 1,
      };
      const options = {
        method: "POST",
        headers: {
          "X-Booking-Token": publicToken,
          "Idempotency-Key": "test-booking-unique-key",
        },
        body,
      };
      const r = await request("/public/bookings", options);
      assert.equal(r.status, 201, JSON.stringify(r.data));
      booking = r.data;
      assert.equal(booking.totalAmount, 180000);
      assert.equal(booking.paymentStatus, "unpaid");
      const duplicate = await request("/public/bookings", options);
      assert.equal(duplicate.data.id, booking.id);
    },
  );
  await t.test(
    "Booking visible in operator API, wrong-phone lookup denied",
    async () => {
      const list = await request("/manage/bookings", {
        session: admin,
        tenant: tenant.id,
      });
      assert.equal(list.data.items.length, 1);
      assert.equal(
        (
          await request("/public/lookup", {
            method: "POST",
            body: { code: booking.id, phone: "0901111111" },
          })
        ).status,
        404,
      );
      const r = await request("/public/lookup", {
        method: "POST",
        body: { code: booking.id, phone: passenger.phone },
      });
      assert.equal(r.data.id, booking.id);
    },
  );
  await t.test(
    "Unpaid ticket cannot check in; overpayment rejected",
    async () => {
      assert.equal(
        (
          await request("/manage/bookings/" + booking.id, {
            method: "PATCH",
            session: admin,
            tenant: tenant.id,
            body: { action: "checkin" },
          })
        ).status,
        409,
      );
      assert.equal(
        (
          await request("/manage/ledger", {
            method: "POST",
            session: admin,
            tenant: tenant.id,
            body: {
              bookingId: booking.id,
              kind: "collection",
              amount: 999999,
              method: "cash",
              note: "QA",
            },
          })
        ).status,
        409,
      );
    },
  );
  await t.test("Collect then check in, reject duplicate scan", async () => {
    const r = await request("/manage/ledger", {
      method: "POST",
      session: admin,
      tenant: tenant.id,
      body: {
        bookingId: booking.id,
        kind: "collection",
        amount: 180000,
        method: "cash",
        note: "QA tiền đã đối chiếu",
      },
    });
    assert.equal(r.status, 201, JSON.stringify(r.data));
    assert.equal(
      (
        await request("/manage/bookings/" + booking.id, {
          method: "PATCH",
          session: admin,
          tenant: tenant.id,
          body: { action: "checkin" },
        })
      ).status,
      200,
    );
    assert.equal(
      (
        await request("/manage/bookings/" + booking.id, {
          method: "PATCH",
          session: admin,
          tenant: tenant.id,
          body: { action: "checkin" },
        })
      ).status,
      409,
    );
  });
  let otherTenant, sales;
  await t.test("Second operator and sales account", async () => {
    const r = await request("/platform/tenants", {
      method: "POST",
      session: admin,
      body: { name: "Nhà xe B", slug: "qa-second" },
    });
    otherTenant = r.data;
    assert.equal(r.status, 201);
    const staff = await request("/manage/staff", {
      method: "POST",
      session: admin,
      tenant: tenant.id,
      body: {
        name: "QA Sales",
        email: "sales@example.test",
        password,
        role: "sales",
      },
    });
    assert.equal(staff.status, 201, JSON.stringify(staff));
    const login = await request("/auth/login", {
      method: "POST",
      body: { email: "sales@example.test", password },
    });
    assert.equal(login.status, 200);
    sales = { cookie: login.cookie, csrf: login.data.csrf };
  });
  await t.test(
    "Cross-tenant and role boundaries enforced on server",
    async () => {
      assert.equal(
        (
          await request("/manage/bookings", {
            session: sales,
            tenant: otherTenant.id,
          })
        ).status,
        403,
      );
      assert.equal(
        (
          await request("/manage/reports", {
            session: sales,
            tenant: tenant.id,
          })
        ).status,
        403,
      );
      assert.equal(
        (
          await request("/manage/staff", {
            method: "POST",
            session: sales,
            tenant: tenant.id,
            body: {
              name: "Bad",
              email: "bad@example.test",
              password,
              role: "owner",
            },
          })
        ).status,
        403,
      );
      assert.equal(
        (await request("/platform/tenants", { session: sales })).status,
        403,
      );
    },
  );
  await t.test(
    "Cancel paid ticket marks refund due and frees seat; refund bounds",
    async () => {
      const r = await request("/manage/bookings/" + booking.id, {
        method: "PATCH",
        session: admin,
        tenant: tenant.id,
        body: { action: "cancel" },
      });
      assert.equal(r.status, 200);
      assert.equal(r.data.paymentStatus, "refund_due");
      const search = await request(
        "/public/search?" +
          new URLSearchParams({
            from: "Đà Nẵng",
            to: "Huế",
            date: trip.date,
            passengers: "1",
          }),
      );
      assert.equal(
        search.data.items
          .find((t) => t.id === trip.id)
          .seats.find((s) => s.code === "A1").status,
        "available",
      );
      assert.equal(
        (
          await request("/manage/ledger", {
            method: "POST",
            session: admin,
            tenant: tenant.id,
            body: {
              bookingId: booking.id,
              kind: "refund",
              amount: 180001,
              method: "transfer",
              note: "QA",
            },
          })
        ).status,
        409,
      );
      assert.equal(
        (
          await request("/manage/ledger", {
            method: "POST",
            session: admin,
            tenant: tenant.id,
            body: {
              bookingId: booking.id,
              kind: "refund",
              amount: 180000,
              method: "transfer",
              note: "QA",
            },
          })
        ).status,
        201,
      );
    },
  );
  await t.test(
    "Reject cross-tenant resource IDs and conflicting schedules",
    async () => {
      const vehicles = await request("/manage/vehicles", {
          session: admin,
          tenant: tenant.id,
        }),
        routes = await request("/manage/routes", {
          session: admin,
          tenant: tenant.id,
        });
      const body = {
        vehicleId: vehicles.data.items[0].id,
        routeId: routes.data.items[0].id,
        date: trip.date,
        time: "08:00",
        price: 200000,
      };
      assert.equal(
        (
          await request("/manage/trips", {
            method: "POST",
            session: admin,
            tenant: otherTenant.id,
            body,
          })
        ).status,
        404,
      );
      body.vehicleId = trip.vehicleId;
      body.routeId = trip.routeId;
      assert.equal(
        (
          await request("/manage/trips", {
            method: "POST",
            session: admin,
            tenant: tenant.id,
            body,
          })
        ).status,
        409,
      );
    },
  );
  await t.test("Concurrent holds have exactly one winner", async () => {
    const attempt = () =>
      request("/public/holds", {
        method: "POST",
        headers: { "X-Booking-Token": randomBytes(24).toString("hex") },
        body: { tripId: trip.id, seats: ["A3"] },
      });
    const results = await Promise.all([attempt(), attempt()]);
    assert.deepEqual(results.map((r) => r.status).sort(), [201, 409]);
  });
  await t.test(
    "Partial collection, idempotent ledger retry, cancellation and refund stay consistent",
    async () => {
      const r = await request("/manage/bookings", {
        method: "POST",
        session: admin,
        tenant: tenant.id,
        headers: { "Idempotency-Key": "partial-booking-unique" },
        body: { tripId: trip.id, seats: ["A4"], passenger },
      });
      assert.equal(r.status, 201, JSON.stringify(r.data));
      const key = "partial-ledger-unique";
      const opts = {
        method: "POST",
        session: admin,
        tenant: tenant.id,
        headers: { "Idempotency-Key": key },
        body: {
          bookingId: r.data.id,
          kind: "collection",
          amount: 50000,
          method: "cash",
          note: "QA partial payment",
        },
      };
      const first = await request("/manage/ledger", opts),
        retry = await request("/manage/ledger", opts);
      assert.equal(first.status, 201);
      assert.equal(first.data.id, retry.data.id);
      const cancel = await request("/manage/bookings/" + r.data.id, {
        method: "PATCH",
        session: admin,
        tenant: tenant.id,
        body: { action: "cancel" },
      });
      assert.equal(cancel.data.paymentStatus, "refund_due");
      const refund = await request("/manage/ledger", {
        method: "POST",
        session: admin,
        tenant: tenant.id,
        body: {
          bookingId: r.data.id,
          kind: "refund",
          amount: 50000,
          method: "cash",
          note: "QA refund",
        },
      });
      assert.equal(refund.status, 201);
      const lookup = await request("/public/lookup", {
        method: "POST",
        body: { code: r.data.id, phone: passenger.phone },
      });
      assert.equal(lookup.data.paymentStatus, "refunded");
    },
  );
  await t.test(
    "Recurring schedules roll back every day if any day conflicts",
    async () => {
      const offset = (n) => {
        const d = new Date(trip.date + "T12:00:00Z");
        d.setUTCDate(d.getUTCDate() + n);
        return d.toISOString().slice(0, 10);
      };
      const input = {
        vehicleId: trip.vehicleId,
        routeId: trip.routeId,
        time: "08:00",
        price: 180000,
      };
      assert.equal(
        (
          await request("/manage/trips", {
            method: "POST",
            session: admin,
            tenant: tenant.id,
            body: { ...input, date: offset(2) },
          })
        ).status,
        201,
      );
      const before = (
        await request("/manage/trips", { session: admin, tenant: tenant.id })
      ).data.items.length;
      const result = await request("/manage/trips", {
        method: "POST",
        session: admin,
        tenant: tenant.id,
        body: { ...input, date: offset(1), repeatDays: 2 },
      });
      assert.equal(result.status, 409);
      assert.equal(
        (await request("/manage/trips", { session: admin, tenant: tenant.id }))
          .data.items.length,
        before,
      );
    },
  );
  await t.test(
    "Draft not public and suspension hides operator inventory",
    async () => {
      const r = await request("/platform/tenants/" + tenant.id, {
        method: "PATCH",
        session: admin,
        body: { status: "suspended", autoPublish: true },
      });
      assert.equal(r.status, 200);
      const s = await request(
        "/public/search?" +
          new URLSearchParams({
            from: "Đà Nẵng",
            to: "Huế",
            date: trip.date,
            passengers: "1",
          }),
      );
      assert.equal(s.data.items.length, 0);
      assert.equal(
        (await request("/manage/bookings", { session: sales })).status,
        401,
      );
      await request("/platform/tenants/" + tenant.id, {
        method: "PATCH",
        session: admin,
        body: { status: "active", autoPublish: true },
      });
    },
  );
  await t.test("Reports and audit persist real operations", async () => {
    const report = await request("/manage/reports", {
      session: admin,
      tenant: tenant.id,
    });
    assert.equal(report.status, 200);
    assert.equal(report.data.routes[0].collected, 180000 + 50000);
    assert.equal(report.data.routes[0].refunded, 180000 + 50000);
    assert.equal(
      report.data.summary.collected - report.data.summary.refunded,
      0,
    );
    const a = await request("/manage/audit", {
      session: admin,
      tenant: tenant.id,
    });
    assert.ok(a.data.items.some((i) => i.action === "bookings.create"));
  });
  await t.test(
    "Dashboard shows actual totals and uploads reject active content",
    async () => {
      const dash = await request("/manage/dashboard", {
        session: admin,
        tenant: tenant.id,
      });
      assert.equal(dash.status, 200);
      assert.equal(dash.data.totals.bookings, 0);
      assert.equal(dash.data.days.length, 7);
      assert.ok(dash.data.totals.trips >= 15);
      const bad = await request("/manage/upload", {
        method: "POST",
        session: admin,
        tenant: tenant.id,
        body: {
          data: Buffer.from('<svg onload="alert(1)"/>').toString("base64"),
        },
      });
      assert.equal(bad.status, 422);
    },
  );
  await t.test(
    "Operator profiles and shared app expose separate brands",
    async () => {
      const profile = await request("/public/operators/cua-ong-limousine");
      assert.equal(profile.status, 200);
      assert.equal(profile.data.name, "Cửa Ông Limousine");
      assert.equal(profile.data.appEnabled, true);
      assert.ok(
        profile.data.profileUrl.includes("danava.com/nha-xe/cua-ong-limousine"),
      );
      const platform = await request("/public/context", {
        headers: { Host: "app.danavago.com" },
      });
      assert.equal(platform.data.kind, "platform-app");
      const own = await request("/public/context", {
        headers: { Host: "cuaonglimousine.danavago.com" },
      });
      assert.equal(own.data.kind, "operator");
      assert.equal(own.data.operator.id, profile.data.id);
    },
  );
  await t.test(
    "Operator app cannot search or reserve another operator inventory",
    async () => {
      const headers = { Host: "cuaonglimousine.danavago.com" };
      const s = await request(
        "/public/search?" +
          new URLSearchParams({
            from: "Đà Nẵng",
            to: "Huế",
            date: trip.date,
            operator: tenant.id,
          }),
        { headers },
      );
      assert.equal(s.status, 403);
      const h = await request("/public/holds", {
        method: "POST",
        headers: {
          ...headers,
          "X-Booking-Token": randomBytes(24).toString("hex"),
        },
        body: { tripId: trip.id, seats: ["A8"] },
      });
      assert.equal(h.status, 403);
      const q = await request("/public/lookup", {
        method: "POST",
        headers,
        body: { code: booking.id, phone: passenger.phone },
      });
      assert.equal(q.status, 404);
    },
  );
  await t.test(
    "Domain registration stays pending and is tenant-scoped",
    async () => {
      const config = {
        appEnabled: true,
        appSlug: "danavagotest",
        customDomain: "tickets.danava-review.example",
      };
      const created = await request("/manage/app", {
        method: "PATCH",
        session: admin,
        tenant: tenant.id,
        body: config,
      });
      assert.equal(created.status, 200);
      const d = created.data.domains.find((d) => d.type === "custom");
      assert.equal(d.status, "pending");
      assert.ok(d.verificationRecord[0].startsWith("_danava-challenge."));
      const collision = await request("/manage/app", {
        method: "PATCH",
        session: admin,
        tenant: otherTenant.id,
        body: config,
      });
      assert.equal(collision.status, 409);
      const activate = await request(
        "/platform/domains/" + d.id + "/activate",
        { method: "POST", session: admin, body: { hostingReady: true } },
      );
      assert.equal(activate.status, 409);
      const unknown = await request("/public/context", {
        headers: { Host: d.hostname },
      });
      assert.equal(unknown.status, 404);
    },
  );
  await t.test(
    "Password rotation verifies old password and revokes old sessions",
    async () => {
      const nextPassword = randomBytes(18).toString("hex");
      const bad = await request("/auth/password", {
        method: "PATCH",
        session: admin,
        body: { currentPassword: "wrong", newPassword: nextPassword },
      });
      assert.equal(bad.status, 401);
      const result = await request("/auth/password", {
        method: "PATCH",
        session: admin,
        body: { currentPassword: password, newPassword: nextPassword },
      });
      assert.equal(result.status, 200);
      const old = await request("/manage/trips", {
        session: admin,
        tenant: tenant.id,
      });
      assert.equal(old.status, 401);
      const current = { cookie: result.cookie, csrf: result.data.csrf };
      assert.equal(
        (
          await request("/manage/trips", {
            session: current,
            tenant: tenant.id,
          })
        ).status,
        200,
      );
    },
  );
});
