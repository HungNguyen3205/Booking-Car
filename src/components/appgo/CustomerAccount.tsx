import React, { useEffect, useState } from "react";
import { Bell, CheckCircle2, KeyRound, LogOut, ShieldCheck, Ticket, UserRound, X } from "lucide-react";
import type { Booking } from "../../types";
import type { CustomerSession } from "./useCustomerSession";
import "./customer-account.css";

const card: React.CSSProperties = { background: "#ffffff", borderRadius: 20, border: "1px solid #e2e8f0", padding: 16, marginBottom: 14 };
const field: React.CSSProperties = { width: "100%", boxSizing: "border-box", padding: "12px 14px", borderRadius: 12, border: "1px solid #cbd5e1", fontSize: 16, fontFamily: "inherit" };
const primary: React.CSSProperties = { width: "100%", padding: "13px 16px", borderRadius: 14, border: 0, background: "#2563eb", color: "#ffffff", fontWeight: 800, fontSize: 15, cursor: "pointer", fontFamily: "inherit" };
const errorBox: React.CSSProperties = { padding: "10px 12px", borderRadius: 12, background: "#fef2f2", color: "#991b1b", fontSize: 13, fontWeight: 600 };

/** Shown right after checkout, before the e-ticket. */
export const AccountCreatedModal: React.FC<{ account: NonNullable<Booking["account"]>; onContinue: () => void }> = ({ account, onContinue }) => (
  <div className="go-account-overlay" role="dialog" aria-modal="true" aria-labelledby="acct-title">
    <div className="go-account-modal">
      <div className="go-account-icon">{account.created ? <UserRound size={26} /> : <ShieldCheck size={26} />}</div>
      <h3 id="acct-title">{account.created ? "Tài khoản DANAVA Go đã được tạo" : "Số điện thoại đã có tài khoản"}</h3>
      {account.created ? (
        <>
          <p>Dùng tài khoản này để xem lại vé và nhận thông báo từ nhà xe.</p>
          <dl className="go-account-creds">
            <div>
              <dt>Tên đăng nhập</dt>
              <dd>{account.username}</dd>
            </div>
            <div>
              <dt>Mật khẩu tạm</dt>
              <dd>{account.tempPassword}</dd>
            </div>
          </dl>
          <p className="go-account-warn">
            <KeyRound size={15} /> Lần đầu đăng nhập, bạn sẽ phải đổi mật khẩu để bảo vệ tài khoản.
          </p>
        </>
      ) : (
        <p>
          Vé đã được lưu vào tài khoản <b>{account.username}</b>. Đăng nhập bằng mật khẩu của bạn ở mục Tài khoản để xem tất cả vé và thông báo.
        </p>
      )}
      <button type="button" style={primary} onClick={onContinue} autoFocus>
        Đã hiểu, xem vé
      </button>
    </div>
  </div>
);

/** Bell sheet: notifications for the signed-in customer. */
export const NotificationsSheet: React.FC<{ session: CustomerSession; onClose: () => void; onSignIn: () => void }> = ({ session, onClose, onSignIn }) => {
  useEffect(() => {
    void session.markRead();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <div className="go-modal-backdrop" onClick={onClose}>
      <div className="go-bottom-sheet" role="dialog" aria-modal="true" aria-label="Thông báo" onClick={(e) => e.stopPropagation()} style={{ maxHeight: "80vh", overflowY: "auto" }}>
        <div className="go-sheet-handle" />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <h3 style={{ fontSize: 17, fontWeight: 800, margin: 0 }}>Thông báo</h3>
          <button type="button" onClick={onClose} aria-label="Đóng" style={{ background: "none", border: 0, cursor: "pointer", color: "#64748b" }}>
            <X size={20} />
          </button>
        </div>
        {!session.active ? (
          <div style={{ textAlign: "center", padding: "12px 4px 6px" }}>
            <p style={{ fontSize: 14, color: "#475569", margin: "0 0 14px" }}>Đăng nhập bằng số điện thoại đã đặt vé để nhận thông báo từ nhà xe.</p>
            <button type="button" style={primary} onClick={onSignIn}>
              Đăng nhập
            </button>
          </div>
        ) : session.notes.length === 0 ? (
          <p style={{ fontSize: 14, color: "#64748b", textAlign: "center", padding: 16 }}>Chưa có thông báo nào.</p>
        ) : (
          <ul className="go-notif-list">
            {session.notes.map((n) => (
              <li key={n.id} className={n.read ? "" : "unread"}>
                <Bell size={16} />
                <div>
                  <strong>{n.title}</strong>
                  <p>{n.body}</p>
                  <time>{new Date(n.createdAt).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" })}</time>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

/** Account tab: sign in, forced password change, then profile. */
export const AccountPanel: React.FC<{ session: CustomerSession; onOpenTicket: (b: Booking) => void; onOpenNotes: () => void }> = ({ session, onOpenTicket, onOpenNotes }) => {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [next, setNext] = useState("");
  const [again, setAgain] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState("");

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError("");
    try {
      await fn();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  if (!session.ready) return <p style={{ textAlign: "center", color: "#64748b" }}>Đang tải…</p>;

  if (!session.customer) {
    return (
      <form
        style={card}
        onSubmit={(e) => {
          e.preventDefault();
          void run(async () => {
            await session.login(phone, password);
            setPassword("");
          });
        }}
      >
        <h3 style={{ margin: "0 0 4px", fontSize: 17 }}>Đăng nhập</h3>
        <p style={{ margin: "0 0 14px", fontSize: 13, color: "#64748b" }}>Tài khoản được tạo tự động khi bạn đặt vé. Tên đăng nhập là số điện thoại đặt vé.</p>
        <label style={{ display: "block", marginBottom: 10 }}>
          <span style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Số điện thoại</span>
          <input style={field} type="tel" inputMode="tel" autoComplete="username" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="09xx xxx xxx" required />
        </label>
        <label style={{ display: "block", marginBottom: 12 }}>
          <span style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Mật khẩu</span>
          <input style={field} type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </label>
        {error && <div role="alert" style={{ ...errorBox, marginBottom: 12 }}>{error}</div>}
        <button type="submit" style={primary} disabled={busy}>
          {busy ? "Đang đăng nhập…" : "Đăng nhập"}
        </button>
      </form>
    );
  }

  if (session.customer.mustChangePassword) {
    return (
      <form
        style={card}
        onSubmit={(e) => {
          e.preventDefault();
          if (next.length < 8) return setError("Mật khẩu mới cần ít nhất 8 ký tự.");
          if (next !== again) return setError("Hai lần nhập mật khẩu mới chưa giống nhau.");
          void run(async () => {
            await session.changePassword(password, next);
            setPassword("");
            setNext("");
            setAgain("");
            setDone("Đã đổi mật khẩu. Từ giờ hãy đăng nhập bằng mật khẩu mới.");
          });
        }}
      >
        <div className="go-account-warn" style={{ marginTop: 0 }}>
          <KeyRound size={15} /> Bạn đang dùng mật khẩu tạm. Hãy đổi mật khẩu để tiếp tục.
        </div>
        {(
          [
            ["Mật khẩu tạm hiện tại", password, setPassword, "current-password"],
            ["Mật khẩu mới (ít nhất 8 ký tự)", next, setNext, "new-password"],
            ["Nhập lại mật khẩu mới", again, setAgain, "new-password"],
          ] as const
        ).map(([label, value, setter, ac]) => (
          <label key={label} style={{ display: "block", margin: "10px 0" }}>
            <span style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{label}</span>
            <input style={field} type="password" autoComplete={ac} value={value} onChange={(e) => setter(e.target.value)} required />
          </label>
        ))}
        {error && <div role="alert" style={{ ...errorBox, marginBottom: 12 }}>{error}</div>}
        <button type="submit" style={primary} disabled={busy}>
          {busy ? "Đang lưu…" : "Đổi mật khẩu"}
        </button>
        <button type="button" onClick={() => void session.logout()} style={{ ...primary, background: "transparent", color: "#475569", marginTop: 6 }}>
          Đăng xuất
        </button>
      </form>
    );
  }

  return (
    <>
      {done && (
        <div role="status" style={{ ...card, background: "#ecfdf5", borderColor: "#bbf7d0", color: "#166534", fontSize: 13, fontWeight: 600, display: "flex", gap: 8 }}>
          <CheckCircle2 size={17} /> {done}
        </div>
      )}
      <div style={card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <strong style={{ fontSize: 16 }}>{session.customer.name}</strong>
            <div style={{ fontSize: 13, color: "#64748b" }}>{session.customer.phone}</div>
          </div>
          <button type="button" onClick={onOpenNotes} className="go-account-bell" aria-label={`Thông báo${session.unread ? `, ${session.unread} chưa đọc` : ""}`}>
            <Bell size={18} />
            {session.unread > 0 && <span>{session.unread}</span>}
          </button>
        </div>
      </div>
      <div style={card}>
        <h3 style={{ margin: "0 0 10px", fontSize: 15 }}>Vé trong tài khoản ({session.bookings.length})</h3>
        {session.bookings.length === 0 ? (
          <p style={{ fontSize: 13, color: "#64748b", margin: 0 }}>Chưa có vé nào.</p>
        ) : (
          session.bookings.slice(0, 10).map((b) => (
            <button key={b.id} type="button" className="go-account-ticket" onClick={() => onOpenTicket(b)}>
              <Ticket size={16} />
              <span>
                <b>
                  {b.trip.from} → {b.trip.to}
                </b>
                <small>
                  {b.trip.departureTime} · {b.date.split("-").reverse().join("/")} · {b.id}
                </small>
              </span>
            </button>
          ))
        )}
      </div>
      <button type="button" onClick={() => void session.logout()} style={{ ...primary, background: "#ffffff", color: "#b42318", border: "1px solid #fecaca" }}>
        <LogOut size={15} style={{ verticalAlign: -2 }} /> Đăng xuất
      </button>
    </>
  );
};
