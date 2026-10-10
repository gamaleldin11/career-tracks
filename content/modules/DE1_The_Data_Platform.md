# The Data Platform — OLTP vs OLAP, Warehouses, Lakes, Lakehouses and the Modern Stack

Data engineers build and run the systems that move data from where it's created (apps, devices, partners) to where it's used (dashboards, models, reports), reliably and on time. Interviews open with the big picture, "describe a modern data platform", "ETL or ELT?", "what's a lakehouse?", before going deep on SQL, modelling, Spark and orchestration. You come at this from software engineering: FinSight's CSV ingestion, transaction categoriser and daily aggregation layer were a small data pipeline, and you studied the Hadoop ecosystem through Huawei's HCIA Big Data material. This module connects both to the platform vocabulary interviewers expect.

> [!focus]
> **Entry must:** explain OLTP vs OLAP; describe warehouse, lake and lakehouse; explain ETL vs ELT and batch vs streaming; draw a simple platform with ingestion, storage, transformation, orchestration and serving; describe what makes a pipeline reliable.
> **Mid adds:** the medallion architecture, columnar storage and table formats, change data capture, the main tools in each layer and their trade-offs, data contracts and freshness SLAs, cost awareness.
> **Most asked:** *What does a data engineer do?* · *OLTP vs OLAP?* · *Data warehouse vs data lake vs lakehouse?* · *ETL vs ELT?* · *Batch vs streaming?* · *What makes a pipeline idempotent?* · *Walk me through a platform you'd build.*
> **Time budget:** 3 hours.

## DE1.0 Foundations: where data lives and how it moves 🟢

The data an analyst needs is born in **operational systems**: the app's database recording orders, a payment gateway's webhooks, events from the mobile app, files from partners. Those systems are built to run the business, fast, one record at a time. You can't run year-long analytical queries on them without slowing the app, and they usually keep only the **current** state, not history.

So data engineering builds a **second home** for the data, designed for analysis, and the pipelines that keep it filled:

<figure class="dia anim"><svg viewBox="0 0 720 228" role="img" aria-label="Animation: data flows from sources such as the app database, webhooks, events and partner files, through batch, CDC or streaming ingestion, into a lake, through cleaning and modelling layers, to dashboards, ML features and APIs">
<text class="sM" x="72" y="22" text-anchor="middle">sources</text>
<rect class="sB" x="10" y="34" width="124" height="32" rx="6"/><text class="sC" x="72" y="55" text-anchor="middle">app database</text>
<rect class="sB" x="10" y="74" width="124" height="32" rx="6"/><text class="sC" x="72" y="95" text-anchor="middle">payment webhooks</text>
<rect class="sB" x="10" y="114" width="124" height="32" rx="6"/><text class="sC" x="72" y="135" text-anchor="middle">app events</text>
<rect class="sB" x="10" y="154" width="124" height="32" rx="6"/><text class="sC" x="72" y="175" text-anchor="middle">partner CSVs</text>
<line class="sLm" x1="134" y1="114" x2="150" y2="114" marker-end="url(#ahm)"/>
<text class="sM" x="214" y="22" text-anchor="middle">ingest</text>
<rect class="sV" x="152" y="34" width="124" height="45.3333" rx="6"/><text class="sC" x="214" y="61.6667" text-anchor="middle">batch extract</text>
<rect class="sV" x="152" y="87.3333" width="124" height="45.3333" rx="6"/><text class="sC" x="214" y="115" text-anchor="middle">CDC</text>
<rect class="sV" x="152" y="140.667" width="124" height="45.3333" rx="6"/><text class="sC" x="214" y="168.333" text-anchor="middle">stream</text>
<line class="sLm" x1="276" y1="114" x2="292" y2="114" marker-end="url(#ahm)"/>
<text class="sM" x="356" y="22" text-anchor="middle">store</text>
<rect class="sW" x="294" y="34" width="124" height="72" rx="6"/><text class="sC" x="356" y="75" text-anchor="middle">data lake</text>
<rect class="sW" x="294" y="114" width="124" height="72" rx="6"/><text class="sC" x="356" y="155" text-anchor="middle">(bronze: raw)</text>
<line class="sLm" x1="418" y1="114" x2="434" y2="114" marker-end="url(#ahm)"/>
<text class="sM" x="498" y="22" text-anchor="middle">transform</text>
<rect class="sA" x="436" y="34" width="124" height="72" rx="6"/><text class="sC" x="498" y="75" text-anchor="middle">silver: clean</text>
<rect class="sA" x="436" y="114" width="124" height="72" rx="6"/><text class="sC" x="498" y="155" text-anchor="middle">gold: modelled</text>
<line class="sLm" x1="560" y1="114" x2="576" y2="114" marker-end="url(#ahm)"/>
<text class="sM" x="640" y="22" text-anchor="middle">serve</text>
<rect class="sG" x="578" y="34" width="124" height="45.3333" rx="6"/><text class="sC" x="640" y="61.6667" text-anchor="middle">dashboards</text>
<rect class="sG" x="578" y="87.3333" width="124" height="45.3333" rx="6"/><text class="sC" x="640" y="115" text-anchor="middle">ML features</text>
<rect class="sG" x="578" y="140.667" width="124" height="45.3333" rx="6"/><text class="sC" x="640" y="168.333" text-anchor="middle">APIs</text>
<circle class="sP" r="5"><animateMotion dur="5s" begin="0.0s" repeatCount="indefinite" path="M72 114 H650"/></circle>
<circle class="sPg" r="5"><animateMotion dur="5s" begin="1.6s" repeatCount="indefinite" path="M72 114 H650"/></circle>
<circle class="sPw" r="5"><animateMotion dur="5s" begin="3.2s" repeatCount="indefinite" path="M72 114 H650"/></circle>
<text class="sS" x="360" y="216" text-anchor="middle">operational systems stay fast; analysis runs on a copy designed for it</text>
</svg><figcaption>The shape of every data platform: ingest, store, transform, serve. The tools change; the stages don't.</figcaption></figure>

The second home is shaped differently on disk. Analytical queries read a few columns across millions of rows, so analytical engines store data **by column** rather than by row:

<figure class="dia"><svg viewBox="0 0 720 208" role="img" aria-label="Row storage keeps each row's values together; column storage keeps each column together, so an aggregation over city and amount reads only those two columns">
<text class="sM" x="14" y="24">row store (OLTP): one row's values together</text>
<rect class="sB" x="14" y="34" width="40" height="30" rx="3" opacity=".85"/><text class="sC" x="34" y="54" text-anchor="middle">i1</text>
<rect class="sV" x="57" y="34" width="40" height="30" rx="3" opacity=".85"/><text class="sC" x="77" y="54" text-anchor="middle">d1</text>
<rect class="sW" x="100" y="34" width="40" height="30" rx="3" opacity=".85"/><text class="sC" x="120" y="54" text-anchor="middle">c1</text>
<rect class="sG" x="143" y="34" width="40" height="30" rx="3" opacity=".85"/><text class="sC" x="163" y="54" text-anchor="middle">a1</text>
<rect class="sB" x="186" y="34" width="40" height="30" rx="3" opacity=".85"/><text class="sC" x="206" y="54" text-anchor="middle">i2</text>
<rect class="sV" x="229" y="34" width="40" height="30" rx="3" opacity=".85"/><text class="sC" x="249" y="54" text-anchor="middle">d2</text>
<rect class="sW" x="272" y="34" width="40" height="30" rx="3" opacity=".85"/><text class="sC" x="292" y="54" text-anchor="middle">c2</text>
<rect class="sG" x="315" y="34" width="40" height="30" rx="3" opacity=".85"/><text class="sC" x="335" y="54" text-anchor="middle">a2</text>
<rect class="sB" x="358" y="34" width="40" height="30" rx="3" opacity=".85"/><text class="sC" x="378" y="54" text-anchor="middle">i3</text>
<rect class="sV" x="401" y="34" width="40" height="30" rx="3" opacity=".85"/><text class="sC" x="421" y="54" text-anchor="middle">d3</text>
<rect class="sW" x="444" y="34" width="40" height="30" rx="3" opacity=".85"/><text class="sC" x="464" y="54" text-anchor="middle">c3</text>
<rect class="sG" x="487" y="34" width="40" height="30" rx="3" opacity=".85"/><text class="sC" x="507" y="54" text-anchor="middle">a3</text>
<rect class="sB" x="530" y="34" width="40" height="30" rx="3" opacity=".85"/><text class="sC" x="550" y="54" text-anchor="middle">i4</text>
<rect class="sV" x="573" y="34" width="40" height="30" rx="3" opacity=".85"/><text class="sC" x="593" y="54" text-anchor="middle">d4</text>
<rect class="sW" x="616" y="34" width="40" height="30" rx="3" opacity=".85"/><text class="sC" x="636" y="54" text-anchor="middle">c4</text>
<rect class="sG" x="659" y="34" width="40" height="30" rx="3" opacity=".85"/><text class="sC" x="679" y="54" text-anchor="middle">a4</text>
<text class="sM" x="14" y="98">column store (OLAP): one column's values together</text>
<rect class="sB" x="14" y="108" width="40" height="30" rx="3" opacity=".25"/><text class="sC" x="34" y="128" text-anchor="middle">i1</text>
<rect class="sB" x="57" y="108" width="40" height="30" rx="3" opacity=".25"/><text class="sC" x="77" y="128" text-anchor="middle">i2</text>
<rect class="sB" x="100" y="108" width="40" height="30" rx="3" opacity=".25"/><text class="sC" x="120" y="128" text-anchor="middle">i3</text>
<rect class="sB" x="143" y="108" width="40" height="30" rx="3" opacity=".25"/><text class="sC" x="163" y="128" text-anchor="middle">i4</text>
<rect class="sV" x="186" y="108" width="40" height="30" rx="3" opacity=".25"/><text class="sC" x="206" y="128" text-anchor="middle">d1</text>
<rect class="sV" x="229" y="108" width="40" height="30" rx="3" opacity=".25"/><text class="sC" x="249" y="128" text-anchor="middle">d2</text>
<rect class="sV" x="272" y="108" width="40" height="30" rx="3" opacity=".25"/><text class="sC" x="292" y="128" text-anchor="middle">d3</text>
<rect class="sV" x="315" y="108" width="40" height="30" rx="3" opacity=".25"/><text class="sC" x="335" y="128" text-anchor="middle">d4</text>
<rect class="sW" x="358" y="108" width="40" height="30" rx="3"/><text class="sC" x="378" y="128" text-anchor="middle">c1</text>
<rect class="sW" x="401" y="108" width="40" height="30" rx="3"/><text class="sC" x="421" y="128" text-anchor="middle">c2</text>
<rect class="sW" x="444" y="108" width="40" height="30" rx="3"/><text class="sC" x="464" y="128" text-anchor="middle">c3</text>
<rect class="sW" x="487" y="108" width="40" height="30" rx="3"/><text class="sC" x="507" y="128" text-anchor="middle">c4</text>
<rect class="sG" x="530" y="108" width="40" height="30" rx="3"/><text class="sC" x="550" y="128" text-anchor="middle">a1</text>
<rect class="sG" x="573" y="108" width="40" height="30" rx="3"/><text class="sC" x="593" y="128" text-anchor="middle">a2</text>
<rect class="sG" x="616" y="108" width="40" height="30" rx="3"/><text class="sC" x="636" y="128" text-anchor="middle">a3</text>
<rect class="sG" x="659" y="108" width="40" height="30" rx="3"/><text class="sC" x="679" y="128" text-anchor="middle">a4</text>
<path class="sLg" d="M358 146 V154 H699 V146" fill="none"/><text class="sGt" x="530" y="170" text-anchor="middle">read only these</text>
<text class="sS" x="360" y="196" text-anchor="middle">SUM(amount) WHERE city = 'Cairo': the row store reads every block; the column store reads two columns, compressed</text>
</svg><figcaption>Why warehouses are column stores: analytical queries touch few columns and many rows, and similar values compress well.</figcaption></figure>

## DE1.1 What data engineers do 🟢

- **Ingest** data from operational databases, APIs, files, event streams and SaaS tools.
- **Store** it cost-effectively and durably (data lakes, warehouses).
- **Transform** it into clean, modelled, documented tables that analysts and models can trust ([[DE2]], [[DE7]]).
- **Orchestrate** pipelines on schedules and events, with retries and backfills.
- **Guarantee quality**: tests, freshness monitoring, lineage, access control ([[DE9]]).
- **Serve** data to BI tools, data scientists, applications and partners.

In Egypt, data-engineering roles cluster in telecoms (huge event volumes: call records, network events), banking and fintech (regulated, often Oracle or SQL Server sources, increasingly Azure), e-commerce and delivery (event streams, product analytics), consultancies building platforms for Gulf clients, and international companies' Cairo hubs. **Azure** (Data Factory, Databricks, Synapse and now **Microsoft Fabric**) is very common, alongside AWS, GCP and on-premises Hadoop or Cloudera in some telecoms and government projects.

## DE1.2 OLTP vs OLAP 🟢 ⭐

| | **OLTP** (online transaction processing) | **OLAP** (online analytical processing) |
|---|---|---|
| Purpose | Run the business: place an order, record a payment | Understand the business: revenue by region by month |
| Queries | Many small reads and writes by key | Few large scans and aggregations over many rows |
| Schema | **Normalised** (3NF) to keep writes consistent ([[B6.1]]) | **Denormalised** dimensional models (star schemas) for easy, fast reads ([[DE2]]) |
| Storage | **Row-oriented**: a whole row stored together | **Column-oriented**: each column stored together, compressed |
| Data | Current state | History, often years |
| Examples | SQL Server, PostgreSQL, Oracle, MySQL behind apps | Snowflake, BigQuery, Redshift, Synapse, Fabric Warehouse, Databricks SQL, ClickHouse, DuckDB |

> [!term] Columnar storage
> Storing each column's values together rather than each row's. Analytical queries read only the few columns they need, values of one type compress very well (often 5–10×), and engines process them in vectorised batches. That's why `SELECT region, SUM(amount)` over a billion rows is fast in a warehouse and painful in an OLTP database.

<figure class="dia"><svg viewBox="0 0 720 272" role="img" aria-label="An aggregate over two of eight columns, measured on two million orders: the CSV is 137 megabytes and takes about 1.8 seconds to aggregate, 0.7 seconds with usecols, while Parquet is 49 megabytes, the two needed columns are under 10 megabytes, and the aggregate takes about 0.15 seconds">
<text class="sT" x="18" y="24">SUM(amount) BY region over 2,000,000 orders (8 columns), measured</text>
<text class="sS" x="18" y="50">bytes read</text>
<text class="sS" x="210" y="72" text-anchor="end">CSV file (all of it is parsed)</text><rect class="sR" x="220" y="58" width="391.699" height="18" rx="3" opacity=".7"/><text class="sT" x="617.699" y="72">137.1 MB</text>
<text class="sS" x="210" y="98" text-anchor="end">Parquet file</text><rect class="sB" x="220" y="84" width="138.894" height="18" rx="3" opacity=".7"/><text class="sT" x="364.894" y="98">48.6 MB</text>
<text class="sS" x="210" y="124" text-anchor="end">Parquet: just region + amount</text><rect class="sG" x="220" y="110" width="27.9873" height="18" rx="3" opacity=".7"/><text class="sT" x="253.987" y="124">9.8 MB</text>
<text class="sS" x="18" y="156">time to answer</text>
<text class="sS" x="210" y="178" text-anchor="end">pd.read_csv (everything)</text><rect class="sR" x="220" y="164" width="296.296" height="18" rx="3" opacity=".7"/><text class="sT" x="522.296" y="178">1.76 s</text>
<text class="sS" x="210" y="204" text-anchor="end">read_csv(usecols=2 columns)</text><rect class="sW" x="220" y="190" width="126.078" height="18" rx="3" opacity=".7"/><text class="sT" x="352.078" y="204">0.75 s</text>
<text class="sS" x="210" y="230" text-anchor="end">read_parquet(columns=2)</text><rect class="sG" x="220" y="216" width="25.1485" height="18" rx="3" opacity=".7"/><text class="sT" x="251.148" y="230">0.15 s</text>
<text class="sS" x="18" y="262">usecols still parses every CSV line; the region column compresses to 0.76 MB in Parquet</text>
</svg><figcaption>Why analytical engines store columns: the same question over the same data, as a row-oriented CSV and a columnar Parquet file (pandas and pyarrow on this machine).</figcaption></figure>

> [!say]
> "OLTP systems run the application: many small, concurrent reads and writes on normalised, row-stored tables. OLAP systems answer analytical questions: large scans and aggregations over history, on denormalised star schemas in columnar storage. Data engineering mostly moves data from the first to the second without hurting the source."

## DE1.3 Warehouse, lake, lakehouse 🟢 ⭐

| | **Data warehouse** | **Data lake** | **Lakehouse** |
|---|---|---|---|
| Stores | Structured, modelled tables | **Any** data as files (CSV, JSON, Parquet, images, logs) in object storage | Files in object storage **plus a table format** that adds database features |
| Schema | **Schema-on-write** (defined before loading) | **Schema-on-read** (interpreted when queried) | Schema enforced by the table format, evolvable |
| Strengths | Fast SQL, governance, reliability | Cheap, scalable, flexible, good for ML and raw history | Lake economics and flexibility **plus** ACID transactions, schema enforcement, time travel |
| Risks | Cost at scale; rigid for raw or semi-structured data | Becoming a **data swamp**: undocumented, untrusted files | More components to understand |
| Examples | Snowflake, BigQuery, Redshift, Synapse dedicated pools | ADLS Gen2, Amazon S3, Google Cloud Storage | **Delta Lake** (Databricks, Fabric), **Apache Iceberg** (Snowflake, AWS, many engines), Apache Hudi |

> [!term] Open table format
> A specification (Delta Lake, Apache Iceberg, Apache Hudi) that layers a **transaction log and metadata** over Parquet files in object storage, giving **ACID transactions**, schema evolution, **time travel** (query a table as of yesterday), efficient updates and deletes, and partition pruning. Several engines (Spark, Trino, Snowflake, Fabric, DuckDB) can read the same tables. Details are in [[DE5]].

<figure class="dia"><svg viewBox="0 0 720 270" role="img" aria-label="The lakehouse stack: object storage at the bottom, Parquet files, an open table format adding a transaction log, and many query engines on top">
<rect class="sA" x="14" y="20" width="692" height="46" rx="8"/><text class="sT" x="360" y="48" text-anchor="middle">engines: Spark · SQL warehouses · Trino · DuckDB · Power BI (Direct Lake)</text>
<rect class="sV" x="14" y="78" width="692" height="62" rx="8"/><text class="sT" x="360" y="100" text-anchor="middle">open table format: Delta Lake · Apache Iceberg</text><text class="sC" x="360" y="120" text-anchor="middle">a transaction log over the files: ACID commits · schema enforcement · time travel</text>
<rect class="sW" x="14" y="152" width="692" height="62" rx="8"/><text class="sT" x="360" y="174" text-anchor="middle">files: Parquet (columnar, compressed)</text>
<rect class="sN" x="40" y="184" width="60" height="22" rx="3"/><text class="sC" x="70" y="199" text-anchor="middle">part-0</text>
<rect class="sN" x="112" y="184" width="60" height="22" rx="3"/><text class="sC" x="142" y="199" text-anchor="middle">part-1</text>
<rect class="sN" x="184" y="184" width="60" height="22" rx="3"/><text class="sC" x="214" y="199" text-anchor="middle">part-2</text>
<rect class="sN" x="256" y="184" width="60" height="22" rx="3"/><text class="sC" x="286" y="199" text-anchor="middle">part-3</text>
<rect class="sN" x="328" y="184" width="60" height="22" rx="3"/><text class="sC" x="358" y="199" text-anchor="middle">part-4</text>
<rect class="sN" x="400" y="184" width="60" height="22" rx="3"/><text class="sC" x="430" y="199" text-anchor="middle">part-5</text>
<rect class="sN" x="472" y="184" width="60" height="22" rx="3"/><text class="sC" x="502" y="199" text-anchor="middle">part-6</text>
<rect class="sN" x="544" y="184" width="60" height="22" rx="3"/><text class="sC" x="574" y="199" text-anchor="middle">part-7</text>
<rect class="sN" x="616" y="184" width="60" height="22" rx="3"/><text class="sC" x="646" y="199" text-anchor="middle">part-8</text>
<rect class="sB" x="14" y="226" width="692" height="34" rx="8"/><text class="sT" x="360" y="248" text-anchor="middle">cheap object storage: ADLS Gen2 · S3 · OneLake</text>
</svg><figcaption>A lakehouse is files plus a log. The log is what turns "a folder of Parquet" into a table many engines can trust.</figcaption></figure>

> [!say]
> "A warehouse stores modelled, structured data with fast SQL and strong governance; a lake stores any data cheaply as files, but without discipline turns into a swamp. A lakehouse keeps the files in object storage but adds a table format like Delta or Iceberg, which brings transactions, schema enforcement and time travel, so one copy of the data can serve BI, SQL and machine learning."

### The medallion architecture ⭐

<figure class="dia"><svg viewBox="0 0 720 170" role="img" aria-label="Medallion architecture: sources to bronze, silver, gold, then consumers">
<rect class="sB" x="10" y="55" width="110" height="60" rx="8"/><text class="sT" x="65" y="80" text-anchor="middle">Sources</text><text class="sS" x="65" y="98" text-anchor="middle">apps, APIs, files</text>
<rect class="sW" x="160" y="45" width="140" height="80" rx="10"/><text class="sT" x="230" y="72" text-anchor="middle">Bronze</text><text class="sS" x="230" y="92" text-anchor="middle">raw, as received,</text><text class="sS" x="230" y="108" text-anchor="middle">append-only</text>
<rect class="sB" x="330" y="45" width="140" height="80" rx="10"/><text class="sT" x="400" y="72" text-anchor="middle">Silver</text><text class="sS" x="400" y="92" text-anchor="middle">cleaned, deduplicated,</text><text class="sS" x="400" y="108" text-anchor="middle">conformed</text>
<rect class="sG" x="500" y="45" width="120" height="80" rx="10"/><text class="sT" x="560" y="72" text-anchor="middle">Gold</text><text class="sS" x="560" y="92" text-anchor="middle">business-ready:</text><text class="sS" x="560" y="108" text-anchor="middle">stars, aggregates</text>
<rect class="sA" x="645" y="55" width="70" height="60" rx="8"/><text class="sS" x="680" y="80" text-anchor="middle">BI · ML</text><text class="sS" x="680" y="98" text-anchor="middle">apps</text>
<line class="sL" x1="120" y1="85" x2="160" y2="85"/><line class="sL" x1="300" y1="85" x2="330" y2="85"/><line class="sL" x1="470" y1="85" x2="500" y2="85"/><line class="sL" x1="620" y1="85" x2="645" y2="85"/>
<text class="sS" x="160" y="150">Keep bronze so silver and gold can always be rebuilt (replayed) from the raw data.</text>
</svg><figcaption>Medallion (multi-hop) layers: each layer increases quality and structure; raw data is kept for replays and audits.</figcaption></figure>

| Layer | Contains | Typical work |
|---|---|---|
| **Bronze** (raw) | Data exactly as received, with load metadata (source, load time, file name) | Append-only ingestion; no business logic |
| **Silver** (cleaned) | Typed, deduplicated, validated, conformed (consistent keys and codes), possibly joined | Cleaning, deduplication, slowly changing dimensions |
| **Gold** (curated) | Business-level models: star schemas, aggregates, feature tables | Dimensional modelling, metrics, serving |

The names come from Databricks; the same idea is called raw/staging/marts in dbt projects ([[DE7]]).

## DE1.4 ETL vs ELT, batch vs streaming 🟢 ⭐

| | **ETL** (extract, transform, load) | **ELT** (extract, load, transform) |
|---|---|---|
| Where transformation runs | In a separate engine (SSIS, Informatica, Spark, a Python job) **before** loading | **Inside** the warehouse or lakehouse, in SQL, **after** loading raw data |
| Why | Limited, expensive warehouse compute (older era); sensitive data must be masked before landing | Cheap, elastic warehouse compute; keep raw data; analysts can write transformations in SQL (dbt) |
| Today | Still common in enterprises (SSIS on SQL Server, Informatica) and for heavy non-SQL processing | The default in cloud platforms |

<figure class="dia"><svg viewBox="0 0 720 222" role="img" aria-label="ETL transforms data in a separate engine before loading it; ELT loads raw data first and transforms it inside the warehouse">
<text class="sT" x="14" y="60">ETL</text>
<rect class="sB" x="70" y="30" width="130" height="48" rx="8"/><text class="sT" x="135" y="59" text-anchor="middle">extract</text>
<line class="sLm" x1="200" y1="54" x2="218" y2="54" marker-end="url(#ahm)"/>
<rect class="sR" x="220" y="30" width="130" height="48" rx="8"/><text class="sT" x="285" y="59" text-anchor="middle">transform</text>
<line class="sLm" x1="350" y1="54" x2="368" y2="54" marker-end="url(#ahm)"/>
<rect class="sG" x="370" y="30" width="130" height="48" rx="8"/><text class="sT" x="435" y="59" text-anchor="middle">load</text>
<rect class="sN" x="362" y="22" width="146" height="64" rx="8" style="fill:none" stroke-dasharray="4 3"/><text class="sC" x="516" y="60">inside the warehouse</text>
<text class="sC" x="70" y="100">transform outside, before loading (SSIS, Spark job)</text>
<text class="sT" x="14" y="150">ELT</text>
<rect class="sB" x="70" y="120" width="130" height="48" rx="8"/><text class="sT" x="135" y="149" text-anchor="middle">extract</text>
<line class="sLm" x1="200" y1="144" x2="218" y2="144" marker-end="url(#ahm)"/>
<rect class="sG" x="220" y="120" width="130" height="48" rx="8"/><text class="sT" x="285" y="149" text-anchor="middle">load raw</text>
<line class="sLm" x1="350" y1="144" x2="368" y2="144" marker-end="url(#ahm)"/>
<rect class="sR" x="370" y="120" width="130" height="48" rx="8"/><text class="sT" x="435" y="149" text-anchor="middle">transform in SQL</text>
<rect class="sN" x="212" y="112" width="296" height="64" rx="8" style="fill:none" stroke-dasharray="4 3"/><text class="sC" x="516" y="150">inside the warehouse</text>
<text class="sC" x="70" y="190">load raw first, transform inside the warehouse (dbt)</text>
<text class="sS" x="360" y="210" text-anchor="middle">ELT keeps the raw data, so a fixed transformation can always be replayed</text>
</svg><figcaption>The difference is where the T happens. Cheap, elastic warehouse compute made ELT the default.</figcaption></figure>

| | **Batch** | **Streaming** |
|---|---|---|
| Latency | Minutes to hours (hourly, nightly) | Seconds or less |
| Complexity | Lower: rerun a failed day | Higher: state, ordering, late data, exactly-once ([[DE8]]) |
| Fits | Most reporting, finance, ML training | Fraud, real-time dashboards, alerting, operational triggers, IoT |

**Micro-batch** (Spark Structured Streaming's default: small batches every few seconds) sits between them. Choose streaming only when a decision genuinely needs fresh data; batch is cheaper and simpler.

> [!term] Change data capture (CDC)
> Capturing inserts, updates and deletes from a source database **as they happen**, usually by reading its transaction log (SQL Server CDC, PostgreSQL logical replication, Oracle LogMiner/GoldenGate, MySQL binlog), so the platform gets every change without heavy full-table queries on the source. **Debezium** streams these changes into Kafka ([[DE8]]); managed tools (Fivetran, Azure Data Factory, Fabric mirroring) do it too.

<figure class="dia anim"><svg viewBox="0 0 720 218" role="img" aria-label="Animation: change data capture reads a database's transaction log with Debezium and publishes each insert, update or delete as an event to Kafka, which lands in a bronze table">
<rect class="sB" x="14" y="40" width="150" height="60" rx="8"/><text class="sT" x="89" y="68" text-anchor="middle">app database</text><text class="sC" x="89" y="84" text-anchor="middle">inserts · updates</text>
<line class="sLm" x1="89" y1="100" x2="89" y2="126" marker-end="url(#ahm)"/><rect class="sN" x="14" y="128" width="150" height="50" rx="8"/><text class="sT" x="89" y="151" text-anchor="middle">transaction log</text><text class="sC" x="89" y="167" text-anchor="middle">every change, in order</text>
<line class="sL" x1="164" y1="153" x2="206" y2="153" marker-end="url(#ah)"/><rect class="sV" x="210" y="128" width="140" height="50" rx="8"/><text class="sT" x="280" y="151" text-anchor="middle">Debezium</text><text class="sC" x="280" y="167" text-anchor="middle">reads the log</text>
<line class="sL" x1="350" y1="153" x2="392" y2="153" marker-end="url(#ah)"/><rect class="sW" x="396" y="128" width="140" height="50" rx="8"/><text class="sT" x="466" y="151" text-anchor="middle">Kafka topic</text><text class="sC" x="466" y="167" text-anchor="middle">change events</text>
<line class="sL" x1="536" y1="153" x2="568" y2="153" marker-end="url(#ah)"/><rect class="sG" x="572" y="128" width="134" height="50" rx="8"/><text class="sT" x="639" y="151" text-anchor="middle">bronze table</text><text class="sC" x="639" y="167" text-anchor="middle">append changes</text>
<rect class="sN" x="210" y="30" width="496" height="70" rx="8"/><text class="sC" x="222" y="54" xml:space="preserve" style="white-space:pre">{"op": "u", "before": {"status": "pending"},</text><text class="sC" x="222" y="74" xml:space="preserve" style="white-space:pre">          "after":  {"status": "paid"}, "ts": 1760000000}</text>
<circle class="sP" r="5"><animateMotion dur="4s" repeatCount="indefinite" path="M89 100 V153 H572"/></circle>
<text class="sS" x="360" y="206" text-anchor="middle">no full re-extracts and no extra load on the app: just the stream of changes</text>
</svg><figcaption>CDC turns a database into a stream of change events, including deletes, which periodic "WHERE updated_at > …" queries miss.</figcaption></figure>

## DE1.5 The modern data stack, layer by layer 🟢 🟡 ⭐

| Layer | Open-source / vendor-neutral | Azure | AWS | Google Cloud |
|---|---|---|---|---|
| **Ingestion** (batch, CDC, SaaS) | Airbyte, Debezium, dlt (the Python library), Fivetran (SaaS) | Data Factory, Fabric pipelines and mirroring | Glue, DMS, AppFlow | Datastream, Data Transfer Service |
| **Streaming** | Apache Kafka, Flink, Spark Structured Streaming | Event Hubs (Kafka-compatible), Stream Analytics | Kinesis, MSK | Pub/Sub, Dataflow |
| **Storage** | Object storage + **Parquet** + **Delta/Iceberg** | ADLS Gen2, **OneLake** (Fabric) | S3 | Cloud Storage |
| **Compute / warehouse** | **Spark**, Trino, DuckDB, ClickHouse | **Databricks**, **Fabric** (Lakehouse, Warehouse), Synapse | Redshift, EMR, Athena | **BigQuery**, Dataproc |
| **Transformation** | **dbt**, SQL, Spark | dbt, Fabric notebooks, Data Factory data flows | dbt, Glue | dbt, Dataform |
| **Orchestration** | **Airflow**, Dagster, Prefect | Data Factory, Fabric pipelines, Managed Airflow | MWAA (managed Airflow), Step Functions | Cloud Composer (managed Airflow) |
| **Quality & observability** | dbt tests, Great Expectations, Soda | Purview data quality | Glue Data Quality | Dataplex |
| **Catalog, lineage, governance** | OpenMetadata, DataHub, **Unity Catalog** (open-sourced) | **Microsoft Purview**, Unity Catalog on Databricks | Glue Data Catalog, Lake Formation | Dataplex |
| **Serving** | BI (Power BI, Tableau), feature stores, APIs, **reverse ETL** (syncing warehouse data back into CRMs) | Power BI, Fabric | QuickSight | Looker |

**Snowflake** and **Databricks** run on all three clouds. **Microsoft Fabric** (generally available since November 2023) unifies Data Factory, a Spark lakehouse, a SQL warehouse, real-time analytics and Power BI over **OneLake** (Delta tables), and Microsoft's data-engineering certification is now Fabric-based (**DP-700**).

> [!story]
> Your Huawei **HCIA-Big Data** material covered HDFS, YARN, MapReduce, Hive, HBase, Spark, Kafka and Flume. Map it to today for interviewers: HDFS → cloud object storage (ADLS, S3); YARN → Kubernetes or managed Spark clusters; MapReduce → Spark; Hive tables → Delta or Iceberg tables with a catalog; Flume → Kafka Connect or managed ingestion; Kafka → still Kafka (now without ZooKeeper). Showing you understand *why* the stack moved (separating storage from compute, elastic cost, open table formats) is worth more than knowing either generation alone.

## DE1.6 What makes a pipeline production-grade 🟢 ⭐

| Property | Meaning | How |
|---|---|---|
| **Idempotent** | Running it twice for the same input gives the same result, with no duplicates | Overwrite partitions or `MERGE` on keys instead of blind appends ([[DE3]]) |
| **Incremental** | Processes only new or changed data | Watermarks (last loaded timestamp or ID), CDC, partition-by-date |
| **Backfillable** | Can reprocess any past period safely | Parameterised by date range; idempotent writes ([[DE7]]) |
| **Deterministic** | Same inputs, same outputs | No "now()" inside transformations; pass the logical run date |
| **Observable** | You know when it fails, is late or produces bad data | Logs, metrics, freshness and volume checks, alerts ([[DE9]]) |
| **Tested** | Data and code are checked | Unit tests for transformations; data tests on outputs |
| **Recoverable** | A failure doesn't corrupt data | Atomic writes (table formats), retries, raw data kept in bronze |
| **Documented** | People know what tables mean | Descriptions, owners, lineage, a catalog |

<figure class="dia steps" data-start="1"><svg viewBox="0 0 720 200" role="img" aria-label="An idempotent load: the first run writes three rows; a rerun with a blind insert duplicates them and doubles revenue; a rerun that overwrites the day's partition or merges on keys leaves three rows">
<rect class="sV" x="14" y="70" width="150" height="60" rx="8"/><text class="sT" x="89" y="98" text-anchor="middle">job for</text><text class="sC" x="89" y="114" text-anchor="middle">2026-10-08</text>
<line class="sL" x1="164" y1="100" x2="206" y2="100" marker-end="url(#ah)"/>
<g data-s="1-1"><text class="sC" x="330" y="30" text-anchor="middle">first run: 3 rows</text><rect class="sB" x="220" y="40" width="220" height="22" rx="3" opacity=".6"/><text class="sC" x="230" y="56">2026-10-08  order 101  300</text><rect class="sB" x="220" y="64" width="220" height="22" rx="3" opacity=".6"/><text class="sC" x="230" y="80">2026-10-08  order 102  120</text><rect class="sB" x="220" y="88" width="220" height="22" rx="3" opacity=".6"/><text class="sC" x="230" y="104">2026-10-08  order 103  450</text><text class="sT" x="560" y="100" text-anchor="middle">total 870</text></g>
<g data-s="2-2"><text class="sRt" x="330" y="30" text-anchor="middle">rerun with INSERT: 6 rows ✗</text><rect class="sB" x="220" y="40" width="220" height="22" rx="3" opacity=".6"/><text class="sC" x="230" y="56">2026-10-08  order 101  300</text><rect class="sB" x="220" y="64" width="220" height="22" rx="3" opacity=".6"/><text class="sC" x="230" y="80">2026-10-08  order 102  120</text><rect class="sB" x="220" y="88" width="220" height="22" rx="3" opacity=".6"/><text class="sC" x="230" y="104">2026-10-08  order 103  450</text><rect class="sR" x="220" y="112" width="220" height="22" rx="3" opacity=".6"/><text class="sC" x="230" y="128">2026-10-08  order 101  300</text><rect class="sR" x="220" y="136" width="220" height="22" rx="3" opacity=".6"/><text class="sC" x="230" y="152">2026-10-08  order 102  120</text><rect class="sR" x="220" y="160" width="220" height="22" rx="3" opacity=".6"/><text class="sC" x="230" y="176">2026-10-08  order 103  450</text><text class="sRt" x="560" y="100" text-anchor="middle">total 1,740</text><text class="sRt" x="560" y="120" text-anchor="middle">revenue doubled</text></g>
<g data-s="3-3"><text class="sGt" x="330" y="30" text-anchor="middle">rerun with overwrite / MERGE: 3 rows ✓</text><rect class="sB" x="220" y="40" width="220" height="22" rx="3" opacity=".6"/><text class="sC" x="230" y="56">2026-10-08  order 101  300</text><rect class="sB" x="220" y="64" width="220" height="22" rx="3" opacity=".6"/><text class="sC" x="230" y="80">2026-10-08  order 102  120</text><rect class="sB" x="220" y="88" width="220" height="22" rx="3" opacity=".6"/><text class="sC" x="230" y="104">2026-10-08  order 103  450</text><text class="sGt" x="560" y="100" text-anchor="middle">total 870</text><text class="sGt" x="560" y="120" text-anchor="middle">safe to retry</text></g>
</svg><ol class="dia-steps">
<li>The daily job loads 8 October's three orders.</li>
<li>The job fails half-way through something else and is retried. A blind <code>INSERT</code> appends the same rows again, and yesterday's revenue silently doubles.</li>
<li>Overwriting the day's partition, or <code>MERGE</code> on the order key, makes the rerun a no-op. Retries and backfills become safe.</li>
</ol><figcaption>Idempotency is the property that lets you retry anything. Design every write so running it twice changes nothing.</figcaption></figure>

> [!say]
> "The properties I design for are idempotency, so reruns never duplicate; incremental loading with watermarks or CDC, so we don't reprocess everything; backfill by date parameter; atomic writes so a failed run leaves no half-written data; and observability with freshness, volume and quality checks that alert the owner."

> [!story]
> FinSight's **CSV ingestion → categoriser → daily aggregation** is a small ELT pipeline: raw uploads (bronze), categorised transactions (silver) and `DailyAggregatedTransaction` (gold), with re-aggregation triggered after uploads. In an interview, describe it in exactly those terms, then say what you'd add to make it production-grade: idempotent re-runs per company and day, data tests, and a freshness alert.

## DE1.7 Contracts, SLAs and cost 🟡

- **Data contracts:** an agreed schema, semantics, quality rules and change process between a data producer (an app team) and its consumers, so an upstream column rename doesn't silently break twenty dashboards ([[DE9]]).
- **Freshness SLAs:** "the sales mart is complete for yesterday by 07:00 Cairo time"; monitor and alert against them.
- **Cost (FinOps):** in the cloud you pay for storage, compute and data scanned. Partition and cluster data so queries scan less; stop idle clusters; choose the right warehouse size; avoid `SELECT *`; delete or tier old data.

> [!lab] Draw your platform
> On one page, design a platform for "a delivery app wants daily sales, courier and customer dashboards, plus a churn model": sources (the app's PostgreSQL, payment-gateway webhooks, app events), ingestion (CDC + batch files + events), lake layers (bronze/silver/gold on Delta or Iceberg), transformation (dbt), orchestration (Airflow), quality checks, serving (Power BI, a feature table) and an Azure or AWS service for each box. Add one sentence per box on why. It's the opening question of most DE interviews.

## DE1.8 Interview drill 🟢 ⭐

| Question | Strong short answer |
|---|---|
| What does a data engineer do? | Builds and runs reliable pipelines that ingest, store, transform, test and serve data for analytics, ML and apps. |
| OLTP vs OLAP? | Many small transactional reads and writes on normalised row stores vs large analytical scans on denormalised columnar stores. |
| Why is columnar storage fast for analytics? | Queries read only needed columns, which compress well and process in vectorised batches. |
| Warehouse vs lake vs lakehouse? | Modelled SQL storage vs cheap files of any kind vs files plus a table format adding ACID, schema and time travel. |
| What is the medallion architecture? | Bronze raw, silver cleaned and conformed, gold business-ready layers, keeping raw data for replay. |
| ETL vs ELT? | Transform before loading in a separate engine vs load raw then transform inside the warehouse, now the cloud default. |
| Batch vs streaming? | Scheduled bulk processing (simpler, cheaper) vs continuous low-latency processing (state, ordering, late data). |
| What is CDC? | Capturing row-level changes from a database's transaction log as they happen. |
| What makes a pipeline idempotent? | Re-running it for the same input gives the same result: overwrite partitions or merge on keys, no blind appends. |
| What is a data contract? | An agreed schema, meaning, quality and change process between data producers and consumers. |
| What is Microsoft Fabric? | Microsoft's unified analytics platform (pipelines, Spark lakehouse, warehouse, real-time, Power BI) over OneLake with Delta tables. |
| How does the Hadoop stack map to today? | HDFS → object storage, MapReduce → Spark, Hive tables → Delta/Iceberg tables with a catalog, YARN → Kubernetes or managed clusters. |

## Key takeaways

> [!check]
> - OLTP runs the business; OLAP explains it; data engineering connects them without hurting the source.
> - Lakehouses add table formats (Delta, Iceberg) to cheap object storage; medallion layers organise quality.
> - ELT is the cloud default; streaming only when decisions need it.
> - Design pipelines to be idempotent, incremental, backfillable, observable and tested.
> - Know one cloud's services well (Azure/Fabric fits your background) and the open-source equivalents.

## Sources

- Joe Reis and Matt Housley, *Fundamentals of Data Engineering* (O'Reilly, 2022): the data-engineering life cycle and its undercurrents.
- Ralph Kimball and Margy Ross, *The Data Warehouse Toolkit*, 3rd ed. (2013).
- Michael Armbrust et al., "Lakehouse: A New Generation of Open Platforms that Unify Data Warehousing and Advanced Analytics" (CIDR 2021).
- Databricks: [What is a medallion architecture?](https://www.databricks.com/glossary/medallion-architecture); Microsoft Learn: [Implement medallion lakehouse architecture in Microsoft Fabric](https://learn.microsoft.com/en-us/fabric/onelake/onelake-medallion-lakehouse-architecture), [What is Microsoft Fabric?](https://learn.microsoft.com/en-us/fabric/fundamentals/microsoft-fabric-overview).
- [Debezium documentation](https://debezium.io/documentation/) (CDC); [Delta Lake](https://delta.io/), [Apache Iceberg](https://iceberg.apache.org/).
- Microsoft Learn: [DP-700 Fabric Data Engineer Associate](https://learn.microsoft.com/en-us/credentials/certifications/fabric-data-engineer-associate/).
