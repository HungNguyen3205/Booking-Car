import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { VEHICLE_DEFINITIONS } from './vehicleConfig';

interface LimousineVanProps {
  position?: [number, number, number];
  yawAngle?: number;
  wheelAngle?: number;
  opacity?: number;
  scale?: number;
  castShadow?: boolean;
}

/**
 * Sinh Texture bóng gầm xe tiếp xúc cho Limousine van
 */
function createVanContactShadowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 384;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  ctx.clearRect(0, 0, 256, 384);

  // Gradient bóng gầm van
  const gradient = ctx.createRadialGradient(128, 192, 24, 128, 192, 100);
  gradient.addColorStop(0, 'rgba(8, 16, 28, 0.85)');
  gradient.addColorStop(0.5, 'rgba(8, 16, 28, 0.45)');
  gradient.addColorStop(0.85, 'rgba(8, 16, 28, 0.15)');
  gradient.addColorStop(1, 'rgba(8, 16, 28, 0)');

  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.roundRect(16, 20, 224, 344, 36);
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  texture.generateMipmaps = true;
  return texture;
}

/**
 * Dựng xe Limousine VIP Van (Ford Transit / Solati / DCar President 9-11 chỗ)
 * Tuân thủ 100% quy chuẩn gốc tọa độ, trục và bánh xe tiếp đất
 */
export const LimousineVan: React.FC<LimousineVanProps> = ({
  position = [0, 0, 0],
  yawAngle = 0,
  wheelAngle = 0,
  opacity = 1.0,
  scale = 1.0,
  castShadow = true,
}) => {
  const def = VEHICLE_DEFINITIONS.limousine;
  const { dimensions, materials } = def;

  const flWheelRef = useRef<THREE.Group>(null);
  const frWheelRef = useRef<THREE.Group>(null);
  const rlWheelRef = useRef<THREE.Group>(null);
  const rrWheelRef = useRef<THREE.Group>(null);

  // Cập nhật góc quay bánh xe
  useFrame(() => {
    if (flWheelRef.current) flWheelRef.current.rotation.x = wheelAngle;
    if (frWheelRef.current) frWheelRef.current.rotation.x = wheelAngle;
    if (rlWheelRef.current) rlWheelRef.current.rotation.x = wheelAngle;
    if (rrWheelRef.current) rrWheelRef.current.rotation.x = wheelAngle;
  });

  const shadowTexture = useMemo(() => createVanContactShadowTexture(), []);

  const isTransparent = opacity < 0.999;

  return (
    <group
      name="DANAVA_LIMOUSINE_VIP_VAN"
      position={position}
      rotation={[0, yawAngle, 0]}
      scale={scale}
    >
      {/* 1. BÓNG GẦM XE TIẾP XÚC (CONTACT SHADOW) */}
      <mesh
        position={[0, 0.001, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[dimensions.width + 0.12, dimensions.length + 0.14]} />
        <meshBasicMaterial
          map={shadowTexture}
          transparent
          opacity={materials.shadowOpacity * opacity}
          depthWrite={false}
        />
      </mesh>

      {/* 2. CỤM 4 BÁNH XE VAN EXECUTIVE */}
      <group name="VAN_WHEELS">
        {/* Trước Trái */}
        <VanWheel
          spinRef={flWheelRef}
          position={[-dimensions.trackWidth / 2, dimensions.axleHeight, dimensions.wheelBase / 2]}
          radius={dimensions.wheelRadius}
          width={dimensions.wheelWidth}
          materials={materials}
          castShadow={castShadow}
          opacity={opacity}
          isLeft
        />
        {/* Trước Phải */}
        <VanWheel
          spinRef={frWheelRef}
          position={[dimensions.trackWidth / 2, dimensions.axleHeight, dimensions.wheelBase / 2]}
          radius={dimensions.wheelRadius}
          width={dimensions.wheelWidth}
          materials={materials}
          castShadow={castShadow}
          opacity={opacity}
          isLeft={false}
        />
        {/* Sau Trái */}
        <VanWheel
          spinRef={rlWheelRef}
          position={[-dimensions.trackWidth / 2, dimensions.axleHeight, -dimensions.wheelBase / 2]}
          radius={dimensions.wheelRadius}
          width={dimensions.wheelWidth}
          materials={materials}
          castShadow={castShadow}
          opacity={opacity}
          isLeft
        />
        {/* Sau Phải */}
        <VanWheel
          spinRef={rrWheelRef}
          position={[dimensions.trackWidth / 2, dimensions.axleHeight, -dimensions.wheelBase / 2]}
          radius={dimensions.wheelRadius}
          width={dimensions.wheelWidth}
          materials={materials}
          castShadow={castShadow}
          opacity={opacity}
          isLeft={false}
        />
      </group>

      {/* 3. THÂN XE VAN NGUYÊN KHỐI (VAN CABIN & HOOD) */}
      <group name="VAN_BODY">
        {/* Khối thân khoang hành khách chính */}
        <mesh
          position={[0, 0.145, -0.05]}
          castShadow={castShadow}
          receiveShadow
        >
          <boxGeometry args={[dimensions.width, 0.19, dimensions.length - 0.18]} />
          <meshStandardMaterial
            color={materials.bodyColor}
            roughness={materials.bodyRoughness}
            metalness={materials.bodyMetalness}
            transparent={isTransparent}
            opacity={opacity}
          />
        </mesh>

        {/* Mũi xe van vát nghiêng khí động học (Short Van Front Hood) */}
        <mesh
          position={[0, 0.118, dimensions.length / 2 - 0.08]}
          castShadow={castShadow}
          receiveShadow
        >
          <boxGeometry args={[dimensions.width - 0.015, 0.14, 0.16]} />
          <meshStandardMaterial
            color={materials.bodyColor}
            roughness={materials.bodyRoughness}
            metalness={materials.bodyMetalness}
            transparent={isTransparent}
            opacity={opacity}
          />
        </mesh>

        {/* Kính chắn gió trước vát nghiêng (Slanted Front Windshield) */}
        <mesh
          position={[0, 0.178, dimensions.length / 2 - 0.145]}
          rotation={[0.42, 0, 0]}
          castShadow={castShadow}
        >
          <boxGeometry args={[dimensions.width - 0.02, 0.11, 0.03]} />
          <meshStandardMaterial
            color={materials.windowColor}
            roughness={materials.windowRoughness}
            metalness={materials.windowMetalness}
            transparent={isTransparent}
            opacity={opacity}
          />
        </mesh>

        {/* Dải kính hông tối màu một tầng liền mạch (Panoramic Side Glass) */}
        <group position={[0, 0.165, -0.05]}>
          {/* Kính hông trái */}
          <mesh position={[-dimensions.width / 2 - 0.002, 0, 0]}>
            <boxGeometry args={[0.005, 0.095, dimensions.length - 0.28]} />
            <meshStandardMaterial
              color={materials.windowColor}
              roughness={materials.windowRoughness}
              metalness={materials.windowMetalness}
              transparent={isTransparent}
              opacity={opacity}
            />
          </mesh>
          {/* Kính hông phải */}
          <mesh position={[dimensions.width / 2 + 0.002, 0, 0]}>
            <boxGeometry args={[0.005, 0.095, dimensions.length - 0.28]} />
            <meshStandardMaterial
              color={materials.windowColor}
              roughness={materials.windowRoughness}
              metalness={materials.windowMetalness}
              transparent={isTransparent}
              opacity={opacity}
            />
          </mesh>
        </group>

        {/* Kính sau đuôi xe (Rear Hatch Window) */}
        <mesh position={[0, 0.165, -dimensions.length / 2 + 0.035]}>
          <boxGeometry args={[dimensions.width - 0.04, 0.085, 0.006]} />
          <meshStandardMaterial
            color={materials.windowColor}
            roughness={materials.windowRoughness}
            metalness={materials.windowMetalness}
            transparent={isTransparent}
            opacity={opacity}
          />
        </mesh>

        {/* Dải nẹp chỉ vàng Champagne sang trọng dọc thân xe (Gold Trim Accent) */}
        <mesh position={[0, 0.085, -0.04]}>
          <boxGeometry args={[dimensions.width + 0.004, 0.008, dimensions.length - 0.16]} />
          <meshStandardMaterial
            color={materials.accentColor}
            roughness={0.25}
            metalness={0.80}
            transparent={isTransparent}
            opacity={opacity}
          />
        </mesh>

        {/* Lưới tản nhiệt mạ Chrome phía trước (Chrome Front Grille) */}
        <mesh position={[0, 0.082, dimensions.length / 2 + 0.001]}>
          <boxGeometry args={[0.18, 0.048, 0.006]} />
          <meshStandardMaterial
            color={materials.chromeColor}
            roughness={0.15}
            metalness={0.92}
            transparent={isTransparent}
            opacity={opacity}
          />
        </mesh>

        {/* Đèn pha LED Daylight sắc sảo (LED Jewel Headlights) */}
        <mesh position={[-0.095, 0.098, dimensions.length / 2 + 0.002]}>
          <boxGeometry args={[0.045, 0.024, 0.006]} />
          <meshBasicMaterial color={materials.headlightColor} transparent={isTransparent} opacity={opacity} />
        </mesh>
        <mesh position={[0.095, 0.098, dimensions.length / 2 + 0.002]}>
          <boxGeometry args={[0.045, 0.024, 0.006]} />
          <meshBasicMaterial color={materials.headlightColor} transparent={isTransparent} opacity={opacity} />
        </mesh>

        {/* Cụm đèn hậu LED dọc (Vertical LED Taillights) */}
        <mesh position={[-dimensions.width / 2 + 0.02, 0.145, -dimensions.length / 2 + 0.038]}>
          <boxGeometry args={[0.022, 0.095, 0.006]} />
          <meshBasicMaterial color={materials.taillightColor} transparent={isTransparent} opacity={opacity} />
        </mesh>
        <mesh position={[dimensions.width / 2 - 0.02, 0.145, -dimensions.length / 2 + 0.038]}>
          <boxGeometry args={[0.022, 0.095, 0.006]} />
          <meshBasicMaterial color={materials.taillightColor} transparent={isTransparent} opacity={opacity} />
        </mesh>

        {/* Gương chiếu hậu van (Van Side Mirrors) */}
        <group position={[0, 0.165, dimensions.length / 2 - 0.17]}>
          <mesh position={[-dimensions.width / 2 - 0.028, 0, 0]}>
            <boxGeometry args={[0.018, 0.038, 0.024]} />
            <meshStandardMaterial color={materials.bodyColor} roughness={0.3} transparent={isTransparent} opacity={opacity} />
          </mesh>
          <mesh position={[dimensions.width / 2 + 0.028, 0, 0]}>
            <boxGeometry args={[0.018, 0.038, 0.024]} />
            <meshStandardMaterial color={materials.bodyColor} roughness={0.3} transparent={isTransparent} opacity={opacity} />
          </mesh>
        </group>
      </group>
    </group>
  );
};

interface VanWheelProps {
  position: [number, number, number];
  radius: number;
  width: number;
  materials: {
    tireColor: string;
    tireRoughness: number;
    rimColor: string;
    rimRoughness: number;
    rimMetalness: number;
  };
  castShadow?: boolean;
  opacity?: number;
  isLeft: boolean;
  spinRef?: React.RefObject<THREE.Group | null>;
}

const VanWheel: React.FC<VanWheelProps> = ({
  position,
  radius,
  width,
  materials,
  castShadow = true,
  opacity = 1.0,
  isLeft,
  spinRef,
}) => {
  const isTransparent = opacity < 0.999;

  return (
    <group position={position}>
      <group ref={spinRef} name="WHEEL_SPIN">
        {/* Lốp xe van (Tire) */}
        <mesh rotation={[0, 0, Math.PI / 2]} castShadow={castShadow}>
          <cylinderGeometry args={[radius, radius, width, 20]} />
          <meshStandardMaterial
            color={materials.tireColor}
            roughness={materials.tireRoughness}
            metalness={0.05}
            transparent={isTransparent}
            opacity={opacity}
          />
        </mesh>

        {/* Mâm hợp kim đa chấu (Alloy Wheel Rim) */}
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[radius * 0.65, radius * 0.65, width + 0.002, 20]} />
          <meshStandardMaterial
            color={materials.rimColor}
            roughness={materials.rimRoughness}
            metalness={materials.rimMetalness}
            transparent={isTransparent}
            opacity={opacity}
          />
        </mesh>

        {/* 6 chấu nan hoa van */}
        {Array.from({ length: 6 }).map((_, i) => {
          const angle = (i * Math.PI * 2) / 6;
          return (
            <mesh
              key={i}
              position={[
                isLeft ? -width / 2 - 0.001 : width / 2 + 0.001,
                Math.sin(angle) * (radius * 0.32),
                Math.cos(angle) * (radius * 0.32),
              ]}
              rotation={[angle, 0, 0]}
            >
              <boxGeometry args={[0.003, 0.009, radius * 0.48]} />
              <meshStandardMaterial
                color="#A0A8B4"
                roughness={0.2}
                metalness={0.85}
                transparent={isTransparent}
                opacity={opacity}
              />
            </mesh>
          );
        })}
      </group>
    </group>
  );
};
