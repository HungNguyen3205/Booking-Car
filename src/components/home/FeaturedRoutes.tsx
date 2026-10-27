import React from 'react';
import { ArrowRight, Sparkles, Compass } from 'lucide-react';

interface FeaturedRoutesProps {
  onSelectRoute: (from: string, to: string) => void;
  onPreviewRoute?: (from: string, to: string) => void;
}

export const FeaturedRoutes: React.FC<FeaturedRoutesProps> = ({
  onSelectRoute,
  onPreviewRoute,
}) => {
  const destinationCards = [
    {
      id: 'dn-hue',
      title: 'Đà Nẵng ↔ Huế',
      tagline: 'Cố đô di sản & Cầu Rồng',
      badge: 'Di sản',
      priceFrom: 'Từ 180.000đ',
      image: '/assets/images/scenes/scene_hue.jpg',
      from: 'Đà Nẵng',
      to: 'Huế',
    },
    {
      id: 'dn-nt',
      title: 'Đà Nẵng ↔ Nha Trang',
      tagline: 'Tháp Trầm Hương & Vịnh ngọc',
      badge: 'Biển xanh',
      priceFrom: 'Từ 320.000đ',
      image: '/assets/images/scenes/scene_danang.jpg',
      from: 'Đà Nẵng',
      to: 'Nha Trang',
    },
    {
      id: 'dn-sg',
      title: 'Đà Nẵng ↔ TP. HCM',
      tagline: 'Chuyên cơ xuyên Việt • Landmark 81',
      badge: 'VIP Cabin',
      priceFrom: 'Từ 490.000đ',
      image: '/assets/images/scenes/scene_hoi_an.jpg',
      from: 'Đà Nẵng',
      to: 'TP. Hồ Chí Minh',
    },
    {
      id: 'sg-dl',
      title: 'TP. HCM ↔ Đà Lạt',
      tagline: 'Thành phố ngàn hoa & Rừng thông',
      badge: 'Cao nguyên',
      priceFrom: 'Từ 380.000đ',
      image: '/assets/images/hero_landscape_danang_hue.jpg',
      from: 'TP. Hồ Chí Minh',
      to: 'Đà Lạt',
    },
  ];

  const handleCardClick = (from: string, to: string) => {
    if (onPreviewRoute) {
      onPreviewRoute(from, to);
      document.getElementById('hero-search')?.scrollIntoView({ behavior: 'smooth' });
    } else {
      onSelectRoute(from, to);
    }
  };

  return (
    <section id="routes-section" className="pt-4 sm:pt-6 pb-12 sm:pb-16 bg-[#F7F4EC]">
      <div className="max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Subtle horizontal separator */}
        <div className="border-t border-[#E5E3DC]/90 mb-6 sm:mb-8" />

        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-bold tracking-widest text-[#2B4294] uppercase mb-1.5 font-sans">
              <Compass className="w-3.5 h-3.5 text-[#2B4294]" />
              <span>ĐIỂM ĐẾN NỔI BẬT DANAVA GO</span>
            </div>
            <h2 className="font-sans font-bold text-2xl sm:text-3xl lg:text-[34px] leading-tight text-[#2B4294]">
              Mỗi cung đường, <span className="text-[#53A5DB]">một câu chuyện di sản.</span>
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-[#647084] max-w-md">
            Chọn hành trình yêu thích, khám phá miền đất mới và đặt vé an toàn.
          </p>
        </div>

        {/* Four Destination Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {destinationCards.map((card) => (
            <div
              key={card.id}
              className="group relative rounded-2xl overflow-hidden border border-[#E5E3DC] hover:border-[#2B4294]/60 shadow-2xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between bg-[#14204A] h-[220px] sm:h-[240px] p-4"
            >
              {/* Background Landscape Photo */}
              <img
                src={card.image}
                alt={card.title}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out pointer-events-none opacity-75 group-hover:opacity-85"
                loading="lazy"
              />

              {/* Gradient Overlay for high readability */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#14204A] via-[#14204A]/50 to-black/30 pointer-events-none" />

              {/* Top Badge Strip */}
              <div className="relative z-10 flex items-center justify-between">
                <span className="text-[11px] font-bold text-white bg-[#2B4294]/90 backdrop-blur-xs px-2.5 py-1 rounded-full shadow-xs">
                  {card.badge}
                </span>
                <span className="text-xs font-semibold text-[#FFFEFA]/90 bg-black/40 backdrop-blur-xs px-2 py-0.5 rounded-md">
                  {card.priceFrom}
                </span>
              </div>

              {/* Bottom Info and Dual Real Action Buttons */}
              <div className="relative z-10 flex flex-col gap-2">
                <div>
                  <h3 className="font-sans font-bold text-white text-base sm:text-lg drop-shadow-xs">
                    {card.title}
                  </h3>
                  <p className="text-[11px] text-[#E2E8F0] line-clamp-1 opacity-90">
                    {card.tagline}
                  </p>
                </div>

                {/* Real Action Buttons */}
                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-white/15">
                  <button
                    type="button"
                    onClick={() => handleCardClick(card.from, card.to)}
                    className="inline-flex items-center justify-center gap-1 py-1.5 px-2 bg-white/20 hover:bg-white/35 active:scale-95 text-white text-[11px] font-semibold rounded-lg backdrop-blur-xs transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-white"
                    title="Khám phá cảnh hành trình và cập nhật form"
                    aria-label={`Xem cảnh hành trình tuyến ${card.title}`}
                  >
                    <Sparkles className="w-3 h-3 text-[#F5AE1B]" />
                    <span>Xem hành trình</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onSelectRoute(card.from, card.to)}
                    className="inline-flex items-center justify-center gap-1 py-1.5 px-2 bg-[#2B4294] hover:bg-[#1E2F6B] active:scale-95 text-white text-[11px] font-bold rounded-lg transition-all cursor-pointer shadow-xs focus-visible:outline-2 focus-visible:outline-[#53A5DB]"
                    title="Tìm chuyến xe ngay cho tuyến này"
                    aria-label={`Tìm vé ngay tuyến ${card.title}`}
                  >
                    <span>Tìm vé ngay</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
