# EF Core and Data Access — Tracking, Loading, N+1, Migrations and When to Use Dapper

Most .NET backend bugs that reach production are data-access bugs: a query that loads the whole table, an N+1 loop, a "cartesian explosion", a missing tenant filter, a decimal silently truncated. You've met several of these for real in FinSight (you fixed an `AsSplitQuery` performance issue and EF decimal truncation, and enforced multi-tenancy with global query filters), and you **benchmarked** ADO.NET, Dapper and EF Core. That gives you stories few juniors have. This module targets **EF Core 10** (November 2025, LTS until November 2028).

> [!focus]
> **Entry must:** what an ORM does; DbContext lifetime and change tracking; LINQ to SQL translation; Include and projections; migrations; AsNoTracking; transactions via SaveChanges.
> **Mid adds:** N+1 and cartesian explosion (split queries), bulk ExecuteUpdate and ExecuteDelete, global and named query filters, concurrency tokens, interceptors, compiled queries, reading generated SQL, choosing Dapper for hot paths, testing with real databases.
> **Most asked:** *EF Core vs Dapper vs ADO.NET?* · *What is the N+1 problem?* · *Lazy vs eager vs explicit loading?* · *What does AsNoTracking do?* · *How do migrations work in a team?* · *How do you handle concurrency?* · *How do you implement soft delete or multi-tenancy?*
> **Time budget:** 4 hours, with a SQLite or SQL Server project and SQL logging turned on.

## B5.0 Foundations: what an ORM is solving 🟢

Your C# code works with **objects**: an invoice *has* a customer (a reference) and *has* payments (a list). A relational database stores **rows in tables** linked by **foreign keys**. The two shapes don't match: objects have identity, references and inheritance; tables have keys, joins and no nesting. This gap is called the **object–relational mismatch**.

<figure class="dia"><svg viewBox="0 0 720 240" role="img" aria-label="The same invoice as an object graph with a customer reference and a list of payments, and as rows in three tables linked by foreign keys">
<text class="sT" x="170" y="22" text-anchor="middle">objects in memory</text><text class="sT" x="540" y="22" text-anchor="middle">rows in tables</text>
<rect class="sA" x="70" y="40" width="200" height="70" rx="10"/><text class="sT" x="170" y="60" text-anchor="middle">Invoice</text><text class="sC" x="170" y="78" text-anchor="middle">Customer → (a reference)</text><text class="sC" x="170" y="96" text-anchor="middle">Payments → List&lt;Payment&gt;</text>
<rect class="sB" x="20" y="150" width="140" height="46" rx="8"/><text class="sT" x="90" y="172" text-anchor="middle">Customer</text><text class="sC" x="90" y="188" text-anchor="middle">"Nile Foods"</text>
<rect class="sG" x="180" y="140" width="140" height="30" rx="6"/><text class="sC" x="250" y="160" text-anchor="middle">Payment 300</text><rect class="sG" x="180" y="176" width="140" height="30" rx="6"/><text class="sC" x="250" y="196" text-anchor="middle">Payment 600</text>
<line class="sL" x1="130" y1="110" x2="100" y2="148" marker-end="url(#ah)"/><line class="sL" x1="220" y1="110" x2="240" y2="138" marker-end="url(#ah)"/>
<line class="sD" x1="360" y1="12" x2="360" y2="222"/>
<text class="sM" x="390" y="34">Invoices</text><rect class="sA" x="390" y="40" width="300" height="38" rx="4"/><text class="sC" x="396" y="54">Id</text><text class="sC" x="496" y="54">CustomerId</text><text class="sC" x="596" y="54">Total</text><text class="sC" x="396" y="72">7</text><text class="sC" x="496" y="72">31</text><text class="sC" x="596" y="72">900</text>
<text class="sM" x="390" y="98">Customers</text><rect class="sB" x="390" y="104" width="300" height="38" rx="4"/><text class="sC" x="396" y="118">Id</text><text class="sC" x="546" y="118">Name</text><text class="sC" x="396" y="136">31</text><text class="sC" x="546" y="136">Nile Foods</text>
<text class="sM" x="390" y="160">Payments</text><rect class="sG" x="390" y="166" width="300" height="56" rx="4"/><text class="sC" x="396" y="180">Id</text><text class="sC" x="496" y="180">InvoiceId</text><text class="sC" x="596" y="180">Amount</text><text class="sC" x="396" y="198">1</text><text class="sC" x="496" y="198">7</text><text class="sC" x="596" y="198">300</text><text class="sC" x="396" y="216">2</text><text class="sC" x="496" y="216">7</text><text class="sC" x="596" y="216">600</text>
<text class="sC" x="706" y="232" text-anchor="end">references → foreign keys; lists → child rows</text>
</svg><figcaption>The object–relational mismatch. An ORM translates between the two shapes in both directions.</figcaption></figure>

An **ORM** (object–relational mapper) such as EF Core bridges it:

- **Mapping:** classes to tables, properties to columns, references to foreign keys, collections to child tables.
- **Querying:** LINQ is translated into SQL ([[B5.5]]), and result rows are **materialised** back into objects.
- **Identity:** within one `DbContext`, the same row is always the same object (the **identity map**), so two queries for invoice 7 return one instance.
- **Change tracking and saving:** it remembers what it loaded and writes only what changed ([[B5.2]]).
- **Schema evolution:** migrations keep the database in step with the classes ([[B5.4]]).

None of that removes the database. Every rule in this module is about seeing the SQL the ORM produces and keeping it efficient.

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

<figure class="dia steps" data-start="1"><svg viewBox="0 0 720 222" role="img" aria-label="Change tracking: EF stores a snapshot when loading, the code changes a property, SaveChanges detects the difference and sends one UPDATE for that column in a transaction">
<rect class="sB" x="20" y="30" width="260" height="130" rx="10"/><text class="sT" x="150" y="52" text-anchor="middle">Invoice 7 (in memory)</text>
<rect class="sV" x="400" y="30" width="300" height="130" rx="10"/><text class="sT" x="550" y="52" text-anchor="middle">DbContext change tracker</text>
<g data-s="1-1"><text class="sM" x="150" y="84" text-anchor="middle">Status = Sent</text><text class="sM" x="150" y="104" text-anchor="middle">Paid = 0</text><text class="sC" x="550" y="84" text-anchor="middle">snapshot: Sent · 0</text><rect class="sG" x="470" y="110" width="160" height="26" rx="6"/><text class="sC" x="550" y="128" text-anchor="middle">Unchanged</text></g>
<g data-s="2-3"><text class="sWt" x="150" y="84" text-anchor="middle">Status = Paid</text><text class="sM" x="150" y="104" text-anchor="middle">Paid = 0</text><text class="sC" x="550" y="84" text-anchor="middle">snapshot: Sent · 0</text></g>
<g data-s="2-2"><rect class="sG" x="470" y="110" width="160" height="26" rx="6"/><text class="sC" x="550" y="128" text-anchor="middle">still Unchanged</text><text class="sC" x="150" y="140" text-anchor="middle">invoice.MarkPaid(now)</text></g>
<g data-s="3-3"><rect class="sW" x="470" y="110" width="160" height="26" rx="6"/><text class="sC" x="550" y="128" text-anchor="middle">Modified: Status</text><text class="sC" x="550" y="150" text-anchor="middle">DetectChanges compared</text></g>
<g data-s="4-4"><rect class="sA" x="20" y="178" width="680" height="34" rx="8"/><text class="sC" x="32" y="200" xml:space="preserve" style="white-space:pre">BEGIN; UPDATE Invoices SET Status = @p0 WHERE Id = @p1; COMMIT;</text><text class="sM" x="150" y="84" text-anchor="middle">Status = Paid</text><text class="sC" x="550" y="84" text-anchor="middle">snapshot: Paid · 0</text><rect class="sG" x="470" y="110" width="160" height="26" rx="6"/><text class="sC" x="550" y="128" text-anchor="middle">Unchanged again</text></g>
</svg><ol class="dia-steps">
<li>A tracked query loads invoice 7 and EF keeps a snapshot of its original values.</li>
<li>Your code just changes the object. No SQL is sent; EF doesn't even know yet.</li>
<li>On <code>SaveChanges</code>, EF compares each tracked entity with its snapshot (DetectChanges) and finds that only <code>Status</code> differs.</li>
<li>It sends one UPDATE for just that column, inside a transaction, then refreshes the snapshot. With <code>AsNoTracking</code> none of this bookkeeping happens, which is why read-only queries should use it.</li>
</ol><figcaption>How EF Core knows what to save. Tracking costs memory and CPU, so only track what you will modify.</figcaption></figure>

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

<figure class="dia"><svg viewBox="0 0 720 344" role="img" aria-label="Each Fluent API call in the configuration and the SQL it produces: the key becomes an identity primary key, max length becomes nvarchar 120, precision becomes decimal 18,2, the row version becomes a rowversion column, the complex property becomes BillingAddress_City and BillingAddress_Street columns, the relationship becomes a cascading foreign key on the Payment table, and the composite index becomes CREATE INDEX on CompanyId and DueDate">
<rect class="sN" x="322" y="6" width="392" height="314" rx="8"/>
<text class="sS" x="330" y="24" xml:space="preserve" style="white-space:pre">CREATE TABLE [Invoices] (</text>
<text class="sS" x="330" y="38.2" xml:space="preserve" style="white-space:pre">  [Id] int NOT NULL IDENTITY,</text>
<text class="sS" x="330" y="52.4" xml:space="preserve" style="white-space:pre">  [CompanyId] int NOT NULL,</text>
<text class="sS" x="330" y="66.6" xml:space="preserve" style="white-space:pre">  [Customer] nvarchar(120) NOT NULL,</text>
<text class="sS" x="330" y="80.8" xml:space="preserve" style="white-space:pre">  [Amount] decimal(18,2) NOT NULL,</text>
<text class="sS" x="330" y="95" xml:space="preserve" style="white-space:pre">  [DueDate] datetime2 NOT NULL,</text>
<text class="sS" x="330" y="109.2" xml:space="preserve" style="white-space:pre">  [RowVersion] rowversion NOT NULL,</text>
<text class="sS" x="330" y="123.4" xml:space="preserve" style="white-space:pre">  [BillingAddress_City] nvarchar(max) NOT NULL,</text>
<text class="sS" x="330" y="137.6" xml:space="preserve" style="white-space:pre">  [BillingAddress_Street] nvarchar(max) NOT NULL,</text>
<text class="sS" x="330" y="151.8" xml:space="preserve" style="white-space:pre">  CONSTRAINT [PK_Invoices] PRIMARY KEY ([Id])</text>
<text class="sS" x="330" y="166" xml:space="preserve" style="white-space:pre">);</text>
<text class="sS" x="330" y="180.2" xml:space="preserve" style="white-space:pre">CREATE TABLE [Payment] (</text>
<text class="sS" x="330" y="194.4" xml:space="preserve" style="white-space:pre">  [Id] int NOT NULL IDENTITY,</text>
<text class="sS" x="330" y="208.6" xml:space="preserve" style="white-space:pre">  [InvoiceId] int NOT NULL,</text>
<text class="sS" x="330" y="222.8" xml:space="preserve" style="white-space:pre">  [Amount] decimal(18,2) NOT NULL,</text>
<text class="sS" x="330" y="237" xml:space="preserve" style="white-space:pre">  CONSTRAINT [PK_Payment] PRIMARY KEY ([Id]),</text>
<text class="sS" x="330" y="251.2" xml:space="preserve" style="white-space:pre">  CONSTRAINT [FK_Payment_Invoices_InvoiceId] FOREIGN KEY ([…</text>
<text class="sS" x="330" y="265.4" xml:space="preserve" style="white-space:pre">    REFERENCES [Invoices] ([Id]) ON DELETE CASCADE</text>
<text class="sS" x="330" y="279.6" xml:space="preserve" style="white-space:pre">);</text>
<text class="sS" x="330" y="293.8" xml:space="preserve" style="white-space:pre">CREATE INDEX [IX_Invoices_CompanyId_DueDate]</text>
<text class="sS" x="330" y="308" xml:space="preserve" style="white-space:pre">    ON [Invoices] ([CompanyId], [DueDate]);</text>
<rect class="sB" x="10" y="12" width="266" height="26" rx="6" opacity=".5"/><text class="sS" x="18" y="30" xml:space="preserve" style="white-space:pre">HasKey(i =&gt; i.Id)</text>
<path class="sLm" d="M 278 26 C 300 26 300 34.2 320 34.2" marker-end="url(#ahm)" style="fill:none"/>
<rect class="sB" x="10" y="50" width="266" height="26" rx="6" opacity=".5"/><text class="sS" x="18" y="68" xml:space="preserve" style="white-space:pre">Customer: HasMaxLength(120).IsRequired()</text>
<path class="sLv" d="M 278 64 C 300 64 300 62.599999999999994 320 62.599999999999994" marker-end="url(#ahm)" style="fill:none"/>
<rect class="sB" x="10" y="88" width="266" height="26" rx="6" opacity=".5"/><text class="sS" x="18" y="106" xml:space="preserve" style="white-space:pre">Amount: HasPrecision(18, 2)</text>
<path class="sLg" d="M 278 102 C 300 102 300 76.8 320 76.8" marker-end="url(#ahm)" style="fill:none"/>
<rect class="sB" x="10" y="126" width="266" height="26" rx="6" opacity=".5"/><text class="sS" x="18" y="144" xml:space="preserve" style="white-space:pre">RowVersion: IsRowVersion()</text>
<path class="sLm" d="M 278 140 C 300 140 300 105.19999999999999 320 105.19999999999999" marker-end="url(#ahm)" style="fill:none"/>
<rect class="sB" x="10" y="164" width="266" height="26" rx="6" opacity=".5"/><text class="sS" x="18" y="182" xml:space="preserve" style="white-space:pre">ComplexProperty(i =&gt; i.BillingAddress)</text>
<path class="sLv" d="M 278 178 C 300 178 300 119.39999999999999 320 119.39999999999999" marker-end="url(#ahm)" style="fill:none"/>
<rect class="sB" x="10" y="202" width="266" height="26" rx="6" opacity=".5"/><text class="sS" x="18" y="220" xml:space="preserve" style="white-space:pre">HasMany(Payments)…OnDelete(Cascade)</text>
<path class="sLw" d="M 278 216 C 300 216 300 261.4 320 261.4" marker-end="url(#ahm)" style="fill:none"/>
<rect class="sB" x="10" y="240" width="266" height="26" rx="6" opacity=".5"/><text class="sS" x="18" y="258" xml:space="preserve" style="white-space:pre">HasIndex(i =&gt; new { CompanyId, DueDate })</text>
<path class="sLg" d="M 278 254 C 300 254 300 289.8 320 289.8" marker-end="url(#ahm)" style="fill:none"/>
<text class="sS" x="143" y="338" text-anchor="middle">Fluent configuration</text><text class="sS" x="518" y="338" text-anchor="middle">SQL Server DDL that EF Core generates</text>
</svg><figcaption>The configuration above, fed to EF Core's GenerateCreateScript() for SQL Server: every Fluent call has a visible effect on the schema.</figcaption></figure>

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

<figure class="dia"><svg viewBox="0 0 720 188" role="img" aria-label="A LINQ query becomes an expression tree that EF Core translates into SQL selecting only the projected columns">
<rect class="sA" x="14" y="30" width="230" height="120" rx="8"/><text class="sT" x="129" y="48" text-anchor="middle">C# (LINQ)</text>
<text class="sC" x="22" y="66" xml:space="preserve" style="white-space:pre">db.Invoices</text>
<text class="sC" x="22" y="80" xml:space="preserve" style="white-space:pre">  .Where(i =&gt; i.Status</text>
<text class="sC" x="22" y="94" xml:space="preserve" style="white-space:pre">        == Overdue)</text>
<text class="sC" x="22" y="108" xml:space="preserve" style="white-space:pre">  .OrderBy(i =&gt; i.DueDate)</text>
<text class="sC" x="22" y="122" xml:space="preserve" style="white-space:pre">  .Select(i =&gt; new { i.Id,</text>
<text class="sC" x="22" y="136" xml:space="preserve" style="white-space:pre">      i.Customer })</text>
<line class="sLm" x1="244" y1="90" x2="270" y2="90" marker-end="url(#ahm)"/>
<rect class="sV" x="274" y="30" width="170" height="120" rx="8"/><text class="sT" x="359" y="48" text-anchor="middle">expression tree</text>
<text class="sC" x="359" y="68" text-anchor="middle">Select</text>
<text class="sC" x="359" y="92" text-anchor="middle">OrderBy</text>
<text class="sC" x="359" y="116" text-anchor="middle">Where</text>
<text class="sC" x="359" y="138" text-anchor="middle">Status == Overdue</text>
<line class="sLm" x1="444" y1="90" x2="470" y2="90" marker-end="url(#ahm)"/>
<rect class="sG" x="474" y="30" width="232" height="120" rx="8"/><text class="sT" x="590" y="48" text-anchor="middle">SQL</text>
<text class="sC" x="482" y="70" xml:space="preserve" style="white-space:pre">SELECT i.Id, i.Customer</text>
<text class="sC" x="482" y="88" xml:space="preserve" style="white-space:pre">FROM Invoices AS i</text>
<text class="sC" x="482" y="106" xml:space="preserve" style="white-space:pre">WHERE i.Status = 2</text>
<text class="sC" x="482" y="124" xml:space="preserve" style="white-space:pre">ORDER BY i.DueDate</text>
<text class="sS" x="360" y="176" text-anchor="middle">the lambda is data, not compiled code: the provider reads it and writes SQL</text>
</svg><figcaption>Translation, step by step. Anything EF can't express in SQL inside <code>Where</code> throws, rather than silently loading the table.</figcaption></figure>

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

<figure class="dia"><svg viewBox="0 0 720 152" role="img" aria-label="N+1 queries: one query for the list and one hundred more, one per item, compared with a single query">
<text class="sT" x="130" y="44" text-anchor="end">N+1</text>
<rect class="sA" x="140" y="32" width="40" height="20" rx="3"/><text class="sC" x="160" y="46" text-anchor="middle">1</text>
<rect class="sR" x="184" y="32" width="22" height="20" rx="3" opacity=".8"/>
<rect class="sR" x="210" y="32" width="22" height="20" rx="3" opacity=".8"/>
<rect class="sR" x="236" y="32" width="22" height="20" rx="3" opacity=".8"/>
<rect class="sR" x="262" y="32" width="22" height="20" rx="3" opacity=".8"/>
<rect class="sR" x="288" y="32" width="22" height="20" rx="3" opacity=".8"/>
<rect class="sR" x="314" y="32" width="22" height="20" rx="3" opacity=".8"/>
<rect class="sR" x="340" y="32" width="22" height="20" rx="3" opacity=".8"/>
<rect class="sR" x="366" y="32" width="22" height="20" rx="3" opacity=".8"/>
<rect class="sR" x="392" y="32" width="22" height="20" rx="3" opacity=".8"/>
<rect class="sR" x="418" y="32" width="22" height="20" rx="3" opacity=".8"/>
<rect class="sR" x="444" y="32" width="22" height="20" rx="3" opacity=".8"/>
<rect class="sR" x="470" y="32" width="22" height="20" rx="3" opacity=".8"/>
<rect class="sR" x="496" y="32" width="22" height="20" rx="3" opacity=".8"/>
<rect class="sR" x="522" y="32" width="22" height="20" rx="3" opacity=".8"/>
<rect class="sR" x="548" y="32" width="22" height="20" rx="3" opacity=".8"/>
<rect class="sR" x="574" y="32" width="22" height="20" rx="3" opacity=".8"/>
<rect class="sR" x="600" y="32" width="22" height="20" rx="3" opacity=".8"/>
<rect class="sR" x="626" y="32" width="22" height="20" rx="3" opacity=".8"/>
<text class="sRt" x="658" y="46">… ×100</text>
<text class="sT" x="130" y="96" text-anchor="end">one query</text><rect class="sG" x="140" y="84" width="70" height="20" rx="3"/><text class="sC" x="175" y="98" text-anchor="middle">1</text><text class="sGt" x="220" y="98">with JOIN or a projection</text>
<text class="sS" x="360" y="140" text-anchor="middle">each query costs a round trip (~0.5–1 ms in a data centre, far more across regions): 101 trips vs 1</text>
</svg><figcaption>N+1 is a round-trip problem. Each query may be fast; a hundred of them in sequence are not.</figcaption></figure>

```csharp
// ❌ N+1: a query per invoice inside the loop
foreach (var inv in await db.Invoices.ToListAsync())
    total += await db.Payments.Where(p => p.InvoiceId == inv.Id).SumAsync(p => p.Amount);

// ✅ one query, aggregated in SQL
var totals = await db.Invoices.Select(i => new { i.Id, Paid = i.Payments.Sum(p => p.Amount) }).ToListAsync();
```

### Cartesian explosion and split queries ⭐

Including **two or more collections** in one query (`.Include(c => c.Invoices).Include(c => c.Contacts)`) makes the SQL JOIN multiply rows: 50 invoices × 20 contacts = 1,000 rows per customer, with every column repeated.

<figure class="dia"><svg viewBox="0 0 720 216" role="img" aria-label="Including two collections in one query multiplies rows; a split query sends three queries with no duplicated data">
<text class="sT" x="180" y="22" text-anchor="middle">one query with two Includes</text><text class="sT" x="540" y="22" text-anchor="middle">AsSplitQuery()</text>
<rect class="sW" x="30" y="34" width="300" height="22" rx="4" opacity=".75"/><text class="sC" x="40" y="49">Nile · INV-1 · Mona</text>
<rect class="sR" x="30" y="60" width="300" height="22" rx="4" opacity=".75"/><text class="sC" x="40" y="75">Nile · INV-1 · Omar</text>
<rect class="sR" x="30" y="86" width="300" height="22" rx="4" opacity=".75"/><text class="sC" x="40" y="101">Nile · INV-2 · Mona</text>
<rect class="sR" x="30" y="112" width="300" height="22" rx="4" opacity=".75"/><text class="sC" x="40" y="127">Nile · INV-2 · Omar</text>
<rect class="sR" x="30" y="138" width="300" height="22" rx="4" opacity=".75"/><text class="sC" x="40" y="153">Nile · INV-3 · Mona</text>
<rect class="sR" x="30" y="164" width="300" height="22" rx="4" opacity=".75"/><text class="sC" x="40" y="179">Nile · INV-3 · Omar</text>
<text class="sRt" x="180" y="206" text-anchor="middle">3 invoices × 2 contacts = 6 rows, customer repeated</text>
<line class="sD" x1="360" y1="12" x2="360" y2="216"/>
<text class="sM" x="390" y="48">Customers</text>
<rect class="sB" x="484" y="34" width="70" height="22" rx="4"/><text class="sC" x="519" y="49" text-anchor="middle">Nile Foods</text>
<text class="sM" x="390" y="98">Invoices</text>
<rect class="sA" x="484" y="84" width="70" height="22" rx="4"/><text class="sC" x="519" y="99" text-anchor="middle">INV-1</text>
<rect class="sA" x="558" y="84" width="70" height="22" rx="4"/><text class="sC" x="593" y="99" text-anchor="middle">INV-2</text>
<rect class="sA" x="632" y="84" width="70" height="22" rx="4"/><text class="sC" x="667" y="99" text-anchor="middle">INV-3</text>
<text class="sM" x="390" y="148">Contacts</text>
<rect class="sG" x="484" y="134" width="70" height="22" rx="4"/><text class="sC" x="519" y="149" text-anchor="middle">Mona</text>
<rect class="sG" x="558" y="134" width="70" height="22" rx="4"/><text class="sC" x="593" y="149" text-anchor="middle">Omar</text>
<text class="sGt" x="540" y="206" text-anchor="middle">3 queries, 6 rows total, no duplication</text>
</svg><figcaption>Cartesian explosion. With real numbers (50 invoices × 20 contacts) one customer becomes 1,000 wide rows.</figcaption></figure>

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

<figure class="dia"><svg viewBox="0 0 720 140" role="img" aria-label="A simple LINQ query gets tenant and soft-delete conditions added automatically by global query filters">
<rect class="sA" x="14" y="30" width="300" height="60" rx="8"/><text class="sC" x="24" y="54" xml:space="preserve" style="white-space:pre">db.Invoices</text><text class="sC" x="24" y="74" xml:space="preserve" style="white-space:pre">  .Where(i =&gt; i.Status == Overdue)</text>
<line class="sLm" x1="314" y1="60" x2="344" y2="60" marker-end="url(#ahm)"/><rect class="sV" x="348" y="22" width="360" height="84" rx="8"/>
<text class="sC" x="356" y="42" xml:space="preserve" style="white-space:pre">SELECT … FROM Invoices AS i</text>
<text class="sC" x="356" y="60" xml:space="preserve" style="white-space:pre">WHERE i.CompanyId = @tenant   -- "Tenant" filter</text>
<text class="sC" x="356" y="78" xml:space="preserve" style="white-space:pre">  AND i.IsDeleted = 0         -- "SoftDelete" filter</text>
<text class="sC" x="356" y="96" xml:space="preserve" style="white-space:pre">  AND i.Status = 2</text>
<text class="sS" x="360" y="128" text-anchor="middle">added to every query on Invoice, including Includes and navigations, unless explicitly ignored by name</text>
</svg><figcaption>Global query filters make the safe thing automatic: a developer can't forget the tenant condition, because they never write it.</figcaption></figure>

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
