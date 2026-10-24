/**
 * DANAVA GO — Unified Destination & Landmark Architecture (BƯỚC 10)
 * 
 * ============================================================================
 * QUY CHUẨN ĐỊA DANH MỞ RỘNG (DESTINATION DEFINITION SPECIFICATION):
 * ============================================================================
 * 1. Phân biệt 3 cấp độ danh tính:
 *    - searchLocationId: Mã tìm kiếm dùng trong booking ('da-nang', 'hue', 'nha-trang', ...)
 *    - administrativeArea: Đơn vị hành chính cấp tỉnh ('Thành phố Đà Nẵng', 'Tỉnh Thừa Thiên Huế', 'Tỉnh Khánh Hòa')
 *    - sceneLandmarkId: Mã landmark 3D minh họa ('da-nang-cau-rong', 'hue-ngo-mon', 'nha-trang-tram-huong')
 *    CAM KẾT: Không coi mọi tên tỉnh là đồng nghĩa với một thành phố!
 * 2. Composition Slots:
 *    - Khai báo vùng Origin (mạn trái của vé) và Destination (mạn phải của vé).
 *    - Mỗi địa điểm có cấu hình placement & labelAnchor riêng cho từng slot.
 * 3. Quy tắc ghép cảnh tự nhiên:
 *    - Tuyến có asset đạt chuẩn hiển thị đúng landmark độc bản.
 *    - Cặp chưa thể ghép tự nhiên dùng fallback phong cảnh trung tính (Neutral Scenic).
 *    - TUYỆT ĐỐI KHÔNG gán tên Nha Trang lên Ngọ Môn hay bất kỳ landmark sai nào!
 * 4. Không sinh asset AI khi người dùng chọn dropdown:
 *    - Mọi mô hình 3D đều là procedural tĩnh, tối ưu 60fps trên mobile.
 * 5. Bảng Registry công khai:
 *    - Ghi nhận minh bạch địa điểm nào đã đạt chuẩn, địa điểm nào dùng fallback.
 * ============================================================================
 */

export interface DestinationModelSpec {
  type: 'procedural-3d' | 'gltf';
  name: string;
  landmarkName: string;
  description: string;
  geometrySummary: string;
  materials: Record<string, string>;
  hasBakedText: false; // Cam kết tuyệt đối: không bake tên tỉnh vào model 3D
  triangleBudget: number; // Giới hạn số tam giác để đảm bảo 60fps
}

export interface DestinationLabelAnchor {
  worldPosition: [number, number, number];
  offset2D: [number, number]; // Độ dịch pixel [dx, dy] khi render HTML/SVG
  badgeTitle: string;
  badgeSubtitle: string;
  icon: string;
}

export interface DestinationSafeZone {
  bounds: {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
    minZ: number;
    maxZ: number;
  };
  headlineClearance: {
    description: string;
    stageLeftMarginPct: number;
  };
  vehicleClearance: {
    minDistanceToRoad: number;
    minDistanceToCoachStop: number;
    description: string;
  };
}

export interface DestinationPlacement {
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
}

export interface DestinationApprovalStatus {
  isApproved: boolean;
  status: 'approved' | 'pending' | 'in-review' | 'fallback';
  approvalDate: string;
  version: string;
  referenceImages: string[];
  verifiedCriteria: {
    recognizableWithoutLabel: boolean;
    noOverlapHeadline: boolean;
    noOverlapVehicle: boolean;
    noRectangularHardEdges: boolean;
    zeroBakedProvinceText: boolean;
    htmlSvgLabelAttached: boolean;
    standardCameraCompatibility: boolean;
  };
}

export interface DestinationDefinition {
  id: string; // Khóa định danh chuẩn
  searchLocationId: string; // ID dùng trong hệ thống tìm kiếm booking
  displayName: string; // Tên hiển thị thành phố (VD: "Nha Trang")
  administrativeArea: string; // Khu vực hành chính cấp tỉnh (VD: "Tỉnh Khánh Hòa")
  sceneLandmarkId: string; // ID landmark 3D (VD: "nha-trang-tram-huong")
  tagline: string;
  hasDedicatedModel: boolean; // true nếu có mô hình 3D riêng biệt
  supportedSlots: ('origin' | 'destination')[]; // Vị trí có thể đặt trong composition
  model: DestinationModelSpec;
  
  // Điểm neo nhãn cho từng vùng bố cục (origin / destination)
  labelAnchor: DestinationLabelAnchor & {
    origin: DestinationLabelAnchor;
    destination: DestinationLabelAnchor;
  };

  safeZone: DestinationSafeZone;

  // Vị trí đặt tương ứng trong từng vùng bố cục
  placements: {
    origin: DestinationPlacement;
    destination: DestinationPlacement;
  };
  placement: DestinationPlacement; // Getter/Shortcut tương thích ngược

  approvalStatus: DestinationApprovalStatus;
}

// ============================================================================
// 1. ĐỊNH NGHĨA CHÍNH THỨC: ĐÀ NẴNG (ORIGIN CHỦ ĐẠO / CẦU RỒNG)
// ============================================================================
const DANANG_ORIGIN_PLACEMENT: DestinationPlacement = {
  position: [-2.15, 0.0, 0.0],
  rotation: [0, 0.06, 0],
  scale: [1.38, 1.38, 1.38],
};

const DANANG_DEST_PLACEMENT: DestinationPlacement = {
  position: [2.15, 0.0, -0.20],
  rotation: [0, -0.06, 0],
  scale: [1.32, 1.32, 1.32],
};

const DANANG_ORIGIN_ANCHOR: DestinationLabelAnchor = {
  worldPosition: [-2.15, 0.92, 0.05],
  offset2D: [0, -18],
  badgeTitle: 'Đà Nẵng',
  badgeSubtitle: 'Cầu Rồng • Sông Hàn',
  icon: 'map-pin',
};

const DANANG_DEST_ANCHOR: DestinationLabelAnchor = {
  worldPosition: [2.15, 0.92, -0.15],
  offset2D: [0, -18],
  badgeTitle: 'Đà Nẵng',
  badgeSubtitle: 'Cầu Rồng • Sông Hàn',
  icon: 'map-pin',
};

export const DA_NANG_DESTINATION: DestinationDefinition = {
  id: 'da-nang',
  searchLocationId: 'da-nang',
  displayName: 'Đà Nẵng',
  administrativeArea: 'Thành phố Đà Nẵng',
  sceneLandmarkId: 'da-nang-cau-rong',
  tagline: 'Cầu Rồng sông Hàn • Điểm khởi hành phía Nam',
  hasDedicatedModel: true,
  supportedSlots: ['origin', 'destination'],

  model: {
    type: 'procedural-3d',
    name: 'Cầu Rồng & Cảnh quan Sông Hàn',
    landmarkName: 'Cầu Rồng (Dragon Bridge)',
    description:
      'Mô hình 3D Cầu Rồng với thân rồng uốn lượn hình sin đặc trưng bằng ống thép vàng, vây lưng rồng cách điệu, đầu rồng thời Lý vươn cao về hướng biển, đuôi rồng hoa sen, mặt cầu dầm thẳng có cáp treo và trụ cầu bê tông bo tròn. Kèm theo lòng sông Hàn cong tự nhiên, bờ kè đá mềm mại, cụm cây diorama và silhouette bán đảo Sơn Trà mờ xa.',
    geometrySummary:
      'Thân rồng TubeGeometry CatmullRom 3 nhịp uốn; 14 cặp vây lưng rồng; đầu rồng 3D đa diện; đuôi sen 3 cánh; mặt cầu Extrude; 3 trụ bê tông; mặt nước Ribbon cong; bờ kè đá; cây diorama tán tròn.',
    materials: {
      dragonGold: '#F59E0B',
      dragonFins: '#D97706',
      bridgeDeck: '#374151',
      piers: '#E5E0D8',
      riverWater: '#1E7B98',
      embankment: '#DDD6C9',
      foliage: '#3A6B4C',
      distantHills: '#4A6B5B',
    },
    hasBakedText: false,
    triangleBudget: 2400,
  },

  labelAnchor: Object.assign({}, DANANG_ORIGIN_ANCHOR, {
    origin: DANANG_ORIGIN_ANCHOR,
    destination: DANANG_DEST_ANCHOR,
  }),

  safeZone: {
    bounds: { minX: -3.5, maxX: -0.8, minY: 0.0, maxY: 1.05, minZ: -1.4, maxZ: 0.40 },
    headlineClearance: {
      description: 'Nằm trọn trong khung sân khấu 3D bên phải, không lấn sang editorial headline.',
      stageLeftMarginPct: 4.0,
    },
    vehicleClearance: {
      minDistanceToRoad: 0.42,
      minDistanceToCoachStop: 2.25,
      description: 'Cầu Rồng nằm phía bắc hậu cảnh, xe khách chạy trước cầu tạo chiều sâu nhiều lớp.',
    },
  },

  placements: {
    origin: DANANG_ORIGIN_PLACEMENT,
    destination: DANANG_DEST_PLACEMENT,
  },
  placement: DANANG_ORIGIN_PLACEMENT,

  approvalStatus: {
    isApproved: true,
    status: 'approved',
    approvalDate: '2026-10-24',
    version: '1.0.0',
    referenceImages: [
      'public/assets/images/scenes/scene_danang.jpg',
      'public/assets/images/scenes/journey-pop-up.webp',
      'public/assets/images/scenes/diorama_ticket_danang_hue.webp',
    ],
    verifiedCriteria: {
      recognizableWithoutLabel: true,
      noOverlapHeadline: true,
      noOverlapVehicle: true,
      noRectangularHardEdges: true,
      zeroBakedProvinceText: true,
      htmlSvgLabelAttached: true,
      standardCameraCompatibility: true,
    },
  },
};

// ============================================================================
// 2. ĐỊNH NGHĨA CHÍNH THỨC: HUẾ (DESTINATION CHỦ ĐẠO / NGỌ MÔN)
// ============================================================================
const HUE_DEST_PLACEMENT: DestinationPlacement = {
  position: [2.15, 0.0, -0.20],
  rotation: [0, -0.10, 0],
  scale: [1.32, 1.32, 1.32],
};

const HUE_ORIGIN_PLACEMENT: DestinationPlacement = {
  position: [-2.15, 0.0, 0.0],
  rotation: [0, 0.10, 0],
  scale: [1.35, 1.35, 1.35],
};

const HUE_DEST_ANCHOR: DestinationLabelAnchor = {
  worldPosition: [2.15, 0.92, -0.20],
  offset2D: [0, -18],
  badgeTitle: 'Huế',
  badgeSubtitle: 'Ngọ Môn • Cố Đô',
  icon: 'crown',
};

const HUE_ORIGIN_ANCHOR: DestinationLabelAnchor = {
  worldPosition: [-2.15, 0.92, 0.05],
  offset2D: [0, -18],
  badgeTitle: 'Huế',
  badgeSubtitle: 'Ngọ Môn • Cố Đô',
  icon: 'crown',
};

export const HUE_DESTINATION: DestinationDefinition = {
  id: 'hue',
  searchLocationId: 'hue',
  displayName: 'Huế',
  administrativeArea: 'Tỉnh Thừa Thiên Huế',
  sceneLandmarkId: 'hue-ngo-mon',
  tagline: 'Cố đô di sản • Ngọ Môn Hoàng Thành',
  hasDedicatedModel: true,
  supportedSlots: ['destination', 'origin'],

  model: {
    type: 'procedural-3d',
    name: 'Ngọ Môn & Quần thể Cố đô Huế',
    landmarkName: 'Ngọ Môn (Noon Gate, Hue Imperial Citadel)',
    description:
      'Mô hình 3D Ngọ Môn với đài thành khối đá chữ U kiên cố, 3 cổng vòm xuyên thành, lầu Ngũ Phụng 2 tầng mái lợp ngói hoàng lưu ly vàng rực rỡ và ngói thanh lưu ly xanh ngọc, hàng cột gỗ sơn son, lan can vọng đài, hồ sen Kim Thủy, cầu đá Trung Đạo và rừng thông Cố đô.',
    geometrySummary:
      'Đài thành khối đá chữ U Extrude; 3 cổng vòm xuyên thành; Lầu Ngũ Phụng 2 tầng mái kép hoàng lưu ly & thanh lưu ly; 20 cột gỗ; cầu đá Trung Đạo; hồ sen Kim Thủy; thông Cố đô.',
    materials: {
      terracottaBase: '#7D3C32',
      imperialYellowRoof: '#E5A93C',
      imperialGreenRoof: '#246D4E',
      lacquerWood: '#8C2518',
      stoneTerrace: '#DDD6C9',
      moatWater: '#226E88',
      lotusPads: '#3B8B5B',
      pineFoliage: '#225238',
      nguBinhHills: '#6A5D75',
    },
    hasBakedText: false,
    triangleBudget: 2400,
  },

  labelAnchor: Object.assign({}, HUE_DEST_ANCHOR, {
    origin: HUE_ORIGIN_ANCHOR,
    destination: HUE_DEST_ANCHOR,
  }),

  safeZone: {
    bounds: { minX: 0.9, maxX: 3.6, minY: 0.0, maxY: 1.05, minZ: -1.3, maxZ: 0.45 },
    headlineClearance: {
      description: 'Huế nằm trọn ở mạn phải của sân khấu vé 3D, cách xa vùng headline bên trái.',
      stageLeftMarginPct: 58.0,
    },
    vehicleClearance: {
      minDistanceToRoad: 0.38,
      minDistanceToCoachStop: 1.45,
      description: 'Xe khách đỗ ở t=0.62 hướng đầu xe về phía Ngọ Môn, không che khuất cổng thành.',
    },
  },

  placements: {
    origin: HUE_ORIGIN_PLACEMENT,
    destination: HUE_DEST_PLACEMENT,
  },
  placement: HUE_DEST_PLACEMENT,

  approvalStatus: {
    isApproved: true,
    status: 'approved',
    approvalDate: '2026-10-24',
    version: '1.0.0',
    referenceImages: [
      'public/assets/images/scenes/scene_hue.jpg',
      'public/assets/images/scenes/journey-pop-up.webp',
      'public/assets/images/scenes/diorama_ticket_danang_hue.webp',
    ],
    verifiedCriteria: {
      recognizableWithoutLabel: true,
      noOverlapHeadline: true,
      noOverlapVehicle: true,
      noRectangularHardEdges: true,
      zeroBakedProvinceText: true,
      htmlSvgLabelAttached: true,
      standardCameraCompatibility: true,
    },
  },
};

// ============================================================================
// 3. ĐỊNH NGHĨA CHÍNH THỨC: NHA TRANG (BƯỚC 10 / THÁP TRẦM HƯƠNG & VỊNH BIỂN)
// ============================================================================
const NHATRANG_DEST_PLACEMENT: DestinationPlacement = {
  position: [2.15, 0.0, -0.15],
  rotation: [0, -0.12, 0],
  scale: [1.32, 1.32, 1.32],
};

const NHATRANG_ORIGIN_PLACEMENT: DestinationPlacement = {
  position: [-2.15, 0.0, 0.0],
  rotation: [0, 0.08, 0],
  scale: [1.35, 1.35, 1.35],
};

const NHATRANG_DEST_ANCHOR: DestinationLabelAnchor = {
  worldPosition: [2.15, 0.95, -0.15],
  offset2D: [0, -18],
  badgeTitle: 'Nha Trang',
  badgeSubtitle: 'Tháp Trầm Hương • Vịnh Biển',
  icon: 'sparkles',
};

const NHATRANG_ORIGIN_ANCHOR: DestinationLabelAnchor = {
  worldPosition: [-2.15, 0.95, 0.05],
  offset2D: [0, -18],
  badgeTitle: 'Nha Trang',
  badgeSubtitle: 'Tháp Trầm Hương • Vịnh Biển',
  icon: 'sparkles',
};

export const NHA_TRANG_DESTINATION: DestinationDefinition = {
  id: 'nha-trang',
  searchLocationId: 'nha-trang',
  displayName: 'Nha Trang',
  administrativeArea: 'Tỉnh Khánh Hòa',
  sceneLandmarkId: 'nha-trang-tram-huong',
  tagline: 'Vịnh biển ngọc bích • Tháp Trầm Hương Quảng trường 2/4',
  hasDedicatedModel: true,
  supportedSlots: ['destination', 'origin'],

  model: {
    type: 'procedural-3d',
    name: 'Tháp Trầm Hương & Vịnh Biển Nha Trang',
    landmarkName: 'Tháp Trầm Hương (Agarwood Tower, Nha Trang)',
    description:
      'Mô hình 3D Tháp Trầm Hương đặc trưng bên bãi biển Trần Phú và Quảng trường 2/4. Tháp có hình búp sen cách điệu 3 tầng khí động học màu cam san hô ấm, đài sen đá mài mở rộng, ngọn bút tháp ngọc tỏa sáng trên đỉnh. Bao quanh bởi bãi cát vàng mịn, làn nước biển xanh ngọc bích viền sóng trắng, 2 cây dừa nghiêng duyên hải nhiệt đới và silhouette núi Cô Tiên phía xa.',
    geometrySummary:
      'Đế sen 5 cánh Cylindrical Extrude; 3 tầng cánh hoa búp sen cam san hô khí động học; ngọn bút ngọc chóp nhọn; dải cát biển cong hữu cơ; mặt nước vịnh ngọc bích; 2 cây dừa cong; đá Hòn Chồng.',
    materials: {
      towerCoralPetal: '#FF7043',   // Cam san hô ấm đặc trưng của Tháp Trầm Hương
      towerDeepOrange: '#E65100',   // Cam đậm viền cánh hoa sen
      towerAmberGlow: '#FFA726',    // Vàng nghệ cam cho lõi đài búp
      towerPinnacle: '#FFFDE7',     // Ngọc trắng sáng chóp ngọn bút
      towerGlassCyan: '#80DEEA',    // Khe kính lấy sáng lam ngọc
      granitePedestal: '#DDD6C9',   // Bệ đá mài granite màu ngà
      beachSand: '#E8D5B7',         // Bãi cát vàng mịn Nha Trang
      seaWater: '#00ACC1',          // Biển xanh ngọc bích vịnh Nha Trang
      surfFoam: '#E0F7FA',          // Bọt sóng biển trắng mịn
      palmTrunk: '#6D4C41',         // Thân dừa nhiệt đới nâu đốt
      palmFronds: '#2E7D32',        // Tàu lá dừa xanh mát
      coastalMountains: '#4A6B5B',  // Núi Cô Tiên sương mờ xa
    },
    hasBakedText: false,
    triangleBudget: 2400,
  },

  labelAnchor: Object.assign({}, NHATRANG_DEST_ANCHOR, {
    origin: NHATRANG_ORIGIN_ANCHOR,
    destination: NHATRANG_DEST_ANCHOR,
  }),

  safeZone: {
    bounds: { minX: 0.9, maxX: 3.6, minY: 0.0, maxY: 1.05, minZ: -1.3, maxZ: 0.45 },
    headlineClearance: {
      description: 'Nằm trọn ở mạn phải của sân khấu vé 3D, không che khuất headline bên trái.',
      stageLeftMarginPct: 58.0,
    },
    vehicleClearance: {
      minDistanceToRoad: 0.40,
      minDistanceToCoachStop: 1.45,
      description: 'Tháp Trầm Hương và bờ cát nằm ở mạn phải, xe khách dừng nhìn hướng ra biển.',
    },
  },

  placements: {
    origin: NHATRANG_ORIGIN_PLACEMENT,
    destination: NHATRANG_DEST_PLACEMENT,
  },
  placement: NHATRANG_DEST_PLACEMENT,

  approvalStatus: {
    isApproved: true,
    status: 'approved',
    approvalDate: '2026-10-24',
    version: '1.0.0',
    referenceImages: [
      'public/assets/images/scenes/scene_nhatrang.jpg',
      'public/assets/images/scenes/journey-pop-up.webp',
    ],
    verifiedCriteria: {
      recognizableWithoutLabel: true,    // Dáng Tháp Trầm Hương & biển nhận diện ngay
      noOverlapHeadline: true,
      noOverlapVehicle: true,
      noRectangularHardEdges: true,
      zeroBakedProvinceText: true,       // Tuyệt đối không bake chữ Nha Trang trên model
      htmlSvgLabelAttached: true,
      standardCameraCompatibility: true,
    },
  },
};

// ============================================================================
// 4. FALLBACK PHONG CẢNH TRUNG TÍNH (DÀNH CHO CÁC ĐỊA ĐIỂM CHƯA CÓ 3D CHUYÊN BIỆT)
// Tránh tuyệt đối việc gán nhãn sai tên tỉnh lên Ngọ Môn hay Cầu Rồng!
// ============================================================================
const NEUTRAL_DEST_PLACEMENT: DestinationPlacement = {
  position: [2.15, 0.0, -0.20],
  rotation: [0, -0.08, 0],
  scale: [1.30, 1.30, 1.30],
};

const NEUTRAL_ORIGIN_PLACEMENT: DestinationPlacement = {
  position: [-2.15, 0.0, 0.0],
  rotation: [0, 0.08, 0],
  scale: [1.32, 1.32, 1.32],
};

const NEUTRAL_DEST_ANCHOR: DestinationLabelAnchor = {
  worldPosition: [2.15, 0.85, -0.20],
  offset2D: [0, -18],
  badgeTitle: 'Điểm Đến',
  badgeSubtitle: 'Cung Đường Việt Nam',
  icon: 'map-pin',
};

const NEUTRAL_ORIGIN_ANCHOR: DestinationLabelAnchor = {
  worldPosition: [-2.15, 0.85, 0.05],
  offset2D: [0, -18],
  badgeTitle: 'Khởi Hành',
  badgeSubtitle: 'Cung Đường Việt Nam',
  icon: 'map-pin',
};

export const NEUTRAL_SCENIC_DESTINATION: DestinationDefinition = {
  id: 'neutral-scenic',
  searchLocationId: 'unknown',
  displayName: 'Việt Nam',
  administrativeArea: 'Cung đường liên tỉnh',
  sceneLandmarkId: 'neutral-scenic-hills',
  tagline: 'Cung đường non xanh nước biếc dải đất hình chữ S',
  hasDedicatedModel: false,
  supportedSlots: ['origin', 'destination'],

  model: {
    type: 'procedural-3d',
    name: 'Cảnh quan non bộ & Rừng thông duyên hải trung tính',
    landmarkName: 'Đồi núi & Thiên nhiên Việt Nam',
    description: 'Phong cảnh đồi xanh thanh bình, biển mây và rặng cây trung tính, phù hợp cho mọi tuyến chưa có landmark riêng.',
    geometrySummary: 'Đồi xanh đa giác mềm mại, cây thông diorama, mặt hồ phẳng ngà.',
    materials: {
      hills: '#3E664E',
      trees: '#275238',
      water: '#1F7089',
    },
    hasBakedText: false,
    triangleBudget: 1200,
  },

  labelAnchor: Object.assign({}, NEUTRAL_DEST_ANCHOR, {
    origin: NEUTRAL_ORIGIN_ANCHOR,
    destination: NEUTRAL_DEST_ANCHOR,
  }),

  safeZone: {
    bounds: { minX: 0.9, maxX: 3.6, minY: 0.0, maxY: 0.95, minZ: -1.3, maxZ: 0.45 },
    headlineClearance: {
      description: 'Không che headline bên trái.',
      stageLeftMarginPct: 58.0,
    },
    vehicleClearance: {
      minDistanceToRoad: 0.40,
      minDistanceToCoachStop: 1.45,
      description: 'Cảnh quan thoai thoải phía sau xe.',
    },
  },

  placements: {
    origin: NEUTRAL_ORIGIN_PLACEMENT,
    destination: NEUTRAL_DEST_PLACEMENT,
  },
  placement: NEUTRAL_DEST_PLACEMENT,

  approvalStatus: {
    isApproved: true,
    status: 'fallback',
    approvalDate: '2026-10-24',
    version: '1.0.0',
    referenceImages: [],
    verifiedCriteria: {
      recognizableWithoutLabel: false,
      noOverlapHeadline: true,
      noOverlapVehicle: true,
      noRectangularHardEdges: true,
      zeroBakedProvinceText: true,
      htmlSvgLabelAttached: true,
      standardCameraCompatibility: true,
    },
  },
};

// ============================================================================
// 5. CÁC ĐỊNH NGHĨA TUYẾN MẪU CHUẨN
// ============================================================================
export interface JourneyRouteDefinition {
  id: string; // VD: 'da-nang:hue', 'da-nang:nha-trang'
  title: string; // VD: 'ĐÀ NẴNG → HUẾ'
  fromId: string;
  toId: string;
  distanceKm: number;
  estimatedDuration: string;
  departureLabel: string;
  arrivalLabel: string;
  description: string;
  transitionType: 'pass' | 'coastal' | 'neutral';
}

export const SUPPORTED_ROUTES: Record<string, JourneyRouteDefinition> = {
  'da-nang:hue': {
    id: 'da-nang:hue',
    title: 'ĐÀ NẴNG → HUẾ',
    fromId: 'da-nang',
    toId: 'hue',
    distanceKm: 100,
    estimatedDuration: '2h 15m',
    departureLabel: 'Đà Nẵng',
    arrivalLabel: 'Huế',
    description: 'Hành trình di sản nối liền Cầu Rồng sông Hàn và Ngọ Môn Cố Đô Huế qua đèo Hải Vân',
    transitionType: 'pass',
  },
  'hue:da-nang': {
    id: 'hue:da-nang',
    title: 'HUẾ → ĐÀ NẴNG',
    fromId: 'hue',
    toId: 'da-nang',
    distanceKm: 100,
    estimatedDuration: '2h 15m',
    departureLabel: 'Huế',
    arrivalLabel: 'Đà Nẵng',
    description: 'Từ Cố Đô Huế trở về thành phố biển Đà Nẵng qua Đèo Hải Vân hùng vĩ',
    transitionType: 'pass',
  },
  'da-nang:nha-trang': {
    id: 'da-nang:nha-trang',
    title: 'ĐÀ NẴNG → NHA TRANG',
    fromId: 'da-nang',
    toId: 'nha-trang',
    distanceKm: 530,
    estimatedDuration: '9h 30m',
    departureLabel: 'Đà Nẵng',
    arrivalLabel: 'Nha Trang',
    description: 'Hành trình duyên hải Nam Trung Bộ từ Cầu Rồng sông Hàn đến vịnh ngọc Nha Trang Tháp Trầm Hương',
    transitionType: 'coastal',
  },
  'nha-trang:da-nang': {
    id: 'nha-trang:da-nang',
    title: 'NHA TRANG → ĐÀ NẴNG',
    fromId: 'nha-trang',
    toId: 'da-nang',
    distanceKm: 530,
    estimatedDuration: '9h 30m',
    departureLabel: 'Nha Trang',
    arrivalLabel: 'Đà Nẵng',
    description: 'Từ vịnh biển Nha Trang men theo cung đường duyên hải trở về Đà Nẵng',
    transitionType: 'coastal',
  },
  'nha-trang:hue': {
    id: 'nha-trang:hue',
    title: 'NHA TRANG → HUẾ',
    fromId: 'nha-trang',
    toId: 'hue',
    distanceKm: 630,
    estimatedDuration: '11h 45m',
    departureLabel: 'Nha Trang',
    arrivalLabel: 'Huế',
    description: 'Hành trình kết nối vịnh biển Nha Trang và Cố đô Huế di sản',
    transitionType: 'coastal',
  },
  'hue:nha-trang': {
    id: 'hue:nha-trang',
    title: 'HUẾ → NHA TRANG',
    fromId: 'hue',
    toId: 'nha-trang',
    distanceKm: 630,
    estimatedDuration: '11h 45m',
    departureLabel: 'Huế',
    arrivalLabel: 'Nha Trang',
    description: 'Từ Cố đô Huế xuôi về phương Nam đón nắng gió vịnh biển Nha Trang',
    transitionType: 'coastal',
  },
};

export const DA_NANG_HUE_ROUTE = SUPPORTED_ROUTES['da-nang:hue'];
export const DA_NANG_NHA_TRANG_ROUTE = SUPPORTED_ROUTES['da-nang:nha-trang'];

// ============================================================================
// 6. BẢNG TRA CỨU ALIAS CHUẨN XÁC TỪ FORM TÌM KIẾM
// ============================================================================
export const LOCATION_CANONICAL_MAP: Record<string, string> = {
  // Đà Nẵng
  'da-nang': 'da-nang',
  'đà nẵng': 'da-nang',
  'da nang': 'da-nang',
  'danang': 'da-nang',
  'dad': 'da-nang',
  'thành phố đà nẵng': 'da-nang',

  // Huế
  'hue': 'hue',
  'huế': 'hue',
  'thừa thiên huế': 'hue',
  'thua thien hue': 'hue',
  'hui': 'hue',
  'tỉnh thừa thiên huế': 'hue',

  // Nha Trang
  'nha-trang': 'nha-trang',
  'nha trang': 'nha-trang',
  'nhatrang': 'nha-trang',
  'khánh hòa': 'nha-trang',
  'khanh hoa': 'nha-trang',
  'cxr': 'nha-trang',
  'tỉnh khánh hòa': 'nha-trang',

  // Các tỉnh thành khác trong form (được map về canonical ID tìm kiếm)
  'hoi-an': 'hoi-an',
  'hội an': 'hoi-an',
  'hoi an': 'hoi-an',
  'quảng nam': 'hoi-an',

  'quy-nhon': 'quy-nhon',
  'quy nhơn': 'quy-nhon',
  'quy nhon': 'quy-nhon',
  'bình định': 'quy-nhon',

  'ha-noi': 'ha-noi',
  'hà nội': 'ha-noi',
  'ha noi': 'ha-noi',
  'hanoi': 'ha-noi',

  'ho-chi-minh': 'ho-chi-minh',
  'tp. hồ chí minh': 'ho-chi-minh',
  'tp hồ chí minh': 'ho-chi-minh',
  'hồ chí minh': 'ho-chi-minh',
  'sài gòn': 'ho-chi-minh',
  'tphcm': 'ho-chi-minh',
};

// ============================================================================
// 7. REGISTRY CÔNG KHAI CÁC ĐỊA ĐIỂM (BƯỚC 10)
// ============================================================================
export const DESTINATION_REGISTRY: Record<string, DestinationDefinition> = {
  'da-nang': DA_NANG_DESTINATION,
  'hue': HUE_DESTINATION,
  'nha-trang': NHA_TRANG_DESTINATION,
};

/**
 * Chuẩn hóa input tìm kiếm sang mã địa điểm canonical
 */
export function getCanonicalLocationId(input: string): string {
  if (!input) return 'da-nang';
  const clean = input.trim().toLowerCase();
  return LOCATION_CANONICAL_MAP[clean] || clean;
}

/**
 * Phân giải DestinationDefinition tương ứng với địa điểm tìm kiếm và vị trí slot
 * Đảm bảo:
 * - Chọn 'Nha Trang' -> Trả về NHA_TRANG_DESTINATION (Tháp Trầm Hương)
 * - Chọn 'Huế' -> Trả về HUE_DESTINATION (Ngọ Môn)
 * - Chọn 'Đà Nẵng' -> Trả về DA_NANG_DESTINATION (Cầu Rồng)
 * - Địa điểm chưa có model -> Trả về bản sao NEUTRAL_SCENIC_DESTINATION có gắn nhãn đúng tên người dùng chọn,
 *   TUYỆT ĐỐI KHÔNG gắn nhãn Nha Trang lên Ngọ Môn hoặc ngược lại!
 */
export function resolveDestination(
  input: string,
  slot: 'origin' | 'destination' = 'destination'
): DestinationDefinition {
  const canonId = getCanonicalLocationId(input);
  const matched = DESTINATION_REGISTRY[canonId];

  if (matched && matched.hasDedicatedModel) {
    return matched;
  }

  // Fallback an toàn cho các địa điểm chưa có model 3D chuyên biệt
  const cleanName = input.trim();
  const fallbackAnchor: DestinationLabelAnchor = {
    worldPosition: slot === 'origin' ? [-2.15, 0.85, 0.05] : [2.15, 0.85, -0.20],
    offset2D: [0, -18],
    badgeTitle: cleanName || (slot === 'origin' ? 'Điểm đi' : 'Điểm đến'),
    badgeSubtitle: 'Cung đường liên tỉnh',
    icon: 'map-pin',
  };

  return {
    ...NEUTRAL_SCENIC_DESTINATION,
    id: canonId,
    searchLocationId: canonId,
    displayName: cleanName,
    administrativeArea: `Khu vực ${cleanName}`,
    tagline: `Hành trình khám phá ${cleanName} cùng DANAVA GO`,
    labelAnchor: Object.assign({}, fallbackAnchor, {
      origin: fallbackAnchor,
      destination: fallbackAnchor,
    }),
  };
}

/**
 * Phân giải thông tin tuyến đường nối liền hai địa điểm
 */
export function resolveRoute(fromInput: string, toInput: string): JourneyRouteDefinition {
  const fromId = getCanonicalLocationId(fromInput);
  const toId = getCanonicalLocationId(toInput);
  const routeKey = `${fromId}:${toId}`;

  if (SUPPORTED_ROUTES[routeKey]) {
    return SUPPORTED_ROUTES[routeKey];
  }

  // Tuyến động tự tạo nếu chưa có trong danh bạ cố định
  const fromName = fromInput.trim() || 'Đà Nẵng';
  const toName = toInput.trim() || 'Huế';
  return {
    id: routeKey,
    title: `${fromName.toUpperCase()} → ${toName.toUpperCase()}`,
    fromId,
    toId,
    distanceKm: 250,
    estimatedDuration: '4h 30m',
    departureLabel: fromName,
    arrivalLabel: toName,
    description: `Hành trình kết nối ${fromName} và ${toName} trên chuyên xa cao cấp`,
    transitionType: 'neutral',
  };
}

/**
 * Tương thích ngược với các file gọi cũ
 */
export function getDestinationDefinition(id: string): DestinationDefinition | undefined {
  return DESTINATION_REGISTRY[id];
}

/**
 * Báo cáo công khai hiện trạng Asset Registry của DANAVA GO (Yêu cầu 10)
 */
export function getPublicDestinationRegistryReport(): {
  approvedCount: number;
  fallbackCount: number;
  registry: Array<{
    searchId: string;
    city: string;
    province: string;
    landmark: string;
    status: 'approved' | 'fallback';
    hasDedicatedModel: boolean;
  }>;
} {
  const list = [
    {
      searchId: 'da-nang',
      city: 'Đà Nẵng',
      province: 'Thành phố Đà Nẵng',
      landmark: 'Cầu Rồng & Sông Hàn',
      status: 'approved' as const,
      hasDedicatedModel: true,
    },
    {
      searchId: 'hue',
      city: 'Huế',
      province: 'Tỉnh Thừa Thiên Huế',
      landmark: 'Ngọ Môn & Cố Đô Hoàng Thành',
      status: 'approved' as const,
      hasDedicatedModel: true,
    },
    {
      searchId: 'nha-trang',
      city: 'Nha Trang',
      province: 'Tỉnh Khánh Hòa',
      landmark: 'Tháp Trầm Hương & Vịnh Biển Trần Phú',
      status: 'approved' as const,
      hasDedicatedModel: true,
    },
    {
      searchId: 'hoi-an',
      city: 'Hội An',
      province: 'Tỉnh Quảng Nam',
      landmark: 'Cảnh quan di sản (Đang phát triển)',
      status: 'fallback' as const,
      hasDedicatedModel: false,
    },
    {
      searchId: 'quy-nhon',
      city: 'Quy Nhơn',
      province: 'Tỉnh Bình Định',
      landmark: 'Cung đường duyên hải (Đang phát triển)',
      status: 'fallback' as const,
      hasDedicatedModel: false,
    },
    {
      searchId: 'ha-noi',
      city: 'Hà Nội',
      province: 'Thành phố Hà Nội',
      landmark: 'Phong cảnh liên tỉnh (Dự kiến)',
      status: 'fallback' as const,
      hasDedicatedModel: false,
    },
    {
      searchId: 'ho-chi-minh',
      city: 'TP. Hồ Chí Minh',
      province: 'Thành phố Hồ Chí Minh',
      landmark: 'Phong cảnh liên tỉnh (Dự kiến)',
      status: 'fallback' as const,
      hasDedicatedModel: false,
    },
  ];

  return {
    approvedCount: list.filter((x) => x.status === 'approved').length,
    fallbackCount: list.filter((x) => x.status === 'fallback').length,
    registry: list,
  };
}
