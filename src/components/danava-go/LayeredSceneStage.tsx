import { useJourneyReducedMotion, useJourneyMobile } from './useJourneyReducedMotion';
import React, { useEffect, useId, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { decodeJourneyImage, getJourneyLandmark, JOURNEY_ROAD, type JourneyLandmark } from './journeyStageConfig';

// Separate slots: changing one city never replaces the road or the other city.
function Landmark({ city, role }: { city: string; role: 'origin' | 'destination' }) {
  const reduced = useJourneyReducedMotion();
  const mobile = useJourneyMobile();
  const slotId = useId().replace(/:/g, '');
  const [scene, setScene] = useState<JourneyLandmark>(() => getJourneyLandmark(city));
  useEffect(() => {
    let current = true;
    const target = getJourneyLandmark(city);
    decodeJourneyImage(target.image).then(() => { if (current) setScene(target); })
      .catch(() => { if (current) setScene({ ...target, image: '', landmark: 'Miền đất mới' }); });
    return () => { current = false; };
  }, [city]);
  const clip = `${slotId}-${scene.id}-crop`;
  const [cx, cy, cw, ch] = scene.crop;
  const x = role === 'origin' ? -35 : 1120;
  // Each atlas crop is independently projected onto the same 1600x1000 camera.
  const width = 560;
  const height = Math.min(360, width * ch / cw);
  return <div className={`journey-landmark journey-landmark-${role}`} data-landmark-slot={role} data-city={scene.id}>
    <AnimatePresence initial={false}>
      <motion.div className="journey-landmark-content" key={`${scene.id}:${scene.image}`}
        initial={{ opacity: reduced ? 1 : 0, y: reduced ? 0 : 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: reduced ? 0 : .5 }}>
        <svg className="journey-landmark-plane" viewBox="0 0 1600 1000" preserveAspectRatio={mobile ? "xMidYMax meet" : "xMidYMid slice"} aria-hidden="true">
          {scene.image ? <svg x={x} y={690 - height} width={width} height={height} viewBox={`${cx} ${cy} ${cw} ${ch}`} preserveAspectRatio="xMidYMax meet">
            <defs><clipPath id={clip}><rect x={cx} y={cy} width={cw} height={ch} /></clipPath></defs>
            <image href={scene.image} width={scene.source[0]} height={scene.source[1]} clipPath={`url(#${clip})`}
              onError={() => setScene(old => old.image === scene.image ? { ...old, image: '', landmark: 'Miền đất mới' } : old)} />
          </svg> : <path d={`M${x} 660 q100 -150 220 -25 t300 25 v40 h-520z`} fill="#52796f" opacity=".4" />}
        </svg>
        <div className="journey-landmark-label"><span>{role === 'origin' ? 'ĐIỂM ĐI' : 'ĐIỂM ĐẾN'}</span><strong>{scene.city}</strong><small>{scene.landmark}</small></div>
      </motion.div>
    </AnimatePresence>
  </div>;
}
export const LayeredSceneStage: React.FC<{ fromCity: string; toCity: string; className?: string }> = ({ fromCity, toCity, className = '' }) => {
  const [roadError, setRoadError] = useState(false);
  const mobile = useJourneyMobile();
  return <div className={`journey-scenery ${className}`} aria-hidden="true">
    <svg className="journey-road" data-testid="journey-fixed-road" viewBox="0 0 1600 1000" preserveAspectRatio={mobile ? "xMidYMax meet" : "xMidYMid slice"}>
      {!roadError ? <image href={JOURNEY_ROAD} width="1600" height="1000" preserveAspectRatio="none" onError={() => setRoadError(true)} /> : <>
        <rect width="1600" height="1000" fill="#f7f4ec" />
        <path d="M180 650 C0 720 350 760 700 810 S1400 950 1700 980" stroke="#dad7c8" strokeWidth="180" fill="none" />
        <path d="M180 650 C0 720 350 760 700 810 S1400 950 1700 980" stroke="#646c73" strokeWidth="150" fill="none" />
        <path d="M180 650 C0 720 350 760 700 810 S1400 950 1700 980" stroke="#f5e5b7" strokeWidth="3" strokeDasharray="22 20" fill="none" />
      </>}
    </svg>
    <Landmark city={fromCity} role="origin" /><Landmark city={toCity} role="destination" />
  </div>;
};
