import { useEffect, useState } from "react";
import { api } from "../../services/platformApi";
import type { OperatorProfile } from "../portals/portalTypes";
import { DanavaGoApp } from "./DanavaGoApp";
import { DANAVA_BRAND, operatorBrand, type AppBrand } from "./appgoBrand";

/**
 * Operator app = appgo with the operator's brand.
 * - Tenant host ({slug}.danavago.com, verified own domain): /public/context
 *   returns the operator the server resolved from the hostname.
 * - Local preview /app/{slug}: /public/operators/{slug}.
 * - /app without an operator on a platform host: plain DANAVA Go.
 * The server still scopes search/hold/booking to the host's tenant; the brand
 * only changes what the app looks like.
 */
type State = { brand: AppBrand } | { error: string } | null;

export default function OperatorBrandedApp() {
  const [state, setState] = useState<State>(null);

  useEffect(() => {
    const c = new AbortController();
    const slug = decodeURIComponent(window.location.pathname.match(/^\/app\/([^/]+)/)?.[1] || "");
    const load = slug
      ? api<OperatorProfile>("/public/operators/" + encodeURIComponent(slug), { signal: c.signal })
      : api<{ operator: OperatorProfile | null }>("/public/context", { signal: c.signal }).then((r) => r.operator);
    load
      .then((o) => {
        if (c.signal.aborted) return;
        if (!o) return setState({ brand: DANAVA_BRAND });
        if (!o.appEnabled) return setState({ error: "Ứng dụng nhà xe chưa được bật. Vui lòng truy cập trang nhà xe." });
        document.title = `${o.name} · Đặt vé`;
        setState({ brand: operatorBrand(o) });
      })
      .catch((e) => {
        if (!c.signal.aborted) setState({ error: (e as Error).message || "Không mở được ứng dụng nhà xe." });
      });
    return () => c.abort();
  }, []);

  if (!state) return <div style={{ padding: 40, fontFamily: "system-ui" }}>Đang mở ứng dụng…</div>;
  if ("error" in state)
    return (
      <div role="alert" style={{ padding: 40, fontFamily: "system-ui", maxWidth: 440, margin: "0 auto" }}>
        <h1 style={{ fontSize: 20 }}>Không mở được ứng dụng</h1>
        <p>{state.error}</p>
      </div>
    );
  // key: a different operator mounts a fresh app (search state, saved tickets).
  return <DanavaGoApp key={state.brand.slug || "platform"} brand={state.brand} />;
}
