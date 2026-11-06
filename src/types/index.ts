export type VehicleCategory = 'sleeper' | 'limousine' | 'cabin';

export interface Vehicle {
  id: string;
  name: string;
  category: VehicleCategory;
  categoryLabel: string;
  seatsTotal: number;
  floors: 1 | 2;
  image: string;
  heroImage?: string;
  amenities: string[];
  description: string;
  rating: number;
}

export interface StopPoint {
  id: string;
  name: string;
  time: string;
  address: string;
}

export type SeatStatus = 'available' | 'booked' | 'selected' | 'disabled';

export interface Seat {
  id: string;
  code: string;
  floor: 1 | 2;
  row: number;
  col: number; // 1, 2, 3, etc.
  status: SeatStatus;
  price: number;
  type: 'seat' | 'sleeper' | 'cabin';
  /** Seat-group name or operator note, e.g. "Tầng dưới", "VIP". */
  note?: string;
  /** Amount added to the trip fare for this seat (may be negative). */
  surcharge?: number;
}

export interface Trip {
  id: string;
  code: string;
  operator: string;
  vehicle: Vehicle;
  from: string;
  to: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  nextDay?: boolean;
  departureLocation: {
    name: string;
    address: string;
  };
  arrivalLocation: {
    name: string;
    address: string;
  };
  price: number;
  availableSeatsCount: number;
  departureStops: StopPoint[];
  dropoffStops: StopPoint[];
  seats: Seat[];
  /** Seat-map grid from Studio; columns without seats are the aisle. */
  seatGrid?: { cols: number; rows: number };
}

export interface SearchParams {
  from: string;
  to: string;
  date: string;
  passengers: number;
}

export interface PassengerInfo {
  fullName: string;
  phone: string;
  email: string;
  pickupStopId: string;
  dropoffStopId: string;
  note: string;
  agreedTerms: boolean;
}

export interface Booking {
  id: string; // HT250426001
  tripId: string;
  trip: Trip;
  date: string;
  selectedSeats: string[]; // ['A1', 'A2']
  passenger: PassengerInfo;
  totalAmount: number;
  paymentMethod: 'vietqr' | 'momo' | 'vnpay' | 'credit_card' | 'cash' | 'transfer' | 'bank_transfer';
  paymentStatus: 'completed' | 'failed' | 'simulated' | 'unpaid' | 'paid' | 'refund_due' | 'refunded';
  tenantId?: string;
  status?: 'confirmed' | 'cancelled' | 'checked_in';
  createdAt: string;
  /** Present on the online-booking response: the customer account for this phone. */
  account?: { created: boolean; username: string; tempPassword?: string };
}

export type BookingStep = 
  | 'home' 
  | 'search' 
  | 'seat-select' 
  | 'passenger-info' 
  | 'payment' 
  | 'success' 
  | 'lookup';
