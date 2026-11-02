import type { SearchParams } from '../types';

export type SearchRouteStep = 'home' | 'search' | 'lookup';
const navigationKey = 'danavaSearch';
const queryKeys = ['from', 'to', 'date', 'passengers', 'step'] as const;
const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/** Import legacy query links once; otherwise restore this history entry on reload. */
export function readSearchNavigation(): URLSearchParams {
  const result = new URLSearchParams();
  if (typeof window === 'undefined' || window.location.pathname !== '/') return result;
  const query = new URLSearchParams(window.location.search);
  if (queryKeys.some(key => query.has(key))) return query;
  try {
    const state: unknown = window.history.state;
    const saved = isRecord(state) ? state[navigationKey] : undefined;
    if (!isRecord(saved) || saved.version !== 1 || !isRecord(saved.params)) return result;
    for (const key of ['from', 'to', 'date'] as const) {
      if (typeof saved.params[key] === 'string') result.set(key, saved.params[key]);
    }
    const passengers = saved.params.passengers;
    if (typeof passengers === 'number' && Number.isInteger(passengers)) {
      result.set('passengers', String(passengers));
    }
    if (saved.step === 'home' || saved.step === 'search' || saved.step === 'lookup') {
      result.set('step', saved.step);
    }
  } catch { /* Restricted history must not prevent the booking UI from loading. */ }
  return result;
}

/** Persist only non-sensitive search state, leaving path, anchors and other query keys intact. */
export function syncSearchNavigation(params: SearchParams, step: SearchRouteStep): void {
  if (typeof window === 'undefined' || window.location.pathname !== '/') return;
  try {
    const url = new URL(window.location.href);
    queryKeys.forEach(key => url.searchParams.delete(key));
    const previous: unknown = window.history.state;
    window.history.replaceState({
      ...(isRecord(previous) ? previous : {}),
      [navigationKey]: { version: 1, params: { ...params }, step },
    }, '', `${url.pathname}${url.search}${url.hash}`);
  } catch { /* In-memory React state still works if History API is blocked. */ }
}
