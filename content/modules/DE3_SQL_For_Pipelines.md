# SQL for Pipelines — Incremental Loads, MERGE, Deduplication, SCD Type 2 and Partitioning

Data-engineering SQL interviews differ from analyst ones: instead of "what was revenue last month?", they ask "load this table incrementally without duplicates", "write the MERGE for an SCD Type 2 dimension", "why is this warehouse query slow?". This module covers the SQL that pipelines are made of. It assumes [[S3]] (joins, windows) and the modelling vocabulary of [[DE2]]. Examples use standard SQL with notes for SQL Server, PostgreSQL, Snowflake, BigQuery and Delta Lake (Databricks, Fabric).

> [!focus]
> **Entry must:** explain full vs incremental loads; write a watermark-based incremental load; deduplicate to the latest record per key; write an upsert with MERGE; explain partitioning and why it speeds queries.
> **Mid adds:** idempotent partition overwrites, SCD Type 2 with MERGE, late-arriving data and lookback windows, change detection with hashes, clustering and file layout, distributed join strategies, reconciliation checks.
> **Most asked:** *How do you load only new data?* · *How do you make a load idempotent?* · *Deduplicate this table keeping the latest row* · *Write a MERGE / upsert* · *Implement SCD Type 2* · *How does partitioning help?* · *How do you handle late-arriving data?*
> **Time budget:** 4 hours.

## DE3.0 Foundations: every run processes a window 🟢

A batch pipeline isn't "copy the table". Each run processes a **bounded slice** of data (a day, or everything changed since the last **watermark**) and writes it so that running the same slice again changes nothing. Three realities make that harder than it sounds:

- Rows **arrive late**: a transaction committed at 09:58 may only become visible at 10:01.
- Runs **fail and are retried**, or are rerun for a past day (a **backfill**).
- Sources **send duplicates**: retried API calls, overlapping extracts, at-least-once streams.

So the read side overlaps a little (a **lookback**), and the write side is **idempotent** (MERGE on keys, or overwrite the partition) ([[DE1.6]]). This module is the SQL toolkit for both.

<figure class="dia steps"><svg viewBox="0 0 720 214" role="img" aria-label="Incremental loading with a watermark: run 1 loads rows up to 10:00, a row committed at 09:58 appears late, run 2 starts five minutes before the watermark to catch it, and an idempotent MERGE absorbs the overlap">
<line class="sLm" x1="60" y1="150" x2="668" y2="150" marker-end="url(#ahm)"/>
<line class="sLm" x1="60" y1="146" x2="60" y2="154"/><text class="sC" x="60" y="172" text-anchor="middle">08:00</text>
<line class="sLm" x1="210" y1="146" x2="210" y2="154"/><text class="sC" x="210" y="172" text-anchor="middle">09:00</text>
<line class="sLm" x1="360" y1="146" x2="360" y2="154"/><text class="sC" x="360" y="172" text-anchor="middle">10:00</text>
<line class="sLm" x1="510" y1="146" x2="510" y2="154"/><text class="sC" x="510" y="172" text-anchor="middle">11:00</text>
<line class="sLm" x1="660" y1="146" x2="660" y2="154"/><text class="sC" x="660" y="172" text-anchor="middle">12:00</text>
<circle class="sP" cx="110" cy="150" r="5"/>
<circle class="sP" cx="172" cy="150" r="5"/>
<circle class="sP" cx="260" cy="150" r="5"/>
<circle class="sP" cx="335" cy="150" r="5"/>
<circle class="sP" cx="460" cy="150" r="5"/>
<circle class="sP" cx="498" cy="150" r="5"/>
<circle class="sP" cx="610" cy="150" r="5"/>
<text class="sC" x="56" y="136">rows by updated_at</text>
<g data-s="1"><rect class="sA" x="60" y="40" width="300" height="26" rx="4"/><text class="sT" x="210" y="58" text-anchor="middle">run 1: up to 10:00</text><line class="sLw" x1="360" y1="32" x2="360" y2="160" stroke-width="2"/><text class="sWt" x="364" y="30">watermark 10:00</text></g>
<g data-s="2"><circle class="sPr" cx="355" cy="150" r="7"/><text class="sRt" x="355" y="200" text-anchor="middle">committed 09:58, visible only at 10:01</text></g>
<g data-s="3"><rect class="sG" x="347.5" y="78" width="162.5" height="26" rx="4"/><text class="sT" x="428.75" y="96" text-anchor="middle">run 2: 09:55 → 11:00</text><rect class="sW" x="347.5" y="108" width="12.5" height="10" rx="2"/><text class="sWt" x="260" y="118" text-anchor="end">lookback overlap</text></g>
<g data-s="4"><text class="sGt" x="585" y="96">MERGE on order_id:</text><text class="sGt" x="585" y="114">overlap rows update,</text><text class="sGt" x="585" y="132">never duplicate</text></g>
</svg><ol class="dia-steps">
<li>Run 1 loads every row changed up to 10:00 and stores 10:00 as the <b>watermark</b>.</li>
<li>A long transaction committed at 09:58 only becomes visible at 10:01. A run starting exactly at the watermark would never see it.</li>
<li>Run 2 reads from the watermark minus a small <b>lookback</b> (five minutes), so it catches the late row and re-reads a few already-loaded ones.</li>
<li>Because the write is a <code>MERGE</code> on the key, the re-read rows update in place. Lookback is only safe with an idempotent write.</li>
</ol><figcaption>Read a little more than you need; write so that reading too much is harmless.</figcaption></figure>

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

<figure class="dia"><svg viewBox="0 0 720 276" role="img" aria-label="MERGE outcomes for a staging batch against a target: unchanged matches are skipped, changed matches update, new keys insert, and target-only rows are kept or deleted">
<text class="sM" x="130" y="22" text-anchor="middle">staging (this batch)</text><text class="sM" x="590" y="22" text-anchor="middle">target table (before)</text>
<rect class="sB" x="60" y="34" width="140" height="28" rx="4"/><text class="sC" x="130" y="53" text-anchor="middle">id 1 · Giza</text>
<rect class="sW" x="60" y="68" width="140" height="28" rx="4"/><text class="sC" x="130" y="87" text-anchor="middle">id 2 · Cairo</text>
<rect class="sG" x="60" y="102" width="140" height="28" rx="4"/><text class="sC" x="130" y="121" text-anchor="middle">id 4 · Alex</text>
<rect class="sN" x="520" y="34" width="140" height="28" rx="4"/><text class="sC" x="590" y="53" text-anchor="middle">id 1 · Giza</text>
<rect class="sN" x="520" y="68" width="140" height="28" rx="4"/><text class="sC" x="590" y="87" text-anchor="middle">id 2 · Giza</text>
<rect class="sN" x="520" y="102" width="140" height="28" rx="4"/><text class="sC" x="590" y="121" text-anchor="middle">id 3 · Tanta</text>
<rect class="sB" x="150" y="150" width="420" height="26" rx="5" opacity=".7"/><text class="sC" x="160" y="168">matched, unchanged (hash equal)</text><text class="sT" x="560" y="168" text-anchor="end">skip: no write</text>
<rect class="sW" x="150" y="180" width="420" height="26" rx="5" opacity=".7"/><text class="sC" x="160" y="198">matched, changed</text><text class="sT" x="560" y="198" text-anchor="end">UPDATE id 2 → Cairo</text>
<rect class="sG" x="150" y="210" width="420" height="26" rx="5" opacity=".7"/><text class="sC" x="160" y="228">not matched in target</text><text class="sT" x="560" y="228" text-anchor="end">INSERT id 4</text>
<rect class="sN" x="150" y="240" width="420" height="26" rx="5" opacity=".7"/><text class="sC" x="160" y="258">only in target</text><text class="sT" x="560" y="258" text-anchor="end">keep, or DELETE if a full snapshot</text>
</svg><figcaption>A MERGE is four decisions per key. Say all four in an interview, including what happens to rows missing from the batch.</figcaption></figure>

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

<figure class="dia"><svg viewBox="0 0 720 204" role="img" aria-label="Four versions of order 7 numbered by ROW_NUMBER ordered by updated_at and then ingestion time; only the row numbered 1 is kept">
<rect class="sN" x="60" y="20" width="90" height="24" rx="0"/><text class="sT" x="105" y="37" text-anchor="middle">order_id</text>
<rect class="sN" x="150" y="20" width="100" height="24" rx="0"/><text class="sT" x="200" y="37" text-anchor="middle">status</text>
<rect class="sN" x="250" y="20" width="130" height="24" rx="0"/><text class="sT" x="315" y="37" text-anchor="middle">updated_at</text>
<rect class="sN" x="380" y="20" width="130" height="24" rx="0"/><text class="sT" x="445" y="37" text-anchor="middle">_ingested_at</text>
<rect class="sN" x="510" y="20" width="50" height="24" rx="0"/><text class="sT" x="535" y="37" text-anchor="middle">rn</text>
<rect class="sG" x="60" y="44" width="90" height="26" rx="0" opacity=".45"/><text class="sC" x="105" y="62" text-anchor="middle">7</text>
<rect class="sG" x="150" y="44" width="100" height="26" rx="0" opacity=".45"/><text class="sC" x="200" y="62" text-anchor="middle">delivered</text>
<rect class="sG" x="250" y="44" width="130" height="26" rx="0" opacity=".45"/><text class="sC" x="315" y="62" text-anchor="middle">10:42</text>
<rect class="sG" x="380" y="44" width="130" height="26" rx="0" opacity=".45"/><text class="sC" x="445" y="62" text-anchor="middle">10:45:03</text>
<rect class="sG" x="510" y="44" width="50" height="26" rx="0" opacity=".45"/><text class="sC" x="535" y="62" text-anchor="middle">1</text>
<rect class="sR" x="60" y="70" width="90" height="26" rx="0" opacity=".45"/><text class="sC" x="105" y="88" text-anchor="middle">7</text>
<rect class="sR" x="150" y="70" width="100" height="26" rx="0" opacity=".45"/><text class="sC" x="200" y="88" text-anchor="middle">delivered</text>
<rect class="sR" x="250" y="70" width="130" height="26" rx="0" opacity=".45"/><text class="sC" x="315" y="88" text-anchor="middle">10:42</text>
<rect class="sR" x="380" y="70" width="130" height="26" rx="0" opacity=".45"/><text class="sC" x="445" y="88" text-anchor="middle">10:45:01</text>
<rect class="sR" x="510" y="70" width="50" height="26" rx="0" opacity=".45"/><text class="sC" x="535" y="88" text-anchor="middle">2</text>
<rect class="sR" x="60" y="96" width="90" height="26" rx="0" opacity=".45"/><text class="sC" x="105" y="114" text-anchor="middle">7</text>
<rect class="sR" x="150" y="96" width="100" height="26" rx="0" opacity=".45"/><text class="sC" x="200" y="114" text-anchor="middle">picked up</text>
<rect class="sR" x="250" y="96" width="130" height="26" rx="0" opacity=".45"/><text class="sC" x="315" y="114" text-anchor="middle">10:20</text>
<rect class="sR" x="380" y="96" width="130" height="26" rx="0" opacity=".45"/><text class="sC" x="445" y="114" text-anchor="middle">10:21:30</text>
<rect class="sR" x="510" y="96" width="50" height="26" rx="0" opacity=".45"/><text class="sC" x="535" y="114" text-anchor="middle">3</text>
<rect class="sR" x="60" y="122" width="90" height="26" rx="0" opacity=".45"/><text class="sC" x="105" y="140" text-anchor="middle">7</text>
<rect class="sR" x="150" y="122" width="100" height="26" rx="0" opacity=".45"/><text class="sC" x="200" y="140" text-anchor="middle">placed</text>
<rect class="sR" x="250" y="122" width="130" height="26" rx="0" opacity=".45"/><text class="sC" x="315" y="140" text-anchor="middle">10:02</text>
<rect class="sR" x="380" y="122" width="130" height="26" rx="0" opacity=".45"/><text class="sC" x="445" y="140" text-anchor="middle">10:03:11</text>
<rect class="sR" x="510" y="122" width="50" height="26" rx="0" opacity=".45"/><text class="sC" x="535" y="140" text-anchor="middle">4</text>
<text class="sGt" x="580" y="64">← keep rn = 1</text><text class="sRt" x="580" y="96">a retried API call</text><text class="sRt" x="580" y="112">sent row 2 twice</text>
<text class="sC" x="330" y="172" text-anchor="middle">ROW_NUMBER() OVER (PARTITION BY order_id ORDER BY updated_at DESC, _ingested_at DESC)</text>
<text class="sS" x="330" y="192" text-anchor="middle">the second ORDER BY column breaks the tie, so reruns keep the same row</text>
</svg><figcaption>Latest version per key, with a deterministic tie-breaker. Without it, two identical timestamps make reruns pick different rows.</figcaption></figure>

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

<figure class="dia steps"><svg viewBox="0 0 720 232" role="img" aria-label="SCD Type 2 for a customer who moves from Cairo to Giza: the current row is closed with a valid_to date and is_current false, a new row with a new surrogate key becomes current, and orders join to whichever version was valid on their date">
<rect class="sN" x="40" y="30" width="96" height="24" rx="0"/><text class="sT" x="88" y="46" text-anchor="middle">customer_sk</text>
<rect class="sN" x="136" y="30" width="90" height="24" rx="0"/><text class="sT" x="181" y="46" text-anchor="middle">customer_id</text>
<rect class="sN" x="226" y="30" width="70" height="24" rx="0"/><text class="sT" x="261" y="46" text-anchor="middle">city</text>
<rect class="sN" x="296" y="30" width="100" height="24" rx="0"/><text class="sT" x="346" y="46" text-anchor="middle">valid_from</text>
<rect class="sN" x="396" y="30" width="100" height="24" rx="0"/><text class="sT" x="446" y="46" text-anchor="middle">valid_to</text>
<rect class="sN" x="496" y="30" width="84" height="24" rx="0"/><text class="sT" x="538" y="46" text-anchor="middle">is_current</text>
<text class="sM" x="14" y="22">gold.dim_customer</text>
<g data-s="1-1"><rect class="sB" x="40" y="54" width="96" height="24" rx="0"/><text class="sC" x="88" y="70" text-anchor="middle">101</text><rect class="sB" x="136" y="54" width="90" height="24" rx="0"/><text class="sC" x="181" y="70" text-anchor="middle">42</text><rect class="sB" x="226" y="54" width="70" height="24" rx="0"/><text class="sC" x="261" y="70" text-anchor="middle">Cairo</text><rect class="sB" x="296" y="54" width="100" height="24" rx="0"/><text class="sC" x="346" y="70" text-anchor="middle">2024-05-01</text><rect class="sB" x="396" y="54" width="100" height="24" rx="0"/><text class="sC" x="446" y="70" text-anchor="middle">9999-12-31</text><rect class="sB" x="496" y="54" width="84" height="24" rx="0"/><text class="sC" x="538" y="70" text-anchor="middle">true</text></g>
<g data-s="1-1"><rect class="sA" x="560" y="96" width="146" height="50" rx="8"/><text class="sT" x="633" y="116" text-anchor="middle">batch: 42 moved</text><text class="sS" x="633" y="134" text-anchor="middle">to Giza, 2026-03-01</text></g>
<g data-s="2-4"><rect class="sN" x="40" y="54" width="96" height="24" rx="0" opacity=".7"/><text class="sC" x="88" y="70" text-anchor="middle">101</text><rect class="sN" x="136" y="54" width="90" height="24" rx="0" opacity=".7"/><text class="sC" x="181" y="70" text-anchor="middle">42</text><rect class="sN" x="226" y="54" width="70" height="24" rx="0" opacity=".7"/><text class="sC" x="261" y="70" text-anchor="middle">Cairo</text><rect class="sN" x="296" y="54" width="100" height="24" rx="0" opacity=".7"/><text class="sC" x="346" y="70" text-anchor="middle">2024-05-01</text><rect class="sN" x="396" y="54" width="100" height="24" rx="0" opacity=".7"/><text class="sC" x="446" y="70" text-anchor="middle">2026-02-28</text><rect class="sN" x="496" y="54" width="84" height="24" rx="0" opacity=".7"/><text class="sC" x="538" y="70" text-anchor="middle">false</text></g>
<g data-s="2-2"><text class="sWt" x="446" y="92" text-anchor="middle">step 1: UPDATE closes the old version</text></g>
<g data-s="3-4"><rect class="sG" x="40" y="78" width="96" height="24" rx="0" opacity=".6"/><text class="sC" x="88" y="94" text-anchor="middle">205</text><rect class="sG" x="136" y="78" width="90" height="24" rx="0" opacity=".6"/><text class="sC" x="181" y="94" text-anchor="middle">42</text><rect class="sG" x="226" y="78" width="70" height="24" rx="0" opacity=".6"/><text class="sC" x="261" y="94" text-anchor="middle">Giza</text><rect class="sG" x="296" y="78" width="100" height="24" rx="0" opacity=".6"/><text class="sC" x="346" y="94" text-anchor="middle">2026-03-01</text><rect class="sG" x="396" y="78" width="100" height="24" rx="0" opacity=".6"/><text class="sC" x="446" y="94" text-anchor="middle">9999-12-31</text><rect class="sG" x="496" y="78" width="84" height="24" rx="0" opacity=".6"/><text class="sC" x="538" y="94" text-anchor="middle">true</text></g>
<g data-s="3-3"><text class="sGt" x="296" y="118" text-anchor="middle">step 2: INSERT the new version with a new surrogate key</text></g>
<g data-s="4"><text class="sM" x="14" y="152">facts look up the version valid on their date:</text><rect class="sN" x="40" y="162" width="210" height="26" rx="4"/><text class="sC" x="145" y="180" text-anchor="middle">order 7, 2026-02-10</text><line class="sLm" x1="250" y1="175" x2="300" y2="175" marker-end="url(#ahm)"/><text class="sC" x="306" y="180">customer_sk 101 (Cairo)</text><rect class="sN" x="40" y="194" width="210" height="26" rx="4"/><text class="sC" x="145" y="212" text-anchor="middle">order 9, 2026-03-15</text><line class="sLm" x1="250" y1="207" x2="300" y2="207" marker-end="url(#ahm)"/><text class="sGt" x="306" y="212">customer_sk 205 (Giza)</text></g>
</svg><ol class="dia-steps">
<li>The dimension holds one current row for customer 42 (Cairo, open-ended). The day's batch says the customer moved to Giza on 2026-03-01.</li>
<li>Step 1: the row hash differs, so <code>UPDATE</code> closes the current version: <code>valid_to</code> = the day before the change, <code>is_current</code> = false.</li>
<li>Step 2: <code>INSERT</code> the new version with a new surrogate key, <code>valid_from</code> 2026-03-01 and an open end. Both steps run in one transaction.</li>
<li>Facts join on the business key <em>and</em> the date range, so February's order stays with Cairo and March's goes to Giza: history is preserved.</li>
</ol><figcaption>SCD Type 2 keeps history by versioning rows, not overwriting them.</figcaption></figure>

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

<figure class="dia"><svg viewBox="0 0 720 198" role="img" aria-label="A table partitioned by day: a direct date filter reads three partitions, while wrapping the column in a function reads all thirty">
<text class="sM" x="14" y="22">fact_events partitioned by event_date</text>
<rect class="sN" x="14" y="34" width="20" height="40" rx="2"/>
<rect class="sN" x="37" y="34" width="20" height="40" rx="2"/>
<rect class="sN" x="60" y="34" width="20" height="40" rx="2"/>
<rect class="sN" x="83" y="34" width="20" height="40" rx="2"/>
<rect class="sN" x="106" y="34" width="20" height="40" rx="2"/>
<rect class="sN" x="129" y="34" width="20" height="40" rx="2"/>
<rect class="sN" x="152" y="34" width="20" height="40" rx="2"/>
<rect class="sN" x="175" y="34" width="20" height="40" rx="2"/>
<rect class="sN" x="198" y="34" width="20" height="40" rx="2"/>
<rect class="sN" x="221" y="34" width="20" height="40" rx="2"/>
<rect class="sN" x="244" y="34" width="20" height="40" rx="2"/>
<rect class="sN" x="267" y="34" width="20" height="40" rx="2"/>
<rect class="sN" x="290" y="34" width="20" height="40" rx="2"/>
<rect class="sN" x="313" y="34" width="20" height="40" rx="2"/>
<rect class="sN" x="336" y="34" width="20" height="40" rx="2"/>
<rect class="sN" x="359" y="34" width="20" height="40" rx="2"/>
<rect class="sN" x="382" y="34" width="20" height="40" rx="2"/>
<rect class="sN" x="405" y="34" width="20" height="40" rx="2"/>
<rect class="sN" x="428" y="34" width="20" height="40" rx="2"/>
<rect class="sN" x="451" y="34" width="20" height="40" rx="2"/>
<rect class="sN" x="474" y="34" width="20" height="40" rx="2"/>
<rect class="sN" x="497" y="34" width="20" height="40" rx="2"/>
<rect class="sN" x="520" y="34" width="20" height="40" rx="2"/>
<rect class="sN" x="543" y="34" width="20" height="40" rx="2"/>
<rect class="sN" x="566" y="34" width="20" height="40" rx="2"/>
<rect class="sN" x="589" y="34" width="20" height="40" rx="2"/>
<rect class="sN" x="612" y="34" width="20" height="40" rx="2"/>
<rect class="sN" x="635" y="34" width="20" height="40" rx="2"/>
<rect class="sN" x="658" y="34" width="20" height="40" rx="2"/>
<rect class="sN" x="681" y="34" width="20" height="40" rx="2"/>
<text class="sGt" x="14" y="98">WHERE event_date &gt;= '2026-10-28'</text>
<rect class="sG" x="635" y="34" width="20" height="40" rx="2"/>
<rect class="sG" x="658" y="34" width="20" height="40" rx="2"/>
<rect class="sG" x="681" y="34" width="20" height="40" rx="2"/>
<text class="sGt" x="460" y="98">3 of 30 partitions read</text>
<text class="sRt" x="14" y="130">WHERE MONTH(event_date) = 10</text><text class="sRt" x="460" y="130">function on the column: all 30 read</text>
<rect class="sR" x="14" y="142" width="20" height="14" rx="2" opacity=".6"/>
<rect class="sR" x="37" y="142" width="20" height="14" rx="2" opacity=".6"/>
<rect class="sR" x="60" y="142" width="20" height="14" rx="2" opacity=".6"/>
<rect class="sR" x="83" y="142" width="20" height="14" rx="2" opacity=".6"/>
<rect class="sR" x="106" y="142" width="20" height="14" rx="2" opacity=".6"/>
<rect class="sR" x="129" y="142" width="20" height="14" rx="2" opacity=".6"/>
<rect class="sR" x="152" y="142" width="20" height="14" rx="2" opacity=".6"/>
<rect class="sR" x="175" y="142" width="20" height="14" rx="2" opacity=".6"/>
<rect class="sR" x="198" y="142" width="20" height="14" rx="2" opacity=".6"/>
<rect class="sR" x="221" y="142" width="20" height="14" rx="2" opacity=".6"/>
<rect class="sR" x="244" y="142" width="20" height="14" rx="2" opacity=".6"/>
<rect class="sR" x="267" y="142" width="20" height="14" rx="2" opacity=".6"/>
<rect class="sR" x="290" y="142" width="20" height="14" rx="2" opacity=".6"/>
<rect class="sR" x="313" y="142" width="20" height="14" rx="2" opacity=".6"/>
<rect class="sR" x="336" y="142" width="20" height="14" rx="2" opacity=".6"/>
<rect class="sR" x="359" y="142" width="20" height="14" rx="2" opacity=".6"/>
<rect class="sR" x="382" y="142" width="20" height="14" rx="2" opacity=".6"/>
<rect class="sR" x="405" y="142" width="20" height="14" rx="2" opacity=".6"/>
<rect class="sR" x="428" y="142" width="20" height="14" rx="2" opacity=".6"/>
<rect class="sR" x="451" y="142" width="20" height="14" rx="2" opacity=".6"/>
<rect class="sR" x="474" y="142" width="20" height="14" rx="2" opacity=".6"/>
<rect class="sR" x="497" y="142" width="20" height="14" rx="2" opacity=".6"/>
<rect class="sR" x="520" y="142" width="20" height="14" rx="2" opacity=".6"/>
<rect class="sR" x="543" y="142" width="20" height="14" rx="2" opacity=".6"/>
<rect class="sR" x="566" y="142" width="20" height="14" rx="2" opacity=".6"/>
<rect class="sR" x="589" y="142" width="20" height="14" rx="2" opacity=".6"/>
<rect class="sR" x="612" y="142" width="20" height="14" rx="2" opacity=".6"/>
<rect class="sR" x="635" y="142" width="20" height="14" rx="2" opacity=".6"/>
<rect class="sR" x="658" y="142" width="20" height="14" rx="2" opacity=".6"/>
<rect class="sR" x="681" y="142" width="20" height="14" rx="2" opacity=".6"/>
<text class="sS" x="360" y="186" text-anchor="middle">filter the partition column directly so the engine can skip whole folders</text>
</svg><figcaption>Partition pruning is the cheapest optimisation there is, and the easiest to defeat by accident.</figcaption></figure>

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

<figure class="dia"><svg viewBox="0 0 720 192" role="img" aria-label="Write-audit-publish: data is written to staging, audited with checks, and published atomically; failing checks stop publication while readers keep seeing the previous version">
<rect class="sV" x="40" y="40" width="190" height="56" rx="8"/><text class="sT" x="135" y="66" text-anchor="middle">write</text><text class="sC" x="135" y="82" text-anchor="middle">to staging or a branch</text>
<line class="sLm" x1="230" y1="68" x2="266" y2="68" marker-end="url(#ahm)"/>
<rect class="sW" x="270" y="40" width="190" height="56" rx="8"/><text class="sT" x="365" y="66" text-anchor="middle">audit</text><text class="sC" x="365" y="82" text-anchor="middle">counts, nulls, keys</text>
<line class="sLm" x1="460" y1="68" x2="496" y2="68" marker-end="url(#ahm)"/>
<rect class="sG" x="500" y="40" width="190" height="56" rx="8"/><text class="sT" x="595" y="66" text-anchor="middle">publish</text><text class="sC" x="595" y="82" text-anchor="middle">atomic swap or commit</text>
<line class="sLr" x1="325" y1="96" x2="325" y2="130" marker-end="url(#ahr)"/><rect class="sR" x="240" y="132" width="170" height="46" rx="8"/><text class="sT" x="325" y="153" text-anchor="middle">checks fail</text><text class="sC" x="325" y="169" text-anchor="middle">stop; nothing published</text>
<rect class="sB" x="500" y="130" width="206" height="50" rx="8"/><text class="sC" x="603" y="150" text-anchor="middle">readers see yesterday's</text><text class="sC" x="603" y="168" text-anchor="middle">table until the swap</text>
</svg><figcaption>Readers should never see half-loaded or unchecked data. Table formats make the publish step a single atomic commit.</figcaption></figure>

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
