# Python for Pipelines — Ingestion, Files, Parquet, Validation, Testing and Packaging

Python is the glue language of data engineering: API ingestion jobs, file processing, orchestration code (Airflow DAGs are Python), PySpark jobs, data validation and tests. DE interviews test whether you write Python like a **software engineer**, structured, tested and robust, and not like a notebook. That's your advantage: you bring testing, packaging and error handling from .NET. Your gaps file notes that your current pipeline experience is in C#, and suggests rewriting FinSight's aggregation as a Python job; this module gives you what you need to do it well. [[S7]] covers pandas itself.

> [!focus]
> **Entry must:** write a script that pulls from a paginated API with retries and lands raw data with metadata; read and write CSV, JSON and Parquet correctly; load data into a database in bulk; structure code into functions with logging and configuration; write pytest tests for transformations.
> **Mid adds:** incremental API ingestion, Parquet and Arrow internals, choosing pandas vs Polars vs DuckDB vs Spark, schema validation with Pydantic or pandera, packaging a pipeline with `pyproject.toml`, concurrency for I/O, integration tests with real services.
> **Most asked:** *How would you ingest data from a REST API?* · *How do you handle rate limits and failures?* · *Why Parquet?* · *Process a file bigger than memory* · *How do you test a pipeline?* · *pandas vs Spark?*
> **Time budget:** 3.5 hours.

## DE4.0 Foundations: a pipeline is a program with edges 🟢

A data pipeline is ordinary software: it **reads** from somewhere, **checks** what it read, **transforms** it and **writes** it somewhere else. What makes pipeline code hard isn't the transformations; it's the edges, where networks fail, files are malformed and writes happen twice.

The habit that helps most is to keep **I/O at the edges** and **logic in the middle**. Reading and writing live in thin functions; validation and transformation are **pure functions** (data in, data out, nothing else touched), driven by a **run date** parameter so the same code serves today's run, a rerun and a backfill.

<figure class="dia anim"><svg viewBox="0 0 720 220" role="img" aria-label="Animation: a pipeline of extract, land raw, validate, transform and load, with validation and transformation as pure functions in the middle, I/O at the edges, and a date parameter driving each run">
<rect class="sB" x="14" y="60" width="124" height="56" rx="8"/><text class="sT" x="76" y="86" text-anchor="middle">extract</text><text class="sC" x="76" y="102" text-anchor="middle">API · DB · files</text>
<line class="sLm" x1="138" y1="88" x2="152" y2="88" marker-end="url(#ahm)"/>
<rect class="sW" x="154" y="60" width="124" height="56" rx="8"/><text class="sT" x="216" y="86" text-anchor="middle">land raw</text><text class="sC" x="216" y="102" text-anchor="middle">bronze JSONL</text>
<line class="sLm" x1="278" y1="88" x2="292" y2="88" marker-end="url(#ahm)"/>
<rect class="sV" x="294" y="60" width="124" height="56" rx="8"/><text class="sT" x="356" y="86" text-anchor="middle">validate</text><text class="sC" x="356" y="102" text-anchor="middle">schema checks</text>
<line class="sLm" x1="418" y1="88" x2="432" y2="88" marker-end="url(#ahm)"/>
<rect class="sA" x="434" y="60" width="124" height="56" rx="8"/><text class="sT" x="496" y="86" text-anchor="middle">transform</text><text class="sC" x="496" y="102" text-anchor="middle">pure function</text>
<line class="sLm" x1="558" y1="88" x2="572" y2="88" marker-end="url(#ahm)"/>
<rect class="sG" x="574" y="60" width="124" height="56" rx="8"/><text class="sT" x="636" y="86" text-anchor="middle">load</text><text class="sC" x="636" y="102" text-anchor="middle">staging → MERGE</text>
<rect class="sN" x="290" y="40" width="260" height="96" rx="10" style="fill:none" stroke-dasharray="6 4"/><text class="sGt" x="420" y="34" text-anchor="middle">pure: easy to unit-test</text>
<text class="sC" x="80" y="150" text-anchor="middle">I/O edge</text><text class="sC" x="220" y="150" text-anchor="middle">I/O edge</text><text class="sC" x="640" y="150" text-anchor="middle">I/O edge</text>
<rect class="sW" x="240" y="172" width="240" height="36" rx="18" opacity=".7"/><text class="sC" x="256" y="195" xml:space="preserve" style="white-space:pre">run --date 2026-10-08</text>
<line class="sLw" x1="360" y1="172" x2="360" y2="140" marker-end="url(#ahw)"/>
<text class="sC" x="492" y="194">today, a rerun or a backfill</text>
<circle class="sP" r="5"><animateMotion dur="4s" repeatCount="indefinite" path="M76 88 H640"/></circle>
</svg><figcaption>Keep I/O at the edges and logic in the middle. The middle is where bugs hide, and pure functions are where tests are cheap.</figcaption></figure>

## DE4.1 Write pipelines like software 🟢 ⭐

```text
sales-pipeline/
  pyproject.toml            # dependencies, tools (ruff, pytest), entry points
  uv.lock                   # pinned versions
  src/sales_pipeline/
    __init__.py
    config.py               # settings from environment variables, validated
    extract/paymob_api.py   # one module per source
    transform/orders.py     # pure functions: DataFrame in, DataFrame out
    load/warehouse.py
    cli.py                  # `sales-pipeline run --date 2026-10-02`
  tests/
    test_transform_orders.py
    fixtures/orders_sample.json
```

- **Pure transformation functions** (input → output, no hidden I/O) are easy to test and reuse in Airflow, a notebook or Spark.
- **Configuration from the environment**, validated at start-up (`pydantic-settings`), and secrets from a vault ([[S10.6]]).
- **Logging** with the standard `logging` module (structured JSON in production), never `print`.
- **Type hints** and a linter (`ruff`), plus a type checker for larger code.
- **A CLI with a date parameter**, so the same code runs for today, a backfill, or a rerun ([[DE1.6]]).

## DE4.2 Ingesting from an API 🟢 🟡 ⭐

```python
import json, logging, time
from datetime import datetime, timezone
import httpx
from tenacity import retry, stop_after_attempt, wait_exponential_jitter, retry_if_exception

log = logging.getLogger(__name__)

def _retryable(exc: BaseException) -> bool:
    return isinstance(exc, httpx.TransportError) or (
        isinstance(exc, httpx.HTTPStatusError) and exc.response.status_code in (429, 500, 502, 503, 504))

@retry(retry=retry_if_exception(_retryable), stop=stop_after_attempt(6), wait=wait_exponential_jitter(initial=1, max=60))
def get_page(client: httpx.Client, url: str, params: dict) -> dict:
    r = client.get(url, params=params, timeout=30)
    if r.status_code == 429 and "Retry-After" in r.headers:
        time.sleep(int(r.headers["Retry-After"]))           # respect the server's rate limit
    r.raise_for_status()
    return r.json()

def extract_orders(updated_since: datetime, run_id: str, out_path: str) -> int:
    """Pull all orders updated since the watermark, page by page, into JSON Lines (bronze)."""
    count, cursor = 0, None
    with httpx.Client(base_url="https://api.example-shop.com", headers={"Authorization": f"Bearer {token()}"}) as client, \
         open(out_path, "w", encoding="utf-8") as out:
        while True:
            params = {"updated_since": updated_since.isoformat(), "limit": 500, **({"cursor": cursor} if cursor else {})}
            page = get_page(client, "/v1/orders", params)
            for rec in page["data"]:
                out.write(json.dumps({**rec, "_run_id": run_id,
                                      "_ingested_at": datetime.now(timezone.utc).isoformat()}, ensure_ascii=False) + "\n")
            count += len(page["data"])
            cursor = page.get("next_cursor")
            if not cursor:
                break
    log.info("extracted %s orders since %s", count, updated_since)
    return count
```

What makes this production-grade:

- **Incremental** by an `updated_since` watermark ([[DE3.1]]).
- **Pagination** by cursor (stable) rather than page numbers where the API allows it ([[B4.3]]).
- **Retries** only on transient errors (network failures, 429, 5xx), with **exponential backoff and jitter**, and honouring `Retry-After` ([[B11.8]]).
- **Timeouts** on every request.
- **Raw landing** in bronze as **JSON Lines** with lineage metadata (`_run_id`, `_ingested_at`), before any transformation, so you can always reprocess.
- `ensure_ascii=False` keeps Arabic text readable in the files.

<figure class="dia"><svg viewBox="0 0 720 210" role="img" aria-label="Retries with exponential backoff: a 503, a 429 and a timeout are retried after waits of about one, two and four seconds with random jitter, and the fourth attempt succeeds">
<line class="sLm" x1="60" y1="120" x2="662" y2="120" marker-end="url(#ahm)"/>
<text class="sC" x="60" y="140" text-anchor="middle">0 s</text>
<text class="sC" x="130" y="140" text-anchor="middle">1 s</text>
<text class="sC" x="200" y="140" text-anchor="middle">2 s</text>
<text class="sC" x="270" y="140" text-anchor="middle">3 s</text>
<text class="sC" x="340" y="140" text-anchor="middle">4 s</text>
<text class="sC" x="410" y="140" text-anchor="middle">5 s</text>
<text class="sC" x="480" y="140" text-anchor="middle">6 s</text>
<text class="sC" x="550" y="140" text-anchor="middle">7 s</text>
<text class="sC" x="620" y="140" text-anchor="middle">8 s</text>
<circle class="sPr" cx="60" cy="120" r="8"/><text class="sRt" x="60" y="100" text-anchor="middle">try 1: 503</text>
<circle class="sPr" cx="144" cy="120" r="8"/><text class="sRt" x="144" y="100" text-anchor="middle">try 2: 429</text>
<circle class="sPr" cx="291" cy="120" r="8"/><text class="sRt" x="291" y="100" text-anchor="middle">try 3: timeout</text>
<circle class="sPg" cx="592" cy="120" r="8"/><text class="sGt" x="592" y="100" text-anchor="middle">try 4: 200 ✓</text>
<path class="sLw" d="M70 158 Q 102 180 134 158" fill="none" marker-end="url(#ahw)"/><text class="sWt" x="102" y="196" text-anchor="middle">wait 1 s + jitter</text>
<path class="sLw" d="M154 158 Q 218 180 281 158" fill="none" marker-end="url(#ahw)"/><text class="sWt" x="217.5" y="196" text-anchor="middle">2 s + jitter</text>
<path class="sLw" d="M301 158 Q 442 180 582 158" fill="none" marker-end="url(#ahw)"/><text class="sWt" x="441.5" y="196" text-anchor="middle">4 s + jitter</text>
<text class="sS" x="360" y="30" text-anchor="middle">retry only transient errors (network, 429, 5xx); honour Retry-After; cap the attempts</text>
<text class="sC" x="360" y="54" text-anchor="middle">a 400 or 401 is a bug or a config error: retrying it just wastes the rate limit</text>
</svg><figcaption>Exponential backoff gives the server room to recover; jitter stops a thousand clients from retrying in lockstep.</figcaption></figure>

> [!term] JSON Lines (NDJSON)
> One JSON object per line. It can be appended to and streamed line by line, unlike one giant JSON array, which must be parsed whole. The standard landing format for API and event data.

The open-source **dlt** library ("data load tool") packages many of these concerns (incremental cursors, schema inference and evolution, loading to warehouses) if you'd rather not hand-write them.

## DE4.3 Files: CSV traps and why Parquet 🟢 ⭐

**CSV pitfalls you will meet:**

- **Encoding:** Arabic text from older Egyptian systems and Excel exports may be **Windows-1256** or UTF-8 **with a BOM**, not plain UTF-8. Read with an explicit `encoding=` (`"utf-8-sig"`, `"cp1256"`), and write UTF-8.
- Delimiters (`;` in some locales), quoted fields containing commas or newlines, inconsistent decimal separators and date formats, a "total" row at the bottom, header rows repeated mid-file.
- Leading zeros lost when phone numbers or IDs are read as numbers: read them as strings.

```python
import pandas as pd
df = pd.read_csv("export.csv", encoding="utf-8-sig", dtype={"phone": "string", "national_id": "string"},
                 parse_dates=["created_at"], thousands=",")
```

> [!term] Parquet
> A **columnar**, compressed, binary file format with a schema stored inside. Files are typically 5–10× smaller than CSV, keep data types exact (no guessing dates or leading zeros), and let engines read only the needed columns and skip row groups using stored min/max statistics. It's the storage format underneath Delta Lake and Iceberg ([[DE5]]).

<figure class="dia"><svg viewBox="0 0 720 232" role="img" aria-label="Anatomy of a Parquet file: row groups containing column chunks, and a footer with the schema and min and max statistics that let readers skip data">
<rect class="sN" x="14" y="20" width="380" height="200" rx="10"/><text class="sT" x="204" y="40" text-anchor="middle">orders.parquet</text>
<rect class="sB" x="30" y="52" width="348" height="60" rx="6" opacity=".5"/><text class="sC" x="40" y="66">row group 1</text>
<rect class="sA" x="40" y="74" width="78" height="30" rx="4"/><text class="sC" x="79" y="94" text-anchor="middle">order_id</text>
<rect class="sV" x="124" y="74" width="78" height="30" rx="4"/><text class="sC" x="163" y="94" text-anchor="middle">date</text>
<rect class="sW" x="208" y="74" width="78" height="30" rx="4"/><text class="sC" x="247" y="94" text-anchor="middle">city</text>
<rect class="sG" x="292" y="74" width="78" height="30" rx="4"/><text class="sC" x="331" y="94" text-anchor="middle">amount</text>
<rect class="sB" x="30" y="122" width="348" height="60" rx="6" opacity=".5"/><text class="sC" x="40" y="136">row group 2</text>
<rect class="sA" x="40" y="144" width="78" height="30" rx="4"/><text class="sC" x="79" y="164" text-anchor="middle">order_id</text>
<rect class="sV" x="124" y="144" width="78" height="30" rx="4"/><text class="sC" x="163" y="164" text-anchor="middle">date</text>
<rect class="sW" x="208" y="144" width="78" height="30" rx="4"/><text class="sC" x="247" y="164" text-anchor="middle">city</text>
<rect class="sG" x="292" y="144" width="78" height="30" rx="4"/><text class="sC" x="331" y="164" text-anchor="middle">amount</text>
<rect class="sV" x="30" y="192" width="348" height="22" rx="4"/><text class="sC" x="204" y="208" text-anchor="middle">footer: schema · per-chunk min / max / nulls</text>
<text class="sC" x="420" y="50">a reader asking for</text><text class="sC" x="420" y="70" xml:space="preserve" style="white-space:pre">SUM(amount) WHERE date &gt;= '2026-10-01'</text>
<text class="sC" x="420" y="100">1. reads the footer first</text><text class="sC" x="420" y="122">2. skips row groups whose date</text><text class="sC" x="420" y="140">   max is too old</text><text class="sC" x="420" y="162">3. reads only 2 column chunks</text>
<text class="sRt" x="420" y="196">CSV: read every byte, guess every type</text>
</svg><figcaption>Parquet is columnar inside, typed, compressed and self-describing. Readers skip both columns and row groups they don't need.</figcaption></figure>

```python
import pyarrow as pa, pyarrow.parquet as pq, pyarrow.dataset as ds
table = pa.Table.from_pandas(df, preserve_index=False)
pq.write_to_dataset(table, root_path="silver/orders", partition_cols=["order_date"],   # Hive-style partitions
                    existing_data_behavior="delete_matching")                           # overwrite those partitions: idempotent
# Read only two columns for one day
dataset = ds.dataset("silver/orders", format="parquet", partitioning="hive")
subset = dataset.to_table(columns=["order_id", "amount"], filter=ds.field("order_date") == "2026-10-02")
```

**Apache Arrow** is the in-memory columnar standard shared by pandas (with the Arrow backend), Polars, DuckDB and Spark, so data moves between them with little or no copying.

## DE4.4 Choosing the processing engine 🟢 🟡 ⭐

<figure class="dia"><svg viewBox="0 0 720 212" role="img" aria-label="Processing tools by data size on a log scale from 1 MB to 10 TB: pandas up to a few GB, Polars and DuckDB to hundreds of GB on one machine, PySpark from tens of GB to terabytes, warehouse SQL across the range">
<line class="sLm" x1="60" y1="150" x2="670" y2="150" marker-end="url(#ahm)"/>
<line class="sLm" x1="60" y1="146" x2="60" y2="154"/><text class="sC" x="60" y="170" text-anchor="middle">1 MB</text>
<line class="sLm" x1="146" y1="146" x2="146" y2="154"/><text class="sC" x="146" y="170" text-anchor="middle">10 MB</text>
<line class="sLm" x1="232" y1="146" x2="232" y2="154"/><text class="sC" x="232" y="170" text-anchor="middle">100 MB</text>
<line class="sLm" x1="318" y1="146" x2="318" y2="154"/><text class="sC" x="318" y="170" text-anchor="middle">1 GB</text>
<line class="sLm" x1="404" y1="146" x2="404" y2="154"/><text class="sC" x="404" y="170" text-anchor="middle">10 GB</text>
<line class="sLm" x1="490" y1="146" x2="490" y2="154"/><text class="sC" x="490" y="170" text-anchor="middle">100 GB</text>
<line class="sLm" x1="576" y1="146" x2="576" y2="154"/><text class="sC" x="576" y="170" text-anchor="middle">1 TB</text>
<line class="sLm" x1="662" y1="146" x2="662" y2="154"/><text class="sC" x="662" y="170" text-anchor="middle">10 TB</text>
<rect class="sB" x="60" y="30" width="301" height="24" rx="12"/><text class="sT" x="210.5" y="47" text-anchor="middle">pandas</text>
<rect class="sA" x="189" y="62" width="326.8" height="24" rx="12"/><text class="sT" x="352.4" y="79" text-anchor="middle">Polars · DuckDB (one machine)</text>
<rect class="sV" x="404" y="94" width="258" height="24" rx="12"/><text class="sT" x="533" y="111" text-anchor="middle">PySpark (a cluster)</text>
<rect class="sG" x="232" y="122" width="430" height="24" rx="12"/><text class="sT" x="447" y="139" text-anchor="middle">dbt + warehouse SQL</text>
<text class="sS" x="360" y="200" text-anchor="middle">use the smallest tool that fits: a cluster has a fixed cost in start-up time, money and complexity</text>
</svg><figcaption>Approximate, overlapping ranges. A modern laptop with DuckDB handles far more than most people expect.</figcaption></figure>

| Data size and shape | Choose | Why |
|---|---|---|
| Fits comfortably in memory (up to a few GB) | **pandas** | Ubiquitous, rich API ([[S7]]) |
| Bigger than you'd like in pandas, single machine, speed matters | **Polars** (lazy API) or **DuckDB** (SQL) | Multi-threaded, columnar, out-of-core, often 10× faster ([[S7.9]]) |
| Many GB to TB, or already on a lakehouse | **PySpark** (Databricks, Fabric, EMR) | Distributed across a cluster ([[DE6]]) |
| Transformations best expressed in SQL inside the warehouse | **dbt** + the warehouse engine | ELT, tested and documented ([[DE7]]) |

> [!say]
> "I size the tool to the data. Up to a few gigabytes, pandas or, faster, Polars or DuckDB on one machine, which avoids cluster overhead. When data is tens of gigabytes or more, or already in a lakehouse, PySpark. And if the transformation is naturally SQL over warehouse tables, dbt in the warehouse. Many teams over-use Spark for data that fits on a laptop."

**Larger-than-memory on one machine:** stream with generators ([[S7.1]]), `pd.read_csv(..., chunksize=)`, Polars `scan_csv`/`scan_parquet` (lazy), or DuckDB queries directly over files.

## DE4.5 Loading into databases 🟢

- Use **bulk** mechanisms, not row-by-row inserts: PostgreSQL `COPY`, SQL Server `bcp`/`BULK INSERT` or `fast_executemany` in `pyodbc`, Snowflake `COPY INTO` from staged files, BigQuery load jobs from Parquet.
- Load into a **staging table**, then `MERGE` into the target in SQL ([[DE3.2]]), which gives idempotency and atomic publishing.
- **Parameterised queries** always ([[S9.3]]); SQLAlchemy for connections and pooling.

```python
from sqlalchemy import create_engine, text
engine = create_engine(settings.warehouse_url, pool_pre_ping=True)
with engine.begin() as conn:                                   # one transaction
    df.to_sql("orders_batch", conn, schema="staging", if_exists="replace", index=False, chunksize=10_000, method="multi")
    conn.execute(text(open("sql/merge_orders.sql").read()))    # MERGE staging → silver
```

## DE4.6 Cloud storage 🟢

`azure-storage-blob` / `adlfs` (Azure), `boto3` / `s3fs` (AWS), `google-cloud-storage` / `gcsfs` (GCP). **fsspec** gives one interface over all of them, so pandas, PyArrow and Polars can read `abfss://…`, `s3://…` or `gs://…` paths directly. Authenticate with managed identities or workload identity, not keys in code ([[S10.6]]).

## DE4.7 Validating data in code 🟡 ⭐

Turn expectations into code that fails loudly, at the boundary:

```python
# Records from an API: Pydantic models validate and coerce each record
from pydantic import BaseModel, Field
from datetime import datetime
class Order(BaseModel):
    order_id: str
    customer_id: str
    amount: float = Field(ge=0)
    currency: str = Field(pattern="^[A-Z]{3}$")
    status: str
    updated_at: datetime

# DataFrames: pandera schemas check columns, types and rules
import pandera.pandas as pa
orders_schema = pa.DataFrameSchema({
    "order_id": pa.Column(str, unique=True),
    "amount":   pa.Column(float, pa.Check.ge(0)),
    "status":   pa.Column(str, pa.Check.isin(["paid", "cancelled", "refunded", "pending"])),
})
orders_schema.validate(df, lazy=True)       # lazy=True reports every failure at once
```

Decide per check whether a failure **stops** the pipeline (a broken primary key) or **quarantines** bad rows to an error table and continues (one malformed record out of a million) ([[DE9]]).

<figure class="dia"><svg viewBox="0 0 720 208" role="img" aria-label="Validation routes valid rows to the silver table, isolated malformed rows to a quarantine table with reasons, and stops the run with an alert when a check like duplicate keys shows the whole batch is wrong">
<rect class="sB" x="14" y="70" width="120" height="50" rx="8"/><text class="sT" x="74" y="93" text-anchor="middle">batch</text><text class="sC" x="74" y="109" text-anchor="middle">1,000,000 rows</text>
<line class="sL" x1="134" y1="95" x2="186" y2="95" marker-end="url(#ah)"/><rect class="sV" x="190" y="62" width="150" height="66" rx="8"/><text class="sT" x="265" y="93" text-anchor="middle">validate</text><text class="sC" x="265" y="109" text-anchor="middle">pandera / Pydantic</text>
<line class="sLg" x1="340" y1="80" x2="420" y2="44" marker-end="url(#ahg)"/><rect class="sG" x="424" y="20" width="282" height="46" rx="8"/><text class="sT" x="565" y="41" text-anchor="middle">silver table</text><text class="sC" x="565" y="57" text-anchor="middle">999,998 valid rows</text>
<line class="sLw" x1="340" y1="95" x2="420" y2="95" marker-end="url(#ahw)"/><rect class="sW" x="424" y="72" width="282" height="46" rx="8"/><text class="sT" x="565" y="93" text-anchor="middle">quarantine table</text><text class="sC" x="565" y="109" text-anchor="middle">2 malformed rows + the reason</text>
<line class="sLr" x1="340" y1="110" x2="420" y2="146" marker-end="url(#ahr)"/><rect class="sR" x="424" y="124" width="282" height="46" rx="8"/><text class="sT" x="565" y="145" text-anchor="middle">stop the run, alert</text><text class="sC" x="565" y="161" text-anchor="middle">duplicate primary keys: the batch is wrong</text>
<text class="sS" x="360" y="196" text-anchor="middle">decide per check: is one bad row a fact about that row, or about the whole batch?</text>
</svg><figcaption>Quarantine isolated bad rows; stop on anything that means the batch itself is broken.</figcaption></figure>

## DE4.8 Testing pipelines 🟢 🟡 ⭐

| Test | What | How |
|---|---|---|
| **Unit** | Transformation functions | `pytest` with small hand-made DataFrames; `pd.testing.assert_frame_equal` |
| **Contract / schema** | Inputs and outputs match expected schemas | pandera or Pydantic in tests |
| **Integration** | Reading from and writing to real services | **Testcontainers** for PostgreSQL, Kafka, MinIO (S3-compatible) ([[B10.5]]) |
| **End-to-end on sample data** | The whole pipeline on a small fixture produces the expected **golden** output | A fixture folder plus a golden Parquet file ([[B10.7]]) |
| **Data tests in production** | The real outputs meet expectations | dbt tests, Great Expectations, SQL checks ([[DE9]]) |

```python
def test_dedupe_keeps_latest_version():
    raw = pd.DataFrame({"order_id": ["o1", "o1", "o2"],
                        "status": ["pending", "paid", "paid"],
                        "updated_at": pd.to_datetime(["2026-10-01 10:00", "2026-10-01 11:00", "2026-10-01 09:00"])})
    out = dedupe_latest(raw, key="order_id", order_by="updated_at")
    assert out.set_index("order_id").loc["o1", "status"] == "paid"
    assert len(out) == 2
```

> [!story]
> CS Visualizer's **golden and differential tests** in CI are exactly the discipline data teams want and rarely have. Saying "I'd test the pipeline the way I tested my interpreter: golden outputs on fixture data, checked in CI, so any change in results needs explicit approval" is a strong, differentiating answer.

## DE4.9 Concurrency and performance 🟡

- **I/O-bound work** (many API calls, many files): threads (`concurrent.futures.ThreadPoolExecutor`) or `asyncio` with `httpx.AsyncClient`, with a concurrency limit to respect rate limits.
- **CPU-bound work in pure Python:** `multiprocessing` or `ProcessPoolExecutor`, because of the **GIL** (global interpreter lock), which lets only one thread run Python bytecode at a time in the standard build. (Python 3.13 introduced an optional **free-threaded** build without the GIL, and 3.14 made it officially supported; libraries are still catching up.) Usually, the better fix is **vectorised** code (Polars, DuckDB, NumPy) that runs outside the interpreter.
- Profile before optimising (`cProfile`, `py-spy`).

<figure class="dia"><svg viewBox="0 0 720 244" role="img" aria-label="Threads help I/O-bound work because their waits overlap, but CPU-bound Python threads run one at a time under the GIL, while separate processes run in parallel">
<text class="sM" x="14" y="20">I/O-bound (API calls) with 4 threads: waiting overlaps</text>
<text class="sC" x="150" y="45" text-anchor="end">thread 1</text><rect class="sA" x="160" y="30" width="13" height="22" rx="3"/><rect class="sN" x="175" y="30" width="148" height="22" rx="3"/><rect class="sA" x="325" y="30" width="13" height="22" rx="3"/>
<text class="sC" x="150" y="71" text-anchor="end">thread 2</text><rect class="sA" x="175" y="56" width="13" height="22" rx="3"/><rect class="sN" x="190" y="56" width="148" height="22" rx="3"/><rect class="sA" x="340" y="56" width="13" height="22" rx="3"/>
<text class="sC" x="150" y="97" text-anchor="end">thread 3</text><rect class="sA" x="190" y="82" width="13" height="22" rx="3"/><rect class="sN" x="205" y="82" width="148" height="22" rx="3"/><rect class="sA" x="355" y="82" width="13" height="22" rx="3"/>
<text class="sC" x="150" y="123" text-anchor="end">thread 4</text><rect class="sA" x="205" y="108" width="13" height="22" rx="3"/><rect class="sN" x="220" y="108" width="148" height="22" rx="3"/><rect class="sA" x="370" y="108" width="13" height="22" rx="3"/>
<text class="sM" x="14" y="150">CPU-bound Python: threads take turns (GIL) · processes run in parallel</text>
<text class="sC" x="150" y="175" text-anchor="end">4 threads</text><rect class="sR" x="160" y="160" width="98" height="22" rx="3"/><rect class="sR" x="260" y="160" width="98" height="22" rx="3"/><rect class="sR" x="360" y="160" width="98" height="22" rx="3"/><rect class="sR" x="460" y="160" width="98" height="22" rx="3"/>
<text class="sC" x="150" y="203" text-anchor="end">process 1</text><rect class="sG" x="160" y="188" width="98" height="22" rx="3"/><text class="sC" x="150" y="227" text-anchor="end">process 2</text><rect class="sG" x="160" y="212" width="98" height="22" rx="3"/>
<text class="sGt" x="560" y="200">work done in a quarter</text><text class="sGt" x="560" y="218">of the time (4 cores)</text>
<text class="sC" x="430" y="70">grey = waiting on the network</text><text class="sC" x="430" y="88">blue = running Python</text>
</svg><figcaption>Threads (or asyncio) for waiting; processes for computing. Libraries like NumPy, Polars and DuckDB release the GIL internally.</figcaption></figure>

> [!lab] Rewrite FinSight's aggregation in Python (from your gaps file)
> Build `finsight-pipeline`: extract transactions from FinSight's SQL Server (incremental by `updated_at` with a lookback) into JSON Lines or Parquet in a `bronze/` folder; validate with pandera; aggregate per company per day with gap-filling (`resample("D")`) into `gold/daily_aggregates/` partitioned by date with partition overwrite; load into PostgreSQL with `COPY` and `MERGE`; pytest unit tests plus one Testcontainers integration test; a CLI `--date` parameter. In [[DE7]] you'll orchestrate it with Airflow. This turns "C# developer who touched data" into "data engineer".

## DE4.10 Interview drill 🟢 ⭐

| Question | Strong short answer |
|---|---|
| How do you ingest from a paginated API? | Incremental by a watermark, cursor pagination, timeouts, retries with backoff and jitter on 429/5xx, raw landing with metadata. |
| How do you handle rate limits? | Honour Retry-After, back off exponentially with jitter, and cap concurrency. |
| Why land raw data first? | So any transformation can be rerun or fixed later from the original. |
| Why Parquet over CSV? | Columnar, compressed, typed, with statistics for skipping data: smaller and much faster to query. |
| What's Arrow? | An in-memory columnar format shared by pandas, Polars, DuckDB and Spark for zero-copy exchange. |
| How do you process a file bigger than RAM? | Stream or chunk it, or use Polars lazy scans or DuckDB over the file, or Spark if it's truly large. |
| pandas vs Polars vs Spark? | pandas for in-memory, Polars or DuckDB for fast single-machine work, Spark for distributed data. |
| How do you load efficiently into a database? | Bulk mechanisms (COPY, BULK INSERT, COPY INTO) into staging, then MERGE. |
| How do you validate data in Python? | Pydantic for records, pandera for DataFrames; fail or quarantine by rule. |
| How do you test a pipeline? | Unit tests on pure transforms, schema checks, Testcontainers integration tests, golden outputs on fixtures. |
| Threads or processes in Python? | Threads or asyncio for I/O-bound work; processes (or vectorised libraries) for CPU-bound work, because of the GIL. |
| What encoding problems appear with Arabic CSVs? | Windows-1256 or UTF-8 with a BOM; read with the right encoding and write UTF-8. |

## Key takeaways

> [!check]
> - Structure pipelines as packages with pure transforms, config from the environment, logging and a date parameter.
> - Ingest incrementally with retries, backoff and raw landing; respect rate limits.
> - Parquet and Arrow are the lingua franca; choose pandas, Polars/DuckDB or Spark by data size.
> - Validate at the boundary and decide fail vs quarantine.
> - Test like a software engineer: unit, integration with containers, golden outputs.

## Sources

- Python Packaging User Guide: [Writing your pyproject.toml](https://packaging.python.org/en/latest/guides/writing-pyproject-toml/); [uv](https://docs.astral.sh/uv/); [ruff](https://docs.astral.sh/ruff/).
- [HTTPX](https://www.python-httpx.org/), [Tenacity](https://tenacity.readthedocs.io/).
- Apache Arrow: [PyArrow Parquet](https://arrow.apache.org/docs/python/parquet.html), [Datasets](https://arrow.apache.org/docs/python/dataset.html); [Apache Parquet](https://parquet.apache.org/docs/).
- [Polars user guide](https://docs.pola.rs/), [DuckDB documentation](https://duckdb.org/docs/), [fsspec](https://filesystem-spec.readthedocs.io/).
- [Pydantic](https://docs.pydantic.dev/), [pandera](https://pandera.readthedocs.io/), [pytest](https://docs.pytest.org/), [Testcontainers for Python](https://testcontainers-python.readthedocs.io/), [dlt](https://dlthub.com/docs/).
- Python docs: [Free-threaded CPython](https://docs.python.org/3/howto/free-threading-python.html); PEP 703 and PEP 779.
