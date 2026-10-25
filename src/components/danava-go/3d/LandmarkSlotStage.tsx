import React, { useRef, Suspense } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import type { DestinationDefinition } from './destinationConfig';
import type { TimelineProgress } from './journeyTimeline';
import { DaNangLandmark } from './DaNangLandmark';
import { HueLandmark } from './HueLandmark';
import type { RouteTransitionController } from './routeTransition';

// Requirements 2 & 3: Lazy-load non-initial landmarks on demand to optimize initial load
const NhaTrangLandmark = React.lazy(() =>
  import('./NhaTrangLandmark').then((m) => ({ default: m.NhaTrangLandmark }))
);
const HoChiMinhLandmark = React.lazy(() =>
  import('./HoChiMinhLandmark').then((m) => ({ default: m.HoChiMinhLandmark }))
);
const NeutralScenicLandscape = React.lazy(() =>
  import('./NeutralScenicLandscape').then((m) => ({ default: m.NeutralScenicLandscape }))
);

interface LandmarkSlotStageProps {
  destination: DestinationDefinition;
  slot: 'origin' | 'destination';
  controller: RouteTransitionController;
  timelineRef?: React.RefObject<TimelineProgress | null>;
  isDebug?: boolean;
}

/**
 * Container bọc slot địa danh (Origin / Destination)
 * Điều phối hiệu ứng hạ nhẹ khi đổi cảnh và nổi mượt mà khi cảnh mới vào
 * Đảm bảo Zero React Re-renders và đồng bộ 100% với useFrame
 */
export const LandmarkSlotStage: React.FC<LandmarkSlotStageProps> = ({
  destination,
  slot,
  controller,
  timelineRef,
  isDebug = false,
}) => {
  const rootRef = useRef<THREE.Group>(null);

  // Điều phối scale và cao độ Y khi chuyển cảnh (Route Switch Transition)
  useFrame(() => {
    if (!rootRef.current) return;

    // Tiến trình chuyển cảnh (1.0 = hiển thị đủ, 0.0 = hạ mờ)
    const tp = Math.max(0.001, Math.min(1.0, controller.progress));

    // Scale nhẹ từ 0.001 -> 1.0
    rootRef.current.scale.set(tp, tp, tp);

    // Dịch nhẹ trục Y (hạ xuống 0.20 units khi mờ đi và trồi lên khi xuất hiện)
    rootRef.current.position.y = (tp - 1.0) * 0.20;

    // Ẩn hoàn toàn nếu tp cực nhỏ để tối ưu draw call
    rootRef.current.visible = tp > 0.02;
  });

  return (
    <group ref={rootRef} name={`LANDMARK_SLOT_${slot.toUpperCase()}_${destination.id}`}>
      {/* Initial default pair (Đà Nẵng -> Huế) ready instantly */}
      {destination.id === 'da-nang' && (
        <DaNangLandmark slot={slot} timelineRef={timelineRef} isDebug={isDebug} />
      )}
      {destination.id === 'hue' && (
        <HueLandmark slot={slot} timelineRef={timelineRef} isDebug={isDebug} />
      )}

      {/* Lazy-loaded landmark modules on user selection */}
      <Suspense fallback={null}>
        {destination.id === 'nha-trang' && (
          <NhaTrangLandmark slot={slot} timelineRef={timelineRef} isDebug={isDebug} />
        )}
        {destination.id === 'ho-chi-minh' && (
          <HoChiMinhLandmark slot={slot} timelineRef={timelineRef} isDebug={isDebug} />
        )}
        {!destination.hasDedicatedModel && (
          <NeutralScenicLandscape slot={slot} timelineRef={timelineRef} isDebug={isDebug} />
        )}
      </Suspense>
    </group>
  );
};
