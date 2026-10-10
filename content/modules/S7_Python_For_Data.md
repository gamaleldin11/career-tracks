# Python for Data — The Language, NumPy and pandas 3

The three data tracks all expect fluent Python for data. Analysts use it for what Excel can't do, data scientists live in it, and data engineers write production pipelines in it. Your *AI Journey* Parts 01–03 teach Python, NumPy and pandas from the course notebooks; this module is the interview-ready layer on top. It covers the idioms interviewers look for, the pandas 3.0 changes that make older tutorials wrong, the SQL-to-pandas mapping, and when to reach for Polars or DuckDB instead.

> [!focus]
> **Entry must:** comprehensions, functions, dicts and sets fluently; load, filter, group, join, reshape and clean a DataFrame; vectorise instead of looping; handle missing values and dates.
> **Mid adds:** generators and memory, method chaining, categoricals and Parquet for performance, Copy-on-Write behaviour, testing data code, knowing when pandas is the wrong tool.
> **Most asked:** *`loc` vs `iloc`?* · *How do you handle missing values?* · *`merge` vs `join` vs `concat`?* · *`apply` vs vectorised?* · *Write this SQL in pandas* · *A 20 GB CSV won't fit in memory. What do you do?*
> **Time budget:** 4 hours, with a notebook open.

## S7.0 Foundations: how Python holds your data 🟢

Most bugs in data code come from three ideas: names are references, some objects can change and some can't, and plain Python is slow per element.

### Names point to objects

A Python variable is a name attached to an object, not a box that holds a value. `b = a` attaches a second name to the **same** object; nothing is copied.

<figure class="dia"><svg viewBox="0 0 720 195" role="img" aria-label="Names a and b point to the same list object; c points to a separate copy">
<rect class="sV" x="40" y="40" width="50" height="30" rx="6"/><text class="sT" x="65" y="60" text-anchor="middle">a</text>
<rect class="sV" x="40" y="90" width="50" height="30" rx="6"/><text class="sT" x="65" y="110" text-anchor="middle">b</text>
<rect class="sV" x="40" y="140" width="50" height="30" rx="6"/><text class="sT" x="65" y="160" text-anchor="middle">c</text>
<text class="sC" x="65" y="24" text-anchor="middle">names</text>
<text class="sC" x="290" y="24" text-anchor="middle">objects</text>
<rect class="sA" x="220" y="46" width="140" height="44" rx="8"/><text class="sC" x="290" y="64" text-anchor="middle">list</text><text class="sM" x="290" y="82" text-anchor="middle">[1, 2, 3]</text>
<rect class="sB" x="220" y="132" width="140" height="44" rx="8"/><text class="sC" x="290" y="150" text-anchor="middle">list</text><text class="sM" x="290" y="168" text-anchor="middle">[1, 2]</text>
<line class="sL" x1="90" y1="55" x2="218" y2="62" marker-end="url(#ah)"/><line class="sL" x1="90" y1="105" x2="218" y2="76" marker-end="url(#ah)"/><line class="sL" x1="90" y1="155" x2="218" y2="154" marker-end="url(#ah)"/>
<text class="sM" x="400" y="50">a = [1, 2]</text>
<text class="sM" x="400" y="72">b = a          # a second name, same list</text>
<text class="sM" x="400" y="94">c = a.copy()   # a new list</text>
<text class="sM" x="400" y="116">b.append(3)</text>
<text class="sM" x="400" y="138">print(a)       # [1, 2, 3]</text>
<text class="sM" x="400" y="160">print(c)       # [1, 2]</text>
</svg><figcaption>Assignment attaches a name; it never copies. Two names on one mutable object means a change through either is visible through both.</figcaption></figure>

That is why a function that appends to a list it was given changes the caller's list. A **shallow** copy (`a.copy()`, `list(a)`, `dict(d)`) makes a new outer container that still shares the items inside it; `copy.deepcopy` copies everything, all the way down.

### Mutable and immutable types

| Immutable: "changing" it creates a new object | Mutable: changes in place |
|---|---|
| `int`, `float`, `bool`, `str`, `tuple`, `frozenset`, `bytes`, `None` | `list`, `dict`, `set`, `bytearray`, most class instances, NumPy arrays, DataFrames |

Only immutable (more precisely, **hashable**) values can be dictionary keys or set members, so `{[1, 2]: "x"}` raises `TypeError: unhashable type: 'list'`; use a tuple. It's the same reason as the hash-table trap in [[S4.0]]. Strings being immutable is also why building a long string with `+=` in a loop is slow, and `"".join(parts)` is the idiom.

### Why loops are slow and NumPy is fast

CPython runs your code in an interpreter: every `a + b` checks the types, finds the right method and allocates a new object for the result. A Python list stores pointers to full objects scattered around memory; a NumPy array stores raw numbers of one type in one block and runs the loop in compiled C.

<figure class="dia"><svg viewBox="0 0 720 245" role="img" aria-label="A Python list holds pointers to separate integer objects; a NumPy array holds raw 8-byte numbers contiguously with a small header">
<text class="sT" x="20" y="22">Python list [7, 3, 9]: a row of pointers</text>
<rect class="sB" x="20" y="34" width="50" height="34" rx="3"/><circle class="sFm" cx="45" cy="51" r="3"/>
<rect class="sB" x="70" y="34" width="50" height="34" rx="3"/><circle class="sFm" cx="95" cy="51" r="3"/>
<rect class="sB" x="120" y="34" width="50" height="34" rx="3"/><circle class="sFm" cx="145" cy="51" r="3"/>
<rect class="sW" x="250" y="30" width="110" height="52" rx="6"/><text class="sC" x="305" y="46" text-anchor="middle">int object</text><text class="sC" x="305" y="61" text-anchor="middle">type · refcount</text><text class="sM" x="305" y="76" text-anchor="middle">value 7</text>
<path class="sLm" d="M45 54 C45 100 220 56 248 56" marker-end="url(#ahm)"/>
<rect class="sW" x="420" y="64" width="110" height="52" rx="6"/><text class="sC" x="475" y="80" text-anchor="middle">int object</text><text class="sC" x="475" y="95" text-anchor="middle">type · refcount</text><text class="sM" x="475" y="110" text-anchor="middle">value 3</text>
<path class="sLm" d="M95 54 C95 100 390 90 418 90" marker-end="url(#ahm)"/>
<rect class="sW" x="580" y="28" width="110" height="52" rx="6"/><text class="sC" x="635" y="44" text-anchor="middle">int object</text><text class="sC" x="635" y="59" text-anchor="middle">type · refcount</text><text class="sM" x="635" y="74" text-anchor="middle">value 9</text>
<path class="sLm" d="M145 54 C145 100 550 54 578 54" marker-end="url(#ahm)"/>
<text class="sWt" x="20" y="132">every element: an 8-byte pointer to a separate 28-byte object, checked on every operation</text>
<text class="sT" x="20" y="166">NumPy np.array([7, 3, 9]) with dtype int64: one block of raw numbers</text>
<rect class="sV" x="20" y="178" width="170" height="54" rx="6"/><text class="sC" x="105" y="197" text-anchor="middle">dtype int64</text><text class="sC" x="105" y="212" text-anchor="middle">shape (3,)</text><text class="sC" x="105" y="227" text-anchor="middle">strides (8,)</text>
<line class="sL" x1="190" y1="205" x2="246" y2="205" marker-end="url(#ah)"/>
<rect class="sG" x="250" y="186" width="70" height="38" rx="2"/><text class="sX" x="285" y="210" text-anchor="middle">7</text>
<rect class="sG" x="320" y="186" width="70" height="38" rx="2"/><text class="sX" x="355" y="210" text-anchor="middle">3</text>
<rect class="sG" x="390" y="186" width="70" height="38" rx="2"/><text class="sX" x="425" y="210" text-anchor="middle">9</text>
<text class="sGt" x="470" y="202">8 bytes each, side by side:</text>
<text class="sGt" x="470" y="220">one compiled loop, no type checks</text>
</svg><figcaption>Why vectorised code is fast. NumPy (and pandas, built on it) loops over raw numbers in C; a Python loop handles one full object at a time.</figcaption></figure>

### The GIL in one paragraph

CPython has a **global interpreter lock**: only one thread runs Python bytecode at a time. Threads still help when the work is waiting on a network or disk, and NumPy and pandas release the lock inside many of their C routines, but threads won't speed up a CPU-bound pure-Python loop. For that, vectorise, use `multiprocessing`, or use a library that is multi-threaded internally, such as Polars or DuckDB. Python 3.13 added an optional free-threaded build without the GIL, and 3.14 made it officially supported, but the standard build still has the lock.

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

<figure class="dia anim"><svg viewBox="0 0 720 224" role="img" aria-label="Animation: a generator reads one line, yields one row to the consumer and pauses until next is called. Measured peak memory to sum 10 thousand to 200 thousand rows: a list grows from about 3 to 57 megabytes, a generator stays under 1 kilobyte">
<rect class="sN" x="14" y="40" width="140" height="50" rx="8"/><text class="sT" x="84" y="63" text-anchor="middle">file</text><text class="sC" x="84" y="79" text-anchor="middle">one line at a time</text>
<rect class="sV" x="170" y="40" width="150" height="50" rx="8"/><text class="sT" x="245" y="63" text-anchor="middle">read_large_csv</text><text class="sC" x="245" y="79" text-anchor="middle">paused at yield</text>
<rect class="sB" x="356" y="40" width="110" height="50" rx="8"/><text class="sT" x="411" y="63" text-anchor="middle">consumer</text><text class="sC" x="411" y="79" text-anchor="middle">for row in …</text>
<line class="sLm" x1="154" y1="65" x2="166" y2="65" marker-end="url(#ahm)"/><line class="sLg" x1="320" y1="58" x2="352" y2="58" marker-end="url(#ahg)"/><line class="sLm" x1="352" y1="74" x2="320" y2="74" marker-end="url(#ahm)"/>
<text class="sGt" x="336" y="34" text-anchor="middle">row</text><text class="sS" x="336" y="104" text-anchor="middle">next()</text>
<circle class="sPg" r="4"><animateMotion dur="1.6s" repeatCount="indefinite" path="M 154 65 H 170 M 320 58 H 356"/></circle>
<text class="sC" x="240" y="132" text-anchor="middle">only the current row is alive;</text><text class="sC" x="240" y="150" text-anchor="middle">the loop drives the reading</text>
<text class="sM" x="612" y="22" text-anchor="middle">peak memory (tracemalloc)</text>
<text class="sS" x="512" y="54" text-anchor="end">10k rows</text>
<rect class="sR" x="520" y="36" width="4.53749" height="14" rx="2"/><text class="sS" x="528.537" y="47">3 MB list</text>
<rect class="sG" x="520" y="52" width="2" height="12" rx="1"/><text class="sGt" x="526" y="62">0.9 KB generator</text>
<text class="sS" x="512" y="94" text-anchor="end">50k rows</text>
<rect class="sR" x="520" y="76" width="22.8985" height="14" rx="2"/><text class="sS" x="546.898" y="87">14 MB list</text>
<rect class="sG" x="520" y="92" width="2" height="12" rx="1"/><text class="sGt" x="526" y="102">0.9 KB generator</text>
<text class="sS" x="512" y="134" text-anchor="end">100k rows</text>
<rect class="sR" x="520" y="116" width="45.7625" height="14" rx="2"/><text class="sS" x="569.762" y="127">29 MB list</text>
<rect class="sG" x="520" y="132" width="2" height="12" rx="1"/><text class="sGt" x="526" y="142">0.9 KB generator</text>
<text class="sS" x="512" y="174" text-anchor="end">200k rows</text>
<rect class="sR" x="520" y="156" width="91.8794" height="14" rx="2"/><text class="sS" x="615.879" y="167">57 MB list</text>
<rect class="sG" x="520" y="172" width="2" height="12" rx="1"/><text class="sGt" x="526" y="182">0.9 KB generator</text>
<text class="sS" x="360" y="212" text-anchor="middle">a list of dicts grows with the file; the generator's peak stays flat however many rows flow through</text>
</svg><figcaption>Generators are pull-based: nothing is read until the consumer asks. Memory measured with tracemalloc on this machine.</figcaption></figure>

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

NumPy arrays are typed, contiguous blocks of memory, and operations on them run in compiled C. A plain Python loop over ten million numbers takes around a second; the equivalent NumPy operation takes tens of milliseconds.

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

<figure class="dia"><svg viewBox="0 0 720 205" role="img" aria-label="Broadcasting: a 3 by 3 matrix minus a length-3 vector, the vector stretched across rows, gives the centred matrix">
<text class="sM" x="106" y="28" text-anchor="middle">X  shape (3, 3)</text><rect class="sB" x="40" y="40" width="42" height="32" rx="3"/><text class="sT" x="61" y="61" text-anchor="middle">1</text><rect class="sB" x="84" y="40" width="42" height="32" rx="3"/><text class="sT" x="105" y="61" text-anchor="middle">2</text><rect class="sB" x="128" y="40" width="42" height="32" rx="3"/><text class="sT" x="149" y="61" text-anchor="middle">3</text><rect class="sB" x="40" y="74" width="42" height="32" rx="3"/><text class="sT" x="61" y="95" text-anchor="middle">4</text><rect class="sB" x="84" y="74" width="42" height="32" rx="3"/><text class="sT" x="105" y="95" text-anchor="middle">5</text><rect class="sB" x="128" y="74" width="42" height="32" rx="3"/><text class="sT" x="149" y="95" text-anchor="middle">6</text><rect class="sB" x="40" y="108" width="42" height="32" rx="3"/><text class="sT" x="61" y="129" text-anchor="middle">7</text><rect class="sB" x="84" y="108" width="42" height="32" rx="3"/><text class="sT" x="105" y="129" text-anchor="middle">8</text><rect class="sB" x="128" y="108" width="42" height="32" rx="3"/><text class="sT" x="149" y="129" text-anchor="middle">9</text>
<text class="sX" x="196" y="96" text-anchor="middle">−</text>
<text class="sM" x="316" y="28" text-anchor="middle">mean  shape (3,)</text><rect class="sA" x="250" y="40" width="42" height="32" rx="3"/><text class="sT" x="271" y="61" text-anchor="middle">4</text><rect class="sA" x="294" y="40" width="42" height="32" rx="3"/><text class="sT" x="315" y="61" text-anchor="middle">5</text><rect class="sA" x="338" y="40" width="42" height="32" rx="3"/><text class="sT" x="359" y="61" text-anchor="middle">6</text><rect class="sA" x="250" y="74" width="42" height="32" rx="3" stroke-dasharray="4 3" opacity=".6"/><text class="sT" x="271" y="95" text-anchor="middle">4</text><rect class="sA" x="294" y="74" width="42" height="32" rx="3" stroke-dasharray="4 3" opacity=".6"/><text class="sT" x="315" y="95" text-anchor="middle">5</text><rect class="sA" x="338" y="74" width="42" height="32" rx="3" stroke-dasharray="4 3" opacity=".6"/><text class="sT" x="359" y="95" text-anchor="middle">6</text><rect class="sA" x="250" y="108" width="42" height="32" rx="3" stroke-dasharray="4 3" opacity=".6"/><text class="sT" x="271" y="129" text-anchor="middle">4</text><rect class="sA" x="294" y="108" width="42" height="32" rx="3" stroke-dasharray="4 3" opacity=".6"/><text class="sT" x="315" y="129" text-anchor="middle">5</text><rect class="sA" x="338" y="108" width="42" height="32" rx="3" stroke-dasharray="4 3" opacity=".6"/><text class="sT" x="359" y="129" text-anchor="middle">6</text>
<text class="sC" x="316" y="160" text-anchor="middle">stretched down, not copied</text>
<text class="sX" x="406" y="96" text-anchor="middle">=</text>
<text class="sM" x="526" y="28" text-anchor="middle">result  shape (3, 3)</text><rect class="sG" x="460" y="40" width="42" height="32" rx="3"/><text class="sT" x="481" y="61" text-anchor="middle">-3</text><rect class="sG" x="504" y="40" width="42" height="32" rx="3"/><text class="sT" x="525" y="61" text-anchor="middle">-3</text><rect class="sG" x="548" y="40" width="42" height="32" rx="3"/><text class="sT" x="569" y="61" text-anchor="middle">-3</text><rect class="sG" x="460" y="74" width="42" height="32" rx="3"/><text class="sT" x="481" y="95" text-anchor="middle">0</text><rect class="sG" x="504" y="74" width="42" height="32" rx="3"/><text class="sT" x="525" y="95" text-anchor="middle">0</text><rect class="sG" x="548" y="74" width="42" height="32" rx="3"/><text class="sT" x="569" y="95" text-anchor="middle">0</text><rect class="sG" x="460" y="108" width="42" height="32" rx="3"/><text class="sT" x="481" y="129" text-anchor="middle">3</text><rect class="sG" x="504" y="108" width="42" height="32" rx="3"/><text class="sT" x="525" y="129" text-anchor="middle">3</text><rect class="sG" x="548" y="108" width="42" height="32" rx="3"/><text class="sT" x="569" y="129" text-anchor="middle">3</text>
<text class="sS" x="360" y="190" text-anchor="middle">rule: line the shapes up from the right; a dimension of size 1 (or a missing one) stretches to match</text>
</svg><figcaption><code>X - X.mean(axis=0)</code>: centring every column in one line.</figcaption></figure>

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

<figure class="dia"><svg viewBox="0 0 720 195" role="img" aria-label="loc selects by index label and includes the end of a slice; iloc selects by position and excludes it">
<text class="sC" x="300" y="26" text-anchor="middle">pos</text><text class="sC" x="355" y="26" text-anchor="middle">index</text><text class="sC" x="440" y="26" text-anchor="middle">amount</text>
<text class="sC" x="300" y="56" text-anchor="middle">0</text><rect class="sV" x="320" y="36" width="70" height="28" rx="3"/><text class="sT" x="355" y="55" text-anchor="middle">101</text><rect class="sB" x="392" y="36" width="96" height="28" rx="3"/><text class="sC" x="440" y="55" text-anchor="middle">250</text>
<text class="sC" x="300" y="86" text-anchor="middle">1</text><rect class="sV" x="320" y="66" width="70" height="28" rx="3"/><text class="sT" x="355" y="85" text-anchor="middle">102</text><rect class="sB" x="392" y="66" width="96" height="28" rx="3"/><text class="sC" x="440" y="85" text-anchor="middle">90</text>
<text class="sC" x="300" y="116" text-anchor="middle">2</text><rect class="sV" x="320" y="96" width="70" height="28" rx="3"/><text class="sT" x="355" y="115" text-anchor="middle">103</text><rect class="sB" x="392" y="96" width="96" height="28" rx="3"/><text class="sC" x="440" y="115" text-anchor="middle">400</text>
<text class="sC" x="300" y="146" text-anchor="middle">3</text><rect class="sV" x="320" y="126" width="70" height="28" rx="3"/><text class="sT" x="355" y="145" text-anchor="middle">104</text><rect class="sB" x="392" y="126" width="96" height="28" rx="3"/><text class="sC" x="440" y="145" text-anchor="middle">75</text>
<text class="sC" x="300" y="176" text-anchor="middle">4</text><rect class="sV" x="320" y="156" width="70" height="28" rx="3"/><text class="sT" x="355" y="175" text-anchor="middle">105</text><rect class="sB" x="392" y="156" width="96" height="28" rx="3"/><text class="sC" x="440" y="175" text-anchor="middle">310</text>
<path class="sL" d="M276 68 h-10 v56 h10"/><text class="sM" x="258" y="92" text-anchor="end">df.iloc[1:3]</text><text class="sC" x="258" y="110" text-anchor="end">positions 1, 2: end excluded</text>
<path class="sLg" d="M498 68 h10 v86 h-10"/><text class="sGt" x="518" y="104">df.loc[102:104]</text><text class="sC" x="518" y="122">labels 102–104: end included</text>
</svg><figcaption>Same DataFrame, two ways to slice. When the index isn't 0, 1, 2… the difference stops being academic.</figcaption></figure>

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

<figure class="dia steps"><svg viewBox="0 0 720 235" role="img" aria-label="groupby as split, apply, combine, and transform broadcasting each group total back to its rows">
<text class="sM" x="100" y="28" text-anchor="middle">df</text>
<rect class="sA" x="10" y="40" width="100" height="24" rx="3"/><text class="sC" x="60" y="57" text-anchor="middle">Cairo</text><rect class="sB" x="112" y="40" width="70" height="24" rx="3"/><text class="sC" x="147" y="57" text-anchor="middle">100</text>
<rect class="sG" x="10" y="66" width="100" height="24" rx="3"/><text class="sC" x="60" y="83" text-anchor="middle">Giza</text><rect class="sB" x="112" y="66" width="70" height="24" rx="3"/><text class="sC" x="147" y="83" text-anchor="middle">50</text>
<rect class="sA" x="10" y="92" width="100" height="24" rx="3"/><text class="sC" x="60" y="109" text-anchor="middle">Cairo</text><rect class="sB" x="112" y="92" width="70" height="24" rx="3"/><text class="sC" x="147" y="109" text-anchor="middle">30</text>
<rect class="sW" x="10" y="118" width="100" height="24" rx="3"/><text class="sC" x="60" y="135" text-anchor="middle">Alex</text><rect class="sB" x="112" y="118" width="70" height="24" rx="3"/><text class="sC" x="147" y="135" text-anchor="middle">70</text>
<rect class="sG" x="10" y="144" width="100" height="24" rx="3"/><text class="sC" x="60" y="161" text-anchor="middle">Giza</text><rect class="sB" x="112" y="144" width="70" height="24" rx="3"/><text class="sC" x="147" y="161" text-anchor="middle">20</text>
<rect class="sA" x="10" y="170" width="100" height="24" rx="3"/><text class="sC" x="60" y="187" text-anchor="middle">Cairo</text><rect class="sB" x="112" y="170" width="70" height="24" rx="3"/><text class="sC" x="147" y="187" text-anchor="middle">10</text>
<g data-s="1"><text class="sM" x="365" y="28" text-anchor="middle">split by city</text><rect class="sN" x="290" y="38" width="150" height="76" rx="6"/><rect class="sA" x="294" y="40" width="78" height="22" rx="3"/><text class="sC" x="333" y="55" text-anchor="middle">Cairo</text><rect class="sB" x="374" y="40" width="60" height="22" rx="3"/><text class="sC" x="404" y="55" text-anchor="middle">100</text><rect class="sA" x="294" y="64" width="78" height="22" rx="3"/><text class="sC" x="333" y="79" text-anchor="middle">Cairo</text><rect class="sB" x="374" y="64" width="60" height="22" rx="3"/><text class="sC" x="404" y="79" text-anchor="middle">30</text><rect class="sA" x="294" y="88" width="78" height="22" rx="3"/><text class="sC" x="333" y="103" text-anchor="middle">Cairo</text><rect class="sB" x="374" y="88" width="60" height="22" rx="3"/><text class="sC" x="404" y="103" text-anchor="middle">10</text><rect class="sN" x="290" y="122" width="150" height="52" rx="6"/><rect class="sG" x="294" y="124" width="78" height="22" rx="3"/><text class="sC" x="333" y="139" text-anchor="middle">Giza</text><rect class="sB" x="374" y="124" width="60" height="22" rx="3"/><text class="sC" x="404" y="139" text-anchor="middle">50</text><rect class="sG" x="294" y="148" width="78" height="22" rx="3"/><text class="sC" x="333" y="163" text-anchor="middle">Giza</text><rect class="sB" x="374" y="148" width="60" height="22" rx="3"/><text class="sC" x="404" y="163" text-anchor="middle">20</text><rect class="sN" x="290" y="182" width="150" height="28" rx="6"/><rect class="sW" x="294" y="184" width="78" height="22" rx="3"/><text class="sC" x="333" y="199" text-anchor="middle">Alex</text><rect class="sB" x="374" y="184" width="60" height="22" rx="3"/><text class="sC" x="404" y="199" text-anchor="middle">70</text><line class="sLm" x1="186" y1="110" x2="284" y2="110" marker-end="url(#ahm)"/></g>
<g data-s="2"><text class="sM" x="510" y="28" text-anchor="middle">apply sum</text><line class="sLm" x1="442" y1="76" x2="470" y2="76" marker-end="url(#ahm)"/><rect class="sA" x="474" y="64" width="74" height="24" rx="4"/><text class="sT" x="511" y="81" text-anchor="middle">140</text><line class="sLm" x1="442" y1="148" x2="470" y2="148" marker-end="url(#ahm)"/><rect class="sG" x="474" y="136" width="74" height="24" rx="4"/><text class="sT" x="511" y="153" text-anchor="middle">70</text><line class="sLm" x1="442" y1="196" x2="470" y2="196" marker-end="url(#ahm)"/><rect class="sW" x="474" y="184" width="74" height="24" rx="4"/><text class="sT" x="511" y="201" text-anchor="middle">70</text></g>
<g data-s="3"><text class="sM" x="640" y="28" text-anchor="middle">combine</text><rect class="sW" x="584" y="40" width="70" height="24" rx="3"/><text class="sC" x="619" y="57" text-anchor="middle">Alex</text><rect class="sB" x="656" y="40" width="54" height="24" rx="3"/><text class="sC" x="683" y="57" text-anchor="middle">70</text><rect class="sA" x="584" y="66" width="70" height="24" rx="3"/><text class="sC" x="619" y="83" text-anchor="middle">Cairo</text><rect class="sB" x="656" y="66" width="54" height="24" rx="3"/><text class="sC" x="683" y="83" text-anchor="middle">140</text><rect class="sG" x="584" y="92" width="70" height="24" rx="3"/><text class="sC" x="619" y="109" text-anchor="middle">Giza</text><rect class="sB" x="656" y="92" width="54" height="24" rx="3"/><text class="sC" x="683" y="109" text-anchor="middle">70</text><line class="sLm" x1="552" y1="90" x2="578" y2="70" marker-end="url(#ahm)"/></g>
<g data-s="4"><text class="sM" x="220" y="28" text-anchor="middle">transform</text><rect class="sV" x="190" y="40" width="60" height="24" rx="3"/><text class="sC" x="220" y="57" text-anchor="middle">140</text><rect class="sV" x="190" y="66" width="60" height="24" rx="3"/><text class="sC" x="220" y="83" text-anchor="middle">70</text><rect class="sV" x="190" y="92" width="60" height="24" rx="3"/><text class="sC" x="220" y="109" text-anchor="middle">140</text><rect class="sV" x="190" y="118" width="60" height="24" rx="3"/><text class="sC" x="220" y="135" text-anchor="middle">70</text><rect class="sV" x="190" y="144" width="60" height="24" rx="3"/><text class="sC" x="220" y="161" text-anchor="middle">70</text><rect class="sV" x="190" y="170" width="60" height="24" rx="3"/><text class="sC" x="220" y="187" text-anchor="middle">140</text></g>
<text class="sM" x="360" y="222" text-anchor="middle">df.groupby("city")["revenue"].sum()   vs   .transform("sum")</text>
</svg><ol class="dia-steps">
<li><b>Split:</b> rows are sorted into groups by the key. Nothing is computed yet.</li>
<li><b>Apply:</b> the function (here <code>sum</code>) runs once per group.</li>
<li><b>Combine:</b> the results are glued into a new, smaller table with one row per group, sorted by key by default. That's <code>agg</code>.</li>
<li><b>Transform</b> applies the same function but hands each group's result back to every row of that group, so the output has the original length: the pandas version of <code>SUM(...) OVER (PARTITION BY city)</code>.</li>
</ol><figcaption>Split-apply-combine, the model behind every <code>groupby</code>.</figcaption></figure>

<figure class="dia"><svg viewBox="0 0 720 222" role="img" aria-label="The same data in long format with one row per month and category, and wide format with one column per category">
<text class="sT" x="130" y="22" text-anchor="middle">long: one row per observation</text>
<text class="sC" x="55" y="42" text-anchor="middle">month</text>
<text class="sC" x="130" y="42" text-anchor="middle">category</text>
<text class="sC" x="205" y="42" text-anchor="middle">revenue</text>
<rect class="sB" x="20" y="50" width="72" height="22" rx="3"/><text class="sC" x="56" y="65" text-anchor="middle">Jan</text>
<rect class="sA" x="95" y="50" width="72" height="22" rx="3"/><text class="sC" x="131" y="65" text-anchor="middle">A</text>
<rect class="sB" x="170" y="50" width="72" height="22" rx="3"/><text class="sC" x="206" y="65" text-anchor="middle">10</text>
<rect class="sB" x="20" y="74" width="72" height="22" rx="3"/><text class="sC" x="56" y="89" text-anchor="middle">Jan</text>
<rect class="sA" x="95" y="74" width="72" height="22" rx="3"/><text class="sC" x="131" y="89" text-anchor="middle">B</text>
<rect class="sB" x="170" y="74" width="72" height="22" rx="3"/><text class="sC" x="206" y="89" text-anchor="middle">20</text>
<rect class="sB" x="20" y="98" width="72" height="22" rx="3"/><text class="sC" x="56" y="113" text-anchor="middle">Feb</text>
<rect class="sA" x="95" y="98" width="72" height="22" rx="3"/><text class="sC" x="131" y="113" text-anchor="middle">A</text>
<rect class="sB" x="170" y="98" width="72" height="22" rx="3"/><text class="sC" x="206" y="113" text-anchor="middle">15</text>
<rect class="sB" x="20" y="122" width="72" height="22" rx="3"/><text class="sC" x="56" y="137" text-anchor="middle">Feb</text>
<rect class="sA" x="95" y="122" width="72" height="22" rx="3"/><text class="sC" x="131" y="137" text-anchor="middle">B</text>
<rect class="sB" x="170" y="122" width="72" height="22" rx="3"/><text class="sC" x="206" y="137" text-anchor="middle">25</text>
<rect class="sB" x="20" y="146" width="72" height="22" rx="3"/><text class="sC" x="56" y="161" text-anchor="middle">Mar</text>
<rect class="sA" x="95" y="146" width="72" height="22" rx="3"/><text class="sC" x="131" y="161" text-anchor="middle">A</text>
<rect class="sB" x="170" y="146" width="72" height="22" rx="3"/><text class="sC" x="206" y="161" text-anchor="middle">12</text>
<rect class="sB" x="20" y="170" width="72" height="22" rx="3"/><text class="sC" x="56" y="185" text-anchor="middle">Mar</text>
<rect class="sA" x="95" y="170" width="72" height="22" rx="3"/><text class="sC" x="131" y="185" text-anchor="middle">B</text>
<rect class="sB" x="170" y="170" width="72" height="22" rx="3"/><text class="sC" x="206" y="185" text-anchor="middle">30</text>
<text class="sT" x="560" y="22" text-anchor="middle">wide: one row per month</text>
<text class="sC" x="485" y="42" text-anchor="middle">month</text>
<text class="sM" x="560" y="42" text-anchor="middle">A</text>
<text class="sM" x="635" y="42" text-anchor="middle">B</text>
<rect class="sB" x="450" y="50" width="72" height="22" rx="3"/><text class="sC" x="486" y="65" text-anchor="middle">Jan</text>
<rect class="sB" x="525" y="50" width="72" height="22" rx="3"/><text class="sC" x="561" y="65" text-anchor="middle">10</text>
<rect class="sB" x="600" y="50" width="72" height="22" rx="3"/><text class="sC" x="636" y="65" text-anchor="middle">20</text>
<rect class="sB" x="450" y="74" width="72" height="22" rx="3"/><text class="sC" x="486" y="89" text-anchor="middle">Feb</text>
<rect class="sB" x="525" y="74" width="72" height="22" rx="3"/><text class="sC" x="561" y="89" text-anchor="middle">15</text>
<rect class="sB" x="600" y="74" width="72" height="22" rx="3"/><text class="sC" x="636" y="89" text-anchor="middle">25</text>
<rect class="sB" x="450" y="98" width="72" height="22" rx="3"/><text class="sC" x="486" y="113" text-anchor="middle">Mar</text>
<rect class="sB" x="525" y="98" width="72" height="22" rx="3"/><text class="sC" x="561" y="113" text-anchor="middle">12</text>
<rect class="sB" x="600" y="98" width="72" height="22" rx="3"/><text class="sC" x="636" y="113" text-anchor="middle">30</text>
<line class="sL" x1="262" y1="90" x2="440" y2="90" marker-end="url(#ah)"/><text class="sC" x="351" y="82" text-anchor="middle">pivot_table(index="month",</text><text class="sC" x="351" y="102" text-anchor="middle">columns="category")</text>
<line class="sLg" x1="440" y1="150" x2="262" y2="150" marker-end="url(#ahg)"/><text class="sGt" x="351" y="142" text-anchor="middle">melt(id_vars="month")</text>
<text class="sS" x="360" y="210" text-anchor="middle">Tools and models usually want long; people and reports usually want wide.</text>
</svg><figcaption>Reshaping. <code>pivot_table</code> goes long → wide (and aggregates duplicates); <code>melt</code> goes wide → long.</figcaption></figure>

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

<figure class="dia steps"><svg viewBox="0 0 720 290" role="img" aria-label="Merging four orders with a customers table that accidentally lists customer 2 twice gives six rows instead of four, duplicating two orders; the indicator column flags the order whose customer is unknown, and validate many_to_one raises an error instead">
<text class="sM" x="14" y="32">orders (4 rows)</text><rect class="sN" x="14" y="40" width="70" height="20" rx="0"/><text class="sS" x="49" y="54" text-anchor="middle">order_id</text><rect class="sN" x="84" y="40" width="84" height="20" rx="0"/><text class="sS" x="126" y="54" text-anchor="middle">customer_id</text><rect class="sN" x="168" y="40" width="60" height="20" rx="0"/><text class="sS" x="198" y="54" text-anchor="middle">amount</text><rect class="sB" x="14" y="60" width="70" height="20" rx="0" opacity=".55"/><text class="sC" x="49" y="74" text-anchor="middle">101</text><rect class="sB" x="84" y="60" width="84" height="20" rx="0" opacity=".55"/><text class="sC" x="126" y="74" text-anchor="middle">1</text><rect class="sB" x="168" y="60" width="60" height="20" rx="0" opacity=".55"/><text class="sC" x="198" y="74" text-anchor="middle">300</text><rect class="sB" x="14" y="80" width="70" height="20" rx="0" opacity=".55"/><text class="sC" x="49" y="94" text-anchor="middle">102</text><rect class="sB" x="84" y="80" width="84" height="20" rx="0" opacity=".55"/><text class="sC" x="126" y="94" text-anchor="middle">2</text><rect class="sB" x="168" y="80" width="60" height="20" rx="0" opacity=".55"/><text class="sC" x="198" y="94" text-anchor="middle">120</text><rect class="sB" x="14" y="100" width="70" height="20" rx="0" opacity=".55"/><text class="sC" x="49" y="114" text-anchor="middle">103</text><rect class="sB" x="84" y="100" width="84" height="20" rx="0" opacity=".55"/><text class="sC" x="126" y="114" text-anchor="middle">2</text><rect class="sB" x="168" y="100" width="60" height="20" rx="0" opacity=".55"/><text class="sC" x="198" y="114" text-anchor="middle">80</text><rect class="sB" x="14" y="120" width="70" height="20" rx="0" opacity=".55"/><text class="sC" x="49" y="134" text-anchor="middle">104</text><rect class="sB" x="84" y="120" width="84" height="20" rx="0" opacity=".55"/><text class="sC" x="126" y="134" text-anchor="middle">9</text><rect class="sB" x="168" y="120" width="60" height="20" rx="0" opacity=".55"/><text class="sC" x="198" y="134" text-anchor="middle">50</text>
<text class="sM" x="14" y="162">customers: key 2 appears twice</text><rect class="sN" x="14" y="170" width="84" height="20" rx="0"/><text class="sS" x="56" y="184" text-anchor="middle">customer_id</text><rect class="sN" x="98" y="170" width="100" height="20" rx="0"/><text class="sS" x="148" y="184" text-anchor="middle">city</text><rect class="sB" x="14" y="190" width="84" height="20" rx="0" opacity=".55"/><text class="sC" x="56" y="204" text-anchor="middle">1</text><rect class="sB" x="98" y="190" width="100" height="20" rx="0" opacity=".55"/><text class="sC" x="148" y="204" text-anchor="middle">Cairo</text><rect class="sW" x="14" y="210" width="84" height="20" rx="0" opacity=".55"/><text class="sC" x="56" y="224" text-anchor="middle">2</text><rect class="sW" x="98" y="210" width="100" height="20" rx="0" opacity=".55"/><text class="sC" x="148" y="224" text-anchor="middle">Giza</text><rect class="sW" x="14" y="230" width="84" height="20" rx="0" opacity=".55"/><text class="sC" x="56" y="244" text-anchor="middle">2</text><rect class="sW" x="98" y="230" width="100" height="20" rx="0" opacity=".55"/><text class="sC" x="148" y="244" text-anchor="middle">Giza (dup)</text>
<g data-s="1"><text class="sM" x="270" y="32">merge(how="left") → 6 rows</text><rect class="sN" x="270" y="40" width="66" height="20" rx="0"/><text class="sS" x="303" y="54" text-anchor="middle">order_id</text><rect class="sN" x="336" y="40" width="80" height="20" rx="0"/><text class="sS" x="376" y="54" text-anchor="middle">customer_id</text><rect class="sN" x="416" y="40" width="56" height="20" rx="0"/><text class="sS" x="444" y="54" text-anchor="middle">amount</text><rect class="sN" x="472" y="40" width="80" height="20" rx="0"/><text class="sS" x="512" y="54" text-anchor="middle">city</text><rect class="sN" x="552" y="40" width="76" height="20" rx="0"/><text class="sS" x="590" y="54" text-anchor="middle">_merge</text><rect class="sB" x="270" y="60" width="66" height="20" rx="0" opacity=".55"/><text class="sC" x="303" y="74" text-anchor="middle">101</text><rect class="sB" x="336" y="60" width="80" height="20" rx="0" opacity=".55"/><text class="sC" x="376" y="74" text-anchor="middle">1</text><rect class="sB" x="416" y="60" width="56" height="20" rx="0" opacity=".55"/><text class="sC" x="444" y="74" text-anchor="middle">300</text><rect class="sB" x="472" y="60" width="80" height="20" rx="0" opacity=".55"/><text class="sC" x="512" y="74" text-anchor="middle">Cairo</text><rect class="sB" x="552" y="60" width="76" height="20" rx="0" opacity=".55"/><text class="sC" x="590" y="74" text-anchor="middle">both</text><rect class="sR" x="270" y="80" width="66" height="20" rx="0" opacity=".55"/><text class="sC" x="303" y="94" text-anchor="middle">102</text><rect class="sR" x="336" y="80" width="80" height="20" rx="0" opacity=".55"/><text class="sC" x="376" y="94" text-anchor="middle">2</text><rect class="sR" x="416" y="80" width="56" height="20" rx="0" opacity=".55"/><text class="sC" x="444" y="94" text-anchor="middle">120</text><rect class="sR" x="472" y="80" width="80" height="20" rx="0" opacity=".55"/><text class="sC" x="512" y="94" text-anchor="middle">Giza</text><rect class="sR" x="552" y="80" width="76" height="20" rx="0" opacity=".55"/><text class="sC" x="590" y="94" text-anchor="middle">both</text><rect class="sR" x="270" y="100" width="66" height="20" rx="0" opacity=".55"/><text class="sC" x="303" y="114" text-anchor="middle">102</text><rect class="sR" x="336" y="100" width="80" height="20" rx="0" opacity=".55"/><text class="sC" x="376" y="114" text-anchor="middle">2</text><rect class="sR" x="416" y="100" width="56" height="20" rx="0" opacity=".55"/><text class="sC" x="444" y="114" text-anchor="middle">120</text><rect class="sR" x="472" y="100" width="80" height="20" rx="0" opacity=".55"/><text class="sC" x="512" y="114" text-anchor="middle">Giza (dup)</text><rect class="sR" x="552" y="100" width="76" height="20" rx="0" opacity=".55"/><text class="sC" x="590" y="114" text-anchor="middle">both</text><rect class="sR" x="270" y="120" width="66" height="20" rx="0" opacity=".55"/><text class="sC" x="303" y="134" text-anchor="middle">103</text><rect class="sR" x="336" y="120" width="80" height="20" rx="0" opacity=".55"/><text class="sC" x="376" y="134" text-anchor="middle">2</text><rect class="sR" x="416" y="120" width="56" height="20" rx="0" opacity=".55"/><text class="sC" x="444" y="134" text-anchor="middle">80</text><rect class="sR" x="472" y="120" width="80" height="20" rx="0" opacity=".55"/><text class="sC" x="512" y="134" text-anchor="middle">Giza</text><rect class="sR" x="552" y="120" width="76" height="20" rx="0" opacity=".55"/><text class="sC" x="590" y="134" text-anchor="middle">both</text><rect class="sR" x="270" y="140" width="66" height="20" rx="0" opacity=".55"/><text class="sC" x="303" y="154" text-anchor="middle">103</text><rect class="sR" x="336" y="140" width="80" height="20" rx="0" opacity=".55"/><text class="sC" x="376" y="154" text-anchor="middle">2</text><rect class="sR" x="416" y="140" width="56" height="20" rx="0" opacity=".55"/><text class="sC" x="444" y="154" text-anchor="middle">80</text><rect class="sR" x="472" y="140" width="80" height="20" rx="0" opacity=".55"/><text class="sC" x="512" y="154" text-anchor="middle">Giza (dup)</text><rect class="sR" x="552" y="140" width="76" height="20" rx="0" opacity=".55"/><text class="sC" x="590" y="154" text-anchor="middle">both</text><rect class="sW" x="270" y="160" width="66" height="20" rx="0" opacity=".55"/><text class="sC" x="303" y="174" text-anchor="middle">104</text><rect class="sW" x="336" y="160" width="80" height="20" rx="0" opacity=".55"/><text class="sC" x="376" y="174" text-anchor="middle">9</text><rect class="sW" x="416" y="160" width="56" height="20" rx="0" opacity=".55"/><text class="sC" x="444" y="174" text-anchor="middle">50</text><rect class="sW" x="472" y="160" width="80" height="20" rx="0" opacity=".55"/><text class="sC" x="512" y="174" text-anchor="middle">—</text><rect class="sW" x="552" y="160" width="76" height="20" rx="0" opacity=".55"/><text class="sC" x="590" y="174" text-anchor="middle">left_only</text></g>
<g data-s="1"><text class="sRt" x="270" y="210">order 102 and 103 each matched twice: revenue counted twice</text><text class="sWt" x="270" y="226">order 104: customer 9 unknown → _merge = left_only</text></g>
<g data-s="2"><rect class="sG" x="270" y="236" width="436" height="44" rx="6" opacity=".4"/><text class="sC" x="280" y="254">with validate="many_to_one":</text><text class="sC" x="280" y="272">MergeError: Merge keys are not unique in right dataset</text></g>
<line class="sLm" x1="240" y1="90" x2="264" y2="90" marker-end="url(#ahm)"/>
</svg><ol class="dia-steps">
<li>A left merge with a duplicated key: the result has 6 rows, not 4. Orders 102 and 103 each appear twice, so any sum over amount is inflated; <code>indicator=True</code> marks order 104 as <code>left_only</code>.</li>
<li><code>validate="many_to_one"</code> turns the silent fan-out into an error at the merge, where the cause is still obvious.</li>
</ol><figcaption>The join fan-out in pandas, computed: always know the expected cardinality and let validate check it.</figcaption></figure>

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

<figure class="dia steps"><svg viewBox="0 0 720 238" role="img" aria-label="Three weeks of sparse daily revenue: bars exist only on working days; resampling to daily frequency inserts the weekend and holiday days with zero revenue; a seven-day rolling mean is drawn over the continuous series starting on the seventh day">
<line class="sLm" x1="30" y1="196" x2="700" y2="196"/>
<text class="sS" x="52" y="212" text-anchor="middle">Su</text><text class="sS" x="52" y="228" text-anchor="middle">01</text>
<text class="sS" x="86" y="212" text-anchor="middle">Mo</text>
<text class="sS" x="120" y="212" text-anchor="middle">Tu</text>
<text class="sS" x="154" y="212" text-anchor="middle">We</text>
<text class="sS" x="188" y="212" text-anchor="middle">Th</text>
<text class="sS" x="222" y="212" text-anchor="middle">Fr</text>
<text class="sS" x="256" y="212" text-anchor="middle">Sa</text>
<text class="sS" x="290" y="212" text-anchor="middle">Su</text><text class="sS" x="290" y="228" text-anchor="middle">08</text>
<text class="sS" x="324" y="212" text-anchor="middle">Mo</text>
<text class="sS" x="358" y="212" text-anchor="middle">Tu</text>
<text class="sS" x="392" y="212" text-anchor="middle">We</text>
<text class="sS" x="426" y="212" text-anchor="middle">Th</text>
<text class="sS" x="460" y="212" text-anchor="middle">Fr</text>
<text class="sS" x="494" y="212" text-anchor="middle">Sa</text>
<text class="sS" x="528" y="212" text-anchor="middle">Su</text><text class="sS" x="528" y="228" text-anchor="middle">15</text>
<text class="sS" x="562" y="212" text-anchor="middle">Mo</text>
<text class="sS" x="596" y="212" text-anchor="middle">Tu</text>
<text class="sS" x="630" y="212" text-anchor="middle">We</text>
<text class="sS" x="664" y="212" text-anchor="middle">Th</text>
<rect class="sB" x="40" y="80" width="24" height="116" rx="2"/><rect class="sB" x="74" y="171.853" width="24" height="24.1469" rx="2"/><rect class="sB" x="108" y="165.698" width="24" height="30.302" rx="2"/><rect class="sB" x="142" y="164.278" width="24" height="31.7224" rx="2"/><rect class="sB" x="176" y="114.09" width="24" height="81.9102" rx="2"/><rect class="sB" x="278" y="134.449" width="24" height="61.551" rx="2"/><rect class="sB" x="312" y="186.057" width="24" height="9.94286" rx="2"/><rect class="sB" x="380" y="173.273" width="24" height="22.7265" rx="2"/><rect class="sB" x="414" y="166.171" width="24" height="29.8286" rx="2"/><rect class="sB" x="516" y="149.127" width="24" height="46.8735" rx="2"/><rect class="sB" x="550" y="175.641" width="24" height="20.3592" rx="2"/><rect class="sB" x="584" y="102.727" width="24" height="93.2735" rx="2"/><rect class="sB" x="618" y="154.808" width="24" height="41.1918" rx="2"/><rect class="sB" x="652" y="153.861" width="24" height="42.1388" rx="2"/><text class="sS" x="40" y="26">24 transactions on 14 days: no rows at all on weekends or the holiday</text>
<g data-s="2"><rect class="sW" x="210" y="186" width="24" height="10" rx="2"/><text class="sWt" x="222" y="180" text-anchor="middle">0</text><rect class="sW" x="244" y="186" width="24" height="10" rx="2"/><text class="sWt" x="256" y="180" text-anchor="middle">0</text><rect class="sW" x="346" y="186" width="24" height="10" rx="2"/><text class="sWt" x="358" y="180" text-anchor="middle">0</text><rect class="sW" x="448" y="186" width="24" height="10" rx="2"/><text class="sWt" x="460" y="180" text-anchor="middle">0</text><rect class="sW" x="482" y="186" width="24" height="10" rx="2"/><text class="sWt" x="494" y="180" text-anchor="middle">0</text><text class="sWt" x="40" y="44">resample("D").sum(): 19 consecutive days, 5 inserted as 0</text></g>
<g data-s="3"><polyline class="sLg" points="256.0,155.4 290.0,163.2 324.0,165.2 358.0,169.6 392.0,170.8 426.0,178.3 460.0,178.3 494.0,178.3 528.0,180.4 562.0,178.9 596.0,165.6 630.0,162.9 664.0,161.2" style="fill:none;stroke-width:2.6"/><text class="sGt" x="40" y="62">rolling(7).mean(): the first 6 days are NaN (not enough history)</text></g>
</svg><ol class="dia-steps">
<li>Raw transactions grouped by day: 14 days have rows. Weekends and a holiday simply do not exist in the data.</li>
<li>resample("D").sum() builds a continuous daily index and fills the 5 missing days with 0, which is what a forecasting model needs.</li>
<li>A 7-day rolling mean on the continuous series smooths the weekly pattern. On the sparse series, "7 rows" would have spanned 9 or more calendar days.</li>
</ol><figcaption>Sparse transactions to a continuous daily series with pandas: resample inserts the missing days, then rolling windows mean calendar days.</figcaption></figure>

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

<figure class="dia"><svg viewBox="0 0 720 190" role="img" aria-label="Time to label 100,000 rows as high or low revenue, measured with pandas: an iterrows loop takes about a second, a row-wise apply about a fifth of a second, a single-column map about 10 milliseconds and np.where under a millisecond, hundreds to over a thousand times faster than the row loops">
<text class="sT" x="14" y="22">label 100,000 rows "high"/"low" (same result every time), best of several runs</text>
<line class="sLm" x1="200" y1="34" x2="200" y2="166" opacity=".15"/><text class="sS" x="200" y="180" text-anchor="middle">0.0001 s</text>
<line class="sLm" x1="273.333" y1="34" x2="273.333" y2="166" opacity=".15"/><text class="sS" x="273.333" y="180" text-anchor="middle">0.001 s</text>
<line class="sLm" x1="346.667" y1="34" x2="346.667" y2="166" opacity=".15"/><text class="sS" x="346.667" y="180" text-anchor="middle">0.01 s</text>
<line class="sLm" x1="420" y1="34" x2="420" y2="166" opacity=".15"/><text class="sS" x="420" y="180" text-anchor="middle">0.1 s</text>
<line class="sLm" x1="493.333" y1="34" x2="493.333" y2="166" opacity=".15"/><text class="sS" x="493.333" y="180" text-anchor="middle">1 s</text>
<text class="sS" x="190" y="56" text-anchor="end">iterrows loop</text><rect class="sR" x="200" y="40" width="293.783" height="22" rx="4" opacity=".7"/><text class="sT" x="499.783" y="56">1,014.2 ms  (1,374× np.where)</text>
<text class="sS" x="190" y="88" text-anchor="end">apply(axis=1)</text><rect class="sR" x="200" y="72" width="244.365" height="22" rx="4" opacity=".7"/><text class="sT" x="450.365" y="88">214.9 ms  (291× np.where)</text>
<text class="sS" x="190" y="120" text-anchor="end">Series.map (one column)</text><rect class="sW" x="200" y="104" width="152.645" height="22" rx="4" opacity=".7"/><text class="sT" x="358.645" y="120">12.1 ms  (16× np.where)</text>
<text class="sS" x="190" y="152" text-anchor="end">np.where</text><rect class="sG" x="200" y="136" width="63.6747" height="22" rx="4" opacity=".7"/><text class="sT" x="269.675" y="152">0.7 ms</text>
</svg><figcaption>The "slow" and "fast" lines above, timed on 100,000 rows (log scale): row-wise Python is the cost, not pandas itself.</figcaption></figure>

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
