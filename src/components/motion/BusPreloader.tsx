import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';

export interface BusPreloaderProps {
  isReady: boolean;
  onExitComplete: () => void;
  maxTimeoutMs?: number;
}

export const BusPreloader: React.FC<BusPreloaderProps> = ({
  isReady,
  onExitComplete,
  maxTimeoutMs = 3500,
}) => {
  const shouldReduceMotion = useReducedMotion();
  const [isTimedOut, setIsTimedOut] = useState(false);
  const completedRef = useRef(false);

  // Fallback safety timeout in case assets hang or fail
  useEffect(() => {
    const safetyTimer = setTimeout(() => {
      setIsTimedOut(true);
    }, maxTimeoutMs);

    return () => clearTimeout(safetyTimer);
  }, [maxTimeoutMs]);

  // Derived state: exit begins immediately when assets are ready or safety timeout fires
  const isExiting = isReady || isTimedOut;

  // Cleanup & exit completion timer (instant 40ms on reduced motion, 300ms on normal)
  useEffect(() => {
    if (!isExiting) return;

    const exitDuration = shouldReduceMotion ? 40 : 300;
    const exitTimer = setTimeout(() => {
      if (!completedRef.current) {
        completedRef.current = true;
        onExitComplete();
      }
    }, exitDuration);

    return () => clearTimeout(exitTimer);
  }, [isExiting, onExitComplete, shouldReduceMotion]);

  return (
    <AnimatePresence>
      {!isExiting && (
        <motion.aside
          initial={{ opacity: 1 }}
          exit={{
            opacity: 0,
            transition: { duration: shouldReduceMotion ? 0.04 : 0.3, ease: 'easeInOut' },
          }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#F7F4EC] overflow-hidden"
          role="status"
          aria-live="polite"
          aria-label="Đang mở hành trình"
        >
          {/* Subtle background landscape */}
          <div className="absolute inset-x-0 bottom-1/3 h-48 opacity-25 overflow-hidden pointer-events-none">
            <svg
              className={`w-[200%] h-full transform -translate-x-12 ${
                shouldReduceMotion ? '' : 'animate-[pulse_6s_ease-in-out_infinite]'
              }`}
              viewBox="0 0 1600 200"
              preserveAspectRatio="none"
              fill="none"
            >
              {/* Distant mountains and pagoda silhouettes */}
              <path
                d="M0,180 Q200,60 400,150 T800,100 T1200,140 T1600,110 L1600,200 L0,200 Z"
                fill="#CBD5E1"
              />
              <path
                d="M100,190 Q300,110 600,170 T1100,130 T1600,160 L1600,200 L0,200 Z"
                fill="#94A3B8"
              />
            </svg>
          </div>

          {/* Main Bus Stage */}
          <div className="relative flex flex-col items-center z-10 w-full max-w-xl px-4">
            {/* Speed breeze lines */}
            {!shouldReduceMotion && (
              <div className="absolute -top-4 left-1/4 right-1/4 h-8 flex flex-col justify-around pointer-events-none opacity-40">
                <span className="w-16 h-0.5 bg-teal-400 rounded-full self-start animate-[pulse_1s_ease-in-out_infinite]" />
                <span className="w-24 h-0.5 bg-slate-300 rounded-full self-end animate-[pulse_1.4s_ease-in-out_infinite]" />
              </div>
            )}

            {/* Bus Body (suspension bounce disabled in reduced motion) */}
            <div className={`relative ${shouldReduceMotion ? '' : 'animate-bus-bob'} w-full flex justify-center`}>
              <svg
                width="380"
                height="150"
                viewBox="0 0 380 150"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="drop-shadow-md select-none"
              >
                {/* Ground Shadow */}
                <ellipse cx="190" cy="142" rx="160" ry="6" fill="#102744" fillOpacity="0.18" />

                {/* Bus Main Chassis Body */}
                <path
                  d="M30 115 C30 118 33 120 37 120 L75 120 C75 106 88 95 103 95 C118 95 131 106 131 120 L249 120 C249 106 262 95 277 95 C292 95 305 106 305 120 L345 120 C350 120 354 116 354 110 L352 50 C352 38 344 32 332 30 L60 30 C45 30 30 42 30 58 Z"
                  fill="#102744"
                />

                {/* Silver aerodynamic side stripe */}
                <path
                  d="M30 84 Q120 74 200 86 T352 76 L352 86 Q280 94 180 82 T30 94 Z"
                  fill="#E2E8F0"
                />

                {/* Teal Dynamic Accent Wave */}
                <path
                  d="M50 88 C120 80 180 102 280 84 C310 78 340 82 352 84 L352 87 C335 85 305 81 278 87 C182 106 118 84 50 92 Z"
                  fill="#0097A7"
                />

                {/* Front Windshield (Driver's view) */}
                <path
                  d="M30 56 C30 44 42 34 54 34 L80 34 L80 80 L35 80 C32 80 30 75 30 68 Z"
                  fill="#1E3A8A"
                  fillOpacity="0.8"
                />
                {/* Windshield reflection */}
                <path d="M40 37 L72 37 L52 75 L36 75 Z" fill="white" fillOpacity="0.18" />

                {/* Passenger Tinted Windows */}
                <g fill="#1E3A8A" fillOpacity="0.75">
                  <rect x="86" y="34" width="46" height="42" rx="4" />
                  <rect x="138" y="34" width="46" height="42" rx="4" />
                  <rect x="190" y="34" width="46" height="42" rx="4" />
                  <rect x="242" y="34" width="46" height="42" rx="4" />
                  <path d="M294 34 H336 C342 34 346 38 346 44 V72 C346 75 343 76 340 76 H294 Z" />
                </g>

                {/* Windows glossy light reflection strip */}
                <path
                  d="M92 40 L340 40 L335 44 L95 44 Z"
                  fill="white"
                  fillOpacity="0.25"
                />

                {/* Bus Headlight beam */}
                <path d="M30 98 L24 99 C22 99 20 97 20 95 L20 91 C20 89 22 87 24 87 L30 88 Z" fill="#F3B54A" />
                <polygon points="20,89 -40,75 -40,115 20,97" fill="url(#headlight-beam)" opacity="0.3" />

                {/* Bus Taillight */}
                <rect x="350" y="86" width="4" height="14" rx="2" fill="#EF4444" />

                {/* Brand Logo on Bus Side */}
                <text
                  x="180"
                  y="108"
                  textAnchor="middle"
                  fill="#FFFFFF"
                  fontFamily="system-ui, -apple-system, sans-serif"
                  fontWeight="700"
                  fontSize="10"
                  letterSpacing="2.5"
                >
                  HÀNH TRÌNH
                </text>

                {/* Teal wave icon beside brand */}
                <path
                  d="M125 106 Q130 102 135 106 T145 106"
                  stroke="#0097A7"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  fill="none"
                />

                {/* Left Wheel (Front) */}
                <g transform="translate(103, 120)">
                  <circle cx="0" cy="0" r="21" fill="#0F172A" />
                  <g className={shouldReduceMotion ? '' : 'animate-spin-wheel'} style={{ transformOrigin: '0 0' }}>
                    <circle cx="0" cy="0" r="18" fill="#1E293B" stroke="#64748B" strokeWidth="2.5" />
                    <circle cx="0" cy="0" r="12" fill="#CBD5E1" stroke="#94A3B8" strokeWidth="1.5" />
                    <circle cx="0" cy="0" r="5" fill="#0097A7" />
                    <line x1="0" y1="-12" x2="0" y2="12" stroke="#475569" strokeWidth="2" />
                    <line x1="-10.4" y1="-6" x2="10.4" y2="6" stroke="#475569" strokeWidth="2" />
                    <line x1="-10.4" y1="6" x2="10.4" y2="-6" stroke="#475569" strokeWidth="2" />
                  </g>
                </g>

                {/* Right Wheel (Rear) */}
                <g transform="translate(277, 120)">
                  <circle cx="0" cy="0" r="21" fill="#0F172A" />
                  <g className={shouldReduceMotion ? '' : 'animate-spin-wheel'} style={{ transformOrigin: '0 0' }}>
                    <circle cx="0" cy="0" r="18" fill="#1E293B" stroke="#64748B" strokeWidth="2.5" />
                    <circle cx="0" cy="0" r="12" fill="#CBD5E1" stroke="#94A3B8" strokeWidth="1.5" />
                    <circle cx="0" cy="0" r="5" fill="#0097A7" />
                    <line x1="0" y1="-12" x2="0" y2="12" stroke="#475569" strokeWidth="2" />
                    <line x1="-10.4" y1="-6" x2="10.4" y2="6" stroke="#475569" strokeWidth="2" />
                    <line x1="-10.4" y1="6" x2="10.4" y2="-6" stroke="#475569" strokeWidth="2" />
                  </g>
                </g>

                {/* Defs */}
                <defs>
                  <linearGradient id="headlight-beam" x1="20" y1="93" x2="-40" y2="93" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#FDE047" stopOpacity="0.8" />
                    <stop offset="1" stopColor="#FDE047" stopOpacity="0" />
                  </linearGradient>
                </defs>
              </svg>
            </div>

            {/* Road Line (static in reduced motion, flowing in normal) */}
            <div className="w-full max-w-sm mt-1 mb-6 flex flex-col items-center">
              <svg width="100%" height="8" viewBox="0 0 320 8" fill="none" className="overflow-visible">
                <line x1="0" y1="2" x2="320" y2="2" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round" />
                <line
                  x1="0"
                  y1="2"
                  x2="320"
                  y2="2"
                  stroke="#0097A7"
                  strokeWidth="2.5"
                  strokeDasharray={shouldReduceMotion ? undefined : '14 18'}
                  className={shouldReduceMotion ? '' : 'animate-road-flow'}
                />
              </svg>
            </div>

            {/* Status text & Progress */}
            <div className="flex flex-col items-center text-center">
              <p className="text-sm font-semibold tracking-wide text-[#102744] mb-3">
                Đang mở hành trình…
              </p>

              {/* Progress Bar */}
              <div className="w-56 h-1.5 bg-[#E5E3DC] rounded-full overflow-hidden relative">
                <div
                  className={`absolute top-0 bottom-0 ${
                    shouldReduceMotion
                      ? 'w-full bg-[#0097A7]'
                      : 'w-24 bg-gradient-to-r from-transparent via-[#0097A7] to-transparent rounded-full animate-[shimmer_1.4s_infinite]'
                  }`}
                />
              </div>

              {/* Sub-legend */}
              <div className="mt-4 flex items-center gap-3 text-xs text-[#647084]">
                <span className="flex items-center gap-1">
                  <span className="inline-block w-2 h-2 rounded-full bg-[#0097A7]" />
                  Bánh xe
                </span>
                <span>→</span>
                <span className="flex items-center gap-1">
                  <span className="inline-block w-2 h-2 rounded-full bg-[#CBD5E1]" />
                  Vạch đường
                </span>
                <span>→</span>
                <span className="flex items-center gap-1 text-[#102744] font-medium">
                  Chuyển vào trang chủ
                </span>
              </div>
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
};
