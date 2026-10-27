# Search transition and booking interface polish

2026-10-27. Existing homepage and booking flow preserved.

`searchTransition.ts` snapshots only the currently rendered vehicle SVG into a
fixed viewport overlay. Freeze its pose and hide the original during the handoff.
Zoom680ms toward the front of the vehicle, fade to navy at510–690ms, navigate once
under cover, then reveal after the existing page exit. The overlay survives hero
unmount after navigation and cleans up animations, event listeners and fallback.
Live reduced motion bypasses/finishes it immediately. Missing vehicle or unsupported
WAAPI navigates directly; the1800ms watchdog prevents a stuck overlay. Invalid
search never starts this effect. This is an image transition, not a3D camera move.

Trip cards: two-line names/locations, wider vehicle description and sold-out trips
sorted last. Simplify customer-facing demo copy and count label. Remove decorative
barcode from seat-selection stub and replace FE/backend copy with booking status.
Passenger email is optional in this local-ticket demo (invalid nonempty values
still fail validation). Ticket labels distinguish Vietnam-local booking date from
departure date; remove excessive vertical centering.

Existing integration suite:97 assertions passed, including single navigation and
curtain cleanup. Subsequent snapshot alignment/duplicate-vehicle fixes verified
in focused browser runs and visually inspected at desktop/mobile. No new assets,
dependencies, server seat holds or email delivery capability.

Final focused checks: all three vehicle overlays at1440px and390px hide the source,
navigate and remove the curtain without horizontal overflow; toggling reduced
motion mid-transition navigates and cleans up (7 cases passed). Final build/lint
passed. Main bundle ~500kB; no new dependency or image requests for the effect.
