import { useCallback, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { X } from "lucide-react";
import { adminApi, type PartnerItem } from "../../../../services/adminApi";
import "./modules.css";

/** Shared building blocks for the operator Studio module views. */

export function useLoad<T>(loader: () => Promise<T>, deps: unknown[]) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const seq = useRef(0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const run = useCallback(loader, deps);
  const reload = useCallback(async () => {
    const id = ++seq.current;
    setLoading(true);
    setError("");
    try {
      const value = await run();
      if (id === seq.current) setData(value);
    } catch (e) {
      if (id === seq.current) setError((e as Error).message || "Không tải được dữ liệu");
    } finally {
      if (id === seq.current) setLoading(false);
    }
  }, [run]);
  useEffect(() => {
    void reload();
  }, [reload]);
  return { data, loading, error, reload, setData };
}

export function usePartners() {
  const [partners, setPartners] = useState<PartnerItem[]>([]);
  useEffect(() => {
    adminApi.getPartners().then((r) => setPartners(r.data || [])).catch(() => setPartners([]));
  }, []);
  return partners;
}

export function PartnerSelect({ value, onChange, partners, allLabel = "Tất cả nhà xe" }: {
  value: string; onChange: (v: string) => void; partners: PartnerItem[]; allLabel?: string;
}) {
  return (
    <select className="ds-filter-select" value={value} onChange={(e) => onChange(e.target.value)} aria-label="Nhà xe">
      <option value="">{allLabel}</option>
      {partners.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
    </select>
  );
}

export function Kpi({ label, value, hint, tone = "navy", icon }: {
  label: string; value: ReactNode; hint?: ReactNode; tone?: "navy" | "green" | "red" | "orange"; icon?: ReactNode;
}) {
  return (
    <div className={`dm-kpi dm-tone-${tone}`}>
      {icon && <span className="dm-kpi-icon" aria-hidden="true">{icon}</span>}
      <div>
        <span className="dm-kpi-label">{label}</span>
        <strong className="dm-kpi-value">{value}</strong>
        {hint && <small className="dm-kpi-hint">{hint}</small>}
      </div>
    </div>
  );
}

export function Notice({ kind = "info", children, onClose }: { kind?: "info" | "ok" | "error" | "warn"; children: ReactNode; onClose?: () => void }) {
  return (
    <div className={`dm-notice dm-notice-${kind}`} role={kind === "error" ? "alert" : "status"}>
      <span>{children}</span>
      {onClose && <button type="button" aria-label="Đóng thông báo" onClick={onClose}><X size={14} /></button>}
    </div>
  );
}

export function Modal({ title, onClose, children, width = 560 }: { title: string; onClose: () => void; children: ReactNode; width?: number }) {
  return (
    <div className="ds-modal-backdrop" onClick={onClose}>
      <div className="ds-modal" role="dialog" aria-modal="true" aria-label={title} style={{ maxWidth: width }} onClick={(e) => e.stopPropagation()}>
        <header>
          <h2>{title}</h2>
          <button type="button" aria-label="Đóng" onClick={onClose}><X size={20} /></button>
        </header>
        <div className="dm-modal-body">{children}</div>
      </div>
    </div>
  );
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="dm-field">
      <span>{label}</span>
      {children}
      {hint && <small>{hint}</small>}
    </label>
  );
}

export const vnd = (n: unknown) => Number(n || 0).toLocaleString("vi-VN") + "đ";
export const pct = (n: number | null | undefined) => (n === null || n === undefined ? "—" : `${n.toLocaleString("vi-VN")}%`);
export const dmy = (s: string | null | undefined) => {
  if (!s) return "—";
  const [d] = s.split(/[ T]/);
  const [y, m, dd] = d.split("-");
  return `${dd}/${m}/${y}`;
};
export const hm = (s: string | null | undefined) => (s ? (s.split(/[ T]/)[1] || "").slice(0, 5) : "");
