import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import type { Transition } from 'framer-motion';
import { sceneService, NEUTRAL_SCENE } from '../../data/sceneData';
import type { DestinationScene, RoutePairOverride } from '../../data/sceneData';

interface RouteSceneryProps {
  fromCity: string;
  toCity: string;
}

interface CommittedSceneState {
  id: string;
  fromCity: string;
  toCity: string;
  originScene: DestinationScene;
  destScene: DestinationScene;
  pairOverride: RoutePairOverride | null;
}

export const RouteScenery: React.FC<RouteSceneryProps> = ({
  fromCity,
  toCity,
}) => {
  const shouldReduceMotion = useReducedMotion();

  // Responsive state for mobile vs desktop composition
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const handleResize = () => {
      if (isMounted) {
        setIsMobile(window.innerWidth < 768);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => {
      isMounted = false;
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Committed scene state: commits both background assets and route labels simultaneously
  const [committedState, setCommittedState] = useState<CommittedSceneState>(() => {
    const origin = sceneService.getScene(fromCity);
    const dest = sceneService.getScene(toCity);
    const pair = sceneService.getPairOverride(fromCity, toCity);
    return {
      id: pair ? `pair-${pair.fromId}-${pair.toId}` : `composite-${origin.id}-${dest.id}`,
      fromCity,
      toCity,
      originScene: origin,
      destScene: dest,
      pairOverride: pair,
    };
  });

  // Sequence ref for race condition handling on rapid route clicks
  const seqRef = useRef(0);

  useEffect(() => {
    const reqSeq = ++seqRef.current;

    const targetOrigin = sceneService.getScene(fromCity);
    const targetDest = sceneService.getScene(toCity);
    const targetPair = sceneService.getPairOverride(fromCity, toCity);

    // Preload only the assets required for the target route
    const preloadPromises: Promise<unknown>[] = [];
    if (targetPair?.pairAsset) {
      preloadPromises.push(sceneService.preloadAsset(targetPair.pairAsset));
    } else {
      if (targetOrigin.sceneAsset) {
        preloadPromises.push(sceneService.preloadAsset(targetOrigin.sceneAsset));
      }
      if (targetDest.sceneAsset) {
        preloadPromises.push(sceneService.preloadAsset(targetDest.sceneAsset));
      }
    }

    Promise.all(preloadPromises).then(() => {
      // Commit only if this request is still the latest one (prevent stale overwrites)
      if (reqSeq === seqRef.current) {
        const nextId = targetPair
          ? `pair-${targetPair.fromId}-${targetPair.toId}`
          : `composite-${targetOrigin.id}-${targetDest.id}`;

        setCommittedState({
          id: nextId,
          fromCity,
          toCity,
          originScene: targetOrigin,
          destScene: targetDest,
          pairOverride: targetPair,
        });
      }
    });
  }, [fromCity, toCity]);

  // Smooth crossfade transitions: 500ms duration, concurrent crossfade (no mode="wait" gap)
  const transitionConfig: Transition = shouldReduceMotion
    ? { duration: 0.05 }
    : { duration: 0.5, ease: 'easeInOut' };

  // Resilient image error handler: tries fallback once, then gracefully hides to show CSS sky gradient
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.currentTarget;
    if (target.dataset.fallbackTried === 'true') {
      target.style.display = 'none';
      return;
    }
    target.dataset.fallbackTried = 'true';
    target.src = NEUTRAL_SCENE.sceneAsset;
  };

  return (
    <div
      className="absolute inset-0 w-full h-full z-0 pointer-events-none overflow-hidden select-none"
      aria-hidden="true"
    >
      {/* 
        LAYER A: Nền trời toàn cảnh (Atmospheric Sky across full width)
        Warm cream & soft cyan watercolor gradient covering 100% of hero
      */}
      <div className="absolute inset-0 w-full h-full bg-gradient-to-b from-[#E6EFF2] via-[#F3EFE6] to-[#F7F4EC]" />

      {/* 
        LAYER B: Cảnh quan toàn chiều ngang (Full-Width Panorama Scenery)
        Concurrent crossfade: Old and new scenes exist simultaneously during transition.
        Zero white flashes, zero blank gaps, zero accumulated DOM nodes.
      */}
      <div
        className={`absolute inset-x-0 ${
          isMobile ? 'top-0 h-[480px]' : 'inset-y-0 h-full'
        } w-full overflow-hidden`}
        style={
          isMobile
            ? {
                WebkitMaskImage:
                  'linear-gradient(to bottom, black 0%, black 72%, rgba(0,0,0,0.6) 85%, transparent 100%)',
                maskImage:
                  'linear-gradient(to bottom, black 0%, black 72%, rgba(0,0,0,0.6) 85%, transparent 100%)',
              }
            : undefined
        }
      >
        <AnimatePresence>
          {committedState.pairOverride ? (
            /* ============================================================
               CASE 1: STRICT DIRECTIONAL PANORAMA (e.g. Đà Nẵng -> Huế)
               Zero seams, matching horizon, continuous watercolor landscape
               ============================================================ */
            <motion.div
              key={committedState.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.95 }}
              exit={{ opacity: 0 }}
              transition={transitionConfig}
              className="absolute inset-0 w-full h-full"
            >
              <img
                src={committedState.pairOverride.pairAsset}
                alt=""
                style={{
                  objectPosition: isMobile ? 'center 38%' : 'center 40%',
                }}
                className="w-full h-full object-cover filter saturate-[0.92] contrast-[1.0]"
                loading="eager"
                onError={handleImageError}
              />
            </motion.div>
          ) : (
            /* ============================================================
               CASE 2: DUAL-SCENE COMPOSITE (General Route Pairs)
               Both scenes span full height and wide area with aligned horizons
               and smooth cubic overlap feathering in the center (35% -> 65%).
               ============================================================ */
            <motion.div
              key={committedState.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={transitionConfig}
              className="absolute inset-0 w-full h-full"
            >
              {/* Origin Scene Layer (Left-biased, feathered toward center) */}
              <div
                className="absolute inset-0 w-full h-full overflow-hidden"
                style={{
                  WebkitMaskImage: isMobile
                    ? 'linear-gradient(to right, black 0%, black 40%, rgba(0,0,0,0.7) 55%, transparent 75%)'
                    : 'linear-gradient(to right, black 0%, black 35%, rgba(0,0,0,0.85) 45%, rgba(0,0,0,0.25) 58%, transparent 72%)',
                  maskImage: isMobile
                    ? 'linear-gradient(to right, black 0%, black 40%, rgba(0,0,0,0.7) 55%, transparent 75%)'
                    : 'linear-gradient(to right, black 0%, black 35%, rgba(0,0,0,0.85) 45%, rgba(0,0,0,0.25) 58%, transparent 72%)',
                }}
              >
                <img
                  src={committedState.originScene.sceneAsset}
                  alt=""
                  style={{
                    objectPosition: isMobile
                      ? committedState.originScene.asOrigin.objectPositionMobile
                      : committedState.originScene.asOrigin.objectPositionDesktop,
                    transform: `scale(${
                      isMobile
                        ? committedState.originScene.asOrigin.scaleMobile
                        : committedState.originScene.asOrigin.scaleDesktop
                    })`,
                  }}
                  className="w-full h-full object-cover filter saturate-[0.88] contrast-[0.98]"
                  loading="eager"
                  onError={handleImageError}
                />
              </div>

              {/* Destination Scene Layer (Right-biased, feathered toward center) */}
              <div
                className="absolute inset-0 w-full h-full overflow-hidden"
                style={{
                  WebkitMaskImage: isMobile
                    ? 'linear-gradient(to left, black 0%, black 40%, rgba(0,0,0,0.7) 55%, transparent 75%)'
                    : 'linear-gradient(to left, black 0%, black 35%, rgba(0,0,0,0.85) 45%, rgba(0,0,0,0.25) 58%, transparent 72%)',
                  maskImage: isMobile
                    ? 'linear-gradient(to left, black 0%, black 40%, rgba(0,0,0,0.7) 55%, transparent 75%)'
                    : 'linear-gradient(to left, black 0%, black 35%, rgba(0,0,0,0.85) 45%, rgba(0,0,0,0.25) 58%, transparent 72%)',
                }}
              >
                <img
                  src={committedState.destScene.sceneAsset}
                  alt=""
                  style={{
                    objectPosition: isMobile
                      ? committedState.destScene.asDestination.objectPositionMobile
                      : committedState.destScene.asDestination.objectPositionDesktop,
                    transform: `scale(${
                      isMobile
                        ? committedState.destScene.asDestination.scaleMobile
                        : committedState.destScene.asDestination.scaleDesktop
                    })`,
                  }}
                  className="w-full h-full object-cover filter saturate-[0.92] contrast-[1.0]"
                  loading="eager"
                  onError={handleImageError}
                />
              </div>

              {/* Atmospheric Center Bridge (Softens the center transition between scenery) */}
              <div
                className="absolute inset-y-0 left-[34%] right-[34%] pointer-events-none"
                style={{
                  background:
                    'linear-gradient(to right, transparent 0%, rgba(243, 239, 230, 0.42) 50%, transparent 100%)',
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 
        LAYER C: Lớp hỗ trợ đọc chữ (Gentle Organic Scrim)
        Soft radial & linear wash over left content zone.
        Guarantees WCAG AAA contrast for dark navy text without obscuring left landmarks.
      */}
      <div
        className="absolute inset-y-0 left-0 w-full sm:w-[68%] lg:w-[58%] z-[3] pointer-events-none"
        style={{
          background: isMobile
            ? 'radial-gradient(ellipse 100% 70% at 30% 30%, rgba(247, 244, 236, 0.88) 0%, rgba(247, 244, 236, 0.72) 45%, rgba(247, 244, 236, 0.3) 75%, transparent 100%)'
            : 'radial-gradient(ellipse 95% 85% at 20% 42%, rgba(247, 244, 236, 0.82) 0%, rgba(247, 244, 236, 0.65) 35%, rgba(247, 244, 236, 0.22) 58%, transparent 75%)',
        }}
      />
      
      {/* Subtle linear left fill to ensure headline readability */}
      <div className="absolute inset-y-0 left-0 w-[45%] bg-gradient-to-r from-[#F7F4EC]/75 via-[#F7F4EC]/45 to-transparent z-[3] pointer-events-none hidden sm:block" />

      {/* Bottom transition into next section */}
      <div className="absolute bottom-0 inset-x-0 h-16 bg-gradient-to-t from-[#F7F4EC] via-[#F7F4EC]/70 to-transparent z-[3] pointer-events-none" />

      {/* 
        LAYER D: Dynamic SVG Route Line & Route Pins
        Synchronized to committedState so labels and background switch simultaneously.
      */}
      <div
        className={`absolute ${
          isMobile
            ? 'top-2 right-2 w-[280px] h-12'
            : 'top-4 sm:top-5 right-4 sm:right-8 lg:right-12 w-[85%] max-w-[320px] sm:max-w-[380px] lg:max-w-[420px] h-14'
        } z-[4] pointer-events-none`}
      >
        <svg className="w-full h-full overflow-visible" viewBox="0 0 420 54" fill="none">
          <defs>
            <linearGradient id="routeLineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#0097A7" />
              <stop offset="100%" stopColor="#F3B54A" />
            </linearGradient>
          </defs>

          {/* Animated Route Line Stroke */}
          <motion.path
            key={committedState.id}
            d="M 50 36 C 130 14, 260 48, 350 28"
            stroke="url(#routeLineGrad)"
            strokeWidth="2.5"
            strokeDasharray="5 5"
            fill="none"
            initial={
              shouldReduceMotion
                ? { pathLength: 1, opacity: 1 }
                : { pathLength: 0, opacity: 0 }
            }
            animate={{ pathLength: 1, opacity: 1 }}
            transition={
              shouldReduceMotion
                ? { duration: 0.05 }
                : { duration: 0.55, ease: 'easeInOut' }
            }
          />

          {/* Origin Pin (Teal) */}
          <g transform="translate(50, 36)">
            {!shouldReduceMotion && (
              <circle
                cx="0"
                cy="0"
                r="8"
                fill="#0097A7"
                fillOpacity="0.25"
                className="animate-ping"
              />
            )}
            <circle cx="0" cy="0" r="5" fill="#0097A7" stroke="#FFFEFA" strokeWidth="2" />
            <text
              x="0"
              y="-10"
              textAnchor="middle"
              fill="#007887"
              stroke="#FFFEFA"
              strokeWidth="3.5"
              paintOrder="stroke"
              strokeLinejoin="round"
              fontSize="11"
              fontFamily="system-ui, sans-serif"
              fontWeight="700"
            >
              {committedState.originScene.label}
            </text>
          </g>

          {/* Destination Pin (Amber) */}
          <g transform="translate(350, 28)">
            {!shouldReduceMotion && (
              <circle
                cx="0"
                cy="0"
                r="8"
                fill="#F3B54A"
                fillOpacity="0.25"
                className="animate-ping"
              />
            )}
            <circle cx="0" cy="0" r="5" fill="#F3B54A" stroke="#FFFEFA" strokeWidth="2" />
            <text
              x="0"
              y="-10"
              textAnchor="middle"
              fill="#B45309"
              stroke="#FFFEFA"
              strokeWidth="3.5"
              paintOrder="stroke"
              strokeLinejoin="round"
              fontSize="11"
              fontFamily="system-ui, sans-serif"
              fontWeight="700"
            >
              {committedState.destScene.label}
            </text>
          </g>
        </svg>
      </div>
    </div>
  );
};
