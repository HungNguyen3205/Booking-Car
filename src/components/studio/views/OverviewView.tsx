import React, { useState, useEffect } from "react";
import {
  TrendingUp,
  Calendar,
  Bus,
  Users,
  Building2,
  Ticket,
  CalendarDays,
  Wrench,
  UserPlus,
} from "lucide-react";
import { adminApi, type DashboardStats } from "../../../services/adminApi";
import { money } from "../studioConfig";

export const OverviewView: React.FC<{
  onNavigate: (page: string) => void;
}> = ({ onNavigate }) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await adminApi.getStatistics("month");
      if (res.status === 1) {
        setStats(res.data);
      }
    } catch (err: any) {
      // Never substitute invented figures for real statistics.
      setStats(null);
      setError(`Không tải được số liệu tổng quan: ${err?.message || "lỗi kết nối"}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Format dynamic Vietnamese date matching Image 1
  const getFormattedDate = () => {
    const days = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];
    const now = new Date();
    const dayName = days[now.getDay()];
    const date = now.getDate();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    return `${dayName}, ${date} tháng ${month}, ${year}`;
  };

  // Last 6 months from the API; empty months render as zero bars.
  const sixMonthData = stats?.six_month_chart ?? [];

  const maxVal = Math.max(1, ...sixMonthData.map((c) => c.value));
  // Real month-over-month change; null when last month had no revenue.
  const thisMonth = sixMonthData.at(-1)?.value ?? 0;
  const lastMonth = sixMonthData.at(-2)?.value ?? 0;
  const monthTrend = lastMonth > 0 ? Math.round(((thisMonth - lastMonth) / lastMonth) * 100) : null;

  // Key values: "—" until real data arrives (or if it failed).
  const dash = "—";
  const totalRevFormatted = stats ? money(stats.total_revenue || 0).replace("đ", " ₫") : dash;
  const totalBookings = stats?.total_bookings_count ?? dash;
  const pendingBookings = stats?.pending_bookings_count ?? dash;
  const confirmedBookings = stats?.confirmed_bookings_count ?? dash;
  const completedBookings = stats?.completed_bookings_count ?? dash;
  const cancelledBookings = stats?.cancelled_bookings_count ?? dash;
  const vehiclesActive = stats?.vehicles_active ?? dash;
  const vehiclesTotal = stats?.vehicles_total ?? dash;
  const vehiclesMaint = stats?.vehicles_maintenance ?? dash;
  const totalCustomers = stats?.total_customers ?? dash;
  const newCustomersWeek = stats?.new_customers_week ?? dash;

  return (
    <div className="ds-page" style={{ gap: 24 }}>
      {loading && <div className="ds-alert ds-alert-info">Đang đồng bộ số liệu hệ thống...</div>}
      {error && <div className="ds-alert ds-alert-danger">{error}</div>}

      {/* 1. GREETING CARD (Exact match Image 1) */}
      <section className="ds-greeting-card">
        <div>
          <h1 className="ds-greeting-title">
            Chào mừng trở lại, <span className="brand-highlight">Admin</span>
          </h1>
          <p className="ds-greeting-sub">
            Hệ thống đang hoạt động ổn định. Đây là tổng quan hoạt động trong ngày.
          </p>
        </div>
        <div className="ds-greeting-date-pill">
          <CalendarDays size={16} />
          <span>{getFormattedDate()}</span>
        </div>
      </section>

      {/* 2. 4 KPI STAT BLOCKS (Orange-themed icons) */}
      <section className="ds-kpi-grid">
        {/* Card 1: Tổng doanh thu */}
        <article className="ds-kpi-card">
          <div className="ds-kpi-icon-box ds-kpi-icon-orange">
            <TrendingUp size={24} />
          </div>
          <div className="ds-kpi-content">
            <span className="ds-kpi-label">TỔNG DOANH THU</span>
            <strong className="ds-kpi-val">{totalRevFormatted}</strong>
            <div className="ds-kpi-footer">
              {monthTrend === null ? (
                "Chưa đủ dữ liệu so sánh tháng trước"
              ) : (
                <>
                  <span className="ds-kpi-trend-orange">{monthTrend >= 0 ? "↑" : "↓"} {Math.abs(monthTrend)}%</span> so với tháng trước
                </>
              )}
            </div>
          </div>
        </article>

        {/* Card 2: Tổng đơn đặt xe / vé */}
        <article className="ds-kpi-card" onClick={() => onNavigate("bookings")} style={{ cursor: "pointer" }}>
          <div className="ds-kpi-icon-box ds-kpi-icon-orange-2">
            <Calendar size={24} />
          </div>
          <div className="ds-kpi-content">
            <span className="ds-kpi-label">TỔNG ĐƠN ĐẶT XE</span>
            <strong className="ds-kpi-val">{totalBookings}</strong>
            <div className="ds-kpi-footer">
              <span className="ds-kpi-dot-amber" style={{ color: "#f2730e" }}>●</span> {pendingBookings} đơn đang chờ
            </div>
          </div>
        </article>

        {/* Card 3: Phương tiện sẵn có */}
        <article className="ds-kpi-card" onClick={() => onNavigate("vehicles")} style={{ cursor: "pointer" }}>
          <div className="ds-kpi-icon-box ds-kpi-icon-orange-3">
            <Bus size={24} />
          </div>
          <div className="ds-kpi-content">
            <span className="ds-kpi-label">PHƯƠNG TIỆN SẴN CÓ</span>
            <strong className="ds-kpi-val">{vehiclesActive}/{vehiclesTotal}</strong>
            <div className="ds-kpi-footer">
              <Wrench size={13} style={{ display: "inline", verticalAlign: "middle", marginRight: 2, color: "#d97706" }} />
              {vehiclesMaint} xe đang bảo trì
            </div>
          </div>
        </article>

        {/* Card 4: Khách hàng tin dùng */}
        <article className="ds-kpi-card" onClick={() => onNavigate("passengers")} style={{ cursor: "pointer" }}>
          <div className="ds-kpi-icon-box ds-kpi-icon-orange-4">
            <Users size={24} />
          </div>
          <div className="ds-kpi-content">
            <span className="ds-kpi-label">KHÁCH HÀNG TIN DÙNG</span>
            <strong className="ds-kpi-val">{totalCustomers}</strong>
            <div className="ds-kpi-footer">
              <UserPlus size={13} style={{ display: "inline", verticalAlign: "middle", marginRight: 2, color: "#f2730e" }} />
              +{newCustomersWeek} thành viên mới tuần này
            </div>
          </div>
        </article>
      </section>

      {/* 3. 2 MAIN VISUAL BLOCKS (Exact match Image 1: 6-Month Chart & Status Distribution) */}
      <section className="ds-overview-visual-grid">
        {/* Left: Xu hướng doanh thu (6 tháng) */}
        <div className="ds-chart-block">
          <div className="ds-chart-block-header">
            <h2 className="ds-chart-block-title">Xu hướng doanh thu (6 tháng)</h2>
          </div>

          <div className="ds-barchart-container">
            {sixMonthData.map((c, i) => {
              const hPct = c.value > 0 ? Math.max(16, Math.round((c.value / maxVal) * 170)) : 4;
              const formattedVal = money(c.value).replace("đ", " ₫");
              return (
                <div key={i} className="ds-barchart-col">
                  <span className="ds-barchart-val-label">{formattedVal}</span>
                  <div
                    className="ds-barchart-bar"
                    style={{ height: hPct }}
                    title={`${c.label}: ${formattedVal}`}
                  />
                  <span className="ds-barchart-month-label">{c.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Phân bổ trạng thái đơn */}
        <div className="ds-status-dist-block">
          <div className="ds-status-dist-header">
            <h2 className="ds-status-dist-title">Phân bổ trạng thái đơn</h2>
          </div>

          <div className="ds-status-row-list">
            <div className="ds-status-row-card" onClick={() => onNavigate("bookings")} style={{ cursor: "pointer" }}>
              <div className="ds-status-row-left">
                <span className="ds-dot-amber">●</span>
                <span>Đang chờ</span>
              </div>
              <strong className="ds-status-row-right">{pendingBookings}</strong>
            </div>

            <div className="ds-status-row-card" onClick={() => onNavigate("bookings")} style={{ cursor: "pointer" }}>
              <div className="ds-status-row-left">
                <span className="ds-dot-green">●</span>
                <span>Xác nhận</span>
              </div>
              <strong className="ds-status-row-right">{confirmedBookings}</strong>
            </div>

            <div className="ds-status-row-card" onClick={() => onNavigate("bookings")} style={{ cursor: "pointer" }}>
              <div className="ds-status-row-left">
                <span className="ds-dot-blue">●</span>
                <span>Đã hoàn thành</span>
              </div>
              <strong className="ds-status-row-right">{completedBookings}</strong>
            </div>

            <div className="ds-status-row-card" onClick={() => onNavigate("bookings")} style={{ cursor: "pointer" }}>
              <div className="ds-status-row-left">
                <span className="ds-dot-red">●</span>
                <span>Đã hủy</span>
              </div>
              <strong className="ds-status-row-right">{cancelledBookings}</strong>
            </div>
          </div>
        </div>
      </section>

      {/* 4. GRANULAR OPERATIONAL SECTIONS: Partner Efficiency & Recent Bookings in Floating Blocks */}
      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 340px), 1fr))", gap: 20 }}>
        {/* Partner Performance Block */}
        <div className="ds-card">
          <div className="ds-card-header">
            <h3>
              <Building2 size={18} color="#f2730e" />
              Hiệu quả nhà xe đối tác
            </h3>
            <button
              onClick={() => onNavigate("partners")}
              className="ds-btn ds-btn-sm ds-btn-outline"
            >
              Quản lý đối tác →
            </button>
          </div>

          <div className="ds-table-container">
            <table className="ds-table">
              <thead>
                <tr>
                  <th>Nhà xe</th>
                  <th style={{ textAlign: "center" }}>Số chuyến</th>
                  <th style={{ textAlign: "center" }}>Vé đã bán</th>
                  <th style={{ textAlign: "right" }}>Doanh thu</th>
                  <th style={{ textAlign: "center" }}>Hoa hồng</th>
                </tr>
              </thead>
              <tbody>
                {(stats?.operator_performance || []).map((p) => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 700, color: "#1a202c" }}>{p.name}</td>
                    <td style={{ textAlign: "center" }}>{p.trips_count}</td>
                    <td style={{ textAlign: "center", color: "#16a34a", fontWeight: 700 }}>{p.tickets_sold}</td>
                    <td style={{ textAlign: "right", fontWeight: 750, color: "#f2730e" }}>{money(p.revenue)}</td>
                    <td style={{ textAlign: "center" }}>
                      <span className="ds-badge badge-green">{p.commission_rate}%</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Bookings Block */}
        <div className="ds-card">
          <div className="ds-card-header">
            <h3>
              <Ticket size={18} color="#16a34a" />
              Đơn vé vừa đặt
            </h3>
            <button
              onClick={() => onNavigate("bookings")}
              className="ds-btn ds-btn-sm ds-btn-outline"
            >
              Xem tất cả đơn →
            </button>
          </div>

          <div className="ds-table-container">
            <table className="ds-table">
              <thead>
                <tr>
                  <th>Mã vé</th>
                  <th>Hành khách</th>
                  <th style={{ textAlign: "center" }}>Ghế</th>
                  <th style={{ textAlign: "right" }}>Tổng tiền</th>
                  <th style={{ textAlign: "center" }}>Thanh toán</th>
                </tr>
              </thead>
              <tbody>
                {(stats?.recent_bookings || []).map((b) => (
                  <tr key={b.id}>
                    <td style={{ fontWeight: 750, color: "#f2730e" }}>{b.booking_code}</td>
                    <td>
                      <div style={{ fontWeight: 650, color: "#1a202c" }}>{b.customer_name}</div>
                      <div style={{ fontSize: 11.5, color: "#64748b" }}>{b.customer_phone}</div>
                    </td>
                    <td style={{ textAlign: "center" }}>
                      {(b.seats || []).map((s: string) => (
                        <span key={s} className="ds-badge badge-blue" style={{ marginRight: 4 }}>
                          {s}
                        </span>
                      ))}
                    </td>
                    <td style={{ textAlign: "right", fontWeight: 750 }}>{money(b.final_amount)}</td>
                    <td style={{ textAlign: "center" }}>
                      <span className={`ds-badge ${b.payment_status === "paid" ? "badge-green" : "badge-orange"}`}>
                        {b.payment_status === "paid" ? "Đã thu đủ" : "Chờ thu tiền"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
};

export default OverviewView;
