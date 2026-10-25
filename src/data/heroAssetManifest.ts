import type { VehicleCategory } from '../types';
import { getCanonicalLocationId, getLocationDisplayName } from './sceneManifest';

/**
 * Định nghĩa thông số kỹ thuật và tạo hình của từng dòng xe
 */
export interface HeroVehicleModelAsset {
  id: VehicleCategory;
  name: string;
  categoryLabel: string;
  assetPath: string;
  altText: string;
  headingDirection: 'right';
  perspective: '3/4 front isometric';
  aspectRatio: number;
  intrinsicWidth: number;
  intrinsicHeight: number;
  scaleRelative: number; // Tỷ lệ tương quan kích thước thực giữa các xe
  groundContact: {
    shadowWidthPercent: number;
    shadowHeightPercent: number;
    shadowLeftPercent: number;
    shadowBottomPercent: number;
    blurPx: number;
    opacity: number;
  };
  specs: {
    seatsTotal: number;
    floors: number;
    amenitiesHighlight: string;
  };
  provenance: {
    sourceType: 'local_studio_render';
    resolution: string;
    internalNote: string;
  };
}

/**
 * Điểm nhấn văn hóa & căn chỉnh vị trí trên sa bàn hành trình
 */
export interface LandmarkCulturalPoint {
  id: string;
  city: string;
  landmarkName: string;
  culturalSignificance: string;
  badgeDesktop: {
    left: string;
    top: string;
  };
  badgeMobile: {
    left: string;
    top: string;
  };
}

/**
 * Cấu hình tài nguyên cảnh quan theo tuyến
 */
export interface HeroRouteSceneAsset {
  routeId: string;
  fromCity: string;
  toCity: string;
  title: string;
  itineraryConcept: string;
  scenicType: 'heritage_pass' | 'coastal_highway' | 'neutral_highway';
  primaryPanoramaAsset: string;
  fallbackLandscapeAsset: string;
  roadAsset?: string;
  landmarksAsset?: string;
  originLandmark: LandmarkCulturalPoint;
  destinationLandmark: LandmarkCulturalPoint;
  roadAlignment: {
    roadBaselineBottom: string;
    vehicleRightDesktop: string;
    vehicleRightMobile: string;
    vehicleBottomDesktop: string;
    vehicleBottomMobile: string;
  };
  provenance: {
    sourceType: 'local_panoramic_artwork';
    resolution: string;
    internalNote: string;
  };
}

/**
 * BỘ TÀI NGUYÊN 3 DÒNG XE CAO CẤP TÁCH NỀN — ĐẦU XE HƯỚNG PHẢI
 */
export const HERO_VEHICLES_MANIFEST: Record<VehicleCategory, HeroVehicleModelAsset> = {
  sleeper: {
    id: 'sleeper',
    name: 'Giường nằm 34 chỗ',
    categoryLabel: 'Giường nằm',
    assetPath: '/assets/images/bus_coach_sleeper_right.png',
    altText: 'Xe khách giường nằm cao cấp Danava Go màu xanh Royal Navy hướng sang phải',
    headingDirection: 'right',
    perspective: '3/4 front isometric',
    aspectRatio: 1376 / 768,
    intrinsicWidth: 1376,
    intrinsicHeight: 768,
    scaleRelative: 1.0,
    groundContact: {
      shadowWidthPercent: 78,
      shadowHeightPercent: 11,
      shadowLeftPercent: 12,
      shadowBottomPercent: 4.5,
      blurPx: 12,
      opacity: 0.35,
    },
    specs: {
      seatsTotal: 34,
      floors: 2,
      amenitiesHighlight: 'Khoang đệm êm giảm chấn, cổng sạc Type-C, wifi và rèm che riêng tư',
    },
    provenance: {
      sourceType: 'local_studio_render',
      resolution: '1376x768 PNG 32-bit (RGBA alpha cutout)',
      internalNote: 'Tách nền sạch bằng rembg, góc 3/4 mặt nghiêng, sơn xanh Deep Royal Navy #10274C',
    },
  },
  limousine: {
    id: 'limousine',
    name: 'Limousine VIP 16 chỗ',
    categoryLabel: 'Limousine',
    assetPath: '/assets/images/bus_limousine_right.png',
    altText: 'Xe Limousine VIP chuyên cơ mặt đất Danava Go màu xanh navy hướng sang phải',
    headingDirection: 'right',
    perspective: '3/4 front isometric',
    aspectRatio: 1376 / 768,
    intrinsicWidth: 1376,
    intrinsicHeight: 768,
    scaleRelative: 0.88,
    groundContact: {
      shadowWidthPercent: 74,
      shadowHeightPercent: 10,
      shadowLeftPercent: 14,
      shadowBottomPercent: 4.5,
      blurPx: 10,
      opacity: 0.32,
    },
    specs: {
      seatsTotal: 16,
      floors: 1,
      amenitiesHighlight: 'Ghế bọc da ngả 135°, cổng sạc từng vị trí, tủ lạnh mini và đón trả linh hoạt',
    },
    provenance: {
      sourceType: 'local_studio_render',
      resolution: '1376x768 PNG 32-bit (RGBA alpha cutout)',
      internalNote: 'Dòng van VIP sang trọng, mâm hợp kim đa chấu, kính đen cách nhiệt, đầu xe hướng phải',
    },
  },
  cabin: {
    id: 'cabin',
    name: 'Cabin VIP 22 phòng',
    categoryLabel: 'Cabin VIP',
    assetPath: '/assets/images/bus_cabin_right.png',
    altText: 'Xe Cabin Hoàng Gia 22 phòng Danava Go 2 tầng hướng sang phải',
    headingDirection: 'right',
    perspective: '3/4 front isometric',
    aspectRatio: 1376 / 768,
    intrinsicWidth: 1376,
    intrinsicHeight: 768,
    scaleRelative: 1.02,
    groundContact: {
      shadowWidthPercent: 80,
      shadowHeightPercent: 12,
      shadowLeftPercent: 11,
      shadowBottomPercent: 4.5,
      blurPx: 12,
      opacity: 0.38,
    },
    specs: {
      seatsTotal: 22,
      floors: 2,
      amenitiesHighlight: 'Phòng riêng biệt lập, massage đa điểm, màn hình giải trí và cách âm chuyên dụng',
    },
    provenance: {
      sourceType: 'local_studio_render',
      resolution: '1376x768 PNG 32-bit (RGBA alpha cutout)',
      internalNote: 'Dáng xe 2 tầng cabin hoàng gia, viền vòm mui champagne gold, tem Danava Go sắc nét',
    },
  },
};

/**
 * BỘ TÀI NGUYÊN BỐI CẢNH THEO TUYẾN
 */
export const HERO_ROUTES_MANIFEST: Record<string, HeroRouteSceneAsset> = {
  // Tuyến chính 1: Đà Nẵng ↔ Hội An (Dấu ấn Cầu Rồng & Phố Cổ Sông Hoài)
  'da-nang:hoi-an': {
    routeId: 'da-nang:hoi-an',
    fromCity: 'Đà Nẵng',
    toCity: 'Hội An',
    title: 'Đà Nẵng — Hội An: Hành trình Phố Cổ & Sông Hoài',
    itineraryConcept: 'Minh họa hành trình từ Cầu Rồng sông Hàn đến phố cổ Hội An tường vàng ngói đỏ, đèn lồng và dòng sông Hoài trên sa bàn diorama',
    scenicType: 'heritage_pass',
    primaryPanoramaAsset: '/assets/images/scenes/journey_danang_hoian.webp',
    fallbackLandscapeAsset: '/assets/images/scenes/journey_danang_hoian.webp',
    roadAsset: '/assets/images/scenes/road_foreground_danang_hoian.webp',
    landmarksAsset: '/assets/images/scenes/landmarks_danang_hoian.webp',
    originLandmark: {
      id: 'da-nang',
      city: 'Đà Nẵng',
      landmarkName: 'Cầu Rồng & Sông Hàn',
      culturalSignificance: 'Biểu tượng vươn mình của thành phố biển năng động miền Trung',
      badgeDesktop: { left: '44%', top: '24%' },
      badgeMobile: { left: '26%', top: '22%' },
    },
    destinationLandmark: {
      id: 'hoi-an',
      city: 'Hội An',
      landmarkName: 'Phố Cổ & Sông Hoài',
      culturalSignificance: 'Đô thị cổ Di sản Văn hóa Thế giới lung linh sắc màu đèn lồng ven sông',
      badgeDesktop: { left: '79%', top: '20%' },
      badgeMobile: { left: '72%', top: '18%' },
    },
    roadAlignment: {
      roadBaselineBottom: '12%',
      vehicleRightDesktop: '12%',
      vehicleRightMobile: '6%',
      vehicleBottomDesktop: '13%',
      vehicleBottomMobile: '8%',
    },
    provenance: {
      sourceType: 'local_panoramic_artwork',
      resolution: '1376x768 WebP 95% quality',
      internalNote: 'Tài nguyên sa bàn diorama chân thực: Cầu Rồng, đồng bằng duyên hải, Phố Cổ Hội An và dải đường tiền cảnh độc lập',
    },
  },

  // Tuyến đảo chiều: Hội An → Đà Nẵng
  'hoi-an:da-nang': {
    routeId: 'hoi-an:da-nang',
    fromCity: 'Hội An',
    toCity: 'Đà Nẵng',
    title: 'Hội An — Đà Nẵng: Hành trình về thành phố Cầu Rồng',
    itineraryConcept: 'Hành trình khứ hồi từ phố cổ Hội An về thành phố biển Đà Nẵng',
    scenicType: 'heritage_pass',
    primaryPanoramaAsset: '/assets/images/scenes/journey_danang_hoian.webp',
    fallbackLandscapeAsset: '/assets/images/scenes/journey_danang_hoian.webp',
    roadAsset: '/assets/images/scenes/road_foreground_danang_hoian.webp',
    landmarksAsset: '/assets/images/scenes/landmarks_danang_hoian.webp',
    originLandmark: {
      id: 'hoi-an',
      city: 'Hội An',
      landmarkName: 'Phố Cổ & Sông Hoài',
      culturalSignificance: 'Đô thị cổ Di sản Văn hóa Thế giới lung linh sắc màu đèn lồng ven sông',
      badgeDesktop: { left: '79%', top: '20%' },
      badgeMobile: { left: '72%', top: '18%' },
    },
    destinationLandmark: {
      id: 'da-nang',
      city: 'Đà Nẵng',
      landmarkName: 'Cầu Rồng & Sông Hàn',
      culturalSignificance: 'Biểu tượng vươn mình của thành phố biển năng động miền Trung',
      badgeDesktop: { left: '44%', top: '24%' },
      badgeMobile: { left: '26%', top: '22%' },
    },
    roadAlignment: {
      roadBaselineBottom: '12%',
      vehicleRightDesktop: '12%',
      vehicleRightMobile: '6%',
      vehicleBottomDesktop: '13%',
      vehicleBottomMobile: '8%',
    },
    provenance: {
      sourceType: 'local_panoramic_artwork',
      resolution: '1376x768 WebP 95% quality',
      internalNote: 'Đảo nhãn hiển thị xuất phát Hội An và đích đến Đà Nẵng',
    },
  },

  // Tuyến chính 2: Đà Nẵng ↔ Huế (Dấu ấn Cầu Rồng & Ngọ Môn Huế)
  'da-nang:hue': {
    routeId: 'da-nang:hue',
    fromCity: 'Đà Nẵng',
    toCity: 'Huế',
    title: 'Đà Nẵng — Huế: Cung đường di sản miền Trung',
    itineraryConcept: 'Minh họa hành trình từ Cầu Rồng sông Hàn vượt Đèo Hải Vân đến Cố đô Huế Ngọ Môn trên sa bàn pop-up chân thực',
    scenicType: 'heritage_pass',
    primaryPanoramaAsset: '/assets/images/scenes/journey-pop-up.webp',
    fallbackLandscapeAsset: '/assets/images/scenes/journey-pop-up.webp',
    roadAsset: '/assets/images/scenes/road_foreground_danang_hue.webp',
    landmarksAsset: '/assets/images/scenes/landmarks_danang_hue.webp',
    originLandmark: {
      id: 'da-nang',
      city: 'Đà Nẵng',
      landmarkName: 'Cầu Rồng & Sông Hàn',
      culturalSignificance: 'Biểu tượng vươn mình của thành phố biển năng động miền Trung',
      badgeDesktop: { left: '44%', top: '24%' },
      badgeMobile: { left: '26%', top: '22%' },
    },
    destinationLandmark: {
      id: 'hue',
      city: 'Huế',
      landmarkName: 'Ngọ Môn & Hoàng Thành',
      culturalSignificance: 'Quần thể di tích Cố đô Huế trầm mặc nghìn năm văn hiến',
      badgeDesktop: { left: '80%', top: '20%' },
      badgeMobile: { left: '74%', top: '18%' },
    },
    roadAlignment: {
      roadBaselineBottom: '12%',
      vehicleRightDesktop: '11%',
      vehicleRightMobile: '6%',
      vehicleBottomDesktop: '13%',
      vehicleBottomMobile: '8%',
    },
    provenance: {
      sourceType: 'local_panoramic_artwork',
      resolution: '1536x1024 WebP 95% quality',
      internalNote: 'Sa bàn diorama 3D chân thực theo ảnh mẫu đã duyệt, Cầu Rồng, Đèo Hải Vân và Ngọ Môn Huế',
    },
  },

  // Tuyến đảo chiều: Huế → Đà Nẵng
  'hue:da-nang': {
    routeId: 'hue:da-nang',
    fromCity: 'Huế',
    toCity: 'Đà Nẵng',
    title: 'Huế — Đà Nẵng: Hành trình về thành phố biển',
    itineraryConcept: 'Hành trình khứ hồi xuất phát từ Cố đô Huế, ngắm nhìn bờ vịnh và vịnh biển Đà Nẵng',
    scenicType: 'heritage_pass',
    primaryPanoramaAsset: '/assets/images/scenes/journey-pop-up.webp',
    fallbackLandscapeAsset: '/assets/images/scenes/journey-pop-up.webp',
    roadAsset: '/assets/images/scenes/road_foreground_danang_hue.webp',
    landmarksAsset: '/assets/images/scenes/landmarks_danang_hue.webp',
    originLandmark: {
      id: 'hue',
      city: 'Huế',
      landmarkName: 'Ngọ Môn & Hoàng Thành',
      culturalSignificance: 'Quần thể di tích Cố đô Huế trầm mặc nghìn năm văn hiến',
      badgeDesktop: { left: '80%', top: '20%' },
      badgeMobile: { left: '74%', top: '18%' },
    },
    destinationLandmark: {
      id: 'da-nang',
      city: 'Đà Nẵng',
      landmarkName: 'Cầu Rồng & Sông Hàn',
      culturalSignificance: 'Biểu tượng vươn mình của thành phố biển năng động miền Trung',
      badgeDesktop: { left: '44%', top: '24%' },
      badgeMobile: { left: '26%', top: '22%' },
    },
    roadAlignment: {
      roadBaselineBottom: '12%',
      vehicleRightDesktop: '11%',
      vehicleRightMobile: '6%',
      vehicleBottomDesktop: '13%',
      vehicleBottomMobile: '8%',
    },
    provenance: {
      sourceType: 'local_panoramic_artwork',
      resolution: '1536x1024 WebP 95% quality',
      internalNote: 'Đảo nhãn hiển thị xuất phát/đích đến chính xác theo từng công trình biểu tượng',
    },
  },

  // Tuyến chính 2 (Kiểm chứng chuyển cảnh): Đà Nẵng ↔ Nha Trang
  'da-nang:nha-trang': {
    routeId: 'da-nang:nha-trang',
    fromCity: 'Đà Nẵng',
    toCity: 'Nha Trang',
    title: 'Đà Nẵng — Nha Trang: Cung đường Duyên hải Nam Trung Bộ',
    itineraryConcept: 'Hành trình biển xanh từ Cầu Rồng Đà Nẵng qua bờ cát trắng vịnh ngọc đến Tháp Trầm Hương Nha Trang',
    scenicType: 'coastal_highway',
    primaryPanoramaAsset: '/assets/images/scenes/journey_danang_nhatrang.webp',
    fallbackLandscapeAsset: '/assets/images/scenes/scene_nha_trang.jpg',
    originLandmark: {
      id: 'da-nang',
      city: 'Đà Nẵng',
      landmarkName: 'Cầu Rồng & Biển Mỹ Khê',
      culturalSignificance: 'Thành phố đáng sống với bờ biển Mỹ Khê và cầu Rồng biểu tượng',
      badgeDesktop: { left: '45%', top: '26%' },
      badgeMobile: { left: '28%', top: '24%' },
    },
    destinationLandmark: {
      id: 'nha-trang',
      city: 'Nha Trang',
      landmarkName: 'Tháp Trầm Hương & Vịnh Ngọc',
      culturalSignificance: 'Biểu tượng đóa sen ven biển của vịnh biển Nha Trang thơ mộng',
      badgeDesktop: { left: '79%', top: '22%' },
      badgeMobile: { left: '73%', top: '20%' },
    },
    roadAlignment: {
      roadBaselineBottom: '10%',
      vehicleRightDesktop: '17%',
      vehicleRightMobile: '10%',
      vehicleBottomDesktop: '16%',
      vehicleBottomMobile: '8%',
    },
    provenance: {
      sourceType: 'local_panoramic_artwork',
      resolution: '1376x768 WebP 95% quality',
      internalNote: 'Tài nguyên sa bàn cung đường Duyên hải 1A, Tháp Trầm Hương chuẩn kiến trúc đóa sen cam',
    },
  },

  'nha-trang:da-nang': {
    routeId: 'nha-trang:da-nang',
    fromCity: 'Nha Trang',
    toCity: 'Đà Nẵng',
    title: 'Nha Trang — Đà Nẵng: Hành trình về thành phố Cầu Rồng',
    itineraryConcept: 'Cung đường khứ hồi ven biển từ vịnh Nha Trang về Đà Nẵng',
    scenicType: 'coastal_highway',
    primaryPanoramaAsset: '/assets/images/scenes/journey_danang_nhatrang.webp',
    fallbackLandscapeAsset: '/assets/images/scenes/scene_nha_trang.jpg',
    originLandmark: {
      id: 'nha-trang',
      city: 'Nha Trang',
      landmarkName: 'Tháp Trầm Hương & Vịnh Ngọc',
      culturalSignificance: 'Biểu tượng đóa sen ven biển của vịnh biển Nha Trang thơ mộng',
      badgeDesktop: { left: '79%', top: '22%' },
      badgeMobile: { left: '73%', top: '20%' },
    },
    destinationLandmark: {
      id: 'da-nang',
      city: 'Đà Nẵng',
      landmarkName: 'Cầu Rồng & Biển Mỹ Khê',
      culturalSignificance: 'Thành phố đáng sống với bờ biển Mỹ Khê và cầu Rồng biểu tượng',
      badgeDesktop: { left: '45%', top: '26%' },
      badgeMobile: { left: '28%', top: '24%' },
    },
    roadAlignment: {
      roadBaselineBottom: '10%',
      vehicleRightDesktop: '17%',
      vehicleRightMobile: '10%',
      vehicleBottomDesktop: '16%',
      vehicleBottomMobile: '8%',
    },
    provenance: {
      sourceType: 'local_panoramic_artwork',
      resolution: '1376x768 WebP 95% quality',
      internalNote: 'Đảo hướng hiển thị điểm đón Nha Trang và trả khách Đà Nẵng',
    },
  },
};

/**
 * Tra cứu tài nguyên bối cảnh theo tuyến đường
 */
export function getHeroRouteAsset(fromInput: string, toInput: string): HeroRouteSceneAsset {
  const fromId = getCanonicalLocationId(fromInput);
  const toId = getCanonicalLocationId(toInput);
  const key = `${fromId}:${toId}`;

  if (HERO_ROUTES_MANIFEST[key]) {
    return HERO_ROUTES_MANIFEST[key];
  }

  // Tuyến trung tính liên tỉnh Việt Nam (dành cho các tuyến đường khác trong hệ thống)
  const fromName = getLocationDisplayName(fromInput);
  const toName = getLocationDisplayName(toInput);

  return {
    routeId: key,
    fromCity: fromName,
    toCity: toName,
    title: `${fromName} — ${toName}: Hành trình khám phá Việt Nam`,
    itineraryConcept: `Cung đường liên tỉnh kết nối ${fromName} và ${toName}`,
    scenicType: 'neutral_highway',
    primaryPanoramaAsset: '/assets/images/scenes/scene_neutral.jpg',
    fallbackLandscapeAsset: '/assets/images/scenes/scene_neutral.jpg',
    originLandmark: {
      id: fromId,
      city: fromName,
      landmarkName: 'Điểm khởi hành',
      culturalSignificance: `Cửa ngõ xuất phát tại ${fromName}`,
      badgeDesktop: { left: '44%', top: '28%' },
      badgeMobile: { left: '26%', top: '24%' },
    },
    destinationLandmark: {
      id: toId,
      city: toName,
      landmarkName: 'Điểm đến',
      culturalSignificance: `Điểm dừng chân tại ${toName}`,
      badgeDesktop: { left: '78%', top: '24%' },
      badgeMobile: { left: '72%', top: '20%' },
    },
    roadAlignment: {
      roadBaselineBottom: '10%',
      vehicleRightDesktop: '4%',
      vehicleRightMobile: '6%',
      vehicleBottomDesktop: '11%',
      vehicleBottomMobile: '7%',
    },
    provenance: {
      sourceType: 'local_panoramic_artwork',
      resolution: '1792x1024 JPG',
      internalNote: 'Cảnh quan đèo biển trung tính, không chứa công trình sai địa danh',
    },
  };
}
