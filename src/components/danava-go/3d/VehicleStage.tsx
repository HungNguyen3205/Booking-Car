import React, { useRef, useState } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import type { VehicleCategory } from '../../../types';
import { VEHICLE_DEFINITIONS } from './vehicleConfig';
import { ROAD_CONFIG, VEHICLE_PATH_CURVE, getVehicleTransformAt } from './roadConfig';
import { SleeperCoach } from './SleeperCoach';
import type { TimelineProgress } from './journeyTimeline';

// Requirements 2 & 3: Lazy-load non-default vehicles on demand
const LimousineVan = React.lazy(() =>
  import('./LimousineVan').then((m) => ({ default: m.LimousineVan }))
);
const CabinCoach = React.lazy(() =>
  import('./CabinCoach').then((m) => ({ default: m.CabinCoach }))
);

interface VehicleStageProps {
  currentVehicle: VehicleCategory;
  shouldReduceMotion?: boolean;
  timelineRef?: React.RefObject<TimelineProgress | null>;
  replayKey?: number;
  onVehicleError?: (failedCategory: VehicleCategory, fallbackCategory: VehicleCategory) => void;
}

const TOTAL_CURVE_DISTANCE = 4.411; // Chiều dài cung đường cong xe chạy

/**
 * Slot render độc lập cho từng instance xe trong Scene Graph
 * Tự quản lý transform vị trí, góc yaw, quay bánh và độ mờ opacity trực tiếp trong useFrame
 * Đảm bảo ZERO React re-renders trong suốt quá trình chuyển động và không vi phạm quy tắc linter
 */
const VehicleSlotInstance: React.FC<{
  category: VehicleCategory;
  isExiting: boolean;
  isTransitionActive: boolean;
  duration: number;
  timelineRef?: React.RefObject<TimelineProgress | null>;
  shouldReduceMotion?: boolean;
  replayKey?: number;
  onExited?: () => void;
}> = ({
  category,
  isExiting,
  isTransitionActive,
  duration,
  timelineRef,
  shouldReduceMotion = false,
  replayKey = 0,
  onExited,
}) => {
  const rootRef = useRef<THREE.Group>(null);
  const elapsedRef = useRef<number>(0);
  const isCompleteRef = useRef<boolean>(false);

  // Điểm đỗ chuẩn stopT = 0.62
  const stopT = ROAD_CONFIG.vehicleKeyframes.stopT;
  const wheelRadius = VEHICLE_DEFINITIONS[category].dimensions.wheelRadius;

  useFrame((_, delta) => {
    if (!rootRef.current) return;

    // 1. Nếu đang trong giai đoạn Intro mở màn (chưa sẵn sàng)
    if (timelineRef?.current && !timelineRef.current.isReady) {
      if (isExiting) {
        rootRef.current.visible = false;
        return;
      }

      const p = Math.max(0, Math.min(1.0, timelineRef.current.vehicleProgress));
      if (p <= 0.001) {
        rootRef.current.visible = false;
        return;
      }

      rootRef.current.visible = true;
      const currentT = 0.0 + stopT * p;
      const pt = VEHICLE_PATH_CURVE.getPointAt(currentT);
      const tangent = VEHICLE_PATH_CURVE.getTangentAt(currentT).normalize();
      const yaw = Math.atan2(tangent.x, tangent.z);

      rootRef.current.position.set(pt.x, pt.y, pt.z);
      rootRef.current.rotation.y = yaw;

      const wheelAngle = (TOTAL_CURVE_DISTANCE * currentT) / wheelRadius;
      rootRef.current.traverse((child) => {
        if (child.name === 'WHEEL_SPIN') {
          child.rotation.x = wheelAngle;
        }
      });
      return;
    }

    // 2. Chế độ chuyển đổi xe (Vehicle Switch Transition 0.5s - 0.8s)
    if (isExiting) {
      // Xe cũ đang rời đi
      if (isCompleteRef.current) {
        rootRef.current.visible = false;
        return;
      }

      elapsedRef.current += Math.min(delta, 0.04);
      const u = Math.min(1.0, elapsedRef.current / duration);

      if (u >= 1.0 || shouldReduceMotion) {
        isCompleteRef.current = true;
        rootRef.current.visible = false;
        onExited?.();
        return;
      }

      rootRef.current.visible = true;
      // Xe cũ trượt nhẹ tới trước +0.07 trên đường cong và fade out 1.0 -> 0.0
      const exitEased = 1 - Math.pow(1 - u, 2);
      const currentT = Math.min(0.70, stopT + 0.07 * exitEased);
      const pt = VEHICLE_PATH_CURVE.getPointAt(currentT);
      const tangent = VEHICLE_PATH_CURVE.getTangentAt(currentT).normalize();
      const yaw = Math.atan2(tangent.x, tangent.z);
      const opacity = Math.max(0, 1.0 - u);

      rootRef.current.position.set(pt.x, pt.y, pt.z);
      rootRef.current.rotation.y = yaw;

      const wheelAngle = (TOTAL_CURVE_DISTANCE * currentT) / wheelRadius;
      rootRef.current.traverse((child) => {
        if (child.name === 'WHEEL_SPIN') {
          child.rotation.x = wheelAngle;
        }
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach((m) => {
              m.transparent = opacity < 0.999;
              m.opacity = opacity;
            });
          } else if (mesh.material) {
            mesh.material.transparent = opacity < 0.999;
            mesh.material.opacity = opacity;
          }
        }
      });
      return;
    }

    // 3. Xe mới đang hiển thị chính (Active Vehicle)
    rootRef.current.visible = true;

    if (isTransitionActive && !shouldReduceMotion) {
      // Đang trong tiến trình chuyển vào (slide in từ -0.09 và fade in 0 -> 1)
      elapsedRef.current += Math.min(delta, 0.04);
      const u = Math.min(1.0, elapsedRef.current / duration);

      const enterEased = 1 - Math.pow(1 - u, 3);
      const currentT = (stopT - 0.09) + 0.09 * enterEased;
      const pt = VEHICLE_PATH_CURVE.getPointAt(currentT);
      const tangent = VEHICLE_PATH_CURVE.getTangentAt(currentT).normalize();
      const yaw = Math.atan2(tangent.x, tangent.z);
      const opacity = Math.min(1.0, u * 1.5);

      rootRef.current.position.set(pt.x, pt.y, pt.z);
      rootRef.current.rotation.y = yaw;

      const wheelAngle = (TOTAL_CURVE_DISTANCE * currentT) / wheelRadius;
      rootRef.current.traverse((child) => {
        if (child.name === 'WHEEL_SPIN') {
          child.rotation.x = wheelAngle;
        }
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach((m) => {
              m.transparent = opacity < 0.999;
              m.opacity = opacity;
            });
          } else if (mesh.material) {
            mesh.material.transparent = opacity < 0.999;
            mesh.material.opacity = opacity;
          }
        }
      });
      return;
    }

    // Trạng thái đỗ tĩnh ổn định (Ready Idle at stopT = 0.62)
    const defaultTransform = getVehicleTransformAt(stopT);
    rootRef.current.position.set(
      defaultTransform.position.x,
      defaultTransform.position.y,
      defaultTransform.position.z
    );
    rootRef.current.rotation.y = defaultTransform.yawAngle;

    const stopWheelAngle = (TOTAL_CURVE_DISTANCE * stopT) / wheelRadius;
    rootRef.current.traverse((child) => {
      if (child.name === 'WHEEL_SPIN') {
        child.rotation.x = stopWheelAngle;
      }
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach((m) => {
            m.transparent = false;
            m.opacity = 1.0;
          });
        } else if (mesh.material) {
          mesh.material.transparent = false;
          mesh.material.opacity = 1.0;
        }
      }
    });
  });

  return (
    <group
      ref={rootRef}
      name={`VEHICLE_SLOT_${category.toUpperCase()}_${isExiting ? 'EXIT' : 'ACTIVE'}`}
    >
      {category === 'sleeper' && (
        <SleeperCoach
          autoAnimate={false}
          shouldReduceMotion={shouldReduceMotion}
          replayKey={replayKey}
          position={[0, 0, 0]}
          yawAngle={0}
        />
      )}
      <React.Suspense fallback={null}>
        {category === 'limousine' && (
          <LimousineVan
            position={[0, 0, 0]}
            yawAngle={0}
          />
        )}
        {category === 'cabin' && (
          <CabinCoach
            position={[0, 0, 0]}
            yawAngle={0}
          />
        )}
      </React.Suspense>
    </group>
  );
};

/**
 * Trình điều phối hiển thị và chuyển xe thông minh (VehicleStage)
 * Thực hiện:
 * 1. Chuyển đổi mượt mà 0.6s (Xe cũ trượt nhẹ & fade out -> Xe mới tiến vào đỗ)
 * 2. Cơ chế Latest-Wins: Bấm nhanh chuyển ngay đến lựa chọn cuối, không xếp hàng chạy xe cũ
 * 3. Không morphing hình học (render hai mesh độc lập có fade riêng)
 * 4. Tôn trọng Reduced Motion (đổi trực tiếp tại chỗ không trượt)
 * 5. Giữ vững 4 bánh chạm đường tại Y = 0.020
 */
export const VehicleStage: React.FC<VehicleStageProps> = ({
  currentVehicle,
  shouldReduceMotion = false,
  timelineRef,
  replayKey = 0,
  onVehicleError,
}) => {
  const [activeCategory, setActiveCategory] = useState<VehicleCategory>(currentVehicle);
  const [exitingCategory, setExitingCategory] = useState<VehicleCategory | null>(null);
  const [transitionKey, setTransitionKey] = useState<number>(0);
  const [prevProp, setPrevProp] = useState<VehicleCategory>(currentVehicle);

  // React Standard Pattern: Adjusting state when a prop changes
  if (currentVehicle !== prevProp) {
    setPrevProp(currentVehicle);

    // Rule 10: Asset lỗi giữ xe trước, báo trạng thái nhẹ
    const targetDef = VEHICLE_DEFINITIONS[currentVehicle];
    if (targetDef.assetStatus === 'error') {
      onVehicleError?.(currentVehicle, activeCategory);
    } else {
      // Latest-Wins: Bấm nhanh chuyển ngay sang xe mới nhất, không xếp hàng xe trung gian
      setExitingCategory(activeCategory);
      setActiveCategory(currentVehicle);
      setTransitionKey((k) => k + 1);
    }
  }

  const duration = shouldReduceMotion ? 0.05 : 0.60;

  return (
    <group name="DANAVA_VEHICLE_STAGE">
      {/* 1. XE CHÍNH (ACTIVE / ENTERING VEHICLE) */}
      <VehicleSlotInstance
        key={`active-${activeCategory}-${transitionKey}`}
        category={activeCategory}
        isExiting={false}
        isTransitionActive={transitionKey > 0}
        duration={duration}
        timelineRef={timelineRef}
        shouldReduceMotion={shouldReduceMotion}
        replayKey={replayKey}
      />

      {/* 2. XE CŨ ĐANG RỜI ĐI TRONG QUÁ TRÌNH CHUYỂN ĐỔI (EXITING VEHICLE) */}
      {exitingCategory && (
        <VehicleSlotInstance
          key={`exiting-${exitingCategory}-${transitionKey}`}
          category={exitingCategory}
          isExiting={true}
          isTransitionActive={true}
          duration={duration}
          timelineRef={timelineRef}
          shouldReduceMotion={shouldReduceMotion}
          replayKey={replayKey}
          onExited={() => setExitingCategory(null)}
        />
      )}
    </group>
  );
};
