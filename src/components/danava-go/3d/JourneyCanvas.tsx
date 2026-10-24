import React, { useState, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
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
import {
  type JourneyTimelineState,
  type TimelineProgress,
  TIMELINE_CONFIG,
  calculateTimelineProgress,
} from './journeyTimeline';

interface JourneyCanvasProps {
  children?: React.ReactNode;
  className?: string;
  flapAngle?: number;
  isDebug?: boolean;
  shouldReduceMotion?: boolean;
  coachReplayKey?: number;
  fromCity?: string;
  toCity?: string;
  // Step 8: Intro Timeline Orchestration Props
  isIntroPlayed?: boolean;
  introReplayKey?: number;
  isSkipped?: boolean;
  onTimelineStateChange?: (state: JourneyTimelineState) => void;
  onTimelineComplete?: () => void;
}

/**
 * Điều phối viên Timeline chạy trong vòng lặp useFrame của Three.js
 * Cập nhật đồng bộ các thành phần 3D và DOM theo tiến trình thời gian thực (zero React re-renders)
 */
const JourneyTimelineManager: React.FC<{
  timelineRef: React.MutableRefObject<TimelineProgress>;
  isIntroPlayed: boolean;
  introReplayKey: number;
  shouldReduceMotion: boolean;
  isSkipped: boolean;
  onTimelineStateChange?: (state: JourneyTimelineState) => void;
  onTimelineComplete?: () => void;
}> = ({
  timelineRef,
  isIntroPlayed,
  introReplayKey,
  shouldReduceMotion,
  isSkipped,
  onTimelineStateChange,
  onTimelineComplete,
}) => {
  const elapsedRef = useRef<number>(
    isIntroPlayed || shouldReduceMotion ? TIMELINE_CONFIG.totalDuration : 0
  );
  const prevStateRef = useRef<JourneyTimelineState>(
    isIntroPlayed || shouldReduceMotion ? 'ready' : 'closed'
  );
  const prevReplayRef = useRef<number>(introReplayKey);
  const isCompleteRef = useRef<boolean>(isIntroPlayed || shouldReduceMotion);

  useFrame((_, delta) => {
    // 1. Kiểm tra lệnh phát lại intro từ nút debug
    if (introReplayKey !== prevReplayRef.current) {
      prevReplayRef.current = introReplayKey;
      elapsedRef.current = 0;
      isCompleteRef.current = false;
    }

    // 2. Kiểm tra thao tác bỏ qua an toàn (skip to ready)
    if (isSkipped && !isCompleteRef.current) {
      elapsedRef.current = TIMELINE_CONFIG.totalDuration;
      isCompleteRef.current = true;
    }

    // 3. Tôn trọng reduced motion ngay lập tức
    if (shouldReduceMotion) {
      elapsedRef.current = TIMELINE_CONFIG.totalDuration;
      isCompleteRef.current = true;
    }

    // 4. Tiến triển thời gian mượt mà
    if (!isCompleteRef.current) {
      elapsedRef.current += Math.min(delta, 0.04);
      if (elapsedRef.current >= TIMELINE_CONFIG.totalDuration) {
        elapsedRef.current = TIMELINE_CONFIG.totalDuration;
        isCompleteRef.current = true;
        onTimelineComplete?.();
      }
    }

    // 5. Tính toán tiến trình và phân bổ đồng bộ
    const progress = calculateTimelineProgress(elapsedRef.current, shouldReduceMotion);
    timelineRef.current = progress;

    if (progress.state !== prevStateRef.current) {
      prevStateRef.current = progress.state;
      onTimelineStateChange?.(progress.state);
    }
  });

  return null;
};

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
  isIntroPlayed = false,
  introReplayKey = 0,
  isSkipped = false,
  onTimelineStateChange,
  onTimelineComplete,
}) => {
  const [hasWebGL] = useState<boolean>(() => checkWebGLAvailability());
  const [hasRendererError, setHasRendererError] = useState(false);

  // Bộ đồng hồ tiến trình tập trung (Central Timeline Progress Reference)
  const timelineRef = useRef<TimelineProgress>(
    calculateTimelineProgress(
      isIntroPlayed || shouldReduceMotion ? TIMELINE_CONFIG.totalDuration : 0,
      shouldReduceMotion
    )
  );

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

        {/* Trình điều phối timeline tập trung (Step 8 orchestration loop) */}
        <JourneyTimelineManager
          timelineRef={timelineRef}
          isIntroPlayed={isIntroPlayed}
          introReplayKey={introReplayKey}
          shouldReduceMotion={shouldReduceMotion}
          isSkipped={isSkipped}
          onTimelineStateChange={onTimelineStateChange}
          onTimelineComplete={onTimelineComplete}
        />

        {/* Paper Ticket: Thin ivory cardstock with precision hinge pivot, crease line and route imprint */}
        <PaperTicket
          flapAngle={flapAngle}
          isDebug={isDebug}
          fromCity={fromCity}
          toCity={toCity}
          timelineRef={timelineRef}
        />

        {/* Curved Road: Real continuous ribbon, shoulders, and dashed centerline */}
        <CurvedRoad isDebug={isDebug} />

        {/* Da Nang Landmark: Cầu Rồng, Sông Hàn, Bờ kè, Cây xanh, Núi Sơn Trà */}
        <DaNangLandmark isDebug={isDebug} timelineRef={timelineRef} />

        {/* Central Pass Transition: Đèo Hải Vân & Rặng đồi xanh kết nối 2 miền di sản */}
        <CentralPassTransition timelineRef={timelineRef} />

        {/* Hue Landmark: Ngọ Môn Hoàng Thành, Lầu Ngũ Phụng, Hồ sen Kim Thủy, Rừng thông */}
        <HueLandmark isDebug={isDebug} timelineRef={timelineRef} />

        {/* Sleeper Coach: Grounded 3D coach model animated along road curve with wheel rotation */}
        <SleeperCoach
          shouldReduceMotion={shouldReduceMotion}
          replayKey={coachReplayKey}
          timelineRef={timelineRef}
        />

        {/* Dual Landmark Anchor Tracker: Chiếu cả 2 điểm neo 3D và vẽ đường cong route SVG */}
        <DualLandmarkAnchorTracker
          danang3D={DA_NANG_DESTINATION.labelAnchor.worldPosition}
          hue3D={HUE_DESTINATION.labelAnchor.worldPosition}
          danangOverlayRef={danangOverlayRef}
          hueOverlayRef={hueOverlayRef}
          svgRoutePathRef={svgRoutePathRef}
          routeBadgeRef={routeBadgeRef}
          timelineRef={timelineRef}
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
