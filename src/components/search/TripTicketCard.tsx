import React, { useState, useMemo } from 'react';
import type { Trip, VehicleCategory } from '../../types';
import { bookingService } from '../../services/bookingService';
import { Clock, ArrowRight, ChevronDown, ChevronUp, Sparkles, Crown, Star, CheckCircle2, Check, MapPin, ShieldCheck, ArrowRightLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface TripTicketCardProps {
  trip: Trip;
  onSelectTrip: (trip: Trip) => void;
}

const CATEGORY_THEMES: Record<
  VehicleCategory,
  {
    stripe: string;
    borderHover: string;
    badgeBg: string;
    thumbBg: string;
    icon: React.ReactNode;
  }
> = {
  cabin: {
    stripe: 'bg-gradient-to-r from-[#F5AE1B] via-[#FBBF24] to-[#D97706]',
    borderHover: 'hover:border-amber-300 hover:shadow-amber-500/15',
    badgeBg: 'bg-gradient-to-r from-amber-50 to-orange-50 text-amber-900 border-amber-300/80',
    thumbBg: 'bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-transparent border-amber-200/70',
    icon: <Crown className="w-3 h-3 text-amber-600 shrink-0" />,
  },
  limousine: {
    stripe: 'bg-gradient-to-r from-[#2563EB] via-[#38BDF8] to-[#0284C7]',
    borderHover: 'hover:border-blue-300 hover:shadow-blue-500/15',
    badgeBg: 'bg-gradient-to-r from-blue-50 to-cyan-50 text-blue-900 border-blue-300/80',
    thumbBg: 'bg-gradient-to-br from-blue-500/10 via-cyan-500/5 to-transparent border-blue-200/70',
    icon: <Star className="w-3 h-3 text-blue-600 shrink-0" />,
  },
  sleeper: {
    stripe: 'bg-gradient-to-r from-[#059669] via-[#34D399] to-[#10B981]',
    borderHover: 'hover:border-emerald-300 hover:shadow-emerald-500/15',
    badgeBg: 'bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-900 border-emerald-300/80',
    thumbBg: 'bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent border-emerald-200/70',
    icon: <Sparkles className="w-3 h-3 text-emerald-600 shrink-0" />,
  },
};

export const TripTicketCard: React.FC<TripTicketCardProps> = ({
  trip,
  onSelectTrip,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const theme = CATEGORY_THEMES[trip.vehicle.category] || CATEGORY_THEMES.sleeper;

  // Compute available seats strictly from seats array if present to ensure single source of truth
  const availableSeats = useMemo(() => {
    if (trip.seats && trip.seats.length > 0) {
      return trip.seats.filter((s) => s.status === 'available').length;
    }
    return trip.availableSeatsCount;
  }, [trip]);

  // Determine if trip arrives next day (overnight)
  const isOvernight = useMemo(() => {
    if (trip.nextDay) return true;
    const [depH, depM] = trip.departureTime.split(':').map(Number);
    const [arrH, arrM] = trip.arrivalTime.split(':').map(Number);
    return arrH < depH || (arrH === depH && arrM < depM);
  }, [trip]);

  return (
    <div
      data-trip-category={trip.vehicle.category}
      data-trip-id={trip.id}
      className={`group relative bg-white rounded-2xl border border-[#E2DDD0] shadow-2xs hover:shadow-md ${theme.borderHover} hover:-translate-y-0.5 transition-all duration-200 overflow-hidden`}
    >
      {/* Category Top Colored Stripe */}
      <div className={`h-[3px] w-full ${theme.stripe}`} />

      {/* ============================================================
          DESKTOP VIEW (>= md): Low-profile compact ticket (~115-145px)
          Horizontal ticket layout with thumbnail, route line & perforated stub
          ============================================================ */}
      <div className="hidden md:flex items-stretch min-h-[124px]">
        {/* Left Section: Thumbnail + Route Timeline + Expand toggle */}
        <div className="flex-1 flex flex-col justify-between p-3.5 lg:p-4 pr-5">
          <div className="flex items-center gap-3.5 lg:gap-5">
            {/* Coach thumbnail & Vehicle details */}
            <div className="flex items-center gap-3 shrink-0">
              <div className={`w-[110px] lg:w-[124px] h-[68px] lg:h-[72px] rounded-xl ${theme.thumbBg} p-1.5 border flex items-center justify-center shrink-0 overflow-hidden shadow-inner`}>
                <img
                  src={trip.vehicle.image}
                  alt={trip.vehicle.name}
                  className="w-full h-full object-contain transform group-hover:scale-108 transition-transform duration-300"
                  loading="lazy"
                />
              </div>
              <div className="w-[140px] lg:w-[155px]">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-[10px] font-extrabold text-[#2B4294] uppercase tracking-wider">
                    {trip.operator}
                  </span>
                </div>
                <h4 className="font-sans font-bold text-sm text-[#102744] leading-snug line-clamp-2" title={trip.vehicle.name}>
                  {trip.vehicle.name}
                </h4>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${theme.badgeBg}`}>
                    {theme.icon}
                    <span>{trip.vehicle.categoryLabel}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Timeline: Departure -> Duration Line -> Arrival */}
            <div className="flex-1 flex items-center justify-between pl-1 lg:pl-3">
              {/* Departure */}
              <div className="shrink-0 min-w-[90px]">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-100" />
                  <span className="font-sans text-2xl font-black text-[#102744] tracking-tight">
                    {trip.departureTime}
                  </span>
                </div>
                <p className="text-xs font-bold text-[#102744] mt-1 line-clamp-2 max-w-[150px]">
                  {trip.from}
                </p>
                <p className="text-[11px] text-[#647084] line-clamp-2 max-w-[150px]" title={trip.departureLocation.name}>
                  {trip.departureLocation.name}
                </p>
              </div>

              {/* Duration connector */}
              <div className="flex-1 mx-3 lg:mx-4 flex flex-col items-center max-w-[140px]">
                <span className="text-[10px] font-bold text-[#1E3A8A] bg-[#F1F5F9] border border-[#CBD5E1]/60 px-2.5 py-0.5 rounded-full mb-1 flex items-center gap-1 shadow-2xs">
                  <Clock className="w-3 h-3 text-[#2B4294]" />
                  {trip.duration}
                </span>
                <div className="w-full relative flex items-center my-0.5">
                  <div className="w-full h-[2.5px] bg-gradient-to-r from-emerald-500 via-[#2B4294] to-[#EE3132] rounded-full" />
                </div>
                <span className="text-[10px] text-emerald-700 font-bold mt-0.5 flex items-center gap-1">
                  <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                  <span>Đi thẳng</span>
                </span>
              </div>

              {/* Arrival */}
              <div className="shrink-0 min-w-[90px] text-right">
                <div className="flex items-baseline justify-end gap-1.5">
                  <span className="font-sans text-2xl font-black text-[#102744] tracking-tight">
                    {trip.arrivalTime}
                  </span>
                  <span className="w-2.5 h-2.5 rounded-full bg-[#EE3132] ring-4 ring-red-100" />
                </div>
                {isOvernight && (
                  <div className="flex justify-end mt-0.5">
                    <span className="text-[10px] text-white font-extrabold bg-gradient-to-r from-amber-500 to-orange-500 px-1.5 py-0.2 rounded shadow-2xs">
                      +1 ngày
                    </span>
                  </div>
                )}
                <p className="text-xs font-bold text-[#102744] mt-0.5 line-clamp-2 max-w-[150px] ml-auto">
                  {trip.to}
                </p>
                <p className="text-[11px] text-[#647084] line-clamp-2 max-w-[150px] ml-auto" title={trip.arrivalLocation.name}>
                  {trip.arrivalLocation.name}
                </p>
              </div>
            </div>
          </div>

          {/* Bottom row: Accordion trigger for details */}
          <div className="mt-2.5 pt-1.5 flex items-center justify-between border-t border-[#F1EFEA]">
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              aria-expanded={isExpanded}
              aria-controls={`trip-details-${trip.id}`}
              className="text-xs text-[#2B4294] hover:text-[#1E2F6B] font-semibold flex items-center gap-1 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2B4294] rounded-md px-1 py-0.5"
            >
              <span>Chi tiết chuyến</span>
              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            <span className="text-[11px] text-[#647084] font-medium">
              {trip.departureStops.length} điểm đón • {trip.dropoffStops.length} điểm trả
            </span>
          </div>
        </div>

        {/* Right Section: Ticket Stub (~24%) with perforation and safe semi-circle notches */}
        <div className="w-[185px] lg:w-[200px] shrink-0 border-l border-dashed border-[#CBD5E1] bg-gradient-to-b from-[#FCFAF6] to-[#F7F4EC]/70 p-3.5 lg:p-4 flex flex-col justify-between items-center text-center relative">
          {/* Semi-circle ticket notches along perforation line (safely recessed) */}
          <div
            className="absolute -top-2.5 -left-2.5 w-5 h-5 rounded-full bg-[#F7F4EC] border border-[#CBD5E1] pointer-events-none z-10"
            aria-hidden="true"
          />
          <div
            className="absolute -bottom-2.5 -left-2.5 w-5 h-5 rounded-full bg-[#F7F4EC] border border-[#CBD5E1] pointer-events-none z-10"
            aria-hidden="true"
          />

          {/* Price & Seats remaining */}
          <div className="w-full">
            <span className="text-[11px] text-[#647084] block font-semibold">Giá vé 1 khách</span>
            <div className="font-sans text-2xl font-black leading-tight mt-0.5">
              {trip.price === 0 ? (
                <span className="text-emerald-600 inline-flex items-center gap-1">
                  0 ₫ <span className="text-[10px] font-sans font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">TEST</span>
                </span>
              ) : (
                <span className="text-[#EE3132]">
                  {bookingService.formatCurrency(trip.price)}
                </span>
              )}
            </div>
            {availableSeats === 0 ? (
              <div className="mt-1.5 inline-flex items-center gap-1.5 text-[11px] font-bold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200 shadow-2xs">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                <span>Hết chỗ</span>
              </div>
            ) : (
              <div className="mt-1.5 inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-300 shadow-2xs">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>Còn {availableSeats} chỗ</span>
              </div>
            )}
          </div>

          {/* Select Button: Vibrant Action Gradient */}
          <div className="w-full mt-2.5">
            <button
              type="button"
              onClick={() => onSelectTrip(trip)}
              className={`w-full py-2.5 px-3 text-white font-bold text-xs lg:text-sm rounded-xl shadow-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
                availableSeats === 0
                  ? 'bg-[#475569] hover:bg-[#334155] focus-visible:ring-slate-500'
                  : 'bg-gradient-to-r from-[#2B4294] via-[#1E3A8A] to-[#EE3132] hover:from-[#1E2F6B] hover:to-[#DC2626] active:scale-97 shadow-[#2B4294]/25 hover:shadow-md hover:shadow-[#EE3132]/30 focus-visible:ring-[#2B4294]'
              }`}
              aria-label={
                availableSeats === 0
                  ? `Xem sơ đồ chuyến hết chỗ lúc ${trip.departureTime}`
                  : `Chọn chuyến đi lúc ${trip.departureTime} đến ${trip.to}`
              }
            >
              <span>{availableSeats === 0 ? 'Xem sơ đồ (Hết chỗ)' : 'Chọn chuyến'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================
          MOBILE VIEW (< md): 2-3 row compact card, large tap targets
          ============================================================ */}
      <div className="md:hidden p-4 space-y-3">
        {/* Row 1: Vehicle & Seats */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={`w-16 h-12 rounded-xl ${theme.thumbBg} p-1 border shrink-0 flex items-center justify-center shadow-inner`}>
              <img
                src={trip.vehicle.image}
                alt={trip.vehicle.name}
                className="w-full h-full object-contain"
                loading="lazy"
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-extrabold text-[#2B4294] uppercase tracking-wider">
                  {trip.operator}
                </span>
                <span className={`inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.2 rounded-full border ${theme.badgeBg}`}>
                  {theme.icon}
                  <span>{trip.vehicle.categoryLabel}</span>
                </span>
              </div>
              <h4 className="font-sans font-bold text-sm text-[#102744] line-clamp-2 mt-0.5">
                {trip.vehicle.name}
              </h4>
            </div>
          </div>

          <div className="shrink-0 text-right">
            {availableSeats === 0 ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                <span>Hết chỗ</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-300">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>Còn {availableSeats} chỗ</span>
              </span>
            )}
          </div>
        </div>

        {/* Row 2: Timeline Departure -> Duration -> Arrival */}
        <div className="bg-[#FAF8F2] rounded-xl p-3 border border-[#E5E3DC] flex items-center justify-between shadow-2xs">
          {/* Departure */}
          <div>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-emerald-100" />
              <span className="font-sans text-xl font-black text-[#102744]">
                {trip.departureTime}
              </span>
            </div>
            <p className="text-xs font-bold text-[#102744] mt-0.5">{trip.from}</p>
            <p className="text-[10px] text-[#647084] max-w-[130px] line-clamp-2" title={trip.departureLocation.name}>
              {trip.departureLocation.name}
            </p>
          </div>

          {/* Duration */}
          <div className="flex-1 mx-2 flex flex-col items-center">
            <span className="text-[9px] font-bold text-[#1E3A8A] bg-white border border-[#CBD5E1]/60 px-2 py-0.5 rounded-full mb-0.5 flex items-center gap-1 shadow-2xs">
              <Clock className="w-2.5 h-2.5 text-[#2B4294]" />
              {trip.duration}
            </span>
            <div className="w-full relative flex items-center my-0.5">
              <div className="w-full h-[2px] bg-gradient-to-r from-emerald-500 via-[#2B4294] to-[#EE3132] rounded-full" />
            </div>
            <span className="text-[9px] text-emerald-700 font-bold mt-0.5 flex items-center gap-0.5">
              <CheckCircle2 className="w-2 h-2 text-emerald-600" />
              <span>Đi thẳng</span>
            </span>
          </div>

          {/* Arrival */}
          <div className="text-right">
            <div className="flex items-baseline justify-end gap-1">
              <span className="font-sans text-xl font-black text-[#102744]">
                {trip.arrivalTime}
              </span>
              <span className="w-2 h-2 rounded-full bg-[#EE3132] ring-2 ring-red-100" />
            </div>
            {isOvernight && (
              <span className="text-[9px] text-white font-extrabold bg-gradient-to-r from-amber-500 to-orange-500 px-1 rounded">
                +1 ngày
              </span>
            )}
            <p className="text-xs font-bold text-[#102744] mt-0.5">{trip.to}</p>
            <p className="text-[10px] text-[#647084] max-w-[130px] line-clamp-2 ml-auto" title={trip.arrivalLocation.name}>
              {trip.arrivalLocation.name}
            </p>
          </div>
        </div>

        {/* Row 3: Price + Nút Chọn Chuyến */}
        <div className="flex items-center justify-between gap-3 pt-1">
          <div>
            <span className="text-[10px] text-[#647084] block font-semibold">Giá vé 1 khách</span>
            <div className="font-sans text-xl font-black">
              {trip.price === 0 ? (
                <span className="text-emerald-600">0 ₫ (Miễn phí test)</span>
              ) : (
                <span className="text-[#EE3132]">
                  {bookingService.formatCurrency(trip.price)}
                </span>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={() => onSelectTrip(trip)}
            className={`min-h-[44px] px-4 text-white font-bold text-sm rounded-xl shadow-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
              availableSeats === 0
                ? 'bg-[#475569] hover:bg-[#334155] focus-visible:ring-slate-500'
                : 'bg-gradient-to-r from-[#2B4294] via-[#1E3A8A] to-[#EE3132] hover:from-[#1E2F6B] hover:to-[#DC2626] active:scale-97 shadow-[#2B4294]/25 focus-visible:ring-[#2B4294]'
            }`}
            aria-label={
              availableSeats === 0
                ? `Xem sơ đồ chuyến hết chỗ lúc ${trip.departureTime}`
                : `Chọn chuyến đi lúc ${trip.departureTime} đến ${trip.to}`
            }
          >
            <span>{availableSeats === 0 ? 'Xem sơ đồ (Hết chỗ)' : 'Chọn chuyến'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Expand Trigger on Mobile */}
        <div className="pt-1">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            aria-expanded={isExpanded}
            aria-controls={`trip-details-${trip.id}`}
            className="w-full py-1 text-xs text-[#2B4294] font-medium flex items-center justify-center gap-1 border-t border-[#F0ECE1] pt-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2B4294] rounded-md"
          >
            <span>Chi tiết chuyến</span>
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* ============================================================
          EXPANDABLE DRAWER: Stops, Amenities & Demo Policies
          Short animation (200-300ms) with clean aria accessibility
          ============================================================ */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            id={`trip-details-${trip.id}`}
            key="expand-panel"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.24, ease: 'easeInOut' }}
            className="overflow-hidden border-t border-[#E5E3DC] bg-[#FAF8F2]"
          >
            <div className="p-4 sm:p-5 space-y-4">
              {/* Amenities list */}
              <div>
                <span className="text-[11px] font-bold text-[#102744] uppercase tracking-wider block mb-2">
                  Tiện ích dòng xe:
                </span>
                <div className="flex flex-wrap gap-2 text-xs text-[#475569]">
                  {trip.vehicle.amenities.map((item, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-white rounded-lg border border-[#E5E3DC] text-[11px]"
                    >
                      <Check className="w-3 h-3 text-[#2B4294]" />
                      <span>{item}</span>
                    </span>
                  ))}
                </div>
              </div>

              {/* 2-column Pickup and Dropoff stops */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-[#E5E3DC]/60">
                {/* Pickup stops */}
                <div className="bg-white rounded-xl p-3 border border-[#E5E3DC]">
                  <span className="text-xs font-bold text-[#102744] flex items-center gap-1.5 mb-2">
                    <MapPin className="w-3.5 h-3.5 text-[#2B4294]" />
                    <span>Điểm đón ({trip.from}) — {trip.departureStops.length} điểm</span>
                  </span>
                  <ul className="space-y-1.5 text-xs text-[#647084]">
                    {trip.departureStops.map((s) => (
                      <li key={s.id} className="flex items-start justify-between gap-2 border-b border-[#F7F4EC] pb-1.5 last:border-none last:pb-0">
                        <div>
                          <span className="font-semibold text-[#102744] block">{s.name}</span>
                          <span className="text-[10.5px] text-[#94A3B8]">{s.address}</span>
                        </div>
                        <span className="text-[11px] font-semibold text-[#2B4294] shrink-0">{s.time}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Dropoff stops */}
                <div className="bg-white rounded-xl p-3 border border-[#E5E3DC]">
                  <span className="text-xs font-bold text-[#102744] flex items-center gap-1.5 mb-2">
                    <MapPin className="w-3.5 h-3.5 text-[#F5AE1B]" />
                    <span>Điểm trả ({trip.to}) — {trip.dropoffStops.length} điểm</span>
                  </span>
                  <ul className="space-y-1.5 text-xs text-[#647084]">
                    {trip.dropoffStops.map((s) => (
                      <li key={s.id} className="flex items-start justify-between gap-2 border-b border-[#F7F4EC] pb-1.5 last:border-none last:pb-0">
                        <div>
                          <span className="font-semibold text-[#102744] block">{s.name}</span>
                          <span className="text-[10.5px] text-[#94A3B8]">{s.address}</span>
                        </div>
                        <span className="text-[11px] font-semibold text-[#F5AE1B] shrink-0">{s.time}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Demo Policy Section */}
              <div className="pt-2 border-t border-[#E5E3DC]/60 flex flex-wrap items-center gap-4 text-[11px] text-[#647084]">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Bảo hiểm hành khách đầy đủ</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <ArrowRightLeft className="w-3.5 h-3.5 text-[#2B4294]" />
                  <span>Hỗ trợ đổi/hủy chuyến trước giờ khởi hành 24h</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
