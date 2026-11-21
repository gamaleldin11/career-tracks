# Data Engineer — interview prep

*Short answers to the questions data engineering interviews ask most.*

## SQL and modelling

### How do you deduplicate a table with several versions per key?

Number rows per key with `ROW_NUMBER() OVER (PARTITION BY key ORDER BY updated_at DESC, ingested_at DESC)` and keep row 1; the second sort column breaks ties so reruns pick the same row ([PostgreSQL: Window functions](https://www.postgresql.org/docs/current/functions-window.html)).

### What is the grain of a fact table, and why state it first?

What one row represents, such as one order line; every fact and dimension must be true at that grain, or totals double-count ([Kimball Group: Grain](https://www.kimballgroup.com/data-warehouse-business-intelligence-resources/kimball-techniques/dimensional-modeling-techniques/grain/)).

### How do you keep the history of a customer's address?

A type 2 slowly changing dimension: a new row with a new surrogate key and effective dates for each change, flagging the current row ([Kimball Group: Type 2](https://www.kimballgroup.com/data-warehouse-business-intelligence-resources/kimball-techniques/dimensional-modeling-techniques/type-2/), [dbt: Snapshots](https://docs.getdbt.com/docs/build/snapshots)).

### Can you sum account balances across days?

No; balances are semi-additive, so take the closing balance or an average over time, while summing across accounts on one day is fine ([Kimball Group: Additive, semi-additive, and non-additive facts](https://www.kimballgroup.com/data-warehouse-business-intelligence-resources/kimball-techniques/dimensional-modeling-techniques/additive-semi-additive-non-additive-fact/)).

## Pipelines

### What makes a pipeline idempotent?

Rerunning it for the same interval gives the same result: overwrite the partition or upsert on a key instead of appending, and avoid depending on "now" ([Airflow: Best practices](https://airflow.apache.org/docs/apache-airflow/stable/best-practices.html)).

### ETL or ELT?

ELT loads raw data into the warehouse or lakehouse and transforms it there with SQL, which keeps the raw copy for reprocessing; ETL transforms before loading ([dbt: What is dbt?](https://docs.getdbt.com/docs/introduction)).

### When would you use an incremental model?

When a full rebuild is too slow or costly; you then own late-arriving data, a lookback window and occasional full refreshes ([dbt: Incremental models](https://docs.getdbt.com/docs/build/incremental-models)).

### Why Parquet instead of CSV?

Columnar storage with compression and per-row-group statistics, so queries read only the columns and row groups they need ([Apache Parquet: File format](https://parquet.apache.org/docs/file-format/)).

## Spark

### What is lazy evaluation?

Transformations only build a plan; nothing runs until an action such as `write` or `count`, which lets Spark optimise the whole plan ([Spark: RDD operations](https://spark.apache.org/docs/latest/rdd-programming-guide.html#rdd-operations)).

### A Spark job is slow at one stage where a few tasks take far longer. Why?

Probably skew: a few keys hold most of the data. Enable adaptive query execution's skew-join handling, broadcast the small side, or salt the hot keys ([Spark: Optimizing skew join](https://spark.apache.org/docs/latest/sql-performance-tuning.html#optimizing-skew-join)).

### How do you speed up a join with a small table?

Broadcast the small table so the large one does not shuffle ([Spark: Join strategy hints](https://spark.apache.org/docs/latest/sql-performance-tuning.html#join-strategy-hints-for-sql-queries)).

## Streaming and CDC

### How does Kafka keep events in order?

Only within a partition; give events for one entity the same key so they land in the same partition ([Apache Kafka: Introduction](https://kafka.apache.org/44/getting-started/introduction/#main-concepts-and-terminology)).

### What delivery guarantee does your consumer have?

Usually at least once, so processing must be idempotent; Kafka transactions give exactly once between topics ([Apache Kafka: Message delivery semantics](https://kafka.apache.org/44/design/design/#message-delivery-semantics)).

### How do you handle late events in a streaming aggregation?

With event-time windows and a watermark that sets how long to wait before closing a window ([Spark: Handling late data and watermarking](https://spark.apache.org/docs/latest/streaming/apis-on-dataframes-and-datasets.html#handling-late-data-and-watermarking)).

### How do you replicate an operational database into the lake?

Change data capture: read the database's log with a tool such as Debezium into Kafka, then merge the changes into lakehouse tables ([Debezium: Architecture](https://debezium.io/documentation/reference/stable/architecture.html), [PostgreSQL: MERGE](https://www.postgresql.org/docs/current/sql-merge.html)).

## Quality and governance

### How would you catch a broken upstream feed before users do?

Freshness and volume checks on sources, schema and value tests on models, and alerts that stop downstream jobs ([dbt: Source freshness](https://docs.getdbt.com/docs/build/sources#source-data-freshness), [dbt: Data tests](https://docs.getdbt.com/docs/build/data-tests)).

### A customer asks to be deleted. What does that mean for the lake?

Delete their rows, then remove old file versions with `VACUUM` after the retention period, because time travel would otherwise still expose the data ([EUR-Lex: GDPR Article 17](https://eur-lex.europa.eu/eli/reg/2016/679/oj), [Delta Lake: Remove files no longer referenced](https://docs.delta.io/delta-utility/#remove-files-no-longer-referenced-by-a-delta-table)).

## Behavioural

### "Tell me about a pipeline failure you handled."

What broke, how you detected it, what you did first to limit the damage, the root cause and the prevention; specific actions are what structured interviews score ([US OPM: Structured interviews](https://www.opm.gov/policy-data-oversight/assessment-and-selection/other-assessment-methods/structured-interviews/)).
