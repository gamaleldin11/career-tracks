# Data Modelling — Dimensional Models, Grain, Facts, Dimensions and Slowly Changing History

"Model this business for analytics" is the central design question in data-engineering and analytics-engineering interviews. A good model makes every dashboard and query simpler, faster and consistent; a bad one makes every number an argument. This module covers **Kimball dimensional modelling** (still the industry's common language), the decisions that matter most (grain, fact types, additivity, surrogate keys, slowly changing dimensions), the main alternatives (Data Vault, wide tables), and a full worked example. It builds on normalisation in [[B6.1]] and is the model Power BI expects ([[DA4.3]]).

> [!focus]
> **Entry must:** explain facts vs dimensions and star vs snowflake schemas; declare the grain of a fact table; use surrogate keys; explain SCD Type 1 vs Type 2; model a simple business process.
> **Mid adds:** the four-step design process, transaction, periodic-snapshot and accumulating-snapshot facts, additive vs semi-additive measures, conformed dimensions and the bus matrix, role-playing and degenerate dimensions, Data Vault and one-big-table trade-offs.
> **Most asked:** *What's the difference between a fact and a dimension?* · *What is grain?* · *Star vs snowflake?* · *Explain SCD Type 2* · *Why surrogate keys?* · *How would you model an e-commerce or delivery business?* · *Kimball vs Data Vault vs Inmon?*
> **Time budget:** 3.5 hours.

## DE2.0 Foundations: the same data, shaped twice 🟢

An application database and a warehouse can hold exactly the same facts, arranged for opposite jobs.

- The **application** needs every write to be correct and cheap: change a customer's city in **one** place, never leave an order pointing at a missing product. So it **normalises**: many narrow tables, each fact stored once, linked by keys ([[B6.1]]).
- The **analyst** needs reads to be easy and fast: "revenue by city and category, by month" without a page of joins, over years of history. So the warehouse **denormalises** into a few wide, descriptive tables around central tables of measurements.

<figure class="dia"><svg viewBox="0 0 720 270" role="img" aria-label="The same order data as a normalised schema of six related tables needing many joins, and as a star schema with one fact table and four dimensions">
<text class="sM" x="176" y="20" text-anchor="middle">normalised (OLTP): write each fact once</text>
<rect class="sB" x="20" y="40" width="96" height="36" rx="8"/><text class="sT" x="68" y="63" text-anchor="middle">customers</text>
<rect class="sB" x="20" y="120" width="96" height="36" rx="8"/><text class="sT" x="68" y="143" text-anchor="middle">cities</text>
<rect class="sB" x="130" y="40" width="96" height="36" rx="8"/><text class="sT" x="178" y="63" text-anchor="middle">orders</text>
<rect class="sB" x="130" y="120" width="96" height="36" rx="8"/><text class="sT" x="178" y="143" text-anchor="middle">order_lines</text>
<rect class="sB" x="240" y="120" width="96" height="36" rx="8"/><text class="sT" x="288" y="143" text-anchor="middle">products</text>
<rect class="sB" x="240" y="200" width="96" height="36" rx="8"/><text class="sT" x="288" y="223" text-anchor="middle">categories</text>
<line class="sLm" x1="68" y1="76" x2="68" y2="118"/>
<line class="sLm" x1="116" y1="58" x2="128" y2="58"/>
<line class="sLm" x1="178" y1="76" x2="178" y2="118"/>
<line class="sLm" x1="226" y1="138" x2="238" y2="138"/>
<line class="sLm" x1="288" y1="156" x2="288" y2="198"/>
<text class="sRt" x="176" y="256" text-anchor="middle">revenue by city and category: 5 joins</text>
<line class="sD" x1="350" y1="12" x2="350" y2="264"/>
<text class="sM" x="540" y="20" text-anchor="middle">dimensional (OLAP): read it easily</text>
<rect class="sA" x="470" y="120" width="140" height="50" rx="8"/><text class="sT" x="540" y="143" text-anchor="middle">fact_order_line</text><text class="sC" x="540" y="159" text-anchor="middle">qty · amount</text>
<rect class="sG" x="380" y="40" width="110" height="36" rx="8"/><text class="sT" x="435" y="63" text-anchor="middle">dim_date</text>
<line class="sLm" x1="435" y1="76" x2="540" y2="145"/>
<rect class="sG" x="600" y="40" width="110" height="36" rx="8"/><text class="sT" x="655" y="63" text-anchor="middle">dim_customer</text>
<line class="sLm" x1="655" y1="76" x2="540" y2="145"/>
<rect class="sG" x="380" y="200" width="110" height="36" rx="8"/><text class="sT" x="435" y="223" text-anchor="middle">dim_product</text>
<line class="sLm" x1="435" y1="200" x2="540" y2="145"/>
<rect class="sG" x="600" y="200" width="110" height="36" rx="8"/><text class="sT" x="655" y="223" text-anchor="middle">dim_restaurant</text>
<line class="sLm" x1="655" y1="200" x2="540" y2="145"/>
<text class="sGt" x="540" y="256" text-anchor="middle">one fact, a handful of dimensions: 2 joins</text>
</svg><figcaption>Same data, two shapes. Normalisation protects writes; a star schema serves reads, which is the warehouse's job.</figcaption></figure>

The rest of this module is the vocabulary and the decisions of that second shape: grain, facts, dimensions, and what to do when the world they describe changes.

## DE2.1 Two shapes for two jobs 🟢 ⭐

| | Normalised (3NF) | Dimensional (star schema) |
|---|---|---|
| Optimised for | **Writing** correctly: each fact once, no update anomalies | **Reading** easily and fast: few joins, business-friendly names |
| Used in | OLTP application databases; sometimes an integration layer | Analytics: warehouses, gold layers, BI semantic models |
| Query shape | Many joins to answer a business question | One fact joined to a handful of dimensions |

**Bill Inmon** advocated a normalised enterprise warehouse feeding departmental marts; **Ralph Kimball** advocated building the warehouse directly as conformed dimensional models. Most modern platforms are Kimball-style in the gold layer, whatever happens upstream.

## DE2.2 Facts and dimensions 🟢 ⭐

> [!term] Fact table
> Records **measurements of a business process** at a declared grain: each row is an event or a snapshot (an order line, a payment, a daily account balance). Columns are **foreign keys** to dimensions plus numeric **measures** (amount, quantity, duration). Facts are long and narrow.

> [!term] Dimension table
> Provides the **context** for facts, meaning the who, what, where, when and how: customer, product, store, date, channel. Columns are descriptive **attributes** used for filtering, grouping and labelling. Dimensions are short and wide.

> [!term] Grain
> Exactly what **one row of a fact table represents**, stated in business terms: "one row per product per order line" or "one row per account per day". Declaring the grain **first** is the most important modelling decision; mixing grains in one table (order headers and lines together) produces double counting.

> [!say]
> "A fact table records measurements of a business process at a declared grain, like one row per order line with quantity and amount; dimensions hold the descriptive context, like customer, product, date and store, that you filter and group by. I always state the grain first, because mixing grains in one table is the classic cause of double counting."

## DE2.3 The four-step design process 🟢 ⭐

Kimball's process, which works as an interview structure:

1. **Choose the business process** (not a department or report): taking orders, delivering orders, recording payments, call-centre calls.
2. **Declare the grain**: the most **atomic** level available (order line rather than daily totals), because you can always aggregate up but never down.
3. **Identify the dimensions**: everything that describes the process at that grain.
4. **Identify the facts**: the numeric measurements true at that grain.

### Three kinds of fact table ⭐

| Type | Grain | Example | Rows |
|---|---|---|---|
| **Transaction** | One row per event | `fact_order_line`, `fact_payment`, `fact_call` | Inserted once, rarely updated |
| **Periodic snapshot** | One row per entity per period | `fact_account_balance_daily`, `fact_inventory_daily`, `fact_subscriber_monthly` | One row per period for every entity, even without activity |
| **Accumulating snapshot** | One row per **process instance**, updated as it moves through milestones | `fact_order_fulfilment` with placed, accepted, picked up, delivered timestamps and durations | **Updated** as milestones happen |

A **factless fact table** records events or coverage with no measures, for example which students attended which class, or which products were on promotion in which stores.

<figure class="dia"><svg viewBox="0 0 720 226" role="img" aria-label="Three kinds of fact table: transaction facts as individual events, a periodic snapshot with one balance per account per day, and an accumulating snapshot with one row per order updated at each milestone">
<text class="sC" x="200" y="22" text-anchor="middle">day 1</text>
<text class="sC" x="260" y="22" text-anchor="middle">day 2</text>
<text class="sC" x="320" y="22" text-anchor="middle">day 3</text>
<text class="sC" x="380" y="22" text-anchor="middle">day 4</text>
<text class="sC" x="440" y="22" text-anchor="middle">day 5</text>
<text class="sC" x="500" y="22" text-anchor="middle">day 6</text>
<text class="sC" x="560" y="22" text-anchor="middle">day 7</text>
<text class="sC" x="620" y="22" text-anchor="middle">day 8</text>
<text class="sC" x="680" y="22" text-anchor="middle">day 9</text>
<text class="sT" x="186" y="52" text-anchor="end">transaction</text><text class="sC" x="186" y="68" text-anchor="end">one row per event</text>
<circle class="sP" cx="218" cy="58" r="6"/>
<circle class="sP" cx="248" cy="58" r="6"/>
<circle class="sP" cx="266" cy="58" r="6"/>
<circle class="sP" cx="356" cy="58" r="6"/>
<circle class="sP" cx="392" cy="58" r="6"/>
<circle class="sP" cx="404" cy="58" r="6"/>
<circle class="sP" cx="530" cy="58" r="6"/>
<circle class="sP" cx="566" cy="58" r="6"/>
<circle class="sP" cx="674" cy="58" r="6"/>
<text class="sT" x="186" y="116" text-anchor="end">periodic snapshot</text><text class="sC" x="186" y="132" text-anchor="end">one row per account per day</text>
<rect class="sV" x="178" y="108" width="44" height="26" rx="4" opacity=".7"/><text class="sC" x="200" y="126" text-anchor="middle">900</text>
<rect class="sV" x="238" y="108" width="44" height="26" rx="4" opacity=".7"/><text class="sC" x="260" y="126" text-anchor="middle">900</text>
<rect class="sV" x="298" y="108" width="44" height="26" rx="4" opacity=".7"/><text class="sC" x="320" y="126" text-anchor="middle">650</text>
<rect class="sV" x="358" y="108" width="44" height="26" rx="4" opacity=".7"/><text class="sC" x="380" y="126" text-anchor="middle">650</text>
<rect class="sV" x="418" y="108" width="44" height="26" rx="4" opacity=".7"/><text class="sC" x="440" y="126" text-anchor="middle">700</text>
<rect class="sV" x="478" y="108" width="44" height="26" rx="4" opacity=".7"/><text class="sC" x="500" y="126" text-anchor="middle">700</text>
<rect class="sV" x="538" y="108" width="44" height="26" rx="4" opacity=".7"/><text class="sC" x="560" y="126" text-anchor="middle">700</text>
<rect class="sV" x="598" y="108" width="44" height="26" rx="4" opacity=".7"/><text class="sC" x="620" y="126" text-anchor="middle">400</text>
<rect class="sV" x="658" y="108" width="44" height="26" rx="4" opacity=".7"/><text class="sC" x="680" y="126" text-anchor="middle">400</text>
<text class="sT" x="186" y="180" text-anchor="end">accumulating snapshot</text><text class="sC" x="186" y="196" text-anchor="end">one row per order, updated</text>
<line class="sLg" x1="212" y1="186" x2="410" y2="186" stroke-width="3"/>
<circle class="sPg" cx="212" cy="186" r="7"/><text class="sC" x="212" y="212" text-anchor="middle">placed</text>
<circle class="sPg" cx="266" cy="186" r="7"/><text class="sC" x="266" y="212" text-anchor="middle">accepted</text>
<circle class="sPg" cx="338" cy="186" r="7"/><text class="sC" x="338" y="212" text-anchor="middle">picked up</text>
<circle class="sPg" cx="410" cy="186" r="7"/><text class="sC" x="410" y="212" text-anchor="middle">delivered</text>
<text class="sC" x="560" y="166" text-anchor="middle">durations between milestones become measures</text>
</svg><figcaption>Pick the fact type from the question: events, states over time, or a process moving through stages.</figcaption></figure>

### Additivity ⭐

| Measure type | Can be summed across… | Examples |
|---|---|---|
| **Additive** | All dimensions | Sales amount, quantity, number of calls |
| **Semi-additive** | Some dimensions, **not time** | **Balances**, inventory levels, subscriber counts (sum across accounts, but average or take the last value across days) |
| **Non-additive** | None | Ratios and percentages (margin %, conversion rate): store numerator and denominator and compute the ratio in the BI layer |

> [!mistake] Summing balances over time
> Adding up thirty daily account balances gives a meaningless number thirty times too large. Semi-additive measures need `AVERAGE` or "closing balance" (`LASTNONBLANK` in DAX) across time.

<figure class="dia"><svg viewBox="0 0 720 182" role="img" aria-label="Five daily balances of one account; summing them across days gives a meaningless 3,800, while the closing balance or the average is correct">
<rect class="sV" x="40" y="37.5" width="50" height="112.5" rx="3"/><text class="sC" x="65" y="31.5" text-anchor="middle">900</text><text class="sC" x="65" y="168" text-anchor="middle">day 1</text>
<rect class="sV" x="110" y="37.5" width="50" height="112.5" rx="3"/><text class="sC" x="135" y="31.5" text-anchor="middle">900</text><text class="sC" x="135" y="168" text-anchor="middle">day 2</text>
<rect class="sV" x="180" y="68.75" width="50" height="81.25" rx="3"/><text class="sC" x="205" y="62.75" text-anchor="middle">650</text><text class="sC" x="205" y="168" text-anchor="middle">day 3</text>
<rect class="sV" x="250" y="68.75" width="50" height="81.25" rx="3"/><text class="sC" x="275" y="62.75" text-anchor="middle">650</text><text class="sC" x="275" y="168" text-anchor="middle">day 4</text>
<rect class="sV" x="320" y="62.5" width="50" height="87.5" rx="3"/><text class="sC" x="345" y="56.5" text-anchor="middle">700</text><text class="sC" x="345" y="168" text-anchor="middle">day 5</text>
<line class="sLm" x1="30" y1="150" x2="400" y2="150"/>
<rect class="sR" x="430" y="30" width="276" height="44" rx="8" opacity=".85"/><text class="sT" x="568" y="50" text-anchor="middle">SUM over days = 3,800</text><text class="sC" x="568" y="66" text-anchor="middle">a balance nobody ever had ✗</text>
<rect class="sG" x="430" y="86" width="276" height="44" rx="8"/><text class="sT" x="568" y="106" text-anchor="middle">closing (last day) = 700 ✓</text><text class="sC" x="568" y="122" text-anchor="middle">or average over the period = 760</text>
<text class="sC" x="568" y="156" text-anchor="middle">across accounts on one day, SUM is fine</text>
</svg><figcaption>Semi-additive measures: add across accounts, never across time. Tell the BI layer which aggregation applies.</figcaption></figure>

## DE2.4 Designing dimensions 🟢 🟡 ⭐

> [!term] Surrogate key
> A meaningless integer (or hash) key generated by the warehouse for each dimension row, used to join facts to dimensions, instead of the source system's **natural/business key**. It insulates the warehouse from source-key changes and collisions across systems, makes joins compact and fast, and is **required for SCD Type 2**, where one customer has several history rows.

| Concept | Meaning | Example |
|---|---|---|
| **Conformed dimension** | One shared, consistent dimension used by many fact tables | The same `dim_customer` and `dim_date` for orders, payments and support tickets, so "revenue per customer segment" and "tickets per customer segment" line up |
| **Bus matrix** | A grid of business processes (rows) × conformed dimensions (columns) | Planning which facts share which dimensions across the enterprise |
| **Date dimension** | One row per day with calendar attributes | Week, month, fiscal period, weekday, Egyptian holidays, Ramadan day ([[DA3.1]]) |
| **Role-playing dimension** | One dimension used several times in different roles | `dim_date` as order date, delivery date and payment date |
| **Degenerate dimension** | A dimension key with no attributes, stored in the fact | Order number, invoice number |
| **Junk dimension** | Low-cardinality flags and indicators combined into one small dimension | `is_gift`, `payment_type`, `promo_flag` |
| **Outrigger / snowflaking** | A dimension normalised into sub-tables | `dim_product` → `dim_category` → `dim_department` |
| **Bridge table** | Resolves many-to-many relationships | A patient with several diagnoses; an account with several owners |
| **Unknown member** | A row for "unknown" (key −1) so facts never have NULL foreign keys | Orders with no matched customer |

**Star vs snowflake:** a **star** keeps each dimension as one wide, denormalised table; a **snowflake** normalises dimensions into hierarchies. Stars are simpler to query and usually faster in columnar engines (storage savings from snowflaking are negligible); snowflakes reduce some redundancy at the cost of more joins. Prefer stars for the presentation layer.

## DE2.5 Slowly changing dimensions 🟢 🟡 ⭐

Dimension attributes change: a customer moves from Giza to Cairo, a product changes category, a salesperson changes region. **How you handle the change decides whether history is reported "as it was" or "as it is now".**

| Type | Behaviour | Result | Use when |
|---|---|---|---|
| **Type 0** | Never change | The original value forever | Fixed facts: date of birth, original signup channel |
| **Type 1** | **Overwrite** | No history; all past facts now show the new value | Corrections (typo fixes), attributes where history doesn't matter |
| **Type 2** | **Add a new row** with a new surrogate key; close the old one | Full history: each fact links to the version true **when it happened** | Attributes that matter for historical analysis: region, segment, plan |
| **Type 3** | Add a "previous value" column | One level of history | "Old region vs new region" comparisons after a reorganisation |
| **Type 4** | Fast-changing attributes split into a mini-dimension or history table | — | Rapidly changing attributes (credit score band) |
| **Type 6** | Type 1 + 2 + 3 combined: history rows plus a "current value" column on every row | Report "as was" and "as is" | When both views are needed |

**A Type 2 dimension:**

| customer_sk | customer_id | name | city | segment | valid_from | valid_to | is_current |
|---|---|---|---|---|---|---|---|
| 1001 | C-42 | Nile Foods | Giza | SME | 2025-01-10 | 2026-05-31 | false |
| 1873 | C-42 | Nile Foods | Cairo | SME | 2026-06-01 | 9999-12-31 | true |

Orders from March 2026 point to `customer_sk = 1001` (Giza); orders from July point to `1873` (Cairo). Revenue by city is then historically correct. The fact-loading process looks up the surrogate key **valid on the event date**. The `MERGE` that maintains this table is in [[DE3]]; dbt **snapshots** generate it automatically ([[DE7]]).

<figure class="dia steps" data-start="1"><svg viewBox="0 0 720 150" role="img" aria-label="A customer moves from Giza to Cairo; a Type 1 dimension overwrites the city so March revenue moves to Cairo, while a Type 2 dimension adds a new row so March stays in Giza and July goes to Cairo">
<rect class="sN" x="14" y="30" width="50" height="24" rx="0"/><text class="sT" x="39" y="47" text-anchor="middle">sk</text>
<rect class="sN" x="64" y="30" width="96" height="24" rx="0"/><text class="sT" x="112" y="47" text-anchor="middle">customer</text>
<rect class="sN" x="160" y="30" width="66" height="24" rx="0"/><text class="sT" x="193" y="47" text-anchor="middle">city</text>
<rect class="sN" x="226" y="30" width="96" height="24" rx="0"/><text class="sT" x="274" y="47" text-anchor="middle">valid_from</text>
<rect class="sN" x="322" y="30" width="96" height="24" rx="0"/><text class="sT" x="370" y="47" text-anchor="middle">valid_to</text>
<text class="sM" x="14" y="20">dim_customer</text><text class="sM" x="600" y="20" text-anchor="middle">revenue by city</text>
<g data-s="1-1"><rect class="sB" x="14" y="54" width="50" height="24" rx="0" opacity=".6"/><text class="sC" x="39" y="71" text-anchor="middle">1001</text><rect class="sB" x="64" y="54" width="96" height="24" rx="0" opacity=".6"/><text class="sC" x="112" y="71" text-anchor="middle">Nile Foods</text><rect class="sB" x="160" y="54" width="66" height="24" rx="0" opacity=".6"/><text class="sC" x="193" y="71" text-anchor="middle">Giza</text><rect class="sB" x="226" y="54" width="96" height="24" rx="0" opacity=".6"/><text class="sC" x="274" y="71" text-anchor="middle">2025-01-10</text><rect class="sB" x="322" y="54" width="96" height="24" rx="0" opacity=".6"/><text class="sC" x="370" y="71" text-anchor="middle">9999-12-31</text><text class="sC" x="560" y="57" text-anchor="end">Giza (March)</text><rect class="sB" x="570" y="40" width="100" height="22" rx="3"/><text class="sC" x="676" y="56">600</text><text class="sC" x="260" y="130" text-anchor="middle">March order → sk 1001 (Giza)</text></g>
<g data-s="2-2"><rect class="sW" x="14" y="54" width="50" height="24" rx="0" opacity=".6"/><text class="sC" x="39" y="71" text-anchor="middle">1001</text><rect class="sW" x="64" y="54" width="96" height="24" rx="0" opacity=".6"/><text class="sC" x="112" y="71" text-anchor="middle">Nile Foods</text><rect class="sW" x="160" y="54" width="66" height="24" rx="0" opacity=".6"/><text class="sC" x="193" y="71" text-anchor="middle">Cairo</text><rect class="sW" x="226" y="54" width="96" height="24" rx="0" opacity=".6"/><text class="sC" x="274" y="71" text-anchor="middle">2025-01-10</text><rect class="sW" x="322" y="54" width="96" height="24" rx="0" opacity=".6"/><text class="sC" x="370" y="71" text-anchor="middle">9999-12-31</text><text class="sC" x="560" y="57" text-anchor="end">Cairo (March!)</text><rect class="sR" x="570" y="40" width="100" height="22" rx="3"/><text class="sC" x="676" y="56">600</text><text class="sC" x="560" y="87" text-anchor="end">Cairo (July)</text><rect class="sB" x="570" y="70" width="83.3333" height="22" rx="3"/><text class="sC" x="659.333" y="86">500</text><text class="sRt" x="260" y="130" text-anchor="middle">Type 1 overwrote the city: March now reports as Cairo ✗</text></g>
<g data-s="3-3"><rect class="sB" x="14" y="54" width="50" height="24" rx="0" opacity=".6"/><text class="sC" x="39" y="71" text-anchor="middle">1001</text><rect class="sB" x="64" y="54" width="96" height="24" rx="0" opacity=".6"/><text class="sC" x="112" y="71" text-anchor="middle">Nile Foods</text><rect class="sB" x="160" y="54" width="66" height="24" rx="0" opacity=".6"/><text class="sC" x="193" y="71" text-anchor="middle">Giza</text><rect class="sB" x="226" y="54" width="96" height="24" rx="0" opacity=".6"/><text class="sC" x="274" y="71" text-anchor="middle">2025-01-10</text><rect class="sB" x="322" y="54" width="96" height="24" rx="0" opacity=".6"/><text class="sC" x="370" y="71" text-anchor="middle">2026-05-31</text><rect class="sG" x="14" y="78" width="50" height="24" rx="0" opacity=".6"/><text class="sC" x="39" y="95" text-anchor="middle">1873</text><rect class="sG" x="64" y="78" width="96" height="24" rx="0" opacity=".6"/><text class="sC" x="112" y="95" text-anchor="middle">Nile Foods</text><rect class="sG" x="160" y="78" width="66" height="24" rx="0" opacity=".6"/><text class="sC" x="193" y="95" text-anchor="middle">Cairo</text><rect class="sG" x="226" y="78" width="96" height="24" rx="0" opacity=".6"/><text class="sC" x="274" y="95" text-anchor="middle">2026-06-01</text><rect class="sG" x="322" y="78" width="96" height="24" rx="0" opacity=".6"/><text class="sC" x="370" y="95" text-anchor="middle">9999-12-31</text><text class="sC" x="560" y="57" text-anchor="end">Giza (March)</text><rect class="sB" x="570" y="40" width="100" height="22" rx="3"/><text class="sC" x="676" y="56">600</text><text class="sC" x="560" y="87" text-anchor="end">Cairo (July)</text><rect class="sG" x="570" y="70" width="83.3333" height="22" rx="3"/><text class="sC" x="659.333" y="86">500</text><text class="sGt" x="260" y="130" text-anchor="middle">Type 2: March → 1001 (Giza), July → 1873 (Cairo) ✓</text></g>
</svg><ol class="dia-steps">
<li>Nile Foods is in Giza. Its March orders are loaded with surrogate key 1001.</li>
<li>On 1 June it moves to Cairo. <b>Type 1</b> overwrites the row, so March revenue is now reported under Cairo too: history has been rewritten.</li>
<li><b>Type 2</b> closes the old row and adds a new one with a new key. March facts still point to 1001 (Giza); July facts get 1873 (Cairo).</li>
</ol><figcaption>Type 2 keeps every report "as it was". The price is a lookup by date when loading facts.</figcaption></figure>

> [!say]
> "Type 1 overwrites the attribute, so history shows the current value; Type 2 adds a new row with a new surrogate key and validity dates, so each fact stays linked to the version that was true at the time. I'd use Type 2 for attributes like customer region or segment that analysts slice history by, and Type 1 for corrections."

## DE2.6 Alternatives to dimensional modelling 🟡

| Approach | Idea | Strengths | Costs |
|---|---|---|---|
| **Data Vault 2.0** | **Hubs** (business keys), **links** (relationships), **satellites** (descriptive attributes with history), all insert-only | Auditable, handles many changing sources, parallel loading, easy to add sources | Many tables and joins; needs a dimensional presentation layer on top for BI |
| **One Big Table (OBT)** / wide denormalised tables | Pre-join facts and dimension attributes into one wide table per use case | Very simple for BI tools and ad-hoc queries; columnar engines handle wide tables well | Duplication, harder to keep consistent, mixed grains risk; SCD history is awkward |
| **Normalised integration layer** (Inmon) | A 3NF enterprise model, then marts | Single integrated truth | Slow to build; still needs marts |

<figure class="dia"><svg viewBox="0 0 720 234" role="img" aria-label="Data Vault: hubs for the customer and order business keys, a link between them, and satellites holding their changing attributes with load dates">
<rect class="sA" x="40" y="40" width="160" height="50" rx="8"/><text class="sT" x="120" y="63" text-anchor="middle">hub_customer</text><text class="sC" x="120" y="79" text-anchor="middle">business key C-42</text><rect class="sA" x="520" y="40" width="160" height="50" rx="8"/><text class="sT" x="600" y="63" text-anchor="middle">hub_order</text><text class="sC" x="600" y="79" text-anchor="middle">business key O-9912</text>
<rect class="sV" x="280" y="40" width="160" height="50" rx="8"/><text class="sT" x="360" y="63" text-anchor="middle">link_customer_order</text><text class="sC" x="360" y="79" text-anchor="middle">C-42 ↔ O-9912</text>
<line class="sLm" x1="200" y1="65" x2="278" y2="65"/><line class="sLm" x1="440" y1="65" x2="518" y2="65"/>
<rect class="sW" x="40" y="140" width="160" height="56" rx="8"/><text class="sT" x="120" y="166" text-anchor="middle">sat_customer</text><text class="sC" x="120" y="182" text-anchor="middle">name, city + load date</text><rect class="sW" x="520" y="140" width="160" height="56" rx="8"/><text class="sT" x="600" y="166" text-anchor="middle">sat_order_status</text><text class="sC" x="600" y="182" text-anchor="middle">status history</text>
<line class="sLm" x1="120" y1="90" x2="120" y2="138"/><line class="sLm" x1="600" y1="90" x2="600" y2="138"/>
<text class="sC" x="360" y="160" text-anchor="middle">every table is insert-only,</text><text class="sC" x="360" y="178" text-anchor="middle">so the full history is auditable</text>
<text class="sS" x="360" y="222" text-anchor="middle">hubs = keys · links = relationships · satellites = changing attributes</text>
</svg><figcaption>Data Vault trades easy querying for auditability and easy integration of new sources. Stars are usually built on top of it.</figcaption></figure>

A common modern pattern: **source-shaped and cleaned data in silver**, **Kimball stars in gold**, and a few **wide tables** for specific dashboards or ML feature sets, all built with dbt.

## DE2.7 Semi-structured data 🟡

JSON from APIs and events is common. Options: land it raw in bronze; **flatten** the fields you need into typed columns in silver; keep the full payload in a `VARIANT`/`JSON` column for rarely used fields (Snowflake's `VARIANT`, BigQuery's `JSON` and nested `STRUCT`/`ARRAY`, Spark's `VARIANT` since 4.0, Iceberg v3's variant type); and **explode** arrays into child tables (order → order lines) when they're queried as rows.

## DE2.8 A worked model: a food-delivery app 🟡 ⭐

**Business processes:** ordering, delivering, paying, customer support.

**Bus matrix (excerpt):**

| Process ↓ / Dimension → | Date | Customer | Restaurant | Menu item | Courier | Zone | Payment method |
|---|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| Order lines | ✓ | ✓ | ✓ | ✓ | | ✓ | ✓ |
| Order fulfilment | ✓ (several roles) | ✓ | ✓ | | ✓ | ✓ | |
| Payments | ✓ | ✓ | | | | | ✓ |
| Support tickets | ✓ | ✓ | ✓ | | ✓ | ✓ | |

**Facts:**

- `fact_order_line`: grain = one row per menu item per order; measures: quantity, gross amount, discount, net amount; degenerate dimension: order number.
- `fact_order_fulfilment` (**accumulating snapshot**): grain = one row per order; date/time keys for placed, accepted, ready, picked up, delivered; measures: minutes per stage, total delivery minutes, delivery fee, `is_late` flag; updated as milestones arrive.
- `fact_courier_daily` (**periodic snapshot**): grain = one row per courier per day: hours online, orders delivered, earnings.

**Dimensions:** `dim_date`, `dim_time_of_day`, `dim_customer` (Type 2 on city and segment), `dim_restaurant` (Type 2 on zone and commission plan), `dim_menu_item` (Type 2 on price band and category), `dim_courier`, `dim_zone` (zone → district → governorate), `dim_payment_method` (junk dimension with flags).

<figure class="dia steps"><svg viewBox="0 0 720 270" role="img" aria-label="Constellation schema for a food-delivery app: three fact tables, order lines, order fulfilment and courier daily, share conformed dimensions for date, customer, restaurant, zone and courier, while menu item and payment method attach only to order lines">
<g data-s="1"><line class="sLm" x1="69" y1="58" x2="118.5" y2="116" opacity=".75"/><line class="sLm" x1="211" y1="58" x2="154" y2="116" opacity=".75"/><line class="sLm" x1="353" y1="58" x2="189.5" y2="116" opacity=".75"/><line class="sLm" x1="489" y1="58" x2="223.5" y2="116" opacity=".75"/><line class="sLm" x1="230" y1="222" x2="158.75" y2="176" opacity=".75"/><line class="sLm" x1="553" y1="222" x2="239.5" y2="176" opacity=".75"/><rect class="sA" x="40" y="116" width="190" height="60" rx="8"/><text class="sT" x="135" y="141" text-anchor="middle">fact_order_line</text><text class="sS" x="135" y="159" text-anchor="middle">1 row per item per order</text><rect class="sB" x="8" y="20" width="122" height="38" rx="6"/><text class="sT" x="69" y="37" text-anchor="middle">dim_menu_item</text><text class="sS" x="69" y="52" text-anchor="middle">SCD2</text><rect class="sB" x="136" y="20" width="150" height="38" rx="6"/><text class="sT" x="211" y="37" text-anchor="middle">dim_payment_method</text><text class="sS" x="211" y="52" text-anchor="middle">junk</text><rect class="sB" x="294" y="20" width="118" height="38" rx="6"/><text class="sT" x="353" y="37" text-anchor="middle">dim_customer</text><text class="sS" x="353" y="52" text-anchor="middle">SCD2</text><rect class="sB" x="424" y="20" width="130" height="38" rx="6"/><text class="sT" x="489" y="37" text-anchor="middle">dim_restaurant</text><text class="sS" x="489" y="52" text-anchor="middle">SCD2</text><rect class="sB" x="130" y="222" width="200" height="38" rx="6"/><text class="sT" x="230" y="239" text-anchor="middle">dim_zone</text><text class="sS" x="230" y="254" text-anchor="middle">zone → district → governorate</text><rect class="sB" x="400" y="222" width="306" height="38" rx="6"/><text class="sT" x="553" y="239" text-anchor="middle">dim_date</text><text class="sS" x="553" y="254" text-anchor="middle">role-played: placed, delivered, day</text></g>
<g data-s="2"><line class="sLm" x1="353" y1="58" x2="362" y2="116" opacity=".75"/><line class="sLm" x1="489" y1="58" x2="396" y2="116" opacity=".75"/><line class="sLm" x1="230" y1="222" x2="331.25" y2="176" opacity=".75"/><line class="sLm" x1="553" y1="222" x2="412" y2="176" opacity=".75"/><line class="sLm" x1="643" y1="58" x2="434.5" y2="116" opacity=".75"/><rect class="sA" x="270" y="116" width="190" height="60" rx="8"/><text class="sT" x="365" y="141" text-anchor="middle">fact_order_fulfilment</text><text class="sS" x="365" y="159" text-anchor="middle">1 row per order, updated</text><rect class="sB" x="580" y="20" width="126" height="38" rx="6"/><text class="sT" x="643" y="37" text-anchor="middle">dim_courier</text></g>
<g data-s="3"><line class="sLm" x1="643" y1="58" x2="607" y2="116" opacity=".75"/><line class="sLm" x1="553" y1="222" x2="584.5" y2="176" opacity=".75"/><rect class="sA" x="500" y="116" width="190" height="60" rx="8"/><text class="sT" x="595" y="141" text-anchor="middle">fact_courier_daily</text><text class="sS" x="595" y="159" text-anchor="middle">1 row per courier per day</text></g>
<g data-s="4"><rect class="sG" x="291" y="17" width="124" height="44" rx="8" style="fill:none;stroke-width:2.5"/><rect class="sG" x="421" y="17" width="136" height="44" rx="8" style="fill:none;stroke-width:2.5"/><rect class="sG" x="127" y="219" width="206" height="44" rx="8" style="fill:none;stroke-width:2.5"/><rect class="sG" x="397" y="219" width="312" height="44" rx="8" style="fill:none;stroke-width:2.5"/><rect class="sG" x="577" y="17" width="132" height="44" rx="8" style="fill:none;stroke-width:2.5"/><text class="sGt" x="360" y="88" text-anchor="middle">conformed: one shared table each</text></g>
</svg><ol class="dia-steps">
<li>Order lines: the finest grain, one row per menu item per order, with six dimensions around it.</li>
<li>Order fulfilment is an accumulating snapshot: one row per order, updated as each milestone arrives. It reuses the same customer, restaurant, zone and date tables and adds the courier.</li>
<li>Courier daily is a periodic snapshot: one row per courier per day.</li>
<li>Dimensions shared by several facts are conformed: one definition of customer or zone, so "on-time rate by zone" and "revenue by zone" can be put side by side.</li>
</ol><figcaption>The model above drawn as a constellation of stars: three facts at different grains sharing conformed dimensions.</figcaption></figure>

**Questions it answers easily:** revenue by governorate and week; on-time rate by zone, hour and restaurant; courier productivity; basket composition; payment-method mix; impact of a commission-plan change (thanks to Type 2 history).

> [!lab] Model three businesses
> Using the four-step process, design star schemas (grain, facts, dimensions, SCD choices) for: (1) FinSight (invoices, payments, transactions, forecasts per company), (2) a telecom (recharges, usage events, a monthly subscriber snapshot), and (3) Superstore (orders, returns). Draw them in dbdiagram.io or Mermaid and write the grain of each fact in one sentence. Then build one in DuckDB or PostgreSQL with sample data. It's the core DE and analytics-engineering interview exercise.

## DE2.9 Interview drill 🟢 ⭐

| Question | Strong short answer |
|---|---|
| Fact vs dimension? | Facts record measurements of a process at a grain (keys + measures); dimensions describe the context (attributes). |
| What is grain? | What one row of a fact table represents, declared first, at the most atomic level available. |
| Star vs snowflake? | Denormalised single-table dimensions vs normalised hierarchies; stars are simpler and usually faster. |
| What are the four steps of dimensional design? | Choose the business process, declare the grain, identify dimensions, identify facts. |
| Transaction vs periodic vs accumulating snapshot? | One row per event / per entity per period / per process instance updated at milestones. |
| What is a semi-additive measure? | One that can be summed across some dimensions but not time, like balances or inventory. |
| Why surrogate keys? | Insulation from source keys, compact joins, and multiple history rows for SCD Type 2. |
| What's a conformed dimension? | A shared, consistent dimension used by many fact tables so metrics line up. |
| SCD Type 1 vs Type 2? | Overwrite (no history) vs a new row with validity dates and a new surrogate key (full history). |
| What's a degenerate dimension? | A dimension key with no attributes, kept in the fact, like an order number. |
| What's a role-playing dimension? | One dimension used in several roles, like order date and delivery date. |
| Kimball vs Data Vault? | Business-friendly stars for querying vs insert-only hubs, links and satellites for auditable integration, usually with stars on top. |
| When would you use one big table? | For specific dashboards or ML features where simplicity matters, accepting duplication. |

## Key takeaways

> [!check]
> - Normalise to write; model dimensionally to read.
> - Process, grain, dimensions, facts: in that order; the grain is the most important sentence.
> - Know transaction, periodic and accumulating snapshots, and never sum semi-additive measures over time.
> - Surrogate keys and SCD Type 2 make history correct.
> - Conformed dimensions are what make an enterprise's metrics agree.

## Sources

- Ralph Kimball and Margy Ross, *The Data Warehouse Toolkit: The Definitive Guide to Dimensional Modeling*, 3rd ed. (Wiley, 2013), and the Kimball Group's [dimensional modeling techniques](https://www.kimballgroup.com/data-warehouse-business-intelligence-resources/kimball-techniques/dimensional-modeling-techniques/).
- W. H. Inmon, *Building the Data Warehouse*, 4th ed. (2005).
- Dan Linstedt and Michael Olschimke, *Building a Scalable Data Warehouse with Data Vault 2.0* (2015).
- dbt Labs: [How we structure our dbt projects](https://docs.getdbt.com/best-practices/how-we-structure/1-guide-overview), [Snapshots (SCD Type 2)](https://docs.getdbt.com/docs/build/snapshots).
- Microsoft Learn: [Dimensional modeling in Fabric Data Warehouse](https://learn.microsoft.com/en-us/fabric/data-warehouse/dimensional-modeling-overview).
