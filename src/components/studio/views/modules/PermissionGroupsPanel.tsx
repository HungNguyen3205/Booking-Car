import { useMemo, useState } from "react";
import { Building2, Globe2, Pencil, Plus, ShieldCheck, Trash2 } from "lucide-react";
import { adminApi } from "../../../../services/adminApi";
import { studioModules, type PermissionGroup, type PermissionInfo } from "../../../../services/studioModulesApi";
import { Field, Modal, Notice, useLoad, usePartners } from "./kit";

type StaffLite = { id: string; ho_ten: string; email: string; role: string; partner_id?: string | null; permission_group_id?: string | null; all_permissions?: string[] };

/**
 * Phân quyền 2 tầng:
 *  - Tầng nền tảng: nhóm dùng chung cho mọi nhà xe.
 *  - Tầng nhà xe: nhóm riêng của từng nhà xe (chỉ gán cho nhân sự của nhà xe đó).
 * Quyền thực tế = quyền mặc định của vai trò + nhóm quyền + quyền cấp riêng.
 */
export default function PermissionGroupsPanel() {
  const partners = usePartners();
  const groups = useLoad(() => studioModules.permissionGroups(), []);
  const staff = useLoad(() => adminApi.getStaff().then((r) => (r.data || []) as unknown as StaffLite[]), []);
  const [editing, setEditing] = useState<PermissionGroup | "new" | null>(null);
  const [notice, setNotice] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const catalog = groups.data?.permissions ?? [];
  const list = groups.data?.data ?? [];

  const remove = async (g: PermissionGroup) => {
    if (!window.confirm(`Xoá nhóm quyền "${g.name}"?`)) return;
    try { await studioModules.deletePermissionGroup(g.id); setNotice({ kind: "ok", text: "Đã xoá nhóm quyền" }); void groups.reload(); }
    catch (e) { setNotice({ kind: "error", text: (e as Error).message }); }
  };
  const assign = async (s: StaffLite, gid: string) => {
    try { await studioModules.assignPermissionGroup(s.id, gid || null); setNotice({ kind: "ok", text: `Đã cập nhật nhóm quyền cho ${s.ho_ten}` }); void staff.reload(); void groups.reload(); }
    catch (e) { setNotice({ kind: "error", text: (e as Error).message }); }
  };
  const names = useMemo(() => Object.fromEntries(catalog.map((p) => [p.code, p.name])), [catalog]);

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <Notice kind="info">
        Hai tầng phân quyền: <b>nhóm nền tảng</b> dùng chung cho mọi nhà xe, <b>nhóm nhà xe</b> chỉ áp dụng cho nhân sự của nhà xe đó.
        Quyền thực tế = quyền mặc định của vai trò + quyền của nhóm + quyền cấp riêng.
      </Notice>
      {notice && <Notice kind={notice.kind} onClose={() => setNotice(null)}>{notice.text}</Notice>}
      {groups.error && <Notice kind="error">{groups.error}</Notice>}

      <div className="dm-card">
        <div className="dm-head" style={{ marginBottom: 12 }}>
          <h3 style={{ margin: 0, fontSize: 15.5, color: "#102744", display: "flex", gap: 8, alignItems: "center" }}><ShieldCheck size={17} /> Nhóm quyền tuỳ chỉnh</h3>
          <button type="button" className="ds-primary" style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "9px 16px" }} onClick={() => setEditing("new")}><Plus size={16} /> Tạo nhóm quyền</button>
        </div>
        <div className="dm-table-wrap"><table className="dm-table">
          <thead><tr><th>Nhóm</th><th>Tầng</th><th>Quyền</th><th className="num">Nhân sự</th><th /></tr></thead>
          <tbody>
            {groups.loading && !groups.data && <tr><td colSpan={5} className="dm-empty">Đang tải…</td></tr>}
            {groups.data && !list.length && <tr><td colSpan={5} className="dm-empty">Chưa có nhóm quyền. Tạo nhóm như "Quầy vé", "Điều độ", "Kế toán nhà xe".</td></tr>}
            {list.map((g) => (
              <tr key={g.id}>
                <td><strong>{g.name}</strong>{g.description && <><br /><small className="muted">{g.description}</small></>}</td>
                <td>{g.scope === "platform" ? <span className="dm-pill dm-pill-blue"><Globe2 size={12} /> Nền tảng</span> : <span className="dm-pill dm-pill-orange"><Building2 size={12} /> {g.partner_name}</span>}</td>
                <td style={{ maxWidth: 380 }}><small>{g.permissions.map((p) => names[p] || p).join(" · ") || <span className="muted">Không có quyền</span>}</small></td>
                <td className="num">{g.member_count}</td>
                <td className="num" style={{ whiteSpace: "nowrap" }}>
                  <button type="button" className="dm-btn dm-btn-sm" onClick={() => setEditing(g)}><Pencil size={13} /> Sửa</button>{" "}
                  <button type="button" className="dm-btn dm-btn-sm dm-btn-danger dm-icon-btn" aria-label={`Xoá ${g.name}`} onClick={() => remove(g)}><Trash2 size={14} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table></div>
      </div>

      <div className="dm-card">
        <h3>Gán nhóm quyền cho nhân sự</h3>
        <div className="dm-table-wrap"><table className="dm-table">
          <thead><tr><th>Nhân sự</th><th>Vai trò</th><th>Nhà xe</th><th>Nhóm quyền</th><th className="num">Quyền thực tế</th></tr></thead>
          <tbody>
            {staff.data && !staff.data.length && <tr><td colSpan={5} className="dm-empty">Chưa có nhân sự.</td></tr>}
            {staff.data?.map((s) => {
              const options = list.filter((g) => g.scope === "platform" || g.partner_id === s.partner_id);
              return (
                <tr key={s.id}>
                  <td><strong>{s.ho_ten}</strong><br /><small className="muted">{s.email}</small></td>
                  <td>{s.role}</td>
                  <td>{partners.find((p) => p.id === s.partner_id)?.name || <span className="muted">Nền tảng</span>}</td>
                  <td>
                    <select className="ds-filter-select" value={s.permission_group_id || ""} onChange={(e) => assign(s, e.target.value)} aria-label={`Nhóm quyền của ${s.ho_ten}`}>
                      <option value="">Chỉ theo vai trò</option>
                      {options.map((g) => <option key={g.id} value={g.id}>{g.name}{g.scope === "partner" ? ` (${g.partner_name})` : ""}</option>)}
                    </select>
                  </td>
                  <td className="num" title={(s.all_permissions || []).map((p) => names[p] || p).join("\n")}>{(s.all_permissions || []).length}/{catalog.length}</td>
                </tr>
              );
            })}
          </tbody>
        </table></div>
      </div>

      {editing && (
        <GroupForm group={editing === "new" ? null : editing} catalog={catalog} partners={partners}
          onClose={() => setEditing(null)}
          onSaved={(t) => { setEditing(null); setNotice({ kind: "ok", text: t }); void groups.reload(); void staff.reload(); }} />
      )}
    </div>
  );
}

function GroupForm({ group, catalog, partners, onClose, onSaved }: {
  group: PermissionGroup | null; catalog: PermissionInfo[]; partners: { id: string; name: string }[];
  onClose: () => void; onSaved: (t: string) => void;
}) {
  const [name, setName] = useState(group?.name || "");
  const [description, setDescription] = useState(group?.description || "");
  const [partnerId, setPartnerId] = useState(group?.partner_id || "");
  const [perms, setPerms] = useState<Set<string>>(new Set(group?.permissions || []));
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const byGroup = useMemo(() => catalog.reduce<Record<string, PermissionInfo[]>>((acc, p) => ((acc[p.group] ||= []).push(p), acc), {}), [catalog]);
  const toggle = (code: string) => setPerms((s) => { const n = new Set(s); if (n.has(code)) n.delete(code); else n.add(code); return n; });
  const toggleAll = (items: PermissionInfo[], on: boolean) => setPerms((s) => { const n = new Set(s); items.forEach((p) => (on ? n.add(p.code) : n.delete(p.code))); return n; });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true); setError("");
    try {
      const body = { name, description, permissions: [...perms] };
      const r = group ? await studioModules.updatePermissionGroup(group.id, body) : await studioModules.createPermissionGroup({ ...body, partner_id: partnerId || null });
      onSaved(r.message || "Đã lưu");
    } catch (err) { setError((err as Error).message); }
    finally { setBusy(false); }
  };
  return (
    <Modal title={group ? `Sửa nhóm quyền · ${group.name}` : "Tạo nhóm quyền"} onClose={onClose} width={680}>
      <form onSubmit={submit} style={{ display: "grid", gap: 14 }}>
        <div className="dm-form-row">
          <Field label="Tên nhóm"><input required maxLength={120} value={name} onChange={(e) => setName(e.target.value)} placeholder="VD: Quầy vé" /></Field>
          <Field label="Áp dụng cho" hint={group ? "Không đổi được tầng sau khi tạo" : undefined}>
            <select value={partnerId} disabled={!!group} onChange={(e) => setPartnerId(e.target.value)}>
              <option value="">Toàn nền tảng (mọi nhà xe)</option>
              {partners.map((p) => <option key={p.id} value={p.id}>Riêng {p.name}</option>)}
            </select>
          </Field>
        </div>
        <Field label="Mô tả"><input maxLength={255} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="VD: Bán vé tại quầy và soát vé" /></Field>
        <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))" }}>
          {Object.entries(byGroup).map(([g, items]) => {
            const all = items.every((p) => perms.has(p.code));
            return (
              <div key={g} className="dm-perm-group">
                <strong style={{ display: "flex", justifyContent: "space-between" }}>{g}
                  <button type="button" style={{ fontSize: 11.5, color: "#c2410c", fontWeight: 650 }} onClick={() => toggleAll(items, !all)}>{all ? "Bỏ chọn" : "Chọn hết"}</button>
                </strong>
                {items.map((p) => (
                  <label key={p.code} className="dm-perm">
                    <input type="checkbox" checked={perms.has(p.code)} onChange={() => toggle(p.code)} />
                    <span><b>{p.name}</b><small>{p.description}</small></span>
                  </label>
                ))}
              </div>
            );
          })}
        </div>
        <small style={{ color: "#64748b" }}>Đã chọn {perms.size}/{catalog.length} quyền</small>
        {error && <Notice kind="error">{error}</Notice>}
        <div className="dm-actions">
          <button type="button" className="dm-btn" onClick={onClose}>Huỷ</button>
          <button className="ds-primary" disabled={busy} style={{ padding: "9px 18px" }}>{busy ? "Đang lưu…" : "Lưu nhóm quyền"}</button>
        </div>
      </form>
    </Modal>
  );
}
