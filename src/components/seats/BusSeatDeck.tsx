import React from "react";
import "./bus-seat-deck.css";

/**
 * Top-down bus deck shared by the customer app (choose seats) and the Studio
 * seat-map editor (design seats), so operators see exactly what customers get.
 * The grid is cols x rows; columns without any seat render as a narrow aisle.
 */
export type DeckSeatState = "available" | "booked" | "selected" | "disabled" | "editing";

export interface DeckSeat {
  code: string;
  row: number;
  col: number;
  type?: "seat" | "sleeper" | "cabin";
  state: DeckSeatState;
  /** Small chip, e.g. "+50k" or "VIP". */
  badge?: string;
  /** Group colour used in the editor. */
  tone?: string;
  label?: string;
}

interface Props {
  cols: number;
  rows: number;
  seats: DeckSeat[];
  /** Columns drawn as a narrow aisle (no seat in that column on any floor). */
  aisleCols?: number[];
  onSeat?: (code: string) => void;
  /** Editor only: empty grid cells become "+" slots. */
  onEmpty?: (row: number, col: number) => void;
  showCockpit?: boolean;
  ariaLabel?: string;
  /** Editor: a wider deck so seat codes stay readable. */
  wide?: boolean;
}

export const BusSeatDeck: React.FC<Props> = ({ cols, rows, seats, aisleCols = [], onSeat, onEmpty, showCockpit = true, ariaLabel, wide }) => {
  const byPos = new Map(seats.map((s) => [`${s.row}-${s.col}`, s]));
  const aisle = new Set(aisleCols);
  const middle = (cols + 1) / 2;
  const template = Array.from({ length: cols }, (_, i) => (aisle.has(i + 1) ? "18px" : "minmax(0, 1fr)")).join(" ");
  const cells: React.ReactNode[] = [...aisle]
    .filter((c) => c <= cols)
    .map((c) => <span key={`aisle${c}`} className="bsd-aisle" style={{ gridColumn: c, gridRow: `1 / ${rows + 1}` }} />);
  for (let r = 1; r <= rows; r++) {
    for (let c = 1; c <= cols; c++) {
      const s = byPos.get(`${r}-${c}`);
      const area = { gridRow: r, gridColumn: c };
      if (s) {
        const window = c < middle ? "left" : c > middle ? "right" : "center";
        const clickable = !!onSeat && (s.state === "available" || s.state === "selected" || s.state === "editing" || !!onEmpty);
        cells.push(
          <button
            key={s.code}
            type="button"
            className={`bsd-pod ${s.type || "sleeper"} ${window} ${s.state}`}
            style={{ ...area, ...(s.tone ? ({ "--bsd-tone": s.tone } as React.CSSProperties) : {}) }}
            disabled={!!onSeat && !clickable}
            tabIndex={onSeat ? undefined : -1}
            aria-pressed={s.state === "selected" || s.state === "editing"}
            aria-label={s.label || `Chỗ ${s.code}`}
            title={s.label}
            onClick={() => onSeat?.(s.code)}
          >
            <span className="bsd-pillow" />
            <span className="bsd-code">{s.code}</span>
            <span className="bsd-led" />
            {s.badge && <span className="bsd-badge">{s.badge}</span>}
          </button>,
        );
      } else if (onEmpty && !aisle.has(c)) {
        cells.push(
          <button key={`e${r}-${c}`} type="button" className="bsd-empty" style={area} aria-label={`Thêm ghế hàng ${r} cột ${c}`} onClick={() => onEmpty(r, c)}>
            +
          </button>,
        );
      } else if (onEmpty) {
        cells.push(
          <button key={`a${r}-${c}`} type="button" className="bsd-empty aisle" style={area} aria-label={`Thêm ghế ở lối đi hàng ${r}`} onClick={() => onEmpty(r, c)}>
            +
          </button>,
        );
      }
    }
  }

  return (
    <div className="bsd-stage" role="group" aria-label={ariaLabel}>
      <div className={`bsd-shell${wide ? " wide" : ""}`}>
        <span className="bsd-mirror left" />
        <span className="bsd-mirror right" />
        {showCockpit && (
          <div className="bsd-windshield">
            <div className="bsd-cockpit">
              <span className="bsd-wheel" />
              <span className="bsd-driver">TÀI XẾ</span>
            </div>
          </div>
        )}
        <div className="bsd-floor">
          <div className="bsd-grid" style={{ gridTemplateColumns: template, gridTemplateRows: `repeat(${rows}, auto)` }}>
            {cells}
          </div>
        </div>
      </div>
    </div>
  );
};
