import { render, screen, act, fireEvent, cleanup } from "@testing-library/react";
import DocsPage from "./page";
import * as urlUtils from "@/lib/url";

function mockClipboard(writeText = jest.fn().mockResolvedValue(undefined)) {
  Object.defineProperty(navigator, "clipboard", {
    value: { writeText },
    configurable: true,
  });
  return writeText;
}

beforeEach(() => {
  jest.useFakeTimers();
  mockClipboard();
});

afterEach(() => {
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
  cleanup();
  delete process.env.NEXT_PUBLIC_MACHINA_API_BASE;
});

describe("DocsPage", () => {
  it("renders the page title", () => {
    render(<DocsPage />);
    expect(
      screen.getByRole("heading", { name: /API documentation/i }),
    ).toBeInTheDocument();
  });

  it("renders all five endpoint headings", () => {
    render(<DocsPage />);
    expect(screen.getByText("POST /api/v1/usage")).toBeInTheDocument();
    expect(
      screen.getByText("GET /api/v1/usage/:agent/:serviceId"),
    ).toBeInTheDocument();
    expect(screen.getByText("POST /api/v1/settle")).toBeInTheDocument();
    expect(screen.getByText("POST /api/v1/services")).toBeInTheDocument();
    expect(
      screen.getByText("POST /api/v1/admin/{pause,unpause}"),
    ).toBeInTheDocument();
  });

  it("renders all five endpoint descriptions", () => {
    render(<DocsPage />);
    expect(screen.getByText(/Record incremental usage/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Read the accumulated request total/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/Drain the accumulator/i)).toBeInTheDocument();
    expect(screen.getByText(/Register a service/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Toggle the global pause flag/i),
    ).toBeInTheDocument();
  });

  it("renders a Copy curl button for each endpoint", () => {
    render(<DocsPage />);
    const buttons = screen.getAllByRole("button", { name: "Copy curl" });
    expect(buttons).toHaveLength(5);
  });

  it("renders a <pre> block with a <code> child per endpoint", () => {
    render(<DocsPage />);
    const pres = document.querySelectorAll("pre");
    expect(pres).toHaveLength(5);
    pres.forEach((pre) => {
      const code = pre.querySelector("code");
      expect(code).toBeInTheDocument();
      expect(code!.textContent).toMatch(/^curl/);
    });
  });

  it("uses the default API base URL (http://localhost:3001) in curl commands", () => {
    render(<DocsPage />);
    const codes = document.querySelectorAll("pre code");
    codes.forEach((code) => {
      expect(code!.textContent).toContain("http://localhost:3001");
    });
  });

  it("uses a custom API base URL when NEXT_PUBLIC_MACHINA_API_BASE is set", () => {
    process.env.NEXT_PUBLIC_MACHINA_API_BASE = "https://api.example.com";
    render(<DocsPage />);
    const codes = document.querySelectorAll("pre code");
    codes.forEach((code) => {
      expect(code!.textContent).toContain("https://api.example.com");
    });
  });

  it("copies the exact curl command on button click", async () => {
    const writeText = mockClipboard();
    render(<DocsPage />);
    const buttons = screen.getAllByRole("button", { name: "Copy curl" });
    const code = document.querySelectorAll("pre code")[0];

    await act(async () => {
      fireEvent.click(buttons[0]);
    });

    expect(writeText).toHaveBeenCalledWith(code!.textContent);
  });

  it("shows Copied state after click", async () => {
    render(<DocsPage />);
    const buttons = screen.getAllByRole("button", { name: "Copy curl" });

    await act(async () => {
      fireEvent.click(buttons[0]);
    });

    expect(buttons[0]).toHaveTextContent("Copied");
  });

  it("reverts button label from Copied to Copy curl after 1500ms", async () => {
    render(<DocsPage />);
    const buttons = screen.getAllByRole("button", { name: "Copy curl" });

    await act(async () => {
      fireEvent.click(buttons[0]);
    });
    expect(buttons[0]).toHaveTextContent("Copied");

    act(() => {
      jest.advanceTimersByTime(1500);
    });
    expect(buttons[0]).toHaveTextContent("Copy curl");
  });

  it("does not throw when the clipboard API is unavailable", async () => {
    Object.defineProperty(navigator, "clipboard", {
      value: undefined,
      configurable: true,
    });
    render(<DocsPage />);
    const buttons = screen.getAllByRole("button", { name: "Copy curl" });

    await expect(
      act(async () => {
        fireEvent.click(buttons[0]);
      }),
    ).resolves.not.toThrow();
  });

  it("does not enter Copied state when clipboard is unavailable", async () => {
    Object.defineProperty(navigator, "clipboard", {
      value: undefined,
      configurable: true,
    });
    render(<DocsPage />);
    const buttons = screen.getAllByRole("button", { name: "Copy curl" });

    await act(async () => {
      fireEvent.click(buttons[0]);
    });

    expect(buttons[0]).toHaveTextContent("Copy curl");
  });

  it("includes -X POST for every POST endpoint but not for GET", () => {
    render(<DocsPage />);
    const codes = document.querySelectorAll("pre code");
    const commands = Array.from(codes).map((c) => c.textContent);
    // POST endpoints (indices 0, 2, 3, 4)
    expect(commands[0]).toMatch(/-X POST/);
    expect(commands[2]).toMatch(/-X POST/);
    expect(commands[3]).toMatch(/-X POST/);
    expect(commands[4]).toMatch(/-X POST/);
    // GET endpoint (index 1)
    expect(commands[1]).not.toMatch(/-X/);
  });

  it("renders a Content-Type header in POST curl commands that have a body", () => {
    render(<DocsPage />);
    const codes = document.querySelectorAll("pre code");
    const commands = Array.from(codes).map((c) => c.textContent);
    // usage, settle, services have a body
    expect(commands[0]).toContain("Content-Type: application/json");
    expect(commands[2]).toContain("Content-Type: application/json");
    expect(commands[3]).toContain("Content-Type: application/json");
    // admin/pause has no body
    expect(commands[4]).not.toContain("Content-Type");
  });

  it("has aria-live polite on every copy button", () => {
    render(<DocsPage />);
    const buttons = screen.getAllByRole("button", { name: "Copy curl" });
    buttons.forEach((btn) => {
      expect(btn).toHaveAttribute("aria-live", "polite");
    });
  });

  it("renders the OpenAPI JSON link", () => {
    render(<DocsPage />);
    const link = screen.getByRole("link", { name: /GET \/api\/v1\/openapi\.json/i });
    expect(link).toHaveAttribute("href", "/api/v1/openapi.json");
    expect(link).not.toHaveAttribute("target");
    expect(link).not.toHaveAttribute("rel");
  });

  it("renders the dashboard API integration reference link", () => {
    render(<DocsPage />);
    const link = screen.getByRole("link", {
      name: /dashboard API integration reference/i,
    });
    expect(link).toHaveAttribute(
      "href",
      "https://github.com/Agentpay-Org/Agentpay-frontend/blob/main/docs/api-integration.md",
    );
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  describe("link safety validation fallbacks", () => {
    let safeHrefSpy: jest.SpyInstance;
    const originalSafeHref = urlUtils.safeHref;

    beforeEach(() => {
      safeHrefSpy = jest.spyOn(urlUtils, "safeHref");
    });

    afterEach(() => {
      safeHrefSpy.mockRestore();
    });

    it("renders relative OpenAPI link as plain text if validation fails", () => {
      safeHrefSpy.mockImplementation((href) => {
        if (href === "/api/v1/openapi.json") {
          return { ok: false };
        }
        return originalSafeHref(href);
      });

      render(<DocsPage />);

      // The link should not be present
      expect(
        screen.queryByRole("link", { name: /GET \/api\/v1\/openapi\.json/i }),
      ).not.toBeInTheDocument();

      // But the text should still be rendered as plain text
      expect(screen.getByText(/GET \/api\/v1\/openapi\.json/i)).toBeInTheDocument();
    });

    it("renders external reference link as plain text if validation fails", () => {
      safeHrefSpy.mockImplementation((href) => {
        if (
          href ===
          "https://github.com/Agentpay-Org/Agentpay-frontend/blob/main/docs/api-integration.md"
        ) {
          return { ok: false };
        }
        return originalSafeHref(href);
      });

      render(<DocsPage />);

      // The link should not be present
      expect(
        screen.queryByRole("link", { name: /dashboard API integration reference/i }),
      ).not.toBeInTheDocument();

      // But the text should still be rendered as plain text
      expect(screen.getByText(/dashboard API integration reference/i)).toBeInTheDocument();
    });
  });
});
