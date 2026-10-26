import type { Trip, Vehicle, Seat, StopPoint } from '../types';

export const POPULAR_CITIES = [
  { id: 'da-nang', name: 'Đà Nẵng', province: 'Đà Nẵng' },
  { id: 'hue', name: 'Huế', province: 'Thừa Thiên Huế' },
  { id: 'hoi-an', name: 'Hội An', province: 'Quảng Nam' },
  { id: 'quy-nhon', name: 'Quy Nhơn', province: 'Bình Định' },
  { id: 'nha-trang', name: 'Nha Trang', province: 'Khánh Hòa' },
  { id: 'ha-noi', name: 'Hà Nội', province: 'Hà Nội' },
  { id: 'ho-chi-minh', name: 'TP. Hồ Chí Minh', province: 'Hồ Chí Minh' },
  { id: 'da-lat', name: 'Đà Lạt', province: 'Lâm Đồng' },
];

export const VEHICLE_MODELS: Record<string, Vehicle> = {
  sleeper: {
    id: 'veh_sleeper_34',
    name: 'Giường nằm 34 chỗ',
    category: 'sleeper',
    categoryLabel: 'Giường nằm',
    seatsTotal: 34,
    floors: 2,
    image: '/assets/images/bus_coach_sleeper.png',
    heroImage: '/assets/images/sleeper-premium.webp',
    amenities: ['Wifi tốc độ cao', 'Cổng sạc Type-C', 'Chăn gối kháng khuẩn', 'Nước suối & khăn lạnh', 'Rèm che riêng tư'],
    description: 'Dòng xe khách giường nằm cao cấp, đệm êm giảm chấn đa điểm, không gian thoáng đãng.',
    rating: 4.9,
  },
  limousine: {
    id: 'veh_limousine_16',
    name: 'Limousine VIP 16 chỗ',
    category: 'limousine',
    categoryLabel: 'Limousine',
    seatsTotal: 16,
    floors: 1,
    image: '/assets/images/bus_limousine_vip.png',
    heroImage: '/assets/images/limousine-premium.webp',
    amenities: ['Ghế bọc da ngả 135°', 'Cổng sạc & Đèn đọc sách', 'Tivi trần trung tâm', 'Tủ lạnh mini', 'Nước uống cao cấp'],
    description: 'Trải nghiệm chuyên cơ mặt đất đẳng cấp với không gian rộng rãi, đón trả tận nơi linh hoạt.',
    rating: 4.95,
  },
  cabin: {
    id: 'veh_cabin_royal_22',
    name: 'Cabin VIP 22 phòng',
    category: 'cabin',
    categoryLabel: 'Cabin VIP',
    seatsTotal: 22,
    floors: 2,
    image: '/assets/images/bus_cabin_royal.png',
    heroImage: '/assets/images/bus_cabin_right.png',
    amenities: ['Phòng riêng biệt lập', 'Hệ thống massage đa điểm', 'Màn hình LCD giải trí', 'Tai nghe chống ồn', 'Đồ ăn nhẹ miễn phí'],
    description: 'Phòng khách sạn di động với sự riêng tư tuyệt đối, nội thất ấm cúng và rèm cách âm chuyên dụng.',
    rating: 5.0,
  },
};

// Generate realistic seats for Sleeper 34 (2 floors: Tầng 1: 17 seats A1-A17, Tầng 2: 17 seats B1-B17)
const createSleeperSeats = (basePrice: number, bookedList: string[] = ['A3', 'A4', 'A7', 'A12', 'B2', 'B5', 'B9', 'B14']): Seat[] => {
  const bookedCodes = new Set(bookedList);
  const seats: Seat[] = [];

  // Floor 1 (A)
  for (let i = 1; i <= 17; i++) {
    const code = `A${i}`;
    seats.push({
      id: `seat_${code}`,
      code,
      floor: 1,
      row: Math.ceil(i / 3),
      col: ((i - 1) % 3) + 1,
      status: bookedCodes.has(code) ? 'booked' : 'available',
      price: basePrice,
      type: 'sleeper',
    });
  }

  // Floor 2 (B)
  for (let i = 1; i <= 17; i++) {
    const code = `B${i}`;
    seats.push({
      id: `seat_${code}`,
      code,
      floor: 2,
      row: Math.ceil(i / 3),
      col: ((i - 1) % 3) + 1,
      status: bookedCodes.has(code) ? 'booked' : 'available',
      price: basePrice,
      type: 'sleeper',
    });
  }

  return seats;
};

// Generate realistic seats for Limousine 16 (1 floor)
const createLimousineSeats = (basePrice: number, bookedList: string[] = ['L2', 'L5', 'L9']): Seat[] => {
  const bookedCodes = new Set(bookedList);
  const seats: Seat[] = [];
  for (let i = 1; i <= 16; i++) {
    const code = `L${i}`;
    seats.push({
      id: `seat_${code}`,
      code,
      floor: 1,
      row: Math.ceil(i / 2),
      col: ((i - 1) % 2) + 1,
      status: bookedCodes.has(code) ? 'booked' : 'available',
      price: basePrice,
      type: 'seat',
    });
  }
  return seats;
};

// Generate realistic seats for Royal Cabin 22 (2 floors)
const createCabinSeats = (basePrice: number, bookedList: string[] = ['C1', 'C4', 'C7', 'C15', 'C18']): Seat[] => {
  const bookedCodes = new Set(bookedList);
  const seats: Seat[] = [];
  for (let i = 1; i <= 22; i++) {
    const floor = i <= 11 ? 1 : 2;
    const floorIdx = floor === 1 ? i : i - 11; // 1 to 11 on each floor
    const code = `C${i}`;
    seats.push({
      id: `seat_${code}`,
      code,
      floor,
      row: Math.ceil(floorIdx / 2),
      col: ((floorIdx - 1) % 2) + 1,
      status: bookedCodes.has(code) ? 'booked' : 'available',
      price: basePrice,
      type: 'cabin',
    });
  }
  return seats;
};

const DANANG_PICKUPS: StopPoint[] = [
  { id: 'dn-bxtt', name: 'Bến xe Trung tâm Đà Nẵng', time: '+0 phút', address: '185 Tôn Đức Thắng, Liên Chiểu, Đà Nẵng' },
  { id: 'dn-nvl', name: 'Văn phòng Nguyễn Văn Linh', time: '+25 phút', address: '124 Nguyễn Văn Linh, Hải Châu, Đà Nẵng' },
  { id: 'dn-san-bay', name: 'Sân bay Quốc tế Đà Nẵng', time: '+35 phút', address: 'Cổng ga đến T1, Sân bay Đà Nẵng' },
];

const DANANG_DROPOFFS: StopPoint[] = [
  { id: 'dn-drop-bxtt', name: 'Bến xe Trung tâm Đà Nẵng', time: '+2h15m', address: '185 Tôn Đức Thắng, Liên Chiểu, Đà Nẵng' },
  { id: 'dn-drop-nvl', name: 'Văn phòng Nguyễn Văn Linh', time: '+2h30m', address: '124 Nguyễn Văn Linh, Hải Châu, Đà Nẵng' },
  { id: 'dn-drop-san-bay', name: 'Sân bay Quốc tế Đà Nẵng', time: '+2h45m', address: 'Cổng ga đến T1, Sân bay Đà Nẵng' },
];

const HUE_PICKUPS: StopPoint[] = [
  { id: 'hue-pick-le-loi', name: 'Văn phòng Trung tâm Lê Lợi', time: '+0 phút', address: '14 Lê Lợi, Vĩnh Ninh, TP. Huế' },
  { id: 'hue-pick-bxpn', name: 'Bến xe phía Nam Huế', time: '+15 phút', address: '57 An Dương Vương, TP. Huế' },
];

const HUE_DROPOFFS: StopPoint[] = [
  { id: 'hue-bxpn', name: 'Bến xe phía Nam Huế', time: '+2h15m', address: '57 An Dương Vương, TP. Huế' },
  { id: 'hue-le-loi', name: 'Văn phòng Trung tâm Lê Lợi', time: '+2h30m', address: '14 Lê Lợi, Vĩnh Ninh, TP. Huế' },
  { id: 'hue-dai-noi', name: 'Khu vực Cửa Thượng Tứ (Đại Nội)', time: '+2h45m', address: 'Đường Đoàn Thị Điểm, Thuận Thành, TP. Huế' },
];

const NHATRANG_PICKUPS: StopPoint[] = [
  { id: 'nt-pick-tram-huong', name: 'Quảng trường Tháp Trầm Hương', time: '+0 phút', address: 'Đường Trần Phú, Lộc Thọ, TP. Nha Trang' },
  { id: 'nt-pick-bxpn', name: 'Bến xe phía Nam Nha Trang', time: '+25 phút', address: 'Km 6 Đường 23/10, TP. Nha Trang' },
];

const NHATRANG_DROPOFFS: StopPoint[] = [
  { id: 'nt-drop-bxpn', name: 'Bến xe phía Nam Nha Trang', time: '+8h30m', address: 'Km 6 Đường 23/10, TP. Nha Trang' },
  { id: 'nt-drop-tram-huong', name: 'Quảng trường Tháp Trầm Hương', time: '+8h50m', address: 'Đường Trần Phú, Lộc Thọ, TP. Nha Trang' },
];

const SG_PICKUPS: StopPoint[] = [
  { id: 'sg-pick-q1', name: 'Văn phòng Quận 1 (Phạm Ngũ Lão)', time: '+0 phút', address: '227 Phạm Ngũ Lão, Quận 1, TP. HCM' },
  { id: 'sg-pick-bxmd', name: 'Bến xe Miền Đông Mới', time: '+35 phút', address: '501 Hoàng Hữu Nam, TP. Thủ Đức' },
];

const SG_DROPOFFS: StopPoint[] = [
  { id: 'sg-drop-bxmd', name: 'Bến xe Miền Đông Mới', time: '+16h00m', address: '501 Hoàng Hữu Nam, TP. Thủ Đức' },
  { id: 'sg-drop-q1', name: 'Văn phòng Quận 1 (Phạm Ngũ Lão)', time: '+16h45m', address: '227 Phạm Ngũ Lão, Quận 1, TP. HCM' },
];

const DALAT_DROPOFFS: StopPoint[] = [
  { id: 'dl-drop-bxlt', name: 'Bến xe Liên tỉnh Đà Lạt', time: '+6h30m', address: '01 Tô Hiến Thành, Phường 3, TP. Đà Lạt' },
  { id: 'dl-drop-ho-xh', name: 'Vòng xoay Hồ Xuân Hương', time: '+6h50m', address: 'Đường Trần Quốc Toản, TP. Đà Lạt' },
];

// Helper to create trips with mathematically consistent availableSeatsCount
const createTripData = (
  rawTrip: Omit<Trip, 'availableSeatsCount'> & { availableSeatsCount?: number }
): Trip => {
  const availableSeatsCount = rawTrip.seats.filter((s) => s.status === 'available').length;
  return {
    ...rawTrip,
    availableSeatsCount,
  };
};

export const MOCK_TRIPS: Trip[] = [
  // --- TUYẾN: ĐÀ NẴNG → HUẾ ---
  createTripData({
    id: 'trip-dn-hue-soldout',
    code: 'DG-SOLD',
    operator: 'DANAVA GO LINER (HẾT CHỖ)',
    vehicle: VEHICLE_MODELS.limousine,
    from: 'Đà Nẵng',
    to: 'Huế',
    departureTime: '05:30',
    arrivalTime: '08:00',
    duration: '2h30m',
    departureLocation: { name: 'Văn phòng Nguyễn Văn Linh', address: '124 Nguyễn Văn Linh' },
    arrivalLocation: { name: 'Văn phòng Trung tâm Lê Lợi', address: '14 Lê Lợi' },
    price: 240000,
    departureStops: DANANG_PICKUPS,
    dropoffStops: HUE_DROPOFFS,
    // All 16 seats are booked to test sold-out and unavailable behavior
    seats: createLimousineSeats(
      240000,
      Array.from({ length: 16 }, (_, i) => `L${i + 1}`)
    ),
  }),
  createTripData({
    id: 'trip-dn-hue-free',
    code: 'DG-TEST-0D',
    operator: 'DANAVA GO TEST (0Đ)',
    vehicle: VEHICLE_MODELS.limousine,
    from: 'Đà Nẵng',
    to: 'Huế',
    departureTime: '06:30',
    arrivalTime: '09:00',
    duration: '2h30m',
    departureLocation: { name: 'Văn phòng Nguyễn Văn Linh', address: '124 Nguyễn Văn Linh' },
    arrivalLocation: { name: 'Văn phòng Trung tâm Lê Lợi', address: '14 Lê Lợi' },
    price: 0,
    departureStops: DANANG_PICKUPS,
    dropoffStops: HUE_DROPOFFS,
    seats: createLimousineSeats(0, ['L5', 'L9']),
  }),
  createTripData({
    id: 'trip-dn-hue-01',
    code: 'DG-101',
    operator: 'DANAVA GO EXPRESS',
    vehicle: VEHICLE_MODELS.sleeper,
    from: 'Đà Nẵng',
    to: 'Huế',
    departureTime: '08:00',
    arrivalTime: '10:30',
    duration: '2h30m',
    departureLocation: { name: 'Bến xe Trung tâm Đà Nẵng', address: '185 Tôn Đức Thắng' },
    arrivalLocation: { name: 'Bến xe phía Nam Huế', address: '57 An Dương Vương' },
    price: 180000,
    departureStops: DANANG_PICKUPS,
    dropoffStops: HUE_DROPOFFS,
    seats: createSleeperSeats(180000, ['A3', 'A4', 'A7', 'A12', 'B2', 'B5', 'B9', 'B14']),
  }),
  createTripData({
    id: 'trip-dn-hue-02',
    code: 'DG-102',
    operator: 'DANAVA GO EXPRESS',
    vehicle: VEHICLE_MODELS.sleeper,
    from: 'Đà Nẵng',
    to: 'Huế',
    departureTime: '10:00',
    arrivalTime: '12:30',
    duration: '2h30m',
    departureLocation: { name: 'Bến xe Trung tâm Đà Nẵng', address: '185 Tôn Đức Thắng' },
    arrivalLocation: { name: 'Bến xe phía Nam Huế', address: '57 An Dương Vương' },
    price: 180000,
    departureStops: DANANG_PICKUPS,
    dropoffStops: HUE_DROPOFFS,
    seats: createSleeperSeats(180000, ['A1', 'A3', 'A4', 'A7', 'A12', 'B2', 'B5', 'B8', 'B9', 'B14']),
  }),
  createTripData({
    id: 'trip-dn-hue-03',
    code: 'DG-L01',
    operator: 'DANAVA GO VIP LINER',
    vehicle: VEHICLE_MODELS.limousine,
    from: 'Đà Nẵng',
    to: 'Huế',
    departureTime: '13:15',
    arrivalTime: '15:45',
    duration: '2h30m',
    departureLocation: { name: 'Văn phòng Nguyễn Văn Linh', address: '124 Nguyễn Văn Linh' },
    arrivalLocation: { name: 'Văn phòng Trung tâm Lê Lợi', address: '14 Lê Lợi' },
    price: 240000,
    departureStops: DANANG_PICKUPS,
    dropoffStops: HUE_DROPOFFS,
    seats: createLimousineSeats(240000, ['L2', 'L5', 'L9']),
  }),
  createTripData({
    id: 'trip-dn-hue-04',
    code: 'DG-104',
    operator: 'DANAVA GO EXPRESS',
    vehicle: VEHICLE_MODELS.sleeper,
    from: 'Đà Nẵng',
    to: 'Huế',
    departureTime: '14:30',
    arrivalTime: '17:05',
    duration: '2h35m',
    departureLocation: { name: 'Bến xe Trung tâm Đà Nẵng', address: '185 Tôn Đức Thắng' },
    arrivalLocation: { name: 'Bến xe phía Nam Huế', address: '57 An Dương Vương' },
    price: 200000,
    departureStops: DANANG_PICKUPS,
    dropoffStops: HUE_DROPOFFS,
    seats: createSleeperSeats(200000, ['A2', 'A3', 'A5', 'A7', 'A8', 'A11', 'A14', 'B1', 'B3', 'B4', 'B7', 'B12', 'B15']),
  }),
  createTripData({
    id: 'trip-dn-hue-05',
    code: 'DG-C01',
    operator: 'DANAVA GO ROYAL CABIN',
    vehicle: VEHICLE_MODELS.cabin,
    from: 'Đà Nẵng',
    to: 'Huế',
    departureTime: '16:30',
    arrivalTime: '19:00',
    duration: '2h30m',
    departureLocation: { name: 'Bến xe Trung tâm Đà Nẵng', address: '185 Tôn Đức Thắng' },
    arrivalLocation: { name: 'Bến xe phía Nam Huế', address: '57 An Dương Vương' },
    price: 320000,
    departureStops: DANANG_PICKUPS,
    dropoffStops: HUE_DROPOFFS,
    seats: createCabinSeats(320000, ['C1', 'C4', 'C7', 'C15', 'C18']),
  }),
  createTripData({
    id: 'trip-dn-hue-06',
    code: 'DG-106',
    operator: 'DANAVA GO EXPRESS',
    vehicle: VEHICLE_MODELS.sleeper,
    from: 'Đà Nẵng',
    to: 'Huế',
    departureTime: '18:00',
    arrivalTime: '20:30',
    duration: '2h30m',
    departureLocation: { name: 'Bến xe Trung tâm Đà Nẵng', address: '185 Tôn Đức Thắng' },
    arrivalLocation: { name: 'Bến xe phía Nam Huế', address: '57 An Dương Vương' },
    price: 180000,
    departureStops: DANANG_PICKUPS,
    dropoffStops: HUE_DROPOFFS,
    seats: createSleeperSeats(180000, ['A3', 'A4', 'A6', 'A9', 'A12', 'B2', 'B5', 'B10', 'B14']),
  }),

  // --- TUYẾN NGƯỢC (REVERSE): HUẾ → ĐÀ NẴNG ---
  createTripData({
    id: 'trip-hue-dn-01',
    code: 'DG-R101',
    operator: 'DANAVA GO EXPRESS',
    vehicle: VEHICLE_MODELS.sleeper,
    from: 'Huế',
    to: 'Đà Nẵng',
    departureTime: '07:30',
    arrivalTime: '10:00',
    duration: '2h30m',
    departureLocation: { name: 'Văn phòng Trung tâm Lê Lợi', address: '14 Lê Lợi, TP. Huế' },
    arrivalLocation: { name: 'Bến xe Trung tâm Đà Nẵng', address: '185 Tôn Đức Thắng' },
    price: 180000,
    departureStops: HUE_PICKUPS,
    dropoffStops: DANANG_DROPOFFS,
    seats: createSleeperSeats(180000, ['A2', 'A5', 'B3', 'B8']),
  }),
  createTripData({
    id: 'trip-hue-dn-02',
    code: 'DG-RL01',
    operator: 'DANAVA GO VIP LINER',
    vehicle: VEHICLE_MODELS.limousine,
    from: 'Huế',
    to: 'Đà Nẵng',
    departureTime: '11:00',
    arrivalTime: '13:30',
    duration: '2h30m',
    departureLocation: { name: 'Văn phòng Trung tâm Lê Lợi', address: '14 Lê Lợi, TP. Huế' },
    arrivalLocation: { name: 'Văn phòng Nguyễn Văn Linh', address: '124 Nguyễn Văn Linh' },
    price: 240000,
    departureStops: HUE_PICKUPS,
    dropoffStops: DANANG_DROPOFFS,
    seats: createLimousineSeats(240000, ['L3', 'L7']),
  }),
  createTripData({
    id: 'trip-hue-dn-03',
    code: 'DG-RC01',
    operator: 'DANAVA GO ROYAL CABIN',
    vehicle: VEHICLE_MODELS.cabin,
    from: 'Huế',
    to: 'Đà Nẵng',
    departureTime: '15:30',
    arrivalTime: '18:00',
    duration: '2h30m',
    departureLocation: { name: 'Bến xe phía Nam Huế', address: '57 An Dương Vương' },
    arrivalLocation: { name: 'Bến xe Trung tâm Đà Nẵng', address: '185 Tôn Đức Thắng' },
    price: 320000,
    departureStops: HUE_PICKUPS,
    dropoffStops: DANANG_DROPOFFS,
    seats: createCabinSeats(320000, ['C3', 'C6', 'C12']),
  }),

  // --- TUYẾN: ĐÀ NẴNG → NHA TRANG ---
  createTripData({
    id: 'trip-dn-nt-01',
    code: 'DG-NT01',
    operator: 'DANAVA GO ROYAL CABIN',
    vehicle: VEHICLE_MODELS.cabin,
    from: 'Đà Nẵng',
    to: 'Nha Trang',
    departureTime: '08:30',
    arrivalTime: '17:30',
    duration: '9h00m',
    departureLocation: { name: 'Bến xe Trung tâm Đà Nẵng', address: '185 Tôn Đức Thắng' },
    arrivalLocation: { name: 'Quảng trường Tháp Trầm Hương', address: 'Trần Phú, TP. Nha Trang' },
    price: 450000,
    departureStops: DANANG_PICKUPS,
    dropoffStops: NHATRANG_DROPOFFS,
    seats: createCabinSeats(450000, ['C2', 'C5', 'C10']),
  }),
  createTripData({
    id: 'trip-dn-nt-02',
    code: 'DG-NT02',
    operator: 'DANAVA GO EXPRESS',
    vehicle: VEHICLE_MODELS.sleeper,
    from: 'Đà Nẵng',
    to: 'Nha Trang',
    departureTime: '20:30',
    arrivalTime: '05:30',
    duration: '9h00m',
    nextDay: true,
    departureLocation: { name: 'Bến xe Trung tâm Đà Nẵng', address: '185 Tôn Đức Thắng' },
    arrivalLocation: { name: 'Bến xe phía Nam Nha Trang', address: 'Km 6 Đường 23/10' },
    price: 320000,
    departureStops: DANANG_PICKUPS,
    dropoffStops: NHATRANG_DROPOFFS,
    seats: createSleeperSeats(320000, ['A1', 'A4', 'B2', 'B6']),
  }),

  // --- TUYẾN: NHA TRANG → ĐÀ NẴNG ---
  createTripData({
    id: 'trip-nt-dn-01',
    code: 'DG-NTD01',
    operator: 'DANAVA GO ROYAL CABIN',
    vehicle: VEHICLE_MODELS.cabin,
    from: 'Nha Trang',
    to: 'Đà Nẵng',
    departureTime: '20:00',
    arrivalTime: '05:00',
    duration: '9h00m',
    nextDay: true,
    departureLocation: { name: 'Quảng trường Tháp Trầm Hương', address: 'Trần Phú, TP. Nha Trang' },
    arrivalLocation: { name: 'Bến xe Trung tâm Đà Nẵng', address: '185 Tôn Đức Thắng' },
    price: 450000,
    departureStops: NHATRANG_PICKUPS,
    dropoffStops: DANANG_DROPOFFS,
    seats: createCabinSeats(450000, ['C1', 'C7', 'C14']),
  }),

  // --- TUYẾN: ĐÀ NẴNG → TP. HỒ CHÍ MINH ---
  createTripData({
    id: 'trip-dn-sg-01',
    code: 'DG-SG01',
    operator: 'DANAVA GO ROYAL CABIN',
    vehicle: VEHICLE_MODELS.cabin,
    from: 'Đà Nẵng',
    to: 'TP. Hồ Chí Minh',
    departureTime: '14:00',
    arrivalTime: '06:00',
    duration: '16h00m',
    nextDay: true,
    departureLocation: { name: 'Bến xe Trung tâm Đà Nẵng', address: '185 Tôn Đức Thắng' },
    arrivalLocation: { name: 'Bến xe Miền Đông Mới', address: '501 Hoàng Hữu Nam, TP. Thủ Đức' },
    price: 550000,
    departureStops: DANANG_PICKUPS,
    dropoffStops: SG_DROPOFFS,
    seats: createCabinSeats(550000, ['C1', 'C4', 'C8', 'C15']),
  }),
  createTripData({
    id: 'trip-dn-sg-02',
    code: 'DG-SG02',
    operator: 'DANAVA GO VIP LINER',
    vehicle: VEHICLE_MODELS.limousine,
    from: 'Đà Nẵng',
    to: 'TP. Hồ Chí Minh',
    departureTime: '17:30',
    arrivalTime: '09:30',
    duration: '16h00m',
    nextDay: true,
    departureLocation: { name: 'Văn phòng Nguyễn Văn Linh', address: '124 Nguyễn Văn Linh' },
    arrivalLocation: { name: 'Văn phòng Quận 1', address: '227 Phạm Ngũ Lão, Quận 1' },
    price: 490000,
    departureStops: DANANG_PICKUPS,
    dropoffStops: SG_DROPOFFS,
    seats: createLimousineSeats(490000, ['L2', 'L6', 'L10']),
  }),

  // --- TUYẾN: TP. HỒ CHÍ MINH → ĐÀ NẴNG ---
  createTripData({
    id: 'trip-sg-dn-01',
    code: 'DG-SGD01',
    operator: 'DANAVA GO ROYAL CABIN',
    vehicle: VEHICLE_MODELS.cabin,
    from: 'TP. Hồ Chí Minh',
    to: 'Đà Nẵng',
    departureTime: '15:00',
    arrivalTime: '07:00',
    duration: '16h00m',
    nextDay: true,
    departureLocation: { name: 'Văn phòng Quận 1', address: '227 Phạm Ngũ Lão, Quận 1' },
    arrivalLocation: { name: 'Bến xe Trung tâm Đà Nẵng', address: '185 Tôn Đức Thắng' },
    price: 550000,
    departureStops: SG_PICKUPS,
    dropoffStops: DANANG_DROPOFFS,
    seats: createCabinSeats(550000, ['C2', 'C6', 'C11']),
  }),

  // --- TUYẾN: TP. HỒ CHÍ MINH → ĐÀ LẠT ---
  createTripData({
    id: 'trip-sg-dl-01',
    code: 'DG-DL01',
    operator: 'DANAVA GO ROYAL CABIN',
    vehicle: VEHICLE_MODELS.cabin,
    from: 'TP. Hồ Chí Minh',
    to: 'Đà Lạt',
    departureTime: '22:30',
    arrivalTime: '05:30',
    duration: '7h00m',
    nextDay: true,
    departureLocation: { name: 'Văn phòng Quận 1', address: '227 Phạm Ngũ Lão, Quận 1' },
    arrivalLocation: { name: 'Bến xe Liên tỉnh Đà Lạt', address: '01 Tô Hiến Thành, TP. Đà Lạt' },
    price: 380000,
    departureStops: SG_PICKUPS,
    dropoffStops: DALAT_DROPOFFS,
    seats: createCabinSeats(380000, ['C3', 'C7', 'C12']),
  }),

  // --- TUYẾN ĐỊA PHƯƠNG KHÁC ---
  createTripData({
    id: 'trip-dn-ha-01',
    code: 'DG-HA01',
    operator: 'DANAVA GO VIP LINER',
    vehicle: VEHICLE_MODELS.limousine,
    from: 'Đà Nẵng',
    to: 'Hội An',
    departureTime: '09:00',
    arrivalTime: '09:45',
    duration: '45m',
    departureLocation: { name: 'Sân bay Đà Nẵng', address: 'Cổng T1' },
    arrivalLocation: { name: 'Phố cổ Hội An', address: 'Bến xe Hội An, Huỳnh Thúc Kháng' },
    price: 120000,
    departureStops: DANANG_PICKUPS,
    dropoffStops: [{ id: 'ha-bx', name: 'Bến xe Hội An', time: '+45m', address: 'Huỳnh Thúc Kháng, Hội An' }],
    seats: createLimousineSeats(120000, ['L1', 'L3', 'L6', 'L8', 'L11']),
  }),
  createTripData({
    id: 'trip-dn-ha-02',
    code: 'DG-HA02',
    operator: 'DANAVA GO EXPRESS',
    vehicle: VEHICLE_MODELS.sleeper,
    from: 'Đà Nẵng',
    to: 'Hội An',
    departureTime: '14:00',
    arrivalTime: '14:50',
    duration: '50m',
    departureLocation: { name: 'Bến xe Trung tâm Đà Nẵng', address: '185 Tôn Đức Thắng' },
    arrivalLocation: { name: 'Phố cổ Hội An', address: 'Bến xe Hội An, Huỳnh Thúc Kháng' },
    price: 100000,
    departureStops: DANANG_PICKUPS,
    dropoffStops: [{ id: 'ha-bx', name: 'Bến xe Hội An', time: '+50m', address: 'Huỳnh Thúc Kháng, Hội An' }],
    seats: createSleeperSeats(100000, ['A2', 'A5', 'B1', 'B4']),
  }),
  createTripData({
    id: 'trip-dn-ha-03',
    code: 'DG-HA03',
    operator: 'DANAVA GO ROYAL CABIN',
    vehicle: VEHICLE_MODELS.cabin,
    from: 'Đà Nẵng',
    to: 'Hội An',
    departureTime: '17:30',
    arrivalTime: '18:15',
    duration: '45m',
    departureLocation: { name: 'Văn phòng Nguyễn Văn Linh', address: '124 Nguyễn Văn Linh' },
    arrivalLocation: { name: 'Phố cổ Hội An', address: 'Bến xe Hội An, Huỳnh Thúc Kháng' },
    price: 160000,
    departureStops: DANANG_PICKUPS,
    dropoffStops: [{ id: 'ha-bx', name: 'Bến xe Hội An', time: '+45m', address: 'Huỳnh Thúc Kháng, Hội An' }],
    seats: createCabinSeats(160000, ['C1', 'C3', 'C7', 'C11']),
  }),
  createTripData({
    id: 'trip-dn-qn-01',
    code: 'DG-QN01',
    operator: 'DANAVA GO ROYAL CABIN',
    vehicle: VEHICLE_MODELS.cabin,
    from: 'Đà Nẵng',
    to: 'Quy Nhơn',
    departureTime: '21:00',
    arrivalTime: '03:30',
    duration: '6h30m',
    nextDay: true,
    departureLocation: { name: 'Bến xe Trung tâm Đà Nẵng', address: '185 Tôn Đức Thắng' },
    arrivalLocation: { name: 'Bến xe Trung tâm Quy Nhơn', address: '71 Tây Sơn, Quy Nhơn' },
    price: 360000,
    departureStops: DANANG_PICKUPS,
    dropoffStops: [{ id: 'qn-bx', name: 'Bến xe Quy Nhơn', time: '+6h30m', address: '71 Tây Sơn, Quy Nhơn' }],
    seats: createCabinSeats(360000, ['C2', 'C5', 'C8', 'C11', 'C14', 'C19']),
  }),
];

export const FEATURED_ROUTES = [
  {
    id: 'route-dn-hue',
    from: 'Đà Nẵng',
    to: 'Huế',
    distance: '100 km',
    duration: '2h30m',
    priceFrom: 180000,
    tripsDaily: 14,
    image: '/assets/images/scenes/scene_hue.jpg',
    tag: 'Cầu Rồng • Ngọ Môn Di Sản',
  },
  {
    id: 'route-dn-nt',
    from: 'Đà Nẵng',
    to: 'Nha Trang',
    distance: '530 km',
    duration: '9h00m',
    priceFrom: 320000,
    tripsDaily: 6,
    image: '/assets/images/scenes/scene_danang.jpg',
    tag: 'Biển Ngọc Tháp Trầm Hương',
  },
  {
    id: 'route-dn-sg',
    from: 'Đà Nẵng',
    to: 'TP. Hồ Chí Minh',
    distance: '960 km',
    duration: '16h00m',
    priceFrom: 490000,
    tripsDaily: 8,
    image: '/assets/images/scenes/scene_hoi_an.jpg',
    tag: 'Chuyên Cơ Xuyên Việt',
  },
  {
    id: 'route-sg-dl',
    from: 'TP. Hồ Chí Minh',
    to: 'Đà Lạt',
    distance: '305 km',
    duration: '7h00m',
    priceFrom: 380000,
    tripsDaily: 12,
    image: '/assets/images/hero_landscape_danang_hue.jpg',
    tag: 'Phố Núi Ngàn Hoa',
  },
];

export const FAQ_LIST = [
  {
    question: 'Tôi có thể đổi hoặc hủy vé đã đặt như thế nào?',
    answer: 'DANAVA GO hỗ trợ đổi chuyến miễn phí trước 24 giờ khởi hành qua trang Tra cứu vé hoặc gọi hotline hỗ trợ. Với yêu cầu hủy vé, quý khách sẽ được hoàn tiền theo chính sách demo trong vòng 2-5 phút.',
  },
  {
    question: 'Làm thế nào để nhận vé sau khi thanh toán thành công?',
    answer: 'Ngay khi hoàn tất mô phỏng thanh toán, vé điện tử kèm mã QR sẽ hiển thị trực tiếp trên màn hình. Bạn có thể in vé (PDF), tải ảnh vé hoặc lưu mã đặt vé để tra cứu bất kỳ lúc nào.',
  },
  {
    question: 'Tôi có được chọn vị trí ghế/giường chính xác không?',
    answer: 'Có! Sơ đồ ghế của từng loại xe (Giường nằm, Limousine, Cabin VIP) hiển thị trực quan 100% thời gian thực. Bạn tự do chọn số ghế mong muốn và giữ chỗ ngay lập tức.',
  },
  {
    question: 'Điểm đón và trả khách có linh hoạt không?',
    answer: 'Hệ thống cung cấp danh sách điểm đón/trả chính xác kèm thời gian dự kiến (Bến xe, trung tâm thành phố, sân bay). Bạn chỉ cần chọn điểm thuận tiện nhất trong form đặt vé.',
  },
];
