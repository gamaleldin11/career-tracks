# Apache Spark — How It Runs, Why Jobs Are Slow, and How to Fix Them

Spark is the most-asked distributed engine in data-engineering interviews, whether the company runs Databricks, Microsoft Fabric, Synapse, EMR or on-premises Cloudera. You studied it through Huawei's HCIA Big Data material; this module turns that into the working knowledge interviewers probe: the execution model (driver, executors, stages, tasks), lazy evaluation, shuffles and partitions, join strategies, data skew, caching, Adaptive Query Execution, and Structured Streaming. Your gaps file is honest that you haven't written Spark on real data yet; the lab fixes that.

> [!focus]
> **Entry must:** explain driver, executors, partitions and tasks; transformations vs actions and lazy evaluation; narrow vs wide transformations and shuffles; write a PySpark job that reads, transforms, joins, aggregates and writes partitioned output.
> **Mid adds:** reading the Spark UI, broadcast vs sort-merge joins, data skew and salting, partition sizing, caching, Adaptive Query Execution, small files, Spark SQL vs the DataFrame API, Structured Streaming basics, what changed in Spark 4.
> **Most asked:** *How does Spark execute a job?* · *What is a shuffle and why is it expensive?* · *Transformations vs actions?* · *How do you handle data skew?* · *Broadcast join?* · *repartition vs coalesce?* · *When should you cache?* · *Why is my job slow?*
> **Time budget:** 4 hours, with PySpark installed locally (`pip install pyspark`) or a free Databricks or Fabric trial.

## DE6.1 When Spark, and when not 🟢

Spark processes data **in parallel across a cluster**, in memory where possible. It's the right tool for data too big for one machine (hundreds of GB to PB), heavy joins and aggregations over a lakehouse, and pipelines mixing batch and streaming. It's overkill for a few GB, where pandas, Polars or DuckDB on one machine are simpler and often faster ([[DE4.4]]).

## DE6.2 The execution model 🟢 ⭐

<figure class="dia"><svg viewBox="0 0 720 230" role="img" aria-label="Spark architecture: driver with DAG scheduler, cluster manager, executors running tasks on partitions">
<rect class="sA" x="20" y="70" width="160" height="90" rx="10"/><text class="sT" x="100" y="96" text-anchor="middle">Driver</text><text class="sS" x="100" y="116" text-anchor="middle">your program, plans</text><text class="sS" x="100" y="132" text-anchor="middle">jobs → stages → tasks</text>
<rect class="sW" x="230" y="90" width="120" height="50" rx="8"/><text class="sT" x="290" y="112" text-anchor="middle">Cluster</text><text class="sS" x="290" y="128" text-anchor="middle">manager</text>
<rect class="sG" x="420" y="15" width="280" height="60" rx="8"/><text class="sT" x="440" y="38">Executor 1</text><text class="sS" x="440" y="58">task · task · task  (one per core)</text>
<rect class="sG" x="420" y="88" width="280" height="60" rx="8"/><text class="sT" x="440" y="111">Executor 2</text><text class="sS" x="440" y="131">task · task · task</text>
<rect class="sG" x="420" y="161" width="280" height="60" rx="8"/><text class="sT" x="440" y="184">Executor N</text><text class="sS" x="440" y="204">task · task · task</text>
<line class="sL" x1="180" y1="115" x2="230" y2="115"/><line class="sD" x1="350" y1="115" x2="420" y2="45"/><line class="sD" x1="350" y1="115" x2="420" y2="118"/><line class="sD" x1="350" y1="115" x2="420" y2="191"/>
</svg><figcaption>The driver plans the work; executors on worker nodes run one task per partition per core.</figcaption></figure>

| Term | Meaning |
|---|---|
| **Driver** | The process running your program: builds the plan, schedules tasks, collects results |
| **Executor** | A worker process (a JVM) with some cores and memory, running tasks and caching data |
| **Cluster manager** | Allocates executors: YARN, Kubernetes, Spark standalone, or the platform (Databricks, Fabric) |
| **Partition** | A chunk of the data; the unit of parallelism |
| **Task** | One unit of work on one partition, run by one core |
| **Stage** | A set of tasks that can run without moving data between executors; **stage boundaries are shuffles** |
| **Job** | All the stages triggered by one **action** |

## DE6.3 Lazy evaluation: transformations and actions 🟢 ⭐

**Transformations** (`select`, `filter`, `withColumn`, `join`, `groupBy`) only **describe** a new DataFrame; nothing runs. **Actions** (`count`, `collect`, `show`, `write`, `toPandas`) trigger execution. Laziness lets Spark's **Catalyst optimiser** see the whole plan and improve it: push filters down to the Parquet reader, prune columns, reorder and pick join strategies.

```python
from pyspark.sql import SparkSession, functions as F
spark = SparkSession.builder.appName("orders-daily").getOrCreate()

orders = (spark.read.format("delta").load("abfss://lake@acct.dfs.core.windows.net/silver/orders")
          .filter(F.col("order_date") == "2026-10-02")                  # pushed down: partition pruning
          .select("order_id", "customer_id", "city", "amount", "status"))  # column pruning
customers = spark.read.table("silver.customers").select("customer_id", "segment")

daily = (orders.filter(F.col("status") == "paid")
         .join(customers, "customer_id", "left")
         .groupBy("city", "segment")
         .agg(F.sum("amount").alias("revenue"), F.countDistinct("customer_id").alias("customers")))

(daily.withColumn("order_date", F.lit("2026-10-02"))
      .write.format("delta").mode("overwrite")
      .option("replaceWhere", "order_date = '2026-10-02'")               # idempotent: replace only that day
      .partitionBy("order_date")
      .saveAsTable("gold.daily_city_segment_revenue"))                     # the action: everything runs now
```

`daily.explain(mode="formatted")` shows the physical plan. Spark SQL and the DataFrame API compile to the **same** plans, so use whichever is clearer.

> [!say]
> "Spark is lazy: transformations build a logical plan and nothing runs until an action like write or count. That lets the Catalyst optimiser push filters into the Parquet or Delta scan, prune columns and choose join strategies. The driver then splits the job into stages at shuffle boundaries, and each stage into tasks, one per partition, run in parallel on the executors."

> [!mistake] `collect()` on big data
> `collect()` and `toPandas()` bring **all** rows to the driver, which runs out of memory on large data. Aggregate or limit first, or write results to storage.

## DE6.4 Narrow vs wide transformations and the shuffle 🟢 🟡 ⭐

| | Narrow | Wide |
|---|---|---|
| Each output partition depends on | **One** input partition | **Many** input partitions |
| Examples | `select`, `filter`, `withColumn`, `map` | `groupBy`, `join` (non-broadcast), `distinct`, `orderBy`, `repartition`, window functions |
| Data movement | None | A **shuffle**: data is written to disk, sent over the network and regrouped by key |

> [!term] Shuffle
> Redistributing data across executors so that all rows with the same key end up in the same partition. It costs disk writes, network transfer, serialisation and memory, and it's where most Spark jobs spend their time. Reducing the amount of data shuffled, and the number of shuffles, is the core of Spark tuning.

## DE6.5 Joins 🟡 ⭐

| Strategy | How | When Spark uses it |
|---|---|---|
| **Broadcast hash join** | Send the small table to **every** executor; join locally with no shuffle of the big table | One side is small (default threshold `spark.sql.autoBroadcastJoinThreshold` = 10 MB; AQE can switch at run time) |
| **Sort-merge join** | Shuffle both sides by the join key, sort, then merge | Two large tables (the default) |
| **Shuffle hash join** | Shuffle both, build a hash table on the smaller side per partition | When one side is moderately small per partition |

```python
from pyspark.sql.functions import broadcast
enriched = orders.join(broadcast(dim_city), "city_id")      # force a broadcast of a small dimension
```

**Fact-to-dimension joins** are usually broadcasts. Filtering and aggregating **before** joining large tables shrinks the shuffle.

## DE6.6 Partitions: how many, and how big 🟡 ⭐

- **Input partitions** come from files (roughly 128 MB per partition by default, `spark.sql.files.maxPartitionBytes`).
- **Shuffle partitions** default to **200** (`spark.sql.shuffle.partitions`): too many for small data (tiny tasks, overhead) and too few for huge data (spills to disk, slow tasks). Aim for partitions of roughly **100–200 MB** after the shuffle, and at least two to three times the total number of cores.
- **Adaptive Query Execution** (on by default since Spark 3.2) coalesces small shuffle partitions automatically at run time.

| | `repartition(n)` / `repartition("col")` | `coalesce(n)` |
|---|---|---|
| Can increase partitions | Yes | No |
| Shuffle | **Yes** (full) | **No** (merges existing partitions) |
| Balance | Even | Can be uneven |
| Use | Before a big write partitioned by a column; to fix skewed or too-few partitions | Reduce the number of output files cheaply at the end |

## DE6.7 Data skew 🟡 ⭐

> [!term] Data skew
> A few keys hold a large share of the rows (a "walk-in customer" ID, a NULL key, one huge merchant, Cairo vs a small governorate). After a shuffle, one partition is enormous, so one task runs for an hour while the other 199 finish in a minute.

**Spot it** in the Spark UI: one or a few tasks in a stage take far longer and read far more shuffle data than the median.

**Fix it:**

1. **Adaptive Query Execution's skew-join handling** (`spark.sql.adaptive.skewJoin.enabled`, on by default) splits skewed partitions automatically for sort-merge joins. Try this first.
2. **Handle special keys separately:** filter out NULL or placeholder keys and process them on their own.
3. **Broadcast** the other side if it's small enough.
4. **Salting:** add a random suffix (0–N) to the hot key on the big side and replicate the matching rows N times on the other side, so the hot key spreads across N partitions; then aggregate in two steps.

```python
SALT = 16
big = big.withColumn("salt", (F.rand() * SALT).cast("int"))
small_salted = small.crossJoin(spark.range(SALT).withColumnRenamed("id", "salt"))
joined = big.join(small_salted, ["merchant_id", "salt"])
```

> [!say]
> "Skew shows up in the Spark UI as a few tasks taking much longer and reading far more shuffle data. I'd first rely on adaptive query execution's skew-join handling, then deal with NULL or placeholder keys separately, broadcast the smaller side if possible, and as a last resort salt the hot keys so they spread across several partitions."

## DE6.8 Caching 🟡

`df.cache()` (or `persist(StorageLevel...)`) keeps a DataFrame in executor memory (spilling to disk) after the **first action** computes it. Cache only when the **same** DataFrame is reused by **several actions** and is expensive to recompute; unpersist it afterwards. Caching everything wastes memory and can slow jobs down. On Databricks, the automatic disk cache already speeds repeated reads of the same files.

## DE6.9 Adaptive Query Execution and Spark 4 🟡 ⭐

> [!term] Adaptive Query Execution (AQE)
> Re-optimising a query **while it runs**, using statistics from completed stages: coalescing small shuffle partitions, switching a sort-merge join to a broadcast join when one side turns out small, and splitting skewed partitions. It's enabled by default since Spark 3.2 and removes much manual tuning.

**What's new in Spark 4.x** (4.0 released in 2025):

- **ANSI SQL mode on by default**: invalid casts and arithmetic overflows now **raise errors** instead of silently returning NULL, which surfaces data problems but can break older jobs.
- **Spark Connect** near feature parity with "classic" Spark: thin clients (Python, Scala, Go, Rust and more) talk to a remote Spark server.
- The **VARIANT** data type for semi-structured data, SQL user-defined functions, session variables, and **pipe syntax** in SQL.
- Python data-source API improvements, and Structured Streaming state improvements.
- **Spark Declarative Pipelines** (in Spark 4.1): an open-source declarative framework for batch and streaming pipelines, contributed by Databricks from what was Delta Live Tables (Databricks' product is now called **Lakeflow** declarative pipelines).

## DE6.10 Reading the Spark UI 🟡 ⭐

"Why is my job slow?", worked through the UI:

1. **Jobs → Stages:** which stage takes the time?
2. **Stage details:** task duration distribution (skew = a long tail), **shuffle read/write** sizes (big shuffles), **spill** (memory or disk) indicating partitions that are too big, GC time.
3. **SQL / DataFrame tab:** the physical plan with actual row counts: a sort-merge join that should have been a broadcast, a filter that wasn't pushed down, a scan reading all partitions.
4. **Executors tab:** failed tasks, memory pressure, uneven work.

**Common fixes:** filter and select earlier; fix partitioning (sizes, AQE); broadcast small sides; handle skew; avoid Python UDFs (use built-in functions, or **pandas/Arrow UDFs** when you must, which are vectorised); compact small input files; cache only reused results; size the cluster to the work.

> [!mistake] Row-by-row Python UDFs
> A plain Python UDF serialises each row from the JVM to a Python worker and back: often 10–100× slower than a built-in function. Most logic can be written with `pyspark.sql.functions` (when, regexp, date functions, higher-order array functions). If not, use a **pandas UDF**, which processes Arrow batches.

## DE6.11 Structured Streaming in one section 🟡

Spark Structured Streaming treats a stream as an **unbounded table** and runs the same DataFrame operations incrementally (as **micro-batches** by default).

```python
events = (spark.readStream.format("kafka")
          .option("kafka.bootstrap.servers", brokers).option("subscribe", "orders").load()
          .select(F.from_json(F.col("value").cast("string"), order_schema).alias("o")).select("o.*"))

per_minute = (events.withWatermark("event_time", "10 minutes")                  # accept data up to 10 min late
              .groupBy(F.window("event_time", "1 minute"), "city")
              .agg(F.sum("amount").alias("revenue")))

(per_minute.writeStream.format("delta").outputMode("append")
           .option("checkpointLocation", "abfss://.../_checkpoints/revenue_per_minute")   # exactly-once with Delta
           .toTable("gold.revenue_per_minute"))
```

The **checkpoint** stores offsets and state so a restarted query resumes exactly where it left off; with idempotent sinks like Delta, the result is **exactly-once**. **Watermarks** bound how late data may arrive and how long state is kept. Streaming concepts are in [[DE8]].

> [!lab] Your first real Spark job (from your gaps file)
> Locally or on a Databricks/Fabric trial: load a year of a large public dataset (NYC taxi trips in Parquet, about tens of millions of rows) into a Delta table partitioned by date. Write a job that joins it with a zone dimension (broadcast), aggregates revenue and trip counts per zone per day, and writes with `replaceWhere` for one day (idempotent). Then open the Spark UI: find the shuffle, change `spark.sql.shuffle.partitions`, deliberately create skew (a fake hot zone) and fix it, and compare a Python UDF with a built-in function. Write down timings. Now "Spark" is something you've done.

## DE6.12 Interview drill 🟢 ⭐

| Question | Strong short answer |
|---|---|
| How does Spark execute a job? | The driver builds a plan, splits it into stages at shuffle boundaries and stages into tasks (one per partition) run in parallel on executors. |
| Transformation vs action? | Transformations lazily define new DataFrames; actions (count, write, collect) trigger execution. |
| Why lazy evaluation? | So Catalyst can optimise the whole plan: push filters, prune columns, choose joins. |
| Narrow vs wide transformation? | Narrow needs one input partition per output partition; wide needs many and causes a shuffle. |
| Why are shuffles expensive? | Disk writes, network transfer, serialisation and memory pressure. |
| Broadcast join? | Copy a small table to every executor so the big table isn't shuffled; auto below about 10 MB or via hint. |
| repartition vs coalesce? | repartition shuffles and can increase partitions; coalesce merges without a shuffle and only decreases. |
| How do you handle skew? | AQE skew-join handling, separate handling of hot or NULL keys, broadcast, or salting. |
| When do you cache? | When the same expensive DataFrame feeds several actions; unpersist afterwards. |
| What is AQE? | Run-time re-optimisation using real statistics: coalescing partitions, switching joins, splitting skew. |
| Why avoid Python UDFs? | Row-by-row serialisation between JVM and Python; use built-ins or vectorised pandas UDFs. |
| What changed in Spark 4? | ANSI mode by default, Spark Connect parity, VARIANT type, SQL UDFs and pipe syntax; declarative pipelines in 4.1. |
| How does Structured Streaming achieve exactly-once? | Checkpointed offsets and state plus idempotent sinks such as Delta. |
| Your job is slow. Where do you look? | The Spark UI: slow stages, task skew, shuffle sizes, spills, and the physical plan's join types and pruning. |

## Key takeaways

> [!check]
> - Driver plans, executors run tasks per partition; stages break at shuffles.
> - Laziness lets Catalyst optimise; actions trigger work; never collect big data.
> - Shuffles dominate cost: filter early, broadcast small sides, size partitions well.
> - Skew is the classic slow job: AQE first, then special keys, broadcast or salting.
> - Use built-in functions, read the Spark UI, and let AQE do the routine tuning.

## Sources

- Apache Spark documentation: [Cluster mode overview](https://spark.apache.org/docs/latest/cluster-overview.html), [SQL performance tuning (AQE, joins, partitions)](https://spark.apache.org/docs/latest/sql-performance-tuning.html), [Structured Streaming programming guide](https://spark.apache.org/docs/latest/streaming/index.html), [Web UI](https://spark.apache.org/docs/latest/web-ui.html), [Spark 4.0.0 release notes](https://spark.apache.org/releases/spark-release-4-0-0.html), [Spark Declarative Pipelines](https://spark.apache.org/docs/latest/declarative-pipelines-programming-guide.html).
- Databricks: [Introducing Apache Spark 4.0](https://www.databricks.com/blog/introducing-apache-spark-40), [Lakeflow Spark Declarative Pipelines](https://docs.databricks.com/aws/en/ldp/).
- Matei Zaharia et al., "Resilient Distributed Datasets" (NSDI 2012); Michael Armbrust et al., "Spark SQL: Relational Data Processing in Spark" (SIGMOD 2015).
- Jules Damji et al., *Learning Spark*, 2nd ed. (O'Reilly, 2020).
- Microsoft Learn: [Apache Spark in Microsoft Fabric](https://learn.microsoft.com/en-us/fabric/data-engineering/spark-compute).
