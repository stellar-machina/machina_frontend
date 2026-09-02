// Builds the Content-Security-Policy and other security hardening headers
// served by every route in the dashboard.
//
// Designed to be consumed by `next.config.ts`'s `headers()` callback at
// build time. `apiBase` is read from `NEXT_PUBLIC_MACHINA_API_BASE` so
// `connect-src` always lines up with the backend the client actually fetches.

import { DEFAULT_API_BASE } from "./resolveApiBase";

const DEFAULT_PERMISSIONS_POLICY = [
  "camera=()",
  "microphone=()",
  "geolocation=()",
  "payment=()",
  "browsing-topics=()",
  "interest-cohort=()",
].join(", ");

export type BuildSecurityHeadersOptions = {
  /** Resolved API base URL; the `origin` is added to `connect-src`. */
  apiBase: string;
  /** Whether the build is a development build (drives script-src). */
  isDev?: boolean;
};

/**
 * Extract the origin from a resolved API base URL. Falls back to the
 * localhost default if `apiBase` cannot be parsed. We always preserve the
 * scheme (http / https) so the CSP matches the request actually issued.
 */
export function originOf(apiBase: string): string {
  try {
    return new URL(apiBase).origin;
  } catch {
    return new URL(DEFAULT_API_BASE).origin;
  }
}

/**
 * Build a Content-Security-Policy value that:
 *   - restricts scripts to self with `'unsafe-inline'` in production (Next.js
 *     emits an inline bootstrap script for hydration when CSP is set via
 *     `next.config.ts` `headers()` rather than nonce-aware middleware) and
 *     adds `'unsafe-eval'` in development for Fast Refresh
 *   - restricts styles to self with `'unsafe-inline'` because next/font and
 *     Next.js inject style tags at build time
 *   - allows `connect-src` to the configured API origin + 'self'
 *   - blocks framing, dangerous objects, and base-uri injection
 *   - keeps `<a href>` navigation to external sites working (the CSP spec
 *     does not restrict top-level navigations unless you opt into
 *     `navigate-to`, which we deliberately don't)
 */
export function buildCsp(options: BuildSecurityHeadersOptions): string {
  const { apiBase, isDev = false } = options;
  const apiOrigin = originOf(apiBase);

  const scriptSrc = ["'self'", "'unsafe-inline'", isDev ? "'unsafe-eval'" : ""]
    .filter(Boolean)
    .join(" ");

  const directives: Record<string, string[]> = {
    "default-src": ["'self'"],
    "script-src": [scriptSrc],
    "style-src": ["'self'", "'unsafe-inline'"],
    "font-src": ["'self'", "data:"],
    "img-src": ["'self'", "data:"],
    "connect-src": ["'self'", apiOrigin],
    "frame-ancestors": ["'none'"],
    "form-action": ["'self'"],
    "base-uri": ["'self'"],
    "object-src": ["'none'"],
  };

  return Object.entries(directives)
    .map(([key, values]) => `${key} ${values.join(" ")}`)
    .join("; ");
}

/**
 * Build the full map of HTTP response headers served by the app. The keys
 * match what Next.js's `headers()` callback accepts.
 *
 * `Strict-Transport-Security` is intentionally omitted in development so
 * browsers don't cache the upgrade decision against the dev server.
 */
export function defaultSecurityHeaders(
  options: BuildSecurityHeadersOptions
): Record<string, string> {
  const { isDev = false } = options;
  const headers: Record<string, string> = {
    "Content-Security-Policy": buildCsp(options),
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "X-Frame-Options": "DENY",
    "Permissions-Policy": DEFAULT_PERMISSIONS_POLICY,
  };
  if (!isDev) {
    headers["Strict-Transport-Security"] =
      "max-age=63072000; includeSubDomains; preload";
  }
  return headers;
}

/**
 * Resolve the API base URL in a way that works both at build time (when
 * `next.config.ts` runs) and at runtime (re-export for tests).
 */
export { resolveApiBase } from "./resolveApiBase";
