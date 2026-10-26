import { useJourneyReducedMotion } from './useJourneyReducedMotion';
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { TripSearchForm } from '../home/TripSearchForm';
import type { SearchParams, VehicleCategory } from '../../types';
import { LayeredSceneStage } from './LayeredSceneStage';
import { VehicleMotionStage } from './VehicleMotionStage';
import { HeroVehicleSelector } from './HeroVehicleSelector';
import './danava-go-hero.css';

interface DanavaGoHeroProps {
  initialParams: SearchParams;
  onSearch: (params: SearchParams) => void;
  isSearching?: boolean;
  introReady?: boolean;
}

export const DanavaGoHero: React.FC<DanavaGoHeroProps> = ({ initialParams, onSearch, isSearching = false, introReady = true }) => {
  const reduced = useJourneyReducedMotion();
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleCategory>('cabin');
  const [toast, setToast] = useState<{ text: string; id: number } | null>(null);
  const [preview, setPreview] = useState({ from: initialParams.from, to: initialParams.to });
  const [previous, setPrevious] = useState(initialParams);
  // Only external route changes replace the preview. The form owns its date and
  // passenger fields and is never remounted for a vehicle/scenery transition.
  if (initialParams.from !== previous.from || initialParams.to !== previous.to) {
    setPrevious(initialParams);
    setPreview({ from: initialParams.from, to: initialParams.to });
  }

  return (
    <section className="danava-go-hero" aria-label="DANAVA GO — Hành trình khám phá Việt Nam">
      {/* 1. SCENERY BACKDROP: Full-width edge-to-edge, unconstrained by UI max-width */}
      <div className="go-scenery-backdrop" aria-hidden="true">
        <div className="journey-atmosphere" />
        <div
          className="go-journey-stage"
          data-testid="danava-go-stage-scaffold"
          role="img"
          aria-label={`Cảnh hành trình từ ${preview.from} bên trái đến ${preview.to} bên phải, xe đi ra gần trên cung đường cố định.`}
        >
          <LayeredSceneStage fromCity={preview.from} toCity={preview.to} />
          <VehicleMotionStage
            selectedVehicle={selectedVehicle}
            introReady={introReady}
            onVehicleError={(fallback, message) => {
              setSelectedVehicle(fallback);
              setToast({ text: message, id: Date.now() });
            }}
          />
        </div>
      </div>

      {/* 2. UI CONTAINER: Centered with max-width, safe padding, overflow visible */}
      <div className="go-ui-container">
        {/* Upper Editorial Block */}
        <motion.div
          className="go-editorial-center"
          initial={reduced ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduced ? 0 : 0.4 }}
        >
          <div className="go-eyebrow">
            <Sparkles size={14} className="text-[#0097A7]" />
            <span>HÀNH TRÌNH / KHÁM PHÁ VIỆT NAM</span>
          </div>
          <h1 className="go-title">
            <span>Đi một chuyến.</span>
            <span>Mở ngàn <span className="go-title-experience">trải nghiệm.</span></span>
          </h1>
          <p className="go-description">
            Chọn chuyến yêu thích. Chạm đến những miền đất mới.
          </p>
          <HeroVehicleSelector
            selectedVehicle={selectedVehicle}
            onSelectVehicle={(category) => {
              setToast(null);
              setSelectedVehicle(category);
            }}
            toast={toast}
            onCloseToast={() => setToast(null)}
          />
        </motion.div>

        {/* Search Dock: Near bottom of hero */}
        <div className="go-search-dock" id="hero-search">
          <TripSearchForm
            variant="horizontal-bar"
            initialParams={{ ...initialParams, from: preview.from, to: preview.to }}
            onRouteChange={(from, to) => setPreview({ from, to })}
            onSearch={onSearch}
            isLoading={isSearching}
          />
        </div>
      </div>
    </section>
  );
};
