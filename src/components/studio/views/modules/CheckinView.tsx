import { useEffect, useRef, useState } from "react";
import { BusFront, Camera, CheckCircle2, RefreshCw, ScanLine, Search, Undo2, Users, X } from "lucide-react";
import { studioModules, vnToday, type BoardingTicket, type BoardingTrip } from "../../../../services/studioModulesApi";
import { Kpi, Notice, PartnerSelect, hm, dmy, useLoad, usePartners, vnd } from "./kit";

type BarcodeDetectorLike = { detect: (src: CanvasImageSource) => Promise<{ rawValue: string }[]> };

/** Soát vé lên xe: scan/type a ticket code or phone, board passengers, follow each trip's progress. */
export default function CheckinView() {
  const partners = usePartners();
  const [partnerId, setPartnerId] = useState("");
  const [date, setDate] = useState(vnToday());
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<BoardingTicket[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ kind: "ok" | "error" | "warn"; text: string } | null>(null);
  const [openTrip, setOpenTrip] = useState<string | null>(null);
  const [manifest, setManifest] = useState<BoardingTicket[] | null>(null);
  const [scanning, setScanning] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const trips = useLoad(() => studioModules.boardingTrips(date, partnerId || undefined).then((r) => r.data.trips), [date, partnerId]);
  const canScan = typeof window !== "undefined" && "BarcodeDetector" in window && !!navigator.mediaDevices?.getUserMedia;

  const search = async (q = query) => {
    const term = q.trim();
    if (term.length < 3) { setNotice({ kind: "warn", text: "Nhập ít nhất 3 ký tự: mã vé hoặc số điện thoại." }); return; }
    setBusy(true); setNotice(null);
    try {
      const r = await studioModules.lookupTicket(term);
      setResults(r.data);
      if (!r.data.length) setNotice({ kind: "warn", text: `Không tìm thấy vé "${term}".` });
    } catch (e) { setNotice({ kind: "error", text: (e as Error).message }); }
    finally { setBusy(false); }
  };

  const refreshAfter = async (id: string, updated?: BoardingTicket) => {
    if (updated) setResults((rs) => rs?.map((t) => (t.id === id ? updated : t)) ?? rs);
    void trips.reload();
    if (openTrip) setManifest((await studioModules.tripManifest(openTrip)).data);
  };

  const board = async (t: BoardingTicket) => {
    setBusy(true);
    try {
      const r = await studioModules.board(t.id);
      setNotice({ kind: "ok", text: r.message || "Đã cho lên xe" });
      await refreshAfter(t.id, r.data);
      setQuery(""); inputRef.current?.focus();
    } catch (e) { setNotice({ kind: "error", text: (e as Error).message }); }
    finally { setBusy(false); }
  };

  const undo = async (t: BoardingTicket) => {
    if (!window.confirm(`Huỷ soát vé ${t.booking_code}?`)) return;
    try {
      await studioModules.undoBoard(t.id);
      setNotice({ kind: "ok", text: `Đã huỷ soát vé ${t.booking_code}` });
      await refreshAfter(t.id, { ...t, checked_in_at: null, checked_in_by: null, booking_status: "confirmed", can_board: true });
    } catch (e) { setNotice({ kind: "error", text: (e as Error).message }); }
  };

  const toggleTrip = async (id: string) => {
    if (openTrip === id) { setOpenTrip(null); setManifest(null); return; }
    setOpenTrip(id); setManifest(null);
    try { setManifest((await studioModules.tripManifest(id)).data); } catch (e) { setNotice({ kind: "error", text: (e as Error).message }); }
  };

  // Camera QR scanning where the browser supports BarcodeDetector.
  useEffect(() => {
    if (!scanning) return;
    let stream: MediaStream | null = null;
    let stop = false;
    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        if (!videoRef.current) return;
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        const Detector = (window as unknown as { BarcodeDetector: new (o: { formats: string[] }) => BarcodeDetectorLike }).BarcodeDetector;
        const detector = new Detector({ formats: ["qr_code", "code_128"] });
        while (!stop && videoRef.current) {
          const codes = await detector.detect(videoRef.current).catch(() => []);
          if (codes[0]?.rawValue) {
            const raw = codes[0].rawValue;
            const code = (raw.match(/[A-Z]{2,4}-[A-Z0-9]{4,}/i)?.[0] || raw).trim();
            setScanning(false); setQuery(code); void search(code);
            break;
          }
          await new Promise((r) => setTimeout(r, 250));
        }
      } catch {
        setNotice({ kind: "error", text: "Không mở được camera. Hãy cho phép quyền camera hoặc nhập mã vé." });
        setScanning(false);
      }
    })();
    return () => { stop = true; stream?.getTracks().forEach((t) => t.stop()); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scanning]);

  const list: BoardingTrip[] = trips.data ?? [];
  const booked = list.reduce((s, t) => s + Number(t.seats_booked), 0);
  const boarded = list.reduce((s, t) => s + Number(t.seats_boarded), 0);

  const ticketCard = (t: BoardingTicket) => {
    const blocked = t.booking_status === "cancelled";
    return (
      <div key={t.id} className={`dm-ticket${t.checked_in_at ? " boarded" : blocked ? " blocked" : ""}`}>
        <div>
          <h4>{t.customer_name} <span className="dm-pill dm-pill-gray">{t.booking_code}</span></h4>
          <div className="dm-ticket-meta">
            <span>📞 {t.customer_phone}</span>
            <span>💺 {(Array.isArray(t.seats) ? t.seats.join(", ") : "") || `${t.seat_count} ghế`}</span>
            <span>🚌 {t.route_name || "—"}</span>
            <span>🕒 {hm(t.depart_time)} {dmy(t.depart_time)}</span>
            {t.plate_number && <span>🔖 {t.plate_number}</span>}
            <span>{vnd(t.final_amount)} · {t.payment_status === "paid" ? "Đã thanh toán" : "Chưa thanh toán đủ"}</span>
          </div>
        </div>
        <div>
          {t.checked_in_at ? (
            <div style={{ display: "grid", gap: 6, justifyItems: "end" }}>
              <span className="dm-pill dm-pill-green"><CheckCircle2 size={14} /> Đã lên xe {hm(t.checked_in_at)}</span>
              <button type="button" className="dm-btn dm-btn-sm" onClick={() => undo(t)}><Undo2 size={14} /> Huỷ soát</button>
            </div>
          ) : (
            <button type="button" className="ds-primary dm-board-btn" disabled={busy || blocked} onClick={() => board(t)}>
              <CheckCircle2 size={18} /> Cho lên xe
            </button>
          )}
        </div>
        {t.warnings.length > 0 && !t.checked_in_at && (
          <div className="dm-ticket-warn">{t.warnings.map((w) => <Notice key={w} kind={blocked ? "error" : "warn"}>{w}</Notice>)}</div>
        )}
      </div>
    );
  };

  return (
    <div className="ds-page" style={{ gap: 18 }}>
      <div className="dm-head">
        <div>
          <h2>Soát vé lên xe</h2>
          <p>Quét QR hoặc nhập mã vé / số điện thoại, xác nhận hành khách lên xe và theo dõi từng chuyến.</p>
        </div>
      </div>

      <div className="dm-card">
        <form className="dm-scan" onSubmit={(e) => { e.preventDefault(); void search(); }}>
          <input ref={inputRef} autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Mã vé (VD: DGMW4D2R3NUX) hoặc số điện thoại" aria-label="Mã vé hoặc số điện thoại" autoComplete="off" />
          <button className="ds-primary" disabled={busy}><Search size={18} /> Tìm vé</button>
          {canScan && (
            <button type="button" className="dm-btn" style={{ height: 52 }} onClick={() => setScanning((v) => !v)}>
              {scanning ? <><X size={18} /> Tắt camera</> : <><Camera size={18} /> Quét QR</>}
            </button>
          )}
        </form>
        {scanning && (
          <div style={{ marginTop: 12, position: "relative", maxWidth: 420 }}>
            <video ref={videoRef} muted playsInline style={{ width: "100%", borderRadius: 14, background: "#0f172a" }} />
            <ScanLine size={42} style={{ position: "absolute", inset: 0, margin: "auto", color: "#fff", opacity: 0.8 }} />
          </div>
        )}
        {notice && <div style={{ marginTop: 12 }}><Notice kind={notice.kind} onClose={() => setNotice(null)}>{notice.text}</Notice></div>}
        {results && results.length > 0 && <div style={{ display: "grid", gap: 10, marginTop: 14 }}>{results.map(ticketCard)}</div>}
      </div>

      <div className="dm-kpis">
        <Kpi icon={<BusFront size={18} />} label="Chuyến trong ngày" value={list.length} />
        <Kpi icon={<Users size={18} />} label="Ghế đã bán" value={booked} />
        <Kpi icon={<CheckCircle2 size={18} />} tone="green" label="Đã lên xe" value={boarded} hint={booked ? `${Math.round((boarded / booked) * 100)}% hành khách` : undefined} />
        <Kpi icon={<Users size={18} />} tone="orange" label="Chưa lên xe" value={Math.max(0, booked - boarded)} />
      </div>

      <div className="dm-card">
        <div className="dm-head" style={{ marginBottom: 12 }}>
          <h3 style={{ margin: 0, fontSize: 15.5, color: "#102744" }}>Chuyến ngày {dmy(date)}</h3>
          <div className="dm-toolbar">
            <PartnerSelect value={partnerId} onChange={setPartnerId} partners={partners} />
            <input type="date" value={date} onChange={(e) => setDate(e.target.value || vnToday())} aria-label="Ngày khởi hành" />
            <button type="button" className="dm-btn" onClick={() => trips.reload()}><RefreshCw size={15} /> Làm mới</button>
          </div>
        </div>
        {trips.error && <Notice kind="error">{trips.error}</Notice>}
        <div className="dm-table-wrap">
          <table className="dm-table">
            <thead><tr><th>Giờ chạy</th><th>Tuyến</th><th>Nhà xe</th><th>Xe</th><th>Tiến độ lên xe</th><th /></tr></thead>
            <tbody>
              {trips.loading && !list.length && <tr><td colSpan={6} className="dm-empty">Đang tải chuyến…</td></tr>}
              {!trips.loading && !list.length && <tr><td colSpan={6} className="dm-empty">Không có chuyến khởi hành ngày {dmy(date)}.</td></tr>}
              {list.map((t) => {
                const pctBoarded = Number(t.seats_booked) ? Math.round((Number(t.seats_boarded) / Number(t.seats_booked)) * 100) : 0;
                return [
                  <tr key={t.id}>
                    <td><strong>{hm(t.depart_time)}</strong></td>
                    <td>{t.route_name || "—"}</td>
                    <td>{t.partner_name || "—"}</td>
                    <td>{t.plate_number || "—"}</td>
                    <td style={{ minWidth: 190 }}>
                      <div className="dm-bar-cell">
                        <div className="dm-progress"><i style={{ width: `${pctBoarded}%` }} /></div>
                        <span style={{ fontSize: 12.5, whiteSpace: "nowrap" }}>{t.seats_boarded}/{t.seats_booked} ghế</span>
                      </div>
                    </td>
                    <td className="num"><button type="button" className="dm-btn dm-btn-sm" onClick={() => toggleTrip(t.id)}>{openTrip === t.id ? "Ẩn" : "Danh sách"}</button></td>
                  </tr>,
                  openTrip === t.id && (
                    <tr key={t.id + "-m"}>
                      <td colSpan={6} style={{ background: "#f8fafc" }}>
                        {!manifest ? "Đang tải hành khách…" : manifest.length === 0 ? "Chưa có hành khách." : (
                          <div style={{ display: "grid", gap: 8 }}>{manifest.map(ticketCard)}</div>
                        )}
                      </td>
                    </tr>
                  ),
                ];
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
