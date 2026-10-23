import React, { useState } from 'react';
import type { Trip, PassengerInfo } from '../../types';
import { bookingService } from '../../services/bookingService';
import { ArrowLeft, ShieldAlert, CheckCircle2, QrCode, CreditCard, Wallet, AlertCircle, RefreshCw } from 'lucide-react';

interface DemoPaymentProps {
  trip: Trip;
  dateStr: string;
  selectedSeats: string[];
  passenger: PassengerInfo;
  onBack: () => void;
  onPaymentSuccess: (paymentMethod: 'vietqr' | 'momo' | 'vnpay' | 'credit_card') => void;
}

export const DemoPayment: React.FC<DemoPaymentProps> = ({
  trip,
  dateStr,
  selectedSeats,
  passenger,
  onBack,
  onPaymentSuccess,
}) => {
  const [method, setMethod] = useState<'vietqr' | 'momo' | 'vnpay' | 'credit_card'>('vietqr');
  const [simulateOutcome, setSimulateOutcome] = useState<'success' | 'failure'>('success');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const totalPrice = selectedSeats.length * trip.price;

  const handlePay = () => {
    setIsProcessing(true);
    setErrorMessage(null);

    // Simulate network delay
    setTimeout(() => {
      setIsProcessing(false);
      if (simulateOutcome === 'success') {
        onPaymentSuccess(method);
      } else {
        setErrorMessage(
          'Mô phỏng giao dịch thất bại: Thẻ/Tài khoản không đủ số dư hoặc phiên thanh toán hết hạn. Bạn có thể chọn lại kết quả "Thành công" và bấm thử lại.'
        );
      }
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-[#F7F4EC] pb-20">
      {/* Top Banner & Stepper */}
      <div className="bg-[#FFFEFA] border-b border-[#E5E3DC] py-6 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={onBack}
            disabled={isProcessing}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#102744] hover:text-[#0097A7] mb-3 transition-colors disabled:opacity-50"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Quay lại thông tin hành khách</span>
          </button>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#102744]">
                Thanh toán mô phỏng (Demo)
              </h1>
              <p className="text-xs sm:text-sm text-[#647084] mt-1">
                Lựa chọn phương thức thanh toán để xuất vé điện tử
              </p>
            </div>

            {/* Stepper */}
            <div className="flex items-center gap-2 sm:gap-4 text-xs font-semibold">
              <div className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full">
                <span className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">✓</span>
                <span>1. Chọn chuyến</span>
              </div>
              <span className="text-[#CBD5E1]">→</span>
              <div className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full">
                <span className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px]">✓</span>
                <span>2. Chọn chỗ</span>
              </div>
              <span className="text-[#CBD5E1]">→</span>
              <div className="flex items-center gap-1.5 text-white bg-[#0097A7] px-3.5 py-1.5 rounded-full shadow-xs">
                <span className="w-4 h-4 rounded-full bg-white text-[#0097A7] flex items-center justify-center text-[10px] font-bold">3</span>
                <span>3. Thanh toán</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        {/* MANDATORY DEMO NOTICE BANNER */}
        <div className="mb-6 bg-amber-50 border-2 border-amber-300 rounded-3xl p-5 flex items-start gap-4 shadow-xs">
          <div className="w-10 h-10 rounded-2xl bg-amber-200 text-amber-800 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-amber-900">
              BẢN DEMO — KHÔNG THU TIỀN THẬT
            </h4>
            <p className="text-xs text-amber-800 mt-1 leading-relaxed">
              Đây là giao diện mô phỏng hoàn chỉnh quy trình thanh toán vé xe. Hệ thống không liên kết cổng thanh toán thật, không yêu cầu nhập thông tin ngân hàng thực tế và vé xuất ra mang tính minh họa giao diện.
            </p>
          </div>
        </div>

        {errorMessage && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start justify-between text-xs text-red-700">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              className="font-bold ml-2 hover:opacity-75"
            >
              ✕
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Method Selector & Controls (~65% / 7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Payment Methods */}
            <div className="bg-[#FFFEFA] rounded-3xl p-6 sm:p-7 border border-[#E5E3DC] shadow-xs space-y-4">
              <h3 className="font-serif font-bold text-lg text-[#102744]">
                Chọn phương thức mô phỏng
              </h3>

              <div className="space-y-3">
                {/* VietQR Demo */}
                <label
                  className={`flex items-center gap-4 p-4 rounded-2xl border cursor-pointer transition-all ${
                    method === 'vietqr'
                      ? 'bg-[#E0F7FA]/50 border-[#0097A7] ring-1 ring-[#0097A7]'
                      : 'bg-[#F7F4EC]/60 border-[#E5E3DC] hover:border-[#0097A7]'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="vietqr"
                    checked={method === 'vietqr'}
                    onChange={() => setMethod('vietqr')}
                    className="text-[#0097A7] focus:ring-[#0097A7]"
                  />
                  <div className="w-10 h-10 rounded-xl bg-teal-100 text-[#0097A7] flex items-center justify-center shrink-0">
                    <QrCode className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-sm text-[#102744]">Quét mã VietQR Demo</div>
                    <div className="text-xs text-[#647084]">Quét mã qua ứng dụng ngân hàng di động</div>
                  </div>
                  <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                    Khuyên dùng
                  </span>
                </label>

                {/* MoMo Demo */}
                <label
                  className={`flex items-center gap-4 p-4 rounded-2xl border cursor-pointer transition-all ${
                    method === 'momo'
                      ? 'bg-[#E0F7FA]/50 border-[#0097A7] ring-1 ring-[#0097A7]'
                      : 'bg-[#F7F4EC]/60 border-[#E5E3DC] hover:border-[#0097A7]'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="momo"
                    checked={method === 'momo'}
                    onChange={() => setMethod('momo')}
                    className="text-[#0097A7] focus:ring-[#0097A7]"
                  />
                  <div className="w-10 h-10 rounded-xl bg-pink-100 text-pink-700 flex items-center justify-center shrink-0">
                    <Wallet className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-sm text-[#102744]">Ví điện tử MoMo Demo</div>
                    <div className="text-xs text-[#647084]">Mô phỏng thanh toán qua ví điện tử</div>
                  </div>
                </label>

                {/* Thẻ tín dụng / Ghi nợ Demo */}
                <label
                  className={`flex items-center gap-4 p-4 rounded-2xl border cursor-pointer transition-all ${
                    method === 'credit_card'
                      ? 'bg-[#E0F7FA]/50 border-[#0097A7] ring-1 ring-[#0097A7]'
                      : 'bg-[#F7F4EC]/60 border-[#E5E3DC] hover:border-[#0097A7]'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="credit_card"
                    checked={method === 'credit_card'}
                    onChange={() => setMethod('credit_card')}
                    className="text-[#0097A7] focus:ring-[#0097A7]"
                  />
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-sm text-[#102744]">Thẻ Visa / MasterCard Demo</div>
                    <div className="text-xs text-[#647084]">Mô phỏng cổng thanh toán quốc tế</div>
                  </div>
                </label>
              </div>
            </div>

            {/* Simulation Outcome Toggle as required in spec (Section 12) */}
            <div className="bg-[#FFFEFA] rounded-3xl p-6 border border-[#E5E3DC] shadow-xs">
              <h4 className="font-bold text-xs text-[#102744] uppercase tracking-wider mb-2">
                Kiểm thử kết quả mô phỏng (Dành cho Tester)
              </h4>
              <p className="text-xs text-[#647084] mb-3">
                Bạn có thể chủ động giả lập trường hợp thanh toán Thành công hoặc Thất bại để kiểm chứng xử lý lỗi của hệ thống.
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setSimulateOutcome('success')}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1.5 transition-all ${
                    simulateOutcome === 'success'
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-800 ring-2 ring-emerald-400'
                      : 'bg-[#F7F4EC] border-[#E5E3DC] text-[#647084]'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Mô phỏng Thành công</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSimulateOutcome('failure')}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1.5 transition-all ${
                    simulateOutcome === 'failure'
                      ? 'bg-red-50 border-red-500 text-red-800 ring-2 ring-red-400'
                      : 'bg-[#F7F4EC] border-[#E5E3DC] text-[#647084]'
                  }`}
                >
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  <span>Mô phỏng Thất bại</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Order Confirmation (~35% / 5 cols) */}
          <div className="lg:col-span-5 lg:sticky lg:top-24">
            <div className="bg-[#FFFEFA] rounded-3xl p-6 border border-[#E5E3DC] shadow-sm space-y-6">
              <h3 className="font-serif font-bold text-lg text-[#102744] pb-3 border-b border-[#E5E3DC]">
                Chi tiết thanh toán
              </h3>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between">
                  <span className="text-[#647084]">Người đặt vé:</span>
                  <strong className="text-[#102744]">{passenger.fullName}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#647084]">Số điện thoại:</span>
                  <strong className="text-[#102744]">{passenger.phone}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#647084]">Tuyến hành trình:</span>
                  <strong className="text-[#102744]">{trip.from} → {trip.to}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#647084]">Thời gian xuất bến:</span>
                  <strong className="text-[#0097A7]">{trip.departureTime}, {bookingService.formatDisplayDate(dateStr)}</strong>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#647084]">Vị trí ghế:</span>
                  <span className="font-bold text-[#0097A7]">{selectedSeats.join(', ')}</span>
                </div>
              </div>

              {/* Total amount highlight */}
              <div className="pt-4 border-t border-[#E5E3DC] space-y-2">
                <div className="flex justify-between items-baseline">
                  <span className="font-bold text-sm text-[#102744]">Số tiền cần thanh toán:</span>
                  <span className="font-serif font-bold text-2xl text-[#0097A7]">
                    {bookingService.formatCurrency(totalPrice)}
                  </span>
                </div>
                <p className="text-[11px] text-[#647084] italic">
                  * Giá vé đã bao gồm bảo hiểm hành khách và nước suối khăn lạnh.
                </p>
              </div>

              {/* Action Button */}
              <button
                type="button"
                disabled={isProcessing}
                onClick={handlePay}
                className="w-full py-4 bg-[#0097A7] hover:bg-[#007887] active:scale-98 text-white font-semibold text-sm rounded-xl shadow-lg shadow-[#0097A7]/25 flex items-center justify-center gap-2 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Đang xử lý giao dịch demo…</span>
                  </>
                ) : totalPrice === 0 ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                    <span>Xác nhận nhận vé (Miễn phí 0đ — Chuyến test)</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Thanh toán mô phỏng ({bookingService.formatCurrency(totalPrice)})</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
