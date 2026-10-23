import React, { useState } from 'react';
import { bookingService } from '../../services/bookingService';
import type { Booking } from '../../types';
import { BoardingTicket } from './BoardingTicket';
import { Search, Ticket, Phone, ArrowLeft, AlertCircle, Info, RefreshCw } from 'lucide-react';

interface TicketLookupViewProps {
  initialBookingCode?: string;
  onBack: () => void;
  onNavigateHome: () => void;
}

export const TicketLookupView: React.FC<TicketLookupViewProps> = ({
  initialBookingCode,
  onBack,
  onNavigateHome,
}) => {
  const [bookingCode, setBookingCode] = useState(initialBookingCode || 'HT250426001');
  const [phone, setPhone] = useState(initialBookingCode ? '' : '0905123456');
  const [isSearching, setIsSearching] = useState(false);
  const [foundBooking, setFoundBooking] = useState<Booking | null>(() => {
    if (initialBookingCode) {
      return bookingService.findBooking(initialBookingCode);
    }
    return null;
  });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLookup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingCode.trim()) {
      setErrorMessage('Vui lòng nhập mã đặt vé (ví dụ: HT250426001)');
      return;
    }

    setIsSearching(true);
    setErrorMessage(null);
    setFoundBooking(null);

    setTimeout(() => {
      setIsSearching(false);
      const res = bookingService.findBooking(bookingCode, phone);
      if (res) {
        setFoundBooking(res);
      } else {
        setErrorMessage(
          `Không tìm thấy vé tương ứng với mã "${bookingCode}". Vui lòng kiểm tra lại mã đặt vé và số điện thoại đã đăng ký.`
        );
      }
    }, 600);
  };

  // If a booking is found, display the full BoardingTicket!
  if (foundBooking) {
    return (
      <div className="relative">
        <div className="max-w-4xl mx-auto px-4 pt-6">
          <button
            type="button"
            onClick={() => setFoundBooking(null)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#102744] hover:text-[#0097A7] transition-colors bg-[#FFFEFA] px-3 py-1.5 rounded-full border border-[#E5E3DC]"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Tra cứu mã vé khác</span>
          </button>
        </div>
        <BoardingTicket
          booking={foundBooking}
          onNavigateHome={onNavigateHome}
          onOpenLookup={() => setFoundBooking(null)}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F4EC] py-12 sm:py-16">
      <div className="max-w-xl mx-auto px-4 sm:px-6">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#102744] hover:text-[#0097A7] mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại trang chủ</span>
        </button>

        <div className="bg-[#FFFEFA] rounded-3xl p-6 sm:p-8 border border-[#E5E3DC] shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-[#E0F7FA] text-[#0097A7] flex items-center justify-center mb-4">
            <Ticket className="w-6 h-6" />
          </div>

          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#102744]">
            Tra cứu vé điện tử
          </h1>
          <p className="text-xs sm:text-sm text-[#647084] mt-1 mb-6 leading-relaxed">
            Nhập mã đặt vé và số điện thoại để kiểm tra lịch trình, tải lại vé hoặc xuất bản in PDF.
          </p>

          {/* Quick Demo Pre-fill Hint */}
          <div className="mb-6 p-3 bg-[#F7F4EC] rounded-2xl border border-[#E5E3DC] text-xs text-[#647084] flex items-start gap-2.5">
            <Info className="w-4 h-4 text-[#0097A7] shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-[#102744]">Gợi ý vé mẫu:</span> Mã vé{' '}
              <button
                type="button"
                onClick={() => {
                  setBookingCode('HT250426001');
                  setPhone('0905123456');
                }}
                className="font-mono font-bold text-[#0097A7] hover:underline"
              >
                HT250426001
              </button>{' '}
              (SĐT: 0905123456) từ ảnh phác thảo đã được tạo sẵn trong hệ thống demo.
            </div>
          </div>

          {errorMessage && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleLookup} className="space-y-4">
            <div>
              <label htmlFor="lookup-code" className="block text-xs font-bold text-[#102744] uppercase tracking-wider mb-1.5">
                Mã đặt vé (Booking Code) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Ticket className="w-4 h-4 text-[#647084] absolute left-3.5 top-3" />
                <input
                  id="lookup-code"
                  type="text"
                  value={bookingCode}
                  onChange={(e) => setBookingCode(e.target.value.toUpperCase())}
                  placeholder="Ví dụ: HT250426001"
                  className="w-full pl-10 pr-4 py-2.5 bg-[#F7F4EC]/60 focus:bg-[#FFFEFA] rounded-xl border border-[#E5E3DC] text-sm font-mono font-semibold text-[#102744] focus:ring-2 focus:ring-[#0097A7] focus:outline-hidden uppercase"
                />
              </div>
            </div>

            <div>
              <label htmlFor="lookup-phone" className="block text-xs font-bold text-[#102744] uppercase tracking-wider mb-1.5">
                Số điện thoại liên hệ (Tùy chọn)
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-[#647084] absolute left-3.5 top-3" />
                <input
                  id="lookup-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Ví dụ: 0905123456"
                  className="w-full pl-10 pr-4 py-2.5 bg-[#F7F4EC]/60 focus:bg-[#FFFEFA] rounded-xl border border-[#E5E3DC] text-sm font-medium text-[#102744] focus:ring-2 focus:ring-[#0097A7] focus:outline-hidden"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSearching}
                className="w-full py-3.5 bg-[#0097A7] hover:bg-[#007887] active:scale-98 text-white font-semibold text-sm rounded-xl shadow-md shadow-[#0097A7]/20 flex items-center justify-center gap-2 transition-all disabled:opacity-60"
              >
                {isSearching ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Đang tìm kiếm thông tin vé…</span>
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    <span>Tra cứu vé ngay</span>
                  </>
                )}
              </button>
            </div>
          </form>

          <p className="mt-6 text-center text-[11px] text-[#647084]">
            * Dữ liệu vé demo được lưu trữ an toàn trong trình duyệt (LocalStorage).
          </p>
        </div>
      </div>
    </div>
  );
};
