import React, { useMemo } from 'react';

interface CentralPassTransitionProps {
  castShadow?: boolean;
  receiveShadow?: boolean;
}

/**
 * Vùng địa hình chuyển tiếp trung tâm (Đèo Hải Vân & Rặng Đồi Núi Ven Biển)
 * Kết nối mượt mà từ vùng biển Sông Hàn (Đà Nẵng bên trái)
 * sang vùng Cố đô Hoàng thành (Huế bên phải) bằng địa hình đồi xanh và rặng thông.
 */
export const CentralPassTransition: React.FC<CentralPassTransitionProps> = ({
  castShadow = true,
  receiveShadow = true,
}) => {
  // Danh sách cây thông và cây rừng nhiệt đới trên sườn đèo Hải Vân
  const passTrees = useMemo(() => {
    return [
      { x: -0.65, z: -0.55, scale: 0.18, color: '#2E6647' },
      { x: -0.42, z: -0.75, scale: 0.24, color: '#1B452E' },
      { x: -0.15, z: -0.62, scale: 0.20, color: '#3A6B4C' },
      { x: 0.12, z: -0.80, scale: 0.26, color: '#225238' },
      { x: 0.38, z: -0.68, scale: 0.22, color: '#2E6647' },
      { x: 0.62, z: -0.52, scale: 0.17, color: '#3A6B4C' },
    ];
  }, []);

  return (
    <group name="DANAVA_CENTRAL_PASS_TRANSITION" position={[0, 0.021, 0]}>
      {/* ---------------------------------------------------------------------
          1. ĐỒI XANH ĐÈO HẢI VÂN Ở HẬU CẢNH TRUNG TÂM (CENTRAL HILLS)
          Các ngọn đồi thoai thoải uốn lượn phía sau khúc cua đèo Z = -0.32
          --------------------------------------------------------------------- */}
      <group position={[0, 0, -0.95]}>
        {/* Đỉnh đèo Hải Vân trung tâm */}
        <mesh position={[0.05, 0.18, 0]} scale={[1.8, 0.7, 0.9]} castShadow={castShadow} receiveShadow={receiveShadow}>
          <coneGeometry args={[0.55, 0.52, 10]} />
          <meshStandardMaterial
            color="#3E6B4E"
            roughness={0.92}
            transparent
            opacity={0.88}
          />
        </mesh>

        {/* Sườn đồi thoai thoải dốc về phía Đà Nẵng (Tây) */}
        <mesh position={[-0.55, 0.12, 0.1]} scale={[1.4, 0.55, 0.8]} castShadow={castShadow} receiveShadow={receiveShadow}>
          <coneGeometry args={[0.45, 0.42, 8]} />
          <meshStandardMaterial
            color="#487B56"
            roughness={0.92}
            transparent
            opacity={0.85}
          />
        </mesh>

        {/* Sườn đồi dốc về phía vịnh Lăng Cô / Huế (Đông) */}
        <mesh position={[0.60, 0.14, 0.1]} scale={[1.5, 0.58, 0.8]} castShadow={castShadow} receiveShadow={receiveShadow}>
          <coneGeometry args={[0.48, 0.45, 8]} />
          <meshStandardMaterial
            color="#386444"
            roughness={0.92}
            transparent
            opacity={0.85}
          />
        </mesh>
      </group>

      {/* ---------------------------------------------------------------------
          2. RẶNG CÂY RỪNG ĐÈO HẢI VÂN (PASS RIDGE TREES)
          --------------------------------------------------------------------- */}
      {passTrees.map((t, idx) => (
        <group key={`pass-tree-${idx}`} position={[t.x, 0, t.z]}>
          <mesh position={[0, t.scale * 0.35, 0]} castShadow>
            <cylinderGeometry args={[0.01 * t.scale * 5, 0.014 * t.scale * 5, t.scale * 0.7, 5]} />
            <meshStandardMaterial color="#5D4037" roughness={0.9} />
          </mesh>
          <mesh position={[0, t.scale * 0.85, 0]} castShadow>
            <coneGeometry args={[t.scale * 0.48, t.scale * 0.75, 7]} />
            <meshStandardMaterial color={t.color} roughness={0.82} />
          </mesh>
        </group>
      ))}

      {/* ---------------------------------------------------------------------
          3. DẢI ĐẤT NỀN CHUYỂN TIẾP MỀM MẠI
          --------------------------------------------------------------------- */}
      <mesh
        position={[0, 0.0005, -0.65]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow={receiveShadow}
      >
        <planeGeometry args={[1.6, 0.55]} />
        <meshStandardMaterial
          color="#D5D0C2"
          roughness={0.9}
        />
      </mesh>
    </group>
  );
};
