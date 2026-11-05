import React, { useState, useEffect } from "react";
import {
  Plus,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  ShieldCheck,
  X,
} from "lucide-react";
import { adminApi, type PartnerDomainItem, type PartnerItem } from "../../../services/adminApi";

export const AppDomainsView: React.FC = () => {
  const [domains, setDomains] = useState<PartnerDomainItem[]>([]);
  const [partners, setPartners] = useState<PartnerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [createModal, setCreateModal] = useState(false);
  const [msg, setMsg] = useState("");

  const [formData, setFormData] = useState({
    partner_id: "",
    domain: "",
    subdomain: "",
    app_slug: "",
    theme_color: "#1e3a8a",
    header_title: "Web App Đặt Vé Xe Khách",
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [resDomains, resPartners] = await Promise.all([
        adminApi.getPartnerDomains(),
        adminApi.getPartners(),
      ]);
      if (resDomains.data) setDomains(resDomains.data);
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

  const handleVerify = async (id: string) => {
    try {
      await adminApi.verifyPartnerDomain(id);
      setMsg("Đã xác minh bản ghi DNS và kích hoạt chứng chỉ SSL thành công!");
      loadData();
    } catch (err: any) {
      alert("Lỗi xác minh: " + err.message);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await adminApi.savePartnerDomain({
        partner_id: formData.partner_id || (partners[0]?.id ?? ""),
        domain: formData.domain || null,
        subdomain: formData.subdomain || `${formData.app_slug}.danavago.com`,
        app_slug: formData.app_slug,
        settings: {
          theme_color: formData.theme_color,
          header_title: formData.header_title,
          show_operator_only: true,
        },
      });
      setMsg("Đã lưu cấu hình tên miền và app thương hiệu!");
      setCreateModal(false);
      loadData();
    } catch (err: any) {
      alert("Lỗi lưu cấu hình: " + err.message);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {loading && <div className="ds-progress">Đang tải tên miền...</div>}
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
              App & Tên miền thương hiệu riêng (White-label)
            </h2>
            <p style={{ margin: "4px 0 0", color: "#6c809c", fontSize: 13 }}>
              Cấp phát subdomain miễn phí và liên kết tên miền chính chủ cho từng nhà xe đối tác
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
                setFormData({
                  partner_id: partners[0]?.id || "",
                  domain: "",
                  subdomain: "",
                  app_slug: "",
                  theme_color: "#1e3a8a",
                  header_title: "Web App Đặt Vé",
                });
                setCreateModal(true);
              }}
              className="ds-primary"
              style={{ padding: "9px 18px", borderRadius: 8, fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}
            >
              <Plus size={16} /> Cấu hình tên miền mới
            </button>
          </div>
        </div>
      </div>

      {/* Grid danh sách domain */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: 20 }}>
        {domains.map((d) => (
          <div key={d.id} className="ds-panel" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 22 }}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#1765e8", background: "#eef5ff", padding: "2px 8px", borderRadius: 4 }}>
                    {d.partner?.name || "Đối tác"}
                  </span>
                  <h3 style={{ fontSize: 18, fontWeight: 700, color: "#102744", margin: "6px 0 2px" }}>
                    {d.domain || d.subdomain}
                  </h3>
                  <div style={{ color: "#6c809c", fontSize: 12 }}>App slug: <code>{d.app_slug}</code></div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  {d.is_verified ? (
                    <span className="ds-badge paid" style={{ fontSize: 11, display: "flex", alignItems: "center", gap: 4 }}>
                      <CheckCircle2 size={12} /> Đã xác minh
                    </span>
                  ) : (
                    <span className="ds-badge unpaid" style={{ fontSize: 11, display: "flex", alignItems: "center", gap: 4 }}>
                      <AlertTriangle size={12} /> Chờ DNS
                    </span>
                  )}
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 8, margin: "14px 0", background: "#f8fafd", padding: "12px 14px", borderRadius: 8, fontSize: 13 }}>
                <div>
                  <small style={{ color: "#6c809c", display: "block" }}>Subdomain hệ thống:</small>
                  <strong style={{ color: "#1e3a8a" }}>https://{d.subdomain}</strong>
                </div>
                {d.domain && (
                  <div>
                    <small style={{ color: "#6c809c", display: "block" }}>Tên miền riêng:</small>
                    <strong style={{ color: "#16825d" }}>https://{d.domain}</strong>
                  </div>
                )}
                <div>
                  <small style={{ color: "#6c809c", display: "block" }}>Bản ghi CNAME cần trỏ:</small>
                  <code>CNAME @ &rarr; target.danavago.com</code>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #edf2f9", paddingTop: 12, marginTop: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#6c809c" }}>
                <ShieldCheck size={14} color="#16825d" />
                SSL: <strong style={{ color: d.ssl_status === "active" ? "#16825d" : "#eab308" }}>{d.ssl_status === "active" ? "Bảo mật HTTPS" : "Đang xử lý"}</strong>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                {!d.is_verified && (
                  <button
                    onClick={() => handleVerify(d.id)}
                    style={{ padding: "5px 12px", borderRadius: 6, border: "1px solid #16825d", background: "#e6f7ed", color: "#16825d", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
                  >
                    Xác minh ngay
                  </button>
                )}
                <a
                  href={`/app/${d.app_slug}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "5px 10px", borderRadius: 6, border: "1px solid #dce5ef", background: "#fff", color: "#1765e8", fontSize: 12, fontWeight: 600, textDecoration: "none" }}
                >
                  Xem web app <ExternalLink size={12} />
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Cấu hình Domain mới */}
      {createModal && (
        <div className="ds-modal-backdrop" onClick={() => setCreateModal(false)}>
          <div className="ds-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520 }}>
            <header>
              <h2>Cấu hình App & Tên miền nhà xe</h2>
              <button onClick={() => setCreateModal(false)}><X size={20} /></button>
            </header>
            <form onSubmit={handleSave} style={{ padding: 24, display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ display: "block", marginBottom: 4, fontSize: 13, fontWeight: 600 }}>Chọn nhà xe áp dụng:</label>
                <select
                  value={formData.partner_id}
                  onChange={(e) => setFormData({ ...formData, partner_id: e.target.value })}
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
                <label style={{ display: "block", marginBottom: 4, fontSize: 13, fontWeight: 600 }}>App Slug (viết liền không dấu):</label>
                <input
                  type="text"
                  required
                  placeholder="VD: cuaonglimousine hoặc haivanxanh"
                  value={formData.app_slug}
                  onChange={(e) => setFormData({
                    ...formData,
                    app_slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""),
                    subdomain: `${e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "")}.danavago.com`,
                  })}
                  style={{ width: "100%", padding: "8px 10px" }}
                />
              </div>

              <div>
                <label style={{ display: "block", marginBottom: 4, fontSize: 13, fontWeight: 600 }}>Tên miền chính chủ (nếu có):</label>
                <input
                  type="text"
                  placeholder="VD: cuaonglimousine.com"
                  value={formData.domain}
                  onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                  style={{ width: "100%", padding: "8px 10px" }}
                />
              </div>

              <div>
                <label style={{ display: "block", marginBottom: 4, fontSize: 13, fontWeight: 600 }}>Màu sắc thương hiệu chủ đạo (Hex):</label>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input
                    type="color"
                    value={formData.theme_color}
                    onChange={(e) => setFormData({ ...formData, theme_color: e.target.value })}
                    style={{ width: 44, height: 38, border: "none", cursor: "pointer", background: "none" }}
                  />
                  <input
                    type="text"
                    value={formData.theme_color}
                    onChange={(e) => setFormData({ ...formData, theme_color: e.target.value })}
                    style={{ flex: 1, padding: "8px 10px" }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 12 }}>
                <button type="button" className="ds-secondary" onClick={() => setCreateModal(false)} style={{ padding: "8px 16px" }}>Hủy</button>
                <button type="submit" className="ds-primary" style={{ padding: "8px 22px" }}>Lưu cấu hình</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default AppDomainsView;
