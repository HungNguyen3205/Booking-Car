import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Armchair, BedDouble, Crown, AlertCircle } from 'lucide-react';
import { useJourneyReducedMotion } from './useJourneyReducedMotion';
import type { VehicleCategory } from '../../types';

interface HeroVehicleSelectorProps {
  selectedVehicle: VehicleCategory;
  onSelectVehicle: (category: VehicleCategory) => void;
  toast?: { text: string; id: number } | null;
  onCloseToast?: () => void;
}

export const HeroVehicleSelector: React.FC<HeroVehicleSelectorProps> = ({
  selectedVehicle,
  onSelectVehicle,
  toast,
  onCloseToast,
}) => {
  const reduced = useJourneyReducedMotion();
  const vehicleOptions: { id: VehicleCategory; label: string; icon: React.ReactNode }[] = [
    { id: 'sleeper', label: 'Giường nằm', icon: <BedDouble size={16} /> },
    { id: 'limousine', label: 'Limousine', icon: <Armchair size={16} /> },
    { id: 'cabin', label: 'Cabin VIP', icon: <Crown size={16} /> },
  ];

  const handleSelect = (category: VehicleCategory) => {
    // Bấm lại xe đang chọn không chạy lại animation
    if (category === selectedVehicle) return;
    onSelectVehicle(category);
  };

  return (
    <div className="flex flex-col items-center gap-2.5 w-full">
      {/* Nút chọn loại xe */}
      <div
        className="go-vehicle-segments"
        role="group"
        aria-label="Chọn dòng xe trải nghiệm"
      >
        {vehicleOptions.map((v) => {
          const isActive = selectedVehicle === v.id;
          return (
            <button
              key={v.id}
              type="button"
              aria-pressed={isActive}
              onClick={() => handleSelect(v.id)}
              className="go-vehicle-option"
            >
              {isActive && (
                <motion.span
                  className="go-vehicle-active"
                  layoutId="hero-vehicle-active"
                  transition={{ duration: reduced ? 0 : 0.22, ease: 'easeOut' }}
                  aria-hidden="true"
                />
              )}
              {v.icon}
              <span>{v.label}</span>
            </button>
          );
        })}
      </div>

      {/* Thông báo trạng thái nhẹ */}
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="flex items-center justify-between gap-3 mt-1.5 px-3.5 py-2.5 rounded-xl text-xs font-medium font-sans bg-[#FFF8E1] text-[#6D4C41] border border-[#FFE082] shadow-sm max-w-[480px] pointer-events-auto"
            role="status"
            aria-live="polite"
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-[#F57C00] shrink-0" />
              <span>{toast.text}</span>
            </div>
            {onCloseToast && (
              <button
                type="button"
                onClick={onCloseToast}
                className="text-[#8D6E63] hover:text-[#3E2723] text-sm font-bold px-1.5 py-0.5 rounded hover:bg-[#FFE082]/40 transition-colors cursor-pointer"
                aria-label="Đóng thông báo"
              >
                ✕
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
