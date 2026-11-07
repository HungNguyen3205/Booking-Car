import { crewApi, type CheckinTrip, type LiveTrip } from "../../services/crewApi";
import { addDaysToDateStr, getVietnamTodayDateStr } from "../../utils/dateUtils";

/** Helpers shared by the crew screens, the owner "Quản lý" tab and trip tracking. */
export type OpsTrip = LiveTrip & { counts?: CheckinTrip };

export const vnTime = (iso: string, withDate = false) =>
  new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    hour: "2-digit",
    minute: "2-digit",
    ...(withDate ? { day: "2-digit", month: "2-digit" } : {}),
  }).format(new Date(iso));

/** Today's trips in the signed-in staff's scope (+ overnight trips still running from yesterday). */
export async function loadOpsTrips(): Promise<OpsTrip[]> {
  const today = getVietnamTodayDateStr();
  const yesterday = addDaysToDateStr(today, -1);
  const [live, prev, counts] = await Promise.all([crewApi.live(today), crewApi.live(yesterday), crewApi.trips(today).catch(() => null)]);
  const list = [...prev.data.trips.filter((t) => t.state === "running"), ...live.data.trips];
  const byId = new Map((counts?.data.trips ?? []).map((c) => [c.id, c]));
  return list.map((t) => ({ ...t, counts: byId.get(t.trip.id) }));
}

/** Studio for the full back office: /manage locally, studio.{root} in production. */
export function studioUrl() {
  const host = window.location.hostname;
  if (["localhost", "127.0.0.1", "terminal.local"].includes(host)) return "/manage";
  return `https://studio.${import.meta.env.VITE_APP_ROOT || "danavago.com"}`;
}
