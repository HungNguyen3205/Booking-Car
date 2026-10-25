import React, { useState } from 'react';
import type { Trip, PassengerInfo } from '../../types';
import { bookingService } from '../../services/bookingService';
import { ArrowLeft, ArrowRight, User, Phone, Mail, MapPin, AlertCircle } from 'lucide-react';

interface PassengerFormProps {
  trip: Trip;
  dateStr: string;
  selectedSeats: string[];
  initialPassenger?: PassengerInfo;
  onBack: () => void;
  onSubmit: (passenger: PassengerInfo) => void;
}

export const PassengerForm: React.FC<PassengerFormProps> = ({
  trip,
  dateStr,
  selectedSeats,
  initialPassenger,
  onBack,
  onSubmit,
}) => {
  const [fullName, setFullName] = useState(initialPassenger?.fullName || '');
  const [phone, setPhone] = useState(initialPassenger?.phone || '');
  const [email, setEmail] = useState(initialPassenger?.email || '');
  const [pickupStopId, setPickupStopId] = useState(
    initialPassenger?.pickupStopId || trip.departureStops[0]?.id || ''
  );
  const [dropoffStopId, setDropoffStopId] = useState(
    initialPassenger?.dropoffStopId || trip.dropoffStops[0]?.id || ''
  );
  const [note, setNote] = useState(initialPassenger?.note || '');
  const [agreedTerms, setAgreedTerms] = useState(initialPassenger?.agreedTerms ?? true);

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!fullName.trim() || fullName.trim().length < 3) {
      errs.fullName = 'Vui lòng nhập họ và tên hành khách (ít nhất 3 ký tự)';
    }

    const cleanPhone = phone.trim().replace(/\s+/g, '');
    const phoneRegex = /^(0|\+84)[3|5|7|8|9][0-9]{8}$/;
    if (!cleanPhone) {
      errs.phone = 'Vui lòng nhập số điện thoại liên hệ';
    } else if (!phoneRegex.test(cleanPhone)) {
      errs.phone = 'Số điện thoại không hợp lệ (ví dụ: 0905123456)';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      errs.email = 'Vui lòng nhập email nhận vé điện tử';
    } else if (!emailRegex.test(email.trim())) {
      errs.email = 'Định dạng email không hợp lệ';
    }

    if (!pickupStopId) {
      errs.pickupStopId = 'Vui lòng chọn điểm đón';
    }

    if (!dropoffStopId) {
      errs.dropoffStopId = 'Vui lòng chọn điểm trả';
    }

    if (!agreedTerms) {
      errs.agreedTerms = 'Bạn cần đồng ý với điều khoản đặt vé';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    onSubmit({
      fullName: fullName.trim(),
      phone: phone.trim(),
      email: email.trim(),
      pickupStopId,
      dropoffStopId,
      note: note.trim(),
      agreedTerms,
    });
  };

  const totalPrice = selectedSeats.length * trip.price;

  return (
    <div className="min-h-screen bg-[#F7F4EC] pb-20">
      {/* Stepper Header */}
      <div className="bg-[#FFFEFA] border-b border-[#E5E3DC] py-6 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#102744] hover:text-[#0097A7] mb-3 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Quay lại chọn ghế</span>
          </button>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#102744]">
                Thông tin hành khách & Điểm đón
              </h1>
              <p className="text-xs sm:text-sm text-[#647084] mt-1">
                Điền thông tin chính xác để nhận vé điện tử và số điện thoại liên hệ lên xe
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
                <span>2. Ghế: {selectedSeats.join(', ')}</span>
              </div>
              <span className="text-[#CBD5E1]">→</span>
              <div className="flex items-center gap-1.5 text-white bg-[#0097A7] px-3.5 py-1.5 rounded-full shadow-xs">
                <span className="w-4 h-4 rounded-full bg-white text-[#0097A7] flex items-center justify-center text-[10px] font-bold">3</span>
                <span>3. Thông tin</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Form Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <form onSubmit={handleSubmit} noValidate>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Input Fields (~65% / 7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              {/* Contact Information Card */}
              <div className="bg-[#FFFEFA] rounded-3xl p-6 sm:p-7 border border-[#E5E3DC] shadow-xs space-y-4">
                <h3 className="font-serif font-bold text-lg text-[#102744] flex items-center gap-2">
                  <User className="w-5 h-5 text-[#0097A7]" />
                  <span>Người đại diện đặt vé</span>
                </h3>

                {/* Full name */}
                <div>
                  <label htmlFor="passenger-name" className="block text-xs font-bold text-[#102744] uppercase tracking-wider mb-1.5">
                    Họ và tên hành khách <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="passenger-name"
                    type="text"
                    value={fullName}
                    onChange={(e) => {
                      setFullName(e.target.value);
                      if (errors.fullName) setErrors({ ...errors, fullName: '' });
                    }}
                    placeholder="Ví dụ: Nguyễn Văn Hùng"
                    className={`w-full px-4 py-2.5 bg-[#F7F4EC]/60 focus:bg-[#FFFEFA] rounded-xl border text-sm font-medium text-[#102744] focus:ring-2 focus:ring-[#0097A7] focus:outline-hidden transition-all ${
                      errors.fullName ? 'border-red-400 bg-red-50/50' : 'border-[#E5E3DC]'
                    }`}
                  />
                  {errors.fullName && (
                    <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {errors.fullName}
                    </p>
                  )}
                </div>

                {/* Phone & Email Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Phone */}
                  <div>
                    <label htmlFor="passenger-phone" className="block text-xs font-bold text-[#102744] uppercase tracking-wider mb-1.5">
                      Số điện thoại <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-[#647084] absolute left-3.5 top-3" />
                      <input
                        id="passenger-phone"
                        type="tel"
                        value={phone}
                        onChange={(e) => {
                          setPhone(e.target.value);
                          if (errors.phone) setErrors({ ...errors, phone: '' });
                        }}
                        placeholder="0905123456"
                        className={`w-full pl-10 pr-4 py-2.5 bg-[#F7F4EC]/60 focus:bg-[#FFFEFA] rounded-xl border text-sm font-medium text-[#102744] focus:ring-2 focus:ring-[#0097A7] focus:outline-hidden transition-all ${
                          errors.phone ? 'border-red-400 bg-red-50/50' : 'border-[#E5E3DC]'
                        }`}
                      />
                    </div>
                    {errors.phone && (
                      <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        {errors.phone}
                      </p>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <label htmlFor="passenger-email" className="block text-xs font-bold text-[#102744] uppercase tracking-wider mb-1.5">
                      Email nhận vé điện tử <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-[#647084] absolute left-3.5 top-3" />
                      <input
                        id="passenger-email"
                        type="email"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          if (errors.email) setErrors({ ...errors, email: '' });
                        }}
                        placeholder="hung.nguyen@example.com"
                        className={`w-full pl-10 pr-4 py-2.5 bg-[#F7F4EC]/60 focus:bg-[#FFFEFA] rounded-xl border text-sm font-medium text-[#102744] focus:ring-2 focus:ring-[#0097A7] focus:outline-hidden transition-all ${
                          errors.email ? 'border-red-400 bg-red-50/50' : 'border-[#E5E3DC]'
                        }`}
                      />
                    </div>
                    {errors.email && (
                      <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        {errors.email}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Pickup & Dropoff Stops Selection */}
              <div className="bg-[#FFFEFA] rounded-3xl p-6 sm:p-7 border border-[#E5E3DC] shadow-xs space-y-5">
                <h3 className="font-serif font-bold text-lg text-[#102744] flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-[#0097A7]" />
                  <span>Điểm đón và trả khách</span>
                </h3>

                {/* Pickup stops */}
                <div>
                  <label className="block text-xs font-bold text-[#102744] uppercase tracking-wider mb-2">
                    Điểm đón tại {trip.from}
                  </label>
                  <div className="space-y-2">
                    {trip.departureStops.map((stop) => (
                      <label
                        key={stop.id}
                        className={`flex items-start gap-3 p-3 rounded-2xl border cursor-pointer transition-all ${
                          pickupStopId === stop.id
                            ? 'bg-[#E0F7FA]/50 border-[#0097A7] ring-1 ring-[#0097A7]'
                            : 'bg-[#F7F4EC]/60 border-[#E5E3DC] hover:border-[#0097A7]'
                        }`}
                      >
                        <input
                          type="radio"
                          name="pickupStop"
                          value={stop.id}
                          checked={pickupStopId === stop.id}
                          onChange={() => setPickupStopId(stop.id)}
                          className="mt-1 text-[#0097A7] focus:ring-[#0097A7]"
                        />
                        <div className="flex-1 text-xs">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-[#102744]">{stop.name}</span>
                            <span className="text-[#0097A7] font-semibold">{stop.time}</span>
                          </div>
                          <p className="text-[#647084] mt-0.5">{stop.address}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Dropoff stops */}
                <div className="pt-2">
                  <label className="block text-xs font-bold text-[#102744] uppercase tracking-wider mb-2">
                    Điểm trả tại {trip.to}
                  </label>
                  <div className="space-y-2">
                    {trip.dropoffStops.map((stop) => (
                      <label
                        key={stop.id}
                        className={`flex items-start gap-3 p-3 rounded-2xl border cursor-pointer transition-all ${
                          dropoffStopId === stop.id
                            ? 'bg-[#E0F7FA]/50 border-[#0097A7] ring-1 ring-[#0097A7]'
                            : 'bg-[#F7F4EC]/60 border-[#E5E3DC] hover:border-[#0097A7]'
                        }`}
                      >
                        <input
                          type="radio"
                          name="dropoffStop"
                          value={stop.id}
                          checked={dropoffStopId === stop.id}
                          onChange={() => setDropoffStopId(stop.id)}
                          className="mt-1 text-[#0097A7] focus:ring-[#0097A7]"
                        />
                        <div className="flex-1 text-xs">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-[#102744]">{stop.name}</span>
                            <span className="text-[#0097A7] font-semibold">{stop.time}</span>
                          </div>
                          <p className="text-[#647084] mt-0.5">{stop.address}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Optional note */}
                <div className="pt-2">
                  <label htmlFor="passenger-note" className="block text-xs font-bold text-[#102744] uppercase tracking-wider mb-1.5">
                    Ghi chú cho tài xế (Không bắt buộc)
                  </label>
                  <textarea
                    id="passenger-note"
                    rows={2}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Ví dụ: Có mang theo thú cưng, hành lý cồng kềnh hoặc đón người cao tuổi..."
                    className="w-full px-4 py-2.5 bg-[#F7F4EC]/60 focus:bg-[#FFFEFA] rounded-xl border border-[#E5E3DC] text-xs font-medium text-[#102744] focus:ring-2 focus:ring-[#0097A7] focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Agreement Checkbox */}
              <div className="p-4 bg-[#FFFEFA] rounded-2xl border border-[#E5E3DC] space-y-2">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreedTerms}
                    onChange={(e) => {
                      setAgreedTerms(e.target.checked);
                      if (errors.agreedTerms) setErrors({ ...errors, agreedTerms: '' });
                    }}
                    className="mt-0.5 rounded border-[#CBD5E1] text-[#0097A7] focus:ring-[#0097A7] w-4 h-4 cursor-pointer"
                  />
                  <span className="text-xs text-[#647084]">
                    Tôi đồng ý với các <strong>Quy định hủy đổi vé</strong> và chính sách vận chuyển của DANAVA GO. Thông tin đặt vé là bản mô phỏng giao diện không thu phí thực tế.
                  </span>
                </label>
                {errors.agreedTerms && (
                  <p className="text-xs text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {errors.agreedTerms}
                  </p>
                )}
              </div>
            </div>

            {/* Right Column: Order Summary & Checkout Action (~35% / 5 cols) */}
            <div className="lg:col-span-5 lg:sticky lg:top-24">
              <div className="bg-[#FFFEFA] rounded-3xl p-6 border border-[#E5E3DC] shadow-sm space-y-6">
                <h3 className="font-serif font-bold text-lg text-[#102744] pb-3 border-b border-[#E5E3DC]">
                  Tóm tắt đặt chỗ
                </h3>

                <div className="space-y-3 text-xs">
                  <div className="flex justify-between">
                    <span className="text-[#647084]">Tuyến xe:</span>
                    <strong className="text-[#102744]">{trip.from} → {trip.to}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#647084]">Ngày khởi hành:</span>
                    <strong className="text-[#102744]">{bookingService.formatDisplayDate(dateStr)}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#647084]">Giờ xuất bến:</span>
                    <strong className="text-[#0097A7]">{trip.departureTime}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#647084]">Dòng xe:</span>
                    <span className="text-[#102744]">{trip.vehicle.name}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-[#E5E3DC]">
                    <span className="text-[#647084]">Vị trí ghế ({selectedSeats.length}):</span>
                    <div className="flex gap-1">
                      {selectedSeats.map((s) => (
                        <span key={s} className="px-2 py-0.5 bg-[#E0F7FA] text-[#007887] font-bold rounded-md">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Price calculation */}
                <div className="pt-4 border-t border-[#E5E3DC] space-y-2">
                  <div className="flex justify-between text-xs text-[#647084]">
                    <span>Giá vé ({selectedSeats.length} người):</span>
                    <span>{bookingService.formatCurrency(totalPrice)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-[#647084]">
                    <span>Phí dịch vụ & Bảo hiểm:</span>
                    <span className="text-emerald-600 font-semibold">Miễn phí</span>
                  </div>
                  <div className="flex justify-between items-baseline pt-2 border-t border-dashed border-[#CBD5E1]">
                    <span className="font-bold text-sm text-[#102744]">Tổng thanh toán:</span>
                    <span className="font-serif font-bold text-2xl text-[#0097A7]">
                      {bookingService.formatCurrency(totalPrice)}
                    </span>
                  </div>
                </div>

                {/* Action button */}
                <button
                  type="submit"
                  className="w-full py-3.5 bg-[#0097A7] hover:bg-[#007887] active:scale-98 text-white font-semibold text-sm rounded-xl shadow-md shadow-[#0097A7]/20 flex items-center justify-center gap-2 transition-all"
                >
                  <span>Chuyển sang thanh toán demo</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
