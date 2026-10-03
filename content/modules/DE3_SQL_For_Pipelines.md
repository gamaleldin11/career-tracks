# SQL for Pipelines — Incremental Loads, MERGE, Deduplication, SCD Type 2 and Partitioning

Data-engineering SQL interviews differ from analyst ones: instead of "what was revenue last month?", they ask "load this table incrementally without duplicates", "write the MERGE for an SCD Type 2 dimension", "why is this warehouse query slow?". This module covers the SQL that pipelines are made of. It assumes [[S3]] (joins, windows) and the modelling vocabulary of [[DE2]]. Examples use standard SQL with notes for SQL Server, PostgreSQL, Snowflake, BigQuery and Delta Lake (Databricks, Fabric).

> [!focus]
> **Entry must:** explain full vs incremental loads; write a watermark-based incremental load; deduplicate to the latest record per key; write an upsert with MERGE; explain partitioning and why it speeds queries.
> **Mid adds:** idempotent partition overwrites, SCD Type 2 with MERGE, late-arriving data and lookback windows, change detection with hashes, clustering and file layout, distributed join strategies, reconciliation checks.
> **Most asked:** *How do you load only new data?* · *How do you make a load idempotent?* · *Deduplicate this table keeping the latest row* · *Write a MERGE / upsert* · *Implement SCD Type 2* · *How does partitioning help?* · *How do you handle late-arriving data?*
> **Time budget:** 4 hours.

## DE3.1 Loading patterns 🟢 ⭐

| Pattern | How | Idempotent? | Use |
|---|---|---|---|
| **Full refresh** | Truncate and reload everything (or `CREATE OR REPLACE TABLE … AS SELECT`) | Yes | Small tables, dimensions, when correctness beats cost |
| **Append** | Insert new rows | **No**, unless deduplicated: a rerun duplicates | Immutable event logs, with dedup downstream |
| **Upsert (MERGE)** | Insert new keys, update changed ones | Yes, keyed | Dimensions, mutable entities (orders that change status) |
| **Insert-overwrite by partition** | Replace whole partitions (e.g. one day) with freshly computed data | **Yes** | Daily facts and aggregates; the standard way to make reruns and backfills safe |
| **CDC apply** | Apply inserts, updates and deletes from a change feed | Yes, ordered by change sequence | Replicating OLTP tables ([[DE8]]) |

> [!term] Watermark (high-water mark)
> The last value successfully loaded, such as the max `updated_at` or the max ID, stored per source table. The next run loads rows **after** it. Use a column that's reliably updated on every change, and overlap slightly (a lookback) to catch late commits.

```sql
-- Incremental extract with a watermark and a small lookback for late commits (PostgreSQL)
SELECT *
FROM source.orders
WHERE updated_at >  (SELECT last_value - interval '10 minutes' FROM etl.watermarks WHERE table_name = 'orders')
  AND updated_at <= :run_started_at;            -- an upper bound makes the run deterministic
-- after a successful load:
UPDATE etl.watermarks SET last_value = :run_started_at WHERE table_name = 'orders';
```

The lookback re-reads a few minutes of data, so the **load** step must be idempotent (MERGE or deduplicate), or overlapping rows will duplicate.

> [!say]
> "I load incrementally with a watermark on updated_at, with a small lookback for late commits, and I make the write idempotent, either a MERGE on the business key or overwriting the affected date partitions, so a rerun or a backfill gives exactly the same result. The watermark only moves forward after the load commits."

## DE3.2 Upserts with MERGE 🟢 ⭐

```sql
-- Standard MERGE (SQL Server, Oracle, Snowflake, Databricks/Delta, BigQuery, PostgreSQL 15+)
MERGE INTO silver.customers AS t
USING staging.customers_batch AS s
  ON t.customer_id = s.customer_id
WHEN MATCHED AND (t.name <> s.name OR t.city <> s.city OR t.email <> s.email) THEN
  UPDATE SET name = s.name, city = s.city, email = s.email, updated_at = s.updated_at
WHEN NOT MATCHED THEN
  INSERT (customer_id, name, city, email, updated_at) VALUES (s.customer_id, s.name, s.city, s.email, s.updated_at);
```

```sql
-- PostgreSQL's older idiom: INSERT … ON CONFLICT (needs a unique constraint on customer_id)
INSERT INTO silver.customers AS t (customer_id, name, city, email, updated_at)
SELECT customer_id, name, city, email, updated_at FROM staging.customers_batch
ON CONFLICT (customer_id) DO UPDATE
SET name = EXCLUDED.name, city = EXCLUDED.city, email = EXCLUDED.email, updated_at = EXCLUDED.updated_at
WHERE t.updated_at < EXCLUDED.updated_at;          -- never overwrite newer data with older
```

> [!mistake] Duplicate keys in the source batch
> If the staging batch contains the same `customer_id` twice, `MERGE` fails ("attempted to update the same row more than once") or behaves unpredictably. **Deduplicate the source first** ([[DE3.3]]). Also compare with `IS DISTINCT FROM` (or handle NULLs explicitly), because `NULL <> 'x'` is UNKNOWN and changes to or from NULL would be missed ([[S3.3]]).

**Change detection with a hash:** comparing dozens of columns is error-prone; store a hash of the tracked columns and compare one value:

```sql
-- Snowflake/Databricks: MD5 or SHA2 over a delimited, NULL-safe concatenation
SHA2(CONCAT_WS('||', COALESCE(name,''), COALESCE(city,''), COALESCE(email,'')), 256) AS row_hash
```

## DE3.3 Deduplication 🟢 ⭐

Sources deliver duplicates: retried API calls, overlapping extracts, at-least-once streams. Keep the **latest version per key**:

```sql
WITH ranked AS (
  SELECT *,
         ROW_NUMBER() OVER (PARTITION BY order_id
                            ORDER BY updated_at DESC, _ingested_at DESC) AS rn   -- tie-breaker matters
  FROM bronze.orders
)
SELECT * FROM ranked WHERE rn = 1;

-- Snowflake, BigQuery, Databricks, DuckDB: the same without a CTE
SELECT * FROM bronze.orders
QUALIFY ROW_NUMBER() OVER (PARTITION BY order_id ORDER BY updated_at DESC, _ingested_at DESC) = 1;
```

Always include a **deterministic tie-breaker** (ingestion time, a sequence number), or reruns may keep a different row.

## DE3.4 SCD Type 2 in SQL 🟡 ⭐

The logic ([[DE2.5]]): for each incoming customer, if it's new, insert a current row; if a **tracked attribute changed**, close the current row and insert a new one.

```sql
-- Step 1: close current rows whose tracked attributes changed
UPDATE gold.dim_customer AS d
SET valid_to = s.effective_date - INTERVAL '1 day', is_current = false
FROM staging.customers_batch AS s
WHERE d.customer_id = s.customer_id
  AND d.is_current
  AND d.row_hash <> s.row_hash;

-- Step 2: insert new versions (changed customers) and brand-new customers
INSERT INTO gold.dim_customer (customer_id, name, city, segment, row_hash, valid_from, valid_to, is_current)
SELECT s.customer_id, s.name, s.city, s.segment, s.row_hash, s.effective_date, DATE '9999-12-31', true
FROM staging.customers_batch AS s
LEFT JOIN gold.dim_customer AS d
  ON d.customer_id = s.customer_id AND d.is_current
WHERE d.customer_id IS NULL;            -- no current row: new customer, or its current row was just closed
-- customer_sk is an identity / sequence column generating the surrogate key
```

Run both steps in **one transaction** so readers never see a customer with no current row. Many teams use a single `MERGE` with a union trick instead, or let tooling do it: **dbt snapshots** ([[DE7]]) and Databricks/Fabric's `AUTO CDC` features generate Type 2 history automatically.

**Loading facts against a Type 2 dimension:** look up the surrogate key whose validity range contains the event date:

```sql
SELECT o.order_id, d.customer_sk, o.amount
FROM silver.orders o
JOIN gold.dim_customer d
  ON d.customer_id = o.customer_id
 AND o.order_date BETWEEN d.valid_from AND d.valid_to;
```

## DE3.5 Late-arriving data 🟡 ⭐

| Problem | Example | Handling |
|---|---|---|
| **Late facts** | Yesterday's mobile events arrive today (offline phones) | Partition by **event date**, and reprocess a **lookback window** (say the last 3 days) on each run with partition overwrites |
| **Late or early-arriving dimensions** | An order arrives for a customer not yet in `dim_customer` | Insert an **inferred member** (a placeholder row with the natural key and "unknown" attributes) and update it when the customer arrives; or map to the unknown member (−1) and repair later |
| **Restatements** | Finance corrects last month | Backfill the affected partitions ([[DE7]]) |

**Event time vs processing time:** always keep both (`event_at` from the source, `_ingested_at` from the pipeline). Business reporting uses event time; operational monitoring uses processing time.

## DE3.6 Partitioning, clustering and file layout 🟡 ⭐

> [!term] Partitioning
> Physically splitting a table into segments by a column's value, usually a **date**, so queries that filter on it read only the relevant partitions (**partition pruning**). It also makes idempotent overwrites and retention (dropping old partitions) cheap.

| Platform | Mechanism |
|---|---|
| Lake tables (Parquet, Delta, Iceberg) | Directory or metadata partitions (`event_date=2026-10-03/`); Iceberg's **hidden partitioning** derives partitions from columns (`days(event_ts)`) so queries needn't know the layout |
| BigQuery | Partition by date or timestamp column (or ingestion time), plus **clustering** on up to four columns |
| Snowflake | Automatic **micro-partitions**; optional **clustering keys** for very large tables |
| Delta Lake / Databricks / Fabric | Partitions for very large tables; **Z-ordering** or **liquid clustering** to co-locate related data |
| SQL Server / Azure SQL | Table partitioning by range; **columnstore** indexes for analytics |

**Rules of thumb:** partition by the column most queries filter on (usually event date); avoid **high-cardinality** partition columns (customer ID would create millions of tiny partitions); aim for files of roughly **100 MB–1 GB**, because thousands of tiny files (the **small-files problem**) slow every engine, so compact them (`OPTIMIZE` in Delta, rewrite in Iceberg); and cluster on secondary filter columns.

> [!say]
> "I partition large fact tables by event date, because almost every query and every reload filters by date. That gives partition pruning, cheap retention and idempotent daily overwrites. Then I cluster on the next most common filter, like customer or region, and keep files at a healthy size by compacting, since many small files hurt performance."

## DE3.7 Making warehouse queries fast 🟡 ⭐

- **Select only needed columns** (columnar engines and BigQuery's per-byte billing reward it).
- **Filter on partition and cluster columns** directly, not through functions (`WHERE event_date >= '2026-10-01'`, not `WHERE YEAR(event_date) = 2026`; [[B6.4]]).
- **Pre-aggregate** large facts into summary tables for dashboards.
- **Join strategies in distributed engines:** a **broadcast** join copies a small table to every node (cheap); a **shuffle (hash) join** redistributes both large tables by the key (expensive). Filter and aggregate *before* joining large tables. Some warehouses (Synapse dedicated pools, Redshift) let you choose a **distribution key** so frequently joined tables are co-located. More in [[DE6]].
- **Skew:** one key with a huge share of rows (a "walk-in customer" ID, a NULL key) overloads one worker; handle NULLs separately, or salt the key.
- **Read the plan:** `EXPLAIN` / query profiles show scanned bytes, partitions pruned, join types and spills.
- **Materialise** reused intermediate results instead of recomputing them in many queries.

## DE3.8 Data checks in SQL 🟢 ⭐

Every pipeline step should assert what it expects ([[DE9]] covers frameworks):

```sql
-- Primary key unique and not null
SELECT order_id, COUNT(*) FROM silver.orders GROUP BY order_id HAVING COUNT(*) > 1 OR order_id IS NULL;
-- Referential integrity: facts pointing to missing dimension rows
SELECT COUNT(*) FROM gold.fact_order_line f LEFT JOIN gold.dim_product p USING (product_sk) WHERE p.product_sk IS NULL;
-- Reconciliation: source and target totals for the loaded day agree
SELECT (SELECT SUM(amount) FROM source_snapshot.orders WHERE order_date = :d) AS source_total,
       (SELECT SUM(amount) FROM silver.orders          WHERE order_date = :d) AS target_total;
-- Volume anomaly: today's row count vs the trailing 7-day average
-- Freshness: MAX(_ingested_at) within the expected window
```

Fail the pipeline (or quarantine the bad rows) when a check fails, rather than publishing bad data.

## DE3.9 Window functions for pipeline tasks 🟡

- **Compress history** to change points: keep a row only when a value differs from the previous one (`WHERE status IS DISTINCT FROM LAG(status) OVER (PARTITION BY order_id ORDER BY changed_at)`), which turns status logs into SCD-like intervals.
- **Build validity ranges** from change events: `valid_to = LEAD(valid_from) OVER (PARTITION BY id ORDER BY valid_from) - 1 day`.
- **Sessionise** events and find **gaps and islands** ([[DA3.9]], [[S3.11]]).
- **Running balances** from transactions with `SUM() OVER (PARTITION BY account ORDER BY ts)`.

## DE3.10 Publishing atomically 🟡

Readers must never see half-loaded data:

- **Table formats** (Delta, Iceberg) commit each write atomically: a failed job leaves the previous version intact, and **time travel** lets you roll back (`RESTORE TABLE … TO VERSION AS OF 42`).
- In classic warehouses: load into a **staging table**, validate, then swap (`ALTER TABLE … RENAME`, `ALTER TABLE … SWITCH PARTITION` in SQL Server, `SWAP WITH` in Snowflake) or wrap the write in a transaction.
- **Write-audit-publish (WAP):** write to a staging branch or table, audit it with checks, then publish, now supported natively in Iceberg (branches) and some catalogs.

> [!lab] Build an idempotent incremental pipeline in DuckDB or PostgreSQL
> Simulate a source `orders` table that receives inserts and status updates over five "days", including duplicates and one late record. Write: a watermark extract with lookback; a deduplicated MERGE into `silver.orders`; an SCD Type 2 `dim_customer` with hashes; a daily `fact_orders` loaded by **partition overwrite**; and the four SQL checks above. Then rerun day 3 twice and prove the results don't change. That's a complete answer to "how do you build a reliable incremental load?".

## DE3.11 Interview drill 🟢 ⭐

| Question | Strong short answer |
|---|---|
| Full vs incremental load? | Reload everything (simple, costly) vs load only new or changed data with watermarks or CDC. |
| What is a watermark? | The last successfully loaded value (max updated_at or ID) from which the next run continues. |
| How do you make a load idempotent? | MERGE on keys or overwrite whole partitions, never blind appends; deterministic run bounds. |
| Why a lookback window? | To catch late-committed or late-arriving rows, which requires idempotent writes. |
| How do you deduplicate to the latest record? | ROW_NUMBER partitioned by key ordered by updated_at desc with a tie-breaker, keep 1 (or QUALIFY). |
| What's a common MERGE failure? | Duplicate keys in the source batch; deduplicate first. Also NULL-unsafe comparisons. |
| How do you implement SCD Type 2? | Close changed current rows (valid_to, is_current false) and insert new versions, in one transaction, detecting change with a hash. |
| How do facts join a Type 2 dimension? | On the natural key and event date between valid_from and valid_to, to get the right surrogate key. |
| How do you handle a fact whose dimension hasn't arrived? | Insert an inferred member (placeholder) and update it later, or map to unknown and repair. |
| Why partition by date? | Partition pruning, cheap retention and idempotent daily overwrites. |
| What's the small-files problem? | Thousands of tiny files slow reads and metadata; compact to roughly 100 MB–1 GB files. |
| Broadcast vs shuffle join? | Copy a small table to all nodes vs redistribute both large tables by key. |
| How do you publish data atomically? | Table-format commits, staging-and-swap, or write-audit-publish. |

## Key takeaways

> [!check]
> - Incremental with watermarks, idempotent with MERGE or partition overwrites.
> - Deduplicate before MERGE, with a deterministic tie-breaker; compare NULL-safely.
> - SCD Type 2 = close and insert, keyed by hashes, in one transaction.
> - Partition by event date, cluster by common filters, compact small files.
> - Check data at every step and publish atomically.

## Sources

- Microsoft Learn: [MERGE (Transact-SQL)](https://learn.microsoft.com/en-us/sql/t-sql/statements/merge-transact-sql), [Partitioned tables and indexes](https://learn.microsoft.com/en-us/sql/relational-databases/partitions/partitioned-tables-and-indexes).
- PostgreSQL documentation: [MERGE](https://www.postgresql.org/docs/current/sql-merge.html), [INSERT … ON CONFLICT](https://www.postgresql.org/docs/current/sql-insert.html).
- Delta Lake: [Upsert with MERGE](https://docs.delta.io/latest/delta-update.html), [Optimizations (OPTIMIZE, Z-order, liquid clustering)](https://docs.delta.io/latest/optimizations-oss.html); Apache Iceberg: [Partitioning (hidden partitioning)](https://iceberg.apache.org/docs/latest/partitioning/), [Branching and WAP](https://iceberg.apache.org/docs/latest/branching/).
- Snowflake: [MERGE](https://docs.snowflake.com/en/sql-reference/sql/merge), [Clustering keys](https://docs.snowflake.com/en/user-guide/tables-clustering-keys); Google Cloud: [Partitioned tables](https://cloud.google.com/bigquery/docs/partitioned-tables), [Clustered tables](https://cloud.google.com/bigquery/docs/clustered-tables).
- Maxime Beauchemin, "[Functional Data Engineering — a modern paradigm for batch data processing](https://maximebeauchemin.medium.com/functional-data-engineering-a-modern-paradigm-for-batch-data-processing-2327ec32c42a)" (idempotent, partition-overwrite pipelines).
- Kimball Group, design tips on SCDs and late-arriving data.
