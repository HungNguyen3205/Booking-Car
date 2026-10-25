import React, { useRef } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
  DA_NANG_DESTINATION,
  HUE_DESTINATION,
  type DestinationDefinition,
  type JourneyRouteDefinition,
} from './destinationConfig';

import type { TimelineProgress } from './journeyTimeline';
import type { RouteTransitionController } from './routeTransition';

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
  transitionProgress?: number;
  controller?: RouteTransitionController;
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
  transitionProgress = 1.0,
  controller,
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
    const tp = controller ? Math.max(0, Math.min(1.0, controller.progress)) : Math.max(0, Math.min(1.0, transitionProgress));

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
      danangOverlayRef.current.style.transform = `translate(-50%, -100%) scale(${(dp * tp).toFixed(3)})`;
      const op1 = vis1 && dp > 0.04 ? tp : 0;
      danangOverlayRef.current.style.opacity = op1 > 0.005 ? op1.toFixed(3) : '0';
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
      hueOverlayRef.current.style.transform = `translate(-50%, -100%) scale(${(hp * tp).toFixed(3)})`;
      const op2 = vis2 && hp > 0.04 ? tp : 0;
      hueOverlayRef.current.style.opacity = op2 > 0.005 ? op2.toFixed(3) : '0';
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
      const opRoute = vis1 && vis2 && rp > 0.02 ? tp : 0;
      svgRoutePathRef.current.style.opacity = opRoute > 0.005 ? opRoute.toFixed(3) : '0';
    }

    const bp = Math.max(0, Math.min(1.0, rawBp));
    if (routeBadgeRef.current) {
      routeBadgeRef.current.style.left = `${midX}%`;
      routeBadgeRef.current.style.top = `${midY}%`;
      routeBadgeRef.current.style.transform = `translate(-50%, -50%) scale(${(bp * tp).toFixed(3)})`;
      const opBadge = vis1 && vis2 && bp > 0.04 ? tp : 0;
      routeBadgeRef.current.style.opacity = opBadge > 0.005 ? opBadge.toFixed(3) : '0';
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
  transitionProgress?: number;
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
  transitionProgress = 1.0,
}) => {
  return (
    <div className="absolute inset-0 pointer-events-none" data-testid="danava-go-labels-and-route-overlay" style={{ opacity: transitionProgress < .01 ? 0 : 1 }}>
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <path ref={svgRoutePathRef} pathLength={100} strokeDasharray="100 100" fill="none" stroke="#0097A7" strokeWidth="0.25" strokeLinecap="round" style={{ opacity: 0, strokeDashoffset: '100' }} />
      </svg>
      <div ref={routeBadgeRef} hidden />
      <div ref={danangOverlayRef} className="go-label" data-testid="origin-destination-label">
        <div className="go-label-content"><strong>{fromDestination.displayName}</strong><small>Khởi hành</small></div><div className="go-label-pin" />
      </div>
      <div ref={hueOverlayRef} className="go-label go-label-arrival" data-testid="arrival-destination-label">
        <div className="go-label-content"><strong>{toDestination.displayName}</strong><small>Điểm đến</small></div><div className="go-label-pin" />
      </div>
    </div>
  );
};
