import { fireEvent, render, screen } from "@testing-library/react";
import { ThemeToggle } from "../ThemeToggle";

const mockMatchMedia = (matches: boolean) => {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    writable: true,
    value: jest.fn().mockImplementation((query: string) => ({
      matches,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
};

describe("ThemeToggle", () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.classList.remove("dark");
    mockMatchMedia(false);
  });

  it("renders all theme options and marks the stored theme as active", async () => {
    window.localStorage.setItem("machina.theme", "dark");

    render(<ThemeToggle />);

    expect(screen.getByRole("group", { name: "Theme" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "light" })).toHaveAttribute("aria-pressed", "false");
    expect(await screen.findByRole("button", { name: "dark", pressed: true })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "system" })).toHaveAttribute("aria-pressed", "false");
    expect(document.documentElement).toHaveClass("dark");
  });

  it("persists light mode and removes the dark class", async () => {
    window.localStorage.setItem("machina.theme", "dark");
    render(<ThemeToggle />);
    await screen.findByRole("button", { name: "dark", pressed: true });

    fireEvent.click(screen.getByRole("button", { name: "light" }));

    expect(window.localStorage.getItem("machina.theme")).toBe("light");
    expect(screen.getByRole("button", { name: "light" })).toHaveAttribute("aria-pressed", "true");
    expect(document.documentElement).not.toHaveClass("dark");
  });

  it("uses matchMedia when system mode is selected", () => {
    mockMatchMedia(true);
    render(<ThemeToggle />);

    fireEvent.click(screen.getByRole("button", { name: "system" }));

    expect(window.localStorage.getItem("machina.theme")).toBe("system");
    expect(screen.getByRole("button", { name: "system" })).toHaveAttribute("aria-pressed", "true");
    expect(document.documentElement).toHaveClass("dark");
  });
});