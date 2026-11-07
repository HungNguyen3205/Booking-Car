import { useState } from "react";
import { Briefcase, X } from "lucide-react";
import type { CustomerSession } from "./useCustomerSession";

/**
 * Operator staff sign in on the app with their Studio email + password:
 * chủ nhà xe / quản lý -> "Quản lý" tab, tài xế / lơ xe -> crew screens.
 * Accounts are created in Studio → Nhân sự & phân quyền.
 */
export function StaffLoginSheet({ session, onClose }: { session: CustomerSession; onClose: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  return (
    <div className="go-modal-backdrop" onClick={onClose}>
      <div className="go-bottom-sheet" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Đăng nhập nhân viên nhà xe">
        <div className="go-sheet-handle" />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <h3 style={{ fontSize: 17, fontWeight: 800, margin: 0, color: "#0f172a", display: "flex", gap: 8, alignItems: "center" }}>
            <Briefcase size={18} color="var(--go-primary-text)" /> Nhân viên nhà xe
          </h3>
          <button type="button" onClick={onClose} aria-label="Đóng" style={{ background: "none", border: 0, cursor: "pointer", color: "#64748b" }}>
            <X size={20} />
          </button>
        </div>
        <p style={{ fontSize: 12.5, color: "#64748b", margin: "0 0 14px", lineHeight: 1.5 }}>
          Chủ nhà xe, tài xế, lơ xe đăng nhập bằng email và mật khẩu được cấp trong Studio. Khách hàng đăng nhập bằng số điện thoại ở mục Tài khoản.
        </p>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            setError("");
            try {
              await session.staffLogin(email, password);
              onClose();
            } catch (err) {
              setError((err as Error).message);
            } finally {
              setBusy(false);
            }
          }}
          style={{ display: "grid", gap: 10 }}
        >
          <input className="go-input" type="email" required autoComplete="username" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input className="go-input" type="password" required autoComplete="current-password" placeholder="Mật khẩu" value={password} onChange={(e) => setPassword(e.target.value)} />
          {error && <p role="alert" style={{ color: "#b91c1c", fontSize: 13, margin: 0 }}>{error}</p>}
          <button type="submit" className="go-btn-primary" disabled={busy}>
            <span>{busy ? "Đang đăng nhập…" : "Đăng nhập"}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
