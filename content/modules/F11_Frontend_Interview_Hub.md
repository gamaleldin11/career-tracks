# Frontend Interview Hub — Machine Coding, Frontend System Design and the Question Bank

This is the module to live in during the final week before a frontend interview. It covers the two rounds the other modules only prepare you for: the **machine-coding round** (build a working UI component in 45–90 minutes) and **frontend system design** (design the client side of a product). It ends with a 60-question bank and a two-week plan.

> [!focus]
> **Entry must:** build a small interactive component live, with clean state and basic accessibility; explain your own project's frontend architecture; answer the fundamentals bank confidently.
> **Mid adds:** a structured frontend system design (requirements, architecture, data model, API, optimisations); trade-offs on rendering, state and performance; reviewing code.
> **Time budget:** the final week: one machine-coding exercise a day, one system design every other day, the question bank daily.

## F11.1 How frontend interviews usually run 🟢 ⭐

| Round | What happens | Prepared by |
|---|---|---|
| HR screen | Background, English, notice period, salary, military status | [[S8]] |
| Fundamentals | Rapid questions on HTML, CSS, JavaScript, the framework; "what does this print?" | [[F1]]–[[F7]] and the bank below |
| **Machine coding** or take-home | Build a component or a small app: live in 45–90 minutes, or at home over a few days | [[F11.2]] |
| DSA (product companies) | One or two easy-to-medium problems, usually in JavaScript | [[S4]] |
| **Frontend system design** (mid level) | Design the client side of something like a feed, a dashboard, an autocomplete | [[F11.4]] |
| Team or manager | Project deep-dive, collaboration, "why us" | [[S8]] |

## F11.2 The machine-coding round 🟢 ⭐

**What they score:** a working result, sensible component boundaries, clean state, handling of edge cases (loading, empty, errors, keyboard), readable code, and how you communicate. Visual polish comes last.

**The routine (out loud):**

1. **Clarify (3–5 minutes).** Required features vs nice-to-haves; the data shape; is there an API or should you mock one; which framework; which browsers; accessibility expectations.
2. **Sketch the component tree and state (3 minutes).** "A `Typeahead` with an input, a results list and options. State: query, results, highlighted index, open flag, status."
3. **Build the minimum working version.** Get something on screen fast, then iterate.
4. **Handle the edges:** loading, empty, error; keyboard; fast typing; long text.
5. **Refine:** accessibility attributes, small refactors, a test if time allows.
6. **Summarise:** what works, what you'd do next, and trade-offs you made.

**Practise these classics** (each in under 60 minutes, in both React and Angular if you can):

| Component | Tests your grasp of |
|---|---|
| **Typeahead / autocomplete** ⭐ | Debounce, cancelling stale requests, keyboard navigation, ARIA combobox |
| Todo list with filters | State updates, derived state, keys, persistence |
| Modal / dialog | Focus management, Esc, overlay, portals ([[F1.6]]) |
| Tabs, accordion | ARIA patterns, keyboard arrows |
| Data table with sort, filter and pagination | Derived data, URL state, performance |
| Infinite scroll feed | IntersectionObserver, cursor pagination, loading states |
| Star rating | Controlled input, hover vs selected state, keyboard |
| Multi-step form with validation | Form state, validation timing, error messages |
| Countdown or stopwatch | Timers, clean-up, drift |
| Image carousel | Index state, auto-play clean-up, reduced motion |
| Nested file tree | Recursion, expand and collapse state |
| Kanban board | Lists of lists, moving items, a non-drag alternative |

### Worked example: an accessible typeahead in React ⭐

```tsx
import { useEffect, useId, useRef, useState } from "react";

type Item = { id: string; label: string };

export function Typeahead({ search }: { search: (q: string, signal: AbortSignal) => Promise<Item[]> }) {
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<Item[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [active, setActive] = useState(-1);
  const [open, setOpen] = useState(false);
  const listId = useId();
  const justChose = useRef(false);                          // picking an option shouldn't search again

  useEffect(() => {
    if (justChose.current) { justChose.current = false; return; }
    const q = query.trim();
    if (q.length < 2) { setItems([]); setStatus("idle"); return; }
    const ctrl = new AbortController();
    const t = setTimeout(async () => {                       // debounce 250 ms
      setStatus("loading");
      try {
        setItems(await search(q, ctrl.signal));
        setStatus("idle"); setActive(-1); setOpen(true);
      } catch (e) {
        if ((e as Error).name !== "AbortError") setStatus("error");
      }
    }, 250);
    return () => { clearTimeout(t); ctrl.abort(); };        // cancel the timer and any stale request
  }, [query, search]);

  function choose(item: Item) { justChose.current = true; setQuery(item.label); setOpen(false); }

  function onKeyDown(e: React.KeyboardEvent) {
    if (!open || !items.length) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setActive(i => (i + 1) % items.length); }
    if (e.key === "ArrowUp")   { e.preventDefault(); setActive(i => (i - 1 + items.length) % items.length); }
    if (e.key === "Enter" && active >= 0) { e.preventDefault(); choose(items[active]); }
    if (e.key === "Escape") setOpen(false);
  }

  return (
    <div className="typeahead">
      <label htmlFor={`${listId}-input`}>Search customers</label>
      <input
        id={`${listId}-input`}
        role="combobox" aria-expanded={open} aria-controls={listId} aria-autocomplete="list"
        aria-activedescendant={active >= 0 ? `${listId}-${items[active].id}` : undefined}
        value={query} onChange={e => setQuery(e.target.value)} onKeyDown={onKeyDown}
      />
      {status === "loading" && <span role="status">Searching…</span>}
      {status === "error" && <span role="alert">Search failed. Keep typing to retry.</span>}
      {open && (
        <ul id={listId} role="listbox">
          {items.length === 0 && <li role="option" aria-disabled="true" aria-selected="false">No matches</li>}
          {items.map((it, i) => (
            <li key={it.id} id={`${listId}-${it.id}`} role="option" aria-selected={i === active}
                onMouseDown={e => e.preventDefault()}            /* keep focus in the input */
                onClick={() => choose(it)}>
              {it.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

**What to say while building it:** "The effect debounces by 250 ms and aborts the previous request in its clean-up, so a slow old response can't overwrite a new one. Focus stays in the input, and `aria-activedescendant` tells screen readers which option is highlighted, which is the WAI-ARIA combobox pattern. Next I'd add result highlighting, a cache per query, and tests for the keyboard behaviour."

The Angular version is shorter with RxJS: `valueChanges.pipe(debounceTime(250), distinctUntilChanged(), switchMap(q => api.search(q)))` handles debounce and cancellation in one line ([[F7.6]]).

## F11.3 Take-home tasks for frontend roles 🟢 ⭐

A typical brief: "Build a small app that lists X from this API, with search, filters, a detail page and a form. You have three days."

**The rubric reviewers use (aim for all of it):**

| Area | What "great" looks like |
|---|---|
| Runs first time | `npm ci && npm run dev`, or `docker compose up`; versions noted in the README |
| Structure | Feature folders, small components, a typed API layer, no logic in templates |
| State | Server state in a query cache or resources; filters in the URL; derived values not stored |
| UX states | Skeletons, empty and error states with retry; disabled submit while saving |
| Accessibility | Labels, roles, keyboard, focus visible; axe clean |
| Responsive | Works at 360 px and on desktop |
| Tests | A few meaningful component tests plus one E2E or integration test |
| README | Decisions, trade-offs, what you'd do with more time, how to run the tests |
| Git history | Small commits with clear messages |

## F11.4 Frontend system design 🟡 ⭐

Mid-level frontend interviews increasingly include "design the frontend of X". Use the **RADIO** structure:

| Step | Ask and decide | Time |
|---|---|---|
| **R**equirements | Core features (in and out of scope), users and devices, scale, offline, real-time, accessibility, internationalisation (Arabic?) | ~15% |
| **A**rchitecture | The main components and how they talk: views, a data/store layer, an API client, a server or BFF; the rendering strategy | ~20% |
| **D**ata model | Client-side entities and state: server cache vs client state, normalisation, what's in the URL | ~10% |
| **I**nterface (API) | Endpoints or messages between client and server: pagination, real-time events, error shapes | ~15% |
| **O**ptimisations | Performance, accessibility, security, i18n, observability, testing: the deep dives | ~40% |

### Worked example: "Design FinSight's dashboard" ⭐

**Requirements.** Company owners and accountants see cash balance, a 90-day forecast chart, recent transactions and alerts. Desktop first, usable on a phone. Data updates when a CSV upload or an invoice payment triggers re-forecasting. English and Arabic. Must load quickly after login.

**Architecture.**

<figure class="dia"><svg viewBox="0 0 720 230" role="img" aria-label="Dashboard architecture: widgets, query cache, API client, SignalR, API">
<rect class="sA" x="20" y="20" width="420" height="80" rx="10"/><text class="sT" x="230" y="40" text-anchor="middle">Dashboard page (route, lazy-loaded)</text>
<rect class="sB" x="35" y="52" width="90" height="36" rx="6"/><text class="sS" x="80" y="75" text-anchor="middle">Balance card</text>
<rect class="sB" x="135" y="52" width="100" height="36" rx="6"/><text class="sS" x="185" y="75" text-anchor="middle">Forecast chart</text>
<rect class="sB" x="245" y="52" width="90" height="36" rx="6"/><text class="sS" x="290" y="75" text-anchor="middle">Alerts</text>
<rect class="sB" x="345" y="52" width="85" height="36" rx="6"/><text class="sS" x="387" y="75" text-anchor="middle">Transactions</text>
<rect class="sG" x="20" y="125" width="200" height="44" rx="8"/><text class="sT" x="120" y="152" text-anchor="middle">Query cache / resources</text>
<rect class="sG" x="240" y="125" width="200" height="44" rx="8"/><text class="sT" x="340" y="152" text-anchor="middle">SignalR client</text>
<rect class="sW" x="20" y="185" width="420" height="34" rx="8"/><text class="sT" x="230" y="207" text-anchor="middle">Typed API client + auth interceptor</text>
<rect class="sB" x="500" y="60" width="200" height="140" rx="10"/><text class="sT" x="600" y="85" text-anchor="middle">ASP.NET Core API</text><text class="sS" x="600" y="108" text-anchor="middle">GET /dashboard/summary</text><text class="sS" x="600" y="126" text-anchor="middle">GET /forecast?days=90</text><text class="sS" x="600" y="144" text-anchor="middle">GET /transactions?cursor=</text><text class="sS" x="600" y="162" text-anchor="middle">hub: ForecastUpdated</text>
<line class="sL" x1="440" y1="202" x2="500" y2="160"/><line class="sL" x1="440" y1="147" x2="500" y2="120"/>
<line class="sD" x1="120" y1="100" x2="120" y2="125"/><line class="sD" x1="340" y1="147" x2="220" y2="147"/>
</svg><figcaption>Each widget owns its query, so one slow or failing endpoint never blanks the page; SignalR events invalidate the affected queries.</figcaption></figure>

- Client-side rendering behind login (no SEO need); the dashboard route is lazy-loaded; the chart library is loaded with `@defer`/`lazy`.
- Each widget has its own query, its own skeleton and its own error state ([[F8.3]]).

**Data model.** Server cache keys: `["dashboard","summary"]`, `["forecast",{days:90}]`, `["transactions",{cursor}]`, `["alerts"]`. Client state: the selected date range (in the URL), and the chart's hovered point (local).

**Interface.** A **summary endpoint** shaped for the screen (a backend-for-frontend style aggregate, [[FS1]]) to avoid many round trips; cursor pagination for transactions; a SignalR event `ForecastUpdated(companyId)` that invalidates `forecast` and `summary`; errors as `ProblemDetails`.

**Optimisations (the deep dives):**

- *Performance:* prefetch the summary right after login; skeletons sized to avoid CLS; the chart in a deferred chunk; numbers formatted with `Intl` once per render; transactions virtualised past 200 rows.
- *Accessibility:* the chart has a text summary and a data-table alternative; alerts use a polite live region; colour isn't the only signal for negative cash flow.
- *Internationalisation:* RTL layout with logical properties; Arabic number formatting decided with the product owner; chart axes mirrored.
- *Security:* the token in an HttpOnly cookie or memory; tenant isolation enforced by the API, never assumed from the UI.
- *Observability:* web-vitals and front-end errors reported with the user's tenant and release version.
- *Testing:* component tests per widget with MSW (success, empty, error); one Playwright test for login → dashboard.

> [!say]
> "I'd treat each widget as an independent unit with its own query and loading and error states, so a slow forecast doesn't block the balance. The API exposes one summary endpoint shaped for the screen, plus paginated transactions, and SignalR events invalidate just the affected queries. The chart is lazy-loaded and has a table alternative for accessibility."

**Other designs to practise:** an autocomplete (the design version of F11.2), an infinite social feed, a chat app, an e-commerce product listing page with filters, an image gallery with uploads, a collaborative document editor (senior level), Google Calendar's week view.

## F11.5 Your frontend portfolio, honestly 🟢

From your evidence map and gaps file, the cheapest ways to strengthen a frontend application:

1. **Deploy one app publicly**, CS Visualizer or the studio site, and put the link on the CV.
2. **Add tests**: the five from [[F10]]'s lab, wired into CI.
3. **A measured performance improvement** from [[F9]]'s lab.
4. **An accessibility pass** from [[F1]]'s lab, with the axe results.
5. **One Angular 22 modernisation** (signals, httpResource, OnPush) from [[F7]]'s lab, to show you're current.

## F11.6 The question bank 🟢 ⭐

Answer each aloud before revealing. Mark the ones you miss, and reread the linked module.

| Question | Strong short answer |
|---|---|
| What happens when you type a URL? | DNS, TCP or QUIC, TLS, HTTP request, server response, then parse HTML and CSS, run JS, fetch assets, layout and paint. |
| Semantic HTML: why? | Meaning for assistive technology, browsers and search engines; native behaviour for free. |
| `<button>` vs `<a>`? | Buttons act, links navigate; each brings the right keyboard support and role. |
| First rule of ARIA? | Use native HTML when it already does the job; ARIA adds no behaviour. |
| How do you make a form accessible? | Labels tied to inputs, correct types and autocomplete, text errors linked with aria-describedby, focus to the first error. |
| WCAG AA contrast for body text? | 4.5:1 (3:1 for large text and UI components). |
| Specificity order? | Inline, then IDs, then classes/attributes/pseudo-classes, then elements; ties go to the later rule. |
| box-sizing: border-box? | Width includes padding and border. |
| Flexbox vs grid? | One-dimensional, content-driven vs two-dimensional, layout-driven. |
| Why doesn't my z-index work? | Not positioned, or trapped in a lower stacking context. |
| rem vs em? | rem: root font size; em: the element's own font size. |
| Container query vs media query? | A container's size vs the viewport's size. |
| What is a closure? | A function that keeps access to the scope it was created in. |
| var, let, const? | Function vs block scope; const can't be reassigned; let and const have a temporal dead zone. |
| == vs ===? | Coercing vs strict comparison. |
| How is `this` set? | By the call site; arrow functions take it from the enclosing scope. |
| Prototype chain? | Property lookups follow an object's prototype links until found or null. |
| Shallow vs deep copy? | Top level only vs everything nested (structuredClone). |
| Event loop order? | Sync code, then all microtasks, then render, then the next task. |
| Promise.all vs allSettled? | Fails fast on any rejection vs reports every outcome. |
| How do you cancel a fetch? | AbortController's signal and abort(). |
| Event delegation? | One parent listener handles child events via bubbling and event.target. |
| Debounce vs throttle? | Run after calls stop vs at most once per interval. |
| any vs unknown? | Unchecked vs must-narrow-first. |
| interface vs type? | Interfaces extend and merge; types express unions and computed types. |
| Discriminated union? | A union with a shared literal tag that enables narrowing and exhaustive checks. |
| Does TypeScript validate API data? | No, types are erased; validate at runtime with a schema. |
| React: how does it update the DOM? | Re-render, diff the element trees, commit the differences. |
| Why keys in lists? | To match items across renders and keep state with the right item. |
| useEffect dependency array? | None: every render; empty: once; values: when any changes. |
| When not to use useEffect? | For derived data, user-event logic, or resetting state on prop change. |
| useMemo vs useCallback? | Cache a value vs cache a function identity. |
| What does the React Compiler do? | Memoises automatically at build time. |
| Controlled vs uncontrolled input? | Value in React state vs in the DOM. |
| Angular signals? | Tracked reactive values driving fine-grained updates. |
| OnPush? | Check a component only on input reference changes, its own events, or emitting signals and async pipes; default since v22. |
| switchMap vs exhaustMap? | Cancel the previous inner call vs ignore new triggers until it finishes. |
| Interceptor? | Middleware for every HttpClient request and response. |
| Reactive vs template-driven forms? | Model in code (typed, testable) vs model in the template. |
| Server state vs client state? | Backend-owned, cacheable and stale-able vs UI-owned. |
| Why TanStack Query? | Caching, deduplication, refetching, retries, cancellation, invalidation. |
| Optimistic update? | Update the UI before the server confirms, roll back on failure. |
| What goes in the URL? | Filters, search, sort, page, tabs. |
| Core Web Vitals? | LCP ≤ 2.5 s, INP ≤ 200 ms, CLS ≤ 0.1 at p75. |
| Improve LCP? | Faster server, early discovery and priority of the hero image, smaller images, no render-blocking resources. |
| Improve INP? | Break up long tasks, less JS, lighter handlers, virtualise. |
| Causes of CLS? | Media without dimensions, injected content, font swaps. |
| CSR vs SSR vs SSG? | Browser at runtime vs server per request vs at build time. |
| Hydration? | Attaching JavaScript behaviour to server-rendered HTML. |
| Code-splitting? | Loading code in chunks on demand via dynamic import. |
| Testing levels? | Unit, component/integration, end-to-end; most value in component tests. |
| getBy vs findBy? | Synchronous and throws vs waits for async appearance. |
| What do you mock? | The network, time, randomness and third parties, not your own components. |
| Flaky test causes? | Fixed sleeps, shared state, real time or network, order dependence. |
| XSS defence? | Framework escaping, no innerHTML with user data, sanitise rich text, CSP, HttpOnly cookies. |
| CSRF defence? | SameSite cookies, anti-forgery tokens, no state changes on GET. |
| Where should a token live? | Ideally an HttpOnly, Secure, SameSite cookie; localStorage is exposed to XSS. |
| CORS error: who fixes it? | The server, by allowing the origin; it's enforced by browsers only. |
| How do you support Arabic? | lang and dir="rtl", logical properties, mirrored directional icons, Intl formatting. |

## F11.7 A two-week plan 🟢

| Days | Do |
|---|---|
| 1–2 | [[F1]], [[F2]]: semantic HTML, a form, three layouts from memory |
| 3–4 | [[F3]], [[F4]]: closures, `this`, event loop; implement debounce, `Promise.all`, deepEqual |
| 5 | [[F5]]: type one API with Zod and a discriminated union |
| 6–7 | [[F6]] or [[F7]] (whichever the job uses), plus the other's comparison table |
| 8 | [[F8]]: build the "one screen, every state" lab |
| 9 | [[F9]]: a measured performance fix on one of your apps |
| 10 | [[F10]]: five tests in CI |
| 11–12 | Machine coding: typeahead, modal, data table, infinite feed (one each, timed) |
| 13 | System design: the dashboard above, then an autocomplete or feed on your own |
| 14 | The question bank twice, [[S8]] stories aloud, rest |

## Key takeaways

> [!check]
> - Machine coding: clarify, sketch state, get it working, handle edges, then refine, while talking.
> - The typeahead covers debounce, cancellation, keyboard and ARIA in one exercise: master it.
> - System design with RADIO: requirements, architecture, data, interface, then the optimisations where you score.
> - Close portfolio gaps with a deployed app, tests, a measured performance fix and an accessibility pass.
> - Drill the bank aloud until the short answers are automatic.

## Sources

- GreatFrontEnd, [Front End System Design: the RADIO framework](https://www.greatfrontend.com/front-end-system-design-playbook/framework).
- W3C WAI-ARIA Authoring Practices: [Combobox pattern](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/).
- Modules F1–F10 of this handbook and their sources.
