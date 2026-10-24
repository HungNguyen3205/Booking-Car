import React, { useState, useEffect, useRef } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { TripSearchForm } from './TripSearchForm';
import { TicketJourneyScene } from './TicketJourneyScene';
import type { SearchParams, VehicleCategory } from '../../types';
import { VEHICLE_MODELS } from '../../data/mockData';
import { sceneService } from '../../data/sceneData';
import { Armchair, QrCode, BedDouble, Crown } from 'lucide-react';

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

  // Selected vehicle category (synchronously switches with instant feedback)
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

  const vehicleIcons = {
    sleeper: <BedDouble size={14} className="shrink-0" />,
    limousine: <Armchair size={14} className="shrink-0" />,
    cabin: <Crown size={14} className="shrink-0" />,
  };

  return (
    <section className="journey-home" aria-label="Mở chiếc vé — Mở ra hành trình">
      <div className="journey-home-inner">
        {/* UNIFIED HERO STAGE: COPY OVER CLEAN SKY (LEFT) & SCENERY SPANNING ACROSS (RIGHT) */}
        <div className="journey-hero-stage">
          {/* EDITORIAL TYPOGRAPHY ON THE LEFT */}
          <motion.div
            className="journey-copy"
            initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 12 }}
            animate={{ opacity: introReady ? 1 : 0, y: 0 }}
            transition={{ duration: shouldReduceMotion ? 0.04 : 0.45 }}
          >
            {/* Eyebrow */}
            <div className="journey-eyebrow">
              <span>HÀNH TRÌNH / KHÁM PHÁ VIỆT NAM</span>
            </div>

            {/* Headline with guaranteed no-orphan "trải nghiệm." */}
            <h1 className="journey-title">
              <span className="journey-title-lead">Đi một chuyến.</span>
              <span className="journey-title-accent">
                Mở ngàn <span className="journey-title-nowrap">trải nghiệm.</span>
              </span>
            </h1>

            {/* Description */}
            <p className="journey-description">
              Chọn chuyến yêu thích.{' '}
              <br className="hidden sm:inline" />
              Chạm đến những miền đất mới.
            </p>

            {/* Vehicle Selection Tabs (under description as in reference image) */}
            <div className="journey-vehicle-selector">
              <div className="journey-vehicle-list" role="group" aria-label="Loại xe">
                {vehicleCategories.map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    className={`journey-vehicle-chip ${selectedVehicleType === v.id ? 'is-active' : ''}`}
                    data-testid={`veh-chip-${v.id}`}
                    aria-pressed={selectedVehicleType === v.id}
                    onClick={() => setSelectedVehicleType(v.id)}
                  >
                    {vehicleIcons[v.id]}
                    <span>{v.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>

          {/* PANORAMIC SCENE COLUMN */}
          <div className="journey-scene-column">
            <TicketJourneyScene
              fromCity={currentOrigin}
              toCity={currentDest}
              vehicleCategory={displayedVehicleType}
              introReady={introReady}
            />
          </div>
        </div>

        {/* BOTTOM DOCK: SEARCH FORM & VALUE PROPS */}
        <div className="journey-form-dock" id="hero-search">
          <TripSearchForm
            variant="horizontal-bar"
            initialParams={{
              from: currentOrigin,
              to: currentDest,
              date: initialParams.date,
              passengers: initialParams.passengers,
            }}
            onRouteChange={(from, to) => setPreviewRoute({ from, to })}
            onSearch={(params) => {
              setPreviewRoute(null);
              onSearch(params);
            }}
            isLoading={isSearching}
          />
          <div className="journey-benefits">
            <span>
              <Armchair className="w-3.5 h-3.5 text-[#0097A7]" />
              Chọn chỗ trực quan
            </span>
            <span>
              <QrCode className="w-3.5 h-3.5 text-[#0097A7]" />
              Vé điện tử dễ tra cứu
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
