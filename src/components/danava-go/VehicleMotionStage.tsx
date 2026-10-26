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

export const VehicleMotionStage: React.FC<VehicleMotionStageProps> = ({
  selectedVehicle,
  introReady = true,
  onVehicleError,
}) => {
  const reduced = useJourneyReducedMotion();
  const mobile = useJourneyMobile();
  const [shownCategory, setShownCategory] = useState<VehicleCategory | null>(null);
  const [introSettled, setIntroSettled] = useState(false);
  const [broken, setBroken] = useState(false);

  const shownCategoryRef = useRef<VehicleCategory | null>(null);
  const latestTargetRef = useRef<VehicleCategory>(selectedVehicle);
  const callbackRef = useRef(onVehicleError);

  useEffect(() => {
    shownCategoryRef.current = shownCategory;
  }, [shownCategory]);

  useEffect(() => {
    callbackRef.current = onVehicleError;
  }, [onVehicleError]);

  useEffect(() => {
    if (!introReady) return;

    const target = selectedVehicle;
    latestTargetRef.current = target;

    decodeJourneyImage(JOURNEY_VEHICLES[target].image)
      .then(() => {
        if (latestTargetRef.current !== target) return;
        setBroken(false);
        setShownCategory((prev) => {
          if (prev !== null && prev !== target) {
            setIntroSettled(true);
          }
          return target;
        });
      })
      .catch(async () => {
        if (latestTargetRef.current !== target) return;
        const current = shownCategoryRef.current;
        if (current) {
          callbackRef.current?.(current, 'Chưa tải được ảnh xe. Giữ xe trước đó; bạn vẫn có thể tìm chuyến.');
          return;
        }
        const fallback: VehicleCategory = target === 'sleeper' ? 'limousine' : 'sleeper';
        try {
          await decodeJourneyImage(JOURNEY_VEHICLES[fallback].image);
          if (latestTargetRef.current !== target) return;
          setBroken(false);
          setShownCategory(fallback);
          callbackRef.current?.(fallback, 'Ảnh xe đang chọn chưa tải được. Đang hiển thị dòng xe thay thế.');
        } catch {
          if (latestTargetRef.current === target) {
            callbackRef.current?.(target, 'Chưa tải được ảnh xe. Bạn vẫn có thể tìm chuyến.');
          }
        }
      });
  }, [selectedVehicle, introReady]);

  const cfg = shownCategory ? JOURNEY_VEHICLES[shownCategory] : null;
  const width = cfg ? cfg.width * (mobile ? 1.3 : 1) : 0;
  const factor = width / 1376;
  const [finalX, finalY] = shownCategory ? getVehicleRest(shownCategory, mobile) : [650, 782];
  const anchorX = cfg ? cfg.anchor[0] * factor : 0;
  const anchorY = cfg ? cfg.anchor[1] * factor : 0;
  const isSettled = introSettled || reduced;

  return (
    <svg
      className="journey-vehicle-layer"
      viewBox="0 0 1600 1000"
      preserveAspectRatio={mobile ? 'xMidYMax meet' : 'xMidYMid slice'}
      aria-hidden="true"
      data-testid="journey-vehicle-layer"
    >
      <g id="layer-vehicle" data-testid="layer-vehicle">
        <AnimatePresence mode="wait">
          {shownCategory && cfg && !broken && (
            <motion.g
              key={shownCategory}
              data-vehicle={shownCategory}
              className="journey-bus"
              initial={
                reduced
                  ? false
                  : isSettled
                  ? { transform: `translate(${finalX}px, ${finalY}px) scale(0.98)`, opacity: 0 }
                  : {
                      transform: `translate(${JOURNEY_DRIVE.x[0]}px, ${JOURNEY_DRIVE.y[0]}px) scale(${JOURNEY_DRIVE.scale[0]})`,
                      opacity: 0,
                    }
              }
              animate={
                reduced || isSettled
                  ? { transform: `translate(${finalX}px, ${finalY}px) scale(1)`, opacity: 1 }
                  : {
                      transform: JOURNEY_DRIVE.x.map(
                        (x, i) =>
                          `translate(${i === 3 ? finalX : x}px, ${i === 3 ? finalY : JOURNEY_DRIVE.y[i]}px) scale(${JOURNEY_DRIVE.scale[i]})`
                      ),
                      opacity: 1,
                    }
              }
              onAnimationComplete={() => {
                setIntroSettled(true);
              }}
              exit={{
                opacity: 0,
                transition: { duration: reduced ? 0 : 0.12, ease: 'easeIn' },
              }}
              transition={
                reduced
                  ? { duration: 0 }
                  : isSettled
                  ? { duration: 0.18, ease: 'easeOut' }
                  : {
                      transform: {
                        duration: JOURNEY_DRIVE.duration,
                        times: JOURNEY_DRIVE.times,
                        ease: ['linear', 'linear', 'easeOut'],
                      },
                      opacity: {
                        duration: 0.16,
                        ease: 'easeOut',
                      },
                    }
              }
              style={{ transformOrigin: '0px 0px' }}
            >
              {/* Shadows and image share the exact wheel anchor throughout the journey. */}
              <g transform={`translate(${-anchorX} ${-anchorY})`}>
                {/* Soft ambient undercarriage shadow */}
                <ellipse
                  cx={anchorX + width * 0.04}
                  cy={anchorY + 4}
                  rx={width * 0.35}
                  ry="14"
                  fill="#102744"
                  opacity=".22"
                />
                {/* Dark tire contact patches grounding wheels directly on asphalt */}
                {cfg.wheels.map(([x, y], i) => (
                  <ellipse
                    key={i}
                    cx={x * factor}
                    cy={y * factor - 3}
                    rx={width * 0.038}
                    ry="3"
                    fill="#0d1b2a"
                    opacity=".4"
                  />
                ))}
                <image
                  href={cfg.image}
                  width={width}
                  height={(width * 768) / 1376}
                  onError={() => {
                    setBroken(true);
                    callbackRef.current?.(shownCategory, 'Ảnh xe gặp sự cố hiển thị. Vui lòng tải lại trang.');
                  }}
                />
              </g>
            </motion.g>
          )}
        </AnimatePresence>
      </g>
    </svg>
  );
};
