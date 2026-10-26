import { useJourneyReducedMotion, useJourneyMobile } from './useJourneyReducedMotion';
import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { VehicleCategory } from '../../types';
import { decodeJourneyImage, JOURNEY_VEHICLES, JOURNEY_DRIVE } from './journeyStageConfig';

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
  const mobile = useJourneyMobile();
  const [settledKey, setSettledKey] = useState('');
  const [shown, setShown] = useState<{ category: VehicleCategory; route: string } | null>(null);
  const [broken, setBroken] = useState(false);
  const shownRef = useRef(shown);
  const callbackRef = useRef(onVehicleError);
  useEffect(() => { shownRef.current = shown; }, [shown]);
  useEffect(() => { callbackRef.current = onVehicleError; }, [onVehicleError]);

  useEffect(() => {
    if (!introReady) return;
    let current = true;
    decodeJourneyImage(JOURNEY_VEHICLES[selectedVehicle].image).then(() => {
      if (!current) return;
      setBroken(false);
      setShown({ category: selectedVehicle, route: routeKey });
    }).catch(async () => {
      if (!current) return;
      const previous = shownRef.current;
      if (previous) {
        callbackRef.current(previous.category, 'Chưa tải được ảnh xe. Giữ xe trước đó; bạn vẫn có thể tìm chuyến.');
        return;
      }
      const fallback: VehicleCategory = selectedVehicle === 'sleeper' ? 'limousine' : 'sleeper';
      try {
        await decodeJourneyImage(JOURNEY_VEHICLES[fallback].image);
        if (!current) return;
        setBroken(false);
        setShown({ category: fallback, route: routeKey });
        callbackRef.current(fallback, 'Ảnh xe đang chọn chưa tải được. Đang hiển thị dòng xe thay thế.');
      } catch {
        if (current) callbackRef.current(selectedVehicle, 'Chưa tải được ảnh xe. Bạn vẫn có thể tìm chuyến.');
      }
    });
    return () => { current = false; };
  }, [selectedVehicle, routeKey, fromCity, toCity, introReady]);

  const cfg = shown && JOURNEY_VEHICLES[shown.category];
  const width = cfg ? cfg.width * (mobile ? 1.3 : 1) : 0;
  const factor = width / 1376;
  const visibleCenter = shown?.category === 'cabin' ? 712.5 : 706.5;
  const finalX = mobile && cfg ? 800 - (visibleCenter - cfg.anchor[0]) * factor : shown?.category === 'limousine' ? 707 : shown?.category === 'sleeper' ? 633.5 : 650;
  const finalY = mobile ? 825 : 782;
  const key = shown ? `${shown.category}:${shown.route}` : '';
  const anchorX = cfg ? cfg.anchor[0] * factor : 0;
  const anchorY = cfg ? cfg.anchor[1] * factor : 0;
  return (
    <svg className="journey-vehicle-layer" viewBox="0 0 1600 1000" preserveAspectRatio={mobile ? "xMidYMax meet" : "xMidYMid slice"} aria-hidden="true" data-testid="journey-vehicle-layer">
      <g id="layer-vehicle" data-testid="layer-vehicle">
        <AnimatePresence mode="wait">
          {shown && cfg && !broken && <motion.g key={`${shown.category}:${shown.route}`} data-vehicle={shown.category} className="journey-bus"
            initial={reduced || settledKey === key ? false : { transform: `translate(${JOURNEY_DRIVE.x[0]}px, ${JOURNEY_DRIVE.y[0]}px) scale(.42)`, opacity: 0 }}
            animate={{ transform: reduced || settledKey === key ? `translate(${finalX}px, ${finalY}px) scale(1)` : JOURNEY_DRIVE.x.map((x, i) => `translate(${i === 3 ? finalX : x}px, ${i === 3 ? finalY : JOURNEY_DRIVE.y[i]}px) scale(${JOURNEY_DRIVE.scale[i]})`), opacity: 1 }}
            onAnimationComplete={() => setSettledKey(key)}
            exit={{ opacity: 0, transition: { duration: reduced ? 0 : .22 } }}
            transition={{ duration: reduced || settledKey === key ? 0 : JOURNEY_DRIVE.duration, times: JOURNEY_DRIVE.times, ease: ['linear', 'linear', 'easeOut'] }}
            style={{ transformOrigin: '0px 0px' }}>
            {/* Shadows and image share the exact wheel anchor throughout the journey. */}
            <g transform={`translate(${-anchorX} ${-anchorY})`}>
              {/* Soft ambient undercarriage shadow */}
              <ellipse cx={anchorX + width * 0.04} cy={anchorY + 4} rx={width * 0.35} ry="14" fill="#102744" opacity=".22" />
              {/* Dark tire contact patches grounding wheels directly on asphalt */}
              {cfg.wheels.map(([x, y], i) => (
                <ellipse key={i} cx={x * factor} cy={y * factor - 3} rx={width * 0.038} ry="3" fill="#0d1b2a" opacity=".4" />
              ))}
              <image href={cfg.image} width={width} height={width * 768 / 1376}
                onError={() => { setBroken(true); callbackRef.current(shown.category, 'Ảnh xe gặp sự cố hiển thị. Vui lòng tải lại trang.'); }} />
            </g>
          </motion.g>}
        </AnimatePresence>
      </g>
    </svg>
  );
};
