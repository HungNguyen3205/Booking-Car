import { normalizeVietnamPhone } from '../../utils/phoneUtils';
import React, { useState, useMemo } from 'react';
import type { Trip, PassengerInfo } from '../../types';
import { bookingService } from '../../services/bookingService';
import {
  ArrowLeft,
  ArrowRight,
  User,
  Phone,
  Mail,
  MapPin,
  AlertCircle,
  ShieldCheck,
  Loader2,
} from 'lucide-react';

interface PassengerFormProps {
  trip: Trip;
  dateStr: string;
  selectedSeats: string[];
  initialPassenger?: PassengerInfo;
  onBack: (draft?: PassengerInfo) => void;
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
  const [agreedTerms, setAgreedTerms] = useState(initialPassenger?.agreedTerms ?? false);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Compute total price accurately from individual seat prices if configured
  const totalPrice = useMemo(() => {
    return selectedSeats.reduce((sum, code) => {
      const seat = trip.seats.find((s) => s.code === code);
      return sum + (seat ? seat.price : trip.price);
    }, 0);
  }, [selectedSeats, trip]);

  // Vietnamese Name Regex: Unicode letters, spaces and apostrophe
  const vietnameseNameRegex =
    /^[a-zA-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠàáâãèéêìíòóôõùúăđĩũơƯĂẠẢẤẦẨẪẬẮẰẲẴẶẸẺẼỀỀỂưăạảấầẩẫậắằẳẵặẹẻẽềềểỄỆỈỊỌỎỐỒỔỖỘỚỜỞỠỢỤỦỨỪễệỉịọỏốồổỗộớờởỡợụủứừỬỮỰỲỴÝỶỸửữựỳỵỷỹ\s']+$/;

  // Vietnamese Mobile Phone Regex: 10 digits starting with 03, 05, 07, 08, 09 or +84
  const vietnamesePhoneRegex =
    /^(0|\+84)(3[2-9]|5[2689]|7[06-9]|8[1-9]|9[0-9])[0-9]{7}$/;

  // Standard RFC Email Regex
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  const validateField = (fieldName: string, val: string): string => {
    switch (fieldName) {
      case 'fullName': {
        const trimmed = val.trim();
        const words = trimmed.split(/\s+/).filter(Boolean);
        if (!trimmed) {
          return 'Vui lòng nhập họ và tên hành khách.';
        }
        if (trimmed.length < 3 || words.length < 2) {
          return 'Vui lòng nhập đầy đủ cả họ và tên (tối thiểu 2 từ, ví dụ: Nguyễn Văn A).';
        }
        if (!vietnameseNameRegex.test(trimmed)) {
          return 'Họ và tên chỉ được chứa chữ cái tiếng Việt và khoảng trắng.';
        }
        return '';
      }
      case 'phone': {
        const clean = normalizeVietnamPhone(val);
        if (!clean) {
          return 'Vui lòng nhập số điện thoại liên hệ.';
        }
        if (!vietnamesePhoneRegex.test(clean)) {
          return 'Số điện thoại di động không hợp lệ (10 số, đầu số 03, 05, 07, 08, 09).';
        }
        return '';
      }
      case 'email': {
        const trimmed = val.trim();
        if (!trimmed) {
          return ''; // Optional in the current local-ticket flow.
        }
        if (!emailRegex.test(trimmed)) {
          return 'Địa chỉ email không đúng định dạng (ví dụ: tenban@gmail.com).';
        }
        return '';
      }
      default:
        return '';
    }
  };

  const handleBlur = (fieldName: string, value: string) => {
    const error = validateField(fieldName, value);
    setErrors(prev=>({...prev,[fieldName]:error}));
  };

  const validateAll = () => {
    const errs: Record<string, string> = {};

    const nameErr = validateField('fullName', fullName);
    if (nameErr) errs.fullName = nameErr;

    const phoneErr = validateField('phone', phone);
    if (phoneErr) errs.phone = phoneErr;

    const emailErr = validateField('email', email);
    if (emailErr) errs.email = emailErr;

    if (!pickupStopId) {
      errs.pickupStopId = 'Vui lòng chọn điểm đón hành khách.';
    }

    if (!dropoffStopId) {
      errs.dropoffStopId = 'Vui lòng chọn điểm trả khách.';
    }

    if (!agreedTerms) {
      errs.agreedTerms = 'Bạn cần đồng ý với điều khoản đặt vé trước khi tiếp tục.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleBackWithDraft = () => {
    // Preserve all filled draft information when navigating back
    onBack({
      fullName: fullName.trim(),
      phone: normalizeVietnamPhone(phone),
      email: email.trim(),
      pickupStopId,
      dropoffStopId,
      note: note.trim(),
      agreedTerms,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!validateAll()) {
      // Scroll first invalid field into view
      const firstErrorField = document.querySelector('[aria-invalid="true"]');
      if (firstErrorField) {
        firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    // Double submit prevention: disable button and trigger submission
    setIsSubmitting(true);
    onSubmit({
        fullName: fullName.trim(),
        phone: normalizeVietnamPhone(phone),
        email: email.trim(),
        pickupStopId,
        dropoffStopId,
        note: note.trim(),
        agreedTerms,
    });
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
              onClick={handleBackWithDraft}
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#F7F4EC] hover:bg-[#E5E3DC] text-xs font-bold text-[#102744] rounded-xl border border-[#CBD5E1] transition-all cursor-pointer shrink-0 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-[#2B4294]"
              title="Quay lại sơ đồ chọn ghế (Giữ nguyên thông tin đã điền)"
            >
              <ArrowLeft className="w-4 h-4 text-[#2B4294]" />
              <span className="hidden xs:inline">Quay lại chọn ghế</span>
            </button>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-sans font-bold text-base sm:text-lg text-[#102744] leading-tight">
                  Thông tin hành khách & Điểm đón
                </h1>
                <span className="text-[11px] font-bold text-[#2B4294] uppercase bg-[#EBF4FC] px-2 py-0.5 rounded-md hidden sm:inline">
                  {trip.vehicle.name}
                </span>
              </div>
              <p className="text-xs text-[#647084] mt-0.5">
                {trip.from} → {trip.to} • {trip.departureTime} • {bookingService.formatDisplayDate(dateStr)}
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
            <div className="flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              <span className="w-3.5 h-3.5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[9px] font-bold">✓</span>
              <span className="hidden sm:inline">2. Ghế: {selectedSeats.join(', ')}</span>
            </div>
            <span className="text-[#CBD5E1]">→</span>
            <div className="flex items-center gap-1.5 text-white bg-[#2B4294] px-3 py-1 rounded-full shadow-xs">
              <span className="w-3.5 h-3.5 rounded-full bg-white text-[#2B4294] flex items-center justify-center text-[9px] font-bold">3</span>
              <span>3. Thông tin</span>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================
          2. MAIN FORM CONTENT
          ============================================================ */}
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 mt-6 sm:mt-8">
        <form onSubmit={handleSubmit} noValidate>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
            {/* Left Column: Input Fields (~65% / 7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              {/* Contact Information Card */}
              <div className="bg-[#FFFEFA] rounded-3xl p-5 sm:p-7 border border-[#E5E3DC] shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#E5E3DC]">
                  <h2 className="font-sans font-bold text-base sm:text-lg text-[#102744] flex items-center gap-2">
                    <User className="w-5 h-5 text-[#2B4294]" />
                    <span>Người đại diện đặt vé</span>
                  </h2>
                  <span className="text-[11px] text-[#647084]">
                    Ghế đã chọn: <strong className="text-[#2B4294]">{selectedSeats.join(', ')}</strong> ({selectedSeats.length} chỗ)
                  </span>
                </div>

                {/* Full name input */}
                <div>
                  <label
                    htmlFor="passenger-name"
                    className="block text-xs font-bold text-[#102744] uppercase tracking-wider mb-1.5"
                  >
                    Họ và tên hành khách <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-[#647084] absolute left-3.5 top-3" />
                    <input
                      id="passenger-name"
                      type="text"
                      autoComplete="name"
                      disabled={isSubmitting}
                      value={fullName}
                      onChange={(e) => {
                        setFullName(e.target.value);
                        if (errors.fullName) setErrors((prev) => ({ ...prev, fullName: '' }));
                      }}
                      onBlur={(e) => handleBlur('fullName', e.target.value)}
                      aria-invalid={!!errors.fullName}
                      aria-describedby={errors.fullName ? 'err-name' : undefined}
                      placeholder="Ví dụ: Nguyễn Văn Hùng"
                      className={`w-full pl-10 pr-4 py-2.5 bg-[#F7F4EC]/60 focus:bg-[#FFFEFA] rounded-xl border text-sm font-medium text-[#102744] focus:ring-2 focus:ring-[#2B4294] focus:outline-hidden transition-all disabled:opacity-50 ${
                        errors.fullName
                          ? 'border-red-400 bg-red-50/50 focus:ring-red-400'
                          : 'border-[#E5E3DC]'
                      }`}
                    />
                  </div>
                  {errors.fullName && (
                    <p id="err-name" className="mt-1.5 text-xs text-red-600 flex items-center gap-1 font-medium">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{errors.fullName}</span>
                    </p>
                  )}
                </div>

                {/* Phone & Email Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Phone input */}
                  <div>
                    <label
                      htmlFor="passenger-phone"
                      className="block text-xs font-bold text-[#102744] uppercase tracking-wider mb-1.5"
                    >
                      Số điện thoại <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-[#647084] absolute left-3.5 top-3" />
                      <input
                        id="passenger-phone"
                        type="tel"
                        autoComplete="tel"
                        disabled={isSubmitting}
                        value={phone}
                        onChange={(e) => {
                          setPhone(e.target.value);
                          if (errors.phone) setErrors((prev) => ({ ...prev, phone: '' }));
                        }}
                        onBlur={(e) => handleBlur('phone', e.target.value)}
                        aria-invalid={!!errors.phone}
                        aria-describedby={errors.phone ? 'err-phone' : undefined}
                        placeholder="0905123456"
                        className={`w-full pl-10 pr-4 py-2.5 bg-[#F7F4EC]/60 focus:bg-[#FFFEFA] rounded-xl border text-sm font-medium text-[#102744] focus:ring-2 focus:ring-[#2B4294] focus:outline-hidden transition-all disabled:opacity-50 ${
                          errors.phone
                            ? 'border-red-400 bg-red-50/50 focus:ring-red-400'
                            : 'border-[#E5E3DC]'
                        }`}
                      />
                    </div>
                    {errors.phone && (
                      <p id="err-phone" className="mt-1.5 text-xs text-red-600 flex items-center gap-1 font-medium">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{errors.phone}</span>
                      </p>
                    )}
                  </div>

                  {/* Email input */}
                  <div>
                    <label
                      htmlFor="passenger-email"
                      className="block text-xs font-bold text-[#102744] uppercase tracking-wider mb-1.5"
                    >
                      Email liên hệ <span className="text-[#647084] normal-case font-normal">(không bắt buộc)</span>
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-[#647084] absolute left-3.5 top-3" />
                      <input
                        id="passenger-email"
                        type="email"
                        autoComplete="email"
                        disabled={isSubmitting}
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          if (errors.email) setErrors((prev) => ({ ...prev, email: '' }));
                        }}
                        onBlur={(e) => handleBlur('email', e.target.value)}
                        aria-invalid={!!errors.email}
                        aria-describedby={errors.email ? 'err-email' : undefined}
                        placeholder="tenban@gmail.com"
                        className={`w-full pl-10 pr-4 py-2.5 bg-[#F7F4EC]/60 focus:bg-[#FFFEFA] rounded-xl border text-sm font-medium text-[#102744] focus:ring-2 focus:ring-[#2B4294] focus:outline-hidden transition-all disabled:opacity-50 ${
                          errors.email
                            ? 'border-red-400 bg-red-50/50 focus:ring-red-400'
                            : 'border-[#E5E3DC]'
                        }`}
                      />
                    </div>
                    {errors.email && (
                      <p id="err-email" className="mt-1.5 text-xs text-red-600 flex items-center gap-1 font-medium">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{errors.email}</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Pickup & Dropoff Stops Selection */}
              <div className="bg-[#FFFEFA] rounded-3xl p-5 sm:p-7 border border-[#E5E3DC] shadow-sm space-y-5">
                <h2 className="font-sans font-bold text-base sm:text-lg text-[#102744] flex items-center gap-2 pb-3 border-b border-[#E5E3DC]">
                  <MapPin className="w-5 h-5 text-[#2B4294]" />
                  <span>Điểm đón và trả khách chính xác</span>
                </h2>

                {/* Pickup stops */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-xs font-bold text-[#102744] uppercase tracking-wider">
                      Điểm đón tại {trip.from} <span className="text-red-500">*</span>
                    </label>
                    <span className="text-[11px] text-[#647084]">{trip.departureStops.length} điểm khả dụng</span>
                  </div>
                  <div className="space-y-2">
                    {trip.departureStops.map((stop) => (
                      <label
                        key={stop.id}
                        className={`flex items-start gap-3 p-3 rounded-2xl border cursor-pointer transition-all ${
                          pickupStopId === stop.id
                            ? 'bg-[#EBF4FC]/60 border-[#2B4294] ring-1 ring-[#2B4294]'
                            : 'bg-[#F7F4EC]/60 border-[#E5E3DC] hover:border-[#2B4294]'
                        }`}
                      >
                        <input
                          type="radio"
                          name="pickupStop"
                          value={stop.id}
                          checked={pickupStopId === stop.id}
                          onChange={() => {
                            setPickupStopId(stop.id);
                            if (errors.pickupStopId) setErrors((prev) => ({ ...prev, pickupStopId: '' }));
                          }}
                          className="mt-1 text-[#2B4294] focus:ring-[#2B4294]"
                        />
                        <div className="flex-1 text-xs">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-[#102744]">{stop.name}</span>
                            <span className="text-[#2B4294] font-semibold">{stop.time}</span>
                          </div>
                          <p className="text-[#647084] mt-0.5">{stop.address}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                  {errors.pickupStopId && (
                    <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1 font-medium">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{errors.pickupStopId}</span>
                    </p>
                  )}
                </div>

                {/* Dropoff stops */}
                <div className="pt-2">
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-xs font-bold text-[#102744] uppercase tracking-wider">
                      Điểm trả tại {trip.to} <span className="text-red-500">*</span>
                    </label>
                    <span className="text-[11px] text-[#647084]">{trip.dropoffStops.length} điểm khả dụng</span>
                  </div>
                  <div className="space-y-2">
                    {trip.dropoffStops.map((stop) => (
                      <label
                        key={stop.id}
                        className={`flex items-start gap-3 p-3 rounded-2xl border cursor-pointer transition-all ${
                          dropoffStopId === stop.id
                            ? 'bg-[#EBF4FC]/60 border-[#2B4294] ring-1 ring-[#2B4294]'
                            : 'bg-[#F7F4EC]/60 border-[#E5E3DC] hover:border-[#2B4294]'
                        }`}
                      >
                        <input
                          type="radio"
                          name="dropoffStop"
                          value={stop.id}
                          checked={dropoffStopId === stop.id}
                          onChange={() => {
                            setDropoffStopId(stop.id);
                            if (errors.dropoffStopId) setErrors((prev) => ({ ...prev, dropoffStopId: '' }));
                          }}
                          className="mt-1 text-[#2B4294] focus:ring-[#2B4294]"
                        />
                        <div className="flex-1 text-xs">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-[#102744]">{stop.name}</span>
                            <span className="text-[#2B4294] font-semibold">{stop.time}</span>
                          </div>
                          <p className="text-[#647084] mt-0.5">{stop.address}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                  {errors.dropoffStopId && (
                    <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1 font-medium">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{errors.dropoffStopId}</span>
                    </p>
                  )}
                </div>

                {/* Optional note */}
                <div className="pt-2">
                  <label htmlFor="passenger-note" className="block text-xs font-bold text-[#102744] uppercase tracking-wider mb-1.5">
                    Ghi chú đặc biệt cho tài xế (Không bắt buộc)
                  </label>
                  <textarea
                    id="passenger-note"
                    rows={2}
                    disabled={isSubmitting}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Ví dụ: Có hành lý ký gửi vali lớn, đi cùng trẻ nhỏ, hoặc cần hỗ trợ đón người cao tuổi..."
                    className="w-full px-4 py-2.5 bg-[#F7F4EC]/60 focus:bg-[#FFFEFA] rounded-xl border border-[#E5E3DC] text-xs font-medium text-[#102744] focus:ring-2 focus:ring-[#2B4294] focus:outline-hidden disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Agreement Checkbox */}
              <div className="p-4 sm:p-5 bg-[#FFFEFA] rounded-2xl border border-[#E5E3DC] shadow-2xs space-y-2">
                <label className="flex items-start gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    disabled={isSubmitting}
                    checked={agreedTerms}
                    onChange={(e) => {
                      setAgreedTerms(e.target.checked);
                      if (errors.agreedTerms) setErrors((prev) => ({ ...prev, agreedTerms: '' }));
                    }}
                    className="mt-0.5 rounded border-[#CBD5E1] text-[#2B4294] focus:ring-[#2B4294] w-4 h-4 cursor-pointer"
                  />
                  <span className="text-xs text-[#647084] leading-relaxed">
                    Tôi xác nhận thông tin trên là chính xác và đồng ý với <strong>Chính sách hủy đổi vé</strong> của DANAVA GO. Thông tin thẻ/tài khoản thanh toán sẽ không bị lưu giữ trên hệ thống.
                  </span>
                </label>
                {errors.agreedTerms && (
                  <p className="text-xs text-red-600 flex items-center gap-1 font-medium">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{errors.agreedTerms}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Right Column: Transparent Pricing Breakdown & Sticky Action (~35% / 5 cols) */}
            <div className="lg:col-span-5 lg:sticky lg:top-24">
              <div className="bg-[#FFFEFA] rounded-3xl p-6 border border-[#E5E3DC] shadow-sm space-y-6">
                <h3 className="font-sans font-bold text-base sm:text-lg text-[#102744] pb-3 border-b border-[#E5E3DC] flex items-center justify-between">
                  <span>Tóm tắt đơn đặt vé</span>
                  <span className="text-xs font-semibold text-[#2B4294] bg-[#EBF4FC] px-2 py-0.5 rounded-full">
                    #{trip.code}
                  </span>
                </h3>

                {/* Itinerary details */}
                <div className="space-y-2.5 text-xs">
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
                    <strong className="text-[#2B4294]">{trip.departureTime} ({trip.duration})</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#647084]">Dòng xe:</span>
                    <span className="text-[#102744] font-medium">{trip.vehicle.name}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-[#E5E3DC]">
                    <span className="text-[#647084]">Ghế đã chọn ({selectedSeats.length}):</span>
                    <div className="flex gap-1 flex-wrap justify-end">
                      {selectedSeats.map((s) => (
                        <span key={s} className="px-2 py-0.5 bg-[#EBF4FC] text-[#1E2F6B] font-bold rounded-md">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Transparent Price Breakdown */}
                <div className="pt-4 border-t border-[#E5E3DC] space-y-2 text-xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#647084] block mb-1">
                    Chi tiết giá vé minh bạch
                  </span>
                  
                  <div className="flex justify-between text-[#647084]">
                    <span>Tiền vé ({selectedSeats.length} chỗ ngồi):</span>
                    <span className="font-semibold text-[#102744]">{bookingService.formatCurrency(totalPrice)}</span>
                  </div>

                  <div className="flex justify-between text-[#647084]">
                    <span>Phí dịch vụ trực tuyến:</span>
                    <span className="text-emerald-700 font-semibold">0 ₫ (Miễn phí)</span>
                  </div>

                  <div className="flex justify-between text-[#647084]">
                    <span>Bảo hiểm hành khách:</span>
                    <span className="text-emerald-700 font-semibold">Đã bao gồm</span>
                  </div>

                  <div className="flex justify-between text-[#647084]">
                    <span>Thuế GTGT (VAT):</span>
                    <span className="text-emerald-700 font-semibold">Đã bao gồm</span>
                  </div>

                  <div className="flex justify-between items-baseline pt-3 border-t border-dashed border-[#CBD5E1]">
                    <div>
                      <span className="font-bold text-sm text-[#102744] block">Tổng thanh toán:</span>
                      <span className="text-[10px] text-[#647084]">Giá trọn gói, không phụ phí</span>
                    </div>
                    <span className="font-sans font-bold text-2xl text-[#2B4294]">
                      {bookingService.formatCurrency(totalPrice)}
                    </span>
                  </div>
                </div>

                {/* Action button with double submit prevention */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3.5 px-4 bg-[#2B4294] hover:bg-[#1E2F6B] active:scale-98 text-white font-bold text-sm rounded-xl shadow-md shadow-[#2B4294]/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer focus-visible:outline-2 focus-visible:outline-[#2B4294]"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Đang kiểm tra thông tin…</span>
                      </>
                    ) : (
                      <>
                        <span>Chuyển sang thanh toán</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  <div className="mt-2.5 flex items-center justify-center gap-1.5 text-[10.5px] text-[#647084]">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Mô phỏng thanh toán an toàn • Chưa trừ tiền tài khoản</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
