import { useState } from "react";
import { ArrowDownCircle, ArrowUpCircle, Landmark, Plus, RefreshCw, Trash2, Wallet, AlertTriangle, HandCoins } from "lucide-react";
import { studioModules, vnToday, type CashEntry } from "../../../../services/studioModulesApi";
import { Field, Kpi, Modal, Notice, PartnerSelect, dmy, hm, useLoad, usePartners, vnd } from "./kit";

const METHODS: Record<string, string> = { cash: "Tiền mặt", transfer: "Chuyển khoản", card: "Thẻ" };
const monthStart = () => vnToday().slice(0, 8) + "01";

/** Sổ quỹ thu/chi và công nợ (khách nợ vé, phải trả nhà xe). */
export default function CashbookView() {
  const partners = usePartners();
  const [tab, setTab] = useState<"book" | "debts">("book");
  const [partnerId, setPartnerId] = useState("");
  const [from, setFrom] = useState(monthStart());
  const [to, setTo] = useState(vnToday());
  const [form, setForm] = useState<null | { type: "in" | "out" }>(null);
  const [notice, setNotice] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  const book = useLoad(() => studioModules.cashbook({ from, to, partner_id: partnerId || undefined }).then((r) => r.data), [from, to, partnerId]);
  const debts = useLoad(() => studioModules.debts(partnerId || undefined).then((r) => r.data), [partnerId]);
  const cats = book.data?.categories;
  const catName = (e: { type: "in" | "out"; category: string }) => cats?.[e.type]?.[e.category] || e.category;

  const remove = async (e: CashEntry) => {
    if (!window.confirm(`Xoá phiếu ${catName(e)} ${vnd(e.amount)}?`)) return;
    try { await studioModules.deleteCashEntry(e.id); setNotice({ kind: "ok", text: "Đã xoá phiếu" }); void book.reload(); }
    catch (err) { setNotice({ kind: "error", text: (err as Error).message }); }
  };

  return (
    <div className="ds-page" style={{ gap: 18 }}>
      <div className="dm-head">
        <div>
          <h2>Sổ quỹ & công nợ</h2>
          <p>Ghi nhận thu/chi tại văn phòng, theo dõi tồn quỹ và các khoản khách còn nợ hoặc phải trả nhà xe.</p>
        </div>
        <div className="dm-toolbar">
          <div className="dm-seg" role="tablist">
            <button type="button" role="tab" aria-selected={tab === "book"} className={tab === "book" ? "on" : ""} onClick={() => setTab("book")}>Sổ quỹ</button>
            <button type="button" role="tab" aria-selected={tab === "debts"} className={tab === "debts" ? "on" : ""} onClick={() => setTab("debts")}>Công nợ</button>
          </div>
        </div>
      </div>

      <div className="ds-panel ds-filter-bar">
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center", width: "100%" }}>
          <PartnerSelect value={partnerId} onChange={setPartnerId} partners={partners} />
          {tab === "book" && (
            <>
              <div className="ds-filter-date-wrap"><span style={{ fontSize: 12, color: "#64748b" }}>Từ</span><input type="date" value={from} max={to} onChange={(e) => setFrom(e.target.value || monthStart())} aria-label="Từ ngày" /></div>
              <div className="ds-filter-date-wrap"><span style={{ fontSize: 12, color: "#64748b" }}>Đến</span><input type="date" value={to} min={from} onChange={(e) => setTo(e.target.value || vnToday())} aria-label="Đến ngày" /></div>
            </>
          )}
          <button type="button" className="dm-btn" onClick={() => (tab === "book" ? book.reload() : debts.reload())}><RefreshCw size={15} /> Làm mới</button>
          {tab === "book" && (
            <div style={{ display: "flex", gap: 8, marginLeft: "auto", flexWrap: "wrap" }}>
              <button type="button" className="dm-btn" onClick={() => setForm({ type: "out" })}><ArrowUpCircle size={16} /> Lập phiếu chi</button>
              <button type="button" className="ds-primary" style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "9px 16px" }} onClick={() => setForm({ type: "in" })}><Plus size={16} /> Lập phiếu thu</button>
            </div>
          )}
        </div>
      </div>

      {notice && <Notice kind={notice.kind} onClose={() => setNotice(null)}>{notice.text}</Notice>}

      {tab === "book" ? (
        <>
          {book.error && <Notice kind="error">{book.error}</Notice>}
          <div className="dm-kpis">
            <Kpi icon={<Landmark size={18} />} label="Tồn đầu kỳ" value={book.data ? vnd(book.data.opening_balance) : "—"} hint={`Trước ${dmy(from)}`} />
            <Kpi icon={<ArrowDownCircle size={18} />} tone="green" label="Tổng thu" value={book.data ? vnd(book.data.total_in) : "—"} />
            <Kpi icon={<ArrowUpCircle size={18} />} tone="red" label="Tổng chi" value={book.data ? vnd(book.data.total_out) : "—"} />
            <Kpi icon={<Wallet size={18} />} tone="orange" label="Tồn cuối kỳ" value={book.data ? vnd(book.data.closing_balance) : "—"} hint={`Đến ${dmy(to)}`} />
          </div>
          <div className="dm-grid-2">
            <div className="dm-card" style={{ gridColumn: "1 / -1" }}>
              <h3>Phiếu thu / chi</h3>
              <div className="dm-table-wrap">
                <table className="dm-table">
                  <thead><tr><th>Ngày</th><th>Loại</th><th>Hạng mục</th><th>Nhà xe</th><th>Hình thức</th><th>Ghi chú</th><th className="num">Số tiền</th><th /></tr></thead>
                  <tbody>
                    {book.loading && !book.data && <tr><td colSpan={8} className="dm-empty">Đang tải sổ quỹ…</td></tr>}
                    {book.data && !book.data.entries.length && <tr><td colSpan={8} className="dm-empty">Chưa có phiếu nào trong khoảng ngày này. Bấm "Lập phiếu thu" để bắt đầu.</td></tr>}
                    {book.data?.entries.map((e) => (
                      <tr key={e.id}>
                        <td>{dmy(e.occurred_on)}</td>
                        <td><span className={`dm-pill ${e.type === "in" ? "dm-pill-green" : "dm-pill-red"}`}>{e.type === "in" ? "Thu" : "Chi"}</span></td>
                        <td>{catName(e)}</td>
                        <td>{e.partner_name || <span className="muted">Chung</span>}</td>
                        <td>{METHODS[e.method] || e.method}</td>
                        <td style={{ maxWidth: 240 }}>{e.note || <span className="muted">—</span>}<br /><small className="muted">{e.created_by}</small></td>
                        <td className="num" style={{ fontWeight: 700, color: e.type === "in" ? "#15803d" : "#b91c1c" }}>{e.type === "in" ? "+" : "−"}{vnd(e.amount)}</td>
                        <td className="num"><button type="button" className="dm-btn dm-btn-sm dm-btn-danger dm-icon-btn" aria-label="Xoá phiếu" onClick={() => remove(e)}><Trash2 size={14} /></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            {book.data && book.data.by_category.length > 0 && (
              <div className="dm-card">
                <h3>Theo hạng mục</h3>
                <table className="dm-table"><tbody>
                  {book.data.by_category.map((c) => (
                    <tr key={c.type + c.category}><td>{catName(c)} <small className="muted">({c.count} phiếu)</small></td><td className="num" style={{ color: c.type === "in" ? "#15803d" : "#b91c1c", fontWeight: 700 }}>{c.type === "in" ? "+" : "−"}{vnd(c.total)}</td></tr>
                  ))}
                </tbody></table>
              </div>
            )}
          </div>
        </>
      ) : (
        <>
          {debts.error && <Notice kind="error">{debts.error}</Notice>}
          <div className="dm-kpis">
            <Kpi icon={<HandCoins size={18} />} tone="orange" label="Khách còn nợ" value={debts.data ? vnd(debts.data.receivable_total) : "—"} hint={debts.data ? `${debts.data.receivables.length} vé chưa thanh toán đủ` : undefined} />
            <Kpi icon={<AlertTriangle size={18} />} tone="red" label="Nợ quá hạn" value={debts.data ? vnd(debts.data.receivable_overdue) : "—"} hint="Xe đã chạy nhưng chưa thu" />
            <Kpi icon={<Landmark size={18} />} label="Phải trả nhà xe" value={debts.data ? vnd(debts.data.payable_total) : "—"} hint={debts.data ? `${debts.data.payables.length} kỳ đối soát chưa tất toán` : undefined} />
          </div>
          <div className="dm-grid-2">
            <div className="dm-card">
              <h3>Khách còn nợ tiền vé</h3>
              <div className="dm-table-wrap"><table className="dm-table">
                <thead><tr><th>Mã vé</th><th>Khách</th><th>Khởi hành</th><th className="num">Còn nợ</th></tr></thead>
                <tbody>
                  {debts.data && !debts.data.receivables.length && <tr><td colSpan={4} className="dm-empty">Không có khoản khách nợ.</td></tr>}
                  {debts.data?.receivables.map((d) => (
                    <tr key={d.id}>
                      <td><strong>{d.booking_code}</strong><br /><small className="muted">{d.partner_name}</small></td>
                      <td>{d.customer_name}<br /><small className="muted">{d.customer_phone}</small></td>
                      <td>{hm(d.depart_time)} {dmy(d.depart_time)} {d.overdue && <span className="dm-pill dm-pill-red">Quá hạn</span>}</td>
                      <td className="num" style={{ fontWeight: 700 }}>{vnd(d.final_amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table></div>
            </div>
            <div className="dm-card">
              <h3>Phải trả nhà xe (đối soát chưa tất toán)</h3>
              <div className="dm-table-wrap"><table className="dm-table">
                <thead><tr><th>Kỳ</th><th>Nhà xe</th><th>Trạng thái</th><th className="num">Số tiền</th></tr></thead>
                <tbody>
                  {debts.data && !debts.data.payables.length && <tr><td colSpan={4} className="dm-empty">Không có khoản phải trả.</td></tr>}
                  {debts.data?.payables.map((p) => (
                    <tr key={p.id}>
                      <td><strong>{p.code}</strong><br /><small className="muted">{dmy(p.period_start)} – {dmy(p.period_end)}</small></td>
                      <td>{p.partner_name}</td>
                      <td><span className="dm-pill dm-pill-orange">{p.status === "pending" ? "Chờ tất toán" : p.status}</span></td>
                      <td className="num" style={{ fontWeight: 700 }}>{vnd(p.payout_amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table></div>
            </div>
          </div>
        </>
      )}

      {form && cats && (
        <EntryForm type={form.type} categories={cats[form.type]} partners={partners} defaultPartner={partnerId}
          onClose={() => setForm(null)}
          onSaved={(text) => { setForm(null); setNotice({ kind: "ok", text }); void book.reload(); }} />
      )}
    </div>
  );
}

function EntryForm({ type, categories, partners, defaultPartner, onClose, onSaved }: {
  type: "in" | "out"; categories: Record<string, string>; partners: { id: string; name: string }[];
  defaultPartner: string; onClose: () => void; onSaved: (msg: string) => void;
}) {
  const [v, setV] = useState({ category: Object.keys(categories)[0], amount: "", method: "cash" as CashEntry["method"], occurred_on: vnToday(), partner_id: defaultPartner, note: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(String(v.amount).replace(/\D/g, ""));
    if (!amount) { setError("Nhập số tiền lớn hơn 0"); return; }
    setBusy(true); setError("");
    try {
      const r = await studioModules.addCashEntry({ type, category: v.category, amount, method: v.method, occurred_on: v.occurred_on, partner_id: v.partner_id || null, note: v.note || null });
      onSaved(r.message || "Đã lưu phiếu");
    } catch (err) { setError((err as Error).message); }
    finally { setBusy(false); }
  };
  return (
    <Modal title={type === "in" ? "Lập phiếu thu" : "Lập phiếu chi"} onClose={onClose}>
      <form onSubmit={submit} style={{ display: "grid", gap: 14 }}>
        <div className="dm-form-row">
          <Field label="Hạng mục"><select value={v.category} onChange={(e) => setV({ ...v, category: e.target.value })}>{Object.entries(categories).map(([k, n]) => <option key={k} value={k}>{n}</option>)}</select></Field>
          <Field label="Số tiền (đ)"><input inputMode="numeric" required value={v.amount} onChange={(e) => setV({ ...v, amount: e.target.value.replace(/[^\d]/g, "") })} placeholder="VD: 450000" /></Field>
        </div>
        <div className="dm-form-row">
          <Field label="Hình thức"><select value={v.method} onChange={(e) => setV({ ...v, method: e.target.value as CashEntry["method"] })}>{Object.entries(METHODS).map(([k, n]) => <option key={k} value={k}>{n}</option>)}</select></Field>
          <Field label="Ngày"><input type="date" required max={vnToday()} value={v.occurred_on} onChange={(e) => setV({ ...v, occurred_on: e.target.value })} /></Field>
        </div>
        <Field label="Nhà xe"><select value={v.partner_id} onChange={(e) => setV({ ...v, partner_id: e.target.value })}><option value="">Chung (không gắn nhà xe)</option>{partners.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></Field>
        <Field label="Ghi chú"><textarea rows={2} maxLength={500} value={v.note} onChange={(e) => setV({ ...v, note: e.target.value })} placeholder="VD: Đổ dầu xe 43B-088.99" /></Field>
        {v.amount && <small style={{ color: "#64748b" }}>Số tiền: <b>{vnd(Number(v.amount))}</b></small>}
        {error && <Notice kind="error">{error}</Notice>}
        <div className="dm-actions">
          <button type="button" className="dm-btn" onClick={onClose}>Huỷ</button>
          <button className="ds-primary" disabled={busy} style={{ padding: "9px 18px" }}>{busy ? "Đang lưu…" : type === "in" ? "Lưu phiếu thu" : "Lưu phiếu chi"}</button>
        </div>
      </form>
    </Modal>
  );
}
