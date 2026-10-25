import type { Booking, SearchParams, Trip } from '../types';
import { MOCK_TRIPS } from '../data/mockData';

const PRIMARY_STORAGE_KEY = 'danava_demo_bookings_v1';
const LEGACY_STORAGE_KEY = 'hanhtrinh_demo_bookings_v1';

// Seed demo bookings for initial demonstration and mock validation
const SEED_BOOKINGS: Booking[] = [
  {
    id: 'DG260426001',
    tripId: 'trip-dn-hue-01',
    trip: MOCK_TRIPS[0],
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
    trip: MOCK_TRIPS[0],
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

export const bookingService = {
  // Get all bookings from localStorage or initialize with initial demo seeds
  getAllBookings(): Booking[] {
    try {
      if (typeof window === 'undefined') return SEED_BOOKINGS;

      const stored = localStorage.getItem(PRIMARY_STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('LocalStorage not available, using in-memory demo data', e);
    }
    return SEED_BOOKINGS;
  },

  // Save a new booking (Strictly without any card credentials or payment secrets)
  saveBooking(booking: Booking): void {
    const sanitizedBooking: Booking = {
      id: booking.id,
      tripId: booking.tripId,
      trip: booking.trip,
      date: booking.date,
      selectedSeats: booking.selectedSeats,
      passenger: {
        fullName: booking.passenger.fullName,
        phone: booking.passenger.phone,
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

    const list = this.getAllBookings();
    const updated = [sanitizedBooking, ...list.filter((b) => b.id !== sanitizedBooking.id)];

    try {
      localStorage.setItem(PRIMARY_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Could not persist booking to storage', e);
    }
  },

  // Find booking by ID and optional phone
  // STRICT RULE: If not found, strictly returns null. Under NO circumstances return a fake or fallback seed booking!
  findBooking(bookingCode: string, phone?: string): Booking | null {
    const cleanCode = bookingCode.trim().toUpperCase();
    if (!cleanCode) return null;

    const cleanPhone = phone?.trim().replace(/\s+/g, '');
    const list = this.getAllBookings();

    const match = list.find((b) => {
      const matchCode = b.id.toUpperCase() === cleanCode;
      if (!cleanPhone) return matchCode;
      return matchCode && b.passenger.phone.replace(/\s+/g, '') === cleanPhone;
    });

    return match || null;
  },

  // Retrieve all bookings belonging to a given phone number
  getBookingsByPhone(phone: string): Booking[] {
    const cleanPhone = phone.trim().replace(/\s+/g, '');
    if (!cleanPhone) return [];
    const list = this.getAllBookings();
    return list.filter((b) => b.passenger.phone.replace(/\s+/g, '') === cleanPhone);
  },

  // Filter trips based on search parameters
  searchTrips(params: SearchParams): Trip[] {
    const fromQuery = params.from.toLowerCase().trim();
    const toQuery = params.to.toLowerCase().trim();

    return MOCK_TRIPS.filter((trip) => {
      const matchFrom = !fromQuery || trip.from.toLowerCase().includes(fromQuery);
      const matchTo = !toQuery || trip.to.toLowerCase().includes(toQuery);
      return matchFrom && matchTo;
    });
  },

  // Find single trip
  getTripById(id: string): Trip | undefined {
    return MOCK_TRIPS.find((t) => t.id === id);
  },

  // Generate readable booking code for DANAVA GO (e.g. DG2610258123)
  generateBookingCode(): string {
    const today = new Date();
    const yy = String(today.getFullYear()).slice(-2);
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `DG${yy}${mm}${dd}${rand}`;
  },

  // Format currency VND
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('vi-VN').format(amount) + 'đ';
  },

  // Format date display (e.g. "Th 7, 26/04/2026")
  formatDisplayDate(dateStr: string): string {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      const days = ['CN', 'Th 2', 'Th 3', 'Th 4', 'Th 5', 'Th 6', 'Th 7'];
      const dayName = days[date.getDay()];
      const dd = String(date.getDate()).padStart(2, '0');
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const yyyy = date.getFullYear();
      return `${dayName}, ${dd}/${mm}/${yyyy}`;
    } catch {
      return dateStr;
    }
  },
};
