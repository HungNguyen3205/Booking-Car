import type { CSSProperties } from "react";
import type { OperatorProfile } from "../portals/portalTypes";

/**
 * One appgo, many brands. DANAVA Go (app.danavago.com, /appgo) is the default
 * platform brand; an operator app ({slug}.danavago.com, verified own domain,
 * local /app/{slug}) is the same app with the operator's colour, logo and
 * cover from Studio → App & Tên miền. Only branding differs: search, seats,
 * hold, checkout, tickets and accounts are shared code and the server scopes
 * every request to the hostname's tenant.
 */
export interface AppBrand {
  mode: "platform" | "operator";
  /** Tenant id; sent as `operator` on search so local /app/{slug} is scoped too. */
  operatorId?: string;
  slug?: string;
  name: string;
  /** Operator logo URL; without one the name is shown as a wordmark. */
  logo?: string;
  /** Home cover image; empty = brand-colour gradient. */
  hero: string;
  /** Ticket banner art; empty = brand-colour banner only. */
  ticketArt: string;
  /** One hex colour; every shade is derived from it. */
  color: string;
  /** Dark ink for text on a light brand colour (e.g. brown on amber); derived when absent. */
  ink?: string;
  hotline: string;
  email: string;
  /** Operator home: big headline (e.g. "Đi êm ái. Đến an tâm.") and the line under the name. */
  slogan?: string;
  tagline?: string;
  /** Description shown under the slogan. */
  description?: string;
  policies?: string;
  /** First route, used as the default search. */
  defaultRoute?: { from: string; to: string; date?: string };
  /** Operator routes, shown instead of the platform's featured destinations. */
  routes?: { from: string; to: string; durationMinutes?: number }[];
}

export const DANAVA_BRAND: AppBrand = {
  mode: "platform",
  name: "DANAVA Go",
  hero: "/assets/appgo/hero-bg-clean.jpg",
  ticketArt: "/assets/appgo/ticket-night-bus.png",
  color: "#2563eb",
  hotline: "1900 1234",
  email: "hotro@danavago.vn",
};

const HEX = /^#[0-9a-f]{6}$/i;
export const validBrandColor = (c: string | undefined): c is string => !!c && HEX.test(c.trim());

/** Relative luminance check: dark ink on light brand colours, white otherwise. */
export function brandInk(color: string) {
  if (!validBrandColor(color)) return "#ffffff";
  const h = color.slice(1);
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
  return (r * 299 + g * 587 + b * 114) / 1000 > 165 ? "#0f172a" : "#ffffff";
}

/**
 * CSS variables for a brand. The platform brand returns nothing so the
 * literals in danava-go-app.css stay exactly as designed.
 */
export function brandVars(brand: AppBrand): CSSProperties {
  if (brand.mode === "platform" || !validBrandColor(brand.color)) return {};
  const c = brand.color;
  const mix = (amount: number, other: string) => `color-mix(in srgb, ${c} ${amount}%, ${other})`;
  // Light colours (amber, yellow…) cannot carry white text or be used as text on white.
  const light = brandInk(c) !== "#ffffff";
  const ink = validBrandColor(brand.ink) ? brand.ink : mix(30, "black");
  return {
    "--go-primary": c,
    "--go-primary-text": light ? ink : c,
    "--go-on-primary": light ? ink : "#ffffff",
    "--go-primary-dark": light ? mix(62, "black") : mix(82, "black"),
    // Deep shade = headers, ticket banners, wordmark on white: the brown ink for light brands.
    "--go-primary-deep": light ? ink : mix(55, "black"),
    "--go-primary-light": mix(8, "white"),
    "--go-primary-soft": mix(18, "white"),
    "--go-primary-pale": mix(45, "white"),
    "--go-primary-bright": mix(80, "white"),
    "--go-primary-glow": mix(18, "transparent"),
    "--go-accent": mix(55, "white"),
    "--go-accent-dark": mix(90, "black"),
  } as CSSProperties;
}

export function operatorBrand(o: OperatorProfile): AppBrand {
  // The API lists newest routes first; the operator's main route is the first one created.
  const routes = [...(o.routes || [])].reverse();
  const route = routes[0];
  return {
    mode: "operator",
    operatorId: o.id,
    slug: o.slug,
    name: o.name,
    logo: o.logo || undefined,
    // No fallback artwork: DANAVA covers and city photos must not stand in
    // for an operator's own brand.
    hero: o.hero || "",
    ticketArt: o.hero || "",
    color: validBrandColor(o.color) ? o.color.trim() : DANAVA_BRAND.color,
    ink: validBrandColor(o.ink) ? o.ink : undefined,
    hotline: o.phone || "",
    email: o.email || "",
    slogan: o.slogan || undefined,
    tagline: o.tagline || undefined,
    description: o.description || undefined,
    policies: o.policies || undefined,
    defaultRoute: route ? { from: route.from, to: route.to, date: o.nextDepartureDate || undefined } : undefined,
    routes: routes.map((r) => ({ from: r.from, to: r.to, durationMinutes: r.durationMinutes })),
  };
}

/** "0777500500" -> "0777 500 500" for display. */
export const formatHotline = (p: string) => (/^\d{10}$/.test(p) ? `${p.slice(0, 4)} ${p.slice(4, 7)} ${p.slice(7)}` : p);

/** localStorage key per brand: local /app/a and /app/b share one origin. */
export const brandStorageKey = (base: string, brand: AppBrand) =>
  brand.mode === "operator" && brand.slug ? `${base}.${brand.slug}` : base;
