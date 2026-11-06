import React, { useState, useEffect } from "react";
import {
  CalendarDays,
  Plus,
  RefreshCw,
  FileText,
  Printer,
  X,
} from "lucide-react";
import { adminApi, type BusTripItem, type PartnerItem, type RouteItem, type BusVehicleItem } from "../../../services/adminApi";
import { money, formatDate } from "../studioConfig";

export const TripsView: React.FC = () => {
  const [trips, setTrips] = useState<BusTripItem[]>([]);
  const [partners, setPartners] = useState<PartnerItem[]>([]);
  const [routes, setRoutes] = useState<RouteItem[]>([]);
  const [vehicles, setVehicles] = useState<BusVehicleItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedPartner, setSelectedPartner] = useState("");
  const [selectedRoute, setSelectedRoute] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");

  // Manifest modal
  const [manifestData, setManifestData] = useState<{ trip: BusTripItem; passenger_manifest: any[] } | null>(null);
  const [createModal, setCreateModal] = useState(false);
  const [msg, setMsg] = useState("");

  // New trip form state
  const [newTrip, setNewTrip] = useState({
    partner_id: "",
    route_id: "",
    bus_vehicle_id: "",
    depart_time: "",
    arrive_time: "",
    base_price: 260000,
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {};
      if (selectedPartner) params.partner_id = selectedPartner;
      if (selectedRoute) params.route_id = selectedRoute;
      if (selectedDate) params.date = selectedDate;
      if (selectedStatus) params.status = selectedStatus;

      const [resTrips, resPartners, resRoutes, resVehicles] = await Promise.all([
        adminApi.getTrips(params),
        adminApi.getPartners(),
        adminApi.getRoutes(),
        adminApi.getVehicles(),
      ]);

      if (resTrips.data?.data) setTrips(resTrips.data.data);
      if (resPartners.data) {
        setPartners(resPartners.data);
        if (resPartners.data.length === 1) setNewTrip((f) => ({ ...f, partner_id: f.partner_id || resPartners.data[0].id }));
      }
      if (resRoutes.data) setRoutes(resRoutes.data);
      if (resVehicles.data) setVehicles(resVehicles.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedPartner, selectedRoute, selectedDate, selectedStatus]);

  const handleOpenManifest = async (tripId: string) => {
    try {
      const res = await adminApi.getTripManifest(tripId);
      if (res.status === 1) {
        setManifestData(res.data);
      }
    } catch (err: any) {
      alert("Lỗi tải danh sách hành khách: " + err.message);
    }
  };

  const handleUpdateStatus = async (tripId: string, status: string) => {
    try {
      await adminApi.updateTrip(tripId, { status });
      setMsg("Đã cập nhật trạng thái chuyến!");
      loadData();
    } catch (err: any) {
      alert("Lỗi: " + err.message);
    }
  };

  const handleCreateTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await adminApi.createTrip({
        partner_id: newTrip.partner_id || (partners[0]?.id ?? ""),
        route_id: newTrip.route_id || (routes[0]?.id ?? ""),
        bus_vehicle_id: newTrip.bus_vehicle_id || (vehicles[0]?.id ?? ""),
        depart_time: newTrip.depart_time,
        arrive_time: newTrip.arrive_time,
        base_price: Number(newTrip.base_price),
        status: "scheduled",
      });
      setMsg("Lên lịch chuyến chạy thành công!");
      setCreateModal(false);
      loadData();
    } catch (err: any) {
      alert("Lỗi lên lịch chuyến: " + err.message);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {loading && <div className="ds-progress">Đang tải chuyến xe...</div>}
      {msg && (
        <div className="ds-toast">
          {msg}
          <button onClick={() => setMsg("")}><X size={14} /></button>
        </div>
      )}

      {/* Toolbar bộ lọc */}
      <div className="ds-panel ds-filter-bar">
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
            <select
              value={selectedPartner}
              onChange={(e) => setSelectedPartner(e.target.value)}
              className="ds-filter-select"
              style={{ minWidth: 160 }}
            >
              <option value="">Tất cả nhà xe</option>
              {partners.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>

            <select
              value={selectedRoute}
              onChange={(e) => setSelectedRoute(e.target.value)}
              className="ds-filter-select"
              style={{ minWidth: 190 }}
            >
              <option value="">Tất cả tuyến đường</option>
              {routes.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>

            <div className="ds-filter-date-wrap">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="ds-filter-select"
              style={{ minWidth: 150 }}
            >
              <option value="">Tất cả trạng thái</option>
              <option value="scheduled">Đang mở bán</option>
              <option value="running">Đang chạy</option>
              <option value="pending">Chờ duyệt mở bán</option>
              <option value="draft">Bản nháp</option>
              <option value="completed">Đã hoàn thành</option>
              <option value="cancelled">Đã hủy</option>
            </select>

            <button
              onClick={loadData}
              className="ds-btn-outline"
              style={{ padding: "8px 14px", borderRadius: 10, fontSize: 13, display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}
            >
              <RefreshCw size={14} /> Làm mới
            </button>
          </div>

          <button
            onClick={() => setCreateModal(true)}
            className="ds-primary"
            style={{ padding: "9px 18px", borderRadius: 10, fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}
          >
            <Plus size={16} /> Lên lịch chuyến mới
          </button>
        </div>
      </div>

      {/* Bảng chuyến chạy */}
      <div className="ds-panel" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#f8fafd", borderBottom: "1px solid #e2eaf4" }}>
                <th style={{ padding: "12px 16px", textAlign: "left" }}>Giờ xuất phát</th>
                <th style={{ padding: "12px 16px", textAlign: "left" }}>Tuyến đường</th>
                <th style={{ padding: "12px 16px", textAlign: "left" }}>Nhà xe</th>
                <th style={{ padding: "12px 16px", textAlign: "left" }}>Phương tiện & Biển số</th>
                <th style={{ padding: "12px 16px", textAlign: "left" }}>Tài xế</th>
                <th style={{ padding: "12px 16px", textAlign: "center" }}>Tồn ghế</th>
                <th style={{ padding: "12px 16px", textAlign: "right" }}>Giá vé</th>
                <th style={{ padding: "12px 16px", textAlign: "center" }}>Trạng thái</th>
                <th style={{ padding: "12px 16px", textAlign: "center" }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {trips.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ padding: 40, textAlign: "center", color: "#6c809c" }}>
                    <CalendarDays size={32} style={{ margin: "0 auto 8px", display: "block", color: "#a5b4fc" }} />
                    Chưa có chuyến chạy nào trong lịch trình này.
                  </td>
                </tr>
              ) : (
                trips.map((t) => {
                  const cap = t.vehicle?.capacity || 20;
                  const booked = t.booked_seats_count || 0;
                  const pct = Math.min(100, Math.round((booked / cap) * 100));
                  return (
                    <tr key={t.id} style={{ borderBottom: "1px solid #edf2f9" }}>
                      <td style={{ padding: "14px 16px" }}>
                        <div style={{ fontWeight: 700, fontSize: 14, color: "#102744" }}>
                          {formatDate(t.depart_time)}
                        </div>
                        <small style={{ color: "#6c809c" }}>
                          Đến: {formatDate(t.arrive_time)}
                        </small>
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        <strong style={{ color: "#1e3a8a", display: "block" }}>{t.route?.name}</strong>
                        <span style={{ fontSize: 12, color: "#6c809c" }}>
                          {t.route?.from_city} → {t.route?.to_city} ({t.route?.duration_minutes} phút)
                        </span>
                      </td>
                      <td style={{ padding: "14px 16px", fontWeight: 600 }}>
                        {t.partner?.name}
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        <div style={{ fontWeight: 600 }}>{t.vehicle?.name || "Xe khách"}</div>
                        <span style={{ background: "#eef5ff", color: "#1765e8", padding: "1px 6px", borderRadius: 4, fontSize: 11, fontWeight: 700 }}>
                          {t.vehicle?.plate_number}
                        </span>
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        {t.driver ? (
                          <>
                            <div style={{ fontWeight: 600 }}>{t.driver.name}</div>
                            <small style={{ color: "#6c809c" }}>{t.driver.phone}</small>
                          </>
                        ) : (
                          <span style={{ color: "#9ca3af", fontStyle: "italic" }}>Chưa phân công</span>
                        )}
                      </td>
                      <td style={{ padding: "14px 16px", textAlign: "center" }}>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                          <span style={{ fontWeight: 700, color: pct >= 80 ? "#16825d" : "#1e3a8a" }}>
                            {booked} / {cap} chỗ ({pct}%)
                          </span>
                          <div style={{ width: 80, height: 6, background: "#e2e8f0", borderRadius: 3, overflow: "hidden" }}>
                            <div style={{ width: `${pct}%`, height: "100%", background: pct >= 80 ? "#16825d" : "#1765e8", borderRadius: 3 }} />
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "14px 16px", textAlign: "right", fontWeight: 700, color: "#102744" }}>
                        {money(t.base_price)}
                      </td>
                      <td style={{ padding: "14px 16px", textAlign: "center" }}>
                        <span className={`ds-badge ${({ scheduled: "active", running: "paid", completed: "published", draft: "unpaid", pending: "unpaid" } as Record<string, string>)[t.status] || "cancelled"}`}>
                          {({ scheduled: "Đang mở bán", running: "Đang chạy", completed: "Hoàn tất", draft: "Bản nháp", pending: "Chờ duyệt mở bán", cancelled: "Đã hủy" } as Record<string, string>)[t.status] || t.status}
                        </span>
                      </td>
                      <td style={{ padding: "14px 16px", textAlign: "center" }}>
                        <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
                          <button
                            onClick={() => handleOpenManifest(t.id)}
                            title="Danh sách hành khách (Manifest)"
                            style={{ border: "1px solid #1765e8", background: "#eef5ff", color: "#1765e8", padding: "4px 8px", borderRadius: 6, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4 }}
                          >
                            <FileText size={14} /> DS khách
                          </button>
                          {(t.status === "draft" || t.status === "pending") && (
                            <button
                              onClick={() => handleUpdateStatus(t.id, "scheduled")}
                              title={t.status === "pending" ? "Nền tảng duyệt để mở bán" : "Mở bán chuyến"}
                              style={{ border: "1px solid #f2730e", background: "#fff4e9", color: "#c2410c", padding: "4px 8px", borderRadius: 6, cursor: "pointer" }}
                            >
                              {t.status === "pending" ? "Duyệt mở bán" : "Mở bán"}
                            </button>
                          )}
                          {t.status === "scheduled" && (
                            <button
                              onClick={() => handleUpdateStatus(t.id, "running")}
                              title="Bắt đầu xuất bến"
                              style={{ border: "1px solid #16825d", background: "#e6f7ed", color: "#16825d", padding: "4px 8px", borderRadius: 6, cursor: "pointer" }}
                            >
                              Xuất bến
                            </button>
                          )}
                          {t.status === "running" && (
                            <button
                              onClick={() => handleUpdateStatus(t.id, "completed")}
                              title="Hoàn tất chuyến"
                              style={{ border: "1px solid #16825d", background: "#e6f7ed", color: "#16825d", padding: "4px 8px", borderRadius: 6, cursor: "pointer" }}
                            >
                              Hoàn tất
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Trip Manifest (Danh sách hành khách) */}
      {manifestData && (
        <div className="ds-modal-backdrop" onClick={() => setManifestData(null)}>
          <div className="ds-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 750 }}>
            <header>
              <h2>Danh sách hành khách chuyến {manifestData.trip?.route?.name}</h2>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <button
                  onClick={() => window.print()}
                  style={{ background: "#f1f5f9", border: "1px solid #cbd5e1", borderRadius: 6, padding: "4px 10px", fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}
                >
                  <Printer size={14} /> In danh sách
                </button>
                <button onClick={() => setManifestData(null)}><X size={20} /></button>
              </div>
            </header>
            <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ background: "#f8fafd", padding: 14, borderRadius: 8, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, fontSize: 13 }}>
                <div><strong>Khởi hành:</strong> {formatDate(manifestData.trip.depart_time)}</div>
                <div><strong>Xe:</strong> {manifestData.trip.vehicle?.name} ({manifestData.trip.vehicle?.plate_number})</div>
                <div><strong>Tài xế:</strong> {manifestData.trip.driver?.name || "Chưa gán"} ({manifestData.trip.driver?.phone || "—"})</div>
              </div>

              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: "#f1f5f9", borderBottom: "1px solid #cbd5e1" }}>
                      <th style={{ padding: "8px 10px", textAlign: "left" }}>STT</th>
                      <th style={{ padding: "8px 10px", textAlign: "left" }}>Mã vé</th>
                      <th style={{ padding: "8px 10px", textAlign: "left" }}>Họ tên hành khách</th>
                      <th style={{ padding: "8px 10px", textAlign: "left" }}>Số điện thoại</th>
                      <th style={{ padding: "8px 10px", textAlign: "center" }}>Ghế ngồi</th>
                      <th style={{ padding: "8px 10px", textAlign: "center" }}>Thanh toán</th>
                      <th style={{ padding: "8px 10px", textAlign: "left" }}>Điểm đón / Ghi chú</th>
                    </tr>
                  </thead>
                  <tbody>
                    {manifestData.passenger_manifest.length === 0 ? (
                      <tr>
                        <td colSpan={7} style={{ padding: 30, textAlign: "center", color: "#64748b" }}>Chưa có hành khách nào đặt chỗ trên chuyến này.</td>
                      </tr>
                    ) : (
                      manifestData.passenger_manifest.map((p, idx) => (
                        <tr key={p.id} style={{ borderBottom: "1px solid #e2e8f0" }}>
                          <td style={{ padding: "10px" }}>{idx + 1}</td>
                          <td style={{ padding: "10px", fontWeight: 700, color: "#1e3a8a" }}>{p.booking_code}</td>
                          <td style={{ padding: "10px", fontWeight: 600 }}>{p.customer_name}</td>
                          <td style={{ padding: "10px" }}>{p.customer_phone}</td>
                          <td style={{ padding: "10px", textAlign: "center", fontWeight: 700, color: "#16825d" }}>{(p.seats || []).join(", ")}</td>
                          <td style={{ padding: "10px", textAlign: "center" }}>
                            <span className={`ds-badge ${p.payment_status === "paid" ? "paid" : "unpaid"}`}>
                              {p.payment_status === "paid" ? "Đã thu" : "Chưa thu"}
                            </span>
                          </td>
                          <td style={{ padding: "10px", fontSize: 12 }}>{p.notes || "Điểm đón bến xe"}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Lên lịch chuyến mới */}
      {createModal && (
        <div className="ds-modal-backdrop" onClick={() => setCreateModal(false)}>
          <div className="ds-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 540 }}>
            <header>
              <h2>Lên lịch chuyến chạy mới</h2>
              <button onClick={() => setCreateModal(false)}><X size={20} /></button>
            </header>
            <form onSubmit={handleCreateTrip} style={{ padding: 24, display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ display: "block", marginBottom: 4, fontSize: 13, fontWeight: 600 }}>Nhà xe vận hành:</label>
                  <select
                    value={newTrip.partner_id}
                    onChange={(e) => setNewTrip({ ...newTrip, partner_id: e.target.value })}
                    required
                    style={{ width: "100%", padding: "8px 10px" }}
                  >
                    <option value="">Chọn nhà xe</option>
                    {partners.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: 4, fontSize: 13, fontWeight: 600 }}>Tuyến đường:</label>
                  <select
                    value={newTrip.route_id}
                    onChange={(e) => setNewTrip({ ...newTrip, route_id: e.target.value })}
                    required
                    style={{ width: "100%", padding: "8px 10px" }}
                  >
                    <option value="">Chọn tuyến đường</option>
                    {routes.map((r) => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ display: "block", marginBottom: 4, fontSize: 13, fontWeight: 600 }}>Phương tiện xe:</label>
                  <select
                    value={newTrip.bus_vehicle_id}
                    onChange={(e) => setNewTrip({ ...newTrip, bus_vehicle_id: e.target.value })}
                    required
                    style={{ width: "100%", padding: "8px 10px" }}
                  >
                    <option value="">Chọn xe</option>
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.id}>{v.name} ({v.plate_number}) - {v.capacity} chỗ</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: 4, fontSize: 13, fontWeight: 600 }}>Giá vé cơ bản (đ):</label>
                  <input
                    type="number"
                    required
                    value={newTrip.base_price}
                    onChange={(e) => setNewTrip({ ...newTrip, base_price: Number(e.target.value) })}
                    style={{ width: "100%", padding: "8px 10px" }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ display: "block", marginBottom: 4, fontSize: 13, fontWeight: 600 }}>Thời gian xuất bến:</label>
                  <input
                    type="datetime-local"
                    required
                    value={newTrip.depart_time}
                    onChange={(e) => setNewTrip({ ...newTrip, depart_time: e.target.value })}
                    style={{ width: "100%", padding: "8px 10px" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: 4, fontSize: 13, fontWeight: 600 }}>Thời gian dự kiến đến:</label>
                  <input
                    type="datetime-local"
                    required
                    value={newTrip.arrive_time}
                    onChange={(e) => setNewTrip({ ...newTrip, arrive_time: e.target.value })}
                    style={{ width: "100%", padding: "8px 10px" }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 12 }}>
                <button type="button" className="ds-secondary" onClick={() => setCreateModal(false)} style={{ padding: "8px 16px" }}>Hủy</button>
                <button type="submit" className="ds-primary" style={{ padding: "8px 22px" }}>Lên lịch ngay</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default TripsView;

