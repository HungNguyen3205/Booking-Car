import React, { useState } from 'react';
import type { Trip } from '../../types';
import { bookingService } from '../../services/bookingService';
import { Clock, ArrowRight, ChevronDown, ChevronUp } from 'lucide-react';

interface TripTicketCardProps {
  trip: Trip;
  onSelectTrip: (trip: Trip) => void;
}

export const TripTicketCard: React.FC<TripTicketCardProps> = ({
  trip,
  onSelectTrip,
}) => {
  const [showStops, setShowStops] = useState(false);

  return (
    <div className="relative bg-[#FFFEFA] rounded-3xl border border-[#E5E3DC] shadow-xs hover:shadow-lg transition-all duration-300 hover:-translate-y-1 overflow-hidden">
      <div className="grid grid-cols-1 md:grid-cols-12 items-stretch">
        {/* Left Section: Vehicle Preview & Operator (~35% / 4 cols) */}
        <div className="md:col-span-4 p-5 sm:p-6 bg-[#F7F4EC]/60 flex flex-col justify-between border-b md:border-b-0 md:border-r border-[#E5E3DC]">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold tracking-wider text-[#0097A7] uppercase bg-[#E0F7FA] px-2.5 py-0.5 rounded-full">
                {trip.operator}
              </span>
              <span className="text-xs text-[#647084] font-medium">
                Mã: {trip.code}
              </span>
            </div>
            <h4 className="font-serif font-bold text-base text-[#102744]">
              {trip.vehicle.name}
            </h4>
          </div>

          {/* Coach thumbnail with hover effect */}
          <div className="my-3 relative rounded-xl overflow-hidden bg-white p-2 border border-[#E5E3DC] aspect-16/9 flex items-center justify-center">
            <img
              src={trip.vehicle.image}
              alt={trip.vehicle.name}
              className="w-full h-full object-contain transform group-hover:scale-105 transition-transform"
              loading="lazy"
            />
          </div>

          {/* Amenities tags */}
          <div className="flex flex-wrap gap-1.5 text-[11px] text-[#647084]">
            {trip.vehicle.amenities.slice(0, 3).map((a, i) => (
              <span key={i} className="px-2 py-0.5 bg-white rounded-md border border-[#E5E3DC]">
                {a}
              </span>
            ))}
          </div>
        </div>

        {/* Center Section: Timeline & Route (~45% / 5 cols) */}
        <div className="md:col-span-5 p-5 sm:p-6 flex flex-col justify-between relative">
          <div>
            {/* Timeline row */}
            <div className="flex items-center justify-between mb-3">
              {/* Departure */}
              <div>
                <span className="font-serif text-2xl sm:text-3xl font-bold text-[#102744]">
                  {trip.departureTime}
                </span>
                <p className="text-xs font-semibold text-[#102744] mt-0.5">
                  {trip.from}
                </p>
                <p className="text-[11px] text-[#647084] max-w-[120px] truncate" title={trip.departureLocation.name}>
                  {trip.departureLocation.name}
                </p>
              </div>

              {/* Duration connector */}
              <div className="flex-1 mx-3 sm:mx-5 flex flex-col items-center">
                <span className="text-[11px] font-medium text-[#647084] mb-1 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-[#0097A7]" />
                  {trip.duration}
                </span>
                <div className="w-full relative flex items-center">
                  <div className="w-full h-0.5 bg-[#CBD5E1]" />
                  <div className="w-2 h-2 rounded-full bg-[#0097A7] absolute left-0" />
                  <div className="w-2 h-2 rounded-full bg-[#F3B54A] absolute right-0" />
                </div>
                <span className="text-[10px] text-[#0097A7] font-semibold mt-1">Đi thẳng</span>
              </div>

              {/* Arrival */}
              <div className="text-right">
                <div className="flex items-baseline justify-end gap-1">
                  <span className="font-serif text-2xl sm:text-3xl font-bold text-[#102744]">
                    {trip.arrivalTime}
                  </span>
                  {trip.nextDay && (
                    <span className="text-[10px] text-amber-600 font-bold bg-amber-50 px-1 rounded">
                      +1 ngày
                    </span>
                  )}
                </div>
                <p className="text-xs font-semibold text-[#102744] mt-0.5">
                  {trip.to}
                </p>
                <p className="text-[11px] text-[#647084] max-w-[120px] truncate ml-auto" title={trip.arrivalLocation.name}>
                  {trip.arrivalLocation.name}
                </p>
              </div>
            </div>

            {/* Toggle pickup/dropoff points info */}
            <button
              type="button"
              onClick={() => setShowStops(!showStops)}
              className="mt-3 text-xs text-[#0097A7] hover:text-[#007887] font-medium flex items-center gap-1 transition-colors"
            >
              <span>Xem {trip.departureStops.length} điểm đón & trả</span>
              {showStops ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {showStops && (
              <div className="mt-3 p-3 bg-[#F7F4EC] rounded-xl text-xs space-y-2 border border-[#E5E3DC] animate-in fade-in duration-150">
                <div>
                  <span className="font-bold text-[#102744]">Điểm đón ({trip.from}):</span>
                  <ul className="mt-1 list-disc list-inside text-[#647084]">
                    {trip.departureStops.map((s) => (
                      <li key={s.id}>
                        {s.name} ({s.time})
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <span className="font-bold text-[#102744]">Điểm trả ({trip.to}):</span>
                  <ul className="mt-1 list-disc list-inside text-[#647084]">
                    {trip.dropoffStops.map((s) => (
                      <li key={s.id}>
                        {s.name} ({s.time})
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Section: Ticket Stub / Perforation & Action (~20% / 3 cols) */}
        <div className="md:col-span-3 p-5 sm:p-6 bg-[#FFFEFA] border-t md:border-t-0 md:border-l md:border-dashed border-[#CBD5E1] flex flex-col justify-between items-center md:items-end text-center md:text-right relative">
          {/* Ticket semi-circle notches for desktop perforation look */}
          <div className="hidden md:block absolute -top-3 -left-3 w-6 h-6 rounded-full bg-[#F7F4EC] border-b border-[#E5E3DC]" />
          <div className="hidden md:block absolute -bottom-3 -left-3 w-6 h-6 rounded-full bg-[#F7F4EC] border-t border-[#E5E3DC]" />

          <div className="w-full">
            <span className="text-[11px] text-[#647084] block mb-1">Giá vé 1 khách:</span>
            <div className="font-serif text-2xl font-bold text-[#0097A7]">
              {bookingService.formatCurrency(trip.price)}
            </div>
            <div className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>Còn {trip.availableSeatsCount} chỗ</span>
            </div>
          </div>

          <div className="w-full mt-4">
            <button
              type="button"
              onClick={() => onSelectTrip(trip)}
              className="w-full py-2.5 px-4 bg-[#0097A7] hover:bg-[#007887] active:scale-97 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-md shadow-[#0097A7]/20 flex items-center justify-center gap-1.5 transition-all"
            >
              <span>Chọn chuyến</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
