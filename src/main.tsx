import { StrictMode, Suspense } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import PortalEntry from "./components/portals/PortalEntry";
import StudioEntry from "./components/studio/StudioEntry";
import { DanavaGoApp } from "./lazyApps";
import { DEFAULT_APP_ROOT, canonicalStudioUrl, resolveSurface } from "./utils/surface";

const appRoot = import.meta.env.VITE_APP_ROOT || DEFAULT_APP_ROOT;
// /admin and admin.{root} are legacy aliases of the one Studio at /manage.
const canonical = canonicalStudioUrl(window.location, appRoot);
if (canonical?.startsWith("/")) window.history.replaceState(window.history.state, "", canonical);
else if (canonical) window.location.replace(canonical);

// Host/path -> app map lives in utils/surface.ts (see docs/LARAVEL_PORTALS.md).
const surface = resolveSurface(window.location.hostname, window.location.pathname, appRoot);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {surface === "studio" ? (
      <StudioEntry />
    ) : surface === "profile" ? (
      <PortalEntry profile />
    ) : surface === "appgo" ? (
      <Suspense fallback={null}>
        <DanavaGoApp />
      </Suspense>
    ) : surface === "operator-app" ? (
      <PortalEntry />
    ) : (
      <App />
    )}
  </StrictMode>,
);
