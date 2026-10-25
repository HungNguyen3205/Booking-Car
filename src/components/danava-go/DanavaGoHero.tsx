import React, { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { TripSearchForm } from '../home/TripSearchForm';
import type { SearchParams, VehicleCategory } from '../../types';
import { Sparkles } from 'lucide-react';
import { LayeredSceneStage } from './LayeredSceneStage';
import { VehicleMotionStage } from './VehicleMotionStage';
import { HeroVehicleSelector } from './HeroVehicleSelector';
import { getHeroRouteConfig } from './heroAssetConfig';
import './danava-go-hero.css';

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
    to: initialParams.to || 'Hội An',
  });

  const routeConfig = getHeroRouteConfig(currentRoute.from, currentRoute.to);

  // Đồng bộ tuyến khi initialParams từ cấp cha thay đổi (ví dụ: người dùng click tuyến nổi bật)
  const [prevFrom, setPrevFrom] = useState(initialParams.from);
  const [prevTo, setPrevTo] = useState(initialParams.to);
  if (initialParams.from !== prevFrom || initialParams.to !== prevTo) {
    setPrevFrom(initialParams.from);
    setPrevTo(initialParams.to);
    if (initialParams.from && initialParams.to) {
      setCurrentRoute({ from: initialParams.from, to: initialParams.to });
    }
  }

  const handleRoutePreview = (from: string, to: string) => {
    setCurrentRoute({ from, to });
  };

  const vehicleNameMap: Record<VehicleCategory, string> = {
    sleeper: 'Giường Nằm',
    limousine: 'Limousine VIP',
    cabin: 'Cabin Hoàng Gia',
  };

  return (
    <section
      className="danava-go-hero w-full bg-[#F7F4EC] text-[#102744] overflow-hidden relative"
      aria-label="DANAVA GO — Hành trình khám phá Việt Nam"
    >
      {/* 1. LỚP GRADIENT CREAM BẢO VỆ ĐỘ TƯƠNG PHẢN CHỮ (DESKTOP) */}
      <div className="danava-go-hero-gradient" aria-hidden="true" />

      {/* 2. SÂN KHẤU CẢNH ĐỊA DANH NHIỀU LỚP (DESKTOP: NỀN INSET-0 TOÀN CHIỀU RỘNG) */}
      <div
        className="danava-go-hero-canvas-bg hidden lg:block"
        aria-hidden="true"
        data-testid="danava-go-stage-scaffold"
      >
        <LayeredSceneStage
          fromCity={currentRoute.from}
          toCity={currentRoute.to}
        />
        {/* Xe là chủ thể ở nửa phải, đầy đủ thân xe và bánh xe, chừa khoảng cách rõ với thanh tìm kiếm */}
        <div
          className="absolute z-20 pointer-events-none transition-all duration-500 ease-out"
          style={{
            right: routeConfig.roadAlignment.vehicleRightDesktop,
            bottom: routeConfig.roadAlignment.vehicleBottomDesktop,
            width: routeConfig.roadAlignment.vehicleWidthDesktop || '43%',
            maxWidth: '640px',
          }}
        >
          <VehicleMotionStage selectedVehicle={selectedVehicle} />
        </div>
      </div>

      {/* 3. LỚP GIAO DIỆN CHÍNH (EDITORIAL UI & SEARCH DOCK TRONG MAX-WIDTH CONTAINER) */}
      <div className="go-shell">
        {/* HÀNG TRÊN: TEXT & TABS (TRÁI 35-40%) + NGỮ CẢNH TUYẾN (PHẢI) */}
        <div className="go-hero-top-row">
          {/* EDITORIAL CONTENT (LEFT) */}
          <motion.div
            className="go-copy"
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
            <h1 className="go-title text-[#102744]">
              <span className="block text-[#102744]">Đi một chuyến.</span>
              <span className="block text-[#102744]">
                Mở ngàn <span className="go-title-experience">trải nghiệm.</span>
              </span>
            </h1>

            {/* Description */}
            <p className="font-sans text-[15px] sm:text-[16px] text-[#4A5568] leading-relaxed max-w-[480px] mb-4 sm:mb-5">
              Chọn chuyến yêu thích. Chạm đến những miền đất mới.
            </p>

            {/* Bộ chọn loại xe */}
            <HeroVehicleSelector
              selectedVehicle={selectedVehicle}
              onSelectVehicle={setSelectedVehicle}
            />
          </motion.div>

          {/* CỘT NGỮ CẢNH TUYẾN / ROUTE BADGE (PHẢI) */}
          <div className="go-hero-context-col flex flex-col items-end gap-2.5 pointer-events-auto">
            <div className="hidden sm:inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FFFDF8]/90 backdrop-blur-sm border border-[#E5E3DC]/90 shadow-[0_2px_8px_rgba(16,39,68,0.05)] text-xs font-semibold text-[#102744]">
              <span className="w-2 h-2 rounded-full bg-[#0097A7]" />
              <span>{currentRoute.from}</span>
              <span className="text-[#0097A7]">→</span>
              <span>{currentRoute.to}</span>
              <span className="text-[10px] text-[#718096] border-l border-[#D8D4C9] pl-2 uppercase tracking-wider font-mono">
                {vehicleNameMap[selectedVehicle] || 'Giường Nằm'}
              </span>
            </div>
          </div>
        </div>

        {/* SÂN KHẤU SCENE CHO MOBILE (SẮP XẾP TỰ NHIÊN GIỮA TEXT VÀ FORM TRONG FLOW) */}
        <div className="lg:hidden relative w-full h-[260px] sm:h-[300px] overflow-hidden my-3 order-2">
          <LayeredSceneStage
            fromCity={currentRoute.from}
            toCity={currentRoute.to}
          />
          <div
            className="absolute z-20 pointer-events-none transition-all duration-500 ease-out"
            style={{
              right: routeConfig.roadAlignment.vehicleRightMobile,
              bottom: routeConfig.roadAlignment.vehicleBottomMobile,
              width: routeConfig.roadAlignment.vehicleWidthMobile || '78%',
            }}
          >
            <VehicleMotionStage selectedVehicle={selectedVehicle} />
          </div>
        </div>

        {/* BOTTOM DOCK: THANH TÌM CHUYẾN NỔI NHẸ PHÍA DƯỚI */}
        <div className="go-search-dock" id="hero-search">
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
        </div>
      </div>
    </section>
  );
};
