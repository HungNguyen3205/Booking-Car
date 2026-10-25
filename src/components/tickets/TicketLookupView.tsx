import React, { useState } from 'react';
import { bookingService } from '../../services/bookingService';
import type { Booking } from '../../types';
import { BoardingTicket } from './BoardingTicket';
import {
  Search,
  Ticket,
  Phone,
  ArrowLeft,
  AlertCircle,
  Info,
  RefreshCw,
  SearchX,
  ShieldCheck,
} from 'lucide-react';

interface TicketLookupViewProps {
  initialBookingCode?: string;
  initialPhone?: string;
  onBack: () => void;
  onNavigateHome: () => void;
}

export const TicketLookupView: React.FC<TicketLookupViewProps> = ({
  initialBookingCode,
  initialPhone,
  onBack,
  onNavigateHome,
}) => {
  // Requirement 5: Do NOT prefill fake seeds into inputs by default unless navigated with an actual initial booking code
  const [bookingCode, setBookingCode] = useState(initialBookingCode || '');
  const [phone, setPhone] = useState(initialPhone || '');
  const [isSearching, setIsSearching] = useState(false);
  const [foundBooking, setFoundBooking] = useState<Booking | null>(() => {
    if (initialBookingCode) {
      return bookingService.findBooking(initialBookingCode);
    }
    return null;
  });

  const [fieldErrors, setFieldErrors] = useState<{ code?: string; phone?: string }>({});
  const [notFoundQuery, setNotFoundQuery] = useState<{ code: string; phone?: string } | null>(null);

  const validate = (): boolean => {
    const errors: { code?: string; phone?: string } = {};
    const cleanCode = bookingCode.trim();
    const cleanPhone = phone.trim().replace(/\s+/g, '');

    if (!cleanCode) {
      errors.code = 'Vui lòng nhập mã đặt vé (ví dụ: DG2610258123 hoặc HT250426001).';
    } else if (cleanCode.length < 5) {
      errors.code = 'Mã đặt vé tối thiểu 5 ký tự.';
    }

    if (cleanPhone && !/^0[35789]\d{8}$/.test(cleanPhone)) {
      errors.phone = 'Số điện thoại không đúng định dạng (10 chữ số, bắt đầu bằng 03, 05, 07, 08, 09).';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleLookup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSearching(true);
    setNotFoundQuery(null);
    setFoundBooking(null);

    // Simulate realistic asynchronous database query latency
    setTimeout(() => {
      setIsSearching(false);
      const res = bookingService.findBooking(bookingCode, phone);

      if (res) {
        setFoundBooking(res);
      } else {
        // Requirement 5: Strictly never return seed or fake booking when not found!
        setNotFoundQuery({
          code: bookingCode.trim().toUpperCase(),
          phone: phone.trim() || undefined,
        });
      }
    }, 450);
  };

  const handleFillDemoTicket = (demoCode: string, demoPhone?: string) => {
    setBookingCode(demoCode);
    if (demoPhone) setPhone(demoPhone);
    setFieldErrors({});
    setNotFoundQuery(null);
  };

  // If a booking is found, display the verified BoardingTicket!
  if (foundBooking) {
    return (
      <div className="relative">
        <div className="max-w-4xl mx-auto px-4 pt-6">
          <button
            type="button"
            onClick={() => {
              setFoundBooking(null);
              setNotFoundQuery(null);
            }}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#102744] hover:text-[#0097A7] transition-colors bg-[#FFFEFA] px-3.5 py-2 rounded-full border border-[#E5E3DC] shadow-2xs hover:shadow-xs active:scale-95 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-[#0097A7]" />
            <span>Tra cứu mã vé khác</span>
          </button>
        </div>
        <BoardingTicket
          booking={foundBooking}
          onNavigateHome={onNavigateHome}
          onOpenLookup={() => {
            setFoundBooking(null);
            setNotFoundQuery(null);
          }}
        />
      </div>
    );
  }

  // Retrieve stored bookings list for tester guidance
  const availableDemoBookings = bookingService.getAllBookings();

  return (
    <div className="min-h-screen bg-[#F7F4EC] py-10 sm:py-16">
      <div className="max-w-xl mx-auto px-4 sm:px-6">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#102744] hover:text-[#0097A7] mb-6 transition-colors group cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          <span>Quay lại trang chủ</span>
        </button>

        <div className="bg-[#FFFEFA] rounded-3xl p-6 sm:p-8 border border-[#E5E3DC] shadow-sm">
          {/* Header Title with Brand Icon */}
          <div className="flex items-center gap-3.5 mb-5">
            <div className="w-12 h-12 rounded-2xl bg-[#E0F7FA] text-[#0097A7] flex items-center justify-center shrink-0">
              <Ticket className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#102744]">
                Tra cứu vé điện tử
              </h1>
              <p className="text-xs sm:text-sm text-[#647084] mt-0.5">
                Kiểm tra thông tin vé, lịch trình xuất bến hoặc xuất bản in PDF.
              </p>
            </div>
          </div>

          {/* NOT FOUND ALERT (Requirement 4 & 5) */}
          {notFoundQuery && (
            <div className="mb-6 p-4 sm:p-5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-900 animate-in fade-in duration-200">
              <div className="flex items-start gap-3">
                <SearchX className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div className="space-y-1.5">
                  <div className="font-bold text-sm text-rose-950">
                    Không tìm thấy thông tin vé!
                  </div>
                  <p className="leading-relaxed text-rose-800">
                    Hệ thống không tìm thấy vé nào khớp với mã{' '}
                    <span className="font-mono font-bold bg-rose-100 px-1.5 py-0.5 rounded text-rose-900">
                      {notFoundQuery.code}
                    </span>
                    {notFoundQuery.phone ? (
                      <>
                        {' '}và số điện thoại{' '}
                        <span className="font-mono font-bold">{notFoundQuery.phone}</span>.
                      </>
                    ) : (
                      '.'
                    )}
                  </p>
                  <div className="pt-2 border-t border-rose-200/80 text-[11px] text-rose-800">
                    <span className="font-semibold block mb-0.5">Gợi ý kiểm tra:</span>
                    <ul className="list-disc pl-4 space-y-0.5">
                      <li>Kiểm tra lại mã vé ghi trong email hoặc tin nhắn SMS xác nhận.</li>
                      <li>Nếu đã nhập số điện thoại, đảm bảo là số điện thoại lúc đặt vé.</li>
                      <li>Mã vé phân biệt các ký tự, không chứa khoảng cách.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Search Form */}
          <form onSubmit={handleLookup} className="space-y-4" noValidate>
            {/* Booking Code Input */}
            <div>
              <label
                htmlFor="lookup-code"
                className="block text-xs font-bold text-[#102744] uppercase tracking-wider mb-1.5"
              >
                Mã đặt vé (Booking Code) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Ticket className="w-4 h-4 text-[#647084] absolute left-3.5 top-3" />
                <input
                  id="lookup-code"
                  type="text"
                  value={bookingCode}
                  onChange={(e) => {
                    setBookingCode(e.target.value.toUpperCase());
                    if (fieldErrors.code) setFieldErrors((prev) => ({ ...prev, code: undefined }));
                    if (notFoundQuery) setNotFoundQuery(null);
                  }}
                  placeholder="Ví dụ: DG2610258123"
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm font-mono font-semibold uppercase tracking-wider focus:ring-2 focus:outline-hidden transition-all ${
                    fieldErrors.code
                      ? 'border-red-400 bg-red-50/50 text-red-900 focus:ring-red-400'
                      : 'border-[#E5E3DC] bg-[#F7F4EC]/60 focus:bg-[#FFFEFA] text-[#102744] focus:ring-[#0097A7]'
                  }`}
                  aria-invalid={!!fieldErrors.code}
                  aria-describedby={fieldErrors.code ? 'lookup-code-error' : undefined}
                />
              </div>
              {fieldErrors.code && (
                <p id="lookup-code-error" className="mt-1 text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{fieldErrors.code}</span>
                </p>
              )}
            </div>

            {/* Phone Number Input (Optional but verified) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="lookup-phone"
                  className="block text-xs font-bold text-[#102744] uppercase tracking-wider"
                >
                  Số điện thoại hành khách
                </label>
                <span className="text-[11px] text-[#647084]">Không bắt buộc</span>
              </div>
              <div className="relative">
                <Phone className="w-4 h-4 text-[#647084] absolute left-3.5 top-3" />
                <input
                  id="lookup-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    if (fieldErrors.phone) setFieldErrors((prev) => ({ ...prev, phone: undefined }));
                    if (notFoundQuery) setNotFoundQuery(null);
                  }}
                  placeholder="Ví dụ: 0905123456"
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm font-medium focus:ring-2 focus:outline-hidden transition-all ${
                    fieldErrors.phone
                      ? 'border-red-400 bg-red-50/50 text-red-900 focus:ring-red-400'
                      : 'border-[#E5E3DC] bg-[#F7F4EC]/60 focus:bg-[#FFFEFA] text-[#102744] focus:ring-[#0097A7]'
                  }`}
                  aria-invalid={!!fieldErrors.phone}
                  aria-describedby={fieldErrors.phone ? 'lookup-phone-error' : undefined}
                />
              </div>
              {fieldErrors.phone && (
                <p id="lookup-phone-error" className="mt-1 text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{fieldErrors.phone}</span>
                </p>
              )}
              <p className="mt-1 text-[11px] text-[#647084]">
                Nhập số điện thoại để tăng tính bảo mật và xác minh quyền sở hữu vé.
              </p>
            </div>

            {/* Submit Button with Loading State (Requirement 4) */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSearching}
                className="w-full py-3.5 bg-[#0097A7] hover:bg-[#007887] active:scale-98 text-white font-semibold text-sm rounded-xl shadow-md shadow-[#0097A7]/20 flex items-center justify-center gap-2 transition-all disabled:opacity-60 cursor-pointer"
              >
                {isSearching ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Đang kiểm tra hệ thống cơ sở dữ liệu vé…</span>
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

          {/* Demo Sandbox Assistance Panel (Clear honest separation, Requirement 5 & 7) */}
          <div className="mt-7 pt-5 border-t border-[#E5E3DC] space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-[#102744]">
              <Info className="w-4 h-4 text-[#0097A7]" />
              <span>Gợi ý thử nghiệm (Sandbox Demo)</span>
            </div>

            <p className="text-[11.5px] text-[#647084] leading-relaxed">
              Bạn có thể thử nghiệm tính năng tra cứu bằng các vé mẫu có sẵn trong phiên kiểm thử:
            </p>

            <div className="space-y-2">
              {availableDemoBookings.slice(0, 2).map((b) => (
                <div
                  key={b.id}
                  className="p-3 bg-[#FAF8F5] rounded-xl border border-[#E5E3DC] flex items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <div className="font-mono font-bold text-[#0097A7]">{b.id}</div>
                    <div className="text-[11px] text-[#647084]">
                      {b.trip.from} → {b.trip.to} • {b.passenger.fullName} ({b.passenger.phone})
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleFillDemoTicket(b.id, b.passenger.phone)}
                    className="px-2.5 py-1 text-[11px] font-semibold text-[#102744] hover:text-white bg-[#E0F7FA] hover:bg-[#0097A7] rounded-lg transition-colors cursor-pointer shrink-0"
                  >
                    Nạp mã này
                  </button>
                </div>
              ))}
            </div>

            <div className="text-[10.5px] text-[#647084] flex items-center gap-1.5 pt-1">
              <ShieldCheck className="w-3.5 h-3.5 text-[#0097A7] shrink-0" />
              <span>Dữ liệu vé được lưu trữ cục bộ và minh bạch trên trình duyệt của bạn.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
