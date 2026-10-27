import React from 'react';
import { motion } from 'framer-motion';
import { CalendarCheck2, Armchair, TicketCheck } from 'lucide-react';

export const BookingSteps: React.FC = () => {
  const steps = [
    {
      num: '01',
      title: 'Chọn chuyến đi',
      desc: 'Tìm kiếm tuyến đường mong muốn, so sánh giờ xuất bến, loại xe và mức giá tốt nhất.',
      icon: CalendarCheck2,
      color: '#2B4294',
    },
    {
      num: '02',
      title: 'Chọn chỗ trực quan',
      desc: 'Mở sơ đồ 3D thực tế của xe, tự do chọn tầng và vị trí ghế/giường còn trống tức thì.',
      icon: Armchair,
      color: '#F5AE1B',
    },
    {
      num: '03',
      title: 'Nhận vé điện tử',
      desc: 'Xác nhận thông tin, thanh toán linh hoạt và nhận vé điện tử kèm mã QR lên xe tiện lợi.',
      icon: TicketCheck,
      color: '#EE3132',
    },
  ];

  return (
    <section className="py-16 sm:py-20 bg-[#F7F4EC] relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2B4294]" />
            <span className="text-xs font-bold tracking-widest text-[#2B4294] uppercase font-sans">
              QUY TRÌNH TINH GỌN
            </span>
          </div>
          <h2 className="font-sans text-3xl sm:text-4xl font-bold text-[#2B4294] tracking-tight">
            Ba bước đến hành trình
          </h2>
          <p className="mt-3 text-sm sm:text-base text-[#647084]">
            Hệ thống đặt vé được tối ưu hóa giúp bạn có tấm vé trong tay chỉ sau chưa đầy một phút.
          </p>
        </div>

        {/* Steps Container with connecting line */}
        <div className="relative">
          {/* Desktop Connecting SVG Line */}
          <div className="hidden md:block absolute top-16 left-1/6 right-1/6 h-1 pointer-events-none z-0">
            <svg className="w-full h-8 overflow-visible" fill="none">
              <motion.line
                x1="0"
                y1="4"
                x2="100%"
                y2="4"
                stroke="#2B4294"
                strokeWidth="2.5"
                strokeDasharray="8 8"
                initial={{ pathLength: 0 }}
                whileInView={{ pathLength: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1.2, ease: 'easeInOut' }}
              />
            </svg>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
            {steps.map((step, idx) => {
              const Icon = step.icon;
              return (
                <div
                  key={idx}
                  className="bg-[#FFFEFA] rounded-3xl p-6 sm:p-8 border border-[#E5E3DC] shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col items-center text-center relative group"
                >
                  {/* Step Number Badge */}
                  <span className="absolute top-4 right-5 text-2xl font-sans font-bold text-[#2B4294]/15 group-hover:text-[#2B4294]/30 transition-colors">
                    {step.num}
                  </span>

                  {/* Icon Circle */}
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5 shadow-xs transition-transform duration-300 group-hover:scale-108"
                    style={{ backgroundColor: `${step.color}15`, color: step.color }}
                  >
                    <Icon className="w-8 h-8" />
                  </div>

                  <h3 className="font-sans text-xl font-bold text-[#2B4294] mb-2">
                    {step.title}
                  </h3>

                  <p className="text-sm text-[#647084] leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
