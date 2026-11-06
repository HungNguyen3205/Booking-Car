import { api } from "./platformApi";

export interface DashboardStats {
  total_revenue: number;
  today_revenue: number;
  total_tickets_sold: number;
  today_tickets_sold: number;
  today_trips_count: number;
  occupancy_rate: number;
  total_bookings_count?: number;
  pending_bookings_count?: number;
  confirmed_bookings_count?: number;
  completed_bookings_count?: number;
  cancelled_bookings_count?: number;
  vehicles_total?: number;
  vehicles_active?: number;
  vehicles_maintenance?: number;
  total_customers?: number;
  new_customers_week?: number;
  revenue_chart: { label: string; date: string; value: number }[];
  six_month_chart?: { label: string; date: string; value: number }[];
  operator_performance: {
    id: string;
    name: string;
    slug: string;
    trips_count: number;
    tickets_sold: number;
    revenue: number;
    commission_rate: number;
  }[];
  recent_bookings: any[];
}

export interface TicketBookingItem {
  id: string;
  booking_code: string;
  partner_id: string;
  trip_id: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  seats: string[];
  seat_count: number;
  pickup_custom?: string;
  dropoff_custom?: string;
  total_amount: number;
  discount_amount: number;
  final_amount: number;
  payment_status: "unpaid" | "paid" | "partially_paid" | "refund_due" | "refunded";
  booking_status: "pending" | "confirmed" | "checked_in" | "completed" | "cancelled";
  payment_method: string;
  payment_ref?: string;
  notes?: string;
  created_at: string;
  partner?: { id: string; name: string; slug: string; phone?: string };
  trip?: {
    id: string;
    depart_time: string;
    arrive_time: string;
    route?: { name: string; from_city: string; to_city: string };
    vehicle?: { name: string; plate_number: string; category: string };
    driver?: { name: string; phone: string };
  };
  pickup_stop_id?: string | null;
  dropoff_stop_id?: string | null;
  pickup_stop?: { name: string; address?: string };
  dropoff_stop?: { name: string; address?: string };
}

export interface BusTripItem {
  id: string;
  partner_id: string;
  route_id: string;
  bus_vehicle_id: string;
  driver_id?: string;
  depart_time: string;
  arrive_time: string;
  base_price: number;
  status: "draft" | "pending" | "scheduled" | "running" | "completed" | "cancelled";
  booked_seats_count?: number;
  available_seats_count?: number;
  partner?: { id: string; name: string; slug: string };
  route?: { id: string; name: string; from_city: string; to_city: string; duration_minutes: number };
  vehicle?: { id: string; name: string; plate_number: string; category: string; capacity: number; floor_count: number };
  driver?: { id: string; name: string; phone: string };
}

export interface RouteItem {
  id: string;
  partner_id: string;
  name: string;
  from_city: string;
  to_city: string;
  distance_km: number;
  duration_minutes: number;
  base_price: number;
  status: "active" | "inactive";
  partner?: { id: string; name: string; slug: string };
  stops?: {
    id?: string;
    name: string;
    address?: string;
    stop_type: "pickup" | "dropoff" | "both";
    time_offset_minutes: number;
    extra_fee: number;
    sort_order?: number;
  }[];
}

export interface BusVehicleItem {
  id: string;
  partner_id: string;
  seat_layout_id?: string;
  name: string;
  plate_number: string;
  category: "limousine" | "sleeper" | "cabin" | "seating";
  capacity: number;
  floor_count: number;
  amenities?: string[];
  image_url?: string;
  inspection_date?: string;
  status: "active" | "maintenance" | "inactive";
  partner?: { id: string; name: string; slug: string };
  seat_layout?: any;
  seat_codes?: string[];
  /** Live seat map customers book on (Studio seat-map editor). */
  seat_map?: SeatMapData;
}

export interface SeatMapGroup {
  id: string;
  name: string;
  /** Added to the trip fare (VND); may be negative. */
  surcharge: number;
}

export interface SeatMapCell {
  code: string;
  floor: 1 | 2;
  row: number;
  col: number;
  type: "seat" | "sleeper" | "cabin";
  group: string | null;
  note: string;
  disabled: boolean;
  /** Per-seat surcharge when the seat is not in a group. */
  surcharge?: number;
}

export interface SeatMapData {
  cols: number;
  rows: number;
  groups: SeatMapGroup[];
  cells: SeatMapCell[];
}

export interface SeatLayoutItem {
  id: string;
  partner_id?: string;
  name: string;
  vehicle_type: "limousine" | "sleeper" | "seating";
  total_seats: number;
  floors: number;
  rows: number;
  columns: number;
  layout_matrix: any;
  partner?: { id: string; name: string };
}

export interface PassengerItem {
  customer_phone: string;
  customer_name: string;
  customer_email?: string;
  total_bookings: number;
  total_tickets: number;
  total_spent: number;
  last_booking_at: string;
}

export interface PartnerItem {
  id: string;
  name: string;
  slug: string;
  phone: string;
  email?: string;
  address?: string;
  commission_rate: number;
  contract_number?: string;
  bank_name?: string;
  bank_account?: string;
  bank_holder?: string;
  branding?: any;
  status: "active" | "suspended" | "pending";
  trips_count?: number;
  tickets_sold?: number;
  total_revenue?: number;
}

export interface PartnerDomainItem {
  id: string;
  partner_id: string;
  domain?: string;
  subdomain?: string;
  app_slug: string;
  is_verified: boolean;
  ssl_status: string;
  settings?: any;
  partner?: { id: string; name: string; slug: string; phone?: string };
}

export interface PaymentItem {
  id: number;
  booking_id?: string;
  partner_id?: string;
  type: "payment" | "refund" | "payout" | "topup";
  amount: number;
  status: "completed" | "pending" | "failed";
  method: "vnpay" | "momo" | "bank_transfer" | "cash";
  reference_code: string;
  transaction_time: string;
  note?: string;
  proof_image?: string;
  actor_name?: string;
}

export interface ReconciliationItem {
  id: string;
  code: string;
  partner_id: string;
  period_start: string;
  period_end: string;
  total_tickets: number;
  total_revenue: number;
  commission_rate: number;
  commission_amount: number;
  payout_amount: number;
  status: "draft" | "pending_approval" | "confirmed" | "paid";
  settled_at?: string;
  payment_ref?: string;
  notes?: string;
  partner?: { id: string; name: string; bank_name?: string; bank_account?: string; bank_holder?: string };
}

export interface PromotionItem {
  id: string;
  partner_id?: string;
  code: string;
  title: string;
  discount_type: "fixed" | "percent";
  discount_value: number;
  min_order_amount: number;
  max_discount?: number;
  usage_limit: number;
  used_count: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
  partner?: { id: string; name: string };
}

export interface StaffItem {
  id: string;
  ho_ten: string;
  email: string;
  so_dien_thoai?: string;
  dia_chi?: string;
  role: "owner" | "manager" | "dispatcher" | "sales" | "accountant" | "driver" | "platform";
  role_label?: string;
  partner_id?: string | null;
  partner_name?: string;
  permission_group_id?: string | null;
  all_permissions?: string[];
  tinh_trang: number;
  created_at: string;
}

export interface SystemSettingsMap {
  [key: string]: {
    key: string;
    value: any;
    type: string;
    group: string;
    description?: string;
  };
}

// Admin API client methods
export const adminApi = {
  // 1. TỔNG QUAN
  getStatistics: (range: "day" | "week" | "month" = "day", partnerId?: string) =>
    api<{ status: number; data: DashboardStats }>(
      `/admin/statistics?range=${range}${partnerId ? `&partner_id=${partnerId}` : ""}`
    ),

  // 2. VẬN HÀNH - ĐƠN VÉ
  getBookings: (params: Record<string, string> = {}) =>
    api<{ status: number; data: { data: TicketBookingItem[]; total: number } }>(
      `/admin/bookings?${new URLSearchParams(params)}`
    ),
  getBookingDetail: (id: string) =>
    api<{ status: number; data: TicketBookingItem }>(`/admin/bookings/${id}`),
  createBooking: (data: Partial<TicketBookingItem>) =>
    api<{ status: number; message: string; data: TicketBookingItem }>(`/admin/bookings`, {
      method: "POST",
      body: data,
    }),
  updateBooking: (id: string, data: Partial<TicketBookingItem>) =>
    api<{ status: number; message: string; data: TicketBookingItem }>(`/admin/bookings/${id}`, {
      method: "PATCH",
      body: data,
    }),
  confirmPayment: (id: string, paymentData: { method: string; reference_code?: string; amount?: number; note?: string }) =>
    api<{ status: number; message: string; data: TicketBookingItem }>(`/admin/bookings/${id}/confirm-payment`, {
      method: "POST",
      body: paymentData,
    }),
  cancelBooking: (id: string) =>
    api<{ status: number; message: string }>(`/admin/bookings/${id}`, {
      method: "DELETE",
    }),

  // CHUYẾN CHẠY
  getTrips: (params: Record<string, string> = {}) =>
    api<{ status: number; data: { data: BusTripItem[]; total: number } }>(
      `/admin/trips?${new URLSearchParams(params)}`
    ),
  getTripDetail: (id: string) =>
    api<{ status: number; data: BusTripItem & { booked_seats?: string[]; booked_count?: number } }>(
      `/admin/trips/${id}`
    ),
  createTrip: (data: any) =>
    api<{ status: number; message: string; data: BusTripItem }>(`/admin/trips`, {
      method: "POST",
      body: data,
    }),
  updateTrip: (id: string, data: any) =>
    api<{ status: number; message: string; data: BusTripItem }>(`/admin/trips/${id}`, {
      method: "PATCH",
      body: data,
    }),
  getTripManifest: (id: string) =>
    api<{ status: number; data: { trip: BusTripItem; passenger_manifest: TicketBookingItem[] } }>(
      `/admin/trips/${id}/manifest`
    ),
  cancelTrip: (id: string) =>
    api<{ status: number; message: string }>(`/admin/trips/${id}`, {
      method: "DELETE",
    }),

  // TUYẾN & ĐIỂM ĐÓN
  getRoutes: (params: Record<string, string> = {}) =>
    api<{ status: number; data: RouteItem[] }>(`/admin/routes?${new URLSearchParams(params)}`),
  createRoute: (data: any) =>
    api<{ status: number; message: string; data: RouteItem }>(`/admin/routes`, {
      method: "POST",
      body: data,
    }),
  updateRoute: (id: string, data: any) =>
    api<{ status: number; message: string; data: RouteItem }>(`/admin/routes/${id}`, {
      method: "PATCH",
      body: data,
    }),
  deleteRoute: (id: string) =>
    api<{ status: number; message: string }>(`/admin/routes/${id}`, {
      method: "DELETE",
    }),

  // XE & SƠ ĐỒ GHẾ
  getVehicles: (params: Record<string, string> = {}) =>
    api<{ status: number; data: BusVehicleItem[] }>(`/admin/vehicles?${new URLSearchParams(params)}`),
  createVehicle: (data: any) =>
    api<{ status: number; message: string; data: BusVehicleItem }>(`/admin/vehicles`, {
      method: "POST",
      body: data,
    }),
  updateVehicle: (id: string, data: any) =>
    api<{ status: number; message: string; data: BusVehicleItem }>(`/admin/vehicles/${id}`, {
      method: "PATCH",
      body: data,
    }),
  deleteVehicle: (id: string) =>
    api<{ status: number; message: string }>(`/admin/vehicles/${id}`, {
      method: "DELETE",
    }),
  getSeatLayouts: (partnerId?: string) =>
    api<{ status: number; data: SeatLayoutItem[] }>(
      `/admin/seat-layouts${partnerId ? `?partner_id=${partnerId}` : ""}`
    ),
  saveSeatLayout: (data: any) =>
    api<{ status: number; message: string; data: SeatLayoutItem }>(`/admin/seat-layouts`, {
      method: "POST",
      body: data,
    }),

  // HÀNH KHÁCH CRM
  getPassengers: (search: string = "") =>
    api<{ status: number; data: { data: PassengerItem[]; total: number } }>(
      `/admin/passengers?search=${encodeURIComponent(search)}`
    ),
  getPassengerDetail: (phone: string) =>
    api<{ status: number; data: any }>(`/admin/passengers/${encodeURIComponent(phone)}`),
  addPassengerNote: (phone: string, noteData: { note: string; customer_name?: string }) =>
    api<{ status: number; message: string; data: any }>(
      `/admin/passengers/${encodeURIComponent(phone)}/notes`,
      { method: "POST", body: noteData }
    ),

  // 3. ĐỐI TÁC
  getPartners: (params: Record<string, string> = {}) =>
    api<{ status: number; data: PartnerItem[] }>(`/admin/partners?${new URLSearchParams(params)}`),
  createPartner: (data: any) =>
    api<{ status: number; message: string; data: PartnerItem }>(`/admin/partners`, {
      method: "POST",
      body: data,
    }),
  updatePartner: (id: string, data: any) =>
    api<{ status: number; message: string; data: PartnerItem }>(`/admin/partners/${id}`, {
      method: "PATCH",
      body: data,
    }),
  getPartnerDomains: (partnerId?: string) =>
    api<{ status: number; data: PartnerDomainItem[] }>(
      `/admin/partner-domains${partnerId ? `?partner_id=${partnerId}` : ""}`
    ),
  savePartnerDomain: (data: any) =>
    api<{ status: number; message: string; data: PartnerDomainItem }>(`/admin/partner-domains`, {
      method: "POST",
      body: data,
    }),
  verifyPartnerDomain: (id: string) =>
    api<{ status: number; message: string; data: PartnerDomainItem }>(
      `/admin/partner-domains/${id}/verify`,
      { method: "POST" }
    ),

  // 4. TÀI CHÍNH
  getPayments: (params: Record<string, string> = {}) =>
    api<{
      status: number;
      summary: { total_inflow: number; total_outflow: number; net_balance: number; pending_count: number };
      data: { data: PaymentItem[]; total: number };
    }>(`/admin/payments?${new URLSearchParams(params)}`),
  recordPayment: (data: any) =>
    api<{ status: number; message: string; data: PaymentItem }>(`/admin/payments`, {
      method: "POST",
      body: data,
    }),
  updatePaymentStatus: (id: number, status: string, note?: string) =>
    api<{ status: number; message: string; data: PaymentItem }>(`/admin/payments/${id}/status`, {
      method: "PATCH",
      body: { status, note },
    }),
  getReconciliations: (params: Record<string, string> = {}) =>
    api<{
      status: number;
      summary: { total_revenue: number; total_commission: number; total_payout: number; pending_payout: number };
      data: { data: ReconciliationItem[]; total: number };
    }>(`/admin/reconciliations?${new URLSearchParams(params)}`),
  getReconciliationDetail: (id: string) =>
    api<{ status: number; data: { reconciliation: ReconciliationItem; bookings: TicketBookingItem[] } }>(
      `/admin/reconciliations/${id}`
    ),
  generateReconciliation: (data: { partner_id: string; period_start: string; period_end: string; notes?: string }) =>
    api<{ status: number; message: string; data: ReconciliationItem }>(`/admin/reconciliations/generate`, {
      method: "POST",
      body: data,
    }),
  settleReconciliation: (id: string, settleData: { payment_ref: string; notes?: string }) =>
    api<{ status: number; message: string; data: ReconciliationItem }>(
      `/admin/reconciliations/${id}/settle`,
      { method: "POST", body: settleData }
    ),
  getReports: (params: Record<string, string> = {}) =>
    api<{ status: number; data: any }>(`/admin/reports?${new URLSearchParams(params)}`),

  // 5. HỆ THỐNG
  getPromotions: () =>
    api<{ status: number; data: { promotions: PromotionItem[]; posts: any[] } }>(`/admin/promotions`),
  savePromotion: (data: any) =>
    api<{ status: number; message: string; data: PromotionItem }>(`/admin/promotions`, {
      method: "POST",
      body: data,
    }),
  deletePromotion: (id: string) =>
    api<{ status: number; message: string }>(`/admin/promotions/${id}`, {
      method: "DELETE",
    }),
  getStaff: () =>
    api<{ status: number; data: StaffItem[]; roles: any; permissions_matrix: any }>(`/admin/staff`),
  createStaff: (data: any) =>
    api<{ status: number; message: string; data: StaffItem }>(`/admin/staff`, {
      method: "POST",
      body: data,
    }),
  updateStaff: (data: any) =>
    api<{ status: number; message: string; data: StaffItem }>(`/admin/staff/update`, {
      method: "POST",
      body: data,
    }),
  deleteStaff: (id: string) =>
    api<{ status: number; message: string }>(`/admin/staff/delete`, {
      method: "POST",
      body: { id },
    }),
  toggleStaffStatus: (id: string) =>
    api<{ status: number; message: string }>(`/admin/staff/status`, {
      method: "POST",
      body: { id },
    }),
  getSettings: () =>
    api<{ status: number; data: SystemSettingsMap }>(`/admin/settings`),
  updateSettings: (data: Record<string, any>) =>
    api<{ status: number; message: string; data: any }>(`/admin/settings`, {
      method: "PUT",
      body: data,
    }),
  getAuditLogs: (params: Record<string, string> = {}) =>
    api<{ status: number; data: { data: any[]; total: number } }>(
      `/admin/audit-logs?${new URLSearchParams(params)}`
    ),
};
