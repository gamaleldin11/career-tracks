# Data Engineer — super summary

## The data platform

- A lakehouse keeps data in open file formats on cheap object storage and adds warehouse features such as ACID transactions and indexing on top ([Armbrust et al., 2021: Lakehouse](https://www.cidrdb.org/cidr2021/papers/cidr2021_paper17.pdf)).
- The medallion pattern refines data in layers: raw (bronze), cleaned (silver) and business-ready (gold) ([Databricks: Medallion architecture](https://docs.databricks.com/aws/en/lakehouse/medallion)).
- Parquet stores data by column in row groups with statistics in the footer, so engines read only the columns and row groups they need ([Apache Parquet: File format](https://parquet.apache.org/docs/file-format/)).

## Modelling

- Declare the grain, one row per what, before choosing dimensions and facts ([Kimball Group: Grain](https://www.kimballgroup.com/data-warehouse-business-intelligence-resources/kimball-techniques/dimensional-modeling-techniques/grain/)).
- A star schema surrounds a fact table of measurements with dimension tables of descriptive context ([Kimball Group: Star schemas and OLAP cubes](https://www.kimballgroup.com/data-warehouse-business-intelligence-resources/kimball-techniques/dimensional-modeling-techniques/star-schema-olap-cube/)).
- Slowly changing dimension type 2 adds a new row with effective dates when an attribute changes, preserving history ([Kimball Group: Type 2](https://www.kimballgroup.com/data-warehouse-business-intelligence-resources/kimball-techniques/dimensional-modeling-techniques/type-2/)).

## SQL and Python for pipelines

- `MERGE` inserts, updates or deletes target rows based on a join with a source, which suits upserts ([PostgreSQL: MERGE](https://www.postgresql.org/docs/current/sql-merge.html)).
- Make loads idempotent so a rerun produces the same result, for example by replacing a partition or upserting on a key ([Airflow: Best practices](https://airflow.apache.org/docs/apache-airflow/stable/best-practices.html)).
- Python generators produce items lazily, so large files can be processed in constant memory ([Python: Functional programming HOWTO — generators](https://docs.python.org/3/howto/functional.html#generators)).

## Engines and platforms

- Spark transformations are lazy; actions such as `count` or `write` trigger execution ([Spark: RDD operations](https://spark.apache.org/docs/latest/rdd-programming-guide.html#rdd-operations)).
- Wide transformations such as joins and aggregations cause a shuffle, the most expensive step in a Spark job ([Spark: Shuffle operations](https://spark.apache.org/docs/latest/rdd-programming-guide.html#shuffle-operations)).
- Delta Lake adds a transaction log to Parquet files for ACID writes and time travel ([Delta Lake documentation](https://docs.delta.io/)).
- Kafka stores events in partitioned, replicated topics that consumers read at their own pace ([Apache Kafka: Introduction](https://kafka.apache.org/44/getting-started/introduction/#main-concepts-and-terminology)).
- An Airflow DAG defines tasks and their dependencies, scheduled to run per data interval ([Airflow: DAGs](https://airflow.apache.org/docs/apache-airflow/stable/core-concepts/dags.html)).
- dbt models are SQL `SELECT` statements that dbt materialises as tables or views in dependency order ([dbt: About models](https://docs.getdbt.com/docs/build/models)).

## Operate

- Data tests assert expectations such as uniqueness, not-null and accepted values on every run ([dbt: Data tests](https://docs.getdbt.com/docs/build/data-tests)).
- Source freshness checks alert when upstream data stops arriving on time ([dbt: Source freshness](https://docs.getdbt.com/docs/build/sources#source-data-freshness)).
- Personal data is subject to erasure requests under the GDPR, which pipelines and backups must honour ([EUR-Lex: GDPR Article 17](https://eur-lex.europa.eu/eli/reg/2016/679/oj)).

## System design and interview

- Data mesh assigns data ownership to domains that publish data as products on a self-serve platform under federated governance ([Dehghani: Data mesh principles](https://martinfowler.com/articles/data-mesh-principles.html)).
- Change data capture streams row-level changes from a database's log into Kafka ([Debezium: Architecture](https://debezium.io/documentation/reference/stable/architecture.html)).
- Pipeline design interviews reward stating the grain, the volumes, the latency need, idempotency and failure handling; structured interviews score those against job criteria ([US OPM: Structured interviews](https://www.opm.gov/policy-data-oversight/assessment-and-selection/other-assessment-methods/structured-interviews/)).
