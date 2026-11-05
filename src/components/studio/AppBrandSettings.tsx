import { useState } from "react";
import { ExternalLink, Globe, ShieldCheck, Smartphone } from "lucide-react";
import { api } from "../../services/platformApi";
import type { Item } from "./studioConfig";
export default function AppBrandSettings({
  data,
  tenantId,
  platform,
  onSaved,
}: {
  data: Record<string, any>;
  tenantId: string;
  platform: boolean;
  onSaved: () => void;
}) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [hostingReady, setHostingReady] = useState(false);
  const operator = data.operator || {},
    domains: Item[] = data.domains || [];
  const action = async (path: string, body: unknown, method = "POST") => {
    setBusy(true);
    setError("");
    try {
      await api(path, { method, body, tenantId });
      onSaved();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <section className="ds-panel ds-settings">
      <h2>
        <Smartphone size={20} /> App thương hiệu & Tên miền
      </h2>
      <p className="ds-muted">
        Một nguồn lịch chạy và tồn ghế. App riêng chỉ bán chuyến của nhà xe này.
      </p>
      <form
        key={JSON.stringify(domains) + operator.appEnabled}
        onSubmit={(e) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget);
          action(
            "/manage/app",
            {
              appEnabled: f.get("appEnabled") === "on",
              appSlug: f.get("appSlug"),
              customDomain: f.get("customDomain"),
              logo: f.get("logo"),
              hero: f.get("hero"),
            },
            "PATCH",
          );
        }}
      >
        <div className="ds-form-grid">
          <label className="wide">
            <span>Bật app nhà xe</span>
            <input
              name="appEnabled"
              type="checkbox"
              defaultChecked={!!operator.appEnabled}
            />
          </label>
          <label>
            <span>Subdomain · .danavago.com</span>
            <input
              name="appSlug"
              required
              minLength={3}
              maxLength={63}
              pattern="[a-z0-9]+(-[a-z0-9]+)*"
              defaultValue={
                domains
                  .find((d) => d.type === "subdomain")
                  ?.hostname.split(".")[0] ||
                String(operator.slug || "").replaceAll("-", "")
              }
            />
          </label>
          <label>
            <span>Tên miền chính chủ (tùy chọn, không nhập https://)</span>
            <input
              name="customDomain"
              placeholder="app.nhaxe.vn"
              defaultValue={
                domains.find((d) => d.type === "custom")?.hostname || ""
              }
            />
          </label>
          <label>
            <span>Logo app (URL HTTPS / ảnh tải lên)</span>
            <input name="logo" defaultValue={operator.logo || ""} />
          </label>
          <label>
            <span>Ảnh bìa (URL HTTPS / ảnh tải lên)</span>
            <input name="hero" defaultValue={operator.hero || ""} />
          </label>
        </div>
        <button className="ds-primary" disabled={busy}>
          Lưu cấu hình app
        </button>
      </form>
      {error && (
        <p className="ds-error" role="alert">
          {error}
        </p>
      )}
      <div className="ds-report-line">
        <span>Trang nhà xe</span>
        <a href={"/nha-xe/" + operator.slug} target="_blank" rel="noreferrer">
          {operator.profileUrl}
          <ExternalLink size={14} />
        </a>
      </div>
      <div className="ds-report-line">
        <span>Xem thử app trong dự án</span>
        <a href={"/app/" + operator.slug} target="_blank" rel="noreferrer">
          /app/{operator.slug}
          <ExternalLink size={14} />
        </a>
      </div>
      {domains.map((d) => (
        <article className="ds-domain" key={d.id}>
          <h3>
            <Globe size={17} />
            {d.hostname}
            <span className={"ds-badge " + d.status}>
              {
                (
                  {
                    pending: "Chờ xác minh",
                    verified: "Đã xác minh · Chờ hosting",
                    active: "Đã bật trong hệ thống",
                  } as Record<string, string>
                )[d.status]
              }
            </span>
          </h3>
          {d.type === "subdomain" ? (
            <p className="ds-muted">
              {data.wildcardReady
                ? "Wildcard đã được cấu hình trên hệ thống."
                : "Chưa bật wildcard hosting. Quản trị cần trỏ *.danavago.com và cấp SSL wildcard trước khi dùng link này."}
            </p>
          ) : (
            <>
              <p className="ds-muted">
                Tạo bản ghi TXT để xác minh quyền sở hữu; CNAME trỏ về{" "}
                <strong>{d.target}</strong>. Nếu dùng tên miền gốc, cấu hình
                A/ALIAS theo hosting.
              </p>
              <dl>
                <dt>TXT host</dt>
                <dd>
                  <code>{d.verificationRecord?.[0]}</code>
                </dd>
                <dt>TXT value</dt>
                <dd>
                  <code>{d.verificationRecord?.[1]}</code>
                </dd>
              </dl>
              <button
                disabled={busy}
                onClick={() =>
                  action("/manage/domains/" + d.id + "/verify", {})
                }
              >
                <ShieldCheck size={16} />
                Kiểm tra TXT
              </button>
              {platform && d.status === "verified" && (
                <>
                  <label>
                    <span>
                      Tôi đã cấu hình DNS và SSL cho tên miền này trên hosting
                    </span>
                    <input
                      type="checkbox"
                      checked={hostingReady}
                      onChange={(e) => setHostingReady(e.target.checked)}
                    />
                  </label>
                  <button
                    disabled={!hostingReady || busy}
                    className="ds-primary"
                    onClick={() =>
                      action("/platform/domains/" + d.id + "/activate", {
                        hostingReady: true,
                      })
                    }
                  >
                    Kích hoạt tên miền
                  </button>
                </>
              )}
            </>
          )}
        </article>
      ))}
      <p className="ds-muted">
        Lưu cấu hình không tự thay DNS hay tạo chứng chỉ SSL. Tên miền riêng chỉ
        được định tuyến tới nhà xe sau khi xác minh và kích hoạt.
      </p>
    </section>
  );
}
