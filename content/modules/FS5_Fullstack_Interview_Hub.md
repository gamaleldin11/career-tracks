# Full-Stack Interview Hub — Feature Design, Take-Homes, the Question Bank and a Plan

Full-stack interviews in Egypt typically combine a frontend fundamentals round, a backend fundamentals round, a practical task (often a take-home "build a small app"), and, at mid level, a design discussion about a feature end to end. This hub ties the full-stack track together: how to answer the feature-design question, how to win the take-home, what to fix in your portfolio first, and a question bank that mixes both halves with the seams between them.

> [!focus]
> **Entry must:** walk one feature through every layer of your own app; build a small full-stack app with auth, validation and tests; answer the fundamentals of both halves.
> **Mid adds:** design a new feature end to end (UI states, API, data, async work, real-time, auth, failure handling); discuss deployment and trade-offs; review code on both sides.
> **Time budget:** the final week: the bank daily, one feature design every other day, one timed build.

## FS5.1 How full-stack interviews usually run 🟢 ⭐

| Round | Focus | Prepared by |
|---|---|---|
| HR screen | Background, English, salary, military status | [[S8]] |
| Frontend fundamentals | JS, TypeScript, Angular or React, CSS, accessibility | [[F3]]–[[F7]], [[F11.6]] |
| Backend fundamentals | C#/.NET or Node, APIs, EF Core, SQL, auth | [[B1]]–[[B7]], [[B14.5]] |
| Practical | A take-home app, or a live "add this feature to this repo" | [[FS5.3]] |
| Feature or system design (mid) | "Design X end to end" | [[FS5.2]], [[B12]], [[F11.4]] |
| Team round | Project deep-dive, ownership, collaboration | [[S8]], [[FS1.6]] |

## FS5.2 The end-to-end feature design question 🟡 ⭐

"Design **invoice reminders**: customers with overdue invoices get an email, and the owner sees reminders on the dashboard." Use this structure, which blends the frontend RADIO and backend design frameworks:

1. **Clarify** (users, rules, scale): who gets reminded, when and how often? Can the owner turn it off per customer? English and Arabic? Thousands of companies?
2. **UI:** a settings panel (on/off, schedule, template preview); a reminder history per invoice; dashboard counts; loading, error and empty states; accessibility; RTL.
3. **API contract:** `GET/PUT /api/reminder-settings`, `GET /api/invoices/{id}/reminders`, `POST /api/invoices/{id}/reminders` (manual send, with an idempotency key); ProblemDetails errors; generated client.
4. **Data:** `ReminderSettings(CompanyId, Enabled, DaysAfterDue[], TemplateId)`, `Reminders(Id, InvoiceId, SentAt, Channel, Status)`; indexes on `(CompanyId, DueDate, Status)` for the daily scan.
5. **Background work:** a recurring job at 09:00 **Cairo time** per company ([[FS3.6]]) queries overdue invoices due for a reminder and enqueues one message per invoice; an email worker renders the template in the customer's language and sends; **idempotency** by `(invoiceId, reminderDay)` so retries don't double-send ([[B12.7]]).
6. **Real-time:** a `ReminderSent` event updates the dashboard via SignalR ([[FS3.2]]).
7. **Security:** owners only can change settings (a policy); tenant scoping everywhere; no customer email addresses in logs.
8. **Failure modes:** the email provider is down → retries with backoff, then dead-letter and a visible "failed" status; the job runs twice → idempotency keys; DST change → schedule in local time.
9. **Testing:** domain tests for "which reminders are due today", integration tests for the job with a fake clock, a component test for the settings panel, one E2E test.
10. **Observability:** metrics for reminders sent and failed per day; an alert if the job didn't run.

<figure class="dia anim"><svg viewBox="0 0 720 296" role="img" aria-label="Animation: invoice reminders design; the owner edits settings through the API, a daily job finds due invoices and enqueues messages, an email worker sends them and a SignalR event updates the dashboard">
<rect class="sB" x="14" y="30" width="140" height="50" rx="8"/><text class="sT" x="84" y="53" text-anchor="middle">settings panel</text><text class="sC" x="84" y="69" text-anchor="middle">owner, EN / AR</text><line class="sL" x1="154" y1="55" x2="186" y2="55" marker-end="url(#ah)"/>
<rect class="sA" x="190" y="30" width="140" height="50" rx="8"/><text class="sT" x="260" y="53" text-anchor="middle">API</text><text class="sC" x="260" y="69" text-anchor="middle">settings · history</text><line class="sL" x1="330" y1="55" x2="366" y2="55" marker-end="url(#ah)"/>
<rect class="sG" x="370" y="30" width="150" height="50" rx="8"/><text class="sT" x="445" y="53" text-anchor="middle">database</text><text class="sC" x="445" y="69" text-anchor="middle">settings · reminders</text>
<rect class="sV" x="560" y="30" width="146" height="50" rx="8"/><text class="sT" x="633" y="53" text-anchor="middle">daily job</text><text class="sC" x="633" y="69" text-anchor="middle">09:00 Cairo time</text><line class="sLm" x1="560" y1="55" x2="524" y2="55" marker-end="url(#ahm)"/><text class="sC" x="542" y="22" text-anchor="middle">find due</text>
<line class="sLw" x1="633" y1="80" x2="633" y2="126" marker-end="url(#ahw)"/><text class="sC" x="640" y="108">enqueue</text>
<rect class="sW" x="560" y="130" width="146" height="50" rx="8"/><text class="sT" x="633" y="153" text-anchor="middle">queue</text><text class="sC" x="633" y="169" text-anchor="middle">one per invoice</text><line class="sLw" x1="560" y1="155" x2="524" y2="155" marker-end="url(#ahw)"/>
<rect class="sV" x="370" y="130" width="150" height="50" rx="8"/><text class="sT" x="445" y="153" text-anchor="middle">email worker</text><text class="sC" x="445" y="169" text-anchor="middle">idempotent</text><line class="sLm" x1="370" y1="155" x2="334" y2="155" marker-end="url(#ahm)"/>
<rect class="sG" x="190" y="130" width="140" height="50" rx="8"/><text class="sT" x="260" y="153" text-anchor="middle">SignalR hub</text><text class="sC" x="260" y="169" text-anchor="middle">ReminderSent</text><line class="sLm" x1="190" y1="155" x2="158" y2="155" marker-end="url(#ahm)"/>
<rect class="sB" x="14" y="130" width="140" height="50" rx="8"/><text class="sT" x="84" y="153" text-anchor="middle">dashboard</text><text class="sC" x="84" y="169" text-anchor="middle">counts update live</text>
<line class="sLm" x1="445" y1="180" x2="445" y2="214" marker-end="url(#ahm)"/><rect class="sR" x="370" y="216" width="150" height="44" rx="8"/><text class="sT" x="445" y="236" text-anchor="middle">email provider</text><text class="sC" x="445" y="252" text-anchor="middle">retries → dead letter</text>
<circle class="sP" r="5"><animateMotion dur="3s" repeatCount="indefinite" path="M154 55 H370"/></circle>
<circle class="sPw" r="5"><animateMotion dur="4s" begin="1s" repeatCount="indefinite" path="M633 80 V155 H154"/></circle>
<text class="sS" x="360" y="284" text-anchor="middle">UI, contract, data, scheduled work, async delivery, real-time feedback: every layer in one answer</text>
</svg><figcaption>The invoice-reminders answer on one page. Draw this in the first ten minutes, then go deep where the interviewer points.</figcaption></figure>

<figure class="dia"><svg viewBox="0 0 720 110" role="img" aria-label="A 45-minute full-stack design answer: clarify, UI, API, data, background jobs, real-time and auth, then failure modes, testing and observability">
<rect class="sB" x="14" y="30" width="74.8889" height="44" rx="6"/><text class="sT" x="52.4444" y="50" text-anchor="middle">clarify</text><text class="sC" x="52.4444" y="66" text-anchor="middle">5 min</text>
<rect class="sA" x="90.8889" y="30" width="90.2667" height="44" rx="6"/><text class="sT" x="137.022" y="50" text-anchor="middle">UI</text><text class="sC" x="137.022" y="66" text-anchor="middle">6 min</text>
<rect class="sA" x="183.156" y="30" width="74.8889" height="44" rx="6"/><text class="sT" x="221.6" y="50" text-anchor="middle">API</text><text class="sC" x="221.6" y="66" text-anchor="middle">5 min</text>
<rect class="sG" x="260.044" y="30" width="74.8889" height="44" rx="6"/><text class="sT" x="298.489" y="50" text-anchor="middle">data</text><text class="sC" x="298.489" y="66" text-anchor="middle">5 min</text>
<rect class="sV" x="336.933" y="30" width="121.022" height="44" rx="6"/><text class="sT" x="398.444" y="50" text-anchor="middle">background jobs</text><text class="sC" x="398.444" y="66" text-anchor="middle">8 min</text>
<rect class="sW" x="459.956" y="30" width="90.2667" height="44" rx="6"/><text class="sT" x="506.089" y="50" text-anchor="middle">live · auth</text><text class="sC" x="506.089" y="66" text-anchor="middle">6 min</text>
<rect class="sR" x="552.222" y="30" width="151.778" height="44" rx="6"/><text class="sT" x="629.111" y="50" text-anchor="middle">failure · tests</text><text class="sC" x="629.111" y="66" text-anchor="middle">10 min</text>
<text class="sC" x="14" y="98">users, rules, scale, languages</text><text class="sC" x="706" y="98" text-anchor="end">what breaks, how you'd know, how you'd test it</text>
</svg><figcaption>Leave the last ten minutes for failure modes and testing. That's where mid-level answers separate from junior ones.</figcaption></figure>

> [!say]
> "I'd start from the user: the owner configures reminders and sees what was sent. The API exposes settings and history with a generated client. A daily job in Cairo time finds invoices due for a reminder and enqueues one message each; an idempotent worker sends the email in the customer's language, so retries never double-send, and a SignalR event updates the dashboard. Owners alone can change settings, everything is tenant-scoped, failures retry then show as failed, and I'd test the scheduling rule with a fake clock."

**More features to practise:** team invitations with roles; CSV import with error reports; a comments thread with mentions and notifications; a multi-step onboarding wizard; an audit-log viewer with filters; a "export to PDF" report that takes a minute to generate.

## FS5.3 Winning the full-stack take-home 🟢 ⭐

Typical brief: "Build a small app (tasks, bookings, expenses) with a front end and an API: list, create, edit, delete, filter, authentication, and tests. Docker is a plus."

**A plan for three evenings:**

| Evening | Do |
|---|---|
| 1 | Read the brief twice; list must-haves; sketch the data model and endpoints; scaffold API + SPA + `compose.yaml`; get "hello world" through the proxy; first commit |
| 2 | Backend: entities, migrations, validated DTOs, endpoints with ProblemDetails, auth, pagination, integration tests. Frontend: generated client, list with filters in the URL, create and edit forms with server-error mapping |
| 3 | Loading, empty and error states; accessibility pass; a few component tests and one E2E test; README with decisions, trade-offs and "with more time"; screenshots; final tidy of commits |

**Reviewers' rubric**, summarised: it runs with one command; the structure is clean on both sides; the contract is typed; validation lives on both sides; auth is correct (server-side checks); UX states exist; tests exist at more than one level; the README explains decisions; the history is readable. Detailed rubrics: [[F11.3]] and [[B14.3]].

## FS5.4 Your full-stack portfolio: fix these first 🟢

| Action | Closes |
|---|---|
| Deploy one app with a seeded demo and a custom domain ([[FS4]] lab) | No live links |
| Generate FinSight's Angular client from OpenAPI with a drift check ([[FS1]] lab) | "How do front end and back end stay in sync?" |
| Tenant-isolation and role tests + a Playwright smoke test in CI ([[B10]], [[F10]] labs) | Testing at both ends |
| One production-quality feature: CSV import, payments, or a streaming assistant ([[FS3]] lab) | Real-world depth |
| Split forecasting behind a queue ([[B9]], [[B8]] labs) | Microservices, message queues |

## FS5.5 The question bank 🟢 ⭐

Mixed on purpose: full-stack interviewers jump between layers. Answer aloud, then reveal.

| Question | Strong short answer |
|---|---|
| Walk me through clicking Save in your app. | UI state and validation → typed client with auth → proxy → pipeline and authorisation → domain logic → transactional save (with outbox) → async consumers → real-time update → telemetry. |
| SPA + API vs server rendering? | SPA calls an API from the browser; server rendering sends HTML for SEO and fast first load, then hydrates. |
| Same-origin vs cross-origin deployment? | One host behind a proxy (no CORS, first-party cookies) vs separate hosts (CORS and SameSite rules). |
| How do you keep types in sync? | Generate the client from OpenAPI and fail CI on drift. |
| Where does an SPA keep its credential? | HttpOnly cookie (same origin or BFF), or a short-lived in-memory token with a refresh cookie; not localStorage. |
| How do you prevent CSRF with cookies? | SameSite plus an anti-forgery header on state-changing requests. |
| How do you refresh tokens safely? | Single-flight refresh on 401 in the client; rotation with reuse detection on the server. |
| Same-site vs same-origin? | Registrable domain (cookies) vs scheme+host+port (CORS). |
| Why does fetch not reject on 500? | It only rejects on network errors; check response.ok. |
| How do you show server validation errors? | Map ProblemDetails errors to form fields. |
| Where should filters live? | In the URL, used as the query key. |
| How do you refresh data after a mutation? | Invalidate the affected query keys, or update the cache optimistically with rollback. |
| How do you push updates to the UI? | SignalR or SSE with server-assigned tenant groups; small notifications, then refetch. |
| PUT vs PATCH? | Full replacement vs partial update. |
| 401 vs 403? | Not authenticated vs not allowed. |
| Offset vs keyset pagination? | Page numbers vs stable, constant-cost cursors. |
| How do you make a payment POST retry-safe? | An idempotency key stored with the result. |
| How do you stop two users overwriting each other? | ETag or rowversion optimistic concurrency, returning 412 or 409. |
| N+1 queries? | One query plus one per item; fix with Include, projection or batching. |
| IEnumerable vs IQueryable? | In memory vs translated to SQL. |
| DI lifetimes and the classic bug? | Singleton, scoped, transient; a singleton capturing a scoped DbContext. |
| async/await in .NET? | A state machine that frees the thread while waiting; never block with .Result. |
| The JS event loop? | Sync code, then all microtasks, then render, then the next task. |
| React keys / Angular track? | Stable IDs so items keep their state and DOM across list changes. |
| Signals vs RxJS? | Signals for state and derived values; RxJS for event streams and complex async. |
| How do you upload big files? | Direct to blob storage with a pre-signed URL; process in a worker. |
| How do you integrate a payment gateway? | Server-side amount, hosted payment page, verified idempotent webhook as the source of truth, reconciliation. |
| How do you handle time zones? | UTC instants, date-only dates, IANA zones (Africa/Cairo has DST again), convert on display. |
| How do you deploy without secrets in CI? | OIDC federation between GitHub and Azure. |
| How do migrations deploy safely? | Backward-compatible (expand and contract), run by the pipeline before traffic shifts. |
| What's in your go-live checklist? | HTTPS and headers, auth tests, backups with tested restore, health checks, telemetry and alerts, error pages, budgets, runbook. |
| Core Web Vitals? | LCP ≤ 2.5 s, INP ≤ 200 ms, CLS ≤ 0.1. |
| Top OWASP 2025 risk? | Broken access control: authorise every request, per object, on the server. |
| Cache invalidation? | Evict on write by key or tag, plus a TTL safety net; tenant in the key. |
| Monolith or microservices? | Modular monolith first; extract services for scaling or team autonomy. |
| How do you add an AI feature safely? | Server-side calls, tenant-scoped retrieval, streaming, output treated as untrusted, rate limits and budgets. |

## FS5.6 A two-week plan 🟢

<figure class="dia"><svg viewBox="0 0 720 230" role="img" aria-label="The full-stack two-week plan as a calendar: refresh front end and back end, build auth and a real feature, test and deploy, then rehearse">
<rect class="sB" x="14" y="40" width="92" height="64" rx="8"/><text class="sM" x="22" y="56">day 1</text><text class="sT" x="60" y="78" text-anchor="middle">your app</text><text class="sC" x="60" y="95" text-anchor="middle">walk a feature</text>
<rect class="sB" x="114" y="40" width="92" height="64" rx="8"/><text class="sM" x="122" y="56">day 2</text><text class="sT" x="160" y="78" text-anchor="middle">JS · TS</text><text class="sC" x="160" y="95" text-anchor="middle">front end</text>
<rect class="sB" x="214" y="40" width="92" height="64" rx="8"/><text class="sM" x="222" y="56">day 3</text><text class="sT" x="260" y="78" text-anchor="middle">framework</text><text class="sC" x="260" y="95" text-anchor="middle">your stack</text>
<rect class="sA" x="314" y="40" width="92" height="64" rx="8"/><text class="sM" x="322" y="56">day 4</text><text class="sT" x="360" y="78" text-anchor="middle">one screen</text><text class="sC" x="360" y="95" text-anchor="middle">every state</text>
<rect class="sA" x="414" y="40" width="92" height="64" rx="8"/><text class="sM" x="422" y="56">day 5</text><text class="sT" x="460" y="78" text-anchor="middle">C# · APIs</text><text class="sC" x="460" y="95" text-anchor="middle">back end</text>
<rect class="sA" x="514" y="40" width="92" height="64" rx="8"/><text class="sM" x="522" y="56">day 6</text><text class="sT" x="560" y="78" text-anchor="middle">EF Core</text><text class="sC" x="560" y="95" text-anchor="middle">SQL</text>
<rect class="sV" x="614" y="40" width="92" height="64" rx="8"/><text class="sM" x="622" y="56">day 7</text><text class="sT" x="660" y="78" text-anchor="middle">auth A or B</text><text class="sC" x="660" y="95" text-anchor="middle">end to end</text>
<rect class="sV" x="14" y="126" width="92" height="64" rx="8"/><text class="sM" x="22" y="142">day 8</text><text class="sT" x="60" y="164" text-anchor="middle">real feature</text><text class="sC" x="60" y="181" text-anchor="middle">done properly</text>
<rect class="sG" x="114" y="126" width="92" height="64" rx="8"/><text class="sM" x="122" y="142">day 9</text><text class="sT" x="160" y="164" text-anchor="middle">tests</text><text class="sC" x="160" y="181" text-anchor="middle">both sides, CI</text>
<rect class="sG" x="214" y="126" width="92" height="64" rx="8"/><text class="sM" x="222" y="142">day 10</text><text class="sT" x="260" y="164" text-anchor="middle">deploy</text><text class="sC" x="260" y="181" text-anchor="middle">a live link</text>
<rect class="sW" x="314" y="126" width="92" height="64" rx="8"/><text class="sM" x="322" y="142">day 11</text><text class="sT" x="360" y="164" text-anchor="middle">design ×2</text><text class="sC" x="360" y="181" text-anchor="middle">timed</text>
<rect class="sW" x="414" y="126" width="92" height="64" rx="8"/><text class="sM" x="422" y="142">day 12</text><text class="sT" x="460" y="164" text-anchor="middle">take-home</text><text class="sC" x="460" y="181" text-anchor="middle">4 h, timed</text>
<rect class="sW" x="514" y="126" width="92" height="64" rx="8"/><text class="sM" x="522" y="142">day 13</text><text class="sT" x="560" y="164" text-anchor="middle">mock round</text><text class="sC" x="560" y="181" text-anchor="middle">record it</text>
<rect class="sW" x="614" y="126" width="92" height="64" rx="8"/><text class="sM" x="622" y="142">day 14</text><text class="sT" x="660" y="164" text-anchor="middle">bank ×2</text><text class="sC" x="660" y="181" text-anchor="middle">stories · rest</text>
<text class="sM" x="14" y="30">week 1: refresh both halves</text><text class="sM" x="14" y="116">week 2: build, ship, then rehearse</text>
<rect class="sB" x="20" y="204" width="16" height="16" rx="3"/><text class="sC" x="42" y="217">front end</text>
<rect class="sA" x="160" y="204" width="16" height="16" rx="3"/><text class="sC" x="182" y="217">back end</text>
<rect class="sV" x="300" y="204" width="16" height="16" rx="3"/><text class="sC" x="322" y="217">auth · features</text>
<rect class="sG" x="440" y="204" width="16" height="16" rx="3"/><text class="sC" x="462" y="217">tests · shipping</text>
<rect class="sW" x="580" y="204" width="16" height="16" rx="3"/><text class="sC" x="602" y="217">rehearse</text>
</svg><figcaption>Week 2 produces evidence (a feature, tests, a live link) before it produces rehearsal.</figcaption></figure>

| Days | Do |
|---|---|
| 1 | [[S1]], [[FS1]]: draw your own app's shape and walk one feature end to end |
| 2–3 | Frontend refresh: [[F3]], [[F4]], [[F5]], plus [[F6]] or [[F7]] (whichever the job uses) |
| 4 | [[F8]]: the "one screen, every state" lab |
| 5–6 | Backend refresh: [[B1]], [[B3]], [[B4]], [[B5]] |
| 7 | [[B7]], [[FS2]]: implement auth design A or B end to end |
| 8 | [[FS3]]: one real-world feature, done properly |
| 9 | [[B10]], [[F10]]: tests on both sides in CI |
| 10 | [[FS4]]: deploy a demo with a link |
| 11 | Feature design practice ([[FS5.2]]) ×2, timed |
| 12 | A timed mini take-home (4 hours) from a brief you write yourself |
| 13 | Mock interview with the bank and your project walkthrough |
| 14 | The bank twice, [[S8]] stories aloud, rest |

## Key takeaways

> [!check]
> - Full-stack interviews test the seams: contracts, auth across the boundary, state, deployment.
> - Answer feature design by layer: UI, API, data, async, real-time, security, failures, tests, observability.
> - In take-homes, a complete, tested, documented slice beats an ambitious half-built app.
> - Close the visible gaps first: a live link, generated clients, tests on both sides.
> - Drill the mixed bank aloud; interviewers jump between layers on purpose.

## Sources

- The frontend (F1–F11), backend (B1–B14) and full-stack (FS1–FS4) modules of this handbook, and their sources.
