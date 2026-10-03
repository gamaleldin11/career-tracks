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

> [!mistake] NOT IN with a NULL in the list
> `WHERE customer_id NOT IN (SELECT customer_id FROM blocked)` returns **no rows at all** if `blocked.customer_id` contains a single NULL, because `x <> NULL` is UNKNOWN. Use `NOT EXISTS`, which doesn't have this trap.

```sql
-- Customers who have never ordered (anti-join), NULL-safe
SELECT c.*
FROM   customers c
WHERE  NOT EXISTS (SELECT 1 FROM orders o WHERE o.customer_id = c.customer_id);
```

## S3.4 Joins 🟢 ⭐

<figure class="dia"><svg viewBox="0 0 720 190" role="img" aria-label="Venn-style summary of inner, left, full and anti joins">
<g transform="translate(20,20)"><circle class="sB" cx="50" cy="60" r="45"/><circle class="sB" cx="100" cy="60" r="45"/><path class="sA" d="M75 22.6 A45 45 0 0 0 75 97.4 A45 45 0 0 0 75 22.6Z"/><text class="sT" x="75" y="140" text-anchor="middle">INNER</text><text class="sS" x="75" y="158" text-anchor="middle">matches only</text></g>
<g transform="translate(200,20)"><circle class="sA" cx="50" cy="60" r="45"/><circle class="sB" cx="100" cy="60" r="45" fill-opacity="0.4"/><text class="sT" x="75" y="140" text-anchor="middle">LEFT</text><text class="sS" x="75" y="158" text-anchor="middle">all left + matches</text></g>
<g transform="translate(380,20)"><circle class="sA" cx="50" cy="60" r="45"/><circle class="sA" cx="100" cy="60" r="45"/><text class="sT" x="75" y="140" text-anchor="middle">FULL OUTER</text><text class="sS" x="75" y="158" text-anchor="middle">everything</text></g>
<g transform="translate(560,20)"><circle class="sA" cx="50" cy="60" r="45"/><circle class="sB" cx="100" cy="60" r="45"/><text class="sT" x="75" y="140" text-anchor="middle">LEFT ANTI</text><text class="sS" x="75" y="158" text-anchor="middle">left with no match</text></g>
</svg><figcaption>A useful picture for the idea, though not literally accurate: joins match rows on a condition and can multiply rows; they don't intersect sets of identical items.</figcaption></figure>

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
