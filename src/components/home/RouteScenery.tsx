import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import type { Transition } from 'framer-motion';
import { sceneService, NEUTRAL_SCENE } from '../../data/sceneData';
import type { DestinationScene } from '../../data/sceneData';

interface RouteSceneryProps {
  fromCity: string;
  toCity: string;
}

export const RouteScenery: React.FC<RouteSceneryProps> = ({
  fromCity,
  toCity,
}) => {
  const shouldReduceMotion = useReducedMotion();

  // Responsive state for mobile vs desktop crop/focal point
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Current active scenes state
  const [originScene, setOriginScene] = useState<DestinationScene>(() =>
    sceneService.getScene(fromCity)
  );
  const [destScene, setDestScene] = useState<DestinationScene>(() =>
    sceneService.getScene(toCity)
  );

  // Sequence tracking to prevent race conditions when user switches cities rapidly
  const updateSeq = useRef(0);

  useEffect(() => {
    const currentSeq = ++updateSeq.current;

    const targetOrigin = sceneService.getScene(fromCity);
    const targetDest = sceneService.getScene(toCity);

    // Preload required assets and decode before triggering crossfade
    const promises: Promise<void>[] = [
      sceneService.preloadAsset(targetOrigin.sceneAsset),
      sceneService.preloadAsset(targetDest.sceneAsset),
    ];

    Promise.all(promises).then(() => {
      // Only apply if this is still the latest user selection (avoid stale overwrite)
      if (currentSeq === updateSeq.current) {
        setOriginScene(targetOrigin);
        setDestScene(targetDest);
      }
    });
  }, [fromCity, toCity]);

  // Animation variants respecting prefers-reduced-motion
  const transitionConfig: Transition = shouldReduceMotion
    ? { duration: 0.05 }
    : { duration: 0.5, ease: 'easeInOut' };

  const originMotionProps = shouldReduceMotion
    ? {
        initial: { opacity: 0 },
        animate: { opacity: 0.9 },
        exit: { opacity: 0 },
        transition: transitionConfig,
      }
    : {
        initial: { opacity: 0, x: -16 },
        animate: { opacity: 0.9, x: 0 },
        exit: { opacity: 0, x: 14 },
        transition: transitionConfig,
      };

  const destMotionProps = shouldReduceMotion
    ? {
        initial: { opacity: 0 },
        animate: { opacity: 0.92 },
        exit: { opacity: 0 },
        transition: transitionConfig,
      }
    : {
        initial: { opacity: 0, x: 16 },
        animate: { opacity: 0.92, x: 0 },
        exit: { opacity: 0, x: -14 },
        transition: transitionConfig,
      };

  return (
    <div
      className="absolute inset-0 w-full h-full z-0 pointer-events-none overflow-hidden select-none"
      aria-hidden="true"
    >
      {/* 
        LAYER A: Nền trời toàn chiều ngang (Atmospheric Sky across full width)
      */}
      <div className="absolute inset-0 w-full h-full bg-gradient-to-b from-[#E6EFF2] via-[#F3EFE6] to-[#F7F4EC]" />

      {/* 
        LAYER B: Cảnh nơi đi và nơi đến (Full-width Panorama Composite)
        Origin scene spans left 0% to 58%, Destination scene spans right 42% to 100%.
        They seamlessly merge in the center with smooth alpha masks.
      */}
      <div className="absolute inset-0 w-full h-full flex">
        {/* Origin Scene (Left Side 58%) */}
        <div
          className="relative w-[58%] h-full overflow-hidden"
          style={{
            WebkitMaskImage: 'linear-gradient(to right, black 0%, black 62%, transparent 100%)',
            maskImage: 'linear-gradient(to right, black 0%, black 62%, transparent 100%)',
          }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={originScene.id}
              {...originMotionProps}
              className="absolute inset-0 w-full h-full"
            >
              <img
                src={originScene.sceneAsset}
                alt=""
                style={{
                  objectPosition: isMobile
                    ? originScene.mobileObjectPosition
                    : originScene.objectPosition,
                }}
                className="w-full h-full object-cover filter saturate-[0.88] contrast-[0.98]"
                loading="eager"
                onError={(e) => {
                  e.currentTarget.src = NEUTRAL_SCENE.sceneAsset;
                }}
              />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Destination Scene (Right Side 58%, overlapping center) */}
        <div
          className="relative w-[58%] -ml-[16%] h-full overflow-hidden"
          style={{
            WebkitMaskImage: 'linear-gradient(to left, black 0%, black 62%, transparent 100%)',
            maskImage: 'linear-gradient(to left, black 0%, black 62%, transparent 100%)',
          }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={destScene.id}
              {...destMotionProps}
              className="absolute inset-0 w-full h-full"
            >
              <img
                src={destScene.sceneAsset}
                alt=""
                style={{
                  objectPosition: isMobile
                    ? destScene.mobileObjectPosition
                    : destScene.objectPosition,
                }}
                className="w-full h-full object-cover filter saturate-[0.92] contrast-[1.0]"
                loading="eager"
                onError={(e) => {
                  e.currentTarget.src = NEUTRAL_SCENE.sceneAsset;
                }}
              />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* 
        LAYER C: Lớp phủ hỗ trợ đọc chữ (Gentle Localized Scrim on Left)
        Soft cream wash over the left text area, smoothly fading to transparent.
        The left landmark is visibly preserved while navy text is effortlessly readable.
      */}
      <div className="absolute inset-y-0 left-0 w-full sm:w-[65%] lg:w-[54%] bg-gradient-to-r from-[#F7F4EC]/88 via-[#F7F4EC]/65 via-35% to-transparent to-75% z-[3] pointer-events-none" />
      
      {/* Subtle bottom transition into the next section */}
      <div className="absolute bottom-0 inset-x-0 h-16 bg-gradient-to-t from-[#F7F4EC]/85 to-transparent z-[3] pointer-events-none" />

      {/* 
        LAYER D: Dynamic SVG Route Line & Route Pins (Top Right of Hero)
        Clean, coordinated SVG without any bulky badge overlapping destination labels!
      */}
      <div className="absolute top-4 sm:top-5 right-4 sm:right-8 lg:right-12 w-[85%] max-w-[320px] sm:max-w-[380px] lg:max-w-[420px] h-14 z-[4] pointer-events-none">
        <svg className="w-full h-full overflow-visible" viewBox="0 0 420 54" fill="none">
          <defs>
            <linearGradient id="routeLineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#0097A7" />
              <stop offset="100%" stopColor="#F3B54A" />
            </linearGradient>
          </defs>

          {/* Animated Route Line Stroke */}
          <motion.path
            key={`${fromCity}-${toCity}`}
            d="M 50 36 C 130 14, 260 48, 350 28"
            stroke="url(#routeLineGrad)"
            strokeWidth="2.5"
            strokeDasharray="5 5"
            fill="none"
            initial={shouldReduceMotion ? { pathLength: 1, opacity: 1 } : { pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={shouldReduceMotion ? { duration: 0.05 } : { duration: 0.6, ease: 'easeInOut' }}
          />

          {/* Origin Pin (Teal) */}
          <g transform="translate(50, 36)">
            {!shouldReduceMotion && (
              <circle cx="0" cy="0" r="8" fill="#0097A7" fillOpacity="0.25" className="animate-ping" />
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
              {originScene.label}
            </text>
          </g>

          {/* Destination Pin (Amber) */}
          <g transform="translate(350, 28)">
            {!shouldReduceMotion && (
              <circle cx="0" cy="0" r="8" fill="#F3B54A" fillOpacity="0.25" className="animate-ping" />
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
              {destScene.label}
            </text>
          </g>
        </svg>
      </div>
    </div>
  );
};
