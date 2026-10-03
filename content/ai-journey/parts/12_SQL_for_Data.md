# Part 12 — SQL for Data Work

<!-- nav -->
> [!example] 🧭 Step 4 of 26 · Stage 1 of 7: Toolkit
> ← [Part 03 · Pandas](03_Pandas.md) · [Part 04 · Cleaning & preprocessing](04_Data_Cleaning_and_Preprocessing.md) → · [Course map](00_START_HERE.md)
<!-- /nav -->

**Source:** `code/sql files/Q1.sql`, `Q2.sql`, `q3.sql`

You already write SQL Server professionally — this is the one part of the course where you arrived ahead of the material. So this section does two things: it records what the course covered (briefly), and then covers **what a data/ML role expects that ordinary application SQL does not**, which is the part with actual value for you.

<!-- interview-focus -->

> [!tip] 🎯 Interview focus
> **Why it matters:** SQL is tested in almost every data interview, often as the first technical screen. At telcos the data lives in large warehouses (CDRs, billing, CRM).
>
> | Level | What you should be able to do |
> |---|---|
> | 🟢 **Entry** | SELECT/WHERE/GROUP BY/HAVING, all JOIN types, CASE WHEN, basic subqueries, NULL handling, date functions. |
> | 🟡 **Mid** | Window functions (ROW_NUMBER, RANK, LAG/LEAD, running totals), CTEs, cohort/retention queries, gaps-and-islands, point-in-time feature tables. |
> | 🔴 **Senior** | Query performance (indexes, partitions, execution plans), data modelling (star schema), dbt/lakehouse patterns. |
>
> **⭐ Most-asked:** *Top N per group* · *Month-over-month growth with LAG* · *Customers with no payment in 90 days (anti-join)* · *Running total / 7-day rolling average* · *WHERE vs HAVING; `NOT IN` with NULLs*
>
> **⏱ Time:** 4 h (practise, don't just read)  ·  **Short on time?** Read §12.2, §12.6 (all problems).

**Legend:** 🟢 Entry (0–2 yrs) · 🟡 Mid (2–5 yrs) · 🔴 Senior / specialist · ⭐ frequently asked · 📖 Géron, *Hands-On ML with Scikit-Learn and PyTorch* (2025) pages

> [!abstract]- 🗺️ Section map — level and book pages
>
> | § | Section | Level | 📖 Book |
> |---|---|:---:|---|
> | 12.1 | What the course covered | 🟢 | — |
> | 12.2 | The SQL that data work actually needs | 🟢 ⭐ | — |
> | 12.3 | SQL ↔ Pandas — the translation table | 🟢 | — |
> | 12.4 | The bridge: SQL → Pandas in code | 🟢 | — |
> | 12.5 | What to practise | 🟢 | — |
> | 12.6 | Interview SQL — worked problems on a telecom schema | 🟢 ⭐ | — |
>

---

## 12.1 What the course covered 🟢

### `Q1.sql` — DDL

```sql
create database test;
use test;

create table employee (
  id int,
  `name` varchar(30),
  salary decimal(7,2),
  hiring_date date default '2025-12-12',
  unique(id),
  check (salary > 1000)
);

show tables;
describe employee;
drop table employee;

update employee set salary = salary * 1.15;
alter table employee add constraint id_unique(id);
```

MySQL dialect — backtick-quoted identifiers, `show tables`, `describe`. Note the translation table you will need constantly:

| Concept | MySQL | SQL Server |
|---|---|---|
| Quote an identifier | `` `name` `` | `[name]` |
| List tables | `SHOW TABLES` | `SELECT * FROM sys.tables` |
| Describe a table | `DESCRIBE t` | `sp_help t` / `INFORMATION_SCHEMA.COLUMNS` |
| Limit rows | `LIMIT 20` | `TOP 20` or `OFFSET…FETCH` |
| Auto increment | `AUTO_INCREMENT` | `IDENTITY(1,1)` |
| String concat | `CONCAT(a, b)` | `a + b` or `CONCAT(a, b)` |
| Current timestamp | `NOW()` | `GETDATE()` / `SYSDATETIME()` |

The `sql_mode` experiment in the file is a MySQL-specific quirk worth understanding:

```sql
select @sql_mode;
set session sql_mode = '';
insert into employee values (4, 'moh', 3000, '');
```

MySQL's default strict mode rejects `''` as a date. Clearing `sql_mode` makes it accept the invalid value silently, inserting `'0000-00-00'`. **This is a demonstration of a footgun, not a technique.** SQL Server has no equivalent permissiveness, and that is a good thing.

There are also deliberate errors in the file for teaching — a foreign key referencing a column that does not exist, a typo'd table name. Reading broken SQL and spotting why is a reasonable exercise.

### `Q2.sql` — querying (Northwind)

```sql
select CategoryName, Description from categories;
select * from customers limit 20;
select * from customers where Country = 'Germany';
select * from customers
 where Country in ('Germany','France') and (city='Berlin' or city='Lille');
select * from customers where Country != 'Germany';

select * from tutorial.categories order by CategoryName desc;

select * from customers where CustomerName like 'B%';
select * from customers where CustomerName like 's___%';   -- s + 3 chars + anything
select * from customers where PostalCode is null or PostalCode = '';

select count(*) from customers;
select count(distinct Country) from customers;
select max(price) as highest_price from products;
select round(avg(price),2) as avg_price from products;

select emp.EmployeeID, concat(FirstName,' ',LastName) as Full_Name from employees as emp;
select emp.EmployeeID, year(BirthDate) as Birth_Year from employees as emp;

select CategoryID, max(Price) as highest_price_per_category
  from products group by CategoryID
  order by highest_price_per_category desc;

select CustomerID, count(*) as NumOrders from orders group by CustomerID;
```

Standard `SELECT` / `WHERE` / `GROUP BY` / `ORDER BY` / aggregates / `LIKE` / `NULL` handling. Two details worth flagging:

- **`_` vs `%` in `LIKE`.** `_` matches exactly one character, `%` matches any number. `'s___%'` means "starts with s, then exactly three characters, then anything".
- **`IS NULL` vs `= ''`.** The query correctly checks both, because they are different states — the same distinction as `np.nan` vs `''` in Pandas (§3.1).
- **The `= NULL` trap.** `WHERE PostalCode = NULL` returns nothing, ever. NULL comparisons are always UNKNOWN. Exactly parallel to `df[df.col == np.nan]`.

### `q3.sql` — aggregation practice

```sql
select max(OrderDate) from orders;

-- number of customers with transactions/orders last week
select CustomerID, count(*) as NumOrders ...
```

---

## 12.2 The SQL that data work actually needs 🟢 ⭐

![Joins as sets. Watch for one-to-many fan-out when you aggregate after a join.](figures/fig12_sql_joins.png)
*Joins as sets. Watch for one-to-many fan-out when you aggregate after a join.*

> [!quote] 💬 Say it in the interview
> “Beyond joins and GROUP BY, data work needs window functions — ROW_NUMBER for top-N, LAG for change over time, SUM OVER for running totals — plus CTEs to keep queries readable.”

This is the part the course did not reach, and it is where the leverage is. In a data or ML role, SQL is not for CRUD — it is for **feature engineering at the source**, which is faster and cheaper than pulling everything into Pandas.

### Window functions — the single biggest gap

Window functions compute across a set of rows related to the current row **without collapsing them**. `GROUP BY` reduces 1,000 rows to 5; a window function keeps all 1,000 and adds a column.

```sql
SELECT
  customer_id,
  order_date,
  amount,

  -- running total per customer, ordered by date
  SUM(amount) OVER (PARTITION BY customer_id ORDER BY order_date)      AS running_total,

  -- the previous order's amount for this customer
  LAG(amount, 1)  OVER (PARTITION BY customer_id ORDER BY order_date)  AS prev_amount,
  LEAD(amount, 1) OVER (PARTITION BY customer_id ORDER BY order_date)  AS next_amount,

  -- rank orders within each customer, largest first
  ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY amount DESC)    AS rn,
  RANK()       OVER (PARTITION BY customer_id ORDER BY amount DESC)    AS rnk,
  DENSE_RANK() OVER (PARTITION BY customer_id ORDER BY amount DESC)    AS dense_rnk,

  -- 7-order moving average
  AVG(amount) OVER (PARTITION BY customer_id ORDER BY order_date
                    ROWS BETWEEN 6 PRECEDING AND CURRENT ROW)          AS moving_avg_7
FROM orders;
```

**Why this matters for ML.** Almost every strong tabular feature is a window function:

- Days since previous purchase → `LAG(order_date)`
- Rolling 30-day spend → `SUM(...) OVER (... ROWS BETWEEN ...)`
- Customer's rank within their segment → `RANK()`
- Change vs previous period → `amount - LAG(amount)`

Doing this in SQL, in the database, on indexed columns, is orders of magnitude faster than pulling raw rows into Pandas and grouping there.

**The three ranking functions differ on ties:**

| Values | `ROW_NUMBER` | `RANK` | `DENSE_RANK` |
|---|---|---|---|
| 100, 100, 90 | 1, 2, 3 | 1, 1, 3 | 1, 1, 2 |

**"Top N per group"** — the classic interview question, and window functions are the clean answer:

```sql
WITH ranked AS (
  SELECT *, ROW_NUMBER() OVER (PARTITION BY category ORDER BY price DESC) AS rn
  FROM products
)
SELECT * FROM ranked WHERE rn <= 3;
```

### CTEs — readable SQL

```sql
WITH monthly_sales AS (
    SELECT customer_id,
           DATE_TRUNC('month', order_date) AS month,
           SUM(amount) AS total
    FROM orders
    GROUP BY 1, 2
),
customer_avg AS (
    SELECT customer_id, AVG(total) AS avg_monthly
    FROM monthly_sales
    GROUP BY 1
)
SELECT m.*, c.avg_monthly,
       m.total - c.avg_monthly AS deviation
FROM monthly_sales m
JOIN customer_avg c USING (customer_id);
```

A `WITH` clause names an intermediate result. It is the SQL equivalent of assigning to a variable, and it turns a nested-subquery horror into a readable sequence of steps.

Given the capstone's judging criterion — *"I expect a clean, readable code. Code that I can follow along and understand without having to run it line by line"* — CTEs are the direct SQL expression of that standard. **Use them liberally.**

### `CASE WHEN` — binning and flags in SQL

```sql
SELECT
  customer_id,
  CASE
    WHEN total_spend > 10000 THEN 'high'
    WHEN total_spend > 1000  THEN 'medium'
    ELSE 'low'
  END AS spend_tier,

  -- conditional aggregation: the SQL pivot idiom
  SUM(CASE WHEN status = 'returned' THEN 1 ELSE 0 END) AS n_returns,
  AVG(CASE WHEN channel = 'web' THEN amount END)       AS avg_web_amount
FROM customers
GROUP BY customer_id;
```

`SUM(CASE WHEN ... THEN 1 ELSE 0 END)` is the SQL idiom for counting a subset within a group — the equivalent of `pd.crosstab` or `pivot_table`.

### Join pitfalls

```sql
-- Fan-out: if a customer has 3 orders, this returns 3 rows per customer
SELECT c.*, o.amount FROM customers c JOIN orders o ON c.id = o.customer_id;

-- Always sanity-check the row count
SELECT COUNT(*) FROM customers;   -- 1000
SELECT COUNT(*) FROM result;      -- 5000  ← expected? or a duplicate key bug?
```

The same row-multiplication trap as `pd.merge` (§3.12). A join on a non-unique key multiplies rows, and if you then aggregate you double-count. **Check the row count after every join.**

Also: `LEFT JOIN` followed by `WHERE right_table.col = 'x'` silently converts it to an `INNER JOIN`, because NULL fails the comparison. Put the condition in the `ON` clause instead.

### Sampling and reproducibility

```sql
-- Postgres
SELECT * FROM big_table TABLESAMPLE SYSTEM (1);       -- ~1% of pages

-- SQL Server
SELECT TOP 10000 * FROM big_table ORDER BY NEWID();   -- random, slow on large tables

-- Deterministic hash-based sample — reproducible across runs
SELECT * FROM big_table WHERE ABS(CHECKSUM(id)) % 100 < 1;
```

The third form is the one to know: it is **deterministic**, so the same rows come back every time — which is what you need for a reproducible train/test split defined at the database level.

### Data quality checks in SQL

Before pulling anything into Pandas, run the profile at the source:

```sql
SELECT
  COUNT(*)                                        AS n_rows,
  COUNT(DISTINCT customer_id)                     AS n_customers,
  SUM(CASE WHEN email IS NULL THEN 1 ELSE 0 END)  AS null_emails,
  MIN(order_date), MAX(order_date),
  AVG(amount), MIN(amount), MAX(amount)
FROM orders;

-- duplicate detection
SELECT customer_id, order_date, COUNT(*)
FROM orders
GROUP BY customer_id, order_date
HAVING COUNT(*) > 1;
```

On a 50-million-row table this takes seconds; loading it into Pandas takes minutes and may not fit in memory.

---

## 12.3 SQL ↔ Pandas — the translation table 🟢

You know both halves; having them side by side makes each one faster.

| SQL | Pandas |
|---|---|
| `SELECT a, b FROM t` | `df[['a','b']]` |
| `SELECT * FROM t WHERE a > 5` | `df[df.a > 5]` |
| `WHERE a IN ('x','y')` | `df[df.a.isin(['x','y'])]` |
| `WHERE a IS NULL` | `df[df.a.isna()]` |
| `ORDER BY a DESC` | `df.sort_values('a', ascending=False)` |
| `LIMIT 10` / `TOP 10` | `df.head(10)` |
| `SELECT DISTINCT a` | `df.a.unique()` / `df.drop_duplicates('a')` |
| `COUNT(DISTINCT a)` | `df.a.nunique()` |
| `GROUP BY a` + `AVG(b)` | `df.groupby('a')['b'].mean()` |
| `HAVING count > 5` | `df.groupby('a').filter(lambda g: len(g) > 5)` |
| `JOIN ... ON k` | `pd.merge(l, r, on='k')` |
| `LEFT JOIN` | `pd.merge(l, r, how='left', on='k')` |
| `UNION ALL` | `pd.concat([df1, df2])` |
| `CASE WHEN` | `np.where(cond, a, b)` / `pd.cut` |
| `ROW_NUMBER() OVER (PARTITION BY a ORDER BY b)` | `df.sort_values('b').groupby('a').cumcount() + 1` |
| `SUM(x) OVER (PARTITION BY a)` | `df.groupby('a')['x'].transform('sum')` |
| `LAG(x) OVER (PARTITION BY a ORDER BY d)` | `df.sort_values('d').groupby('a')['x'].shift(1)` |
| `AVG(x) OVER (... ROWS 6 PRECEDING)` | `df.groupby('a')['x'].rolling(7).mean()` |

The last four rows are the ones worth memorising: **`transform`, `shift`, `cumcount` and `rolling` are Pandas' window functions.** If you know SQL windows, you already know what to reach for.

---

## 12.4 The bridge: SQL → Pandas in code 🟢

```python
import pandas as pd
from sqlalchemy import create_engine, text

# SQL Server via ODBC
engine = create_engine(
    "mssql+pyodbc://user:pass@server/database?driver=ODBC+Driver+18+for+SQL+Server"
)

df = pd.read_sql(text("""
    SELECT customer_id, SUM(amount) AS total, COUNT(*) AS n_orders
    FROM orders
    WHERE order_date >= :start_date
    GROUP BY customer_id
"""), engine, params={"start_date": "2025-01-01"})
```

Three things to do right:

1. **Parameterise.** `params={...}` with named placeholders, never f-string interpolation. Same SQL-injection discipline as your web work — and here it also protects against quoting bugs with dates and apostrophes.
2. **Aggregate in SQL, not in Pandas.** Pull 10,000 aggregated rows, not 10 million raw ones. The database is better at this than you are, and the network transfer is the bottleneck.
3. **Use `chunksize`** for genuinely large results:

   ```python
   for chunk in pd.read_sql(query, engine, chunksize=100_000):
       process(chunk)
   ```

Never put credentials in the connection string in source. Use environment variables — the `python-dotenv` pattern from Part 11.

---

## 12.5 What to practise 🟢

Since you have the SQL basics, the highest-value practice is:

1. **Window functions** — until `LAG`, `ROW_NUMBER` and rolling windows are automatic.
2. **"Top N per group"** — the most-asked SQL interview question.
3. **Sessionisation** — group events into sessions using `LAG` on timestamps and a cumulative sum of "gap > 30 minutes". A genuinely hard, genuinely common problem.
4. **Cohort / retention analysis** — first-purchase month by activity month.
5. **Building a feature table from raw event logs** — the actual daily job.

---

## 12.6 Interview SQL — worked problems on a telecom schema 🟢 ⭐

Data science interviews at a telecom (e& / Etisalat, Vodafone, Orange, WE) almost always include a live SQL round, often on a schema like the one below. Every problem here is a pattern that recurs. Solutions are in ANSI/PostgreSQL style; SQL Server differences are noted where they matter.

```sql
-- subscribers(msisdn, customer_id, plan_type /*'prepaid'|'postpaid'*/, activation_date,
--             governorate, handset_brand, status /*'active'|'churned'*/, churn_date)
-- recharges(recharge_id, msisdn, recharge_ts, amount_egp, channel /*'app'|'retail'|'fawry'*/)
-- usage_daily(msisdn, usage_date, data_mb, voice_min, sms_count, roaming_flag)
-- bills(bill_id, customer_id, bill_month, amount_egp, paid_date, due_date)
-- complaints(complaint_id, msisdn, created_ts, category, resolved_ts)
-- cells(cell_id, site_id, governorate, technology /*'4G'|'5G'*/)
-- cell_kpi_hourly(cell_id, hour_ts, drop_call_rate, throughput_mbps, users)
```

### Logical order of execution: know it cold

```
FROM / JOIN → WHERE → GROUP BY → HAVING → SELECT (window functions run here)
→ DISTINCT → ORDER BY → LIMIT/TOP
```

This order explains three common interview gotchas:
- A column alias from `SELECT` can't be used in `WHERE`.
- A window function can't be filtered in `WHERE`; wrap it in a CTE first.
- `HAVING` filters groups; `WHERE` filters rows.

### P1 — Top 3 recharging subscribers per governorate (top-N per group)

```sql
WITH totals AS (
  SELECT s.governorate, r.msisdn, SUM(r.amount_egp) AS total_egp
  FROM recharges r JOIN subscribers s USING (msisdn)
  WHERE r.recharge_ts >= DATE '2026-01-01'
  GROUP BY s.governorate, r.msisdn
), ranked AS (
  SELECT *, DENSE_RANK() OVER (PARTITION BY governorate ORDER BY total_egp DESC) AS rnk
  FROM totals
)
SELECT * FROM ranked WHERE rnk <= 3;
```

Say which ranking function you chose and why. `DENSE_RANK` keeps ties; `ROW_NUMBER` returns exactly 3.

### P2 — Second-highest bill per customer (and handling "no second")

```sql
SELECT customer_id, MAX(amount_egp) AS second_highest
FROM (
  SELECT customer_id, amount_egp,
         DENSE_RANK() OVER (PARTITION BY customer_id ORDER BY amount_egp DESC) AS r
  FROM bills
) t
WHERE r = 2
GROUP BY customer_id;       -- customers with a single distinct amount simply don't appear
```

### P3 — Month-over-month revenue growth

```sql
WITH m AS (
  SELECT DATE_TRUNC('month', recharge_ts) AS month, SUM(amount_egp) AS revenue
  FROM recharges GROUP BY 1
)
SELECT month, revenue,
       LAG(revenue) OVER (ORDER BY month)                                   AS prev_rev,
       ROUND(100.0 * (revenue - LAG(revenue) OVER (ORDER BY month))
             / NULLIF(LAG(revenue) OVER (ORDER BY month), 0), 2)            AS mom_pct
FROM m ORDER BY month;
```

`NULLIF(x, 0)` avoids division by zero. `100.0` forces decimal division; with integers, SQL Server and Postgres both truncate.

### P4 — Define pre-paid churn: no recharge for 90+ days

Pre-paid customers never "cancel". They go silent. Defining the label **is** the interview question.

```sql
WITH last_rc AS (
  SELECT msisdn, MAX(recharge_ts) AS last_recharge
  FROM recharges GROUP BY msisdn
)
SELECT s.msisdn,
       l.last_recharge,
       CASE WHEN l.last_recharge IS NULL
              OR l.last_recharge < DATE '2026-09-01' - INTERVAL '90 days'
            THEN 1 ELSE 0 END AS churned_90d
FROM subscribers s
LEFT JOIN last_rc l USING (msisdn)            -- LEFT: keep never-recharged SIMs
WHERE s.plan_type = 'prepaid';
```

Discuss the choices: a 30/60/90-day window (a trade-off between label delay and precision); whether usage of free bonuses counts as "activity"; **reactivations** (someone who is silent for 95 days and then recharges); multi-SIM users.

### P5 — Cohort retention (activation month × months since activation)

```sql
WITH cohort AS (
  SELECT msisdn, DATE_TRUNC('month', activation_date) AS cohort_month
  FROM subscribers
), activity AS (
  SELECT DISTINCT msisdn, DATE_TRUNC('month', usage_date) AS active_month
  FROM usage_daily WHERE data_mb > 0 OR voice_min > 0
)
SELECT c.cohort_month,
       (EXTRACT(YEAR FROM a.active_month) - EXTRACT(YEAR FROM c.cohort_month)) * 12
     + (EXTRACT(MONTH FROM a.active_month) - EXTRACT(MONTH FROM c.cohort_month)) AS month_n,
       COUNT(DISTINCT a.msisdn) AS active_users,
       ROUND(100.0 * COUNT(DISTINCT a.msisdn)
             / MAX(COUNT(DISTINCT a.msisdn)) OVER (PARTITION BY c.cohort_month), 1) AS retention_pct
FROM cohort c JOIN activity a USING (msisdn)
WHERE a.active_month >= c.cohort_month
GROUP BY 1, 2
ORDER BY 1, 2;
```

(SQL Server: `DATEFROMPARTS(YEAR(d), MONTH(d), 1)` instead of `DATE_TRUNC`, and `DATEDIFF(month, a, b)` for month_n.)

### P6 — Rolling 7-day data usage and a trend feature

```sql
SELECT msisdn, usage_date, data_mb,
       AVG(data_mb) OVER (PARTITION BY msisdn ORDER BY usage_date
                          ROWS BETWEEN 6 PRECEDING AND CURRENT ROW)     AS avg_7d,
       AVG(data_mb) OVER (PARTITION BY msisdn ORDER BY usage_date
                          ROWS BETWEEN 27 PRECEDING AND CURRENT ROW)    AS avg_28d
FROM usage_daily;
-- a ratio avg_7d / NULLIF(avg_28d, 0) < 0.5 is a classic early churn signal
```

⚠️ `ROWS` counts rows, not days. If a subscriber has missing days, "6 preceding rows" can span more than a week. For true calendar windows use `RANGE BETWEEN INTERVAL '6 days' PRECEDING AND CURRENT ROW` (Postgres), or join to a calendar table to fill the gaps.

### P7 — Longest streak of consecutive active days (gaps and islands)

```sql
WITH d AS (
  SELECT DISTINCT msisdn, usage_date FROM usage_daily WHERE data_mb > 0
), g AS (
  SELECT msisdn, usage_date,
         usage_date - (ROW_NUMBER() OVER (PARTITION BY msisdn ORDER BY usage_date))
             * INTERVAL '1 day' AS grp            -- constant within a consecutive run
  FROM d
)
SELECT msisdn, MAX(streak) AS longest_streak
FROM (SELECT msisdn, grp, COUNT(*) AS streak FROM g GROUP BY msisdn, grp) t
GROUP BY msisdn;
```

The trick: date minus row number is **constant within a run of consecutive dates**. This gaps-and-islands pattern is one of the most-asked "hard" SQL questions.

### P8 — Sessionisation (a new session after a 30-minute gap)

```sql
WITH e AS (
  SELECT msisdn, event_ts,
         CASE WHEN event_ts - LAG(event_ts) OVER (PARTITION BY msisdn ORDER BY event_ts)
                   > INTERVAL '30 minutes'
                OR LAG(event_ts) OVER (PARTITION BY msisdn ORDER BY event_ts) IS NULL
              THEN 1 ELSE 0 END AS new_session
  FROM app_events
)
SELECT msisdn, event_ts,
       SUM(new_session) OVER (PARTITION BY msisdn ORDER BY event_ts) AS session_id
FROM e;
```

A flag, then a running sum of the flag: the same shape as P7.

### P9 — Latest record per key (deduplication)

```sql
SELECT * FROM (
  SELECT *, ROW_NUMBER() OVER (PARTITION BY msisdn ORDER BY updated_ts DESC) AS rn
  FROM subscriber_snapshots
) t WHERE rn = 1;
```

### P10 — Anti-join: postpaid customers who never complained

```sql
SELECT s.customer_id
FROM subscribers s
WHERE s.plan_type = 'postpaid'
  AND NOT EXISTS (SELECT 1 FROM complaints c WHERE c.msisdn = s.msisdn);
```

⚠️ Avoid `NOT IN (SELECT msisdn FROM complaints)`. If the subquery returns even one NULL, `NOT IN` returns **no rows**, because `x <> NULL` is UNKNOWN. `NOT EXISTS` or `LEFT JOIN … WHERE c.msisdn IS NULL` are safe.

### P11 — Late-payment rate by governorate, with conditional aggregation

```sql
SELECT s.governorate,
       COUNT(*)                                                         AS n_bills,
       AVG(CASE WHEN b.paid_date > b.due_date OR b.paid_date IS NULL
                THEN 1.0 ELSE 0.0 END)                                  AS late_rate,
       PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY b.amount_egp)        AS median_bill
FROM bills b JOIN (SELECT DISTINCT customer_id, governorate FROM subscribers) s
  USING (customer_id)
GROUP BY s.governorate
HAVING COUNT(*) >= 100                         -- ignore tiny groups
ORDER BY late_rate DESC;
```

Note the `SELECT DISTINCT` inside the join. A customer with several SIMs would otherwise **fan out** and duplicate their bills (§12.2 join pitfalls).

### P12 — Network: cells whose drop-call rate is 3σ above their own baseline

```sql
WITH stats AS (
  SELECT cell_id,
         AVG(drop_call_rate)    AS mu,
         STDDEV(drop_call_rate) AS sigma
  FROM cell_kpi_hourly
  WHERE hour_ts >= NOW() - INTERVAL '28 days' AND hour_ts < NOW() - INTERVAL '1 day'
  GROUP BY cell_id
)
SELECT k.cell_id, k.hour_ts, k.drop_call_rate,
       (k.drop_call_rate - s.mu) / NULLIF(s.sigma, 0) AS z
FROM cell_kpi_hourly k JOIN stats s USING (cell_id)
WHERE k.hour_ts >= NOW() - INTERVAL '1 day'
  AND (k.drop_call_rate - s.mu) / NULLIF(s.sigma, 0) > 3;
```

Mention the refinement: baseline per **hour-of-week** (Tuesday 20:00 is not Sunday 04:00), and a robust statistic (median/MAD) so that past incidents don't inflate σ.

### P13 — Point-in-time feature table for a churn model (the real job)

```sql
-- Snapshot date: features use data up to 2026-06-30 only;
-- label = churned in July–August. This separation prevents target leakage.
WITH params AS (SELECT DATE '2026-06-30' AS snap),
usage_feats AS (
  SELECT u.msisdn,
         SUM(CASE WHEN u.usage_date >  p.snap - 30 THEN u.data_mb END)             AS data_30d,
         SUM(CASE WHEN u.usage_date >  p.snap - 90
                   AND u.usage_date <= p.snap - 30 THEN u.data_mb END) / 2.0       AS data_prev_avg,
         COUNT(DISTINCT CASE WHEN u.usage_date > p.snap - 30 THEN u.usage_date END) AS active_days_30d
  FROM usage_daily u, params p
  WHERE u.usage_date <= p.snap
  GROUP BY u.msisdn
),
rc_feats AS (
  SELECT r.msisdn,
         COUNT(*)                                    AS n_recharges_90d,
         SUM(r.amount_egp)                           AS recharge_egp_90d,
         p.snap - MAX(r.recharge_ts)::date           AS days_since_recharge
  FROM recharges r, params p
  WHERE r.recharge_ts <= p.snap AND r.recharge_ts > p.snap - 90
  GROUP BY r.msisdn, p.snap
),
cmp_feats AS (
  SELECT c.msisdn, COUNT(*) AS complaints_90d
  FROM complaints c, params p
  WHERE c.created_ts <= p.snap AND c.created_ts > p.snap - 90
  GROUP BY c.msisdn
),
label AS (
  SELECT s.msisdn,
         CASE WHEN s.churn_date >  p.snap
               AND s.churn_date <= p.snap + 62 THEN 1 ELSE 0 END AS churn_next_2m
  FROM subscribers s, params p
)
SELECT s.msisdn, s.plan_type, s.governorate, s.handset_brand,
       (SELECT snap FROM params) - s.activation_date          AS tenure_days,
       COALESCE(u.data_30d, 0)                                 AS data_30d,
       u.data_30d / NULLIF(u.data_prev_avg, 0)                 AS data_trend,
       COALESCE(u.active_days_30d, 0)                          AS active_days_30d,
       COALESCE(r.n_recharges_90d, 0)                          AS n_recharges_90d,
       r.days_since_recharge,
       COALESCE(c.complaints_90d, 0)                           AS complaints_90d,
       l.churn_next_2m
FROM subscribers s
LEFT JOIN usage_feats u USING (msisdn)
LEFT JOIN rc_feats    r USING (msisdn)
LEFT JOIN cmp_feats   c USING (msisdn)
JOIN label            l USING (msisdn)
WHERE s.activation_date <= (SELECT snap FROM params)
  AND (s.churn_date IS NULL OR s.churn_date > (SELECT snap FROM params));   -- alive at snapshot
```

What to point out when you present this:
1. **Every feature is computed only from data before the snapshot.** The label window comes strictly after it.
2. **LEFT JOINs + COALESCE** keep subscribers with no activity, which are exactly the churn-prone ones.
3. The population is limited to subscribers **alive at the snapshot**.
4. Build **several snapshots** (monthly) and stack them for training, then validate on a *later* snapshot (a temporal split). Do not use random KFold.

### SQL theory questions — short answers

| Question | Answer |
|---|---|
| `WHERE` vs `HAVING`? | Row filter before grouping vs group filter after aggregation |
| `UNION` vs `UNION ALL`? | `UNION` removes duplicates (a sort/hash, slower); `UNION ALL` keeps everything |
| INNER / LEFT / RIGHT / FULL / CROSS / SELF join? | Matching rows only / all left + matches / all right + matches / all from both / Cartesian product / a table joined to itself (e.g. referrer → referred) |
| `COUNT(*)` vs `COUNT(col)` vs `COUNT(DISTINCT col)`? | All rows / non-NULL values / distinct non-NULL values |
| NULL semantics? | `NULL = NULL` is UNKNOWN. Use `IS NULL`. Aggregates ignore NULLs (`AVG` over non-NULLs only). `COALESCE` supplies defaults |
| `RANK` vs `DENSE_RANK` vs `ROW_NUMBER`? | See §12.2: gaps after ties / no gaps / always unique |
| CTE vs subquery vs temp table? | CTE: readable, scoped to one statement (sometimes inlined). Temp table: materialised, can be indexed, reused across statements |
| What is an index, and when does it hurt? | A B-tree (usually) for fast lookup and range scans. It slows writes and uses space; low-selectivity columns gain little |
| Clustered vs non-clustered (SQL Server)? | Clustered = the table's physical order (one per table). Non-clustered = a separate structure pointing to rows |
| Normalisation (1NF/2NF/3NF)? | Atomic values / no partial dependency on a composite key / no transitive dependencies. Analytics warehouses deliberately **denormalise** (star schema) |
| Star schema? | A central **fact** table (events: recharges, CDRs) joined to **dimension** tables (subscriber, date, cell, product) |
| OLTP vs OLAP? | Many small transactional reads/writes (billing system) vs large analytical scans (warehouse, e.g. Teradata, BigQuery, Synapse, Hive) |
| ACID? | Atomicity, Consistency, Isolation, Durability |
| How do you speed up a slow query? | Read the execution plan; add or adjust indexes on join/filter columns; filter early; avoid functions on indexed columns in `WHERE` (not sargable); avoid `SELECT *`; pre-aggregate; partition large tables by date |
| `DELETE` vs `TRUNCATE` vs `DROP`? | Row-by-row with `WHERE`, logged / remove all rows fast / remove the table itself |

### Big-data SQL you may meet at a telecom

Telecom data volumes (billions of CDRs a month) usually live in **Hadoop/Hive, Spark SQL, Teradata, or a cloud warehouse**. The SQL is the same dialect family, plus:
- **Partitioning** by date (`WHERE event_date BETWEEN …` prunes partitions, so always filter on the partition column).
- **`APPROX_COUNT_DISTINCT` / `approx_percentile`** for speed on huge tables.
- **PySpark DataFrame API** equivalents: `df.groupBy().agg()`, `Window.partitionBy().orderBy()`, `F.lag`, `F.row_number`. The concepts map one-to-one to what you know.

---

> [!check] ✅ Key takeaways
> - Know every JOIN type and the fan-out trap (one-to-many joins inflate sums).
> - `WHERE` filters rows before grouping; `HAVING` filters groups after.
> - Window functions are the interview core: `ROW_NUMBER` (top-N), `LAG` (change), `SUM() OVER` (running totals).
> - Use CTEs to make multi-step logic readable.
> - `NOT IN` with a NULL returns nothing — use `NOT EXISTS` or an anti-join.
> - Build features point-in-time: only data available before the prediction date.

## Further reading

- **SQL for Data Scientists**, Renée Teate (Wiley) — written for exactly this gap: you know SQL, you need the analytical patterns.
- **Mode's SQL Tutorial** — https://mode.com/sql-tutorial/ — free, browser-based, with an excellent intermediate/advanced track on window functions.
- **PostgreSQL docs on window functions** — https://www.postgresql.org/docs/current/tutorial-window.html — the clearest explanation of window semantics anywhere, and it transfers to SQL Server directly.
- **Use The Index, Luke** — https://use-the-index-luke.com/ — free book on SQL performance and indexing. Directly relevant to your FinSight work.
- **StrataScratch** and **DataLemur** — SQL interview questions from real companies, with a heavy window-function emphasis.
- **dbt** — https://www.getdbt.com/ — the standard tool for managing SQL transformations as version-controlled, tested, documented models. If you find yourself with a folder of `.sql` files that build on each other, this is the answer.

---

<!-- nav -->
> [!example] 🧭 Step 4 of 26 · Stage 1 of 7: Toolkit
> ← [Part 03 · Pandas](03_Pandas.md) · [Part 04 · Cleaning & preprocessing](04_Data_Cleaning_and_Preprocessing.md) → · [Course map](00_START_HERE.md)
<!-- /nav -->
