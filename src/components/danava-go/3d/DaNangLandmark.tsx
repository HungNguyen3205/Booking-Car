import React, { useMemo } from 'react';
import * as THREE from 'three';
import { DA_NANG_DESTINATION } from './destinationConfig';
import { DragonBridge } from './DragonBridge';

import { useFrame } from '@react-three/fiber';
import type { TimelineProgress } from './journeyTimeline';

interface DaNangLandmarkProps {
  castShadow?: boolean;
  receiveShadow?: boolean;
  isDebug?: boolean;
  popProgress?: number;
  timelineRef?: React.RefObject<TimelineProgress | null>;
  slot?: 'origin' | 'destination';
}

/**
 * Sinh hình học mặt nước Sông Hàn uốn lượn tự nhiên
 * Không dùng hình chữ nhật thô cứng: hình học có biên cong hữu cơ,
 * đầu nguồn thon nhẹ, phình rộng ở hạ lưu ra vịnh Đà Nẵng.
 */
function createHanRiverGeometry(): THREE.BufferGeometry {
  const shape = new THREE.Shape();

  // Vẽ đa giác bờ cong hữu cơ cho lòng sông Hàn
  // Trục X cục bộ: -1.2 (bờ Tây) đến +1.1 (bờ Đông)
  // Trục Z cục bộ: -1.25 (thượng lưu) đến +0.45 (hạ lưu ra biển)

  // Bờ Tây (bên trái theo dòng chảy từ Bắc xuống Nam):
  shape.moveTo(-0.95, -1.25);
  shape.bezierCurveTo(-1.05, -0.75, -1.15, -0.25, -1.10, 0.05);
  shape.bezierCurveTo(-1.05, 0.25, -0.90, 0.38, -0.75, 0.45);

  // Mép cửa sông hạ lưu (uốn cong mềm mại):
  shape.bezierCurveTo(-0.25, 0.48, 0.45, 0.46, 0.85, 0.42);

  // Bờ Đông (bên phải):
  shape.bezierCurveTo(0.98, 0.20, 1.05, -0.15, 0.95, -0.45);
  shape.bezierCurveTo(0.85, -0.75, 0.75, -1.05, 0.55, -1.25);

  // Mép thượng lưu khép góc cong:
  shape.bezierCurveTo(0.15, -1.30, -0.55, -1.28, -0.95, -1.25);

  // Tạo mặt phẳng 2D nằm ngang trên mặt nước
  const geom = new THREE.ShapeGeometry(shape, 24);
  geom.rotateX(Math.PI / 2);
  geom.computeVertexNormals();
  return geom;
}

/**
 * Sinh hình học bờ kè đá bo tròn ôm theo viền sông Hàn
 */
function createEmbankmentShape(isWestBank: boolean): THREE.Shape {
  const shape = new THREE.Shape();
  if (isWestBank) {
    // Bờ Tây (Hải Châu)
    shape.moveTo(-1.22, -1.20);
    shape.bezierCurveTo(-1.32, -0.70, -1.38, -0.20, -1.32, 0.10);
    shape.bezierCurveTo(-1.25, 0.32, -1.05, 0.45, -0.85, 0.52);
    // Vòng lại mép trong tiếp giáp nước
    shape.lineTo(-0.75, 0.45);
    shape.bezierCurveTo(-0.90, 0.38, -1.05, 0.25, -1.10, 0.05);
    shape.bezierCurveTo(-1.15, -0.25, -1.05, -0.75, -0.95, -1.25);
    shape.closePath();
  } else {
    // Bờ Đông (Sơn Trà)
    shape.moveTo(0.55, -1.25);
    shape.bezierCurveTo(0.75, -1.05, 0.85, -0.75, 0.95, -0.45);
    shape.bezierCurveTo(1.05, -0.15, 0.98, 0.20, 0.85, 0.42);
    // Mép ngoài bờ kè
    shape.lineTo(0.98, 0.48);
    shape.bezierCurveTo(1.18, 0.24, 1.25, -0.12, 1.15, -0.48);
    shape.bezierCurveTo(1.05, -0.80, 0.92, -1.12, 0.70, -1.32);
    shape.closePath();
  }
  return shape;
}

export const DaNangLandmark: React.FC<DaNangLandmarkProps> = ({
  castShadow = true,
  receiveShadow = true,
  isDebug = false,
  popProgress = 1.0,
  timelineRef,
  slot = 'origin',
}) => {
  const { materials } = DA_NANG_DESTINATION.model;
  const { safeZone } = DA_NANG_DESTINATION;
  const placement = slot === 'destination' ? DA_NANG_DESTINATION.placements.destination : DA_NANG_DESTINATION.placements.origin;
  const labelAnchor = slot === 'destination' ? DA_NANG_DESTINATION.labelAnchor.destination : DA_NANG_DESTINATION.labelAnchor.origin;
  const landmarkGroupRef = React.useRef<THREE.Group>(null);
  const treesGroupRef = React.useRef<THREE.Group>(null);

  // Cập nhật hoạt cảnh nổi pop-up và lay động lá cây trong useFrame (zero React re-renders)
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (treesGroupRef.current) {
      treesGroupRef.current.rotation.z = Math.sin(t * 1.6) * 0.015;
    }

    if (landmarkGroupRef.current && timelineRef?.current) {
      const p = Math.max(
        0,
        slot === 'destination'
          ? timelineRef.current.huePopProgress
          : timelineRef.current.danangPopProgress
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

  // Cao độ Y nhô từ mặt vé lên (quãng đường ngắn 0.02 - 0.05 units)
  const currentPosY = placement.position[1] * Math.min(1.0, effectivePop);

  // 1. Hình học mặt sông Hàn
  const riverGeometry = useMemo(() => createHanRiverGeometry(), []);

  // 2. Hình học hai dải bờ kè đá ôm sông
  const { westEmbankmentGeom, eastEmbankmentGeom } = useMemo(() => {
    const westShape = createEmbankmentShape(true);
    const eastShape = createEmbankmentShape(false);

    const extrudeSettings = {
      depth: 0.012,
      bevelEnabled: true,
      bevelSegments: 1,
      steps: 1,
      bevelSize: 0.003,
      bevelThickness: 0.003,
    };

    const wGeom = new THREE.ExtrudeGeometry(westShape, extrudeSettings);
    wGeom.rotateX(Math.PI / 2);
    wGeom.computeVertexNormals();

    const eGeom = new THREE.ExtrudeGeometry(eastShape, extrudeSettings);
    eGeom.rotateX(Math.PI / 2);
    eGeom.computeVertexNormals();

    return { westEmbankmentGeom: wGeom, eastEmbankmentGeom: eGeom };
  }, []);


  // 4. Danh sách các cây xanh diorama đặt dọc bờ sông
  const treeList = useMemo(() => {
    return [
      // Cụm cây bờ Tây (phía đuôi rồng)
      { x: -1.16, z: -0.85, scale: 0.16, color: '#2D5A3D' },
      { x: -1.24, z: -0.55, scale: 0.20, color: '#3A6B4C' },
      { x: -1.18, z: -0.22, scale: 0.14, color: '#4E835E' },
      { x: -1.22, z: 0.18, scale: 0.18, color: '#3A6B4C' },
      { x: -0.92, z: 0.44, scale: 0.13, color: '#5B946E' },

      // Cụm cây bờ Đông (chân cầu phía đầu rồng)
      { x: 0.88, z: -0.80, scale: 0.15, color: '#3A6B4C' },
      { x: 1.08, z: -0.42, scale: 0.22, color: '#2D5A3D' },
      { x: 1.02, z: -0.05, scale: 0.17, color: '#4E835E' },
      { x: 0.95, z: 0.28, scale: 0.16, color: '#3A6B4C' },

      // Bụi cây chân núi Sơn Trà
      { x: -0.42, z: -1.35, scale: 0.24, color: '#2D5A3D' },
      { x: -0.15, z: -1.40, scale: 0.28, color: '#3A6B4C' },
      { x: 0.20, z: -1.38, scale: 0.22, color: '#2D5A3D' },
    ];
  }, []);

  return (
    <group
      ref={landmarkGroupRef}
      name="DANAVA_DANANG_LANDMARK_MODULE"
      position={[placement.position[0], currentPosY, placement.position[2]]}
      rotation={placement.rotation}
      scale={currentScale}
      visible={!isHidden}
    >
      {/* =====================================================================
          1. MẶT NƯỚC SÔNG HÀN (HAN RIVER WATER SURFACE)
          Màu xanh ngọc, độ phản xạ cao để bắt sáng Key Light tự nhiên.
          Cao độ Y = 0.021 (ngay trên mặt vé 0.016, khớp nối phẳng êm dịu).
          ===================================================================== */}
      <mesh
        geometry={riverGeometry}
        position={[0, 0.021, 0]}
        receiveShadow={receiveShadow}
      >
        <meshStandardMaterial
          color="#1E7B98"
          roughness={0.12}
          metalness={0.48}
          transparent
          opacity={0.92}
        />
      </mesh>

      {/* Dải bóng sáng phản chiếu mờ ảo trên mặt nước */}
      <mesh
        position={[-0.05, 0.0212, -0.10]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[1.2, 0.4]} />
        <meshBasicMaterial
          color="#E0F7FA"
          transparent
          opacity={0.16}
          depthWrite={false}
        />
      </mesh>

      {/* =====================================================================
          2. BỜ KÈ ĐÁ & ĐƯỜNG DẠO BỘ (STONE EMBANKMENTS & PROMENADE)
          Màu ngà ấm hòa sắc tự nhiên cùng màu vé giấy ivory, không viền cứng.
          ===================================================================== */}
      <mesh
        geometry={westEmbankmentGeom}
        position={[0, 0.021, 0]}
        castShadow={castShadow}
        receiveShadow={receiveShadow}
      >
        <meshStandardMaterial
          color={materials.embankment}
          roughness={0.85}
          metalness={0.06}
        />
      </mesh>

      <mesh
        geometry={eastEmbankmentGeom}
        position={[0, 0.021, 0]}
        castShadow={castShadow}
        receiveShadow={receiveShadow}
      >
        <meshStandardMaterial
          color={materials.embankment}
          roughness={0.85}
          metalness={0.06}
        />
      </mesh>

      {/* =====================================================================
          3. CẦU RỒNG ĐÀ NẴNG (DRAGON BRIDGE PROCEDURAL 3D MESH)
          Bắc ngang qua sông Hàn từ bờ Tây (X=-0.95) sang bờ Đông (X=+0.92)
          ===================================================================== */}
      <group position={[0, 0, 0]}>
        <DragonBridge castShadow={castShadow} receiveShadow={receiveShadow} />
      </group>

      {/* =====================================================================
          4. CỤM CÂY DIORAMA VEN SÔNG (RIVERSIDE DIORAMA TREES)
          Tán cây hình nón/cầu tròn ấm áp, phong cách thủ công tinh tế.
          ===================================================================== */}
      <group ref={treesGroupRef}>
        {treeList.map((t, idx) => (
          <group key={`tree-${idx}`} position={[t.x, 0.022, t.z]}>
            {/* Thân cây gỗ mảnh */}
            <mesh position={[0, t.scale * 0.35, 0]} castShadow>
              <cylinderGeometry args={[0.008 * t.scale * 5, 0.012 * t.scale * 5, t.scale * 0.7, 6]} />
              <meshStandardMaterial color="#6B5344" roughness={0.9} />
            </mesh>
            {/* Tầng tán lá dưới */}
            <mesh position={[0, t.scale * 0.75, 0]} castShadow>
              <coneGeometry args={[t.scale * 0.45, t.scale * 0.65, 7]} />
              <meshStandardMaterial color={t.color} roughness={0.78} />
            </mesh>
            {/* Tầng tán lá trên */}
            <mesh position={[0, t.scale * 1.05, 0]} castShadow>
              <coneGeometry args={[t.scale * 0.32, t.scale * 0.55, 7]} />
              <meshStandardMaterial color={t.color} roughness={0.78} />
            </mesh>
          </group>
        ))}
      </group>

      {/* =====================================================================
          5. NÚI XA VỪA ĐỦ: BÁN ĐẢO SƠN TRÀ (SƠN TRÀ PENINSULA RIDGE)
          Dãy núi thoai thoải phía sau vịnh, mờ dần vào sương khí quyển.
          ===================================================================== */}
      <group position={[-0.15, 0.02, -1.45]}>
        {/* Đỉnh núi chính Sơn Trà */}
        <mesh position={[0.25, 0.28, 0]} scale={[1.6, 1.0, 1.0]} castShadow>
          <coneGeometry args={[0.60, 0.68, 12]} />
          <meshStandardMaterial
            color="#4A6B5B"
            roughness={0.92}
            transparent
            opacity={0.88}
          />
        </mesh>
        {/* Đỉnh núi thứ 2 thấp hơn */}
        <mesh position={[-0.45, 0.20, 0.1]} scale={[1.3, 0.75, 0.9]} castShadow>
          <coneGeometry args={[0.48, 0.54, 10]} />
          <meshStandardMaterial
            color="#3B5B4C"
            roughness={0.92}
            transparent
            opacity={0.82}
          />
        </mesh>
        {/* Đỉnh núi thứ 3 thoai thoải ra biển */}
        <mesh position={[0.95, 0.16, -0.1]} scale={[1.2, 0.65, 0.8]}>
          <coneGeometry args={[0.42, 0.46, 10]} />
          <meshStandardMaterial
            color="#5C7A6D"
            roughness={0.92}
            transparent
            opacity={0.78}
          />
        </mesh>
      </group>

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
            <meshBasicMaterial color="#00E5FF" />
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
