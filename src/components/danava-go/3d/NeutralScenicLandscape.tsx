import React from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { NEUTRAL_SCENIC_DESTINATION } from './destinationConfig';
import type { TimelineProgress } from './journeyTimeline';

interface NeutralScenicLandscapeProps {
  castShadow?: boolean;
  receiveShadow?: boolean;
  isDebug?: boolean;
  popProgress?: number;
  timelineRef?: React.RefObject<TimelineProgress | null>;
  slot?: 'origin' | 'destination';
}

/**
 * Cảnh quan phong cảnh thiên nhiên trung tính (Neutral Scenic Landscape)
 * Sử dụng cho các tuyến hoặc địa điểm chưa có mô hình kiến trúc chuyên biệt đạt chuẩn
 * Tránh việc gán nhãn sai tên tỉnh lên Ngọ Môn, Tháp Trầm Hương hay Cầu Rồng.
 */
export const NeutralScenicLandscape: React.FC<NeutralScenicLandscapeProps> = ({
  castShadow = true,
  receiveShadow = true,
  isDebug = false,
  popProgress = 1.0,
  timelineRef,
  slot = 'destination',
}) => {
  const rootGroupRef = React.useRef<THREE.Group>(null);

  const { placements, safeZone, labelAnchor, model } = NEUTRAL_SCENIC_DESTINATION;
  const placement = slot === 'origin' ? placements.origin : placements.destination;
  const currentAnchor = slot === 'origin' ? labelAnchor.origin : labelAnchor.destination;

  useFrame(() => {
    if (rootGroupRef.current && timelineRef?.current) {
      const p = Math.max(
        0,
        slot === 'origin'
          ? timelineRef.current.danangPopProgress
          : timelineRef.current.huePopProgress
      );
      rootGroupRef.current.visible = p > 0.001;
      rootGroupRef.current.scale.set(
        placement.scale[0] * p,
        placement.scale[1] * p,
        placement.scale[2] * p
      );
      rootGroupRef.current.position.y = placement.position[1] * Math.min(1.0, p);
    }
  });

  const effectivePop = Math.max(0, popProgress);
  const isHidden = effectivePop <= 0.001;

  const initialScale: [number, number, number] = [
    placement.scale[0] * effectivePop,
    placement.scale[1] * effectivePop,
    placement.scale[2] * effectivePop,
  ];

  return (
    <group
      ref={rootGroupRef}
      name={`DANAVA_NEUTRAL_SCENIC_${slot.toUpperCase()}`}
      position={[placement.position[0], placement.position[1], placement.position[2]]}
      rotation={[placement.rotation[0], placement.rotation[1], placement.rotation[2]]}
      scale={initialScale}
      visible={!isHidden}
    >
      {/* 1. MẶT HỒ / SƯƠNG MỜ PHẲNG NẰM TRÊN NỀN VÉ */}
      <mesh position={[0, 0.002, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow={receiveShadow}>
        <circleGeometry args={[0.75, 24]} />
        <meshStandardMaterial
          color={model.materials.water}
          roughness={0.25}
          metalness={0.4}
          transparent
          opacity={0.75}
        />
      </mesh>

      {/* 2. DÃY ĐỒI NON XANH TỰ NHIÊN */}
      {/* Đồi chính */}
      <mesh position={[-0.10, 0.22, -0.15]} scale={[1.4, 0.85, 1.1]} castShadow={castShadow}>
        <coneGeometry args={[0.42, 0.52, 10]} />
        <meshStandardMaterial color={model.materials.hills} roughness={0.9} />
      </mesh>

      {/* Đồi phụ bên trái */}
      <mesh position={[-0.45, 0.16, 0.05]} scale={[1.1, 0.7, 0.9]} castShadow={castShadow}>
        <coneGeometry args={[0.32, 0.42, 8]} />
        <meshStandardMaterial color="#4A755A" roughness={0.9} />
      </mesh>

      {/* Đồi phụ bên phải */}
      <mesh position={[0.35, 0.18, -0.05]} scale={[1.2, 0.75, 1.0]} castShadow={castShadow}>
        <coneGeometry args={[0.36, 0.46, 8]} />
        <meshStandardMaterial color="#365C45" roughness={0.9} />
      </mesh>

      {/* 3. CÁC CỤM CÂY DIORAMA TÁN TRÒN & THÔNG */}
      <group position={[-0.20, 0.005, 0.22]}>
        <mesh position={[0, 0.08, 0]} castShadow={castShadow}>
          <coneGeometry args={[0.07, 0.16, 7]} />
          <meshStandardMaterial color={model.materials.trees} roughness={0.85} />
        </mesh>
        <mesh position={[0.12, 0.06, -0.04]} castShadow={castShadow}>
          <coneGeometry args={[0.055, 0.13, 7]} />
          <meshStandardMaterial color="#1E442D" roughness={0.85} />
        </mesh>
      </group>

      <group position={[0.25, 0.005, 0.18]}>
        <mesh position={[0, 0.07, 0]} castShadow={castShadow}>
          <dodecahedronGeometry args={[0.065, 0]} />
          <meshStandardMaterial color="#3E6B4E" roughness={0.88} />
        </mesh>
      </group>

      {/* 4. DEBUG ANCHOR VÀ SAFE ZONE NẾU CÓ */}
      {isDebug && (
        <group>
          <mesh
            position={[
              (currentAnchor.worldPosition[0] - placement.position[0]) / placement.scale[0],
              currentAnchor.worldPosition[1] / placement.scale[1],
              (currentAnchor.worldPosition[2] - placement.position[2]) / placement.scale[2],
            ]}
          >
            <sphereGeometry args={[0.024, 12, 12]} />
            <meshBasicMaterial color="#90CAF9" />
          </mesh>

          <lineSegments
            position={[
              ((safeZone.bounds.minX + safeZone.bounds.maxX) / 2 - placement.position[0]) / placement.scale[0],
              ((safeZone.bounds.minY + safeZone.bounds.maxY) / 2) / placement.scale[1],
              ((safeZone.bounds.minZ + safeZone.bounds.maxZ) / 2 - placement.position[2]) / placement.scale[2],
            ]}
          >
            <edgesGeometry
              args={[
                new THREE.BoxGeometry(
                  (safeZone.bounds.maxX - safeZone.bounds.minX) / placement.scale[0],
                  (safeZone.bounds.maxY - safeZone.bounds.minY) / placement.scale[1],
                  (safeZone.bounds.maxZ - safeZone.bounds.minZ) / placement.scale[2]
                ),
              ]}
            />
            <lineBasicMaterial color="#90CAF9" />
          </lineSegments>
        </group>
      )}
    </group>
  );
};
