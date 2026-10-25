import React from 'react';
import { DANAVA_3D_CONFIG } from './environmentConfig';

export const Environment: React.FC = () => {
  const { colors, lighting, ground, atmosphere } = DANAVA_3D_CONFIG;

  return (
    <>
      {/* Background and atmospheric fog perfectly blended into page cream tone */}
      <color attach="background" args={[colors.background]} />
      <fog
        attach="fog"
        args={[colors.background, atmosphere.fog.near, atmosphere.fog.far]}
      />

      <hemisphereLight args={["#fff8e9", "#b6b9aa", 1.2]} />
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


    </>
  );
};
