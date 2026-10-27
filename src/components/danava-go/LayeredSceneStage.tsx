import { useJourneyReducedMotion, useJourneyMobile } from './useJourneyReducedMotion';
import React, { useEffect, useId, useState, memo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { decodeJourneyImage, getJourneyLandmark, JOURNEY_ROAD, type JourneyLandmark } from './journeyStageConfig';

// Separate slots: changing one city never replaces the road or the other city.
const Landmark = memo(function Landmark({ city, role, introReady }: { city: string; role: 'origin' | 'destination'; introReady: boolean }) {
  const reduced = useJourneyReducedMotion();
  const mobile = useJourneyMobile();
  const slotId = useId().replace(/:/g, '');
  const [scene, setScene] = useState<JourneyLandmark>(() => getJourneyLandmark(city, role));
  useEffect(() => {
    let current = true;
    const target = getJourneyLandmark(city, role);
    decodeJourneyImage(target.image).then(() => { if (current) setScene(target); })
      .catch(() => { if (current) setScene({ ...target, image: '', landmark: 'Miền đất mới' }); });
    return () => { current = false; };
  }, [city, role]);
  const safeId = Array.from(scene.id).reduce((hash, ch) => (Math.imul(hash, 31) + ch.charCodeAt(0)) >>> 0, 0).toString(36);
  const clip = `${slotId}-${role}-${safeId}-${scene.image ? 'photo' : 'fallback'}`;
  const [cx, cy, cw, ch] = scene.crop;
  const x = role === 'origin' ? (mobile ? scene.frame.mobileOriginX ?? scene.frame.originX : scene.frame.originX) : (mobile ? scene.frame.mobileDestinationX ?? scene.frame.destinationX : scene.frame.destinationX);
  const y = role === 'origin' ? scene.frame.originY ?? scene.frame.y : scene.frame.y;
  const width = mobile ? scene.frame.mobileWidth ?? scene.frame.width : scene.frame.width;
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
          initial={{ opacity: reduced ? 1 : 0, y: reduced ? 0 : 10 }}
          animate={{ opacity: introReady ? 1 : 0, y: introReady || reduced ? 0 : 10 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduced ? 0 : .55, ease: [.22, 1, .36, 1] }}
        >
          <svg
            className="journey-landmark-plane"
            style={{ filter: scene.tone }}
            viewBox="0 0 1600 1000"
            preserveAspectRatio={mobile ? 'xMidYMax meet' : 'xMidYMid slice'}
            aria-hidden="true"
          >
            {scene.image ? (
              <svg
                x={x}
                y={y}
                width={width}
                height={height}
                viewBox={`${cx} ${cy} ${cw} ${ch}`}
                preserveAspectRatio="xMidYMax meet"
                data-bank-image={scene.id}
                data-bank-role={role}
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
          <motion.div className={`journey-landmark-label journey-landmark-label-${role}`}
            initial={reduced ? false : { opacity: 0 }}
            animate={{ opacity: introReady ? 1 : 0 }}
            transition={{ duration: reduced ? 0 : .25, delay: reduced ? 0 : .1 }}
          >
            <span>{role === 'origin' ? 'ĐIỂM ĐI' : 'ĐIỂM ĐẾN'}</span>
            <strong>{scene.city}</strong>
            <small>{scene.landmark}</small>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
});
export const LayeredSceneStage: React.FC<{ fromCity: string; toCity: string; className?: string; introReady?: boolean }> = ({ fromCity, toCity, className = '', introReady = true }) => {
  const [roadError, setRoadError] = useState(false);
  const backgroundId = useId().replace(/:/g, '');
  const mobile = useJourneyMobile();
  return <div className={`journey-scenery ${className}`} aria-hidden="true">
    <svg className="journey-road" data-testid="journey-fixed-road" viewBox="0 0 1600 1000" preserveAspectRatio={mobile ? "xMidYMax meet" : "xMidYMid slice"}>
      <g id={`${backgroundId}-base`}>{!roadError ? <image href={JOURNEY_ROAD} width="1600" height="1000" preserveAspectRatio="none" onError={() => setRoadError(true)} /> : <>
        <rect width="1600" height="1000" fill="#f7f4ec" />
        <path d="M180 650 C0 720 350 760 700 810 S1400 950 1700 980" stroke="#dad7c8" strokeWidth="180" fill="none" />
        <path d="M180 650 C0 720 350 760 700 810 S1400 950 1700 980" stroke="#646c73" strokeWidth="150" fill="none" />
        <path d="M180 650 C0 720 350 760 700 810 S1400 950 1700 980" stroke="#f5e5b7" strokeWidth="3" strokeDasharray="22 20" fill="none" />
      </>}</g>
    </svg>
    <div className="journey-sky-softener" />
    <Landmark city={fromCity} role="origin" introReady={introReady} /><Landmark city={toCity} role="destination" introReady={introReady} />
    <svg className="journey-foreground" viewBox="0 0 1600 1000" preserveAspectRatio={mobile ? 'xMidYMax meet' : 'xMidYMid slice'} aria-hidden="true">
      <defs><clipPath id={`${backgroundId}-near`}><path d="M0 585 C150 605 220 640 450 674 S1150 730 1600 770 V1000 H0Z" /></clipPath></defs>
      <use href={`#${backgroundId}-base`} clipPath={`url(#${backgroundId}-near)`} />
    </svg>
  </div>;
};
