import { ScenicRidge } from './ScenicRidge';
import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import type { TimelineProgress } from './journeyTimeline';

interface CentralPassTransitionProps {
  castShadow?: boolean;
  receiveShadow?: boolean;
  popProgress?: number;
  timelineRef?: React.RefObject<TimelineProgress | null>;
}

/**
 * Vùng địa hình chuyển tiếp trung tâm (Đèo Hải Vân & Rặng Đồi Núi Ven Biển)
 * Kết nối mượt mà từ vùng biển Sông Hàn (Đà Nẵng bên trái)
 * sang vùng Cố đô Hoàng thành (Huế bên phải) bằng địa hình đồi xanh và rặng thông.
 */
export const CentralPassTransition: React.FC<CentralPassTransitionProps> = ({
  castShadow = true,
  receiveShadow = true,
  popProgress = 1.0,
  timelineRef,
}) => {
  const passGroupRef = useRef<THREE.Group>(null);
  const treesGroupRef = useRef<THREE.Group>(null);

  // Nhẹ nhàng lay động rặng thông sườn đèo Hải Vân và cập nhật nổi pop-up
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (treesGroupRef.current && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      treesGroupRef.current.rotation.z = Math.sin(t * 1.5 + 0.5) * 0.012;
    }

    if (passGroupRef.current && timelineRef?.current) {
      const p = Math.max(0, timelineRef.current.passPopProgress);
      passGroupRef.current.visible = p > 0.001;
      passGroupRef.current.scale.set(p, p, p);
      passGroupRef.current.position.y = 0.021 * Math.min(1.0, p);
    }
  });

  const effectivePop = Math.max(0, popProgress);
  const isHidden = effectivePop <= 0.001;

  const currentScale: [number, number, number] = [effectivePop, effectivePop, effectivePop];
  const currentPosY = 0.021 * Math.min(1.0, effectivePop);
  // Danh sách cây thông và cây rừng nhiệt đới trên sườn đèo Hải Vân
  const passTrees = useMemo(() => {
    return [
      { x: -0.65, z: -0.55, scale: 0.18, color: '#2E6647' },
      { x: -0.42, z: -0.75, scale: 0.24, color: '#1B452E' },
      { x: -0.15, z: -0.62, scale: 0.20, color: '#3A6B4C' },
      { x: 0.12, z: -0.80, scale: 0.26, color: '#225238' },
      { x: 0.38, z: -0.68, scale: 0.22, color: '#2E6647' },
      { x: 0.62, z: -0.52, scale: 0.17, color: '#3A6B4C' },
      { x: -0.28, z: -1.15, scale: 0.30, color: '#1E4A32' },
      { x: 0.25, z: -1.30, scale: 0.34, color: '#24563B' },
    ];
  }, []);

  return (
    <group
      ref={passGroupRef}
      name="DANAVA_CENTRAL_PASS_TRANSITION"
      position={[0, currentPosY, 0]}
      scale={currentScale}
      visible={!isHidden}
    >
      {/* ---------------------------------------------------------------------
          1. HỆ THỐNG ĐỒI NÚI ĐÈO HẢI VÂN 3 TẦNG ĐA LỚP (MULTI-LAYER SCENIC RIDGES)
          Vươn cao lên nửa trên của Canvas, tạo chiều sâu từ hậu cảnh xuống tiền cảnh
          --------------------------------------------------------------------- */}
      {/* Tầng 1: Đồi thấp thoai thoải cận cảnh sườn đèo */}
      <group position={[0, 0, -0.95]}>
        <ScenicRidge width={2.2} depth={0.85} height={0.55} color="#7E9B88" />
      </group>

      {/* Tầng 2: Khối núi Đèo Hải Vân hùng vĩ vươn cao trung cảnh */}
      <group position={[0.45, 0, -2.60]}>
        <ScenicRidge width={5.6} depth={1.8} height={1.55} color="#486856" />
      </group>

      {/* Tầng 3: Dãy núi xa Trường Sơn sương mờ hòa sắc vào chân trời */}
      <group position={[0.20, 0, -5.80]}>
        <ScenicRidge width={9.2} depth={2.5} height={2.10} color="#9DB5A6" />
      </group>

      {/* ---------------------------------------------------------------------
          2. RẶNG CÂY RỪNG ĐÈO HẢI VÂN (PASS RIDGE TREES)
          --------------------------------------------------------------------- */}
      <group ref={treesGroupRef}>
        {passTrees.map((t, idx) => (
          <group key={`pass-tree-${idx}`} position={[t.x, 0, t.z]}>
            <mesh position={[0, t.scale * 0.35, 0]} castShadow={castShadow}>
              <cylinderGeometry args={[0.01 * t.scale * 5, 0.014 * t.scale * 5, t.scale * 0.7, 5]} />
              <meshStandardMaterial color="#5D4037" roughness={0.9} />
            </mesh>
            <mesh position={[0, t.scale * 0.85, 0]} castShadow={castShadow}>
              <sphereGeometry args={[t.scale * 0.48, 10, 8]} />
              <meshStandardMaterial color={t.color} roughness={0.82} />
            </mesh>
          </group>
        ))}
      </group>

      {/* ---------------------------------------------------------------------
          3. DẢI ĐẤT NỀN CHUYỂN TIẾP MỀM MẠI
          --------------------------------------------------------------------- */}
      <mesh
        position={[0, 0.0005, -0.65]}
        rotation={[-Math.PI / 2, 0, 0]}
        visible={false}
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
