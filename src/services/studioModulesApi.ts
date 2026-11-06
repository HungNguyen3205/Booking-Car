import { api } from "./platformApi";

/** API client for the operator Studio modules (backend: /api/admin/*, platform role). */

type Ok<T> = { status: number; message?: string; data: T };
const qs = (p: Record<string, string | undefined>) => {
  const clean = Object.entries(p).filter(([, v]) => v !== undefined && v !== "") as [string, string][];
  return clean.length ? `?${new URLSearchParams(clean)}` : "";
};

export interface PermissionInfo { code: string; name: string; group: string; description: string }
export interface PermissionGroup {
  id: string; partner_id: string | null; partner_name: string | null; name: string;
  description: string | null; permissions: string[]; member_count: number; scope: "platform" | "partner";
}

export interface CashEntry {
  id: string; partner_id: string | null; partner_name?: string | null; type: "in" | "out"; category: string;
  amount: number; method: "cash" | "transfer" | "card"; booking_id: string | null; note: string | null;
  occurred_on: string; created_by: string | null;
}
export interface Cashbook {
  from: string; to: string; opening_balance: number; total_in: number; total_out: number; closing_balance: number;
  by_category: { type: "in" | "out"; category: string; total: number; count: number }[];
  entries: CashEntry[]; categories: { in: Record<string, string>; out: Record<string, string> };
}
export interface Debts {
  receivable_total: number; receivable_overdue: number; payable_total: number;
  receivables: { id: string; booking_code: string; customer_name: string; customer_phone: string; final_amount: number; payment_status: string; depart_time: string | null; partner_name: string | null; overdue: boolean }[];
  payables: { id: string; code: string; period_start: string; period_end: string; payout_amount: number; status: string; partner_name: string | null }[];
}

export type AttendanceStatus = "present" | "late" | "leave" | "absent";
export interface AttendanceDay { status: AttendanceStatus; check_in: string | null; check_out: string | null; note: string | null }
export interface AttendanceSheet {
  month: string; days_in_month: number;
  staff: { id: string; name: string; email: string; role: string; partner_name: string | null; shift_start: string; days: Record<string, AttendanceDay> }[];
}
export interface PayrollRow {
  id: string; name: string; email: string; role: string; partner_name: string | null;
  base_salary: number; commission_rate: number; standard_days: number; shift_start: string;
  worked_days: number; late_days: number; leave_days: number; absent_days: number;
  tickets_sold: number; sales_revenue: number; salary: number; commission: number; total: number;
}

export interface Audience { partner_id?: string; route_id?: string; min_trips?: number; last_days?: number }
export interface Campaign {
  id: string; partner_id: string | null; partner_name: string | null; name: string; channel: "sms" | "email" | "zalo";
  audience: Audience; message: string; promotion_code: string | null; status: "draft" | "scheduled" | "cancelled";
  scheduled_at: string | null; audience_count: number; created_at: string;
}
export interface Review {
  id: string; booking_id: string; booking_code: string | null; partner_name: string | null; route_name: string | null;
  depart_time: string | null; customer_name: string | null; rating: number; comment: string | null;
  status: "visible" | "hidden"; reply: string | null; replied_at: string | null; created_at: string;
}

export interface BoardingTicket {
  id: string; booking_code: string; customer_name: string; customer_phone: string; seats: string[]; seat_count: number;
  final_amount: number; payment_status: string; booking_status: string; checked_in_at: string | null; checked_in_by: string | null;
  trip_id: string; depart_time: string | null; route_name: string | null; plate_number: string | null; vehicle_name: string | null;
  partner_name: string | null; warnings: string[]; can_board: boolean;
}
export interface BoardingTrip {
  id: string; depart_time: string; status: string; route_name: string | null; plate_number: string | null;
  capacity: number | null; partner_name: string | null; seats_booked: number; seats_boarded: number;
}

export interface CompareRow {
  id: string; name: string; trips: number; capacity: number; seats_sold: number; occupancy: number | null;
  revenue: number; revenue_per_trip: number; bookings: number; cancel_rate: number | null;
  boarding_rate: number | null; rating: number | null; reviews: number;
}

export const studioModules = {
  // Nhóm quyền
  permissionGroups: (partnerId?: string) =>
    api<Ok<PermissionGroup[]> & { permissions: PermissionInfo[] }>(`/admin/permission-groups${qs({ partner_id: partnerId })}`),
  createPermissionGroup: (body: { name: string; description?: string; partner_id?: string | null; permissions: string[] }) =>
    api<Ok<PermissionGroup>>("/admin/permission-groups", { method: "POST", body }),
  updatePermissionGroup: (id: string, body: Partial<{ name: string; description: string; permissions: string[] }>) =>
    api<Ok<PermissionGroup>>(`/admin/permission-groups/${id}`, { method: "PATCH", body }),
  deletePermissionGroup: (id: string) => api<Ok<null>>(`/admin/permission-groups/${id}`, { method: "DELETE" }),
  assignPermissionGroup: (adminId: string, groupId: string | null) =>
    api<Ok<null>>(`/admin/staff/${adminId}/permission-group`, { method: "PATCH", body: { permission_group_id: groupId } }),

  // Sổ quỹ & công nợ
  cashbook: (p: { from?: string; to?: string; partner_id?: string }) => api<Ok<Cashbook>>(`/admin/cashbook${qs(p)}`),
  addCashEntry: (body: Omit<CashEntry, "id" | "created_by" | "partner_name" | "booking_id"> & { booking_id?: string }) =>
    api<Ok<CashEntry>>("/admin/cashbook", { method: "POST", body }),
  deleteCashEntry: (id: string) => api<Ok<null>>(`/admin/cashbook/${id}`, { method: "DELETE" }),
  debts: (partnerId?: string) => api<Ok<Debts>>(`/admin/debts${qs({ partner_id: partnerId })}`),

  // Chấm công, lương & hoa hồng
  attendance: (month: string, partnerId?: string) => api<Ok<AttendanceSheet>>(`/admin/attendance${qs({ month, partner_id: partnerId })}`),
  markAttendance: (body: { admin_id: string; work_date: string; status: AttendanceStatus | "clear"; check_in?: string; check_out?: string; note?: string }) =>
    api<Ok<unknown>>("/admin/attendance", { method: "POST", body }),
  saveCompensation: (adminId: string, body: { base_salary: number; commission_rate: number; standard_days: number; shift_start: string }) =>
    api<Ok<null>>(`/admin/staff/${adminId}/compensation`, { method: "PUT", body }),
  payroll: (month: string, partnerId?: string) =>
    api<Ok<{ month: string; rows: PayrollRow[]; totals: { salary: number; commission: number; total: number } }>>(`/admin/payroll${qs({ month, partner_id: partnerId })}`),

  // Marketing & đánh giá
  campaigns: () => api<Ok<Campaign[]> & { gateway_connected: boolean }>("/admin/campaigns"),
  previewAudience: (channel: Campaign["channel"], audience: Audience) =>
    api<Ok<{ count: number; sample: { name: string; phone: string; trips: number }[] }>>("/admin/campaigns/preview", { method: "POST", body: { channel, audience } }),
  createCampaign: (body: { name: string; channel: Campaign["channel"]; message: string; promotion_code?: string; scheduled_at?: string; audience: Audience }) =>
    api<Ok<Campaign>>("/admin/campaigns", { method: "POST", body }),
  updateCampaign: (id: string, body: { status: Campaign["status"]; scheduled_at?: string }) =>
    api<Ok<null>>(`/admin/campaigns/${id}`, { method: "PATCH", body }),
  reviews: (p: { partner_id?: string; rating?: string; status?: string }) =>
    api<Ok<{ items: Review[]; average: number | null; distribution: Record<string, number>; unreplied: number }>>(`/admin/reviews${qs(p)}`),
  updateReview: (id: string, body: { status?: Review["status"]; reply?: string | null }) =>
    api<Ok<null>>(`/admin/reviews/${id}`, { method: "PATCH", body }),

  // Soát vé lên xe
  lookupTicket: (q: string, tripId?: string) => api<Ok<BoardingTicket[]>>(`/admin/checkin/lookup${qs({ q, trip_id: tripId })}`),
  board: (id: string) => api<Ok<BoardingTicket>>(`/admin/checkin/${id}`, { method: "POST", body: {} }),
  undoBoard: (id: string) => api<Ok<null>>(`/admin/checkin/${id}`, { method: "DELETE" }),
  boardingTrips: (date: string, partnerId?: string) =>
    api<Ok<{ date: string; trips: BoardingTrip[] }>>(`/admin/checkin/trips${qs({ date, partner_id: partnerId })}`),
  tripManifest: (tripId: string) => api<Ok<BoardingTicket[]>>(`/admin/checkin/trips/${tripId}`),

  // So sánh nhà xe / tuyến
  compare: (p: { from: string; to: string; group: "partner" | "route" }) =>
    api<Ok<{ from: string; to: string; group: string; rows: CompareRow[]; totals: { trips: number; seats_sold: number; capacity: number; revenue: number; occupancy: number | null } }>>(`/admin/reports/compare${qs(p)}`),
};

/** Today / this month in Vietnam time. */
export const vnToday = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh" }).format(new Date());
export const vnMonth = () => vnToday().slice(0, 7);
