import { Suspense, useMemo, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { AdaptiveDpr } from '@react-three/drei';
import { useThemeColors } from '../lib/theme';
import BackgroundStars from './starfield/BackgroundStars';
import Nebula from './starfield/Nebula';
import SectorCluster from './starfield/SectorCluster';
import CameraRig from './starfield/CameraRig';

/*
 * The 3D sky. Everything rendered here is derived from props: `sectors` come
 * from portfolioData and `sky` (real star positions, stick figures, nebulae)
 * is built from them in App, so new content automatically produces new stars.
 */
export default function StarfieldCanvas({
  theme,
  sectors,
  sky,
  activeSectorId,
  focusedItemId,
  pose,
  reducedMotion,
  cameraRef,
  onSelectSector,
  onSelectItem,
  onSlewChange,
}) {
  const colors = useThemeColors(theme);
  const glows = useMemo(() => Object.values(sky.sectors).flatMap((s) => s.glows), [sky]);
  // The Canvas camera is created once, at whatever pose the app starts in.
  const startPose = useRef(pose).current;

  return (
    <Canvas
      className="!fixed inset-0"
      flat
      dpr={[1, 2]}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      camera={{ position: startPose.position, fov: startPose.fov, near: 0.1, far: 4000 }}
    >
      <color attach="background" args={[colors.bg]} />
      <AdaptiveDpr pixelated={false} />
      <Suspense fallback={null}>
        <BackgroundStars colors={colors} />
        <Nebula glows={glows} colors={colors} />
        {sectors.map((sector) => (
          <SectorCluster
            key={sector.id}
            sector={sector}
            sky={sky.sectors[sector.id]}
            colors={colors}
            active={activeSectorId === sector.id}
            anyActive={activeSectorId !== null}
            focusedItemId={focusedItemId}
            onSelectSector={onSelectSector}
            onSelectItem={onSelectItem}
          />
        ))}
      </Suspense>
      <CameraRig pose={pose} reducedMotion={reducedMotion} onSlewChange={onSlewChange} cameraRef={cameraRef} />
    </Canvas>
  );
}
