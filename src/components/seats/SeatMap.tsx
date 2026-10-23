import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Trip, Seat } from '../../types';
import { SeatButton } from './SeatButton';
import { Sparkles } from 'lucide-react';

interface SeatMapProps {
  trip: Trip;
  selectedSeatCodes: string[];
  maxSelectable: number;
  onToggleSeat: (seat: Seat) => void;
}

export const SeatMap: React.FC<SeatMapProps> = ({
  trip,
  selectedSeatCodes,
  maxSelectable,
  onToggleSeat,
}) => {
  const [activeFloor, setActiveFloor] = useState<1 | 2>(1);
  const [roofRevealed, setRoofRevealed] = useState(false);

  // Trigger roof fade reveal after initial mount
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setRoofRevealed(true);
    }, 450);
    return () => clearTimeout(timer);
  }, []);

  // Filter seats by active floor
  const floorSeats = trip.seats.filter((s) => s.floor === activeFloor);

  // Group seats by rows
  const rowNumbers = Array.from(new Set(floorSeats.map((s) => s.row))).sort((a, b) => a - b);

  return (
    <div className="bg-[#FFFEFA] rounded-3xl p-5 sm:p-7 border border-[#E5E3DC] shadow-xs">
      {/* Floor Switcher (if multi-floor) */}
      {trip.vehicle.floors === 2 && (
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="bg-[#F7F4EC] p-1.5 rounded-2xl border border-[#E5E3DC] flex gap-2">
            <button
              type="button"
              onClick={() => setActiveFloor(1)}
              className={`px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                activeFloor === 1
                  ? 'bg-[#102744] text-white shadow-xs'
                  : 'text-[#647084] hover:text-[#102744]'
              }`}
            >
              Tầng 1 (Tầng dưới)
            </button>
            <button
              type="button"
              onClick={() => setActiveFloor(2)}
              className={`px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                activeFloor === 2
                  ? 'bg-[#102744] text-white shadow-xs'
                  : 'text-[#647084] hover:text-[#102744]'
              }`}
            >
              Tầng 2 (Tầng trên)
            </button>
          </div>
        </div>
      )}

      {/* Bus Top-Down Enclosure Container */}
      <div className="relative mx-auto max-w-2xl bg-[#0F172A] p-4 sm:p-6 rounded-3xl sm:rounded-[36px] shadow-2xl border-4 border-[#334155] overflow-hidden">
        {/* Roof Reveal Fade Animation Layer (450-650ms) */}
        <AnimatePresence>
          {!roofRevealed && (
            <motion.div
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.55, ease: 'easeInOut' }}
              className="absolute inset-0 z-30 bg-[#102744] flex flex-col items-center justify-center text-white p-6"
            >
              <div className="w-12 h-12 rounded-full bg-[#0097A7]/20 text-[#0097A7] flex items-center justify-center mb-3 animate-pulse">
                <Sparkles className="w-6 h-6" />
              </div>
              <p className="font-serif font-bold text-base">Đang mở sơ đồ ghế ngồi…</p>
              <p className="text-xs text-slate-300 mt-1">Góc nhìn chuẩn từ trên nóc xe</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bus Cabin Header: Steering Wheel & Front Windshield */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-700/80 text-slate-400 text-xs px-2">
          {/* Driver Cockpit */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-slate-800 border-2 border-slate-600 flex items-center justify-center text-slate-300 shadow-inner" title="Vị trí Bác tài">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 3v18M3 12h18M6.5 6.5l11 11M6.5 17.5l11-11" />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-slate-200 text-xs">Vị trí Tài xế</span>
              <span className="text-[10px] text-teal-400">Đầu xe / Cửa lên</span>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[11px] font-semibold text-slate-300">
              {trip.vehicle.name}
            </span>
            <span className="block text-[10px] text-slate-400">
              {activeFloor === 1 ? 'Sơ đồ Tầng dưới' : 'Sơ đồ Tầng trên'}
            </span>
          </div>
        </div>

        {/* Seats Grid: Longitudinal Bus Layout with Central Aisle */}
        <div className="py-2 overflow-x-auto">
          <div className="min-w-[280px] flex flex-col gap-3">
            {rowNumbers.map((rowNum) => {
              const rowSeats = floorSeats.filter((s) => s.row === rowNum);
              return (
                <div key={rowNum} className="flex items-center justify-between gap-3 px-2">
                  {/* Left Column Seat(s) */}
                  <div className="flex gap-2">
                    {rowSeats.slice(0, 1).map((seat) => (
                      <SeatButton
                        key={seat.id}
                        seat={seat}
                        isSelected={selectedSeatCodes.includes(seat.code)}
                        onToggle={onToggleSeat}
                        disabled={selectedSeatCodes.length >= maxSelectable}
                      />
                    ))}
                  </div>

                  {/* Center Aisle indicator */}
                  <div className="flex-1 flex items-center justify-center px-2">
                    <span className="text-[10px] tracking-wider text-slate-500 uppercase font-medium">
                      Lối đi
                    </span>
                  </div>

                  {/* Right Column Seat(s) */}
                  <div className="flex gap-2">
                    {rowSeats.slice(1).map((seat) => (
                      <SeatButton
                        key={seat.id}
                        seat={seat}
                        isSelected={selectedSeatCodes.includes(seat.code)}
                        onToggle={onToggleSeat}
                        disabled={selectedSeatCodes.length >= maxSelectable}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Rear of Bus / Engine compartment indicator */}
        <div className="mt-4 pt-3 border-t border-slate-700/80 flex justify-between items-center text-[10px] text-slate-400 px-2">
          <span>Khu vực Đuôi xe</span>
          <span className="text-teal-400">Điều hòa mát lạnh toàn khoang</span>
        </div>
      </div>

      {/* Legend at bottom as required in spec */}
      <div className="mt-6 pt-4 border-t border-[#E5E3DC] flex flex-wrap items-center justify-center gap-6 text-xs text-[#102744]">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-lg bg-[#FFFEFA] border-2 border-[#CBD5E1]" />
          <span>Còn trống</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-lg bg-[#0097A7] border-2 border-[#007887]" />
          <span className="font-semibold text-[#0097A7]">Đang chọn</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-lg bg-[#102744]" />
          <span className="text-[#647084]">Đã đặt</span>
        </div>
      </div>
    </div>
  );
};
