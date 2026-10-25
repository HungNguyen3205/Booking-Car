import { useJourneyReducedMotion } from './useJourneyReducedMotion';
import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { VehicleCategory } from '../../types';
import { decodeJourneyImage, getJourneyLandmark, JOURNEY_DRIVE, JOURNEY_VEHICLES } from './journeyStageConfig';

interface VehicleMotionStageProps {
  selectedVehicle: VehicleCategory;
  routeKey: string;
  fromCity: string;
  toCity: string;
  introReady: boolean;
  onVehicleError: (fallback: VehicleCategory, message: string) => void;
}

export const VehicleMotionStage: React.FC<VehicleMotionStageProps> = ({ selectedVehicle, routeKey, fromCity, toCity, introReady, onVehicleError }) => {
  const reduced = useJourneyReducedMotion();
  const [shown, setShown] = useState<{ category: VehicleCategory; route: string } | null>(null);
  const [broken, setBroken] = useState(false);
  const shownRef = useRef(shown);
  const callbackRef = useRef(onVehicleError);
  useEffect(() => { shownRef.current = shown; }, [shown]);
  useEffect(() => { callbackRef.current = onVehicleError; }, [onVehicleError]);

  useEffect(() => {
    if (!introReady) return;
    let current = true;
    Promise.all([decodeJourneyImage(JOURNEY_VEHICLES[selectedVehicle].image), Promise.allSettled([fromCity, toCity].map((city) => decodeJourneyImage(getJourneyLandmark(city).image)))]).then(() => {
      if (!current) return;
      setBroken(false);
      setShown({ category: selectedVehicle, route: routeKey });
    }).catch(() => {
      if (!current) return;
      const previous = shownRef.current;
      callbackRef.current(previous?.category || selectedVehicle, 'Chưa tải được ảnh xe. Vui lòng thử lại; bạn vẫn có thể tìm chuyến.');
    });
    return () => { current = false; };
  }, [selectedVehicle, routeKey, fromCity, toCity, introReady]);

  const cfg = shown && JOURNEY_VEHICLES[shown.category];
  const factor = cfg ? cfg.width / 1376 : 1;
  const anchorX = cfg ? cfg.anchor[0] * factor : 0;
  const anchorY = cfg ? cfg.anchor[1] * factor : 0;
  return (
    <svg className="journey-vehicle-layer" viewBox="0 0 1536 1024" aria-hidden="true" data-testid="journey-vehicle-layer">
      {/* Only one bus is visible. The old one fades out before the decoded new one enters. */}
      <AnimatePresence mode="wait">
        {shown && cfg && !broken && <motion.g key={`${shown.category}:${shown.route}`} data-vehicle={shown.category} className="journey-bus"
          initial={reduced ? false : { transform: `translate(${JOURNEY_DRIVE.x[0]}px, ${JOURNEY_DRIVE.y[0]}px) scale(${JOURNEY_DRIVE.scale[0]})`, opacity: 0 }}
          animate={reduced ? { transform: 'translate(1000px, 785px) scale(1)', opacity: 1 } : {
            transform: JOURNEY_DRIVE.x.map((x, i) => `translate(${x}px, ${JOURNEY_DRIVE.y[i]}px) scale(${JOURNEY_DRIVE.scale[i]})`), opacity: 1,
          }}
          exit={{ opacity: 0 }}
          transition={reduced ? { duration: 0 } : {
            duration: JOURNEY_DRIVE.duration, times: JOURNEY_DRIVE.times, ease: [0.22, 0.61, 0.36, 1],
            opacity: { duration: 0.24 },
          }}
          style={{ transformOrigin: '0px 0px' }}>
          {/* Shadows and image share the exact wheel anchor throughout the journey. */}
          <g transform={`translate(${-anchorX} ${-anchorY})`}>
            <ellipse cx={anchorX + cfg.width * 0.09} cy={anchorY + 4} rx={cfg.width * 0.34} ry="13" fill="#102744" opacity=".12" />
            {cfg.wheels.map(([x, y], i) => <ellipse key={i} cx={x * factor} cy={y * factor + 2} rx={cfg.width * 0.036} ry="5" fill="#112033" opacity=".48" />)}
            <image href={cfg.image} width={cfg.width} height={cfg.width * 768 / 1376}
              onError={() => { setBroken(true); callbackRef.current(shown.category, 'Ảnh xe gặp sự cố hiển thị. Vui lòng tải lại trang.'); }} />
          </g>
        </motion.g>}
      </AnimatePresence>
    </svg>
  );
};
