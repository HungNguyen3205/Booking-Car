import React, { useRef } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
  DA_NANG_DESTINATION,
  HUE_DESTINATION,
  DA_NANG_HUE_ROUTE,
} from './destinationConfig';

/**
 * Three.js Inner Hook/Component: Chiếu tọa độ 3D của cả 2 địa danh Đà Nẵng & Huế
 * và vẽ đường cong route SVG nối liền hai điểm neo trực tiếp trên DOM (zero React re-renders)
 */
export const DualLandmarkAnchorTracker: React.FC<{
  danang3D: [number, number, number];
  hue3D: [number, number, number];
  danangOverlayRef: React.RefObject<HTMLDivElement | null>;
  hueOverlayRef: React.RefObject<HTMLDivElement | null>;
  svgRoutePathRef: React.RefObject<SVGPathElement | null>;
  routeBadgeRef: React.RefObject<HTMLDivElement | null>;
}> = ({
  danang3D,
  hue3D,
  danangOverlayRef,
  hueOverlayRef,
  svgRoutePathRef,
  routeBadgeRef,
}) => {
  const { camera } = useThree();
  const vec1 = useRef(new THREE.Vector3());
  const vec2 = useRef(new THREE.Vector3());

  useFrame(() => {
    // 1. Chiếu điểm neo Đà Nẵng
    vec1.current.set(danang3D[0], danang3D[1], danang3D[2]);
    vec1.current.project(camera);
    const vis1 = vec1.current.z < 1.0;
    const x1 = ((vec1.current.x + 1) / 2) * 100;
    const y1 = ((-vec1.current.y + 1) / 2) * 100;

    if (danangOverlayRef.current) {
      danangOverlayRef.current.style.left = `${x1}%`;
      danangOverlayRef.current.style.top = `${y1}%`;
      danangOverlayRef.current.style.opacity = vis1 ? '1' : '0';
    }

    // 2. Chiếu điểm neo Huế
    vec2.current.set(hue3D[0], hue3D[1], hue3D[2]);
    vec2.current.project(camera);
    const vis2 = vec2.current.z < 1.0;
    const x2 = ((vec2.current.x + 1) / 2) * 100;
    const y2 = ((-vec2.current.y + 1) / 2) * 100;

    if (hueOverlayRef.current) {
      hueOverlayRef.current.style.left = `${x2}%`;
      hueOverlayRef.current.style.top = `${y2}%`;
      hueOverlayRef.current.style.opacity = vis2 ? '1' : '0';
    }

    // 3. Tính toán đỉnh cung đường cong SVG nối 2 pin (vòng lên bầu trời trên mô hình vé)
    const midX = (x1 + x2) / 2;
    // Đỉnh cung vồng lên phía trên đỉnh 2 pin khoảng 12%
    const midY = Math.min(y1, y2) - 12;

    if (svgRoutePathRef.current) {
      // Đường cong bậc 2 nối từ Đà Nẵng (x1, y1) qua đỉnh (midX, midY) đến Huế (x2, y2)
      svgRoutePathRef.current.setAttribute(
        'd',
        `M ${x1} ${y1} Q ${midX} ${midY} ${x2} ${y2}`
      );
      svgRoutePathRef.current.style.opacity = vis1 && vis2 ? '1' : '0';
    }

    if (routeBadgeRef.current) {
      routeBadgeRef.current.style.left = `${midX}%`;
      routeBadgeRef.current.style.top = `${midY}%`;
      routeBadgeRef.current.style.opacity = vis1 && vis2 ? '1' : '0';
    }
  });

  return null;
};

interface DestinationLabelOverlayProps {
  danangOverlayRef: React.RefObject<HTMLDivElement | null>;
  hueOverlayRef: React.RefObject<HTMLDivElement | null>;
  svgRoutePathRef: React.RefObject<SVGPathElement | null>;
  routeBadgeRef: React.RefObject<HTMLDivElement | null>;
}

/**
 * Lớp phủ HTML/SVG hiển thị:
 * 1. Huy hiệu & Pin Đà Nẵng (Khởi hành)
 * 2. Huy hiệu & Pin Huế (Điểm đến)
 * 3. Tuyến đường vector SVG nối liền 2 điểm neo
 * 4. Huy hiệu thông số tuyến đường (100 km • 2h 15m)
 * Tuyệt đối không bake vào texture 3D, không có đường vẽ tĩnh chồng chéo.
 */
export const DestinationLabelOverlay: React.FC<DestinationLabelOverlayProps> = ({
  danangOverlayRef,
  hueOverlayRef,
  svgRoutePathRef,
  routeBadgeRef,
}) => {
  const route = DA_NANG_HUE_ROUTE;

  return (
    <div
      className="absolute inset-0 w-full h-full pointer-events-none select-none overflow-hidden z-20"
      data-testid="danava-go-labels-and-route-overlay"
    >
      {/* =======================================================================
          A. TUYẾN ĐƯỜNG SVG NỐI ĐÀ NẴNG → HUẾ (DYNAMIC VECTOR ROUTE PATH)
          100% Vector SVG, không bake vào ảnh nền
          ======================================================================= */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none z-10"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <defs>
          {/* Gradient màu teal dọc theo hành trình */}
          <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#0097A7" stopOpacity="0.85" />
            <stop offset="50%" stopColor="#00B4D8" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#00796B" stopOpacity="0.85" />
          </linearGradient>

          {/* Hiệu ứng bóng phát sáng cho nét vẽ tuyến đường */}
          <filter id="routeGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="0.4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Nét bóng mờ phía dưới */}
        <path
          ref={svgRoutePathRef}
          fill="none"
          stroke="url(#routeGradient)"
          strokeWidth="0.45"
          strokeDasharray="1.2 0.8"
          strokeLinecap="round"
          filter="url(#routeGlow)"
          className="transition-opacity duration-300"
          style={{ opacity: 0 }}
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
          C. HUY HIỆU & PIN ĐÀ NẴNG (KHỞI HÀNH)
          ======================================================================= */}
      <div
        ref={danangOverlayRef}
        className="absolute -translate-x-1/2 -translate-y-full pointer-events-none z-30 transition-opacity duration-300"
        style={{ left: '26%', top: '40%', opacity: 0 }}
        data-testid="danang-destination-label"
        aria-label={`${DA_NANG_DESTINATION.displayName} — ${DA_NANG_DESTINATION.tagline}`}
      >
        <div className="flex flex-col items-center">
          {/* Card huy hiệu HTML */}
          <div className="bg-[#FFFDF8]/95 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-[#E5E3DC] shadow-[0_8px_24px_-4px_rgba(16,39,68,0.16)] flex items-center gap-2 mb-1.5 whitespace-nowrap">
            {/* SVG Pin Icon */}
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
                  {DA_NANG_DESTINATION.displayName}
                </span>
                <span className="text-[9px] font-bold uppercase tracking-wider text-[#0097A7] bg-[#E0F7FA] px-1.5 py-0.5 rounded-full">
                  Khởi hành
                </span>
              </div>
              <span className="text-[10px] font-medium text-[#718096] tracking-tight">
                {DA_NANG_DESTINATION.labelAnchor.badgeSubtitle}
              </span>
            </div>
          </div>

          {/* Đường dóng SVG & Điểm neo phát sáng vào đỉnh vòm Cầu Rồng */}
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
          D. HUY HIỆU & PIN HUẾ (ĐIỂM ĐẾN)
          ======================================================================= */}
      <div
        ref={hueOverlayRef}
        className="absolute -translate-x-1/2 -translate-y-full pointer-events-none z-30 transition-opacity duration-300"
        style={{ left: '74%', top: '40%', opacity: 0 }}
        data-testid="hue-destination-label"
        aria-label={`${HUE_DESTINATION.displayName} — ${HUE_DESTINATION.tagline}`}
      >
        <div className="flex flex-col items-center">
          {/* Card huy hiệu HTML */}
          <div className="bg-[#FFFDF8]/95 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-[#E5E3DC] shadow-[0_8px_24px_-4px_rgba(16,39,68,0.16)] flex items-center gap-2 mb-1.5 whitespace-nowrap">
            {/* SVG Crown / Gate Icon */}
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
                <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14v2H5v-2z" />
              </svg>
            </div>

            <div className="flex flex-col text-left leading-tight">
              <div className="flex items-center gap-1.5">
                <span className="font-serif font-bold text-sm tracking-wide text-[#102744]">
                  {HUE_DESTINATION.displayName}
                </span>
                <span className="text-[9px] font-bold uppercase tracking-wider text-[#E65100] bg-[#FFF3E0] px-1.5 py-0.5 rounded-full">
                  Điểm đến
                </span>
              </div>
              <span className="text-[10px] font-medium text-[#718096] tracking-tight">
                {HUE_DESTINATION.labelAnchor.badgeSubtitle}
              </span>
            </div>
          </div>

          {/* Đường dóng SVG & Điểm neo phát sáng vào đỉnh Lầu Ngũ Phụng */}
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
