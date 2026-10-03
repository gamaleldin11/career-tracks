# File Formats, Table Formats and Warehouses — Parquet, Delta, Iceberg, Snowflake, BigQuery and Fabric

Where and how data is stored decides what's fast, what's cheap and what's even possible: updates, deletes for privacy requests, time travel, sharing one copy between engines. Mid-level DE interviews test this layer directly: "Parquet vs Avro?", "how does Delta Lake give ACID on object storage?", "Snowflake vs BigQuery vs Databricks?", "what is Fabric's OneLake?". This module explains the formats from the bytes up and compares the main platforms, current as of 2026.

> [!focus]
> **Entry must:** compare CSV, JSON, Avro and Parquet; explain why columnar formats suit analytics; explain what a table format adds; describe separation of storage and compute.
> **Mid adds:** Parquet internals (row groups, statistics, encodings), Delta and Iceberg architecture (transaction log, snapshots, manifests, catalogs), time travel and its retention trade-off, compaction and vacuum, comparing Snowflake, BigQuery, Databricks and Fabric.
> **Most asked:** *Parquet vs Avro?* · *Why is Parquet fast?* · *How does Delta Lake provide ACID transactions?* · *Delta vs Iceberg?* · *What is time travel?* · *Snowflake vs BigQuery?* · *What is a lakehouse catalog?*
> **Time budget:** 3 hours.

## DE5.1 File formats compared 🟢 ⭐

| Format | Layout | Schema | Strengths | Weaknesses | Typical use |
|---|---|---|---|---|---|
| **CSV** | Row, text | None (guessed) | Universal, human-readable | No types, ambiguous quoting and encodings, big, slow | Exchange with people and legacy systems |
| **JSON / JSON Lines** | Row, text | Self-describing per record | Nested data, APIs | Verbose, slow to parse, types loose | API and event landing ([[DE4.2]]) |
| **Avro** | **Row**, binary | **Embedded schema** with well-defined **evolution** rules | Compact, fast writes, schema evolution | Slow for analytical scans | **Kafka** messages, streaming, write-heavy ingestion |
| **Parquet** | **Columnar**, binary | Embedded | Compression, column pruning, statistics for skipping, the analytics standard | Slower to write, not appendable in place | Lakes, lakehouses, warehouse loading |
| **ORC** | Columnar, binary | Embedded | Similar to Parquet | Smaller ecosystem today | Hive-era platforms |

> [!say]
> "Avro is row-oriented with an embedded schema and good evolution rules, so it suits streaming and write-heavy ingestion, like Kafka messages. Parquet is columnar and compressed with per-column statistics, so analytical queries read only the columns and row groups they need. I land events in Avro or JSON and store analytical tables in Parquet, usually under a table format."

## DE5.2 Inside Parquet 🟡

<figure class="dia"><svg viewBox="0 0 720 200" role="img" aria-label="Parquet file structure: row groups containing column chunks of pages, footer with metadata and statistics">
<rect class="sB" x="20" y="20" width="520" height="160" rx="8"/><text class="sT" x="30" y="40">orders.parquet</text>
<rect class="sA" x="35" y="52" width="230" height="100" rx="6"/><text class="sT" x="45" y="70">Row group 1 (e.g. 128 MB)</text>
<rect class="sG" x="45" y="80" width="60" height="62" rx="4"/><text class="sS" x="75" y="115" text-anchor="middle">order_id</text>
<rect class="sG" x="112" y="80" width="60" height="62" rx="4"/><text class="sS" x="142" y="115" text-anchor="middle">amount</text>
<rect class="sG" x="179" y="80" width="76" height="62" rx="4"/><text class="sS" x="217" y="115" text-anchor="middle">city</text>
<rect class="sA" x="275" y="52" width="140" height="100" rx="6"/><text class="sT" x="285" y="70">Row group 2</text><text class="sS" x="285" y="110">column chunks…</text>
<rect class="sW" x="425" y="52" width="105" height="100" rx="6"/><text class="sT" x="477" y="78" text-anchor="middle">Footer</text><text class="sS" x="477" y="98" text-anchor="middle">schema</text><text class="sS" x="477" y="114" text-anchor="middle">min/max stats</text><text class="sS" x="477" y="130" text-anchor="middle">offsets</text>
<text class="sS" x="560" y="70">• readers fetch the footer first</text>
<text class="sS" x="560" y="90">• skip row groups whose</text><text class="sS" x="570" y="106">min/max can't match</text>
<text class="sS" x="560" y="126">• read only needed</text><text class="sS" x="570" y="142">column chunks</text>
</svg><figcaption>A Parquet file: row groups, each with one column chunk per column (split into pages), and a footer holding the schema and statistics.</figcaption></figure>

- **Column pruning:** read only the columns a query uses.
- **Predicate pushdown / row-group skipping:** the footer stores min and max per column chunk, so a filter `amount > 10000` skips row groups whose maximum is below it. Sorting or clustering data on common filters makes this far more effective.
- **Encodings:** **dictionary encoding** (store each distinct city once, then small integer codes), run-length encoding, delta encoding; then **compression** with Snappy (fast) or **Zstandard** (better ratio, now a common default).
- Parquet files are **immutable**: "updating" a row means writing new files, which is why table formats exist.

## DE5.3 Table formats: Delta Lake and Apache Iceberg 🟡 ⭐

Object storage (ADLS, S3) offers files, not tables: no transactions, no atomic multi-file updates, and slow directory listing. **Open table formats** add a metadata layer that turns a folder of Parquet files into a reliable table.

| Capability | What it gives you |
|---|---|
| **ACID transactions** | A write either fully commits or isn't visible; concurrent writers are detected (optimistic concurrency) |
| **Schema enforcement and evolution** | Reject mismatched writes; add or rename columns safely |
| **Updates, deletes, MERGE** | Row-level changes (rewriting affected files, or marking deleted rows with **deletion vectors**) |
| **Time travel** | Query or restore a previous version: `SELECT … VERSION AS OF 42` / `FOR TIMESTAMP AS OF …` |
| **Efficient planning** | Metadata lists exactly which files to read, with statistics, instead of listing directories |
| **Partition evolution / clustering** | Change the layout without rewriting history (Iceberg); liquid clustering (Delta) |

### How Delta Lake works

A Delta table is Parquet data files plus a **`_delta_log/`** folder of numbered JSON **commit files** (`00000000000000000042.json`), each recording files **added** and **removed** in that transaction, plus periodic **checkpoint** files (Parquet) summarising the state. Readers reconstruct the current version from the latest checkpoint plus later commits. Writers commit by atomically creating the next-numbered log file; if two writers race, one fails and retries after checking for conflicts.

### How Apache Iceberg works

An Iceberg table has a **catalog** entry pointing to the current **metadata file**, which lists **snapshots**; each snapshot points to a **manifest list**, which points to **manifest files**, which list **data files** with per-file statistics and partition values. A commit atomically swaps the catalog's pointer to a new metadata file. Iceberg's **hidden partitioning** (partition by `days(event_ts)` without a separate column) and **partition evolution** are notable strengths, as is broad multi-engine support (Spark, Trino, Flink, Snowflake, BigQuery, Athena, DuckDB).

**Iceberg v3** (the specification implemented across Iceberg releases in 2025, and generally available in Snowflake and Databricks in 2026) adds deletion vectors, row lineage, a `VARIANT` type for semi-structured data, default column values, geospatial types and nanosecond timestamps.

| | **Delta Lake** | **Apache Iceberg** | Apache Hudi |
|---|---|---|---|
| Origin and home | Databricks; Linux Foundation project | Netflix; Apache project | Uber; Apache project |
| Strong in | Databricks and **Microsoft Fabric** (OneLake stores Delta); Spark ecosystem | **Multi-engine** openness; Snowflake, AWS, Google, Trino | Upsert-heavy streaming ingestion |
| Catalog | Unity Catalog (open-sourced), Hive metastore | REST catalog spec (Apache Polaris, Unity Catalog, AWS Glue, Nessie) | Hive/Glue |

**Interoperability is improving:** Delta's **UniForm** writes Iceberg-compatible metadata alongside Delta's, and projects like Apache XTable translate between formats, so the "format war" matters less each year.

> [!say]
> "A table format adds a transaction log or snapshot metadata over Parquet files in object storage. In Delta, each commit is a numbered JSON file listing files added and removed; in Iceberg, a catalog points to a metadata file with snapshots and manifests. That gives ACID writes, MERGE and deletes, schema evolution and time travel, and lets several engines share one copy of the data."

## DE5.4 Catalogs and governance 🟡

> [!term] Catalog (metastore)
> The service that maps table names (`sales.gold.fact_orders`) to their storage location and metadata, and increasingly enforces **permissions**, lineage and discovery. Examples: the Hive metastore (legacy), **Unity Catalog** (Databricks, open-sourced in 2024), **Apache Polaris** (an Iceberg REST catalog), AWS Glue Data Catalog, and Microsoft Purview for governance across Azure and Fabric.

Without a catalog, a lake is a pile of folders; with one, it's a governed set of tables with owners, access rules and lineage ([[DE9]]).

## DE5.5 Cloud warehouses and lakehouse platforms 🟡 ⭐

All modern platforms **separate storage from compute**: data sits in cheap durable storage, and compute clusters scale up, down or to zero independently, with several workloads reading the same data without competing.

| Platform | Architecture in one line | Pricing model (roughly) | Notable features |
|---|---|---|---|
| **Snowflake** | Managed storage (micro-partitions) + independent **virtual warehouses** | Credits per second of warehouse runtime + storage | Zero-copy **clones**, time travel, data sharing, Iceberg tables, Snowpark (Python) |
| **Google BigQuery** | **Serverless**: no clusters to manage; storage + a shared compute (slot) pool | **Per bytes scanned** (on-demand) or reserved slots | Partitioning and clustering cut cost directly; BigQuery ML; external and Iceberg tables |
| **Amazon Redshift** | Clusters or serverless; RA3 nodes with managed storage | Node hours or serverless RPUs | Distribution and sort keys; Spectrum for lake data |
| **Databricks** | **Lakehouse**: Spark and Photon over Delta (and Iceberg) in your cloud storage | DBUs (compute units) + cloud costs | Unity Catalog, Lakeflow (declarative pipelines, jobs), notebooks, MLflow, SQL warehouses |
| **Microsoft Fabric** | SaaS analytics on **OneLake** (one logical lake in Delta format) with Spark lakehouses, a **SQL Warehouse**, pipelines, real-time analytics and Power BI | Capacity units (F SKUs) shared across workloads | **Shortcuts** (reference data in ADLS, S3 or other OneLake locations without copying), **mirroring** (replicate operational databases into OneLake), **Direct Lake** for Power BI ([[DA4.8]]) |
| **Azure Synapse Analytics** | Dedicated SQL pools (MPP), serverless SQL, Spark | Varies | Still supported, but Microsoft's new investment is in Fabric |

> [!say]
> "All of these separate storage from compute. Snowflake gives managed storage with independently sized virtual warehouses and great features like zero-copy clones; BigQuery is serverless and charges by bytes scanned, so partitioning and clustering directly cut cost; Databricks is a lakehouse on open Delta or Iceberg tables in your own storage, strong for Spark and ML; and Fabric unifies pipelines, Spark, a warehouse and Power BI over OneLake, which suits Microsoft-centred companies like many in Egypt."

## DE5.6 Keeping tables healthy 🟡 ⭐

| Task | Why | Delta | Iceberg |
|---|---|---|---|
| **Compaction** | Many small files from streaming or frequent writes slow reads | `OPTIMIZE` (with Z-order or liquid clustering) | `rewrite_data_files` |
| **Remove old files** | Files no longer referenced still cost storage | `VACUUM` (default retention 7 days) | `expire_snapshots`, `remove_orphan_files` |
| **Statistics** | Better pruning and plans | Collected on write; `ANALYZE` | In manifests |
| **Schema evolution** | Sources add columns | `mergeSchema` option, `ALTER TABLE` | `ALTER TABLE` (full evolution incl. renames) |

> [!warning] Vacuum vs time travel
> Vacuuming deletes old data files, so you **can no longer time-travel** to versions older than the retention period. Setting retention very low saves storage but breaks rollbacks and any reader still using an old version. Keep the default unless you have a reason, and align it with your recovery needs.

**Deleting personal data** (a data-protection request) in a lakehouse: `DELETE` the rows, then **vacuum** or **expire snapshots** past the retention, or the data still exists in old files and versions.

## DE5.7 Choosing a platform 🟡

| Situation | Leaning |
|---|---|
| Microsoft-centred company, Power BI everywhere, mixed SQL and Spark skills | **Microsoft Fabric** (or Azure Databricks + Power BI) |
| Heavy Spark, ML and streaming, multi-cloud, open formats | **Databricks** |
| SQL-first analytics team, minimal ops, data sharing | **Snowflake** |
| On Google Cloud, serverless, spiky workloads | **BigQuery** |
| Small data, a single analyst team, low budget | **PostgreSQL** or **DuckDB** + Parquet: don't buy a platform you don't need |

> [!lab] Delta and Iceberg on your laptop
> With PySpark (or `delta-rs` / `deltalake` and PyIceberg in Python): create a Delta table of orders, MERGE an update batch, read `_delta_log` to see the commit JSON, time-travel to version 0, run `OPTIMIZE` and `VACUUM` and watch time travel break past the retention. Then write the same data as an Iceberg table with a local catalog and inspect its metadata and manifest files. Explaining what you saw in those folders is a top-tier answer.

## DE5.8 Interview drill 🟢 ⭐

| Question | Strong short answer |
|---|---|
| Parquet vs Avro? | Columnar for analytical reads vs row-based with schema evolution for streaming and writes. |
| Why is Parquet fast? | Column pruning, compression and encodings, and min/max statistics that let readers skip row groups. |
| What does a table format add? | ACID transactions, schema enforcement and evolution, MERGE and deletes, time travel, efficient planning. |
| How does Delta provide ACID? | An ordered transaction log of JSON commits (plus checkpoints) recording files added and removed; atomic creation of the next commit file. |
| How is Iceberg structured? | Catalog → metadata file → snapshots → manifest lists → manifests → data files with statistics. |
| Delta vs Iceberg? | Delta is strongest in Databricks and Fabric; Iceberg in multi-engine settings; interoperability (UniForm, XTable) is narrowing the gap. |
| What is time travel and its limit? | Querying earlier versions; limited by retention, because vacuum removes old files. |
| What's the small-files problem and fix? | Many tiny files slow reads; compact with OPTIMIZE or rewrite_data_files. |
| What is a catalog? | The service mapping table names to storage and metadata, increasingly with permissions and lineage. |
| Why separate storage and compute? | Scale and pay for each independently; many workloads share one copy of data. |
| Snowflake vs BigQuery? | Sized virtual warehouses billed by runtime vs serverless billed by bytes scanned (or reserved slots). |
| What is OneLake? | Fabric's single logical data lake storing tables in Delta, with shortcuts and mirroring. |
| How do you delete personal data in a lakehouse? | Delete the rows, then vacuum or expire snapshots beyond retention so old files are removed. |

## Key takeaways

> [!check]
> - Avro for streaming rows, Parquet for analytical columns; CSV only for exchange.
> - Parquet's speed comes from column pruning, encodings and row-group statistics.
> - Table formats (Delta, Iceberg) add transactions, MERGE, schema evolution and time travel to object storage.
> - Every modern platform separates storage and compute; know the pricing model you're optimising.
> - Maintain tables: compact, vacuum with care, keep statistics, govern through a catalog.

## Sources

- [Apache Parquet documentation](https://parquet.apache.org/docs/) and [Apache Avro specification](https://avro.apache.org/docs/).
- Delta Lake: [documentation](https://docs.delta.io/), [transaction log protocol](https://github.com/delta-io/delta/blob/master/PROTOCOL.md); Michael Armbrust et al., "Delta Lake: High-Performance ACID Table Storage over Cloud Object Stores" (VLDB 2020).
- Apache Iceberg: [table spec](https://iceberg.apache.org/spec/), [documentation](https://iceberg.apache.org/docs/latest/); Google Open Source Blog, [What's new in Iceberg v3](https://opensource.googleblog.com/2025/08/whats-new-in-iceberg-v3.html) (August 2025).
- [Unity Catalog (open source)](https://www.unitycatalog.io/), [Apache Polaris](https://polaris.apache.org/).
- Snowflake: [Key concepts and architecture](https://docs.snowflake.com/en/user-guide/intro-key-concepts); Google Cloud: [BigQuery overview](https://cloud.google.com/bigquery/docs/introduction), [pricing](https://cloud.google.com/bigquery/pricing); Databricks: [What is a data lakehouse?](https://docs.databricks.com/aws/en/lakehouse/); Microsoft Learn: [OneLake overview](https://learn.microsoft.com/en-us/fabric/onelake/onelake-overview), [OneLake shortcuts](https://learn.microsoft.com/en-us/fabric/onelake/onelake-shortcuts), [Mirroring in Fabric](https://learn.microsoft.com/en-us/fabric/mirroring/overview).
