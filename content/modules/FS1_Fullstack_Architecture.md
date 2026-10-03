# Full-Stack Architecture — How the Front End and Back End Fit Together

A full-stack developer is judged on the **seams**: how the UI and the API agree on data, how they're served and configured, how a feature travels from a button to a database row and back. Knowing Angular and knowing ASP.NET Core separately isn't the same as knowing how to join them well. This module covers the shapes a full-stack system can take, keeping the two halves in sync, local development, configuration, and walking a feature through every layer, using FinSight as the running example.

> [!focus]
> **Entry must:** explain SPA + API vs server-rendered apps; describe how your front end calls your API (base URL, auth, errors); run both locally with a proxy; walk a feature through all layers.
> **Mid adds:** same-origin vs cross-origin deployments, the backend-for-frontend pattern, generating typed clients from OpenAPI, runtime vs build-time configuration, monorepos, choosing a stack for a new product.
> **Most asked:** *Walk me through what happens when the user clicks Save* · *How do your front end and back end share types?* · *How do you deploy the front end and the API?* · *How do you configure the API URL per environment?* · *Why Angular and .NET, not Next.js?*
> **Time budget:** 3 hours.

## FS1.1 Four shapes of a full-stack app 🟢 ⭐

| Shape | How it works | Pros | Cons | Example |
|---|---|---|---|---|
| **SPA + API, cross-origin** | `app.example.com` (static files on a CDN) calls `api.example.com` | Independent deploys and scaling; CDN for the UI | **CORS**, cookies across sites, two hosts to secure | Many Angular + .NET setups |
| **SPA + API, same origin** | One host: a reverse proxy serves the SPA at `/` and forwards `/api` to the API | **No CORS**; first-party cookies; simple auth | One entry point to scale and secure | **FinSight**: Caddy → nginx → Angular + API |
| **Server-rendered framework** | Next.js (or Angular SSR) renders pages on the server and also hosts API routes or server functions | SEO, fast first load, one codebase and language | Server costs; framework lock-in; more to learn | Your course platform (Next.js + Prisma) |
| **SPA + backend-for-frontend (BFF)** | The browser talks only to a BFF (same origin) that handles auth and calls downstream APIs | Tokens never reach the browser; responses shaped per screen | One more component | Secure SPAs over many services ([[B7.5]]) |

<figure class="dia"><svg viewBox="0 0 720 200" role="img" aria-label="Same-origin deployment: browser to reverse proxy, which serves SPA files and forwards /api to the API">
<rect class="sB" x="10" y="80" width="100" height="44" rx="8"/><text class="sT" x="60" y="107" text-anchor="middle">Browser</text>
<rect class="sW" x="160" y="60" width="170" height="84" rx="10"/><text class="sT" x="245" y="88" text-anchor="middle">Reverse proxy</text><text class="sS" x="245" y="108" text-anchor="middle">TLS (Caddy) · routing</text><text class="sS" x="245" y="126" text-anchor="middle">finsight.example</text>
<rect class="sA" x="400" y="20" width="160" height="50" rx="8"/><text class="sT" x="480" y="42" text-anchor="middle">/ → SPA files</text><text class="sS" x="480" y="60" text-anchor="middle">Angular build (nginx)</text>
<rect class="sG" x="400" y="130" width="160" height="50" rx="8"/><text class="sT" x="480" y="152" text-anchor="middle">/api → ASP.NET Core</text><text class="sS" x="480" y="170" text-anchor="middle">+ /hubs (SignalR)</text>
<rect class="sB" x="600" y="130" width="110" height="50" rx="8"/><text class="sT" x="655" y="160" text-anchor="middle">SQL Server</text>
<line class="sL" x1="110" y1="102" x2="160" y2="102"/><line class="sL" x1="330" y1="90" x2="400" y2="45"/><line class="sL" x1="330" y1="115" x2="400" y2="155"/><line class="sL" x1="560" y1="155" x2="600" y2="155"/>
</svg><figcaption>Same-origin: the browser sees one host, so there's no CORS and cookies are first-party. This is roughly how FinSight was deployed.</figcaption></figure>

> [!say]
> "FinSight was served from one origin: Caddy terminated TLS, nginx served the Angular build at the root and proxied /api and the SignalR hub to the ASP.NET Core container. Same-origin meant no CORS configuration in production and first-party cookies for auth. If the UI moved to a CDN on another domain, I'd have to configure CORS with credentials and think about SameSite."

## FS1.2 One contract, two languages 🟢 🟡 ⭐

The API's shape is a **contract**. Hand-copying C# DTOs into TypeScript interfaces drifts silently: a renamed field compiles fine on both sides and breaks at runtime.

**Generate the client from the API's OpenAPI document:**

```bash
# ASP.NET Core 10 serves /openapi/v1.json (OpenAPI 3.1)
npx openapi-typescript http://localhost:5000/openapi/v1.json -o src/app/api/schema.d.ts   # types only
# or a full typed client: NSwag (C#-friendly), Kiota (Microsoft), Orval (React Query / Angular hooks)
```

```ts
import type { components } from "./api/schema";
type InvoiceDto = components["schemas"]["InvoiceDto"];   // always matches the server
```

Run generation in CI and fail the build if the generated file changed but wasn't committed, so a backend change that breaks the front end is caught **before** merge.

**Other contract details to settle once:**

| Topic | Decision |
|---|---|
| Casing | camelCase JSON (the ASP.NET Core default) |
| Dates | ISO 8601 UTC strings; `DateOnly` for calendar dates (due dates) without time zones |
| Money | Decimal as a string or integer minor units, plus a currency code; never JavaScript floats for arithmetic ([[F3.1]]) |
| Enums | Strings (`"overdue"`), via `JsonStringEnumConverter` |
| Errors | ProblemDetails everywhere; the UI maps `errors` to form fields ([[F8.8]]) |
| Pagination | One shape for every list: items plus a cursor or page metadata |
| Nulls | Nullable reference types on the server mirrored by optional fields in the generated types |

## FS1.3 Running both halves locally 🟢 ⭐

**Use the dev server's proxy**, so the browser sees one origin even in development, with no CORS and real cookies:

```json
// Angular: proxy.conf.json, referenced from angular.json "serve" options
{ "/api": { "target": "https://localhost:7001", "secure": false, "changeOrigin": true },
  "/hubs": { "target": "https://localhost:7001", "secure": false, "ws": true } }
```

```ts
// Vite (React): vite.config.ts
export default defineConfig({ server: { proxy: { "/api": { target: "https://localhost:7001", secure: false } } } });
```

**Orchestrate everything:** `docker compose up` for the database, Redis and broker ([[S5.11]]), or **Aspire**, which starts the API, the front-end dev server and containers from one C# AppHost, wires connection strings and shows a dashboard with logs and traces:

```csharp
var builder = DistributedApplication.CreateBuilder(args);
var sql   = builder.AddSqlServer("sql").AddDatabase("finsight");
var redis = builder.AddRedis("cache");
var api   = builder.AddProject<Projects.FinSight_Api>("api").WithReference(sql).WithReference(redis);
builder.AddNpmApp("web", "../FinSight.Web").WithReference(api).WithHttpEndpoint(env: "PORT");
// The JavaScript hosting API has changed between Aspire versions (newer releases add AddJavaScriptApp
// and AddViteApp); check the docs for the version you install.
builder.Build().Run();
```

## FS1.4 Configuration for a front end 🟡 ⭐

> [!warning] Everything in a front-end bundle is public
> Environment files (`environment.prod.ts`, `import.meta.env.VITE_*`, `NEXT_PUBLIC_*`) are compiled into JavaScript that **anyone can read**. Never put secrets there: no API keys with write access, no connection strings. Only public values (the API base path, a public analytics ID, feature flags that aren't sensitive).

| Approach | How | Trade-off |
|---|---|---|
| **Build-time** | Angular `environment.*.ts` with file replacements; Vite `.env.production` | Simple; but you need a **separate build per environment**, which breaks "build once, promote everywhere" ([[S10.1]]) |
| **Runtime config** | The app fetches `/config.json` (or a `window.__CONFIG__` script written at container start) before bootstrapping | One build for all environments; values set by the deployment |
| **Relative URLs** | Call `/api/...` and let the reverse proxy route | No API URL to configure at all, which is the simplest when same-origin |

```ts
// Angular: load runtime config before the app starts
export const appConfig: ApplicationConfig = {
  providers: [
    provideAppInitializer(async () => {
      const cfg = await fetch("/config.json").then(r => r.json());
      inject(AppConfigService).set(cfg);
    }),
  ],
};
```

## FS1.5 Repository layout 🟢

| | **Monorepo** (front end + back end together) | **Polyrepo** (separate repositories) |
|---|---|---|
| Pros | One pull request changes the API and the UI atomically; shared tooling; generated clients always in sync | Independent permissions, release cadences and pipelines |
| Cons | Bigger repo; CI must build only what changed | Cross-repo changes need coordination and versioned contracts |
| Tools | Nx, Turborepo; a solution plus `web/` folder | Package registries for shared clients |

```text
finsight/
  src/
    FinSight.Api/          FinSight.Application/   FinSight.Domain/   FinSight.Infrastructure/
  web/                     # Angular app (generated API client in web/src/app/api)
  tests/
    FinSight.UnitTests/    FinSight.IntegrationTests/   web-e2e/ (Playwright)
  deploy/                  # compose.yaml, Caddyfile, Bicep
  docs/adr/                # architecture decision records
```

## FS1.6 A feature, end to end ⭐

"The accountant clicks **Mark paid** on an overdue invoice." Walk every layer; this is the most common full-stack interview question in disguise.

| Layer | What happens | Decisions worth mentioning |
|---|---|---|
| **UI** | Button is disabled while pending; optimistic "Paid" badge ([[F8.4]]) | Accessible button, `aria-live` confirmation, rollback on error |
| **Client data layer** | `POST /api/invoices/{id}/payments` with an `Idempotency-Key`; the auth cookie travels automatically (same origin) | Generated typed client; interceptor maps 401 to login, ProblemDetails to messages |
| **Edge** | Reverse proxy terminates TLS, forwards to the API | Rate limit on write endpoints |
| **API pipeline** | Exception handler → auth → authorisation policy `CanRecordPayment` | Resource-based check: same tenant, invoice not already paid ([[B7.6]]) |
| **Application** | Validate the amount, load the invoice aggregate, `invoice.ApplyPayment()` | Invariants in the domain; idempotency record ([[B4.4]]) |
| **Data** | EF Core saves the payment, the invoice status and an **outbox** event in one transaction | rowversion for concurrency → 409 if someone else changed it ([[B5.7]]) |
| **Async** | Outbox relay publishes `InvoicePaid`; workers re-forecast, send the receipt, invalidate the dashboard cache | At-least-once, idempotent consumers ([[B8]]) |
| **Real-time back to the UI** | SignalR pushes `InvoicePaid` to the company's group; the UI invalidates the invoices and dashboard queries | Tenant-scoped SignalR groups ([[FS3]]) |
| **Observability** | One trace from click to database to worker | Trace ID shown in error toasts for support ([[B11]]) |

> [!say]
> "When the accountant clicks Mark paid, the UI shows the change optimistically and posts to the payments endpoint with an idempotency key. The API authenticates the cookie, checks the user may record payments for that tenant and that the invoice isn't already paid, applies the payment through the invoice aggregate, and saves the payment, the new status and an outbox event in one transaction, with a rowversion guarding concurrent edits. A background relay publishes InvoicePaid, which triggers re-forecasting and the receipt, and SignalR tells the dashboard to refresh. If anything fails, the UI rolls back and shows the ProblemDetails message with a trace ID."

## FS1.7 Choosing a stack for a new product 🟡

| If… | Lean towards |
|---|---|
| The team is .NET-strong, the product is a logged-in business app, Azure-hosted | **Angular (or React) SPA + ASP.NET Core API**, same origin |
| Public pages need SEO and fast first load, the team is TypeScript-strong | **Next.js** full-stack (or Next.js front end + .NET API) |
| Many client types (web, mobile, partners) over several services | SPA + BFF + services behind an API gateway |
| A small internal tool, fast | Blazor or a server-rendered app, or a low-code platform |
| Real-time collaboration is central | Add SignalR or WebSockets from day one; design state for it |

> [!say]
> "I'd choose based on the team, the users and the hosting. For a logged-in finance app with a .NET team, an Angular SPA and an ASP.NET Core API on one origin is simple and strong. If public pages needed SEO, I'd look at server rendering, Angular SSR or Next.js, and I'd keep the API contract generated so the front end can't drift."

> [!lab] Make FinSight's seams explicit
> (1) Generate the Angular API client from FinSight's OpenAPI document and replace hand-written interfaces; add a CI step that fails on drift. (2) Switch environment-specific settings to runtime `config.json`. (3) Write the "Mark paid" walkthrough above for your real code, noting every gap (no idempotency key? no rowversion?) and fix one. That's three concrete improvements for your Full-Stack CV.

## FS1.8 Interview drill 🟢 ⭐

| Question | Strong short answer |
|---|---|
| SPA + API vs server rendering? | A static SPA calls an API from the browser; server rendering produces HTML on the server for SEO and fast first load, then hydrates. |
| Same-origin vs cross-origin deployment? | One host with a reverse proxy (no CORS, first-party cookies) vs separate hosts (CORS and cross-site cookie rules). |
| How do you keep front-end types in sync with the API? | Generate them from the API's OpenAPI document and check for drift in CI. |
| How do you call the API locally without CORS? | The dev server's proxy (Angular proxy.conf.json, Vite server.proxy) so the browser sees one origin. |
| Can you put an API key in environment.prod.ts? | No: front-end bundles are public; only non-secret values belong there. |
| Build-time vs runtime front-end config? | Build-time needs a build per environment; runtime config (config.json) allows build once, deploy everywhere. |
| What is a BFF? | A backend tailored to one front end that handles auth server-side and shapes data for its screens. |
| Monorepo or polyrepo for a full-stack app? | A monorepo keeps API and UI changes atomic and generated clients in sync; polyrepos suit independent teams and cadences. |
| Walk a feature end to end. | UI → typed client → proxy → pipeline and authorisation → domain logic → transactional save with outbox → async consumers → real-time update → telemetry. |
| How do you represent money between C# and TypeScript? | Decimal on the server; a string or integer minor units in JSON with a currency code; format with Intl on the client. |

## Key takeaways

> [!check]
> - Know your deployment shape and its consequences: same-origin avoids CORS and cross-site cookie pain.
> - Generate the client from OpenAPI; never hand-sync DTOs.
> - Front-end config is public; prefer runtime config for "build once, deploy everywhere".
> - Practise walking one feature through every layer; it's the full-stack interview.
> - Choose stacks by team, users and hosting, and say why.

## Sources

- Microsoft Learn: [Generate OpenAPI documents](https://learn.microsoft.com/en-us/aspnet/core/fundamentals/openapi/aspnetcore-openapi), [Kiota](https://learn.microsoft.com/en-us/openapi/kiota/overview), [NSwag](https://learn.microsoft.com/en-us/aspnet/core/tutorials/getting-started-with-nswag), [Aspire overview](https://learn.microsoft.com/en-us/dotnet/aspire/get-started/aspire-overview), [Backends for Frontends pattern](https://learn.microsoft.com/en-us/azure/architecture/patterns/backends-for-frontends).
- Angular: [Proxying to a backend server](https://angular.dev/tools/cli/serve#proxying-to-a-backend-server), [Configuring application environments](https://angular.dev/tools/cli/environments). Vite: [server.proxy](https://vite.dev/config/server-options#server-proxy), [Env variables and modes](https://vite.dev/guide/env-and-mode).
- [openapi-typescript](https://openapi-ts.dev/) · [Orval](https://orval.dev/) · [Nx](https://nx.dev/).
- Sam Newman, "[Backends For Frontends](https://samnewman.io/patterns/architectural/bff/)".
