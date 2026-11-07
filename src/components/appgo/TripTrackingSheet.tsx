import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, Clock, MapPin, Navigation, RefreshCw, ShieldCheck, WifiOff, X } from "lucide-react";
import { crewApi, type TripTracking } from "../../services/crewApi";
import { TripMap } from "./TripMap";
import { vnTime } from "./opsUtils";

/**
 * Customer view of their own trip: where the bus is, whether it keeps to the
 * registered route, and the trip log ("nhật ký chuyến"). Proof of ownership is
 * the ticket code + passenger phone, the same as "Vé của tôi".
 */
const km = (m: number | null) => (m == null ? "" : (m / 1000).toLocaleString("vi-VN", { maximumFractionDigits: 1 }) + " km");

export function TrackingStatus({ data }: { data: TripTracking }) {
  const p = data.position;
  if (data.state === "finished")
    return <div className="go-track-status go-track-status--done"><CheckCircle2 size={18} /> Chuyến đã kết thúc. Cảm ơn bạn đã đồng hành.</div>;
  if (data.state === "scheduled")
    return <div className="go-track-status go-track-status--wait"><Clock size={18} /> Xe chưa xuất bến. Vị trí xe hiện khi tài xế bắt đầu chuyến.</div>;
  if (!p) return <div className="go-track-status go-track-status--wait"><Navigation size={18} /> Xe đã xuất bến, đang chờ tín hiệu GPS đầu tiên…</div>;
  if (p.stale)
    return <div className="go-track-status go-track-status--stale"><WifiOff size={18} /> Mất tín hiệu từ {vnTime(p.at)}. Vị trí trên bản đồ là vị trí cuối cùng.</div>;
  if (p.offRoute)
    return (
      <div className="go-track-status go-track-status--off" role="alert">
        <AlertTriangle size={18} /> Xe đang lệch khỏi tuyến đăng ký khoảng {km(p.routeDistanceM)}. Nhà xe đã nhận cảnh báo; bạn có thể gọi hotline nhà xe.
      </div>
    );
  return (
    <div className="go-track-status go-track-status--ok">
      <ShieldCheck size={18} /> {data.routeChecked ? "Xe đang đi đúng tuyến." : "Xe đang chạy."} Cập nhật lúc {vnTime(p.at)}
      {p.speed != null ? ` · ${Math.round(p.speed * 3.6)} km/h` : ""}
    </div>
  );
}

export function TripLog({ data }: { data: TripTracking }) {
  if (!data.events.length) return <p className="go-track-empty">Chưa có hoạt động nào của chuyến.</p>;
  return (
    <ol className="go-track-log">
      {data.events.map((e, i) => (
        <li key={i} className={`go-track-log-item go-track-log-item--${e.type}`}>
          <span className="go-track-log-time">{vnTime(e.at, true)}</span>
          <span className="go-track-log-text">
            {e.label}
            {e.note ? <small>{e.note}</small> : null}
          </span>
        </li>
      ))}
    </ol>
  );
}

export function TripTrackingSheet({ code, phone, onClose }: { code: string; phone: string; onClose: () => void }) {
  const [data, setData] = useState<TripTracking | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(await crewApi.guestTracking(code, phone));
      setError("");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [code, phone]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  // Follow the bus while the trip is not finished.
  useEffect(() => {
    if (!data || data.state === "finished") return;
    const t = window.setInterval(load, 15000);
    return () => window.clearInterval(t);
  }, [data, load]);

  return (
    <div className="go-modal-backdrop" onClick={onClose}>
      <div className="go-bottom-sheet go-track-sheet" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Theo dõi chuyến xe">
        <div className="go-sheet-handle" />
        <div className="go-track-head">
          <div>
            <h3>Theo dõi chuyến xe</h3>
            {data && (
              <p>
                {data.trip.from} → {data.trip.to} · {vnTime(data.trip.departAt, true)}
                {data.trip.plate ? ` · ${data.trip.plate}` : ""}
              </p>
            )}
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <button type="button" className="go-icon-btn" onClick={load} aria-label="Làm mới" disabled={loading}>
              <RefreshCw size={18} className={loading ? "go-spin" : undefined} />
            </button>
            <button type="button" className="go-icon-btn" onClick={onClose} aria-label="Đóng">
              <X size={20} />
            </button>
          </div>
        </div>

        {error && <div className="go-track-status go-track-status--off">{error}</div>}
        {!data && !error && <p className="go-track-empty">Đang tải hành trình…</p>}
        {data && (
          <>
            <TrackingStatus data={data} />
            <TripMap stops={data.stops} path={data.path} position={data.position} height={250} />
            {!data.routeChecked && (
              <p className="go-track-note">Nhà xe chưa nhập tọa độ các điểm dừng nên app chưa kiểm tra được xe có đi đúng tuyến.</p>
            )}
            <h4 className="go-track-subtitle">Nhật ký chuyến</h4>
            <TripLog data={data} />
            <h4 className="go-track-subtitle">Lộ trình</h4>
            <ul className="go-track-stops">
              {data.stops.map((s) => (
                <li key={s.kind + s.id}>
                  <MapPin size={14} className={s.kind === "pickup" ? "is-pickup" : "is-dropoff"} />
                  <span>
                    <strong>{s.time}</strong> {s.name}
                    {s.address && s.address !== s.name ? <small>{s.address}</small> : null}
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
