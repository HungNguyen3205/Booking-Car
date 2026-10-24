import React, { useState, useEffect, useRef } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { TripSearchForm } from './TripSearchForm';
import { TicketJourneyScene } from './TicketJourneyScene';
import { SCENE_VEHICLE_CONFIGS, preloadAndDecodeImage } from '../../data/sceneVehicleData';
import type { SearchParams, VehicleCategory } from '../../types';
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

  // Selected vehicle category (synchronously switches with instant tab UI feedback)
  const [selectedVehicleType, setSelectedVehicleType] = useState<VehicleCategory>(() => {
    if (typeof window !== 'undefined') {
      const v = new URLSearchParams(window.location.search).get('vehicle');
      if (v === 'limousine' || v === 'cabin' || v === 'sleeper') return v;
    }
    return 'sleeper';
  });

  // Displayed vehicle category on the scene (only switches once asset is preloaded & decoded)
  const [displayedVehicleType, setDisplayedVehicleType] = useState<VehicleCategory>(selectedVehicleType);
  const [preloadError, setPreloadError] = useState<VehicleCategory | null>(null);

  // Request/version sequence ID for rapid-click handling (LWW: last-write-wins)
  const vehicleSeqRef = useRef(0);
  const errorTimerRef = useRef<number | null>(null);

  // Live route preview from form
  const [previewRoute, setPreviewRoute] = useState<{ from: string; to: string } | null>(null);
  const [prevInitialParams, setPrevInitialParams] = useState(initialParams);

  if (initialParams.from !== prevInitialParams.from || initialParams.to !== prevInitialParams.to) {
    setPrevInitialParams(initialParams);
    setPreviewRoute(null);
  }

  const currentOrigin = previewRoute ? previewRoute.from : initialParams.from;
  const currentDest = previewRoute ? previewRoute.to : initialParams.to;

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (errorTimerRef.current !== null) {
        window.clearTimeout(errorTimerRef.current);
      }
    };
  }, []);

  // Preload and decode all vehicle models on mount so subsequent switches are near instantaneous
  useEffect(() => {
    (['sleeper', 'limousine', 'cabin'] as VehicleCategory[]).forEach((cat) => {
      const img = SCENE_VEHICLE_CONFIGS[cat]?.image;
      if (img) {
        preloadAndDecodeImage(img).catch(() => {});
      }
    });
  }, []);

  // Rapid-click handling with sequence ID & Last-Write-Wins:
  // - Tab updates instantly
  // - Preloads and decodes asset
  // - Stale preloads never overwrite newer selections
  // - On error, retains current vehicle without stuck loading
  useEffect(() => {
    if (selectedVehicleType === displayedVehicleType) {
      return;
    }

    let isCancelled = false;
    const seq = ++vehicleSeqRef.current;

    const targetConfig = SCENE_VEHICLE_CONFIGS[selectedVehicleType];
    const targetImg = targetConfig?.image;

    if (!targetImg) {
      if (!isCancelled && seq === vehicleSeqRef.current) {
        setDisplayedVehicleType(selectedVehicleType);
      }
      return;
    }

    preloadAndDecodeImage(targetImg)
      .then(() => {
        if (!isCancelled && seq === vehicleSeqRef.current) {
          setDisplayedVehicleType(selectedVehicleType);
        }
      })
      .catch(() => {
        if (!isCancelled && seq === vehicleSeqRef.current) {
          // Keep previous vehicle visible, record subtle error indicator
          setPreloadError(selectedVehicleType);

          if (errorTimerRef.current !== null) {
            window.clearTimeout(errorTimerRef.current);
          }
          errorTimerRef.current = window.setTimeout(() => {
            setPreloadError(null);
          }, 3500);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [selectedVehicleType, displayedVehicleType]);

  const handleVehicleSelect = (id: VehicleCategory) => {
    if (preloadError) {
      setPreloadError(null);
    }
    setSelectedVehicleType(id);
  };

  const vehicleCategories: { id: VehicleCategory; label: string }[] = [
    { id: 'sleeper', label: 'Giường nằm' },
    { id: 'limousine', label: 'Limousine' },
    { id: 'cabin', label: 'Cabin VIP' },
  ];

  const vehicleIcons = {
    sleeper: <BedDouble size={16} className="shrink-0" />,
    limousine: <Armchair size={16} className="shrink-0" />,
    cabin: <Crown size={16} className="shrink-0" />,
  };

  return (
    <section className="journey-home" aria-label="Mở chiếc vé — Mở ra hành trình">
      <div className="journey-home-inner">
        {/* UNIFIED HERO STAGE: COPY OVER CLEAN SKY (LEFT) & SCENERY SPANNING ACROSS (RIGHT) */}
        <div className="journey-hero-stage">
          {/* EDITORIAL TYPOGRAPHY ON THE LEFT */}
          <motion.div
            className="journey-copy"
            initial={shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
            animate={introReady ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.5, ease: [0.16, 1, 0.3, 1] }}
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
              Chọn chuyến yêu thích. Chạm đến những miền đất mới.
            </p>

            {/* Vehicle Selection Tabs (under description as in reference image) */}
            <div className="journey-vehicle-selector">
              <div className="journey-vehicle-list" role="group" aria-label="Loại xe">
                {vehicleCategories.map((v) => {
                  const isSelected = selectedVehicleType === v.id;
                  const isPending = isSelected && selectedVehicleType !== displayedVehicleType && preloadError !== v.id;
                  const hasError = preloadError === v.id;

                  return (
                    <button
                      key={v.id}
                      type="button"
                      className={`journey-vehicle-chip ${isSelected ? 'is-active' : ''} ${isPending ? 'is-pending' : ''} ${hasError ? 'is-error' : ''}`}
                      data-testid={`veh-chip-${v.id}`}
                      aria-pressed={isSelected}
                      aria-busy={isPending}
                      onClick={() => handleVehicleSelect(v.id)}
                    >
                      {vehicleIcons[v.id]}
                      <span>{v.label}</span>
                      {isPending && (
                        <span
                          className="w-1.5 h-1.5 rounded-full bg-[#0097A7] animate-pulse ml-0.5 shrink-0"
                          aria-hidden="true"
                          title="Đang chuẩn bị xe..."
                        />
                      )}
                      {hasError && (
                        <span
                          className="w-1.5 h-1.5 rounded-full bg-[#E53935] ml-0.5 shrink-0"
                          aria-hidden="true"
                          title="Không thể tải ảnh xe, giữ xe hiện tại"
                        />
                      )}
                    </button>
                  );
                })}
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
              <Armchair className="w-3.5 h-3.5 text-[#0097A7] shrink-0" />
              Chọn chỗ trực quan.
            </span>
            <span>
              <QrCode className="w-3.5 h-3.5 text-[#0097A7] shrink-0" />
              Vé điện tử dễ tra cứu.
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
