import React, { useState, useEffect, useRef, useId } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import type { VehicleCategory } from '../../types';
import { sceneService } from '../../data/sceneData';
import type { DestinationScene, RoutePairOverride } from '../../data/sceneData';
import { MapPin } from 'lucide-react';

export const DIORAMA_ASSET = '/assets/images/scenes/vietnam_journey_panorama.webp';

interface TicketJourneySceneProps {
  fromCity: string;
  toCity: string;
  vehicleCategory: VehicleCategory;
  introReady?: boolean;
}

/**
 * TicketJourneyScene:
 * Master Scenic Panorama of Vietnam Heritage Journey (Đà Nẵng — Huế):
 * - Expansive cream sky with soft mountain silhouettes on the left
 * - Golden Dragon Bridge across Han River
 * - Ngọ Môn Hue imperial gate on lush forested hill
 * - Curving two-lane asphalt highway connecting Hue down to the foreground
 * - Vehicle grounded on the asphalt road in the foreground (62-68% horizontal)
 * - Ivory ticket base on left and upright curled ticket stub on right
 */
export const TicketJourneyScene: React.FC<TicketJourneySceneProps> = ({
  fromCity,
  toCity,
  vehicleCategory,
  introReady = true,
}) => {
  const shouldReduceMotion = useReducedMotion();
  const id = useId().replace(/:/g, '');
  const [hasPlayedIntro, setHasPlayedIntro] = useState(false);

  // Active scene & route pair resolution
  const [activeScene, setActiveScene] = useState<{
    origin: DestinationScene;
    dest: DestinationScene;
    pair: RoutePairOverride | null;
  }>(() => ({
    origin: sceneService.getScene(fromCity),
    dest: sceneService.getScene(toCity),
    pair: sceneService.getPairOverride(fromCity, toCity),
  }));

  const seqRef = useRef(0);

  useEffect(() => {
    const seq = ++seqRef.current;
    const targetOrigin = sceneService.getScene(fromCity);
    const targetDest = sceneService.getScene(toCity);
    const targetPair = sceneService.getPairOverride(fromCity, toCity);

    const preloads: Promise<unknown>[] = [sceneService.preloadAsset(DIORAMA_ASSET)];
    if (targetPair?.pairAsset) {
      preloads.push(sceneService.preloadAsset(targetPair.pairAsset));
    }

    Promise.all(preloads).then(() => {
      if (seq === seqRef.current) {
        setActiveScene({
          origin: targetOrigin,
          dest: targetDest,
          pair: targetPair,
        });
      }
    });
  }, [fromCity, toCity]);

  // One-time intro synchronization
  useEffect(() => {
    if (introReady && !hasPlayedIntro) {
      const timer = setTimeout(() => {
        setHasPlayedIntro(true);
      }, shouldReduceMotion ? 50 : 2100);
      return () => clearTimeout(timer);
    }
  }, [introReady, hasPlayedIntro, shouldReduceMotion]);

  const originId = sceneService.getCanonicalCityId(fromCity);
  const destId = sceneService.getCanonicalCityId(toCity);

  const isDadHuePair =
    (originId === 'da-nang' && destId === 'hue') ||
    (originId === 'hue' && destId === 'da-nang');

  const isReversed = originId === 'hue' && destId === 'da-nang';
  const artworkSrc = DIORAMA_ASSET;

  // Vehicle configs placed on the asphalt road in 1376x768 coordinates
  // road lane is at left: 49.4% (x ≈ 680), top: 45.5% (y ≈ 350)
  const vehicleAssets = {
    sleeper: {
      image: '/assets/images/bus_hanh_trinh_sleeper.png',
      width: '27.2%',
      left: '49.4%',
      top: '45.5%',
      shadowWidth: '92%',
      shadowHeight: '14%',
      shadowTop: '95%',
      shadowLeft: '50%',
    },
    limousine: {
      image: '/assets/images/bus_limousine_cutout.png',
      width: '26.0%',
      left: '49.8%',
      top: '46.8%',
      shadowWidth: '88%',
      shadowHeight: '12%',
      shadowTop: '94%',
      shadowLeft: '50%',
    },
    cabin: {
      image: '/assets/images/bus_cabin_cutout.png',
      width: '27.6%',
      left: '49.2%',
      top: '44.8%',
      shadowWidth: '94%',
      shadowHeight: '14%',
      shadowTop: '95%',
      shadowLeft: '50%',
    },
  }[vehicleCategory];

  const originLabel = activeScene.origin.label || fromCity || 'Đà Nẵng';
  const destLabel = activeScene.dest.label || toCity || 'Huế';

  return (
    <div
      className="relative w-full aspect-[1376/768] select-none mx-auto isolate"
      data-testid="journey-stage"
      aria-hidden="true"
    >
      {/* 1. MASTER PANORAMA ARTWORK CANVAS */}
      <motion.div
        initial={
          shouldReduceMotion || hasPlayedIntro
            ? { opacity: 1, scale: 1 }
            : { opacity: 0, scale: 0.98 }
        }
        animate={{ opacity: 1, scale: 1 }}
        transition={
          shouldReduceMotion || hasPlayedIntro
            ? { duration: 0.04 }
            : { duration: 0.8, delay: 0.15, ease: [0.16, 1, 0.3, 1] }
        }
        className="absolute inset-0 w-full h-full pointer-events-none z-[2]"
      >
        <img
          src={artworkSrc}
          alt="DANAVA Hành Trình Pop-up Panorama"
          className="w-full h-full object-cover sm:object-contain pointer-events-none select-none"
          loading="eager"
        />
      </motion.div>

      {/* 2. SVG LAYER: GLOWING ROUTE, LANDMARK PINS & RIGHT TICKET STUB OVERLAY */}
      <div className="absolute inset-0 pointer-events-none z-[5]">
        <svg
          viewBox="0 0 1376 768"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full overflow-visible"
        >
          <defs>
            <linearGradient id={`${id}-routeGrad`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#0097A7" stopOpacity="0.95" />
              <stop offset="50%" stopColor="#00E5FF" stopOpacity="1" />
              <stop offset="100%" stopColor="#F3B54A" stopOpacity="0.95" />
            </linearGradient>
            <filter id={`${id}-blur`} x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" />
            </filter>
          </defs>

          {/* S-curve route between Đà Nẵng and Huế */}
          {isDadHuePair && (
            <>
              {/* Route halo */}
              <motion.path
                d={
                  isReversed
                    ? 'M 1170,165 Q 970,110 770,200'
                    : 'M 770,200 Q 970,110 1170,165'
                }
                stroke="#00E5FF"
                strokeWidth="6"
                strokeLinecap="round"
                filter={`url(#${id}-blur)`}
                className="opacity-40"
                initial={shouldReduceMotion || hasPlayedIntro ? { pathLength: 1 } : { pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={
                  shouldReduceMotion || hasPlayedIntro
                    ? { duration: 0.04 }
                    : { duration: 0.9, delay: 0.9, ease: 'easeOut' }
                }
              />

              {/* Crisp glowing dashed route path */}
              <motion.path
                d={
                  isReversed
                    ? 'M 1170,165 Q 970,110 770,200'
                    : 'M 770,200 Q 970,110 1170,165'
                }
                stroke={`url(#${id}-routeGrad)`}
                strokeWidth="3.2"
                strokeLinecap="round"
                strokeDasharray="9 6"
                initial={shouldReduceMotion || hasPlayedIntro ? { pathLength: 1 } : { pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={
                  shouldReduceMotion || hasPlayedIntro
                    ? { duration: 0.04 }
                    : { duration: 0.9, delay: 0.9, ease: 'easeOut' }
                }
              />
            </>
          )}

          {/* Dynamic Route Text on Right Upright Ticket Stub */}
          <g transform="rotate(1.5, 1272, 330)">
            <text
              x="1272"
              y="244"
              textAnchor="middle"
              fontFamily="'Noto Serif', serif"
              fontSize="16"
              fontWeight="700"
              fill="#102744"
              letterSpacing="1.2"
              opacity="0.95"
            >
              HÀNH TRÌNH
            </text>

            <text
              x="1272"
              y="346"
              textAnchor="middle"
              fontFamily="'Be Vietnam Pro', sans-serif"
              fontSize="14"
              fontWeight="700"
              fill="#102744"
              letterSpacing="1.5"
              opacity="0.9"
            >
              {originLabel.toUpperCase()}
            </text>

            <text
              x="1272"
              y="370"
              textAnchor="middle"
              fontFamily="'Be Vietnam Pro', sans-serif"
              fontSize="16"
              fontWeight="bold"
              fill="#0097A7"
              opacity="0.9"
            >
              ↓
            </text>

            <text
              x="1272"
              y="396"
              textAnchor="middle"
              fontFamily="'Be Vietnam Pro', sans-serif"
              fontSize="14"
              fontWeight="700"
              fill="#102744"
              letterSpacing="1.5"
              opacity="0.9"
            >
              {destLabel.toUpperCase()}
            </text>
          </g>
        </svg>

        {/* 3. GEOGRAPHICALLY ATTACHED LANDMARK LABELS & PINS */}
        {isDadHuePair ? (
          <>
            {/* PIN 1: Cầu Rồng (Đà Nẵng) */}
            <motion.div
              initial={shouldReduceMotion || hasPlayedIntro ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={
                shouldReduceMotion || hasPlayedIntro
                  ? { duration: 0.04 }
                  : { duration: 0.35, delay: 1.1, ease: 'backOut' }
              }
              className="absolute -translate-x-1/2 -translate-y-full flex flex-col items-center pointer-events-auto"
              style={{ left: '55.9%', top: '26.0%' }}
            >
              <div className="bg-[#102744]/95 text-white px-2.5 sm:px-3 py-1 rounded-full border border-teal-400/40 shadow-md flex items-center gap-1.5 whitespace-nowrap">
                {!isReversed ? (
                  <span className="w-2 h-2 rounded-full bg-[#00E5FF] animate-pulse shrink-0" />
                ) : (
                  <MapPin className="w-3 h-3 text-[#F3B54A] shrink-0" />
                )}
                <span className="text-[10px] sm:text-xs font-bold leading-none tracking-wide">
                  Đà Nẵng
                </span>
              </div>
              <div className="w-[1.5px] h-2.5 bg-teal-400/70" />
            </motion.div>

            {/* PIN 2: Ngọ Môn (Huế) */}
            <motion.div
              initial={shouldReduceMotion || hasPlayedIntro ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={
                shouldReduceMotion || hasPlayedIntro
                  ? { duration: 0.04 }
                  : { duration: 0.35, delay: 1.25, ease: 'backOut' }
              }
              className="absolute -translate-x-1/2 -translate-y-full flex flex-col items-center pointer-events-auto"
              style={{ left: '85.0%', top: '21.5%' }}
            >
              <div className="bg-[#102744]/95 text-white px-2.5 sm:px-3 py-1 rounded-full border border-amber-400/40 shadow-md flex items-center gap-1.5 whitespace-nowrap">
                {!isReversed ? (
                  <MapPin className="w-3 h-3 text-[#F3B54A] shrink-0" />
                ) : (
                  <span className="w-2 h-2 rounded-full bg-[#00E5FF] animate-pulse shrink-0" />
                )}
                <span className="text-[10px] sm:text-xs font-bold leading-none tracking-wide">
                  Huế
                </span>
              </div>
              <div className="w-[1.5px] h-2.5 bg-amber-400/70" />
            </motion.div>
          </>
        ) : (
          <motion.div
            initial={shouldReduceMotion || hasPlayedIntro ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={
              shouldReduceMotion || hasPlayedIntro
                ? { duration: 0.04 }
                : { duration: 0.35, delay: 1.1, ease: 'backOut' }
            }
            className="absolute -translate-x-1/2 -translate-y-full flex flex-col items-center pointer-events-auto"
            style={{ left: '72%', top: '35%' }}
          >
            <div className="bg-[#102744]/95 text-white px-3 py-1 rounded-full border border-amber-400/40 shadow-md flex items-center gap-1.5">
              <MapPin className="w-3 h-3 text-[#F3B54A] shrink-0" />
              <span className="text-[10px] sm:text-xs font-bold leading-none">
                {activeScene.dest.label || toCity}
              </span>
            </div>
            <div className="w-[1.5px] h-2.5 bg-amber-400/70" />
          </motion.div>
        )}
      </div>

      {/* 4. PROPORTIONATE VEHICLE GROUNDED ON FOREGROUND ROAD (62-68% horizontal position)
          - Wheels touch the asphalt road surface
          - Natural contact shadow underneath
          - Instant crossfade on vehicle switch without moving layout
          - Rolling deceleration into final stop during intro
      */}
      <motion.div
        initial={
          shouldReduceMotion || hasPlayedIntro
            ? { opacity: 1, x: 0, y: 0, scale: 1 }
            : { opacity: 0, x: 42, y: -10, scale: 0.95 }
        }
        animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
        transition={
          shouldReduceMotion || hasPlayedIntro
            ? { duration: 0.04 }
            : { duration: 0.9, delay: 0.75, ease: [0.16, 1, 0.3, 1] }
        }
        className="absolute pointer-events-none z-[8]"
        style={{
          left: vehicleAssets.left,
          top: vehicleAssets.top,
          width: vehicleAssets.width,
        }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={vehicleCategory}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: shouldReduceMotion ? 0.04 : 0.3 }}
            className="relative w-full"
          >
            {/* Ground Contact Shadow */}
            <div
              className="absolute pointer-events-none rounded-full"
              style={{
                left: vehicleAssets.shadowLeft,
                top: vehicleAssets.shadowTop,
                width: vehicleAssets.shadowWidth,
                height: vehicleAssets.shadowHeight,
                transform: 'translate(-50%, -50%)',
                background:
                  'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(8, 14, 24, 0.75) 0%, rgba(8, 14, 24, 0.35) 55%, transparent 75%)',
                filter: 'blur(4px)',
                zIndex: 6,
              }}
              aria-hidden="true"
            />

            {/* Vehicle image with transparent alpha */}
            <img
              src={vehicleAssets.image}
              alt={vehicleCategory}
              className="relative w-full h-auto object-contain pointer-events-none select-none z-10"
              loading="eager"
            />
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

