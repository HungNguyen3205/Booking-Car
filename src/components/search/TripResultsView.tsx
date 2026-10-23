import React, { useState, useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import type { SearchParams, Trip } from '../../types';
import { TripTicketCard } from './TripTicketCard';
import { TripFilters, type FilterState } from './TripFilters';
import { ArrowLeft, ArrowRight, SlidersHorizontal, ArrowUpDown, Calendar, MapPin, Users, AlertCircle, RotateCcw } from 'lucide-react';
import { formatVietnamDate, parseDurationMinutes } from '../../utils/dateUtils';

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
  const shouldReduceMotion = useReducedMotion();

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
        // Calculate departure time slot
        const hour = parseInt(trip.departureTime.split(':')[0], 10);
        let tripSlot = 'evening';
        if (hour >= 6 && hour < 12) tripSlot = 'morning';
        else if (hour >= 12 && hour < 18) tripSlot = 'afternoon';

        // 1. Quick time tab
        if (quickTimeTab !== 'all' && tripSlot !== quickTimeTab) return false;

        // 2. Sidebar timeSlots checkboxes
        if (filters.timeSlots.length > 0 && !filters.timeSlots.includes(tripSlot)) return false;

        // 3. Vehicle category
        if (filters.vehicleCategories.length > 0) {
          if (!filters.vehicleCategories.includes(trip.vehicle.category)) return false;
        }

        // 4. Max price
        if (trip.price > filters.maxPrice) return false;

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'price-asc') return a.price - b.price;
        if (sortBy === 'duration') {
          return parseDurationMinutes(a.duration) - parseDurationMinutes(b.duration);
        }
        // Default: departure time
        return a.departureTime.localeCompare(b.departureTime);
      });
  }, [allTrips, quickTimeTab, filters, sortBy]);

  const hasNoTripsFound = allTrips.length === 0;

  return (
    <motion.div
      initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -6 }}
      transition={{ duration: shouldReduceMotion ? 0.04 : 0.25, ease: 'easeOut' }}
      className="min-h-screen bg-[#F7F4EC] pb-16"
    >
      {/* ============================================================
          2. THANH TÓM TẮT TÌM KIẾM (SURFACE SUMMARY BAR)
          Clean horizontal surface bar right below header:
          Origin -> Destination, Date, Passengers & Modify Search button
          ============================================================ */}
      <div className="bg-[#FFFEFA] border-b border-[#E5E3DC] shadow-2xs py-3 sm:py-3.5">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap items-center justify-between gap-3">
          {/* Route details pill group */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-[#102744]">
            {/* Origin -> Destination */}
            <div className="flex items-center gap-1.5 font-bold text-sm sm:text-base text-[#102744]">
              <MapPin className="w-4 h-4 text-[#0097A7] shrink-0" />
              <span>{searchParams.from}</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#0097A7] shrink-0" />
              <span>{searchParams.to}</span>
            </div>

            <span className="text-[#CBD5E1] hidden sm:inline">•</span>

            {/* Travel Date */}
            <div className="flex items-center gap-1.5 text-[#475569] font-medium text-xs sm:text-sm">
              <Calendar className="w-3.5 h-3.5 text-[#0097A7] shrink-0" />
              <span>{formatVietnamDate(searchParams.date)}</span>
            </div>

            <span className="text-[#CBD5E1] hidden sm:inline">•</span>

            {/* Passengers count */}
            <div className="flex items-center gap-1.5 text-[#475569] font-medium text-xs sm:text-sm">
              <Users className="w-3.5 h-3.5 text-[#0097A7] shrink-0" />
              <span>{searchParams.passengers} hành khách</span>
            </div>
          </div>

          {/* Modify Search Action Button */}
          <button
            type="button"
            onClick={onModifySearch}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0097A7] hover:text-[#007887] hover:bg-[#E0F7FA] px-3.5 py-1.5 rounded-full border border-[#0097A7]/30 transition-all cursor-pointer active:scale-95"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Sửa tìm kiếm</span>
          </button>
        </div>
      </div>

      {/* ============================================================
          3. BỐ CỤC CHÍNH DESKTOP (1180-1280px Container)
          Sidebar 220-250px | Gap 24px | Results List remainder
          ============================================================ */}
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 mt-5">
        {hasNoTripsFound ? (
          /* ============================================================
             EMPTY STATE: No trips exist on this route & date
             ============================================================ */
          <div className="max-w-xl mx-auto bg-[#FFFEFA] rounded-2xl p-8 border border-[#E5E3DC] text-center shadow-2xs mt-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4 border border-amber-200">
              <AlertCircle className="w-7 h-7" />
            </div>

            <h2 className="font-serif font-bold text-xl text-[#102744]">
              Chưa có chuyến xe cho tuyến đường này
            </h2>

            <div className="my-4 p-3 bg-[#F7F4EC] rounded-xl border border-[#E5E3DC] text-xs text-[#334155] inline-flex flex-wrap justify-center items-center gap-2">
              <span className="font-bold text-[#102744]">
                {searchParams.from} → {searchParams.to}
              </span>
              <span className="text-[#94A3B8]">•</span>
              <span>Ngày {formatVietnamDate(searchParams.date)}</span>
              <span className="text-[#94A3B8]">•</span>
              <span>{searchParams.passengers} hành khách</span>
            </div>

            <p className="text-xs text-[#647084] max-w-sm mx-auto leading-relaxed mb-5">
              Hệ thống hiện chưa có lịch trình khai thác tuyến đường này vào ngày đã chọn.
            </p>

            <button
              type="button"
              onClick={onModifySearch}
              className="px-5 py-2.5 bg-[#0097A7] text-white text-xs font-semibold rounded-xl hover:bg-[#007887] transition-all shadow-xs flex items-center justify-center gap-2 mx-auto cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Thay đổi tuyến hoặc ngày</span>
            </button>
          </div>
        ) : (
          /* ============================================================
             TWO-COLUMN WORKSPACE: 240px Sidebar + Flexible List
             ============================================================ */
          <div className="flex flex-col lg:flex-row gap-6 items-start">
            {/* Desktop Filter Sidebar (240px) */}
            <div className="hidden lg:block w-[240px] shrink-0 sticky top-20">
              <TripFilters filters={filters} onChange={setFilters} onReset={resetFilters} />
            </div>

            {/* Results Column (remainder) */}
            <div className="flex-1 min-w-0">
              {/* Header row: Title + Count + Time tabs + Sort */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 mb-3 border-b border-[#E5E3DC]">
                {/* Title and trip count */}
                <div className="flex items-baseline gap-2">
                  <h2 className="font-serif text-lg sm:text-xl font-bold text-[#102744]">
                    Chọn chuyến phù hợp
                  </h2>
                  <span className="text-xs text-[#647084] font-medium">
                    ({filteredTrips.length} chuyến)
                  </span>
                </div>

                {/* Controls: Time slot pills & Sort */}
                <div className="flex items-center gap-2.5">
                  {/* Quick time slots pills */}
                  <div className="hidden sm:flex items-center gap-1 bg-[#FFFEFA] p-0.5 rounded-xl border border-[#E5E3DC]">
                    {[
                      { id: 'all', label: 'Tất cả' },
                      { id: 'morning', label: 'Sáng' },
                      { id: 'afternoon', label: 'Chiều' },
                      { id: 'evening', label: 'Tối' },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setQuickTimeTab(tab.id)}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                          quickTimeTab === tab.id
                            ? 'bg-[#102744] text-white shadow-2xs'
                            : 'text-[#647084] hover:text-[#102744] hover:bg-[#F7F4EC]'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* Sắp xếp dropdown */}
                  <div className="flex items-center gap-1.5 bg-[#FFFEFA] px-3 py-1.5 rounded-xl border border-[#E5E3DC] text-xs shadow-2xs">
                    <ArrowUpDown className="w-3.5 h-3.5 text-[#0097A7] shrink-0" />
                    <span className="text-[#647084] hidden md:inline">Sắp xếp:</span>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className="bg-transparent font-semibold text-[#102744] focus:outline-hidden cursor-pointer text-xs"
                    >
                      <option value="early">Giờ đi sớm nhất</option>
                      <option value="price-asc">Giá thấp nhất</option>
                      <option value="duration">Thời gian nhanh nhất</option>
                    </select>
                  </div>

                  {/* Mobile filter button */}
                  <button
                    type="button"
                    onClick={() => setMobileFilterOpen(true)}
                    className="lg:hidden inline-flex items-center gap-1.5 bg-[#FFFEFA] hover:bg-[#E0F7FA] px-3 py-1.5 rounded-xl border border-[#E5E3DC] text-xs font-semibold text-[#102744] cursor-pointer"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5 text-[#0097A7]" />
                    <span>Bộ lọc</span>
                  </button>
                </div>
              </div>

              {/* List of Trip Ticket Cards (12px vertical spacing) */}
              {filteredTrips.length === 0 ? (
                /* No trips match active filter */
                <div className="bg-[#FFFEFA] rounded-2xl p-8 border border-[#E5E3DC] text-center max-w-md mx-auto shadow-2xs mt-4">
                  <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center mx-auto mb-3">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                  <h3 className="font-serif font-bold text-base text-[#102744]">
                    Không có chuyến nào khớp bộ lọc
                  </h3>
                  <p className="text-xs text-[#647084] mt-1.5 mb-5">
                    Thử bỏ chọn một số điều kiện hoặc khoảng giá để xem thêm chuyến xe.
                  </p>
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="px-4 py-2 bg-[#0097A7] text-white text-xs font-semibold rounded-xl hover:bg-[#007887] transition-colors cursor-pointer"
                  >
                    Xóa toàn bộ bộ lọc
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredTrips.map((trip) => (
                    <TripTicketCard
                      key={trip.id}
                      trip={trip}
                      onSelectTrip={onSelectTrip}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ============================================================
          MOBILE FILTER DRAWER / MODAL
          ============================================================ */}
      {mobileFilterOpen && !hasNoTripsFound && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex justify-end lg:hidden">
          <div className="w-full max-w-sm bg-[#FFFEFA] h-full overflow-y-auto p-5 shadow-2xl animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#E5E3DC]">
              <h3 className="font-serif font-bold text-base text-[#102744]">Bộ lọc chuyến xe</h3>
              <button
                type="button"
                onClick={() => setMobileFilterOpen(false)}
                className="text-xs font-bold text-[#647084] hover:text-[#102744] p-1 cursor-pointer"
              >
                ✕ Đóng
              </button>
            </div>
            <TripFilters
              filters={filters}
              onChange={setFilters}
              onReset={resetFilters}
            />
            <div className="mt-5">
              <button
                type="button"
                onClick={() => setMobileFilterOpen(false)}
                className="w-full py-2.5 bg-[#0097A7] text-white font-semibold text-xs rounded-xl shadow-xs cursor-pointer"
              >
                Xem kết quả ({filteredTrips.length} chuyến)
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};
