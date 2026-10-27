import bankData from '../../data/landmarkBanks.json';
import type { VehicleCategory } from '../../types';
import { getCanonicalLocationId, getLocationDisplayName } from '../../data/sceneManifest';
import { VEHICLE_MODELS } from '../../data/mockData';

// Every layer uses this canvas. The shared ground was derived from the existing
// road artwork; its near lane heads right. Vehicles/buildings are never mirrored.
export const JOURNEY_CANVAS = { width: 1600, height: 1000 };
export const JOURNEY_ROAD = '/assets/images/scenes/journey_landscape.webp';

export interface LandmarkEdgeFade {
  start: number;
  end: number;
}

export interface LandmarkBlendConfig {
  hasAlpha?: boolean;
  edgeFade?: {
    left?: LandmarkEdgeFade;
    right?: LandmarkEdgeFade;
  };
  waterFade?: {
    start: number;
    end: number;
  };
  skyFade?: {
    start: number;
    end: number;
  };
}

export interface JourneyLandmark {
  id: string;
  city: string;
  landmark: string;
  image: string;
  source: [number, number];
  crop: [number, number, number, number];
  frame: {
    y: number;
    originX: number;
    destinationX: number;
    mobileOriginX?: number;
    mobileDestinationX?: number;
    mobileWidth?: number;
    originY?: number;
    width: number;
    height: number;
  };
  blend?: LandmarkBlendConfig;
}

const bankLabels: Record<string, string> = {
  'da-nang':'Cầu Rồng · Sông Hàn', 'hoi-an':'Phố cổ · Sông Hoài',
  hue:'Ngọ Môn · Hoàng thành', 'ha-noi':'Hồ Gươm · Tháp Rùa',
  'ho-chi-minh':'Landmark 81 · Sông Sài Gòn', 'hai-phong':'Nhà hát thành phố · Hoa phượng đỏ',
  'can-tho':'Bến Ninh Kiều · Sông Hậu', 'dong-nai':'Văn miếu Trấn Biên',
  'quang-ninh':'Vịnh Hạ Long', 'bac-ninh':'Chùa Dâu · Tháp Hòa Phong',
  'nha-trang':'Tháp Trầm Hương · Vịnh biển', 'da-lat':'Ga Đà Lạt · Thành phố ngàn hoa',
  'quy-nhon':'Tháp Đôi · Biển Quy Nhơn',
};

// Each role has separately composed, complete architecture. Crop bounds include
// the entire alpha silhouette, not a half of a shared destination photograph.
export function getJourneyLandmark(city: string, role: 'origin' | 'destination' = 'origin'): JourneyLandmark {
  const id = getCanonicalLocationId(city);
  const banks = bankData as unknown as Record<string, {image:string; source:[number,number]; crops:[number,number,number,number][]}>;
  const bank = banks[id];
  return { id, city:getLocationDisplayName(city), landmark:bankLabels[id] || 'Miền đất mới',
    image: bank?.image || '', source:bank?.source || [1,1],
    crop:bank?.crops[role === 'origin' ? 0 : 1] || [0,0,1,1],
    frame:{y:310,originX:-90,destinationX:790,mobileOriginX:160,mobileDestinationX:640,mobileWidth:756,width:900,height:400},
    blend:{hasAlpha:true,waterFade:{start:73,end:100}},
  };
}

export interface JourneyVehicle {
  image: string;
  source: [number, number];
  width: number;
  wheels: [number, number][];
  anchor: [number, number];
  rest: [number, number];
  mobileRest: [number, number];
  // Measured alpha bounds in the shared 1254-square atlas: front/right, rear/left.
  views: [number, number, number, number][];
}
export const JOURNEY_TURN_ATLAS = '/assets/images/fleet-turns.webp';
export const JOURNEY_VEHICLES: Record<VehicleCategory, JourneyVehicle> = {
  sleeper: { image: VEHICLE_MODELS.sleeper.heroImage!, source: [1678, 937], width: 672,
    wheels: [[262, 835], [867, 890]], anchor: [858.5, 895], rest: [800, 800], mobileRest: [800, 849],
    views: [[39, 141, 580, 273], [659, 142, 563, 273]] },
  limousine: { image: VEHICLE_MODELS.limousine.heroImage!, source: [1678, 937], width: 675,
    wheels: [[229, 794], [1005, 883]], anchor: [840.5, 889], rest: [800, 800], mobileRest: [800, 849],
    views: [[55, 519, 552, 274], [646, 516, 572, 280]] },
  cabin: { image: VEHICLE_MODELS.cabin.heroImage!, source: [1376, 768], width: 722,
    wheels: [[240, 650], [310, 665], [720, 710]], anchor: [712.5, 709], rest: [800, 800], mobileRest: [800, 849],
    views: [[31, 877, 595, 263], [640, 872, 583, 269]] },
};

export function getVehicleRest(category: VehicleCategory, mobile: boolean = false): [number, number] {
  const cfg = JOURNEY_VEHICLES[category];
  return mobile ? cfg.mobileRest : cfg.rest;
}

export const JOURNEY_DRIVE = { duration: 2.8 };
const bezier = (a: number, b: number, c: number, d: number, t: number) =>
  (1-t)**3*a + 3*(1-t)**2*t*b + 3*(1-t)*t*t*c + t**3*d;

// Ground coordinates traced against journey_landscape.webp, never against the
// landmark overlays. Rear-facing sprites handle the reversing screen direction.
export function getJourneyDrivePose(progress: number, rest: [number, number]) {
  const p = Math.max(0, Math.min(1, progress));
  let x: number, y: number, scale: number;
  if (p < .26) {
    const t = p/.26;
    x = bezier(80, 130, 240, 228, t); y = bezier(647, 646, 657, 675, t); scale = .16 + .06*t;
  } else if (p < .44) {
    const t = (p-.26)/.18;
    x = bezier(228, 215, 100, 142, t); y = bezier(675, 690, 694, 715, t); scale = .22 + .07*t;
  } else {
    // Ease into a parked pose; both the vehicle and its shadow stop together.
    const u = (p-.44)/.56, t = 1-(1-u)**2;
    x = bezier(142, 175, 430, rest[0], t); y = bezier(715, 752, rest[1]-15, rest[1], t); scale = .29 + .71*t;
  }
  return { x, y, scale };
}

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
