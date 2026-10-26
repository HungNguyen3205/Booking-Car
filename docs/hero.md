# Hero full-screen

## Composition

Desktop 1440×900 / 1280×800: sky/header, centered two-line sans headline, vehicle tabs, large cabin coach centered foreground, origin landmark left, destination right, horizontal search form below wheels. Cream #F7F4EC, navy #102744, teal #0097A7. Mobile uses text/tabs, separate scene, compact form; it does not scale down the entire desktop UI.

All scene layers share a 1600×1000 coordinate system. The road and natural landscape stay mounted. Two independent SVG atlas crops and HTML labels change by canonical city ID. There is no baked city in the shared backdrop. Reversing swaps the image slots; nothing is mirrored.

## City images

| Selection | Landmark | Source |
|---|---|---|
| Đà Nẵng | Cầu Rồng | journey_city_banks.webp |
| Hội An | Phố cổ / Sông Hoài | journey_city_banks.webp |
| Huế | Ngọ Môn | journey_city_banks.webp |
| Nha Trang | Tháp Trầm Hương | journey_city_banks.webp |
| TP. Hồ Chí Minh | Landmark 81 | journey_hcm_bank.webp |
| Hà Nội | Tháp Rùa | journey_city_banks.webp |
| Quy Nhơn | Tháp Đôi / biển | journey_city_banks.webp |
| Đà Lạt | Ga Đà Lạt | journey_city_banks.webp |

Unknown city or failed image: its own name with neutral terrain, never another city's landmark. A city picture is a travel illustration, not a geographically accurate map or documentary photograph. The Quy Nhơn panorama groups separate city attractions artistically; this is not a claim about their exact geographical adjacency.

## Assets

Existing right-facing alpha buses, neutral landscape/road, catalog and featured-route images retained. Isolated monument/island atlases were removed. Natural waterfront panoramas now extend into side edges, with architecture embedded in full city context. The shared background is still city-neutral.

New production WebP assets created with built-in image generation and encoded without reshaping image content:

- `public/assets/images/scenes/journey_city_banks.webp`: reference is the user-approved image 2, used as lighting/camera guide. Prompt: eight full-scale continuous panoramic city banks, 2 columns × 4 rows, true-alpha sky following rooftops/trees; warm photographic golden-hour lighting; no miniature, island bases, labels, UI, vehicles or pedestals. DaNang DragonBridge plus urban skyline, HoiAn continuous riverside houses, Hue citadel/moat, NhaTrang tower ON seaside promenade, HCM skyline, Hanoi lake, QuyNhon coastal city/towers inland, DaLat station/pine gardens. Actual output 1774×887 has unequal row bounds; explicit crops were measured instead of assuming even cells. The HCM cell is not used because its crown was clipped in the atlas.
- `public/assets/images/scenes/journey_hcm_bank.webp`: independent panoramic HCM bank to preserve the complete Landmark81 crown/antenna. Prompt: full-scale BinhThanh city context, tower at 48% of width with full spire and transparent sky margin, warm light, broad riverside park and SaiGon river foreground; no islands, UI or vehicles.

The normalized camera uses 1200-unit-wide city banks with individual left/right anchors and vertical offsets. SVG masks blend the urban horizon and water into the common scene while the actual shorelines/streets now continue beyond tile edges. This is not simply fading the old miniature icons. No architecture is mirrored and a city change does not reuse another named city's scenery. All mask/clip IDs include slot, city and fallback state.

Crop coordinates and source dimensions are explicit in journeyStageConfig. No screenshot is used as production UI. HTML labels, tabs and form remain real interactive elements.

## Motion and state

Bus is decoded before switching. Stale async requests are ignored. A single visible vehicle fades out before next approach. Short near-lane approach grows .42→1 over 1.7s, then stops; no attempt to rotate a single-view bus image around a full curve. Shadows follow wheel anchors. No looping intro; resizing after arrival keeps final state. Reduced motion is live and immediately uses final position.

City change decodes then crossfades 500ms; clip IDs are unique during overlapping transitions. Failed assets are retryable with an 8s bound. Search form is not remounted, keeps date/passengers and validation. Loader exits when critical assets resolve or safety bound; vehicle waits for actual image decode and intro-ready signal.

## Verification

Run build/lint then test:journey. Browser script checks approach, final anchor, full viewport, font, fixed road, rapid selections, all eight images in both slots, reverse, date/passenger persistence, resize, 390px/mobile dropdown, reduced motion, unknown/broken assets, existing booking through ticket issuance, empty trips. Screenshots are generated under ignored test-results/journey by default, not shipped in the runtime.

## Visual limits

Matches the approved full-screen composition with existing bus cutouts; this is not pixel-identical to the generated concept. Landmark silhouettes and coach detail differ because they are independently reusable images. No actual 3D models or free camera, no physically independent wheel rig. User visual approval is separate from automated functional checks.
