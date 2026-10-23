import React from 'react';
import { FEATURED_ROUTES } from '../../data/mockData';
import { bookingService } from '../../services/bookingService';
import { ArrowRight, Clock, MapPin } from 'lucide-react';

interface FeaturedRoutesProps {
  onSelectRoute: (from: string, to: string) => void;
}

export const FeaturedRoutes: React.FC<FeaturedRoutesProps> = ({ onSelectRoute }) => {
  return (
    <section id="routes-section" className="py-16 sm:py-20 bg-[#F7F4EC]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#0097A7]" />
            <span className="text-xs font-bold tracking-widest text-[#0097A7] uppercase">
              HÀNH TRÌNH TIÊU BIỂU
            </span>
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#102744] tracking-tight">
            Tuyến đường nổi bật
          </h2>
          <p className="mt-3 text-sm sm:text-base text-[#647084]">
            Những cung đường di sản và biển xanh miền Trung với tần suất chuyến dày đặc và phương tiện cao cấp nhất.
          </p>
        </div>

        {/* Route Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {FEATURED_ROUTES.map((route) => (
            <div
              key={route.id}
              className="group bg-[#FFFEFA] rounded-3xl overflow-hidden border border-[#E5E3DC] hover:border-[#0097A7]/40 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col"
            >
              {/* Image banner with scale on hover */}
              <div className="relative h-48 sm:h-52 overflow-hidden">
                <img
                  src={route.image}
                  alt={`${route.from} đi ${route.to}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <span className="absolute top-4 left-4 px-3 py-1 bg-white/90 backdrop-blur-xs text-[#102744] text-[11px] font-bold rounded-full uppercase tracking-wider">
                  {route.tag}
                </span>

                {/* Route Pill over image */}
                <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-white text-sm font-semibold">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-[#F3B54A]" />
                    <span>{route.from}</span>
                    <span>→</span>
                    <span>{route.to}</span>
                  </div>
                  <span className="text-xs font-normal opacity-90">{route.distance}</span>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-xs text-[#647084]">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-[#0097A7]" />
                      Thời gian: {route.duration}
                    </span>
                    <span>{route.tripsDaily} chuyến / ngày</span>
                  </div>

                  <div className="pt-2 flex items-baseline justify-between border-t border-[#E5E3DC]">
                    <span className="text-xs text-[#647084]">Giá vé từ:</span>
                    <span className="font-serif font-bold text-xl text-[#0097A7]">
                      {bookingService.formatCurrency(route.priceFrom)}
                    </span>
                  </div>
                </div>

                {/* Action button */}
                <button
                  type="button"
                  onClick={() => onSelectRoute(route.from, route.to)}
                  className="w-full py-2.5 px-4 bg-[#F7F4EC] hover:bg-[#0097A7] text-[#102744] hover:text-white font-semibold text-xs rounded-xl transition-all flex items-center justify-center gap-2 group/btn"
                >
                  <span>Xem chuyến xe</span>
                  <ArrowRight className="w-3.5 h-3.5 transform group-hover/btn:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
