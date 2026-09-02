import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";

import { useLocalState } from "../useLocalState";

function Probe({
  storageKey,
  initial,
  next = "updated",
}: {
  storageKey: string;
  initial: string;
  next?: string;
}) {
  const [value, setValue] = useLocalState(storageKey, initial);

  return (
    <div>
      <output data-testid="value">{value}</output>
      <button type="button" onClick={() => setValue(next)}>
        update
      </button>
    </div>
  );
}

describe("useLocalState", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    cleanup();
  });

  it("reads the persisted value from localStorage on mount", async () => {
    const storageKey = "machina.useLocalState.persisted";
    window.localStorage.setItem(storageKey, JSON.stringify("persisted"));

    render(<Probe storageKey={storageKey} initial="fallback" />);

    await act(async () => {});

    expect(screen.getByTestId("value")).toHaveTextContent("persisted");
  });

  it("writes the next value to state and localStorage", () => {
    const storageKey = "machina.useLocalState.write";

    const { getByRole } = render(
      <Probe storageKey={storageKey} initial="fallback" next="saved value" />
    );

    fireEvent.click(getByRole("button", { name: "update" }));

    expect(screen.getByTestId("value")).toHaveTextContent("saved value");
    expect(window.localStorage.getItem(storageKey)).toBe(
      JSON.stringify("saved value")
    );
  });

  it("keeps the fallback when localStorage has no value for the key", async () => {
    const storageKey = "machina.useLocalState.missing";

    render(<Probe storageKey={storageKey} initial="fallback" />);

    await act(async () => {});

    expect(screen.getByTestId("value")).toHaveTextContent("fallback");
  });

  it("keeps the fallback when localStorage contains invalid JSON", async () => {
    const storageKey = "machina.useLocalState.invalid";
    window.localStorage.setItem(storageKey, "{not-json");

    render(<Probe storageKey={storageKey} initial="fallback" />);

    await act(async () => {});

    expect(screen.getByTestId("value")).toHaveTextContent("fallback");
  });

  it("updates React state even when localStorage.setItem throws", () => {
    const storageKey = "machina.useLocalState.quota";
    const setItemSpy = jest
      .spyOn(Storage.prototype, "setItem")
      .mockImplementation(() => {
        throw new Error("quota exceeded");
      });

    const { getByRole } = render(
      <Probe storageKey={storageKey} initial="fallback" next="state only" />
    );

    expect(() =>
      fireEvent.click(getByRole("button", { name: "update" }))
    ).not.toThrow();

    expect(screen.getByTestId("value")).toHaveTextContent("state only");
    expect(setItemSpy).toHaveBeenCalledWith(
      storageKey,
      JSON.stringify("state only")
    );
  });
});
