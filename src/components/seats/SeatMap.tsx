import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Trip, Seat } from '../../types';
import { SeatButton } from './SeatButton';
import { Compass, Check, Lock, Ban, Layers, ShieldCheck, Info, AlertCircle } from 'lucide-react';

interface SeatMapProps {
  trip: Trip;
  selectedSeatCodes: string[];
  maxSelectable: number;
  onToggleSeat: (seat: Seat) => void;
  onLimitExceeded?: () => void;
}

export const SeatMap: React.FC<SeatMapProps> = ({
  trip,
  selectedSeatCodes,
  maxSelectable,
  onToggleSeat,
  onLimitExceeded,
}) => {
  const [activeFloor, setActiveFloor] = useState<1 | 2>(1);
  const [orientation, setOrientation] = useState<'horizontal' | 'vertical'>(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 640) {
      return 'vertical';
    }
    return 'horizontal';
  });

  // Derive floor cleanly during render: 1-floor vehicles are always floor 1
  const currentFloor = trip.vehicle.floors < 2 ? 1 : activeFloor;

  // Compute available seats per floor from trip.seats
  const floor1Available = useMemo(
    () => trip.seats.filter((s) => s.floor === 1 && s.status === 'available').length,
    [trip.seats]
  );
  const floor2Available = useMemo(
    () => trip.seats.filter((s) => s.floor === 2 && s.status === 'available').length,
    [trip.seats]
  );
  const floorSeatsAvailable = currentFloor === 1 ? floor1Available : floor2Available;

  // Filter seats by active floor
  const floorSeats = useMemo(() => {
    return trip.seats.filter((s) => s.floor === currentFloor);
  }, [trip.seats, currentFloor]);

  // Find all distinct rows sorted ascending
  const rows = useMemo(() => {
    return Array.from(new Set(floorSeats.map((s) => s.row))).sort((a, b) => a - b);
  }, [floorSeats]);

  // Find seat by exact row and col
  const getSeatAt = useMemo(() => {
    return (row: number, col: number): Seat | null => {
      return floorSeats.find((s) => s.row === row && s.col === col) || null;
    };
  }, [floorSeats]);

  const category = trip.vehicle.category;
  const isSleeper = category === 'sleeper';
  const isCabin = category === 'cabin';
  const isLimousine = category === 'limousine';

  return (
    <div className="w-full">
      {/* ----------------------------------------------------
          CABIN CONTROL TOOLBAR: Floor Switcher & View Mode
          ---------------------------------------------------- */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-3 mb-4 border-b border-[#E5E3DC]">
        {/* Floor Switcher with live seat availability count */}
        {trip.vehicle.floors === 2 ? (
          <div className="flex items-center gap-1.5 bg-[#F7F4EC] p-1 rounded-2xl border border-[#E5E3DC] w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setActiveFloor(1)}
              className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                currentFloor === 1
                  ? 'bg-[#102744] text-white shadow-xs'
                  : 'text-[#647084] hover:text-[#102744]'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-[#00E5FF]" />
              <span>Tầng 1 (còn {floor1Available})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveFloor(2)}
              className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                currentFloor === 2
                  ? 'bg-[#102744] text-white shadow-xs'
                  : 'text-[#647084] hover:text-[#102744]'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-[#00E5FF]" />
              <span>Tầng 2 (còn {floor2Available})</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs font-bold text-[#102744] bg-[#F7F4EC] px-3.5 py-1.5 rounded-xl border border-[#E5E3DC]">
            <span className="w-2 h-2 rounded-full bg-[#0097A7]" />
            <span>
              Khoang 1 tầng tiêu chuẩn VIP ({trip.vehicle.seatsTotal} chỗ • còn {floor1Available} chỗ)
            </span>
          </div>
        )}

        {/* View Orientation Toggle */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-[#647084] font-medium hidden sm:inline flex items-center gap-1">
            <Compass className="w-3.5 h-3.5 text-[#0097A7]" />
            Hướng nhìn:
          </span>
          <div className="flex items-center bg-[#F7F4EC] p-0.5 rounded-xl border border-[#E5E3DC] text-xs">
            <button
              type="button"
              onClick={() => setOrientation('horizontal')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                orientation === 'horizontal'
                  ? 'bg-[#0097A7] text-white shadow-2xs'
                  : 'text-[#647084] hover:text-[#102744]'
              }`}
              title="Góc nhìn thân xe nằm ngang"
            >
              Ngang
            </button>
            <button
              type="button"
              onClick={() => setOrientation('vertical')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                orientation === 'vertical'
                  ? 'bg-[#0097A7] text-white shadow-2xs'
                  : 'text-[#647084] hover:text-[#102744]'
              }`}
              title="Góc nhìn thân xe dọc (Tối ưu điện thoại)"
            >
              Dọc
            </button>
          </div>
        </div>
      </div>

      {/* Sold-out floor / trip indicator */}
      {floorSeatsAvailable === 0 && (
        <div className="mb-3.5 p-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-2.5 text-xs text-amber-900">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            {trip.vehicle.floors === 2
              ? `Tầng ${currentFloor} hiện đã kín chỗ. Bạn có thể bấm chuyển sang tầng khác để tìm ghế trống.`
              : 'Toàn bộ ghế trên chuyến này đã được đặt kín.'}
          </span>
        </div>
      )}

      {/* ----------------------------------------------------
          INTERACTIVE TOP-DOWN COACH CHASSIS
          Rendered through smooth crossfade when changing floors
          ---------------------------------------------------- */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`${currentFloor}-${orientation}`}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          className="w-full overflow-x-auto pb-2"
        >
          {orientation === 'horizontal' ? (
            /* ==========================================================
               HORIZONTAL CHASSIS:
               ĐẦU XE BÊN TRÁI -> KHOANG HÀNH KHÁCH -> ĐUÔI XE BÊN PHẢI
               ========================================================== */
            <div className="min-w-[680px] max-w-full bg-[#FAF8F5] rounded-[36px] border-2 border-[#D8D4C8] p-3.5 sm:p-4.5 shadow-sm relative overflow-hidden">
              {/* Outer coach roof rail accents */}
              <div className="absolute top-0 left-8 right-8 h-1 bg-gradient-to-r from-[#0097A7]/50 via-[#CBD5E1] to-slate-400 rounded-full" />
              <div className="absolute bottom-0 left-8 right-8 h-1 bg-gradient-to-r from-[#0097A7]/50 via-[#CBD5E1] to-slate-400 rounded-full" />

              <div className="flex items-stretch gap-3">
                {/* ----------------------------------------------------
                    1. FRONT CABIN (ĐẦU XE BÊN TRÁI)
                    ---------------------------------------------------- */}
                <div className="w-28 sm:w-32 shrink-0 rounded-2xl bg-gradient-to-r from-[#E2E8F0] via-[#EDF2F7] to-[#F8FAFC] border border-[#CBD5E1] p-3 flex flex-col justify-between relative shadow-inner">
                  {/* Curved Windshield Front Glass Accent */}
                  <div className="absolute top-2 bottom-2 -left-1.5 w-3 rounded-l-full bg-gradient-to-b from-[#0097A7]/30 via-[#38BDF8]/20 to-[#0097A7]/30 border-l-2 border-[#0097A7]/40 shadow-sm" />

                  {/* Top: Side Mirror 1 */}
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-bold text-[#647084] uppercase tracking-wider">
                      Đầu xe
                    </span>
                    <span className="w-3 h-1.5 bg-[#102744] rounded-full" title="Gương chiếu hậu trái" />
                  </div>

                  {/* Windshield wiper and glass reflection */}
                  <div className="text-center py-1">
                    <span className="text-[10px] font-bold text-[#102744] block">
                      Kính trước
                    </span>
                    <div className="w-10 h-1 bg-[#0097A7]/30 rounded-full mx-auto mt-0.5" />
                  </div>

                  {/* Driver Cockpit */}
                  <div className="bg-[#102744] rounded-xl p-2 text-white flex items-center gap-2 shadow-xs border border-slate-700">
                    <div className="w-7 h-7 rounded-full bg-[#1E293B] border border-cyan-400/40 flex items-center justify-center text-cyan-300">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                        <circle cx="12" cy="12" r="9" />
                        <path d="M12 3v18M3 12h18M6.5 6.5l11 11M6.5 17.5l11-11" />
                      </svg>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold block leading-tight">Tài xế</span>
                      <span className="text-[8.5px] text-cyan-300">Cabin lái</span>
                    </div>
                  </div>

                  {/* Entrance Door & Passenger Steps */}
                  <div className="bg-amber-100/80 rounded-xl p-1.5 border border-amber-300 text-center">
                    <span className="text-[10px] font-bold text-amber-900 block leading-tight">
                      Cửa lên xe
                    </span>
                    <span className="text-[8px] text-amber-700 block">
                      Bậc bước an toàn
                    </span>
                  </div>

                  {/* Bottom: Side Mirror 2 */}
                  <div className="flex justify-end">
                    <span className="w-3 h-1.5 bg-[#102744] rounded-full" title="Gương chiếu hậu phải" />
                  </div>
                </div>

                {/* ----------------------------------------------------
                    2. PASSENGER INTERIOR CABIN (KHOANG NỘI THẤT HÀNH KHÁCH)
                    ---------------------------------------------------- */}
                <div className="flex-1 bg-white rounded-2xl border border-[#E5E3DC] p-3 shadow-inner flex flex-col justify-between">
                  {/* Row of Seats 1 (Dãy A / Cửa sổ bên trên) */}
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-16 sm:w-18 shrink-0 text-right pr-1">
                      <span className="text-[11px] font-bold text-[#102744] block">
                        {isCabin ? 'Cabin A' : 'Dãy A'}
                      </span>
                      <span className="text-[9px] text-[#647084]">Cửa sổ</span>
                    </div>
                    <div className="flex gap-2 sm:gap-3">
                      {rows.map((rowNum) => {
                        const seat = getSeatAt(rowNum, 1);
                        return seat ? (
                          <SeatButton
                            key={seat.id}
                            seat={seat}
                            isSelected={selectedSeatCodes.includes(seat.code)}
                            onToggle={onToggleSeat}
                            disabled={selectedSeatCodes.length >= maxSelectable}
                            orientation="horizontal"
                            onLimitExceeded={onLimitExceeded}
                          />
                        ) : (
                          <div
                            key={`empty-${rowNum}-1`}
                            className={
                              isCabin
                                ? 'w-[74px] sm:w-[86px] h-[52px] sm:h-[58px]'
                                : isSleeper
                                ? 'w-[64px] sm:w-[76px] h-[46px] sm:h-[50px]'
                                : 'w-[54px] sm:w-[62px] h-[48px] sm:h-[52px]'
                            }
                          />
                        );
                      })}
                    </div>
                  </div>

                  {/* Walkway 1 (Lối đi nội thất) */}
                  <div className="my-1.5 py-1 px-3 bg-[#F7F4EC] rounded-lg border border-dashed border-[#E5E3DC] flex items-center justify-between text-[9px] text-[#647084] tracking-wider uppercase font-semibold">
                    <span>← Lối đi nội thất</span>
                    <span className="hidden sm:inline">
                      {isCabin
                        ? 'Hành lang Cabin cách âm chuẩn Hoàng Gia'
                        : isLimousine
                        ? 'Lối đi VIP rộng rãi bọc da cao cấp'
                        : 'Thảm tiêu âm đa tầng'}
                    </span>
                    <span>Lối đi nội thất →</span>
                  </div>

                  {/* Row of Seats 2 (Dãy B / Giữa hoặc Cửa sổ) */}
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-16 sm:w-18 shrink-0 text-right pr-1">
                      <span className="text-[11px] font-bold text-[#102744] block">
                        {isCabin ? 'Cabin B' : 'Dãy B'}
                      </span>
                      <span className="text-[9px] text-[#647084]">
                        {isSleeper ? 'Dãy giữa' : 'Cửa sổ'}
                      </span>
                    </div>
                    <div className="flex gap-2 sm:gap-3">
                      {rows.map((rowNum) => {
                        const seat = getSeatAt(rowNum, 2);
                        return seat ? (
                          <SeatButton
                            key={seat.id}
                            seat={seat}
                            isSelected={selectedSeatCodes.includes(seat.code)}
                            onToggle={onToggleSeat}
                            disabled={selectedSeatCodes.length >= maxSelectable}
                            orientation="horizontal"
                            onLimitExceeded={onLimitExceeded}
                          />
                        ) : (
                          <div
                            key={`empty-${rowNum}-2`}
                            className={
                              isCabin
                                ? 'w-[74px] sm:w-[86px] h-[52px] sm:h-[58px]'
                                : isSleeper
                                ? 'w-[64px] sm:w-[76px] h-[46px] sm:h-[50px]'
                                : 'w-[54px] sm:w-[62px] h-[48px] sm:h-[52px]'
                            }
                          />
                        );
                      })}
                    </div>
                  </div>

                  {/* Row of Seats 3 (Only for 3-column Sleeper: Dãy C) */}
                  {isSleeper && (
                    <>
                      <div className="my-1.5 py-1 px-3 bg-[#F7F4EC] rounded-lg border border-dashed border-[#E5E3DC] flex items-center justify-between text-[9px] text-[#647084] tracking-wider uppercase font-semibold">
                        <span>← Lối đi 2</span>
                        <span className="hidden sm:inline">Thảm tiêu âm</span>
                        <span>Lối đi 2 →</span>
                      </div>

                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="w-16 sm:w-18 shrink-0 text-right pr-1">
                          <span className="text-[11px] font-bold text-[#102744] block">Dãy C</span>
                          <span className="text-[9px] text-[#647084]">Cửa sổ</span>
                        </div>
                        <div className="flex gap-2 sm:gap-3">
                          {rows.map((rowNum) => {
                            const seat = getSeatAt(rowNum, 3);
                            return seat ? (
                              <SeatButton
                                key={seat.id}
                                seat={seat}
                                isSelected={selectedSeatCodes.includes(seat.code)}
                                onToggle={onToggleSeat}
                                disabled={selectedSeatCodes.length >= maxSelectable}
                                orientation="horizontal"
                                onLimitExceeded={onLimitExceeded}
                              />
                            ) : (
                              <div
                                key={`empty-${rowNum}-3`}
                                className="w-[64px] sm:w-[76px] h-[46px] sm:h-[50px]"
                              />
                            );
                          })}
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* ----------------------------------------------------
                    3. REAR COACH SECTION (ĐUÔI XE BÊN PHẢI)
                    ---------------------------------------------------- */}
                <div className="w-20 sm:w-24 shrink-0 rounded-2xl bg-gradient-to-l from-[#E2E8F0] via-[#EDF2F7] to-[#F8FAFC] border border-[#CBD5E1] p-2.5 flex flex-col justify-between text-center shadow-inner">
                  {/* Top LED Taillight */}
                  <div className="w-full h-2 bg-gradient-to-r from-rose-500 to-rose-600 rounded-full shadow-xs" title="Đèn hậu LED" />

                  {/* Rear AC Ventilation & Safety Exit */}
                  <div className="my-auto space-y-1.5">
                    <span className="text-[10px] font-bold text-[#102744] block">
                      Đuôi xe
                    </span>
                    <div className="p-1 bg-white/80 rounded-lg border border-slate-200">
                      <span className="text-[8.5px] font-semibold text-rose-700 block">
                        Cửa thoát hiểm
                      </span>
                    </div>
                    <span className="text-[8px] text-[#647084] block">
                      Dàn lạnh trung tâm
                    </span>
                  </div>

                  {/* Bottom LED Taillight */}
                  <div className="w-full h-2 bg-gradient-to-r from-rose-500 to-rose-600 rounded-full shadow-xs" title="Đèn hậu LED" />
                </div>
              </div>
            </div>
          ) : (
            /* ==========================================================
               VERTICAL CHASSIS (MOBILE TỐI ƯU):
               ĐẦU XE Ở TRÊN -> HÀNG GHẾ XUỐNG DƯỚI -> ĐUÔI XE Ở DƯỚI
               ========================================================== */
            <div className="max-w-[460px] mx-auto bg-[#FAF8F5] rounded-[36px] border-2 border-[#D8D4C8] p-4 shadow-sm relative overflow-hidden">
              {/* Front Coach Cap & Driver */}
              <div className="rounded-2xl bg-gradient-to-b from-[#E2E8F0] to-[#F8FAFC] border border-[#CBD5E1] p-3 mb-4 flex items-center justify-between shadow-inner">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-[#102744] border-2 border-cyan-400/50 flex items-center justify-center text-cyan-300 shadow-xs">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                      <circle cx="12" cy="12" r="9" />
                      <path d="M12 3v18M3 12h18M6.5 6.5l11 11M6.5 17.5l11-11" />
                    </svg>
                  </div>
                  <div>
                    <span className="text-xs font-bold text-[#102744] block">Tài xế</span>
                    <span className="text-[9.5px] text-[#0097A7] font-semibold">Đầu xe</span>
                  </div>
                </div>

                <div className="bg-amber-100 px-3 py-1 rounded-xl border border-amber-300 text-right">
                  <span className="text-xs font-bold text-amber-900 block">Cửa lên xe</span>
                  <span className="text-[9px] text-amber-700 block">Bậc an toàn</span>
                </div>
              </div>

              {/* Rows of seats */}
              <div className="bg-white rounded-2xl border border-[#E5E3DC] p-3.5 space-y-3">
                {rows.map((rowNum) => {
                  const seat1 = getSeatAt(rowNum, 1);
                  const seat2 = getSeatAt(rowNum, 2);
                  const seat3 = isSleeper ? getSeatAt(rowNum, 3) : null;

                  return (
                    <div key={rowNum} className="flex items-center justify-between gap-2">
                      {/* Column 1 */}
                      <div className="shrink-0">
                        {seat1 ? (
                          <SeatButton
                            seat={seat1}
                            isSelected={selectedSeatCodes.includes(seat1.code)}
                            onToggle={onToggleSeat}
                            disabled={selectedSeatCodes.length >= maxSelectable}
                            orientation="vertical"
                            onLimitExceeded={onLimitExceeded}
                          />
                        ) : (
                          <div className="w-[52px] h-[68px]" />
                        )}
                      </div>

                      {/* Walkway 1 */}
                      <div className="flex-1 flex items-center justify-center px-1">
                        <span className="text-[9px] text-slate-400 uppercase tracking-widest font-semibold">
                          Lối đi
                        </span>
                      </div>

                      {/* Column 2 */}
                      <div className="shrink-0">
                        {seat2 ? (
                          <SeatButton
                            seat={seat2}
                            isSelected={selectedSeatCodes.includes(seat2.code)}
                            onToggle={onToggleSeat}
                            disabled={selectedSeatCodes.length >= maxSelectable}
                            orientation="vertical"
                            onLimitExceeded={onLimitExceeded}
                          />
                        ) : (
                          <div className="w-[52px] h-[68px]" />
                        )}
                      </div>

                      {/* Column 3 (Only Sleeper) */}
                      {isSleeper && (
                        <>
                          <div className="flex-1 flex items-center justify-center px-1">
                            <span className="text-[9px] text-slate-400 uppercase tracking-widest font-semibold">
                              Lối đi 2
                            </span>
                          </div>
                          <div className="shrink-0">
                            {seat3 ? (
                              <SeatButton
                                seat={seat3}
                                isSelected={selectedSeatCodes.includes(seat3.code)}
                                onToggle={onToggleSeat}
                                disabled={selectedSeatCodes.length >= maxSelectable}
                                orientation="vertical"
                                onLimitExceeded={onLimitExceeded}
                              />
                            ) : (
                              <div className="w-[52px] h-[68px]" />
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Rear Section */}
              <div className="mt-4 rounded-2xl bg-gradient-to-t from-[#E2E8F0] to-[#F8FAFC] border border-[#CBD5E1] p-2.5 text-center text-xs text-[#647084]">
                <span className="font-semibold text-[#102744]">Khu vực đuôi xe</span>
                <span className="text-[10px] block text-cyan-700">Điều hòa khử khuẩn đa điểm</span>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* ----------------------------------------------------
          LEGEND: Trạng thái ghế rõ ràng, chuẩn accessibility
          ---------------------------------------------------- */}
      {/* ----------------------------------------------------
          LEGEND: Trạng thái ghế rõ ràng, chuẩn accessibility (không chỉ dựa vào màu)
          ---------------------------------------------------- */}
      <div className="mt-5 pt-3.5 border-t border-[#E5E3DC] grid grid-cols-2 sm:flex sm:flex-wrap items-center justify-center gap-3 sm:gap-6 text-xs text-[#102744]">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-lg bg-[#FFFEFA] border-2 border-[#CBD5E1] shadow-2xs shrink-0" />
          <div>
            <span className="font-semibold block leading-tight text-[#102744]">Còn trống</span>
            <span className="text-[10px] text-[#647084]">Sẵn sàng chọn</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-lg bg-[#0097A7] border-2 border-[#004D40] text-white flex items-center justify-center shadow-xs ring-1 ring-[#00695C] shrink-0">
            <Check className="w-3.5 h-3.5 stroke-[3]" />
          </div>
          <div>
            <span className="font-bold text-[#0097A7] block leading-tight">Đang chọn</span>
            <span className="text-[10px] text-[#007887]">Tạm thời trên FE</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-lg bg-[#1E293B] text-slate-300 flex items-center justify-center shadow-xs border border-slate-700 shrink-0">
            <Lock className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="font-semibold text-[#102744] block leading-tight">Đã đặt</span>
            <span className="text-[10px] text-[#647084]">Hệ thống đã khóa</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-lg bg-slate-100 border-2 border-dashed border-slate-300 text-slate-400 flex items-center justify-center shrink-0">
            <Ban className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="font-semibold text-slate-500 block leading-tight">Không khả dụng</span>
            <span className="text-[10px] text-slate-400">Bảo trì/Khóa chỗ</span>
          </div>
        </div>
      </div>

      {/* ----------------------------------------------------
          DISCLAIMER: Tách rõ trạng thái chọn trên FE với giữ chỗ thực
          ---------------------------------------------------- */}
      <div className="mt-4 p-3.5 bg-[#F0F9FF] border border-[#BAE6FD] rounded-2xl flex items-start gap-2.5 text-xs text-[#0C4A6E]">
        <Info className="w-4 h-4 text-[#0284C7] shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <span className="font-bold block text-[#0369A1]">
            Lưu ý trạng thái chọn chỗ (Chưa giữ chỗ trên hệ thống):
          </span>
          <span className="text-[#334155] text-[11.5px] mt-0.5 block">
            Các vị trí bạn vừa chọn chỉ đang được đánh dấu tạm thời trên thiết bị này. Hệ thống backend <strong>chưa giữ chỗ chính thức</strong> cho đến khi bạn xác nhận thông tin hành khách ở bước tiếp theo.
          </span>
        </div>
      </div>

      {/* Simulation layout disclaimer */}
      <div className="mt-3 text-center">
        <p className="text-[11px] text-[#647084] italic flex items-center justify-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-[#0097A7] inline" />
          * Sơ đồ mô phỏng theo cấu hình không gian tiêu chuẩn của dòng xe {trip.vehicle.name} ({trip.seats.length} chỗ)
        </p>
      </div>
    </div>
  );
};
