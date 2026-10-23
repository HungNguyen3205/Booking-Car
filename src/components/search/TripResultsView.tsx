import React, { useState, useMemo } from 'react';
import type { SearchParams, Trip } from '../../types';
import { TripTicketCard } from './TripTicketCard';
import { TripFilters, type FilterState } from './TripFilters';
import { ArrowLeft, SlidersHorizontal, ArrowUpDown, Calendar, MapPin, AlertCircle } from 'lucide-react';

interface TripResultsViewProps {
  searchParams: SearchParams;
  allTrips: Trip[];
  onSelectTrip: (trip: Trip) => void;
  onModifySearch: () => void;
}

export const TripResultsView: React.FC<TripResultsViewProps> = ({
  searchParams,
  allTrips,
  onSelectTrip,
  onModifySearch,
}) => {
  // Time tab pill: 'all', 'morning', 'afternoon', 'evening'
  const [quickTimeTab, setQuickTimeTab] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'early' | 'price-asc' | 'duration'>('early');
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Advanced filters state
  const [filters, setFilters] = useState<FilterState>({
    timeSlots: [],
    vehicleCategories: [],
    maxPrice: 400000,
  });

  const resetFilters = () => {
    setFilters({
      timeSlots: [],
      vehicleCategories: [],
      maxPrice: 400000,
    });
    setQuickTimeTab('all');
  };

  // Filter and sort computation
  const filteredTrips = useMemo(() => {
    return allTrips
      .filter((trip) => {
        // Quick time tab
        const hour = parseInt(trip.departureTime.split(':')[0], 10);
        if (quickTimeTab === 'morning' && (hour < 6 || hour >= 12)) return false;
        if (quickTimeTab === 'afternoon' && (hour < 12 || hour >= 18)) return false;
        if (quickTimeTab === 'evening' && (hour < 18 || hour >= 24)) return false;

        // Vehicle category
        if (filters.vehicleCategories.length > 0) {
          if (!filters.vehicleCategories.includes(trip.vehicle.category)) return false;
        }

        // Max price
        if (trip.price > filters.maxPrice) return false;

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'price-asc') return a.price - b.price;
        if (sortBy === 'duration') return a.duration.localeCompare(b.duration);
        // Default: departure time
        return a.departureTime.localeCompare(b.departureTime);
      });
  }, [allTrips, quickTimeTab, filters, sortBy]);

  return (
    <div className="min-h-screen bg-[#F7F4EC] pb-16">
      {/* Route Header Banner matching Panel 02 sketch */}
      <div className="bg-[#FFFEFA] border-b border-[#E5E3DC] pt-6 pb-6 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Top navigation row */}
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={onModifySearch}
              className="inline-flex items-center gap-2 text-xs font-semibold text-[#102744] hover:text-[#0097A7] transition-colors bg-[#F7F4EC] px-3 py-1.5 rounded-full border border-[#E5E3DC]"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Sửa tìm kiếm</span>
            </button>

            <span className="text-xs text-[#647084]">
              Tìm thấy <strong className="text-[#0097A7]">{filteredTrips.length}</strong> chuyến phù hợp
            </span>
          </div>

          {/* Headline and search details */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#102744]">
                Chọn chuyến đi phù hợp
              </h1>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm text-[#647084] mt-1">
                <span className="font-semibold text-[#102744] flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-[#0097A7]" />
                  {searchParams.from} → {searchParams.to}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-[#0097A7]" />
                  {searchParams.date}
                </span>
                <span>•</span>
                <span>{searchParams.passengers} hành khách</span>
              </div>
            </div>

            {/* Illustrative mini route path from sketch */}
            <div className="hidden lg:flex items-center gap-3 bg-[#F7F4EC] px-4 py-2 rounded-2xl border border-[#E5E3DC]">
              <span className="text-xs font-bold text-[#0097A7]">{searchParams.from}</span>
              <div className="w-24 h-1 bg-[#0097A7]/30 relative rounded-full overflow-hidden">
                <div className="w-8 h-full bg-[#0097A7] rounded-full animate-[shimmer_1.5s_infinite]" />
              </div>
              <span className="text-xs font-bold text-[#F3B54A]">{searchParams.to}</span>
            </div>
          </div>

          {/* Quick Filter Tabs & Sort Row (like Panel 02) */}
          <div className="mt-6 pt-4 border-t border-[#E5E3DC] flex flex-wrap items-center justify-between gap-3">
            {/* Quick time slots */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              {[
                { id: 'all', label: 'Tất cả chuyến' },
                { id: 'morning', label: 'Sáng (06h - 12h)' },
                { id: 'afternoon', label: 'Trưa (12h - 18h)' },
                { id: 'evening', label: 'Tối (18h - 24h)' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setQuickTimeTab(tab.id)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                    quickTimeTab === tab.id
                      ? 'bg-[#102744] text-white shadow-xs font-semibold'
                      : 'bg-[#F7F4EC] text-[#647084] hover:text-[#102744] hover:bg-[#E5E3DC]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Sắp xếp & Nút lọc mobile */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 bg-[#F7F4EC] px-3 py-1.5 rounded-xl border border-[#E5E3DC] text-xs">
                <ArrowUpDown className="w-3.5 h-3.5 text-[#0097A7]" />
                <span className="text-[#647084] hidden sm:inline">Sắp xếp:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-transparent font-semibold text-[#102744] focus:outline-hidden cursor-pointer"
                >
                  <option value="early">Giờ đi sớm nhất</option>
                  <option value="price-asc">Giá thấp nhất</option>
                  <option value="duration">Thời gian nhanh nhất</option>
                </select>
              </div>

              {/* Mobile Filter Trigger */}
              <button
                type="button"
                onClick={() => setMobileFilterOpen(true)}
                className="lg:hidden flex items-center gap-1.5 bg-[#F7F4EC] hover:bg-[#E0F7FA] px-3 py-1.5 rounded-xl border border-[#E5E3DC] text-xs font-semibold text-[#102744]"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-[#0097A7]" />
                <span>Bộ lọc</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Desktop Filter Sidebar (~25% / 3 cols) */}
          <div className="hidden lg:block lg:col-span-3 sticky top-24">
            <TripFilters filters={filters} onChange={setFilters} onReset={resetFilters} />
          </div>

          {/* Trips List (~75% / 9 cols) */}
          <div className="lg:col-span-9 space-y-4">
            {filteredTrips.length === 0 ? (
              <div className="bg-[#FFFEFA] rounded-3xl p-10 border border-[#E5E3DC] text-center max-w-lg mx-auto">
                <div className="w-14 h-14 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-7 h-7" />
                </div>
                <h3 className="font-serif font-bold text-lg text-[#102744]">
                  Không tìm thấy chuyến xe phù hợp
                </h3>
                <p className="text-xs sm:text-sm text-[#647084] mt-2 mb-6">
                  Bạn có thể thử đặt lại bộ lọc hoặc thay đổi ngày khởi hành để xem thêm các chuyến xe khác.
                </p>
                <button
                  type="button"
                  onClick={resetFilters}
                  className="px-5 py-2.5 bg-[#0097A7] text-white text-xs font-semibold rounded-xl hover:bg-[#007887] transition-colors"
                >
                  Xóa toàn bộ bộ lọc
                </button>
              </div>
            ) : (
              filteredTrips.map((trip) => (
                <TripTicketCard
                  key={trip.id}
                  trip={trip}
                  onSelectTrip={onSelectTrip}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Mobile Drawer Filter Modal */}
      {mobileFilterOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex justify-end lg:hidden">
          <div className="w-full max-w-sm bg-[#FFFEFA] h-full overflow-y-auto p-6 shadow-2xl animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#E5E3DC]">
              <h3 className="font-serif font-bold text-lg text-[#102744]">Bộ lọc nâng cao</h3>
              <button
                type="button"
                onClick={() => setMobileFilterOpen(false)}
                className="text-xs font-bold text-[#647084] hover:text-[#102744] p-1"
              >
                ✕ Đóng
              </button>
            </div>
            <TripFilters
              filters={filters}
              onChange={setFilters}
              onReset={resetFilters}
            />
            <div className="mt-6">
              <button
                type="button"
                onClick={() => setMobileFilterOpen(false)}
                className="w-full py-3 bg-[#0097A7] text-white font-semibold text-sm rounded-xl"
              >
                Áp dụng bộ lọc
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
