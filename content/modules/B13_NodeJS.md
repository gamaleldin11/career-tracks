# Node.js for .NET Developers — Event Loop, Express, NestJS and Prisma

A large share of Egyptian backend and full-stack postings ask for Node.js: MERN and MEAN stacks at startups, NestJS at product companies, Express in agencies. You already have Node experience: the Express backends (with 34 tests) in your freelance template library, the Express chatbot in the investment platform, and Prisma with Next.js in the course platform. This module maps Node onto what you know from ASP.NET Core, and covers what's genuinely different: one thread, non-blocking I/O, and the npm ecosystem.

> [!focus]
> **Entry must:** how Node handles concurrency with one thread; npm and package.json; an Express API with middleware, routing, validation and error handling; async/await and promise errors; environment configuration.
> **Mid adds:** what blocks the event loop and how to avoid it (worker threads, streams), NestJS architecture, Prisma or another ORM, testing with supertest, production concerns (graceful shutdown, clustering, logging), Node vs .NET trade-offs.
> **Most asked:** *How is Node single-threaded but handles many requests?* · *What blocks the event loop?* · *Express middleware?* · *How do you handle errors in Express?* · *NestJS vs Express?* · *Node or .NET for this project?*
> **Time budget:** 3 hours.

## B13.0 Foundations: what Node actually is 🟢

JavaScript was created to run inside browsers. **Node.js** (2009) took Chrome's JavaScript engine out of the browser and added what a server needs: files, sockets, processes and timers. It has three parts:

- **V8** compiles your JavaScript to machine code and runs it on **one call stack**, with a garbage-collected heap. It's the equivalent of the CLR's JIT and GC.
- **libuv**, a C library, provides the **event loop** and a small **thread pool**. It asks the operating system to do I/O asynchronously and tells the loop when results are ready.
- **Node's standard library** (`http`, `fs`, `crypto`, `stream`, `timers`) is the JavaScript API you call; it hands slow work to libuv.

<figure class="dia"><svg viewBox="0 0 720 270" role="img" aria-label="Node.js layers: your JavaScript calls Node APIs, which run on the V8 engine and the libuv event loop and thread pool, which use the operating system's asynchronous I/O">
<rect class="sA" x="200" y="16" width="320" height="40" rx="8"/><text class="sT" x="360" y="41" text-anchor="middle">your JavaScript (server.js)</text>
<line class="sLm" x1="360" y1="56" x2="360" y2="76" marker-end="url(#ahm)"/>
<rect class="sB" x="110" y="78" width="500" height="40" rx="8"/><text class="sT" x="360" y="103" text-anchor="middle">Node APIs: http · fs · crypto · stream · timers</text>
<line class="sLm" x1="250" y1="118" x2="200" y2="140" marker-end="url(#ahm)"/><line class="sLm" x1="470" y1="118" x2="520" y2="140" marker-end="url(#ahm)"/>
<rect class="sV" x="50" y="142" width="290" height="54" rx="8"/><text class="sT" x="195" y="167" text-anchor="middle">V8</text><text class="sC" x="195" y="183" text-anchor="middle">compiles and runs JS · one call stack · GC</text>
<rect class="sW" x="380" y="142" width="290" height="54" rx="8"/><text class="sT" x="525" y="167" text-anchor="middle">libuv</text><text class="sC" x="525" y="183" text-anchor="middle">event loop · thread pool (4 by default)</text>
<line class="sLm" x1="525" y1="196" x2="525" y2="216" marker-end="url(#ahm)"/>
<rect class="sG" x="50" y="218" width="620" height="40" rx="8"/><text class="sT" x="360" y="243" text-anchor="middle">operating system async I/O: epoll (Linux) · kqueue (macOS) · IOCP (Windows)</text>
</svg><figcaption>Node = V8 (the JavaScript engine from Chrome) + libuv (the event loop and thread pool) + a server-side standard library.</figcaption></figure>

The consequence that shapes everything else: **your JavaScript never runs in parallel with itself.** Two callbacks can't interleave in the middle of a function, so in-memory data needs no locks. But a function that takes 200 ms of CPU stops every other request for 200 ms. ASP.NET Core makes the opposite trade: many threads run requests truly in parallel, which uses all cores but requires thread-safe code ([[B1]]).

**The event loop** repeats a fixed cycle of phases. After **each** callback, Node empties the **microtask** queues (`process.nextTick` first, then promise continuations), which is why code after an `await` resumes before a `setTimeout(fn, 0)` scheduled at the same moment.

<figure class="dia anim"><svg viewBox="0 0 720 302" role="img" aria-label="Animation: the Node event loop cycles through the timers, pending callbacks, poll, check and close-callbacks phases; microtasks run after every callback">
<ellipse class="sLm" cx="360" cy="150" rx="170" ry="100" fill="none" stroke-dasharray="6 5"/>
<rect class="sW" x="274" y="28" width="172" height="44" rx="8"/><text class="sT" x="360" y="48" text-anchor="middle">timers</text><text class="sC" x="360" y="64" text-anchor="middle">setTimeout · setInterval</text>
<rect class="sN" x="436" y="97" width="172" height="44" rx="8"/><text class="sT" x="522" y="117" text-anchor="middle">pending callbacks</text><text class="sC" x="522" y="133" text-anchor="middle">deferred I/O errors</text>
<rect class="sA" x="374" y="209" width="172" height="44" rx="8"/><text class="sT" x="460" y="229" text-anchor="middle">poll</text><text class="sC" x="460" y="245" text-anchor="middle">new I/O: sockets, files</text>
<rect class="sV" x="174" y="209" width="172" height="44" rx="8"/><text class="sT" x="260" y="229" text-anchor="middle">check</text><text class="sC" x="260" y="245" text-anchor="middle">setImmediate</text>
<rect class="sN" x="112" y="97" width="172" height="44" rx="8"/><text class="sT" x="198" y="117" text-anchor="middle">close callbacks</text><text class="sC" x="198" y="133" text-anchor="middle">socket "close"</text>
<text class="sT" x="360" y="144" text-anchor="middle">one turn of the event loop</text><text class="sC" x="360" y="164" text-anchor="middle">microtasks drain after every callback</text>
<circle class="sP" r="7"><animateMotion dur="6s" repeatCount="indefinite" path="M360 50 A170 100 0 0 1 360 250 A170 100 0 0 1 360 50"/></circle>
<text class="sS" x="360" y="290" text-anchor="middle">promise continuations and process.nextTick are microtasks: they jump the queue</text>
</svg><figcaption>The phases of one turn. Most of a server's time is spent in <b>poll</b>, waiting for and handling I/O.</figcaption></figure>

## B13.1 The runtime model 🟢 ⭐

Node runs your JavaScript on **one main thread** with an **event loop**, like the browser ([[F4.1]]). I/O (network, files, timers, DNS) is handed to the operating system or to **libuv**, Node's C library, which uses OS async APIs and a small **thread pool** (4 threads by default) for things like file I/O, DNS lookups and crypto. When the I/O completes, a callback is queued and the event loop runs it.

So one Node process handles thousands of concurrent connections **as long as each piece of JavaScript finishes quickly**. Waiting costs nothing; computing blocks everyone.

<figure class="dia steps"><svg viewBox="0 0 720 248" role="img" aria-label="Timeline of a single JavaScript thread interleaving three requests while they wait for I/O, then a CPU-heavy request blocking a fourth">
<text class="sT" x="130" y="52" text-anchor="end">JS thread</text><rect class="sN" x="140" y="34" width="540" height="26" rx="4"/>
<text class="sC" x="130" y="96" text-anchor="end">request A</text>
<text class="sC" x="130" y="126" text-anchor="end">request B</text>
<text class="sC" x="130" y="156" text-anchor="end">request C</text>
<text class="sC" x="130" y="186" text-anchor="end">request D</text>
<text class="sC" x="130" y="216" text-anchor="end">request E</text>
<g data-s="1"><rect class="sA" x="141" y="36" width="25" height="22" rx="3"/><text class="sC" x="153.5" y="51" text-anchor="middle">A</text><circle class="sPg" cx="167" cy="92" r="4"/><line class="sLm" x1="167" y1="92" x2="356" y2="92" stroke-dasharray="5 4"/><text class="sC" x="261.5" y="86" text-anchor="middle">awaiting the database</text></g>
<g data-s="2"><rect class="sA" x="168" y="36" width="25" height="22" rx="3"/><text class="sC" x="180.5" y="51" text-anchor="middle">B</text><rect class="sA" x="195" y="36" width="25" height="22" rx="3"/><text class="sC" x="207.5" y="51" text-anchor="middle">C</text><circle class="sPg" cx="194" cy="122" r="4"/><line class="sLm" x1="194" y1="122" x2="329" y2="122" stroke-dasharray="5 4"/><text class="sC" x="261.5" y="116" text-anchor="middle">awaiting an HTTP call</text><circle class="sPg" cx="221" cy="152" r="4"/><line class="sLm" x1="221" y1="152" x2="383" y2="152" stroke-dasharray="5 4"/><text class="sC" x="302" y="146" text-anchor="middle">awaiting a file read</text></g>
<g data-s="3"><rect class="sG" x="330" y="36" width="25" height="22" rx="3"/><text class="sC" x="342.5" y="51" text-anchor="middle">B</text><rect class="sG" x="357" y="36" width="25" height="22" rx="3"/><text class="sC" x="369.5" y="51" text-anchor="middle">A</text><rect class="sG" x="384" y="36" width="25" height="22" rx="3"/><text class="sC" x="396.5" y="51" text-anchor="middle">C</text><text class="sGt" x="333" y="126">✓</text><text class="sGt" x="360" y="96">✓</text><text class="sGt" x="387" y="156">✓</text></g>
<g data-s="4"><rect class="sR" x="438" y="36" width="214" height="22" rx="3"/><text class="sC" x="545" y="51" text-anchor="middle">D: synchronous CPU work</text><circle class="sPr" cx="437" cy="182" r="4"/><circle class="sPg" cx="464" cy="212" r="4"/><line class="sLr" x1="464" y1="212" x2="653" y2="212" stroke-dasharray="5 4"/><text class="sC" x="558.5" y="206" text-anchor="middle">E is ready, but must wait</text><rect class="sW" x="654" y="36" width="25" height="22" rx="3"/><text class="sC" x="666.5" y="51" text-anchor="middle">E</text></g>
<text class="sC" x="140" y="236" text-anchor="middle">0 ms</text>
<text class="sC" x="275" y="236" text-anchor="middle">50 ms</text>
<text class="sC" x="410" y="236" text-anchor="middle">100 ms</text>
<text class="sC" x="545" y="236" text-anchor="middle">150 ms</text>
<text class="sC" x="680" y="236" text-anchor="middle">200 ms</text>
</svg><ol class="dia-steps">
<li>Request A arrives. Its JavaScript runs for a moment, starts a database query and <b>returns</b>. The thread is free again while the database works.</li>
<li>Requests B and C arrive and do the same: a short burst of JavaScript, then they wait on an HTTP call and a file read. Three requests are in flight on one thread.</li>
<li>As each I/O completes, its callback is queued and the thread runs it briefly to send the response. The thread was busy only 60 of 100 ms.</li>
<li>Request D runs 80 ms of synchronous CPU work (a huge <code>JSON.parse</code>, a sync hash). Nothing else can run: request E sits ready the whole time. Every user sees D's cost.</li>
</ol><figcaption>Waiting is free; computing blocks everyone. This is the whole Node performance model in one picture.</figcaption></figure>

| | Node.js | ASP.NET Core |
|---|---|---|
| Concurrency model | One JS thread + event loop + async I/O | A **thread pool** running many requests in parallel, plus async I/O |
| CPU-bound work | **Blocks all requests** unless moved to `worker_threads` or another service | Runs in parallel on other pool threads |
| Multi-core use | One process per core (`cluster`, PM2, or several containers) | One process uses all cores |
| Typing | JavaScript, or TypeScript compiled or stripped | C#, statically typed |
| Startup and footprint | Fast, light | Fast (and faster with Native AOT), somewhat heavier |
| Ecosystem | npm: huge, uneven quality, supply-chain risk | NuGet: smaller, more curated, strong first-party libraries |

> [!say]
> "Node runs JavaScript on a single thread with an event loop. I/O is non-blocking: it's handed to the OS or libuv's thread pool, and the callback runs when it completes. So Node handles many concurrent requests well as long as no request does heavy CPU work on the main thread; for that I'd use worker threads or a separate service. ASP.NET Core instead runs requests on a thread pool, so CPU work parallelises naturally."

### What blocks the event loop ⭐

- Synchronous APIs: `fs.readFileSync`, `crypto.pbkdf2Sync`, `zlib.gzipSync` in request handlers.
- Heavy computation: big JSON `parse`/`stringify`, sorting huge arrays, image processing, complex regular expressions (**catastrophic backtracking**, a denial-of-service vector).
- Large loops over data that could be streamed or paginated.

Fixes: async APIs, **streams** for big data, **`worker_threads`** for CPU work, a job queue (BullMQ on Redis) for slow tasks, and pagination.

## B13.2 npm and packages 🟢 ⭐

```jsonc
{
  "name": "ledger-api",
  "type": "module",                       // use ES modules
  "engines": { "node": ">=24" },
  "scripts": { "dev": "node --watch src/server.js", "test": "vitest run", "start": "node src/server.js" },
  "dependencies": { "express": "^5.1.0", "zod": "^3.24.0" },
  "devDependencies": { "vitest": "^3.0.0", "supertest": "^7.0.0" }
}
```

> [!term] Semantic versioning (semver)
> `MAJOR.MINOR.PATCH`: major for breaking changes, minor for features, patch for fixes. **`^5.1.0`** accepts any `5.x.x` ≥ 5.1.0; **`~5.1.0`** accepts only `5.1.x`; an exact `5.1.0` pins it.

<figure class="dia"><svg viewBox="0 0 720 224" role="img" aria-label="Version ranges on a number line: an exact pin matches only 5.1.0, a tilde range allows patch updates up to 5.2.0, a caret range allows minor updates up to 6.0.0">
<line class="sLm" x1="150" y1="150" x2="700" y2="150" marker-end="url(#ahm)"/>
<line class="sLm" x1="170" y1="144" x2="170" y2="156"/><text class="sC" x="170" y="172" text-anchor="middle">5.0.9</text>
<line class="sLm" x1="240" y1="144" x2="240" y2="156"/><text class="sC" x="240" y="172" text-anchor="middle">5.1.0</text>
<line class="sLm" x1="320" y1="144" x2="320" y2="156"/><text class="sC" x="320" y="172" text-anchor="middle">5.1.4</text>
<line class="sLm" x1="410" y1="144" x2="410" y2="156"/><text class="sC" x="410" y="172" text-anchor="middle">5.2.0</text>
<line class="sLm" x1="540" y1="144" x2="540" y2="156"/><text class="sC" x="540" y="172" text-anchor="middle">5.9.3</text>
<line class="sLm" x1="650" y1="144" x2="650" y2="156"/><text class="sC" x="650" y="172" text-anchor="middle">6.0.0</text>
<text class="sRt" x="650" y="188" text-anchor="middle">major: may break</text><text class="sC" x="410" y="188" text-anchor="middle">new feature</text><text class="sC" x="320" y="188" text-anchor="middle">bug fix</text>
<text class="sM" x="140" y="54" text-anchor="end">"5.1.0" exact</text><circle class="sPg" cx="240" cy="50" r="7"/>
<text class="sM" x="140" y="84" text-anchor="end">"~5.1.0"</text><rect class="sG" x="240" y="74" width="162" height="16" rx="8"/><text class="sRt" x="412" y="87">✗</text>
<text class="sM" x="140" y="114" text-anchor="end">"^5.1.0"</text><rect class="sA" x="240" y="104" width="402" height="16" rx="8"/><text class="sRt" x="652" y="117">✗</text>
<line class="sD" x1="240" y1="40" x2="240" y2="150"/>
<text class="sS" x="380" y="212" text-anchor="middle">the lock file pins what was actually installed; npm ci reproduces it exactly</text>
</svg><figcaption>Which versions each range accepts. <code>^</code> is npm's default and trusts authors to follow semver.</figcaption></figure>

- Commit **`package-lock.json`**; install with **`npm ci`** in CI and Docker (exact, reproducible, fails if the lock file is out of date).
- `dependencies` ship with the app; `devDependencies` are for building and testing only.
- Audit with `npm audit`; think twice before adding a dependency, given npm's supply-chain incidents ([[S9.10]]).
- Node versions: **Node 24** is in maintenance from 20 October 2026, and **Node 26 becomes LTS in October 2026**. Production should run an **even-numbered LTS** line. Recent Node versions can also run TypeScript files directly by stripping types ([[F5.1]]).

## B13.3 Express: the minimal framework 🟢 ⭐

Express is to Node what minimal APIs plus middleware are to ASP.NET Core: a router and a middleware chain, nothing more.

```js
import express from "express";
import helmet from "helmet";
import { z } from "zod";

const app = express();
app.use(helmet());                                  // security headers
app.use(express.json({ limit: "1mb" }));            // parse JSON bodies, with a size limit
app.use(requestId);                                 // custom middleware

const CreateInvoice = z.object({
  customer: z.string().min(1).max(120),
  amount: z.number().positive(),
  dueDate: z.coerce.date(),
});

app.post("/api/invoices", requireAuth, async (req, res) => {
  const body = CreateInvoice.parse(req.body);       // throws ZodError → handled below
  const invoice = await invoices.create({ ...body, companyId: req.user.companyId });  // tenant from the token, never the body
  res.status(201).location(`/api/invoices/${invoice.id}`).json(invoice);
});

app.get("/api/invoices/:id", requireAuth, async (req, res) => {
  const invoice = await invoices.findForCompany(req.params.id, req.user.companyId);
  if (!invoice) return res.status(404).json({ title: "Not found", status: 404 });
  res.json(invoice);
});

// Error-handling middleware: four parameters, registered LAST
app.use((err, req, res, next) => {
  if (err instanceof z.ZodError)
    return res.status(400).json({ title: "Validation failed", status: 400, errors: err.flatten().fieldErrors });
  req.log?.error({ err }, "unhandled");
  res.status(500).json({ title: "An unexpected error occurred", status: 500, traceId: req.id });
});

function requestId(req, res, next) {
  req.id = req.get("x-request-id") ?? crypto.randomUUID();
  res.set("x-request-id", req.id);
  next();                                           // forgetting next() hangs the request
}

app.listen(process.env.PORT ?? 3000);
```

> [!note] Express 5
> **Express 5** (stable since late 2024, the default `latest` on npm since 2025) passes **rejected promises from async handlers** to the error middleware automatically. In Express 4 an `async` handler that threw would hang the request or crash the process unless you wrapped it (`express-async-errors`, or `try/catch` + `next(err)`). Know both, because most existing code is Express 4.

**Middleware order matters exactly as in ASP.NET Core** ([[B3.2]]): security headers and body parsing first, then auth, then routes, then the error handler last.

<figure class="dia anim"><svg viewBox="0 0 720 226" role="img" aria-label="Animation: a request passes through helmet, the JSON parser, a request-ID middleware and auth to the route handler; a valid request returns 201, while a thrown validation error goes to the error middleware and returns 400">
<rect class="sB" x="10" y="40" width="90" height="50" rx="8"/><text class="sT" x="55" y="70" text-anchor="middle">client</text>
<rect class="sA" x="118" y="40" width="104" height="50" rx="8"/><text class="sT" x="170" y="63" text-anchor="middle">helmet()</text><text class="sC" x="170" y="79" text-anchor="middle">headers</text>
<line class="sLm" x1="104" y1="65" x2="116" y2="65" marker-end="url(#ahm)"/>
<rect class="sA" x="236" y="40" width="104" height="50" rx="8"/><text class="sT" x="288" y="63" text-anchor="middle">express.json()</text><text class="sC" x="288" y="79" text-anchor="middle">parse body</text>
<line class="sLm" x1="222" y1="65" x2="234" y2="65" marker-end="url(#ahm)"/>
<rect class="sA" x="354" y="40" width="104" height="50" rx="8"/><text class="sT" x="406" y="63" text-anchor="middle">requestId</text><text class="sC" x="406" y="79" text-anchor="middle">x-request-id</text>
<line class="sLm" x1="340" y1="65" x2="352" y2="65" marker-end="url(#ahm)"/>
<rect class="sA" x="472" y="40" width="104" height="50" rx="8"/><text class="sT" x="524" y="63" text-anchor="middle">requireAuth</text><text class="sC" x="524" y="79" text-anchor="middle">JWT → req.user</text>
<line class="sLm" x1="458" y1="65" x2="470" y2="65" marker-end="url(#ahm)"/>
<rect class="sG" x="590" y="40" width="104" height="50" rx="8"/><text class="sT" x="642" y="63" text-anchor="middle">route handler</text><text class="sC" x="642" y="79" text-anchor="middle">POST /invoices</text>
<line class="sLm" x1="576" y1="65" x2="588" y2="65" marker-end="url(#ahm)"/>
<rect class="sR" x="470" y="140" width="224" height="46" rx="8"/><text class="sT" x="582" y="161" text-anchor="middle">error middleware (err, req, res, next)</text><text class="sC" x="582" y="177" text-anchor="middle">registered last</text>
<path class="sLg" d="M640 90 V112 H55 V92" fill="none" stroke-dasharray="5 4" marker-end="url(#ahg)"/><text class="sGt" x="300" y="106" text-anchor="middle">201 Created</text>
<path class="sLr" d="M470 163 H40 V92" fill="none" stroke-dasharray="5 4" marker-end="url(#ahr)"/><text class="sRt" x="260" y="157" text-anchor="middle">400 problem details</text>
<line class="sLr" x1="660" y1="90" x2="660" y2="138" marker-end="url(#ahr)"/><text class="sRt" x="668" y="118">throw</text>
<circle class="sP" r="5"><animateMotion dur="4.5s" repeatCount="indefinite" path="M100 65 H640 V112 H55 V90"/></circle>
<circle class="sPr" r="5"><animateMotion dur="4.5s" begin="2.2s" repeatCount="indefinite" path="M100 65 H660 V163 H40 V90"/></circle>
<text class="sS" x="360" y="214" text-anchor="middle">each middleware calls next() or responds; a thrown error jumps to the error middleware</text>
</svg><figcaption>An Express app is an ordered list of functions. Order is behaviour, exactly as in the ASP.NET Core pipeline.</figcaption></figure>

## B13.4 NestJS: Angular-style structure on the server 🟡 ⭐

NestJS is an opinionated framework (on top of Express or Fastify) with **modules, controllers, providers and dependency injection** via decorators. If you know Angular and ASP.NET Core, it'll feel familiar immediately.

```ts
@Controller("invoices")
@UseGuards(JwtAuthGuard)
export class InvoicesController {
  constructor(private readonly invoices: InvoicesService) {}          // injected

  @Post()
  @HttpCode(201)
  create(@Body() dto: CreateInvoiceDto, @CurrentUser() user: User) {  // dto validated by a ValidationPipe
    return this.invoices.create(dto, user.companyId);
  }

  @Get(":id")
  findOne(@Param("id", ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.invoices.findForCompany(id, user.companyId);
  }
}

@Module({ imports: [PrismaModule], controllers: [InvoicesController], providers: [InvoicesService] })
export class InvoicesModule {}
```

| NestJS | ASP.NET Core equivalent | Angular equivalent |
|---|---|---|
| Module | Feature folder + DI registrations | NgModule |
| Controller | Controller | — |
| Provider / service | Service registered in DI | Injectable service |
| Guard | Authorization policy / filter | Route guard |
| Pipe | Model binding + validation | — (pipes transform values) |
| Interceptor | Middleware / filter around an action | HTTP interceptor |
| Exception filter | `IExceptionHandler` | — |

<figure class="dia anim"><svg viewBox="0 0 720 238" role="img" aria-label="Animation: a NestJS request passes through middleware, guards, interceptors, pipes and the controller handler, the response returns through the interceptors, and exception filters turn anything thrown into an HTTP error">
<rect class="sN" x="14" y="40" width="124" height="54" rx="8"/><text class="sT" x="76" y="62" text-anchor="middle">middleware</text><text class="sS" x="76" y="80" text-anchor="middle">helmet, logging</text>
<line class="sL" x1="138" y1="67" x2="152" y2="67" marker-end="url(#ah)"/>
<rect class="sV" x="154" y="40" width="124" height="54" rx="8"/><text class="sT" x="216" y="62" text-anchor="middle">guards</text><text class="sS" x="216" y="80" text-anchor="middle">JwtAuthGuard: 403?</text>
<line class="sL" x1="278" y1="67" x2="292" y2="67" marker-end="url(#ah)"/>
<rect class="sB" x="294" y="40" width="124" height="54" rx="8"/><text class="sT" x="356" y="62" text-anchor="middle">interceptors</text><text class="sS" x="356" y="80" text-anchor="middle">before: timing</text>
<line class="sL" x1="418" y1="67" x2="432" y2="67" marker-end="url(#ah)"/>
<rect class="sW" x="434" y="40" width="124" height="54" rx="8"/><text class="sT" x="496" y="62" text-anchor="middle">pipes</text><text class="sS" x="496" y="80" text-anchor="middle">ValidationPipe: 400?</text>
<line class="sL" x1="558" y1="67" x2="572" y2="67" marker-end="url(#ah)"/>
<rect class="sA" x="574" y="40" width="124" height="54" rx="8"/><text class="sT" x="636" y="62" text-anchor="middle">handler</text><text class="sS" x="636" y="80" text-anchor="middle">controller method</text>
<path class="sL" d="M 638 94 V 140 H 356 V 98" fill="none" marker-end="url(#ah)"/>
<text class="sS" x="500" y="132" text-anchor="middle">response passes back through the interceptors (after: map, cache)</text>
<rect class="sR" x="14" y="160" width="692" height="40" rx="8" opacity=".4"/><text class="sT" x="360" y="185" text-anchor="middle">exception filters: anything thrown anywhere above becomes an HTTP error response</text>
<text class="sM" x="80" y="28" text-anchor="middle">request →</text>
<circle class="sPg" r="5"><animateMotion dur="4s" repeatCount="indefinite" path="M 14 67 H 700 M 638 94 V 140 H 356 V 98"/></circle>
<text class="sS" x="360" y="226" text-anchor="middle">in ASP.NET Core terms: middleware, authorization, action filters, model binding, the action, exception handler</text>
</svg><figcaption>The NestJS request lifecycle: each decorator you put on a controller plugs into one of these slots.</figcaption></figure>

> [!say]
> "Express is minimal: routing and middleware, and you choose the structure. NestJS adds modules, dependency injection, guards, pipes and interceptors with decorators, much like ASP.NET Core and Angular, which helps larger teams stay consistent. For a small service I'd use Express or Fastify; for a bigger backend with several developers, NestJS."

## B13.5 Data access in Node 🟢 🟡

| Library | Style | Notes |
|---|---|---|
| **Prisma** | Schema file → generated, fully typed client; migrations | Very productive in TypeScript; used in your course platform |
| **Drizzle** | SQL-like TypeScript query builder, lightweight | Growing fast; close to SQL |
| TypeORM | Decorator-based entities, Active Record or Data Mapper | Common in NestJS codebases |
| Knex / `pg` / `mysql2` | Query builder / raw drivers | Full control |
| **Mongoose** | ODM for **MongoDB** | The "M" in MERN; schemas on top of a schemaless database |

```ts
// Prisma: typed queries, a transaction, and keyset pagination
const page = await prisma.invoice.findMany({
  where: { companyId, status: "OVERDUE" },
  orderBy: [{ dueDate: "asc" }, { id: "asc" }],
  take: 20,
  ...(cursor && { cursor: { id: cursor }, skip: 1 }),
  select: { id: true, customer: true, amount: true, dueDate: true },   // projection
});

await prisma.$transaction(async (tx) => {
  await tx.payment.create({ data: { invoiceId, amount } });
  await tx.invoice.update({ where: { id: invoiceId }, data: { status: "PAID" } });
});
```

<figure class="dia"><svg viewBox="0 0 720 246" role="img" aria-label="Measured query time per page on a million-row table: OFFSET pagination grows linearly to about 30 milliseconds at page 49,000, while keyset pagination on the same index stays at about 0.02 milliseconds on every page">
<line class="sLm" x1="70" y1="200" x2="500" y2="200"/><line class="sLm" x1="70" y1="200" x2="70" y2="24"/>
<text class="sS" x="62" y="204" text-anchor="end">0</text><line class="sLm" x1="70" y1="200" x2="500" y2="200" opacity=".15"/>
<text class="sS" x="62" y="155.429" text-anchor="end">10</text><line class="sLm" x1="70" y1="151.429" x2="500" y2="151.429" opacity=".15"/>
<text class="sS" x="62" y="106.857" text-anchor="end">20</text><line class="sLm" x1="70" y1="102.857" x2="500" y2="102.857" opacity=".15"/>
<text class="sS" x="62" y="58.2857" text-anchor="end">30</text><line class="sLm" x1="70" y1="54.2857" x2="500" y2="54.2857" opacity=".15"/>
<text class="sS" x="70.0084" y="216" text-anchor="middle">1</text>
<text class="sS" x="154" y="216" text-anchor="middle">10,000</text>
<text class="sS" x="280" y="216" text-anchor="middle">25,000</text>
<text class="sS" x="481.6" y="216" text-anchor="middle">49,000</text>
<text class="sS" x="285" y="236" text-anchor="middle">page number (20 rows per page)</text><text class="sS" x="22" y="112" text-anchor="middle" transform="rotate(-90 22 112)">ms per page</text>
<polyline class="sLr" points="70.0,199.9 78.4,197.3 154.0,172.3 280.0,126.8 481.6,57.3" style="fill:none;stroke-width:2.4"/>
<polyline class="sLg" points="70.0,199.9 78.4,199.9 154.0,199.9 280.0,199.9 481.6,199.9" style="fill:none;stroke-width:2.4"/>
<circle class="sPr" cx="70.0" cy="199.9" r="3.5"/><circle class="sPg" cx="70.0" cy="199.9" r="3.5"/>
<circle class="sPr" cx="78.4" cy="197.3" r="3.5"/><circle class="sPg" cx="78.4" cy="199.9" r="3.5"/>
<circle class="sPr" cx="154.0" cy="172.3" r="3.5"/><circle class="sPg" cx="154.0" cy="199.9" r="3.5"/>
<circle class="sPr" cx="280.0" cy="126.8" r="3.5"/><circle class="sPg" cx="280.0" cy="199.9" r="3.5"/>
<circle class="sPr" cx="481.6" cy="57.3" r="3.5"/><circle class="sPg" cx="481.6" cy="199.9" r="3.5"/>
<text class="sRt" x="475.6" y="49.2996" text-anchor="end">OFFSET: 29.4 ms</text><text class="sGt" x="475.6" y="191.912" text-anchor="end">keyset: 0.02 ms</text>
<rect class="sN" x="520" y="30" width="186" height="170" rx="8"/>
<text class="sT" x="613" y="52" text-anchor="middle">1,000,000 invoices, SQLite</text><text class="sS" x="613" y="70" text-anchor="middle">index on (company, status,</text><text class="sS" x="613" y="86" text-anchor="middle">due_date, id)</text>
<text class="sRt" x="613" y="114" text-anchor="middle">OFFSET walks and discards</text><text class="sRt" x="613" y="130" text-anchor="middle">every earlier row</text>
<text class="sGt" x="613" y="158" text-anchor="middle">keyset seeks straight to</text><text class="sGt" x="613" y="174" text-anchor="middle">(due_date, id) &gt; cursor</text>
</svg><figcaption>Offset versus keyset pagination, measured (best of five runs per page): the cursor in the Prisma example above keeps every page as cheap as the first.</figcaption></figure>

The same principles as EF Core apply: select only needed fields, avoid N+1 (use `include` or batch queries), use transactions for multi-step writes, and run migrations deliberately ([[B5]]).

> [!story]
> Your course platform uses **Prisma with PostgreSQL**, **scrypt** password hashing, sessions and rate limiting, with Stripe, Paymob and Fawry payments. That's a complete Node/TypeScript backend story: describe the data model, the payment-callback handling (idempotent, [[B4.4]]) and how sessions are stored.

## B13.6 Configuration, logging and testing 🟢

- **Configuration** from environment variables. Node 20.6+ can load a file with `node --env-file=.env`; validate it at start-up with a schema (zod) so a missing variable fails fast.
- **Logging:** **pino** (fast, structured JSON) or winston, with a request ID on every line; OpenTelemetry has Node auto-instrumentation ([[B11.5]]).
- **Testing:** **Vitest** or Jest (Node also ships a built-in `node:test` runner), and **supertest** to call the Express app in memory, the equivalent of `WebApplicationFactory` ([[B10.4]]):

```js
import request from "supertest";
it("rejects an invalid invoice with 400 and field errors", async () => {
  const res = await request(app).post("/api/invoices").set("Authorization", `Bearer ${testToken}`).send({ customer: "", amount: -1 });
  expect(res.status).toBe(400);
  expect(res.body.errors).toHaveProperty("customer");
});
```

## B13.7 Streams and backpressure 🟡 ⭐

> [!term] Stream
> Node's abstraction for processing data **piece by piece** (chunks) instead of loading it all into memory: reading a 2 GB file, a large HTTP upload or download, a database export. Streams compose with `pipeline`.

> [!term] Backpressure
> When a fast producer (reading a file) feeds a slow consumer (a network client), the consumer signals "slow down" and the producer pauses, so memory doesn't fill up. `stream.pipeline` handles it, plus errors and clean-up.

<figure class="dia steps" data-start="1"><svg viewBox="0 0 720 180" role="img" aria-label="Backpressure: a fast file reader fills the buffer for a slow client, write returns false, the reader pauses until the drain event, then resumes">
<rect class="sB" x="550" y="60" width="150" height="56" rx="8"/><text class="sT" x="625" y="86" text-anchor="middle">writable: client</text><text class="sC" x="625" y="102" text-anchor="middle">slow 3G connection</text>
<rect class="sN" x="262" y="60" width="200" height="56" rx="8"/><text class="sC" x="362" y="136" text-anchor="middle">internal buffer (highWaterMark 64 KB)</text>
<line class="sLm" x1="170" y1="88" x2="258" y2="88" marker-end="url(#ahm)"/><line class="sLm" x1="462" y1="88" x2="546" y2="88" marker-end="url(#ahm)"/>
<g data-s="1-1"><rect class="sG" x="20" y="60" width="150" height="56" rx="8"/><text class="sT" x="95" y="86" text-anchor="middle">readable: 2 GB file</text><text class="sC" x="95" y="102" text-anchor="middle">reading fast</text><rect class="sA" x="266" y="64" width="45" height="48" rx="4"/><text class="sC" x="362" y="40" text-anchor="middle">chunks flow; the buffer barely fills</text></g>
<g data-s="2-2"><rect class="sG" x="20" y="60" width="150" height="56" rx="8"/><text class="sT" x="95" y="86" text-anchor="middle">readable: 2 GB file</text><text class="sC" x="95" y="102" text-anchor="middle">reading fast</text><rect class="sA" x="266" y="64" width="45" height="48" rx="4"/><rect class="sA" x="315" y="64" width="45" height="48" rx="4"/><rect class="sA" x="364" y="64" width="45" height="48" rx="4"/><rect class="sA" x="413" y="64" width="45" height="48" rx="4"/><rect class="sN" x="262" y="60" width="200" height="56" rx="8" style="stroke:var(--senior);stroke-width:3"/><text class="sRt" x="362" y="40" text-anchor="middle">buffer full: write() returns false</text></g>
<g data-s="3-3"><rect class="sW" x="20" y="60" width="150" height="56" rx="8"/><text class="sT" x="95" y="86" text-anchor="middle">readable: 2 GB file</text><text class="sC" x="95" y="102" text-anchor="middle">paused</text><rect class="sA" x="266" y="64" width="45" height="48" rx="4"/><rect class="sA" x="315" y="64" width="45" height="48" rx="4"/><text class="sWt" x="362" y="40" text-anchor="middle">producer pauses; the client drains the buffer</text></g>
<g data-s="4-5"><rect class="sG" x="20" y="60" width="150" height="56" rx="8"/><text class="sT" x="95" y="86" text-anchor="middle">readable: 2 GB file</text><text class="sC" x="95" y="102" text-anchor="middle">reading again</text><rect class="sA" x="266" y="64" width="45" height="48" rx="4"/><text class="sGt" x="362" y="40" text-anchor="middle">"drain" event: resume reading</text></g>
<g data-s="5"><text class="sS" x="360" y="166" text-anchor="middle">memory stays bounded at roughly the buffer size, for a 2 GB file or a 200 GB one</text></g>
<g class="pk" data-s="1"><circle class="sP" r="5"><animateMotion dur="0.6s" begin="indefinite" fill="freeze" path="M170 88 H262"/></circle></g><g class="pk" data-s="1"><circle class="sP" r="5"><animateMotion dur="1.4s" begin="indefinite" fill="freeze" path="M462 88 H550"/></circle></g>
<g class="pk" data-s="2"><circle class="sPr" r="5"><animateMotion dur="0.3s" begin="indefinite" fill="freeze" path="M170 88 H262"/></circle></g><g class="pk" data-s="3"><circle class="sP" r="5"><animateMotion dur="1.4s" begin="indefinite" fill="freeze" path="M462 88 H550"/></circle></g><g class="pk" data-s="4"><circle class="sPg" r="5"><animateMotion dur="0.6s" begin="indefinite" fill="freeze" path="M170 88 H262"/></circle></g>
</svg><ol class="dia-steps">
<li>A file stream reads chunks and writes them to the HTTP response. The client is slow, but at first the buffer copes.</li>
<li>The disk is much faster than the client's network, so the buffer fills. <code>write()</code> now returns <code>false</code>: that's the "slow down" signal.</li>
<li>A well-behaved producer stops reading. The client keeps receiving, emptying the buffer.</li>
<li>When the buffer drains, the writable emits <code>"drain"</code> and reading resumes.</li>
<li>Ignore the signal and Node buffers the whole file in memory. <code>stream.pipeline</code> does the pause/resume for you, and also destroys every stream on error.</li>
</ol><figcaption>Backpressure is flow control between a fast producer and a slow consumer.</figcaption></figure>

```js
import { pipeline } from "node:stream/promises";
import { createReadStream } from "node:fs";
import { createGzip } from "node:zlib";

app.get("/api/exports/:id", async (req, res, next) => {
  res.set({ "Content-Type": "text/csv", "Content-Encoding": "gzip" });
  try { await pipeline(createReadStream(exportPath(req.params.id)), createGzip(), res); }  // constant memory
  catch (err) { next(err); }
});
```

## B13.8 Running Node in production 🟡

- **Use all cores:** run several processes (the `cluster` module, PM2's cluster mode, or more container replicas behind a load balancer).
- **Graceful shutdown:** on `SIGTERM` (what Docker and Kubernetes send), stop accepting new connections, finish in-flight requests, close database pools, then exit.

```js
const server = app.listen(port);
process.on("SIGTERM", () => {
  server.close(async () => { await prisma.$disconnect(); process.exit(0); });
  setTimeout(() => process.exit(1), 10_000).unref();       // force-exit if it hangs
});
```

- **Crash handling:** log `unhandledRejection` and `uncaughtException`, then **exit** and let the orchestrator restart you; the process state is unknown after an uncaught exception.
- **Security:** `helmet`, body size limits, rate limiting (`express-rate-limit`), validated input, parameterised queries, `npm ci` with a lock file, a non-root container user, and no secrets in the image ([[S5.8]]).
- **Alternatives:** **Fastify** (faster, schema-based validation), and the **Bun** and **Deno** runtimes, worth knowing exist; Node remains the default for jobs.

<figure class="dia"><svg viewBox="0 0 720 226" role="img" aria-label="Using four cores: Node runs four processes each with one JavaScript thread behind a load balancer; .NET runs one process whose thread pool spans all cores">
<rect class="sN" x="14" y="24" width="336" height="190" rx="12"/><text class="sT" x="182" y="44" text-anchor="middle">Node: one process per core</text>
<rect class="sB" x="102" y="54" width="160" height="34" rx="8"/><text class="sT" x="182" y="76" text-anchor="middle">load balancer / cluster</text>
<line class="sLm" x1="182" y1="88" x2="61" y2="108"/><rect class="sA" x="26" y="110" width="70" height="64" rx="6"/><text class="sC" x="61" y="132" text-anchor="middle">process</text><text class="sC" x="61" y="150" text-anchor="middle">JS thread</text><text class="sM" x="61" y="166" text-anchor="middle">core 1</text>
<line class="sLm" x1="182" y1="88" x2="141" y2="108"/><rect class="sA" x="106" y="110" width="70" height="64" rx="6"/><text class="sC" x="141" y="132" text-anchor="middle">process</text><text class="sC" x="141" y="150" text-anchor="middle">JS thread</text><text class="sM" x="141" y="166" text-anchor="middle">core 2</text>
<line class="sLm" x1="182" y1="88" x2="221" y2="108"/><rect class="sA" x="186" y="110" width="70" height="64" rx="6"/><text class="sC" x="221" y="132" text-anchor="middle">process</text><text class="sC" x="221" y="150" text-anchor="middle">JS thread</text><text class="sM" x="221" y="166" text-anchor="middle">core 3</text>
<line class="sLm" x1="182" y1="88" x2="301" y2="108"/><rect class="sA" x="266" y="110" width="70" height="64" rx="6"/><text class="sC" x="301" y="132" text-anchor="middle">process</text><text class="sC" x="301" y="150" text-anchor="middle">JS thread</text><text class="sM" x="301" y="166" text-anchor="middle">core 4</text>
<text class="sC" x="182" y="200" text-anchor="middle">memory per process; no shared state</text>
<rect class="sN" x="370" y="24" width="336" height="190" rx="12"/><text class="sT" x="538" y="44" text-anchor="middle">.NET: one process, many threads</text>
<rect class="sV" x="390" y="58" width="296" height="116" rx="8"/><text class="sT" x="538" y="78" text-anchor="middle">ASP.NET Core process</text>
<rect class="sB" x="404" y="92" width="38" height="34" rx="4"/><text class="sC" x="423" y="114" text-anchor="middle">T1</text>
<rect class="sB" x="450" y="92" width="38" height="34" rx="4"/><text class="sC" x="469" y="114" text-anchor="middle">T2</text>
<rect class="sB" x="496" y="92" width="38" height="34" rx="4"/><text class="sC" x="515" y="114" text-anchor="middle">T3</text>
<rect class="sB" x="542" y="92" width="38" height="34" rx="4"/><text class="sC" x="561" y="114" text-anchor="middle">T4</text>
<rect class="sB" x="588" y="92" width="38" height="34" rx="4"/><text class="sC" x="607" y="114" text-anchor="middle">T5</text>
<rect class="sB" x="634" y="92" width="38" height="34" rx="4"/><text class="sC" x="653" y="114" text-anchor="middle">T6</text>
<text class="sC" x="538" y="150" text-anchor="middle">thread pool spans all cores</text><text class="sC" x="538" y="166" text-anchor="middle">shared in-memory cache works</text>
<text class="sC" x="538" y="200" text-anchor="middle">one process; locks needed for shared data</text>
</svg><figcaption>How each runtime uses a multi-core machine. In containers, Node usually gets more replicas with one core each.</figcaption></figure>

<figure class="dia steps"><svg viewBox="0 0 720 220" role="img" aria-label="Graceful shutdown timeline: on SIGTERM the server stops accepting connections, in-flight requests finish, the database pool closes and the process exits, with a ten-second force-exit timer as a safety net">
<text class="sC" x="172" y="50" text-anchor="end">new connections</text>
<text class="sC" x="172" y="82" text-anchor="end">request 1</text>
<text class="sC" x="172" y="110" text-anchor="end">request 2</text>
<text class="sC" x="172" y="140" text-anchor="end">DB pool</text>
<text class="sC" x="172" y="170" text-anchor="end">safety timer</text>
<line class="sLm" x1="180" y1="190" x2="685" y2="190" marker-end="url(#ahm)"/>
<line class="sLm" x1="225" y1="186" x2="225" y2="194"/><text class="sC" x="225" y="208" text-anchor="middle">0 s</text>
<line class="sLm" x1="315" y1="186" x2="315" y2="194"/><text class="sC" x="315" y="208" text-anchor="middle">2 s</text>
<line class="sLm" x1="405" y1="186" x2="405" y2="194"/><text class="sC" x="405" y="208" text-anchor="middle">4 s</text>
<line class="sLm" x1="495" y1="186" x2="495" y2="194"/><text class="sC" x="495" y="208" text-anchor="middle">6 s</text>
<line class="sLm" x1="585" y1="186" x2="585" y2="194"/><text class="sC" x="585" y="208" text-anchor="middle">8 s</text>
<line class="sLm" x1="675" y1="186" x2="675" y2="194"/><text class="sC" x="675" y="208" text-anchor="middle">10 s</text>
<rect class="sB" x="180" y="38" width="45" height="16" rx="3"/>
<g data-s="1"><line class="sLr" x1="225" y1="24" x2="225" y2="186" stroke-dasharray="6 4"/><text class="sRt" x="225" y="18" text-anchor="middle">SIGTERM</text><rect class="sA" x="180" y="70" width="99" height="16" rx="3"/><rect class="sA" x="198" y="98" width="153" height="16" rx="3"/><rect class="sG" x="180" y="128" width="189" height="16" rx="3"/></g>
<g data-s="2"><text class="sRt" x="235" y="50">server.close(): no new connections; the LB sends them elsewhere</text></g>
<g data-s="3"><text class="sGt" x="285" y="82">done ✓</text><text class="sGt" x="357" y="110">done ✓</text></g>
<g data-s="4"><text class="sGt" x="375" y="140">prisma.$disconnect() → process.exit(0)</text><line class="sLg" x1="369.0" y1="30" x2="369.0" y2="186"/></g>
<g data-s="5"><rect class="sW" x="225" y="158" width="450" height="16" rx="3" opacity=".7"/><text class="sWt" x="669" y="154" text-anchor="end">if still running at 10 s: exit(1)</text></g>
</svg><ol class="dia-steps">
<li>Kubernetes or Docker sends <b>SIGTERM</b> (during a deploy or scale-down). Two requests are in flight and the database pool is open.</li>
<li><code>server.close()</code> stops accepting new connections. The orchestrator has also removed the pod from the load balancer, so new traffic goes to other instances.</li>
<li>In-flight requests are allowed to finish normally. No user sees an error.</li>
<li>Once the last one completes, the close callback disconnects the database pool and exits with code 0.</li>
<li>A safety timer (<code>unref()</code>'d so it doesn't keep the process alive) forces an exit if something hangs. Kubernetes would send SIGKILL after 30 seconds anyway.</li>
</ol><figcaption>A deploy should be invisible to users. Graceful shutdown is what makes rolling updates zero-downtime.</figcaption></figure>

## B13.9 Node or .NET? 🟡 ⭐

| Choose Node when… | Choose .NET when… |
|---|---|
| The team is JavaScript/TypeScript end to end and wants to share types and validation with the front end | You need strong performance on CPU-heavy work in the same process, or Native AOT |
| The service is I/O-bound: an API gateway, BFF, real-time sockets, glue code | The domain is complex and benefits from C#'s type system and mature tooling (EF Core, Identity) |
| You need a framework like Next.js for full-stack React | You're in a Microsoft/Azure enterprise environment, as many Egyptian banks and government projects are |
| Rapid prototyping with npm's huge ecosystem | Long-term maintainability in a large codebase with strict conventions |

> [!say]
> "I'd pick based on the team and the workload. Node shines for I/O-heavy services and when the whole team writes TypeScript, especially with Next.js or NestJS. .NET shines for CPU-heavy or complex domain logic and in Microsoft-centred enterprises. I'm productive in both, so I'd rather match the company's existing stack than switch it."

> [!lab] Port one endpoint, then compare
> Take FinSight's "create invoice" and "list overdue invoices" endpoints and rebuild them in **Express 5 + zod + Prisma** (or NestJS), with JWT auth, the same ProblemDetails-style errors, keyset pagination and three supertest tests. Then write half a page comparing the two implementations: lines of code, validation, error handling, typing, testing. That comparison answers "Node or .NET?" with evidence.

## B13.10 Interview drill 🟢 ⭐

| Question | Strong short answer |
|---|---|
| How does single-threaded Node handle concurrency? | Non-blocking I/O: the OS or libuv does the waiting and the event loop runs callbacks, so the one JS thread is only busy while computing. |
| What blocks the event loop? | Synchronous I/O, CPU-heavy work, huge JSON operations, catastrophic regexes. |
| How do you run CPU-heavy work in Node? | worker_threads, a separate service, or a background job queue. |
| What is Express middleware? | A function (req, res, next) in an ordered chain; it can respond, modify the request, or call next. |
| How do you handle errors in Express? | An error middleware with four parameters, registered last; Express 5 forwards rejected promises from async handlers automatically. |
| `^` vs `~` in package.json? | `^` allows new minor and patch versions; `~` only patch versions. |
| npm install vs npm ci? | ci installs exactly from the lock file and fails if it's out of sync, so it's reproducible for CI and Docker. |
| Express vs NestJS? | Express is minimal routing and middleware; NestJS adds modules, DI, guards, pipes and interceptors for larger codebases. |
| What is backpressure? | A slow consumer signalling a fast producer to pause, so memory doesn't overflow; handled by stream.pipeline. |
| How do you use all CPU cores? | Multiple processes: cluster, PM2, or more container replicas. |
| How do you shut down gracefully? | On SIGTERM, stop accepting connections, finish in-flight requests, close pools, then exit. |
| Node or .NET? | Node for I/O-bound services and full-stack TypeScript teams; .NET for CPU-heavy or complex domains and Microsoft-centred enterprises. |

## Key takeaways

> [!check]
> - One JS thread: waiting is free, computing blocks everyone.
> - Express is middleware plus routing; error middleware has four parameters and goes last.
> - NestJS maps directly onto ASP.NET Core and Angular concepts.
> - Stream big data; respect backpressure; shut down gracefully on SIGTERM.
> - Lock files, `npm ci`, audits and few dependencies, because npm's supply chain is an attack surface.

## Sources

- Node.js docs: [The Node.js event loop](https://nodejs.org/en/learn/asynchronous-work/event-loop-timers-and-nexttick), [Don't block the event loop](https://nodejs.org/en/learn/asynchronous-work/dont-block-the-event-loop), [Streams](https://nodejs.org/api/stream.html), [Backpressuring in streams](https://nodejs.org/en/learn/modules/backpressuring-in-streams), [Worker threads](https://nodejs.org/api/worker_threads.html), [Release schedule](https://nodejs.org/en/about/previous-releases).
- [Express 5 migration guide](https://expressjs.com/en/guide/migrating-5.html), [Express error handling](https://expressjs.com/en/guide/error-handling.html), [Express security best practices](https://expressjs.com/en/advanced/best-practice-security.html).
- [NestJS documentation](https://docs.nestjs.com/) · [Prisma documentation](https://www.prisma.io/docs) · [Drizzle ORM](https://orm.drizzle.team/) · [pino](https://getpino.io/) · [supertest](https://github.com/ladjs/supertest).
- [npm docs: semver](https://docs.npmjs.com/about-semantic-versioning), [npm ci](https://docs.npmjs.com/cli/commands/npm-ci).
