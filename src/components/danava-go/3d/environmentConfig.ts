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

  // Three-quarter camera viewing perspective (derived from reference composition)
  camera: {
    fov: 36,
    near: 0.1,
    far: 80,
    // [x, y, z] looking down-forward at a subtle angle towards stage center
    position: [0, 4.8, 9.2] as [number, number, number],
    target: [0, 0.35, 0] as [number, number, number],
  },

  // Unified lighting system (soft, consistent directional sun + fill)
  lighting: {
    ambient: {
      intensity: 0.8,
    },
    keyLight: {
      position: [-4.2, 7.5, 5.0] as [number, number, number],
      intensity: 1.25,
      castShadow: true,
      shadowMapSize: 1024,
      shadowBias: -0.0001,
      shadowCamera: {
        near: 0.5,
        far: 24,
        size: 5.5, // bounds of shadow frustum
      },
    },
    fillLight: {
      position: [4.5, 3.8, -2.5] as [number, number, number],
      intensity: 0.4,
    },
  },

  // Ground plane calibrated to receive soft shadows without edge artifacts
  ground: {
    width: 24,
    height: 18,
    position: [0, -0.01, 0] as [number, number, number],
    rotation: [-Math.PI / 2, 0, 0] as [number, number, number],
    shadowOpacity: 0.18,
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
