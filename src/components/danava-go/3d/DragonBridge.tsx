import React, { useMemo } from 'react';
import * as THREE from 'three';
import { DA_NANG_DESTINATION } from './destinationConfig';

interface DragonBridgeProps {
  castShadow?: boolean;
  receiveShadow?: boolean;
}

export const DragonBridge: React.FC<DragonBridgeProps> = ({
  castShadow = true,
  receiveShadow = true,
}) => {
  const { materials } = DA_NANG_DESTINATION.model;

  // =========================================================================
  // 1. ĐƯỜNG CONG THÂN RỒNG UỐN LƯỢN (3 NHỊP VÒM HÌNH SIN CỦA CẦU RỒNG)
  // =========================================================================
  const { spineCurve, lowerLeftCurve, lowerRightCurve, finData, hangerPositions } = useMemo(() => {
    // Tọa độ các điểm kiểm soát thân rồng (từ đuôi sen phía Tây đến đầu rồng phía Đông)
    // Hệ tọa độ cục bộ của cầu: X từ -0.96 (Đuôi) đến +0.92 (Đầu), Y mặt nước = 0.022, Y mặt cầu = 0.125
    const controlPoints = [
      new THREE.Vector3(-0.95, 0.126, 0.00),  // Gốc đuôi sen chạm mặt sàn
      new THREE.Vector3(-0.84, 0.220, 0.00),  // Đuôi vểnh nhẹ
      new THREE.Vector3(-0.72, 0.260, 0.00),  // Đỉnh vòm nhịp 1 (nhịp đuôi)
      new THREE.Vector3(-0.55, 0.145, 0.00),  // Chân vòm 1 chạm trụ cầu Tây
      new THREE.Vector3(-0.35, 0.380, 0.00),  // Thân rồng dốc lên nhịp chính
      new THREE.Vector3(-0.10, 0.490, 0.00),  // Đỉnh vòm nhịp chính (vươn cao nhất ~0.49)
      new THREE.Vector3(0.18, 0.360, 0.00),   // Thân rồng lượn xuống
      new THREE.Vector3(0.38, 0.150, 0.00),   // Chân vòm 2 chạm trụ cầu Đông
      new THREE.Vector3(0.60, 0.320, 0.00),   // Nhịp 3 uốn lên cổ rồng
      new THREE.Vector3(0.78, 0.440, 0.00),   // Cổ rồng vươn cao về hướng biển
      new THREE.Vector3(0.92, 0.500, 0.00),   // Gốc đầu rồng
    ];

    const spine = new THREE.CatmullRomCurve3(controlPoints, false, 'centripetal', 0.5);

    // Hai ống thép phụ chạy song song bên dưới thân rồng (tạo kết cấu ống thép giàn không gian)
    const offsetPointsLeft = controlPoints.map((pt) =>
      new THREE.Vector3(pt.x, Math.max(0.128, pt.y - 0.035), pt.z - 0.036)
    );
    const offsetPointsRight = controlPoints.map((pt) =>
      new THREE.Vector3(pt.x, Math.max(0.128, pt.y - 0.035), pt.z + 0.036)
    );

    const lowerL = new THREE.CatmullRomCurve3(offsetPointsLeft, false, 'centripetal', 0.5);
    const lowerR = new THREE.CatmullRomCurve3(offsetPointsRight, false, 'centripetal', 0.5);

    // Tính toán vị trí các vây lưng rồng (dorsal fins) hình ngọn lửa vàng đặc trưng
    // Phân bố dọc theo các đoạn vòm nhô cao (loại bỏ vùng chân vòm sát mặt sàn)
    const fins: { pos: THREE.Vector3; tangent: THREE.Vector3; scale: number }[] = [];
    const finSamples = 16;
    for (let i = 1; i < finSamples; i++) {
      const u = i / finSamples;
      const pt = spine.getPointAt(u);
      // Chỉ gắn vây ở những đoạn thân rồng cao hơn mặt cầu (> 0.22)
      if (pt.y > 0.22 && pt.x < 0.82) {
        const tangent = spine.getTangentAt(u).normalize();
        // Vây to hơn ở đỉnh vòm chính, nhọn hình ngọn lửa vàng
        const heightFactor = Math.min(1.0, (pt.y - 0.20) / 0.28);
        fins.push({
          pos: pt,
          tangent,
          scale: 0.048 + heightFactor * 0.042,
        });
      }
    }

    // Vị trí các thanh cáp treo đứng (vertical hangers) liên kết vòm rồng xuống dầm cầu
    const hangers: { top: THREE.Vector3; bottomY: number }[] = [];
    const hangerCount = 22;
    for (let i = 1; i < hangerCount; i++) {
      const u = i / hangerCount;
      const pt = spine.getPointAt(u);
      if (pt.y > 0.18 && pt.x < 0.78) {
        hangers.push({
          top: pt,
          bottomY: 0.132,
        });
      }
    }

    return {
      spineCurve: spine,
      lowerLeftCurve: lowerL,
      lowerRightCurve: lowerR,
      finData: fins,
      hangerPositions: hangers,
    };
  }, []);

  // =========================================================================
  // 2. TẠO HÌNH HỌC VÒM ỐNG THÉP (TUBE GEOMETRIES)
  // =========================================================================
  const { spineGeom, lowerLeftGeom, lowerRightGeom } = useMemo(() => {
    // Ống chính đường kính r=0.034 đậm nét, 54 đoạn mượt mà
    const mainG = new THREE.TubeGeometry(spineCurve, 54, 0.034, 12, false);
    // Hai ống phụ đường kính r=0.018
    const subLG = new THREE.TubeGeometry(lowerLeftCurve, 48, 0.018, 8, false);
    const subRG = new THREE.TubeGeometry(lowerRightCurve, 48, 0.018, 8, false);
    return { spineGeom: mainG, lowerLeftGeom: subLG, lowerRightGeom: subRG };
  }, [spineCurve, lowerLeftCurve, lowerRightCurve]);

  // =========================================================================
  // 3. TẠO HÌNH HỌC ĐẦU RỒNG THỜI LÝ (SCULPTED DRAGON HEAD)
  // =========================================================================
  // Đầu rồng hướng về phía Đông (+X), vươn cao với hàm mở, bờm lửa uốn lượn và mắt ngọc
  const dragonHeadGroup = useMemo(() => {
    return (
      <group position={[0.92, 0.50, 0]} rotation={[0, 0, 0.08]} scale={1.22}>
        {/* Phần hộp sọ / đầu chính vát khí động */}
        <mesh position={[0.04, 0.01, 0]} castShadow>
          <boxGeometry args={[0.11, 0.068, 0.076]} />
          <meshStandardMaterial
            color={materials.dragonGold}
            roughness={0.22}
            metalness={0.42}
          />
        </mesh>

        {/* Hàm trên / Mõm rồng vươn dài về trước (+X) */}
        <mesh position={[0.11, 0.018, 0]} castShadow>
          <boxGeometry args={[0.065, 0.042, 0.064]} />
          <meshStandardMaterial
            color={materials.dragonGold}
            roughness={0.22}
            metalness={0.42}
          />
        </mesh>

        {/* Mũi rồng vểnh lên hình xoắn mây đặc trưng thời Lý */}
        <mesh position={[0.145, 0.042, 0]} castShadow>
          <sphereGeometry args={[0.024, 10, 8]} />
          <meshStandardMaterial
            color={materials.dragonFins}
            roughness={0.22}
            metalness={0.45}
          />
        </mesh>

        {/* Hàm dưới há mở */}
        <mesh position={[0.09, -0.024, 0]} rotation={[0, 0, -0.15]} castShadow>
          <boxGeometry args={[0.075, 0.025, 0.058]} />
          <meshStandardMaterial
            color={materials.dragonGold}
            roughness={0.28}
            metalness={0.35}
          />
        </mesh>

        {/* Bờm rồng / Sừng lửa uốn lượn về phía sau (-X) - 3 lớp lông bờm */}
        <mesh position={[-0.03, 0.052, 0]} rotation={[0, 0, 0.5]} castShadow>
          <coneGeometry args={[0.034, 0.12, 5]} />
          <meshStandardMaterial
            color={materials.dragonFins}
            roughness={0.26}
            metalness={0.4}
          />
        </mesh>
        <mesh position={[-0.06, 0.040, -0.028]} rotation={[0.2, 0, 0.6]} castShadow>
          <coneGeometry args={[0.024, 0.09, 5]} />
          <meshStandardMaterial
            color={materials.dragonFins}
            roughness={0.26}
            metalness={0.4}
          />
        </mesh>
        <mesh position={[-0.06, 0.040, 0.028]} rotation={[-0.2, 0, 0.6]} castShadow>
          <coneGeometry args={[0.024, 0.09, 5]} />
          <meshStandardMaterial
            color={materials.dragonFins}
            roughness={0.26}
            metalness={0.4}
          />
        </mesh>

        {/* Mắt rồng sáng ấm (2 bên trái & phải) */}
        <mesh position={[0.06, 0.032, -0.040]}>
          <sphereGeometry args={[0.012, 8, 8]} />
          <meshBasicMaterial color="#FFF8E7" />
        </mesh>
        <mesh position={[0.06, 0.032, 0.040]}>
          <sphereGeometry args={[0.012, 8, 8]} />
          <meshBasicMaterial color="#FFF8E7" />
        </mesh>
      </group>
    );
  }, [materials]);

  // =========================================================================
  // 4. TẠO HÌNH HỌC ĐUÔI RỒNG HOA SEN (LOTUS TAIL)
  // =========================================================================
  const dragonTailGroup = useMemo(() => {
    return (
      <group position={[-0.96, 0.138, 0]}>
        {/* Cánh sen chính ở giữa xòe cao */}
        <mesh position={[-0.035, 0.045, 0]} rotation={[0, 0, -0.45]} castShadow>
          <coneGeometry args={[0.038, 0.11, 5]} />
          <meshStandardMaterial
            color={materials.dragonFins}
            roughness={0.28}
            metalness={0.35}
          />
        </mesh>
        {/* Cánh sen bên trái xòe ngang */}
        <mesh position={[-0.025, 0.030, -0.032]} rotation={[0.3, 0, -0.35]} castShadow>
          <coneGeometry args={[0.028, 0.08, 5]} />
          <meshStandardMaterial
            color={materials.dragonFins}
            roughness={0.28}
            metalness={0.35}
          />
        </mesh>
        {/* Cánh sen bên phải xòe ngang */}
        <mesh position={[-0.025, 0.030, 0.032]} rotation={[-0.3, 0, -0.35]} castShadow>
          <coneGeometry args={[0.028, 0.08, 5]} />
          <meshStandardMaterial
            color={materials.dragonFins}
            roughness={0.28}
            metalness={0.35}
          />
        </mesh>
      </group>
    );
  }, [materials]);

  // =========================================================================
  // 5. MẶT CẦU, LAN CAN & VỈA HÈ ĐI BỘ (ROADWAY DECK & WALKWAYS)
  // =========================================================================
  const deckLength = 2.06;
  const deckWidth = 0.22;
  const deckThickness = 0.018;
  const deckY = 0.126;

  // Trụ cầu bê tông bo tròn đặt tại các mố và chân vòm
  const pierPositions: [number, number, number][] = [
    [-0.88, 0.065, 0], // Trụ mố Tây (gần đuôi)
    [-0.55, 0.065, 0], // Trụ nhịp 1
    [0.38, 0.065, 0],  // Trụ nhịp 2
    [0.86, 0.065, 0],  // Trụ mố Đông (dưới đầu)
  ];

  return (
    <group name="DANANG_DRAGON_BRIDGE">
      {/* ---------------------------------------------------------------------
          A. KẾT CẤU VÒM RỒNG VÀNG (DRAGON STEEL ARCHES)
          --------------------------------------------------------------------- */}
      {/* Ống vòm chính */}
      <mesh geometry={spineGeom} castShadow={castShadow} receiveShadow={receiveShadow}>
        <meshStandardMaterial
          color={materials.dragonGold}
          roughness={0.28}
          metalness={0.35}
        />
      </mesh>

      {/* Hai ống thép phụ hai bên sườn vòm */}
      <mesh geometry={lowerLeftGeom} castShadow={castShadow}>
        <meshStandardMaterial
          color={materials.dragonGold}
          roughness={0.30}
          metalness={0.32}
        />
      </mesh>
      <mesh geometry={lowerRightGeom} castShadow={castShadow}>
        <meshStandardMaterial
          color={materials.dragonGold}
          roughness={0.30}
          metalness={0.32}
        />
      </mesh>

      {/* ---------------------------------------------------------------------
          B. HÀNG VÂY LƯNG RỒNG (DORSAL FINS / SCALES)
          --------------------------------------------------------------------- */}
      {finData.map((fin, idx) => {
        // Hướng vây vuông góc với tiếp tuyến thân rồng, hướng lên trên
        const normalY = Math.abs(fin.tangent.x);
        const normalX = -fin.tangent.y;
        const angle = Math.atan2(normalY, normalX) - Math.PI / 2;

        return (
          <group
            key={`fin-${idx}`}
            position={[fin.pos.x, fin.pos.y + 0.012, fin.pos.z]}
            rotation={[0, 0, angle]}
          >
            {/* Vây giữa */}
            <mesh position={[0, fin.scale * 0.45, 0]} castShadow>
              <coneGeometry args={[fin.scale * 0.32, fin.scale, 4]} />
              <meshStandardMaterial
                color={materials.dragonFins}
                roughness={0.26}
                metalness={0.4}
              />
            </mesh>
          </group>
        );
      })}

      {/* ---------------------------------------------------------------------
          C. ĐẦU RỒNG & ĐUÔI SEN
          --------------------------------------------------------------------- */}
      {dragonHeadGroup}
      {dragonTailGroup}

      {/* ---------------------------------------------------------------------
          D. CÁP TREO ĐỨNG (VERTICAL HANGERS)
          --------------------------------------------------------------------- */}
      {hangerPositions.map((h, idx) => {
        const height = Math.max(0.02, h.top.y - h.bottomY);
        const centerY = h.bottomY + height / 2;
        return (
          <group key={`hanger-${idx}`}>
            {/* Cáp bên trái */}
            <mesh position={[h.top.x, centerY, -0.045]}>
              <cylinderGeometry args={[0.0024, 0.0024, height, 4]} />
              <meshBasicMaterial color="#E2DCD0" />
            </mesh>
            {/* Cáp bên phải */}
            <mesh position={[h.top.x, centerY, 0.045]}>
              <cylinderGeometry args={[0.0024, 0.0024, height, 4]} />
              <meshBasicMaterial color="#E2DCD0" />
            </mesh>
          </group>
        );
      })}

      {/* ---------------------------------------------------------------------
          E. BẢN MẶT CẦU (ROADWAY DECK SLAB & WALKWAYS)
          --------------------------------------------------------------------- */}
      {/* Mặt đường xe chạy (Asphalt xám đậm) */}
      <mesh
        position={[0, deckY, 0]}
        castShadow={castShadow}
        receiveShadow={receiveShadow}
      >
        <boxGeometry args={[deckLength, deckThickness, deckWidth]} />
        <meshStandardMaterial
          color={materials.bridgeDeck}
          roughness={0.65}
          metalness={0.15}
        />
      </mesh>

      {/* Vạch sơn tim đường trên mặt cầu */}
      <mesh position={[0, deckY + deckThickness / 2 + 0.0008, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[deckLength * 0.94, 0.008]} />
        <meshBasicMaterial color="#F4D06F" depthWrite={false} />
      </mesh>

      {/* Lan can / Gờ đi bộ hai bên cầu */}
      <mesh position={[0, deckY + 0.016, -deckWidth / 2 + 0.006]}>
        <boxGeometry args={[deckLength, 0.022, 0.012]} />
        <meshStandardMaterial color="#DDD6C9" roughness={0.7} />
      </mesh>
      <mesh position={[0, deckY + 0.016, deckWidth / 2 - 0.006]}>
        <boxGeometry args={[deckLength, 0.022, 0.012]} />
        <meshStandardMaterial color="#DDD6C9" roughness={0.7} />
      </mesh>

      {/* ---------------------------------------------------------------------
          F. CÁC TRỤ CẦU BÊ TÔNG (CONCRETE PIERS)
          --------------------------------------------------------------------- */}
      {pierPositions.map(([px, py, pz], idx) => (
        <group key={`pier-${idx}`} position={[px, py, pz]}>
          {/* Trụ hình bầu dục bo tròn cản nước */}
          <mesh castShadow receiveShadow>
            <cylinderGeometry args={[0.046, 0.052, 0.12, 12]} />
            <meshStandardMaterial
              color={materials.piers}
              roughness={0.82}
              metalness={0.05}
            />
          </mesh>
          {/* Bệ móng trụ mở rộng chìm xuống lòng sông */}
          <mesh position={[0, -0.052, 0]} receiveShadow>
            <cylinderGeometry args={[0.068, 0.075, 0.026, 12]} />
            <meshStandardMaterial
              color="#CBC4B7"
              roughness={0.9}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
};
