import React from 'react';
import { ArrowRight } from 'lucide-react';

interface FeaturedRoutesProps {
  onSelectRoute: (from: string, to: string) => void;
}

export const FeaturedRoutes: React.FC<FeaturedRoutesProps> = ({ onSelectRoute }) => {
  const destinationCards = [
    {
      id: 'da-nang',
      title: 'Đà Nẵng',
      subtitle: 'THÀNH PHỐ CỦA NHỮNG TRẢI NGHIỆM',
      image: '/assets/images/scenes/scene_danang.jpg',
      from: 'Đà Nẵng',
      to: 'Huế',
    },
    {
      id: 'hue',
      title: 'Huế',
      subtitle: 'DI SẢN GIỮA DÒNG THỜI GIAN',
      image: '/assets/images/scenes/scene_hue.jpg',
      from: 'Huế',
      to: 'Đà Nẵng',
    },
    {
      id: 'other',
      title: 'Những cung đường khác',
      subtitle: 'CÒN NHIỀU ĐIỂM ĐẾN ĐANG CHỜ BẠN',
      image: '/assets/images/scenes/scene_hoi_an.jpg',
      from: 'Đà Nẵng',
      to: 'Hội An',
    },
  ];

  return (
    <section id="routes-section" className="pt-4 sm:pt-6 pb-14 bg-[#F7F4EC]">
      <div className="max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 lg:gap-8">
          {/* LEFT: EDITORIAL SERIF HEADLINE */}
          <div className="lg:w-[28%] shrink-0">
            <h2 className="font-serif font-bold text-3xl sm:text-4xl lg:text-[40px] leading-[1.12] tracking-tight">
              <span className="block text-[#102744]">Mỗi cung đường,</span>
              <span className="block text-[#0097A7]">một câu chuyện.</span>
            </h2>
          </div>

          {/* RIGHT: THREE HORIZONTAL DESTINATION CARDS */}
          <div className="lg:w-[72%] grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4">
            {destinationCards.map((card) => (
              <button
                key={card.id}
                type="button"
                onClick={() => onSelectRoute(card.from, card.to)}
                className="group relative h-24 sm:h-28 rounded-xl overflow-hidden border border-[#E5E3DC]/80 hover:border-[#0097A7]/50 shadow-2xs hover:shadow-md transition-all text-left flex flex-col justify-end p-3.5 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#0097A7]"
                aria-label={`Xem tuyến ${card.title}`}
              >
                {/* Background Landscape Photo with gentle zoom on hover */}
                <img
                  src={card.image}
                  alt={card.title}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 pointer-events-none"
                  loading="lazy"
                />

                {/* Dark Gradient Overlay for optimal contrast */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-black/10 pointer-events-none" />

                {/* Card Title & Subtitle + Arrow */}
                <div className="relative z-10 flex items-end justify-between gap-2">
                  <div className="min-w-0">
                    <span className="block font-serif font-bold text-white text-base sm:text-lg leading-tight drop-shadow-xs">
                      {card.title}
                    </span>
                    <span className="block text-[9px] sm:text-[10px] text-white/85 font-sans font-medium uppercase tracking-wider truncate mt-0.5">
                      {card.subtitle}
                    </span>
                  </div>

                  {/* Circular Arrow Badge */}
                  <div className="w-6 h-6 rounded-full bg-white/20 backdrop-blur-xs flex items-center justify-center text-white group-hover:bg-[#0097A7] group-hover:scale-105 transition-all shrink-0">
                    <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

