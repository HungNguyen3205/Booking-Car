import React from 'react';
import { Layers } from 'lucide-react';

interface WebGLFallbackProps {
  message?: string;
}

export const WebGLFallback: React.FC<WebGLFallbackProps> = ({
  message = 'Đang tải môi trường không gian 3D...',
}) => {
  return (
    <div
      className="w-full h-full min-h-[320px] rounded-2xl bg-[#FFFDF8] border border-[#E5E3DC]/90 flex flex-col items-center justify-center p-6 text-center select-none"
      role="region"
      aria-label="Khung nền 3D DANAVA GO"
    >
      <div className="w-12 h-12 rounded-2xl bg-[#F7F4EC] border border-[#D8D4C9] flex items-center justify-center text-[#102744] mb-3 shadow-2xs">
        <Layers className="w-6 h-6 text-[#0097A7] animate-pulse" />
      </div>
      <h3 className="font-serif text-sm font-bold text-[#102744] mb-1">
        DANAVA GO • 3D Stage
      </h3>
      <p className="text-xs text-[#718096] max-w-xs leading-relaxed">
        {message}
      </p>
    </div>
  );
};
