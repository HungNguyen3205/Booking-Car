import type { VehicleCategory } from '../types';

export interface VehicleSceneSpec {
  image: string;
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

// Standardized scene coordinate system (1376x570 canvas)
// Asphalt road surface contact baseline is at y ≈ 430px (75.4% of 570)
// Center of vehicle rests at x ≈ 860-868px (~62.5% of 1376)
// Each vehicle ID has distinct scale, position, wheel anchor & contact shadows:
// - sleeper (Giường nằm): 12m coach, w=380px (27.6%), top=40.5% (tires land on y=430)
// - limousine: compact VIP van, w=295px (21.4%), top=48.6% (tires land on y=430)
// - cabin (Cabin VIP): double-deck luxury coach, w=390px (28.3%), top=38.4% (tires land on y=430)
export const SCENE_VEHICLE_CONFIGS: Record<VehicleCategory, VehicleSceneSpec> = {
  sleeper: {
    image: '/assets/images/bus_hanh_trinh_sleeper.png',
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
    image: '/assets/images/bus_limousine_cutout.png',
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
    image: '/assets/images/bus_cabin_cutout.png',
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
};

/**
 * Preload and decode an image asset before animating, ensuring immediate GPU readiness.
 */
export function preloadAndDecodeImage(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      resolve();
      return;
    }
    const img = new Image();
    img.src = src;

    const tryDecode = () => {
      if (typeof img.decode === 'function') {
        img.decode().then(() => resolve()).catch(() => resolve());
      } else {
        resolve();
      }
    };

    if (img.complete && img.naturalWidth > 0) {
      tryDecode();
      return;
    }

    img.onload = () => {
      tryDecode();
    };

    img.onerror = () => {
      reject(new Error(`Failed to load asset: ${src}`));
    };
  });
}
