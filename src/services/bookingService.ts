import type { Booking, SearchParams, Trip } from '../types';
import { MOCK_TRIPS } from '../data/mockData';

const STORAGE_KEY = 'hanhtrinh_demo_bookings_v1';

// Seed demo booking from reference image
const SEED_BOOKINGS: Booking[] = [
  {
    id: 'HT250426001',
    tripId: 'trip-dn-hue-01',
    trip: MOCK_TRIPS[0],
    date: '2026-10-28',
    selectedSeats: ['A1', 'A2'],
    passenger: {
      fullName: 'Nguyễn Văn Hùng',
      phone: '0905123456',
      email: 'hung.nguyen@example.com',
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
  // Get all bookings from localStorage or fallback seed
  getAllBookings(): Booking[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('LocalStorage not available, using in-memory demo data', e);
    }
    return SEED_BOOKINGS;
  },

  // Save a new booking
  saveBooking(booking: Booking): void {
    const list = this.getAllBookings();
    const updated = [booking, ...list.filter(b => b.id !== booking.id)];
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Could not persist booking to storage', e);
    }
  },

  // Find booking by ID and phone
  findBooking(bookingCode: string, phone?: string): Booking | null {
    const list = this.getAllBookings();
    const cleanCode = bookingCode.trim().toUpperCase();
    const cleanPhone = phone?.trim().replace(/\s+/g, '');

    return (
      list.find(b => {
        const matchCode = b.id.toUpperCase() === cleanCode;
        if (!cleanPhone) return matchCode;
        return matchCode && b.passenger.phone.replace(/\s+/g, '') === cleanPhone;
      }) || null
    );
  },

  // Filter trips based on search parameters
  searchTrips(params: SearchParams): Trip[] {
    const fromQuery = params.from.toLowerCase().trim();
    const toQuery = params.to.toLowerCase().trim();

    return MOCK_TRIPS.filter(trip => {
      const matchFrom = !fromQuery || trip.from.toLowerCase().includes(fromQuery);
      const matchTo = !toQuery || trip.to.toLowerCase().includes(toQuery);
      return matchFrom && matchTo;
    });
  },

  // Find single trip
  getTripById(id: string): Trip | undefined {
    return MOCK_TRIPS.find(t => t.id === id);
  },

  // Generate readable booking code
  generateBookingCode(): string {
    const today = new Date();
    const yy = String(today.getFullYear()).slice(-2);
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `HT${yy}${mm}${dd}${rand}`;
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
