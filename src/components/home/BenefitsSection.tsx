import React from 'react';
import { Armchair, Navigation, QrCode, ClipboardCheck, ArrowUpRight } from 'lucide-react';

interface BenefitsSectionProps {
  onOpenLookup?: () => void;
}

export const BenefitsSection: React.FC<BenefitsSectionProps> = ({ onOpenLookup }) => {
  const benefits = [
    {
      id: 'seats',
      title: 'Chọn chỗ minh bạch',
      description: 'Sơ đồ xe thể hiện chính xác từng vị trí ghế, giường nằm và lối đi. Đảm bảo đúng số ghế bạn đã chọn.',
      icon: Armchair,
      color: '#2B4294',
      actionLabel: 'Xem sơ đồ xe 3D',
      action: () => {
        document.getElementById('experience-section')?.scrollIntoView({ behavior: 'smooth' });
      },
    },
    {
      id: 'pickup',
      title: 'Điểm đón/trả rõ ràng',
      description: 'Cung cấp danh sách địa chỉ bến xe, văn phòng trung tâm và sân bay kèm thời gian đón dự kiến chuẩn xác.',
      icon: Navigation,
      color: '#F5AE1B',
      actionLabel: 'Khám phá mạng lưới',
      action: () => {
        document.getElementById('routes-section')?.scrollIntoView({ behavior: 'smooth' });
      },
    },
    {
      id: 'ticket',
      title: 'Vé điện tử tiện lợi',
      description: 'Tích hợp mã QR tra cứu nhanh. Lưu vé vào máy hoặc in vé trực tiếp mà không cần đổi vé giấy tại quầy.',
      icon: QrCode,
      color: '#53A5DB',
      actionLabel: 'Thử tra cứu vé',
      action: () => {
        if (onOpenLookup) {
          onOpenLookup();
        } else {
          document.getElementById('hero-search')?.scrollIntoView({ behavior: 'smooth' });
        }
      },
    },
    {
      id: 'info',
      title: 'Thông tin chuyến đầy đủ',
      description: 'Giá vé trọn gói minh bạch, thời lượng hành trình chính xác, tiện ích cao cấp và chính sách hủy đổi rõ ràng.',
      icon: ClipboardCheck,
      color: '#EE3132',
      actionLabel: 'Xem giải đáp & chính sách',
      action: () => {
        document.getElementById('faq-section')?.scrollIntoView({ behavior: 'smooth' });
      },
    },
  ];

  return (
    <section className="py-16 sm:py-20 bg-[#FFFEFA] border-y border-[#E5E3DC]">
      <div className="max-w-[1380px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2B4294]" />
            <span className="text-xs font-bold tracking-widest text-[#2B4294] uppercase font-sans">
              CAM KẾT DỊCH VỤ
            </span>
          </div>
          <h2 className="font-sans text-3xl sm:text-4xl font-bold text-[#2B4294] tracking-tight">
            Vì sao chọn DANAVA GO?
          </h2>
          <p className="mt-3 text-sm sm:text-base text-[#647084]">
            Trải nghiệm đặt vé trực quan được thiết kế xoay quanh sự an tâm và thoải mái của từng hành khách.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {benefits.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                className="bg-[#F7F4EC] rounded-2xl p-6 border border-[#E5E3DC] hover:border-[#2B4294]/50 hover:bg-[#FFFEFA] transition-all duration-300 flex flex-col justify-between group shadow-2xs hover:shadow-md"
              >
                <div>
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-105"
                    style={{ backgroundColor: `${item.color}18`, color: item.color }}
                  >
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-base text-[#2B4294] mb-2 font-sans">
                    {item.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-[#647084] leading-relaxed mb-4">
                    {item.description}
                  </p>
                </div>

                {/* Real interactive action button */}
                <button
                  type="button"
                  onClick={item.action}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#2B4294] hover:text-[#53A5DB] pt-2 border-t border-[#E5E3DC]/60 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#2B4294] rounded-md transition-colors w-full text-left justify-between"
                  aria-label={`${item.actionLabel} cho ${item.title}`}
                >
                  <span>{item.actionLabel}</span>
                  <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
