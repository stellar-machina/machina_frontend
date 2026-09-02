import {
  buildCsp,
  defaultSecurityHeaders,
  originOf,
  resolveApiBase,
  type BuildSecurityHeadersOptions,
} from "../securityHeaders";

const prod: BuildSecurityHeadersOptions = {
  apiBase: "https://api.example.com",
};
const dev: BuildSecurityHeadersOptions = {
  apiBase: "https://api.example.com",
  isDev: true,
};

describe("originOf", () => {
  it("returns origin for a fully qualified URL", () => {
    expect(originOf("https://api.example.com/v1")).toBe("https://api.example.com");
  });

  it("returns origin for a URL with a port", () => {
    expect(originOf("http://localhost:3001")).toBe("http://localhost:3001");
  });

  it("falls back to the localhost default origin for unparseable input", () => {
    expect(originOf("not a url")).toBe("http://localhost:3001");
  });
});

describe("buildCsp", () => {
  it("includes default-src 'self'", () => {
    expect(buildCsp(prod)).toMatch(/default-src 'self'/);
  });

  it("includes the api origin in connect-src", () => {
    const csp = buildCsp({ apiBase: "https://api.example.com" });
    expect(csp).toContain("connect-src 'self' https://api.example.com");
  });

  it("preserves a localhost origin in connect-src", () => {
    const csp = buildCsp({ apiBase: "http://localhost:3001" });
    expect(csp).toContain("connect-src 'self' http://localhost:3001");
  });

  it("includes 'self' for script-src in production", () => {
    expect(buildCsp(prod)).toMatch(/script-src 'self'/);
    expect(buildCsp(prod)).not.toMatch(/script-src[^;]*'unsafe-eval'/);
  });

  it("includes 'unsafe-inline' in production script-src so Next.js hydration scripts run", () => {
    // next.config.ts headers() does not participate in the middleware nonce
    // pipeline; without 'unsafe-inline' the inline __NEXT_DATA__ block would
    // be blocked. If a future change removes this, add nonce-aware middleware
    // at the same time.
    expect(buildCsp(prod)).toMatch(/script-src[^;]*'unsafe-inline'/);
  });

  it("adds 'unsafe-eval' to script-src in development for Fast Refresh", () => {
    expect(buildCsp(dev)).toContain("'unsafe-eval'");
  });

  it("includes 'unsafe-inline' for style-src because next/font injects styles", () => {
    expect(buildCsp(prod)).toContain("style-src 'self' 'unsafe-inline'");
  });

  it("adds font data: uri support for icon fonts and font subsets", () => {
    expect(buildCsp(prod)).toContain("font-src 'self' data:");
  });

  it("adds img-src data: support", () => {
    expect(buildCsp(prod)).toContain("img-src 'self' data:");
  });

  it("disallows framing (clickjacking protection) via frame-ancestors", () => {
    expect(buildCsp(prod)).toContain("frame-ancestors 'none'");
  });

  it("disallows object-src entirely", () => {
    expect(buildCsp(prod)).toContain("object-src 'none'");
  });

  it("locks down form-action and base-uri to self", () => {
    expect(buildCsp(prod)).toContain("form-action 'self'");
    expect(buildCsp(prod)).toContain("base-uri 'self'");
  });

  it("does not include a `navigate-to` directive so external <a> links open normally", () => {
    expect(buildCsp(prod)).not.toMatch(/navigate-to/);
  });

  it("separates directives with semicolons", () => {
    const csp = buildCsp(prod);
    const segments = csp.split("; ");
    expect(segments.length).toBeGreaterThanOrEqual(8);
  });
});

describe("defaultSecurityHeaders", () => {
  it("returns every required hardening header (including HSTS) in production", () => {
    const headers = defaultSecurityHeaders(prod);
    expect(headers["Content-Security-Policy"]).toBeTruthy();
    expect(headers["X-Content-Type-Options"]).toBe("nosniff");
    expect(headers["Referrer-Policy"]).toBe("strict-origin-when-cross-origin");
    expect(headers["X-Frame-Options"]).toBe("DENY");
    expect(headers["Permissions-Policy"]).toBeTruthy();
    expect(headers["Strict-Transport-Security"]).toMatch(/max-age=/);
  });

  it("omits Strict-Transport-Security in development so browsers don't cache the upgrade", () => {
    const headers = defaultSecurityHeaders({ apiBase: "http://localhost:3001", isDev: true });
    expect(headers["Strict-Transport-Security"]).toBeUndefined();
    // Baseline headers should still be present in dev.
    expect(headers["X-Content-Type-Options"]).toBe("nosniff");
    expect(headers["X-Frame-Options"]).toBe("DENY");
    expect(headers["Referrer-Policy"]).toBe("strict-origin-when-cross-origin");
    expect(headers["Content-Security-Policy"]).toContain("script-src 'self' 'unsafe-inline' 'unsafe-eval'");
  });

  it("disables a wide set of potentially sensitive browser features by default", () => {
    const pp = defaultSecurityHeaders(prod)["Permissions-Policy"];
    expect(pp).toContain("camera=()");
    expect(pp).toContain("microphone=()");
    expect(pp).toContain("geolocation=()");
    expect(pp).toContain("payment=()");
    expect(pp).toContain("interest-cohort=()");
  });

  it("derives the CSP connect-src from the api base", () => {
    const headers = defaultSecurityHeaders({
      apiBase: "https://api.staging.example.com/v2",
    });
    expect(headers["Content-Security-Policy"]).toContain(
      "connect-src 'self' https://api.staging.example.com"
    );
  });
});

describe("resolveApiBase (re-exported from securityHeaders)", () => {
  it("returns the localhost default when no env var is set", () => {
    expect(resolveApiBase({ env: {} })).toBe("http://localhost:3001");
  });
});
