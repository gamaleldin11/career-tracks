# Data Engineer — mid level

*What a mid-level role adds: lakehouse formats, Spark performance, orchestration at scale, streaming, change data capture, quality and governance.*

## Formats and the lakehouse

- Parquet row groups carry min and max statistics, letting engines skip row groups that cannot match a filter ([Apache Parquet: File format](https://parquet.apache.org/docs/file-format/)).
- Delta Lake time travel queries an earlier version of a table by version number or timestamp ([Delta Lake: Time travel](https://docs.delta.io/delta-batch/#query-an-older-snapshot-of-a-table-time-travel)).
- `VACUUM` deletes data files no longer referenced by the log older than the retention period; time travel to those versions stops working ([Delta Lake: Remove files no longer referenced](https://docs.delta.io/delta-utility/#remove-files-no-longer-referenced-by-a-delta-table)).
- Apache Iceberg tracks table state through metadata files, manifest lists and manifests, which enables hidden partitioning and schema evolution ([Apache Iceberg: Table spec](https://iceberg.apache.org/spec/)).
- Many small files slow reads; compact them into fewer large ones ([Delta Lake: Optimize](https://docs.delta.io/optimizations-oss/)).

## Spark performance

- Adaptive query execution re-optimises plans at run time: coalescing shuffle partitions, switching join strategies and handling skewed joins ([Spark: Adaptive query execution](https://spark.apache.org/docs/latest/sql-performance-tuning.html#adaptive-query-execution)).
- Broadcasting a small table to every executor avoids shuffling the large side of a join ([Spark: Join strategy hints](https://spark.apache.org/docs/latest/sql-performance-tuning.html#join-strategy-hints-for-sql-queries)).
- Data skew, a few keys with most rows, makes a few tasks run far longer than the rest ([Spark: Optimizing skew join](https://spark.apache.org/docs/latest/sql-performance-tuning.html#optimizing-skew-join)).
- Python UDFs move data between the JVM and Python; built-in functions are faster ([Spark: Python user-defined functions](https://spark.apache.org/docs/latest/api/python/user_guide/udfandudtf.html)).

## Orchestration and transformation

- Airflow schedules runs per data interval and can backfill past intervals ([Airflow: DAG runs — backfill](https://airflow.apache.org/docs/apache-airflow/stable/core-concepts/dag-run.html#backfill)).
- dbt incremental models process only new or changed rows, which needs a strategy for late data and occasional full refreshes ([dbt: Incremental models](https://docs.getdbt.com/docs/build/incremental-models)).
- dbt snapshots record type 2 history of mutable source tables ([dbt: Snapshots](https://docs.getdbt.com/docs/build/snapshots)).

## Streaming

- Kafka guarantees order within a partition, so events for one key should share a partition ([Apache Kafka: Introduction](https://kafka.apache.org/44/getting-started/introduction/#main-concepts-and-terminology)).
- Consumers in a group split a topic's partitions between them ([Apache Kafka design: Consumer position](https://kafka.apache.org/44/design/design/#consumer-position)).
- Kafka supports exactly-once processing between Kafka topics with idempotent producers and transactions ([Apache Kafka: Message delivery semantics](https://kafka.apache.org/44/design/design/#message-delivery-semantics)).
- Structured Streaming groups events into time windows and uses watermarks to decide how long to wait for late data ([Spark: Structured Streaming — handling late data and watermarking](https://spark.apache.org/docs/latest/streaming/apis-on-dataframes-and-datasets.html#handling-late-data-and-watermarking)).
- Debezium reads a database's transaction log and emits one change event per row change ([Debezium: Architecture](https://debezium.io/documentation/reference/stable/architecture.html)).

## Quality and governance

- Validate DataFrames against a schema with checks on types and values ([pandera: Documentation](https://pandera.readthedocs.io/en/stable/)).
- Source freshness and row-count checks catch silent upstream failures ([dbt: Source freshness](https://docs.getdbt.com/docs/build/sources#source-data-freshness)).
- Row filters and column masks restrict what each user sees from one shared table ([Databricks: Row filters and column masks](https://docs.databricks.com/aws/en/data-governance/unity-catalog/filters-and-masks)).
- Lineage shows which upstream tables and jobs feed a dataset ([OpenLineage: About](https://openlineage.io/docs/)).
- The GDPR's right to erasure means deleted personal data must also leave older table versions and copies ([EUR-Lex: GDPR Article 17](https://eur-lex.europa.eu/eli/reg/2016/679/oj)).

## Architecture

- Data mesh treats data as a product owned by domain teams ([Dehghani: Data mesh principles](https://martinfowler.com/articles/data-mesh-principles.html)).
- The lakehouse design combines open formats with warehouse-style management and performance ([Armbrust et al., 2021](https://www.cidrdb.org/cidr2021/papers/cidr2021_paper17.pdf)).
