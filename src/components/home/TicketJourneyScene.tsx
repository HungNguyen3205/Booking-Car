import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import type { VehicleCategory } from '../../types';
import {
  resolveSceneComposition,
  getCanonicalLocationId,
  getLocationDisplayName,
  type SceneComposition,
} from '../../data/sceneManifest';
import { preloadAndDecodeImage } from '../../data/sceneVehicleData';

interface TicketJourneySceneProps {
  fromCity: string;
  toCity: string;
  vehicleCategory: VehicleCategory;
  introReady?: boolean;
}

interface DisplayedSceneState {
  composition: SceneComposition;
  fromId: string;
  toId: string;
  fromLabel: string;
  toLabel: string;
  routeId: string;
  isCustomRoute: boolean;
  isSameCity: boolean;
}

export const TicketJourneyScene: React.FC<TicketJourneySceneProps> = ({
  fromCity,
  toCity,
  vehicleCategory,
  introReady = true,
}) => {
  const shouldReduceMotion = useReducedMotion();
  const [hasPlayedIntro, setHasPlayedIntro] = useState(() => !!shouldReduceMotion);

  // Active scene state currently displayed on screen
  const [displayedScene, setDisplayedScene] = useState<DisplayedSceneState>(() => {
    const fromId = getCanonicalLocationId(fromCity);
    const toId = getCanonicalLocationId(toCity);
    const comp = resolveSceneComposition(fromCity, toCity);
    return {
      composition: comp,
      fromId,
      toId,
      fromLabel: getLocationDisplayName(fromCity),
      toLabel: getLocationDisplayName(toCity),
      routeId: `${fromId}:${toId}`,
      isCustomRoute: comp.isNeutralFallback ?? false,
      isSameCity: fromId === toId,
    };
  });

  const sceneSeqRef = useRef(0);

  // Synchronize route changes:
  // - Form updates immediately (handled in parent)
  // - Preloads and decodes new scene asset
  // - Scene only switches when asset is decoded and ready
  // - Sequence ID ensures latest user choice wins without stale overwrites
  useEffect(() => {
    let isCancelled = false;
    const seq = ++sceneSeqRef.current;

    const fromId = getCanonicalLocationId(fromCity);
    const toId = getCanonicalLocationId(toCity);
    const targetComp = resolveSceneComposition(fromCity, toCity);
    const targetRouteId = `${fromId}:${toId}`;

    // If identical route and composition, no transition needed
    if (targetRouteId === displayedScene.routeId && targetComp.id === displayedScene.composition.id) {
      return;
    }

    const nextState: DisplayedSceneState = {
      composition: targetComp,
      fromId,
      toId,
      fromLabel: getLocationDisplayName(fromCity),
      toLabel: getLocationDisplayName(toCity),
      routeId: targetRouteId,
      isCustomRoute: targetComp.isNeutralFallback ?? false,
      isSameCity: fromId === toId,
    };

    // If the composition asset is already rendered (e.g. reverse route direction on same diorama)
    if (targetComp.id === displayedScene.composition.id) {
      Promise.resolve().then(() => {
        if (!isCancelled && seq === sceneSeqRef.current) {
          setDisplayedScene(nextState);
        }
      });
      return () => {
        isCancelled = true;
      };
    }

    // New composition asset requires preload & decode before switching
    preloadAndDecodeImage(targetComp.asset)
      .then(() => {
        if (!isCancelled && seq === sceneSeqRef.current) {
          setDisplayedScene(nextState);
        }
      })
      .catch(() => {
        // Fallback: commit next state without crashing
        if (!isCancelled && seq === sceneSeqRef.current) {
          setDisplayedScene(nextState);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [fromCity, toCity, displayedScene.routeId, displayedScene.composition.id]);

  // Desktop Mouse Parallax (subtle 4–5px displacement, active only on precision pointers)
  // Zero React state updates on mousemove to avoid re-renders
  const parallaxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (shouldReduceMotion) return;
    if (typeof window === 'undefined') return;
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

    const el = parallaxRef.current;
    if (!el) return;

    let rafId: number | null = null;
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      const nx = (e.clientX - (rect.left + rect.width / 2)) / (rect.width / 2);
      const ny = (e.clientY - (rect.top + rect.height / 2)) / (rect.height / 2);

      // Strictly clamp between -5px and 5px (4px vertically)
      targetX = Math.max(-5, Math.min(5, nx * 5));
      targetY = Math.max(-4, Math.min(4, ny * 4));

      if (rafId === null) {
        rafId = requestAnimationFrame(updateParallax);
      }
    };

    const handleMouseLeave = () => {
      targetX = 0;
      targetY = 0;
      if (rafId === null) {
        rafId = requestAnimationFrame(updateParallax);
      }
    };

    const updateParallax = () => {
      currentX += (targetX - currentX) * 0.08;
      currentY += (targetY - currentY) * 0.08;

      if (el) {
        el.style.transform = `translate3d(${currentX.toFixed(2)}px, ${currentY.toFixed(2)}px, 0)`;
      }

      if (Math.abs(targetX - currentX) > 0.04 || Math.abs(targetY - currentY) > 0.04) {
        rafId = requestAnimationFrame(updateParallax);
      } else {
        rafId = null;
      }
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
    };
  }, [shouldReduceMotion]);

  // One-time intro synchronization (total ~1.8–2.1s)
  useEffect(() => {
    if (shouldReduceMotion) return;
    if (introReady && !hasPlayedIntro) {
      const timer = window.setTimeout(() => {
        setHasPlayedIntro(true);
      }, 2100);
      return () => window.clearTimeout(timer);
    }
  }, [introReady, hasPlayedIntro, shouldReduceMotion]);

  // Bypass intro immediately on vehicle or scene switch
  const isFirstMountRef = useRef(true);
  useEffect(() => {
    if (isFirstMountRef.current) {
      isFirstMountRef.current = false;
      return;
    }
    setHasPlayedIntro(true);
  }, [vehicleCategory, displayedScene.routeId]);

  const activeAnchor = displayedScene.composition.vehicleAnchors[vehicleCategory];
  const routePath = displayedScene.composition.getRoutePath(displayedScene.fromId, displayedScene.toId);
  const isHeritage = displayedScene.composition.id === 'heritage-danang-hue';

  return (
    <div
      className="relative w-full aspect-[1376/570] select-none mx-auto isolate"
      data-testid="journey-stage"
      aria-hidden="true"
    >
      {/* WRAPPER FOR PARALLAX (4-5px max displacement on desktop, stationary copy/form) */}
      <div ref={parallaxRef} className="relative w-full h-full pointer-events-none will-change-transform">
        {/* 1. MASTER PANORAMA ARTWORK CANVAS:
            - Old scene fades out in 180-220ms
            - New scene fades in and floats up 8-10px in 400-550ms
            - PopLayout ensures overlap only during transition, exactly one scene in final DOM
        */}
        <div className="absolute inset-0 w-full h-full pointer-events-none z-[2] overflow-hidden">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div
              key={displayedScene.composition.id}
              initial={
                shouldReduceMotion
                  ? { opacity: 1, scale: 1, y: 0 }
                  : hasPlayedIntro
                    ? { opacity: 0, y: 10 }
                    : { opacity: 0, scale: 0.985, y: 6 }
              }
              animate={
                shouldReduceMotion
                  ? { opacity: 1, scale: 1, y: 0 }
                  : introReady
                    ? { opacity: 1, y: 0, scale: 1 }
                    : { opacity: 0, scale: 0.985, y: 6 }
              }
              exit={
                shouldReduceMotion
                  ? { opacity: 0, transition: { duration: 0 } }
                  : { opacity: 0, transition: { duration: 0.20, ease: 'easeOut' } }
              }
              transition={
                shouldReduceMotion
                  ? { duration: 0 }
                  : hasPlayedIntro
                    ? { duration: 0.48, ease: [0.16, 1, 0.3, 1] }
                    : { duration: 0.75, ease: [0.16, 1, 0.3, 1] }
              }
              className="w-full h-full"
            >
              <img
                src={displayedScene.composition.asset}
                alt={displayedScene.composition.title}
                className="w-full h-full object-cover sm:object-contain pointer-events-none select-none"
                loading="eager"
              />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* 2. SVG LAYER: SINGLE CLEAN TEAL ROUTE, NAVY-ON-LIGHT PINS & RIGHT TICKET STUB */}
        <div className="absolute inset-0 pointer-events-none z-[5]">
          <svg
            viewBox="0 0 1376 570"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full overflow-visible pointer-events-none"
          >
            <AnimatePresence mode="wait">
              <motion.g
                key={displayedScene.composition.id}
                initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0 }}
                animate={introReady ? { opacity: 1 } : { opacity: 0 }}
                exit={{ opacity: 0, transition: { duration: shouldReduceMotion ? 0 : 0.15 } }}
                transition={{
                  duration: shouldReduceMotion ? 0 : 0.35,
                  delay: shouldReduceMotion ? 0 : hasPlayedIntro ? 0 : 1.1,
                }}
              >
                {/* Dynamic Route Path: draws in direction of trip over 420ms */}
                {!displayedScene.isSameCity && routePath && (
                  <g key={`route-group-${displayedScene.routeId}`}>
                    <motion.path
                      key={`path-${displayedScene.routeId}`}
                      d={routePath}
                      stroke="#0097A7"
                      strokeWidth="2.4"
                      strokeLinecap="round"
                      strokeDasharray="6 4"
                      initial={shouldReduceMotion ? { pathLength: 1 } : { pathLength: 0 }}
                      animate={introReady ? { pathLength: 1 } : { pathLength: 0 }}
                      transition={
                        shouldReduceMotion
                          ? { duration: 0 }
                          : hasPlayedIntro
                            ? { duration: 0.42, ease: 'easeOut' }
                            : { duration: 0.5, delay: 1.1, ease: 'easeOut' }
                      }
                    />

                    {/* Directional travel marker flowing from departure to arrival along the path */}
                    <motion.circle
                      key={`marker-${displayedScene.routeId}`}
                      r="3.5"
                      fill="#0097A7"
                      stroke="#FFFDF8"
                      strokeWidth="1.2"
                      filter="drop-shadow(0 0 3px rgba(0, 151, 167, 0.6))"
                      initial={{ offsetDistance: '0%', opacity: 0 }}
                      animate={
                        introReady
                          ? {
                              offsetDistance: ['0%', '100%'],
                              opacity: [0, 1, 1, 0],
                            }
                          : { opacity: 0 }
                      }
                      transition={{
                        duration: shouldReduceMotion ? 0 : 2.2,
                        repeat: Infinity,
                        ease: 'easeInOut',
                        delay: shouldReduceMotion ? 0 : hasPlayedIntro ? 0.3 : 1.65,
                        repeatDelay: 0.6,
                      }}
                      style={{
                        offsetPath: `path('${routePath}')`,
                      }}
                    />
                  </g>
                )}

              {/* Landmark Pins with strict adherence to architectural truth:
                  - Cầu Rồng (Đà Nẵng) & Ngọ Môn (Huế) on heritage diorama
                  - Neutral highway anchors for inter-provincial routes (never mislabeling Ngọ Môn)
              */}
              {isHeritage ? (
                <>
                  {/* Point: Đà Nẵng (Cầu Rồng) */}
                  <g id="pin-da-nang">
                    <circle cx="770" cy="195" r="4.5" fill="#FFFDF8" stroke="#0097A7" strokeWidth="1.8" />
                    <circle cx="770" cy="195" r="2.2" fill="#0097A7" />
                    <g transform="translate(770, 172)">
                      <rect
                        x="-32"
                        y="-10"
                        width="64"
                        height="20"
                        rx="10"
                        fill="#FFFDF8"
                        stroke="#D8D4C8"
                        strokeWidth="0.9"
                        filter="drop-shadow(0 1px 2px rgba(16, 39, 68, 0.08))"
                      />
                      <text
                        x="0"
                        y="3.5"
                        textAnchor="middle"
                        fontFamily="'Be Vietnam Pro', sans-serif"
                        fontSize="11"
                        fontWeight="700"
                        fill="#102744"
                        letterSpacing="0.4"
                      >
                        Đà Nẵng
                      </text>
                    </g>
                  </g>

                  {/* Point: Huế (Ngọ Môn) */}
                  <g id="pin-hue">
                    <circle cx="1115" cy="180" r="4.5" fill="#FFFDF8" stroke="#0097A7" strokeWidth="1.8" />
                    <circle cx="1115" cy="180" r="2.2" fill="#0097A7" />
                    <g transform="translate(1115, 157)">
                      <rect
                        x="-24"
                        y="-10"
                        width="48"
                        height="20"
                        rx="10"
                        fill="#FFFDF8"
                        stroke="#D8D4C8"
                        strokeWidth="0.9"
                        filter="drop-shadow(0 1px 2px rgba(16, 39, 68, 0.08))"
                      />
                      <text
                        x="0"
                        y="3.5"
                        textAnchor="middle"
                        fontFamily="'Be Vietnam Pro', sans-serif"
                        fontSize="11"
                        fontWeight="700"
                        fill="#102744"
                        letterSpacing="0.4"
                      >
                        Huế
                      </text>
                    </g>
                  </g>
                </>
              ) : displayedScene.isSameCity ? (
                /* Single point for same-city selection */
                <g id="pin-single-city">
                  <circle cx="800" cy="235" r="4.5" fill="#FFFDF8" stroke="#0097A7" strokeWidth="1.8" />
                  <circle cx="800" cy="235" r="2.2" fill="#0097A7" />
                  <g transform="translate(800, 212)">
                    <rect
                      x="-45"
                      y="-10"
                      width="90"
                      height="20"
                      rx="10"
                      fill="#FFFDF8"
                      stroke="#D8D4C8"
                      strokeWidth="0.9"
                      filter="drop-shadow(0 1px 2px rgba(16, 39, 68, 0.08))"
                    />
                    <text
                      x="0"
                      y="3.5"
                      textAnchor="middle"
                      fontFamily="'Be Vietnam Pro', sans-serif"
                      fontSize="11"
                      fontWeight="700"
                      fill="#102744"
                    >
                      {displayedScene.fromLabel}
                    </text>
                  </g>
                </g>
              ) : (
                /* Dynamic neutral highway anchors */
                <>
                  <g id="pin-origin">
                    <circle cx="620" cy="250" r="4.5" fill="#FFFDF8" stroke="#0097A7" strokeWidth="1.8" />
                    <circle cx="620" cy="250" r="2.2" fill="#0097A7" />
                    <g transform="translate(620, 227)">
                      <rect
                        x="-40"
                        y="-10"
                        width="80"
                        height="20"
                        rx="10"
                        fill="#FFFDF8"
                        stroke="#D8D4C8"
                        strokeWidth="0.9"
                        filter="drop-shadow(0 1px 2px rgba(16, 39, 68, 0.08))"
                      />
                      <text
                        x="0"
                        y="3.5"
                        textAnchor="middle"
                        fontFamily="'Be Vietnam Pro', sans-serif"
                        fontSize="11"
                        fontWeight="700"
                        fill="#102744"
                      >
                        {displayedScene.fromLabel}
                      </text>
                    </g>
                  </g>

                  <g id="pin-dest">
                    <circle cx="980" cy="210" r="4.5" fill="#FFFDF8" stroke="#0097A7" strokeWidth="1.8" />
                    <circle cx="980" cy="210" r="2.2" fill="#0097A7" />
                    <g transform="translate(980, 187)">
                      <rect
                        x="-40"
                        y="-10"
                        width="80"
                        height="20"
                        rx="10"
                        fill="#FFFDF8"
                        stroke="#D8D4C8"
                        strokeWidth="0.9"
                        filter="drop-shadow(0 1px 2px rgba(16, 39, 68, 0.08))"
                      />
                      <text
                        x="0"
                        y="3.5"
                        textAnchor="middle"
                        fontFamily="'Be Vietnam Pro', sans-serif"
                        fontSize="11"
                        fontWeight="700"
                        fill="#102744"
                      >
                        {displayedScene.toLabel}
                      </text>
                    </g>
                  </g>
                </>
              )}
            </motion.g>
          </AnimatePresence>

          {/* Dynamic Route Text on Right Upright Ticket Stub */}
          <g transform="rotate(1.8, 1282, 280)">
            <text
              x="1282"
              y="245"
              textAnchor="middle"
              fontFamily="'Noto Serif', serif"
              fontSize="13"
              fontWeight="700"
              fill="#102744"
              letterSpacing="1.2"
              opacity="0.95"
            >
              HÀNH TRÌNH
            </text>

            <line
              x1="1245"
              y1="261"
              x2="1319"
              y2="261"
              stroke="#102744"
              strokeWidth="0.8"
              strokeDasharray="3 2"
              opacity="0.25"
            />

            <text
              x="1282"
              y="281"
              textAnchor="middle"
              fontFamily="'Be Vietnam Pro', sans-serif"
              fontSize="11"
              fontWeight="700"
              fill="#102744"
              letterSpacing="0.6"
            >
              {displayedScene.fromLabel.toUpperCase()}
            </text>

            <text
              x="1282"
              y="298"
              textAnchor="middle"
              fontFamily="'Be Vietnam Pro', sans-serif"
              fontSize="13"
              fontWeight="bold"
              fill="#0097A7"
            >
              ↓
            </text>

            <text
              x="1282"
              y="318"
              textAnchor="middle"
              fontFamily="'Be Vietnam Pro', sans-serif"
              fontSize="11"
              fontWeight="700"
              fill="#102744"
              letterSpacing="0.6"
            >
              {displayedScene.toLabel.toUpperCase()}
            </text>
          </g>
        </svg>
      </div>

      {/* 3. PROPORTIONATE VEHICLE GROUNDED ON FOREGROUND ROAD
          - Wheels touch the asphalt road surface
          - Shadows inside motion container animate in exact sync
          - Positioned according to the composition's calibrated vehicle anchors
          - When scene/camera changes: vehicle fades out and in without jumping across the sky
          - When vehicle model changes: moves along road trajectory as calibrated
      */}
      <div className="absolute inset-0 pointer-events-none z-[8]">
        <AnimatePresence mode="wait" initial={false}>
          {(() => {
            return (
              <motion.div
                key={`${displayedScene.composition.id}-${vehicleCategory}`}
                className="absolute pointer-events-none"
                style={{
                  left: activeAnchor.left,
                  top: activeAnchor.top,
                  width: activeAnchor.width,
                }}
                initial={
                  shouldReduceMotion
                    ? { opacity: 1, scale: 1, x: 0, y: 0 }
                    : hasPlayedIntro
                      ? { opacity: 0, scale: 0.98 }
                      : {
                          opacity: 0,
                          x: activeAnchor.motionDeltaX * 1.4,
                          y: activeAnchor.motionDeltaY * 1.4,
                          scale: 0.96,
                        }
                }
                animate={
                  shouldReduceMotion
                    ? { opacity: 1, scale: 1, x: 0, y: 0 }
                    : introReady
                      ? { opacity: 1, scale: 1, x: 0, y: 0 }
                      : {
                          opacity: 0,
                          x: activeAnchor.motionDeltaX * 1.4,
                          y: activeAnchor.motionDeltaY * 1.4,
                          scale: 0.96,
                        }
                }
                exit={
                  shouldReduceMotion
                    ? { opacity: 0, transition: { duration: 0 } }
                    : {
                        opacity: 0,
                        x: -18,
                        y: 4.5,
                        transition: { duration: 0.16, ease: [0.4, 0, 0.7, 1] },
                      }
                }
                transition={
                  shouldReduceMotion
                    ? { duration: 0 }
                    : !hasPlayedIntro
                      ? { duration: 0.95, delay: 0.35, ease: [0.16, 1, 0.3, 1] }
                      : { duration: 0.32, ease: [0.16, 1, 0.3, 1] }
                }
              >
                <div className="relative w-full">
                  {/* Soft Ambient Chassis Shadow */}
                  <div
                    className="absolute pointer-events-none rounded-full"
                    style={{
                      left: activeAnchor.shadowLeft,
                      top: activeAnchor.shadowTop,
                      width: activeAnchor.shadowWidth,
                      height: activeAnchor.shadowHeight,
                      transform: 'translate(-50%, -50%)',
                      background:
                        'radial-gradient(ellipse 70% 50% at 50% 50%, rgba(10, 20, 32, 0.45) 0%, rgba(10, 20, 32, 0.2) 55%, transparent 75%)',
                      filter: 'blur(6px)',
                      zIndex: 5,
                    }}
                    aria-hidden="true"
                  />

                  {/* Tight Tire Contact Occlusion Shadow */}
                  <div
                    className="absolute pointer-events-none rounded-full"
                    style={{
                      left: activeAnchor.shadowLeft,
                      top: activeAnchor.shadowTop,
                      width: activeAnchor.shadowWidth,
                      height: '7%',
                      transform: 'translate(-50%, -45%)',
                      background:
                        'radial-gradient(ellipse 65% 50% at 50% 50%, rgba(6, 12, 20, 0.8) 0%, rgba(6, 12, 20, 0.35) 50%, transparent 75%)',
                      filter: 'blur(2.5px)',
                      zIndex: 6,
                    }}
                    aria-hidden="true"
                  />

                  {/* Vehicle image with transparent alpha */}
                  <img
                    src={
                      vehicleCategory === 'limousine'
                        ? '/assets/images/bus_limousine_cutout.png'
                        : vehicleCategory === 'cabin'
                          ? '/assets/images/bus_cabin_cutout.png'
                          : '/assets/images/bus_hanh_trinh_sleeper.png'
                    }
                    alt={vehicleCategory}
                    className="relative w-full h-auto object-contain pointer-events-none select-none z-10"
                    loading="eager"
                  />
                </div>
              </motion.div>
            );
          })()}
        </AnimatePresence>
      </div>
      </div>
    </div>
  );
};


