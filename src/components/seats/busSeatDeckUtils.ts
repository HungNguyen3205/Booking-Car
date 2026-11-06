/** Columns with no seat on any floor of the map: drawn as the aisle. */
export function aisleColumns(cols: number, seats: { col: number }[]): number[] {
  const used = new Set(seats.map((s) => s.col));
  return Array.from({ length: cols }, (_, i) => i + 1).filter((c) => !used.has(c));
}

/** "+50k" / "-20k" chip for a seat surcharge. */
export function surchargeBadge(v: number | undefined): string | undefined {
  if (!v) return undefined;
  const k = Math.abs(v) >= 1000 ? `${Math.round(Math.abs(v) / 1000)}k` : `${Math.abs(v)}đ`;
  return `${v > 0 ? "+" : "−"}${k}`;
}
