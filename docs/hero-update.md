# Hero: pop-up journey

Base revision: b2d4a6f (main).

## Implementation
- Replaced the flat scenery/card composition with a transparent, AI-generated pop-up travel diorama (`journey-pop-up.webp`, 1536 × 1024, approximately 504 KiB).
- Paper introduction, paper flap, landscape reveal, foreground reveal, vehicle/shadow, route SVG and labels render separately on a normalized artboard.
- The generated artwork contains the paper/landscape/road in a single composition; CSS masks separate the upper landscape and foreground for reveal. This is a 2.5D illustration, not an editable 3D model or independent meshes of each landmark. Paper folding is a CSS simulation. It does not reproduce every frame of the reference video exactly.
- Đà Nẵng/Huế labels stay attached to their landmarks when the direction is reversed. Other routes use a neutral illustration without borrowing the wrong landmarks.
- Kept the existing header and booking pages. Added a scoped editorial hero layout and responsive search dock.
- Fixed search form resynchronization so changing route/vehicle does not reset locally edited date/passenger values.
- Intro starts after the loader, with reduced-motion handling and a one-time entrance for a home mount. A return to the already-ready homepage renders the scene directly.

## Verification
- `npm run build`: passed.
- `npm run lint`: passed without warnings.
- `git diff --check`: passed.
- Production preview checked in Chromium at 1440×900, 1280×800 and 390px: no horizontal overflow, broken images, page errors or local failed resource requests.
- Changed date to 15/11/2026 and passengers to 3, then changed vehicle/reversed route: both retained.
- Other route displayed the neutral illustration.
- Search → trip selection → seat screen remained functional. Full payment/issuance flow was not re-audited.
- Reduced-motion bus opacity reached the visible final state.

Deployment is outside the scope of this change.
