/**
 * DANAVA GO — Paper Ticket Physical & Geometric Configuration
 * 
 * Mô hình cấu trúc: Giấy gấp cứng có bản lề cơ học chính xác (Rigid Folded Paper Panels with Hinge Pivots).
 * Tuyệt đối không tuyên bố là mô phỏng biến dạng giấy mềm (soft-body deformation) khi chưa có hệ thống vi phân biến dạng.
 */

export const TICKET_CONFIG = {
  // Overall dimensions in Three.js world units
  dimensions: {
    totalLength: 7.6,       // Total X span when unfolded
    depth: 3.8,             // Z dimension (depth of ticket)
    paperThickness: 0.016,  // Ultra-thin paper thickness (avoid thick wood-block look)
    cornerBevel: 0.003,     // Subtle edge roundness
  },

  // Two-panel hinged partition
  panels: {
    // Hinge line positioned along X = -1.4, parallel to Z axis
    hingeX: -1.4,
    
    // Base Main Deck (Right side where diorama and road reside)
    // Extends from X = -1.4 to X = +3.8 (width = 5.2)
    baseDeck: {
      width: 5.2,
      depth: 3.8,
      centerOffset: [1.2, 0.008, 0] as [number, number, number], // Local center relative to ticket origin
    },

    // Folding Flap / Stub (Left side that folds open around hinge)
    // Extends from X = -3.8 to X = -1.4 (width = 2.4)
    foldingFlap: {
      width: 2.4,
      depth: 3.8,
      // Local center relative to hinge pivot [0, 0, 0] is [-1.2, 0, 0]
      localCenter: [-1.2, 0, 0] as [number, number, number],
      // Angle: 0 = fully open flat (180 deg unfolded), Math.PI = fully closed folded over
      staticOpenAngle: 0.0, // Radians
    },

    // Ticket edge notch punches (characteristic travel ticket semi-circular notches)
    notches: {
      radius: 0.09,
      hingeNotchZ: [-1.9, 1.9], // At top and bottom edges of the fold line
      outerNotchZ: [0],         // At left & right outer ends
    },
  },

  // Realistic cardstock material properties calibrated to blend into page cream
  material: {
    faceColor: '#F7F4EC',      // Exact page cream for seamless continuous ground
    edgeColor: '#EDE8DD',      // Subtle soft edge
    creaseColor: '#E2DCD0',    // Indented pressed fold crease line
    roughness: 0.95,           // Matte surface
    metalness: 0.01,           // Non-metallic
    shadowOpacity: 0.12,
  },
} as const;
