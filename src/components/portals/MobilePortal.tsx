import { brandInk } from "./portalTypes";
import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Bus,
  CalendarDays,
  Headphones,
  Home,
  MapPin,
  Search,
  Ticket,
  ArrowLeftRight,
} from "lucide-react";
import {
  api,
  searchMarketplace,
  holdSeats,
  releaseHold,
  reserveBooking,
} from "../../services/platformApi";
import type {
  Booking,
  PassengerInfo,
  SearchParams,
  Trip,
  Seat,
} from "../../types";
import type { OperatorProfile } from "./portalTypes";
import {
  getVietnamTodayDateStr,
  formatVietnamDate,
} from "../../utils/dateUtils";
import { SeatSelectionModal } from "../seats/SeatSelectionModal";
import { PassengerForm } from "../checkout/PassengerForm";
import { ApiReservation } from "../checkout/ApiReservation";
import { BoardingTicket } from "../tickets/BoardingTicket";
import { TicketLookupView } from "../tickets/TicketLookupView";
import "./portals.css";
type Step =
  | "home"
  | "trips"
  | "seats"
  | "passenger"
  | "confirm"
  | "ticket"
  | "lookup"
  | "support";
const money = (n: number) => n.toLocaleString("vi-VN") + "đ";
export default function MobilePortal() {
  const slug = decodeURIComponent(
    window.location.pathname.match(/^\/app\/([^/]+)/)?.[1] || "",
  );
  const [operator, setOperator] = useState<OperatorProfile | null>(null),
    [operators, setOperators] = useState<OperatorProfile[]>([]),
    [ready, setReady] = useState(false),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [step, setStep] = useState<Step>("home");
  const [params, setParams] = useState<SearchParams>({
    from: "Đà Nẵng",
    to: "Huế",
    date: getVietnamTodayDateStr(),
    passengers: 1,
  });
  const [operatorId, setOperatorId] = useState(
      () => new URLSearchParams(window.location.search).get("operator") || "",
    ),
    [trips, setTrips] = useState<Trip[]>([]),
    [trip, setTrip] = useState<Trip | null>(null),
    [seats, setSeats] = useState<string[]>([]),
    [passenger, setPassenger] = useState<PassengerInfo | null>(null),
    [hold, setHold] = useState<{ id: string; expires: number } | null>(null),
    [booking, setBooking] = useState<Booking | null>(null),
    [cities, setCities] = useState<string[]>([]);
  const inFlight = useRef(false),
    bookingKey = useRef(""),
    holdRef = useRef<string | null>(null);
  useEffect(() => {
    const c = new AbortController();
    const init = async () => {
      try {
        let o: OperatorProfile | null = null;
        if (slug)
          o = await api<OperatorProfile>(
            "/public/operators/" + encodeURIComponent(slug),
            { signal: c.signal },
          );
        else
          o = (
            await api<{ operator: OperatorProfile | null }>("/public/context", {
              signal: c.signal,
            })
          ).operator;
        if (c.signal.aborted) return;
        if (o && !o.appEnabled)
          throw Error(
            "Ứng dụng nhà xe chưa được bật. Vui lòng truy cập trang nhà xe.",
          );
        setOperator(o);
        if (o) setOperatorId(o.id);
        if (o?.routes[0])
          setParams((s) => ({
            ...s,
            from: o.routes[0].from,
            to: o.routes[0].to,
            date: o.nextDepartureDate || s.date,
          }));
        const list = await api<{ items: OperatorProfile[] }>(
          "/public/operators",
          { signal: c.signal },
        );
        setOperators(list.items);
        const cs = await api<{ items: string[] }>("/public/cities", {
          signal: c.signal,
        });
        setCities(cs.items);
        document.title = (o?.name || "DANAVA GO") + " · Đặt vé";
      } catch (e) {
        if (!c.signal.aborted) setError((e as Error).message);
      } finally {
        if (!c.signal.aborted) setReady(true);
      }
    };
    init();
    return () => c.abort();
  }, [slug]);
  useEffect(() => {
    holdRef.current = hold?.id || null;
  }, [hold]);
  useEffect(
    () => () => {
      if (holdRef.current) releaseHold(holdRef.current).catch(() => {});
    },
    [],
  );
  const navigate = (s: Step) => {
    if (hold && !["passenger", "confirm"].includes(s)) {
      releaseHold(hold.id).catch(() => {});
      setHold(null);
    }
    setError("");
    setStep(s);
    window.scrollTo({ top: 0, behavior: "instant" });
  };
  const run = async (fn: () => Promise<void>) => {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setError("");
    try {
      await fn();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  };
  const search = () =>
    run(async () => {
      const r = await searchMarketplace(
        params,
        undefined,
        operator?.id || operatorId || undefined,
      );
      setTrips(r.items);
      navigate("trips");
    });
  const toggle = (s: Seat) => {
    if (s.status !== "available") return;
    setSeats((old) =>
      old.includes(s.code)
        ? old.filter((x) => x !== s.code)
        : old.length < params.passengers
          ? [...old, s.code]
          : old,
    );
  };
  const proceed = () =>
    run(async () => {
      if (!trip || seats.length !== params.passengers)
        throw Error("Vui lòng chọn đủ số ghế.");
      const key = Array.from(crypto.getRandomValues(new Uint8Array(24)), (b) =>
        b.toString(16).padStart(2, "0"),
      ).join("");
      const h = await holdSeats(trip.id, seats);
      bookingKey.current = key;
      setHold(h);
      navigate("passenger");
    });
  const confirm = () =>
    run(async () => {
      if (!trip || !passenger || !hold)
        throw Error("Lượt giữ ghế không hợp lệ.");
      const b = await reserveBooking(
        trip,
        seats,
        passenger,
        hold.id,
        bookingKey.current,
      );
      holdRef.current = null;
      setHold(null);
      setBooking(b);
      setStep("ticket");
    });
  const brand = operator?.name || "DANAVA GO",
    theme = operator?.color || "#0097a7",
    image =
      operator?.vehicles[0]?.image || "/assets/images/bus_limousine_vip.png";
  if (!ready) return <div className="gp-loading">Đang mở ứng dụng…</div>;
  return (
    <div
      className={
        "gp-root " +
        (["seats", "passenger", "confirm", "ticket"].includes(step)
          ? "gp-booking"
          : "")
      }
      style={
        {
          "--gp-brand": theme,
          "--gp-cta-ink": brandInk(theme),
        } as React.CSSProperties
      }
    >
      <header className="gp-top">
        <button
          onClick={() => navigate("home")}
          aria-label="Trang chủ ứng dụng"
        >
          {operator?.logo ? (
            <img src={operator.logo} alt="" />
          ) : (
            <Bus size={27} />
          )}
          <span>
            {brand}
            <small>
              {operator ? "Ứng dụng nhà xe" : "Đặt vé · Nhiều nhà xe"}
            </small>
          </span>
        </button>
        <button onClick={() => navigate("lookup")} aria-label="Tra cứu vé">
          <Ticket />
        </button>
      </header>
      {error && (
        <div className="gp-error" role="alert">
          {error}
          <button onClick={() => setError("")}>Đóng</button>
        </div>
      )}
      {busy && (
        <div className="gp-progress" role="status">
          Đang xử lý…
        </div>
      )}
      {step === "home" && (
        <>
          <section
            className="gp-hero"
            style={
              operator?.hero
                ? {
                    backgroundImage: `linear-gradient(0deg,#102744dd,transparent),url(${operator.hero})`,
                  }
                : undefined
            }
          >
            <span>HÀNH TRÌNH CỦA BẠN</span>
            <h1>
              Đi êm ái.
              <br />
              Đến an tâm.
            </h1>
            <p>
              {operator?.description ||
                "Chọn hành trình và đặt vé cùng những nhà xe trên DANAVA GO."}
            </p>
            <img className="gp-hero-bus" src={image} alt={brand} />
          </section>
          <form
            className="gp-search gp-card"
            onSubmit={(e) => {
              e.preventDefault();
              search();
            }}
          >
            <h2>
              <Search size={19} /> Tìm chuyến của bạn
            </h2>
            {!operator && (
              <label>
                Nhà xe
                <select
                  value={operatorId}
                  onChange={(e) => setOperatorId(e.target.value)}
                >
                  <option value="">Tất cả nhà xe</option>
                  {operators.map((o) => (
                    <option value={o.id} key={o.id}>
                      {o.name}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <div className="gp-place-fields">
              <label>
                <MapPin size={20} />
                Điểm đi
                <input
                  list="gp-cities"
                  required
                  value={params.from}
                  onChange={(e) =>
                    setParams((s) => ({ ...s, from: e.target.value }))
                  }
                />
              </label>
              <button
                type="button"
                aria-label="Đảo chiều"
                onClick={() =>
                  setParams((s) => ({ ...s, from: s.to, to: s.from }))
                }
              >
                <ArrowLeftRight size={21} />
              </button>
              <label>
                <MapPin size={20} />
                Điểm đến
                <input
                  list="gp-cities"
                  required
                  value={params.to}
                  onChange={(e) =>
                    setParams((s) => ({ ...s, to: e.target.value }))
                  }
                />
              </label>
            </div>
            <datalist id="gp-cities">
              {[
                ...new Set([
                  ...cities,
                  ...(operator?.routes.flatMap((r) => [r.from, r.to]) || []),
                ]),
              ].map((c) => (
                <option value={c} key={c} />
              ))}
            </datalist>
            <div className="gp-two">
              <label>
                Ngày đi
                <input
                  aria-label="Ngày đi"
                  type="date"
                  required
                  min={getVietnamTodayDateStr()}
                  value={params.date}
                  onChange={(e) =>
                    setParams((s) => ({ ...s, date: e.target.value }))
                  }
                />
              </label>
              <label>
                Hành khách
                <select
                  value={params.passengers}
                  onChange={(e) =>
                    setParams((s) => ({
                      ...s,
                      passengers: Number(e.target.value),
                    }))
                  }
                >
                  {[1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={n}>
                      {n} người
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <button className="gp-primary" disabled={busy}>
              <Search size={20} />
              Tìm chuyến
            </button>
          </form>
          <section className="gp-section">
            <h2>{operator ? "Tuyến nhà xe" : "Khám phá nhà xe"}</h2>
            {operator
              ? operator.routes.map((r) => (
                  <button
                    className="gp-route gp-card"
                    key={r.id}
                    onClick={() =>
                      setParams((s) => ({ ...s, from: r.from, to: r.to }))
                    }
                  >
                    <MapPin />
                    <span>
                      <strong>
                        {r.from} → {r.to}
                      </strong>
                      <small>
                        Khoảng {Math.floor(r.durationMinutes / 60)} giờ{" "}
                        {r.durationMinutes % 60} phút
                      </small>
                    </span>
                    <ArrowRight size={18} />
                  </button>
                ))
              : operators.map((o) => (
                  <a
                    className="gp-route gp-card"
                    key={o.id}
                    href={"/nha-xe/" + o.slug}
                  >
                    <Bus />
                    <span>
                      <strong>{o.name}</strong>
                      <small>Xem tuyến và thông tin nhà xe</small>
                    </span>
                    <ArrowRight size={18} />
                  </a>
                ))}
          </section>
        </>
      )}
      {step === "trips" && (
        <section className="gp-section">
          <button className="gp-back" onClick={() => navigate("home")}>
            <ArrowLeft size={18} />
            Sửa tìm kiếm
          </button>
          <h1>Chọn chuyến</h1>
          <p>
            {params.from} → {params.to}
            <br />
            {formatVietnamDate(params.date)} · {params.passengers} hành khách
          </p>
          {!trips.length ? (
            <div className="gp-card gp-empty">
              <Bus />
              <h2>Chưa có chuyến phù hợp</h2>
              <p>Thử ngày khác hoặc thay đổi tuyến.</p>
            </div>
          ) : (
            trips.map((t) => (
              <article className="gp-card gp-trip" key={t.id}>
                <div className="gp-trip-head">
                  <img src={t.vehicle.image} alt={t.vehicle.name} />
                  <div>
                    <small>{t.operator}</small>
                    <h2>{t.vehicle.name}</h2>
                    <p>{t.vehicle.amenities.slice(0, 3).join(" · ")}</p>
                  </div>
                </div>
                <div className="gp-trip-times">
                  <strong>
                    {t.departureTime}
                    <small>{t.from}</small>
                  </strong>
                  <span>
                    <ArrowRight />
                    {t.duration}
                  </span>
                  <strong>
                    {t.arrivalTime}
                    <small>
                      {t.to}
                      {t.nextDay ? " (+1 ngày)" : ""}
                    </small>
                  </strong>
                </div>
                <div className="gp-trip-price">
                  <strong>
                    {money(t.price)}
                    <small> / khách</small>
                  </strong>
                  <span>Còn {t.availableSeatsCount} chỗ</span>
                </div>
                <button
                  className="gp-primary"
                  onClick={() => {
                    setTrip(t);
                    setSeats([]);
                    navigate("seats");
                  }}
                >
                  Chọn chuyến <ArrowRight size={18} />
                </button>
              </article>
            ))
          )}
        </section>
      )}
      {step === "seats" && trip && (
        <SeatSelectionModal
          trip={trip}
          dateStr={params.date}
          passengersCount={params.passengers}
          selectedSeats={seats}
          onToggleSeat={toggle}
          onRemoveSeatCode={(code) =>
            setSeats((s) => s.filter((c) => c !== code))
          }
          onBack={() => navigate("trips")}
          onProceedToPassenger={proceed}
        />
      )}
      {step === "passenger" && trip && (
        <PassengerForm
          trip={trip}
          dateStr={params.date}
          selectedSeats={seats}
          initialPassenger={passenger || undefined}
          onBack={() => navigate("seats")}
          onSubmit={(info) => {
            setPassenger(info);
            navigate("confirm");
          }}
        />
      )}
      {step === "confirm" && trip && hold && (
        <ApiReservation
          trip={trip}
          seats={seats}
          expires={hold.expires}
          busy={busy}
          onBack={() => navigate("passenger")}
          onConfirm={confirm}
        />
      )}
      {step === "ticket" && booking && (
        <BoardingTicket
          booking={booking}
          onNavigateHome={() => navigate("home")}
          onOpenLookup={() => navigate("lookup")}
        />
      )}
      {step === "lookup" && (
        <TicketLookupView
          onBack={() => navigate("home")}
          onNavigateHome={() => navigate("home")}
        />
      )}
      {step === "support" && (
        <section className="gp-section">
          <h1>Đồng hành cùng bạn</h1>
          <div className="gp-card gp-contact">
            <h2>{brand}</h2>
            <p>
              {operator?.policies ||
                "Liên hệ nhà xe trên thông tin chuyến để xác nhận điểm đón, giờ đi và chính sách đổi/hủy."}
            </p>
            {operator?.phone && (
              <a className="gp-primary" href={"tel:" + operator.phone}>
                Gọi {operator.phone}
              </a>
            )}
            {operator?.email && (
              <a href={"mailto:" + operator.email}>{operator.email}</a>
            )}
            <p>{operator?.address}</p>
          </div>
        </section>
      )}
      {["home", "trips", "support", "lookup"].includes(step) && (
        <nav className="gp-nav" aria-label="Điều hướng ứng dụng">
          {[
            { id: "home", label: "Trang chủ", Icon: Home },
            { id: "trips", label: "Chuyến xe", Icon: CalendarDays },
            { id: "lookup", label: "Vé của tôi", Icon: Ticket },
            { id: "support", label: "Hỗ trợ", Icon: Headphones },
          ].map(({ id, label, Icon }) => (
            <button
              aria-current={step === id ? "page" : undefined}
              key={id}
              onClick={() => navigate(id as Step)}
            >
              <Icon size={22} />
              <span>{label}</span>
            </button>
          ))}
        </nav>
      )}
    </div>
  );
}
