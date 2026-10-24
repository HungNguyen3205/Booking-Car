import React, { useMemo } from 'react';
import * as THREE from 'three';
import { DANAVA_3D_CONFIG } from './environmentConfig';

export const Environment: React.FC = () => {
  // Generate a very soft, faint distant horizon curve (no buildings, no vehicles)
  const ridgeGeometry = useMemo(() => {
    const geom = new THREE.PlaneGeometry(1, 1, 24, 1);
    const pos = geom.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      // Faint gentle hill curvature
      const yOffset = Math.sin(x * Math.PI * 2.5) * 0.12 + Math.cos(x * Math.PI * 4.2) * 0.06;
      pos.setY(i, pos.getY(i) + yOffset);
    }
    geom.computeVertexNormals();
    return geom;
  }, []);

  const { colors, lighting, ground, atmosphere } = DANAVA_3D_CONFIG;

  return (
    <>
      {/* Background and atmospheric fog perfectly blended into page cream tone */}
      <color attach="background" args={[colors.background]} />
      <fog
        attach="fog"
        args={[colors.background, atmosphere.fog.near, atmosphere.fog.far]}
      />

      {/* Unified Ambient Sunlight Fill */}
      <ambientLight
        color={colors.ambient}
        intensity={lighting.ambient.intensity}
      />

      {/* Primary Directional Key Light (Casts soft contact shadows onto ground plane) */}
      <directionalLight
        position={lighting.keyLight.position}
        intensity={lighting.keyLight.intensity}
        color={colors.sunLight}
        castShadow={lighting.keyLight.castShadow}
        shadow-mapSize-width={lighting.keyLight.shadowMapSize}
        shadow-mapSize-height={lighting.keyLight.shadowMapSize}
        shadow-bias={lighting.keyLight.shadowBias}
        shadow-camera-near={lighting.keyLight.shadowCamera.near}
        shadow-camera-far={lighting.keyLight.shadowCamera.far}
        shadow-camera-left={-lighting.keyLight.shadowCamera.size}
        shadow-camera-right={lighting.keyLight.shadowCamera.size}
        shadow-camera-top={lighting.keyLight.shadowCamera.size}
        shadow-camera-bottom={-lighting.keyLight.shadowCamera.size}
      />

      {/* Sky Bounce Fill Light (Slightly cooler teal tone to prevent stark black shadows) */}
      <directionalLight
        position={lighting.fillLight.position}
        intensity={lighting.fillLight.intensity}
        color={colors.skyBounce}
      />

      {/* Ground Plane Receiving Shadow (Seamlessly transparent, only shadows visible) */}
      <mesh
        position={ground.position}
        rotation={ground.rotation}
        receiveShadow
      >
        <planeGeometry args={[ground.width, ground.height]} />
        <shadowMaterial
          opacity={ground.shadowOpacity}
          color={colors.shadowTone}
        />
      </mesh>

      {/* Faint distant landscape silhouette (Atmospheric depth only, completely devoid of architecture or cars) */}
      <mesh
        geometry={ridgeGeometry}
        position={atmosphere.distantRidge.position}
        scale={atmosphere.distantRidge.scale}
      >
        <meshBasicMaterial
          color={colors.distantHills}
          transparent
          opacity={atmosphere.distantRidge.opacity}
          depthWrite={false}
        />
      </mesh>
    </>
  );
};
