import React, { useState, useMemo, useEffect } from 'react';
import { motion, useReducedMotion, AnimatePresence } from 'framer-motion';
import type { SearchParams, Trip } from '../../types';
import { TripTicketCard } from './TripTicketCard';
import { TripFilters, type FilterState, MAX_FILTER_PRICE } from './TripFilters';
import { TripSearchForm } from '../home/TripSearchForm';
import {
  ArrowLeft,
  ArrowRight,
  SlidersHorizontal,
  ArrowUpDown,
  Calendar,
  MapPin,
  Users,
  AlertCircle,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Edit3,
  Info,
  RefreshCw,
} from 'lucide-react';
import {
  formatVietnamDate,
  parseDurationMinutes,
  addDaysToDateStr,
  getVietnamTodayDateStr,
} from '../../utils/dateUtils';

interface TripResultsViewProps {
  searchParams: SearchParams;
  allTrips: Trip[];
  onSelectTrip: (trip: Trip) => void;
  onModifySearch: () => void;
  onUpdateSearch?: (params: SearchParams) => void;
}

export const TripResultsView: React.FC<TripResultsViewProps> = ({
  searchParams,
  allTrips,
  onSelectTrip,
  onModifySearch,
  onUpdateSearch,
}) => {
  const shouldReduceMotion = useReducedMotion();
  const todayStr = getVietnamTodayDateStr();

  // Time slot quick pills: 'all', 'morning', 'afternoon', 'evening'
  const [quickTimeTab, setQuickTimeTab] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'early' | 'late' | 'price-asc' | 'price-desc' | 'duration'>('early');
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [isEditingSearch, setIsEditingSearch] = useState(false);
  const isLoading = false;
  const [simulatedError, setSimulatedError] = useState<string | null>(null);

  // Advanced filters state with 600,000 VND default ceiling to support all trip prices
  const [filters, setFilters] = useState<FilterState>({
    timeSlots: [],
    vehicleCategories: [],
    maxPrice: MAX_FILTER_PRICE,
  });

  const resetFilters = () => {
    setFilters({
      timeSlots: [],
      vehicleCategories: [],
      maxPrice: MAX_FILTER_PRICE,
    });
    setQuickTimeTab('all');
  };

  // Close mobile filter on escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobileFilterOpen(false);
        setIsEditingSearch(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Filter and sort computation
  const filteredTrips = useMemo(() => {
    return allTrips
      .filter((trip) => {
        // Calculate departure time slot
        const hour = parseInt(trip.departureTime.split(':')[0], 10);
        let tripSlot = hour >= 18 ? 'evening' : 'night';
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
        const availability = Number(a.availableSeatsCount === 0) - Number(b.availableSeatsCount === 0);
        if (availability) return availability;
        if (sortBy === 'price-asc') return a.price - b.price;
        if (sortBy === 'price-desc') return b.price - a.price;
        if (sortBy === 'duration') {
          return parseDurationMinutes(a.duration) - parseDurationMinutes(b.duration);
        }
        if (sortBy === 'late') {
          return b.departureTime.localeCompare(a.departureTime);
        }
        // Default: departure time ascending
        return a.departureTime.localeCompare(b.departureTime);
      });
  }, [allTrips, quickTimeTab, filters, sortBy]);

  const hasNoTripsFound = allTrips.length === 0;

  // Day navigation helpers
  const canGoPrevDay = searchParams.date > todayStr;
  const handlePrevDay = () => {
    if (!canGoPrevDay) return;
    const prevDate = addDaysToDateStr(searchParams.date, -1);
    handleNewSearchParams({ ...searchParams, date: prevDate });
  };

  const handleNextDay = () => {
    const nextDate = addDaysToDateStr(searchParams.date, 1);
    handleNewSearchParams({ ...searchParams, date: nextDate });
  };

  const handleNewSearchParams = (newParams: SearchParams) => {
    setSimulatedError(null);
    setIsEditingSearch(false);
    onUpdateSearch?.(newParams);
  };

  const handleRetry = () => {
    setSimulatedError(null);
    onUpdateSearch?.(searchParams);
  };

  // Count active filters for badge
  const activeFiltersCount =
    filters.timeSlots.length +
    filters.vehicleCategories.length +
    (filters.maxPrice < MAX_FILTER_PRICE ? 1 : 0) +
    (quickTimeTab !== 'all' ? 1 : 0);

  return (
    <motion.div
      initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -6 }}
      transition={{ duration: shouldReduceMotion ? 0.04 : 0.25, ease: 'easeOut' }}
      className="min-h-screen bg-[#F7F4EC] pb-16"
    >
      {/* ============================================================
          1. SURFACE SUMMARY BAR (Sticky Below Header)
          Clear route info, adjacent day switcher, and inline edit toggle
          ============================================================ */}
      <div className="bg-[#FFFEFA] border-b border-[#E5E3DC] shadow-2xs py-3 sm:py-3.5 sticky top-16 sm:top-[68px] z-30">
        <div className="max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Left: Origin -> Destination, Date & Passenger Count */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-[#102744]">
              {/* Back to Home Button */}
              <button
                type="button"
                onClick={onModifySearch}
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#647084] hover:text-[#2B4294] transition-colors p-1 -ml-1 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#2B4294] rounded-md"
                title="Quay lại trang chủ"
                aria-label="Quay lại trang chủ"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Trang chủ</span>
              </button>

              <span className="text-[#CBD5E1] hidden sm:inline">•</span>

              {/* Origin -> Destination Pill */}
              <div className="flex items-center gap-1.5 font-bold text-sm sm:text-base text-[#102744]">
                <MapPin className="w-4 h-4 text-[#2B4294] shrink-0" />
                <span>{searchParams.from}</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#2B4294] shrink-0" />
                <span>{searchParams.to}</span>
              </div>

              <span className="text-[#CBD5E1] hidden sm:inline">•</span>

              {/* Travel Date */}
              <div className="flex items-center gap-1.5 text-[#475569] font-medium text-xs sm:text-sm">
                <Calendar className="w-3.5 h-3.5 text-[#2B4294] shrink-0" />
                <span>{formatVietnamDate(searchParams.date)}</span>
              </div>

              <span className="text-[#CBD5E1] hidden sm:inline">•</span>

              {/* Passengers Count */}
              <div className="flex items-center gap-1.5 text-[#475569] font-medium text-xs sm:text-sm">
                <Users className="w-3.5 h-3.5 text-[#2B4294] shrink-0" />
                <span>{searchParams.passengers} hành khách</span>
              </div>
            </div>

            {/* Right: Quick Day Switcher & Modify Search Button */}
            <div className="flex items-center gap-2">
              {/* Adjacent Day Switcher */}
              <div className="flex items-center bg-[#F7F4EC] rounded-xl p-0.5 border border-[#E5E3DC]">
                <button
                  type="button"
                  onClick={handlePrevDay}
                  disabled={!canGoPrevDay || isLoading}
                  className="px-2 py-1 text-xs font-medium text-[#102744] hover:text-[#2B4294] disabled:opacity-35 disabled:hover:text-[#102744] transition-colors flex items-center gap-0.5 cursor-pointer disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-[#2B4294] rounded-lg"
                  title="Xem ngày hôm trước"
                  aria-label="Xem ngày hôm trước"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Hôm trước</span>
                </button>
                <div className="w-[1px] h-3.5 bg-[#CBD5E1]" />
                <button
                  type="button"
                  onClick={handleNextDay}
                  disabled={isLoading}
                  className="px-2 py-1 text-xs font-medium text-[#102744] hover:text-[#2B4294] disabled:opacity-35 transition-colors flex items-center gap-0.5 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#2B4294] rounded-lg"
                  title="Xem ngày hôm sau"
                  aria-label="Xem ngày hôm sau"
                >
                  <span className="hidden md:inline">Hôm sau</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Inline Search Modifier Toggle */}
              <button
                type="button"
                onClick={() => setIsEditingSearch(!isEditingSearch)}
                className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-[#2B4294] ${
                  isEditingSearch
                    ? 'bg-[#102744] text-white border-[#102744]'
                    : 'text-[#2B4294] hover:text-[#1E2F6B] hover:bg-[#EBF4FC] border-[#2B4294]/40 bg-[#FFFEFA]'
                }`}
                aria-expanded={isEditingSearch}
                aria-controls="inline-search-editor"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>{isEditingSearch ? 'Đóng form' : 'Sửa tìm kiếm'}</span>
              </button>
            </div>
          </div>

          {/* ============================================================
              INLINE SEARCH MODIFIER PANEL (Smooth Expandable Drawer)
              Allows modifying route/date/passengers without page switch
              ============================================================ */}
          <AnimatePresence>
            {isEditingSearch && (
              <motion.div
                id="inline-search-editor"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: shouldReduceMotion ? 0 : 0.22, ease: 'easeInOut' }}
                className="overflow-visible pt-4 mt-3 border-t border-[#E5E3DC]/80"
              >
                <div className="bg-[#F7F4EC] p-3 sm:p-4 rounded-2xl border border-[#E5E3DC]">
                  <div className="flex items-center justify-between mb-2 px-1">
                    <span className="text-xs font-bold text-[#102744] uppercase tracking-wider">
                      Cập nhật thông tin chuyến xe
                    </span>
                    <span className="text-[11px] text-[#647084]">
                      Giữ nguyên dữ liệu không liên quan
                    </span>
                  </div>
                  <TripSearchForm
                    variant="horizontal-bar"
                    initialParams={searchParams}
                    onSearch={(newParams) => {
                      handleNewSearchParams(newParams);
                    }}
                    isLoading={isLoading}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ============================================================
          TRANSPARENT MOCK DATA NOTICE (Requirement 9)
          ============================================================ */}
      <div className="max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-8 mt-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E0F2F1]/80 text-[#004D40] border border-[#80CBC4]/60 text-[11px] font-medium">
          <Info className="w-3.5 h-3.5 text-[#00897B] shrink-0" />
          <span>
            <strong>Bản trải nghiệm:</strong> Lịch trình và thanh toán mô phỏng.
          </span>
        </div>
      </div>

      {/* ============================================================
          MAIN RESULTS WORKSPACE (Desktop 2-Column or Mobile Stack)
          Sidebar 240px | Gap 24px | Tickets List
          ============================================================ */}
      <div className="max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-8 mt-5">
        {/* Error State with Retry Button */}
        {simulatedError ? (
          <div className="max-w-xl mx-auto bg-[#FFFEFA] rounded-2xl p-8 border border-red-200 text-center shadow-2xs mt-4">
            <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-4 border border-red-200">
              <AlertCircle className="w-7 h-7" />
            </div>
            <h2 className="font-sans font-bold text-xl text-[#102744]">
              Không thể tải danh sách chuyến xe
            </h2>
            <p className="text-xs text-[#647084] max-w-sm mx-auto leading-relaxed mt-2 mb-5">
              {simulatedError}
            </p>
            <button
              type="button"
              onClick={handleRetry}
              className="px-5 py-2.5 bg-[#2B4294] text-white text-xs font-semibold rounded-xl hover:bg-[#1E2F6B] transition-all shadow-xs flex items-center justify-center gap-2 mx-auto cursor-pointer focus-visible:outline-2 focus-visible:outline-[#2B4294]"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Thử lại</span>
            </button>
          </div>
        ) : isLoading ? (
          /* ============================================================
              LOADING STATE: Shimmer Skeleton Cards
              ============================================================ */
          <div className="flex flex-col lg:flex-row gap-6 items-start">
            <div className="hidden lg:block w-[240px] shrink-0">
              <div className="bg-[#FFFEFA] rounded-2xl p-5 border border-[#E5E3DC] h-72 animate-pulse" />
            </div>
            <div className="flex-1 min-w-0 space-y-3">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className="bg-[#FFFEFA] rounded-2xl border border-[#E5E3DC] h-32 animate-pulse p-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-24 h-16 bg-[#F0ECE1] rounded-xl" />
                    <div className="space-y-2">
                      <div className="w-32 h-4 bg-[#F0ECE1] rounded" />
                      <div className="w-48 h-3 bg-[#F0ECE1] rounded" />
                    </div>
                  </div>
                  <div className="w-28 h-8 bg-[#F0ECE1] rounded-xl" />
                </div>
              ))}
            </div>
          </div>
        ) : hasNoTripsFound ? (
          /* ============================================================
              EMPTY STATE: No trips exist on this route & date (Requirement 6)
              No made-up trips, no fallback to different cities
              ============================================================ */
          <div className="max-w-xl mx-auto bg-[#FFFEFA] rounded-2xl p-8 border border-[#E5E3DC] text-center shadow-2xs mt-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4 border border-amber-200">
              <AlertCircle className="w-7 h-7" />
            </div>

            <h2 className="font-sans font-bold text-xl text-[#102744]">
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

            <p className="text-xs text-[#647084] max-w-sm mx-auto leading-relaxed mb-6">
              Hệ thống DANAVA GO hiện chưa có lịch trình xe khách cho chặng đường này vào ngày đã chọn. Tuyệt đối không tự động chuyển hướng sang tuyến khác để đảm bảo sự minh bạch.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={handleNextDay}
                className="px-4 py-2 bg-[#2B4294] text-white text-xs font-semibold rounded-xl hover:bg-[#1E2F6B] transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#2B4294]"
              >
                <span>Xem ngày hôm sau</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => setIsEditingSearch(true)}
                className="px-4 py-2 bg-[#F7F4EC] text-[#102744] hover:bg-[#E5E3DC] text-xs font-semibold rounded-xl border border-[#D8D4C9] transition-all flex items-center justify-center gap-1.5 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#102744]"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Đổi tuyến hoặc ngày</span>
              </button>
            </div>
          </div>
        ) : (
          /* ============================================================
              RESULTS LIST WITH FILTERS & REAL SORTING
              ============================================================ */
          <div className="flex flex-col lg:flex-row gap-6 items-start">
            {/* Desktop Filter Sidebar (240px, Sticky) */}
            <div className="hidden lg:block w-[240px] shrink-0 sticky top-36">
              <TripFilters filters={filters} onChange={setFilters} onReset={resetFilters} />
            </div>

            {/* Results Column (Remainder) */}
            <div className="flex-1 min-w-0">
              {/* Header row: Title + Count + Time tabs + Sort */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 mb-3 border-b border-[#E5E3DC]">
                {/* Title and trip count */}
                <div className="flex items-baseline gap-2">
                  <h2 className="font-sans text-lg sm:text-xl font-bold text-[#102744]">
                    Chọn chuyến phù hợp
                  </h2>
                  <span className="text-xs text-[#647084] font-medium">
                    ({filteredTrips.length} chuyến tìm thấy)
                  </span>
                </div>

                {/* Controls: Time slot pills & Sort */}
                <div className="flex items-center gap-2.5">
                  {/* Quick time slots pills */}
                  <div className="hidden sm:flex items-center gap-1 bg-[#FFFEFA] p-0.5 rounded-xl border border-[#E5E3DC]">
                    {[
                      { id: 'all', label: 'Tất cả' },
                      { id: 'night', label: 'Rạng sáng' },
                      { id: 'morning', label: 'Sáng' },
                      { id: 'afternoon', label: 'Chiều' },
                      { id: 'evening', label: 'Tối' },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setQuickTimeTab(tab.id)}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-[#2B4294] ${
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
                    <ArrowUpDown className="w-3.5 h-3.5 text-[#2B4294] shrink-0" />
                    <span className="text-[#647084] hidden md:inline">Sắp xếp:</span>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className="bg-transparent font-semibold text-[#102744] focus:outline-hidden cursor-pointer text-xs"
                      aria-label="Sắp xếp danh sách chuyến xe"
                    >
                      <option value="early">Giờ đi sớm nhất</option>
                      <option value="late">Giờ đi muộn nhất</option>
                      <option value="price-asc">Giá thấp nhất</option>
                      <option value="price-desc">Giá cao nhất</option>
                      <option value="duration">Thời gian nhanh nhất</option>
                    </select>
                  </div>

                  {/* Mobile filter button with active count badge */}
                  <button
                    type="button"
                    onClick={() => setMobileFilterOpen(true)}
                    className="lg:hidden inline-flex items-center gap-1.5 bg-[#FFFEFA] hover:bg-[#EBF4FC] px-3 py-1.5 rounded-xl border border-[#E5E3DC] text-xs font-semibold text-[#102744] cursor-pointer focus-visible:outline-2 focus-visible:outline-[#2B4294]"
                    aria-label="Mở bộ lọc chuyến xe"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5 text-[#2B4294]" />
                    <span>Bộ lọc</span>
                    {activeFiltersCount > 0 && (
                      <span className="w-4 h-4 rounded-full bg-[#2B4294] text-white text-[10px] flex items-center justify-center font-bold">
                        {activeFiltersCount}
                      </span>
                    )}
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
                  <h3 className="font-sans font-bold text-base text-[#102744]">
                    Không có chuyến nào khớp bộ lọc
                  </h3>
                  <p className="text-xs text-[#647084] mt-1.5 mb-5">
                    Thử bỏ chọn một số điều kiện hoặc mở rộng khoảng giá để xem thêm chuyến xe.
                  </p>
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="px-4 py-2 bg-[#2B4294] text-white text-xs font-semibold rounded-xl hover:bg-[#1E2F6B] transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-[#2B4294]"
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
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex justify-end lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Bộ lọc chuyến xe di động"
        >
          <div className="w-full max-w-sm bg-[#FFFEFA] h-full overflow-y-auto p-5 shadow-2xl animate-in slide-in-from-right duration-200 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#E5E3DC]">
                <h3 className="font-sans font-bold text-base text-[#102744]">Bộ lọc chuyến xe</h3>
                <button
                  type="button"
                  onClick={() => setMobileFilterOpen(false)}
                  className="text-xs font-bold text-[#647084] hover:text-[#102744] p-1.5 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#2B4294] rounded-md"
                  aria-label="Đóng bảng lọc"
                >
                  ✕ Đóng
                </button>
              </div>
              <TripFilters
                filters={filters}
                onChange={setFilters}
                onReset={resetFilters}
              />
            </div>

            <div className="mt-5 pt-3 border-t border-[#E5E3DC]">
              <button
                type="button"
                onClick={() => setMobileFilterOpen(false)}
                className="w-full py-2.5 bg-[#2B4294] text-white font-semibold text-xs rounded-xl shadow-xs cursor-pointer focus-visible:outline-2 focus-visible:outline-[#2B4294]"
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
