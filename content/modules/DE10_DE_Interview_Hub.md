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

<figure class="dia anim"><svg viewBox="0 0 720 248" role="img" aria-label="Animation: delivery-app data platform; CDC, app events and payment webhooks enter Kafka, a streaming job feeds a per-minute operations dashboard, and a lakehouse with bronze, silver and gold layers feeds Power BI and churn-model features, all orchestrated, tested and governed">
<rect class="sB" x="14" y="20" width="120" height="44" rx="8"/><text class="sT" x="74" y="40" text-anchor="middle">PostgreSQL</text><text class="sC" x="74" y="56" text-anchor="middle">CDC (Debezium)</text><rect class="sB" x="14" y="80" width="120" height="44" rx="8"/><text class="sT" x="74" y="100" text-anchor="middle">app events · GPS</text><text class="sC" x="74" y="116" text-anchor="middle">Avro</text><rect class="sB" x="14" y="140" width="120" height="44" rx="8"/><text class="sT" x="74" y="160" text-anchor="middle">payment webhooks</text><text class="sC" x="74" y="176" text-anchor="middle">idempotent</text>
<rect class="sW" x="170" y="20" width="90" height="164" rx="10"/><text class="sT" x="215" y="98" text-anchor="middle">Kafka</text><text class="sC" x="215" y="116" text-anchor="middle">topics</text>
<line class="sL" x1="134" y1="42" x2="166" y2="42" marker-end="url(#ah)"/>
<line class="sL" x1="134" y1="102" x2="166" y2="102" marker-end="url(#ah)"/>
<line class="sL" x1="134" y1="162" x2="166" y2="162" marker-end="url(#ah)"/>
<line class="sL" x1="260" y1="70" x2="296" y2="46" marker-end="url(#ah)"/><rect class="sV" x="300" y="20" width="170" height="50" rx="8"/><text class="sT" x="385" y="43" text-anchor="middle">streaming job</text><text class="sC" x="385" y="59" text-anchor="middle">event time · watermark</text>
<line class="sL" x1="470" y1="45" x2="506" y2="45" marker-end="url(#ah)"/><rect class="sR" x="510" y="20" width="196" height="50" rx="8"/><text class="sT" x="608" y="43" text-anchor="middle">ops dashboard</text><text class="sC" x="608" y="59" text-anchor="middle">per-minute zones, &lt; 2 min</text>
<line class="sL" x1="260" y1="130" x2="296" y2="130" marker-end="url(#ah)"/>
<rect class="sN" x="300" y="90" width="170" height="94" rx="10"/><text class="sT" x="385" y="108" text-anchor="middle">lakehouse (Delta)</text>
<rect class="sB" x="312" y="116" width="146" height="18" rx="4"/><text class="sC" x="385" y="129" text-anchor="middle">bronze</text>
<rect class="sV" x="312" y="138" width="146" height="18" rx="4"/><text class="sC" x="385" y="151" text-anchor="middle">silver: MERGE CDC</text>
<rect class="sA" x="312" y="160" width="146" height="18" rx="4"/><text class="sC" x="385" y="173" text-anchor="middle">gold: dbt marts</text>
<line class="sL" x1="470" y1="150" x2="506" y2="112" marker-end="url(#ah)"/><rect class="sG" x="510" y="88" width="196" height="46" rx="8"/><text class="sT" x="608" y="109" text-anchor="middle">Power BI by 07:00</text><text class="sC" x="608" y="125" text-anchor="middle">Direct Lake on gold</text>
<line class="sL" x1="470" y1="168" x2="506" y2="170" marker-end="url(#ah)"/><rect class="sG" x="510" y="148" width="196" height="46" rx="8"/><text class="sT" x="608" y="169" text-anchor="middle">features → churn model</text><text class="sC" x="608" y="185" text-anchor="middle">scores → CRM (reverse ETL)</text>
<rect class="sN" x="14" y="206" width="692" height="30" rx="8"/><text class="sC" x="360" y="226" text-anchor="middle">around it all: Airflow (intervals, backfills) · contracts &amp; tests · catalog, masking, RLS · monitoring</text>
<circle class="sPv" r="5"><animateMotion dur="4s" repeatCount="indefinite" path="M134 102 H260 L300 46 H510"/></circle><circle class="sP" r="5"><animateMotion dur="4s" begin="1.5s" repeatCount="indefinite" path="M134 42 H260 V130 H470 L510 112"/></circle>
</svg><figcaption>The pipeline-design answer on one page: split by latency, one copy of the truth in the lakehouse, and governance around everything.</figcaption></figure>

<figure class="dia"><svg viewBox="0 0 720 110" role="img" aria-label="A 25-minute pipeline-design answer split across requirements, ingestion, storage, processing, orchestration, quality, serving, and governance, cost and failure modes">
<rect class="sB" x="14" y="30" width="81.04" height="44" rx="6"/><text class="sC" x="55.52" y="50" text-anchor="middle">requirements</text><text class="sC" x="55.52" y="66" text-anchor="middle">3 min</text>
<rect class="sB" x="97.04" y="30" width="81.04" height="44" rx="6"/><text class="sC" x="138.56" y="50" text-anchor="middle">ingestion</text><text class="sC" x="138.56" y="66" text-anchor="middle">3 min</text>
<rect class="sV" x="180.08" y="30" width="81.04" height="44" rx="6"/><text class="sC" x="221.6" y="50" text-anchor="middle">storage</text><text class="sC" x="221.6" y="66" text-anchor="middle">3 min</text>
<rect class="sV" x="263.12" y="30" width="108.72" height="44" rx="6"/><text class="sT" x="318.48" y="50" text-anchor="middle">processing</text><text class="sC" x="318.48" y="66" text-anchor="middle">4 min</text>
<rect class="sA" x="373.84" y="30" width="53.36" height="44" rx="6"/><text class="sC" x="401.52" y="50" text-anchor="middle">Airflow</text><text class="sC" x="401.52" y="66" text-anchor="middle">2 min</text>
<rect class="sA" x="429.2" y="30" width="81.04" height="44" rx="6"/><text class="sC" x="470.72" y="50" text-anchor="middle">quality</text><text class="sC" x="470.72" y="66" text-anchor="middle">3 min</text>
<rect class="sG" x="512.24" y="30" width="53.36" height="44" rx="6"/><text class="sC" x="539.92" y="50" text-anchor="middle">serving</text><text class="sC" x="539.92" y="66" text-anchor="middle">2 min</text>
<rect class="sW" x="567.6" y="30" width="136.4" height="44" rx="6"/><text class="sT" x="636.8" y="50" text-anchor="middle">gov · cost · failures</text><text class="sC" x="636.8" y="66" text-anchor="middle">5 min</text>
<text class="sC" x="14" y="98">consumers and latencies first</text><text class="sC" x="706" y="98" text-anchor="end">what breaks and how you'd know</text>
</svg><figcaption>Name the consumers and their latency needs before any tool. The last five minutes are where seniority shows.</figcaption></figure>

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

<figure class="dia"><svg viewBox="0 0 720 230" role="img" aria-label="The data-engineering two-week plan as a calendar: platform and SQL, modelling and Python, lakehouse formats and Spark, Airflow and dbt, Kafka, quality, then design practice and a mock take-home">
<rect class="sB" x="14" y="40" width="92" height="64" rx="8"/><text class="sM" x="22" y="56">day 1</text><text class="sT" x="60" y="78" text-anchor="middle">platform</text><text class="sC" x="60" y="95" text-anchor="middle">draw it</text>
<rect class="sB" x="114" y="40" width="92" height="64" rx="8"/><text class="sM" x="122" y="56">day 2</text><text class="sT" x="160" y="78" text-anchor="middle">SQL ×8</text><text class="sC" x="160" y="95" text-anchor="middle">MERGE · SCD2</text>
<rect class="sB" x="214" y="40" width="92" height="64" rx="8"/><text class="sM" x="222" y="56">day 3</text><text class="sT" x="260" y="78" text-anchor="middle">SQL ×7</text><text class="sC" x="260" y="95" text-anchor="middle">dedup · timed</text>
<rect class="sV" x="314" y="40" width="92" height="64" rx="8"/><text class="sM" x="322" y="56">day 4</text><text class="sT" x="360" y="78" text-anchor="middle">modelling</text><text class="sC" x="360" y="95" text-anchor="middle">3 businesses</text>
<rect class="sV" x="414" y="40" width="92" height="64" rx="8"/><text class="sM" x="422" y="56">day 5</text><text class="sT" x="460" y="78" text-anchor="middle">Python</text><text class="sC" x="460" y="95" text-anchor="middle">pipeline lab</text>
<rect class="sA" x="514" y="40" width="92" height="64" rx="8"/><text class="sM" x="522" y="56">day 6</text><text class="sT" x="560" y="78" text-anchor="middle">Delta · Iceberg</text><text class="sC" x="560" y="95" text-anchor="middle">on a laptop</text>
<rect class="sA" x="614" y="40" width="92" height="64" rx="8"/><text class="sM" x="622" y="56">day 7</text><text class="sT" x="660" y="78" text-anchor="middle">Spark</text><text class="sC" x="660" y="95" text-anchor="middle">lab + UI</text>
<rect class="sA" x="14" y="126" width="92" height="64" rx="8"/><text class="sM" x="22" y="142">day 8</text><text class="sT" x="60" y="164" text-anchor="middle">Spark</text><text class="sC" x="60" y="181" text-anchor="middle">skew · joins</text>
<rect class="sG" x="114" y="126" width="92" height="64" rx="8"/><text class="sM" x="122" y="142">day 9</text><text class="sT" x="160" y="164" text-anchor="middle">Airflow + dbt</text><text class="sC" x="160" y="181" text-anchor="middle">orchestrate</text>
<rect class="sG" x="214" y="126" width="92" height="64" rx="8"/><text class="sM" x="222" y="142">day 10</text><text class="sT" x="260" y="164" text-anchor="middle">Kafka</text><text class="sC" x="260" y="181" text-anchor="middle">+ Debezium</text>
<rect class="sG" x="314" y="126" width="92" height="64" rx="8"/><text class="sM" x="322" y="142">day 11</text><text class="sT" x="360" y="164" text-anchor="middle">quality</text><text class="sC" x="360" y="181" text-anchor="middle">+ runbook</text>
<rect class="sW" x="414" y="126" width="92" height="64" rx="8"/><text class="sM" x="422" y="142">day 12</text><text class="sT" x="460" y="164" text-anchor="middle">design ×2</text><text class="sC" x="460" y="181" text-anchor="middle">recorded</text>
<rect class="sW" x="514" y="126" width="92" height="64" rx="8"/><text class="sM" x="522" y="142">day 13</text><text class="sT" x="560" y="164" text-anchor="middle">take-home</text><text class="sC" x="560" y="181" text-anchor="middle">4 hours</text>
<rect class="sW" x="614" y="126" width="92" height="64" rx="8"/><text class="sM" x="622" y="142">day 14</text><text class="sT" x="660" y="164" text-anchor="middle">bank ×2</text><text class="sC" x="660" y="181" text-anchor="middle">stories · rest</text>
<text class="sM" x="14" y="30">week 1: the platform, SQL, modelling, Python and formats</text><text class="sM" x="14" y="116">week 2: engines, orchestration, streaming, quality, rehearsal</text>
<rect class="sB" x="14" y="204" width="16" height="16" rx="3"/><text class="sC" x="36" y="217">platform · SQL</text>
<rect class="sV" x="154" y="204" width="16" height="16" rx="3"/><text class="sC" x="176" y="217">modelling · Python</text>
<rect class="sA" x="294" y="204" width="16" height="16" rx="3"/><text class="sC" x="316" y="217">lakehouse · Spark</text>
<rect class="sG" x="434" y="204" width="16" height="16" rx="3"/><text class="sC" x="456" y="217">ops · quality</text>
<rect class="sW" x="574" y="204" width="16" height="16" rx="3"/><text class="sC" x="596" y="217">rehearse</text>
</svg><figcaption>Each lab builds on the last: one pipeline that gains Spark, orchestration, streaming and quality as the fortnight goes on.</figcaption></figure>

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
