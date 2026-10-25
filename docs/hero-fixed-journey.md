# DANAVA GO — fixed-road journey hero

Base: `main` at `555346d` (25 October 2026). No AGENTS.md was present in the checkout. Working tree was clean before implementation.

## Seven requested changes

1. **Inventory:** retained the existing three navy alpha bus images and location ID/alias mapping. No new vehicle variants or per-route panorama proliferation.
2. **Fixed composition:** one responsive stage, canonical 1536 × 1024 canvas, one persistent road DOM node. Origin always occupies the left slot; destination the right. Road geometry and position do not depend on the selected cities or vehicle. UI remains HTML and the existing TripSearchForm stays mounted outside scene clipping.
3. **Orientation/contact:** existing right-facing buses are kept unmirrored. Individually measured front/rear tire coordinates determine each vehicle's ground anchor and tight shadows. Architecture and brand lettering are never reflected. SVG atlas views have explicit clipping to prevent adjacent sprites leaking through letterboxing.
4. **Nearward movement:** a 1.7-second, four-position journey along the near lane, scale 0.42 → 1, ending at (1000, 785). Movement begins near the city exit and uses the short portion compatible with the available camera angle. No fake steering around the entire bend, no spinning a complete bus image, no perpetual wheel/body loop. Shadows move with the same anchor.
5. **Location changes:** separate origin/destination loading and fading; changing one city does not remount the other slot or the road. Image decode completes before commit. Effect cancellation rejects stale requests. Reverse swaps the assets between roles, not their pixels. Unknown cities or failed images use neutral scenery with the selected city name, never another city's landmark.
6. **Vehicle changes:** decode before commit, old bus fades away before new bus enters; only one bus rendered at once. Rapid selection resolves to the latest requested choice. Failed load retains the previous bus and reports a dismissible status. Date/passengers remain owned by the existing form.
7. **Cleanup:** removed 13 unused preview/test/backup bitmaps (2,925,903 bytes). Checked static runtime references and the existing dynamic filename producers. Kept original vehicle/catalog/legacy/fallback assets and historical QA files referenced by documentation. Deleted assets remain recoverable in Git history.

## Assets

Reused, unmodified vehicles:
- `public/assets/images/bus_coach_sleeper_right.png`
- `public/assets/images/bus_limousine_right.png`
- `public/assets/images/bus_cabin_right.png`

Two shared derived WebP assets, both with alpha:
- `public/assets/images/scenes/journey_ground_fixed.webp`: one common terrain/road, edited from the existing Hue road and Da Nang–Hoi An composition.
- `public/assets/images/scenes/journey_landmarks_atlas.webp`: three separate sprites derived from existing Cầu Rồng, Hội An and Ngọ Môn artwork; source crops recorded in journeyStageConfig.ts.

Created with the built-in image-generation editing tool, then encoded as WebP preserving transparency. These are image assets, not a claim of native 3D mesh reconstruction. The original source images remain intact.

Final asset briefs used:

> Ground: edit the existing road at the same elevated three-quarter camera and daylight into one transparent 1536 × 1024 miniature terrain layer. Road enters left rear, curves toward the near lane and extends to right foreground. Keep asphalt, cream curbs/base, gold/white markings, railings, natural grass, shrubs and small turquoise river. Leave rear sites open for independent landmarks. No architecture, vehicle, sky rectangle, labels or UI.

> Atlas: edit/extract the reference architecture into one transparent 1536 × 1024 atlas: Cầu Rồng left, Hội An houses center, Ngọ Môn right, with isolated natural ground edges and matching miniature lighting/camera. Preserve architectural identity, remove ticket/paper, roads, backgrounds, extraction bands, vehicles and text. No new landmarks or UI. Explicit sprite crop rectangles prevent neighboring subjects appearing in other city slots.

Existing `scene_nha_trang.jpg`, `scene_hcm.jpg`, `scene_hanoi.jpg`, `scene_quy_nhon.jpg` remain the fallback artwork for those locations. Their watercolor style differs from the three primary realistic sprites; replacing those is a separate asset-quality task. Đà Lạt and unknown IDs show neutral terrain, not an incorrect landmark.

## Lifecycle/accessibility

- Main hero receives the existing loader-exit signal; bus intro cannot run behind the loader.
- Only actual requested assets are preloaded; removed the extra unused paper-diorama preload.
- Image loading has an 8-second failure bound and retryable failed cache entries.
- Reduced-motion uses a live media-query subscription, including changes while the page is open, and immediately shows the final state. Listener/effect cleanup is present.
- No animation dependency was added. Booking, seat selection, payment and ticket source components were not modified.

## Verification

`npm run build`, `npm run lint`, and `git diff --check` pass. `scripts/verify-journey.cjs` runs against the built production preview with Playwright; optional `PLAYWRIGHT_CHROMIUM_EXECUTABLE` and `JOURNEY_QA_DIR` configure the environment.

20 browser checks passed: nearward growth/contact anchor, rapid vehicle selections, rapid destinations, correct reversed slots, persistent road node and bounds, preserved date/passengers, desktop 1280 and mobile 390 overflow, mobile dropdown interaction, live reduced motion, neutral unknown-city and broken-image fallbacks, search/seat selection, passenger/demo-payment/ticket issuance, empty-route results without fallback, and no runtime errors. Also visually inspected at 1440 × 900 and recorded actual intro/vehicle/route interactions. The payment test is local sandbox only; no financial transaction or external submission.

Known limits: the bus images provide one camera angle each, so motion is restricted to the compatible near lane. No real 3D steering, photoreal coverage of every province, real-device FPS certification, or pixel-identical original-video reconstruction is claimed. Visual approval remains with the user; this technical verification does not constitute their acceptance. An existing checkout date formatter can display the preceding day in UTC browser timezone; it was observed in the sandbox smoke check and left outside this hero-only change.

## Removed files
- `public/assets/images/test_navy_bus_coach_sleeper.jpg` (68,629 bytes)
- `public/assets/images/test_navy_clean.jpg` (88,904 bytes)
- `public/assets/images/test_inpaint.jpg` (204,370 bytes)
- `public/assets/images/rembg_test_navy_bus_cabin_royal.jpg` (105,152 bytes)
- `public/assets/images/rembg_test_navy_bus_limousine_vip.jpg` (90,929 bytes)
- `public/assets/images/rembg_test_navy_bus_coach_sleeper.jpg` (80,290 bytes)
- `public/assets/images/bus_cabin_royal_on_cream.jpg` (244,534 bytes)
- `public/assets/images/bus_coach_sleeper_on_cream.jpg` (193,687 bytes)
- `public/assets/images/bus_limousine_vip_on_cream.jpg` (216,625 bytes)
- `public/assets/images/bus_coach_sleeper_on_navy.jpg` (209,826 bytes)
- `public/assets/images/bus_limousine_vip_on_navy.jpg` (227,574 bytes)
- `public/assets/images/bus_cabin_royal_on_navy.jpg` (249,875 bytes)
- `public/assets/images/bus_cabin_right_backup.png` (945,508 bytes)