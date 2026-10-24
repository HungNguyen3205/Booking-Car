import React, { useState, Suspense } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { TripSearchForm } from '../home/TripSearchForm';
import type { SearchParams, VehicleCategory } from '../../types';
import { Armchair, BedDouble, Crown, QrCode, Sparkles } from 'lucide-react';
import { WebGLFallback } from './3d/WebGLFallback';

// Lazy-load isolated 3D Three.js Canvas to keep booking/checkout bundles lightweight
const JourneyCanvas = React.lazy(() =>
  import('./3d/JourneyCanvas').then((m) => ({ default: m.JourneyCanvas }))
);

interface DanavaGoHeroProps {
  initialParams: SearchParams;
  onSearch: (params: SearchParams) => void;
  isSearching?: boolean;
}

export const DanavaGoHero: React.FC<DanavaGoHeroProps> = ({
  initialParams,
  onSearch,
  isSearching = false,
}) => {
  const shouldReduceMotion = useReducedMotion();
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleCategory>('sleeper');
  const [currentRoute, setCurrentRoute] = useState({
    from: initialParams.from || 'Đà Nẵng',
    to: initialParams.to || 'Huế',
  });

  // Developer debug mode enabled via ?debug=1 or ?debug3d=true
  const [isDebug] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const s = window.location.search;
    return s.includes('debug=1') || s.includes('debug3d=true');
  });

  // Debug flap fold angle (0 = flat open, Math.PI = folded over)
  const [debugFlapAngle, setDebugFlapAngle] = useState<number>(0.0);

  const vehicleOptions: { id: VehicleCategory; label: string; icon: React.ReactNode }[] = [
    { id: 'sleeper', label: 'Giường nằm', icon: <BedDouble size={16} /> },
    { id: 'limousine', label: 'Limousine', icon: <Armchair size={16} /> },
    { id: 'cabin', label: 'Cabin VIP', icon: <Crown size={16} /> },
  ];

  const handleRoutePreview = (from: string, to: string) => {
    setCurrentRoute({ from, to });
  };

  return (
    <section
      className="danava-go-hero w-full bg-[#F7F4EC] text-[#102744] overflow-visible relative"
      aria-label="DANAVA GO — Vé mở ra hành trình"
    >
      <div className="max-w-[1380px] mx-auto px-4 sm:px-6">
        {/* HERO STAGE: LEFT EDITORIAL + RIGHT 3D FOLDING TICKET STAGE */}
        <div className="relative w-full aspect-auto lg:aspect-[1376/570] flex flex-col lg:flex-row items-stretch pt-2 lg:pt-4">
          {/* EDITORIAL CONTENT (LEFT) */}
          <motion.div
            className="w-full lg:w-[54%] max-w-[700px] z-10 flex flex-col justify-start lg:pr-6 pt-2 lg:pt-4"
            initial={shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Brand Eyebrow */}
            <div className="inline-flex items-center gap-2 text-[11px] font-bold tracking-[0.14em] uppercase text-[#0097A7] mb-2.5">
              <Sparkles className="w-3.5 h-3.5 text-[#0097A7]" />
              <span>DANAVA GO • HÀNH TRÌNH KHÁM PHÁ VIỆT NAM</span>
            </div>

            {/* Headline */}
            <h1 className="font-serif text-[38px] sm:text-[48px] lg:text-[60px] font-bold leading-[1.10] tracking-[-0.025em] text-[#102744] mb-3">
              <span className="block text-[#102744]">Đi một chuyến.</span>
              <span className="block text-[#102744]">
                Mở ngàn <span className="inline-block whitespace-nowrap">trải nghiệm.</span>
              </span>
            </h1>

            {/* Description */}
            <p className="font-sans text-[15px] sm:text-[16px] text-[#4A5568] leading-relaxed max-w-[480px] mb-4 sm:mb-5">
              Chọn chuyến yêu thích. Chạm đến những miền đất mới trên chiếc vé mở kỳ diệu.
            </p>

            {/* Vehicle Selection Chips */}
            <div className="mb-4" role="group" aria-label="Chọn loại xe">
              <div className="flex flex-wrap gap-2.5">
                {vehicleOptions.map((v) => {
                  const isActive = selectedVehicle === v.id;
                  return (
                    <button
                      key={v.id}
                      type="button"
                      aria-pressed={isActive}
                      onClick={() => setSelectedVehicle(v.id)}
                      className={`inline-flex items-center gap-2 h-11 sm:h-12 px-4 sm:px-5 rounded-full text-xs sm:text-[13px] font-semibold transition-all duration-200 cursor-pointer ${
                        isActive
                          ? 'bg-[#102744] text-[#FFFEFA] shadow-[0_4px_12px_rgba(16,39,68,0.18)] scale-[1.02]'
                          : 'bg-[#FFF9ED] hover:bg-[#FFFEFA] text-[#102744] border border-[#D8D4C9] hover:border-[#102744] hover:-translate-y-0.5'
                      }`}
                    >
                      {v.icon}
                      <span>{v.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>

          {/* 3D TICKET SCENE STAGE (RIGHT / CENTER-RIGHT)
              Stable geometry scaffold: exact aspect ratio to prevent layout shifts.
              Seamlessly renders the Three.js 3D Canvas with soft lighting & cream background.
          */}
          <div
            className="w-full lg:absolute lg:inset-0 lg:left-0 pointer-events-none z-[5] flex items-center justify-end"
            aria-hidden="true"
          >
            <div
              className="w-full lg:w-[62%] aspect-[1376/720] max-h-[570px] relative rounded-2xl overflow-hidden pointer-events-none border border-[#E5E3DC]/80 bg-[#F7F4EC] shadow-[0_16px_40px_-12px_rgba(16,39,68,0.08)] flex flex-col justify-between"
              data-testid="danava-go-stage-scaffold"
            >
              {/* Lazy-loaded 3D WebGL Canvas Layer */}
              <div className="absolute inset-0 w-full h-full pointer-events-none z-[1] overflow-hidden">
                <Suspense fallback={<WebGLFallback message="Đang khởi tạo không gian 3D Three.js..." />}>
                  <JourneyCanvas isDebug={isDebug} flapAngle={debugFlapAngle} />
                </Suspense>
              </div>

              {/* Stage Header Strip */}
              <div className="relative z-10 flex items-center justify-between border-b border-[#E5E3DC]/60 px-5 pt-3.5 pb-2.5 bg-gradient-to-b from-[#FFFDF8]/90 to-transparent">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#0097A7]" />
                  <span className="font-serif text-sm font-bold text-[#102744] tracking-wider">
                    DANAVA GO • SLEEPER COACH
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {isDebug && (
                    <button
                      type="button"
                      onClick={() => setDebugFlapAngle((prev) => (prev === 0 ? Math.PI : 0))}
                      className="pointer-events-auto text-[11px] font-mono bg-[#102744] hover:bg-[#0097A7] text-white px-2.5 py-0.5 rounded transition-colors cursor-pointer shadow-sm"
                      title="Kiểm tra góc xoay bản lề flap quanh trục hingeX"
                    >
                      Bản lề: {debugFlapAngle === 0 ? 'Mở phẳng (0°)' : 'Gập lại (180°)'}
                    </button>
                  )}
                  <span className="text-[11px] font-semibold text-[#718096] bg-[#FFF9ED] px-2.5 py-0.5 rounded-md border border-[#E5E3DC]">
                    {currentRoute.from} → {currentRoute.to}
                  </span>
                </div>
              </div>

              {/* Stage Footer Meta */}
              <div className="relative z-10 flex items-center justify-between text-[11px] text-[#718096] px-5 py-2.5 border-t border-[#E5E3DC]/60 bg-gradient-to-t from-[#FFFDF8]/90 to-transparent">
                <span>Tuyến mẫu: Đà Nẵng — Huế</span>
                <span className="italic">Xe Giường nằm tĩnh • 4 bánh chạm đường • Nền bóng gầm</span>
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM DOCK: SEARCH FORM & VALUE PROPS */}
        <div className="relative z-20 mt-4 lg:-mt-14" id="hero-search">
          <TripSearchForm
            variant="horizontal-bar"
            initialParams={{
              from: currentRoute.from,
              to: currentRoute.to,
              date: initialParams.date,
              passengers: initialParams.passengers,
            }}
            onRouteChange={handleRoutePreview}
            onSearch={onSearch}
            isLoading={isSearching}
          />
          <div className="flex justify-center gap-6 sm:gap-7 flex-wrap text-xs text-[#4A5568] mt-2.5">
            <span className="flex items-center gap-2 font-medium">
              <Armchair className="w-3.5 h-3.5 text-[#0097A7] shrink-0" />
              Chọn chỗ trực quan.
            </span>
            <span className="flex items-center gap-2 font-medium">
              <QrCode className="w-3.5 h-3.5 text-[#0097A7] shrink-0" />
              Vé điện tử dễ tra cứu.
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
