import React, { useState } from 'react';
import { ArrowRight, Compass } from 'lucide-react';
import { getJourneyLandmark } from '../danava-go/journeyStageConfig';
import './home-editorial.css';
interface FeaturedRoutesProps { onSelectRoute:(from:string,to:string)=>void; onPreviewRoute?:(from:string,to:string)=>void }
export const FeaturedRoutes:React.FC<FeaturedRoutesProps>=({onSelectRoute,onPreviewRoute})=>{
 const [more,setMore]=useState(false);
 const routes=[['Đà Nẵng','Huế','Di sản','Qua miền di sản'],['Đà Nẵng','Nha Trang','Biển xanh','Hẹn một ngày bên biển'],['Đà Nẵng','TP. Hồ Chí Minh','Thành phố','Theo nhịp sống phương Nam'],['TP. Hồ Chí Minh','Đà Lạt','Cao nguyên','Đổi gió giữa ngàn thông']];
 return <section id="routes-section" className="editorial-section"><div className="editorial-container">
 <div className="editorial-heading"><div><span className="editorial-kicker"><Compass size={14}/>NHỮNG MIỀN ĐẤT ĐANG CHỜ</span><h2>Mỗi cung đường,<br/>một câu chuyện mới.</h2></div><p>Một chuyến xe, nhiều điều để khám phá.<br/>Chọn nơi bạn muốn đến tiếp theo.</p></div>
 <div className="editorial-routes">{routes.slice(0,more?4:3).map(([from,to,badge,tagline],i)=>{const bank=getJourneyLandmark(to,'destination');return <article key={to} className={`editorial-route route-${i}`}>
 <svg className="editorial-route-art" viewBox={bank.crop.join(' ')} preserveAspectRatio="xMidYMid slice" role="img" aria-label={`${to} — ${bank.landmark}`}><image href={bank.image} width={bank.source[0]} height={bank.source[1]}/></svg>
 <span className="editorial-route-badge">{badge}</span><div className="editorial-route-copy"><span>{tagline}</span><h3>{from} → {to}</h3><div className="editorial-route-actions"><button onClick={()=>{if(onPreviewRoute){onPreviewRoute(from,to);document.getElementById('hero-search')?.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'})}else onSelectRoute(from,to)}} aria-label={`Xem cảnh hành trình tuyến ${from} → ${to}`}>Khám phá tuyến</button><button onClick={()=>onSelectRoute(from,to)} aria-label={`Tìm vé ngay tuyến ${from} → ${to}`}>Tìm chuyến <ArrowRight size={16}/></button></div></div></article>})}</div>
 <button className="editorial-more" onClick={()=>setMore(!more)} aria-expanded={more}>{more?'Thu gọn hành trình':'Xem thêm hành trình'} <ArrowRight size={16}/></button>
 </div></section>
};
