import React, { useState } from 'react';
import { FAQ_LIST } from '../../data/mockData';
import { ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const FaqSection: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <section className="py-16 sm:py-20 bg-[#F7F4EC]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2B4294]" />
            <span className="text-xs font-bold tracking-widest text-[#2B4294] uppercase font-sans">
              GIẢI ĐÁP NHANH
            </span>
          </div>
          <h2 className="font-sans text-3xl sm:text-4xl font-bold text-[#2B4294] tracking-tight">
            Câu hỏi thường gặp
          </h2>
          <p className="mt-3 text-sm sm:text-base text-[#647084]">
            Những thắc mắc phổ biến nhất khi đặt vé trực tuyến và trải nghiệm dịch vụ xe khách.
          </p>
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
                      transition={{ duration: 0.25, ease: 'easeInOut' }}
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
    </section>
  );
};
