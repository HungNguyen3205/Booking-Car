import React, { useState, useEffect } from "react";
import {
  Bus,
  Grid,
  Plus,
  X,
  Save,
} from "lucide-react";
import { adminApi, type BusVehicleItem, type PartnerItem } from "../../../services/adminApi";

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

  // Seat Matrix Editor State
  const [layoutName, setLayoutName] = useState("Limousine Skybus VIP 9 chỗ");
  const [layoutType, setLayoutType] = useState<"limousine" | "sleeper" | "seating">("limousine");
  const [floors, setFloors] = useState<number>(1);
  const [rows] = useState<number>(4);
  const [cols, setCols] = useState<number>(3);
  const [activeFloor, setActiveFloor] = useState<number>(1);

  // Matrix data structure: { floor_1: [[cell, cell, cell], ...], floor_2: [...] }
  const [matrixData, setMatrixData] = useState<{
    floor_1: any[][];
    floor_2?: any[][];
  }>({
    floor_1: [
      [
        { code: "D0", label: "Tài xế", type: "driver", is_seat: false },
        { code: null, label: "", type: "aisle", is_seat: false },
        { code: "A01", label: "A01", type: "front", is_seat: true },
      ],
      [
        { code: "VIP-01", label: "VIP 1", type: "vip", is_seat: true },
        { code: null, label: "", type: "aisle", is_seat: false },
        { code: "VIP-02", label: "VIP 2", type: "vip", is_seat: true },
      ],
      [
        { code: "VIP-03", label: "VIP 3", type: "vip", is_seat: true },
        { code: null, label: "", type: "aisle", is_seat: false },
        { code: "VIP-04", label: "VIP 4", type: "vip", is_seat: true },
      ],
      [
        { code: "B01", label: "B01", type: "standard", is_seat: true },
        { code: "B02", label: "B02", type: "standard", is_seat: true },
        { code: "B03", label: "B03", type: "standard", is_seat: true },
      ],
    ],
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [resVehicles, resPartners] = await Promise.all([
        adminApi.getVehicles(),
        adminApi.getPartners(),
      ]);
      if (resVehicles.data) setVehicles(resVehicles.data);
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

  const handleCellClick = (floorKey: "floor_1" | "floor_2", rIdx: number, cIdx: number) => {
    const current = matrixData[floorKey]?.[rIdx]?.[cIdx];
    if (!current) return;

    // Toggle cycle: standard -> vip -> cabin -> aisle -> standard
    let nextType = "vip";
    let isSeat = true;
    if (current.type === "driver") return; // Keep driver fixed
    if (current.type === "vip") nextType = "standard";
    else if (current.type === "standard") nextType = "cabin";
    else if (current.type === "cabin") {
      nextType = "aisle";
      isSeat = false;
    } else {
      nextType = "vip";
      isSeat = true;
    }

    const targetFloor = matrixData[floorKey];
    if (!targetFloor) return;

    const updatedFloor = targetFloor.map((row, r) =>
      row.map((cell, c) => {
        if (r === rIdx && c === cIdx) {
          return {
            ...cell,
            type: nextType,
            is_seat: isSeat,
            label: nextType === "aisle" ? "" : cell.label || cell.code,
          };
        }
        return cell;
      })
    );

    setMatrixData({
      ...matrixData,
      [floorKey]: updatedFloor,
    });
  };

  const handleSaveLayout = async () => {
    try {
      // Calculate total seats
      let total = 0;
      matrixData.floor_1.forEach((row) => row.forEach((cell) => cell.is_seat && total++));
      if (matrixData.floor_2) {
        matrixData.floor_2.forEach((row) => row.forEach((cell) => cell.is_seat && total++));
      }

      await adminApi.saveSeatLayout({
        name: layoutName,
        vehicle_type: layoutType,
        total_seats: total,
        floors: floors,
        rows: rows,
        columns: cols,
        layout_matrix: matrixData,
      });

      setMsg("Lưu cấu hình sơ đồ ma trận ghế thành công!");
      loadData();
    } catch (err: any) {
      alert("Lỗi lưu sơ đồ ghế: " + err.message);
    }
  };

  const currentFloorKey = activeFloor === 2 ? "floor_2" : "floor_1";
  const currentGrid = matrixData[currentFloorKey] || matrixData.floor_1;

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
            <Grid size={16} /> Thiết lập Ma trận Sơ đồ ghế
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
                  <div>Loại: <strong style={{ color: "#102744" }}>{v.category === "limousine" ? "Limousine VIP" : v.category === "sleeper" ? "Giường nằm" : "Ghế ngồi"}</strong></div>
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
                  onClick={() => setActiveTab("layout")}
                  style={{ background: "none", border: "none", color: "#1765e8", fontWeight: 600, cursor: "pointer" }}
                >
                  Xem ma trận ghế →
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Tab 2: Thiết lập Layout Ma trận Sơ đồ ghế */
        <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 24 }}>
          {/* Cột trái: Cấu hình ma trận */}
          <div className="ds-panel" style={{ padding: 22, display: "flex", flexDirection: "column", gap: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: "#102744" }}>
              Thông số ma trận sơ đồ
            </h3>

            <div>
              <label style={{ display: "block", marginBottom: 4, fontSize: 12, fontWeight: 600, color: "#476282" }}>Tên sơ đồ ghế:</label>
              <input
                type="text"
                value={layoutName}
                onChange={(e) => setLayoutName(e.target.value)}
                style={{ width: "100%", padding: "8px 10px", fontSize: 13 }}
              />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: 4, fontSize: 12, fontWeight: 600, color: "#476282" }}>Loại phương tiện:</label>
              <select
                value={layoutType}
                onChange={(e) => setLayoutType(e.target.value as any)}
                style={{ width: "100%", padding: "8px 10px", fontSize: 13 }}
              >
                <option value="limousine">Limousine VIP (DCar, Skybus)</option>
                <option value="sleeper">Giường nằm / Cabin 2 tầng</option>
                <option value="seating">Xe ghế ngồi thông thường</option>
              </select>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <label style={{ display: "block", marginBottom: 4, fontSize: 12, fontWeight: 600, color: "#476282" }}>Số tầng:</label>
                <select
                  value={floors}
                  onChange={(e) => {
                    const f = Number(e.target.value);
                    setFloors(f);
                    if (f === 1) setActiveFloor(1);
                  }}
                  style={{ width: "100%", padding: "8px 10px", fontSize: 13 }}
                >
                  <option value={1}>1 Tầng</option>
                  <option value={2}>2 Tầng</option>
                </select>
              </div>
              <div>
                <label style={{ display: "block", marginBottom: 4, fontSize: 12, fontWeight: 600, color: "#476282" }}>Số cột:</label>
                <input
                  type="number"
                  min={2}
                  max={5}
                  value={cols}
                  onChange={(e) => setCols(Number(e.target.value))}
                  style={{ width: "100%", padding: "8px 10px", fontSize: 13 }}
                />
              </div>
            </div>

            {floors === 2 && (
              <div style={{ display: "flex", gap: 6, background: "#f1f5f9", padding: 4, borderRadius: 8 }}>
                <button
                  type="button"
                  onClick={() => setActiveFloor(1)}
                  style={{ flex: 1, padding: "6px", border: "none", borderRadius: 6, fontWeight: 600, fontSize: 12, cursor: "pointer", background: activeFloor === 1 ? "#1765e8" : "transparent", color: activeFloor === 1 ? "#fff" : "#476282" }}
                >
                  Tầng 1 (Dưới)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFloor(2)}
                  style={{ flex: 1, padding: "6px", border: "none", borderRadius: 6, fontWeight: 600, fontSize: 12, cursor: "pointer", background: activeFloor === 2 ? "#1765e8" : "transparent", color: activeFloor === 2 ? "#fff" : "#476282" }}
                >
                  Tầng 2 (Trên)
                </button>
              </div>
            )}

            {/* Chú thích màu sắc */}
            <div style={{ borderTop: "1px solid #edf2f9", paddingTop: 14, fontSize: 12, display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ fontWeight: 600, color: "#102744" }}>Hướng dẫn tùy chỉnh:</div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 14, height: 14, borderRadius: 4, background: "#1765e8" }} />
                <span>Ghế VIP ngả điện</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 14, height: 14, borderRadius: 4, background: "#16825d" }} />
                <span>Ghế tiêu chuẩn / Ghế đầu</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 14, height: 14, borderRadius: 4, background: "#7750bb" }} />
                <span>Cabin VIP riêng tư</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 14, height: 14, borderRadius: 4, background: "#e2e8f0" }} />
                <span>Lối đi (Không phải ghế)</span>
              </div>
              <small style={{ color: "#6c809c", marginTop: 4 }}>
                * Click trực tiếp vào ô ghế để đổi loại ghế hoặc tạo lối đi.
              </small>
            </div>

            <button
              onClick={handleSaveLayout}
              className="ds-primary"
              style={{ marginTop: 8, padding: "10px", borderRadius: 8, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, cursor: "pointer" }}
            >
              <Save size={16} /> Lưu cấu hình sơ đồ
            </button>
          </div>

          {/* Cột phải: Bảng Ma trận trực quan sàn xe */}
          <div className="ds-panel" style={{ padding: 24, display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{ marginBottom: 18, textAlign: "center" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#1765e8", letterSpacing: 1.5 }}>
                MÔ PHỎNG SÀN XE KHÁCH · {floors === 2 ? `TẦNG ${activeFloor}` : "1 TẦNG"}
              </div>
              <h2 style={{ fontSize: 20, margin: "4px 0 0", color: "#102744" }}>{layoutName}</h2>
            </div>

            {/* Khung sàn xe */}
            <div
              style={{
                width: "100%",
                maxWidth: 460,
                background: "linear-gradient(180deg, #f8fafd 0%, #edf4fc 100%)",
                border: "2px solid #cbd5e1",
                borderRadius: "32px 32px 16px 16px",
                padding: "30px 24px 20px",
                boxShadow: "0 10px 30px rgba(16, 39, 68, 0.08)",
                position: "relative",
              }}
            >
              {/* Kính trước xe */}
              <div
                style={{
                  position: "absolute",
                  top: 8,
                  left: "20%",
                  right: "20%",
                  height: 6,
                  background: "#94a3b8",
                  borderRadius: 3,
                }}
              />

              {/* Lưới Ma trận */}
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {currentGrid.map((row, rIdx) => (
                  <div key={rIdx} style={{ display: "grid", gridTemplateColumns: `repeat(${row.length}, 1fr)`, gap: 12 }}>
                    {row.map((cell, cIdx) => {
                      const isDriver = cell.type === "driver";
                      const isAisle = cell.type === "aisle";
                      const isVip = cell.type === "vip";
                      const isCabin = cell.type === "cabin";
                      const isSeat = cell.is_seat;

                      return (
                        <div
                          key={cIdx}
                          onClick={() => handleCellClick(currentFloorKey, rIdx, cIdx)}
                          style={{
                            height: 60,
                            borderRadius: 10,
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: isDriver ? "default" : "pointer",
                            transition: "all .15s ease",
                            border: isAisle
                              ? "1px dashed #cbd5e1"
                              : isDriver
                                ? "1px solid #94a3b8"
                                : "1px solid transparent",
                            background: isAisle
                              ? "transparent"
                              : isDriver
                                ? "#e2e8f0"
                                : isVip
                                  ? "#1765e8"
                                  : isCabin
                                    ? "#7750bb"
                                    : "#16825d",
                            color: isAisle ? "#94a3b8" : isDriver ? "#475569" : "#ffffff",
                            boxShadow: isSeat ? "0 4px 10px rgba(0,0,0,0.12)" : "none",
                          }}
                        >
                          {isAisle ? (
                            <span style={{ fontSize: 11 }}>Lối đi</span>
                          ) : (
                            <>
                              <span style={{ fontWeight: 800, fontSize: 14 }}>{cell.label || cell.code}</span>
                              <small style={{ fontSize: 9, opacity: 0.9 }}>
                                {isDriver ? "Bác tài" : isVip ? "VIP" : isCabin ? "Cabin" : "Thường"}
                              </small>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>

              {/* Đuôi xe */}
              <div style={{ marginTop: 24, textAlign: "center", fontSize: 11, color: "#94a3b8", borderTop: "1px dashed #cbd5e1", paddingTop: 8 }}>
                Hàng ghế cuối xe
              </div>
            </div>
          </div>
        </div>
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
