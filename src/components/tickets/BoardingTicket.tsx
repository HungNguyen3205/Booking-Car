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
  Clock,
  MapPin,
  User,
  Phone,
  Mail,
  FileText,
  CreditCard,
  Bus,
  Info,
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
      className="hidden lg:flex flex-col items-center justify-between w-11 bg-[#FAF8F5] border-r border-[#E5E3DC] py-6 select-none shrink-0"
      aria-hidden="true"
    >
      <div className="rotate-90 origin-center whitespace-nowrap text-[8.5px] font-mono tracking-[0.25em] text-[#647084] font-bold">
        {code}
      </div>

      <div className="my-auto flex flex-col gap-1 items-center opacity-70">
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

  // Verifiable QR Code payload (direct URL to verify/lookup this booking)
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://danavago.vn';
  const qrPayload = `${baseUrl}/?step=lookup&code=${encodeURIComponent(booking.id)}`;

  // Payment method human label
  const paymentMethodLabels: Record<string, string> = {
    vietqr: 'VietQR (Quét mã Napas 24/7)',
    momo: 'Ví điện tử MoMo',
    vnpay: 'Cổng thanh toán VNPAY-QR',
    credit_card: 'Thẻ thanh toán Quốc tế',
  };

  const paymentMethodDisplay = paymentMethodLabels[booking.paymentMethod] || booking.paymentMethod;

  // Payment status badge
  const isPaymentCompleted = booking.paymentStatus === 'completed';

  return (
    <div className="min-h-screen bg-[#F7F4EC] py-8 sm:py-12 px-4 sm:px-6 flex flex-col items-center justify-center">
      <div className="w-full max-w-[1020px]">
        {/* ============================================================
            MAIN MASTER BOARDING PASS TICKET CARD
            ============================================================ */}
        <motion.div
          initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: shouldReduceMotion ? 0.04 : 0.45, ease: 'easeOut' }}
          className="ticket-print-card bg-[#FFFEFA] rounded-3xl border border-[#E5E3DC] shadow-lg shadow-[#102744]/6 overflow-hidden flex flex-col lg:flex-row relative"
        >
          {/* Decorative Left Edge Barcode (Desktop) */}
          <LeftVerticalBarcode code={booking.id} />

          {/* ==========================================================
              MAIN CONTENT AREA (~72% on desktop, Ivory White)
              ========================================================== */}
          <div className="flex-1 p-6 sm:p-8 lg:p-9 flex flex-col justify-between">
            {/* Top Celebration & Header Unit */}
            <div>
              <div className="flex items-start justify-between gap-3 mb-5">
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
                    <div className="flex items-center gap-2 flex-wrap">
                      <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#102744] tracking-tight">
                        Vé điện tử
                      </h1>
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-900 px-2.5 py-0.5 rounded-full border border-amber-300">
                        Demo Sandbox
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-[#647084] mt-0.5">
                      Vé điện tử xác nhận đặt chỗ trên nền tảng DANAVA GO.
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[10px] uppercase font-bold text-[#647084] block tracking-wider">
                    Mã đặt vé
                  </span>
                  <span className="font-mono font-bold text-base sm:text-lg text-[#0097A7] tracking-wider block">
                    {booking.id}
                  </span>
                  <span className="text-[10px] text-[#647084] block">
                    {new Date(booking.createdAt).toLocaleDateString('vi-VN')}
                  </span>
                </div>
              </div>

              {/* Journey Route Highlight */}
              <div className="bg-[#FAF8F5] p-4 rounded-2xl border border-[#E5E3DC] mb-6 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 sm:gap-3">
                  <span className="font-serif font-bold text-lg sm:text-2xl text-[#102744]">
                    {booking.trip.from}
                  </span>
                  <span className="text-[#0097A7] font-bold text-lg sm:text-xl">→</span>
                  <span className="font-serif font-bold text-lg sm:text-2xl text-[#102744]">
                    {booking.trip.to}
                  </span>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-[#0097A7] bg-[#E0F7FA] px-3 py-1 rounded-lg border border-[#0097A7]/20 flex items-center gap-1.5">
                    <Bus className="w-3.5 h-3.5" />
                    <span>{booking.trip.vehicle.name}</span>
                  </span>
                  <span className="text-xs text-[#647084] font-semibold">
                    • {booking.trip.operator}
                  </span>
                </div>
              </div>
            </div>

            {/* Structured 2-Column Ticket Information Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8 text-xs border-t border-[#E5E3DC] pt-5">
              {/* Left Column: Schedule & Stops */}
              <div className="space-y-4">
                <div className="flex items-start gap-2.5">
                  <Clock className="w-4 h-4 text-[#0097A7] shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10.5px] uppercase font-bold text-[#647084] block tracking-wider">
                      Thời gian khởi hành
                    </span>
                    <span className="text-sm font-bold text-[#102744] block mt-0.5">
                      {booking.trip.departureTime} • {bookingService.formatDisplayDate(booking.date)}
                    </span>
                    <span className="text-[11px] text-[#647084]">
                      Thời gian hành trình dự kiến: {booking.trip.duration}
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10.5px] uppercase font-bold text-[#647084] block tracking-wider">
                      Điểm đón khách
                    </span>
                    <span className="text-xs font-bold text-[#102744] block mt-0.5">
                      {pickupStop?.name}
                    </span>
                    <span className="text-[11px] text-[#647084] block mt-0.5">
                      {pickupStop?.address}
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10.5px] uppercase font-bold text-[#647084] block tracking-wider">
                      Điểm trả khách
                    </span>
                    <span className="text-xs font-bold text-[#102744] block mt-0.5">
                      {dropoffStop?.name}
                    </span>
                    <span className="text-[11px] text-[#647084] block mt-0.5">
                      {dropoffStop?.address}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Column: Passenger & Payment Information */}
              <div className="space-y-4">
                <div className="flex items-start gap-2.5">
                  <User className="w-4 h-4 text-[#0097A7] shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10.5px] uppercase font-bold text-[#647084] block tracking-wider">
                      Hành khách đại diện
                    </span>
                    <span className="text-xs font-bold text-[#102744] block mt-0.5">
                      {booking.passenger.fullName} ({booking.selectedSeats.length} vé)
                    </span>
                    <div className="flex items-center gap-3 mt-1 text-[11px] text-[#647084] flex-wrap">
                      <span className="inline-flex items-center gap-1">
                        <Phone className="w-3 h-3 text-[#0097A7]" />
                        <span className="font-mono font-medium">{booking.passenger.phone}</span>
                      </span>
                      {booking.passenger.email && (
                        <span className="inline-flex items-center gap-1">
                          <Mail className="w-3 h-3 text-[#0097A7]" />
                          <span>{booking.passenger.email}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <span className="text-[10.5px] uppercase font-bold text-[#647084] block tracking-wider mb-1">
                    Vị trí ghế đã chọn
                  </span>
                  <div className="flex gap-1.5 flex-wrap">
                    {booking.selectedSeats.map((code) => (
                      <span
                        key={code}
                        className="px-2.5 py-1 bg-[#E0F7FA] text-[#007887] font-mono font-bold rounded-lg text-xs border border-[#0097A7]/30"
                      >
                        Ghế {code}
                      </span>
                    ))}
                  </div>
                </div>

                {booking.passenger.note && (
                  <div className="flex items-start gap-2 p-2.5 bg-[#FAF8F5] rounded-xl border border-[#E5E3DC] text-[11px]">
                    <FileText className="w-3.5 h-3.5 text-[#647084] shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-[#102744]">Ghi chú: </span>
                      <span className="text-[#647084]">{booking.passenger.note}</span>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-2.5 pt-2 border-t border-[#E5E3DC]">
                  <CreditCard className="w-4 h-4 text-[#0097A7] shrink-0 mt-0.5" />
                  <div className="w-full">
                    <div className="flex items-center justify-between">
                      <span className="text-[10.5px] uppercase font-bold text-[#647084] block tracking-wider">
                        Tổng thanh toán
                      </span>
                      <span className="font-serif font-bold text-base sm:text-lg text-[#0097A7]">
                        {bookingService.formatCurrency(booking.totalAmount)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] mt-0.5">
                      <span className="text-[#647084]">{paymentMethodDisplay}</span>
                      <span
                        className={`inline-flex items-center gap-1 font-bold ${
                          isPaymentCompleted ? 'text-emerald-700' : 'text-amber-700'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isPaymentCompleted ? 'bg-emerald-500' : 'bg-amber-500'
                          }`}
                        />
                        {isPaymentCompleted ? 'Đã thanh toán (Sandbox)' : 'Chờ thanh toán'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Note & Demo Disclaimer */}
            <div className="mt-6 pt-3.5 border-t border-[#E5E3DC] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-[#647084]">
              <span className="italic flex items-center gap-1.5 text-amber-900 bg-amber-50 sm:bg-transparent px-2.5 sm:px-0 py-1 sm:py-0 rounded-lg">
                <ShieldCheck className="w-3.5 h-3.5 text-[#0097A7] shrink-0 inline" />
                Bản vé demo thử nghiệm giao diện — không có giá trị lên xe thực tế.
              </span>
              <span className="font-mono text-[10px] text-[#647084]">
                DANAVA-REF: {booking.id}
              </span>
            </div>
          </div>

          {/* ==========================================================
              PERFORATION SEPARATOR & CUTOUT NOTCHES
              ========================================================== */}
          <div className="relative w-full lg:w-[2px] bg-transparent">
            {/* Dashed vertical line (desktop) or horizontal (mobile) */}
            <div className="hidden lg:block absolute inset-y-0 left-0 w-px border-r-2 border-dashed border-[#CBD5E1]" />
            <div className="lg:hidden w-full border-t-2 border-dashed border-[#CBD5E1]" />

            {/* Semi-circular notches (desktop) */}
            <div
              className="hidden lg:block absolute -top-3.5 -left-3 w-6 h-6 rounded-full bg-[#F7F4EC] border-b border-[#CBD5E1] pointer-events-none z-10"
              aria-hidden="true"
            />
            <div
              className="hidden lg:block absolute -bottom-3.5 -left-3 w-6 h-6 rounded-full bg-[#F7F4EC] border-t border-[#CBD5E1] pointer-events-none z-10"
              aria-hidden="true"
            />

            {/* Mobile notches */}
            <div
              className="lg:hidden absolute -left-3 -top-3 w-6 h-6 rounded-full bg-[#F7F4EC] border-r border-[#CBD5E1] pointer-events-none z-10"
              aria-hidden="true"
            />
            <div
              className="lg:hidden absolute -right-3 -top-3 w-6 h-6 rounded-full bg-[#F7F4EC] border-l border-[#CBD5E1] pointer-events-none z-10"
              aria-hidden="true"
            />
          </div>

          {/* ==========================================================
              RIGHT QR TICKET STUB (~28% on desktop, Warm Cream/Amber)
              ========================================================== */}
          <div className="lg:w-[280px] shrink-0 bg-[#FAF5EA] p-6 sm:p-7 flex flex-col justify-between items-center text-center rounded-b-3xl lg:rounded-b-none lg:rounded-r-3xl">
            {/* Stub Header */}
            <div>
              <span className="text-[10px] uppercase font-extrabold tracking-widest text-[#647084] block">
                DANAVA GO
              </span>
              <span className="font-serif font-bold text-sm text-[#102744] block mt-0.5">
                Cuống vé điện tử
              </span>
            </div>

            {/* Verifiable High-Contrast QR Code */}
            <motion.div
              initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: shouldReduceMotion ? 0.04 : 0.35, delay: 0.15 }}
              className="my-3 p-3 bg-white rounded-2xl border border-[#E5E3DC] shadow-xs flex flex-col items-center justify-center"
            >
              <QRCodeSVG
                value={qrPayload}
                size={132}
                level="M"
                includeMargin={true}
              />
              <span className="text-[9px] font-mono text-[#647084] font-bold mt-1 tracking-wider uppercase">
                QR DEMO • VERIFIED
              </span>
            </motion.div>

            {/* Electronic Ticket Code Info & Caution */}
            <div className="w-full space-y-1.5">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#647084] block">
                  Mã tra cứu vé
                </span>
                <span className="font-mono font-bold text-sm text-[#102744] block">
                  {booking.id}
                </span>
              </div>

              <div className="p-2 bg-[#F7F4EC] rounded-xl border border-[#E5E3DC] text-[9.5px] text-[#647084] leading-tight flex items-start gap-1.5 text-left">
                <Info className="w-3.5 h-3.5 text-[#0097A7] shrink-0 mt-0.5" />
                <span>Quét mã QR để mở trang tra cứu và xác thực vé trực tiếp trên hệ thống.</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Print-only footer for clean physical paper printouts */}
        <div className="hidden print:block text-center mt-6 text-[10px] text-slate-500 pt-4 border-t border-slate-300">
          DANAVA GO — Nền tảng đặt vé xe khách cao cấp • Bản in vé điện tử thử nghiệm • Mã vé: {booking.id} • Hotline: 1900 8886
        </div>

        {/* ============================================================
            ACTION BUTTONS ROW (Hidden when printing via .no-print)
            ============================================================ */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5 no-print w-full">
          {/* Secondary Outline Button: Lưu vé / In PDF */}
          <button
            type="button"
            onClick={handlePrint}
            title="In hoặc xuất vé ra tệp PDF"
            className="w-full sm:w-auto px-6 py-3 bg-[#FFFEFA] hover:bg-[#FAF8F5] active:scale-98 text-[#102744] border-2 border-[#CBD5E1] hover:border-[#0097A7] font-bold text-xs sm:text-sm rounded-xl shadow-2xs flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4 text-[#0097A7]" />
            <span>Lưu vé / In PDF</span>
          </button>

          {/* Primary Teal Button: Tra cứu vé khác */}
          <button
            type="button"
            onClick={onOpenLookup}
            className="w-full sm:w-auto px-7 py-3 bg-[#0097A7] hover:bg-[#007887] active:scale-98 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-[#0097A7]/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Search className="w-4 h-4" />
            <span>Tra cứu vé khác</span>
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
