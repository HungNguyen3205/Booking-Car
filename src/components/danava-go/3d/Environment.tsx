import React, { useEffect, useMemo } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { DANAVA_3D_CONFIG } from './environmentConfig';

export const Environment: React.FC = () => {
  const { colors, lighting, ground, atmosphere } = DANAVA_3D_CONFIG;
  const { gl } = useThree();

  // Sinh bản đồ phản xạ môi trường IBL (Studio Sky & Horizon Gradient)
  // Giúp lớp sơn bóng ô tô clearcoat và mặt ca-lăng chrome phản chiếu ánh sáng chân thực
  const envTexture = useMemo(() => {
    if (typeof document === 'undefined') return null;
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Gradient bầu trời chuyển tiếp xuống mặt đất
    const grad = ctx.createLinearGradient(0, 0, 0, 256);
    grad.addColorStop(0.0, '#FFFFFF'); // Thiên đỉnh trắng sáng (Zenith sun highlight)
    grad.addColorStop(0.25, '#F0F9FF'); // Vòm trời xanh ngọc nhạt
    grad.addColorStop(0.48, '#F7F4EC'); // Đường chân trời hòa màu kem thương hiệu
    grad.addColorStop(0.52, '#E2DCD0'); // Dải bờ kè / mặt đường chân trời
    grad.addColorStop(0.75, '#CBD5E1'); // Phản quang mặt đất
    grad.addColorStop(1.0, '#64748B'); // Đáy đất sâu
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 256);

    // Vệt sáng Key Light studio (nắng chiếu trên mui xe và vòm kính)
    const sunSpot = ctx.createRadialGradient(140, 60, 2, 140, 60, 75);
    sunSpot.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
    sunSpot.addColorStop(0.3, 'rgba(255, 250, 235, 0.7)');
    sunSpot.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = sunSpot;
    ctx.fillRect(40, 0, 200, 130);

    // Vệt sáng Rim Light sườn xe (tôn tem sóng teal và viền bạc)
    const rimSpot = ctx.createRadialGradient(380, 80, 2, 380, 80, 65);
    rimSpot.addColorStop(0, 'rgba(224, 247, 250, 0.85)');
    rimSpot.addColorStop(1, 'rgba(224, 247, 250, 0)');
    ctx.fillStyle = rimSpot;
    ctx.fillRect(300, 10, 180, 140);

    const texture = new THREE.CanvasTexture(canvas);
    texture.mapping = THREE.EquirectangularReflectionMapping;
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }, []);

  const envMap = useMemo(() => {
    if (!envTexture || !gl) return null;
    const pmrem = new THREE.PMREMGenerator(gl);
    pmrem.compileEquirectangularShader();
    const target = pmrem.fromEquirectangular(envTexture).texture;
    pmrem.dispose();
    return target;
  }, [envTexture, gl]);

  useEffect(() => {
    return () => {
      if (envMap) envMap.dispose();
    };
  }, [envMap]);

  return (
    <>
      {/* Declarative IBL Studio Environment Map */}
      {envMap && <primitive object={envMap} attach="environment" />}

      {/* Background and atmospheric fog perfectly blended into page cream tone */}
      <color attach="background" args={[colors.background]} />
      <fog
        attach="fog"
        args={[colors.background, atmosphere.fog.near, atmosphere.fog.far]}
      />

      <hemisphereLight args={['#fff8e9', '#b6b9aa', 1.1]} />
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

