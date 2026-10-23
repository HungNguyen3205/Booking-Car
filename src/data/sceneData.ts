export interface LandmarkFocalConfig {
  x: number; // percentage 0-100 across source image width
  y: number; // percentage 0-100 across source image height
}

export interface LandmarkSafeArea {
  minX: number; // percentage 0-100
  minY: number; // percentage 0-100
  maxX: number; // percentage 0-100
  maxY: number; // percentage 0-100
}

export interface SceneRoleConfig {
  focalPoint: LandmarkFocalConfig;
  objectPositionDesktop: string;
  objectPositionMobile: string;
  scaleDesktop: number;
  scaleMobile: number;
  landmarkSafeArea: LandmarkSafeArea;
  flipHorizontal?: boolean;
}

export interface DestinationScene {
  id: string;
  label: string;
  landmarkLabel: string;
  sceneAsset: string;
  mobileAsset?: string;
  horizonPosition: number; // Vertical percentage of horizon in source artwork (e.g. 42 for 42%)
  asOrigin: SceneRoleConfig;
  asDestination: SceneRoleConfig;
  overlapZone: {
    startPercent: number; // e.g. 35
    endPercent: number;   // e.g. 65
  };
  lightDirection: 'left-to-right' | 'right-to-left' | 'diffuse';
  skyTone: {
    top: string;
    horizon: string;
  };
  accentColor: string;
  isCustomAsset: boolean;
  // Backward compatibility properties
  objectPosition?: string;
  mobileObjectPosition?: string;
}

export interface RoutePairOverride {
  fromId: string;
  toId: string;
  pairAsset: string;
  landmarkLabel: string;
  horizonPosition: number;
}

// Canonical Destination Scenes Configuration conforming to requirements
export const destinationScenes: Record<string, DestinationScene> = {
  'da-nang': {
    id: 'da-nang',
    label: 'Đà Nẵng',
    landmarkLabel: 'Cầu Rồng & Biển Mỹ Khê',
    sceneAsset: '/assets/images/scenes/scene_danang.jpg',
    horizonPosition: 42,
    asOrigin: {
      focalPoint: { x: 30, y: 46 },
      objectPositionDesktop: '22% 42%',
      objectPositionMobile: '26% 42%',
      scaleDesktop: 1.04,
      scaleMobile: 1.0,
      landmarkSafeArea: { minX: 8, minY: 20, maxX: 62, maxY: 65 },
      flipHorizontal: false,
    },
    asDestination: {
      focalPoint: { x: 76, y: 56 },
      objectPositionDesktop: '80% 46%',
      objectPositionMobile: '76% 46%',
      scaleDesktop: 1.04,
      scaleMobile: 1.0,
      landmarkSafeArea: { minX: 45, minY: 35, maxX: 92, maxY: 75 },
      flipHorizontal: false,
    },
    overlapZone: { startPercent: 35, endPercent: 65 },
    lightDirection: 'right-to-left',
    skyTone: { top: '#E0EEF3', horizon: '#FDEEE2' },
    accentColor: '#0097A7',
    isCustomAsset: true,
    objectPosition: '22% 42%',
    mobileObjectPosition: '26% 42%',
  },
  'hue': {
    id: 'hue',
    label: 'Huế',
    landmarkLabel: 'Ngọ Môn & Sông Hương',
    sceneAsset: '/assets/images/scenes/scene_hue.jpg',
    horizonPosition: 44,
    asOrigin: {
      focalPoint: { x: 25, y: 45 },
      objectPositionDesktop: '30% 44%',
      objectPositionMobile: '35% 44%',
      scaleDesktop: 1.04,
      scaleMobile: 1.0,
      landmarkSafeArea: { minX: 10, minY: 22, maxX: 55, maxY: 68 },
      flipHorizontal: false,
    },
    asDestination: {
      focalPoint: { x: 78, y: 45 },
      objectPositionDesktop: '84% 44%',
      objectPositionMobile: '80% 44%',
      scaleDesktop: 1.04,
      scaleMobile: 1.0,
      landmarkSafeArea: { minX: 52, minY: 22, maxX: 95, maxY: 68 },
      flipHorizontal: false,
    },
    overlapZone: { startPercent: 35, endPercent: 65 },
    lightDirection: 'left-to-right',
    skyTone: { top: '#E4ECF4', horizon: '#F7E7D4' },
    accentColor: '#F3B54A',
    isCustomAsset: true,
    objectPosition: '84% 44%',
    mobileObjectPosition: '80% 44%',
  },
  'ho-chi-minh': {
    id: 'ho-chi-minh',
    label: 'TP. Hồ Chí Minh',
    landmarkLabel: 'Landmark 81 & Sông Sài Gòn',
    sceneAsset: '/assets/images/scenes/scene_hcm.jpg',
    horizonPosition: 46,
    asOrigin: {
      focalPoint: { x: 28, y: 44 },
      objectPositionDesktop: '24% 46%',
      objectPositionMobile: '28% 46%',
      scaleDesktop: 1.04,
      scaleMobile: 1.0,
      landmarkSafeArea: { minX: 14, minY: 20, maxX: 46, maxY: 62 },
      flipHorizontal: false,
    },
    asDestination: {
      focalPoint: { x: 72, y: 38 },
      objectPositionDesktop: '76% 44%',
      objectPositionMobile: '72% 44%',
      scaleDesktop: 1.04,
      scaleMobile: 1.0,
      landmarkSafeArea: { minX: 55, minY: 4, maxX: 90, maxY: 65 },
      flipHorizontal: false,
    },
    overlapZone: { startPercent: 35, endPercent: 65 },
    lightDirection: 'diffuse',
    skyTone: { top: '#E5EDF4', horizon: '#FCEFE4' },
    accentColor: '#007887',
    isCustomAsset: true,
    objectPosition: '24% 46%',
    mobileObjectPosition: '28% 46%',
  },
  'nha-trang': {
    id: 'nha-trang',
    label: 'Nha Trang',
    landmarkLabel: 'Tháp Trầm Hương & Vịnh Biển',
    sceneAsset: '/assets/images/scenes/scene_nha_trang.jpg',
    horizonPosition: 41,
    asOrigin: {
      focalPoint: { x: 36, y: 44 },
      objectPositionDesktop: '32% 41%',
      objectPositionMobile: '34% 41%',
      scaleDesktop: 1.04,
      scaleMobile: 1.0,
      landmarkSafeArea: { minX: 18, minY: 25, maxX: 48, maxY: 65 },
      flipHorizontal: false,
    },
    asDestination: {
      focalPoint: { x: 68, y: 44 },
      objectPositionDesktop: '72% 41%',
      objectPositionMobile: '68% 41%',
      scaleDesktop: 1.04,
      scaleMobile: 1.0,
      landmarkSafeArea: { minX: 52, minY: 25, maxX: 82, maxY: 65 },
      flipHorizontal: false,
    },
    overlapZone: { startPercent: 35, endPercent: 65 },
    lightDirection: 'right-to-left',
    skyTone: { top: '#DEF0F6', horizon: '#FBF1E2' },
    accentColor: '#0284C7',
    isCustomAsset: true,
    objectPosition: '32% 41%',
    mobileObjectPosition: '34% 41%',
  },
  'hoi-an': {
    id: 'hoi-an',
    label: 'Hội An',
    landmarkLabel: 'Chùa Cầu & Phố Cổ Đèn Lồng',
    sceneAsset: '/assets/images/scenes/scene_hoi_an.jpg',
    horizonPosition: 42,
    asOrigin: {
      focalPoint: { x: 35, y: 46 },
      objectPositionDesktop: '28% 42%',
      objectPositionMobile: '30% 42%',
      scaleDesktop: 1.04,
      scaleMobile: 1.0,
      landmarkSafeArea: { minX: 10, minY: 20, maxX: 65, maxY: 68 },
      flipHorizontal: false,
    },
    asDestination: {
      focalPoint: { x: 65, y: 46 },
      objectPositionDesktop: '72% 42%',
      objectPositionMobile: '70% 42%',
      scaleDesktop: 1.04,
      scaleMobile: 1.0,
      landmarkSafeArea: { minX: 35, minY: 20, maxX: 90, maxY: 68 },
      flipHorizontal: false,
    },
    overlapZone: { startPercent: 35, endPercent: 65 },
    lightDirection: 'left-to-right',
    skyTone: { top: '#E6EFF2', horizon: '#FDF1DE' },
    accentColor: '#F59E0B',
    isCustomAsset: true,
    objectPosition: '28% 42%',
    mobileObjectPosition: '30% 42%',
  },
  'quy-nhon': {
    id: 'quy-nhon',
    label: 'Quy Nhơn',
    landmarkLabel: 'Eo Gió & Tháp Đôi Chăm Pa',
    sceneAsset: '/assets/images/scenes/scene_quy_nhon.jpg',
    horizonPosition: 40,
    asOrigin: {
      focalPoint: { x: 35, y: 44 },
      objectPositionDesktop: '28% 40%',
      objectPositionMobile: '32% 40%',
      scaleDesktop: 1.04,
      scaleMobile: 1.0,
      landmarkSafeArea: { minX: 10, minY: 15, maxX: 65, maxY: 70 },
      flipHorizontal: false,
    },
    asDestination: {
      focalPoint: { x: 68, y: 44 },
      objectPositionDesktop: '76% 40%',
      objectPositionMobile: '72% 40%',
      scaleDesktop: 1.04,
      scaleMobile: 1.0,
      landmarkSafeArea: { minX: 35, minY: 15, maxX: 90, maxY: 70 },
      flipHorizontal: false,
    },
    overlapZone: { startPercent: 35, endPercent: 65 },
    lightDirection: 'right-to-left',
    skyTone: { top: '#DEF0F6', horizon: '#FDEEE2' },
    accentColor: '#0D9488',
    isCustomAsset: true,
    objectPosition: '28% 40%',
    mobileObjectPosition: '32% 40%',
  },
  'ha-noi': {
    id: 'ha-noi',
    label: 'Hà Nội',
    landmarkLabel: 'Hồ Gươm & Tháp Rùa',
    sceneAsset: '/assets/images/scenes/scene_hanoi.jpg',
    horizonPosition: 44,
    asOrigin: {
      focalPoint: { x: 30, y: 45 },
      objectPositionDesktop: '26% 44%',
      objectPositionMobile: '28% 44%',
      scaleDesktop: 1.04,
      scaleMobile: 1.0,
      landmarkSafeArea: { minX: 8, minY: 20, maxX: 60, maxY: 68 },
      flipHorizontal: false,
    },
    asDestination: {
      focalPoint: { x: 62, y: 45 },
      objectPositionDesktop: '68% 44%',
      objectPositionMobile: '65% 44%',
      scaleDesktop: 1.04,
      scaleMobile: 1.0,
      landmarkSafeArea: { minX: 40, minY: 20, maxX: 85, maxY: 68 },
      flipHorizontal: false,
    },
    overlapZone: { startPercent: 35, endPercent: 65 },
    lightDirection: 'diffuse',
    skyTone: { top: '#E2EEF4', horizon: '#F9EFE4' },
    accentColor: '#DC2626',
    isCustomAsset: true,
    objectPosition: '26% 44%',
    mobileObjectPosition: '28% 44%',
  },
};

// Aliased as DESTINATION_SCENES for backward compatibility
export const DESTINATION_SCENES = destinationScenes;

// Neutral Fallback Scene for destinations without dedicated architectural artwork
export const NEUTRAL_SCENE: DestinationScene = {
  id: 'neutral',
  label: 'Tuyến đường liên tỉnh',
  landmarkLabel: 'Cung đường ven biển & Núi non hùng vĩ',
  sceneAsset: '/assets/images/scenes/scene_neutral.jpg',
  horizonPosition: 40,
  asOrigin: {
    focalPoint: { x: 25, y: 42 },
    objectPositionDesktop: '22% 40%',
    objectPositionMobile: '25% 40%',
    scaleDesktop: 1.02,
    scaleMobile: 1.0,
    landmarkSafeArea: { minX: 5, minY: 20, maxX: 45, maxY: 70 },
    flipHorizontal: false,
  },
  asDestination: {
    focalPoint: { x: 75, y: 40 },
    objectPositionDesktop: '80% 40%',
    objectPositionMobile: '75% 40%',
    scaleDesktop: 1.02,
    scaleMobile: 1.0,
    landmarkSafeArea: { minX: 50, minY: 20, maxX: 95, maxY: 70 },
    flipHorizontal: false,
  },
  overlapZone: { startPercent: 35, endPercent: 65 },
  lightDirection: 'diffuse',
  skyTone: { top: '#E6EFF2', horizon: '#F3EFE6' },
  accentColor: '#647084',
  isCustomAsset: false,
  objectPosition: 'center 40%',
  mobileObjectPosition: 'center 50%',
};

// Strict City Aliases and Normalization Mapping
// Ensures stable canonical ID without fuzzy-guessing unconfirmed provinces
const CITY_ALIAS_MAP: Record<string, string> = {
  // da-nang
  'da-nang': 'da-nang',
  dad: 'da-nang',
  'đà nẵng': 'da-nang',
  'da nang': 'da-nang',
  danang: 'da-nang',

  // hue
  hue: 'hue',
  'huế': 'hue',
  'thừa thiên huế': 'hue',

  // ho-chi-minh (Sài Gòn & TP. Hồ Chí Minh strictly normalized to 'ho-chi-minh')
  'ho-chi-minh': 'ho-chi-minh',
  'sai-gon': 'ho-chi-minh',
  'tp. hồ chí minh': 'ho-chi-minh',
  'tp hồ chí minh': 'ho-chi-minh',
  'hồ chí minh': 'ho-chi-minh',
  'sài gòn': 'ho-chi-minh',
  saigon: 'ho-chi-minh',
  tphcm: 'ho-chi-minh',
  hcm: 'ho-chi-minh',
  sgn: 'ho-chi-minh',

  // nha-trang
  'nha-trang': 'nha-trang',
  'nha trang': 'nha-trang',
  nhatrang: 'nha-trang',
  'khánh hòa': 'nha-trang',
  cxr: 'nha-trang',

  // hoi-an (Dedicated city ID)
  'hoi-an': 'hoi-an',
  'hội an': 'hoi-an',
  hoian: 'hoi-an',

  // quy-nhon (Dedicated city ID)
  'quy-nhon': 'quy-nhon',
  'quy nhơn': 'quy-nhon',
  quynhon: 'quy-nhon',
  uih: 'quy-nhon',

  // ha-noi (Dedicated city ID)
  'ha-noi': 'ha-noi',
  'hà nội': 'ha-noi',
  hanoi: 'ha-noi',
  han: 'ha-noi',
};

// Directional Route Pair Overrides
export const ROUTE_PAIR_OVERRIDES: RoutePairOverride[] = [
  {
    fromId: 'da-nang',
    toId: 'hue',
    pairAsset: '/assets/images/scenes/diorama_danang_hue.png',
    landmarkLabel: 'Đà Nẵng — Huế: Cung đường di sản miền Trung',
    horizonPosition: 38,
  },
  {
    fromId: 'hue',
    toId: 'da-nang',
    pairAsset: '/assets/images/scenes/diorama_danang_hue.png',
    landmarkLabel: 'Huế — Đà Nẵng: Cung đường di sản miền Trung',
    horizonPosition: 38,
  },
];

export interface PreloadResult {
  success: boolean;
  src: string;
  error?: string;
}

// In-flight deduplication map and completed results cache
const inFlightPreloadPromises = new Map<string, Promise<PreloadResult>>();
const assetPreloadCache = new Map<string, PreloadResult>();

export const sceneService = {
  // Normalize string to canonical ID
  getCanonicalCityId(nameOrId: string): string {
    if (!nameOrId) return 'neutral';
    const clean = nameOrId.trim().toLowerCase();
    return CITY_ALIAS_MAP[clean] || clean;
  },

  // Get Scene object by city name or ID
  getScene(cityNameOrId: string): DestinationScene {
    const id = this.getCanonicalCityId(cityNameOrId);
    if (destinationScenes[id]) {
      return destinationScenes[id];
    }
    // Return neutral scene with the actual requested city label
    return {
      ...NEUTRAL_SCENE,
      id,
      label: cityNameOrId.trim() || 'Điểm đến',
      landmarkLabel: 'Cung đường liên tỉnh',
    };
  },

  // Check if a specific route pair has a dedicated directional panorama
  // STRICT: Matches strictly fromId -> toId direction!
  getPairOverride(fromCity: string, toCity: string): RoutePairOverride | null {
    const fromId = this.getCanonicalCityId(fromCity);
    const toId = this.getCanonicalCityId(toCity);
    return (
      ROUTE_PAIR_OVERRIDES.find(
        (p) => p.fromId === fromId && p.toId === toId
      ) || null
    );
  },

  // Preload an image asset, deduplicate in-flight requests, and return clear success/error result
  preloadAsset(src: string): Promise<PreloadResult> {
    if (!src) {
      return Promise.resolve({ success: false, src, error: 'Empty source URL' });
    }

    // Return completed result if already preloaded
    if (assetPreloadCache.has(src)) {
      return Promise.resolve(assetPreloadCache.get(src)!);
    }

    // Return existing in-flight promise if currently loading to prevent duplicate requests
    if (inFlightPreloadPromises.has(src)) {
      return inFlightPreloadPromises.get(src)!;
    }

    const loadPromise = new Promise<PreloadResult>((resolve) => {
      const img = new Image();
      let finished = false;

      const finish = (result: PreloadResult) => {
        if (!finished) {
          finished = true;
          inFlightPreloadPromises.delete(src);
          assetPreloadCache.set(src, result);
          resolve(result);
        }
      };

      img.onload = () => {
        try {
          if ('decode' in img && typeof img.decode === 'function') {
            img.decode()
              .then(() => finish({ success: true, src }))
              .catch(() => finish({ success: true, src }));
            return;
          }
        } catch {
          // ignore decode exception and complete successfully
        }
        finish({ success: true, src });
      };

      img.onerror = () => {
        // Explicit failure: do NOT store as success!
        finish({ success: false, src, error: 'Image failed to load' });
      };

      img.src = src;
    });

    inFlightPreloadPromises.set(src, loadPromise);
    return loadPromise;
  },
};

/**
 * Preload only the critical hero assets that will ACTUALLY be rendered on initial page load:
 * 1. Default vehicle image (sleeper)
 * 2. If a directional pair override matches (e.g. Đà Nẵng -> Huế), preload ONLY that panorama!
 * 3. Only if no pair override exists, preload the two specific origin & destination scenes.
 * Does NOT preload inactive cities or unrendered panoramas.
 */
export async function preloadCriticalHeroAssets(
  fromCity: string,
  toCity: string,
  vehicleImgSrc: string
): Promise<PreloadResult[]> {
  const assets: string[] = [];
  if (vehicleImgSrc) assets.push(vehicleImgSrc);

  const pairOverride = sceneService.getPairOverride(fromCity, toCity);
  if (pairOverride?.pairAsset) {
    // Only preload the pair asset that is actually going to be rendered
    assets.push(pairOverride.pairAsset);
  } else {
    // Only preload the two active scenes
    const fromScene = sceneService.getScene(fromCity);
    if (fromScene?.sceneAsset) assets.push(fromScene.sceneAsset);

    const toScene = sceneService.getScene(toCity);
    if (toScene?.sceneAsset) assets.push(toScene.sceneAsset);
  }

  // Parallel load & decode only the needed assets
  return Promise.all(assets.map((src) => sceneService.preloadAsset(src)));
}
