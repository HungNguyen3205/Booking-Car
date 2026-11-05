import { Children, isValidElement, useEffect, useRef, useState } from 'react';
import type { ReactNode, ReactElement } from 'react';
import { statuses } from './studioConfig';
import { ArrowDownAZ, ArrowUpAZ, ChevronDown, Filter, X } from 'lucide-react';
type Node = ReactElement<{
    children?: ReactNode;
    value?: unknown;
}>;
const nodes = (n: ReactNode) => Children.toArray(n).filter(isValidElement) as Node[];
function text(n: ReactNode): string {
    return Children.toArray(n).map(v => isValidElement(v) ? text((v as Node).props.children) || (statuses[String((v as Node).props.value)] || String((v as Node).props.value ?? '')) : typeof v === 'string' || typeof v === 'number' ? String(v) : '').join(' ').trim();
}
export default function StudioTable({ children }: {
    children: ReactNode;
}) {
    const [filters, setFilters] = useState<Record<number, string[]>>({});
    const [sort, setSort] = useState<{
        col: number;
        direction: number;
    } | null>(null);
    const [open, setOpen] = useState<number | null>(null), [query, setQuery] = useState('');
    const root = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const close = (e: MouseEvent) => { if (!root.current?.contains(e.target as globalThis.Node))
            setOpen(null); };
        const key = (e: KeyboardEvent) => { if (e.key === 'Escape')
            setOpen(null); };
        document.addEventListener('mousedown', close);
        document.addEventListener('keydown', key);
        return () => { document.removeEventListener('mousedown', close); document.removeEventListener('keydown', key); };
    }, []);
    const sections = nodes(children), head = sections.find(n => n.type === 'thead'), body = sections.find(n => n.type === 'tbody');
    if (!head || !body)
        return <table>{children}</table>;
    const headers = nodes(nodes(head.props.children)[0]?.props.children), rows = nodes(body.props.children);
    const value = (row: Node, col: number) => text(nodes(row.props.children)[col]?.props.children);
    let visible = rows.filter(row => Object.entries(filters).every(([col, values]) => values.includes(value(row, +col))));
    if (sort)
        visible = [...visible].sort((a, b) => value(a, sort.col).localeCompare(value(b, sort.col), 'vi', { numeric: true }) * sort.direction);
    const choices = open === null ? [] : [...new Set(rows.map(r => value(r, open)))].sort((a, b) => a.localeCompare(b, 'vi', { numeric: true }));
    const remove = (col: number) => setFilters(old => { const next = { ...old }; delete next[col]; return next; });
    return <div className="ds-sheet" ref={root}>
    {(Object.keys(filters).length > 0 || sort) && <div className="ds-sheet-chips"><Filter size={15}/>{Object.keys(filters).map(c => <button key={c} onClick={() => remove(+c)}>{text(headers[+c]?.props.children)} <X size={13}/></button>)}<button onClick={() => { setFilters({}); setSort(null); }}>Xóa lọc & sắp xếp</button></div>}
    <table><thead><tr>{headers.map((h, c) => <th key={c} aria-sort={sort?.col === c ? sort.direction === 1 ? "ascending" : "descending" : "none"}>{c === headers.length - 1 && /thao tác/i.test(text(h.props.children)) ? h.props.children : <button className="ds-column-button" aria-expanded={open === c} onClick={() => { setOpen(open === c ? null : c); setQuery(''); }}>{h.props.children}{filters[c] ? <Filter size={14}/> : <ChevronDown size={14}/>}</button>}</th>)}</tr></thead><tbody>{visible}{!visible.length && rows.length > 0 && <tr><td colSpan={headers.length}>Không có dòng phù hợp. Hãy thay đổi hoặc xóa bộ lọc.</td></tr>}</tbody></table>
    <div className="ds-sheet-footer">Hiển thị {visible.length} / {rows.length} dòng <span>Lọc tại tiêu đề cột</span></div>
    {open !== null && <section className="ds-column-popover" role="dialog" aria-label={'Lọc cột ' + text(headers[open]?.props.children)}>
      <header><strong>{text(headers[open]?.props.children)}</strong><button aria-label="Đóng bộ lọc" onClick={() => setOpen(null)}><X size={18}/></button></header>
      <div className="ds-column-sort"><button onClick={() => { setSort({ col: open, direction: 1 }); setOpen(null); }}><ArrowDownAZ size={16}/> Tăng dần</button><button onClick={() => { setSort({ col: open, direction: -1 }); setOpen(null); }}><ArrowUpAZ size={16}/> Giảm dần</button></div>
      <input autoFocus aria-label="Tìm giá trị trong cột" placeholder="Tìm giá trị…" value={query} onChange={e => setQuery(e.target.value)}/>
      <div className="ds-column-actions"><button onClick={() => remove(open)}>Chọn tất cả</button><button onClick={() => setFilters(old => ({ ...old, [open]: [] }))}>Bỏ chọn</button></div>
      <div className="ds-column-values">{choices.filter(v => v.toLocaleLowerCase('vi').includes(query.toLocaleLowerCase('vi'))).map(v => <label key={v}><input type="checkbox" checked={!filters[open] || filters[open].includes(v)} onChange={e => setFilters(old => ({ ...old, [open]: e.target.checked ? [...new Set([...(old[open] ?? choices), v])] : (old[open] ?? choices).filter(x => x !== v) }))}/><span>{v || '(Trống)'}</span></label>)}</div>
      <button className="ds-primary" onClick={() => setOpen(null)}>Xong</button>
    </section>}
  </div>;
}
