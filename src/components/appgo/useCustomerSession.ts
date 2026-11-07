import { useCallback, useEffect, useState } from "react";
import type { Booking } from "../../types";
import {
  changePassword,
  customerBookings,
  customerLogin,
  customerNotifications,
  staffLogin,
  loadSession,
  logoutSession,
  readCustomerNotifications,
  type CustomerNotification,
  type OperatorUser,
} from "../../services/platformApi";
import { normalizeVietnamPhone } from "../../utils/phoneUtils";

/**
 * Who uses the app:
 * - customer: account created at checkout (login = phone, temporary password;
 *   the first sign-in forces a new password) — book, tickets, trip tracking.
 * - crew (tài xế / lơ xe): Studio email login — today's assigned trips, ticket
 *   scan bound to that bus, phone GPS for the trip.
 * - management (owner, manager, dispatcher, platform): customer features plus
 *   the "Quản lý" tab (today's trips, live map, scan) and a link to Studio.
 */
export type AppRole = "guest" | "customer" | "crew" | "management" | "staff";
export function appRole(user: OperatorUser | null): AppRole {
  if (!user) return "guest";
  if (user.role === "customer") return "customer";
  if (user.role === "driver" || user.role === "assistant") return "crew";
  if (["owner", "manager", "dispatcher", "platform"].includes(user.role)) return "management";
  return "staff";
}
export function useCustomerSession() {
  const [user, setUser] = useState<OperatorUser | null>(null);
  const [ready, setReady] = useState(false);
  const [notes, setNotes] = useState<CustomerNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const [bookings, setBookings] = useState<Booking[]>([]);

  const customer = user?.role === "customer" ? user : null;
  const active = !!customer && !customer.mustChangePassword;
  const role = appRole(user);
  const staff = user && user.role !== "customer" ? user : null;

  const refresh = useCallback(async () => {
    try {
      const [n, b] = await Promise.all([customerNotifications(), customerBookings()]);
      setNotes(n.items);
      setUnread(n.unread);
      setBookings(b.items);
    } catch {
      /* signed out or offline: keep what we have */
    }
  }, []);

  useEffect(() => {
    loadSession()
      .then((s) => setUser(s.user))
      .catch(() => setUser(null))
      .finally(() => setReady(true));
  }, []);

  useEffect(() => {
    if (!active) return;
    // Loaded once per sign-in and then every minute while the app is open.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh();
    const t = window.setInterval(refresh, 60000);
    return () => window.clearInterval(t);
  }, [active, refresh]);

  return {
    ready,
    user,
    role,
    staff,
    customer,
    active,
    notes,
    unread,
    bookings,
    refresh,
    login: async (phone: string, password: string) => setUser((await customerLogin(normalizeVietnamPhone(phone), password)).user),
    staffLogin: async (email: string, password: string) => setUser((await staffLogin(email, password)).user),
    changePassword: async (current: string, next: string) => setUser((await changePassword(current, next)).user),
    logout: async () => {
      await logoutSession().catch(() => undefined);
      setUser(null);
      setNotes([]);
      setUnread(0);
      setBookings([]);
    },
    markRead: async () => {
      if (!unread) return;
      await readCustomerNotifications().catch(() => undefined);
      setUnread(0);
      setNotes((list) => list.map((n) => ({ ...n, read: true })));
    },
  };
}
export type CustomerSession = ReturnType<typeof useCustomerSession>;
