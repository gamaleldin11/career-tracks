# Apache Spark — How It Runs, Why Jobs Are Slow, and How to Fix Them

Spark is the most-asked distributed engine in data-engineering interviews, whether the company runs Databricks, Microsoft Fabric, Synapse, EMR or on-premises Cloudera. You studied it through Huawei's HCIA Big Data material; this module turns that into the working knowledge interviewers probe: the execution model (driver, executors, stages, tasks), lazy evaluation, shuffles and partitions, join strategies, data skew, caching, Adaptive Query Execution, and Structured Streaming. Your gaps file is honest that you haven't written Spark on real data yet; the lab fixes that.

> [!focus]
> **Entry must:** explain driver, executors, partitions and tasks; transformations vs actions and lazy evaluation; narrow vs wide transformations and shuffles; write a PySpark job that reads, transforms, joins, aggregates and writes partitioned output.
> **Mid adds:** reading the Spark UI, broadcast vs sort-merge joins, data skew and salting, partition sizing, caching, Adaptive Query Execution, small files, Spark SQL vs the DataFrame API, Structured Streaming basics, what changed in Spark 4.
> **Most asked:** *How does Spark execute a job?* · *What is a shuffle and why is it expensive?* · *Transformations vs actions?* · *How do you handle data skew?* · *Broadcast join?* · *repartition vs coalesce?* · *When should you cache?* · *Why is my job slow?*
> **Time budget:** 4 hours, with PySpark installed locally (`pip install pyspark`) or a free Databricks or Fabric trial.

## DE6.0 Foundations: split the work, then combine 🟢

A single machine reads a few hundred megabytes per second from disk. A 2 TB table would take over an hour just to scan, before any computation. Spark's answer is old and simple: **split the data into partitions, process every partition at the same time on many cores and machines, then combine the small partial results**.

<figure class="dia anim"><svg viewBox="0 0 720 240" role="img" aria-label="Animation: a large table split into six partitions, each counted in parallel, with the small partial counts combined into a final result">
<rect class="sB" x="14" y="80" width="110" height="70" rx="8"/><text class="sT" x="69" y="113" text-anchor="middle">orders</text><text class="sC" x="69" y="129" text-anchor="middle">600 M rows</text>
<line class="sLm" x1="124" y1="115" x2="166" y2="28"/>
<rect class="sV" x="170" y="14" width="70" height="28" rx="4"/><text class="sT" x="205" y="33" text-anchor="middle">p1</text>
<line class="sLm" x1="240" y1="28" x2="276" y2="28" marker-end="url(#ahm)"/><rect class="sA" x="280" y="14" width="170" height="28" rx="4" opacity=".8"/><text class="sC" x="365" y="33" text-anchor="middle">Cairo 41 · Giza 12</text>
<line class="sLm" x1="450" y1="28" x2="516" y2="112"/>
<line class="sLm" x1="124" y1="115" x2="166" y2="62"/>
<rect class="sV" x="170" y="48" width="70" height="28" rx="4"/><text class="sT" x="205" y="67" text-anchor="middle">p2</text>
<line class="sLm" x1="240" y1="62" x2="276" y2="62" marker-end="url(#ahm)"/><rect class="sA" x="280" y="48" width="170" height="28" rx="4" opacity=".8"/><text class="sC" x="365" y="67" text-anchor="middle">Cairo 39 · Giza 15</text>
<line class="sLm" x1="450" y1="62" x2="516" y2="112"/>
<line class="sLm" x1="124" y1="115" x2="166" y2="96"/>
<rect class="sV" x="170" y="82" width="70" height="28" rx="4"/><text class="sT" x="205" y="101" text-anchor="middle">p3</text>
<line class="sLm" x1="240" y1="96" x2="276" y2="96" marker-end="url(#ahm)"/><rect class="sA" x="280" y="82" width="170" height="28" rx="4" opacity=".8"/><text class="sC" x="365" y="101" text-anchor="middle">Cairo 44 · Giza 9</text>
<line class="sLm" x1="450" y1="96" x2="516" y2="112"/>
<line class="sLm" x1="124" y1="115" x2="166" y2="130"/>
<rect class="sV" x="170" y="116" width="70" height="28" rx="4"/><text class="sT" x="205" y="135" text-anchor="middle">p4</text>
<line class="sLm" x1="240" y1="130" x2="276" y2="130" marker-end="url(#ahm)"/><rect class="sA" x="280" y="116" width="170" height="28" rx="4" opacity=".8"/><text class="sC" x="365" y="135" text-anchor="middle">Cairo 40 · Giza 13</text>
<line class="sLm" x1="450" y1="130" x2="516" y2="112"/>
<line class="sLm" x1="124" y1="115" x2="166" y2="164"/>
<rect class="sV" x="170" y="150" width="70" height="28" rx="4"/><text class="sT" x="205" y="169" text-anchor="middle">p5</text>
<line class="sLm" x1="240" y1="164" x2="276" y2="164" marker-end="url(#ahm)"/><rect class="sA" x="280" y="150" width="170" height="28" rx="4" opacity=".8"/><text class="sC" x="365" y="169" text-anchor="middle">Cairo 38 · Giza 14</text>
<line class="sLm" x1="450" y1="164" x2="516" y2="112"/>
<line class="sLm" x1="124" y1="115" x2="166" y2="198"/>
<rect class="sV" x="170" y="184" width="70" height="28" rx="4"/><text class="sT" x="205" y="203" text-anchor="middle">p6</text>
<line class="sLm" x1="240" y1="198" x2="276" y2="198" marker-end="url(#ahm)"/><rect class="sA" x="280" y="184" width="170" height="28" rx="4" opacity=".8"/><text class="sC" x="365" y="203" text-anchor="middle">Cairo 42 · Giza 11</text>
<line class="sLm" x1="450" y1="198" x2="516" y2="112"/>
<rect class="sG" x="520" y="84" width="186" height="56" rx="8"/><text class="sT" x="613" y="110" text-anchor="middle">combine</text><text class="sC" x="613" y="126" text-anchor="middle">Cairo 244 · Giza 74</text>
<text class="sC" x="205" y="228" text-anchor="middle">partitions</text><text class="sC" x="365" y="228" text-anchor="middle">partial counts, in parallel</text><text class="sC" x="613" y="228" text-anchor="middle">one small final step</text>
<circle class="sP" r="5"><animateMotion dur="4s" begin="0.0s" repeatCount="indefinite" path="M124 115 L170 28 H450 L520 112"/></circle>
<circle class="sPg" r="5"><animateMotion dur="4s" begin="0.8s" repeatCount="indefinite" path="M124 115 L170 96 H450 L520 112"/></circle>
<circle class="sPw" r="5"><animateMotion dur="4s" begin="1.6s" repeatCount="indefinite" path="M124 115 L170 164 H450 L520 112"/></circle>
</svg><figcaption>Split, work on every piece at once, combine the small results. Everything in Spark is a variation of this.</figcaption></figure>

Some operations (filtering rows, computing a column) work on each partition alone. Others (totals per city, joins) need all rows with the same key together, so data must move between machines first: a **shuffle**. Nearly everything about Spark performance comes down to how much data moves, and how evenly the work is spread.

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

<figure class="dia steps"><svg viewBox="0 0 720 196" role="img" aria-label="Spark lazy evaluation: read, filter, select and groupBy only build a plan; the write action triggers Catalyst to optimise it by pruning columns and pushing the filter into the scan">
<g data-s="1"><rect class="sB" x="20" y="24" width="220" height="28" rx="5" stroke-dasharray="5 3"/><text class="sC" x="130" y="43" text-anchor="middle">read orders (Parquet)</text><line class="sLm" x1="130" y1="52" x2="130" y2="58"/></g>
<g data-s="2"><rect class="sV" x="20" y="58" width="220" height="28" rx="5" stroke-dasharray="5 3"/><text class="sC" x="130" y="77" text-anchor="middle">filter date ≥ 1 Oct</text><line class="sLm" x1="130" y1="86" x2="130" y2="92"/></g>
<g data-s="3"><rect class="sV" x="20" y="92" width="220" height="28" rx="5" stroke-dasharray="5 3"/><text class="sC" x="130" y="111" text-anchor="middle">select city, amount</text><line class="sLm" x1="130" y1="120" x2="130" y2="126"/></g>
<g data-s="4"><rect class="sV" x="20" y="126" width="220" height="28" rx="5" stroke-dasharray="5 3"/><text class="sC" x="130" y="145" text-anchor="middle">groupBy city · sum</text><line class="sLm" x1="130" y1="154" x2="130" y2="160"/></g>
<g data-s="5"><rect class="sR" x="20" y="160" width="220" height="28" rx="5"/><text class="sC" x="130" y="179" text-anchor="middle">write (action)</text></g>
<g data-s="1-4"><text class="sC" x="470" y="90" text-anchor="middle">nothing has run yet:</text><text class="sC" x="470" y="110" text-anchor="middle">Spark is only recording a plan</text></g>
<g data-s="5-5"><rect class="sG" x="320" y="24" width="380" height="150" rx="10" opacity=".25"/><text class="sT" x="510" y="46" text-anchor="middle">optimised physical plan (Catalyst)</text><text class="sC" x="340" y="74">1. scan only city, amount, date columns</text><text class="sC" x="340" y="96">2. push date ≥ 1 Oct into the scan:</text><text class="sC" x="340" y="114">   skip old files and row groups</text><text class="sC" x="340" y="136">3. partial sums per partition, shuffle,</text><text class="sC" x="340" y="154">   final sums, write</text></g>
</svg><ol class="dia-steps">
<li><code>spark.read.parquet(...)</code> returns instantly: it only records where the data is.</li>
<li><code>filter</code> adds a step to the plan. Still nothing is read.</li>
<li><code>select</code> adds another step.</li>
<li><code>groupBy().agg()</code> too. Four lines of code, zero work done.</li>
<li>The <b>action</b> (<code>write</code>) hands the whole plan to the optimiser, which prunes columns and pushes the filter down to the files before a single byte is read.</li>
</ol><figcaption>Laziness is what lets Spark optimise across your whole program instead of executing it line by line.</figcaption></figure>

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

<figure class="dia"><svg viewBox="0 0 720 222" role="img" aria-label="Narrow transformations map each input partition to one output partition with no data movement; wide transformations like groupBy shuffle rows from every partition to the partition owning their key">
<text class="sM" x="180" y="22" text-anchor="middle">narrow: filter, select</text>
<rect class="sB" x="30" y="40" width="80" height="34" rx="4"/><text class="sC" x="70" y="62" text-anchor="middle">in 1</text>
<rect class="sB" x="250" y="40" width="80" height="34" rx="4"/><text class="sC" x="290" y="62" text-anchor="middle">out 1</text>
<line class="sLm" x1="110" y1="57" x2="246" y2="57" marker-end="url(#ahm)"/>
<rect class="sB" x="30" y="90" width="80" height="34" rx="4"/><text class="sC" x="70" y="112" text-anchor="middle">in 2</text>
<rect class="sB" x="250" y="90" width="80" height="34" rx="4"/><text class="sC" x="290" y="112" text-anchor="middle">out 2</text>
<line class="sLm" x1="110" y1="107" x2="246" y2="107" marker-end="url(#ahm)"/>
<rect class="sB" x="30" y="140" width="80" height="34" rx="4"/><text class="sC" x="70" y="162" text-anchor="middle">in 3</text>
<rect class="sB" x="250" y="140" width="80" height="34" rx="4"/><text class="sC" x="290" y="162" text-anchor="middle">out 3</text>
<line class="sLm" x1="110" y1="157" x2="246" y2="157" marker-end="url(#ahm)"/>
<text class="sGt" x="180" y="210" text-anchor="middle">no data moves</text>
<text class="sM" x="540" y="22" text-anchor="middle">wide: groupBy city → shuffle</text>
<rect class="sB" x="390" y="40" width="80" height="34" rx="4"/><text class="sC" x="430" y="62" text-anchor="middle">in 1</text>
<rect class="sA" x="610" y="40" width="80" height="34" rx="4"/><text class="sC" x="650" y="62" text-anchor="middle">Cairo</text>
<line class="sLm" x1="470" y1="57" x2="606" y2="57" opacity=".7"/>
<line class="sLm" x1="470" y1="57" x2="606" y2="107" opacity=".7"/>
<line class="sLm" x1="470" y1="57" x2="606" y2="157" opacity=".7"/>
<rect class="sB" x="390" y="90" width="80" height="34" rx="4"/><text class="sC" x="430" y="112" text-anchor="middle">in 2</text>
<rect class="sV" x="610" y="90" width="80" height="34" rx="4"/><text class="sC" x="650" y="112" text-anchor="middle">Giza</text>
<line class="sLm" x1="470" y1="107" x2="606" y2="57" opacity=".7"/>
<line class="sLm" x1="470" y1="107" x2="606" y2="107" opacity=".7"/>
<line class="sLm" x1="470" y1="107" x2="606" y2="157" opacity=".7"/>
<rect class="sB" x="390" y="140" width="80" height="34" rx="4"/><text class="sC" x="430" y="162" text-anchor="middle">in 3</text>
<rect class="sG" x="610" y="140" width="80" height="34" rx="4"/><text class="sC" x="650" y="162" text-anchor="middle">Alex</text>
<line class="sLm" x1="470" y1="157" x2="606" y2="57" opacity=".7"/>
<line class="sLm" x1="470" y1="157" x2="606" y2="107" opacity=".7"/>
<line class="sLm" x1="470" y1="157" x2="606" y2="157" opacity=".7"/>
<text class="sRt" x="540" y="210" text-anchor="middle">every partition sends to every other</text>
</svg><figcaption>The shuffle is the expensive part of almost every slow Spark job. Stage boundaries are drawn exactly there.</figcaption></figure>

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

<figure class="dia"><svg viewBox="0 0 720 234" role="img" aria-label="Broadcast hash join copies a small dimension table to every executor so the large fact partitions do not move; sort-merge join shuffles both large sides by key into aligned partitions">
<text class="sGt" x="176" y="20" text-anchor="middle">broadcast hash join</text><text class="sWt" x="540" y="20" text-anchor="middle">sort-merge join</text>
<rect class="sB" x="30" y="40" width="110" height="42" rx="4"/><text class="sC" x="85" y="66" text-anchor="middle">fact part 1</text><rect class="sG" x="160" y="46" width="90" height="30" rx="4"/><text class="sC" x="205" y="66" text-anchor="middle">dim (copy)</text>
<rect class="sB" x="30" y="96" width="110" height="42" rx="4"/><text class="sC" x="85" y="122" text-anchor="middle">fact part 2</text><rect class="sG" x="160" y="102" width="90" height="30" rx="4"/><text class="sC" x="205" y="122" text-anchor="middle">dim (copy)</text>
<rect class="sB" x="30" y="152" width="110" height="42" rx="4"/><text class="sC" x="85" y="178" text-anchor="middle">fact part 3</text><rect class="sG" x="160" y="158" width="90" height="30" rx="4"/><text class="sC" x="205" y="178" text-anchor="middle">dim (copy)</text>
<rect class="sG" x="270" y="92" width="70" height="40" rx="8"/><text class="sT" x="305" y="110" text-anchor="middle">dim</text><text class="sC" x="305" y="126" text-anchor="middle">5 MB</text>
<line class="sLg" x1="270" y1="112" x2="252" y2="61" marker-end="url(#ahg)"/>
<line class="sLg" x1="270" y1="112" x2="252" y2="117" marker-end="url(#ahg)"/>
<line class="sLg" x1="270" y1="112" x2="252" y2="173" marker-end="url(#ahg)"/>
<text class="sC" x="176" y="222" text-anchor="middle">big side stays put; small side copied</text>
<line class="sD" x1="360" y1="12" x2="360" y2="232"/>
<rect class="sB" x="380" y="40" width="90" height="42" rx="4"/><text class="sC" x="425" y="66" text-anchor="middle">A part 1</text><rect class="sA" x="600" y="40" width="100" height="42" rx="4"/><text class="sC" x="650" y="58" text-anchor="middle">keys 0-3</text><text class="sC" x="650" y="74" text-anchor="middle">A + B, sorted</text>
<line class="sLm" x1="470" y1="61" x2="596" y2="61" opacity=".6"/>
<line class="sLm" x1="470" y1="61" x2="596" y2="117" opacity=".6"/>
<line class="sLm" x1="470" y1="61" x2="596" y2="173" opacity=".6"/>
<rect class="sB" x="380" y="96" width="90" height="42" rx="4"/><text class="sC" x="425" y="122" text-anchor="middle">A part 2</text><rect class="sV" x="600" y="96" width="100" height="42" rx="4"/><text class="sC" x="650" y="114" text-anchor="middle">keys 4-7</text><text class="sC" x="650" y="130" text-anchor="middle">A + B, sorted</text>
<line class="sLm" x1="470" y1="117" x2="596" y2="61" opacity=".6"/>
<line class="sLm" x1="470" y1="117" x2="596" y2="117" opacity=".6"/>
<line class="sLm" x1="470" y1="117" x2="596" y2="173" opacity=".6"/>
<rect class="sB" x="380" y="152" width="90" height="42" rx="4"/><text class="sC" x="425" y="178" text-anchor="middle">A part 3</text><rect class="sG" x="600" y="152" width="100" height="42" rx="4"/><text class="sC" x="650" y="170" text-anchor="middle">keys 8-9</text><text class="sC" x="650" y="186" text-anchor="middle">A + B, sorted</text>
<line class="sLm" x1="470" y1="173" x2="596" y2="61" opacity=".6"/>
<line class="sLm" x1="470" y1="173" x2="596" y2="117" opacity=".6"/>
<line class="sLm" x1="470" y1="173" x2="596" y2="173" opacity=".6"/>
<text class="sC" x="540" y="222" text-anchor="middle">both sides shuffled by key, then merged</text>
</svg><figcaption>Fact-to-dimension joins should be broadcasts. Two big tables need a shuffle, so filter and aggregate them first.</figcaption></figure>

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

<figure class="dia"><svg viewBox="0 0 720 232" role="img" aria-label="Task durations in a stage: thirty-nine tasks take about ten seconds and one task with a hot key takes three minutes; salting spreads the key over sixteen tasks">
<rect class="sB" x="40" y="187.637" width="8" height="12.3626" rx="1"/>
<rect class="sB" x="50" y="187.682" width="8" height="12.3183" rx="1"/>
<rect class="sB" x="60" y="192.495" width="8" height="7.50538" rx="1"/>
<rect class="sB" x="70" y="192.342" width="8" height="7.65831" rx="1"/>
<rect class="sB" x="80" y="188.288" width="8" height="11.7117" rx="1"/>
<rect class="sB" x="90" y="188.826" width="8" height="11.1742" rx="1"/>
<rect class="sB" x="100" y="189.183" width="8" height="10.8165" rx="1"/>
<rect class="sB" x="110" y="191.136" width="8" height="8.86394" rx="1"/>
<rect class="sB" x="120" y="189.528" width="8" height="10.4721" rx="1"/>
<rect class="sB" x="130" y="189.523" width="8" height="10.4767" rx="1"/>
<rect class="sB" x="140" y="189.661" width="8" height="10.3385" rx="1"/>
<rect class="sB" x="150" y="191.945" width="8" height="8.05527" rx="1"/>
<rect class="sB" x="160" y="190.474" width="8" height="9.52562" rx="1"/>
<rect class="sB" x="170" y="190.675" width="8" height="9.32507" rx="1"/>
<rect class="sB" x="180" y="188.896" width="8" height="11.1043" rx="1"/>
<rect class="sB" x="190" y="187.428" width="8" height="12.572" rx="1"/>
<rect class="sB" x="200" y="187.673" width="8" height="12.3267" rx="1"/>
<rect class="sB" x="210" y="189.861" width="8" height="10.1386" rx="1"/>
<rect class="sB" x="220" y="190.398" width="8" height="9.60221" rx="1"/>
<rect class="sB" x="230" y="191.351" width="8" height="8.6485" rx="1"/>
<rect class="sB" x="240" y="192.606" width="8" height="7.39399" rx="1"/>
<rect class="sB" x="250" y="192.652" width="8" height="7.3482" rx="1"/>
<rect class="sB" x="260" y="190.29" width="8" height="9.71043" rx="1"/>
<rect class="sB" x="270" y="191.08" width="8" height="8.91971" rx="1"/>
<rect class="sB" x="280" y="190.748" width="8" height="9.25208" rx="1"/>
<rect class="sB" x="290" y="187.984" width="8" height="12.0157" rx="1"/>
<rect class="sB" x="300" y="189.961" width="8" height="10.0391" rx="1"/>
<rect class="sR" x="310" y="38" width="8" height="162" rx="1"/>
<rect class="sB" x="320" y="191.525" width="8" height="8.47507" rx="1"/>
<rect class="sB" x="330" y="192.671" width="8" height="7.32883" rx="1"/>
<rect class="sB" x="340" y="191.044" width="8" height="8.95577" rx="1"/>
<rect class="sB" x="350" y="192.062" width="8" height="7.93817" rx="1"/>
<rect class="sB" x="360" y="190.045" width="8" height="9.95521" rx="1"/>
<rect class="sB" x="370" y="187.407" width="8" height="12.5929" rx="1"/>
<rect class="sB" x="380" y="189.158" width="8" height="10.8422" rx="1"/>
<rect class="sB" x="390" y="191.818" width="8" height="8.18195" rx="1"/>
<rect class="sB" x="400" y="187.975" width="8" height="12.0253" rx="1"/>
<rect class="sB" x="410" y="188.497" width="8" height="11.5025" rx="1"/>
<rect class="sB" x="420" y="188.834" width="8" height="11.1658" rx="1"/>
<rect class="sB" x="430" y="187.904" width="8" height="12.0956" rx="1"/>
<line class="sLm" x1="30" y1="200" x2="450" y2="200"/><text class="sC" x="240" y="220" text-anchor="middle">task durations in one stage (seconds)</text>
<text class="sRt" x="320" y="36">one task holds the hot key: 3 minutes</text>
<text class="sC" x="320" y="54">the stage waits for it; 39 cores sit idle</text>
<rect class="sG" x="480" y="80" width="226" height="96" rx="8" opacity=".8"/><text class="sT" x="593" y="102" text-anchor="middle">after salting (16 buckets)</text><text class="sC" x="593" y="124" text-anchor="middle">the hot key spreads over</text><text class="sC" x="593" y="142" text-anchor="middle">16 tasks of about 12 s</text><text class="sGt" x="593" y="164" text-anchor="middle">stage time: 3 min → ~15 s</text>
</svg><figcaption>Skew in the Spark UI: a long tail in task duration and shuffle read. A stage is only as fast as its slowest task.</figcaption></figure>

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

<figure class="dia"><svg viewBox="0 0 720 222" role="img" aria-label="Structured Streaming treats incoming events as rows appended to an unbounded table; each micro-batch runs the same query incrementally and updates a result table">
<text class="sM" x="150" y="22" text-anchor="middle">input: an unbounded table</text>
<rect class="sB" x="60" y="32" width="180" height="22" rx="3"/><text class="sC" x="150" y="47" text-anchor="middle">10:00:01 order</text>
<rect class="sB" x="60" y="56" width="180" height="22" rx="3"/><text class="sC" x="150" y="71" text-anchor="middle">10:00:03 order</text>
<rect class="sB" x="60" y="80" width="180" height="22" rx="3"/><text class="sC" x="150" y="95" text-anchor="middle">10:00:20 order</text>
<rect class="sB" x="60" y="104" width="180" height="22" rx="3"/><text class="sC" x="150" y="119" text-anchor="middle">10:00:41 order</text>
<rect class="sW" x="60" y="128" width="180" height="22" rx="3"/><text class="sC" x="150" y="143" text-anchor="middle">10:01:05 order</text>
<rect class="sW" x="60" y="152" width="180" height="22" rx="3"/><text class="sC" x="150" y="167" text-anchor="middle">10:01:12 order</text>
<rect class="sN" x="60" y="176" width="180" height="22" rx="3" stroke-dasharray="4 3"/><text class="sC" x="150" y="191" text-anchor="middle">… keeps growing</text>
<text class="sC" x="20" y="80">batch 1</text><text class="sWt" x="20" y="152">batch 2</text>
<line class="sL" x1="250" y1="100" x2="330" y2="100" marker-end="url(#ah)"/><rect class="sV" x="334" y="70" width="160" height="60" rx="8"/><text class="sT" x="414" y="98" text-anchor="middle">same query</text><text class="sC" x="414" y="114" text-anchor="middle">count per minute</text>
<line class="sL" x1="494" y1="100" x2="540" y2="100" marker-end="url(#ah)"/>
<rect class="sG" x="544" y="50" width="162" height="100" rx="8"/><text class="sT" x="625" y="74" text-anchor="middle">result table</text><text class="sC" x="625" y="98" text-anchor="middle">10:00 → 4</text><text class="sC" x="625" y="118" text-anchor="middle">10:01 → 2 (batch 2)</text>
<text class="sS" x="360" y="210" text-anchor="middle">a checkpoint stores offsets and state, so a restart resumes exactly where it stopped</text>
</svg><figcaption>Structured Streaming: write a batch query; Spark runs it incrementally over a table that never stops growing.</figcaption></figure>

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
