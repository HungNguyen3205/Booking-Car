import React, { useMemo } from 'react';
import * as THREE from 'three';
import { COACH_CONFIG } from './coachConfig';
import { ROAD_CONFIG, getVehicleTransformAt } from './roadConfig';

interface SleeperCoachProps {
  position?: [number, number, number];
  yawAngle?: number;
  scale?: number;
  castShadow?: boolean;
}

/**
 * Sinh Texture bóng gầm xe (Ambient Occlusion Contact Shadow)
 * Tạo độ sâu mềm mại dưới gầm xe và các vết bánh xe tiếp xúc
 */
function createContactShadowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  ctx.clearRect(0, 0, 256, 512);

  // Gradient bóng gầm tổng thể
  const gradient = ctx.createRadialGradient(128, 256, 30, 128, 256, 120);
  gradient.addColorStop(0, 'rgba(8, 16, 28, 0.85)');
  gradient.addColorStop(0.5, 'rgba(8, 16, 28, 0.45)');
  gradient.addColorStop(0.85, 'rgba(8, 16, 28, 0.15)');
  gradient.addColorStop(1, 'rgba(8, 16, 28, 0)');

  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.roundRect(16, 24, 224, 464, 40);
  ctx.fill();

  // Đậm thêm tại 4 vùng tiếp xúc của bánh xe
  const tireShadows = [
    { x: 40, y: 100 },  // Trước trái
    { x: 216, y: 100 }, // Trước phải
    { x: 40, y: 410 },  // Sau trái
    { x: 216, y: 410 }, // Sau phải
  ];

  tireShadows.forEach(({ x, y }) => {
    const tireGrad = ctx.createRadialGradient(x, y, 5, x, y, 32);
    tireGrad.addColorStop(0, 'rgba(4, 8, 16, 0.95)');
    tireGrad.addColorStop(0.6, 'rgba(6, 12, 22, 0.50)');
    tireGrad.addColorStop(1, 'rgba(8, 16, 28, 0)');
    ctx.fillStyle = tireGrad;
    ctx.beginPath();
    ctx.arc(x, y, 32, 0, Math.PI * 2);
    ctx.fill();
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.generateMipmaps = true;
  return texture;
}

/**
 * Sinh Decal Text "DANAVA GO" trang nhã trên sườn xe
 */
function createDanavaGoDecalTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  ctx.clearRect(0, 0, 512, 128);

  // Dải trang trí teal thanh mảnh
  ctx.fillStyle = '#0097A7';
  ctx.fillRect(30, 24, 452, 6);

  // Chữ DANAVA GO
  ctx.font = 'bold 38px "Be Vietnam Pro", sans-serif';
  ctx.fillStyle = '#FFFFFF';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.letterSpacing = '4px';
  ctx.fillText('DANAVA GO', 256, 68);

  // Subtitle
  ctx.font = '500 16px "Be Vietnam Pro", sans-serif';
  ctx.fillStyle = '#E0F7FA';
  ctx.letterSpacing = '2px';
  ctx.fillText('PREMIUM SLEEPER COACH', 256, 102);

  const texture = new THREE.CanvasTexture(canvas);
  texture.generateMipmaps = true;
  return texture;
}

export const SleeperCoach: React.FC<SleeperCoachProps> = ({
  position,
  yawAngle,
  scale = 1.0,
  castShadow = true,
}) => {
  const { dimensions, materials } = COACH_CONFIG;

  // Lấy vị trí và góc quay mặc định tại điểm dừng đỗ chuẩn (t = 0.62)
  const defaultTransform = useMemo(() => {
    return getVehicleTransformAt(ROAD_CONFIG.vehicleKeyframes.stopT);
  }, []);

  const finalPos: [number, number, number] = position || [
    defaultTransform.position.x,
    defaultTransform.position.y,
    defaultTransform.position.z,
  ];

  const finalYaw: number = yawAngle !== undefined ? yawAngle : defaultTransform.yawAngle;

  const shadowTexture = useMemo(() => createContactShadowTexture(), []);
  const decalTexture = useMemo(() => createDanavaGoDecalTexture(), []);

  return (
    <group
      name="DANAVA_SLEEPER_COACH_RIG"
      position={finalPos}
      rotation={[0, finalYaw, 0]}
      scale={scale}
    >
      {/* =======================================================================
          1. BÓNG GẦM XE TIẾP XÚC (AMBIENT OCCLUSION CONTACT SHADOW)
          Cao độ Y = 0.001 cục bộ (nằm khít ngay trên mặt đường Y = 0.020, không z-fighting)
          ======================================================================= */}
      <mesh
        position={[0, 0.001, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[0.48, dimensions.length + 0.16]} />
        <meshBasicMaterial
          map={shadowTexture}
          transparent
          opacity={materials.shadowOpacity}
          depthWrite={false}
        />
      </mesh>

      {/* =======================================================================
          2. CỤM 4 BÁNH XE TÁCH BIỆT (SEPARATE WHEEL ASSEMBLIES)
          Trục bánh nằm ở cao độ Y = 0.078 (= bán kính lốp).
          Đáy lốp tiếp đất chính xác tại Y = 0.0 cục bộ!
          ======================================================================= */}
      <group name="WHEEL_ASSEMBLIES">
        {/* Trước Trái (Front Left) */}
        <WheelAssembly
          position={[-dimensions.trackWidth / 2, dimensions.axleHeight, dimensions.wheelBase / 2]}
          radius={dimensions.wheelRadius}
          width={dimensions.wheelWidth}
          isLeft
          castShadow={castShadow}
        />
        {/* Trước Phải (Front Right) */}
        <WheelAssembly
          position={[dimensions.trackWidth / 2, dimensions.axleHeight, dimensions.wheelBase / 2]}
          radius={dimensions.wheelRadius}
          width={dimensions.wheelWidth}
          isLeft={false}
          castShadow={castShadow}
        />
        {/* Sau Trái (Rear Left) */}
        <WheelAssembly
          position={[-dimensions.trackWidth / 2, dimensions.axleHeight, -dimensions.wheelBase / 2]}
          radius={dimensions.wheelRadius}
          width={dimensions.wheelWidth}
          isLeft
          castShadow={castShadow}
        />
        {/* Sau Phải (Rear Right) */}
        <WheelAssembly
          position={[dimensions.trackWidth / 2, dimensions.axleHeight, -dimensions.wheelBase / 2]}
          radius={dimensions.wheelRadius}
          width={dimensions.wheelWidth}
          isLeft={false}
          castShadow={castShadow}
        />
      </group>

      {/* =======================================================================
          3. THÂN XE GIƯỜNG NẰM NGUYÊN KHỐI (COACH BODY HULL)
          Gầm xe cao Y = 0.038 (sáng gầm xe thực tế), mui xe cao Y = 0.36
          ======================================================================= */}
      <group name="COACH_BODY">
        {/* Khối thân chính (Main Body Cabin) */}
        <mesh
          position={[0, 0.198, -0.01]}
          castShadow={castShadow}
          receiveShadow
        >
          <boxGeometry args={[dimensions.width, 0.30, dimensions.length - 0.04]} />
          <meshStandardMaterial
            color={materials.bodyColor}
            roughness={materials.bodyRoughness}
            metalness={materials.bodyMetalness}
          />
        </mesh>

        {/* Mũi xe vát khí động học (Aerodynamic Front Nose) */}
        <mesh
          position={[0, 0.182, dimensions.length / 2 - 0.04]}
          castShadow={castShadow}
          receiveShadow
        >
          <boxGeometry args={[dimensions.width, 0.27, 0.08]} />
          <meshStandardMaterial
            color={materials.bodyColor}
            roughness={materials.bodyRoughness}
            metalness={materials.bodyMetalness}
          />
        </mesh>

        {/* Kính chắn gió trước vát nghiêng (Front Slanted Windshield) */}
        <mesh
          position={[0, 0.245, dimensions.length / 2 - 0.015]}
          rotation={[0.32, 0, 0]}
          castShadow={castShadow}
        >
          <boxGeometry args={[dimensions.width - 0.02, 0.13, 0.04]} />
          <meshStandardMaterial
            color={materials.windowColor}
            roughness={materials.windowRoughness}
            metalness={materials.windowMetalness}
          />
        </mesh>

        {/* Dải kính cửa sổ 2 tầng giường nằm bên trái (Left Double-decker Windows) */}
        <group position={[-dimensions.width / 2 - 0.002, 0.22, -0.02]}>
          {/* Tầng 2 (Upper Bunk Windows) */}
          <mesh position={[0, 0.065, 0]} castShadow={false}>
            <boxGeometry args={[0.006, 0.068, dimensions.length - 0.26]} />
            <meshStandardMaterial
              color={materials.windowColor}
              roughness={materials.windowRoughness}
              metalness={materials.windowMetalness}
            />
          </mesh>
          {/* Tầng 1 (Lower Bunk Windows) */}
          <mesh position={[0, -0.025, 0]} castShadow={false}>
            <boxGeometry args={[0.006, 0.068, dimensions.length - 0.26]} />
            <meshStandardMaterial
              color={materials.windowColor}
              roughness={materials.windowRoughness}
              metalness={materials.windowMetalness}
            />
          </mesh>
        </group>

        {/* Dải kính cửa sổ 2 tầng giường nằm bên phải (Right Double-decker Windows) */}
        <group position={[dimensions.width / 2 + 0.002, 0.22, -0.02]}>
          {/* Tầng 2 (Upper Bunk Windows) */}
          <mesh position={[0, 0.065, 0]} castShadow={false}>
            <boxGeometry args={[0.006, 0.068, dimensions.length - 0.26]} />
            <meshStandardMaterial
              color={materials.windowColor}
              roughness={materials.windowRoughness}
              metalness={materials.windowMetalness}
            />
          </mesh>
          {/* Tầng 1 (Lower Bunk Windows) */}
          <mesh position={[0, -0.025, 0]} castShadow={false}>
            <boxGeometry args={[0.006, 0.068, dimensions.length - 0.26]} />
            <meshStandardMaterial
              color={materials.windowColor}
              roughness={materials.windowRoughness}
              metalness={materials.windowMetalness}
            />
          </mesh>
        </group>

        {/* Kính đuôi xe (Rear Window) */}
        <mesh
          position={[0, 0.24, -dimensions.length / 2 + 0.012]}
          castShadow={false}
        >
          <boxGeometry args={[dimensions.width - 0.05, 0.11, 0.008]} />
          <meshStandardMaterial
            color={materials.windowColor}
            roughness={materials.windowRoughness}
            metalness={materials.windowMetalness}
          />
        </mesh>

        {/* Cụm điều hòa mui xe (Roof AC Pod) */}
        <mesh
          position={[0, 0.365, -0.05]}
          castShadow={castShadow}
        >
          <boxGeometry args={[0.18, 0.032, 0.44]} />
          <meshStandardMaterial
            color="#E4E8EE"
            roughness={0.5}
            metalness={0.2}
          />
        </mesh>

        {/* Cặp gương chiếu hậu (Side Mirrors) */}
        <group position={[0, 0.23, dimensions.length / 2 - 0.08]}>
          {/* Gương trái */}
          <mesh position={[-dimensions.width / 2 - 0.035, 0, 0]}>
            <boxGeometry args={[0.022, 0.055, 0.028]} />
            <meshStandardMaterial color={materials.bodyColor} roughness={0.3} />
          </mesh>
          {/* Gương phải */}
          <mesh position={[dimensions.width / 2 + 0.035, 0, 0]}>
            <boxGeometry args={[0.022, 0.055, 0.028]} />
            <meshStandardMaterial color={materials.bodyColor} roughness={0.3} />
          </mesh>
        </group>

        {/* =====================================================================
            4. CHI TIẾT MẶT CA-LĂNG & ĐÈN PHA (FRONT LIGHTS & GRILLE)
            ===================================================================== */}
        {/* Lưới tản nhiệt mạ Chrome */}
        <mesh position={[0, 0.11, dimensions.length / 2 + 0.002]}>
          <boxGeometry args={[0.22, 0.045, 0.006]} />
          <meshStandardMaterial
            color={materials.chromeColor}
            roughness={0.2}
            metalness={0.85}
          />
        </mesh>

        {/* Cặp đèn pha LED Xenon ấm */}
        <mesh position={[-0.11, 0.125, dimensions.length / 2 + 0.003]}>
          <boxGeometry args={[0.065, 0.035, 0.008]} />
          <meshBasicMaterial color={materials.headlightColor} />
        </mesh>
        <mesh position={[0.11, 0.125, dimensions.length / 2 + 0.003]}>
          <boxGeometry args={[0.065, 0.035, 0.008]} />
          <meshBasicMaterial color={materials.headlightColor} />
        </mesh>

        {/* Đèn sương mù cản dưới */}
        <mesh position={[-0.10, 0.068, dimensions.length / 2 + 0.002]}>
          <boxGeometry args={[0.035, 0.018, 0.006]} />
          <meshBasicMaterial color={materials.fogLightColor} />
        </mesh>
        <mesh position={[0.10, 0.068, dimensions.length / 2 + 0.002]}>
          <boxGeometry args={[0.035, 0.018, 0.006]} />
          <meshBasicMaterial color={materials.fogLightColor} />
        </mesh>

        {/* =====================================================================
            5. ĐÈN HẬU LED ĐỎ & CẢN SAU (REAR LIGHTS)
            ===================================================================== */}
        <mesh position={[-0.135, 0.17, -dimensions.length / 2 - 0.002]}>
          <boxGeometry args={[0.028, 0.13, 0.006]} />
          <meshBasicMaterial color={materials.taillightColor} />
        </mesh>
        <mesh position={[0.135, 0.17, -dimensions.length / 2 - 0.002]}>
          <boxGeometry args={[0.028, 0.13, 0.006]} />
          <meshBasicMaterial color={materials.taillightColor} />
        </mesh>

        {/* =====================================================================
            6. LIERY DECAL "DANAVA GO" SƯỜN XE
            ===================================================================== */}
        {/* Decal sườn trái */}
        <mesh
          position={[-dimensions.width / 2 - 0.003, 0.115, -0.02]}
          rotation={[0, -Math.PI / 2, 0]}
        >
          <planeGeometry args={[0.68, 0.17]} />
          <meshBasicMaterial
            map={decalTexture}
            transparent
            depthWrite={false}
          />
        </mesh>

        {/* Decal sườn phải */}
        <mesh
          position={[dimensions.width / 2 + 0.003, 0.115, -0.02]}
          rotation={[0, Math.PI / 2, 0]}
        >
          <planeGeometry args={[0.68, 0.17]} />
          <meshBasicMaterial
            map={decalTexture}
            transparent
            depthWrite={false}
          />
        </mesh>
      </group>
    </group>
  );
};

interface WheelAssemblyProps {
  position: [number, number, number];
  radius: number;
  width: number;
  isLeft: boolean;
  castShadow?: boolean;
}

/**
 * Cụm bánh xe chuẩn hóa (Lốp cao su + Mâm đúc hợp kim)
 */
const WheelAssembly: React.FC<WheelAssemblyProps> = ({
  position,
  radius,
  width,
  isLeft: _isLeft,
  castShadow = true,
}) => {
  const { materials } = COACH_CONFIG;

  return (
    <group position={position}>
      {/* Lốp xe cao su mờ (Tire) */}
      <mesh
        rotation={[0, 0, Math.PI / 2]}
        castShadow={castShadow}
      >
        <cylinderGeometry args={[radius, radius, width, 20]} />
        <meshStandardMaterial
          color={materials.tireColor}
          roughness={materials.tireRoughness}
          metalness={0.05}
        />
      </mesh>

      {/* Mâm đúc hợp kim bạc sáng (Alloy Wheel Rim) */}
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[radius * 0.62, radius * 0.62, width + 0.002, 20]} />
        <meshStandardMaterial
          color={materials.rimColor}
          roughness={materials.rimRoughness}
          metalness={materials.rimMetalness}
        />
      </mesh>

      {/* Trục tâm bánh mạ kim loại (Hub Cap) */}
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[radius * 0.22, radius * 0.22, width + 0.006, 12]} />
        <meshStandardMaterial
          color="#A0A8B4"
          roughness={0.2}
          metalness={0.9}
        />
      </mesh>
    </group>
  );
};
