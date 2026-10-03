# Power BI and DAX — Modelling, Measures, Time Intelligence, Security and Performance

Power BI is named on nearly every data-analyst posting in Egypt, and your gaps file calls one real Power BI dashboard "the single highest-return item" for your analyst CV. Interviews test three layers: **modelling** (star schemas, relationships), **DAX** (measures, filter context, CALCULATE, time intelligence) and **delivery** (row-level security, refresh, performance). This module covers all three, current as of the 2026 updates, and the lab at the end produces the dashboard you're missing.

> [!focus]
> **Entry must:** load and clean data with Power Query; build a star schema with a date table; write basic measures; explain calculated column vs measure; use CALCULATE; build an interactive report; publish and refresh.
> **Mid adds:** filter vs row context and context transition, time intelligence, relationships and filter direction, storage modes (Import, DirectQuery, Direct Lake), row-level security, performance tuning, deployment and governance.
> **Most asked:** *Calculated column vs measure?* · *What does CALCULATE do?* · *Row context vs filter context?* · *What is a star schema and why?* · *How do you do year-over-year?* · *How do you implement row-level security?* · *Import vs DirectQuery?* · *A report is slow. What do you do?*
> **Time budget:** 5 hours, with Power BI Desktop (free) open.

## DA4.1 The Power BI landscape 🟢

| Piece | What it is |
|---|---|
| **Power BI Desktop** | The free Windows authoring tool: Power Query, the model, DAX, report pages |
| **Power BI Service** (app.powerbi.com) | The cloud: workspaces, sharing, apps, scheduled refresh, dashboards, now part of **Microsoft Fabric** |
| **Semantic model** | The model (tables, relationships, measures) a report sits on; called a **dataset** before 2023 |
| **Report** | Interactive pages of visuals on one semantic model |
| **Dashboard** | A single canvas of tiles **pinned** from one or more reports, in the Service |
| **On-premises data gateway** | Lets the Service refresh data from servers inside a company network |
| **Licences** | Free (personal), **Pro** (share and collaborate), Premium Per User, and Fabric capacity for organisation-wide distribution |

**The workflow:** Get data → clean in **Power Query** → **model** (relationships, date table) → **DAX** measures → visuals → publish to a workspace → schedule refresh → share via an **app**.

## DA4.2 Power Query in Power BI 🟢 🟡

It's the same tool as in Excel ([[DA2.6]]). One extra concept matters for performance:

> [!term] Query folding
> Power Query translating your transformation steps into the **source's own query language** (SQL), so the database does the filtering and joining instead of Power BI pulling all rows first. Steps such as filters, removing columns and simple joins usually fold; some custom steps break folding for everything after them. Right-click a step → **View Native Query** to check. Folding also makes **incremental refresh** possible.

Good habits: remove unused columns and rows early, set data types explicitly, give steps and queries meaningful names, and do heavy transformations upstream (in SQL or the warehouse) when you can.

## DA4.3 Modelling: the star schema 🟢 ⭐

> [!term] Star schema
> A model with central **fact tables** (events and measurements: sales lines, transactions, calls; many rows, mostly numbers and keys) surrounded by **dimension tables** (descriptions: date, product, customer, store; fewer rows, many text attributes), joined one-to-many from dimension to fact. Power BI's engine and DAX are designed for this shape.

<figure class="dia"><svg viewBox="0 0 720 240" role="img" aria-label="Star schema: Sales fact table in the centre with Date, Product, Customer and Store dimensions">
<rect class="sA" x="290" y="85" width="140" height="70" rx="10"/><text class="sT" x="360" y="112" text-anchor="middle">fact_Sales</text><text class="sS" x="360" y="130" text-anchor="middle">DateKey, ProductKey,</text><text class="sS" x="360" y="145" text-anchor="middle">CustomerKey, Qty, Amount</text>
<rect class="sB" x="40" y="20" width="150" height="54" rx="8"/><text class="sT" x="115" y="44" text-anchor="middle">dim_Date</text><text class="sS" x="115" y="62" text-anchor="middle">Date, Month, Year, Ramadan?</text>
<rect class="sB" x="530" y="20" width="150" height="54" rx="8"/><text class="sT" x="605" y="44" text-anchor="middle">dim_Product</text><text class="sS" x="605" y="62" text-anchor="middle">Name, Category, Brand</text>
<rect class="sB" x="40" y="166" width="150" height="54" rx="8"/><text class="sT" x="115" y="190" text-anchor="middle">dim_Customer</text><text class="sS" x="115" y="208" text-anchor="middle">Segment, City, Channel</text>
<rect class="sB" x="530" y="166" width="150" height="54" rx="8"/><text class="sT" x="605" y="190" text-anchor="middle">dim_Store</text><text class="sS" x="605" y="208" text-anchor="middle">Region, Governorate</text>
<line class="sL" x1="190" y1="50" x2="290" y2="100"/><line class="sL" x1="530" y1="50" x2="430" y2="100"/><line class="sL" x1="190" y1="190" x2="290" y2="140"/><line class="sL" x1="530" y1="190" x2="430" y2="140"/>
<text class="sM" x="200" y="88">1</text><text class="sM" x="275" y="104">*</text>
</svg><figcaption>One-to-many relationships from each dimension (1) to the fact table (*), filtering in one direction: dimension to fact.</figcaption></figure>

**Why star schemas:** simpler, predictable DAX; filters flow cleanly from dimensions to facts; better compression and speed; easier for report users to understand. A single flat table works for a demo, but creates problems as soon as you add a second fact table (budget vs actuals).

**Relationships:**

- **Cardinality:** one-to-many (dimension to fact) is the norm; avoid many-to-many unless you understand it.
- **Cross-filter direction:** **single** (dimension filters fact) by default. **Both** (bidirectional) can cause ambiguous paths, unexpected results and slow queries; use it sparingly, or use `CROSSFILTER` inside a specific measure.
- **One active relationship** between two tables; others are **inactive** and can be activated in a measure with `USERELATIONSHIP` (an order date and a ship date both relating to `dim_Date`, called a **role-playing dimension**).

**The date table** (essential for time intelligence): one row per day with **no gaps**, covering the whole data range, marked with **Mark as date table**, related to each fact's date. Add month, quarter, year, week, weekday, fiscal periods, and for Egypt, public holidays and a Ramadan flag.

```dax
Date =
ADDCOLUMNS (
    CALENDAR ( DATE ( 2023, 1, 1 ), DATE ( 2026, 12, 31 ) ),
    "Year", YEAR ( [Date] ),
    "Month", FORMAT ( [Date], "MMM yyyy" ),
    "MonthNumber", YEAR ( [Date] ) * 100 + MONTH ( [Date] ),   -- for sorting
    "Weekday", FORMAT ( [Date], "ddd" )
)
```

## DA4.4 Calculated columns vs measures 🟢 ⭐

| | Calculated column | **Measure** |
|---|---|---|
| Computed | At **refresh**, once per row, stored in the model | At **query time**, in the current filter context |
| Context | **Row context** (sees the current row) | **Filter context** (slicers, visual rows and columns, filters) |
| Memory | Uses memory like any column | None until used |
| Use for | Values you need to **slice or filter by**: an age band, a category grouping | **Aggregations** shown in visuals: total sales, margin %, YoY growth |

> [!say]
> "A calculated column is computed row by row at refresh and stored, so I use it for attributes I want to slice by, like a price band. A measure is computed at query time in whatever filter context the visual creates, so totals, ratios and time comparisons are measures. Ratios in particular must be measures: an average of row-level margins isn't the margin of the total."

## DA4.5 DAX: filter context and CALCULATE 🟢 🟡 ⭐

> [!term] Filter context
> The set of filters active when a measure is evaluated: from slicers, the page and report filters, and the row and column headers of the visual cell being computed. The same measure returns different numbers in each cell because each cell has a different filter context.

> [!term] Row context
> "The current row", which exists in calculated columns and inside **iterator** functions (`SUMX`, `AVERAGEX`, `FILTER`, `RANKX`). Row context does **not** filter anything by itself.

```dax
Total Sales := SUM ( fact_Sales[Amount] )

Total Cost := SUMX ( fact_Sales, fact_Sales[Qty] * RELATED ( dim_Product[UnitCost] ) )   -- iterator: row by row

Margin % := DIVIDE ( [Total Sales] - [Total Cost], [Total Sales] )                         -- DIVIDE handles divide-by-zero

Sales Cairo := CALCULATE ( [Total Sales], dim_Store[Governorate] = "Cairo" )               -- override one filter

% of All Regions :=
DIVIDE ( [Total Sales], CALCULATE ( [Total Sales], REMOVEFILTERS ( dim_Store ) ) )         -- remove the store filter

Big Orders Sales :=
CALCULATE ( [Total Sales], FILTER ( fact_Sales, fact_Sales[Amount] > 5000 ) )             -- a table filter
```

> [!term] CALCULATE
> The most important DAX function: it evaluates an expression in a **modified filter context**. Its filter arguments can add filters, replace existing filters on the same columns, or remove them (`REMOVEFILTERS`, `ALL`, `ALLEXCEPT`). When CALCULATE runs inside a row context (in a calculated column or an iterator), it performs **context transition**: the current row becomes an equivalent filter context. Every measure reference is implicitly wrapped in CALCULATE.

> [!say]
> "Every visual cell evaluates a measure in its own filter context, from slicers and row and column headers. CALCULATE changes that context, adding, overriding or removing filters, so I can compute 'sales in Cairo' or 'sales for all regions' as a denominator for a percentage. Inside an iterator, CALCULATE also turns the current row into a filter, which is context transition."

**Good DAX habits:** use **variables** (`VAR … RETURN`) for readability and to avoid computing twice; `DIVIDE` instead of `/`; measures in a dedicated measures table, formatted and described; filter arguments on **columns** rather than `FILTER` over whole tables when possible (faster).

```dax
YoY % :=
VAR Curr = [Total Sales]
VAR Prev = CALCULATE ( [Total Sales], SAMEPERIODLASTYEAR ( 'Date'[Date] ) )
RETURN DIVIDE ( Curr - Prev, Prev )
```

## DA4.6 Time intelligence 🟢 ⭐

These need a proper, marked date table.

```dax
Sales YTD        := TOTALYTD ( [Total Sales], 'Date'[Date] )
Sales LY         := CALCULATE ( [Total Sales], SAMEPERIODLASTYEAR ( 'Date'[Date] ) )
Sales PM         := CALCULATE ( [Total Sales], DATEADD ( 'Date'[Date], -1, MONTH ) )
Sales Rolling 3M :=
CALCULATE ( [Total Sales], DATESINPERIOD ( 'Date'[Date], MAX ( 'Date'[Date] ), -3, MONTH ) )
Sales by Ship Date :=
CALCULATE ( [Total Sales], USERELATIONSHIP ( fact_Sales[ShipDateKey], 'Date'[DateKey] ) )
```

For fiscal years, `TOTALYTD` takes a year-end argument (`"06-30"` for a July–June year).

## DA4.7 Common analyst measures 🟡 ⭐

```dax
Customers         := DISTINCTCOUNT ( fact_Sales[CustomerKey] )
Avg Order Value   := DIVIDE ( [Total Sales], DISTINCTCOUNT ( fact_Sales[OrderId] ) )
Running Total     :=
CALCULATE ( [Total Sales], FILTER ( ALL ( 'Date'[Date] ), 'Date'[Date] <= MAX ( 'Date'[Date] ) ) )
Product Rank      := RANKX ( ALL ( dim_Product[Name] ), [Total Sales], , DESC, DENSE )
New Customers     :=
VAR CurrentStart = MIN ( 'Date'[Date] )
RETURN COUNTROWS (
    FILTER ( VALUES ( fact_Sales[CustomerKey] ),
             CALCULATE ( MIN ( fact_Sales[OrderDate] ), ALL ( 'Date' ) ) >= CurrentStart ) )
```

**Newer tools (2026):**

- **Visual calculations** (generally available in 2026) are DAX written **on a visual** that can refer to the visual's own rows and columns: running sums, moving averages, "versus previous" and % of parent with simple functions like `RUNNINGSUM` and `PREVIOUS`, without fighting filter context.
- **DAX user-defined functions** (generally available in 2026) let you define a calculation once with typed parameters and reuse it across measures, columns and visual calculations, stored as TMDL in Git.

## DA4.8 Storage modes 🟡 ⭐

| Mode | Data lives | Speed | Freshness | Limits |
|---|---|---|---|---|
| **Import** | Compressed in the model (the **VertiPaq** columnar engine) | **Fastest** | As of the last refresh (scheduled up to 8×/day on Pro, more on Premium/Fabric) | Model size limits; refresh time |
| **DirectQuery** | Stays in the source; every visual sends queries | Depends on the source | **Live** | Slower; some DAX and Power Query features limited; load on the source |
| **Dual** | Both, chosen per query | — | — | Used for dimensions in composite models |
| **Direct Lake** (Fabric) | Delta/Parquet files in OneLake, loaded on demand | Close to Import | Near real time, no import refresh | Requires Fabric |
| **Composite model** | Mixes modes in one model | — | — | Big historical facts in Import, today's data in DirectQuery |

> [!say]
> "Import is the default because the VertiPaq engine is very fast; the trade-off is that data is only as fresh as the last refresh. DirectQuery keeps data in the source for live numbers or huge volumes, at the cost of speed and load on the source. In Fabric, Direct Lake reads Delta tables directly with near-Import speed. Composite models combine them."

## DA4.9 Row-level security 🟡 ⭐

> [!term] Row-level security (RLS)
> Rules that restrict which **rows** a user sees in a semantic model, defined as DAX filters on **roles**. Static RLS: a role per group (a "Cairo" role filtering `Region = "Cairo"`). **Dynamic RLS:** one role whose filter uses the signed-in user's identity, through a security mapping table.

```dax
-- Role "Regional Managers", filter on dim_Store:
dim_Store[Region] IN
    CALCULATETABLE ( VALUES ( Security[Region] ), Security[UserEmail] = USERPRINCIPALNAME () )
```

Test it in Desktop with **View as role**, assign users or groups to roles in the Service, and remember that RLS applies to people with **Viewer** permission. Workspace admins, members and contributors see everything. **Object-level security** (OLS) hides whole tables or columns, such as salaries.

> [!story]
> This is the BI version of FinSight's **multi-tenancy**: one model, and each company or manager sees only their rows. Saying "it's the same problem as tenant isolation in my .NET API, solved with dynamic RLS and a security table" shows real understanding.

## DA4.10 Performance 🟡 ⭐

"A report is slow." In order:

1. **Performance Analyzer** (View tab) shows each visual's time split into DAX query, visual rendering and other; copy the query into **DAX Studio** for detail.
2. **Model size and shape:** remove unused columns (especially high-cardinality ones like GUIDs and timestamps with seconds); split date-time into a date and a time; use integers for keys; prefer a star schema; avoid many bidirectional relationships.
3. **DAX:** variables, column filters instead of `FILTER(table)`, avoid iterating huge tables with complex logic, avoid calculated columns that could be computed upstream.
4. **Report:** fewer visuals per page (each is a query), avoid huge tables with thousands of rows, limit slicers with many values.
5. **Data:** incremental refresh for large facts; aggregations; push heavy transformations upstream; check query folding.

## DA4.11 Report design and interactivity 🟢

Design principles are in [[DA5]]. Power BI features worth knowing: **slicers** (sync across pages), **drill-down** hierarchies, **drill-through** pages (right-click a customer → customer detail page), **report-page tooltips**, **bookmarks** and buttons for guided stories, **field parameters** (let users switch the measure or dimension on a chart), **conditional formatting** by rules or measures, **small multiples**, **Q&A** and **Copilot** (generate pages or summaries from prompts; check everything it produces).

## DA4.12 Publishing, refresh and governance 🟡

- **Workspaces** per team or project, with roles (Admin, Member, Contributor, Viewer); distribute to consumers through an **app**, not by adding everyone to the workspace.
- **Scheduled refresh** (with a gateway for on-premises sources) and refresh-failure alerts to the owner.
- **Deployment pipelines** (Dev → Test → Prod) and **Git integration** using the **PBIP** project format. In 2026, the text-based **PBIR** report format became the default for new reports, which makes report changes reviewable in pull requests, alongside **TMDL** for the model.
- **Endorsement** (Promoted, Certified) so users know which semantic model is the trusted one; **sensitivity labels** for confidential data.

## DA4.13 Power BI, Tableau and others 🟢

| | Power BI | Tableau | Looker Studio |
|---|---|---|---|
| Strength | Modelling + DAX, Microsoft 365 and Fabric integration, price | Visual exploration and design flexibility | Free, quick dashboards on Google data |
| Calculation language | DAX (+ Power Query M) | Calculated fields, LOD expressions | Simple calculated fields |
| Common in Egypt | **Most postings** | Some multinationals and consultancies | Marketing teams |

The modelling and analytics thinking transfer; the syntax is learnable in days.

**Certifications:** **PL-300 (Power BI Data Analyst Associate)** is active and the standard credential; **DP-600 (Fabric Analytics Engineer)** is the step after it ([[00]]).

> [!lab] Build the dashboard your CV is missing (from your gaps file)
> With the Superstore data on `E:\Big data` (or Olist): Power Query cleaning with folding where possible; a star schema with `dim_Date` (holidays and a Ramadan flag), `dim_Product`, `dim_Customer`, `dim_Region` and `fact_Sales`; measures for Sales, Margin %, AOV, YoY %, YTD, Rolling 3M, Rank and New Customers; one visual calculation; dynamic RLS by region with a security table; a two-page report (executive overview and a drill-through detail page) following [[DA5]]. Publish to the Service (or record a walkthrough GIF), save as PBIP in a public repository, and write three findings in the README. This single project turns the weakest of your eight CVs into a competitive one.

## DA4.14 Interview drill 🟢 ⭐

| Question | Strong short answer |
|---|---|
| Report vs dashboard? | A report is interactive pages on one semantic model; a dashboard is a single canvas of pinned tiles in the Service. |
| Calculated column vs measure? | Columns are computed per row at refresh and stored (for slicing); measures are computed at query time in the filter context (for aggregations). |
| What does CALCULATE do? | Evaluates an expression in a modified filter context, adding, replacing or removing filters, with context transition inside row context. |
| Row context vs filter context? | Row context is the current row (columns, iterators); filter context is the set of active filters from slicers and visuals. |
| What's context transition? | CALCULATE turning the current row context into an equivalent filter context. |
| Why a star schema? | Simpler DAX, clean filter propagation, better compression and performance, easier for users. |
| Why a date table? | Time intelligence needs a continuous, marked date table related to the facts. |
| How do you compute YoY growth? | CALCULATE with SAMEPERIODLASTYEAR for last year's value, then DIVIDE the difference. |
| SUM vs SUMX? | SUM aggregates a column; SUMX iterates rows evaluating an expression, e.g. qty × price. |
| Import vs DirectQuery vs Direct Lake? | Imported compressed data (fastest) vs live queries to the source vs Fabric reading Delta files directly with near-Import speed. |
| How do you implement RLS? | DAX filters on roles; dynamic RLS with USERPRINCIPALNAME and a security mapping table; test with View as role. |
| Why avoid bidirectional relationships? | Ambiguous filter paths, unexpected results and slower queries. |
| What's query folding? | Power Query pushing transformation steps to the source as native queries. |
| A report is slow: steps? | Performance Analyzer and DAX Studio, trim model columns and cardinality, improve DAX, reduce visuals, incremental refresh. |
| What are visual calculations? | DAX defined on a visual, referring to its own rows and columns, for running sums and comparisons. |

## Key takeaways

> [!check]
> - Star schema plus a marked date table: the foundation of every good model.
> - Measures for aggregations, columns for slicing; ratios are always measures.
> - CALCULATE modifies filter context; that single idea explains most of DAX.
> - Import for speed, DirectQuery for live data, Direct Lake in Fabric; RLS for per-user data.
> - Build and publish one real dashboard; it's the highest-value item for your analyst CV.

## Sources

- Microsoft Learn: [Understand star schema and the importance for Power BI](https://learn.microsoft.com/en-us/power-bi/guidance/star-schema), [Model relationships](https://learn.microsoft.com/en-us/power-bi/transform-model/desktop-relationships-understand), [Create date tables](https://learn.microsoft.com/en-us/power-bi/guidance/model-date-tables), [DAX overview](https://learn.microsoft.com/en-us/dax/dax-overview), [CALCULATE](https://learn.microsoft.com/en-us/dax/calculate-function-dax), [Time intelligence functions](https://learn.microsoft.com/en-us/dax/time-intelligence-functions-dax), [Visual calculations](https://learn.microsoft.com/en-us/power-bi/transform-model/desktop-visual-calculations-overview), [Storage mode](https://learn.microsoft.com/en-us/power-bi/transform-model/desktop-storage-mode), [Direct Lake](https://learn.microsoft.com/en-us/fabric/fundamentals/direct-lake-overview), [Row-level security](https://learn.microsoft.com/en-us/fabric/security/service-admin-row-level-security), [Query folding](https://learn.microsoft.com/en-us/power-query/query-folding-basics), [Performance Analyzer](https://learn.microsoft.com/en-us/power-bi/create-reports/desktop-performance-analyzer), [Power BI Desktop projects (PBIP)](https://learn.microsoft.com/en-us/power-bi/developer/projects/projects-overview), [PL-300 certification](https://learn.microsoft.com/en-us/credentials/certifications/data-analyst-associate/).
- Microsoft Fabric Community blog: [DAX user-defined functions (generally available)](https://community.fabric.microsoft.com/t5/Power-BI-Updates-Blog/DAX-User-Defined-Functions-Generally-Available/ba-p/5185738), [Power BI June 2026 feature summary](https://community.fabric.microsoft.com/blog/fbc_pbiupdatesblog/power-bi-june-2026-feature-summary/5193264).
- Marco Russo and Alberto Ferrari, *The Definitive Guide to DAX*, 2nd ed. (2019), and [SQLBI.com](https://www.sqlbi.com/); [DAX Studio](https://daxstudio.org/).
- Ralph Kimball and Margy Ross, *The Data Warehouse Toolkit*, 3rd ed. (2013), on star schemas.
