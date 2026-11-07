import type { Booking, StopPoint, Trip } from "../../types";
import { addDaysToDateStr, formatVietnamDate } from "../../utils/dateUtils";

/** Fallback for the city picker while /public/cities loads or if it fails. */
export const FALLBACK_CITIES = [
  "Đà Nẵng",
  "Đà Lạt",
  "Nha Trang",
  "Hội An",
  "Huế",
  "Hà Nội",
  "TP. Hồ Chí Minh",
  "Quy Nhơn",
  "Quảng Ninh",
  "Cần Thơ",
  "Hải Phòng",
];

export const MAX_SEATS = 5; // server: seats min 1, max 5

export const money = (n: number) => n.toLocaleString("vi-VN") + "đ";

const WEEKDAYS = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];
const SHORT_WEEKDAYS = ["CN", "Th 2", "Th 3", "Th 4", "Th 5", "Th 6", "Th 7"];
const weekdayIndex = (iso: string) => new Date(`${iso}T00:00:00.000Z`).getUTCDay();
export const weekday = (iso: string) => WEEKDAYS[weekdayIndex(iso)] ?? "";
export const shortWeekday = (iso: string) => SHORT_WEEKDAYS[weekdayIndex(iso)] ?? "";
/** "15/11" from "2026-11-15". */
export const dayMonth = (iso: string) => formatVietnamDate(iso).slice(0, 5);
export const arrivalDate = (trip: Trip, departIso: string) =>
  trip.nextDay ? addDaysToDateStr(departIso, 1) : departIso;

export const seatTotal = (trip: Trip, codes: string[]) =>
  codes.reduce((sum, code) => sum + (trip.seats.find((s) => s.code === code)?.price ?? trip.price), 0);

export const findStop = (stops: StopPoint[], id: string) => stops.find((s) => s.id === id);

export type TicketFilter = "upcoming" | "completed" | "cancelled";
export function ticketBucket(b: Booking, todayIso: string): TicketFilter {
  if (b.status === "cancelled") return "cancelled";
  // A boarded passenger is still travelling until the trip ends: keep the
  // ticket under "Sắp đi" so trip tracking stays one tap away.
  if (b.trip.endAt) return Date.parse(b.trip.endAt) < Date.now() ? "completed" : "upcoming";
  if (b.status === "checked_in" || b.date < todayIso) return "completed";
  return "upcoming";
}

export function paymentLabel(b: Booking): { text: string; paid: boolean } {
  if (b.status === "cancelled") return { text: "Đã hủy", paid: false };
  switch (b.paymentStatus) {
    case "paid":
    case "completed":
      return { text: "Đã thanh toán", paid: true };
    case "refund_due":
      return { text: "Chờ hoàn tiền", paid: false };
    case "refunded":
      return { text: "Đã hoàn tiền", paid: false };
    default:
      return { text: "Chờ thanh toán", paid: false };
  }
}

// "Vé của tôi" without passenger accounts: remember code + phone on this
// device only, then refresh each ticket through POST /public/lookup.
const TICKETS_KEY = "danavago.app.tickets";
export interface SavedTicket {
  code: string;
  phone: string;
}
export function readSavedTickets(key = TICKETS_KEY): SavedTicket[] {
  try {
    const list = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(list)
      ? list.filter((t) => t && typeof t.code === "string" && typeof t.phone === "string").slice(0, 20)
      : [];
  } catch {
    return [];
  }
}
export function saveTicket(code: string, phone: string, key = TICKETS_KEY) {
  try {
    const rest = readSavedTickets(key).filter((t) => t.code !== code);
    localStorage.setItem(key, JSON.stringify([{ code, phone }, ...rest].slice(0, 20)));
  } catch {
    /* private mode: the ticket still shows for this session */
  }
}

export function randomKey() {
  return Array.from(crypto.getRandomValues(new Uint8Array(24)), (b) => b.toString(16).padStart(2, "0")).join("");
}
