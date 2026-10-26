import type { VehicleCategory } from '../../types';
import { getCanonicalLocationId, getLocationDisplayName } from '../../data/sceneManifest';
import { VEHICLE_MODELS } from '../../data/mockData';

// Every layer uses this canvas. The shared ground was derived from the existing
// road artwork; its near lane heads right. Vehicles/buildings are never mirrored.
export const JOURNEY_CANVAS = { width: 1600, height: 1000 };
export const JOURNEY_ROAD = '/assets/images/scenes/journey_landscape.webp';

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
  'da-nang': { landmark: 'Cầu Rồng · Sông Hàn', image: atlas, source: [1536, 1024], crop: [0, 345, 552, 370], photographic: true },
  'hoi-an': { landmark: 'Phố cổ · Sông Hoài', image: atlas, source: [1536, 1024], crop: [552, 335, 498, 400], photographic: true },
  'hue': { landmark: 'Ngọ Môn · Hoàng thành', image: atlas, source: [1536, 1024], crop: [1050, 320, 486, 420], photographic: true },
  'nha-trang': { landmark: 'Tháp Trầm Hương · Vịnh biển', image: `${scenes}journey_locations_atlas.webp`, source: [1983, 793], crop: [0, 300, 397, 493], photographic: true },
  'ho-chi-minh': { landmark: 'Landmark 81 · Sông Sài Gòn', image: `${scenes}journey_locations_atlas.webp`, source: [1983, 793], crop: [397, 50, 396, 743], photographic: true },
  'ha-noi': { landmark: 'Hồ Gươm · Tháp Rùa', image: `${scenes}journey_locations_atlas.webp`, source: [1983, 793], crop: [793, 420, 397, 373], photographic: true },
  'quy-nhon': { landmark: 'Tháp Đôi · Biển Quy Nhơn', image: `${scenes}journey_locations_atlas.webp`, source: [1983, 793], crop: [1190, 350, 396, 443], photographic: true },
  'da-lat': { landmark: 'Ga Đà Lạt · Thành phố ngàn hoa', image: `${scenes}journey_locations_atlas.webp`, source: [1983, 793], crop: [1586, 320, 397, 473], photographic: true },
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
  sleeper: { image: VEHICLE_MODELS.sleeper.heroImage!, width: 900, wheels: [[240, 650], [665, 706]], anchor: [452, 678], rest: [650, 782] },
  limousine: { image: VEHICLE_MODELS.limousine.heroImage!, width: 770, wheels: [[230, 638], [850, 706]], anchor: [540, 672], rest: [650, 782] },
  cabin: { image: VEHICLE_MODELS.cabin.heroImage!, width: 900, wheels: [[240, 650], [310, 665], [720, 710]], anchor: [480, 681], rest: [650, 782] },
};

// A short, almost straight portion of the near lane matches the single camera
// angle available for each bus. No rotation or artificial steering around the bend.
export const JOURNEY_DRIVE = {
  x: [210, 360, 520, 650],
  y: [700, 735, 765, 782],
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
    JOURNEY_ROAD, JOURNEY_VEHICLES.cabin.image,
    getJourneyLandmark(from).image, getJourneyLandmark(to).image,
  ].filter(Boolean))].map(decodeJourneyImage));
}
