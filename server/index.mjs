import { createServer } from "node:http";
import {
  createReadStream,
  existsSync,
  mkdirSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { resolve, extname, join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { timingSafeEqual } from "node:crypto";
import {
  db,
  all,
  one,
  run,
  id,
  now,
  record,
  transaction,
  audit,
} from "./database.mjs";
import {
  ApiError,
  requireThat,
  text,
  integer,
  email,
  phone,
  passwordHash,
  passwordMatches,
  publicUser,
  authenticate,
  requireUser,
  requireRole,
  tenantContext,
  checkMutation,
  beginSession,
  loginAttempt,
  failedAttempt,
  takeRateLimit,
  createUser,
  hashToken,
} from "./security.mjs";
import {
  resource,
  saveRecord,
  tenant,
  saveTrip,
  tripStatus,
  tripRow,
  buildTrip,
  createHold,
  createBooking,
  bookingView,
  changeBooking,
  postLedger,
  dayVN,
  dateValid,
} from "./domain.mjs";
import { createTenant, seedDanava } from "./seed.mjs";
const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const isDev = process.argv.includes("--dev");
const origin = process.env.DANAVA_ORIGIN || "";
const port = Number(process.env.PORT || 8787);
const uploadRoot = resolve(
  process.env.DANAVA_UPLOAD_DIR || join(projectRoot, "var/uploads"),
);
mkdirSync(uploadRoot, { recursive: true, mode: 0o700 });
const canFinance = ["owner", "manager", "accountant"];
const canEdit = ["owner", "manager", "dispatcher"];
const cookieSecure = !isDev;
function output(res, status, data) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  res.end(JSON.stringify(data));
}
async function body(req) {
  let size = 0,
    chunks = [];
  for await (const chunk of req) {
    size += chunk.length;
    requireThat(size <= 6 * 1024 * 1024, 413, "Dữ liệu vượt giới hạn");
    chunks.push(chunk);
  }
  try {
    const value = JSON.parse(Buffer.concat(chunks).toString() || "{}");
    requireThat(
      value && typeof value === "object" && !Array.isArray(value),
      400,
      "JSON cần là object",
    );
    return value;
  } catch {
    throw new ApiError(400, "JSON không hợp lệ");
  }
}
function mappedTenants() {
  return all("SELECT * FROM tenants ORDER BY created_at").map((r) =>
    tenant(r.id),
  );
}
function ownTripRows(tid, user) {
  const rows = all(
    "SELECT * FROM trips WHERE tenant_id=? ORDER BY depart_at DESC",
    tid,
  );
  return user.role === "driver"
    ? rows.filter((r) => r.driver_id && r.driver_id === user.driver_id)
    : rows;
}
function ownBookings(tid, user) {
  const rows = all(
    "SELECT * FROM bookings WHERE tenant_id=? ORDER BY created_at DESC",
    tid,
  );
  if (user.role === "driver") {
    const ids = ownTripRows(tid, user).map((r) => r.id);
    return rows.filter((r) => ids.includes(r.trip_id));
  }
  return rows;
}
function publicBooking(row) {
  const b = bookingView(row);
  delete b.receiptToken;
  return b;
}
function csv(data) {
  const cell = (v) => {
    let s = String(v ?? "");
    if (/^[=+@-]/.test(s)) s = "'" + s;
    return '"' + s.replaceAll('"', '""') + '"';
  };
  return "\uFEFF" + data.map((r) => r.map(cell).join(",")).join("\r\n");
}
function exportCsv(res, filename, rows) {
  res.writeHead(200, {
    "Content-Type": "text/csv; charset=utf-8",
    "Content-Disposition": `attachment; filename="${filename}"`,
    "Cache-Control": "no-store",
  });
  res.end(csv(rows));
}
function publicSeatToken(req) {
  return req.headers["x-booking-token"];
}
const server = createServer(async (req, res) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "same-origin");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  try {
    const url = new URL(req.url, "http://localhost"),
      path = url.pathname,
      method = req.method;
    if (!path.startsWith("/api/")) {
      const isUpload = path.startsWith("/uploads/");
      const root = isUpload ? uploadRoot : join(projectRoot, "dist");
      const requested = isUpload ? path.slice("/uploads/".length) : path;
      let file = resolve(
        root,
        "." + (requested.startsWith("/") ? requested : "/" + requested),
      );
      requireThat(
        file === resolve(root) || file.startsWith(resolve(root) + "/"),
        404,
        "Không tìm thấy",
      );
      const types = {
        ".html": "text/html; charset=utf-8",
        ".js": "text/javascript",
        ".css": "text/css",
        ".svg": "image/svg+xml",
        ".png": "image/png",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".webp": "image/webp",
        ".woff": "font/woff",
        ".woff2": "font/woff2",
        ".ico": "image/x-icon",
      };
      if (!existsSync(file) || !statSync(file).isFile()) {
        requireThat(!isUpload && !extname(path), 404, "Không tìm thấy");
        file = join(root, "index.html");
      }
      requireThat(
        existsSync(file) && types[extname(file)],
        404,
        "Không tìm thấy",
      );
      res.writeHead(200, {
        "Content-Type": types[extname(file)],
        "Cache-Control":
          extname(file) === ".html" ? "no-cache" : "public, max-age=3600",
      });
      createReadStream(file).pipe(res);
      return;
    }
    if (!["GET", "HEAD", "OPTIONS"].includes(method)) {
      const supplied = req.headers.origin;
      const expected = origin || (isDev ? `http://${req.headers.host}` : "");
      requireThat(
        !supplied ||
          supplied === expected ||
          (isDev &&
            !origin &&
            ["localhost", "127.0.0.1", "terminal.local"].includes(
              new URL(supplied).hostname,
            )),
        403,
        "Nguồn yêu cầu không được phép",
      );
      requireThat(
        String(req.headers["content-type"] || "").startsWith(
          "application/json",
        ),
        415,
        "Yêu cầu JSON",
      );
    }
    if (path === "/api/health" && method === "GET")
      return output(res, 200, { ok: true, version: 1 });
    const user = authenticate(req);
    if (path === "/api/auth/me" && method === "GET")
      return output(res, 200, {
        user: user ? publicUser(user) : null,
        csrf: user?.csrf || null,
        needsSetup: !one("SELECT id FROM users LIMIT 1"),
        demoSeedAllowed: isDev || process.env.DANAVA_ALLOW_DEMO_SEED === "true",
      });
    if (path === "/api/auth/setup" && method === "POST") {
      const b = await body(req),
        secret = process.env.DANAVA_SETUP_TOKEN;
      requireThat(
        secret && secret.length >= 24,
        503,
        "Quản trị viên cần cấu hình DANAVA_SETUP_TOKEN trên server",
      );
      const input = String(b.setupToken || "");
      requireThat(
        input.length === secret.length &&
          timingSafeEqual(Buffer.from(input), Buffer.from(secret)),
        403,
        "Mã thiết lập không hợp lệ",
      );
      const hash = await passwordHash(b.password),
        mail = email(b.email),
        name = text(b.name, "Tên");
      const uid = transaction(() => {
        requireThat(
          !one("SELECT id FROM users LIMIT 1"),
          409,
          "Hệ thống đã được thiết lập",
        );
        const uid = id();
        run(
          "INSERT INTO users VALUES(?,NULL,?,?,?,?,1,NULL,?)",
          uid,
          name,
          mail,
          hash,
          "platform",
          now(),
        );
        return uid;
      });
      return output(
        res,
        201,
        beginSession(
          res,
          one("SELECT * FROM users WHERE id=?", uid),
          cookieSecure,
        ),
      );
    }
    if (path === "/api/auth/login" && method === "POST") {
      const b = await body(req),
        mail = email(b.email),
        key = hashToken(mail + ":" + req.socket.remoteAddress);
      loginAttempt(key);
      const found = one("SELECT * FROM users WHERE email=? AND active=1", mail);
      const matches = await passwordMatches(
        b.password,
        found?.password ||
          "00000000000000000000000000000000:" +
            Buffer.alloc(64).toString("hex"),
      );
      if (!found || !matches) {
        failedAttempt(key);
        throw new ApiError(401, "Email hoặc mật khẩu chưa đúng");
      }
      if (found.tenant_id)
        requireThat(
          tenant(found.tenant_id).status === "active",
          403,
          "Nhà xe tạm ngưng",
        );
      run("DELETE FROM auth_attempts WHERE key=?", key);
      return output(res, 200, beginSession(res, found, cookieSecure));
    }
    if (path === "/api/auth/logout" && method === "POST") {
      checkMutation(req, user);
      run("DELETE FROM sessions WHERE token=?", user.session_token);
      res.setHeader(
        "Set-Cookie",
        `danava_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${cookieSecure ? "; Secure" : ""}`,
      );
      return output(res, 200, { ok: true });
    }
    if (path === "/api/auth/password" && method === "PATCH") {
      requireUser(user);
      checkMutation(req, user);
      const b = await body(req);
      const key = hashToken("password:" + user.id);
      loginAttempt(key);
      const matches = await passwordMatches(b.currentPassword, user.password);
      if (!matches) {
        failedAttempt(key);
        throw new ApiError(401, "Mật khẩu hiện tại chưa đúng");
      }
      const hash = await passwordHash(b.newPassword);
      transaction(() => {
        run("UPDATE users SET password=? WHERE id=?", hash, user.id);
        run("DELETE FROM sessions WHERE user_id=?", user.id);
        audit(user, user.tenant_id, "account.password", user.id);
      });
      return output(res, 200, beginSession(res, user, cookieSecure));
    }
    if (path === "/api/public/operators" && method === "GET")
      return output(res, 200, {
        items: mappedTenants()
          .filter((t) => t.status === "active")
          .map((t) => ({
            id: t.id,
            name: t.name,
            slug: t.slug,
            description: t.description,
            logo: t.logo,
            phone: t.phone,
            color: t.color,
          })),
      });
    if (path === "/api/public/cities" && method === "GET") {
      const routes = all(
        "SELECT records.* FROM records JOIN tenants ON tenants.id=records.tenant_id WHERE records.kind='routes' AND tenants.status='active'",
      ).map(record);
      return output(res, 200, {
        items: [...new Set(routes.flatMap((r) => [r.from, r.to]))].sort(),
      });
    }
    if (path === "/api/public/search" && method === "GET") {
      const from = url.searchParams.get("from"),
        to = url.searchParams.get("to"),
        date = url.searchParams.get("date"),
        passengers = Number(url.searchParams.get("passengers") || 1);
      requireThat(
        dateValid(date) &&
          date >= dayVN() &&
          from &&
          to &&
          from !== to &&
          Number.isInteger(passengers) &&
          passengers >= 1 &&
          passengers <= 5,
        422,
        "Thông tin tìm kiếm không hợp lệ",
      );
      const rows = all(
        "SELECT trips.* FROM trips JOIN tenants ON tenants.id=trips.tenant_id WHERE trips.status='published' AND tenants.status='active' AND trips.depart_at>? ORDER BY trips.depart_at",
        now(),
      );
      return output(res, 200, {
        items: rows
          .filter((r) => {
            const d = JSON.parse(r.data);
            return (
              d.date === date &&
              d.route.from === from &&
              d.route.to === to &&
              (!url.searchParams.get("operator") ||
                r.tenant_id === url.searchParams.get("operator"))
            );
          })
          .map(buildTrip)
          .filter((t) => t.availableSeatsCount >= passengers),
      });
    }
    if (path === "/api/public/holds" && method === "POST") {
      const b = await body(req),
        token = text(publicSeatToken(req), "Mã phiên đặt vé", 150);
      requireThat(token.length >= 24, 422, "Phiên đặt vé không hợp lệ");
      const limitKey = hashToken("holds:" + req.socket.remoteAddress);
      takeRateLimit(limitKey, 60, 60000);
      return output(res, 201, createHold(b.tripId, b.seats, token));
    }
    if (path.startsWith("/api/public/holds/") && method === "DELETE") {
      const token = text(publicSeatToken(req), "Phiên đặt vé", 150);
      const hid = path.split("/").at(-1);
      transaction(() => {
        const h = one(
          "SELECT * FROM holds WHERE id=? AND token=?",
          hid,
          hashToken(token),
        );
        requireThat(h, 404, "Không tìm thấy lượt giữ ghế");
        run("DELETE FROM inventory WHERE hold_id=?", hid);
        run("DELETE FROM holds WHERE id=?", hid);
      });
      return output(res, 200, { ok: true });
    }
    if (path === "/api/public/bookings" && method === "POST") {
      const token = text(publicSeatToken(req), "Phiên đặt vé", 150);
      const b = createBooking(
        await body(req),
        null,
        null,
        token,
        req.headers["idempotency-key"],
      );
      return output(
        res,
        201,
        publicBooking(one("SELECT * FROM bookings WHERE id=?", b.id)),
      );
    }
    if (path === "/api/public/lookup" && method === "POST") {
      const b = await body(req),
        key = hashToken("lookup:" + req.socket.remoteAddress);
      loginAttempt(key);
      const booking = one(
        "SELECT * FROM bookings WHERE id=?",
        String(b.code || ""),
      );
      const p = phone(b.phone);
      if (!booking || bookingView(booking).passenger.phone !== p) {
        failedAttempt(key);
        throw new ApiError(
          404,
          "Không tìm thấy vé với mã và số điện thoại này",
        );
      }
      return output(res, 200, publicBooking(booking));
    }
    // All management routes are authenticated, tenant-scoped and mutation-protected.
    requireUser(user);
    if (!["GET", "HEAD"].includes(method)) checkMutation(req, user);
    if (path === "/api/platform/tenants") {
      requireRole(user, []);
      if (method === "GET") return output(res, 200, { items: mappedTenants() });
      if (method === "POST")
        return output(res, 201, createTenant(await body(req), user));
    }
    if (path === "/api/platform/demo" && method === "POST") {
      requireRole(user, []);
      requireThat(
        isDev || process.env.DANAVA_ALLOW_DEMO_SEED === "true",
        403,
        "Dữ liệu mẫu đã bị tắt trên môi trường này",
      );
      return output(res, 201, seedDanava(user));
    }
    const tenantMatch = path.match(/^\/api\/platform\/tenants\/([\w-]+)$/);
    if (tenantMatch && method === "PATCH") {
      requireRole(user, []);
      const tid = tenantMatch[1],
        b = await body(req),
        old = tenant(tid);
      requireThat(
        ["active", "pending", "suspended"].includes(b.status || old.status),
        422,
        "Trạng thái không hợp lệ",
      );
      const next = {
        ...old,
        autoPublish: b.autoPublish === true,
        commissionBps: integer(
          Number(b.commissionBps ?? old.commissionBps),
          "Phí nền tảng",
          0,
          5000,
        ),
      };
      run(
        "UPDATE tenants SET status=?,data=? WHERE id=?",
        b.status || old.status,
        JSON.stringify(next),
        tid,
      );
      if (b.status === "suspended")
        run(
          "DELETE FROM sessions WHERE user_id IN (SELECT id FROM users WHERE tenant_id=?)",
          tid,
        );
      audit(user, tid, "tenant.status", tid);
      return output(res, 200, tenant(tid));
    }
    const tid = tenantContext(req, user);
    if (path === "/api/manage/settings") {
      if (method === "GET") return output(res, 200, tenant(tid));
      if (method === "PATCH") {
        requireRole(user, ["owner", "manager"]);
        const b = await body(req),
          t = tenant(tid);
        const next = {
          ...t,
          phone: phone(b.phone),
          email: b.email ? email(b.email) : "",
          address: String(b.address || "").slice(0, 300),
          description: String(b.description || "").slice(0, 1500),
          policies: String(b.policies || "").slice(0, 5000),
          color: /^#[0-9a-f]{6}$/i.test(b.color) ? b.color : t.color,
        };
        run(
          "UPDATE tenants SET name=?,data=? WHERE id=?",
          text(b.name, "Tên nhà xe", 150),
          JSON.stringify(next),
          tid,
        );
        audit(user, tid, "settings.update", tid);
        return output(res, 200, tenant(tid));
      }
    }
    if (path === "/api/manage/dashboard" && method === "GET") {
      const trips = ownTripRows(tid, user).map(buildTrip),
        bookings = ownBookings(tid, user).map(bookingView),
        canSeeMoney = ["platform", ...canFinance].includes(user.role);
      const ledgers = canSeeMoney
        ? all(
            "SELECT * FROM ledger WHERE tenant_id=? ORDER BY created_at DESC",
            tid,
          )
        : [];
      const days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(dayVN() + "T12:00:00+07:00");
        d.setDate(d.getDate() - 6 + i);
        const date = new Intl.DateTimeFormat("en-CA", {
          timeZone: "Asia/Ho_Chi_Minh",
        }).format(d);
        return {
          date,
          value: ledgers
            .filter(
              (l) =>
                new Intl.DateTimeFormat("en-CA", {
                  timeZone: "Asia/Ho_Chi_Minh",
                }).format(new Date(l.created_at)) === date,
            )
            .reduce(
              (s, l) =>
                s +
                (l.kind === "collection"
                  ? l.amount
                  : l.kind === "refund"
                    ? -l.amount
                    : 0),
              0,
            ),
        };
      });
      return output(res, 200, {
        trips: trips.filter((t) => t.date === dayVN()),
        upcoming: trips
          .filter((t) => t.departAt > now())
          .sort((a, b) => a.departAt.localeCompare(b.departAt))
          .slice(0, 8),
        totals: {
          trips: trips.length,
          bookings: bookings.filter((b) => b.status !== "cancelled").length,
          seats: bookings
            .filter((b) => b.status !== "cancelled")
            .reduce((s, b) => s + b.selectedSeats.length, 0),
          revenue: canSeeMoney
            ? ledgers
                .filter((l) => l.kind === "collection")
                .reduce((s, l) => s + l.amount, 0)
            : null,
          refunds: canSeeMoney
            ? ledgers
                .filter((l) => l.kind === "refund")
                .reduce((s, l) => s + l.amount, 0)
            : null,
          unpaid: canSeeMoney
            ? bookings
                .filter(
                  (b) =>
                    b.status !== "cancelled" && b.paymentStatus === "unpaid",
                )
                .reduce((s, b) => s + b.totalAmount, 0)
            : null,
        },
        days,
        latest: bookings.slice(0, 6).map((b) => {
          delete b.receiptToken;
          return b;
        }),
      });
    }
    if (path === "/api/manage/trips") {
      if (method === "GET")
        return output(res, 200, {
          items: ownTripRows(tid, user).map(buildTrip),
        });
      if (method === "POST") {
        requireRole(user, canEdit);
        const b = await body(req),
          repeat = integer(Number(b.repeatDays || 1), "Số ngày lặp", 1, 30);
        const trips = transaction(() => {
          const out = [];
          for (let i = 0; i < repeat; i++) {
            const d = new Date(b.date + "T12:00:00+07:00");
            d.setDate(d.getDate() + i);
            out.push(
              saveTrip(
                tid,
                {
                  ...b,
                  date: new Intl.DateTimeFormat("en-CA", {
                    timeZone: "Asia/Ho_Chi_Minh",
                  }).format(d),
                },
                user,
              ),
            );
          }
          return out;
        });
        return output(res, 201, { items: trips });
      }
    }
    const tripMatch = path.match(
      /^\/api\/manage\/trips\/([\w-]+)(?:\/(status|manifest))?$/,
    );
    if (tripMatch) {
      const row = tripRow(tid, tripMatch[1]);
      if (user.role === "driver")
        requireThat(
          row.driver_id && row.driver_id === user.driver_id,
          403,
          "Không phải chuyến được phân công",
        );
      if (method === "GET" && tripMatch[2] === "manifest") {
        const rows = all(
          "SELECT * FROM bookings WHERE trip_id=? AND status!='cancelled'",
          row.id,
        ).map(bookingView);
        return exportCsv(res, "passengers.csv", [
          ["Ma ve", "Ho ten", "Dien thoai", "Ghe", "Diem don", "Trang thai"],
          ...rows.map((b) => [
            b.id,
            b.passenger.fullName,
            b.passenger.phone,
            b.selectedSeats.join(" "),
            b.passenger.pickupStopId,
            b.status,
          ]),
        ]);
      }
      if (method === "PATCH") {
        requireRole(user, canEdit);
        const b = await body(req);
        return output(
          res,
          200,
          tripMatch[2] === "status"
            ? tripStatus(tid, row.id, b.status, user)
            : saveTrip(tid, b, user, row.id),
        );
      }
    }
    if (path === "/api/manage/bookings") {
      if (method === "GET")
        return output(res, 200, {
          items: ownBookings(tid, user).map(publicBooking),
        });
      if (method === "POST") {
        requireRole(user, ["owner", "manager", "dispatcher", "sales"]);
        return output(
          res,
          201,
          createBooking(
            await body(req),
            user,
            tid,
            `counter-${user.id}`,
            req.headers["idempotency-key"],
          ),
        );
      }
    }
    const bookingMatch = path.match(/^\/api\/manage\/bookings\/([\w-]+)$/);
    if (bookingMatch && method === "PATCH") {
      const b = await body(req);
      requireRole(
        user,
        b.action === "checkin"
          ? ["owner", "manager", "dispatcher", "sales", "driver"]
          : ["owner", "manager", "dispatcher", "sales"],
      );
      return output(res, 200, changeBooking(tid, bookingMatch[1], b, user));
    }
    if (path === "/api/manage/ledger") {
      if (method === "GET") {
        requireRole(user, [...canFinance, "sales"]);
        return output(res, 200, {
          items:
            user.role === "sales"
              ? all(
                  "SELECT * FROM ledger WHERE tenant_id=? AND actor_id=? ORDER BY created_at DESC",
                  tid,
                  user.id,
                )
              : all(
                  "SELECT * FROM ledger WHERE tenant_id=? ORDER BY created_at DESC",
                  tid,
                ),
        });
      }
      if (method === "POST") {
        const b = await body(req);
        requireRole(
          user,
          b.kind === "collection" ? [...canFinance, "sales"] : canFinance,
        );
        return output(
          res,
          201,
          postLedger(tid, b, user, req.headers["idempotency-key"]),
        );
      }
    }
    if (path === "/api/manage/reports" && method === "GET") {
      requireRole(user, canFinance);
      const bookings = ownBookings(tid, user).map(bookingView),
        ledger = all("SELECT * FROM ledger WHERE tenant_id=?", tid);
      const report = { routes: [], agencies: [], byDay: [] };
      for (const b of bookings) {
        let r = report.routes.find(
          (r) => r.name === `${b.trip.from} → ${b.trip.to}`,
        );
        if (!r) {
          r = {
            name: `${b.trip.from} → ${b.trip.to}`,
            tickets: 0,
            bookedValue: 0,
            collected: 0,
            refunded: 0,
          };
          report.routes.push(r);
        }
        if (b.status !== "cancelled") {
          r.tickets += b.selectedSeats.length;
          r.bookedValue += b.totalAmount;
        }
        r.collected += ledger
          .filter((l) => l.booking_id === b.id && l.kind === "collection")
          .reduce((s, l) => s + l.amount, 0);
        r.refunded += ledger
          .filter((l) => l.booking_id === b.id && l.kind === "refund")
          .reduce((s, l) => s + l.amount, 0);
      }
      report.agencies = all(
        "SELECT * FROM records WHERE tenant_id=? AND kind='agencies'",
        tid,
      )
        .map(record)
        .map((a) => {
          const bs = bookings.filter(
            (b) => b.agencyId === a.id && b.status !== "cancelled",
          );
          return {
            ...a,
            bookedValue: bs.reduce((s, b) => s + b.totalAmount, 0),
            commissionAccrued: bs
              .filter((b) => b.paymentStatus === "paid")
              .reduce(
                (s, b) =>
                  s +
                  Math.floor(
                    (b.totalAmount * (b.agencyCommissionBps || 0)) / 10000,
                  ),
                0,
              ),
            debt: bs.reduce(
              (s, b) =>
                s +
                b.totalAmount -
                ledger
                  .filter(
                    (l) => l.booking_id === b.id && l.kind === "collection",
                  )
                  .reduce((x, l) => x + l.amount, 0),
              0,
            ),
          };
        });
      report.summary = {
        collected: ledger
          .filter((l) => l.kind === "collection")
          .reduce((s, l) => s + l.amount, 0),
        refunded: ledger
          .filter((l) => l.kind === "refund")
          .reduce((s, l) => s + l.amount, 0),
        expenses: ledger
          .filter((l) => l.kind === "expense")
          .reduce((s, l) => s + l.amount, 0),
        platformFeeAccrued: bookings
          .filter((b) => b.status !== "cancelled" && b.paymentStatus === "paid")
          .reduce(
            (s, b) =>
              s +
              Math.floor(
                (b.totalAmount * (b.platformCommissionBps || 0)) / 10000,
              ),
            0,
          ),
      };
      if (url.searchParams.get("export") === "csv")
        return exportCsv(res, "revenue.csv", [
          ["Tuyen", "Ve", "Gia tri dat", "Da thu", "Da hoan"],
          ...report.routes.map((r) => [
            r.name,
            r.tickets,
            r.bookedValue,
            r.collected,
            r.refunded,
          ]),
        ]);
      return output(res, 200, report);
    }
    if (path === "/api/manage/customers" && method === "GET") {
      requireRole(user, ["owner", "manager", "sales", "accountant"]);
      const customers = new Map();
      for (const b of ownBookings(tid, user).map(bookingView)) {
        let c = customers.get(b.passenger.phone) || {
          ...b.passenger,
          bookings: 0,
          total: 0,
          lastAt: b.createdAt,
        };
        c.bookings++;
        if (b.status !== "cancelled") c.total += b.totalAmount;
        customers.set(b.passenger.phone, c);
      }
      return output(res, 200, { items: [...customers.values()] });
    }
    if (path === "/api/manage/staff") {
      requireRole(user, ["owner", "manager"]);
      if (method === "GET")
        return output(res, 200, {
          items: all("SELECT * FROM users WHERE tenant_id=?", tid).map(
            publicUser,
          ),
        });
      if (method === "POST") {
        const b = await body(req);
        if (b.driverId) resource(tid, "drivers", b.driverId);
        return output(res, 201, await createUser(tid, b, user));
      }
    }
    const staffMatch = path.match(/^\/api\/manage\/staff\/([\w-]+)$/);
    if (staffMatch && method === "PATCH") {
      requireRole(user, ["owner", "manager"]);
      const target = one(
        "SELECT * FROM users WHERE tenant_id=? AND id=?",
        tid,
        staffMatch[1],
      );
      requireThat(target, 404, "Không tìm thấy nhân viên");
      requireThat(
        target.id !== user.id,
        409,
        "Không tự vô hiệu hóa tài khoản đang dùng",
      );
      requireThat(
        user.role !== "manager" || !["owner", "manager"].includes(target.role),
        403,
        "Không được thay đổi tài khoản cấp cao",
      );
      requireThat(
        target.role !== "owner" ||
          all(
            "SELECT id FROM users WHERE tenant_id=? AND role='owner' AND active=1",
            tid,
          ).length > 1,
        409,
        "Không được khóa chủ sở hữu cuối cùng",
      );
      const b = await body(req);
      run("UPDATE users SET active=? WHERE id=?", b.active ? 1 : 0, target.id);
      run("DELETE FROM sessions WHERE user_id=?", target.id);
      audit(user, tid, "staff.active", target.id, { active: !!b.active });
      return output(res, 200, { ok: true });
    }
    if (path === "/api/manage/audit" && method === "GET") {
      requireRole(user, ["owner", "manager"]);
      return output(res, 200, {
        items: all(
          "SELECT audit.*,users.name AS actor FROM audit LEFT JOIN users ON users.id=audit.actor_id WHERE audit.tenant_id=? ORDER BY audit.created_at DESC LIMIT 300",
          tid,
        ),
      });
    }
    if (path === "/api/manage/notices" && method === "GET")
      return output(res, 200, {
        items: all(
          "SELECT notices.*,CASE WHEN notice_reads.user_id IS NULL THEN 0 ELSE 1 END AS read FROM notices LEFT JOIN notice_reads ON notice_reads.notice_id=notices.id AND notice_reads.user_id=? WHERE notices.tenant_id=? ORDER BY created_at DESC LIMIT 100",
          user.id,
          tid,
        ),
      });
    if (path === "/api/manage/notices/read" && method === "POST") {
      run(
        "INSERT OR IGNORE INTO notice_reads SELECT ?,id FROM notices WHERE tenant_id=?",
        user.id,
        tid,
      );
      return output(res, 200, { ok: true });
    }
    if (path === "/api/manage/upload" && method === "POST") {
      requireRole(user, canEdit);
      const b = await body(req),
        data = Buffer.from(String(b.data || ""), "base64");
      requireThat(
        data.length > 0 && data.length <= 3 * 1024 * 1024,
        422,
        "Ảnh tối đa 3MB",
      );
      let ext = data
        .subarray(0, 8)
        .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
        ? "png"
        : data[0] === 255 && data[1] === 216 && data[2] === 255
          ? "jpg"
          : data.subarray(0, 4).toString() === "RIFF" &&
              data.subarray(8, 12).toString() === "WEBP"
            ? "webp"
            : null;
      requireThat(ext, 422, "Chỉ nhận PNG/JPEG/WebP");
      const filename = `${tid}-${id()}.${ext}`;
      writeFileSync(join(uploadRoot, filename), data, {
        mode: 0o600,
        flag: "wx",
      });
      audit(user, tid, "image.upload", filename);
      return output(res, 201, { url: "/uploads/" + filename });
    }
    const recordMatch = path.match(
      /^\/api\/manage\/(vehicles|routes|drivers|branches|agencies|promotions|shifts)(?:\/([\w-]+))?$/,
    );
    if (recordMatch) {
      const kind = recordMatch[1],
        rid = recordMatch[2];
      requireRole(
        user,
        kind === "agencies" || kind === "promotions"
          ? ["owner", "manager", "sales", "accountant"]
          : kind === "shifts"
            ? ["owner", "manager", "dispatcher"]
            : ["owner", "manager", "dispatcher", "sales", "accountant"],
      );
      if (method === "GET")
        return output(res, 200, {
          items: all(
            "SELECT * FROM records WHERE tenant_id=? AND kind=? ORDER BY created_at DESC",
            tid,
            kind,
          ).map(record),
        });
      requireRole(
        user,
        ["agencies", "promotions"].includes(kind)
          ? ["owner", "manager"]
          : canEdit,
      );
      if (method === "POST" || method === "PATCH")
        return output(
          res,
          method === "POST" ? 201 : 200,
          saveRecord(tid, kind, await body(req), user, rid),
        );
      if (method === "DELETE" && rid) {
        resource(tid, kind, rid);
        requireThat(
          !one(
            "SELECT id FROM trips WHERE tenant_id=? AND (vehicle_id=? OR route_id=? OR driver_id=?) LIMIT 1",
            tid,
            rid,
            rid,
            rid,
          ),
          409,
          "Dữ liệu đã được dùng trong lịch chạy; không xóa",
        );
        requireThat(
          !one("SELECT id FROM users WHERE driver_id=?", rid),
          409,
          "Tài xế đã liên kết nhân viên",
        );
        if (kind === "agencies")
          requireThat(
            !all("SELECT data FROM bookings WHERE tenant_id=?", tid).some(
              (r) => JSON.parse(r.data).agencyId === rid,
            ),
            409,
            "Đại lý đã phát sinh vé/công nợ; hãy tạm ngưng thay vì xóa",
          );
        if (kind === "branches")
          requireThat(
            !all("SELECT data FROM trips WHERE tenant_id=?", tid).some(
              (r) => JSON.parse(r.data).branchId === rid,
            ),
            409,
            "Văn phòng đã gắn lịch chạy; không thể xóa",
          );
        run("DELETE FROM records WHERE tenant_id=? AND id=?", tid, rid);
        audit(user, tid, kind + ".delete", rid);
        return output(res, 200, { ok: true });
      }
    }
    throw new ApiError(404, "API không tồn tại");
  } catch (error) {
    const known = error instanceof ApiError;
    if (!known) console.error("API error:", error.message);
    const status = known
      ? error.status
      : String(error.message).includes("UNIQUE")
        ? 409
        : 500;
    output(res, status, {
      error: known
        ? error.message
        : status === 409
          ? "Dữ liệu đã tồn tại"
          : "Không thể xử lý yêu cầu. Vui lòng thử lại.",
    });
  }
});
server.listen(port, "0.0.0.0", () =>
  console.log(`DANAVA API listening on ${port}`),
);
for (const signal of ["SIGTERM", "SIGINT"])
  process.on(signal, () =>
    server.close(() => {
      db.close();
      process.exit(0);
    }),
  );
