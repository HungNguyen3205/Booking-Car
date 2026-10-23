import React from 'react';
import { Filter, RotateCcw, Clock, Bus, DollarSign } from 'lucide-react';
import type { VehicleCategory } from '../../types';

export interface FilterState {
  timeSlots: string[]; // 'morning', 'afternoon', 'evening', 'night'
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

  return (
    <aside className="bg-[#FFFEFA] rounded-3xl p-5 sm:p-6 border border-[#E5E3DC] shadow-xs space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#E5E3DC]">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-[#0097A7]" />
          <h3 className="font-bold text-sm text-[#102744]">Bộ lọc chuyến xe</h3>
        </div>
        <button
          type="button"
          onClick={onReset}
          className="text-xs text-[#0097A7] hover:text-[#007887] font-medium flex items-center gap-1 transition-colors"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Đặt lại</span>
        </button>
      </div>

      {/* Khung giờ xuất bến */}
      <div>
        <label className="text-xs font-bold text-[#102744] uppercase tracking-wider block mb-2.5 flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-[#0097A7]" />
          <span>Khung giờ đi</span>
        </label>
        <div className="grid grid-cols-2 gap-2">
          {[
            { id: 'morning', label: 'Sáng (06:00 - 12:00)' },
            { id: 'afternoon', label: 'Trưa (12:00 - 18:00)' },
            { id: 'evening', label: 'Tối (18:00 - 24:00)' },
          ].map((item) => {
            const isChecked = filters.timeSlots.includes(item.id);
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => toggleTimeSlot(item.id)}
                className={`p-2 text-left text-xs rounded-xl border transition-all ${
                  isChecked
                    ? 'bg-[#E0F7FA] border-[#0097A7] text-[#007887] font-semibold'
                    : 'bg-[#F7F4EC] border-[#E5E3DC] text-[#647084] hover:border-[#0097A7]'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Dòng xe */}
      <div>
        <label className="text-xs font-bold text-[#102744] uppercase tracking-wider block mb-2.5 flex items-center gap-1.5">
          <Bus className="w-3.5 h-3.5 text-[#0097A7]" />
          <span>Loại xe</span>
        </label>
        <div className="space-y-2">
          {[
            { id: 'sleeper', label: 'Giường nằm 34 chỗ' },
            { id: 'limousine', label: 'Limousine VIP 16 chỗ' },
            { id: 'cabin', label: 'Cabin Cung Điện VIP' },
          ].map((item) => {
            const isChecked = filters.vehicleCategories.includes(item.id as VehicleCategory);
            return (
              <label
                key={item.id}
                className="flex items-center gap-2.5 text-xs text-[#102744] cursor-pointer select-none"
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => toggleCategory(item.id as VehicleCategory)}
                  className="rounded border-[#CBD5E1] text-[#0097A7] focus:ring-[#0097A7] w-4 h-4 cursor-pointer"
                />
                <span className={isChecked ? 'font-semibold text-[#0097A7]' : ''}>{item.label}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Mức giá tối đa */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <label className="text-xs font-bold text-[#102744] uppercase tracking-wider flex items-center gap-1.5">
            <DollarSign className="w-3.5 h-3.5 text-[#0097A7]" />
            <span>Mức giá tối đa</span>
          </label>
          <span className="text-xs font-bold text-[#0097A7]">
            {new Intl.NumberFormat('vi-VN').format(filters.maxPrice)}đ
          </span>
        </div>
        <input
          type="range"
          min="100000"
          max="400000"
          step="20000"
          value={filters.maxPrice}
          onChange={(e) => onChange({ ...filters, maxPrice: Number(e.target.value) })}
          className="w-full accent-[#0097A7] cursor-pointer"
        />
        <div className="flex justify-between text-[10px] text-[#647084] mt-1">
          <span>100.000đ</span>
          <span>400.000đ</span>
        </div>
      </div>
    </aside>
  );
};
