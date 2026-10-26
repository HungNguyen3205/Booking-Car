import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowLeft, BedDouble, Crown, Armchair, CircleDot as SteeringWheel, DoorOpen, Layers, Check, Lock, Ban } from 'lucide-react';
import type { Trip, Seat } from '../../types';
import { SeatButton } from './SeatButton';
import './seat-experience.css';

interface SeatMapProps { trip: Trip; selectedSeatCodes: string[]; maxSelectable: number; onToggleSeat: (seat: Seat) => void; onLimitExceeded?: () => void }
const themes = {
  sleeper: { title: 'Không gian Capsule', subtitle: 'Giường nằm riêng · Hai tầng', Icon: BedDouble, detail: 'Chọn capsule cho hành trình của bạn' },
  limousine: { title: 'Khoang thương gia', subtitle: 'Ghế da đơn · Một tầng', Icon: Armchair, detail: 'Mỗi ghế là một không gian thư giãn' },
  cabin: { title: 'Private Suite', subtitle: 'Cabin riêng · Hai tầng', Icon: Crown, detail: 'Phòng riêng với cửa và giường cá nhân' },
};
export const SeatMap: React.FC<SeatMapProps> = ({ trip, selectedSeatCodes, maxSelectable, onToggleSeat, onLimitExceeded }) => {
  const [floor, setFloor] = useState<1 | 2>(1);
  const [orientation, setOrientation] = useState<'horizontal' | 'vertical'>(() => window.innerWidth < 640 ? 'vertical' : 'horizontal');
  const reduced = useReducedMotion();
  const currentFloor = trip.vehicle.floors === 1 ? 1 : floor;
  const theme = themes[trip.vehicle.category];
  const seats = useMemo(() => trip.seats.filter(s => s.floor === currentFloor), [trip.seats, currentFloor]);
  const rows = useMemo(() => [...new Set(seats.map(s => s.row))].sort((a,b)=>a-b), [seats]);
  const cols = useMemo(() => [...new Set(seats.map(s => s.col))].sort((a,b)=>a-b), [seats]);
  const available = (f: number) => trip.seats.filter(s=>s.floor===f && s.status==='available').length;
  const renderSeat = (row: number, col: number) => {
    const seat = seats.find(s=>s.row===row && s.col===col);
    return seat ? <SeatButton key={seat.id} seat={seat} isSelected={selectedSeatCodes.includes(seat.code)} onToggle={onToggleSeat}
      disabled={selectedSeatCodes.length >= maxSelectable} orientation={orientation} onLimitExceeded={onLimitExceeded}/> :
      <span className={`seat-empty seat-empty-${trip.vehicle.category}`} key={`gap-${row}-${col}`} aria-hidden="true"/>;
  };
  return <div className={`seat-experience theme-${trip.vehicle.category}`} data-seat-map={trip.vehicle.category}>
    <div className="seat-experience-heading"><span className="seat-theme-icon"><theme.Icon size={24}/></span><div><p>DANAVA GO / CHỌN CHỖ</p><h3>{theme.title}</h3><span>{theme.subtitle}</span></div><span className="seat-capacity">{trip.seats.length} {trip.vehicle.category==='cabin'?'phòng':'chỗ'}</span></div>
    <div className="seat-map-toolbar">
      <div className="seat-floor-tabs" role="group" aria-label="Chọn tầng">
        {Array.from({length:trip.vehicle.floors},(_,i)=><button type="button" key={i} aria-pressed={currentFloor===i+1} onClick={()=>setFloor((i+1) as 1|2)}><Layers size={14}/>Tầng {i+1} <small>còn {available(i+1)}</small></button>)}
      </div>
      <div className="seat-view-tabs" role="group" aria-label="Hướng sơ đồ"><button type="button" aria-pressed={orientation==='horizontal'} onClick={()=>setOrientation('horizontal')}>Ngang</button><button type="button" aria-pressed={orientation==='vertical'} onClick={()=>setOrientation('vertical')}>Dọc</button></div>
    </div>
    {available(currentFloor)===0 && <p role="status" className="seat-floor-full">Tầng này đã kín chỗ. Hãy kiểm tra tầng khác hoặc chọn chuyến khác.</p>}
    <p className="seat-map-invitation">{theme.detail}<span><ArrowLeft size={13}/> Đầu xe</span></p>
    <div className="seat-chassis-scroll" tabIndex={0} role="region" aria-label="Sơ đồ chỗ ngồi, có thể cuộn khi xem ngang">
      <AnimatePresence mode="wait" initial={false}><motion.div key={`${trip.id}-${currentFloor}-${orientation}`} className={`seat-chassis chassis-${orientation}`} data-seat-floor={currentFloor}
        initial={{opacity:reduced?1:0,y:reduced?0:4}} animate={{opacity:1,y:0}} exit={{opacity:0}} transition={{duration:reduced?0:.18}}>
        <div className="seat-cockpit" aria-label="Khoang tài xế, không bán vé"><span className="cockpit-windshield"/><div className="cockpit-dashboard"><span/><span/><span/></div><div className="cockpit-driver"><SteeringWheel size={31}/><div className="driver-chair"/><small>TÀI XẾ</small></div><span className="cockpit-door"><DoorOpen size={15}/>Cửa lên xe</span></div>
        <div className="seat-passenger-deck">
          {orientation==='horizontal' ? cols.map((col,i)=><React.Fragment key={col}><div className="seat-lane" data-seat-lane={col}>{rows.map(row=>renderSeat(row,col))}</div>{i<cols.length-1 && <div className="seat-aisle"><span>LỐI ĐI</span><i/><span>{trip.vehicle.category==='cabin'?'PRIVATE SUITES':'DANAVA GO'}</span></div>}</React.Fragment>) : rows.map(row=><div className="seat-cross-row" key={row}>{cols.map((col,i)=><React.Fragment key={col}>{renderSeat(row,col)}{i<cols.length-1 && <span className="seat-vertical-aisle" aria-hidden="true"/>}</React.Fragment>)}</div>)}
        </div>
        <div className="seat-tail-light" aria-hidden="true"/>
      </motion.div></AnimatePresence>
    </div>
    <div className="seat-map-legend"><span><i/>Còn trống</span><span><i className="legend-selected"><Check size={10}/></i>Đang chọn</span><span><i className="legend-booked"><Lock size={9}/></i>Đã đặt</span><span><i className="legend-disabled"><Ban size={9}/></i>Không khả dụng</span></div>
    <p className="seat-selection-note">Đã chọn {selectedSeatCodes.length}/{maxSelectable} chỗ. Bạn có thể bỏ chọn để đổi vị trí. Chỗ chỉ được xác nhận ở bước đặt vé tiếp theo.</p>
    <p className="seat-layout-note">Sơ đồ minh họa theo cấu hình {trip.vehicle.name}; mã và trạng thái từng chỗ lấy từ chuyến đang chọn.</p>
  </div>;
};
