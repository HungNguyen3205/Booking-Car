import React, { useState } from 'react';

import { ChevronDown } from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';

export const FaqSection: React.FC = () => {
  const reduced=useReducedMotion();
  const FAQ_LIST=[
    {question:'Tôi có thể đổi hoặc hủy vé như thế nào?',answer:'Điều kiện đổi, hủy phụ thuộc từng chuyến và nhà vận chuyển. Hãy kiểm tra chính sách áp dụng trước khi đặt. Bản demo hiện chưa xử lý hoàn tiền thực tế.'},
    {question:'Làm thế nào để nhận và tra cứu vé?',answer:'Sau bước xác nhận, vé điện tử được hiển thị để bạn lưu hoặc in. Bản demo lưu vé trên trình duyệt đã đặt; bạn có thể tra cứu lại tại mục Tra cứu vé.'},
    {question:'Tôi có được chọn ghế hoặc giường không?',answer:'Bạn có thể chọn vị trí còn trống trên sơ đồ của chuyến đã chọn. Loại ghế, tầng và số lượng phụ thuộc từng xe.'},
    {question:'Tôi chọn điểm đón và trả ở đâu?',answer:'Danh sách điểm đón và trả xuất hiện ở bước thông tin hành khách, sau khi bạn chọn chuyến và chỗ ngồi.'}
  ];
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <section id="faq-section" className="editorial-section editorial-faq">
      <div className="editorial-container editorial-faq-layout">
        <div className="editorial-faq-heading">
          <div className="inline-flex items-center gap-2 mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2B4294]" />
            <span className="text-xs font-bold tracking-widest text-[#2B4294] uppercase font-sans">
              GIẢI ĐÁP NHANH
            </span>
          </div>
          <h2 className="font-sans text-3xl sm:text-4xl font-bold text-[#2B4294] tracking-tight">
            Trước khi lên đường
          </h2>
          <p className="mt-3 text-sm sm:text-base text-[#647084]">
            Một vài giải đáp để bạn tự tin bắt đầu hành trình.
          </p>
          <a className="editorial-contact" href="mailto:hello@danava.vn">hello@danava.vn ↗</a>
        </div>

        <div className="space-y-3">
          {FAQ_LIST.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={index}
                className="bg-[#FFFEFA] rounded-2xl border border-[#E5E3DC] overflow-hidden transition-colors"
              >
                <button
                  type="button"
                  onClick={() => toggle(index)}
                  className="w-full py-4 px-6 text-left flex items-center justify-between gap-4 font-semibold text-sm sm:text-base text-[#2B4294] hover:text-[#53A5DB] transition-colors focus-visible:outline-2 focus-visible:outline-[#2B4294]"
                  aria-expanded={isOpen}
                  id={`faq-btn-${index}`}
                  aria-controls={`faq-panel-${index}`}
                >
                  <span>{faq.question}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-[#647084] shrink-0 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 text-[#2B4294]' : ''
                    }`}
                  />
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      id={`faq-panel-${index}`}
                      role="region"
                      aria-labelledby={`faq-btn-${index}`}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: reduced ? 0 : 0.25, ease: 'easeInOut' }}
                    >
                      <div className="px-6 pb-4 pt-1 text-xs sm:text-sm text-[#647084] leading-relaxed border-t border-[#F7F4EC]">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
      <div className="editorial-container editorial-final-cta"><h2>Chuyến đi tiếp theo<br/>bắt đầu từ đâu?</h2><button className="editorial-cta" onClick={()=>document.getElementById('hero-search')?.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'})}>Tìm chuyến của bạn →</button></div>
    </section>
  );
};
