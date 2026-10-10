# Orchestration and dbt — Airflow 3, Backfills, and Tested SQL Transformations

A pipeline is many steps that must run in the right order, on time, with retries, and be re-runnable for any past date. **Orchestrators** (Apache Airflow above all, plus Dagster, Prefect, Azure Data Factory and Fabric pipelines) do that. **dbt** turns the SQL transformations inside the warehouse into a tested, documented, version-controlled project. Airflow and dbt are among the most-requested tools on data-engineering postings, and both are on your gaps list. This module covers them as of **Airflow 3** (3.0 released April 2025; 3.3 current) and **dbt 1.x / Core 2.0**.

> [!focus]
> **Entry must:** explain what an orchestrator does; write a simple Airflow DAG with tasks and dependencies; explain schedules, retries and the logical date; explain dbt models, `ref()`, materialisations and tests.
> **Mid adds:** idempotent, date-parameterised tasks and backfills, sensors and asset-driven scheduling, passing data between tasks properly, dbt incremental models and strategies, snapshots for SCD Type 2, unit tests and contracts, project structure, deploying and running dbt from Airflow, comparing orchestrators.
> **Most asked:** *What is a DAG?* · *How do you make tasks idempotent?* · *How do backfills work?* · *What's the logical date?* · *How do you pass data between tasks?* · *What does dbt do?* · *Incremental models?* · *dbt snapshots?* · *Airflow vs Data Factory?*
> **Time budget:** 4 hours, with Airflow (`pip install apache-airflow` or the Astro CLI) and dbt (`pip install dbt-duckdb`) running locally.

## DE7.0 Foundations: a graph and a calendar 🟢

Running a data platform means running many small jobs in the right order, at the right time, forever. Two separate ideas organise that:

- **Dependencies**: what must finish before what. Draw jobs as nodes and "must finish first" as arrows, and you get a **DAG** (directed acyclic graph). Anything without a path between it can run in parallel.
- **Time**: which slice of data each run is responsible for. A daily pipeline doesn't process "today"; each run owns a fixed **data interval**, so it can be rerun for any past day with the same result.

<figure class="dia anim"><svg viewBox="0 0 720 210" role="img" aria-label="Animation: an orchestrated DAG where two extracts run in parallel, then validation, a dbt build and publishing an asset, which notifies and triggers a downstream ML features DAG">
<rect class="sB" x="14" y="30" width="150" height="46" rx="8"/><text class="sT" x="89" y="51" text-anchor="middle">extract_orders</text><text class="sC" x="89" y="67" text-anchor="middle">API → bronze</text><rect class="sB" x="14" y="120" width="150" height="46" rx="8"/><text class="sT" x="89" y="141" text-anchor="middle">extract_customers</text><text class="sC" x="89" y="157" text-anchor="middle">DB → bronze</text>
<line class="sLm" x1="164" y1="53" x2="196" y2="90" marker-end="url(#ahm)"/><line class="sLm" x1="164" y1="143" x2="196" y2="106" marker-end="url(#ahm)"/>
<rect class="sV" x="200" y="75" width="120" height="46" rx="8"/><text class="sT" x="260" y="96" text-anchor="middle">validate</text><text class="sC" x="260" y="112" text-anchor="middle">schema · counts</text>
<line class="sLm" x1="320" y1="98" x2="352" y2="98" marker-end="url(#ahm)"/><rect class="sA" x="356" y="75" width="120" height="46" rx="8"/><text class="sT" x="416" y="96" text-anchor="middle">dbt build</text><text class="sC" x="416" y="112" text-anchor="middle">models + tests</text>
<line class="sLm" x1="476" y1="98" x2="508" y2="98" marker-end="url(#ahm)"/><rect class="sG" x="512" y="75" width="120" height="46" rx="8"/><text class="sT" x="572" y="96" text-anchor="middle">publish</text><text class="sC" x="572" y="112" text-anchor="middle">asset updated</text>
<line class="sLw" x1="572" y1="121" x2="572" y2="150" marker-end="url(#ahw)" stroke-dasharray="5 4"/><rect class="sW" x="500" y="152" width="206" height="40" rx="8"/><text class="sT" x="603" y="170" text-anchor="middle">ML features DAG</text><text class="sC" x="603" y="186" text-anchor="middle">scheduled on that asset</text>
<line class="sLm" x1="632" y1="98" x2="660" y2="98" marker-end="url(#ahm)"/><rect class="sN" x="662" y="80" width="44" height="36" rx="8"/><text class="sT" x="684" y="103" text-anchor="middle">✉</text>
<text class="sC" x="90" y="196" text-anchor="middle">parallel: no dependency</text><text class="sC" x="300" y="196" text-anchor="middle">retries · timeouts · alerts on each task</text>
<circle class="sP" r="5"><animateMotion dur="4s" repeatCount="indefinite" path="M164 53 L200 90 H632"/></circle><circle class="sPg" r="5"><animateMotion dur="4s" begin="0.4s" repeatCount="indefinite" path="M164 143 L200 106 H632"/></circle>
</svg><figcaption>Dependencies decide order and parallelism; the orchestrator adds the schedule, retries, alerts and history.</figcaption></figure>

Orchestrators (Airflow, Dagster, Data Factory) manage both: they schedule runs per interval, follow the graph, retry failures and keep the history. dbt manages a graph of its own inside the warehouse: the dependencies between SQL models.

## DE7.1 What an orchestrator does 🟢 ⭐

> [!term] DAG (directed acyclic graph)
> A set of tasks with dependencies that can't loop: extract → validate → transform → publish. The orchestrator runs tasks in **topological order** ([[S4.11]]), in parallel where dependencies allow.

An orchestrator provides: **scheduling** (time-based and event-based), **dependencies**, **retries** with backoff, **alerting**, **parameterised runs for a date** and **backfills**, logs and a UI for every run, concurrency control, and secret and connection management. It **coordinates** work; heavy processing should run in the systems it triggers (Spark, the warehouse, dbt), not inside the orchestrator's workers.

## DE7.2 Airflow core concepts 🟢 ⭐

| Concept | Meaning |
|---|---|
| **DAG** | A Python-defined workflow with a schedule |
| **Task** | One unit of work: an **operator** instance or a `@task`-decorated Python function |
| **Operator** | A reusable task type: `BashOperator`, `SQLExecuteQueryOperator`, `DatabricksRunNowOperator`, `KubernetesPodOperator`… (from **provider** packages) |
| **DAG run** | One execution of the DAG for a given **logical date** (data interval) |
| **Task instance** | One run of one task in one DAG run, with a state (queued, running, success, failed, up for retry) |
| **Logical date / data interval** | The period of data a run is responsible for. A daily run for 2 October usually starts **after** 2 October ends |
| **Scheduler**, **executor**, **workers** | Decide what runs, hand tasks to workers (Local, Celery, Kubernetes, or the new Edge executor in Airflow 3) |
| **Connections**, **variables** | Stored credentials and settings, ideally backed by a secrets manager |
| **XCom** | Small messages passed between tasks (IDs, paths, row counts), **not** datasets |
| **Assets** (called datasets before Airflow 3) | Named data products; a DAG can be scheduled to run **when an asset it depends on is updated** |

```python
# dags/daily_orders.py  (Airflow 3: the task SDK lives in airflow.sdk)
from datetime import datetime, timedelta
from airflow.sdk import dag, task, Asset

ORDERS_GOLD = Asset("lake://gold/daily_orders")

@dag(schedule="@daily", start_date=datetime(2026, 1, 1), catchup=False,
     default_args={"retries": 3, "retry_delay": timedelta(minutes=5), "retry_exponential_backoff": True},
     tags=["sales"])
def daily_orders():

    @task
    def extract(data_interval_start=None, data_interval_end=None) -> str:
        # Load exactly this interval: deterministic, re-runnable
        return run_extract(start=data_interval_start, end=data_interval_end)      # returns a file path, not data

    @task
    def validate(path: str) -> str:
        assert_schema_and_counts(path)        # fail fast on bad data (see module DE9)
        return path

    @task(outlets=[ORDERS_GOLD])
    def load(path: str, ds=None):
        overwrite_partition("gold.daily_orders", partition=ds, source=path)       # idempotent

    load(validate(extract()))

daily_orders()
```

> [!say]
> "An Airflow DAG is a Python-defined graph of tasks with a schedule. Each run covers a data interval given by the logical date, and every task uses that interval, not the current time, so a run is deterministic and can be re-run or backfilled for any past date. Tasks pass small references like file paths through XCom, while the data itself lives in storage, and heavy work runs in Spark or the warehouse, not in the Airflow worker."

> [!mistake] Using "now" inside tasks
> `datetime.now()` in a task makes a rerun of last Tuesday load today's data. Always use the run's **data interval** (`data_interval_start`/`end`, or `ds` for the date) so reruns and backfills are correct.

<figure class="dia"><svg viewBox="0 0 720 220" role="img" aria-label="Daily DAG runs each own one data interval: the run for 1 October covers midnight to midnight and starts just after; a rerun days later processes the same interval">
<line class="sLm" x1="60" y1="150" x2="668" y2="150" marker-end="url(#ahm)"/>
<line class="sLm" x1="60" y1="146" x2="60" y2="154"/><text class="sC" x="60" y="170" text-anchor="middle">1 Oct 00:00</text>
<line class="sLm" x1="210" y1="146" x2="210" y2="154"/><text class="sC" x="210" y="170" text-anchor="middle">2 Oct 00:00</text>
<line class="sLm" x1="360" y1="146" x2="360" y2="154"/><text class="sC" x="360" y="170" text-anchor="middle">3 Oct 00:00</text>
<line class="sLm" x1="510" y1="146" x2="510" y2="154"/><text class="sC" x="510" y="170" text-anchor="middle">4 Oct 00:00</text>
<line class="sLm" x1="660" y1="146" x2="660" y2="154"/><text class="sC" x="660" y="170" text-anchor="middle">5 Oct 00:00</text>
<rect class="sA" x="63" y="100" width="144" height="26" rx="4" opacity=".7"/><text class="sC" x="135" y="118" text-anchor="middle">interval for 1 Oct</text>
<circle class="sPv" cx="222" cy="76" r="7"/><line class="sLm" x1="222" y1="83" x2="180" y2="100" marker-end="url(#ahm)"/>
<rect class="sA" x="213" y="100" width="144" height="26" rx="4" opacity=".7"/><text class="sC" x="285" y="118" text-anchor="middle">interval for 2 Oct</text>
<circle class="sPv" cx="372" cy="76" r="7"/><line class="sLm" x1="372" y1="83" x2="330" y2="100" marker-end="url(#ahm)"/>
<rect class="sA" x="363" y="100" width="144" height="26" rx="4" opacity=".7"/><text class="sC" x="435" y="118" text-anchor="middle">interval for 3 Oct</text>
<circle class="sPv" cx="522" cy="76" r="7"/><line class="sLm" x1="522" y1="83" x2="480" y2="100" marker-end="url(#ahm)"/>
<text class="sC" x="222" y="60">run for 1 Oct starts 2 Oct 00:05</text>
<rect class="sG" x="63" y="186" width="380" height="24" rx="4"/><text class="sC" x="253" y="203" text-anchor="middle">rerun of 1 Oct, on 4 Oct: same interval, same result</text><line class="sLg" x1="135" y1="186" x2="135" y2="130" marker-end="url(#ahg)"/>
<text class="sM" x="60" y="30">every task reads data_interval_start / end, never now()</text>
</svg><figcaption>A run is responsible for a data interval, not for "today". That single rule makes reruns and backfills correct.</figcaption></figure>

> [!mistake] Passing data through XCom
> XCom is stored in Airflow's metadata database and meant for small values. Write data to storage (a lake path, a staging table) and pass the **reference**.

## DE7.3 Idempotency, backfills and catch-up 🟢 🟡 ⭐

Every task should be **idempotent**: running it twice for the same interval gives the same result ([[DE1.6]], [[DE3.1]]). Then:

- **Retries** are safe.
- **Backfills** (running the DAG for past intervals, after a bug fix or a new column) are safe. In Airflow 3, backfills run through the scheduler and can be launched from the UI or CLI (`airflow backfill create --dag-id daily_orders --from-date 2026-09-01 --to-date 2026-09-30`).
- **`catchup`** controls whether the scheduler automatically creates runs for missed intervals since `start_date`; it now **defaults to `False`** in Airflow 3, so set it deliberately.

<figure class="dia"><svg viewBox="0 0 720 176" role="img" aria-label="Ten daily runs where days four to six wrote wrong totals; after the bug fix, a backfill reruns those three intervals and overwrites them correctly">
<rect class="sG" x="30" y="40" width="58" height="40" rx="6"/><text class="sC" x="59" y="64" text-anchor="middle">day 1</text>
<rect class="sG" x="96" y="40" width="58" height="40" rx="6"/><text class="sC" x="125" y="64" text-anchor="middle">day 2</text>
<rect class="sG" x="162" y="40" width="58" height="40" rx="6"/><text class="sC" x="191" y="64" text-anchor="middle">day 3</text>
<rect class="sR" x="228" y="40" width="58" height="40" rx="6" opacity=".85"/><text class="sC" x="257" y="64" text-anchor="middle">day 4</text>
<rect class="sG" x="228" y="120" width="58" height="40" rx="6"/><text class="sC" x="257" y="144" text-anchor="middle">fixed</text><line class="sLg" x1="257" y1="82" x2="257" y2="118" marker-end="url(#ahg)"/>
<rect class="sR" x="294" y="40" width="58" height="40" rx="6" opacity=".85"/><text class="sC" x="323" y="64" text-anchor="middle">day 5</text>
<rect class="sG" x="294" y="120" width="58" height="40" rx="6"/><text class="sC" x="323" y="144" text-anchor="middle">fixed</text><line class="sLg" x1="323" y1="82" x2="323" y2="118" marker-end="url(#ahg)"/>
<rect class="sR" x="360" y="40" width="58" height="40" rx="6" opacity=".85"/><text class="sC" x="389" y="64" text-anchor="middle">day 6</text>
<rect class="sG" x="360" y="120" width="58" height="40" rx="6"/><text class="sC" x="389" y="144" text-anchor="middle">fixed</text><line class="sLg" x1="389" y1="82" x2="389" y2="118" marker-end="url(#ahg)"/>
<rect class="sG" x="426" y="40" width="58" height="40" rx="6"/><text class="sC" x="455" y="64" text-anchor="middle">day 7</text>
<rect class="sG" x="492" y="40" width="58" height="40" rx="6"/><text class="sC" x="521" y="64" text-anchor="middle">day 8</text>
<rect class="sG" x="558" y="40" width="58" height="40" rx="6"/><text class="sC" x="587" y="64" text-anchor="middle">day 9</text>
<rect class="sG" x="624" y="40" width="58" height="40" rx="6"/><text class="sC" x="653" y="64" text-anchor="middle">day 10</text>
<text class="sC" x="30" y="28">production runs (days 4–6 wrote wrong totals: a bug in the discount logic)</text>
<text class="sGt" x="436" y="140">← backfill days 4–6 after the fix:</text><text class="sGt" x="436" y="158">idempotent tasks overwrite them</text>
</svg><figcaption>A backfill is just more runs for past intervals. It is only safe because each task is idempotent.</figcaption></figure>

**Other scheduling tools:** **sensors** wait for a condition (a file arrives, another DAG's task succeeds), and **deferrable** operators free the worker while waiting. **Asset-aware scheduling** (`schedule=[ORDERS_GOLD]`) runs the downstream DAG when the upstream asset is updated, instead of guessing times. Pools and `max_active_runs` limit concurrency against fragile sources.

> [!sota] Airflow 3 (April 2025 onwards)
> A rebuilt **React UI**, **DAG versioning** (runs show the DAG code version they used), **assets** (with an `@asset` decorator) replacing datasets for data-aware scheduling, a **Task Execution API** and SDK so tasks can run remotely (including the **Edge executor**), scheduler-managed backfills, and the removal of long-deprecated features (for example `execution_date` in favour of the logical date, and SubDAGs). Know that many companies still run Airflow 2, so recognise both.

## DE7.4 dbt: SQL transformations as software 🟢 ⭐

> [!term] dbt (data build tool)
> A framework for the **T in ELT**: you write each transformation as a `SELECT` statement (a **model**), and dbt compiles them (with Jinja templating), works out the dependency graph from `ref()` calls, creates the tables or views in the warehouse in the right order, runs **tests**, and generates **documentation and lineage**. It brings version control, code review, testing and environments to SQL.

```sql
-- models/staging/stg_orders.sql  (one staging model per source table: rename, cast, clean)
select
    cast(order_id as varchar)        as order_id,
    cast(customer_id as varchar)     as customer_id,
    lower(status)                    as status,
    cast(amount as decimal(18,2))    as amount,
    cast(created_at as timestamp)    as created_at
from {{ source('shop', 'orders') }}
```

```sql
-- models/marts/fct_orders.sql  (refers to other models with ref(), which builds the DAG)
{{ config(materialized='incremental', unique_key='order_id', incremental_strategy='merge',
          on_schema_change='append_new_columns') }}

select o.order_id, o.customer_id, c.customer_sk, o.status, o.amount, o.created_at::date as order_date
from {{ ref('stg_orders') }} o
left join {{ ref('dim_customer') }} c
  on c.customer_id = o.customer_id and o.created_at between c.valid_from and c.valid_to
{% if is_incremental() %}
  where o.created_at > (select max(created_at) from {{ this }}) - interval '3 days'   -- lookback for late data
{% endif %}
```

```yaml
# models/marts/_marts.yml : tests and documentation live next to the models
models:
  - name: fct_orders
    description: "One row per order. Paid, cancelled and refunded orders included."
    columns:
      - name: order_id
        data_tests: [unique, not_null]
      - name: status
        data_tests:
          - accepted_values: { values: ['paid', 'cancelled', 'refunded', 'pending'] }
      - name: customer_sk
        data_tests:
          - relationships: { to: ref('dim_customer'), field: customer_sk }
```

### Materialisations ⭐

| Materialisation | Builds | Use |
|---|---|---|
| `view` | A view | Light staging models; always fresh, computed at query time |
| `table` | A full table, rebuilt each run | Small-to-medium marts |
| `incremental` | A table updated with only new or changed rows | **Large facts**; strategies: `append`, `merge`, `delete+insert`, `insert_overwrite` (partitions), `microbatch` (time-based batches, since dbt 1.9) |
| `ephemeral` | Nothing; inlined as a CTE | Reusable logic without a table |
| `materialized_view` | A warehouse-managed materialised view | Where supported |

<figure class="dia"><svg viewBox="0 0 720 244" role="img" aria-label="Rows read per daily dbt run for a two-million-row fact table: a table materialisation rereads everything each day, while an incremental model with a three-day lookback reads about eighty thousand rows">
<text class="sM" x="14" y="22">rows read per daily run, fact table of 2M rows growing 20,000 a day (3-day lookback)</text>
<text class="sC" x="60" y="50" text-anchor="end">day 1</text>
<rect class="sW" x="70" y="36" width="217.103" height="9" rx="2"/><rect class="sG" x="70" y="46" width="8.59813" height="9" rx="2"/>
<text class="sWt" x="293.103" y="44">table: 2.02M</text><text class="sGt" x="84.5981" y="55">incremental: 80,000</text>
<text class="sC" x="60" y="76" text-anchor="end">day 2</text>
<rect class="sW" x="70" y="62" width="219.252" height="9" rx="2"/><rect class="sG" x="70" y="72" width="8.59813" height="9" rx="2"/>
<text class="sC" x="60" y="102" text-anchor="end">day 3</text>
<rect class="sW" x="70" y="88" width="221.402" height="9" rx="2"/><rect class="sG" x="70" y="98" width="8.59813" height="9" rx="2"/>
<text class="sC" x="60" y="128" text-anchor="end">day 4</text>
<rect class="sW" x="70" y="114" width="223.551" height="9" rx="2"/><rect class="sG" x="70" y="124" width="8.59813" height="9" rx="2"/>
<text class="sC" x="60" y="154" text-anchor="end">day 5</text>
<rect class="sW" x="70" y="140" width="225.701" height="9" rx="2"/><rect class="sG" x="70" y="150" width="8.59813" height="9" rx="2"/>
<text class="sC" x="60" y="180" text-anchor="end">day 6</text>
<rect class="sW" x="70" y="166" width="227.85" height="9" rx="2"/><rect class="sG" x="70" y="176" width="8.59813" height="9" rx="2"/>
<text class="sC" x="60" y="206" text-anchor="end">day 7</text>
<rect class="sW" x="70" y="192" width="230" height="9" rx="2"/><rect class="sG" x="70" y="202" width="8.59813" height="9" rx="2"/>
<text class="sWt" x="306" y="200">table: 2.14M</text><text class="sGt" x="84.5981" y="211">incremental: 80,000</text>
<rect class="sN" x="430" y="40" width="276" height="150" rx="8"/>
<text class="sT" x="568" y="62" text-anchor="middle">per week</text>
<text class="sWt" x="444" y="88">table rebuilds: 14.6M rows</text>
<text class="sGt" x="444" y="110">incremental merges: 560k rows</text>
<text class="sC" x="444" y="138">26× less work, but you now own</text>
<text class="sC" x="444" y="156">late data (the lookback), merges</text><text class="sC" x="444" y="174">and occasional --full-refresh</text>
<text class="sS" x="360" y="232" text-anchor="middle">start with table; switch a model to incremental when its rebuild time or cost starts to hurt</text>
</svg><figcaption>table vs incremental, computed for a growing fact table: the incremental model trades simplicity for a large cut in work.</figcaption></figure>

### Tests, snapshots and more 🟡 ⭐

- **Data tests:** generic (`unique`, `not_null`, `accepted_values`, `relationships`, plus packages like `dbt_utils` and `dbt-expectations`) and singular (any SQL that returns failing rows).
- **Unit tests** (dbt 1.8+): test a model's **logic** on small mocked inputs and expected outputs, before it touches real data.
- **Model contracts:** enforce column names and types for a published model, so downstream consumers don't break ([[DE9]]).
- **Snapshots** implement **SCD Type 2** automatically: dbt compares source rows with the snapshot (by `updated_at` or by checking columns) and maintains `dbt_valid_from` / `dbt_valid_to` history ([[DE2.5]]).
- **Seeds** (small CSV reference tables in Git), **macros** (reusable Jinja), **packages**, **sources** with **freshness** checks, **exposures** (declaring dashboards that depend on models).
- **`dbt build`** runs models, tests, snapshots and seeds in DAG order; **state selection** (`--select state:modified+`) builds only what changed and its descendants in CI ("slim CI").

**Project structure** (dbt Labs' recommendation): `staging/` (one model per source table, light cleaning) → `intermediate/` (joins and business logic) → `marts/` (facts and dimensions for consumers), which maps neatly onto bronze → silver → gold ([[DE1.3]]).

<figure class="dia"><svg viewBox="0 0 720 230" role="img" aria-label="dbt lineage: raw sources feed staging models, which feed an intermediate model and marts for orders and customers, which feed a sales dashboard exposure; tests run on key models">
<text class="sM" x="84" y="22" text-anchor="middle">sources</text>
<rect class="sN" x="14" y="40" width="140" height="40" rx="6"/><text class="sC" x="84" y="65" text-anchor="middle">raw.orders</text>
<rect class="sN" x="14" y="110" width="140" height="40" rx="6"/><text class="sC" x="84" y="135" text-anchor="middle">raw.customers</text>
<text class="sM" x="244" y="22" text-anchor="middle">staging</text>
<rect class="sB" x="174" y="40" width="140" height="40" rx="6"/><text class="sC" x="244" y="65" text-anchor="middle">stg_orders</text>
<rect class="sB" x="174" y="110" width="140" height="40" rx="6"/><text class="sC" x="244" y="135" text-anchor="middle">stg_customers</text>
<text class="sM" x="404" y="22" text-anchor="middle">intermediate</text>
<rect class="sV" x="334" y="75" width="140" height="40" rx="6"/><text class="sC" x="404" y="100" text-anchor="middle">int_orders_enriched</text>
<text class="sM" x="564" y="22" text-anchor="middle">marts</text>
<rect class="sA" x="494" y="40" width="140" height="40" rx="6"/><text class="sC" x="564" y="65" text-anchor="middle">fct_orders</text>
<rect class="sA" x="494" y="110" width="140" height="40" rx="6"/><text class="sC" x="564" y="135" text-anchor="middle">dim_customer</text>
<line class="sLm" x1="154" y1="60" x2="172" y2="60" marker-end="url(#ahm)"/>
<line class="sLm" x1="154" y1="130" x2="172" y2="130" marker-end="url(#ahm)"/>
<line class="sLm" x1="314" y1="60" x2="332" y2="95" marker-end="url(#ahm)"/>
<line class="sLm" x1="314" y1="130" x2="332" y2="95" marker-end="url(#ahm)"/>
<line class="sLm" x1="474" y1="95" x2="492" y2="60" marker-end="url(#ahm)"/>
<line class="sLm" x1="314" y1="130" x2="492" y2="130" marker-end="url(#ahm)"/>
<circle class="sPg" cx="308" cy="46" r="5"/>
<circle class="sPg" cx="628" cy="46" r="5"/>
<circle class="sPg" cx="628" cy="116" r="5"/>
<rect class="sW" x="500" y="170" width="206" height="40" rx="8"/><text class="sT" x="603" y="195" text-anchor="middle">exposure: sales dashboard</text><line class="sLw" x1="570" y1="150" x2="590" y2="168" marker-end="url(#ahw)"/>
<text class="sC" x="14" y="200">arrows come from ref() and source(): dbt builds the graph from the SQL</text><text class="sGt" x="14" y="218">green dots: tests that run with dbt build</text>
</svg><figcaption>A dbt project is a DAG of SELECT statements. ref() is both the dependency and the documentation of lineage.</figcaption></figure>

> [!sota] dbt in 2026
> **Fivetran and dbt Labs completed their merger on 1 June 2026**, and **dbt Core v2.0** (alpha) open-sources the **Fusion engine**, a Rust rewrite that parses and understands SQL (faster parsing, live error detection, richer column-level lineage, state-aware builds) under the Apache 2.0 licence. dbt Core 1.x remains widely used; **dbt Cloud** is the managed offering.

> [!say]
> "dbt handles the transform step inside the warehouse: each model is a SELECT, ref() builds the dependency graph, and dbt materialises models as views, tables or incremental tables, runs data tests and unit tests, snapshots slowly changing dimensions, and generates docs and lineage. Large facts are incremental models with a merge or insert-overwrite strategy and a small lookback for late data, and CI builds only modified models and their descendants."

## DE7.5 Airflow + dbt together 🟡

A common split: **Airflow orchestrates** (ingestion, waiting for sources, triggering dbt, triggering ML jobs, alerting); **dbt transforms** inside the warehouse. Run dbt from Airflow with a container task (`dbt build --select tag:daily --vars '{"run_date": "{{ ds }}"}'`), or with **Astronomer Cosmos**, which renders each dbt model as an Airflow task so failures and retries are per model.

## DE7.6 Orchestrators compared 🟡

| Tool | Model | Strengths | Fits |
|---|---|---|---|
| **Apache Airflow** | Task-centric DAGs in Python | Huge ecosystem of providers, mature, managed offerings on every cloud (MWAA, Cloud Composer, Astronomer, Azure) | General-purpose orchestration; most job postings |
| **Dagster** | **Asset-centric** (software-defined assets) | Data lineage and quality built in, strong local development and testing | Teams thinking in data products |
| **Prefect** | Python-native flows | Low ceremony, dynamic workflows | Python-heavy teams |
| **Azure Data Factory / Fabric pipelines** | Low-code activities and connectors | 100+ connectors, copy activity, integration runtimes for on-premises sources, Microsoft integration | Azure and Fabric shops, copy-heavy ingestion, mixed-skill teams |
| **Databricks Workflows (Lakeflow Jobs)** | Jobs of notebooks, SQL, dbt and pipelines | Native to Databricks | Databricks-centred platforms |

> [!say]
> "Airflow is code-first and general-purpose with a huge ecosystem, which is why it's on most job postings. Data Factory or Fabric pipelines are low-code with excellent connectors, great for copying data from many sources in an Azure shop. Many teams combine them: Data Factory for ingestion, dbt for transformation, and an orchestrator to tie it together."

> [!lab] Orchestrate your Python pipeline with Airflow and dbt (from your gaps file)
> Take the `finsight-pipeline` from [[DE4]]'s lab. (1) Run Airflow 3 locally (the Astro CLI or Docker Compose). (2) Write a DAG with extract → validate → load tasks using the data interval, retries and an asset outlet. (3) Create a dbt project (dbt-duckdb or dbt-postgres) with staging → marts, an incremental `fct_daily_transactions`, a snapshot for companies, generic tests, one unit test and docs. (4) Trigger `dbt build` from the DAG. (5) Backfill September and show that rerunning a day changes nothing. Screenshot the Airflow graph and dbt lineage for your README. That closes the Airflow and dbt gaps with real evidence.

## DE7.7 Interview drill 🟢 ⭐

| Question | Strong short answer |
|---|---|
| What does an orchestrator do? | Schedules and runs dependent tasks with retries, alerts, parameterised runs and backfills, coordinating work done elsewhere. |
| What is a DAG? | A directed acyclic graph of tasks and dependencies, run in topological order. |
| What is the logical date / data interval? | The period of data a run is responsible for; tasks use it instead of the current time. |
| How do you make Airflow tasks idempotent? | Parameterise by the data interval and write with partition overwrites or merges. |
| How do backfills work? | Re-running the DAG for past intervals (CLI, UI or catch-up), which is safe only if tasks are idempotent. |
| What is XCom for? | Small values between tasks (paths, IDs, counts), not datasets. |
| What are sensors and assets? | Sensors wait for a condition; assets let a DAG run when upstream data is updated. |
| What's new in Airflow 3? | New UI, DAG versioning, assets with @asset, a task execution API and remote execution, scheduler-managed backfills, catchup off by default. |
| What does dbt do? | Builds SQL SELECT models in dependency order via ref(), with tests, docs, lineage and environments. |
| What materialisations exist? | View, table, incremental, ephemeral, materialised view. |
| How do incremental models work? | On subsequent runs, only new or changed rows are selected (is_incremental) and merged, appended or overwritten by partition. |
| What are dbt snapshots? | Automatic SCD Type 2 history tables with validity columns. |
| Data tests vs unit tests in dbt? | Data tests check real output data; unit tests check a model's logic on mocked inputs. |
| Airflow vs Data Factory? | Code-first, general-purpose and extensible vs low-code with strong connectors and Azure integration. |

## Key takeaways

> [!check]
> - Orchestrators coordinate; heavy work runs in Spark or the warehouse.
> - Tasks use the data interval, never "now", and write idempotently, so retries and backfills are safe.
> - Pass references, not data, between tasks; schedule on assets where possible.
> - dbt makes SQL transformations testable, documented and incremental; snapshots handle SCD Type 2.
> - Airflow + dbt is the most common combination on job postings; build one end to end.

## Sources

- Apache Airflow documentation: [Core concepts](https://airflow.apache.org/docs/apache-airflow/stable/core-concepts/index.html), [DAG runs, catchup and backfill](https://airflow.apache.org/docs/apache-airflow/stable/core-concepts/dag-run.html), [Assets and data-aware scheduling](https://airflow.apache.org/docs/apache-airflow/stable/authoring-and-scheduling/asset-scheduling.html), [Upgrading to Airflow 3](https://airflow.apache.org/docs/apache-airflow/stable/installation/upgrading_to_airflow3.html), [Airflow 3.0.0 release notes](https://airflow.apache.org/docs/apache-airflow/3.0.0/release_notes.html), [Announcements](https://airflow.apache.org/announcements/).
- dbt documentation: [What is dbt?](https://docs.getdbt.com/docs/introduction), [Materializations](https://docs.getdbt.com/docs/build/materializations), [Incremental models and strategies](https://docs.getdbt.com/docs/build/incremental-strategy), [Data tests](https://docs.getdbt.com/docs/build/data-tests), [Unit tests](https://docs.getdbt.com/docs/build/unit-tests), [Snapshots](https://docs.getdbt.com/docs/build/snapshots), [Model contracts](https://docs.getdbt.com/docs/mesh/govern/model-contracts), [How we structure our dbt projects](https://docs.getdbt.com/best-practices/how-we-structure/1-guide-overview).
- Fivetran, [Fivetran and dbt Labs complete merger](https://www.fivetran.com/press/fivetran-dbt-labs-complete-merger-to-create-the-data-infrastructure-for-trusted-ai-agents) (June 2026).
- [Astronomer Cosmos](https://astronomer.github.io/astronomer-cosmos/) · [Dagster](https://docs.dagster.io/) · [Prefect](https://docs.prefect.io/) · Microsoft Learn: [Azure Data Factory](https://learn.microsoft.com/en-us/azure/data-factory/introduction), [Data Factory in Fabric](https://learn.microsoft.com/en-us/fabric/data-factory/data-factory-overview).
- Maxime Beauchemin (Airflow's creator), "[Functional Data Engineering](https://maximebeauchemin.medium.com/functional-data-engineering-a-modern-paradigm-for-batch-data-processing-2327ec32c42a)".
