import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ArrowDownUp,
  Bell,
  Bus,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock3,
  CreditCard,
  Download,
  Headphones,
  Home,
  Mail,
  MapPin,
  Phone,
  Search,
  ShieldCheck,
  Ticket,
  User,
  Wallet,
  Wifi,
  X,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import {
  formatVietnamDate,
  getVietnamTodayDateStr,
  isValidBookingDate,
} from "../../utils/dateUtils";
import "./operator-app.css";

type Screen = "home" | "trips" | "seats" | "passenger" | "payment" | "ticket";
type Pass = {
  code: string;
  from: string;
  to: string;
  date: string;
  time: string;
  seats: string[];
  name: string;
  phone: string;
  pickup: string;
  total: number;
};
const vehicle = "/assets/images/bus_limousine_vip.png";
const money = (n: number) => n.toLocaleString("vi-VN") + "đ";
const seats = ["A1", "A2", "B1", "B2", "C1", "C2", "D1", "D2", "D3"];
const readPass = (): Pass | null => {
  try {
    const p = JSON.parse(localStorage.getItem("cuaong.demo.pass") || "null");
    return p &&
      typeof p.code === "string" &&
      typeof p.from === "string" &&
      typeof p.to === "string" &&
      typeof p.date === "string" &&
      typeof p.time === "string" &&
      Array.isArray(p.seats) &&
      p.seats.every((s: unknown) => typeof s === "string") &&
      typeof p.name === "string" &&
      typeof p.pickup === "string"
      ? p
      : null;
  } catch {
    return null;
  }
};
function Landscape() {
  return (
    <svg
      className="co-landscape"
      viewBox="0 0 500 270"
      preserveAspectRatio="xMidYMax slice"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="co-sky" x2="0" y2="1">
          <stop stopColor="#fff9e9" />
          <stop offset="1" stopColor="#ffdc79" />
        </linearGradient>
      </defs>
      <path fill="url(#co-sky)" d="M0 0h500v270H0z" />
      <circle cx="365" cy="88" r="70" fill="#ffc331" />
      <path
        fill="#ead9ad"
        d="m0 205 50-58 37 39 50-83 58 89 30-45 53 58 51-94 55 80 41-42 75 60v61H0Z"
      />
      <path
        fill="#c7b57c"
        d="m0 240 43-49 51 32 35-42 60 59 75-41 49 32 54-59 55 53 78-43v88H0Z"
      />
      <path fill="#f3cb62" d="M0 252q160-70 500-15v33H0Z" />
      <path
        d="M400 215Q280 235 370 243T230 280"
        fill="none"
        stroke="#fffaf0"
        strokeWidth="11"
      />
    </svg>
  );
}
function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className={"co-brand " + (compact ? "compact" : "")}>
      <span className="co-brand-mark">
        <img src="/assets/operator-app/cua-ong-coach-engraving.webp" alt="" />
      </span>
      <div>
        <strong>CỬA ÔNG{compact ? " " : <br />}LIMOUSINE</strong>
        <small>
          {compact
            ? "0983 227 788 · 0932 266 222"
            : "AN TOÀN · TIỆN NGHI · ĐÚNG GIỜ"}
        </small>
      </div>
    </div>
  );
}
function Banner() {
  return (
    <div className="co-banner">
      <Landscape />
      <Brand />
      <img
        src="/assets/operator-app/cua-ong-coach-engraving.webp"
        alt="Xe limousine minh họa"
      />
    </div>
  );
}
export default function OperatorApp() {
  const [screen, setScreen] = useState<Screen>("home");
  const [from, setFrom] = useState("Hà Nội");
  const [to, setTo] = useState("Cửa Ông");
  const [date, setDate] = useState(getVietnamTodayDateStr);
  const [count, setCount] = useState(1);
  const [time, setTime] = useState("07:00");
  const [selected, setSelected] = useState<string[]>([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [pickup, setPickup] = useState("Văn phòng Hà Nội");
  const [method, setMethod] = useState("qr");
  const [agree, setAgree] = useState(false);
  const [pass, setPass] = useState<Pass | null>(readPass);
  const [notice, setNotice] = useState("");
  const [sort, setSort] = useState("early");
  const [period, setPeriod] = useState("all");
  const [availableOnly, setAvailableOnly] = useState(false);
  const total = selected.length * 300000;
  const go = (next: Screen) => {
    setNotice("");
    setScreen(next);
    window.history.pushState({ coScreen: next }, "", "/app");
    window.scrollTo({ top: 0, behavior: "instant" });
  };
  useEffect(() => {
    document.title = "Cửa Ông Limousine · DANAVA GO";
    const onPop = (e: PopStateEvent) => {
      const next = e.state?.coScreen as Screen;
      const valid = [
        "home",
        "trips",
        "seats",
        "passenger",
        "payment",
        "ticket",
      ].includes(next);
      setScreen(
        !valid
          ? "home"
          : ["passenger", "payment"].includes(next) && selected.length !== count
            ? "trips"
            : next,
      );
      setNotice("");
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [selected.length, count]);
  const back = () =>
    go(
      (
        {
          trips: "home",
          seats: "trips",
          passenger: "seats",
          payment: "passenger",
          ticket: "home",
          home: "home",
        } as const
      )[screen],
    );
  const search = () => {
    if (from === to) return setNotice("Điểm đi và điểm đến phải khác nhau.");
    if (!isValidBookingDate(date))
      return setNotice("Vui lòng chọn ngày từ hôm nay.");
    setSelected([]);
    go("trips");
  };
  const toggle = (id: string) => {
    setNotice("");
    setSelected((s) =>
      s.includes(id)
        ? s.filter((x) => x !== id)
        : s.length < count
          ? [...s, id]
          : (setNotice(`Bạn đã chọn đủ ${count} ghế.`), s),
    );
  };
  const pay = () => {
    if (selected.length !== count || !name.trim() || !isValidBookingDate(date))
      return setNotice("Vui lòng kiểm tra lại ghế, hành khách và ngày đi.");
    if (!agree)
      return setNotice("Vui lòng đồng ý điều khoản trước khi xác nhận.");
    const p: Pass = {
      code:
        "CO" +
        Array.from(crypto.getRandomValues(new Uint8Array(4)), (b) =>
          b.toString(16).padStart(2, "0"),
        )
          .join("")
          .toUpperCase(),
      from,
      to,
      date,
      time,
      seats: selected,
      name,
      phone,
      pickup,
      total,
    };
    try {
      localStorage.setItem("cuaong.demo.pass", JSON.stringify(p));
    } catch {
      /* Ticket remains usable in memory. */
    }
    setPass(p);
    go("ticket");
  };
  const tripTimes = (
    period === "morning"
      ? ["07:00", "09:00"]
      : period === "afternoon"
        ? ["13:00"]
        : ["07:00", "09:00", "13:00"]
  ).filter((t) => !availableOnly || (t === "13:00" ? 2 : 7) >= count);
  if (sort === "late") tripTimes.reverse();
  return (
    <main className="co-app">
      <div className="co-shell">
        {screen === "home" ? (
          <>
            <header className="co-top">
              <Brand compact />
              <button
                aria-label="Thông báo"
                onClick={() => setNotice("Chưa có thông báo mới.")}
              >
                <Bell />
              </button>
            </header>
            <section className="co-home-hero">
              <div>
                <span className="co-kicker">HÀ NỘI ↔ QUẢNG NINH</span>
                <h1>
                  Đi êm ái.
                  <br />
                  Đến an tâm.
                </h1>
                <p>
                  Đồng hành cùng bạn
                  <br />
                  trên mọi hành trình
                  <br />
                  đến Cửa Ông – Quảng Ninh.
                </p>
              </div>
            </section>
            <form
              className="co-card co-search"
              onSubmit={(e) => {
                e.preventDefault();
                search();
              }}
            >
              <div className="co-trip-mode">
                <Bus size={20} /> Một chiều <span>Chuyến đi của bạn</span>
              </div>
              <label>
                <MapPin />
                <span>
                  Điểm đi
                  <select
                    aria-label="Điểm đi"
                    value={from}
                    onChange={(e) => setFrom(e.target.value)}
                  >
                    <option>Hà Nội</option>
                    <option>Cửa Ông</option>
                  </select>
                </span>
                <ChevronRight />
              </label>
              <label>
                <MapPin />
                <span>
                  Điểm đến
                  <select
                    aria-label="Điểm đến"
                    value={to}
                    onChange={(e) => setTo(e.target.value)}
                  >
                    <option>Cửa Ông</option>
                    <option>Hà Nội</option>
                  </select>
                </span>
                <button
                  type="button"
                  aria-label="Đảo chiều"
                  onClick={() => {
                    setFrom(to);
                    setTo(from);
                  }}
                >
                  <ArrowDownUp />
                </button>
              </label>
              <label>
                <CalendarDays />
                <span>
                  Ngày đi
                  <div className="co-date-control">
                    <strong>{formatVietnamDate(date)}</strong>
                    <input
                      aria-label="Ngày đi"
                      type="date"
                      min={getVietnamTodayDateStr()}
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                    />
                  </div>
                </span>
              </label>
              <label>
                <User />
                <span>
                  Số hành khách
                  <select
                    aria-label="Số hành khách"
                    value={count}
                    onChange={(e) => {
                      setCount(Number(e.target.value));
                      setSelected([]);
                    }}
                  >
                    {[1, 2, 3, 4, 5].map((n) => (
                      <option key={n} value={n}>
                        {n} người
                      </option>
                    ))}
                  </select>
                </span>
              </label>
              <button className="co-primary">
                <Search /> Tìm chuyến
              </button>
            </form>
            <section className="co-card co-popular">
              <h2>Tuyến phổ biến</h2>
              <button onClick={search}>
                <span className="co-mini-scenery">
                  <Landscape />
                  <Bus />
                </span>
                <span>
                  <strong>Hà Nội ↔ Cửa Ông</strong>
                  <small>Limousine 9 chỗ cao cấp</small>
                  <small>
                    <Clock3 size={14} /> Khoảng 3 giờ 30 phút
                  </small>
                </span>
                <ChevronRight />
              </button>
            </section>
            <p className="co-demo">
              Bản trải nghiệm giao diện · Dữ liệu và xe minh họa
            </p>
          </>
        ) : (
          <>
            <header className="co-step-head">
              <button aria-label="Quay lại" onClick={back}>
                <ArrowLeft />
              </button>
              <h1>
                {
                  {
                    trips: "Chọn chuyến",
                    seats: "Chọn chỗ ngồi",
                    passenger: "Điểm đón & trả",
                    payment: "Xác nhận & thanh toán",
                    ticket: "Vé điện tử",
                  }[screen]
                }
              </h1>
              {screen === "ticket" && (
                <button aria-label="Đóng vé" onClick={() => go("home")}>
                  <X />
                </button>
              )}
            </header>
            {screen !== "ticket" && <Banner />}
          </>
        )}
        {screen === "trips" && (
          <>
            <div className="co-route-heading">
              <h2>
                {from} <ArrowRight /> {to}
              </h2>
              <p>
                {formatVietnamDate(date)} · {count} hành khách
              </p>
            </div>
            <div className="co-date-strip">
              {[0, 1, 2, 3].map((offset) => {
                const d = new Date(`${date}T12:00:00+07:00`);
                d.setDate(d.getDate() + offset);
                const value = new Intl.DateTimeFormat("en-CA", {
                  timeZone: "Asia/Ho_Chi_Minh",
                }).format(d);
                return (
                  <button
                    className={value === date ? "active" : ""}
                    key={value}
                    onClick={() => {
                      setDate(value);
                      setSelected([]);
                    }}
                  >
                    <small>
                      {new Intl.DateTimeFormat("vi-VN", {
                        weekday: "short",
                        timeZone: "Asia/Ho_Chi_Minh",
                      }).format(d)}
                    </small>
                    <strong>{formatVietnamDate(value).slice(0, 5)}</strong>
                  </button>
                );
              })}
            </div>
            <div className="co-filters">
              <select
                aria-label="Lọc giờ đi"
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
              >
                <option value="all">Mọi giờ đi</option>
                <option value="morning">Buổi sáng</option>
                <option value="afternoon">Buổi chiều</option>
              </select>
              <select
                aria-label="Sắp xếp"
                value={sort}
                onChange={(e) => setSort(e.target.value)}
              >
                <option value="early">Đi sớm nhất</option>
                <option value="late">Đi muộn nhất</option>
              </select>
              <button
                aria-pressed={availableOnly}
                onClick={() => setAvailableOnly(!availableOnly)}
              >
                Còn ≥ {count} ghế
              </button>
            </div>
            {tripTimes.length === 0 && (
              <section className="co-card co-section" role="status">
                <h2>Chưa có chuyến phù hợp</h2>
                <p>Thử đổi khung giờ hoặc bỏ bộ lọc số ghế.</p>
                <button
                  className="co-primary"
                  onClick={() => {
                    setPeriod("all");
                    setAvailableOnly(false);
                  }}
                >
                  Xóa bộ lọc
                </button>
              </section>
            )}
            {tripTimes.map((t) => (
              <article className="co-card co-trip" key={t}>
                <div className="co-trip-intro">
                  <img src={vehicle} alt="Limousine 9 chỗ" />
                  <div>
                    <h2>Limousine 9 chỗ</h2>
                    <p>
                      <Wifi size={15} /> WiFi <span>USB</span>
                      <span>Điều hòa</span>
                    </p>
                  </div>
                </div>
                <div className="co-times">
                  <div>
                    <strong>{t}</strong>
                    <small>{from}</small>
                  </div>
                  <span>
                    <ArrowRight />
                    <small>3 giờ 30 phút</small>
                  </span>
                  <div>
                    <strong>
                      {String(Number(t.slice(0, 2)) + 3).padStart(2, "0")}:30
                    </strong>
                    <small>{to}</small>
                  </div>
                </div>
                <div className="co-price">
                  <strong>
                    {money(300000)} <small>/ khách</small>
                  </strong>
                  <span>Còn {t === "13:00" ? 2 : 7} ghế</span>
                </div>
                <button
                  className="co-primary"
                  onClick={() => {
                    if ((t === "13:00" ? 2 : 7) < count)
                      return setNotice(
                        "Chuyến này không đủ ghế cho nhóm của bạn.",
                      );
                    setTime(t);
                    setSelected([]);
                    setPickup(
                      from === "Hà Nội"
                        ? "Văn phòng Hà Nội"
                        : "Văn phòng Cửa Ông",
                    );
                    go("seats");
                  }}
                >
                  Chọn chuyến <ArrowRight />
                </button>
              </article>
            ))}
            <p className="co-demo">Lịch trình và giá vé mô phỏng.</p>
          </>
        )}
        {screen === "seats" && (
          <>
            <div className="co-card co-route-summary">
              <h2>
                {from} <ArrowRight /> {to}
              </h2>
              <p>
                <CalendarDays size={18} /> {time} · {formatVietnamDate(date)}{" "}
                <span>Limousine 9 chỗ</span>
              </p>
            </div>
            <div className="co-center">
              <h2>Chọn ghế yêu thích</h2>
              <p>Vui lòng chọn {count} ghế phù hợp với bạn</p>
            </div>
            <div className="co-van">
              <div className="co-windshield" />
              <div className="co-driver">Tài xế</div>
              <div className="co-seat-grid">
                {seats.map((id) => (
                  <button
                    key={id}
                    className={
                      "co-seat " + (selected.includes(id) ? "selected" : "")
                    }
                    disabled={
                      time === "13:00"
                        ? !["B1", "B2"].includes(id)
                        : ["A2", "C2"].includes(id)
                    }
                    aria-pressed={selected.includes(id)}
                    aria-label={`Ghế ${id}${(time === "13:00" ? !["B1", "B2"].includes(id) : ["A2", "C2"].includes(id)) ? " đã đặt" : ""}`}
                    onClick={() => toggle(id)}
                  >
                    {id}
                  </button>
                ))}
              </div>
              <div className="co-tail-lights" />
            </div>
            <div className="co-card co-legend">
              <span>
                <i /> Trống
              </span>
              <span>
                <i className="booked" /> Đã đặt
              </span>
              <span>
                <i className="selected" /> Đang chọn
              </span>
            </div>
            <div className="co-card co-seat-total">
              <div>
                <h2>
                  {selected.length
                    ? "Ghế " + selected.join(", ")
                    : "Chưa chọn ghế"}
                </h2>
                <p>Giá vé</p>
                <strong>{money(total)}</strong>
              </div>
              <Bus size={46} />
            </div>
            <div className="co-bottom-action">
              <strong>
                {selected.length}/{count} ghế · {money(total)}
              </strong>
              <button
                className="co-primary"
                disabled={selected.length !== count}
                onClick={() => go("passenger")}
              >
                Tiếp tục <ArrowRight />
              </button>
            </div>
          </>
        )}
        {screen === "passenger" && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (name.trim().length < 2)
                return setNotice("Vui lòng nhập họ tên hợp lệ.");
              if (!/^(0|\+84)[0-9]{9}$/.test(phone.replace(/[\s.-]/g, "")))
                return setNotice("Số điện thoại chưa hợp lệ.");
              go("payment");
            }}
          >
            <section className="co-card co-section">
              <h2>
                <MapPin /> Điểm đón
              </h2>
              <p>Chọn địa điểm đón khách</p>
              {[
                from === "Hà Nội" ? "Văn phòng Hà Nội" : "Văn phòng Cửa Ông",
                from === "Hà Nội"
                  ? "Bến xe Mỹ Đình"
                  : "Điểm trung chuyển Cẩm Phả",
              ].map((p) => (
                <label
                  className={"co-radio " + (pickup === p ? "active" : "")}
                  key={p}
                >
                  <input
                    type="radio"
                    name="pickup"
                    checked={pickup === p}
                    onChange={() => setPickup(p)}
                  />
                  <span>
                    <strong>{p}</strong>
                    <small>Địa chỉ sẽ được nhà xe xác nhận</small>
                  </span>
                  <ChevronRight />
                </label>
              ))}
            </section>
            <section className="co-card co-section">
              <h2>
                <MapPin /> Điểm trả
              </h2>
              <div className="co-radio active">
                <CheckCircle2 />
                <span>
                  <strong>Văn phòng {to}</strong>
                  <small>Địa chỉ sẽ được nhà xe xác nhận</small>
                </span>
              </div>
              <div className="co-map">
                <MapPin />
                <span>Đường đi minh họa</span>
                <Bus />
                <MapPin />
              </div>
            </section>
            <section className="co-card co-section">
              <h2>
                <User /> Thông tin hành khách
              </h2>
              <p>Thông tin người đại diện đặt vé</p>
              <label className="co-field">
                <User />
                <input
                  aria-label="Họ và tên"
                  required
                  minLength={2}
                  placeholder="Họ và tên"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </label>
              <label className="co-field">
                <Phone />
                <input
                  aria-label="Số điện thoại"
                  required
                  type="tel"
                  placeholder="Số điện thoại"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </label>
              <label className="co-field">
                <Mail />
                <input
                  aria-label="Email"
                  type="email"
                  placeholder="Email (không bắt buộc)"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </label>
            </section>
            <button className="co-primary co-page-cta">
              Tiếp tục <ArrowRight />
            </button>
          </form>
        )}
        {screen === "payment" && (
          <>
            <div className="co-card co-section">
              <h2>
                {from} <ArrowRight /> {to}
              </h2>
              <p>
                {time} · {formatVietnamDate(date)} · Ghế {selected.join(", ")}
              </p>
              <hr />
              <h3>Đón khách</h3>
              <p>{pickup}</p>
              <h3>Trả khách</h3>
              <p>Văn phòng {to}</p>
            </div>
            <section className="co-section">
              <h2>Phương thức thanh toán</h2>
              {[
                {
                  id: "qr",
                  title: "QR ngân hàng",
                  icon: CreditCard,
                  desc: "Giao diện thanh toán qua mã QR",
                },
                {
                  id: "wallet",
                  title: "Ví điện tử",
                  icon: Wallet,
                  desc: "Giao diện ví điện tử",
                },
              ].map((m) => (
                <label
                  className={
                    "co-card co-radio " + (method === m.id ? "active" : "")
                  }
                  key={m.id}
                >
                  <m.icon />
                  <span>
                    <strong>{m.title}</strong>
                    <small>{m.desc}</small>
                  </span>
                  <input
                    type="radio"
                    name="method"
                    checked={method === m.id}
                    onChange={() => setMethod(m.id)}
                  />
                </label>
              ))}
            </section>
            <div className="co-card co-section co-bill">
              <p>
                Giá vé ({selected.length} ghế)<strong>{money(total)}</strong>
              </p>
              <p>
                Phí dịch vụ<strong>0đ</strong>
              </p>
              <hr />
              <h2>
                Tổng thanh toán<strong>{money(total)}</strong>
              </h2>
            </div>
            <label className="co-consent">
              <input
                type="checkbox"
                checked={agree}
                onChange={(e) => setAgree(e.target.checked)}
              />{" "}
              Tôi hiểu đây là bản mô phỏng, chưa giữ chỗ và không thu tiền.
            </label>
            <button className="co-primary co-page-cta" onClick={pay}>
              Xác nhận vé demo <ArrowRight />
            </button>
            <p className="co-demo">
              <ShieldCheck size={15} /> Không gửi giao dịch ngân hàng thực tế.
            </p>
          </>
        )}
        {screen === "ticket" &&
          (pass ? (
            <>
              <div className="co-success">
                <CheckCircle2 />
                <h2>Đã tạo vé trải nghiệm</h2>
                <p>Cảm ơn bạn đã trải nghiệm Cửa Ông Limousine.</p>
              </div>
              <article className="co-card co-ticket">
                <div className="co-ticket-brand">
                  <Brand compact />
                  <span>
                    <Check size={16} /> VÉ DEMO
                  </span>
                </div>
                <section className="co-section">
                  <h2 className="co-ticket-route">
                    {pass.from}
                    <ArrowRight />
                    {pass.to}
                  </h2>
                  <div className="co-ticket-facts">
                    <div>
                      <CalendarDays />
                      <small>Ngày đi</small>
                      <strong>{formatVietnamDate(pass.date)}</strong>
                    </div>
                    <div>
                      <Clock3 />
                      <small>Giờ đi</small>
                      <strong>{pass.time}</strong>
                    </div>
                    <div>
                      <User />
                      <small>Ghế</small>
                      <strong>{pass.seats.join(", ")}</strong>
                    </div>
                    <div>
                      <Bus />
                      <small>Xe</small>
                      <strong>Limousine 9 chỗ</strong>
                    </div>
                  </div>
                </section>
                <section className="co-qr">
                  <QRCodeSVG
                    value={JSON.stringify({ demo: true, code: pass.code })}
                    size={150}
                    fgColor="#432b0d"
                  />
                  <small>QR minh họa · Không có giá trị lên xe</small>
                  <p>Mã đặt vé</p>
                  <h2>{pass.code}</h2>
                </section>
                <section className="co-section">
                  <h3>
                    <MapPin /> Điểm đón · {pass.pickup}
                  </h3>
                  <p>Hành khách: {pass.name}</p>
                  <p>Có mặt trước giờ khởi hành 15 phút.</p>
                  <hr />
                  <h3>Liên hệ nhà xe</h3>
                  <p>0983 227 788 · 0932 266 222</p>
                </section>
              </article>
              <div className="co-ticket-actions">
                <button onClick={() => window.print()}>
                  <Download /> Lưu vé / PDF
                </button>
                <a href="tel:0983227788">
                  <Phone /> Gọi nhà xe
                </a>
              </div>
            </>
          ) : (
            <section className="co-card co-section">
              <h2>Bạn chưa có vé</h2>
              <p>Chọn hành trình đầu tiên để trải nghiệm đặt vé.</p>
              <button className="co-primary" onClick={() => go("home")}>
                Tìm chuyến
              </button>
            </section>
          ))}
        {notice && (
          <div className="co-notice" role="alert">
            <span>{notice}</span>
            <button aria-label="Đóng thông báo" onClick={() => setNotice("")}>
              <X size={18} />
            </button>
          </div>
        )}
        {screen === "home" && (
          <nav className="co-bottom-nav" aria-label="Điều hướng ứng dụng">
            <button className="active" onClick={() => go("home")}>
              <Home />
              Trang chủ
            </button>
            <button onClick={() => go("ticket")}>
              <Ticket />
              Vé của tôi
            </button>
            <a href="tel:0983227788">
              <Headphones />
              Hỗ trợ
            </a>
            <button
              onClick={() =>
                setNotice(
                  "Bản trải nghiệm cho phép đặt vé không cần tài khoản.",
                )
              }
            >
              <User />
              Tài khoản
            </button>
          </nav>
        )}
      </div>
    </main>
  );
}
