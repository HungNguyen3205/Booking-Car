/**
 * DANAVA GO — Sleeper Coach 3D Model Configuration
 * 
 * ============================================================================
 * QUY CHUẨN GỐC TỌA ĐỘ VÀ HƯỚNG TRỤC CỦA MODEL (STANDARDIZED VEHICLE RIG):
 * ============================================================================
 * 1. Gốc tọa độ cục bộ [0, 0, 0]:
 *    - Nằm tại tâm mặt tiếp đất giữa 2 trục bánh xe.
 *    - Đáy lốp xe tiếp xúc chuẩn xác tại Y = 0.0 trong hệ tọa độ cục bộ.
 * 2. Hướng đầu xe (Forward vector):
 *    - Hướng theo trục +Z (khi yawAngle = 0).
 * 3. Hướng nóc xe (Up vector):
 *    - Hướng theo trục +Y.
 * 4. Hướng bên xe (Right vector):
 *    - Hướng theo trục +X (bên phải xe là +X, bên trái xe là -X).
 * 5. Chiều cao tiếp đất:
 *    - Đặt xe tại cao độ Y = 0.020 (mặt đường nhựa) đảm bảo 100% 4 bánh tiếp xúc
 *      mặt đường, không bị chìm lún, không bay lơ lửng, không phụ thuộc vào bounding box.
 * ============================================================================
 */

export const COACH_CONFIG = {
  // Kích thước chuẩn hóa theo tỷ lệ sân khấu vé & lòng đường (1:1 với làn đường 0.68)
  dimensions: {
    length: 1.15,             // Chiều dài tổng thể thân xe (~12m thực tế)
    width: 0.33,              // Bề rộng thân xe (~2.5m thực tế, chiếm ~48% lòng đường 0.68)
    height: 0.35,             // Chiều cao thân xe 2 tầng giường nằm (~3.6m thực tế)
    groundClearance: 0.038,   // Khoảng sáng gầm xe tính từ mặt đường
    wheelRadius: 0.078,       // Bán kính bánh xe (~0.55m thực tế)
    wheelWidth: 0.040,        // Bề dày lốp xe
    wheelBase: 0.70,          // Khoảng cách trục trước - sau (Front Z: +0.35, Rear Z: -0.35)
    trackWidth: 0.28,         // Khoảng cách giữa 2 bánh đối diện (X: +-0.14)
    axleHeight: 0.078,        // Cao độ tâm trục bánh xe (= wheelRadius)
  },

  // Vật liệu và màu sắc xe Giường nằm cao cấp DANAVA GO (PBR Physical Materials)
  materials: {
    bodyColor: '#10274C',     // Deep Midnight Royal Navy sang trọng bám sát ảnh mục tiêu
    bodyRoughness: 0.12,      // Sơn ô tô bóng gương cao cấp
    bodyMetalness: 0.42,      // Ánh kim metallic sang trọng
    clearcoat: 1.0,           // Lớp phủ bóng gương (clearcoat automotive lacquer)
    clearcoatRoughness: 0.04, // Độ mịn lớp bóng gương
    accentTeal: '#0097A7',    // Đường chỉ eo thương hiệu Teal
    accentTealBright: '#00E5FF', // Sắc Cyan Teal sáng cho tem sóng
    accentSilver: '#F1F5F9',  // Viền mạ bạc kim loại
    accentGold: '#F59E0B',    // Đường chỉ mạ vàng champagne điểm xuyết
    windowColor: '#0A1526',   // Kính khói đen ngọc bích bóng gương cao cấp
    windowRoughness: 0.02,    // Kính phản chiếu ánh sáng môi trường sắc nét
    windowMetalness: 0.25,
    windowTransmission: 0.0,  // Kính chống chói tối màu riêng tư (privacy mirror tint), không rỗng cabin
    tireColor: '#16191D',     // Cao su lốp xám than cao cấp
    tireRoughness: 0.88,
    rimColor: '#F8FAFC',      // Mâm đúc hợp kim bạc sáng phay xước
    rimRoughness: 0.08,
    rimMetalness: 0.96,
    brakeCaliperColor: '#00BCD4', // Kẹp phanh thể thao Teal DANAVA
    chromeColor: '#FFFFFF',   // Viền ca-lăng và nẹp chữ Z chrome sáng bóng
    chromeMetalness: 0.98,
    chromeRoughness: 0.03,
    drlEmissive: '#00E5FF',   // Dải LED định vị ban ngày DRL xanh băng
    drlEmissiveIntensity: 2.8,
    headlightColor: '#FFFFFF', // Đèn pha LED xenon trắng tinh
    headlightEmissive: '#FFFDF0',
    taillightColor: '#E53935', // Đèn hậu LED đỏ
    taillightEmissive: '#FF1744',
    fogLightColor: '#FFB300',  // Đèn gầm phá sương vàng hổ phách
    shadowColor: '#040810',   // Bóng gầm tiếp xúc
    shadowOpacity: 0.60,
  },

  // Cấu hình chuyển động xe chạy dọc đường và quay bánh theo vật lý
  animation: {
    duration: 2.4,            // Thời lượng xe chạy từ điểm vào đến điểm dừng (giây)
    entryT: 0.0,              // Điểm vào đầu đường (t = 0.0)
    stopT: 0.54,              // Điểm dừng xe tiền cảnh chuẩn (t = 0.54 đón mắt nhìn 3/4)
    totalDistance: 4.411,     // Quãng đường cong thực tế từ t=0 đến t=0.54 (units)
  },

  // Metadata mô hình phục vụ báo cáo kiểm kê & đối soát kỹ thuật
  meta: {
    modelType: 'Procedural 3D Rig (Three.js Compound PBR Luxury Coach)',
    isPlaceholderPrototype: true, // Bản thử nghiệm kỹ thuật (Technical Prototype), không coi là asset photoreal thương phẩm
    branding: 'DANAVA GO Luxury Sleeper Coach (Bám sát ảnh mục tiêu bus_coach_sleeper.png)',
    features: [
      'Vòm mui cong khí động học & Trụ A mạ bạc hình chữ Z (Hockey stick line)',
      'Kính chắn gió kép vát nghiêng ~32° & Cần gạt nước đôi',
      'Cặp gương chiếu hậu khí động học cổ thiên nga (Swan-neck aero mirrors)',
      'Mặt ca-lăng nụ cười mạ chrome & Cụm đèn pha Jewel LED Projector + DRL xanh băng',
      'Decal tem lượn sóng Teal / Bạc kim loại / Vàng Champagne 2 bên sườn & nắp capo',
      'Cụm bánh xe lazăng 10 lỗ mâm đúc hợp kim sâu lòng chuẩn xe thương mại',
      'Phản chiếu môi trường IBL PMREM Studio Horizon & Gradient'
    ],
    futureGlbSpec: {
      format: 'glTF 2.0 Binary (.glb)',
      targetPolyCount: '15k - 25k triangles',
      textureChannels: 'Albedo, Normal, Roughness, Metallic (1024x1024)',
      rigRequirements: 'Root at wheel-ground contact, separate wheel nodes for rotation',
    },
  },
} as const;
