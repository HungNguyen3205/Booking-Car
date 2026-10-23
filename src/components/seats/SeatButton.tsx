import React from 'react';
import { motion } from 'framer-motion';
import type { Seat } from '../../types';

interface SeatButtonProps {
  seat: Seat;
  isSelected: boolean;
  onToggle: (seat: Seat) => void;
  disabled?: boolean;
}

export const SeatButton: React.FC<SeatButtonProps> = ({
  seat,
  isSelected,
  onToggle,
  disabled = false,
}) => {
  const isBooked = seat.status === 'booked';
  const isDisabled = isBooked || (disabled && !isSelected);

  return (
    <motion.button
      type="button"
      whileHover={!isDisabled ? { scale: 1.08 } : undefined}
      whileTap={!isDisabled ? { scale: 0.94 } : undefined}
      disabled={isDisabled}
      onClick={() => onToggle(seat)}
      className={`relative w-11 h-13 sm:w-12 sm:h-14 rounded-xl flex flex-col items-center justify-between p-1.5 transition-colors text-xs select-none ${
        isSelected
          ? 'bg-[#0097A7] text-white shadow-md shadow-[#0097A7]/30 ring-2 ring-[#007887]'
          : isBooked
          ? 'bg-[#102744] text-slate-400 cursor-not-allowed opacity-85'
          : 'bg-[#FFFEFA] text-[#102744] border-2 border-[#CBD5E1] hover:border-[#0097A7] shadow-2xs'
      }`}
      title={
        isBooked
          ? `Ghế ${seat.code} (Đã được đặt)`
          : isSelected
          ? `Ghế ${seat.code} (Đang chọn - Bấm để bỏ chọn)`
          : `Ghế ${seat.code} (${new Intl.NumberFormat('vi-VN').format(seat.price)}đ - Bấm để chọn)`
      }
      aria-pressed={isSelected}
      aria-label={`Ghế ${seat.code}, ${isBooked ? 'Đã đặt' : isSelected ? 'Đang chọn' : 'Còn trống'}`}
    >
      {/* Headrest detail */}
      <span
        className={`w-7 h-2 rounded-t-sm ${
          isSelected
            ? 'bg-teal-300/40'
            : isBooked
            ? 'bg-slate-700'
            : 'bg-[#E2E8F0]'
        }`}
      />

      {/* Seat Code text */}
      <span className="font-bold tracking-tight text-[11px] sm:text-xs">
        {seat.code}
      </span>

      {/* Seat bottom cushion indicator */}
      <span
        className={`w-5 h-1 rounded-full ${
          isSelected
            ? 'bg-white/60'
            : isBooked
            ? 'bg-slate-600'
            : 'bg-[#CBD5E1]'
        }`}
      />
    </motion.button>
  );
};
