import { useEffect } from "react";

/**
 * Phones: Studio tables become one card per row (studio-mobile.css). Each cell
 * needs its column name, so this copies the header text of every table under
 * `root` into `data-label` on its body cells, and keeps doing it as pages and
 * rows change. Tables opt out with `data-table-scroll` (or class `dm-att`,
 * the attendance calendar) and keep horizontal scrolling instead.
 */
export function useTableCardLabels(root: HTMLElement | null) {
  useEffect(() => {
    if (!root) return;
    let frame = 0;

    const label = () => {
      frame = 0;
      root.querySelectorAll("table").forEach((table) => {
        if (table.closest("[data-table-scroll]") || table.classList.contains("dm-att")) return;
        const head = table.tHead?.rows[table.tHead.rows.length - 1];
        if (!head) return;
        const names: string[] = [];
        for (const th of Array.from(head.cells)) {
          for (let i = 0; i < (th.colSpan || 1); i++) names.push((th.textContent || "").trim());
        }
        table.classList.add("ds-card-table");
        for (const body of Array.from(table.tBodies)) {
          for (const row of Array.from(body.rows)) {
            let col = 0;
            for (const cell of Array.from(row.cells)) {
              const span = cell.colSpan || 1;
              if (names.length > 1 && span >= names.length) {
                // "Không có dữ liệu" / loading rows span the whole table.
                if (cell.dataset.full !== "1") cell.dataset.full = "1";
              } else {
                const name = names[col] ?? "";
                if (cell.dataset.label !== name) cell.dataset.label = name;
              }
              col += span;
            }
          }
        }
      });
    };

    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(label);
    };
    schedule();
    // childList only: our own attribute writes do not re-trigger the observer.
    const observer = new MutationObserver(schedule);
    observer.observe(root, { childList: true, subtree: true, characterData: true });
    return () => {
      observer.disconnect();
      if (frame) cancelAnimationFrame(frame);
    };
  }, [root]);
}
