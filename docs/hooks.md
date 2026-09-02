# Shared Hooks Reference

This catalog documents every reusable hook exported from `src/lib`. Keep this
page in sync with the hook signatures in source whenever a hook is added or its
contract changes.

## Inventory

| Hook | Source | Status |
| --- | --- | --- |
| `useApi` | `src/lib/useApi.ts` | Exported |
| `useDebounce` | `src/lib/useDebounce.ts` | Exported |
| `useLocalState` | `src/lib/useLocalState.ts` | Exported |
| `usePolling` | _none_ | Not currently exported in this repo |

`usePolling` is mentioned in issue #97, but there is no `usePolling` file,
export, or call site in `src/lib` or `src/app` at the time of this reference.
Do not document or import a polling hook until one exists in source.

## `useApi`

```ts
function useApi<T>(path: string | null): State<T>;
```

Import from:

```ts
import { useApi } from "@/lib/useApi";
```

Return shape:

```ts
type State<T> =
  | { status: "loading" }
  | { status: "error"; error: string }
  | { status: "ok"; data: T };
```

Parameters:

- `path`: backend API path passed to `apiGet<T>`. Pass `null` to skip starting
  a request.

Behaviour and gotchas:

- This is a client hook and must be used from a client component.
- The first state is `{ status: "loading" }`.
- When `path` changes, the hook dispatches a fresh loading state and fetches the
  new path.
- If the component unmounts or `path` changes before a response settles, the
  stale response is ignored through an internal cancellation flag.
- `path: null` skips fetching and leaves the existing state unchanged.
- Errors expose `error` as a display-ready string derived from the thrown
  `Error.message`, with `"failed to load"` as a fallback.

Minimal real usage, based on `src/app/changelog/page.tsx`:

```tsx
"use client";

import { Spinner } from "@/components/Spinner";
import { useApi } from "@/lib/useApi";

type Entry = { version: string; date: string; notes: string[] };

export function ChangelogPreview() {
  const state = useApi<{ entries: Entry[] }>("/api/v1/changelog");

  if (state.status === "loading") {
    return <Spinner label="Loading changelog" />;
  }

  if (state.status === "error") {
    return <p role="alert">{state.error}</p>;
  }

  return <p>{state.data.entries.length} entries</p>;
}
```

Use this hook for simple GET-backed client views that can be represented as
loading, error, or successful data. For write actions or request bodies, use the
helpers in `src/lib/apiClient.ts` directly.

## `useDebounce`

```ts
function useDebounce<T>(value: T, delayMs?: number): T;
```

Import from:

```ts
import { useDebounce } from "@/lib/useDebounce";
```

Parameters:

- `value`: the current value to delay.
- `delayMs`: debounce window in milliseconds. Defaults to `300`.

Return shape:

- Returns the same type `T` as the input value.
- The initial render returns the initial `value` immediately.
- Later updates publish only after the debounce timer expires.

Behaviour and gotchas:

- This is a client hook and must be used from a client component.
- The hook clears its pending timer whenever `value` or `delayMs` changes.
- Because the first value is immediate, callers that should not fetch on an
  empty value should still guard empty strings or null-like values.
- A changing `delayMs` resets the pending timer.

Minimal real usage, based on `src/app/search/page.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";
import { apiGet } from "@/lib/apiClient";
import { useDebounce } from "@/lib/useDebounce";

type Service = { serviceId: string; priceStroops: number };

export function ServiceSearchProbe() {
  const [query, setQuery] = useState("");
  const debounced = useDebounce(query, 250);

  useEffect(() => {
    if (!debounced) return;
    void apiGet<{ services: Service[] }>(
      `/api/v1/services?q=${encodeURIComponent(debounced)}&limit=50`,
    );
  }, [debounced]);

  return <input value={query} onChange={(e) => setQuery(e.target.value)} />;
}
```

Use this hook for search/filter text, route query inputs, or other UI values
where downstream work should wait until changes settle.

## `useLocalState`

```ts
function useLocalState<T>(key: string, initial: T): [T, (next: T) => void];
```

Import from:

```ts
import { useLocalState } from "@/lib/useLocalState";
```

Parameters:

- `key`: localStorage key.
- `initial`: first-render value and fallback when storage is unavailable,
  missing, or unreadable.

Return shape:

- Tuple index `0`: current value.
- Tuple index `1`: setter accepting the next value.

Behaviour and gotchas:

- This is a client hook and must be used from a client component.
- The initial render always uses `initial`.
- After mount, the hook attempts to read `window.localStorage.getItem(key)` and
  `JSON.parse` the stored value.
- Missing keys, invalid JSON, and storage read errors leave the fallback value
  in place.
- Calling the setter updates React state first, then best-effort writes
  `JSON.stringify(next)` to localStorage.
- Storage quota or write errors are ignored after React state is updated.
- Because hydration happens after mount, UI may briefly show `initial` before a
  persisted value replaces it.

Minimal real usage, based on `src/lib/__tests__/useLocalState.test.tsx`:

```tsx
"use client";

import { useLocalState } from "@/lib/useLocalState";

export function PersistedPreference() {
  const [mode, setMode] = useLocalState("machina.docs.mode", "summary");

  return (
    <button type="button" onClick={() => setMode("detailed")}>
      Current mode: {mode}
    </button>
  );
}
```

Use this hook for non-sensitive UI preferences that should persist in the
browser, such as display modes, dismissed hints, or local filters. Do not store
secrets, API keys, seed phrases, passwords, or private account material in
localStorage.

## Coverage Note

This reference covers every hook exported from `src/lib` at the time of writing:
`useApi`, `useDebounce`, and `useLocalState`. It also records that `usePolling`
does not currently exist, so contributors do not accidentally import an
undocumented hook name.
