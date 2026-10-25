import { Bus, ShieldCheck, Ticket } from 'lucide-react';

interface WebGLFallbackProps {
  message?: string;
  fromCity?: string;
  toCity?: string;
}

export const WebGLFallback: React.FC<WebGLFallbackProps> = ({
  message = 'Đang chuyển sang chế độ hiển thị 2D tối ưu hóa...',
  fromCity = 'Đà Nẵng',
  toCity = 'Huế',
}) => {
  return (
    <div
      className="w-full h-full min-h-[260px] rounded-2xl bg-gradient-to-br from-[#FFFDF8] via-[#FAF6ED] to-[#F2EDE2] border border-[#E5E3DC] flex flex-col justify-between p-5 sm:p-7 select-none relative overflow-hidden shadow-inner"
      role="region"
      aria-label="Khung nền đồ họa DANAVA GO Poster Fallback"
    >
      {/* Decorative background watermark */}
      <div
        className="absolute -right-8 -bottom-8 w-44 h-44 rounded-full bg-[#0097A7]/5 pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute -left-6 -top-6 w-36 h-36 rounded-full bg-[#F3B54A]/5 pointer-events-none"
        aria-hidden="true"
      />

      {/* Top Header Badge */}
      <div className="flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#0097A7]" />
          <span className="font-serif text-xs sm:text-sm font-bold text-[#102744] tracking-wider">
            DANAVA GO • VÉ ĐIỆN TỬ
          </span>
        </div>
        <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full border border-amber-300">
          Chế độ 2D Poster
        </span>
      </div>

      {/* Center Poster Ticket Representation */}
      <div className="my-auto py-3 z-10 flex flex-col items-center text-center">
        <div className="w-12 h-12 rounded-2xl bg-[#E0F7FA] text-[#0097A7] border border-[#0097A7]/20 flex items-center justify-center mb-3 shadow-2xs">
          <Ticket className="w-6 h-6" />
        </div>

        <div className="flex items-center gap-2 sm:gap-3 font-serif font-bold text-xl sm:text-2xl text-[#102744] mb-1">
          <span>{fromCity}</span>
          <span className="text-[#0097A7]">→</span>
          <span>{toCity}</span>
        </div>

        <p className="text-xs text-[#647084] max-w-sm leading-relaxed">
          {message}
        </p>
      </div>

      {/* Bottom Status & Reassurance Note */}
      <div className="pt-3 border-t border-[#E5E3DC]/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-[#647084] z-10">
        <div className="flex items-center gap-1.5 text-emerald-800">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Hệ thống đặt vé, tìm chuyến và chọn ghế hoạt động 100% ổn định.</span>
        </div>
        <div className="flex items-center gap-1 text-[10.5px]">
          <Bus className="w-3.5 h-3.5 text-[#0097A7]" />
          <span>Tiết kiệm tài nguyên thiết bị</span>
        </div>
      </div>
    </div>
  );
};
