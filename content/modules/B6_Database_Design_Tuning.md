# Database Design and Tuning — Normalisation, Indexes, Plans, Isolation and Locks

Backend interviews at mid level move from "write a query" to "why is this query slow?" and "what happens when two requests update the same row?". This module covers the database side of the backend: designing tables that stay correct, indexing for real queries, reading an execution plan, choosing an isolation level, and avoiding deadlocks. It builds on [[S3]] and [[B5]].

> [!focus]
> **Entry must:** normalise to third normal form and explain why; choose primary keys and constraints; explain clustered vs non-clustered indexes and when an index helps; explain ACID.
> **Mid adds:** composite and covering indexes, sargable predicates, reading execution plans, isolation levels and the anomalies each prevents, deadlocks, GUID vs integer keys, SQL vs NoSQL, partitioning and replicas.
> **Most asked:** *What is normalisation?* · *Clustered vs non-clustered index?* · *How do you find and fix a slow query?* · *What are isolation levels?* · *What is a deadlock?* · *When would you choose NoSQL?* · *GUID or int as primary key?*
> **Time budget:** 4 hours.

## B6.1 Normalisation 🟢 ⭐

> [!term] Normalisation
> Organising tables so that **each fact is stored once**, removing redundancy that causes **update, insert and delete anomalies** (changing a customer's city in one row but not another; being unable to add a product until someone orders it).

| Form | Rule (informally) | Violation example | Fix |
|---|---|---|---|
| **1NF** | Atomic values; no repeating groups | `phones = "0100…, 0112…"` in one column | A `customer_phones` table |
| **2NF** | 1NF, and every non-key column depends on the **whole** key | In `order_items(order_id, product_id, product_name, qty)`, `product_name` depends only on `product_id` | Move `product_name` to `products` |
| **3NF** | 2NF, and non-key columns depend **only on the key**, not on other non-key columns | `orders(order_id, customer_id, customer_city)`: city depends on the customer | Keep city in `customers` |
| BCNF | Every determinant is a candidate key | Rare in practice | — |

The mnemonic for 3NF: every column depends on "the key, the whole key, and nothing but the key".

**Denormalisation** deliberately duplicates data for **read speed**: a cached `total_paid` on invoices, a reporting table, a search index. It's a trade-off: faster reads, but you must keep copies in sync (a transaction, a trigger, or an event). Analytics warehouses denormalise heavily on purpose ([[DE2]]).

> [!say]
> "I normalise transactional schemas to third normal form so each fact lives in one place and updates can't leave contradictions. I denormalise only for measured read-performance needs, such as a cached total or a reporting table, and make sure there's one mechanism that keeps the copy in sync."

## B6.2 Keys and constraints 🟢 ⭐

**Natural vs surrogate keys.** A natural key comes from the data (national ID, email); a surrogate key is generated (an identity integer, a GUID). Natural keys change and leak information, so use a **surrogate primary key** and put a **unique constraint** on the natural key.

**Integer identity vs GUID:**

| | `int`/`bigint` identity | Random GUID (v4) | Sequential GUID (v7, `Guid.CreateVersion7()` in .NET 9+) |
|---|---|---|---|
| Size | 4 or 8 bytes | 16 bytes | 16 bytes |
| Generated | By the database, on insert | Anywhere: the client, offline, before saving | Anywhere, **time-ordered** |
| Clustered-index inserts | Append at the end: fast | **Random positions**: page splits and fragmentation | Mostly appended: good |
| Guessable / leaks volume | Yes (`/invoices/1043`) | No | Reveals creation time roughly |
| Merging data across databases | Conflicts | No conflicts | No conflicts |

**Let the database enforce rules:** `PRIMARY KEY`, `FOREIGN KEY`, `UNIQUE`, `NOT NULL`, `CHECK (amount > 0)`, `DEFAULT`. Application validation can be bypassed (a script, a bug, another service); constraints can't. A unique index is also the only race-free way to guarantee "no two users with the same email".

**Data types that matter:** `decimal(18,2)` or larger for money, never `float`; `datetime2` or `datetimeoffset` in SQL Server (store UTC); `nvarchar` for text that may contain Arabic (in SQL Server, `varchar` can't hold it unless a UTF-8 collation is used); the smallest type that fits.

## B6.3 How indexes work 🟢 🟡 ⭐

A **B-tree index** keeps keys sorted in a balanced tree, so finding a value takes a handful of page reads (O(log n)) instead of scanning the table.

| | Clustered index | Non-clustered index |
|---|---|---|
| What it is | The table's rows **stored in key order**: the leaf level *is* the data | A separate sorted structure of key columns plus a pointer to the row |
| How many | **One** per table (SQL Server; by default the primary key) | Many |
| Lookup | Finds the row directly | Finds the key, then may need a **key lookup** into the clustered index for other columns |

PostgreSQL tables are **heaps** (no clustered index by default; `CLUSTER` reorders once), and every index points to row locations.

**Composite index column order** follows the **leftmost-prefix** rule. An index on `(company_id, status, due_date)` serves:

- `WHERE company_id = @c` ✓
- `WHERE company_id = @c AND status = 'overdue'` ✓
- `WHERE company_id = @c AND status = 'overdue' AND due_date < @d` ✓ (equality columns first, then the range)
- `WHERE status = 'overdue'` ✗ (the leading column is missing)

> [!term] Covering index
> An index that contains **every column a query needs**, so the database answers from the index alone without touching the table (no key lookups). In SQL Server: `CREATE INDEX IX_Inv ON Invoices(CompanyId, DueDate) INCLUDE (Customer, Amount);` PostgreSQL has `INCLUDE` too, and calls the result an **index-only scan**.

> [!term] Selectivity
> How well a value narrows down rows. An index on `status` with three values isn't very selective, and the optimiser may prefer a scan. An index on `email` is highly selective. Put selective, equality-filtered columns first.

**When indexes hurt:** every insert, update and delete maintains every index, so write-heavy tables need few indexes; unused indexes waste storage and memory; duplicate and overlapping indexes are common in older databases.

**Other kinds:** **filtered/partial** indexes (`WHERE is_deleted = 0`), **unique** indexes, full-text indexes, **columnstore** indexes for analytics (column-wise storage, huge compression, [[DE5]]), GIN indexes in PostgreSQL for JSONB and arrays.

> [!say]
> "A clustered index is the table itself stored in key order, so there's one per table; non-clustered indexes are separate sorted structures pointing back to rows. For a query filtering on company and status and sorting by due date, I'd create a composite index in that order, equality columns first, and INCLUDE the selected columns so it's covering and avoids key lookups."

## B6.4 Finding and fixing slow queries 🟡 ⭐

**The routine:**

1. **Find** the slow queries: Application Insights or APM dependency timings, SQL Server **Query Store**, `pg_stat_statements` in PostgreSQL, the EF Core slow-query log.
2. **Get the actual plan:** `EXPLAIN (ANALYZE, BUFFERS)` in PostgreSQL; "Include Actual Execution Plan" or `SET STATISTICS IO, TIME ON` in SQL Server.
3. **Read it** for: **scans** on large tables where you expected **seeks**; **key lookups** repeated thousands of times; big differences between **estimated and actual rows** (stale statistics or parameter sniffing); expensive **sorts** and **hash** operations spilling to disk; implicit conversions.
4. **Fix** (most to least common): rewrite the predicate to be sargable, add or adjust an index (composite order, INCLUDE), select fewer columns, update statistics, paginate with keyset, cache the result.

> [!term] Sargable
> A predicate the engine can answer with an index seek (from "Search ARGument ABLE"). Wrapping the **column** in a function or arithmetic usually makes it non-sargable.

| Non-sargable | Sargable rewrite |
|---|---|
| `WHERE YEAR(order_date) = 2026` | `WHERE order_date >= '2026-01-01' AND order_date < '2027-01-01'` |
| `WHERE amount * 1.14 > 1000` | `WHERE amount > 1000 / 1.14` |
| `WHERE LOWER(email) = @e` | Store normalised emails, use a case-insensitive collation, or index the expression (PostgreSQL) |
| `WHERE name LIKE '%nile%'` | Full-text search (a leading wildcard can't use a B-tree) |
| `WHERE phone = 01001234567` on an `nvarchar` column | Compare with a string, avoiding an implicit conversion on the column |

> [!term] Parameter sniffing (SQL Server)
> SQL Server compiles a plan using the **first** parameter values it sees and reuses it. If those values were unusual (one tenant with 2 million rows, most with 200), the cached plan can be terrible for everyone else. Mitigations: `OPTION (RECOMPILE)` for that query, `OPTIMIZE FOR`, or Query Store plan forcing, and in SQL Server 2022+, parameter-sensitive plan optimisation.

## B6.5 Transactions and isolation levels 🟡 ⭐

Isolation decides what concurrent transactions can see of each other. Weaker levels allow more **anomalies** but block less.

| Anomaly | What happens |
|---|---|
| **Dirty read** | Reading another transaction's uncommitted change, which may be rolled back |
| **Non-repeatable read** | Reading the same row twice in one transaction and getting different values |
| **Phantom read** | Re-running a range query and getting new rows |
| **Lost update** | Two transactions read, modify and write the same row; one overwrites the other |
| **Write skew** | Two transactions each check a condition and update *different* rows, together breaking a rule (two doctors both go off call because each saw the other on call) |

| Level | Prevents | Notes |
|---|---|---|
| Read uncommitted | Nothing | `NOLOCK` hint; avoid for anything that matters |
| **Read committed** | Dirty reads | **Default** in SQL Server and PostgreSQL |
| Repeatable read | + non-repeatable reads | PostgreSQL's implementation is snapshot isolation |
| **Snapshot** | Reads see a consistent snapshot; writers don't block readers | SQL Server option (row versioning); detects write conflicts |
| **Serializable** | All of the above, including phantoms and write skew | Strongest; more blocking or retries |

> [!note] Row versioning in practice
> PostgreSQL uses **MVCC**: readers see a snapshot and never block writers. SQL Server's default read committed uses **locks**, unless **Read Committed Snapshot Isolation (RCSI)** is turned on, which **Azure SQL Database enables by default**. With RCSI, readers see the last committed version instead of waiting. This explains "why does this query block on-premises but not in Azure?".

**Preventing lost updates**, which is the anomaly you'll actually meet: optimistic concurrency with a version column ([[B4.5]], [[B5.7]]), an atomic update (`UPDATE accounts SET balance = balance - @x WHERE id = @id AND balance >= @x`), or `SELECT … FOR UPDATE` (PostgreSQL) / `UPDLOCK` (SQL Server) inside a short transaction.

> [!say]
> "Isolation levels trade consistency for concurrency. Read committed, the default, stops dirty reads but still allows non-repeatable reads, phantoms and lost updates. Serializable prevents everything but blocks or retries more. In practice I keep read committed, ideally with row versioning so reads don't block, and handle lost updates explicitly with a version column or an atomic conditional update."

## B6.6 Locks and deadlocks 🟡 ⭐

> [!term] Deadlock
> Two transactions each hold a lock the other needs: A locks row 1 and wants row 2; B locks row 2 and wants row 1. Neither can proceed. The database detects the cycle and kills one (the **victim**), which gets an error (SQL Server error **1205**; PostgreSQL `deadlock detected`).

**Avoiding them:**

- Access tables and rows in a **consistent order** everywhere.
- Keep transactions **short**: no HTTP calls or user waits inside a transaction.
- Make sure updates find rows through **indexes**, so they lock a few rows rather than scanning and locking many.
- Use row versioning (RCSI or snapshot) so readers don't take shared locks.
- **Retry** the victim transaction: deadlocks can be made rare, not impossible. EF Core's execution strategy can retry transient errors.

**Blocking** (one transaction waiting on another's lock) is more common than deadlock; long transactions and missing indexes are the usual causes.

## B6.7 Scaling a relational database 🟡 ⭐

In roughly the order you'd reach for them:

1. **Fix queries and indexes**; most "we need to scale" problems are a few bad queries.
2. **Connection pooling** (on by default in ADO.NET); don't open more connections than the database can handle; PgBouncer for PostgreSQL at high concurrency.
3. **Caching** hot reads in Redis or in memory ([[B8]]).
4. **Scale up** (a bigger instance); simple and often cheapest.
5. **Read replicas:** send reads to replicas and writes to the primary. Replicas lag slightly behind, so a user may not see their own write on a replica immediately (**read-your-writes** problems).
6. **Partitioning:** split a big table by range (month) inside one database, so old partitions can be archived or dropped and queries touch fewer pages.
7. **Sharding:** split data across **several databases** by a shard key (`company_id`). It scales writes, but cross-shard queries and transactions become hard. Choosing the shard key is the critical decision: a multi-tenant SaaS like FinSight naturally shards by tenant.

## B6.8 SQL or NoSQL? 🟢 🟡 ⭐

| Type | Examples | Model | Strong at |
|---|---|---|---|
| **Relational** | SQL Server, PostgreSQL, MySQL, Oracle | Tables, joins, constraints, ACID transactions | Most business data; integrity; ad-hoc queries |
| **Document** | MongoDB, Azure Cosmos DB, PostgreSQL JSONB | JSON documents | Flexible, nested data read as a unit (a product with variable attributes, a user profile) |
| **Key-value** | Redis, DynamoDB | Key → value | Caching, sessions, counters, very fast lookups |
| **Wide-column** | Cassandra, ScyllaDB | Rows with flexible columns, partitioned | Huge write volumes (events, IoT, time series) |
| **Graph** | Neo4j | Nodes and edges | Relationships: recommendations, fraud rings |
| **Search** | Elasticsearch, OpenSearch, Azure AI Search | Inverted indexes | Full-text search, faceting |
| **Vector** | pgvector, Qdrant, Azure AI Search, SQL Server 2025 `vector` | Embeddings | Semantic search and RAG |

> [!term] CAP theorem
> In a distributed data store, when a **network partition** happens, you must choose between **Consistency** (every read sees the latest write, or errors) and **Availability** (every request gets a response, possibly stale). Without a partition you can have both. It's a statement about distributed systems under failure, not a menu to pick two from at design time.

> [!say]
> "I default to a relational database for business data because of constraints, transactions and flexible querying, and modern PostgreSQL or SQL Server handle JSON well too. I'd add a document store when the data is naturally document-shaped and read as a whole, Redis for caching and sessions, a search engine for full-text search, and a vector index for semantic search, each for a specific access pattern rather than replacing the relational core."

## B6.9 Logic in the database: procedures, views, triggers 🟡

| Feature | Pros | Cons |
|---|---|---|
| **Stored procedures** | Fewer round trips, a security boundary (grant EXECUTE only), plan reuse | Logic split between app and database; harder to version, test and review; vendor lock-in |
| **Views** | Reusable, secured projections; simplify reporting | Can hide expensive joins |
| **Functions** | Reusable expressions | Scalar UDFs used to be slow in SQL Server (much improved since 2019) |
| **Triggers** | Enforce rules or audit at the database level | Hidden side effects; surprising performance; hard to debug |

Many enterprise and government systems in Egypt and the Gulf keep significant logic in **stored procedures**, and in **Oracle PL/SQL** behind Oracle Forms, as at Farwaniya Hospital. Being comfortable reading them is a real advantage in those interviews.

> [!lab] Tune one query, end to end
> In SQL Server or PostgreSQL, generate 1 million invoice rows (a recursive CTE or `generate_series`). Run "overdue invoices for company X, newest due date first, page 1" and capture the actual plan and timings. Add a composite index, then make it covering, then switch to keyset pagination, recording the plan and time after each step. Then open two sessions and create a deadlock on purpose by updating two rows in opposite orders. You'll have numbers and a story for every question in this module.

## B6.10 Interview drill 🟢 ⭐

| Question | Strong short answer |
|---|---|
| What is normalisation? | Structuring tables so each fact is stored once, removing update, insert and delete anomalies; usually to 3NF. |
| When would you denormalise? | For measured read performance (cached totals, reporting tables), with a clear sync mechanism. |
| Clustered vs non-clustered index? | Clustered is the table stored in key order (one per table); non-clustered are separate structures pointing to rows. |
| What's a covering index? | An index containing every column a query needs, so no lookups into the table are required. |
| Does column order matter in a composite index? | Yes, by the leftmost-prefix rule: equality columns first, then range or sort columns. |
| Why might an index not be used? | Non-sargable predicates (functions on the column), low selectivity, implicit conversions, or the leading column missing. |
| How do you investigate a slow query? | Find it (Query Store, pg_stat_statements, APM), read the actual plan, look for scans, lookups and misestimates, then fix the predicate or index. |
| What are isolation levels? | Rules for what concurrent transactions see: read uncommitted, read committed, repeatable read, snapshot, serializable. |
| What does read committed allow? | Non-repeatable reads, phantoms and lost updates (it only prevents dirty reads). |
| What is a deadlock and how do you prevent it? | Two transactions waiting on each other's locks; consistent access order, short transactions, good indexes, and retries. |
| GUID or int primary key? | Int is compact and append-friendly; GUIDs allow client-side generation and hide volume; sequential v7 GUIDs avoid fragmentation. |
| SQL vs NoSQL? | Relational for integrity and flexible queries; NoSQL for specific access patterns at scale (documents, caching, wide-column, graph). |
| What is the CAP theorem? | Under a network partition, a distributed store must choose consistency or availability. |
| Partitioning vs sharding? | Partitioning splits a table within one database; sharding splits data across databases. |
| What's parameter sniffing? | SQL Server caching a plan built for the first parameter values, which can be bad for others. |

## Key takeaways

> [!check]
> - Normalise to 3NF; denormalise deliberately with a sync plan.
> - Indexes follow queries: composite in the right order, covering when hot.
> - Keep predicates sargable; read the actual plan before changing anything.
> - Read committed doesn't stop lost updates: use version columns or atomic updates.
> - Deadlocks are prevented by order and short transactions, and handled by retries.

## Sources

- Microsoft Learn: [Clustered and nonclustered indexes](https://learn.microsoft.com/en-us/sql/relational-databases/indexes/clustered-and-nonclustered-indexes-described), [Create indexes with included columns](https://learn.microsoft.com/en-us/sql/relational-databases/indexes/create-indexes-with-included-columns), [Transaction locking and row versioning guide](https://learn.microsoft.com/en-us/sql/relational-databases/sql-server-transaction-locking-and-row-versioning-guide), [Deadlocks guide](https://learn.microsoft.com/en-us/sql/relational-databases/sql-server-deadlocks-guide), [Query Store](https://learn.microsoft.com/en-us/sql/relational-databases/performance/monitoring-performance-by-using-the-query-store), [Parameter sensitive plan optimization](https://learn.microsoft.com/en-us/sql/relational-databases/performance/parameter-sensitive-plan-optimization), [Guid.CreateVersion7](https://learn.microsoft.com/en-us/dotnet/api/system.guid.createversion7).
- PostgreSQL documentation: [Indexes](https://www.postgresql.org/docs/current/indexes.html), [Using EXPLAIN](https://www.postgresql.org/docs/current/using-explain.html), [Transaction isolation](https://www.postgresql.org/docs/current/transaction-iso.html), [MVCC](https://www.postgresql.org/docs/current/mvcc-intro.html).
- Markus Winand, [Use The Index, Luke](https://use-the-index-luke.com/).
- Martin Kleppmann, *Designing Data-Intensive Applications* (O'Reilly, 2017), chapters on storage, replication, partitioning and transactions.
- E. F. Codd, "A Relational Model of Data for Large Shared Data Banks" (1970); Eric Brewer, "CAP Twelve Years Later" (*IEEE Computer*, 2012).
