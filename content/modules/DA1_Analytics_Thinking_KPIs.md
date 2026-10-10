# Analytics Thinking and KPIs — From a Business Question to a Decision

Data analyst interviews in Egypt test tools (SQL, Excel, Power BI) **and** thinking: can you turn a vague request into a precise question, pick the right metric, find out why a number moved, and explain it to a manager in two sentences? The thinking part is where engineers moving into analytics usually lose points, because they jump to the query before understanding the question. This module is that thinking: the analysis workflow, metrics and KPIs, the business vocabulary of the industries that hire analysts here, cohorts and segmentation, and root-cause analysis.

> [!focus]
> **Entry must:** follow a structured workflow from question to recommendation; define a metric precisely; know common business metrics (conversion, AOV, churn, retention, ARPU, CAC, LTV); explain what a cohort is; investigate a metric drop methodically.
> **Mid adds:** metric trees and north-star metrics, leading vs lagging indicators, RFM segmentation, issue trees, guardrails, presenting answer-first to executives.
> **Most asked:** *How would you measure the success of feature X?* · *Revenue dropped 15% last week. How do you investigate?* · *What KPIs would you track for an e-commerce site / a telecom / a bank?* · *What's the difference between a metric and a KPI?* · *What is churn and how do you calculate it?*
> **Time budget:** 3 hours.

## DA1.0 Foundations: rows, grain and aggregation 🟢

Every number an analyst reports is built the same way: **rows** of recorded events are **filtered**, **grouped** and **aggregated**. Three ideas prevent most wrong numbers:

- **Grain:** what exactly one row represents. One order? One item within an order? One customer per day? Count the rows of an order-lines table and you've counted items, not orders.
- **Dimensions and measures:** dimensions are what you group and filter by (date, city, channel); measures are what you aggregate (revenue, quantity, sessions).
- **Aggregations:** `SUM`, `COUNT`, `COUNT(DISTINCT …)`, `AVG`, and ratios built from them. Sums add up across groups and days. **Distinct counts, averages and ratios don't**: a week's unique customers isn't the sum of seven daily counts, and a week's conversion rate isn't the average of seven daily rates.

<figure class="dia"><svg viewBox="0 0 720 240" role="img" aria-label="Five order-line rows grouped by city into revenue, distinct orders, line count and average order value; counting rows counts items, not orders">
<text class="sM" x="172" y="22" text-anchor="middle">order_lines: one row = one item in an order</text>
<rect class="sN" x="14" y="32" width="316" height="24" rx="4"/><text class="sT" x="40" y="49">order_id</text><text class="sT" x="120" y="49">city</text><text class="sT" x="190" y="49">item</text><text class="sT" x="266" y="49">amount</text>
<rect class="sA" x="14" y="60" width="316" height="22" rx="4"/><text class="sC" x="40" y="76" xml:space="preserve" style="white-space:pre">1001</text><text class="sC" x="120" y="76" xml:space="preserve" style="white-space:pre">Cairo</text><text class="sC" x="190" y="76" xml:space="preserve" style="white-space:pre">shirt</text><text class="sC" x="266" y="76" xml:space="preserve" style="white-space:pre">300</text>
<rect class="sA" x="14" y="86" width="316" height="22" rx="4"/><text class="sC" x="40" y="102" xml:space="preserve" style="white-space:pre">1001</text><text class="sC" x="120" y="102" xml:space="preserve" style="white-space:pre">Cairo</text><text class="sC" x="190" y="102" xml:space="preserve" style="white-space:pre">shoes</text><text class="sC" x="266" y="102" xml:space="preserve" style="white-space:pre">700</text>
<rect class="sG" x="14" y="112" width="316" height="22" rx="4"/><text class="sC" x="40" y="128" xml:space="preserve" style="white-space:pre">1002</text><text class="sC" x="120" y="128" xml:space="preserve" style="white-space:pre">Giza</text><text class="sC" x="190" y="128" xml:space="preserve" style="white-space:pre">bag</text><text class="sC" x="266" y="128" xml:space="preserve" style="white-space:pre">450</text>
<rect class="sA" x="14" y="138" width="316" height="22" rx="4"/><text class="sC" x="40" y="154" xml:space="preserve" style="white-space:pre">1003</text><text class="sC" x="120" y="154" xml:space="preserve" style="white-space:pre">Cairo</text><text class="sC" x="190" y="154" xml:space="preserve" style="white-space:pre">hat</text><text class="sC" x="266" y="154" xml:space="preserve" style="white-space:pre">150</text>
<rect class="sA" x="14" y="164" width="316" height="22" rx="4"/><text class="sC" x="40" y="180" xml:space="preserve" style="white-space:pre">1003</text><text class="sC" x="120" y="180" xml:space="preserve" style="white-space:pre">Cairo</text><text class="sC" x="190" y="180" xml:space="preserve" style="white-space:pre">socks</text><text class="sC" x="266" y="180" xml:space="preserve" style="white-space:pre">50</text>
<line class="sL" x1="334" y1="120" x2="384" y2="120" marker-end="url(#ah)"/><text class="sC" x="359" y="110" text-anchor="middle">GROUP BY</text><text class="sC" x="359" y="140" text-anchor="middle">city</text>
<rect class="sN" x="390" y="80" width="316" height="24" rx="4"/><text class="sT" x="420" y="97" text-anchor="middle">city</text><text class="sT" x="490" y="97" text-anchor="middle">revenue</text><text class="sT" x="560" y="97" text-anchor="middle">orders</text><text class="sT" x="620" y="97" text-anchor="middle">lines</text><text class="sT" x="672" y="97" text-anchor="middle">AOV</text>
<rect class="sA" x="390" y="108" width="316" height="22" rx="4"/><text class="sC" x="420" y="124" text-anchor="middle">Cairo</text><text class="sC" x="490" y="124" text-anchor="middle">1,200</text><text class="sC" x="560" y="124" text-anchor="middle">2</text><text class="sC" x="620" y="124" text-anchor="middle">4</text><text class="sC" x="672" y="124" text-anchor="middle">600</text>
<rect class="sG" x="390" y="134" width="316" height="22" rx="4"/><text class="sC" x="420" y="150" text-anchor="middle">Giza</text><text class="sC" x="490" y="150" text-anchor="middle">450</text><text class="sC" x="560" y="150" text-anchor="middle">1</text><text class="sC" x="620" y="150" text-anchor="middle">1</text><text class="sC" x="672" y="150" text-anchor="middle">450</text>
<text class="sC" x="390" y="174">revenue = SUM(amount)</text><text class="sC" x="390" y="192">orders = COUNT(DISTINCT order_id)</text>
<text class="sRt" x="390" y="210">lines = COUNT(*): items, not orders!</text><text class="sC" x="390" y="228">AOV = revenue ÷ orders, not AVG(amount)</text>
</svg><figcaption>Know the grain before you count. On an order-lines table, COUNT(*) gives 4 for Cairo; the business means 2 orders.</figcaption></figure>

<figure class="dia"><svg viewBox="0 0 720 222" role="img" aria-label="Averaging a 50% conversion day with 10 sessions and a 2% day with 1,000 sessions gives a misleading 26%; dividing total orders by total sessions gives the true 2.5%">
<rect class="sB" x="14" y="30" width="240" height="70" rx="8"/><text class="sT" x="134" y="63" text-anchor="middle">Friday</text><text class="sC" x="134" y="79" text-anchor="middle">10 sessions · 5 orders · 50%</text>
<rect class="sB" x="14" y="116" width="240" height="70" rx="8"/><text class="sT" x="134" y="149" text-anchor="middle">Saturday</text><text class="sC" x="134" y="165" text-anchor="middle">1,000 sessions · 20 orders · 2%</text>
<line class="sLr" x1="254" y1="65" x2="300" y2="65" marker-end="url(#ahr)"/><line class="sLg" x1="254" y1="151" x2="300" y2="151" marker-end="url(#ahg)"/>
<rect class="sR" x="304" y="36" width="402" height="58" rx="8" opacity=".85"/><text class="sT" x="505" y="60" text-anchor="middle">average of the daily rates</text><text class="sC" x="505" y="80" text-anchor="middle">(50% + 2%) ÷ 2 = 26%  ✗</text>
<rect class="sG" x="304" y="122" width="402" height="58" rx="8"/><text class="sT" x="505" y="146" text-anchor="middle">ratio of the totals</text><text class="sC" x="505" y="166" text-anchor="middle">25 orders ÷ 1,010 sessions = 2.5%  ✓</text>
<text class="sS" x="360" y="210" text-anchor="middle">sum the numerators and the denominators first, then divide</text>
</svg><figcaption>Ratios don't add up or average. A tiny day weighs as much as a huge one when you average rates.</figcaption></figure>

The same rules apply in Excel ([[DA2]]), SQL ([[DA3]]) and DAX ([[DA4]]). Only the syntax changes.

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

<figure class="dia"><svg viewBox="0 0 720 248" role="img" aria-label="Issue tree: profit down splits into revenue down or costs up; revenue into fewer customers, fewer orders each or lower order value; costs into cost of goods, delivery and marketing">
<rect class="sR" x="14" y="98" width="150" height="44" rx="8"/><text class="sT" x="89" y="125" text-anchor="middle">why is profit down?</text>
<rect class="sW" x="214" y="46" width="140" height="40" rx="8"/><text class="sT" x="284" y="71" text-anchor="middle">revenue down</text><rect class="sW" x="214" y="156" width="140" height="40" rx="8"/><text class="sT" x="284" y="181" text-anchor="middle">costs up</text>
<path class="sLm" d="M164 120 H190 V66 H212 M190 120 V176 H212" fill="none"/>
<rect class="sB" x="404" y="8" width="190" height="32" rx="6"/><text class="sC" x="499" y="29" text-anchor="middle">fewer customers</text>
<rect class="sB" x="404" y="48" width="190" height="32" rx="6"/><text class="sC" x="499" y="69" text-anchor="middle">fewer orders each</text>
<rect class="sB" x="404" y="88" width="190" height="32" rx="6"/><text class="sC" x="499" y="109" text-anchor="middle">lower order value</text>
<rect class="sB" x="404" y="126" width="190" height="32" rx="6"/><text class="sC" x="499" y="147" text-anchor="middle">cost of goods up</text>
<rect class="sB" x="404" y="166" width="190" height="32" rx="6"/><text class="sC" x="499" y="187" text-anchor="middle">delivery cost up</text>
<rect class="sB" x="404" y="206" width="190" height="32" rx="6"/><text class="sC" x="499" y="227" text-anchor="middle">marketing spend up</text>
<path class="sLm" d="M354 66 H380 V24 H402 M380 66 V64 H402 M380 66 V104 H402" fill="none"/>
<path class="sLm" d="M354 176 H380 V142 H402 M380 176 V182 H402 M380 176 V222 H402" fill="none"/>
<text class="sGt" x="612" y="120">no overlaps,</text><text class="sGt" x="612" y="138">no gaps</text>
</svg><figcaption>A MECE issue tree. Each branch is a hypothesis you can check with one query.</figcaption></figure>

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

<figure class="dia"><svg viewBox="0 0 720 228" role="img" aria-label="Metric tree: revenue equals customers times orders per customer times average order value; customers split into new and retained; AOV into items per order, item price and one minus discount">
<rect class="sA" x="290" y="14" width="140" height="42" rx="8"/><text class="sT" x="360" y="40" text-anchor="middle">revenue</text>
<line class="sLm" x1="360" y1="56" x2="145" y2="94"/><rect class="sB" x="60" y="96" width="170" height="40" rx="8"/><text class="sT" x="145" y="121" text-anchor="middle">customers</text>
<line class="sLm" x1="360" y1="56" x2="360" y2="94"/><rect class="sB" x="275" y="96" width="170" height="40" rx="8"/><text class="sT" x="360" y="121" text-anchor="middle">orders / customer</text>
<line class="sLm" x1="360" y1="56" x2="575" y2="94"/><rect class="sB" x="490" y="96" width="170" height="40" rx="8"/><text class="sT" x="575" y="121" text-anchor="middle">AOV</text>
<text class="sT" x="252" y="122" text-anchor="middle">×</text><text class="sT" x="467" y="122" text-anchor="middle">×</text>
<line class="sLm" x1="145" y1="136" x2="64" y2="174"/><line class="sLm" x1="145" y1="136" x2="185" y2="174"/>
<rect class="sG" x="14" y="176" width="100" height="40" rx="8"/><text class="sT" x="64" y="201" text-anchor="middle">new</text><rect class="sG" x="130" y="176" width="110" height="40" rx="8"/><text class="sT" x="185" y="201" text-anchor="middle">retained</text><text class="sT" x="122" y="202" text-anchor="middle">+</text>
<line class="sLm" x1="575" y1="136" x2="445" y2="174"/><rect class="sV" x="400" y="176" width="90" height="40" rx="8"/><text class="sT" x="445" y="201" text-anchor="middle">items/order</text>
<line class="sLm" x1="575" y1="136" x2="553" y2="174"/><rect class="sV" x="508" y="176" width="90" height="40" rx="8"/><text class="sT" x="553" y="201" text-anchor="middle">item price</text>
<line class="sLm" x1="575" y1="136" x2="661" y2="174"/><rect class="sV" x="616" y="176" width="90" height="40" rx="8"/><text class="sT" x="661" y="201" text-anchor="middle">1 − discount</text>
<text class="sT" x="503" y="202" text-anchor="middle">×</text><text class="sT" x="611" y="202" text-anchor="middle">×</text>
</svg><figcaption>A metric tree turns "revenue moved" into "which lever moved". Each leaf usually has an owner who can act on it.</figcaption></figure>

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

<figure class="dia"><svg viewBox="0 0 720 214" role="img" aria-label="One month with 1,000 starting customers, 50 lost and 300 new: churn is 5 percent against the starting base, but 4 percent against the end count, 4.4 percent against the average and 3.8 percent if new joiners are included; the lifetime value computed from those churn rates rises from 1,200 to as much as 1,560 pounds">
<text class="sT" x="14" y="22">one month: 1,000 customers at the start, 50 leave, 300 join, 1,250 at the end</text>
<text class="sS" x="250" y="53" text-anchor="end">÷ customers at the START (correct)</text><rect class="sG" x="260" y="36" width="200" height="24" rx="4" opacity=".6"/><text class="sT" x="466" y="53">churn 5.0%</text>
<text class="sGt" x="706" y="53" text-anchor="end">LTV = EGP 1,200</text>
<text class="sS" x="250" y="87" text-anchor="end">÷ customers at the end</text><rect class="sR" x="260" y="70" width="160" height="24" rx="4" opacity=".6"/><text class="sT" x="426" y="87">churn 4.0%</text>
<text class="sRt" x="706" y="87" text-anchor="end">LTV = EGP 1,500</text>
<text class="sS" x="250" y="121" text-anchor="end">÷ average of start and end</text><rect class="sR" x="260" y="104" width="177.778" height="24" rx="4" opacity=".6"/><text class="sT" x="443.778" y="121">churn 4.4%</text>
<text class="sRt" x="706" y="121" text-anchor="end">LTV = EGP 1,350</text>
<text class="sS" x="250" y="155" text-anchor="end">÷ start + new joiners</text><rect class="sR" x="260" y="138" width="153.846" height="24" rx="4" opacity=".6"/><text class="sT" x="419.846" y="155">churn 3.8%</text>
<text class="sRt" x="706" y="155" text-anchor="end">LTV = EGP 1,560</text>
<text class="sS" x="360" y="184" text-anchor="middle">LTV = ARPU × margin ÷ churn, with ARPU EGP 100 and 60% gross margin</text>
<text class="sWt" x="360" y="204" text-anchor="middle">a growing business makes the wrong denominators look better: LTV overstated by up to 30%</text>
</svg><figcaption>The churn-denominator mistake in numbers: the same 50 lost customers, four denominators, and the lifetime value each one implies.</figcaption></figure>

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

<figure class="dia"><svg viewBox="0 0 720 220" role="img" aria-label="Cohort retention as a heatmap for January, February and March signups and as retention curves; March retains better after the onboarding redesign">
<text class="sM" x="180" y="20" text-anchor="middle">retention by signup month</text>
<text class="sT" x="116" y="42" text-anchor="middle">M0</text>
<text class="sT" x="176" y="42" text-anchor="middle">M1</text>
<text class="sT" x="236" y="42" text-anchor="middle">M2</text>
<text class="sT" x="296" y="42" text-anchor="middle">M3</text>
<text class="sT" x="70" y="76" text-anchor="end">Jan</text>
<rect class="sG" x="88" y="52" width="56" height="36" rx="4" opacity="1.00"/><text class="sC" x="116" y="75" text-anchor="middle">100%</text>
<rect class="sG" x="148" y="52" width="56" height="36" rx="4" opacity="0.51"/><text class="sC" x="176" y="75" text-anchor="middle">42%</text>
<rect class="sG" x="208" y="52" width="56" height="36" rx="4" opacity="0.45"/><text class="sC" x="236" y="75" text-anchor="middle">35%</text>
<rect class="sG" x="268" y="52" width="56" height="36" rx="4" opacity="0.41"/><text class="sC" x="296" y="75" text-anchor="middle">31%</text>
<text class="sT" x="70" y="118" text-anchor="end">Feb</text>
<rect class="sG" x="88" y="94" width="56" height="36" rx="4" opacity="1.00"/><text class="sC" x="116" y="117" text-anchor="middle">100%</text>
<rect class="sG" x="148" y="94" width="56" height="36" rx="4" opacity="0.53"/><text class="sC" x="176" y="117" text-anchor="middle">45%</text>
<rect class="sG" x="208" y="94" width="56" height="36" rx="4" opacity="0.46"/><text class="sC" x="236" y="117" text-anchor="middle">37%</text>
<rect class="sG" x="268" y="94" width="56" height="36" rx="4" opacity="0.43"/><text class="sC" x="296" y="117" text-anchor="middle">33%</text>
<text class="sT" x="70" y="160" text-anchor="end">Mar</text>
<rect class="sG" x="88" y="136" width="56" height="36" rx="4" opacity="1.00"/><text class="sC" x="116" y="159" text-anchor="middle">100%</text>
<rect class="sG" x="148" y="136" width="56" height="36" rx="4" opacity="0.59"/><text class="sC" x="176" y="159" text-anchor="middle">52%</text>
<rect class="sG" x="208" y="136" width="56" height="36" rx="4" opacity="0.52"/><text class="sC" x="236" y="159" text-anchor="middle">44%</text>
<rect class="sN" x="268" y="136" width="56" height="36" rx="4"/><text class="sC" x="296" y="159" text-anchor="middle">—</text>
<text class="sC" x="180" y="196" text-anchor="middle">rows: cohorts · columns: months since signup</text>
<line class="sLm" x1="400" y1="190" x2="690" y2="190" marker-end="url(#ahm)"/><line class="sLm" x1="400" y1="190" x2="400" y2="30" marker-end="url(#ahm)"/>
<text class="sC" x="420" y="208" text-anchor="middle">month 0</text>
<text class="sC" x="506" y="208" text-anchor="middle">month 1</text>
<text class="sC" x="592" y="208" text-anchor="middle">month 2</text>
<text class="sC" x="678" y="208" text-anchor="middle">month 3</text>
<polyline class="sLm" points="420,40.0 506,127.0 592,137.5 678,143.5" fill="none" stroke-width="2.5"/>
<text class="sC" x="684" y="159.5">Jan</text>
<polyline class="sLw" points="420,40.0 506,122.5 592,134.5 678,140.5" fill="none" stroke-width="2.5"/>
<text class="sWt" x="684" y="134.5">Feb</text>
<polyline class="sLg" points="420,40.0 506,112.0 592,124.0" fill="none" stroke-width="2.5"/>
<text class="sGt" x="598" y="128">Mar</text>
<text class="sC" x="560" y="50" text-anchor="middle">curves flatten: a core keeps getting value</text>
</svg><figcaption>The same cohort table, twice. The heatmap is for reading numbers; the curves are for seeing the shape.</figcaption></figure>

## DA1.7 Segmentation 🟢 🟡

Averages hide differences. Segment by: geography (Cairo, Giza, Alexandria, Delta, Upper Egypt), channel (app, web, call centre), device, customer type (consumer or business, new or returning), acquisition source, plan or tier, and behaviour.

> [!term] RFM segmentation
> Scoring customers on **R**ecency (days since last purchase), **F**requency (number of purchases) and **M**onetary value (total spend), usually as quintiles 1–5 each. "555" are champions; high-value customers with low recency are "at risk", which is a target for win-back campaigns. It's simple, explainable and asked about often.

<figure class="dia"><svg viewBox="0 0 720 260" role="img" aria-label="RFM segments on a grid of recency score against frequency and monetary score: champions, loyal, at risk, needs attention, new and hibernating, each with a suggested action">
<rect class="sN" x="201" y="185" width="38" height="38" rx="3"/>
<rect class="sN" x="201" y="145" width="38" height="38" rx="3"/>
<rect class="sW" x="201" y="105" width="38" height="38" rx="3"/>
<rect class="sR" x="201" y="65" width="38" height="38" rx="3"/>
<rect class="sR" x="201" y="25" width="38" height="38" rx="3"/>
<rect class="sN" x="241" y="185" width="38" height="38" rx="3"/>
<rect class="sN" x="241" y="145" width="38" height="38" rx="3"/>
<rect class="sW" x="241" y="105" width="38" height="38" rx="3"/>
<rect class="sR" x="241" y="65" width="38" height="38" rx="3"/>
<rect class="sR" x="241" y="25" width="38" height="38" rx="3"/>
<rect class="sW" x="281" y="185" width="38" height="38" rx="3"/>
<rect class="sW" x="281" y="145" width="38" height="38" rx="3"/>
<rect class="sW" x="281" y="105" width="38" height="38" rx="3"/>
<rect class="sA" x="281" y="65" width="38" height="38" rx="3"/>
<rect class="sA" x="281" y="25" width="38" height="38" rx="3"/>
<rect class="sB" x="321" y="185" width="38" height="38" rx="3"/>
<rect class="sB" x="321" y="145" width="38" height="38" rx="3"/>
<rect class="sW" x="321" y="105" width="38" height="38" rx="3"/>
<rect class="sG" x="321" y="65" width="38" height="38" rx="3"/>
<rect class="sG" x="321" y="25" width="38" height="38" rx="3"/>
<rect class="sB" x="361" y="185" width="38" height="38" rx="3"/>
<rect class="sB" x="361" y="145" width="38" height="38" rx="3"/>
<rect class="sW" x="361" y="105" width="38" height="38" rx="3"/>
<rect class="sG" x="361" y="65" width="38" height="38" rx="3"/>
<rect class="sG" x="361" y="25" width="38" height="38" rx="3"/>
<text class="sT" x="360" y="68" text-anchor="middle">champions</text><text class="sT" x="240" y="68" text-anchor="middle">at risk</text><rect class="sW" x="240" y="113" width="120" height="22" rx="4"/><text class="sT" x="300" y="129" text-anchor="middle">needs attention</text>
<text class="sT" x="360" y="189" text-anchor="middle">new</text><text class="sC" x="240" y="189" text-anchor="middle">hibernating</text><text class="sC" x="300" y="48" text-anchor="middle">loyal</text>
<text class="sC" x="300" y="244" text-anchor="middle">recency score → (5 = bought recently)</text>
<text class="sC" x="192" y="38" text-anchor="end">frequency +</text><text class="sC" x="192" y="54" text-anchor="end">monetary ↑</text>
<text class="sT" x="440" y="50">champions</text><text class="sGt" x="440" y="68">reward them; ask for referrals</text>
<text class="sT" x="440" y="94">at risk</text><text class="sRt" x="440" y="112">win-back offer now: they were great</text>
<text class="sT" x="440" y="138">new</text><text class="sC" x="440" y="156">onboarding, second purchase</text>
<text class="sT" x="440" y="182">hibernating</text><text class="sC" x="440" y="200">cheap reactivation, or let go</text>
</svg><figcaption>RFM turns a customer list into a to-do list: each segment gets a different action.</figcaption></figure>

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

<figure class="dia steps" data-start="1"><svg viewBox="0 0 720 222" role="img" aria-label="Investigating a revenue drop: confirm the data, size it against normal variation, decompose revenue, segment by platform, find the failing funnel step, recommend">
<g data-s="1-1"><line class="sLm" x1="60" y1="200" x2="660" y2="200" marker-end="url(#ahm)"/><polyline class="sL" points="70,125.0 114,132.5 158,128.8 202,121.2 246,106.2 290,68.8 334,78.1 378,123.1 422,130.6 466,126.9 510,119.4 554,104.4 598,66.9 642,113.8" fill="none" stroke-width="2"/><circle class="sPr" cx="642" cy="113.8" r="6"/><text class="sRt" x="642" y="137.75" text-anchor="middle">Saturday</text><rect class="sN" x="80" y="30" width="250" height="74" rx="8"/><text class="sGt" x="96" y="52">✓ pipeline ran on time</text><text class="sGt" x="96" y="72">✓ event volumes normal</text><text class="sGt" x="96" y="92">✓ the day is complete (Cairo)</text></g>
<g data-s="2-2"><line class="sLm" x1="60" y1="200" x2="660" y2="200" marker-end="url(#ahm)"/><polygon class="sG" opacity=".35" points="378,113.8 422,121.7 466,117.7 510,109.8 554,93.9 598,54.1 642,64.1 642,92.2 598,83.4 554,118.6 510,132.7 466,139.8 422,143.3 378,136.2"/><polyline class="sL" points="70,125.0 114,132.5 158,128.8 202,121.2 246,106.2 290,68.8 334,78.1 378,123.1 422,130.6 466,126.9 510,119.4 554,104.4 598,66.9 642,113.8" fill="none" stroke-width="2"/><circle class="sPr" cx="642" cy="113.8" r="6"/><text class="sGt" x="470" y="46" text-anchor="middle">shaded: last week ± 6%</text><text class="sRt" x="634" y="117.75" text-anchor="end">−19% vs last Saturday</text></g>
<g data-s="3-3"><rect class="sR" x="270" y="24" width="180" height="50" rx="8"/><text class="sT" x="360" y="46" text-anchor="middle">revenue</text><text class="sC" x="360" y="64" text-anchor="middle">−19%</text><line class="sLm" x1="360" y1="74" x2="125" y2="120"/><line class="sLm" x1="360" y1="74" x2="360" y2="120"/><line class="sLm" x1="360" y1="74" x2="595" y2="120"/><rect class="sR" x="40" y="122" width="170" height="50" rx="8"/><text class="sT" x="125" y="144" text-anchor="middle">customers</text><text class="sC" x="125" y="162" text-anchor="middle">−18%</text><rect class="sB" x="275" y="122" width="170" height="50" rx="8"/><text class="sT" x="360" y="144" text-anchor="middle">orders / customer</text><text class="sC" x="360" y="162" text-anchor="middle">−1%</text><rect class="sB" x="510" y="122" width="170" height="50" rx="8"/><text class="sT" x="595" y="144" text-anchor="middle">AOV</text><text class="sC" x="595" y="162" text-anchor="middle">0%</text><text class="sC" x="360" y="200" text-anchor="middle">fewer people are buying; those who buy behave normally</text></g>
<g data-s="4-4"><text class="sT" x="170" y="62" text-anchor="end">iOS app</text><rect class="sB" x="180" y="40" width="20" height="34" rx="4"/><text class="sC" x="208" y="62">-2%</text><text class="sT" x="170" y="112" text-anchor="end">web</text><rect class="sB" x="180" y="90" width="10" height="34" rx="4"/><text class="sC" x="198" y="112">-1%</text><text class="sT" x="170" y="162" text-anchor="end">Android app</text><rect class="sR" x="180" y="140" width="410" height="34" rx="4"/><text class="sRt" x="598" y="162">-41%</text><text class="sRt" x="360" y="206" text-anchor="middle">Android only, and only app version 5.2 when split further</text></g>
<g data-s="5-5"><text class="sM" x="170" y="26" text-anchor="end">Android funnel</text><text class="sC" x="470" y="26" text-anchor="middle">last Saturday → this Saturday</text><text class="sC" x="170" y="56" text-anchor="end">visits</text><rect class="sB" x="180" y="38" width="400" height="24" rx="4"/><text class="sC" x="586" y="56">100%</text><text class="sC" x="170" y="88" text-anchor="end">product views</text><rect class="sR" x="180" y="70" width="244" height="24" rx="4"/><text class="sRt" x="430" y="88">62% → 61%</text><text class="sC" x="170" y="120" text-anchor="end">add to cart</text><rect class="sB" x="180" y="102" width="84" height="24" rx="4"/><text class="sC" x="270" y="120">21%</text><text class="sC" x="170" y="152" text-anchor="end">checkout</text><rect class="sB" x="180" y="134" width="48" height="24" rx="4"/><text class="sC" x="234" y="152">12%</text><text class="sC" x="170" y="184" text-anchor="end">payment success</text><rect class="sR" x="180" y="166" width="220" height="24" rx="4"/><text class="sRt" x="406" y="184">92% → 55%</text></g>
<g data-s="6-6"><rect class="sG" x="100" y="44" width="520" height="130" rx="10"/><text class="sT" x="360" y="72" text-anchor="middle">Android 5.2 broke card payments</text><text class="sC" x="360" y="100" text-anchor="middle">hotfix or roll back the release today</text><text class="sC" x="360" y="122" text-anchor="middle">lost revenue so far: about EGP 410k</text><text class="sC" x="360" y="144" text-anchor="middle">add an alert: payment success by app version</text></g>
</svg><ol class="dia-steps">
<li><b>Is it real?</b> Before any analysis, rule out a data problem: did the pipeline run, are event volumes normal, is the day complete in Cairo time?</li>
<li><b>How big?</b> Compare with the same weekday last week (Saturdays are always high). The drop is far outside the normal range.</li>
<li><b>Decompose</b> along the metric tree: the loss is in the number of buying customers, not in how much each spends.</li>
<li><b>Segment:</b> iOS and web are flat; Android is down 41%. Splitting Android by app version isolates 5.2, released on Thursday.</li>
<li><b>Find the step:</b> in the Android funnel, everything is normal until payment success, which fell from 92% to 55%.</li>
<li><b>Recommend:</b> one sentence on the cause, the action, the size of the impact, and how you'll catch it next time.</li>
</ol><figcaption>Verify, size, decompose, segment, locate, recommend. Most "why did it drop?" cases end at a bug, a definition change or a calendar effect.</figcaption></figure>

> [!say]
> "First I'd confirm the drop is real and not a tracking or pipeline issue. Then I'd size it against normal variation and seasonality, decompose revenue into customers, frequency and order value, and segment by platform, region and channel to see where it's concentrated. Once I find the segment and funnel step, I'd line it up with recent releases, campaigns or outages, and come back with the likely cause, the evidence, and a suggested fix to verify."

## DA1.9 Answer first: communicating to managers 🟢 ⭐

Use the **pyramid principle**: lead with the answer, then the supporting points, then the detail.

<figure class="dia"><svg viewBox="0 0 720 228" role="img" aria-label="The pyramid principle: the answer at the top, two or three supporting points in the middle, evidence and method at the base">
<polygon class="sA" points="230,14 300,80 160,80"/><text class="sT" x="230" y="66" text-anchor="middle">answer</text>
<polygon class="sB" points="157,84 303,84 370,148 90,148"/><text class="sT" x="230" y="124" text-anchor="middle">supporting points</text>
<polygon class="sN" points="86,152 374,152 440,216 20,216"/><text class="sT" x="230" y="192" text-anchor="middle">evidence, method, caveats</text>
<text class="sT" x="460" y="46">"Small-business retention fell 6 points</text><text class="sT" x="460" y="64">after the July price change."</text>
<text class="sC" x="460" y="110">monthly plan only · annual unaffected ·</text><text class="sC" x="460" y="128">explains most of the revenue gap</text>
<text class="sC" x="460" y="178">queries, cohort definitions, caveats:</text><text class="sC" x="460" y="196">in the appendix, if they ask</text>
</svg><figcaption>Executives read top-down and stop early. Put what they need in the part they read.</figcaption></figure>

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
