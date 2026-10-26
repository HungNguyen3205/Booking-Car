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
  const clip = `${slotId}-${scene.id}-${scene.image ? 'photo' : 'fallback'}-crop`;
  const [cx, cy, cw, ch] = scene.crop;
  const x = role === 'origin' ? scene.frame.originX : scene.frame.destinationX;
  const width = 1200;
  const height = width * ch / cw;
  return <div className={`journey-landmark journey-landmark-${role}`} data-landmark-slot={role} data-city={scene.id}>
    <AnimatePresence initial={false}>
      <motion.div className="journey-landmark-content" key={`${scene.id}:${scene.image}`}
        initial={{ opacity: reduced ? 1 : 0, y: reduced ? 0 : 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: reduced ? 0 : .5 }}>
        <svg className="journey-landmark-plane" viewBox="0 0 1600 1000" preserveAspectRatio={mobile ? "xMidYMax meet" : "xMidYMid slice"} aria-hidden="true">
          <defs>
            <linearGradient id={`${clip}-zone`}>
              {role === 'origin' ? <><stop offset="32%" stopColor="white"/><stop offset="57%" stopColor="black"/></> : <><stop offset="49%" stopColor="black"/><stop offset="68%" stopColor="white"/></>}
            </linearGradient>
            <linearGradient id={`${clip}-water`} x1="0" y1="0" x2="0" y2="1"><stop offset="57%" stopColor="white"/><stop offset="69%" stopColor="black"/></linearGradient>
            <mask id={`${clip}-bank-mask`} maskUnits="userSpaceOnUse" x="0" y="0" width="1600" height="1000"><rect width="1600" height="1000" fill={`url(#${clip}-zone)`}/></mask>
            <mask id={`${clip}-water-mask`} maskUnits="userSpaceOnUse" x="0" y="0" width="1600" height="1000"><rect width="1600" height="1000" fill={`url(#${clip}-water)`}/></mask>
          </defs>
          {scene.image ? <g mask={`url(#${clip}-bank-mask)`}><g mask={`url(#${clip}-water-mask)`}>
            <svg x={x} y={scene.frame.y} width={width} height={height} viewBox={`${cx} ${cy} ${cw} ${ch}`} preserveAspectRatio="none" data-bank-image={scene.id}>
              <defs>
                <clipPath id={clip}><rect x={cx} y={cy} width={cw} height={ch}/></clipPath>
                <linearGradient id={`${clip}-edge`}><stop offset="0" stopColor="black"/><stop offset="3%" stopColor="white"/><stop offset="97%" stopColor="white"/><stop offset="100%" stopColor="black"/></linearGradient>
                <linearGradient id={`${clip}-surface`} x1="0" y1="0" x2="0" y2="1"><stop offset="92%" stopColor="white"/><stop offset="100%" stopColor="black"/></linearGradient>
                <mask id={`${clip}-edge-mask`} maskUnits="userSpaceOnUse" x={cx} y={cy} width={cw} height={ch}><rect x={cx} y={cy} width={cw} height={ch} fill={`url(#${clip}-edge)`}/></mask>
                <mask id={`${clip}-surface-mask`} maskUnits="userSpaceOnUse" x={cx} y={cy} width={cw} height={ch}><rect x={cx} y={cy} width={cw} height={ch} fill={`url(#${clip}-surface)`}/></mask>
              </defs>
              <g clipPath={`url(#${clip})`} mask={`url(#${clip}-edge-mask)`}><g mask={`url(#${clip}-surface-mask)`}>
                <image href={scene.image} width={scene.source[0]} height={scene.source[1]}
                  onError={() => setScene(old => old.image === scene.image ? { ...old, image: '', landmark: 'Miền đất mới' } : old)} />
              </g></g>
            </svg>
          </g></g> : <path d={`M${role === 'origin' ? 0 : 1000} 660 q100 -150 220 -25 t300 25 v40 h-520z`} fill="#52796f" opacity=".4" />}
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
    <div className="journey-sky-softener" />
    <Landmark city={fromCity} role="origin" /><Landmark city={toCity} role="destination" />
  </div>;
};
