import React, { useMemo } from 'react';
import * as THREE from 'three';
import { HUE_DESTINATION } from './destinationConfig';

interface NgoMonGateProps {
  castShadow?: boolean;
  receiveShadow?: boolean;
}

export const NgoMonGate: React.FC<NgoMonGateProps> = ({
  castShadow = true,
  receiveShadow = true,
}) => {
  const { materials } = HUE_DESTINATION.model;

  // =========================================================================
  // 1. ĐÀI THÀNH KHỐI ĐÁ CHỮ U (U-SHAPED FORTRESS BASE)
  // =========================================================================
  const fortressBaseGeometry = useMemo(() => {
    // Mặt bằng đài thành chữ U:
    // Thân đài chính: X [-0.55, 0.55], Z [-0.18, 0.12]
    // Cánh trái vươn ra trước: X [-0.55, -0.32], Z [0.12, 0.32]
    // Cánh phải vươn ra trước: X [0.32, 0.55], Z [0.12, 0.32]
    const shape = new THREE.Shape();
    shape.moveTo(-0.55, -0.18);
    shape.lineTo(0.55, -0.18);
    shape.lineTo(0.55, 0.32);
    shape.lineTo(0.34, 0.32);
    shape.lineTo(0.34, 0.12);
    shape.lineTo(-0.34, 0.12);
    shape.lineTo(-0.34, 0.32);
    shape.lineTo(-0.55, 0.32);
    shape.closePath();

    const extrudeSettings = {
      depth: 0.19, // Chiều cao đài thành
      bevelEnabled: true,
      bevelSegments: 2,
      steps: 1,
      bevelSize: 0.008,
      bevelThickness: 0.008,
    };

    const geom = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    // Xoay nằm ngang trên mặt đất (Extrude mặc định đùn theo trục Z)
    geom.rotateX(Math.PI / 2);
    geom.computeVertexNormals();
    return geom;
  }, []);

  // =========================================================================
  // 2. MÁI LẦU NGŨ PHỤNG (FIVE-PHOENIX PAVILION ROOFS)
  // Mái chính giữa ngói hoàng lưu ly vàng óng, hai chái cánh ngói thanh lưu ly xanh ngọc
  // =========================================================================
  const centralRoofUpper = useMemo(() => {
    // Mái chóp 4 mái dốc cong góc
    const geom = new THREE.ConeGeometry(0.32, 0.09, 4);
    geom.rotateY(Math.PI / 4);
    return geom;
  }, []);

  const centralRoofLower = useMemo(() => {
    const geom = new THREE.ConeGeometry(0.42, 0.07, 4);
    geom.rotateY(Math.PI / 4);
    return geom;
  }, []);

  const wingRoofGeom = useMemo(() => {
    const geom = new THREE.ConeGeometry(0.24, 0.065, 4);
    geom.rotateY(Math.PI / 4);
    return geom;
  }, []);

  return (
    <group name="HUE_NGO_MON_GATE">
      {/* ---------------------------------------------------------------------
          A. ĐÀI THÀNH KHỐI ĐÁ CHỮ U (FORTRESS BASE)
          Cao độ mặt nền đài y = 0.195
          --------------------------------------------------------------------- */}
      <mesh
        geometry={fortressBaseGeometry}
        position={[0, 0.195, 0]}
        castShadow={castShadow}
        receiveShadow={receiveShadow}
      >
        <meshStandardMaterial
          color={materials.terracottaBase}
          roughness={0.75}
          metalness={0.12}
        />
      </mesh>

      {/* Lan can / gờ bao quanh mặt đài vọng cảnh */}
      <mesh position={[0, 0.208, -0.04]}>
        <boxGeometry args={[1.08, 0.022, 0.48]} />
        <meshStandardMaterial
          color={materials.stoneTerrace}
          roughness={0.85}
        />
      </mesh>

      {/* ---------------------------------------------------------------------
          B. BA CỔNG VÒM XUYÊN THÀNH (ARCHED PORTALS)
          Cửa chính giữa (dành cho Vua) và hai cửa Giáp Môn hai bên
          --------------------------------------------------------------------- */}
      {/* Cổng chính giữa (Ngọ Môn) */}
      <group position={[0, 0.075, 0.12]}>
        {/* Hốc cửa vòm chính */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[0.13, 0.14, 0.02]} />
          <meshBasicMaterial color="#1A1210" />
        </mesh>
        {/* Vòm cuốn trên cửa */}
        <mesh position={[0, 0.07, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.065, 0.065, 0.02, 10, 1, false, 0, Math.PI]} />
          <meshBasicMaterial color="#1A1210" />
        </mesh>
        {/* Viền đá vòm cổng */}
        <mesh position={[0, 0.075, 0.012]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.075, 0.075, 0.01, 12, 1, false, 0, Math.PI]} />
          <meshStandardMaterial color={materials.stoneTerrace} roughness={0.8} />
        </mesh>
      </group>

      {/* Cổng Tả Giáp Môn (Bên trái) */}
      <group position={[-0.24, 0.06, 0.12]}>
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[0.09, 0.11, 0.02]} />
          <meshBasicMaterial color="#1A1210" />
        </mesh>
        <mesh position={[0, 0.055, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.045, 0.045, 0.02, 8, 1, false, 0, Math.PI]} />
          <meshBasicMaterial color="#1A1210" />
        </mesh>
      </group>

      {/* Cổng Hữu Giáp Môn (Bên phải) */}
      <group position={[0.24, 0.06, 0.12]}>
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[0.09, 0.11, 0.02]} />
          <meshBasicMaterial color="#1A1210" />
        </mesh>
        <mesh position={[0, 0.055, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.045, 0.045, 0.02, 8, 1, false, 0, Math.PI]} />
          <meshBasicMaterial color="#1A1210" />
        </mesh>
      </group>

      {/* ---------------------------------------------------------------------
          C. LẦU NGŨ PHỤNG (FIVE-PHOENIX PAVILION)
          Gồm gian giữa 2 tầng mái hoàng lưu ly vàng rực và 2 chái cánh thanh lưu ly xanh ngọc
          --------------------------------------------------------------------- */}
      <group position={[0, 0.22, -0.02]}>
        {/* Hàng 8 cột gỗ sơn son thếp vàng tầng 1 */}
        {[-0.22, -0.07, 0.07, 0.22].map((x, idx) => (
          <group key={`col-${idx}`}>
            <mesh position={[x, 0.05, -0.08]} castShadow>
              <cylinderGeometry args={[0.009, 0.009, 0.10, 6]} />
              <meshStandardMaterial color={materials.lacquerWood} roughness={0.4} />
            </mesh>
            <mesh position={[x, 0.05, 0.08]} castShadow>
              <cylinderGeometry args={[0.009, 0.009, 0.10, 6]} />
              <meshStandardMaterial color={materials.lacquerWood} roughness={0.4} />
            </mesh>
          </group>
        ))}

        {/* Khung sàn gỗ / vách gian giữa tầng 1 */}
        <mesh position={[0, 0.05, 0]} castShadow>
          <boxGeometry args={[0.32, 0.09, 0.14]} />
          <meshStandardMaterial color="#6E2018" roughness={0.5} />
        </mesh>

        {/* Mái tầng dưới gian chính (Hoàng lưu ly vàng) */}
        <mesh
          geometry={centralRoofLower}
          position={[0, 0.115, 0]}
          scale={[1.35, 1.0, 0.95]}
          castShadow
        >
          <meshStandardMaterial
            color={materials.imperialYellowRoof}
            roughness={0.28}
            metalness={0.32}
          />
        </mesh>

        {/* Tầng lầu 2 gian chính */}
        <mesh position={[0, 0.165, 0]} castShadow>
          <boxGeometry args={[0.22, 0.065, 0.11]} />
          <meshStandardMaterial color={materials.lacquerWood} roughness={0.4} />
        </mesh>

        {/* Cột tầng lầu 2 */}
        {[-0.14, 0.14].map((x, idx) => (
          <mesh key={`col2-${idx}`} position={[x, 0.165, 0.06]} castShadow>
            <cylinderGeometry args={[0.007, 0.007, 0.065, 6]} />
            <meshStandardMaterial color={materials.lacquerWood} roughness={0.4} />
          </mesh>
        ))}

        {/* Mái chóp trên gian chính (Hoàng lưu ly vàng óng rực rỡ) */}
        <mesh
          geometry={centralRoofUpper}
          position={[0, 0.225, 0]}
          scale={[1.25, 1.0, 0.9]}
          castShadow
        >
          <meshStandardMaterial
            color={materials.imperialYellowRoof}
            roughness={0.25}
            metalness={0.35}
          />
        </mesh>

        {/* Bờ nóc chầu & Con kìm nóc đỉnh mái */}
        <mesh position={[0, 0.278, 0]}>
          <sphereGeometry args={[0.016, 8, 8]} />
          <meshStandardMaterial color="#FFF176" metalness={0.6} roughness={0.2} />
        </mesh>

        {/* Cột cờ triều Nguyễn trên kỳ đài */}
        <mesh position={[0, 0.34, 0]}>
          <cylinderGeometry args={[0.0025, 0.0035, 0.14, 6]} />
          <meshBasicMaterial color="#E0DCD4" />
        </mesh>
        {/* Lá cờ đỏ */}
        <mesh position={[0.028, 0.38, 0]}>
          <planeGeometry args={[0.052, 0.034]} />
          <meshStandardMaterial color="#D32F2F" roughness={0.6} />
        </mesh>

        {/* -------------------------------------------------------------------
            D. HAI CHÁI LẦU CÁNH TẢ - HỮU (THANH LƯU LY XANH NGỌC)
            Điểm nhận diện đặc trưng bậc nhất của lầu Ngũ Phụng
            ------------------------------------------------------------------- */}
        {/* Chái cánh Tả (Bên trái) */}
        <group position={[-0.38, 0.03, 0.04]}>
          {/* Cột gỗ nâng chái lầu */}
          <mesh position={[0, 0.04, 0]} castShadow>
            <cylinderGeometry args={[0.008, 0.008, 0.08, 6]} />
            <meshStandardMaterial color={materials.lacquerWood} roughness={0.4} />
          </mesh>
          {/* Mái ngói xanh ngọc tầng 1 */}
          <mesh
            geometry={wingRoofGeom}
            position={[0, 0.085, 0]}
            scale={[1.2, 1.0, 1.0]}
            castShadow
          >
            <meshStandardMaterial
              color={materials.imperialGreenRoof}
              roughness={0.30}
              metalness={0.25}
            />
          </mesh>
          {/* Mái ngói xanh ngọc tầng 2 */}
          <mesh
            geometry={wingRoofGeom}
            position={[0, 0.155, 0]}
            scale={[0.9, 0.9, 0.9]}
            castShadow
          >
            <meshStandardMaterial
              color={materials.imperialGreenRoof}
              roughness={0.30}
              metalness={0.25}
            />
          </mesh>
        </group>

        {/* Chái cánh Hữu (Bên phải) */}
        <group position={[0.38, 0.03, 0.04]}>
          <mesh position={[0, 0.04, 0]} castShadow>
            <cylinderGeometry args={[0.008, 0.008, 0.08, 6]} />
            <meshStandardMaterial color={materials.lacquerWood} roughness={0.4} />
          </mesh>
          <mesh
            geometry={wingRoofGeom}
            position={[0, 0.085, 0]}
            scale={[1.2, 1.0, 1.0]}
            castShadow
          >
            <meshStandardMaterial
              color={materials.imperialGreenRoof}
              roughness={0.30}
              metalness={0.25}
            />
          </mesh>
          <mesh
            geometry={wingRoofGeom}
            position={[0, 0.155, 0]}
            scale={[0.9, 0.9, 0.9]}
            castShadow
          >
            <meshStandardMaterial
              color={materials.imperialGreenRoof}
              roughness={0.30}
              metalness={0.25}
            />
          </mesh>
        </group>
      </group>

      {/* ---------------------------------------------------------------------
          E. CẦU ĐÁ TRUNG ĐẠO BẮC QUA HÀO KIM THỦY (TRUNG DAO STONE BRIDGE)
          Bắc thẳng từ sân trước qua hào sen vào cổng chính
          --------------------------------------------------------------------- */}
      <group position={[0, 0.024, 0.32]}>
        {/* Bản mặt cầu đá mài */}
        <mesh position={[0, 0.008, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.13, 0.016, 0.38]} />
          <meshStandardMaterial color={materials.stoneTerrace} roughness={0.8} />
        </mesh>
        {/* Lan can đá chạm hoa sen hai bên cầu */}
        <mesh position={[-0.068, 0.024, 0]}>
          <boxGeometry args={[0.008, 0.018, 0.38]} />
          <meshStandardMaterial color="#CBC4B7" roughness={0.85} />
        </mesh>
        <mesh position={[0.068, 0.024, 0]}>
          <boxGeometry args={[0.008, 0.018, 0.38]} />
          <meshStandardMaterial color="#CBC4B7" roughness={0.85} />
        </mesh>
      </group>
    </group>
  );
};
