# Backend Architecture — Layers, Clean Architecture, DDD, CQRS, Modular Monoliths and Microservices

Senior Egyptian .NET postings name **Clean Architecture**, **DDD** and **microservices** explicitly; your gaps file lists them. Interviewers at mid level aren't looking for the most elaborate design. They're looking for **judgement**: can you explain why a structure helps, what it costs, and when you'd choose something simpler? FinSight gives you a concrete system to reason about: a modular monolith with a .NET API, separate LangFlow AI services, background jobs and multi-tenant data.

> [!focus]
> **Entry must:** layered architecture and separation of concerns; why business logic shouldn't live in controllers; what Clean Architecture's dependency rule says; monolith vs microservices at a high level.
> **Mid adds:** Clean/Onion/Hexagonal vs vertical slices, DDD building blocks (aggregates, value objects, bounded contexts, domain events), CQRS, modular monoliths, sagas, API gateways, multi-tenancy models, architecture decision records.
> **Most asked:** *Explain Clean Architecture* · *Monolith or microservices?* · *What is DDD / an aggregate?* · *What is CQRS and when is it worth it?* · *How do you handle a transaction across services?* · *How would you structure your project?*
> **Time budget:** 3 hours.

## B9.1 Layered architecture 🟢 ⭐

The classic structure separates **presentation** (controllers, endpoints), **business logic** (services, domain) and **data access** (repositories, DbContext).

**Why layers:** each part changes for different reasons ([[B2.2]]); business rules can be tested without HTTP or a database; the UI or database can change with less disruption.

> [!mistake] Fat controllers
> Business rules inside controllers or minimal-API lambdas (validation beyond shape, calculations, multi-step workflows, direct `DbContext` juggling) can't be reused by a background job or tested without HTTP. Keep endpoints thin: bind, call one application service or handler, return a result.

## B9.2 Clean, Onion and Hexagonal architecture 🟡 ⭐

These three are variations of one idea:

> [!term] The dependency rule
> Source-code dependencies point **inwards**, toward the business core. The **domain** (entities, rules) depends on nothing; the **application** layer (use cases) depends on the domain; **infrastructure** (EF Core, email, payment providers) and the **API** depend on the inner layers, implementing interfaces the inner layers define. The database and the web framework become replaceable details.

<figure class="dia"><svg viewBox="0 0 720 240" role="img" aria-label="Clean architecture rings: domain, application, infrastructure and API with dependencies pointing inward">
<circle class="sB" cx="210" cy="120" r="110"/><circle class="sW" cx="210" cy="120" r="80"/><circle class="sA" cx="210" cy="120" r="50"/><circle class="sG" cx="210" cy="120" r="24"/>
<text class="sT" x="210" y="124" text-anchor="middle">Domain</text>
<text class="sS" x="210" y="86" text-anchor="middle">Application</text>
<text class="sS" x="210" y="54" text-anchor="middle">Infrastructure · API</text>
<text class="sS" x="210" y="26" text-anchor="middle">frameworks, DB, UI</text>
<text class="sT" x="380" y="50">FinSight.Domain</text><text class="sS" x="380" y="68">Invoice, Money, CompanyId, rules — no EF, no ASP.NET</text>
<text class="sT" x="380" y="100">FinSight.Application</text><text class="sS" x="380" y="118">use cases, DTOs, interfaces: IForecastModel, IEmailSender</text>
<text class="sT" x="380" y="150">FinSight.Infrastructure</text><text class="sS" x="380" y="168">EF Core DbContext, TimeGPT client, SMTP, Hangfire</text>
<text class="sT" x="380" y="200">FinSight.Api</text><text class="sS" x="380" y="218">endpoints, auth, DI composition root</text>
</svg><figcaption>Clean Architecture as four projects. Arrows of dependency point inward; the API project wires implementations to interfaces at start-up (the composition root).</figcaption></figure>

| Variant | Emphasis |
|---|---|
| **Hexagonal** (ports and adapters, Alistair Cockburn) | The core exposes **ports** (interfaces); **adapters** connect them to the outside: HTTP, databases, queues, tests |
| **Onion** (Jeffrey Palermo) | Concentric layers with the domain model at the centre |
| **Clean** (Robert C. Martin) | Entities, use cases, interface adapters, frameworks: the same dependency rule, named rings |

**Benefits:** a domain testable in isolation; infrastructure swappable; framework upgrades contained. **Costs:** more projects, interfaces and mapping; for a CRUD app it's mostly ceremony. Pragmatic teams allow the application layer to use `DbContext` directly (treating EF Core as an acceptable abstraction) rather than wrapping it in repositories.

> [!say]
> "Clean Architecture is about the dependency rule: the domain and use cases in the middle don't depend on EF Core, ASP.NET or any vendor; infrastructure implements interfaces the core defines, and the API wires them together. It makes business rules testable and the outer details replaceable. I'd use it where there's real domain logic, and keep a simpler structure for CRUD-heavy services."

## B9.3 Vertical slice architecture 🟡 ⭐

Instead of organising by **technical layer** (all controllers together, all services together), organise by **feature**: each use case is a "slice" containing its endpoint, request and response, handler, validation and data access.

```text
Features/
  Invoices/
    CreateInvoice.cs        // request, validator, handler, endpoint mapping: all in one place
    GetInvoice.cs
    MarkInvoicePaid.cs
  Forecasts/
    GetForecast.cs
```

**Pros:** a change touches one folder; each slice can use the simplest approach that works (EF for one, Dapper for a hot query); little cross-feature coupling. **Cons:** shared domain logic must be extracted deliberately, or it gets duplicated.

Many teams combine them: a Clean-style **domain core** for shared rules, with **vertical slices** in the application and API layers.

## B9.4 Domain-Driven Design, the essentials 🟡 ⭐

DDD is a way to tackle **complex business domains** by modelling software closely on the business, in the business's language.

**Strategic DDD (the big picture):**

> [!term] Ubiquitous language
> One shared vocabulary between developers and domain experts, used in conversations, code and tests. If finance people say "settled", the code says `Settle()`, not `UpdateStatus(3)`.

> [!term] Bounded context
> A boundary inside which one model and one language apply consistently. "Customer" in Billing (payment terms, invoices) and "Customer" in Support (tickets, SLA) are different models with different rules; each context owns its own model, and they integrate through explicit contracts or events. Bounded contexts are the natural seams for modules or microservices.

**Tactical DDD (the building blocks):**

| Building block | Meaning | FinSight-style example |
|---|---|---|
| **Entity** | An object with identity that persists through changes | `Invoice` (ID stays the same as its status changes) |
| **Value object** | Defined only by its values, immutable, compared by value | `Money(Amount, Currency)`, `DateRange`, `Email` (C# records) |
| **Aggregate** | A cluster of objects treated as one unit for changes, with one **aggregate root** that enforces invariants | `Invoice` (root) with its `InvoiceLines` and `Payments`; nobody adds a payment except through `invoice.ApplyPayment()` |
| **Domain event** | Something meaningful that happened | `InvoicePaid`, raised by the aggregate and handled elsewhere (send email, re-forecast) |
| **Repository** | Loads and saves **whole aggregates** | `IInvoiceRepository` (per aggregate, not per table) |
| **Domain service** | Logic that doesn't belong to one entity | `ExchangeRateService` converting between currencies |

**Aggregate rules of thumb:** keep aggregates **small**; reference other aggregates **by ID**, not by object; one transaction should change **one aggregate**; coordinate across aggregates with domain events (eventual consistency).

> [!say]
> "An aggregate is a consistency boundary: a root entity with its children that must change together, and the root enforces the invariants. For example, an invoice can't be overpaid, so payments are only added through the invoice. I keep aggregates small, reference others by ID, change one per transaction, and use domain events for side effects like sending a receipt."

> [!mistake] DDD everywhere
> DDD pays off where the business logic is complex and central (billing, pricing, scheduling). For a settings screen or a CRUD admin page, it's overhead. Saying "I'd apply tactical DDD in the billing context and keep the rest simple" shows judgement.

## B9.5 CQRS 🟡 ⭐

> [!term] CQRS (Command Query Responsibility Segregation)
> Separating the code (and possibly the data models) that **changes state** (commands) from the code that **reads state** (queries). Commands go through the domain model and its invariants; queries read optimised projections straight into DTOs.

| Level | What it means | When |
|---|---|---|
| **Code-level CQRS** | Separate command handlers and query handlers in the same database | Very common; low cost; reads use `AsNoTracking` projections or Dapper, writes use aggregates |
| **Separate read models** | Read-optimised tables or views (denormalised) updated from the write side | Heavy, complex read screens; reporting |
| **Separate read store** | Reads from a different database (a search index, a replica, a cache) | Very high read scale; accepts eventual consistency |

> [!story]
> FinSight's **command and query DTOs** were a lightweight form of CQRS, and the `DailyAggregatedTransaction` table is effectively a **read model**: a projection maintained for the forecasting and dashboard reads. Naming it that way in an interview shows you recognise the pattern you built.

**Event sourcing** (🔴 senior): store the **sequence of events** (InvoiceCreated, PaymentApplied…) as the source of truth instead of current state, and rebuild state by replaying them. It gives a perfect audit trail and temporal queries, but adds a lot of complexity (versioning events, projections, eventual consistency). Know what it is and that it's often paired with CQRS; don't propose it casually.

## B9.6 Monolith, modular monolith or microservices? 🟢 🟡 ⭐

| | Monolith | **Modular monolith** | Microservices |
|---|---|---|---|
| Deployment | One unit | One unit | Many independently deployable services |
| Internal boundaries | Often blurry | **Enforced modules** (by bounded context), with explicit public APIs and their own data | Process and network boundaries |
| Data | One database | One database, schema or tables **owned per module** | **Database per service** |
| Transactions | Easy (one DB) | Easy within a module; events between modules | **Distributed**: sagas, eventual consistency |
| Operational cost | Low | Low | **High**: deployment, monitoring, tracing, networking, versioning |
| Team fit | Small team | Small to medium teams | Many teams needing to deploy independently |

**Why microservices:** independent deployment and scaling per service, fault isolation, freedom of technology per service, and **team autonomy**, often the real driver (Conway's law: system structure mirrors the organisation's communication structure).

**What they cost:** network calls that fail and add latency, distributed transactions, data duplication, eventual consistency, versioning between services, and much heavier observability and DevOps needs.

> [!term] Distributed monolith
> The worst of both: services that are deployed separately but are so coupled (shared database, chatty synchronous calls, lock-step releases) that they must change together. It has all the operational cost of microservices and none of the independence.

> [!say]
> "For a small team I'd start with a modular monolith: one deployable, but modules aligned to bounded contexts, each owning its data and exposing a small API, with events between them. That keeps transactions simple and deployment cheap. When a module needs independent scaling or a separate team owns it, its boundaries are already clean enough to extract as a service. Microservices are an organisational solution as much as a technical one."

> [!story]
> FinSight was effectively a **modular monolith plus separate AI services**: the .NET API as one deployable, with LangFlow flows running as their own containers and reached over HTTP through the app's authenticated API. If asked "how would you split it?": the forecasting engine (CPU-heavy, scheduled, separately scalable) is the obvious first candidate, with a queue between it and the API ([[B8]]). That's exactly the fix your gaps file suggests for the Full-Stack CV.

## B9.7 Patterns that come with services 🟡 ⭐

**API gateway:** one entry point for clients that routes to services and handles cross-cutting concerns: authentication, rate limiting, TLS, aggregation. In .NET, **YARP** (Yet Another Reverse Proxy) is Microsoft's toolkit for building one; Azure API Management is the managed option.

**Backend for Frontend:** a gateway tailored to one client (web, mobile), shaping responses for its screens ([[FS1]]).

**Synchronous vs asynchronous communication:** HTTP/gRPC calls are simple but couple availability (if B is down, A fails); messaging decouples them in time ([[B8]]). Prefer async for anything that doesn't need an immediate answer.

### Sagas: transactions across services ⭐

> [!term] Saga
> A sequence of **local transactions** across services, where each step publishes an event or command that triggers the next, and a failure triggers **compensating actions** that undo earlier steps (refund the payment, release the stock). It replaces a distributed ACID transaction with eventual consistency.

| Style | How | Pros | Cons |
|---|---|---|---|
| **Choreography** | Each service reacts to events and emits its own | No central coordinator; loose coupling | Hard to see and change the overall flow |
| **Orchestration** | A coordinator (the saga orchestrator) tells each service what to do next | The flow is explicit in one place, easier to monitor | The orchestrator is a central component to build and run |

Example, checkout: reserve stock → charge payment → create shipment. If the charge fails: release the stock. If the shipment fails: refund, then release.

**Resilience between services** (timeouts, retries, circuit breakers, bulkheads) is in [[B11]].

## B9.8 Multi-tenancy architectures 🟡 ⭐

| Model | Isolation | Cost | Operations | Fits |
|---|---|---|---|---|
| **Shared database, shared schema** (a `TenantId` column on every row) | Logical: relies on query filters and tests | Lowest | One schema to migrate | Many small tenants; SaaS start-ups (**FinSight**) |
| Shared database, **schema per tenant** | Stronger | Medium | Migrate N schemas | Moderate number of tenants with some customisation |
| **Database per tenant** | Strongest; easy per-tenant backup, restore and data residency | Highest | Many databases to manage; elastic pools help | Enterprise or regulated customers |
| Hybrid | Big tenants get their own database, small ones share | Varies | More complex routing | Growing SaaS |

Key concerns in any model: resolving the tenant (from a JWT claim, subdomain or header) once per request; enforcing it at the data layer (global query filters, PostgreSQL row-level security); the tenant in **cache keys** and **background jobs**; per-tenant rate limits so one "noisy neighbour" can't slow others; and tests that prove isolation.

## B9.9 Documenting decisions 🟢

> [!term] Architecture Decision Record (ADR)
> A short document (often Markdown in the repository) recording one significant decision: the **context**, the **decision**, the **alternatives** considered and the **consequences**. Future developers learn *why* things are the way they are, and the team can revisit decisions deliberately.

Your ~120 KB of FinSight architecture documentation, plus system, code-review and security-review reports, show this habit. Mention it: interviewers for mid-level roles value engineers who write things down.

> [!lab] Re-draw FinSight three ways
> On one page each: (1) FinSight as it is: modules, data ownership, sync vs async calls; (2) as a cleaner modular monolith: bounded contexts (Identity, Ledger, Forecasting, Alerts), each with its own folder, DbContext or schema, and events between them; (3) with Forecasting extracted as a service behind a queue. Write one ADR explaining why you'd stop at (2) for now. That's a complete architecture interview answer, in your own system.

## B9.10 Interview drill 🟢 ⭐

| Question | Strong short answer |
|---|---|
| Why keep controllers thin? | Business logic in services or handlers is reusable (by jobs and other endpoints) and testable without HTTP. |
| What is Clean Architecture? | Layers with dependencies pointing inward: domain and use cases independent of frameworks; infrastructure implements the core's interfaces. |
| Clean Architecture vs vertical slices? | Organised by technical layer with a strict dependency rule vs organised by feature, each slice self-contained; they combine well. |
| What is a bounded context? | A boundary within which one domain model and language apply; a natural module or service seam. |
| Entity vs value object? | An entity has identity that persists through changes; a value object is defined by its values and is immutable. |
| What is an aggregate? | A consistency boundary with a root that enforces invariants; changed as a unit, referenced by ID. |
| What is CQRS? | Separating writes (commands through the domain) from reads (optimised queries or read models). |
| When is CQRS worth it? | Code-level CQRS almost always; separate read stores only when read complexity or scale demands it. |
| Monolith or microservices? | Start with a modular monolith; extract services when independent scaling, deployment or team ownership justifies the operational cost. |
| What is a distributed monolith? | Separately deployed services so coupled that they must change and release together. |
| How do you do a transaction across services? | A saga of local transactions with compensating actions, orchestrated or choreographed. |
| What does an API gateway do? | A single entry point that routes requests and handles auth, rate limiting and aggregation (e.g. YARP, Azure API Management). |
| What multi-tenancy models exist? | Shared schema with a tenant column, schema per tenant, database per tenant, or a hybrid. |
| What is an ADR? | A short record of an architectural decision: context, decision, alternatives, consequences. |

## Key takeaways

> [!check]
> - Architecture is about where change happens and what depends on what.
> - Clean Architecture's one rule: dependencies point inward toward the domain.
> - Use DDD's tactics where the domain is complex; keep CRUD simple.
> - Default to a modular monolith; extract services for real organisational or scaling reasons.
> - Cross-service consistency means sagas and events, not distributed transactions.

## Sources

- Robert C. Martin, *Clean Architecture* (2017); Alistair Cockburn, [Hexagonal architecture](https://alistair.cockburn.us/hexagonal-architecture/); Jeffrey Palermo, "The Onion Architecture" (2008).
- Eric Evans, *Domain-Driven Design* (2003); Vaughn Vernon, *Implementing Domain-Driven Design* (2013) and *Domain-Driven Design Distilled* (2016).
- Jimmy Bogard, [Vertical slice architecture](https://www.jimmybogard.com/vertical-slice-architecture/).
- Martin Fowler: [CQRS](https://martinfowler.com/bliki/CQRS.html), [Event sourcing](https://martinfowler.com/eaaDev/EventSourcing.html), [MonolithFirst](https://martinfowler.com/bliki/MonolithFirst.html), [Microservices](https://martinfowler.com/articles/microservices.html).
- Microsoft Learn: [.NET microservices architecture e-book](https://learn.microsoft.com/en-us/dotnet/architecture/microservices/), [Common web application architectures (Clean Architecture)](https://learn.microsoft.com/en-us/dotnet/architecture/modern-web-apps-azure/common-web-application-architectures), [Saga pattern](https://learn.microsoft.com/en-us/azure/architecture/reference-architectures/saga/saga), [Multitenant SaaS database tenancy patterns](https://learn.microsoft.com/en-us/azure/azure-sql/database/saas-tenancy-app-design-patterns), [YARP](https://learn.microsoft.com/en-us/aspnet/core/fundamentals/servers/yarp/yarp-overview).
- Chris Richardson, [microservices.io patterns](https://microservices.io/patterns/).
- Michael Nygard, [Documenting architecture decisions](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions) (the original ADR post).
