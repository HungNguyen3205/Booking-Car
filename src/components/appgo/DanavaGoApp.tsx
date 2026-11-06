import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  MapPin,
  Calendar,
  ArrowUpDown,
  ArrowRight,
  Search,
  Bus,
  ChevronRight,
  Bell,
  Home,
  Ticket,
  Gift,
  User,
  Clock,
  Armchair,
  FileText,
  Headphones,
  AlertCircle,
  RotateCcw,
  X,
  QrCode,
  Phone,
  Mail,
  CheckCircle2,
  ChevronLeft,
  CreditCard,
  Wallet,
  Building2,
  Banknote,
  Tag,
  ShieldCheck,
  Compass,
  Pencil,
  SlidersHorizontal,
  Wifi,
  Coffee,
  Star,
  ChevronDown,
  BedDouble,
  Share2,
  Download,
  DollarSign,
  Map,
} from "lucide-react";
import "./danava-go-app.css";
import { BusSeatDeck } from "../seats/BusSeatDeck";
import { AccountCreatedModal, AccountPanel, NotificationsSheet } from "./CustomerAccount";
import { useCustomerSession } from "./useCustomerSession";
import { aisleColumns, surchargeBadge } from "../seats/busSeatDeckUtils";
import type { Booking, Seat, Trip, VehicleCategory } from "../../types";
import {
  api,
  holdSeats,
  lookupRemoteBooking,
  releaseHold,
  reserveBooking,
  searchMarketplace,
} from "../../services/platformApi";
import {
  addDaysToDateStr,
  formatVietnamDate,
  getVietnamTodayDateStr,
  isValidBookingDate,
} from "../../utils/dateUtils";
import { normalizeVietnamPhone } from "../../utils/phoneUtils";
import {
  FALLBACK_CITIES,
  MAX_SEATS,
  arrivalDate,
  dayMonth,
  findStop,
  money,
  paymentLabel,
  randomKey,
  readSavedTickets,
  saveTicket,
  seatTotal,
  shortWeekday,
  ticketBucket,
  weekday,
  type TicketFilter,
} from "./appgoData";

type FlowStep = "main" | "trips" | "seats" | "payment" | "eticket";
type Tab = "home" | "tickets" | "promos" | "account";
const seatLabel = (trip: Trip) => (trip.vehicle.category === "cabin" ? "Cabin" : "Chỗ");
const PHONE_RE = /^0[35789]\d{8}$/; // same rule as OperatorService::phone()
// Sits over a date field so a tap opens the native date picker.
const DATE_PICKER_OVERLAY: React.CSSProperties = { position: "absolute", inset: 0, opacity: 0, cursor: "pointer", width: "100%", height: "100%" };

export const DanavaGoApp: React.FC = () => {
  const today = getVietnamTodayDateStr();
  const tomorrow = addDaysToDateStr(today, 1);

  const [activeTab, setActiveTab] = useState<Tab>(() => {
    const tabParam = new URL(window.location.href).searchParams.get("tab");
    return tabParam === "tickets" || tabParam === "promos" || tabParam === "account" ? tabParam : "home";
  });
  const [flowStep, setFlowStep] = useState<FlowStep>("main");

  // Search parameters. Dates are YYYY-MM-DD in Asia/Ho_Chi_Minh, as the API expects.
  const [tripType, setTripType] = useState<"one-way" | "round-trip">("one-way");
  const [origin, setOrigin] = useState("Đà Nẵng");
  const [destination, setDestination] = useState("Đà Lạt");
  const [travelDate, setTravelDate] = useState(today);
  const [returnDate, setReturnDate] = useState(() => addDaysToDateStr(today, 3));
  const [cities, setCities] = useState<string[]>(FALLBACK_CITIES);

  // Search results
  const [trips, setTrips] = useState<Trip[]>([]);
  const [searching, setSearching] = useState(false);
  const [tripSort, setTripSort] = useState<"suggested" | "time" | "price">("suggested");
  const [categoryFilter, setCategoryFilter] = useState<VehicleCategory | "">("");

  // Booking in progress
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [selectedFloor, setSelectedFloor] = useState<1 | 2>(1);
  const [pickupId, setPickupId] = useState("");
  const [dropoffId, setDropoffId] = useState("");
  const [hold, setHold] = useState<{ id: string; expires: number } | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [promoCode, setPromoCode] = useState("");
  // Same two methods as the Studio counter sale; the operator confirms receipt.
  const [payMethod, setPayMethod] = useState<"cash" | "bank_transfer">("cash");
  // Customer account (login = phone) created at checkout; shown before the e-ticket.
  const session = useCustomerSession();
  const [accountNotice, setAccountNotice] = useState<Booking["account"] | null>(null);
  const [notesOpen, setNotesOpen] = useState(false);
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  // Tickets ("Vé của tôi" = bookings remembered on this device, refreshed from the API)
  const [booking, setBooking] = useState<Booking | null>(null);
  const [justBooked, setJustBooked] = useState(false);
  const [myTickets, setMyTickets] = useState<Booking[]>([]);
  const [ticketsLoaded, setTicketsLoaded] = useState(false);
  const [ticketFilter, setTicketFilter] = useState<TicketFilter>("upcoming");
  const [lookupCode, setLookupCode] = useState("");
  const [lookupPhone, setLookupPhone] = useState("");

  // Modals
  const [cityPickerTarget, setCityPickerTarget] = useState<"origin" | "dest" | null>(null);
  const [pickupModal, setPickupModal] = useState<"select" | "view" | null>(null);
  const [supportModalOpen, setSupportModalOpen] = useState(false);
  const [policyModalOpen, setPolicyModalOpen] = useState(false);

  const inFlight = useRef(false);
  const bookingKey = useRef("");
  const holdRef = useRef<string | null>(null);
  const searchAbort = useRef<AbortController | null>(null);

  // City list = cities that have published trips. Keep the fallback if empty/offline.
  useEffect(() => {
    const c = new AbortController();
    api<{ items: string[] }>("/public/cities", { signal: c.signal })
      .then((r) => {
        if (r.items.length) setCities(r.items);
      })
      .catch(() => {});
    return () => c.abort();
  }, []);

  // Give held seats back if the app closes mid-booking.
  useEffect(() => {
    holdRef.current = hold?.id ?? null;
  }, [hold]);
  useEffect(
    () => () => {
      if (holdRef.current) releaseHold(holdRef.current).catch(() => {});
      searchAbort.current?.abort();
    },
    [],
  );

  // Hold countdown.
  useEffect(() => {
    if (!hold) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [hold]);

  // Short toast instead of the prototype's alert() pop-ups.
  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(""), 2800);
    return () => clearTimeout(t);
  }, [notice]);

  // First visit to "Vé của tôi": refresh every ticket remembered on this device.
  useEffect(() => {
    if (activeTab !== "tickets" || ticketsLoaded) return;
    let live = true;
    Promise.allSettled(readSavedTickets().map((t) => lookupRemoteBooking(t.code, t.phone))).then((results) => {
      if (!live) return;
      const fetched = results.flatMap((r) => (r.status === "fulfilled" ? [r.value] : []));
      // Keep anything booked meanwhile; the fresh server copy wins.
      setMyTickets((list) => [...fetched, ...list.filter((b) => !fetched.some((f) => f.id === b.id))]);
      setTicketsLoaded(true);
    });
    return () => {
      live = false;
    };
  }, [activeTab, ticketsLoaded]);

  const dropHold = useCallback(() => {
    if (holdRef.current) releaseHold(holdRef.current).catch(() => {});
    holdRef.current = null;
    setHold(null);
  }, []);

  // Screen change. Anything other than the payment step gives held seats back.
  const goTo = (step: FlowStep) => {
    if (step !== "payment") dropHold();
    setError("");
    setFlowStep(step);
    window.scrollTo({ top: 0 });
  };

  // One request at a time; errors go to the banner.
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

  const handleSwapCities = () => {
    setOrigin(destination);
    setDestination(origin);
  };

  const handleTabChange = (tab: Tab) => {
    dropHold();
    setError("");
    setActiveTab(tab);
    setFlowStep("main");
    const url = new URL(window.location.href);
    if (tab === "home") url.searchParams.delete("tab");
    else url.searchParams.set("tab", tab);
    window.history.replaceState(window.history.state, "", url.pathname + url.search);
  };

  const runSearch = (date = travelDate, from = origin, to = destination) => {
    if (from === to) return setError("Điểm đi và điểm đến phải khác nhau.");
    if (!isValidBookingDate(date)) return setError("Ngày đi không hợp lệ hoặc đã qua.");
    searchAbort.current?.abort();
    const c = new AbortController();
    searchAbort.current = c;
    setTravelDate(date);
    goTo("trips");
    setTrips([]);
    setSearching(true);
    searchMarketplace({ from, to, date, passengers: 1 }, c.signal)
      .then((r) => {
        if (!c.signal.aborted) setTrips(r.items);
      })
      .catch((e) => {
        if (!c.signal.aborted) setError((e as Error).message);
      })
      .finally(() => {
        if (!c.signal.aborted) setSearching(false);
      });
  };

  const visibleTrips = useMemo(() => {
    const list = categoryFilter ? trips.filter((t) => t.vehicle.category === categoryFilter) : [...trips];
    if (tripSort === "time") list.sort((a, b) => a.departureTime.localeCompare(b.departureTime));
    if (tripSort === "price") list.sort((a, b) => a.price - b.price);
    return list;
  }, [trips, categoryFilter, tripSort]);
  const tripCategories = useMemo(() => [...new Set(trips.map((t) => t.vehicle.category))], [trips]);
  const minPrice = trips.length ? Math.min(...trips.map((t) => t.price)) : null;
  const dateStrip = useMemo(() => {
    const start = addDaysToDateStr(travelDate, -1) < today ? today : addDaysToDateStr(travelDate, -1);
    return [0, 1, 2].map((d) => addDaysToDateStr(start, d));
  }, [travelDate, today]);

  const chooseTrip = (trip: Trip) => {
    setSelectedTrip(trip);
    setSelectedSeats([]);
    setSelectedFloor(1);
    setPickupId(trip.departureStops[0]?.id ?? "");
    setDropoffId(trip.dropoffStops[trip.dropoffStops.length - 1]?.id ?? "");
    goTo("seats");
  };

  const toggleSeat = (seat: Seat) => {
    if (seat.status !== "available") return;
    if (!selectedSeats.includes(seat.code) && selectedSeats.length >= MAX_SEATS) {
      setNotice(`Tối đa ${MAX_SEATS} chỗ cho mỗi lần đặt`);
      return;
    }
    setSelectedSeats((old) => (old.includes(seat.code) ? old.filter((c) => c !== seat.code) : [...old, seat.code]));
  };

  const proceedToPayment = () =>
    run(async () => {
      if (!selectedTrip || !selectedSeats.length) throw Error("Vui lòng chọn ít nhất 1 chỗ.");
      if (!pickupId || !dropoffId) throw Error("Vui lòng chọn điểm đón và điểm trả.");
      const h = await holdSeats(selectedTrip.id, selectedSeats);
      bookingKey.current = randomKey();
      holdRef.current = h.id;
      setHold(h);
      setNow(Date.now());
      setFlowStep("payment");
      window.scrollTo({ top: 0 });
    });

  const holdRemaining = hold ? Math.max(0, hold.expires - now) : 0;
  const holdClock = `${String(Math.floor(holdRemaining / 60000)).padStart(2, "0")}:${String(Math.floor(holdRemaining / 1000) % 60).padStart(2, "0")}`;

  const confirmBooking = () =>
    run(async () => {
      if (!selectedTrip || !hold) throw Error("Lượt giữ chỗ không còn hiệu lực. Vui lòng chọn lại chỗ.");
      if (hold.expires <= Date.now()) throw Error("Đã hết thời gian giữ chỗ. Vui lòng chọn lại chỗ.");
      const phone = normalizeVietnamPhone(customerPhone);
      if (!customerName.trim()) throw Error("Vui lòng nhập họ và tên.");
      if (!PHONE_RE.test(phone)) throw Error("Số điện thoại không hợp lệ (10 số, bắt đầu bằng 03, 05, 07, 08 hoặc 09).");
      if (!termsAgreed) throw Error("Vui lòng đồng ý Điều kiện vận chuyển và Chính sách hoàn tiền.");
      const b = await reserveBooking(
        selectedTrip,
        selectedSeats,
        { fullName: customerName.trim(), phone, email: customerEmail.trim(), pickupStopId: pickupId, dropoffStopId: dropoffId, note: "", agreedTerms: true },
        hold.id,
        bookingKey.current,
        promoCode.trim().toUpperCase() || undefined,
        payMethod,
      );
      holdRef.current = null; // the booking consumed the hold
      setHold(null);
      saveTicket(b.id, phone);
      setMyTickets((list) => [b, ...list.filter((t) => t.id !== b.id)]);
      setBooking(b);
      setJustBooked(true);
      setAccountNotice(b.account ?? null);
      void session.refresh();
      setFlowStep("eticket");
      window.scrollTo({ top: 0 });
    });

  const openTicket = (b: Booking) => {
    setBooking(b);
    setJustBooked(false);
    goTo("eticket");
  };

  const lookupTicket = () =>
    run(async () => {
      const phone = normalizeVietnamPhone(lookupPhone);
      const code = lookupCode.trim().toUpperCase();
      if (!code || !PHONE_RE.test(phone)) throw Error("Nhập mã vé và số điện thoại đã dùng khi đặt vé.");
      const b = await lookupRemoteBooking(code, phone);
      saveTicket(b.id, phone);
      setMyTickets((list) => [b, ...list.filter((t) => t.id !== b.id)]);
      setLookupCode("");
      setLookupPhone("");
      openTicket(b);
    });

  const rebook = (b: Booking) => {
    setOrigin(b.trip.from);
    setDestination(b.trip.to);
    runSearch(today, b.trip.from, b.trip.to);
  };

  // Round trip = two bookings: after the outbound ticket, search the way back.
  const bookReturn = () => {
    if (!booking) return;
    const back = returnDate > booking.date ? returnDate : addDaysToDateStr(booking.date, 1);
    setTripType("one-way");
    setOrigin(booking.trip.to);
    setDestination(booking.trip.from);
    runSearch(back, booking.trip.to, booking.trip.from);
  };

  const shareTicket = async (b: Booking) => {
    const text = `Vé DANAVA Go ${b.id}: ${b.trip.from} → ${b.trip.to}, ${b.trip.departureTime} ${formatVietnamDate(b.date)}, chỗ ${b.selectedSeats.join(", ")}`;
    try {
      await navigator.clipboard.writeText(text);
      setNotice("Đã sao chép mã vé và thông tin chuyến đi");
    } catch {
      setNotice(`Mã vé: ${b.id}`);
    }
  };

  const ticketCounts = useMemo(() => {
    const c: Record<TicketFilter, number> = { upcoming: 0, completed: 0, cancelled: 0 };
    for (const b of myTickets) c[ticketBucket(b, today)]++;
    return c;
  }, [myTickets, today]);
  const filteredTickets = myTickets.filter((b) => ticketBucket(b, today) === ticketFilter);
  // Grid from the Studio seat map; older trips fall back to the seats' own extent.
  const deck = useMemo(() => {
    const seats = selectedTrip?.seats ?? [];
    const cols = selectedTrip?.seatGrid?.cols ?? Math.max(1, ...seats.map((x) => x.col));
    const rows = Math.max(1, ...seats.filter((x) => x.floor === selectedFloor).map((x) => x.row));
    return { cols, rows, aisle: aisleColumns(cols, seats) };
  }, [selectedTrip, selectedFloor]);
  const seatPriceGuide = useMemo(() => {
    const seen = new globalThis.Map<string, { name: string; price: number }>(); // "Map" is the lucide icon here
    for (const x of selectedTrip?.seats ?? []) {
      if (x.status === "disabled") continue;
      const name = x.note || "Chỗ thường";
      const key = `${name}|${x.price}`;
      if (!seen.has(key)) seen.set(key, { name, price: x.price });
    }
    return [...seen.values()].sort((a, b) => a.price - b.price);
  }, [selectedTrip]);
  const hasUpperFloor = !!selectedTrip?.seats.some((s) => s.floor === 2);
  const pickupStop = selectedTrip ? findStop(selectedTrip.departureStops, pickupId) : undefined;
  const dropoffStop = selectedTrip ? findStop(selectedTrip.dropoffStops, dropoffId) : undefined;
  const bookingTotal = selectedTrip ? seatTotal(selectedTrip, selectedSeats) : 0;

  return (
    <div className="go-app-wrapper">
      <div className="go-app-container">
        {(error || notice) && (
          <div
            role={error ? "alert" : "status"}
            style={{ position: "fixed", top: 12, left: "50%", transform: "translateX(-50%)", zIndex: 200, width: "min(92vw, 400px)", padding: "11px 14px", borderRadius: 14, display: "flex", gap: 10, alignItems: "flex-start", fontSize: 13, fontWeight: 600, lineHeight: 1.45, boxShadow: "0 12px 30px -10px rgba(15,23,42,.35)", background: error ? "#fef2f2" : "#0f172a", color: error ? "#991b1b" : "#ffffff", border: error ? "1px solid #fecaca" : "0" }}
          >
            {error ? <AlertCircle size={17} style={{ flexShrink: 0, marginTop: 1 }} /> : <CheckCircle2 size={17} style={{ flexShrink: 0, marginTop: 1 }} />}
            <span style={{ flex: 1 }}>{error || notice}</span>
            <button type="button" aria-label="Đóng" onClick={() => (error ? setError("") : setNotice(""))} style={{ background: "none", border: 0, color: "inherit", cursor: "pointer", padding: 0 }}>
              <X size={16} />
            </button>
          </div>
        )}

        {/* iOS Status Bar for sub-screens */}
        {(activeTab !== "home" || flowStep !== "main") && (
          <div className={`go-status-bar ${activeTab === "tickets" && flowStep === "main" ? "text-white" : "text-dark"}`}>
            <span>9:41</span>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ fontSize: 11 }}>●●●●</span>
              <span style={{ fontSize: 12 }}>📶</span>
              <span style={{ fontSize: 12 }}>🔋</span>
            </div>
          </div>
        )}

        {/* =========================================================================
            SCREEN 1: TRANG CHỦ (HOME)
            ========================================================================= */}
        {activeTab === "home" && flowStep === "main" && (
          <div>
            {/* Redesigned Native Layered Hero Banner */}
            <div className="go-home-hero">
              {/* High-Resolution Scenic Bus Background */}
              <img
                src="/assets/appgo/hero-bg-clean.jpg"
                alt="DANAVA Go"
                className="go-home-hero-bg"
              />
              <div className="go-home-hero-overlay" />

              {/* Status Bar */}
              <div className="go-home-status-bar">
                <span className="go-status-time">9:41</span>
                <div className="go-status-icons">
                  <div className="go-cellular-bars">
                    <span className="bar b1" />
                    <span className="bar b2" />
                    <span className="bar b3" />
                    <span className="bar b4" />
                  </div>
                  <svg className="go-wifi-svg" width="15" height="11" viewBox="0 0 15 11" fill="none">
                    <circle cx="7.5" cy="9.5" r="1" fill="white"/>
                    <path d="M4.67 7.67C5.42 6.92 6.42 6.5 7.5 6.5C8.58 6.5 9.58 6.92 10.33 7.67" stroke="white" strokeWidth="1.2" strokeLinecap="round"/>
                    <path d="M2.55 5.55C3.86 4.24 5.64 3.5 7.5 3.5C9.36 3.5 11.14 4.24 12.45 5.55" stroke="white" strokeWidth="1.2" strokeLinecap="round"/>
                    <path d="M0.5 3.5C2.36 1.64 4.86 0.5 7.5 0.5C10.14 0.5 12.64 1.64 14.5 3.5" stroke="white" strokeWidth="1.2" strokeLinecap="round"/>
                  </svg>
                  <div className="go-battery-pill">
                    <div className="go-battery-level" />
                  </div>
                </div>
              </div>

              {/* Header Top Bar */}
              <div className="go-home-header">
                <div className="go-home-brand">
                  <span className="go-brand-danava">DANAVA</span>
                  <span className="go-brand-go">Go</span>
                </div>
                <div className="go-home-actions">
                  <button
                    type="button"
                    className="go-header-btn-bell"
                    onClick={() => setNotesOpen(true)}
                    aria-label={`Thông báo${session.unread ? `, ${session.unread} chưa đọc` : ""}`}
                  >
                    <Bell size={18} />
                    {session.unread > 0 && <span className="go-bell-dot" />}
                  </button>
                  <button
                    type="button"
                    className="go-header-avatar-btn"
                    onClick={() => handleTabChange("account")}
                    aria-label="Tài khoản"
                  >
                    <img
                      src="/assets/appgo/user-avatar.jpg"
                      alt="User avatar"
                      className="go-header-avatar-img"
                    />
                  </button>
                </div>
              </div>

              {/* Heading & Subtitle */}
              <div className="go-home-heading-wrap">
                <h1 className="go-home-title">Đi đâu tiếp theo?</h1>
                <p className="go-home-subtitle">Những hành trình đẹp hơn bắt đầu từ DANAVA Go</p>
              </div>

              {/* 3 Badges */}
              <div className="go-home-badges">
                <div className="go-hero-badge">
                  <ShieldCheck size={16} className="go-badge-icon" />
                  <span className="go-badge-text">An toàn<br />vững tin</span>
                </div>
                <div className="go-hero-badge">
                  <Armchair size={16} className="go-badge-icon" />
                  <span className="go-badge-text">Giường nằm<br />êm ái</span>
                </div>
                <div className="go-hero-badge">
                  <Compass size={16} className="go-badge-icon" />
                  <span className="go-badge-text">Khắp mọi<br />miền Việt Nam</span>
                </div>
              </div>
            </div>

            {/* Floating Search Card */}
            <div className="go-search-card">
              {/* Trip Type Segmented Toggle (Một chiều / Khứ hồi) - Zalo Mini App Style */}
              <div className="go-trip-type-toggle">
                <button
                  type="button"
                  className={`go-trip-type-btn ${tripType === "one-way" ? "active" : ""}`}
                  onClick={() => setTripType("one-way")}
                >
                  <Bus size={16} />
                  <span>Một chiều</span>
                </button>
                <button
                  type="button"
                  className={`go-trip-type-btn ${tripType === "round-trip" ? "active" : ""}`}
                  onClick={() => setTripType("round-trip")}
                >
                  <RotateCcw size={14} />
                  <span>Khứ hồi</span>
                </button>
              </div>
              {/* Row 1: Nơi đi */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div
                  className="go-location-field"
                  onClick={() => setCityPickerTarget("origin")}
                >
                  <div className="go-field-icon-wrap">
                    <MapPin size={20} />
                  </div>
                  <div className="go-field-text">
                    <div className="go-field-label">Nơi đi</div>
                    <div className="go-field-value">{origin}</div>
                  </div>
                </div>
                {/* Swap button */}
                <button
                  type="button"
                  className="go-swap-btn"
                  onClick={handleSwapCities}
                  aria-label="Đổi điểm đi và đến"
                >
                  <ArrowUpDown size={17} />
                </button>
              </div>

              <div className="go-search-divider" />

              {/* Row 2: Nơi đến */}
              <div
                className="go-location-field"
                onClick={() => setCityPickerTarget("dest")}
              >
                <div className="go-field-icon-wrap">
                  <MapPin size={20} />
                </div>
                <div className="go-field-text">
                  <div className="go-field-label">Nơi đến</div>
                  <div className="go-field-value">{destination}</div>
                </div>
              </div>

              <div className="go-search-divider" />

              {/* Row 3: Ngày đi */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 4 }}>
                <div className="go-location-field" style={{ position: "relative" }}>
                  <div
                    className="go-field-icon-wrap"
                    style={{ borderRadius: 12 }}
                  >
                    <Calendar size={20} />
                  </div>
                  <div className="go-field-text">
                    <div className="go-field-label">Ngày đi</div>
                    <div className="go-field-value">{formatVietnamDate(travelDate)}</div>
                  </div>
                  <input
                    type="date"
                    aria-label="Chọn ngày đi"
                    min={today}
                    value={travelDate}
                    onChange={(e) => {
                      if (!isValidBookingDate(e.target.value)) return;
                      setTravelDate(e.target.value);
                      if (returnDate <= e.target.value) setReturnDate(addDaysToDateStr(e.target.value, 3));
                    }}
                    style={DATE_PICKER_OVERLAY}
                  />
                </div>
                {/* Quick Date Chips */}
                <div className="go-date-chips">
                  <button
                    type="button"
                    className={travelDate === today ? "go-chip-active" : "go-chip-inactive"}
                    onClick={() => setTravelDate(today)}
                  >
                    Hôm nay
                  </button>
                  <button
                    type="button"
                    className={travelDate === tomorrow ? "go-chip-active" : "go-chip-inactive"}
                    onClick={() => setTravelDate(tomorrow)}
                  >
                    Ngày mai
                  </button>
                </div>
              </div>

              {/* Round Trip Return Date (Khứ hồi) */}
              {tripType === "round-trip" && (
                <>
                  <div className="go-search-divider" />
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 4 }}>
                    <div className="go-location-field" style={{ position: "relative" }}>
                      <div
                        className="go-field-icon-wrap"
                        style={{ borderRadius: 12, backgroundColor: "#eff6ff" }}
                      >
                        <Calendar size={20} />
                      </div>
                      <div className="go-field-text">
                        <div className="go-field-label">Ngày về</div>
                        <div className="go-field-value">{formatVietnamDate(returnDate)}</div>
                      </div>
                      <input
                        type="date"
                        aria-label="Chọn ngày về"
                        min={addDaysToDateStr(travelDate, 1)}
                        value={returnDate}
                        onChange={(e) => {
                          if (e.target.value > travelDate) setReturnDate(e.target.value);
                        }}
                        style={DATE_PICKER_OVERLAY}
                      />
                    </div>
                    <div className="go-date-chips">
                      <button
                        type="button"
                        className={returnDate === addDaysToDateStr(travelDate, 3) ? "go-chip-active" : "go-chip-inactive"}
                        onClick={() => setReturnDate(addDaysToDateStr(travelDate, 3))}
                      >
                        +3 ngày
                      </button>
                      <button
                        type="button"
                        className={returnDate === addDaysToDateStr(travelDate, 5) ? "go-chip-active" : "go-chip-inactive"}
                        onClick={() => setReturnDate(addDaysToDateStr(travelDate, 5))}
                      >
                        +5 ngày
                      </button>
                    </div>
                  </div>
                  <p style={{ margin: "6px 0 0", fontSize: 11.5, color: "#64748b" }}>
                    Đặt chiều đi trước; sau khi có vé, bấm “Đặt chiều về” để chọn chuyến ngày {formatVietnamDate(returnDate)}.
                  </p>
                </>
              )}

              {/* Submit Search Button */}
              <button
                type="button"
                className="go-btn-primary"
                onClick={() => runSearch()}
              >
                <Search size={18} strokeWidth={2.5} />
                <span>Tìm chuyến</span>
              </button>
            </div>

            {/* Section: Điểm đến nổi bật */}
            <div className="go-section">
              <div className="go-section-header">
                <span className="go-section-title">Điểm đến nổi bật</span>
                <span className="go-section-link">Xem tất cả &gt;</span>
              </div>
              <div className="go-dest-grid">
                {/* Đà Lạt */}
                <div
                  className="go-dest-card"
                  onClick={() => {
                    setDestination("Đà Lạt");
                    runSearch(travelDate, origin, "Đà Lạt");
                  }}
                >
                  <img src="/assets/appgo/dest-dalat.png" alt="Đà Lạt" />
                  <div className="go-dest-overlay">
                    <div className="go-dest-info">
                      <div className="go-dest-name">
                        <MapPin size={13} fill="currentColor" />
                        <span>Đà Lạt</span>
                      </div>
                      <div className="go-dest-desc">Thành phố ngàn hoa</div>
                    </div>
                    <div className="go-dest-arrow">
                      <ChevronRight size={13} />
                    </div>
                  </div>
                </div>

                {/* Nha Trang */}
                <div
                  className="go-dest-card"
                  onClick={() => {
                    setDestination("Nha Trang");
                    runSearch(travelDate, origin, "Nha Trang");
                  }}
                >
                  <img src="/assets/appgo/dest-nhatrang.png" alt="Nha Trang" />
                  <div className="go-dest-overlay">
                    <div className="go-dest-info">
                      <div className="go-dest-name">
                        <MapPin size={13} fill="currentColor" />
                        <span>Nha Trang</span>
                      </div>
                      <div className="go-dest-desc">Biển xanh nắng vàng</div>
                    </div>
                    <div className="go-dest-arrow">
                      <ChevronRight size={13} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Promo Banner with 3D Gift */}
            <div className="go-promo-banner">
              <div className="go-promo-ticket-badge">
                <div className="go-promo-ticket-icon">
                  <Ticket size={20} />
                </div>
              </div>
              <div className="go-promo-content">
                <div className="go-promo-badge">Ưu đãi đặc biệt</div>
                <div className="go-promo-highlight">Giảm đến 30%</div>
                <div className="go-promo-sub">Cho nhiều tuyến đường hot</div>
                <button
                  type="button"
                  className="go-promo-btn"
                  onClick={() => handleTabChange("promos")}
                >
                  <span>Xem ưu đãi</span>
                  <ChevronRight size={13} />
                </button>
              </div>
              <div className="go-promo-art">
                <img src="/assets/appgo/promo-gift.png" alt="Ưu đãi vé xe" />
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            SCREEN 2: VÉ CỦA TÔI (MY TICKETS)
            ========================================================================= */}
        {activeTab === "tickets" && flowStep === "main" && (
          <div>
            {/* Top Dark Navy Header */}
            <div className="go-tickets-header">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div className="go-logo-text">
                  <span>DANAVA</span>
                  <span className="go-brand-go">Go</span>
                </div>
                <button
                  type="button"
                  onClick={() => setNotesOpen(true)}
                  aria-label={`Thông báo${session.unread ? `, ${session.unread} chưa đọc` : ""}`}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    backgroundColor: "rgba(255, 255, 255, 0.12)",
                    border: "1px solid rgba(255, 255, 255, 0.15)",
                    color: "#ffffff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    position: "relative",
                    cursor: "pointer",
                  }}
                >
                  <Bell size={18} />
                  {session.unread > 0 && (
                    <span
                      style={{
                        position: "absolute",
                        top: 7,
                        right: 8,
                        width: 7,
                        height: 7,
                        borderRadius: "50%",
                        backgroundColor: "#ef4444",
                      }}
                    />
                  )}
                </button>
              </div>
              <h1 className="go-tickets-title">Vé của tôi</h1>
            </div>

            {/* Filter Pills */}
            <div className="go-filter-pills">
              <button
                type="button"
                className={ticketFilter === "upcoming" ? "go-filter-pill-active" : "go-filter-pill-inactive"}
                onClick={() => setTicketFilter("upcoming")}
              >
                Sắp đi ({ticketCounts.upcoming})
              </button>
              <button
                type="button"
                className={ticketFilter === "completed" ? "go-filter-pill-active" : "go-filter-pill-inactive"}
                onClick={() => setTicketFilter("completed")}
              >
                Hoàn thành
              </button>
              <button
                type="button"
                className={ticketFilter === "cancelled" ? "go-filter-pill-active" : "go-filter-pill-inactive"}
                onClick={() => setTicketFilter("cancelled")}
              >
                Đã hủy
              </button>
            </div>

            {!ticketsLoaded && (
              <p style={{ textAlign: "center", color: "#64748b", fontSize: 13, padding: "24px 16px" }}>Đang tải vé đã lưu trên máy…</p>
            )}
            {ticketsLoaded && filteredTickets.length === 0 && (
              <div style={{ textAlign: "center", color: "#64748b", fontSize: 13, padding: "22px 24px 6px", lineHeight: 1.6 }}>
                <Ticket size={28} color="#94a3b8" style={{ marginBottom: 6 }} />
                <div style={{ fontWeight: 700, color: "#0f172a" }}>Chưa có vé ở mục này</div>
                <div>Vé bạn đặt trên máy này sẽ hiện ở đây. Đặt trên máy khác? Tra cứu bằng mã vé bên dưới.</div>
              </div>
            )}

            {/* Ticket Cards List */}
            {filteredTickets.map((t) => {
              const pay = paymentLabel(t);
              const from = findStop(t.trip.departureStops, t.passenger.pickupStopId);
              const to = findStop(t.trip.dropoffStops, t.passenger.dropoffStopId);
              return (
                <div key={t.id} className="go-ticket-card">
                  {/* Night Bus Banner with payment badge */}
                  <div className="go-ticket-banner-wrap">
                    <img
                      src="/assets/appgo/ticket-night-bus.png"
                      alt="DANAVA Go"
                      className="go-ticket-banner-img"
                    />
                    <div className="go-ticket-banner-overlay">
                      <div>
                        <div className="go-ticket-brand-logo">
                          <span>DANAVA</span> <em>Go</em>
                        </div>
                        <div className="go-ticket-brand-slogan">{t.trip.operator}</div>
                      </div>
                      <div className="go-ticket-paid-badge" style={pay.paid ? undefined : { background: "#fef3c7", color: "#92400e" }}>
                        {pay.paid ? <CheckCircle2 size={13} strokeWidth={2.5} /> : <Clock size={13} strokeWidth={2.5} />}
                        <span>{pay.text}</span>
                      </div>
                    </div>
                  </div>

                  {/* Ticket Details */}
                  <div className="go-ticket-body">
                    {/* Route Header */}
                    <div className="go-ticket-route">
                      <div className="go-ticket-origin">
                        <h4>{t.trip.from}</h4>
                        <p>{from?.name || t.trip.departureLocation.name}</p>
                      </div>
                      <div className="go-route-arrow-wrap">
                        <ArrowRight size={22} strokeWidth={2.5} />
                      </div>
                      <div className="go-ticket-dest">
                        <h4>{t.trip.to}</h4>
                        <p>{to?.name || t.trip.arrivalLocation.name}</p>
                      </div>
                    </div>

                    <div className="go-ticket-divider" />

                    {/* Info Row 1 */}
                    <div className="go-ticket-grid">
                      <div className="go-info-cell">
                        <div className="go-cell-label">
                          <Calendar size={12} />
                          <span>Ngày khởi hành</span>
                        </div>
                        <div className="go-cell-val">{formatVietnamDate(t.date)}</div>
                        <div className="go-cell-sub">{weekday(t.date)}</div>
                      </div>
                      <div className="go-info-cell align-center">
                        <div className="go-cell-label" style={{ justifyContent: "center" }}>
                          <Clock size={12} />
                          <span>Giờ khởi hành</span>
                        </div>
                        <div className="go-cell-val">{from?.time || t.trip.departureTime}</div>
                      </div>
                      <div className="go-info-cell align-right">
                        <div className="go-cell-label">
                          <Clock size={12} />
                          <span>Giờ đến</span>
                        </div>
                        <div className="go-cell-val">{to?.time || t.trip.arrivalTime}</div>
                        <div className="go-cell-sub">{formatVietnamDate(arrivalDate(t.trip, t.date))}</div>
                      </div>
                    </div>

                    <div className="go-ticket-divider" />

                    {/* Info Row 2 */}
                    <div className="go-ticket-grid">
                      <div className="go-info-cell">
                        <div className="go-cell-label">
                          <Armchair size={12} />
                          <span>{seatLabel(t.trip)}</span>
                        </div>
                        <div className="go-cell-val highlight-blue">{t.selectedSeats.join(", ")}</div>
                        <div className="go-cell-sub">{t.trip.vehicle.categoryLabel}</div>
                      </div>
                      <div className="go-info-cell align-center">
                        <div className="go-cell-label" style={{ justifyContent: "center" }}>
                          <Ticket size={12} />
                          <span>Giá vé</span>
                        </div>
                        <div className="go-cell-val">{money(t.totalAmount)}</div>
                        <div className="go-cell-sub">/ {t.selectedSeats.length} hành khách</div>
                      </div>
                      <div className="go-info-cell align-right">
                        <div className="go-cell-label">
                          <FileText size={12} />
                          <span>Mã đặt vé</span>
                        </div>
                        <div className="go-cell-val" style={{ fontSize: 13 }}>
                          {t.id}
                        </div>
                      </div>
                    </div>

                    {/* Primary Button: Xem vé điện tử */}
                    <button
                      type="button"
                      className="go-btn-ticket-primary"
                      onClick={() => openTicket(t)}
                    >
                      <QrCode size={18} />
                      <span>Xem vé điện tử &gt;</span>
                    </button>

                    {/* Sub Action Buttons */}
                    <div className="go-ticket-sub-actions">
                      <button
                        type="button"
                        className="go-btn-ticket-sub"
                        onClick={() => {
                          setBooking(t);
                          setPickupModal("view");
                        }}
                      >
                        <MapPin size={15} color="#2563eb" />
                        <span>Điểm đón &gt;</span>
                      </button>
                      <button
                        type="button"
                        className="go-btn-ticket-sub"
                        onClick={() => setSupportModalOpen(true)}
                      >
                        <Headphones size={15} color="#2563eb" />
                        <span>Hỗ trợ &gt;</span>
                      </button>
                    </div>

                    {/* Notice Alert */}
                    <div className="go-alert-notice">
                      <AlertCircle size={16} color="#2563eb" style={{ flexShrink: 0, marginTop: 1 }} />
                      <div>
                        <p className="go-alert-title">Có mặt trước giờ khởi hành 30 phút</p>
                        <p className="go-alert-sub">Để làm thủ tục và lên xe đúng giờ.</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Lookup a ticket booked elsewhere (code + phone, same as the website) */}
            <div className="go-section" style={{ paddingTop: 6 }}>
              <div className="go-section-header">
                <span className="go-section-title">Tra cứu vé</span>
              </div>
              <div className="go-payment-card" style={{ margin: 0 }}>
                <div className="go-form-group">
                  <label className="go-form-label" htmlFor="go-lookup-code">Mã vé</label>
                  <input id="go-lookup-code" type="text" className="go-form-input" value={lookupCode} onChange={(e) => setLookupCode(e.target.value)} placeholder="VD: DG…" autoComplete="off" />
                </div>
                <div className="go-form-group">
                  <label className="go-form-label" htmlFor="go-lookup-phone">Số điện thoại đặt vé</label>
                  <input id="go-lookup-phone" type="tel" inputMode="tel" className="go-form-input" value={lookupPhone} onChange={(e) => setLookupPhone(e.target.value)} placeholder="09xx xxx xxx" autoComplete="tel" />
                </div>
                <button type="button" className="go-btn-primary" onClick={lookupTicket} disabled={busy}>
                  <Search size={17} strokeWidth={2.5} />
                  <span>{busy ? "Đang tra cứu…" : "Tra cứu & lưu vào máy"}</span>
                </button>
              </div>
            </div>

            {/* Section: Đặt lại chuyến quen */}
            {myTickets[0] && (
              <div className="go-section" style={{ paddingTop: 6 }}>
                <div className="go-section-header">
                  <span className="go-section-title">Đặt lại chuyến quen</span>
                  <span className="go-section-link">Xem tất cả &gt;</span>
                </div>
                <div className="go-rebook-card">
                  <div className="go-rebook-thumb">
                    <img src={myTickets[0].trip.vehicle.image || "/assets/appgo/trip-bus-card.png"} alt={`${myTickets[0].trip.from} đi ${myTickets[0].trip.to}`} />
                  </div>
                  <div className="go-rebook-info">
                    <div className="go-rebook-route">{myTickets[0].trip.from} &rarr; {myTickets[0].trip.to}</div>
                    <div className="go-rebook-date">{formatVietnamDate(myTickets[0].date)}</div>
                    <div className="go-rebook-type">{myTickets[0].trip.vehicle.categoryLabel} &bull; {myTickets[0].selectedSeats.length} hành khách</div>
                  </div>
                  <button
                    type="button"
                    className="go-btn-rebook"
                    onClick={() => rebook(myTickets[0])}
                  >
                    <RotateCcw size={13} />
                    <span>Đặt lại</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* =========================================================================
            SCREEN 3: CHỌN CHUYẾN (TRIPS LIST - Exact match to user mockup)
            ========================================================================= */}
        {flowStep === "trips" && (
          <div className="go-trips-screen">
            {/* Header Box */}
            <div className="go-trips-header-box">
              {/* Navigation Row with Back and Centered Logo */}
              <div className="go-trips-nav-row">
                <button
                  type="button"
                  className="go-trips-back-btn"
                  onClick={() => goTo("main")}
                  aria-label="Quay lại"
                >
                  <ChevronLeft size={24} />
                </button>
                <div className="go-trips-logo">
                  <span className="go-trips-logo-danava">DANAVA</span>
                  <span className="go-trips-logo-go">Go</span>
                </div>
                <div style={{ width: 28 }} />
              </div>

              {/* Route & Passenger Box */}
              <div className="go-trips-summary-card">
                <div>
                  <h2 className="go-trips-route-title">
                    {origin} <span style={{ color: "#0f172a", fontWeight: 700 }}>→</span> {destination}
                  </h2>
                  <p className="go-trips-route-sub">
                    {formatVietnamDate(travelDate)} • {tripType === "round-trip" ? "Khứ hồi" : "1 khách"}
                  </p>
                </div>
                <button
                  type="button"
                  className="go-trips-edit-btn"
                  onClick={() => goTo("main")}
                  aria-label="Chỉnh sửa tìm kiếm"
                >
                  <Pencil size={18} />
                </button>
              </div>

              {/* Date Strip: tap a day to search it */}
              <div className="go-trips-dates-row">
                {dateStrip.map((iso) => (
                  <div
                    key={iso}
                    role="button"
                    tabIndex={0}
                    className={`go-trips-date-pill ${travelDate === iso ? "active" : ""}`}
                    onClick={() => iso !== travelDate && runSearch(iso)}
                    onKeyDown={(e) => e.key === "Enter" && iso !== travelDate && runSearch(iso)}
                  >
                    <div className="pill-day">{shortWeekday(iso)}</div>
                    <div className="pill-date">{dayMonth(iso)}</div>
                    <div className="pill-price">
                      {iso === travelDate ? (searching ? "Đang tìm…" : minPrice !== null ? `Từ ${money(minPrice)}` : "Hết chuyến") : "Xem chuyến"}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Filter / sort chips */}
            <div className="go-trips-filters-bar">
              <button
                type="button"
                className="go-trips-filter-chip filter-btn"
                onClick={() => {
                  setTripSort("suggested");
                  setCategoryFilter("");
                }}
              >
                <SlidersHorizontal size={14} />
                <span>Bộ lọc</span>
              </button>
              <button type="button" className="go-trips-filter-chip" aria-pressed={tripSort === "time"} style={tripSort === "time" ? { borderColor: "#2563eb", color: "#2563eb" } : undefined} onClick={() => setTripSort("time")}>
                <Clock size={13} />
                <span>Giờ đi</span>
                <ChevronDown size={12} />
              </button>
              <button
                type="button"
                className="go-trips-filter-chip"
                aria-pressed={!!categoryFilter}
                style={categoryFilter ? { borderColor: "#2563eb", color: "#2563eb" } : undefined}
                disabled={tripCategories.length < 2 && !categoryFilter}
                onClick={() => {
                  // Cycle: all -> each vehicle type present in the results -> all
                  const i = categoryFilter ? tripCategories.indexOf(categoryFilter) : -1;
                  setCategoryFilter(i + 1 < tripCategories.length ? tripCategories[i + 1] : "");
                }}
              >
                <Bus size={13} />
                <span>{categoryFilter ? trips.find((t) => t.vehicle.category === categoryFilter)?.vehicle.categoryLabel : "Loại xe"}</span>
                <ChevronDown size={12} />
              </button>
              <button type="button" className="go-trips-filter-chip" aria-pressed={tripSort === "price"} style={tripSort === "price" ? { borderColor: "#2563eb", color: "#2563eb" } : undefined} onClick={() => setTripSort("price")}>
                <Tag size={13} />
                <span>Giá</span>
                <ChevronDown size={12} />
              </button>
            </div>

            {/* Section Header */}
            <div className="go-trips-section-head">
              <span className="go-trips-section-title">{searching ? "Đang tìm chuyến…" : "Chuyến phù hợp"}</span>
              <button type="button" className="go-trips-sort-btn" onClick={() => setTripSort("suggested")}>
                <span>Gợi ý</span>
                <ChevronDown size={14} />
              </button>
            </div>

            {!searching && visibleTrips.length === 0 && (
              <div style={{ textAlign: "center", color: "#64748b", fontSize: 13, padding: "18px 24px", lineHeight: 1.6 }}>
                <Bus size={28} color="#94a3b8" style={{ marginBottom: 6 }} />
                <div style={{ fontWeight: 700, color: "#0f172a" }}>Chưa có chuyến mở bán cho ngày này</div>
                <div>Thử ngày khác ở dải ngày phía trên, hoặc đổi điểm đi/điểm đến.</div>
              </div>
            )}

            {/* Trip Cards */}
            {visibleTrips.map((trip, i) => (
              <div key={trip.id} className="go-trip-card">
                {/* Top Section: Bus thumbnail + metadata + timeline */}
                <div className="go-trip-top-section">
                  <div className="go-trip-bus-thumb">
                    <img src={trip.vehicle.image || `/assets/appgo/trip-bus-${(i % 3) + 1}.jpg`} alt={trip.vehicle.name || trip.operator} />
                  </div>
                  <div className="go-trip-meta">
                    <div className="go-trip-operator-row">
                      <span className="go-trip-operator-name">{trip.operator}</span>
                      <span className="go-trip-bus-badge">{trip.vehicle.categoryLabel}</span>
                    </div>
                    <div className="go-trip-rating-row">
                      {trip.vehicle.rating > 0 && (
                        <>
                          <Star size={12} fill="#f59e0b" color="#f59e0b" />
                          <span className="go-trip-rating-score">{trip.vehicle.rating.toFixed(1)}</span>
                        </>
                      )}
                      <span className="go-trip-review-count">Còn {trip.availableSeatsCount} chỗ</span>
                    </div>
                    {/* Departure → Arrival schedule */}
                    <div className="go-trip-timeline-row">
                      <div className="go-timeline-station">
                        <div className="go-timeline-time">{trip.departureTime}</div>
                        <div className="go-timeline-city">{trip.from}</div>
                        <div className="go-timeline-hub">{trip.departureLocation.name}</div>
                      </div>
                      <div className="go-timeline-mid">
                        <div className="go-timeline-arrow">→</div>
                        <div className="go-timeline-dur">{trip.duration}</div>
                      </div>
                      <div className="go-timeline-station">
                        <div className="go-timeline-time">
                          {trip.arrivalTime}
                          {trip.nextDay && <span className="go-badge-next-day">+1 ngày</span>}
                        </div>
                        <div className="go-timeline-city">{trip.to}</div>
                        <div className="go-timeline-hub">{trip.arrivalLocation.name}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Amenities Row */}
                <div className="go-trip-amenities-row">
                  <div className="go-trip-amenities-list">
                    {trip.vehicle.amenities.slice(0, 2).map((a) => {
                      const Icon = /wifi/i.test(a) ? Wifi : /nước|uống|cafe|coffee/i.test(a) ? Coffee : BedDouble;
                      return (
                        <div key={a} className="go-trip-amenity-item">
                          <Icon size={14} />
                          <span>{a}</span>
                        </div>
                      );
                    })}
                  </div>
                  <button
                    type="button"
                    className="go-trip-policy-link"
                    onClick={() => setPolicyModalOpen(true)}
                  >
                    <FileText size={13} />
                    <span>Chính sách &gt;</span>
                  </button>
                </div>

                {/* Price & Action Button */}
                <div className="go-trip-footer-row">
                  <div>
                    <span className="go-trip-price-val">{money(trip.price)}</span>
                    <span className="go-trip-price-unit"> / người</span>
                  </div>
                  <button
                    type="button"
                    className="go-trip-choose-btn"
                    onClick={() => chooseTrip(trip)}
                  >
                    <span>Chọn chỗ</span>
                    <ChevronRight size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* =========================================================================
            SCREEN 4: CHỌN CHỖ (SEAT SELECTION - Exact match to user mockup)
            ========================================================================= */}
        {flowStep === "seats" && selectedTrip && (
          <div className="go-seats-screen">
            {/* Header Box */}
            <div className="go-seats-header-box">
              <div className="go-seats-nav-row">
                <button
                  type="button"
                  className="go-seats-back-btn"
                  onClick={() => goTo("trips")}
                  aria-label="Quay lại"
                >
                  <ChevronLeft size={24} />
                </button>
                <div className="go-seats-title-wrap">
                  <h2 className="go-seats-title">Chọn chỗ</h2>
                  <p className="go-seats-subtitle">
                    {selectedTrip.from} &rarr; {selectedTrip.to}
                  </p>
                </div>
                <div style={{ width: 32 }} />
              </div>

              {/* Progress Steps: (✓) Chuyến ── (2) Chỗ ── (3) Thanh toán */}
              <div className="go-seats-stepper">
                <div className="go-seats-step-item">
                  <div className="go-seats-step-circle done">✓</div>
                  <span className="go-seats-step-label">Chuyến</span>
                </div>
                <div className="go-seats-step-line done" />
                <div className="go-seats-step-item">
                  <div className="go-seats-step-circle active">2</div>
                  <span className="go-seats-step-label">Chỗ</span>
                </div>
                <div className="go-seats-step-line pending" />
                <div className="go-seats-step-item">
                  <div className="go-seats-step-circle pending">3</div>
                  <span className="go-seats-step-label pending">Thanh toán</span>
                </div>
              </div>
            </div>

            {/* Floor toggle (only for two-floor vehicles) */}
            {hasUpperFloor && (
              <div className="go-seats-floor-wrap">
                <div className="go-seats-floor-toggle">
                  <button
                    type="button"
                    className={`go-seats-floor-btn ${selectedFloor === 1 ? "active" : ""}`}
                    onClick={() => setSelectedFloor(1)}
                  >
                    Tầng dưới
                  </button>
                  <button
                    type="button"
                    className={`go-seats-floor-btn ${selectedFloor === 2 ? "active" : ""}`}
                    onClick={() => setSelectedFloor(2)}
                  >
                    Tầng trên
                  </button>
                </div>
              </div>
            )}

            {/* Legend: Trống / Đã đặt / Đang chọn */}
            <div className="go-seats-legend">
              <div className="go-seats-legend-item">
                <div className="go-seats-legend-swatch empty" />
                <span>Trống</span>
              </div>
              <div className="go-seats-legend-item">
                <div className="go-seats-legend-swatch booked" />
                <span>Đã đặt</span>
              </div>
              <div className="go-seats-legend-item">
                <div className="go-seats-legend-swatch selected" />
                <span>Đang chọn</span>
              </div>
            </div>

            {/* Price guide when the operator prices seat groups differently */}
            {seatPriceGuide.length > 1 && (
              <div className="go-seat-price-guide" aria-label="Giá theo loại chỗ">
                {seatPriceGuide.map((g) => (
                  <span key={g.name + g.price}>
                    {g.name} <b>{money(g.price)}</b>
                  </span>
                ))}
              </div>
            )}

            {/* Bus deck: the operator's seat map from Studio (positions, aisle, seat groups) */}
            <BusSeatDeck
              cols={deck.cols}
              rows={deck.rows}
              aisleCols={deck.aisle}
              ariaLabel={`Sơ đồ ${hasUpperFloor ? (selectedFloor === 1 ? "tầng dưới" : "tầng trên") : "chỗ ngồi"}`}
              seats={selectedTrip.seats
                .filter((seat) => seat.floor === selectedFloor)
                .map((seat) => {
                  const isSelected = selectedSeats.includes(seat.code);
                  const state = seat.status === "booked" ? "booked" : seat.status !== "available" ? "disabled" : isSelected ? "selected" : "available";
                  return {
                    code: seat.code,
                    row: seat.row,
                    col: seat.col,
                    type: seat.type,
                    state,
                    badge: surchargeBadge(seat.surcharge),
                    label: `Chỗ ${seat.code}${seat.note ? ` (${seat.note})` : ""}${state === "booked" ? ", đã đặt" : state === "disabled" ? ", không bán" : ""}, ${money(seat.price)}`,
                  };
                })}
              onSeat={(code) => {
                const seat = selectedTrip.seats.find((x) => x.code === code);
                if (seat) toggleSeat(seat);
              }}
            />

            {/* Station Pickers: Điểm đón & Điểm trả */}
            <div
              className="go-station-card"
              onClick={() => setPickupModal("select")}
              role="button"
              tabIndex={0}
            >
              <div className="go-station-icon-wrap blue">
                <MapPin size={18} />
              </div>
              <div className="go-station-text">
                <span className="go-station-label">Điểm đón{pickupStop?.time ? ` · ${pickupStop.time}` : ""}</span>
                <span className="go-station-name">{pickupStop?.name || "Chọn điểm đón"}</span>
              </div>
              <ChevronRight size={18} className="go-station-arrow" />
            </div>

            <div
              className="go-station-card"
              onClick={() => setPickupModal("select")}
              role="button"
              tabIndex={0}
            >
              <div className="go-station-icon-wrap slate">
                <MapPin size={18} />
              </div>
              <div className="go-station-text">
                <span className="go-station-label">Điểm trả{dropoffStop?.time ? ` · ${dropoffStop.time}` : ""}</span>
                <span className="go-station-name">{dropoffStop?.name || "Chọn điểm trả"}</span>
              </div>
              <ChevronRight size={18} className="go-station-arrow" />
            </div>

            {/* Bottom Floating Bar */}
            <div className="go-seats-bottom-bar">
              <div className="go-seats-bottom-row-top">
                <div className="go-seats-bottom-meta">
                  <div className="go-seats-bottom-title">
                    {selectedSeats.length} chỗ{selectedSeats.length > 0 && <> &bull; <span className="code">{selectedSeats.join(", ")}</span></>}
                  </div>
                  <div className="go-seats-bottom-route">
                    {selectedTrip.from} &rarr; {selectedTrip.to}
                  </div>
                  <div className="go-seats-bottom-time">
                    {selectedTrip.departureTime} {dayMonth(travelDate)} &rarr; {selectedTrip.arrivalTime} {dayMonth(arrivalDate(selectedTrip, travelDate))}
                  </div>
                </div>
                <div className="go-seats-bottom-price">{money(bookingTotal)}</div>
              </div>

              <button
                type="button"
                className="go-seats-submit-btn"
                disabled={busy || selectedSeats.length === 0}
                onClick={proceedToPayment}
              >
                <span>{busy ? "Đang giữ chỗ…" : selectedSeats.length ? "Tiếp tục" : "Chọn ít nhất 1 chỗ"}</span>
                <span>&rarr;</span>
              </button>
            </div>
          </div>
        )}

        {/* =========================================================================
            SCREEN 5: THANH TOÁN (PAYMENT - Exact match to user mockup)
            ========================================================================= */}
        {flowStep === "payment" && selectedTrip && (
          <div className="go-payment-screen">
            {/* Header Box */}
            <div className="go-payment-header-box">
              {/* Navigation Row */}
              <div className="go-payment-nav-row">
                <div className="go-payment-nav-left">
                  <button
                    type="button"
                    className="go-payment-back-btn"
                    onClick={() => goTo("seats")}
                    aria-label="Quay lại chọn chỗ"
                  >
                    <ChevronLeft size={24} />
                  </button>
                  <h2 className="go-payment-page-title">Thanh toán</h2>
                </div>
                <div className="go-trips-logo">
                  <span className="go-trips-logo-danava">DANAVA</span>
                  <span className="go-trips-logo-go">Go</span>
                </div>
              </div>

              {/* Stepper Progress 1 - 2 - 3 */}
              <div className="go-payment-stepper">
                <div className="go-step-item active">
                  <div className="go-step-num">1</div>
                  <span className="go-step-label">Thanh toán</span>
                </div>
                <div className="go-step-line" />
                <div className="go-step-item">
                  <div className="go-step-num">2</div>
                  <span className="go-step-label">Xác nhận</span>
                </div>
                <div className="go-step-line" />
                <div className="go-step-item">
                  <div className="go-step-num">3</div>
                  <span className="go-step-label">Hoàn tất</span>
                </div>
              </div>
            </div>

            {/* Reservation Countdown (server hold, 8 minutes) */}
            <div className="go-payment-countdown-banner" style={holdRemaining <= 0 ? { background: "#fef2f2", borderColor: "#fecaca" } : undefined}>
              <div className="go-countdown-left">
                <Clock size={19} color={holdRemaining <= 0 ? "#dc2626" : "#2563eb"} />
                <span>
                  Giữ chỗ <strong className="go-countdown-time">{holdClock}</strong>
                </span>
              </div>
              <div className="go-countdown-right">
                {holdRemaining > 0 ? (
                  "Vui lòng hoàn tất thanh toán trong thời gian giữ chỗ"
                ) : (
                  <button type="button" onClick={() => goTo("seats")} style={{ background: "none", border: 0, color: "#dc2626", fontWeight: 700, cursor: "pointer", padding: 0 }}>
                    Hết thời gian giữ chỗ — chọn lại chỗ
                  </button>
                )}
              </div>
            </div>

            {/* Trip Summary Card */}
            <div className="go-payment-trip-card">
              <div className="go-payment-trip-left">
                <div className="go-payment-bus-icon">
                  <Bus size={22} />
                </div>
                <div>
                  <h3 className="go-payment-trip-route">
                    {selectedTrip.from} → {selectedTrip.to}
                  </h3>
                  <div className="go-payment-trip-schedule">
                    {selectedTrip.departureTime} • {formatVietnamDate(travelDate)} → {selectedTrip.arrivalTime} • {formatVietnamDate(arrivalDate(selectedTrip, travelDate))}
                  </div>
                  <div className="go-payment-trip-seat">
                    {seatLabel(selectedTrip)} {selectedSeats.join(", ")}
                  </div>
                </div>
              </div>
              <ChevronDown size={18} color="#0f172a" />
            </div>

            {/* Contact Info Form Card */}
            <div className="go-payment-card">
              <h3 className="go-payment-card-title">Thông tin liên hệ</h3>
              <div className="go-form-group">
                <label className="go-form-label" htmlFor="go-pay-name">Họ và tên</label>
                <input
                  id="go-pay-name"
                  type="text"
                  className="go-form-input"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Nhập họ và tên"
                  autoComplete="name"
                  maxLength={100}
                />
              </div>
              <div className="go-form-group">
                <label className="go-form-label" htmlFor="go-pay-phone">Số điện thoại</label>
                <input
                  id="go-pay-phone"
                  type="tel"
                  inputMode="tel"
                  className="go-form-input"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="09xx xxx xxx"
                  autoComplete="tel"
                />
              </div>
              <div className="go-form-group">
                <label className="go-form-label" htmlFor="go-pay-email">Email (không bắt buộc)</label>
                <input
                  id="go-pay-email"
                  type="email"
                  className="go-form-input"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="example@email.com"
                  autoComplete="email"
                />
              </div>
              <div className="go-form-group">
                <label className="go-form-label" htmlFor="go-pay-promo">Mã ưu đãi (nếu có)</label>
                <input
                  id="go-pay-promo"
                  type="text"
                  className="go-form-input"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  placeholder="Nhà xe kiểm tra mã khi xác nhận"
                  autoComplete="off"
                />
              </div>
            </div>

            {/* Payment Methods Card: only pay-at-counter/transfer exists today */}
            <div className="go-payment-card">
              <h3 className="go-payment-card-title">Phương thức thanh toán</h3>

              <div role="radiogroup" aria-label="Phương thức thanh toán">
                {([
                  { id: "cash", icon: Banknote, name: "Thanh toán tại quầy", desc: "Trả tiền mặt tại văn phòng nhà xe hoặc khi lên xe." },
                  { id: "bank_transfer", icon: Building2, name: "Chuyển khoản ngân hàng", desc: "Chuyển khoản theo thông tin nhà xe cung cấp, ghi mã vé ở nội dung." },
                ] as const).map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    role="radio"
                    aria-checked={payMethod === m.id}
                    className={`go-payment-method-row${payMethod === m.id ? " selected" : ""}`}
                    onClick={() => setPayMethod(m.id)}
                  >
                    <div className="go-method-left">
                      <div className="go-radio-outer">{payMethod === m.id && <div className="go-radio-inner" />}</div>
                      <div className="go-method-icon-wrap">
                        <m.icon size={24} />
                      </div>
                      <div className="go-method-info">
                        <span className="go-method-name">{m.name}</span>
                        <span className="go-method-desc">{m.desc}</span>
                      </div>
                    </div>
                  </button>
                ))}
                <p className="go-method-note">Ghế được giữ cho bạn ngay khi đặt. Nhà xe xác nhận "đã thanh toán" khi nhận tiền.</p>
              </div>

              {[
                { icon: QrCode, name: "QR ngân hàng", desc: "Sắp ra mắt" },
                { icon: Wallet, name: "Ví điện tử", desc: "MoMo, ZaloPay… · Sắp ra mắt" },
                { icon: CreditCard, name: "Thẻ ngân hàng", desc: "Visa, Mastercard, Napas · Sắp ra mắt" },
              ].map((m) => (
                <div key={m.name} className="go-payment-method-row" aria-disabled="true" style={{ opacity: 0.5, cursor: "not-allowed" }}>
                  <div className="go-method-left">
                    <div className="go-radio-outer" />
                    <div className="go-method-icon-wrap">
                      <m.icon size={24} />
                    </div>
                    <div className="go-method-info">
                      <span className="go-method-name">{m.name}</span>
                      <span className="go-method-desc">{m.desc}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Terms & Policies Checkbox */}
            <div className="go-payment-terms">
              <input
                type="checkbox"
                id="terms-pay"
                className="go-terms-checkbox"
                checked={termsAgreed}
                onChange={(e) => setTermsAgreed(e.target.checked)}
              />
              <label htmlFor="terms-pay" className="go-terms-label">
                Tôi đồng ý với{" "}
                <span className="go-terms-link" onClick={() => setPolicyModalOpen(true)}>
                  Điều kiện vận chuyển
                </span>{" "}
                và{" "}
                <span className="go-terms-link" onClick={() => setPolicyModalOpen(true)}>
                  Chính sách hoàn tiền
                </span>{" "}
                của DANAVA Go
              </label>
            </div>

            {/* Fixed Bottom Floating Bar */}
            <div className="go-payment-bottom-bar">
              <div>
                <div className="go-total-lbl">Tổng thanh toán</div>
                <div className="go-total-val">{money(bookingTotal)}</div>
              </div>
              <button
                type="button"
                className="go-pay-submit-btn"
                disabled={busy || holdRemaining <= 0}
                onClick={confirmBooking}
              >
                <span>{busy ? "Đang xác nhận…" : "Xác nhận đặt vé"}</span>
                <ArrowRight size={17} />
              </button>
            </div>
          </div>
        )}

        {/* =========================================================================
            SCREEN 6: VÉ ĐIỆN TỬ / ĐẶT VÉ THÀNH CÔNG (Exact match to user mockup)
            ========================================================================= */}
        {flowStep === "eticket" && booking && (() => {
          const pay = paymentLabel(booking);
          const pick = findStop(booking.trip.departureStops, booking.passenger.pickupStopId);
          const drop = findStop(booking.trip.dropoffStops, booking.passenger.dropoffStopId);
          const arrive = arrivalDate(booking.trip, booking.date);
          return (
          <div className="go-eticket-screen">
            {/* Dark Navy Header Box */}
            <div className="go-eticket-header-box">
              <div className="go-eticket-nav">
                <button
                  type="button"
                  className="go-eticket-back-btn"
                  onClick={() => handleTabChange("tickets")}
                  aria-label="Quay lại danh sách vé"
                >
                  <ChevronLeft size={24} />
                </button>
                <h2 className="go-eticket-title">Vé điện tử</h2>
                <button
                  type="button"
                  className="go-eticket-share-btn"
                  onClick={() => shareTicket(booking)}
                  aria-label="Sao chép thông tin vé"
                >
                  <Share2 size={20} />
                </button>
              </div>
            </div>

            {/* Result card (always shown, as in the original design) */}
            {(
              <div className="go-eticket-success-card">
                <div className="go-eticket-success-icon">✓</div>
                <div className="go-eticket-success-text">
                  <h3 className="go-eticket-success-title">{pay.paid ? "Đặt vé thành công!" : justBooked ? "Đã giữ vé cho bạn!" : pay.text}</h3>
                  <p className="go-eticket-success-desc">
                    {pay.paid
                      ? "Cảm ơn bạn đã chọn DANAVA Go!"
                      : booking.paymentMethod === "bank_transfer"
                        ? `Vé đang chờ thanh toán. Chuyển khoản ${money(booking.totalAmount)} theo thông tin nhà xe, nội dung ghi mã ${booking.id}; nhà xe xác nhận khi nhận tiền.`
                        : `Vé đang chờ thanh toán. Thanh toán ${money(booking.totalAmount)} tại quầy hoặc khi lên xe, đọc mã ${booking.id} cho nhân viên.`}
                  </p>
                </div>
              </div>
            )}

            {/* The Perforated Boarding Pass / Ticket Card */}
            <div className="go-ticket-pass">
              {/* Ticket Top Banner */}
              <div className="go-ticket-banner">
                <div className="go-ticket-banner-brand">
                  <div className="go-ticket-banner-logo">
                    <span className="danava">DANAVA</span>
                    <span className="go">Go</span>
                  </div>
                  <div className="go-ticket-banner-slogan">
                    TRAVEL &bull; KẾT NỐI MUÔN HÀNH TRÌNH
                  </div>
                </div>
                <img
                  src="/assets/appgo/ticket-night-bus.png"
                  alt="DANAVA VIP Bus"
                  className="go-ticket-bus-img"
                />
              </div>

              {/* Route Section */}
              <div className="go-ticket-route-row">
                <div className="go-ticket-station">
                  <span className="go-ticket-city">{booking.trip.from}</span>
                  <span className="go-ticket-time">{pick?.time || booking.trip.departureTime}</span>
                  <span className="go-ticket-date">{formatVietnamDate(booking.date)}</span>
                </div>

                <div className="go-ticket-bus-mid">
                  <div className="go-ticket-arrow-line">
                    <div className="go-ticket-bus-bubble">
                      <Bus size={18} />
                    </div>
                  </div>
                </div>

                <div className="go-ticket-station right">
                  <span className="go-ticket-city">{booking.trip.to}</span>
                  <span className="go-ticket-time">{drop?.time || booking.trip.arrivalTime}</span>
                  <span className="go-ticket-date">
                    <span>{formatVietnamDate(arrive)}</span>
                    {booking.trip.nextDay && <span className="go-ticket-plus-day">+1 ngày</span>}
                  </span>
                </div>
              </div>

              {/* Details Grid: 2 columns x 3 rows */}
              <div className="go-ticket-details-grid">
                <div className="go-ticket-detail-item">
                  <div className="go-ticket-detail-icon">
                    <Bus size={15} />
                  </div>
                  <div>
                    <span className="go-ticket-detail-lbl">Nhà xe</span>
                    <span className="go-ticket-detail-val">{booking.trip.operator}</span>
                  </div>
                </div>

                <div className="go-ticket-detail-item">
                  <div className="go-ticket-detail-icon">
                    <Armchair size={15} />
                  </div>
                  <div>
                    <span className="go-ticket-detail-lbl">{seatLabel(booking.trip)}</span>
                    <span className="go-ticket-detail-val">{booking.selectedSeats.join(", ")}</span>
                  </div>
                </div>

                <div className="go-ticket-detail-item">
                  <div className="go-ticket-detail-icon">
                    <User size={15} />
                  </div>
                  <div>
                    <span className="go-ticket-detail-lbl">Hành khách</span>
                    <span className="go-ticket-detail-val">{booking.passenger.fullName}</span>
                  </div>
                </div>

                <div className="go-ticket-detail-item">
                  <div className="go-ticket-detail-icon">
                    <Ticket size={15} />
                  </div>
                  <div>
                    <span className="go-ticket-detail-lbl">Mã vé</span>
                    <span className="go-ticket-detail-val">{booking.id}</span>
                  </div>
                </div>

                <div className="go-ticket-detail-item">
                  <div className="go-ticket-detail-icon">
                    <DollarSign size={15} />
                  </div>
                  <div>
                    <span className="go-ticket-detail-lbl">Giá vé</span>
                    <span className="go-ticket-detail-val blue">{money(booking.totalAmount)}</span>
                  </div>
                </div>

                <div className="go-ticket-detail-item">
                  <div className={`go-ticket-detail-icon ${pay.paid ? "green" : ""}`}>
                    {pay.paid ? <CheckCircle2 size={15} /> : <Clock size={15} />}
                  </div>
                  <div>
                    <span className="go-ticket-detail-lbl">Thanh toán</span>
                    <span className={`go-ticket-detail-val ${pay.paid ? "green" : ""}`} style={pay.paid ? undefined : { color: "#b45309" }}>
                      {pay.text}
                      {booking.status !== "cancelled" && ` · ${booking.paymentMethod === "bank_transfer" ? "Chuyển khoản" : "Tại quầy"}`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Perforated Tear Line */}
              <div className="go-ticket-tear-line">
                <div className="go-ticket-tear-left" />
                <div className="go-ticket-dashed" />
                <div className="go-ticket-tear-right" />
              </div>

              {/* QR of the booking code (what staff look up at boarding) */}
              <div className="go-ticket-qr-box">
                <div className="go-ticket-qr-frame">
                  <QRCodeSVG value={booking.id} size={140} level="M" marginSize={0} style={{ display: "block" }} />
                </div>
                <span className="go-ticket-qr-caption">Xuất trình mã này cho phụ xe khi lên xe</span>
              </div>
            </div>

            {/* Pickup Station Card */}
            <div className="go-eticket-pickup-card">
              <div className="go-eticket-station-header">
                <div className="go-eticket-pin-circle">
                  <MapPin size={18} />
                </div>
                <div className="go-eticket-station-info">
                  <span className="go-eticket-station-lbl">Điểm đón{pick?.time ? ` · ${pick.time}` : ""}</span>
                  <span className="go-eticket-station-name">{pick?.name || booking.trip.departureLocation.name}</span>
                  <p className="go-eticket-station-addr">{pick?.address || booking.trip.departureLocation.address}</p>
                  <div className="go-eticket-station-note">
                    <Clock size={12} />
                    <span>Có mặt trước 30 phút để làm thủ tục lên xe.</span>
                  </div>
                </div>
                <ChevronRight size={18} color="#94a3b8" />
              </div>

              {/* Two Action Buttons: Xem điểm đón & Liên hệ */}
              <div className="go-eticket-actions-row">
                <button
                  type="button"
                  className="go-eticket-action-btn"
                  onClick={() => setPickupModal("view")}
                >
                  <Map size={16} />
                  <span>Xem điểm đón</span>
                </button>
                <button
                  type="button"
                  className="go-eticket-action-btn"
                  onClick={() => setSupportModalOpen(true)}
                >
                  <Phone size={16} />
                  <span>Liên hệ</span>
                </button>
              </div>
            </div>

            {/* Bottom Floating Bar: round-trip next step, then download */}
            <div className="go-eticket-bottom-bar" style={justBooked && tripType === "round-trip" ? { display: "flex", gap: 10 } : undefined}>
              {justBooked && tripType === "round-trip" && (
                <button type="button" className="go-eticket-download-btn" style={{ background: "#ffffff", color: "#2563eb", border: "1.5px solid #2563eb" }} onClick={bookReturn}>
                  <RotateCcw size={18} />
                  <span>Đặt chiều về</span>
                </button>
              )}
              <button
                type="button"
                className="go-eticket-download-btn"
                onClick={() => window.print()}
              >
                <Download size={18} />
                <span>Tải vé</span>
              </button>
            </div>
          </div>
          );
        })()}

        {/* =========================================================================
            SCREEN 6: ƯU ĐÃI (PROMOTIONS TAB)
            ========================================================================= */}
        {activeTab === "promos" && flowStep === "main" && (
          <div style={{ paddingBottom: 20 }}>
            <div className="go-tickets-header" style={{ paddingBottom: 16 }}>
              <h1 className="go-tickets-title" style={{ marginTop: 0 }}>Ưu đãi & Khuyến mãi</h1>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.8)", margin: "4px 0 0" }}>
                Mã giảm giá và quyền lợi dành riêng cho bạn
              </p>
            </div>

            <div style={{ padding: "16px 16px 0" }}>
              {[
                { code: "DANAVAGO30", title: "Giảm 30% tuyến Đà Nẵng - Đà Lạt", exp: "HSD: 30/11/2026", min: "Đơn từ 400K" },
                { code: "WELCOME2026", title: "Giảm 50.000đ cho khách hàng mới", exp: "HSD: 31/12/2026", min: "Áp dụng cho đơn đầu tiên" },
                { code: "VIPCABIN", title: "Ưu đãi 15% trải nghiệm Phòng nằm VIP", exp: "HSD: 15/12/2026", min: "Tất cả các tuyến" },
              ].map((promo) => (
                <div
                  key={promo.code}
                  style={{
                    backgroundColor: "#ffffff",
                    borderRadius: 18,
                    border: "1px solid #e2e8f0",
                    padding: 16,
                    marginBottom: 12,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    boxShadow: "0 4px 12px -2px rgba(15,23,42,0.05)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: "#eff6ff", color: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Tag size={20} />
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 800, color: "#0f172a" }}>{promo.title}</div>
                      <div style={{ fontSize: 11, color: "#64748b", margin: "2px 0 3px" }}>{promo.min} &bull; {promo.exp}</div>
                      <div style={{ display: "inline-block", backgroundColor: "#f1f5f9", padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 700, color: "#2563eb" }}>
                        Mã: {promo.code}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    style={{
                      padding: "6px 14px",
                      borderRadius: 999,
                      backgroundColor: "#2563eb",
                      color: "#ffffff",
                      border: 0,
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                    onClick={() => {
                      setPromoCode(promo.code);
                      setNotice(`Đã lưu mã ${promo.code}. Nhà xe kiểm tra mã khi bạn xác nhận đặt vé.`);
                      handleTabChange("home");
                    }}
                  >
                    Dùng
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* =========================================================================
            SCREEN 7: TÀI KHOẢN (ACCOUNT TAB)
            ========================================================================= */}
        {activeTab === "account" && flowStep === "main" && (
          <div style={{ paddingBottom: 20 }}>
            <div className="go-tickets-header" style={{ paddingBottom: 24 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ width: 56, height: 56, borderRadius: "50%", overflow: "hidden", border: "2px solid #ffffff" }}>
                  <img src="/assets/appgo/user-avatar.jpg" alt="User" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
                <div>
                  <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: "#ffffff" }}>{session.active ? session.customer?.name : "Khách DANAVA Go"}</h2>
                  <p style={{ fontSize: 12, color: "rgba(255,255,255,0.8)", margin: "2px 0 0" }}>
                    {readSavedTickets().length
                      ? `${readSavedTickets().length} vé đã lưu trên máy này`
                      : "Tra cứu vé bằng mã vé và số điện thoại"}
                  </p>
                </div>
              </div>
            </div>

            <div style={{ padding: "16px 16px 0" }}>
              <AccountPanel session={session} onOpenTicket={openTicket} onOpenNotes={() => setNotesOpen(true)} />
              <div style={{ backgroundColor: "#ffffff", borderRadius: 20, border: "1px solid #e2e8f0", overflow: "hidden", margin: "14px 0" }}>
                <div
                  style={{ padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #f1f5f9", cursor: "pointer" }}
                  onClick={() => handleTabChange("tickets")}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <Ticket size={18} color="#2563eb" />
                    <span style={{ fontSize: 14, fontWeight: 600, color: "#0f172a" }}>Vé của tôi</span>
                  </div>
                  <ChevronRight size={18} color="#94a3b8" />
                </div>
                <div
                  style={{ padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #f1f5f9", cursor: "pointer" }}
                  onClick={() => handleTabChange("promos")}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <Gift size={18} color="#2563eb" />
                    <span style={{ fontSize: 14, fontWeight: 600, color: "#0f172a" }}>Ví ưu đãi & Voucher</span>
                  </div>
                  <ChevronRight size={18} color="#94a3b8" />
                </div>
                <div
                  style={{ padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}
                  onClick={() => setSupportModalOpen(true)}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <Headphones size={18} color="#2563eb" />
                    <span style={{ fontSize: 14, fontWeight: 600, color: "#0f172a" }}>Trung tâm trợ giúp</span>
                  </div>
                  <ChevronRight size={18} color="#94a3b8" />
                </div>
              </div>

              <div style={{ textAlign: "center", marginTop: 24 }}>
                <a href="/" style={{ fontSize: 13, color: "#2563eb", fontWeight: 600, textDecoration: "none" }}>
                  &larr; Về trang chủ DANAVA Go Web
                </a>
              </div>
            </div>
          </div>
        )}

        {accountNotice && flowStep === "eticket" && (
          <AccountCreatedModal account={accountNotice} onContinue={() => setAccountNotice(null)} />
        )}
        {notesOpen && (
          <NotificationsSheet
            session={session}
            onClose={() => setNotesOpen(false)}
            onSignIn={() => {
              setNotesOpen(false);
              handleTabChange("account");
            }}
          />
        )}

        {/* =========================================================================
            BOTTOM NAVIGATION BAR (Fixed 4 Tabs)
            ========================================================================= */}
        {flowStep === "main" && (
          <div className="go-bottom-bar">
            <button
              type="button"
              className={`go-tab-item ${activeTab === "home" ? "active" : ""}`}
              onClick={() => handleTabChange("home")}
            >
              <Home size={22} strokeWidth={activeTab === "home" ? 2.5 : 2} />
              <span className="go-tab-label">Trang chủ</span>
            </button>

            <button
              type="button"
              className={`go-tab-item ${activeTab === "tickets" ? "active" : ""}`}
              onClick={() => handleTabChange("tickets")}
            >
              <Ticket size={22} strokeWidth={activeTab === "tickets" ? 2.5 : 2} />
              <span className="go-tab-label">Vé của tôi</span>
            </button>

            <button
              type="button"
              className={`go-tab-item ${activeTab === "promos" ? "active" : ""}`}
              onClick={() => handleTabChange("promos")}
            >
              <Gift size={22} strokeWidth={activeTab === "promos" ? 2.5 : 2} />
              <span className="go-tab-label">Ưu đãi</span>
            </button>

            <button
              type="button"
              className={`go-tab-item ${activeTab === "account" ? "active" : ""}`}
              onClick={() => handleTabChange("account")}
            >
              <User size={22} strokeWidth={activeTab === "account" ? 2.5 : 2} />
              <span className="go-tab-label">Tài khoản</span>
            </button>
          </div>
        )}

        {/* =========================================================================
            MODAL 1: CHỌN ĐỊA ĐIỂM (CITY PICKER BOTTOM SHEET)
            ========================================================================= */}
        {cityPickerTarget !== null && (
          <div className="go-modal-backdrop" onClick={() => setCityPickerTarget(null)}>
            <div className="go-bottom-sheet" onClick={(e) => e.stopPropagation()}>
              <div className="go-sheet-handle" />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <h3 style={{ fontSize: 17, fontWeight: 800, margin: 0, color: "#0f172a" }}>
                  {cityPickerTarget === "origin" ? "Chọn điểm đi" : "Chọn điểm đến"}
                </h3>
                <button
                  type="button"
                  onClick={() => setCityPickerTarget(null)}
                  style={{ background: "none", border: 0, cursor: "pointer", color: "#64748b" }}
                >
                  <X size={20} />
                </button>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {cities.map((city) => (
                  <button
                    key={city}
                    type="button"
                    style={{
                      padding: "12px 14px",
                      borderRadius: 14,
                      border: "1px solid #e2e8f0",
                      backgroundColor: (cityPickerTarget === "origin" && origin === city) || (cityPickerTarget === "dest" && destination === city) ? "#eff6ff" : "#ffffff",
                      borderColor: (cityPickerTarget === "origin" && origin === city) || (cityPickerTarget === "dest" && destination === city) ? "#2563eb" : "#e2e8f0",
                      color: (cityPickerTarget === "origin" && origin === city) || (cityPickerTarget === "dest" && destination === city) ? "#2563eb" : "#0f172a",
                      fontSize: 14,
                      fontWeight: 700,
                      textAlign: "left",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                    onClick={() => {
                      if (cityPickerTarget === "origin") setOrigin(city);
                      else setDestination(city);
                      setCityPickerTarget(null);
                    }}
                  >
                    <MapPin size={16} />
                    <span>{city}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            MODAL 3: ĐIỂM ĐÓN / TRẢ — choose while booking, view from a ticket
            ========================================================================= */}
        {pickupModal && (() => {
          const selecting = pickupModal === "select";
          const trip = selecting ? selectedTrip : booking?.trip;
          if (!trip) return null;
          const chosenPick = selecting ? pickupId : booking?.passenger.pickupStopId;
          const chosenDrop = selecting ? dropoffId : booking?.passenger.dropoffStopId;
          const pickStop = findStop(trip.departureStops, chosenPick || "");
          const stopList = (title: string, stops: typeof trip.departureStops, chosen: string | undefined, onPick: (id: string) => void) => (
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#2563eb", marginBottom: 6 }}>{title}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {(selecting ? stops : stops.filter((s) => s.id === chosen)).map((s) => {
                  const active = s.id === chosen;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      disabled={!selecting}
                      onClick={() => onPick(s.id)}
                      style={{ textAlign: "left", padding: 12, borderRadius: 14, cursor: selecting ? "pointer" : "default", font: "inherit", background: active ? "#eff6ff" : "#f8fafc", border: `1.5px solid ${active ? "#2563eb" : "#e2e8f0"}`, color: "#0f172a" }}
                    >
                      <div style={{ fontSize: 13, fontWeight: 700 }}>{s.time ? `${s.time} · ` : ""}{s.name}</div>
                      {s.address && <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{s.address}</div>}
                    </button>
                  );
                })}
                {stops.length === 0 && <div style={{ fontSize: 12, color: "#64748b" }}>Nhà xe chưa khai báo điểm này.</div>}
              </div>
            </div>
          );
          return (
            <div className="go-modal-backdrop" onClick={() => setPickupModal(null)}>
              <div className="go-bottom-sheet" style={{ maxHeight: "85vh", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>
                <div className="go-sheet-handle" />
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <h3 style={{ fontSize: 17, fontWeight: 800, margin: 0, color: "#0f172a" }}>
                    {selecting ? "Chọn điểm đón & trả" : "Điểm đón & trả của vé"}
                  </h3>
                  <button type="button" aria-label="Đóng" onClick={() => setPickupModal(null)} style={{ background: "none", border: 0, cursor: "pointer", color: "#64748b" }}>
                    <X size={20} />
                  </button>
                </div>
                {stopList(`📍 Điểm đón tại ${trip.from}`, trip.departureStops, chosenPick, (id) => setPickupId(id))}
                {stopList(`🏁 Điểm trả tại ${trip.to}`, trip.dropoffStops, chosenDrop, (id) => setDropoffId(id))}
                {selecting && (
                  <button type="button" className="go-btn-primary" onClick={() => setPickupModal(null)}>
                    <CheckCircle2 size={18} />
                    <span>Xong{pickStop ? ` · đón ${pickStop.time || ""} ${pickStop.name}` : ""}</span>
                  </button>
                )}
              </div>
            </div>
          );
        })()}

        {/* =========================================================================
            MODAL 4: HỖ TRỢ / TỔNG ĐÀI
            ========================================================================= */}
        {supportModalOpen && (
          <div className="go-modal-backdrop" onClick={() => setSupportModalOpen(false)}>
            <div className="go-bottom-sheet" onClick={(e) => e.stopPropagation()}>
              <div className="go-sheet-handle" />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <h3 style={{ fontSize: 17, fontWeight: 800, margin: 0, color: "#0f172a" }}>Trung tâm hỗ trợ hành khách</h3>
                <button type="button" onClick={() => setSupportModalOpen(false)} style={{ background: "none", border: 0, cursor: "pointer", color: "#64748b" }}>
                  <X size={20} />
                </button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <a
                  href="tel:19001234"
                  style={{
                    padding: "12px 16px",
                    borderRadius: 14,
                    backgroundColor: "#eff6ff",
                    border: "1px solid rgba(191,219,254,0.7)",
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    textDecoration: "none",
                    color: "#0f172a",
                  }}
                >
                  <Phone size={20} color="#2563eb" />
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>Tổng đài đặt vé & hỗ trợ 24/7</div>
                    <div style={{ fontSize: 12, color: "#2563eb", fontWeight: 800 }}>1900 1234 (1.000đ/phút)</div>
                  </div>
                </a>
                <a
                  href="mailto:support@danavago.vn"
                  style={{
                    padding: "12px 16px",
                    borderRadius: 14,
                    backgroundColor: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    textDecoration: "none",
                    color: "#0f172a",
                  }}
                >
                  <Mail size={20} color="#2563eb" />
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>Email hỗ trợ dịch vụ</div>
                    <div style={{ fontSize: 12, color: "#64748b" }}>hotro@danavago.vn</div>
                  </div>
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Policy Modal */}
        {policyModalOpen && (
          <div className="go-modal-backdrop" onClick={() => setPolicyModalOpen(false)}>
            <div className="go-bottom-sheet" onClick={(e) => e.stopPropagation()}>
              <div className="go-sheet-handle" />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: "#0f172a" }}>Chính sách nhà xe DANAVA Travel</h3>
                <button
                  type="button"
                  onClick={() => setPolicyModalOpen(false)}
                  style={{ background: "none", border: 0, cursor: "pointer", color: "#64748b" }}
                >
                  <X size={20} />
                </button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={{ backgroundColor: "#f8fafc", borderRadius: 14, padding: 14, border: "1px solid #e2e8f0" }}>
                  <h4 style={{ fontSize: 14, fontWeight: 700, margin: "0 0 6px", color: "#0f172a" }}>1. Chính sách hoàn hủy</h4>
                  <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12.5, color: "#475569", lineHeight: 1.6 }}>
                    <li>Hủy trước 24 giờ khởi hành: Phí 0% (Hoàn tiền 100%).</li>
                    <li>Hủy trước 12-24 giờ: Phí 20% giá vé.</li>
                    <li>Hủy trong vòng 12 giờ: Không hoàn tiền.</li>
                  </ul>
                </div>

                <div style={{ backgroundColor: "#f8fafc", borderRadius: 14, padding: 14, border: "1px solid #e2e8f0" }}>
                  <h4 style={{ fontSize: 14, fontWeight: 700, margin: "0 0 6px", color: "#0f172a" }}>2. Hành lý mang theo</h4>
                  <p style={{ margin: 0, fontSize: 12.5, color: "#475569", lineHeight: 1.6 }}>
                    Mỗi hành khách được miễn phí tối đa 20kg hành lý ký gửi và 1 balo/túi xách xách tay. Vui lòng không mang chất dễ cháy nổ hoặc hàng cấm.
                  </p>
                </div>

                <div style={{ backgroundColor: "#f8fafc", borderRadius: 14, padding: 14, border: "1px solid #e2e8f0" }}>
                  <h4 style={{ fontSize: 14, fontWeight: 700, margin: "0 0 6px", color: "#0f172a" }}>3. Trẻ em &amp; Người đi kèm</h4>
                  <p style={{ margin: 0, fontSize: 12.5, color: "#475569", lineHeight: 1.6 }}>
                    Trẻ em dưới 5 tuổi hoặc cao dưới 100cm được miễn vé khi nằm chung giường với người lớn. Trẻ từ 5 tuổi trở lên cần mua vé riêng.
                  </p>
                </div>

                <button
                  type="button"
                  style={{
                    backgroundColor: "#2563eb",
                    color: "#ffffff",
                    fontWeight: 700,
                    fontSize: 14,
                    padding: "12px",
                    borderRadius: 14,
                    border: 0,
                    cursor: "pointer",
                    marginTop: 6,
                  }}
                  onClick={() => setPolicyModalOpen(false)}
                >
                  Đã hiểu
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DanavaGoApp;
