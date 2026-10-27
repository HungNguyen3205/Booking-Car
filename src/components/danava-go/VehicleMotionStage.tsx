import { useJourneyReducedMotion, useJourneyMobile } from './useJourneyReducedMotion';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, animate, motion, useMotionValue, useTransform } from 'framer-motion';
import type { VehicleCategory } from '../../types';
import { decodeJourneyImage, JOURNEY_VEHICLES, JOURNEY_DRIVE, JOURNEY_TURN_ATLAS, getJourneyDrivePose, getVehicleRest } from './journeyStageConfig';

function DrivingVehicle({ category, mobile, approach, reduced, atlasReady, departing, onDepartureComplete, onSettled, onLoad, onError }: {
  category: VehicleCategory; mobile: boolean; approach: boolean; reduced: boolean; atlasReady: boolean;
  departing: boolean; onDepartureComplete?: () => void;
  onSettled: () => void; onLoad: () => void; onError: () => void;
}) {
  const cfg = JOURNEY_VEHICLES[category];
  const width = cfg.width * (mobile ? 1.3 : 1);
  const factor = width/cfg.source[0];
  const anchorX = cfg.anchor[0]*factor, anchorY = cfg.anchor[1]*factor;
  const [restX, restY] = getVehicleRest(category, mobile);
  const progress = useMotionValue(approach ? 0 : 1);
  const departure = useMotionValue(0);
  const transform = useTransform(() => {
    const p = progress.get(), d = departure.get();
    if (d > 0) return `translate(${restX + 1300*d}px, ${restY}px) scale(1)`;
    // Without the atlas, restrict entry to the compatible near camera angle.
    const pose = getJourneyDrivePose(atlasReady ? p : .72 + p*.28, [restX, restY]);
    return `translate(${pose.x}px, ${pose.y}px) scale(${pose.scale})`;
  });
  const departOpacity = useTransform(departure, [0, .85, 1], [1, 1, 0]);
  useEffect(() => {
    if (!departing) return;
    progress.set(1);
    if (reduced) { onDepartureComplete?.(); return; }
    const controls = animate(departure, 1, { duration: .85, ease: [.35, 0, .7, 1], onComplete: onDepartureComplete });
    return () => controls.stop();
  }, [departing, reduced, departure, progress, onDepartureComplete]);
  const near = useTransform(progress, [.46, .54], atlasReady ? [0, 1] : [1, 1]);
  const front = useTransform(progress, p => {
    const rear = Math.min(1, Math.max(0, (p-.22)/.05)) * (1-Math.min(1, Math.max(0, (p-.36)/.08)));
    return (1-near.get())*(1-rear);
  });
  const rear = useTransform(() => 1-near.get()-front.get());
  useEffect(() => {
    if (!approach || reduced || departing) { progress.set(1); return; }
    const controls = animate(progress, 1, { duration: JOURNEY_DRIVE.duration, ease: 'linear', onComplete: onSettled });
    return () => controls.stop();
  }, [approach, reduced, departing, progress, onSettled]);
  return <motion.g data-vehicle={category} data-drive-state={departing ? 'departing' : approach ? 'driving' : 'parked'}
    className="journey-bus" style={{ transform, transformOrigin: '0px 0px' }}
    initial={{ opacity: reduced ? 1 : 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    transition={{ duration: reduced ? 0 : .12 }}>
    <motion.g style={{ opacity: departOpacity }}>
    {atlasReady && cfg.views.map(([vx, vy, vw, vh], i) => {
      const bodyWidth = width*(category === 'cabin' ? .887 : .951);
      const bodyHeight = bodyWidth*vh/vw;
      return <motion.g key={i} style={{ opacity: i ? rear : front }} data-travel-view={i ? 'rear-left' : 'front-right'}>
        <ellipse cx="0" cy="-2" rx={bodyWidth*.4} ry="7" fill="#102744" opacity=".25" />
        <svg x={-bodyWidth/2} y={-bodyHeight} width={bodyWidth} height={bodyHeight} viewBox={`${vx} ${vy} ${vw} ${vh}`} overflow="hidden">
          <image href={JOURNEY_TURN_ATLAS} width="1254" height="1254" />
        </svg>
      </motion.g>;
    })}
    <motion.g style={{ opacity: near }} transform={`translate(${-anchorX} ${-anchorY})`}>
      <ellipse cx={anchorX} cy={anchorY-3} rx={width*.34} ry="9" fill="#102744" opacity=".15" />
      {cfg.wheels.map(([px, py], i) => <ellipse key={i} cx={px*factor} cy={py*factor-2} rx={width*.033} ry="3" fill="#0d1b2a" opacity=".4" />)}
      <image data-vehicle-photo="true" href={cfg.image} width={width} height={cfg.source[1]*factor} onLoad={onLoad} onError={onError} />
    </motion.g>
    </motion.g>
  </motion.g>;
}

interface VehicleMotionStageProps {
  selectedVehicle: VehicleCategory;
  introReady?: boolean;
  departing?: boolean;
  onDepartureComplete?: () => void;
  onVehicleError?: (fallback: VehicleCategory, message: string) => void;
}

export const VehicleMotionStage: React.FC<VehicleMotionStageProps> = ({ selectedVehicle, introReady = true, onVehicleError, departing = false, onDepartureComplete }) => {
  const reduced = useJourneyReducedMotion();
  const mobile = useJourneyMobile();
  const reducedRef = useRef(reduced);
  useEffect(() => { reducedRef.current = reduced; }, [reduced]);
  const [shown, setShown] = useState<VehicleCategory | null>(null);
  const [introDone, setIntroDone] = useState(reduced);
  const [broken, setBroken] = useState(false);
  const [atlasReady, setAtlasReady] = useState(false);
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
      setIntroDone(reducedRef.current);
      shownRef.current = category;
      setBroken(false);
      setShown(category);
    };
    if (introReady) {
      void Promise.all([decodeJourneyImage(JOURNEY_VEHICLES[selectedVehicle].image), decodeJourneyImage(JOURNEY_TURN_ATLAS).then(() => { if(current()) setAtlasReady(true); }).catch(() => {})]).then(() => commit(selectedVehicle)).catch(async () => {
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

  const settle = useCallback(() => setIntroDone(true), []);
  return <svg className="journey-vehicle-layer" viewBox="0 0 1600 1000" preserveAspectRatio={mobile ? 'xMidYMax meet' : 'xMidYMid slice'} aria-hidden="true" data-testid="journey-vehicle-layer">
    <g id="layer-vehicle" data-testid="layer-vehicle">
      <AnimatePresence mode="wait">
        {shown && !broken && <DrivingVehicle key={shown} category={shown} mobile={mobile}
          approach={!introDone && !reduced} reduced={reduced} atlasReady={atlasReady} departing={departing} onDepartureComplete={onDepartureComplete} onSettled={settle}
          onLoad={() => { lastGood.current = shown; }}
          onError={() => {
            const previous = lastGood.current;
            ++requests.current;
            setIntroDone(true);
            if (previous && previous !== shown) { shownRef.current = previous; setShown(previous); }
            else setBroken(true);
            callback.current?.(previous || shown, 'Ảnh xe gặp sự cố. Bạn vẫn có thể tìm chuyến.');
          }} />}
      </AnimatePresence>
    </g>
  </svg>;
};
