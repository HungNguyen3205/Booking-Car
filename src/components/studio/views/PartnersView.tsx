import React, { useState, useEffect } from "react";
import {
  Plus,
  RefreshCw,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  X,
} from "lucide-react";
import { adminApi, type PartnerItem } from "../../../services/adminApi";

export const PartnersView: React.FC = () => {
  const [partners, setPartners] = useState<PartnerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [createModal, setCreateModal] = useState(false);
  const [editPartner, setEditPartner] = useState<PartnerItem | null>(null);
  const [msg, setMsg] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    phone: "",
    email: "",
    address: "",
    commission_rate: 10,
    contract_number: "",
    bank_name: "Techcombank",
    bank_account: "",
    bank_holder: "",
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await adminApi.getPartners();
      if (res.data) setPartners(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSavePartner = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editPartner) {
        await adminApi.updatePartner(editPartner.id, formData);
        setMsg("Đã cập nhật thông tin đối tác!");
      } else {
        await adminApi.createPartner(formData);
        setMsg("Đã thêm đối tác nhà xe mới!");
      }
      setCreateModal(false);
      setEditPartner(null);
      loadData();
    } catch (err: any) {
      alert("Lỗi lưu đối tác: " + err.message);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {loading && <div className="ds-progress">Đang tải đối tác...</div>}
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
              Đối tác nhà xe liên kết
            </h2>
            <p style={{ margin: "4px 0 0", color: "#6c809c", fontSize: 13 }}>
              Quản lý hợp đồng, tỷ lệ hoa hồng chiết khấu sàn và tài khoản đối soát
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
              onClick={() => {
                setEditPartner(null);
                setFormData({
                  name: "",
                  slug: "",
                  phone: "",
                  email: "",
                  address: "",
                  commission_rate: 10,
                  contract_number: "",
                  bank_name: "Vietcombank",
                  bank_account: "",
                  bank_holder: "",
                });
                setCreateModal(true);
              }}
              className="ds-primary"
              style={{ padding: "9px 18px", borderRadius: 8, fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}
            >
              <Plus size={16} /> Thêm nhà xe đối tác
            </button>
          </div>
        </div>
      </div>

      {/* Grid danh sách đối tác */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))", gap: 20 }}>
        {partners.map((p) => (
          <div key={p.id} className="ds-panel" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 22 }}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <div>
                  <span className={`ds-badge ${p.status === "active" ? "active" : "unpaid"}`} style={{ fontSize: 11 }}>
                    {p.status === "active" ? "Đang liên kết" : "Tạm dừng"}
                  </span>
                  <h3 style={{ fontSize: 19, fontWeight: 700, color: "#102744", margin: "6px 0 2px" }}>{p.name}</h3>
                  <div style={{ color: "#6c809c", fontSize: 12 }}>HĐ: <strong>{p.contract_number || "HD-2026/PARTNER"}</strong></div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 16, fontWeight: 800, color: "#1765e8" }}>
                    {p.commission_rate}%
                  </div>
                  <small style={{ color: "#6c809c" }}>Hoa hồng sàn</small>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13, color: "#476282", margin: "14px 0", background: "#f8fafd", padding: "12px 14px", borderRadius: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Phone size={14} color="#1765e8" /> <strong>{p.phone}</strong>
                </div>
                {p.email && (
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Mail size={14} color="#16825d" /> <span>{p.email}</span>
                  </div>
                )}
                {p.address && (
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <MapPin size={14} color="#e11d48" /> <span>{p.address}</span>
                  </div>
                )}
              </div>

              {p.bank_account && (
                <div style={{ borderTop: "1px dashed #e2e8f0", paddingTop: 10, fontSize: 12, color: "#476282" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 600, color: "#102744" }}>
                    <CreditCard size={14} color="#16825d" />
                    Tài khoản chi trả: {p.bank_name} - {p.bank_account}
                  </div>
                  <div style={{ color: "#6c809c", marginLeft: 20 }}>Chủ TK: {p.bank_holder}</div>
                </div>
              )}
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #edf2f9", paddingTop: 12, marginTop: 14 }}>
              <div style={{ fontSize: 12, color: "#6c809c" }}>
                Số chuyến: <strong style={{ color: "#102744" }}>{p.trips_count || 0}</strong> · Vé: <strong style={{ color: "#16825d" }}>{p.tickets_sold || 0}</strong>
              </div>
              <button
                onClick={() => {
                  setEditPartner(p);
                  setFormData({
                    name: p.name,
                    slug: p.slug,
                    phone: p.phone,
                    email: p.email || "",
                    address: p.address || "",
                    commission_rate: p.commission_rate,
                    contract_number: p.contract_number || "",
                    bank_name: p.bank_name || "Vietcombank",
                    bank_account: p.bank_account || "",
                    bank_holder: p.bank_holder || "",
                  });
                  setCreateModal(true);
                }}
                style={{ padding: "6px 12px", borderRadius: 6, border: "1px solid #dce5ef", background: "#fff", color: "#1765e8", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
              >
                Chỉnh sửa
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Thêm/Sửa Đối tác */}
      {createModal && (
        <div className="ds-modal-backdrop" onClick={() => setCreateModal(false)}>
          <div className="ds-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 560 }}>
            <header>
              <h2>{editPartner ? `Chỉnh sửa: ${editPartner.name}` : "Thêm mới đối tác nhà xe"}</h2>
              <button onClick={() => setCreateModal(false)}><X size={20} /></button>
            </header>
            <form onSubmit={handleSavePartner} style={{ padding: 24, display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ display: "block", marginBottom: 4, fontSize: 13, fontWeight: 600 }}>Tên nhà xe / Doanh nghiệp:</label>
                  <input
                    type="text"
                    required
                    placeholder="VD: Cửa Ông Limousine"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    style={{ width: "100%", padding: "8px 10px" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: 4, fontSize: 13, fontWeight: 600 }}>Hoa hồng sàn (%):</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    required
                    value={formData.commission_rate}
                    onChange={(e) => setFormData({ ...formData, commission_rate: Number(e.target.value) })}
                    style={{ width: "100%", padding: "8px 10px" }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ display: "block", marginBottom: 4, fontSize: 13, fontWeight: 600 }}>Hotline:</label>
                  <input
                    type="tel"
                    required
                    placeholder="09..."
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    style={{ width: "100%", padding: "8px 10px" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: 4, fontSize: 13, fontWeight: 600 }}>Email liên hệ:</label>
                  <input
                    type="email"
                    placeholder="info@..."
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    style={{ width: "100%", padding: "8px 10px" }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: "block", marginBottom: 4, fontSize: 13, fontWeight: 600 }}>Địa chỉ văn phòng đại diện:</label>
                <input
                  type="text"
                  placeholder="Địa chỉ trụ sở..."
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  style={{ width: "100%", padding: "8px 10px" }}
                />
              </div>

              {/* Thông tin ngân hàng đối soát */}
              <div style={{ background: "#f8fafd", padding: 12, borderRadius: 8, border: "1px solid #e2eaf4" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#102744", marginBottom: 8 }}>Thông tin tài khoản nhận tiền đối soát:</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 8 }}>
                  <div>
                    <label style={{ display: "block", marginBottom: 2, fontSize: 11, color: "#6c809c" }}>Ngân hàng:</label>
                    <input
                      type="text"
                      placeholder="Techcombank, Vietcombank..."
                      value={formData.bank_name}
                      onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                      style={{ width: "100%", padding: "6px 8px", fontSize: 12 }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: 2, fontSize: 11, color: "#6c809c" }}>Số tài khoản:</label>
                    <input
                      type="text"
                      placeholder="Số tài khoản ngân hàng"
                      value={formData.bank_account}
                      onChange={(e) => setFormData({ ...formData, bank_account: e.target.value })}
                      style={{ width: "100%", padding: "6px 8px", fontSize: 12 }}
                    />
                  </div>
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: 2, fontSize: 11, color: "#6c809c" }}>Chủ tài khoản (viết hoa không dấu):</label>
                  <input
                    type="text"
                    placeholder="CONG TY TNHH..."
                    value={formData.bank_holder}
                    onChange={(e) => setFormData({ ...formData, bank_holder: e.target.value })}
                    style={{ width: "100%", padding: "6px 8px", fontSize: 12 }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 12 }}>
                <button type="button" className="ds-secondary" onClick={() => setCreateModal(false)} style={{ padding: "8px 16px" }}>Hủy</button>
                <button type="submit" className="ds-primary" style={{ padding: "8px 22px" }}>Lưu đối tác</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default PartnersView;

