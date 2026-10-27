import React, { useState, useEffect } from 'react';
import { Menu, X, User } from 'lucide-react';
import { authService, type AuthUser } from '../../services/authService';
import { AuthModal } from '../account/AuthModal';

interface SiteHeaderProps {
  currentTab: string;
  onNavigate: (tab: string) => void;
  onOpenLookup: (phone?: string) => void;
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
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => authService.getCurrentUser());

  const isCompact = variant === 'compact';

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 15);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Listen to auth changes
  useEffect(() => {
    const unsubscribe = authService.subscribe((user) => {
      setCurrentUser(user);
    });
    return unsubscribe;
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
    { id: 'lookup', label: 'Tra cứu vé', action: () => onOpenLookup() },
  ];

  return (
    <>
      <header
        data-scrolled={isScrolled}
        className={`${currentTab === 'home' ? 'go-home-header' : ''} sticky top-0 z-40 w-full transition-all duration-200 border-b ${
          isCompact || isScrolled
            ? 'h-[64px] sm:h-[68px] lg:h-[70px] bg-[#FFFEFA]/95 backdrop-blur-md shadow-xs border-[#E5E3DC]'
            : 'h-[64px] sm:h-[70px] lg:h-[72px] bg-[#F7F4EC] border-[#E5E3DC]/60'
        }`}
      >
        <div className="max-w-[1380px] mx-auto h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between relative">
          {/* Logo Brand */}
          <button
            type="button"
            onClick={() => onNavigate('home')}
            className="flex items-center gap-2.5 sm:gap-3 text-left group focus-visible:outline-2 focus-visible:outline-[#2B4294] rounded-xl p-1 -ml-1 transition-transform active:scale-98 cursor-pointer z-10 shrink-0"
            aria-label="Trang chủ DANAVA GO"
          >
            {/* Brand Logo Icon */}
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-white border border-[#E5E3DC]/90 shadow-2xs flex items-center justify-center p-1 overflow-hidden transition-all group-hover:scale-105 group-hover:shadow-md">
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
                <span className="font-sans font-black text-xl tracking-tight text-[#2B4294]">
                  GO
                </span>
              </div>
              <span className="text-[9px] font-bold tracking-[0.24em] text-[#2B4294]/85 uppercase mt-1 leading-none font-sans">
                SOLUTIONS
              </span>
            </div>
          </button>

          {/* Desktop Nav Items (Absolutely Centered between Left and Right) */}
          <nav className="hidden lg:flex items-center space-x-1 xl:space-x-2 absolute left-1/2 -translate-x-1/2 pointer-events-auto">
            {navItems.map((item) => {
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={item.action}
                  className={`relative px-4 py-2 rounded-full text-[14.5px] font-sans font-medium transition-all duration-200 cursor-pointer group ${
                    isActive
                      ? 'text-[#2B4294] font-bold bg-[#2B4294]/8 shadow-2xs'
                      : 'text-[#102744] hover:text-[#2B4294] hover:bg-[#2B4294]/5'
                  }`}
                >
                  <span className="relative z-10">{item.label}</span>
                  {/* Refined gradient accent underline on hover and active */}
                  <span
                    className={`absolute bottom-1 left-3.5 right-3.5 h-[2px] rounded-full bg-gradient-to-r from-[#F5AE1B] via-[#F58220] to-[#EE3132] transition-all duration-300 pointer-events-none ${
                      isActive
                        ? 'opacity-100 scale-x-100'
                        : 'opacity-0 scale-x-0 group-hover:opacity-100 group-hover:scale-x-100'
                    }`}
                  />
                </button>
              );
            })}
          </nav>

          {/* Desktop Right Action: User Chip or Đăng nhập button */}
          <div className="hidden lg:flex items-center z-10 shrink-0 ml-auto">
            {currentUser ? (
              <button
                type="button"
                onClick={() => setAuthModalOpen(true)}
                className="flex items-center gap-2.5 px-3.5 py-1.5 bg-[#FAF8F5] hover:bg-[#F7F4EC] border border-[#E5E3DC] hover:border-[#2B4294] rounded-full transition-all cursor-pointer shadow-2xs group font-sans"
                title="Tài khoản thành viên (Sandbox)"
              >
                <div className="w-7 h-7 rounded-full bg-[#2B4294] group-hover:bg-[#53A5DB] text-white flex items-center justify-center text-xs font-bold font-sans transition-colors">
                  {currentUser.fullName.charAt(0).toUpperCase()}
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-xs font-bold text-[#2B4294] max-w-[130px] truncate leading-tight font-sans">
                    {currentUser.fullName}
                  </span>
                  <span className="text-[9.5px] text-[#647084] leading-tight font-sans">
                    Thành viên demo
                  </span>
                </div>
                <span className="text-[9px] font-bold uppercase bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded-md ml-1 border border-amber-300 font-sans">
                  Demo
                </span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setAuthModalOpen(true)}
                className="px-5 py-2 text-sm font-medium font-sans text-[#2B4294] hover:text-white border border-[#2B4294] hover:bg-[#2B4294] rounded-full transition-all active:scale-95 shadow-2xs cursor-pointer flex items-center gap-2"
              >
                <User className="w-4 h-4" />
                <span>Đăng nhập</span>
              </button>
            )}
          </div>

          {/* Mobile Button (shown for screens under 1024px) */}
          <div className="flex items-center gap-2 lg:hidden">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-[#2B4294] hover:text-[#53A5DB] rounded-lg"
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
                className="w-full text-left px-3 py-2.5 rounded-lg text-base font-medium text-[#2B4294] hover:bg-[#F7F4EC] hover:text-[#53A5DB]"
              >
                {item.label}
              </button>
            ))}

            <div className="pt-4 border-t border-[#E5E3DC]">
              {currentUser ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 bg-[#FAF8F5] rounded-xl border border-[#E5E3DC]">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-[#2B4294] text-white flex items-center justify-center text-xs font-bold font-serif">
                        {currentUser.fullName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-[#2B4294]">{currentUser.fullName}</div>
                        <div className="text-[10.5px] text-[#647084]">{currentUser.phone}</div>
                      </div>
                    </div>
                    <span className="text-[9px] font-bold uppercase bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded border border-amber-300">
                      Sandbox
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthModalOpen(true);
                      setMobileMenuOpen(false);
                    }}
                    className="w-full py-2.5 text-center text-xs font-semibold bg-[#2B4294] text-white rounded-xl shadow-xs"
                  >
                    Xem tài khoản & Lịch sử
                  </button>
                </div>
              ) : (
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthModalOpen(true);
                      setMobileMenuOpen(false);
                    }}
                    className="flex-1 py-2.5 text-center text-sm font-medium border border-[#E5E3DC] rounded-xl text-[#2B4294]"
                  >
                    Đăng nhập
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthModalOpen(true);
                      setMobileMenuOpen(false);
                    }}
                    className="flex-1 py-2.5 text-center text-sm font-semibold bg-[#2B4294] text-white rounded-xl shadow-xs"
                  >
                    Đăng ký
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Standardized Auth & Account Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onOpenLookupWithPhone={(phone) => onOpenLookup(phone)}
      />
    </>
  );
};
