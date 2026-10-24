import React, { useRef } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { DA_NANG_DESTINATION } from './destinationConfig';

/**
 * Three.js Inner Hook/Component: Chiếu tọa độ 3D của landmark thành tọa độ 2D phần trăm (%)
 * Cập nhật trực tiếp vào style của DOM overlay thông qua ref (zero React re-renders)
 */
export const LandmarkAnchorTracker: React.FC<{
  target3D: [number, number, number];
  overlayRef: React.RefObject<HTMLDivElement | null>;
}> = ({ target3D, overlayRef }) => {
  const { camera } = useThree();
  const tempVec = useRef(new THREE.Vector3());

  useFrame(() => {
    if (!overlayRef.current) return;

    // Chiếu vector 3D từ World Space sang Normalized Device Coordinates (NDC) [-1, 1]
    tempVec.current.set(target3D[0], target3D[1], target3D[2]);
    tempVec.current.project(camera);

    // Kiểm tra điểm có nằm phía trước camera (z < 1)
    const isVisible = tempVec.current.z < 1.0;
    if (!isVisible) {
      overlayRef.current.style.opacity = '0';
      return;
    }

    // Chuyển đổi NDC sang phần trăm chiều rộng và chiều cao container
    const xPct = ((tempVec.current.x + 1) / 2) * 100;
    const yPct = ((-tempVec.current.y + 1) / 2) * 100;

    overlayRef.current.style.left = `${xPct}%`;
    overlayRef.current.style.top = `${yPct}%`;
    overlayRef.current.style.opacity = '1';
  });

  return null;
};

interface DestinationLabelOverlayProps {
  overlayRef: React.RefObject<HTMLDivElement | null>;
}

/**
 * Component nhãn HTML/SVG địa danh Đà Nẵng
 * Tuyệt đối không bake vào mô hình 3D: Nhãn là HTML & SVG sắc nét, có neo bám vào Cầu Rồng.
 */
export const DestinationLabelOverlay: React.FC<DestinationLabelOverlayProps> = ({
  overlayRef,
}) => {
  const { displayName, tagline, labelAnchor } = DA_NANG_DESTINATION;

  return (
    <div
      ref={overlayRef}
      className="absolute pointer-events-none select-none transition-opacity duration-300 z-20 -translate-x-1/2 -translate-y-full"
      style={{
        left: '26%',
        top: '42%',
        opacity: 0,
      }}
      data-testid="danang-destination-label"
      aria-label={`${displayName} — ${tagline}`}
    >
      <div className="flex flex-col items-center">
        {/* Card huy hiệu HTML sang trọng */}
        <div className="relative group bg-[#FFFDF8]/95 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-[#E5E3DC] shadow-[0_8px_24px_-4px_rgba(16,39,68,0.14)] flex items-center gap-2 mb-1.5">
          {/* SVG Map Pin Icon */}
          <div className="w-5 h-5 rounded-full bg-[#E0F7FA] text-[#0097A7] flex items-center justify-center shrink-0">
            <svg
              className="w-3 h-3 text-[#0097A7]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
          </div>

          {/* Nội dung chữ: Tiêu đề Noto Serif + Phụ đề Be Vietnam Pro */}
          <div className="flex flex-col text-left leading-tight">
            <div className="flex items-center gap-1.5">
              <span className="font-serif font-bold text-sm tracking-wide text-[#102744]">
                {displayName}
              </span>
              <span className="text-[9px] font-bold uppercase tracking-wider text-[#0097A7] bg-[#E0F7FA] px-1.5 py-0.5 rounded-full">
                Khởi hành
              </span>
            </div>
            <span className="text-[10px] font-medium text-[#718096] tracking-tight">
              {labelAnchor.badgeSubtitle}
            </span>
          </div>
        </div>

        {/* Cột chỉ neo SVG: Đường dóng và chấm phát sáng hướng chính xác vào Cầu Rồng */}
        <div className="relative flex flex-col items-center">
          {/* Đường dóng thẳng đứng thanh mảnh */}
          <div className="w-[1.5px] h-3 bg-gradient-to-b from-[#0097A7] to-[#0097A7]/40" />

          {/* Vòng tròn nhịp thở neo vào đỉnh vòm Cầu Rồng */}
          <div className="relative flex items-center justify-center">
            <span className="absolute w-3.5 h-3.5 rounded-full bg-[#00E5FF]/30 animate-ping" />
            <span className="w-2 h-2 rounded-full bg-[#0097A7] border border-white shadow-sm" />
          </div>
        </div>
      </div>
    </div>
  );
};
