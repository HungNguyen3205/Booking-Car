import React, { useState, useMemo } from 'react';
import type { Trip, PassengerInfo } from '../../types';
import { bookingService } from '../../services/bookingService';
import {
  paymentGateway,
  type PaymentMethodType,
  type PaymentTransactionState,
} from '../../services/paymentService';
import {
  ArrowLeft,
  ShieldAlert,
  CheckCircle2,
  QrCode,
  CreditCard,
  Wallet,
  AlertCircle,
  RefreshCw,
  XCircle,
  ShieldCheck,
  RotateCcw,
} from 'lucide-react';

interface DemoPaymentProps {
  trip: Trip;
  dateStr: string;
  selectedSeats: string[];
  passenger: PassengerInfo;
  onBack: () => void;
  onPaymentSuccess: (paymentMethod: PaymentMethodType) => void;
}

export const DemoPayment: React.FC<DemoPaymentProps> = ({
  trip,
  dateStr,
  selectedSeats,
  passenger,
  onBack,
  onPaymentSuccess,
}) => {
  const [method, setMethod] = useState<PaymentMethodType>('vietqr');
  const [simulateOutcome, setSimulateOutcome] = useState<
    'success' | 'insufficient_funds' | 'timeout' | 'user_cancel'
  >('success');
  const [paymentState, setPaymentState] = useState<PaymentTransactionState>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Compute total price accurately from individual seat prices if configured
  const totalPrice = useMemo(() => {
    return selectedSeats.reduce((sum, code) => {
      const seat = trip.seats.find((s) => s.code === code);
      return sum + (seat ? seat.price : trip.price);
    }, 0);
  }, [selectedSeats, trip]);

  const isProcessing = paymentState === 'processing';

  const handlePay = async () => {
    if (isProcessing) return;

    setPaymentState('processing');
    setErrorMessage(null);

    try {
      const result = await paymentGateway.initiatePayment(
        {
          bookingId: `BK_${Date.now()}`,
          tripId: trip.id,
          amount: totalPrice,
          provider: method,
          customerName: passenger.fullName,
          customerPhone: passenger.phone,
          customerEmail: passenger.email,
        },
        simulateOutcome
      );

      if (result.state === 'success') {
        setPaymentState('success');
        // Brief positive visual feedback before transition
        setTimeout(() => {
          onPaymentSuccess(method);
        }, 500);
      } else if (result.state === 'cancelled') {
        setPaymentState('cancelled');
        setErrorMessage(result.message);
      } else {
        setPaymentState('failed');
        setErrorMessage(result.message || 'Giao dịch thanh toán không thành công.');
      }
    } catch {
      setPaymentState('failed');
      setErrorMessage('Đã xảy ra lỗi kết nối mạng tới cổng thanh toán. Vui lòng thử lại.');
    }
  };

  const handleCancelSession = () => {
    if (isProcessing) return;
    setPaymentState('cancelled');
    setErrorMessage('Phiên giao dịch đã được hủy. Bạn có thể chọn phương thức khác hoặc thử lại.');
  };

  const handleResetSession = () => {
    setPaymentState('idle');
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen bg-[#F7F4EC] pb-24 sm:pb-28 text-[#102744]">
      {/* ============================================================
          1. STEPPER & BACK NAVIGATION
          ============================================================ */}
      <div className="bg-[#FFFEFA] border-b border-[#E5E3DC] sticky top-0 z-20 shadow-2xs">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={onBack}
              disabled={isProcessing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#F7F4EC] hover:bg-[#E5E3DC] text-xs font-bold text-[#102744] rounded-xl border border-[#CBD5E1] transition-all cursor-pointer shrink-0 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-[#0097A7]"
              title="Quay lại chỉnh sửa thông tin hành khách"
            >
              <ArrowLeft className="w-4 h-4 text-[#0097A7]" />
              <span className="hidden xs:inline">Thông tin hành khách</span>
            </button>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-serif font-bold text-base sm:text-lg text-[#102744] leading-tight">
                  Thanh toán mô phỏng (Demo Sandbox)
                </h1>
                <span className="text-[11px] font-bold text-amber-800 uppercase bg-amber-100 px-2 py-0.5 rounded-md hidden sm:inline">
                  Sandbox
                </span>
              </div>
              <p className="text-xs text-[#647084] mt-0.5">
                {trip.from} → {trip.to} • {trip.departureTime} • {bookingService.formatDisplayDate(dateStr)}
              </p>
            </div>
          </div>

          {/* Stepper */}
          <div className="flex items-center gap-2 sm:gap-3 text-xs font-semibold self-end sm:self-auto">
            <div className="flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              <span className="w-3.5 h-3.5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[9px] font-bold">✓</span>
              <span className="hidden sm:inline">1. Chuyến</span>
            </div>
            <span className="text-[#CBD5E1]">→</span>
            <div className="flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              <span className="w-3.5 h-3.5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[9px] font-bold">✓</span>
              <span className="hidden sm:inline">2. Ghế</span>
            </div>
            <span className="text-[#CBD5E1]">→</span>
            <div className="flex items-center gap-1.5 text-white bg-[#0097A7] px-3 py-1 rounded-full shadow-xs">
              <span className="w-3.5 h-3.5 rounded-full bg-white text-[#0097A7] flex items-center justify-center text-[9px] font-bold">3</span>
              <span>3. Thanh toán</span>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================
          2. MANDATORY DEMO NOTICE & STATUS BANNERS
          ============================================================ */}
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 mt-6 sm:mt-8 space-y-4">
        {/* Transparent Demo Sandbox Banner */}
        <div className="bg-amber-50 border-2 border-amber-300 rounded-3xl p-4 sm:p-5 flex items-start gap-3.5 shadow-xs">
          <div className="w-9 h-9 rounded-2xl bg-amber-200 text-amber-900 flex items-center justify-center shrink-0 mt-0.5">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div className="text-xs text-amber-900 space-y-1">
            <span className="font-bold text-sm block">
              CHẾ ĐỘ MÔ PHỎNG DEMO / SANDBOX — KHÔNG THU TIỀN THẬT
            </span>
            <p className="leading-relaxed text-amber-800">
              Giao diện thanh toán này hoạt động dưới dạng <strong>Sandbox Adapter</strong> để kiểm chứng trải nghiệm người dùng và luồng xuất vé. Hệ thống <strong>không kết nối trừ tiền từ tài khoản ngân hàng thực tế</strong>, và tuyệt đối <strong>không lưu trữ số thẻ, CVV hay bí mật tài chính vào localStorage</strong>.
            </p>
          </div>
        </div>

        {/* Processing State Banner */}
        {paymentState === 'processing' && (
          <div className="bg-teal-50 border border-teal-300 rounded-2xl p-4 flex items-center gap-3 text-xs text-teal-900 shadow-xs">
            <RefreshCw className="w-5 h-5 text-[#0097A7] animate-spin shrink-0" />
            <div>
              <span className="font-bold block text-sm">Đang kết nối cổng thanh toán mô phỏng…</span>
              <span className="text-teal-700">Vui lòng không tải lại trang hoặc bấm quay lại khi giao dịch đang được xử lý.</span>
            </div>
          </div>
        )}

        {/* Failed State Banner */}
        {paymentState === 'failed' && (
          <div className="bg-red-50 border border-red-300 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-red-900 shadow-xs">
            <div className="flex items-start sm:items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5 sm:mt-0" />
              <div>
                <span className="font-bold block text-sm">Giao dịch thanh toán không thành công</span>
                <span className="text-red-700 block mt-0.5">{errorMessage}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
              <button
                type="button"
                onClick={handlePay}
                className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Thử lại</span>
              </button>
              <button
                type="button"
                onClick={handleResetSession}
                className="px-3 py-1.5 bg-white text-red-800 border border-red-300 font-semibold text-xs rounded-xl hover:bg-red-100 cursor-pointer"
              >
                Đổi phương thức
              </button>
            </div>
          </div>
        )}

        {/* Cancelled State Banner */}
        {paymentState === 'cancelled' && (
          <div className="bg-slate-100 border border-slate-300 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-slate-800 shadow-xs">
            <div className="flex items-start sm:items-center gap-3">
              <XCircle className="w-5 h-5 text-slate-500 shrink-0 mt-0.5 sm:mt-0" />
              <div>
                <span className="font-bold block text-sm">Phiên giao dịch đã được hủy</span>
                <span className="text-slate-600 block mt-0.5">{errorMessage}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleResetSession}
              className="px-4 py-1.5 bg-[#0097A7] text-white font-bold text-xs rounded-xl hover:bg-[#007887] cursor-pointer shrink-0 self-end sm:self-auto shadow-xs"
            >
              Tiếp tục thanh toán
            </button>
          </div>
        )}

        {/* ============================================================
            3. MAIN PAYMENT OPTIONS & ORDER SUMMARY
            ============================================================ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start pt-2">
          {/* Left Column: Method Selector & Tester Controls (~65% / 7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Payment Methods */}
            <div className="bg-[#FFFEFA] rounded-3xl p-5 sm:p-7 border border-[#E5E3DC] shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#E5E3DC]">
                <h2 className="font-serif font-bold text-base sm:text-lg text-[#102744]">
                  Phương thức thanh toán mô phỏng
                </h2>
                <span className="text-[11px] text-[#647084]">
                  Chọn 1 phương thức để tiếp tục
                </span>
              </div>

              <div className="space-y-3">
                {/* VietQR Demo */}
                <label
                  className={`flex items-center gap-3.5 p-4 rounded-2xl border cursor-pointer transition-all ${
                    isProcessing ? 'opacity-60 cursor-not-allowed' : ''
                  } ${
                    method === 'vietqr'
                      ? 'bg-[#E0F7FA]/60 border-[#0097A7] ring-1 ring-[#0097A7]'
                      : 'bg-[#F7F4EC]/60 border-[#E5E3DC] hover:border-[#0097A7]'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="vietqr"
                    disabled={isProcessing}
                    checked={method === 'vietqr'}
                    onChange={() => {
                      setMethod('vietqr');
                      handleResetSession();
                    }}
                    className="text-[#0097A7] focus:ring-[#0097A7]"
                  />
                  <div className="w-10 h-10 rounded-xl bg-teal-100 text-[#0097A7] flex items-center justify-center shrink-0 shadow-2xs">
                    <QrCode className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-sm text-[#102744] flex items-center gap-2">
                      <span>Quét mã VietQR Demo</span>
                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                        Khuyên dùng
                      </span>
                    </div>
                    <div className="text-xs text-[#647084] mt-0.5">
                      Mở app ngân hàng bất kỳ để quét mã thanh toán 0 giây
                    </div>
                  </div>
                </label>

                {/* MoMo Demo */}
                <label
                  className={`flex items-center gap-3.5 p-4 rounded-2xl border cursor-pointer transition-all ${
                    isProcessing ? 'opacity-60 cursor-not-allowed' : ''
                  } ${
                    method === 'momo'
                      ? 'bg-[#E0F7FA]/60 border-[#0097A7] ring-1 ring-[#0097A7]'
                      : 'bg-[#F7F4EC]/60 border-[#E5E3DC] hover:border-[#0097A7]'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="momo"
                    disabled={isProcessing}
                    checked={method === 'momo'}
                    onChange={() => {
                      setMethod('momo');
                      handleResetSession();
                    }}
                    className="text-[#0097A7] focus:ring-[#0097A7]"
                  />
                  <div className="w-10 h-10 rounded-xl bg-pink-100 text-pink-700 flex items-center justify-center shrink-0 shadow-2xs">
                    <Wallet className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-sm text-[#102744]">Ví điện tử MoMo Sandbox</div>
                    <div className="text-xs text-[#647084] mt-0.5">
                      Mô phỏng thanh toán liên kết ví điện tử không thu phí
                    </div>
                  </div>
                </label>

                {/* VNPay Demo */}
                <label
                  className={`flex items-center gap-3.5 p-4 rounded-2xl border cursor-pointer transition-all ${
                    isProcessing ? 'opacity-60 cursor-not-allowed' : ''
                  } ${
                    method === 'vnpay'
                      ? 'bg-[#E0F7FA]/60 border-[#0097A7] ring-1 ring-[#0097A7]'
                      : 'bg-[#F7F4EC]/60 border-[#E5E3DC] hover:border-[#0097A7]'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="vnpay"
                    disabled={isProcessing}
                    checked={method === 'vnpay'}
                    onChange={() => {
                      setMethod('vnpay');
                      handleResetSession();
                    }}
                    className="text-[#0097A7] focus:ring-[#0097A7]"
                  />
                  <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 shadow-2xs">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-sm text-[#102744]">Cổng VNPay-QR Sandbox</div>
                    <div className="text-xs text-[#647084] mt-0.5">
                      Mô phỏng cổng thanh toán trực tuyến nội địa
                    </div>
                  </div>
                </label>

                {/* Thẻ quốc tế Visa/MasterCard Demo */}
                <label
                  className={`flex items-center gap-3.5 p-4 rounded-2xl border cursor-pointer transition-all ${
                    isProcessing ? 'opacity-60 cursor-not-allowed' : ''
                  } ${
                    method === 'credit_card'
                      ? 'bg-[#E0F7FA]/60 border-[#0097A7] ring-1 ring-[#0097A7]'
                      : 'bg-[#F7F4EC]/60 border-[#E5E3DC] hover:border-[#0097A7]'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="credit_card"
                    disabled={isProcessing}
                    checked={method === 'credit_card'}
                    onChange={() => {
                      setMethod('credit_card');
                      handleResetSession();
                    }}
                    className="text-[#0097A7] focus:ring-[#0097A7]"
                  />
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 shadow-2xs">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-sm text-[#102744]">Thẻ Visa / MasterCard Sandbox</div>
                    <div className="text-xs text-[#647084] mt-0.5">
                      Thanh toán một chạm • Tuyệt đối không lưu số thẻ / CVV vào thiết bị
                    </div>
                  </div>
                </label>
              </div>

              {/* Security Privacy Notice */}
              <div className="mt-4 p-3 bg-[#FAF8F5] rounded-xl border border-[#E5E3DC] flex items-center gap-2 text-[11px] text-[#647084]">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Bảo mật an toàn: Hệ thống không lưu bất kỳ số thẻ ngân hàng hay mã bí mật nào vào localStorage.</span>
              </div>
            </div>

            {/* Simulation Outcome Controller (Dành cho Tester & Reviewer) */}
            <div className="bg-[#FFFEFA] rounded-3xl p-5 sm:p-7 border border-[#E5E3DC] shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-xs text-[#102744] uppercase tracking-wider">
                  Kịch bản kiểm thử mô phỏng (Tester Sandbox Panel)
                </h3>
                <span className="text-[10px] text-[#0097A7] font-semibold bg-[#E0F7FA] px-2 py-0.5 rounded-md">
                  FE Mock Controller
                </span>
              </div>
              <p className="text-xs text-[#647084] leading-relaxed">
                Bạn có thể chủ động chọn kết quả phản hồi của cổng thanh toán để kiểm thử đầy đủ các trạng thái Thành công, Thất bại hoặc Hủy bỏ:
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => {
                    setSimulateOutcome('success');
                    handleResetSession();
                  }}
                  className={`py-2 px-2.5 rounded-xl text-xs font-semibold border flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                    simulateOutcome === 'success'
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-800 ring-2 ring-emerald-400'
                      : 'bg-[#F7F4EC] border-[#E5E3DC] text-[#647084] hover:text-[#102744]'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>1. Thành công</span>
                </button>

                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => {
                    setSimulateOutcome('insufficient_funds');
                    handleResetSession();
                  }}
                  className={`py-2 px-2.5 rounded-xl text-xs font-semibold border flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                    simulateOutcome === 'insufficient_funds'
                      ? 'bg-red-50 border-red-500 text-red-800 ring-2 ring-red-400'
                      : 'bg-[#F7F4EC] border-[#E5E3DC] text-[#647084] hover:text-[#102744]'
                  }`}
                >
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  <span>2. Hết số dư</span>
                </button>

                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => {
                    setSimulateOutcome('timeout');
                    handleResetSession();
                  }}
                  className={`py-2 px-2.5 rounded-xl text-xs font-semibold border flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                    simulateOutcome === 'timeout'
                      ? 'bg-amber-50 border-amber-500 text-amber-800 ring-2 ring-amber-400'
                      : 'bg-[#F7F4EC] border-[#E5E3DC] text-[#647084] hover:text-[#102744]'
                  }`}
                >
                  <RefreshCw className="w-4 h-4 text-amber-600" />
                  <span>3. Timeout mạng</span>
                </button>

                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => {
                    setSimulateOutcome('user_cancel');
                    handleResetSession();
                  }}
                  className={`py-2 px-2.5 rounded-xl text-xs font-semibold border flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                    simulateOutcome === 'user_cancel'
                      ? 'bg-slate-100 border-slate-500 text-slate-800 ring-2 ring-slate-400'
                      : 'bg-[#F7F4EC] border-[#E5E3DC] text-[#647084] hover:text-[#102744]'
                  }`}
                >
                  <XCircle className="w-4 h-4 text-slate-600" />
                  <span>4. Khách hủy</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Order Confirmation & Action (~35% / 5 cols) */}
          <div className="lg:col-span-5 lg:sticky lg:top-24">
            <div className="bg-[#FFFEFA] rounded-3xl p-6 border border-[#E5E3DC] shadow-sm space-y-6">
              <h3 className="font-serif font-bold text-base sm:text-lg text-[#102744] pb-3 border-b border-[#E5E3DC] flex items-center justify-between">
                <span>Chi tiết thanh toán</span>
                <span className="text-xs font-semibold text-[#0097A7] bg-[#E0F7FA] px-2 py-0.5 rounded-full">
                  #{trip.code}
                </span>
              </h3>

              {/* Passenger & Trip Summary */}
              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-[#647084]">Người đặt vé:</span>
                  <strong className="text-[#102744]">{passenger.fullName}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#647084]">Số điện thoại:</span>
                  <strong className="text-[#102744]">{passenger.phone}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#647084]">Tuyến xe:</span>
                  <strong className="text-[#102744]">{trip.from} → {trip.to}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#647084]">Thời gian xuất bến:</span>
                  <strong className="text-[#0097A7]">{trip.departureTime}, {bookingService.formatDisplayDate(dateStr)}</strong>
                </div>
                <div className="flex justify-between items-center pt-1 border-t border-[#E5E3DC]">
                  <span className="text-[#647084]">Ghế đã chọn ({selectedSeats.length}):</span>
                  <span className="font-bold text-[#0097A7]">{selectedSeats.join(', ')}</span>
                </div>
              </div>

              {/* Transparent Price Breakdown */}
              <div className="pt-4 border-t border-[#E5E3DC] space-y-2 text-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#647084] block mb-1">
                  Bảng kê viện phí minh bạch
                </span>

                <div className="flex justify-between text-[#647084]">
                  <span>Tiền vé ({selectedSeats.length} chỗ):</span>
                  <span className="font-semibold text-[#102744]">{bookingService.formatCurrency(totalPrice)}</span>
                </div>

                <div className="flex justify-between text-[#647084]">
                  <span>Phí dịch vụ & Bảo hiểm:</span>
                  <span className="text-emerald-700 font-semibold">0 ₫ (Miễn phí)</span>
                </div>

                <div className="flex justify-between items-baseline pt-3 border-t border-dashed border-[#CBD5E1]">
                  <span className="font-bold text-sm text-[#102744]">Số tiền cần thanh toán:</span>
                  <span className="font-serif font-bold text-2xl text-[#0097A7]">
                    {bookingService.formatCurrency(totalPrice)}
                  </span>
                </div>
              </div>

              {/* Action Buttons with double submit prevention */}
              <div className="space-y-2.5 pt-2">
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={handlePay}
                  className="w-full py-4 px-4 bg-[#0097A7] hover:bg-[#007887] active:scale-98 text-white font-bold text-sm rounded-xl shadow-md shadow-[#0097A7]/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer focus-visible:outline-2 focus-visible:outline-[#0097A7]"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Đang xử lý giao dịch demo…</span>
                    </>
                  ) : totalPrice === 0 ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                      <span>Xác nhận nhận vé (Miễn phí 0 ₫)</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Xác nhận thanh toán mô phỏng</span>
                    </>
                  )}
                </button>

                {/* Cancel Payment Session Button */}
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={handleCancelSession}
                  className="w-full py-2.5 px-4 bg-[#F7F4EC] hover:bg-[#E5E3DC] text-xs font-semibold text-[#647084] hover:text-[#102744] rounded-xl border border-[#CBD5E1] transition-colors cursor-pointer disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-[#102744]"
                >
                  Hủy phiên thanh toán này
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
