import type { VehicleCategory } from '../../types';
import { getCanonicalLocationId, getLocationDisplayName } from '../../data/sceneManifest';
import { HERO_VEHICLES_MANIFEST } from '../../data/heroAssetManifest';

// Every layer uses this canvas. The shared ground was derived from the existing
// road artwork; its near lane heads right. Vehicles/buildings are never mirrored.
export const JOURNEY_CANVAS = { width: 1376, height: 768 };
export const JOURNEY_ROAD = '/assets/images/scenes/journey_panorama_fullbleed.webp';

export interface JourneyLandmark {
  id: string;
  city: string;
  landmark: string;
  image: string;
  source: [number, number];
  crop: [number, number, number, number];
  photographic: boolean;
}

const scenes = '/assets/images/scenes/';
const atlas = `${scenes}journey_landmarks_atlas.webp`;
const landmarks: Record<string, Omit<JourneyLandmark, 'id' | 'city'>> = {
  'da-nang': { landmark: 'Cầu Rồng · Sông Hàn', image: atlas, source: [1536, 1024], crop: [0, 330, 552, 420], photographic: true },
  'hoi-an': { landmark: 'Phố cổ · Sông Hoài', image: atlas, source: [1536, 1024], crop: [552, 330, 498, 420], photographic: true },
  'hue': { landmark: 'Ngọ Môn · Hoàng thành', image: atlas, source: [1536, 1024], crop: [1050, 320, 486, 420], photographic: true },
  'nha-trang': { landmark: 'Tháp Trầm Hương · Vịnh biển', image: `${scenes}scene_nha_trang.jpg`, source: [1376, 768], crop: [50, 50, 1200, 650], photographic: false },
  'ho-chi-minh': { landmark: 'Landmark 81 · Sông Sài Gòn', image: `${scenes}scene_hcm.jpg`, source: [1376, 768], crop: [150, 30, 1220, 700], photographic: false },
  'ha-noi': { landmark: 'Hồ Gươm · Tháp Rùa', image: `${scenes}scene_hanoi.jpg`, source: [1376, 768], crop: [150, 80, 1200, 650], photographic: false },
  'quy-nhon': { landmark: 'Eo Gió · Tháp Đôi', image: `${scenes}scene_quy_nhon.jpg`, source: [1376, 768], crop: [50, 50, 1300, 700], photographic: false },
};

export function getJourneyLandmark(city: string): JourneyLandmark {
  const id = getCanonicalLocationId(city);
  const spec = landmarks[id];
  return { id, city: getLocationDisplayName(city), ...(spec || {
    landmark: 'Miền đất mới', image: '', source: [1, 1], crop: [0, 0, 1, 1], photographic: false,
  }) };
}

export interface JourneyVehicle {
  image: string;
  width: number;
  // Pixel coordinates measured on each existing 1376 × 768 alpha image.
  wheels: [number, number][];
  anchor: [number, number];
  rest: [number, number];
}
export const JOURNEY_VEHICLES: Record<VehicleCategory, JourneyVehicle> = {
  sleeper: { image: HERO_VEHICLES_MANIFEST.sleeper.assetPath, width: 650, wheels: [[240, 650], [665, 706]], anchor: [452, 678], rest: [740, 660] },
  limousine: { image: HERO_VEHICLES_MANIFEST.limousine.assetPath, width: 630, wheels: [[230, 638], [850, 706]], anchor: [540, 672], rest: [740, 660] },
  cabin: { image: HERO_VEHICLES_MANIFEST.cabin.assetPath, width: 650, wheels: [[240, 650], [310, 665], [720, 710]], anchor: [480, 681], rest: [740, 660] },
};

// A short, almost straight portion of the near lane matches the single camera
// angle available for each bus. No rotation or artificial steering around the bend.
export const JOURNEY_DRIVE = {
  x: [420, 650, 850, 1000],
  y: [590, 700, 752, 785],
  scale: [0.42, 0.58, 0.8, 1],
  times: [0, 0.3, 0.65, 1],
  duration: 1.7,
};

const decoded = new Map<string, Promise<void>>();
export function decodeJourneyImage(src: string): Promise<void> {
  if (!src || typeof Image === 'undefined') return Promise.resolve();
  const cached = decoded.get(src);
  if (cached) return cached;
  const request = new Promise<void>((resolve, reject) => {
    const img = new Image();
    const timer = window.setTimeout(() => { img.onload = img.onerror = null; reject(new Error(`Image timed out: ${src}`)); }, 8000);
    img.onload = async () => {
      try { await img.decode(); } catch { /* A loaded image is still usable if decode is unsupported. */ }
      clearTimeout(timer);
      resolve();
    };
    img.onerror = () => { clearTimeout(timer); reject(new Error(`Image unavailable: ${src}`)); };
    img.src = src;
  });
  decoded.set(src, request);
  // Failed loads can be retried; cache only successful/in-flight requests.
  void request.catch(() => { if (decoded.get(src) === request) decoded.delete(src); });
  return request;
}

export function preloadJourney(from: string, to: string) {
  return Promise.allSettled([...new Set([
    JOURNEY_ROAD, JOURNEY_VEHICLES.sleeper.image,
    getJourneyLandmark(from).image, getJourneyLandmark(to).image,
  ].filter(Boolean))].map(decodeJourneyImage));
}
