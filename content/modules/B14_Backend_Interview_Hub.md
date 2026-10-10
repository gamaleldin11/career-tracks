# Backend Interview Hub — The .NET Question Bank, Live Tasks, Take-Homes and a Two-Week Plan

This is the module to live in during the final week before a backend (.NET) interview. It pulls the backend track together: how the rounds usually run, the kinds of live tasks you'll get, how take-homes are judged, the portfolio gaps worth closing first, and a 70-question bank to drill aloud.

> [!focus]
> **Entry must:** answer the fundamentals bank confidently; explain FinSight's architecture and your part in it; build or fix a small endpoint live; solve an easy-to-medium coding problem.
> **Mid adds:** design a feature end to end (API, data, caching, async work, failure handling), discuss trade-offs, review code critically.
> **Time budget:** the final week: the bank daily, one live task daily, one design every other day.

## B14.1 How .NET backend interviews usually run 🟢 ⭐

| Round | What happens | Prepared by |
|---|---|---|
| HR screen | Background, English, notice period, salary, military status | [[S8]] |
| Technical fundamentals | Rapid C#, OOP, SOLID, ASP.NET Core, EF Core and SQL questions | [[B1]]–[[B7]], the bank below |
| Live coding | A DSA problem, **or** a practical task: build an endpoint, write a LINQ or SQL query, find the bug | [[S4]], [[B14.2]] |
| Take-home (common in startups) | A small API with CRUD, validation, auth and tests, over a few days | [[B14.3]] |
| System or feature design (mid level) | Design a feature or service; scale your own project | [[B12]] |
| Manager or team round | Project deep-dive, collaboration, ownership | [[S8]] |

Enterprise and outsourcing companies (banks, software houses for Gulf clients) lean heavily on the fundamentals round and SQL; product companies add DSA and design.

<figure class="dia"><svg viewBox="0 0 720 238" role="img" aria-label="Two typical interview processes: enterprise and outsourcing companies focus on fundamentals and SQL; product companies add live coding, a take-home or design round">
<text class="sM" x="14" y="38">enterprise / outsourcing</text>
<rect class="sB" x="14" y="50" width="160" height="50" rx="8"/><text class="sT" x="94" y="73" text-anchor="middle">HR screen</text><text class="sC" x="94" y="89" text-anchor="middle">English · notice</text>
<line class="sLm" x1="174" y1="75" x2="188" y2="75" marker-end="url(#ahm)"/>
<rect class="sA" x="190" y="50" width="160" height="50" rx="8"/><text class="sT" x="270" y="73" text-anchor="middle">fundamentals</text><text class="sC" x="270" y="89" text-anchor="middle">C# · EF · SQL, rapid</text>
<line class="sLm" x1="350" y1="75" x2="364" y2="75" marker-end="url(#ahm)"/>
<rect class="sA" x="366" y="50" width="160" height="50" rx="8"/><text class="sT" x="446" y="73" text-anchor="middle">SQL / live fix</text><text class="sC" x="446" y="89" text-anchor="middle">on paper or IDE</text>
<line class="sLm" x1="526" y1="75" x2="540" y2="75" marker-end="url(#ahm)"/>
<rect class="sG" x="542" y="50" width="160" height="50" rx="8"/><text class="sT" x="622" y="73" text-anchor="middle">manager</text><text class="sC" x="622" y="89" text-anchor="middle">project deep-dive</text>
<text class="sM" x="14" y="138">product company</text>
<rect class="sB" x="14" y="150" width="160" height="50" rx="8"/><text class="sT" x="94" y="173" text-anchor="middle">HR screen</text><text class="sC" x="94" y="189" text-anchor="middle">English · notice</text>
<line class="sLm" x1="174" y1="175" x2="188" y2="175" marker-end="url(#ahm)"/>
<rect class="sW" x="190" y="150" width="160" height="50" rx="8"/><text class="sT" x="270" y="173" text-anchor="middle">live coding</text><text class="sC" x="270" y="189" text-anchor="middle">DSA or endpoint</text>
<line class="sLm" x1="350" y1="175" x2="364" y2="175" marker-end="url(#ahm)"/>
<rect class="sV" x="366" y="150" width="160" height="50" rx="8"/><text class="sT" x="446" y="173" text-anchor="middle">take-home</text><text class="sC" x="446" y="189" text-anchor="middle">or a design round</text>
<line class="sLm" x1="526" y1="175" x2="540" y2="175" marker-end="url(#ahm)"/>
<rect class="sG" x="542" y="150" width="160" height="50" rx="8"/><text class="sT" x="622" y="173" text-anchor="middle">team round</text><text class="sC" x="622" y="189" text-anchor="middle">ownership · trade-offs</text>
<text class="sS" x="360" y="226" text-anchor="middle">same job title, different emphasis: read the posting and ask HR which rounds to expect</text>
</svg><figcaption>The two shapes a .NET backend process usually takes in Egypt and the Gulf.</figcaption></figure>

## B14.2 Live practical tasks you should be able to do 🟢 ⭐

Practise each until you can do it in 30–45 minutes while talking:

<figure class="dia"><svg viewBox="0 0 720 110" role="img" aria-label="A 45-minute live task: 5 minutes clarifying, 5 sketching, 25 building while talking, 5 testing, 5 discussing trade-offs">
<rect class="sB" x="14" y="30" width="74.8889" height="44" rx="6"/><text class="sT" x="52.4444" y="50" text-anchor="middle">clarify</text><text class="sC" x="52.4444" y="66" text-anchor="middle">5 min</text>
<rect class="sV" x="90.8889" y="30" width="74.8889" height="44" rx="6"/><text class="sT" x="129.333" y="50" text-anchor="middle">sketch</text><text class="sC" x="129.333" y="66" text-anchor="middle">5 min</text>
<rect class="sA" x="167.778" y="30" width="382.444" height="44" rx="6"/><text class="sT" x="360" y="50" text-anchor="middle">build, talking</text><text class="sC" x="360" y="66" text-anchor="middle">25 min</text>
<rect class="sG" x="552.222" y="30" width="74.8889" height="44" rx="6"/><text class="sT" x="590.667" y="50" text-anchor="middle">test it</text><text class="sC" x="590.667" y="66" text-anchor="middle">5 min</text>
<rect class="sW" x="629.111" y="30" width="74.8889" height="44" rx="6"/><text class="sT" x="667.556" y="50" text-anchor="middle">trade-offs</text><text class="sC" x="667.556" y="66" text-anchor="middle">5 min</text>
<text class="sC" x="14" y="98">ask about inputs, errors, auth</text><text class="sC" x="706" y="98" text-anchor="end">what you'd add with more time</text>
</svg><figcaption>Budget the time out loud. Interviewers grade the process as much as the code.</figcaption></figure>

1. **Build an endpoint:** `POST /api/orders` with a validated DTO, a service, EF Core persistence, `201 Created` with `Location`, and ProblemDetails errors.
2. **Write a LINQ query** that groups orders by customer, returns the top five by total, and translates to one SQL query (and explain how you'd check that it does).
3. **Fix the bugs** in a snippet. Typical planted bugs:
   - `async void` method, or `.Result` blocking;
   - a scoped `DbContext` injected into a singleton;
   - `ToList()` before `Where`, loading the whole table;
   - an N+1 loop of queries;
   - `new HttpClient()` per call;
   - `catch (Exception) { }` swallowing errors, or `throw ex;`;
   - SQL built by string concatenation;
   - `DateTime.Now` in testable logic;
   - a missing `CancellationToken`;
   - a missing tenant filter in a raw query.
4. **Add a feature to existing code:** pagination with filtering and sorting on a list endpoint; or soft delete with a global query filter.
5. **Write unit tests** for a given service, choosing what to fake.
6. **Refactor** a long method with a switch into a Strategy ([[B2.4]]).
7. **SQL on paper:** second-highest salary, duplicates, top N per group, running totals ([[S3.11]]).

**Example: "spot the problems" (do it before reading the answers):**

```csharp
public class ReportService
{
    private readonly AppDbContext _db;                       // registered as Singleton
    public ReportService(AppDbContext db) => _db = db;

    public async void SendMonthly(int companyId)
    {
        var invoices = _db.Invoices.ToList().Where(i => i.CompanyId == companyId);
        foreach (var inv in invoices)
        {
            var payments = _db.Payments.Where(p => p.InvoiceId == inv.Id).ToList();
            var client = new HttpClient();
            client.PostAsync("https://mail.example/send", null).Wait();
        }
    }
}
```

> [!note] Answers
> (1) A singleton holding a scoped `DbContext`: a captive dependency, shared across threads. (2) `async void`: callers can't await it and exceptions crash the process. (3) `ToList()` before `Where`: loads every invoice for every company. (4) A payments query per invoice: N+1. (5) `new HttpClient()` in a loop: socket exhaustion; use `IHttpClientFactory`. (6) `.Wait()`: blocking; and a request body of `null`. (7) No `CancellationToken`, no error handling, no logging; one failed email aborts the rest. (8) Sending email inline: should be a queued job ([[B8.8]]). Naming all eight, then rewriting it properly, is a strong mid-level answer.

<figure class="dia steps"><svg viewBox="0 0 720 338" role="img" aria-label="The ReportService snippet with its eight problems highlighted one at a time">
<rect class="sN" x="8" y="14" width="704" height="316" rx="8"/>
<g data-s="1-1"><rect class="sR" x="14" y="54" width="646" height="19" rx="3" opacity=".55"/><rect class="sR" x="14" y="73" width="646" height="19" rx="3" opacity=".55"/></g>
<g data-s="2-2"><rect class="sR" x="14" y="111" width="646" height="19" rx="3" opacity=".55"/></g>
<g data-s="3-3"><rect class="sR" x="14" y="149" width="646" height="19" rx="3" opacity=".55"/></g>
<g data-s="4-4"><rect class="sR" x="14" y="168" width="646" height="19" rx="3" opacity=".55"/><rect class="sR" x="14" y="206" width="646" height="19" rx="3" opacity=".55"/></g>
<g data-s="5-5"><rect class="sR" x="14" y="225" width="646" height="19" rx="3" opacity=".55"/></g>
<g data-s="6-6"><rect class="sR" x="14" y="244" width="646" height="19" rx="3" opacity=".55"/></g>
<g data-s="7-7"><rect class="sW" x="14" y="111" width="646" height="19" rx="3" opacity=".55"/><rect class="sW" x="14" y="168" width="646" height="19" rx="3" opacity=".55"/><rect class="sW" x="14" y="187" width="646" height="19" rx="3" opacity=".55"/><rect class="sW" x="14" y="206" width="646" height="19" rx="3" opacity=".55"/><rect class="sW" x="14" y="225" width="646" height="19" rx="3" opacity=".55"/><rect class="sW" x="14" y="244" width="646" height="19" rx="3" opacity=".55"/><rect class="sW" x="14" y="263" width="646" height="19" rx="3" opacity=".55"/></g>
<g data-s="8-8"><rect class="sV" x="14" y="244" width="646" height="19" rx="3" opacity=".55"/></g>
<text class="sC" x="22" y="30" xml:space="preserve" style="white-space:pre">public class ReportService</text>
<text class="sC" x="22" y="49" xml:space="preserve" style="white-space:pre">{</text>
<text class="sC" x="22" y="68" xml:space="preserve" style="white-space:pre">    private readonly AppDbContext _db;            // registered as Singleton</text>
<text class="sC" x="22" y="87" xml:space="preserve" style="white-space:pre">    public ReportService(AppDbContext db) =&gt; _db = db;</text>
<text class="sC" x="22" y="125" xml:space="preserve" style="white-space:pre">    public async void SendMonthly(int companyId)</text>
<text class="sC" x="22" y="144" xml:space="preserve" style="white-space:pre">    {</text>
<text class="sC" x="22" y="163" xml:space="preserve" style="white-space:pre">        var invoices = _db.Invoices.ToList().Where(i =&gt; i.CompanyId == companyId);</text>
<text class="sC" x="22" y="182" xml:space="preserve" style="white-space:pre">        foreach (var inv in invoices)</text>
<text class="sC" x="22" y="201" xml:space="preserve" style="white-space:pre">        {</text>
<text class="sC" x="22" y="220" xml:space="preserve" style="white-space:pre">            var payments = _db.Payments.Where(p =&gt; p.InvoiceId == inv.Id).ToList();</text>
<text class="sC" x="22" y="239" xml:space="preserve" style="white-space:pre">            var client = new HttpClient();</text>
<text class="sC" x="22" y="258" xml:space="preserve" style="white-space:pre">            client.PostAsync("https://mail.example/send", null).Wait();</text>
<text class="sC" x="22" y="277" xml:space="preserve" style="white-space:pre">        }</text>
<text class="sC" x="22" y="296" xml:space="preserve" style="white-space:pre">    }</text>
<text class="sC" x="22" y="315" xml:space="preserve" style="white-space:pre">}</text>
<g data-s="1"><circle class="sPr" cx="680" cy="63" r="9"/><text class="sX" x="680" y="67" text-anchor="middle">1</text></g>
<g data-s="2"><circle class="sPr" cx="680" cy="120" r="9"/><text class="sX" x="680" y="124" text-anchor="middle">2</text></g>
<g data-s="3"><circle class="sPr" cx="680" cy="158" r="9"/><text class="sX" x="680" y="162" text-anchor="middle">3</text></g>
<g data-s="4"><circle class="sPr" cx="680" cy="177" r="9"/><text class="sX" x="680" y="181" text-anchor="middle">4</text></g>
<g data-s="5"><circle class="sPr" cx="680" cy="234" r="9"/><text class="sX" x="680" y="238" text-anchor="middle">5</text></g>
<g data-s="6"><circle class="sPr" cx="680" cy="253" r="9"/><text class="sX" x="680" y="257" text-anchor="middle">6</text></g>
<g data-s="7"><circle class="sPw" cx="702" cy="120" r="9"/><text class="sX" x="702" y="124" text-anchor="middle">7</text></g>
<g data-s="8"><circle class="sPv" cx="702" cy="253" r="9"/><text class="sX" x="702" y="257" text-anchor="middle">8</text></g>
</svg><ol class="dia-steps">
<li><b>Captive dependency.</b> A scoped <code>DbContext</code> injected into a singleton lives forever and is shared across threads. <code>DbContext</code> isn't thread-safe.</li>
<li><b><code>async void</code>.</b> Nobody can await it, and an exception thrown inside crashes the process instead of reaching a handler.</li>
<li><b><code>ToList()</code> before <code>Where</code>.</b> Every invoice of every company is loaded into memory, then filtered in C#.</li>
<li><b>N+1.</b> One payments query per invoice. Load them together (<code>Include</code> or one grouped query).</li>
<li><b><code>new HttpClient()</code> per iteration.</b> Each one holds a socket open after disposal; enough of them exhaust ports. Use <code>IHttpClientFactory</code>.</li>
<li><b><code>.Wait()</code>.</b> Sync-over-async blocks a thread-pool thread. And the request body is <code>null</code>.</li>
<li><b>No <code>CancellationToken</code>, no error handling, no logging.</b> One failed email silently aborts the rest of the loop.</li>
<li><b>Wrong place.</b> Sending email inline belongs in a queued background job with retries (B8.8).</li>
</ol><figcaption>Name the problem, say why it hurts in production, then the fix. That pattern scores on every bug-hunt question.</figcaption></figure>

## B14.3 Take-home tasks 🟢 ⭐

A typical brief: "Build a REST API for a small library, clinic or expense tracker: CRUD with validation, authentication, pagination, and tests. Docker is a plus."

**What reviewers score (aim for all of it):**

| Area | Great looks like |
|---|---|
| Runs first time | `docker compose up` brings up the API and database; the README lists the steps |
| Structure | Clear layers or vertical slices; thin endpoints; no logic in controllers ([[B9]]) |
| API design | Correct methods and status codes, ProblemDetails, pagination, OpenAPI ([[B4]]) |
| Data | EF Core with configured precision, indexes and migrations; no N+1; projections for reads ([[B5]]) |
| Security | Auth with policies, deny-by-default, tenant or ownership checks, validated input ([[B7]]) |
| Tests | Unit tests for rules plus integration tests with WebApplicationFactory (Testcontainers is a bonus) ([[B10]]) |
| Production touches | Health checks, structured logging, global exception handler, configuration via environment ([[B11]]) |
| README | Decisions and trade-offs, what's missing and what you'd do next |
| Git | Small, meaningful commits |

Time-box honestly, and say in the README what you'd add with more time. That reads as judgement, not as a gap.

## B14.4 Your backend portfolio: what to fix first 🟢

From your evidence map and gaps file, in order of interview value per hour:

| Action | Time | Closes |
|---|---|---|
| Tenant-isolation and role tests with WebApplicationFactory + Testcontainers ([[B10]] lab) | 1 day | "unit testing at scale", security testing |
| Serilog/OpenTelemetry + Aspire dashboard + resilience handler ([[B11]] lab) | 2–3 hours | observability, resilience |
| Redis HybridCache for the dashboard + RabbitMQ/Service Bus via an outbox ([[B8]] lab) | 1 weekend | Redis, caching, message queues |
| Deploy a demo with seeded data and put the link on the CV | 1 day | "no live links" |
| Publish the ADO.NET vs Dapper vs EF Core benchmark as a short article | 1 evening | visibility, "measures rather than assumes" |
| Optional certification: **AI-200** (Azure AI Cloud Developer Associate), which replaced AZ-204 in July 2026 | weeks | Azure keyword; check the current exam outline first |

## B14.5 The question bank 🟢 ⭐

Answer aloud before revealing. Mark misses and reread the linked module.

| Question | Strong short answer |
|---|---|
| Value vs reference types? | Value types copy their data; reference types copy a reference to a shared heap object. |
| class vs struct vs record? | Reference with identity / small value type / reference type with value equality and immutability. |
| Interface vs abstract class? | A contract (many, no state) vs a single base with shared state and behaviour. |
| What is boxing? | Wrapping a value type in a heap object when treated as object or an interface. |
| IEnumerable vs IQueryable? | In-memory LINQ vs an expression tree translated by a provider, such as EF Core to SQL. |
| Deferred execution? | LINQ runs when enumerated; enumerating twice runs it twice. |
| How does async/await work? | A compiler-built state machine that returns at incomplete awaits and resumes as a continuation, freeing the thread. |
| Why never `.Result`? | It blocks a thread and can deadlock; stay async all the way. |
| async void? | Only for event handlers; exceptions can't be caught and it can't be awaited. |
| Task vs Thread? | A Task represents work that may not need a thread while waiting; a thread is an OS execution unit. |
| How does the GC work? | Generational (0, 1, 2), with a large object heap for objects of 85 KB or more. |
| IDisposable? | Deterministic release of unmanaged resources via using. |
| throw vs throw ex? | `throw;` keeps the stack trace; `throw ex;` resets it. |
| DI lifetimes? | Singleton per app, scoped per request, transient per injection. |
| Captive dependency? | A longer-lived service holding a shorter-lived one, e.g. a singleton holding a DbContext. |
| What's new in C# 14? | Extension members, the field keyword, null-conditional assignment, implicit span conversions. |
| Current .NET LTS? | .NET 10 (November 2025, supported to November 2028). |
| Four pillars of OOP? | Encapsulation, abstraction, inheritance, polymorphism. |
| SOLID? | Single responsibility, open/closed, Liskov substitution, interface segregation, dependency inversion. |
| Composition vs inheritance? | Prefer composing small interface-based parts; inherit only for true is-a relationships. |
| Patterns you've used? | Strategy, Decorator, Adapter, Factory, Chain of Responsibility (middleware), Composite. |
| Is the repository pattern needed with EF Core? | Often not; DbContext is already a unit of work and DbSet a repository. |
| Middleware pipeline? | Ordered components that can act, short-circuit, or call next, then see the response on the way back. |
| Middleware order essentials? | Exception handler first, CORS before auth, authentication before authorisation. |
| Middleware vs filters? | Global cross-cutting concerns vs wrapping specific actions with access to their arguments and results. |
| Controllers vs minimal APIs? | Conventions and filters vs lean, AOT-friendly endpoints with route groups; both first-class. |
| What does [ApiController] do? | Attribute routing, automatic 400 ValidationProblemDetails, binding inference. |
| Global error handling? | IExceptionHandler + UseExceptionHandler returning ProblemDetails with a trace ID. |
| Why IHttpClientFactory? | Pooled handlers: no socket exhaustion, DNS refresh, central resilience. |
| Options pattern? | Typed configuration bound from sections, validated at start-up. |
| PUT vs PATCH? | Full replacement (idempotent) vs partial update. |
| 401 vs 403? | Not authenticated vs not allowed. |
| Offset vs keyset pagination? | Page numbers but slow and shifting vs constant-cost and stable. |
| Idempotency key? | A client-supplied key so retried POSTs return the first result instead of acting twice. |
| Optimistic concurrency? | A version or rowversion checked on update; a conflict returns 409 or 412. |
| API versioning? | Additive changes first; URL versions for breaking changes, with Deprecation and Sunset headers. |
| REST vs gRPC vs GraphQL? | General and public / fast internal and streaming / flexible client-driven queries. |
| AsNoTracking? | Skip change tracking for read-only queries. |
| N+1 problem? | One query plus one per item; fix with Include, projection or batching. |
| Cartesian explosion? | Multiple collection includes multiplying rows; fix with AsSplitQuery or projection. |
| ExecuteUpdate? | A set-based UPDATE without loading entities. |
| Global query filters? | Automatic WHERE conditions for tenancy and soft delete; named filters in EF 10. |
| EF Core vs Dapper? | Productivity, tracking and migrations vs hand-written SQL with minimal overhead. |
| Normalisation? | Each fact stored once, usually to 3NF, to avoid anomalies. |
| Clustered vs non-clustered index? | The table in key order (one) vs separate sorted structures (many). |
| Covering index? | Contains every column a query needs, so no lookups. |
| Sargable? | A predicate that can use an index seek; don't wrap the column in functions. |
| Isolation levels? | Read uncommitted, read committed, repeatable read, snapshot, serializable. |
| Deadlock? | Two transactions waiting on each other's locks; consistent order, short transactions, retries. |
| SQL vs NoSQL? | Integrity and flexible queries vs specific access patterns at scale. |
| AuthN vs AuthZ? | Who you are vs what you may do. |
| How does a JWT work? | Signed, readable claims validated by signature, issuer, audience and expiry. |
| Revoking JWTs? | Short lifetimes plus rotating refresh tokens, deny-lists or a per-user token version. |
| OAuth vs OIDC? | Delegated access tokens vs identity with ID tokens on top. |
| Flow for a SPA? | Authorisation code with PKCE, ideally via a backend-for-frontend. |
| Roles vs claims vs policies? | Groups / facts / named rules combining them. |
| Resource-based authorisation? | Decisions using the specific record: tenant, owner, status. |
| Password storage? | Slow salted hashing: Argon2id, scrypt, bcrypt or PBKDF2. |
| SQL injection prevention? | Parameterised queries; FromSql not FromSqlRaw with concatenation. |
| Cache-aside? | Read the cache, load and populate on a miss, invalidate on write, TTL as a safety net. |
| Cache stampede? | Many simultaneous misses on an expired hot key; lock per key, add jitter. |
| Why a message queue? | Decoupling, load levelling, resilience, independent scaling. |
| At-least-once delivery? | Duplicates happen; consumers must be idempotent. |
| Outbox pattern? | Write events in the same transaction as the data, publish later. |
| RabbitMQ vs Kafka? | Broker that deletes on ack vs retained partitioned log with replay. |
| Hangfire vs BackgroundService? | Durable, retried, scheduled jobs with a dashboard vs in-process best-effort work. |
| Clean Architecture? | Dependencies point inward to a framework-independent domain. |
| Aggregate? | A consistency boundary with a root enforcing invariants. |
| CQRS? | Separate write and read paths and models. |
| Monolith vs microservices? | Start with a modular monolith; extract services for scaling or team autonomy. |
| Saga? | Local transactions with compensating actions across services. |
| Integration testing in ASP.NET Core? | WebApplicationFactory plus a real database in Testcontainers. |
| Testing time-dependent code? | Inject TimeProvider; use FakeTimeProvider. |
| Logs vs metrics vs traces? | Events / aggregated numbers / request paths across services. |
| Liveness vs readiness? | Restart if dead vs stop routing traffic if not ready. |
| Circuit breaker? | Stop calling a failing dependency for a while, fail fast, then test recovery. |
| Safe retries? | Idempotent transient failures only, exponential backoff with jitter, capped, one layer. |
| Node's concurrency model? | One JS thread, non-blocking I/O via the event loop and libuv. |

## B14.6 A two-week plan 🟢

<figure class="dia"><svg viewBox="0 0 720 230" role="img" aria-label="The two-week plan as a calendar: fundamentals, building labs, security and scale, quality and design, then rehearsal">
<rect class="sB" x="14" y="40" width="92" height="64" rx="8"/><text class="sM" x="22" y="56">day 1</text><text class="sT" x="60" y="78" text-anchor="middle">HTTP · SQL</text><text class="sC" x="60" y="95" text-anchor="middle">warm-up</text>
<rect class="sB" x="114" y="40" width="92" height="64" rx="8"/><text class="sM" x="122" y="56">day 2</text><text class="sT" x="160" y="78" text-anchor="middle">C# · SOLID</text><text class="sC" x="160" y="95" text-anchor="middle">own examples</text>
<rect class="sB" x="214" y="40" width="92" height="64" rx="8"/><text class="sM" x="222" y="56">day 3</text><text class="sT" x="260" y="78" text-anchor="middle">C# · SOLID</text><text class="sC" x="260" y="95" text-anchor="middle">console lab</text>
<rect class="sA" x="314" y="40" width="92" height="64" rx="8"/><text class="sM" x="322" y="56">day 4</text><text class="sT" x="360" y="78" text-anchor="middle">API lab</text><text class="sC" x="360" y="95" text-anchor="middle">B3 · B4</text>
<rect class="sA" x="414" y="40" width="92" height="64" rx="8"/><text class="sM" x="422" y="56">day 5</text><text class="sT" x="460" y="78" text-anchor="middle">EF Core</text><text class="sC" x="460" y="95" text-anchor="middle">N+1 · splits</text>
<rect class="sA" x="514" y="40" width="92" height="64" rx="8"/><text class="sM" x="522" y="56">day 6</text><text class="sT" x="560" y="78" text-anchor="middle">SQL tuning</text><text class="sC" x="560" y="95" text-anchor="middle">query plans</text>
<rect class="sV" x="614" y="40" width="92" height="64" rx="8"/><text class="sM" x="622" y="56">day 7</text><text class="sT" x="660" y="78" text-anchor="middle">auth</text><text class="sC" x="660" y="95" text-anchor="middle">OWASP top 3</text>
<rect class="sV" x="14" y="126" width="92" height="64" rx="8"/><text class="sM" x="22" y="142">day 8</text><text class="sT" x="60" y="164" text-anchor="middle">Redis · queue</text><text class="sC" x="60" y="181" text-anchor="middle">B8 lab</text>
<rect class="sG" x="114" y="126" width="92" height="64" rx="8"/><text class="sM" x="122" y="142">day 9</text><text class="sT" x="160" y="164" text-anchor="middle">tests · OTel</text><text class="sC" x="160" y="181" text-anchor="middle">B10 · B11</text>
<rect class="sG" x="214" y="126" width="92" height="64" rx="8"/><text class="sM" x="222" y="142">day 10</text><text class="sT" x="260" y="164" text-anchor="middle">architecture</text><text class="sC" x="260" y="181" text-anchor="middle">one design</text>
<rect class="sW" x="314" y="126" width="92" height="64" rx="8"/><text class="sM" x="322" y="142">day 11</text><text class="sT" x="360" y="164" text-anchor="middle">DSA ×5</text><text class="sC" x="360" y="181" text-anchor="middle">Node if listed</text>
<rect class="sW" x="414" y="126" width="92" height="64" rx="8"/><text class="sM" x="422" y="142">day 12</text><text class="sT" x="460" y="164" text-anchor="middle">live tasks</text><text class="sC" x="460" y="181" text-anchor="middle">timed</text>
<rect class="sW" x="514" y="126" width="92" height="64" rx="8"/><text class="sM" x="522" y="142">day 13</text><text class="sT" x="560" y="164" text-anchor="middle">mock round</text><text class="sC" x="560" y="181" text-anchor="middle">record it</text>
<rect class="sW" x="614" y="126" width="92" height="64" rx="8"/><text class="sM" x="622" y="142">day 14</text><text class="sT" x="660" y="164" text-anchor="middle">bank ×2</text><text class="sC" x="660" y="181" text-anchor="middle">stories · rest</text>
<text class="sM" x="14" y="30">week 1: the core stack</text><text class="sM" x="14" y="116">week 2: production topics, then rehearsal</text>
<rect class="sB" x="40" y="204" width="16" height="16" rx="3"/><text class="sC" x="62" y="217">fundamentals</text>
<rect class="sA" x="176" y="204" width="16" height="16" rx="3"/><text class="sC" x="198" y="217">build</text>
<rect class="sV" x="312" y="204" width="16" height="16" rx="3"/><text class="sC" x="334" y="217">security · scale</text>
<rect class="sG" x="448" y="204" width="16" height="16" rx="3"/><text class="sC" x="470" y="217">quality · design</text>
<rect class="sW" x="584" y="204" width="16" height="16" rx="3"/><text class="sC" x="606" y="217">rehearse</text>
</svg><figcaption>The plan at a glance. The last four days are practice under interview conditions, not new material.</figcaption></figure>

| Days | Do |
|---|---|
| 1 | [[S1]], [[S3]]: HTTP and SQL warm-up; ten SQL problems on paper |
| 2–3 | [[B1]], [[B2]]: C# fundamentals and SOLID with your own examples; the console-app lab |
| 4 | [[B3]], [[B4]]: build the "production-shaped API" lab |
| 5–6 | [[B5]], [[B6]]: EF Core labs (N+1, split queries, ExecuteUpdate); tune one query with a plan |
| 7 | [[B7]], [[S9]]: auth lab; the OWASP top three |
| 8 | [[B8]]: Redis and queue lab (or at least the design and a small demo) |
| 9 | [[B10]], [[B11]]: tests and telemetry labs in FinSight |
| 10 | [[B9]], [[B12]]: redraw FinSight; one practice design |
| 11 | [[S4]]: five DSA problems; [[B13]] if the job mentions Node |
| 12 | Live tasks from [[B14.2]], timed |
| 13 | A mock interview: a friend or a recording, with the bank and FinSight walkthrough |
| 14 | The bank twice, [[S8]] stories aloud, rest |

## Key takeaways

> [!check]
> - Fundamentals rounds decide most .NET interviews: drill the bank aloud until it's automatic.
> - Practise practical live tasks, especially "find the bugs", not only algorithms.
> - Take-homes are judged on structure, correctness, tests and the README as much as features.
> - Close the three cheapest, most visible gaps first: tests, telemetry, caching and queues.
> - Tell FinSight as a system you understand end to end, and be precise about which parts you built.

## Sources

- Modules S1–S10 and B1–B13 of this handbook and their sources.
- Microsoft Learn: [AI-200 certification page](https://learn.microsoft.com/en-us/credentials/certifications/azure-ai-cloud-developer-associate/) (checked October 2026).
