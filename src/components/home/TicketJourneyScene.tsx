import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import type { VehicleCategory } from '../../types';
import { VehicleVisual } from './VehicleVisual';
import { RoadStage } from './RoadStage';
import { sceneService } from '../../data/sceneData';
import type { DestinationScene, RoutePairOverride } from '../../data/sceneData';
import { MapPin } from 'lucide-react';

interface TicketJourneySceneProps {
  fromCity: string;
  toCity: string;
  vehicleCategory: VehicleCategory;
  introReady?: boolean;
}

export const TicketJourneyScene: React.FC<TicketJourneySceneProps> = ({
  fromCity,
  toCity,
  vehicleCategory,
  introReady = true,
}) => {
  const shouldReduceMotion = useReducedMotion();
  const [hasPlayedIntro, setHasPlayedIntro] = useState(false);

  // Scene state synchronized with route selection
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

  // Sync scene assets with debounce & race-condition protection
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

  // Once intro triggers, mark as played so it never loops or restarts unexpectedly
  useEffect(() => {
    if (introReady && !hasPlayedIntro) {
      const timer = setTimeout(() => {
        setHasPlayedIntro(true);
      }, shouldReduceMotion ? 50 : 1900);
      return () => clearTimeout(timer);
    }
  }, [introReady, hasPlayedIntro, shouldReduceMotion]);

  // Derived display labels
  const originLabel = activeScene.origin.label || fromCity;
  const destLabel = activeScene.dest.label || toCity;

  // Background artwork source
  const artworkSrc = activeScene.pair?.pairAsset || activeScene.origin.sceneAsset;

  return (
    <div
      className="relative w-full max-w-[720px] h-[340px] sm:h-[380px] lg:h-[400px] xl:h-[420px] bg-transparent select-none mx-auto flex items-end justify-center isolate"
      aria-hidden="true"
    >
      {/* ============================================================
          1. 2.5D PERSPECTIVE PAPER TICKET BASE (TẤM VÉ TRÊN MẶT BÀN)
          Lies tilted on the desk surface with realistic contact shadow
          ============================================================ */}
      <div
        className="absolute inset-x-1 sm:inset-x-4 bottom-0 sm:bottom-1 h-[165px] sm:h-[185px] lg:h-[195px] z-[2] flex items-center justify-center pointer-events-none"
        style={{ perspective: 1000 }}
      >
        <motion.div
          initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: shouldReduceMotion ? 0.04 : 0.45, ease: 'easeOut' }}
          className="relative w-full h-full rounded-[24px] sm:rounded-[28px] bg-[#FFFEFA] border border-[#DDD8CA] border-b-[3.5px] border-b-[#BDB6A5] shadow-[0_24px_45px_-8px_rgba(16,39,68,0.18),0_8px_18px_-4px_rgba(16,39,68,0.1)] overflow-hidden flex flex-col justify-between p-5 sm:p-7"
          style={{
            transform: 'rotateX(48deg) rotateY(-1deg)',
            transformOrigin: 'bottom center',
          }}
        >
          {/* Subtle paper grain & warm ambient gradient */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#FAF8F5] via-[#FFFEFA] to-[#FAF8F5] pointer-events-none" />

          {/* Ticket Header Row (In rear perspective) */}
          <div className="flex items-center justify-between relative z-10 opacity-70">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[8px] sm:text-[9.5px] tracking-[0.2em] font-extrabold text-[#647084] uppercase">
                DANAVA BOARDING PASS
              </span>
              <span className="font-mono text-[7.5px] sm:text-[8.5px] tracking-widest text-[#0097A7] font-semibold">
                • {originLabel.toUpperCase()} → {destLabel.toUpperCase()}
              </span>
            </div>
            <div className="text-right">
              <span className="font-serif italic text-[8.5px] sm:text-[9.5px] text-[#0097A7] font-semibold tracking-wider">
                CHẠM MỘT VÉ • MỞ HÀNH TRÌNH
              </span>
            </div>
          </div>

          {/* Center Perforation Line & Ticket Notches */}
          <div className="absolute left-[54%] inset-y-0 w-px border-r-2 border-dashed border-[#CBD5E1] opacity-60 hidden sm:block">
            <div className="absolute -top-3 -left-2.5 w-5 h-5 rounded-full bg-[#F7F4EC] border-b border-[#CBD5E1]" />
            <div className="absolute -bottom-3 -left-2.5 w-5 h-5 rounded-full bg-[#F7F4EC] border-t border-[#CBD5E1]" />
          </div>

          {/* Ticket Front Lip (Unobstructed in immediate foreground!) */}
          <div className="flex items-center justify-between relative z-10 pt-2 border-t border-[#EDE8DE]">
            {/* Left: Barcode stripes & serial */}
            <div className="flex items-center gap-2.5 opacity-80">
              <div className="flex items-center gap-[2px]">
                <span className="w-[1.5px] h-5 bg-[#102744]" />
                <span className="w-[3px] h-5 bg-[#102744]" />
                <span className="w-[1px] h-5 bg-[#102744]" />
                <span className="w-[2.5px] h-5 bg-[#102744]" />
                <span className="w-[3.5px] h-5 bg-[#102744]" />
                <span className="w-[1.5px] h-5 bg-[#102744]" />
                <span className="w-[2px] h-5 bg-[#102744]" />
              </div>
              <span className="font-mono text-[8px] sm:text-[9px] text-[#102744] font-bold tracking-wider">
                NO. 8924-VN-2026
              </span>
            </div>

            {/* Right: Gold seal */}
            <div className="text-right opacity-80">
              <span className="font-serif text-[9px] sm:text-[10px] font-bold text-[#102744] uppercase tracking-wider">
                HÀNH TRÌNH VIỆT NAM
              </span>
            </div>
          </div>

          {/* Side ticket semi-circular notches */}
          <div className="absolute -left-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-[#F7F4EC] border-r border-[#CBD5E1]" />
          <div className="absolute -right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-[#F7F4EC] border-l border-[#CBD5E1]" />
        </motion.div>
      </div>

      {/* ============================================================
          2. TICKET FOLD FLAP (VẠT VÉ GẤP PHÍA SAU MỞ LÊN)
          Hinges backward in 3D during intro
          ============================================================ */}
      <div
        className="absolute inset-x-8 sm:inset-x-14 bottom-[115px] sm:bottom-[130px] h-[90px] sm:h-[110px] z-[3] flex items-center justify-center pointer-events-none"
        style={{ perspective: 800 }}
      >
        <motion.div
          initial={shouldReduceMotion ? { rotateX: -96, opacity: 0.15 } : { rotateX: 0, opacity: 0.9 }}
          animate={introReady ? { rotateX: -96, opacity: 0.15 } : { rotateX: 0, opacity: 0.9 }}
          transition={
            shouldReduceMotion
              ? { duration: 0.04 }
              : { duration: 0.85, delay: 0.15, ease: [0.22, 1, 0.36, 1] }
          }
          style={{ transformOrigin: 'top center', backfaceVisibility: 'hidden' }}
          className="w-full h-full rounded-t-[20px] bg-gradient-to-b from-[#F5F2EB] to-[#ECE7DA] border border-[#DDD8CA] shadow-sm flex items-center justify-center"
        >
          <span className="font-serif italic text-xs text-[#647084] tracking-widest">
            Mở ra hành trình...
          </span>
        </motion.div>
      </div>

      {/* ============================================================
          3. POP-UP LANDSCAPE DIORAMA (CẢNH MỌC LÊN TỪ MẶT VÉ)
          Masked with soft organic vignette so it blends seamlessly into
          the cream background without any rectangular box edge!
          ============================================================ */}
      <motion.div
        initial={shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 28 }}
        animate={introReady ? { opacity: 1, y: 0 } : { opacity: 0, y: 28 }}
        transition={
          shouldReduceMotion
            ? { duration: 0.04 }
            : { duration: 0.85, delay: 0.35, ease: [0.16, 1, 0.3, 1] }
        }
        className="absolute inset-x-0 top-0 bottom-[60px] sm:bottom-[75px] z-[5] overflow-visible pointer-events-none flex items-center justify-center"
      >
        <div
          className="relative w-full h-full"
          style={{
            maskImage:
              'radial-gradient(ellipse 85% 75% at 50% 60%, black 52%, transparent 96%)',
            WebkitMaskImage:
              'radial-gradient(ellipse 85% 75% at 50% 60%, black 52%, transparent 96%)',
          }}
        >
          {/* Destination Artwork with smooth crossfade */}
          <AnimatePresence mode="popLayout">
            <motion.div
              key={artworkSrc}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: shouldReduceMotion ? 0.04 : 0.45 }}
              className="absolute inset-0 w-full h-full"
            >
              <img
                src={artworkSrc}
                alt={`${originLabel} - ${destLabel}`}
                className="w-full h-full object-cover object-[center_40%] filter brightness-104 contrast-102"
                loading="eager"
              />
            </motion.div>
          </AnimatePresence>

          {/* Atmospheric sun glow & soft warm morning haze */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#F7F4EC]/65 via-transparent to-amber-100/25 pointer-events-none" />
          <div className="absolute top-2 right-12 w-24 h-24 rounded-full bg-gradient-to-tr from-[#F3B54A]/30 to-amber-200/40 blur-2xl pointer-events-none" />
        </div>
      </motion.div>

      {/* ============================================================
          4. GLOWING ROUTE LINE & LANDMARK TAGS
          Arcs across the diorama connecting Đà Nẵng and Huế
          ============================================================ */}
      <div className="absolute inset-0 pointer-events-none z-[8]">
        <svg
          viewBox="0 0 600 320"
          fill="none"
          className="w-full h-full overflow-visible"
        >
          <defs>
            <linearGradient id="heroRouteGlow" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#0097A7" stopOpacity="0.95" />
              <stop offset="50%" stopColor="#00E5FF" stopOpacity="1" />
              <stop offset="100%" stopColor="#F3B54A" stopOpacity="0.95" />
            </linearGradient>
          </defs>

          {/* Route path halo */}
          <motion.path
            d="M 120,185 C 220,115 370,125 470,165"
            stroke="#00E5FF"
            strokeWidth="5"
            strokeLinecap="round"
            className="opacity-35 filter blur-xs"
            initial={shouldReduceMotion ? { pathLength: 1 } : { pathLength: 0 }}
            animate={introReady ? { pathLength: 1 } : { pathLength: 0 }}
            transition={
              shouldReduceMotion
                ? { duration: 0.04 }
                : { duration: 1.05, delay: 0.9, ease: 'easeOut' }
            }
          />

          {/* Foreground glowing dashed line */}
          <motion.path
            d="M 120,185 C 220,115 370,125 470,165"
            stroke="url(#heroRouteGlow)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray="6 4"
            initial={shouldReduceMotion ? { pathLength: 1 } : { pathLength: 0 }}
            animate={introReady ? { pathLength: 1 } : { pathLength: 0 }}
            transition={
              shouldReduceMotion
                ? { duration: 0.04 }
                : { duration: 1.05, delay: 0.9, ease: 'easeOut' }
            }
          />
        </svg>

        {/* Origin Landmark Pill (Left) */}
        <motion.div
          initial={shouldReduceMotion ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
          animate={introReady ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
          transition={{ duration: shouldReduceMotion ? 0.04 : 0.4, delay: 1.05 }}
          className="absolute left-2 sm:left-6 top-[44%] -translate-y-1/2 bg-[#102744]/90 backdrop-blur-md text-white px-2.5 sm:px-3 py-1 rounded-full border border-teal-400/40 shadow-md flex items-center gap-1.5"
        >
          <span className="w-2 h-2 rounded-full bg-[#00E5FF] animate-pulse" />
          <span className="text-[11px] sm:text-xs font-bold leading-none">{originLabel}</span>
        </motion.div>

        {/* Destination Landmark Pill (Right) */}
        <motion.div
          initial={shouldReduceMotion ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
          animate={introReady ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
          transition={{ duration: shouldReduceMotion ? 0.04 : 0.4, delay: 1.25 }}
          className="absolute right-2 sm:right-6 top-[38%] -translate-y-1/2 bg-[#102744]/90 backdrop-blur-md text-white px-2.5 sm:px-3 py-1 rounded-full border border-amber-400/40 shadow-md flex items-center gap-1.5"
        >
          <MapPin className="w-3 h-3 text-[#F3B54A]" />
          <span className="text-[11px] sm:text-xs font-bold leading-none">{destLabel}</span>
        </motion.div>
      </div>

      {/* ============================================================
          5. S-CURVED HIGHWAY ROAD STAGE
          Curves forward gracefully from the diorama onto the ticket
          ============================================================ */}
      <div className="absolute bottom-2 sm:bottom-3 left-0 w-full z-[6] pointer-events-none">
        <RoadStage />
      </div>

      {/* ============================================================
          6. COACH VEHICLE (XE BUS TIẾN VÀO TRÊN MẶT ĐƯỜNG)
          Grounded on the road surface with authentic contact shadows
          ============================================================ */}
      <div className="absolute inset-x-0 bottom-6 sm:bottom-8 z-[8] flex justify-center pointer-events-none">
        <div className="w-[84%] sm:w-[78%] max-w-[480px]">
          <AnimatePresence mode="popLayout">
            <motion.div
              key={vehicleCategory}
              initial={
                shouldReduceMotion
                  ? { opacity: 1, x: 0 }
                  : !hasPlayedIntro
                  ? { x: 75, scale: 0.94, opacity: 0 }
                  : { x: 16, opacity: 0 }
              }
              animate={{ x: 0, scale: 1, opacity: 1 }}
              exit={
                shouldReduceMotion
                  ? { opacity: 0 }
                  : hasPlayedIntro
                  ? { x: -16, opacity: 0 }
                  : undefined
              }
              transition={
                shouldReduceMotion
                  ? { duration: 0.04 }
                  : !hasPlayedIntro
                  ? { duration: 0.95, delay: 0.65, ease: [0.16, 1, 0.3, 1] }
                  : { duration: 0.3, ease: 'easeOut' }
              }
              className="w-full"
            >
              <VehicleVisual category={vehicleCategory} />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
