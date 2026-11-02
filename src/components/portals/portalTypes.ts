export interface OperatorProfile {
  id: string;
  name: string;
  slug: string;
  phone: string;
  email: string;
  description: string;
  address: string;
  color: string;
  logo: string;
  hero: string;
  policies: string;
  nextDepartureDate?: string;
  appEnabled: boolean;
  appUrl: string;
  profileUrl: string;
  routes: {
    id: string;
    from: string;
    to: string;
    name: string;
    durationMinutes: number;
  }[];
  vehicles: {
    id: string;
    name: string;
    category: string;
    capacity: number;
    image: string;
    amenities: string[];
    description: string;
  }[];
}
export const localPortal = () =>
  ["localhost", "127.0.0.1", "terminal.local"].includes(
    window.location.hostname,
  );
export const profileLink = (o: { slug: string; profileUrl?: string }) =>
  localPortal() ? "/nha-xe/" + o.slug : o.profileUrl || "/nha-xe/" + o.slug;
export const appLink = (o: OperatorProfile) =>
  !o.appEnabled
    ? "/app?operator=" + o.id
    : localPortal()
      ? "/app/" + o.slug
      : o.appUrl;

export const brandInk = (color: string) => {
  const h = color.replace("#", "");
  if (!/^[0-9a-f]{6}$/i.test(h)) return "#fff";
  const r = parseInt(h.slice(0, 2), 16),
    g = parseInt(h.slice(2, 4), 16),
    b = parseInt(h.slice(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 155 ? "#102744" : "#fff";
};
