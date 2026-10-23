import React from 'react';
import { Armchair, Navigation, QrCode, ClipboardCheck } from 'lucide-react';

export const BenefitsSection: React.FC = () => {
  const benefits = [
    {
      title: 'Chọn chỗ minh bạch',
      description: 'Sơ đồ xe thể hiện chính xác từng vị trí ghế, giường nằm và lối đi. Đảm bảo đúng số ghế đã chọn.',
      icon: Armchair,
      color: '#0097A7',
    },
    {
      title: 'Điểm đón/trả rõ ràng',
      description: 'Cung cấp danh sách địa chỉ bến xe, văn phòng trung tâm và sân bay kèm thời gian đón dự kiến chuẩn xác.',
      icon: Navigation,
      color: '#F3B54A',
    },
    {
      title: 'Vé điện tử tiện lợi',
      description: 'Tích hợp mã QR tra cứu nhanh. Lưu vé vào máy hoặc in vé trực tiếp mà không cần đổi vé giấy tại quầy.',
      icon: QrCode,
      color: '#007887',
    },
    {
      title: 'Thông tin chuyến đầy đủ',
      description: 'Giá vé trọn gói minh bạch, thời lượng hành trình chính xác, đầy đủ tiện ích và chính sách hủy đổi rõ ràng.',
      icon: ClipboardCheck,
      color: '#102744',
    },
  ];

  return (
    <section className="py-16 sm:py-20 bg-[#FFFEFA] border-y border-[#E5E3DC]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#0097A7]" />
            <span className="text-xs font-bold tracking-widest text-[#0097A7] uppercase">
              CAM KẾT DỊCH VỤ
            </span>
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#102744] tracking-tight">
            Vì sao chọn HÀNH TRÌNH?
          </h2>
          <p className="mt-3 text-sm sm:text-base text-[#647084]">
            Trải nghiệm đặt vé trực quan được thiết kế xoay quanh sự an tâm và thoải mái của từng hành khách.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {benefits.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="bg-[#F7F4EC] rounded-2xl p-6 border border-[#E5E3DC] hover:border-[#0097A7]/50 hover:bg-[#FFFEFA] transition-all duration-300"
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                  style={{ backgroundColor: `${item.color}18`, color: item.color }}
                >
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-base text-[#102744] mb-2">
                  {item.title}
                </h3>
                <p className="text-xs sm:text-sm text-[#647084] leading-relaxed">
                  {item.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
