# Data Analyst Interview Hub — SQL Rounds, Excel and Power BI Tests, Case Questions and the Bank

This is the module to live in during the final week before an analyst interview. Analyst interviews in Egypt usually combine an HR screen, a **SQL test** (live or online), an **Excel or Power BI task**, a **business case** or "how would you investigate…" discussion, and sometimes a **take-home analysis** with a presentation. This hub gives you a plan for each, the portfolio that closes your gaps, and a question bank to drill aloud.

> [!focus]
> **Entry must:** solve SQL problems with joins, aggregation and window functions under time pressure; complete a practical Excel or Power BI task; investigate a metric drop methodically; present findings answer-first.
> **Mid adds:** cohort and funnel SQL, experiment interpretation, product cases with unit economics, stakeholder handling, data-quality judgement.
> **Time budget:** the final week: SQL daily, one case every day, the bank daily, one mock presentation.

## DA7.1 How analyst interviews usually run 🟢 ⭐

| Round | What happens | Prepared by |
|---|---|---|
| HR screen | Background, English, salary, military status, "why analytics?" | [[S8]] |
| **SQL test** | 3–6 problems in 45–60 minutes (HackerRank, a shared editor, or on paper) | [[S3]], [[DA3]] |
| **Excel / Power BI task** | Clean and summarise a file; build a small dashboard; sometimes DAX questions | [[DA2]], [[DA4]] |
| Statistics questions | p-values, A/B tests, mean vs median | [[S6]] |
| **Case / business round** | "Revenue dropped, why?", "How would you measure X?", "Should we launch Y?" | [[DA1]], [[DA6]] |
| Take-home + presentation | A dataset and a question; present findings in 10–15 minutes | [[DA5]], [[DA7.4]] |
| Manager round | Stakeholder scenarios, prioritisation, past projects | [[S8]] |

## DA7.2 The SQL round 🟢 ⭐

**Strategy under time pressure:** read all questions first; do the ones you're sure of; for each, restate the output grain ("one row per city per month"), build in CTEs, run small checks (counts before and after joins), handle NULLs and ties, then tidy.

**The patterns that appear most** (each covered in [[S3]] and [[DA3]]): joins including anti-joins; GROUP BY with HAVING; conditional aggregation for rates; top-N per group with window ranking; month-over-month growth with LAG; running totals; deduplication with ROW_NUMBER; cohort retention; funnels; second-highest or Nth value; consecutive-day streaks; percentage of total.

**A typical online test question** (do it before reading the answer):

*"Given `orders(order_id, customer_id, order_date, amount)`, return for each month the number of customers who ordered that month **and** the previous month."*

```sql
WITH m AS (SELECT DISTINCT customer_id, date_trunc('month', order_date)::date AS month FROM orders)
SELECT cur.month, COUNT(*) AS retained_customers
FROM m cur
JOIN m prev ON prev.customer_id = cur.customer_id AND prev.month = cur.month - interval '1 month'
GROUP BY cur.month ORDER BY cur.month;
```

## DA7.3 The Excel or Power BI task 🟢 ⭐

**Excel** ([[DA2.11]]): clean into a Table, add calculated columns, XLOOKUP a dimension, PivotTable by two dimensions with % of total, top 10, conditional formatting for exceptions, one clear chart, **written findings at the top**.

**Power BI**: Power Query cleaning; a star schema with a date table; measures (total, % of total, YoY, YTD); a one-page report with KPI cards, a trend and a breakdown; slicers; and, if asked, RLS. Be ready to explain **every** measure you wrote and why it's a measure, not a column ([[DA4.4]]).

## DA7.4 The take-home analysis 🟢 ⭐

**A plan for a 3–5-day take-home:**

1. **Question and data** (1–2 hours): restate the question; profile the data (rows, grain, ranges, nulls, duplicates); list assumptions; email one clarifying question if truly needed.
2. **Clean** with a reproducible notebook or Power Query; log every decision.
3. **Explore** broadly, then **focus** on what answers the question.
4. **Three findings**, each with evidence and a chart titled with the finding.
5. **Recommendation** with expected impact and how to measure it.
6. **Deliverables:** a short deck or one-page memo (answer first), the notebook or `.pbix`/PBIP, and a README with assumptions and limitations.

**What reviewers score:** answering the actual question; correctness (no join fan-out, right denominators); clarity of the story; honest caveats; reproducibility; and business sense ("so what?").

## DA7.5 Case questions: a reusable structure 🟢 ⭐

For "investigate a drop", use [[DA1.8]]. For "how would you measure feature X?" and "should we do Y?":

1. **Clarify the goal and the user** ("what problem is this feature solving, for whom?").
2. **Define success**: one primary metric, leading indicators, guardrails ([[DA1.4]]).
3. **Hypotheses**: why might it work or fail?
4. **Data**: what exists already, what must be tracked ([[DA6.1]]).
5. **Method**: an A/B test if possible; otherwise a comparison group ([[DA6.4]]).
6. **Decision rule**: what result leads to what action.
7. **Risks**: cannibalisation, novelty effects, data quality, operational capacity.

**Practise these:**

- "Delivery times got worse in Giza last week. Investigate."
- "How would you measure the success of a new loyalty programme?"
- "A bank's credit-card applications rose but approvals fell. What's going on?"
- "Telecom: prepaid churn rose 2 points after a price change. What do you analyse?"
- "Which of our three acquisition channels should get more budget?"
- "Design the KPIs and dashboard for a call centre."
- "Should we add cash on delivery back as a payment option?"

## DA7.6 Stakeholder and behavioural scenarios 🟢

| Scenario | A strong approach |
|---|---|
| A manager wants a number by tomorrow that you can't validate | Deliver what you can with clear caveats and confidence, and say when the validated number will be ready |
| Two departments report different revenue | Compare definitions (gross vs net, order date vs payment date, time zone, refunds), reconcile, and propose one documented definition |
| Your analysis contradicts what a senior leader believes | Lead with the data and method, invite them to challenge assumptions, offer a test to settle it |
| Too many requests | Ask what decision each request supports and its deadline; agree priorities with your manager; automate recurring requests into a dashboard |
| You found an error in a report you published | Tell the owners immediately, correct it, explain the impact, and add a check so it can't recur |

## DA7.7 Your analyst portfolio: what to build first 🟢

Your gaps file calls the analyst CV the weakest of the eight, mainly because the core tools have no visible evidence. Three projects fix that:

| Project | Shows | Module |
|---|---|---|
| **Power BI dashboard** on Superstore or Olist: star schema, DAX, RLS, a two-page story | Power BI, DAX, modelling, design | [[DA4]] lab |
| **Excel workbook**: Power Query, PivotTables, XLOOKUP, a one-page dashboard, written findings | Excel, the most-screened tool | [[DA2]] lab |
| **SQL + Python analysis**: cohort retention, funnel, growth, a short deck | SQL depth, storytelling | [[DA3]] lab, [[DA5]] lab |

Plus what you already have: the road-accident capstone (statistical tests, EDA, SHAP), framed in analyst language, and the Jira reporting scripts.

**Certifications:** **PL-300** (Power BI Data Analyst) is the most recognised for analyst roles in Egypt; the Google Data Analytics certificate is a structured beginner option.

## DA7.8 The question bank 🟢 ⭐

| Question | Strong short answer |
|---|---|
| WHERE vs HAVING? | WHERE filters rows before grouping; HAVING filters groups after. |
| INNER vs LEFT JOIN? | Matches only vs all left rows with NULLs where unmatched. |
| How do you find customers who never ordered? | NOT EXISTS, or LEFT JOIN with the right key IS NULL. |
| RANK vs DENSE_RANK vs ROW_NUMBER? | Gaps after ties / no gaps / unique numbering. |
| How do you compute MoM growth? | LAG over months, (current − previous) ÷ previous, NULLIF for zero. |
| How do you remove duplicates? | ROW_NUMBER partitioned by the duplicate key, keep the first. |
| How do you build a cohort table? | Cohort = first activity month; months since cohort; distinct active users ÷ cohort size. |
| How do you compute a funnel? | First time per step per user, counted in order within a window, step-to-step rates. |
| Median in SQL? | percentile_cont(0.5) WITHIN GROUP (ORDER BY x). |
| Why might a rate be 0 in SQL? | Integer division; multiply by 1.0. |
| VLOOKUP vs XLOOKUP? | XLOOKUP is exact by default, looks left, doesn't break when columns move. |
| What does Power Query do? | Repeatable ETL steps in Excel and Power BI, refreshed on new data. |
| PivotTable % of total? | Show Values As → % of Grand Total. |
| Calculated column vs measure? | Stored per row at refresh vs computed in filter context at query time. |
| What does CALCULATE do? | Evaluates an expression in a modified filter context. |
| Why a star schema? | Simple DAX, clean filtering, performance. |
| YoY in DAX? | CALCULATE with SAMEPERIODLASTYEAR, then DIVIDE. |
| How does RLS work? | DAX filters on roles, dynamic with USERPRINCIPALNAME and a security table. |
| Import vs DirectQuery? | Fast compressed copy refreshed on a schedule vs live queries to the source. |
| Mean or median for order values? | Median, because they're right-skewed. |
| What is a p-value? | How surprising the data would be if there were no effect. |
| What's a confidence interval? | The plausible range for the true value, given the sampling method. |
| How long should an A/B test run? | Until the planned sample size, in whole weeks. |
| What's sample ratio mismatch? | The observed split differs from the plan, signalling a bug. |
| Correlation vs causation? | Correlation can come from confounders; causation needs experiments or careful design. |
| What's Simpson's paradox? | A trend reverses when groups are combined because of different mixes. |
| Metric vs KPI? | A KPI is a metric tied to a goal and target. |
| How do you define a metric? | Numerator, denominator, window and time zone, filters, source. |
| Leading vs lagging indicators? | Early, actionable signals vs outcome measures. |
| Churn rate? | Customers lost ÷ customers at the start of the period, with "lost" defined. |
| ARPU? | Revenue ÷ average active users. |
| CAC and LTV? | Acquisition cost per new customer; lifetime margin per customer. |
| What is RFM? | Segmenting by recency, frequency and monetary value. |
| Revenue fell 15%: what do you do? | Verify the data, size vs normal and seasonality, decompose, segment, find the funnel step, check changes, recommend. |
| How do you measure a new feature? | Primary metric, leading indicators, guardrails, ideally an A/B test. |
| Last-touch vs first-touch? | Credit to the final vs first touchpoint; each is biased. |
| What's incrementality? | The effect caused by a channel, measured by experiments. |
| Which chart for a trend? | A line chart. |
| When use a pie chart? | Two or three parts with one clear message. |
| What makes a good chart title? | It states the finding. |
| How do you present findings? | Answer first, three supporting findings, recommendation, caveats, appendix. |
| Two teams report different numbers. What do you do? | Compare definitions, reconcile, agree one documented definition. |

## DA7.9 A two-week plan 🟢

| Days | Do |
|---|---|
| 1 | [[DA1]]: metric definitions and one drop investigation |
| 2–3 | [[S3]], [[DA3]]: 15 SQL problems, timed; the cohort and funnel queries |
| 4–5 | [[DA2]]: the Excel lab end to end |
| 6–7 | [[DA4]]: the Power BI lab (start it early; it's the biggest piece) |
| 8 | [[S6]], [[DA6]]: statistics refresh; analyse a public A/B test |
| 9 | [[DA5]]: redesign three charts; build a five-slide story |
| 10 | [[S7]]: the pandas lab, matching SQL results |
| 11 | Case practice ×3 ([[DA7.5]]), out loud, timed |
| 12 | A mock take-home: 4 hours, then a 10-minute presentation recorded |
| 13 | SQL test simulation (HackerRank-style, 60 minutes); the question bank |
| 14 | The bank twice, [[S8]] stories aloud, rest |

## Key takeaways

> [!check]
> - SQL is usually the deciding round: practise timed, with CTEs and edge cases.
> - Excel and Power BI tasks are won by clean data, correct measures and written findings.
> - Cases follow a structure: goal, metric, hypotheses, data, method, decision rule, risks.
> - Take-homes are judged on answering the question, correctness and the story.
> - Build the three portfolio pieces (Power BI, Excel, SQL+Python); they close your biggest gaps.

## Sources

- Modules S3, S6, S7, S8 and DA1–DA6 of this handbook, and their sources.
- Microsoft Learn: [PL-300 study guide](https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/pl-300).
- Google, [Data Analytics Professional Certificate](https://grow.google/certificates/data-analytics/).
