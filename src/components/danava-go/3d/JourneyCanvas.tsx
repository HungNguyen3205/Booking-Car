import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { DANAVA_3D_CONFIG } from './environmentConfig';
import { Environment } from './Environment';
import { PaperTicket } from './PaperTicket';
import { CurvedRoad } from './CurvedRoad';
import { VehicleStage } from './VehicleStage';
import { CentralPassTransition } from './CentralPassTransition';
import { LandmarkSlotStage } from './LandmarkSlotStage';
import {
  useRouteTransitionController,
  type RouteTransitionController,
} from './routeTransition';
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
import type { VehicleCategory } from '../../../types';

interface JourneyCanvasProps {
  children?: React.ReactNode;
  className?: string;
  flapAngle?: number;
  isDebug?: boolean;
  shouldReduceMotion?: boolean;
  coachReplayKey?: number;
  fromCity?: string;
  toCity?: string;
  isIntroPlayed?: boolean;
  introReplayKey?: number;
  isSkipped?: boolean;
  onTimelineStateChange?: (state: JourneyTimelineState) => void;
  onTimelineComplete?: () => void;
  selectedVehicle?: VehicleCategory;
  onVehicleError?: (failedCategory: VehicleCategory, fallbackCategory: VehicleCategory) => void;
  simulateSceneError?: boolean;
  onSceneError?: (targetRoute: { from: string; to: string }, errorMsg: string) => void;
  onSceneChangeStart?: () => void;
  onSceneChangeComplete?: (from: string, to: string) => void;
}

/**
 * Điều phối viên chuyển cảnh 60fps trong useFrame
 * Kích hoạt re-render 1 lần duy nhất đúng thời điểm cụm cũ đã hạ hẳn để đổi landmark mới
 */
const TransitionTicker: React.FC<{
  controller: RouteTransitionController;
  onSwitch: () => void;
}> = ({ controller, onSwitch }) => {
  useFrame((_, delta) => {
    const oldPhase = controller.phase;
    controller.update(delta);
    if (oldPhase === 'exiting' && controller.phase === 'entering') {
      onSwitch();
    }
  });
  return null;
};

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

    // 3. Tôn trọng reduced motion ngay lập tức (Requirement 9)
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
  selectedVehicle = 'sleeper',
  onVehicleError,
  simulateSceneError = false,
  onSceneError,
  onSceneChangeStart,
  onSceneChangeComplete,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hasWebGL] = useState<boolean>(() => checkWebGLAvailability());
  const [hasRendererError, setHasRendererError] = useState(false);

  // Requirement 7: Pause animations when tab is hidden or hero is outside viewport
  const [isTabVisible, setIsTabVisible] = useState(() => {
    return typeof document !== 'undefined' ? document.visibilityState === 'visible' : true;
  });
  const [isInViewport, setIsInViewport] = useState(true);

  // Requirement 6 & 10: Device-calibrated DPR, Shadows & Mobile camera layout
  const [isMobileScreen, setIsMobileScreen] = useState(() => {
    return typeof window !== 'undefined' ? window.innerWidth < 768 : false;
  });

  useEffect(() => {
    const handleResize = () => {
      setIsMobileScreen(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize, { passive: true });
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Listen to tab visibility
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsTabVisible(document.visibilityState === 'visible');
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Listen to intersection with viewport
  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInViewport(entry.isIntersecting);
      },
      { threshold: 0.05 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const isCanvasActive = isTabVisible && isInViewport;

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

  // Step 12: Bộ điều phối chuyển cảnh thông minh giữa Form, Scene và Route (Latest Choice Wins)
  const { controller, requestRoute } = useRouteTransitionController(
    fromCity,
    toCity,
    shouldReduceMotion
  );
  const [, setRenderEpoch] = useState<number>(0);

  // Kích hoạt request đổi tuyến (Latest Choice Wins)
  useEffect(() => {
    if (simulateSceneError) {
      onSceneError?.(
        { from: fromCity, to: toCity },
        `Không thể tải cảnh quan cho tuyến ${fromCity} → ${toCity}. Giữ cảnh trước đó an toàn.`
      );
      return;
    }
    onSceneChangeStart?.();
    requestRoute(fromCity, toCity);
  }, [fromCity, toCity, simulateSceneError, requestRoute, onSceneError, onSceneChangeStart]);

  const { camera, colors } = DANAVA_3D_CONFIG;

  // Requirement 10: Adaptive mobile camera framing
  const activeFov = isMobileScreen ? 42 : camera.fov;
  const activePosition: [number, number, number] = isMobileScreen
    ? [0, 5.2, 10.4]
    : camera.position;

  // Requirement 6: Device-calibrated DPR (max 1.5 on mobile to avoid GPU throttling, max 2 on desktop)
  const activeDpr: [number, number] = isMobileScreen ? [1, 1.5] : [1, 2];

  // WebGL Context Lost & Restored event handling (Requirement 8)
  const handleCreated = useCallback(
    ({ camera: activeCamera, gl }: { camera: THREE.Camera; gl: THREE.WebGLRenderer }) => {
      activeCamera.lookAt(camera.target[0], camera.target[1], camera.target[2]);
      gl.setClearColor(colors.background, 0);

      const canvasEl = gl.domElement;
      const onContextLost = (e: Event) => {
        e.preventDefault();
        setHasRendererError(true);
      };
      const onContextRestored = () => {
        setHasRendererError(false);
      };

      canvasEl.addEventListener('webglcontextlost', onContextLost);
      canvasEl.addEventListener('webglcontextrestored', onContextRestored);
    },
    [camera.target, colors.background]
  );

  // Requirement 8: Poster fallback when WebGL fails or context is lost
  if (!hasWebGL || hasRendererError) {
    return (
      <WebGLFallback
        fromCity={fromCity}
        toCity={toCity}
        message="Trình duyệt đang vận hành ở chế độ 2D Poster tiết kiệm tài nguyên. Mọi thao tác tìm chuyến, chọn ghế và đặt vé vẫn hoạt động mượt mà."
      />
    );
  }

  return (
    <div
      ref={containerRef}
      className={`w-full h-full relative pointer-events-none select-none ${className}`}
      data-testid="danava-go-3d-canvas-container"
    >
      <Canvas
        shadows
        dpr={activeDpr}
        frameloop={isCanvasActive ? 'always' : 'never'}
        camera={{
          fov: activeFov,
          position: activePosition,
          near: camera.near,
          far: camera.far,
        }}
        gl={{
          alpha: true,
          antialias: true,
          powerPreference: isMobileScreen ? 'default' : 'high-performance',
          stencil: false,
          depth: true,
        }}
        onCreated={handleCreated}
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

        {/* Step 12: Bộ điều phối chuyển cảnh 60fps đồng bộ trong useFrame */}
        <TransitionTicker
          controller={controller}
          onSwitch={() => {
            setRenderEpoch((e) => e + 1);
            onSceneChangeComplete?.(controller.current.fromCity, controller.current.toCity);
          }}
        />

        {/* Paper Ticket: Thin ivory cardstock with precision hinge pivot, crease line and route imprint */}
        <PaperTicket
          flapAngle={flapAngle}
          isDebug={isDebug}
          fromCity={controller.current.fromCity}
          toCity={controller.current.toCity}
          timelineRef={timelineRef}
        />

        {/* Curved Road: Real continuous ribbon, shoulders, and dashed centerline */}
        <CurvedRoad isDebug={isDebug} />

        {/* =======================================================================
            Step 12: VÙNG ORIGIN LANDMARK (MẠN TRÁI VÉ)
            Quản lý trồi sụt chuyển cảnh nhịp nhàng khi đổi tuyến hoặc đảo chiều
            ======================================================================= */}
        <LandmarkSlotStage
          destination={controller.current.fromDest}
          slot="origin"
          controller={controller}
          timelineRef={timelineRef}
          isDebug={isDebug}
        />

        {/* Central Pass Transition: Đèo Hải Vân & Rặng đồi xanh kết nối 2 miền di sản */}
        <CentralPassTransition timelineRef={timelineRef} />

        {/* =======================================================================
            Step 12: VÙNG DESTINATION LANDMARK (MẠN PHẢI VÉ)
            Tuyệt đối không gán tên mới đè lên công trình cũ trong bất kỳ frame nào
            ======================================================================= */}
        <LandmarkSlotStage
          destination={controller.current.toDest}
          slot="destination"
          controller={controller}
          timelineRef={timelineRef}
          isDebug={isDebug}
        />

        {/* Step 9 & 12: Dynamic Vehicle Selection & Safe Vehicle Transitions */}
        <VehicleStage
          currentVehicle={selectedVehicle}
          shouldReduceMotion={shouldReduceMotion}
          timelineRef={timelineRef}
          replayKey={coachReplayKey}
          onVehicleError={onVehicleError}
        />

        {/* Dual Landmark Anchor Tracker: Chiếu cả 2 điểm neo 3D và vẽ đường cong route SVG */}
        <DualLandmarkAnchorTracker
          origin3D={controller.current.fromDest.labelAnchor.origin.worldPosition}
          destination3D={controller.current.toDest.labelAnchor.destination.worldPosition}
          danangOverlayRef={danangOverlayRef}
          hueOverlayRef={hueOverlayRef}
          svgRoutePathRef={svgRoutePathRef}
          routeBadgeRef={routeBadgeRef}
          timelineRef={timelineRef}
          controller={controller}
        />

        {/* Slot cho các phần tử 3D mở rộng */}
        {children}
      </Canvas>

      {/* Lớp phủ HTML/SVG: Nhãn Origin, Nhãn Destination và tuyến đường nối liền */}
      <DestinationLabelOverlay
        danangOverlayRef={danangOverlayRef}
        hueOverlayRef={hueOverlayRef}
        svgRoutePathRef={svgRoutePathRef}
        routeBadgeRef={routeBadgeRef}
        fromDestination={controller.current.fromDest}
        toDestination={controller.current.toDest}
        route={controller.current.routeDef}
        transitionProgress={controller.progress}
      />
    </div>
  );
};
