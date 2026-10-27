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
      description: 'Xem vị trí ghế, giường và trạng thái còn trống trước khi tiếp tục.',
      icon: Armchair,
      color: '#2B4294',
      actionLabel: 'Khám phá dòng xe',
      action: () => {
        document.getElementById('experience-section')?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
      },
    },
    {
      id: 'pickup',
      title: 'Điểm đón/trả rõ ràng',
      description: 'Chọn điểm đón và trả từ danh sách được cung cấp cho chuyến đi.',
      icon: Navigation,
      color: '#F5AE1B',
      actionLabel: 'Khám phá mạng lưới',
      action: () => {
        document.getElementById('routes-section')?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
      },
    },
    {
      id: 'ticket',
      title: 'Vé điện tử tiện lợi',
      description: 'Tra cứu lại thông tin và lưu hoặc in vé điện tử sau khi hoàn tất.',
      icon: QrCode,
      color: '#53A5DB',
      actionLabel: 'Thử tra cứu vé',
      action: () => {
        if (onOpenLookup) {
          onOpenLookup();
        } else {
          document.getElementById('hero-search')?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
        }
      },
    },
    {
      id: 'info',
      title: 'Thông tin chuyến đầy đủ',
      description: 'Xem giá, lịch trình và loại xe để chọn chuyến phù hợp với nhu cầu.',
      icon: ClipboardCheck,
      color: '#EE3132',
      actionLabel: 'Xem giải đáp & chính sách',
      action: () => {
        document.getElementById('faq-section')?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
      },
    },
  ];

  return <section className="editorial-section editorial-benefits"><div className="editorial-container editorial-benefits-layout"><div><span className="editorial-kicker">AN TÂM CHỌN CHUYẾN</span><h2>Để bạn chỉ cần<br/>mong đến ngày đi.</h2><p>Thông tin rõ ràng, thao tác dễ dàng.<br/>Tận hưởng hành trình từ lúc đặt vé.</p></div><div className="editorial-benefit-list">{benefits.map(item=>{const Icon=item.icon;return <article key={item.id}><Icon size={22}/><div><h3>{item.title}</h3><p>{item.description}</p><button onClick={item.action}>{item.actionLabel}<ArrowUpRight size={15}/></button></div></article>})}</div></div></section>;
};
