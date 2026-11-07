import { useEffect, useRef, useState } from "react";
import { crewApi } from "../../services/crewApi";

/**
 * Crew phone -> server GPS while a trip runs.
 * watchPosition keeps the freshest fix; every SEND_MS the latest fix is posted
 * (the server ignores points closer than 5 s). A screen wake lock is requested
 * so the phone does not sleep; browsers stop GPS when the app is in the
 * background, which is why the crew screen asks to keep the app open.
 */
const SEND_MS = 15000;

export type GpsState = "idle" | "waiting" | "sharing" | "denied" | "unsupported" | "error";
type WakeLockLike = { release: () => Promise<void> };

export function useGpsShare(tripId: string | null) {
  const [state, setState] = useState<GpsState>("idle");
  const [lastSent, setLastSent] = useState<string | null>(null);
  const [offRoute, setOffRoute] = useState(false);
  const [error, setError] = useState("");
  const fix = useRef<GeolocationPosition | null>(null);

  useEffect(() => {
    if (!tripId) return;
    if (!("geolocation" in navigator)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setState("unsupported");
      return;
    }
    let live = true;
    let wake: WakeLockLike | null = null;
    setState("waiting");
    const watch = navigator.geolocation.watchPosition(
      (p) => {
        fix.current = p;
        if (live) setState((s) => (s === "waiting" ? "sharing" : s));
      },
      (e) => {
        if (!live) return;
        setState(e.code === e.PERMISSION_DENIED ? "denied" : "error");
        setError(e.code === e.PERMISSION_DENIED ? "Bạn chưa cho phép app dùng vị trí." : e.message);
      },
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 30000 },
    );
    const send = async () => {
      const p = fix.current;
      if (!p) return;
      try {
        const r = await crewApi.position(tripId, {
          lat: p.coords.latitude,
          lng: p.coords.longitude,
          accuracy: p.coords.accuracy,
          speed: p.coords.speed,
          heading: p.coords.heading,
        });
        if (!live) return;
        setLastSent(new Date().toISOString());
        setOffRoute(r.data.offRoute);
        setError("");
        setState("sharing");
      } catch (e) {
        if (live) setError((e as Error).message); // offline: next tick retries with the newest fix
      }
    };
    const first = window.setTimeout(send, 3000);
    const timer = window.setInterval(send, SEND_MS);
    const nav = navigator as Navigator & { wakeLock?: { request: (t: "screen") => Promise<WakeLockLike> } };
    nav.wakeLock
      ?.request("screen")
      .then((w) => {
        if (live) wake = w;
        else void w.release();
      })
      .catch(() => undefined);
    return () => {
      live = false;
      navigator.geolocation.clearWatch(watch);
      window.clearTimeout(first);
      window.clearInterval(timer);
      wake?.release().catch(() => undefined);
    };
  }, [tripId]);

  return { state: tripId ? state : ("idle" as GpsState), lastSent, offRoute, error, current: fix };
}
