/**
 * DANAVA GO — 3D Environment, Camera & Lighting Configuration
 * 
 * Centralized, named configuration dictionary ensuring all future assets (ticket, route, vehicles)
 * share a consistent 3D coordinate space, lighting model, and three-quarter camera framing.
 */

export const DANAVA_3D_CONFIG = {
  // Brand color palette mapped into Three.js color space
  colors: {
    background: '#F7F4EC',    // Exact page cream
    ambient: '#FFFDF8',       // Warm morning sunlight ambient
    sunLight: '#FFFFFF',      // Direct key light
    skyBounce: '#E0F7FA',     // Soft teal sky fill bounce
    shadowTone: '#102744',    // Deep navy tinted shadow
    distantHills: '#DFDCD2',  // Subtle far background horizon
  },

  // Three-quarter camera viewing perspective calibrated for full-width cinematic hero
  camera: {
    fov: 34,
    near: 0.1,
    far: 80,
    // [x, y, z] looking forward with focus on foreground vehicle on the right and layered mountains above
    position: [0.20, 2.75, 7.80] as [number, number, number],
    target: [0.30, 0.70, 0.20] as [number, number, number],
  },

  // Unified lighting system (soft, consistent directional sun + fill)
  lighting: {
    ambient: {
      intensity: 1.6,
    },
    keyLight: {
      position: [-4.5, 8.0, 5.5] as [number, number, number],
      intensity: 2.8,
      castShadow: true,
      shadowMapSize: 1024,
      shadowBias: -0.0001,
      shadowCamera: {
        near: 0.5,
        far: 26,
        size: 6.2, // bounds of shadow frustum
      },
    },
    fillLight: {
      position: [4.8, 3.8, -2.2] as [number, number, number],
      intensity: 0.95,
    },
  },

  // Ground plane calibrated to receive soft shadows without edge artifacts
  ground: {
    width: 36,
    height: 24,
    position: [0, -0.01, 0] as [number, number, number],
    rotation: [-Math.PI / 2, 0, 0] as [number, number, number],
    shadowOpacity: 0.16,
  },

  // Subtle atmospheric depth and gentle distant hills (no buildings, no cars)
  atmosphere: {
    fog: {
      near: 16,
      far: 45,
    },
    distantRidge: {
      position: [0, 0.4, -14] as [number, number, number],
      scale: [26, 2.2, 1] as [number, number, number],
      opacity: 0.45,
    },
  },
} as const;
