import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { LiveTrip, TrackingPosition, TrackingStop } from "../../services/crewApi";

/**
 * OpenStreetMap + Leaflet map of a trip (or several running trips).
 * - dashed line: the registered route (stops with coordinates, in order)
 * - solid line: where the bus actually went (GPS path)
 * - bus dot: last position; red when off route, grey when the signal is stale.
 * Plain Leaflet (no react-leaflet) and DOM markers, so no image assets.
 */
type Props = {
  stops?: TrackingStop[];
  path?: [number, number][];
  position?: TrackingPosition | null;
  /** Owner overview: one dot per running trip. */
  fleet?: LiveTrip[];
  height?: number;
};

// Public OSM tiles are rate-limited and not for heavy production use; set
// VITE_MAP_TILE_URL (and VITE_MAP_ATTRIBUTION) to a tile provider for production.
const TILES = import.meta.env.VITE_MAP_TILE_URL || "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
const ATTRIBUTION = import.meta.env.VITE_MAP_ATTRIBUTION || "&copy; OpenStreetMap";
const VIETNAM: L.LatLngExpression = [16.05, 107.6];

const busIcon = (state: "ok" | "off" | "stale", label?: string) =>
  L.divIcon({
    className: "",
    html: `<div class="go-map-bus go-map-bus--${state}">${label ? `<span>${label}</span>` : ""}</div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });

const escape = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string);

export function TripMap({ stops = [], path = [], position = null, fleet, height = 260 }: Props) {
  const box = useRef<HTMLDivElement | null>(null);
  const map = useRef<L.Map | null>(null);
  const layer = useRef<L.LayerGroup | null>(null);
  const fitted = useRef(false);

  useEffect(() => {
    if (!box.current || map.current) return;
    const m = L.map(box.current, { zoomControl: true, attributionControl: true }).setView(VIETNAM, 6);
    L.tileLayer(TILES, { maxZoom: 18, attribution: ATTRIBUTION }).addTo(m);
    map.current = m;
    layer.current = L.layerGroup().addTo(m);
    return () => {
      m.remove();
      map.current = null;
      layer.current = null;
      fitted.current = false;
    };
  }, []);

  useEffect(() => {
    const m = map.current;
    const g = layer.current;
    if (!m || !g) return;
    g.clearLayers();
    const bounds: L.LatLngExpression[] = [];

    const geoStops = stops.filter((s) => s.lat != null && s.lng != null);
    if (geoStops.length >= 2) {
      L.polyline(geoStops.map((s) => [s.lat!, s.lng!] as [number, number]), { color: "#64748b", weight: 3, dashArray: "6 8", opacity: 0.8 }).addTo(g);
    }
    for (const s of geoStops) {
      const ll: [number, number] = [s.lat!, s.lng!];
      bounds.push(ll);
      L.circleMarker(ll, { radius: 6, color: "#fff", weight: 2, fillColor: s.kind === "pickup" ? "#16a34a" : "#dc2626", fillOpacity: 1 })
        .bindPopup(`<strong>${escape(s.name)}</strong><br/>${s.kind === "pickup" ? "Điểm đón" : "Điểm trả"} · ${escape(s.time)}`)
        .addTo(g);
    }
    if (path.length >= 2) {
      // Brand colour (SVG attributes do not resolve CSS variables).
      const brand = (box.current && getComputedStyle(box.current).getPropertyValue("--go-primary").trim()) || "#2563eb";
      L.polyline(path, { color: brand, weight: 4, opacity: 0.9 }).addTo(g);
      bounds.push(...path);
    }
    if (position) {
      const ll: [number, number] = [position.lat, position.lng];
      bounds.push(ll);
      L.marker(ll, { icon: busIcon(position.stale ? "stale" : position.offRoute ? "off" : "ok") }).addTo(g);
    }
    for (const f of fleet ?? []) {
      if (!f.position) continue;
      const ll: [number, number] = [f.position.lat, f.position.lng];
      bounds.push(ll);
      L.marker(ll, { icon: busIcon(f.position.stale ? "stale" : f.position.offRoute ? "off" : "ok", f.trip.plate || undefined) })
        .bindPopup(`<strong>${escape(f.trip.from)} → ${escape(f.trip.to)}</strong><br/>${escape(f.trip.plate)}${f.position.offRoute ? "<br/><b style='color:#dc2626'>Đang lệch tuyến</b>" : ""}`)
        .addTo(g);
    }
    // Fit once; afterwards follow the bus without fighting the user's zoom.
    if (!fitted.current && bounds.length) {
      // No zoom animation on the first fit: an animation racing the sheet's
      // resize leaves tiles unloaded.
      m.invalidateSize({ pan: false });
      m.fitBounds(L.latLngBounds(bounds), { padding: [28, 28], maxZoom: 14, animate: false });
      fitted.current = true;
    } else if (position && !fleet) {
      m.panTo([position.lat, position.lng], { animate: true });
    }
  }, [stops, path, position, fleet]);

  // The map is often created inside a sheet that is still animating open:
  // re-measure whenever the box changes size so no grey tiles remain.
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const t = window.setTimeout(() => map.current?.invalidateSize(), 300);
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(() => map.current?.invalidateSize()) : null;
    ro?.observe(el);
    return () => {
      window.clearTimeout(t);
      ro?.disconnect();
    };
  }, []);

  return <div ref={box} className="go-trip-map" style={{ height }} role="img" aria-label="Bản đồ hành trình" />;
}
