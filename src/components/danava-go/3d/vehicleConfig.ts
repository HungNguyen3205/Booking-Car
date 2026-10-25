import type { VehicleCategory } from '../../../types';

/**
 * DANAVA GO — Unified Vehicle Definition (Step 9)
 * 
 * Chuẩn hóa 3 model xe:
 * 1. sleeper:   Xe Giường Nằm 12m tiêu chuẩn (Thaco Mobihome / Universe)
 * 2. limousine: Xe Limousine van VIP 9-11 chỗ (Ford Transit / Solati / DCar President)
 * 3. cabin:     Xe Cabin VIP Cung Điện Di Động (Single-deck VIP suites, buồng phòng riêng biệt)
 * 
 * Quy chuẩn Rig chung:
 * - Đơn vị: Mét (Three.js world unit).
 * - Gốc tọa độ [0, 0, 0]: Mặt tiếp đất tại tâm trục bánh xe.
 * - Đầu xe: +Z.
 * - Nóc xe: +Y.
 * - Mạn phải: +X, Mạn trái: -X.
 * - Đáy lốp xe tiếp đất tại Y = 0.0 cục bộ.
 */

export interface VehicleDimensions {
  length: number;           // Chiều dài tổng thể
  width: number;            // Bề rộng thân xe
  height: number;           // Chiều cao thân xe
  groundClearance: number;  // Khoảng sáng gầm xe
  wheelRadius: number;      // Bán kính bánh xe
  wheelWidth: number;       // Bề dày lốp xe
  wheelBase: number;        // Khoảng cách trục trước - sau
  trackWidth: number;       // Khoảng cách 2 bánh đối diện
  axleHeight: number;       // Cao độ tâm trục bánh xe (= wheelRadius)
}

export interface VehicleMaterials {
  bodyColor: string;
  bodyRoughness: number;
  bodyMetalness: number;
  accentColor: string;
  windowColor: string;
  windowRoughness: number;
  windowMetalness: number;
  tireColor: string;
  tireRoughness: number;
  rimColor: string;
  rimRoughness: number;
  rimMetalness: number;
  chromeColor: string;
  headlightColor: string;
  taillightColor: string;
  shadowColor: string;
  shadowOpacity: number;
}

export interface VehicleDefinition {
  id: VehicleCategory;
  displayName: string;
  subtitle: string;
  seatCount: string;
  badgeLabel: string;
  dimensions: VehicleDimensions;
  materials: VehicleMaterials;
  assetStatus: 'ready' | 'loading' | 'error';
  meta: {
    vehicleType: string;
    description: string;
  };
}

export const VEHICLE_DEFINITIONS: Record<VehicleCategory, VehicleDefinition> = {
  // 1. XE GIƯỜNG NẰM TIÊU CHUẨN (SLEEPER COACH 12M)
  sleeper: {
    id: 'sleeper',
    displayName: 'Giường Nằm',
    subtitle: 'Êm ái • Tiêu chuẩn liên tỉnh',
    seatCount: '34 Giường VIP',
    badgeLabel: 'PHỔ BIẾN NHẤT',
    dimensions: {
      length: 1.15,
      width: 0.33,
      height: 0.35,
      groundClearance: 0.038,
      wheelRadius: 0.078,
      wheelWidth: 0.040,
      wheelBase: 0.70,
      trackWidth: 0.28,
      axleHeight: 0.078,
    },
    materials: {
      bodyColor: '#102744',       // Navy thương hiệu DANAVA GO
      bodyRoughness: 0.16,
      bodyMetalness: 0.42,
      accentColor: '#0097A7',     // Teal
      windowColor: '#0B1320',
      windowRoughness: 0.12,
      windowMetalness: 0.18,
      tireColor: '#1A1D20',
      tireRoughness: 0.90,
      rimColor: '#D8DCE2',
      rimRoughness: 0.25,
      rimMetalness: 0.80,
      chromeColor: '#F0F4F8',
      headlightColor: '#FFFDF0',
      taillightColor: '#E53935',
      shadowColor: '#08101C',
      shadowOpacity: 0.58,
    },
    assetStatus: 'ready',
    meta: {
      vehicleType: '12m Double-Decker Sleeper Coach',
      description: 'Dòng xe giường nằm 2 tầng truyền thống với không gian rộng rãi và độ êm ái cao.',
    },
  },

  // 2. XE LIMOUSINE VAN EXECUTIVE (DCAR PRESIDENT 9-11 CHỖ)
  limousine: {
    id: 'limousine',
    displayName: 'Limousine VIP',
    subtitle: 'Đẳng cấp doanh nhân • Đón trả tận nơi',
    seatCount: '9 - 11 Ghế Hạng Thương Gia',
    badgeLabel: 'CAO CẤP',
    dimensions: {
      length: 0.76,               // Chiều dài dạng van ~6.2m thực tế
      width: 0.27,                // Bề rộng gọn gàng ~2.05m
      height: 0.26,               // Chiều cao vừa tầm ~2.7m
      groundClearance: 0.028,
      wheelRadius: 0.056,         // Bánh xe van nhỏ hơn coach
      wheelWidth: 0.032,
      wheelBase: 0.46,            // Trục cơ sở ngắn hơn
      trackWidth: 0.23,
      axleHeight: 0.056,
    },
    materials: {
      bodyColor: '#16191D',       // Đen Obsidian bóng bẩy
      bodyRoughness: 0.24,        // Bề mặt sơn mượt mà phản chiếu cao
      bodyMetalness: 0.52,        // Ánh kim loại sang trọng
      accentColor: '#C5A059',     // Viền vàng Champagne / Đồng tinh tế
      windowColor: '#0C0E12',     // Kính tối màu chống nắng riêng tư
      windowRoughness: 0.08,
      windowMetalness: 0.94,
      tireColor: '#1A1D20',
      tireRoughness: 0.88,
      rimColor: '#E8ECF0',        // Mâm hợp kim đa chấu phay bóng
      rimRoughness: 0.18,
      rimMetalness: 0.90,
      chromeColor: '#FFFFFF',
      headlightColor: '#F0F8FF',   // Đèn LED daylight sắc sảo
      taillightColor: '#FF1744',
      shadowColor: '#08101C',
      shadowOpacity: 0.52,
    },
    assetStatus: 'ready',
    meta: {
      vehicleType: 'Executive VIP Luxury Van',
      description: 'Dòng xe van thương gia ghế da massage, cổng sạc riêng và không gian chuyên cơ mặt đất.',
    },
  },

  // 3. XE CABIN VIP CUNG ĐIỆN DI ĐỘNG (SUITE CABIN EXPRESS)
  cabin: {
    id: 'cabin',
    displayName: 'Cabin VIP',
    subtitle: 'Cung Điện Di Động • Phòng riêng biệt lập',
    seatCount: '22 Phòng Suite VIP',
    badgeLabel: 'THƯỢNG LƯU',
    dimensions: {
      length: 1.18,               // Chiều dài sàn cao ~12.2m
      width: 0.34,                // Bề rộng bề thế ~2.55m
      height: 0.34,               // Xe sàn cao đơn tầng VIP, không xếp 2 tầng chật chội
      groundClearance: 0.040,
      wheelRadius: 0.078,
      wheelWidth: 0.042,
      wheelBase: 0.72,
      trackWidth: 0.28,
      axleHeight: 0.078,
    },
    materials: {
      bodyColor: '#0B192C',       // Xanh Sapphire Đậm Hoàng Gia
      bodyRoughness: 0.30,
      bodyMetalness: 0.35,
      accentColor: '#D4AF37',     // Dải nẹp chỉ mạ vàng Hoàng gia (Royal Gold)
      windowColor: '#141A24',     // Kính cửa sổ buồng phòng độc lập
      windowRoughness: 0.10,
      windowMetalness: 0.90,
      tireColor: '#1A1D20',
      tireRoughness: 0.90,
      rimColor: '#E2E6EC',
      rimRoughness: 0.20,
      rimMetalness: 0.85,
      chromeColor: '#F8FAFC',
      headlightColor: '#FFFDE7',   // Pha ma trận Jewel LED
      taillightColor: '#D50000',
      shadowColor: '#08101C',
      shadowOpacity: 0.60,
    },
    assetStatus: 'ready',
    meta: {
      vehicleType: 'Single-Deck Royal Suite Cabin Coach',
      description: 'Dòng xe phòng đơn hoàng gia với rèm che riêng tư, màn hình giải trí và cửa sổ panorama.',
    },
  },
};
