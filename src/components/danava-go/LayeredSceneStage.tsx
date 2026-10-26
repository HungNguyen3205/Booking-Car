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
  const clip = `${slotId}-${role}-${scene.id}-${scene.image ? 'photo' : 'fallback'}`;
  const [cx, cy, cw, ch] = scene.crop;
  const x = role === 'origin' ? scene.frame.originX : scene.frame.destinationX;
  const width = scene.frame.width;
  const height = scene.frame.height;
  const blend = scene.blend;
  const hasEdgeFade = Boolean(blend?.edgeFade?.left || blend?.edgeFade?.right);
  const hasVerticalFade = Boolean(blend?.waterFade || blend?.skyFade);

  return (
    <div className={`journey-landmark journey-landmark-${role}`} data-landmark-slot={role} data-city={scene.id}>
      <AnimatePresence initial={false}>
        <motion.div
          className="journey-landmark-content"
          key={`${scene.id}:${scene.image}`}
          initial={{ opacity: reduced ? 1 : 0, y: reduced ? 0 : 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduced ? 0 : 0.5 }}
        >
          <svg
            className="journey-landmark-plane"
            viewBox="0 0 1600 1000"
            preserveAspectRatio={mobile ? 'xMidYMax meet' : 'xMidYMid slice'}
            aria-hidden="true"
          >
            {scene.image ? (
              <svg
                x={x}
                y={scene.frame.y}
                width={width}
                height={height}
                viewBox={`${cx} ${cy} ${cw} ${ch}`}
                preserveAspectRatio="none"
                data-bank-image={scene.id}
              >
                <defs>
                  <clipPath id={`${clip}-crop`}>
                    <rect x={cx} y={cy} width={cw} height={ch} />
                  </clipPath>
                  {hasVerticalFade && (
                    <>
                      <linearGradient id={`${clip}-v`} x1="0" y1={cy} x2="0" y2={cy + ch} gradientUnits="userSpaceOnUse">
                        {blend?.skyFade ? (
                          <>
                            <stop offset="0%" stopColor="black" />
                            <stop offset={`${blend.skyFade.start}%`} stopColor="black" />
                            <stop offset={`${blend.skyFade.end}%`} stopColor="white" />
                          </>
                        ) : (
                          <stop offset="0%" stopColor="white" />
                        )}
                        {blend?.waterFade ? (
                          <>
                            <stop offset={`${blend.waterFade.start}%`} stopColor="white" />
                            <stop offset={`${blend.waterFade.end}%`} stopColor="black" />
                            <stop offset="100%" stopColor="black" />
                          </>
                        ) : (
                          <stop offset="100%" stopColor="white" />
                        )}
                      </linearGradient>
                      <mask id={`${clip}-v-mask`} maskUnits="userSpaceOnUse" x={cx} y={cy} width={cw} height={ch}>
                        <rect x={cx} y={cy} width={cw} height={ch} fill={`url(#${clip}-v)`} />
                      </mask>
                    </>
                  )}
                  {hasEdgeFade && (
                    <>
                      <linearGradient id={`${clip}-h`} x1={cx} y1="0" x2={cx + cw} y2="0" gradientUnits="userSpaceOnUse">
                        {blend?.edgeFade?.left ? (
                          <>
                            <stop offset="0%" stopColor="black" />
                            <stop offset={`${blend.edgeFade.left.start}%`} stopColor="black" />
                            <stop offset={`${blend.edgeFade.left.end}%`} stopColor="white" />
                          </>
                        ) : (
                          <stop offset="0%" stopColor="white" />
                        )}
                        {blend?.edgeFade?.right ? (
                          <>
                            <stop offset={`${blend.edgeFade.right.start}%`} stopColor="white" />
                            <stop offset={`${blend.edgeFade.right.end}%`} stopColor="black" />
                            <stop offset="100%" stopColor="black" />
                          </>
                        ) : (
                          <stop offset="100%" stopColor="white" />
                        )}
                      </linearGradient>
                      <mask id={`${clip}-h-mask`} maskUnits="userSpaceOnUse" x={cx} y={cy} width={cw} height={ch}>
                        <rect x={cx} y={cy} width={cw} height={ch} fill={`url(#${clip}-h)`} />
                      </mask>
                    </>
                  )}
                </defs>
                <g clipPath={`url(#${clip}-crop)`}>
                  <g {...(hasEdgeFade ? { mask: `url(#${clip}-h-mask)` } : {})}>
                    <g {...(hasVerticalFade ? { mask: `url(#${clip}-v-mask)` } : {})}>
                      <image
                        href={scene.image}
                        width={scene.source[0]}
                        height={scene.source[1]}
                        onError={() =>
                          setScene((old) =>
                            old.image === scene.image ? { ...old, image: '', landmark: 'Miền đất mới' } : old
                          )
                        }
                      />
                    </g>
                  </g>
                </g>
              </svg>
            ) : (
              <path
                d={`M${role === 'origin' ? 0 : 1000} 660 q100 -150 220 -25 t300 25 v40 h-520z`}
                fill="#52796f"
                opacity=".4"
              />
            )}
          </svg>
          <div className="journey-landmark-label">
            <span>{role === 'origin' ? 'ĐIỂM ĐI' : 'ĐIỂM ĐẾN'}</span>
            <strong>{scene.city}</strong>
            <small>{scene.landmark}</small>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
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
