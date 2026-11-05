import React, { useState, useEffect } from "react";
import {
  Wallet,
  Search,
  Plus,
  RefreshCw,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  X,
  CreditCard,
} from "lucide-react";
import { adminApi, type PaymentItem, type PartnerItem } from "../../../services/adminApi";
import { money, formatDate } from "../studioConfig";

export const PaymentsView: React.FC = () => {
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [summary, setSummary] = useState({
    total_inflow: 0,
    total_outflow: 0,
    net_balance: 0,
    pending_count: 0,
  });
  const [partners, setPartners] = useState<PartnerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPartner, setSelectedPartner] = useState("");

  // Filters
  const [selectedType, setSelectedType] = useState("");
  const [selectedMethod, setSelectedMethod] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // Modal
  const [createModal, setCreateModal] = useState(false);
  const [msg, setMsg] = useState("");

  const [formData, setFormData] = useState({
    partner_id: "",
    booking_id: "",
    type: "payment" as const,
    amount: 500000,
    method: "bank_transfer" as const,
    reference_code: "",
    status: "completed" as const,
    note: "",
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {};
      if (selectedPartner) params.partner_id = selectedPartner;
      if (selectedType) params.type = selectedType;
      if (selectedMethod) params.method = selectedMethod;
      if (selectedStatus) params.status = selectedStatus;
      if (searchTerm) params.search = searchTerm;

      const [resPayments, resPartners] = await Promise.all([
        adminApi.getPayments(params),
        adminApi.getPartners(),
      ]);

      if (resPayments.data?.data) {
        setPayments(resPayments.data.data);
      }
      if (resPayments.summary) {
        setSummary(resPayments.summary);
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
  }, [selectedPartner, selectedType, selectedMethod, selectedStatus]);

  const handleCreatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await adminApi.recordPayment({
        ...formData,
        partner_id: formData.partner_id || null,
        amount: Number(formData.amount),
      });
      setMsg("Ghi nhận giao dịch thanh toán thành công!");
      setCreateModal(false);
      loadData();
    } catch (err: any) {
      alert("Lỗi ghi nhận giao dịch: " + err.message);
    }
  };

  const handleUpdateStatus = async (id: number, status: string) => {
    try {
      await adminApi.updatePaymentStatus(id, status);
      setMsg("Đã cập nhật trạng thái giao dịch!");
      loadData();
    } catch (err: any) {
      alert("Lỗi: " + err.message);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {loading && <div className="ds-progress">Đang tải giao dịch...</div>}
      {msg && (
        <div className="ds-toast">
          {msg}
          <button onClick={() => setMsg("")}><X size={14} /></button>
        </div>
      )}

      {/* 4 Cards tóm tắt dòng tiền */}
      <section className="ds-stats" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
        <article className="ds-stat teal" style={{ borderLeft: "4px solid #16825d" }}>
          <span>
            <ArrowDownLeft size={18} />
            Tổng tiền vé thu vào
          </span>
          <strong>{money(summary.total_inflow)}</strong>
          <small style={{ color: "#6c809c", marginTop: 4, display: "block" }}>
            Qua VNPAY, MoMo & VietQR
          </small>
        </article>

        <article className="ds-stat" style={{ borderLeft: "4px solid #e11d48" }}>
          <span>
            <ArrowUpRight size={18} />
            Chi trả & Hoàn tiền
          </span>
          <strong>{money(summary.total_outflow)}</strong>
          <small style={{ color: "#6c809c", marginTop: 4, display: "block" }}>
            Chi trả đối tác & Hoàn đơn hủy
          </small>
        </article>

        <article className="ds-stat blue" style={{ borderLeft: "4px solid #1765e8" }}>
          <span>
            <Wallet size={18} />
            Dòng tiền ròng nền tảng
          </span>
          <strong>{money(summary.net_balance)}</strong>
          <small style={{ color: "#6c809c", marginTop: 4, display: "block" }}>
            Thu vào trừ Chi trả thực tế
          </small>
        </article>

        <article className="ds-stat sand" style={{ borderLeft: "4px solid #7750bb" }}>
          <span>
            <Clock size={18} />
            Giao dịch chờ duyệt
          </span>
          <strong>{summary.pending_count} đơn</strong>
          <small style={{ color: "#6c809c", marginTop: 4, display: "block" }}>
            Cần đối soát hoặc xác nhận
          </small>
        </article>
      </section>

      {/* Toolbar bộ lọc */}
      <div className="ds-panel ds-filter-bar">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
            <select
              value={selectedPartner}
              onChange={(e) => setSelectedPartner(e.target.value)}
              className="ds-filter-select"
              style={{ minWidth: 160 }}
            >
              <option value="">Tất cả nhà xe</option>
              {partners.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>

            <select
              value={selectedMethod}
              onChange={(e) => setSelectedMethod(e.target.value)}
              className="ds-filter-select"
              style={{ minWidth: 170 }}
            >
              <option value="">Tất cả cổng thanh toán</option>
              <option value="vnpay">VNPAY QR</option>
              <option value="momo">Ví MoMo</option>
              <option value="bank_transfer">Chuyển khoản VietQR</option>
              <option value="cash">Tiền mặt</option>
            </select>

            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="ds-filter-select"
              style={{ minWidth: 145 }}
            >
              <option value="">Tất cả loại GD</option>
              <option value="payment">Thu tiền vé</option>
              <option value="refund">Hoàn tiền</option>
              <option value="payout">Chi trả đối tác</option>
              <option value="topup">Nạp tiền cọc</option>
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="ds-filter-select"
              style={{ minWidth: 140 }}
            >
              <option value="">Tất cả trạng thái</option>
              <option value="completed">Thành công</option>
              <option value="pending">Chờ xử lý</option>
              <option value="failed">Thất bại</option>
            </select>

            <div className="ds-search-input" style={{ width: 200, height: 42 }}>
              <Search size={15} color="#94a3b8" />
              <input
                type="text"
                placeholder="Mã GD / Mã vé..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && loadData()}
              />
            </div>

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
            <Plus size={16} /> Ghi nhận giao dịch mới
          </button>
        </div>
      </div>

      {/* Bảng danh sách giao dịch */}
      <div className="ds-panel" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#f8fafd", borderBottom: "1px solid #e2eaf4" }}>
                <th style={{ padding: "12px 16px", textAlign: "left" }}>Mã tham chiếu</th>
                <th style={{ padding: "12px 16px", textAlign: "left" }}>Thời gian</th>
                <th style={{ padding: "12px 16px", textAlign: "left" }}>Loại giao dịch</th>
                <th style={{ padding: "12px 16px", textAlign: "left" }}>Cổng thanh toán</th>
                <th style={{ padding: "12px 16px", textAlign: "right" }}>Số tiền</th>
                <th style={{ padding: "12px 16px", textAlign: "left" }}>Ghi chú / Đơn vé</th>
                <th style={{ padding: "12px 16px", textAlign: "center" }}>Trạng thái</th>
                <th style={{ padding: "12px 16px", textAlign: "center" }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {payments.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: 40, textAlign: "center", color: "#6c809c" }}>
                    <CreditCard size={32} style={{ margin: "0 auto 8px", display: "block", color: "#a5b4fc" }} />
                    Chưa có giao dịch thanh toán nào phù hợp với bộ lọc.
                  </td>
                </tr>
              ) : (
                payments.map((p) => {
                  const isPositive = p.type === "payment" || p.type === "topup";
                  return (
                    <tr key={p.id} style={{ borderBottom: "1px solid #edf2f9" }}>
                      <td style={{ padding: "14px 16px", fontWeight: 700, color: "#1e3a8a" }}>
                        {p.reference_code}
                      </td>
                      <td style={{ padding: "14px 16px", fontSize: 12, color: "#476282" }}>
                        {formatDate(p.transaction_time)}
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        <span style={{ fontWeight: 600, color: p.type === "payment" ? "#16825d" : p.type === "refund" ? "#e11d48" : "#1765e8" }}>
                          {p.type === "payment" ? "Thu tiền vé" : p.type === "refund" ? "Hoàn tiền" : p.type === "payout" ? "Chi trả đối tác" : "Nạp cọc"}
                        </span>
                      </td>
                      <td style={{ padding: "14px 16px" }}>
                        <span style={{ background: "#f1f5f9", padding: "2px 8px", borderRadius: 4, fontWeight: 600, fontSize: 11, textTransform: "uppercase" }}>
                          {p.method}
                        </span>
                      </td>
                      <td style={{ padding: "14px 16px", textAlign: "right", fontWeight: 800, color: isPositive ? "#16825d" : "#e11d48" }}>
                        {isPositive ? "+" : "-"}{money(p.amount)}
                      </td>
                      <td style={{ padding: "14px 16px", fontSize: 12, color: "#334155" }}>
                        {p.note || "Giao dịch thanh toán"}
                      </td>
                      <td style={{ padding: "14px 16px", textAlign: "center" }}>
                        <span className={`ds-badge ${p.status === "completed" ? "paid" : p.status === "pending" ? "unpaid" : "cancelled"}`} style={{ fontSize: 11 }}>
                          {p.status === "completed" ? "Thành công" : p.status === "pending" ? "Chờ xử lý" : "Thất bại"}
                        </span>
                      </td>
                      <td style={{ padding: "14px 16px", textAlign: "center" }}>
                        {p.status === "pending" && (
                          <button
                            onClick={() => handleUpdateStatus(p.id, "completed")}
                            style={{ border: "1px solid #16825d", background: "#e6f7ed", color: "#16825d", padding: "4px 8px", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer" }}
                          >
                            Duyệt GD
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Ghi nhận giao dịch */}
      {createModal && (
        <div className="ds-modal-backdrop" onClick={() => setCreateModal(false)}>
          <div className="ds-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 500 }}>
            <header>
              <h2>Ghi nhận giao dịch thanh toán</h2>
              <button onClick={() => setCreateModal(false)}><X size={20} /></button>
            </header>
            <form onSubmit={handleCreatePayment} style={{ padding: 24, display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ display: "block", marginBottom: 4, fontSize: 13, fontWeight: 600 }}>Loại giao dịch:</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                    style={{ width: "100%", padding: "8px 10px" }}
                  >
                    <option value="payment">Thu tiền vé</option>
                    <option value="refund">Hoàn tiền vé</option>
                    <option value="payout">Chi trả đối tác</option>
                    <option value="topup">Nạp tiền cọc</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: 4, fontSize: 13, fontWeight: 600 }}>Cổng thanh toán:</label>
                  <select
                    value={formData.method}
                    onChange={(e) => setFormData({ ...formData, method: e.target.value as any })}
                    style={{ width: "100%", padding: "8px 10px" }}
                  >
                    <option value="bank_transfer">Chuyển khoản VietQR</option>
                    <option value="vnpay">VNPAY QR</option>
                    <option value="momo">MoMo</option>
                    <option value="cash">Tiền mặt</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: "block", marginBottom: 4, fontSize: 13, fontWeight: 600 }}>Số tiền giao dịch (đ):</label>
                <input
                  type="number"
                  required
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                  style={{ width: "100%", padding: "8px 10px" }}
                />
              </div>

              <div>
                <label style={{ display: "block", marginBottom: 4, fontSize: 13, fontWeight: 600 }}>Mã tham chiếu ngân hàng (nếu có):</label>
                <input
                  type="text"
                  placeholder="VD: FT2611030092"
                  value={formData.reference_code}
                  onChange={(e) => setFormData({ ...formData, reference_code: e.target.value })}
                  style={{ width: "100%", padding: "8px 10px" }}
                />
              </div>

              <div>
                <label style={{ display: "block", marginBottom: 4, fontSize: 13, fontWeight: 600 }}>Ghi chú nội dung:</label>
                <textarea
                  rows={2}
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                  placeholder="Nội dung giao dịch..."
                  style={{ width: "100%", padding: "8px 10px" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 12 }}>
                <button type="button" className="ds-secondary" onClick={() => setCreateModal(false)} style={{ padding: "8px 16px" }}>Hủy</button>
                <button type="submit" className="ds-primary" style={{ padding: "8px 22px" }}>Ghi nhận</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default PaymentsView;

