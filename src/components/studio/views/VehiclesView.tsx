import React, { useState, useEffect } from "react";
import {
  Bus,
  Grid,
  Plus,
  X,
} from "lucide-react";
import { adminApi, type BusVehicleItem, type PartnerItem } from "../../../services/adminApi";
import { SeatMapEditor } from "./SeatMapEditor";

export const VehiclesView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"vehicles" | "layout">("vehicles");
  const [vehicles, setVehicles] = useState<BusVehicleItem[]>([]);
  const [partners, setPartners] = useState<PartnerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  // Vehicle form modal
  const [vehicleModal, setVehicleModal] = useState(false);
  const [newVehicle, setNewVehicle] = useState({
    partner_id: "",
    name: "",
    plate_number: "",
    category: "limousine" as const,
    capacity: 9,
    floor_count: 1,
    inspection_date: "2027-12-31",
    amenities: "WiFi 5G, Ghế massage, Màn hình giải trí, Cổng sạc USB, Nước lạnh",
  });

  // Vehicle opened in the seat-map editor tab.
  const [editId, setEditId] = useState<string | undefined>();

  const loadData = async () => {
    try {
      setLoading(true);
      const [resVehicles, resPartners] = await Promise.all([
        adminApi.getVehicles(),
        adminApi.getPartners(),
      ]);
      if (resVehicles.data) setVehicles(resVehicles.data);
      if (resPartners.data) {
        setPartners(resPartners.data);
        if (resPartners.data.length === 1) setNewVehicle((f) => ({ ...f, partner_id: f.partner_id || resPartners.data[0].id }));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const amenitiesArr = newVehicle.amenities.split(",").map((s) => s.trim()).filter(Boolean);
      await adminApi.createVehicle({
        partner_id: newVehicle.partner_id || (partners[0]?.id ?? ""),
        name: newVehicle.name,
        plate_number: newVehicle.plate_number,
        category: newVehicle.category,
        capacity: Number(newVehicle.capacity),
        floor_count: Number(newVehicle.floor_count),
        amenities: amenitiesArr,
        inspection_date: newVehicle.inspection_date,
        status: "active",
      });
      setMsg("Thêm xe mới thành công!");
      setVehicleModal(false);
      loadData();
    } catch (err: any) {
      alert("Lỗi thêm xe: " + err.message);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {loading && <div className="ds-progress">Đang tải danh sách phương tiện...</div>}
      {msg && (
        <div className="ds-toast">
          {msg}
          <button onClick={() => setMsg("")}><X size={14} /></button>
        </div>
      )}

      {/* Tabs Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #dce5ef", paddingBottom: 12 }}>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={() => setActiveTab("vehicles")}
            style={{
              padding: "8px 18px",
              borderRadius: 8,
              border: "none",
              fontWeight: 700,
              fontSize: 14,
              cursor: "pointer",
              background: activeTab === "vehicles" ? "#1765e8" : "transparent",
              color: activeTab === "vehicles" ? "#fff" : "#476282",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <Bus size={16} /> Danh sách đội xe ({vehicles.length})
          </button>
          <button
            onClick={() => setActiveTab("layout")}
            style={{
              padding: "8px 18px",
              borderRadius: 8,
              border: "none",
              fontWeight: 700,
              fontSize: 14,
              cursor: "pointer",
              background: activeTab === "layout" ? "#1765e8" : "transparent",
              color: activeTab === "layout" ? "#fff" : "#476282",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <Grid size={16} /> Sơ đồ ghế & giá theo chỗ
          </button>
        </div>

        {activeTab === "vehicles" && (
          <button
            onClick={() => setVehicleModal(true)}
            className="ds-primary"
            style={{ padding: "8px 16px", borderRadius: 8, fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}
          >
            <Plus size={16} /> Thêm phương tiện mới
          </button>
        )}
      </div>

      {activeTab === "vehicles" ? (
        /* Tab 1: Danh sách Đội xe */
        <div className="ds-fleet-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 20 }}>
          {vehicles.map((v) => (
            <div key={v.id} className="ds-vehicle-card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 20, borderRadius: 14 }}>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                  <div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#1765e8", background: "#eef5ff", padding: "2px 8px", borderRadius: 4 }}>
                      {v.partner?.name || "DANAVA Go"}
                    </span>
                    <h3 style={{ fontSize: 18, fontWeight: 700, color: "#102744", margin: "6px 0 2px" }}>{v.name}</h3>
                    <div style={{ fontWeight: 800, fontSize: 15, color: "#16825d" }}>{v.plate_number}</div>
                  </div>
                  <span className={`ds-badge ${v.status === "active" ? "active" : "unpaid"}`} style={{ fontSize: 11 }}>
                    {v.status === "active" ? "Đang chạy" : "Bảo dưỡng"}
                  </span>
                </div>

                <div style={{ display: "flex", gap: 14, fontSize: 13, color: "#476282", margin: "12px 0", background: "#f8fafd", padding: "10px 12px", borderRadius: 8 }}>
                  <div>Loại: <strong style={{ color: "#102744" }}>{v.category === "limousine" ? "Limousine VIP" : v.category === "sleeper" ? "Giường nằm" : v.category === "cabin" ? "Cabin VIP" : "Ghế ngồi"}</strong></div>
                  <div>Sức chứa: <strong style={{ color: "#1765e8" }}>{v.capacity} chỗ</strong></div>
                  <div>Số tầng: <strong style={{ color: "#102744" }}>{v.floor_count} tầng</strong></div>
                </div>

                {v.amenities && v.amenities.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, margin: "10px 0" }}>
                    {v.amenities.map((am, i) => (
                      <span key={i} style={{ background: "#f1f5f9", color: "#334155", fontSize: 11, padding: "2px 8px", borderRadius: 4 }}>
                        ✓ {am}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #edf2f9", paddingTop: 12, marginTop: 12, fontSize: 12, color: "#6c809c" }}>
                <span>Hạn đăng kiểm: <strong>{v.inspection_date || "2027-12-31"}</strong></span>
                <button
                  onClick={() => {
                    setEditId(v.id);
                    setActiveTab("layout");
                  }}
                  style={{ background: "none", border: "none", color: "#1765e8", fontWeight: 600, cursor: "pointer" }}
                >
                  Sửa sơ đồ ghế →
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <SeatMapEditor vehicles={vehicles} vehicleId={editId} onSaved={loadData} />
      )}

      {/* Modal Thêm xe mới */}
      {vehicleModal && (
        <div className="ds-modal-backdrop" onClick={() => setVehicleModal(false)}>
          <div className="ds-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520 }}>
            <header>
              <h2>Thêm phương tiện xe mới</h2>
              <button onClick={() => setVehicleModal(false)}><X size={20} /></button>
            </header>
            <form onSubmit={handleCreateVehicle} style={{ padding: 24, display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ display: "block", marginBottom: 4, fontSize: 13, fontWeight: 600 }}>Nhà xe sở hữu:</label>
                <select
                  value={newVehicle.partner_id}
                  onChange={(e) => setNewVehicle({ ...newVehicle, partner_id: e.target.value })}
                  required
                  style={{ width: "100%", padding: "8px 10px" }}
                >
                  <option value="">Chọn nhà xe</option>
                  {partners.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ display: "block", marginBottom: 4, fontSize: 13, fontWeight: 600 }}>Tên xe:</label>
                  <input
                    type="text"
                    required
                    placeholder="VD: Skybus DCar VIP"
                    value={newVehicle.name}
                    onChange={(e) => setNewVehicle({ ...newVehicle, name: e.target.value })}
                    style={{ width: "100%", padding: "8px 10px" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: 4, fontSize: 13, fontWeight: 600 }}>Biển số xe:</label>
                  <input
                    type="text"
                    required
                    placeholder="VD: 14B-035.88"
                    value={newVehicle.plate_number}
                    onChange={(e) => setNewVehicle({ ...newVehicle, plate_number: e.target.value })}
                    style={{ width: "100%", padding: "8px 10px" }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                <div>
                  <label style={{ display: "block", marginBottom: 4, fontSize: 13, fontWeight: 600 }}>Phân loại:</label>
                  <select
                    value={newVehicle.category}
                    onChange={(e) => setNewVehicle({ ...newVehicle, category: e.target.value as any })}
                    style={{ width: "100%", padding: "8px 10px" }}
                  >
                    <option value="limousine">Limousine</option>
                    <option value="sleeper">Giường nằm</option>
                    <option value="seating">Ghế ngồi</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: 4, fontSize: 13, fontWeight: 600 }}>Số chỗ:</label>
                  <input
                    type="number"
                    value={newVehicle.capacity}
                    onChange={(e) => setNewVehicle({ ...newVehicle, capacity: Number(e.target.value) })}
                    style={{ width: "100%", padding: "8px 10px" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: 4, fontSize: 13, fontWeight: 600 }}>Số tầng:</label>
                  <input
                    type="number"
                    min={1}
                    max={2}
                    value={newVehicle.floor_count}
                    onChange={(e) => setNewVehicle({ ...newVehicle, floor_count: Number(e.target.value) })}
                    style={{ width: "100%", padding: "8px 10px" }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: "block", marginBottom: 4, fontSize: 13, fontWeight: 600 }}>Tiện ích trên xe (phân tách dấu phẩy):</label>
                <input
                  type="text"
                  value={newVehicle.amenities}
                  onChange={(e) => setNewVehicle({ ...newVehicle, amenities: e.target.value })}
                  style={{ width: "100%", padding: "8px 10px" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 12 }}>
                <button type="button" className="ds-secondary" onClick={() => setVehicleModal(false)} style={{ padding: "8px 16px" }}>Hủy</button>
                <button type="submit" className="ds-primary" style={{ padding: "8px 22px" }}>Thêm xe</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default VehiclesView;
