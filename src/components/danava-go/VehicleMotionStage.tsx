import { useJourneyReducedMotion } from './useJourneyReducedMotion';
import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { VehicleCategory } from '../../types';
import { decodeJourneyImage, getJourneyLandmark, JOURNEY_VEHICLES } from './journeyStageConfig';

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
    <svg className="journey-vehicle-layer" viewBox="0 0 1376 768" preserveAspectRatio="xMidYMax slice" aria-hidden="true" data-testid="journey-vehicle-layer">
      <g id="layer-vehicle" data-testid="layer-vehicle">
        <AnimatePresence mode="wait">
          {shown && cfg && !broken && <motion.g key={`${shown.category}:${shown.route}`} data-vehicle={shown.category} className="journey-bus"
            initial={{ transform: `translate(${cfg.rest[0]}px, ${cfg.rest[1]}px) scale(1)`, opacity: 0 }}
            animate={{ transform: `translate(${cfg.rest[0]}px, ${cfg.rest[1]}px) scale(1)`, opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduced ? 0 : 0.2 }}
            style={{ transformOrigin: '0px 0px' }}>
            {/* Shadows and image share the exact wheel anchor throughout the journey. */}
            <g transform={`translate(${-anchorX} ${-anchorY})`}>
              {/* Soft ambient undercarriage shadow */}
              <ellipse cx={anchorX + cfg.width * 0.04} cy={anchorY + 4} rx={cfg.width * 0.35} ry="14" fill="#102744" opacity=".22" />
              {/* Dark tire contact patches grounding wheels directly on asphalt */}
              {cfg.wheels.map(([x, y], i) => (
                <ellipse key={i} cx={x * factor} cy={y * factor + 2} rx={cfg.width * 0.038} ry="6" fill="#0d1b2a" opacity=".62" />
              ))}
              <image href={cfg.image} width={cfg.width} height={cfg.width * 768 / 1376}
                onError={() => { setBroken(true); callbackRef.current(shown.category, 'Ảnh xe gặp sự cố hiển thị. Vui lòng tải lại trang.'); }} />
            </g>
          </motion.g>}
        </AnimatePresence>
      </g>
    </svg>
  );
};
