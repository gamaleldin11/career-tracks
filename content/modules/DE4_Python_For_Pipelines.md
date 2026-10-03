# Python for Pipelines — Ingestion, Files, Parquet, Validation, Testing and Packaging

Python is the glue language of data engineering: API ingestion jobs, file processing, orchestration code (Airflow DAGs are Python), PySpark jobs, data validation and tests. DE interviews test whether you write Python like a **software engineer**, structured, tested and robust, and not like a notebook. That's your advantage: you bring testing, packaging and error handling from .NET. Your gaps file notes that your current pipeline experience is in C#, and suggests rewriting FinSight's aggregation as a Python job; this module gives you what you need to do it well. [[S7]] covers pandas itself.

> [!focus]
> **Entry must:** write a script that pulls from a paginated API with retries and lands raw data with metadata; read and write CSV, JSON and Parquet correctly; load data into a database in bulk; structure code into functions with logging and configuration; write pytest tests for transformations.
> **Mid adds:** incremental API ingestion, Parquet and Arrow internals, choosing pandas vs Polars vs DuckDB vs Spark, schema validation with Pydantic or pandera, packaging a pipeline with `pyproject.toml`, concurrency for I/O, integration tests with real services.
> **Most asked:** *How would you ingest data from a REST API?* · *How do you handle rate limits and failures?* · *Why Parquet?* · *Process a file bigger than memory* · *How do you test a pipeline?* · *pandas vs Spark?*
> **Time budget:** 3.5 hours.

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
