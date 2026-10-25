import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import type { VehicleCategory } from '../../types';
import { HERO_VEHICLE_CONFIGS, type HeroVehicleAssetConfig } from './heroAssetConfig';

interface VehicleMotionStageProps {
  selectedVehicle: VehicleCategory;
  className?: string;
}

export const VehicleMotionStage: React.FC<VehicleMotionStageProps> = ({
  selectedVehicle,
  className = '',
}) => {
  const shouldReduceMotion = useReducedMotion();

  // State Machine cho chuyển động đổi xe
  const [displayedVehicle, setDisplayedVehicle] = useState<VehicleCategory>(selectedVehicle);
  const [exitingVehicle, setExitingVehicle] = useState<VehicleCategory | null>(null);
  const [isEntering, setIsEntering] = useState<boolean>(false);
  const [phase, setPhase] = useState<'idle' | 'transitioning'>('idle');
  const [transitionId, setTransitionId] = useState<number>(0);

  // Ref lưu xe mới nhất được người dùng chọn (chống spam click và race condition)
  const targetVehicleRef = useRef<VehicleCategory>(selectedVehicle);
  const activeVehicleRef = useRef<VehicleCategory>(selectedVehicle);

  // Ref quản lý chuỗi timers để cleanup an toàn khi đổi mục tiêu hoặc unmount
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const transitionSeq = useRef<number>(0);
  const triggerTransitionRef = useRef<(fromVehicle: VehicleCategory, toVehicle: VehicleCategory) => void>(() => {});

  // Preload ảnh của cả 3 dòng xe để không bao giờ bị flash trắng
  useEffect(() => {
    const categories: VehicleCategory[] = ['sleeper', 'limousine', 'cabin'];
    categories.forEach((cat) => {
      const config = HERO_VEHICLE_CONFIGS[cat];
      if (config?.image) {
        const img = new Image();
        img.src = config.image;
      }
    });
  }, []);

  // Hàm xóa toàn bộ timers đang chờ
  const clearAllTimers = useCallback(() => {
    timersRef.current.forEach((t) => clearTimeout(t));
    timersRef.current = [];
  }, []);

  // Cleanup khi unmount
  useEffect(() => {
    return () => {
      clearAllTimers();
    };
  }, [clearAllTimers]);

  // Khởi chạy luồng chuyển động xe nhất quán
  const triggerTransition = useCallback((fromVehicle: VehicleCategory, toVehicle: VehicleCategory) => {
    clearAllTimers();
    transitionSeq.current += 1;
    const currentSeq = transitionSeq.current;
    setTransitionId(currentSeq);

    // BƯỚC 1: Xe hiện tại tăng tốc nhẹ và rời khung về phía phải (exit)
    setExitingVehicle(fromVehicle);
    setPhase('transitioning');
    setIsEntering(false);

    // BƯỚC 2: Khi xe cũ đã vượt qua mép phải (380ms), xe mới xuất hiện từ ngoài khung bên trái
    const enterTimer = setTimeout(() => {
      if (transitionSeq.current !== currentSeq) return;

      const latestTarget = targetVehicleRef.current;
      setDisplayedVehicle(latestTarget);
      activeVehicleRef.current = latestTarget;
      setIsEntering(true);
    }, 380);
    timersRef.current.push(enterTimer);

    // BƯỚC 3: Xe cũ đã hoàn toàn thoát khỏi màn hình (440ms), gỡ bỏ xe cũ khỏi DOM
    const cleanupExitTimer = setTimeout(() => {
      if (transitionSeq.current !== currentSeq) return;
      setExitingVehicle(null);
    }, 440);
    timersRef.current.push(cleanupExitTimer);

    // BƯỚC 4: Xe mới giảm tốc và dừng ổn định ở vị trí trình bày (380ms + 600ms = 980ms)
    const settleTimer = setTimeout(() => {
      if (transitionSeq.current !== currentSeq) return;

      const latestTarget = targetVehicleRef.current;
      // Nếu trong lúc xe mới đang tiến vào, người dùng lại bấm xe khác -> tiếp tục chuyển tiếp
      if (latestTarget !== activeVehicleRef.current && latestTarget !== toVehicle) {
        triggerTransitionRef.current(toVehicle, latestTarget);
      } else {
        setPhase('idle');
        setIsEntering(false);
      }
    }, 980);
    timersRef.current.push(settleTimer);
  }, [clearAllTimers]);

  useEffect(() => {
    triggerTransitionRef.current = triggerTransition;
  }, [triggerTransition]);

  // Theo dõi khi prop selectedVehicle thay đổi từ component cha
  useEffect(() => {
    targetVehicleRef.current = selectedVehicle;

    if (shouldReduceMotion) {
      if (displayedVehicle !== selectedVehicle) {
        clearAllTimers();
        setDisplayedVehicle(selectedVehicle);
        activeVehicleRef.current = selectedVehicle;
        setExitingVehicle(null);
        setIsEntering(false);
        setPhase('idle');
      }
      return;
    }

    // Nếu bấm lại xe đang chọn và hệ thống đang idle -> bỏ qua
    if (selectedVehicle === activeVehicleRef.current && phase === 'idle') {
      return;
    }

    // Nếu đang ở trạng thái idle và xe chọn khác xe đang active, kích hoạt transition ngay lập tức
    if (phase === 'idle' && selectedVehicle !== activeVehicleRef.current) {
      triggerTransition(activeVehicleRef.current, selectedVehicle);
    }
  }, [selectedVehicle, shouldReduceMotion, phase, displayedVehicle, clearAllTimers, triggerTransition]);

  // Render chi tiết hình ảnh thân xe, bóng gầm tán xạ và bóng tiếp xúc sát bánh
  const renderVehicleVisual = (cfg: HeroVehicleAssetConfig) => {
    return (
      <div className="relative w-full h-full">
        {/* 1. BÓNG GẦM XE TÁN XẠ ÊM DỊU TRÊN MẶT ĐƯỜNG (DIFFUSE GROUND AMBIENT SHADOW) */}
        <div
          className="absolute pointer-events-none"
          style={{
            width: cfg.shadow.width,
            height: cfg.shadow.height,
            bottom: cfg.shadow.bottom,
            left: cfg.shadow.left,
            background:
              'radial-gradient(ellipse at center, rgba(12, 22, 36, 0.36) 0%, rgba(12, 22, 36, 0.16) 55%, transparent 75%)',
            filter: `blur(${cfg.shadow.blur})`,
            opacity: cfg.shadow.opacity,
          }}
        />

        {/* 2. BÓNG TIẾP XÚC SÁT BÁNH XE (TIGHT TIRE CONTACT AO SHADOWS) */}
        {/* Bánh sau / Cụm trục bánh sau */}
        <div
          className="absolute pointer-events-none"
          style={{
            width: cfg.contactShadows.rearWidth,
            height: '3.6%',
            bottom: cfg.contactShadows.bottom,
            left: cfg.contactShadows.rearLeft,
            background:
              'radial-gradient(ellipse at center, rgba(8, 14, 22, 0.86) 0%, rgba(8, 14, 22, 0.45) 55%, transparent 80%)',
            filter: 'blur(2px)',
          }}
        />

        {/* Bánh sau thứ 2 (dành riêng cho cấu hình trục tandem của xe Cabin Hoàng Gia) */}
        {cfg.contactShadows.secondRearLeft && (
          <div
            className="absolute pointer-events-none"
            style={{
              width: cfg.contactShadows.secondRearWidth || '9.5%',
              height: '3.6%',
              bottom: cfg.contactShadows.bottom,
              left: cfg.contactShadows.secondRearLeft,
              background:
                'radial-gradient(ellipse at center, rgba(8, 14, 22, 0.86) 0%, rgba(8, 14, 22, 0.45) 55%, transparent 80%)',
              filter: 'blur(2px)',
            }}
          />
        )}

        {/* Bánh trước */}
        <div
          className="absolute pointer-events-none"
          style={{
            width: cfg.contactShadows.frontWidth,
            height: '3.6%',
            bottom: cfg.contactShadows.bottom,
            left: cfg.contactShadows.frontLeft,
            background:
              'radial-gradient(ellipse at center, rgba(8, 14, 22, 0.88) 0%, rgba(8, 14, 22, 0.45) 55%, transparent 80%)',
            filter: 'blur(2px)',
          }}
        />

        {/* 3. ẢNH XE SẮC NÉT TIẾP XÚC VỮNG VÀNG TRÊN MẶT ĐƯỜNG */}
        <div className="relative z-10 w-full h-full flex items-end">
          <img
            src={cfg.image}
            alt={cfg.altText}
            className="w-full h-auto object-contain pointer-events-none select-none block"
            style={{
              filter: 'drop-shadow(0 4px 14px rgba(16, 39, 68, 0.12))',
            }}
            loading="eager"
            decoding="async"
          />
        </div>
      </div>
    );
  };

  const currentConfig = HERO_VEHICLE_CONFIGS[displayedVehicle] || HERO_VEHICLE_CONFIGS.sleeper;
  const currentScale = currentConfig.scaleRelative || 1;

  return (
    <div
      className={`relative select-none pointer-events-none ${className}`}
      aria-hidden="true"
      style={{
        // Tỉ lệ chuẩn 1440:740 theo canvas gốc của các xe giúp khung chứa không bao giờ bị sụt chiều cao
        aspectRatio: '1440 / 740',
      }}
    >
      {/* 1. XE ĐANG RỜI KHUNG VỀ BÊN PHẢI (EXITING VEHICLE) */}
      {exitingVehicle && (
        <motion.div
          key={`exit-${exitingVehicle}-${transitionId}`}
          initial={{
            x: '0%',
            y: '0px',
            scale: HERO_VEHICLE_CONFIGS[exitingVehicle]?.scaleRelative || 1,
          }}
          animate={{
            x: '135%',
            y: '10px',
            scale: (HERO_VEHICLE_CONFIGS[exitingVehicle]?.scaleRelative || 1) * 1.02,
          }}
          transition={{
            duration: 0.44,
            ease: [0.4, 0, 0.7, 0.2], // Tăng tốc nhẹ rồi lướt nhanh ra khỏi khung hình
          }}
          className="absolute inset-0 w-full h-full origin-bottom pointer-events-none"
          style={{ zIndex: 12 }}
        >
          {renderVehicleVisual(HERO_VEHICLE_CONFIGS[exitingVehicle])}
        </motion.div>
      )}

      {/* 2. XE MỚI TIẾN VÀO TỪ BÊN TRÁI (ENTERING VEHICLE) */}
      {isEntering && (
        <motion.div
          key={`enter-${displayedVehicle}-${transitionId}`}
          initial={{
            x: '-125%',
            y: '-10px',
            scale: currentScale * 0.97,
          }}
          animate={{
            x: '0%',
            y: ['-10px', '0px', '1.5px', '0px'],
            scale: currentScale,
          }}
          transition={{
            x: {
              duration: 0.58,
              ease: [0.16, 1, 0.3, 1], // Tiến vào nhanh rồi giảm tốc êm ái về vị trí dừng
            },
            y: {
              duration: 0.58,
              times: [0, 0.84, 0.93, 1], // Nhún nhẹ giảm xóc khi phanh dừng
              ease: 'easeOut',
            },
            scale: {
              duration: 0.58,
              ease: [0.16, 1, 0.3, 1],
            },
          }}
          className="absolute inset-0 w-full h-full origin-bottom pointer-events-none"
          style={{ zIndex: 10 }}
        >
          {renderVehicleVisual(currentConfig)}
        </motion.div>
      )}

      {/* 3. XE TRÌNH BÀY TĨNH ỔN ĐỊNH KHI Ở TRẠNG THÁI IDLE */}
      {!isEntering && phase === 'idle' && (
        <div
          key={`idle-${displayedVehicle}`}
          className="relative w-full h-full origin-bottom pointer-events-none"
          style={{
            transform: currentScale !== 1 ? `scale(${currentScale})` : undefined,
            zIndex: 10,
          }}
        >
          {renderVehicleVisual(currentConfig)}
        </div>
      )}
    </div>
  );
};
