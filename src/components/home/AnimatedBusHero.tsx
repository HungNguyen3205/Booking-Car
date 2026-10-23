import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TripSearchForm } from './TripSearchForm';
import { RouteScenery } from './RouteScenery';
import type { SearchParams, VehicleCategory } from '../../types';
import { VEHICLE_MODELS } from '../../data/mockData';
import { Armchair, QrCode } from 'lucide-react';

interface AnimatedBusHeroProps {
  initialOrigin?: string;
  initialDest?: string;
  onSearch: (params: SearchParams) => void;
  isSearching?: boolean;
}

export const AnimatedBusHero: React.FC<AnimatedBusHeroProps> = ({
  initialOrigin = 'Đà Nẵng',
  initialDest = 'Huế',
  onSearch,
  isSearching = false,
}) => {
  const [selectedVehicleType, setSelectedVehicleType] = useState<VehicleCategory>('sleeper');
  const [currentOrigin, setCurrentOrigin] = useState(initialOrigin);
  const [currentDest, setCurrentDest] = useState(initialDest);

  React.useEffect(() => {
    if (initialOrigin) setCurrentOrigin(initialOrigin);
  }, [initialOrigin]);

  React.useEffect(() => {
    if (initialDest) setCurrentDest(initialDest);
  }, [initialDest]);

  const currentVehicle = VEHICLE_MODELS[selectedVehicleType];

  return (
    <section
      className="relative w-full min-h-[660px] lg:min-h-[700px] bg-[#F7F4EC] pt-8 lg:pt-10 pb-10 lg:pb-12 flex flex-col justify-center isolate border-b border-[#E5E3DC]"
      aria-label="Hero HÀNH TRÌNH"
    >
      {/* 
        1. DYNAMIC ROUTE SCENERY (BACKGROUND LAYER)
        Full-width panorama spanning 100% width, from left edge to right edge under header.
      */}
      <RouteScenery fromCity={currentOrigin} toCity={currentDest} />

      {/* 2. MAIN UNIFIED CONTENT CONTAINER (1280-1360px with generous horizontal padding) */}
      <div className="relative z-10 w-full max-w-[1340px] mx-auto px-6 sm:px-10 py-2">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
          
          {/* LEFT COLUMN: Content & 2-row Search Form */}
          <div className="lg:col-span-6 xl:col-span-6 flex flex-col justify-center max-w-[620px]">
            {/* Eyebrow */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="inline-flex items-center gap-2 mb-3 self-start bg-[#FFFEFA]/90 backdrop-blur-2xs px-3 py-1 rounded-full border border-[#E5E3DC] shadow-2xs"
            >
              <span className="w-2 h-2 rounded-full bg-[#0097A7]" />
              <span className="text-[12px] font-bold tracking-[0.12em] text-[#0097A7] uppercase font-sans">
                NHỮNG CUNG ĐƯỜNG KẾT NỐI VIỆT NAM
              </span>
            </motion.div>

            {/* Headline: strictly TWO LINES on desktop */}
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.08, ease: 'easeOut' }}
              className="font-serif text-[38px] sm:text-[46px] lg:text-[50px] xl:text-[56px] font-bold text-[#102744] tracking-tight leading-[1.12] mb-3"
            >
              <span>Chạm một vé.</span>
              <br />
              <span className="text-[#0097A7] inline-block whitespace-nowrap">Mở hành trình.</span>
            </motion.h1>

            {/* Concise Description: 2 lines on desktop */}
            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.16, ease: 'easeOut' }}
              className="text-[#475569] text-[15px] sm:text-[16px] leading-[1.6] mb-5 max-w-[480px] font-normal"
            >
              Đặt vé xe khách dễ dàng. Chọn chuyến, chọn chỗ và bắt đầu hành trình của bạn.
            </motion.p>

            {/* 2-Row Search Form with live route sync */}
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.22, ease: 'easeOut' }}
              className="w-full relative z-30"
            >
              <TripSearchForm
                initialParams={{ from: currentOrigin, to: currentDest, date: '2026-10-28', passengers: 1 }}
                onRouteChange={(newFrom, newTo) => {
                  setCurrentOrigin(newFrom);
                  setCurrentDest(newTo);
                }}
                onSearch={(params) => {
                  setCurrentOrigin(params.from);
                  setCurrentDest(params.to);
                  onSearch(params);
                }}
                isLoading={isSearching}
              />
            </motion.div>

            {/* Micro badges below form */}
            <div className="mt-4 flex flex-wrap items-center gap-6 text-xs text-[#556275]">
              <div className="flex items-center gap-2">
                <Armchair className="w-4 h-4 text-[#0097A7]" />
                <span className="font-semibold text-[#102744]">Chọn chỗ trực quan</span>
              </div>
              <div className="flex items-center gap-2">
                <QrCode className="w-4 h-4 text-[#0097A7]" />
                <span className="font-semibold text-[#102744]">Vé điện tử dễ tra cứu</span>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Foreground Bus & Grounded Roadway Stage */}
          <div className="lg:col-span-6 xl:col-span-6 relative flex flex-col items-center justify-center pt-2 lg:pt-4">
            
            {/* Vehicle Stage Area */}
            <div className="relative w-full flex flex-col items-center">
              
              {/* Assembled Bus & Road Surface Layer */}
              <div className="relative w-full max-w-xl flex flex-col items-center">
                
                {/* Bus Entrance Animation (rolls in from right on mount, transitions on vehicle tab switch) */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentVehicle.id}
                    initial={{ x: 100, scale: 0.97, opacity: 0 }}
                    animate={{ x: 0, scale: 1, opacity: 1 }}
                    exit={{ x: -40, scale: 0.98, opacity: 0 }}
                    transition={{
                      duration: 0.95,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                    className="relative z-10 w-full flex justify-center select-none"
                  >
                    {/* Bus Transparent PNG Image with True Alpha */}
                    <img
                      src={currentVehicle.image}
                      alt={currentVehicle.name}
                      className="w-full max-h-[290px] sm:max-h-[340px] object-contain select-none pointer-events-none drop-shadow-sm"
                      loading="eager"
                    />
                  </motion.div>
                </AnimatePresence>

                {/* 
                  Realistic Multi-layered Ground Contact Shadows:
                  Separate dark contact patches directly under visible rear and front wheels
                  + continuous soft ambient undercarriage shadow
                */}
                <div className="relative w-[92%] -mt-3.5 sm:-mt-4 z-[9] h-4 pointer-events-none select-none">
                  {/* Rear wheel tire contact patch */}
                  <div className="absolute left-[16%] w-[26%] h-2.5 bg-[#080D14]/90 blur-[2px] rounded-full" />
                  {/* Front wheel tire contact patch */}
                  <div className="absolute left-[62%] w-[22%] h-2.5 bg-[#080D14]/90 blur-[2px] rounded-full" />
                  {/* Soft ambient chassis occlusion shadow */}
                  <div className="absolute left-[12%] w-[76%] h-4 -mt-0.5 bg-[#0A101D]/35 blur-[5px] rounded-full" />
                </div>

                {/* 
                  Perspective Highway Road Surface right beneath the coach wheels
                  Spans from mid-hero towards the right edge with genuine asphalt perspective
                */}
                <div className="relative w-[110%] max-w-[600px] -mt-5 z-[5] pointer-events-none select-none">
                  <svg viewBox="0 0 560 64" fill="none" className="w-full h-auto overflow-visible">
                    <defs>
                      <linearGradient id="heroRoadGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#718096" stopOpacity="0" />
                        <stop offset="20%" stopColor="#4A5568" stopOpacity="0.88" />
                        <stop offset="100%" stopColor="#2D3748" stopOpacity="0.96" />
                      </linearGradient>
                      <linearGradient id="heroShoulderGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0" />
                        <stop offset="25%" stopColor="#FFFFFF" stopOpacity="0.75" />
                        <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.95" />
                      </linearGradient>
                    </defs>
                    {/* Asphalt Road Plane tapering naturally from left to right */}
                    <polygon points="40,18 560,12 560,64 0,64" fill="url(#heroRoadGrad)" />
                    {/* White Shoulder Pavement Line where wheels touch */}
                    <line x1="50" y1="18" x2="560" y2="12" stroke="url(#heroShoulderGrad)" strokeWidth="3" strokeLinecap="round" />
                    {/* Perspective Dashed Centerline */}
                    <line x1="90" y1="42" x2="560" y2="36" stroke="#FBBF24" strokeWidth="2.5" strokeDasharray="16 12" strokeOpacity="0.85" />
                  </svg>
                </div>

              </div>

              {/* 
                Clean Segmented Vehicle Tab Switcher & Specs Dock
                With translucent cream card background for high contrast
              */}
              <div className="mt-5 p-2 sm:p-2.5 bg-[#FFFEFA]/95 backdrop-blur-md border border-[#E5E3DC] rounded-2xl shadow-xs flex flex-col items-center gap-2 z-10">
                <div className="flex items-center gap-1.5">
                  {(['sleeper', 'limousine', 'cabin'] as VehicleCategory[]).map((type) => {
                    const veh = VEHICLE_MODELS[type];
                    const active = selectedVehicleType === type;
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setSelectedVehicleType(type)}
                        className={`h-[38px] px-3.5 sm:px-4 rounded-xl text-xs font-semibold transition-all ${
                          active
                            ? 'bg-[#102744] text-white shadow-xs'
                            : 'text-[#556275] hover:text-[#102744] hover:bg-[#F7F4EC]'
                        }`}
                      >
                        {veh.categoryLabel}
                      </button>
                    );
                  })}
                </div>

                {/* Concise High-Contrast Specs */}
                <div className="flex items-center gap-2.5 text-xs text-[#334155] font-medium">
                  <span className="font-bold text-[#102744]">{currentVehicle.name}</span>
                  <span className="text-[#94A3B8]">•</span>
                  <span>{currentVehicle.floors} tầng tiện nghi</span>
                  <span className="text-[#94A3B8]">•</span>
                  <span>{currentVehicle.seatsTotal} chỗ ngồi</span>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
