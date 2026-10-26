import { useJourneyReducedMotion, useJourneyMobile } from './useJourneyReducedMotion';
import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { VehicleCategory } from '../../types';
import { decodeJourneyImage, JOURNEY_VEHICLES, JOURNEY_DRIVE, getVehicleRest } from './journeyStageConfig';

interface VehicleMotionStageProps {
  selectedVehicle: VehicleCategory;
  introReady?: boolean;
  onVehicleError?: (fallback: VehicleCategory, message: string) => void;
}

export const VehicleMotionStage: React.FC<VehicleMotionStageProps> = ({ selectedVehicle, introReady = true, onVehicleError }) => {
  const reduced = useJourneyReducedMotion();
  const mobile = useJourneyMobile();
  const [shown, setShown] = useState<VehicleCategory | null>(null);
  const [introDone, setIntroDone] = useState(reduced);
  const [broken, setBroken] = useState(false);
  const shownRef = useRef<VehicleCategory | null>(null);
  const lastGood = useRef<VehicleCategory | null>(null);
  const requests = useRef(0);
  const callback = useRef(onVehicleError);
  const previousMobile = useRef(mobile);
  useEffect(() => { callback.current = onVehicleError; }, [onVehicleError]);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const settle = (event: MediaQueryListEvent) => { if (event.matches) setIntroDone(true); };
    media.addEventListener('change', settle);
    return () => media.removeEventListener('change', settle);
  }, []);

  // Resize settles an in-flight approach instead of replaying it at a new scale.
  useEffect(() => {
    if (previousMobile.current !== mobile && shownRef.current) setIntroDone(true);
    previousMobile.current = mobile;
  }, [mobile]);

  useEffect(() => {
    const request = ++requests.current;
    let cancelled = false;
    const current = () => !cancelled && requests.current === request;
    const commit = (category: VehicleCategory) => {
      if (!current()) return;
      if (shownRef.current !== null) setIntroDone(true);
      shownRef.current = category;
      setBroken(false);
      setShown(category);
    };
    if (introReady) {
      void decodeJourneyImage(JOURNEY_VEHICLES[selectedVehicle].image).then(() => commit(selectedVehicle)).catch(async () => {
        if (!current()) return;
        if (shownRef.current) {
          callback.current?.(shownRef.current, 'Chưa tải được ảnh xe. Giữ xe trước đó; bạn vẫn có thể tìm chuyến.');
          return;
        }
        const fallback: VehicleCategory = selectedVehicle === 'sleeper' ? 'limousine' : 'sleeper';
        try {
          await decodeJourneyImage(JOURNEY_VEHICLES[fallback].image);
          if (!current()) return;
          commit(fallback);
          callback.current?.(fallback, 'Ảnh xe đang chọn chưa tải được. Đang hiển thị dòng xe thay thế.');
        } catch {
          if (current()) callback.current?.(selectedVehicle, 'Chưa tải được ảnh xe. Bạn vẫn có thể tìm chuyến.');
        }
      });
    }
    return () => { cancelled = true; };
  }, [selectedVehicle, introReady]);

  const cfg = shown ? JOURNEY_VEHICLES[shown] : null;
  const width = cfg ? cfg.width * (mobile ? 1.3 : 1) : 0;
  const factor = width / 1376;
  const [x, y] = shown ? getVehicleRest(shown, mobile) : [650, 782];
  const anchorX = cfg ? cfg.anchor[0] * factor : 0;
  const anchorY = cfg ? cfg.anchor[1] * factor : 0;
  const rest = `translate(${x}px, ${y}px) scale(1)`;
  const approach = !introDone && !reduced;

  return <svg className="journey-vehicle-layer" viewBox="0 0 1600 1000" preserveAspectRatio={mobile ? 'xMidYMax meet' : 'xMidYMid slice'} aria-hidden="true" data-testid="journey-vehicle-layer">
    <g id="layer-vehicle" data-testid="layer-vehicle">
      <AnimatePresence mode="wait">
        {shown && cfg && !broken && <motion.g key={shown} data-vehicle={shown} className="journey-bus"
          initial={reduced ? false : approach ? 'distant' : 'replace'}
          animate={approach ? 'approach' : 'rest'} exit="leave"
          variants={{
            distant: { transform: `translate(${JOURNEY_DRIVE.x[0]}px, ${JOURNEY_DRIVE.y[0]}px) scale(${JOURNEY_DRIVE.scale[0]})`, opacity: 0 },
            replace: { transform: `translate(${x + 12}px, ${y + 2}px) scale(.985)`, opacity: 0 },
            approach: { transform: JOURNEY_DRIVE.x.map((px, i) => `translate(${i === 3 ? x : px}px, ${i === 3 ? y : JOURNEY_DRIVE.y[i]}px) scale(${JOURNEY_DRIVE.scale[i]})`), opacity: 1,
              transition: { transform: { duration: JOURNEY_DRIVE.duration, times: JOURNEY_DRIVE.times, ease: ['linear', 'linear', 'easeOut'] }, opacity: { duration: .14 } } },
            rest: { transform: rest, opacity: 1, transition: { duration: reduced ? 0 : .22, ease: [.22, 1, .36, 1], opacity: { duration: reduced ? 0 : .16 } } },
            leave: { opacity: 0, transition: { duration: reduced ? 0 : .12 } },
          }}
          onAnimationComplete={phase => { if (phase === 'approach') setIntroDone(true); }}
          style={{ transformOrigin: '0px 0px' }}>
          <g transform={`translate(${-anchorX} ${-anchorY})`}>
            <ellipse cx={anchorX + width * .04} cy={anchorY + 3} rx={width * .34} ry="11" fill="#102744" opacity=".18" />
            {cfg.wheels.map(([px, py], i) => <ellipse key={i} cx={px * factor} cy={py * factor - 3} rx={width * .033} ry="3" fill="#0d1b2a" opacity=".4" />)}
            <image href={cfg.image} width={width} height={width * 768 / 1376}
              onLoad={() => { lastGood.current = shown; }}
              onError={() => {
                const previous = lastGood.current;
                ++requests.current;
                setIntroDone(true);
                if (previous && previous !== shown) { shownRef.current = previous; setShown(previous); }
                else setBroken(true);
                callback.current?.(previous || shown, 'Ảnh xe gặp sự cố. Bạn vẫn có thể tìm chuyến.');
              }} />
          </g>
        </motion.g>}
      </AnimatePresence>
    </g>
  </svg>;
};
