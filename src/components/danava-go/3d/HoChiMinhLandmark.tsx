import React, { useMemo } from 'react';
import * as THREE from 'three';
import { HO_CHI_MINH_DESTINATION } from './destinationConfig';
import { useFrame } from '@react-three/fiber';
import type { TimelineProgress } from './journeyTimeline';

interface HoChiMinhLandmarkProps {
  castShadow?: boolean;
  receiveShadow?: boolean;
  isDebug?: boolean;
  popProgress?: number;
  timelineRef?: React.RefObject<TimelineProgress | null>;
  slot?: 'origin' | 'destination';
}

/**
 * Sinh hình học dòng sông Sài Gòn uốn lượn mềm mại ôm lấy bờ Bến Bạch Đằng
 */
function createSaigonRiverGeometry(): THREE.BufferGeometry {
  const shape = new THREE.Shape();

  // Dải uốn cong của sông Sài Gòn (tọa độ cục bộ)
  shape.moveTo(-0.95, -1.05);
  shape.bezierCurveTo(-1.20, -0.55, -1.25, 0.05, -1.10, 0.38);
  shape.bezierCurveTo(-0.90, 0.65, -0.45, 0.72, -0.05, 0.70);
  shape.bezierCurveTo(0.45, 0.68, 0.95, 0.52, 1.25, 0.32);
  shape.bezierCurveTo(1.40, 0.10, 1.42, -0.35, 1.25, -0.75);
  shape.bezierCurveTo(1.05, -1.10, 0.60, -1.28, 0.10, -1.30);
  shape.bezierCurveTo(-0.40, -1.32, -0.80, -1.20, -0.95, -1.05);

  const geom = new THREE.ShapeGeometry(shape, 24);
  geom.rotateX(Math.PI / 2);
  geom.computeVertexNormals();
  return geom;
}

/**
 * Sinh hình học thềm đá granite bến Bạch Đằng và dải công viên ven sông
 */
function createBachDangWharfGeometry(): THREE.BufferGeometry {
  const shape = new THREE.Shape();

  // Dải bờ kè công viên bến Bạch Đằng ôm sát lòng sông
  shape.moveTo(-0.85, -0.95);
  shape.bezierCurveTo(-1.05, -0.50, -1.10, 0.00, -0.98, 0.30);
  shape.bezierCurveTo(-0.80, 0.52, -0.40, 0.58, -0.08, 0.56);
  shape.bezierCurveTo(0.38, 0.54, 0.80, 0.42, 1.05, 0.24);
  shape.bezierCurveTo(1.18, 0.05, 1.20, -0.30, 1.05, -0.65);
  shape.bezierCurveTo(0.90, -0.92, 0.50, -1.10, 0.08, -1.12);
  shape.bezierCurveTo(-0.35, -1.14, -0.72, -1.05, -0.85, -0.95);

  const geom = new THREE.ShapeGeometry(shape, 24);
  geom.rotateX(Math.PI / 2);
  geom.computeVertexNormals();
  return geom;
}

/**
 * Mô hình thuyền buýt sông Saigon Waterbus màu vàng cam rực rỡ
 */
const SaigonWaterbus: React.FC<{
  position: [number, number, number];
  rotationY?: number;
  scale?: number;
  castShadow?: boolean;
}> = ({ position, rotationY = 0, scale = 1.0, castShadow = true }) => {
  return (
    <group position={position} rotation={[0, rotationY, 0]} scale={scale}>
      {/* Thân tàu ca nô hai thân vàng cam rực rỡ */}
      <mesh position={[0, 0.012, 0]} castShadow={castShadow}>
        <boxGeometry args={[0.18, 0.024, 0.07]} />
        <meshStandardMaterial color="#FFA000" roughness={0.35} metalness={0.2} />
      </mesh>
      {/* Mũi tàu vát nhọn lướt sóng */}
      <mesh position={[0.10, 0.012, 0]} rotation={[0, 0, -Math.PI / 6]} castShadow={castShadow}>
        <boxGeometry args={[0.04, 0.024, 0.065]} />
        <meshStandardMaterial color="#FFA000" roughness={0.35} metalness={0.2} />
      </mesh>
      {/* Khoang hành khách kính và mui trắng */}
      <mesh position={[-0.01, 0.028, 0]} castShadow={castShadow}>
        <boxGeometry args={[0.13, 0.018, 0.058]} />
        <meshStandardMaterial color="#FFFFFF" roughness={0.4} metalness={0.1} />
      </mesh>
      {/* Dải kính cabin lam trong suốt */}
      <mesh position={[-0.01, 0.028, 0]}>
        <boxGeometry args={[0.132, 0.009, 0.060]} />
        <meshStandardMaterial color="#0288D1" roughness={0.15} metalness={0.8} />
      </mesh>
      {/* Gợn sóng bọt trắng quanh mạn thuyền */}
      <mesh position={[0, 0.002, 0]}>
        <ringGeometry args={[0.07, 0.12, 16]} />
        <meshBasicMaterial color="#E0F7FA" transparent opacity={0.65} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
};

/**
 * Cụm cây xanh rợp bóng công viên Bến Bạch Đằng
 */
const ParkTreeCluster: React.FC<{
  position: [number, number, number];
  scale?: number;
  castShadow?: boolean;
}> = ({ position, scale = 1.0, castShadow = true }) => {
  return (
    <group position={position} scale={scale}>
      {/* Cây 1: Tán tròn cao */}
      <mesh position={[0, 0.04, 0]} castShadow={castShadow}>
        <sphereGeometry args={[0.038, 8, 8]} />
        <meshStandardMaterial color="#2E7D32" roughness={0.85} />
      </mesh>
      {/* Cây 2: Tán cạnh bên */}
      <mesh position={[0.045, 0.032, 0.02]} castShadow={castShadow}>
        <sphereGeometry args={[0.028, 8, 8]} />
        <meshStandardMaterial color="#388E3C" roughness={0.85} />
      </mesh>
      {/* Cây 3: Tán thấp xanh tươi */}
      <mesh position={[-0.035, 0.026, -0.02]} castShadow={castShadow}>
        <sphereGeometry args={[0.024, 8, 8]} />
        <meshStandardMaterial color="#43A047" roughness={0.85} />
      </mesh>
    </group>
  );
};

/**
 * Tòa tháp Bitexco Financial Tower với dáng búp sen và sân đỗ trực thăng chìa ra ở tầng 52
 */
const BitexcoTower: React.FC<{
  position: [number, number, number];
  scale?: number;
  castShadow?: boolean;
}> = ({ position, scale = 1.0, castShadow = true }) => {
  return (
    <group position={position} scale={scale}>
      {/* Khối đế và thân tháp thon vát cong hình búp sen */}
      <mesh position={[0, 0.28, 0]} castShadow={castShadow}>
        <cylinderGeometry args={[0.062, 0.095, 0.56, 16]} />
        <meshStandardMaterial
          color="#78909C"
          roughness={0.25}
          metalness={0.65}
        />
      </mesh>

      {/* Vát chóp chéo 30 độ đặc trưng của tháp Bitexco */}
      <mesh position={[0, 0.56, 0]} rotation={[0, 0, 0.35]} castShadow={castShadow}>
        <cylinderGeometry args={[0.042, 0.062, 0.07, 16]} />
        <meshStandardMaterial
          color="#90A4AE"
          roughness={0.20}
          metalness={0.75}
        />
      </mesh>

      {/* Dải kính phản chiếu bầu trời chạy dọc thân tháp */}
      <mesh position={[0, 0.28, 0]}>
        <cylinderGeometry args={[0.064, 0.097, 0.54, 8, 1, true, 0, Math.PI * 0.8]} />
        <meshStandardMaterial
          color="#26C6DA"
          roughness={0.15}
          metalness={0.85}
          transparent
          opacity={0.85}
        />
      </mesh>

      {/* Sân đỗ trực thăng Helipad tầng 52 dạng đĩa tròn cantiliver chìa ra ngoài */}
      <group position={[0.072, 0.38, 0.01]}>
        {/* Đĩa tròn sân đỗ */}
        <mesh rotation={[0, 0, 0]} castShadow={castShadow}>
          <cylinderGeometry args={[0.048, 0.048, 0.008, 16]} />
          <meshStandardMaterial color="#B0BEC5" roughness={0.4} metalness={0.5} />
        </mesh>
        {/* Vòng tròn hạ cánh viền cam / trắng */}
        <mesh position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.024, 0.038, 16]} />
          <meshBasicMaterial color="#FF7043" side={THREE.DoubleSide} />
        </mesh>
        {/* Kèo chống chịu lực vát chéo vào thân tháp */}
        <mesh position={[-0.035, -0.025, 0]} rotation={[0, 0, -0.6]}>
          <boxGeometry args={[0.06, 0.006, 0.015]} />
          <meshStandardMaterial color="#546E7A" roughness={0.5} metalness={0.6} />
        </mesh>
      </group>
    </group>
  );
};

/**
 * TÒA THÁP LANDMARK 81: Kiến trúc bó tre 9 khối lăng trụ bậc thang 3 tầng vươn cao
 */
const Landmark81Tower: React.FC<{
  position: [number, number, number];
  scale?: number;
  castShadow?: boolean;
}> = ({ position, scale = 1.0, castShadow = true }) => {
  // Khoảng cách ô lăng trụ bó tre: d = 0.068
  const d = 0.068;
  const colSize = 0.062;

  // 9 tọa độ của lưới 3x3
  const gridCoords = useMemo(() => {
    const coords: [number, number][] = [];
    for (let gx = -1; gx <= 1; gx++) {
      for (let gz = -1; gz <= 1; gz++) {
        coords.push([gx * d, gz * d]);
      }
    }
    return coords;
  }, [d]);

  return (
    <group position={position} scale={scale}>
      {/* TẦNG 1 (BASE TIER): 9 lăng trụ vuông xếp cạnh nhau (cao 0.32) */}
      {gridCoords.map(([cx, cz], i) => (
        <group key={`base-${i}`} position={[cx, 0.16, cz]}>
          <mesh castShadow={castShadow}>
            <boxGeometry args={[colSize, 0.32, colSize]} />
            <meshStandardMaterial
              color="#90CAF9"
              roughness={0.18}
              metalness={0.82}
            />
          </mesh>
          {/* Gờ viền nhôm kiến trúc kim cương trên đỉnh bậc */}
          <mesh position={[0, 0.161, 0]}>
            <boxGeometry args={[colSize + 0.004, 0.004, colSize + 0.004]} />
            <meshStandardMaterial color="#ECEFF1" roughness={0.3} metalness={0.9} />
          </mesh>
        </group>
      ))}

      {/* TẦNG 2 (MID TIER): 5 lăng trụ hình chữ thập vươn lên cao hơn (cao 0.28, từ y=0.32 lên y=0.60) */}
      {[
        [0, 0],
        [d, 0],
        [-d, 0],
        [0, d],
        [0, -d],
      ].map(([cx, cz], i) => (
        <group key={`mid-${i}`} position={[cx, 0.32 + 0.14, cz]}>
          <mesh castShadow={castShadow}>
            <boxGeometry args={[colSize, 0.28, colSize]} />
            <meshStandardMaterial
              color="#42A5F5"
              roughness={0.16}
              metalness={0.85}
            />
          </mesh>
          {/* Gờ viền nhôm nóc bậc */}
          <mesh position={[0, 0.141, 0]}>
            <boxGeometry args={[colSize + 0.004, 0.004, colSize + 0.004]} />
            <meshStandardMaterial color="#ECEFF1" roughness={0.3} metalness={0.9} />
          </mesh>
        </group>
      ))}

      {/* TẦNG 3 (TOP TIER): 1 lăng trụ trung tâm vươn cao nhất (cao 0.26, từ y=0.60 lên y=0.86) */}
      <group position={[0, 0.60 + 0.13, 0]}>
        <mesh castShadow={castShadow}>
          <boxGeometry args={[colSize, 0.26, colSize]} />
          <meshStandardMaterial
            color="#1E88E5"
            roughness={0.14}
            metalness={0.88}
          />
        </mesh>
        {/* Nóc tháp trung tâm */}
        <mesh position={[0, 0.131, 0]}>
          <boxGeometry args={[colSize + 0.004, 0.004, colSize + 0.004]} />
          <meshStandardMaterial color="#ECEFF1" roughness={0.25} metalness={0.9} />
        </mesh>
      </group>

      {/* KIM THÁP SPIRE & ANTEN: Vươn từ y=0.86 lên y=1.05 */}
      <group position={[0, 0.86, 0]}>
        {/* Chân đế kim tháp */}
        <mesh position={[0, 0.02, 0]} castShadow={castShadow}>
          <cylinderGeometry args={[0.012, 0.022, 0.04, 12]} />
          <meshStandardMaterial color="#ECEFF1" roughness={0.25} metalness={0.9} />
        </mesh>
        {/* Thân kim tháp vươn nhọn */}
        <mesh position={[0, 0.09, 0]} castShadow={castShadow}>
          <cylinderGeometry args={[0.003, 0.012, 0.14, 12]} />
          <meshStandardMaterial color="#FFF9C4" roughness={0.2} metalness={0.95} />
        </mesh>
        {/* Đỉnh chóp anten lấp lánh */}
        <mesh position={[0, 0.165, 0]}>
          <sphereGeometry args={[0.006, 8, 8]} />
          <meshBasicMaterial color="#FFFFFF" />
        </mesh>
      </group>
    </group>
  );
};

/**
 * Component HoChiMinhLandmark chính thức (BƯỚC 11)
 */
export const HoChiMinhLandmark: React.FC<HoChiMinhLandmarkProps> = ({
  castShadow = true,
  receiveShadow = true,
  isDebug = false,
  popProgress,
  timelineRef,
  slot = 'destination',
}) => {
  const groupRef = React.useRef<THREE.Group>(null);
  const riverGeom = useMemo(() => createSaigonRiverGeometry(), []);
  const wharfGeom = useMemo(() => createBachDangWharfGeometry(), []);

  // Cấu hình từ destinationConfig duy nhất
  const { model, placements, labelAnchor, safeZone } = HO_CHI_MINH_DESTINATION;
  const placement = placements[slot];
  const currentAnchor = labelAnchor[slot];

  // Đồng bộ tiến trình timeline tập trung
  useFrame(() => {
    if (!groupRef.current) return;

    let p = 1.0;
    if (timelineRef?.current) {
      // Đọc tiến trình tương ứng với slot trong TimelineProgress
      p = slot === 'origin' ? timelineRef.current.danangPopProgress : timelineRef.current.huePopProgress;
    } else if (popProgress !== undefined) {
      p = popProgress;
    }

    // Nổi cảnh mượt mà từ mặt vé: scale và dịch nhẹ trục Y
    const scaleFactor = Math.max(0.001, p);
    groupRef.current.scale.set(
      placement.scale[0] * scaleFactor,
      placement.scale[1] * scaleFactor,
      placement.scale[2] * scaleFactor
    );

    // Trồi lên từ mặt phẳng vé (quãng đường ngắn 0.22 units)
    groupRef.current.position.y = placement.position[1] + (p - 1.0) * 0.22;
  });

  return (
    <group
      ref={groupRef}
      position={[placement.position[0], placement.position[1], placement.position[2]]}
      rotation={[placement.rotation[0], placement.rotation[1], placement.rotation[2]]}
      scale={[placement.scale[0], placement.scale[1], placement.scale[2]]}
      name={`ho-chi-minh-landmark-${slot}`}
    >
      {/* 1. MẶT NƯỚC SÔNG SÀI GÒN XANH NGỌC UỐN LƯỢN */}
      <mesh
        geometry={riverGeom}
        position={[-0.10, 0.002, 0.0]}
        receiveShadow={receiveShadow}
      >
        <meshStandardMaterial
          color={model.materials.riverWater}
          roughness={0.12}
          metalness={0.45}
          transparent
          opacity={0.92}
        />
      </mesh>

      {/* Dải phản chiếu sóng lụa bờ sông */}
      <mesh
        geometry={riverGeom}
        position={[-0.10, 0.004, 0.0]}
        scale={[0.96, 1.0, 0.96]}
      >
        <meshBasicMaterial
          color={model.materials.riverFoam}
          transparent
          opacity={0.35}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* 2. BỜ KÈ ĐÁ GRANITE BẾN BẠCH ĐẰNG & CÔNG VIÊN VEN SÔNG */}
      <mesh
        geometry={wharfGeom}
        position={[-0.05, 0.006, -0.05]}
        receiveShadow={receiveShadow}
      >
        <meshStandardMaterial
          color={model.materials.quaysideStone}
          roughness={0.80}
          metalness={0.15}
        />
      </mesh>

      {/* 3. TÀU BUÝT SÔNG SAIGON WATERBUS VÀNG CAM CẬP BẾN BẠCH ĐẰNG */}
      <SaigonWaterbus
        position={[-0.42, 0.008, 0.18]}
        rotationY={-0.35}
        scale={1.1}
        castShadow={castShadow}
      />
      <SaigonWaterbus
        position={[0.35, 0.008, 0.32]}
        rotationY={0.65}
        scale={0.9}
        castShadow={castShadow}
      />

      {/* 4. DẢI CÂY XANH CÔNG VIÊN BẾN BẠCH ĐẰNG */}
      <ParkTreeCluster position={[-0.35, 0.007, -0.02]} scale={1.05} castShadow={castShadow} />
      <ParkTreeCluster position={[-0.15, 0.007, 0.12]} scale={0.95} castShadow={castShadow} />
      <ParkTreeCluster position={[0.22, 0.007, 0.08]} scale={1.0} castShadow={castShadow} />
      <ParkTreeCluster position={[0.48, 0.007, -0.05]} scale={1.1} castShadow={castShadow} />

      {/* 5. TÒA THÁP BITEXCO FINANCIAL TOWER (BÚP SEN & SÂN TRỰC THĂNG) */}
      <BitexcoTower
        position={[-0.32, 0.008, -0.25]}
        scale={1.02}
        castShadow={castShadow}
      />

      {/* 6. CÁC TÒA CAO ỐC ĐÔ THỊ SKYLINE PHỤ TRỢ (QUẬN 1 & VINHOMES) */}
      {/* Tòa khối kính đa tầng bên phải */}
      <group position={[0.42, 0.008, -0.28]}>
        <mesh position={[0, 0.18, 0]} castShadow={castShadow}>
          <boxGeometry args={[0.10, 0.36, 0.09]} />
          <meshStandardMaterial color="#B0BEC5" roughness={0.3} metalness={0.7} />
        </mesh>
        <mesh position={[0.07, 0.14, 0.02]} castShadow={castShadow}>
          <boxGeometry args={[0.06, 0.28, 0.08]} />
          <meshStandardMaterial color="#90A4AE" roughness={0.35} metalness={0.65} />
        </mesh>
      </group>

      {/* Tòa cao ốc hậu cảnh phía sau Bitexco */}
      <group position={[-0.08, 0.008, -0.42]}>
        <mesh position={[0, 0.16, 0]} castShadow={castShadow}>
          <boxGeometry args={[0.11, 0.32, 0.08]} />
          <meshStandardMaterial color="#CFD8DC" roughness={0.4} metalness={0.6} />
        </mesh>
      </group>

      {/* 7. TÒA THÁP LANDMARK 81 TRUNG TÂM (BÓ TRE 9 KHỐI BẬC THANG) */}
      <Landmark81Tower
        position={[0.12, 0.008, -0.10]}
        scale={1.0}
        castShadow={castShadow}
      />

      {/* 8. DEBUG SAFE ZONE & LABEL ANCHOR (CHỈ KHI ?debug=1) */}
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
            <meshBasicMaterial color="#00E5FF" />
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
            <lineBasicMaterial color="#80D8FF" />
          </lineSegments>
        </group>
      )}
    </group>
  );
};
