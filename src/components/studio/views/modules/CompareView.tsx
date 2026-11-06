import { useState } from "react";
import { BarChart3, BusFront, Percent, RefreshCw, Trophy, Wallet } from "lucide-react";
import { studioModules, vnToday } from "../../../../services/studioModulesApi";
import { Kpi, Notice, pct, useLoad, vnd } from "./kit";

/** So sánh hiệu quả giữa các nhà xe hoặc giữa các tuyến. */
export default function CompareView() {
  const [group, setGroup] = useState<"partner" | "route">("partner");
  const [from, setFrom] = useState(vnToday().slice(0, 8) + "01");
  const [to, setTo] = useState(vnToday());
  const report = useLoad(() => studioModules.compare({ from, to, group }).then((r) => r.data), [from, to, group]);
  const rows = report.data?.rows ?? [];
  const maxRevenue = Math.max(1, ...rows.map((r) => r.revenue));
  const best = rows[0];
  const label = group === "partner" ? "Nhà xe" : "Tuyến";

  return (
    <div className="ds-page" style={{ gap: 18 }}>
      <div className="dm-head">
        <div>
          <h2>So sánh {group === "partner" ? "nhà xe" : "tuyến đường"}</h2>
          <p>Đặt các {group === "partner" ? "nhà xe" : "tuyến"} cạnh nhau theo chuyến khởi hành trong kỳ: lấp đầy, doanh thu, huỷ vé, tỉ lệ lên xe và đánh giá.</p>
        </div>
        <div className="dm-seg" role="tablist">
          <button type="button" role="tab" aria-selected={group === "partner"} className={group === "partner" ? "on" : ""} onClick={() => setGroup("partner")}>Theo nhà xe</button>
          <button type="button" role="tab" aria-selected={group === "route"} className={group === "route" ? "on" : ""} onClick={() => setGroup("route")}>Theo tuyến</button>
        </div>
      </div>

      <div className="ds-panel ds-filter-bar">
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center", width: "100%" }}>
          <div className="ds-filter-date-wrap"><span style={{ fontSize: 12, color: "#64748b" }}>Từ</span><input type="date" value={from} max={to} onChange={(e) => setFrom(e.target.value || from)} aria-label="Từ ngày" /></div>
          <div className="ds-filter-date-wrap"><span style={{ fontSize: 12, color: "#64748b" }}>Đến</span><input type="date" value={to} min={from} onChange={(e) => setTo(e.target.value || to)} aria-label="Đến ngày" /></div>
          <button type="button" className="dm-btn" onClick={() => report.reload()}><RefreshCw size={15} /> Làm mới</button>
        </div>
      </div>

      {report.error && <Notice kind="error">{report.error}</Notice>}

      <div className="dm-kpis">
        <Kpi icon={<BusFront size={18} />} label="Chuyến trong kỳ" value={report.data?.totals.trips ?? "—"} />
        <Kpi icon={<Percent size={18} />} label="Lấp đầy chung" value={pct(report.data?.totals.occupancy)} hint={report.data ? `${report.data.totals.seats_sold}/${report.data.totals.capacity} ghế` : undefined} />
        <Kpi icon={<Wallet size={18} />} tone="green" label="Doanh thu đã thu" value={report.data ? vnd(report.data.totals.revenue) : "—"} />
        <Kpi icon={<Trophy size={18} />} tone="orange" label={`${label} dẫn đầu`} value={best?.name ?? "—"} hint={best ? vnd(best.revenue) : undefined} />
      </div>

      <div className="dm-card">
        <h3><BarChart3 size={17} /> Bảng so sánh</h3>
        <div className="dm-table-wrap">
          <table className="dm-table">
            <thead><tr><th>#</th><th>{label}</th><th className="num">Chuyến</th><th>Lấp đầy</th><th>Doanh thu</th><th className="num">DT / chuyến</th><th className="num">Huỷ vé</th><th className="num">Lên xe</th><th className="num">Đánh giá</th></tr></thead>
            <tbody>
              {report.loading && !report.data && <tr><td colSpan={9} className="dm-empty">Đang tổng hợp…</td></tr>}
              {report.data && !rows.length && <tr><td colSpan={9} className="dm-empty">Không có chuyến khởi hành trong khoảng ngày này.</td></tr>}
              {rows.map((r, i) => (
                <tr key={r.id}>
                  <td className="muted">{i + 1}</td>
                  <td><strong>{r.name}</strong></td>
                  <td className="num">{r.trips}</td>
                  <td style={{ minWidth: 170 }}>
                    <div className="dm-bar-cell"><div className="dm-bar blue"><i style={{ width: `${Math.min(100, r.occupancy ?? 0)}%` }} /></div><span style={{ fontSize: 12.5, whiteSpace: "nowrap" }}>{pct(r.occupancy)} <small className="muted">({r.seats_sold}/{r.capacity})</small></span></div>
                  </td>
                  <td style={{ minWidth: 190 }}>
                    <div className="dm-bar-cell"><div className="dm-bar"><i style={{ width: `${(r.revenue / maxRevenue) * 100}%` }} /></div><span style={{ fontSize: 12.5, fontWeight: 700, whiteSpace: "nowrap" }}>{vnd(r.revenue)}</span></div>
                  </td>
                  <td className="num">{vnd(r.revenue_per_trip)}</td>
                  <td className="num" style={{ color: (r.cancel_rate ?? 0) > 10 ? "#b91c1c" : undefined }}>{pct(r.cancel_rate)}</td>
                  <td className="num">{pct(r.boarding_rate)}</td>
                  <td className="num">{r.rating ? <><span className="dm-stars">★</span> {r.rating} <small className="muted">({r.reviews})</small></> : <span className="muted">—</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={{ margin: "12px 0 0", fontSize: 12.5, color: "#64748b" }}>
          Tính theo chuyến có giờ khởi hành trong kỳ (không gồm chuyến đã huỷ). Lấp đầy = ghế đã bán / sức chứa xe; lên xe = ghế đã soát / ghế đã bán; doanh thu chỉ gồm vé đã thanh toán.
        </p>
      </div>
    </div>
  );
}
