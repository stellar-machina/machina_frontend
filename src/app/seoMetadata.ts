export const publicStaticRoutes = ["/", "/about", "/docs", "/changelog"] as const;

export const operatorOnlyRoutes = [
  "/admin",
  "/api-keys",
  "/webhooks",
  "/settings",
] as const;

const DEFAULT_SITE_ORIGIN = "http://localhost:3000";

export function resolveSiteOrigin(env = process.env): string {
  const rawOrigin = env.NEXT_PUBLIC_MACHINA_SITE_ORIGIN?.trim() || DEFAULT_SITE_ORIGIN;
  return rawOrigin.replace(/\/+$/, "");
}

export function absoluteSiteUrl(pathname: string): string {
  return new URL(pathname, `${resolveSiteOrigin()}/`).toString();
}
