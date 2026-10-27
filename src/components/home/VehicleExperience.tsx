import React,{useState} from 'react';
import {motion,AnimatePresence,useReducedMotion} from 'framer-motion';
import {VEHICLE_MODELS} from '../../data/mockData';
import type {VehicleCategory} from '../../types';
import {ArrowRight,Check,Users} from 'lucide-react';
export const VehicleExperience:React.FC=()=>{
 const [category,setCategory]=useState<VehicleCategory>('cabin');const v=VEHICLE_MODELS[category];const reduced=useReducedMotion();
 const labels: [VehicleCategory,string][]=[['sleeper','Giường nằm'],['limousine','Limousine'],['cabin','Cabin VIP']];
 const descriptions={sleeper:'Ngả lưng thư giãn, để hành trình đưa bạn đến miền đất mới.',limousine:'Không gian ghế ngồi thoải mái cho những chuyến đi linh hoạt.',cabin:'Khoang nghỉ riêng, dành thêm không gian cho chính bạn.'};
 return <section id="experience-section" className="editorial-section editorial-fleet"><div className="editorial-container">
 <div className="editorial-heading"><div><span className="editorial-kicker">CHỌN CÁCH BẠN TẬN HƯỞNG</span><h2>Chuyến đi đẹp,<br/>bắt đầu từ chỗ ngồi.</h2></div><div className="editorial-fleet-tabs" role="group" aria-label="Khám phá dòng xe">{labels.map(([id,label])=><button key={id} aria-pressed={category===id} onClick={()=>setCategory(id)}>{label}</button>)}</div></div>
 <div className="editorial-fleet-stage"><AnimatePresence mode="wait" initial={false}><motion.div className="editorial-fleet-content" key={category} initial={{opacity:0,x:reduced?0:14}} animate={{opacity:1,x:0}} exit={{opacity:0,x:reduced?0:-14}} transition={{duration:reduced?0:.2}}>
 <div className="editorial-coach"><span className="editorial-coach-word" aria-hidden="true">{category==='cabin'?'PRIVATE':category==='limousine'?'COMFORT':'JOURNEY'}</span><img src={v.heroImage||v.image} alt={v.name} loading="lazy"/></div>
 <div className="editorial-fleet-details"><span className="editorial-kicker">{v.categoryLabel}</span><h3>{v.name}</h3><p>{descriptions[category]}</p><div className="editorial-spec"><Users size={16}/>{v.seatsTotal} chỗ <span>·</span>{v.floors} tầng</div><ul>{v.amenities.slice(0,4).map(a=><li key={a}><Check size={15}/>{a}</li>)}</ul><button className="editorial-cta" onClick={()=>document.getElementById('hero-search')?.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'})}>Chọn hành trình <ArrowRight size={16}/></button><small>Tiện ích cụ thể được hiển thị theo từng chuyến.</small></div>
 </motion.div></AnimatePresence></div></div></section>
};
