# Python for Data — The Language, NumPy and pandas 3

The three data tracks all expect fluent Python for data. Analysts use it for what Excel can't do, data scientists live in it, and data engineers write production pipelines in it. Your *AI Journey* Parts 01–03 teach Python, NumPy and pandas from the course notebooks; this module is the interview-ready layer on top. It covers the idioms interviewers look for, the pandas 3.0 changes that make older tutorials wrong, the SQL-to-pandas mapping, and when to reach for Polars or DuckDB instead.

> [!focus]
> **Entry must:** comprehensions, functions, dicts and sets fluently; load, filter, group, join, reshape and clean a DataFrame; vectorise instead of looping; handle missing values and dates.
> **Mid adds:** generators and memory, method chaining, categoricals and Parquet for performance, Copy-on-Write behaviour, testing data code, knowing when pandas is the wrong tool.
> **Most asked:** *`loc` vs `iloc`?* · *How do you handle missing values?* · *`merge` vs `join` vs `concat`?* · *`apply` vs vectorised?* · *Write this SQL in pandas* · *A 20 GB CSV won't fit in memory. What do you do?*
> **Time budget:** 4 hours, with a notebook open.

## S7.1 Python idioms interviewers notice 🟢 ⭐

```python
# Comprehensions: read as "give me X for each item where condition"
squares    = [n * n for n in nums if n % 2 == 0]
by_id      = {u["id"]: u for u in users}                   # dict comprehension
cities     = {c.strip().title() for c in raw_cities}       # set: unique values

# Unpacking, enumerate, zip
for i, (name, score) in enumerate(zip(names, scores), start=1):
    print(f"{i}. {name}: {score:.1f}")

# Dict helpers
counts = {}
for word in words:
    counts[word] = counts.get(word, 0) + 1
from collections import Counter, defaultdict
Counter(words).most_common(3)
groups = defaultdict(list)
for row in rows:
    groups[row["city"]].append(row)

# Sorting by a key
top = sorted(customers, key=lambda c: c["spend"], reverse=True)[:10]
```

**Functions:** default arguments, `*args` (extra positional), `**kwargs` (extra keyword), type hints, docstrings.

```python
def summarise(values: list[float], *, digits: int = 2) -> dict[str, float]:
    """Return mean and median rounded to `digits`. The * forces digits to be passed by name."""
    s = sorted(values)
    mid = len(s) // 2
    median = s[mid] if len(s) % 2 else (s[mid - 1] + s[mid]) / 2
    return {"mean": round(sum(s) / len(s), digits), "median": round(median, digits)}
```

> [!mistake] The mutable default argument
> `def add(item, bucket=[])` creates **one** list when the function is defined, shared by every call, so items pile up across calls. Use `bucket=None`, then `bucket = [] if bucket is None else bucket`.

> [!term] Generator
> A function that `yield`s values one at a time instead of building a whole list, so memory stays constant however much data flows through it. `(x for x in rows)` is a generator expression. It's essential for streaming large files in pipelines ([[DE4]]).

```python
def read_large_csv(path):
    with open(path, encoding="utf-8") as f:     # 'with' closes the file even on errors
        header = next(f).rstrip("\n").split(",")
        for line in f:
            yield dict(zip(header, line.rstrip("\n").split(",")))
```

**Errors:** catch specific exceptions, never a bare `except:`.

```python
try:
    amount = float(row["amount"])
except (KeyError, ValueError) as e:
    log.warning("bad row %s: %s", row.get("id"), e)
    amount = None
```

**Mutability and copying:** lists, dicts and sets are mutable and passed by reference, so a function can change the caller's list. `copy.deepcopy` copies nested structures; `list(x)` or `x.copy()` is shallow.

## S7.2 Environments and packages 🟢

- Always work in a **virtual environment** per project: `python -m venv .venv`, then activate it. **uv** (by Astral) is a fast, increasingly common all-in-one tool: `uv venv`, `uv add pandas`, `uv run script.py`.
- Pin dependencies (`requirements.txt`, or `pyproject.toml` plus a lock file) so a teammate or a server gets the same versions.
- Format and lint with **ruff**; type-check with **mypy** or **pyright** in larger code.
- Pin the Python version too. pandas 3.0 requires **Python 3.11 or newer**.

## S7.3 NumPy: think in arrays 🟢 ⭐

NumPy arrays are typed, contiguous blocks of memory, and operations on them run in compiled C. A Python loop over a million numbers takes about a second; the equivalent NumPy operation takes milliseconds.

```python
import numpy as np
prices = np.array([120.0, 80.5, 99.9, 300.0])
qty    = np.array([2, 5, 1, 3])

revenue = prices * qty                  # element-wise, no loop
mask    = revenue > 200                 # boolean array
big     = revenue[mask]                 # boolean indexing
np.where(qty > 2, "bulk", "single")     # vectorised if/else
revenue.mean(), revenue.std(), np.percentile(revenue, 90)
```

> [!term] Broadcasting
> NumPy's rule for combining arrays of different shapes by stretching size-1 dimensions, without copying data. A `(1000, 3)` array minus a `(3,)` array subtracts the same 3 values from each row, which is how you centre each column with `X - X.mean(axis=0)`.

`axis=0` works **down rows** (one result per column); `axis=1` works **across columns** (one result per row).

## S7.4 pandas fundamentals 🟢 ⭐

```python
import pandas as pd
df = pd.read_csv("orders.csv", parse_dates=["order_date"], dtype={"status": "category"})
df.shape, df.dtypes, df.head(), df.info(), df.describe(include="all")
df.isna().sum()                         # missing values per column
df["status"].value_counts(normalize=True)
```

### Selecting

| Syntax | Selects by | Example |
|---|---|---|
| `df["col"]`, `df[["a", "b"]]` | Column name(s) | |
| `df.loc[rows, cols]` | **Labels** (index values and column names); slices **include** the end | `df.loc[df["amount"] > 100, ["customer_id", "amount"]]` |
| `df.iloc[rows, cols]` | **Integer positions**; slices **exclude** the end, like Python | `df.iloc[:5, 0:2]` |
| `df.query("amount > 100 and status == 'paid'")` | An expression string | Readable filters |

```python
paid_2026 = df[(df["status"] == "paid") & (df["order_date"].dt.year == 2026)]   # & and |, with brackets
df[df["city"].isin(["Cairo", "Giza"])]
df[df["email"].str.contains("@gmail", na=False)]
```

> [!mistake] `and` / `or` instead of `&` / `|`
> `df[df.a > 1 and df.b < 2]` raises "the truth value of a Series is ambiguous". Use `&` and `|`, and **wrap each condition in brackets**, because `&` binds tighter than `>`.

### Changing columns

```python
df = df.assign(
    revenue=lambda d: d["price"] * d["qty"],
    month=lambda d: d["order_date"].dt.to_period("M"),
)
df["size"] = pd.cut(df["revenue"], bins=[0, 100, 1000, float("inf")], labels=["S", "M", "L"])
df["is_big"] = np.where(df["revenue"] > 1000, 1, 0)
df = df.rename(columns={"cust": "customer_id"}).drop(columns=["tmp"])
```

> [!sota] pandas 3.0 (January 2026)
> Three changes make many older tutorials and Stack Overflow answers wrong:
> - **Copy-on-Write is always on.** Every selection behaves as a copy. **Chained assignment such as `df[df.a > 0]["b"] = 1` now never modifies `df`**, and `SettingWithCopyWarning` is gone. Write `df.loc[df["a"] > 0, "b"] = 1` instead.
> - **Text columns get a real `str` dtype** instead of `object`; it only holds strings or missing values.
> - **`pd.col()` expressions:** `df.assign(revenue=pd.col("price") * pd.col("qty"))` replaces many lambdas.
> - Also: datetimes now default to **microsecond** resolution (`datetime64[us]`), and old frequency aliases were removed: use `"ME"` (month end), `"QE"`, `"YE"`, not `"M"`, `"Q"`, `"Y"`.

## S7.5 Group, aggregate, reshape 🟢 ⭐

```python
# One row per customer: number of orders, total and average spend, last order date
summary = (df[df["status"] == "paid"]
           .groupby("customer_id", as_index=False)
           .agg(orders=("order_id", "nunique"),
                spend=("revenue", "sum"),
                avg_order=("revenue", "mean"),
                last_order=("order_date", "max"))
           .sort_values("spend", ascending=False))

# Add a group statistic to every row without collapsing (like a SQL window function)
df["customer_total"] = df.groupby("customer_id")["revenue"].transform("sum")
df["share_of_customer"] = df["revenue"] / df["customer_total"]

# Monthly revenue per category: long → wide
wide = df.pivot_table(index="month", columns="category", values="revenue", aggfunc="sum", fill_value=0)
long = wide.reset_index().melt(id_vars="month", var_name="category", value_name="revenue")   # wide → long
```

> [!term] `transform` vs `agg`
> `agg` returns one row per group; `transform` returns a result the same length as the input, broadcasting the group's value back to each row. `transform` is pandas' version of `SUM(...) OVER (PARTITION BY ...)`.

## S7.6 Combining DataFrames 🟢 ⭐

| Function | Does | SQL analogue |
|---|---|---|
| `pd.merge(a, b, on="key", how="left")` | Joins on columns | `LEFT JOIN` |
| `a.join(b)` | Joins on the **index** (a shortcut for merge) | Join on the primary key |
| `pd.concat([a, b])` | Stacks rows (or columns with `axis=1`) | `UNION ALL` |

```python
orders = orders.merge(customers, on="customer_id", how="left", validate="many_to_one", indicator=True)
orders["_merge"].value_counts()      # 'left_only' rows = orders with an unknown customer
```

`validate="many_to_one"` raises an error if `customers` unexpectedly has duplicate keys, which would silently multiply your rows (the join fan-out from [[S3.4]]). Use it in anything you'll trust later.

### SQL ↔ pandas cheat sheet

| SQL | pandas |
|---|---|
| `SELECT a, b FROM t` | `t[["a", "b"]]` |
| `WHERE x > 5 AND y = 'k'` | `t[(t.x > 5) & (t.y == "k")]` or `t.query("x > 5 and y == 'k'")` |
| `ORDER BY x DESC LIMIT 10` | `t.nlargest(10, "x")` or `t.sort_values("x", ascending=False).head(10)` |
| `GROUP BY g` with `COUNT(*)`, `SUM(v)` | `t.groupby("g").agg(n=("v", "size"), total=("v", "sum"))` |
| `HAVING SUM(v) > 100` | `...agg(...).query("total > 100")` |
| `COUNT(DISTINCT c)` | `t["c"].nunique()` |
| `LEFT JOIN u ON t.k = u.k` | `t.merge(u, on="k", how="left")` |
| `UNION ALL` | `pd.concat([t, u])` |
| `ROW_NUMBER() OVER (PARTITION BY g ORDER BY d)` | `t.sort_values("d").groupby("g").cumcount() + 1` |
| `RANK() OVER (...)` | `t.groupby("g")["v"].rank(method="min", ascending=False)` |
| `LAG(v) OVER (PARTITION BY g ORDER BY d)` | `t.sort_values("d").groupby("g")["v"].shift(1)` |
| `CASE WHEN ... END` | `np.select([cond1, cond2], [val1, val2], default=...)` |
| `COALESCE(a, b)` | `t["a"].fillna(t["b"])` or `t["a"].combine_first(t["b"])` |

## S7.7 Cleaning: missing values, types, duplicates, dates 🟢 ⭐

**Missing values.** First ask *why* they're missing; the reason decides the fix.

| Situation | Typical action |
|---|---|
| A few rows, missing at random | Drop the rows (`dropna(subset=[...])`) |
| A numeric feature | Fill with the median (robust to skew), and maybe add a `was_missing` flag |
| A category | Fill with `"Unknown"` as its own level |
| A time series | Forward-fill (`ffill`) or interpolate, within each entity |
| The column is mostly empty | Consider dropping the column |
| Missingness itself is informative (no phone number given) | Keep a flag; the absence is a signal |

For machine learning, fill using statistics from the **training set only**, inside a pipeline ([[DS2]]).

**Types:** `pd.to_numeric(s, errors="coerce")` turns bad values into NaN instead of crashing; `astype("category")` for low-cardinality text saves memory and speeds up groupby.

**Duplicates:** `df.duplicated(subset=["email"]).sum()`, then `df.drop_duplicates(subset=["email"], keep="first")` after sorting so the row you want comes first.

**Dates:**

```python
df["order_date"] = pd.to_datetime(df["order_date"], format="%Y-%m-%d", errors="coerce")
df["dow"]   = df["order_date"].dt.day_name()
df["month"] = df["order_date"].dt.to_period("M")
daily = df.set_index("order_date").resample("D")["revenue"].sum()     # fills missing days with 0
monthly = df.set_index("order_date").resample("ME")["revenue"].sum()  # "ME" = month end in pandas 3
rolling7 = daily.rolling(7).mean()
```

> [!story]
> FinSight's `DailyAggregatedTransaction` layer existed because real transactions are **sparse**: no rows on weekends and holidays, yet TimeGPT needs a continuous daily series. In pandas that whole problem is `resample("D").sum()`, which inserts the missing days. Showing you know both the C# version you built and the one-line pandas equivalent is a strong answer.

**Text:** `s.str.strip().str.lower()`, `s.str.replace(r"\s+", " ", regex=True)`, `s.str.extract(r"(\d{11})")` to pull an Egyptian mobile number out of free text.

## S7.8 Vectorise, don't loop 🟢 ⭐

From slowest to fastest:

1. `for` loops over rows (`iterrows`): avoid.
2. `df.apply(func, axis=1)`: still a Python loop underneath, so it's slow, but sometimes the clearest option for complex row logic.
3. Vectorised pandas or NumPy operations (`df.a * df.b`, `np.where`, `.str` methods, `.dt` accessors): fast.

```python
# slow
df["band"] = df.apply(lambda r: "high" if r["revenue"] > 1000 else "low", axis=1)
# fast
df["band"] = np.where(df["revenue"] > 1000, "high", "low")
```

> [!say]
> "I avoid row-wise apply because it's a Python loop in disguise; I use vectorised operations like np.where, the str and dt accessors, or a merge with a lookup table, which run in compiled code and are often a hundred times faster."

## S7.9 Bigger data: when pandas isn't enough 🟡 ⭐

pandas holds everything in memory and runs mostly on one CPU core. Rough rule: you need RAM of **5–10×** the CSV size.

**"A 20 GB CSV won't fit in memory." In order of effort:**

1. Read only what you need: `usecols=[...]`, efficient `dtype`s (`category`, `int32`), and `chunksize=` to process in pieces.
2. **Convert once to Parquet**: columnar, compressed and typed, so later reads are many times faster and can load only the needed columns ([[DE5]]).
3. Use a tool built for it:
   - **DuckDB**: an in-process SQL engine that queries CSV and Parquet files directly, larger than memory, very fast: `duckdb.sql("SELECT city, SUM(amount) FROM 'orders/*.parquet' GROUP BY city").df()`.
   - **Polars**: a DataFrame library written in Rust, multi-threaded, with a **lazy** API that optimises the whole query before running it.
   - **PySpark**: when data spans many machines ([[DE6]]).

```python
import polars as pl
result = (pl.scan_parquet("orders/*.parquet")          # lazy: nothing read yet
            .filter(pl.col("status") == "paid")
            .group_by("city")
            .agg(pl.col("amount").sum().alias("revenue"))
            .sort("revenue", descending=True)
            .collect())                                # optimise, then run
```

## S7.10 Charts in two minutes 🟢

```python
import matplotlib.pyplot as plt
import seaborn as sns
fig, ax = plt.subplots(figsize=(8, 4))
sns.lineplot(data=monthly_df, x="month", y="revenue", hue="category", ax=ax)
ax.set(title="Revenue by month", xlabel="", ylabel="EGP")
fig.tight_layout(); fig.savefig("revenue.png", dpi=150)
```

Chart choice and storytelling are in [[DA5]]; interactive charts with Plotly appear in your *AI Journey* Part 05.

## S7.11 Code you can trust 🟡

- **Notebooks** for exploration; move anything reused into `.py` modules with functions.
- **Assertions** about data, cheap and powerful: `assert df["order_id"].is_unique`, `assert df["amount"].ge(0).all()`.
- **Tests** with `pytest` for transformation functions, using a tiny hand-made DataFrame and `pd.testing.assert_frame_equal`.
- **Reproducibility:** set random seeds, pin versions, keep raw data read-only, and make each notebook run top to bottom.

> [!lab] Forty-minute workout
> Take the Superstore dataset already on `E:\Big data` (or any orders CSV). In one notebook: load with correct dtypes; report missing values and duplicates; compute monthly revenue and its month-over-month change; find the top 3 products per category; then answer the same three questions in SQL with DuckDB and check the numbers match. That's a ready take-home answer and a GitHub repository.

## S7.12 Interview drill 🟢 ⭐

| Question | Strong short answer |
|---|---|
| `loc` vs `iloc`? | `loc` selects by labels and includes the slice end; `iloc` selects by integer position and excludes it. |
| `merge` vs `join` vs `concat`? | merge joins on columns like SQL; join is a shortcut that joins on the index; concat stacks frames along an axis. |
| `agg` vs `transform`? | agg returns one row per group; transform returns a same-length result, like a window function. |
| Why is `apply(axis=1)` slow? | It calls a Python function per row; vectorised operations run in compiled code. |
| How do you handle missing values? | Find out why they're missing, then drop, impute (median or a category), forward-fill for time series, or flag, with ML imputation fitted on training data only. |
| What changed in pandas 3.0? | Copy-on-Write is always on, so chained assignment never works; a real string dtype by default; `pd.col` expressions; microsecond datetimes; new frequency aliases like ME. |
| How do you avoid row explosion in a merge? | Check key uniqueness and use `validate="many_to_one"`, plus `indicator=True` to audit matches. |
| What's a generator for? | Producing items lazily so memory stays constant over large inputs. |
| What's broadcasting? | NumPy stretching size-1 dimensions so differently shaped arrays combine without copying. |
| The CSV is bigger than RAM. Options? | Read selected columns in chunks with tight dtypes, convert to Parquet, or query it directly with DuckDB or Polars' lazy API, or use Spark if it's truly distributed. |
| What's the mutable default argument bug? | A default list or dict is created once and shared between calls; use None and create it inside. |
| How do you reproduce `ROW_NUMBER() OVER (PARTITION BY g ORDER BY d)`? | Sort by d, then `groupby("g").cumcount() + 1`. |

## Key takeaways

> [!check]
> - Write idiomatic Python: comprehensions, `with`, specific exceptions, no mutable defaults.
> - Vectorise. Row-wise `apply` is a last resort.
> - Know the SQL-to-pandas mapping cold; it's half of most take-homes.
> - pandas 3 changed the rules: use `.loc` for assignment, expect `str` dtypes and `"ME"` aliases.
> - When data outgrows memory, reach for Parquet, DuckDB or Polars before you reach for a cluster.

## Sources

- pandas documentation: [What's new in 3.0.0](https://pandas.pydata.org/docs/whatsnew/v3.0.0.html), [Copy-on-Write](https://pandas.pydata.org/docs/user_guide/copy_on_write.html), [Comparison with SQL](https://pandas.pydata.org/docs/getting_started/comparison/comparison_with_sql.html), [Group by: split-apply-combine](https://pandas.pydata.org/docs/user_guide/groupby.html).
- NumPy: [Broadcasting](https://numpy.org/doc/stable/user/basics.broadcasting.html).
- Python docs: [Tutorial](https://docs.python.org/3/tutorial/), [collections](https://docs.python.org/3/library/collections.html).
- [Polars user guide](https://docs.pola.rs/) · [DuckDB documentation](https://duckdb.org/docs/) · [uv documentation](https://docs.astral.sh/uv/).
- Wes McKinney, [*Python for Data Analysis*, 3rd ed.](https://wesmckinney.com/book/) (free online), by the creator of pandas.
