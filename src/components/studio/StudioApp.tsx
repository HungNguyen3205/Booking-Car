import AppBrandSettings from "./AppBrandSettings";
import { useCallback, useEffect, useRef, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import {
  LayoutDashboard,
  CalendarDays,
  Ticket,
  Route,
  Bus,
  Users,
  BadgeCheck,
  Wallet,
  ChartNoAxesCombined,
  Settings2,
  Building2,
  LogOut,
  Search,
  Bell,
  Plus,
  ArrowUpRight,
  ArrowRight,
  ChevronRight,
  Download,
  X,
  Menu,
  RefreshCw,
  Pencil,
  Trash2,
  ShieldCheck,
  FileText,
  UserRound,
  Tag,
  Handshake,
  ListChecks,
} from "lucide-react";
import { api, loadSession, downloadReport } from "../../services/platformApi";
import type { OperatorUser } from "../../services/platformApi";
import {
  modules,
  money,
  formatDate,
  roleLabels,
  statuses,
} from "./studioConfig";
import type { Item } from "./studioConfig";
import "./studio.css";
const tomorrow = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(d);
};
const unique = () =>
  Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) =>
    b.toString(16).padStart(2, "0"),
  ).join("");
const nav = [
  { id: "app", name: "App & Tên miền", icon: Bus, roles: ["owner", "manager"] },
  { id: "overview", name: "Tổng quan", icon: LayoutDashboard, roles: ["all"] },
  { id: "trips", name: "Điều hành chuyến", icon: CalendarDays, roles: ["all"] },
  { id: "bookings", name: "Bán vé & Đơn vé", icon: Ticket, roles: ["all"] },
  {
    id: "routes",
    name: "Tuyến & Điểm đón",
    icon: Route,
    roles: ["owner", "manager", "dispatcher", "sales", "accountant"],
  },
  {
    id: "vehicles",
    name: "Đội xe",
    icon: Bus,
    roles: ["owner", "manager", "dispatcher", "sales", "accountant"],
  },
  {
    id: "drivers",
    name: "Tài xế",
    icon: BadgeCheck,
    roles: ["owner", "manager", "dispatcher", "sales", "accountant"],
  },
  {
    id: "customers",
    name: "Khách hàng",
    icon: Users,
    roles: ["owner", "manager", "sales", "accountant"],
  },
  {
    id: "staff",
    name: "Nhân sự & Quyền",
    icon: UserRound,
    roles: ["owner", "manager"],
  },
  {
    id: "ledger",
    name: "Thu chi",
    icon: Wallet,
    roles: ["owner", "manager", "accountant", "sales"],
  },
  {
    id: "reports",
    name: "Báo cáo & Đối soát",
    icon: ChartNoAxesCombined,
    roles: ["owner", "manager", "accountant"],
  },
  {
    id: "agencies",
    name: "Đại lý",
    icon: Handshake,
    roles: ["owner", "manager", "accountant", "sales"],
  },
  {
    id: "promotions",
    name: "Ưu đãi",
    icon: Tag,
    roles: ["owner", "manager", "sales", "accountant"],
  },
  {
    id: "shifts",
    name: "Ca trực & Phụ cấp",
    icon: ListChecks,
    roles: ["owner", "manager", "dispatcher"],
  },
  {
    id: "branches",
    name: "Văn phòng",
    icon: Building2,
    roles: ["owner", "manager", "dispatcher", "sales", "accountant"],
  },
  { id: "audit", name: "Nhật ký", icon: FileText, roles: ["owner", "manager"] },
  {
    id: "settings",
    name: "Cài đặt nhà xe",
    icon: Settings2,
    roles: ["owner", "manager"],
  },
];
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
      if (e.key === "Tab") {
        const nodes = Array.from(
          dialogRef.current?.querySelectorAll<HTMLElement>(
            "button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),a[href]",
          ) || [],
        );
        const first = nodes[0],
          last = nodes.at(-1);
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("keydown", key);
      previous?.focus();
    };
  }, []);
  return (
    <div
      className="ds-modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <section
        className="ds-modal"
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <header>
          <h2>{title}</h2>
          <button aria-label="Đóng" onClick={onClose}>
            <X size={21} />
          </button>
        </header>
        {children}
      </section>
    </div>
  );
}
function Badge({ value }: { value: unknown }) {
  const v = String(value || "draft");
  return <span className={"ds-badge " + v}>{statuses[v] || v}</span>;
}
function Empty({
  title = "Chưa có dữ liệu",
  children,
}: {
  title?: string;
  children?: ReactNode;
}) {
  return (
    <div className="ds-empty">
      <Bus size={32} />
      <h3>{title}</h3>
      <p>{children || "Tạo dữ liệu đầu tiên để bắt đầu vận hành."}</p>
    </div>
  );
}
function Chart({ days }: { days: Item[] }) {
  const max = Math.max(0, ...days.map((d) => Math.abs(d.value)));
  if (!max)
    return (
      <div className="ds-chart ds-chart-empty" role="status">
        Chưa có khoản thu/hoàn trong 7 ngày.
      </div>
    );
  return (
    <div className="ds-chart" role="img" aria-label="Tiền thu ròng 7 ngày">
      <div className="ds-chart-axis">
        <span>{money(max)}</span>
        <span>0đ</span>
      </div>
      <div className="ds-chart-bars">
        {days.map((d) => (
          <div key={d.date}>
            <span
              className="ds-chart-bar"
              style={{
                height: `${(Math.abs(d.value) / max) * 100}%`,
              }}
              title={`${d.date}: ${money(d.value)}`}
            />
            <small>{String(d.date).slice(5).replace("-", "/")}</small>
          </div>
        ))}
      </div>
    </div>
  );
}
function Editor({
  kind,
  item,
  tenantId,
  drivers,
  onSaved,
  onClose,
}: {
  kind: string;
  item: Item | null;
  tenantId: string;
  drivers: Item[];
  onSaved: () => void;
  onClose: () => void;
}) {
  const config = modules[kind];
  const [values, setValues] = useState<Record<string, any>>(() => ({
    ...Object.fromEntries(
      config.fields.map((f) => [
        f.key,
        f.type === "checkbox"
          ? f.key === "active"
          : f.type === "select"
            ? f.options?.[0]?.value
            : f.type === "lines"
              ? []
              : "",
      ]),
    ),
    ...item,
  }));
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const set = (k: string, v: unknown) => setValues((s) => ({ ...s, [k]: v }));
  const upload = async (file?: File) => {
    if (!file) return;
    setBusy(true);
    try {
      const data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result).split(",")[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const out = await api<{ url: string }>("/manage/upload", {
        method: "POST",
        tenantId,
        body: { data },
      });
      set("image", out.url);
    } catch (e) {
      setError(String((e as Error).message));
    } finally {
      setBusy(false);
    }
  };
  const save = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    const payload = { ...values };
    config.fields.forEach((f) => {
      if (f.type === "number") payload[f.key] = Number(payload[f.key] || 0);
      if (f.type === "lines" && typeof payload[f.key] === "string")
        payload[f.key] = payload[f.key]
          .split("\n")
          .map((s: string) => s.trim())
          .filter(Boolean);
    });
    try {
      await api("/manage/" + kind + (item ? "/" + item.id : ""), {
        method: item ? "PATCH" : "POST",
        body: payload,
        tenantId,
      });
      onSaved();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal
      title={(item ? "Chỉnh sửa " : "Thêm ") + config.title.toLowerCase()}
      onClose={onClose}
    >
      <form onSubmit={save}>
        <div className="ds-form-grid">
          {config.fields.map((f) => (
            <label
              className={
                ["textarea", "lines", "image", "stops"].includes(f.type || "")
                  ? "wide"
                  : ""
              }
              key={f.key}
            >
              <span>
                {f.label}
                {f.required ? " *" : ""}
              </span>
              {f.type === "stops" ? (
                <div className="ds-stops">
                  {(Array.isArray(values[f.key]) ? values[f.key] : []).map(
                    (s: Item, i: number) => (
                      <div key={i}>
                        <input
                          aria-label={`${f.label} tên ${i + 1}`}
                          placeholder="Tên điểm"
                          required
                          value={s.name || ""}
                          onChange={(e) =>
                            set(
                              f.key,
                              values[f.key].map((v: Item, j: number) =>
                                j === i ? { ...v, name: e.target.value } : v,
                              ),
                            )
                          }
                        />
                        <input
                          aria-label={`${f.label} địa chỉ ${i + 1}`}
                          placeholder="Địa chỉ"
                          required
                          value={s.address || ""}
                          onChange={(e) =>
                            set(
                              f.key,
                              values[f.key].map((v: Item, j: number) =>
                                j === i ? { ...v, address: e.target.value } : v,
                              ),
                            )
                          }
                        />
                        <input
                          aria-label={`${f.label} phút ${i + 1}`}
                          type="number"
                          min={0}
                          placeholder="Phút từ giờ xuất bến"
                          value={s.offset || 0}
                          onChange={(e) =>
                            set(
                              f.key,
                              values[f.key].map((v: Item, j: number) =>
                                j === i
                                  ? { ...v, offset: Number(e.target.value) }
                                  : v,
                              ),
                            )
                          }
                        />
                        <button
                          type="button"
                          aria-label="Xóa điểm"
                          onClick={() =>
                            set(
                              f.key,
                              values[f.key].filter(
                                (_: Item, j: number) => i !== j,
                              ),
                            )
                          }
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ),
                  )}
                  <button
                    className="ds-link"
                    type="button"
                    onClick={() =>
                      set(f.key, [
                        ...(values[f.key] || []),
                        {
                          id: unique(),
                          name: "",
                          address: "",
                          offset:
                            f.key === "dropoffs"
                              ? Number(values.durationMinutes || 0)
                              : 0,
                        },
                      ])
                    }
                  >
                    <Plus size={14} /> Thêm điểm
                  </button>
                  <small>Thời gian tính bằng phút kể từ giờ khởi hành.</small>
                </div>
              ) : f.type === "select" || f.type === "driver-select" ? (
                <select
                  required={f.required}
                  value={values[f.key] || ""}
                  onChange={(e) => set(f.key, e.target.value)}
                >
                  {f.type === "driver-select" && (
                    <option value="">Chọn tài xế</option>
                  )}
                  {(f.type === "driver-select"
                    ? drivers.map((d) => ({ value: d.id, label: d.name }))
                    : f.options || []
                  ).map((o) => (
                    <option value={o.value} key={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              ) : f.type === "checkbox" ? (
                <input
                  type="checkbox"
                  checked={!!values[f.key]}
                  onChange={(e) => set(f.key, e.target.checked)}
                />
              ) : f.type === "textarea" || f.type === "lines" ? (
                <textarea
                  rows={3}
                  value={
                    Array.isArray(values[f.key])
                      ? values[f.key].join("\n")
                      : values[f.key] || ""
                  }
                  onChange={(e) => set(f.key, e.target.value)}
                />
              ) : f.type === "image" ? (
                <>
                  <input
                    value={values.image || ""}
                    placeholder="URL ảnh hoặc tải ảnh bên dưới"
                    onChange={(e) => set("image", e.target.value)}
                  />
                  <input
                    aria-label="Tải ảnh xe"
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={(e) => upload(e.target.files?.[0])}
                  />
                  {values.image && (
                    <img
                      className="ds-image-preview"
                      src={values.image}
                      alt="Ảnh xe xem trước"
                    />
                  )}
                </>
              ) : (
                <input
                  type={f.type || "text"}
                  required={f.required}
                  min={f.min}
                  max={f.max}
                  value={values[f.key] ?? ""}
                  onChange={(e) => set(f.key, e.target.value)}
                />
              )}
            </label>
          ))}
        </div>
        {error && (
          <p className="ds-error" role="alert">
            {error}
          </p>
        )}
        <footer>
          <button type="button" onClick={onClose}>
            Hủy
          </button>
          <button className="ds-primary" disabled={busy}>
            {busy ? "Đang lưu…" : "Lưu dữ liệu"}
          </button>
        </footer>
      </form>
    </Modal>
  );
}
function TripEditor({
  vehicles,
  routes,
  drivers,
  branches,
  tenantId,
  item,
  onSaved,
  onClose,
}: {
  item?: Item | null;
  vehicles: Item[];
  routes: Item[];
  drivers: Item[];
  branches: Item[];
  tenantId: string;
  onSaved: () => void;
  onClose: () => void;
}) {
  const [v, set] = useState({
    vehicleId: item?.vehicleId || vehicles[0]?.id || "",
    routeId: item?.routeId || routes[0]?.id || "",
    driverId: item?.driverId || "",
    branchId: item?.branchId || "",
    date: item?.date || tomorrow(),
    time: item?.departureTime || "08:00",
    price: item?.price || 180000,
    repeatDays: 1,
    code: item?.code || "",
    blockedSeats: item?.blockedSeats || [],
  });
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const field = (k: string, value: string) =>
    set((s) => ({
      ...s,
      [k]: ["price", "repeatDays"].includes(k) ? Number(value) : value,
    }));
  const select = (
    label: string,
    key: string,
    items: Item[],
    required = false,
  ) => (
    <label>
      <span>{label}</span>
      <select
        required={required}
        value={String(v[key as keyof typeof v])}
        onChange={(e) => field(key, e.target.value)}
      >
        <option value="">Chọn…</option>
        {items.map((r) => (
          <option key={r.id} value={r.id}>
            {r.name}
          </option>
        ))}
      </select>
    </label>
  );
  return (
    <Modal
      title={item ? "Chỉnh lịch chuyến" : "Lên lịch chuyến mới"}
      onClose={onClose}
    >
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          try {
            await api("/manage/trips" + (item ? "/" + item.id : ""), {
              method: item ? "PATCH" : "POST",
              tenantId,
              body: v,
            });
            onSaved();
          } catch (e) {
            setError((e as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <div className="ds-form-grid">
          {select("Xe", "vehicleId", vehicles, true)}
          {select("Tuyến", "routeId", routes, true)}
          {select("Tài xế", "driverId", drivers)}
          {select("Văn phòng", "branchId", branches)}
          <label>
            <span>Ngày chạy</span>
            <input
              type="date"
              required
              value={v.date}
              onChange={(e) => field("date", e.target.value)}
            />
          </label>
          <label>
            <span>Giờ xuất bến</span>
            <input
              type="time"
              required
              value={v.time}
              onChange={(e) => field("time", e.target.value)}
            />
          </label>
          <label>
            <span>Giá vé (đ)</span>
            <input
              type="number"
              min={1000}
              required
              value={v.price}
              onChange={(e) => field("price", e.target.value)}
            />
          </label>
          <label>
            <span>
              {item
                ? "Lặp lịch (chỉ khi tạo mới)"
                : "Lặp liên tiếp (1–30 ngày)"}
            </span>
            <input
              type="number"
              min={1}
              max={30}
              disabled={!!item}
              value={v.repeatDays}
              onChange={(e) => field("repeatDays", e.target.value)}
            />
          </label>
        </div>
        <p className="ds-muted">
          Chuyến mới ở trạng thái nháp. Chỉ sửa khi đóng bán và chưa có
          khách/giữ ghế. Server kiểm tra trùng lịch xe/tài xế và hạn đăng kiểm.
        </p>
        {error && (
          <p className="ds-error" role="alert">
            {error}
          </p>
        )}
        <footer>
          <button type="button" onClick={onClose}>
            Hủy
          </button>
          <button disabled={busy} className="ds-primary">
            {busy ? "Đang lưu…" : item ? "Lưu lịch chạy" : "Tạo lịch chạy"}
          </button>
        </footer>
      </form>
    </Modal>
  );
}
function Counter({
  trips,
  agencies,
  tenantId,
  onSaved,
  onClose,
}: {
  trips: Item[];
  agencies: Item[];
  tenantId: string;
  onSaved: () => void;
  onClose: () => void;
}) {
  const [tripId, setTrip] = useState(
      [...trips]
        .filter((t) => t.status === "published")
        .sort((a, b) => a.departAt.localeCompare(b.departAt))[0]?.id || "",
    ),
    [seats, setSeats] = useState<string[]>([]),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const trip = trips.find((t) => t.id === tripId);
  const [key] = useState(unique);
  return (
    <Modal title="Bán vé tại quầy" onClose={onClose}>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget);
          if (!seats.length) return setError("Chọn ít nhất một ghế");
          setBusy(true);
          try {
            await api("/manage/bookings", {
              method: "POST",
              tenantId,
              headers: { "Idempotency-Key": key },
              body: {
                tripId,
                seats,
                agencyId: f.get("agencyId"),
                promoCode: f.get("promoCode"),
                passenger: {
                  fullName: f.get("name"),
                  phone: f.get("phone"),
                  email: f.get("email"),
                  pickupStopId: f.get("pickup"),
                  dropoffStopId: f.get("dropoff"),
                  note: f.get("note"),
                  agreedTerms: f.get("agreed") === "on",
                },
              },
            });
            onSaved();
          } catch (e) {
            setError((e as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <label>
          <span>Chuyến mở bán</span>
          <select
            required
            value={tripId}
            onChange={(e) => {
              setTrip(e.target.value);
              setSeats([]);
            }}
          >
            <option value="">Chọn chuyến</option>
            {trips
              .filter((t) => t.status === "published")
              .map((t) => (
                <option key={t.id} value={t.id}>
                  {t.from} → {t.to} · {t.date} {t.departureTime} · {t.plate}
                </option>
              ))}
          </select>
        </label>
        {trip && (
          <>
            <div className="ds-counter-seats">
              {trip.seats.map((s: Item) => (
                <button
                  type="button"
                  key={s.code}
                  disabled={s.status !== "available"}
                  className={seats.includes(s.code) ? "selected" : ""}
                  onClick={() =>
                    setSeats((a) =>
                      a.includes(s.code)
                        ? a.filter((c) => c !== s.code)
                        : a.length < 5
                          ? [...a, s.code]
                          : a,
                    )
                  }
                >
                  {s.code}
                </button>
              ))}
            </div>
            <div className="ds-form-grid">
              <label>
                <span>Họ tên</span>
                <input required name="name" />
              </label>
              <label>
                <span>Điện thoại</span>
                <input required name="phone" type="tel" />
              </label>
              <label>
                <span>Email (tùy chọn)</span>
                <input name="email" type="email" />
              </label>
              <label>
                <span>Đại lý (tùy chọn)</span>
                <select name="agencyId">
                  <option value="">Bán trực tiếp</option>
                  {agencies.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Điểm đón</span>
                <select name="pickup">
                  {trip.departureStops.map((s: Item) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Điểm trả</span>
                <select name="dropoff">
                  {trip.dropoffStops.map((s: Item) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Mã ưu đãi</span>
                <input name="promoCode" />
              </label>
              <label>
                <span>Ghi chú</span>
                <input name="note" />
              </label>
            </div>
            <label className="ds-check">
              <input name="agreed" type="checkbox" required />
              Khách đã đồng ý chính sách đặt vé.
            </label>
            <p className="ds-muted">
              Tạm tính {money(seats.length * trip.price)}. Giá ưu đãi được
              server xác nhận. Vé mới chưa thu tiền; ghi nhận thu tiền tại mục
              Thu chi.
            </p>
          </>
        )}
        {error && (
          <p className="ds-error" role="alert">
            {error}
          </p>
        )}
        <footer>
          <button type="button" onClick={onClose}>
            Hủy
          </button>
          <button className="ds-primary" disabled={busy || !trip}>
            {busy ? "Đang đặt…" : "Tạo đơn vé"}
          </button>
        </footer>
      </form>
    </Modal>
  );
}
function Login({ setup, onDone }: { setup: boolean; onDone: () => void }) {
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  return (
    <div className="ds-login">
      <div className="ds-login-story">
        <span className="ds-wordmark">
          <span>D</span>DANAVA GO <small>STUDIO</small>
        </span>
        <p>ĐIỀU HÀNH THÔNG MINH</p>
        <h1>
          Mọi hành trình.
          <br />
          Trong tầm tay.
        </h1>
        <span>
          Một không gian cho đội xe, lịch chạy và những khách hàng đang chờ lên
          đường.
        </span>
        <div className="ds-login-chips">
          <span>
            <Bus /> Đội xe
          </span>
          <span>
            <CalendarDays /> Lịch chạy
          </span>
          <span>
            <Ticket /> Bán vé
          </span>
        </div>
      </div>
      <section className="ds-login-card">
        <span className="ds-kicker">DANAVA GO / OPERATOR</span>
        <h2>{setup ? "Thiết lập hệ thống" : "Chào mừng trở lại."}</h2>
        <p>
          {setup
            ? "Tạo quản trị nền tảng đầu tiên. Cần mã thiết lập do chủ server cung cấp."
            : "Đăng nhập vào không gian vận hành của nhà xe."}
        </p>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            setError("");
            const f = Object.fromEntries(new FormData(e.currentTarget));
            try {
              await api("/auth/" + (setup ? "setup" : "login"), {
                method: "POST",
                body: f,
              });
              onDone();
            } catch (e) {
              setError((e as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          {setup && (
            <>
              <label>
                <span>Mã thiết lập server</span>
                <input
                  name="setupToken"
                  type="password"
                  required
                  autoComplete="off"
                />
              </label>
              <label>
                <span>Họ tên</span>
                <input name="name" required autoComplete="name" />
              </label>
            </>
          )}
          <label>
            <span>Email</span>
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
    [seedAllowed, setSeedAllowed] = useState(false),
    [tenants, setTenants] = useState<Item[]>([]),
    [tenantId, setTenantId] = useState(""),
    [page, setPage] = useState("overview"),
    [revision, setRevision] = useState(0),
    [items, setItems] = useState<Item[]>([]),
    [context, setContext] = useState<Record<string, any>>({}),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [loading, setLoading] = useState(false),
    [filter, setFilter] = useState(""),
    [query, setQuery] = useState(""),
    [modal, setModal] = useState<string | null>(null),
    [editing, setEditing] = useState<Item | null>(null),
    [sideOpen, setSideOpen] = useState(false),
    [notices, setNotices] = useState<Item[]>([]),
    [bellOpen, setBellOpen] = useState(false);
  const can = (roles: string[]) =>
    !!user &&
    (user.role === "platform" ||
      roles.includes("all") ||
      roles.includes(user.role));
  const refresh = () => {
    setRevision((v) => v + 1);
    setModal(null);
    setEditing(null);
    setNotice("Đã cập nhật dữ liệu.");
  };
  const init = useCallback(async () => {
    try {
      const s = await loadSession();
      setUser(s.user);
      setNeedsSetup(!!s.needsSetup);
      setSeedAllowed(!!s.demoSeedAllowed);
      if (s.user?.role === "platform") {
        const list = await api<{ items: Item[] }>("/platform/tenants");
        setTenants(list.items);
        setTenantId((prev) =>
          prev && list.items.some((t) => t.id === prev)
            ? prev
            : list.items[0]?.id || "",
        );
        if (!list.items.length) setPage("platform");
      } else if (s.user?.tenantId) {
        setTenantId(s.user.tenantId);
        const t = await api<Item>("/manage/settings", {
          tenantId: s.user.tenantId,
        });
        setTenants([t]);
      }
      setError("");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSessionReady(true);
    }
  }, []);
  useEffect(() => {
    document.title = "DANAVA GO Studio · Quản trị nhà xe";
    // eslint-disable-next-line react/set-state-in-effect -- initialize the authenticated API session
    init();
  }, [init]);
  useEffect(() => {
    if (!user) return;
    if (page === "platform") {
      // eslint-disable-next-line react/set-state-in-effect -- synchronize the selected tenant list
      setItems(tenants);
      return;
    }
    if (!tenantId) return;
    const controller = new AbortController();
    // Request state follows an external API subscription and is cancelled on navigation.
    // eslint-disable-next-line react/set-state-in-effect
    setLoading(true);
    setError("");
    const fetchAll = async () => {
      try {
        const options = { tenantId, signal: controller.signal };
        let result: Record<string, any> = {};
        if (page === "overview")
          result = await api("/manage/dashboard", options);
        else if (page === "reports")
          result = await api("/manage/reports", options);
        else if (page === "settings")
          result = await api("/manage/settings", options);
        else result = await api("/manage/" + page, options);
        if (controller.signal.aborted) return;
        setItems(result.items || []);
        setContext(result);
        if (["trips", "bookings", "shifts", "staff"].includes(page)) {
          const names =
            page === "trips"
              ? ["vehicles", "routes", "drivers", "branches"]
              : page === "bookings"
                ? user.role === "driver"
                  ? []
                  : ["trips", "agencies"]
                : ["drivers"];
          for (const name of names) {
            const r = await api<{ items: Item[] }>("/manage/" + name, options);
            if (!controller.signal.aborted)
              setContext((s) => ({ ...s, [name]: r.items }));
          }
        }
      } catch (e) {
        if (!controller.signal.aborted) setError((e as Error).message);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };
    fetchAll();
    return () => controller.abort();
  }, [user, tenantId, page, revision, tenants]);
  const actionBusy = useRef(false);
  const action = async (path: string, body: unknown, method = "PATCH") => {
    if (actionBusy.current) return;
    actionBusy.current = true;
    try {
      await api(path, {
        method,
        body,
        tenantId,
        headers:
          path === "/manage/ledger" ? { "Idempotency-Key": unique() } : {},
      });
      refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      actionBusy.current = false;
    }
  };
  const navigate = (id: string) => {
    if (id === page) setRevision((v) => v + 1);
    setPage(id);
    setFilter("");
    setQuery("");
    setSideOpen(false);
    setContext({});
    setItems([]);
  };
  const visibleNav = nav.filter((n) => can(n.roles));
  const tenantName =
    tenants.find((t) => t.id === tenantId)?.name || context.name || "Nhà xe";
  const filtered = items.filter((i) =>
    JSON.stringify(i).toLowerCase().includes(filter.toLowerCase()),
  );
  const add = () => {
    setEditing(null);
    setModal(
      page === "trips"
        ? "trip"
        : page === "bookings"
          ? "counter"
          : page === "staff"
            ? "staff"
            : page === "ledger"
              ? "ledger"
              : page === "platform"
                ? "tenant"
                : "editor",
    );
  };
  const seed = async () => {
    try {
      setLoading(true);
      const r = await api<{ tenant: Item }>("/platform/demo", {
        method: "POST",
        body: {},
      });
      await init();
      setTenantId(r.tenant.id);
      setPage("overview");
      setRevision((v) => v + 1);
      setNotice("Đã tạo nhà xe mẫu DANAVAGO và 15 chuyến thử nghiệm.");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };
  if (!sessionReady)
    return (
      <div className="ds-root ds-loading">
        <RefreshCw /> Đang kết nối hệ thống…
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
  const currentTitle =
    page === "overview"
      ? "Tổng quan vận hành"
      : page === "trips"
        ? "Điều hành chuyến"
        : page === "bookings"
          ? "Bán vé & Đơn vé"
          : page === "staff"
            ? "Nhân sự & Phân quyền"
            : page === "customers"
              ? "Khách hàng"
              : page === "ledger"
                ? "Sổ thu chi"
                : page === "reports"
                  ? "Báo cáo & Đối soát"
                  : page === "app"
                    ? "App & Tên miền"
                    : page === "settings"
                      ? "Cài đặt nhà xe"
                      : page === "audit"
                        ? "Nhật ký hoạt động"
                        : page === "platform"
                          ? "Nhà xe trên nền tảng"
                          : modules[page]?.title || page;
  const canAdd =
    page === "platform"
      ? user.role === "platform"
      : page === "bookings"
        ? can(["owner", "manager", "dispatcher", "sales"])
        : page === "staff"
          ? can(["owner", "manager"])
          : page === "ledger"
            ? can(["owner", "manager", "accountant", "sales"])
            : ["agencies", "promotions"].includes(page)
              ? can(["owner", "manager"])
              : can(["owner", "manager", "dispatcher"]);
  return (
    <div className="ds-root">
      <div className="ds-atmosphere" />
      <aside className={"ds-sidebar " + (sideOpen ? "open" : "")}>
        <a className="ds-wordmark" href="/manage">
          <span>D</span>
          <div>
            DANAVA GO<small>OPERATOR STUDIO</small>
          </div>
        </a>
        <div className="ds-workspace">
          <small>KHÔNG GIAN LÀM VIỆC</small>
          {user.role === "platform" ? (
            <select
              aria-label="Chọn nhà xe"
              value={tenantId}
              onChange={(e) => {
                setTenantId(e.target.value);
                setContext({});
                setItems([]);
              }}
            >
              <option value="">Chọn nhà xe</option>
              {tenants.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          ) : (
            <strong>{tenantName}</strong>
          )}
        </div>
        <nav aria-label="Quản trị nhà xe">
          <small>VẬN HÀNH</small>
          {visibleNav.map((n) => (
            <button
              className={page === n.id ? "active" : ""}
              key={n.id}
              onClick={() => navigate(n.id)}
            >
              <n.icon size={17} />
              {n.name}
              {page === n.id && <span className="ds-nav-dot" />}
            </button>
          ))}
          {user.role === "platform" && (
            <>
              <small>NỀN TẢNG</small>
              <button
                className={page === "platform" ? "active" : ""}
                onClick={() => navigate("platform")}
              >
                <Building2 size={17} />
                Quản lý nhà xe
              </button>
            </>
          )}
        </nav>
        <div className="ds-sidebar-bottom">
          <a href="/" target="_blank" rel="noreferrer">
            <ArrowUpRight size={16} /> Mở trang đặt vé
          </a>
          <div className="ds-user">
            <span>{user.name.slice(0, 1)}</span>
            <div>
              <strong>{user.name}</strong>
              <small>{roleLabels[user.role]}</small>
            </div>
            <button
              aria-label="Đăng xuất"
              onClick={async () => {
                try {
                  await api("/auth/logout", { method: "POST", body: {} });
                  setUser(null);
                  setTenantId("");
                  setItems([]);
                } catch (e) {
                  setError((e as Error).message);
                }
              }}
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>
      <main className="ds-main">
        <header className="ds-topbar">
          <button
            className="ds-mobile-menu"
            aria-label="Mở menu"
            onClick={() => setSideOpen(!sideOpen)}
          >
            <Menu />
          </button>
          <div className="ds-breadcrumb">
            {tenantName}
            <ChevronRight size={13} />
            <span>{currentTitle}</span>
          </div>
          <div className="ds-global-search">
            <Search size={15} />
            <input
              aria-label="Tìm chức năng"
              placeholder="Tìm chức năng…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {query && (
              <div className="ds-search-results">
                {visibleNav
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
          <button
            aria-label="Thông báo"
            className="ds-bell"
            onClick={async () => {
              setBellOpen(!bellOpen);
              if (tenantId)
                try {
                  const n = await api<{ items: Item[] }>("/manage/notices", {
                    tenantId,
                  });
                  setNotices(n.items);
                } catch (e) {
                  setError((e as Error).message);
                }
            }}
          >
            <Bell size={18} />
          </button>
          <button
            aria-label="Đổi mật khẩu"
            title="Đổi mật khẩu"
            onClick={() => setModal("password")}
          >
            <ShieldCheck size={17} />
          </button>
          <button
            className="ds-icon-button"
            aria-label="Làm mới dữ liệu"
            onClick={() => setRevision((v) => v + 1)}
          >
            <RefreshCw size={17} />
          </button>
          {bellOpen && (
            <div className="ds-notices">
              <h3>Thông báo trong ứng dụng</h3>
              {notices.length ? (
                notices.map((n) => (
                  <p key={n.id}>
                    <i className={n.read ? "read" : ""} />
                    {n.title}
                    <small>{formatDate(n.created_at)}</small>
                  </p>
                ))
              ) : (
                <p>Chưa có thông báo.</p>
              )}
              <button
                onClick={() => action("/manage/notices/read", {}, "POST")}
              >
                Đánh dấu đã đọc
              </button>
            </div>
          )}
        </header>
        <div className="ds-content">
          <div className="ds-heading">
            <div>
              <span className="ds-kicker">
                DANAVA GO / {user.role === "platform" ? "PLATFORM" : "STUDIO"}
              </span>
              <h1>
                {page === "overview"
                  ? `Một ngày tốt lành, ${user.name.split(" ").at(-1)}.`
                  : currentTitle}
              </h1>
              <p>
                {page === "overview"
                  ? "Nhịp vận hành hôm nay, trong một góc nhìn."
                  : modules[page]?.subtitle ||
                    "Dữ liệu được lưu tại server, phân tách theo nhà xe."}
              </p>
            </div>
            <div className="ds-heading-actions">
              {page === "reports" && (
                <button
                  onClick={() =>
                    downloadReport(
                      "/manage/reports?export=csv",
                      tenantId,
                      "bao-cao.csv",
                    ).catch((e) => setError(e.message))
                  }
                >
                  <Download size={15} /> Xuất CSV
                </button>
              )}
              {(["trips", "bookings", "staff", "ledger", "platform"].includes(
                page,
              ) ||
                modules[page]) &&
                canAdd && (
                  <button
                    className="ds-primary"
                    disabled={!tenantId && page !== "platform"}
                    onClick={add}
                  >
                    <Plus size={16} />
                    {page === "bookings"
                      ? "Bán vé tại quầy"
                      : page === "trips"
                        ? "Lên lịch chuyến"
                        : "Thêm mới"}
                  </button>
                )}
            </div>
          </div>
          {error && (
            <div className="ds-error ds-banner" role="alert">
              {error}
              <button onClick={() => setError("")} aria-label="Đóng lỗi">
                <X size={16} />
              </button>
            </div>
          )}
          {notice && (
            <div className="ds-toast" role="status">
              {notice}
              <button aria-label="Đóng thông báo" onClick={() => setNotice("")}>
                <X size={15} />
              </button>
            </div>
          )}
          {loading && (
            <div className="ds-progress" role="status">
              Đang tải dữ liệu…
            </div>
          )}
          {loading ? (
            <section className="ds-panel ds-empty" aria-busy="true">
              <RefreshCw size={28} />
              <p>Đang đồng bộ dữ liệu nhà xe…</p>
            </section>
          ) : !tenantId && page !== "platform" ? (
            <Empty title="Chọn một nhà xe để bắt đầu">
              Quản trị nền tảng có thể tạo nhà xe hoặc tạo bộ dữ liệu DANAVAGO
              mẫu.
            </Empty>
          ) : page === "overview" ? (
            <>
              <section className="ds-overview-grid">
                <div className="ds-journey-card">
                  <div>
                    <span className="ds-kicker">THE NEXT DEPARTURE</span>
                    <h2>
                      {context.upcoming?.[0]
                        ? `${context.upcoming[0].from} → ${context.upcoming[0].to}`
                        : "Hành trình tiếp theo đang chờ."}
                    </h2>
                    <p>
                      {context.upcoming?.[0]
                        ? `${formatDate(context.upcoming[0].date)} · ${context.upcoming[0].departureTime} · ${context.upcoming[0].availableSeatsCount} chỗ trống`
                        : "Lên lịch chuyến, phân công xe và bắt đầu mở bán."}
                    </p>
                  </div>
                  <button onClick={() => navigate("trips")}>
                    Mở điều hành chuyến
                    <ArrowUpRight size={15} />
                  </button>
                </div>
                <div className="ds-panel ds-revenue">
                  <div className="ds-panel-top">
                    <span>Tiền thu ròng · 7 ngày</span>
                    <span className="ds-live">
                      <i /> Server
                    </span>
                  </div>
                  <h2>
                    {context.totals?.revenue === null
                      ? "Theo phân quyền"
                      : money(
                          (context.days || []).reduce(
                            (sum: number, d: Item) => sum + d.value,
                            0,
                          ),
                        )}
                  </h2>
                  <Chart days={context.days || []} />
                </div>
              </section>
              <section className="ds-stats">
                {[
                  {
                    label: "Lịch chạy đã tạo",
                    value: context.totals?.trips || 0,
                    color: "orange",
                    icon: CalendarDays,
                  },
                  {
                    label: "Đơn đang hoạt động",
                    value: context.totals?.bookings || 0,
                    color: "teal",
                    icon: Ticket,
                  },
                  {
                    label: "Chỗ đã bán",
                    value: context.totals?.seats || 0,
                    color: "sand",
                    icon: Users,
                  },
                  {
                    label: "Giá trị đơn chưa thu đủ",
                    value:
                      context.totals?.unpaid === null
                        ? "Theo phân quyền"
                        : money(context.totals?.unpaid),
                    color: "blue",
                    icon: Wallet,
                  },
                ].map((s) => (
                  <article className={"ds-stat " + s.color} key={s.label}>
                    <span>
                      <s.icon size={16} />
                      {s.label}
                    </span>
                    <strong>{s.value}</strong>
                  </article>
                ))}
              </section>
              <section className="ds-panel">
                <div className="ds-panel-top">
                  <h2>Lịch chạy sắp tới</h2>
                  <button onClick={() => navigate("trips")}>
                    Xem tất cả <ArrowUpRight size={14} />
                  </button>
                </div>
                {context.upcoming?.length ? (
                  <div className="ds-upcoming">
                    {context.upcoming.map((t: Item) => (
                      <button key={t.id} onClick={() => navigate("trips")}>
                        <div className="ds-time">
                          {t.departureTime}
                          <small>{formatDate(t.date)}</small>
                        </div>
                        <div>
                          <strong>
                            {t.from} → {t.to}
                          </strong>
                          <small>
                            {t.vehicle.name} · {t.plate}
                          </small>
                        </div>
                        <Badge value={t.status} />
                        <ChevronRight size={16} />
                      </button>
                    ))}
                  </div>
                ) : (
                  <Empty />
                )}
              </section>
            </>
          ) : page === "platform" ? (
            <>
              <section className="ds-platform-intro ds-panel">
                <div>
                  <h2>Một hệ thống. Nhiều nhà xe.</h2>
                  <p>
                    Tạo doanh nghiệp, cấp tài khoản chủ xe và kiểm soát quyền mở
                    bán.
                  </p>
                </div>
                {seedAllowed && (
                  <button
                    className="ds-primary"
                    disabled={loading}
                    onClick={seed}
                  >
                    <Plus size={16} />
                    Tạo nhà xe mẫu DANAVAGO
                  </button>
                )}
              </section>
              <div className="ds-fleet-grid">
                {tenants.map((t) => (
                  <article className="ds-panel" key={t.id}>
                    <span className="ds-kicker">{t.slug}</span>
                    <h2>{t.name}</h2>
                    <Badge value={t.status} />
                    <p>{t.phone || "Chưa cập nhật liên hệ"}</p>
                    <p>Phí nền tảng: {(t.commissionBps || 0) / 100}%</p>
                    <div className="ds-row-actions">
                      <button
                        onClick={() => {
                          setTenantId(t.id);
                          navigate("overview");
                        }}
                      >
                        Mở không gian
                        <ArrowUpRight size={14} />
                      </button>
                      <button
                        onClick={() => {
                          setTenantId(t.id);
                          navigate("staff");
                        }}
                      >
                        Cấp tài khoản
                      </button>
                      <button
                        onClick={async () => {
                          try {
                            await api("/platform/tenants/" + t.id, {
                              method: "PATCH",
                              body: {
                                status:
                                  t.status === "active"
                                    ? "suspended"
                                    : "active",
                                autoPublish: t.autoPublish,
                                commissionBps: t.commissionBps,
                              },
                            });
                            await init();
                          } catch (e) {
                            setError((e as Error).message);
                          }
                        }}
                      >
                        {t.status === "active" ? "Tạm ngưng" : "Kích hoạt"}
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </>
          ) : page === "app" ? (
            <AppBrandSettings
              data={context}
              tenantId={tenantId}
              platform={user.role === "platform"}
              onSaved={refresh}
            />
          ) : page === "settings" ? (
            <section className="ds-panel ds-settings">
              <h2>Thương hiệu & Thông tin vận hành</h2>
              <form
                key={tenantId + "-" + revision}
                onSubmit={(e) => {
                  e.preventDefault();
                  action(
                    "/manage/settings",
                    Object.fromEntries(new FormData(e.currentTarget)),
                  );
                }}
              >
                <div className="ds-form-grid">
                  {[
                    { key: "name", label: "Tên nhà xe", required: true },
                    { key: "phone", label: "Hotline", required: true },
                    { key: "email", label: "Email", type: "email" },
                    { key: "address", label: "Địa chỉ" },
                    { key: "color", label: "Màu thương hiệu", type: "color" },
                    {
                      key: "description",
                      label: "Giới thiệu",
                      type: "textarea",
                    },
                    {
                      key: "policies",
                      label: "Chính sách đổi/hủy và hành lý",
                      type: "textarea",
                    },
                  ].map((f) => (
                    <label
                      key={f.key}
                      className={f.type === "textarea" ? "wide" : ""}
                    >
                      <span>{f.label}</span>
                      {f.type === "textarea" ? (
                        <textarea
                          name={f.key}
                          rows={4}
                          defaultValue={context[f.key] || ""}
                        />
                      ) : (
                        <input
                          required={f.required}
                          type={f.type || "text"}
                          name={f.key}
                          defaultValue={context[f.key] || ""}
                        />
                      )}
                    </label>
                  ))}
                </div>
                <button className="ds-primary">Lưu cấu hình</button>
              </form>
              <p className="ds-muted">
                App thương hiệu riêng và tự cấp tên miền được triển khai ở giai
                đoạn tiếp theo. Email/SMS và GPS chưa kết nối nhà cung cấp.
              </p>
            </section>
          ) : page === "reports" ? (
            <>
              <section className="ds-stats">
                {[
                  {
                    label: "Tiền vé đã thu",
                    value: context.summary?.collected,
                  },
                  { label: "Đã hoàn khách", value: context.summary?.refunded },
                  { label: "Chi phí ghi sổ", value: context.summary?.expenses },
                  {
                    label: "Phí nền tảng dự tính",
                    value: context.summary?.platformFeeAccrued,
                  },
                ].map((r) => (
                  <article className="ds-stat" key={r.label}>
                    <span>{r.label}</span>
                    <strong>{money(r.value)}</strong>
                  </article>
                ))}
              </section>
              <section className="ds-panel">
                <div className="ds-panel-top">
                  <h2>Hiệu quả theo tuyến</h2>
                  <span>Tiền đã thu và đã hoàn được tách riêng</span>
                </div>
                <div className="ds-table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Tuyến</th>
                        <th>Vé hoạt động</th>
                        <th>Giá trị đặt</th>
                        <th>Đã thu</th>
                        <th>Đã hoàn</th>
                      </tr>
                    </thead>
                    <tbody>
                      {context.routes?.map((r: Item) => (
                        <tr key={r.name}>
                          <td>{r.name}</td>
                          <td>{r.tickets}</td>
                          <td>{money(r.bookedValue)}</td>
                          <td>{money(r.collected)}</td>
                          <td>{money(r.refunded)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
              <section className="ds-panel">
                <h2>Công nợ đại lý</h2>
                {context.agencies?.length ? (
                  context.agencies.map((a: Item) => (
                    <div className="ds-report-line" key={a.id}>
                      <strong>{a.name}</strong>
                      <span>
                        {money(a.debt)} còn phải thu · Hoa hồng đã phát sinh:{" "}
                        {money(a.commissionAccrued)}
                      </span>
                    </div>
                  ))
                ) : (
                  <Empty title="Chưa có đại lý" />
                )}
              </section>
            </>
          ) : (
            <section className="ds-panel">
              <div className="ds-list-toolbar">
                <div className="ds-filter">
                  <Search size={16} />
                  <input
                    aria-label="Lọc danh sách"
                    placeholder="Tìm trong danh sách…"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                  />
                </div>
                <span>{filtered.length} mục</span>
              </div>
              {page === "vehicles" ? (
                <div className="ds-fleet-grid">
                  {filtered.map((v) => (
                    <article className="ds-vehicle-card" key={v.id}>
                      <div className="ds-vehicle-photo">
                        <img
                          src={
                            v.image || "/assets/images/bus_limousine_vip.png"
                          }
                          alt={v.name}
                        />
                        <span>{v.capacity} CHỖ</span>
                      </div>
                      <div>
                        <h3>{v.name}</h3>
                        <p>
                          {v.plate} · {v.category}
                        </p>
                        <div className="ds-vehicle-footer">
                          <span>
                            {v.maintenance ? "Bảo dưỡng" : "Sẵn sàng"}
                          </span>
                          {can(["owner", "manager", "dispatcher"]) && (
                            <button
                              onClick={() => {
                                setEditing(v);
                                setModal("editor");
                              }}
                            >
                              <Pencil size={14} /> Chỉnh sửa
                            </button>
                          )}
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              ) : page === "trips" ? (
                <div className="ds-table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Hành trình</th>
                        <th>Khởi hành</th>
                        <th>Xe / Tài xế</th>
                        <th>Giá / Chỗ</th>
                        <th>Trạng thái</th>
                        <th>Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((t) => (
                        <tr key={t.id}>
                          <td>
                            <strong>
                              {t.from} → {t.to}
                            </strong>
                            <small>{t.code}</small>
                          </td>
                          <td>
                            <strong>{t.departureTime}</strong>
                            <small>{formatDate(t.date)}</small>
                          </td>
                          <td>
                            {t.plate}
                            <small>
                              {context.drivers?.find(
                                (d: Item) => d.id === t.driverId,
                              )?.name || "Chưa phân tài xế"}
                            </small>
                          </td>
                          <td>
                            {money(t.price)}
                            <small>
                              {t.availableSeatsCount}/{t.seats.length} còn trống
                            </small>
                          </td>
                          <td>
                            <Badge value={t.status} />
                          </td>
                          <td>
                            <div className="ds-row-actions">
                              <button
                                onClick={() =>
                                  downloadReport(
                                    "/manage/trips/" + t.id + "/manifest",
                                    tenantId,
                                    "hanh-khach.csv",
                                  ).catch((e) => setError(e.message))
                                }
                                title="Danh sách hành khách"
                              >
                                <Download size={14} />
                              </button>
                              {can(["owner", "manager", "dispatcher"]) &&
                                !["cancelled", "completed"].includes(
                                  t.status,
                                ) && (
                                  <>
                                    <button
                                      onClick={() => {
                                        setEditing(t);
                                        setModal("trip-detail");
                                      }}
                                    >
                                      Chi tiết
                                    </button>
                                    <select
                                      aria-label={`Đổi trạng thái ${t.code}`}
                                      value=""
                                      onChange={(e) => {
                                        if (e.target.value === "cancelled") {
                                          setEditing(t);
                                          setModal("cancel-trip");
                                        } else
                                          action(
                                            "/manage/trips/" + t.id + "/status",
                                            { status: e.target.value },
                                          );
                                      }}
                                    >
                                      <option value="">Trạng thái…</option>
                                      {[
                                        "draft",
                                        "pending",
                                        "published",
                                        "closed",
                                        "completed",
                                        "cancelled",
                                      ]
                                        .filter((s) => s !== t.status)
                                        .map((s) => (
                                          <option key={s} value={s}>
                                            {statuses[s]}
                                          </option>
                                        ))}
                                    </select>
                                  </>
                                )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : page === "bookings" ? (
                <div className="ds-table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Vé / Hành khách</th>
                        <th>Chuyến</th>
                        <th>Ghế</th>
                        <th>Thanh toán</th>
                        <th>Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((b) => (
                        <tr key={b.id}>
                          <td>
                            <strong>{b.passenger.fullName}</strong>
                            <small>{b.passenger.phone}</small>
                            <small>{b.id}</small>
                          </td>
                          <td>
                            {b.trip.from} → {b.trip.to}
                            <small>
                              {formatDate(b.date)} · {b.trip.departureTime}
                            </small>
                            <Badge value={b.status} />
                          </td>
                          <td>
                            {b.selectedSeats.join(", ")}
                            <small>
                              {b.source === "online" ? "Online" : "Tại quầy"}
                            </small>
                          </td>
                          <td>
                            {money(b.totalAmount)}
                            <small>
                              <Badge value={b.paymentStatus} />
                            </small>
                          </td>
                          <td>
                            <div className="ds-row-actions">
                              {b.status !== "cancelled" && (
                                <>
                                  <button
                                    onClick={() =>
                                      action("/manage/bookings/" + b.id, {
                                        action: "checkin",
                                      })
                                    }
                                  >
                                    Kiểm vé
                                  </button>
                                  {can([
                                    "owner",
                                    "manager",
                                    "dispatcher",
                                    "sales",
                                  ]) && (
                                    <>
                                      <button
                                        onClick={() => {
                                          setEditing(b);
                                          setModal("cancel-booking");
                                        }}
                                      >
                                        Hủy
                                      </button>
                                      <button
                                        onClick={() => {
                                          setEditing(b);
                                          setModal("move-booking");
                                        }}
                                      >
                                        Đổi chuyến
                                      </button>
                                    </>
                                  )}
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : page === "staff" ? (
                <div className="ds-table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Nhân viên</th>
                        <th>Email</th>
                        <th>Vai trò</th>
                        <th>Trạng thái</th>
                        <th />
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((s) => (
                        <tr key={s.id}>
                          <td>{s.name}</td>
                          <td>{s.email}</td>
                          <td>{roleLabels[s.role]}</td>
                          <td>{s.active ? "Hoạt động" : "Đã khóa"}</td>
                          <td>
                            {s.id !== user.id && (
                              <button
                                onClick={() =>
                                  action("/manage/staff/" + s.id, {
                                    active: !s.active,
                                  })
                                }
                              >
                                {s.active ? "Khóa" : "Mở khóa"}
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : page === "customers" ? (
                <div className="ds-table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Khách hàng</th>
                        <th>Điện thoại</th>
                        <th>Email</th>
                        <th>Số đơn</th>
                        <th>Giá trị vé</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((c) => (
                        <tr key={c.phone}>
                          <td>{c.fullName}</td>
                          <td>{c.phone}</td>
                          <td>{c.email || "—"}</td>
                          <td>{c.bookings}</td>
                          <td>{money(c.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : page === "ledger" ? (
                <div className="ds-table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Ngày</th>
                        <th>Loại</th>
                        <th>Số tiền</th>
                        <th>Phương thức</th>
                        <th>Đơn / Ghi chú</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((l) => (
                        <tr key={l.id}>
                          <td>{formatDate(l.created_at)}</td>
                          <td>
                            {
                              {
                                collection: "Thu tiền vé",
                                refund: "Hoàn tiền",
                                expense: "Chi phí",
                              }[l.kind as string]
                            }
                          </td>
                          <td>{money(l.amount)}</td>
                          <td>
                            {l.method === "cash" ? "Tiền mặt" : "Chuyển khoản"}
                          </td>
                          <td>
                            {l.booking_id}
                            <small>{l.note}</small>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : page === "audit" ? (
                <div className="ds-table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Thời điểm</th>
                        <th>Nhân viên</th>
                        <th>Hoạt động</th>
                        <th>Dữ liệu</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((a) => (
                        <tr key={a.id}>
                          <td>{formatDate(a.created_at)}</td>
                          <td>{a.actor || "Khách online"}</td>
                          <td>{a.action}</td>
                          <td>
                            {a.entity_id}
                            <small>{a.detail}</small>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : modules[page] ? (
                <div className="ds-table-wrap">
                  <table>
                    <thead>
                      <tr>
                        {modules[page].labels.map((s) => (
                          <th key={s}>{s}</th>
                        ))}
                        <th>Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((r) => (
                        <tr key={r.id}>
                          {modules[page].columns.map((k) => (
                            <td key={k}>
                              {typeof r[k] === "boolean"
                                ? r[k]
                                  ? "Có"
                                  : "Chưa"
                                : k === "driverId"
                                  ? context.drivers?.find(
                                      (d: Item) => d.id === r[k],
                                    )?.name || "Chưa liên kết"
                                  : String(r[k] ?? "—")}
                            </td>
                          ))}
                          <td>
                            {canAdd && (
                              <div className="ds-row-actions">
                                <button
                                  aria-label={"Sửa " + r.name}
                                  onClick={() => {
                                    setEditing(r);
                                    setModal("editor");
                                  }}
                                >
                                  <Pencil size={14} />
                                </button>
                                <button
                                  aria-label={"Xóa " + r.name}
                                  onClick={() => {
                                    setEditing(r);
                                    setModal("delete");
                                  }}
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : null}
              {!filtered.length && !loading && <Empty />}
            </section>
          )}
          <footer className="ds-footer">
            <span>DANAVA GO Studio</span>
            <span>Vận hành rõ ràng. Hành trình an tâm.</span>
            <span>
              <ShieldCheck size={13} />
              Phân quyền theo nhà xe
            </span>
          </footer>
        </div>
      </main>
      {modal === "editor" && modules[page] && (
        <Editor
          kind={page}
          item={editing}
          tenantId={tenantId}
          drivers={context.drivers || []}
          onSaved={refresh}
          onClose={() => setModal(null)}
        />
      )}
      {modal === "trip" && (
        <TripEditor
          item={editing}
          vehicles={context.vehicles || []}
          routes={context.routes || []}
          drivers={context.drivers || []}
          branches={context.branches || []}
          tenantId={tenantId}
          onSaved={refresh}
          onClose={() => setModal(null)}
        />
      )}
      {modal === "counter" && (
        <Counter
          trips={context.trips || []}
          agencies={context.agencies || []}
          tenantId={tenantId}
          onSaved={refresh}
          onClose={() => setModal(null)}
        />
      )}
      {["delete", "cancel-trip", "cancel-booking"].includes(modal || "") &&
        editing && (
          <Modal title="Xác nhận thao tác" onClose={() => setModal(null)}>
            <p className="ds-modal-text">
              {modal === "delete"
                ? `Xóa ${editing.name}? Dữ liệu đã được sử dụng trong chuyến sẽ không thể xóa.`
                : modal === "cancel-trip"
                  ? "Hủy chuyến sẽ hủy các vé liên quan, trả tồn ghế và đánh dấu khoản tiền cần hoàn. Bạn cần liên hệ hành khách."
                  : "Hủy vé sẽ trả tồn ghế. Tiền đã thu chuyển sang cần hoàn, không tự gửi tiền ngân hàng."}
            </p>
            <footer>
              <button onClick={() => setModal(null)}>Giữ nguyên</button>
              <button
                className="ds-danger"
                onClick={() =>
                  modal === "delete"
                    ? action("/manage/" + page + "/" + editing.id, {}, "DELETE")
                    : modal === "cancel-trip"
                      ? action("/manage/trips/" + editing.id + "/status", {
                          status: "cancelled",
                        })
                      : action("/manage/bookings/" + editing.id, {
                          action: "cancel",
                        })
                }
              >
                Xác nhận
              </button>
            </footer>
          </Modal>
        )}
      {modal === "trip-detail" && editing && (
        <Modal
          title={editing.from + " → " + editing.to}
          onClose={() => setModal(null)}
        >
          <div className="ds-modal-text">
            <p>
              {formatDate(editing.date)} · {editing.departureTime} ·{" "}
              {editing.plate}
            </p>
            <p>
              {editing.departureLocation.name} → {editing.arrivalLocation.name}
            </p>
            {["draft", "pending", "closed"].includes(editing.status) && (
              <button className="ds-primary" onClick={() => setModal("trip")}>
                Chỉnh lịch / Phân công xe, tài xế
              </button>
            )}
            <div className="ds-counter-seats">
              {editing.seats.map((s: Item) => (
                <span
                  className={s.status === "available" ? "" : "unavailable"}
                  key={s.code}
                >
                  {s.code}
                </span>
              ))}
            </div>
            <p>
              Chỗ còn trống: {editing.availableSeatsCount}. Đóng bán và xử lý
              vé/giữ ghế trước khi đổi lịch.
            </p>
          </div>
          <footer>
            <button onClick={() => setModal(null)}>Đóng</button>
          </footer>
        </Modal>
      )}
      {modal === "staff" && (
        <Modal title="Cấp tài khoản nhân viên" onClose={() => setModal(null)}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              action(
                "/manage/staff",
                Object.fromEntries(new FormData(e.currentTarget)),
                "POST",
              );
            }}
          >
            <div className="ds-form-grid">
              <label>
                <span>Họ tên</span>
                <input name="name" required />
              </label>
              <label>
                <span>Email</span>
                <input name="email" type="email" required />
              </label>
              <label>
                <span>Mật khẩu tạm (ít nhất 12 ký tự)</span>
                <input
                  name="password"
                  type="password"
                  minLength={12}
                  required
                  autoComplete="new-password"
                />
              </label>
              <label>
                <span>Vai trò</span>
                <select name="role">
                  {Object.entries(roleLabels)
                    .filter(
                      ([r]) =>
                        r !== "platform" &&
                        (user.role !== "manager" ||
                          !["owner", "manager"].includes(r)),
                    )
                    .map(([r, label]) => (
                      <option key={r} value={r}>
                        {label}
                      </option>
                    ))}
                </select>
              </label>
              <label className="wide">
                <span>Liên kết tài xế (nếu là tài khoản tài xế)</span>
                <select name="driverId">
                  <option value="">Không liên kết</option>
                  {context.drivers?.map((d: Item) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <footer>
              <button type="button" onClick={() => setModal(null)}>
                Hủy
              </button>
              <button className="ds-primary">Tạo tài khoản</button>
            </footer>
          </form>
        </Modal>
      )}
      {modal === "tenant" && (
        <Modal title="Thêm nhà xe" onClose={() => setModal(null)}>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              try {
                await api("/platform/tenants", {
                  method: "POST",
                  body: Object.fromEntries(new FormData(e.currentTarget)),
                });
                await init();
                refresh();
              } catch (e) {
                setError((e as Error).message);
              }
            }}
          >
            <div className="ds-form-grid">
              <label>
                <span>Tên nhà xe</span>
                <input name="name" required />
              </label>
              <label>
                <span>Định danh duy nhất</span>
                <input name="slug" required pattern="[a-z0-9]+(-[a-z0-9]+)*" />
              </label>
              <label>
                <span>Hotline</span>
                <input name="phone" type="tel" />
              </label>
              <label>
                <span>Phí nền tảng (100 bps = 1%)</span>
                <input
                  name="commissionBps"
                  type="number"
                  defaultValue={0}
                  min={0}
                  max={5000}
                />
              </label>
            </div>
            <footer>
              <button type="button" onClick={() => setModal(null)}>
                Hủy
              </button>
              <button className="ds-primary">Tạo nhà xe</button>
            </footer>
          </form>
        </Modal>
      )}
      {modal === "ledger" && (
        <Modal
          title="Ghi nhận giao dịch đã đối chiếu"
          onClose={() => setModal(null)}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const b = Object.fromEntries(new FormData(e.currentTarget));
              action(
                "/manage/ledger",
                { ...b, amount: Number(b.amount) },
                "POST",
              );
            }}
          >
            <div className="ds-form-grid">
              <label>
                <span>Loại giao dịch</span>
                <select name="kind">
                  <option value="collection">Thu tiền vé</option>
                  {can(["owner", "manager", "accountant"]) && (
                    <>
                      <option value="refund">Hoàn tiền vé đã hủy</option>
                      <option value="expense">Chi phí vận hành</option>
                    </>
                  )}
                </select>
              </label>
              <label>
                <span>Mã đơn (bỏ trống nếu là chi phí)</span>
                <input name="bookingId" />
              </label>
              <label>
                <span>Số tiền thực nhận/chi (đ)</span>
                <input name="amount" type="number" min={1} required />
              </label>
              <label>
                <span>Phương thức</span>
                <select name="method">
                  <option value="cash">Tiền mặt</option>
                  <option value="transfer">Chuyển khoản đã xác nhận</option>
                </select>
              </label>
              <label className="wide">
                <span>Nội dung / Mã giao dịch đối chiếu</span>
                <input name="note" required />
              </label>
            </div>
            <p className="ds-muted">
              Thao tác ghi sổ, không thực hiện chuyển tiền ngân hàng.
            </p>
            <footer>
              <button type="button" onClick={() => setModal(null)}>
                Hủy
              </button>
              <button className="ds-primary">Ghi nhận</button>
            </footer>
          </form>
        </Modal>
      )}
      {modal === "move-booking" && editing && (
        <Modal title="Đổi chuyến đồng giá" onClose={() => setModal(null)}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              action("/manage/bookings/" + editing.id, {
                action: "move",
                tripId: f.get("tripId"),
                seats: String(f.get("seats"))
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean),
              });
            }}
          >
            <label>
              <span>Chuyến mới cùng nhà xe</span>
              <select name="tripId" required>
                {context.trips
                  ?.filter((t: Item) => t.status === "published")
                  .map((t: Item) => (
                    <option key={t.id} value={t.id}>
                      {t.from} → {t.to} · {t.date} {t.departureTime}
                    </option>
                  ))}
              </select>
            </label>
            <label>
              <span>Mã ghế mới (phân cách bằng dấu phẩy)</span>
              <input name="seats" placeholder="A1,A2" required />
            </label>
            <p className="ds-muted">
              Server kiểm tra tồn ghế, số lượng và đồng giá. Vé chênh lệch giá
              hoặc có ưu đãi cần hủy/hoàn và đặt lại.
            </p>
            <footer>
              <button type="button" onClick={() => setModal(null)}>
                Hủy
              </button>
              <button className="ds-primary">Chuyển vé</button>
            </footer>
          </form>
        </Modal>
      )}
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
                refresh();
              } catch (e) {
                setError((e as Error).message);
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
              Đổi mật khẩu sẽ đăng xuất các phiên khác.
            </p>
            <footer>
              <button type="button" onClick={() => setModal(null)}>
                Hủy
              </button>
              <button className="ds-primary">Lưu mật khẩu</button>
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
