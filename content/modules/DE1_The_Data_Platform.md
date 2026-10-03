# The Data Platform — OLTP vs OLAP, Warehouses, Lakes, Lakehouses and the Modern Stack

Data engineers build and run the systems that move data from where it's created (apps, devices, partners) to where it's used (dashboards, models, reports), reliably and on time. Interviews open with the big picture, "describe a modern data platform", "ETL or ELT?", "what's a lakehouse?", before going deep on SQL, modelling, Spark and orchestration. You come at this from software engineering: FinSight's CSV ingestion, transaction categoriser and daily aggregation layer were a small data pipeline, and you studied the Hadoop ecosystem through Huawei's HCIA Big Data material. This module connects both to the platform vocabulary interviewers expect.

> [!focus]
> **Entry must:** explain OLTP vs OLAP; describe warehouse, lake and lakehouse; explain ETL vs ELT and batch vs streaming; draw a simple platform with ingestion, storage, transformation, orchestration and serving; describe what makes a pipeline reliable.
> **Mid adds:** the medallion architecture, columnar storage and table formats, change data capture, the main tools in each layer and their trade-offs, data contracts and freshness SLAs, cost awareness.
> **Most asked:** *What does a data engineer do?* · *OLTP vs OLAP?* · *Data warehouse vs data lake vs lakehouse?* · *ETL vs ELT?* · *Batch vs streaming?* · *What makes a pipeline idempotent?* · *Walk me through a platform you'd build.*
> **Time budget:** 3 hours.

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

| | **Batch** | **Streaming** |
|---|---|---|
| Latency | Minutes to hours (hourly, nightly) | Seconds or less |
| Complexity | Lower: rerun a failed day | Higher: state, ordering, late data, exactly-once ([[DE8]]) |
| Fits | Most reporting, finance, ML training | Fraud, real-time dashboards, alerting, operational triggers, IoT |

**Micro-batch** (Spark Structured Streaming's default: small batches every few seconds) sits between them. Choose streaming only when a decision genuinely needs fresh data; batch is cheaper and simpler.

> [!term] Change data capture (CDC)
> Capturing inserts, updates and deletes from a source database **as they happen**, usually by reading its transaction log (SQL Server CDC, PostgreSQL logical replication, Oracle LogMiner/GoldenGate, MySQL binlog), so the platform gets every change without heavy full-table queries on the source. **Debezium** streams these changes into Kafka ([[DE8]]); managed tools (Fivetran, Azure Data Factory, Fabric mirroring) do it too.

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
