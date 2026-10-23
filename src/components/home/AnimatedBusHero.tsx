import React, { useState, useEffect, useRef } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { TripSearchForm } from './TripSearchForm';
import { TicketJourneyScene } from './TicketJourneyScene';
import type { SearchParams, VehicleCategory } from '../../types';
import { VEHICLE_MODELS } from '../../data/mockData';
import { sceneService } from '../../data/sceneData';
import { Armchair, QrCode, Sparkles } from 'lucide-react';

interface AnimatedBusHeroProps {
  initialParams: SearchParams;
  onSearch: (params: SearchParams) => void;
  isSearching?: boolean;
  introReady?: boolean;
}

export const AnimatedBusHero: React.FC<AnimatedBusHeroProps> = ({
  initialParams,
  onSearch,
  isSearching = false,
  introReady = true,
}) => {
  const shouldReduceMotion = useReducedMotion();

  // Selected vehicle category (synchronously switches displayed category with preload)
  const [selectedVehicleType, setSelectedVehicleType] = useState<VehicleCategory>(() => {
    if (typeof window !== 'undefined') {
      const v = new URLSearchParams(window.location.search).get('vehicle');
      if (v === 'limousine' || v === 'cabin' || v === 'sleeper') return v;
    }
    return 'sleeper';
  });

  const [displayedVehicleType, setDisplayedVehicleType] = useState<VehicleCategory>(selectedVehicleType);
  const vehicleSeqRef = useRef(0);

  // Live route preview from form
  const [previewRoute, setPreviewRoute] = useState<{ from: string; to: string } | null>(null);
  const [prevInitialParams, setPrevInitialParams] = useState(initialParams);

  if (initialParams.from !== prevInitialParams.from || initialParams.to !== prevInitialParams.to) {
    setPrevInitialParams(initialParams);
    setPreviewRoute(null);
  }

  const currentOrigin = previewRoute ? previewRoute.from : initialParams.from;
  const currentDest = previewRoute ? previewRoute.to : initialParams.to;

  // Preload and decode vehicle models on mount to guarantee instantaneous switching
  useEffect(() => {
    (['sleeper', 'limousine', 'cabin'] as VehicleCategory[]).forEach((cat) => {
      const img = VEHICLE_MODELS[cat]?.image;
      if (img) {
        sceneService.preloadAsset(img);
      }
    });
  }, []);

  // Decode target vehicle before switching displayed vehicle
  useEffect(() => {
    let isCancelled = false;
    const seq = ++vehicleSeqRef.current;
    const targetImg = VEHICLE_MODELS[selectedVehicleType]?.image;

    const commitSwitch = () => {
      if (!isCancelled && seq === vehicleSeqRef.current) {
        setDisplayedVehicleType(selectedVehicleType);
      }
    };

    if (!targetImg) {
      Promise.resolve().then(commitSwitch);
    } else {
      sceneService.preloadAsset(targetImg).then(commitSwitch);
    }

    return () => {
      isCancelled = true;
    };
  }, [selectedVehicleType]);

  const vehicleCategories: { id: VehicleCategory; label: string }[] = [
    { id: 'sleeper', label: 'Giường nằm' },
    { id: 'limousine', label: 'Limousine' },
    { id: 'cabin', label: 'Cabin VIP' },
  ];

  return (
    <section
      className="relative w-full bg-[#F7F4EC] pt-6 sm:pt-8 lg:pt-10 pb-12 sm:pb-16 flex flex-col justify-center isolate border-b border-[#E5E3DC] overflow-x-clip"
      aria-label="Hero HÀNH TRÌNH: Mở chiếc vé — Mở ra hành trình"
    >
      {/* UNIFIED CONTAINER (1280–1360px) */}
      <div className="relative z-10 w-full max-w-[1340px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-6 sm:gap-8 lg:gap-10">
        
        {/* ========================================================
            ROW 1: EDITORIAL CONTENT (LEFT) & TICKET POP-UP SCENE (RIGHT)
            ======================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 xl:gap-12 items-center">
          
          {/* LEFT COLUMN: Editorial Typography & Vehicle Chip Selector (~44%) */}
          <div className="lg:col-span-5 xl:col-span-5 min-w-0 flex flex-col justify-center">
            {/* Eyebrow */}
            <motion.div
              initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 12 }}
              animate={introReady ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
              transition={{ duration: shouldReduceMotion ? 0.04 : 0.45, ease: 'easeOut' }}
              className="inline-flex items-center gap-2 mb-3 self-start bg-[#FFFEFA] px-3.5 py-1 rounded-full border border-[#E5E3DC] shadow-2xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#0097A7]" />
              <span className="text-[11px] sm:text-xs font-bold tracking-[0.14em] text-[#0097A7] uppercase font-sans">
                HÀNH TRÌNH / KHÁM PHÁ VIỆT NAM
              </span>
            </motion.div>

            {/* Headline: strictly TWO LINES on desktop, wraps cleanly without overflow */}
            <motion.h1
              initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 16 }}
              animate={introReady ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
              transition={{ duration: shouldReduceMotion ? 0.04 : 0.55, delay: 0.08, ease: 'easeOut' }}
              className="font-serif text-[28px] xs:text-[32px] sm:text-[38px] lg:text-[40px] xl:text-[45px] font-bold text-[#102744] tracking-tight leading-[1.16] mb-3.5 break-words"
            >
              <span className="block">Đi một chuyến.</span>
              <span className="block text-[#0097A7]">Mở ngàn trải nghiệm.</span>
            </motion.h1>

            {/* Description */}
            <motion.p
              initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 14 }}
              animate={introReady ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 }}
              transition={{ duration: shouldReduceMotion ? 0.04 : 0.55, delay: 0.16, ease: 'easeOut' }}
              className="text-[#647084] text-base sm:text-lg leading-[1.6] mb-6 max-w-[460px] font-normal"
            >
              Chọn chuyến yêu thích. Chạm đến những miền đất mới.
            </motion.p>

            {/* VEHICLE CHIPS SELECTOR: Placed directly below description */}
            <motion.div
              initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 12 }}
              animate={introReady ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
              transition={{ duration: shouldReduceMotion ? 0.04 : 0.45, delay: 0.24 }}
              className="flex flex-col gap-2"
            >
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#647084]">
                Chọn loại xe:
              </span>
              <div className="flex flex-wrap items-center gap-2">
                {vehicleCategories.map((v) => {
                  const isActive = selectedVehicleType === v.id;
                  return (
                    <button
                      key={v.id}
                      type="button"
                      id={`veh-chip-${v.id}`}
                      data-testid={`veh-chip-${v.id}`}
                      onClick={() => setSelectedVehicleType(v.id)}
                      className={`h-9 px-4 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${
                        isActive
                          ? 'bg-[#102744] text-white shadow-xs'
                          : 'bg-[#FFFEFA] text-[#475569] border border-[#CBD5E1] hover:border-[#0097A7] hover:text-[#102744]'
                      }`}
                    >
                      {v.label}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </div>

          {/* RIGHT COLUMN: Ticket Opening 2.5D Pop-up Diorama (~56%) */}
          <div className="lg:col-span-7 xl:col-span-7 flex justify-center items-center">
            <TicketJourneyScene
              fromCity={currentOrigin}
              toCity={currentDest}
              vehicleCategory={displayedVehicleType}
              introReady={introReady}
            />
          </div>
        </div>

        {/* ========================================================
            ROW 2: WIDE HORIZONTAL SEARCH BAR (FULL WIDTH)
            [Nơi đi] [Đảo chiều] [Nơi đến] [Ngày đi] [Hành khách] [Tìm chuyến]
            ======================================================== */}
        <motion.div
          initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
          animate={introReady ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: shouldReduceMotion ? 0.04 : 0.55, delay: 0.28, ease: 'easeOut' }}
          className="w-full relative z-30"
        >
          <TripSearchForm
            variant="horizontal-bar"
            initialParams={{
              from: currentOrigin,
              to: currentDest,
              date: initialParams.date,
              passengers: initialParams.passengers,
            }}
            onRouteChange={(newFrom, newTo) => {
              setPreviewRoute({ from: newFrom, to: newTo });
            }}
            onSearch={(params) => {
              setPreviewRoute(null);
              onSearch(params);
            }}
            isLoading={isSearching}
          />

          {/* ROW 3: Micro-benefits below form */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-6 sm:gap-8 text-xs text-[#647084]">
            <div className="flex items-center gap-2">
              <Armchair className="w-4 h-4 text-[#0097A7]" />
              <span className="font-semibold text-[#102744]">Chọn chỗ trực quan</span>
            </div>
            <div className="flex items-center gap-2">
              <QrCode className="w-4 h-4 text-[#0097A7]" />
              <span className="font-semibold text-[#102744]">Vé điện tử dễ tra cứu</span>
            </div>
          </div>
        </motion.div>

      </div>
    </section>
  );
};
