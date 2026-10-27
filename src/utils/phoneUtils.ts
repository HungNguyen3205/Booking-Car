// One representation for passenger entry, stored bookings and ticket lookup.
export function normalizeVietnamPhone(value: string): string {
  const compact = value.trim().replace(/[\s.()-]/g, '');
  return compact.startsWith('+84') ? `0${compact.slice(3)}` : compact;
}
