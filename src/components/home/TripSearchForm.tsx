import React, { useState, useEffect, useRef } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowLeftRight, Calendar, MapPin, Users, ArrowRight } from 'lucide-react';
import { POPULAR_CITIES } from '../../data/mockData';
import type { SearchParams } from '../../types';
import { getVietnamTodayDateStr, isValidBookingDate, formatVietnamDate } from '../../utils/dateUtils';

interface TripSearchFormProps {
  initialParams?: Partial<SearchParams>;
  onSearch: (params: SearchParams) => void;
  onRouteChange?: (from: string, to: string) => void;
  isLoading?: boolean;
  compact?: boolean;
  variant?: 'standard' | 'horizontal-bar' | 'compact';
}

export const TripSearchForm: React.FC<TripSearchFormProps> = ({
  initialParams,
  onSearch,
  onRouteChange,
  isLoading = false,
  compact = false,
  variant = 'standard',
}) => {
  const shouldReduceMotion = useReducedMotion();
  const todayStr = getVietnamTodayDateStr();

  // Atomic route state for from & to (ensures atomic update when swapping)
  const [{ from, to }, setRoute] = useState(() => ({
    from: initialParams?.from || 'Đà Nẵng',
    to: initialParams?.to || 'Huế',
  }));

  const [date, setDate] = useState(() => {
    if (initialParams?.date && isValidBookingDate(initialParams.date)) {
      return initialParams.date;
    }
    return todayStr;
  });
  const [passengers, setPassengers] = useState(
    initialParams?.passengers ? Math.min(5, Math.max(1, initialParams.passengers)) : 1
  );

  const [swapCount, setSwapCount] = useState(0);
  const [isSwapping, setIsSwapping] = useState(false);
  const swapTimeoutRef = useRef<number | null>(null);

  const [fromOpen, setFromOpen] = useState(false);
  const [toOpen, setToOpen] = useState(false);
  const [passengersOpen, setPassengersOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fromContainerRef = useRef<HTMLDivElement>(null);
  const toContainerRef = useRef<HTMLDivElement>(null);
  const passengersContainerRef = useRef<HTMLDivElement>(null);

  // Sync state if initialParams change from parent (e.g. back navigation or URL change)
  const [prevParams, setPrevParams] = useState(initialParams);
  if (initialParams && initialParams !== prevParams) {
    setPrevParams(initialParams);
    if (
      (initialParams.from && initialParams.from !== prevParams?.from) ||
      (initialParams.to && initialParams.to !== prevParams?.to)
    ) {
      setRoute({
        from: initialParams.from || from,
        to: initialParams.to || to,
      });
    }
    if (initialParams.date && isValidBookingDate(initialParams.date) && initialParams.date !== prevParams?.date) {
      setDate(initialParams.date);
    }
    if (initialParams.passengers && initialParams.passengers !== prevParams?.passengers) {
      setPassengers(Math.min(5, Math.max(1, initialParams.passengers)));
    }
  }

  // Cleanup swap timeout on unmount
  useEffect(() => {
    return () => {
      if (swapTimeoutRef.current !== null) {
        window.clearTimeout(swapTimeoutRef.current);
      }
    };
  }, []);

  // Close dropdowns on outside click and Escape key
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (fromContainerRef.current && !fromContainerRef.current.contains(target)) {
        setFromOpen(false);
      }
      if (toContainerRef.current && !toContainerRef.current.contains(target)) {
        setToOpen(false);
      }
      if (passengersContainerRef.current && !passengersContainerRef.current.contains(target)) {
        setPassengersOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setFromOpen(false);
        setToOpen(false);
        setPassengersOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Atomic swap:
  // - Swaps both location IDs in a single atomic state update
  // - Preserves date, passengers, and vehicle
  // - Rotates swap icon 180deg in 280ms
  // Atomic swap handler for Origin and Destination:
  // - Swaps both location IDs atomically in a single state update
  // - Preserves date, passengers, and selected vehicle type
  // - Rotates swap icon 180deg over 280ms (instant on reduced-motion)
  // - Animates text value fade/translateY 5px over 180ms
  // - Preserves interactive button, DOM identity, and keyboard focus
  const handleSwap = () => {
    const nextFrom = to;
    const nextTo = from;

    setRoute({ from: nextFrom, to: nextTo });
    onRouteChange?.(nextFrom, nextTo);

    setErrorMsg(null);
    setSwapCount((c) => c + 1);
    setIsSwapping(true);

    if (swapTimeoutRef.current !== null) {
      window.clearTimeout(swapTimeoutRef.current);
    }
    swapTimeoutRef.current = window.setTimeout(() => {
      setIsSwapping(false);
    }, 280);
  };

  const handleSelectFrom = (selectedCity: string) => {
    let nextTo = to;
    if (selectedCity === to) {
      nextTo = from;
    }
    setRoute({ from: selectedCity, to: nextTo });
    onRouteChange?.(selectedCity, nextTo);
    setFromOpen(false);
    setErrorMsg(null);
  };

  const handleSelectTo = (selectedCity: string) => {
    let nextFrom = from;
    if (selectedCity === from) {
      nextFrom = to;
    }
    setRoute({ from: nextFrom, to: selectedCity });
    onRouteChange?.(nextFrom, selectedCity);
    setToOpen(false);
    setErrorMsg(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!from.trim() || !to.trim()) {
      setErrorMsg('Vui lòng chọn điểm đi và điểm đến');
      return;
    }
    if (from.trim().toLowerCase() === to.trim().toLowerCase()) {
      setErrorMsg('Điểm đi và điểm đến không được trùng nhau');
      return;
    }
    if (!date) {
      setErrorMsg('Vui lòng chọn ngày khởi hành');
      return;
    }
    if (!isValidBookingDate(date)) {
      setErrorMsg('Ngày khởi hành không hợp lệ hoặc ở trong quá khứ');
      return;
    }

    const safePassengers = Math.min(5, Math.max(1, Math.round(Number(passengers)) || 1));
    setErrorMsg(null);
    onSearch({ from, to, date, passengers: safePassengers });
  };

  const isHorizontalBar = variant === 'horizontal-bar';

  return (
    <form
      id="search-form-section"
      onSubmit={handleSubmit}
      className={`bg-[#FFFEFA] border border-[#E5E3DC]/90 shadow-[0_12px_36px_-6px_rgba(16,39,68,0.09),0_4px_12px_-2px_rgba(16,39,68,0.03)] transition-all relative z-30 ${
        isHorizontalBar
          ? 'w-full max-w-full rounded-[20px] p-2 sm:p-2.5 lg:p-3'
          : compact
          ? 'max-w-4xl mx-auto rounded-2xl p-5 sm:p-6'
          : 'w-full max-w-[620px] rounded-2xl p-5 sm:p-6'
      }`}
      aria-label="Form tìm kiếm chuyến xe"
    >
      {/* Decorative Ticket Side Notches */}
      {isHorizontalBar && (
        <>
          <div
            className="hidden sm:block absolute -left-2.5 top-1/2 -translate-y-1/2 w-5 h-5 bg-[#F7F4EC] rounded-full border-r border-[#E5E3DC] pointer-events-none z-10"
            aria-hidden="true"
          />
          <div
            className="hidden sm:block absolute -right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 bg-[#F7F4EC] rounded-full border-l border-[#E5E3DC] pointer-events-none z-10"
            aria-hidden="true"
          />
        </>
      )}

      {errorMsg && (
        <div
          role="alert"
          className="mb-3 px-3.5 py-2 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center justify-between"
        >
          <span>{errorMsg}</span>
          <button
            type="button"
            onClick={() => setErrorMsg(null)}
            className="font-bold ml-2 text-red-700 hover:text-red-900 focus:outline-hidden cursor-pointer"
            aria-label="Đóng thông báo lỗi"
          >
            ×
          </button>
        </div>
      )}

      {/* Grid Layout: Nơi đi / Đảo chiều / Nơi đến / Divider / Ngày đi / Divider / Hành khách / CTA */}
      <div
        className={
          isHorizontalBar
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[1.3fr_auto_1.3fr_auto_1.15fr_auto_1.05fr_auto] items-center gap-1.5 sm:gap-2'
            : 'flex flex-col gap-3.5'
        }
      >
        {/* ========================================================
            FIELD 1: NƠI ĐI
            ======================================================== */}
        <div ref={fromContainerRef} className="relative min-w-0">
          <button
            id="search-from"
            type="button"
            aria-haspopup="listbox"
            aria-expanded={fromOpen}
            aria-controls="search-from-list"
            onClick={() => {
              setFromOpen((prev) => !prev);
              setToOpen(false);
              setPassengersOpen(false);
            }}
            className={`w-full h-[64px] sm:h-[70px] flex flex-col justify-center px-3.5 sm:px-4 rounded-xl hover:bg-[#F7F4EC]/70 focus:bg-[#FFFEFA] focus-visible:ring-2 focus-visible:ring-[#0097A7] text-left transition-all cursor-pointer ${
              !isHorizontalBar ? 'border border-[#E5E3DC] bg-[#F7F4EC]/60' : ''
            }`}
          >
            <span className="block text-[11px] font-semibold text-[#718096] uppercase tracking-wider mb-0.5">
              Nơi đi
            </span>
            <div className="flex items-center gap-2 overflow-hidden min-w-0">
              <MapPin className="w-4 h-4 text-[#0097A7] shrink-0" />
              <div className="relative overflow-hidden min-w-0 flex-1">
                <motion.span
                  key={`${from}-${swapCount}`}
                  initial={shouldReduceMotion ? false : { opacity: 0.25, y: isSwapping ? -5 : 0 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: shouldReduceMotion ? 0 : 0.18, ease: 'easeOut' }}
                  className="font-bold text-[15px] sm:text-[16px] text-[#102744] truncate block"
                >
                  {from}
                </motion.span>
              </div>
            </div>
          </button>

          {/* Dropdown Options */}
          {fromOpen && (
            <div
              id="search-from-list"
              role="listbox"
              aria-label="Chọn điểm khởi hành"
              className="absolute top-[calc(100%+8px)] left-0 z-50 w-64 bg-[#FFFEFA] border border-[#E5E3DC] rounded-2xl shadow-2xl py-2 max-h-60 overflow-y-auto animate-in fade-in duration-100"
            >
              <div className="px-3.5 py-1 text-[11px] font-bold text-[#647084] uppercase bg-[#F7F4EC]">
                Địa điểm phổ biến
              </div>
              {POPULAR_CITIES.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  role="option"
                  aria-selected={from === c.name}
                  onClick={() => handleSelectFrom(c.name)}
                  className={`w-full text-left px-3.5 py-2.5 text-xs font-medium hover:bg-[#E0F7FA] transition-colors flex justify-between items-center cursor-pointer ${
                    from === c.name ? 'text-[#0097A7] font-bold bg-[#E0F7FA]/40' : 'text-[#102744]'
                  }`}
                >
                  <span className="font-semibold text-sm">{c.name}</span>
                  <span className="text-[11px] text-[#647084]">{c.province}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ========================================================
            FIELD 2: NÚT ĐẢO CHIỀU (SWAP)
            ======================================================== */}
        <div className="flex justify-center items-center shrink-0 px-0.5">
          <button
            type="button"
            onClick={handleSwap}
            className="w-8 h-8 rounded-full bg-[#FFFDF8] hover:bg-[#E0F7FA] text-[#102744] hover:text-[#0097A7] border border-[#E5E3DC] hover:border-[#0097A7]/40 shadow-2xs flex items-center justify-center transition-all duration-200 cursor-pointer hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0097A7]"
            title="Đổi chiều nơi đi - nơi đến"
            aria-label="Đổi nơi đi và nơi đến"
          >
            <motion.span
              className="inline-flex items-center justify-center"
              animate={{ rotate: shouldReduceMotion ? 0 : swapCount * 180 }}
              transition={{ duration: shouldReduceMotion ? 0 : 0.28, ease: [0.4, 0, 0.2, 1] }}
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
            </motion.span>
          </button>
        </div>

        {/* ========================================================
            FIELD 3: NƠI ĐẾN
            ======================================================== */}
        <div ref={toContainerRef} className="relative min-w-0">
          <button
            id="search-to"
            type="button"
            aria-haspopup="listbox"
            aria-expanded={toOpen}
            aria-controls="search-to-list"
            onClick={() => {
              setToOpen((prev) => !prev);
              setFromOpen(false);
              setPassengersOpen(false);
            }}
            className={`w-full h-[64px] sm:h-[70px] flex flex-col justify-center px-3.5 sm:px-4 rounded-xl hover:bg-[#F7F4EC]/70 focus:bg-[#FFFEFA] focus-visible:ring-2 focus-visible:ring-[#0097A7] text-left transition-all cursor-pointer ${
              !isHorizontalBar ? 'border border-[#E5E3DC] bg-[#F7F4EC]/60' : ''
            }`}
          >
            <span className="block text-[11px] font-semibold text-[#718096] uppercase tracking-wider mb-0.5">
              Nơi đến
            </span>
            <div className="flex items-center gap-2 overflow-hidden min-w-0">
              <MapPin className="w-4 h-4 text-[#D97706] shrink-0" />
              <div className="relative overflow-hidden min-w-0 flex-1">
                <motion.span
                  key={`${to}-${swapCount}`}
                  initial={shouldReduceMotion ? false : { opacity: 0.25, y: isSwapping ? 5 : 0 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: shouldReduceMotion ? 0 : 0.18, ease: 'easeOut' }}
                  className="font-bold text-[15px] sm:text-[16px] text-[#102744] truncate block"
                >
                  {to}
                </motion.span>
              </div>
            </div>
          </button>

          {/* Dropdown Options */}
          {toOpen && (
            <div
              id="search-to-list"
              role="listbox"
              aria-label="Chọn điểm đến"
              className="absolute top-[calc(100%+8px)] left-0 sm:left-auto sm:right-0 z-50 w-64 bg-[#FFFEFA] border border-[#E5E3DC] rounded-2xl shadow-2xl py-2 max-h-60 overflow-y-auto animate-in fade-in duration-100"
            >
              <div className="px-3.5 py-1 text-[11px] font-bold text-[#647084] uppercase bg-[#F7F4EC]">
                Địa điểm phổ biến
              </div>
              {POPULAR_CITIES.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  role="option"
                  aria-selected={to === c.name}
                  onClick={() => handleSelectTo(c.name)}
                  className={`w-full text-left px-3.5 py-2.5 text-xs font-medium hover:bg-[#FEF3D6] transition-colors flex justify-between items-center cursor-pointer ${
                    to === c.name ? 'text-[#D97706] font-bold bg-[#FEF3D6]/50' : 'text-[#102744]'
                  }`}
                >
                  <span className="font-semibold text-sm">{c.name}</span>
                  <span className="text-[11px] text-[#647084]">{c.province}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Dotted Divider 1 */}
        {isHorizontalBar && (
          <div className="hidden lg:block w-[1px] h-9 border-r border-dashed border-[#D8D4C8] mx-0.5 self-center" aria-hidden="true" />
        )}

        {/* ========================================================
            FIELD 4: NGÀY ĐI
            ======================================================== */}
        <div className="relative min-w-0">
          <div
            className={`w-full h-[64px] sm:h-[70px] flex flex-col justify-center px-3.5 sm:px-4 rounded-xl hover:bg-[#F7F4EC]/70 focus-within:bg-[#FFFEFA] focus-within:ring-2 focus-within:ring-[#0097A7] cursor-pointer transition-all ${
              !isHorizontalBar ? 'border border-[#E5E3DC] bg-[#F7F4EC]/60' : ''
            }`}
          >
            <span className="block text-[11px] font-semibold text-[#718096] uppercase tracking-wider mb-0.5">
              Ngày đi
            </span>
            <div className="flex items-center gap-2 overflow-hidden min-w-0">
              <Calendar className="w-4 h-4 text-[#0097A7] shrink-0 pointer-events-none" />
              <span className="font-bold text-[15px] sm:text-[16px] text-[#102744] select-none whitespace-nowrap">
                {formatVietnamDate(date) || 'Chọn ngày'}
              </span>
            </div>
            <input
              id="search-date"
              type="date"
              min={todayStr}
              value={date}
              onChange={(e) => {
                setDate(e.target.value);
                setErrorMsg(null);
              }}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              aria-label="Chọn ngày khởi hành"
            />
          </div>
        </div>

        {/* Dotted Divider 2 */}
        {isHorizontalBar && (
          <div className="hidden lg:block w-[1px] h-9 border-r border-dashed border-[#D8D4C8] mx-0.5 self-center" aria-hidden="true" />
        )}

        {/* ========================================================
            FIELD 5: SỐ HÀNH KHÁCH
            ======================================================== */}
        <div ref={passengersContainerRef} className="relative min-w-0">
          <button
            id="search-passengers"
            type="button"
            aria-haspopup="listbox"
            aria-expanded={passengersOpen}
            aria-controls="search-passengers-list"
            onClick={() => {
              setPassengersOpen((prev) => !prev);
              setFromOpen(false);
              setToOpen(false);
            }}
            className={`w-full h-[64px] sm:h-[70px] flex flex-col justify-center px-3.5 sm:px-4 rounded-xl hover:bg-[#F7F4EC]/70 focus:bg-[#FFFEFA] focus-visible:ring-2 focus-visible:ring-[#0097A7] text-left transition-all cursor-pointer ${
              !isHorizontalBar ? 'border border-[#E5E3DC] bg-[#F7F4EC]/60' : ''
            }`}
          >
            <span className="block text-[11px] font-semibold text-[#718096] uppercase tracking-wider mb-0.5">
              Hành khách
            </span>
            <div className="flex items-center gap-2 overflow-hidden min-w-0">
              <Users className="w-4 h-4 text-[#0097A7] shrink-0" />
              <span className="font-bold text-[15px] sm:text-[16px] text-[#102744] whitespace-nowrap">
                {passengers} người
              </span>
            </div>
          </button>

          {passengersOpen && (
            <div
              id="search-passengers-list"
              role="listbox"
              aria-label="Chọn số lượng hành khách"
              className="absolute top-[calc(100%+8px)] left-0 z-50 w-48 bg-[#FFFEFA] border border-[#E5E3DC] rounded-2xl shadow-2xl py-1.5 animate-in fade-in duration-100"
            >
              {[1, 2, 3, 4, 5].map((num) => (
                <button
                  key={num}
                  type="button"
                  role="option"
                  aria-selected={passengers === num}
                  onClick={() => {
                    setPassengers(num);
                    setPassengersOpen(false);
                    setErrorMsg(null);
                  }}
                  className={`w-full text-left px-4 py-2.5 text-xs font-medium hover:bg-[#E0F7FA] transition-colors flex items-center justify-between cursor-pointer ${
                    passengers === num ? 'text-[#0097A7] font-bold bg-[#E0F7FA]/40' : 'text-[#102744]'
                  }`}
                >
                  <span className="font-semibold text-sm">{num} người</span>
                  {passengers === num && <span className="text-[#0097A7] font-bold">✓</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ========================================================
            FIELD 6: NÚT TÌM CHUYẾN (SUBMIT CTA)
            ======================================================== */}
        <div className="min-w-0 p-1">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-[54px] sm:h-[58px] px-7 sm:px-8 bg-[#0097A7] hover:bg-[#00838F] active:bg-[#007887] active:scale-[0.98] text-[#FFFEFA] font-bold text-[15px] rounded-xl shadow-md shadow-[#0097A7]/25 flex items-center justify-center gap-2.5 transition-all cursor-pointer whitespace-nowrap disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0097A7] focus-visible:ring-offset-2"
          >
            {isLoading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Đang tìm...</span>
              </>
            ) : (
              <>
                <span>Tìm chuyến</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
};
