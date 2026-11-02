import { brandInk } from "./portalTypes";
import { useEffect, useState } from "react";
import { ArrowRight, Bus, MapPin, Phone, ShieldCheck } from "lucide-react";
import { api } from "../../services/platformApi";
import type { OperatorProfile } from "./portalTypes";
import { appLink } from "./portalTypes";
import "./portals.css";
export default function OperatorProfilePage() {
  const slug = decodeURIComponent(
    window.location.pathname.split("/nha-xe/")[1]?.split("/")[0] || "",
  );
  const [operator, setOperator] = useState<OperatorProfile | null>(null),
    [error, setError] = useState("");
  useEffect(() => {
    const c = new AbortController();
    api<OperatorProfile>("/public/operators/" + encodeURIComponent(slug), {
      signal: c.signal,
    })
      .then((o) => {
        setOperator(o);
        document.title = o.name + " · DANAVA GO";
      })
      .catch((e) => {
        if (!c.signal.aborted) setError(e.message);
      });
    return () => c.abort();
  }, [slug]);
  if (error)
    return (
      <main className="gp-loading">
        <h1>{error}</h1>
        <a href="/">Về sàn đặt vé</a>
      </main>
    );
  if (!operator)
    return <main className="gp-loading">Đang tải thông tin nhà xe…</main>;
  return (
    <main
      className="gp-profile"
      style={
        {
          "--gp-brand": operator.color || "#0097a7",
          "--gp-cta-ink": brandInk(operator.color || "#0097a7"),
        } as React.CSSProperties
      }
    >
      <header>
        <a href="/">
          DANAVA <b>GO</b>
        </a>
        <a href={appLink(operator)}>
          Mở app <ArrowRight size={17} />
        </a>
      </header>
      <section
        className="gp-profile-hero"
        style={
          operator.hero
            ? {
                backgroundImage: `linear-gradient(90deg,#102744ef,#10274444),url(${operator.hero})`,
              }
            : undefined
        }
      >
        <div>
          <span>NHÀ XE TRÊN DANAVA GO</span>
          {operator.logo && (
            <img className="gp-profile-logo" src={operator.logo} alt="" />
          )}
          <h1>{operator.name}</h1>
          <p>
            {operator.description ||
              "Thông tin tuyến xe và đặt vé trực tiếp cùng nhà xe."}
          </p>
          <a
            className="gp-primary"
            href={
              operator.appEnabled
                ? appLink(operator)
                : "/app?operator=" + operator.id
            }
          >
            Tìm chuyến của nhà xe <ArrowRight size={18} />
          </a>
        </div>
        <img
          src={
            operator.vehicles[0]?.image ||
            "/assets/images/bus_limousine_vip.png"
          }
          alt={operator.name}
        />
      </section>
      <div className="gp-profile-body">
        <section>
          <h2>
            <MapPin />
            Tuyến đường
          </h2>
          <div className="gp-profile-grid">
            {operator.routes.map((r) => (
              <article className="gp-card" key={r.id}>
                <h3>
                  {r.from} → {r.to}
                </h3>
                <p>
                  {Math.floor(r.durationMinutes / 60)} giờ{" "}
                  {r.durationMinutes % 60} phút
                </p>
                <a href={appLink(operator)}>
                  Xem lịch chạy <ArrowRight size={16} />
                </a>
              </article>
            ))}
          </div>
        </section>
        <section>
          <h2>
            <Bus />
            Không gian chuyến đi
          </h2>
          <div className="gp-profile-grid">
            {operator.vehicles.map((v) => (
              <article className="gp-card" key={v.id}>
                <img src={v.image} alt={v.name} />
                <h3>{v.name}</h3>
                <p>
                  {v.capacity} chỗ · {v.amenities.join(" · ")}
                </p>
              </article>
            ))}
          </div>
        </section>
        <section className="gp-card gp-profile-policy">
          <h2>
            <ShieldCheck />
            Liên hệ & Chính sách
          </h2>
          <p>{operator.policies}</p>
          <p>{operator.address}</p>
          {operator.phone && (
            <a href={"tel:" + operator.phone}>
              <Phone size={18} />
              {operator.phone}
            </a>
          )}
        </section>
      </div>
      <footer>Nền tảng đặt vé và công nghệ vận hành · DANAVA GO</footer>
    </main>
  );
}
