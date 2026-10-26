# Hero full-screen

## Composition

Desktop 1440×900 / 1280×800: sky/header, centered two-line sans headline, vehicle tabs, large cabin coach centered foreground, origin landmark left, destination right, horizontal search form below wheels. Cream #F7F4EC, navy #102744, teal #0097A7. Mobile uses text/tabs, separate scene, compact form; it does not scale down the entire desktop UI.

All scene layers share a 1600×1000 coordinate system. The road and natural landscape stay mounted. Two independent SVG atlas crops and HTML labels change by canonical city ID. There is no baked city in the shared backdrop. Reversing swaps the image slots; nothing is mirrored.

## City images

| Selection | Landmark | Source |
|---|---|---|
| Đà Nẵng | Cầu Rồng | journey_landmarks_atlas.webp |
| Hội An | Phố cổ / Sông Hoài | journey_landmarks_atlas.webp |
| Huế | Ngọ Môn | journey_landmarks_atlas.webp |
| Nha Trang | Tháp Trầm Hương | journey_locations_atlas.webp |
| TP. Hồ Chí Minh | Landmark 81 | journey_locations_atlas.webp |
| Hà Nội | Tháp Rùa | journey_locations_atlas.webp |
| Quy Nhơn | Tháp Đôi / biển | journey_locations_atlas.webp |
| Đà Lạt | Ga Đà Lạt | journey_locations_atlas.webp |

Unknown city or failed image: its own name with neutral terrain, never another city's landmark. A city picture is a travel illustration, not a geographically accurate map or documentary photograph. The Quy Nhơn cluster groups separate city attractions artistically.

## Assets

Existing right-facing alpha buses and primary landmark atlas reused. Original catalog/featured-route images retained. Two new WebP assets added using built-in image generation, then encoded to WebP without altering composition:

- `public/assets/images/scenes/journey_landscape.webp`: approved concept used as edit target. Prompt: remove all UI/text/buttons/bus and all architecture; preserve camera, warm lighting, cream sky, mountains, natural riverbanks, curved foreground road and foliage. Complete background behind vehicle. No city, paper pedestal or ticket.
- `public/assets/images/scenes/journey_locations_atlas.webp`: existing primary atlas is the lighting/style reference; existing city illustrations identify architecture. Prompt: five isolated true-alpha clusters, equal columns: Nha Trang lotus tower, HCM Landmark81, Hanoi TurtleTower, QuyNhon twin Cham towers/coast, DaLat station with three pointed roofs/pines. Same elevated camera and warm realistic light; no UI, text, vehicles or rectangular backgrounds.

Crop coordinates and source dimensions are explicit in journeyStageConfig. No screenshot is used as production UI. HTML labels, tabs and form remain real interactive elements.

## Motion and state

Bus is decoded before switching. Stale async requests are ignored. A single visible vehicle fades out before next approach. Short near-lane approach grows .42→1 over 1.7s, then stops; no attempt to rotate a single-view bus image around a full curve. Shadows follow wheel anchors. No looping intro; resizing after arrival keeps final state. Reduced motion is live and immediately uses final position.

City change decodes then crossfades 500ms; clip IDs are unique during overlapping transitions. Failed assets are retryable with an 8s bound. Search form is not remounted, keeps date/passengers and validation. Loader exits when critical assets resolve or safety bound; vehicle waits for actual image decode and intro-ready signal.

## Verification

Run build/lint then test:journey. Browser script checks approach, final anchor, full viewport, font, fixed road, rapid selections, all eight images in both slots, reverse, date/passenger persistence, resize, 390px/mobile dropdown, reduced motion, unknown/broken assets, existing booking through ticket issuance, empty trips. Screenshots are generated under ignored test-results/journey by default, not shipped in the runtime.

## Visual limits

Matches the approved full-screen composition with existing bus cutouts; this is not pixel-identical to the generated concept. Landmark silhouettes and coach detail differ because they are independently reusable images. No actual 3D models or free camera, no physically independent wheel rig. User visual approval is separate from automated functional checks.
