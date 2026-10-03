# State, Data Fetching and Forms — Where Front-End Complexity Really Lives

Most bugs in a real frontend aren't in rendering; they're in **state**. Stale data after a save, a spinner that never stops, a filter lost on refresh, a form that accepts what the server rejects. Mid-level interviews probe this through design questions: "where would you keep this state?", "how do you keep the list fresh after an edit?", "how do you show server validation errors?". This module gives you a vocabulary and a decision process that work in both React and Angular.

> [!focus]
> **Entry must:** tell server state from UI state; show loading, error, empty and success states; fetch and cache data with a library; keep filters in the URL; validate forms on the client *and* show server errors.
> **Mid adds:** cache invalidation after mutations, optimistic updates with rollback, choosing between context, stores and server-state caches, pagination strategies, real-time cache updates, offline basics.
> **Most asked:** *How do you manage state in a large app?* · *Redux or Context?* · *What is TanStack Query for?* · *How do you keep data fresh after an update?* · *What is an optimistic update?* · *Client-side or server-side validation?*
> **Time budget:** 3 hours.

## F8.1 Five kinds of state, five homes 🟢 ⭐

The most useful idea in this module: **not all state is the same, and each kind has a natural home.**

| Kind | Examples | Lives best in |
|---|---|---|
| **Server state** | Invoices, the current user's profile, dashboard numbers | A **server-state cache**: TanStack Query, RTK Query, Angular's `httpResource`/`resource` |
| **URL state** | Filters, search text, sort order, page number, selected tab | The **URL** (route params and query string) |
| **Local UI state** | Is this dropdown open, which row is hovered, a draft comment | **Component state** (`useState`, a signal) |
| **Shared client state** | Theme, sidebar collapsed, a multi-step wizard's progress, the cart before checkout | **Context or a small store** (Zustand, a signal service, NgRx) |
| **Form state** | Field values, touched, dirty, errors | A **form library** (React Hook Form, Angular reactive or signal forms) |

> [!say]
> "I start by asking what kind of state it is. Data that belongs to the server goes in a query cache, so caching, refetching and invalidation are handled for me. Filters and pagination go in the URL so they survive a refresh and can be shared. Purely visual state stays local in the component, and only genuinely shared client state goes into context or a store. Most apps that 'need Redux' actually need a server-state cache."

> [!mistake] Copying server data into a global store
> Fetching invoices and putting them into Redux or a BehaviorSubject means you now own caching, staleness, deduplication, retries and invalidation by hand. That code is where "the list didn't update after I saved" bugs come from.

## F8.2 Server state with a query cache 🟢 🟡 ⭐

TanStack Query (React, and also Angular, Vue and Solid) treats server data as a **cache keyed by what you asked for**.

```tsx
// Reading
function useInvoices(filters: { status?: string; page: number }) {
  return useQuery({
    queryKey: ["invoices", filters],                     // the cache key: change it and you get a new query
    queryFn: ({ signal }) => api.get(`/api/invoices`, { params: filters, signal }),
    staleTime: 30_000,                                   // treat data as fresh for 30 s (no refetch)
    placeholderData: keepPreviousData,                   // keep page 1 on screen while page 2 loads
  });
}

// Writing, then refreshing what changed
function useMarkPaid() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post(`/api/invoices/${id}/pay`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["invoices"] }),   // every invoices list refetches
  });
}
```

What you get for free: **deduplication** (ten components asking for the same key make one request), **background refetching** (on window focus or reconnect), **retries** with backoff, **request cancellation** when the key changes, and loading and error flags.

| Term | Meaning |
|---|---|
| `staleTime` | How long fetched data counts as fresh. Default 0, so it's stale immediately and refetched on the next trigger |
| `gcTime` (named `cacheTime` before v5) | How long **unused** data stays in memory before it's garbage-collected (default 5 minutes) |
| Invalidation | Marking queries stale so active ones refetch now, typically after a mutation |
| `setQueryData` | Writing into the cache directly, for optimistic updates or using a mutation's response |

**In Angular**, `httpResource` (stable since v22) covers the common case: a signal-driven request that re-runs when its inputs change, with `value()`, `isLoading()` and `error()`. For caching across components and invalidation, use TanStack Query for Angular or a service that holds the resource.

> [!story]
> `aiforme` uses TanStack Query over a Kaggle dataset of AI tools. Be ready to say why: search and filter changes become new query keys, previous results are cached so going back is instant, and requests for out-of-date filters are cancelled.

## F8.3 The four states every data view needs 🟢 ⭐

Every screen that loads data must design all four, not just the happy path:

| State | Show |
|---|---|
| **Loading** | A **skeleton** in the shape of the content (less jarring than a spinner, and it avoids layout shift); for quick refetches, keep the old data and show a small indicator |
| **Error** | What went wrong in human words, plus a **Retry** button; keep the rest of the page usable |
| **Empty** | Why it's empty and what to do next ("No invoices yet. Create your first invoice") |
| **Success** | The data |

Model them as a discriminated union ([[F5.5]]) so you can't show data and an error at the same time.

## F8.4 Optimistic updates 🟡 ⭐

> [!term] Optimistic update
> Updating the UI **immediately** as if the server request had succeeded, then **rolling back** if it fails. It makes apps feel instant. Use it for likely-to-succeed, easy-to-undo actions (toggling a star, marking paid); avoid it for payments or anything the user must not believe happened when it didn't.

```tsx
useMutation({
  mutationFn: (id: string) => api.post(`/api/invoices/${id}/pay`),
  onMutate: async (id) => {
    await qc.cancelQueries({ queryKey: ["invoices"] });                 // stop refetches overwriting us
    const previous = qc.getQueriesData<Invoice[]>({ queryKey: ["invoices"] });
    qc.setQueriesData<Invoice[]>({ queryKey: ["invoices"] },
      list => list?.map(i => i.id === id ? { ...i, status: "paid" } : i));
    return { previous };                                                 // context for rollback
  },
  onError: (_err, _id, ctx) => ctx?.previous.forEach(([key, data]) => qc.setQueryData(key, data)),
  onSettled: () => qc.invalidateQueries({ queryKey: ["invoices"] }),     // re-sync with the truth
});
```

React 19's `useOptimistic` does the same for a component's own state ([[F6.5]]).

## F8.5 Client state: context, stores, signals 🟢 🟡 ⭐

| Tool | Good for | Watch out for |
|---|---|---|
| React **context** | Values that change rarely and are read widely: user, theme, locale | Every consumer re-renders on any change; split contexts by concern |
| **`useReducer`** | Complex local state with named transitions | — |
| **Zustand** | Small, simple global stores in React; components subscribe to slices | Keep server data out of it |
| **Redux Toolkit** (+ RTK Query) | Large apps that want strict, traceable state changes and devtools; RTK Query adds a server cache | More ceremony; classic hand-written Redux is outdated |
| Angular **signal services** | Feature and app state, the default in modern Angular | Expose read-only signals; update through methods |
| **NgRx** Store / SignalStore | Large enterprise apps, strong conventions ([[F7.12]]) | Boilerplate for small apps |

> [!say]
> "Redux versus context isn't really the question. Context is a way to pass values down, not a state manager, and it re-renders every consumer. For server data I'd use TanStack Query; for a bit of shared UI state, context or Zustand; and Redux Toolkit only when a large team needs strict, traceable updates."

## F8.6 The URL is state 🟢 ⭐

Put anything a user would expect to **survive a refresh, work with the back button, or share in a link** into the URL: filters, search text, sort, page, selected tab, an open detail panel's ID.

```text
/invoices?status=overdue&sort=-dueDate&page=2&q=nile
```

```tsx
// React Router
const [params, setParams] = useSearchParams();
const status = params.get("status") ?? "all";
const setStatus = (s: string) => setParams(p => { p.set("status", s); p.set("page", "1"); return p; });
```

```ts
// Angular: query params as component inputs with withComponentInputBinding()
status = input<string>("all");            // from ?status=…
this.router.navigate([], { queryParams: { status: "overdue", page: 1 }, queryParamsHandling: "merge" });
```

Then use the URL-derived values as the **query key**, and the data, the cache and the URL stay consistent automatically.

## F8.7 Lists: pagination, infinite scroll, sorting 🟢 🟡

| Pattern | Good for | Notes |
|---|---|---|
| **Numbered pages** (offset) | Admin tables, reports, "jump to page 7" | Simple; with offset pagination, rows shift if data changes between pages |
| **"Load more" / infinite scroll** (cursor) | Feeds, timelines, search results | `useInfiniteQuery` with a `nextCursor`; stable under inserts; keep a visible "Load more" button for accessibility and a reachable footer |
| **Virtualisation** | Thousands of rows already loaded | Render only the visible rows ([[F4.7]]) |

Server-side **sorting and filtering** belong in the API for large data sets; doing it on the client only works for what's already loaded. API design for pagination is in [[B4]].

## F8.8 Forms that don't lie 🟢 ⭐

**Client-side validation is for the user; server-side validation is for the truth.** The client gives instant feedback; the server must re-validate everything, because anyone can bypass the client ([[S9.1]]).

**A good validation experience:**

- Validate on **blur** or on submit, not on every keystroke for the first entry (nothing is more annoying than "invalid email" after typing one letter); after an error appears, re-validate as the user types so it clears quickly.
- Error messages say **how to fix it**, sit next to the field, and are linked for screen readers ([[F1.3]]).
- On submit, **disable** the button and show progress, to prevent double submission; on failure, keep the user's input.
- **Map server errors to fields.** ASP.NET Core returns validation failures as `ValidationProblemDetails`:

```json
{ "status": 400, "title": "One or more validation errors occurred.",
  "errors": { "Email": ["Email is already registered."], "Amount": ["Must be greater than 0."] } }
```

```tsx
// React Hook Form: put server errors on the matching fields
onError: (err) => Object.entries(err.errors ?? {}).forEach(([field, msgs]) =>
  setError(field.charAt(0).toLowerCase() + field.slice(1) as any, { message: msgs[0] }))
```

- **Share the rules.** Generate client validation from the same schema as your types (Zod), or from the API's OpenAPI description, so client and server don't drift.
- **Unsaved changes:** warn before navigating away from a dirty form (Angular `canDeactivate`, React Router's `useBlocker`, the browser's `beforeunload`).
- **Multi-step wizards:** keep the whole wizard's data in one form or store, validate each step, and allow going back without losing data. Don't make users re-enter anything ([[F1.5]], WCAG 3.3.7).

> [!story]
> FinSight's **CSV upload** is a form with the hardest kind of validation: per-row errors from the server. A strong answer: "the API validates every row and returns a list of row numbers and messages; the UI shows a summary ('3 of 120 rows failed') with a downloadable error report, and imports the valid rows only if the user confirms."

## F8.9 Real-time updates into the cache 🟡

When the server pushes an event (SignalR, SSE, WebSocket), **don't** maintain a second copy of the data. Either invalidate the affected queries (simple, always correct) or patch the cache with `setQueryData` (faster, more code).

```ts
connection.on("InvoicePaid", (id: string) => {
  queryClient.invalidateQueries({ queryKey: ["invoices"] });
  queryClient.invalidateQueries({ queryKey: ["dashboard", "summary"] });
});
```

## F8.10 Persisting and offline 🟡

- `localStorage` for small preferences (theme, a dismissed banner); never for secrets ([[S1.6]]).
- **IndexedDB** for larger offline data (via a wrapper like Dexie).
- **Progressive web apps (PWAs):** a **service worker** caches the app shell and chosen API responses so the app loads offline, and a web app manifest makes it installable. TanStack Query can persist its cache to storage, and mutations can be queued until the connection returns. That matters for field workers on patchy mobile networks.

> [!lab] One screen, every state
> Build an invoice list with: filters and page in the URL; TanStack Query (or `httpResource`) with a skeleton loading state, an error state with retry, an empty state; a "mark paid" mutation with an optimistic update and rollback; and a create form that maps ASP.NET Core `ValidationProblemDetails` to field errors. Then throttle the network in DevTools to "Slow 4G" and click through it. Every rough edge you find is an interview story.

## F8.11 Interview drill 🟢 ⭐

| Question | Strong short answer |
|---|---|
| Server state vs client state? | Server state is owned by the backend and can go stale (use a query cache); client state is owned by the UI (local state, context or a store). |
| Why use TanStack Query instead of fetching in effects? | It handles caching, deduplication, background refetching, retries, cancellation and invalidation for you. |
| staleTime vs gcTime? | staleTime: how long data counts as fresh; gcTime: how long unused data stays in memory. |
| How do you refresh a list after creating an item? | Invalidate its query key in the mutation's onSuccess (or write the new item into the cache). |
| What is an optimistic update? | Updating the UI before the server confirms, with rollback on failure. |
| Context or Redux? | Context passes values down and re-renders all consumers; it isn't a state manager. Use a query cache for server data and a store only for complex shared client state. |
| What belongs in the URL? | Filters, search, sort, page, selected tab: anything that should survive refresh and be shareable. |
| Client or server validation? | Both: client for fast feedback, server as the source of truth. |
| How do you show server validation errors? | Map the API's field errors (ValidationProblemDetails) onto the matching form fields. |
| Which four states does a data view need? | Loading, error (with retry), empty (with a next step), success. |
| Offset vs cursor pagination in the UI? | Offset for numbered pages; cursor for feeds and infinite scroll, which stay stable as data changes. |
| How do you prevent double submission? | Disable the submit button while pending (or use exhaustMap), and make the endpoint idempotent. |

## Key takeaways

> [!check]
> - Classify state first: server, URL, local UI, shared client, form.
> - Server data goes in a query cache; invalidate after mutations.
> - The URL holds filters and pages; derive query keys from it.
> - Design loading, error, empty and success states for every view.
> - Validate on the client for UX and on the server for truth; map server errors to fields.

## Sources

- TanStack Query: [Overview](https://tanstack.com/query/latest/docs/framework/react/overview), [Important defaults](https://tanstack.com/query/latest/docs/framework/react/guides/important-defaults), [Optimistic updates](https://tanstack.com/query/latest/docs/framework/react/guides/optimistic-updates), [Migrating to v5 (cacheTime → gcTime)](https://tanstack.com/query/latest/docs/framework/react/guides/migrating-to-v5).
- React: [Choosing the state structure](https://react.dev/learn/choosing-the-state-structure), [Passing data deeply with context](https://react.dev/learn/passing-data-deeply-with-context); [Redux Toolkit](https://redux-toolkit.js.org/); [Zustand](https://zustand.docs.pmnd.rs/).
- Angular: [httpResource](https://angular.dev/guide/http/http-resource), [Signal forms](https://angular.dev/guide/forms/signals/overview).
- Microsoft Learn: [Handle errors in ASP.NET Core APIs (ProblemDetails)](https://learn.microsoft.com/en-us/aspnet/core/web-api/handle-errors).
- web.dev: [Progressive Web Apps](https://web.dev/explore/progressive-web-apps).
