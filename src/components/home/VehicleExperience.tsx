import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { VEHICLE_MODELS } from '../../data/mockData';
import type { VehicleCategory } from '../../types';
import { CheckCircle2, Shield, Star, Users } from 'lucide-react';

export const VehicleExperience: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<VehicleCategory>('cabin');
  const vehicle = VEHICLE_MODELS[activeCategory];

  const categories: { id: VehicleCategory; label: string; sub: string }[] = [
    { id: 'cabin', label: 'Cabin Cung Điện VIP', sub: 'Phòng riêng biệt lập' },
    { id: 'limousine', label: 'Limousine 16 Chỗ', sub: 'Chuyên cơ mặt đất' },
    { id: 'sleeper', label: 'Giường Nằm Cao Cấp', sub: '34 khoang đệm êm' },
  ];

  return (
    <section id="experience-section" className="py-16 sm:py-20 bg-[#FFFEFA] border-y border-[#E5E3DC]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2B4294]" />
            <span className="text-xs font-bold tracking-widest text-[#2B4294] uppercase font-sans">
              TIÊU CHUẨN ĐỘI XE
            </span>
          </div>
          <h2 className="font-sans text-3xl sm:text-4xl font-bold text-[#2B4294] tracking-tight">
            Trải nghiệm theo loại xe
          </h2>
          <p className="mt-3 text-sm sm:text-base text-[#647084]">
            Mọi chuyến xe đều được bảo dưỡng định kỳ và trang bị đầy đủ tiện nghi hiện đại để chuyến đi của bạn luôn êm ái.
          </p>
        </div>

        {/* Tab Selection */}
        <div className="flex flex-wrap justify-center gap-3 mb-10">
          {categories.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={`py-3 px-5 sm:px-6 rounded-2xl text-left border transition-all ${
                  isActive
                    ? 'bg-[#2B4294] text-white border-[#2B4294] shadow-md'
                    : 'bg-[#F7F4EC] text-[#2B4294] border-[#E5E3DC] hover:border-[#2B4294]'
                }`}
              >
                <div className="font-bold text-sm sm:text-base">{cat.label}</div>
                <div className={`text-xs mt-0.5 ${isActive ? 'text-slate-300' : 'text-[#647084]'}`}>
                  {cat.sub}
                </div>
              </button>
            );
          })}
        </div>

        {/* Dynamic Vehicle Display with AnimatePresence */}
        <div className="bg-[#F7F4EC] rounded-3xl p-6 sm:p-10 border border-[#E5E3DC]">
          <AnimatePresence mode="wait">
            <motion.div
              key={vehicle.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center"
            >
              {/* Vehicle Image */}
              <div className="lg:col-span-7 flex flex-col items-center justify-center">
                <div className="relative w-full max-w-lg aspect-16/10 rounded-2xl overflow-hidden bg-white p-4 flex items-center justify-center border border-[#E5E3DC] shadow-inner">
                  <img
                    src={vehicle.image}
                    alt={vehicle.name}
                    className="w-full h-full object-contain filter drop-shadow-xl"
                  />
                  <div className="absolute top-4 right-4 bg-[#FFFEFA]/90 backdrop-blur-xs px-2.5 py-1 rounded-full text-xs font-semibold text-[#102744] border border-[#E5E3DC] flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 fill-[#F3B54A] text-[#F3B54A]" />
                    <span>{vehicle.rating} / 5.0</span>
                  </div>
                </div>
              </div>

              {/* Vehicle Details */}
              <div className="lg:col-span-5 space-y-4">
                <div className="inline-block px-3 py-1 bg-[#EBF4FC] text-[#2B4294] border border-[#2B4294]/20 rounded-full text-xs font-bold uppercase tracking-wider font-sans">
                  {vehicle.categoryLabel}
                </div>
                <h3 className="font-sans text-2xl sm:text-3xl font-bold text-[#2B4294]">
                  {vehicle.name}
                </h3>
                <p className="text-sm text-[#647084] leading-relaxed">
                  {vehicle.description}
                </p>

                {/* Key specs */}
                <div className="grid grid-cols-2 gap-3 py-2 border-y border-[#E5E3DC]">
                  <div className="flex items-center gap-2 text-xs text-[#2B4294] font-medium">
                    <Users className="w-4 h-4 text-[#2B4294]" />
                    <span>Sức chứa: {vehicle.seatsTotal} chỗ</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-[#2B4294] font-medium">
                    <Shield className="w-4 h-4 text-[#2B4294]" />
                    <span>Cấu trúc: {vehicle.floors} tầng hiện đại</span>
                  </div>
                </div>

                {/* Amenities List */}
                <div>
                  <h4 className="text-xs font-bold text-[#2B4294] uppercase tracking-wider mb-2.5 font-sans">
                    Tiện ích nổi bật trên xe
                  </h4>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {vehicle.amenities.map((amenity, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-xs text-[#2B4294]">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#53A5DB] shrink-0" />
                        <span>{amenity}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
};
