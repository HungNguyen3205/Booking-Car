import React from 'react';
import { motion } from 'framer-motion';
import type { Seat } from '../../types';
import { Check, Lock, Ban } from 'lucide-react';

interface SeatButtonProps {
  seat: Seat;
  isSelected: boolean;
  onToggle: (seat: Seat) => void;
  disabled?: boolean;
  orientation?: 'horizontal' | 'vertical';
  onLimitExceeded?: () => void;
}

export const SeatButton: React.FC<SeatButtonProps> = ({
  seat,
  isSelected,
  onToggle,
  disabled = false,
  orientation = 'horizontal',
  onLimitExceeded,
}) => {
  const isBooked = seat.status === 'booked';
  const isUnavailable = seat.status === 'disabled';
  const isSelectable = !isBooked && !isUnavailable;
  const isLimitReached = disabled && !isSelected;

  const handleClick = () => {
    if (!isSelectable) return;
    if (isLimitReached) {
      if (onLimitExceeded) onLimitExceeded();
      return;
    }
    onToggle(seat);
  };

  const statusLabel = isBooked
    ? 'Đã đặt'
    : isUnavailable
    ? 'Không khả dụng'
    : isSelected
    ? 'Đang chọn'
    : isLimitReached
    ? 'Còn trống (Đã đủ số khách)'
    : 'Còn trống';

  // Format currency for title
  const formattedPrice = new Intl.NumberFormat('vi-VN').format(seat.price);

  // Distinct dimensional classes based on vehicle category and orientation
  const isHorizontal = orientation === 'horizontal';

  // Base dimensions and aspect ratios per seat type
  const getDimensionClasses = () => {
    if (seat.type === 'cabin') {
      return isHorizontal
        ? 'w-[74px] sm:w-[86px] h-[52px] sm:h-[58px]'
        : 'w-[64px] sm:w-[74px] h-[70px] sm:h-[78px]';
    }
    if (seat.type === 'sleeper') {
      return isHorizontal
        ? 'w-[64px] sm:w-[76px] h-[46px] sm:h-[50px]'
        : 'w-[52px] sm:w-[58px] h-[68px] sm:h-[74px]';
    }
    // Default Limousine luxury armchair
    return isHorizontal
      ? 'w-[54px] sm:w-[62px] h-[48px] sm:h-[52px]'
      : 'w-[50px] sm:w-[56px] h-[52px] sm:h-[58px]';
  };

  return (
    <motion.button
      type="button"
      whileHover={isSelectable && !isLimitReached ? { scale: 1.04 } : undefined}
      whileTap={isSelectable ? { scale: 0.96 } : undefined}
      disabled={!isSelectable}
      onClick={handleClick}
      aria-pressed={isSelected}
      aria-label={`Ghế ${seat.code}, loại ${seat.type}, ${statusLabel}, giá ${formattedPrice} đồng`}
      title={`Ghế ${seat.code} • ${statusLabel}${isSelectable ? ` • ${formattedPrice} ₫` : ''}`}
      className={`relative ${getDimensionClasses()} rounded-xl flex flex-col justify-between p-1 sm:p-1.5 transition-all text-xs select-none cursor-pointer focus:outline-hidden focus-visible:ring-2 focus-visible:ring-[#0097A7] shrink-0 ${
        isSelected
          ? 'bg-[#0097A7] text-white shadow-md shadow-[#0097A7]/35 ring-2 ring-[#00695C] border border-[#004D40]'
          : isBooked
          ? 'bg-[#1E293B] text-slate-400 cursor-not-allowed border border-slate-700 opacity-90'
          : isUnavailable
          ? 'bg-slate-100 text-slate-400 cursor-not-allowed border-2 border-dashed border-slate-300 opacity-60'
          : isLimitReached
          ? 'bg-[#FFFEFA] text-slate-600 border border-slate-300 hover:border-amber-400 shadow-2xs'
          : 'bg-[#FFFEFA] text-[#102744] border-2 border-[#CBD5E1] hover:border-[#0097A7] hover:shadow-xs shadow-2xs'
      }`}
    >
      {/* ----------------------------------------------------
          TOP ACCENT / HEADREST CONTOUR PER VEHICLE TYPE
          ---------------------------------------------------- */}
      <div className="w-full flex items-center justify-between px-0.5">
        {/* Headrest / Pillow Contour */}
        {seat.type === 'cabin' ? (
          <div className="flex items-center gap-1">
            <span
              className={`h-1.5 w-6 sm:w-8 rounded-full ${
                isSelected
                  ? 'bg-teal-200/80'
                  : isBooked
                  ? 'bg-slate-600'
                  : 'bg-amber-400/80'
              }`}
            />
            <span className="text-[7.5px] uppercase font-bold tracking-widest text-[#0097A7] hidden sm:inline">
              VIP
            </span>
          </div>
        ) : seat.type === 'sleeper' ? (
          <div className="flex items-center gap-1">
            {/* Pillow graphic indicator */}
            <span
              className={`h-1.5 w-6 rounded-full transition-colors ${
                isSelected
                  ? 'bg-teal-200/70'
                  : isBooked
                  ? 'bg-slate-600'
                  : 'bg-sky-200'
              }`}
            />
            <span className="text-[7px] text-[#647084] font-semibold hidden sm:inline">
              Gối
            </span>
          </div>
        ) : (
          /* Limousine armchair headrest */
          <span
            className={`h-1.5 w-6 rounded-full transition-colors ${
              isSelected
                ? 'bg-teal-200/70'
                : isBooked
                ? 'bg-slate-600'
                : 'bg-slate-300'
            }`}
          />
        )}

        {/* Status Badge Icon */}
        {isSelected ? (
          <span className="w-4 h-4 rounded-full bg-white text-[#0097A7] flex items-center justify-center shrink-0 shadow-2xs">
            <Check className="w-3 h-3 stroke-[3]" />
          </span>
        ) : isBooked ? (
          <Lock className="w-3 h-3 text-slate-400 shrink-0" />
        ) : isUnavailable ? (
          <Ban className="w-3 h-3 text-slate-400 shrink-0" />
        ) : null}
      </div>

      {/* ----------------------------------------------------
          CENTER SEAT CODE BADGE
          ---------------------------------------------------- */}
      <div className="w-full text-center my-auto py-0.5">
        <span
          className={`font-mono font-bold tracking-tight text-xs sm:text-[13px] leading-tight block ${
            isSelected
              ? 'text-white'
              : isBooked
              ? 'text-slate-300'
              : 'text-[#102744]'
          }`}
        >
          {seat.code}
        </span>
      </div>

      {/* ----------------------------------------------------
          BOTTOM CUSHION / MATTRESS ACCENT
          ---------------------------------------------------- */}
      <div className="w-full flex items-center justify-between px-0.5 pt-0.5">
        <span
          className={`h-1 rounded-full ${
            isSelected
              ? 'w-full bg-white/50'
              : isBooked
              ? 'w-full bg-slate-700'
              : seat.type === 'cabin'
              ? 'w-full bg-amber-200/80'
              : seat.type === 'sleeper'
              ? 'w-full bg-sky-100'
              : 'w-full bg-slate-200'
          }`}
        />
      </div>
    </motion.button>
  );
};
