# Database Design and Tuning — Normalisation, Indexes, Plans, Isolation and Locks

Backend interviews at mid level move from "write a query" to "why is this query slow?" and "what happens when two requests update the same row?". This module covers the database side of the backend: designing tables that stay correct, indexing for real queries, reading an execution plan, choosing an isolation level, and avoiding deadlocks. It builds on [[S3]] and [[B5]].

> [!focus]
> **Entry must:** normalise to third normal form and explain why; choose primary keys and constraints; explain clustered vs non-clustered indexes and when an index helps; explain ACID.
> **Mid adds:** composite and covering indexes, sargable predicates, reading execution plans, isolation levels and the anomalies each prevents, deadlocks, GUID vs integer keys, SQL vs NoSQL, partitioning and replicas.
> **Most asked:** *What is normalisation?* · *Clustered vs non-clustered index?* · *How do you find and fix a slow query?* · *What are isolation levels?* · *What is a deadlock?* · *When would you choose NoSQL?* · *GUID or int as primary key?*
> **Time budget:** 4 hours.

## B6.0 Foundations: how a database stores and protects data 🟢

Tuning advice only makes sense once you know what the engine is doing underneath.

- **Pages.** Tables and indexes are stored on disk in fixed-size **pages**: 8 KB in both SQL Server and PostgreSQL. A row lives inside a page; reading one row means reading its whole page.
- **The buffer pool.** Pages are cached in memory. A query that touches pages already in memory does **logical reads**; one that must fetch from disk also does **physical reads**, which are far slower. "How many pages did it touch?" is the most useful single number in tuning.
- **The transaction log** (the write-ahead log, WAL). Changes are recorded in a sequential log *before* the data pages are written. That is how a commit can be both fast and crash-proof.

<figure class="dia steps" data-start="1"><svg viewBox="0 0 720 212" role="img" aria-label="Write path: a page is read into memory, an update dirties it, commit flushes the transaction log to disk, a checkpoint writes the page later, and recovery replays the log after a crash">
<rect class="sN" x="20" y="30" width="300" height="150" rx="12"/><text class="sT" x="170" y="50" text-anchor="middle">memory: buffer pool</text>
<rect class="sN" x="400" y="30" width="300" height="150" rx="12"/><text class="sT" x="550" y="50" text-anchor="middle">disk</text>
<rect class="sB" x="430" y="64" width="240" height="40" rx="6"/><text class="sC" x="550" y="88" text-anchor="middle">data files: 8 KB pages</text>
<rect class="sV" x="430" y="120" width="240" height="40" rx="6"/><text class="sC" x="550" y="144" text-anchor="middle">transaction log (WAL)</text>
<g data-s="1"><rect class="sB" x="50" y="64" width="120" height="40" rx="6"/><text class="sC" x="110" y="88" text-anchor="middle">page 512</text><line class="sLm" x1="426" y1="84" x2="174" y2="84" marker-end="url(#ahm)"/></g>
<g data-s="1-3"><text class="sC" x="373" y="76" text-anchor="middle">read once</text></g>
<g data-s="2"><rect class="sW" x="190" y="64" width="110" height="40" rx="6"/><text class="sC" x="245" y="82" text-anchor="middle">page 512*</text><text class="sWt" x="245" y="98" text-anchor="middle">dirty</text><text class="sS" x="170" y="200" text-anchor="middle">UPDATE changes the page in memory only</text></g>
<g data-s="3-3"><line class="sLg" x1="170" y1="140" x2="426" y2="140" marker-end="url(#ahg)"/><rect class="sG" x="50" y="124" width="120" height="34" rx="6"/><text class="sC" x="110" y="145" text-anchor="middle">log record</text><text class="sGt" x="373" y="132" text-anchor="middle">COMMIT</text><text class="sGt" x="373" y="162" text-anchor="middle">flushes log</text><text class="sGt" x="550" y="200" text-anchor="middle">the commit is durable once the log is on disk</text></g>
<g data-s="4-4"><line class="sLw" x1="304" y1="84" x2="426" y2="84" marker-end="url(#ahw)"/><text class="sWt" x="365" y="76" text-anchor="middle">checkpoint</text><text class="sS" x="550" y="200" text-anchor="middle">dirty pages are written later, in batches</text></g>
<g data-s="5-5"><rect class="sR" x="400" y="30" width="300" height="150" rx="12" opacity=".2"/><text class="sRt" x="550" y="200" text-anchor="middle">after a crash: redo committed log records, undo the rest</text></g>
</svg><ol class="dia-steps">
<li>Data lives on disk in fixed-size pages (8 KB in SQL Server and PostgreSQL). To read or change a row, its page is first loaded into the buffer pool in memory, and stays there while it's hot.</li>
<li>An UPDATE changes the page in memory. Writing the whole page to disk on every change would be far too slow.</li>
<li>On COMMIT, a small record describing the change is appended to the transaction log and the log is flushed to disk. Sequential appends are fast, and from this moment the change is durable.</li>
<li>Later, a checkpoint writes dirty pages to the data files in batches.</li>
<li>If the server crashes before that, recovery reads the log: committed changes are redone, uncommitted ones undone. That is the D in ACID.</li>
</ol><figcaption>The write-ahead log is why commits are both fast and durable, and why "logical reads" (pages touched) is the number to watch when tuning.</figcaption></figure>

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

<figure class="dia"><svg viewBox="0 0 720 214" role="img" aria-label="A wide orders table repeats the customer city on every row and drifts into a contradiction; normalised, the city is stored once in customers">
<text class="sT" x="180" y="22" text-anchor="middle">one wide table</text>
<text class="sM" x="30" y="44">order</text>
<text class="sM" x="110" y="44">customer</text>
<text class="sM" x="190" y="44">city</text>
<text class="sM" x="270" y="44">total</text>
<rect class="sB" x="26" y="52" width="76" height="20" rx="3"/><text class="sC" x="30" y="66">1001</text>
<rect class="sW" x="106" y="52" width="76" height="20" rx="3"/><text class="sC" x="110" y="66">Nile Foods</text>
<rect class="sW" x="186" y="52" width="76" height="20" rx="3"/><text class="sC" x="190" y="66">Giza</text>
<rect class="sB" x="266" y="52" width="76" height="20" rx="3"/><text class="sC" x="270" y="66">900</text>
<rect class="sB" x="26" y="76" width="76" height="20" rx="3"/><text class="sC" x="30" y="90">1002</text>
<rect class="sW" x="106" y="76" width="76" height="20" rx="3"/><text class="sC" x="110" y="90">Nile Foods</text>
<rect class="sW" x="186" y="76" width="76" height="20" rx="3"/><text class="sC" x="190" y="90">Giza</text>
<rect class="sB" x="266" y="76" width="76" height="20" rx="3"/><text class="sC" x="270" y="90">450</text>
<rect class="sB" x="26" y="100" width="76" height="20" rx="3"/><text class="sC" x="30" y="114">1003</text>
<rect class="sB" x="106" y="100" width="76" height="20" rx="3"/><text class="sC" x="110" y="114">Delta Co</text>
<rect class="sB" x="186" y="100" width="76" height="20" rx="3"/><text class="sC" x="190" y="114">Tanta</text>
<rect class="sB" x="266" y="100" width="76" height="20" rx="3"/><text class="sC" x="270" y="114">300</text>
<rect class="sB" x="26" y="124" width="76" height="20" rx="3"/><text class="sC" x="30" y="138">1004</text>
<rect class="sW" x="106" y="124" width="76" height="20" rx="3"/><text class="sC" x="110" y="138">Nile Foods</text>
<rect class="sR" x="186" y="124" width="76" height="20" rx="3"/><text class="sC" x="190" y="138">Cairo?</text>
<rect class="sB" x="266" y="124" width="76" height="20" rx="3"/><text class="sC" x="270" y="138">120</text>
<text class="sRt" x="180" y="172" text-anchor="middle">city repeated per order; one update missed → contradiction</text>
<line class="sLg" x1="355" y1="100" x2="385" y2="100" marker-end="url(#ahg)"/>
<text class="sM" x="450" y="30" text-anchor="middle">customers</text>
<rect class="sG" x="395" y="38" width="110" height="20" rx="3"/><text class="sC" x="400" y="52">Nile Foods</text><rect class="sG" x="507" y="38" width="60" height="20" rx="3"/><text class="sC" x="512" y="52">Giza</text>
<rect class="sG" x="395" y="62" width="110" height="20" rx="3"/><text class="sC" x="400" y="76">Delta Co</text><rect class="sG" x="507" y="62" width="60" height="20" rx="3"/><text class="sC" x="512" y="76">Tanta</text>
<text class="sM" x="450" y="112" text-anchor="middle">orders</text>
<rect class="sB" x="395" y="120" width="56" height="18" rx="3"/><text class="sC" x="400" y="133">1001</text><rect class="sA" x="453" y="120" width="56" height="18" rx="3"/><text class="sC" x="458" y="133">Nile</text><rect class="sB" x="511" y="120" width="56" height="18" rx="3"/><text class="sC" x="516" y="133">900</text>
<rect class="sB" x="395" y="142" width="56" height="18" rx="3"/><text class="sC" x="400" y="155">1002</text><rect class="sA" x="453" y="142" width="56" height="18" rx="3"/><text class="sC" x="458" y="155">Nile</text><rect class="sB" x="511" y="142" width="56" height="18" rx="3"/><text class="sC" x="516" y="155">450</text>
<rect class="sB" x="395" y="164" width="56" height="18" rx="3"/><text class="sC" x="400" y="177">1003</text><rect class="sA" x="453" y="164" width="56" height="18" rx="3"/><text class="sC" x="458" y="177">Delta</text><rect class="sB" x="511" y="164" width="56" height="18" rx="3"/><text class="sC" x="516" y="177">300</text>
<rect class="sB" x="395" y="186" width="56" height="18" rx="3"/><text class="sC" x="400" y="199">1004</text><rect class="sA" x="453" y="186" width="56" height="18" rx="3"/><text class="sC" x="458" y="199">Nile</text><rect class="sB" x="511" y="186" width="56" height="18" rx="3"/><text class="sC" x="516" y="199">120</text>
<text class="sGt" x="640" y="100" text-anchor="middle">each fact once:</text><text class="sGt" x="640" y="118" text-anchor="middle">city lives with</text><text class="sGt" x="640" y="136" text-anchor="middle">the customer</text>
</svg><figcaption>Normalisation to 3NF in one picture: a fact that depends on the customer belongs in the customers table.</figcaption></figure>

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

<figure class="dia steps" data-start="1"><svg viewBox="0 0 720 252" role="img" aria-label="Finding one key in a B-tree index takes three page reads from root through an internal page to a leaf, compared with scanning thousands of pages">
<rect class="sB" x="220" y="20" width="140" height="36" rx="6"/><text class="sC" x="290" y="43" text-anchor="middle">root: 1 · 3M · 6M</text>
<rect class="sB" x="40" y="90" width="140" height="36" rx="6"/><text class="sC" x="110" y="113" text-anchor="middle">internal: 3M…4M</text><line class="sLm" x1="290" y1="56" x2="110" y2="88"/>
<rect class="sB" x="220" y="90" width="140" height="36" rx="6"/><text class="sC" x="290" y="113" text-anchor="middle">internal: 4M…5M</text><line class="sLm" x1="290" y1="56" x2="290" y2="88"/>
<rect class="sB" x="400" y="90" width="140" height="36" rx="6"/><text class="sC" x="470" y="113" text-anchor="middle">internal: 5M…6M</text><line class="sLm" x1="290" y1="56" x2="470" y2="88"/>
<rect class="sG" x="10" y="160" width="115" height="36" rx="6"/><text class="sC" x="67" y="183" text-anchor="middle">…4,173,400</text>
<rect class="sG" x="135" y="160" width="115" height="36" rx="6"/><text class="sC" x="192" y="183" text-anchor="middle">4,173,401…510</text>
<rect class="sG" x="260" y="160" width="115" height="36" rx="6"/><text class="sC" x="317" y="183" text-anchor="middle">…4,173,620</text>
<rect class="sG" x="385" y="160" width="115" height="36" rx="6"/><text class="sC" x="442" y="183" text-anchor="middle">…</text>
<rect class="sG" x="510" y="160" width="115" height="36" rx="6"/><text class="sC" x="567" y="183" text-anchor="middle">…</text>
<line class="sLm" x1="290" y1="126" x2="192" y2="158"/>
<g data-s="1-1"><rect class="sN" x="217" y="17" width="146" height="42" rx="8" style="stroke:var(--accent);stroke-width:3"/><text class="sM" x="706" y="43" text-anchor="end">page read 1</text></g>
<g data-s="2-2"><rect class="sN" x="217" y="87" width="146" height="42" rx="8" style="stroke:var(--accent);stroke-width:3"/><text class="sM" x="706" y="113" text-anchor="end">page read 2</text></g>
<g data-s="3-3"><rect class="sN" x="132" y="157" width="121" height="42" rx="8" style="stroke:var(--accent);stroke-width:3"/><text class="sGt" x="706" y="150" text-anchor="end">page read 3: found</text></g>
<g data-s="4-4"><rect class="sR" x="20" y="214" width="680" height="30" rx="6" opacity=".8"/><text class="sC" x="360" y="234" text-anchor="middle">without the index: scan every page of a 5-million-row table, about 12,500 pages</text></g>
</svg><ol class="dia-steps">
<li>Looking for invoice 4,173,510. Start at the root page, which holds the boundaries of its children.</li>
<li>Follow the pointer to the internal page covering 4M to 5M.</li>
<li>One more hop reaches the leaf page that holds the key and (in a clustered index) the row itself. Three page reads.</li>
<li>Without an index the engine must read every page. With 400 rows per page, a 5-million-row table is about 12,500 pages. That ratio is what "seek vs scan" means in a plan.</li>
</ol><figcaption>Why indexes are fast. B-trees are wide and shallow: a few levels cover millions of rows, so a lookup touches only a handful of pages.</figcaption></figure>

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

<figure class="dia"><svg viewBox="0 0 720 220" role="img" aria-label="An index sorted by company, status and due date: the rows for company 7 and status overdue are contiguous, but rows with status overdue alone are scattered">
<text class="sT" x="130" y="22" text-anchor="middle">index sorted by (company, status, due)</text>
<rect class="sB" x="30" y="32" width="200" height="18" rx="3"/><text class="sC" x="40" y="45">3 · overdue · Mar 2</text>
<rect class="sR" x="262" y="32" width="14" height="18" rx="3"/>
<rect class="sB" x="30" y="52" width="200" height="18" rx="3"/><text class="sC" x="40" y="65">3 · paid · Jan 5</text>
<rect class="sB" x="30" y="72" width="200" height="18" rx="3"/><text class="sC" x="40" y="85">7 · draft · Feb 1</text>
<rect class="sB" x="30" y="92" width="200" height="18" rx="3"/><text class="sC" x="40" y="105">7 · overdue · Jan 9</text>
<rect class="sG" x="240" y="92" width="14" height="18" rx="3"/>
<rect class="sR" x="262" y="92" width="14" height="18" rx="3"/>
<rect class="sB" x="30" y="112" width="200" height="18" rx="3"/><text class="sC" x="40" y="125">7 · overdue · Feb 3</text>
<rect class="sG" x="240" y="112" width="14" height="18" rx="3"/>
<rect class="sR" x="262" y="112" width="14" height="18" rx="3"/>
<rect class="sB" x="30" y="132" width="200" height="18" rx="3"/><text class="sC" x="40" y="145">7 · overdue · Mar 1</text>
<rect class="sG" x="240" y="132" width="14" height="18" rx="3"/>
<rect class="sR" x="262" y="132" width="14" height="18" rx="3"/>
<rect class="sB" x="30" y="152" width="200" height="18" rx="3"/><text class="sC" x="40" y="165">7 · paid · Jan 2</text>
<rect class="sB" x="30" y="172" width="200" height="18" rx="3"/><text class="sC" x="40" y="185">9 · overdue · Jan 4</text>
<rect class="sR" x="262" y="172" width="14" height="18" rx="3"/>
<rect class="sB" x="30" y="192" width="200" height="18" rx="3"/><text class="sC" x="40" y="205">9 · paid · Feb 7</text>
<path class="sLg" d="M258 92 h28 v58 h-28"/><text class="sGt" x="300" y="112">company = 7 AND status = overdue:</text><text class="sGt" x="300" y="128">one contiguous range → a seek</text>
<text class="sRt" x="300" y="176">status = overdue alone:</text><text class="sRt" x="300" y="192">rows scattered through the index → a scan</text>
</svg><figcaption>The leftmost-prefix rule isn't a rule to memorise; it falls out of the sort order. Like a phone book sorted by surname, then first name.</figcaption></figure>

> [!term] Covering index
> An index that contains **every column a query needs**, so the database answers from the index alone without touching the table (no key lookups). In SQL Server: `CREATE INDEX IX_Inv ON Invoices(CompanyId, DueDate) INCLUDE (Customer, Amount);` PostgreSQL has `INCLUDE` too, and calls the result an **index-only scan**.

<figure class="dia"><svg viewBox="0 0 720 200" role="img" aria-label="A non-clustered index requires a key lookup into the table for each matching row; a covering index includes the needed columns and avoids the lookups">
<text class="sT" x="180" y="22" text-anchor="middle">non-clustered index + key lookups</text><text class="sT" x="540" y="22" text-anchor="middle">covering index (INCLUDE)</text>
<rect class="sA" x="20" y="40" width="150" height="120" rx="8"/><text class="sC" x="95" y="60" text-anchor="middle">IX(CompanyId,</text><text class="sC" x="95" y="76" text-anchor="middle">DueDate)</text>
<rect class="sB" x="32" y="88" width="126" height="18" rx="3"/><text class="sC" x="95" y="101" text-anchor="middle">key → row 1</text>
<rect class="sB" x="32" y="110" width="126" height="18" rx="3"/><text class="sC" x="95" y="123" text-anchor="middle">key → row 2</text>
<rect class="sB" x="32" y="132" width="126" height="18" rx="3"/><text class="sC" x="95" y="145" text-anchor="middle">key → row 3</text>
<rect class="sG" x="220" y="40" width="120" height="120" rx="8"/><text class="sC" x="280" y="60" text-anchor="middle">clustered</text><text class="sC" x="280" y="76" text-anchor="middle">(the table)</text>
<line class="sLr" x1="158" y1="97" x2="216" y2="97" marker-end="url(#ahr)"/>
<line class="sLr" x1="158" y1="119" x2="216" y2="119" marker-end="url(#ahr)"/>
<line class="sLr" x1="158" y1="141" x2="216" y2="141" marker-end="url(#ahr)"/>
<text class="sRt" x="180" y="186" text-anchor="middle">one extra lookup per row: 20,000 rows → 20,000 lookups</text>
<line class="sD" x1="360" y1="12" x2="360" y2="200"/>
<rect class="sA" x="400" y="40" width="280" height="120" rx="8"/><text class="sC" x="540" y="60" text-anchor="middle">IX(CompanyId, DueDate)</text><text class="sC" x="540" y="76" text-anchor="middle">INCLUDE (Customer, Amount)</text>
<rect class="sB" x="412" y="88" width="256" height="18" rx="3"/><text class="sC" x="540" y="101" text-anchor="middle">key · Customer · Amount</text>
<rect class="sB" x="412" y="110" width="256" height="18" rx="3"/><text class="sC" x="540" y="123" text-anchor="middle">key · Customer · Amount</text>
<rect class="sB" x="412" y="132" width="256" height="18" rx="3"/><text class="sC" x="540" y="145" text-anchor="middle">key · Customer · Amount</text>
<text class="sGt" x="540" y="186" text-anchor="middle">answered from the index alone</text>
</svg><figcaption>Key lookups are cheap one at a time and ruinous by the thousand. INCLUDE the columns the query selects.</figcaption></figure>

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

<figure class="dia"><svg viewBox="0 0 720 286" role="img" aria-label="Measured in SQLite on a million orders: filtering with strftime on the order date scans the whole index in about 165 milliseconds while the equivalent date range seeks in about one millisecond; filtering on amount times 1.14 scans in about 30 milliseconds while amount greater than the divided constant seeks in a quarter of a millisecond; both pairs return the same rows">
<text class="sT" x="14" y="20">1,000,000 orders in SQLite, indexes on order_date and amount; COUNT(*) with each WHERE clause</text>
<line class="sLm" x1="470" y1="30" x2="470" y2="262" opacity=".15"/><text class="sS" x="470" y="276" text-anchor="middle">0.1 ms</text>
<line class="sLm" x1="535.714" y1="30" x2="535.714" y2="262" opacity=".15"/><text class="sS" x="535.714" y="276" text-anchor="middle">1 ms</text>
<line class="sLm" x1="601.429" y1="30" x2="601.429" y2="262" opacity=".15"/><text class="sS" x="601.429" y="276" text-anchor="middle">10 ms</text>
<line class="sLm" x1="667.143" y1="30" x2="667.143" y2="262" opacity=".15"/><text class="sS" x="667.143" y="276" text-anchor="middle">100 ms</text>
<text class="sS" x="14" y="48" xml:space="preserve" style="white-space:pre">WHERE strftime('%Y', order_date) = '2026'</text>
<text class="sRt" x="14" y="66">SCAN via index ix_date</text>
<rect class="sR" x="470" y="38" width="211.03" height="20" rx="4" opacity=".7"/><text class="sT" x="675.03" y="53" text-anchor="end">162.7 ms</text>
<text class="sS" x="14" y="92" xml:space="preserve" style="white-space:pre">WHERE order_date &gt;= '2026-01-01' AND order_date &lt; '2027-01-01'</text>
<text class="sGt" x="14" y="110">SEARCH via index ix_date (order_date&gt;? AND order_date&lt;?)</text>
<rect class="sG" x="470" y="82" width="66.7154" height="20" rx="4" opacity=".7"/><text class="sT" x="542.715" y="97">1.0 ms</text>
<text class="sGt" x="535.714" y="120">same 49,223 rows, 157× faster</text>
<text class="sS" x="14" y="154" xml:space="preserve" style="white-space:pre">WHERE amount * 1.14 &gt; 2200</text>
<text class="sRt" x="14" y="172">SCAN via index ix_amount</text>
<rect class="sR" x="470" y="144" width="161.277" height="20" rx="4" opacity=".7"/><text class="sT" x="637.277" y="159">28.5 ms</text>
<text class="sS" x="14" y="198" xml:space="preserve" style="white-space:pre">WHERE amount &gt; 2200 / 1.14</text>
<text class="sGt" x="14" y="216">SEARCH via index ix_amount (amount&gt;?)</text>
<rect class="sG" x="470" y="188" width="23.3834" height="20" rx="4" opacity=".7"/><text class="sT" x="499.383" y="203">0.2 ms</text>
<text class="sGt" x="535.714" y="226">same 35,034 rows, 125× faster</text>
</svg><figcaption>The first two rows of the table above, run for real: wrapping the column turns an index seek (SEARCH) into a full scan (SCAN), for the same answer.</figcaption></figure>

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

<figure class="dia steps"><svg viewBox="0 0 720 222" role="img" aria-label="Two transactions both read a balance of 1000, each computes its own new value, and the second commit overwrites the first, losing 100">
<text class="sT" x="160" y="22" text-anchor="middle">Transaction 1: −100</text><line class="sD" x1="160" y1="32" x2="160" y2="214"/>
<text class="sT" x="360" y="22" text-anchor="middle">balance row</text><line class="sD" x1="360" y1="32" x2="360" y2="214"/>
<text class="sT" x="560" y="22" text-anchor="middle">Transaction 2: −200</text><line class="sD" x1="560" y1="32" x2="560" y2="214"/>
<rect class="sB" x="320" y="36" width="80" height="24" rx="6"/><text class="sX" x="360" y="53" text-anchor="middle">1000</text>
<g data-s="1"><line class="sLm" x1="356" y1="74" x2="164" y2="80" marker-end="url(#ahm)"/><text class="sC" x="250" y="70" text-anchor="middle">SELECT → 1000</text></g>
<g data-s="2"><line class="sLm" x1="364" y1="98" x2="556" y2="104" marker-end="url(#ahm)"/><text class="sC" x="470" y="94" text-anchor="middle">SELECT → 1000</text></g>
<g data-s="3"><line class="sL" x1="160" y1="124" x2="356" y2="130" marker-end="url(#ah)"/><text class="sM" x="250" y="120" text-anchor="middle">UPDATE = 900 · COMMIT</text><rect class="sB" x="320" y="136" width="80" height="24" rx="6"/><text class="sX" x="360" y="153" text-anchor="middle">900</text></g>
<g data-s="4"><line class="sLr" x1="560" y1="170" x2="364" y2="176" marker-end="url(#ahr)"/><text class="sM" x="470" y="166" text-anchor="middle">UPDATE = 800 · COMMIT</text><rect class="sR" x="320" y="182" width="80" height="24" rx="6"/><text class="sX" x="360" y="199" text-anchor="middle">800 ✗</text><text class="sRt" x="160" y="196" text-anchor="middle">should be 700</text></g>
</svg><ol class="dia-steps">
<li>Transaction 1 reads the balance: 1000.</li>
<li>Before it writes, transaction 2 also reads 1000. Read committed allows this; both reads were of committed data.</li>
<li>Transaction 1 subtracts 100 in application code and writes 900.</li>
<li>Transaction 2 subtracts 200 from the 1000 it read and writes 800, silently undoing transaction 1. The fix: let the database do the arithmetic (<code>SET balance = balance - 200 WHERE balance &gt;= 200</code>), lock the row (<code>FOR UPDATE</code>), or use a version check.</li>
</ol><figcaption>The lost update, the anomaly you will actually meet. Read-modify-write in application code needs protection.</figcaption></figure>

**Preventing lost updates**, which is the anomaly you'll actually meet: optimistic concurrency with a version column ([[B4.5]], [[B5.7]]), an atomic update (`UPDATE accounts SET balance = balance - @x WHERE id = @id AND balance >= @x`), or `SELECT … FOR UPDATE` (PostgreSQL) / `UPDLOCK` (SQL Server) inside a short transaction.

> [!say]
> "Isolation levels trade consistency for concurrency. Read committed, the default, stops dirty reads but still allows non-repeatable reads, phantoms and lost updates. Serializable prevents everything but blocks or retries more. In practice I keep read committed, ideally with row versioning so reads don't block, and handle lost updates explicitly with a version column or an atomic conditional update."

## B6.6 Locks and deadlocks 🟡 ⭐

> [!term] Deadlock
> Two transactions each hold a lock the other needs: A locks row 1 and wants row 2; B locks row 2 and wants row 1. Neither can proceed. The database detects the cycle and kills one (the **victim**), which gets an error (SQL Server error **1205**; PostgreSQL `deadlock detected`).

<figure class="dia"><svg viewBox="0 0 720 234" role="img" aria-label="Deadlock cycle: transaction A holds row 1 and waits for row 2 while transaction B holds row 2 and waits for row 1">
<rect class="sA" x="60" y="40" width="170" height="50" rx="8"/><text class="sT" x="145" y="63" text-anchor="middle">Transaction A</text><text class="sC" x="145" y="79" text-anchor="middle">holds row 1</text><rect class="sW" x="490" y="40" width="170" height="50" rx="8"/><text class="sT" x="575" y="63" text-anchor="middle">Transaction B</text><text class="sC" x="575" y="79" text-anchor="middle">holds row 2</text>
<rect class="sB" x="60" y="150" width="170" height="44" rx="8"/><text class="sT" x="145" y="170" text-anchor="middle">row 1</text><text class="sC" x="145" y="186" text-anchor="middle">locked by A</text><rect class="sB" x="490" y="150" width="170" height="44" rx="8"/><text class="sT" x="575" y="170" text-anchor="middle">row 2</text><text class="sC" x="575" y="186" text-anchor="middle">locked by B</text>
<line class="sLg" x1="145" y1="90" x2="145" y2="148" marker-end="url(#ahg)"/><line class="sLg" x1="575" y1="90" x2="575" y2="148" marker-end="url(#ahg)"/>
<path class="sLr" d="M230 70 C350 70 400 150 486 166" stroke-dasharray="6 4" marker-end="url(#ahr)"/><text class="sRt" x="380" y="92" text-anchor="middle">A waits for row 2</text>
<path class="sLr" d="M490 70 C370 70 320 150 234 176" stroke-dasharray="6 4" marker-end="url(#ahr)"/><text class="sRt" x="340" y="150" text-anchor="middle">B waits for row 1</text>
<text class="sS" x="360" y="222" text-anchor="middle">a cycle: the database picks a victim, rolls it back (error 1205), and the other continues</text>
</svg><figcaption>A deadlock is a cycle in the waits-for graph. Consistent access order breaks the cycle before it forms.</figcaption></figure>

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
