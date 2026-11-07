import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, Bus, ExternalLink, LogOut, RefreshCw, Users } from "lucide-react";
import type { AppBrand } from "./appgoBrand";
import type { CustomerSession } from "./useCustomerSession";
import { TripCard, TripOpsPanel } from "./CrewApp";
import { loadOpsTrips, studioUrl, type OpsTrip } from "./opsUtils";
import { TripMap } from "./TripMap";

/**
 * Owner / manager / dispatcher tab: today's trips with crew and boarding
 * progress, every running bus on one map (off-route ones in red), the same
 * trip panel as the crew (scan, passenger list, map + log), and Studio for
 * everything else (routes, fleet, prices, staff, finance).
 */
export function ManageTab({ brand, session }: { brand: AppBrand; session: CustomerSession }) {
  const [trips, setTrips] = useState<OpsTrip[] | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [error, setError] = useState("");

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
    const t = window.setInterval(load, 30000);
    return () => window.clearInterval(t);
  }, [load]);

  if (open) return <TripOpsPanel tripId={open} canDrive={false} onBack={() => { setOpen(null); void load(); }} onChanged={load} />;

  const running = trips?.filter((t) => t.state === "running") ?? [];
  const off = running.filter((t) => t.position?.offRoute);
  const seats = trips?.reduce((n, t) => n + (t.counts?.seats_booked ?? 0), 0) ?? 0;
  const boarded = trips?.reduce((n, t) => n + (t.counts?.seats_boarded ?? 0), 0) ?? 0;

  return (
    <div className="go-ops">
      <div className="go-ops-header">
        <div>
          <small>{brand.name} · {session.staff?.role === "platform" ? "Quản trị nền tảng" : "Quản lý nhà xe"}</small>
          <h1>Điều hành hôm nay</h1>
          <p>{session.staff?.name}</p>
        </div>
        <button type="button" className="go-icon-btn go-icon-btn--light" onClick={() => session.logout()} aria-label="Đăng xuất">
          <LogOut size={18} />
        </button>
      </div>
      <div className="go-ops-body">
        {error && <div className="go-track-status go-track-status--off">{error}</div>}
        <div className="go-ops-stats">
          <div><strong>{trips?.length ?? "–"}</strong><span>chuyến</span></div>
          <div><strong>{running.length}</strong><span>đang chạy</span></div>
          <div><strong>{boarded}/{seats}</strong><span>khách lên xe</span></div>
        </div>
        {off.length > 0 && (
          <div className="go-track-status go-track-status--off" role="alert">
            <AlertTriangle size={18} /> {off.length} xe đang lệch tuyến: {off.map((t) => t.trip.plate || t.trip.from + "→" + t.trip.to).join(", ")}
          </div>
        )}
        <h4 className="go-track-subtitle">Xe đang chạy</h4>
        {running.length ? (
          <TripMap fleet={running} height={230} />
        ) : (
          <p className="go-track-empty">Chưa có xe nào bật GPS. Tài xế/lơ xe bấm “Bắt đầu chuyến” trên app để hiện ở đây.</p>
        )}

        <h4 className="go-track-subtitle">Chuyến hôm nay</h4>
        {trips === null && <p className="go-track-empty">Đang tải…</p>}
        {trips?.length === 0 && (
          <div className="go-ops-empty">
            <Bus size={28} />
            <p>Hôm nay chưa có chuyến nào.</p>
          </div>
        )}
        {trips?.map((t) => <TripCard key={t.trip.id} t={t} onOpen={() => setOpen(t.trip.id)} />)}

        <div className="go-ops-links">
          <button type="button" className="go-ops-refresh" onClick={load}>
            <RefreshCw size={15} /> Làm mới
          </button>
          <a className="go-ops-studio" href={studioUrl()} target="_blank" rel="noreferrer">
            <ExternalLink size={15} /> Mở Studio (tuyến, xe, giá, nhân sự, tài chính)
          </a>
        </div>
        <p className="go-track-note">
          <Users size={13} /> Phân công tài xế/lơ xe ở Studio → Chuyến chạy → Tổ lái. Tọa độ tuyến ở Studio → Tuyến & điểm đón.
        </p>
      </div>
    </div>
  );
}
