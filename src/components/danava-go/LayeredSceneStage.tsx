import { useJourneyReducedMotion } from './useJourneyReducedMotion';
import React, { useEffect, useId, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { decodeJourneyImage, getJourneyLandmark, JOURNEY_ROAD, type JourneyLandmark } from './journeyStageConfig';

interface LayeredSceneStageProps { fromCity: string; toCity: string; className?: string }

function Landmark({ city, role }: { city: string; role: 'origin' | 'destination' }) {
  const reduced = useJourneyReducedMotion();
  const maskId = useId().replace(/:/g, '');
  const [scene, setScene] = useState<JourneyLandmark>(() => getJourneyLandmark(city));
  useEffect(() => {
    let current = true;
    const target = getJourneyLandmark(city);
    decodeJourneyImage(target.image).then(() => {
      if (current) setScene(target);
    }).catch(() => {
      // Never keep the previous city's artwork under the new city's name.
      if (current) setScene({ ...target, image: '', landmark: 'Miền đất mới' });
    });
    return () => { current = false; };
  }, [city]);
  const [cx, cy, cw, ch] = scene.crop;
  return (
    <div className={`journey-landmark journey-landmark-${role}`} data-landmark-slot={role} data-city={scene.id}>
      <AnimatePresence initial={false}>
        <motion.div className="journey-landmark-content" key={`${scene.id}:${scene.image}`}
          initial={{ opacity: reduced ? 1 : 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: reduced ? 0 : 0.5 }}>
          {/* Only render cutout art if it is a swapped custom city, not the integrated da-nang / hoi-an */}
          {scene.image && scene.id !== 'da-nang' && scene.id !== 'hoi-an' && (
            <svg className="journey-landmark-art" viewBox={`${cx} ${cy} ${cw} ${ch}`} preserveAspectRatio="xMidYMax meet" aria-hidden="true">
              <defs>
                <clipPath id={`${maskId}-crop`}><rect x={cx} y={cy} width={cw} height={ch} /></clipPath>
                <radialGradient id={`${maskId}-fade`}><stop offset="55%" stopColor="white" /><stop offset="100%" stopColor="black" /></radialGradient>
                <mask id={`${maskId}-mask`} maskUnits="userSpaceOnUse" x={cx} y={cy} width={cw} height={ch}>
                  <ellipse cx={cx + cw / 2} cy={cy + ch / 2} rx={cw / 2} ry={ch / 2} fill={`url(#${maskId}-fade)`} />
                </mask>
              </defs>
              <image href={scene.image} width={scene.source[0]} height={scene.source[1]} clipPath={`url(#${maskId}-crop)`}
                mask={scene.photographic ? undefined : `url(#${maskId}-mask)`}
                onError={() => setScene((old) => old.image === scene.image ? { ...old, image: '', landmark: 'Miền đất mới' } : old)} />
            </svg>
          )}
          <div className="journey-landmark-label">
            <span>{role === 'origin' ? 'ĐIỂM ĐI' : 'ĐIỂM ĐẾN'}</span>
            <strong>{scene.city}</strong><small>{scene.landmark}</small>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export const LayeredSceneStage: React.FC<LayeredSceneStageProps> = ({ fromCity, toCity, className = '' }) => {
  const [roadError, setRoadError] = useState(false);
  return (
    <div className={`journey-scenery ${className}`} aria-hidden="true">
      {/* 1. SKY LAYER */}
      <div id="layer-sky" data-testid="layer-sky" className="journey-atmosphere" />

      {/* 2. DISTANT LANDSCAPE */}
      <div id="layer-distant-landscape" data-testid="layer-distant-landscape" className="journey-distant-backdrop" />

      {/* 3. ORIGIN LANDMARK */}
      <div id="layer-origin-landmark" data-testid="layer-origin-landmark">
        <Landmark city={fromCity} role="origin" />
      </div>

      {/* 4. DESTINATION LANDMARK */}
      <div id="layer-destination-landmark" data-testid="layer-destination-landmark">
        <Landmark city={toCity} role="destination" />
      </div>

      {/* 5. ROAD & GROUND: Persistent road sharing 1376x768 coordinates */}
      <div id="layer-road-ground" data-testid="layer-road-ground">
        <svg className="journey-road" data-testid="journey-fixed-road" viewBox="0 0 1376 768" preserveAspectRatio="xMidYMax slice" fill="none">
          {!roadError ? (
            <image href={JOURNEY_ROAD} width="1376" height="768" onError={() => setRoadError(true)} />
          ) : (
            <>
              <path d="M470 450 C250 540 500 660 680 725 S1100 840 1490 850" stroke="#dad7c8" strokeWidth="150" />
              <path d="M470 450 C250 540 500 660 680 725 S1100 840 1490 850" stroke="#646c73" strokeWidth="125" />
              <path d="M470 450 C250 540 500 660 680 725 S1100 840 1490 850" stroke="#f5e5b7" strokeWidth="3" strokeDasharray="20 18" />
            </>
          )}
        </svg>

        {/* Route Line linking origin and destination */}
        <svg className="journey-route-line" viewBox="0 0 1376 768" preserveAspectRatio="xMidYMax slice" fill="none">
          <path d="M220 220 Q688 70 1150 240" stroke="#0097a7" strokeOpacity=".3" strokeWidth="2" strokeDasharray="6 8" />
          <circle cx="220" cy="220" r="4.5" fill="#0097a7" fillOpacity=".7" />
          <circle cx="1150" cy="240" r="4.5" fill="#bd924f" fillOpacity=".7" />
        </svg>
      </div>
    </div>
  );
};
