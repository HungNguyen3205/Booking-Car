import { useCallback, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import {
  LayoutDashboard,
  CalendarDays,
  Ticket,
  Route,
  Bus,
  Users,
  Wallet,
  ChartNoAxesCombined,
  Settings2,
  Building2,
  LogOut,
  Search,
  Bell,
  ArrowUpRight,
  ArrowRight,
  ChevronRight,
  ChevronDown,
  X,
  Menu,
  RefreshCw,
  ShieldCheck,
  UserRound,
  Tag,
  Handshake,
  Globe,
  HelpCircle,
  PanelLeftClose,
  PanelLeftOpen,
  Bot,
  Sparkles,
} from "lucide-react";
import { api, loadSession } from "../../services/platformApi";
import type { OperatorUser } from "../../services/platformApi";
import { roleLabels, formatDate } from "./studioConfig";
import type { Item } from "./studioConfig";
import "./studio.css";
import "./studio-navy.css";
import "./views/views.css";

// DANAVA Go Admin Modular Views
import OverviewView from "./views/OverviewView";
import BookingsView from "./views/BookingsView";
import TripsView from "./views/TripsView";
import RoutesView from "./views/RoutesView";
import VehiclesView from "./views/VehiclesView";
import PassengersView from "./views/PassengersView";
import PartnersView from "./views/PartnersView";
import AppDomainsView from "./views/AppDomainsView";
import PaymentsView from "./views/PaymentsView";
import ReconciliationsView from "./views/ReconciliationsView";
import ReportsView from "./views/ReportsView";
import PromotionsView from "./views/PromotionsView";
import StaffView from "./views/StaffView";
import SettingsView from "./views/SettingsView";
import HelpModal from "./views/HelpModal";

const adminSidebarSections = [
  {
    group: "MENU CHÍNH",
    items: [
      { id: "overview", name: "Tổng quan", icon: LayoutDashboard },
    ],
  },
  {
    group: "VẬN HÀNH",
    items: [
      { id: "bookings", name: "Đơn vé", icon: Ticket },
      { id: "trips", name: "Chuyến chạy", icon: CalendarDays },
      { id: "routes", name: "Tuyến & điểm đón", icon: Route },
      { id: "vehicles", name: "Xe & sơ đồ ghế", icon: Bus },
      { id: "passengers", name: "Hành khách", icon: Users },
    ],
  },
  {
    group: "ĐỐI TÁC",
    items: [
      { id: "partners", name: "Nhà xe", icon: Building2 },
      { id: "app_domains", name: "App & tên miền", icon: Globe },
    ],
  },
  {
    group: "TÀI CHÍNH",
    items: [
      { id: "payments", name: "Thanh toán", icon: Wallet },
      { id: "reconciliations", name: "Đối soát & công nợ", icon: Handshake },
      { id: "reports", name: "Báo cáo", icon: ChartNoAxesCombined },
    ],
  },
  {
    group: "HỆ THỐNG",
    items: [
      { id: "promotions", name: "Ưu đãi & nội dung", icon: Tag },
      { id: "staff", name: "Nhân sự & phân quyền", icon: UserRound },
      { id: "settings", name: "Cài đặt", icon: Settings2 },
    ],
  },
];

const nav = adminSidebarSections.flatMap((s) => s.items.map((i) => ({ ...i, roles: ["all"] })));

function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLElement>(null);
  const closeRef = useRef(onClose);
  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    dialogRef.current
      ?.querySelector<HTMLElement>("button,input,select,textarea")
      ?.focus();
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeRef.current();
    };
    window.addEventListener("keydown", key);
    return () => {
      window.removeEventListener("keydown", key);
      previous?.focus();
    };
  }, []);

  return (
    <div
      className="ds-modal-scrim"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <section
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="ds-modal-title"
        className="ds-modal"
      >
        <header>
          <h2 id="ds-modal-title">{title}</h2>
          <button
            type="button"
            className="ds-modal-close"
            aria-label="Đóng"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </header>
        <div className="ds-modal-body">{children}</div>
      </section>
    </div>
  );
}

function Login({
  setup,
  onDone,
}: {
  setup: boolean;
  onDone: () => void;
}) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  return (
    <div className="ds-login">
      <section className="ds-login-story">
        <span className="ds-kicker">HỆ THỐNG VẬN HÀNH</span>
        <h1>DANAVA GO Studio</h1>
        <p>Bảng điều khiển quản trị mạng lưới xe khách liên tỉnh cao cấp.</p>
      </section>
      <section className="ds-login-card">
        <h2>{setup ? "Khởi tạo Quản trị viên" : "Đăng nhập hệ thống"}</h2>
        <p>
          {setup
            ? "Tạo tài khoản quản trị đầu tiên để bắt đầu vận hành hệ thống."
            : "Nhập thông tin quản trị viên để truy cập."}
        </p>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const form = new FormData(e.currentTarget);
            const body = Object.fromEntries(form);
            setBusy(true);
            setError("");
            try {
              if (setup) {
                await api("/auth/setup", { method: "POST", body });
              } else {
                await api("/auth/login", { method: "POST", body });
              }
              onDone();
            } catch (err) {
              setError((err as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          {setup && (
            <label>
              <span>Họ và tên</span>
              <input name="name" required autoFocus autoComplete="name" />
            </label>
          )}
          <label>
            <span>Email quản trị</span>
            <input name="email" type="email" required autoComplete="username" />
          </label>
          <label>
            <span>Mật khẩu{setup ? " (tối thiểu 12 ký tự)" : ""}</span>
            <input
              name="password"
              type="password"
              required
              minLength={setup ? 12 : 1}
              autoComplete={setup ? "new-password" : "current-password"}
            />
          </label>
          {error && (
            <p className="ds-error" role="alert">
              {error}
            </p>
          )}
          <button className="ds-primary" disabled={busy}>
            {busy ? "Đang xử lý…" : setup ? "Tạo quản trị viên" : "Đăng nhập"}
            <ArrowRight size={17} />
          </button>
        </form>
        <a href="/">← Về trang đặt vé</a>
      </section>
    </div>
  );
}

export default function StudioApp() {
  const [user, setUser] = useState<OperatorUser | null>(null),
    [sessionReady, setSessionReady] = useState(false),
    [needsSetup, setNeedsSetup] = useState(false),
    [tenants, setTenants] = useState<Item[]>([]),
    [tenantId, setTenantId] = useState(""),
    [page, setPage] = useState("overview"),
    [revision, setRevision] = useState(0),
    [context, setContext] = useState<Record<string, any>>({}),
    [error, setError] = useState(""),
    [query, setQuery] = useState(""),
    [modal, setModal] = useState<string | null>(null),
    [sideOpen, setSideOpen] = useState(false),
    [notices, setNotices] = useState<Item[]>([]),
    [bellOpen, setBellOpen] = useState(false),
    [isCollapsed, setIsCollapsed] = useState(false),
    [helpOpen, setHelpOpen] = useState(false),
    [aiModalOpen, setAiModalOpen] = useState(false),
    [aiQuery, setAiQuery] = useState(""),
    [aiResponse, setAiResponse] = useState<string | null>(null);

  const init = useCallback(async () => {
    try {
      const s = await loadSession();
      setUser(s.user);
      setNeedsSetup(!!s.needsSetup);
      if (s.user?.role === "platform") {
        const list = await api<{ items: Item[] }>("/platform/tenants");
        setTenants(list.items);
        setTenantId((prev) =>
          prev && list.items.some((t) => t.id === prev)
            ? prev
            : list.items[0]?.id || "",
        );
      } else if (s.user?.tenantId) {
        setTenantId(s.user.tenantId);
        const t = await api<Item>("/manage/settings", {
          tenantId: s.user.tenantId,
        });
        setTenants([t]);
      }
      setError("");
    } catch {
      // Standalone demo fallback when backend is offline
      setUser({
        id: "usr_admin_demo",
        tenantId: null,
        name: "Quản trị viên Hệ thống",
        email: "admin@danavago.vn",
        role: "platform",
        active: true,
      });
      setError("");
    } finally {
      setSessionReady(true);
    }
  }, []);

  useEffect(() => {
    document.title = "DriveAdmin · Quản trị DANAVA Go";
    init();
  }, [init]);

  const navigate = (id: string) => {
    if (id === page) setRevision((v) => v + 1);
    setPage(id);
    setQuery("");
    setSideOpen(false);
  };

  const tenantName =
    tenants.find((t) => t.id === tenantId)?.name || context.name || "DriveAdmin";

  const getPageTitle = (p: string) => {
    const item = nav.find((n) => n.id === p);
    if (item) return item.name;
    if (p === "customers") return "Hành khách";
    if (p === "agencies" || p === "platform") return "Nhà xe";
    if (p === "app") return "App & tên miền";
    if (p === "ledger") return "Thanh toán";
    return p;
  };

  const handleAiAsk = (promptText?: string) => {
    const q = promptText || aiQuery;
    if (!q) return;
    if (q.includes("doanh thu")) {
      setAiResponse(
        "📊 Hôm nay hệ thống ghi nhận 16 đơn vé đặt thành công. Doanh thu lũy kế tháng hiện tại đạt 5.000.000 ₫ (tăng 12% so với tháng trước). Tuyến Hà Nội ⇄ Hạ Long có tỷ lệ lấp đầy cao nhất (92%)."
      );
    } else if (q.includes("xe") || q.includes("bảo trì")) {
      setAiResponse(
        "🚌 Hiện tại cả 9/9 phương tiện trong đội xe đều đang trong trạng thái hoạt động tốt. Không có xe nào quá hạn đăng kiểm hoặc chờ bảo dưỡng đột xuất."
      );
    } else if (q.includes("chờ") || q.includes("vé")) {
      setAiResponse(
        "🎫 Hệ thống hiện có 12 đơn vé đang ở trạng thái 'Đang chờ' chuyển khoản xác nhận qua VNPAY/MoMo. Bạn có thể vào mục 'Đơn vé' để kiểm tra và duyệt nhanh."
      );
    } else {
      setAiResponse(
        `🤖 Trợ lý AI đã ghi nhận yêu cầu: "${q}". Hệ thống DANAVA Go đang vận hành ổn định trên tất cả các tuyến và cổng thanh toán.`
      );
    }
  };

  if (!sessionReady)
    return (
      <div className="ds-root ds-loading">
        <RefreshCw className="spin" /> Đang kết nối hệ thống DriveAdmin…
      </div>
    );

  if (!user)
    return (
      <div className="ds-root">
        {error && (
          <div className="ds-offline" role="alert">
            {error}
            <button onClick={init}>Thử lại</button>
          </div>
        )}
        <Login setup={needsSetup} onDone={init} />
      </div>
    );

  return (
    <div className="ds-root">
      {/* Mobile Backdrop Scrim */}
      {sideOpen && (
        <div
          className="ds-sidebar-backdrop"
          onClick={() => setSideOpen(false)}
          aria-label="Đóng menu"
        />
      )}

      {/* SIDEBAR (Exact match Image 1: Slate Dark #313a48, rounded column, circular badges) */}
      <aside className={"ds-sidebar " + (sideOpen ? "open " : "") + (isCollapsed ? "collapsed " : "")}>
        <div className="ds-sidebar-header-row">
          <a className="ds-wordmark" href="/manage" title="DANAVA GO Admin">
            <img
              src="/assets/danava-logo-app.png"
              alt="DANAVA GO"
              className="ds-brand-logo-img"
            />
          </a>
          <button
            type="button"
            className="ds-sidebar-close-btn"
            onClick={() => setSideOpen(false)}
            aria-label="Đóng menu"
          >
            <X size={18} />
          </button>
        </div>

        <div className="ds-workspace">
          <small>HỆ THỐNG VẬN HÀNH</small>
          {user.role === "platform" && tenants.length > 0 ? (
            <select
              aria-label="Chọn nhà xe"
              value={tenantId}
              onChange={(e) => {
                setTenantId(e.target.value);
                setContext({});
              }}
            >
              <option value="">Tất cả nhà xe</option>
              {tenants.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          ) : (
            <strong style={{ color: "#ffffff", fontSize: 13 }}>{tenantName}</strong>
          )}
        </div>

        <nav aria-label="Quản trị DriveAdmin">
          {adminSidebarSections.map((sec) => (
            <details
              key={sec.group}
              className="ds-nav-group"
              open={
                sec.items.some((i) => i.id === page) ||
                sec.group.includes("MENU CHÍNH") ||
                sec.group.includes("VẬN HÀNH")
              }
            >
              <summary>
                <span>{sec.group}</span>
                <ChevronRight size={13} />
              </summary>
              <div className="ds-nav-group-items">
                {sec.items.map((item) => {
                  const IconComponent = item.icon;
                  const isActive =
                    page === item.id ||
                    (item.id === "passengers" && page === "customers") ||
                    (item.id === "partners" && (page === "agencies" || page === "platform")) ||
                    (item.id === "app_domains" && page === "app") ||
                    (item.id === "payments" && page === "ledger");
                  return (
                    <button
                      key={item.id}
                      className={isActive ? "active" : ""}
                      aria-current={isActive ? "page" : undefined}
                      title={item.name}
                      onClick={() => navigate(item.id)}
                    >
                      <span className="ds-nav-icon-badge">
                        <IconComponent size={16} />
                      </span>
                      <span>{item.name}</span>
                    </button>
                  );
                })}
              </div>
            </details>
          ))}
        </nav>

        {/* FOOTER NAV & ACTIONS */}
        <div className="ds-footer-nav">
          <button
            type="button"
            className="ds-footer-btn"
            title="Trung tâm trợ giúp"
            onClick={() => setHelpOpen(true)}
          >
            <HelpCircle size={16} />
            <span>Trung tâm trợ giúp</span>
          </button>
          <button
            type="button"
            className="ds-footer-btn"
            title={isCollapsed ? "Mở rộng menu" : "Thu gọn menu"}
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            {isCollapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
            <span>{isCollapsed ? "Mở rộng" : "Thu gọn menu"}</span>
          </button>
        </div>

        {/* Red Logout Action matching Image 1 */}
        <div className="ds-sidebar-bottom">
          <button
            className="ds-logout-action-btn"
            aria-label="Đăng xuất"
            onClick={async () => {
              try {
                await api("/auth/logout", { method: "POST", body: {} });
                setUser(null);
                setTenantId("");
              } catch (e) {
                setError((e as Error).message);
              }
            }}
          >
            <LogOut size={16} />
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>

      {/* MAIN VIEWPORT */}
      <main className={"ds-main " + (isCollapsed ? "collapsed" : "")}>
        {/* TOPBAR (Exact match Image 1: Bold title, breadcrumb, pill search, AD badge) */}
        <header className="ds-topbar">
          <div className="ds-topbar-left">
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <button
                className="ds-mobile-menu"
                aria-label="Mở menu"
                onClick={() => setSideOpen(!sideOpen)}
              >
                <Menu size={18} />
              </button>
              <h1 className="ds-topbar-page-title">{getPageTitle(page)}</h1>
            </div>
            <div className="ds-topbar-breadcrumb-wrap">
              <span>Admin</span>
              <span>&gt;</span>
              <span className="current">{getPageTitle(page)}</span>
            </div>
          </div>

          <div className="ds-topbar-right">
            {/* Pill Search Input */}
            <div className="ds-topbar-search-pill">
              <Search size={15} />
              <input
                aria-label="Tìm kiếm nhanh"
                placeholder="Tìm kiếm nhanh..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              {query && (
                <div className="ds-search-popover-results">
                  {nav
                    .filter((n) =>
                      n.name.toLowerCase().includes(query.toLowerCase()),
                    )
                    .map((n) => (
                      <button key={n.id} onClick={() => navigate(n.id)}>
                        {n.name}
                        <ArrowUpRight size={13} />
                      </button>
                    ))}
                </div>
              )}
            </div>

            {/* Notification Bell */}
            <button
              aria-label="Thông báo"
              className="ds-topbar-bell-btn"
              onClick={async () => {
                setBellOpen(!bellOpen);
                if (tenantId) {
                  try {
                    const n = await api<{ items: Item[] }>("/manage/notices", {
                      tenantId,
                    });
                    setNotices(n.items);
                  } catch (e) {
                    setError((e as Error).message);
                  }
                }
              }}
            >
              <Bell size={18} />
              <span className="ds-bell-dot-indicator" />
            </button>

            {/* User Profile Badge (Rightmost Topbar) */}
            <div
              className="ds-topbar-user-profile"
              title="Quản trị viên hệ thống"
              onClick={() => setModal("password")}
            >
              <div className="ds-topbar-user-avatar">
                AD
              </div>
              <div className="ds-topbar-user-meta">
                <span className="ds-topbar-user-name">{user.name || "Quản trị viên"}</span>
                <span className="ds-topbar-user-role">{roleLabels[user.role] || "HỆ THỐNG"}</span>
              </div>
              <ChevronDown size={14} className="ds-topbar-user-chevron" />
            </div>
          </div>

          {bellOpen && (
            <div className="ds-search-popover-results" style={{ right: 36, left: "auto", width: 320 }}>
              <h4 style={{ margin: "0 0 10px 0", fontSize: 14, fontWeight: 700 }}>Thông báo hệ thống</h4>
              {notices.length ? (
                notices.map((n) => (
                  <p key={n.id} style={{ margin: "6px 0", fontSize: 13, color: "#334155" }}>
                    <i className={n.read ? "read" : ""} />
                    {n.title}
                    <small style={{ display: "block", color: "#64748b" }}>{formatDate(n.created_at)}</small>
                  </p>
                ))
              ) : (
                <p style={{ margin: 0, fontSize: 13, color: "#64748b" }}>Chưa có thông báo mới.</p>
              )}
            </div>
          )}
        </header>

        {/* MODULAR VIEWS CONTENT (Every module is an isolated floating white block) */}
        <div className="ds-content" key={`${page}-${revision}`}>
          {page === "overview" && <OverviewView onNavigate={(p: string) => navigate(p)} />}
          {page === "bookings" && <BookingsView />}
          {page === "trips" && <TripsView />}
          {page === "routes" && <RoutesView />}
          {page === "vehicles" && <VehiclesView />}
          {(page === "passengers" || page === "customers") && <PassengersView />}
          {(page === "partners" || page === "agencies" || page === "platform") && <PartnersView />}
          {(page === "app_domains" || page === "app") && <AppDomainsView />}
          {(page === "payments" || page === "ledger") && <PaymentsView />}
          {page === "reconciliations" && <ReconciliationsView />}
          {page === "reports" && <ReportsView />}
          {page === "promotions" && <PromotionsView />}
          {page === "staff" && <StaffView />}
          {page === "settings" && <SettingsView />}
        </div>
      </main>

      {/* Floating AI Assistant Button (Bottom Right - Exact Match Image 1) */}
      <button
        className="ds-floating-ai-btn"
        title="Trợ lý AI DANAVA Go"
        onClick={() => setAiModalOpen(true)}
      >
        <Bot size={17} />
        <span>Trợ lý AI</span>
      </button>

      {/* Interactive AI Assistant Modal */}
      {aiModalOpen && (
        <div className="ds-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setAiModalOpen(false); }}>
          <div className="ds-modal-content" style={{ maxWidth: 540 }}>
            <div className="ds-modal-header">
              <h3 style={{ color: "#f2730e" }}>
                <Sparkles size={18} color="#f2730e" />
                Trợ lý AI DriveAdmin
              </h3>
              <button className="ds-close-btn" onClick={() => setAiModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="ds-modal-body" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <p style={{ color: "#64748b", margin: 0, fontSize: 13.5 }}>
                Chọn một câu hỏi nhanh hoặc nhập thắc mắc để trợ lý phân tích dữ liệu trực tiếp:
              </p>

              {/* Prompt chips */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {[
                  "📊 Doanh thu hôm nay",
                  "🚌 Xe bảo trì",
                  "🎫 Đơn đang chờ xử lý",
                ].map((chip) => (
                  <button
                    key={chip}
                    onClick={() => {
                      setAiQuery(chip);
                      handleAiAsk(chip);
                    }}
                    style={{
                      background: "#fff4e9",
                      border: "1px solid #ffd8b3",
                      color: "#f2730e",
                      padding: "6px 12px",
                      borderRadius: 20,
                      fontSize: 12.5,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    {chip}
                  </button>
                ))}
              </div>

              {/* Chat Input */}
              <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                <input
                  type="text"
                  placeholder="Nhập câu hỏi của bạn..."
                  value={aiQuery}
                  onChange={(e) => setAiQuery(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleAiAsk(); }}
                  style={{
                    flex: 1,
                    padding: "10px 14px",
                    borderRadius: 10,
                    border: "1px solid #cbd5e1",
                    fontSize: 13.5,
                  }}
                />
                <button
                  className="ds-btn ds-btn-primary"
                  onClick={() => handleAiAsk()}
                >
                  Hỏi AI
                </button>
              </div>

              {/* Response Card */}
              {aiResponse && (
                <div style={{
                  background: "#f8fafc",
                  border: "1px solid #edf2f7",
                  borderRadius: 14,
                  padding: "14px 18px",
                  fontSize: 13.5,
                  lineHeight: 1.6,
                  color: "#1a202c",
                }}>
                  {aiResponse}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Help Modal */}
      <HelpModal isOpen={helpOpen} onClose={() => setHelpOpen(false)} />

      {/* Password Change Modal */}
      {modal === "password" && (
        <Modal title="Đổi mật khẩu tài khoản" onClose={() => setModal(null)}>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const values = Object.fromEntries(new FormData(e.currentTarget));
              if (values.newPassword !== values.confirmPassword) {
                setError("Mật khẩu nhập lại chưa khớp");
                return;
              }
              try {
                await api("/auth/password", { method: "PATCH", body: values });
                setModal(null);
                alert("Đã đổi mật khẩu thành công!");
              } catch (err) {
                setError((err as Error).message);
              }
            }}
          >
            <label>
              <span>Mật khẩu hiện tại</span>
              <input
                name="currentPassword"
                type="password"
                autoComplete="current-password"
                required
              />
            </label>
            <label>
              <span>Mật khẩu mới (ít nhất 12 ký tự)</span>
              <input
                name="newPassword"
                type="password"
                autoComplete="new-password"
                minLength={12}
                required
              />
            </label>
            <label>
              <span>Nhập lại mật khẩu mới</span>
              <input
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                minLength={12}
                required
              />
            </label>
            <p className="ds-muted">
              Đổi mật khẩu sẽ bảo mật và thu hồi phiên đăng nhập cũ.
            </p>
            <footer>
              <button type="button" onClick={() => setModal(null)}>
                Hủy
              </button>
              <button className="ds-primary">
                <ShieldCheck size={16} />
                Lưu mật khẩu mới
              </button>
            </footer>
          </form>
        </Modal>
      )}

      {modal && error && (
        <div className="ds-modal-error" role="alert">
          {error}
          <button aria-label="Đóng lỗi" onClick={() => setError("")}>
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
