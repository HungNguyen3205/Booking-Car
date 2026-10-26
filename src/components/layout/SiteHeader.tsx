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
        <div className="max-w-[1380px] mx-auto h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          {/* Logo Brand */}
          <button
            type="button"
            onClick={() => onNavigate('home')}
            className="flex items-center gap-3 text-left group focus-visible:outline-2 focus-visible:outline-[#0097A7] rounded-xl p-1 -ml-1 transition-transform active:scale-98 cursor-pointer"
            aria-label="Trang chủ DANAVA GO"
          >
            {/* SVG Logo Mark: DANAVA GO Icon with Teal & Amber Accent */}
            <div className="w-10 h-10 rounded-xl bg-[#102744] flex items-center justify-center shadow-xs transition-all group-hover:bg-[#0097A7] group-hover:scale-105">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M6 5H12C15.866 5 19 8.13401 19 12C19 15.866 15.866 19 12 19H6V5Z"
                  stroke="#FFFEFA"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M6 12C9 9 14 15 17 12"
                  stroke="#00E5FF"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <circle cx="6" cy="12" r="1.8" fill="#F3B54A" />
                <circle cx="17" cy="12" r="1.8" fill="#00E5FF" />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="font-sans font-bold text-2xl tracking-tight text-[#102744]">
                DANAVA <span className="text-[#0097A7]">GO</span>
              </span>
            </div>
          </button>

          {/* Desktop Nav Items (Centered aligned) */}
          <nav className="hidden lg:flex items-center space-x-1 xl:space-x-2">
            {navItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={item.action}
                className={`px-4 py-2 rounded-full text-sm font-sans font-medium transition-all cursor-pointer ${
                  currentTab === item.id
                    ? 'text-[#0097A7] bg-[#E0F7FA]/80 font-semibold'
                    : 'text-[#102744] hover:text-[#0097A7] hover:bg-black/5'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* Desktop Right Action: User Chip or Đăng nhập button */}
          <div className="hidden lg:flex items-center">
            {currentUser ? (
              <button
                type="button"
                onClick={() => setAuthModalOpen(true)}
                className="flex items-center gap-2.5 px-3.5 py-1.5 bg-[#FAF8F5] hover:bg-[#F7F4EC] border border-[#E5E3DC] hover:border-[#0097A7] rounded-full transition-all cursor-pointer shadow-2xs group font-sans"
                title="Tài khoản thành viên (Sandbox)"
              >
                <div className="w-7 h-7 rounded-full bg-[#102744] group-hover:bg-[#0097A7] text-white flex items-center justify-center text-xs font-bold font-sans transition-colors">
                  {currentUser.fullName.charAt(0).toUpperCase()}
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-xs font-bold text-[#102744] max-w-[130px] truncate leading-tight font-sans">
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
                className="px-5 py-2 text-sm font-medium font-sans text-[#102744] hover:text-white border border-[#102744] hover:bg-[#102744] rounded-full transition-all active:scale-95 shadow-2xs cursor-pointer flex items-center gap-2"
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

            <div className="pt-4 border-t border-[#E5E3DC]">
              {currentUser ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 bg-[#FAF8F5] rounded-xl border border-[#E5E3DC]">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-[#102744] text-white flex items-center justify-center text-xs font-bold font-serif">
                        {currentUser.fullName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-[#102744]">{currentUser.fullName}</div>
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
                    className="w-full py-2.5 text-center text-xs font-semibold bg-[#0097A7] text-white rounded-xl shadow-xs"
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
