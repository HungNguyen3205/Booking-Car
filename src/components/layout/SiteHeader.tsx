import React, { useState, useEffect } from 'react';
import { Menu, X, User, ShieldCheck } from 'lucide-react';

interface SiteHeaderProps {
  currentTab: string;
  onNavigate: (tab: string) => void;
  onOpenLookup: () => void;
  variant?: 'default' | 'compact';
}

export const SiteHeader: React.FC<SiteHeaderProps> = ({
  currentTab,
  onNavigate,
  onOpenLookup,
  variant = 'default',
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const isCompact = variant === 'compact';

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 15);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Handle escape to close mobile menu
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobileMenuOpen(false);
        setAuthModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const navItems = [
    {
      id: 'search',
      label: 'Tìm chuyến',
      action: () => {
        if (currentTab === 'home') {
          document.getElementById('search-form-section')?.scrollIntoView({ behavior: 'smooth' });
        } else {
          onNavigate('search');
        }
      },
    },
    { id: 'routes', label: 'Tuyến đường', action: () => onNavigate('routes') },
    { id: 'lookup', label: 'Tra cứu vé', action: onOpenLookup },
  ];

  return (
    <>
      <header
        className={`sticky top-0 z-40 w-full transition-all duration-200 border-b ${
          isCompact || isScrolled
            ? 'h-[64px] sm:h-[68px] lg:h-[70px] bg-[#FFFEFA]/95 backdrop-blur-md shadow-xs border-[#E5E3DC]'
            : 'h-[64px] sm:h-[70px] lg:h-[72px] bg-[#F7F4EC] border-[#E5E3DC]/60'
        }`}
      >
        <div className="max-w-[1380px] mx-auto h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          {/* Logo Brand (Clean, single line title without bulky subtitle) */}
          <button
            type="button"
            onClick={() => onNavigate('home')}
            className="flex items-center gap-3 text-left group focus-visible:outline-2 focus-visible:outline-[#0097A7] rounded-xl p-1 -ml-1 transition-transform active:scale-98 cursor-pointer"
            aria-label="Trang chủ HÀNH TRÌNH"
          >
            {/* SVG Logo Mark: Elegant Route Loop */}
            <div className="w-10 h-10 rounded-xl bg-[#102744] flex items-center justify-center shadow-xs transition-colors group-hover:bg-[#0097A7]">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M4 12C4 8 8 6 12 12C16 18 20 16 20 12"
                  stroke="#FFFEFA"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                <circle cx="5" cy="12" r="2" fill="#F3B54A" />
                <circle cx="19" cy="12" r="2" fill="#0097A7" />
              </svg>
            </div>
            <span className="font-serif font-bold text-2xl tracking-wider text-[#102744]">
              HÀNH TRÌNH
            </span>
          </button>

          {/* Desktop Nav Items (Centered aligned) */}
          <nav className="hidden lg:flex items-center space-x-1 xl:space-x-2">
            {navItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={item.action}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all cursor-pointer ${
                  currentTab === item.id
                    ? 'text-[#0097A7] bg-[#E0F7FA]/80 font-semibold'
                    : 'text-[#102744] hover:text-[#0097A7] hover:bg-black/5'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* Desktop Right Action: Đăng nhập dạng outline navy */}
          <div className="hidden lg:flex items-center">
            <button
              type="button"
              onClick={() => setAuthModalOpen(true)}
              className="px-5 py-2 text-sm font-semibold text-[#102744] hover:text-white border-2 border-[#102744] hover:bg-[#102744] rounded-full transition-all active:scale-95 shadow-2xs cursor-pointer"
            >
              Đăng nhập
            </button>
          </div>

          {/* Mobile Button (shown for screens under 1024px) */}
          <div className="flex items-center gap-2 lg:hidden">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-[#102744] hover:text-[#0097A7] rounded-lg"
              aria-label={mobileMenuOpen ? 'Đóng menu' : 'Mở menu'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-[#FFFEFA] border-b border-[#E5E3DC] px-6 pt-2 pb-6 space-y-2 shadow-lg animate-in slide-in-from-top-2 duration-150">
            {navItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  item.action();
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2.5 rounded-lg text-base font-medium text-[#102744] hover:bg-[#F7F4EC] hover:text-[#0097A7]"
              >
                {item.label}
              </button>
            ))}
            <div className="pt-4 border-t border-[#E5E3DC] flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setAuthModalOpen(true);
                  setMobileMenuOpen(false);
                }}
                className="flex-1 py-2.5 text-center text-sm font-medium border border-[#E5E3DC] rounded-xl text-[#102744]"
              >
                Đăng nhập
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthModalOpen(true);
                  setMobileMenuOpen(false);
                }}
                className="flex-1 py-2.5 text-center text-sm font-semibold bg-[#102744] text-white rounded-xl shadow-xs"
              >
                Đăng ký
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Demo Auth Modal */}
      {authModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          role="dialog"
          aria-modal="true"
          aria-labelledby="auth-modal-title"
        >
          <div className="bg-[#FFFEFA] w-full max-w-sm rounded-2xl p-6 shadow-2xl border border-[#E5E3DC] relative">
            <button
              type="button"
              onClick={() => setAuthModalOpen(false)}
              className="absolute top-4 right-4 text-[#647084] hover:text-[#102744]"
              aria-label="Đóng hộp thoại"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 rounded-full bg-[#E0F7FA] text-[#0097A7] flex items-center justify-center mb-4">
              <User className="w-6 h-6" />
            </div>

            <h3 id="auth-modal-title" className="font-serif font-bold text-xl text-[#102744]">
              Tài khoản HÀNH TRÌNH
            </h3>
            <p className="text-sm text-[#647084] mt-1 mb-6">
              Bạn có thể đặt vé trực tiếp không cần tài khoản! Chức năng thành viên tích điểm đang được phát triển trong phiên bản tiếp theo.
            </p>

            <div className="bg-[#F7F4EC] p-3 rounded-xl border border-[#E5E3DC] flex items-start gap-2.5 text-xs text-[#102744] mb-6">
              <ShieldCheck className="w-4 h-4 text-[#0097A7] shrink-0 mt-0.5" />
              <span>
                Mọi vé đặt demo đều được lưu trực tiếp trên thiết bị để bạn tra cứu nhanh chóng bất kỳ lúc nào.
              </span>
            </div>

            <button
              type="button"
              onClick={() => setAuthModalOpen(false)}
              className="w-full py-2.5 bg-[#0097A7] hover:bg-[#007887] text-white font-semibold rounded-xl text-sm transition-colors"
            >
              Tôi đã hiểu & Tiếp tục
            </button>
          </div>
        </div>
      )}
    </>
  );
};
