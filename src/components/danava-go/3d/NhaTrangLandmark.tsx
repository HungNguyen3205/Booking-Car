import React, { useMemo } from 'react';
import * as THREE from 'three';
import { NHA_TRANG_DESTINATION } from './destinationConfig';
import { useFrame } from '@react-three/fiber';
import type { TimelineProgress } from './journeyTimeline';

interface NhaTrangLandmarkProps {
  castShadow?: boolean;
  receiveShadow?: boolean;
  isDebug?: boolean;
  popProgress?: number;
  timelineRef?: React.RefObject<TimelineProgress | null>;
  slot?: 'origin' | 'destination';
}

/**
 * Sinh hình học bãi cát biển Nha Trang cong hữu cơ mềm mại
 */
function createBeachSandGeometry(): THREE.BufferGeometry {
  const shape = new THREE.Shape();

  // Bờ cát biển vịnh Nha Trang (tọa độ cục bộ)
  shape.moveTo(-0.95, -1.10);
  shape.bezierCurveTo(-1.10, -0.60, -1.15, -0.10, -1.05, 0.25);
  shape.bezierCurveTo(-0.95, 0.45, -0.70, 0.52, -0.40, 0.55);
  shape.bezierCurveTo(0.10, 0.58, 0.65, 0.52, 0.95, 0.35);
  shape.bezierCurveTo(1.15, 0.15, 1.20, -0.25, 1.10, -0.65);
  shape.bezierCurveTo(1.00, -0.95, 0.70, -1.15, 0.30, -1.20);
  shape.bezierCurveTo(-0.20, -1.22, -0.70, -1.18, -0.95, -1.10);

  const geom = new THREE.ShapeGeometry(shape, 24);
  geom.rotateX(Math.PI / 2);
  geom.computeVertexNormals();
  return geom;
}

/**
 * Sinh hình học dải nước biển ngọc bích viền bờ cát
 */
function createSeaWaterGeometry(): THREE.BufferGeometry {
  const shape = new THREE.Shape();

  // Dải nước biển cong hữu cơ ở rìa bãi cát
  shape.moveTo(-1.00, -1.20);
  shape.bezierCurveTo(-1.25, -0.60, -1.30, 0.05, -1.15, 0.40);
  shape.bezierCurveTo(-0.95, 0.65, -0.50, 0.72, -0.10, 0.74);
  shape.bezierCurveTo(0.40, 0.75, 0.90, 0.65, 1.20, 0.45);
  shape.bezierCurveTo(1.35, 0.20, 1.40, -0.30, 1.25, -0.80);
  shape.bezierCurveTo(1.10, -1.15, 0.65, -1.32, 0.15, -1.35);
  shape.bezierCurveTo(-0.35, -1.36, -0.80, -1.30, -1.00, -1.20);

  const geom = new THREE.ShapeGeometry(shape, 24);
  geom.rotateX(Math.PI / 2);
  geom.computeVertexNormals();
  return geom;
}

/**
 * Dựng một cây dừa nhiệt đới duyên hải Nha Trang uốn cong tự nhiên
 */
const CoastalPalmTree: React.FC<{
  position: [number, number, number];
  rotationY?: number;
  scale?: number;
  tiltAngle?: number;
  castShadow?: boolean;
}> = ({
  position,
  rotationY = 0,
  scale = 1.0,
  tiltAngle = 0.22,
  castShadow = true,
}) => {
  const trunkCurve = useMemo(() => {
    return new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0.04, 0.15, 0.02),
      new THREE.Vector3(0.10, 0.32, 0.05),
      new THREE.Vector3(0.14, 0.48, 0.08),
    ]);
  }, []);

  const trunkGeom = useMemo(() => {
    return new THREE.TubeGeometry(trunkCurve, 12, 0.022, 8, false);
  }, [trunkCurve]);

  return (
    <group position={position} rotation={[0, rotationY, tiltAngle]} scale={scale}>
      {/* Thân dừa uốn lượn có đốt */}
      <mesh geometry={trunkGeom} castShadow={castShadow}>
        <meshStandardMaterial
          color="#6D4C41"
          roughness={0.88}
          metalness={0.05}
        />
      </mesh>

      {/* Cụm 6 tàu lá dừa xòe cong mềm mại */}
      <group position={[0.14, 0.48, 0.08]}>
        {Array.from({ length: 6 }).map((_, i) => {
          const angle = (i * Math.PI * 2) / 6;
          return (
            <group key={i} rotation={[0, angle, 0]}>
              <mesh
                position={[0.12, -0.04, 0]}
                rotation={[0, 0, -0.38]}
                castShadow={castShadow}
              >
                <boxGeometry args={[0.24, 0.006, 0.055]} />
                <meshStandardMaterial
                  color="#2E7D32"
                  roughness={0.70}
                  metalness={0.08}
                />
              </mesh>
            </group>
          );
        })}
        {/* Đọt dừa non ở tâm */}
        <mesh position={[0, 0.03, 0]}>
          <coneGeometry args={[0.02, 0.08, 6]} />
          <meshStandardMaterial color="#4CAF50" roughness={0.65} />
        </mesh>
      </group>
    </group>
  );
};

/**
 * Dựng Tháp Trầm Hương procedural hình búp sen 3 tầng
 */
const AgarwoodTowerStructure: React.FC<{
  castShadow?: boolean;
}> = ({ castShadow = true }) => {
  const { materials } = NHA_TRANG_DESTINATION.model;

  return (
    <group name="AGARWOOD_TOWER_3D">
      {/* ===================================================================
          1. BỆ SEN ĐÁ MÀI GRANITE & BẬC TAM CẤP QUẢNG TRƯỜNG 2/4
          =================================================================== */}
      {/* Bậc cấp tròn 1 (dưới cùng) */}
      <mesh position={[0, 0.012, 0]} receiveShadow>
        <cylinderGeometry args={[0.34, 0.36, 0.024, 28]} />
        <meshStandardMaterial color={materials.granitePedestal} roughness={0.78} />
      </mesh>
      {/* Bậc cấp tròn 2 (giữa) */}
      <mesh position={[0, 0.032, 0]} receiveShadow>
        <cylinderGeometry args={[0.28, 0.30, 0.022, 24]} />
        <meshStandardMaterial color="#E8E4DB" roughness={0.75} />
      </mesh>
      {/* Đài bệ sen 5 cánh tròn */}
      <mesh position={[0, 0.052, 0]} castShadow={castShadow} receiveShadow>
        <cylinderGeometry args={[0.22, 0.24, 0.024, 20]} />
        <meshStandardMaterial color={materials.granitePedestal} roughness={0.72} />
      </mesh>

      {/* ===================================================================
          2. THÂN THÁP BÚP SEN TẦNG 1 (CÁNH SEN NGOÀI XÒE MỞ)
          =================================================================== */}
      {Array.from({ length: 6 }).map((_, i) => {
        const angle = (i * Math.PI * 2) / 6;
        return (
          <group key={`outer-${i}`} rotation={[0, angle, 0]}>
            <mesh
              position={[0.13, 0.17, 0]}
              rotation={[0, 0, -0.18]}
              castShadow={castShadow}
            >
              <cylinderGeometry args={[0.025, 0.048, 0.24, 8, 1, true]} />
              <meshStandardMaterial
                color={materials.towerDeepOrange}
                roughness={0.42}
                metalness={0.15}
                side={THREE.DoubleSide}
              />
            </mesh>
          </group>
        );
      })}

      {/* Lõi thân tháp tròn trung tâm */}
      <mesh position={[0, 0.22, 0]} castShadow={castShadow}>
        <cylinderGeometry args={[0.10, 0.13, 0.32, 18]} />
        <meshStandardMaterial
          color={materials.towerCoralPetal}
          roughness={0.40}
          metalness={0.12}
        />
      </mesh>

      {/* ===================================================================
          3. THÂN THÁP BÚP SEN TẦNG 2 (CÁNH VƯƠN CAO THON KHÍ ĐỘNG HỌC)
          =================================================================== */}
      {Array.from({ length: 6 }).map((_, i) => {
        const angle = ((i + 0.5) * Math.PI * 2) / 6;
        return (
          <group key={`mid-${i}`} rotation={[0, angle, 0]}>
            <mesh
              position={[0.095, 0.36, 0]}
              rotation={[0, 0, -0.09]}
              castShadow={castShadow}
            >
              <cylinderGeometry args={[0.018, 0.038, 0.28, 8, 1, true]} />
              <meshStandardMaterial
                color={materials.towerCoralPetal}
                roughness={0.38}
                metalness={0.18}
                side={THREE.DoubleSide}
              />
            </mesh>
          </group>
        );
      })}

      {/* Kính lấy sáng lam ngọc viền theo khe tháp */}
      <mesh position={[0, 0.36, 0]}>
        <cylinderGeometry args={[0.075, 0.092, 0.26, 16]} />
        <meshStandardMaterial
          color={materials.towerGlassCyan}
          roughness={0.15}
          metalness={0.75}
          transparent
          opacity={0.88}
        />
      </mesh>

      {/* ===================================================================
          4. ĐÀI BÚP SEN TẦNG 3 & NGỌN BÚT TRẦM HƯƠNG TỎA SÁNG
          =================================================================== */}
      {/* Búp sen nhọn vuốt vào lõi */}
      <mesh position={[0, 0.52, 0]} castShadow={castShadow}>
        <coneGeometry args={[0.072, 0.22, 14]} />
        <meshStandardMaterial
          color={materials.towerAmberGlow}
          roughness={0.35}
          metalness={0.25}
        />
      </mesh>

      {/* Chóp nhọn ngọn bút tháp ngọc trầm hương */}
      <mesh position={[0, 0.65, 0]} castShadow={castShadow}>
        <coneGeometry args={[0.032, 0.16, 12]} />
        <meshStandardMaterial
          color={materials.towerPinnacle}
          roughness={0.20}
          metalness={0.50}
        />
      </mesh>

      {/* Viên ngọc tỏa sáng trên đỉnh tháp */}
      <mesh position={[0, 0.74, 0]}>
        <sphereGeometry args={[0.016, 12, 12]} />
        <meshStandardMaterial
          color="#FFF9C4"
          roughness={0.10}
          metalness={0.85}
          emissive="#FFD54F"
          emissiveIntensity={0.65}
        />
      </mesh>
    </group>
  );
};

/**
 * NhaTrangLandmark: Cụm cảnh quan 3D Tháp Trầm Hương & Vịnh Biển Nha Trang
 * Chuẩn hóa 100% cùng camera, ánh sáng, đơn vị và timeline mở vé
 */
export const NhaTrangLandmark: React.FC<NhaTrangLandmarkProps> = ({
  castShadow = true,
  receiveShadow = true,
  isDebug = false,
  popProgress = 1.0,
  timelineRef,
  slot = 'destination',
}) => {
  const rootGroupRef = React.useRef<THREE.Group>(null);

  const { placements, safeZone, labelAnchor, model } = NHA_TRANG_DESTINATION;
  const placement = slot === 'origin' ? placements.origin : placements.destination;
  const currentAnchor = slot === 'origin' ? labelAnchor.origin : labelAnchor.destination;

  // Geometry cached
  const beachSandGeom = useMemo(() => createBeachSandGeometry(), []);
  const seaWaterGeom = useMemo(() => createSeaWaterGeometry(), []);

  // Sync animation with master timeline
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
      name={`DANAVA_NHA_TRANG_LANDMARK_${slot.toUpperCase()}`}
      position={[placement.position[0], placement.position[1], placement.position[2]]}
      rotation={[placement.rotation[0], placement.rotation[1], placement.rotation[2]]}
      scale={initialScale}
      visible={!isHidden}
    >
      {/* 1. MẶT NƯỚC BIỂN XANH NGỌC BÍCH VỊNH NHA TRANG */}
      <mesh
        geometry={seaWaterGeom}
        position={[0, 0.002, 0]}
        receiveShadow={receiveShadow}
      >
        <meshStandardMaterial
          color={model.materials.seaWater}
          roughness={0.12}
          metalness={0.35}
          transparent
          opacity={0.88}
        />
      </mesh>

      {/* Viền sóng bọt trắng dạt bờ cát */}
      <mesh position={[-0.15, 0.004, 0.10]} rotation={[-Math.PI / 2, 0, 0.35]}>
        <ringGeometry args={[0.55, 0.58, 20]} />
        <meshBasicMaterial
          color={model.materials.surfFoam}
          transparent
          opacity={0.65}
        />
      </mesh>

      {/* 2. BÃI CÁT VÀNG MỊN TRẦN PHÚ */}
      <mesh
        geometry={beachSandGeom}
        position={[0, 0.006, 0]}
        receiveShadow={receiveShadow}
      >
        <meshStandardMaterial
          color={model.materials.beachSand}
          roughness={0.85}
          metalness={0.02}
        />
      </mesh>

      {/* 3. MÔ HÌNH THÁP TRẦM HƯƠNG BIỂU TƯỢNG */}
      <group position={[0.05, 0.008, -0.05]}>
        <AgarwoodTowerStructure castShadow={castShadow} />
      </group>

      {/* 4. HÀNG DỪA DUYÊN HẢI NHIỆT ĐỚI */}
      <CoastalPalmTree
        position={[-0.42, 0.008, 0.18]}
        rotationY={0.65}
        scale={0.92}
        tiltAngle={0.24}
        castShadow={castShadow}
      />
      <CoastalPalmTree
        position={[-0.24, 0.008, -0.38]}
        rotationY={-0.45}
        scale={0.78}
        tiltAngle={0.18}
        castShadow={castShadow}
      />

      {/* 5. CỤM ĐÁ GRANITE HÒN CHỒNG TỰ NHIÊN */}
      <group position={[0.48, 0.010, 0.22]}>
        <mesh position={[0, 0.025, 0]} scale={[1.2, 0.7, 0.9]}>
          <dodecahedronGeometry args={[0.045, 0]} />
          <meshStandardMaterial color="#90A4AE" roughness={0.85} />
        </mesh>
        <mesh position={[0.05, 0.018, -0.03]} scale={[0.9, 0.6, 0.8]}>
          <dodecahedronGeometry args={[0.035, 0]} />
          <meshStandardMaterial color="#78909C" roughness={0.88} />
        </mesh>
      </group>

      {/* 6. SILHOUETTE RẶNG NÚI CÔ TIÊN MỜ XA HẬU CẢNH */}
      <group position={[-0.10, 0.005, -0.85]}>
        <mesh position={[-0.45, 0.18, 0]} scale={[1.4, 0.75, 0.8]}>
          <coneGeometry args={[0.48, 0.50, 8]} />
          <meshStandardMaterial
            color={model.materials.coastalMountains}
            roughness={0.92}
            transparent
            opacity={0.80}
          />
        </mesh>
        <mesh position={[0.35, 0.22, -0.1]} scale={[1.5, 0.85, 0.9]}>
          <coneGeometry args={[0.55, 0.55, 8]} />
          <meshStandardMaterial
            color="#3E5E50"
            roughness={0.92}
            transparent
            opacity={0.75}
          />
        </mesh>
      </group>

      {/* 7. DEBUG SAFE ZONE & LABEL ANCHOR (CHỈ KHI ?debug=1) */}
      {isDebug && (
        <group>
          {/* Điểm neo nhãn cục bộ */}
          <mesh
            position={[
              (currentAnchor.worldPosition[0] - placement.position[0]) / placement.scale[0],
              currentAnchor.worldPosition[1] / placement.scale[1],
              (currentAnchor.worldPosition[2] - placement.position[2]) / placement.scale[2],
            ]}
          >
            <sphereGeometry args={[0.024, 12, 12]} />
            <meshBasicMaterial color="#FF9100" />
          </mesh>

          {/* Khung safe zone wireframe */}
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
            <lineBasicMaterial color="#FFB74D" />
          </lineSegments>
        </group>
      )}
    </group>
  );
};
