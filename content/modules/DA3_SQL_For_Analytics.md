# SQL for Analytics — Cohorts, Funnels, Retention, Growth and Percentiles

Analyst SQL interviews go past "write a join". They ask for business answers in SQL: month-over-month growth, a retention cohort, a conversion funnel, the median order value, first-touch attribution, daily active users. This module builds on [[S3]] (do that first) with the analytical patterns that come up again and again, each written so you can adapt it under time pressure. Queries are in **PostgreSQL**, with SQL Server and BigQuery differences noted where they matter.

> [!focus]
> **Entry must:** time-series aggregation by day, week and month; growth rates with LAG; running totals and moving averages; conversion and percentages without integer-division bugs; top-N per group; deduplication.
> **Mid adds:** cohort retention tables, funnels with ordered steps, DAU/WAU/MAU, medians and percentiles, sessionisation, attribution, Pareto analysis, and writing readable, efficient analytical SQL.
> **Most asked:** *Month-over-month revenue growth* · *Retention by signup cohort* · *Funnel conversion between steps* · *Median order value* · *Users active three days in a row* · *Top 3 products per category* · *Share of revenue from the top 20% of customers*
> **Time budget:** 5 hours, writing every query against real data.

**Practice schema** (an e-commerce or delivery app):

```sql
users  (user_id, signup_at, city, channel)                       -- channel: 'organic','ads','referral'
orders (order_id, user_id, created_at, status, amount)           -- status: 'paid','cancelled','refunded'
events (event_id, user_id, event_time, event_name, session_id)   -- 'view_item','add_to_cart','checkout','purchase'
```

## DA3.1 Working with time 🟢 ⭐

```sql
-- Daily, weekly and monthly revenue (PostgreSQL)
SELECT date_trunc('day',   created_at)::date AS day,   SUM(amount) AS revenue FROM orders WHERE status='paid' GROUP BY 1 ORDER BY 1;
SELECT date_trunc('week',  created_at)::date AS week,  SUM(amount) FROM orders WHERE status='paid' GROUP BY 1;   -- ISO weeks start Monday
SELECT date_trunc('month', created_at)::date AS month, SUM(amount) FROM orders WHERE status='paid' GROUP BY 1;
```

| Task | PostgreSQL | SQL Server | BigQuery |
|---|---|---|---|
| Truncate to month | `date_trunc('month', ts)` | `DATETRUNC(month, ts)` (2022+) or `DATEFROMPARTS(YEAR(ts), MONTH(ts), 1)` | `DATE_TRUNC(d, MONTH)` |
| Add an interval | `ts + interval '7 days'` | `DATEADD(day, 7, ts)` | `DATE_ADD(d, INTERVAL 7 DAY)` |
| Difference in days | `d2 - d1` (dates) | `DATEDIFF(day, d1, d2)` | `DATE_DIFF(d2, d1, DAY)` |
| Convert to Cairo time | `ts AT TIME ZONE 'Africa/Cairo'` | `ts AT TIME ZONE 'Egypt Standard Time'` | `DATETIME(ts, 'Africa/Cairo')` |

> [!warning] Whose midnight?
> Cairo is two or three hours **ahead** of UTC. If `created_at` is stored in UTC, an order placed at 01:00 Cairo time on 1 April is stored as 22:00 or 23:00 UTC on **31 March**, so grouping by the UTC date puts early-morning orders on the previous day. Convert to the business's time zone before truncating to days, and say which time zone a chart uses ([[FS3.6]]).

**Fill missing days** so charts and moving averages don't skip gaps:

```sql
WITH days AS (SELECT generate_series('2026-01-01'::date, '2026-03-31'::date, interval '1 day')::date AS day),
rev AS (SELECT created_at::date AS day, SUM(amount) AS revenue FROM orders WHERE status='paid' GROUP BY 1)
SELECT d.day, COALESCE(r.revenue, 0) AS revenue
FROM days d LEFT JOIN rev r USING (day) ORDER BY d.day;
-- SQL Server: a calendar table or a recursive CTE;  BigQuery: GENERATE_DATE_ARRAY
```

> [!tip] Keep a calendar table
> Real warehouses have a `dim_date` table: one row per day, with week, month, quarter, fiscal period, weekday, Egyptian public holidays and Ramadan flags. Joining to it beats recomputing date logic in every query ([[DE2]]).

## DA3.2 Growth, running totals and moving averages 🟢 ⭐

```sql
WITH monthly AS (
  SELECT date_trunc('month', created_at)::date AS month, SUM(amount) AS revenue
  FROM orders WHERE status = 'paid' GROUP BY 1
)
SELECT month, revenue,
       LAG(revenue) OVER (ORDER BY month)                                         AS prev_month,
       ROUND(100.0 * (revenue - LAG(revenue) OVER (ORDER BY month))
             / NULLIF(LAG(revenue) OVER (ORDER BY month), 0), 1)                  AS mom_growth_pct,
       ROUND(100.0 * (revenue - LAG(revenue, 12) OVER (ORDER BY month))
             / NULLIF(LAG(revenue, 12) OVER (ORDER BY month), 0), 1)              AS yoy_growth_pct,
       SUM(revenue) OVER (PARTITION BY date_trunc('year', month) ORDER BY month
                          ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW)       AS ytd_revenue,
       AVG(revenue) OVER (ORDER BY month ROWS BETWEEN 2 PRECEDING AND CURRENT ROW) AS moving_avg_3m
FROM monthly ORDER BY month;
```

Notes: `NULLIF(x, 0)` avoids division by zero; `100.0 *` avoids integer division; `LAG(…, 12)` assumes no missing months (fill them first); a moving average over **days** should use a filled daily series.

## DA3.3 Percentages and conditional aggregation 🟢 ⭐

```sql
-- Share of revenue by channel, and cancellation rate by city
SELECT u.channel,
       SUM(o.amount) FILTER (WHERE o.status = 'paid')                                AS revenue,
       ROUND(100.0 * SUM(o.amount) FILTER (WHERE o.status = 'paid')
             / SUM(SUM(o.amount) FILTER (WHERE o.status = 'paid')) OVER (), 1)       AS pct_of_revenue
FROM orders o JOIN users u USING (user_id) GROUP BY u.channel;

SELECT u.city,
       COUNT(*)                                                   AS orders,
       AVG(CASE WHEN o.status = 'cancelled' THEN 1.0 ELSE 0 END)  AS cancel_rate      -- the mean of a 0/1 flag = a rate
FROM orders o JOIN users u USING (user_id) GROUP BY u.city ORDER BY cancel_rate DESC;
```

`FILTER (WHERE …)` is PostgreSQL's conditional aggregate; elsewhere write `SUM(CASE WHEN … THEN amount END)`. **The average of a 0/1 flag is a rate**, a pattern you'll use constantly.

## DA3.4 Cohort retention ⭐

"For each signup month, what share of users ordered again in each later month?"

```sql
WITH first_order AS (                          -- each user's cohort = month of their first paid order
  SELECT user_id, date_trunc('month', MIN(created_at))::date AS cohort_month
  FROM orders WHERE status = 'paid' GROUP BY user_id
),
activity AS (                                  -- months in which each user was active
  SELECT DISTINCT user_id, date_trunc('month', created_at)::date AS active_month
  FROM orders WHERE status = 'paid'
),
joined AS (
  SELECT f.cohort_month,
         (EXTRACT(YEAR FROM age(a.active_month, f.cohort_month)) * 12
          + EXTRACT(MONTH FROM age(a.active_month, f.cohort_month)))::int AS month_number,
         a.user_id
  FROM first_order f JOIN activity a USING (user_id)
),
sizes AS (SELECT cohort_month, COUNT(*) AS cohort_size FROM first_order GROUP BY 1)
SELECT j.cohort_month, s.cohort_size, j.month_number,
       COUNT(DISTINCT j.user_id)                                       AS active_users,
       ROUND(100.0 * COUNT(DISTINCT j.user_id) / s.cohort_size, 1)     AS retention_pct
FROM joined j JOIN sizes s USING (cohort_month)
GROUP BY j.cohort_month, s.cohort_size, j.month_number
ORDER BY j.cohort_month, j.month_number;
-- SQL Server: DATEDIFF(month, cohort_month, active_month) for month_number
```

Pivot the result (in Excel, Power BI or pandas) into the triangle from [[DA1.6]]. The steps to say aloud: **define the cohort event, define "active", compute months since cohort start, count distinct users, divide by cohort size.**

> [!mistake] Recent cohorts look worse
> The newest cohorts haven't had time to reach month 3, so their later cells are empty, not zero. Don't average across cohorts that couldn't have reached that month.

## DA3.5 Funnels ⭐

"Of users who viewed an item this week, how many added to cart, checked out and purchased, **in that order**?"

```sql
WITH steps AS (
  SELECT user_id,
         MIN(event_time) FILTER (WHERE event_name = 'view_item')   AS t_view,
         MIN(event_time) FILTER (WHERE event_name = 'add_to_cart') AS t_cart,
         MIN(event_time) FILTER (WHERE event_name = 'checkout')    AS t_checkout,
         MIN(event_time) FILTER (WHERE event_name = 'purchase')    AS t_purchase
  FROM events
  WHERE event_time >= '2026-09-28' AND event_time < '2026-10-05'
  GROUP BY user_id
)
SELECT COUNT(t_view)                                                         AS viewed,
       COUNT(*) FILTER (WHERE t_cart     > t_view)                            AS added,
       COUNT(*) FILTER (WHERE t_checkout > t_cart  AND t_cart > t_view)       AS checked_out,
       COUNT(*) FILTER (WHERE t_purchase > t_checkout AND t_checkout > t_cart AND t_cart > t_view) AS purchased
FROM steps;
```

Then compute step-to-step conversion (added ÷ viewed, and so on) and overall conversion (purchased ÷ viewed). Decide and state: **per user or per session?** Within what time window between steps? (Ordered steps matter: a purchase without a recorded checkout often means a tracking gap, which is worth reporting too.)

## DA3.6 Active users: DAU, WAU, MAU 🟡 ⭐

```sql
-- Daily active users, and the rolling 7-day and 28-day active counts for each day
WITH daily AS (SELECT DISTINCT event_time::date AS day, user_id FROM events),
days  AS (SELECT DISTINCT day FROM daily)
SELECT d.day,
       (SELECT COUNT(DISTINCT user_id) FROM daily x WHERE x.day = d.day)                                  AS dau,
       (SELECT COUNT(DISTINCT user_id) FROM daily x WHERE x.day BETWEEN d.day - 6  AND d.day)             AS wau,
       (SELECT COUNT(DISTINCT user_id) FROM daily x WHERE x.day BETWEEN d.day - 27 AND d.day)             AS mau
FROM days d ORDER BY d.day;
```

`COUNT(DISTINCT)` can't be a sliding window function in most databases, hence the correlated subqueries (or a self-join). **DAU ÷ MAU** ("stickiness") shows how many monthly users come back daily. On large data, warehouses offer approximate distinct counts (`APPROX_COUNT_DISTINCT`, HyperLogLog).

## DA3.7 Medians and percentiles 🟢 🟡 ⭐

Revenue-like data is skewed, so medians and percentiles describe it better than averages ([[S6.1]]).

```sql
-- PostgreSQL / SQL Server (as a window in SQL Server) / Oracle
SELECT city,
       percentile_cont(0.5) WITHIN GROUP (ORDER BY amount) AS median_order,
       percentile_cont(0.9) WITHIN GROUP (ORDER BY amount) AS p90_order
FROM orders JOIN users USING (user_id) WHERE status = 'paid' GROUP BY city;

-- SQL Server: PERCENTILE_CONT is a window function there
SELECT DISTINCT city, PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY amount) OVER (PARTITION BY city) AS median_order FROM ...;
-- BigQuery: APPROX_QUANTILES(amount, 100)[OFFSET(50)]
```

`percentile_cont` interpolates between values; `percentile_disc` returns an actual value from the data.

## DA3.8 Ranking, top N and Pareto 🟢 ⭐

```sql
-- Top 3 products per category by revenue (ties included)
WITH ranked AS (
  SELECT category, product, SUM(revenue) AS rev,
         DENSE_RANK() OVER (PARTITION BY category ORDER BY SUM(revenue) DESC) AS rk
  FROM sales GROUP BY category, product
)
SELECT * FROM ranked WHERE rk <= 3;
-- Snowflake, BigQuery, Databricks and DuckDB support QUALIFY rk <= 3 instead of the CTE

-- Pareto: what share of revenue comes from the top 20% of customers?
WITH c AS (SELECT user_id, SUM(amount) AS spend FROM orders WHERE status='paid' GROUP BY user_id),
r AS (SELECT spend, NTILE(5) OVER (ORDER BY spend DESC) AS quintile FROM c)
SELECT ROUND(100.0 * SUM(spend) FILTER (WHERE quintile = 1) / SUM(spend), 1) AS top20_share_pct FROM r;
```

**ABC analysis** (classifying products into A, B and C by cumulative revenue share: say 80%, 15% and 5%) uses a running sum over products sorted by revenue divided by the total.

## DA3.9 Sessions, streaks and attribution 🟡 ⭐

**Sessionisation:** a new session starts after 30 minutes of inactivity.

```sql
WITH e AS (
  SELECT user_id, event_time,
         CASE WHEN event_time - LAG(event_time) OVER (PARTITION BY user_id ORDER BY event_time)
                   > interval '30 minutes'
                OR LAG(event_time) OVER (PARTITION BY user_id ORDER BY event_time) IS NULL
              THEN 1 ELSE 0 END AS new_session
  FROM events
)
SELECT user_id, event_time,
       SUM(new_session) OVER (PARTITION BY user_id ORDER BY event_time) AS session_number
FROM e;
```

**Streaks** ("users who ordered on three consecutive days") use the gaps-and-islands trick from [[S3.11]].

**First- and last-touch attribution:**

```sql
SELECT user_id,
       FIRST_VALUE(channel) OVER w AS first_touch,
       LAST_VALUE(channel)  OVER w AS last_touch
FROM touchpoints
WINDOW w AS (PARTITION BY user_id ORDER BY touched_at ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING);
```

(The explicit frame matters for `LAST_VALUE`, [[S3.7]].)

## DA3.10 Data quality checks in SQL 🟢 ⭐

Run these **before** trusting any analysis:

```sql
SELECT COUNT(*), COUNT(DISTINCT order_id) FROM orders;                        -- duplicate IDs?
SELECT order_id, COUNT(*) FROM orders GROUP BY 1 HAVING COUNT(*) > 1;
SELECT COUNT(*) FILTER (WHERE amount IS NULL), COUNT(*) FILTER (WHERE amount < 0) FROM orders;
SELECT MIN(created_at), MAX(created_at) FROM orders;                          -- expected range? future dates?
SELECT status, COUNT(*) FROM orders GROUP BY status;                          -- unexpected values?
SELECT COUNT(*) FROM orders o LEFT JOIN users u USING (user_id) WHERE u.user_id IS NULL;   -- orphans
SELECT created_at::date, COUNT(*) FROM orders GROUP BY 1 ORDER BY 1;          -- missing or partial days
```

## DA3.11 Writing analytical SQL others can trust 🟢

- **CTEs as named steps**, one idea each; a final `SELECT` that reads like the answer.
- **Filter early** (dates, statuses) to shrink data before joins.
- **Aggregate at the right grain before joining** to avoid fan-out ([[S3.4]]).
- **Comment business rules:** `-- paid = not cancelled and not refunded within 7 days (finance definition)`.
- Check totals against a known number (finance's monthly revenue) before presenting.
- Know your engine's cost model: in BigQuery you pay per bytes scanned, so select only needed columns and filter on partitioned dates.

> [!lab] Build the analyst's core query set
> Load an e-commerce dataset into PostgreSQL or DuckDB (the Olist Brazilian e-commerce dataset on Kaggle is realistic and free, or reshape Superstore). Write and save: monthly revenue with MoM and YoY growth; a cohort retention table; a four-step funnel; median and p90 order value by region; top 3 products per category; the top-20% revenue share; and the data-quality checks. Put them in a repository with a README of findings. That's your SQL portfolio for analyst interviews.

## DA3.12 Interview drill 🟢 ⭐

| Question | Strong short answer |
|---|---|
| How do you compute month-over-month growth? | Aggregate by month, then (revenue − LAG(revenue)) ÷ LAG(revenue), with NULLIF to avoid dividing by zero. |
| How do you build a cohort retention table? | Assign each user a cohort (first activity month), compute months since cohort for each active month, count distinct users, divide by cohort size. |
| How do you compute a funnel? | Per user, the first time of each step; count users who reached each step in order within the window; divide step by step. |
| How do you get a median in SQL? | percentile_cont(0.5) WITHIN GROUP (ORDER BY x) (a window function in SQL Server; APPROX_QUANTILES in BigQuery). |
| Why might your conversion rate be 0? | Integer division; multiply by 1.0 or cast. |
| How do you fill missing dates? | Generate a date series (or use a calendar table) and left-join the data to it. |
| How do you compute a rate with a CASE? | AVG(CASE WHEN condition THEN 1.0 ELSE 0 END). |
| How do you find the top N per group? | DENSE_RANK (or ROW_NUMBER) partitioned by the group, then filter, or QUALIFY where supported. |
| How do you sessionise events? | Flag a new session when the gap since the previous event exceeds 30 minutes, then a running sum of the flags. |
| What's DAU/MAU? | Daily over monthly active users: a stickiness measure. |
| What do you check before trusting data? | Duplicates, nulls, negative or impossible values, date ranges, unexpected categories, orphan keys, missing days. |
| Why report days in the business time zone? | Orders near midnight shift days when stored in UTC, distorting daily figures. |

## Key takeaways

> [!check]
> - Time series: truncate dates, fill gaps, then use LAG and windowed sums and averages.
> - Cohorts: cohort event, activity definition, months since start, distinct users ÷ cohort size.
> - Funnels: first time per step, ordered, within a window, per user or session.
> - Medians and percentiles over averages for money; 100.0 and NULLIF for safe rates.
> - Run data-quality checks first and reconcile with known totals.

## Sources

- PostgreSQL documentation: [Date/time functions](https://www.postgresql.org/docs/current/functions-datetime.html), [Aggregate functions, including ordered-set (percentile_cont)](https://www.postgresql.org/docs/current/functions-aggregate.html), [Window functions](https://www.postgresql.org/docs/current/functions-window.html), [generate_series](https://www.postgresql.org/docs/current/functions-srf.html).
- Microsoft Learn: [PERCENTILE_CONT (T-SQL)](https://learn.microsoft.com/en-us/sql/t-sql/functions/percentile-cont-transact-sql), [AT TIME ZONE](https://learn.microsoft.com/en-us/sql/t-sql/queries/at-time-zone-transact-sql).
- Google Cloud: [BigQuery date functions](https://cloud.google.com/bigquery/docs/reference/standard-sql/date_functions), [APPROX_QUANTILES](https://cloud.google.com/bigquery/docs/reference/standard-sql/approximate_aggregate_functions).
- Olist, [Brazilian E-Commerce Public Dataset](https://www.kaggle.com/datasets/olistbr/brazilian-ecommerce) (Kaggle).
- Your *AI Journey* Part 12 for more telecom-flavoured SQL problems.
