import React, { useRef } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
  DA_NANG_DESTINATION,
  HUE_DESTINATION,
  DA_NANG_HUE_ROUTE,
  type DestinationDefinition,
  type JourneyRouteDefinition,
} from './destinationConfig';

import type { TimelineProgress } from './journeyTimeline';

/**
 * Three.js Inner Hook/Component: Chiếu tọa độ 3D của cả 2 địa danh Origin & Destination
 * và vẽ đường cong route SVG nối liền hai điểm neo trực tiếp trên DOM (zero React re-renders)
 */
export const DualLandmarkAnchorTracker: React.FC<{
  origin3D?: [number, number, number];
  destination3D?: [number, number, number];
  danang3D?: [number, number, number]; // Tương thích ngược
  hue3D?: [number, number, number]; // Tương thích ngược
  danangOverlayRef: React.RefObject<HTMLDivElement | null>;
  hueOverlayRef: React.RefObject<HTMLDivElement | null>;
  svgRoutePathRef: React.RefObject<SVGPathElement | null>;
  routeBadgeRef: React.RefObject<HTMLDivElement | null>;
  danangPinProgress?: number;
  routeDrawProgress?: number;
  huePinProgress?: number;
  badgeProgress?: number;
  timelineRef?: React.RefObject<TimelineProgress | null>;
}> = ({
  origin3D,
  destination3D,
  danang3D,
  hue3D,
  danangOverlayRef,
  hueOverlayRef,
  svgRoutePathRef,
  routeBadgeRef,
  danangPinProgress = 1.0,
  routeDrawProgress = 1.0,
  huePinProgress = 1.0,
  badgeProgress = 1.0,
  timelineRef,
}) => {
  const { camera } = useThree();
  const vec1 = useRef(new THREE.Vector3());
  const vec2 = useRef(new THREE.Vector3());

  // Xác định tọa độ 3D thực tế của 2 điểm neo
  const posOrigin = origin3D || danang3D || DA_NANG_DESTINATION.labelAnchor.origin.worldPosition;
  const posDest = destination3D || hue3D || HUE_DESTINATION.labelAnchor.destination.worldPosition;

  useFrame(() => {
    // 1. Lấy giá trị tiến trình từ timeline tập trung
    const rawDp = timelineRef?.current ? timelineRef.current.danangPinProgress : danangPinProgress;
    const rawHp = timelineRef?.current ? timelineRef.current.huePinProgress : huePinProgress;
    const rawRp = timelineRef?.current ? timelineRef.current.routeDrawProgress : routeDrawProgress;
    const rawBp = timelineRef?.current ? timelineRef.current.badgeProgress : badgeProgress;

    // 1. Chiếu điểm neo Origin (Bên trái)
    vec1.current.set(posOrigin[0], posOrigin[1], posOrigin[2]);
    vec1.current.project(camera);
    const vis1 = vec1.current.z < 1.0;
    const x1 = ((vec1.current.x + 1) / 2) * 100;
    const y1 = ((-vec1.current.y + 1) / 2) * 100;

    const dp = Math.max(0, rawDp);
    if (danangOverlayRef.current) {
      danangOverlayRef.current.style.left = `${x1}%`;
      danangOverlayRef.current.style.top = `${y1}%`;
      danangOverlayRef.current.style.transform = `translate(-50%, -100%) scale(${dp.toFixed(3)})`;
      danangOverlayRef.current.style.opacity = vis1 && dp > 0.04 ? '1' : '0';
    }

    // 2. Chiếu điểm neo Destination (Bên phải)
    vec2.current.set(posDest[0], posDest[1], posDest[2]);
    vec2.current.project(camera);
    const vis2 = vec2.current.z < 1.0;
    const x2 = ((vec2.current.x + 1) / 2) * 100;
    const y2 = ((-vec2.current.y + 1) / 2) * 100;

    const hp = Math.max(0, rawHp);
    if (hueOverlayRef.current) {
      hueOverlayRef.current.style.left = `${x2}%`;
      hueOverlayRef.current.style.top = `${y2}%`;
      hueOverlayRef.current.style.transform = `translate(-50%, -100%) scale(${hp.toFixed(3)})`;
      hueOverlayRef.current.style.opacity = vis2 && hp > 0.04 ? '1' : '0';
    }

    // 3. Tính toán đỉnh cung đường cong SVG nối 2 pin (vồng lên bầu trời)
    const midX = (x1 + x2) / 2;
    const midY = Math.min(y1, y2) - 12;

    const rp = Math.max(0, Math.min(1.0, rawRp));
    if (svgRoutePathRef.current) {
      svgRoutePathRef.current.setAttribute(
        'd',
        `M ${x1} ${y1} Q ${midX} ${midY} ${x2} ${y2}`
      );
      const dashOffset = (100 * (1 - rp)).toFixed(2);
      svgRoutePathRef.current.style.strokeDashoffset = `${dashOffset}`;
      svgRoutePathRef.current.style.opacity = vis1 && vis2 && rp > 0.02 ? '1' : '0';
    }

    const bp = Math.max(0, Math.min(1.0, rawBp));
    if (routeBadgeRef.current) {
      routeBadgeRef.current.style.left = `${midX}%`;
      routeBadgeRef.current.style.top = `${midY}%`;
      routeBadgeRef.current.style.transform = `translate(-50%, -50%) scale(${bp.toFixed(3)})`;
      routeBadgeRef.current.style.opacity = vis1 && vis2 && bp > 0.04 ? '1' : '0';
    }
  });

  return null;
};

interface DestinationLabelOverlayProps {
  danangOverlayRef: React.RefObject<HTMLDivElement | null>;
  hueOverlayRef: React.RefObject<HTMLDivElement | null>;
  svgRoutePathRef: React.RefObject<SVGPathElement | null>;
  routeBadgeRef: React.RefObject<HTMLDivElement | null>;
  fromDestination?: DestinationDefinition;
  toDestination?: DestinationDefinition;
  route?: JourneyRouteDefinition;
}

/**
 * Lớp phủ HTML/SVG thuần túy (HTML/SVG Overlay Layer)
 * Hiển thị huy hiệu Đà Nẵng, Huế, Nha Trang... và tuyến đường vector nối liền 2 điểm neo
 */
export const DestinationLabelOverlay: React.FC<DestinationLabelOverlayProps> = ({
  danangOverlayRef,
  hueOverlayRef,
  svgRoutePathRef,
  routeBadgeRef,
  fromDestination = DA_NANG_DESTINATION,
  toDestination = HUE_DESTINATION,
  route = DA_NANG_HUE_ROUTE,
}) => {
  const originAnchor = fromDestination.labelAnchor.origin;
  const destAnchor = toDestination.labelAnchor.destination;

  return (
    <div
      className="absolute inset-0 w-full h-full pointer-events-none select-none overflow-hidden z-20"
      data-testid="danava-go-labels-and-route-overlay"
    >
      {/* =======================================================================
          A. TUYẾN ĐƯỜNG SVG NỐI 2 ĐỊA DANH (DYNAMIC VECTOR ROUTE PATH)
          100% Vector SVG, không bake vào ảnh nền
          ======================================================================= */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none z-10"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#0097A7" stopOpacity="0.85" />
            <stop offset="50%" stopColor="#00B4D8" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#00796B" stopOpacity="0.85" />
          </linearGradient>

          <filter id="routeGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="0.4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        <path
          ref={svgRoutePathRef}
          pathLength={100}
          strokeDasharray="100 100"
          fill="none"
          stroke="url(#routeGradient)"
          strokeWidth="0.5"
          strokeLinecap="round"
          filter="url(#routeGlow)"
          className="transition-opacity duration-200"
          style={{ opacity: 0, strokeDashoffset: '100' }}
        />
      </svg>

      {/* =======================================================================
          B. HUY HIỆU THÔNG SỐ TUYẾN ĐƯỜNG Ở ĐỈNH CUNG (ROUTE INFO BADGE)
          ======================================================================= */}
      <div
        ref={routeBadgeRef}
        className="absolute -translate-x-1/2 -translate-y-full pointer-events-none z-30 transition-opacity duration-300"
        style={{ left: '50%', top: '25%', opacity: 0 }}
      >
        <div className="bg-[#102744]/90 backdrop-blur-md text-[#FFFDF8] px-2.5 py-0.5 rounded-full border border-white/20 shadow-[0_4px_16px_rgba(16,39,68,0.22)] flex items-center gap-1.5 whitespace-nowrap">
          <span className="w-1.5 h-1.5 rounded-full bg-[#00E5FF] animate-pulse" />
          <span className="font-mono text-[9px] font-bold tracking-wider uppercase text-[#E0F7FA]">
            {route.distanceKm} KM • {route.estimatedDuration}
          </span>
        </div>
      </div>

      {/* =======================================================================
          C. HUY HIỆU & PIN ĐIỂM KHỞI HÀNH (ORIGIN SLOT - BÊN TRÁI)
          ======================================================================= */}
      <div
        ref={danangOverlayRef}
        className="absolute -translate-x-1/2 -translate-y-full pointer-events-none z-30 transition-opacity duration-300"
        style={{ left: '26%', top: '40%', opacity: 0 }}
        data-testid="origin-destination-label"
        aria-label={`${fromDestination.displayName} — ${fromDestination.tagline}`}
      >
        <div className="flex flex-col items-center">
          <div className="bg-[#FFFDF8]/95 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-[#E5E3DC] shadow-[0_8px_24px_-4px_rgba(16,39,68,0.16)] flex items-center gap-2 mb-1.5 whitespace-nowrap">
            <div className="w-5 h-5 rounded-full bg-[#E0F7FA] text-[#0097A7] flex items-center justify-center shrink-0">
              <svg
                className="w-3 h-3 text-[#0097A7]"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
            </div>

            <div className="flex flex-col text-left leading-tight">
              <div className="flex items-center gap-1.5">
                <span className="font-serif font-bold text-sm tracking-wide text-[#102744]">
                  {fromDestination.displayName}
                </span>
                <span className="text-[9px] font-bold uppercase tracking-wider text-[#0097A7] bg-[#E0F7FA] px-1.5 py-0.5 rounded-full">
                  Khởi hành
                </span>
              </div>
              <span className="text-[10px] font-medium text-[#718096] tracking-tight">
                {originAnchor.badgeSubtitle || fromDestination.tagline}
              </span>
            </div>
          </div>

          {/* Đường dóng SVG & Điểm neo phát sáng */}
          <div className="relative flex flex-col items-center">
            <div className="w-[1.5px] h-3 bg-gradient-to-b from-[#0097A7] to-[#0097A7]/40" />
            <div className="relative flex items-center justify-center">
              <span className="absolute w-3.5 h-3.5 rounded-full bg-[#00E5FF]/30 animate-ping" />
              <span className="w-2 h-2 rounded-full bg-[#0097A7] border border-white shadow-sm" />
            </div>
          </div>
        </div>
      </div>

      {/* =======================================================================
          D. HUY HIỆU & PIN ĐIỂM ĐẾN (DESTINATION SLOT - BÊN PHẢI)
          ======================================================================= */}
      <div
        ref={hueOverlayRef}
        className="absolute -translate-x-1/2 -translate-y-full pointer-events-none z-30 transition-opacity duration-300"
        style={{ left: '74%', top: '40%', opacity: 0 }}
        data-testid="arrival-destination-label"
        aria-label={`${toDestination.displayName} — ${toDestination.tagline}`}
      >
        <div className="flex flex-col items-center">
          <div className="bg-[#FFFDF8]/95 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-[#E5E3DC] shadow-[0_8px_24px_-4px_rgba(16,39,68,0.16)] flex items-center gap-2 mb-1.5 whitespace-nowrap">
            <div className="w-5 h-5 rounded-full bg-[#FFF3E0] text-[#E65100] flex items-center justify-center shrink-0">
              <svg
                className="w-3 h-3 text-[#E65100]"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            </div>

            <div className="flex flex-col text-left leading-tight">
              <div className="flex items-center gap-1.5">
                <span className="font-serif font-bold text-sm tracking-wide text-[#102744]">
                  {toDestination.displayName}
                </span>
                <span className="text-[9px] font-bold uppercase tracking-wider text-[#E65100] bg-[#FFF3E0] px-1.5 py-0.5 rounded-full">
                  Điểm đến
                </span>
              </div>
              <span className="text-[10px] font-medium text-[#718096] tracking-tight">
                {destAnchor.badgeSubtitle || toDestination.tagline}
              </span>
            </div>
          </div>

          {/* Đường dóng SVG & Điểm neo phát sáng */}
          <div className="relative flex flex-col items-center">
            <div className="w-[1.5px] h-3 bg-gradient-to-b from-[#E65100] to-[#E65100]/40" />
            <div className="relative flex items-center justify-center">
              <span className="absolute w-3.5 h-3.5 rounded-full bg-[#FFA726]/30 animate-ping" />
              <span className="w-2 h-2 rounded-full bg-[#E65100] border border-white shadow-sm" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
