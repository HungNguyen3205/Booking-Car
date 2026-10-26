# DANAVA GO hero

## Current implementation

One 1600×1000 scene camera, cream/navy/teal DOM UI, existing Be Vietnam Pro and alpha vehicle images. No WebGL or 3D dependency. Desktop reference comparison uses 1586×992, Đà Nẵng→Hội An, Cabin VIP. Other targets: 1440×900, 1280×800, short desktop 1440×760 and mobile width390. Short desktop grows the hero so wheels/form remain separate.

Shared neutral sky/mountains/curved road stay mounted. The foreground uses the same decoded background through an SVG clip, above city water and below the vehicle. No second road image is downloaded. It keeps the original roadside vegetation/guardrail instead of painting a straight artificial ribbon.

## Assets and city mapping

| City | Image | Landmark |
|---|---|---|
| Đà Nẵng | journey_heritage_alpha.webp, left crop | Cầu Rồng / Sông Hàn |
| Hội An | journey_heritage_alpha.webp, right crop | Old-town riverfront |
| Huế | journey_city_banks.webp | Ngọ Môn |
| Nha Trang | journey_city_banks.webp | Tháp Trầm Hương |
| TP. Hồ Chí Minh | journey_hcm_bank.webp | Landmark81 |
| Hà Nội | journey_city_banks.webp | Tháp Rùa |
| Quy Nhơn | journey_city_banks.webp | Twin towers / coastline |
| Đà Lạt | journey_city_banks.webp | Railway station / gardens |

All files are under public/assets/images/scenes. Actual source dimensions/crops and role-specific framing are in journeyStageConfig.ts. The primary asset has true-alpha sky, so it needs no sky fade to hide opaque rectangular sky remnants. Water blending is confined below architecture. Reverse changes positions, never mirrors architecture. DaNang destination framing keeps its dragon outside the centered tabs; mobile origin framing preserves the dragon head.

One new production asset was prepared with the built-in image generation tool, using the user reference as the edit target, then encoded as WebP without changing image content:

`public/assets/images/scenes/journey_heritage_alpha.webp` (1585×992 RGBA).
Prompt: preserve photographic left DragonBridge/DaNang skyline and right HoiAn yellow riverfront/boats/reflections at the reference camera and scale; complete scenery behind the removed bus; remove all UI, text, vehicle, sky, distant mountains, road, guardrail and foreground flowers; true transparent silhouette around architecture/trees/cables; keep architecture opaque, feather only bottom water; no miniature islands, pedestals or new invented architecture. Keep the 1.6:1 composition.

The three unused v2/preview files with residual sky were removed after auditing source references. Existing city banks, HCM bank, neutral landscape and all three right-facing vehicles were retained. No reference screenshot is rendered as production UI. Labels, tabs and search form are HTML.

## Motion and async lifecycle

Vehicle movement uses a Framer Motion progress value (no React state updates per frame). A three-segment cubic path traces the far right bend, the return to the left, and the approach to the center of the existing road. Travel duration is 2.8s, once on entry and once per new vehicle category, with an eased stop. All three stop at a common visible center/ground anchor; native image padding is measured independently.

A shared atlas supplies front/right and rear/left views for each category; these are genuinely different generated views, never mirrored artwork. Short distant crossfades select the heading. The final front-right photograph blends in while the vehicle is still small (46–54% of progress), avoiding a large double silhouette. Shadow travels/scales with its vehicle and stops with it. Atlas errors fall back to a short near-camera entry; hero UI does not depend on animation completion.

Vehicle identity depends only on category. Route changes/reverse do not reload/remount/shrink/fade the bus. Request tokens and effect cleanup ignore stale async work after selection changes/unmount. Failed target retains previous vehicle; initial failure tries a decoded fallback. Reduced motion settles directly and switching it off does not replay intro. Resize settles an in-flight approach instead of starting over.

Selected city swaps decode first, ignore stale requests, then fade/rise10px over450ms. Initial city entrance waits for introReady, so it does not play behind the loader. Unchanged slots are memoized. Mask/clip IDs include slot, hashed city ID and photo/fallback state. Missing/failed scene uses its own name and neutral terrain. Form remains mounted, retaining date/passengers and validation.

## Validation workflow

- `npm run build`, `npm run lint`.
- For layout/motion iterations after build: `npm run test:hero` (focused hero checks).
- Final integration: `npm run test:journey` (hero + all8 cities in both roles + failure paths + booking through ticket issuance).
- Do not rerun the complete booking suite after every CSS edit. Inspect a fixed-viewport browser capture first; rerun checks when code changes or a failure needs resolution.
- Optional PLAYWRIGHT_CHROMIUM_EXECUTABLE / JOURNEY_QA_DIR configure local Chromium/output. Outputs are ignored, not copied into public.

Browser checks measure actual nontransparent vehicle pixels independently of PNG canvas padding: center, size, wheel/form clearance. They also sample DOM identity/opacity/scale throughout route changes, verify all3 replacements, reverse, fixed road, latest selection, short/mobile layout, live motion preference, fallback, no runtime/HTTP errors and existing booking flow.

## Limits

This is an independently layered travel composition, not a pixel-identical raster copy of the reference. Existing coach geometry/font details differ from the generated concept. Secondary cities remain panoramic illustrations; their arrangement is not a geographically exact map. Single-view vehicle photos are not free-camera 3D models or independent wheel rigs. Functional test success does not establish subjective visual approval.

## Vehicle assets / generation provenance

Three project assets were prepared with the built-in image generation skill and encoded as WebP with alpha preserved:

- `public/assets/images/sleeper-premium.webp`, 1678×937: upgraded two-axle sleeper, navy/gold/teal livery, warm interior, refined headlights and tires. Image target was the old sleeper; Cabin VIP supplied fleet lighting/material reference. Prompt constrained front-right camera, nose right, whole mirrors/wheels, true alpha, no floor/shadow/scenery, restrained DANAVA GO branding, no giant windshield text.
- `public/assets/images/limousine-premium.webp`, 1678×937: same constraints applied to the original compact high-roof van, retaining van identity and two axles. Navy hood/body, thin champagne/teal trim, tan interior; Cabin VIP supplied lighting/material reference.
- `public/assets/images/fleet-turns.webp`, 1254×1254: six isolated sprites in two columns and three rows. Rows follow sleeper/van/cabin; columns front-right and rear-left. Generated from the new vehicle references and existing Cabin VIP, then refined with separated cells and true alpha. Measured alpha bounds are recorded in `journeyStageConfig.ts`; nested SVG crops retain whole wheels/mirrors.

The first generated travel atlas was rejected because row spacing could clip wheel/mirror edges. Only the refined asset is shipped. Source PNGs remain outside the repository. The two old unreferenced right-facing sleeper/van PNGs were removed after searching source/scripts/docs; catalog vehicle images and the existing Cabin VIP remain. New WebP assets total about874KiB, replacing about1841KiB of old hero PNGs, so tracked image weight decreases about967KiB.

## Current handoff

- Base: GitHub main4166a78. Header, form, landmark scene and booking components are unchanged.
- Updated: VehicleMotionStage, journeyStageConfig, the two heroImage fields in mockData, QA script, asset files, agent map and this guide.
- Final integration:64 checks passed including actual sampled left/right motion and rear-view usage for all3 vehicles, all8 city images in both roles, missing assets, preserved form values and booking through ticket issuance. The subsequent small visual crossfade refinement is checked again with the focused hero suite and a new actual browser recording.
- This remains 2.5D with discrete photographed/generated angles. It is not a free-camera 3D model, continuous physical steering rig or independently rotating-wheel model. Functional success does not substitute for the user's visual approval.
- Compare actual screenshots and recorded runtime video; concept images are not runtime proof.
