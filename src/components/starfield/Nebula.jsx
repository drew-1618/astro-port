import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { mulberry32, raDecToDirection } from '../../lib/celestial';
import { getNebulaTextures } from './textures';

/*
 * Volumetric-ish glow from layered additive sprites: faint clouds along the
 * winter Milky Way (which really runs between Orion, Gemini and Auriga), plus
 * a cloud at each real nebula / cluster listed in the sky catalog.
 */
export default function Nebula({ glows, colors }) {
  const textures = useMemo(() => getNebulaTextures(), []);
  const groupRef = useRef();

  const clouds = useMemo(() => {
    const rand = mulberry32(777);
    const list = [];
    // Winter Milky Way: roughly RA 5h–7.5h, sweeping from Auriga down through Monoceros to Puppis.
    for (let i = 0; i < 10; i++) {
      const t = i / 9;
      const ra = 5.3 + t * 2.4;
      const dec = 50 - t * 85 + (rand() - 0.5) * 10;
      list.push({
        key: `mw-${i}`,
        position: raDecToDirection(ra, dec).multiplyScalar(1250).toArray(),
        scale: 400 + rand() * 340,
        tex: i % textures.length,
        tint: ['nebula-1', 'nebula-2', 'nebula-3'][i % 3],
        opacity: 0.06 + rand() * 0.06,
        spin: (rand() - 0.5) * 0.01,
        rotation: rand() * Math.PI,
      });
    }
    glows.forEach((g, i) => {
      for (let j = 0; j < 2; j++) {
        list.push({
          key: `${g.name}-${j}`,
          position: g.position,
          scale: g.size * (j ? 1.7 : 1),
          tex: (i + j) % textures.length,
          tint: g.tint,
          opacity: j ? 0.18 : 0.42,
          spin: (rand() - 0.5) * 0.04,
          rotation: rand() * Math.PI,
        });
      }
    });
    return list;
  }, [glows, textures]);

  useFrame((_, delta) => {
    groupRef.current?.children.forEach((sprite, i) => {
      sprite.material.rotation += clouds[i].spin * delta;
    });
  });

  return (
    <group ref={groupRef}>
      {clouds.map((c) => (
        <sprite key={c.key} position={c.position} scale={[c.scale, c.scale, 1]} raycast={() => null}>
          <spriteMaterial
            map={textures[c.tex]}
            color={colors[c.tint]}
            opacity={c.opacity}
            rotation={c.rotation}
            transparent
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </sprite>
      ))}
    </group>
  );
}
