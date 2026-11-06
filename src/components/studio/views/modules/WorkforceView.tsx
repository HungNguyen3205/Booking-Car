import { useMemo, useState } from "react";
import { CalendarCheck, Coins, Pencil, RefreshCw, UserCheck, Wallet } from "lucide-react";
import { studioModules, vnMonth, vnToday, type AttendanceStatus, type PayrollRow } from "../../../../services/studioModulesApi";
import { Field, Kpi, Modal, Notice, PartnerSelect, useLoad, usePartners, vnd } from "./kit";

const STATUS: Record<AttendanceStatus, { label: string; short: string; color: string }> = {
  present: { label: "Có mặt", short: "✓", color: "#bbf7d0" },
  late: { label: "Đi muộn", short: "M", color: "#fde68a" },
  leave: { label: "Nghỉ phép", short: "P", color: "#bfdbfe" },
  absent: { label: "Vắng", short: "V", color: "#fecaca" },
};

/** Chấm công theo tháng, bảng lương và hoa hồng bán vé. */
export default function WorkforceView() {
  const partners = usePartners();
  const [tab, setTab] = useState<"attendance" | "payroll">("attendance");
  const [month, setMonth] = useState(vnMonth());
  const [partnerId, setPartnerId] = useState("");
  const [cell, setCell] = useState<null | { adminId: string; name: string; date: string; shift: string }>(null);
  const [comp, setComp] = useState<PayrollRow | null>(null);
  const [notice, setNotice] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  const sheet = useLoad(() => studioModules.attendance(month, partnerId || undefined).then((r) => r.data), [month, partnerId]);
  const payroll = useLoad(() => studioModules.payroll(month, partnerId || undefined).then((r) => r.data), [month, partnerId]);
  const today = vnToday();

  const days = useMemo(() => {
    const [y, m] = month.split("-").map(Number);
    const count = new Date(y, m, 0).getDate();
    return Array.from({ length: count }, (_, i) => {
      const d = new Date(y, m - 1, i + 1);
      const iso = `${month}-${String(i + 1).padStart(2, "0")}`;
      return { iso, day: i + 1, weekend: d.getDay() === 0 || d.getDay() === 6, future: iso > today, label: ["CN", "T2", "T3", "T4", "T5", "T6", "T7"][d.getDay()] };
    });
  }, [month, today]);

  const reloadAll = () => { void sheet.reload(); void payroll.reload(); };
  const totals = payroll.data?.totals;
  const staffCount = sheet.data?.staff.length ?? 0;
  const presentToday = sheet.data?.staff.filter((s) => s.days[today] && ["present", "late"].includes(s.days[today].status)).length ?? 0;

  return (
    <div className="ds-page" style={{ gap: 18 }}>
      <div className="dm-head">
        <div>
          <h2>Chấm công, lương & hoa hồng</h2>
          <p>Chấm công từng ngày, tính lương theo công thực tế và hoa hồng trên vé nhân viên đã bán và thu tiền.</p>
        </div>
        <div className="dm-seg" role="tablist">
          <button type="button" role="tab" aria-selected={tab === "attendance"} className={tab === "attendance" ? "on" : ""} onClick={() => setTab("attendance")}>Bảng chấm công</button>
          <button type="button" role="tab" aria-selected={tab === "payroll"} className={tab === "payroll" ? "on" : ""} onClick={() => setTab("payroll")}>Lương & hoa hồng</button>
        </div>
      </div>

      <div className="ds-panel ds-filter-bar">
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center", width: "100%" }}>
          <PartnerSelect value={partnerId} onChange={setPartnerId} partners={partners} />
          <div className="ds-filter-date-wrap"><span style={{ fontSize: 12, color: "#64748b" }}>Tháng</span><input type="month" value={month} max={vnMonth()} onChange={(e) => setMonth(e.target.value || vnMonth())} aria-label="Tháng" /></div>
          <button type="button" className="dm-btn" onClick={reloadAll}><RefreshCw size={15} /> Làm mới</button>
        </div>
      </div>

      {notice && <Notice kind={notice.kind} onClose={() => setNotice(null)}>{notice.text}</Notice>}

      <div className="dm-kpis">
        <Kpi icon={<UserCheck size={18} />} label="Nhân sự đang làm" value={staffCount} hint={month === vnMonth() ? `${presentToday} người có mặt hôm nay` : undefined} />
        <Kpi icon={<Wallet size={18} />} label="Quỹ lương tháng" value={totals ? vnd(totals.salary) : "—"} />
        <Kpi icon={<Coins size={18} />} tone="orange" label="Hoa hồng bán vé" value={totals ? vnd(totals.commission) : "—"} />
        <Kpi icon={<CalendarCheck size={18} />} tone="green" label="Tổng chi trả" value={totals ? vnd(totals.total) : "—"} />
      </div>

      {tab === "attendance" ? (
        <div className="dm-card">
          <div className="dm-head" style={{ marginBottom: 10 }}>
            <h3 style={{ margin: 0, fontSize: 15.5, color: "#102744" }}>Tháng {month.slice(5)}/{month.slice(0, 4)}</h3>
            <div className="dm-legend">
              {(Object.keys(STATUS) as AttendanceStatus[]).map((k) => <span key={k}><i style={{ background: STATUS[k].color }} />{STATUS[k].short} {STATUS[k].label}</span>)}
            </div>
          </div>
          {sheet.error && <Notice kind="error">{sheet.error}</Notice>}
          {sheet.loading && !sheet.data && <p className="dm-empty">Đang tải bảng chấm công…</p>}
          {sheet.data && !sheet.data.staff.length && <p className="dm-empty">Chưa có nhân sự đang làm. Thêm nhân sự ở mục "Nhân sự & phân quyền".</p>}
          {sheet.data && sheet.data.staff.length > 0 && (
            <div className="dm-table-wrap">
              <table className="dm-att">
                <thead><tr><th className="name">Nhân sự</th>{days.map((d) => <th key={d.iso} className={d.weekend ? "weekend" : ""}>{d.day}<br /><small style={{ fontWeight: 500 }}>{d.label}</small></th>)}<th>Công</th></tr></thead>
                <tbody>
                  {sheet.data.staff.map((s) => {
                    const worked = Object.values(s.days).filter((d) => d.status === "present" || d.status === "late").length;
                    return (
                      <tr key={s.id}>
                        <td className="name">{s.name}<small>{s.partner_name || s.role} · vào ca {s.shift_start}</small></td>
                        {days.map((d) => {
                          const a = s.days[d.iso];
                          return (
                            <td key={d.iso}>
                              <button type="button" disabled={d.future}
                                className={`dm-att-cell ${a?.status || ""}${d.iso === today ? " today" : ""}`}
                                title={a ? `${STATUS[a.status].label}${a.check_in ? ` · vào ${a.check_in}` : ""}${a.check_out ? ` · ra ${a.check_out}` : ""}${a.note ? ` · ${a.note}` : ""}` : d.future ? "Chưa tới ngày" : "Chưa chấm — bấm để chấm công"}
                                aria-label={`${s.name} ngày ${d.day}: ${a ? STATUS[a.status].label : "chưa chấm"}`}
                                onClick={() => setCell({ adminId: s.id, name: s.name, date: d.iso, shift: s.shift_start })}>
                                {a ? STATUS[a.status].short : ""}
                              </button>
                            </td>
                          );
                        })}
                        <td style={{ fontWeight: 750, color: "#102744", padding: "0 10px" }}>{worked}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="dm-card">
          <h3>Bảng lương tháng {month.slice(5)}/{month.slice(0, 4)}</h3>
          {payroll.error && <Notice kind="error">{payroll.error}</Notice>}
          <div className="dm-table-wrap">
            <table className="dm-table">
              <thead><tr><th>Nhân sự</th><th className="num">Lương cơ bản</th><th className="num">Công</th><th className="num">Muộn / Phép / Vắng</th><th className="num">Lương theo công</th><th className="num">Vé đã bán</th><th className="num">Hoa hồng</th><th className="num">Thực nhận</th><th /></tr></thead>
              <tbody>
                {payroll.loading && !payroll.data && <tr><td colSpan={9} className="dm-empty">Đang tính lương…</td></tr>}
                {payroll.data && !payroll.data.rows.length && <tr><td colSpan={9} className="dm-empty">Chưa có nhân sự.</td></tr>}
                {payroll.data?.rows.map((r) => (
                  <tr key={r.id}>
                    <td><strong>{r.name}</strong><br /><small className="muted">{r.partner_name || r.role}</small></td>
                    <td className="num">{r.base_salary ? vnd(r.base_salary) : <span className="muted">Chưa đặt</span>}</td>
                    <td className="num">{r.worked_days}/{r.standard_days}</td>
                    <td className="num">{r.late_days} / {r.leave_days} / {r.absent_days}</td>
                    <td className="num">{vnd(r.salary)}</td>
                    <td className="num">{r.tickets_sold} vé<br /><small className="muted">{vnd(r.sales_revenue)} × {r.commission_rate}%</small></td>
                    <td className="num">{vnd(r.commission)}</td>
                    <td className="num" style={{ fontWeight: 800, color: "#102744" }}>{vnd(r.total)}</td>
                    <td className="num"><button type="button" className="dm-btn dm-btn-sm" onClick={() => setComp(r)}><Pencil size={13} /> Mức lương</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p style={{ margin: "12px 0 0", fontSize: 12.5, color: "#64748b" }}>
            Lương theo công = lương cơ bản × công thực tế / công chuẩn (tối đa bằng lương cơ bản). Hoa hồng tính trên vé đã thanh toán do nhân viên tạo (bán tại quầy) trong tháng.
          </p>
        </div>
      )}

      {cell && (
        <MarkForm cell={cell} current={sheet.data?.staff.find((s) => s.id === cell.adminId)?.days[cell.date]}
          onClose={() => setCell(null)}
          onSaved={(t) => { setCell(null); setNotice({ kind: "ok", text: t }); reloadAll(); }} />
      )}
      {comp && (
        <CompensationForm row={comp} onClose={() => setComp(null)}
          onSaved={(t) => { setComp(null); setNotice({ kind: "ok", text: t }); reloadAll(); }} />
      )}
    </div>
  );
}

function MarkForm({ cell, current, onClose, onSaved }: {
  cell: { adminId: string; name: string; date: string; shift: string };
  current?: { status: AttendanceStatus; check_in: string | null; check_out: string | null; note: string | null };
  onClose: () => void; onSaved: (t: string) => void;
}) {
  const [v, setV] = useState({ status: (current?.status || "present") as AttendanceStatus, check_in: current?.check_in || cell.shift, check_out: current?.check_out || "", note: current?.note || "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const save = async (status: AttendanceStatus | "clear") => {
    setBusy(true); setError("");
    try {
      const working = status === "present" || status === "late";
      const r = await studioModules.markAttendance({ admin_id: cell.adminId, work_date: cell.date, status, ...(working ? { check_in: v.check_in || undefined, check_out: v.check_out || undefined } : {}), note: v.note || undefined });
      onSaved(r.message || "Đã chấm công");
    } catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  };
  const working = v.status === "present" || v.status === "late";
  const [y, m, d] = cell.date.split("-");
  return (
    <Modal title={`Chấm công · ${cell.name} · ${d}/${m}/${y}`} onClose={onClose} width={480}>
      <div className="dm-seg" style={{ flexWrap: "wrap" }}>
        {(Object.keys(STATUS) as AttendanceStatus[]).map((k) => (
          <button key={k} type="button" className={v.status === k ? "on" : ""} onClick={() => setV({ ...v, status: k })}>{STATUS[k].label}</button>
        ))}
      </div>
      {working && (
        <div className="dm-form-row">
          <Field label="Giờ vào" hint={`Vào sau ${cell.shift} sẽ tính đi muộn`}><input type="time" value={v.check_in} onChange={(e) => setV({ ...v, check_in: e.target.value })} /></Field>
          <Field label="Giờ ra"><input type="time" value={v.check_out} onChange={(e) => setV({ ...v, check_out: e.target.value })} /></Field>
        </div>
      )}
      <Field label="Ghi chú"><input value={v.note} maxLength={255} onChange={(e) => setV({ ...v, note: e.target.value })} placeholder="VD: Đổi ca với chị Lan" /></Field>
      {error && <Notice kind="error">{error}</Notice>}
      <div className="dm-actions">
        {current && <button type="button" className="dm-btn dm-btn-danger" disabled={busy} onClick={() => save("clear")} style={{ marginRight: "auto" }}>Xoá công</button>}
        <button type="button" className="dm-btn" onClick={onClose}>Huỷ</button>
        <button type="button" className="ds-primary" disabled={busy} style={{ padding: "9px 18px" }} onClick={() => save(v.status)}>{busy ? "Đang lưu…" : "Lưu"}</button>
      </div>
    </Modal>
  );
}

function CompensationForm({ row, onClose, onSaved }: { row: PayrollRow; onClose: () => void; onSaved: (t: string) => void }) {
  const [v, setV] = useState({ base_salary: String(row.base_salary || ""), commission_rate: String(row.commission_rate || 0), standard_days: String(row.standard_days || 26), shift_start: row.shift_start || "08:00" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true); setError("");
    try {
      const r = await studioModules.saveCompensation(row.id, { base_salary: Number(v.base_salary || 0), commission_rate: Number(v.commission_rate || 0), standard_days: Number(v.standard_days || 26), shift_start: v.shift_start });
      onSaved(r.message || "Đã lưu");
    } catch (err) { setError((err as Error).message); }
    finally { setBusy(false); }
  };
  return (
    <Modal title={`Mức lương · ${row.name}`} onClose={onClose} width={500}>
      <form onSubmit={submit} style={{ display: "grid", gap: 14 }}>
        <div className="dm-form-row">
          <Field label="Lương cơ bản / tháng (đ)"><input inputMode="numeric" value={v.base_salary} onChange={(e) => setV({ ...v, base_salary: e.target.value.replace(/\D/g, "") })} placeholder="VD: 9000000" /></Field>
          <Field label="Hoa hồng bán vé (%)"><input type="number" step="0.1" min={0} max={50} value={v.commission_rate} onChange={(e) => setV({ ...v, commission_rate: e.target.value })} /></Field>
        </div>
        <div className="dm-form-row">
          <Field label="Công chuẩn / tháng"><input type="number" min={1} max={31} value={v.standard_days} onChange={(e) => setV({ ...v, standard_days: e.target.value })} /></Field>
          <Field label="Giờ vào ca"><input type="time" value={v.shift_start} onChange={(e) => setV({ ...v, shift_start: e.target.value })} /></Field>
        </div>
        {v.base_salary && <small style={{ color: "#64748b" }}>Mỗi công ≈ <b>{vnd(Math.round(Number(v.base_salary) / Math.max(1, Number(v.standard_days))))}</b></small>}
        {error && <Notice kind="error">{error}</Notice>}
        <div className="dm-actions">
          <button type="button" className="dm-btn" onClick={onClose}>Huỷ</button>
          <button className="ds-primary" disabled={busy} style={{ padding: "9px 18px" }}>{busy ? "Đang lưu…" : "Lưu mức lương"}</button>
        </div>
      </form>
    </Modal>
  );
}
