import robots from "./robots";

const ORIGINAL_SITE_ORIGIN = process.env.NEXT_PUBLIC_MACHINA_SITE_ORIGIN;

afterEach(() => {
  if (ORIGINAL_SITE_ORIGIN === undefined) {
    delete process.env.NEXT_PUBLIC_MACHINA_SITE_ORIGIN;
  } else {
    process.env.NEXT_PUBLIC_MACHINA_SITE_ORIGIN = ORIGINAL_SITE_ORIGIN;
  }
});

describe("robots metadata route", () => {
  it("allows public crawling and disallows operator surfaces", () => {
    process.env.NEXT_PUBLIC_MACHINA_SITE_ORIGIN = "https://dashboard.example.com/";

    expect(robots()).toEqual({
      rules: {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/api-keys", "/webhooks", "/settings"],
      },
      sitemap: "https://dashboard.example.com/sitemap.xml",
    });
  });

  it("falls back to the local development sitemap URL", () => {
    delete process.env.NEXT_PUBLIC_MACHINA_SITE_ORIGIN;

    expect(robots().sitemap).toBe("http://localhost:3000/sitemap.xml");
  });
});
