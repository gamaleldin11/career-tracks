# Data Engineer Interview Hub — Pipeline Design, SQL and Spark Rounds, Take-Homes and the Bank

This is the module to live in during the final week before a data-engineering interview. DE interviews typically combine an HR screen, a **SQL round** (often the hardest SQL of any track), a **Python coding** round, a **data-modelling** exercise, a **pipeline or platform design** discussion, and sometimes a take-home pipeline. This hub gives you a full pipeline-design answer, how take-homes are judged, the portfolio that closes your gaps, and a question bank across the whole track.

> [!focus]
> **Entry must:** write SQL with windows, deduplication and MERGE; write clean Python that ingests and transforms data; model a business process as a star schema; explain your own pipeline end to end.
> **Mid adds:** design a platform or pipeline with ingestion, storage layers, orchestration, quality and serving; reason about idempotency, backfills, late data, scale (Spark, partitioning), streaming trade-offs, cost and governance.
> **Time budget:** the final week: SQL daily, one design every other day, the bank daily.

## DE10.1 How data-engineering interviews usually run 🟢 ⭐

| Round | What happens | Prepared by |
|---|---|---|
| HR screen | Background, English, salary, military status | [[S8]] |
| **SQL** | Windows, deduplication, incremental loads, SCD, cohort-style problems; sometimes query tuning | [[S3]], [[DA3]], [[DE3]] |
| **Python** | Parse files or APIs, transform data, sometimes an easy algorithm | [[S7]], [[DE4]], [[S4]] |
| **Data modelling** | "Model this business": grain, facts, dimensions, SCDs | [[DE2]] |
| **Pipeline / platform design** | "Design a pipeline for X" end to end | [[DE10.2]], [[DE1]] |
| Tools deep-dive | Spark, Airflow, dbt, Kafka, Delta/Iceberg, the company's cloud | [[DE5]]–[[DE8]] |
| Take-home | Build a small pipeline with tests and a README | [[DE10.3]] |
| Team round | Ownership, incidents, working with analysts and engineers | [[S8]] |

## DE10.2 Pipeline design: a complete answer ⭐

"**Design the data pipeline for a food-delivery app: daily business dashboards, near-real-time operations metrics, and features for a churn model.**" About 25 minutes, by layers:

1. **Requirements.** Consumers: executives (daily, by 07:00 Cairo time), the operations room (per-minute zone metrics, under 2 minutes of delay), data scientists (daily customer features). Sources: the app's PostgreSQL (orders, customers, restaurants), payment-gateway webhooks, app events, courier GPS. Volumes: ~500,000 orders a day, ~50 million app events a day, GPS every 5 seconds per active courier. Personal data present (phones, addresses).
2. **Ingestion.** **CDC** from PostgreSQL with Debezium into Kafka ([[DE8.6]]); app events and GPS published to Kafka (Avro, schema registry); payment webhooks landed by an idempotent service into Kafka; nightly reference files via a batch job ([[DE4.2]]).
3. **Storage.** A lakehouse on ADLS or S3 with **Delta or Iceberg** tables: **bronze** (raw, append-only, with ingestion metadata), **silver** (deduplicated, typed, current-state tables built by applying CDC with MERGE, PII tagged and pseudonymised), **gold** (star schemas: `fact_order_line`, `fact_order_fulfilment` as an accumulating snapshot, conformed dimensions with SCD Type 2; [[DE2.8]]). Partitioned by event date; compaction scheduled ([[DE3.6]], [[DE5.6]]).
4. **Processing.** **Streaming:** Spark Structured Streaming (or Flink) computes per-zone, per-minute metrics on **event time** with a watermark into a gold table and a low-latency store for the ops dashboard ([[DE8.7]]). **Batch:** dbt models (staging → intermediate → marts), incremental with a 3-day lookback for late data; customer feature tables computed **as of** each day (point-in-time correct, [[DS2.6]]).
5. **Orchestration.** Airflow: ingestion checks, dbt builds after silver is fresh (asset-triggered), feature-table job, ML scoring, alerts; every task parameterised by the data interval and idempotent; backfills by date ([[DE7]]).
6. **Quality.** Contracts on events (schema registry compatibility) and CDC tables; dbt tests on keys, relationships and accepted values; reconciliation of daily revenue against the payments ledger; write-audit-publish for gold; freshness SLO "gold complete by 07:00"; observability on volume and schema ([[DE9]]).
7. **Serving.** Power BI on gold (Direct Lake or Import), the ops dashboard from the streaming table, a feature table for data scientists, and reverse ETL of churn scores to the CRM.
8. **Governance and security.** Catalog with owners and descriptions, column masking for phones and addresses, row-level security by region where needed, managed identities, retention policies, a deletion procedure for data-subject requests ([[DE9.8]]).
9. **Scale and cost.** Spark sizing with AQE, partition pruning, compaction, auto-scaling and stopping idle clusters; streaming only where latency needs it ([[DE6]]).
10. **Failure modes.** CDC connector lag (monitor consumer lag), late GPS events (watermarks, side output), a source schema change (contract failure in the producer's CI, schema-change alerts), a bad deployment (time travel to restore, backfill).

> [!say]
> "I'd separate the latency needs: operations needs per-minute metrics, so app events and GPS stream through Kafka into a Structured Streaming job on event time with watermarks, while dashboards and features are daily batch. Operational tables come in by CDC with Debezium, land raw in bronze Delta tables, become clean current-state tables in silver by MERGE, and are modelled as star schemas in gold by incremental dbt models with a lookback for late data. Airflow runs everything by data interval so backfills are safe; quality is enforced with contracts, dbt tests, reconciliation and write-audit-publish; and PII is masked by role. I'd watch consumer lag, freshness SLOs and costs."

**More designs to practise:** a telecom CDR (call detail record) pipeline with billions of rows a day; a bank's daily regulatory reporting from Oracle sources; migrating an on-premises SSIS/SQL Server warehouse to Fabric or Databricks; a clickstream pipeline for product analytics; a near-real-time inventory feed for an e-commerce app; ingesting dozens of SaaS APIs into a warehouse.

## DE10.3 The take-home pipeline 🟢 ⭐

A typical brief: "Here's an API (or some CSV/JSON files). Build a pipeline that ingests, cleans and models the data, with tests. Explain your design."

**What reviewers score:**

| Area | Great looks like |
|---|---|
| Runs | `docker compose up` (or `make run`) with clear instructions; sample data included |
| Structure | A package with extract, transform and load modules; config by environment; logging ([[DE4.1]]) |
| Correctness | Idempotent loads (MERGE or partition overwrite), deduplication, correct grain, late-data handling ([[DE3]]) |
| Modelling | A clear star schema with the grain stated ([[DE2]]) |
| Quality | Schema validation at ingestion, tests on outputs, a reconciliation ([[DE9]]) |
| Tests | Unit tests on transforms, one integration test ([[DE4.8]]) |
| Orchestration | A simple DAG or at least a date-parameterised CLI ([[DE7]]) |
| README | Architecture diagram, decisions and trade-offs, how it would scale, what's missing |

**Common mistakes:** appends that duplicate on rerun; no deduplication; transformations hard-coded to "today"; no tests; loading everything into pandas when SQL in DuckDB or PostgreSQL would be cleaner; no explanation of how it would scale.

## DE10.4 Your data-engineering portfolio: what to build first 🟢

Your gaps file calls the DE CV "the largest list, because it currently rests on one pipeline". One integrated project closes most of it:

| Step | Closes | Module lab |
|---|---|---|
| Rewrite FinSight's aggregation as a **Python** pipeline (incremental, validated, tested, Parquet/Delta) | Python ETL, Parquet | [[DE4]] |
| Orchestrate it with **Airflow 3**; model with **dbt** (incremental, snapshot, tests) | Airflow, dbt | [[DE7]] |
| Add a **Spark** job on a large public dataset with skew and AQE experiments | Spark/PySpark written, not just studied | [[DE6]] |
| Add **Kafka + Debezium** CDC from PostgreSQL into bronze | Kafka, CDC | [[DE8]] |
| Add quality: dbt tests, freshness, Elementary or Soda, a quarantine table | Data quality frameworks | [[DE9]] |
| Write it up with an architecture diagram and a short blog post | Visibility | — |

**Certification:** **DP-700, Microsoft Fabric Data Engineer Associate** (the successor to the retired DP-203) fits Egypt's Microsoft-heavy market; Databricks' Data Engineer Associate is the alternative for Databricks shops.

## DE10.5 The question bank 🟢 ⭐

| Question | Strong short answer |
|---|---|
| OLTP vs OLAP? | Transactional, normalised, row-stored vs analytical, denormalised, columnar. |
| Warehouse vs lake vs lakehouse? | Modelled SQL storage vs raw files vs files plus a table format adding ACID and time travel. |
| Medallion architecture? | Bronze raw, silver cleaned and conformed, gold business-ready. |
| ETL vs ELT? | Transform before loading vs load raw then transform in the warehouse. |
| Batch vs streaming? | Scheduled bulk (simpler) vs continuous low latency (state, ordering, late data). |
| What is CDC? | Capturing row changes from a database's transaction log. |
| What makes a pipeline idempotent? | Reruns give the same result: MERGE or partition overwrite, deterministic run bounds. |
| Full vs incremental load? | Reload everything vs only new or changed data via watermarks or CDC. |
| Why a lookback window? | To catch late data; requires idempotent writes. |
| Deduplicate to the latest record? | ROW_NUMBER by key ordered by updated_at desc with a tie-breaker, keep 1. |
| Common MERGE pitfalls? | Duplicate source keys and NULL-unsafe comparisons. |
| SCD Type 1 vs 2? | Overwrite vs new row with validity dates and a new surrogate key. |
| Fact vs dimension? | Measurements at a grain vs descriptive context. |
| What is grain? | What one fact row represents, declared first. |
| Star vs snowflake? | Denormalised dimensions vs normalised hierarchies; stars are simpler and faster. |
| Transaction vs periodic vs accumulating snapshot facts? | Per event / per entity per period / per process instance updated at milestones. |
| Semi-additive measure? | Summable across some dimensions but not time, like balances. |
| Why surrogate keys? | Independence from source keys and support for SCD history. |
| Kimball vs Data Vault? | Business-friendly stars vs auditable hubs, links and satellites (with stars on top). |
| Parquet vs Avro? | Columnar analytics vs row-based streaming with schema evolution. |
| Why is Parquet fast? | Column pruning, encoding and compression, row-group statistics. |
| How does Delta give ACID? | An ordered transaction log of commits listing files added and removed. |
| Delta vs Iceberg? | Strongest in Databricks/Fabric vs multi-engine openness; converging through interoperability. |
| Time travel's limit? | Retention: vacuum removes old files. |
| Small-files problem? | Too many tiny files slow reads; compact. |
| Partitioning benefits? | Pruning, cheap retention, idempotent overwrites; avoid high-cardinality partition columns. |
| Separate storage and compute? | Scale and pay independently; share one copy of data. |
| Snowflake vs BigQuery? | Sized warehouses by runtime vs serverless by bytes scanned. |
| How does Spark run a job? | Driver plans stages split at shuffles; executors run one task per partition. |
| Transformation vs action? | Lazy plan vs trigger. |
| Why are shuffles expensive? | Disk, network, serialisation, memory. |
| Broadcast join? | Ship the small table to every executor to avoid shuffling the big one. |
| repartition vs coalesce? | Full shuffle (up or down) vs merge partitions without a shuffle (down only). |
| Data skew fixes? | AQE, separate hot or NULL keys, broadcast, salting. |
| What is AQE? | Run-time re-optimisation: coalesce partitions, switch joins, split skew. |
| Why avoid Python UDFs in Spark? | Row-by-row serialisation; use built-ins or pandas UDFs. |
| What's an Airflow DAG? | Python-defined tasks and dependencies with a schedule. |
| Logical date? | The data interval a run is responsible for. |
| Safe backfills? | Idempotent, interval-parameterised tasks. |
| XCom? | Small values between tasks, not data. |
| What does dbt do? | Builds SQL models in dependency order with tests, docs and lineage. |
| dbt incremental models? | Process only new or changed rows with merge, append or partition overwrite. |
| dbt snapshots? | Automatic SCD Type 2. |
| Kafka partitions and consumer groups? | Partitions give parallelism and per-key order; group members split partitions. |
| At-least-once vs exactly-once? | Duplicates possible vs idempotent producers, transactions and idempotent sinks. |
| Kafka 4.0 change? | ZooKeeper removed (KRaft only); new rebalance protocol GA. |
| Event time vs processing time? | When it happened vs when processed. |
| Watermark? | Event-time progress threshold for closing windows and handling lateness. |
| Consumer lag? | How far a group is behind the latest offsets. |
| Data-quality dimensions? | Completeness, uniqueness, validity, consistency, accuracy, freshness. |
| Write-audit-publish? | Stage, check, then publish only if checks pass. |
| Data contract? | A versioned producer–consumer agreement on schema, meaning, quality and SLAs. |
| Data lineage? | Where data came from and what depends on it. |
| PII in a lakehouse? | Classify, minimise, pseudonymise, mask by role, encrypt, retain only as needed, delete fully on request. |
| Microsoft's DE certification now? | DP-700 (Fabric Data Engineer), since DP-203 retired in March 2025. |

## DE10.6 A two-week plan 🟢

| Days | Do |
|---|---|
| 1 | [[DE1]]: draw the platform for a delivery app |
| 2–3 | [[S3]], [[DE3]]: 15 SQL problems including MERGE, SCD2 and deduplication, timed |
| 4 | [[DE2]]: model three businesses |
| 5 | [[S7]], [[DE4]]: the Python pipeline lab |
| 6 | [[DE5]]: Delta and Iceberg on your laptop |
| 7–8 | [[DE6]]: the Spark lab with the UI |
| 9 | [[DE7]]: Airflow 3 + dbt orchestration of your pipeline |
| 10 | [[DE8]]: Kafka on your laptop with Debezium |
| 11 | [[DE9]]: add the quality layer and a runbook |
| 12 | Pipeline-design practice ×2 ([[DE10.2]]), timed and recorded |
| 13 | A mock take-home (4 hours) |
| 14 | The bank twice, [[S8]] stories aloud, rest |

## Key takeaways

> [!check]
> - Design by layers: requirements, ingestion, storage layers, processing, orchestration, quality, serving, governance, scale, failure modes.
> - Separate latency needs: stream only what must be fresh; batch the rest.
> - Idempotency, incremental loads, late-data handling and tests are what make a pipeline credible.
> - Build one integrated portfolio pipeline (Python, Airflow, dbt, Spark, Kafka, quality); it closes most of your DE gaps.
> - Drill the SQL hard; it's the most common deciding round.

## Sources

- Modules S3, S5, S7, S10 and DE1–DE9 of this handbook and their sources.
- Joe Reis and Matt Housley, *Fundamentals of Data Engineering* (O'Reilly, 2022).
- Microsoft Learn: [DP-700 study guide](https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/dp-700).
