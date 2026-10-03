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
