import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Trip, Seat } from '../../types';
import { SeatMap } from './SeatMap';
import { bookingService } from '../../services/bookingService';
import { ArrowLeft, ArrowRight, X, AlertCircle } from 'lucide-react';

interface SeatSelectionModalProps {
  trip: Trip;
  dateStr: string;
  passengersCount: number;
  selectedSeats: string[];
  onToggleSeat: (seat: Seat) => void;
  onRemoveSeatCode: (code: string) => void;
  onBack: () => void;
  onProceedToPassenger: () => void;
}

export const SeatSelectionModal: React.FC<SeatSelectionModalProps> = ({
  trip,
  dateStr,
  passengersCount,
  selectedSeats,
  onToggleSeat,
  onRemoveSeatCode,
  onBack,
  onProceedToPassenger,
}) => {
  const totalPrice = selectedSeats.length * trip.price;
  const isEnoughSeats = selectedSeats.length === passengersCount;

  return (
    <div className="min-h-screen bg-[#F7F4EC] pb-20">
      {/* Top Banner & Stepper (Panel 03 Header) */}
      <div className="bg-[#FFFEFA] border-b border-[#E5E3DC] py-6 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#102744] hover:text-[#0097A7] mb-3 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Quay lại kết quả</span>
          </button>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#102744]">
                Chọn chỗ cho hành trình
              </h1>
              <p className="text-xs sm:text-sm text-[#647084] mt-1">
                {trip.from} → {trip.to} • {trip.departureTime}, {bookingService.formatDisplayDate(dateStr)} • {passengersCount} khách
              </p>
            </div>

            {/* Stepper matching reference sketch */}
            <div className="flex items-center gap-2 sm:gap-4 text-xs font-semibold">
              <div className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full">
                <span className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">✓</span>
                <span>1. Chọn chuyến</span>
              </div>
              <span className="text-[#CBD5E1]">→</span>
              <div className="flex items-center gap-1.5 text-white bg-[#0097A7] px-3.5 py-1.5 rounded-full shadow-xs">
                <span className="w-4 h-4 rounded-full bg-white text-[#0097A7] flex items-center justify-center text-[10px] font-bold">2</span>
                <span>2. Chọn chỗ</span>
              </div>
              <span className="text-[#CBD5E1]">→</span>
              <div className="flex items-center gap-1.5 text-[#647084] px-2 py-1">
                <span className="w-4 h-4 rounded-full bg-[#E5E3DC] text-[#647084] flex items-center justify-center text-[10px]">3</span>
                <span>3. Thanh toán</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Seat Map & Summary Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Interactive Seat Map (~60% / 7 cols) */}
          <div className="lg:col-span-7">
            <SeatMap
              trip={trip}
              selectedSeatCodes={selectedSeats}
              maxSelectable={passengersCount}
              onToggleSeat={onToggleSeat}
            />

            {/* Hint Notice */}
            <div className="mt-4 p-4 bg-[#FFFEFA] rounded-2xl border border-[#E5E3DC] flex items-start gap-3 text-xs text-[#647084]">
              <AlertCircle className="w-4 h-4 text-[#0097A7] shrink-0 mt-0.5" />
              <span>
                Bạn đang đặt vé cho <strong>{passengersCount} hành khách</strong>. Vui lòng chọn đúng <strong>{passengersCount} vị trí ghế</strong> trên sơ đồ để tiếp tục.
              </span>
            </div>
          </div>

          {/* Right Column: Sticky Booking Summary (~40% / 5 cols) */}
          <div className="lg:col-span-5 lg:sticky lg:top-24">
            <div className="bg-[#FFFEFA] rounded-3xl p-6 border border-[#E5E3DC] shadow-sm space-y-6">
              <h3 className="font-serif font-bold text-lg text-[#102744] pb-3 border-b border-[#E5E3DC]">
                Thông tin chuyến xe
              </h3>

              {/* Trip Brief with Thumbnail */}
              <div className="flex gap-4 items-center">
                <div className="w-24 h-16 rounded-xl overflow-hidden bg-[#F7F4EC] p-1 border border-[#E5E3DC] shrink-0 flex items-center justify-center">
                  <img
                    src={trip.vehicle.image}
                    alt={trip.vehicle.name}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-[#102744]">
                    {trip.departureTime} → {trip.arrivalTime}
                  </h4>
                  <p className="text-xs text-[#647084] mt-0.5">
                    {trip.from} → {trip.to}
                  </p>
                  <p className="text-[11px] text-[#0097A7] font-semibold mt-0.5">
                    {trip.vehicle.name}
                  </p>
                </div>
              </div>

              {/* Departure & Arrival Detailed Locations */}
              <div className="space-y-3 bg-[#F7F4EC] p-4 rounded-2xl border border-[#E5E3DC] text-xs">
                <div>
                  <span className="text-[#647084] block text-[11px]">Điểm khởi hành:</span>
                  <span className="font-semibold text-[#102744]">{trip.departureLocation.name}</span>
                </div>
                <div className="border-t border-[#E5E3DC] pt-2">
                  <span className="text-[#647084] block text-[11px]">Điểm đến dự kiến:</span>
                  <span className="font-semibold text-[#102744]">{trip.arrivalLocation.name}</span>
                </div>
              </div>

              {/* Selected Seats Chips with Framer Motion Layout Animation */}
              <div>
                <label className="text-xs font-bold text-[#102744] uppercase tracking-wider block mb-2">
                  Ghế đã chọn ({selectedSeats.length}/{passengersCount})
                </label>

                {selectedSeats.length === 0 ? (
                  <p className="text-xs text-[#647084] italic bg-[#F7F4EC] p-3 rounded-xl border border-dashed border-[#CBD5E1]">
                    Chưa chọn ghế nào. Vui lòng bấm vào ghế còn trống trên sơ đồ xe bên cạnh.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    <AnimatePresence>
                      {selectedSeats.map((code) => (
                        <motion.span
                          key={code}
                          layout
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.6 }}
                          transition={{ duration: 0.2 }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#E0F7FA] text-[#007887] border border-[#0097A7]/40 rounded-xl font-bold text-xs shadow-2xs"
                        >
                          <span>Ghế {code}</span>
                          <button
                            type="button"
                            onClick={() => onRemoveSeatCode(code)}
                            className="hover:bg-[#0097A7] hover:text-white rounded-full p-0.5 transition-colors"
                            aria-label={`Bỏ chọn ghế ${code}`}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </motion.span>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </div>

              {/* Pricing breakdown */}
              <div className="pt-4 border-t border-[#E5E3DC] space-y-2">
                <div className="flex justify-between text-xs text-[#647084]">
                  <span>Đơn giá vé:</span>
                  <span>{bookingService.formatCurrency(trip.price)} × {selectedSeats.length}</span>
                </div>
                <div className="flex justify-between items-baseline pt-1">
                  <span className="font-bold text-sm text-[#102744]">Tổng tiền:</span>
                  <span className="font-serif font-bold text-2xl text-[#0097A7]">
                    {bookingService.formatCurrency(totalPrice)}
                  </span>
                </div>
              </div>

              {/* Proceed Action Button */}
              <button
                type="button"
                disabled={!isEnoughSeats}
                onClick={onProceedToPassenger}
                className="w-full py-3.5 bg-[#0097A7] hover:bg-[#007887] active:scale-98 text-white font-semibold text-sm rounded-xl shadow-md shadow-[#0097A7]/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>Tiếp tục điền thông tin</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {!isEnoughSeats && selectedSeats.length > 0 && (
                <p className="text-[11px] text-amber-700 text-center font-medium">
                  Cần chọn thêm {passengersCount - selectedSeats.length} ghế nữa để tiếp tục
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
