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


## Operator Studio / full-stack pilot

Read `docs/OPERATOR_STUDIO.md` for setup, API contracts, role matrix and limitations.
`/manage` and `/admin` use `src/components/studio/StudioApp.tsx`, `studioConfig.ts`,
`studio.css` and `src/services/platformApi.ts`. Do not modify the homepage scene
for management changes. Server modules: `server/index.mjs` (HTTP/RBAC),
`security.mjs` (sessions), `domain.mjs` (booking/inventory/ledger), `database.mjs`
(SQLite) and `seed.mjs` (DANAVAGO sample). Run `npm run test:server` after changes
to API, authorization or money/inventory logic. Node 22.13+ or 24 is required.
Normal frontend mode uses the API; never silently fall back to mock trips when it
fails. `VITE_BOOKING_MODE=demo` explicitly opts into the old standalone demo.
`/app` remains the existing Cửa Ông demo, separate from this API pilot.
Do not commit `.env`, `var/`, SQLite databases, credentials or uploaded customer
images. Never enable an authentication bypass or ship QA fixture accounts.
Static cPanel `dist` updates alone do not run this backend. Do not use the old
static deployment procedure for this branch without setting up the Node service.
