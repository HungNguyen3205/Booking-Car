import React, { useState, useEffect, Suspense } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { TripSearchForm } from '../home/TripSearchForm';
import type { SearchParams, VehicleCategory } from '../../types';
import { Armchair, BedDouble, Crown, QrCode, Sparkles, AlertCircle } from 'lucide-react';
import { WebGLFallback } from './3d/WebGLFallback';

// Lazy-load isolated 3D Three.js Canvas to keep booking/checkout bundles lightweight
const JourneyCanvas = React.lazy(() =>
  import('./3d/JourneyCanvas').then((m) => ({ default: m.JourneyCanvas }))
);

import type { JourneyTimelineState } from './3d/journeyTimeline';
import { resolveDestination } from './3d/destinationConfig';

const SESSION_INTRO_KEY = 'danava_go_intro_played';

interface DanavaGoHeroProps {
  initialParams: SearchParams;
  onSearch: (params: SearchParams) => void;
  isSearching?: boolean;
}

export const DanavaGoHero: React.FC<DanavaGoHeroProps> = ({
  initialParams,
  onSearch,
  isSearching = false,
}) => {
  const shouldReduceMotion = useReducedMotion();
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleCategory>('sleeper');
  const [vehicleToast, setVehicleToast] = useState<{ text: string; id: number } | null>(null);
  const [currentRoute, setCurrentRoute] = useState({
    from: initialParams.from || 'Đà Nẵng',
    to: initialParams.to || 'Huế',
  });

  // Đồng bộ tuyến khi initialParams từ cấp cha thay đổi (ví dụ: click điểm đến nổi bật)
  const [prevFrom, setPrevFrom] = useState(initialParams.from);
  const [prevTo, setPrevTo] = useState(initialParams.to);
  if (initialParams.from !== prevFrom || initialParams.to !== prevTo) {
    setPrevFrom(initialParams.from);
    setPrevTo(initialParams.to);
    if (initialParams.from && initialParams.to) {
      setCurrentRoute({ from: initialParams.from, to: initialParams.to });
    }
  }

  // Kiểm tra phiên làm việc: Intro chỉ phát một lần duy nhất trong session, không lặp lại khi đổi xe/tuyến
  const [isIntroPlayed, setIsIntroPlayed] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    return window.sessionStorage.getItem(SESSION_INTRO_KEY) === 'true';
  });

  // Trạng thái timeline tập trung [closed, opening, landscape-reveal, vehicle-enter, route-reveal, ready]
  const [timelineState, setTimelineState] = useState<JourneyTimelineState>(() =>
    isIntroPlayed || shouldReduceMotion ? 'ready' : 'closed'
  );

  const [isSkipped, setIsSkipped] = useState<boolean>(false);
  const [introReplayKey, setIntroReplayKey] = useState<number>(0);

  // Developer debug mode enabled via ?debug=1 or ?debug3d=true
  const [isDebug] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const s = window.location.search;
    return s.includes('debug=1') || s.includes('debug3d=true');
  });

  // Debug flap fold angle (0 = flat open, Math.PI = folded over)
  const [debugFlapAngle, setDebugFlapAngle] = useState<number>(0.0);

  // Debug coach animation replay trigger
  const [coachReplayKey, setCoachReplayKey] = useState<number>(0);

  // Xử lý bỏ qua intro an toàn (người dùng tương tác form hoặc click bỏ qua)
  const handleSkipIntro = () => {
    setIsSkipped(true);
    setIsIntroPlayed(true);
    setTimelineState('ready');
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem(SESSION_INTRO_KEY, 'true');
    }
  };

  // Hoàn tất intro bình thường
  const handleIntroComplete = () => {
    setIsIntroPlayed(true);
    setTimelineState('ready');
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem(SESSION_INTRO_KEY, 'true');
    }
  };

  // Phát lại toàn bộ intro 2.5s (dành cho kiểm thử và debug)
  const handleReplayIntro = () => {
    setIsSkipped(false);
    setIsIntroPlayed(false);
    setTimelineState('closed');
    if (typeof window !== 'undefined') {
      window.sessionStorage.removeItem(SESSION_INTRO_KEY);
    }
    setIntroReplayKey((k) => k + 1);
  };

  // Người dùng tương tác vào form tìm kiếm -> hoàn tất intro an toàn, không khóa form
  const handleFormInteraction = () => {
    if (!isIntroPlayed && !isSkipped) {
      handleSkipIntro();
    }
  };

  // Thông báo lỗi nhẹ khi tải asset (Step 9 xe, Step 12 cảnh)
  const [sceneToast, setSceneToast] = useState<{ text: string; id: number } | null>(null);
  const [simulateSceneErrorTrigger, setSimulateSceneErrorTrigger] = useState<boolean>(false);

  // Step 9 & 12: Tự động đóng thông báo lỗi sau 4.5 giây
  useEffect(() => {
    if (!vehicleToast) return;
    const timer = setTimeout(() => {
      setVehicleToast(null);
    }, 4500);
    return () => clearTimeout(timer);
  }, [vehicleToast]);

  useEffect(() => {
    if (!sceneToast) return;
    const timer = setTimeout(() => {
      setSceneToast(null);
    }, 4500);
    return () => clearTimeout(timer);
  }, [sceneToast]);

  // Step 9: Xử lý sự cố tải model xe - giữ nguyên xe trước đó và hiện thông báo trạng thái nhẹ
  const handleVehicleError = (failedCategory: VehicleCategory, fallbackCategory: VehicleCategory) => {
    const nameMap: Record<VehicleCategory, string> = {
      sleeper: 'Giường nằm',
      limousine: 'Limousine',
      cabin: 'Cabin VIP',
    };
    setSelectedVehicle(fallbackCategory);
    setVehicleToast({
      text: `Mô hình ${nameMap[failedCategory] || failedCategory} gặp sự cố khi tải. Giữ hiển thị xe ${nameMap[fallbackCategory] || fallbackCategory}.`,
      id: Date.now(),
    });
  };

  // Step 9: Giả lập lỗi tải mô hình để kiểm thử nghiệm thu kịch bản asset xe lỗi
  const handleSimulateVehicleError = () => {
    const targetError: VehicleCategory = selectedVehicle === 'cabin' ? 'limousine' : 'cabin';
    handleVehicleError(targetError, selectedVehicle);
  };

  // Step 12: Xử lý sự cố tải cảnh - không commit broken scene, giữ cảnh trước đó và hiện thông báo
  const handleSceneError = (targetRoute: { from: string; to: string }, errorMsg: string) => {
    setSceneToast({
      text: errorMsg || `Không thể tải cảnh quan cho tuyến ${targetRoute.from} → ${targetRoute.to}. Giữ cảnh trước đó.`,
      id: Date.now(),
    });
    setSimulateSceneErrorTrigger(false);
  };

  // Step 12: Giả lập lỗi tải cảnh để kiểm thử nghiệm thu kịch bản asset cảnh lỗi
  const handleSimulateSceneError = () => {
    setSimulateSceneErrorTrigger(true);
    handleSceneError(
      currentRoute,
      `Giả lập sự cố tải mô hình 3D cho ${currentRoute.to}. Giữ cảnh trước đó an toàn.`
    );
  };

  const vehicleOptions: { id: VehicleCategory; label: string; icon: React.ReactNode }[] = [
    { id: 'sleeper', label: 'Giường nằm', icon: <BedDouble size={16} /> },
    { id: 'limousine', label: 'Limousine', icon: <Armchair size={16} /> },
    { id: 'cabin', label: 'Cabin VIP', icon: <Crown size={16} /> },
  ];

  const handleRoutePreview = (from: string, to: string) => {
    setCurrentRoute({ from, to });
  };

  return (
    <section
      className="danava-go-hero w-full bg-[#F7F4EC] text-[#102744] overflow-visible relative"
      aria-label="DANAVA GO — Vé mở ra hành trình"
    >
      <div className="max-w-[1380px] mx-auto px-4 sm:px-6">
        {/* HERO STAGE: LEFT EDITORIAL + RIGHT 3D FOLDING TICKET STAGE */}
        <div className="relative w-full aspect-auto lg:aspect-[1376/570] flex flex-col lg:flex-row items-stretch pt-2 lg:pt-4">
          {/* EDITORIAL CONTENT (LEFT) */}
          <motion.div
            className="w-full lg:w-[54%] max-w-[700px] z-10 flex flex-col justify-start lg:pr-6 pt-2 lg:pt-4"
            initial={shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Brand Eyebrow */}
            <div className="inline-flex items-center gap-2 text-[11px] font-bold tracking-[0.14em] uppercase text-[#0097A7] mb-2.5">
              <Sparkles className="w-3.5 h-3.5 text-[#0097A7]" />
              <span>DANAVA GO • HÀNH TRÌNH KHÁM PHÁ VIỆT NAM</span>
            </div>

            {/* Headline */}
            <h1 className="font-serif text-[38px] sm:text-[48px] lg:text-[60px] font-bold leading-[1.10] tracking-[-0.025em] text-[#102744] mb-3">
              <span className="block text-[#102744]">Đi một chuyến.</span>
              <span className="block text-[#102744]">
                Mở ngàn <span className="inline-block whitespace-nowrap">trải nghiệm.</span>
              </span>
            </h1>

            {/* Description */}
            <p className="font-sans text-[15px] sm:text-[16px] text-[#4A5568] leading-relaxed max-w-[480px] mb-4 sm:mb-5">
              Chọn chuyến yêu thích. Chạm đến những miền đất mới.
            </p>

            {/* Vehicle Selection Chips */}
            <div className="mb-4" role="group" aria-label="Chọn loại xe">
              <div className="flex flex-wrap items-center gap-2.5">
                {vehicleOptions.map((v) => {
                  const isActive = selectedVehicle === v.id;
                  return (
                    <button
                      key={v.id}
                      type="button"
                      aria-pressed={isActive}
                      onClick={() => setSelectedVehicle(v.id)}
                      className={`inline-flex items-center gap-2 h-11 sm:h-12 px-4 sm:px-5 rounded-full text-xs sm:text-[13px] font-semibold transition-all duration-200 cursor-pointer ${
                        isActive
                          ? 'bg-[#102744] text-[#FFFEFA] shadow-[0_4px_12px_rgba(16,39,68,0.18)] scale-[1.02]'
                          : 'bg-[#FFF9ED] hover:bg-[#FFFEFA] text-[#102744] border border-[#D8D4C9] hover:border-[#102744] hover:-translate-y-0.5'
                      }`}
                    >
                      {v.icon}
                      <span>{v.label}</span>
                    </button>
                  );
                })}

                {/* Nút giả lập lỗi tải xe kiểm thử nghiệm thu khi bật debug */}
                {isDebug && (
                  <button
                    type="button"
                    onClick={handleSimulateVehicleError}
                    className="inline-flex items-center gap-1.5 h-11 sm:h-12 px-3.5 rounded-full text-xs font-mono bg-[#FFF3E0] hover:bg-[#FFE0B2] text-[#E65100] border border-[#FFB74D] cursor-pointer transition-colors shadow-sm"
                    title="Giả lập lỗi tải mô hình để kiểm thử fallback và thông báo nhẹ"
                  >
                    <AlertCircle size={14} />
                    <span>Test Lỗi Xe ⚠</span>
                  </button>
                )}
              </div>

              {/* Thông báo trạng thái nhẹ khi có lỗi tải asset xe hoặc cảnh quan */}
              <AnimatePresence>
                {vehicleToast && (
                  <motion.div
                    key={vehicleToast.id}
                    initial={{ opacity: 0, y: -4, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -4, scale: 0.98 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-center justify-between gap-3 mt-3 px-3.5 py-2.5 rounded-xl text-xs font-medium bg-[#FFF8E1] text-[#6D4C41] border border-[#FFE082] shadow-sm max-w-[480px] pointer-events-auto"
                    role="status"
                    aria-live="polite"
                  >
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-[#F57C00] shrink-0" />
                      <span>{vehicleToast.text}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setVehicleToast(null)}
                      className="text-[#8D6E63] hover:text-[#3E2723] text-sm font-bold px-1.5 py-0.5 rounded hover:bg-[#FFE082]/40 transition-colors cursor-pointer"
                      aria-label="Đóng thông báo"
                    >
                      ✕
                    </button>
                  </motion.div>
                )}

                {sceneToast && (
                  <motion.div
                    key={sceneToast.id}
                    initial={{ opacity: 0, y: -4, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -4, scale: 0.98 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-center justify-between gap-3 mt-3 px-3.5 py-2.5 rounded-xl text-xs font-medium bg-[#E0F2F1] text-[#004D40] border border-[#80CBC4] shadow-sm max-w-[480px] pointer-events-auto"
                    role="status"
                    aria-live="polite"
                  >
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-[#00897B] shrink-0" />
                      <span>{sceneToast.text}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSceneToast(null)}
                      className="text-[#004D40] hover:text-[#00251A] text-sm font-bold px-1.5 py-0.5 rounded hover:bg-[#80CBC4]/40 transition-colors cursor-pointer"
                      aria-label="Đóng thông báo"
                    >
                      ✕
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* 3D TICKET SCENE STAGE (RIGHT / CENTER-RIGHT)
              Stable geometry scaffold: exact aspect ratio to prevent layout shifts.
              Seamlessly renders the Three.js 3D Canvas with soft lighting & cream background.
          */}
          <div
            className="w-full lg:absolute lg:inset-0 lg:left-0 pointer-events-none z-[5] flex items-center justify-end"
          >
            <div
              className="w-full lg:w-[62%] aspect-[1376/720] max-h-[570px] relative rounded-2xl overflow-hidden pointer-events-none border border-[#E5E3DC]/80 bg-[#F7F4EC] shadow-[0_16px_40px_-12px_rgba(16,39,68,0.08)] flex flex-col justify-between"
              data-testid="danava-go-stage-scaffold"
            >
              {/* Lazy-loaded 3D WebGL Canvas Layer */}
              <div
                className="absolute inset-0 w-full h-full pointer-events-none z-[1] overflow-hidden"
                aria-hidden="true"
              >
                <Suspense fallback={<WebGLFallback message="Đang khởi tạo không gian 3D Three.js..." />}>
                  <JourneyCanvas
                    isDebug={isDebug}
                    flapAngle={debugFlapAngle}
                    shouldReduceMotion={!!shouldReduceMotion}
                    coachReplayKey={coachReplayKey}
                    fromCity={currentRoute.from}
                    toCity={currentRoute.to}
                    isIntroPlayed={isIntroPlayed}
                    introReplayKey={introReplayKey}
                    isSkipped={isSkipped}
                    onTimelineStateChange={setTimelineState}
                    onTimelineComplete={handleIntroComplete}
                    selectedVehicle={selectedVehicle}
                    onVehicleError={handleVehicleError}
                    simulateSceneError={simulateSceneErrorTrigger}
                    onSceneError={handleSceneError}
                  />
                </Suspense>
              </div>

              {/* Stage Header Strip */}
              <div className="relative z-10 flex items-center justify-between border-b border-[#E5E3DC]/60 px-5 pt-3.5 pb-2.5 bg-gradient-to-b from-[#FFFDF8]/90 to-transparent pointer-events-auto">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#0097A7]" />
                  <span className="font-serif text-sm font-bold text-[#102744] tracking-wider">
                    DANAVA GO • {currentRoute.from.toUpperCase()} → {currentRoute.to.toUpperCase()}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {/* Nút bỏ qua intro nhanh nếu intro đang chạy */}
                  {timelineState !== 'ready' && !shouldReduceMotion && (
                    <button
                      type="button"
                      onClick={handleSkipIntro}
                      className="pointer-events-auto text-[11px] font-semibold bg-[#102744] hover:bg-[#0097A7] text-white px-2.5 py-0.5 rounded-full transition-all cursor-pointer shadow-sm flex items-center gap-1 active:scale-95"
                      title="Bỏ qua hiệu ứng mở vé để vào ngay trạng thái sẵn sàng"
                    >
                      Bỏ qua ▶
                    </button>
                  )}

                  {isDebug && (
                    <>
                      <span
                        className="pointer-events-auto text-[10px] font-mono bg-[#102744] text-[#00E5FF] px-2 py-0.5 rounded border border-[#00E5FF]/40"
                        title="Trạng thái timeline tập trung"
                      >
                        {timelineState}
                      </span>
                      <button
                        type="button"
                        onClick={handleReplayIntro}
                        className="pointer-events-auto text-[11px] font-mono bg-[#0097A7] hover:bg-[#00838F] text-white px-2.5 py-0.5 rounded transition-colors cursor-pointer shadow-sm"
                        title="Phát lại toàn bộ intro 2.5s (mở vé, nổi cảnh, xe chạy, vẽ tuyến)"
                      >
                        Phát lại Intro ▶
                      </button>
                      <button
                        type="button"
                        onClick={() => setCoachReplayKey((k) => k + 1)}
                        className="pointer-events-auto text-[11px] font-mono bg-[#37474F] hover:bg-[#455A64] text-white px-2 py-0.5 rounded transition-colors cursor-pointer shadow-sm"
                        title="Phát lại riêng xe chạy"
                      >
                        Xe ▶
                      </button>
                      <button
                        type="button"
                        onClick={handleSimulateVehicleError}
                        className="pointer-events-auto text-[11px] font-mono bg-[#E65100] hover:bg-[#F57C00] text-white px-2 py-0.5 rounded transition-colors cursor-pointer shadow-sm"
                        title="Giả lập lỗi tải xe để kiểm thử fallback và thông báo nhẹ"
                      >
                        Test Lỗi Xe ⚠
                      </button>
                      <button
                        type="button"
                        onClick={handleSimulateSceneError}
                        className="pointer-events-auto text-[11px] font-mono bg-[#00695C] hover:bg-[#00897B] text-white px-2 py-0.5 rounded transition-colors cursor-pointer shadow-sm"
                        title="Giả lập lỗi tải cảnh để kiểm thử không commit broken scene"
                      >
                        Test Lỗi Cảnh ⚠
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setCurrentRoute((prev) => {
                            if (prev.from === 'Đà Nẵng' && prev.to === 'Huế') {
                              return { from: 'Đà Nẵng', to: 'Nha Trang' };
                            }
                            if (prev.from === 'Đà Nẵng' && prev.to === 'Nha Trang') {
                              return { from: 'Đà Nẵng', to: 'TP. Hồ Chí Minh' };
                            }
                            if (prev.from === 'Đà Nẵng' && prev.to === 'TP. Hồ Chí Minh') {
                              return { from: 'TP. Hồ Chí Minh', to: 'Đà Nẵng' };
                            }
                            if (prev.from === 'TP. Hồ Chí Minh' && prev.to === 'Đà Nẵng') {
                              return { from: 'Đà Nẵng', to: 'Đà Lạt' };
                            }
                            return { from: 'Đà Nẵng', to: 'Huế' };
                          });
                        }}
                        className="pointer-events-auto text-[11px] font-mono bg-[#00838F] hover:bg-[#0097A7] text-white px-2 py-0.5 rounded transition-colors cursor-pointer shadow-sm"
                        title="Chuyển nhanh tuyến mẫu để kiểm thử landmark 3D (Huế, Nha Trang, TP. HCM đến/đi, Fallback)"
                      >
                        Đổi Tuyến: {currentRoute.from === 'TP. Hồ Chí Minh' ? 'TP. HCM (Đi) 🏙' : currentRoute.to === 'TP. Hồ Chí Minh' ? 'TP. HCM (Đến) 🏙' : currentRoute.to === 'Nha Trang' ? 'Nha Trang 🏖' : currentRoute.to === 'Đà Lạt' ? 'Đà Lạt (Fallback) 🌲' : 'Huế ⛩'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setDebugFlapAngle((prev) => (prev === 0 ? Math.PI : 0))}
                        className="pointer-events-auto text-[11px] font-mono bg-[#263238] hover:bg-[#37474F] text-white px-2 py-0.5 rounded transition-colors cursor-pointer shadow-sm"
                        title="Góc xoay flap"
                      >
                        {debugFlapAngle === 0 ? 'Mở (0°)' : 'Gập (180°)'}
                      </button>
                    </>
                  )}
                  <span className="text-[11px] font-semibold text-[#718096] bg-[#FFF9ED] px-2.5 py-0.5 rounded-md border border-[#E5E3DC]">
                    {currentRoute.from} → {currentRoute.to}
                  </span>
                </div>
              </div>

              {/* Stage Footer Meta (Step 10: Hiển thị chính xác landmark độc bản của từng thành phố) */}
              <div className="relative z-10 flex items-center justify-between text-[11px] text-[#718096] px-5 py-2.5 border-t border-[#E5E3DC]/60 bg-gradient-to-t from-[#FFFDF8]/90 to-transparent">
                <span>Tuyến mẫu: {currentRoute.from} — {currentRoute.to}</span>
                <span className="italic">
                  {resolveDestination(currentRoute.from, 'origin').model.name.split('&')[0].trim()} ({resolveDestination(currentRoute.from, 'origin').displayName}) →{' '}
                  {resolveDestination(currentRoute.to, 'destination').model.name.split('&')[0].trim()} ({resolveDestination(currentRoute.to, 'destination').displayName}) •{' '}
                  {selectedVehicle === 'limousine'
                    ? 'Xe Limousine VIP 9–11 Chỗ'
                    : selectedVehicle === 'cabin'
                    ? 'Xe Cabin VIP (Cung Điện Di Động)'
                    : 'Xe Giường Nằm'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM DOCK: SEARCH FORM & VALUE PROPS */}
        <div
          className="relative z-20 mt-4 lg:-mt-14"
          id="hero-search"
          onFocusCapture={handleFormInteraction}
          onClickCapture={handleFormInteraction}
        >
          <TripSearchForm
            variant="horizontal-bar"
            initialParams={{
              from: currentRoute.from,
              to: currentRoute.to,
              date: initialParams.date,
              passengers: initialParams.passengers,
            }}
            onRouteChange={handleRoutePreview}
            onSearch={onSearch}
            isLoading={isSearching}
          />
          <div className="flex justify-center gap-6 sm:gap-7 flex-wrap text-xs text-[#4A5568] mt-2.5">
            <span className="flex items-center gap-2 font-medium">
              <Armchair className="w-3.5 h-3.5 text-[#0097A7] shrink-0" />
              Chọn chỗ trực quan.
            </span>
            <span className="flex items-center gap-2 font-medium">
              <QrCode className="w-3.5 h-3.5 text-[#0097A7] shrink-0" />
              Vé điện tử dễ tra cứu.
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
