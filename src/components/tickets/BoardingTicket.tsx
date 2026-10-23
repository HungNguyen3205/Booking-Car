import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import type { Booking } from '../../types';
import { bookingService } from '../../services/bookingService';
import {
  Printer,
  Search,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';

interface BoardingTicketProps {
  booking: Booking | null;
  onNavigateHome: () => void;
  onOpenLookup: () => void;
}

// Decorative vertical barcode strip for the left edge of the desktop ticket
const LeftVerticalBarcode: React.FC<{ code: string }> = ({ code }) => {
  return (
    <div
      className="hidden md:flex flex-col items-center justify-between w-10 sm:w-11 bg-[#FAF8F5] border-r border-[#E5E3DC] py-5 select-none shrink-0"
      aria-hidden="true"
    >
      <div className="rotate-90 origin-center whitespace-nowrap text-[8px] font-mono tracking-[0.25em] text-[#647084] font-bold">
        {code}
      </div>

      <div className="my-auto flex flex-col gap-1 items-center opacity-65">
        <span className="w-5 h-[1.5px] bg-[#102744]" />
        <span className="w-5 h-[3px] bg-[#102744]" />
        <span className="w-5 h-[1px] bg-[#102744]" />
        <span className="w-5 h-[2.5px] bg-[#102744]" />
        <span className="w-5 h-[1px] bg-[#102744]" />
        <span className="w-5 h-[3.5px] bg-[#102744]" />
        <span className="w-5 h-[2px] bg-[#102744]" />
        <span className="w-5 h-[1px] bg-[#102744]" />
        <span className="w-5 h-[3px] bg-[#102744]" />
        <span className="w-5 h-[1.5px] bg-[#102744]" />
        <span className="w-5 h-[2px] bg-[#102744]" />
      </div>

      <span className="text-[7.5px] uppercase font-bold tracking-widest text-[#647084] -rotate-90 block">
        PASS
      </span>
    </div>
  );
};

export const BoardingTicket: React.FC<BoardingTicketProps> = ({
  booking,
  onNavigateHome,
  onOpenLookup,
}) => {
  const shouldReduceMotion = useReducedMotion();

  // Guard clause: Missing booking
  if (!booking) {
    return (
      <div className="min-h-screen bg-[#F7F4EC] flex items-center justify-center p-6 text-center">
        <div className="bg-[#FFFEFA] p-8 rounded-3xl border border-[#E5E3DC] shadow-sm max-w-md w-full">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
          <h2 className="font-serif text-2xl font-bold text-[#102744]">
            Chưa có thông tin vé
          </h2>
          <p className="text-xs sm:text-sm text-[#647084] mt-2 mb-6 leading-relaxed">
            Hệ thống chưa ghi nhận phiên đặt vé hợp lệ. Quý khách vui lòng quay lại tìm chuyến xe để thực hiện đặt chỗ.
          </p>
          <button
            type="button"
            onClick={onNavigateHome}
            className="w-full py-3 bg-[#0097A7] hover:bg-[#007887] text-white font-bold text-sm rounded-xl shadow-md shadow-[#0097A7]/20 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <span>Quay lại trang chủ</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  // Safe stop resolutions
  const pickupStop =
    booking.trip.departureStops?.find((s) => s.id === booking.passenger.pickupStopId) ||
    booking.trip.departureLocation;

  const dropoffStop =
    booking.trip.dropoffStops?.find((s) => s.id === booking.passenger.dropoffStopId) ||
    booking.trip.arrivalLocation;

  // QR Code payload (safe demo verification URL/payload, no PII)
  const qrPayload = `https://danava.bus/lookup?code=${booking.id}`;

  return (
    <div className="min-h-screen bg-[#F7F4EC] py-8 sm:py-14 px-4 sm:px-6 flex flex-col items-center justify-center">
      <div className="w-full max-w-[1020px]">
        {/* ============================================================
            MAIN MASTER BOARDING PASS TICKET CARD (Desktop ~1000px)
            ============================================================ */}
        <motion.div
          initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: shouldReduceMotion ? 0.04 : 0.45, ease: 'easeOut' }}
          className="ticket-print-card bg-[#FFFEFA] rounded-3xl border border-[#E5E3DC] shadow-lg shadow-[#102744]/6 overflow-hidden flex flex-col md:flex-row relative"
        >
          {/* Decorative Left Edge Barcode (Desktop) */}
          <LeftVerticalBarcode code={booking.id} />

          {/* ==========================================================
              MAIN CONTENT AREA (~72% on desktop, Ivory White)
              ========================================================== */}
          <div className="flex-1 p-6 sm:p-8 lg:p-9 flex flex-col justify-between">
            {/* Top Celebration & Header Unit */}
            <div>
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-3.5">
                  {/* Teal Animated Checkmark Icon */}
                  <div className="w-12 h-12 rounded-full bg-[#E0F7FA] border border-[#0097A7]/30 flex items-center justify-center shrink-0 shadow-2xs">
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
                      <motion.path
                        d="M5 13l4 4L19 7"
                        fill="transparent"
                        stroke="#0097A7"
                        strokeWidth="2.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        initial={shouldReduceMotion ? { pathLength: 1 } : { pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: shouldReduceMotion ? 0.04 : 0.45, ease: 'easeOut' }}
                      />
                    </svg>
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#102744] tracking-tight">
                        Đặt vé thành công
                      </h1>
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full border border-amber-300">
                        Vé demo
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-[#647084] mt-0.5">
                      Vé điện tử của bạn đã sẵn sàng.
                    </p>
                  </div>
                </div>

                <div className="text-right hidden sm:block">
                  <span className="text-[10px] uppercase font-bold text-[#647084] block">
                    Mã đặt vé
                  </span>
                  <span className="font-mono font-bold text-base text-[#102744] tracking-wider block">
                    {booking.id}
                  </span>
                </div>
              </div>

              {/* Journey Route Highlight */}
              <div className="bg-[#FAF8F5] p-4 rounded-2xl border border-[#E5E3DC] mb-6 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 sm:gap-3">
                  <span className="font-serif font-bold text-lg sm:text-xl text-[#102744]">
                    {booking.trip.from}
                  </span>
                  <span className="text-[#0097A7] font-bold text-base sm:text-lg">→</span>
                  <span className="font-serif font-bold text-lg sm:text-xl text-[#102744]">
                    {booking.trip.to}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#0097A7] bg-[#E0F7FA] px-2.5 py-1 rounded-lg">
                    {booking.trip.vehicle.name}
                  </span>
                  <span className="text-xs text-[#647084] font-medium hidden sm:inline">
                    • {booking.trip.operator}
                  </span>
                </div>
              </div>
            </div>

            {/* Structured 2-Column Ticket Information Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6 text-xs border-t border-[#E5E3DC] pt-5">
              {/* Left Column */}
              <div className="space-y-3.5">
                <div>
                  <span className="text-[10.5px] uppercase font-semibold text-[#647084] block">
                    Ngày khởi hành
                  </span>
                  <span className="text-sm font-bold text-[#102744] block mt-0.5">
                    {bookingService.formatDisplayDate(booking.date)}
                  </span>
                </div>

                <div>
                  <span className="text-[10.5px] uppercase font-semibold text-[#647084] block">
                    Giờ xuất bến
                  </span>
                  <span className="text-sm font-bold text-[#0097A7] block mt-0.5">
                    {booking.trip.departureTime} (Thời lượng: {booking.trip.duration})
                  </span>
                </div>

                <div>
                  <span className="text-[10.5px] uppercase font-semibold text-[#647084] block">
                    Điểm đón
                  </span>
                  <span className="text-xs font-bold text-[#102744] block mt-0.5">
                    {pickupStop?.name}
                  </span>
                  <span className="text-[11px] text-[#647084] block mt-0.5 line-clamp-2">
                    {pickupStop?.address}
                  </span>
                </div>

                <div>
                  <span className="text-[10.5px] uppercase font-semibold text-[#647084] block">
                    Hành khách
                  </span>
                  <span className="text-xs font-bold text-[#102744] block mt-0.5 break-words">
                    {booking.passenger.fullName} ({booking.selectedSeats.length} người)
                  </span>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-3.5">
                <div>
                  <span className="text-[10.5px] uppercase font-semibold text-[#647084] block">
                    Vị trí ghế đã chọn
                  </span>
                  <div className="flex gap-1.5 flex-wrap mt-0.5">
                    {booking.selectedSeats.map((code) => (
                      <span
                        key={code}
                        className="px-2.5 py-0.5 bg-[#E0F7FA] text-[#007887] font-mono font-bold rounded-md text-xs border border-[#0097A7]/30"
                      >
                        {code}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="text-[10.5px] uppercase font-semibold text-[#647084] block">
                    Điểm trả dự kiến
                  </span>
                  <span className="text-xs font-bold text-[#102744] block mt-0.5">
                    {dropoffStop?.name}
                  </span>
                  <span className="text-[11px] text-[#647084] block mt-0.5 line-clamp-2">
                    {dropoffStop?.address}
                  </span>
                </div>

                <div>
                  <span className="text-[10.5px] uppercase font-semibold text-[#647084] block">
                    Tổng thanh toán
                  </span>
                  <span className="font-serif font-bold text-base sm:text-lg text-[#0097A7] block mt-0.5">
                    {bookingService.formatCurrency(booking.totalAmount)}
                  </span>
                </div>

                <div>
                  <span className="text-[10.5px] uppercase font-semibold text-[#647084] block">
                    Trạng thái thanh toán
                  </span>
                  <span className="inline-flex items-center gap-1 text-emerald-700 text-xs font-bold mt-0.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    Đã thanh toán (Mô phỏng demo)
                  </span>
                </div>
              </div>
            </div>

            {/* Note & Demo Disclaimer */}
            <div className="mt-6 pt-3 border-t border-[#E5E3DC] flex items-center justify-between gap-2 text-[11px] text-[#647084]">
              <span className="italic flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-[#0097A7] shrink-0 inline" />
                Vé minh họa — không có giá trị lên xe thực tế.
              </span>
              <span className="font-mono text-[10px] hidden sm:inline">
                DANAVA-{booking.id}
              </span>
            </div>
          </div>

          {/* ==========================================================
              PERFORATION SEPARATOR & CUTOUT NOTCHES
              ========================================================== */}
          <div className="relative w-full md:w-[2px] bg-transparent">
            {/* Dashed vertical line (desktop) or horizontal (mobile) */}
            <div className="hidden md:block absolute inset-y-0 left-0 w-px border-r-2 border-dashed border-[#CBD5E1]" />
            <div className="md:hidden w-full border-t-2 border-dashed border-[#CBD5E1]" />

            {/* Semi-circular notches */}
            <div
              className="hidden md:block absolute -top-3.5 -left-3 w-6 h-6 rounded-full bg-[#F7F4EC] border-b border-[#CBD5E1] pointer-events-none z-10"
              aria-hidden="true"
            />
            <div
              className="hidden md:block absolute -bottom-3.5 -left-3 w-6 h-6 rounded-full bg-[#F7F4EC] border-t border-[#CBD5E1] pointer-events-none z-10"
              aria-hidden="true"
            />

            {/* Mobile notches */}
            <div
              className="md:hidden absolute -left-3 -top-3 w-6 h-6 rounded-full bg-[#F7F4EC] border-r border-[#CBD5E1] pointer-events-none z-10"
              aria-hidden="true"
            />
            <div
              className="md:hidden absolute -right-3 -top-3 w-6 h-6 rounded-full bg-[#F7F4EC] border-l border-[#CBD5E1] pointer-events-none z-10"
              aria-hidden="true"
            />
          </div>

          {/* ==========================================================
              RIGHT QR TICKET STUB (~28% on desktop, Warm Cream/Amber)
              ========================================================== */}
          <div className="md:w-[260px] lg:w-[280px] shrink-0 bg-[#FAF5EA] p-6 sm:p-7 flex flex-col justify-between items-center text-center rounded-b-3xl md:rounded-b-none md:rounded-r-3xl">
            {/* Stub Header */}
            <div>
              <span className="text-[10px] uppercase font-extrabold tracking-widest text-[#647084] block">
                DANAVA BOARDING
              </span>
              <span className="font-serif font-bold text-sm text-[#102744] block mt-0.5">
                Cuống vé điện tử
              </span>
            </div>

            {/* High-Contrast QR Code */}
            <motion.div
              initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: shouldReduceMotion ? 0.04 : 0.35, delay: 0.15 }}
              className="my-4 p-3 bg-white rounded-2xl border border-[#E5E3DC] shadow-xs flex flex-col items-center justify-center"
            >
              <QRCodeSVG
                value={qrPayload}
                size={136}
                level="M"
                includeMargin={true}
              />
            </motion.div>

            {/* Electronic Ticket Code Info */}
            <div className="w-full">
              <span className="text-[10.5px] uppercase font-bold tracking-wider text-[#647084] block">
                Mã vé điện tử
              </span>
              <span className="font-mono font-bold text-sm text-[#102744] block mt-0.5">
                {booking.id}
              </span>
              <span className="text-[10px] text-[#647084] block mt-1">
                Quét để kiểm tra vé demo
              </span>
            </div>
          </div>
        </motion.div>

        {/* ============================================================
            ACTION BUTTONS ROW (Hidden when printing)
            ============================================================ */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5 no-print w-full">
          {/* Secondary Outline Button: Lưu vé / In PDF */}
          <button
            type="button"
            onClick={handlePrint}
            title="In hoặc lưu tệp PDF vé điện tử"
            className="w-full sm:w-auto px-6 py-3 bg-[#FFFEFA] hover:bg-[#FAF8F5] active:scale-98 text-[#102744] border-2 border-[#CBD5E1] hover:border-[#0097A7] font-bold text-xs sm:text-sm rounded-xl shadow-2xs flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4 text-[#0097A7]" />
            <span>Lưu vé</span>
          </button>

          {/* Primary Teal Button: Vé của tôi */}
          <button
            type="button"
            onClick={onOpenLookup}
            className="w-full sm:w-auto px-7 py-3 bg-[#0097A7] hover:bg-[#007887] active:scale-98 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-[#0097A7]/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Search className="w-4 h-4" />
            <span>Vé của tôi</span>
          </button>
        </div>

        {/* Tertiary return home link */}
        <div className="mt-4 text-center no-print">
          <button
            type="button"
            onClick={onNavigateHome}
            className="text-xs text-[#647084] hover:text-[#0097A7] font-semibold underline underline-offset-4 transition-colors cursor-pointer"
          >
            Về trang chủ
          </button>
        </div>
      </div>
    </div>
  );
};
