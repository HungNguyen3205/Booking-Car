import {
  scrypt as derive,
  randomBytes,
  createHash,
  timingSafeEqual,
} from "node:crypto";
import { promisify } from "node:util";
import { one, run, now, id, audit, transaction } from "./database.mjs";
const scrypt = promisify(derive);
export const hashToken = (s) => createHash("sha256").update(s).digest("hex");
export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}
export function requireThat(condition, status, message) {
  if (!condition) throw new ApiError(status, message);
}
export function text(value, label, max = 200) {
  requireThat(
    typeof value === "string" &&
      value.trim().length > 0 &&
      value.trim().length <= max,
    422,
    `${label} không hợp lệ`,
  );
  return value.trim();
}
export function email(value) {
  const v = text(value, "Email", 200).toLowerCase();
  requireThat(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), 422, "Email không hợp lệ");
  return v;
}
export function phone(value) {
  const v = text(value, "Số điện thoại", 30)
    .replace(/[ .-]/g, "")
    .replace(/^\+84/, "0");
  requireThat(/^0[35789]\d{8}$/.test(v), 422, "Số điện thoại không hợp lệ");
  return v;
}
export function integer(value, label, min = 0, max = 1e10) {
  requireThat(
    Number.isSafeInteger(value) && value >= min && value <= max,
    422,
    `${label} không hợp lệ`,
  );
  return value;
}
export async function passwordHash(value) {
  requireThat(
    typeof value === "string" && value.length >= 12 && value.length <= 200,
    422,
    "Mật khẩu cần từ 12 đến 200 ký tự",
  );
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${(await scrypt(value, salt, 64)).toString("hex")}`;
}
export async function passwordMatches(password, stored) {
  if (typeof password !== "string" || password.length > 200) return false;
  const [salt, hex] = stored.split(":");
  const result = await scrypt(password, salt, 64);
  return timingSafeEqual(result, Buffer.from(hex, "hex"));
}
export function publicUser(user) {
  return {
    id: user.id,
    tenantId: user.tenant_id,
    name: user.name,
    email: user.email,
    role: user.role,
    active: !!user.active,
    driverId: user.driver_id,
  };
}
export function authenticate(req) {
  const raw = (req.headers.cookie || "")
    .split(";")
    .map((s) => s.trim())
    .find((s) => s.startsWith("danava_session="))
    ?.slice(15);
  if (!raw) return null;
  const row = one(
    "SELECT users.*,sessions.csrf,sessions.token AS session_token FROM sessions JOIN users ON users.id=sessions.user_id WHERE sessions.token=? AND sessions.expires>? AND users.active=1",
    hashToken(raw),
    Date.now(),
  );
  if (!row) return null;
  if (row.tenant_id) {
    const tenant = one("SELECT status FROM tenants WHERE id=?", row.tenant_id);
    if (!tenant || tenant.status !== "active") return null;
  }
  return row;
}
export function requireUser(user) {
  requireThat(user, 401, "Vui lòng đăng nhập");
}
export function requireRole(user, roles) {
  requireUser(user);
  requireThat(
    user.role === "platform" || roles.includes(user.role),
    403,
    "Bạn chưa được cấp quyền thao tác này",
  );
}
export function tenantContext(req, user) {
  requireUser(user);
  const requested = req.headers["x-tenant-id"];
  if (user.role === "platform") {
    requireThat(
      typeof requested === "string" &&
        one("SELECT id FROM tenants WHERE id=?", requested),
      422,
      "Chọn nhà xe trước",
    );
    return requested;
  }
  requireThat(
    !requested || requested === user.tenant_id,
    403,
    "Không có quyền truy cập nhà xe khác",
  );
  return user.tenant_id;
}
export function checkMutation(req, user) {
  requireUser(user);
  requireThat(
    req.headers["x-csrf-token"] === user.csrf,
    403,
    "Phiên thao tác không hợp lệ, vui lòng tải lại",
  );
}
export function beginSession(res, user, secure) {
  const token = randomBytes(32).toString("hex"),
    csrf = randomBytes(24).toString("hex");
  run(
    "INSERT INTO sessions VALUES(?,?,?,?)",
    hashToken(token),
    user.id,
    csrf,
    Date.now() + 8 * 3600000,
  );
  res.setHeader(
    "Set-Cookie",
    `danava_session=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=28800${secure ? "; Secure" : ""}`,
  );
  return { user: publicUser(user), csrf };
}
export function loginAttempt(key) {
  const a = one("SELECT * FROM auth_attempts WHERE key=?", key);
  requireThat(
    !a || a.until_time < Date.now() || a.attempts < 8,
    429,
    "Thử đăng nhập quá nhiều lần. Vui lòng chờ 15 phút.",
  );
}
export function failedAttempt(key) {
  const a = one("SELECT * FROM auth_attempts WHERE key=?", key);
  run(
    "INSERT OR REPLACE INTO auth_attempts VALUES(?,?,?)",
    key,
    a && a.until_time > Date.now() ? a.attempts + 1 : 1,
    Date.now() + 900000,
  );
}
export function takeRateLimit(key, limit = 60, windowMs = 60000) {
  const a = one("SELECT * FROM auth_attempts WHERE key=?", key),
    time = Date.now();
  requireThat(
    !a || a.until_time <= time || a.attempts < limit,
    429,
    "Thao tác quá nhanh. Vui lòng thử lại sau ít phút.",
  );
  run(
    "INSERT OR REPLACE INTO auth_attempts VALUES(?,?,?)",
    key,
    a && a.until_time > time ? a.attempts + 1 : 1,
    a && a.until_time > time ? a.until_time : time + windowMs,
  );
}
export async function createUser(tenantId, body, actor) {
  const role = text(body.role || "sales", "Vai trò");
  requireThat(
    [
      "owner",
      "manager",
      "dispatcher",
      "sales",
      "accountant",
      "driver",
    ].includes(role),
    422,
    "Vai trò không hợp lệ",
  );
  if (actor?.role === "manager")
    requireThat(
      !["owner", "manager"].includes(role),
      403,
      "Quản lý không được tạo chủ sở hữu hoặc quản lý khác",
    );
  const hash = await passwordHash(body.password);
  const mail = email(body.email),
    name = text(body.name, "Tên nhân viên", 100);
  return transaction(() => {
    const uid = id();
    requireThat(
      !one("SELECT id FROM users WHERE email=?", mail),
      409,
      "Email đã được sử dụng",
    );
    run(
      "INSERT INTO users VALUES(?,?,?,?,?,?,1,?,?)",
      uid,
      tenantId,
      name,
      mail,
      hash,
      role,
      body.driverId || null,
      now(),
    );
    audit(actor, tenantId, "staff.create", uid, { role });
    return publicUser(one("SELECT * FROM users WHERE id=?", uid));
  });
}
