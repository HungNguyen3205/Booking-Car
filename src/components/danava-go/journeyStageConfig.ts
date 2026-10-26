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
  frame: { y: number; originX: number; destinationX: number };
}

const scenes = '/assets/images/scenes/';
const atlas = `${scenes}journey_city_banks.webp`;
// Wide, continuous city banks rather than isolated monument islands.
// Crop bounds follow the actual atlas rows, not assumed equal-height cells.
const landmarks: Record<string, Omit<JourneyLandmark, 'id' | 'city'>> = {
  'da-nang': { landmark: 'Cầu Rồng · Sông Hàn', image: atlas, source: [1774, 887], crop: [0, 0, 886, 244], frame: { y: 270, originX: -30, destinationX: 880 } },
  'hoi-an': { landmark: 'Phố cổ · Sông Hoài', image: atlas, source: [1774, 887], crop: [890, 0, 884, 243], frame: { y: 330, originX: -330, destinationX: 440 } },
  'hue': { landmark: 'Ngọ Môn · Hoàng thành', image: atlas, source: [1774, 887], crop: [0, 248, 884, 237], frame: { y: 310, originX: -350, destinationX: 760 } },
  'nha-trang': { landmark: 'Tháp Trầm Hương · Vịnh biển', image: atlas, source: [1774, 887], crop: [890, 250, 884, 235], frame: { y: 320, originX: -600, destinationX: 450 } },
  'ho-chi-minh': { landmark: 'Landmark 81 · Sông Sài Gòn', image: `${scenes}journey_hcm_bank.webp`, source: [2172, 724], crop: [0, 0, 2172, 724], frame: { y: 270, originX: -300, destinationX: 800 } },
  'ha-noi': { landmark: 'Hồ Gươm · Tháp Rùa', image: atlas, source: [1774, 887], crop: [890, 490, 884, 215], frame: { y: 330, originX: -400, destinationX: 600 } },
  'quy-nhon': { landmark: 'Tháp Đôi · Biển Quy Nhơn', image: atlas, source: [1774, 887], crop: [0, 714, 884, 173], frame: { y: 350, originX: -750, destinationX: 360 } },
  'da-lat': { landmark: 'Ga Đà Lạt · Thành phố ngàn hoa', image: atlas, source: [1774, 887], crop: [890, 714, 884, 173], frame: { y: 360, originX: -320, destinationX: 760 } },
};

export function getJourneyLandmark(city: string): JourneyLandmark {
  const id = getCanonicalLocationId(city);
  const spec = landmarks[id];
  return { id, city: getLocationDisplayName(city), ...(spec || {
    landmark: 'Miền đất mới', image: '', source: [1, 1], crop: [0, 0, 1, 1], frame: { y: 330, originX: 0, destinationX: 900 },
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
