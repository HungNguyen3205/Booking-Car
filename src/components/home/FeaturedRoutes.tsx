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
      image: '/assets/images/scenes/scene_danang.jpg',
      from: 'Đà Nẵng',
      to: 'Huế',
    },
    {
      id: 'hue',
      title: 'Huế',
      image: '/assets/images/scenes/scene_hue.jpg',
      from: 'Huế',
      to: 'Đà Nẵng',
    },
    {
      id: 'other',
      title: 'Những cung đường khác',
      image: '/assets/images/scenes/scene_hoi_an.jpg',
      from: 'Đà Nẵng',
      to: 'Hội An',
    },
  ];

  return (
    <section id="routes-section" className="pt-3 sm:pt-4 pb-12 bg-[#F7F4EC]">
      <div className="max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Subtle horizontal separator between hero dock and destinations */}
        <div className="border-t border-[#E5E3DC]/90 mb-6 sm:mb-8" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 lg:gap-8">
          {/* LEFT: EDITORIAL SERIF HEADLINE */}
          <div className="lg:w-[28%] shrink-0">
            <h2 className="font-serif font-bold text-2xl sm:text-3xl lg:text-[34px] leading-[1.15] tracking-tight">
              <span className="block text-[#102744]">Mỗi cung đường,</span>
              <span className="block text-[#0097A7]">một câu chuyện.</span>
            </h2>
          </div>

          {/* RIGHT: THREE DESTINATION PHOTO CARDS */}
          <div className="lg:w-[72%] flex sm:grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4 overflow-x-auto sm:overflow-visible pb-2 sm:pb-0 scrollbar-none">
            {destinationCards.map((card) => (
              <button
                key={card.id}
                type="button"
                onClick={() => onSelectRoute(card.from, card.to)}
                className="group relative h-24 sm:h-28 rounded-xl overflow-hidden border border-[#E5E3DC]/80 hover:border-[#0097A7]/50 shadow-2xs hover:shadow-md transition-all text-left flex flex-col justify-end p-3.5 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#0097A7] min-w-[220px] sm:min-w-0 flex-1 shrink-0 sm:shrink"
                aria-label={`Xem tuyến ${card.title}`}
              >
                {/* Background Landscape Photo with gentle zoom (scale max 1.03 within card bounds) */}
                <img
                  src={card.image}
                  alt={card.title}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300 ease-out pointer-events-none"
                  loading="lazy"
                />

                {/* Dark Gradient Overlay for text contrast */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent pointer-events-none" />

                {/* Card Title + Small Arrow Button */}
                <div className="relative z-10 flex items-center justify-between gap-2">
                  <span className="font-serif font-bold text-white text-base sm:text-lg drop-shadow-xs truncate">
                    {card.title}
                  </span>

                  {/* Circular Arrow Badge */}
                  <div className="w-6 h-6 rounded-full bg-white/25 backdrop-blur-xs flex items-center justify-center text-white group-hover:bg-[#0097A7] group-hover:scale-105 transition-all shrink-0">
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

