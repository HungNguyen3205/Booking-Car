import React, { useState, useEffect } from "react";
import {
  Receipt,
  Plus,
  RefreshCw,
  CheckCircle,
  Clock,
  CreditCard,
  X,
} from "lucide-react";
import { adminApi, type ReconciliationItem, type PartnerItem } from "../../../services/adminApi";
import { money } from "../studioConfig";

export const ReconciliationsView: React.FC = () => {
  const [reconciliations, setReconciliations] = useState<ReconciliationItem[]>([]);
  const [summary, setSummary] = useState({
    total_revenue: 0,
    total_commission: 0,
    total_payout: 0,
    pending_payout: 0,
  });
  const [partners, setPartners] = useState<PartnerItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedPartner, setSelectedPartner] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");

  // Modals
  const [createModal, setCreateModal] = useState(false);
  const [settleModal, setSettleModal] = useState<ReconciliationItem | null>(null);
  const [paymentRef, setPaymentRef] = useState("");
  const [settleNotes, setSettleNotes] = useState("");
  const [msg, setMsg] = useState("");

  const [formData, setFormData] = useState({
    partner_id: "",
    period_start: "2026-11-01",
    period_end: "2026-11-07",
    notes: "",
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {};
      if (selectedPartner) params.partner_id = selectedPartner;
      if (selectedStatus) params.status = selectedStatus;

      const [resRec, resPartners] = await Promise.all([
        adminApi.getReconciliations(params),
        adminApi.getPartners(),
      ]);

      if (resRec.data?.data) setReconciliations(resRec.data.data);
      if (resRec.summary) setSummary(resRec.summary);
      if (resPartners.data) setPartners(resPartners.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedPartner, selectedStatus]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await adminApi.generateReconciliation({
        partner_id: formData.partner_id || (partners[0]?.id ?? ""),
        period_start: formData.period_start,
        period_end: formData.period_end,
        notes: formData.notes,
      });
      setMsg("Đã lập kỳ đối soát mới thành công!");
      setCreateModal(false);
      loadData();
    } catch (err: any) {
      alert("Lỗi lập đối soát: " + err.message);
    }
  };

  const handleSettle = async () => {
    if (!settleModal) return;
    try {
      await adminApi.settleReconciliation(settleModal.id, {
        payment_ref: paymentRef || "UNC-VCB-" + Math.floor(Math.random() * 1000000),
        notes: settleNotes,
      });
      setMsg("Đã chốt quyết toán chi trả cho nhà xe!");
      setSettleModal(null);
      loadData();
    } catch (err: any) {
      alert("Lỗi quyết toán: " + err.message);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {loading && <div className="ds-progress">Đang tải đối soát...</div>}
      {msg && (
        <div className="ds-toast">
          {msg}
          <button onClick={() => setMsg("")}><X size={14} /></button>
        </div>
      )}

      {/* 4 Cards Thống kê tài chính đối soát */}
      <section className="ds-stats" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
        <article className="ds-stat" style={{ borderLeft: "4px solid #1765e8" }}>
          <span>
            <CreditCard size={18} />
            Tổng doanh thu các kỳ
          </span>
          <strong>{money(summary.total_revenue)}</strong>
          <small style={{ color: "#6c809c", marginTop: 4, display: "block" }}>
            Doanh số vé đối soát với nhà xe
          </small>
        </article>

        <article className="ds-stat teal" style={{ borderLeft: "4px solid #16825d" }}>
          <span>
            <Receipt size={18} />
            Hoa hồng sàn thu về
          </span>
          <strong>{money(summary.total_commission)}</strong>
          <small style={{ color: "#6c809c", marginTop: 4, display: "block" }}>
            Lợi nhuận chiết khấu giữ lại sàn
          </small>
        </article>

        <article className="ds-stat blue" style={{ borderLeft: "4px solid #1676a0" }}>
          <span>
            <CheckCircle size={18} />
            Đã thanh toán đối tác
          </span>
          <strong>{money(summary.total_payout - summary.pending_payout)}</strong>
          <small style={{ color: "#6c809c", marginTop: 4, display: "block" }}>
            Đã chuyển khoản qua ngân hàng
          </small>
        </article>

        <article className="ds-stat sand" style={{ borderLeft: "4px solid #7750bb" }}>
          <span>
            <Clock size={18} />
            Công nợ đang chờ chi trả
          </span>
          <strong>{money(summary.pending_payout)}</strong>
          <small style={{ color: "#6c809c", marginTop: 4, display: "block" }}>
            Kỳ đối soát đang chờ quyết toán
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
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="ds-filter-select"
              style={{ minWidth: 150 }}
            >
              <option value="">Tất cả trạng thái</option>
              <option value="draft">Bản nháp</option>
              <option value="pending_approval">Chờ duyệt</option>
              <option value="paid">Đã thanh toán</option>
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
            <Plus size={16} /> Lập kỳ đối soát mới
          </button>
        </div>
      </div>

      {/* Bảng danh sách đối soát */}
      <div className="ds-panel" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#f8fafd", borderBottom: "1px solid #e2eaf4" }}>
                <th style={{ padding: "12px 16px", textAlign: "left" }}>Mã đối soát</th>
                <th style={{ padding: "12px 16px", textAlign: "left" }}>Nhà xe đối tác</th>
                <th style={{ padding: "12px 16px", textAlign: "left" }}>Kỳ đối soát</th>
                <th style={{ padding: "12px 16px", textAlign: "center" }}>Số vé</th>
                <th style={{ padding: "12px 16px", textAlign: "right" }}>Tổng doanh thu</th>
                <th style={{ padding: "12px 16px", textAlign: "center" }}>Hoa hồng</th>
                <th style={{ padding: "12px 16px", textAlign: "right" }}>Thực trả nhà xe</th>
                <th style={{ padding: "12px 16px", textAlign: "center" }}>Trạng thái</th>
                <th style={{ padding: "12px 16px", textAlign: "center" }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {reconciliations.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ padding: 40, textAlign: "center", color: "#6c809c" }}>
                    <Receipt size={32} style={{ margin: "0 auto 8px", display: "block", color: "#a5b4fc" }} />
                    Chưa có kỳ đối soát nào trong danh sách.
                  </td>
                </tr>
              ) : (
                reconciliations.map((r) => (
                  <tr key={r.id} style={{ borderBottom: "1px solid #edf2f9" }}>
                    <td style={{ padding: "14px 16px", fontWeight: 700, color: "#1e3a8a" }}>
                      {r.code}
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <strong style={{ color: "#102744", display: "block" }}>{r.partner?.name}</strong>
                      {r.partner?.bank_account && (
                        <small style={{ color: "#6c809c" }}>
                          {r.partner.bank_name}: {r.partner.bank_account}
                        </small>
                      )}
                    </td>
                    <td style={{ padding: "14px 16px", fontSize: 12 }}>
                      {r.period_start} → {r.period_end}
                    </td>
                    <td style={{ padding: "14px 16px", textAlign: "center", fontWeight: 600 }}>
                      {r.total_tickets} vé
                    </td>
                    <td style={{ padding: "14px 16px", textAlign: "right", fontWeight: 700 }}>
                      {money(r.total_revenue)}
                    </td>
                    <td style={{ padding: "14px 16px", textAlign: "center" }}>
                      <span style={{ fontWeight: 600, color: "#1765e8" }}>{r.commission_rate}%</span>
                      <div style={{ fontSize: 11, color: "#6c809c" }}>({money(r.commission_amount)})</div>
                    </td>
                    <td style={{ padding: "14px 16px", textAlign: "right", fontWeight: 800, color: "#16825d", fontSize: 14 }}>
                      {money(r.payout_amount)}
                    </td>
                    <td style={{ padding: "14px 16px", textAlign: "center" }}>
                      <span className={`ds-badge ${r.status === "paid" ? "paid" : "unpaid"}`} style={{ fontSize: 11 }}>
                        {r.status === "paid" ? "Đã quyết toán" : r.status === "pending_approval" ? "Chờ duyệt" : "Bản nháp"}
                      </span>
                    </td>
                    <td style={{ padding: "14px 16px", textAlign: "center" }}>
                      {r.status !== "paid" ? (
                        <button
                          onClick={() => {
                            setSettleModal(r);
                            setPaymentRef("UNC-" + r.code);
                          }}
                          style={{
                            background: "#e6f7ed",
                            border: "1px solid #16825d",
                            color: "#16825d",
                            padding: "5px 12px",
                            borderRadius: 6,
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: "pointer",
                          }}
                        >
                          Chốt chi trả
                        </button>
                      ) : (
                        <span style={{ fontSize: 11, color: "#6c809c" }}>{r.payment_ref}</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Lập kỳ đối soát */}
      {createModal && (
        <div className="ds-modal-backdrop" onClick={() => setCreateModal(false)}>
          <div className="ds-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <header>
              <h2>Lập kỳ đối soát doanh thu định kỳ</h2>
              <button onClick={() => setCreateModal(false)}><X size={20} /></button>
            </header>
            <form onSubmit={handleGenerate} style={{ padding: 24, display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ display: "block", marginBottom: 4, fontSize: 13, fontWeight: 600 }}>Chọn nhà xe đối tác:</label>
                <select
                  value={formData.partner_id}
                  onChange={(e) => setFormData({ ...formData, partner_id: e.target.value })}
                  required
                  style={{ width: "100%", padding: "8px 10px" }}
                >
                  <option value="">Chọn đối tác</option>
                  {partners.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} (Hoa hồng: {p.commission_rate}%)</option>
                  ))}
                </select>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ display: "block", marginBottom: 4, fontSize: 13, fontWeight: 600 }}>Từ ngày:</label>
                  <input
                    type="date"
                    required
                    value={formData.period_start}
                    onChange={(e) => setFormData({ ...formData, period_start: e.target.value })}
                    style={{ width: "100%", padding: "8px 10px" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: 4, fontSize: 13, fontWeight: 600 }}>Đến ngày:</label>
                  <input
                    type="date"
                    required
                    value={formData.period_end}
                    onChange={(e) => setFormData({ ...formData, period_end: e.target.value })}
                    style={{ width: "100%", padding: "8px 10px" }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: "block", marginBottom: 4, fontSize: 13, fontWeight: 600 }}>Ghi chú kỳ đối soát:</label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Đối soát vé tuần / tháng..."
                  style={{ width: "100%", padding: "8px 10px" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 12 }}>
                <button type="button" className="ds-secondary" onClick={() => setCreateModal(false)} style={{ padding: "8px 16px" }}>Hủy</button>
                <button type="submit" className="ds-primary" style={{ padding: "8px 22px" }}>Tạo đối soát</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Chốt chi trả đối tác */}
      {settleModal && (
        <div className="ds-modal-backdrop" onClick={() => setSettleModal(null)}>
          <div className="ds-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 460 }}>
            <header>
              <h2>Chốt quyết toán & Chi trả đối tác</h2>
              <button onClick={() => setSettleModal(null)}><X size={20} /></button>
            </header>
            <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ background: "#f8fafd", padding: 12, borderRadius: 8 }}>
                <div style={{ fontSize: 13, color: "#6c809c" }}>Nhà xe thụ hưởng:</div>
                <strong style={{ fontSize: 15, color: "#102744" }}>{settleModal.partner?.name}</strong>
                <div style={{ fontSize: 13, color: "#16825d", marginTop: 4 }}>
                  Số tiền chi trả: <strong>{money(settleModal.payout_amount)}</strong>
                </div>
                {settleModal.partner?.bank_account && (
                  <div style={{ fontSize: 12, color: "#476282", marginTop: 4 }}>
                    {settleModal.partner.bank_name}: {settleModal.partner.bank_account} ({settleModal.partner.bank_holder})
                  </div>
                )}
              </div>

              <div>
                <label style={{ display: "block", marginBottom: 4, fontSize: 13, fontWeight: 600 }}>Mã ủy nhiệm chi / Mã giao dịch ngân hàng:</label>
                <input
                  type="text"
                  required
                  placeholder="VD: UNC-VCB-20261103"
                  value={paymentRef}
                  onChange={(e) => setPaymentRef(e.target.value)}
                  style={{ width: "100%", padding: "8px 10px" }}
                />
              </div>

              <div>
                <label style={{ display: "block", marginBottom: 4, fontSize: 13, fontWeight: 600 }}>Ghi chú xác nhận:</label>
                <textarea
                  rows={2}
                  value={settleNotes}
                  onChange={(e) => setSettleNotes(e.target.value)}
                  placeholder="Đã chuyển khoản thanh toán hoa hồng..."
                  style={{ width: "100%", padding: "8px 10px" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 12 }}>
                <button type="button" className="ds-secondary" onClick={() => setSettleModal(null)} style={{ padding: "8px 16px" }}>Hủy</button>
                <button type="button" className="ds-primary" onClick={handleSettle} style={{ padding: "8px 22px" }}>Xác nhận đã chi trả</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default ReconciliationsView;

