import React, { useState, useEffect } from "react";
import {
  Download,
  Building2,
  TrendingUp,
  Ticket,
  DollarSign,
  Route,
  RefreshCw,
} from "lucide-react";
import { adminApi, type PartnerItem } from "../../../services/adminApi";
import { money } from "../studioConfig";

export const ReportsView: React.FC = () => {
  const [reportData, setReportData] = useState<any | null>(null);
  const [partners, setPartners] = useState<PartnerItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [startDate, setStartDate] = useState("2026-10-01");
  const [endDate, setEndDate] = useState("2026-11-30");
  const [selectedPartner, setSelectedPartner] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {
        start_date: startDate,
        end_date: endDate,
      };
      if (selectedPartner) params.partner_id = selectedPartner;

      const [resReport, resPartners] = await Promise.all([
        adminApi.getReports(params),
        adminApi.getPartners(),
      ]);

      if (resReport.data) setReportData(resReport.data);
      if (resPartners.data) setPartners(resPartners.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [startDate, endDate, selectedPartner]);

  const handleExport = () => {
    const url = `/api/admin/reports/export?start_date=${startDate}&end_date=${endDate}`;
    window.open(url, "_blank");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {loading && <div className="ds-progress">Đang tải báo cáo...</div>}
      {/* Toolbar bộ lọc & Xuất file */}
      <div className="ds-panel" style={{ padding: "16px 20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#f8fafd", padding: "4px 8px", borderRadius: 8, border: "1px solid #d8e2ed" }}>
              <span style={{ fontSize: 12, color: "#6c809c" }}>Từ:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                style={{ border: "none", background: "none", fontSize: 13, outline: "none" }}
              />
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#f8fafd", padding: "4px 8px", borderRadius: 8, border: "1px solid #d8e2ed" }}>
              <span style={{ fontSize: 12, color: "#6c809c" }}>Đến:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                style={{ border: "none", background: "none", fontSize: 13, outline: "none" }}
              />
            </div>

            <select
              value={selectedPartner}
              onChange={(e) => setSelectedPartner(e.target.value)}
              style={{ minWidth: 160, padding: "8px 12px", borderRadius: 8, fontSize: 13 }}
            >
              <option value="">Tất cả nhà xe</option>
              {partners.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>

            <button
              onClick={loadData}
              className="ds-secondary"
              style={{ padding: "8px 14px", borderRadius: 8, fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}
            >
              <RefreshCw size={14} /> Tra cứu
            </button>
          </div>

          <button
            onClick={handleExport}
            className="ds-primary"
            style={{ padding: "9px 18px", borderRadius: 8, fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}
          >
            <Download size={16} /> Xuất file báo cáo Excel / CSV
          </button>
        </div>
      </div>

      {/* 4 Cards Tổng kết */}
      <section className="ds-stats" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
        <article className="ds-stat" style={{ borderLeft: "4px solid #1765e8" }}>
          <span>
            <TrendingUp size={18} />
            Tổng doanh thu bán vé
          </span>
          <strong>{money(reportData?.gross_revenue || 0)}</strong>
          <small style={{ color: "#6c809c", marginTop: 4, display: "block" }}>
            Toàn bộ giá trị vé hoàn tất
          </small>
        </article>

        <article className="ds-stat teal" style={{ borderLeft: "4px solid #16825d" }}>
          <span>
            <DollarSign size={18} />
            Lợi nhuận gộp sàn (Hoa hồng)
          </span>
          <strong>{money(reportData?.estimated_profit || 0)}</strong>
          <small style={{ color: "#6c809c", marginTop: 4, display: "block" }}>
            Phần doanh thu giữ lại nền tảng
          </small>
        </article>

        <article className="ds-stat blue" style={{ borderLeft: "4px solid #1676a0" }}>
          <span>
            <Ticket size={18} />
            Tổng số vé đã bán
          </span>
          <strong>{reportData?.total_tickets || 0} vé</strong>
          <small style={{ color: "#6c809c", marginTop: 4, display: "block" }}>
            Lượt ghế đã phục vụ thành công
          </small>
        </article>

        <article className="ds-stat sand" style={{ borderLeft: "4px solid #7750bb" }}>
          <span>
            <Building2 size={18} />
            Số lượng đơn đặt vé
          </span>
          <strong>{reportData?.total_bookings || 0} đơn</strong>
          <small style={{ color: "#6c809c", marginTop: 4, display: "block" }}>
            Giao dịch qua website & app
          </small>
        </article>
      </section>

      {/* Grid 2 Bảng chi tiết: Báo cáo Tuyến & Báo cáo Nhà xe */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 420px), 1fr))", gap: 20 }}>
        {/* Báo cáo theo Tuyến đường */}
        <div className="ds-panel">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: "#102744", display: "flex", alignItems: "center", gap: 8 }}>
              <Route size={18} color="#1765e8" />
              Doanh thu theo Tuyến đường
            </h3>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "#f8fafd", borderBottom: "1px solid #e2eaf4" }}>
                  <th style={{ padding: "10px 12px", textAlign: "left" }}>Tuyến đường</th>
                  <th style={{ padding: "10px 12px", textAlign: "center" }}>Số đơn</th>
                  <th style={{ padding: "10px 12px", textAlign: "center" }}>Số vé</th>
                  <th style={{ padding: "10px 12px", textAlign: "right" }}>Doanh số</th>
                </tr>
              </thead>
              <tbody>
                {(reportData?.routes_report || []).length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ padding: 20, textAlign: "center", color: "#6c809c" }}>Không có dữ liệu trong khoảng ngày này.</td>
                  </tr>
                ) : (
                  (reportData?.routes_report || []).map((r: any) => (
                    <tr key={r.id} style={{ borderBottom: "1px solid #edf2f9" }}>
                      <td style={{ padding: "12px", fontWeight: 600, color: "#102744" }}>{r.name}</td>
                      <td style={{ padding: "12px", textAlign: "center" }}>{r.bookings_count}</td>
                      <td style={{ padding: "12px", textAlign: "center", fontWeight: 700, color: "#16825d" }}>{r.tickets_sold}</td>
                      <td style={{ padding: "12px", textAlign: "right", fontWeight: 700, color: "#1765e8" }}>{money(r.total_revenue)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Báo cáo theo Nhà xe */}
        <div className="ds-panel">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: "#102744", display: "flex", alignItems: "center", gap: 8 }}>
              <Building2 size={18} color="#16825d" />
              Doanh thu theo Đối tác nhà xe
            </h3>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "#f8fafd", borderBottom: "1px solid #e2eaf4" }}>
                  <th style={{ padding: "10px 12px", textAlign: "left" }}>Nhà xe</th>
                  <th style={{ padding: "10px 12px", textAlign: "center" }}>Hoa hồng</th>
                  <th style={{ padding: "10px 12px", textAlign: "center" }}>Số vé</th>
                  <th style={{ padding: "10px 12px", textAlign: "right" }}>Doanh thu</th>
                </tr>
              </thead>
              <tbody>
                {(reportData?.partners_report || []).length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ padding: 20, textAlign: "center", color: "#6c809c" }}>Không có dữ liệu trong khoảng ngày này.</td>
                  </tr>
                ) : (
                  (reportData?.partners_report || []).map((p: any) => (
                    <tr key={p.id} style={{ borderBottom: "1px solid #edf2f9" }}>
                      <td style={{ padding: "12px", fontWeight: 600, color: "#102744" }}>{p.name}</td>
                      <td style={{ padding: "12px", textAlign: "center" }}>
                        <span className="ds-badge active">{p.commission_rate}%</span>
                      </td>
                      <td style={{ padding: "12px", textAlign: "center", fontWeight: 700, color: "#16825d" }}>{p.tickets_sold}</td>
                      <td style={{ padding: "12px", textAlign: "right", fontWeight: 700, color: "#1765e8" }}>{money(p.total_revenue)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
export default ReportsView;

