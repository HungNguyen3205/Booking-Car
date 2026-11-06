import { useEffect, useState } from "react";
import { Eye, EyeOff, Megaphone, MessageSquareReply, Plus, RefreshCw, Star, Users } from "lucide-react";
import { adminApi } from "../../../../services/adminApi";
import { studioModules, type Audience, type Campaign, type Review } from "../../../../services/studioModulesApi";
import { Field, Kpi, Modal, Notice, PartnerSelect, dmy, hm, useLoad, usePartners } from "./kit";

const CHANNEL: Record<Campaign["channel"], string> = { sms: "SMS", email: "Email", zalo: "Zalo OA" };
const CAMPAIGN_STATUS: Record<Campaign["status"], [string, string]> = {
  draft: ["Bản nháp", "dm-pill-gray"], scheduled: ["Đã lên lịch", "dm-pill-blue"], cancelled: ["Đã huỷ", "dm-pill-red"],
};
const stars = (n: number) => (
  <span className="dm-stars" aria-label={`${n} sao`}>{"★★★★★".split("").map((s, i) => <span key={i} className={i < n ? "" : "off"}>{s}</span>)}</span>
);

/** Chiến dịch marketing theo lịch sử đặt vé + quản lý đánh giá chuyến đi. */
export default function MarketingView() {
  const partners = usePartners();
  const [tab, setTab] = useState<"campaigns" | "reviews">("campaigns");
  const [partnerId, setPartnerId] = useState("");
  const [ratingFilter, setRatingFilter] = useState("");
  const [creating, setCreating] = useState(false);
  const [replying, setReplying] = useState<Review | null>(null);
  const [notice, setNotice] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  const campaigns = useLoad(() => studioModules.campaigns(), []);
  const reviews = useLoad(() => studioModules.reviews({ partner_id: partnerId || undefined, rating: ratingFilter || undefined }).then((r) => r.data), [partnerId, ratingFilter]);
  const list = (campaigns.data?.data ?? []).filter((c) => !partnerId || c.partner_id === partnerId);

  const setStatus = async (c: Campaign, status: Campaign["status"]) => {
    try { await studioModules.updateCampaign(c.id, { status }); setNotice({ kind: "ok", text: "Đã cập nhật chiến dịch" }); void campaigns.reload(); }
    catch (e) { setNotice({ kind: "error", text: (e as Error).message }); }
  };
  const toggleReview = async (r: Review) => {
    try { await studioModules.updateReview(r.id, { status: r.status === "visible" ? "hidden" : "visible" }); void reviews.reload(); }
    catch (e) { setNotice({ kind: "error", text: (e as Error).message }); }
  };

  const dist = reviews.data?.distribution ?? {};
  const totalReviews = Object.values(dist).reduce((a, b) => a + Number(b), 0);

  return (
    <div className="ds-page" style={{ gap: 18 }}>
      <div className="dm-head">
        <div>
          <h2>Marketing & đánh giá</h2>
          <p>Nhắm đúng khách từ lịch sử đi xe, kèm mã ưu đãi. Theo dõi và trả lời đánh giá sau chuyến.</p>
        </div>
        <div className="dm-seg" role="tablist">
          <button type="button" role="tab" aria-selected={tab === "campaigns"} className={tab === "campaigns" ? "on" : ""} onClick={() => setTab("campaigns")}>Chiến dịch</button>
          <button type="button" role="tab" aria-selected={tab === "reviews"} className={tab === "reviews" ? "on" : ""} onClick={() => setTab("reviews")}>Đánh giá</button>
        </div>
      </div>

      <div className="ds-panel ds-filter-bar">
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center", width: "100%" }}>
          <PartnerSelect value={partnerId} onChange={setPartnerId} partners={partners} />
          {tab === "reviews" && (
            <select className="ds-filter-select" value={ratingFilter} onChange={(e) => setRatingFilter(e.target.value)} aria-label="Số sao">
              <option value="">Tất cả số sao</option>
              {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} sao</option>)}
            </select>
          )}
          <button type="button" className="dm-btn" onClick={() => (tab === "campaigns" ? campaigns.reload() : reviews.reload())}><RefreshCw size={15} /> Làm mới</button>
          {tab === "campaigns" && (
            <button type="button" className="ds-primary" style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 6, padding: "9px 16px" }} onClick={() => setCreating(true)}><Plus size={16} /> Tạo chiến dịch</button>
          )}
        </div>
      </div>

      {notice && <Notice kind={notice.kind} onClose={() => setNotice(null)}>{notice.text}</Notice>}

      {tab === "campaigns" ? (
        <>
          {campaigns.data && !campaigns.data.gateway_connected && (
            <Notice kind="warn">Chưa kết nối cổng gửi SMS / Email / Zalo. Chiến dịch được lưu và lên lịch với đúng tệp khách, nhưng hệ thống chưa gửi tin thật.</Notice>
          )}
          <div className="dm-kpis">
            <Kpi icon={<Megaphone size={18} />} label="Chiến dịch" value={list.length} />
            <Kpi icon={<Megaphone size={18} />} tone="orange" label="Đã lên lịch" value={list.filter((c) => c.status === "scheduled").length} />
            <Kpi icon={<Users size={18} />} tone="green" label="Khách tiếp cận" value={list.filter((c) => c.status !== "cancelled").reduce((s, c) => s + c.audience_count, 0)} hint="Tổng tệp khách các chiến dịch" />
          </div>
          <div className="dm-card">
            <div className="dm-table-wrap"><table className="dm-table">
              <thead><tr><th>Chiến dịch</th><th>Kênh</th><th>Tệp khách</th><th>Ưu đãi</th><th>Lịch gửi</th><th>Trạng thái</th><th /></tr></thead>
              <tbody>
                {campaigns.loading && !campaigns.data && <tr><td colSpan={7} className="dm-empty">Đang tải…</td></tr>}
                {campaigns.data && !list.length && <tr><td colSpan={7} className="dm-empty">Chưa có chiến dịch. Bấm "Tạo chiến dịch" để nhắm khách quay lại.</td></tr>}
                {list.map((c) => (
                  <tr key={c.id}>
                    <td style={{ maxWidth: 300 }}><strong>{c.name}</strong><br /><small className="muted">{c.message.slice(0, 90)}{c.message.length > 90 ? "…" : ""}</small></td>
                    <td>{CHANNEL[c.channel]}</td>
                    <td><strong>{c.audience_count}</strong> khách<br /><small className="muted">{describeAudience(c.audience, partners)}</small></td>
                    <td>{c.promotion_code ? <span className="dm-pill dm-pill-orange">{c.promotion_code}</span> : <span className="muted">—</span>}</td>
                    <td>{c.scheduled_at ? `${hm(c.scheduled_at)} ${dmy(c.scheduled_at)}` : <span className="muted">Chưa đặt</span>}</td>
                    <td><span className={`dm-pill ${CAMPAIGN_STATUS[c.status][1]}`}>{CAMPAIGN_STATUS[c.status][0]}</span></td>
                    <td className="num">{c.status !== "cancelled" && <button type="button" className="dm-btn dm-btn-sm dm-btn-danger" onClick={() => setStatus(c, "cancelled")}>Huỷ</button>}</td>
                  </tr>
                ))}
              </tbody>
            </table></div>
          </div>
        </>
      ) : (
        <>
          {reviews.error && <Notice kind="error">{reviews.error}</Notice>}
          <div className="dm-grid-2">
            <div className="dm-card">
              <h3><Star size={17} color="#f59e0b" /> Điểm đánh giá</h3>
              <div style={{ display: "flex", gap: 22, alignItems: "center", flexWrap: "wrap" }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 40, fontWeight: 800, color: "#102744", lineHeight: 1 }}>{reviews.data?.average ?? "—"}</div>
                  {reviews.data?.average && stars(Math.round(reviews.data.average))}
                  <div style={{ fontSize: 12.5, color: "#64748b", marginTop: 4 }}>{totalReviews} đánh giá · {reviews.data?.unreplied ?? 0} chưa trả lời</div>
                </div>
                <div className="dm-dist" style={{ flex: 1, minWidth: 200 }}>
                  {[5, 4, 3, 2, 1].map((n) => (
                    <div key={n}><span>{n} ★</span><div className="dm-bar"><i style={{ width: totalReviews ? `${(Number(dist[n] || 0) / totalReviews) * 100}%` : 0 }} /></div><span>{dist[n] || 0}</span></div>
                  ))}
                </div>
              </div>
            </div>
            <div className="dm-card">
              <h3>Khách đánh giá thế nào?</h3>
              <p style={{ margin: 0, fontSize: 13.5, color: "#475569", lineHeight: 1.6 }}>
                Khách đánh giá sau khi đã được soát vé lên xe, bằng mã vé và số điện thoại (API <code>POST /api/public/reviews</code>).
                Đánh giá bị ẩn sẽ không tính vào điểm so sánh nhà xe.
              </p>
            </div>
          </div>
          <div className="dm-card" style={{ display: "grid", gap: 10 }}>
            {reviews.loading && !reviews.data && <p className="dm-empty">Đang tải đánh giá…</p>}
            {reviews.data && !reviews.data.items.length && <p className="dm-empty">Chưa có đánh giá nào.</p>}
            {reviews.data?.items.map((r) => (
              <div key={r.id} className={`dm-review${r.status === "hidden" ? " hidden" : ""}`}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                  <div>{stars(r.rating)} <strong style={{ marginLeft: 6, color: "#102744" }}>{r.customer_name || "Khách"}</strong>
                    <small className="muted" style={{ marginLeft: 8 }}>{r.booking_code} · {r.route_name} · {dmy(r.depart_time)}</small></div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button type="button" className="dm-btn dm-btn-sm" onClick={() => setReplying(r)}><MessageSquareReply size={14} /> {r.reply ? "Sửa trả lời" : "Trả lời"}</button>
                    <button type="button" className="dm-btn dm-btn-sm" onClick={() => toggleReview(r)}>{r.status === "visible" ? <><EyeOff size={14} /> Ẩn</> : <><Eye size={14} /> Hiện</>}</button>
                  </div>
                </div>
                {r.comment && <p style={{ margin: 0, color: "#334155", fontSize: 14 }}>{r.comment}</p>}
                {r.reply && <div className="dm-review-reply"><b>Nhà xe trả lời:</b> {r.reply}</div>}
              </div>
            ))}
          </div>
        </>
      )}

      {creating && <CampaignForm partners={partners} defaultPartner={partnerId} onClose={() => setCreating(false)} onSaved={(t) => { setCreating(false); setNotice({ kind: "ok", text: t }); void campaigns.reload(); }} />}
      {replying && <ReplyForm review={replying} onClose={() => setReplying(null)} onSaved={() => { setReplying(null); setNotice({ kind: "ok", text: "Đã lưu trả lời" }); void reviews.reload(); }} />}
    </div>
  );
}

function describeAudience(a: Audience, partners: { id: string; name: string }[]) {
  const parts = [];
  if (a.partner_id) parts.push(partners.find((p) => p.id === a.partner_id)?.name || "1 nhà xe");
  if (a.route_id) parts.push("1 tuyến");
  if (a.min_trips) parts.push(`≥ ${a.min_trips} chuyến`);
  if (a.last_days) parts.push(`đi trong ${a.last_days} ngày`);
  return parts.join(" · ") || "Mọi khách đã đi";
}

function CampaignForm({ partners, defaultPartner, onClose, onSaved }: { partners: { id: string; name: string }[]; defaultPartner: string; onClose: () => void; onSaved: (t: string) => void }) {
  const [v, setV] = useState({ name: "", channel: "sms" as Campaign["channel"], message: "", promotion_code: "", scheduled_at: "", partner_id: defaultPartner, route_id: "", min_trips: "", last_days: "" });
  const [routes, setRoutes] = useState<{ id: string; name: string; partner_id: string }[]>([]);
  const [promos, setPromos] = useState<{ code: string; title: string }[]>([]);
  const [preview, setPreview] = useState<{ count: number; sample: { name: string; phone: string; trips: number }[] } | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    adminApi.getRoutes().then((r) => setRoutes(r.data as unknown as typeof routes)).catch(() => {});
    adminApi.getPromotions().then((r) => setPromos(r.data.promotions as unknown as typeof promos)).catch(() => {});
  }, []);
  const audience = (): Audience => ({
    ...(v.partner_id ? { partner_id: v.partner_id } : {}), ...(v.route_id ? { route_id: v.route_id } : {}),
    ...(v.min_trips ? { min_trips: Number(v.min_trips) } : {}), ...(v.last_days ? { last_days: Number(v.last_days) } : {}),
  });
  const runPreview = async () => {
    try { setPreview((await studioModules.previewAudience(v.channel, audience())).data); } catch (e) { setError((e as Error).message); }
  };
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true); setError("");
    try {
      const r = await studioModules.createCampaign({ name: v.name, channel: v.channel, message: v.message, audience: audience(),
        ...(v.promotion_code ? { promotion_code: v.promotion_code } : {}), ...(v.scheduled_at ? { scheduled_at: v.scheduled_at } : {}) });
      onSaved(r.message || "Đã lưu chiến dịch");
    } catch (err) { setError((err as Error).message); }
    finally { setBusy(false); }
  };
  const smsLen = v.message.length;
  return (
    <Modal title="Tạo chiến dịch" onClose={onClose} width={640}>
      <form onSubmit={submit} style={{ display: "grid", gap: 14 }}>
        <div className="dm-form-row">
          <Field label="Tên chiến dịch"><input required maxLength={150} value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} placeholder="VD: Mời khách quay lại tuyến Huế" /></Field>
          <Field label="Kênh gửi"><select value={v.channel} onChange={(e) => { setV({ ...v, channel: e.target.value as Campaign["channel"] }); setPreview(null); }}>{Object.entries(CHANNEL).map(([k, n]) => <option key={k} value={k}>{n}</option>)}</select></Field>
        </div>
        <div className="dm-form-row">
          <Field label="Nhà xe"><select value={v.partner_id} onChange={(e) => { setV({ ...v, partner_id: e.target.value, route_id: "" }); setPreview(null); }}><option value="">Tất cả nhà xe</option>{partners.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></Field>
          <Field label="Tuyến khách đã đi"><select value={v.route_id} onChange={(e) => { setV({ ...v, route_id: e.target.value }); setPreview(null); }}><option value="">Mọi tuyến</option>{routes.filter((r) => !v.partner_id || r.partner_id === v.partner_id).map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}</select></Field>
        </div>
        <div className="dm-form-row">
          <Field label="Đã đi tối thiểu (chuyến)"><input type="number" min={1} value={v.min_trips} onChange={(e) => { setV({ ...v, min_trips: e.target.value }); setPreview(null); }} placeholder="Bỏ trống = mọi khách" /></Field>
          <Field label="Đặt vé trong (ngày gần đây)"><input type="number" min={1} value={v.last_days} onChange={(e) => { setV({ ...v, last_days: e.target.value }); setPreview(null); }} placeholder="VD: 90" /></Field>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <button type="button" className="dm-btn" onClick={runPreview}><Users size={15} /> Xem trước tệp khách</button>
          {preview && <span style={{ fontSize: 13.5, color: "#102744" }}><b>{preview.count}</b> khách phù hợp{preview.sample.length ? `: ${preview.sample.map((s) => `${s.name} (${s.phone})`).join(", ")}${preview.count > preview.sample.length ? "…" : ""}` : ""}</span>}
        </div>
        <Field label="Nội dung tin" hint={v.channel === "sms" ? `${smsLen}/160 ký tự${smsLen > 160 ? " — sẽ tách thành nhiều tin" : ""}` : undefined}>
          <textarea required rows={3} maxLength={1000} value={v.message} onChange={(e) => setV({ ...v, message: e.target.value })} placeholder="VD: DANAVA GO tặng bạn mã HUE10 giảm 10% chuyến Đà Nẵng - Huế tuần này." />
        </Field>
        <div className="dm-form-row">
          <Field label="Mã ưu đãi kèm theo"><select value={v.promotion_code} onChange={(e) => setV({ ...v, promotion_code: e.target.value })}><option value="">Không kèm mã</option>{promos.map((p) => <option key={p.code} value={p.code}>{p.code} · {p.title}</option>)}</select></Field>
          <Field label="Lịch gửi" hint="Bỏ trống = lưu bản nháp"><input type="datetime-local" value={v.scheduled_at} onChange={(e) => setV({ ...v, scheduled_at: e.target.value })} /></Field>
        </div>
        {error && <Notice kind="error">{error}</Notice>}
        <div className="dm-actions">
          <button type="button" className="dm-btn" onClick={onClose}>Huỷ</button>
          <button className="ds-primary" disabled={busy} style={{ padding: "9px 18px" }}>{busy ? "Đang lưu…" : v.scheduled_at ? "Lên lịch chiến dịch" : "Lưu bản nháp"}</button>
        </div>
      </form>
    </Modal>
  );
}

function ReplyForm({ review, onClose, onSaved }: { review: Review; onClose: () => void; onSaved: () => void }) {
  const [reply, setReply] = useState(review.reply || "");
  const [error, setError] = useState("");
  const save = async () => {
    try { await studioModules.updateReview(review.id, { reply: reply.trim() || null }); onSaved(); } catch (e) { setError((e as Error).message); }
  };
  return (
    <Modal title={`Trả lời ${review.customer_name || "khách"}`} onClose={onClose} width={520}>
      <div>{stars(review.rating)} <span style={{ color: "#334155" }}>{review.comment || "(Không có nhận xét)"}</span></div>
      <Field label="Nội dung trả lời"><textarea rows={4} maxLength={1000} value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Cảm ơn anh/chị đã đồng hành cùng nhà xe…" /></Field>
      {error && <Notice kind="error">{error}</Notice>}
      <div className="dm-actions">
        <button type="button" className="dm-btn" onClick={onClose}>Huỷ</button>
        <button type="button" className="ds-primary" style={{ padding: "9px 18px" }} onClick={save}>Lưu trả lời</button>
      </div>
    </Modal>
  );
}
