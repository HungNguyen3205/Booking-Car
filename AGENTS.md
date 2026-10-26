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
- `LayeredSceneStage.tsx`: persistent landscape plus independent origin/destination cutouts.
- `VehicleMotionStage.tsx`: existing alpha bus images, short approach animation and transitions.
- `journeyStageConfig.ts`: coordinates, atlas crops, city image mappings, decode cache.
- `src/data/sceneManifest.ts`: canonical city IDs and aliases.
- `src/data/mockData.ts`: cities, vehicles, routes and demo trips.
- `src/components/home/TripSearchForm.tsx`: existing search/validation, shared by hero.
- `src/App.tsx`: booking navigation and shared SearchParams.
- `src/components/search`, `seats`, `checkout`, `tickets`: booking flow. Preserve unless requested.
- `docs/hero.md`: composition, asset provenance, limitations and verification.
- `docs/cleanup.md`: removed resources and context-reduction rationale.

This is a 2.5D image/SVG/DOM implementation with Framer Motion. Three.js, WebGL,
procedural 3D and the legacy hero were removed intentionally. Do not recreate them.

## Invariants

Origin is left; destination is right. Every selectable city has its own landmark.
Never embed named cities in the shared background, mirror architecture, or label another city's image.
Latest selection wins after async decode. Preserve date/passengers on scene and vehicle changes.
Keep the road mounted. Form must remain clickable, unclipped and independent from scene transforms.
Use Asia/Ho_Chi_Minh dates and existing onSearch. No unrelated-trip fallback.
Respect live reduced motion and image failure paths.

## Checks

`npm ci`, `npm run build`, `npm run lint`.
`npx playwright install chromium` once, then `npm run test:journey` after build.
Optional `PLAYWRIGHT_CHROMIUM_EXECUTABLE` and `JOURNEY_QA_DIR` configure local QA.
Review 1440×900, 1280×800, 390px screenshots. Do not commit test output or duplicate assets.
