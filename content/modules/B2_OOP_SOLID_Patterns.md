# OOP, SOLID and Design Patterns — Explained With Code You'd Actually Write

Egyptian .NET interviews almost always include "explain the four pillars of OOP", "explain SOLID with an example" and "which design patterns have you used?". The trap is giving textbook definitions with no examples. This module gives each principle a short **before and after** in C#, and ties patterns to things you've built: the Composite lab at ITI, FinSight's repositories and background jobs, ASP.NET Core's middleware pipeline.

> [!focus]
> **Entry must:** the four pillars with examples; each SOLID principle with a code example; five or six patterns you can explain and say where you used them; composition over inheritance.
> **Mid adds:** when a pattern is overkill, the Repository and Unit of Work debate with EF Core, Decorator vs inheritance, Strategy and Chain of Responsibility in ASP.NET Core, code smells and refactoring.
> **Most asked:** *Explain SOLID* · *Which pattern have you used and why?* · *Polymorphism with an example* · *Composition vs inheritance?* · *Is the Repository pattern needed with EF Core?* · *What's wrong with the Singleton pattern?*
> **Time budget:** 3 hours.

## B2.1 The four pillars 🟢 ⭐

| Pillar | Meaning | One-line C# example |
|---|---|---|
| **Encapsulation** | Hide internal state; expose behaviour that keeps it valid | `Amount { get; private set; }` changed only by `ApplyPayment()`, which rejects overpayment |
| **Abstraction** | Expose *what* something does, hide *how* | `IPaymentGateway.ChargeAsync()` hides whether it's Paymob or Stripe |
| **Inheritance** | A type reuses and specialises another | `SavingsAccount : Account` |
| **Polymorphism** | One call, different behaviour depending on the actual type | `foreach (var n in notifiers) await n.SendAsync(msg);` where each is Email, SMS or Push |

```csharp
public class Invoice
{
    private readonly List<Payment> _payments = [];
    public decimal Total { get; }
    public decimal Paid => _payments.Sum(p => p.Amount);
    public IReadOnlyList<Payment> Payments => _payments;      // callers can't add directly

    public Invoice(decimal total) => Total = total > 0 ? total : throw new ArgumentOutOfRangeException(nameof(total));

    public void ApplyPayment(Payment p)                        // the only way in: rules enforced here
    {
        if (Paid + p.Amount > Total) throw new InvalidOperationException("Overpayment");
        _payments.Add(p);
    }
}
```

> [!say]
> "Encapsulation means the object protects its own rules: an invoice's payments can only be added through ApplyPayment, which rejects overpayment. Polymorphism means I can loop over a list of notifiers and call SendAsync, and each type, email or SMS, does its own thing, without the caller knowing which."

### Composition over inheritance 🟢 ⭐

Inheritance creates the **tightest** coupling there is: a subclass depends on its parent's internals, and deep hierarchies become rigid. Prefer **composing** objects from smaller parts behind interfaces, and keep inheritance for genuine "is-a" relationships with shared behaviour.

```csharp
// Inheritance explosion: EmailNotifier, SmsNotifier, RetryingEmailNotifier, LoggingRetryingSmsNotifier…
// Composition: small pieces combined at runtime
INotifier notifier = new LoggingNotifier(new RetryingNotifier(new SmsNotifier(client), retries: 3), logger);
```

## B2.2 SOLID 🟢 ⭐

### S — Single Responsibility Principle

> A class should have **one reason to change**, meaning it answers to one actor or concern.

```csharp
// ❌ One class parses CSV, validates, saves to the database, and emails a report
public class TransactionImporter { /* parse + validate + save + email */ }

// ✅ Each concern changes independently
public class CsvTransactionParser { }      // changes when the file format changes
public class TransactionValidator { }      // changes when business rules change
public class TransactionRepository { }     // changes when storage changes
public class ImportReportMailer { }        // changes when the report changes
```

### O — Open/Closed Principle

> Open for **extension**, closed for **modification**: add behaviour by adding code, not by editing working code.

```csharp
// ❌ Every new payment method edits this switch
decimal Fee(string method, decimal amount) => method switch { "card" => amount * 0.025m, "wallet" => 2m, _ => 0 };

// ✅ New methods are new classes
public interface IFeePolicy { string Method { get; } decimal Fee(decimal amount); }
public class CardFee   : IFeePolicy { public string Method => "card";   public decimal Fee(decimal a) => a * 0.025m; }
public class WalletFee : IFeePolicy { public string Method => "wallet"; public decimal Fee(decimal a) => 2m; }
// registered in DI; a resolver picks by Method
```

### L — Liskov Substitution Principle

> Subtypes must be usable wherever the base type is expected **without breaking expectations**.

The classic violation: `Square : Rectangle`, where setting the width also changes the height and breaks code that assumes they're independent. A practical one: a `ReadOnlyRepository : Repository` whose `Add()` throws `NotSupportedException`. If a subclass has to throw "not supported" for an inherited member, the hierarchy is wrong; split the interface instead.

### I — Interface Segregation Principle

> Clients shouldn't depend on methods they don't use. Prefer several small interfaces to one fat one.

```csharp
// ❌ A report job is forced to depend on writes it never does
public interface IInvoiceRepository { Task<Invoice?> Get(Guid id); Task Add(Invoice i); Task Delete(Guid id); Task<Report> BuildReport(); }

// ✅
public interface IInvoiceReader { Task<Invoice?> Get(Guid id); }
public interface IInvoiceWriter { Task Add(Invoice i); Task Delete(Guid id); }
```

### D — Dependency Inversion Principle

> High-level policy shouldn't depend on low-level details; **both depend on abstractions**, and the abstraction is owned by the high-level side.

```csharp
// ❌ Business logic welded to an implementation
public class ForecastService { private readonly TimeGptHttpClient _client = new(); }

// ✅ Depends on an abstraction; DI supplies TimeGPT in production and a fake in tests
public class ForecastService(IForecastModel model, IClock clock) { }
```

Dependency **inversion** is the principle; dependency **injection** is a technique for achieving it ([[B1.11]]).

> [!say]
> "SOLID in one breath: single responsibility, one reason to change; open/closed, extend by adding classes rather than editing; Liskov, subtypes mustn't break the base's promises; interface segregation, small focused interfaces; and dependency inversion, business logic depends on abstractions that infrastructure implements. In FinSight, the forecasting service depended on an IForecastModel, so we could swap TimeGPT for a fake in tests."

> [!mistake] SOLID as dogma
> Ten interfaces with one implementation each, "just in case", make code harder to read. Apply the principles where change is likely or testing needs a seam. **YAGNI** (you aren't gonna need it) and **KISS** (keep it simple) are principles too.

## B2.3 Other principles worth naming 🟢

| Principle | Meaning |
|---|---|
| **DRY** | Don't repeat *knowledge*. Duplicated code that changes for different reasons is fine; a single rule copied in five places isn't |
| **KISS** | The simplest design that works |
| **YAGNI** | Don't build for imagined future requirements |
| **Separation of concerns** | Different responsibilities in different places (UI, business rules, data access) |
| **High cohesion, low coupling** | Things that change together live together; modules know as little about each other as possible |
| **Law of Demeter** | Talk to your immediate collaborators: `order.Customer.Address.City.Name` is a smell |
| **Tell, don't ask** | Ask objects to do things (`invoice.ApplyPayment(p)`) rather than pulling their data out and deciding for them |

## B2.4 The patterns you should be able to explain 🟢 🟡 ⭐

### Creational

**Factory (method or simple factory):** centralise creating the right implementation.

```csharp
public class NotifierFactory(IServiceProvider sp)
{
    public INotifier For(Channel c) => c switch
    {
        Channel.Email => sp.GetRequiredService<EmailNotifier>(),
        Channel.Sms   => sp.GetRequiredService<SmsNotifier>(),
        _ => throw new ArgumentOutOfRangeException(nameof(c)),
    };
}
```

**Builder:** construct complex objects step by step with readable code. ASP.NET Core itself is one: `WebApplication.CreateBuilder(args)` … `builder.Build()`. So are `StringBuilder`, EF Core's `ModelBuilder`, and test-data builders (`new InvoiceBuilder().Overdue().WithAmount(900).Build()`).

**Singleton:** exactly one instance. The classic hand-written version (a static `Instance` property) is **criticised**: it's global state, it hides dependencies and it's hard to test. In modern .NET, register a class as a **DI singleton** instead: you get one instance without the downsides.

### Structural

**Adapter:** make an incompatible interface fit the one you need. Wrapping Paymob, Fawry and Stripe SDKs behind your own `IPaymentGateway` is the textbook use, and your template library's Egyptian payment guides are exactly this problem.

**Decorator ⭐:** wrap an object to add behaviour **without changing it**, with the same interface in and out. Caching, logging, retries and authorisation are classic decorators.

```csharp
public class CachedRatesProvider(IRatesProvider inner, IMemoryCache cache) : IRatesProvider
{
    public Task<Rates> GetAsync(CancellationToken ct) =>
        cache.GetOrCreateAsync("rates", e => { e.AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(10); return inner.GetAsync(ct); })!;
}
```

**Facade:** one simple interface over a complicated subsystem (a `ReportService` hiding queries, PDF rendering and email).

**Proxy:** a stand-in that controls access to the real object. EF Core's lazy-loading proxies and `HttpClient`-based API clients are proxies.

**Composite:** treat individual objects and groups of them the same way, through one interface: a tree of items where a folder and a file both have `Size()`.

> [!story]
> You implemented the **Composite** pattern in an ITI lab (in `source\repos`). Explain it with your own example, then add where it shows up for real: menu trees, organisation charts, and expression trees, which is also how CS Visualizer's interpreter walks Roslyn's syntax tree.

### Behavioural

**Strategy ⭐:** a family of interchangeable algorithms behind one interface, chosen at runtime. The `IFeePolicy` example above is Strategy; so is choosing a forecasting model or a pricing rule per tenant.

**Observer:** subjects notify subscribers of changes. .NET events, `IObservable<T>`/RxJS, and SignalR broadcasting to clients are all Observer.

**Chain of Responsibility ⭐:** a request passes along a chain of handlers, each of which can handle it, modify it or pass it on. **ASP.NET Core middleware** is exactly this ([[B3]]), as are `HttpClient` `DelegatingHandler`s and Angular interceptors.

**Command:** wrap a request as an object, so it can be queued, logged, retried or undone. Background job payloads (Hangfire) and CQRS commands are commands.

**Template method:** a base class defines an algorithm's skeleton; subclasses fill in steps. `BackgroundService.ExecuteAsync` is a small example.

**Mediator:** objects communicate through a mediator instead of referencing each other. **MediatR** popularised it in .NET for CQRS handlers. Note that **MediatR moved to a commercial licence in 2025** (version 13 onwards, free for companies under US$5 million revenue), which is why some teams now use plain handler classes or alternatives.

**State:** an object changes behaviour when its internal state changes. An invoice workflow (Draft → Sent → Paid → Refunded) where each state allows different actions.

> [!say]
> "The patterns I use most are Strategy, for swapping algorithms like fee calculations behind an interface; Decorator, for adding caching or retries without touching the original class; Adapter, for wrapping payment providers behind our own interface; and Chain of Responsibility, which is how ASP.NET Core middleware works. I'm wary of the classic Singleton; a DI singleton gives one instance without hidden global state."

## B2.5 Repository and Unit of Work with EF Core 🟡 ⭐

> [!term] Repository
> An abstraction that makes a data store look like an in-memory collection of domain objects (`GetById`, `Add`, `Remove`), hiding query details from business logic.

> [!term] Unit of Work
> Tracks all changes made during a business operation and commits them together in one transaction.

**The debate:** EF Core's `DbSet<T>` already *is* a repository, and `DbContext` already *is* a unit of work (`SaveChanges` commits everything tracked). Wrapping them in a generic `IRepository<T>` with `GetAll()` often **hides** EF's power (projections, `Include`, `AsNoTracking`) and leaks `IQueryable` anyway.

| Approach | When it fits |
|---|---|
| Use `DbContext` directly in application services | Small and medium apps; less code; easy to optimise queries |
| **Specific** repositories (`IInvoiceRepository.GetOverdueAsync(companyId)`) | When you want named, testable queries and a clear boundary for the domain |
| A **generic** repository over EF Core | Rarely worth it; mostly duplicates `DbSet` |

> [!story]
> FinSight used a generic repository plus Unit of Work. A teammate (AhmedMosad0) built that layer; you integrated and used it. A mature answer: "it gave the team a consistent pattern, but in hindsight I'd use DbContext directly with a few specific query methods, because the generic repository made projections and AsNoTracking awkward." Be clear about who built what.

## B2.6 Patterns at the application level 🟡

- **Options pattern:** strongly typed configuration (`IOptions<SmtpSettings>`) validated at startup.
- **Result pattern:** return `Result<T>` (success or a list of errors) instead of throwing for expected failures like validation, so control flow stays explicit.
- **Specification:** encapsulate a query rule (`OverdueInvoicesSpec`) so it's reusable and testable.
- **CQRS:** separate commands (writes) from queries (reads), possibly with different models ([[B9]]).
- **Outbox:** save business data and outgoing messages in one transaction, publish later ([[B8]]).

## B2.7 Code smells and refactoring 🟡

| Smell | Symptom | Typical refactoring |
|---|---|---|
| **God class** | One class with thousands of lines and many reasons to change | Extract classes by responsibility (SRP) |
| **Long method** | Scrolling to read one method | Extract method; name the steps |
| **Primitive obsession** | `string email`, `decimal amount, string currency` everywhere | Value objects: `Email`, `Money` (records) |
| **Feature envy** | A method uses another object's data more than its own | Move the method to that object |
| **Shotgun surgery** | One change requires edits in many files | Gather the knowledge in one place |
| **Anaemic domain model** | Entities are only getters and setters, with all rules in services | Move invariants into entities where they belong (debated: fine for simple CRUD) |
| **Service locator** | Classes call `serviceProvider.GetService<X>()` themselves | Constructor injection, so dependencies are visible |

**Refactor safely:** tests first, small steps, one change at a time, with the IDE's automated refactorings.

> [!lab] Refactor a switch into a Strategy
> Find a `switch` on a type or status in one of your projects (payment methods, notification channels, file formats). Refactor it into Strategy classes registered in DI, with a unit test per strategy. You now have a concrete Open/Closed story with a before-and-after.

## B2.8 Interview drill 🟢 ⭐

| Question | Strong short answer |
|---|---|
| Four pillars of OOP? | Encapsulation, abstraction, inheritance and polymorphism, each with an example from your code. |
| Explain polymorphism. | One call, behaviour chosen by the object's actual type, e.g. a list of INotifier with Email and SMS implementations. |
| Composition vs inheritance? | Prefer composing small objects behind interfaces; inheritance couples tightly and suits only true is-a relationships. |
| Single Responsibility? | A class has one reason to change: one actor or concern. |
| Open/Closed? | Add behaviour by adding code (new classes), not editing working code. |
| Liskov? | Subtypes must honour the base type's contract; throwing NotSupported in an override is a red flag. |
| Interface Segregation? | Small, focused interfaces, so clients don't depend on methods they don't use. |
| Dependency Inversion? | High-level code depends on abstractions; infrastructure implements them; DI wires them. |
| Which patterns have you used? | Strategy for fees, Decorator for caching, Adapter for payment providers, Chain of Responsibility in middleware, Composite at ITI. |
| What's wrong with Singleton? | Hidden global state, hard to test; use a DI singleton instead. |
| Decorator vs inheritance? | Decorator adds behaviour at runtime by wrapping, combinable in any order; inheritance fixes it at compile time and multiplies subclasses. |
| Do you need Repository with EF Core? | Often not: DbSet and DbContext already are a repository and unit of work. Specific query repositories can still help. |
| What's the Strategy pattern? | Interchangeable algorithms behind one interface, selected at runtime. |
| What's a code smell? | A surface sign of a deeper design problem, like a god class or primitive obsession. |

## Key takeaways

> [!check]
> - Every principle needs a concrete example, ideally from your own code.
> - SOLID helps where change is likely; YAGNI and KISS stop it becoming ceremony.
> - Know Strategy, Decorator, Adapter, Factory, Observer and Chain of Responsibility well, plus where .NET uses them.
> - DbContext is already a unit of work; justify any repository layer.
> - Composition over inheritance; DI singletons over hand-written Singletons.

## Sources

- Robert C. Martin, *Clean Architecture* (2017) and *Agile Software Development: Principles, Patterns, and Practices* (2002), the origin of SOLID as a set.
- Gamma, Helm, Johnson and Vlissides, *Design Patterns: Elements of Reusable Object-Oriented Software* (1994), the "Gang of Four" catalogue.
- Martin Fowler, *Patterns of Enterprise Application Architecture* (2002): [Repository](https://martinfowler.com/eaaCatalog/repository.html), [Unit of Work](https://martinfowler.com/eaaCatalog/unitOfWork.html); *Refactoring*, 2nd ed. (2018).
- [Refactoring.Guru](https://refactoring.guru/design-patterns), an illustrated catalogue of patterns and smells.
- Microsoft Learn: [Implement the infrastructure persistence layer with EF Core](https://learn.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/infrastructure-persistence-layer-implementation-entity-framework-core), [Options pattern](https://learn.microsoft.com/en-us/aspnet/core/fundamentals/configuration/options).
- Jimmy Bogard, [AutoMapper and MediatR commercial editions launch](https://www.jimmybogard.com/automapper-and-mediatr-commercial-editions-launch-today/) (July 2025).
