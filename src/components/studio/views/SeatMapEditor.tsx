import React, { useEffect, useMemo, useRef, useState } from "react";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Eye, Hash, Plus, RotateCcw, Save, Trash2, Wand2 } from "lucide-react";
import { adminApi, type BusVehicleItem, type SeatMapCell, type SeatMapData, type SeatMapGroup } from "../../../services/adminApi";
import { BusSeatDeck, type DeckSeat } from "../../seats/BusSeatDeck";
import { aisleColumns, surchargeBadge } from "../../seats/busSeatDeckUtils";
import "./seat-map-editor.css";

/**
 * Studio seat-map editor for one live vehicle. Operators place seats on a
 * cols x rows grid per floor (empty columns become the aisle), price seats via
 * groups (surcharge on top of the trip fare), rename, move, block or delete
 * seats, and preview the exact deck customers will see in the booking app.
 */
type SeatType = SeatMapCell["type"];
const TONES = ["#f59e0b", "#10b981", "#8b5cf6", "#ef4444", "#0ea5e9", "#ec4899", "#84cc16", "#f97316", "#14b8a6", "#6366f1", "#a855f7", "#64748b"];
const TYPE_LABEL: Record<SeatType, string> = { seat: "Ghế ngồi", sleeper: "Giường nằm", cabin: "Cabin" };
const money = (v: number) => `${v.toLocaleString("vi-VN")}đ`;
const prefix = (floor: number) => (floor === 2 ? "B" : "A");
const pad = (n: number) => String(n).padStart(2, "0");

interface Template {
  id: string;
  name: string;
  build: () => SeatMapData;
}

/** Fill floors row by row over the given seat columns. */
function layout(o: { cols: number; spots: number[]; perFloor: number[]; type: SeatType; lastRowFull?: boolean; groups?: SeatMapGroup[]; groupOf?: (floor: number, row: number, rows: number) => string | null }): SeatMapData {
  const cells: SeatMapCell[] = [];
  let rows = 1;
  o.perFloor.forEach((count, i) => {
    const floor = (i + 1) as 1 | 2;
    const floorRows = Math.ceil(count / o.spots.length);
    let n = 0;
    for (let row = 1; n < count; row++) {
      const lastRow = o.lastRowFull && count - n > o.spots.length - 1 && row === floorRows;
      const spots = lastRow ? Array.from({ length: o.cols }, (_, k) => k + 1) : o.spots;
      for (const col of spots) {
        if (n >= count) break;
        n++;
        cells.push({ code: `${prefix(floor)}${pad(n)}`, floor, row, col, type: o.type, group: o.groupOf?.(floor, row, floorRows) ?? null, note: "", disabled: false });
        rows = Math.max(rows, row);
      }
    }
  });
  return { cols: o.cols, rows, groups: o.groups ?? [], cells };
}

const TEMPLATES: Template[] = [
  {
    id: "limo9",
    name: "Limousine 9 chỗ",
    build: () =>
      layout({ cols: 4, spots: [1, 3, 4], perFloor: [9], type: "seat", groups: [{ id: "dau", name: "Ghế đầu", surcharge: 20000 }, { id: "giua", name: "Ghế giữa", surcharge: 0 }, { id: "cuoi", name: "Ghế cuối", surcharge: -10000 }], groupOf: (_f, r, rows) => (r === 1 ? "dau" : r === rows ? "cuoi" : "giua") }),
  },
  { id: "seat29", name: "Ghế ngồi 29 chỗ", build: () => layout({ cols: 5, spots: [1, 2, 4, 5], perFloor: [29], type: "seat", lastRowFull: true }) },
  ...[34, 40].map((n) => ({
    id: `sleeper${n}`,
    name: `Giường nằm ${n} chỗ`,
    build: () => layout({ cols: 5, spots: [1, 3, 5], perFloor: [n / 2, n / 2], type: "sleeper" as SeatType, groups: [{ id: "duoi", name: "Tầng dưới", surcharge: 30000 }, { id: "tren", name: "Tầng trên", surcharge: 0 }], groupOf: (f: number) => (f === 1 ? "duoi" : "tren") }),
  })),
  ...[22, 24].map((n) => ({
    id: `cabin${n}`,
    name: `Cabin ${n} phòng`,
    build: () => layout({ cols: 3, spots: [1, 3], perFloor: [Math.ceil(n / 2), Math.floor(n / 2)], type: "cabin" as SeatType, groups: [{ id: "duoi", name: "Tầng dưới", surcharge: 50000 }, { id: "tren", name: "Tầng trên", surcharge: 0 }], groupOf: (f: number) => (f === 1 ? "duoi" : "tren") }),
  })),
];

const defaultType = (category: string): SeatType => (category === "cabin" ? "cabin" : category === "sleeper" ? "sleeper" : "seat");

interface Props {
  vehicles: BusVehicleItem[];
  vehicleId?: string;
  onSaved: () => void;
}

export const SeatMapEditor: React.FC<Props> = ({ vehicles, vehicleId, onSaved }) => {
  const [currentId, setCurrentId] = useState(vehicleId || vehicles[0]?.id || "");
  const vehicle = vehicles.find((v) => v.id === currentId);
  const [map, setMap] = useState<SeatMapData | null>(null);
  const [dirty, setDirty] = useState(false);
  const [floor, setFloor] = useState<1 | 2>(1);
  const [hasUpper, setHasUpper] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [preview, setPreview] = useState(false);
  const [fare, setFare] = useState(400000);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    if (vehicleId) setCurrentId(vehicleId);
  }, [vehicleId]);

  // Studio refreshes its lists in the background; only reload the saved map when
  // another vehicle is opened, or when the server copy changed and nothing is unsaved.
  const serverKey = JSON.stringify(vehicle?.seat_map ?? null);
  const loadedRef = useRef({ id: "", key: "" });
  const dirtyRef = useRef(false);
  useEffect(() => {
    dirtyRef.current = dirty;
  }, [dirty]);
  useEffect(() => {
    const prev = loadedRef.current;
    if (prev.id === currentId && (prev.key === serverKey || dirtyRef.current)) return;
    const sameVehicle = prev.id === currentId;
    loadedRef.current = { id: currentId, key: serverKey };
    const m = vehicle?.seat_map;
    const loaded: SeatMapData = m
      ? { cols: m.cols, rows: m.rows, groups: m.groups ?? [], cells: m.cells.map((c) => ({ ...c, group: c.group ?? null, note: c.note ?? "", disabled: !!c.disabled })) }
      : { cols: 3, rows: 6, groups: [], cells: [] };
    setMap(loaded);
    setHasUpper(loaded.cells.some((c) => c.floor === 2) || (vehicle?.floor_count ?? 1) > 1);
    if (!sameVehicle) {
      setSelected([]);
      setFloor(1);
      setNotice(null);
    }
    setDirty(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentId, serverKey]);

  const tone = useMemo(() => new Map((map?.groups ?? []).map((g, i) => [g.id, TONES[i % TONES.length]])), [map?.groups]);
  if (!vehicle || !map) return <div className="sme-empty">Chưa có xe nào. Thêm xe ở tab "Danh sách đội xe" trước.</div>;

  const cells = map.cells;
  const sel = cells.filter((c) => selected.includes(c.code));
  const one = sel.length === 1 ? sel[0] : null;
  const groupOf = (c: SeatMapCell) => map.groups.find((g) => g.id === c.group);
  const surcharge = (c: SeatMapCell) => groupOf(c)?.surcharge ?? c.surcharge ?? 0;
  const sellable = cells.filter((c) => !c.disabled).length;

  const update = (next: Partial<SeatMapData>) => {
    setMap({ ...map, ...next });
    setDirty(true);
    setNotice(null);
  };
  const patchCells = (fn: (c: SeatMapCell) => SeatMapCell, only = selected) => update({ cells: cells.map((c) => (only.includes(c.code) ? fn(c) : c)) });
  const fail = (text: string) => setNotice({ ok: false, text });

  const nextCode = (f: number) => {
    const p = prefix(f);
    const used = new Set(cells.map((c) => c.code));
    let n = cells.filter((c) => c.code.startsWith(p)).length + 1;
    while (used.has(`${p}${pad(n)}`)) n++;
    return `${p}${pad(n)}`;
  };

  const addSeat = (row: number, col: number) => {
    if (cells.length >= 60) return fail("Tối đa 60 chỗ cho một xe.");
    const code = nextCode(floor);
    const neighbour = cells.find((c) => c.floor === floor && c.row === row) ?? cells.find((c) => c.floor === floor);
    update({ cells: [...cells, { code, floor, row, col, type: neighbour?.type ?? defaultType(vehicle.category), group: neighbour?.group ?? null, note: "", disabled: false }] });
    setSelected([code]);
  };

  const toggle = (code: string) => setSelected((s) => (s.includes(code) ? s.filter((x) => x !== code) : [...s, code]));

  const move = (dr: number, dc: number) => {
    if (!one) return;
    const row = one.row + dr;
    const col = one.col + dc;
    if (row < 1 || col < 1 || col > map.cols) return;
    const other = cells.find((c) => c.floor === one.floor && c.row === row && c.col === col);
    update({
      rows: Math.max(map.rows, row),
      cells: cells.map((c) => (c.code === one.code ? { ...c, row, col } : other && c.code === other.code ? { ...c, row: one.row, col: one.col } : c)),
    });
  };

  const rename = (code: string) => {
    const clean = code.toUpperCase().replace(/[^A-Z0-9-]/g, "").slice(0, 8);
    if (!one || !clean) return;
    if (cells.some((c) => c.code === clean && c.code !== one.code)) return fail(`Mã ${clean} đã có trên xe.`);
    update({ cells: cells.map((c) => (c.code === one.code ? { ...c, code: clean } : c)) });
    setSelected([clean]);
  };

  const remove = () => {
    if (!sel.length || !window.confirm(`Xóa ${sel.length} chỗ: ${selected.join(", ")}?`)) return;
    update({ cells: cells.filter((c) => !selected.includes(c.code)) });
    setSelected([]);
  };

  const renumber = () => {
    if (!window.confirm("Đánh số lại toàn bộ theo thứ tự tầng → hàng → cột (A01, A02… tầng dưới, B01… tầng trên)?")) return;
    const sorted = [...cells].sort((a, b) => a.floor - b.floor || a.row - b.row || a.col - b.col);
    const count = { 1: 0, 2: 0 } as Record<number, number>;
    update({ cells: sorted.map((c) => ({ ...c, code: `${prefix(c.floor)}${pad(++count[c.floor])}` })) });
    setSelected([]);
  };

  const applyTemplate = (t: Template) => {
    if (cells.length && !window.confirm(`Thay sơ đồ hiện tại bằng mẫu "${t.name}"?`)) return;
    const m = t.build();
    update(m);
    setHasUpper(m.cells.some((c) => c.floor === 2));
    setFloor(1);
    setSelected([]);
  };

  const resize = (key: "cols" | "rows", value: number) => {
    const v = Math.max(1, Math.min(key === "cols" ? 6 : 20, value || 1));
    if (cells.some((c) => c[key === "cols" ? "col" : "row"] > v)) return fail(`Còn ghế ở ${key === "cols" ? "cột" : "hàng"} sẽ bị bỏ. Di chuyển hoặc xóa các ghế đó trước.`);
    update({ [key]: v });
  };

  const setUpper = (on: boolean) => {
    if (!on && cells.some((c) => c.floor === 2)) {
      if (!window.confirm("Bỏ tầng trên sẽ xóa toàn bộ chỗ ở tầng trên. Tiếp tục?")) return;
      update({ cells: cells.filter((c) => c.floor !== 2) });
    }
    setHasUpper(on);
    setFloor(on ? floor : 1);
  };

  const addGroup = () => {
    if (map.groups.length >= 12) return fail("Tối đa 12 nhóm giá.");
    let n = map.groups.length + 1;
    while (map.groups.some((g) => g.id === `g${n}`)) n++;
    update({ groups: [...map.groups, { id: `g${n}`, name: `Nhóm ${n}`, surcharge: 0 }] });
  };
  const patchGroup = (id: string, p: Partial<SeatMapGroup>) => update({ groups: map.groups.map((g) => (g.id === id ? { ...g, ...p } : g)) });
  const dropGroup = (id: string) => update({ groups: map.groups.filter((g) => g.id !== id), cells: cells.map((c) => (c.group === id ? { ...c, group: null } : c)) });

  const save = async () => {
    if (!sellable) return fail("Sơ đồ cần ít nhất một chỗ bán được.");
    if (map.groups.some((g) => !g.name.trim())) return fail("Nhóm giá cần có tên.");
    setBusy(true);
    try {
      const res = await adminApi.updateVehicle(vehicle.id, { seat_map: { ...map, groups: map.groups.map((g) => ({ ...g, name: g.name.trim() })) } });
      setDirty(false);
      setNotice({ ok: true, text: `${res.message}. Xe ${vehicle.plate_number} có ${cells.length} chỗ (${sellable} chỗ bán).` });
      onSaved();
    } catch (e) {
      fail((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const switchVehicle = (id: string) => {
    if (dirty && !window.confirm("Sơ đồ chưa lưu sẽ bị bỏ. Đổi xe?")) return;
    setCurrentId(id);
  };

  const onFloor = cells.filter((c) => c.floor === floor);
  const deckSeats: DeckSeat[] = onFloor.map((c) => {
    const extra = surcharge(c);
    const g = groupOf(c);
    return {
      code: c.code,
      row: c.row,
      col: c.col,
      type: c.type,
      state: preview ? (c.disabled ? "disabled" : "available") : selected.includes(c.code) ? "editing" : c.disabled ? "disabled" : "available",
      badge: surchargeBadge(extra),
      tone: preview ? undefined : g ? tone.get(g.id) : undefined,
      label: `${c.code}${g ? ` · ${g.name}` : ""} · ${money(Math.max(0, fare + extra))}${c.disabled ? " · không bán" : ""}`,
    };
  });

  return (
    <div className="sme">
      <div className="sme-bar">
        <label className="sme-field grow">
          <span>Xe</span>
          <select value={currentId} onChange={(e) => switchVehicle(e.target.value)}>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name} · {v.plate_number} · {v.capacity} chỗ{vehicles.some((x) => x.partner?.id !== v.partner?.id) && v.partner ? ` · ${v.partner.name}` : ""}
              </option>
            ))}
          </select>
        </label>
        <div className="sme-bar-actions">
          <button type="button" className={`ds-secondary sme-btn ${preview ? "on" : ""}`} onClick={() => setPreview((p) => !p)} aria-pressed={preview}>
            <Eye size={15} /> {preview ? "Đang xem như khách" : "Xem như khách"}
          </button>
          <button type="button" className="ds-primary sme-btn" onClick={save} disabled={busy || !dirty}>
            <Save size={15} /> {busy ? "Đang lưu…" : dirty ? "Lưu sơ đồ" : "Đã lưu"}
          </button>
        </div>
      </div>

      {notice && <div className={`sme-notice ${notice.ok ? "ok" : "err"}`} role={notice.ok ? "status" : "alert"}>{notice.text}</div>}

      <div className="sme-layout">
        {/* Left: grid shape and quick templates */}
        <aside className="sme-panel">
          <h4>Khung sơ đồ</h4>
          <div className="sme-row">
            <label className="sme-field">
              <span>Số cột</span>
              <input type="number" min={1} max={6} value={map.cols} onChange={(e) => resize("cols", Number(e.target.value))} />
            </label>
            <label className="sme-field">
              <span>Số hàng</span>
              <input type="number" min={1} max={20} value={map.rows} onChange={(e) => resize("rows", Number(e.target.value))} />
            </label>
          </div>
          <label className="sme-check">
            <input type="checkbox" checked={hasUpper} onChange={(e) => setUpper(e.target.checked)} /> Xe 2 tầng
          </label>
          <p className="sme-hint">Cột không có chỗ nào sẽ thành lối đi. Bấm ô "+" để thêm chỗ, bấm vào chỗ để chọn và sửa.</p>

          <h4>Mẫu nhanh</h4>
          <div className="sme-templates">
            {TEMPLATES.map((t) => (
              <button key={t.id} type="button" onClick={() => applyTemplate(t)}>
                <Wand2 size={13} /> {t.name}
              </button>
            ))}
          </div>

          <h4>Công cụ</h4>
          <div className="sme-tools">
            <button type="button" onClick={() => setSelected(onFloor.map((c) => c.code))}>Chọn cả tầng</button>
            <button type="button" onClick={() => setSelected([])} disabled={!selected.length}>Bỏ chọn</button>
            <button type="button" onClick={renumber} disabled={!cells.length}>
              <Hash size={13} /> Đánh số lại
            </button>
            <button type="button" onClick={() => window.confirm("Xóa toàn bộ chỗ trên sơ đồ?") && (update({ cells: [] }), setSelected([]))} disabled={!cells.length}>
              <RotateCcw size={13} /> Làm lại từ đầu
            </button>
          </div>
        </aside>

        {/* Center: the deck */}
        <section className="sme-canvas">
          {hasUpper && (
            <div className="sme-floors" role="tablist">
              {([1, 2] as const).map((f) => (
                <button key={f} type="button" role="tab" aria-selected={floor === f} className={floor === f ? "on" : ""} onClick={() => setFloor(f)}>
                  {f === 1 ? "Tầng dưới" : "Tầng trên"} · {cells.filter((c) => c.floor === f).length}
                </button>
              ))}
            </div>
          )}
          <BusSeatDeck
            cols={map.cols}
            rows={Math.max(map.rows, ...onFloor.map((c) => c.row))}
            seats={deckSeats}
            aisleCols={aisleColumns(map.cols, cells)}
            wide
            onSeat={preview ? undefined : toggle}
            onEmpty={preview ? undefined : addSeat}
            ariaLabel="Sơ đồ chỗ của xe"
          />
          <div className="sme-summary">
            <span>
              Tổng <b>{cells.length}</b> chỗ
            </span>
            <span>
              Bán được <b>{sellable}</b>
            </span>
            {map.groups.map((g) => (
              <span key={g.id}>
                <i style={{ background: tone.get(g.id) }} /> {g.name}: <b>{cells.filter((c) => c.group === g.id).length}</b>
              </span>
            ))}
          </div>
        </section>

        {/* Right: price groups + selected seats */}
        <aside className="sme-panel">
          <h4>Nhóm giá</h4>
          <label className="sme-field">
            <span>Giá vé chuyến để tham khảo</span>
            <input type="number" min={0} step={10000} value={fare} onChange={(e) => setFare(Math.max(0, Number(e.target.value) || 0))} />
          </label>
          <div className="sme-groups">
            {map.groups.map((g) => (
              <div key={g.id} className="sme-group">
                <i style={{ background: tone.get(g.id) }} />
                <input aria-label="Tên nhóm" value={g.name} maxLength={30} onChange={(e) => patchGroup(g.id, { name: e.target.value })} />
                <input aria-label="Phụ thu" type="number" step={10000} value={g.surcharge} onChange={(e) => patchGroup(g.id, { surcharge: Math.round(Number(e.target.value) || 0) })} />
                <button type="button" aria-label={`Xóa nhóm ${g.name}`} onClick={() => dropGroup(g.id)}>
                  <Trash2 size={14} />
                </button>
                <small>
                  Khách trả {money(Math.max(0, fare + g.surcharge))}
                  {selected.length > 0 && (
                    <button type="button" className="link" onClick={() => patchCells((c) => ({ ...c, group: g.id }))}>
                      Gán {selected.length} chỗ đang chọn
                    </button>
                  )}
                </small>
              </div>
            ))}
            <button type="button" className="sme-add" onClick={addGroup}>
              <Plus size={14} /> Thêm nhóm giá
            </button>
            <p className="sme-hint">Phụ thu cộng vào giá vé của từng chuyến (có thể âm để giảm giá), ví dụ tầng dưới +50.000đ, ghế cuối −20.000đ.</p>
          </div>

          <h4>{sel.length ? `Đang chọn ${sel.length} chỗ` : "Chỗ đang chọn"}</h4>
          {!sel.length ? (
            <p className="sme-hint">Bấm vào một hoặc nhiều chỗ trên sơ đồ để sửa.</p>
          ) : (
            <div className="sme-selected">
              {one && (
                <label className="sme-field">
                  <span>Mã chỗ</span>
                  <input key={one.code} defaultValue={one.code} maxLength={8} onBlur={(e) => rename(e.target.value)} onKeyDown={(e) => e.key === "Enter" && rename((e.target as HTMLInputElement).value)} />
                </label>
              )}
              <label className="sme-field">
                <span>Loại chỗ</span>
                <select value={sel.every((c) => c.type === sel[0].type) ? sel[0].type : ""} onChange={(e) => patchCells((c) => ({ ...c, type: e.target.value as SeatType }))}>
                  {!sel.every((c) => c.type === sel[0].type) && <option value="">— Nhiều loại —</option>}
                  {Object.entries(TYPE_LABEL).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </label>
              <label className="sme-field">
                <span>Nhóm giá</span>
                <select value={sel.every((c) => c.group === sel[0].group) ? sel[0].group ?? "" : "*"} onChange={(e) => patchCells((c) => ({ ...c, group: e.target.value || null }))}>
                  {!sel.every((c) => c.group === sel[0].group) && <option value="*">— Nhiều nhóm —</option>}
                  <option value="">Không nhóm (giá chuyến)</option>
                  {map.groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name} ({surchargeBadge(g.surcharge) ?? "+0"})
                    </option>
                  ))}
                </select>
              </label>
              {sel.every((c) => !c.group) && (
                <label className="sme-field">
                  <span>Phụ thu riêng (đ)</span>
                  <input type="number" step={10000} value={sel.every((c) => (c.surcharge ?? 0) === (sel[0].surcharge ?? 0)) ? sel[0].surcharge ?? 0 : ""} onChange={(e) => patchCells((c) => ({ ...c, surcharge: Math.round(Number(e.target.value) || 0) }))} />
                </label>
              )}
              <label className="sme-field">
                <span>Ghi chú hiện cho khách</span>
                <input maxLength={40} placeholder="VD: Gần cửa sổ, Có rèm riêng" value={sel.every((c) => c.note === sel[0].note) ? sel[0].note : ""} onChange={(e) => patchCells((c) => ({ ...c, note: e.target.value }))} />
              </label>
              <label className="sme-check">
                <input type="checkbox" checked={sel.every((c) => c.disabled)} onChange={(e) => patchCells((c) => ({ ...c, disabled: e.target.checked }))} /> Không bán (ghế phụ xe, hỏng…)
              </label>
              {one && (
                <div className="sme-move" aria-label="Di chuyển chỗ">
                  <span>Di chuyển</span>
                  <button type="button" aria-label="Lên" onClick={() => move(-1, 0)}><ArrowUp size={14} /></button>
                  <button type="button" aria-label="Xuống" onClick={() => move(1, 0)}><ArrowDown size={14} /></button>
                  <button type="button" aria-label="Trái" onClick={() => move(0, -1)}><ArrowLeft size={14} /></button>
                  <button type="button" aria-label="Phải" onClick={() => move(0, 1)}><ArrowRight size={14} /></button>
                </div>
              )}
              <button type="button" className="sme-danger" onClick={remove}>
                <Trash2 size={14} /> Xóa {sel.length} chỗ
              </button>
            </div>
          )}
          <p className="sme-hint">
            Chuyến đã lên lịch giữ nguyên danh sách mã chỗ đã bán. Nếu chỉ di chuyển, đổi nhóm giá hoặc khóa chỗ (không đổi mã, không thêm bớt chỗ), thay đổi áp dụng ngay cho cả các chuyến đó.
          </p>
        </aside>
      </div>
    </div>
  );
};
