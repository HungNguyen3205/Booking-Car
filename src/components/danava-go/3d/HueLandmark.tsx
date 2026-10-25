import { ScenicRidge } from './ScenicRidge';
import React, { useMemo } from 'react';
import * as THREE from 'three';
import { HUE_DESTINATION } from './destinationConfig';
import { NgoMonGate } from './NgoMonGate';

import { useFrame } from '@react-three/fiber';
import type { TimelineProgress } from './journeyTimeline';

interface HueLandmarkProps {
  castShadow?: boolean;
  receiveShadow?: boolean;
  isDebug?: boolean;
  popProgress?: number;
  timelineRef?: React.RefObject<TimelineProgress | null>;
  slot?: 'origin' | 'destination';
}

/**
 * Sinh hình học mặt nước hào thành Hồ Ngoại Kim Thủy
 * Đa giác uốn cong mềm mại, bao quanh mặt tiền Ngọ Môn
 */
function createKimThuyMoatGeometry(): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  // Vòng bao quanh mặt tiền thành: X [-0.92, 0.92], Z [0.16, 0.48]
  shape.moveTo(-0.92, 0.16);
  shape.lineTo(0.92, 0.16);
  shape.bezierCurveTo(0.98, 0.28, 0.95, 0.42, 0.88, 0.48);
  shape.bezierCurveTo(0.45, 0.52, -0.45, 0.52, -0.88, 0.48);
  shape.bezierCurveTo(-0.95, 0.42, -0.98, 0.28, -0.92, 0.16);
  shape.closePath();

  const geom = new THREE.ShapeGeometry(shape, 20);
  geom.rotateX(Math.PI / 2);
  geom.computeVertexNormals();
  return geom;
}

export const HueLandmark: React.FC<HueLandmarkProps> = ({
  castShadow = true,
  receiveShadow = true,
  isDebug = false,
  popProgress = 1.0,
  timelineRef,
  slot = 'destination',
}) => {
  const { materials } = HUE_DESTINATION.model;
  const { safeZone } = HUE_DESTINATION;
  const placement = slot === 'origin' ? HUE_DESTINATION.placements.origin : HUE_DESTINATION.placements.destination;
  const labelAnchor = slot === 'origin' ? HUE_DESTINATION.labelAnchor.origin : HUE_DESTINATION.labelAnchor.destination;
  const landmarkGroupRef = React.useRef<THREE.Group>(null);
  const treesGroupRef = React.useRef<THREE.Group>(null);

  // Nhẹ nhàng lay động rặng thông Cố đô theo gió và cập nhật pop-up 60fps
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (treesGroupRef.current && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      treesGroupRef.current.rotation.z = Math.sin(t * 1.4 + 1.0) * 0.012;
    }

    if (landmarkGroupRef.current && timelineRef?.current) {
      const p = Math.max(
        0,
        slot === 'origin'
          ? timelineRef.current.danangPopProgress
          : timelineRef.current.huePopProgress
      );
      landmarkGroupRef.current.visible = p > 0.001;
      landmarkGroupRef.current.scale.set(
        placement.scale[0] * p,
        placement.scale[1] * p,
        placement.scale[2] * p
      );
      landmarkGroupRef.current.position.y = placement.position[1] * Math.min(1.0, p);
    }
  });

  // Tỷ lệ nổi từ mặt vé (pop-up) với quãng đường ngắn
  const effectivePop = Math.max(0, popProgress);
  const isHidden = effectivePop <= 0.001;

  const currentScale: [number, number, number] = [
    placement.scale[0] * effectivePop,
    placement.scale[1] * effectivePop,
    placement.scale[2] * effectivePop,
  ];

  // Cao độ Y nhô từ mặt vé lên
  const currentPosY = placement.position[1] * Math.min(1.0, effectivePop);

  // 1. Hình học mặt nước hào thành Kim Thủy
  const moatGeometry = useMemo(() => createKimThuyMoatGeometry(), []);

  // 2. Danh sách cây thông Cố đô uy nghiêm quanh Ngọ Môn
  const pineTreeList = useMemo(() => {
    return [
      // Rặng thông bên tả (Tây Ngọ Môn)
      { x: -0.72, z: -0.22, scale: 0.22, color: '#225238' },
      { x: -0.85, z: 0.05, scale: 0.26, color: '#1B452E' },
      { x: -0.96, z: 0.32, scale: 0.18, color: '#2E6647' },

      // Rặng thông bên hữu (Đông Ngọ Môn)
      { x: 0.72, z: -0.22, scale: 0.22, color: '#225238' },
      { x: 0.85, z: 0.05, scale: 0.26, color: '#1B452E' },
      { x: 0.96, z: 0.32, scale: 0.18, color: '#2E6647' },

      // Cụm thông phía sau đài thành
      { x: -0.35, z: -0.42, scale: 0.28, color: '#1B452E' },
      { x: 0.35, z: -0.42, scale: 0.28, color: '#1B452E' },
    ];
  }, []);

  // 3. Danh sách các lá sen nổi trên mặt hào Kim Thủy
  const lotusPads = useMemo(() => {
    return [
      { x: -0.32, z: 0.32, r: 0.038 },
      { x: -0.22, z: 0.40, r: 0.046 },
      { x: -0.45, z: 0.36, r: 0.032 },
      { x: 0.32, z: 0.32, r: 0.038 },
      { x: 0.22, z: 0.40, r: 0.046 },
      { x: 0.45, z: 0.36, r: 0.032 },
      { x: 0.65, z: 0.28, r: 0.042 },
    ];
  }, []);

  return (
    <group
      ref={landmarkGroupRef}
      name="DANAVA_HUE_LANDMARK_MODULE"
      position={[placement.position[0], currentPosY, placement.position[2]]}
      rotation={placement.rotation}
      scale={currentScale}
      visible={!isHidden}
    >
      {/* =====================================================================
          1. SÂN GẠCH & THỀM ĐÁ HOÀNG THÀNH (COURTYARD & GROUNDS)
          Nền gạch Bát Tràng / đá thanh lát sân, bo tròn tiếp giáp mặt vé
          ===================================================================== */}
      <mesh
        position={[0, 0.021, -0.05]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow={receiveShadow}
      >
        <planeGeometry args={[1.95, 1.15]} />
        <meshStandardMaterial
          color={materials.stoneTerrace}
          roughness={0.88}
          metalness={0.04}
        />
      </mesh>

      {/* =====================================================================
          2. HÀO THÀNH HỒ NGOẠI KIM THỦY (KIM THUY MOAT)
          Mặt nước xanh ngọc sâu lắng phản chiếu bóng lầu Ngũ Phụng
          ===================================================================== */}
      <mesh
        geometry={moatGeometry}
        position={[0, 0.0215, 0]}
        receiveShadow={receiveShadow}
      >
        <meshStandardMaterial
          color={materials.moatWater}
          roughness={0.14}
          metalness={0.45}
          transparent
          opacity={0.90}
        />
      </mesh>

      {/* Các cụm lá sen nổi trên mặt hồ sen Kim Thủy */}
      {lotusPads.map((pad, idx) => (
        <group key={`lotus-${idx}`} position={[pad.x, 0.0222, pad.z]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[pad.r, 8]} />
            <meshStandardMaterial color={materials.lotusPads} roughness={0.7} />
          </mesh>
          {/* Nụ hoa sen hồng nhỏ nở e ấp */}
          {idx % 2 === 0 && (
            <mesh position={[0, 0.012, 0]}>
              <coneGeometry args={[0.012, 0.024, 5]} />
              <meshStandardMaterial color="#F48FB1" roughness={0.6} />
            </mesh>
          )}
        </group>
      ))}

      {/* =====================================================================
          3. ĐÀI CỔNG NGỌ MÔN & LẦU NGŨ PHỤNG (NGO MON GATE PROCEDURAL 3D MESH)
          ===================================================================== */}
      <NgoMonGate castShadow={castShadow} receiveShadow={receiveShadow} />

      {/* =====================================================================
          4. RỪNG THÔNG CỐ ĐÔ UY NGHIÊM (HUE IMPERIAL PINE TREES)
          Dáng thông dù cổ kính của các lăng tẩm & Hoàng thành Huế
          ===================================================================== */}
      <group ref={treesGroupRef}>
        {pineTreeList.map((p, idx) => (
          <group key={`pine-${idx}`} position={[p.x, 0.022, p.z]}>
            {/* Thân cây thông vỏ sần sùi */}
            <mesh position={[0, p.scale * 0.45, 0]} castShadow>
              <cylinderGeometry args={[0.012 * p.scale * 5, 0.016 * p.scale * 5, p.scale * 0.9, 6]} />
              <meshStandardMaterial color="#5D4037" roughness={0.92} />
            </mesh>
            {/* Tầng tán thông 1 (Tán hình dù kim) */}
            <mesh position={[0, p.scale * 0.85, 0]} castShadow>
              <sphereGeometry args={[p.scale * 0.55, 10, 8]} />
              <meshStandardMaterial color={p.color} roughness={0.82} />
            </mesh>
            {/* Tầng tán thông 2 */}
            <mesh position={[0, p.scale * 1.15, 0]} castShadow>
              <sphereGeometry args={[p.scale * 0.42, 10, 8]} />
              <meshStandardMaterial color={p.color} roughness={0.82} />
            </mesh>
            {/* Tầng đỉnh chóp */}
            <mesh position={[0, p.scale * 1.40, 0]} castShadow>
              <sphereGeometry args={[p.scale * 0.26, 10, 8]} />
              <meshStandardMaterial color={p.color} roughness={0.82} />
            </mesh>
          </group>
        ))}
      </group>

      {/* =====================================================================
          5. NÚI NGỰ BÌNH MỜ XA Ở HẬU CẢNH (NGU BINH MOUNTAIN SILHOUETTE)
          Dáng núi đỉnh bằng thoai thoải ("Tiền án" phong thủy Cố đô)
          ===================================================================== */}
      <group position={[0, .02, -1.35]}><ScenicRidge width={2.6} depth={1.1} height={.57} color="#91A393" /></group>

      {/* =====================================================================
          6. DEBUG SAFE ZONE & ANCHOR (CHỈ HIỂN THỊ KHI ?debug=1)
          ===================================================================== */}
      {isDebug && (
        <group>
          {/* Điểm neo nhãn (Label Anchor) quy về tọa độ cục bộ */}
          <mesh
            position={[
              (labelAnchor.worldPosition[0] - placement.position[0]) / placement.scale[0],
              labelAnchor.worldPosition[1] / placement.scale[1],
              (labelAnchor.worldPosition[2] - placement.position[2]) / placement.scale[2],
            ]}
          >
            <sphereGeometry args={[0.024, 12, 12]} />
            <meshBasicMaterial color="#FFB300" />
          </mesh>

          {/* Khung an toàn (Safe Zone Wireframe) */}
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
            <lineBasicMaterial color="#00E676" />
          </lineSegments>
        </group>
      )}
    </group>
  );
};
