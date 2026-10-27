import React from 'react';
import { Shield, Heart } from 'lucide-react';

interface SiteFooterProps {
  onSelectRoute?: (from: string, to: string) => void;
  onOpenLookup?: () => void;
}

export const SiteFooter: React.FC<SiteFooterProps> = ({
  onSelectRoute,
  onOpenLookup,
}) => {
  return (
    <footer className="bg-[#14204A] text-[#E2E8F0] pt-14 pb-8 border-t border-[#1E2F6B]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 mb-12">
          {/* Brand Col */}
          <div className="lg:col-span-4 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-white/10 backdrop-blur-xs border border-white/20 p-1 flex items-center justify-center">
                <img
                  src="/assets/danava-icon.png"
                  alt="DANAVA"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="flex flex-col justify-center">
                <div className="flex items-baseline gap-1.5 leading-none">
                  <span className="font-sans font-black text-2xl tracking-tight bg-gradient-to-r from-[#F5AE1B] via-[#F58220] to-[#EE3132] bg-clip-text text-transparent">
                    DANAVA
                  </span>
                  <span className="font-sans font-black text-xl tracking-tight text-white">
                    GO
                  </span>
                </div>
                <span className="text-[9.5px] font-bold tracking-[0.24em] text-[#53A5DB] uppercase mt-1 leading-none font-sans">
                  SOLUTIONS
                </span>
              </div>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed max-w-sm">
              Nền tảng đặt vé xe khách trực tuyến cao cấp. Mang đến trải nghiệm di chuyển êm ái, an toàn và văn minh trên mọi nẻo đường Việt Nam.
            </p>
            <div className="text-xs text-slate-300 bg-white/5 p-3 rounded-xl border border-white/10">
              <span className="text-[#F5AE1B] font-semibold">Bản demo tương tác:</span> Mọi thông tin chuyến, giá vé và sơ đồ ghế phục vụ mục đích trình diễn giao diện và công nghệ.
            </div>
          </div>

          {/* Key Routes */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">
              Tuyến đường phổ biến
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm text-slate-300">
              <li>
                <button
                  type="button"
                  onClick={() => onSelectRoute?.('Đà Nẵng', 'Huế')}
                  className="hover:text-[#53A5DB] transition-colors flex items-center gap-1.5"
                >
                  <span>Đà Nẵng</span> → <span>Huế (Di sản)</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onSelectRoute?.('Đà Nẵng', 'Hội An')}
                  className="hover:text-[#53A5DB] transition-colors flex items-center gap-1.5"
                >
                  <span>Đà Nẵng</span> → <span>Hội An (Phố Cổ)</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onSelectRoute?.('Đà Nẵng', 'Quy Nhơn')}
                  className="hover:text-[#53A5DB] transition-colors flex items-center gap-1.5"
                >
                  <span>Đà Nẵng</span> → <span>Quy Nhơn (Biển xanh)</span>
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onSelectRoute?.('Huế', 'Đà Nẵng')}
                  className="hover:text-[#53A5DB] transition-colors flex items-center gap-1.5"
                >
                  <span>Huế</span> → <span>Đà Nẵng (Khứ hồi)</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Dịch vụ & Tiện ích */}
          <div className="lg:col-span-2 space-y-3">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">
              Dịch vụ
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm text-slate-300">
              <li>
                <button
                  type="button"
                  onClick={onOpenLookup}
                  className="hover:text-[#53A5DB] transition-colors"
                >
                  Tra cứu vé điện tử
                </button>
              </li>
              <li>
                <span className="text-slate-400">Xe Cabin Cung Điện</span>
              </li>
              <li>
                <span className="text-slate-400">Limousine VIP 16 chỗ</span>
              </li>
              <li>
                <span className="text-slate-400">Chính sách hủy vé</span>
              </li>
            </ul>
          </div>

          {/* Cam kết Demo */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">
              An toàn & Bảo mật
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Trang web tuân thủ các tiêu chuẩn thiết kế hiện đại, hỗ trợ phím tắt và chế độ giảm hoạt ảnh (prefers-reduced-motion) cho mọi thiết bị.
            </p>
            <div className="flex items-center gap-2 text-xs text-[#53A5DB]">
              <Shield className="w-4 h-4 shrink-0" />
              <span>Bảo mật thông tin demo cục bộ</span>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-[#1E2F6B] flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-4">
          <p>© 2026 DANAVA GO. Thiết kế & phát triển cho trải nghiệm bán vé xe khách cao cấp.</p>
          <div className="flex items-center gap-1">
            <span>Được xây dựng với tình yêu</span>
            <Heart className="w-3.5 h-3.5 text-[#EE3132] fill-[#EE3132] inline" />
            <span>và sự chỉn chu</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
