import { api } from "./platformApi";

/**
 * Crew (tài xế / lơ xe), boarding scans and live trip tracking.
 * Shared by Studio (Chuyến chạy) and the app's crew / owner / customer screens.
 * Backend: Admin\TrackingController, Admin\CheckinController, TrackingService.
 */

export type CrewPosition = "driver" | "assistant";
export interface CrewMember {
  id: string;
  partner_id: string;
  name: string;
  phone: string;
  position: CrewPosition;
  license: string;
  active: boolean;
  login: string | null;
}

export type TrackingState = "scheduled" | "running" | "finished";
export interface TrackingStop {
  id: string;
  kind: "pickup" | "dropoff";
  name: string;
  address: string;
  time: string;
  lat: number | null;
  lng: number | null;
}
export interface TrackingPosition {
  lat: number;
  lng: number;
  speed: number | null;
  heading: number | null;
  accuracy: number | null;
  at: string;
  offRoute: boolean;
  routeDistanceM: number | null;
  stale: boolean;
}
export interface TrackingEvent {
  type: "started" | "off_route" | "back_on_route" | "boarded" | "finished" | string;
  label: string;
  note: string | null;
  at: string;
}
export interface TripTracking {
  trip: { id: string; code: string; from: string; to: string; departAt: string; endAt: string; status: string; operator: string; vehicle: string; plate: string };
  state: TrackingState;
  stops: TrackingStop[];
  routeChecked: boolean;
  offRouteThresholdM: number;
  position: TrackingPosition | null;
  path: [number, number][];
  events: TrackingEvent[];
}
export interface LiveTrip {
  trip: TripTracking["trip"];
  state: TrackingState;
  position: TrackingPosition | null;
  routeChecked: boolean;
  driver: { id: string; name: string; phone: string } | null;
  assistant: { id: string; name: string; phone: string } | null;
}

export interface CheckinTrip {
  id: string;
  depart_time: string;
  status: string;
  route_name: string;
  plate_number: string;
  capacity: number;
  partner_name: string;
  seats_booked: number;
  seats_boarded: number;
}
export interface CheckinTicket {
  id: string;
  booking_code: string;
  customer_name: string;
  customer_phone: string;
  seats: string[];
  seat_count: number;
  final_amount: number;
  due_amount: number;
  payment_status: string;
  booking_status: string;
  checked_in_at: string | null;
  trip_id: string;
  depart_time: string;
  route_name: string;
  plate_number: string;
  pickup: string | null;
  warnings: string[];
  can_board: boolean;
}

type Ok<T> = { status: number; message?: string; data: T };

export const crewApi = {
  crew: () => api<Ok<CrewMember[]>>("/admin/crew"),
  assign: (tripId: string, body: { driver_id?: string | null; assistant_id?: string | null }) =>
    api<Ok<unknown>>(`/admin/trips/${tripId}/crew`, { method: "PATCH", body }),

  // Boarding: always pass the trip being boarded so a ticket of another bus is refused.
  trips: (date?: string) => api<Ok<{ date: string; trips: CheckinTrip[] }>>(`/admin/checkin/trips${date ? `?date=${date}` : ""}`),
  manifest: (tripId: string) => api<Ok<CheckinTicket[]>>(`/admin/checkin/trips/${tripId}`),
  lookup: (q: string, tripId: string) =>
    api<Ok<CheckinTicket[]>>(`/admin/checkin/lookup?${new URLSearchParams({ q, trip_id: tripId })}`),
  board: (bookingId: string, tripId: string) =>
    api<Ok<CheckinTicket>>(`/admin/checkin/${encodeURIComponent(bookingId)}`, { method: "POST", body: { trip_id: tripId } }),

  // GPS from the crew phone.
  live: (date?: string) => api<Ok<{ date: string; trips: LiveTrip[] }>>(`/admin/tracking/live${date ? `?date=${date}` : ""}`),
  tracking: (tripId: string) => api<Ok<TripTracking>>(`/admin/trips/${tripId}/tracking`),
  start: (tripId: string, coords?: { lat: number; lng: number }) =>
    api<Ok<TripTracking>>(`/admin/trips/${tripId}/tracking/start`, { method: "POST", body: coords ?? {} }),
  position: (tripId: string, p: { lat: number; lng: number; accuracy?: number | null; speed?: number | null; heading?: number | null }) =>
    api<Ok<{ kept: boolean; offRoute: boolean; routeDistanceM: number | null }>>(`/admin/trips/${tripId}/tracking/position`, { method: "POST", body: p }),
  finish: (tripId: string) => api<Ok<TripTracking>>(`/admin/trips/${tripId}/tracking/finish`, { method: "POST", body: {} }),

  // Customers: own ticket (signed in) or ticket code + phone (guest).
  customerTracking: (bookingId: string) => api<TripTracking>(`/customer/bookings/${encodeURIComponent(bookingId)}/tracking`),
  guestTracking: (code: string, phone: string) => api<TripTracking>("/public/tracking", { method: "POST", body: { code, phone } }),
};

/** QR on the e-ticket holds the booking code; accept a URL or text that contains it. */
export function ticketCodeFromScan(raw: string) {
  const text = raw.trim();
  try {
    const u = new URL(text);
    return (u.searchParams.get("code") || u.pathname.split("/").filter(Boolean).pop() || text).toUpperCase();
  } catch {
    return text.toUpperCase();
  }
}
