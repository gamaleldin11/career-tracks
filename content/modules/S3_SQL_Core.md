# SQL Core — Querying, Joining, Aggregating and Window Functions

SQL is the one skill all six tracks are tested on. Backend interviews ask about joins and indexes; analyst interviews are often *mostly* SQL; data-engineering interviews ask for deduplication and incremental loads. This module is the shared core. [[DA3]] adds analytics patterns (cohorts, funnels), [[B6]] adds design and tuning, and [[DE3]] adds pipeline SQL (MERGE, slowly changing dimensions).

> [!focus]
> **Entry must:** write SELECT with WHERE, JOIN, GROUP BY, HAVING and ORDER BY correctly on the first try; explain each join type; handle NULLs; use a CTE; use ROW_NUMBER, RANK and LAG.
> **Mid adds:** the logical order of evaluation, window frames, anti-joins, top-N per group, gaps and islands, query plans at a basic level.
> **Most asked:** *INNER vs LEFT JOIN?* · *WHERE vs HAVING?* · *Second-highest salary* · *Find duplicates* · *Top 3 per category* · *RANK vs DENSE_RANK vs ROW_NUMBER* · *Running total* · *UNION vs UNION ALL*
> **Time budget:** 4–6 hours including practice. Write every query in this module yourself.

**The practice schema** used throughout (a small shop):

```sql
customers  (customer_id PK, name, city, signup_date)
products   (product_id PK, name, category, unit_price)
orders     (order_id PK, customer_id FK, order_date, status)       -- status: 'paid','refunded','pending'
order_items(order_id FK, product_id FK, quantity, unit_price)      -- PK (order_id, product_id)
```

> [!lab] Get a database in five minutes
> Use what you already have: SQL Server LocalDB from Visual Studio, or Docker: `docker run -e POSTGRES_PASSWORD=dev -p 5432:5432 postgres:18`. For zero setup, [DB Fiddle](https://www.db-fiddle.com/) or DuckDB in a browser work too. Create the four tables, insert about 20 rows, and run every query below.

## S3.0 Foundations: what a database does, types, constraints and relationships 🟢

A spreadsheet is a grid you edit by hand. A **relational database management system** (RDBMS: SQL Server, PostgreSQL, MySQL, Oracle, SQLite) is a program that keeps tables safely on disk, lets many people read and write at the same time without corrupting anything, enforces rules about the data, and answers questions written in SQL.

### How a query gets answered

1. Your application sends the SQL text over a connection.
2. The **parser** checks the syntax and that every table and column exists. A typo in a column name fails here.
3. The **optimiser** considers different ways to run it (which index, which join order, which join algorithm), estimates the cost of each from statistics about the data, and picks the cheapest **execution plan**.
4. The **executor** runs that plan, reading data in fixed-size **pages** (8 KB in both SQL Server and PostgreSQL) from memory when it can and from disk when it must.
5. The result rows stream back to your application.

Because the optimiser decides *how*, SQL is **declarative**: you describe the result. Adding an index can make the same query a hundred times faster without changing a word of it.

### Data types that cause real bugs

| Kind | Types | Watch out for |
|---|---|---|
| Whole numbers | `INT`, `BIGINT` | `INT` stops at about 2.1 billion; IDs in busy tables need `BIGINT` |
| Exact decimals | `DECIMAL(p, s)` / `NUMERIC` | Use these for **money**. `FLOAT` can't store 0.1 exactly, so totals drift by fractions of a piastre |
| Approximate numbers | `FLOAT`, `REAL`, `DOUBLE PRECISION` | Measurements and scientific values, where tiny rounding is fine |
| Text | `VARCHAR(n)`, `NVARCHAR(n)`, `TEXT` | Arabic names need Unicode: `NVARCHAR` (or a UTF-8 collation) in SQL Server; PostgreSQL text is already UTF-8 |
| Dates and times | `DATE`, `TIMESTAMP` / `DATETIME2`, `TIMESTAMPTZ` / `DATETIMEOFFSET` | Store instants in UTC; convert to local time when you display them |
| True/false | `BOOLEAN` (PostgreSQL), `BIT` (SQL Server) | — |

### Constraints: rules the database enforces for you

```sql
CREATE TABLE orders (                                    -- PostgreSQL
    order_id    BIGINT      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    customer_id BIGINT      NOT NULL REFERENCES customers (customer_id),   -- foreign key
    order_date  DATE        NOT NULL DEFAULT CURRENT_DATE,
    status      VARCHAR(10) NOT NULL CHECK (status IN ('paid', 'refunded', 'pending'))
);
```

`PRIMARY KEY`, `FOREIGN KEY` (`REFERENCES`), `NOT NULL`, `UNIQUE`, `CHECK` and `DEFAULT` are the cheapest data-quality tool there is: a bad row is rejected at the door instead of discovered in a report three months later.

### Relationships

- **One-to-many** (one customer, many orders): the foreign key goes on the "many" side, `orders.customer_id`.
- **Many-to-many** (an order has many products, a product is in many orders): needs a **junction table**. `order_items` is exactly that: its primary key is the pair `(order_id, product_id)`.
- **One-to-one** is rare: usually a table split in two to move large or sensitive columns away from the main one.

<figure class="dia"><svg viewBox="0 0 720 310" role="img" aria-label="Entity-relationship diagram of the practice schema: customers one-to-many orders, orders one-to-many order_items, products one-to-many order_items">
<rect class="sB" x="20" y="40" width="160" height="112" rx="8"/><text class="sT" x="100" y="60" text-anchor="middle">customers</text><line class="sN" x1="20" y1="68" x2="180" y2="68"/>
<text class="sM" x="32" y="88">customer_id PK</text><text class="sC" x="32" y="106">name</text><text class="sC" x="32" y="124">city</text><text class="sC" x="32" y="142">signup_date</text>
<rect class="sB" x="270" y="40" width="160" height="112" rx="8"/><text class="sT" x="350" y="60" text-anchor="middle">orders</text><line class="sN" x1="270" y1="68" x2="430" y2="68"/>
<text class="sM" x="282" y="88">order_id PK</text><text class="sC" x="282" y="106">customer_id FK</text><text class="sC" x="282" y="124">order_date</text><text class="sC" x="282" y="142">status</text>
<rect class="sA" x="520" y="40" width="180" height="112" rx="8"/><text class="sT" x="610" y="60" text-anchor="middle">order_items</text><line class="sN" x1="520" y1="68" x2="700" y2="68"/>
<text class="sM" x="532" y="88">order_id PK, FK</text><text class="sM" x="532" y="106">product_id PK, FK</text><text class="sC" x="532" y="124">quantity</text><text class="sC" x="532" y="142">unit_price</text>
<rect class="sB" x="520" y="190" width="180" height="112" rx="8"/><text class="sT" x="610" y="210" text-anchor="middle">products</text><line class="sN" x1="520" y1="218" x2="700" y2="218"/>
<text class="sM" x="532" y="238">product_id PK</text><text class="sC" x="532" y="256">name</text><text class="sC" x="532" y="274">category</text><text class="sC" x="532" y="292">unit_price</text>
<line class="sL" x1="180" y1="100" x2="270" y2="100"/><line class="sL" x1="190" y1="92" x2="190" y2="108"/><path class="sL" d="M256 100 L270 92 M256 100 L270 108"/><text class="sC" x="196" y="90">1</text><text class="sC" x="248" y="90">N</text>
<line class="sL" x1="430" y1="100" x2="520" y2="100"/><line class="sL" x1="440" y1="92" x2="440" y2="108"/><path class="sL" d="M506 100 L520 92 M506 100 L520 108"/><text class="sC" x="446" y="90">1</text><text class="sC" x="498" y="90">N</text>
<line class="sL" x1="610" y1="152" x2="610" y2="190"/><line class="sL" x1="602" y1="180" x2="618" y2="180"/><path class="sL" d="M610 166 L602 152 M610 166 L618 152"/><text class="sC" x="622" y="168">N</text><text class="sC" x="622" y="186">1</text>
<text class="sS" x="20" y="200">The bar marks the "one" side; the crow's foot marks "many".</text>
<text class="sS" x="20" y="224">order_items turns the many-to-many between orders and</text>
<text class="sS" x="20" y="242">products into two one-to-many relationships.</text>
<text class="sGt" x="20" y="272">Grain of order_items: one row per product in an order.</text>
</svg><figcaption>The practice schema as an entity-relationship diagram (crow's foot notation). Say each table's grain out loud before you join it.</figcaption></figure>

> [!term] Grain
> What exactly one row of a table represents. `orders` has one row per order; `order_items` has one row per product within an order. Stating the grain before you join or aggregate prevents most double-counting bugs ([[S3.4]]).

## S3.1 The relational model in two minutes 🟢

- A **table** (relation) holds **rows** (records) with the same **columns** (attributes), each with a type.
- A **primary key** uniquely identifies a row. A **foreign key** in one table references a primary key in another, and the database enforces it (**referential integrity**).
- **Normalisation** stores each fact once: a customer's city lives in `customers`, not repeated in every order. More in [[B6]].
- SQL is **declarative**: you describe the result and the **query optimiser** decides how to get it.

> [!term] Primary key / foreign key
> A primary key is a column (or set of columns) whose value is unique and not null for every row. A foreign key is a column whose values must match a primary key in another table, which is what links tables together.

## S3.2 SELECT, and the order SQL really runs in 🟢 ⭐

You **write** a query in this order, but the database **evaluates** it logically in a different one. Knowing the second order explains most beginner errors.

| Written | Logical evaluation order | Consequence |
|:-:|---|---|
| 5 | 1. `FROM` and `JOIN`s | Builds the working set of rows |
| — | 2. `WHERE` | Filters **rows**; can't see aliases from SELECT or aggregates |
| — | 3. `GROUP BY` | Collapses rows into groups |
| — | 4. `HAVING` | Filters **groups**; can use aggregates |
| 1 | 5. `SELECT` (window functions run here) | Computes output columns and aliases |
| — | 6. `DISTINCT` | Removes duplicate output rows |
| — | 7. `ORDER BY` | Sorts; *can* use SELECT aliases |
| — | 8. `LIMIT` / `OFFSET` / `TOP` / `FETCH` | Keeps a slice |

<figure class="dia steps"><svg viewBox="0 0 720 270" role="img" aria-label="Eight rows flowing through FROM, WHERE, GROUP BY, HAVING, SELECT, ORDER BY and LIMIT">
<text class="sM" x="51" y="22" text-anchor="middle">FROM</text><text class="sC" x="51" y="38" text-anchor="middle">8 rows</text>
<g><rect class="sA" x="8" y="48" width="86" height="15" rx="3"/><text class="sC" x="51" y="60" text-anchor="middle">Home 300</text>
<rect class="sG" x="8" y="66" width="86" height="15" rx="3"/><text class="sC" x="51" y="78" text-anchor="middle">Tech 900</text>
<rect class="sR" x="8" y="84" width="86" height="15" rx="3"/><text class="sC" x="51" y="96" text-anchor="middle">Home 200 ✕</text>
<rect class="sW" x="8" y="102" width="86" height="15" rx="3"/><text class="sC" x="51" y="114" text-anchor="middle">Books 50</text>
<rect class="sG" x="8" y="120" width="86" height="15" rx="3"/><text class="sC" x="51" y="132" text-anchor="middle">Tech 700</text>
<rect class="sW" x="8" y="138" width="86" height="15" rx="3"/><text class="sC" x="51" y="150" text-anchor="middle">Books 80</text>
<rect class="sA" x="8" y="156" width="86" height="15" rx="3"/><text class="sC" x="51" y="168" text-anchor="middle">Home 400</text>
<rect class="sR" x="8" y="174" width="86" height="15" rx="3"/><text class="sC" x="51" y="186" text-anchor="middle">Tech 500 ✕</text></g>
<g data-s="2"><line class="sLm" x1="96" y1="118" x2="108" y2="118" marker-end="url(#ahm)"/><text class="sM" x="153" y="22" text-anchor="middle">WHERE</text><text class="sC" x="153" y="38" text-anchor="middle">6 rows</text>
<rect class="sA" x="110" y="48" width="86" height="15" rx="3"/><text class="sC" x="153" y="60" text-anchor="middle">Home 300</text>
<rect class="sG" x="110" y="66" width="86" height="15" rx="3"/><text class="sC" x="153" y="78" text-anchor="middle">Tech 900</text>
<rect class="sW" x="110" y="84" width="86" height="15" rx="3"/><text class="sC" x="153" y="96" text-anchor="middle">Books 50</text>
<rect class="sG" x="110" y="102" width="86" height="15" rx="3"/><text class="sC" x="153" y="114" text-anchor="middle">Tech 700</text>
<rect class="sW" x="110" y="120" width="86" height="15" rx="3"/><text class="sC" x="153" y="132" text-anchor="middle">Books 80</text>
<rect class="sA" x="110" y="138" width="86" height="15" rx="3"/><text class="sC" x="153" y="150" text-anchor="middle">Home 400</text></g>
<g data-s="3"><line class="sLm" x1="198" y1="118" x2="210" y2="118" marker-end="url(#ahm)"/><text class="sM" x="255" y="22" text-anchor="middle">GROUP BY</text><text class="sC" x="255" y="38" text-anchor="middle">3 groups</text>
<rect class="sN" x="212" y="46" width="86" height="40" rx="4"/><rect class="sA" x="216" y="50" width="78" height="15" rx="3"/><text class="sC" x="255" y="62" text-anchor="middle">Home 300</text><rect class="sA" x="216" y="67" width="78" height="15" rx="3"/><text class="sC" x="255" y="79" text-anchor="middle">Home 400</text>
<rect class="sN" x="212" y="92" width="86" height="40" rx="4"/><rect class="sG" x="216" y="96" width="78" height="15" rx="3"/><text class="sC" x="255" y="108" text-anchor="middle">Tech 900</text><rect class="sG" x="216" y="113" width="78" height="15" rx="3"/><text class="sC" x="255" y="125" text-anchor="middle">Tech 700</text>
<rect class="sN" x="212" y="138" width="86" height="40" rx="4"/><rect class="sW" x="216" y="142" width="78" height="15" rx="3"/><text class="sC" x="255" y="154" text-anchor="middle">Books 50</text><rect class="sW" x="216" y="159" width="78" height="15" rx="3"/><text class="sC" x="255" y="171" text-anchor="middle">Books 80</text></g>
<g data-s="4"><line class="sLm" x1="300" y1="118" x2="312" y2="118" marker-end="url(#ahm)"/><text class="sM" x="357" y="22" text-anchor="middle">HAVING</text><text class="sC" x="357" y="38" text-anchor="middle">SUM &gt; 200</text>
<rect class="sA" x="314" y="56" width="86" height="22" rx="4"/><text class="sC" x="357" y="71" text-anchor="middle">Home Σ700</text>
<rect class="sG" x="314" y="102" width="86" height="22" rx="4"/><text class="sC" x="357" y="117" text-anchor="middle">Tech Σ1600</text>
<rect class="sR" x="314" y="148" width="86" height="22" rx="4" opacity=".5"/><text class="sC" x="357" y="163" text-anchor="middle">Books Σ130 ✕</text></g>
<g data-s="5"><line class="sLm" x1="402" y1="118" x2="414" y2="118" marker-end="url(#ahm)"/><text class="sM" x="459" y="22" text-anchor="middle">SELECT</text><text class="sC" x="459" y="38" text-anchor="middle">revenue = SUM</text>
<rect class="sA" x="416" y="56" width="86" height="22" rx="4"/><text class="sC" x="459" y="71" text-anchor="middle">Home | 700</text>
<rect class="sG" x="416" y="102" width="86" height="22" rx="4"/><text class="sC" x="459" y="117" text-anchor="middle">Tech | 1600</text></g>
<g data-s="6"><line class="sLm" x1="504" y1="118" x2="516" y2="118" marker-end="url(#ahm)"/><text class="sM" x="561" y="22" text-anchor="middle">ORDER BY</text><text class="sC" x="561" y="38" text-anchor="middle">revenue DESC</text>
<rect class="sG" x="518" y="56" width="86" height="22" rx="4"/><text class="sC" x="561" y="71" text-anchor="middle">Tech | 1600</text>
<rect class="sA" x="518" y="102" width="86" height="22" rx="4"/><text class="sC" x="561" y="117" text-anchor="middle">Home | 700</text></g>
<g data-s="7"><line class="sLm" x1="606" y1="118" x2="618" y2="118" marker-end="url(#ahm)"/><text class="sM" x="663" y="22" text-anchor="middle">LIMIT 1</text><text class="sC" x="663" y="38" text-anchor="middle">top row</text>
<rect class="sG" x="620" y="56" width="86" height="22" rx="4"/><text class="sC" x="663" y="71" text-anchor="middle">Tech | 1600</text></g>
<text class="sS" x="8" y="222">You write: SELECT · FROM · WHERE · GROUP BY · HAVING · ORDER BY · LIMIT</text>
<text class="sS" x="8" y="242">It runs: FROM → WHERE → GROUP BY → HAVING → SELECT → ORDER BY → LIMIT</text>
<rect class="sR" x="8" y="252" width="12" height="10" rx="2"/><text class="sC" x="26" y="261">status = 'refunded'</text>
</svg><ol class="dia-steps">
<li><code>FROM</code> (and any joins) builds the working set: eight order lines, two of them refunded.</li>
<li><code>WHERE status = 'paid'</code> removes individual rows. It can't use <code>revenue</code> yet, because that alias doesn't exist until SELECT.</li>
<li><code>GROUP BY category</code> collapses the rows into one group per category.</li>
<li><code>HAVING SUM(amount) &gt; 200</code> filters whole groups, using an aggregate. Books (130) is dropped.</li>
<li><code>SELECT</code> computes the output columns and names the alias <code>revenue</code>.</li>
<li><code>ORDER BY revenue DESC</code> sorts, and can use the alias, because SELECT has already run.</li>
<li><code>LIMIT</code> (or <code>TOP</code>, <code>FETCH FIRST</code>) keeps a slice of the sorted result.</li>
</ol><figcaption>The logical order, on real rows. The optimiser may physically do things in another order, but the result is always as if it ran like this.</figcaption></figure>

```sql
-- Revenue per category in 2026, only categories above 10,000, biggest first
SELECT p.category,
       SUM(oi.quantity * oi.unit_price) AS revenue
FROM   order_items oi
JOIN   orders   o ON o.order_id   = oi.order_id
JOIN   products p ON p.product_id = oi.product_id
WHERE  o.status = 'paid'
  AND  o.order_date >= '2026-01-01' AND o.order_date < '2027-01-01'
GROUP  BY p.category
HAVING SUM(oi.quantity * oi.unit_price) > 10000
ORDER  BY revenue DESC;
```

> [!mistake] Using an alias in WHERE
> `WHERE revenue > 10000` fails because WHERE runs before SELECT creates the alias. Repeat the expression, use HAVING for aggregates, or wrap the query in a CTE.

> [!tip] Date ranges
> Prefer `order_date >= '2026-01-01' AND order_date < '2027-01-01'` over `YEAR(order_date) = 2026`. Wrapping the column in a function usually stops the database from using an index on it, and the half-open range also handles timestamps correctly.

> [!say]
> "WHERE filters rows before grouping, HAVING filters groups after aggregation. SQL logically runs FROM, WHERE, GROUP BY, HAVING, SELECT, then ORDER BY, which is why a SELECT alias works in ORDER BY but not in WHERE."

## S3.3 NULL and three-valued logic 🟢 ⭐

`NULL` means **unknown or missing**, not zero and not empty. Any comparison with NULL gives **UNKNOWN**, and WHERE keeps only rows where the condition is TRUE.

| Expression | Result |
|---|---|
| `NULL = NULL` | UNKNOWN (so use `IS NULL`) |
| `NULL <> 5` | UNKNOWN |
| `NULL + 10` | NULL |
| `COUNT(*)` | Counts rows, NULLs included |
| `COUNT(col)` | Counts non-NULL values of `col` |
| `SUM(col)`, `AVG(col)` | Ignore NULLs; `AVG` divides by the non-NULL count |
| `COALESCE(col, 0)` | First non-NULL argument (standard; SQL Server also has `ISNULL`) |
| `NULLIF(a, b)` | NULL if a = b, which is handy to avoid division by zero: `x / NULLIF(y, 0)` |

<figure class="dia"><svg viewBox="0 0 720 238" role="img" aria-label="Three-valued logic truth tables for AND and OR with TRUE, UNKNOWN and FALSE, and aggregates over a column holding 10, NULL, 30, NULL and 20: COUNT(*) is 5, COUNT(col) 3, SUM 60, AVG 20, and AVG of COALESCE(col, 0) is 12">
<text class="sT" x="134" y="22" text-anchor="middle">a AND b</text><text class="sS" x="114" y="44" text-anchor="middle">TRUE</text><text class="sS" x="76" y="68" text-anchor="end">TRUE</text><text class="sS" x="180" y="44" text-anchor="middle">UNKNOWN</text><text class="sS" x="76" y="98" text-anchor="end">UNKNOWN</text><text class="sS" x="246" y="44" text-anchor="middle">FALSE</text><text class="sS" x="76" y="128" text-anchor="end">FALSE</text><rect class="sG" x="84" y="52" width="60" height="26" rx="4" opacity=".75"/><text class="sC" x="114" y="70" text-anchor="middle">TRUE</text><rect class="sW" x="150" y="52" width="60" height="26" rx="4" opacity=".75"/><text class="sC" x="180" y="70" text-anchor="middle">UNKNOWN</text><rect class="sN" x="216" y="52" width="60" height="26" rx="4" opacity=".75"/><text class="sC" x="246" y="70" text-anchor="middle">FALSE</text><rect class="sW" x="84" y="82" width="60" height="26" rx="4" opacity=".75"/><text class="sC" x="114" y="100" text-anchor="middle">UNKNOWN</text><rect class="sW" x="150" y="82" width="60" height="26" rx="4" opacity=".75"/><text class="sC" x="180" y="100" text-anchor="middle">UNKNOWN</text><rect class="sN" x="216" y="82" width="60" height="26" rx="4" opacity=".75"/><text class="sC" x="246" y="100" text-anchor="middle">FALSE</text><rect class="sN" x="84" y="112" width="60" height="26" rx="4" opacity=".75"/><text class="sC" x="114" y="130" text-anchor="middle">FALSE</text><rect class="sN" x="150" y="112" width="60" height="26" rx="4" opacity=".75"/><text class="sC" x="180" y="130" text-anchor="middle">FALSE</text><rect class="sN" x="216" y="112" width="60" height="26" rx="4" opacity=".75"/><text class="sC" x="246" y="130" text-anchor="middle">FALSE</text><text class="sT" x="410" y="22" text-anchor="middle">a OR b</text><text class="sS" x="390" y="44" text-anchor="middle">TRUE</text><text class="sS" x="352" y="68" text-anchor="end">TRUE</text><text class="sS" x="456" y="44" text-anchor="middle">UNKNOWN</text><text class="sS" x="352" y="98" text-anchor="end">UNKNOWN</text><text class="sS" x="522" y="44" text-anchor="middle">FALSE</text><text class="sS" x="352" y="128" text-anchor="end">FALSE</text><rect class="sG" x="360" y="52" width="60" height="26" rx="4" opacity=".75"/><text class="sC" x="390" y="70" text-anchor="middle">TRUE</text><rect class="sG" x="426" y="52" width="60" height="26" rx="4" opacity=".75"/><text class="sC" x="456" y="70" text-anchor="middle">TRUE</text><rect class="sG" x="492" y="52" width="60" height="26" rx="4" opacity=".75"/><text class="sC" x="522" y="70" text-anchor="middle">TRUE</text><rect class="sG" x="360" y="82" width="60" height="26" rx="4" opacity=".75"/><text class="sC" x="390" y="100" text-anchor="middle">TRUE</text><rect class="sW" x="426" y="82" width="60" height="26" rx="4" opacity=".75"/><text class="sC" x="456" y="100" text-anchor="middle">UNKNOWN</text><rect class="sW" x="492" y="82" width="60" height="26" rx="4" opacity=".75"/><text class="sC" x="522" y="100" text-anchor="middle">UNKNOWN</text><rect class="sG" x="360" y="112" width="60" height="26" rx="4" opacity=".75"/><text class="sC" x="390" y="130" text-anchor="middle">TRUE</text><rect class="sW" x="426" y="112" width="60" height="26" rx="4" opacity=".75"/><text class="sC" x="456" y="130" text-anchor="middle">UNKNOWN</text><rect class="sN" x="492" y="112" width="60" height="26" rx="4" opacity=".75"/><text class="sC" x="522" y="130" text-anchor="middle">FALSE</text>
<rect class="sN" x="574" y="52" width="132" height="86" rx="8"/><text class="sC" x="640" y="72" text-anchor="middle">NOT UNKNOWN</text><text class="sC" x="640" y="90" text-anchor="middle">= UNKNOWN</text><text class="sS" x="640" y="118" text-anchor="middle">WHERE keeps</text><text class="sGt" x="640" y="132" text-anchor="middle">TRUE rows only</text>
<text class="sM" x="14" y="172">col:</text>
<rect class="sB" x="56" y="158" width="44" height="24" rx="4"/><text class="sC" x="78" y="175" text-anchor="middle">10</text>
<rect class="sW" x="106" y="158" width="44" height="24" rx="4"/><text class="sC" x="128" y="175" text-anchor="middle">NULL</text>
<rect class="sB" x="156" y="158" width="44" height="24" rx="4"/><text class="sC" x="178" y="175" text-anchor="middle">30</text>
<rect class="sW" x="206" y="158" width="44" height="24" rx="4"/><text class="sC" x="228" y="175" text-anchor="middle">NULL</text>
<rect class="sB" x="256" y="158" width="44" height="24" rx="4"/><text class="sC" x="278" y="175" text-anchor="middle">20</text>
<text class="sS" x="330" y="164" xml:space="preserve" style="white-space:pre">COUNT(*)</text><text class="sGt" x="334" y="182">= 5</text>
<text class="sS" x="424" y="164" xml:space="preserve" style="white-space:pre">COUNT(col)</text><text class="sGt" x="428" y="182">= 3</text>
<text class="sS" x="518" y="164" xml:space="preserve" style="white-space:pre">SUM(col)</text><text class="sGt" x="522" y="182">= 60</text>
<text class="sS" x="612" y="164" xml:space="preserve" style="white-space:pre">AVG(col)</text><text class="sGt" x="616" y="182">= 20</text>
<text class="sS" x="330" y="204" xml:space="preserve" style="white-space:pre">AVG(COALESCE(col, 0))</text><text class="sWt" x="484" y="204">= 12  (a different question)</text>
<text class="sS" x="360" y="226" text-anchor="middle">aggregates skip NULLs: AVG divides by 3, not 5; decide explicitly whether a missing value means zero</text>
</svg><figcaption>NULL makes logic three-valued and aggregates selective. FALSE AND anything is FALSE; TRUE OR anything is TRUE; everything else involving UNKNOWN stays UNKNOWN. Computed.</figcaption></figure>

> [!mistake] NOT IN with a NULL in the list
> `WHERE customer_id NOT IN (SELECT customer_id FROM blocked)` returns **no rows at all** if `blocked.customer_id` contains a single NULL, because `x <> NULL` is UNKNOWN. Use `NOT EXISTS`, which doesn't have this trap.

```sql
-- Customers who have never ordered (anti-join), NULL-safe
SELECT c.*
FROM   customers c
WHERE  NOT EXISTS (SELECT 1 FROM orders o WHERE o.customer_id = c.customer_id);
```

<figure class="dia steps"><svg viewBox="0 0 720 236" role="img" aria-label="NOT IN against a list containing NULL: each customer's comparison with NULL is UNKNOWN, so the AND is never TRUE and every row is dropped, even customers 1 and 3 who are not blocked; NOT EXISTS avoids the trap">
<text class="sM" x="14" y="22">blocked.customer_id:</text><rect class="sB" x="170" y="8" width="40" height="22" rx="4"/><text class="sC" x="190" y="24" text-anchor="middle">2</text><rect class="sW" x="216" y="8" width="50" height="22" rx="4"/><text class="sC" x="241" y="24" text-anchor="middle">NULL</text>
<text class="sC" x="14" y="52" xml:space="preserve" style="white-space:pre">WHERE customer_id NOT IN (2, NULL)</text>
<text class="sS" x="14" y="72" xml:space="preserve" style="white-space:pre">  ≡  customer_id &lt;&gt; 2 AND customer_id &lt;&gt; NULL</text>
<rect class="sN" x="14" y="92" width="90" height="26" rx="4"/><text class="sC" x="59" y="110" text-anchor="middle">customer 1</text>
<g data-s="1"><text class="sC" x="118" y="110">1 &lt;&gt; 2 → TRUE</text></g>
<g data-s="2"><text class="sWt" x="270" y="110">1 &lt;&gt; NULL → UNKNOWN</text></g>
<g data-s="3"><text class="sRt" x="470" y="110">AND → UNKNOWN</text><text class="sRt" x="600" y="110">✗ dropped</text></g>
<rect class="sN" x="14" y="126" width="90" height="26" rx="4"/><text class="sC" x="59" y="144" text-anchor="middle">customer 2</text>
<g data-s="1"><text class="sC" x="118" y="144">2 &lt;&gt; 2 → FALSE</text></g>
<g data-s="2"><text class="sWt" x="270" y="144">2 &lt;&gt; NULL → UNKNOWN</text></g>
<g data-s="3"><text class="sRt" x="470" y="144">AND → FALSE</text><text class="sRt" x="600" y="144">✗ dropped</text></g>
<rect class="sN" x="14" y="160" width="90" height="26" rx="4"/><text class="sC" x="59" y="178" text-anchor="middle">customer 3</text>
<g data-s="1"><text class="sC" x="118" y="178">3 &lt;&gt; 2 → TRUE</text></g>
<g data-s="2"><text class="sWt" x="270" y="178">3 &lt;&gt; NULL → UNKNOWN</text></g>
<g data-s="3"><text class="sRt" x="470" y="178">AND → UNKNOWN</text><text class="sRt" x="600" y="178">✗ dropped</text></g>
<g data-s="4"><rect class="sG" x="14" y="196" width="692" height="30" rx="6" opacity=".35"/><text class="sC" x="24" y="216" xml:space="preserve" style="white-space:pre">WHERE NOT EXISTS (SELECT 1 FROM blocked b WHERE b.customer_id = c.customer_id)</text></g>
</svg><ol class="dia-steps">
<li>NOT IN expands to a chain of <code>&lt;&gt;</code> comparisons joined by AND. Customers 1 and 3 are not 2, so their first test is TRUE.</li>
<li>But every customer is also compared with the NULL in the list, and <code>x &lt;&gt; NULL</code> is UNKNOWN.</li>
<li>TRUE AND UNKNOWN is UNKNOWN, and WHERE keeps only TRUE: <b>every</b> row disappears, not just customer 2. No error, just an empty result.</li>
<li>NOT EXISTS asks "is there a matching row?", which is TRUE or FALSE, never UNKNOWN. Use it for anti-joins.</li>
</ol><figcaption>The NOT IN trap: one NULL in the subquery empties the whole result.</figcaption></figure>

## S3.4 Joins 🟢 ⭐

<figure class="dia"><svg viewBox="0 0 720 190" role="img" aria-label="Venn-style summary of inner, left, full and anti joins">
<g transform="translate(20,20)"><circle class="sB" cx="50" cy="60" r="45"/><circle class="sB" cx="100" cy="60" r="45"/><path class="sA" d="M75 22.6 A45 45 0 0 0 75 97.4 A45 45 0 0 0 75 22.6Z"/><text class="sT" x="75" y="140" text-anchor="middle">INNER</text><text class="sS" x="75" y="158" text-anchor="middle">matches only</text></g>
<g transform="translate(200,20)"><circle class="sA" cx="50" cy="60" r="45"/><circle class="sB" cx="100" cy="60" r="45" fill-opacity="0.4"/><text class="sT" x="75" y="140" text-anchor="middle">LEFT</text><text class="sS" x="75" y="158" text-anchor="middle">all left + matches</text></g>
<g transform="translate(380,20)"><circle class="sA" cx="50" cy="60" r="45"/><circle class="sA" cx="100" cy="60" r="45"/><text class="sT" x="75" y="140" text-anchor="middle">FULL OUTER</text><text class="sS" x="75" y="158" text-anchor="middle">everything</text></g>
<g transform="translate(560,20)"><circle class="sA" cx="50" cy="60" r="45"/><circle class="sB" cx="100" cy="60" r="45"/><text class="sT" x="75" y="140" text-anchor="middle">LEFT ANTI</text><text class="sS" x="75" y="158" text-anchor="middle">left with no match</text></g>
</svg><figcaption>A useful picture for the idea, though not literally accurate: joins match rows on a condition and can multiply rows; they don't intersect sets of identical items.</figcaption></figure>

A join doesn't intersect two sets; it **matches rows** on a condition and returns one output row per match. Walk through the four results below on three customers and three orders, and watch Ana appear twice.

<figure class="dia steps" data-start="1"><svg viewBox="0 0 720 220" role="img" aria-label="Three customers and three orders, and the result of an inner join, a left join, an anti-join and a semi-join">
<text class="sT" x="105" y="34" text-anchor="middle">customers</text>
<rect class="sB" x="20" y="44" width="170" height="24" rx="4"/><text class="sC" x="30" y="61">1 · Ana</text>
<rect class="sB" x="20" y="72" width="170" height="24" rx="4"/><text class="sC" x="30" y="89">2 · Ben</text>
<rect class="sB" x="20" y="100" width="170" height="24" rx="4"/><text class="sC" x="30" y="117">3 · Cy</text><text class="sRt" x="120" y="117">no orders</text>
<text class="sT" x="335" y="34" text-anchor="middle">orders</text>
<rect class="sB" x="250" y="44" width="170" height="24" rx="4"/><text class="sC" x="260" y="61">o1 · customer 1</text>
<rect class="sB" x="250" y="72" width="170" height="24" rx="4"/><text class="sC" x="260" y="89">o2 · customer 1</text>
<rect class="sB" x="250" y="100" width="170" height="24" rx="4"/><text class="sC" x="260" y="117">o3 · customer 2</text>
<line class="sL" x1="190" y1="56" x2="250" y2="56"/><line class="sL" x1="190" y1="56" x2="250" y2="84"/><line class="sL" x1="190" y1="84" x2="250" y2="112"/>
<g data-s="1-1"><text class="sT" x="590" y="34" text-anchor="middle">INNER JOIN → 3 rows</text>
<rect class="sA" x="480" y="44" width="220" height="24" rx="4"/><text class="sC" x="490" y="61">Ana · o1</text><rect class="sA" x="480" y="72" width="220" height="24" rx="4"/><text class="sC" x="490" y="89">Ana · o2</text><rect class="sA" x="480" y="100" width="220" height="24" rx="4"/><text class="sC" x="490" y="117">Ben · o3</text>
<text class="sM" x="20" y="170">FROM customers c JOIN orders o ON o.customer_id = c.customer_id</text></g>
<g data-s="2-2"><text class="sT" x="590" y="34" text-anchor="middle">LEFT JOIN → 4 rows</text>
<rect class="sA" x="480" y="44" width="220" height="24" rx="4"/><text class="sC" x="490" y="61">Ana · o1</text><rect class="sA" x="480" y="72" width="220" height="24" rx="4"/><text class="sC" x="490" y="89">Ana · o2</text><rect class="sA" x="480" y="100" width="220" height="24" rx="4"/><text class="sC" x="490" y="117">Ben · o3</text><rect class="sW" x="480" y="128" width="220" height="24" rx="4"/><text class="sC" x="490" y="145">Cy · NULL</text>
<text class="sM" x="20" y="170">FROM customers c LEFT JOIN orders o ON o.customer_id = c.customer_id</text></g>
<g data-s="3-3"><text class="sT" x="590" y="34" text-anchor="middle">Anti-join → 1 row</text>
<rect class="sW" x="480" y="44" width="220" height="24" rx="4"/><text class="sC" x="490" y="61">Cy</text>
<text class="sM" x="20" y="170">WHERE NOT EXISTS (SELECT 1 FROM orders o WHERE o.customer_id = c.customer_id)</text></g>
<g data-s="4-4"><text class="sT" x="590" y="34" text-anchor="middle">Semi-join → 2 rows</text>
<rect class="sG" x="480" y="44" width="220" height="24" rx="4"/><text class="sC" x="490" y="61">Ana</text><rect class="sG" x="480" y="72" width="220" height="24" rx="4"/><text class="sC" x="490" y="89">Ben</text>
<text class="sM" x="20" y="170">WHERE EXISTS (SELECT 1 FROM orders o WHERE o.customer_id = c.customer_id)</text></g>
<text class="sS" x="20" y="200">Lines are matches on customer_id. Each match becomes one output row.</text>
</svg><ol class="dia-steps">
<li>Inner join: one row per match. Ana has two orders, so she appears twice: this is fan-out, and summing a customer-level column now counts Ana twice. Cy has no match and disappears.</li>
<li>Left join: every customer survives. Cy gets NULLs in the order columns.</li>
<li>Anti-join: only customers with no match. Cy, the customer who never ordered.</li>
<li>Semi-join: customers with at least one match, each exactly once, however many orders they have. No fan-out.</li>
</ol><figcaption>Joins match rows. The number of output rows depends on how many matches each row has, not on the size of either table.</figcaption></figure>

| Join | Returns | Typical question it answers |
|---|---|---|
| `INNER JOIN` | Rows with a match on both sides | Orders with their customers |
| `LEFT JOIN` | Every left row; right columns NULL where there's no match | All customers, with orders if any |
| `RIGHT JOIN` | Mirror of LEFT (rarely used; swap the tables instead) | — |
| `FULL OUTER JOIN` | Everything from both sides | Reconciling two systems' records |
| `CROSS JOIN` | Every combination (rows × rows) | Building a date × product grid to fill gaps |
| Self join | A table joined to itself | Employee and their manager in the same table |
| Anti-join (`LEFT JOIN … WHERE right.key IS NULL`, or `NOT EXISTS`) | Left rows with no match | Customers who never ordered |
| Semi-join (`EXISTS`, `IN`) | Left rows that have at least one match, **without duplicating** them | Customers who ordered at least once |

> [!mistake] Filtering the right table in WHERE after a LEFT JOIN
> ```sql
> SELECT c.name, o.order_id
> FROM customers c LEFT JOIN orders o ON o.customer_id = c.customer_id
> WHERE o.status = 'paid';          -- silently turns it into an INNER JOIN
> ```
> Customers without orders have `o.status = NULL`, which fails the WHERE. Put the condition in the `ON` clause (`ON o.customer_id = c.customer_id AND o.status = 'paid'`) to keep every customer.

> [!mistake] Join fan-out
> Joining `orders` to `order_items` gives **one row per item**. If you then `SUM(o.shipping_fee)`, each order's fee is counted once per item. Aggregate at the right grain first (in a CTE), then join.

> [!say]
> "An inner join keeps only matching rows; a left join keeps every row from the left table and fills the right side with NULLs where nothing matches. To find rows with no match I use NOT EXISTS, or a left join and filter where the right key is null."

## S3.5 Aggregation and GROUP BY 🟢 ⭐

Every column in SELECT must either be in GROUP BY or inside an aggregate (`COUNT`, `SUM`, `AVG`, `MIN`, `MAX`).

```sql
-- Orders and spend per customer, including customers with none
SELECT c.customer_id, c.name,
       COUNT(o.order_id)                       AS orders,      -- COUNT(col) → 0 for no orders
       COALESCE(SUM(oi.quantity*oi.unit_price), 0) AS spend
FROM   customers c
LEFT   JOIN orders o       ON o.customer_id = c.customer_id AND o.status = 'paid'
LEFT   JOIN order_items oi ON oi.order_id   = o.order_id
GROUP  BY c.customer_id, c.name;
```

Careful: here `COUNT(o.order_id)` counts **items**, not orders, because of fan-out. The correct count is `COUNT(DISTINCT o.order_id)`. Spotting that is exactly what an interviewer hopes you'll do.

**Conditional aggregation** (pivoting with CASE) is one of the most useful patterns in analytics:

```sql
SELECT customer_id,
       COUNT(*)                                          AS all_orders,
       SUM(CASE WHEN status = 'refunded' THEN 1 ELSE 0 END) AS refunded,
       AVG(CASE WHEN status = 'refunded' THEN 1.0 ELSE 0 END) AS refund_rate
FROM   orders
GROUP  BY customer_id;
```

<figure class="dia steps"><svg viewBox="0 0 720 250" role="img" aria-label="Conditional aggregation: eight orders become a column of refund flags, which GROUP BY turns into one row per customer with all orders, refunded and refund rate 0.25, 0.50 and 0.00; dividing the integer sum by the integer count instead returns 0 for every customer">
<rect class="sN" x="14" y="26" width="72" height="20" rx="3"/><text class="sT" x="50" y="40" text-anchor="middle">order_id</text><rect class="sN" x="88" y="26" width="80" height="20" rx="3"/><text class="sT" x="128" y="40" text-anchor="middle">customer</text><rect class="sN" x="170" y="26" width="80" height="20" rx="3"/><text class="sT" x="210" y="40" text-anchor="middle">status</text>
<rect class="sB" x="88" y="49" width="80" height="19" rx="3" opacity=".45"/>
<text class="sS" x="50" y="63" text-anchor="middle">101</text><text class="sS" x="128" y="63" text-anchor="middle">1</text><text class="sS" x="210" y="63" text-anchor="middle">paid</text>
<rect class="sB" x="88" y="71" width="80" height="19" rx="3" opacity=".45"/>
<text class="sS" x="50" y="85" text-anchor="middle">102</text><text class="sS" x="128" y="85" text-anchor="middle">1</text><text class="sRt" x="210" y="85" text-anchor="middle">refunded</text>
<rect class="sB" x="88" y="93" width="80" height="19" rx="3" opacity=".45"/>
<text class="sS" x="50" y="107" text-anchor="middle">103</text><text class="sS" x="128" y="107" text-anchor="middle">1</text><text class="sS" x="210" y="107" text-anchor="middle">paid</text>
<rect class="sB" x="88" y="115" width="80" height="19" rx="3" opacity=".45"/>
<text class="sS" x="50" y="129" text-anchor="middle">104</text><text class="sS" x="128" y="129" text-anchor="middle">1</text><text class="sS" x="210" y="129" text-anchor="middle">paid</text>
<rect class="sV" x="88" y="137" width="80" height="19" rx="3" opacity=".45"/>
<text class="sS" x="50" y="151" text-anchor="middle">105</text><text class="sS" x="128" y="151" text-anchor="middle">2</text><text class="sRt" x="210" y="151" text-anchor="middle">refunded</text>
<rect class="sV" x="88" y="159" width="80" height="19" rx="3" opacity=".45"/>
<text class="sS" x="50" y="173" text-anchor="middle">106</text><text class="sS" x="128" y="173" text-anchor="middle">2</text><text class="sS" x="210" y="173" text-anchor="middle">paid</text>
<rect class="sA" x="88" y="181" width="80" height="19" rx="3" opacity=".45"/>
<text class="sS" x="50" y="195" text-anchor="middle">107</text><text class="sS" x="128" y="195" text-anchor="middle">3</text><text class="sS" x="210" y="195" text-anchor="middle">paid</text>
<rect class="sA" x="88" y="203" width="80" height="19" rx="3" opacity=".45"/>
<text class="sS" x="50" y="217" text-anchor="middle">108</text><text class="sS" x="128" y="217" text-anchor="middle">3</text><text class="sS" x="210" y="217" text-anchor="middle">paid</text>
<g data-s="2"><rect class="sN" x="262" y="26" width="74" height="20" rx="3"/><text class="sT" x="299" y="40" text-anchor="middle">CASE…</text><text class="sS" x="299" y="63" text-anchor="middle">0</text><text class="sRt" x="299" y="85" text-anchor="middle">1</text><text class="sS" x="299" y="107" text-anchor="middle">0</text><text class="sS" x="299" y="129" text-anchor="middle">0</text><text class="sRt" x="299" y="151" text-anchor="middle">1</text><text class="sS" x="299" y="173" text-anchor="middle">0</text><text class="sS" x="299" y="195" text-anchor="middle">0</text><text class="sS" x="299" y="217" text-anchor="middle">0</text><text class="sS" x="299" y="240" text-anchor="middle">1 if refunded</text></g>
<g data-s="3"><rect class="sN" x="372" y="26" width="78" height="20" rx="3"/><text class="sT" x="411" y="40" text-anchor="middle">customer</text><rect class="sN" x="452" y="26" width="78" height="20" rx="3"/><text class="sT" x="491" y="40" text-anchor="middle">all_orders</text><rect class="sN" x="532" y="26" width="88" height="20" rx="3"/><text class="sT" x="576" y="40" text-anchor="middle">refunded</text><rect class="sN" x="622" y="26" width="84" height="20" rx="3"/><text class="sT" x="664" y="40" text-anchor="middle">refund_rate</text><rect class="sB" x="372" y="56" width="78" height="34" rx="4" opacity=".45"/><text class="sT" x="411" y="78" text-anchor="middle">1</text><text class="sT" x="491" y="78" text-anchor="middle">4</text><text class="sT" x="576" y="78" text-anchor="middle">1</text><text class="sGt" x="664" y="78" text-anchor="middle">0.25</text><rect class="sV" x="372" y="96" width="78" height="34" rx="4" opacity=".45"/><text class="sT" x="411" y="118" text-anchor="middle">2</text><text class="sT" x="491" y="118" text-anchor="middle">2</text><text class="sT" x="576" y="118" text-anchor="middle">1</text><text class="sGt" x="664" y="118" text-anchor="middle">0.50</text><rect class="sA" x="372" y="136" width="78" height="34" rx="4" opacity=".45"/><text class="sT" x="411" y="158" text-anchor="middle">3</text><text class="sT" x="491" y="158" text-anchor="middle">2</text><text class="sT" x="576" y="158" text-anchor="middle">0</text><text class="sGt" x="664" y="158" text-anchor="middle">0.00</text><line class="sLm" x1="342" y1="120" x2="368" y2="120" marker-end="url(#ahm)"/><text class="sS" x="538" y="190" text-anchor="middle">GROUP BY customer_id: 8 rows → 3 rows</text></g>
<g data-s="4"><rect class="sR" x="372" y="202" width="334" height="42" rx="6" opacity=".35"/><text class="sS" x="382" y="219" xml:space="preserve" style="white-space:pre">SUM(CASE … 1 ELSE 0 END) / COUNT(*)</text><text class="sRt" x="696" y="237" text-anchor="end">integer ÷ integer → 0, 0, 0</text></g>
</svg><ol class="dia-steps">
<li>Eight orders from three customers. Customer 1 has one refund in 4 orders.</li>
<li>CASE WHEN turns each row into a 1 or a 0: is this order refunded?</li>
<li>GROUP BY collapses each customer to one row. COUNT(*) counts orders, SUM of the flags counts refunds, AVG of the flags is the refund rate (0.25, 0.50, 0.00).</li>
<li>Divide the integer sum by the integer count yourself and every rate becomes 0 in SQL Server and PostgreSQL (and SQLite, which computed this figure). Write 1.0 or cast.</li>
</ol><figcaption>The conditional-aggregation query above, run in SQLite on eight rows: flag, group, aggregate, and the integer-division trap.</figcaption></figure>

> [!mistake] Integer division
> In SQL Server and PostgreSQL, `3 / 4` is `0`. Multiply by `1.0` or cast, as in the `refund_rate` above.

## S3.6 Subqueries and CTEs 🟢

A **subquery** is a query inside another. A **CTE** (common table expression, `WITH name AS (...)`) names a subquery so the main query reads top to bottom. Use CTEs to build answers in steps; interviewers read them far more easily.

```sql
WITH customer_spend AS (
    SELECT o.customer_id, SUM(oi.quantity*oi.unit_price) AS spend
    FROM   orders o JOIN order_items oi ON oi.order_id = o.order_id
    WHERE  o.status = 'paid'
    GROUP  BY o.customer_id
)
SELECT c.name, s.spend
FROM   customer_spend s JOIN customers c ON c.customer_id = s.customer_id
WHERE  s.spend > (SELECT AVG(spend) FROM customer_spend);   -- above-average spenders
```

> [!term] Correlated subquery
> A subquery that refers to the outer query's current row (like the `NOT EXISTS` in [[S3.3]]). Conceptually it runs once per outer row; optimisers usually turn it into a join.

> [!term] Recursive CTE
> A CTE that refers to itself, for walking hierarchies (an org chart, a category tree) or generating a series of dates. It has an anchor part, then `UNION ALL`, then the recursive part.

```sql
WITH RECURSIVE chain AS (
  SELECT id, name, 0 AS level FROM employees WHERE manager_id IS NULL      -- anchor
  UNION ALL
  SELECT e.id, e.name, c.level + 1 FROM employees e JOIN chain c ON e.manager_id = c.id
) SELECT id, name, level FROM chain ORDER BY level, id;
```

<figure class="dia steps"><svg viewBox="0 0 720 248" role="img" aria-label="A recursive CTE walking an org chart in SQLite: the anchor returns Hoda at level 0; each iteration joins employees to the previous level, adding Karim and Laila at level 1, Omar, Sara and Youssef at level 2, and Nour at level 3; the next iteration finds no rows and the recursion stops">
<g data-s="2"><line class="sLm" x1="250" y1="54" x2="160" y2="86"/></g>
<g data-s="2"><line class="sLm" x1="250" y1="54" x2="330" y2="86"/></g>
<g data-s="3"><line class="sLm" x1="160" y1="114" x2="112" y2="146"/></g>
<g data-s="3"><line class="sLm" x1="160" y1="114" x2="210" y2="146"/></g>
<g data-s="3"><line class="sLm" x1="330" y1="114" x2="330" y2="146"/></g>
<g data-s="4"><line class="sLm" x1="330" y1="174" x2="330" y2="206"/></g>
<g data-s="1"><rect class="sG" x="206" y="26" width="88" height="28" rx="6"/><text class="sT" x="250" y="45" text-anchor="middle">Hoda</text></g>
<g data-s="2"><rect class="sB" x="116" y="86" width="88" height="28" rx="6"/><text class="sT" x="160" y="105" text-anchor="middle">Karim</text></g>
<g data-s="2"><rect class="sB" x="286" y="86" width="88" height="28" rx="6"/><text class="sT" x="330" y="105" text-anchor="middle">Laila</text></g>
<g data-s="3"><rect class="sB" x="68" y="146" width="88" height="28" rx="6"/><text class="sT" x="112" y="165" text-anchor="middle">Omar</text></g>
<g data-s="3"><rect class="sB" x="166" y="146" width="88" height="28" rx="6"/><text class="sT" x="210" y="165" text-anchor="middle">Sara</text></g>
<g data-s="3"><rect class="sB" x="286" y="146" width="88" height="28" rx="6"/><text class="sT" x="330" y="165" text-anchor="middle">Youssef</text></g>
<g data-s="4"><rect class="sB" x="286" y="206" width="88" height="28" rx="6"/><text class="sT" x="330" y="225" text-anchor="middle">Nour</text></g>
<g data-s="1"><text class="sS" x="14" y="44">level 0</text></g>
<g data-s="2"><text class="sS" x="14" y="104">level 1</text></g>
<g data-s="3"><text class="sS" x="14" y="164">level 2</text></g>
<g data-s="4"><text class="sS" x="14" y="224">level 3</text></g>
<rect class="sN" x="400" y="20" width="306" height="220" rx="8"/><text class="sT" x="553" y="40" text-anchor="middle">chain (rows produced so far)</text>
<g data-s="1"><text class="sS" x="416" y="66" xml:space="preserve" style="white-space:pre">1  Hoda     level 0</text></g>
<g data-s="2"><text class="sS" x="416" y="88" xml:space="preserve" style="white-space:pre">2  Karim    level 1</text></g>
<g data-s="2"><text class="sS" x="416" y="110" xml:space="preserve" style="white-space:pre">3  Laila    level 1</text></g>
<g data-s="3"><text class="sS" x="416" y="132" xml:space="preserve" style="white-space:pre">4  Omar     level 2</text></g>
<g data-s="3"><text class="sS" x="416" y="154" xml:space="preserve" style="white-space:pre">5  Sara     level 2</text></g>
<g data-s="3"><text class="sS" x="416" y="176" xml:space="preserve" style="white-space:pre">6  Youssef  level 2</text></g>
<g data-s="4"><text class="sS" x="416" y="198" xml:space="preserve" style="white-space:pre">7  Nour     level 3</text></g>
<g data-s="5"><text class="sGt" x="553" y="232" text-anchor="middle">iteration 4 finds no new rows: stop</text></g>
</svg><ol class="dia-steps">
<li>The anchor runs once: the employee with no manager (level 0).</li>
<li>Iteration 1: join employees to the rows found in the previous iteration, adding level 1.</li>
<li>Iteration 2: join employees to the rows found in the previous iteration, adding level 2.</li>
<li>Iteration 3: join employees to the rows found in the previous iteration, adding level 3.</li>
<li>The next iteration returns nothing, so the CTE ends with all 7 employees and their depth.</li>
</ol><figcaption>WITH RECURSIVE, run in SQLite on a seven-person org chart: each iteration adds one level, until a level comes back empty.</figcaption></figure>

## S3.7 Window functions 🟢 🟡 ⭐

A window function computes a value **across related rows without collapsing them**, unlike GROUP BY. That makes "rank within group", "previous value" and "running total" easy.

```sql
function_name(...) OVER (
    PARTITION BY ...   -- restart for each group (optional)
    ORDER BY ...       -- order within the group
    ROWS BETWEEN ...   -- which rows the frame covers (optional)
)
```

| Function | Gives | Ties (values 100, 90, 90, 80) |
|---|---|---|
| `ROW_NUMBER()` | 1, 2, 3… always unique | 1, 2, 3, 4 (arbitrary order among ties) |
| `RANK()` | Rank with gaps after ties | 1, 2, 2, 4 |
| `DENSE_RANK()` | Rank without gaps | 1, 2, 2, 3 |
| `NTILE(4)` | Bucket number (quartiles) | — |
| `LAG(x, 1)` / `LEAD(x, 1)` | Previous / next row's value | — |
| `FIRST_VALUE(x)` / `LAST_VALUE(x)` | First / last in the frame | — |
| `SUM(x) OVER (...)`, `AVG(x) OVER (...)` | Running or moving aggregates | — |

<figure class="dia steps"><svg viewBox="0 0 720 260" role="img" aria-label="Window functions computed row by row: LAG, running total and a three-month moving average with its sliding frame">
<text class="sM" x="80" y="40" text-anchor="middle">month</text><text class="sM" x="190" y="40" text-anchor="middle">revenue</text><text class="sM" x="330" y="40" text-anchor="middle">LAG change</text><text class="sM" x="465" y="40" text-anchor="middle">running total</text><text class="sM" x="610" y="40" text-anchor="middle">3-month avg</text>
<g data-s="1-1"><rect class="sA" x="20" y="52" width="680" height="28" rx="4"/></g>
<g data-s="2-2"><rect class="sA" x="20" y="84" width="680" height="28" rx="4"/></g>
<g data-s="3-3"><rect class="sA" x="20" y="116" width="680" height="28" rx="4"/></g>
<g data-s="4-4"><rect class="sA" x="20" y="148" width="680" height="28" rx="4"/></g>
<g data-s="5-5"><rect class="sA" x="20" y="180" width="680" height="28" rx="4"/></g>
<g data-s="6-6"><rect class="sA" x="20" y="212" width="680" height="28" rx="4"/></g>
<line class="sN" x1="20" y1="82" x2="700" y2="82"/><line class="sN" x1="20" y1="114" x2="700" y2="114"/><line class="sN" x1="20" y1="146" x2="700" y2="146"/><line class="sN" x1="20" y1="178" x2="700" y2="178"/><line class="sN" x1="20" y1="210" x2="700" y2="210"/>
<text class="sC" x="80" y="71" text-anchor="middle">Jan</text><text class="sT" x="190" y="71" text-anchor="middle">100</text>
<text class="sC" x="80" y="103" text-anchor="middle">Feb</text><text class="sT" x="190" y="103" text-anchor="middle">120</text>
<text class="sC" x="80" y="135" text-anchor="middle">Mar</text><text class="sT" x="190" y="135" text-anchor="middle">90</text>
<text class="sC" x="80" y="167" text-anchor="middle">Apr</text><text class="sT" x="190" y="167" text-anchor="middle">150</text>
<text class="sC" x="80" y="199" text-anchor="middle">May</text><text class="sT" x="190" y="199" text-anchor="middle">130</text>
<text class="sC" x="80" y="231" text-anchor="middle">Jun</text><text class="sT" x="190" y="231" text-anchor="middle">170</text>
<g data-s="1-1"><line class="sLg" x1="150" y1="56" x2="150" y2="76"/><line class="sL" x1="232" y1="56" x2="232" y2="76"/></g>
<g data-s="2-2"><line class="sLg" x1="150" y1="56" x2="150" y2="108"/><line class="sL" x1="232" y1="56" x2="232" y2="108"/></g>
<g data-s="3-3"><line class="sLg" x1="150" y1="56" x2="150" y2="140"/><line class="sL" x1="232" y1="56" x2="232" y2="140"/></g>
<g data-s="4-4"><line class="sLg" x1="150" y1="56" x2="150" y2="172"/><line class="sL" x1="232" y1="88" x2="232" y2="172"/></g>
<g data-s="5-5"><line class="sLg" x1="150" y1="56" x2="150" y2="204"/><line class="sL" x1="232" y1="120" x2="232" y2="204"/></g>
<g data-s="6-6"><line class="sLg" x1="150" y1="56" x2="150" y2="236"/><line class="sL" x1="232" y1="152" x2="232" y2="236"/></g>
<g data-s="1"><text class="sC" x="330" y="71" text-anchor="middle">NULL</text><text class="sGt" x="465" y="71" text-anchor="middle">100</text><text class="sC" x="610" y="71" text-anchor="middle">100.0</text></g>
<g data-s="2"><text class="sC" x="330" y="103" text-anchor="middle">+20</text><text class="sGt" x="465" y="103" text-anchor="middle">220</text><text class="sC" x="610" y="103" text-anchor="middle">110.0</text></g>
<g data-s="3"><text class="sC" x="330" y="135" text-anchor="middle">−30</text><text class="sGt" x="465" y="135" text-anchor="middle">310</text><text class="sC" x="610" y="135" text-anchor="middle">103.3</text></g>
<g data-s="4"><text class="sC" x="330" y="167" text-anchor="middle">+60</text><text class="sGt" x="465" y="167" text-anchor="middle">460</text><text class="sC" x="610" y="167" text-anchor="middle">120.0</text></g>
<g data-s="5"><text class="sC" x="330" y="199" text-anchor="middle">−20</text><text class="sGt" x="465" y="199" text-anchor="middle">590</text><text class="sC" x="610" y="199" text-anchor="middle">123.3</text></g>
<g data-s="6"><text class="sC" x="330" y="231" text-anchor="middle">+40</text><text class="sGt" x="465" y="231" text-anchor="middle">760</text><text class="sC" x="610" y="231" text-anchor="middle">150.0</text></g>
</svg><ol class="dia-steps">
<li>January: there is no previous row, so <code>LAG</code> returns NULL. The running total (green bracket) and the average (blue bracket) both cover just this row.</li>
<li>February: <code>LAG</code> reads January, so the change is +20. The three-month frame only has two rows so far, so the average is (100 + 120) / 2 = 110.</li>
<li>March: the frame is full for the first time: (100 + 120 + 90) / 3 = 103.3.</li>
<li>April: the frame slides. January drops out: (120 + 90 + 150) / 3 = 120. The running total's frame never drops anything; it starts at the first row.</li>
<li>May: (90 + 150 + 130) / 3 = 123.3, running total 590.</li>
<li>June: (150 + 130 + 170) / 3 = 150, and the running total, 760, equals the sum of every row. All six rows are still there: a window never collapses rows.</li>
</ol><figcaption>One pass over the rows. <code>ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW</code> is the green bracket; <code>ROWS BETWEEN 2 PRECEDING AND CURRENT ROW</code> is the blue one.</figcaption></figure>

```sql
-- Month-over-month revenue change
WITH monthly AS (
    SELECT DATE_TRUNC('month', o.order_date) AS month,          -- SQL Server: DATETRUNC(month, ...) (2022+)
           SUM(oi.quantity*oi.unit_price)    AS revenue
    FROM   orders o JOIN order_items oi ON oi.order_id = o.order_id
    WHERE  o.status = 'paid'
    GROUP  BY DATE_TRUNC('month', o.order_date)
)
SELECT month, revenue,
       revenue - LAG(revenue) OVER (ORDER BY month)              AS change,
       SUM(revenue) OVER (ORDER BY month
                          ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS running_total,
       AVG(revenue) OVER (ORDER BY month
                          ROWS BETWEEN 2 PRECEDING AND CURRENT ROW) AS moving_avg_3m
FROM   monthly
ORDER  BY month;
```

> [!warning] The default frame
> With `ORDER BY` and no frame, the default is `RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW`. `RANGE` treats rows with equal ORDER BY values as one peer group, so tied dates are added together in one step. Write `ROWS BETWEEN ...` explicitly when you mean row by row. That's also why `LAST_VALUE` "doesn't work" without a frame ending at `UNBOUNDED FOLLOWING`.

> [!say]
> "Window functions compute across related rows without collapsing them. ROW_NUMBER is always unique, RANK leaves gaps after ties and DENSE_RANK doesn't. I use LAG for period-over-period changes and SUM OVER with an explicit ROWS frame for running totals."

## S3.8 Set operations, CASE and handy functions 🟢

| Operation | Meaning |
|---|---|
| `UNION` | Combine and **remove duplicates** (needs a sort or hash, so it's slower) |
| `UNION ALL` | Combine and keep everything (use it unless you need deduplication) |
| `INTERSECT` | Rows in both |
| `EXCEPT` (Oracle: `MINUS`) | Rows in the first but not the second |

<figure class="dia"><svg viewBox="0 0 720 238" role="img" aria-label="Two queries returning Cairo, Giza, Giza, Alex and Giza, Luxor combined four ways: UNION gives four distinct cities, UNION ALL all six rows, INTERSECT only Giza, and EXCEPT Alex and Cairo">
<text class="sT" x="64" y="22" text-anchor="middle">query A</text><text class="sS" x="64" y="38" text-anchor="middle">branch cities, 2025</text><rect class="sB" x="14" y="46" width="100" height="22" rx="4" opacity=".75"/><text class="sC" x="64" y="62" text-anchor="middle">Cairo</text><rect class="sG" x="14" y="72" width="100" height="22" rx="4" opacity=".75"/><text class="sC" x="64" y="88" text-anchor="middle">Giza</text><rect class="sG" x="14" y="98" width="100" height="22" rx="4" opacity=".75"/><text class="sC" x="64" y="114" text-anchor="middle">Giza</text><rect class="sA" x="14" y="124" width="100" height="22" rx="4" opacity=".75"/><text class="sC" x="64" y="140" text-anchor="middle">Alex</text><text class="sT" x="174" y="22" text-anchor="middle">query B</text><text class="sS" x="174" y="38" text-anchor="middle">2026</text><rect class="sG" x="124" y="46" width="100" height="22" rx="4" opacity=".75"/><text class="sC" x="174" y="62" text-anchor="middle">Giza</text><rect class="sV" x="124" y="72" width="100" height="22" rx="4" opacity=".75"/><text class="sC" x="174" y="88" text-anchor="middle">Luxor</text>
<line class="sD" x1="234" y1="20" x2="234" y2="206"/>
<text class="sT" x="298" y="22" text-anchor="middle">UNION</text><text class="sS" x="298" y="38" text-anchor="middle">4 rows</text><rect class="sA" x="248" y="46" width="100" height="22" rx="4" opacity=".75"/><text class="sC" x="298" y="62" text-anchor="middle">Alex</text><rect class="sB" x="248" y="72" width="100" height="22" rx="4" opacity=".75"/><text class="sC" x="298" y="88" text-anchor="middle">Cairo</text><rect class="sG" x="248" y="98" width="100" height="22" rx="4" opacity=".75"/><text class="sC" x="298" y="114" text-anchor="middle">Giza</text><rect class="sV" x="248" y="124" width="100" height="22" rx="4" opacity=".75"/><text class="sC" x="298" y="140" text-anchor="middle">Luxor</text>
<text class="sT" x="414" y="22" text-anchor="middle">UNION ALL</text><text class="sS" x="414" y="38" text-anchor="middle">6 rows</text><rect class="sB" x="364" y="46" width="100" height="22" rx="4" opacity=".75"/><text class="sC" x="414" y="62" text-anchor="middle">Cairo</text><rect class="sG" x="364" y="72" width="100" height="22" rx="4" opacity=".75"/><text class="sC" x="414" y="88" text-anchor="middle">Giza</text><rect class="sG" x="364" y="98" width="100" height="22" rx="4" opacity=".75"/><text class="sC" x="414" y="114" text-anchor="middle">Giza</text><rect class="sA" x="364" y="124" width="100" height="22" rx="4" opacity=".75"/><text class="sC" x="414" y="140" text-anchor="middle">Alex</text><rect class="sG" x="364" y="150" width="100" height="22" rx="4" opacity=".75"/><text class="sC" x="414" y="166" text-anchor="middle">Giza</text><rect class="sV" x="364" y="176" width="100" height="22" rx="4" opacity=".75"/><text class="sC" x="414" y="192" text-anchor="middle">Luxor</text>
<text class="sT" x="530" y="22" text-anchor="middle">INTERSECT</text><text class="sS" x="530" y="38" text-anchor="middle">1 rows</text><rect class="sG" x="480" y="46" width="100" height="22" rx="4" opacity=".75"/><text class="sC" x="530" y="62" text-anchor="middle">Giza</text>
<text class="sT" x="646" y="22" text-anchor="middle">EXCEPT</text><text class="sS" x="646" y="38" text-anchor="middle">2 rows</text><rect class="sA" x="596" y="46" width="100" height="22" rx="4" opacity=".75"/><text class="sC" x="646" y="62" text-anchor="middle">Alex</text><rect class="sB" x="596" y="72" width="100" height="22" rx="4" opacity=".75"/><text class="sC" x="646" y="88" text-anchor="middle">Cairo</text>
<text class="sS" x="360" y="226" text-anchor="middle">UNION, INTERSECT and EXCEPT return distinct rows; only UNION ALL keeps duplicates, and skips the dedup sort</text>
</svg><figcaption>Set operations on the same two results. Columns must match in number and type, and the names come from the first query. Computed.</figcaption></figure>

**CASE** is SQL's if/else, usable anywhere an expression is:

```sql
SELECT order_id,
       CASE WHEN total >= 5000 THEN 'large'
            WHEN total >= 1000 THEN 'medium'
            ELSE 'small' END AS size_band
FROM   order_totals;
```

**Dialect differences you'll meet** (your experience spans SQL Server, PostgreSQL and SQLite, plus Oracle at Farwaniya):

| Task | SQL Server (T-SQL) | PostgreSQL | Oracle |
|---|---|---|---|
| First N rows | `SELECT TOP (10) ...` or `OFFSET 0 ROWS FETCH NEXT 10 ROWS ONLY` | `LIMIT 10` (also `FETCH FIRST`) | `FETCH FIRST 10 ROWS ONLY` (12c+) |
| Null replace | `ISNULL(x, 0)` or `COALESCE` | `COALESCE` | `NVL(x, 0)` or `COALESCE` |
| String concat | `a + b` or `CONCAT(a, b)` | `a \|\| b` or `CONCAT` | `a \|\| b` |
| Current time | `SYSUTCDATETIME()` | `now()` | `SYSTIMESTAMP` |
| Auto-increment | `IDENTITY(1,1)` | `GENERATED ALWAYS AS IDENTITY` | `GENERATED AS IDENTITY` (12c+) |
| Upsert | `MERGE` | `INSERT ... ON CONFLICT` (and `MERGE` since v15) | `MERGE` |
| Truncate to month | `DATETRUNC(month, d)` (2022+) | `date_trunc('month', d)` | `TRUNC(d, 'MM')` |

> [!tip]
> In an interview, say which dialect you're writing ("I'll write PostgreSQL; in SQL Server this would be TOP") and move on. Nobody minds dialect differences; they mind not knowing they exist.

## S3.9 Changing data and transactions 🟢

```sql
INSERT INTO products (product_id, name, category, unit_price) VALUES (42, 'Desk lamp', 'Home', 350.00);
UPDATE products SET unit_price = unit_price * 1.10 WHERE category = 'Home';
DELETE FROM orders WHERE status = 'pending' AND order_date < '2026-01-01';
```

> [!warning] The UPDATE without WHERE
> Before running an UPDATE or DELETE by hand, run the same WHERE as a `SELECT COUNT(*)` first, and do it inside a transaction you can roll back.

> [!term] Transaction and ACID
> A group of statements that succeed or fail as one unit. **Atomicity** (all or nothing), **Consistency** (constraints hold), **Isolation** (concurrent transactions don't see each other's half-done work, to a configurable degree), **Durability** (committed means it survives a crash). Isolation levels and locking are in [[B6]].

```sql
BEGIN TRANSACTION;
  UPDATE accounts SET balance = balance - 500 WHERE account_id = 1;
  UPDATE accounts SET balance = balance + 500 WHERE account_id = 2;
COMMIT;      -- or ROLLBACK; if anything failed
```

<figure class="dia steps"><svg viewBox="0 0 720 182" role="img" aria-label="A transfer of 500 from account 1 to account 2 in SQLite where the second update fails: without a transaction the debit has already been committed and the total drops from 1,200 to 700; inside a transaction the rollback restores account 1 and the total stays 1,200">
<text class="sT" x="183" y="22" text-anchor="middle">each statement on its own (autocommit)</text>
<g data-s="1-1"><rect class="sN" x="14" y="36" width="160" height="50" rx="8"/><text class="sS" x="94" y="56" text-anchor="middle">account 1</text><text class="sT" x="94" y="76" text-anchor="middle">1,000</text><rect class="sN" x="192" y="36" width="160" height="50" rx="8"/><text class="sS" x="272" y="56" text-anchor="middle">account 2</text><text class="sT" x="272" y="76" text-anchor="middle">200</text><text class="sGt" x="183" y="110" text-anchor="middle">total 1,200</text></g>
<g data-s="2-2"><rect class="sW" x="14" y="36" width="160" height="50" rx="8"/><text class="sS" x="94" y="56" text-anchor="middle">account 1</text><text class="sT" x="94" y="76" text-anchor="middle">500</text><rect class="sN" x="192" y="36" width="160" height="50" rx="8"/><text class="sS" x="272" y="56" text-anchor="middle">account 2</text><text class="sT" x="272" y="76" text-anchor="middle">200</text><text class="sRt" x="183" y="110" text-anchor="middle">total 700</text><text class="sS" x="14" y="140" xml:space="preserve" style="white-space:pre">UPDATE … balance - 500  (account 1)</text></g>
<g data-s="3-3"><rect class="sW" x="14" y="36" width="160" height="50" rx="8"/><text class="sS" x="94" y="56" text-anchor="middle">account 1</text><text class="sT" x="94" y="76" text-anchor="middle">500</text><rect class="sR" x="192" y="36" width="160" height="50" rx="8"/><text class="sS" x="272" y="56" text-anchor="middle">account 2</text><text class="sT" x="272" y="76" text-anchor="middle">200</text><text class="sRt" x="183" y="110" text-anchor="middle">total 700</text><text class="sS" x="14" y="140" xml:space="preserve" style="white-space:pre">UPDATE … balance + 500  (account 2)</text><text class="sRt" x="14" y="162">error: account 2 is frozen</text></g>
<g data-s="4-4"><rect class="sR" x="14" y="36" width="160" height="50" rx="8"/><text class="sS" x="94" y="56" text-anchor="middle">account 1</text><text class="sT" x="94" y="76" text-anchor="middle">500</text><rect class="sN" x="192" y="36" width="160" height="50" rx="8"/><text class="sS" x="272" y="56" text-anchor="middle">account 2</text><text class="sT" x="272" y="76" text-anchor="middle">200</text><text class="sRt" x="183" y="110" text-anchor="middle">total 700</text><text class="sS" x="183" y="150" text-anchor="middle">the first UPDATE was already committed:</text><text class="sRt" x="183" y="168" text-anchor="middle">500 EGP has disappeared</text></g>
<text class="sT" x="537" y="22" text-anchor="middle">BEGIN … COMMIT / ROLLBACK</text>
<g data-s="1-1"><rect class="sN" x="368" y="36" width="160" height="50" rx="8"/><text class="sS" x="448" y="56" text-anchor="middle">account 1</text><text class="sT" x="448" y="76" text-anchor="middle">1,000</text><rect class="sN" x="546" y="36" width="160" height="50" rx="8"/><text class="sS" x="626" y="56" text-anchor="middle">account 2</text><text class="sT" x="626" y="76" text-anchor="middle">200</text><text class="sGt" x="537" y="110" text-anchor="middle">total 1,200</text></g>
<g data-s="2-2"><rect class="sW" x="368" y="36" width="160" height="50" rx="8"/><text class="sS" x="448" y="56" text-anchor="middle">account 1</text><text class="sT" x="448" y="76" text-anchor="middle">500</text><rect class="sN" x="546" y="36" width="160" height="50" rx="8"/><text class="sS" x="626" y="56" text-anchor="middle">account 2</text><text class="sT" x="626" y="76" text-anchor="middle">200</text><text class="sRt" x="537" y="110" text-anchor="middle">total 700</text><text class="sS" x="368" y="140" xml:space="preserve" style="white-space:pre">UPDATE … balance - 500  (account 1)</text></g>
<g data-s="3-3"><rect class="sW" x="368" y="36" width="160" height="50" rx="8"/><text class="sS" x="448" y="56" text-anchor="middle">account 1</text><text class="sT" x="448" y="76" text-anchor="middle">500</text><rect class="sR" x="546" y="36" width="160" height="50" rx="8"/><text class="sS" x="626" y="56" text-anchor="middle">account 2</text><text class="sT" x="626" y="76" text-anchor="middle">200</text><text class="sRt" x="537" y="110" text-anchor="middle">total 700</text><text class="sS" x="368" y="140" xml:space="preserve" style="white-space:pre">UPDATE … balance + 500  (account 2)</text><text class="sRt" x="368" y="162">error: account 2 is frozen</text></g>
<g data-s="4-4"><rect class="sG" x="368" y="36" width="160" height="50" rx="8"/><text class="sS" x="448" y="56" text-anchor="middle">account 1</text><text class="sT" x="448" y="76" text-anchor="middle">1,000</text><rect class="sN" x="546" y="36" width="160" height="50" rx="8"/><text class="sS" x="626" y="56" text-anchor="middle">account 2</text><text class="sT" x="626" y="76" text-anchor="middle">200</text><text class="sGt" x="537" y="110" text-anchor="middle">total 1,200</text><text class="sS" x="537" y="150" text-anchor="middle">ROLLBACK undoes the first UPDATE too:</text><text class="sGt" x="537" y="168" text-anchor="middle">all or nothing (atomicity)</text></g>
</svg><ol class="dia-steps">
<li>Two accounts hold 1,000 and 200: 1,200 in total. We move 500 from account 1 to account 2.</li>
<li>The debit succeeds.</li>
<li>The credit fails (here a trigger blocks it: "account 2 is frozen").</li>
<li>Without a transaction the debit stays and the money is gone; inside a transaction, ROLLBACK restores both rows.</li>
</ol><figcaption>Atomicity, run in SQLite: the same failed transfer with and without a transaction.</figcaption></figure>

## S3.10 Indexes, in one section 🟢

An **index** is a separate sorted structure (usually a **B-tree**) that lets the database find rows without scanning the whole table, much like a book's index.

- Index columns that appear in `WHERE`, `JOIN ... ON` and `ORDER BY` of frequent queries, foreign keys especially.
- A **composite index** on `(customer_id, order_date)` helps queries filtering on `customer_id`, or on `customer_id` and `order_date`, but not on `order_date` alone (the **leftmost prefix** rule).
- Indexes speed up reads and **slow down writes**, because each insert or update maintains them.
- A **clustered index** (SQL Server) *is* the table's storage order, and there can be only one; nonclustered indexes are separate structures pointing back to rows.

Execution plans, covering indexes and tuning are in [[B6]].

> [!story]
> Your ADO.NET vs Dapper vs EF Core benchmark measured the **client** side of data access. The other half of the performance story is the database side: `EXPLAIN` in PostgreSQL, or the actual execution plan in SQL Server, to check that a query uses an index seek rather than a scan.

## S3.11 The classic interview problems 🟢 🟡 ⭐

Learn the *pattern* behind each, not just the answer.

**1. Second-highest salary** (handles ties and the case where there's no second):

```sql
SELECT MAX(salary) AS second_highest
FROM   employees
WHERE  salary < (SELECT MAX(salary) FROM employees);
-- Generalises to the Nth with DENSE_RANK:
WITH r AS (SELECT salary, DENSE_RANK() OVER (ORDER BY salary DESC) AS rk FROM employees)
SELECT DISTINCT salary FROM r WHERE rk = 2;
```

<figure class="dia"><svg viewBox="0 0 720 200" role="img" aria-label="Five salaries with a tie at 8,000: ROW_NUMBER numbers them 1 to 5, RANK gives 1, 2, 2, 4, 5 and DENSE_RANK gives 1, 2, 2, 3, 4, so DENSE_RANK equal 2 returns the second-highest salary even with ties">
<rect class="sN" x="40" y="24" width="110" height="24" rx="0"/><text class="sT" x="95" y="40" text-anchor="middle">employee</text>
<rect class="sN" x="150" y="24" width="90" height="24" rx="0"/><text class="sT" x="195" y="40" text-anchor="middle">salary</text>
<rect class="sN" x="240" y="24" width="120" height="24" rx="0"/><text class="sT" x="300" y="40" text-anchor="middle">ROW_NUMBER</text>
<rect class="sN" x="360" y="24" width="100" height="24" rx="0"/><text class="sT" x="410" y="40" text-anchor="middle">RANK</text>
<rect class="sN" x="460" y="24" width="120" height="24" rx="0"/><text class="sT" x="520" y="40" text-anchor="middle">DENSE_RANK</text>
<rect class="sB" x="40" y="48" width="110" height="24" rx="0" opacity=".55"/><text class="sC" x="95" y="64" text-anchor="middle">Mona</text>
<rect class="sB" x="150" y="48" width="90" height="24" rx="0" opacity=".55"/><text class="sC" x="195" y="64" text-anchor="middle">9,000</text>
<rect class="sB" x="240" y="48" width="120" height="24" rx="0" opacity=".55"/><text class="sC" x="300" y="64" text-anchor="middle">1</text>
<rect class="sB" x="360" y="48" width="100" height="24" rx="0" opacity=".55"/><text class="sC" x="410" y="64" text-anchor="middle">1</text>
<rect class="sB" x="460" y="48" width="120" height="24" rx="0" opacity=".55"/><text class="sC" x="520" y="64" text-anchor="middle">1</text>
<rect class="sW" x="40" y="72" width="110" height="24" rx="0" opacity=".55"/><text class="sC" x="95" y="88" text-anchor="middle">Omar</text>
<rect class="sW" x="150" y="72" width="90" height="24" rx="0" opacity=".55"/><text class="sC" x="195" y="88" text-anchor="middle">8,000</text>
<rect class="sW" x="240" y="72" width="120" height="24" rx="0" opacity=".55"/><text class="sC" x="300" y="88" text-anchor="middle">2</text>
<rect class="sW" x="360" y="72" width="100" height="24" rx="0" opacity=".55"/><text class="sC" x="410" y="88" text-anchor="middle">2</text>
<rect class="sG" x="460" y="72" width="120" height="24" rx="0" opacity=".55"/><text class="sC" x="520" y="88" text-anchor="middle">2</text>
<rect class="sW" x="40" y="96" width="110" height="24" rx="0" opacity=".55"/><text class="sC" x="95" y="112" text-anchor="middle">Sara</text>
<rect class="sW" x="150" y="96" width="90" height="24" rx="0" opacity=".55"/><text class="sC" x="195" y="112" text-anchor="middle">8,000</text>
<rect class="sW" x="240" y="96" width="120" height="24" rx="0" opacity=".55"/><text class="sC" x="300" y="112" text-anchor="middle">3</text>
<rect class="sW" x="360" y="96" width="100" height="24" rx="0" opacity=".55"/><text class="sC" x="410" y="112" text-anchor="middle">2</text>
<rect class="sG" x="460" y="96" width="120" height="24" rx="0" opacity=".55"/><text class="sC" x="520" y="112" text-anchor="middle">2</text>
<rect class="sB" x="40" y="120" width="110" height="24" rx="0" opacity=".55"/><text class="sC" x="95" y="136" text-anchor="middle">Ali</text>
<rect class="sB" x="150" y="120" width="90" height="24" rx="0" opacity=".55"/><text class="sC" x="195" y="136" text-anchor="middle">7,000</text>
<rect class="sB" x="240" y="120" width="120" height="24" rx="0" opacity=".55"/><text class="sC" x="300" y="136" text-anchor="middle">4</text>
<rect class="sB" x="360" y="120" width="100" height="24" rx="0" opacity=".55"/><text class="sC" x="410" y="136" text-anchor="middle">4</text>
<rect class="sB" x="460" y="120" width="120" height="24" rx="0" opacity=".55"/><text class="sC" x="520" y="136" text-anchor="middle">3</text>
<rect class="sB" x="40" y="144" width="110" height="24" rx="0" opacity=".55"/><text class="sC" x="95" y="160" text-anchor="middle">Nour</text>
<rect class="sB" x="150" y="144" width="90" height="24" rx="0" opacity=".55"/><text class="sC" x="195" y="160" text-anchor="middle">6,500</text>
<rect class="sB" x="240" y="144" width="120" height="24" rx="0" opacity=".55"/><text class="sC" x="300" y="160" text-anchor="middle">5</text>
<rect class="sB" x="360" y="144" width="100" height="24" rx="0" opacity=".55"/><text class="sC" x="410" y="160" text-anchor="middle">5</text>
<rect class="sB" x="460" y="144" width="120" height="24" rx="0" opacity=".55"/><text class="sC" x="520" y="160" text-anchor="middle">4</text>
<text class="sWt" x="612" y="40">ties: amber</text>
<text class="sC" x="612" y="64">RANK skips 3</text><text class="sC" x="612" y="82">DENSE_RANK</text><text class="sC" x="612" y="98">does not</text>
<text class="sGt" x="612" y="130">rk = 2 →</text><text class="sGt" x="612" y="146">both 8,000s</text>
<text class="sS" x="360" y="188" text-anchor="middle">ROW_NUMBER breaks ties arbitrarily: use it to dedupe; use DENSE_RANK to find "the Nth value"</text>
</svg><figcaption>The three ranking functions differ only on ties, and ties are exactly what the second-highest-salary question tests. Computed.</figcaption></figure>

**2. Find duplicates, then keep one** (the core data-cleaning query):

```sql
-- which emails appear more than once?
SELECT email, COUNT(*) FROM customers GROUP BY email HAVING COUNT(*) > 1;

-- keep the earliest row per email
WITH ranked AS (
  SELECT *, ROW_NUMBER() OVER (PARTITION BY email ORDER BY signup_date, customer_id) AS rn
  FROM customers
)
SELECT * FROM ranked WHERE rn = 1;          -- (DELETE ... WHERE rn > 1 to remove the rest)
```

**3. Top N per group** (the three best-selling products in each category):

```sql
WITH sales AS (
  SELECT p.category, p.name, SUM(oi.quantity) AS units,
         DENSE_RANK() OVER (PARTITION BY p.category ORDER BY SUM(oi.quantity) DESC) AS rk
  FROM   order_items oi JOIN products p ON p.product_id = oi.product_id
  GROUP  BY p.category, p.name
)
SELECT category, name, units FROM sales WHERE rk <= 3 ORDER BY category, rk;
```

A window function can sit over an aggregate in the same SELECT because windows run after GROUP BY.

<figure class="dia"><svg viewBox="0 0 720 272" role="img" aria-label="Top two products per category: DENSE_RANK restarts within phones and routers; two phones tie at rank 2, so three phones and two routers are kept">
<text class="sM" x="14" y="36">PARTITION BY category = phones</text>
<rect class="sG" x="40" y="44" width="420" height="22" rx="3"/><text class="sC" x="52" y="59">Galaxy A15</text><text class="sC" x="330" y="59" text-anchor="end">410 units</text><text class="sT" x="400" y="59" text-anchor="middle">rk 1</text>
<text class="sGt" x="476" y="59">kept (rk &lt;= 2)</text>
<rect class="sG" x="40" y="68" width="420" height="22" rx="3"/><text class="sC" x="52" y="83">iPhone 15</text><text class="sC" x="330" y="83" text-anchor="end">380 units</text><text class="sT" x="400" y="83" text-anchor="middle">rk 2</text>
<text class="sGt" x="476" y="83">kept (rk &lt;= 2)</text>
<rect class="sG" x="40" y="92" width="420" height="22" rx="3"/><text class="sC" x="52" y="107">Redmi 13</text><text class="sC" x="330" y="107" text-anchor="end">380 units</text><text class="sT" x="400" y="107" text-anchor="middle">rk 2</text>
<text class="sGt" x="476" y="107">kept (rk &lt;= 2)</text>
<rect class="sN" x="40" y="116" width="420" height="22" rx="3" opacity=".5"/><text class="sC" x="52" y="131">Nokia G42</text><text class="sC" x="330" y="131" text-anchor="end">120 units</text><text class="sT" x="400" y="131" text-anchor="middle">rk 3</text>
<text class="sS" x="476" y="131">filtered out</text>
<text class="sM" x="14" y="164">PARTITION BY category = routers</text>
<rect class="sG" x="40" y="172" width="420" height="22" rx="3"/><text class="sC" x="52" y="187">Archer AX55</text><text class="sC" x="330" y="187" text-anchor="end">220 units</text><text class="sT" x="400" y="187" text-anchor="middle">rk 1</text>
<text class="sGt" x="476" y="187">kept (rk &lt;= 2)</text>
<rect class="sG" x="40" y="196" width="420" height="22" rx="3"/><text class="sC" x="52" y="211">Huawei AX3</text><text class="sC" x="330" y="211" text-anchor="end">150 units</text><text class="sT" x="400" y="211" text-anchor="middle">rk 2</text>
<text class="sGt" x="476" y="211">kept (rk &lt;= 2)</text>
<rect class="sN" x="40" y="220" width="420" height="22" rx="3" opacity=".5"/><text class="sC" x="52" y="235">ZTE MF286</text><text class="sC" x="330" y="235" text-anchor="end">90 units</text><text class="sT" x="400" y="235" text-anchor="middle">rk 3</text>
<text class="sS" x="476" y="235">filtered out</text>
<text class="sS" x="360" y="260" text-anchor="middle">the ranking restarts in every partition; with a tie at rank 2, "top 2 per group" returns three phones</text>
</svg><figcaption>Top-N per group: rank inside each partition, then filter in an outer query. Decide up front whether ties should widen the result.</figcaption></figure>

**4. Customers who ordered in consecutive months**, or more generally **gaps and islands**. Subtracting a row number from a date gives a constant for each unbroken run:

```sql
WITH days AS (SELECT DISTINCT customer_id, CAST(order_date AS date) AS d FROM orders),
grp  AS (SELECT customer_id, d,
                d - CAST(ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY d) AS int) AS island  -- PostgreSQL date - int
         FROM days)
SELECT customer_id, MIN(d) AS streak_start, MAX(d) AS streak_end, COUNT(*) AS days
FROM   grp GROUP BY customer_id, island
HAVING COUNT(*) >= 3;                       -- streaks of 3+ days
-- SQL Server: DATEADD(day, -ROW_NUMBER() OVER (...), d)
```

**5. Percentage of total:**

```sql
SELECT category, SUM(revenue) AS revenue,
       100.0 * SUM(revenue) / SUM(SUM(revenue)) OVER () AS pct_of_total
FROM   category_revenue GROUP BY category;
```

**6. Daily active users, and users active yesterday but not today** (a self-join or EXCEPT):

```sql
SELECT user_id FROM events WHERE event_date = DATE '2026-10-01'
EXCEPT
SELECT user_id FROM events WHERE event_date = DATE '2026-10-02';
```

> [!tip] How to talk through a SQL question
> 1) Restate the output: "one row per category with its top three products". 2) Name the **grain** of each table. 3) Build it in CTEs, one step at a time. 4) Mention edge cases: ties, NULLs, empty groups, duplicates. 5) Only then think about performance. Interviewers score the thinking, not just the final query.

## S3.12 Interview drill 🟢 ⭐

| Question | Strong short answer |
|---|---|
| WHERE vs HAVING? | WHERE filters rows before grouping; HAVING filters groups after aggregation and can use aggregates. |
| INNER vs LEFT JOIN? | INNER keeps only matches; LEFT keeps every left row with NULLs where the right side has no match. |
| How do you find rows in A with no match in B? | `NOT EXISTS`, or `LEFT JOIN B ... WHERE B.key IS NULL`. |
| COUNT(*) vs COUNT(column)? | COUNT(*) counts rows; COUNT(column) counts non-NULL values in that column. |
| Why can NOT IN return nothing? | If the subquery contains a NULL, every comparison is UNKNOWN, so no row qualifies. Use NOT EXISTS. |
| RANK vs DENSE_RANK vs ROW_NUMBER? | With ties: RANK 1,2,2,4; DENSE_RANK 1,2,2,3; ROW_NUMBER 1,2,3,4 (unique). |
| UNION vs UNION ALL? | UNION removes duplicates (extra work); UNION ALL keeps all rows and is faster. |
| What's a CTE for? | Naming a subquery so a complex query reads in steps; recursive CTEs walk hierarchies. |
| How do you get a running total? | `SUM(x) OVER (ORDER BY date ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW)`. |
| Why can't I use a SELECT alias in WHERE? | WHERE is evaluated before SELECT, so the alias doesn't exist yet. |
| How do you remove duplicates but keep one row? | ROW_NUMBER partitioned by the duplicate key, keep `rn = 1`. |
| What's the logical order of a query? | FROM/JOIN, WHERE, GROUP BY, HAVING, SELECT (and windows), DISTINCT, ORDER BY, LIMIT. |
| What does an index cost? | Storage and slower inserts, updates and deletes, because the index must be maintained. |
| Why might `YEAR(order_date) = 2026` be slow? | The function on the column usually prevents an index seek; use a date range instead. |
| What's ACID? | Atomicity, Consistency, Isolation, Durability: the guarantees of a transaction. |

## Key takeaways

> [!check]
> - Know the logical order: FROM, WHERE, GROUP BY, HAVING, SELECT, ORDER BY.
> - NULL is unknown: use IS NULL, COALESCE and NOT EXISTS.
> - Watch the grain: joins can multiply rows, so aggregate at the right level first.
> - Window functions answer "rank within", "previous value" and "running total" without collapsing rows.
> - Build answers in CTEs and talk through edge cases.

## Sources

- PostgreSQL 18 documentation: [Queries](https://www.postgresql.org/docs/current/queries.html), [Window functions tutorial](https://www.postgresql.org/docs/current/tutorial-window.html), [Window function calls (frames)](https://www.postgresql.org/docs/current/sql-expressions.html#SYNTAX-WINDOW-FUNCTIONS).
- Microsoft Learn: [SELECT — logical processing order](https://learn.microsoft.com/en-us/sql/t-sql/queries/select-transact-sql#logical-processing-order-of-the-select-statement), [OVER clause](https://learn.microsoft.com/en-us/sql/t-sql/queries/select-over-clause-transact-sql), [DATETRUNC](https://learn.microsoft.com/en-us/sql/t-sql/functions/datetrunc-transact-sql).
- Markus Winand, [Use The Index, Luke](https://use-the-index-luke.com/), a free guide to SQL indexing.
- Your *AI Journey* Part 12 (SQL for data) has 13 telecom-flavoured practice problems that complement this module.
