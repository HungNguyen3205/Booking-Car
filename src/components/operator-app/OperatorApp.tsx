import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ArrowDownUp,
  Bell,
  Bus,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  ChevronDown,
  Clock,
  Clock3,
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
  Building2,
  Armchair,
  Tag,
  ArrowLeftRight,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import {
  formatVietnamDate,
  getVietnamTodayDateStr,
  isValidBookingDate,
} from "../../utils/dateUtils";
import "./operator-app.css";

type Screen = "home" | "trips" | "seats" | "passenger" | "payment" | "ticket";
type TripMode = "one_way" | "round_trip";

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
const heroImage = "/assets/operator-app/cua-ong-hero.webp";
const money = (n: number) => n.toLocaleString("vi-VN") + "đ";

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

function BrandHeader({ onNotification }: { onNotification: () => void }) {
  return (
    <header className="co-top">
      <div className="co-brand">
        <span className="co-brand-mark">
          <img
            src="/assets/operator-app/cua-ong-coach-engraving.webp"
            alt="Cửa Ông Logo"
          />
        </span>
        <div>
          <strong>CỬA ÔNG LIMOUSINE</strong>
          <small>0983227788-0932266222</small>
        </div>
      </div>
      <button
        aria-label="Thông báo"
        className="co-bell-btn"
        onClick={onNotification}
      >
        <Bell size={20} />
        <span className="co-bell-dot" />
      </button>
    </header>
  );
}

export default function OperatorApp() {
  const [screen, setScreen] = useState<Screen>("home");
  const [tripMode, setTripMode] = useState<TripMode>("one_way");
  const [from, setFrom] = useState("Hà Nội");
  const [to, setTo] = useState("Cửa Ông");
  const [date, setDate] = useState(() => {
    // Default to today or November 5, 2026 for demo matching design
    const today = getVietnamTodayDateStr();
    return isValidBookingDate(today) ? today : "2026-11-05";
  });
  const [count, setCount] = useState(1);
  const [time, setTime] = useState("07:00");
  const [selected, setSelected] = useState<string[]>(["B1"]);
  const [name, setName] = useState("Nguyễn Văn Hùng");
  const [phone, setPhone] = useState("0983227788");
  const [email, setEmail] = useState("");
  const [pickup, setPickup] = useState("Văn phòng Hà Nội");
  const [dropoff, setDropoff] = useState("Văn phòng Cửa Ông");
  const [method, setMethod] = useState("qr");
  const [agree, setAgree] = useState(true);
  const [coupon, setCoupon] = useState("");
  const [pass, setPass] = useState<Pass | null>(readPass);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    setDropoff("Văn phòng " + to);
  }, [to]);

  // Timer countdown for payment screen (Image 5: "Giữ chỗ 09:42")
  const [secondsLeft, setSecondsLeft] = useState(582);

  useEffect(() => {
    if (screen !== "payment") return;
    const interval = setInterval(() => {
      setSecondsLeft((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [screen]);

  const formatCountdown = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const formatDisplayDateWithDay = (isoDate: string) => {
    try {
      const d = new Date(`${isoDate}T12:00:00+07:00`);
      const day = String(d.getDate()).padStart(2, "0");
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const year = d.getFullYear();
      const weekdays = [
        "Chủ Nhật",
        "Thứ Hai",
        "Thứ Ba",
        "Thứ Tư",
        "Thứ Năm",
        "Thứ Sáu",
        "Thứ Bảy",
      ];
      return `${day}/${month}/${year} (${weekdays[d.getDay()]})`;
    } catch {
      return isoDate;
    }
  };

  const getDayStrip = (baseIso: string) => {
    const list = [];
    const base = new Date(`${baseIso}T12:00:00+07:00`);
    for (let i = 0; i < 4; i++) {
      const d = new Date(base);
      d.setDate(d.getDate() + i);
      const iso = d.toISOString().slice(0, 10);
      const day = String(d.getDate()).padStart(2, "0");
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const dayOfWeek = d.getDay();
      const dayLabel = dayOfWeek === 0 ? "CN" : `Th ${dayOfWeek + 1}`;
      list.push({ iso, label: dayLabel, dateStr: `${day}/${month}` });
    }
    return list;
  };

  const total = (selected.length || count) * 300000;

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
      setScreen(valid ? next : "home");
      setNotice("");
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const back = () => {
    const map: Record<Screen, Screen> = {
      trips: "home",
      seats: "trips",
      passenger: "seats",
      payment: "passenger",
      ticket: "home",
      home: "home",
    };
    go(map[screen] || "home");
  };

  const search = () => {
    if (from === to) return setNotice("Điểm đi và điểm đến phải khác nhau.");
    setSelected(["B1"]);
    go("trips");
  };

  const swapRoute = () => {
    setFrom(to);
    setTo(from);
  };

  const toggleSeat = (id: string) => {
    setNotice("");
    if (selected.includes(id)) {
      setSelected((s) => s.filter((x) => x !== id));
    } else {
      if (selected.length < count) {
        setSelected((s) => [...s, id]);
      } else {
        // In 1-seat mode, replace selection
        if (count === 1) {
          setSelected([id]);
        } else {
          setNotice(`Bạn đã chọn đủ ${count} ghế.`);
        }
      }
    }
  };

  const pay = () => {
    if (!name.trim()) return setNotice("Vui lòng nhập họ và tên.");
    if (!agree) return setNotice("Vui lòng đồng ý với điều khoản sử dụng.");

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
      seats: selected.length ? selected : ["B1"],
      name,
      phone,
      pickup,
      total,
    };
    try {
      localStorage.setItem("cuaong.demo.pass", JSON.stringify(p));
    } catch {
      // In-memory fallback
    }
    setPass(p);
    go("ticket");
  };

  const tripList = [
    {
      timeStart: "07:00",
      timeEnd: "10:30",
      duration: "3 giờ 30 phút",
      price: 300000,
      seatsLeft: 5,
      type: "Limousine 9 chỗ",
    },
    {
      timeStart: "09:00",
      timeEnd: "12:30",
      duration: "3 giờ 30 phút",
      price: 300000,
      seatsLeft: 5,
      type: "Limousine 9 chỗ",
    },
  ];

  return (
    <main className="co-app">
      <div className="co-shell">
        {/* =========================================================================
            SCREEN 1: HOME (Exact match Image 1)
            ========================================================================= */}
        {screen === "home" && (
          <div className="co-home-wrap">
            {/* 1. Header with Logo & Notification Bell */}
            <BrandHeader
              onNotification={() => setNotice("Chưa có thông báo mới.")}
            />

            {/* 2. Hero Section (Compact height so search button sits comfortably on screen) */}
            <section
              className="co-home-hero"
              style={{ backgroundImage: `url(${heroImage})` }}
            >
              <div className="co-hero-overlay" />
              <div className="co-hero-content">
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
                  đến Cửa Ông - Quảng Ninh.
                </p>
              </div>
            </section>

            {/* 3. Floating Search Card (Tightly styled to fit viewport perfectly) */}
            <form
              className="co-card co-search"
              onSubmit={(e) => {
                e.preventDefault();
                search();
              }}
            >
              {/* Trip Type Tabs */}
              <div className="co-tabs">
                <button
                  type="button"
                  className={"co-tab " + (tripMode === "one_way" ? "active" : "")}
                  onClick={() => setTripMode("one_way")}
                >
                  <Bus size={18} />
                  <span>Một chiều</span>
                </button>
                <button
                  type="button"
                  className={"co-tab " + (tripMode === "round_trip" ? "active" : "")}
                  onClick={() => setTripMode("round_trip")}
                >
                  <ArrowLeftRight size={17} />
                  <span>Khứ hồi</span>
                </button>
              </div>

              {/* Input Fields */}
              <div className="co-fields-list">
                {/* Row 1: Điểm đi */}
                <div className="co-field-row">
                  <div className="co-field-icon-wrap">
                    <MapPin className="co-icon-gold" size={19} />
                  </div>
                  <div className="co-field-body">
                    <span className="co-field-label">Điểm đi</span>
                    <select
                      value={from}
                      onChange={(e) => setFrom(e.target.value)}
                      className="co-field-select"
                      aria-label="Điểm đi"
                    >
                      <option value="Hà Nội">Hà Nội</option>
                      <option value="Cửa Ông">Cửa Ông</option>
                      <option value="Hải Phòng">Hải Phòng</option>
                      <option value="Quảng Ninh">Quảng Ninh</option>
                    </select>
                  </div>
                  <ChevronRight size={17} className="co-field-chevron" />
                </div>

                {/* Connecting dashed line between pins */}
                <div className="co-pins-connector" />

                {/* Row 2: Điểm đến + Swap Button */}
                <div className="co-field-row">
                  <div className="co-field-icon-wrap">
                    <MapPin className="co-icon-gold" size={19} />
                  </div>
                  <div className="co-field-body">
                    <span className="co-field-label">Điểm đến</span>
                    <select
                      value={to}
                      onChange={(e) => setTo(e.target.value)}
                      className="co-field-select"
                      aria-label="Điểm đến"
                    >
                      <option value="Cửa Ông">Cửa Ông</option>
                      <option value="Hà Nội">Hà Nội</option>
                      <option value="Quảng Ninh">Quảng Ninh</option>
                      <option value="Cẩm Phả">Cẩm Phả</option>
                    </select>
                  </div>
                  <button
                    type="button"
                    onClick={swapRoute}
                    className="co-swap-btn"
                    title="Đổi chiều đi - đến"
                    aria-label="Đổi chiều đi - đến"
                  >
                    <ArrowDownUp size={16} />
                  </button>
                </div>

                {/* Row 3: Ngày đi */}
                <div className="co-field-row">
                  <div className="co-field-icon-wrap">
                    <CalendarDays className="co-icon-gold" size={19} />
                  </div>
                  <div className="co-field-body">
                    <span className="co-field-label">Ngày đi</span>
                    <div className="co-date-picker-wrap">
                      <span className="co-field-val">
                        {formatDisplayDateWithDay(date)}
                      </span>
                      <input
                        type="date"
                        value={date}
                        min={getVietnamTodayDateStr()}
                        onChange={(e) => setDate(e.target.value)}
                        className="co-native-date-input"
                        aria-label="Ngày đi"
                      />
                    </div>
                  </div>
                  <ChevronRight size={17} className="co-field-chevron" />
                </div>

                {/* Row 4: Số hành khách */}
                <div className="co-field-row">
                  <div className="co-field-icon-wrap">
                    <User className="co-icon-gold" size={19} />
                  </div>
                  <div className="co-field-body">
                    <span className="co-field-label">Số hành khách</span>
                    <select
                      value={count}
                      onChange={(e) => setCount(Number(e.target.value))}
                      className="co-field-select"
                      aria-label="Số hành khách"
                    >
                      {[1, 2, 3, 4, 5].map((n) => (
                        <option key={n} value={n}>
                          {n} người
                        </option>
                      ))}
                    </select>
                  </div>
                  <ChevronRight size={17} className="co-field-chevron" />
                </div>
              </div>

              {/* Action Button: Tìm chuyến (Fits completely inside screen) */}
              <button type="submit" className="co-primary co-search-btn">
                <Search size={20} />
                <span>Tìm chuyến</span>
              </button>
            </form>

            {/* 4. Tuyến phổ biến (Scrollable section below) */}
            <section className="co-card co-popular-section">
              <div className="co-popular-head">
                <h2>Tuyến phổ biến</h2>
                <button
                  type="button"
                  onClick={search}
                  className="co-see-all-link"
                >
                  Xem tất cả <ChevronRight size={14} />
                </button>
              </div>

              <div
                className="co-route-card"
                onClick={search}
                style={{ cursor: "pointer" }}
              >
                <img
                  src={heroImage}
                  alt="Hà Nội - Quảng Ninh"
                  className="co-route-img"
                />
                <div className="co-route-info">
                  <strong>Hà Nội → Quảng Ninh</strong>
                  <div className="co-route-badges">
                    <span>
                      <Bus size={13} /> Nhiều khung giờ mỗi ngày
                    </span>
                    <span>
                      <ShieldCheck size={13} /> Xe limousine cao cấp
                    </span>
                    <span>
                      <Clock3 size={13} /> Thời gian ~ 3.5 - 4 giờ
                    </span>
                  </div>
                </div>
                <ChevronRight size={19} className="co-route-arrow" />
              </div>
            </section>

            {/* 5. Fixed Bottom Navigation Bar */}
            <nav className="co-bottom-nav" aria-label="Điều hướng ứng dụng">
              <button className="active" onClick={() => go("home")}>
                <div className="co-nav-icon-circle">
                  <Home size={19} />
                </div>
                <span>Trang chủ</span>
                <span className="co-nav-active-bar" />
              </button>
              <button onClick={() => go("ticket")}>
                <Ticket size={21} />
                <span>Vé của tôi</span>
              </button>
              <a href="tel:0983227788">
                <Headphones size={21} />
                <span>Hỗ trợ</span>
              </a>
              <button
                onClick={() =>
                  setNotice("Tài khoản thành viên Cửa Ông Limousine.")
                }
              >
                <User size={21} />
                <span>Tài khoản</span>
              </button>
            </nav>
          </div>
        )}

        {/* =========================================================================
            SCREEN 2: CHỌN CHUYẾN (Exact match Image 2)
            ========================================================================= */}
        {screen === "trips" && (
          <div className="co-trips-screen">
            {/* Header */}
            <header className="co-step-header">
              <button
                aria-label="Quay lại"
                onClick={back}
                className="co-back-circle-btn"
              >
                <ArrowLeft size={19} />
              </button>
              <div className="co-step-title-wrap">
                <h1>Chọn chuyến</h1>
                <p>
                  {from} → {to}
                </p>
                <small>
                  {formatVietnamDate(date)} · {count} hành khách
                </small>
              </div>
              <div className="co-step-right-van">
                <img
                  src="/assets/operator-app/cua-ong-coach-engraving.webp"
                  alt=""
                />
              </div>
            </header>

            {/* Horizontal Date Strip */}
            <div className="co-date-strip">
              {getDayStrip(date).map((item) => {
                const isActive = item.iso === date;
                return (
                  <button
                    key={item.iso}
                    className={"co-date-pill " + (isActive ? "active" : "")}
                    onClick={() => setDate(item.iso)}
                  >
                    <span className="co-date-dayname">{item.label}</span>
                    <strong className="co-date-val">{item.dateStr}</strong>
                  </button>
                );
              })}
            </div>

            {/* Filter Pills */}
            <div className="co-filter-chips-row">
              <div className="co-filter-chip">
                <Clock size={14} />
                <span>Giờ đi</span>
                <ChevronDown size={14} />
              </div>
              <div className="co-filter-chip">
                <Tag size={14} />
                <span>Giá vé</span>
                <ChevronDown size={14} />
              </div>
              <div className="co-filter-chip">
                <Armchair size={14} />
                <span>Ghế trống</span>
                <ChevronDown size={14} />
              </div>
            </div>

            {/* Trip Cards List */}
            <div className="co-trips-list">
              {tripList.map((t, idx) => (
                <article key={idx} className="co-card co-trip-card">
                  {/* Vehicle Meta */}
                  <div className="co-trip-meta-head">
                    <img
                      src={vehicle}
                      alt={t.type}
                      className="co-trip-vehicle-img"
                    />
                    <div className="co-trip-meta-info">
                      <h2>{t.type}</h2>
                      <div className="co-trip-amenities">
                        <span>
                          <Wifi size={13} /> WiFi
                        </span>
                        <span>• USB</span>
                        <span>• Điều hòa</span>
                      </div>
                    </div>
                  </div>

                  {/* Timeline */}
                  <div className="co-trip-timeline">
                    <div className="co-timeline-point">
                      <strong>{t.timeStart}</strong>
                      <small>{from}</small>
                    </div>
                    <div className="co-timeline-track">
                      <div className="co-timeline-line" />
                      <span className="co-timeline-duration">{t.duration}</span>
                      <div className="co-timeline-pin" />
                    </div>
                    <div className="co-timeline-point right">
                      <strong>{t.timeEnd}</strong>
                      <small>{to}</small>
                    </div>
                  </div>

                  {/* Price & Seats Badge */}
                  <div className="co-trip-footer-row">
                    <div className="co-trip-price-wrap">
                      <strong className="co-trip-price-val">
                        {money(t.price)}
                      </strong>
                      <span className="co-trip-price-unit"> / khách</span>
                    </div>
                    <div className="co-trip-seats-badge">
                      <Armchair size={14} />
                      <span>Còn {t.seatsLeft} ghế</span>
                    </div>
                  </div>

                  {/* Choose Trip CTA */}
                  <button
                    className="co-primary co-choose-trip-btn"
                    onClick={() => {
                      setTime(t.timeStart);
                      go("seats");
                    }}
                  >
                    <span>Chọn chuyến</span>
                    <ArrowRight size={17} />
                  </button>
                </article>
              ))}
            </div>

            {/* Bottom Note */}
            <p className="co-legal-notice">
              ⓘ Giá vé minh họa. Vui lòng kiểm tra thông tin chi tiết trước khi đặt vé.
            </p>
          </div>
        )}

        {/* =========================================================================
            SCREEN 3: CHỌN CHỖ NGỒI (Exact match Image 3)
            ========================================================================= */}
        {screen === "seats" && (
          <div className="co-seats-screen">
            {/* Header */}
            <header className="co-step-header">
              <button
                aria-label="Quay lại"
                onClick={back}
                className="co-back-circle-btn"
              >
                <ArrowLeft size={19} />
              </button>
              <div className="co-step-title-wrap">
                <h1>Chọn chỗ ngồi</h1>
                <p>CỬA ÔNG LIMOUSINE</p>
              </div>
              <div className="co-step-right-van">
                <img
                  src="/assets/operator-app/cua-ong-coach-engraving.webp"
                  alt=""
                />
              </div>
            </header>

            {/* Trip Summary Pill */}
            <div className="co-route-pill-summary">
              <span className="co-summary-item">
                <MapPin size={13} className="co-icon-gold" /> {from} →{" "}
                <MapPin size={13} className="co-icon-gold" /> {to}
              </span>
              <span className="co-summary-div">|</span>
              <span className="co-summary-item">
                <CalendarDays size={13} /> {time} • {formatVietnamDate(date)}
              </span>
              <span className="co-summary-div">|</span>
              <span className="co-summary-item">
                <Bus size={13} /> Limousine 9 chỗ
              </span>
            </div>

            {/* Title */}
            <div className="co-seats-guide">
              <h2>Chọn ghế yêu thích</h2>
              <p>Vui lòng chọn {count} ghế ngồi phù hợp với bạn</p>
            </div>

            {/* Van Interior Chassis Plan */}
            <div className="co-van-container">
              {/* Van Body Shell */}
              <div className="co-van-frame">
                {/* Windshield & Mirrors */}
                <div className="co-van-windshield" />
                <div className="co-mirror left" />
                <div className="co-mirror right" />

                {/* Driver Row */}
                <div className="co-van-row front">
                  <div className="co-van-seat driver">
                    <span>Tài xế</span>
                  </div>
                  <div className="co-dash-space" />
                </div>

                {/* Center aisle walkway */}
                <div className="co-van-aisle" />

                {/* Row 1: A1, A2 */}
                <div className="co-van-row">
                  <button
                    type="button"
                    className={
                      "co-van-seat armchair " +
                      (selected.includes("A1") ? "selected" : "")
                    }
                    onClick={() => toggleSeat("A1")}
                  >
                    <span>A1</span>
                  </button>
                  <button
                    type="button"
                    className="co-van-seat armchair booked"
                    disabled
                  >
                    <span>A2</span>
                  </button>
                </div>

                {/* Row 2: B1, B2 */}
                <div className="co-van-row">
                  <button
                    type="button"
                    className={
                      "co-van-seat armchair " +
                      (selected.includes("B1") ? "selected" : "")
                    }
                    onClick={() => toggleSeat("B1")}
                  >
                    <span>B1</span>
                  </button>
                  <button
                    type="button"
                    className={
                      "co-van-seat armchair " +
                      (selected.includes("B2") ? "selected" : "")
                    }
                    onClick={() => toggleSeat("B2")}
                  >
                    <span>B2</span>
                  </button>
                </div>

                {/* Row 3: C1, C2 */}
                <div className="co-van-row">
                  <button
                    type="button"
                    className={
                      "co-van-seat armchair " +
                      (selected.includes("C1") ? "selected" : "")
                    }
                    onClick={() => toggleSeat("C1")}
                  >
                    <span>C1</span>
                  </button>
                  <button
                    type="button"
                    className="co-van-seat armchair booked"
                    disabled
                  >
                    <span>C2</span>
                  </button>
                </div>

                {/* Row 4: D1, D2, D3 (Back bench) */}
                <div className="co-van-row back-bench">
                  <button
                    type="button"
                    className={
                      "co-van-seat bench " +
                      (selected.includes("D1") ? "selected" : "")
                    }
                    onClick={() => toggleSeat("D1")}
                  >
                    <span>D1</span>
                  </button>
                  <button
                    type="button"
                    className={
                      "co-van-seat bench " +
                      (selected.includes("D2") ? "selected" : "")
                    }
                    onClick={() => toggleSeat("D2")}
                  >
                    <span>D2</span>
                  </button>
                  <button
                    type="button"
                    className={
                      "co-van-seat bench " +
                      (selected.includes("D3") ? "selected" : "")
                    }
                    onClick={() => toggleSeat("D3")}
                  >
                    <span>D3</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Legend Card */}
            <div className="co-card co-seat-legend">
              <div className="co-legend-item">
                <span className="co-legend-box available" />
                <span>Trống</span>
              </div>
              <div className="co-legend-item">
                <span className="co-legend-box booked" />
                <span>Đã đặt</span>
              </div>
              <div className="co-legend-item">
                <span className="co-legend-box selected" />
                <span>Đang chọn</span>
              </div>
            </div>

            {/* Selected Seat Card */}
            <div className="co-card co-selected-seat-card">
              <div className="co-selected-info">
                <strong>
                  {selected.length ? `Ghế ${selected.join(", ")}` : "Chưa chọn ghế"}
                </strong>
                <small>Giá vé</small>
                <span className="co-selected-price">{money(total)}</span>
              </div>
              <div className="co-selected-seat-graphic">
                <Armchair size={36} className="co-icon-gold" />
              </div>
            </div>

            {/* Fixed Bottom Action Bar */}
            <div className="co-fixed-bottom-bar">
              <div className="co-bar-total-text">
                <strong>
                  {selected.length || 1} ghế • {money(total)}
                </strong>
              </div>
              <button
                type="button"
                className="co-primary co-bar-next-btn"
                onClick={() => go("passenger")}
              >
                <span>Tiếp tục</span>
                <ArrowRight size={17} />
              </button>
            </div>
          </div>
        )}

        {/* =========================================================================
            SCREEN 4: ĐIỂM ĐÓN & TRẢ (Exact match Image 4)
            ========================================================================= */}
        {screen === "passenger" && (
          <form
            className="co-passenger-screen"
            onSubmit={(e) => {
              e.preventDefault();
              if (!name.trim()) return setNotice("Vui lòng nhập họ và tên.");
              if (!phone.trim()) return setNotice("Vui lòng nhập số điện thoại.");
              go("payment");
            }}
          >
            {/* Header */}
            <header className="co-step-header">
              <button
                type="button"
                aria-label="Quay lại"
                onClick={back}
                className="co-back-circle-btn"
              >
                <ArrowLeft size={19} />
              </button>
              <div className="co-step-title-wrap">
                <h1>Điểm đón & trả</h1>
                <p>CỬA ÔNG LIMOUSINE</p>
              </div>
              <div className="co-step-right-van">
                <img
                  src="/assets/operator-app/cua-ong-coach-engraving.webp"
                  alt=""
                />
              </div>
            </header>

            {/* Section 1: Điểm đón */}
            <section className="co-card co-point-section">
              <div className="co-point-title-row">
                <div className="co-point-icon-box">
                  <MapPin size={18} className="co-icon-gold" />
                </div>
                <div>
                  <h2>Điểm đón</h2>
                  <small>Chọn địa điểm đón khách</small>
                </div>
              </div>

              <div className="co-radio-options">
                <label
                  className={
                    "co-radio-card " +
                    (pickup === "Văn phòng Hà Nội" ? "active" : "")
                  }
                >
                  <input
                    type="radio"
                    name="pickup"
                    checked={pickup === "Văn phòng Hà Nội"}
                    onChange={() => setPickup("Văn phòng Hà Nội")}
                  />
                  <div className="co-radio-content">
                    <strong>Văn phòng Hà Nội</strong>
                    <small>Địa chỉ sẽ được nhà xe xác nhận</small>
                  </div>
                  <Building2 size={20} className="co-radio-side-icon" />
                  <ChevronRight size={16} className="co-field-chevron" />
                </label>

                <label
                  className={
                    "co-radio-card " +
                    (pickup === "Bến xe Mỹ Đình" ? "active" : "")
                  }
                >
                  <input
                    type="radio"
                    name="pickup"
                    checked={pickup === "Bến xe Mỹ Đình"}
                    onChange={() => setPickup("Bến xe Mỹ Đình")}
                  />
                  <div className="co-radio-content">
                    <strong>Bến xe Mỹ Đình</strong>
                    <small>Địa chỉ sẽ được nhà xe xác nhận</small>
                  </div>
                  <Bus size={20} className="co-radio-side-icon" />
                  <ChevronRight size={16} className="co-field-chevron" />
                </label>
              </div>
            </section>

            {/* Section 2: Điểm trả */}
            <section className="co-card co-point-section">
              <div className="co-point-title-row">
                <div className="co-point-icon-box">
                  <MapPin size={18} className="co-icon-gold" />
                </div>
                <div>
                  <h2>Điểm trả</h2>
                  <small>Chọn địa điểm trả khách</small>
                </div>
              </div>

              <div className="co-radio-options">
                <label className="co-radio-card active">
                  <input
                    type="radio"
                    name="dropoff"
                    checked
                    readOnly
                  />
                  <div className="co-radio-content">
                    <strong>Văn phòng Cửa Ông</strong>
                    <small>Địa chỉ sẽ được nhà xe xác nhận</small>
                  </div>
                  <Building2 size={20} className="co-radio-side-icon" />
                  <ChevronRight size={16} className="co-field-chevron" />
                </label>
              </div>

              {/* Stylized Route Map Preview */}
              <div className="co-map-route-preview">
                <MapPin size={22} className="co-icon-gold pin-start" />
                <div className="co-map-dashed-route">
                  <Bus size={18} className="co-map-moving-bus" />
                </div>
                <MapPin size={22} className="co-icon-brown pin-end" />
              </div>
            </section>

            {/* Section 3: Thông tin hành khách */}
            <section className="co-card co-passenger-form-section">
              <div className="co-point-title-row">
                <div className="co-point-icon-box">
                  <User size={18} className="co-icon-gold" />
                </div>
                <div>
                  <h2>Thông tin hành khách</h2>
                  <small>Vui lòng nhập thông tin để đặt vé</small>
                </div>
              </div>

              <div className="co-inputs-stack">
                <div className="co-input-pill">
                  <User size={18} className="co-input-icon" />
                  <input
                    type="text"
                    required
                    placeholder="Họ và tên"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                <div className="co-input-pill">
                  <Phone size={18} className="co-input-icon" />
                  <input
                    type="tel"
                    required
                    placeholder="Số điện thoại"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>

                <div className="co-input-pill">
                  <Mail size={18} className="co-input-icon" />
                  <input
                    type="email"
                    placeholder="Email (không bắt buộc)"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>
            </section>

            {/* Full-width Continue CTA */}
            <div className="co-cta-wrap">
              <button type="submit" className="co-primary co-screen-cta">
                <span>Tiếp tục</span>
                <ArrowRight size={18} />
              </button>
            </div>
          </form>
        )}

        {/* =========================================================================
            SCREEN 5: XÁC NHẬN & THANH TOÁN (Exact match Image 5)
            ========================================================================= */}
        {screen === "payment" && (
          <div className="co-payment-screen">
            {/* Header with Countdown Pill */}
            <header className="co-step-header">
              <button
                aria-label="Quay lại"
                onClick={back}
                className="co-back-circle-btn"
              >
                <ArrowLeft size={19} />
              </button>
              <div className="co-step-title-wrap">
                <h1>Xác nhận & thanh toán</h1>
              </div>
              <div className="co-countdown-pill">
                <Clock size={14} />
                <span>Giữ chỗ {formatCountdown(secondsLeft)}</span>
              </div>
            </header>

            {/* Trip Info Card */}
            <div className="co-card co-payment-trip-card">
              <div className="co-pay-route-row">
                <strong>
                  {from} → {to}
                </strong>
                <div className="co-pay-seat-badge">
                  <Armchair size={13} />
                  <span>Ghế {selected.join(", ") || "B1"}</span>
                </div>
              </div>

              <div className="co-pay-time-row">
                <CalendarDays size={14} className="co-icon-gold" />
                <span>
                  {time} • {formatVietnamDate(date)}
                </span>
              </div>

              <hr className="co-divider" />

              <div className="co-pay-stops">
                <div className="co-pay-stop-item">
                  <div className="co-stop-dot gold" />
                  <div>
                    <small>Đón khách</small>
                    <p>{pickup}</p>
                  </div>
                </div>

                <div className="co-stop-connector" />

                <div className="co-pay-stop-item">
                  <div className="co-stop-dot brown" />
                  <div>
                    <small>Trả khách</small>
                    <p>{dropoff}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Methods */}
            <section className="co-card co-pay-methods-section">
              <h2>Phương thức thanh toán</h2>

              <label
                className={
                  "co-pay-method-row " + (method === "qr" ? "active" : "")
                }
              >
                <div className="co-method-icon-box">
                  <Building2 size={20} className="co-icon-gold" />
                </div>
                <div className="co-method-info">
                  <strong>QR ngân hàng</strong>
                  <small>Thanh toán qua ứng dụng ngân hàng bằng mã QR</small>
                </div>
                <input
                  type="radio"
                  name="method"
                  checked={method === "qr"}
                  onChange={() => setMethod("qr")}
                  className="co-method-radio"
                />
              </label>

              <label
                className={
                  "co-pay-method-row " + (method === "wallet" ? "active" : "")
                }
              >
                <div className="co-method-icon-box">
                  <Wallet size={20} className="co-icon-gold" />
                </div>
                <div className="co-method-info">
                  <strong>Ví điện tử</strong>
                  <small>Thanh toán qua MoMo, ZaloPay, Viettel Money...</small>
                </div>
                <input
                  type="radio"
                  name="method"
                  checked={method === "wallet"}
                  onChange={() => setMethod("wallet")}
                  className="co-method-radio"
                />
              </label>
            </section>

            {/* Promo Voucher Input */}
            <section className="co-card co-promo-card">
              <h2>Mã ưu đãi</h2>
              <div className="co-promo-input-row">
                <div className="co-promo-input-wrap">
                  <Tag size={17} className="co-promo-icon" />
                  <input
                    type="text"
                    placeholder="Nhập mã ưu đãi"
                    value={coupon}
                    onChange={(e) => setCoupon(e.target.value)}
                  />
                </div>
                <button
                  type="button"
                  className="co-promo-apply-btn"
                  onClick={() => {
                    if (coupon.trim()) {
                      setNotice(`Đã áp dụng mã "${coupon}" thành công!`);
                    }
                  }}
                >
                  Áp dụng
                </button>
              </div>
            </section>

            {/* Fee Breakdown Card */}
            <div className="co-card co-bill-card">
              <div className="co-bill-row">
                <span>Giá vé ({selected.length || 1} ghế)</span>
                <strong>{money(total)}</strong>
              </div>
              <div className="co-bill-row">
                <span>Phí dịch vụ</span>
                <strong>0đ</strong>
              </div>
              <hr className="co-divider" />
              <div className="co-bill-row total">
                <span>Tổng thanh toán</span>
                <strong className="co-bill-total-price">{money(total)}</strong>
              </div>
            </div>

            {/* Consent Terms Checkbox */}
            <label className="co-consent-check-row">
              <input
                type="checkbox"
                checked={agree}
                onChange={(e) => setAgree(e.target.checked)}
              />
              <span>
                Tôi đã đọc và đồng ý với{" "}
                <a href="#terms" onClick={(e) => e.preventDefault()}>
                  Điều khoản sử dụng
                </a>{" "}
                và{" "}
                <a href="#privacy" onClick={(e) => e.preventDefault()}>
                  Chính sách bảo mật
                </a>
              </span>
            </label>

            {/* Pay CTA Button */}
            <div className="co-cta-wrap">
              <button
                type="button"
                className="co-primary co-screen-cta"
                onClick={pay}
              >
                <span>Thanh toán {money(total)}</span>
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
        )}

        {/* =========================================================================
            SCREEN 6: VÉ ĐIỆN TỬ DEMO
            ========================================================================= */}
        {screen === "ticket" && (
          <div className="co-ticket-screen">
            <header className="co-step-header">
              <button
                aria-label="Quay lại"
                onClick={() => go("home")}
                className="co-back-circle-btn"
              >
                <ArrowLeft size={19} />
              </button>
              <div className="co-step-title-wrap">
                <h1>Vé điện tử</h1>
                <p>CỬA ÔNG LIMOUSINE</p>
              </div>
              <button
                aria-label="Đóng vé"
                onClick={() => go("home")}
                className="co-back-circle-btn"
              >
                <X size={18} />
              </button>
            </header>

            <div className="co-card co-ticket-body">
              <div className="co-ticket-head">
                <CheckCircle2 size={36} className="co-icon-gold" />
                <h2>Đặt vé thành công</h2>
                <p>Mã vé: {pass?.code || "CO998822"}</p>
              </div>

              <div className="co-qr-wrap">
                <QRCodeSVG
                  value={JSON.stringify({ code: pass?.code || "CO998822" })}
                  size={150}
                  fgColor="#3f260d"
                />
                <small>Quét mã QR khi lên xe</small>
              </div>

              <div className="co-ticket-details">
                <div className="co-ticket-row">
                  <span>Hành trình</span>
                  <strong>
                    {pass?.from || from} → {pass?.to || to}
                  </strong>
                </div>
                <div className="co-ticket-row">
                  <span>Ngày khởi hành</span>
                  <strong>{formatVietnamDate(pass?.date || date)}</strong>
                </div>
                <div className="co-ticket-row">
                  <span>Giờ xuất bến</span>
                  <strong>{pass?.time || time}</strong>
                </div>
                <div className="co-ticket-row">
                  <span>Ghế ngồi</span>
                  <strong>{pass?.seats?.join(", ") || selected.join(", ")}</strong>
                </div>
                <div className="co-ticket-row">
                  <span>Hành khách</span>
                  <strong>{pass?.name || name}</strong>
                </div>
                <div className="co-ticket-row">
                  <span>Điểm đón</span>
                  <strong>{pass?.pickup || pickup}</strong>
                </div>
                <div className="co-ticket-row total">
                  <span>Tổng tiền</span>
                  <strong className="co-gold-text">
                    {money(pass?.total || total)}
                  </strong>
                </div>
              </div>

              <div className="co-ticket-actions">
                <button
                  type="button"
                  className="co-primary"
                  onClick={() => window.print()}
                >
                  <Download size={18} /> Lưu vé điện tử
                </button>
                <button
                  type="button"
                  className="co-secondary"
                  onClick={() => go("home")}
                >
                  Quay lại trang chủ
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Global Floating Toast Notice */}
        {notice && (
          <div className="co-notice-toast" role="alert">
            <span>{notice}</span>
            <button onClick={() => setNotice("")}>
              <X size={16} />
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
