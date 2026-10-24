import * as THREE from 'three';

/**
 * DANAVA GO — Road Geometry & Vehicle Guidance Curve Configuration
 * 
 * ============================================================================
 * HỆ TỌA ĐỘ VÀ HƯỚNG TRỤC (THREE.JS RIGHT-HANDED COORDINATE SYSTEM):
 * ============================================================================
 * 1. Trục X (Hoành độ):
 *    - Hướng: Từ Trái sang Phải (-X: Phía Tây/Đà Nẵng, +X: Phía Đông/Huế)
 * 2. Trục Y (Cao độ):
 *    - Hướng: Từ Dưới lên Trên (-Y: Dưới mặt bàn/đất, +Y: Lên bầu trời)
 *    - Mặt đất: Y = 0.0
 *    - Mặt vé giấy: Y = 0.016
 *    - Mặt đường nhựa: Y = 0.020
 *    - Vạch tim đường: Y = 0.022
 * 3. Trục Z (Tung độ chiều sâu):
 *    - Hướng: Từ Sau ra Trước (-Z: Phía xa/hậu cảnh đèo núi, +Z: Gần camera/tiền cảnh)
 * 4. Hướng tuyến hành trình:
 *    - Điểm bắt đầu (Đà Nẵng): t = 0.0 tại [X: -3.45, Y: 0.020, Z: 0.92] (góc trước bên trái)
 *    - Điểm dừng đỗ xe: t = 0.62 tại [X: 1.45, Y: 0.020, Z: 0.12]
 *    - Điểm kết thúc tuyến (Huế): t = 1.0 tại [X: 3.25, Y: 0.020, Z: 0.15] (góc phải)
 * ============================================================================
 */

export const ROAD_CONTROL_POINTS: [number, number, number][] = [
  [-3.45, 0.020, 0.92],   // 0. Bắt đầu (Đà Nẵng - gần góc trái phía trước vé)
  [-2.30, 0.020, 0.62],   // 1. Đoạn uốn ven biển
  [-1.15, 0.020, 0.05],   // 2. Bắt đầu lên cung đèo trung tâm
  [0.10, 0.020, -0.32],   // 3. Đỉnh cung lượn đèo (vùng sâu phía sau)
  [1.25, 0.020, 0.05],    // 4. Đoạn thoát đèo hướng về vùng đồng bằng
  [2.25, 0.020, 0.42],    // 5. Cung thẳng tiếp cận điểm đích
  [3.25, 0.020, 0.15],    // 6. Điểm đến (Huế - Ngọ Môn)
];

// Khởi tạo đường dẫn xe (CatmullRomCurve3) khớp 100% với tim đường
export const VEHICLE_PATH_CURVE = new THREE.CatmullRomCurve3(
  ROAD_CONTROL_POINTS.map(([x, y, z]) => new THREE.Vector3(x, y, z)),
  false, // Không khép vòng (open curve)
  'centripetal', // Centripetal curve tránh loop hay giật góc
  0.5
);

export const ROAD_CONFIG = {
  // Thông số kích thước mặt đường
  dimensions: {
    roadWidth: 0.68,          // Bề rộng phần đường xe chạy
    shoulderWidth: 0.05,      // Bề rộng lề đường hai bên
    totalWidth: 0.78,         // Tổng bề rộng bao gồm cả gờ lề
    dashLength: 0.18,         // Chiều dài mỗi vạch kẻ tim đường
    dashGap: 0.14,            // Khoảng cách giữa các vạch tim đường
    dashWidth: 0.035,         // Bề rộng vạch tim đường
    roadY: 0.020,             // Cao độ mặt đường (nằm êm trên mặt giấy 0.016, không xuyên giấy)
    dashY: 0.022,             // Cao độ vạch sơn (ngay trên mặt nhựa đường, triệt tiêu z-fighting)
  },

  // Màu sắc & vật liệu đường thực
  colors: {
    asphalt: '#2B303A',       // Nhựa đường xám than đậm thanh lịch
    shoulder: '#E2DCD0',      // Gờ lề đường đá mài ngà
    centerline: '#F4D06F',    // Vạch tim đường vàng ấm đặc trưng
    debugTrajectory: '#00B4D8', // Màu đường debug trong chế độ phát triển
    debugEntry: '#00E5FF',    // Marker điểm xuất phát
    debugStop: '#FF9100',     // Marker điểm dừng đỗ tĩnh
  },

  // Đoạn xe tiến vào và điểm dừng đỗ chuẩn
  vehicleKeyframes: {
    entryT: 0.0,              // Xe xuất phát ở đầu tuyến (t = 0.0)
    stopT: 0.62,              // Điểm dừng xe cuối cùng (t = 0.62)
  },
} as const;

export interface VehicleTransform {
  position: THREE.Vector3;
  tangent: THREE.Vector3;
  normal: THREE.Vector3;
  yawAngle: number; // Góc quay quanh trục Y (radians)
}

/**
 * Tính toán vị trí, tiếp tuyến và góc quay chính xác của xe tại bất kỳ tiến trình t nào (0 <= t <= 1)
 */
export function getVehicleTransformAt(t: number): VehicleTransform {
  const clampedT = Math.max(0, Math.min(1, t));
  const position = VEHICLE_PATH_CURVE.getPointAt(clampedT);
  const tangent = VEHICLE_PATH_CURVE.getTangentAt(clampedT).normalize();
  
  // Vector pháp tuyến ngang trên mặt phẳng X-Z
  const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
  
  // Góc quay quanh trục Y
  const yawAngle = Math.atan2(tangent.x, tangent.z);

  return {
    position,
    tangent,
    normal,
    yawAngle,
  };
}
