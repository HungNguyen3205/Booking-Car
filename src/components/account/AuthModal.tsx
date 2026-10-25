import React, { useState, useEffect } from 'react';
import { authService, type AuthUser } from '../../services/authService';
import { bookingService } from '../../services/bookingService';
import {
  X,
  User,
  Phone,
  Mail,
  Lock,
  ShieldCheck,
  AlertCircle,
  RefreshCw,
  LogOut,
  Ticket,
  Award,
  ArrowRight,
  Info,
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenLookupWithPhone?: (phone: string) => void;
}

type AuthTab = 'login' | 'register' | 'profile';

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onOpenLookupWithPhone,
}) => {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => authService.getCurrentUser());
  const [activeTab, setActiveTab] = useState<AuthTab>(currentUser ? 'profile' : 'login');

  // Form states
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Sync user from authService
  useEffect(() => {
    const unsubscribe = authService.subscribe((user) => {
      setCurrentUser(user);
      if (user) {
        setActiveTab('profile');
      } else {
        setActiveTab('login');
      }
    });
    return unsubscribe;
  }, []);

  if (!isOpen) return null;

  // Pre-fill demo user credentials for rapid sandbox testing
  const handleFillDemoCredentials = () => {
    const demo = authService.getSampleDemoUser();
    setIdentifier(demo.phone);
    setPassword('Demo123456');
    setErrorMessage(null);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!identifier.trim()) {
      setErrorMessage('Vui lòng nhập số điện thoại hoặc email đăng nhập.');
      return;
    }

    setIsSubmitting(true);
    try {
      await authService.login({
        identifier: identifier.trim(),
        password: password.trim() || undefined,
      });
      setSuccessMessage('Đăng nhập thành công vào phiên thử nghiệm Sandbox!');
      setTimeout(() => {
        setSuccessMessage(null);
      }, 1500);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Đăng nhập thất bại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    setIsSubmitting(true);
    try {
      await authService.register({
        fullName,
        phone,
        email,
        password: password.trim() || undefined,
      });
      setSuccessMessage('Đăng ký thành viên thành công!');
      setTimeout(() => {
        setSuccessMessage(null);
      }, 1500);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Đăng ký thất bại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    setIsSubmitting(true);
    try {
      await authService.logout();
      setActiveTab('login');
      setIdentifier('');
      setPassword('');
      setSuccessMessage(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Find user bookings count if logged in
  const userBookings = currentUser ? bookingService.getBookingsByPhone(currentUser.phone) : [];

  return (
    <div
      className="fixed inset-0 z-50 bg-black/45 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      <div className="bg-[#FFFEFA] w-full max-w-md rounded-3xl p-6 sm:p-7 shadow-2xl border border-[#E5E3DC] relative flex flex-col max-h-[90vh] overflow-y-auto">
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-full text-[#647084] hover:text-[#102744] hover:bg-[#F7F4EC] transition-colors cursor-pointer"
          aria-label="Đóng hộp thoại"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-11 h-11 rounded-2xl bg-[#E0F7FA] text-[#0097A7] flex items-center justify-center shrink-0">
            <User className="w-6 h-6" />
          </div>
          <div>
            <h2 id="auth-modal-title" className="font-serif font-bold text-xl text-[#102744]">
              {currentUser ? 'Tài khoản thành viên' : 'Đăng nhập & Đăng ký'}
            </h2>
            <p className="text-xs text-[#647084] mt-0.5">
              DANAVA GO • Nền tảng đặt vé xe khách cao cấp
            </p>
          </div>
        </div>

        {/* Mode Selector Tabs (if not logged in) */}
        {!currentUser && (
          <div className="flex rounded-xl bg-[#F7F4EC] p-1 mb-5 border border-[#E5E3DC]">
            <button
              type="button"
              onClick={() => {
                setActiveTab('login');
                setErrorMessage(null);
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                activeTab === 'login'
                  ? 'bg-white text-[#102744] shadow-xs'
                  : 'text-[#647084] hover:text-[#102744]'
              }`}
            >
              Đăng nhập
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('register');
                setErrorMessage(null);
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                activeTab === 'register'
                  ? 'bg-white text-[#102744] shadow-xs'
                  : 'text-[#647084] hover:text-[#102744]'
              }`}
            >
              Đăng ký mới
            </button>
          </div>
        )}

        {/* Error / Success Notifications */}
        {errorMessage && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 flex items-start gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}
        {successMessage && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-start gap-2 animate-in fade-in">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* ============================================================
            TAB: PROFILE (LOGGED IN STATE)
            ============================================================ */}
        {currentUser && (
          <div className="space-y-5">
            {/* User Card */}
            <div className="p-4 bg-[#FAF8F5] rounded-2xl border border-[#E5E3DC]">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-[#102744] text-white flex items-center justify-center font-serif font-bold text-lg">
                    {currentUser.fullName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-bold text-sm text-[#102744]">
                      {currentUser.fullName}
                    </div>
                    <div className="text-xs text-[#647084] font-mono mt-0.5">
                      {currentUser.phone}
                    </div>
                    <div className="text-[11px] text-[#647084]">
                      {currentUser.email}
                    </div>
                  </div>
                </div>

                <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full border border-amber-300">
                  Hạng Vàng
                </span>
              </div>

              <div className="mt-4 pt-3 border-t border-[#E5E3DC] flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-[#0097A7] font-semibold">
                  <Award className="w-4 h-4" />
                  <span>Điểm thưởng: {currentUser.rewardPoints ?? 240} điểm</span>
                </div>
                <div className="text-[11px] text-[#647084]">
                  Đã đặt: <span className="font-bold text-[#102744]">{userBookings.length} chuyến</span>
                </div>
              </div>
            </div>

            {/* Quick Action: My Bookings */}
            <div className="p-4 bg-[#E0F7FA]/40 rounded-2xl border border-[#0097A7]/20 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <Ticket className="w-5 h-5 text-[#0097A7]" />
                <div>
                  <div className="text-xs font-bold text-[#102744]">Vé xe đã đặt</div>
                  <div className="text-[11px] text-[#647084]">
                    Tra cứu các chuyến xe theo số điện thoại {currentUser.phone}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenLookupWithPhone?.(currentUser.phone);
                }}
                className="px-3 py-1.5 bg-[#0097A7] hover:bg-[#007887] text-white text-xs font-semibold rounded-xl flex items-center gap-1 transition-all cursor-pointer shrink-0"
              >
                <span>Xem vé</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Honest Sandbox Disclaimer Notice (Requirement 6 & 7) */}
            <div className="p-3 bg-[#F7F4EC] rounded-2xl border border-[#E5E3DC] text-[11px] text-[#647084] space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-[#102744]">
                <Info className="w-3.5 h-3.5 text-[#0097A7]" />
                <span>Phiên làm việc thử nghiệm (Client Sandbox)</span>
              </div>
              <p className="leading-relaxed">
                Tài khoản hiện đang chạy trên phiên duyệt demo tại trình duyệt. Hệ thống chưa liên kết SSO / OAuth2 Production.
              </p>
            </div>

            {/* Logout Button */}
            <button
              type="button"
              onClick={handleLogout}
              disabled={isSubmitting}
              className="w-full py-2.5 border border-red-200 text-red-600 hover:bg-red-50 font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Đăng xuất phiên demo</span>
            </button>
          </div>
        )}

        {/* ============================================================
            TAB: LOGIN
            ============================================================ */}
        {!currentUser && activeTab === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Quick Demo Pre-fill Button */}
            <div className="p-2.5 bg-[#FAF8F5] rounded-xl border border-[#E5E3DC] flex items-center justify-between text-xs">
              <span className="text-[#647084] text-[11px]">Dùng thử tài khoản mẫu:</span>
              <button
                type="button"
                onClick={handleFillDemoCredentials}
                className="text-xs font-bold text-[#0097A7] hover:underline cursor-pointer"
              >
                Nạp tài khoản mẫu (0905123456)
              </button>
            </div>

            <div>
              <label htmlFor="auth-identifier" className="block text-xs font-bold text-[#102744] uppercase tracking-wider mb-1.5">
                Số điện thoại hoặc Email <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-[#647084] absolute left-3.5 top-3" />
                <input
                  id="auth-identifier"
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="0905123456 hoặc user@danavago.vn"
                  className="w-full pl-10 pr-4 py-2.5 bg-[#F7F4EC]/60 focus:bg-[#FFFEFA] rounded-xl border border-[#E5E3DC] text-sm text-[#102744] focus:ring-2 focus:ring-[#0097A7] focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="auth-password" className="block text-xs font-bold text-[#102744] uppercase tracking-wider">
                  Mật khẩu
                </label>
                <span className="text-[11px] text-[#647084]">Tùy chọn trong demo</span>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#647084] absolute left-3.5 top-3" />
                <input
                  id="auth-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Nhập mật khẩu bất kỳ (demo)"
                  className="w-full pl-10 pr-4 py-2.5 bg-[#F7F4EC]/60 focus:bg-[#FFFEFA] rounded-xl border border-[#E5E3DC] text-sm text-[#102744] focus:ring-2 focus:ring-[#0097A7] focus:outline-hidden"
                />
              </div>
            </div>

            {/* Architecture Disclaimer (Requirement 6 & 7) */}
            <div className="p-3 bg-[#F7F4EC] rounded-xl border border-[#E5E3DC] text-[11px] text-[#647084] space-y-1">
              <div className="font-semibold text-[#102744] flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-[#0097A7]" />
                <span>Phiên thử nghiệm an toàn</span>
              </div>
              <p>
                Mật khẩu hoặc bí mật không được lưu vào bộ nhớ trình duyệt. Chưa thay thế bằng hệ thống xác thực backend OAuth/JWT.
              </p>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-[#0097A7] hover:bg-[#007887] active:scale-98 text-white font-semibold text-sm rounded-xl shadow-md shadow-[#0097A7]/20 flex items-center justify-center gap-2 transition-all disabled:opacity-60 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Đang khởi tạo phiên demo…</span>
                </>
              ) : (
                <span>Đăng nhập phiên thử nghiệm</span>
              )}
            </button>
          </form>
        )}

        {/* ============================================================
            TAB: REGISTER
            ============================================================ */}
        {!currentUser && activeTab === 'register' && (
          <form onSubmit={handleRegister} className="space-y-3.5">
            <div>
              <label htmlFor="reg-fullname" className="block text-xs font-bold text-[#102744] uppercase tracking-wider mb-1">
                Họ và tên <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-[#647084] absolute left-3.5 top-3" />
                <input
                  id="reg-fullname"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ví dụ: Nguyễn Văn Hùng"
                  className="w-full pl-10 pr-4 py-2.5 bg-[#F7F4EC]/60 focus:bg-[#FFFEFA] rounded-xl border border-[#E5E3DC] text-sm text-[#102744] focus:ring-2 focus:ring-[#0097A7] focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label htmlFor="reg-phone" className="block text-xs font-bold text-[#102744] uppercase tracking-wider mb-1">
                Số điện thoại (10 chữ số) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-[#647084] absolute left-3.5 top-3" />
                <input
                  id="reg-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Ví dụ: 0905123456"
                  className="w-full pl-10 pr-4 py-2.5 bg-[#F7F4EC]/60 focus:bg-[#FFFEFA] rounded-xl border border-[#E5E3DC] text-sm text-[#102744] focus:ring-2 focus:ring-[#0097A7] focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label htmlFor="reg-email" className="block text-xs font-bold text-[#102744] uppercase tracking-wider mb-1">
                Địa chỉ Email <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#647084] absolute left-3.5 top-3" />
                <input
                  id="reg-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Ví dụ: hung.nguyen@danavago.vn"
                  className="w-full pl-10 pr-4 py-2.5 bg-[#F7F4EC]/60 focus:bg-[#FFFEFA] rounded-xl border border-[#E5E3DC] text-sm text-[#102744] focus:ring-2 focus:ring-[#0097A7] focus:outline-hidden"
                />
              </div>
            </div>

            <div>
              <label htmlFor="reg-password" className="block text-xs font-bold text-[#102744] uppercase tracking-wider mb-1">
                Mật khẩu khởi tạo
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#647084] absolute left-3.5 top-3" />
                <input
                  id="reg-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Tối thiểu 6 ký tự (demo)"
                  className="w-full pl-10 pr-4 py-2.5 bg-[#F7F4EC]/60 focus:bg-[#FFFEFA] rounded-xl border border-[#E5E3DC] text-sm text-[#102744] focus:ring-2 focus:ring-[#0097A7] focus:outline-hidden"
                />
              </div>
            </div>

            {/* Architecture Integration Notice */}
            <div className="p-3 bg-[#F7F4EC] rounded-xl border border-[#E5E3DC] text-[10.5px] text-[#647084] space-y-0.5">
              <span className="font-semibold text-[#102744] block">Yêu cầu tích hợp Backend:</span>
              <p>Cần kết nối API SMS OTP xác thực số điện thoại và cấp phát JWT token bảo mật.</p>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-[#102744] hover:bg-[#0097A7] active:scale-98 text-white font-semibold text-sm rounded-xl shadow-md transition-all disabled:opacity-60 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Đang đăng ký thành viên…</span>
                </>
              ) : (
                <span>Tạo tài khoản thành viên</span>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
