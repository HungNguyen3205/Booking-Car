import React, { useState, useEffect } from "react";
import {
  Users,
  Search,
  RefreshCw,
  X,
} from "lucide-react";
import { adminApi, type PassengerItem } from "../../../services/adminApi";
import { money, formatDate } from "../studioConfig";

export const PassengersView: React.FC = () => {
  const [passengers, setPassengers] = useState<PassengerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPassenger, setSelectedPassenger] = useState<any | null>(null);
  const [newNote, setNewNote] = useState("");
  const [msg, setMsg] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await adminApi.getPassengers(searchTerm);
      if (res.data?.data) {
        setPassengers(res.data.data);
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

  const handleOpenDetail = async (phone: string) => {
    try {
      const res = await adminApi.getPassengerDetail(phone);
      if (res.status === 1) {
        setSelectedPassenger(res.data);
      }
    } catch (err: any) {
      alert("Lỗi tải thông tin hành khách: " + err.message);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPassenger || !newNote.trim()) return;
    try {
      await adminApi.addPassengerNote(selectedPassenger.phone, {
        note: newNote,
        customer_name: selectedPassenger.name,
      });
      setMsg("Đã lưu ghi chú chăm sóc khách hàng!");
      setNewNote("");
      handleOpenDetail(selectedPassenger.phone);
    } catch (err: any) {
      alert("Lỗi lưu ghi chú: " + err.message);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {loading && <div className="ds-progress">Đang tải hành khách...</div>}
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
              Danh bạ hành khách & Lịch sử đặt vé (CRM)
            </h2>
            <p style={{ margin: "4px 0 0", color: "#6c809c", fontSize: 13 }}>
              Hồ sơ khách hàng, tần suất đặt chuyến và ghi chú chăm sóc
            </p>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#f8fafd", padding: "6px 12px", borderRadius: 8, border: "1px solid #d8e2ed" }}>
              <Search size={14} color="#6c809c" />
              <input
                type="text"
                placeholder="Tìm theo Tên hoặc Số điện thoại..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && loadData()}
                style={{ border: "none", background: "none", fontSize: 13, outline: "none", width: 220 }}
              />
            </div>
            <button
              onClick={loadData}
              className="ds-secondary"
              style={{ padding: "8px 14px", borderRadius: 8, fontSize: 13, display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}
            >
              <RefreshCw size={14} /> Tìm kiếm
            </button>
          </div>
        </div>
      </div>

      {/* Bảng danh bạ hành khách */}
      <div className="ds-panel" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#f8fafd", borderBottom: "1px solid #e2eaf4" }}>
                <th style={{ padding: "12px 16px", textAlign: "left" }}>Hành khách</th>
                <th style={{ padding: "12px 16px", textAlign: "left" }}>Số điện thoại</th>
                <th style={{ padding: "12px 16px", textAlign: "left" }}>Email</th>
                <th style={{ padding: "12px 16px", textAlign: "center" }}>Số đơn đặt</th>
                <th style={{ padding: "12px 16px", textAlign: "center" }}>Số vé đã đi</th>
                <th style={{ padding: "12px 16px", textAlign: "right" }}>Tổng chi tiêu</th>
                <th style={{ padding: "12px 16px", textAlign: "center" }}>Chuyến gần nhất</th>
                <th style={{ padding: "12px 16px", textAlign: "center" }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {passengers.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: 40, textAlign: "center", color: "#6c809c" }}>
                    <Users size={32} style={{ margin: "0 auto 8px", display: "block", color: "#a5b4fc" }} />
                    Chưa có thông tin hành khách nào được ghi nhận.
                  </td>
                </tr>
              ) : (
                passengers.map((p, idx) => (
                  <tr key={idx} style={{ borderBottom: "1px solid #edf2f9" }}>
                    <td style={{ padding: "14px 16px" }}>
                      <strong style={{ color: "#102744", fontSize: 14 }}>{p.customer_name}</strong>
                    </td>
                    <td style={{ padding: "14px 16px", color: "#1765e8", fontWeight: 600 }}>
                      {p.customer_phone}
                    </td>
                    <td style={{ padding: "14px 16px", color: "#6c809c" }}>
                      {p.customer_email || "—"}
                    </td>
                    <td style={{ padding: "14px 16px", textAlign: "center", fontWeight: 600 }}>
                      {p.total_bookings} đơn
                    </td>
                    <td style={{ padding: "14px 16px", textAlign: "center", fontWeight: 700, color: "#16825d" }}>
                      {p.total_tickets} vé
                    </td>
                    <td style={{ padding: "14px 16px", textAlign: "right", fontWeight: 700, color: "#102744" }}>
                      {money(p.total_spent)}
                    </td>
                    <td style={{ padding: "14px 16px", textAlign: "center", fontSize: 12, color: "#6c809c" }}>
                      {p.last_booking_at ? formatDate(p.last_booking_at) : "—"}
                    </td>
                    <td style={{ padding: "14px 16px", textAlign: "center" }}>
                      <button
                        onClick={() => handleOpenDetail(p.customer_phone)}
                        style={{
                          background: "#eef5ff",
                          border: "1px solid #dce5ef",
                          color: "#1765e8",
                          padding: "5px 12px",
                          borderRadius: 6,
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        Lịch sử & CRM
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Chi tiết lịch sử & CRM hành khách */}
      {selectedPassenger && (
        <div className="ds-modal-backdrop" onClick={() => setSelectedPassenger(null)}>
          <div className="ds-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 700 }}>
            <header>
              <h2>Hồ sơ khách hàng: {selectedPassenger.name} ({selectedPassenger.phone})</h2>
              <button onClick={() => setSelectedPassenger(null)}><X size={20} /></button>
            </header>
            <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 18 }}>
              {/* Thống kê nhanh */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, background: "#f8fafd", padding: 14, borderRadius: 8 }}>
                <div>
                  <small style={{ color: "#6c809c" }}>Tổng số đơn:</small>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "#102744" }}>{selectedPassenger.total_bookings} đơn</div>
                </div>
                <div>
                  <small style={{ color: "#6c809c" }}>Tổng vé đã đi:</small>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "#16825d" }}>{selectedPassenger.total_tickets} vé</div>
                </div>
                <div>
                  <small style={{ color: "#6c809c" }}>Tổng chi tiêu:</small>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "#1765e8" }}>{money(selectedPassenger.total_spent)}</div>
                </div>
              </div>

              {/* Lịch sử đặt vé */}
              <div>
                <h4 style={{ margin: "0 0 10px", fontSize: 14, fontWeight: 700, color: "#102744" }}>
                  Lịch sử các chuyến đi ({selectedPassenger.bookings?.length || 0})
                </h4>
                <div style={{ maxHeight: 180, overflowY: "auto", border: "1px solid #e2e8f0", borderRadius: 8 }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                    <thead>
                      <tr style={{ background: "#f1f5f9" }}>
                        <th style={{ padding: "8px 10px", textAlign: "left" }}>Mã vé</th>
                        <th style={{ padding: "8px 10px", textAlign: "left" }}>Tuyến đường</th>
                        <th style={{ padding: "8px 10px", textAlign: "center" }}>Ghế</th>
                        <th style={{ padding: "8px 10px", textAlign: "right" }}>Số tiền</th>
                        <th style={{ padding: "8px 10px", textAlign: "center" }}>Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(selectedPassenger.bookings || []).map((b: any) => (
                        <tr key={b.id} style={{ borderBottom: "1px solid #edf2f9" }}>
                          <td style={{ padding: "8px 10px", fontWeight: 700, color: "#1e3a8a" }}>{b.booking_code}</td>
                          <td style={{ padding: "8px 10px" }}>{b.trip?.route?.name || "Tuyến cố định"}</td>
                          <td style={{ padding: "8px 10px", textAlign: "center" }}>{(b.seats || []).join(", ")}</td>
                          <td style={{ padding: "8px 10px", textAlign: "right", fontWeight: 600 }}>{money(b.final_amount)}</td>
                          <td style={{ padding: "8px 10px", textAlign: "center" }}>
                            <span className={`ds-badge ${b.payment_status === "paid" ? "paid" : "unpaid"}`} style={{ fontSize: 10 }}>
                              {b.payment_status === "paid" ? "Đã thanh toán" : "Chưa trả"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Ghi chú CRM */}
              <div>
                <h4 style={{ margin: "0 0 10px", fontSize: 14, fontWeight: 700, color: "#102744" }}>
                  Ghi chú chăm sóc khách hàng
                </h4>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 120, overflowY: "auto", marginBottom: 12 }}>
                  {(selectedPassenger.notes || []).length === 0 ? (
                    <div style={{ color: "#6c809c", fontSize: 13, fontStyle: "italic" }}>Chưa có ghi chú nào.</div>
                  ) : (
                    selectedPassenger.notes.map((n: any) => (
                      <div key={n.id} style={{ background: "#f8fafd", padding: "8px 12px", borderRadius: 6, fontSize: 13, borderLeft: "3px solid #1765e8" }}>
                        <div>{n.note}</div>
                        <small style={{ color: "#6c809c", fontSize: 11 }}>{n.admin_name} · {formatDate(n.created_at)}</small>
                      </div>
                    ))
                  )}
                </div>

                <form onSubmit={handleAddNote} style={{ display: "flex", gap: 10 }}>
                  <input
                    type="text"
                    required
                    placeholder="Nhập ghi chú chăm sóc khách hàng..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    style={{ flex: 1, padding: "8px 12px", fontSize: 13 }}
                  />
                  <button type="submit" className="ds-primary" style={{ padding: "8px 16px", fontSize: 13 }}>Lưu ghi chú</button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default PassengersView;

