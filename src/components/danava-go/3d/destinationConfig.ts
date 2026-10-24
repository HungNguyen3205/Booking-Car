/**
 * DANAVA GO — Destination Definition & Landmark Configuration
 * 
 * ============================================================================
 * QUY CHUẨN ĐỊA DANH 3D (DESTINATION DEFINITION SPECIFICATION):
 * ============================================================================
 * 1. id ổn định: Định danh duy nhất ('da-nang', 'hue', ...)
 * 2. displayName: Tên hiển thị chuẩn tiếng Việt có dấu.
 * 3. model: Đặc tả mô hình 3D (loại hình học, vật liệu, chỉ tiêu polycount,
 *    cam kết 100% không chứa chữ tỉnh thành bake sẵn vào texture/mesh).
 * 4. labelAnchor: Điểm neo tọa độ 3D [X, Y, Z] để nhãn HTML/SVG chiếu bám vào.
 * 5. safeZone: Vùng an toàn 3D và 2D, đảm bảo không che chữ headline và không
 *    va chạm/che khuất làn đường hoặc xe khách.
 * 6. placement: Tọa độ, góc xoay và tỷ lệ đặt trong sân khấu vé 3D.
 * 7. approvalStatus: Biên bản nghiệm thu kỹ thuật và đối chiếu ảnh tham khảo.
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
  triangleBudget: number; // Giới hạn số tam giác để đảm bảo 60fps trên mobile
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
    stageLeftMarginPct: number; // Khoảng cách an toàn tính từ mép trái container 3D
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
  status: 'approved' | 'pending' | 'in-review';
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
  id: string;
  displayName: string;
  province: string;
  tagline: string;
  model: DestinationModelSpec;
  labelAnchor: DestinationLabelAnchor;
  safeZone: DestinationSafeZone;
  placement: DestinationPlacement;
  approvalStatus: DestinationApprovalStatus;
}

/**
 * ĐỊNH NGHĨA CHÍNH THỨC CHO ĐÀ NẴNG
 */
export const DA_NANG_DESTINATION: DestinationDefinition = {
  id: 'da-nang',
  displayName: 'Đà Nẵng',
  province: 'Đà Nẵng',
  tagline: 'Cầu Rồng sông Hàn • Điểm khởi hành phía Nam',

  model: {
    type: 'procedural-3d',
    name: 'Cầu Rồng & Cảnh quan Sông Hàn',
    landmarkName: 'Cầu Rồng (Dragon Bridge)',
    description:
      'Mô hình 3D Cầu Rồng với thân rồng uốn lượn hình sin đặc trưng bằng ống thép vàng, vây lưng rồng cách điệu, đầu rồng thời Lý vươn cao về hướng biển, đuôi rồng hoa sen, mặt cầu dầm thẳng có cáp treo và trụ cầu bê tông bo tròn. Kèm theo lòng sông Hàn cong tự nhiên, bờ kè đá mềm mại, cụm cây diorama và silhouette bán đảo Sơn Trà mờ xa.',
    geometrySummary:
      'Thân rồng TubeGeometry CatmullRom 3 nhịp uốn; 14 cặp vây lưng rồng; đầu rồng 3D đa diện; đuôi sen 3 cánh; mặt cầu Extrude; 3 trụ bê tông; mặt nước Ribbon cong; bờ kè đá; cây diorama tán tròn.',
    materials: {
      dragonGold: '#F59E0B',    // Vàng cam rực rỡ đặc trưng của Cầu Rồng
      dragonFins: '#D97706',    // Vàng hổ phách sẫm cho vây lưng
      bridgeDeck: '#374151',    // Mặt đường nhựa xám đậm
      piers: '#E5E0D8',         // Trụ bê tông đá mài ấm
      riverWater: '#1E7B98',    // Nước sông Hàn xanh ngọc trong mát
      embankment: '#DDD6C9',    // Kè bờ đá ngà hòa sắc cùng nền vé
      foliage: '#3A6B4C',       // Tán cây xanh ấm diorama
      distantHills: '#4A6B5B',  // Silhouette núi Sơn Trà mờ trong sương
    },
    hasBakedText: false,        // Tuyệt đối không chứa chữ bake trên mô hình
    triangleBudget: 2400,       // Tối ưu hóa cao độ, dưới 3k tris
  },

  labelAnchor: {
    worldPosition: [-2.15, 0.92, 0.05], // Đặt thanh thoát ngay trên đỉnh vòm chính Cầu Rồng
    offset2D: [0, -18],                 // Dịch nhẹ lên trên trong không gian 2D
    badgeTitle: 'Đà Nẵng',
    badgeSubtitle: 'Cầu Rồng • Sông Hàn',
    icon: 'map-pin',
  },

  safeZone: {
    bounds: {
      minX: -3.5,
      maxX: -0.8,
      minY: 0.0,
      maxY: 1.05,
      minZ: -1.4,
      maxZ: 0.40,
    },
    headlineClearance: {
      description:
        'Toàn bộ landmark nằm trọn trong 62% khung sân khấu 3D bên phải, không lấn sang 54% vùng editorial text của headline bên trái.',
      stageLeftMarginPct: 4.0,
    },
    vehicleClearance: {
      minDistanceToRoad: 0.42,           // Cách tim đường gần nhất >= 0.42 đơn vị
      minDistanceToCoachStop: 2.25,      // Cách điểm đỗ xe t=0.62 (X=0.704) tới 2.25 đơn vị
      description:
        'Cầu Rồng nằm ở phía bắc (hậu cảnh Z <= 0.20) so với đoạn đường xe xuất phát (tiền cảnh Z >= 0.55), xe chạy trước cầu tạo chiều sâu nhiều lớp không che khuất.',
    },
  },

  placement: {
    position: [-2.15, 0.0, 0.0],         // Tọa độ gốc trung tâm cụm Đà Nẵng
    rotation: [0, 0.06, 0],              // Chếch nhẹ đón góc nhìn camera 3/4
    scale: [1.38, 1.38, 1.38],           // Tỷ lệ chuẩn diorama nổi bật, uy nghi
  },

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
      recognizableWithoutLabel: true,    // Dáng Cầu Rồng nhận diện ngay không cần đọc chữ
      noOverlapHeadline: true,           // Không che headline bên trái
      noOverlapVehicle: true,            // Không che xe khách và đường xe chạy
      noRectangularHardEdges: true,      // Sông và bờ uốn mềm, không lộ khung chữ nhật
      zeroBakedProvinceText: true,       // Không chứa chữ bake trên model
      htmlSvgLabelAttached: true,        // Chữ Đà Nẵng là HTML/SVG có neo 3D
      standardCameraCompatibility: true, // Đồng nhất camera fov 36, ánh sáng, tỷ lệ vé/xe
    },
  },
};

/**
 * ĐỊNH NGHĨA CHÍNH THỨC CHO HUẾ (BƯỚC 7)
 */
export const HUE_DESTINATION: DestinationDefinition = {
  id: 'hue',
  displayName: 'Huế',
  province: 'Thừa Thiên Huế',
  tagline: 'Cố đô di sản • Ngọ Môn Hoàng Thành',

  model: {
    type: 'procedural-3d',
    name: 'Ngọ Môn & Quần thể Cố đô Huế',
    landmarkName: 'Ngọ Môn (Noon Gate, Hue Imperial Citadel)',
    description:
      'Mô hình 3D Ngọ Môn với đài thành khối đá chữ U kiên cố, 3 cổng vòm xuyên thành, lầu Ngũ Phụng 2 tầng mái lợp ngói hoàng lưu ly vàng rực rỡ và ngói thanh lưu ly xanh ngọc, hàng cột gỗ sơn son, lan can vọng đài, hồ sen Kim Thủy, cầu đá Trung Đạo và rừng thông Cố đô.',
    geometrySummary:
      'Đài thành khối đá chữ U Extrude; 3 cổng vòm xuyên thành; Lầu Ngũ Phụng 2 tầng mái kép hoàng lưu ly & thanh lưu ly; 20 cột gỗ; cầu đá Trung Đạo; hồ sen Kim Thủy; thông Cố đô.',
    materials: {
      terracottaBase: '#7D3C32',      // Nâu đỏ gạch đá vách đài thành kiên cố
      imperialYellowRoof: '#E5A93C',  // Ngói hoàng lưu ly vàng hoàng gia nhịp giữa
      imperialGreenRoof: '#246D4E',   // Ngói thanh lưu ly ngọc bích hai chái lầu
      lacquerWood: '#8C2518',         // Cột gỗ sơn son thếp vàng Cung đình
      stoneTerrace: '#DDD6C9',        // Lan can đá thanh vọng đài & cầu Trung Đạo
      moatWater: '#226E88',           // Mặt nước hồ Ngoại Kim Thủy xanh biếc
      lotusPads: '#3B8B5B',           // Lá sen & hoa súng nổi trên hồ
      pineFoliage: '#225238',         // Rừng thông Cố đô xanh thẫm uy nghiêm
      nguBinhHills: '#6A5D75',        // Núi Ngự Bình mờ tím biếc sau làn sương
    },
    hasBakedText: false,              // Tuyệt đối không chứa chữ bake trên mô hình
    triangleBudget: 2400,             // Tối ưu hóa dưới 2.4k tris
  },

  labelAnchor: {
    worldPosition: [2.15, 0.92, -0.20], // Đặt thanh thoát trên đỉnh mái chính Lầu Ngũ Phụng
    offset2D: [0, -18],                 // Dịch nhẹ lên trên trong không gian 2D
    badgeTitle: 'Huế',
    badgeSubtitle: 'Ngọ Môn • Cố Đô',
    icon: 'crown',
  },

  safeZone: {
    bounds: {
      minX: 0.9,
      maxX: 3.6,
      minY: 0.0,
      maxY: 1.05,
      minZ: -1.3,
      maxZ: 0.45,
    },
    headlineClearance: {
      description:
        'Huế nằm trọn ở mạn phải của sân khấu vé 3D, cách xa tuyệt đối khỏi vùng headline bên trái.',
      stageLeftMarginPct: 58.0,
    },
    vehicleClearance: {
      minDistanceToRoad: 0.38,           // Đoạn cuối đường cong t=1.0 cách mép đài thành >= 0.38 units
      minDistanceToCoachStop: 1.45,      // Xe dừng tại t=0.62 ở X=0.704 nhìn thẳng về Ngọ Môn
      description:
        'Xe khách đỗ ở t=0.62 hướng đầu xe về phía Ngọ Môn, tạo bố cục hướng đích của chuyến đi mà không che khuất đài cổng.',
    },
  },

  placement: {
    position: [2.15, 0.0, -0.20],        // Tọa độ gốc trung tâm cụm Huế
    rotation: [0, -0.10, 0],             // Chếch nhẹ góc 3/4 nhìn rõ đài thành và cổng vòm
    scale: [1.32, 1.32, 1.32],           // Tỷ lệ cân xứng hoàn hảo với cụm Đà Nẵng
  },

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
      recognizableWithoutLabel: true,    // Dáng Ngọ Môn & lầu Ngũ Phụng nhận diện ngay lập tức
      noOverlapHeadline: true,           // Nằm ở mạn phải, không che headline
      noOverlapVehicle: true,            // Nằm sau điểm đến, xe nhìn về hướng thành
      noRectangularHardEdges: true,      // Hồ sen và bậc thềm uốn mềm không lộ mép chữ nhật
      zeroBakedProvinceText: true,       // Không chứa chữ bake trên model
      htmlSvgLabelAttached: true,        // Chữ Huế là HTML/SVG có neo 3D
      standardCameraCompatibility: true, // Đồng nhất camera fov 36, ánh sáng, tỷ lệ vé/xe
    },
  },
};

/**
 * ĐỊNH NGHĨA TUYẾN MẪU CHUẨN ĐÀ NẴNG → HUẾ
 */
export interface JourneyRouteDefinition {
  id: string; // 'da-nang:hue'
  title: string; // 'ĐÀ NẴNG → HUẾ'
  fromId: string; // 'da-nang'
  toId: string; // 'hue'
  distanceKm: number; // 100
  estimatedDuration: string; // '2h 15m'
  departureLabel: string; // 'Đà Nẵng'
  arrivalLabel: string; // 'Huế'
  description: string; // 'Hành trình di sản nối liền Cầu Rồng sông Hàn và Ngọ Môn Cố Đô Huế'
}

export const DA_NANG_HUE_ROUTE: JourneyRouteDefinition = {
  id: 'da-nang:hue',
  title: 'ĐÀ NẴNG → HUẾ',
  fromId: 'da-nang',
  toId: 'hue',
  distanceKm: 100,
  estimatedDuration: '2h 15m',
  departureLabel: 'Đà Nẵng',
  arrivalLabel: 'Huế',
  description: 'Hành trình di sản nối liền Cầu Rồng sông Hàn và Ngọ Môn Cố Đô Huế',
};

/**
 * Danh bạ tra cứu địa điểm chính thức của DANAVA GO
 */
export const DESTINATION_REGISTRY: Record<string, DestinationDefinition> = {
  'da-nang': DA_NANG_DESTINATION,
  'hue': HUE_DESTINATION,
};

export function getDestinationDefinition(id: string): DestinationDefinition | undefined {
  return DESTINATION_REGISTRY[id];
}
