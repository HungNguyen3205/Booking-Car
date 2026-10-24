import React, { useState, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { DANAVA_3D_CONFIG } from './environmentConfig';
import { Environment } from './Environment';
import { PaperTicket } from './PaperTicket';
import { CurvedRoad } from './CurvedRoad';
import { SleeperCoach } from './SleeperCoach';
import { DaNangLandmark } from './DaNangLandmark';
import { HueLandmark } from './HueLandmark';
import { CentralPassTransition } from './CentralPassTransition';
import { DA_NANG_DESTINATION, HUE_DESTINATION } from './destinationConfig';
import {
  DualLandmarkAnchorTracker,
  DestinationLabelOverlay,
} from './DestinationLabelOverlay';
import { WebGLFallback } from './WebGLFallback';

interface JourneyCanvasProps {
  children?: React.ReactNode;
  className?: string;
  flapAngle?: number;
  isDebug?: boolean;
  shouldReduceMotion?: boolean;
  coachReplayKey?: number;
  fromCity?: string;
  toCity?: string;
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
  shouldReduceMotion = false,
  coachReplayKey = 0,
  fromCity = 'Đà Nẵng',
  toCity = 'Huế',
}) => {
  const [hasWebGL] = useState<boolean>(() => checkWebGLAvailability());
  const [hasRendererError, setHasRendererError] = useState(false);

  // Refs trực tiếp điều khiển các phần tử HTML/SVG trên DOM (zero React re-renders)
  const danangOverlayRef = useRef<HTMLDivElement>(null);
  const hueOverlayRef = useRef<HTMLDivElement>(null);
  const svgRoutePathRef = useRef<SVGPathElement>(null);
  const routeBadgeRef = useRef<HTMLDivElement>(null);

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

        {/* Paper Ticket: Thin ivory cardstock with precision hinge pivot, crease line and route imprint */}
        <PaperTicket
          flapAngle={flapAngle}
          isDebug={isDebug}
          fromCity={fromCity}
          toCity={toCity}
        />

        {/* Curved Road: Real continuous ribbon, shoulders, and dashed centerline */}
        <CurvedRoad isDebug={isDebug} />

        {/* Da Nang Landmark: Cầu Rồng, Sông Hàn, Bờ kè, Cây xanh, Núi Sơn Trà */}
        <DaNangLandmark isDebug={isDebug} />

        {/* Central Pass Transition: Đèo Hải Vân & Rặng đồi xanh kết nối 2 miền di sản */}
        <CentralPassTransition />

        {/* Hue Landmark: Ngọ Môn Hoàng Thành, Lầu Ngũ Phụng, Hồ sen Kim Thủy, Rừng thông */}
        <HueLandmark isDebug={isDebug} />

        {/* Sleeper Coach: Grounded 3D coach model animated along road curve with wheel rotation */}
        <SleeperCoach
          shouldReduceMotion={shouldReduceMotion}
          replayKey={coachReplayKey}
        />

        {/* Dual Landmark Anchor Tracker: Chiếu cả 2 điểm neo 3D và vẽ đường cong route SVG */}
        <DualLandmarkAnchorTracker
          danang3D={DA_NANG_DESTINATION.labelAnchor.worldPosition}
          hue3D={HUE_DESTINATION.labelAnchor.worldPosition}
          danangOverlayRef={danangOverlayRef}
          hueOverlayRef={hueOverlayRef}
          svgRoutePathRef={svgRoutePathRef}
          routeBadgeRef={routeBadgeRef}
        />

        {/* Slot cho các phần tử 3D mở rộng */}
        {children}
      </Canvas>

      {/* Lớp phủ HTML/SVG: Nhãn Đà Nẵng, Nhãn Huế và tuyến đường nối liền */}
      <DestinationLabelOverlay
        danangOverlayRef={danangOverlayRef}
        hueOverlayRef={hueOverlayRef}
        svgRoutePathRef={svgRoutePathRef}
        routeBadgeRef={routeBadgeRef}
      />
    </div>
  );
};
