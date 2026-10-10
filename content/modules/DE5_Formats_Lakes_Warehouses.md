# File Formats, Table Formats and Warehouses — Parquet, Delta, Iceberg, Snowflake, BigQuery and Fabric

Where and how data is stored decides what's fast, what's cheap and what's even possible: updates, deletes for privacy requests, time travel, sharing one copy between engines. Mid-level DE interviews test this layer directly: "Parquet vs Avro?", "how does Delta Lake give ACID on object storage?", "Snowflake vs BigQuery vs Databricks?", "what is Fabric's OneLake?". This module explains the formats from the bytes up and compares the main platforms, current as of 2026.

> [!focus]
> **Entry must:** compare CSV, JSON, Avro and Parquet; explain why columnar formats suit analytics; explain what a table format adds; describe separation of storage and compute.
> **Mid adds:** Parquet internals (row groups, statistics, encodings), Delta and Iceberg architecture (transaction log, snapshots, manifests, catalogs), time travel and its retention trade-off, compaction and vacuum, comparing Snowflake, BigQuery, Databricks and Fabric.
> **Most asked:** *Parquet vs Avro?* · *Why is Parquet fast?* · *How does Delta Lake provide ACID transactions?* · *Delta vs Iceberg?* · *What is time travel?* · *Snowflake vs BigQuery?* · *What is a lakehouse catalog?*
> **Time budget:** 3 hours.

## DE5.0 Foundations: files are not tables 🟢

Cloud object storage (ADLS, S3, OneLake) is a giant, cheap key-value store: a path maps to a blob of bytes. It has no idea that a hundred Parquet files in `orders/` are meant to be **one table**. That gap causes three problems:

- Readers that **list the folder** while a job writes can see a half-finished table.
- A job that **crashes** leaves partial files behind, and nothing records which files form a complete write.
- Files are **immutable**: changing one row means rewriting a file, and something must track which version is current.

File **formats** (CSV, Avro, Parquet) decide how bytes are laid out inside each file. **Table formats** (Delta Lake, Iceberg) add a metadata layer that defines which files make up the table at each version.

<figure class="dia steps" data-start="1"><svg viewBox="0 0 720 210" role="img" aria-label="Writing to a plain folder lets readers see a half-written table and leaves orphan files after a crash; with a transaction log, new files become visible only when a commit file appears atomically">
<text class="sM" x="100" y="24" text-anchor="middle">orders/ (a plain folder)</text>
<g data-s="1-1"><rect class="sB" x="24" y="40" width="150" height="24" rx="4"/><text class="sC" x="32" y="57" xml:space="preserve" style="white-space:pre">part-0.parquet</text><rect class="sB" x="24" y="68" width="150" height="24" rx="4"/><text class="sC" x="32" y="85" xml:space="preserve" style="white-space:pre">part-1.parquet</text><rect class="sB" x="24" y="96" width="150" height="24" rx="4"/><text class="sC" x="32" y="113" xml:space="preserve" style="white-space:pre">part-2.parquet</text><rect class="sW" x="24" y="124" width="150" height="24" rx="4"/><text class="sC" x="32" y="141" xml:space="preserve" style="white-space:pre">part-3.parquet</text><text class="sWt" x="400" y="60">a job is writing parts 3, 4 and 5…</text><text class="sC" x="400" y="90">a reader lists the folder now and</text><text class="sC" x="400" y="108">gets 3 old files + 1 new one:</text><text class="sRt" x="400" y="126">a table state that never existed</text></g>
<g data-s="2-2"><rect class="sB" x="24" y="40" width="150" height="24" rx="4"/><text class="sC" x="32" y="57" xml:space="preserve" style="white-space:pre">part-0.parquet</text><rect class="sB" x="24" y="68" width="150" height="24" rx="4"/><text class="sC" x="32" y="85" xml:space="preserve" style="white-space:pre">part-1.parquet</text><rect class="sB" x="24" y="96" width="150" height="24" rx="4"/><text class="sC" x="32" y="113" xml:space="preserve" style="white-space:pre">part-2.parquet</text><rect class="sR" x="24" y="124" width="150" height="24" rx="4"/><text class="sC" x="32" y="141" xml:space="preserve" style="white-space:pre">part-3.parquet</text><rect class="sR" x="24" y="152" width="150" height="24" rx="4"/><text class="sC" x="32" y="169" xml:space="preserve" style="white-space:pre">part-4.parquet</text><text class="sRt" x="400" y="60">the job crashes half-way</text><text class="sC" x="400" y="90">two orphan files stay behind;</text><text class="sRt" x="400" y="108">every reader now double-counts</text><text class="sC" x="400" y="126">until someone cleans up by hand</text></g>
<g data-s="3-3"><rect class="sB" x="24" y="40" width="150" height="24" rx="4"/><text class="sC" x="32" y="57" xml:space="preserve" style="white-space:pre">part-0.parquet</text><rect class="sB" x="24" y="68" width="150" height="24" rx="4"/><text class="sC" x="32" y="85" xml:space="preserve" style="white-space:pre">part-1.parquet</text><rect class="sB" x="24" y="96" width="150" height="24" rx="4"/><text class="sC" x="32" y="113" xml:space="preserve" style="white-space:pre">part-2.parquet</text><rect class="sN" x="24" y="124" width="150" height="24" rx="4"/><text class="sC" x="32" y="141" xml:space="preserve" style="white-space:pre">part-3.parquet</text><rect class="sN" x="24" y="152" width="150" height="24" rx="4"/><text class="sC" x="32" y="169" xml:space="preserve" style="white-space:pre">part-4.parquet</text><rect class="sN" x="24" y="180" width="150" height="24" rx="4"/><text class="sC" x="32" y="197" xml:space="preserve" style="white-space:pre">part-5.parquet</text><rect class="sV" x="200" y="40" width="170" height="24" rx="4"/><text class="sC" x="208" y="57" xml:space="preserve" style="white-space:pre">_delta_log/…42.json</text><rect class="sG" x="200" y="68" width="170" height="24" rx="4"/><text class="sC" x="208" y="85" xml:space="preserve" style="white-space:pre">_delta_log/…43.json</text><text class="sC" x="400" y="60">new files are invisible until the</text><text class="sC" x="400" y="78">commit file 43 appears, atomically</text><text class="sGt" x="400" y="108">readers see version 42, then 43;</text><text class="sGt" x="400" y="126">a crash before 43 changes nothing</text></g>
</svg><ol class="dia-steps">
<li>Object storage holds <b>files</b>, not tables. While a job writes new files, a reader listing the folder sees whatever happens to be there: a mix of old and half-written data.</li>
<li>If the job crashes, the files it already wrote stay. Every reader now includes them, and nothing records which files belong to a complete write.</li>
<li>A table format writes data files first, then <b>one</b> small commit file naming exactly which files make up the new version. Creating that file is atomic, so readers see version 42 or 43, never something in between.</li>
</ol><figcaption>That is all "ACID on a data lake" means: the log, not the folder listing, defines what the table is.</figcaption></figure>

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

<figure class="dia"><svg viewBox="0 0 720 238" role="img" aria-label="Dictionary encoding stores each distinct city once and replaces values with small codes; run-length encoding then stores runs of repeated codes as value and count">
<text class="sM" x="80" y="22" text-anchor="middle">city column</text>
<rect class="sB" x="30" y="30" width="100" height="20" rx="3"/><text class="sC" x="80" y="45" text-anchor="middle">Cairo</text>
<rect class="sB" x="30" y="52" width="100" height="20" rx="3"/><text class="sC" x="80" y="67" text-anchor="middle">Cairo</text>
<rect class="sB" x="30" y="74" width="100" height="20" rx="3"/><text class="sC" x="80" y="89" text-anchor="middle">Cairo</text>
<rect class="sB" x="30" y="96" width="100" height="20" rx="3"/><text class="sC" x="80" y="111" text-anchor="middle">Giza</text>
<rect class="sB" x="30" y="118" width="100" height="20" rx="3"/><text class="sC" x="80" y="133" text-anchor="middle">Giza</text>
<rect class="sB" x="30" y="140" width="100" height="20" rx="3"/><text class="sC" x="80" y="155" text-anchor="middle">Alex</text>
<rect class="sB" x="30" y="162" width="100" height="20" rx="3"/><text class="sC" x="80" y="177" text-anchor="middle">Cairo</text>
<rect class="sB" x="30" y="184" width="100" height="20" rx="3"/><text class="sC" x="80" y="199" text-anchor="middle">Cairo</text>
<line class="sL" x1="140" y1="110" x2="186" y2="110" marker-end="url(#ah)"/>
<text class="sM" x="260" y="22" text-anchor="middle">dictionary</text><rect class="sV" x="200" y="30" width="120" height="22" rx="4"/><text class="sC" x="260" y="46" text-anchor="middle">0 = Cairo</text><rect class="sV" x="200" y="56" width="120" height="22" rx="4"/><text class="sC" x="260" y="72" text-anchor="middle">1 = Giza</text><rect class="sV" x="200" y="82" width="120" height="22" rx="4"/><text class="sC" x="260" y="98" text-anchor="middle">2 = Alex</text>
<text class="sM" x="450" y="22" text-anchor="middle">codes</text>
<rect class="sA" x="420" y="30" width="60" height="20" rx="3"/><text class="sC" x="450" y="45" text-anchor="middle">0</text>
<rect class="sA" x="420" y="52" width="60" height="20" rx="3"/><text class="sC" x="450" y="67" text-anchor="middle">0</text>
<rect class="sA" x="420" y="74" width="60" height="20" rx="3"/><text class="sC" x="450" y="89" text-anchor="middle">0</text>
<rect class="sA" x="420" y="96" width="60" height="20" rx="3"/><text class="sC" x="450" y="111" text-anchor="middle">1</text>
<rect class="sA" x="420" y="118" width="60" height="20" rx="3"/><text class="sC" x="450" y="133" text-anchor="middle">1</text>
<rect class="sA" x="420" y="140" width="60" height="20" rx="3"/><text class="sC" x="450" y="155" text-anchor="middle">2</text>
<rect class="sA" x="420" y="162" width="60" height="20" rx="3"/><text class="sC" x="450" y="177" text-anchor="middle">0</text>
<rect class="sA" x="420" y="184" width="60" height="20" rx="3"/><text class="sC" x="450" y="199" text-anchor="middle">0</text>
<line class="sL" x1="490" y1="110" x2="536" y2="110" marker-end="url(#ah)"/>
<text class="sM" x="620" y="22" text-anchor="middle">run-length</text><rect class="sG" x="560" y="30" width="120" height="22" rx="4"/><text class="sC" x="620" y="46" text-anchor="middle">0 × 3</text><rect class="sG" x="560" y="56" width="120" height="22" rx="4"/><text class="sC" x="620" y="72" text-anchor="middle">1 × 2</text><rect class="sG" x="560" y="82" width="120" height="22" rx="4"/><text class="sC" x="620" y="98" text-anchor="middle">2 × 1</text><rect class="sG" x="560" y="108" width="120" height="22" rx="4"/><text class="sC" x="620" y="124" text-anchor="middle">0 × 2</text>
<text class="sS" x="360" y="226" text-anchor="middle">then a general compressor (Snappy, Zstandard) squeezes what's left</text>
</svg><figcaption>Why columnar files are small: a column of one type with repeated values encodes into almost nothing.</figcaption></figure>

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

<figure class="dia"><svg viewBox="0 0 720 204" role="img" aria-label="A Delta Lake transaction log of numbered JSON commits that add and remove Parquet files, with periodic checkpoints, and the resulting file sets for versions 40, 41 and 42">
<text class="sM" x="14" y="22">_delta_log/</text>
<rect class="sB" x="14" y="32" width="140" height="28" rx="4"/><text class="sC" x="22" y="51" xml:space="preserve" style="white-space:pre">…040.json</text><text class="sC" x="166" y="51">add part-6 · part-7</text>
<rect class="sB" x="14" y="66" width="140" height="28" rx="4"/><text class="sC" x="22" y="85" xml:space="preserve" style="white-space:pre">…041.json</text><text class="sC" x="166" y="85">add part-8 · remove part-3</text>
<rect class="sV" x="14" y="100" width="140" height="28" rx="4"/><text class="sC" x="22" y="119" xml:space="preserve" style="white-space:pre">…042.json</text><text class="sC" x="166" y="119">MERGE: add part-9 · remove part-6</text>
<rect class="sW" x="14" y="136" width="140" height="28" rx="4"/><text class="sC" x="22" y="155" xml:space="preserve" style="white-space:pre">…040.checkpoint</text><text class="sC" x="166" y="155">every 10 commits: full file list</text>
<rect class="sN" x="460" y="30" width="246" height="134" rx="8"/><text class="sT" x="583" y="50" text-anchor="middle">files in each version</text>
<text class="sC" x="476" y="76">v40: 0 1 2 3 4 5 6 7</text><text class="sC" x="476" y="98">v41: 0 1 2 _ 4 5 6 7 8</text><text class="sC" x="476" y="120">v42: 0 1 2 _ 4 5 _ 7 8 9</text>
<text class="sGt" x="476" y="150">VERSION AS OF 41 → replay to 41</text>
<text class="sS" x="360" y="192" text-anchor="middle">a reader takes the latest checkpoint and replays the few commits after it</text>
</svg><figcaption>Delta in one picture: each version is the file set you get by replaying commits. Time travel is replaying fewer of them.</figcaption></figure>

### How Apache Iceberg works

An Iceberg table has a **catalog** entry pointing to the current **metadata file**, which lists **snapshots**; each snapshot points to a **manifest list**, which points to **manifest files**, which list **data files** with per-file statistics and partition values. A commit atomically swaps the catalog's pointer to a new metadata file. Iceberg's **hidden partitioning** (partition by `days(event_ts)` without a separate column) and **partition evolution** are notable strengths, as is broad multi-engine support (Spark, Trino, Flink, Snowflake, BigQuery, Athena, DuckDB).

<figure class="dia"><svg viewBox="0 0 720 208" role="img" aria-label="Apache Iceberg's metadata tree: the catalog points to a metadata file, which lists snapshots, each with a manifest list pointing to manifests that list data files with statistics">
<rect class="sB" x="14" y="60" width="122" height="56" rx="8"/><text class="sT" x="75" y="86" text-anchor="middle">catalog</text><text class="sC" x="75" y="102" text-anchor="middle">orders → v7</text>
<rect class="sV" x="160" y="60" width="122" height="56" rx="8"/><text class="sT" x="221" y="86" text-anchor="middle">metadata.json</text><text class="sC" x="221" y="102" text-anchor="middle">schema · snapshots</text>
<rect class="sA" x="306" y="60" width="122" height="56" rx="8"/><text class="sT" x="367" y="86" text-anchor="middle">snapshot S7</text><text class="sC" x="367" y="102" text-anchor="middle">manifest list</text>
<rect class="sW" x="452" y="60" width="122" height="56" rx="8"/><text class="sT" x="513" y="86" text-anchor="middle">manifests</text><text class="sC" x="513" y="102" text-anchor="middle">files + stats</text>
<rect class="sG" x="598" y="60" width="122" height="56" rx="8"/><text class="sT" x="659" y="86" text-anchor="middle">data files</text><text class="sC" x="659" y="102" text-anchor="middle">Parquet</text>
<line class="sLm" x1="136" y1="88" x2="158" y2="88" marker-end="url(#ahm)"/>
<line class="sLm" x1="282" y1="88" x2="304" y2="88" marker-end="url(#ahm)"/>
<line class="sLm" x1="428" y1="88" x2="450" y2="88" marker-end="url(#ahm)"/>
<line class="sLm" x1="574" y1="88" x2="596" y2="88" marker-end="url(#ahm)"/>
<text class="sC" x="221" y="140" text-anchor="middle">older snapshots stay</text><text class="sC" x="221" y="156" text-anchor="middle">for time travel</text>
<text class="sC" x="513" y="140" text-anchor="middle">min/max per file lets</text><text class="sC" x="513" y="156" text-anchor="middle">planning skip files</text>
<text class="sS" x="360" y="196" text-anchor="middle">a commit writes new metadata and swaps the catalog pointer: one atomic step</text>
</svg><figcaption>Iceberg: a tree of metadata instead of a log, which lets any engine plan a query without listing a single directory.</figcaption></figure>

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

<figure class="dia"><svg viewBox="0 0 720 218" role="img" aria-label="Separated storage and compute: one copy of the data in object storage read by independent compute clusters for ETL, BI and data science, each sized and billed separately">
<rect class="sB" x="14" y="150" width="692" height="56" rx="10"/><text class="sT" x="360" y="174" text-anchor="middle">one copy of the data in object storage</text><text class="sC" x="360" y="194" text-anchor="middle">OneLake · ADLS · S3 · Snowflake managed storage</text>
<rect class="sV" x="40" y="30" width="180" height="56" rx="8"/><text class="sT" x="130" y="56" text-anchor="middle">ETL cluster</text><text class="sC" x="130" y="72" text-anchor="middle">large, nightly, then off</text><line class="sLm" x1="130" y1="86" x2="130" y2="146" marker-end="url(#ahm)"/>
<rect class="sA" x="270" y="30" width="180" height="56" rx="8"/><text class="sT" x="360" y="56" text-anchor="middle">BI warehouse</text><text class="sC" x="360" y="72" text-anchor="middle">medium, office hours</text><line class="sLm" x1="360" y1="86" x2="360" y2="146" marker-end="url(#ahm)"/>
<rect class="sG" x="500" y="30" width="180" height="56" rx="8"/><text class="sT" x="590" y="56" text-anchor="middle">data science</text><text class="sC" x="590" y="72" text-anchor="middle">GPU notebook, on demand</text><line class="sLm" x1="590" y1="86" x2="590" y2="146" marker-end="url(#ahm)"/>
<text class="sC" x="360" y="116" text-anchor="middle">each scales, pauses and is billed independently; none slows the others</text>
</svg><figcaption>Separating storage from compute is the architectural change behind every modern platform, from Snowflake to Fabric.</figcaption></figure>

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

<figure class="dia"><svg viewBox="0 0 720 172" role="img" aria-label="Fifteen daily table versions; vacuum with a seven-day retention removes the files behind the first week, so time travel only reaches back seven days">
<line class="sLm" x1="60" y1="100" x2="656" y2="100" marker-end="url(#ahm)"/>
<circle class="sPr" cx="60" cy="100" r="7" opacity=".5"/>
<text class="sC" x="60" y="126" text-anchor="middle">day 1</text>
<circle class="sPr" cx="102" cy="100" r="7" opacity=".5"/>
<circle class="sPr" cx="144" cy="100" r="7" opacity=".5"/>
<text class="sC" x="144" y="126" text-anchor="middle">day 3</text>
<circle class="sPr" cx="186" cy="100" r="7" opacity=".5"/>
<circle class="sPr" cx="228" cy="100" r="7" opacity=".5"/>
<text class="sC" x="228" y="126" text-anchor="middle">day 5</text>
<circle class="sPr" cx="270" cy="100" r="7" opacity=".5"/>
<circle class="sPr" cx="312" cy="100" r="7" opacity=".5"/>
<text class="sC" x="312" y="126" text-anchor="middle">day 7</text>
<circle class="sPg" cx="354" cy="100" r="7"/>
<circle class="sPg" cx="396" cy="100" r="7"/>
<text class="sC" x="396" y="126" text-anchor="middle">day 9</text>
<circle class="sPg" cx="438" cy="100" r="7"/>
<circle class="sPg" cx="480" cy="100" r="7"/>
<text class="sC" x="480" y="126" text-anchor="middle">day 11</text>
<circle class="sPg" cx="522" cy="100" r="7"/>
<circle class="sPg" cx="564" cy="100" r="7"/>
<text class="sC" x="564" y="126" text-anchor="middle">day 13</text>
<circle class="sPg" cx="606" cy="100" r="7"/>
<circle class="sPg" cx="648" cy="100" r="7"/>
<text class="sC" x="648" y="126" text-anchor="middle">day 15</text>
<rect class="sR" x="48" y="60" width="276" height="24" rx="6" opacity=".5"/><text class="sC" x="186" y="77" text-anchor="middle">files vacuumed: no time travel here</text>
<rect class="sG" x="342" y="60" width="318" height="24" rx="6" opacity=".6"/><text class="sC" x="501" y="77" text-anchor="middle">retention: 7 days of versions</text>
<text class="sM" x="360" y="30" text-anchor="middle">VACUUM with 7-day retention, run on day 15</text>
<text class="sS" x="360" y="160" text-anchor="middle">deleting personal data also needs this step, or the old files still hold it</text>
</svg><figcaption>Retention is a trade between storage cost, how far back you can roll back, and how quickly deleted data really disappears.</figcaption></figure>

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
