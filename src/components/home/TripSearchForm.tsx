import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeftRight, Calendar, MapPin, Users, ChevronDown, ArrowRight } from 'lucide-react';
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
  const todayStr = getVietnamTodayDateStr();

  const [from, setFrom] = useState(initialParams?.from || 'Đà Nẵng');
  const [to, setTo] = useState(initialParams?.to || 'Huế');
  const [date, setDate] = useState(() => {
    if (initialParams?.date && isValidBookingDate(initialParams.date)) {
      return initialParams.date;
    }
    return todayStr;
  });
  const [passengers, setPassengers] = useState(initialParams?.passengers ? Math.min(5, Math.max(1, initialParams.passengers)) : 1);

  const [fromOpen, setFromOpen] = useState(false);
  const [toOpen, setToOpen] = useState(false);
  const [passengersOpen, setPassengersOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSwapping, setIsSwapping] = useState(false);

  const fromContainerRef = useRef<HTMLDivElement>(null);
  const toContainerRef = useRef<HTMLDivElement>(null);
  const passengersContainerRef = useRef<HTMLDivElement>(null);

  // Sync state if initialParams change from parent (e.g. back navigation or URL change)
  const [prevParams, setPrevParams] = useState(initialParams);
  if (initialParams && initialParams !== prevParams) {
    setPrevParams(initialParams);
    if (initialParams.from && initialParams.from !== prevParams?.from) setFrom(initialParams.from);
    if (initialParams.to && initialParams.to !== prevParams?.to) setTo(initialParams.to);
    if (initialParams.date && isValidBookingDate(initialParams.date) && initialParams.date !== prevParams?.date) {
      setDate(initialParams.date);
    }
    if (initialParams.passengers && initialParams.passengers !== prevParams?.passengers) {
      setPassengers(Math.min(5, Math.max(1, initialParams.passengers)));
    }
  }

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

  const handleSwap = () => {
    setIsSwapping(true);
    setTimeout(() => setIsSwapping(false), 300);
    const temp = from;
    setFrom(to);
    setTo(temp);
    setErrorMsg(null);
    onRouteChange?.(to, temp);
  };

  const handleSelectFrom = (selectedCity: string) => {
    let nextTo = to;
    if (selectedCity === to) {
      nextTo = from;
      setTo(nextTo);
    }
    setFrom(selectedCity);
    setFromOpen(false);
    setErrorMsg(null);
    onRouteChange?.(selectedCity, nextTo);
  };

  const handleSelectTo = (selectedCity: string) => {
    let nextFrom = from;
    if (selectedCity === from) {
      nextFrom = to;
      setFrom(nextFrom);
    }
    setTo(selectedCity);
    setToOpen(false);
    setErrorMsg(null);
    onRouteChange?.(nextFrom, selectedCity);
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
      className={`bg-[#FFFEFA] border border-[#E5E3DC] shadow-sm transition-all relative z-30 ${
        isHorizontalBar
          ? 'w-full max-w-full rounded-[18px] p-3.5 sm:p-4 lg:p-4.5'
          : compact
          ? 'max-w-4xl mx-auto rounded-2xl p-5 sm:p-6'
          : 'w-full max-w-[620px] rounded-2xl p-5 sm:p-6'
      }`}
      aria-label="Form tìm kiếm chuyến xe"
    >

      {errorMsg && (
        <div
          role="alert"
          className="mb-3.5 px-3.5 py-2.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center justify-between"
        >
          <span>{errorMsg}</span>
          <button
            type="button"
            onClick={() => setErrorMsg(null)}
            className="font-bold ml-2 text-red-700 hover:text-red-900 focus:outline-hidden"
            aria-label="Đóng thông báo lỗi"
          >
            ×
          </button>
        </div>
      )}

      {/* Grid Layout depending on variant */}
      <div
        className={
          isHorizontalBar
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[1.3fr_auto_1.3fr_1.1fr_1fr_auto] items-end gap-2.5 sm:gap-3'
            : 'flex flex-col gap-3.5'
        }
      >
        {/* ========================================================
            FIELD 1: NƠI ĐI
            ======================================================== */}
        <div ref={fromContainerRef} className="relative min-w-0">
          <label
            htmlFor="search-from"
            className="block text-[11px] font-semibold text-[#647084] uppercase tracking-wider mb-1.5"
          >
            Nơi đi
          </label>
          <div className="relative">
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
              className="w-full h-[52px] sm:h-[54px] flex items-center justify-between px-3 sm:px-3.5 bg-[#F7F4EC]/70 hover:bg-[#F7F4EC] focus:bg-[#FFFEFA] focus:ring-2 focus:ring-[#0097A7] rounded-xl border border-[#E5E3DC] text-left transition-all"
            >
              <div className="flex items-center gap-2 overflow-hidden min-w-0">
                <MapPin className="w-4 h-4 text-[#0097A7] shrink-0" />
                <span className="font-semibold text-[13px] sm:text-sm text-[#102744] truncate">{from}</span>
              </div>
              <ChevronDown className={`w-4 h-4 text-[#647084] shrink-0 transition-transform ${fromOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Options */}
            {fromOpen && (
              <div
                id="search-from-list"
                role="listbox"
                aria-label="Chọn điểm khởi hành"
                className="absolute top-full left-0 z-50 mt-1.5 w-60 bg-[#FFFEFA] border border-[#E5E3DC] rounded-xl shadow-xl py-1.5 max-h-56 overflow-y-auto animate-in fade-in duration-100"
              >
                <div className="px-3.5 py-1.5 text-[11px] font-bold text-[#647084] uppercase bg-[#F7F4EC]">
                  Địa điểm phổ biến
                </div>
                {POPULAR_CITIES.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    role="option"
                    aria-selected={from === c.name}
                    onClick={() => handleSelectFrom(c.name)}
                    className={`w-full text-left px-3.5 py-2.5 text-xs font-medium hover:bg-[#E0F7FA] transition-colors flex justify-between items-center ${
                      from === c.name ? 'text-[#0097A7] font-bold bg-[#E0F7FA]/40' : 'text-[#102744]'
                    }`}
                  >
                    <span className="font-semibold">{c.name}</span>
                    <span className="text-[10px] text-[#647084]">{c.province}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ========================================================
            FIELD 2: NÚT ĐẢO CHIỀU (SWAP)
            ======================================================== */}
        <div className={`flex justify-center ${isHorizontalBar ? 'pb-1' : 'sm:pt-6'}`}>
          <button
            type="button"
            onClick={handleSwap}
            className={`w-11 h-11 sm:h-[52px] sm:w-[46px] rounded-xl bg-[#F7F4EC] hover:bg-[#E0F7FA] text-[#102744] hover:text-[#0097A7] border border-[#E5E3DC] shadow-2xs flex items-center justify-center transition-all duration-300 ${
              isSwapping ? 'rotate-180 scale-105' : 'hover:scale-105'
            }`}
            title="Đổi chiều nơi đi - nơi đến"
            aria-label="Đổi nơi đi và nơi đến"
          >
            <ArrowLeftRight className="w-4 h-4" />
          </button>
        </div>

        {/* ========================================================
            FIELD 3: NƠI ĐẾN
            ======================================================== */}
        <div ref={toContainerRef} className="relative min-w-0">
          <label
            htmlFor="search-to"
            className="block text-[11px] font-semibold text-[#647084] uppercase tracking-wider mb-1.5"
          >
            Nơi đến
          </label>
          <div className="relative">
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
              className="w-full h-[52px] sm:h-[54px] flex items-center justify-between px-3 sm:px-3.5 bg-[#F7F4EC]/70 hover:bg-[#F7F4EC] focus:bg-[#FFFEFA] focus:ring-2 focus:ring-[#0097A7] rounded-xl border border-[#E5E3DC] text-left transition-all"
            >
              <div className="flex items-center gap-2 overflow-hidden min-w-0">
                <MapPin className="w-4 h-4 text-[#F3B54A] shrink-0" />
                <span className="font-semibold text-[13px] sm:text-sm text-[#102744] truncate">{to}</span>
              </div>
              <ChevronDown className={`w-4 h-4 text-[#647084] shrink-0 transition-transform ${toOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Options */}
            {toOpen && (
              <div
                id="search-to-list"
                role="listbox"
                aria-label="Chọn điểm đến"
                className="absolute top-full left-0 sm:left-auto sm:right-0 z-50 mt-1.5 w-60 bg-[#FFFEFA] border border-[#E5E3DC] rounded-xl shadow-xl py-1.5 max-h-56 overflow-y-auto animate-in fade-in duration-100"
              >
                <div className="px-3.5 py-1.5 text-[11px] font-bold text-[#647084] uppercase bg-[#F7F4EC]">
                  Địa điểm phổ biến
                </div>
                {POPULAR_CITIES.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    role="option"
                    aria-selected={to === c.name}
                    onClick={() => handleSelectTo(c.name)}
                    className={`w-full text-left px-3.5 py-2.5 text-xs font-medium hover:bg-[#FEF3D6] transition-colors flex justify-between items-center ${
                      to === c.name ? 'text-[#F3B54A] font-bold bg-[#FEF3D6]/50' : 'text-[#102744]'
                    }`}
                  >
                    <span className="font-semibold">{c.name}</span>
                    <span className="text-[10px] text-[#647084]">{c.province}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ========================================================
            FIELD 4: NGÀY ĐI
            ======================================================== */}
        <div className="min-w-0">
          <label
            htmlFor="search-date"
            className="block text-[11px] font-semibold text-[#647084] uppercase tracking-wider mb-1.5"
          >
            Ngày đi
          </label>
          <div className="relative flex items-center h-[52px] sm:h-[54px] px-3 sm:px-3.5 bg-[#F7F4EC]/70 hover:bg-[#F7F4EC] focus-within:bg-[#FFFEFA] focus-within:ring-2 focus-within:ring-[#0097A7] rounded-xl border border-[#E5E3DC] cursor-pointer transition-all">
            <Calendar className="w-4 h-4 text-[#0097A7] shrink-0 mr-2 sm:mr-2.5 pointer-events-none" />
            <span className="font-semibold text-xs sm:text-sm text-[#102744] select-none whitespace-nowrap">
              {formatVietnamDate(date) || 'Chọn ngày'}
            </span>
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

        {/* ========================================================
            FIELD 5: SỐ HÀNH KHÁCH
            ======================================================== */}
        <div ref={passengersContainerRef} className="relative min-w-0">
          <label
            htmlFor="search-passengers"
            className="block text-[11px] font-semibold text-[#647084] uppercase tracking-wider mb-1.5"
          >
            Số hành khách
          </label>
          <div className="relative">
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
              className="w-full h-[52px] sm:h-[54px] flex items-center justify-between px-3 sm:px-3.5 bg-[#F7F4EC]/70 hover:bg-[#F7F4EC] focus:bg-[#FFFEFA] focus:ring-2 focus:ring-[#0097A7] rounded-xl border border-[#E5E3DC] text-left transition-all"
            >
              <div className="flex items-center gap-1.5 sm:gap-2 overflow-hidden">
                <Users className="w-4 h-4 text-[#0097A7] shrink-0" />
                <span className="font-semibold text-xs sm:text-sm text-[#102744] whitespace-nowrap">
                  {passengers} người
                </span>
              </div>
              <ChevronDown className={`w-4 h-4 text-[#647084] shrink-0 transition-transform ${passengersOpen ? 'rotate-180' : ''}`} />
            </button>

            {passengersOpen && (
              <div
                id="search-passengers-list"
                role="listbox"
                aria-label="Chọn số lượng hành khách"
                className="absolute top-full left-0 z-50 mt-1.5 w-44 bg-[#FFFEFA] border border-[#E5E3DC] rounded-xl shadow-xl py-1 animate-in fade-in duration-100"
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
                    className={`w-full text-left px-3.5 py-2 text-xs font-medium hover:bg-[#E0F7FA] transition-colors flex items-center justify-between ${
                      passengers === num ? 'text-[#0097A7] font-bold bg-[#E0F7FA]/40' : 'text-[#102744]'
                    }`}
                  >
                    <span>{num} người lớn</span>
                    {passengers === num && <span className="text-[#0097A7] font-bold">✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ========================================================
            FIELD 6: NÚT TÌM CHUYẾN (SUBMIT)
            ======================================================== */}
        <div className="min-w-0">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-[52px] sm:h-[54px] px-6 sm:px-8 bg-[#0097A7] hover:bg-[#007887] active:scale-98 text-white font-bold text-sm sm:text-base rounded-xl shadow-md shadow-[#0097A7]/25 flex items-center justify-center gap-2 transition-all cursor-pointer whitespace-nowrap disabled:opacity-60"
          >
            <span>Tìm chuyến</span>
            <ArrowRight className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>
      </div>
    </form>
  );
};
