import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Armchair, BedDouble, Crown, AlertCircle } from 'lucide-react';
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
        className="flex flex-wrap items-center justify-center gap-2.5"
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
              className={`inline-flex items-center gap-2 h-10 sm:h-11 px-4.5 sm:px-5.5 rounded-full text-xs sm:text-[13px] font-sans font-semibold transition-all duration-200 cursor-pointer select-none outline-none focus-visible:ring-2 focus-visible:ring-[#0097A7] focus-visible:ring-offset-2 ${
                isActive
                  ? 'bg-[#102744] text-[#FFFEFA] shadow-[0_4px_14px_rgba(16,39,68,0.22)] scale-[1.02]'
                  : 'bg-[#FFF9ED] hover:bg-[#FFFEFA] text-[#102744] border border-[#D8D4C9] hover:border-[#102744]/70 hover:shadow-[0_2px_8px_rgba(16,39,68,0.08)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]'
              }`}
            >
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
