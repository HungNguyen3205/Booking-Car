import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import type { VehicleCategory } from '../../types';
import { VehicleVisual } from './VehicleVisual';
import { sceneService } from '../../data/sceneData';
import type { DestinationScene, RoutePairOverride } from '../../data/sceneData';
import { MapPin } from 'lucide-react';

interface TicketJourneySceneProps {
  fromCity: string;
  toCity: string;
  vehicleCategory: VehicleCategory;
  introReady?: boolean;
}

/**
 * TicketJourneyScene Component:
 * Strict single-coordinate 3D Pop-up Diorama stage based on 5-step keyframes:
 * 1. 0–350ms: Closed ticket booklet resting on cream desk surface (#F7F4EC)
 * 2. 150–850ms: Paper flap hinges open in 3D along crease line
 * 3. 400–1100ms: Pop-up miniature landscape diorama emerges (Cầu Rồng left, Ngọ Môn right)
 * 4. 700–1700ms: Coach bus advances into foreground along the curved asphalt road
 * 5. 1100–1800ms: Route SVG line draws from origin to destination with landmark pins
 * 
 * - Fixed intrinsic aspect ratio matching composition (1313 x 609)
 * - 100% transparent alpha outside the silhouette — no rectangular box, no card border
 * - Geographically accurate landmark mapping (Đà Nẵng = Cầu Rồng, Huế = Ngọ Môn)
 * - Tab switching crossfades vehicle (250-400ms) without restarting intro
 * - Reduced motion support (immediate static display)
 */
export const TicketJourneyScene: React.FC<TicketJourneySceneProps> = ({
  fromCity,
  toCity,
  vehicleCategory,
  introReady = true,
}) => {
  const shouldReduceMotion = useReducedMotion();
  const [hasPlayedIntro, setHasPlayedIntro] = useState(false);

  // Synchronized scene state
  const [activeScene, setActiveScene] = useState<{
    origin: DestinationScene;
    dest: DestinationScene;
    pair: RoutePairOverride | null;
  }>(() => {
    return {
      origin: sceneService.getScene(fromCity),
      dest: sceneService.getScene(toCity),
      pair: sceneService.getPairOverride(fromCity, toCity),
    };
  });

  const seqRef = useRef(0);

  useEffect(() => {
    const seq = ++seqRef.current;
    const targetOrigin = sceneService.getScene(fromCity);
    const targetDest = sceneService.getScene(toCity);
    const targetPair = sceneService.getPairOverride(fromCity, toCity);

    const preloads: Promise<unknown>[] = [];
    if (targetPair?.pairAsset) {
      preloads.push(sceneService.preloadAsset(targetPair.pairAsset));
    } else {
      if (targetOrigin.sceneAsset) preloads.push(sceneService.preloadAsset(targetOrigin.sceneAsset));
      if (targetDest.sceneAsset) preloads.push(sceneService.preloadAsset(targetDest.sceneAsset));
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

  // Mark intro as complete once triggered so user interactions never re-play it
  useEffect(() => {
    if (introReady && !hasPlayedIntro) {
      const timer = setTimeout(() => {
        setHasPlayedIntro(true);
      }, shouldReduceMotion ? 50 : 1900);
      return () => clearTimeout(timer);
    }
  }, [introReady, hasPlayedIntro, shouldReduceMotion]);

  // City IDs normalized
  const originId = sceneService.getCanonicalCityId(fromCity);
  const destId = sceneService.getCanonicalCityId(toCity);

  const isDadHuePair =
    (originId === 'da-nang' && destId === 'hue') ||
    (originId === 'hue' && destId === 'da-nang');

  const isReversed = originId === 'hue' && destId === 'da-nang';

  // Artwork asset source
  const artworkSrc = activeScene.pair?.pairAsset || activeScene.origin.sceneAsset;

  return (
    <div
      className="relative w-full max-w-[720px] aspect-[1313/609] select-none mx-auto isolate"
      aria-hidden="true"
    >
      {/* ============================================================
          LAYER 1: CONTACT SHADOW ON DESK SURFACE (#F7F4EC)
          Soft elliptical contact shadow anchoring the paper base
          ============================================================ */}
      <motion.div
        initial={shouldReduceMotion ? { opacity: 0.85, scaleX: 1 } : { opacity: 0.5, scaleX: 0.8 }}
        animate={{ opacity: 0.85, scaleX: 1 }}
        transition={{ duration: shouldReduceMotion ? 0.04 : 0.8, ease: 'easeOut' }}
        className="absolute inset-x-[4%] bottom-[-2%] h-[16%] pointer-events-none z-[1]"
        style={{
          background:
            'radial-gradient(ellipse 70% 50% at 50% 50%, rgba(16, 39, 68, 0.22) 0%, rgba(16, 39, 68, 0.08) 50%, transparent 80%)',
          filter: 'blur(4px)',
        }}
      />

      {/* ============================================================
          LAYER 2: 3D POP-UP DIORAMA COMPOSITION
          Contains:
          - 2.5D paper ticket base lying in perspective
          - Miniature pop-up Dragon Bridge (left) and Ngọ Môn (right)
          - Curving coastal highway road winding from bridge to foreground
          - Natural silhouette with 100% transparent alpha outside
          - NO white rectangular frame, NO card border, NO fake text
          ============================================================ */}
      <motion.div
        initial={
          shouldReduceMotion || hasPlayedIntro
            ? { opacity: 1, y: 0, scale: 1 }
            : { opacity: 0, y: 18, scale: 0.97 }
        }
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={
          shouldReduceMotion || hasPlayedIntro
            ? { duration: 0.04 }
            : { duration: 0.75, delay: 0.35, ease: [0.16, 1, 0.3, 1] }
        }
        className="absolute inset-0 w-full h-full pointer-events-none z-[2]"
      >
        <AnimatePresence mode="wait">
          <motion.img
            key={artworkSrc}
            src={artworkSrc}
            alt="DANAVA Pop-up Journey Diorama"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: shouldReduceMotion ? 0.04 : 0.35 }}
            className="w-full h-full object-contain pointer-events-none select-none"
            loading="eager"
          />
        </AnimatePresence>
      </motion.div>

      {/* ============================================================
          LAYER 3: 3D PAPER FLAP (HINGES OPEN IN 3D ALONG BACK CREASE)
          Simulates booklet opening from 01-ve-dong to 02-ve-dang-mo
          ============================================================ */}
      {!hasPlayedIntro && !shouldReduceMotion && (
        <div
          className="absolute inset-x-[12%] bottom-[20%] h-[38%] z-[3] pointer-events-none flex items-center justify-center"
          style={{ perspective: 900 }}
        >
          <motion.div
            initial={{ rotateX: 0, opacity: 0.95 }}
            animate={{ rotateX: -98, opacity: 0 }}
            transition={{ duration: 0.75, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            style={{ transformOrigin: 'top center', backfaceVisibility: 'hidden' }}
            className="w-full h-full rounded-t-[18px] bg-gradient-to-b from-[#FAF8F3] to-[#EDE7D9] border border-[#DDD8CA] shadow-md flex items-center justify-center"
          >
            <span className="font-serif italic text-xs text-[#8A95A5] tracking-widest">
              Hành trình Việt Nam...
            </span>
          </motion.div>
        </div>
      )}

      {/* ============================================================
          LAYER 4: ROUTE SVG ARC & GEOGRAPHICALLY ACCURATE PINS
          In 1313 x 609 unified coordinate system:
          - Dragon Bridge (Cầu Rồng, Đà Nẵng): x = 280 (21.3%), y = 310 (50.9%)
          - Ngọ Môn Gate (Huế): x = 1060 (80.7%), y = 260 (42.7%)
          ============================================================ */}
      <div className="absolute inset-0 pointer-events-none z-[5]">
        <svg
          viewBox="0 0 1313 609"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full overflow-visible"
        >
          <defs>
            <linearGradient id="routeGlowGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#0097A7" stopOpacity="0.95" />
              <stop offset="50%" stopColor="#00E5FF" stopOpacity="1" />
              <stop offset="100%" stopColor="#F3B54A" stopOpacity="0.95" />
            </linearGradient>

            {/* Glowing marker dot filter */}
            <filter id="glowFilter" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Route path halo */}
          <motion.path
            d={
              isReversed
                ? 'M 1060,260 Q 670,140 280,310'
                : 'M 280,310 Q 670,140 1060,260'
            }
            stroke="#00E5FF"
            strokeWidth="5"
            strokeLinecap="round"
            className="opacity-30 filter blur-xs"
            initial={shouldReduceMotion || hasPlayedIntro ? { pathLength: 1 } : { pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={
              shouldReduceMotion || hasPlayedIntro
                ? { duration: 0.04 }
                : { duration: 0.8, delay: 1.05, ease: 'easeOut' }
            }
          />

          {/* Foreground glowing dashed route line */}
          <motion.path
            d={
              isReversed
                ? 'M 1060,260 Q 670,140 280,310'
                : 'M 280,310 Q 670,140 1060,260'
            }
            stroke="url(#routeGlowGrad)"
            strokeWidth="2.8"
            strokeLinecap="round"
            strokeDasharray="8 6"
            initial={shouldReduceMotion || hasPlayedIntro ? { pathLength: 1 } : { pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={
              shouldReduceMotion || hasPlayedIntro
                ? { duration: 0.04 }
                : { duration: 0.8, delay: 1.05, ease: 'easeOut' }
            }
          />
        </svg>

        {/* ----------------------------------------------------------
            GEOGRAPHICALLY ACCURATE LANDMARK LABELS:
            - Left Anchor (Cầu Rồng) is ALWAYS Đà Nẵng!
            - Right Anchor (Ngọ Môn) is ALWAYS Huế!
            Direction reflects origin/dest without swapping geography!
            ---------------------------------------------------------- */}
        {isDadHuePair ? (
          <>
            {/* LEFT PIN (Cầu Rồng - Đà Nẵng) */}
            <motion.div
              initial={shouldReduceMotion || hasPlayedIntro ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={
                shouldReduceMotion || hasPlayedIntro
                  ? { duration: 0.04 }
                  : { duration: 0.35, delay: 1.25, ease: 'backOut' }
              }
              className="absolute -translate-x-1/2 -translate-y-full mb-1 flex flex-col items-center pointer-events-auto"
              style={{ left: '21.3%', top: '50.9%' }}
            >
              <div className="bg-[#102744]/90 backdrop-blur-md text-white px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full border border-teal-400/40 shadow-md flex items-center gap-1.5 whitespace-nowrap">
                {!isReversed ? (
                  <span className="w-2 h-2 rounded-full bg-[#00E5FF] animate-pulse shrink-0" />
                ) : (
                  <MapPin className="w-3 h-3 text-[#F3B54A] shrink-0" />
                )}
                <span className="text-[10px] sm:text-xs font-bold leading-none">
                  Đà Nẵng
                </span>
              </div>
            </motion.div>

            {/* RIGHT PIN (Ngọ Môn - Huế) */}
            <motion.div
              initial={shouldReduceMotion || hasPlayedIntro ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={
                shouldReduceMotion || hasPlayedIntro
                  ? { duration: 0.04 }
                  : { duration: 0.35, delay: 1.4, ease: 'backOut' }
              }
              className="absolute -translate-x-1/2 -translate-y-full mb-1 flex flex-col items-center pointer-events-auto"
              style={{ left: '80.7%', top: '42.7%' }}
            >
              <div className="bg-[#102744]/90 backdrop-blur-md text-white px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full border border-amber-400/40 shadow-md flex items-center gap-1.5 whitespace-nowrap">
                {!isReversed ? (
                  <MapPin className="w-3 h-3 text-[#F3B54A] shrink-0" />
                ) : (
                  <span className="w-2 h-2 rounded-full bg-[#00E5FF] animate-pulse shrink-0" />
                )}
                <span className="text-[10px] sm:text-xs font-bold leading-none">
                  Huế
                </span>
              </div>
            </motion.div>
          </>
        ) : (
          /* Fallback for other single destinations */
          <motion.div
            initial={shouldReduceMotion || hasPlayedIntro ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={
              shouldReduceMotion || hasPlayedIntro
                ? { duration: 0.04 }
                : { duration: 0.35, delay: 1.25, ease: 'backOut' }
            }
            className="absolute -translate-x-1/2 -translate-y-full mb-1 flex flex-col items-center pointer-events-auto"
            style={{ left: '78%', top: '44%' }}
          >
            <div className="bg-[#102744]/90 backdrop-blur-md text-white px-3 py-1 rounded-full border border-amber-400/40 shadow-md flex items-center gap-1.5">
              <MapPin className="w-3 h-3 text-[#F3B54A] shrink-0" />
              <span className="text-[10px] sm:text-xs font-bold leading-none">
                {activeScene.dest.label || toCity}
              </span>
            </div>
          </motion.div>
        )}
      </div>

      {/* ============================================================
          LAYER 5: COACH BUS (ADVANCES ALONG ROAD IN INTRO)
          Positioned in the exact same normalized stage coordinate system:
          - Left: 50%
          - Top: 55%
          - Width: 44%
          - Wheels make realistic contact with the asphalt roadway
          - Multi-point contact shadows & chassis ambient shadow
          ============================================================ */}
      <motion.div
        initial={
          shouldReduceMotion || hasPlayedIntro
            ? { opacity: 1, x: 0, y: 0, scale: 1 }
            : { opacity: 0, x: 45, y: 14, scale: 0.92 }
        }
        animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
        transition={
          shouldReduceMotion || hasPlayedIntro
            ? { duration: 0.04 }
            : { duration: 0.85, delay: 0.7, ease: [0.16, 1, 0.3, 1] }
        }
        className="absolute pointer-events-none z-[8]"
        style={{
          left: '50%',
          top: '55%',
          width: '44%',
        }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={vehicleCategory}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: shouldReduceMotion ? 0.04 : 0.3 }}
            className="w-full"
          >
            <VehicleVisual category={vehicleCategory} />
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
