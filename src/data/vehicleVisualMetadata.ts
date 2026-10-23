export interface WheelContact {
  id: string;
  name: string;
  xPercent: number; // 0 - 100% of intrinsic width (from left)
  yPercent: number; // 0 - 100% of intrinsic height (ground contact level of this tire)
  widthPercent: number; // width of contact shadow
  intensity?: number; // 0 - 1 opacity multiplier
}

export interface AmbientShadowConfig {
  xPercent: number; // Center X %
  yPercent: number; // Y level %
  widthPercent: number; // Width %
  heightPercent: number; // Height %
  blurPx: number; // Blur radius in px
  opacity: number; // 0 - 1
}

export interface VehicleVisualMetadata {
  id: string;
  name: string;
  image: string;
  intrinsicWidth: number;
  intrinsicHeight: number;
  aspectRatio: number;
  displayScale: number;
  groundBaselineYPercent: number; // Lowest tire ground contact point %
  visibleWheelContacts: WheelContact[];
  ambientShadow: AmbientShadowConfig;
}

// Master reference ground baseline across all vehicle models
export const MASTER_GROUND_BASELINE_PERCENT = 92.45;

/**
 * Rigorously measured and validated pixel-perfect metadata for all 3 vehicle assets
 * Canvas: 1376 x 768 px
 * Orientation: Front of bus faces Left (~15-50% X), Rear faces Right (~80-92% X)
 */
export const VEHICLE_VISUAL_METADATA: Record<string, VehicleVisualMetadata> = {
  sleeper: {
    id: 'veh_sleeper_34',
    name: 'Giường nằm 34 chỗ',
    image: '/assets/images/bus_coach_sleeper.png',
    intrinsicWidth: 1376,
    intrinsicHeight: 768,
    aspectRatio: 1376 / 768, // ~1.7917
    displayScale: 1.0,
    groundBaselineYPercent: 85.94, // Measured peak bottom contact at y=660px (660/768 = 85.94%)
    visibleWheelContacts: [
      {
        id: 'front-near',
        name: 'Bánh trước (gần)',
        xPercent: 50.87, // x=700px / 1376px
        yPercent: 85.94, // y=660px / 768px
        widthPercent: 9.8,
        intensity: 0.95,
      },
      {
        id: 'rear-near',
        name: 'Bánh sau (gần)',
        xPercent: 81.03, // x=1115px / 1376px
        yPercent: 78.13, // y=600px / 768px (perspective distance)
        widthPercent: 8.5,
        intensity: 0.85,
      },
      {
        id: 'front-far',
        name: 'Bánh trước (xa)',
        xPercent: 24.5, // x=337px / 1376px
        yPercent: 82.8, // y=636px / 768px
        widthPercent: 6.8,
        intensity: 0.65,
      },
    ],
    ambientShadow: {
      xPercent: 54.0,
      yPercent: 83.5,
      widthPercent: 76.0,
      heightPercent: 3.8,
      blurPx: 6,
      opacity: 0.38,
    },
  },

  limousine: {
    id: 'veh_limousine_16',
    name: 'Limousine VIP 16 chỗ',
    image: '/assets/images/bus_limousine_vip.png',
    intrinsicWidth: 1376,
    intrinsicHeight: 768,
    aspectRatio: 1376 / 768,
    displayScale: 0.94, // Proportionally more compact than full 2-floor luxury coaches
    groundBaselineYPercent: 91.15, // Measured peak bottom contact at y=700px (700/768 = 91.15%)
    visibleWheelContacts: [
      {
        id: 'front-near',
        name: 'Bánh trước (gần)',
        xPercent: 39.97, // x=550px / 1376px
        yPercent: 91.15, // y=700px / 768px
        widthPercent: 9.2,
        intensity: 0.95,
      },
      {
        id: 'rear-near',
        name: 'Bánh sau (gần)',
        xPercent: 82.12, // x=1130px / 1376px
        yPercent: 84.64, // y=650px / 768px
        widthPercent: 8.2,
        intensity: 0.85,
      },
      {
        id: 'front-far',
        name: 'Bánh trước (xa)',
        xPercent: 19.26, // x=265px / 1376px
        yPercent: 87.11, // y=669px / 768px
        widthPercent: 6.5,
        intensity: 0.65,
      },
    ],
    ambientShadow: {
      xPercent: 53.0,
      yPercent: 88.0,
      widthPercent: 74.0,
      heightPercent: 3.5,
      blurPx: 5,
      opacity: 0.35,
    },
  },

  cabin: {
    id: 'veh_cabin_royal_22',
    name: 'Cabin VIP 22 phòng',
    image: '/assets/images/bus_cabin_royal.png',
    intrinsicWidth: 1376,
    intrinsicHeight: 768,
    aspectRatio: 1376 / 768,
    displayScale: 1.02, // Grand flagship double-deck luxury coach
    groundBaselineYPercent: 92.45, // Measured peak bottom contact at y=710px (710/768 = 92.45%)
    visibleWheelContacts: [
      {
        id: 'front-near',
        name: 'Bánh trước (gần)',
        xPercent: 46.88, // x=645px / 1376px
        yPercent: 92.45, // y=710px / 768px
        widthPercent: 9.8,
        intensity: 0.95,
      },
      {
        id: 'rear-axle-1',
        name: 'Bánh sau trục 1',
        xPercent: 78.49, // x=1080px / 1376px
        yPercent: 84.64, // y=650px / 768px
        widthPercent: 6.5,
        intensity: 0.85,
      },
      {
        id: 'rear-axle-2',
        name: 'Bánh sau trục 2',
        xPercent: 83.58, // x=1150px / 1376px
        yPercent: 83.98, // y=645px / 768px
        widthPercent: 6.5,
        intensity: 0.85,
      },
      {
        id: 'front-far',
        name: 'Bánh trước (xa)',
        xPercent: 22.53, // x=310px / 1376px
        yPercent: 90.49, // y=695px / 768px
        widthPercent: 7.0,
        intensity: 0.65,
      },
    ],
    ambientShadow: {
      xPercent: 55.0,
      yPercent: 89.2,
      widthPercent: 78.0,
      heightPercent: 4.0,
      blurPx: 6,
      opacity: 0.4,
    },
  },
};
