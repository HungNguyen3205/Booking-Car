import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Trip, Seat } from '../../types';
import { SeatMap } from './SeatMap';
import { bookingService } from '../../services/bookingService';
import {
  ArrowLeft,
  ArrowRight,
  X,
  AlertCircle,
  Ticket as TicketIcon,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';

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

// Clean SVG Barcode Component for demo ticket stub
const SvgTicketBarcode: React.FC<{ code: string }> = ({ code }) => {
  const bars = [
    { w: 2, s: 1 }, { w: 1, s: 2 }, { w: 3, s: 1 }, { w: 1, s: 1 },
    { w: 2, s: 2 }, { w: 3.5, s: 1 }, { w: 1, s: 2 }, { w: 2, s: 1 },
    { w: 2.5, s: 2 }, { w: 1, s: 1 }, { w: 2, s: 2 }, { w: 1, s: 2.5 },
    { w: 3, s: 1 }, { w: 2, s: 1 }, { w: 3.5, s: 2 }, { w: 1, s: 1 },
    { w: 2, s: 2 }, { w: 2.5, s: 1 }, { w: 1, s: 2 }, { w: 2, s: 1 },
  ];
  let currentX = 6;

  return (
    <div className="flex flex-col items-center">
      <svg width="130" height="42" viewBox="0 0 130 42" className="overflow-visible">
        {bars.map((bar, idx) => {
          const x = currentX;
          currentX += bar.w + bar.s * 1.8;
          return <rect key={idx} x={x} y="2" width={bar.w} height="38" fill="#102744" rx="0.5" />;
        })}
      </svg>
      <span className="font-mono text-[9px] tracking-[0.25em] font-bold text-[#647084] mt-1">
        *{code}*
      </span>
    </div>
  );
};

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
  const [limitNotice, setLimitNotice] = useState<string | null>(null);
  const [mobileSummaryOpen, setMobileSummaryOpen] = useState(false);

  // Compute total price accurately from individual seat prices if configured
  const totalPrice = useMemo(() => {
    return selectedSeats.reduce((sum, code) => {
      const seat = trip.seats.find((s) => s.code === code);
      return sum + (seat ? seat.price : trip.price);
    }, 0);
  }, [selectedSeats, trip]);

  const isEnoughSeats = selectedSeats.length === passengersCount;

  const handleLimitExceeded = () => {
    setLimitNotice(`Bạn đã chọn đủ ${passengersCount} ghế theo yêu cầu. Hãy bỏ chọn ghế đang chọn để đổi chỗ.`);
    setTimeout(() => {
      setLimitNotice((prev) => (prev ? null : prev));
    }, 3500);
  };

  return (
    <div className="min-h-screen bg-[#F7F4EC] text-[#102744] flex flex-col pb-36 sm:pb-32">
      {/* ============================================================
          1. THANH THÔNG TIN GỌN PHÍA TRÊN & STEPPER
          ============================================================ */}
      <div className="bg-[#FFFEFA] border-b border-[#E5E3DC] sticky top-0 z-20 shadow-2xs">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Back button & Route title */}
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#F7F4EC] hover:bg-[#E5E3DC] text-xs font-bold text-[#102744] rounded-xl border border-[#CBD5E1] transition-all cursor-pointer shrink-0"
              title="Quay lại danh sách chuyến"
            >
              <ArrowLeft className="w-4 h-4 text-[#0097A7]" />
              <span className="hidden xs:inline">Quay lại</span>
            </button>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-serif font-bold text-base sm:text-lg text-[#102744] flex items-center gap-1.5 leading-tight">
                  <span>{trip.from}</span>
                  <span className="text-[#0097A7]">→</span>
                  <span>{trip.to}</span>
                </h1>
                <span className="text-[11px] font-bold text-[#0097A7] uppercase bg-[#E0F7FA] px-2 py-0.5 rounded-md hidden sm:inline">
                  {trip.vehicle.name}
                </span>
              </div>
              <p className="text-xs text-[#647084] mt-0.5">
                {trip.departureTime} • {bookingService.formatDisplayDate(dateStr)} • {passengersCount} hành khách
              </p>
            </div>
          </div>

          {/* Stepper matching flow */}
          <div className="flex items-center gap-2 sm:gap-3 text-xs font-semibold self-end sm:self-auto">
            <div className="flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              <span className="w-3.5 h-3.5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[9px] font-bold">✓</span>
              <span className="hidden sm:inline">1. Chọn chuyến</span>
            </div>
            <span className="text-[#CBD5E1]">→</span>
            <div className="flex items-center gap-1.5 text-white bg-[#0097A7] px-3 py-1 rounded-full shadow-xs">
              <span className="w-3.5 h-3.5 rounded-full bg-white text-[#0097A7] flex items-center justify-center text-[9px] font-bold">2</span>
              <span>2. Chọn chỗ</span>
            </div>
            <span className="text-[#CBD5E1]">→</span>
            <div className="flex items-center gap-1 text-[#647084] px-2 py-1">
              <span className="w-3.5 h-3.5 rounded-full bg-[#E5E3DC] text-[#647084] flex items-center justify-center text-[9px]">3</span>
              <span className="hidden sm:inline">3. Thanh toán</span>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================
          LIMIT EXCEEDED TOAST / NOTIFICATION
          ============================================================ */}
      <AnimatePresence>
        {limitNotice && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-[#102744] text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 text-xs max-w-md border border-cyan-400/40"
          >
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="flex-1 font-medium">{limitNotice}</span>
            <button
              type="button"
              onClick={() => setLimitNotice(null)}
              className="text-slate-400 hover:text-white p-0.5 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ============================================================
          2. KHUNG VÉ NGANG KHỔ LỚN CHỨA THÂN XE Ở GIỮA (~1180px)
          ============================================================ */}
      <div className="max-w-[1200px] w-full mx-auto px-3 sm:px-6 mt-5 sm:mt-7 flex-1">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="bg-[#FFFEFA] rounded-3xl border border-[#E5E3DC] shadow-md shadow-[#102744]/5 flex flex-col lg:flex-row relative"
        >
          {/* ==========================================================
              MAIN TICKET AREA (KHOANG XE TRUNG TÂM)
              ========================================================== */}
          <div className="flex-1 p-4 sm:p-6 lg:p-7">
            {/* Ticket Header Label */}
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#E5E3DC]">
              <div className="flex items-center gap-2">
                <TicketIcon className="w-4 h-4 text-[#0097A7]" />
                <span className="text-xs font-bold uppercase tracking-wider text-[#102744]">
                  Sơ đồ vị trí chỗ ngồi • {trip.operator}
                </span>
              </div>
              <span className="text-[11px] font-semibold text-[#0097A7] bg-[#E0F7FA] px-2.5 py-0.5 rounded-full">
                Mã: {trip.code}
              </span>
            </div>

            {/* Top-down Coach Vector Map */}
            <SeatMap
              trip={trip}
              selectedSeatCodes={selectedSeats}
              maxSelectable={passengersCount}
              onToggleSeat={onToggleSeat}
              onLimitExceeded={handleLimitExceeded}
            />
          </div>

          {/* ==========================================================
              PERFORATION DIVIDER & TICKET CUTOUTS
              ========================================================== */}
          <div className="hidden lg:block relative w-[2px] bg-transparent">
            {/* Dashed vertical perforated line */}
            <div className="absolute inset-y-0 left-0 w-px border-r-2 border-dashed border-[#CBD5E1]" />

            {/* Top Semi-circle Notch (Khuyết vé trên) */}
            <div
              className="absolute -top-3.5 -left-3 w-6 h-6 rounded-full bg-[#F7F4EC] border-b border-[#CBD5E1] pointer-events-none z-10"
              aria-hidden="true"
            />

            {/* Bottom Semi-circle Notch (Khuyết vé dưới) */}
            <div
              className="absolute -bottom-3.5 -left-3 w-6 h-6 rounded-full bg-[#F7F4EC] border-t border-[#CBD5E1] pointer-events-none z-10"
              aria-hidden="true"
            />
          </div>

          {/* ==========================================================
              RIGHT TICKET STUB (CUỐNG VÉ MINH HỌA)
              ========================================================== */}
          <div className="lg:w-[220px] shrink-0 bg-[#FAF8F5] p-5 sm:p-6 flex flex-col justify-between items-center text-center border-t lg:border-t-0 border-[#E5E3DC] rounded-b-3xl lg:rounded-b-none lg:rounded-r-3xl relative">
            {/* Top Ticket Stub Badge */}
            <div className="w-full">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#647084] block">
                DANAVA PASS
              </span>
              <span className="font-serif font-bold text-sm text-[#102744] block mt-0.5">
                Cuống vé chọn chỗ
              </span>
            </div>

            {/* Trip Details on Stub */}
            <div className="my-4 py-3 border-y border-[#E5E3DC] w-full space-y-1.5 text-xs">
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-[#647084]">Tuyến:</span>
                <span className="font-bold text-[#102744]">{trip.from} - {trip.to}</span>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-[#647084]">Giờ chạy:</span>
                <span className="font-bold text-[#0097A7]">{trip.departureTime}</span>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-[#647084]">Số khách:</span>
                <span className="font-bold text-[#102744]">{passengersCount} người</span>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-[#647084]">Đã chọn:</span>
                <span className="font-bold text-[#0097A7]">{selectedSeats.length} / {passengersCount}</span>
              </div>
            </div>

            {/* SVG Barcode Graphic */}
            <div className="w-full flex flex-col items-center">
              <SvgTicketBarcode code={`${trip.code}-${dateStr.replace(/-/g, '')}`} />
            </div>

            {/* Restrained Demo Disclaimer Badge */}
            <div className="mt-4 p-2 bg-amber-50 rounded-xl border border-amber-200/80 w-full text-center">
              <span className="text-[9.5px] font-bold text-amber-800 block uppercase tracking-wider">
                Phiên chọn ghế demo
              </span>
              <span className="text-[8.5px] text-amber-700 block leading-tight mt-0.5">
                Chưa có giá trị lên xe thực tế
              </span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ============================================================
          3. THANH TÓM TẮT VÀ NÚT TIẾP TỤC PHÍA DƯỚI (STICKY BOTTOM)
          ============================================================ */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-[#FFFEFA]/95 backdrop-blur-md border-t border-[#E5E3DC] shadow-lg shadow-[#102744]/10 pb-[env(safe-area-inset-bottom)]">
        {/* Mobile Expandable Drawer */}
        <AnimatePresence>
          {mobileSummaryOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="sm:hidden border-b border-[#E5E3DC] px-4 py-3 bg-[#FAF8F5] overflow-hidden"
            >
              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-[#647084]">
                  <span>Lộ trình:</span>
                  <span className="font-semibold text-[#102744]">{trip.from} → {trip.to} ({trip.departureTime})</span>
                </div>
                <div className="flex justify-between text-[#647084]">
                  <span>Phương tiện:</span>
                  <span className="font-semibold text-[#0097A7]">{trip.vehicle.name}</span>
                </div>
                <div className="flex justify-between text-[#647084] pt-1 border-t border-[#E5E3DC]">
                  <span>Ghế đang chọn:</span>
                  <span className="font-bold text-[#102744]">
                    {selectedSeats.length > 0 ? selectedSeats.join(', ') : 'Chưa chọn'}
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 py-3 sm:py-3.5">
          {/* Main Summary Row */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            {/* Left: Trip summary & Selected Seats Chips */}
            <div className="flex-1 flex flex-wrap items-center gap-3 sm:gap-4 w-full sm:w-auto">
              {/* Trip route pill */}
              <div className="hidden md:block">
                <span className="text-xs font-bold text-[#102744] block">
                  {trip.from} → {trip.to} • {trip.departureTime}
                </span>
                <span className="text-[11px] text-[#647084]">
                  {trip.vehicle.name} • {trip.operator}
                </span>
              </div>

              <div className="h-8 w-px bg-[#E5E3DC] hidden md:block" />

              {/* Selected seats list chips */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1">
                  <span className="text-xs font-bold text-[#102744] uppercase tracking-wider shrink-0">
                    Ghế ({selectedSeats.length}/{passengersCount}):
                  </span>
                  {/* Mobile toggle button */}
                  <button
                    type="button"
                    onClick={() => setMobileSummaryOpen(!mobileSummaryOpen)}
                    className="sm:hidden text-[#647084] hover:text-[#102744] p-0.5"
                    aria-label="Xem chi tiết tóm tắt"
                  >
                    {mobileSummaryOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {selectedSeats.length === 0 ? (
                  <span className="text-xs text-[#647084] italic bg-[#F7F4EC] px-2.5 py-1 rounded-lg border border-dashed border-[#CBD5E1]">
                    Vui lòng chọn {passengersCount} chỗ ngồi
                  </span>
                ) : (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <AnimatePresence mode="popLayout">
                      {selectedSeats.map((code) => {
                        const seat = trip.seats.find((s) => s.code === code);
                        const seatPrice = seat ? seat.price : trip.price;
                        return (
                          <motion.span
                            key={code}
                            layout
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.7 }}
                            transition={{ duration: 0.16 }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#E0F7FA] text-[#007887] border border-[#0097A7]/40 rounded-lg font-bold text-xs shadow-2xs"
                          >
                            <span>{code}</span>
                            <span className="text-[10px] font-normal text-[#0097A7]">
                              ({bookingService.formatCurrency(seatPrice)})
                            </span>
                            <button
                              type="button"
                              onClick={() => onRemoveSeatCode(code)}
                              className="hover:bg-[#0097A7] hover:text-white rounded-full p-0.5 transition-colors cursor-pointer ml-0.5"
                              aria-label={`Bỏ chọn ghế ${code}`}
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </motion.span>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Total Price & Proceed Button */}
            <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-[#E5E3DC]">
              {/* Total Price */}
              <div className="text-left sm:text-right">
                <span className="text-[10px] uppercase font-bold text-[#647084] block">
                  Tổng thanh toán
                </span>
                <span className="font-serif font-bold text-xl sm:text-2xl text-[#0097A7] leading-tight block">
                  {bookingService.formatCurrency(totalPrice)}
                </span>
              </div>

              {/* Proceed Action Button */}
              <button
                type="button"
                disabled={!isEnoughSeats}
                onClick={onProceedToPassenger}
                className="py-3 px-6 bg-[#0097A7] hover:bg-[#007887] active:scale-98 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-[#0097A7]/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shrink-0"
              >
                <span>Tiếp tục điền thông tin</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
