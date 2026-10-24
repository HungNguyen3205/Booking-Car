import { useEffect, useId, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import type { VehicleCategory } from '../../types';
import { sceneService } from '../../data/sceneData';
import { VEHICLE_MODELS } from '../../data/mockData';

export const JOURNEY_ART = '/assets/images/scenes/journey-pop-up.webp';

interface Props {
  fromCity: string;
  toCity: string;
  vehicleCategory: VehicleCategory;
  introReady?: boolean;
}

/** All anchors use the same 1000 × 750 artboard. UI never inherits paper perspective. */
export function TicketJourneyScene({ fromCity, toCity, vehicleCategory, introReady = true }: Props) {
  const reduce = useReducedMotion();
  const id = useId().replace(/:/g, '');
  const [readyArt, setReadyArt] = useState<{ key: string; src: string | null }>({ key: '', src: null });
  const sequence = useRef(0);
  const [introDone, setIntroDone] = useState(introReady);
  useEffect(() => {
    if (!introReady || introDone) return;
    const timer = window.setTimeout(() => setIntroDone(true), reduce ? 0 : 2100);
    return () => window.clearTimeout(timer);
  }, [introReady, introDone, reduce]);
  const originId = sceneService.getCanonicalCityId(fromCity);
  const destinationId = sceneService.getCanonicalCityId(toCity);
  const pair = [originId, destinationId].sort().join('|') === 'da-nang|hue';
  const routeKey = `${originId}:${destinationId}`;
  const vehicle = VEHICLE_MODELS[vehicleCategory];
  const active = introReady;

  useEffect(() => {
    const seq = ++sequence.current;
    let cancelled = false;
    if (!pair) return;
    sceneService.preloadAsset(JOURNEY_ART).then(result => {
      if (!cancelled && sequence.current === seq) setReadyArt({ key: routeKey, src: result.success ? JOURNEY_ART : null });
    });
    return () => { cancelled = true; };
  }, [pair, routeKey]);

  const artwork = pair ? readyArt.src : null;
  const reveal = (delay: number, duration = 0.6) => ({ duration: reduce ? 0 : duration, delay: reduce || introDone ? 0 : delay, ease: 'easeOut' as const });
  const reversed = originId === 'hue';

  return (
    <div className="journey-stage" data-testid="journey-stage" aria-hidden="true">
      <motion.svg className="journey-paper" viewBox="0 0 1000 750" fill="none" animate={{ opacity: artwork && active ? 0 : 1 }} transition={reveal(.65, .3)}>
        <defs>
          <linearGradient id={`${id}-paper`} x1="200" y1="420" x2="780" y2="680" gradientUnits="userSpaceOnUse">
            <stop stopColor="#fffdf7" /><stop offset="1" stopColor="#e8dfcb" />
          </linearGradient>
          <filter id={`${id}-shadow`} x="-30%" y="-60%" width="160%" height="220%"><feGaussianBlur stdDeviation="13" /></filter>
        </defs>
        <motion.ellipse cx="532" cy="640" rx="355" ry="35" fill="#665845" opacity=".14" filter={`url(#${id}-shadow)`}
          initial={{ opacity: 0 }} animate={{ opacity: active ? 0.14 : 0 }} transition={reveal(0)} />
        <motion.g initial={{ opacity: reduce ? 1 : 0, y: 12 }} animate={{ opacity: active ? 1 : 0, y: active ? 0 : 12 }} transition={reveal(0, .35)}>
          <path d="M100 534 672 420 931 586 365 703Z" fill="#c6baa3" />
          <path d="M100 526 672 412 931 578 365 695Z" fill="#eee6d7" stroke="#d2c5ae" strokeWidth="2" />
          <path d="M100 518 672 404 931 570 365 687Z" fill={`url(#${id}-paper)`} stroke="#ddd3be" strokeWidth="2" />
          <path d="m126 523 242 147 535-106" stroke="#d5c7ac" strokeDasharray="5 7" strokeWidth="1.5" />
        </motion.g>
      </motion.svg>

      {/* Paper hinge exists independently of the landscape and opens around its rear crease. */}
      {!introDone && <div className="journey-flap-plane">
        <motion.div className="journey-flap" initial={false}
          animate={reduce ? { opacity: 0 } : active ? { rotateX: [0, -22, -105], opacity: [1, 1, 0] } : { rotateX: 0, opacity: 1 }}
          transition={reduce ? { duration: 0 } : { duration: .8, delay: .12, times: [0, .45, 1], ease: [.22, 1, .36, 1] }} />
      </div>}

      <AnimatePresence initial={false}>
        <motion.div key={artwork || `neutral-${routeKey}`} className="journey-art-layer"
          initial={{ opacity: 0 }} animate={{ opacity: active ? 1 : 0 }} exit={{ opacity: 0 }} transition={reveal(artwork ? .35 : 0, .55)}>
          {artwork ? (
            <>
              {/* Upper landscape and lower road share the exact same image coordinates. */}
              <motion.img className="journey-art journey-landscape" src={artwork} alt="" width="1536" height="1024"
                initial={{ y: reduce ? 0 : 20 }} animate={{ y: active ? 0 : 20 }} transition={reveal(.35, .7)} />
              <motion.img className="journey-art journey-road" src={artwork} alt="" width="1536" height="1024"
                initial={{ opacity: 0 }} animate={{ opacity: active ? 1 : 0 }} transition={reveal(.32, .5)} />
            </>
          ) : (
            <svg viewBox="0 0 1000 750" className="journey-neutral">
              <path d="M180 485 355 275 467 419 625 239 850 477Z" fill="#a9bcb1" />
              <path d="M205 506Q390 390 545 455T860 480L859 583 386 665Z" fill="#a7cdd0" />
              <path d="M310 645C340 550 810 568 770 475S700 390 650 414" fill="none" stroke="#e3dcc9" strokeWidth="104" />
              <path d="M310 645C340 550 810 568 770 475S700 390 650 414" fill="none" stroke="#59616a" strokeWidth="86" />
              <path d="M310 645C340 550 810 568 770 475S700 390 650 414" fill="none" stroke="#dcca8b" strokeWidth="3" strokeDasharray="14 12" />
            </svg>
          )}
        </motion.div>
      </AnimatePresence>

      <motion.div className={`journey-bus-entry journey-bus-${vehicleCategory}`}
        initial={introDone ? false : { opacity: 0, x: reduce ? 0 : 55, y: reduce ? 0 : -9, scale: reduce ? 1 : .88 }}
        animate={{ opacity: active ? 1 : 0, x: 0, y: 0, scale: 1 }} transition={reveal(.68, .95)}>
        <AnimatePresence initial={false}>
          <motion.div key={vehicleCategory} className="journey-bus-switch" initial={{ opacity: 0, x: reduce ? 0 : 12 }}
            animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: reduce ? 0 : -12 }} transition={{ duration: reduce ? 0 : .3 }}>
            <div className="journey-bus-shadow" />
            <img src={vehicle.image} alt="" width="1376" height="768" className="journey-bus-image" />
          </motion.div>
        </AnimatePresence>
      </motion.div>

      <motion.svg viewBox="0 0 1000 750" className="journey-route" key={routeKey} initial={{ opacity: 0 }}
        animate={{ opacity: active ? 1 : 0 }} transition={reveal(1.1, .2)}>
        <defs><linearGradient id={`${id}-route`}><stop stopColor="#0097a7" /><stop offset="1" stopColor="#5ec9bc" /></linearGradient></defs>
        <motion.path d={reversed ? 'M790 250Q620 150 320 320' : 'M320 320Q620 150 790 250'} fill="none"
          stroke={`url(#${id}-route)`} strokeWidth="3" initial={{ pathLength: reduce ? 1 : 0 }} animate={{ pathLength: active ? 1 : 0 }} transition={reveal(1.1, .65)} />
        <circle cx="320" cy="320" r="7" fill="#0097a7" stroke="#fffefb" strokeWidth="3" />
        <circle cx="790" cy="250" r="7" fill="#e2ae58" stroke="#fffefb" strokeWidth="3" />
      </motion.svg>
      <motion.div className="journey-place journey-place-left" initial={{ opacity: 0 }} animate={{ opacity: active ? 1 : 0 }} transition={reveal(1.2, .3)}>{pair ? 'Đà Nẵng' : fromCity}</motion.div>
      <motion.div className="journey-place journey-place-right" initial={{ opacity: 0 }} animate={{ opacity: active ? 1 : 0 }} transition={reveal(1.3, .3)}>{pair ? 'Huế' : toCity}</motion.div>
      {!pair && <span className="journey-neutral-note">Minh họa hành trình</span>}
    </div>
  );
}
