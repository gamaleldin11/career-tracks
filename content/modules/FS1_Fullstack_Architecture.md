# Full-Stack Architecture — How the Front End and Back End Fit Together

A full-stack developer is judged on the **seams**: how the UI and the API agree on data, how they're served and configured, how a feature travels from a button to a database row and back. Knowing Angular and knowing ASP.NET Core separately isn't the same as knowing how to join them well. This module covers the shapes a full-stack system can take, keeping the two halves in sync, local development, configuration, and walking a feature through every layer, using FinSight as the running example.

> [!focus]
> **Entry must:** explain SPA + API vs server-rendered apps; describe how your front end calls your API (base URL, auth, errors); run both locally with a proxy; walk a feature through all layers.
> **Mid adds:** same-origin vs cross-origin deployments, the backend-for-frontend pattern, generating typed clients from OpenAPI, runtime vs build-time configuration, monorepos, choosing a stack for a new product.
> **Most asked:** *Walk me through what happens when the user clicks Save* · *How do your front end and back end share types?* · *How do you deploy the front end and the API?* · *How do you configure the API URL per environment?* · *Why Angular and .NET, not Next.js?*
> **Time budget:** 3 hours.

## FS1.0 Foundations: two programs and a boundary 🟢

A web application is really **two programs on two computers** that talk over HTTP:

- The **front end** runs in the user's browser. Its code is downloaded, so anyone can read it, change it in DevTools, or skip it and call your API directly with `curl`. Treat it as **untrusted**: its validation is a convenience for the user, not a protection.
- The **back end** runs on servers you control. Secrets, permissions, business rules and the database live there, and every rule is checked there again.
- Between them, data travels as **JSON text**: serialised on one side, parsed on the other. Both sides must agree on its shape (the **contract**, [[FS1.2]]), and either side can see the network fail or be slow, so the UI always needs loading and error states.

<figure class="dia anim"><svg viewBox="0 0 720 248" role="img" aria-label="Animation: requests and JSON responses cross the trust boundary between the user's browser, where code is public and editable, and the servers you control, where secrets, rules and data live">
<rect class="sN" x="14" y="24" width="300" height="190" rx="12"/><text class="sT" x="164" y="44" text-anchor="middle">the user's browser</text>
<rect class="sA" x="54" y="56" width="220" height="44" rx="8"/><text class="sT" x="164" y="76" text-anchor="middle">Angular / React app</text><text class="sC" x="164" y="92" text-anchor="middle">downloaded JavaScript</text>
<text class="sC" x="30" y="128">• anyone can read and change the code</text>
<text class="sC" x="30" y="150">• client validation = convenience only</text>
<text class="sC" x="30" y="172">• clock, locale and network vary</text>
<line class="sLr" x1="360" y1="14" x2="360" y2="222" stroke-dasharray="7 5"/><text class="sRt" x="360" y="238" text-anchor="middle">trust boundary</text>
<line class="sLm" x1="316" y1="90" x2="400" y2="90" marker-end="url(#ahm)"/><line class="sLm" x1="404" y1="140" x2="320" y2="140" marker-end="url(#ahm)"/>
<text class="sC" x="340" y="82" text-anchor="end">request</text><text class="sC" x="380" y="156">JSON</text>
<rect class="sN" x="406" y="24" width="300" height="190" rx="12"/><text class="sT" x="556" y="44" text-anchor="middle">servers you control</text>
<rect class="sG" x="436" y="56" width="120" height="44" rx="8"/><text class="sT" x="496" y="76" text-anchor="middle">API</text><text class="sC" x="496" y="92" text-anchor="middle">rules · auth</text><rect class="sB" x="576" y="56" width="110" height="44" rx="8"/><text class="sT" x="631" y="76" text-anchor="middle">database</text><text class="sC" x="631" y="92" text-anchor="middle">source of truth</text>
<text class="sC" x="422" y="128">• secrets and keys live only here</text>
<text class="sC" x="422" y="150">• authorisation decided here</text>
<text class="sC" x="422" y="172">• one clock (UTC) and one truth</text>
<circle class="sP" r="5"><animateMotion dur="3s" repeatCount="indefinite" path="M274 78 H436"/></circle><circle class="sPg" r="5"><animateMotion dur="3s" begin="1.5s" repeatCount="indefinite" path="M436 120 H274"/></circle>
</svg><figcaption>Two programs on two computers. Anything that matters (validation, permissions, secrets) has to live on the right of the line.</figcaption></figure>

**Origin** is the other idea that shapes every deployment decision. The browser groups everything by origin, the combination of **scheme, host and port**. A page may call its own origin freely; reading responses from another origin needs the server's permission (**CORS**, [[FS2.6]]), and cookies follow their own "site" rules ([[FS2.2]]).

<figure class="dia"><svg viewBox="0 0 720 246" role="img" aria-label="The parts of a URL that form its origin: scheme, host and port; and four example URLs compared with https://app.example.com">
<rect class="sV" x="40" y="24" width="70" height="34" rx="6"/><text class="sT" x="75" y="46" text-anchor="middle">https</text><text class="sC" x="75" y="76" text-anchor="middle">scheme</text>
<rect class="sA" x="118" y="24" width="170" height="34" rx="6"/><text class="sT" x="203" y="46" text-anchor="middle">app.example.com</text><text class="sC" x="203" y="76" text-anchor="middle">host</text>
<rect class="sW" x="296" y="24" width="70" height="34" rx="6"/><text class="sT" x="331" y="46" text-anchor="middle">443</text><text class="sC" x="331" y="76" text-anchor="middle">port</text>
<rect class="sN" x="374" y="24" width="170" height="34" rx="6"/><text class="sC" x="459" y="46" text-anchor="middle">/invoices?page=2</text><text class="sC" x="459" y="76" text-anchor="middle">path: not part of it</text>
<path class="sLm" d="M40 88 V96 H366 V88" fill="none"/><text class="sM" x="203" y="112" text-anchor="middle">origin = scheme + host + port</text>
<text class="sM" x="40" y="140">a page on https://app.example.com calling…</text>
<text class="sC" x="40" y="164" xml:space="preserve" style="white-space:pre">https://app.example.com/api/invoices</text><text class="sC" x="380" y="164">same origin</text><text class="sGt" x="530" y="164">✓ allowed freely</text>
<text class="sC" x="40" y="186" xml:space="preserve" style="white-space:pre">https://api.example.com</text><text class="sC" x="380" y="186">different host</text><text class="sRt" x="530" y="186">✗ needs CORS</text>
<text class="sC" x="40" y="208" xml:space="preserve" style="white-space:pre">http://app.example.com</text><text class="sC" x="380" y="208">different scheme</text><text class="sRt" x="530" y="208">✗ needs CORS</text>
<text class="sC" x="40" y="230" xml:space="preserve" style="white-space:pre">https://app.example.com:8443</text><text class="sC" x="380" y="230">different port</text><text class="sRt" x="530" y="230">✗ needs CORS</text>
</svg><figcaption>The browser's unit of trust is the origin. Change any one of the three parts and you're talking to a different origin.</figcaption></figure>

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

<figure class="dia"><svg viewBox="0 0 720 222" role="img" aria-label="Cross-origin deployment: the browser loads the SPA from a CDN at app.example.com and calls the API at api.example.com, which needs a CORS preflight and response headers">
<rect class="sB" x="10" y="90" width="100" height="44" rx="8"/><text class="sT" x="60" y="110" text-anchor="middle">browser</text><text class="sC" x="60" y="126" text-anchor="middle">app.example.com</text>
<rect class="sA" x="220" y="20" width="170" height="50" rx="8"/><text class="sT" x="305" y="43" text-anchor="middle">CDN</text><text class="sS" x="305" y="59" text-anchor="middle">app.example.com: SPA files</text>
<rect class="sG" x="220" y="150" width="170" height="50" rx="8"/><text class="sT" x="305" y="173" text-anchor="middle">API</text><text class="sC" x="305" y="189" text-anchor="middle">api.example.com</text><line class="sL" x1="390" y1="175" x2="460" y2="175"/><rect class="sB" x="460" y="150" width="120" height="50" rx="8"/><text class="sT" x="520" y="180" text-anchor="middle">database</text>
<line class="sL" x1="110" y1="104" x2="216" y2="50" marker-end="url(#ah)"/>
<line class="sLw" x1="110" y1="124" x2="216" y2="160" marker-end="url(#ahw)" stroke-dasharray="5 4"/><text class="sWt" x="140" y="166">1 OPTIONS preflight</text>
<line class="sLg" x1="110" y1="132" x2="216" y2="186" marker-end="url(#ahg)"/><text class="sGt" x="110" y="210">2 real request, if allowed</text>
<rect class="sW" x="430" y="30" width="276" height="80" rx="8"/><text class="sC" x="568" y="52" text-anchor="middle">the API must answer with</text><text class="sC" x="444" y="74" xml:space="preserve" style="white-space:pre">Access-Control-Allow-Origin:</text><text class="sC" x="444" y="94" xml:space="preserve" style="white-space:pre">  https://app.example.com</text>
</svg><figcaption>Cross-origin: independent hosting and scaling, paid for with CORS, preflight round trips and stricter cookie rules (FS2.6 has the details).</figcaption></figure>

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

<figure class="dia anim"><svg viewBox="0 0 720 170" role="img" aria-label="Animation: C# DTOs produce an OpenAPI document, a generator turns it into TypeScript types, and components compile against them; CI regenerates and fails on drift">
<rect class="sV" x="8" y="30" width="132" height="54" rx="8"/><text class="sT" x="74" y="55" text-anchor="middle">C# DTOs</text><text class="sC" x="74" y="71" text-anchor="middle">record InvoiceDto</text>
<line class="sLm" x1="140" y1="57" x2="150" y2="57" marker-end="url(#ahm)"/>
<rect class="sW" x="152" y="30" width="132" height="54" rx="8"/><text class="sT" x="218" y="55" text-anchor="middle">OpenAPI 3.1</text><text class="sC" x="218" y="71" text-anchor="middle">/openapi/v1.json</text>
<line class="sLm" x1="284" y1="57" x2="294" y2="57" marker-end="url(#ahm)"/>
<rect class="sB" x="296" y="30" width="132" height="54" rx="8"/><text class="sT" x="362" y="55" text-anchor="middle">generator</text><text class="sC" x="362" y="71" text-anchor="middle">openapi-typescript…</text>
<line class="sLm" x1="428" y1="57" x2="438" y2="57" marker-end="url(#ahm)"/>
<rect class="sA" x="440" y="30" width="132" height="54" rx="8"/><text class="sT" x="506" y="55" text-anchor="middle">TypeScript types</text><text class="sC" x="506" y="71" text-anchor="middle">schema.d.ts</text>
<line class="sLm" x1="572" y1="57" x2="582" y2="57" marker-end="url(#ahm)"/>
<rect class="sG" x="584" y="30" width="132" height="54" rx="8"/><text class="sT" x="650" y="55" text-anchor="middle">components</text><text class="sC" x="650" y="71" text-anchor="middle">compile against them</text>
<circle class="sP" r="5"><animateMotion dur="4s" repeatCount="indefinite" path="M74 57 H650"/></circle>
<rect class="sR" x="150" y="112" width="420" height="46" rx="8" opacity=".9"/><text class="sT" x="360" y="132" text-anchor="middle">CI: regenerate, then git diff --exit-code</text><text class="sC" x="360" y="150" text-anchor="middle">a renamed field fails the build, not production</text>
<path class="sLr" d="M218 84 V110" marker-end="url(#ahr)"/><path class="sLr" d="M506 110 V86" marker-end="url(#ahr)"/>
</svg><figcaption>One source of truth for the contract: the server's code. Everything downstream is generated.</figcaption></figure>

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

<figure class="dia"><svg viewBox="0 0 720 202" role="img" aria-label="Local development: the browser talks only to the front-end dev server on port 4200, which proxies /api and /hubs to the API on port 7001">
<rect class="sB" x="10" y="70" width="110" height="50" rx="8"/><text class="sT" x="65" y="93" text-anchor="middle">browser</text><text class="sC" x="65" y="109" text-anchor="middle">one origin</text>
<rect class="sA" x="170" y="30" width="230" height="130" rx="10"/><text class="sT" x="285" y="52" text-anchor="middle">dev server :4200</text><text class="sC" x="285" y="76" text-anchor="middle">serves the bundle, hot reload</text>
<rect class="sN" x="186" y="92" width="198" height="50" rx="6"/><text class="sC" x="285" y="112" text-anchor="middle">proxy: /api and /hubs</text><text class="sC" x="285" y="130" text-anchor="middle">→ https://localhost:7001</text>
<line class="sL" x1="120" y1="95" x2="166" y2="95" marker-end="url(#ah)"/>
<line class="sLg" x1="384" y1="117" x2="466" y2="117" marker-end="url(#ahg)"/><rect class="sG" x="470" y="92" width="120" height="50" rx="8"/><text class="sT" x="530" y="115" text-anchor="middle">API :7001</text><text class="sC" x="530" y="131" text-anchor="middle">ASP.NET Core</text><line class="sL" x1="590" y1="117" x2="616" y2="117"/><rect class="sB" x="616" y="92" width="94" height="50" rx="8"/><text class="sT" x="663" y="115" text-anchor="middle">database</text><text class="sC" x="663" y="131" text-anchor="middle">compose</text>
<text class="sS" x="360" y="190" text-anchor="middle">the browser only ever talks to localhost:4200, so no CORS and real cookies, like production</text>
</svg><figcaption>The dev-server proxy recreates the same-origin production setup on your machine.</figcaption></figure>

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

<figure class="dia"><svg viewBox="0 0 720 196" role="img" aria-label="Build-time configuration produces a different bundle per environment; runtime configuration deploys one build everywhere with a config.json per environment">
<text class="sT" x="180" y="22" text-anchor="middle">build-time config</text><text class="sT" x="540" y="22" text-anchor="middle">runtime config</text>
<rect class="sB" x="110" y="36" width="140" height="40" rx="8"/><text class="sT" x="180" y="61" text-anchor="middle">source</text>
<line class="sLm" x1="180" y1="76" x2="66" y2="106" marker-end="url(#ahm)"/><rect class="sW" x="14" y="108" width="104" height="44" rx="8"/><text class="sT" x="66" y="128" text-anchor="middle">build (dev)</text><text class="sC" x="66" y="144" text-anchor="middle">apiUrl baked in</text>
<line class="sLm" x1="180" y1="76" x2="182" y2="106" marker-end="url(#ahm)"/><rect class="sW" x="130" y="108" width="104" height="44" rx="8"/><text class="sT" x="182" y="128" text-anchor="middle">build (staging)</text><text class="sC" x="182" y="144" text-anchor="middle">apiUrl baked in</text>
<line class="sLm" x1="180" y1="76" x2="298" y2="106" marker-end="url(#ahm)"/><rect class="sW" x="246" y="108" width="104" height="44" rx="8"/><text class="sT" x="298" y="128" text-anchor="middle">build (prod)</text><text class="sC" x="298" y="144" text-anchor="middle">apiUrl baked in</text>
<text class="sRt" x="180" y="180" text-anchor="middle">prod runs a bundle nobody tested</text>
<line class="sD" x1="360" y1="10" x2="360" y2="196"/>
<rect class="sA" x="470" y="36" width="140" height="40" rx="8"/><text class="sT" x="540" y="54" text-anchor="middle">one build</text><text class="sC" x="540" y="70" text-anchor="middle">tested once</text>
<line class="sLm" x1="540" y1="76" x2="426" y2="106" marker-end="url(#ahm)"/><rect class="sG" x="374" y="108" width="104" height="44" rx="8"/><text class="sT" x="426" y="128" text-anchor="middle">dev</text><text class="sC" x="426" y="144" text-anchor="middle">config.json</text>
<line class="sLm" x1="540" y1="76" x2="542" y2="106" marker-end="url(#ahm)"/><rect class="sG" x="490" y="108" width="104" height="44" rx="8"/><text class="sT" x="542" y="128" text-anchor="middle">staging</text><text class="sC" x="542" y="144" text-anchor="middle">config.json</text>
<line class="sLm" x1="540" y1="76" x2="658" y2="106" marker-end="url(#ahm)"/><rect class="sG" x="606" y="108" width="104" height="44" rx="8"/><text class="sT" x="658" y="128" text-anchor="middle">prod</text><text class="sC" x="658" y="144" text-anchor="middle">config.json</text>
<text class="sGt" x="540" y="180" text-anchor="middle">one artifact; values set per environment</text>
</svg><figcaption>"Build once, promote everywhere" needs runtime configuration. With same-origin relative URLs you may need neither.</figcaption></figure>

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

<figure class="dia steps"><svg viewBox="0 0 720 266" role="img" aria-label="The Mark paid feature travelling through eight layers: UI, client data layer, edge, API pipeline, application, data, async processing and a real-time update back to the UI">
<rect class="sN" x="14" y="20" width="692" height="26" rx="5"/><text class="sM" x="24" y="37">UI</text>
<rect class="sN" x="14" y="50" width="692" height="26" rx="5"/><text class="sM" x="24" y="67">client data layer</text>
<rect class="sN" x="14" y="80" width="692" height="26" rx="5"/><text class="sM" x="24" y="97">edge</text>
<rect class="sN" x="14" y="110" width="692" height="26" rx="5"/><text class="sM" x="24" y="127">API pipeline</text>
<rect class="sN" x="14" y="140" width="692" height="26" rx="5"/><text class="sM" x="24" y="157">application</text>
<rect class="sN" x="14" y="170" width="692" height="26" rx="5"/><text class="sM" x="24" y="187">data</text>
<rect class="sN" x="14" y="200" width="692" height="26" rx="5"/><text class="sM" x="24" y="217">async</text>
<rect class="sN" x="14" y="230" width="692" height="26" rx="5"/><text class="sM" x="24" y="247">real-time</text>
<g data-s="1"><rect class="sA" x="196" y="22" width="470" height="22" rx="4" opacity=".8"/><text class="sC" x="206" y="37">button disabled · optimistic "Paid" badge</text></g>
<g data-s="2"><rect class="sA" x="196" y="52" width="470" height="22" rx="4" opacity=".8"/><text class="sC" x="206" y="67">POST /api/invoices/42/payments · Idempotency-Key · cookie</text></g>
<g class="pk" data-s="2"><circle class="sP" r="5"><animateMotion dur="0.8s" begin="indefinite" fill="freeze" path="M184 33 V63"/></circle></g>
<g data-s="3"><rect class="sB" x="196" y="82" width="470" height="22" rx="4" opacity=".8"/><text class="sC" x="206" y="97">reverse proxy: TLS, rate limit, forward to the API</text></g>
<g class="pk" data-s="3"><circle class="sP" r="5"><animateMotion dur="0.8s" begin="indefinite" fill="freeze" path="M184 63 V93"/></circle></g>
<g data-s="4"><rect class="sV" x="196" y="112" width="470" height="22" rx="4" opacity=".8"/><text class="sC" x="206" y="127">authenticate → policy CanRecordPayment (same tenant?)</text></g>
<g class="pk" data-s="4"><circle class="sP" r="5"><animateMotion dur="0.8s" begin="indefinite" fill="freeze" path="M184 93 V123"/></circle></g>
<g data-s="5"><rect class="sV" x="196" y="142" width="470" height="22" rx="4" opacity=".8"/><text class="sC" x="206" y="157">validate amount → invoice.ApplyPayment() enforces rules</text></g>
<g class="pk" data-s="5"><circle class="sP" r="5"><animateMotion dur="0.8s" begin="indefinite" fill="freeze" path="M184 123 V153"/></circle></g>
<g data-s="6"><rect class="sG" x="196" y="172" width="470" height="22" rx="4" opacity=".8"/><text class="sC" x="206" y="187">one transaction: payment + status + outbox row</text></g>
<g class="pk" data-s="6"><circle class="sP" r="5"><animateMotion dur="0.8s" begin="indefinite" fill="freeze" path="M184 153 V183"/></circle></g>
<g data-s="7"><rect class="sW" x="196" y="202" width="470" height="22" rx="4" opacity=".8"/><text class="sC" x="206" y="217">relay publishes InvoicePaid → forecast, receipt, cache</text></g>
<g class="pk" data-s="7"><circle class="sP" r="5"><animateMotion dur="0.8s" begin="indefinite" fill="freeze" path="M184 183 V213"/></circle></g>
<g data-s="8"><rect class="sW" x="196" y="232" width="470" height="22" rx="4" opacity=".8"/><text class="sC" x="206" y="247">SignalR to the tenant group → UI refetches</text></g>
<g class="pk" data-s="8"><circle class="sPg" r="5"><animateMotion dur="1.4s" begin="indefinite" fill="freeze" path="M684 213 V33"/></circle></g>
<g data-s="8"><line class="sLg" x1="684" y1="243" x2="684" y2="36" stroke-dasharray="4 4" marker-end="url(#ahg)"/></g>
</svg><ol class="dia-steps">
<li>The click: the button disables itself and the badge turns "Paid" immediately (optimistic), with a rollback ready if the call fails.</li>
<li>The generated client posts to the payments endpoint with an idempotency key, so a retry can't pay twice. On the same origin the auth cookie travels automatically.</li>
<li>The reverse proxy terminates TLS, applies a rate limit to writes and forwards the request.</li>
<li>Authentication reads the cookie; a resource-based policy checks this user may record payments for <b>this</b> tenant's invoice.</li>
<li>The handler validates the amount and asks the invoice aggregate to apply the payment, which enforces "not already paid".</li>
<li>EF Core saves the payment, the new status and an outbox event in one transaction. A rowversion clash returns 409.</li>
<li>The outbox relay publishes <code>InvoicePaid</code>. Workers re-run the forecast, email the receipt and invalidate the dashboard cache.</li>
<li>SignalR pushes the event to the company's group, and every open screen refetches its invoices. One trace ID links all eight steps in your telemetry.</li>
</ol><figcaption>The question behind most full-stack interviews: what happens between the click and the database, and back?</figcaption></figure>

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
