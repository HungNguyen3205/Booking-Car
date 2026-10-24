/**
 * DANAVA GO — Quản lý Timeline Tập Trung của Hành Trình Mở Vé (Step 8)
 * 
 * Timeline tập trung điều phối 6 trạng thái cốt lõi:
 * 1. 'closed'           (0.00s - 0.10s): Vé giấy gập đóng quanh bản lề
 * 2. 'opening'          (0.10s - 0.70s): Cánh vé mở phẳng quanh trục hingeX, bóng đổ biến thiên
 * 3. 'landscape-reveal' (0.60s - 1.30s): Các địa danh nổi từ mặt vé với cự ly ngắn (pop-up craft)
 * 4. 'vehicle-enter'    (1.10s - 1.95s): Xe khách lăn bánh trên đường cong và dừng êm tại t=0.62
 * 5. 'route-reveal'     (1.85s - 2.50s): Pin Đà Nẵng -> Nét vẽ SVG -> Pin Huế -> Badge cự ly
 * 6. 'ready'            (>= 2.50s): Trạng thái tĩnh hoàn tất, chỉ còn dao động vi mô của cây
 */

export type JourneyTimelineState =
  | 'closed'
  | 'opening'
  | 'landscape-reveal'
  | 'vehicle-enter'
  | 'route-reveal'
  | 'ready';

export interface TimelineProgress {
  currentTime: number;
  totalDuration: number;
  state: JourneyTimelineState;
  isReady: boolean;

  // Tiến trình phụ của từng thành phần [0, 1]
  flapAngle: number;         // Math.PI (gập) -> 0.0 (mở phẳng)
  danangPopProgress: number; // 0 (chìm phẳng) -> 1 (nổi hoàn toàn)
  passPopProgress: number;   // 0 -> 1
  huePopProgress: number;    // 0 -> 1
  vehicleProgress: number;   // 0 (điểm xuất phát) -> 1 (điểm dừng tĩnh)
  danangPinProgress: number; // 0 -> 1
  routeDrawProgress: number; // 0 (chưa vẽ) -> 1 (nối xong)
  huePinProgress: number;    // 0 -> 1
  badgeProgress: number;     // 0 -> 1
}

export const TIMELINE_CONFIG = {
  totalDuration: 2.50, // 2.5 giây mục tiêu chuẩn theo video mẫu (2 - 3s)
  
  // Các mốc thời gian (seconds)
  timing: {
    closedEnd: 0.10,
    openingStart: 0.10,
    openingEnd: 0.70,
    
    danangStart: 0.60,
    danangEnd: 1.05,
    
    passStart: 0.70,
    passEnd: 1.15,
    
    hueStart: 0.80,
    hueEnd: 1.28,
    
    vehicleStart: 1.10,
    vehicleEnd: 1.95,
    
    danangPinStart: 1.85,
    danangPinEnd: 2.05,
    
    routeDrawStart: 2.00,
    routeDrawEnd: 2.30,
    
    huePinStart: 2.22,
    huePinEnd: 2.42,
    
    badgeStart: 2.35,
    badgeEnd: 2.50,
  },
};

/**
 * Hàm nội suy kẹp giá trị clamp(val, min, max)
 */
function clamp(val: number, min: number = 0, max: number = 1): number {
  return Math.max(min, Math.min(max, val));
}

/**
 * Easing Cubic Ease-Out: 1 - (1 - u)^3
 */
function easeOutCubic(u: number): number {
  return 1 - Math.pow(1 - u, 3);
}

/**
 * Easing Pop-up overshoot nhẹ cho mô hình thủ công: nảy nhẹ 6% rồi hồi về 1.0
 */
export function easeOutBack(u: number): number {
  const c1 = 1.35;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(u - 1, 3) + c1 * Math.pow(u - 1, 2);
}

/**
 * Tính toán toàn bộ các giá trị tiến trình từ thời gian hiện tại
 */
export function calculateTimelineProgress(
  currentTime: number,
  shouldReduceMotion: boolean = false
): TimelineProgress {
  const { totalDuration, timing } = TIMELINE_CONFIG;

  if (shouldReduceMotion || currentTime >= totalDuration) {
    return {
      currentTime: totalDuration,
      totalDuration,
      state: 'ready',
      isReady: true,
      flapAngle: 0.0,
      danangPopProgress: 1.0,
      passPopProgress: 1.0,
      huePopProgress: 1.0,
      vehicleProgress: 1.0,
      danangPinProgress: 1.0,
      routeDrawProgress: 1.0,
      huePinProgress: 1.0,
      badgeProgress: 1.0,
    };
  }

  // Xác định trạng thái chính
  let state: JourneyTimelineState = 'closed';
  if (currentTime < timing.closedEnd) {
    state = 'closed';
  } else if (currentTime < timing.openingEnd) {
    state = 'opening';
  } else if (currentTime < timing.vehicleStart) {
    state = 'landscape-reveal';
  } else if (currentTime < timing.danangPinStart) {
    state = 'vehicle-enter';
  } else if (currentTime < totalDuration) {
    state = 'route-reveal';
  } else {
    state = 'ready';
  }

  // 1. Góc mở vé flapAngle: Math.PI (180°) -> 0.0 rad
  let flapAngle = Math.PI;
  if (currentTime >= timing.openingStart) {
    const u = clamp((currentTime - timing.openingStart) / (timing.openingEnd - timing.openingStart));
    const eased = easeOutCubic(u);
    flapAngle = Math.PI * (1 - eased);
  }

  // 2. Cảnh nổi từ mặt vé (Pop-up Diorama): 0 -> 1
  let danangPopProgress = 0;
  if (currentTime >= timing.danangStart) {
    const u = clamp((currentTime - timing.danangStart) / (timing.danangEnd - timing.danangStart));
    danangPopProgress = easeOutBack(u);
  }

  let passPopProgress = 0;
  if (currentTime >= timing.passStart) {
    const u = clamp((currentTime - timing.passStart) / (timing.passEnd - timing.passStart));
    passPopProgress = easeOutBack(u);
  }

  let huePopProgress = 0;
  if (currentTime >= timing.hueStart) {
    const u = clamp((currentTime - timing.hueStart) / (timing.hueEnd - timing.hueStart));
    huePopProgress = easeOutBack(u);
  }

  // 3. Xe tiến vào đường cong: 0 -> 1
  let vehicleProgress = 0;
  if (currentTime >= timing.vehicleStart) {
    const u = clamp((currentTime - timing.vehicleStart) / (timing.vehicleEnd - timing.vehicleStart));
    vehicleProgress = easeOutCubic(u);
  }

  // 4. Tuyến đường vector SVG và các Pins
  let danangPinProgress = 0;
  if (currentTime >= timing.danangPinStart) {
    const u = clamp((currentTime - timing.danangPinStart) / (timing.danangPinEnd - timing.danangPinStart));
    danangPinProgress = easeOutBack(u);
  }

  let routeDrawProgress = 0;
  if (currentTime >= timing.routeDrawStart) {
    const u = clamp((currentTime - timing.routeDrawStart) / (timing.routeDrawEnd - timing.routeDrawStart));
    routeDrawProgress = easeOutCubic(u);
  }

  let huePinProgress = 0;
  if (currentTime >= timing.huePinStart) {
    const u = clamp((currentTime - timing.huePinStart) / (timing.huePinEnd - timing.huePinStart));
    huePinProgress = easeOutBack(u);
  }

  let badgeProgress = 0;
  if (currentTime >= timing.badgeStart) {
    const u = clamp((currentTime - timing.badgeStart) / (timing.badgeEnd - timing.badgeStart));
    badgeProgress = easeOutCubic(u);
  }

  return {
    currentTime,
    totalDuration,
    state,
    isReady: false,
    flapAngle,
    danangPopProgress,
    passPopProgress,
    huePopProgress,
    vehicleProgress,
    danangPinProgress,
    routeDrawProgress,
    huePinProgress,
    badgeProgress,
  };
}
