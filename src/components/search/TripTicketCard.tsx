import React, { useState, useMemo } from 'react';
import type { Trip } from '../../types';
import { bookingService } from '../../services/bookingService';
import { Clock, ArrowRight, ChevronDown, ChevronUp, MapPin, Check, ShieldCheck, ArrowRightLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface TripTicketCardProps {
  trip: Trip;
  onSelectTrip: (trip: Trip) => void;
}

export const TripTicketCard: React.FC<TripTicketCardProps> = ({
  trip,
  onSelectTrip,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

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
    <div className="group relative bg-[#FFFEFA] rounded-2xl border border-[#E5E3DC] shadow-2xs hover:shadow-xs hover:border-[#CBD5E1] hover:-translate-y-0.5 transition-all duration-200 overflow-hidden">
      {/* ============================================================
          DESKTOP VIEW (>= md): Low-profile compact ticket (~115-145px)
          Horizontal ticket layout with thumbnail, route line & perforated stub
          ============================================================ */}
      <div className="hidden md:flex items-stretch min-h-[120px]">
        {/* Left Section: Thumbnail + Route Timeline + Expand toggle */}
        <div className="flex-1 flex flex-col justify-between p-3.5 lg:p-4 pr-5">
          <div className="flex items-center gap-3.5 lg:gap-5">
            {/* Coach thumbnail & Vehicle details */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="w-[110px] lg:w-[120px] h-[66px] lg:h-[70px] rounded-xl bg-[#F6F4EE] p-1.5 border border-[#E5E3DC] flex items-center justify-center shrink-0 overflow-hidden">
                <img
                  src={trip.vehicle.image}
                  alt={trip.vehicle.name}
                  className="w-full h-full object-contain transform group-hover:scale-105 transition-transform duration-200"
                  loading="lazy"
                />
              </div>
              <div className="w-[115px] lg:w-[130px]">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-[10px] font-bold text-[#0097A7] uppercase tracking-wider">
                    {trip.operator}
                  </span>
                </div>
                <h4 className="font-serif font-bold text-sm text-[#102744] leading-tight truncate" title={trip.vehicle.name}>
                  {trip.vehicle.name}
                </h4>
                <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-[#647084]">
                  <span>#{trip.code}</span>
                  <span>•</span>
                  <span>{trip.vehicle.categoryLabel}</span>
                </div>
              </div>
            </div>

            {/* Timeline: Departure -> Duration Line -> Arrival */}
            <div className="flex-1 flex items-center justify-between pl-1 lg:pl-3">
              {/* Departure */}
              <div className="shrink-0 min-w-[85px]">
                <span className="font-serif text-2xl font-bold text-[#102744] tracking-tight">
                  {trip.departureTime}
                </span>
                <p className="text-xs font-semibold text-[#102744] mt-0.5 truncate max-w-[120px]">
                  {trip.from}
                </p>
                <p className="text-[11px] text-[#647084] truncate max-w-[120px]" title={trip.departureLocation.name}>
                  {trip.departureLocation.name}
                </p>
              </div>

              {/* Duration connector */}
              <div className="flex-1 mx-2.5 lg:mx-4 flex flex-col items-center max-w-[140px]">
                <span className="text-[11px] font-medium text-[#647084] mb-1 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-[#0097A7]" />
                  {trip.duration}
                </span>
                <div className="w-full relative flex items-center">
                  <div className="w-full h-0.5 bg-[#CBD5E1]" />
                  <div className="w-1.5 h-1.5 rounded-full bg-[#0097A7] ring-2 ring-white absolute left-0" />
                  <div className="w-1.5 h-1.5 rounded-full bg-[#F3B54A] ring-2 ring-white absolute right-0" />
                </div>
                <span className="text-[10px] text-[#0097A7] font-semibold mt-0.5">
                  Đi thẳng
                </span>
              </div>

              {/* Arrival */}
              <div className="shrink-0 min-w-[85px] text-right">
                <div className="flex items-baseline justify-end gap-1">
                  <span className="font-serif text-2xl font-bold text-[#102744] tracking-tight">
                    {trip.arrivalTime}
                  </span>
                  {isOvernight && (
                    <span className="text-[10px] text-amber-700 font-bold bg-amber-100/90 px-1 py-0.2 rounded border border-amber-200">
                      +1 ngày
                    </span>
                  )}
                </div>
                <p className="text-xs font-semibold text-[#102744] mt-0.5 truncate max-w-[120px] ml-auto">
                  {trip.to}
                </p>
                <p className="text-[11px] text-[#647084] truncate max-w-[120px] ml-auto" title={trip.arrivalLocation.name}>
                  {trip.arrivalLocation.name}
                </p>
              </div>
            </div>
          </div>

          {/* Bottom row: Accordion trigger for details */}
          <div className="mt-2 pt-1.5 flex items-center justify-between border-t border-[#F0ECE1]">
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              aria-expanded={isExpanded}
              aria-controls={`trip-details-${trip.id}`}
              className="text-xs text-[#0097A7] hover:text-[#007887] font-medium flex items-center gap-1 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0097A7] rounded-md px-1 py-0.5"
            >
              <span>Chi tiết chuyến</span>
              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            <span className="text-[11px] text-[#647084]">
              {trip.departureStops.length} điểm đón • {trip.dropoffStops.length} điểm trả
            </span>
          </div>
        </div>

        {/* Right Section: Ticket Stub (~24%) with perforation and safe semi-circle notches */}
        <div className="w-[180px] lg:w-[195px] shrink-0 border-l border-dashed border-[#CBD5E1] bg-[#FCFAF6] p-3.5 lg:p-4 flex flex-col justify-between items-center text-center relative">
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
            <span className="text-[11px] text-[#647084] block font-medium">Giá vé 1 khách</span>
            <div className="font-serif text-2xl font-bold text-[#0097A7] leading-tight mt-0.5">
              {trip.price === 0 ? (
                <span className="text-emerald-600 inline-flex items-center gap-1">
                  0 ₫ <span className="text-[10px] font-sans font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">TEST</span>
                </span>
              ) : (
                bookingService.formatCurrency(trip.price)
              )}
            </div>
            {availableSeats === 0 ? (
              <div className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200/60">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                <span>Hết chỗ</span>
              </div>
            ) : (
              <div className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>Còn {availableSeats} chỗ</span>
              </div>
            )}
          </div>

          {/* Select Button */}
          <div className="w-full mt-2.5">
            <button
              type="button"
              onClick={() => onSelectTrip(trip)}
              className={`w-full py-2 px-3 text-white font-semibold text-xs lg:text-sm rounded-xl shadow-2xs flex items-center justify-center gap-1.5 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
                availableSeats === 0
                  ? 'bg-[#475569] hover:bg-[#334155] focus-visible:ring-slate-500'
                  : 'bg-[#0097A7] hover:bg-[#007887] active:scale-97 shadow-[#0097A7]/25 focus-visible:ring-[#0097A7]'
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
            <div className="w-16 h-11 rounded-lg bg-[#F6F4EE] p-1 border border-[#E5E3DC] shrink-0 flex items-center justify-center">
              <img
                src={trip.vehicle.image}
                alt={trip.vehicle.name}
                className="w-full h-full object-contain"
                loading="lazy"
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-[#0097A7] uppercase">
                  {trip.operator}
                </span>
                <span className="text-[10px] text-[#647084]">#{trip.code}</span>
              </div>
              <h4 className="font-serif font-bold text-sm text-[#102744] truncate">
                {trip.vehicle.name}
              </h4>
            </div>
          </div>

          <div className="shrink-0 text-right">
            {availableSeats === 0 ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200/60">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                <span>Hết chỗ</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>Còn {availableSeats} chỗ</span>
              </span>
            )}
          </div>
        </div>

        {/* Row 2: Timeline Departure -> Duration -> Arrival */}
        <div className="bg-[#FAF8F2] rounded-xl p-3 border border-[#E5E3DC]/60 flex items-center justify-between">
          {/* Departure */}
          <div>
            <span className="font-serif text-xl font-bold text-[#102744]">
              {trip.departureTime}
            </span>
            <p className="text-xs font-semibold text-[#102744] mt-0.5">{trip.from}</p>
            <p className="text-[10px] text-[#647084] max-w-[100px] truncate" title={trip.departureLocation.name}>
              {trip.departureLocation.name}
            </p>
          </div>

          {/* Duration */}
          <div className="flex-1 mx-2 flex flex-col items-center">
            <span className="text-[10px] font-medium text-[#647084] mb-0.5 flex items-center gap-1">
              <Clock className="w-2.5 h-2.5 text-[#0097A7]" />
              {trip.duration}
            </span>
            <div className="w-full relative flex items-center">
              <div className="w-full h-0.5 bg-[#CBD5E1]" />
              <div className="w-1.5 h-1.5 rounded-full bg-[#0097A7] absolute left-0" />
              <div className="w-1.5 h-1.5 rounded-full bg-[#F3B54A] absolute right-0" />
            </div>
            <span className="text-[9px] text-[#0097A7] font-semibold mt-0.5">Đi thẳng</span>
          </div>

          {/* Arrival */}
          <div className="text-right">
            <div className="flex items-baseline justify-end gap-1">
              <span className="font-serif text-xl font-bold text-[#102744]">
                {trip.arrivalTime}
              </span>
              {isOvernight && (
                <span className="text-[9px] text-amber-700 font-bold bg-amber-100 px-1 rounded">
                  +1 ngày
                </span>
              )}
            </div>
            <p className="text-xs font-semibold text-[#102744] mt-0.5">{trip.to}</p>
            <p className="text-[10px] text-[#647084] max-w-[100px] truncate ml-auto" title={trip.arrivalLocation.name}>
              {trip.arrivalLocation.name}
            </p>
          </div>
        </div>

        {/* Row 3: Price + Nút Chọn Chuyến */}
        <div className="flex items-center justify-between gap-3 pt-1">
          <div>
            <span className="text-[10px] text-[#647084] block font-medium">Giá vé 1 khách</span>
            <span className="font-serif text-xl font-bold text-[#0097A7]">
              {trip.price === 0 ? (
                <span className="text-emerald-600">0 ₫ (Miễn phí test)</span>
              ) : (
                bookingService.formatCurrency(trip.price)
              )}
            </span>
          </div>

          <button
            type="button"
            onClick={() => onSelectTrip(trip)}
            className={`min-h-[44px] px-4 text-white font-semibold text-sm rounded-xl shadow-2xs flex items-center justify-center gap-1.5 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
              availableSeats === 0
                ? 'bg-[#475569] hover:bg-[#334155] focus-visible:ring-slate-500'
                : 'bg-[#0097A7] hover:bg-[#007887] active:scale-97 shadow-[#0097A7]/25 focus-visible:ring-[#0097A7]'
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
            className="w-full py-1 text-xs text-[#0097A7] font-medium flex items-center justify-center gap-1 border-t border-[#F0ECE1] pt-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0097A7] rounded-md"
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
                      <Check className="w-3 h-3 text-[#0097A7]" />
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
                    <MapPin className="w-3.5 h-3.5 text-[#0097A7]" />
                    <span>Điểm đón ({trip.from}) — {trip.departureStops.length} điểm</span>
                  </span>
                  <ul className="space-y-1.5 text-xs text-[#647084]">
                    {trip.departureStops.map((s) => (
                      <li key={s.id} className="flex items-start justify-between gap-2 border-b border-[#F7F4EC] pb-1.5 last:border-none last:pb-0">
                        <div>
                          <span className="font-semibold text-[#102744] block">{s.name}</span>
                          <span className="text-[10.5px] text-[#94A3B8]">{s.address}</span>
                        </div>
                        <span className="text-[11px] font-semibold text-[#0097A7] shrink-0">{s.time}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Dropoff stops */}
                <div className="bg-white rounded-xl p-3 border border-[#E5E3DC]">
                  <span className="text-xs font-bold text-[#102744] flex items-center gap-1.5 mb-2">
                    <MapPin className="w-3.5 h-3.5 text-[#F3B54A]" />
                    <span>Điểm trả ({trip.to}) — {trip.dropoffStops.length} điểm</span>
                  </span>
                  <ul className="space-y-1.5 text-xs text-[#647084]">
                    {trip.dropoffStops.map((s) => (
                      <li key={s.id} className="flex items-start justify-between gap-2 border-b border-[#F7F4EC] pb-1.5 last:border-none last:pb-0">
                        <div>
                          <span className="font-semibold text-[#102744] block">{s.name}</span>
                          <span className="text-[10.5px] text-[#94A3B8]">{s.address}</span>
                        </div>
                        <span className="text-[11px] font-semibold text-[#F3B54A] shrink-0">{s.time}</span>
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
                  <ArrowRightLeft className="w-3.5 h-3.5 text-[#0097A7]" />
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
