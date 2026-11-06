import { useSyncExternalStore } from 'react';

const query = '(prefers-reduced-motion: reduce)';
function subscribe(onChange: () => void) {
  const media = window.matchMedia(query);
  media.addEventListener('change', onChange);
  return () => media.removeEventListener('change', onChange);
}
// Unlike a mount-only preference snapshot, this also stops an active journey
// when the system preference changes while the page is open.
export function useJourneyReducedMotion() {
  return useSyncExternalStore(subscribe, () => window.matchMedia(query).matches, () => true);
}

// Phone composition: narrow screens and tall portrait screens (e.g. iPad 1024x1366).
// Short landscape phones (<=540px tall) use the desktop composition behind an overlay.
// Keep in sync with the stacked and landscape @media queries in danava-go-hero.css.
const mobileQuery = '(max-width: 1023px) and (orientation: portrait), (max-width: 1023px) and (min-height: 541px), (max-aspect-ratio: 4/5)';
function subscribeMobile(onChange: () => void) {
  const media = window.matchMedia(mobileQuery);
  media.addEventListener('change', onChange);
  return () => media.removeEventListener('change', onChange);
}
function subscribeResize(onChange: () => void) {
  window.addEventListener('resize', onChange);
  return () => window.removeEventListener('resize', onChange);
}
// Layout width without a scrollbar; drives edge-anchored landmarks on the stacked layout.
export function useViewportWidth() {
  return useSyncExternalStore(subscribeResize, () => document.documentElement.clientWidth, () => 390);
}
export function useJourneyMobile() {
  return useSyncExternalStore(subscribeMobile, () => window.matchMedia(mobileQuery).matches, () => false);
}
