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

## DA3.0 Foundations: from event rows to a time series 🟢

Almost every analytical query has the same shape, usually written as a chain of CTEs:

1. **Filter** the raw rows to what counts (paid orders, this year, no test accounts).
2. **Bucket** timestamps into periods (`date_trunc('month', …)`) or users into groups (a signup cohort, a city).
3. **Aggregate** with `GROUP BY`: many rows in, one row per bucket out.
4. **Compare** with **window functions** (`LAG`, a running `SUM`, `RANK`), which look at neighbouring rows **without collapsing them**.

The difference between steps 3 and 4 is the core idea of this module: `GROUP BY` reduces rows; a window function adds a column to each row ([[S3.7]]).

<figure class="dia steps" data-start="1"><svg viewBox="0 0 720 242" role="img" aria-label="An analytical query step by step: filter raw orders, bucket timestamps by month, aggregate with GROUP BY to one row per month, then add the previous month with a LAG window function">
<rect class="sN" x="400" y="22" width="306" height="208" rx="8"/>
<g data-s="1-1"><rect class="sW" x="404" y="117" width="298" height="18" rx="3" opacity=".5"/></g>
<g data-s="2-2"><rect class="sW" x="404" y="45" width="298" height="18" rx="3" opacity=".5"/><rect class="sW" x="404" y="63" width="298" height="18" rx="3" opacity=".5"/></g>
<g data-s="3-3"><rect class="sW" x="404" y="81" width="298" height="18" rx="3" opacity=".5"/><rect class="sW" x="404" y="135" width="298" height="18" rx="3" opacity=".5"/></g>
<g data-s="4-4"><rect class="sW" x="404" y="153" width="298" height="18" rx="3" opacity=".5"/><rect class="sW" x="404" y="171" width="298" height="18" rx="3" opacity=".5"/><rect class="sW" x="404" y="189" width="298" height="18" rx="3" opacity=".5"/></g>
<text class="sC" x="410" y="40" xml:space="preserve" style="white-space:pre">WITH monthly AS (</text>
<text class="sC" x="410" y="58" xml:space="preserve" style="white-space:pre">  SELECT date_trunc('month',</text>
<text class="sC" x="410" y="76" xml:space="preserve" style="white-space:pre">           created_at) AS m,</text>
<text class="sC" x="410" y="94" xml:space="preserve" style="white-space:pre">         SUM(amount) AS revenue</text>
<text class="sC" x="410" y="112" xml:space="preserve" style="white-space:pre">  FROM orders</text>
<text class="sC" x="410" y="130" xml:space="preserve" style="white-space:pre">  WHERE status = 'paid'</text>
<text class="sC" x="410" y="148" xml:space="preserve" style="white-space:pre">  GROUP BY 1)</text>
<text class="sC" x="410" y="166" xml:space="preserve" style="white-space:pre">SELECT m, revenue,</text>
<text class="sC" x="410" y="184" xml:space="preserve" style="white-space:pre">  LAG(revenue) OVER (ORDER BY m)</text>
<text class="sC" x="410" y="202" xml:space="preserve" style="white-space:pre">    AS prev_month</text>
<text class="sC" x="410" y="220" xml:space="preserve" style="white-space:pre">FROM monthly;</text>
<g data-s="1-1"><rect class="sN" x="14" y="22" width="150" height="24" rx="0"/><text class="sT" x="89" y="38" text-anchor="middle">created_at</text><rect class="sN" x="164" y="22" width="100" height="24" rx="0"/><text class="sT" x="214" y="38" text-anchor="middle">status</text><rect class="sN" x="264" y="22" width="80" height="24" rx="0"/><text class="sT" x="304" y="38" text-anchor="middle">amount</text><rect class="sB" x="14" y="46" width="150" height="24" rx="0" opacity=".6"/><text class="sC" x="89" y="62" text-anchor="middle">2026-01-04 10:12</text><rect class="sB" x="164" y="46" width="100" height="24" rx="0" opacity=".6"/><text class="sC" x="214" y="62" text-anchor="middle">paid</text><rect class="sB" x="264" y="46" width="80" height="24" rx="0" opacity=".6"/><text class="sC" x="304" y="62" text-anchor="middle">300</text><rect class="sR" x="14" y="70" width="150" height="24" rx="0" opacity=".6"/><text class="sC" x="89" y="86" text-anchor="middle">2026-01-19 18:40</text><rect class="sR" x="164" y="70" width="100" height="24" rx="0" opacity=".6"/><text class="sC" x="214" y="86" text-anchor="middle">cancelled</text><rect class="sR" x="264" y="70" width="80" height="24" rx="0" opacity=".6"/><text class="sC" x="304" y="86" text-anchor="middle">120</text><rect class="sB" x="14" y="94" width="150" height="24" rx="0" opacity=".6"/><text class="sC" x="89" y="110" text-anchor="middle">2026-01-27 09:05</text><rect class="sB" x="164" y="94" width="100" height="24" rx="0" opacity=".6"/><text class="sC" x="214" y="110" text-anchor="middle">paid</text><rect class="sB" x="264" y="94" width="80" height="24" rx="0" opacity=".6"/><text class="sC" x="304" y="110" text-anchor="middle">500</text><rect class="sB" x="14" y="118" width="150" height="24" rx="0" opacity=".6"/><text class="sC" x="89" y="134" text-anchor="middle">2026-02-02 21:33</text><rect class="sB" x="164" y="118" width="100" height="24" rx="0" opacity=".6"/><text class="sC" x="214" y="134" text-anchor="middle">paid</text><rect class="sB" x="264" y="118" width="80" height="24" rx="0" opacity=".6"/><text class="sC" x="304" y="134" text-anchor="middle">250</text><rect class="sB" x="14" y="142" width="150" height="24" rx="0" opacity=".6"/><text class="sC" x="89" y="158" text-anchor="middle">2026-02-15 13:00</text><rect class="sB" x="164" y="142" width="100" height="24" rx="0" opacity=".6"/><text class="sC" x="214" y="158" text-anchor="middle">paid</text><rect class="sB" x="264" y="142" width="80" height="24" rx="0" opacity=".6"/><text class="sC" x="304" y="158" text-anchor="middle">650</text><rect class="sB" x="14" y="166" width="150" height="24" rx="0" opacity=".6"/><text class="sC" x="89" y="182" text-anchor="middle">2026-03-08 11:20</text><rect class="sB" x="164" y="166" width="100" height="24" rx="0" opacity=".6"/><text class="sC" x="214" y="182" text-anchor="middle">paid</text><rect class="sB" x="264" y="166" width="80" height="24" rx="0" opacity=".6"/><text class="sC" x="304" y="182" text-anchor="middle">400</text><rect class="sB" x="14" y="190" width="150" height="24" rx="0" opacity=".6"/><text class="sC" x="89" y="206" text-anchor="middle">2026-03-30 16:45</text><rect class="sB" x="164" y="190" width="100" height="24" rx="0" opacity=".6"/><text class="sC" x="214" y="206" text-anchor="middle">paid</text><rect class="sB" x="264" y="190" width="80" height="24" rx="0" opacity=".6"/><text class="sC" x="304" y="206" text-anchor="middle">900</text><line class="sLr" x1="20" y1="82" x2="340" y2="82"/><text class="sC" x="180" y="232" text-anchor="middle">7 rows in, 6 survive the WHERE</text></g>
<g data-s="2-2"><rect class="sN" x="14" y="22" width="150" height="24" rx="0"/><text class="sT" x="89" y="38" text-anchor="middle">created_at</text><rect class="sN" x="164" y="22" width="80" height="24" rx="0"/><text class="sT" x="204" y="38" text-anchor="middle">amount</text><rect class="sN" x="244" y="22" width="100" height="24" rx="0"/><text class="sT" x="294" y="38" text-anchor="middle">m</text><rect class="sA" x="14" y="46" width="150" height="24" rx="0" opacity=".6"/><text class="sC" x="89" y="62" text-anchor="middle">2026-01-04 10:12</text><rect class="sA" x="164" y="46" width="80" height="24" rx="0" opacity=".6"/><text class="sC" x="204" y="62" text-anchor="middle">300</text><rect class="sA" x="244" y="46" width="100" height="24" rx="0" opacity=".6"/><text class="sC" x="294" y="62" text-anchor="middle">Jan</text><rect class="sA" x="14" y="70" width="150" height="24" rx="0" opacity=".6"/><text class="sC" x="89" y="86" text-anchor="middle">2026-01-27 09:05</text><rect class="sA" x="164" y="70" width="80" height="24" rx="0" opacity=".6"/><text class="sC" x="204" y="86" text-anchor="middle">500</text><rect class="sA" x="244" y="70" width="100" height="24" rx="0" opacity=".6"/><text class="sC" x="294" y="86" text-anchor="middle">Jan</text><rect class="sV" x="14" y="94" width="150" height="24" rx="0" opacity=".6"/><text class="sC" x="89" y="110" text-anchor="middle">2026-02-02 21:33</text><rect class="sV" x="164" y="94" width="80" height="24" rx="0" opacity=".6"/><text class="sC" x="204" y="110" text-anchor="middle">250</text><rect class="sV" x="244" y="94" width="100" height="24" rx="0" opacity=".6"/><text class="sC" x="294" y="110" text-anchor="middle">Feb</text><rect class="sV" x="14" y="118" width="150" height="24" rx="0" opacity=".6"/><text class="sC" x="89" y="134" text-anchor="middle">2026-02-15 13:00</text><rect class="sV" x="164" y="118" width="80" height="24" rx="0" opacity=".6"/><text class="sC" x="204" y="134" text-anchor="middle">650</text><rect class="sV" x="244" y="118" width="100" height="24" rx="0" opacity=".6"/><text class="sC" x="294" y="134" text-anchor="middle">Feb</text><rect class="sG" x="14" y="142" width="150" height="24" rx="0" opacity=".6"/><text class="sC" x="89" y="158" text-anchor="middle">2026-03-08 11:20</text><rect class="sG" x="164" y="142" width="80" height="24" rx="0" opacity=".6"/><text class="sC" x="204" y="158" text-anchor="middle">400</text><rect class="sG" x="244" y="142" width="100" height="24" rx="0" opacity=".6"/><text class="sC" x="294" y="158" text-anchor="middle">Mar</text><rect class="sG" x="14" y="166" width="150" height="24" rx="0" opacity=".6"/><text class="sC" x="89" y="182" text-anchor="middle">2026-03-30 16:45</text><rect class="sG" x="164" y="166" width="80" height="24" rx="0" opacity=".6"/><text class="sC" x="204" y="182" text-anchor="middle">900</text><rect class="sG" x="244" y="166" width="100" height="24" rx="0" opacity=".6"/><text class="sC" x="294" y="182" text-anchor="middle">Mar</text><text class="sC" x="180" y="232" text-anchor="middle">each row tagged with its month bucket</text></g>
<g data-s="3-3"><rect class="sN" x="14" y="22" width="120" height="24" rx="0"/><text class="sT" x="74" y="38" text-anchor="middle">m</text><rect class="sN" x="134" y="22" width="120" height="24" rx="0"/><text class="sT" x="194" y="38" text-anchor="middle">revenue</text><rect class="sA" x="14" y="46" width="120" height="24" rx="0" opacity=".6"/><text class="sC" x="74" y="62" text-anchor="middle">Jan</text><rect class="sA" x="134" y="46" width="120" height="24" rx="0" opacity=".6"/><text class="sC" x="194" y="62" text-anchor="middle">800</text><rect class="sV" x="14" y="70" width="120" height="24" rx="0" opacity=".6"/><text class="sC" x="74" y="86" text-anchor="middle">Feb</text><rect class="sV" x="134" y="70" width="120" height="24" rx="0" opacity=".6"/><text class="sC" x="194" y="86" text-anchor="middle">900</text><rect class="sG" x="14" y="94" width="120" height="24" rx="0" opacity=".6"/><text class="sC" x="74" y="110" text-anchor="middle">Mar</text><rect class="sG" x="134" y="94" width="120" height="24" rx="0" opacity=".6"/><text class="sC" x="194" y="110" text-anchor="middle">1,300</text><text class="sT" x="180" y="150" text-anchor="middle">GROUP BY: 6 rows → 3 rows</text><text class="sC" x="180" y="172" text-anchor="middle">one row per bucket</text></g>
<g data-s="4-4"><rect class="sN" x="14" y="22" width="70" height="24" rx="0"/><text class="sT" x="49" y="38" text-anchor="middle">m</text><rect class="sN" x="84" y="22" width="90" height="24" rx="0"/><text class="sT" x="129" y="38" text-anchor="middle">revenue</text><rect class="sN" x="174" y="22" width="100" height="24" rx="0"/><text class="sT" x="224" y="38" text-anchor="middle">prev_month</text><rect class="sN" x="274" y="22" width="100" height="24" rx="0"/><text class="sT" x="324" y="38" text-anchor="middle">growth</text><rect class="sA" x="14" y="46" width="70" height="24" rx="0" opacity=".6"/><text class="sC" x="49" y="62" text-anchor="middle">Jan</text><rect class="sA" x="84" y="46" width="90" height="24" rx="0" opacity=".6"/><text class="sC" x="129" y="62" text-anchor="middle">800</text><rect class="sA" x="174" y="46" width="100" height="24" rx="0" opacity=".6"/><text class="sC" x="224" y="62" text-anchor="middle">—</text><rect class="sA" x="274" y="46" width="100" height="24" rx="0" opacity=".6"/><text class="sC" x="324" y="62" text-anchor="middle">—</text><rect class="sV" x="14" y="70" width="70" height="24" rx="0" opacity=".6"/><text class="sC" x="49" y="86" text-anchor="middle">Feb</text><rect class="sV" x="84" y="70" width="90" height="24" rx="0" opacity=".6"/><text class="sC" x="129" y="86" text-anchor="middle">900</text><rect class="sV" x="174" y="70" width="100" height="24" rx="0" opacity=".6"/><text class="sC" x="224" y="86" text-anchor="middle">800</text><rect class="sV" x="274" y="70" width="100" height="24" rx="0" opacity=".6"/><text class="sC" x="324" y="86" text-anchor="middle">+12.5%</text><rect class="sG" x="14" y="94" width="70" height="24" rx="0" opacity=".6"/><text class="sC" x="49" y="110" text-anchor="middle">Mar</text><rect class="sG" x="84" y="94" width="90" height="24" rx="0" opacity=".6"/><text class="sC" x="129" y="110" text-anchor="middle">1,300</text><rect class="sG" x="174" y="94" width="100" height="24" rx="0" opacity=".6"/><text class="sC" x="224" y="110" text-anchor="middle">900</text><rect class="sG" x="274" y="94" width="100" height="24" rx="0" opacity=".6"/><text class="sC" x="324" y="110" text-anchor="middle">+44.4%</text><text class="sT" x="180" y="150" text-anchor="middle">window function: still 3 rows,</text><text class="sC" x="180" y="172" text-anchor="middle">each one can see its neighbour</text></g>
</svg><ol class="dia-steps">
<li><b>Filter.</b> Start from raw rows and keep only what counts: paid orders, here. The cancelled order is gone before anything is summed.</li>
<li><b>Bucket.</b> <code>date_trunc('month', …)</code> maps every timestamp to the first day of its month, so rows can be grouped.</li>
<li><b>Aggregate.</b> <code>GROUP BY</code> collapses each bucket to one row: six orders become three months.</li>
<li><b>Compare.</b> A window function adds a column without collapsing anything: <code>LAG</code> lets each month see the one before it, so growth is one subtraction away.</li>
</ol><figcaption>Filter, bucket, aggregate, compare. Most analyst SQL is this chain with different buckets and different windows.</figcaption></figure>

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

<figure class="dia"><svg viewBox="0 0 720 224" role="img" aria-label="A daily revenue series with day 4 missing compared with the same series filled from a calendar, where day 4 is zero">
<text class="sRt" x="180" y="22" text-anchor="middle">missing day: no row at all</text>
<line class="sLm" x1="30" y1="170" x2="340" y2="170"/>
<text class="sC" x="55" y="188" text-anchor="middle">day 1</text>
<rect class="sB" x="40" y="80" width="30" height="90" rx="3"/>
<text class="sC" x="97" y="188" text-anchor="middle">day 2</text>
<rect class="sB" x="82" y="68.75" width="30" height="101.25" rx="3"/>
<text class="sC" x="139" y="188" text-anchor="middle">day 3</text>
<rect class="sB" x="124" y="74" width="30" height="96" rx="3"/>
<text class="sC" x="181" y="188" text-anchor="middle">day 4</text>
<rect class="sN" x="166" y="60" width="30" height="110" rx="3" stroke-dasharray="4 3"/><text class="sRt" x="181" y="118" text-anchor="middle">?</text>
<text class="sC" x="223" y="188" text-anchor="middle">day 5</text>
<rect class="sB" x="208" y="65" width="30" height="105" rx="3"/>
<text class="sC" x="265" y="188" text-anchor="middle">day 6</text>
<rect class="sB" x="250" y="57.5" width="30" height="112.5" rx="3"/>
<text class="sC" x="307" y="188" text-anchor="middle">day 7</text>
<rect class="sB" x="292" y="66.5" width="30" height="103.5" rx="3"/>
<text class="sGt" x="540" y="22" text-anchor="middle">calendar LEFT JOIN: zero, not missing</text>
<line class="sLm" x1="390" y1="170" x2="700" y2="170"/>
<text class="sC" x="415" y="188" text-anchor="middle">day 1</text>
<rect class="sA" x="400" y="80" width="30" height="90" rx="3"/>
<text class="sC" x="457" y="188" text-anchor="middle">day 2</text>
<rect class="sA" x="442" y="68.75" width="30" height="101.25" rx="3"/>
<text class="sC" x="499" y="188" text-anchor="middle">day 3</text>
<rect class="sA" x="484" y="74" width="30" height="96" rx="3"/>
<text class="sC" x="541" y="188" text-anchor="middle">day 4</text>
<rect class="sG" x="526" y="167" width="30" height="3" rx="1"/><text class="sGt" x="541" y="158" text-anchor="middle">0</text>
<text class="sC" x="583" y="188" text-anchor="middle">day 5</text>
<rect class="sA" x="568" y="65" width="30" height="105" rx="3"/>
<text class="sC" x="625" y="188" text-anchor="middle">day 6</text>
<rect class="sA" x="610" y="57.5" width="30" height="112.5" rx="3"/>
<text class="sC" x="667" y="188" text-anchor="middle">day 7</text>
<rect class="sA" x="652" y="66.5" width="30" height="103.5" rx="3"/>
<text class="sRt" x="180" y="212" text-anchor="middle">LAG on day 5 returns day 3: "growth" over two days</text><text class="sGt" x="540" y="212" text-anchor="middle">every day present; LAG and moving averages line up</text>
</svg><figcaption>Window functions count rows, not days. A day with no orders has no row unless you generate one.</figcaption></figure>

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

<figure class="dia"><svg viewBox="0 0 720 210" role="img" aria-label="Three users' order months mapped to month numbers since their first order, and the resulting cohort counts for January and February">
<text class="sT" x="150" y="26" text-anchor="middle">Jan</text>
<text class="sT" x="210" y="26" text-anchor="middle">Feb</text>
<text class="sT" x="270" y="26" text-anchor="middle">Mar</text>
<text class="sT" x="330" y="26" text-anchor="middle">Apr</text>
<text class="sT" x="390" y="26" text-anchor="middle">May</text>
<text class="sC" x="110" y="55" text-anchor="end">user 7</text><line class="sLm" x1="130" y1="50" x2="410" y2="50"/>
<circle class="sPg" cx="150" cy="50" r="8"/><text class="sGt" x="150" y="74" text-anchor="middle">+0</text>
<circle class="sP" cx="270" cy="50" r="8"/><text class="sC" x="270" y="74" text-anchor="middle">+2</text>
<circle class="sP" cx="330" cy="50" r="8"/><text class="sC" x="330" y="74" text-anchor="middle">+3</text>
<text class="sC" x="110" y="99" text-anchor="end">user 9</text><line class="sLm" x1="130" y1="94" x2="410" y2="94"/>
<circle class="sPg" cx="210" cy="94" r="8"/><text class="sGt" x="210" y="118" text-anchor="middle">+0</text>
<circle class="sP" cx="270" cy="94" r="8"/><text class="sC" x="270" y="118" text-anchor="middle">+1</text>
<text class="sC" x="110" y="143" text-anchor="end">user 12</text><line class="sLm" x1="130" y1="138" x2="410" y2="138"/>
<circle class="sPg" cx="210" cy="138" r="8"/><text class="sGt" x="210" y="162" text-anchor="middle">+0</text>
<circle class="sP" cx="390" cy="138" r="8"/><text class="sC" x="390" y="162" text-anchor="middle">+3</text>
<text class="sC" x="270" y="196" text-anchor="middle">green = first order (the cohort) · labels = month_number</text>
<text class="sT" x="560" y="26" text-anchor="middle">counts per cell</text>
<text class="sM" x="500" y="50" text-anchor="middle">M0</text>
<text class="sM" x="550" y="50" text-anchor="middle">M1</text>
<text class="sM" x="600" y="50" text-anchor="middle">M2</text>
<text class="sM" x="650" y="50" text-anchor="middle">M3</text>
<text class="sT" x="468" y="82" text-anchor="end">Jan</text>
<rect class="sG" x="476" y="60" width="46" height="34" rx="4" opacity=".7"/><text class="sC" x="499" y="82" text-anchor="middle">1</text>
<rect class="sN" x="526" y="60" width="46" height="34" rx="4"/><text class="sC" x="549" y="82" text-anchor="middle">0</text>
<rect class="sG" x="576" y="60" width="46" height="34" rx="4" opacity=".7"/><text class="sC" x="599" y="82" text-anchor="middle">1</text>
<rect class="sG" x="626" y="60" width="46" height="34" rx="4" opacity=".7"/><text class="sC" x="649" y="82" text-anchor="middle">1</text>
<text class="sT" x="468" y="122" text-anchor="end">Feb</text>
<rect class="sG" x="476" y="100" width="46" height="34" rx="4" opacity=".7"/><text class="sC" x="499" y="122" text-anchor="middle">2</text>
<rect class="sG" x="526" y="100" width="46" height="34" rx="4" opacity=".7"/><text class="sC" x="549" y="122" text-anchor="middle">1</text>
<rect class="sN" x="576" y="100" width="46" height="34" rx="4"/><text class="sC" x="599" y="122" text-anchor="middle">0</text>
<rect class="sG" x="626" y="100" width="46" height="34" rx="4" opacity=".7"/><text class="sC" x="649" y="122" text-anchor="middle">1</text>
<text class="sC" x="580" y="160" text-anchor="middle">then ÷ cohort size → %</text>
</svg><figcaption>How one user becomes cells in the triangle: their first order picks the row, each later active month picks a column.</figcaption></figure>

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

<figure class="dia"><svg viewBox="0 0 720 244" role="img" aria-label="Funnel: 1,000 users viewed an item, 320 added to cart, 180 checked out and 140 purchased; step conversions 32%, 56% and 78%, overall 14%">
<rect class="sB" x="110" y="20" width="440" height="36" rx="4"/><text class="sT" x="14" y="43">viewed</text><text class="sT" x="330" y="43" text-anchor="middle">1,000</text>
<rect class="sA" x="259.6" y="70" width="140.8" height="36" rx="4"/><text class="sT" x="14" y="93">added to cart</text><text class="sT" x="330" y="93" text-anchor="middle">320</text>
<text class="sC" x="630" y="68" text-anchor="middle">32% of the step above</text>
<rect class="sV" x="290.4" y="120" width="79.2" height="36" rx="4"/><text class="sT" x="14" y="143">checked out</text><text class="sT" x="330" y="143" text-anchor="middle">180</text>
<text class="sC" x="630" y="118" text-anchor="middle">56% of the step above</text>
<rect class="sG" x="299.2" y="170" width="61.6" height="36" rx="4"/><text class="sT" x="14" y="193">purchased</text><text class="sT" x="330" y="193" text-anchor="middle">140</text>
<text class="sC" x="630" y="168" text-anchor="middle">78% of the step above</text>
<text class="sGt" x="606" y="232" text-anchor="middle">overall: 14% of viewers bought</text>
<text class="sC" x="250" y="232" text-anchor="middle">counted only if each step's first time is after the previous step</text>
</svg><figcaption>Step conversion shows where people drop out (here, the cart); overall conversion is the headline.</figcaption></figure>

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

<figure class="dia"><svg viewBox="0 0 720 224" role="img" aria-label="Activity of five users over 28 days with windows for daily, weekly and monthly active users ending on day 28: DAU 2, WAU 4, MAU 5">
<text class="sC" x="106" y="74" text-anchor="end">u1</text>
<rect class="sA" x="116" y="60" width="16" height="18" rx="2"/>
<rect class="sA" x="134" y="60" width="16" height="18" rx="2"/>
<rect class="sA" x="152" y="60" width="16" height="18" rx="2"/>
<rect class="sA" x="170" y="60" width="16" height="18" rx="2"/>
<rect class="sA" x="188" y="60" width="16" height="18" rx="2"/>
<rect class="sN" x="206" y="60" width="16" height="18" rx="2" opacity=".5"/>
<rect class="sA" x="224" y="60" width="16" height="18" rx="2"/>
<rect class="sA" x="242" y="60" width="16" height="18" rx="2"/>
<rect class="sA" x="260" y="60" width="16" height="18" rx="2"/>
<rect class="sA" x="278" y="60" width="16" height="18" rx="2"/>
<rect class="sA" x="296" y="60" width="16" height="18" rx="2"/>
<rect class="sA" x="314" y="60" width="16" height="18" rx="2"/>
<rect class="sN" x="332" y="60" width="16" height="18" rx="2" opacity=".5"/>
<rect class="sA" x="350" y="60" width="16" height="18" rx="2"/>
<rect class="sA" x="368" y="60" width="16" height="18" rx="2"/>
<rect class="sA" x="386" y="60" width="16" height="18" rx="2"/>
<rect class="sA" x="404" y="60" width="16" height="18" rx="2"/>
<rect class="sA" x="422" y="60" width="16" height="18" rx="2"/>
<rect class="sA" x="440" y="60" width="16" height="18" rx="2"/>
<rect class="sN" x="458" y="60" width="16" height="18" rx="2" opacity=".5"/>
<rect class="sA" x="476" y="60" width="16" height="18" rx="2"/>
<rect class="sA" x="494" y="60" width="16" height="18" rx="2"/>
<rect class="sA" x="512" y="60" width="16" height="18" rx="2"/>
<rect class="sA" x="530" y="60" width="16" height="18" rx="2"/>
<rect class="sA" x="548" y="60" width="16" height="18" rx="2"/>
<rect class="sA" x="566" y="60" width="16" height="18" rx="2"/>
<rect class="sA" x="584" y="60" width="16" height="18" rx="2"/>
<rect class="sA" x="602" y="60" width="16" height="18" rx="2"/>
<text class="sC" x="106" y="96" text-anchor="end">u2</text>
<rect class="sA" x="116" y="82" width="16" height="18" rx="2"/>
<rect class="sN" x="134" y="82" width="16" height="18" rx="2" opacity=".5"/>
<rect class="sN" x="152" y="82" width="16" height="18" rx="2" opacity=".5"/>
<rect class="sN" x="170" y="82" width="16" height="18" rx="2" opacity=".5"/>
<rect class="sN" x="188" y="82" width="16" height="18" rx="2" opacity=".5"/>
<rect class="sN" x="206" y="82" width="16" height="18" rx="2" opacity=".5"/>
<rect class="sN" x="224" y="82" width="16" height="18" rx="2" opacity=".5"/>
<rect class="sA" x="242" y="82" width="16" height="18" rx="2"/>
<rect class="sN" x="260" y="82" width="16" height="18" rx="2" opacity=".5"/>
<rect class="sN" x="278" y="82" width="16" height="18" rx="2" opacity=".5"/>
<rect class="sN" x="296" y="82" width="16" height="18" rx="2" opacity=".5"/>
<rect class="sN" x="314" y="82" width="16" height="18" rx="2" opacity=".5"/>
<rect class="sN" x="332" y="82" width="16" height="18" rx="2" opacity=".5"/>
<rect class="sN" x="350" y="82" width="16" height="18" rx="2" opacity=".5"/>
<rect class="sA" x="368" y="82" width="16" height="18" rx="2"/>
<rect class="sN" x="386" y="82" width="16" height="18" rx="2" opacity=".5"/>
<rect class="sN" x="404" y="82" width="16" height="18" rx="2" opacity=".5"/>
<rect class="sN" x="422" y="82" width="16" height="18" rx="2" opacity=".5"/>
<rect class="sN" x="440" y="82" width="16" height="18" rx="2" opacity=".5"/>
<rect class="sN" x="458" y="82" width="16" height="18" rx="2" opacity=".5"/>
<rect class="sN" x="476" y="82" width="16" height="18" rx="2" opacity=".5"/>
<rect class="sA" x="494" y="82" width="16" height="18" rx="2"/>
<rect class="sN" x="512" y="82" width="16" height="18" rx="2" opacity=".5"/>
<rect class="sN" x="530" y="82" width="16" height="18" rx="2" opacity=".5"/>
<rect class="sN" x="548" y="82" width="16" height="18" rx="2" opacity=".5"/>
<rect class="sN" x="566" y="82" width="16" height="18" rx="2" opacity=".5"/>
<rect class="sN" x="584" y="82" width="16" height="18" rx="2" opacity=".5"/>
<rect class="sN" x="602" y="82" width="16" height="18" rx="2" opacity=".5"/>
<text class="sC" x="106" y="118" text-anchor="end">u3</text>
<rect class="sN" x="116" y="104" width="16" height="18" rx="2" opacity=".5"/>
<rect class="sN" x="134" y="104" width="16" height="18" rx="2" opacity=".5"/>
<rect class="sA" x="152" y="104" width="16" height="18" rx="2"/>
<rect class="sN" x="170" y="104" width="16" height="18" rx="2" opacity=".5"/>
<rect class="sN" x="188" y="104" width="16" height="18" rx="2" opacity=".5"/>
<rect class="sN" x="206" y="104" width="16" height="18" rx="2" opacity=".5"/>
<rect class="sN" x="224" y="104" width="16" height="18" rx="2" opacity=".5"/>
<rect class="sN" x="242" y="104" width="16" height="18" rx="2" opacity=".5"/>
<rect class="sN" x="260" y="104" width="16" height="18" rx="2" opacity=".5"/>
<rect class="sN" x="278" y="104" width="16" height="18" rx="2" opacity=".5"/>
<rect class="sN" x="296" y="104" width="16" height="18" rx="2" opacity=".5"/>
<rect class="sN" x="314" y="104" width="16" height="18" rx="2" opacity=".5"/>
<rect class="sN" x="332" y="104" width="16" height="18" rx="2" opacity=".5"/>
<rect class="sN" x="350" y="104" width="16" height="18" rx="2" opacity=".5"/>
<rect class="sN" x="368" y="104" width="16" height="18" rx="2" opacity=".5"/>
<rect class="sN" x="386" y="104" width="16" height="18" rx="2" opacity=".5"/>
<rect class="sN" x="404" y="104" width="16" height="18" rx="2" opacity=".5"/>
<rect class="sN" x="422" y="104" width="16" height="18" rx="2" opacity=".5"/>
<rect class="sN" x="440" y="104" width="16" height="18" rx="2" opacity=".5"/>
<rect class="sN" x="458" y="104" width="16" height="18" rx="2" opacity=".5"/>
<rect class="sN" x="476" y="104" width="16" height="18" rx="2" opacity=".5"/>
<rect class="sN" x="494" y="104" width="16" height="18" rx="2" opacity=".5"/>
<rect class="sN" x="512" y="104" width="16" height="18" rx="2" opacity=".5"/>
<rect class="sN" x="530" y="104" width="16" height="18" rx="2" opacity=".5"/>
<rect class="sN" x="548" y="104" width="16" height="18" rx="2" opacity=".5"/>
<rect class="sN" x="566" y="104" width="16" height="18" rx="2" opacity=".5"/>
<rect class="sN" x="584" y="104" width="16" height="18" rx="2" opacity=".5"/>
<rect class="sN" x="602" y="104" width="16" height="18" rx="2" opacity=".5"/>
<text class="sC" x="106" y="140" text-anchor="end">u4</text>
<rect class="sN" x="116" y="126" width="16" height="18" rx="2" opacity=".5"/>
<rect class="sN" x="134" y="126" width="16" height="18" rx="2" opacity=".5"/>
<rect class="sN" x="152" y="126" width="16" height="18" rx="2" opacity=".5"/>
<rect class="sN" x="170" y="126" width="16" height="18" rx="2" opacity=".5"/>
<rect class="sN" x="188" y="126" width="16" height="18" rx="2" opacity=".5"/>
<rect class="sN" x="206" y="126" width="16" height="18" rx="2" opacity=".5"/>
<rect class="sN" x="224" y="126" width="16" height="18" rx="2" opacity=".5"/>
<rect class="sN" x="242" y="126" width="16" height="18" rx="2" opacity=".5"/>
<rect class="sN" x="260" y="126" width="16" height="18" rx="2" opacity=".5"/>
<rect class="sN" x="278" y="126" width="16" height="18" rx="2" opacity=".5"/>
<rect class="sN" x="296" y="126" width="16" height="18" rx="2" opacity=".5"/>
<rect class="sN" x="314" y="126" width="16" height="18" rx="2" opacity=".5"/>
<rect class="sN" x="332" y="126" width="16" height="18" rx="2" opacity=".5"/>
<rect class="sN" x="350" y="126" width="16" height="18" rx="2" opacity=".5"/>
<rect class="sN" x="368" y="126" width="16" height="18" rx="2" opacity=".5"/>
<rect class="sN" x="386" y="126" width="16" height="18" rx="2" opacity=".5"/>
<rect class="sN" x="404" y="126" width="16" height="18" rx="2" opacity=".5"/>
<rect class="sN" x="422" y="126" width="16" height="18" rx="2" opacity=".5"/>
<rect class="sN" x="440" y="126" width="16" height="18" rx="2" opacity=".5"/>
<rect class="sN" x="458" y="126" width="16" height="18" rx="2" opacity=".5"/>
<rect class="sN" x="476" y="126" width="16" height="18" rx="2" opacity=".5"/>
<rect class="sN" x="494" y="126" width="16" height="18" rx="2" opacity=".5"/>
<rect class="sA" x="512" y="126" width="16" height="18" rx="2"/>
<rect class="sN" x="530" y="126" width="16" height="18" rx="2" opacity=".5"/>
<rect class="sA" x="548" y="126" width="16" height="18" rx="2"/>
<rect class="sN" x="566" y="126" width="16" height="18" rx="2" opacity=".5"/>
<rect class="sA" x="584" y="126" width="16" height="18" rx="2"/>
<rect class="sN" x="602" y="126" width="16" height="18" rx="2" opacity=".5"/>
<text class="sC" x="106" y="162" text-anchor="end">u5</text>
<rect class="sN" x="116" y="148" width="16" height="18" rx="2" opacity=".5"/>
<rect class="sN" x="134" y="148" width="16" height="18" rx="2" opacity=".5"/>
<rect class="sN" x="152" y="148" width="16" height="18" rx="2" opacity=".5"/>
<rect class="sN" x="170" y="148" width="16" height="18" rx="2" opacity=".5"/>
<rect class="sN" x="188" y="148" width="16" height="18" rx="2" opacity=".5"/>
<rect class="sN" x="206" y="148" width="16" height="18" rx="2" opacity=".5"/>
<rect class="sN" x="224" y="148" width="16" height="18" rx="2" opacity=".5"/>
<rect class="sN" x="242" y="148" width="16" height="18" rx="2" opacity=".5"/>
<rect class="sN" x="260" y="148" width="16" height="18" rx="2" opacity=".5"/>
<rect class="sN" x="278" y="148" width="16" height="18" rx="2" opacity=".5"/>
<rect class="sN" x="296" y="148" width="16" height="18" rx="2" opacity=".5"/>
<rect class="sN" x="314" y="148" width="16" height="18" rx="2" opacity=".5"/>
<rect class="sN" x="332" y="148" width="16" height="18" rx="2" opacity=".5"/>
<rect class="sN" x="350" y="148" width="16" height="18" rx="2" opacity=".5"/>
<rect class="sN" x="368" y="148" width="16" height="18" rx="2" opacity=".5"/>
<rect class="sN" x="386" y="148" width="16" height="18" rx="2" opacity=".5"/>
<rect class="sN" x="404" y="148" width="16" height="18" rx="2" opacity=".5"/>
<rect class="sN" x="422" y="148" width="16" height="18" rx="2" opacity=".5"/>
<rect class="sN" x="440" y="148" width="16" height="18" rx="2" opacity=".5"/>
<rect class="sN" x="458" y="148" width="16" height="18" rx="2" opacity=".5"/>
<rect class="sN" x="476" y="148" width="16" height="18" rx="2" opacity=".5"/>
<rect class="sN" x="494" y="148" width="16" height="18" rx="2" opacity=".5"/>
<rect class="sN" x="512" y="148" width="16" height="18" rx="2" opacity=".5"/>
<rect class="sN" x="530" y="148" width="16" height="18" rx="2" opacity=".5"/>
<rect class="sN" x="548" y="148" width="16" height="18" rx="2" opacity=".5"/>
<rect class="sN" x="566" y="148" width="16" height="18" rx="2" opacity=".5"/>
<rect class="sN" x="584" y="148" width="16" height="18" rx="2" opacity=".5"/>
<rect class="sA" x="602" y="148" width="16" height="18" rx="2"/>
<text class="sC" x="124" y="188" text-anchor="middle">day 1</text>
<text class="sC" x="232" y="188" text-anchor="middle">day 7</text>
<text class="sC" x="358" y="188" text-anchor="middle">day 14</text>
<text class="sC" x="484" y="188" text-anchor="middle">day 21</text>
<text class="sC" x="610" y="188" text-anchor="middle">day 28</text>
<path class="sLg" d="M602 58 V50 H618 V58" fill="none"/><path class="sLw" d="M494 46 V38 H618 V46" fill="none"/><path class="sLm" d="M116 34 V26 H618 V34" fill="none"/>
<text class="sT" x="630" y="40">MAU = 5</text><text class="sWt" x="630" y="70">WAU = 4</text><text class="sGt" x="630" y="100">DAU = 2</text>
<text class="sC" x="630" y="140">stickiness</text><text class="sT" x="630" y="158">2 ÷ 5 = 40%</text>
<text class="sS" x="370" y="212" text-anchor="middle">each count is COUNT(DISTINCT user) over a window ending today (day 28)</text>
</svg><figcaption>Same users, three window lengths. A user active every Monday counts in WAU and MAU but never in today's DAU.</figcaption></figure>

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

<figure class="dia steps"><svg viewBox="0 0 720 226" role="img" aria-label="Six sorted order amounts 120, 150, 180, 240, 400 and 2,600 with a mean of 615: percentile_cont of 0.5 interpolates between the third and fourth values to 210, percentile_disc of 0.5 returns 180, and for the 90th percentile cont interpolates to 1,500 while disc returns 2,600">
<text class="sT" x="14" y="22">six paid orders in one city, sorted (EGP); mean = 615</text>
<rect class="sN" x="60" y="34" width="80" height="32" rx="6"/><text class="sT" x="100" y="55" text-anchor="middle">120</text><text class="sS" x="100" y="82" text-anchor="middle">pos 0  ·  cume 0.17</text>
<rect class="sN" x="160" y="34" width="80" height="32" rx="6"/><text class="sT" x="200" y="55" text-anchor="middle">150</text><text class="sS" x="200" y="82" text-anchor="middle">pos 1  ·  cume 0.33</text>
<rect class="sN" x="260" y="34" width="80" height="32" rx="6"/><text class="sT" x="300" y="55" text-anchor="middle">180</text><text class="sS" x="300" y="82" text-anchor="middle">pos 2  ·  cume 0.50</text>
<rect class="sN" x="360" y="34" width="80" height="32" rx="6"/><text class="sT" x="400" y="55" text-anchor="middle">240</text><text class="sS" x="400" y="82" text-anchor="middle">pos 3  ·  cume 0.67</text>
<rect class="sN" x="460" y="34" width="80" height="32" rx="6"/><text class="sT" x="500" y="55" text-anchor="middle">400</text><text class="sS" x="500" y="82" text-anchor="middle">pos 4  ·  cume 0.83</text>
<rect class="sN" x="560" y="34" width="80" height="32" rx="6"/><text class="sT" x="600" y="55" text-anchor="middle">2,600</text><text class="sS" x="600" y="82" text-anchor="middle">pos 5  ·  cume 1.00</text>
<g data-s="2-2"><line class="sLg" x1="350" y1="92" x2="350" y2="132" marker-end="url(#ahg)"/><text class="sGt" x="350" y="150" text-anchor="middle">percentile_cont(0.5) = 210</text><text class="sS" x="350" y="168" text-anchor="middle">position 0.5 × 5 = 2.5: interpolate</text></g>
<g data-s="3-3"><line class="sLg" x1="350" y1="92" x2="350" y2="132" marker-end="url(#ahg)"/><text class="sGt" x="350" y="150" text-anchor="middle">percentile_cont(0.5) = 210</text><text class="sS" x="350" y="168" text-anchor="middle">position 0.5 × 5 = 2.5: interpolate</text><rect class="sV" x="256" y="30" width="88" height="40" rx="8" style="fill:none;stroke-width:2.5"/><text class="sT" x="300" y="196" text-anchor="middle">percentile_disc(0.5) = 180</text><text class="sS" x="300" y="214" text-anchor="middle">first value with cume ≥ 0.5</text></g>
<g data-s="4-4"><line class="sLg" x1="550" y1="92" x2="550" y2="132" marker-end="url(#ahg)"/><text class="sGt" x="550" y="150" text-anchor="middle">percentile_cont(0.9) = 1,500</text><text class="sS" x="550" y="168" text-anchor="middle">position 0.9 × 5 = 4.5: interpolate</text><rect class="sV" x="556" y="30" width="88" height="40" rx="8" style="fill:none;stroke-width:2.5"/><text class="sT" x="600" y="196" text-anchor="middle">percentile_disc(0.9) = 2,600</text><text class="sS" x="600" y="214" text-anchor="middle">first value with cume ≥ 0.9</text></g>
</svg><ol class="dia-steps">
<li>Six orders, one of them a large B2B order. The mean, 615, describes none of them.</li>
<li>percentile_cont(0.5) finds position 0.5 × 5 = 2.5 and interpolates between 180 and 240: 210.</li>
<li>percentile_disc(0.5) returns an actual order instead: the first whose cumulative share reaches 0.5, 180.</li>
<li>For p90 the two differ a lot on small data: cont interpolates to 1,500, disc returns the real outlier, 2,600.</li>
</ol><figcaption>percentile_cont versus percentile_disc on six orders (computed with NumPy's matching methods, linear and inverted_cdf).</figcaption></figure>

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

<figure class="dia"><svg viewBox="0 0 720 248" role="img" aria-label="Pareto curve: cumulative share of revenue against customers sorted by spend; the top 20% of customers produce 68% of revenue">
<line class="sLm" x1="80" y1="200" x2="610" y2="200" marker-end="url(#ahm)"/><line class="sLm" x1="80" y1="200" x2="80" y2="20" marker-end="url(#ahm)"/>
<polyline class="sL" points="80,200 106,149 132,118 184,84 288,56 392,42 496,33 600,30" fill="none" stroke-width="2.5"/>
<path class="sLw" d="M184 200 V84 H80" fill="none" stroke-dasharray="5 4"/>
<circle class="sPw" cx="184" cy="84" r="6"/><text class="sWt" x="196" y="102.4">top 20% of customers → 68% of revenue</text>
<text class="sC" x="80" y="218" text-anchor="middle">0%</text>
<text class="sC" x="184" y="218" text-anchor="middle">20%</text>
<text class="sC" x="288" y="218" text-anchor="middle">40%</text>
<text class="sC" x="392" y="218" text-anchor="middle">60%</text>
<text class="sC" x="496" y="218" text-anchor="middle">80%</text>
<text class="sC" x="600" y="218" text-anchor="middle">100%</text>
<text class="sC" x="72" y="204" text-anchor="end">0%</text>
<text class="sC" x="72" y="119" text-anchor="end">50%</text>
<text class="sC" x="72" y="34" text-anchor="end">100%</text>
<text class="sC" x="340" y="238" text-anchor="middle">customers, sorted by spend (biggest first)</text><text class="sC" x="88" y="22">cumulative share of revenue</text>
</svg><figcaption>A Pareto curve from a running SUM over customers sorted by spend. The steeper the start, the more the business depends on a few customers.</figcaption></figure>

## DA3.9 Sessions, streaks and attribution 🟡 ⭐

**Sessionisation:** a new session starts after 30 minutes of inactivity.

<figure class="dia"><svg viewBox="0 0 720 222" role="img" aria-label="Six events on a timeline split into three sessions by gaps longer than 30 minutes; new-session flags 1 0 0 1 0 1 and their running sum 1 1 1 2 2 3">
<rect class="sA" x="86" y="40" width="80.8" height="40" rx="8" opacity=".45"/><text class="sM" x="126.4" y="34" text-anchor="middle">session 1</text>
<rect class="sV" x="266" y="40" width="59.2" height="40" rx="8" opacity=".45"/><text class="sM" x="295.6" y="34" text-anchor="middle">session 2</text>
<rect class="sG" x="566" y="40" width="28" height="40" rx="8" opacity=".45"/><text class="sM" x="580" y="34" text-anchor="middle">session 3</text>
<line class="sLm" x1="80" y1="60" x2="676" y2="60" marker-end="url(#ahm)"/>
<circle class="sP" cx="100" cy="60" r="6"/>
<circle class="sP" cx="119" cy="60" r="6"/>
<circle class="sP" cx="153" cy="60" r="6"/>
<circle class="sP" cx="280" cy="60" r="6"/>
<circle class="sP" cx="311" cy="60" r="6"/>
<circle class="sP" cx="580" cy="60" r="6"/>
<text class="sRt" x="216.4" y="100" text-anchor="middle">53 min gap</text><text class="sRt" x="445.6" y="100" text-anchor="middle">112 min gap</text>
<text class="sC" x="100" y="120" text-anchor="middle">09:00</text>
<text class="sC" x="244" y="120" text-anchor="middle">10:00</text>
<text class="sC" x="388" y="120" text-anchor="middle">11:00</text>
<text class="sC" x="532" y="120" text-anchor="middle">12:00</text>
<text class="sC" x="676" y="120" text-anchor="middle">13:00</text>
<text class="sM" x="80" y="152" text-anchor="end">new_session</text><text class="sM" x="80" y="180" text-anchor="end">SUM() OVER</text>
<text class="sRt" x="100" y="152" text-anchor="middle">1</text><text class="sT" x="100" y="180" text-anchor="middle">1</text>
<text class="sC" x="119.2" y="152" text-anchor="middle">0</text><text class="sT" x="119.2" y="180" text-anchor="middle">1</text>
<text class="sC" x="152.8" y="152" text-anchor="middle">0</text><text class="sT" x="152.8" y="180" text-anchor="middle">1</text>
<text class="sRt" x="280" y="152" text-anchor="middle">1</text><text class="sT" x="280" y="180" text-anchor="middle">2</text>
<text class="sC" x="311.2" y="152" text-anchor="middle">0</text><text class="sT" x="311.2" y="180" text-anchor="middle">2</text>
<text class="sRt" x="580" y="152" text-anchor="middle">1</text><text class="sT" x="580" y="180" text-anchor="middle">3</text>
<text class="sS" x="380" y="210" text-anchor="middle">flag rows after a gap of over 30 minutes; a running SUM of the flags numbers the sessions</text>
</svg><figcaption>Sessionisation is two window functions: LAG to measure each gap, a running SUM to turn flags into session numbers.</figcaption></figure>

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
