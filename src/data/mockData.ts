import type { Trip, Vehicle, Seat, StopPoint } from '../types';

export const POPULAR_CITIES = [
  { id: 'da-nang', name: 'Đà Nẵng', province: 'Đà Nẵng' },
  { id: 'hue', name: 'Huế', province: 'Thừa Thiên Huế' },
  { id: 'hoi-an', name: 'Hội An', province: 'Quảng Nam' },
  { id: 'quy-nhon', name: 'Quy Nhơn', province: 'Bình Định' },
  { id: 'nha-trang', name: 'Nha Trang', province: 'Khánh Hòa' },
  { id: 'ha-noi', name: 'Hà Nội', province: 'Hà Nội' },
  { id: 'ho-chi-minh', name: 'TP. Hồ Chí Minh', province: 'Hồ Chí Minh' },
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

const HUE_DROPOFFS: StopPoint[] = [
  { id: 'hue-bxpn', name: 'Bến xe phía Nam Huế', time: '+2h15m', address: '57 An Dương Vương, TP. Huế' },
  { id: 'hue-le-loi', name: 'Văn phòng Trung tâm Lê Lợi', time: '+2h30m', address: '14 Lê Lợi, Vĩnh Ninh, TP. Huế' },
  { id: 'hue-dai-noi', name: 'Khu vực Cửa Thượng Tứ (Đại Nội)', time: '+2h45m', address: 'Đường Đoàn Thị Điểm, Thuận Thành, TP. Huế' },
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
  createTripData({
    id: 'trip-dn-hue-free',
    code: 'HT-TEST-0D',
    operator: 'HÀNH TRÌNH TEST (0Đ)',
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
    seats: createLimousineSeats(0, ['L5', 'L9']), // 14 available
  }),
  createTripData({
    id: 'trip-dn-hue-01',
    code: 'HT-101',
    operator: 'HÀNH TRÌNH EXPRESS',
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
    seats: createSleeperSeats(180000, ['A3', 'A4', 'A7', 'A12', 'B2', 'B5', 'B9', 'B14']), // 26 available
  }),
  createTripData({
    id: 'trip-dn-hue-02',
    code: 'HT-102',
    operator: 'HÀNH TRÌNH EXPRESS',
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
    seats: createSleeperSeats(180000, ['A1', 'A3', 'A4', 'A7', 'A12', 'B2', 'B5', 'B8', 'B9', 'B14']), // 24 available
  }),
  createTripData({
    id: 'trip-dn-hue-03',
    code: 'HT-L01',
    operator: 'HÀNH TRÌNH VIP LINER',
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
    seats: createLimousineSeats(240000, ['L2', 'L5', 'L9']), // 13 available
  }),
  createTripData({
    id: 'trip-dn-hue-04',
    code: 'HT-104',
    operator: 'HÀNH TRÌNH EXPRESS',
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
    seats: createSleeperSeats(200000, ['A2', 'A3', 'A5', 'A7', 'A8', 'A11', 'A14', 'B1', 'B3', 'B4', 'B7', 'B12', 'B15']), // 21 available
  }),
  createTripData({
    id: 'trip-dn-hue-05',
    code: 'HT-C01',
    operator: 'HÀNH TRÌNH ROYAL CABIN',
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
    seats: createCabinSeats(320000, ['C1', 'C4', 'C7', 'C15', 'C18']), // 17 available
  }),
  createTripData({
    id: 'trip-dn-hue-06',
    code: 'HT-106',
    operator: 'HÀNH TRÌNH EXPRESS',
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
    seats: createSleeperSeats(180000, ['A3', 'A4', 'A6', 'A9', 'A12', 'B2', 'B5', 'B10', 'B14']), // 25 available
  }),
  createTripData({
    id: 'trip-dn-ha-01',
    code: 'HT-HA01',
    operator: 'HÀNH TRÌNH EXPRESS',
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
    seats: createLimousineSeats(120000, ['L1', 'L3', 'L6', 'L8', 'L11']), // 11 available
  }),
  createTripData({
    id: 'trip-dn-qn-01',
    code: 'HT-QN01',
    operator: 'HÀNH TRÌNH ROYAL CABIN',
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
    seats: createCabinSeats(360000, ['C2', 'C5', 'C8', 'C11', 'C14', 'C19']), // 16 available
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
    image: '/assets/images/hero_landscape_danang_hue.jpg',
    tag: 'Tuyến đường di sản',
  },
  {
    id: 'route-dn-ha',
    from: 'Đà Nẵng',
    to: 'Hội An',
    distance: '30 km',
    duration: '45 phút',
    priceFrom: 120000,
    tripsDaily: 20,
    image: '/assets/images/bus_limousine_vip.jpg',
    tag: 'Đón tận sân bay',
  },
  {
    id: 'route-dn-qn',
    from: 'Đà Nẵng',
    to: 'Quy Nhơn',
    distance: '315 km',
    duration: '6 giờ',
    priceFrom: 320000,
    tripsDaily: 8,
    image: '/assets/images/bus_cabin_royal.jpg',
    tag: 'Cabin hoàng gia qua đêm',
  },
];

export const FAQ_LIST = [
  {
    question: 'Tôi có thể đổi hoặc hủy vé đã đặt như thế nào?',
    answer: 'HÀNH TRÌNH hỗ trợ đổi chuyến miễn phí trước 24 giờ khởi hành qua trang Tra cứu vé hoặc gọi hotline hỗ trợ. Với yêu cầu hủy vé, quý khách sẽ được hoàn tiền theo chính sách demo trong vòng 2-5 phút.',
  },
  {
    question: 'Làm thế nào để nhận vé sau khi thanh toán thành công?',
    answer: 'Ngay khi hoàn tất mô phỏng thanh toán, vé điện tử kèm mã QR sẽ hiển thị trực tiếp trên màn hình. Bạn có thể in vé (PDF), tải ảnh vé hoặc lưu mã đặt vé để tra cứu bất kỳ lúc nào.',
  },
  {
    question: 'Tôi có được chọn vị trí ghế/giường chính xác không?',
    answer: 'Có! Sơ đồ ghế của từng loại xe (Giường nằm, Limousine, Cabin 2 tầng) hiển thị trực quan 100% thời gian thực. Bạn tự do chọn số ghế mong muốn và giữ chỗ ngay lập tức.',
  },
  {
    question: 'Điểm đón và trả khách có linh hoạt không?',
    answer: 'Hệ thống cung cấp danh sách điểm đón/trả chính xác kèm thời gian dự kiến (Bến xe, trung tâm thành phố, sân bay). Bạn chỉ cần chọn điểm thuận tiện nhất trong form đặt vé.',
  },
];
