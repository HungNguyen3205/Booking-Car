import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import confetti from 'canvas-confetti';
import type { Booking } from '../../types';
import { bookingService } from '../../services/bookingService';
import { Printer, Mail, Search, ArrowRight, Info } from 'lucide-react';

interface BoardingTicketProps {
  booking: Booking;
  onNavigateHome: () => void;
  onOpenLookup: () => void;
}

export const BoardingTicket: React.FC<BoardingTicketProps> = ({
  booking,
  onNavigateHome,
  onOpenLookup,
}) => {
  useEffect(() => {
    // Subtle confetti burst
    try {
      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#0097A7', '#F3B54A', '#102744'],
      });
    } catch {
      // Ignored if canvas-confetti is not loaded
    }
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const handleEmailDemo = () => {
    alert(`[Mô phỏng demo] Bản vé điện tử đã được định dạng gửi tới email: ${booking.passenger.email}`);
  };

  // Find stop names
  const pickupStop = booking.trip.departureStops.find(
    (s) => s.id === booking.passenger.pickupStopId
  ) || booking.trip.departureStops[0];

  const dropoffStop = booking.trip.dropoffStops.find(
    (s) => s.id === booking.passenger.dropoffStopId
  ) || booking.trip.dropoffStops[0];

  return (
    <div className="min-h-screen bg-[#F7F4EC] relative overflow-hidden py-10 sm:py-16">
      {/* Background terminal scenery with soft opacity matching panel 04 */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-20 filter blur-xs">
        <img
          src="/assets/images/bus_terminal_station.jpg"
          alt="Bến xe khách cao cấp"
          className="w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-[#F7F4EC]/60" />
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 relative z-10">
        {/* Top Celebration Heading */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="text-center mb-8 no-print"
        >
          {/* Animated Green Checkmark with SVG stroke */}
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3 shadow-md">
            <svg className="w-10 h-10" viewBox="0 0 48 48" fill="none">
              <motion.circle
                cx="24"
                cy="24"
                r="22"
                stroke="#10B981"
                strokeWidth="3"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.6, ease: 'easeInOut' }}
              />
              <motion.path
                d="M14 24 L21 31 L34 17"
                stroke="#10B981"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.4, delay: 0.4, ease: 'easeOut' }}
              />
            </svg>
          </div>

          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#102744]">
            Đặt vé thành công!
          </h1>
          <p className="text-sm sm:text-base text-[#647084] mt-1">
            Cảm ơn bạn đã lựa chọn đồng hành cùng <strong className="text-[#0097A7]">HÀNH TRÌNH</strong>
          </p>
        </motion.div>

        {/* Central Master Ticket Card (Boarding Pass) */}
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="ticket-print-card bg-[#FFFEFA] rounded-3xl border-2 border-[#E5E3DC] shadow-2xl overflow-hidden relative"
        >
          {/* Ticket Header */}
          <div className="bg-[#102744] text-white p-6 sm:p-7 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#0097A7] flex items-center justify-center shadow-xs">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M4 12C4 8 8 6 12 12C16 18 20 16 20 12"
                    stroke="#FFFEFA"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                  <circle cx="5" cy="12" r="2" fill="#F3B54A" />
                  <circle cx="19" cy="12" r="2" fill="#FFFFFF" />
                </svg>
              </div>
              <div>
                <span className="font-serif font-bold text-xl tracking-wider block leading-tight">
                  HÀNH TRÌNH
                </span>
                <span className="text-[10px] tracking-widest text-[#E0F7FA] uppercase font-semibold">
                  Thẻ lên xe điện tử • Boarding Pass
                </span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[11px] text-slate-300 block">Mã đặt vé (Booking Code):</span>
              <span className="font-mono font-bold text-lg text-[#F3B54A] tracking-wider">
                {booking.id}
              </span>
            </div>
          </div>

          {/* Ticket Body Grid */}
          <div className="p-6 sm:p-8 grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
            {/* Left 8 cols: Journey & Passenger info */}
            <div className="md:col-span-8 space-y-6">
              {/* Route Banner */}
              <div className="flex items-center justify-between pb-4 border-b border-[#E5E3DC]">
                <div>
                  <span className="text-xs text-[#647084]">Điểm đi</span>
                  <div className="font-serif text-2xl font-bold text-[#102744]">
                    {booking.trip.from}
                  </div>
                  <p className="text-xs font-medium text-[#0097A7] mt-0.5">
                    {pickupStop?.name}
                  </p>
                </div>

                <div className="flex flex-col items-center px-4">
                  <span className="text-[11px] font-semibold text-[#647084] mb-1">
                    {booking.trip.duration}
                  </span>
                  <div className="w-20 sm:w-28 h-0.5 bg-[#CBD5E1] relative flex items-center justify-center">
                    <span className="w-2 h-2 rounded-full bg-[#0097A7] absolute left-0" />
                    <span className="text-xs text-[#0097A7]">→</span>
                    <span className="w-2 h-2 rounded-full bg-[#F3B54A] absolute right-0" />
                  </div>
                  <span className="text-[10px] text-emerald-600 font-semibold mt-1">Đã xác nhận</span>
                </div>

                <div className="text-right">
                  <span className="text-xs text-[#647084]">Điểm đến</span>
                  <div className="font-serif text-2xl font-bold text-[#102744]">
                    {booking.trip.to}
                  </div>
                  <p className="text-xs font-medium text-[#F3B54A] mt-0.5">
                    {dropoffStop?.name}
                  </p>
                </div>
              </div>

              {/* Specific Booking Specs Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <span className="text-[#647084] block mb-0.5">Ngày khởi hành:</span>
                  <strong className="text-[#102744] text-sm">
                    {bookingService.formatDisplayDate(booking.date)}
                  </strong>
                </div>

                <div>
                  <span className="text-[#647084] block mb-0.5">Giờ xuất bến:</span>
                  <strong className="text-[#0097A7] text-sm">
                    {booking.trip.departureTime}
                  </strong>
                </div>

                <div>
                  <span className="text-[#647084] block mb-0.5">Số ghế đã chọn:</span>
                  <div className="flex gap-1.5 flex-wrap">
                    {booking.selectedSeats.map((code) => (
                      <span key={code} className="px-2 py-0.5 bg-[#E0F7FA] text-[#007887] font-bold rounded-md">
                        {code}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="text-[#647084] block mb-0.5">Hành khách:</span>
                  <strong className="text-[#102744]">{booking.passenger.fullName}</strong>
                </div>

                <div>
                  <span className="text-[#647084] block mb-0.5">Số điện thoại:</span>
                  <strong className="text-[#102744]">{booking.passenger.phone}</strong>
                </div>

                <div>
                  <span className="text-[#647084] block mb-0.5">Tổng tiền vé:</span>
                  <strong className="text-[#0097A7] text-sm font-serif">
                    {bookingService.formatCurrency(booking.totalAmount)}
                  </strong>
                </div>
              </div>

              {/* Note or extra detail */}
              <div className="bg-[#F7F4EC] p-3 rounded-2xl text-[11px] text-[#647084] flex items-center gap-2 border border-[#E5E3DC]">
                <Info className="w-4 h-4 text-[#0097A7] shrink-0" />
                <span>
                  Quý khách vui lòng có mặt tại <strong>{pickupStop?.name}</strong> trước 20 phút giờ khởi hành.
                </span>
              </div>
            </div>

            {/* Right 4 cols: Perforation line + QR code for check-in */}
            <div className="md:col-span-4 flex flex-col items-center justify-center p-4 bg-[#F7F4EC]/40 rounded-2xl border border-[#E5E3DC] text-center">
              {/* QR Code */}
              <div className="p-3 bg-white rounded-xl shadow-xs border border-[#CBD5E1]">
                <QRCodeSVG
                  value={`HANHTRINH:${booking.id}:${booking.trip.from}-${booking.trip.to}:${booking.selectedSeats.join(',')}`}
                  size={120}
                  level="M"
                  includeMargin={false}
                />
              </div>

              <span className="font-mono text-xs font-bold text-[#102744] mt-3">
                {booking.id}
              </span>

              <p className="text-[10px] text-amber-700 font-medium mt-1 leading-tight max-w-[160px]">
                VÉ ĐIỆN TỬ DEMO
                <br />
                (Mã minh họa trải nghiệm)
              </p>
            </div>
          </div>

          {/* Ticket Footer Bar */}
          <div className="bg-[#F7F4EC] border-t border-[#E5E3DC] px-6 py-3 flex flex-wrap items-center justify-between text-[11px] text-[#647084]">
            <span>Đơn vị vận hành: {booking.trip.operator}</span>
            <span>Trạng thái: Đã thanh toán (Mô phỏng)</span>
          </div>
        </motion.div>

        {/* Action Buttons Row (Hidden when printing) */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3 sm:gap-4 no-print">
          {/* Print/Save Ticket */}
          <button
            type="button"
            onClick={handlePrint}
            className="px-6 py-3 bg-[#0097A7] hover:bg-[#007887] text-white font-semibold text-xs sm:text-sm rounded-xl shadow-md shadow-[#0097A7]/20 flex items-center gap-2 transition-all active:scale-95"
          >
            <Printer className="w-4 h-4" />
            <span>In / Lưu vé (PDF)</span>
          </button>

          {/* Send Email simulation */}
          <button
            type="button"
            onClick={handleEmailDemo}
            className="px-5 py-3 bg-[#FFFEFA] hover:bg-[#F7F4EC] text-[#102744] border border-[#E5E3DC] font-semibold text-xs sm:text-sm rounded-xl shadow-xs flex items-center gap-2 transition-all active:scale-95"
          >
            <Mail className="w-4 h-4 text-[#0097A7]" />
            <span>Gửi qua email</span>
          </button>

          {/* Lookup ticket */}
          <button
            type="button"
            onClick={onOpenLookup}
            className="px-5 py-3 bg-[#FFFEFA] hover:bg-[#F7F4EC] text-[#102744] border border-[#E5E3DC] font-semibold text-xs sm:text-sm rounded-xl shadow-xs flex items-center gap-2 transition-all active:scale-95"
          >
            <Search className="w-4 h-4 text-[#F3B54A]" />
            <span>Tra cứu vé</span>
          </button>

          {/* Return Home */}
          <button
            type="button"
            onClick={onNavigateHome}
            className="px-5 py-3 bg-[#102744] hover:bg-slate-800 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-xs flex items-center gap-2 transition-all active:scale-95"
          >
            <span>Về trang chủ</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
