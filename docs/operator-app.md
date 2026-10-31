# Cửa Ông mobile web app — /app

The existing website remains at `/`. `src/main.tsx` selects the independent,
lazy-loaded operator experience only at `/app` or its child paths. The six
screens share state inside `src/components/operator-app/OperatorApp.tsx`:
Home → trips → seats → pickup/passenger → confirmation → demo ticket.
Browser Back/Forward uses history state; refresh starts on Home. Last demo ticket
is available through “Vé của tôi” in this browser. No server deployment included.
A production static server must rewrite `/app` requests to `index.html`.

## Styling and assets

`operator-app.css` scopes the cream/gold/chocolate theme under `.co-app`.
No existing hero, vehicle motion or booking component was edited. No dependency
was added. UI text, seat controls, forms and QR are real DOM/SVG, not screenshots.
The nine passenger seats are 2+2+2+3; driver separate. Selection respects party
size; booked seats disabled; the afternoon trip has two available seats.

Two new built-in ImageGen production assets, converted to WebP:
- `public/assets/operator-app/cua-ong-hero.webp`: Ha Long-inspired sunset, coast
  road, black passenger minibus on lower right, empty sky for HTML copy. Prompt:
  photoreal luxury travel, cream/gold/chocolate, 3:2, no text/UI/logos.
- `public/assets/operator-app/cua-ong-coach-engraving.webp`: transparent minibus
  cutout, chocolate/ivory/ochre woodcut engraving, front three-quarter left,
  complete wheels/mirrors, no text/backdrop. Alpha preserved.

These are new illustrations, not official operator photography or logo artwork.
The trip cards reuse the existing limousine photograph as a clearly marked
illustration. This first build follows the supplied six-screen composition and
palette; the van artwork, exact typography and seat shell are not pixel-identical.

## Demo boundaries

Schedule, inventory, amenities, price and stops are mock data for Hanoi–Cua Ong
and reverse. The selected date uses Vietnam calendar helpers and cannot be past.
Passenger count 1–5. Name/phone required, email optional. Confirmation performs
no payment, creates no server hold, and never claims a paid ticket. No artificial
countdown, fake coupon or unimplemented round-trip selector. QR encodes demo
metadata, not a bank payment or valid boarding entitlement. Save uses browser
Print/PDF; Call uses a telephone link from the supplied reference.

Demo ticket stores passenger info locally under `cuaong.demo.pass`; no data is
sent to a backend. Retain this boundary until operator APIs and real inventory,
payment confirmation, authentication and privacy controls are integrated.

## Verification

Build and lint passed. Existing logic regression suite: 26 assertions passed.
Browser checked all six screens, B1 selection/300,000đ totals, passenger submission
and generated demo ticket. Fixed insecure-HTTP `crypto.randomUUID` incompatibility
with `getRandomValues`. Preview host allowlist contains only `terminal.local`.
Browser inspected centered app column; true 390px device emulation was unavailable.
Existing build still reports the >500kB main-chunk size advisory.
