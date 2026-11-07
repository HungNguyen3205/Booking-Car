import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, ArrowLeft, Bus, CheckCircle2, ClipboardList, LogOut, Map as MapIcon, MapPinned, Play, RefreshCw, ScanLine, Square, Users } from "lucide-react";
import { crewApi, type CheckinTicket, type TripTracking } from "../../services/crewApi";
import { loadOpsTrips, vnTime, type OpsTrip } from "./opsUtils";
import type { AppBrand } from "./appgoBrand";
import type { CustomerSession } from "./useCustomerSession";
import { TicketScanner } from "./TicketScanner";
import { TripMap } from "./TripMap";
import { TripLog } from "./TripTrackingSheet";
import { useGpsShare } from "./useGpsShare";

/**
 * Crew app (role driver = tài xế, assistant = lơ xe). Only trips assigned to
 * this login are listed (server-side crew filter). Per trip:
 *  - Bắt đầu / Kết thúc chuyến: drives the phone GPS share for customers,
 *  - Quét vé: bound to this bus,
 *  - Danh sách khách and the map + trip log.
 * TripOpsPanel is shared with the owner's "Quản lý" tab.
 */
const STATE_LABEL = { scheduled: "Chưa xuất bến", running: "Đang chạy", finished: "Đã kết thúc" } as const;

export function TripCard({ t, onOpen }: { t: OpsTrip; onOpen: () => void }) {
  const off = t.position?.offRoute && t.state === "running";
  return (
    <button type="button" className={`go-ops-trip${off ? " is-off" : ""}`} onClick={onOpen}>
      <div className="go-ops-trip-top">
        <strong>{vnTime(t.trip.departAt)}</strong>
        <span className={`go-ops-badge go-ops-badge--${t.state}`}>{off ? "Lệch tuyến" : STATE_LABEL[t.state]}</span>
      </div>
      <div className="go-ops-trip-route">
        {t.trip.from} → {t.trip.to}
      </div>
      <div className="go-ops-trip-meta">
        <span><Bus size={13} /> {t.trip.plate || t.trip.vehicle}</span>
        {t.counts && (
          <span>
            <Users size={13} /> {t.counts.seats_boarded}/{t.counts.seats_booked} đã lên xe
          </span>
        )}
      </div>
      {(t.driver || t.assistant) && (
        <div className="go-ops-trip-crew">
          Tài xế: {t.driver?.name ?? "—"} · Lơ xe: {t.assistant?.name ?? "—"}
        </div>
      )}
    </button>
  );
}

type Gps = ReturnType<typeof useGpsShare>;

function GpsBar({ gps }: { gps: Gps }) {
  const text = {
    idle: "",
    waiting: "Đang bật GPS…",
    sharing: gps.lastSent ? `Đang chia sẻ vị trí · gửi lúc ${vnTime(gps.lastSent)}` : "Đã có GPS, đang gửi vị trí đầu tiên…",
    denied: "Chưa cấp quyền vị trí. Vào cài đặt trình duyệt cho phép vị trí rồi mở lại.",
    unsupported: "Máy này không hỗ trợ GPS trên trình duyệt.",
    error: "GPS lỗi: " + gps.error,
  }[gps.state];
  return (
    <div className={`go-gps-bar go-gps-bar--${gps.offRoute ? "off" : gps.state}`} role="status">
      <MapPinned size={18} />
      <div>
        <strong>{gps.offRoute ? "Xe đang lệch khỏi tuyến đăng ký" : text}</strong>
        <small>Giữ app mở trong suốt chuyến để khách theo dõi được xe.{gps.error && gps.state === "sharing" ? ` (${gps.error})` : ""}</small>
      </div>
    </div>
  );
}

/** canDrive + gps: the crew app (GPS runs app-wide, not only while this panel is open). */
export function TripOpsPanel({ tripId, canDrive, gps, onBack, onChanged }: { tripId: string; canDrive: boolean; gps?: Gps; onBack: () => void; onChanged?: () => void }) {
  const [tab, setTab] = useState<"scan" | "list" | "map">("scan");
  const [data, setData] = useState<TripTracking | null>(null);
  const [manifest, setManifest] = useState<CheckinTicket[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const [t, m] = await Promise.all([crewApi.tracking(tripId), crewApi.manifest(tripId)]);
      setData(t.data);
      setManifest(m.data);
      setError("");
    } catch (e) {
      setError((e as Error).message);
    }
  }, [tripId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
    const t = window.setInterval(load, 20000);
    return () => window.clearInterval(t);
  }, [load]);

  const start = async () => {
    setBusy(true);
    setError("");
    const here = await new Promise<GeolocationPosition | null>((resolve) =>
      navigator.geolocation ? navigator.geolocation.getCurrentPosition(resolve, () => resolve(null), { enableHighAccuracy: true, timeout: 15000 }) : resolve(null),
    );
    try {
      const r = await crewApi.start(tripId, here ? { lat: here.coords.latitude, lng: here.coords.longitude } : undefined);
      setData(r.data);
      onChanged?.();
      if (!here) setError("Đã bắt đầu chuyến nhưng chưa lấy được GPS. Hãy cho phép vị trí.");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const finish = async () => {
    if (!window.confirm("Kết thúc chuyến và dừng chia sẻ vị trí?")) return;
    setBusy(true);
    try {
      const r = await crewApi.finish(tripId);
      setData(r.data);
      onChanged?.();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const seats = (list: CheckinTicket[]) => list.reduce((n, b) => n + b.seat_count, 0);
  const boarded = useMemo(() => manifest.filter((b) => b.booking_status === "checked_in"), [manifest]);

  return (
    <div className="go-ops-panel">
      <div className="go-ops-panel-head">
        <button type="button" className="go-icon-btn" onClick={onBack} aria-label="Quay lại">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h2>{data ? `${data.trip.from} → ${data.trip.to}` : "Chuyến xe"}</h2>
          {data && (
            <p>
              {vnTime(data.trip.departAt, true)} · {data.trip.plate || data.trip.vehicle} · {STATE_LABEL[data.state]}
            </p>
          )}
        </div>
        <button type="button" className="go-icon-btn" onClick={load} aria-label="Làm mới">
          <RefreshCw size={18} />
        </button>
      </div>

      {error && <div className="go-track-status go-track-status--off">{error}</div>}

      {data && canDrive && data.state === "scheduled" && (
        <button type="button" className="go-btn-primary go-ops-start" disabled={busy} onClick={start}>
          <Play size={18} /> <span>Bắt đầu chuyến · bật GPS</span>
        </button>
      )}
      {data && data.state === "running" && canDrive && gps && <GpsBar gps={gps} />}
      {data && data.state === "running" && !canDrive && data.position?.offRoute && (
        <div className="go-track-status go-track-status--off"><AlertTriangle size={18} /> Xe đang lệch tuyến.</div>
      )}

      <div className="go-ops-stats">
        <div><strong>{seats(boarded)}</strong><span>đã lên xe</span></div>
        <div><strong>{seats(manifest)}</strong><span>ghế đã bán</span></div>
        <div><strong>{manifest.filter((b) => b.due_amount > 0).length}</strong><span>vé còn nợ</span></div>
      </div>

      <div className="go-ops-tabs" role="tablist">
        {([
          ["scan", "Quét vé", ScanLine],
          ["list", "Danh sách", ClipboardList],
          ["map", "Bản đồ & nhật ký", MapIcon],
        ] as const).map(([key, label, Icon]) => (
          <button key={key} type="button" role="tab" aria-selected={tab === key} className={tab === key ? "active" : ""} onClick={() => setTab(key)}>
            <Icon size={16} /> {label}
          </button>
        ))}
      </div>

      {tab === "scan" && (
        <TicketScanner
          tripId={tripId}
          onBoarded={(t) => {
            // Show the boarding at once; the reload confirms it from the server.
            setManifest((list) => list.map((b) => (b.id === t.id ? { ...b, booking_status: "checked_in", checked_in_at: t.checked_in_at } : b)));
            void load();
            onChanged?.();
          }}
        />
      )}
      {tab === "list" && (
        <ul className="go-ops-manifest">
          {!manifest.length && <li className="go-track-empty">Chưa có vé nào trên chuyến.</li>}
          {manifest.map((b) => (
            <li key={b.id} className={b.booking_status === "checked_in" ? "is-boarded" : ""}>
              {b.booking_status === "checked_in" ? <CheckCircle2 size={18} /> : <span className="go-ops-dot" />}
              <div>
                <strong>{b.customer_name}</strong>
                <small>
                  Ghế {b.seats.join(", ")} · {b.customer_phone}
                  {b.pickup ? ` · đón ${b.pickup}` : ""}
                  {b.due_amount > 0 ? " · còn nợ" : ""}
                </small>
              </div>
              <a href={`tel:${b.customer_phone}`} className="go-ops-call">Gọi</a>
            </li>
          ))}
        </ul>
      )}
      {tab === "map" && data && (
        <>
          <TripMap stops={data.stops} path={data.path} position={data.position} height={280} />
          {!data.routeChecked && <p className="go-track-note">Tuyến chưa có tọa độ điểm dừng: nhập ở Studio → Tuyến & điểm đón để app cảnh báo lệch tuyến.</p>}
          <h4 className="go-track-subtitle">Nhật ký chuyến</h4>
          <TripLog data={data} />
        </>
      )}

      {data && canDrive && data.state === "running" && (
        <button type="button" className="go-ops-finish" disabled={busy} onClick={finish}>
          <Square size={16} /> Kết thúc chuyến
        </button>
      )}
    </div>
  );
}

export function CrewApp({ brand, session }: { brand: AppBrand; session: CustomerSession }) {
  const [trips, setTrips] = useState<OpsTrip[] | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [error, setError] = useState("");
  const role = session.staff?.role === "assistant" ? "Lơ xe" : "Tài xế";
  // The phone shares GPS for the running trip on every screen of the crew app.
  const running = trips?.find((t) => t.state === "running")?.trip.id ?? null;
  const gps = useGpsShare(running);

  const load = useCallback(async () => {
    try {
      setTrips(await loadOpsTrips());
      setError("");
    } catch (e) {
      setError((e as Error).message);
      setTrips([]);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  if (open) return <TripOpsPanel tripId={open} canDrive gps={running === open ? gps : undefined} onBack={() => { setOpen(null); void load(); }} onChanged={load} />;

  return (
    <div className="go-ops">
      <div className="go-ops-header">
        <div>
          <small>{brand.name}</small>
          <h1>Xin chào, {session.staff?.name}</h1>
          <p>{role} · chuyến được phân công hôm nay</p>
        </div>
        <button type="button" className="go-icon-btn go-icon-btn--light" onClick={() => session.logout()} aria-label="Đăng xuất">
          <LogOut size={18} />
        </button>
      </div>
      <div className="go-ops-body">
        {error && <div className="go-track-status go-track-status--off">{error}</div>}
        {running && <GpsBar gps={gps} />}
        {trips === null && <p className="go-track-empty">Đang tải chuyến…</p>}
        {trips?.length === 0 && (
          <div className="go-ops-empty">
            <Bus size={28} />
            <p>Hôm nay bạn chưa được phân công chuyến nào. Nhờ chủ nhà xe phân công ở Studio → Chuyến chạy → Tổ lái.</p>
          </div>
        )}
        {trips?.map((t) => <TripCard key={t.trip.id} t={t} onOpen={() => setOpen(t.trip.id)} />)}
        <button type="button" className="go-ops-refresh" onClick={load}>
          <RefreshCw size={15} /> Làm mới
        </button>
      </div>
    </div>
  );
}
