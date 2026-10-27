import { getCanonicalLocationId } from '../data/sceneManifest';
import { isValidBookingDate, isCalendarDate, getVietnamTodayDateStr } from '../utils/dateUtils';
import { normalizeVietnamPhone } from '../utils/phoneUtils';
import type { Booking, SearchParams, Trip } from '../types';
import { MOCK_TRIPS } from '../data/mockData';

const PRIMARY_STORAGE_KEY = 'danava_demo_bookings_v1';
const LEGACY_STORAGE_KEY = 'hanhtrinh_demo_bookings_v1';

// Seed demo bookings for initial demonstration and mock validation
const SEED_BOOKINGS: Booking[] = [
  {
    id: 'DG260426001',
    tripId: 'trip-dn-hue-01',
    trip: MOCK_TRIPS.find(trip => trip.id === 'trip-dn-hue-01')!,
    date: '2026-10-28',
    selectedSeats: ['A1', 'A2'],
    passenger: {
      fullName: 'Nguyễn Văn Hùng',
      phone: '0905123456',
      email: 'hung.nguyen@danavago.vn',
      pickupStopId: 'dn-bxtt',
      dropoffStopId: 'hue-bxpn',
      note: 'Mang theo 1 vali hành lý ký gửi',
      agreedTerms: true,
    },
    totalAmount: 360000,
    paymentMethod: 'vietqr',
    paymentStatus: 'completed',
    createdAt: new Date().toISOString(),
  },
  // Legacy code alias for test suite backwards-compatibility
  {
    id: 'HT250426001',
    tripId: 'trip-dn-hue-01',
    trip: MOCK_TRIPS.find(trip => trip.id === 'trip-dn-hue-01')!,
    date: '2026-10-28',
    selectedSeats: ['A1', 'A2'],
    passenger: {
      fullName: 'Nguyễn Văn Hùng',
      phone: '0905123456',
      email: 'hung.nguyen@danavago.vn',
      pickupStopId: 'dn-bxtt',
      dropoffStopId: 'hue-bxpn',
      note: 'Mang theo 1 vali hành lý ký gửi',
      agreedTerms: true,
    },
    totalAmount: 360000,
    paymentMethod: 'vietqr',
    paymentStatus: 'completed',
    createdAt: new Date().toISOString(),
  },
];

let memoryBookings: Booking[] | null = null;
let storageDirty = false;
const isStoredBooking = (value: unknown): value is Booking => {
  if (!value || typeof value !== 'object') return false;
  const b = value as Booking;
  return typeof b.id === 'string' && typeof b.tripId === 'string' && isCalendarDate(b.date)
    && Array.isArray(b.selectedSeats) && b.selectedSeats.every(code => typeof code === 'string')
    && typeof b.passenger?.phone === 'string' && typeof b.passenger?.fullName === 'string'
    && typeof b.trip?.id === 'string' && typeof b.trip?.from === 'string' && typeof b.trip?.to === 'string'
    && typeof b.trip?.vehicle?.name === 'string' && Array.isArray(b.trip?.seats) && Number.isFinite(b.totalAmount);
};

export const bookingService = {
  // Get all bookings from localStorage or initialize with initial demo seeds
  getAllBookings(): Booking[] {
    try {
      if (typeof window === 'undefined') return memoryBookings ?? SEED_BOOKINGS;
      if (storageDirty && memoryBookings) return memoryBookings;

      const stored = localStorage.getItem(PRIMARY_STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed.filter(isStoredBooking);
        }
      }
    } catch (e) {
      console.warn('LocalStorage not available, using in-memory demo data', e);
    }
    return memoryBookings ?? SEED_BOOKINGS;
  },

  // Save a new booking (Strictly without any card credentials or payment secrets)
  saveBooking(booking: Booking): void {
    const previous = this.getAllBookings();
    if (previous.some(b => b.id === booking.id)) return;
    const trip = this.searchTrips({from:booking.trip.from,to:booking.trip.to,date:booking.date,passengers:booking.selectedSeats.length}).find(t=>t.id===booking.tripId);
    const codes = new Set(booking.selectedSeats);
    const selected = trip?.seats.filter(seat=>codes.has(seat.code)) ?? [];
    if (!trip || !codes.size || codes.size !== booking.selectedSeats.length || selected.length !== codes.size
      || selected.some(seat=>seat.status!=='available') || selected.reduce((sum,seat)=>sum+seat.price,0)!==booking.totalAmount) {
      throw new Error('Chỗ hoặc giá vé đã thay đổi. Vui lòng chọn lại chỗ trước khi xác nhận.');
    }
    const sanitizedBooking: Booking = {
      id: booking.id,
      tripId: booking.tripId,
      trip: booking.trip,
      date: booking.date,
      selectedSeats: booking.selectedSeats,
      passenger: {
        fullName: booking.passenger.fullName,
        phone: normalizeVietnamPhone(booking.passenger.phone),
        email: booking.passenger.email,
        pickupStopId: booking.passenger.pickupStopId,
        dropoffStopId: booking.passenger.dropoffStopId,
        note: booking.passenger.note,
        agreedTerms: booking.passenger.agreedTerms,
      },
      totalAmount: booking.totalAmount,
      paymentMethod: booking.paymentMethod,
      paymentStatus: booking.paymentStatus,
      createdAt: booking.createdAt,
    };

    const updated = [sanitizedBooking, ...previous];
    memoryBookings = updated;

    try {
      localStorage.setItem(PRIMARY_STORAGE_KEY, JSON.stringify(updated));
      storageDirty = false;
    } catch (e) {
      storageDirty = true;
      console.warn('Could not persist booking to storage; retained for this session', e);
    }
  },

  // Find booking by ID and optional phone
  // STRICT RULE: If not found, strictly returns null. Under NO circumstances return a fake or fallback seed booking!
  findBooking(bookingCode: string, phone?: string): Booking | null {
    const cleanCode = bookingCode.trim().toUpperCase();
    if (!cleanCode) return null;

    const cleanPhone = phone ? normalizeVietnamPhone(phone) : undefined;
    const list = this.getAllBookings();

    const match = list.find((b) => {
      const matchCode = b.id.toUpperCase() === cleanCode;
      if (!cleanPhone) return matchCode;
      return matchCode && normalizeVietnamPhone(b.passenger.phone) === cleanPhone;
    });

    return match || null;
  },

  // Retrieve all bookings belonging to a given phone number
  getBookingsByPhone(phone: string): Booking[] {
    const cleanPhone = normalizeVietnamPhone(phone);
    if (!cleanPhone) return [];
    const list = this.getAllBookings();
    return list.filter((b) => normalizeVietnamPhone(b.passenger.phone) === cleanPhone);
  },

  // Filter trips based on search parameters
  searchTrips(params: SearchParams): Trip[] {
    if (!params.from.trim() || !params.to.trim() || !isValidBookingDate(params.date)
      || !Number.isInteger(params.passengers) || params.passengers < 1 || params.passengers > 5) return [];
    const from = getCanonicalLocationId(params.from), to = getCanonicalLocationId(params.to);
    if (from === to) return [];
    const bookings = this.getAllBookings().filter(b=>b.date===params.date && ['completed','simulated'].includes(b.paymentStatus));
    return MOCK_TRIPS.filter(trip=>getCanonicalLocationId(trip.from)===from && getCanonicalLocationId(trip.to)===to)
      .map(trip=> {
        const reserved = new Set(bookings.filter(b=>b.tripId===trip.id).flatMap(b=>b.selectedSeats));
        const seats = trip.seats.map(seat=>reserved.has(seat.code) ? {...seat,status:'booked' as const} : {...seat});
        return {...trip,seats,availableSeatsCount:seats.filter(seat=>seat.status==='available').length};
      });
  },

  // Find single trip
  getTripById(id: string): Trip | undefined {
    return MOCK_TRIPS.find((t) => t.id === id);
  },

  // Generate readable booking code for DANAVA GO (e.g. DG2610258123)
  generateBookingCode(): string {
    const prefix = `DG${getVietnamTodayDateStr().slice(2).replace(/-/g, '')}`;
    const existing = new Set(this.getAllBookings().map(b=>b.id));
    let code: string;
    do { code = `${prefix}${crypto.randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase()}`; } while (existing.has(code));
    return code;
  },

  // Format currency VND
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('vi-VN').format(amount) + 'đ';
  },

  // Format date display (e.g. "Th 7, 26/04/2026")
  formatDisplayDate(dateStr: string): string {
    if (!isCalendarDate(dateStr)) return '';
    try {
      const date = new Date(`${dateStr}T00:00:00.000Z`);
      const days = ['CN', 'Th 2', 'Th 3', 'Th 4', 'Th 5', 'Th 6', 'Th 7'];
      const dayName = days[date.getUTCDay()];
      const dd = String(date.getUTCDate()).padStart(2, '0');
      const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
      const yyyy = date.getUTCFullYear();
      return `${dayName}, ${dd}/${mm}/${yyyy}`;
    } catch {
      return dateStr;
    }
  },
};
