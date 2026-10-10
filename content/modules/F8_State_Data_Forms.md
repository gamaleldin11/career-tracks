# State, Data Fetching and Forms — Where Front-End Complexity Really Lives

Most bugs in a real frontend aren't in rendering; they're in **state**. Stale data after a save, a spinner that never stops, a filter lost on refresh, a form that accepts what the server rejects. Mid-level interviews probe this through design questions: "where would you keep this state?", "how do you keep the list fresh after an edit?", "how do you show server validation errors?". This module gives you a vocabulary and a decision process that work in both React and Angular.

> [!focus]
> **Entry must:** tell server state from UI state; show loading, error, empty and success states; fetch and cache data with a library; keep filters in the URL; validate forms on the client *and* show server errors.
> **Mid adds:** cache invalidation after mutations, optimistic updates with rollback, choosing between context, stores and server-state caches, pagination strategies, real-time cache updates, offline basics.
> **Most asked:** *How do you manage state in a large app?* · *Redux or Context?* · *What is TanStack Query for?* · *How do you keep data fresh after an update?* · *What is an optimistic update?* · *Client-side or server-side validation?*
> **Time budget:** 3 hours.

## F8.0 Foundations: source of truth, derived values and copies 🟢

**State** is any data that can change while the app runs and that the UI depends on. Three ideas keep it under control:

- **One source of truth.** Every fact lives in exactly one place: the server owns the invoices, the URL owns the current filter, the form owns the field being typed.
- **Derive, don't store.** A count, a filtered list or a total is **computed** from the source whenever it's needed (`computed`, `useMemo`, or plain code during render), never stored separately.
- **Copies drift.** The moment the same fact lives in two places, they can disagree, and keeping them in sync becomes your job.

<figure class="dia steps" data-start="1"><svg viewBox="0 0 720 210" role="img" aria-label="Values derived from one source update together; a separate copy of the same data goes stale after an update">
<text class="sT" x="180" y="22" text-anchor="middle">one source, derived values</text><text class="sT" x="540" y="22" text-anchor="middle">two copies</text>
<line class="sD" x1="360" y1="12" x2="360" y2="210"/>
<rect class="sA" x="100" y="40" width="160" height="44" rx="8"/><text class="sT" x="180" y="60" text-anchor="middle">invoices (cache)</text><text class="sC" x="180" y="76" text-anchor="middle">the source</text>
<line class="sLm" x1="140" y1="84" x2="90" y2="120" marker-end="url(#ahm)"/><line class="sLm" x1="220" y1="84" x2="270" y2="120" marker-end="url(#ahm)"/>
<rect class="sB" x="20" y="122" width="140" height="40" rx="8"/><text class="sC" x="90" y="140" text-anchor="middle">count</text><text class="sC" x="90" y="155" text-anchor="middle">computed</text><rect class="sB" x="200" y="122" width="140" height="40" rx="8"/><text class="sC" x="270" y="140" text-anchor="middle">overdue list</text><text class="sC" x="270" y="155" text-anchor="middle">computed</text>
<rect class="sA" x="390" y="40" width="140" height="44" rx="8"/><text class="sT" x="460" y="60" text-anchor="middle">API response</text><text class="sC" x="460" y="76" text-anchor="middle">in the cache</text><rect class="sW" x="560" y="40" width="140" height="44" rx="8"/><text class="sT" x="630" y="60" text-anchor="middle">copy in a store</text><text class="sC" x="630" y="76" text-anchor="middle">set once on load</text>
<g data-s="1-1"><text class="sM" x="180" y="190" text-anchor="middle">3 invoices · 1 overdue</text><text class="sM" x="540" y="120" text-anchor="middle">both say: 3 invoices</text></g>
<g data-s="2-2"><text class="sGt" x="180" y="190" text-anchor="middle">mark one paid → 3 invoices · 0 overdue</text><text class="sGt" x="460" y="120" text-anchor="middle">refetched: 0 overdue</text><text class="sRt" x="630" y="140" text-anchor="middle">still: 1 overdue</text><text class="sRt" x="540" y="180" text-anchor="middle">the copy drifted</text></g>
</svg><ol class="dia-steps">
<li>Everything agrees on the first load: the derived values are computed from the source, and the copy was set from the same response.</li>
<li>An invoice is marked paid and the source is refreshed. Derived values recompute automatically; the copy in the store doesn't know anything changed and now contradicts the rest of the page.</li>
</ol><figcaption>Keep one source of truth and derive everything else from it. Every copy is a future "it didn't update" bug.</figcaption></figure>

The rest of this module is about choosing the right single home for each kind of state, and deriving everything else.

## F8.1 Five kinds of state, five homes 🟢 ⭐

The most useful idea in this module: **not all state is the same, and each kind has a natural home.**

| Kind | Examples | Lives best in |
|---|---|---|
| **Server state** | Invoices, the current user's profile, dashboard numbers | A **server-state cache**: TanStack Query, RTK Query, Angular's `httpResource`/`resource` |
| **URL state** | Filters, search text, sort order, page number, selected tab | The **URL** (route params and query string) |
| **Local UI state** | Is this dropdown open, which row is hovered, a draft comment | **Component state** (`useState`, a signal) |
| **Shared client state** | Theme, sidebar collapsed, a multi-step wizard's progress, the cart before checkout | **Context or a small store** (Zustand, a signal service, NgRx) |
| **Form state** | Field values, touched, dirty, errors | A **form library** (React Hook Form, Angular reactive or signal forms) |

<figure class="dia"><svg viewBox="0 0 720 256" role="img" aria-label="An invoices screen with each region labelled by the kind of state it holds: URL, shared client, server, local UI and form state">
<rect class="sN" x="20" y="14" width="680" height="230" rx="12"/>
<rect class="sB" x="30" y="22" width="660" height="26" rx="6"/><text class="sM" x="40" y="40">app.example.com/invoices?status=overdue&amp;page=2</text><text class="sGt" x="680" y="40" text-anchor="end">URL state</text>
<rect class="sV" x="30" y="56" width="660" height="30" rx="6"/><text class="sC" x="40" y="76">Mona Ahmed ▾    ◐ dark theme</text><text class="sGt" x="680" y="76" text-anchor="end">shared client state</text>
<rect class="sA" x="30" y="94" width="420" height="140" rx="6"/><text class="sT" x="40" y="112">Invoices (from the API)</text>
<rect class="sB" x="40" y="120" width="400" height="22" rx="4"/><text class="sC" x="50" y="135">INV-40 · EGP 1,200</text>
<rect class="sB" x="40" y="146" width="400" height="22" rx="4"/><text class="sC" x="50" y="161">INV-41 · EGP 1,550</text>
<rect class="sB" x="40" y="172" width="400" height="22" rx="4"/><text class="sC" x="50" y="187">INV-42 · EGP 1,900</text>
<rect class="sB" x="40" y="198" width="400" height="22" rx="4"/><text class="sC" x="50" y="213">INV-43 · EGP 2,250</text>
<text class="sGt" x="440" y="226" text-anchor="end">server state</text>
<rect class="sW" x="460" y="94" width="230" height="60" rx="6"/><text class="sC" x="470" y="114">Sort ▾ (menu open)</text><text class="sC" x="470" y="132">row 2 hovered</text><text class="sGt" x="680" y="148" text-anchor="end">local UI state</text>
<rect class="sG" x="460" y="162" width="230" height="72" rx="6"/><text class="sT" x="470" y="182">New invoice</text><text class="sC" x="470" y="200">amount: 15… (typing)</text><text class="sRt" x="470" y="216">customer: required ✕</text><text class="sGt" x="680" y="228" text-anchor="end">form state</text>
</svg><figcaption>One screen, five kinds of state, five different homes.</figcaption></figure>

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

<figure class="dia steps" data-start="1"><svg viewBox="0 0 720 156" role="img" aria-label="Lifecycle of a query cache entry: fetching, fresh, stale, background refetch, inactive and finally removed">
<line class="sLm" x1="40" y1="120" x2="690" y2="120" marker-end="url(#ahm)"/><text class="sC" x="690" y="112" text-anchor="end">time</text>
<line class="sLm" x1="52.8" y1="114" x2="52.8" y2="126"/><text class="sC" x="52.8" y="144" text-anchor="middle">mount</text>
<line class="sLm" x1="104.0" y1="114" x2="104.0" y2="126"/><text class="sC" x="104" y="144" text-anchor="middle">data</text>
<line class="sLm" x1="296.0" y1="114" x2="296.0" y2="126"/><text class="sC" x="296" y="144" text-anchor="middle">stale</text>
<line class="sLm" x1="392.0" y1="114" x2="392.0" y2="126"/><text class="sC" x="392" y="144" text-anchor="middle">window refocus</text>
<line class="sLm" x1="488.0" y1="114" x2="488.0" y2="126"/><text class="sC" x="488" y="144" text-anchor="middle">unmount</text>
<line class="sLm" x1="654.4" y1="114" x2="654.4" y2="126"/><text class="sC" x="654.4" y="144" text-anchor="middle">removed</text>
<g data-s="1"><rect class="sW" x="52.8" y="84" width="51.2" height="26" rx="4"/><text class="sS" x="78.4" y="101" text-anchor="middle">fetching</text></g>
<g data-s="2"><rect class="sG" x="104" y="84" width="192" height="26" rx="4"/><text class="sC" x="200" y="101" text-anchor="middle">fresh (staleTime 30 s)</text></g>
<g data-s="3"><rect class="sB" x="296" y="84" width="96" height="26" rx="4"/><text class="sC" x="344" y="101" text-anchor="middle">stale</text></g>
<g data-s="4"><rect class="sA" x="392" y="84" width="44.8" height="26" rx="4"/><text class="sC" x="414.4" y="101" text-anchor="middle">refetch</text></g>
<g data-s="4"><rect class="sG" x="436.8" y="84" width="51.2" height="26" rx="4"/><text class="sC" x="462.4" y="101" text-anchor="middle">fresh</text></g>
<g data-s="5"><rect class="sN" x="488" y="84" width="166.4" height="26" rx="4"/><text class="sC" x="571.2" y="101" text-anchor="middle">inactive (gcTime 5 min)</text></g>
<g data-s="6"><line class="sLr" x1="654.4" y1="80" x2="654.4" y2="114" stroke-width="3"/><text class="sRt" x="654.4" y="72" text-anchor="middle">✕</text></g>
<g data-s="1-1"><text class="sS" x="360" y="40" text-anchor="middle">No cached data for ["invoices", {page: 2}]: show the skeleton and fetch.</text></g>
<g data-s="2-2"><text class="sS" x="360" y="40" text-anchor="middle">Data arrives and is fresh: other components asking for the same key get it instantly, with no request.</text></g>
<g data-s="3-3"><text class="sS" x="360" y="40" text-anchor="middle">After staleTime it becomes stale. It is still shown; it just will be refetched on the next trigger.</text></g>
<g data-s="4-4"><text class="sS" x="360" y="40" text-anchor="middle">Refocusing the window triggers a background refetch. The old data stays on screen until the new data replaces it.</text></g>
<g data-s="5-5"><text class="sS" x="360" y="40" text-anchor="middle">The last component using it unmounts. The entry becomes inactive but stays cached, so coming back is instant.</text></g>
<g data-s="6-6"><text class="sS" x="360" y="40" text-anchor="middle">After gcTime with no users, the entry is garbage-collected.</text></g>
</svg><ol class="dia-steps">
<li>Mount with an empty cache: fetch, and show a skeleton.</li>
<li>Fresh: within <code>staleTime</code>, any component reading this key gets the cached data without a request.</li>
<li>Stale: still displayed, but eligible for a refetch on the next trigger (mount, refocus, reconnect, invalidation).</li>
<li>A trigger fires: the data is refetched in the background while the old data stays visible.</li>
<li>No component uses it any more: inactive, but kept for <code>gcTime</code>.</li>
<li>Garbage-collected. The next visit starts from scratch.</li>
</ol><figcaption>One cache entry's life. Two settings decide it: <code>staleTime</code> (how long until refetching) and <code>gcTime</code> (how long unused data is kept).</figcaption></figure>

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

<figure class="dia steps" data-start="1"><svg viewBox="0 0 720 194" role="img" aria-label="Optimistic update: the UI shows paid immediately, then either keeps it when the server agrees or rolls back to the snapshot on error">
<rect class="sB" x="20" y="30" width="300" height="120" rx="10"/><text class="sT" x="170" y="52" text-anchor="middle">INV-42 · EGP 1,200</text>
<g data-s="1-1"><rect class="sW" x="110" y="70" width="120" height="34" rx="8"/><text class="sC" x="170" y="92" text-anchor="middle">Mark paid</text><text class="sM" x="170" y="132" text-anchor="middle">status: unpaid</text></g>
<g data-s="2-3"><rect class="sG" x="110" y="70" width="120" height="34" rx="8"/><text class="sC" x="170" y="92" text-anchor="middle">✓ Paid</text><text class="sGt" x="170" y="132" text-anchor="middle">status: paid (optimistic)</text></g>
<g data-s="4-4"><rect class="sW" x="110" y="70" width="120" height="34" rx="8"/><text class="sC" x="170" y="92" text-anchor="middle">Mark paid</text><text class="sRt" x="170" y="132" text-anchor="middle">status: unpaid (rolled back)</text></g>
<g data-s="2"><rect class="sV" x="380" y="30" width="320" height="34" rx="8"/><text class="sC" x="540" y="52" text-anchor="middle">snapshot saved · cache patched · request sent</text></g>
<g data-s="3-3"><rect class="sG" x="380" y="80" width="320" height="34" rx="8"/><text class="sC" x="540" y="102" text-anchor="middle">200 OK → invalidate → server agrees</text></g>
<g data-s="4-4"><rect class="sR" x="380" y="80" width="320" height="34" rx="8"/><text class="sC" x="540" y="102" text-anchor="middle">500 error → restore the snapshot + toast</text></g>
<text class="sS" x="360" y="182" text-anchor="middle">Either way, onSettled refetches so the cache ends up matching the server.</text>
</svg><ol class="dia-steps">
<li>The user clicks "Mark paid".</li>
<li>Before the request finishes: cancel in-flight refetches, save a snapshot of the cached list, and write the expected result into the cache. The UI updates instantly.</li>
<li>Success path: the server agrees, and invalidation refetches the real data.</li>
<li>Failure path: the snapshot is written back, the row returns to unpaid, and the user is told why.</li>
</ol><figcaption>Optimistic updates make the common case feel instant and keep the rare failure honest.</figcaption></figure>

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

<figure class="dia"><svg viewBox="0 0 720 172" role="img" aria-label="With offset pagination a new item pushes #48 onto page 2 as well; cursor pagination continues after #48 correctly">
<text class="sM" x="110" y="22" text-anchor="middle">page 1 (offset 0)</text><rect class="sB" x="10" y="32" width="200" height="22" rx="4"/><text class="sC" x="20" y="47">#50</text><rect class="sB" x="10" y="58" width="200" height="22" rx="4"/><text class="sC" x="20" y="73">#49</text><rect class="sB" x="10" y="84" width="200" height="22" rx="4"/><text class="sC" x="20" y="99">#48</text>
<text class="sWt" x="120" y="128" text-anchor="middle">then a new #51 arrives</text>
<text class="sM" x="350" y="22" text-anchor="middle">page 2 (offset 3)</text><rect class="sR" x="250" y="32" width="200" height="22" rx="4"/><text class="sC" x="260" y="47">#48</text><rect class="sB" x="250" y="58" width="200" height="22" rx="4"/><text class="sC" x="260" y="73">#47</text><rect class="sB" x="250" y="84" width="200" height="22" rx="4"/><text class="sC" x="260" y="99">#46</text>
<text class="sRt" x="350" y="128" text-anchor="middle">#48 shown twice</text>
<text class="sM" x="590" y="22" text-anchor="middle">page 2 (after #48)</text><rect class="sB" x="490" y="32" width="200" height="22" rx="4"/><text class="sC" x="500" y="47">#47</text><rect class="sB" x="490" y="58" width="200" height="22" rx="4"/><text class="sC" x="500" y="73">#46</text><rect class="sB" x="490" y="84" width="200" height="22" rx="4"/><text class="sC" x="500" y="99">#45</text>
<text class="sGt" x="590" y="128" text-anchor="middle">cursor: stable</text>
<text class="sS" x="360" y="160" text-anchor="middle">Offset counts rows, so inserts and deletes shift every later page; a cursor remembers the last item seen.</text>
</svg><figcaption>Why feeds use cursors. "Give me 3 after #48" doesn't care what was inserted above.</figcaption></figure>

## F8.8 Forms that don't lie 🟢 ⭐

**Client-side validation is for the user; server-side validation is for the truth.** The client gives instant feedback; the server must re-validate everything, because anyone can bypass the client ([[S9.1]]).

<figure class="dia"><svg viewBox="0 0 720 214" role="img" aria-label="Client validation gives instant feedback; the server validates again and returns field errors, which the form maps back onto its fields">
<rect class="sB" x="10" y="30" width="130" height="54" rx="8"/><text class="sT" x="75" y="62" text-anchor="middle">user types</text>
<line class="sLm" x1="140" y1="57" x2="166" y2="57" marker-end="url(#ahm)"/><rect class="sA" x="170" y="30" width="150" height="54" rx="8"/><text class="sT" x="245" y="55" text-anchor="middle">client rules</text><text class="sC" x="245" y="71" text-anchor="middle">Zod / validators</text>
<text class="sGt" x="245" y="104" text-anchor="middle">instant feedback</text><text class="sC" x="245" y="120" text-anchor="middle">blocks obvious mistakes</text>
<line class="sLm" x1="320" y1="57" x2="346" y2="57" marker-end="url(#ahm)"/><rect class="sB" x="350" y="30" width="120" height="54" rx="8"/><text class="sT" x="410" y="55" text-anchor="middle">submit</text><text class="sC" x="410" y="71" text-anchor="middle">button disabled</text>
<line class="sLm" x1="470" y1="57" x2="496" y2="57" marker-end="url(#ahm)"/><rect class="sV" x="500" y="30" width="200" height="54" rx="8"/><text class="sT" x="600" y="55" text-anchor="middle">server validates again</text><text class="sC" x="600" y="71" text-anchor="middle">the source of truth</text>
<line class="sLr" x1="600" y1="84" x2="600" y2="136" marker-end="url(#ahr)"/><rect class="sR" x="470" y="140" width="240" height="64" rx="8" opacity=".85"/><text class="sM" x="590" y="160" text-anchor="middle">400 ValidationProblemDetails</text><text class="sC" x="590" y="178" text-anchor="middle">errors: { Email: [...] }</text><text class="sC" x="590" y="194" text-anchor="middle">"already registered"</text>
<path class="sLr" d="M470 172 C360 172 300 150 260 92" marker-end="url(#ahr)"/><text class="sRt" x="330" y="186" text-anchor="middle">mapped onto the Email field</text>
</svg><figcaption>Two layers of validation. Only the server can check things like "email already registered", and only the server is safe from a bypassed client.</figcaption></figure>

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
