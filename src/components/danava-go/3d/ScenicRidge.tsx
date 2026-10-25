import { useEffect, useMemo } from 'react';
import * as THREE from 'three';

export function ScenicRidge({ width = 2.4, depth = 1, height = .65, color = '#7A9988' }: { width?: number; depth?: number; height?: number; color?: string }) {
  const geometry = useMemo(() => {
    const g = new THREE.PlaneGeometry(width, depth, 48, 24);
    g.rotateX(-Math.PI / 2);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i) / (width / 2), z = p.getZ(i) / (depth / 2);
      const envelope = Math.pow(Math.max(0, 1 - x*x), .65) * Math.pow(Math.max(0, 1 - z*z), .7);
      const peaks = .72 + .19 * Math.sin(x*6 + z*2) + .09 * Math.cos(x*11-z*4);
      p.setY(i, height * envelope * peaks);
    }
    g.computeVertexNormals();
    return g;
  }, [width, depth, height]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return <mesh geometry={geometry} receiveShadow><meshStandardMaterial color={color} roughness={1} side={THREE.DoubleSide} /></mesh>;
}
