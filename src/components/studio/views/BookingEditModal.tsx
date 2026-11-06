import React, { useEffect, useState } from "react";
import { Bell, Save, X } from "lucide-react";
import { adminApi, type TicketBookingItem } from "../../../services/adminApi";

interface Stop {
  id: string;
  name: string;
  stop_type: string;
  time?: string;
}

interface Props {
  booking: TicketBookingItem;
  onClose: () => void;
  onSaved: (message: string) => void;
}

/**
 * "Cập nhật thông tin" for one ticket: passenger contact, pick-up/drop-off and
 * note. The server validates stops against the trip and, when asked, sends the
 * customer an in-app notification describing what changed.
 */
export const BookingEditModal: React.FC<Props> = ({ booking, onClose, onSaved }) => {
  const [form, setForm] = useState({
    customer_name: booking.customer_name,
    customer_phone: booking.customer_phone,
    customer_email: booking.customer_email || "",
    pickup_stop_id: booking.pickup_stop_id || "",
    dropoff_stop_id: booking.dropoff_stop_id || "",
    notes: booking.notes || "",
  });
  const [notify, setNotify] = useState(true);
  const [stops, setStops] = useState<Stop[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    adminApi
      .getTripDetail(booking.trip_id)
      .then((res) => alive && setStops(((res.data as { route?: { stops?: Stop[] } })?.route?.stops ?? []) as Stop[]))
      .catch(() => alive && setStops([]));
    return () => {
      alive = false;
    };
  }, [booking.trip_id]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.customer_name.trim()) return setError("Nhập họ tên hành khách.");
    if (!/^(\+84|0)[35789]\d{8}$/.test(form.customer_phone.replace(/[\s.-]/g, ""))) return setError("Số điện thoại chưa đúng (10 số, bắt đầu 03/05/07/08/09).");
    setBusy(true);
    setError("");
    try {
      const body: Record<string, unknown> = { ...form, notify_customer: notify };
      if (!stops.length) {
        delete body.pickup_stop_id;
        delete body.dropoff_stop_id;
      }
      const res = await adminApi.updateBooking(booking.id, body as Partial<TicketBookingItem>);
      onSaved(res.message);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const pickups = stops.filter((s) => s.stop_type === "pickup");
  const dropoffs = stops.filter((s) => s.stop_type === "dropoff");
  const label: React.CSSProperties = { display: "block", marginBottom: 4, fontSize: 13, fontWeight: 600 };
  const input: React.CSSProperties = { width: "100%", padding: "8px 10px", boxSizing: "border-box" };

  return (
    <div className="ds-modal-backdrop" onClick={onClose}>
      <div className="ds-modal" role="dialog" aria-modal="true" aria-labelledby="bk-edit-title" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 560 }}>
        <header>
          <h2 id="bk-edit-title">Cập nhật thông tin vé {booking.booking_code}</h2>
          <button type="button" onClick={onClose} aria-label="Đóng">
            <X size={20} />
          </button>
        </header>
        <form onSubmit={submit} style={{ padding: 20, display: "grid", gap: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <label>
              <span style={label}>Họ tên hành khách</span>
              <input style={input} value={form.customer_name} onChange={set("customer_name")} maxLength={100} required />
            </label>
            <label>
              <span style={label}>Số điện thoại</span>
              <input style={input} type="tel" value={form.customer_phone} onChange={set("customer_phone")} maxLength={20} required />
            </label>
          </div>
          <label>
            <span style={label}>Email (không bắt buộc)</span>
            <input style={input} type="email" value={form.customer_email} onChange={set("customer_email")} maxLength={200} />
          </label>
          {stops.length > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <label>
                <span style={label}>Điểm đón</span>
                <select style={input} value={form.pickup_stop_id} onChange={set("pickup_stop_id")}>
                  {pickups.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                      {s.time ? ` · ${s.time}` : ""}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span style={label}>Điểm trả</span>
                <select style={input} value={form.dropoff_stop_id} onChange={set("dropoff_stop_id")}>
                  {dropoffs.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                      {s.time ? ` · ${s.time}` : ""}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          )}
          <label>
            <span style={label}>Ghi chú</span>
            <textarea style={{ ...input, minHeight: 64, resize: "vertical" }} value={form.notes} onChange={set("notes")} maxLength={1000} />
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, padding: "10px 12px", borderRadius: 10, background: "#eef5ff", color: "#1e3a8a" }}>
            <input type="checkbox" checked={notify} onChange={(e) => setNotify(e.target.checked)} />
            <Bell size={15} /> Gửi thông báo cho khách về thay đổi này (hiện trong app khách)
          </label>
          {error && (
            <div role="alert" style={{ padding: "9px 12px", borderRadius: 10, background: "#fef2f2", color: "#991b1b", fontSize: 13 }}>
              {error}
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
            <button type="button" className="ds-secondary" onClick={onClose} style={{ padding: "8px 16px" }}>
              Hủy
            </button>
            <button type="submit" className="ds-primary" disabled={busy} style={{ padding: "8px 18px", display: "inline-flex", gap: 6, alignItems: "center" }}>
              <Save size={15} /> {busy ? "Đang lưu…" : "Lưu thay đổi"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
