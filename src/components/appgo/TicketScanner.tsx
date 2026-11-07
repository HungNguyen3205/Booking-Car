import { useCallback, useEffect, useRef, useState } from "react";
import { AlertTriangle, Camera, CameraOff, CheckCircle2, Search, UserCheck } from "lucide-react";
import jsQR from "jsqr";
import { crewApi, ticketCodeFromScan, type CheckinTicket } from "../../services/crewApi";

/**
 * Ticket scan bound to ONE trip (the bus being boarded). The server refuses a
 * ticket of another bus and says which bus/time it belongs to.
 * Camera: BarcodeDetector where available (Android Chrome), jsQR otherwise
 * (iPhone Safari). Manual entry by ticket code or phone always works.
 */
type BarcodeDetectorLike = { detect: (src: CanvasImageSource) => Promise<{ rawValue: string }[]> };

const money = (n: number) => n.toLocaleString("vi-VN") + "đ";

export function TicketScanner({ tripId, onBoarded }: { tripId: string; onBoarded?: (ticket: CheckinTicket) => void }) {
  const video = useRef<HTMLVideoElement | null>(null);
  const canvas = useRef<HTMLCanvasElement | null>(null);
  const [camera, setCamera] = useState(false);
  const [camError, setCamError] = useState("");
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ kind: "found"; tickets: CheckinTicket[] } | { kind: "error"; text: string } | { kind: "boarded"; ticket: CheckinTicket; text: string } | null>(null);
  const paused = useRef(false);

  const lookup = useCallback(
    async (raw: string) => {
      const q = ticketCodeFromScan(raw);
      if (q.length < 3) return;
      paused.current = true;
      setBusy(true);
      try {
        const r = await crewApi.lookup(q, tripId);
        setResult(r.data.length ? { kind: "found", tickets: r.data } : { kind: "error", text: `Không tìm thấy vé "${q}" trên chuyến này.` });
      } catch (e) {
        setResult({ kind: "error", text: (e as Error).message });
      } finally {
        setBusy(false);
      }
    },
    [tripId],
  );

  const board = async (t: CheckinTicket) => {
    setBusy(true);
    try {
      const r = await crewApi.board(t.id, tripId);
      setResult({ kind: "boarded", ticket: r.data, text: r.message || "Đã cho khách lên xe" });
      onBoarded?.(r.data);
    } catch (e) {
      setResult({ kind: "error", text: (e as Error).message });
    } finally {
      setBusy(false);
    }
  };

  const next = () => {
    setResult(null);
    setQuery("");
    paused.current = false;
  };

  // Camera loop.
  useEffect(() => {
    if (!camera) return;
    let stream: MediaStream | null = null;
    let raf = 0;
    let live = true;
    const W = window as unknown as { BarcodeDetector?: new (o: { formats: string[] }) => BarcodeDetectorLike };
    const detector = W.BarcodeDetector ? new W.BarcodeDetector({ formats: ["qr_code"] }) : null;
    const tick = async () => {
      if (!live) return;
      const v = video.current;
      if (v && v.readyState >= 2 && !paused.current) {
        try {
          let text = "";
          if (detector) {
            text = (await detector.detect(v))[0]?.rawValue || "";
          } else if (canvas.current) {
            const c = canvas.current;
            const w = (c.width = Math.min(640, v.videoWidth));
            const h = (c.height = Math.round((v.videoHeight / v.videoWidth) * w));
            const ctx = c.getContext("2d", { willReadFrequently: true });
            if (ctx && w && h) {
              ctx.drawImage(v, 0, 0, w, h);
              text = jsQR(ctx.getImageData(0, 0, w, h).data, w, h, { inversionAttempts: "dontInvert" })?.data || "";
            }
          }
          if (text) {
            navigator.vibrate?.(80);
            void lookup(text);
          }
        } catch {
          /* frame not ready */
        }
      }
      raf = window.setTimeout(() => requestAnimationFrame(tick), 250) as unknown as number;
    };
    navigator.mediaDevices
      ?.getUserMedia({ video: { facingMode: "environment" }, audio: false })
      .then((s) => {
        if (!live) return s.getTracks().forEach((t) => t.stop());
        stream = s;
        if (video.current) {
          video.current.srcObject = s;
          void video.current.play();
        }
        void tick();
      })
      .catch((e) => {
        setCamError(e?.name === "NotAllowedError" ? "Bạn chưa cho phép app dùng camera." : "Không mở được camera trên máy này.");
        setCamera(false);
      });
    return () => {
      live = false;
      window.clearTimeout(raf);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [camera, lookup]);

  return (
    <div className="go-scan">
      {camera ? (
        <div className="go-scan-video">
          <video ref={video} playsInline muted />
          <div className="go-scan-frame" aria-hidden />
          <canvas ref={canvas} hidden />
          <button type="button" className="go-scan-cam-btn" onClick={() => setCamera(false)}>
            <CameraOff size={16} /> Tắt camera
          </button>
        </div>
      ) : (
        <button type="button" className="go-btn-primary" onClick={() => { setCamError(""); setCamera(true); paused.current = false; }}>
          <Camera size={18} /> <span>Mở camera quét QR vé</span>
        </button>
      )}
      {camError && <p className="go-scan-msg go-scan-msg--error">{camError}</p>}

      <form
        className="go-scan-manual"
        onSubmit={(e) => {
          e.preventDefault();
          void lookup(query);
        }}
      >
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Nhập mã vé hoặc SĐT khách" aria-label="Mã vé hoặc số điện thoại" />
        <button type="submit" disabled={busy || query.trim().length < 3} aria-label="Tìm vé">
          <Search size={18} />
        </button>
      </form>

      {result?.kind === "error" && (
        <div className="go-scan-result go-scan-result--error" role="alert">
          <AlertTriangle size={20} />
          <div>
            <strong>Không cho lên xe</strong>
            <p>{result.text}</p>
            <button type="button" onClick={next}>Quét vé khác</button>
          </div>
        </div>
      )}
      {result?.kind === "boarded" && (
        <div className="go-scan-result go-scan-result--ok" role="status">
          <CheckCircle2 size={20} />
          <div>
            <strong>{result.text}</strong>
            <p>
              {result.ticket.customer_name} · ghế {result.ticket.seats.join(", ")}
              {result.ticket.pickup ? ` · đón tại ${result.ticket.pickup}` : ""}
            </p>
            <button type="button" onClick={next}>Quét vé tiếp</button>
          </div>
        </div>
      )}
      {result?.kind === "found" &&
        result.tickets.map((t) => (
          <div key={t.id} className={`go-scan-result ${t.can_board ? "go-scan-result--found" : "go-scan-result--error"}`}>
            <UserCheck size={20} />
            <div>
              <strong>
                {t.customer_name} · {t.booking_code}
              </strong>
              <p>
                Ghế {t.seats.join(", ")} · {t.customer_phone}
                {t.pickup ? ` · đón ${t.pickup}` : ""}
              </p>
              {t.booking_status === "checked_in" && <p className="go-scan-warn">Vé đã soát lúc {t.checked_in_at?.slice(11, 16)}</p>}
              {t.due_amount > 0 && <p className="go-scan-warn">Còn nợ {money(t.due_amount)}: thu tiền trước khi cho lên xe.</p>}
              {t.warnings.filter((w) => !w.startsWith("Vé còn nợ")).map((w) => (
                <p key={w} className="go-scan-warn">{w}</p>
              ))}
              <div className="go-scan-actions">
                {t.can_board && t.booking_status !== "checked_in" && (
                  <button type="button" className="is-primary" disabled={busy} onClick={() => board(t)}>
                    Cho lên xe
                  </button>
                )}
                <button type="button" onClick={next}>Bỏ qua</button>
              </div>
            </div>
          </div>
        ))}
    </div>
  );
}
