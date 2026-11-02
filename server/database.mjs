import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { randomUUID } from "node:crypto";
export const databasePath = resolve(
  process.env.DANAVA_DB || "var/danava.sqlite",
);
mkdirSync(dirname(databasePath), { recursive: true, mode: 0o700 });
export const db = new DatabaseSync(databasePath);
db.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;
CREATE TABLE IF NOT EXISTS tenants(id TEXT PRIMARY KEY, name TEXT NOT NULL, slug TEXT NOT NULL UNIQUE, data TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'active', created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY, tenant_id TEXT REFERENCES tenants(id), name TEXT NOT NULL, email TEXT NOT NULL UNIQUE COLLATE NOCASE, password TEXT NOT NULL, role TEXT NOT NULL, active INTEGER NOT NULL DEFAULT 1, driver_id TEXT, created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), csrf TEXT NOT NULL, expires INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS records(id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL REFERENCES tenants(id), kind TEXT NOT NULL, data TEXT NOT NULL, created_at TEXT NOT NULL, UNIQUE(tenant_id,id));
CREATE INDEX IF NOT EXISTS records_tenant_kind ON records(tenant_id,kind);
CREATE TABLE IF NOT EXISTS trips(id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL REFERENCES tenants(id), vehicle_id TEXT NOT NULL, driver_id TEXT, route_id TEXT NOT NULL, depart_at TEXT NOT NULL, end_at TEXT NOT NULL, status TEXT NOT NULL, data TEXT NOT NULL, created_at TEXT NOT NULL, UNIQUE(tenant_id,id), FOREIGN KEY(tenant_id,vehicle_id) REFERENCES records(tenant_id,id), FOREIGN KEY(tenant_id,route_id) REFERENCES records(tenant_id,id));
CREATE INDEX IF NOT EXISTS trips_schedule ON trips(tenant_id,depart_at);
CREATE TABLE IF NOT EXISTS holds(id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, trip_id TEXT NOT NULL REFERENCES trips(id), token TEXT NOT NULL, expires INTEGER NOT NULL, data TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS bookings(id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL REFERENCES tenants(id), trip_id TEXT NOT NULL REFERENCES trips(id), status TEXT NOT NULL, payment_status TEXT NOT NULL, source TEXT NOT NULL, data TEXT NOT NULL, created_at TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS bookings_tenant_trip ON bookings(tenant_id,trip_id);
CREATE TABLE IF NOT EXISTS inventory(trip_id TEXT NOT NULL REFERENCES trips(id), seat TEXT NOT NULL, hold_id TEXT REFERENCES holds(id), booking_id TEXT REFERENCES bookings(id), PRIMARY KEY(trip_id,seat));
CREATE TABLE IF NOT EXISTS ledger(id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL REFERENCES tenants(id), booking_id TEXT REFERENCES bookings(id), kind TEXT NOT NULL, amount INTEGER NOT NULL CHECK(amount>0), method TEXT NOT NULL, note TEXT NOT NULL, actor_id TEXT NOT NULL REFERENCES users(id), created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS audit(id TEXT PRIMARY KEY, tenant_id TEXT, actor_id TEXT, action TEXT NOT NULL, entity_id TEXT, detail TEXT NOT NULL, created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS notices(id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL REFERENCES tenants(id), title TEXT NOT NULL, created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS notice_reads(user_id TEXT NOT NULL REFERENCES users(id), notice_id TEXT NOT NULL REFERENCES notices(id), PRIMARY KEY(user_id,notice_id));
CREATE TABLE IF NOT EXISTS auth_attempts(key TEXT PRIMARY KEY, attempts INTEGER NOT NULL, until_time INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS idempotency(key TEXT PRIMARY KEY, booking_id TEXT NOT NULL REFERENCES bookings(id));
CREATE TABLE IF NOT EXISTS ledger_requests(key TEXT PRIMARY KEY, fingerprint TEXT NOT NULL, ledger_id TEXT NOT NULL REFERENCES ledger(id));
CREATE TABLE IF NOT EXISTS schema_version(version INTEGER PRIMARY KEY);
INSERT OR IGNORE INTO schema_version VALUES(1);`);
export const id = () => randomUUID();
export const now = () => new Date().toISOString();
export const all = (sql, ...args) => db.prepare(sql).all(...args);
export const one = (sql, ...args) => db.prepare(sql).get(...args);
export const run = (sql, ...args) => db.prepare(sql).run(...args);
let transactionDepth = 0;
export function transaction(fn) {
  const nested = transactionDepth > 0,
    name = "nested_" + transactionDepth++;
  db.exec(nested ? "SAVEPOINT " + name : "BEGIN IMMEDIATE");
  try {
    const result = fn();
    db.exec(nested ? "RELEASE " + name : "COMMIT");
    return result;
  } catch (e) {
    db.exec(nested ? "ROLLBACK TO " + name : "ROLLBACK");
    if (nested) db.exec("RELEASE " + name);
    throw e;
  } finally {
    transactionDepth--;
  }
}
export function audit(actor, tenantId, action, entityId, detail = {}) {
  run(
    "INSERT INTO audit VALUES(?,?,?,?,?,?,?)",
    id(),
    tenantId || null,
    actor?.id || null,
    action,
    entityId || null,
    JSON.stringify(detail),
    now(),
  );
}
export function notify(tenantId, title) {
  run("INSERT INTO notices VALUES(?,?,?,?)", id(), tenantId, title, now());
}
export function expireHolds() {
  const time = Date.now();
  run(
    "DELETE FROM inventory WHERE hold_id IN (SELECT id FROM holds WHERE expires<=?)",
    time,
  );
  run("DELETE FROM holds WHERE expires<=?", time);
}
export function record(row) {
  return row
    ? {
        ...JSON.parse(row.data),
        id: row.id,
        tenantId: row.tenant_id,
        createdAt: row.created_at,
      }
    : null;
}
