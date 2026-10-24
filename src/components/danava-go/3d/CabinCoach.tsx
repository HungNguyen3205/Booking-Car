import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { VEHICLE_DEFINITIONS } from './vehicleConfig';

interface CabinCoachProps {
  position?: [number, number, number];
  yawAngle?: number;
  wheelAngle?: number;
  opacity?: number;
  scale?: number;
  castShadow?: boolean;
}

/**
 * Sinh Texture bóng gầm xe tiếp xúc cho Cabin VIP Cung Điện
 */
function createCabinContactShadowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  ctx.clearRect(0, 0, 256, 512);

  // Gradient bóng gầm
  const gradient = ctx.createRadialGradient(128, 256, 32, 128, 256, 125);
  gradient.addColorStop(0, 'rgba(8, 16, 28, 0.88)');
  gradient.addColorStop(0.5, 'rgba(8, 16, 28, 0.48)');
  gradient.addColorStop(0.85, 'rgba(8, 16, 28, 0.16)');
  gradient.addColorStop(1, 'rgba(8, 16, 28, 0)');

  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.roundRect(14, 20, 228, 472, 42);
  ctx.fill();

  const texture = new THREE.CanvasTexture(canvas);
  texture.generateMipmaps = true;
  return texture;
}

/**
 * Sinh Decal Text "ROYAL CABIN" dát vàng hoàng gia trên sườn xe
 */
function createRoyalCabinDecalTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  ctx.clearRect(0, 0, 512, 128);

  // Dải chỉ vàng kim
  ctx.fillStyle = '#D4AF37';
  ctx.fillRect(20, 22, 472, 5);

  // Chữ ROYAL CABIN
  ctx.font = 'bold 36px "Noto Serif", serif';
  ctx.fillStyle = '#FFFFFF';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.letterSpacing = '5px';
  ctx.fillText('ROYAL CABIN', 256, 68);

  // Dòng phụ
  ctx.font = '600 15px "Be Vietnam Pro", sans-serif';
  ctx.fillStyle = '#F3E5AB';
  ctx.letterSpacing = '3px';
  ctx.fillText('CUNG ĐIỆN DI ĐỘNG • VIP EXPRESS', 256, 102);

  const texture = new THREE.CanvasTexture(canvas);
  texture.generateMipmaps = true;
  return texture;
}

/**
 * Dựng xe Cabin VIP Cung Điện Di Động (Single-Deck High-Deck VIP Suite Coach)
 * Tuân thủ Rule 3: Thiết kế sàn cao đơn tầng buồng phòng độc lập, không mặc định 2 tầng.
 */
export const CabinCoach: React.FC<CabinCoachProps> = ({
  position = [0, 0, 0],
  yawAngle = 0,
  wheelAngle = 0,
  opacity = 1.0,
  scale = 1.0,
  castShadow = true,
}) => {
  const def = VEHICLE_DEFINITIONS.cabin;
  const { dimensions, materials } = def;

  const flWheelRef = useRef<THREE.Group>(null);
  const frWheelRef = useRef<THREE.Group>(null);
  const rlWheelRef = useRef<THREE.Group>(null);
  const rrWheelRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (flWheelRef.current) flWheelRef.current.rotation.x = wheelAngle;
    if (frWheelRef.current) frWheelRef.current.rotation.x = wheelAngle;
    if (rlWheelRef.current) rlWheelRef.current.rotation.x = wheelAngle;
    if (rrWheelRef.current) rrWheelRef.current.rotation.x = wheelAngle;
  });

  const shadowTexture = useMemo(() => createCabinContactShadowTexture(), []);
  const decalTexture = useMemo(() => createRoyalCabinDecalTexture(), []);

  const isTransparent = opacity < 0.999;

  // 5 khoang cửa sổ buồng phòng độc lập mỗi bên (không phải 2 tầng chồng chất)
  const cabinBayZOffsets = useMemo(() => [-0.36, -0.18, 0.0, 0.18, 0.36], []);

  return (
    <group
      name="DANAVA_ROYAL_CABIN_COACH"
      position={position}
      rotation={[0, yawAngle, 0]}
      scale={scale}
    >
      {/* 1. BÓNG GẦM XE TIẾP XÚC (CONTACT SHADOW) */}
      <mesh
        position={[0, 0.001, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[dimensions.width + 0.15, dimensions.length + 0.16]} />
        <meshBasicMaterial
          map={shadowTexture}
          transparent
          opacity={materials.shadowOpacity * opacity}
          depthWrite={false}
        />
      </mesh>

      {/* 2. CỤM 4 BÁNH XE HỢP KIM 5 CHẤU KÉP DÁT BẠC */}
      <group name="CABIN_WHEELS">
        {/* Trước Trái */}
        <CabinWheel
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
        <CabinWheel
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
        <CabinWheel
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
        <CabinWheel
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

      {/* 3. THÂN XE SÀN CAO HOÀNG GIA (ROYAL CABIN HULL) */}
      <group name="CABIN_BODY">
        {/* Khối thân chính sàn cao (Main High-Deck Hull) */}
        <mesh
          position={[0, 0.192, -0.01]}
          castShadow={castShadow}
          receiveShadow
        >
          <boxGeometry args={[dimensions.width, 0.28, dimensions.length - 0.04]} />
          <meshStandardMaterial
            color={materials.bodyColor}
            roughness={materials.bodyRoughness}
            metalness={materials.bodyMetalness}
            transparent={isTransparent}
            opacity={opacity}
          />
        </mesh>

        {/* Mũi xe vát khí động học uy nghi (Grand Royal Front Nose) */}
        <mesh
          position={[0, 0.175, dimensions.length / 2 - 0.04]}
          castShadow={castShadow}
          receiveShadow
        >
          <boxGeometry args={[dimensions.width, 0.25, 0.08]} />
          <meshStandardMaterial
            color={materials.bodyColor}
            roughness={materials.bodyRoughness}
            metalness={materials.bodyMetalness}
            transparent={isTransparent}
            opacity={opacity}
          />
        </mesh>

        {/* Kính chắn gió trước vát nghiêng sang trọng (Front Slanted Panoramic Windshield) */}
        <mesh
          position={[0, 0.235, dimensions.length / 2 - 0.015]}
          rotation={[0.30, 0, 0]}
          castShadow={castShadow}
        >
          <boxGeometry args={[dimensions.width - 0.02, 0.12, 0.04]} />
          <meshStandardMaterial
            color={materials.windowColor}
            roughness={materials.windowRoughness}
            metalness={materials.windowMetalness}
            transparent={isTransparent}
            opacity={opacity}
          />
        </mesh>

        {/* Dải nẹp chỉ mạ vàng kim Cung Đình (Royal Gold Accent Trim) */}
        <mesh position={[0, 0.115, -0.01]}>
          <boxGeometry args={[dimensions.width + 0.005, 0.010, dimensions.length - 0.06]} />
          <meshStandardMaterial
            color={materials.accentColor}
            roughness={0.25}
            metalness={0.88}
            transparent={isTransparent}
            opacity={opacity}
          />
        </mesh>

        {/* =====================================================================
            ĐẶC TRƯNG CABIN VIP: 5 KHOANG CỬA SỔ PANORAMA ĐỘC LẬP MỖI BÊN
            (Không phải kiểu 2 tầng chật chội, mà là buồng suite riêng biệt)
            ===================================================================== */}
        <group name="SUITE_PANORAMIC_WINDOWS">
          {cabinBayZOffsets.map((zOffset, idx) => (
            <group key={`suite-bay-${idx}`}>
              {/* Khoang cửa sổ bên trái */}
              <mesh position={[-dimensions.width / 2 - 0.002, 0.225, zOffset]}>
                <boxGeometry args={[0.006, 0.115, 0.14]} />
                <meshStandardMaterial
                  color={materials.windowColor}
                  roughness={materials.windowRoughness}
                  metalness={materials.windowMetalness}
                  transparent={isTransparent}
                  opacity={opacity}
                />
              </mesh>
              {/* Viền kim loại dát vàng quanh cửa sổ trái */}
              <mesh position={[-dimensions.width / 2 - 0.003, 0.225, zOffset]}>
                <boxGeometry args={[0.004, 0.125, 0.15]} />
                <meshStandardMaterial
                  color={materials.accentColor}
                  roughness={0.3}
                  metalness={0.8}
                  transparent={isTransparent}
                  opacity={opacity * 0.75}
                />
              </mesh>

              {/* Khoang cửa sổ bên phải */}
              <mesh position={[dimensions.width / 2 + 0.002, 0.225, zOffset]}>
                <boxGeometry args={[0.006, 0.115, 0.14]} />
                <meshStandardMaterial
                  color={materials.windowColor}
                  roughness={materials.windowRoughness}
                  metalness={materials.windowMetalness}
                  transparent={isTransparent}
                  opacity={opacity}
                />
              </mesh>
              {/* Viền kim loại dát vàng quanh cửa sổ phải */}
              <mesh position={[dimensions.width / 2 + 0.003, 0.225, zOffset]}>
                <boxGeometry args={[0.004, 0.125, 0.15]} />
                <meshStandardMaterial
                  color={materials.accentColor}
                  roughness={0.3}
                  metalness={0.8}
                  transparent={isTransparent}
                  opacity={opacity * 0.75}
                />
              </mesh>
            </group>
          ))}
        </group>

        {/* Kính đuôi xe VIP (Rear Window) */}
        <mesh position={[0, 0.23, -dimensions.length / 2 + 0.012]}>
          <boxGeometry args={[dimensions.width - 0.05, 0.10, 0.008]} />
          <meshStandardMaterial
            color={materials.windowColor}
            roughness={materials.windowRoughness}
            metalness={materials.windowMetalness}
            transparent={isTransparent}
            opacity={opacity}
          />
        </mesh>

        {/* Cánh lướt gió thể thao khí động học trên mui (Rear Roof Spoiler) */}
        <group position={[0, 0.35, -dimensions.length / 2 + 0.04]}>
          <mesh castShadow={castShadow}>
            <boxGeometry args={[dimensions.width - 0.02, 0.018, 0.08]} />
            <meshStandardMaterial
              color={materials.bodyColor}
              roughness={0.3}
              metalness={0.4}
              transparent={isTransparent}
              opacity={opacity}
            />
          </mesh>
          {/* Nẹp viền vàng đuôi gió */}
          <mesh position={[0, 0.010, -0.038]}>
            <boxGeometry args={[dimensions.width - 0.04, 0.006, 0.006]} />
            <meshStandardMaterial color={materials.accentColor} metalness={0.8} transparent={isTransparent} opacity={opacity} />
          </mesh>
        </group>

        {/* Cụm điều hòa mui xe mạ crôm trang nhã (Roof AC Unit) */}
        <mesh position={[0, 0.345, -0.06]} castShadow={castShadow}>
          <boxGeometry args={[0.20, 0.028, 0.46]} />
          <meshStandardMaterial
            color="#D8E0E8"
            roughness={0.4}
            metalness={0.3}
            transparent={isTransparent}
            opacity={opacity}
          />
        </mesh>

        {/* Cặp gương chiếu hậu mạ vàng kim (Gold Accent Side Mirrors) */}
        <group position={[0, 0.22, dimensions.length / 2 - 0.08]}>
          <mesh position={[-dimensions.width / 2 - 0.035, 0, 0]}>
            <boxGeometry args={[0.022, 0.055, 0.028]} />
            <meshStandardMaterial color={materials.accentColor} roughness={0.25} metalness={0.8} transparent={isTransparent} opacity={opacity} />
          </mesh>
          <mesh position={[dimensions.width / 2 + 0.035, 0, 0]}>
            <boxGeometry args={[0.022, 0.055, 0.028]} />
            <meshStandardMaterial color={materials.accentColor} roughness={0.25} metalness={0.8} transparent={isTransparent} opacity={opacity} />
          </mesh>
        </group>

        {/* Mặt ca-lăng Chrome bề thế phía trước (Grand Chrome Grille) */}
        <mesh position={[0, 0.108, dimensions.length / 2 + 0.002]}>
          <boxGeometry args={[0.24, 0.058, 0.008]} />
          <meshStandardMaterial
            color={materials.chromeColor}
            roughness={0.12}
            metalness={0.92}
            transparent={isTransparent}
            opacity={opacity}
          />
        </mesh>

        {/* Cụm đèn pha ma trận LED Jewel sang trọng */}
        <mesh position={[-0.12, 0.122, dimensions.length / 2 + 0.003]}>
          <boxGeometry args={[0.068, 0.032, 0.008]} />
          <meshBasicMaterial color={materials.headlightColor} transparent={isTransparent} opacity={opacity} />
        </mesh>
        <mesh position={[0.12, 0.122, dimensions.length / 2 + 0.003]}>
          <boxGeometry args={[0.068, 0.032, 0.008]} />
          <meshBasicMaterial color={materials.headlightColor} transparent={isTransparent} opacity={opacity} />
        </mesh>

        {/* Đèn hậu LED đỏ viền chrome sau đuôi xe */}
        <mesh position={[-0.14, 0.165, -dimensions.length / 2 - 0.002]}>
          <boxGeometry args={[0.028, 0.14, 0.006]} />
          <meshBasicMaterial color={materials.taillightColor} transparent={isTransparent} opacity={opacity} />
        </mesh>
        <mesh position={[0.14, 0.165, -dimensions.length / 2 - 0.002]}>
          <boxGeometry args={[0.028, 0.14, 0.006]} />
          <meshBasicMaterial color={materials.taillightColor} transparent={isTransparent} opacity={opacity} />
        </mesh>

        {/* Livery Decal "ROYAL CABIN" hai bên sườn xe */}
        <mesh
          position={[-dimensions.width / 2 - 0.003, 0.082, -0.01]}
          rotation={[0, -Math.PI / 2, 0]}
        >
          <planeGeometry args={[0.72, 0.14]} />
          <meshBasicMaterial
            map={decalTexture}
            transparent
            opacity={opacity}
            depthWrite={false}
          />
        </mesh>

        <mesh
          position={[dimensions.width / 2 + 0.003, 0.082, -0.01]}
          rotation={[0, Math.PI / 2, 0]}
        >
          <planeGeometry args={[0.72, 0.14]} />
          <meshBasicMaterial
            map={decalTexture}
            transparent
            opacity={opacity}
            depthWrite={false}
          />
        </mesh>
      </group>
    </group>
  );
};

interface CabinWheelProps {
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

const CabinWheel: React.FC<CabinWheelProps> = ({
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
        {/* Lốp xe (Tire) */}
        <mesh rotation={[0, 0, Math.PI / 2]} castShadow={castShadow}>
          <cylinderGeometry args={[radius, radius, width, 24]} />
          <meshStandardMaterial
            color={materials.tireColor}
            roughness={materials.tireRoughness}
            metalness={0.05}
            transparent={isTransparent}
            opacity={opacity}
          />
        </mesh>

        {/* Mâm hợp kim đúc bạc phay bóng (Alloy Wheel Rim) */}
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[radius * 0.64, radius * 0.64, width + 0.002, 24]} />
          <meshStandardMaterial
            color={materials.rimColor}
            roughness={materials.rimRoughness}
            metalness={materials.rimMetalness}
            transparent={isTransparent}
            opacity={opacity}
          />
        </mesh>

        {/* 5 cặp chấu kép mạ chrome sang trọng */}
        {Array.from({ length: 5 }).map((_, i) => {
          const angle = (i * Math.PI * 2) / 5;
          const spokeLen = radius * 0.44;
          return (
            <mesh
              key={i}
              position={[
                isLeft ? -width / 2 - 0.001 : width / 2 + 0.001,
                Math.sin(angle) * (radius * 0.30),
                Math.cos(angle) * (radius * 0.30),
              ]}
              rotation={[angle, 0, 0]}
            >
              <boxGeometry args={[0.004, 0.016, spokeLen]} />
              <meshStandardMaterial
                color="#FFFFFF"
                roughness={0.15}
                metalness={0.92}
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
