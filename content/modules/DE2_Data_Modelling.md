# Data Modelling — Dimensional Models, Grain, Facts, Dimensions and Slowly Changing History

"Model this business for analytics" is the central design question in data-engineering and analytics-engineering interviews. A good model makes every dashboard and query simpler, faster and consistent; a bad one makes every number an argument. This module covers **Kimball dimensional modelling** (still the industry's common language), the decisions that matter most (grain, fact types, additivity, surrogate keys, slowly changing dimensions), the main alternatives (Data Vault, wide tables), and a full worked example. It builds on normalisation in [[B6.1]] and is the model Power BI expects ([[DA4.3]]).

> [!focus]
> **Entry must:** explain facts vs dimensions and star vs snowflake schemas; declare the grain of a fact table; use surrogate keys; explain SCD Type 1 vs Type 2; model a simple business process.
> **Mid adds:** the four-step design process, transaction, periodic-snapshot and accumulating-snapshot facts, additive vs semi-additive measures, conformed dimensions and the bus matrix, role-playing and degenerate dimensions, Data Vault and one-big-table trade-offs.
> **Most asked:** *What's the difference between a fact and a dimension?* · *What is grain?* · *Star vs snowflake?* · *Explain SCD Type 2* · *Why surrogate keys?* · *How would you model an e-commerce or delivery business?* · *Kimball vs Data Vault vs Inmon?*
> **Time budget:** 3.5 hours.

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

### Additivity ⭐

| Measure type | Can be summed across… | Examples |
|---|---|---|
| **Additive** | All dimensions | Sales amount, quantity, number of calls |
| **Semi-additive** | Some dimensions, **not time** | **Balances**, inventory levels, subscriber counts (sum across accounts, but average or take the last value across days) |
| **Non-additive** | None | Ratios and percentages (margin %, conversion rate): store numerator and denominator and compute the ratio in the BI layer |

> [!mistake] Summing balances over time
> Adding up thirty daily account balances gives a meaningless number thirty times too large. Semi-additive measures need `AVERAGE` or "closing balance" (`LASTNONBLANK` in DAX) across time.

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

> [!say]
> "Type 1 overwrites the attribute, so history shows the current value; Type 2 adds a new row with a new surrogate key and validity dates, so each fact stays linked to the version that was true at the time. I'd use Type 2 for attributes like customer region or segment that analysts slice history by, and Type 1 for corrections."

## DE2.6 Alternatives to dimensional modelling 🟡

| Approach | Idea | Strengths | Costs |
|---|---|---|---|
| **Data Vault 2.0** | **Hubs** (business keys), **links** (relationships), **satellites** (descriptive attributes with history), all insert-only | Auditable, handles many changing sources, parallel loading, easy to add sources | Many tables and joins; needs a dimensional presentation layer on top for BI |
| **One Big Table (OBT)** / wide denormalised tables | Pre-join facts and dimension attributes into one wide table per use case | Very simple for BI tools and ad-hoc queries; columnar engines handle wide tables well | Duplication, harder to keep consistent, mixed grains risk; SCD history is awkward |
| **Normalised integration layer** (Inmon) | A 3NF enterprise model, then marts | Single integrated truth | Slow to build; still needs marts |

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
