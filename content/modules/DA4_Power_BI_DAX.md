# Power BI and DAX — Modelling, Measures, Time Intelligence, Security and Performance

Power BI is named on nearly every data-analyst posting in Egypt, and your gaps file calls one real Power BI dashboard "the single highest-return item" for your analyst CV. Interviews test three layers: **modelling** (star schemas, relationships), **DAX** (measures, filter context, CALCULATE, time intelligence) and **delivery** (row-level security, refresh, performance). This module covers all three, current as of the 2026 updates, and the lab at the end produces the dashboard you're missing.

> [!focus]
> **Entry must:** load and clean data with Power Query; build a star schema with a date table; write basic measures; explain calculated column vs measure; use CALCULATE; build an interactive report; publish and refresh.
> **Mid adds:** filter vs row context and context transition, time intelligence, relationships and filter direction, storage modes (Import, DirectQuery, Direct Lake), row-level security, performance tuning, deployment and governance.
> **Most asked:** *Calculated column vs measure?* · *What does CALCULATE do?* · *Row context vs filter context?* · *What is a star schema and why?* · *How do you do year-over-year?* · *How do you implement row-level security?* · *Import vs DirectQuery?* · *A report is slow. What do you do?*
> **Time budget:** 5 hours, with Power BI Desktop (free) open.

## DA4.0 Foundations: a model, not a sheet 🟢

Excel formulas point at cells. Power BI works differently, and three ideas explain nearly everything in this module:

- **Tables in a model.** Data is loaded into tables stored **column by column**. The VertiPaq engine compresses each column on its own, which is why a model with millions of rows stays fast, and why dropping an unused column often saves more than dropping rows.
- **Relationships carry filters.** Tables are linked by keys. A filter on one side (a slicer on Region) **flows along the relationship** to the many side (the sales rows), so everything downstream sees only the matching rows.
- **Measures have no fixed place.** A measure such as `Total Sales` has no single answer. It's evaluated separately for every cell of every visual, with that cell's filters applied ([[DA4.5]]).

<figure class="dia anim"><svg viewBox="0 0 720 230" role="img" aria-label="Animation: a slicer filters dim_Store to Cairo, the filter flows along the one-to-many relationship to the Cairo rows of fact_Sales, and the Total Sales measure sums only those rows">
<rect class="sW" x="14" y="92" width="120" height="56" rx="8"/><text class="sT" x="74" y="118" text-anchor="middle">slicer</text><text class="sC" x="74" y="134" text-anchor="middle">Region = Cairo</text>
<rect class="sN" x="170" y="34" width="150" height="150" rx="8"/><text class="sT" x="245" y="54" text-anchor="middle">dim_Store</text>
<rect class="sA" x="180" y="64" width="130" height="24" rx="4"/><text class="sC" x="245" y="81" text-anchor="middle">S1 · Cairo</text>
<rect class="sB" x="180" y="92" width="130" height="24" rx="4" opacity=".4"/><text class="sC" x="245" y="109" text-anchor="middle">S2 · Giza</text>
<rect class="sA" x="180" y="120" width="130" height="24" rx="4"/><text class="sC" x="245" y="137" text-anchor="middle">S3 · Cairo</text>
<rect class="sB" x="180" y="148" width="130" height="24" rx="4" opacity=".4"/><text class="sC" x="245" y="165" text-anchor="middle">S4 · Alex</text>
<line class="sLw" x1="134" y1="120" x2="166" y2="120" marker-end="url(#ahw)"/>
<line class="sL" x1="320" y1="110" x2="366" y2="110" marker-end="url(#ah)"/><text class="sM" x="330" y="102" text-anchor="middle">1</text><text class="sM" x="358" y="102" text-anchor="middle">*</text>
<rect class="sN" x="370" y="14" width="170" height="206" rx="8"/><text class="sT" x="455" y="34" text-anchor="middle">fact_Sales</text>
<rect class="sA" x="380" y="44" width="150" height="24" rx="4"/><text class="sC" x="455" y="61" text-anchor="middle">S1 · 300</text>
<rect class="sB" x="380" y="72" width="150" height="24" rx="4" opacity=".4"/><text class="sC" x="455" y="89" text-anchor="middle">S2 · 120</text>
<rect class="sA" x="380" y="100" width="150" height="24" rx="4"/><text class="sC" x="455" y="117" text-anchor="middle">S3 · 500</text>
<rect class="sA" x="380" y="128" width="150" height="24" rx="4"/><text class="sC" x="455" y="145" text-anchor="middle">S1 · 250</text>
<rect class="sB" x="380" y="156" width="150" height="24" rx="4" opacity=".4"/><text class="sC" x="455" y="173" text-anchor="middle">S4 · 80</text>
<rect class="sA" x="380" y="184" width="150" height="24" rx="4"/><text class="sC" x="455" y="201" text-anchor="middle">S3 · 150</text>
<line class="sL" x1="540" y1="117" x2="568" y2="117" marker-end="url(#ah)"/>
<rect class="sV" x="572" y="62" width="134" height="50" rx="8"/><text class="sT" x="639" y="85" text-anchor="middle">Total Sales</text><text class="sC" x="639" y="101" text-anchor="middle">SUM(Amount)</text>
<line class="sLm" x1="639" y1="112" x2="639" y2="132" marker-end="url(#ahm)"/><rect class="sG" x="572" y="134" width="134" height="56" rx="8"/><text class="sT" x="639" y="160" text-anchor="middle">1,200</text><text class="sC" x="639" y="176" text-anchor="middle">Cairo only</text>
<circle class="sPw" r="5"><animateMotion dur="3s" repeatCount="indefinite" path="M134 120 H180"/></circle><circle class="sP" r="5"><animateMotion dur="3s" begin="0.8s" repeatCount="indefinite" path="M310 110 H380"/></circle><circle class="sPv" r="5"><animateMotion dur="3s" begin="1.6s" repeatCount="indefinite" path="M540 117 H572"/></circle>
</svg><figcaption>Filters flow from the "one" side to the "many" side. The measure never mentions Cairo; the model does the filtering.</figcaption></figure>

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

<figure class="dia"><svg viewBox="0 0 720 116" role="img" aria-label="Power BI workflow: get data, Power Query, model, DAX, report in Desktop; publish, refresh and share as an app in the Service">
<rect class="sB" x="8" y="30" width="80" height="40" rx="8"/><text class="sT" x="48" y="55" text-anchor="middle">get data</text>
<line class="sLm" x1="88" y1="50" x2="96" y2="50" marker-end="url(#ahm)"/>
<rect class="sB" x="97" y="30" width="80" height="40" rx="8"/><text class="sT" x="137" y="55" text-anchor="middle">Power Query</text>
<line class="sLm" x1="177" y1="50" x2="185" y2="50" marker-end="url(#ahm)"/>
<rect class="sA" x="186" y="30" width="80" height="40" rx="8"/><text class="sT" x="226" y="55" text-anchor="middle">model</text>
<line class="sLm" x1="266" y1="50" x2="274" y2="50" marker-end="url(#ahm)"/>
<rect class="sA" x="275" y="30" width="80" height="40" rx="8"/><text class="sT" x="315" y="55" text-anchor="middle">DAX</text>
<line class="sLm" x1="355" y1="50" x2="363" y2="50" marker-end="url(#ahm)"/>
<rect class="sV" x="364" y="30" width="80" height="40" rx="8"/><text class="sT" x="404" y="55" text-anchor="middle">report</text>
<line class="sLm" x1="444" y1="50" x2="452" y2="50" marker-end="url(#ahm)"/>
<rect class="sG" x="453" y="30" width="80" height="40" rx="8"/><text class="sT" x="493" y="55" text-anchor="middle">publish</text>
<line class="sLm" x1="533" y1="50" x2="541" y2="50" marker-end="url(#ahm)"/>
<rect class="sG" x="542" y="30" width="80" height="40" rx="8"/><text class="sT" x="582" y="55" text-anchor="middle">refresh</text>
<line class="sLm" x1="622" y1="50" x2="630" y2="50" marker-end="url(#ahm)"/>
<rect class="sG" x="631" y="30" width="80" height="40" rx="8"/><text class="sT" x="671" y="55" text-anchor="middle">app</text>
<path class="sLm" d="M8 80 V88 H350 V80" fill="none"/><text class="sC" x="179" y="104" text-anchor="middle">Power BI Desktop</text>
<path class="sLm" d="M454 80 V88 H703 V80" fill="none"/><text class="sC" x="578" y="104" text-anchor="middle">Power BI Service (Fabric)</text>
</svg><figcaption>Authoring happens in Desktop; sharing, refresh and security happen in the Service.</figcaption></figure>

## DA4.2 Power Query in Power BI 🟢 🟡

It's the same tool as in Excel ([[DA2.6]]). One extra concept matters for performance:

> [!term] Query folding
> Power Query translating your transformation steps into the **source's own query language** (SQL), so the database does the filtering and joining instead of Power BI pulling all rows first. Steps such as filters, removing columns and simple joins usually fold; some custom steps break folding for everything after them. Right-click a step → **View Native Query** to check. Folding also makes **incremental refresh** possible.

Good habits: remove unused columns and rows early, set data types explicitly, give steps and queries meaningful names, and do heavy transformations upstream (in SQL or the warehouse) when you can.

## DA4.3 Modelling: the star schema 🟢 ⭐

> [!term] Star schema
> A model with central **fact tables** (events and measurements: sales lines, transactions, calls; many rows, mostly numbers and keys) surrounded by **dimension tables** (descriptions: date, product, customer, store; fewer rows, many text attributes), joined one-to-many from dimension to fact. Power BI's engine and DAX are designed for this shape.

<figure class="dia"><svg viewBox="0 0 720 240" role="img" aria-label="Star schema: Sales fact table in the centre with Date, Product, Customer and Store dimensions">
<rect class="sA" x="280" y="85" width="160" height="70" rx="10"/><text class="sT" x="360" y="112" text-anchor="middle">fact_Sales</text><text class="sS" x="360" y="130" text-anchor="middle">DateKey, ProductKey,</text><text class="sS" x="360" y="145" text-anchor="middle">CustomerKey, Qty, Amount</text>
<rect class="sB" x="30" y="20" width="170" height="54" rx="8"/><text class="sT" x="115" y="44" text-anchor="middle">dim_Date</text><text class="sS" x="115" y="62" text-anchor="middle">Date, Month, Year, Ramadan?</text>
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

<figure class="dia"><svg viewBox="0 0 720 200" role="img" aria-label="A calculated column adds a stored PriceBand value to every row at refresh; a measure is computed for each cell of a visual from that cell's filters">
<text class="sM" x="176" y="22" text-anchor="middle">calculated column: row by row, at refresh</text>
<rect class="sN" x="40" y="34" width="80" height="24" rx="0"/><text class="sT" x="80" y="51" text-anchor="middle">product</text>
<rect class="sN" x="120" y="34" width="70" height="24" rx="0"/><text class="sT" x="155" y="51" text-anchor="middle">price</text>
<rect class="sN" x="190" y="34" width="110" height="24" rx="0"/><text class="sT" x="245" y="51" text-anchor="middle">PriceBand</text>
<rect class="sB" x="40" y="58" width="80" height="26" rx="0" opacity=".6"/><text class="sC" x="80" y="76" text-anchor="middle">pen</text>
<rect class="sB" x="120" y="58" width="70" height="26" rx="0" opacity=".6"/><text class="sC" x="155" y="76" text-anchor="middle">10</text>
<rect class="sV" x="190" y="58" width="110" height="26" rx="0" opacity=".6"/><text class="sC" x="245" y="76" text-anchor="middle">low</text>
<rect class="sB" x="40" y="84" width="80" height="26" rx="0" opacity=".6"/><text class="sC" x="80" y="102" text-anchor="middle">bag</text>
<rect class="sB" x="120" y="84" width="70" height="26" rx="0" opacity=".6"/><text class="sC" x="155" y="102" text-anchor="middle">250</text>
<rect class="sV" x="190" y="84" width="110" height="26" rx="0" opacity=".6"/><text class="sC" x="245" y="102" text-anchor="middle">high</text>
<rect class="sB" x="40" y="110" width="80" height="26" rx="0" opacity=".6"/><text class="sC" x="80" y="128" text-anchor="middle">book</text>
<rect class="sB" x="120" y="110" width="70" height="26" rx="0" opacity=".6"/><text class="sC" x="155" y="128" text-anchor="middle">80</text>
<rect class="sV" x="190" y="110" width="110" height="26" rx="0" opacity=".6"/><text class="sC" x="245" y="128" text-anchor="middle">mid</text>
<text class="sC" x="176" y="160" text-anchor="middle">stored in the model; you can slice by it</text><text class="sC" x="176" y="178" text-anchor="middle">sees "the current row" (row context)</text>
<line class="sD" x1="360" y1="12" x2="360" y2="196"/>
<text class="sM" x="540" y="22" text-anchor="middle">measure: per visual cell, at query time</text>
<rect class="sN" x="420" y="34" width="80" height="24" rx="0"/><text class="sT" x="460" y="51" text-anchor="middle"></text>
<rect class="sN" x="500" y="34" width="80" height="24" rx="0"/><text class="sT" x="540" y="51" text-anchor="middle">2025</text>
<rect class="sN" x="580" y="34" width="80" height="24" rx="0"/><text class="sT" x="620" y="51" text-anchor="middle">2026</text>
<rect class="sN" x="420" y="58" width="80" height="26" rx="0"/><text class="sC" x="460" y="76" text-anchor="middle">Cairo</text>
<rect class="sG" x="500" y="58" width="80" height="26" rx="0" opacity=".6"/><text class="sC" x="540" y="76" text-anchor="middle">950</text>
<rect class="sG" x="580" y="58" width="80" height="26" rx="0" opacity=".6"/><text class="sC" x="620" y="76" text-anchor="middle">1,200</text>
<rect class="sN" x="420" y="84" width="80" height="26" rx="0"/><text class="sC" x="460" y="102" text-anchor="middle">Giza</text>
<rect class="sG" x="500" y="84" width="80" height="26" rx="0" opacity=".6"/><text class="sC" x="540" y="102" text-anchor="middle">700</text>
<rect class="sG" x="580" y="84" width="80" height="26" rx="0" opacity=".6"/><text class="sC" x="620" y="102" text-anchor="middle">850</text>
<text class="sC" x="540" y="160" text-anchor="middle">Total Sales: one formula, four answers</text><text class="sC" x="540" y="178" text-anchor="middle">nothing stored; uses each cell's filters</text>
</svg><figcaption>Columns describe rows; measures summarise them. If you'd put it on an axis or in a slicer, it's a column. If you'd put it in a value well, it's a measure.</figcaption></figure>

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

<figure class="dia steps" data-start="1"><svg viewBox="0 0 720 200" role="img" aria-label="A matrix of sales by region and year with a channel slicer; each step shows one cell's filter context and how CALCULATE replaces or removes filters">
<rect class="sW" x="14" y="10" width="300" height="26" rx="6" opacity=".6"/><text class="sC" x="164" y="28" text-anchor="middle">slicer: Channel = App</text>
<rect class="sN" x="14" y="46" width="100" height="26" rx="0"/><text class="sT" x="64" y="64" text-anchor="middle">Region</text>
<rect class="sN" x="114" y="46" width="100" height="26" rx="0"/><text class="sT" x="164" y="64" text-anchor="middle">2025</text>
<rect class="sN" x="214" y="46" width="100" height="26" rx="0"/><text class="sT" x="264" y="64" text-anchor="middle">2026</text>
<rect class="sN" x="14" y="72" width="100" height="28" rx="0"/><text class="sT" x="64" y="91" text-anchor="middle">Cairo</text>
<rect class="sN" x="114" y="72" width="100" height="28" rx="0"/><text class="sC" x="164" y="91" text-anchor="middle">950</text>
<rect class="sN" x="214" y="72" width="100" height="28" rx="0"/><text class="sC" x="264" y="91" text-anchor="middle">1,200</text>
<rect class="sN" x="14" y="100" width="100" height="28" rx="0"/><text class="sT" x="64" y="119" text-anchor="middle">Giza</text>
<rect class="sN" x="114" y="100" width="100" height="28" rx="0"/><text class="sC" x="164" y="119" text-anchor="middle">700</text>
<rect class="sN" x="214" y="100" width="100" height="28" rx="0"/><text class="sC" x="264" y="119" text-anchor="middle">850</text>
<rect class="sN" x="14" y="128" width="100" height="28" rx="0"/><text class="sT" x="64" y="147" text-anchor="middle">Alex</text>
<rect class="sN" x="114" y="128" width="100" height="28" rx="0"/><text class="sC" x="164" y="147" text-anchor="middle">600</text>
<rect class="sN" x="214" y="128" width="100" height="28" rx="0"/><text class="sC" x="264" y="147" text-anchor="middle">650</text>
<rect class="sN" x="14" y="156" width="100" height="28" rx="0"/><text class="sT" x="64" y="175" text-anchor="middle">Total</text>
<rect class="sN" x="114" y="156" width="100" height="28" rx="0"/><text class="sT" x="164" y="175" text-anchor="middle">2,250</text>
<rect class="sN" x="214" y="156" width="100" height="28" rx="0"/><text class="sT" x="264" y="175" text-anchor="middle">2,700</text>
<rect class="sN" x="350" y="10" width="356" height="176" rx="10"/>
<g data-s="1-1"><rect class="sA" x="216" y="74" width="96" height="24" rx="3" opacity=".55"/><text class="sT" x="528" y="32" text-anchor="middle">[Total Sales] in this cell</text><text class="sC" x="366" y="60" xml:space="preserve" style="white-space:pre">Channel = "App"   (slicer)</text><text class="sC" x="366" y="82" xml:space="preserve" style="white-space:pre">Region  = "Cairo" (row)</text><text class="sC" x="366" y="104" xml:space="preserve" style="white-space:pre">Year    = 2026    (column)</text><text class="sGt" x="528" y="172" text-anchor="middle">= 1,200</text></g>
<g data-s="2-2"><rect class="sA" x="216" y="102" width="96" height="24" rx="3" opacity=".55"/><text class="sT" x="528" y="32" text-anchor="middle">[Sales Cairo] in the Giza cell</text><text class="sC" x="366" y="60" xml:space="preserve" style="white-space:pre">Channel = "App"</text><text class="sWt" x="366" y="82" xml:space="preserve" style="white-space:pre">Region  = "Giza" → "Cairo"</text><text class="sC" x="366" y="104" xml:space="preserve" style="white-space:pre">Year    = 2026</text><text class="sC" x="366" y="126" xml:space="preserve" style="white-space:pre">CALCULATE replaced the region</text><text class="sWt" x="528" y="172" text-anchor="middle">= 1,200, not 850</text></g>
<g data-s="3-3"><rect class="sA" x="216" y="74" width="96" height="24" rx="3" opacity=".55"/><rect class="sV" x="216" y="158" width="96" height="24" rx="3" opacity=".55"/><text class="sT" x="528" y="32" text-anchor="middle">[% of All Regions] for Cairo</text><text class="sC" x="366" y="60" xml:space="preserve" style="white-space:pre">numerator:   Region = "Cairo"</text><text class="sWt" x="366" y="82" xml:space="preserve" style="white-space:pre">denominator: REMOVEFILTERS(Store)</text><text class="sC" x="366" y="104" xml:space="preserve" style="white-space:pre">             Year = 2026, App</text><text class="sC" x="366" y="126" xml:space="preserve" style="white-space:pre">1,200 ÷ 2,700</text><text class="sGt" x="528" y="172" text-anchor="middle">= 44%</text></g>
<g data-s="4-4"><rect class="sG" x="216" y="158" width="96" height="24" rx="3" opacity=".55"/><text class="sT" x="528" y="32" text-anchor="middle">[Total Sales] in the total row</text><text class="sC" x="366" y="60" xml:space="preserve" style="white-space:pre">Channel = "App"</text><text class="sC" x="366" y="82" xml:space="preserve" style="white-space:pre">Region  = (no filter)</text><text class="sC" x="366" y="104" xml:space="preserve" style="white-space:pre">Year    = 2026</text><text class="sC" x="366" y="126" xml:space="preserve" style="white-space:pre">totals are re-evaluated, not summed</text><text class="sGt" x="528" y="172" text-anchor="middle">= 2,700</text></g>
</svg><ol class="dia-steps">
<li>Every cell is a separate evaluation. The Cairo × 2026 cell runs <code>[Total Sales]</code> with three filters: the slicer, its row and its column.</li>
<li><code>CALCULATE([Total Sales], Store[Region] = "Cairo")</code> <b>replaces</b> the region filter. Evaluated in the Giza row, it still returns Cairo's 1,200.</li>
<li><code>REMOVEFILTERS(dim_Store)</code> in the denominator drops the region filter but keeps the year and the slicer, giving each region's share of 2026.</li>
<li>The total row has no region filter at all, so the measure is evaluated again over everything. Totals in DAX are computed, never added up from the cells above.</li>
</ol><figcaption>Filter context is the whole of DAX in one sentence: which filters apply to this cell, and how does CALCULATE change them?</figcaption></figure>

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

<figure class="dia"><svg viewBox="0 0 720 222" role="img" aria-label="Time intelligence for June 2026: year to date covers January to June 2026, same period last year is June 2025, DATEADD minus one month is May 2026, and the rolling three months are April to June 2026">
<rect class="sN" x="170" y="40" width="26" height="26" rx="3"/><text class="sC" x="183" y="58" text-anchor="middle">J</text>
<rect class="sN" x="199" y="40" width="26" height="26" rx="3"/><text class="sC" x="212" y="58" text-anchor="middle">F</text>
<rect class="sN" x="228" y="40" width="26" height="26" rx="3"/><text class="sC" x="241" y="58" text-anchor="middle">M</text>
<rect class="sN" x="257" y="40" width="26" height="26" rx="3"/><text class="sC" x="270" y="58" text-anchor="middle">A</text>
<rect class="sN" x="286" y="40" width="26" height="26" rx="3"/><text class="sC" x="299" y="58" text-anchor="middle">M</text>
<rect class="sN" x="315" y="40" width="26" height="26" rx="3"/><text class="sC" x="328" y="58" text-anchor="middle">J</text>
<rect class="sN" x="344" y="40" width="26" height="26" rx="3"/><text class="sC" x="357" y="58" text-anchor="middle">J</text>
<rect class="sN" x="373" y="40" width="26" height="26" rx="3"/><text class="sC" x="386" y="58" text-anchor="middle">A</text>
<rect class="sN" x="402" y="40" width="26" height="26" rx="3"/><text class="sC" x="415" y="58" text-anchor="middle">S</text>
<rect class="sN" x="431" y="40" width="26" height="26" rx="3"/><text class="sC" x="444" y="58" text-anchor="middle">O</text>
<rect class="sN" x="460" y="40" width="26" height="26" rx="3"/><text class="sC" x="473" y="58" text-anchor="middle">N</text>
<rect class="sN" x="489" y="40" width="26" height="26" rx="3"/><text class="sC" x="502" y="58" text-anchor="middle">D</text>
<rect class="sN" x="518" y="40" width="26" height="26" rx="3"/><text class="sC" x="531" y="58" text-anchor="middle">J</text>
<rect class="sN" x="547" y="40" width="26" height="26" rx="3"/><text class="sC" x="560" y="58" text-anchor="middle">F</text>
<rect class="sN" x="576" y="40" width="26" height="26" rx="3"/><text class="sC" x="589" y="58" text-anchor="middle">M</text>
<rect class="sN" x="605" y="40" width="26" height="26" rx="3"/><text class="sC" x="618" y="58" text-anchor="middle">A</text>
<rect class="sN" x="634" y="40" width="26" height="26" rx="3"/><text class="sC" x="647" y="58" text-anchor="middle">M</text>
<rect class="sA" x="663" y="40" width="26" height="26" rx="3"/><text class="sC" x="676" y="58" text-anchor="middle">J</text>
<text class="sM" x="344" y="30" text-anchor="middle">2025</text><text class="sM" x="605" y="30" text-anchor="middle">2026</text>
<text class="sC" x="676" y="84" text-anchor="middle">current</text>
<text class="sC" x="160" y="114" text-anchor="end">TOTALYTD</text><rect class="sG" x="518" y="98" width="171" height="22" rx="4"/>
<text class="sC" x="160" y="144" text-anchor="end">SAMEPERIODLASTYEAR</text><rect class="sV" x="315" y="128" width="26" height="22" rx="4"/>
<text class="sC" x="160" y="174" text-anchor="end">DATEADD(-1, MONTH)</text><rect class="sW" x="634" y="158" width="26" height="22" rx="4"/>
<text class="sC" x="160" y="204" text-anchor="end">DATESINPERIOD(-3, MONTH)</text><rect class="sB" x="605" y="188" width="84" height="22" rx="4"/>
</svg><figcaption>Each time-intelligence function swaps the date filter for a different set of dates. All of them need a complete, marked date table.</figcaption></figure>

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

<figure class="dia"><svg viewBox="0 0 720 222" role="img" aria-label="Storage modes: Import copies data into the VertiPaq engine on refresh; DirectQuery sends a query to the source for each visual; Direct Lake reads Delta files from OneLake on demand">
<text class="sT" x="14" y="50">Import</text>
<rect class="sB" x="130" y="20" width="120" height="46" rx="8"/><text class="sT" x="190" y="48" text-anchor="middle">source</text><line class="sLm" x1="250" y1="43" x2="296" y2="43" marker-end="url(#ahm)"/><rect class="sA" x="300" y="20" width="180" height="46" rx="8"/><text class="sT" x="390" y="41" text-anchor="middle">copy into VertiPaq</text><text class="sC" x="390" y="57" text-anchor="middle">scheduled refresh</text>
<line class="sLm" x1="480" y1="43" x2="516" y2="43" marker-end="url(#ahm)"/><rect class="sN" x="520" y="20" width="186" height="46" rx="8"/><text class="sT" x="613" y="40" text-anchor="middle">visuals</text><text class="sC" x="613" y="57" text-anchor="middle">fastest · as of last refresh</text>
<text class="sT" x="14" y="116">DirectQuery</text>
<rect class="sB" x="130" y="86" width="120" height="46" rx="8"/><text class="sT" x="190" y="114" text-anchor="middle">source</text><line class="sLm" x1="250" y1="109" x2="296" y2="109" marker-end="url(#ahm)"/><rect class="sW" x="300" y="86" width="180" height="46" rx="8"/><text class="sT" x="390" y="107" text-anchor="middle">no copy</text><text class="sC" x="390" y="123" text-anchor="middle">a SQL query per visual</text>
<line class="sLm" x1="480" y1="109" x2="516" y2="109" marker-end="url(#ahm)"/><rect class="sN" x="520" y="86" width="186" height="46" rx="8"/><text class="sT" x="613" y="106" text-anchor="middle">visuals</text><text class="sC" x="613" y="123" text-anchor="middle">live · source speed</text>
<text class="sT" x="14" y="182">Direct Lake</text>
<rect class="sB" x="130" y="152" width="120" height="46" rx="8"/><text class="sT" x="190" y="180" text-anchor="middle">source</text><line class="sLm" x1="250" y1="175" x2="296" y2="175" marker-end="url(#ahm)"/><rect class="sG" x="300" y="152" width="180" height="46" rx="8"/><text class="sT" x="390" y="173" text-anchor="middle">Delta files in OneLake</text><text class="sC" x="390" y="189" text-anchor="middle">loaded on demand</text>
<line class="sLm" x1="480" y1="175" x2="516" y2="175" marker-end="url(#ahm)"/><rect class="sN" x="520" y="152" width="186" height="46" rx="8"/><text class="sT" x="613" y="172" text-anchor="middle">visuals</text><text class="sC" x="613" y="189" text-anchor="middle">near real time · Fabric</text>
</svg><figcaption>Where the data sits when a visual asks for it decides speed and freshness.</figcaption></figure>

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

<figure class="dia anim"><svg viewBox="0 0 720 190" role="img" aria-label="Animation: dynamic row-level security looks up the signed-in user in a security table, filters dim_Store to her regions, and the filter flows to the sales fact table">
<rect class="sB" x="14" y="70" width="120" height="50" rx="8"/><text class="sT" x="74" y="93" text-anchor="middle">mona@co.eg</text><text class="sC" x="74" y="109" text-anchor="middle">signs in</text>
<rect class="sN" x="170" y="40" width="170" height="110" rx="8"/><text class="sT" x="255" y="60" text-anchor="middle">Security table</text>
<rect class="sA" x="178" y="70" width="154" height="20" rx="3"/><text class="sC" x="255" y="85" text-anchor="middle">mona@co.eg → Cairo</text>
<rect class="sB" x="178" y="94" width="154" height="20" rx="3" opacity=".4"/><text class="sC" x="255" y="109" text-anchor="middle">ali@co.eg → Giza</text>
<rect class="sA" x="178" y="118" width="154" height="20" rx="3"/><text class="sC" x="255" y="133" text-anchor="middle">mona@co.eg → Alex</text>
<line class="sL" x1="134" y1="95" x2="166" y2="95" marker-end="url(#ah)"/>
<line class="sL" x1="340" y1="95" x2="386" y2="95" marker-end="url(#ah)"/><rect class="sV" x="390" y="70" width="140" height="50" rx="8"/><text class="sT" x="460" y="93" text-anchor="middle">dim_Store</text><text class="sC" x="460" y="109" text-anchor="middle">Cairo, Alex only</text>
<line class="sL" x1="530" y1="95" x2="566" y2="95" marker-end="url(#ah)"/><rect class="sG" x="570" y="70" width="136" height="50" rx="8"/><text class="sT" x="638" y="93" text-anchor="middle">fact_Sales</text><text class="sC" x="638" y="109" text-anchor="middle">her rows only</text>
<text class="sS" x="360" y="176" text-anchor="middle">one role, one DAX rule: dim_Store[Region] IN the regions mapped to USERPRINCIPALNAME()</text>
<circle class="sP" r="5"><animateMotion dur="3.5s" repeatCount="indefinite" path="M134 95 H570"/></circle>
</svg><figcaption>Dynamic RLS is the BI version of tenant isolation: the user's identity becomes a filter at the top of the relationship chain.</figcaption></figure>

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
