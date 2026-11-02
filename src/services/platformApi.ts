import type { Booking, PassengerInfo, SearchParams, Trip } from "../types";
export const marketplaceApiEnabled =
  import.meta.env.VITE_BOOKING_MODE !== "demo";
let csrf = "";
let csrfBootstrap: Promise<SessionResponse> | null = null;
export interface OperatorUser {
  id: string;
  tenantId: string | null;
  name: string;
  email: string;
  role: string;
  active: boolean;
  driverId?: string;
}
export interface SessionResponse {
  user: OperatorUser | null;
  csrf: string | null;
  needsSetup?: boolean;
  demoSeedAllowed?: boolean;
}
export async function api<T>(
  path: string,
  options: {
    method?: string;
    body?: unknown;
    tenantId?: string;
    signal?: AbortSignal;
    headers?: Record<string, string>;
  } = {},
): Promise<T> {
  if (
    options.method &&
    !["GET", "HEAD"].includes(options.method.toUpperCase()) &&
    !csrf &&
    path !== "/auth/me"
  )
    await (csrfBootstrap ??= loadSession().finally(() => {
      csrfBootstrap = null;
    }));
  const res = await fetch("/api" + path, {
    method: options.method || "GET",
    credentials: "same-origin",
    signal: options.signal,
    headers: {
      "Content-Type": "application/json",
      ...(csrf ? { "X-CSRF-Token": csrf } : {}),
      ...(options.tenantId ? { "X-Tenant-Id": options.tenantId } : {}),
      ...options.headers,
    },
    ...(options.body !== undefined
      ? { body: JSON.stringify(options.body) }
      : {}),
  });
  const payload = await res.json().catch(() => ({
    error: "API không trả về JSON. Kiểm tra backend đang chạy.",
  }));
  if (!res.ok || payload.error)
    throw new Error(payload.error || "Không thể kết nối hệ thống");
  if (path.startsWith("/auth/") && "csrf" in payload) csrf = payload.csrf || "";
  return payload as T;
}
export const loadSession = () => api<SessionResponse>("/auth/me");
export function bookingToken(): string {
  const key = "danava.booking.token";
  try {
    let token = sessionStorage.getItem(key);
    if (!token) {
      token = Array.from(crypto.getRandomValues(new Uint8Array(24)), (b) =>
        b.toString(16).padStart(2, "0"),
      ).join("");
      sessionStorage.setItem(key, token);
    }
    return token;
  } catch {
    if (!memoryToken)
      memoryToken = Array.from(
        crypto.getRandomValues(new Uint8Array(24)),
        (b) => b.toString(16).padStart(2, "0"),
      ).join("");
    return memoryToken;
  }
}
let memoryToken = "";
export const searchMarketplace = (
  params: SearchParams,
  signal?: AbortSignal,
  operator?: string,
) =>
  api<{ items: Trip[] }>(
    "/public/search?" +
      new URLSearchParams({
        ...params,
        passengers: String(params.passengers),
        ...(operator ? { operator } : {}),
      }),
    { signal },
  );
export const holdSeats = (tripId: string, seats: string[]) =>
  api<{ id: string; expires: number }>("/public/holds", {
    method: "POST",
    body: { tripId, seats },
    headers: { "X-Booking-Token": bookingToken() },
  });
export const releaseHold = (holdId: string) =>
  api("/public/holds/" + encodeURIComponent(holdId), {
    method: "DELETE",
    headers: { "X-Booking-Token": bookingToken() },
  });
export const reserveBooking = (
  trip: Trip,
  seats: string[],
  passenger: PassengerInfo,
  holdId: string,
  key: string,
) =>
  api<Booking>("/public/bookings", {
    method: "POST",
    body: { tripId: trip.id, seats, passenger, holdId },
    headers: { "X-Booking-Token": bookingToken(), "Idempotency-Key": key },
  });
export const lookupRemoteBooking = (code: string, phone: string) =>
  api<Booking>("/public/lookup", { method: "POST", body: { code, phone } });
export async function downloadReport(
  path: string,
  tenantId: string,
  filename: string,
) {
  const res = await fetch("/api" + path, {
    credentials: "same-origin",
    headers: { "X-Tenant-Id": tenantId },
  });
  if (!res.ok || !res.headers.get("content-type")?.includes("text/csv"))
    throw new Error(
      "Không thể xuất báo cáo. Kiểm tra kết nối API và quyền truy cập.",
    );
  const blob = await res.blob(),
    href = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = href;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(href);
}
