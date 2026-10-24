import React, { useMemo } from 'react';
import * as THREE from 'three';
import {
  VEHICLE_PATH_CURVE,
  ROAD_CONFIG,
  getVehicleTransformAt,
} from './roadConfig';

interface CurvedRoadProps {
  isDebug?: boolean;
}

/**
 * Hàm sinh Ribbon BufferGeometry uốn lượn chính xác dọc theo Curve
 */
function createRibbonGeometry(
  curve: THREE.Curve<THREE.Vector3>,
  innerOffset: number,
  outerOffset: number,
  elevationY: number,
  segments: number = 80
): THREE.BufferGeometry {
  const geom = new THREE.BufferGeometry();
  const positions: number[] = [];
  const normals: number[] = [];
  const indices: number[] = [];

  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const pt = curve.getPointAt(t);
    const tangent = curve.getTangentAt(t).normalize();
    // Normal vuông góc trên mặt phẳng X-Z
    const normalXZ = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

    // Điểm mép trong và mép ngoài
    const leftX = pt.x + normalXZ.x * innerOffset;
    const leftZ = pt.z + normalXZ.z * innerOffset;

    const rightX = pt.x + normalXZ.x * outerOffset;
    const rightZ = pt.z + normalXZ.z * outerOffset;

    positions.push(leftX, elevationY, leftZ);
    positions.push(rightX, elevationY, rightZ);

    normals.push(0, 1, 0);
    normals.push(0, 1, 0);

    if (i < segments) {
      const baseIdx = i * 2;
      // 2 tam giác cho mỗi quad
      indices.push(baseIdx, baseIdx + 1, baseIdx + 2);
      indices.push(baseIdx + 1, baseIdx + 3, baseIdx + 2);
    }
  }

  geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geom.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geom.setIndex(indices);
  return geom;
}

/**
 * Sinh các vạch kẻ tim đường (Dashed Centerline) ngắt quãng màu vàng ấm
 */
function createCenterlineDashesGeometry(
  curve: THREE.Curve<THREE.Vector3>,
  dashLength: number,
  dashGap: number,
  dashWidth: number,
  elevationY: number
): THREE.BufferGeometry {
  const geom = new THREE.BufferGeometry();
  const positions: number[] = [];
  const normals: number[] = [];
  const indices: number[] = [];

  const totalLength = curve.getLength();
  let currentDist = 0.08; // Cách đầu đường một khoảng nhỏ
  let quadCount = 0;

  while (currentDist + dashLength < totalLength - 0.05) {
    const startT = currentDist / totalLength;
    const endT = (currentDist + dashLength) / totalLength;

    // Lấy 4 mẫu dọc theo từng vạch để vạch ôm sát theo độ cong
    const subSamples = 4;
    const startVertexIdx = positions.length / 3;

    for (let s = 0; s <= subSamples; s++) {
      const t = startT + (endT - startT) * (s / subSamples);
      const pt = curve.getPointAt(t);
      const tangent = curve.getTangentAt(t).normalize();
      const normalXZ = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

      const halfW = dashWidth / 2;
      const lx = pt.x - normalXZ.x * halfW;
      const lz = pt.z - normalXZ.z * halfW;

      const rx = pt.x + normalXZ.x * halfW;
      const rz = pt.z + normalXZ.z * halfW;

      positions.push(lx, elevationY, lz);
      positions.push(rx, elevationY, rz);

      normals.push(0, 1, 0);
      normals.push(0, 1, 0);

      if (s < subSamples) {
        const base = startVertexIdx + s * 2;
        indices.push(base, base + 1, base + 2);
        indices.push(base + 1, base + 3, base + 2);
      }
    }

    quadCount++;
    currentDist += dashLength + dashGap;
  }

  geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geom.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geom.setIndex(indices);
  return geom;
}

export const CurvedRoad: React.FC<CurvedRoadProps> = ({ isDebug = false }) => {
  const { dimensions, colors, vehicleKeyframes } = ROAD_CONFIG;

  // 1. Mặt đường nhựa xám than (Asphalt roadway)
  const asphaltGeometry = useMemo(() => {
    const halfW = dimensions.roadWidth / 2;
    return createRibbonGeometry(
      VEHICLE_PATH_CURVE,
      -halfW,
      halfW,
      dimensions.roadY,
      80
    );
  }, [dimensions]);

  // 2. Gờ lề đường bên trái và bên phải (Road shoulders)
  const shoulderGeometry = useMemo(() => {
    const halfW = dimensions.roadWidth / 2;
    const totalHalfW = halfW + dimensions.shoulderWidth;
    return createRibbonGeometry(
      VEHICLE_PATH_CURVE,
      -totalHalfW,
      totalHalfW,
      dimensions.roadY - 0.0015,
      80
    );
  }, [dimensions]);

  // 3. Vạch sơn tim đường đứt đoạn (Dashed Centerline)
  const centerlineGeometry = useMemo(() => {
    return createCenterlineDashesGeometry(
      VEHICLE_PATH_CURVE,
      dimensions.dashLength,
      dimensions.dashGap,
      dimensions.dashWidth,
      dimensions.dashY
    );
  }, [dimensions]);

  // 4. Debug: Điểm dừng đỗ tĩnh của xe
  const stopTransform = useMemo(() => {
    return getVehicleTransformAt(vehicleKeyframes.stopT);
  }, [vehicleKeyframes.stopT]);

  // 5. Debug: Điểm xuất phát của xe
  const entryTransform = useMemo(() => {
    return getVehicleTransformAt(vehicleKeyframes.entryT);
  }, [vehicleKeyframes.entryT]);

  // 6. Debug: Đường nối tim đường liên tục (Three.js Line object)
  const debugTrajectoryLine = useMemo(() => {
    if (!isDebug) return null;
    const pts = VEHICLE_PATH_CURVE.getPoints(120);
    const positions = new Float32Array(pts.length * 3);
    pts.forEach((p, i) => {
      positions[i * 3] = p.x;
      positions[i * 3 + 1] = p.y + 0.01;
      positions[i * 3 + 2] = p.z;
    });
    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.LineBasicMaterial({ color: colors.debugTrajectory });
    return new THREE.Line(geom, mat);
  }, [isDebug, colors.debugTrajectory]);

  return (
    <group name="DANAVA_CURVED_ROAD">
      {/* Gờ lề đường (Shoulders) */}
      <mesh
        geometry={shoulderGeometry}
        receiveShadow
      >
        <meshStandardMaterial
          color={colors.shoulder}
          roughness={0.9}
          metalness={0.02}
        />
      </mesh>

      {/* Mặt đường nhựa (Asphalt Road Surface) */}
      <mesh
        geometry={asphaltGeometry}
        receiveShadow
      >
        <meshStandardMaterial
          color={colors.asphalt}
          roughness={0.88}
          metalness={0.05}
        />
      </mesh>

      {/* Vạch kẻ tim đường vàng ấm (Dashed Centerline) */}
      <mesh geometry={centerlineGeometry}>
        <meshBasicMaterial
          color={colors.centerline}
          depthWrite={false}
        />
      </mesh>

      {/* =======================================================================
          DEBUG MARKERS & VEHICLE STOP POINT (Chỉ hiển thị khi ?debug=1)
          ======================================================================= */}
      {isDebug && (
        <group name="DEBUG_ROAD_HELPERS">
          {/* Đường dẫn tim đường nối tiếp (Trajectory line) */}
          {debugTrajectoryLine && (
            <primitive object={debugTrajectoryLine} />
          )}

          {/* Marker điểm xe tiến vào (Entry point t = 0.0) */}
          <group position={entryTransform.position}>
            <mesh position={[0, 0.08, 0]}>
              <sphereGeometry args={[0.07, 16, 16]} />
              <meshBasicMaterial color={colors.debugEntry} />
            </mesh>
          </group>

          {/* Marker điểm xe dừng đỗ tĩnh (Stop point t = 0.62) */}
          <group
            position={stopTransform.position}
            rotation={[0, stopTransform.yawAngle, 0]}
          >
            {/* Sphere tâm điểm dừng */}
            <mesh position={[0, 0.08, 0]}>
              <sphereGeometry args={[0.07, 16, 16]} />
              <meshBasicMaterial color={colors.debugStop} />
            </mesh>

            {/* Khối hộp mô phỏng tỷ lệ xe và hướng đỗ chếch 3/4 đón mắt nhìn */}
            <mesh position={[0, 0.16, 0]}>
              <boxGeometry args={[0.32, 0.22, 0.65]} />
              <meshBasicMaterial
                color={colors.debugStop}
                wireframe
              />
            </mesh>
          </group>
        </group>
      )}
    </group>
  );
};
