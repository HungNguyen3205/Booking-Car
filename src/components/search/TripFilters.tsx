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
      className="bg-[#FFFEFA] rounded-2xl p-4 sm:p-5 border border-[#E5E3DC] shadow-2xs space-y-4"
      aria-label="Bộ lọc chuyến xe"
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#E5E3DC]">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-[#2B4294]" />
          <h3 className="font-bold text-sm text-[#102744]">Bộ lọc</h3>
        </div>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onReset}
            className="text-xs text-[#2B4294] hover:text-[#1E2F6B] font-semibold flex items-center gap-1 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-[#2B4294] rounded-md px-1 py-0.5"
            aria-label="Xóa tất cả bộ lọc đang chọn"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Xóa lọc</span>
          </button>
        )}
      </div>

      {/* Group 1: Giờ khởi hành */}
      <div className="border-b border-[#E5E3DC]/70 pb-3.5">
        <button
          type="button"
          onClick={() => setOpenTime(!openTime)}
          aria-expanded={openTime}
          className="w-full flex items-center justify-between text-xs font-bold text-[#102744] uppercase tracking-wider py-1 cursor-pointer select-none focus-visible:outline-2 focus-visible:outline-[#2B4294] rounded-md"
        >
          <span className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-[#2B4294]" />
            <span>Giờ khởi hành</span>
          </span>
          {openTime ? <ChevronUp className="w-3.5 h-3.5 text-[#647084]" /> : <ChevronDown className="w-3.5 h-3.5 text-[#647084]" />}
        </button>

        {openTime && (
          <div className="space-y-1.5 mt-2.5">
            {[
              { id: 'night', label: 'Rạng sáng (00:00 - 06:00)' },
              { id: 'morning', label: 'Sáng (06:00 - 12:00)' },
              { id: 'afternoon', label: 'Chiều (12:00 - 18:00)' },
              { id: 'evening', label: 'Tối (18:00 - 24:00)' },
            ].map((item) => {
              const isChecked = filters.timeSlots.includes(item.id);
              return (
                <label
                  key={item.id}
                  className="flex items-center gap-2.5 text-xs text-[#102744] hover:text-[#2B4294] cursor-pointer py-1 select-none"
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleTimeSlot(item.id)}
                    className="rounded border-[#CBD5E1] text-[#2B4294] focus:ring-[#2B4294] w-4 h-4 cursor-pointer accent-[#2B4294] focus-visible:outline-2 focus-visible:outline-[#2B4294]"
                  />
                  <span className={isChecked ? 'font-semibold text-[#2B4294]' : 'text-[#334155]'}>
                    {item.label}
                  </span>
                </label>
              );
            })}
          </div>
        )}
      </div>

      {/* Group 2: Loại xe */}
      <div className="border-b border-[#E5E3DC]/70 pb-3.5">
        <button
          type="button"
          onClick={() => setOpenVehicle(!openVehicle)}
          aria-expanded={openVehicle}
          className="w-full flex items-center justify-between text-xs font-bold text-[#102744] uppercase tracking-wider py-1 cursor-pointer select-none focus-visible:outline-2 focus-visible:outline-[#2B4294] rounded-md"
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
              { id: 'sleeper', label: 'Giường nằm' },
              { id: 'limousine', label: 'Limousine VIP' },
              { id: 'cabin', label: 'Cabin VIP' },
            ].map((item) => {
              const isChecked = filters.vehicleCategories.includes(item.id as VehicleCategory);
              return (
                <label
                  key={item.id}
                  className="flex items-center gap-2.5 text-xs text-[#102744] hover:text-[#2B4294] cursor-pointer py-1 select-none"
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleCategory(item.id as VehicleCategory)}
                    className="rounded border-[#CBD5E1] text-[#2B4294] focus:ring-[#2B4294] w-4 h-4 cursor-pointer accent-[#2B4294] focus-visible:outline-2 focus-visible:outline-[#2B4294]"
                  />
                  <span className={isChecked ? 'font-semibold text-[#2B4294]' : 'text-[#334155]'}>
                    {item.label}
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
          className="w-full flex items-center justify-between text-xs font-bold text-[#102744] uppercase tracking-wider py-1 cursor-pointer select-none focus-visible:outline-2 focus-visible:outline-[#2B4294] rounded-md"
        >
          <span className="flex items-center gap-1.5">
            <DollarSign className="w-3.5 h-3.5 text-[#2B4294]" />
            <span>Khoảng giá</span>
          </span>
          {openPrice ? <ChevronUp className="w-3.5 h-3.5 text-[#647084]" /> : <ChevronDown className="w-3.5 h-3.5 text-[#647084]" />}
        </button>

        {openPrice && (
          <div className="mt-2.5 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-[#647084]">Tối đa:</span>
              <span className="font-bold text-[#2B4294]">
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
            <div className="flex justify-between text-[10px] text-[#647084]">
              <span>0 đ</span>
              <span>{bookingService.formatCurrency(MAX_FILTER_PRICE)}</span>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
