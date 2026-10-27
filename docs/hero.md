# DANAVA GO — current frontend

## Scope and file map

Existing React/TypeScript/Vite application. This revision continues main `5b23859`;
there is no new app, WebGL, Three.js dependency, deployment or booking backend.

| Area | Files |
|---|---|
| Hero UI / search handoff | `src/components/danava-go/DanavaGoHero.tsx` |
| Persistent road / city layers | `LayeredSceneStage.tsx`, `journeyStageConfig.ts` |
| Vehicle entry / departure | `VehicleMotionStage.tsx` |
| Exact city atlas rectangles | `src/data/landmarkBanks.json` |
| Rear departure atlas rectangles | `src/data/departureViews.json` |
| City IDs / names / aliases | `src/data/sceneManifest.ts` |
| Vehicle catalog / mock trip inventory | `src/data/mockData.ts` |
| Seat geometry and state | `src/components/seats/SeatButton.tsx` |
| Floor layout / coach interior | `SeatMap.tsx`, `seat-experience.css` |
| Seat selection page / totals | `SeatSelectionModal.tsx` |
| Browser acceptance checks | `scripts/verify-journey.cjs` |

Read only the area being changed. Do not scan every skill or source file.

## City composition

There are thirteen selectable destinations, including the nine core city entries
Hà Nội, Hải Phòng, Huế, Đà Nẵng, TP.HCM, Cần Thơ, Đồng Nai, Quảng Ninh and Bắc Ninh.
Hội An, Nha Trang, Đà Lạt and Quy Nhơn remain available.

Every destination has **two separately composed banks**, one for origin/left and
one for destination/right: 26 role crops in five shared WebP atlases. They are
not CSS mirrored copies or the halves of a single scene. Roofs, towers and
shoreline silhouettes are complete before cropping. Crop coordinates are measured
against actual alpha content and actual row separators, not assumed equal rows.

| Atlas under `public/assets/images/scenes/` | Rows |
|---|---|
| `banks-primary.webp` | Đà Nẵng / Hội An |
| `banks-heritage.webp` | Huế / Hà Nội / TP.HCM |
| `banks-river.webp` | Hải Phòng / Cần Thơ / Đồng Nai |
| `banks-northern.webp` | Quảng Ninh / Bắc Ninh |
| `banks-coastal.webp` | Nha Trang / Đà Lạt / Quy Nhơn |

Sky is alpha around the architectural/vegetation silhouette. Water fades only
near the bottom; there is no vertical edge fade to disguise a sliced building.
A common 1600×1000 camera holds the original neutral sky/road/foreground fixed.
Banks sit below labels and use the correct role crop on reverse. Road foreground
occludes the lower scenery naturally. Cities are a travel illustration sharing
a visual horizon, not a geographically contiguous or surveyed map.

Scene changes decode first and crossfade/rise over450ms; cancellation ignores
stale requests. Clip IDs are unique. Unknown or failed images show neutral terrain
and the selected location's own name. New locations have no invented trips: the
existing service still returns an empty result where inventory does not exist.
Only active atlas files load; images are never generated during user interaction.

## Fleet size and movement

The visible alpha width of all three parked vehicles matches Sleeper (about800.5
scene units), measured without transparent canvas padding. Source proportions
are preserved; the van is not stretched into a coach. Anchors keep all three
centered at800,800 desktop /800,849 mobile, with shadows under their tires.

The existing2.8s curved approach uses a MotionValue and three cubic segments.
Category changes decode first, retain the old vehicle while loading, then run the
new category along the road with front/rear views. No React state updates per
animation frame. City changes do not restart/remount/shrink the vehicle.

After the form validates, search enters a single guarded departure state. The
vehicle changes to a prepared rear view, moves slightly upward/forward and
recedes over800ms, then calls the existing onSearch exactly once. A1100ms safety
guard handles a missing/failed vehicle or animation callback. Repeated submissions
cannot cause a second navigation. Reduced motion searches immediately; enabling
it during departure also completes navigation. Timers and animations clean up.
The selected date/passengers are the validated snapshot from the submit event.

`public/assets/images/fleet-departure.webp` supplies one rear view per category.
It preloads independently and never blocks the normal hero. If unavailable, the
current photo makes a short departure instead; navigation still completes.
This is layered2.5D with discrete angles, not a continuous3D turning/wheel rig.

## Distinct seat experiences

All seat objects are actual keyboard-accessible buttons, exposed as checkboxes
with aria-checked, real codes, prices, status and selected state. SVG artwork is
decorative; no seat numbers are embedded in a raster image.

- Sleeper: long navy capsule pods with pillow, mattress and light strip; real17
  positions per floor, two floors, three lanes and two aisles.
- Limousine: individual leather armchairs with headrests, upholstery seams,
  armrests and cup controls; real16 positions, one floor, two lanes.
- Cabin VIP: separate suites with bed, pillow, partitions, side console, lighting
  and door opening; real11 positions per floor, two floors, two lanes.

Rows/columns come directly from trip.seats. Holes stay holes; no duplicated,
renumbered or sellable driver seats. Horizontal coach on desktop, vertical option
for mobile; horizontal view scrolls within its region, not the whole page.
Selections persist across floors/orientations. Booked/disabled seats stay locked.
Reaching the passenger limit preserves selections and shows the existing notice.
Totals and proceed validation still use the application's actual seat records.
The notice timer is cleared on unmount and before replacement.

## Asset provenance

Built-in image generation produced the five role-paired city atlases and the
rear-view vehicle atlas; outputs were encoded to WebP with alpha preserved.
Unselected drafts and source PNGs are not included in the repository.

Prompt set: photographic golden-hour Vietnam scenery; exact2columns with
left-role/right-role compositions; complete architecture on both ends; tree/bank
transitions and transparent sky; short alpha water-reflection skirt; consistent
camera/light; no bus, UI, labels, road, rectangular sky or diorama plinth. Rows
explicitly named the landmarks in the table. Northern atlas was refined to show
three storeys on Chùa Dâu's Hòa Phong tower. Departure prompt preserved the navy/
gold fleet identities, required three separated rear views facing away/upward,
true alpha and no scenery or UI. These are illustrative generated reconstructions,
not documentary photographs or architecturally surveyed models.

## Verification

Build and lint, then `npm run test:hero` for local hero iterations or
`npm run test:journey` for integration. Optional PLAYWRIGHT_CHROMIUM_EXECUTABLE
and JOURNEY_QA_DIR set browser/output locations. Do not commit test output.

Acceptance covers actual alpha vehicle bounds, all three curved paths, equal
vehicle widths,13 cities in both roles, fixed road, preserved form values,
responsive widths, live reduced motion, asset failure, each category's seat
inventory/floors/limits/keyboard selection/mobile overflow, single departure
navigation and booking through demo payment/ticket issuance. Actual browser
screenshots/video are reviewed separately; passing tests does not establish
pixel identity or replace the user's visual approval.

Latest acceptance run: build/lint passed;96 integration checks passed. After the
last mobile-only bank framing adjustment,40 focused hero checks passed and all13
mobile city canvases were checked in both roles. Separate runtime recording
verified rear departures for all3 categories (about0.9s each), invalid-date
rejection, missing-departure-image navigation and immediate reduced-motion search.

## Hero polish — 2026-10-27

Retain the latest DANAVA logo/brand refresh and existing vehicle/landmark assets.
The search form sits completely on the cream footer of the hero; its shadow is
lighter, with three factual capability labels below it (seat selection, ticket
lookup, vehicle choices). On mobile it follows the scene without negative overlap.
Desktop has a minimum 900px composition height: at 1280×800 the page scrolls to
show the whole form rather than clipping it or covering the wheels.

City labels have translucent light backgrounds and external connector stems;
long names can wrap. The description has a light contrast surface. Vehicle
selection uses a navy moving indicator, a subtle champagne border, aria-pressed,
visible keyboard focus, 44px targets and reduced-motion-aware transitions.
Replace the unsupported hardcoded 4.9/5 rating with a travel brand message.
No new dependencies, raster assets, booking logic or payment policies.

Validation: production build and lint passed. Existing browser integration suite:
96/96 assertions passed, including all 13 cities in both directions, three vehicle
animations/sizing, mobile menus, reduced motion, seat selection and demo ticket
issuance. Inspected 1440×900, 1280×800 and 390px screenshots; final contrast/fade
adjustment checked again on a fresh desktop/mobile browser capture. The existing
~505kB main-chunk build advisory remains.

## Approved minimal mockup implementation — 2026-10-27

Implemented the selected visual direction in the existing hero: compact DANAVA GO
header without the SOLUTIONS subline; a single live route eyebrow instead of the
promotional badge; navy headline with solid orange emphasis; plain description;
one shared segmented vehicle selector; smaller quiet city labels; restrained
scenery saturation and a lighter sky behind copy. The default preview is Sleeper,
matching the selected mockup. Reinforced existing per-wheel and underbody contact
shadows without changing vehicle coordinates, size or approach/departure paths.
The header search link now targets the actual hero-search element.

Keep all production city/vehicle layers and their independent transitions. The
AI-generated concept is a direction reference, not a production background or a
pixel-identical replacement: the existing landscapes and vehicles remain intact.
No new dependencies or image assets. The unchanged horizontal form and capability
row remain on the cream footer; narrow/short screens scroll normally.

Adjusted the existing image-error tests to block the new default Sleeper asset
and expect its actual Limousine fallback, rather than assuming Cabin is default.

Validation for this revision: build/lint passed; 96/96 browser integration checks
passed on the final build. Inspected 1440×900, 1280×800 and 390px renders, including
settled responsive layout. Existing main-chunk size advisory remains (~504kB).

## Scene-first layout repair — 2026-10-27

Reviewed current main 870e868 against the supplied screenshot. The selector's
active span inherited its radius from a button with no radius, producing a square
navy/gold block. Both now have an explicit pill radius; the decorative gold border
is removed. Consolidated the hero stylesheet instead of adding another override
layer: smaller editorial typography and selector, symmetric city label heights,
quieter connector lines, no colored label top borders, a more opaque readable
search form, and plain capability text. Preserve the latest route synchronization,
vehicle animations, landscape assets, sizing and booking logic.

Build/lint passed. Existing browser journey suite passed 96/96 assertions. An
additional live browser check switched all three tabs at 1440,1280,390 and360px,
verifying rounded button/indicator, no decorative border and no horizontal page
overflow. Inspected desktop and mobile output, including Cabin VIP. No new assets
or dependencies. These changes improve the visual hierarchy; customer retention
has not been measured. Existing main-chunk size advisory remains (~505kB).

## Motion finishing pass — 2026-10-27

Separate the first 2.1s scenic approach from vehicle changes: decoded replacements
use the near lane (progress .70–1) for960ms after a260ms forward exit. A single
vehicle remains mounted at a time. The current vehicle stays while replacement
assets decode; failures retain it. Rapid changes keep latest-selection guards;
exit starts at the current pose rather than teleporting to the parked position.
A repeated commit of the same category no longer restarts its entry. Departure
callbacks from exiting vehicles are ignored. Reduced motion and resize settle
without waiting for disabled animation.

Keep compatible front-facing photography on the near approach instead of cycling
through the distant turn atlas on every switch. Existing per-wheel contact and
underbody shadows share the vehicle transform. The tires are baked into the
photographs: independent physical wheel rotation is not implemented or claimed.

Landmarks crossfade/translate10px over550ms; labels fade after100ms. Apply a mild
shared photographic grade and conservative Dong Nai/Hue adjustments directly to
landmark imagery, without tinting labels or changing architecture. Existing left
and right banks remain independent; no generated replacement assets are needed.
Ensure html/body/root use the cream background and seal the hero footer seam.
The decorative route-line idea was not added: this pass covers the five approved
priorities and preserves a quiet resting scene.

Validation: build/lint and96/96 browser integration assertions passed on the final
build. Updated switch regressions require compatible near entry, no distant bend
replay, scale>.7 and settling within1.5s for all three categories. A separate
requestAnimationFrame probe measured33ms with no vehicle above10% opacity during
a switch; screenshots reviewed exit/entry/rest, Dong Nai, reverse and mobile.
Document/body/root background measured rgb(247,244,236), with no mobile horizontal
overflow. Existing main-chunk advisory remains (~505kB). No backend changes.
