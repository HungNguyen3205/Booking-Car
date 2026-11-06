/**
 * Which DANAVA GO app a URL opens. One build serves every hostname; the
 * backend (PortalService) separately decides which hosts are allowed and
 * which tenant a host belongs to — this only picks the frontend shell.
 *
 * Production map (root = danavago.com, override with VITE_APP_ROOT):
 *   danavago.com, www.     -> website   (homepage hero + booking)
 *   app.danavago.com       -> appgo     (DANAVA Go customer app, all operators)
 *   studio.danavago.com    -> studio    (one Studio for platform admins and operators)
 *   admin.danavago.com     -> legacy alias, redirected to studio.danavago.com
 *   danava.com/nha-xe/{s}  -> profile   (operator profile page)
 *   {slug}.danavago.com,
 *   verified own domains   -> operator-app (branded tenant app)
 *
 * Local/preview paths keep working on any known host:
 *   /manage -> studio (/admin is a legacy alias redirected to /manage) ·
 *   /appgo -> appgo · /nha-xe/{s} -> profile · /app, /app/{slug} -> operator-app.
 */
export type Surface = "website" | "appgo" | "studio" | "profile" | "operator-app";

export const DEFAULT_APP_ROOT = "danavago.com";
const PROFILE_HOSTS = ["danava.com", "www.danava.com"];
const LOCAL_HOSTS = ["localhost", "127.0.0.1", "terminal.local"];

export function resolveSurface(
  hostname: string,
  pathname: string,
  root: string = DEFAULT_APP_ROOT,
): Surface {
  const host = hostname.toLowerCase().replace(/\.$/, "");
  const base = root.toLowerCase();
  const path = pathname || "/";
  const under = (prefix: string) =>
    path === prefix || path.startsWith(prefix + "/");

  // Dedicated subdomains win over paths, so studio.danavago.com/anything is Studio.
  if (host === `studio.${base}` || host === `admin.${base}`) return "studio";
  if (host === `app.${base}`) return "appgo";

  const known =
    host === base ||
    host === `www.${base}` ||
    PROFILE_HOSTS.includes(host) ||
    LOCAL_HOSTS.includes(host);

  if (!known) return "operator-app"; // tenant subdomain or verified own domain
  if (under("/manage") || under("/admin")) return "studio";
  if (/^\/nha-xe\//.test(path)) return "profile";
  if (under("/appgo")) return "appgo";
  if (under("/app")) return "operator-app";
  return "website";
}

/**
 * /admin and admin.{root} used to open the same Studio as /manage and
 * studio.{root}. They are kept only as aliases: returns the canonical URL to
 * redirect to, or null when the URL is already canonical.
 */
export function canonicalStudioUrl(
  url: { protocol: string; hostname: string; port?: string; pathname: string; search: string; hash: string },
  root: string = DEFAULT_APP_ROOT,
): string | null {
  const host = url.hostname.toLowerCase().replace(/\.$/, "");
  const base = root.toLowerCase();
  const path = url.pathname || "/";
  const tail = `${url.search}${url.hash}`;
  const isAdminPath = path === "/admin" || path.startsWith("/admin/");
  const studioPath = isAdminPath ? "/manage" + path.slice("/admin".length) : path;
  if (host === `admin.${base}`) {
    const port = url.port ? `:${url.port}` : "";
    return `${url.protocol}//studio.${base}${port}${studioPath}${tail}`;
  }
  if (isAdminPath && resolveSurface(host, path, root) === "studio") return `${studioPath}${tail}`;
  return null;
}
