import React, { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { DANAVA_3D_CONFIG } from './environmentConfig';
import { Environment } from './Environment';
import { PaperTicket } from './PaperTicket';
import { CurvedRoad } from './CurvedRoad';
import { SleeperCoach } from './SleeperCoach';
import { WebGLFallback } from './WebGLFallback';

interface JourneyCanvasProps {
  children?: React.ReactNode;
  className?: string;
  flapAngle?: number;
  isDebug?: boolean;
}

// Robust check for WebGL support prior to mounting Three.js renderer
function checkWebGLAvailability(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    if (window.WebGL2RenderingContext) {
      const c2 = document.createElement('canvas');
      if (c2.getContext('webgl2')) return true;
    }
    if (window.WebGLRenderingContext) {
      const c1 = document.createElement('canvas');
      if (c1.getContext('webgl') || c1.getContext('experimental-webgl')) return true;
    }
    return false;
  } catch {
    return false;
  }
}

export const JourneyCanvas: React.FC<JourneyCanvasProps> = ({
  children,
  className = '',
  flapAngle = 0.0,
  isDebug = false,
}) => {
  const [hasWebGL] = useState<boolean>(() => checkWebGLAvailability());
  const [hasRendererError, setHasRendererError] = useState(false);

  if (!hasWebGL || hasRendererError) {
    return (
      <WebGLFallback
        message="Trình duyệt không hỗ trợ WebGL hoặc đã xảy ra lỗi bộ dựng đồ họa. Giao diện hoạt động ở chế độ tương thích."
      />
    );
  }

  const { camera, colors } = DANAVA_3D_CONFIG;

  return (
    <div
      className={`w-full h-full relative pointer-events-none select-none ${className}`}
      data-testid="danava-go-3d-canvas-container"
    >
      <Canvas
        shadows
        camera={{
          fov: camera.fov,
          position: camera.position,
          near: camera.near,
          far: camera.far,
        }}
        gl={{
          alpha: true,
          antialias: true,
          powerPreference: 'high-performance',
          stencil: false,
          depth: true,
        }}
        onCreated={({ camera: activeCamera, gl }) => {
          // Orient camera smoothly towards the unified stage target
          activeCamera.lookAt(camera.target[0], camera.target[1], camera.target[2]);
          gl.setClearColor(colors.background, 0); // Transparent blend so no box frame is visible
        }}
        onError={() => {
          setHasRendererError(true);
        }}
        className="w-full h-full pointer-events-none"
        style={{ pointerEvents: 'none' }}
      >
        {/* Core 3D Lighting & Environment */}
        <Environment />

        {/* Paper Ticket: Thin ivory cardstock with precision hinge pivot and crease line */}
        <PaperTicket flapAngle={flapAngle} isDebug={isDebug} />

        {/* Curved Road: Real continuous ribbon, shoulders, and dashed centerline */}
        <CurvedRoad isDebug={isDebug} />

        {/* Sleeper Coach: Grounded 3D coach model positioned at static stop point */}
        <SleeperCoach />

        {/* Future 3D elements (Landmarks) slot in here */}
        {children}
      </Canvas>
    </div>
  );
};
