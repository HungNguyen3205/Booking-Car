import React, { useId } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Check, Lock, Ban } from 'lucide-react';
import type { Seat } from '../../types';
import './seat-experience.css';

interface SeatButtonProps {
  seat: Seat; isSelected: boolean; onToggle: (seat: Seat) => void;
  disabled?: boolean; orientation?: 'horizontal' | 'vertical'; onLimitExceeded?: () => void;
}

export const SeatButton: React.FC<SeatButtonProps> = ({ seat, isSelected, onToggle, disabled = false, orientation = 'horizontal', onLimitExceeded }) => {
  const id = useId().replace(/:/g, '');
  const reduced = useReducedMotion();
  const locked = seat.status === 'booked' || seat.status === 'disabled';
  const limited = disabled && !isSelected;
  const status = seat.status === 'booked' ? 'Đã đặt' : seat.status === 'disabled' ? 'Không khả dụng' : isSelected ? 'Đang chọn' : limited ? 'Còn trống (Đã đủ số khách)' : 'Còn trống';
  const price = new Intl.NumberFormat('vi-VN').format(seat.price);
  const vertical = orientation === 'vertical' && seat.type !== 'seat';
  const leather = `${id}-leather`, cushion = `${id}-cushion`;
  return <motion.button type="button" role="checkbox" aria-checked={isSelected} disabled={locked}
    aria-label={`Ghế ${seat.code}, loại ${seat.type}, ${status}, giá ${price} đồng`}
    title={`${seat.code} · ${status} · ${price} ₫`}
    data-seat-code={seat.code} data-seat-kind={seat.type} data-seat-state={isSelected ? 'selected' : seat.status}
    className={`seat-object seat-object-${seat.type} seat-${orientation} ${isSelected ? 'is-selected' : ''} ${locked ? 'is-locked' : ''} ${limited ? 'is-limited' : ''}`}
    whileHover={!locked && !reduced ? { y: -2 } : undefined} whileTap={!locked && !reduced ? { scale: .97 } : undefined}
    onClick={() => { if (locked) return; if (limited) { onLimitExceeded?.(); return; } onToggle(seat); }}>
    <svg viewBox={seat.type === 'seat' ? '0 0 100 100' : vertical ? '0 0 84 144' : '0 0 144 84'} aria-hidden="true" className="seat-illustration">
      <defs>
        <linearGradient id={leather} x1="0" y1="0" x2="1" y2="1"><stop stopColor="var(--seat-light)"/><stop offset=".48" stopColor="var(--seat-body)"/><stop offset="1" stopColor="var(--seat-dark)"/></linearGradient>
        <linearGradient id={cushion} x1="0" y1="0" x2="0" y2="1"><stop stopColor="var(--seat-pillow)"/><stop offset="1" stopColor="var(--seat-body)"/></linearGradient>
      </defs>
      {seat.type === 'seat' ? <g>
        <rect x="18" y="9" width="64" height="82" rx="19" fill="#081525" opacity=".4"/>
        <rect x="22" y="13" width="56" height="72" rx="17" fill={`url(#${leather})`} stroke="#c7aa76" strokeWidth="1.5"/>
        <rect x="30" y="9" width="40" height="22" rx="8" fill={`url(#${cushion})`} stroke="#a5b7c8" strokeOpacity=".5"/>
        <path d="M32 37q18 -6 36 0v34q-18 10-36 0z" fill={`url(#${cushion})`} stroke="#f0e5cb" strokeOpacity=".22"/>
        <path d="M36 43l28 23m0-23L36 66M50 39v34" stroke="#f4e9d1" strokeOpacity=".16" fill="none"/>
        <rect x="12" y="35" width="14" height="44" rx="6" fill={`url(#${leather})`} stroke="#bfa77e"/>
        <rect x="74" y="35" width="14" height="44" rx="6" fill={`url(#${leather})`} stroke="#bfa77e"/>
        <circle cx="19" cy="66" r="3" fill="#cfba91"/><circle cx="81" cy="66" r="3" fill="#cfba91"/>
        <path d="M31 83h38" stroke="#d8c49c" strokeWidth="3" strokeLinecap="round"/>
      </g> : <g transform={vertical ? 'translate(84 0) rotate(90)' : undefined}>
        {seat.type === 'cabin' ? <>
          <rect x="2" y="3" width="140" height="78" rx="9" fill="#182330" stroke="#d4b177" strokeWidth="2"/>
          <rect x="8" y="9" width="128" height="64" rx="5" fill="#645546"/>
          <path d="M12 13h120M12 69h120" stroke="#efc985" strokeWidth="2"/>
          <rect x="15" y="17" width="91" height="46" rx="9" fill={`url(#${leather})`} stroke="#bba98c"/>
          <rect x="21" y="22" width="21" height="34" rx="6" fill="#e7dcc8"/>
          <path d="M48 20v40m8-40v40" stroke="#c8bca6" strokeOpacity=".45"/>
          <rect x="113" y="19" width="15" height="24" rx="3" fill="#132b40" stroke="#c6a36c"/>
          <circle cx="121" cy="52" r="5" fill="#e6c28b"/>
          <path d="M87 78h43" stroke="#f6e4bf" strokeWidth="4"/>
          <path d="M87 77v-17q19 0 19 17" stroke="#d9ba80" fill="none" strokeDasharray="3 2"/>
        </> : <>
          <rect x="3" y="9" width="138" height="66" rx="29" fill="#0b192b" stroke="#bbab8b" strokeWidth="2"/>
          <rect x="10" y="15" width="124" height="54" rx="23" fill={`url(#${leather})`} stroke="#cdd7dd" strokeOpacity=".55"/>
          <rect x="16" y="21" width="29" height="42" rx="11" fill="#e6dfce"/>
          <path d="M51 20v44m5-44v44" stroke="#a5c0cd" strokeWidth="2" strokeOpacity=".6"/>
          <path d="M63 25h55M63 58h55" stroke="#b7d3de" strokeOpacity=".25"/>
          <path d="M29 12h82" stroke="#b0edee" strokeWidth="2" strokeLinecap="round"/>
          <rect x="119" y="29" width="7" height="26" rx="3" fill="#10202d"/>
        </>}
      </g>}
    </svg>
    <span className="seat-code-badge">{seat.code}</span>
    {isSelected ? <Check className="seat-state-icon" size={13}/> : locked ? (seat.status === 'booked' ? <Lock className="seat-state-icon" size={12}/> : <Ban className="seat-state-icon" size={12}/>) : null}
  </motion.button>;
};
