import React from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { getHeroRouteConfig } from './heroAssetConfig';
import { MapPin } from 'lucide-react';

interface LayeredSceneStageProps {
  fromCity: string;
  toCity: string;
  className?: string;
}

export const LayeredSceneStage: React.FC<LayeredSceneStageProps> = ({
  fromCity,
  toCity,
  className = '',
}) => {
  const shouldReduceMotion = useReducedMotion();
  const routeConfig = getHeroRouteConfig(fromCity, toCity);

  return (
    <div
      className={`relative w-full h-full overflow-hidden select-none pointer-events-none ${className}`}
      aria-hidden="true"
    >
      {/* 1. LỚP NỀN: BẦU TRỜI & ÁNH SÁNG KEM ẤM */}
      <div className="absolute inset-0 bg-[#F7F4EC]" />

      {/* HỌA TIẾT VĂN HÓA ĐÔNG SƠN / TRỐNG ĐỒNG Ở ĐỘ TƯƠNG PHẢN RẤT THẤP (3.5% OPACITY) */}
      <div
        className="hidden lg:block absolute left-[-60px] top-[-60px] w-[540px] h-[540px] pointer-events-none opacity-[0.035]"
        aria-hidden="true"
      >
        <svg viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full text-[#102744]">
          <circle cx="200" cy="200" r="190" stroke="currentColor" strokeWidth="2" strokeDasharray="3 3" />
          <circle cx="200" cy="200" r="165" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="200" cy="200" r="135" stroke="currentColor" strokeWidth="2" strokeDasharray="6 4" />
          <circle cx="200" cy="200" r="105" stroke="currentColor" strokeWidth="1" />
          <circle cx="200" cy="200" r="70" stroke="currentColor" strokeWidth="2" strokeDasharray="2 4" />
          <circle cx="200" cy="200" r="35" stroke="currentColor" strokeWidth="1.5" />
          {/* Tia sáng mặt trời trung tâm */}
          <path d="M200 165 L200 235 M165 200 L235 200 M175 175 L225 225 M175 225 L225 175" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </div>

      {/* 2. CẢNH QUAN SA BÀN HÀNH TRÌNH ĐA TẦNG (LANDMARKS & ROAD ĐỘC LẬP) */}
      <AnimatePresence>
        <motion.div
          key={routeConfig.id}
          initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0 }}
          transition={{ duration: shouldReduceMotion ? 0.05 : 0.35, ease: 'easeOut' }}
          className="absolute inset-0 w-full h-full flex items-center justify-end"
        >
          {/* Khung chứa các lớp phong cảnh và đường tiền cảnh trải rộng */}
          <div className="relative w-full h-full max-w-[1560px] ml-auto overflow-hidden">
            
            {/* LỚP 2A: ĐỊA DANH BIỂU TƯỢNG (LANDMARKS LAYER — Cầu Rồng Đà Nẵng, Phố Cổ Hội An, Sông Hoài) */}
            <div className="absolute inset-0 w-full h-full z-2 pointer-events-none">
              <img
                src={routeConfig.landmarksAsset}
                alt={`${routeConfig.title} — Địa danh`}
                className={`w-full h-full object-cover lg:object-contain object-right-bottom transition-opacity duration-300 ${
                  routeConfig.isNeutralFallback ? 'opacity-88' : 'opacity-98'
                }`}
                style={{
                  maskImage:
                    'linear-gradient(to right, transparent 0%, transparent 10%, rgba(0,0,0,0.5) 20%, rgba(0,0,0,0.95) 30%, black 38%, black 100%)',
                  WebkitMaskImage:
                    'linear-gradient(to right, transparent 0%, transparent 10%, rgba(0,0,0,0.5) 20%, rgba(0,0,0,0.95) 30%, black 38%, black 100%)',
                }}
              />
            </div>

            {/* LỚP 2B: MẶT ĐƯỜNG TIỀN CẢNH ĐỘC LẬP (FOREGROUND ROAD LAYER — Mặt đường nhựa, vạch sơn, lan can) */}
            <div className="absolute inset-0 w-full h-full z-4 pointer-events-none">
              <img
                src={routeConfig.roadAsset}
                alt="Mặt đường tiền cảnh"
                className="w-full h-full object-cover lg:object-contain object-right-bottom transition-opacity duration-300 opacity-100"
                style={{
                  maskImage:
                    'linear-gradient(to right, transparent 0%, transparent 8%, rgba(0,0,0,0.6) 18%, black 28%, black 100%)',
                  WebkitMaskImage:
                    'linear-gradient(to right, transparent 0%, transparent 8%, rgba(0,0,0,0.6) 18%, black 28%, black 100%)',
                }}
              />
            </div>

            {/* Dải sáng phản chiếu ngọc bích êm ái */}
            <div className="absolute inset-0 bg-gradient-to-tr from-[#0097A7]/6 via-transparent to-[#D4AF37]/4 mix-blend-soft-light pointer-events-none z-5" />

            {/* LỚP 3: ĐƯỜNG HÀNH TRÌNH THANH MẢNH KẾT NỐI HAI ĐỊA DANH */}
            {!routeConfig.isNeutralFallback && (
              <svg
                className="hidden lg:block absolute inset-0 w-full h-full pointer-events-none z-6"
                viewBox="0 0 1000 600"
                preserveAspectRatio="none"
              >
                <path
                  d="M 445 150 Q 620 90 790 120"
                  fill="none"
                  stroke="#0097A7"
                  strokeWidth="1.5"
                  strokeDasharray="4 6"
                  strokeOpacity="0.5"
                />
              </svg>
            )}

            {/* LỚP 4: DẤU ĐIỂM ĐẾN VÀ TÊN ĐỊA DANH */}
            {!routeConfig.isNeutralFallback && (
              <div className="relative z-8">
                {/* Điểm khởi hành */}
                <motion.div
                  initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15, duration: 0.35 }}
                  className="absolute pointer-events-auto cursor-default hidden sm:flex flex-col items-center"
                  style={{
                    left: routeConfig.originBadge.badgePositionDesktop.left,
                    top: routeConfig.originBadge.badgePositionDesktop.top,
                  }}
                >
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#FFFDF8]/90 backdrop-blur-sm border border-[#E5E3DC]/90 shadow-[0_2px_8px_rgba(16,39,68,0.06)] text-[11px] font-semibold text-[#102744]">
                    <span className="w-2 h-2 rounded-full bg-[#0097A7]" />
                    <span>{routeConfig.originBadge.city}</span>
                    <span className="text-[10px] text-[#718096] font-normal">({routeConfig.originBadge.landmark})</span>
                  </div>
                  <div className="w-1.5 h-1.5 rotate-45 bg-[#FFFDF8] border-r border-b border-[#E5E3DC]/90 -mt-1" />
                </motion.div>

                {/* Điểm đến */}
                <motion.div
                  initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25, duration: 0.35 }}
                  className="absolute pointer-events-auto cursor-default hidden sm:flex flex-col items-center"
                  style={{
                    left: routeConfig.destinationBadge.badgePositionDesktop.left,
                    top: routeConfig.destinationBadge.badgePositionDesktop.top,
                  }}
                >
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#FFFDF8]/90 backdrop-blur-sm border border-[#E5E3DC]/90 shadow-[0_2px_8px_rgba(16,39,68,0.06)] text-[11px] font-semibold text-[#102744]">
                    <MapPin className="w-3 h-3 text-[#D4AF37]" />
                    <span>{routeConfig.destinationBadge.city}</span>
                    <span className="text-[10px] text-[#718096] font-normal">({routeConfig.destinationBadge.landmark})</span>
                  </div>
                  <div className="w-1.5 h-1.5 rotate-45 bg-[#FFFDF8] border-r border-b border-[#E5E3DC]/90 -mt-1" />
                </motion.div>
              </div>
            )}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Lớp gradient bảo vệ độ đọc văn bản bên trái trên Desktop */}
      <div className="hidden lg:block absolute inset-y-0 left-0 w-[40%] bg-gradient-to-r from-[#F7F4EC] via-[#F7F4EC]/92 to-transparent pointer-events-none z-10" />
    </div>
  );
};
