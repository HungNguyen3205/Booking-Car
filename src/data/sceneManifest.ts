import type { VehicleCategory } from '../types';

export interface LandmarkAnchor {
  id: string;
  label: string;
  subLabel?: string;
  cx: number;
  cy: number;
  labelOffsetY: number;
  badgeWidth: number;
}

export interface VehicleAnchorConfig {
  width: string;
  left: string;
  top: string;
  shadowWidth: string;
  shadowHeight: string;
  shadowTop: string;
  shadowLeft: string;
  motionDeltaX: number;
  motionDeltaY: number;
}

export interface SceneComposition {
  id: string;
  title: string;
  asset: string;
  cameraAngleId: string;
  supportedDirections: string[];
  landmarks: Record<string, LandmarkAnchor>;
  getRoutePath: (fromId: string, toId: string) => string;
  vehicleAnchors: Record<VehicleCategory, VehicleAnchorConfig>;
  isNeutralFallback?: boolean;
}

export interface LocationInfo {
  id: string;
  name: string;
  province: string;
}

export const SUPPORTED_LOCATIONS: LocationInfo[] = [
  { id: 'da-nang', name: 'Đà Nẵng', province: 'Đà Nẵng' },
  { id: 'hue', name: 'Huế', province: 'Thừa Thiên Huế' },
  { id: 'hoi-an', name: 'Hội An', province: 'Quảng Nam' },
  { id: 'quy-nhon', name: 'Quy Nhơn', province: 'Bình Định' },
  { id: 'nha-trang', name: 'Nha Trang', province: 'Khánh Hòa' },
  { id: 'ha-noi', name: 'Hà Nội', province: 'Hà Nội' },
  { id: 'ho-chi-minh', name: 'TP. Hồ Chí Minh', province: 'Hồ Chí Minh' },
];

// Exact canonical ID mapping - avoids arbitrary 'includes' searching
export const LOCATION_ALIAS_MAP: Record<string, string> = {
  'da-nang': 'da-nang',
  'đà nẵng': 'da-nang',
  'da nang': 'da-nang',
  'danang': 'da-nang',
  'dad': 'da-nang',

  'hue': 'hue',
  'huế': 'hue',
  'thừa thiên huế': 'hue',

  'hoi-an': 'hoi-an',
  'hội an': 'hoi-an',
  'hoi an': 'hoi-an',
  'hoian': 'hoi-an',

  'quy-nhon': 'quy-nhon',
  'quy nhơn': 'quy-nhon',
  'quy nhon': 'quy-nhon',
  'quynhon': 'quy-nhon',
  'uih': 'quy-nhon',

  'nha-trang': 'nha-trang',
  'nha trang': 'nha-trang',
  'nhatrang': 'nha-trang',
  'khánh hòa': 'nha-trang',
  'cxr': 'nha-trang',

  'ha-noi': 'ha-noi',
  'hà nội': 'ha-noi',
  'ha noi': 'ha-noi',
  'hanoi': 'ha-noi',
  'han': 'ha-noi',

  'ho-chi-minh': 'ho-chi-minh',
  'tp. hồ chí minh': 'ho-chi-minh',
  'tp hồ chí minh': 'ho-chi-minh',
  'hồ chí minh': 'ho-chi-minh',
  'sài gòn': 'ho-chi-minh',
  'sai-gon': 'ho-chi-minh',
  'saigon': 'ho-chi-minh',
  'tphcm': 'ho-chi-minh',
  'hcm': 'ho-chi-minh',
  'sgn': 'ho-chi-minh',
};

export function getCanonicalLocationId(input: string): string {
  if (!input) return 'unknown';
  const clean = input.trim().toLowerCase();
  return LOCATION_ALIAS_MAP[clean] || clean;
}

export function getLocationDisplayName(idOrName: string): string {
  const id = getCanonicalLocationId(idOrName);
  const found = SUPPORTED_LOCATIONS.find((loc) => loc.id === id);
  return found ? found.name : idOrName.trim();
}

/**
 * Master Composition: Đà Nẵng — Huế Heritage Journey
 * Specifically illustrates Cầu Rồng (Đà Nẵng) and Ngọ Môn (Huế) on ticket diorama.
 */
export const HERITAGE_DANANG_HUE_COMPOSITION: SceneComposition = {
  id: 'heritage-danang-hue',
  title: 'Đà Nẵng — Huế: Cung đường di sản miền Trung',
  asset: '/assets/images/scenes/vietnam_journey_panorama.webp',
  cameraAngleId: 'danang_hue_heritage',
  supportedDirections: ['da-nang:hue', 'hue:da-nang'],
  landmarks: {
    'da-nang': {
      id: 'da-nang',
      label: 'Đà Nẵng',
      subLabel: 'Cầu Rồng',
      cx: 770,
      cy: 195,
      labelOffsetY: -23,
      badgeWidth: 64,
    },
    'hue': {
      id: 'hue',
      label: 'Huế',
      subLabel: 'Ngọ Môn',
      cx: 1115,
      cy: 180,
      labelOffsetY: -23,
      badgeWidth: 48,
    },
  },
  getRoutePath(fromId: string, toId: string): string {
    if (fromId === 'hue' && toId === 'da-nang') {
      return 'M 1115,180 Q 940,105 770,195';
    }
    return 'M 770,195 Q 940,105 1115,180';
  },
  vehicleAnchors: {
    sleeper: {
      width: '27.6%',
      left: '48.3%',
      top: '40.5%',
      shadowWidth: '88%',
      shadowHeight: '9%',
      shadowTop: '90%',
      shadowLeft: '50%',
      motionDeltaX: 24,
      motionDeltaY: -6,
    },
    limousine: {
      width: '21.4%',
      left: '52.0%',
      top: '48.6%',
      shadowWidth: '84%',
      shadowHeight: '10%',
      shadowTop: '98%',
      shadowLeft: '50%',
      motionDeltaX: 20,
      motionDeltaY: -5,
    },
    cabin: {
      width: '28.3%',
      left: '48.0%',
      top: '38.4%',
      shadowWidth: '90%',
      shadowHeight: '10%',
      shadowTop: '98%',
      shadowLeft: '50%',
      motionDeltaX: 24,
      motionDeltaY: -6,
    },
  },
};

/**
 * Neutral Highway Composition:
 * Beautiful coastal highway along Vietnam cliffs and sea.
 * Used for routes that do not have a dedicated architectural dual-landmark panorama.
 * Avoids mislabeling Ngọ Môn as Nha Trang, Hà Nội, or Sài Gòn.
 */
export const NEUTRAL_SCENE_COMPOSITION: SceneComposition = {
  id: 'neutral-highway',
  title: 'Cung đường liên tỉnh Việt Nam',
  asset: '/assets/images/scenes/scene_neutral.jpg',
  cameraAngleId: 'neutral_coastal',
  supportedDirections: ['*'],
  isNeutralFallback: true,
  landmarks: {},
  getRoutePath(_fromId: string, _toId: string): string {
    return 'M 620,250 Q 800,160 980,210';
  },
  vehicleAnchors: {
    sleeper: {
      width: '27.6%',
      left: '47.5%',
      top: '41.5%',
      shadowWidth: '88%',
      shadowHeight: '9%',
      shadowTop: '90%',
      shadowLeft: '50%',
      motionDeltaX: 24,
      motionDeltaY: -6,
    },
    limousine: {
      width: '21.4%',
      left: '51.5%',
      top: '49.0%',
      shadowWidth: '84%',
      shadowHeight: '10%',
      shadowTop: '98%',
      shadowLeft: '50%',
      motionDeltaX: 20,
      motionDeltaY: -5,
    },
    cabin: {
      width: '28.3%',
      left: '47.5%',
      top: '39.5%',
      shadowWidth: '90%',
      shadowHeight: '10%',
      shadowTop: '98%',
      shadowLeft: '50%',
      motionDeltaX: 24,
      motionDeltaY: -6,
    },
  },
};

/**
 * Master Composition: Đà Nẵng — Hội An Heritage Journey
 * Illustrates Cầu Rồng (Đà Nẵng) and Phố Cổ Hội An & Sông Hoài.
 */
export const HERITAGE_DANANG_HOIAN_COMPOSITION: SceneComposition = {
  id: 'heritage-danang-hoian',
  title: 'Đà Nẵng — Hội An: Hành trình Phố Cổ & Sông Hoài',
  asset: '/assets/images/scenes/journey_danang_hoian.webp',
  cameraAngleId: 'danang_hoian_heritage',
  supportedDirections: ['da-nang:hoi-an', 'hoi-an:da-nang'],
  landmarks: {
    'da-nang': {
      id: 'da-nang',
      label: 'Đà Nẵng',
      subLabel: 'Cầu Rồng',
      cx: 750,
      cy: 190,
      labelOffsetY: -23,
      badgeWidth: 64,
    },
    'hoi-an': {
      id: 'hoi-an',
      label: 'Hội An',
      subLabel: 'Phố Cổ & Sông Hoài',
      cx: 1100,
      cy: 175,
      labelOffsetY: -23,
      badgeWidth: 72,
    },
  },
  getRoutePath(fromId: string, toId: string): string {
    if (fromId === 'hoi-an' && toId === 'da-nang') {
      return 'M 1100,175 Q 925,100 750,190';
    }
    return 'M 750,190 Q 925,100 1100,175';
  },
  vehicleAnchors: {
    sleeper: {
      width: '27.6%',
      left: '48.3%',
      top: '40.5%',
      shadowWidth: '88%',
      shadowHeight: '9%',
      shadowTop: '90%',
      shadowLeft: '50%',
      motionDeltaX: 24,
      motionDeltaY: -6,
    },
    limousine: {
      width: '21.4%',
      left: '52.0%',
      top: '48.6%',
      shadowWidth: '84%',
      shadowHeight: '10%',
      shadowTop: '98%',
      shadowLeft: '50%',
      motionDeltaX: 20,
      motionDeltaY: -5,
    },
    cabin: {
      width: '28.3%',
      left: '48.0%',
      top: '38.4%',
      shadowWidth: '90%',
      shadowHeight: '10%',
      shadowTop: '98%',
      shadowLeft: '50%',
      motionDeltaX: 24,
      motionDeltaY: -6,
    },
  },
};

export const SCENE_COMPOSITIONS: SceneComposition[] = [
  HERITAGE_DANANG_HOIAN_COMPOSITION,
  HERITAGE_DANANG_HUE_COMPOSITION,
];

/**
 * Resolves the appropriate scene composition for the selected route.
 * Strictly verifies supported directions.
 */
export function resolveSceneComposition(fromInput: string, toInput: string): SceneComposition {
  const fromId = getCanonicalLocationId(fromInput);
  const toId = getCanonicalLocationId(toInput);
  const routeId = `${fromId}:${toId}`;

  const matched = SCENE_COMPOSITIONS.find((comp) =>
    comp.supportedDirections.includes(routeId)
  );

  if (matched) {
    return matched;
  }

  return NEUTRAL_SCENE_COMPOSITION;
}
