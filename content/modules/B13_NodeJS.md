# Node.js for .NET Developers — Event Loop, Express, NestJS and Prisma

A large share of Egyptian backend and full-stack postings ask for Node.js: MERN and MEAN stacks at startups, NestJS at product companies, Express in agencies. You already have Node experience: the Express backends (with 34 tests) in your freelance template library, the Express chatbot in the investment platform, and Prisma with Next.js in the course platform. This module maps Node onto what you know from ASP.NET Core, and covers what's genuinely different: one thread, non-blocking I/O, and the npm ecosystem.

> [!focus]
> **Entry must:** how Node handles concurrency with one thread; npm and package.json; an Express API with middleware, routing, validation and error handling; async/await and promise errors; environment configuration.
> **Mid adds:** what blocks the event loop and how to avoid it (worker threads, streams), NestJS architecture, Prisma or another ORM, testing with supertest, production concerns (graceful shutdown, clustering, logging), Node vs .NET trade-offs.
> **Most asked:** *How is Node single-threaded but handles many requests?* · *What blocks the event loop?* · *Express middleware?* · *How do you handle errors in Express?* · *NestJS vs Express?* · *Node or .NET for this project?*
> **Time budget:** 3 hours.

## B13.1 The runtime model 🟢 ⭐

Node runs your JavaScript on **one main thread** with an **event loop**, like the browser ([[F4.1]]). I/O (network, files, timers, DNS) is handed to the operating system or to **libuv**, Node's C library, which uses OS async APIs and a small **thread pool** (4 threads by default) for things like file I/O, DNS lookups and crypto. When the I/O completes, a callback is queued and the event loop runs it.

So one Node process handles thousands of concurrent connections **as long as each piece of JavaScript finishes quickly**. Waiting costs nothing; computing blocks everyone.

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
