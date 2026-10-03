# C# and the .NET Runtime — Types, LINQ, async/await, Memory and DI

.NET backend interviews in Egypt open with C# fundamentals more reliably than anything else: value vs reference types, `IEnumerable` vs `IQueryable`, async/await, DI lifetimes, garbage collection. You've used C# for years (ITI's 60 projects, FinSight, a Roslyn-based interpreter in CS Visualizer), so the goal here is precise vocabulary and the "why" behind each answer.

> [!focus]
> **Entry must:** value vs reference types; classes, interfaces, abstract classes, records; properties and access modifiers; generics; LINQ basics and deferred execution; async/await and Task; exceptions; `using` and `IDisposable`; DI lifetimes.
> **Mid adds:** IEnumerable vs IQueryable in depth, async pitfalls (deadlocks, `async void`, cancellation), GC generations and the large object heap, `Span<T>`, equality and hashing, captive dependencies, what's new in C# 12–14.
> **Most asked:** *Value vs reference type?* · *struct vs class vs record?* · *Abstract class vs interface?* · *IEnumerable vs IQueryable?* · *How does async/await work?* · *Task vs Thread?* · *Singleton vs scoped vs transient?* · *How does the GC work?* · *`throw` vs `throw ex`?*
> **Time budget:** 4 hours, with a console app open (`dotnet new console`).

## B1.1 The .NET platform 🟢 ⭐

- You write C#; the compiler (**Roslyn**) produces **IL** (intermediate language) inside an assembly (`.dll`).
- At runtime the **CLR** (common language runtime) loads it, and the **JIT** compiler turns IL into machine code as methods are first called. **Tiered compilation** compiles quickly first, then recompiles hot methods with full optimisation.
- **Native AOT** compiles ahead of time into a self-contained native executable: fast start-up and small memory, at the cost of some dynamic features (reflection-heavy code). It suits containers, functions and CLI tools.
- The **base class library** (BCL) provides collections, I/O, networking, JSON (`System.Text.Json`) and more.

**Releases:** a new major version every November. Even-numbered releases are **LTS** (three years of support); odd-numbered are **STS**, now supported for **24 months**. **.NET 10** (November 2025) is the current LTS, supported until **November 2028**, and it shipped with **C# 14**. .NET 8 and .NET 9 both reach end of support on **10 November 2026**, so many teams are migrating to .NET 10 right now. That's a good topic to show you're current.

## B1.2 Value types and reference types 🟢 ⭐

| | Value types | Reference types |
|---|---|---|
| Examples | `int`, `double`, `decimal`, `bool`, `DateTime`, `Guid`, enums, **`struct`**, `record struct` | **`class`**, `record` (class), `string`, arrays, delegates, `object` |
| Variable holds | The **data itself** | A **reference** to an object on the managed heap |
| Assignment copies | The whole value | The reference (both variables see the same object) |
| Default | Zeroed value (`0`, `false`) | `null` |
| Equality by default | Field-by-field (for structs, via reflection unless overridden) | **Reference identity** (records and `string` override this) |

> [!mistake] "Value types live on the stack"
> It's a useful simplification but not the rule. A value type lives **wherever its container is**: a local `int` is usually on the stack, but an `int` field inside a class object is on the heap with that object, and a boxed `int` is on the heap. The real difference is **copy semantics**.

> [!term] Boxing
> Converting a value type to `object` (or an interface it implements) by copying it into a new heap object; **unboxing** copies it back. It allocates and is slow in hot loops, which is why generic collections (`List<int>`) replaced `ArrayList`.

**`string`** is a reference type that **behaves like a value**: it's **immutable** and compares by content. Every "modification" creates a new string, so building a large string in a loop should use `StringBuilder`.

**Nullable reference types** (enabled by default in new projects): `string` means "never null" and `string?` means "might be null", and the compiler warns when you might dereference a null. It's a compile-time check only.

> [!say]
> "A value type holds its data directly and is copied on assignment; a reference type holds a reference to a heap object, so assignments share the same object. Where it's stored depends on the container. A value-type field of a class lives on the heap. The practical difference is copy semantics and equality."

## B1.3 Classes, structs, records 🟢 ⭐

```csharp
public class Invoice                     // reference type, identity semantics, mutable
{
    public Guid Id { get; init; } = Guid.NewGuid();   // init: settable only during construction
    public required string Customer { get; set; }       // required (C# 11): must be set by the caller
    public decimal Amount { get; private set; }
    public void ApplyDiscount(decimal pct) => Amount -= Amount * pct;
}

public readonly record struct Money(decimal Amount, string Currency);   // small immutable value

public record InvoiceDto(Guid Id, string Customer, decimal Amount);     // immutable data carrier
var a = new InvoiceDto(id, "Nile Foods", 900);
var b = a with { Amount = 950 };        // non-destructive copy
Console.WriteLine(a == b);              // false: records compare by VALUE
```

| | `class` | `struct` | `record` (class) |
|---|---|---|---|
| Kind | Reference | Value | Reference |
| Equality | Reference | Value (fields) | **Value** (compiler-generated) |
| Mutability | Usually mutable | Prefer `readonly struct` | Positional records are immutable (`init`) |
| Inheritance | Yes | No | Yes (records from records) |
| Good for | Entities with identity and behaviour | Small, short-lived values (≤ ~16 bytes): coordinates, money | DTOs, messages, value objects, query results |

> [!say]
> "I use classes for entities with identity and behaviour, records for DTOs and value objects because they're immutable with value equality and the with-expression, and structs only for small, immutable values where avoiding allocations matters."

## B1.4 Abstraction: interfaces and abstract classes 🟢 ⭐

| | Interface | Abstract class |
|---|---|---|
| Represents | A **capability** or contract ("can be saved") | A **base** with shared state and behaviour ("is a kind of payment") |
| Multiple? | A class can implement **many** | A class can inherit **one** |
| State (fields) | No instance fields | Yes |
| Constructors | No | Yes |
| Implementation | Signatures, plus default interface methods (C# 8+) | Abstract and concrete members |
| Typical use | Seams for DI and testing: `IInvoiceRepository`, `IClock` | Template method: shared algorithm with overridable steps |

**Access modifiers:** `public`, `private` (default for members), `protected` (derived classes), `internal` (same assembly, default for top-level types), `protected internal`, `private protected`, and `file` (C# 11: visible only in this file).

Other keywords to know: `static` (belongs to the type, not an instance), `sealed` (can't be inherited, which also allows some JIT optimisations), `virtual`/`override` (polymorphism), `new` (hides a base member, usually a smell), `partial` (a type split across files, used by source generators).

## B1.5 Generics, delegates and lambdas 🟢

```csharp
public interface IRepository<T> where T : class, IEntity    // constraint
{
    Task<T?> GetAsync(Guid id, CancellationToken ct = default);
    Task AddAsync(T entity, CancellationToken ct = default);
}

Func<decimal, decimal> addVat = x => x * 1.14m;      // takes decimal, returns decimal
Action<string> log = msg => Console.WriteLine(msg);  // returns nothing
Predicate<Invoice> overdue = i => i.DueDate < DateTime.UtcNow;
```

- **Generics** keep type safety and avoid boxing; constraints (`where T : class, new()`, `where T : IComparable<T>`) say what `T` must support.
- **Variance** (mid level): `IEnumerable<out T>` is **covariant**, so an `IEnumerable<string>` can be used as an `IEnumerable<object>`; `Action<in T>` is **contravariant**.
- A **delegate** is a type-safe reference to a method; `Func<>`, `Action<>` and `Predicate<>` are the built-in ones; **events** are delegates restricted so outsiders can only subscribe and unsubscribe.
- Lambdas that use outer variables form **closures** ([[F3.4]]), which can extend those variables' lifetime.

## B1.6 LINQ 🟢 ⭐

```csharp
var topCustomers = invoices
    .Where(i => i.Status == InvoiceStatus.Paid && i.PaidOn >= since)
    .GroupBy(i => i.CustomerId)
    .Select(g => new { CustomerId = g.Key, Total = g.Sum(i => i.Amount), Count = g.Count() })
    .OrderByDescending(x => x.Total)
    .Take(10)
    .ToList();                                 // executes here
```

> [!term] Deferred execution
> Most LINQ operators (`Where`, `Select`, `OrderBy`) don't run when called; they build a query that runs when you **enumerate** it (`foreach`, `ToList()`, `First()`, `Count()`). Enumerating twice runs it twice, which against a database means two queries.

### IEnumerable vs IQueryable ⭐

| | `IEnumerable<T>` | `IQueryable<T>` |
|---|---|---|
| Works on | Objects **in memory** | A **query provider** (EF Core → SQL, or other providers) |
| Lambdas are | Compiled delegates (`Func<T,bool>`) | **Expression trees** (`Expression<Func<T,bool>>`) the provider translates |
| Filtering happens | In your process, after the data is loaded | In the **database**, as SQL |

```csharp
IQueryable<Invoice> q = db.Invoices.Where(i => i.CompanyId == companyId);  // still SQL
var page = await q.OrderBy(i => i.DueDate).Skip(40).Take(20).ToListAsync(); // ONE SQL query with WHERE, ORDER BY, OFFSET/FETCH

IEnumerable<Invoice> e = db.Invoices.AsEnumerable();                         // from here on, in memory
var bad = e.Where(i => i.CompanyId == companyId).ToList();                   // loads EVERY invoice, then filters
```

> [!say]
> "IEnumerable runs LINQ in memory over objects already loaded. IQueryable keeps the query as an expression tree so EF Core can translate it to SQL, which means filtering, sorting and paging happen in the database. Switching to IEnumerable too early, for example by calling ToList or AsEnumerable before the Where, loads the whole table."

> [!mistake] Multiple enumeration
> Passing an `IEnumerable` from a database query around and calling `.Count()` then `foreach` runs the query twice. Materialise once with `ToList()` when you need the results more than once.

## B1.7 async/await 🟢 🟡 ⭐

**Why:** a web server has a limited pool of threads. While a request waits for the database or an HTTP call, a **blocking** call holds its thread hostage, while an **awaited** call **returns the thread to the pool** to serve other requests. Async is about **scalability**, not making one request faster.

```csharp
public async Task<DashboardDto> GetDashboardAsync(Guid companyId, CancellationToken ct)
{
    var summaryTask  = _db.GetSummaryAsync(companyId, ct);       // start both...
    var forecastTask = _forecast.GetAsync(companyId, 90, ct);
    await Task.WhenAll(summaryTask, forecastTask);                 // ...await together
    return new DashboardDto(summaryTask.Result, forecastTask.Result);   // safe: both completed
}
```

How it works: the compiler turns an `async` method into a **state machine**. At an `await` on an incomplete task, the method returns an incomplete `Task` to its caller, and the rest of the method is registered as a **continuation** to run when the awaited work finishes. No thread sits waiting.

| Rule | Why |
|---|---|
| **Async all the way**; never `.Result` or `.Wait()` on an incomplete task | Blocking wastes a thread, and in environments with a synchronisation context (UI apps, legacy ASP.NET) it can **deadlock** |
| **Never `async void`** except event handlers | Exceptions can't be caught by the caller and crash the process; nobody can await it |
| Pass and honour **`CancellationToken`** | When the client disconnects, `HttpContext.RequestAborted` cancels the database call too |
| `ConfigureAwait(false)` in **library** code | ASP.NET Core has no synchronisation context, so app code doesn't need it; libraries used by UI apps still do |
| Use `ValueTask` only when results are often synchronous (cached) | It avoids an allocation, but can only be awaited once |
| Don't wrap CPU work in `Task.Run` inside ASP.NET Core | It just moves work to another pool thread; use it for CPU work in UI apps |

> [!term] Task vs Thread
> A **thread** is an OS-level unit of execution, expensive to create and hold. A **Task** is a promise of a result that may complete later; it might run on a thread-pool thread, or (for I/O) not use a thread at all while waiting. async/await composes Tasks.

> [!say]
> "await doesn't block a thread. The method returns to its caller, and the rest of it runs as a continuation when the awaited operation completes, so the thread can serve other requests in the meantime. That's why I keep code async all the way down, never block with .Result, avoid async void, and pass cancellation tokens through to the database."

## B1.8 Memory and the garbage collector 🟡 ⭐

The **GC** frees heap objects that nothing references any more.

- **Generations:** new objects start in **gen 0**; survivors are promoted to **gen 1**, then **gen 2**. Most objects die young, so gen 0 collections are frequent and cheap; gen 2 collections are rarer and costlier.
- **Large object heap (LOH):** objects of **85,000 bytes or more** (big arrays and strings) go straight to the LOH, collected with gen 2 and not compacted by default, so lots of large temporary buffers cause fragmentation. Use `ArrayPool<T>` for big reusable buffers.
- **Server vs workstation GC:** ASP.NET Core uses server GC by default (one heap per core, throughput-oriented).

**Managed memory is the GC's job; unmanaged resources are yours.** Database connections, file handles and sockets must be released deterministically:

```csharp
await using var conn = new SqlConnection(cs);      // DisposeAsync at the end of the scope
using var stream = File.OpenRead(path);             // Dispose at the end of the scope
```

> [!term] IDisposable
> The pattern for releasing unmanaged resources deterministically through `Dispose()`, usually via a `using` statement. Finalisers (`~ClassName`) are a safety net run by the GC much later, and are rarely needed.

**Memory leaks still happen in .NET:** static collections that only grow, event handlers that are subscribed and never unsubscribed (the publisher keeps the subscriber alive), caches without size limits or expiry, and long-lived captured closures.

**`Span<T>` and `Memory<T>`** (mid level): views over contiguous memory (arrays, stack memory, slices of strings) without copying or allocating. Used in high-performance parsing; C# 14 added implicit conversions that make them easier to use.

> [!story]
> Your benchmark found EF Core allocated about **1.9× the memory** of raw ADO.NET and Dapper. That's a GC conversation: more allocations mean more gen 0 collections. Explain why it was still the right default for CRUD (developer speed, change tracking, migrations) and when you'd switch a hot path to Dapper or `AsNoTracking()` projections ([[B5]]).

## B1.9 Exceptions 🟢 ⭐

```csharp
try
{
    await _payments.ChargeAsync(invoice, ct);
}
catch (HttpRequestException ex) when (ex.StatusCode == HttpStatusCode.ServiceUnavailable)  // exception filter
{
    _logger.LogWarning(ex, "Payment provider unavailable for {InvoiceId}", invoice.Id);
    throw new PaymentUnavailableException(invoice.Id, ex);   // wrap with context, keep the inner exception
}
```

| Rule | Why |
|---|---|
| **`throw;`** not **`throw ex;`** to rethrow | `throw ex` resets the stack trace to this line, losing where it really failed |
| Catch **specific** exceptions you can handle | Catching `Exception` everywhere hides bugs; let unexpected ones reach the global handler |
| Don't use exceptions for normal control flow | They're expensive; use `TryParse`, `TryGetValue`, or a result type |
| Add context, keep the cause | Wrap with a meaningful message and pass the inner exception |
| One global handler in ASP.NET Core | Converts unhandled exceptions into `ProblemDetails` and logs them ([[B3]]) |

## B1.10 Equality, hashing and collections 🟡

- Override `Equals` **and** `GetHashCode` together (or use a record). Objects that are equal must have the same hash code, or `Dictionary` and `HashSet` break.
- Don't use mutable fields in a hash code: if the object changes while in a `HashSet`, it becomes unfindable.
- Pick collections by access pattern ([[S4.3]]); `IReadOnlyList<T>` and `IReadOnlyCollection<T>` express intent in APIs; `FrozenDictionary` and `FrozenSet` (.NET 8) are optimised for data built once and read many times, such as lookup tables.

## B1.11 Dependency injection in .NET 🟢 ⭐

ASP.NET Core has a built-in DI container. You register services at startup and receive them through constructor parameters.

```csharp
builder.Services.AddSingleton<IClock, SystemClock>();                 // one for the whole app
builder.Services.AddScoped<IInvoiceService, InvoiceService>();        // one per HTTP request
builder.Services.AddTransient<IPdfRenderer, PdfRenderer>();           // a new one every time it's injected
builder.Services.AddDbContext<AppDbContext>(o => o.UseSqlServer(cs)); // DbContext is scoped
builder.Services.AddKeyedSingleton<IStorage, BlobStorage>("blob");    // keyed services (.NET 8)

public class InvoiceService(AppDbContext db, IClock clock) : IInvoiceService   // primary constructor (C# 12)
{
    public Task<bool> IsOverdueAsync(Guid id) => /* uses db and clock */ ...;
}
```

| Lifetime | One instance per… | Use for | Watch out |
|---|---|---|---|
| **Singleton** | Application | Stateless services, caches, configuration, `HttpClient` handlers | Must be **thread-safe**; must not depend on scoped services |
| **Scoped** | Request (scope) | `DbContext`, unit of work, per-request user context | Not available outside a scope (background services must create one) |
| **Transient** | Injection | Lightweight, stateless helpers | Disposable transients are tracked until the scope ends |

> [!term] Captive dependency
> A longer-lived service holding a shorter-lived one, such as a **singleton that injects a scoped `DbContext`**. The DbContext gets "captured" for the app's lifetime: shared between requests, not thread-safe, never refreshed. ASP.NET Core's scope validation throws on this in Development. In a singleton or a `BackgroundService`, inject `IServiceScopeFactory` and create a scope per unit of work.

> [!say]
> "Singleton is one instance for the app, scoped is one per request, transient is new every injection. DbContext is scoped because it isn't thread-safe and tracks changes per unit of work. The classic bug is a captive dependency, a singleton holding a scoped service; in a background job I create a scope per iteration with IServiceScopeFactory."

> [!story]
> FinSight's **Hangfire** jobs and the nightly forecasting job run outside an HTTP request, so they need their own DI scope to get a `DbContext`, and a tenant context that isn't a JWT claim. That's a sharp mid-level answer to "how did multi-tenancy work in background jobs?".

## B1.12 Modern C# you should recognise 🟡

| Version (.NET) | Features worth naming |
|---|---|
| C# 9 (.NET 5) | Records, `init` setters, top-level statements, pattern-matching improvements |
| C# 10 (.NET 6) | Global usings, file-scoped namespaces, record structs |
| C# 11 (.NET 7) | Raw string literals `"""…"""`, `required` members, list patterns, `file` types |
| C# 12 (.NET 8) | **Primary constructors** for classes, **collection expressions** `[1, 2, 3]`, default lambda parameters |
| C# 13 (.NET 9) | `params` collections, the new `System.Threading.Lock` type, `\e` escape |
| **C# 14 (.NET 10)** | **Extension members** (extension properties and static extensions), the **`field`** keyword in property accessors, **null-conditional assignment** `customer?.Order = …`, `nameof(List<>)`, implicit `Span` conversions, partial constructors and events |

```csharp
// Pattern matching, which interviewers like to see
string Band(Invoice i) => i switch
{
    { Status: InvoiceStatus.Paid }                   => "settled",
    { DueDate: var d } when d < DateTime.UtcNow      => "overdue",
    { Amount: > 100_000 }                             => "large",
    _                                                 => "open",
};

// C# 14: field-backed property with validation, no separate backing field
public string Email
{
    get;
    set => field = value?.Trim().ToLowerInvariant() ?? throw new ArgumentNullException(nameof(value));
}
```

> [!lab] One hour in a console app
> Write: a record vs class equality demo; an `IQueryable` vs `IEnumerable` comparison against SQLite with EF Core, logging the generated SQL; an async method that runs two delays with `Task.WhenAll` and one sequentially, timing both; and a singleton that injects a scoped service, to see scope validation throw. Each output is something you can describe in an interview.

## B1.13 Interview drill 🟢 ⭐

| Question | Strong short answer |
|---|---|
| Value vs reference type? | Value types hold data and copy on assignment; reference types hold a reference to a heap object, shared on assignment. |
| class vs struct vs record? | Class: reference, identity equality. Struct: value type, best small and immutable. Record: reference type with value equality, immutability and `with`. |
| Interface vs abstract class? | Interface: a contract, many per class, no state. Abstract class: a single base with shared state and behaviour. |
| What is boxing? | Wrapping a value type in a heap object when treated as object or an interface; it allocates. |
| IEnumerable vs IQueryable? | In-memory delegates vs expression trees translated by a provider, e.g. to SQL, so filtering runs in the database. |
| What is deferred execution? | LINQ queries run when enumerated, not when defined; enumerating twice runs twice. |
| How does async/await work? | The compiler builds a state machine; at an incomplete await the method returns and resumes as a continuation, freeing the thread. |
| Why not `.Result`? | It blocks a thread and can deadlock with a synchronisation context; stay async all the way. |
| Why avoid async void? | Exceptions can't be caught by callers and it can't be awaited; only for event handlers. |
| Task vs Thread? | A thread is an OS execution unit; a Task represents future work and may not use a thread while waiting for I/O. |
| How does the GC work? | Generational: gen 0, 1, 2, with frequent cheap young collections; large objects (≥ 85 KB) go to the LOH. |
| What's IDisposable for? | Deterministically releasing unmanaged resources, usually via `using`. |
| `throw` vs `throw ex`? | `throw;` keeps the original stack trace; `throw ex;` resets it. |
| Singleton vs scoped vs transient? | One per app, one per request, one per injection. |
| What's a captive dependency? | A longer-lived service holding a shorter-lived one, like a singleton holding a scoped DbContext. |
| What's new in C# 14? | Extension members, the field keyword, null-conditional assignment, implicit span conversions. |
| What's the current LTS? | .NET 10 (November 2025), supported to November 2028; .NET 8 and 9 end in November 2026. |

## Key takeaways

> [!check]
> - Copy semantics, not "stack vs heap", is the real value/reference difference.
> - Records for DTOs and value objects; classes for entities; structs only when small and immutable.
> - Keep queries `IQueryable` until the database has done the filtering.
> - async frees threads; never block on it; pass cancellation tokens.
> - DI lifetimes: DbContext is scoped; singletons must never capture scoped services.

## Sources

- Microsoft Learn: [Value types](https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/builtin-types/value-types), [Records](https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/builtin-types/record), [LINQ overview](https://learn.microsoft.com/en-us/dotnet/csharp/linq/), [Asynchronous programming with async and await](https://learn.microsoft.com/en-us/dotnet/csharp/asynchronous-programming/), [Fundamentals of garbage collection](https://learn.microsoft.com/en-us/dotnet/standard/garbage-collection/fundamentals), [Large object heap](https://learn.microsoft.com/en-us/dotnet/standard/garbage-collection/large-object-heap), [Dependency injection in .NET](https://learn.microsoft.com/en-us/dotnet/core/extensions/dependency-injection), [Service lifetimes](https://learn.microsoft.com/en-us/dotnet/core/extensions/dependency-injection#service-lifetimes), [What's new in C# 14](https://learn.microsoft.com/en-us/dotnet/csharp/whats-new/csharp-14), [Exception best practices](https://learn.microsoft.com/en-us/dotnet/standard/exceptions/best-practices-for-exceptions).
- [.NET support policy](https://dotnet.microsoft.com/platform/support/policy/dotnet-core).
- David Fowler, [ASP.NET Core diagnostic scenarios: async guidance](https://github.com/davidfowl/AspNetCoreDiagnosticScenarios/blob/master/AsyncGuidance.md).
- Stephen Toub, [How async/await really works in C#](https://devblogs.microsoft.com/dotnet/how-async-await-really-works/) (.NET blog).
