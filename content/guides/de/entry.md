# Data Engineer — entry level

*What a junior data engineering role expects: strong SQL, Python for pipelines, dimensional modelling basics, Git, Linux and an understanding of the platform.*

## SQL

- Window functions such as `ROW_NUMBER` deduplicate rows by keeping the latest version per key ([PostgreSQL: Window functions](https://www.postgresql.org/docs/current/functions-window.html)).
- `INSERT … ON CONFLICT DO UPDATE` upserts in one statement ([PostgreSQL: INSERT — ON CONFLICT](https://www.postgresql.org/docs/current/sql-insert.html#SQL-ON-CONFLICT)).
- `MERGE` applies inserts, updates and deletes from a source in one statement ([PostgreSQL: MERGE](https://www.postgresql.org/docs/current/sql-merge.html)).
- Common table expressions make multi-step transformations readable ([PostgreSQL: WITH queries](https://www.postgresql.org/docs/current/queries-with.html)).
- Transactions keep a multi-statement load all-or-nothing ([PostgreSQL: Transactions](https://www.postgresql.org/docs/current/tutorial-transactions.html)).

## Modelling

- Fact tables hold measurements at a declared grain; dimension tables hold the who, what, where and when ([Kimball Group: Dimensional modeling techniques](https://www.kimballgroup.com/data-warehouse-business-intelligence-resources/kimball-techniques/dimensional-modeling-techniques/)).
- Additive facts can be summed across all dimensions; semi-additive facts such as balances cannot be summed over time ([Kimball Group: Additive, semi-additive, and non-additive facts](https://www.kimballgroup.com/data-warehouse-business-intelligence-resources/kimball-techniques/dimensional-modeling-techniques/additive-semi-additive-non-additive-fact/)).
- Use surrogate keys in dimensions instead of source system keys ([Kimball Group: Dimension surrogate keys](https://www.kimballgroup.com/data-warehouse-business-intelligence-resources/kimball-techniques/dimensional-modeling-techniques/dimension-surrogate-key/)).
- Normalised (OLTP) schemas avoid duplicated data for writes; dimensional schemas make analytic reads simple ([Kimball Group: Star schemas and OLAP cubes](https://www.kimballgroup.com/data-warehouse-business-intelligence-resources/kimball-techniques/dimensional-modeling-techniques/star-schema-olap-cube/)).

## Python

- Read files in chunks or with generators rather than loading everything into memory ([pandas: Iterating through files chunk by chunk](https://pandas.pydata.org/docs/user_guide/io.html#iterating-through-files-chunk-by-chunk)).
- The `logging` module records what a pipeline did, with levels such as INFO and ERROR ([Python: Logging HOWTO](https://docs.python.org/3/howto/logging.html)).
- Type hints document function contracts and let tools catch errors before run time ([Python: typing](https://docs.python.org/3/library/typing.html)).
- Write small, pure transformation functions and unit-test them with pytest ([pytest: Get started](https://docs.pytest.org/en/stable/getting-started.html)).
- Parquet is columnar and compressed, so reading two columns of a wide table is much cheaper than with CSV ([Apache Parquet: Overview](https://parquet.apache.org/docs/overview/)).

## Platform basics

- ETL transforms data before loading it into the warehouse; ELT loads raw data first and transforms it inside the warehouse ([dbt: What is dbt?](https://docs.getdbt.com/docs/introduction)).
- An Airflow task should be idempotent and must not rely on local state between runs ([Airflow: Best practices](https://airflow.apache.org/docs/apache-airflow/stable/best-practices.html)).
- A dbt model is a `SELECT`; `ref()` declares dependencies so models build in the right order ([dbt: About models](https://docs.getdbt.com/docs/build/models)).
- dbt generic tests such as `unique` and `not_null` check every run ([dbt: Data tests](https://docs.getdbt.com/docs/build/data-tests)).

## Tools

- Git tracks pipeline code; branch, commit and open a pull request for review ([Pro Git: Branching basics](https://git-scm.com/book/en/v2/Git-Branching-Basic-Branching-and-Merging)).
- Cron schedules jobs with five fields: minute, hour, day of month, month and day of week ([crontab(5) man page](https://man7.org/linux/man-pages/man5/crontab.5.html)).
- Containers give every pipeline run the same environment ([Docker: What is a container?](https://docs.docker.com/learn/content/what-is-a-container/)).
