# DANAVA GO — agent guide

Work in this existing React/TypeScript/Vite app. Read `git status` before editing.
Never discard uncommitted user work. No new project, deployment, force push, or Git history rewrite.
Commit/push only when explicitly authorized in the conversation.

## Read the smallest relevant area

Start with `package.json`, this file, and the file map below. Search symbols with `rg`.
Do not recursively read all source, docs, image files, node_modules or installed skills.
Load only skills relevant to the current task. Review the actual browser result before claiming visual completion.

## Current architecture

- `src/components/danava-go/DanavaGoHero.tsx`: only homepage hero.
- `danava-go-hero.css`: full-screen desktop and separate mobile layout.
- `LayeredSceneStage.tsx`: persistent landscape plus independent origin/destination panoramic city banks.
- `VehicleMotionStage.tsx`: alpha bus photographs, shared multi-angle turn atlas and 2.1s intro,1.22s near-lane vehicle switch and850ms guarded search departure.
- `journeyStageConfig.ts`: coordinates, cubic drive path, vehicle/city atlas crops and decode cache.
- `src/data/sceneManifest.ts`: canonical city IDs and aliases for13 destinations.
- `src/data/landmarkBanks.json`:26 complete left/right scenery crops across5 atlases.
- `src/data/departureViews.json`:3 rear-facing vehicle crops for search departure.
- `src/data/mockData.ts`: cities, vehicles, routes and demo trips.
- `src/components/home/TripSearchForm.tsx`: existing search/validation, shared by hero.
- `src/App.tsx`: booking navigation and shared SearchParams.
- `src/utils/searchNavigation.ts`: clean root URL, legacy query import and per-history-entry search restore; never mutate /app or future admin paths. `npm run test:navigation` covers this contract.
- `src/components/seats/SeatButton.tsx`, `SeatMap.tsx`, `seat-experience.css`: capsule / leather armchair / private-suite artwork and inventory-driven layout.
- `src/components/seats/SeatSelectionModal.tsx`: existing selection totals and passenger limit.
- `src/components/seats/BusSeatDeck.tsx`: top-down deck shared by appgo seat choice and the Studio seat-map editor (`studio/views/SeatMapEditor.tsx`). Vehicle `seatMap` (grid, price groups, per-seat surcharge, unsellable seats) lives in `OperatorService::normalizeSeatMap`; customers pay trip fare + seat surcharge (`seatAmount`).
- `src/components/search`, `checkout`, `tickets`: booking flow; preserve behavior.
- `docs/hero.md`: composition, asset provenance, limitations and verification.
- `docs/cleanup.md`: removed resources and context-reduction rationale.

This is a 2.5D image/SVG/DOM implementation with Framer Motion. Three.js, WebGL,
procedural 3D and the legacy hero were removed intentionally. Do not recreate them.

## Lower homepage

Shared layout/styles: `src/components/home/home-editorial.css`. Keep route crops
from existing landmark banks and preview/search callbacks. See `docs/home-editorial.md`
for the section map, working actions and validation.

## Invariants

Origin is left; destination is right. Every selectable city has its own landmark.
Never embed named cities in the shared background, mirror architecture, or label another city's image.
Latest selection wins after async decode. Preserve date/passengers on scene and vehicle changes.
Keep the road mounted. Form must remain clickable, unclipped and independent from scene transforms.
Use Asia/Ho_Chi_Minh dates and existing onSearch. No unrelated-trip fallback.
Respect live reduced motion and image failure paths.

## Checks

`npm ci` for clean setup/dependency changes; `npm run build`, `npm run lint`.
`npx playwright install chromium` once. After build, use `npm run test:hero` for focused hero checks; use `npm run test:journey` for final integration.
Do not repeat full booking QA after every CSS/coordinate adjustment; inspect a fixed-viewport capture first.
Optional `PLAYWRIGHT_CHROMIUM_EXECUTABLE` and `JOURNEY_QA_DIR` configure local QA.
Review 1440×900, 1280×800, 390px screenshots. Do not commit test output or duplicate assets.

## Review regressions

`npm run test:logic` covers exact routes, real calendar dates, dated local inventory,
phone normalization and storage/payment edge cases. `npm run test:audit` runs the
new browser regression paths after build. See `docs/review-2026-10-27.md` for the
review score, confirmed fixes and remaining demo/backend boundaries.

## cPanel deployment reference

For danavago.com hosting updates, read [docs/CPANEL_UPDATE.md](docs/CPANEL_UPDATE.md) first.
It records the confirmed GitHub remote, Node PATH, separate source/public directories,
fail-fast update commands, backup and /app rewrite checks. Creating documentation
does not authorize deployment; follow the user's current scope.


## Laravel / operator apps

Read `docs/LARAVEL_PORTALS.md` before API, hosting or multi-domain changes.
PHP Laravel backend lives in `backend/`; React frontend and hero animations stay.
Host/path → app is `src/utils/surface.ts` (`npm run test:surfaces`), mirrored by
`backend/config/portals.php` + `PortalService::platformHosts()`; change both together.
`app.danavago.com` (local `/appgo`) is appgo, the customer app on `/api/public/*`;
`studio.` (local `/manage`) is the single StudioApp; `admin.`/`/admin` only redirect to it; tenant hosts and
`/app/{slug}` use PortalEntry, `/nha-xe/{slug}` is the operator profile.
PortalService resolves only active verified domains to the correct tenant.
Never trust a client tenant ID to override a tenant-app hostname. Keep sessions
host-only and require CSRF for public booking writes as well as management.
Studio `/api/admin/*` runs on the live model via `StudioBridge` (scope + role areas); never reintroduce
separate booking tables. Run `npm run test:server`, `npm run test:studio`, `npm run test:php`, build/lint and browser QA.
Backend PHP needs 8.3+, Composer 2; production document root is `backend/public`.
Use `npm run build:hosting`, never replace Laravel .htaccess with SPA rewrites.
Do not commit .env, vendor, local runtime, SQLite files, session files or uploads.
Do not deploy or change DNS without the user's authorization and credentials.
No migration of real Node data/passwords is implicit; preserve the old DB until
an explicit data migration and reconciliation have been completed.
