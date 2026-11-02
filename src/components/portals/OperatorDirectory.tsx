import { useEffect, useState } from "react";
import { api } from "../../services/platformApi";
import { localPortal, profileLink } from "./portalTypes";
import { ArrowUpRight, Bus } from "lucide-react";
import "./portals.css";
export default function OperatorDirectory() {
  const [items, setItems] = useState<
    {
      id: string;
      name: string;
      slug: string;
      profileUrl?: string;
      logo?: string;
    }[]
  >([]);
  useEffect(() => {
    const c = new AbortController();
    api<{ items: typeof items }>("/public/operators", { signal: c.signal })
      .then((r) => setItems(r.items))
      .catch(() => {});
    return () => c.abort();
  }, []);
  if (!items.length) return null;
  return (
    <section className="gp-directory">
      <p>ĐỒNG HÀNH TRÊN MỖI HÀNH TRÌNH</p>
      <h2>Khám phá các nhà xe</h2>
      <a
        className="gp-directory-app"
        href={localPortal() ? "/app" : "https://app.danavago.com"}
      >
        Mở app DANAVA GO <ArrowUpRight size={17} />
      </a>
      <div>
        {items.map((o) => (
          <a href={profileLink(o)} key={o.id}>
            {o.logo ? <img src={o.logo} alt="" /> : <Bus />}
            <strong>{o.name}</strong>
            <ArrowUpRight size={18} />
          </a>
        ))}
      </div>
    </section>
  );
}
