import React, { useState } from 'react';
import { Filter, RotateCcw, Clock, Bus, DollarSign, ChevronDown, ChevronUp } from 'lucide-react';
import type { VehicleCategory } from '../../types';
import { bookingService } from '../../services/bookingService';

export const MAX_FILTER_PRICE = 600000;

export interface FilterState {
  timeSlots: string[]; // 'morning', 'afternoon', 'evening'
  vehicleCategories: VehicleCategory[];
  maxPrice: number;
}

interface TripFiltersProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  onReset: () => void;
}

export const TripFilters: React.FC<TripFiltersProps> = ({
  filters,
  onChange,
  onReset,
}) => {
  const [openTime, setOpenTime] = useState(true);
  const [openVehicle, setOpenVehicle] = useState(true);
  const [openPrice, setOpenPrice] = useState(true);

  const toggleTimeSlot = (slot: string) => {
    const next = filters.timeSlots.includes(slot)
      ? filters.timeSlots.filter((s) => s !== slot)
      : [...filters.timeSlots, slot];
    onChange({ ...filters, timeSlots: next });
  };

  const toggleCategory = (cat: VehicleCategory) => {
    const next = filters.vehicleCategories.includes(cat)
      ? filters.vehicleCategories.filter((c) => c !== cat)
      : [...filters.vehicleCategories, cat];
    onChange({ ...filters, vehicleCategories: next });
  };

  const hasActiveFilters =
    filters.timeSlots.length > 0 ||
    filters.vehicleCategories.length > 0 ||
    filters.maxPrice < MAX_FILTER_PRICE;

  return (
    <aside
      className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E2DDD0] shadow-xs space-y-4 relative overflow-hidden"
      aria-label="Bộ lọc chuyến xe"
    >
      {/* Top Brand Accent Line */}
      <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#2B4294] via-[#0284C7] to-[#F5AE1B]" />

      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#E2DDD0] pt-1">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#EBF4FC] text-[#2B4294] flex items-center justify-center border border-[#2B4294]/20">
            <Filter className="w-3.5 h-3.5" />
          </div>
          <h3 className="font-extrabold text-sm text-[#102744]">Bộ lọc</h3>
        </div>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onReset}
            className="text-xs text-[#EE3132] hover:text-[#DC2626] bg-rose-50 hover:bg-rose-100 font-bold flex items-center gap-1 transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-[#EE3132] rounded-lg px-2 py-1 border border-rose-200/60 shadow-2xs"
            aria-label="Xóa tất cả bộ lọc đang chọn"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Xóa lọc</span>
          </button>
        )}
      </div>

      {/* Group 1: Giờ khởi hành */}
      <div className="border-b border-[#E2DDD0]/80 pb-3.5">
        <button
          type="button"
          onClick={() => setOpenTime(!openTime)}
          aria-expanded={openTime}
          className="w-full flex items-center justify-between text-xs font-extrabold text-[#102744] uppercase tracking-wider py-1 cursor-pointer select-none focus-visible:outline-2 focus-visible:outline-[#2B4294] rounded-md"
        >
          <span className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-[#2B4294]" />
            <span>Giờ khởi hành</span>
          </span>
          {openTime ? <ChevronUp className="w-3.5 h-3.5 text-[#647084]" /> : <ChevronDown className="w-3.5 h-3.5 text-[#647084]" />}
        </button>

        {openTime && (
          <div className="space-y-1 mt-2.5">
            {[
              { id: 'night', label: 'Rạng sáng (00:00 - 06:00)', dot: 'bg-indigo-400' },
              { id: 'morning', label: 'Sáng (06:00 - 12:00)', dot: 'bg-amber-400' },
              { id: 'afternoon', label: 'Chiều (12:00 - 18:00)', dot: 'bg-orange-400' },
              { id: 'evening', label: 'Tối (18:00 - 24:00)', dot: 'bg-blue-600' },
            ].map((item) => {
              const isChecked = filters.timeSlots.includes(item.id);
              return (
                <label
                  key={item.id}
                  className={`flex items-center gap-2.5 text-xs rounded-xl px-2 py-1.5 cursor-pointer select-none transition-all ${
                    isChecked
                      ? 'bg-[#EBF4FC]/70 text-[#1E3A8A] font-bold border border-[#2B4294]/20'
                      : 'text-[#334155] hover:bg-[#F8FAFC] hover:text-[#102744]'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleTimeSlot(item.id)}
                    className="rounded border-[#CBD5E1] text-[#2B4294] focus:ring-[#2B4294] w-4 h-4 cursor-pointer accent-[#2B4294] focus-visible:outline-2 focus-visible:outline-[#2B4294]"
                  />
                  <span className={`w-1.5 h-1.5 rounded-full ${item.dot} shrink-0`} />
                  <span className={isChecked ? 'font-bold text-[#1E3A8A]' : 'text-[#334155]'}>
                    {item.label}
                  </span>
                </label>
              );
            })}
          </div>
        )}
      </div>

      {/* Group 2: Loại xe */}
      <div className="border-b border-[#E2DDD0]/80 pb-3.5">
        <button
          type="button"
          onClick={() => setOpenVehicle(!openVehicle)}
          aria-expanded={openVehicle}
          className="w-full flex items-center justify-between text-xs font-extrabold text-[#102744] uppercase tracking-wider py-1 cursor-pointer select-none focus-visible:outline-2 focus-visible:outline-[#2B4294] rounded-md"
        >
          <span className="flex items-center gap-1.5">
            <Bus className="w-3.5 h-3.5 text-[#2B4294]" />
            <span>Loại xe</span>
          </span>
          {openVehicle ? <ChevronUp className="w-3.5 h-3.5 text-[#647084]" /> : <ChevronDown className="w-3.5 h-3.5 text-[#647084]" />}
        </button>

        {openVehicle && (
          <div className="space-y-1.5 mt-2.5">
            {[
              { id: 'sleeper', label: 'Giường nằm', badge: 'bg-emerald-50 text-emerald-800 border-emerald-300' },
              { id: 'limousine', label: 'Limousine VIP', badge: 'bg-blue-50 text-blue-800 border-blue-300' },
              { id: 'cabin', label: 'Cabin VIP', badge: 'bg-amber-50 text-amber-800 border-amber-300' },
            ].map((item) => {
              const isChecked = filters.vehicleCategories.includes(item.id as VehicleCategory);
              return (
                <label
                  key={item.id}
                  className={`flex items-center justify-between gap-2 text-xs rounded-xl px-2.5 py-1.5 cursor-pointer select-none transition-all ${
                    isChecked
                      ? 'bg-[#EBF4FC]/70 border border-[#2B4294]/25'
                      : 'hover:bg-[#F8FAFC]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleCategory(item.id as VehicleCategory)}
                      className="rounded border-[#CBD5E1] text-[#2B4294] focus:ring-[#2B4294] w-4 h-4 cursor-pointer accent-[#2B4294] focus-visible:outline-2 focus-visible:outline-[#2B4294]"
                    />
                    <span className={isChecked ? 'font-bold text-[#1E3A8A]' : 'text-[#334155]'}>
                      {item.label}
                    </span>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${item.badge}`}>
                    {item.id === 'cabin' ? 'VIP' : item.id === 'limousine' ? 'PRO' : 'ECO'}
                  </span>
                </label>
              );
            })}
          </div>
        )}
      </div>

      {/* Group 3: Khoảng giá */}
      <div>
        <button
          type="button"
          onClick={() => setOpenPrice(!openPrice)}
          aria-expanded={openPrice}
          className="w-full flex items-center justify-between text-xs font-extrabold text-[#102744] uppercase tracking-wider py-1 cursor-pointer select-none focus-visible:outline-2 focus-visible:outline-[#2B4294] rounded-md"
        >
          <span className="flex items-center gap-1.5">
            <DollarSign className="w-3.5 h-3.5 text-[#2B4294]" />
            <span>Khoảng giá</span>
          </span>
          {openPrice ? <ChevronUp className="w-3.5 h-3.5 text-[#647084]" /> : <ChevronDown className="w-3.5 h-3.5 text-[#647084]" />}
        </button>

        {openPrice && (
          <div className="mt-2.5 space-y-2.5">
            <div className="flex justify-between items-center text-xs">
              <span className="text-[#647084] font-medium">Tối đa:</span>
              <span className="font-extrabold text-[#EE3132] bg-red-50 border border-red-200 px-2 py-0.5 rounded-lg">
                {bookingService.formatCurrency(filters.maxPrice)}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max={MAX_FILTER_PRICE}
              step="25000"
              value={filters.maxPrice}
              onChange={(e) => onChange({ ...filters, maxPrice: Number(e.target.value) })}
              className="w-full accent-[#2B4294] cursor-pointer focus-visible:outline-2 focus-visible:outline-[#2B4294]"
              aria-label="Điều chỉnh mức giá tối đa"
            />
            <div className="flex justify-between text-[11px] font-semibold text-[#647084]">
              <span>0 đ</span>
              <span className="text-[#2B4294]">{bookingService.formatCurrency(MAX_FILTER_PRICE)}</span>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
