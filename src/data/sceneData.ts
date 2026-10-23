export interface DestinationScene {
  id: string;
  label: string;
  landmarkLabel: string;
  sceneAsset: string;
  objectPosition: string;
  mobileObjectPosition: string;
  accentColor: string;
  isCustomAsset: boolean;
}

export interface RoutePairOverride {
  fromId: string;
  toId: string;
  pairAsset: string;
  landmarkLabel: string;
}

// Canonical Destination Scenes Configuration conforming to requirements
export const destinationScenes: Record<string, DestinationScene> = {
  'ho-chi-minh': {
    id: 'ho-chi-minh',
    label: 'TP. Hồ Chí Minh',
    landmarkLabel: 'Landmark 81 & Sông Sài Gòn',
    sceneAsset: '/assets/images/scenes/scene_hcm.jpg',
    objectPosition: 'center 35%',
    mobileObjectPosition: 'center 40%',
    accentColor: '#007887',
    isCustomAsset: true,
  },
  'da-nang': {
    id: 'da-nang',
    label: 'Đà Nẵng',
    landmarkLabel: 'Cầu Rồng & Biển Mỹ Khê',
    sceneAsset: '/assets/images/scenes/scene_danang.jpg',
    objectPosition: 'center 40%',
    mobileObjectPosition: 'center 50%',
    accentColor: '#0097A7',
    isCustomAsset: true,
  },
  'nha-trang': {
    id: 'nha-trang',
    label: 'Nha Trang',
    landmarkLabel: 'Tháp Trầm Hương & Vịnh Biển',
    sceneAsset: '/assets/images/scenes/scene_nha_trang.jpg',
    objectPosition: 'center 40%',
    mobileObjectPosition: 'center 50%',
    accentColor: '#0284C7',
    isCustomAsset: true,
  },
  'hue': {
    id: 'hue',
    label: 'Huế',
    landmarkLabel: 'Ngọ Môn & Sông Hương',
    sceneAsset: '/assets/images/scenes/scene_hue.jpg',
    objectPosition: 'center 45%',
    mobileObjectPosition: 'center 50%',
    accentColor: '#F3B54A',
    isCustomAsset: true,
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
  objectPosition: 'center 40%',
  mobileObjectPosition: 'center 50%',
  accentColor: '#647084',
  isCustomAsset: false,
};

// Aliases and name normalization mapping to canonical ID
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

  // ho-chi-minh
  'ho-chi-minh': 'ho-chi-minh',
  'sai-gon': 'ho-chi-minh',
  'tp. hồ chí minh': 'ho-chi-minh',
  'tp hồ chí minh': 'ho-chi-minh',
  'hồ chí minh': 'ho-chi-minh',
  'sài gòn': 'ho-chi-minh',
  saigon: 'ho-chi-minh',
  tphcm: 'ho-chi-minh',
  hcm: 'ho-chi-minh',

  // nha-trang
  'nha-trang': 'nha-trang',
  'nha trang': 'nha-trang',
  nhatrang: 'nha-trang',
  'khánh hòa': 'nha-trang',

  // hoi-an
  'hoi-an': 'hoi-an',
  'hội an': 'hoi-an',
  'quảng nam': 'hoi-an',

  // quy-nhon
  'quy-nhon': 'quy-nhon',
  'quy nhơn': 'quy-nhon',
  'bình định': 'quy-nhon',

  // ha-noi
  'ha-noi': 'ha-noi',
  'hà nội': 'ha-noi',
  hanoi: 'ha-noi',
};

// High quality combined pair overrides
export const ROUTE_PAIR_OVERRIDES: RoutePairOverride[] = [
  {
    fromId: 'da-nang',
    toId: 'hue',
    pairAsset: '/assets/images/scenes/scene_pair_dad_hue.jpg',
    landmarkLabel: 'Đà Nẵng — Huế: Cung đường di sản miền Trung',
  },
  {
    fromId: 'hue',
    toId: 'da-nang',
    pairAsset: '/assets/images/scenes/scene_pair_dad_hue.jpg',
    landmarkLabel: 'Huế — Đà Nẵng: Cung đường di sản miền Trung',
  },
];

// Preload cache to prevent re-requesting assets
const loadedAssetCache = new Set<string>();

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
    };
  },

  // Check if a specific route pair has an override asset
  getPairOverride(fromCity: string, toCity: string): RoutePairOverride | null {
    const fromId = this.getCanonicalCityId(fromCity);
    const toId = this.getCanonicalCityId(toCity);
    return (
      ROUTE_PAIR_OVERRIDES.find(
        (p) =>
          (p.fromId === fromId && p.toId === toId) ||
          (p.fromId === toId && p.toId === fromId)
      ) || null
    );
  },

  // Preload an image asset and cache it in memory
  preloadAsset(src: string): Promise<void> {
    if (loadedAssetCache.has(src)) {
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        loadedAssetCache.add(src);
        try {
          if ('decode' in img) {
            img.decode().then(resolve).catch(resolve);
            return;
          }
        } catch {
          // fallback
        }
        resolve();
      };
      img.onerror = () => {
        // Resolve on error to prevent UI blocking
        resolve();
      };
      img.src = src;
    });
  },
};

// Preload default route assets eagerly
if (typeof window !== 'undefined') {
  sceneService.preloadAsset('/assets/images/scenes/scene_danang.jpg');
  sceneService.preloadAsset('/assets/images/scenes/scene_hue.jpg');
  sceneService.preloadAsset('/assets/images/scenes/scene_pair_dad_hue.jpg');
}
