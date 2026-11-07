import React, { useState, useEffect } from "react";
import {
  Plus,
  RefreshCw,
  MapPin,
  Trash2,
  X,
  Navigation,
} from "lucide-react";
import { adminApi, type RouteItem, type PartnerItem } from "../../../services/adminApi";
import { money } from "../studioConfig";

export const RoutesView: React.FC = () => {
  const [routes, setRoutes] = useState<RouteItem[]>([]);
  const [partners, setPartners] = useState<PartnerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRoute, setSelectedRoute] = useState<RouteItem | null>(null);
  const [createModal, setCreateModal] = useState(false);
  const [msg, setMsg] = useState("");

  type StopForm = { id?: string; name: string; address: string; stop_type: "pickup" | "dropoff" | "both"; time_offset_minutes: number; extra_fee: number; coords: string };
  const blankRoute = () => ({
    partner_id: "",
    name: "",
    from_city: "Hà Nội",
    to_city: "Hạ Long",
    distance_km: 165,
    duration_minutes: 150,
    base_price: 260000,
    stops: [
      { name: "Bến xe Mỹ Đình", address: "Số 20 Phạm Hùng", stop_type: "pickup", time_offset_minutes: 0, extra_fee: 0, coords: "" },
      { name: "Bãi Cháy", address: "Bến xe Bãi Cháy", stop_type: "dropoff", time_offset_minutes: 150, extra_fee: 0, coords: "" },
    ] as StopForm[],
  });
  const [formData, setFormData] = useState(blankRoute);
  // Editing an existing route (adds GPS coordinates used by trip tracking).
  const [editingId, setEditingId] = useState<string | null>(null);

  /** "16.0544, 108.2022" (copied from Google Maps) -> {lat,lng}; "" -> null; invalid -> undefined. */
  const parseCoords = (text: string) => {
    if (!text.trim()) return null;
    const m = text.trim().match(/^(-?\d+(?:\.\d+)?)\s*[,; ]\s*(-?\d+(?:\.\d+)?)$/);
    if (!m) return undefined;
    const lat = Number(m[1]), lng = Number(m[2]);
    return Math.abs(lat) <= 90 && Math.abs(lng) <= 180 ? { lat, lng } : undefined;
  };

  const openCreate = () => {
    setEditingId(null);
    setFormData(blankRoute());
    setCreateModal(true);
  };

  const openEdit = (r: RouteItem) => {
    setEditingId(r.id);
    setFormData({
      partner_id: r.partner_id,
      name: r.name,
      from_city: r.from_city,
      to_city: r.to_city,
      distance_km: r.distance_km,
      duration_minutes: r.duration_minutes,
      base_price: r.base_price,
      stops: (r.stops || []).map((s) => ({
        id: s.id, name: s.name, address: s.address || "", stop_type: s.stop_type, time_offset_minutes: s.time_offset_minutes, extra_fee: s.extra_fee || 0,
        coords: s.lat != null && s.lng != null ? `${s.lat}, ${s.lng}` : "",
      })),
    });
    setCreateModal(true);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [resRoutes, resPartners] = await Promise.all([
        adminApi.getRoutes(),
        adminApi.getPartners(),
      ]);
      if (resRoutes.data) setRoutes(resRoutes.data);
      if (resPartners.data) setPartners(resPartners.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveRoute = async (e: React.FormEvent) => {
    e.preventDefault();
    const stops = [];
    for (const { coords, ...s } of formData.stops) {
      const geo = parseCoords(coords);
      if (geo === undefined) {
        alert(`Tọa độ của "${s.name || "điểm dừng"}" chưa đúng. Nhập dạng: 16.0544, 108.2022`);
        return;
      }
      stops.push({ ...s, lat: geo?.lat ?? null, lng: geo?.lng ?? null });
    }
    try {
      const payload = { ...formData, stops, partner_id: formData.partner_id || (partners[0]?.id ?? "") };
      if (editingId) await adminApi.updateRoute(editingId, payload);
      else await adminApi.createRoute(payload);
      setMsg(editingId ? "Đã cập nhật tuyến đường" : "Lưu tuyến đường thành công!");
      setCreateModal(false);
      loadData();
    } catch (err: any) {
      alert("Lỗi lưu tuyến đường: " + err.message);
    }
  };

  const addStopField = () => {
    setFormData({
      ...formData,
      stops: [
        ...formData.stops,
        { name: "", address: "", stop_type: "pickup", time_offset_minutes: 15, extra_fee: 0, coords: "" },
      ],
    });
  };

  const removeStopField = (idx: number) => {
    setFormData({
      ...formData,
      stops: formData.stops.filter((_, i) => i !== idx),
    });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {loading && <div className="ds-progress">Đang tải tuyến đường...</div>}
      {selectedRoute && <div className="ds-alert ds-alert-info">Đang chọn: {selectedRoute.name} <button onClick={() => setSelectedRoute(null)}>✕</button></div>}
      {msg && (
        <div className="ds-toast">
          {msg}
          <button onClick={() => setMsg("")}><X size={14} /></button>
        </div>
      )}

      {/* Toolbar */}
      <div className="ds-panel" style={{ padding: "16px 20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: "#102744" }}>
              Tuyến đường & Điểm đón / trả khách
            </h2>
            <p style={{ margin: "4px 0 0", color: "#6c809c", fontSize: 13 }}>
              Quản lý mạng lưới tuyến liên tỉnh và các điểm trung chuyển đón khách
            </p>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={loadData}
              className="ds-secondary"
              style={{ padding: "8px 14px", borderRadius: 8, fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}
            >
              <RefreshCw size={14} /> Làm mới
            </button>
            <button
              onClick={openCreate}
              className="ds-primary"
              style={{ padding: "9px 18px", borderRadius: 8, fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}
            >
              <Plus size={16} /> Thêm tuyến mới
            </button>
          </div>
        </div>
      </div>

      {/* Grid danh sách tuyến */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: 18 }}>
        {routes.map((r) => (
          <div key={r.id} className="ds-panel" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 20 }}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#1765e8", background: "#eef5ff", padding: "3px 8px", borderRadius: 4 }}>
                    {r.partner?.name || "DANAVA Go"}
                  </span>
                  <h3 style={{ fontSize: 17, fontWeight: 700, color: "#102744", margin: "8px 0 4px" }}>
                    {r.name}
                  </h3>
                  <div style={{ color: "#476282", fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
                    <Navigation size={13} color="#1765e8" />
                    <strong>{r.from_city}</strong> → <strong>{r.to_city}</strong>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 16, fontWeight: 800, color: "#16825d" }}>
                    {money(r.base_price)}
                  </div>
                  <small style={{ color: "#6c809c" }}>Giá niêm yết</small>
                </div>
              </div>

              <div style={{ display: "flex", gap: 16, fontSize: 13, color: "#6c809c", margin: "14px 0", borderTop: "1px dashed #e2e8f0", borderBottom: "1px dashed #e2e8f0", padding: "10px 0" }}>
                <div>Cự ly: <strong style={{ color: "#102744" }}>{r.distance_km} km</strong></div>
                <div>Thời gian: <strong style={{ color: "#102744" }}>{r.duration_minutes} phút</strong></div>
                <div>Số điểm đón/trả: <strong style={{ color: "#1765e8" }}>{r.stops?.length || 0} điểm</strong></div>
              </div>

              {/* Danh sách các điểm dừng */}
              {r.stops && r.stops.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 16 }}>
                  {r.stops.map((s, idx) => (
                    <div key={idx} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 12, padding: "5px 8px", background: "#f8fafd", borderRadius: 6 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <MapPin size={12} color={s.stop_type === "pickup" ? "#16825d" : "#e11d48"} />
                        <span style={{ fontWeight: 600, color: "#102744" }}>{s.name}</span>
                        {s.address && <span style={{ color: "#6c809c" }}>({s.address})</span>}
                      </div>
                      <span style={{ color: "#476282" }}>+{s.time_offset_minutes}p</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, borderTop: "1px solid #edf2f9", paddingTop: 12 }}>
              <button
                onClick={() => setSelectedRoute(r)}
                style={{ padding: "6px 12px", borderRadius: 6, border: "1px solid #dce5ef", background: "#fff", color: "#1765e8", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
              >
                Xem chi tiết
              </button>
              <button
                onClick={() => openEdit(r)}
                title="Sửa tuyến, điểm dừng và tọa độ GPS"
                style={{ padding: "6px 12px", borderRadius: 6, border: "1px solid #1765e8", background: "#eef5ff", color: "#1765e8", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
              >
                Sửa · Tọa độ GPS
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Thêm tuyến mới */}
      {createModal && (
        <div className="ds-modal-backdrop" onClick={() => setCreateModal(false)}>
          <div className="ds-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 780 }}>
            <header>
              <h2>{editingId ? "Sửa tuyến đường & tọa độ GPS" : "Thiết lập Tuyến đường & Điểm đón/trả mới"}</h2>
              <button onClick={() => setCreateModal(false)}><X size={20} /></button>
            </header>
            <form onSubmit={handleSaveRoute} style={{ padding: 24, display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ display: "block", marginBottom: 4, fontSize: 13, fontWeight: 600 }}>Tên tuyến đường:</label>
                <input
                  type="text"
                  required
                  placeholder="VD: Hà Nội ⇄ Hạ Long - Cửa Ông"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  style={{ width: "100%", padding: "8px 10px" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ display: "block", marginBottom: 4, fontSize: 13, fontWeight: 600 }}>Thành phố / Điểm đi:</label>
                  <input
                    type="text"
                    required
                    value={formData.from_city}
                    onChange={(e) => setFormData({ ...formData, from_city: e.target.value })}
                    style={{ width: "100%", padding: "8px 10px" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: 4, fontSize: 13, fontWeight: 600 }}>Thành phố / Điểm đến:</label>
                  <input
                    type="text"
                    required
                    value={formData.to_city}
                    onChange={(e) => setFormData({ ...formData, to_city: e.target.value })}
                    style={{ width: "100%", padding: "8px 10px" }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                <div>
                  <label style={{ display: "block", marginBottom: 4, fontSize: 13, fontWeight: 600 }}>Cự ly (km):</label>
                  <input
                    type="number"
                    value={formData.distance_km}
                    onChange={(e) => setFormData({ ...formData, distance_km: Number(e.target.value) })}
                    style={{ width: "100%", padding: "8px 10px" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: 4, fontSize: 13, fontWeight: 600 }}>Thời gian (phút):</label>
                  <input
                    type="number"
                    value={formData.duration_minutes}
                    onChange={(e) => setFormData({ ...formData, duration_minutes: Number(e.target.value) })}
                    style={{ width: "100%", padding: "8px 10px" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: 4, fontSize: 13, fontWeight: 600 }}>Giá vé niêm yết (đ):</label>
                  <input
                    type="number"
                    value={formData.base_price}
                    onChange={(e) => setFormData({ ...formData, base_price: Number(e.target.value) })}
                    style={{ width: "100%", padding: "8px 10px" }}
                  />
                </div>
              </div>

              {/* Danh sách điểm đón trả */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <label style={{ fontSize: 13, fontWeight: 700, color: "#102744" }}>Điểm đón & Trả dọc tuyến:</label>
                  <button
                    type="button"
                    onClick={addStopField}
                    style={{ background: "#eef5ff", border: "1px solid #cbd5e1", borderRadius: 4, padding: "3px 8px", fontSize: 12, color: "#1765e8", cursor: "pointer", fontWeight: 600 }}
                  >
                    + Thêm điểm dừng
                  </button>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 180, overflowY: "auto", paddingRight: 4 }}>
                  {formData.stops.map((s, idx) => (
                    <div key={idx} style={{ display: "grid", gridTemplateColumns: "1.3fr 1.3fr 0.9fr 0.6fr 1.4fr auto", gap: 6, alignItems: "center" }}>
                      <input
                        type="text"
                        placeholder="Tên điểm dừng"
                        value={s.name}
                        onChange={(e) => {
                          const updated = [...formData.stops];
                          updated[idx].name = e.target.value;
                          setFormData({ ...formData, stops: updated });
                        }}
                        style={{ padding: "6px 8px", fontSize: 12 }}
                      />
                      <input
                        type="text"
                        placeholder="Địa chỉ"
                        value={s.address}
                        onChange={(e) => {
                          const updated = [...formData.stops];
                          updated[idx].address = e.target.value;
                          setFormData({ ...formData, stops: updated });
                        }}
                        style={{ padding: "6px 8px", fontSize: 12 }}
                      />
                      <select
                        value={s.stop_type}
                        onChange={(e) => {
                          const updated = [...formData.stops];
                          updated[idx].stop_type = e.target.value as any;
                          setFormData({ ...formData, stops: updated });
                        }}
                        style={{ padding: "6px 8px", fontSize: 12 }}
                      >
                        <option value="pickup">Điểm đón</option>
                        <option value="dropoff">Điểm trả</option>
                        <option value="both">Cả hai</option>
                      </select>
                      <input
                        type="number"
                        placeholder="+Phút"
                        value={s.time_offset_minutes}
                        onChange={(e) => {
                          const updated = [...formData.stops];
                          updated[idx].time_offset_minutes = Number(e.target.value);
                          setFormData({ ...formData, stops: updated });
                        }}
                        style={{ padding: "6px 8px", fontSize: 12 }}
                      />
                      <input
                        type="text"
                        inputMode="decimal"
                        placeholder="Tọa độ: 16.05, 108.20"
                        title="Dán tọa độ từ Google Maps (vĩ độ, kinh độ). Dùng để kiểm tra xe đi đúng tuyến."
                        value={s.coords}
                        onChange={(e) => {
                          const updated = [...formData.stops];
                          updated[idx].coords = e.target.value;
                          setFormData({ ...formData, stops: updated });
                        }}
                        style={{ padding: "6px 8px", fontSize: 12, borderColor: parseCoords(s.coords) === undefined ? "#dc2626" : undefined }}
                      />
                      <button
                        type="button"
                        onClick={() => removeStopField(idx)}
                        style={{ border: "none", background: "none", color: "#b91c1c", cursor: "pointer" }}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))}
                </div>
                <p style={{ margin: "8px 0 0", fontSize: 12, color: "#64748b" }}>
                  Tọa độ GPS (tùy chọn): mở Google Maps, bấm giữ vào điểm đón/trả, sao chép “vĩ độ, kinh độ”. App so vị trí xe với
                  đường nối các điểm có tọa độ để cảnh báo xe đi lệch tuyến; nhập thêm điểm dọc đường (trạm dừng nghỉ) để chính xác hơn.
                </p>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 14 }}>
                <button type="button" className="ds-secondary" onClick={() => setCreateModal(false)} style={{ padding: "8px 16px" }}>Hủy</button>
                <button type="submit" className="ds-primary" style={{ padding: "8px 22px" }}>Lưu tuyến đường</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default RoutesView;

