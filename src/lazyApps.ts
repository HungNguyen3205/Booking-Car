import { lazy } from "react";

// Lazy so the app's global stylesheet (shared .go-* class names such as
// .go-home-header) only loads on /appgo and never restyles the homepage.
export const DanavaGoApp = lazy(() => import("./components/appgo/DanavaGoApp"));
