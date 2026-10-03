# EF Core and Data Access — Tracking, Loading, N+1, Migrations and When to Use Dapper

Most .NET backend bugs that reach production are data-access bugs: a query that loads the whole table, an N+1 loop, a "cartesian explosion", a missing tenant filter, a decimal silently truncated. You've met several of these for real in FinSight (you fixed an `AsSplitQuery` performance issue and EF decimal truncation, and enforced multi-tenancy with global query filters), and you **benchmarked** ADO.NET, Dapper and EF Core. That gives you stories few juniors have. This module targets **EF Core 10** (November 2025, LTS until November 2028).

> [!focus]
> **Entry must:** what an ORM does; DbContext lifetime and change tracking; LINQ to SQL translation; Include and projections; migrations; AsNoTracking; transactions via SaveChanges.
> **Mid adds:** N+1 and cartesian explosion (split queries), bulk ExecuteUpdate and ExecuteDelete, global and named query filters, concurrency tokens, interceptors, compiled queries, reading generated SQL, choosing Dapper for hot paths, testing with real databases.
> **Most asked:** *EF Core vs Dapper vs ADO.NET?* · *What is the N+1 problem?* · *Lazy vs eager vs explicit loading?* · *What does AsNoTracking do?* · *How do migrations work in a team?* · *How do you handle concurrency?* · *How do you implement soft delete or multi-tenancy?*
> **Time budget:** 4 hours, with a SQLite or SQL Server project and SQL logging turned on.

## B5.1 Choosing a data-access approach 🟢 ⭐

| | ADO.NET | Dapper | EF Core |
|---|---|---|---|
| What it is | Raw `SqlConnection`, `SqlCommand`, `DataReader` | A thin micro-ORM: you write SQL, it maps rows to objects | A full ORM: LINQ to SQL, change tracking, migrations, relationships |
| You write | SQL and all the mapping | SQL | Mostly C# (LINQ), SQL when needed |
| Speed | Fastest | Near raw ADO.NET | Slower and allocates more, but close for well-written queries |
| Productivity | Low | Medium | High |
| Schema management | None | None | **Migrations** |
| Fits | Very hot paths, special cases | Read-heavy queries, reporting, complex SQL | Most CRUD and domain logic |

> [!story]
> Your BenchmarkDotNet results: raw ADO.NET and Dapper ran at about the same speed, while EF Core was **about 6% slower** and allocated about **1.9× the memory**. The mature conclusion, which is the one interviewers want: "EF Core's overhead was small enough that its productivity (change tracking, migrations, LINQ) was the right default for CRUD; I'd use Dapper or a projected, no-tracking EF query on the few hot read paths, and measure before switching."

> [!say]
> "I default to EF Core for its productivity and migrations, write projections and no-tracking queries for reads, and drop to Dapper for a handful of hot or complex read queries, because I measured: EF Core was only a few percent slower but allocated nearly twice the memory. Many teams use both in the same app."

## B5.2 DbContext, change tracking and SaveChanges 🟢 ⭐

> [!term] DbContext
> A session with the database: it holds `DbSet<T>`s, translates LINQ to SQL, **tracks** the entities it loaded, and writes all changes in `SaveChanges`. It's lightweight, **not thread-safe**, and registered as **scoped** (one per request).

**Entity states:** `Added`, `Unchanged`, `Modified`, `Deleted`, `Detached`. When you load an entity with tracking, EF keeps a snapshot; on `SaveChanges` it compares current values to the snapshot (**detect changes**), generates the `INSERT`/`UPDATE`/`DELETE` statements, and runs them **in one transaction**.

```csharp
var invoice = await db.Invoices.SingleAsync(i => i.Id == id, ct);   // tracked
invoice.MarkPaid(clock.UtcNow);                                       // just change the object
await db.SaveChangesAsync(ct);                                        // UPDATE … only the changed columns, in a transaction
```

So `DbContext` already **is** a unit of work and `DbSet` a repository ([[B2.5]]).

> [!mistake] One DbContext shared across threads
> Running two queries on the same context in parallel (`Task.WhenAll` over two awaits on one context) throws "A second operation was started on this context". Await sequentially, use separate contexts (`IDbContextFactory<T>`), or combine the queries.

## B5.3 Modelling 🟢 🟡

Configure with **conventions** first, then the **Fluent API** in `OnModelCreating` (or `IEntityTypeConfiguration<T>` classes) for anything explicit. Data annotations work too, but keep the domain classes cleaner with Fluent configuration.

```csharp
public class InvoiceConfig : IEntityTypeConfiguration<Invoice>
{
    public void Configure(EntityTypeBuilder<Invoice> b)
    {
        b.HasKey(i => i.Id);
        b.Property(i => i.Customer).HasMaxLength(120).IsRequired();
        b.Property(i => i.Amount).HasPrecision(18, 2);        // ⚠ without this, decimals can be truncated
        b.HasIndex(i => new { i.CompanyId, i.DueDate });       // composite index for the common query
        b.HasMany(i => i.Payments).WithOne().HasForeignKey(p => p.InvoiceId).OnDelete(DeleteBehavior.Cascade);
        b.ComplexProperty(i => i.BillingAddress);               // value object stored as columns (table splitting)
        b.Property(i => i.RowVersion).IsRowVersion();           // optimistic concurrency token
    }
}
```

> [!story]
> FinSight hit **EF decimal truncation**: without an explicit precision, EF warns and the provider default (for SQL Server, `decimal(18,2)`) silently rounds values that need more decimal places, such as exchange rates or unit prices. Configuring `HasPrecision` per property, and adding a test that round-trips a value with extra decimals, is a strong "bug I fixed" story.

**Relationships:** one-to-many (`HasMany/WithOne`), one-to-one, and many-to-many with **skip navigations** (EF creates the join table). **Complex types** (value objects without identity) map to columns or, in EF 10, to a JSON column, and are now preferred over owned entities for that job. **Value conversions** store a type differently (an enum as a string, a strongly typed ID as a GUID).

## B5.4 Migrations 🟢 ⭐

```bash
dotnet ef migrations add AddInvoiceDueDateIndex
dotnet ef database update                     # apply locally
dotnet ef migrations script --idempotent -o migrate.sql    # for review and deployment
dotnet ef migrations bundle                   # a self-contained executable that applies migrations
```

- A migration is C# describing **Up** and **Down** changes, plus an updated **model snapshot**.
- **Review the generated SQL**, especially for renames: EF may generate a drop-and-add (which loses data) where you meant a rename.
- **Never edit or delete a migration that has been applied anywhere shared.** Add a new one.
- **Team conflicts:** two developers adding migrations in parallel both change the model snapshot. After merging, remove your unapplied migration, merge the snapshot, and re-add it, or add a new migration on top.
- Apply in deployment through a pipeline step (idempotent script or bundle), not by calling `Database.Migrate()` from several app instances at start-up; use expand-and-contract for zero downtime ([[S10.3]]).

> [!story]
> FinSight had **15 migrations over a 30-table schema** with six people committing. That's enough to talk credibly about snapshot conflicts and about reviewing migration SQL before it ran against the Azure database.

## B5.5 Querying well 🟢 🟡 ⭐

### Tracking vs no-tracking

```csharp
var list = await db.Invoices.AsNoTracking()                  // read-only: no snapshots, less memory, faster
    .Where(i => i.Status == InvoiceStatus.Overdue)
    .OrderBy(i => i.DueDate)
    .Select(i => new InvoiceRowDto(i.Id, i.Customer, i.Amount, i.DueDate))   // projection: only needed columns
    .ToListAsync(ct);
```

- **`AsNoTracking`** for read-only queries: no snapshot, so less memory and CPU. A **projection** with `Select` into a DTO is never tracked anyway, and it fetches only the columns you need. That's the single biggest EF performance habit.
- Track only when you're going to modify and save.

### Loading related data ⭐

| Strategy | How | Queries | Risk |
|---|---|---|---|
| **Eager** | `.Include(i => i.Payments).ThenInclude(p => p.Method)` | One (with JOINs) or split | Cartesian explosion with several collection includes |
| **Explicit** | `await db.Entry(inv).Collection(i => i.Payments).LoadAsync()` | One more, when you ask | — |
| **Lazy** | Navigation loads automatically on first access (proxies or `ILazyLoader`, opt-in) | One per access | **N+1**, hidden queries, can't be async |
| **Projection** | `Select(i => new { …, Paid = i.Payments.Sum(p => p.Amount) })` | One, computed in SQL | — (usually best for reads) |

> [!term] N+1 queries
> Loading a list with one query, then triggering one more query per item to get related data, which is 101 queries for 100 invoices. It usually comes from **lazy loading** or from querying inside a loop. Fix it with `Include`, a projection, or one batched query (`WHERE InvoiceId IN (…)`).

```csharp
// ❌ N+1: a query per invoice inside the loop
foreach (var inv in await db.Invoices.ToListAsync())
    total += await db.Payments.Where(p => p.InvoiceId == inv.Id).SumAsync(p => p.Amount);

// ✅ one query, aggregated in SQL
var totals = await db.Invoices.Select(i => new { i.Id, Paid = i.Payments.Sum(p => p.Amount) }).ToListAsync();
```

### Cartesian explosion and split queries ⭐

Including **two or more collections** in one query (`.Include(c => c.Invoices).Include(c => c.Contacts)`) makes the SQL JOIN multiply rows: 50 invoices × 20 contacts = 1,000 rows per customer, with every column repeated.

```csharp
var customers = await db.Customers
    .Include(c => c.Invoices)
    .Include(c => c.Contacts)
    .AsSplitQuery()                // one SQL query per collection instead of one giant JOIN
    .ToListAsync(ct);
```

Split queries trade one huge result set for several round trips, and the data could change between them (EF 10 fixed an ordering inconsistency in split queries with `Take`). Projections often avoid the problem entirely.

> [!story]
> One of your FinSight commits was an **`AsSplitQuery` performance fix**. Tell it with the mechanism: "the dashboard query included two collections, so the JOIN multiplied rows; switching to a split query, and projecting only what the screen needed, cut the data transferred dramatically."

### Seeing the SQL ⭐

```csharp
options.UseSqlServer(cs)
       .LogTo(Console.WriteLine, LogLevel.Information)
       .EnableSensitiveDataLogging(builder.Environment.IsDevelopment());   // parameter values: dev only
var sql = query.ToQueryString();                                          // inspect a query without running it
```

Look for: `SELECT *`-like column lists (use projections), queries inside loops (N+1), huge JOINs (split or project), and **client evaluation**. EF Core throws if part of a `Where` can't be translated to SQL instead of silently filtering in memory, except in the final `Select`, where untranslatable code runs on the client.

### Bulk operations 🟡 ⭐

Since EF Core 7, `ExecuteUpdate` and `ExecuteDelete` run **one SQL statement** without loading entities:

```csharp
await db.Invoices
    .Where(i => i.Status == InvoiceStatus.Sent && i.DueDate < today)
    .ExecuteUpdateAsync(s => s.SetProperty(i => i.Status, InvoiceStatus.Overdue), ct);   // UPDATE … WHERE …

await db.AuditLogs.Where(a => a.At < cutoff).ExecuteDeleteAsync(ct);                       // DELETE … WHERE …
```

They bypass change tracking (and `SaveChanges` interceptors), so don't mix them with tracked changes to the same rows without care. EF 10 lets the setter be a normal lambda with `if`s, which makes dynamic updates easy.

### Other tools 🟡

- **Raw SQL:** `db.Invoices.FromSql($"SELECT … WHERE Customer = {name}")` is parameterised; `FromSqlRaw` with concatenation is injectable, and EF 10 now **warns** about it ([[S9.3]]).
- **Compiled queries** (`EF.CompileAsyncQuery`) skip translation for very hot queries.
- **`LeftJoin`** and **`RightJoin`** LINQ operators are new in .NET 10 and translated by EF 10.
- **Parameterised collections** (`ids.Contains(x.Id)`): EF 10 now sends each value as its own parameter, padded to limit plan-cache churn.

## B5.6 Global query filters: multi-tenancy and soft delete 🟡 ⭐

A **global query filter** is a `WHERE` condition EF adds automatically to every query on an entity type.

```csharp
public class AppDbContext(DbContextOptions<AppDbContext> options, ITenantContext tenant) : DbContext(options)
{
    protected override void OnModelCreating(ModelBuilder b)
    {
        b.Entity<Invoice>()
            .HasQueryFilter("Tenant", i => i.CompanyId == tenant.CompanyId)     // EF 10: named filters
            .HasQueryFilter("SoftDelete", i => !i.IsDeleted);
    }
}

// An admin report that must include deleted rows, still tenant-scoped:
var all = await db.Invoices.IgnoreQueryFilters(["SoftDelete"]).ToListAsync(ct);
```

Before EF 10 there could be **one** filter per entity, and `IgnoreQueryFilters()` removed all of them at once, which risked dropping tenant isolation just to see deleted rows. **Named filters (EF 10)** fix that.

**Caveats to mention:** filters don't apply to raw SQL you write yourself, or to `ExecuteUpdate`/`ExecuteDelete` unless the query they start from is filtered (it is, if you start from the `DbSet`); a filter that references the context's `tenant` field is evaluated per context instance, so the tenant must be set before querying; and background jobs need their tenant set explicitly ([[B1.11]]).

> [!story]
> FinSight enforced multi-tenancy with a global query filter on the `CompanyId` claim from the JWT, through an `ITenantService`, during your July hardening sweep. A mid-level follow-up you should be ready for: "what stops a developer calling IgnoreQueryFilters?". Good answers: code review and an analyser rule, named filters (EF 10) so only the soft-delete filter can be ignored, and an integration test proving tenant A can't read tenant B.

## B5.7 Transactions, concurrency and interceptors 🟡

- `SaveChanges` is already transactional. For several `SaveChanges` calls, or EF plus Dapper, use an explicit transaction: `await using var tx = await db.Database.BeginTransactionAsync(ct); … await tx.CommitAsync(ct);`.
- With connection resiliency (`EnableRetryOnFailure`), wrap manual transactions in `db.Database.CreateExecutionStrategy().ExecuteAsync(...)`, so a retry replays the whole transaction.
- **Optimistic concurrency:** a `rowversion` (SQL Server) or a version column or `xmin` (PostgreSQL) marked as a concurrency token; catch `DbUpdateConcurrencyException` and return 409 or 412 ([[B4.5]]).
- **Interceptors:** `SaveChangesInterceptor` to set `CreatedAt`, `UpdatedBy` and `CompanyId` automatically and write audit records; `DbCommandInterceptor` to log slow queries.

## B5.8 Dapper on the hot path 🟢

```csharp
await using var conn = new SqlConnection(cs);
var rows = await conn.QueryAsync<OverdueRow>(
    """
    SELECT i.Id, i.Customer, i.Amount, i.DueDate, SUM(p.Amount) AS Paid
    FROM Invoices i LEFT JOIN Payments p ON p.InvoiceId = i.Id
    WHERE i.CompanyId = @companyId AND i.DueDate < @today AND i.IsDeleted = 0
    GROUP BY i.Id, i.Customer, i.Amount, i.DueDate
    """,
    new { companyId, today });
```

Remember that **global filters don't apply** here: the tenant and soft-delete conditions must be written by hand, and tested.

## B5.9 Testing data access 🟡 ⭐

| Option | Verdict |
|---|---|
| EF **InMemory** provider | **Avoid** for anything that matters: it isn't relational (no SQL translation, no constraints, no transactions), so tests pass that would fail on a real database |
| **SQLite in-memory** | Real SQL, fast, but a different database dialect from production |
| **Testcontainers** with the real engine (SQL Server, PostgreSQL in Docker) | **Best fidelity**; seconds to start; the modern default for integration tests ([[B10]]) |
| Mocking `DbContext` | Brittle; mock your own repository or service interface instead, if anything |

> [!lab] See the SQL, then fix it
> Turn on `LogTo` in one FinSight-like project. (1) Write an N+1 loop and count the queries; fix it with a projection. (2) Include two collections and look at the row count; add `AsSplitQuery` and compare. (3) Convert a "load, change, save" bulk status update to `ExecuteUpdateAsync`. (4) Add a named tenant filter and write a Testcontainers test that proves tenant B's invoices are invisible to tenant A.

## B5.10 Interview drill 🟢 ⭐

| Question | Strong short answer |
|---|---|
| EF Core vs Dapper vs ADO.NET? | ADO.NET is raw and fastest; Dapper maps your SQL to objects with little overhead; EF Core adds LINQ, change tracking and migrations for productivity. |
| What does DbContext do, and what lifetime? | A unit of work that tracks entities and translates LINQ; scoped per request and not thread-safe. |
| What does AsNoTracking do? | Skips change-tracking snapshots for read-only queries, saving memory and CPU. |
| Eager vs lazy vs explicit loading? | Include up front / automatically on first access / on demand via Entry().Load. |
| What is the N+1 problem? | One query for a list plus one per item; fix with Include, projection or a batched query. |
| What is cartesian explosion? | Multiple collection includes multiplying JOIN rows; fix with AsSplitQuery or projection. |
| Is SaveChanges transactional? | Yes, all tracked changes are saved in one transaction. |
| How do you do bulk updates efficiently? | ExecuteUpdateAsync or ExecuteDeleteAsync: one SQL statement, no entities loaded. |
| What are global query filters for? | Automatic WHERE conditions such as tenant ID and soft delete; EF 10 adds named filters you can ignore selectively. |
| How do you handle concurrency in EF? | A rowversion or version concurrency token; catch DbUpdateConcurrencyException and return 409 or 412. |
| How do migrations work with a team? | Each change is a migration plus a snapshot; resolve snapshot conflicts by re-adding unapplied migrations; never edit applied ones; deploy via scripts or bundles. |
| Why did your decimals get truncated? | No precision configured; set HasPrecision on decimal properties. |
| How do you test EF code? | Integration tests against a real engine with Testcontainers; avoid the InMemory provider. |
| FromSql vs FromSqlRaw? | FromSql parameterises interpolated values; FromSqlRaw with concatenation is injectable. |

## Key takeaways

> [!check]
> - Project to DTOs with `AsNoTracking` for reads; track only what you'll save.
> - Kill N+1 with Include or projections; kill cartesian explosion with split queries.
> - Bulk changes go through ExecuteUpdate and ExecuteDelete.
> - Global (and in EF 10, named) query filters enforce tenancy, but test them.
> - Measure, then choose: EF Core by default, Dapper for proven hot paths.

## Sources

- Microsoft Learn (EF Core 10): [What's new in EF Core 10](https://learn.microsoft.com/en-us/ef/core/what-is-new/ef-core-10.0/whatsnew), [Change tracking](https://learn.microsoft.com/en-us/ef/core/change-tracking/), [Tracking vs no-tracking queries](https://learn.microsoft.com/en-us/ef/core/querying/tracking), [Loading related data](https://learn.microsoft.com/en-us/ef/core/querying/related-data/), [Single vs split queries](https://learn.microsoft.com/en-us/ef/core/querying/single-split-queries), [ExecuteUpdate and ExecuteDelete](https://learn.microsoft.com/en-us/ef/core/saving/execute-insert-update-delete), [Global query filters](https://learn.microsoft.com/en-us/ef/core/querying/filters), [Migrations overview](https://learn.microsoft.com/en-us/ef/core/managing-schemas/migrations/), [Handling concurrency conflicts](https://learn.microsoft.com/en-us/ef/core/saving/concurrency), [Interceptors](https://learn.microsoft.com/en-us/ef/core/logging-events-diagnostics/interceptors), [Testing strategy](https://learn.microsoft.com/en-us/ef/core/testing/choosing-a-testing-strategy), [Efficient querying](https://learn.microsoft.com/en-us/ef/core/performance/efficient-querying).
- [Dapper on GitHub](https://github.com/DapperLib/Dapper) · [BenchmarkDotNet](https://benchmarkdotnet.org/) · [Testcontainers for .NET](https://dotnet.testcontainers.org/).
