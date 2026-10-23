import React, { useState } from 'react';
import { ArrowLeftRight, Calendar, MapPin, Search, Users, ChevronDown } from 'lucide-react';
import { POPULAR_CITIES } from '../../data/mockData';
import type { SearchParams } from '../../types';

interface TripSearchFormProps {
  initialParams?: Partial<SearchParams>;
  onSearch: (params: SearchParams) => void;
  onRouteChange?: (from: string, to: string) => void;
  isLoading?: boolean;
  compact?: boolean;
}

export const TripSearchForm: React.FC<TripSearchFormProps> = ({
  initialParams,
  onSearch,
  onRouteChange,
  isLoading = false,
  compact = false,
}) => {
  const [from, setFrom] = useState(initialParams?.from || 'Đà Nẵng');
  const [to, setTo] = useState(initialParams?.to || 'Huế');
  const [date, setDate] = useState(initialParams?.date || '2026-10-28');
  const [passengers, setPassengers] = useState(initialParams?.passengers || 1);

  const [fromOpen, setFromOpen] = useState(false);
  const [toOpen, setToOpen] = useState(false);
  const [passengersOpen, setPassengersOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSwapping, setIsSwapping] = useState(false);

  // Sync with incoming props if changed by URL restoration or featured routes
  React.useEffect(() => {
    if (initialParams?.from && initialParams.from !== from) setFrom(initialParams.from);
    if (initialParams?.to && initialParams.to !== to) setTo(initialParams.to);
    if (initialParams?.date && initialParams.date !== date) setDate(initialParams.date);
    if (initialParams?.passengers && initialParams.passengers !== passengers) setPassengers(initialParams.passengers);
  }, [initialParams?.from, initialParams?.to, initialParams?.date, initialParams?.passengers]);

  const todayStr = new Date().toISOString().split('T')[0];

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
    setErrorMsg(null);
    onSearch({ from, to, date, passengers });
  };

  const formatDateDisplay = (isoStr: string) => {
    if (!isoStr) return 'Chọn ngày';
    const parts = isoStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return isoStr;
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={`bg-[#FFFEFA] rounded-[22px] border border-[#E5E3DC] shadow-lg shadow-black/5 p-5 sm:p-6 transition-all relative z-30 ${
        compact ? 'max-w-4xl mx-auto' : 'w-full max-w-[620px]'
      }`}
      aria-label="Form tìm kiếm chuyến xe"
    >
      {errorMsg && (
        <div className="mb-4 px-3.5 py-2.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center justify-between">
          <span>{errorMsg}</span>
          <button type="button" onClick={() => setErrorMsg(null)} className="font-bold ml-2">×</button>
        </div>
      )}

      <div className="flex flex-col gap-3.5">
        {/* ROW 1: [Nơi đi] [Nút đảo chiều] [Nơi đến] */}
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] items-center gap-2.5">
          {/* Nơi đi */}
          <div className="relative min-w-0">
            <label htmlFor="search-from" className="block text-[11px] font-semibold text-[#647084] uppercase tracking-wider mb-1.5">
              Nơi đi
            </label>
            <div className="relative">
              <button
                id="search-from"
                type="button"
                onClick={() => {
                  setFromOpen(!fromOpen);
                  setToOpen(false);
                  setPassengersOpen(false);
                }}
                className="w-full h-[52px] flex items-center justify-between px-3.5 bg-[#F7F4EC]/70 hover:bg-[#F7F4EC] focus:bg-[#FFFEFA] focus:ring-2 focus:ring-[#0097A7] rounded-xl border border-[#E5E3DC] text-left transition-all"
              >
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <MapPin className="w-4 h-4 text-[#0097A7] shrink-0" />
                  <span className="font-semibold text-sm text-[#102744] truncate">{from}</span>
                </div>
                <ChevronDown className="w-4 h-4 text-[#647084] shrink-0" />
              </button>

              {/* Dropdown Options */}
              {fromOpen && (
                <div className="absolute top-full left-0 z-50 mt-1.5 w-60 bg-[#FFFEFA] border border-[#E5E3DC] rounded-xl shadow-xl py-1.5 max-h-56 overflow-y-auto animate-in fade-in duration-100">
                  <div className="px-3.5 py-1.5 text-[11px] font-bold text-[#647084] uppercase bg-[#F7F4EC]">
                    Địa điểm phổ biến
                  </div>
                  {POPULAR_CITIES.map((c) => (
                    <button
                      key={c.id}
                      type="button"
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

          {/* Swap Button (40-44px centered) */}
          <div className="flex justify-center sm:pt-6">
            <button
              type="button"
              onClick={handleSwap}
              className={`w-11 h-11 rounded-full bg-[#F7F4EC] hover:bg-[#E0F7FA] text-[#102744] hover:text-[#0097A7] border border-[#E5E3DC] shadow-2xs flex items-center justify-center transition-all duration-300 ${
                isSwapping ? 'rotate-180 scale-105' : 'hover:scale-105'
              }`}
              title="Đổi chiều nơi đi - nơi đến"
              aria-label="Đổi nơi đi và nơi đến"
            >
              <ArrowLeftRight className="w-4 h-4" />
            </button>
          </div>

          {/* Nơi đến */}
          <div className="relative min-w-0">
            <label htmlFor="search-to" className="block text-[11px] font-semibold text-[#647084] uppercase tracking-wider mb-1.5">
              Nơi đến
            </label>
            <div className="relative">
              <button
                id="search-to"
                type="button"
                onClick={() => {
                  setToOpen(!toOpen);
                  setFromOpen(false);
                  setPassengersOpen(false);
                }}
                className="w-full h-[52px] flex items-center justify-between px-3.5 bg-[#F7F4EC]/70 hover:bg-[#F7F4EC] focus:bg-[#FFFEFA] focus:ring-2 focus:ring-[#0097A7] rounded-xl border border-[#E5E3DC] text-left transition-all"
              >
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <MapPin className="w-4 h-4 text-[#F3B54A] shrink-0" />
                  <span className="font-semibold text-sm text-[#102744] truncate">{to}</span>
                </div>
                <ChevronDown className="w-4 h-4 text-[#647084] shrink-0" />
              </button>

              {/* Dropdown Options */}
              {toOpen && (
                <div className="absolute top-full left-0 z-50 mt-1.5 w-60 bg-[#FFFEFA] border border-[#E5E3DC] rounded-xl shadow-xl py-1.5 max-h-56 overflow-y-auto animate-in fade-in duration-100">
                  <div className="px-3.5 py-1.5 text-[11px] font-bold text-[#647084] uppercase bg-[#F7F4EC]">
                    Địa điểm phổ biến
                  </div>
                  {POPULAR_CITIES.map((c) => (
                    <button
                      key={c.id}
                      type="button"
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
        </div>

        {/* ROW 2: [Ngày đi] [Số hành khách] [Tìm chuyến] */}
        <div className="grid grid-cols-1 sm:grid-cols-[1.3fr_1.1fr_auto] items-end gap-2.5">
          {/* Ngày đi (Hiển thị đầy đủ dd/MM/yyyy) */}
          <div className="min-w-0">
            <label htmlFor="search-date" className="block text-[11px] font-semibold text-[#647084] uppercase tracking-wider mb-1.5">
              Ngày đi
            </label>
            <div className="relative flex items-center h-[52px] px-3.5 bg-[#F7F4EC]/70 hover:bg-[#F7F4EC] focus-within:bg-[#FFFEFA] focus-within:ring-2 focus-within:ring-[#0097A7] rounded-xl border border-[#E5E3DC] cursor-pointer transition-all">
              <Calendar className="w-4 h-4 text-[#0097A7] shrink-0 mr-2.5 pointer-events-none" />
              <span className="font-semibold text-xs sm:text-sm text-[#102744] select-none truncate">
                {formatDateDisplay(date)}
              </span>
              <input
                id="search-date"
                type="date"
                min={todayStr}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                aria-label="Chọn ngày khởi hành"
              />
            </div>
          </div>

          {/* Số hành khách */}
          <div className="relative min-w-0">
            <label htmlFor="search-passengers" className="block text-[11px] font-semibold text-[#647084] uppercase tracking-wider mb-1.5">
              Số hành khách
            </label>
            <div className="relative">
              <button
                id="search-passengers"
                type="button"
                onClick={() => {
                  setPassengersOpen(!passengersOpen);
                  setFromOpen(false);
                  setToOpen(false);
                }}
                className="w-full h-[52px] flex items-center justify-between px-3.5 bg-[#F7F4EC]/70 hover:bg-[#F7F4EC] focus:bg-[#FFFEFA] focus:ring-2 focus:ring-[#0097A7] rounded-xl border border-[#E5E3DC] text-left transition-all"
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <Users className="w-4 h-4 text-[#0097A7] shrink-0" />
                  <span className="font-semibold text-xs sm:text-sm text-[#102744] truncate">
                    {passengers} người
                  </span>
                </div>
                <ChevronDown className="w-4 h-4 text-[#647084] shrink-0" />
              </button>

              {passengersOpen && (
                <div className="absolute top-full left-0 z-50 mt-1.5 w-44 bg-[#FFFEFA] border border-[#E5E3DC] rounded-xl shadow-xl py-1 animate-in fade-in duration-100">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => {
                        setPassengers(num);
                        setPassengersOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2.5 text-xs font-medium hover:bg-[#E0F7FA] ${
                        passengers === num ? 'font-bold text-[#0097A7] bg-[#E0F7FA]/40' : 'text-[#102744]'
                      }`}
                    >
                      {num} người
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Nút Tìm chuyến (Min-width 145px, never breaks line) */}
          <div className="min-w-[145px] shrink-0">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-[52px] px-5 bg-[#0097A7] hover:bg-[#007887] active:scale-97 text-white font-semibold text-sm rounded-xl shadow-md shadow-[#0097A7]/20 flex items-center justify-center gap-2 transition-all disabled:opacity-70 disabled:cursor-not-allowed whitespace-nowrap"
            >
              {isLoading ? (
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Search className="w-4 h-4 shrink-0" />
                  <span>Tìm chuyến</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
};
