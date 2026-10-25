import type { VehicleCategory } from '../../types';
import {
  HERO_VEHICLES_MANIFEST,
  HERO_ROUTES_MANIFEST,
  getHeroRouteAsset,
  type HeroVehicleModelAsset,
  type HeroRouteSceneAsset,
} from '../../data/heroAssetManifest';

export interface HeroVehicleAssetConfig {
  id: VehicleCategory;
  name: string;
  categoryLabel: string;
  image: string;
  altText: string;
  aspectRatio: number;
  scaleRelative?: number;
  widthDesktop: string;
  widthMobile: string;
  positionDesktop: {
    right: string;
    bottom: string;
  };
  positionMobile: {
    right: string;
    bottom: string;
  };
  shadow: {
    width: string;
    height: string;
    bottom: string;
    left: string;
    blur: string;
    opacity: number;
  };
  contactShadows: {
    rearLeft: string;
    rearWidth: string;
    frontLeft: string;
    frontWidth: string;
    secondRearLeft?: string;
    secondRearWidth?: string;
    bottom: string;
  };
  motion: {
    initialX: number;
    initialY: number;
    duration: number;
  };
}

export interface LandmarkBadge {
  id: string;
  city: string;
  landmark: string;
  badgePositionDesktop: {
    left: string;
    top: string;
  };
  badgePositionMobile: {
    left: string;
    top: string;
  };
}

export interface HeroLayer {
  id: string;
  name: string;
  asset: string;
  depthZ: number;
  opacity?: number;
  className?: string;
}

export interface HeroRouteSceneConfig {
  id: string;
  title: string;
  isNeutralFallback: boolean;
  baseAsset: string;
  roadAsset: string;
  landmarksAsset: string;
  paperDioramaAsset?: string;
  originBadge: LandmarkBadge;
  destinationBadge: LandmarkBadge;
  roadAlignment: {
    roadBaselineBottom: string;
    vehicleRightDesktop: string;
    vehicleRightMobile: string;
    vehicleBottomDesktop: string;
    vehicleBottomMobile: string;
    vehicleWidthDesktop: string;
    vehicleWidthMobile: string;
  };
  layers: HeroLayer[];
}

/**
 * Cấu hình asset cho 3 dòng xe cao cấp với ảnh hướng đầu xe về bên phải
 */
export const HERO_VEHICLE_CONFIGS: Record<VehicleCategory, HeroVehicleAssetConfig> = {
  sleeper: {
    id: 'sleeper',
    name: HERO_VEHICLES_MANIFEST.sleeper.name,
    categoryLabel: HERO_VEHICLES_MANIFEST.sleeper.categoryLabel,
    image: HERO_VEHICLES_MANIFEST.sleeper.assetPath,
    altText: HERO_VEHICLES_MANIFEST.sleeper.altText,
    aspectRatio: HERO_VEHICLES_MANIFEST.sleeper.aspectRatio,
    scaleRelative: 1.0,
    widthDesktop: '41%',
    widthMobile: '76%',
    positionDesktop: {
      right: '11%',
      bottom: '13%',
    },
    positionMobile: {
      right: '6%',
      bottom: '8%',
    },
    shadow: {
      width: '78%',
      height: '11%',
      bottom: '4%',
      left: '12%',
      blur: '14px',
      opacity: 0.35,
    },
    contactShadows: {
      rearLeft: '44%',
      rearWidth: '10.5%',
      frontLeft: '66%',
      frontWidth: '8%',
      bottom: '6.4%',
    },
    motion: {
      initialX: 28,
      initialY: 4,
      duration: 0.5,
    },
  },
  limousine: {
    id: 'limousine',
    name: HERO_VEHICLES_MANIFEST.limousine.name,
    categoryLabel: HERO_VEHICLES_MANIFEST.limousine.categoryLabel,
    image: HERO_VEHICLES_MANIFEST.limousine.assetPath,
    altText: HERO_VEHICLES_MANIFEST.limousine.altText,
    aspectRatio: HERO_VEHICLES_MANIFEST.limousine.aspectRatio,
    scaleRelative: 0.88,
    widthDesktop: '35%',
    widthMobile: '70%',
    positionDesktop: {
      right: '13%',
      bottom: '13%',
    },
    positionMobile: {
      right: '8%',
      bottom: '8%',
    },
    shadow: {
      width: '74%',
      height: '10%',
      bottom: '4%',
      left: '14%',
      blur: '12px',
      opacity: 0.32,
    },
    contactShadows: {
      rearLeft: '58.5%',
      rearWidth: '9.5%',
      frontLeft: '79.5%',
      frontWidth: '7.5%',
      bottom: '6.4%',
    },
    motion: {
      initialX: 24,
      initialY: 3,
      duration: 0.48,
    },
  },
  cabin: {
    id: 'cabin',
    name: HERO_VEHICLES_MANIFEST.cabin.name,
    categoryLabel: HERO_VEHICLES_MANIFEST.cabin.categoryLabel,
    image: HERO_VEHICLES_MANIFEST.cabin.assetPath,
    altText: HERO_VEHICLES_MANIFEST.cabin.altText,
    aspectRatio: HERO_VEHICLES_MANIFEST.cabin.aspectRatio,
    scaleRelative: 1.02,
    widthDesktop: '42%',
    widthMobile: '78%',
    positionDesktop: {
      right: '10.5%',
      bottom: '13%',
    },
    positionMobile: {
      right: '5%',
      bottom: '8%',
    },
    shadow: {
      width: '80%',
      height: '12%',
      bottom: '4%',
      left: '11%',
      blur: '14px',
      opacity: 0.38,
    },
    contactShadows: {
      rearLeft: '48%',
      rearWidth: '10%',
      secondRearLeft: '62%',
      secondRearWidth: '10%',
      frontLeft: '73.5%',
      frontWidth: '8%',
      bottom: '6.4%',
    },
    motion: {
      initialX: 30,
      initialY: 4,
      duration: 0.52,
    },
  },
};

/**
 * Chuyển đổi dữ liệu từ HeroRouteSceneAsset sang HeroRouteSceneConfig
 */
export function getHeroRouteConfig(fromCity: string, toCity: string): HeroRouteSceneConfig {
  const asset = getHeroRouteAsset(fromCity, toCity);
  const isNeutral = asset.scenicType === 'neutral_highway';

  return {
    id: asset.routeId,
    title: asset.title,
    isNeutralFallback: isNeutral,
    baseAsset: asset.primaryPanoramaAsset,
    roadAsset: asset.roadAsset || asset.primaryPanoramaAsset,
    landmarksAsset: asset.landmarksAsset || asset.primaryPanoramaAsset,
    paperDioramaAsset: asset.fallbackLandscapeAsset,
    originBadge: {
      id: asset.originLandmark.id,
      city: asset.originLandmark.city,
      landmark: asset.originLandmark.landmarkName,
      badgePositionDesktop: asset.originLandmark.badgeDesktop,
      badgePositionMobile: asset.originLandmark.badgeMobile,
    },
    destinationBadge: {
      id: asset.destinationLandmark.id,
      city: asset.destinationLandmark.city,
      landmark: asset.destinationLandmark.landmarkName,
      badgePositionDesktop: asset.destinationLandmark.badgeDesktop,
      badgePositionMobile: asset.destinationLandmark.badgeMobile,
    },
    roadAlignment: {
      roadBaselineBottom: asset.roadAlignment.roadBaselineBottom,
      vehicleRightDesktop: asset.roadAlignment.vehicleRightDesktop,
      vehicleRightMobile: asset.roadAlignment.vehicleRightMobile,
      vehicleBottomDesktop: asset.roadAlignment.vehicleBottomDesktop,
      vehicleBottomMobile: asset.roadAlignment.vehicleBottomMobile,
      vehicleWidthDesktop: asset.routeId.includes('nha-trang') ? '37%' : '41%',
      vehicleWidthMobile: asset.routeId.includes('nha-trang') ? '70%' : '76%',
    },
    layers: [
      {
        id: 'sky-gradient',
        name: 'Bầu trời & Ánh sáng hoàng hôn',
        asset: '',
        depthZ: 1,
      },
      {
        id: 'landmarks-layer',
        name: 'Địa danh biểu tượng',
        asset: asset.landmarksAsset || asset.primaryPanoramaAsset,
        depthZ: 3,
        opacity: isNeutral ? 0.92 : 0.98,
      },
      {
        id: 'road-layer',
        name: 'Lớp đường tiền cảnh độc lập',
        asset: asset.roadAsset || asset.primaryPanoramaAsset,
        depthZ: 5,
        opacity: 1.0,
      },
    ],
  };
}

export {
  HERO_VEHICLES_MANIFEST,
  HERO_ROUTES_MANIFEST,
  getHeroRouteAsset,
  type HeroVehicleModelAsset,
  type HeroRouteSceneAsset,
};
