# Analytics Thinking and KPIs — From a Business Question to a Decision

Data analyst interviews in Egypt test tools (SQL, Excel, Power BI) **and** thinking: can you turn a vague request into a precise question, pick the right metric, find out why a number moved, and explain it to a manager in two sentences? The thinking part is where engineers moving into analytics usually lose points, because they jump to the query before understanding the question. This module is that thinking: the analysis workflow, metrics and KPIs, the business vocabulary of the industries that hire analysts here, cohorts and segmentation, and root-cause analysis.

> [!focus]
> **Entry must:** follow a structured workflow from question to recommendation; define a metric precisely; know common business metrics (conversion, AOV, churn, retention, ARPU, CAC, LTV); explain what a cohort is; investigate a metric drop methodically.
> **Mid adds:** metric trees and north-star metrics, leading vs lagging indicators, RFM segmentation, issue trees, guardrails, presenting answer-first to executives.
> **Most asked:** *How would you measure the success of feature X?* · *Revenue dropped 15% last week. How do you investigate?* · *What KPIs would you track for an e-commerce site / a telecom / a bank?* · *What's the difference between a metric and a KPI?* · *What is churn and how do you calculate it?*
> **Time budget:** 3 hours.

## DA1.1 What analysts actually do here 🟢

Titles vary (data analyst, BI analyst, reporting analyst, business analyst with SQL, insights analyst), but the work is similar: **answer business questions with data, build and maintain reports and dashboards, and help people decide**. Sectors hiring analysts in Egypt include telecoms, banking and fintech, e-commerce and delivery apps, FMCG and retail, consultancies, and the large outsourcing and shared-service centres serving Gulf and European clients.

A typical week: a few ad-hoc questions from managers ("why did sales in Alexandria drop?"), maintaining a Power BI dashboard, cleaning a new data source, a monthly business review deck, and the occasional deeper analysis (a churn study, a pricing test).

## DA1.2 The analysis workflow 🟢 ⭐

<figure class="dia"><svg viewBox="0 0 720 120" role="img" aria-label="Analysis workflow: question, metric, data, clean, explore, analyse, communicate, decide">
<g class="sT" text-anchor="middle">
<rect class="sA" x="6" y="30" width="80" height="54" rx="8"/><text x="46" y="62">Question</text>
<rect class="sA" x="94" y="30" width="80" height="54" rx="8"/><text x="134" y="62">Metric</text>
<rect class="sB" x="182" y="30" width="80" height="54" rx="8"/><text x="222" y="62">Data</text>
<rect class="sB" x="270" y="30" width="80" height="54" rx="8"/><text x="310" y="62">Clean</text>
<rect class="sB" x="358" y="30" width="80" height="54" rx="8"/><text x="398" y="62">Explore</text>
<rect class="sW" x="446" y="30" width="80" height="54" rx="8"/><text x="486" y="62">Analyse</text>
<rect class="sG" x="534" y="30" width="90" height="54" rx="8"/><text x="579" y="55">Commu-</text><text x="579" y="72">nicate</text>
<rect class="sG" x="632" y="30" width="80" height="54" rx="8"/><text x="672" y="62">Decide</text>
</g>
<text class="sS" x="6" y="108">Most wasted analysis comes from skipping the first two boxes.</text>
</svg><figcaption>Question and metric first. The tools come later.</figcaption></figure>

1. **Question:** what decision will this inform, and who makes it?
2. **Metric:** what number answers it, defined precisely?
3. **Data:** where does it live, at what grain, and how trustworthy is it?
4. **Clean:** fix types, duplicates, missing values and outliers, and **write down every decision** ([[S7.7]]).
5. **Explore:** distributions, trends, segments; look for surprises.
6. **Analyse:** compare, test, model if needed ([[S6]]).
7. **Communicate:** answer first, then evidence, then caveats ([[DA5]]).
8. **Decide:** a recommendation someone can act on, and how you'll measure whether it worked.

> [!say]
> "Before writing any SQL I'd ask what decision this analysis will drive and who will make it, then agree a precise metric definition with them. That stops me answering the wrong question very precisely."

## DA1.3 Turning a vague request into a question 🟢 ⭐

A manager says: **"Can you look at our customers?"** Better questions come from asking:

- **Why now?** "Retention seems to be dropping since the price change."
- **What decision?** "Whether to roll back the price change for small businesses."
- **For whom, over what period, compared with what?** "Small-business customers who signed up in 2026, before vs after 1 July."
- **What would change your mind?** "If 90-day retention fell more than 5 points."

Now the question is answerable: *"Did 90-day retention for small-business customers fall after the 1 July price change, compared with similar customers before it, and by how much?"*

> [!term] Issue tree (hypothesis tree)
> Breaking a problem into sub-questions that are **MECE**: **M**utually **E**xclusive (no overlap) and **C**ollectively **E**xhaustive (nothing missing). "Why is profit down?" → revenue down or costs up? Revenue → fewer customers, fewer orders per customer, or a lower order value? Each branch becomes a query. Consultancies use this structure in case interviews.

## DA1.4 Metrics, KPIs and metric trees 🟢 🟡 ⭐

> [!term] Metric vs KPI
> A **metric** is any quantified measurement (page views, tickets closed). A **KPI** (key performance indicator) is one of the few metrics tied directly to a business goal and target, the ones leadership reviews to judge performance.

**Define every metric completely**, or two teams will report different numbers for "the same" thing:

| Part | Example: "conversion rate" |
|---|---|
| Numerator | Orders with status `paid` (not `pending`, not `refunded` within 7 days?) |
| Denominator | Unique **sessions**? **Visitors**? Visitors who viewed a product? |
| Time window | Calendar day in **Cairo time** |
| Filters | Excluding internal test accounts and bots |
| Grain and source | From the `orders` and `sessions` tables, refreshed daily at 06:00 |

| Kind | Meaning | Example |
|---|---|---|
| **Leading** indicator | Moves *before* the outcome; you can act on it | Trial users completing onboarding, support tickets per account |
| **Lagging** indicator | Shows the outcome after the fact | Monthly revenue, churn |
| **Vanity** metric | Looks good, drives no decision | Total registered users ever, raw page views |
| **Actionable** metric | Changes what someone does | Activation rate in the first 7 days |
| **North-star** metric | The single metric that best captures the value customers get | Weekly orders delivered on time (delivery app); active companies with a forecast viewed weekly (FinSight) |
| **Guardrail** metric | Must not get worse while you improve another | Refund rate, page speed, complaints ([[S6.9]]) |

**Metric trees** decompose a top metric into its drivers, which is how you investigate changes and pick levers:

```text
Revenue = Customers × Orders per customer × Average order value (AOV)
Customers = New customers + Retained customers
AOV = Items per order × Average item price × (1 − discount rate)
```

> [!say]
> "I'd define success with one primary metric tied to the goal, a couple of leading indicators we can act on earlier, and guardrails that mustn't get worse. And I'd write the definition down (numerator, denominator, time window and filters) so everyone reports the same number."

## DA1.5 Business vocabulary by industry 🟢 ⭐

**Everywhere:**

| Metric | Formula / meaning |
|---|---|
| **Revenue**, **gross margin** | Sales; (revenue − cost of goods sold) ÷ revenue |
| **Conversion rate** | Converting units ÷ eligible units (e.g. orders ÷ sessions) |
| **AOV** (average order value) | Revenue ÷ number of orders |
| **CAC** (customer acquisition cost) | Sales and marketing spend ÷ new customers acquired, for the same period |
| **LTV / CLV** (customer lifetime value) | Expected margin from a customer over their lifetime; a simple version is ARPU × gross margin ÷ churn rate |
| **LTV : CAC** | A common health check; around 3:1 is often quoted as healthy, but it varies by business |
| **Churn rate** | Customers lost in a period ÷ customers at the start of the period |
| **Retention rate** | 1 − churn, or the share of a cohort still active after N days |
| **NPS** | % promoters (9–10) − % detractors (0–6) on "how likely to recommend" |
| **CSAT** | % of satisfied responses (e.g. 4–5 out of 5) |

**E-commerce and delivery:** sessions, add-to-cart rate, checkout abandonment, conversion, AOV, repeat-purchase rate, delivery time (median and p90), on-time rate, cancellation rate, return rate, contribution margin per order.

**Telecom:** **ARPU** (average revenue per user), **churn** (prepaid churn is often defined by days of inactivity), **MOU** (minutes of use), data usage per subscriber, recharge frequency, net adds, **CLV**, network KPIs. Your *AI Journey* Part 16 covers telecom KPIs and use cases in depth for e& Egypt.

**Subscription / SaaS:** **MRR** and **ARR** (monthly and annual recurring revenue), expansion and contraction revenue, **net revenue retention (NRR)**, logo churn vs revenue churn, **DAU/MAU** (stickiness), activation rate.

**Banking and fintech:** active accounts, transaction volume and value, deposits, loan disbursements, **NPL ratio** (non-performing loans), **default rate**, fraud rate, cost-to-income ratio, digital adoption.

**Finance and operations** (FinSight's world): **cash flow**, burn rate, **runway** (cash ÷ monthly burn), **DSO** (days sales outstanding: how long customers take to pay), DPO, overdue receivables by age bucket (0–30, 31–60, 61–90, 90+ days), inventory turnover.

> [!story]
> FinSight's dashboard is an analytics product: cash balance, a 90-day cash-flow forecast, overdue receivables and alerts. Describing it as "cash runway and receivables ageing for small companies" in analyst language, rather than as "a .NET app", shows you think about what the numbers mean to the owner.

> [!mistake] Churn with the wrong denominator
> Dividing customers lost by customers at the **end** of the month (or including new customers who joined during the month in the base) understates churn. State the definition, and for fast-growing businesses prefer cohort retention curves, which aren't distorted by growth.

## DA1.6 Cohort analysis 🟢 🟡 ⭐

> [!term] Cohort
> A group of users who share a starting event in the same period, for example everyone who first ordered in January 2026. **Cohort analysis** tracks each group over time since its start (month 0, 1, 2…), so you compare like with like instead of mixing old loyal customers with brand-new ones.

| Signup cohort | Month 0 | Month 1 | Month 2 | Month 3 |
|---|---|---|---|---|
| Jan 2026 | 100% | 42% | 35% | 31% |
| Feb 2026 | 100% | 45% | 37% | 33% |
| Mar 2026 (onboarding redesign) | 100% | 52% | 44% | — |

Reading it: each **row** is a cohort; each **column** is the time since joining. March's higher month-1 retention suggests the onboarding redesign helped. (Confirming that it *caused* the change needs more care, [[S6.8]].) The SQL to build this is in [[DA3]].

**Retention curves** that flatten out (rather than falling to zero) mean you've found a group who keep getting value: product-market fit, in start-up language.

## DA1.7 Segmentation 🟢 🟡

Averages hide differences. Segment by: geography (Cairo, Giza, Alexandria, Delta, Upper Egypt), channel (app, web, call centre), device, customer type (consumer or business, new or returning), acquisition source, plan or tier, and behaviour.

> [!term] RFM segmentation
> Scoring customers on **R**ecency (days since last purchase), **F**requency (number of purchases) and **M**onetary value (total spend), usually as quintiles 1–5 each. "555" are champions; high-value customers with low recency are "at risk", which is a target for win-back campaigns. It's simple, explainable and asked about often.

Clustering (k-means) is the data-science version of segmentation ([[DS7]] and your *AI Journey* Part 9).

## DA1.8 "The number dropped. Why?" 🟢 🟡 ⭐

The most common analyst case question. A methodical order:

1. **Is it real?** Check the data first: did a pipeline fail, did tracking break, did a definition or filter change, is the day incomplete, is it a time-zone or late-data artefact? (Many "drops" are data bugs.)
2. **How big, and since when?** Compare with the same weekday last week and the same period last year; is it outside the normal range of variation?
3. **External or internal?** Seasonality (Ramadan, Eid, summer, back-to-school, White Friday), holidays, competitor promotions, outages, payment-provider issues, exchange-rate or price changes, news.
4. **Decompose the metric** along its tree: is it fewer customers, fewer orders each, or a lower order value? ([[DA1.4]])
5. **Segment it:** is the drop everywhere, or concentrated in one platform, region, channel, product or customer type? (A drop only on Android app version 5.2 points to a bug.)
6. **Find the funnel step** where it breaks: visits → product views → add to cart → checkout → payment success.
7. **Check recent changes:** releases, campaigns ending, pricing, policy changes.
8. **Conclude and recommend**, with the evidence and what you'd monitor.

> [!say]
> "First I'd confirm the drop is real and not a tracking or pipeline issue. Then I'd size it against normal variation and seasonality, decompose revenue into customers, frequency and order value, and segment by platform, region and channel to see where it's concentrated. Once I find the segment and funnel step, I'd line it up with recent releases, campaigns or outages, and come back with the likely cause, the evidence, and a suggested fix to verify."

## DA1.9 Answer first: communicating to managers 🟢 ⭐

Use the **pyramid principle**: lead with the answer, then the supporting points, then the detail.

> [!say]
> "**Retention for small businesses fell 6 points after the July price change, and that accounts for most of the revenue gap.** It's concentrated among customers on the monthly plan, while annual customers are unaffected. I'd recommend testing a lower monthly price for that segment for four weeks. The detailed charts and the method are in the appendix."

Compare with the common junior version: "First I pulled the data from three tables, then I cleaned it, then I…". The manager stopped listening at "three tables". Storytelling with charts is [[DA5]].

> [!lab] Write three metric definitions and one investigation
> (1) Write full definitions (numerator, denominator, window, filters, source) for "conversion rate", "monthly churn" and "on-time delivery rate" as you'd put them in a data dictionary. (2) Using the Superstore data on `E:\Big data`, pretend sales in one region dropped last quarter and run the investigation in [[DA1.8]]: decompose, segment, find the driver, and write a five-sentence answer-first summary. That's a ready answer for case interviews.

## DA1.10 Interview drill 🟢 ⭐

| Question | Strong short answer |
|---|---|
| Metric vs KPI? | A KPI is one of the few metrics tied directly to a goal and target; a metric is any measurement. |
| How do you define a metric properly? | Numerator, denominator, time window and time zone, filters, grain and source, written down. |
| Leading vs lagging indicator? | Leading moves before the outcome and can be acted on; lagging reports the outcome afterwards. |
| What's a north-star metric? | The single metric that best captures the value customers get, guiding the whole product. |
| How do you calculate churn? | Customers lost during a period ÷ customers at the start of it, with a clear definition of "lost". |
| What's ARPU? | Average revenue per user: revenue ÷ average active users in the period. |
| CAC and LTV? | Acquisition spend ÷ new customers; expected margin from a customer over their lifetime. |
| What is a cohort analysis? | Grouping users by start period and tracking each group over time since start. |
| What is RFM? | Segmenting customers by recency, frequency and monetary value. |
| How would you measure a new feature's success? | One primary metric tied to its goal, leading indicators, guardrails, ideally an A/B test. |
| Revenue fell 15%. What do you do? | Verify the data, size it vs normal and seasonality, decompose, segment, find the funnel step, check recent changes, then recommend. |
| What's MECE? | Mutually exclusive, collectively exhaustive: breaking a problem into non-overlapping, complete parts. |
| How do you present findings to an executive? | Answer first, then two or three supporting points, then detail in an appendix. |
| What's a vanity metric? | One that looks impressive but doesn't inform decisions, like total sign-ups ever. |

## Key takeaways

> [!check]
> - Start with the decision, then the precise question, then the metric definition.
> - Decompose metrics into trees: that's how you investigate changes and find levers.
> - Know the business vocabulary for the industry you're interviewing in.
> - Cohorts and segments beat averages.
> - Investigate drops methodically, data quality first, and communicate answer-first.

## Sources

- Alistair Croll and Benjamin Yoskovitz, *Lean Analytics* (O'Reilly, 2013): north-star and one-metric-that-matters thinking, metrics by business model.
- Barbara Minto, *The Pyramid Principle* (1987): answer-first communication.
- Google, [*Google Data Analytics Professional Certificate*](https://grow.google/certificates/data-analytics/) course material on the analysis process (ask, prepare, process, analyse, share, act).
- Amplitude, [*The North Star Playbook*](https://amplitude.com/books/north-star) (free).
- Reichheld, F., "The One Number You Need to Grow" (*Harvard Business Review*, 2003), the original NPS article.
- Your *AI Journey* Part 16 for telecom KPIs (ARPU, churn, CLV) and case frameworks.
