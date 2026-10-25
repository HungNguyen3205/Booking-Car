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
 * Sinh đồ họa tem lượn sóng Teal / Bạc kim loại / Vàng Champagne sườn xe
 * Chiếm trọn bề mặt sườn xe (cả phần thân dưới và dải cửa sổ kính)
 * Bám sát ảnh mục tiêu bus_coach_sleeper.png
 */
/**
 * Sinh đồ họa tem lượn sóng Teal / Bạc kim loại / Vàng Champagne sườn xe
 * Chiếm trọn bề mặt sườn xe (cả phần thân dưới và dải cửa sổ kính)
 * Bám sát 100% ảnh mục tiêu bus_coach_sleeper.png
 */
function createCoachLiveryTexture(side: 'left' | 'right'): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  ctx.clearRect(0, 0, 2048, 1024);

  const isRight = side === 'right';

  // Với sườn phải (side === 'right'), Three.js PlaneGeometry xoay Math.PI/2 quanh Y:
  // Cạnh trái plane map vào U=0 (+Z, đầu xe), cạnh phải plane map vào U=1 (-Z, đuôi xe).
  // Theo hướng nhìn camera nhìn vào sườn phải: Đầu xe (+Z) ở bên PHẢI, Đuôi xe (-Z) ở bên TRÁI.
  // Để người xem đọc chữ xuôi từ trái sang phải ('DANAVA GO') và sóng vươn từ đầu xe về đuôi xe:
  // Ta lật trục X: ctx.translate(2048, 0); ctx.scale(-1, 1);
  // Sau khi lật: X=0 tương ứng ĐUÔI XE (bên trái người xem), X=2048 tương ứng ĐẦU XE (bên phải người xem)!
  ctx.save();
  if (isRight) {
    ctx.translate(2048, 0);
    ctx.scale(-1, 1);
  }

  // =========================================================================
  // 1. TẤM ỐP BẠC VÒM BÁNH SAU (REAR WHEEL ARCH SILVER ACCENT PANEL)
  // Bám sát panel bạc vuốt ôm theo hốc bánh xe sau trong ảnh mục tiêu
  // =========================================================================
  const silverArchGrad = ctx.createLinearGradient(420, 960, 680, 750);
  silverArchGrad.addColorStop(0.0, '#CBD5E1');
  silverArchGrad.addColorStop(0.5, '#E2E8F0');
  silverArchGrad.addColorStop(1.0, '#94A3B8');

  ctx.fillStyle = silverArchGrad;
  ctx.beginPath();
  ctx.moveTo(380, 960);
  ctx.lineTo(440, 780);
  ctx.bezierCurveTo(490, 730, 620, 730, 670, 780);
  ctx.lineTo(720, 960);
  ctx.bezierCurveTo(650, 930, 450, 930, 380, 960);
  ctx.closePath();
  ctx.fill();

  // =========================================================================
  // 2. DẢI SÓNG LƯỢN ĐỘNG CHỮ S KÉP (DOUBLE S-CURVE AERODYNAMIC WAVES)
  // Bắt đầu từ eo bánh trước (X ~ 1650, Y ~ 860), uốn lượn mềm mại qua eo xe
  // và tỏa ra 3 ngọn sóng sắc bén vút lên sườn đuôi xe
  // =========================================================================

  // Sóng 1 (Bạc Kim Loại Phay Sáng Lớn - Silver Crest): Dải bạc uốn lượn chính
  const silverGrad = ctx.createLinearGradient(1650, 880, 200, 380);
  silverGrad.addColorStop(0.0, '#FFFFFF');
  silverGrad.addColorStop(0.3, '#E2E8F0');
  silverGrad.addColorStop(0.7, '#94A3B8');
  silverGrad.addColorStop(1.0, '#64748B');

  ctx.fillStyle = silverGrad;
  ctx.beginPath();
  ctx.moveTo(1720, 840);
  ctx.bezierCurveTo(1450, 820, 1150, 640, 760, 580);
  ctx.bezierCurveTo(480, 530, 240, 390, 60, 420);
  ctx.bezierCurveTo(200, 470, 440, 580, 690, 640);
  ctx.bezierCurveTo(1060, 720, 1340, 920, 1640, 920);
  ctx.closePath();
  ctx.fill();

  // Sóng 2 (Teal Thương Hiệu Sâu - Deep Cyan Teal Wave): Kẹp giữa dải bạc
  const tealGrad = ctx.createLinearGradient(1680, 860, 180, 390);
  tealGrad.addColorStop(0.0, '#00E5FF');
  tealGrad.addColorStop(0.25, '#00BCD4');
  tealGrad.addColorStop(0.65, '#00838F');
  tealGrad.addColorStop(1.0, '#004D40');

  ctx.fillStyle = tealGrad;
  ctx.beginPath();
  ctx.moveTo(1670, 860);
  ctx.bezierCurveTo(1400, 800, 1100, 600, 720, 540);
  ctx.bezierCurveTo(450, 490, 210, 360, 30, 380);
  ctx.bezierCurveTo(160, 430, 410, 540, 650, 600);
  ctx.bezierCurveTo(1030, 680, 1300, 880, 1580, 895);
  ctx.closePath();
  ctx.fill();

  // Sóng 3 (Cánh Sóng Cyan Teal Nhẹ Vút Cao - Upper Teal Winglet)
  const waveTopGrad = ctx.createLinearGradient(1200, 600, 160, 290);
  waveTopGrad.addColorStop(0.0, '#26C6DA');
  waveTopGrad.addColorStop(0.5, '#0097A7');
  waveTopGrad.addColorStop(1.0, '#006064');

  ctx.fillStyle = waveTopGrad;
  ctx.beginPath();
  ctx.moveTo(1220, 600);
  ctx.bezierCurveTo(900, 480, 560, 360, 160, 310);
  ctx.bezierCurveTo(310, 360, 600, 450, 860, 540);
  ctx.bezierCurveTo(1000, 590, 1110, 620, 1220, 600);
  ctx.closePath();
  ctx.fill();

  // Sóng 4 (Dải Bạc Kim Loại Đuôi Vút Lên - Feathered Silver Tip)
  ctx.fillStyle = '#F8FAFC';
  ctx.beginPath();
  ctx.moveTo(880, 560);
  ctx.bezierCurveTo(640, 460, 380, 320, 90, 270);
  ctx.bezierCurveTo(220, 320, 480, 435, 720, 520);
  ctx.closePath();
  ctx.fill();

  // Đường chỉ mảnh Champagne Gold điểm xuyết sang trọng
  ctx.strokeStyle = '#F59E0B';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(1700, 850);
  ctx.bezierCurveTo(1420, 810, 1120, 610, 740, 555);
  ctx.bezierCurveTo(460, 505, 220, 375, 45, 395);
  ctx.stroke();

  // Dải sóng nhỏ nắp sườn trước (Front Fender Swoosh)
  ctx.strokeStyle = '#00BCD4';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(1940, 820);
  ctx.bezierCurveTo(1850, 790, 1750, 820, 1680, 860);
  ctx.stroke();

  // =========================================================================
  // 3. CHI TIẾT KỸ THUẬT NGOẠI THẤT (LUGGAGE DOORS & REAR ENGINE LOUVERS)
  // =========================================================================

  // Các đường rãnh cốp hành lý dưới sàn (Luggage Compartment Seams)
  ctx.strokeStyle = 'rgba(8, 16, 30, 0.85)';
  ctx.lineWidth = 3.5;

  const doorPositions = [1520, 1240, 960, 680];
  doorPositions.forEach((xPos) => {
    ctx.beginPath();
    ctx.moveTo(xPos, 730);
    ctx.lineTo(xPos, 965);
    ctx.stroke();

    // Tay nắm cửa cốp phẳng mạ chrome
    ctx.fillStyle = '#CBD5E1';
    ctx.fillRect(xPos - 22, 755, 44, 12);
    ctx.fillStyle = '#1E293B';
    ctx.fillRect(xPos - 18, 758, 36, 6);
  });

  // Đường rãnh phân tách cốp ngang
  ctx.beginPath();
  ctx.moveTo(600, 730);
  ctx.lineTo(1600, 730);
  ctx.stroke();

  // Cụm khe tản nhiệt động cơ phía đuôi xe (Rear Engine Louvers)
  ctx.fillStyle = '#060B14';
  for (let i = 0; i < 11; i++) {
    const louverY = 690 + i * 24;
    ctx.fillRect(110, louverY, 230, 11);
  }

  // Đèn phản quang hông xe màu vàng hổ phách (Amber Side Marker Reflectors)
  const markerX = [1620, 1180, 760, 240];
  markerX.forEach((mX) => {
    ctx.fillStyle = '#0B1220';
    ctx.fillRect(mX - 18, 952, 36, 14);
    ctx.fillStyle = '#FF9800';
    ctx.fillRect(mX - 14, 955, 28, 8);
  });

  // =========================================================================
  // 4. TYPOGRAPHY THƯƠNG HIỆU DANAVA GO & EXECUTIVE TOURS
  // Đặt kiêu hãnh trên nền sơn Navy thân xe, ngay dưới dải chân kính
  // Bám sát 100% bố cục của ảnh mục tiêu bus_coach_sleeper.png
  // =========================================================================
  const textCenterX = 1060;

  // Chữ DANAVA GO chính (Font đậm, trắng tinh, viền đổ bóng nổi bật)
  ctx.font = 'bold 150px "Be Vietnam Pro", -apple-system, sans-serif';
  ctx.fillStyle = '#FFFFFF';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.letterSpacing = '10px';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.95)';
  ctx.shadowBlur = 18;
  ctx.shadowOffsetY = 5;
  ctx.fillText('DANAVA GO', textCenterX, 470);

  // Subtitle EXECUTIVE TOURS màu Cyan Teal sáng rực chuẩn ảnh mẫu
  ctx.font = '700 64px "Be Vietnam Pro", sans-serif';
  ctx.fillStyle = '#00E5FF';
  ctx.letterSpacing = '8px';
  ctx.shadowBlur = 12;
  ctx.fillText('EXECUTIVE TOURS', textCenterX, 570);

  // Huy hiệu nhỏ ULTRA LUXURY COACH
  ctx.font = '600 30px "Be Vietnam Pro", sans-serif';
  ctx.fillStyle = '#CBD5E1';
  ctx.letterSpacing = '6px';
  ctx.shadowBlur = 8;
  ctx.fillText('ULTRA LUXURY COACH', textCenterX, 640);

  ctx.restore();

  const texture = new THREE.CanvasTexture(canvas);
  texture.generateMipmaps = true;
  return texture;
}

/**
 * Sinh đồ họa tem lượn sóng nhỏ trên nắp ca-pô trước (Front Hood Wave Accent)
 */
function createFrontHoodWaveTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  ctx.clearRect(0, 0, 256, 128);

  // Sóng teal và bạc đối xứng giữa nắp ca-pô
  ctx.strokeStyle = '#00BCD4';
  ctx.lineWidth = 4.5;
  ctx.beginPath();
  ctx.moveTo(30, 68);
  ctx.bezierCurveTo(80, 48, 176, 48, 226, 68);
  ctx.stroke();

  ctx.strokeStyle = '#F1F5F9';
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.moveTo(45, 80);
  ctx.bezierCurveTo(90, 62, 166, 62, 211, 80);
  ctx.stroke();

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

  // Hình học thân xe khí động học với các góc bo mềm mượt
  const hull = useMemo(
    () => new RoundedBoxGeometry(dimensions.width, 0.30, dimensions.length - 0.04, 5, 0.038),
    [dimensions.width, dimensions.length]
  );
  const nose = useMemo(
    () => new RoundedBoxGeometry(dimensions.width - 0.006, 0.26, 0.09, 5, 0.028),
    [dimensions.width]
  );
  const roofBrow = useMemo(
    () => new RoundedBoxGeometry(dimensions.width + 0.004, 0.038, 0.16, 4, 0.016),
    [dimensions.width]
  );

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

  // Calculate default final stop state with 3/4 beauty angle offset
  const defaultTransform = useMemo(() => {
    return getVehicleTransformAt(ROAD_CONFIG.vehicleKeyframes.stopT);
  }, []);
  const goldenYaw = defaultTransform.yawAngle - 0.20;

  // Initial starting transform (entry point if animated, or stop point if reduced motion/manual pos)
  const initialTransform = useMemo(() => {
    if (position) {
      return {
        pos: position,
        yaw: yawAngle !== undefined ? yawAngle : goldenYaw,
      };
    }
    if (shouldReduceMotion || !autoAnimate) {
      return {
        pos: [defaultTransform.position.x, defaultTransform.position.y, defaultTransform.position.z] as [number, number, number],
        yaw: goldenYaw,
      };
    }
    const entryTrans = getVehicleTransformAt(animation.entryT);
    return {
      pos: [entryTrans.position.x, entryTrans.position.y, entryTrans.position.z] as [number, number, number],
      yaw: entryTrans.yawAngle,
    };
  }, [position, yawAngle, shouldReduceMotion, autoAnimate, defaultTransform, goldenYaw, animation.entryT]);

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
          coachRootRef.current.rotation.y = goldenYaw;
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
      const baseYaw = Math.atan2(tangent.x, tangent.z);
      const turnOffset = Math.pow(p, 2) * (-0.20);
      const yaw = baseYaw + turnOffset;

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

    animStateRef.current.elapsed += Math.min(delta, 0.04);
    const u = Math.min(1.0, animStateRef.current.elapsed / animation.duration);
    const eased = 1 - Math.pow(1 - u, 3);
    const currentT = animation.entryT + (animation.stopT - animation.entryT) * eased;

    const pt = VEHICLE_PATH_CURVE.getPointAt(currentT);
    const tangent = VEHICLE_PATH_CURVE.getTangentAt(currentT).normalize();
    const yaw = Math.atan2(tangent.x, tangent.z);

    if (coachRootRef.current) {
      coachRootRef.current.position.set(pt.x, pt.y, pt.z);
      coachRootRef.current.rotation.y = yaw;
    }

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

  const rightLiveryTexture = useMemo(() => createCoachLiveryTexture('right'), []);
  const leftLiveryTexture = useMemo(() => createCoachLiveryTexture('left'), []);
  const hoodWaveTexture = useMemo(() => createFrontHoodWaveTexture(), []);

  return (
    <group
      ref={coachRootRef}
      name="DANAVA_SLEEPER_COACH_RIG"
      position={initialTransform.pos}
      rotation={[0, initialTransform.yaw, 0]}
      scale={scale}
    >
      {/* Contact shadow handled by Three.js directional light and Environment ground shadow */}

      {/* =======================================================================
          2. CỤM 4 BÁNH XE LAZĂNG 10 LỖ SÂU LÒNG (10-HOLE ALLOY WHEEL ASSEMBLIES)
          Bánh trước và sau thiết kế chuẩn xe thương mại hạng nặng
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
        {/* Sau Trái (Rear Left - Dually Deep Dish) */}
        <WheelAssembly
          spinRef={rlWheelRef}
          position={[-dimensions.trackWidth / 2, dimensions.axleHeight, -dimensions.wheelBase / 2]}
          radius={dimensions.wheelRadius}
          width={dimensions.wheelWidth}
          isLeft
          isRear
          castShadow={castShadow}
        />
        {/* Sau Phải (Rear Right - Dually Deep Dish) */}
        <WheelAssembly
          spinRef={rrWheelRef}
          position={[dimensions.trackWidth / 2, dimensions.axleHeight, -dimensions.wheelBase / 2]}
          radius={dimensions.wheelRadius}
          width={dimensions.wheelWidth}
          isLeft={false}
          isRear
          castShadow={castShadow}
        />
      </group>

      {/* =======================================================================
          3. THÂN XE & VÒM MUI KHÍ ĐỘNG HỌC (COACH BODY HULL & AERO ROOF)
          ======================================================================= */}
      <group name="COACH_BODY">
        {/* Thân chính (Main Cabin Hull) */}
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
            reflectivity={0.9}
          />
        </mesh>

        {/* Mũi xe vát cong chuyển tiếp khí động học (Aerodynamic Front Nose) */}
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
            reflectivity={0.9}
          />
        </mesh>

        {/* Vòm mui lướt gió khí động học (Aerodynamic Roof Brow / Crown) */}
        <mesh position={[0, 0.354, dimensions.length / 2 - 0.062]} castShadow={castShadow}>
          <primitive object={roofBrow} attach="geometry" />
          <meshPhysicalMaterial
            color={materials.bodyColor}
            roughness={materials.bodyRoughness}
            metalness={materials.bodyMetalness}
            clearcoat={materials.clearcoat}
            clearcoatRoughness={materials.clearcoatRoughness}
          />
        </mesh>

        {/* Cặp đèn định vị mui xe LED (Twin Amber/White Roof Clearance Lights) */}
        <mesh position={[-0.085, 0.366, dimensions.length / 2 + 0.012]}>
          <boxGeometry args={[0.024, 0.007, 0.006]} />
          <meshBasicMaterial color="#FFF9C4" />
        </mesh>
        <mesh position={[0.085, 0.366, dimensions.length / 2 + 0.012]}>
          <boxGeometry args={[0.024, 0.007, 0.006]} />
          <meshBasicMaterial color="#FFF9C4" />
        </mesh>

        {/* Gờ gân nóc xe khí động học thể thao vuốt dài (Streamlined Aero Roof Strakes) */}
        <mesh position={[-0.095, 0.358, -0.05]} castShadow={castShadow}>
          <boxGeometry args={[0.008, 0.012, dimensions.length - 0.26]} />
          <meshPhysicalMaterial
            color={materials.bodyColor}
            roughness={materials.bodyRoughness}
            metalness={materials.bodyMetalness}
            clearcoat={materials.clearcoat}
            clearcoatRoughness={materials.clearcoatRoughness}
          />
        </mesh>
        <mesh position={[0.095, 0.358, -0.05]} castShadow={castShadow}>
          <boxGeometry args={[0.008, 0.012, dimensions.length - 0.26]} />
          <meshPhysicalMaterial
            color={materials.bodyColor}
            roughness={materials.bodyRoughness}
            metalness={materials.bodyMetalness}
            clearcoat={materials.clearcoat}
            clearcoatRoughness={materials.clearcoatRoughness}
          />
        </mesh>

        {/* =====================================================================
            4. KÍNH CHẮN GIÓ KÉP VÁT NGHIÊNG 32° & CẦN GẠT NƯỚC ĐÔI
            (DOUBLE-DECK SLANTED WINDSHIELD & PANTOGRAPH WIPERS)
            ===================================================================== */}
        {/* Bảng lộ trình điện tử / Dải chống nắng trên đỉnh kính (Top Destination Sign Visor) */}
        <mesh position={[0, 0.316, dimensions.length / 2 - 0.038]} rotation={[0.36, 0, 0]}>
          <boxGeometry args={[dimensions.width - 0.024, 0.040, 0.012]} />
          <meshStandardMaterial color="#0A0F1D" roughness={0.3} metalness={0.5} />
        </mesh>
        {/* Chữ LED ma trận phát sáng lộ trình */}
        <mesh position={[0, 0.316, dimensions.length / 2 - 0.030]} rotation={[0.36, 0, 0]}>
          <boxGeometry args={[0.16, 0.014, 0.003]} />
          <meshBasicMaterial color="#00E5FF" />
        </mesh>

        {/* Kính chắn gió chính vát nghiêng sâu đón gió (Slanted Panoramic Windshield) */}
        <mesh
          position={[0, 0.238, dimensions.length / 2 - 0.012]}
          rotation={[0.36, 0, 0]}
          castShadow={castShadow}
        >
          <boxGeometry args={[dimensions.width - 0.018, 0.142, 0.034]} />
          <meshPhysicalMaterial
            color={materials.windowColor}
            roughness={materials.windowRoughness}
            metalness={materials.windowMetalness}
            transmission={materials.windowTransmission}
            thickness={0.4}
            ior={1.52}
            reflectivity={0.95}
            clearcoat={1.0}
            clearcoatRoughness={0.04}
          />
        </mesh>

        {/* Cặp cần gạt nước đôi màu đen (Dual Articulated Pantograph Wipers) */}
        {/* Cần gạt bên trái */}
        <group position={[-0.065, 0.178, dimensions.length / 2 + 0.010]} rotation={[0.32, 0, -0.18]}>
          <mesh position={[0, 0, 0]}>
            <cylinderGeometry args={[0.0035, 0.0035, 0.008, 8]} />
            <meshStandardMaterial color="#0F172A" roughness={0.4} metalness={0.8} />
          </mesh>
          <mesh position={[0.028, 0.025, 0.002]} rotation={[0, 0, 0.42]}>
            <boxGeometry args={[0.065, 0.0025, 0.0025]} />
            <meshStandardMaterial color="#0F172A" roughness={0.3} metalness={0.9} />
          </mesh>
          <mesh position={[0.042, 0.038, 0.003]} rotation={[0, 0, 0.42]}>
            <boxGeometry args={[0.075, 0.0035, 0.002]} />
            <meshStandardMaterial color="#1E293B" roughness={0.8} />
          </mesh>
        </group>

        {/* Cần gạt bên phải */}
        <group position={[0.048, 0.178, dimensions.length / 2 + 0.010]} rotation={[0.32, 0, -0.18]}>
          <mesh position={[0, 0, 0]}>
            <cylinderGeometry args={[0.0035, 0.0035, 0.008, 8]} />
            <meshStandardMaterial color="#0F172A" roughness={0.4} metalness={0.8} />
          </mesh>
          <mesh position={[0.028, 0.025, 0.002]} rotation={[0, 0, 0.42]}>
            <boxGeometry args={[0.065, 0.0025, 0.0025]} />
            <meshStandardMaterial color="#0F172A" roughness={0.3} metalness={0.9} />
          </mesh>
          <mesh position={[0.042, 0.038, 0.003]} rotation={[0, 0, 0.42]}>
            <boxGeometry args={[0.075, 0.0035, 0.002]} />
            <meshStandardMaterial color="#1E293B" roughness={0.8} />
          </mesh>
        </group>

        {/* =====================================================================
            5. TRỤ A & DẢI VIỀN MẠ BẠC HÌNH CHỮ Z ("HOCKEY STICK LINE")
            Chạy từ nóc xe qua trụ A, lượn dưới cửa sổ trước và vút lên eo xe
            ===================================================================== */}
        {/* Nẹp chữ Z bên trái */}
        <group position={[-dimensions.width / 2 - 0.004, 0, 0]}>
          <mesh position={[0, 0.252, dimensions.length / 2 - 0.028]} rotation={[0.38, 0, 0]}>
            <boxGeometry args={[0.005, 0.138, 0.016]} />
            <meshStandardMaterial
              color={materials.chromeColor}
              roughness={materials.chromeRoughness}
              metalness={materials.chromeMetalness}
            />
          </mesh>
          <mesh position={[0, 0.186, dimensions.length / 2 - 0.108]} rotation={[-0.45, 0, 0]}>
            <boxGeometry args={[0.005, 0.072, 0.014]} />
            <meshStandardMaterial
              color={materials.chromeColor}
              roughness={materials.chromeRoughness}
              metalness={materials.chromeMetalness}
            />
          </mesh>
          <mesh position={[0, 0.158, 0.02]}>
            <boxGeometry args={[0.005, 0.010, dimensions.length - 0.32]} />
            <meshStandardMaterial
              color={materials.chromeColor}
              roughness={materials.chromeRoughness}
              metalness={materials.chromeMetalness}
            />
          </mesh>
          <mesh position={[0, 0.328, -0.02]}>
            <boxGeometry args={[0.005, 0.008, dimensions.length - 0.22]} />
            <meshStandardMaterial
              color={materials.chromeColor}
              roughness={materials.chromeRoughness}
              metalness={materials.chromeMetalness}
            />
          </mesh>
        </group>

        {/* Nẹp chữ Z bên phải */}
        <group position={[dimensions.width / 2 + 0.004, 0, 0]}>
          <mesh position={[0, 0.252, dimensions.length / 2 - 0.028]} rotation={[0.38, 0, 0]}>
            <boxGeometry args={[0.005, 0.138, 0.016]} />
            <meshStandardMaterial
              color={materials.chromeColor}
              roughness={materials.chromeRoughness}
              metalness={materials.chromeMetalness}
            />
          </mesh>
          <mesh position={[0, 0.186, dimensions.length / 2 - 0.108]} rotation={[-0.45, 0, 0]}>
            <boxGeometry args={[0.005, 0.072, 0.014]} />
            <meshStandardMaterial
              color={materials.chromeColor}
              roughness={materials.chromeRoughness}
              metalness={materials.chromeMetalness}
            />
          </mesh>
          <mesh position={[0, 0.158, 0.02]}>
            <boxGeometry args={[0.005, 0.010, dimensions.length - 0.32]} />
            <meshStandardMaterial
              color={materials.chromeColor}
              roughness={materials.chromeRoughness}
              metalness={materials.chromeMetalness}
            />
          </mesh>
          <mesh position={[0, 0.328, -0.02]}>
            <boxGeometry args={[0.005, 0.008, dimensions.length - 0.22]} />
            <meshStandardMaterial
              color={materials.chromeColor}
              roughness={materials.chromeRoughness}
              metalness={materials.chromeMetalness}
            />
          </mesh>
        </group>

        {/* =====================================================================
            6. DẢI CỬA SỔ KÍNH 2 TẦNG GIƯỜNG NẰM PANORAMIC TỐI MÀU
            ===================================================================== */}
        {/* Cửa sổ sườn trái */}
        <group position={[-dimensions.width / 2 - 0.002, 0.235, -0.02]}>
          <mesh castShadow={false}>
            <boxGeometry args={[0.006, 0.155, dimensions.length - 0.24]} />
            <meshPhysicalMaterial
              color={materials.windowColor}
              roughness={materials.windowRoughness}
              metalness={materials.windowMetalness}
              transmission={materials.windowTransmission}
              thickness={0.35}
              ior={1.52}
              reflectivity={0.92}
            />
          </mesh>
          {[-0.34, -0.17, 0, 0.17, 0.34].map((zOffset, idx) => (
            <mesh key={`mullion-l-${idx}`} position={[-0.001, 0, zOffset]}>
              <boxGeometry args={[0.008, 0.155, 0.014]} />
              <meshStandardMaterial color="#09101C" roughness={0.3} metalness={0.5} />
            </mesh>
          ))}
        </group>

        {/* Cửa sổ sườn phải (Flush-bonded Panoramic Glass) */}
        <group position={[dimensions.width / 2 + 0.002, 0.235, -0.02]}>
          <mesh castShadow={false}>
            <boxGeometry args={[0.006, 0.155, dimensions.length - 0.24]} />
            <meshPhysicalMaterial
              color={materials.windowColor}
              roughness={materials.windowRoughness}
              metalness={materials.windowMetalness}
              transmission={materials.windowTransmission}
              thickness={0.35}
              ior={1.52}
              reflectivity={0.95}
              clearcoat={1.0}
              clearcoatRoughness={0.02}
            />
          </mesh>
          {[-0.34, -0.17, 0, 0.17, 0.34].map((zOffset, idx) => (
            <mesh key={`mullion-r-${idx}`} position={[0.0031, 0, zOffset]}>
              <boxGeometry args={[0.001, 0.155, 0.004]} />
              <meshStandardMaterial color="#050C16" roughness={0.2} metalness={0.8} />
            </mesh>
          ))}
        </group>

        {/* Kính sau đuôi xe */}
        <mesh position={[0, 0.242, -dimensions.length / 2 + 0.012]} castShadow={false}>
          <boxGeometry args={[dimensions.width - 0.045, 0.125, 0.008]} />
          <meshPhysicalMaterial
            color={materials.windowColor}
            roughness={materials.windowRoughness}
            metalness={materials.windowMetalness}
          />
        </mesh>

        {/* =====================================================================
            7. GƯƠNG CHIẾU HẬU KHÍ ĐỘNG HỌC CỔ THIÊN NGA (SWAN-NECK AERO MIRRORS)
            Mọc từ đỉnh mui vươn dài ra phía trước và uốn cong xuống
            ===================================================================== */}
        {/* Gương trái */}
        <group position={[-dimensions.width / 2 - 0.038, 0.31, dimensions.length / 2 - 0.05]}>
          <mesh position={[0.014, 0.020, 0.042]} rotation={[-0.42, 0.18, -0.32]}>
            <cylinderGeometry args={[0.004, 0.0055, 0.078, 12]} />
            <meshStandardMaterial color="#0E1E38" roughness={0.2} metalness={0.6} />
          </mesh>
          <mesh position={[0, -0.018, 0.082]}>
            <boxGeometry args={[0.022, 0.084, 0.038]} />
            <meshPhysicalMaterial
              color={materials.bodyColor}
              roughness={0.14}
              metalness={0.4}
              clearcoat={0.95}
            />
          </mesh>
          <mesh position={[0.012, -0.016, 0.082]} rotation={[0, 0.12, 0]}>
            <planeGeometry args={[0.032, 0.076]} />
            <meshStandardMaterial color="#FFFFFF" roughness={0.03} metalness={0.98} />
          </mesh>
        </group>

        {/* Gương phải */}
        <group position={[dimensions.width / 2 + 0.038, 0.31, dimensions.length / 2 - 0.05]}>
          <mesh position={[-0.014, 0.020, 0.042]} rotation={[-0.42, -0.18, 0.32]}>
            <cylinderGeometry args={[0.004, 0.0055, 0.078, 12]} />
            <meshStandardMaterial color="#0E1E38" roughness={0.2} metalness={0.6} />
          </mesh>
          <mesh position={[0, -0.018, 0.082]}>
            <boxGeometry args={[0.022, 0.084, 0.038]} />
            <meshPhysicalMaterial
              color={materials.bodyColor}
              roughness={0.14}
              metalness={0.4}
              clearcoat={0.95}
            />
          </mesh>
          <mesh position={[-0.012, -0.016, 0.082]} rotation={[0, -0.12, 0]}>
            <planeGeometry args={[0.032, 0.076]} />
            <meshStandardMaterial color="#FFFFFF" roughness={0.03} metalness={0.98} />
          </mesh>
        </group>

        {/* =====================================================================
            8. MẶT CA-LĂNG NỤ CƯỜI CHROME & CỤM ĐÈN PHA JEWEL LED PROJECTOR
            ===================================================================== */}
        {/* Tem sóng nhỏ trên nắp ca-pô trước (Front Hood Livery Accent) */}
        <mesh position={[0, 0.178, dimensions.length / 2 + 0.010]} rotation={[-0.14, 0, 0]}>
          <planeGeometry args={[0.16, 0.048]} />
          <meshBasicMaterial map={hoodWaveTexture} transparent depthWrite={false} />
        </mesh>

        {/* Thanh nẹp lưới tản nhiệt mạ Chrome hình nụ cười ôm lấy mũi xe */}
        <group position={[0, 0.118, dimensions.length / 2 + 0.008]}>
          <mesh>
            <boxGeometry args={[0.24, 0.036, 0.012]} />
            <meshStandardMaterial
              color={materials.chromeColor}
              roughness={materials.chromeRoughness}
              metalness={materials.chromeMetalness}
            />
          </mesh>
          {/* Huy hiệu logo tròn DANAVA mạ vàng và xanh ở trung tâm */}
          <mesh position={[0, 0, 0.008]}>
            <cylinderGeometry args={[0.014, 0.014, 0.006, 18]} />
            <meshStandardMaterial color="#00BCD4" roughness={0.1} metalness={0.9} />
          </mesh>
          <mesh position={[0, 0, 0.011]}>
            <cylinderGeometry args={[0.008, 0.008, 0.004, 18]} />
            <meshStandardMaterial color="#D4AF37" roughness={0.1} metalness={0.95} />
          </mesh>
        </group>

        {/* Cụm đèn pha Jewel LED Projector & DRL vuốt xếch sang hai bên góc */}
        {/* Cụm đèn trái */}
        <group position={[-0.118, 0.128, dimensions.length / 2 + 0.008]}>
          <mesh position={[0.002, 0.016, 0.003]}>
            <boxGeometry args={[0.066, 0.007, 0.006]} />
            <meshBasicMaterial color={materials.drlEmissive} />
          </mesh>
          <mesh position={[-0.031, 0, 0.003]}>
            <boxGeometry args={[0.007, 0.032, 0.006]} />
            <meshBasicMaterial color={materials.drlEmissive} />
          </mesh>
          <mesh position={[0.006, -0.004, 0.004]}>
            <sphereGeometry args={[0.012, 16, 16]} />
            <meshBasicMaterial color={materials.headlightColor} />
          </mesh>
          <mesh position={[-0.016, -0.004, 0.004]}>
            <sphereGeometry args={[0.009, 14, 14]} />
            <meshBasicMaterial color={materials.headlightColor} />
          </mesh>
          <mesh position={[-0.028, -0.004, 0.004]}>
            <boxGeometry args={[0.006, 0.018, 0.005]} />
            <meshBasicMaterial color="#FF9100" />
          </mesh>
          <mesh position={[0, 0, 0.006]}>
            <boxGeometry args={[0.072, 0.040, 0.003]} />
            <meshPhysicalMaterial
              color="#F0F9FF"
              roughness={0.03}
              transmission={0.92}
              thickness={0.08}
              ior={1.5}
            />
          </mesh>
        </group>

        {/* Cụm đèn phải */}
        <group position={[0.118, 0.128, dimensions.length / 2 + 0.008]}>
          <mesh position={[-0.002, 0.016, 0.003]}>
            <boxGeometry args={[0.066, 0.007, 0.006]} />
            <meshBasicMaterial color={materials.drlEmissive} />
          </mesh>
          <mesh position={[0.031, 0, 0.003]}>
            <boxGeometry args={[0.007, 0.032, 0.006]} />
            <meshBasicMaterial color={materials.drlEmissive} />
          </mesh>
          <mesh position={[-0.006, -0.004, 0.004]}>
            <sphereGeometry args={[0.012, 16, 16]} />
            <meshBasicMaterial color={materials.headlightColor} />
          </mesh>
          <mesh position={[0.016, -0.004, 0.004]}>
            <sphereGeometry args={[0.009, 14, 14]} />
            <meshBasicMaterial color={materials.headlightColor} />
          </mesh>
          <mesh position={[0.028, -0.004, 0.004]}>
            <boxGeometry args={[0.006, 0.018, 0.005]} />
            <meshBasicMaterial color="#FF9100" />
          </mesh>
          <mesh position={[0, 0, 0.006]}>
            <boxGeometry args={[0.072, 0.040, 0.003]} />
            <meshPhysicalMaterial
              color="#F0F9FF"
              roughness={0.03}
              transmission={0.92}
              thickness={0.08}
              ior={1.5}
            />
          </mesh>
        </group>

        {/* Cản dưới khí động học và hốc đèn sương mù LED vàng */}
        <mesh position={[0, 0.058, dimensions.length / 2 - 0.004]}>
          <boxGeometry args={[dimensions.width - 0.012, 0.038, 0.046]} />
          <meshStandardMaterial color="#09111D" roughness={0.4} metalness={0.4} />
        </mesh>
        <mesh position={[-0.106, 0.062, dimensions.length / 2 + 0.012]}>
          <boxGeometry args={[0.032, 0.016, 0.006]} />
          <meshBasicMaterial color={materials.fogLightColor} />
        </mesh>
        <mesh position={[0.106, 0.062, dimensions.length / 2 + 0.012]}>
          <boxGeometry args={[0.032, 0.016, 0.006]} />
          <meshBasicMaterial color={materials.fogLightColor} />
        </mesh>

        {/* =====================================================================
            9. ĐÈN HẬU LED 3D NỔI & CẢN SAU
            ===================================================================== */}
        <group position={[-0.134, 0.178, -dimensions.length / 2 - 0.003]}>
          <mesh>
            <boxGeometry args={[0.026, 0.145, 0.008]} />
            <meshBasicMaterial color={materials.taillightColor} />
          </mesh>
          <mesh position={[0, 0, -0.003]}>
            <boxGeometry args={[0.020, 0.135, 0.004]} />
            <meshBasicMaterial color={materials.taillightEmissive} />
          </mesh>
        </group>
        <group position={[0.134, 0.178, -dimensions.length / 2 - 0.003]}>
          <mesh>
            <boxGeometry args={[0.026, 0.145, 0.008]} />
            <meshBasicMaterial color={materials.taillightColor} />
          </mesh>
          <mesh position={[0, 0, -0.003]}>
            <boxGeometry args={[0.020, 0.135, 0.004]} />
            <meshBasicMaterial color={materials.taillightEmissive} />
          </mesh>
        </group>

        {/* =====================================================================
            10. LIVERY DECAL TEM SÓNG TEAL/BẠC & TYPOGRAPHY DỌC SƯỜN XE
            Bao phủ trọn vẹn từ thân dưới lên dải kính sườn (Y: 0.05 đến 0.33)
            ===================================================================== */}
        {/* Sườn trái */}
        <mesh
          position={[-dimensions.width / 2 - 0.008, 0.190, -0.01]}
          rotation={[0, -Math.PI / 2, 0]}
        >
          <planeGeometry args={[dimensions.length - 0.08, 0.28]} />
          <meshBasicMaterial
            map={leftLiveryTexture}
            transparent
            polygonOffset
            polygonOffsetFactor={-1}
            polygonOffsetUnits={-1}
            depthWrite={false}
          />
        </mesh>

        {/* Sườn phải (Mạn chính diện đón mắt nhìn của camera) */}
        <mesh
          position={[dimensions.width / 2 + 0.008, 0.190, -0.01]}
          rotation={[0, Math.PI / 2, 0]}
        >
          <planeGeometry args={[dimensions.length - 0.08, 0.28]} />
          <meshBasicMaterial
            map={rightLiveryTexture}
            transparent
            polygonOffset
            polygonOffsetFactor={-1}
            polygonOffsetUnits={-1}
            depthWrite={false}
          />
        </mesh>
      </group>

      {/* Bóng ambient tiếp xúc mặt đường mềm mại dưới gầm xe (Ground Contact AO Shadow) */}
      <mesh position={[0, 0.001, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[dimensions.width * 1.28, dimensions.length * 1.04]} />
        <meshBasicMaterial
          color="#030712"
          transparent
          opacity={0.50}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
};

interface WheelAssemblyProps {
  position: [number, number, number];
  radius: number;
  width: number;
  isLeft: boolean;
  isRear?: boolean;
  castShadow?: boolean;
  spinRef?: React.RefObject<THREE.Group | null>;
}

/**
 * Cụm bánh xe lazăng 10 lỗ mâm đúc hợp kim sâu lòng chuẩn xe thương mại hạng nặng
 * - 10 lỗ thoát nhiệt sâu lòng
 * - Vòng 10 đai ốc mạ chrome quanh moay-ơ
 * - Nắp chụp logo kim loại trung tâm
 * - Lốp xe cao su có gai lăn thực tế
 * - Đĩa phanh đục lỗ và kẹp phanh thể thao Teal
 */
const WheelAssembly: React.FC<WheelAssemblyProps> = ({
  position,
  radius,
  width,
  isLeft,
  isRear = false,
  castShadow = true,
  spinRef,
}) => {
  const { materials } = COACH_CONFIG;

  // Độ sâu lòng của mâm: Bánh sau là bánh kép (Dually) nên có lòng mâm thụt sâu hơn
  const dishDepth = isRear ? 0.008 : 0.004;

  return (
    <group position={position}>
      {/* Cụm Đĩa phanh và Kẹp phanh tĩnh (không quay theo trục lăn) */}
      <group position={[isLeft ? 0.007 : -0.007, 0, 0]}>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[radius * 0.60, radius * 0.60, 0.004, 24]} />
          <meshStandardMaterial color="#64748B" roughness={0.28} metalness={0.92} />
        </mesh>
        <mesh position={[0, radius * 0.32, 0]}>
          <boxGeometry args={[0.015, radius * 0.32, radius * 0.22]} />
          <meshStandardMaterial color={materials.brakeCaliperColor} roughness={0.25} metalness={0.7} />
        </mesh>
      </group>

      {/* Inner spin group quay theo quãng đường xe di chuyển */}
      <group ref={spinRef} name="WHEEL_SPIN">
        {/* 1. Lốp xe cao su thành dày rãnh khía thể thao (Heavy-Duty Commercial Tire) */}
        <mesh rotation={[0, 0, Math.PI / 2]} castShadow={castShadow}>
          <cylinderGeometry args={[radius, radius, width, 32]} />
          <meshStandardMaterial
            color={materials.tireColor}
            roughness={materials.tireRoughness}
            metalness={0.05}
          />
        </mesh>

        {/* Gờ vai lốp bo tròn (Tire Shoulder Lip) */}
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[radius * 0.94, radius * 0.98, width + 0.001, 32]} />
          <meshStandardMaterial color="#111418" roughness={0.92} />
        </mesh>

        {/* 2. Vành mâm đúc hợp kim bạc sáng sâu lòng (Deep-Dish Alloy Rim Barrel) */}
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[radius * 0.68, radius * 0.68, width + 0.003, 32]} />
          <meshStandardMaterial
            color={materials.rimColor}
            roughness={materials.rimRoughness}
            metalness={materials.rimMetalness}
          />
        </mesh>

        {/* Lòng mâm đúc sâu lõm vào trong (Recessed Dish Center) */}
        <mesh
          position={[isLeft ? -width / 2 + dishDepth : width / 2 - dishDepth, 0, 0]}
          rotation={[0, 0, Math.PI / 2]}
        >
          <cylinderGeometry args={[radius * 0.58, radius * 0.58, 0.006, 32]} />
          <meshStandardMaterial
            color="#D8E2EC"
            roughness={0.16}
            metalness={0.94}
          />
        </mesh>

        {/* 3. 10 LỖ THOÁT NHIỆT MÂM ĐÚC (10 RADIALLY ARRAYED VENTILATION HOLES) */}
        {Array.from({ length: 10 }).map((_, i) => {
          const angle = (i * Math.PI * 2) / 10;
          const holeDist = radius * 0.42;
          return (
            <mesh
              key={`vent-hole-${i}`}
              position={[
                isLeft ? -width / 2 - 0.002 : width / 2 + 0.002,
                Math.sin(angle) * holeDist,
                Math.cos(angle) * holeDist,
              ]}
              rotation={[0, 0, Math.PI / 2]}
            >
              <cylinderGeometry args={[0.010, 0.010, 0.005, 12]} />
              <meshBasicMaterial color="#0A0F1D" />
            </mesh>
          );
        })}

        {/* 4. VÒNG 10 ĐAI ỐC LAZĂNG MẠ CHROME (RING OF 10 LUG NUTS) */}
        {Array.from({ length: 10 }).map((_, i) => {
          const angle = (i * Math.PI * 2) / 10 + Math.PI / 10;
          const lugDist = radius * 0.26;
          return (
            <mesh
              key={`lug-nut-${i}`}
              position={[
                isLeft ? -width / 2 - 0.003 : width / 2 + 0.003,
                Math.sin(angle) * lugDist,
                Math.cos(angle) * lugDist,
              ]}
              rotation={[0, 0, Math.PI / 2]}
            >
              <cylinderGeometry args={[0.0035, 0.0035, 0.006, 6]} />
              <meshStandardMaterial
                color="#FFFFFF"
                roughness={0.08}
                metalness={0.98}
              />
            </mesh>
          );
        })}

        {/* 5. TRỤC TÂM BÁNH MẠ CHROME NẮP CHỤP LOGO (CHROME HUB CAP) */}
        <mesh
          position={[isLeft ? -width / 2 - 0.004 : width / 2 + 0.004, 0, 0]}
          rotation={[0, 0, Math.PI / 2]}
        >
          <cylinderGeometry args={[radius * 0.18, radius * 0.18, 0.008, 20]} />
          <meshStandardMaterial
            color="#FFFFFF"
            roughness={0.06}
            metalness={0.98}
          />
        </mesh>
        {/* Nút tâm tròn Teal thương hiệu */}
        <mesh
          position={[isLeft ? -width / 2 - 0.009 : width / 2 + 0.009, 0, 0]}
          rotation={[0, 0, Math.PI / 2]}
        >
          <cylinderGeometry args={[radius * 0.08, radius * 0.08, 0.003, 16]} />
          <meshBasicMaterial color="#00BCD4" />
        </mesh>
      </group>
    </group>
  );
};
