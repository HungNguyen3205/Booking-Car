import React, { useState, useEffect } from "react";
import {
  Tag,
  Plus,
  RefreshCw,
  Trash2,
  FileText,
  X,
} from "lucide-react";
import { adminApi, type PromotionItem, type PartnerItem } from "../../../services/adminApi";
import { money, formatDate } from "../studioConfig";

export const PromotionsView: React.FC = () => {
  const [promotions, setPromotions] = useState<PromotionItem[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [partners, setPartners] = useState<PartnerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [createModal, setCreateModal] = useState(false);
  const [msg, setMsg] = useState("");

  const [formData, setFormData] = useState({
    code: "",
    title: "",
    discount_type: "percent" as const,
    discount_value: 10,
    min_order_amount: 200000,
    max_discount: 50000,
    usage_limit: 500,
    start_date: "2026-11-01",
    end_date: "2026-12-31",
    partner_id: "",
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [resPromo, resPartners] = await Promise.all([
        adminApi.getPromotions(),
        adminApi.getPartners(),
      ]);

      if (resPromo.data) {
        setPromotions(resPromo.data.promotions || []);
        setPosts(resPromo.data.posts || []);
      }
      if (resPartners.data) {
        setPartners(resPartners.data);
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

  const handleCreatePromotion = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await adminApi.savePromotion({
        ...formData,
        partner_id: formData.partner_id || null,
        discount_value: Number(formData.discount_value),
        min_order_amount: Number(formData.min_order_amount),
        max_discount: Number(formData.max_discount),
        usage_limit: Number(formData.usage_limit),
      });
      setMsg("Tạo mã ưu đãi khuyến mãi thành công!");
      setCreateModal(false);
      loadData();
    } catch (err: any) {
      alert("Lỗi tạo mã: " + err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa mã ưu đãi này?")) return;
    try {
      await adminApi.deletePromotion(id);
      setMsg("Đã xóa mã ưu đãi!");
      loadData();
    } catch (err: any) {
      alert("Lỗi: " + err.message);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {loading && <div className="ds-progress">Đang tải ưu đãi...</div>}
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
              Ưu đãi & Nội dung truyền thông
            </h2>
            <p style={{ margin: "4px 0 0", color: "#6c809c", fontSize: 13 }}>
              Quản lý mã giảm giá (coupons), khuyến mãi toàn sàn hoặc theo nhà xe
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
              onClick={() => setCreateModal(true)}
              className="ds-primary"
              style={{ padding: "9px 18px", borderRadius: 8, fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}
            >
              <Plus size={16} /> Tạo mã giảm giá mới
            </button>
          </div>
        </div>
      </div>

      {/* Danh sách mã ưu đãi */}
      <div className="ds-panel" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #e2eaf4", display: "flex", alignItems: "center", gap: 8 }}>
          <Tag size={18} color="#1765e8" />
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#102744" }}>
            Danh sách mã Coupon / Voucher ({promotions.length})
          </h3>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#f8fafd", borderBottom: "1px solid #e2eaf4" }}>
                <th style={{ padding: "12px 16px", textAlign: "left" }}>Mã Coupon</th>
                <th style={{ padding: "12px 16px", textAlign: "left" }}>Tên chương trình</th>
                <th style={{ padding: "12px 16px", textAlign: "center" }}>Mức giảm</th>
                <th style={{ padding: "12px 16px", textAlign: "left" }}>Áp dụng</th>
                <th style={{ padding: "12px 16px", textAlign: "center" }}>Lượt dùng</th>
                <th style={{ padding: "12px 16px", textAlign: "left" }}>Thời hạn</th>
                <th style={{ padding: "12px 16px", textAlign: "center" }}>Trạng thái</th>
                <th style={{ padding: "12px 16px", textAlign: "center" }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {promotions.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: 40, textAlign: "center", color: "#6c809c" }}>
                    Chưa có mã ưu đãi nào được tạo.
                  </td>
                </tr>
              ) : (
                promotions.map((p) => (
                  <tr key={p.id} style={{ borderBottom: "1px solid #edf2f9" }}>
                    <td style={{ padding: "14px 16px" }}>
                      <span style={{ fontWeight: 800, color: "#1765e8", background: "#eef5ff", padding: "4px 8px", borderRadius: 6, letterSpacing: 0.5 }}>
                        {p.code}
                      </span>
                    </td>
                    <td style={{ padding: "14px 16px", fontWeight: 600, color: "#102744" }}>
                      {p.title}
                    </td>
                    <td style={{ padding: "14px 16px", textAlign: "center", fontWeight: 700, color: "#16825d" }}>
                      {p.discount_type === "percent" ? `${p.discount_value}%` : money(p.discount_value)}
                    </td>
                    <td style={{ padding: "14px 16px", fontSize: 12, color: "#476282" }}>
                      {p.partner?.name || "Toàn hệ thống DANAVA"}
                    </td>
                    <td style={{ padding: "14px 16px", textAlign: "center" }}>
                      <strong>{p.used_count}</strong> / {p.usage_limit}
                    </td>
                    <td style={{ padding: "14px 16px", fontSize: 12 }}>
                      {formatDate(p.start_date)} → {formatDate(p.end_date)}
                    </td>
                    <td style={{ padding: "14px 16px", textAlign: "center" }}>
                      <span className={`ds-badge ${p.is_active ? "active" : "unpaid"}`} style={{ fontSize: 11 }}>
                        {p.is_active ? "Đang áp dụng" : "Hết hạn"}
                      </span>
                    </td>
                    <td style={{ padding: "14px 16px", textAlign: "center" }}>
                      <button
                        onClick={() => handleDelete(p.id)}
                        style={{ border: "none", background: "none", color: "#b91c1c", cursor: "pointer", padding: 4 }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tin tức & Bài viết */}
      {posts.length > 0 && (
        <div className="ds-panel">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#102744", display: "flex", alignItems: "center", gap: 8 }}>
              <FileText size={18} color="#16825d" />
              Tin tức & Thông báo khuyến mãi gần đây
            </h3>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 14 }}>
            {posts.map((post: any) => (
              <div key={post.id} style={{ border: "1px solid #e2eaf4", borderRadius: 8, padding: 14, background: "#f8fafd" }}>
                <span className="ds-badge active" style={{ fontSize: 10, marginBottom: 6, display: "inline-block" }}>Đã đăng</span>
                <h4 style={{ margin: "4px 0 6px", fontSize: 14, fontWeight: 700, color: "#102744" }}>{post.title}</h4>
                <p style={{ margin: 0, fontSize: 12, color: "#6c809c", lineHeight: 1.4 }}>{post.summary}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal Tạo mã giảm giá */}
      {createModal && (
        <div className="ds-modal-backdrop" onClick={() => setCreateModal(false)}>
          <div className="ds-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520 }}>
            <header>
              <h2>Tạo mã giảm giá ưu đãi mới</h2>
              <button onClick={() => setCreateModal(false)}><X size={20} /></button>
            </header>
            <form onSubmit={handleCreatePromotion} style={{ padding: 24, display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: 12 }}>
                <div>
                  <label style={{ display: "block", marginBottom: 4, fontSize: 13, fontWeight: 600 }}>Mã code:</label>
                  <input
                    type="text"
                    required
                    placeholder="VD: DANAVA10"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    style={{ width: "100%", padding: "8px 10px", fontWeight: 700 }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: 4, fontSize: 13, fontWeight: 600 }}>Tên chương trình:</label>
                  <input
                    type="text"
                    required
                    placeholder="VD: Chào hè giảm 10%"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    style={{ width: "100%", padding: "8px 10px" }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                <div>
                  <label style={{ display: "block", marginBottom: 4, fontSize: 13, fontWeight: 600 }}>Kiểu giảm:</label>
                  <select
                    value={formData.discount_type}
                    onChange={(e) => setFormData({ ...formData, discount_type: e.target.value as any })}
                    style={{ width: "100%", padding: "8px 10px" }}
                  >
                    <option value="percent">Phần trăm (%)</option>
                    <option value="fixed">Số tiền cố định (đ)</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: 4, fontSize: 13, fontWeight: 600 }}>Mức giảm:</label>
                  <input
                    type="number"
                    required
                    value={formData.discount_value}
                    onChange={(e) => setFormData({ ...formData, discount_value: Number(e.target.value) })}
                    style={{ width: "100%", padding: "8px 10px" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: 4, fontSize: 13, fontWeight: 600 }}>Giới hạn lượt:</label>
                  <input
                    type="number"
                    value={formData.usage_limit}
                    onChange={(e) => setFormData({ ...formData, usage_limit: Number(e.target.value) })}
                    style={{ width: "100%", padding: "8px 10px" }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ display: "block", marginBottom: 4, fontSize: 13, fontWeight: 600 }}>Từ ngày:</label>
                  <input
                    type="date"
                    required
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    style={{ width: "100%", padding: "8px 10px" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: 4, fontSize: 13, fontWeight: 600 }}>Đến ngày:</label>
                  <input
                    type="date"
                    required
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    style={{ width: "100%", padding: "8px 10px" }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: "block", marginBottom: 4, fontSize: 13, fontWeight: 600 }}>Áp dụng riêng cho nhà xe (để trống nếu toàn sàn):</label>
                <select
                  value={formData.partner_id}
                  onChange={(e) => setFormData({ ...formData, partner_id: e.target.value })}
                  style={{ width: "100%", padding: "8px 10px" }}
                >
                  <option value="">Toàn sàn DANAVA Go</option>
                  {partners.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 12 }}>
                <button type="button" className="ds-secondary" onClick={() => setCreateModal(false)} style={{ padding: "8px 16px" }}>Hủy</button>
                <button type="submit" className="ds-primary" style={{ padding: "8px 22px" }}>Tạo mã ưu đãi</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default PromotionsView;

