import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { COACH_CONFIG } from './coachConfig';
import { ROAD_CONFIG, VEHICLE_PATH_CURVE, getVehicleTransformAt } from './roadConfig';

import type { TimelineProgress } from './journeyTimeline';

interface SleeperCoachProps {
  position?: [number, number, number];
  yawAngle?: number;
  scale?: number;
  castShadow?: boolean;
  autoAnimate?: boolean;
  shouldReduceMotion?: boolean;
  replayKey?: number;
  onAnimationComplete?: () => void;
  vehicleProgress?: number;
  timelineRef?: React.RefObject<TimelineProgress | null>;
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
  autoAnimate = true,
  shouldReduceMotion = false,
  replayKey = 0,
  onAnimationComplete,
  vehicleProgress,
  timelineRef,
}) => {
  const { dimensions, materials, animation } = COACH_CONFIG;
  const hull = useMemo(() => new RoundedBoxGeometry(dimensions.width, .30, dimensions.length - .04, 4, .035), [dimensions.width, dimensions.length]);
  const nose = useMemo(() => new RoundedBoxGeometry(dimensions.width, .27, .08, 4, .025), [dimensions.width]);

  const coachRootRef = useRef<THREE.Group>(null);
  const flWheelRef = useRef<THREE.Group>(null);
  const frWheelRef = useRef<THREE.Group>(null);
  const rlWheelRef = useRef<THREE.Group>(null);
  const rrWheelRef = useRef<THREE.Group>(null);

  // Animation state tracking without calling React setState (zero re-renders)
  const animStateRef = useRef({
    elapsed: shouldReduceMotion || !autoAnimate ? animation.duration : 0,
    isComplete: shouldReduceMotion || !autoAnimate,
    prevReplayKey: replayKey,
  });

  // Calculate default final stop state
  const defaultTransform = useMemo(() => {
    return getVehicleTransformAt(ROAD_CONFIG.vehicleKeyframes.stopT);
  }, []);

  // Initial starting transform (entry point if animated, or stop point if reduced motion/manual pos)
  const initialTransform = useMemo(() => {
    if (position) {
      return {
        pos: position,
        yaw: yawAngle !== undefined ? yawAngle : defaultTransform.yawAngle,
      };
    }
    if (shouldReduceMotion || !autoAnimate) {
      return {
        pos: [defaultTransform.position.x, defaultTransform.position.y, defaultTransform.position.z] as [number, number, number],
        yaw: defaultTransform.yawAngle,
      };
    }
    const entryTrans = getVehicleTransformAt(animation.entryT);
    return {
      pos: [entryTrans.position.x, entryTrans.position.y, entryTrans.position.z] as [number, number, number],
      yaw: entryTrans.yawAngle,
    };
  }, [position, yawAngle, shouldReduceMotion, autoAnimate, defaultTransform, animation.entryT]);

  // Frame update loop: mutates Three.js transforms directly (zero React setState calls)
  useFrame((_, delta) => {
    // 1. Nếu được timeline tập trung điều khiển trực tiếp
    const activeProgress = timelineRef?.current ? timelineRef.current.vehicleProgress : vehicleProgress;
    if (activeProgress !== undefined) {
      if (shouldReduceMotion) {
        if (coachRootRef.current) {
          coachRootRef.current.position.set(
            defaultTransform.position.x,
            defaultTransform.position.y,
            defaultTransform.position.z
          );
          coachRootRef.current.rotation.y = defaultTransform.yawAngle;
          coachRootRef.current.visible = true;
        }
        return;
      }

      const p = Math.max(0, Math.min(1.0, activeProgress));
      if (p <= 0.001) {
        if (coachRootRef.current) coachRootRef.current.visible = false;
        return;
      }
      if (coachRootRef.current) coachRootRef.current.visible = true;

      const currentT = animation.entryT + (animation.stopT - animation.entryT) * p;
      const pt = VEHICLE_PATH_CURVE.getPointAt(currentT);
      const tangent = VEHICLE_PATH_CURVE.getTangentAt(currentT).normalize();
      const yaw = Math.atan2(tangent.x, tangent.z);

      if (coachRootRef.current) {
        coachRootRef.current.position.set(pt.x, pt.y, pt.z);
        coachRootRef.current.rotation.y = yaw;
      }

      const distanceTraveled = animation.totalDistance * p;
      const wheelAngle = distanceTraveled / dimensions.wheelRadius;

      if (flWheelRef.current) flWheelRef.current.rotation.x = wheelAngle;
      if (frWheelRef.current) frWheelRef.current.rotation.x = wheelAngle;
      if (rlWheelRef.current) rlWheelRef.current.rotation.x = wheelAngle;
      if (rrWheelRef.current) rrWheelRef.current.rotation.x = wheelAngle;

      if (p >= 1.0 && !animStateRef.current.isComplete) {
        animStateRef.current.isComplete = true;
        onAnimationComplete?.();
      }
      return;
    }

    if (!autoAnimate && !position) return;

    // Detect replay trigger from debug controls
    if (replayKey !== animStateRef.current.prevReplayKey) {
      animStateRef.current.prevReplayKey = replayKey;
      animStateRef.current.elapsed = 0;
      animStateRef.current.isComplete = false;
    }

    if (shouldReduceMotion) {
      if (!animStateRef.current.isComplete && coachRootRef.current) {
        coachRootRef.current.position.set(
          defaultTransform.position.x,
          defaultTransform.position.y,
          defaultTransform.position.z
        );
        coachRootRef.current.rotation.y = defaultTransform.yawAngle;
        const finalDist = animation.totalDistance;
        const finalAngle = finalDist / dimensions.wheelRadius;
        if (flWheelRef.current) flWheelRef.current.rotation.x = finalAngle;
        if (frWheelRef.current) frWheelRef.current.rotation.x = finalAngle;
        if (rlWheelRef.current) rlWheelRef.current.rotation.x = finalAngle;
        if (rrWheelRef.current) rrWheelRef.current.rotation.x = finalAngle;
        animStateRef.current.isComplete = true;
      }
      return;
    }

    if (animStateRef.current.isComplete) return;

    // Advance elapsed time smoothly
    animStateRef.current.elapsed += Math.min(delta, 0.04);
    const u = Math.min(1.0, animStateRef.current.elapsed / animation.duration);

    // Cubic ease-out deceleration curve: 1 - (1 - u)^3
    // Enters with smooth cruising speed, continuously decelerates to a whisper-quiet stop with zero spring/vibration
    const eased = 1 - Math.pow(1 - u, 3);
    const currentT = animation.entryT + (animation.stopT - animation.entryT) * eased;

    const pt = VEHICLE_PATH_CURVE.getPointAt(currentT);
    const tangent = VEHICLE_PATH_CURVE.getTangentAt(currentT).normalize();
    const yaw = Math.atan2(tangent.x, tangent.z);

    if (coachRootRef.current) {
      coachRootRef.current.position.set(pt.x, pt.y, pt.z);
      coachRootRef.current.rotation.y = yaw;
    }

    // Wheel rotation physics: distance / radius
    // Exactly matches distance traveled along the curve
    const distanceTraveled = animation.totalDistance * eased;
    const wheelAngle = distanceTraveled / dimensions.wheelRadius;

    if (flWheelRef.current) flWheelRef.current.rotation.x = wheelAngle;
    if (frWheelRef.current) frWheelRef.current.rotation.x = wheelAngle;
    if (rlWheelRef.current) rlWheelRef.current.rotation.x = wheelAngle;
    if (rrWheelRef.current) rrWheelRef.current.rotation.x = wheelAngle;

    if (u >= 1.0) {
      animStateRef.current.isComplete = true;
      onAnimationComplete?.();
    }
  });

  const shadowTexture = useMemo(() => createContactShadowTexture(), []);
  const decalTexture = useMemo(() => createDanavaGoDecalTexture(), []);

  return (
    <group
      ref={coachRootRef}
      name="DANAVA_SLEEPER_COACH_RIG"
      position={initialTransform.pos}
      rotation={[0, initialTransform.yaw, 0]}
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
          spinRef={flWheelRef}
          position={[-dimensions.trackWidth / 2, dimensions.axleHeight, dimensions.wheelBase / 2]}
          radius={dimensions.wheelRadius}
          width={dimensions.wheelWidth}
          isLeft
          castShadow={castShadow}
        />
        {/* Trước Phải (Front Right) */}
        <WheelAssembly
          spinRef={frWheelRef}
          position={[dimensions.trackWidth / 2, dimensions.axleHeight, dimensions.wheelBase / 2]}
          radius={dimensions.wheelRadius}
          width={dimensions.wheelWidth}
          isLeft={false}
          castShadow={castShadow}
        />
        {/* Sau Trái (Rear Left) */}
        <WheelAssembly
          spinRef={rlWheelRef}
          position={[-dimensions.trackWidth / 2, dimensions.axleHeight, -dimensions.wheelBase / 2]}
          radius={dimensions.wheelRadius}
          width={dimensions.wheelWidth}
          isLeft
          castShadow={castShadow}
        />
        {/* Sau Phải (Rear Right) */}
        <WheelAssembly
          spinRef={rrWheelRef}
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
          <primitive object={hull} attach="geometry" />
          <meshPhysicalMaterial
            color={materials.bodyColor}
            roughness={materials.bodyRoughness}
            metalness={materials.bodyMetalness}
            clearcoat={materials.clearcoat}
            clearcoatRoughness={materials.clearcoatRoughness}
            reflectivity={0.85}
          />
        </mesh>

        {/* Mũi xe vát khí động học (Aerodynamic Front Nose) */}
        <mesh
          position={[0, 0.182, dimensions.length / 2 - 0.04]}
          castShadow={castShadow}
          receiveShadow
        >
          <primitive object={nose} attach="geometry" />
          <meshPhysicalMaterial
            color={materials.bodyColor}
            roughness={materials.bodyRoughness}
            metalness={materials.bodyMetalness}
            clearcoat={materials.clearcoat}
            clearcoatRoughness={materials.clearcoatRoughness}
            reflectivity={0.85}
          />
        </mesh>

        {/* Mui lướt gió khí động học trên nóc trước (Aerodynamic Sun Visor / Roof Spoiler) */}
        <mesh position={[0, 0.352, dimensions.length / 2 - 0.065]} castShadow={castShadow}>
          <boxGeometry args={[dimensions.width + 0.008, 0.024, 0.14]} />
          <meshPhysicalMaterial
            color={materials.bodyColor}
            roughness={materials.bodyRoughness}
            metalness={materials.bodyMetalness}
            clearcoat={materials.clearcoat}
          />
        </mesh>
        {/* Đèn định vị mui LED xanh băng */}
        <mesh position={[0, 0.354, dimensions.length / 2 + 0.008]}>
          <boxGeometry args={[0.09, 0.008, 0.005]} />
          <meshBasicMaterial color={materials.drlEmissive} />
        </mesh>

        {/* Kính chắn gió trước vát nghiêng sâu (Deep Slanted Panoramic Windshield) */}
        <mesh
          position={[0, 0.245, dimensions.length / 2 - 0.015]}
          rotation={[0.34, 0, 0]}
          castShadow={castShadow}
        >
          <boxGeometry args={[dimensions.width - 0.018, 0.138, 0.038]} />
          <meshPhysicalMaterial
            color={materials.windowColor}
            roughness={materials.windowRoughness}
            metalness={materials.windowMetalness}
            transmission={materials.windowTransmission}
            thickness={0.4}
            ior={1.52}
            reflectivity={0.9}
          />
        </mesh>

        {/* Cột chữ A màu đen bóng (Gloss Black A-Pillars) */}
        <mesh position={[-dimensions.width / 2 + 0.008, 0.245, dimensions.length / 2 - 0.015]} rotation={[0.34, 0, 0]}>
          <boxGeometry args={[0.014, 0.14, 0.042]} />
          <meshStandardMaterial color="#0A0F17" roughness={0.2} metalness={0.5} />
        </mesh>
        <mesh position={[dimensions.width / 2 - 0.008, 0.245, dimensions.length / 2 - 0.015]} rotation={[0.34, 0, 0]}>
          <boxGeometry args={[0.014, 0.14, 0.042]} />
          <meshStandardMaterial color="#0A0F17" roughness={0.2} metalness={0.5} />
        </mesh>

        {/* Dải kính cửa sổ 2 tầng giường nằm bên trái (Left Double-decker Windows) */}
        <group position={[-dimensions.width / 2 - 0.002, 0.22, -0.02]}>
          {/* Tầng 2 (Upper Bunk Windows) */}
          <mesh position={[0, 0.065, 0]} castShadow={false}>
            <boxGeometry args={[0.006, 0.068, dimensions.length - 0.26]} />
            <meshPhysicalMaterial
              color={materials.windowColor}
              roughness={materials.windowRoughness}
              metalness={materials.windowMetalness}
              transmission={materials.windowTransmission}
              thickness={0.3}
              ior={1.52}
            />
          </mesh>
          {/* Tầng 1 (Lower Bunk Windows) */}
          <mesh position={[0, -0.025, 0]} castShadow={false}>
            <boxGeometry args={[0.006, 0.068, dimensions.length - 0.26]} />
            <meshPhysicalMaterial
              color={materials.windowColor}
              roughness={materials.windowRoughness}
              metalness={materials.windowMetalness}
              transmission={materials.windowTransmission}
              thickness={0.3}
              ior={1.52}
            />
          </mesh>
          {/* Các thanh nẹp chia khoang giường nằm dọc sườn (Bunk Berth Mullions) */}
          {[-0.32, -0.16, 0, 0.16, 0.32].map((zOffset, idx) => (
            <mesh key={`mullion-l-${idx}`} position={[-0.001, 0.02, zOffset]}>
              <boxGeometry args={[0.008, 0.165, 0.016]} />
              <meshStandardMaterial color="#0F1722" roughness={0.3} metalness={0.4} />
            </mesh>
          ))}
        </group>

        {/* Dải kính cửa sổ 2 tầng giường nằm bên phải (Right Double-decker Windows) */}
        <group position={[dimensions.width / 2 + 0.002, 0.22, -0.02]}>
          {/* Tầng 2 (Upper Bunk Windows) */}
          <mesh position={[0, 0.065, 0]} castShadow={false}>
            <boxGeometry args={[0.006, 0.068, dimensions.length - 0.26]} />
            <meshPhysicalMaterial
              color={materials.windowColor}
              roughness={materials.windowRoughness}
              metalness={materials.windowMetalness}
              transmission={materials.windowTransmission}
              thickness={0.3}
              ior={1.52}
            />
          </mesh>
          {/* Tầng 1 (Lower Bunk Windows) */}
          <mesh position={[0, -0.025, 0]} castShadow={false}>
            <boxGeometry args={[0.006, 0.068, dimensions.length - 0.26]} />
            <meshPhysicalMaterial
              color={materials.windowColor}
              roughness={materials.windowRoughness}
              metalness={materials.windowMetalness}
              transmission={materials.windowTransmission}
              thickness={0.3}
              ior={1.52}
            />
          </mesh>
          {/* Các thanh nẹp chia khoang giường nằm dọc sườn (Bunk Berth Mullions) */}
          {[-0.32, -0.16, 0, 0.16, 0.32].map((zOffset, idx) => (
            <mesh key={`mullion-r-${idx}`} position={[0.001, 0.02, zOffset]}>
              <boxGeometry args={[0.008, 0.165, 0.016]} />
              <meshStandardMaterial color="#0F1722" roughness={0.3} metalness={0.4} />
            </mesh>
          ))}
        </group>

        {/* Nẹp viền Chrome eo xe chạy dọc hai bên (Chrome Beltline Trim) */}
        <mesh position={[-dimensions.width / 2 - 0.004, 0.125, -0.02]}>
          <boxGeometry args={[0.004, 0.012, dimensions.length - 0.14]} />
          <meshStandardMaterial color={materials.chromeColor} roughness={materials.chromeRoughness} metalness={materials.chromeMetalness} />
        </mesh>
        <mesh position={[dimensions.width / 2 + 0.004, 0.125, -0.02]}>
          <boxGeometry args={[0.004, 0.012, dimensions.length - 0.14]} />
          <meshStandardMaterial color={materials.chromeColor} roughness={materials.chromeRoughness} metalness={materials.chromeMetalness} />
        </mesh>

        {/* Dải chỉ nhấn Teal DANAVA GO chạy dưới lườn xe */}
        <mesh position={[-dimensions.width / 2 - 0.004, 0.062, -0.02]}>
          <boxGeometry args={[0.004, 0.010, dimensions.length - 0.18]} />
          <meshBasicMaterial color={materials.accentTeal} />
        </mesh>
        <mesh position={[dimensions.width / 2 + 0.004, 0.062, -0.02]}>
          <boxGeometry args={[0.004, 0.010, dimensions.length - 0.18]} />
          <meshBasicMaterial color={materials.accentTeal} />
        </mesh>

        {/* Kính đuôi xe (Rear Window) */}
        <mesh
          position={[0, 0.24, -dimensions.length / 2 + 0.012]}
          castShadow={false}
        >
          <boxGeometry args={[dimensions.width - 0.05, 0.11, 0.008]} />
          <meshPhysicalMaterial
            color={materials.windowColor}
            roughness={materials.windowRoughness}
            metalness={materials.windowMetalness}
          />
        </mesh>

        {/* Cụm điều hòa mui xe khí động học (Streamlined Roof AC Pod) */}
        <mesh
          position={[0, 0.366, -0.06]}
          castShadow={castShadow}
        >
          <boxGeometry args={[0.18, 0.034, 0.46]} />
          <meshPhysicalMaterial
            color="#E4E8EE"
            roughness={0.3}
            metalness={0.4}
            clearcoat={0.6}
          />
        </mesh>
        {/* Khe tản nhiệt điều hòa sau */}
        <mesh position={[0, 0.370, -0.27]}>
          <boxGeometry args={[0.14, 0.018, 0.03]} />
          <meshStandardMaterial color="#1A202C" roughness={0.8} />
        </mesh>

        {/* Cặp gương chiếu hậu tai thỏ khí động học cao cấp (Aerodynamic Rabbit-Ear Mirrors) */}
        <group position={[0, 0.245, dimensions.length / 2 - 0.06]}>
          {/* Gương trái */}
          <group position={[-dimensions.width / 2 - 0.042, 0, 0]}>
            <mesh position={[0.018, 0.018, 0.018]} rotation={[0, 0.22, -0.3]}>
              <cylinderGeometry args={[0.004, 0.004, 0.055, 8]} />
              <meshStandardMaterial color="#102744" metalness={0.6} roughness={0.2} />
            </mesh>
            <mesh position={[0, 0.032, 0.036]}>
              <boxGeometry args={[0.020, 0.068, 0.032]} />
              <meshPhysicalMaterial color={materials.bodyColor} roughness={0.16} metalness={0.4} clearcoat={0.9} />
            </mesh>
            {/* Mặt gương phản chiếu */}
            <mesh position={[0.011, 0.032, 0.036]}>
              <planeGeometry args={[0.028, 0.062]} />
              <meshStandardMaterial color="#ECEFF1" roughness={0.05} metalness={0.98} />
            </mesh>
          </group>

          {/* Gương phải */}
          <group position={[dimensions.width / 2 + 0.042, 0, 0]}>
            <mesh position={[-0.018, 0.018, 0.018]} rotation={[0, -0.22, 0.3]}>
              <cylinderGeometry args={[0.004, 0.004, 0.055, 8]} />
              <meshStandardMaterial color="#102744" metalness={0.6} roughness={0.2} />
            </mesh>
            <mesh position={[0, 0.032, 0.036]}>
              <boxGeometry args={[0.020, 0.068, 0.032]} />
              <meshPhysicalMaterial color={materials.bodyColor} roughness={0.16} metalness={0.4} clearcoat={0.9} />
            </mesh>
            {/* Mặt gương phản chiếu */}
            <mesh position={[-0.011, 0.032, 0.036]}>
              <planeGeometry args={[0.028, 0.062]} />
              <meshStandardMaterial color="#ECEFF1" roughness={0.05} metalness={0.98} />
            </mesh>
          </group>
        </group>

        {/* =====================================================================
            4. CHI TIẾT MẶT CA-LĂNG & ĐÈN PHA MA TRẬN LED (FRONT HIGH-TECH FASCIA)
            ===================================================================== */}
        {/* Lưới tản nhiệt mạ Chrome đa nan */}
        <group position={[0, 0.11, dimensions.length / 2 + 0.002]}>
          <mesh>
            <boxGeometry args={[0.22, 0.048, 0.008]} />
            <meshStandardMaterial
              color={materials.chromeColor}
              roughness={materials.chromeRoughness}
              metalness={materials.chromeMetalness}
            />
          </mesh>
          {/* Logo DANAVA hình cánh chim mạ crom ở giữa */}
          <mesh position={[0, 0.004, 0.006]}>
            <boxGeometry args={[0.038, 0.020, 0.006]} />
            <meshStandardMaterial color="#FFFFFF" metalness={0.95} roughness={0.1} />
          </mesh>
        </group>

        {/* Cụm đèn pha LED ma trận tinh xảo với DRL Xanh Băng (High-Tech Headlights with DRL) */}
        {/* Đèn trái */}
        <group position={[-0.112, 0.128, dimensions.length / 2 + 0.004]}>
          {/* Dải LED DRL chữ L sắc sảo viền trên */}
          <mesh position={[0, 0.016, 0.002]}>
            <boxGeometry args={[0.068, 0.008, 0.006]} />
            <meshBasicMaterial color={materials.drlEmissive} />
          </mesh>
          <mesh position={[-0.030, 0, 0.002]}>
            <boxGeometry args={[0.008, 0.032, 0.006]} />
            <meshBasicMaterial color={materials.drlEmissive} />
          </mesh>
          {/* Bóng Projector Xenon bi cầu kép */}
          <mesh position={[0.008, -0.004, 0.003]}>
            <sphereGeometry args={[0.012, 16, 16]} />
            <meshBasicMaterial color={materials.headlightColor} />
          </mesh>
          {/* Mặt kính đèn pha trong suốt */}
          <mesh position={[0, 0, 0.004]}>
            <boxGeometry args={[0.070, 0.038, 0.003]} />
            <meshPhysicalMaterial color="#F0F8FF" roughness={0.05} transmission={0.9} thickness={0.1} ior={1.5} />
          </mesh>
        </group>

        {/* Đèn phải */}
        <group position={[0.112, 0.128, dimensions.length / 2 + 0.004]}>
          {/* Dải LED DRL chữ L sắc sảo viền trên */}
          <mesh position={[0, 0.016, 0.002]}>
            <boxGeometry args={[0.068, 0.008, 0.006]} />
            <meshBasicMaterial color={materials.drlEmissive} />
          </mesh>
          <mesh position={[0.030, 0, 0.002]}>
            <boxGeometry args={[0.008, 0.032, 0.006]} />
            <meshBasicMaterial color={materials.drlEmissive} />
          </mesh>
          {/* Bóng Projector Xenon bi cầu kép */}
          <mesh position={[-0.008, -0.004, 0.003]}>
            <sphereGeometry args={[0.012, 16, 16]} />
            <meshBasicMaterial color={materials.headlightColor} />
          </mesh>
          {/* Mặt kính đèn pha trong suốt */}
          <mesh position={[0, 0, 0.004]}>
            <boxGeometry args={[0.070, 0.038, 0.003]} />
            <meshPhysicalMaterial color="#F0F8FF" roughness={0.05} transmission={0.9} thickness={0.1} ior={1.5} />
          </mesh>
        </group>

        {/* Cản dưới khí động học và hốc đèn sương mù LED vàng */}
        <mesh position={[0, 0.058, dimensions.length / 2 - 0.008]}>
          <boxGeometry args={[dimensions.width - 0.01, 0.036, 0.045]} />
          <meshStandardMaterial color="#0B1320" roughness={0.5} metalness={0.3} />
        </mesh>
        <mesh position={[-0.105, 0.064, dimensions.length / 2 + 0.006]}>
          <boxGeometry args={[0.032, 0.016, 0.006]} />
          <meshBasicMaterial color={materials.fogLightColor} />
        </mesh>
        <mesh position={[0.105, 0.064, dimensions.length / 2 + 0.006]}>
          <boxGeometry args={[0.032, 0.016, 0.006]} />
          <meshBasicMaterial color={materials.fogLightColor} />
        </mesh>

        {/* =====================================================================
            5. ĐÈN HẬU LED 3D NỔI & CẢN SAU (REAR LED LIGHTS)
            ===================================================================== */}
        <group position={[-0.132, 0.175, -dimensions.length / 2 - 0.003]}>
          <mesh>
            <boxGeometry args={[0.028, 0.14, 0.008]} />
            <meshBasicMaterial color={materials.taillightColor} />
          </mesh>
          {/* Dải LED viền đỏ sáng rực */}
          <mesh position={[0, 0, -0.002]}>
            <boxGeometry args={[0.024, 0.13, 0.004]} />
            <meshBasicMaterial color={materials.taillightEmissive} />
          </mesh>
        </group>
        <group position={[0.132, 0.175, -dimensions.length / 2 - 0.003]}>
          <mesh>
            <boxGeometry args={[0.028, 0.14, 0.008]} />
            <meshBasicMaterial color={materials.taillightColor} />
          </mesh>
          {/* Dải LED viền đỏ sáng rực */}
          <mesh position={[0, 0, -0.002]}>
            <boxGeometry args={[0.024, 0.13, 0.004]} />
            <meshBasicMaterial color={materials.taillightEmissive} />
          </mesh>
        </group>

        {/* =====================================================================
            6. LIVERY DECAL "DANAVA GO" SƯỜN XE
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
  spinRef?: React.RefObject<THREE.Group | null>;
}

/**
 * Cụm bánh xe cao cấp (Lốp cao su rãnh thể thao + Mâm hợp kim đa chấu + Đĩa phanh & Kẹp phanh Teal)
 */
const WheelAssembly: React.FC<WheelAssemblyProps> = ({
  position,
  radius,
  width,
  isLeft,
  castShadow = true,
  spinRef,
}) => {
  const { materials } = COACH_CONFIG;

  return (
    <group position={position}>
      {/* Cụm Đĩa phanh và Kẹp phanh tĩnh (không quay theo bánh) */}
      <group position={[isLeft ? 0.006 : -0.006, 0, 0]}>
        {/* Đĩa phanh hợp kim thép đục lỗ (Brake Rotor Disc) */}
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[radius * 0.58, radius * 0.58, 0.004, 24]} />
          <meshStandardMaterial color="#8892A0" roughness={0.25} metalness={0.92} />
        </mesh>
        {/* Kẹp phanh thể thao Teal DANAVA GO (Brake Caliper) */}
        <mesh position={[0, radius * 0.32, 0]}>
          <boxGeometry args={[0.014, radius * 0.30, radius * 0.22]} />
          <meshStandardMaterial color={materials.brakeCaliperColor} roughness={0.3} metalness={0.6} />
        </mesh>
      </group>

      {/* Inner spin group quay quanh trục bánh xe X theo quãng đường thực tế */}
      <group ref={spinRef} name="WHEEL_SPIN">
        {/* Lốp xe cao su thể thao rãnh khía (Tire with tread profile) */}
        <mesh
          rotation={[0, 0, Math.PI / 2]}
          castShadow={castShadow}
        >
          <cylinderGeometry args={[radius, radius, width, 28]} />
          <meshStandardMaterial
            color={materials.tireColor}
            roughness={materials.tireRoughness}
            metalness={0.06}
          />
        </mesh>

        {/* Mâm đúc hợp kim bạc sáng sâu lòng (Deep-Dish Alloy Rim) */}
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[radius * 0.64, radius * 0.64, width + 0.002, 28]} />
          <meshStandardMaterial
            color={materials.rimColor}
            roughness={materials.rimRoughness}
            metalness={materials.rimMetalness}
          />
        </mesh>

        {/* Trục tâm bánh mạ kim loại có nắp chụp logo (Chrome Hub Cap) */}
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[radius * 0.24, radius * 0.24, width + 0.008, 16]} />
          <meshStandardMaterial
            color="#CCD4DE"
            roughness={0.12}
            metalness={0.95}
          />
        </mesh>

        {/* 8 chấu nan hoa kép hợp kim phay bóng (8-Spoke Machined Alloy Wheel) */}
        {Array.from({ length: 8 }).map((_, i) => {
          const angle = (i * Math.PI * 2) / 8;
          const spokeLen = radius * 0.46;
          return (
            <mesh
              key={i}
              position={[
                isLeft ? -width / 2 - 0.002 : width / 2 + 0.002,
                Math.sin(angle) * (radius * 0.32),
                Math.cos(angle) * (radius * 0.32),
              ]}
              rotation={[angle, 0, 0]}
            >
              <boxGeometry args={[0.004, 0.010, spokeLen]} />
              <meshStandardMaterial
                color="#CCD4DE"
                roughness={0.18}
                metalness={0.90}
              />
            </mesh>
          );
        })}
      </group>
    </group>
  );
};
