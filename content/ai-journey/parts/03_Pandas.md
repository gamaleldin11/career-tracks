# Part 3 — Pandas

<!-- nav -->
> [!example] 🧭 Step 3 of 26 · Stage 1 of 7: Toolkit
> ← [Part 02 · NumPy](02_NumPy.md) · [Part 12 · SQL](12_SQL_for_Data.md) → · [Course map](00_START_HERE.md)
<!-- /nav -->

**Source:** `AI_notebooks/2025-12-11/Pandas.ipynb` (147 cells), `2025-12-14/Pandas_2.ipynb` (80), `Pandas_3.ipynb` (95), `Pandas_3_1.ipynb` (26), `06-Merging, Joining, Concatenating and Pivoting.ipynb` (55) **Lectures:** Lec 4 (p1/p2), Lec 5

The notebook's own one-line definition:

> **A python library used for Data Wrangling**

Pandas is NumPy with labelled axes and mixed types. If NumPy is a matrix, Pandas is a spreadsheet — or, closer to your experience, a client-side in-memory table with a query API. Almost everything in this part has a direct SQL equivalent, and I flag them, because that mapping will save you the most time.

<!-- interview-focus -->

> [!tip] 🎯 Interview focus
> **Why it matters:** The pandas round is the most common live test for entry roles: filter, group, merge, handle dates, answer a business question.
>
> | Level | What you should be able to do |
> |---|---|
> | 🟢 **Entry** | `loc`/`iloc`, boolean filtering, `groupby().agg()`, `merge` (and the SQL equivalent), `value_counts`, datetime parsing, missing values. |
> | 🟡 **Mid** | Method chaining, `transform` vs `agg`, window functions (`rolling`, `shift`, `rank`), `pivot_table`, avoiding `apply` for speed, SettingWithCopy. |
> | 🔴 **Senior** | Scaling beyond memory (Polars, DuckDB, Spark), data contracts, reproducible feature pipelines. |
>
> **⭐ Most-asked:** *`loc` vs `iloc`?* · *`merge` vs `join` vs `concat`?* · *`groupby` + `agg` vs `transform`?* · *Month-over-month change per customer?* · *Why is `apply` slow, and what do you use instead?*
>
> **⏱ Time:** 3–4 h  ·  **Short on time?** Read §3.3, §3.4, §3.11, §3.12 + Part 16 §16.7.

**Legend:** 🟢 Entry (0–2 yrs) · 🟡 Mid (2–5 yrs) · 🔴 Senior / specialist · ⭐ frequently asked · 📖 Géron, *Hands-On ML with Scikit-Learn and PyTorch* (2025) pages

> [!abstract]- 🗺️ Section map — level and book pages
>
> | § | Section | Level | 📖 Book |
> |---|---|:---:|---|
> | 3.1 | Series — the labelled 1-D array | 🟢 | — |
> | 3.2 | DataFrame — the labelled 2-D table | 🟢 | — |
> | 3.3 | Row selection: `loc` versus `iloc` | 🟢 ⭐ | — |
> | 3.4 | Filtering — boolean masking with labels | 🟢 ⭐ | — |
> | 3.5 | The inspection toolkit | 🟢 | — |
> | 3.6 | Data types and datetimes | 🟢 ⭐ | — |
> | 3.7 | Reading and writing data | 🟢 | — |
> | 3.8 | Sorting | 🟢 | — |
> | 3.9 | Duplicates and missing values (preview of Part 4) | 🟢 ⭐ | — |
> | 3.10 | `apply` — running your own function over data | 🟡 | — |
> | 3.11 | `groupby` — split, apply, combine | 🟢 ⭐ | — |
> | 3.12 | Combining DataFrames | 🟢 ⭐ | — |
> | 3.13 | The profiling routine, assembled | 🟢 | — |
>

---

## 3.1 Series — the labelled 1-D array 🟢

### Creating

```python
import pandas as pd
import numpy as np

labels  = ['a', 'b', 'c']
my_list = [10, 20, 30]
d       = {'a': 10, 'b': 20, 'c': 30}
arr     = np.array([10, 20, 30])

pd.Series(data=my_list, index=labels)              # from list + explicit index
pd.Series(arr)                                     # from numpy array, index 0,1,2
arr1 = pd.Series(arr, index=labels, dtype='int32', name='age')
pd.Series(d)                                       # from dict — keys BECOME the index
```

A **Series** is a NumPy array plus an **index**. The index is the defining feature; it is what separates Pandas from NumPy.

Note the dict case: keys become the index automatically. That is the mental model — a Series is an ordered, typed dictionary that supports vectorised arithmetic.

`name` matters more than it looks: when a Series becomes a DataFrame column, `name` becomes the column header.

### Accessing

```python
ser1 = pd.Series({'one': 1, 'two': 2, 'three': 3, 'four': 4})
ser1['one']      # 1     — by label
ser1['four']     # 4

ser2 = pd.Series(np.arange(10))
ser2[[0, 8]]     # fancy indexing — a Series of the elements at positions 0 and 8
ser2.values      # the underlying NumPy array
```

### Arithmetic aligns on the index

```python
ser2_new = ser2 + ser2
ser2_new * 2
```

This looks like NumPy but there is a crucial difference: **Pandas aligns on the index before operating.** Adding two Series with different indexes produces the union of the indexes, with `NaN` wherever one side is missing.

That is a feature — it means you can add "sales by region" to "costs by region" without sorting anything first — and it is a trap, because a silent index mismatch produces silent `NaN`s rather than an error. If a computation mysteriously fills with `NaN`, index alignment is the first suspect.

<figure class="dia"><svg viewBox="0 0 720 230" role="img" aria-label="Adding two pandas Series aligns them by index label: Giza and Alex add up, while Cairo and Luxor, present on only one side, become NaN">
<text class="sM" x="90" y="22" text-anchor="middle">sales</text><rect class="sN" x="20" y="32" width="60" height="26" rx="0"/><text class="sT" x="50" y="50" text-anchor="middle">Cairo</text><rect class="sB" x="80" y="32" width="80" height="26" rx="0" opacity=".55"/><text class="sC" x="120" y="50" text-anchor="middle">120</text><rect class="sN" x="20" y="62" width="60" height="26" rx="0"/><text class="sT" x="50" y="80" text-anchor="middle">Giza</text><rect class="sB" x="80" y="62" width="80" height="26" rx="0" opacity=".55"/><text class="sC" x="120" y="80" text-anchor="middle">80</text><rect class="sN" x="20" y="92" width="60" height="26" rx="0"/><text class="sT" x="50" y="110" text-anchor="middle">Alex</text><rect class="sB" x="80" y="92" width="80" height="26" rx="0" opacity=".55"/><text class="sC" x="120" y="110" text-anchor="middle">60</text><text class="sT" x="186" y="80" text-anchor="middle">+</text><text class="sM" x="280" y="22" text-anchor="middle">costs</text><rect class="sN" x="210" y="32" width="60" height="26" rx="0"/><text class="sT" x="240" y="50" text-anchor="middle">Giza</text><rect class="sV" x="270" y="32" width="80" height="26" rx="0" opacity=".55"/><text class="sC" x="310" y="50" text-anchor="middle">30</text><rect class="sN" x="210" y="62" width="60" height="26" rx="0"/><text class="sT" x="240" y="80" text-anchor="middle">Alex</text><rect class="sV" x="270" y="62" width="80" height="26" rx="0" opacity=".55"/><text class="sC" x="310" y="80" text-anchor="middle">20</text><rect class="sN" x="210" y="92" width="60" height="26" rx="0"/><text class="sT" x="240" y="110" text-anchor="middle">Luxor</text><rect class="sV" x="270" y="92" width="80" height="26" rx="0" opacity=".55"/><text class="sC" x="310" y="110" text-anchor="middle">10</text><text class="sT" x="376" y="80" text-anchor="middle">=</text><text class="sM" x="470" y="22" text-anchor="middle">sales + costs</text><rect class="sN" x="400" y="32" width="60" height="26" rx="0"/><text class="sT" x="430" y="50" text-anchor="middle">Alex</text><rect class="sG" x="460" y="32" width="80" height="26" rx="0" opacity=".55"/><text class="sC" x="500" y="50" text-anchor="middle">80</text><rect class="sN" x="400" y="62" width="60" height="26" rx="0"/><text class="sT" x="430" y="80" text-anchor="middle">Cairo</text><rect class="sR" x="460" y="62" width="80" height="26" rx="0" opacity=".55"/><text class="sC" x="500" y="80" text-anchor="middle">NaN</text><rect class="sN" x="400" y="92" width="60" height="26" rx="0"/><text class="sT" x="430" y="110" text-anchor="middle">Giza</text><rect class="sG" x="460" y="92" width="80" height="26" rx="0" opacity=".55"/><text class="sC" x="500" y="110" text-anchor="middle">110</text><rect class="sN" x="400" y="122" width="60" height="26" rx="0"/><text class="sT" x="430" y="140" text-anchor="middle">Luxor</text><rect class="sR" x="460" y="122" width="80" height="26" rx="0" opacity=".55"/><text class="sC" x="500" y="140" text-anchor="middle">NaN</text>
<text class="sC" x="560" y="170" text-anchor="middle">matched by label, not by position;</text><text class="sRt" x="560" y="188" text-anchor="middle">a label on one side only → NaN</text><text class="sGt" x="560" y="214" text-anchor="middle">sales.add(costs, fill_value=0) avoids it</text>
</svg><figcaption>Pandas lines rows up by label before doing arithmetic. Powerful, and the reason unexpected NaNs appear.</figcaption></figure>

### Dates as an index

```python
dates = pd.date_range('2025-12-01', periods=4)
ts = pd.Series([10, 20, 30, 40], index=dates)
```

A Series indexed by dates is a **time series**, and Pandas has a whole grammar for it (`resample`, `rolling`, `shift`). The course only touches this; see §3.6.

### Missing data on a Series

```python
ts.isnull()      # boolean mask
ts.isna()        # identical — isna is the newer name, isnull is the pandas-0.x name

ser3 = pd.Series(np.array([1, 3, np.nan]))
ser3.fillna(0)
ser3.max()       # 3.0 — aggregations SKIP NaN by default
```

`np.nan` is *Not A Number*, an IEEE-754 float value. Two consequences the notebook flags explicitly:

```python
np.nan != np.nan       # True  ← NaN is not equal to itself
```

> **Note:** filtering on NaN values use `.isna()`/`isnull()` or `notna()` instead of `== np.nan`

That is the notebook's own comment and it is the correct warning. `df[df.col == np.nan]` returns an empty DataFrame, always, silently.

Second consequence: **NaN forces a column to float**. An integer column with one missing value becomes `float64`, because there is no integer NaN. (Modern Pandas offers nullable `Int64` — capital I — which does support missing integers; see `convert_dtypes()` below.)

---

## 3.2 DataFrame — the labelled 2-D table 🟢

### Creating

```python
np.random.seed(101)
df = pd.DataFrame(np.random.randn(5, 4),
                  ['a', 'b', 'c', 'd', 'e'],     # index (row labels)
                  ['W', 'X', 'Y', 'Z'])          # columns

d_new = {'a': [10, 100], 'b': [20, 200], 'c': [30, 300]}
df3 = pd.DataFrame(d_new, index=[0, 1])          # from dict: keys become COLUMNS
```

A DataFrame is a dict of Series that share an index. Note the asymmetry with Series: for a Series, dict keys become the *index*; for a DataFrame, dict keys become the *columns*.

<figure class="dia"><svg viewBox="0 0 720 232" role="img" aria-label="The DataFrame from the code above: a column index W to Z, a row index a to e, and a 5 by 4 grid of values; selecting W with single brackets gives a Series, with double brackets a DataFrame">
<text class="sM" x="230" y="22" text-anchor="middle">df.columns: Index(['W', 'X', 'Y', 'Z'])</text>
<rect class="sA" x="90" y="34" width="68" height="22" rx="3"/><text class="sT" x="125" y="50" text-anchor="middle">W</text>
<rect class="sA" x="160" y="34" width="68" height="22" rx="3"/><text class="sT" x="195" y="50" text-anchor="middle">X</text>
<rect class="sA" x="230" y="34" width="68" height="22" rx="3"/><text class="sT" x="265" y="50" text-anchor="middle">Y</text>
<rect class="sA" x="300" y="34" width="68" height="22" rx="3"/><text class="sT" x="335" y="50" text-anchor="middle">Z</text>
<rect class="sV" x="50" y="58" width="36" height="22" rx="3"/><text class="sT" x="68" y="74" text-anchor="middle">a</text>
<rect class="sG" x="90" y="58" width="68" height="22" rx="2" opacity=".6"/><text class="sS" x="125" y="74" text-anchor="middle">2.71</text>
<rect class="sN" x="160" y="58" width="68" height="22" rx="2"/><text class="sS" x="195" y="74" text-anchor="middle">0.63</text>
<rect class="sN" x="230" y="58" width="68" height="22" rx="2"/><text class="sS" x="265" y="74" text-anchor="middle">0.91</text>
<rect class="sN" x="300" y="58" width="68" height="22" rx="2"/><text class="sS" x="335" y="74" text-anchor="middle">0.50</text>
<rect class="sV" x="50" y="82" width="36" height="22" rx="3"/><text class="sT" x="68" y="98" text-anchor="middle">b</text>
<rect class="sG" x="90" y="82" width="68" height="22" rx="2" opacity=".6"/><text class="sS" x="125" y="98" text-anchor="middle">0.65</text>
<rect class="sN" x="160" y="82" width="68" height="22" rx="2"/><text class="sS" x="195" y="98" text-anchor="middle">-0.32</text>
<rect class="sN" x="230" y="82" width="68" height="22" rx="2"/><text class="sS" x="265" y="98" text-anchor="middle">-0.85</text>
<rect class="sN" x="300" y="82" width="68" height="22" rx="2"/><text class="sS" x="335" y="98" text-anchor="middle">0.61</text>
<rect class="sV" x="50" y="106" width="36" height="22" rx="3"/><text class="sT" x="68" y="122" text-anchor="middle">c</text>
<rect class="sG" x="90" y="106" width="68" height="22" rx="2" opacity=".6"/><text class="sS" x="125" y="122" text-anchor="middle">-2.02</text>
<rect class="sN" x="160" y="106" width="68" height="22" rx="2"/><text class="sS" x="195" y="122" text-anchor="middle">0.74</text>
<rect class="sN" x="230" y="106" width="68" height="22" rx="2"/><text class="sS" x="265" y="122" text-anchor="middle">0.53</text>
<rect class="sN" x="300" y="106" width="68" height="22" rx="2"/><text class="sS" x="335" y="122" text-anchor="middle">-0.59</text>
<rect class="sV" x="50" y="130" width="36" height="22" rx="3"/><text class="sT" x="68" y="146" text-anchor="middle">d</text>
<rect class="sG" x="90" y="130" width="68" height="22" rx="2" opacity=".6"/><text class="sS" x="125" y="146" text-anchor="middle">0.19</text>
<rect class="sN" x="160" y="130" width="68" height="22" rx="2"/><text class="sS" x="195" y="146" text-anchor="middle">-0.76</text>
<rect class="sN" x="230" y="130" width="68" height="22" rx="2"/><text class="sS" x="265" y="146" text-anchor="middle">-0.93</text>
<rect class="sN" x="300" y="130" width="68" height="22" rx="2"/><text class="sS" x="335" y="146" text-anchor="middle">0.96</text>
<rect class="sV" x="50" y="154" width="36" height="22" rx="3"/><text class="sT" x="68" y="170" text-anchor="middle">e</text>
<rect class="sG" x="90" y="154" width="68" height="22" rx="2" opacity=".6"/><text class="sS" x="125" y="170" text-anchor="middle">0.19</text>
<rect class="sN" x="160" y="154" width="68" height="22" rx="2"/><text class="sS" x="195" y="170" text-anchor="middle">1.98</text>
<rect class="sN" x="230" y="154" width="68" height="22" rx="2"/><text class="sS" x="265" y="170" text-anchor="middle">2.61</text>
<rect class="sN" x="300" y="154" width="68" height="22" rx="2"/><text class="sS" x="335" y="170" text-anchor="middle">0.68</text>
<text class="sM" x="68" y="196" text-anchor="middle">df.index</text>
<text class="sS" x="230" y="196" text-anchor="middle">df.values: a 5×4 float64 NumPy array</text>
<line class="sLg" x1="376" y1="108" x2="420" y2="108" marker-end="url(#ahg)"/>
<rect class="sN" x="424" y="40" width="282" height="64" rx="8"/><text class="sS" x="436" y="64" xml:space="preserve" style="white-space:pre">df['W']       → Series (5,)</text><text class="sS" x="436" y="86" xml:space="preserve" style="white-space:pre">df[['W', 'Z']] → DataFrame (5, 2)</text>
<rect class="sN" x="424" y="116" width="282" height="64" rx="8"/><text class="sC" x="565" y="140" text-anchor="middle">each column is a Series sharing</text><text class="sC" x="565" y="158" text-anchor="middle">the same index (a dict of Series)</text>
<text class="sS" x="360" y="220" text-anchor="middle">single brackets give a 1-D Series, double brackets a 2-D DataFrame: scikit-learn wants df[['col']]</text>
</svg><figcaption>Anatomy of the DataFrame created above (seed 101), with its real values: index, columns, values, and one column as a Series.</figcaption></figure>

### Selecting columns

```python
df['W']            # → Series
df[['W', 'Z']]     # → DataFrame  (note the double brackets: a LIST of columns)
df.W               # attribute access — works only for valid identifiers
```

**Single brackets give a Series, double brackets give a DataFrame.** This distinction becomes load-bearing later: scikit-learn wants a 2-D `X`, so you pass `df[['col']]`, not `df['col']`.

The notebook's warning on attribute access — *"MAKE SURE NO SPACING IN THE COLUMN NAME"* — extends further: `df.count` gives you the *method*, not a column named `count`. Attribute access is convenient for exploration and a bad idea in code you keep.

### Adding columns

```python
df['new_col'] = [1, 2, 3, 4, 5]                     # from a list
df['new_col_np'] = np.array([1.0, 2.0, 3.0, 4.0, 5.0])
df['empty_col'] = np.nan                            # broadcast a scalar
df['Flag'] = pd.Series(dtype='bool')                # empty typed column
df['new'] = df.new_col + df.new_col_np              # from other columns
```

Assignment to a new key creates the column; to an existing key, replaces it. Scalars broadcast to the full length.

### Dropping

```python
df.drop([4], axis=0, inplace=True)                  # drop ROW with label 4
df.drop('new_col_np', axis=1, inplace=True)         # drop COLUMN
df.drop(columns=['Flag', 'empty_col'], inplace=True) # clearer — no axis needed
```

**`axis=0` is rows, `axis=1` is columns.** Same convention as NumPy (§2.5): axis 0 is the row axis, axis 1 the column axis. The `columns=` keyword form is unambiguous and preferable.

**On `inplace=True`:** it modifies the object and returns `None`. It reads convenient but it is discouraged in modern Pandas — it prevents method chaining, it is not actually faster (Pandas usually copies internally anyway), and `df = df.drop(...)` is clearer. Pandas 3.0 is removing `inplace` from many methods. The course uses it heavily; new code should not.

---

## 3.3 Row selection: `loc` versus `iloc` 🟢 ⭐

> [!quote] 💬 Say it in the interview
> “`loc` is label-based with an inclusive end; `iloc` is position-based with an exclusive end. For assignments I always use `.loc[rows, col]` to avoid chained-indexing bugs.”

The most important pair of methods in Pandas.

```python
df.loc['a']            # by LABEL
df.iloc[0]             # by INTEGER POSITION

df.loc['e']
df.iloc[-1]

df.loc[['a', 'c']]     # multiple labels
df.iloc[[0, 2]]        # multiple positions
df.iloc[1:6]           # positional slice — stop EXCLUSIVE (Python convention)
```

| | `.loc` | `.iloc` |
|---|---|---|
| Selects by | Label | Integer position |
| Slice endpoint | **Inclusive** | **Exclusive** |
| Works when index is 0,1,2… | Yes, but means *label* 0 | Yes, means *position* 0 |

The inclusive/exclusive asymmetry is deliberate and catches everyone: `df.loc['a':'c']` includes `'c'`, but `df.iloc[0:3]` stops at position 2. The reasoning is that with labels you often do not know what comes after `'c'`, so excluding it would be unusable.

<figure class="dia"><svg viewBox="0 0 720 238" role="img" aria-label="loc selects by label and includes the end label, iloc selects by position and excludes the end, so loc a to c and iloc 0 to 3 both return three rows">
<text class="sM" x="130" y="16" text-anchor="middle">df.loc['a':'c']</text><text class="sC" x="130" y="32" text-anchor="middle">labels, end included</text>
<text class="sC" x="34" y="61" text-anchor="middle">0</text><rect class="sN" x="50" y="42" width="40" height="26" rx="0"/><text class="sT" x="70" y="61" text-anchor="middle">a</text><rect class="sA" x="90" y="42" width="140" height="26" rx="0"/>
<text class="sC" x="34" y="91" text-anchor="middle">1</text><rect class="sN" x="50" y="72" width="40" height="26" rx="0"/><text class="sT" x="70" y="91" text-anchor="middle">b</text><rect class="sA" x="90" y="72" width="140" height="26" rx="0"/>
<text class="sC" x="34" y="121" text-anchor="middle">2</text><rect class="sN" x="50" y="102" width="40" height="26" rx="0"/><text class="sT" x="70" y="121" text-anchor="middle">c</text><rect class="sA" x="90" y="102" width="140" height="26" rx="0"/>
<text class="sC" x="34" y="151" text-anchor="middle">3</text><rect class="sN" x="50" y="132" width="40" height="26" rx="0"/><text class="sT" x="70" y="151" text-anchor="middle">d</text><rect class="sB" x="90" y="132" width="140" height="26" rx="0" opacity=".35"/>
<text class="sC" x="34" y="181" text-anchor="middle">4</text><rect class="sN" x="50" y="162" width="40" height="26" rx="0"/><text class="sT" x="70" y="181" text-anchor="middle">e</text><rect class="sB" x="90" y="162" width="140" height="26" rx="0" opacity=".35"/>
<text class="sGt" x="130" y="204" text-anchor="middle">3 rows</text>
<text class="sM" x="366" y="16" text-anchor="middle">df.iloc[0:3]</text><text class="sC" x="366" y="32" text-anchor="middle">positions, end excluded</text>
<text class="sC" x="270" y="61" text-anchor="middle">0</text><rect class="sN" x="286" y="42" width="40" height="26" rx="0"/><text class="sT" x="306" y="61" text-anchor="middle">a</text><rect class="sA" x="326" y="42" width="140" height="26" rx="0"/>
<text class="sC" x="270" y="91" text-anchor="middle">1</text><rect class="sN" x="286" y="72" width="40" height="26" rx="0"/><text class="sT" x="306" y="91" text-anchor="middle">b</text><rect class="sA" x="326" y="72" width="140" height="26" rx="0"/>
<text class="sC" x="270" y="121" text-anchor="middle">2</text><rect class="sN" x="286" y="102" width="40" height="26" rx="0"/><text class="sT" x="306" y="121" text-anchor="middle">c</text><rect class="sA" x="326" y="102" width="140" height="26" rx="0"/>
<text class="sC" x="270" y="151" text-anchor="middle">3</text><rect class="sN" x="286" y="132" width="40" height="26" rx="0"/><text class="sT" x="306" y="151" text-anchor="middle">d</text><rect class="sB" x="326" y="132" width="140" height="26" rx="0" opacity=".35"/>
<text class="sC" x="270" y="181" text-anchor="middle">4</text><rect class="sN" x="286" y="162" width="40" height="26" rx="0"/><text class="sT" x="306" y="181" text-anchor="middle">e</text><rect class="sB" x="326" y="162" width="140" height="26" rx="0" opacity=".35"/>
<text class="sGt" x="366" y="204" text-anchor="middle">3 rows</text>
<text class="sM" x="602" y="16" text-anchor="middle">loc['a':'b'] · iloc[0:2]</text><text class="sC" x="602" y="32" text-anchor="middle">the same two rows</text>
<text class="sC" x="506" y="61" text-anchor="middle">0</text><rect class="sN" x="522" y="42" width="40" height="26" rx="0"/><text class="sT" x="542" y="61" text-anchor="middle">a</text><rect class="sA" x="562" y="42" width="140" height="26" rx="0"/>
<text class="sC" x="506" y="91" text-anchor="middle">1</text><rect class="sN" x="522" y="72" width="40" height="26" rx="0"/><text class="sT" x="542" y="91" text-anchor="middle">b</text><rect class="sA" x="562" y="72" width="140" height="26" rx="0"/>
<text class="sC" x="506" y="121" text-anchor="middle">2</text><rect class="sN" x="522" y="102" width="40" height="26" rx="0"/><text class="sT" x="542" y="121" text-anchor="middle">c</text><rect class="sB" x="562" y="102" width="140" height="26" rx="0" opacity=".35"/>
<text class="sC" x="506" y="151" text-anchor="middle">3</text><rect class="sN" x="522" y="132" width="40" height="26" rx="0"/><text class="sT" x="542" y="151" text-anchor="middle">d</text><rect class="sB" x="562" y="132" width="140" height="26" rx="0" opacity=".35"/>
<text class="sC" x="506" y="181" text-anchor="middle">4</text><rect class="sN" x="522" y="162" width="40" height="26" rx="0"/><text class="sT" x="542" y="181" text-anchor="middle">e</text><rect class="sB" x="562" y="162" width="140" height="26" rx="0" opacity=".35"/>
<text class="sGt" x="602" y="204" text-anchor="middle">2 rows each</text>
<text class="sC" x="360" y="226" text-anchor="middle">small grey numbers: positions · bold letters: labels</text>
</svg><figcaption>loc speaks labels and includes the end; iloc speaks positions and excludes it, like Python slicing.</figcaption></figure>

### Selecting rows and columns together

```python
df.iloc[1]['W']            # chained — row first, then column
df.loc['b']['W']           # chained
df['W'].loc['b']           # chained the other way
df['W'].iloc[1]

df[['W', 'Y']].loc[['b', 'c']]
df.loc[['b', 'c']][['W', 'Y']]
```

All of these work for **reading**. The idiomatic form the course does not show is the two-argument version:

```python
df.loc['b', 'W']              # single value
df.loc[['b', 'c'], ['W', 'Y']] # sub-table
```

⚠️ **Prefer the two-argument form, and for writing you must use it.** Chained assignment — `df[cond]['col'] = value` — operates on a temporary and may silently do nothing. This bug appears verbatim in the course's own cleaning notebook (Part 4) and is worth seeing early:

```python
df[df['height(cm)'] < 100]['height(cm)'] = median_of_height   # ❌ does nothing
df.loc[df['height(cm)'] < 100, 'height(cm)'] = median_of_height # ✅ correct
```

The notebook runs both, and `df.describe()` between them shows the first had no effect. That is the `SettingWithCopyWarning` you will see in real work.

### Adding a row

```python
df.loc['f'] = [10, 20, 30, 40, 50, 60]
df.drop('f', axis=0, inplace=True)
```

Fine for one row. Do **not** do this in a loop — each `.loc` append reallocates the whole frame, giving O(n²) behaviour. Collect rows in a list and `pd.concat` once.

---

## 3.4 Filtering — boolean masking with labels 🟢 ⭐

```python
df[df.new_col > 4]
df[df.Monthly_Usage_MB > 10000]
df[(df['Bundle'] == 'Video') & (df['Monthly_Usage_MB'] >= 8000)]
df[df['Bundle'] != 'Social']
```

Exactly the NumPy mechanism from §2.7, now with labels. Same two rules:

- Use `&`, `|`, `~` — never `and`, `or`, `not`.
- **Parenthesise every condition.** `&` has higher precedence than `>=`, so `df.a > 1 & df.b < 2` parses as `df.a > (1 & df.b) < 2` and raises.

**SQL mapping:** `df[df.country == 'Germany']` is `SELECT * FROM df WHERE country = 'Germany'`. `.isin(['Germany','France'])` is `IN (...)`.

---

## 3.5 The inspection toolkit 🟢

The methods you run first, every single time, on every dataset:

```python
df.head()          # first 5 rows (default)
df.head(10)
df.tail()          # last 5
df.sample(4)       # 4 RANDOM rows — better than head for spotting variety

df.shape           # (rows, cols)
df.columns         # column labels
df.index           # row labels
df.values          # underlying numpy array
df.dtypes          # type per column

df.info()          # dtypes + non-null counts + memory — the single best one-liner
df.describe()      # count/mean/std/min/quartiles/max for NUMERIC columns
```

**`df.info()` is the most valuable.** It answers three questions at once: what type is each column, how many nulls does each have, and how much memory is this using.

**`df.describe()` has a trap the course exploits well in Part 4:** it only summarises numeric columns. A numeric column that was read as text simply *does not appear* — which is exactly how you discover that `height(cm)` arrived as an object dtype.

```python
df.describe(include='O')                            # object/text columns instead
df.describe(percentiles=[0.01, 0.05, 0.95, 0.99])   # custom percentiles
```

Those extreme percentiles are a professional habit worth adopting: the 1st and 99th percentiles reveal outlier tails that quartiles hide.

### Uniqueness and counts

```python
df['col2'].unique()      # array of distinct values
df['col2'].nunique()     # count of distinct values          → SQL COUNT(DISTINCT)
df['col2'].value_counts()  # frequency of each value, descending → SQL GROUP BY + COUNT

for col in df.columns:
    print(df[col].value_counts(normalize=True, dropna=False))
```

`value_counts` is probably the single most-used exploration method. Two arguments matter:

- `normalize=True` → proportions instead of counts.
- `dropna=False` → **includes NaN as a category**. This is off by default, which means the default view hides your missing data. Turn it on.

The loop above — `value_counts` over every column — is a compact profiling idiom.

<figure class="dia"><svg viewBox="0 0 720 190" role="img" aria-label="A five-row CSV where one height reads 180cm: dtypes shows height as object, so describe lists only weight and height disappears; value_counts on city shows 3 of 5 rows until dropna=False reveals 2 missing values">
<text class="sM" x="14" y="22">read_csv of 5 rows: one height typed "180cm", two cities blank</text>
<text class="sT" x="14" y="46">df.dtypes</text>
<rect class="sN" x="14" y="54" width="210" height="20" rx="3"/><text class="sS" x="22" y="68" xml:space="preserve" style="white-space:pre">name        object</text>
<rect class="sR" x="14" y="78" width="210" height="20" rx="3" opacity=".6"/><text class="sS" x="22" y="92" xml:space="preserve" style="white-space:pre">height(cm)  object</text>
<rect class="sN" x="14" y="102" width="210" height="20" rx="3"/><text class="sS" x="22" y="116" xml:space="preserve" style="white-space:pre">weight      int64</text>
<rect class="sN" x="14" y="126" width="210" height="20" rx="3"/><text class="sS" x="22" y="140" xml:space="preserve" style="white-space:pre">city        object</text>
<text class="sT" x="250" y="46">df.describe() columns</text>
<rect class="sG" x="250" y="54" width="150" height="20" rx="3" opacity=".6"/><text class="sS" x="258" y="68" xml:space="preserve" style="white-space:pre">weight</text>
<text class="sRt" x="250" y="96">height(cm) silently missing:</text><text class="sRt" x="250" y="112">one bad value made it text</text>
<text class="sT" x="440" y="46">city value_counts()</text>
<text class="sS" x="440" y="68" xml:space="preserve" style="white-space:pre">Cairo  2</text>
<text class="sS" x="440" y="88" xml:space="preserve" style="white-space:pre">Giza   1</text>
<text class="sRt" x="440" y="112">total 3 of 5 rows</text>
<text class="sT" x="590" y="46">dropna=False</text>
<text class="sS" x="590" y="68" xml:space="preserve" style="white-space:pre">Cairo  2</text>
<text class="sGt" x="590" y="88" xml:space="preserve" style="white-space:pre">NaN    2</text>
<text class="sS" x="590" y="108" xml:space="preserve" style="white-space:pre">Giza   1</text>
<text class="sGt" x="590" y="132">total 5: nothing hidden</text>
<text class="sS" x="360" y="178" text-anchor="middle">the default views hide exactly the problems you are looking for: check dtypes, and count NaN explicitly</text>
</svg><figcaption>Two default views that hide problems, computed with pandas: describe() skips text columns, value_counts() skips NaN.</figcaption></figure>

### Statistics

```python
df.mean(axis=1); df['col2'].mean()
df.col1.median()
df.mode()                    # returns a DATAFRAME (there can be several modes)
df[['col1','col2']].std()

Q1 = df.quantile(0.25)
Q3 = df.quantile(0.75)
iqr = Q3 - Q1

df.corr()                    # pairwise correlation matrix
df.col2.skew()               # asymmetry of the distribution
```

**Mean vs median.** The mean is pulled by outliers; the median is not. This is precisely why Part 4 imputes with the median for skewed columns and the mean only for symmetric ones.

**`skew()`** quantifies that asymmetry. Positive skew = long right tail (income, house prices) → prefer median. Near zero = roughly symmetric → mean is fine.

**`corr()`** defaults to **Pearson**, which measures *linear* association only. Two other options matter:

- `method='spearman'` — rank-based; captures any *monotonic* relationship and is robust to outliers. The Seaborn notebook in Part 5 uses exactly this.
- `method='kendall'` — another rank correlation, better for small samples.

And the standard warning: correlation of 0 means no *linear* relationship, not no relationship. A perfect parabola has Pearson correlation ≈ 0.

---

## 3.6 Data types and datetimes 🟢 ⭐

### Inspecting and selecting by type

```python
df1.dtypes
df1.select_dtypes(include='number')
df1.select_dtypes(include='object')   # 'O' is the same thing
```

`select_dtypes` is how every pipeline in this course splits numeric from categorical columns:

```python
num_cols = X.select_dtypes(include="number").columns.tolist()
cat_cols = X.select_dtypes(include=["object", "category", "bool"]).columns.tolist()
```

### Casting

```python
df1.dates = pd.to_datetime(df1['dates'], errors='coerce', format='', dayfirst=True)

df1_opt = df1.convert_dtypes()          # infer the best nullable dtypes
df1.strings = df1.strings.astype('category')
```

**`errors='coerce'`** is the workhorse. It turns anything unparseable into `NaT`/`NaN` instead of raising. That converts a hard failure into a measurable one — you then count the NaNs and decide. The alternative, `errors='raise'`, stops the whole notebook on one bad row.

**`dayfirst=True`** resolves the `03/04/2025` ambiguity in favour of the European reading (3 April, not 4 March). Get this wrong and you silently corrupt up to 12/31 of your dates.

<figure class="dia"><svg viewBox="0 0 720 282" role="img" aria-label="A calendar of every date in 2025: the 132 dates with a day of 12 or less, other than those where day equals month, parse to a different date depending on dayfirst; dates with a day above 12 are unambiguous">
<rect class="sG" x="70" y="50" width="17" height="13" rx="2"/>
<rect class="sR" x="89" y="50" width="17" height="13" rx="2"/>
<rect class="sR" x="108" y="50" width="17" height="13" rx="2"/>
<rect class="sR" x="127" y="50" width="17" height="13" rx="2"/>
<rect class="sR" x="146" y="50" width="17" height="13" rx="2"/>
<rect class="sR" x="165" y="50" width="17" height="13" rx="2"/>
<rect class="sR" x="184" y="50" width="17" height="13" rx="2"/>
<rect class="sR" x="203" y="50" width="17" height="13" rx="2"/>
<rect class="sR" x="222" y="50" width="17" height="13" rx="2"/>
<rect class="sR" x="241" y="50" width="17" height="13" rx="2"/>
<rect class="sR" x="260" y="50" width="17" height="13" rx="2"/>
<rect class="sR" x="279" y="50" width="17" height="13" rx="2"/>
<rect class="sN" x="298" y="50" width="17" height="13" rx="2"/>
<rect class="sN" x="317" y="50" width="17" height="13" rx="2"/>
<rect class="sN" x="336" y="50" width="17" height="13" rx="2"/>
<rect class="sN" x="355" y="50" width="17" height="13" rx="2"/>
<rect class="sN" x="374" y="50" width="17" height="13" rx="2"/>
<rect class="sN" x="393" y="50" width="17" height="13" rx="2"/>
<rect class="sN" x="412" y="50" width="17" height="13" rx="2"/>
<rect class="sN" x="431" y="50" width="17" height="13" rx="2"/>
<rect class="sN" x="450" y="50" width="17" height="13" rx="2"/>
<rect class="sN" x="469" y="50" width="17" height="13" rx="2"/>
<rect class="sN" x="488" y="50" width="17" height="13" rx="2"/>
<rect class="sN" x="507" y="50" width="17" height="13" rx="2"/>
<rect class="sN" x="526" y="50" width="17" height="13" rx="2"/>
<rect class="sN" x="545" y="50" width="17" height="13" rx="2"/>
<rect class="sN" x="564" y="50" width="17" height="13" rx="2"/>
<rect class="sN" x="583" y="50" width="17" height="13" rx="2"/>
<rect class="sN" x="602" y="50" width="17" height="13" rx="2"/>
<rect class="sN" x="621" y="50" width="17" height="13" rx="2"/>
<rect class="sN" x="640" y="50" width="17" height="13" rx="2"/>
<rect class="sR" x="70" y="65" width="17" height="13" rx="2"/>
<rect class="sG" x="89" y="65" width="17" height="13" rx="2"/>
<rect class="sR" x="108" y="65" width="17" height="13" rx="2"/>
<rect class="sR" x="127" y="65" width="17" height="13" rx="2"/>
<rect class="sR" x="146" y="65" width="17" height="13" rx="2"/>
<rect class="sR" x="165" y="65" width="17" height="13" rx="2"/>
<rect class="sR" x="184" y="65" width="17" height="13" rx="2"/>
<rect class="sR" x="203" y="65" width="17" height="13" rx="2"/>
<rect class="sR" x="222" y="65" width="17" height="13" rx="2"/>
<rect class="sR" x="241" y="65" width="17" height="13" rx="2"/>
<rect class="sR" x="260" y="65" width="17" height="13" rx="2"/>
<rect class="sR" x="279" y="65" width="17" height="13" rx="2"/>
<rect class="sN" x="298" y="65" width="17" height="13" rx="2"/>
<rect class="sN" x="317" y="65" width="17" height="13" rx="2"/>
<rect class="sN" x="336" y="65" width="17" height="13" rx="2"/>
<rect class="sN" x="355" y="65" width="17" height="13" rx="2"/>
<rect class="sN" x="374" y="65" width="17" height="13" rx="2"/>
<rect class="sN" x="393" y="65" width="17" height="13" rx="2"/>
<rect class="sN" x="412" y="65" width="17" height="13" rx="2"/>
<rect class="sN" x="431" y="65" width="17" height="13" rx="2"/>
<rect class="sN" x="450" y="65" width="17" height="13" rx="2"/>
<rect class="sN" x="469" y="65" width="17" height="13" rx="2"/>
<rect class="sN" x="488" y="65" width="17" height="13" rx="2"/>
<rect class="sN" x="507" y="65" width="17" height="13" rx="2"/>
<rect class="sN" x="526" y="65" width="17" height="13" rx="2"/>
<rect class="sN" x="545" y="65" width="17" height="13" rx="2"/>
<rect class="sN" x="564" y="65" width="17" height="13" rx="2"/>
<rect class="sN" x="583" y="65" width="17" height="13" rx="2"/>
<rect class="sR" x="70" y="80" width="17" height="13" rx="2"/>
<rect class="sR" x="89" y="80" width="17" height="13" rx="2"/>
<rect class="sG" x="108" y="80" width="17" height="13" rx="2"/>
<rect class="sR" x="127" y="80" width="17" height="13" rx="2"/>
<rect class="sR" x="146" y="80" width="17" height="13" rx="2"/>
<rect class="sR" x="165" y="80" width="17" height="13" rx="2"/>
<rect class="sR" x="184" y="80" width="17" height="13" rx="2"/>
<rect class="sR" x="203" y="80" width="17" height="13" rx="2"/>
<rect class="sR" x="222" y="80" width="17" height="13" rx="2"/>
<rect class="sR" x="241" y="80" width="17" height="13" rx="2"/>
<rect class="sR" x="260" y="80" width="17" height="13" rx="2"/>
<rect class="sR" x="279" y="80" width="17" height="13" rx="2"/>
<rect class="sN" x="298" y="80" width="17" height="13" rx="2"/>
<rect class="sN" x="317" y="80" width="17" height="13" rx="2"/>
<rect class="sN" x="336" y="80" width="17" height="13" rx="2"/>
<rect class="sN" x="355" y="80" width="17" height="13" rx="2"/>
<rect class="sN" x="374" y="80" width="17" height="13" rx="2"/>
<rect class="sN" x="393" y="80" width="17" height="13" rx="2"/>
<rect class="sN" x="412" y="80" width="17" height="13" rx="2"/>
<rect class="sN" x="431" y="80" width="17" height="13" rx="2"/>
<rect class="sN" x="450" y="80" width="17" height="13" rx="2"/>
<rect class="sN" x="469" y="80" width="17" height="13" rx="2"/>
<rect class="sN" x="488" y="80" width="17" height="13" rx="2"/>
<rect class="sN" x="507" y="80" width="17" height="13" rx="2"/>
<rect class="sN" x="526" y="80" width="17" height="13" rx="2"/>
<rect class="sN" x="545" y="80" width="17" height="13" rx="2"/>
<rect class="sN" x="564" y="80" width="17" height="13" rx="2"/>
<rect class="sN" x="583" y="80" width="17" height="13" rx="2"/>
<rect class="sN" x="602" y="80" width="17" height="13" rx="2"/>
<rect class="sN" x="621" y="80" width="17" height="13" rx="2"/>
<rect class="sN" x="640" y="80" width="17" height="13" rx="2"/>
<rect class="sR" x="70" y="95" width="17" height="13" rx="2"/>
<rect class="sR" x="89" y="95" width="17" height="13" rx="2"/>
<rect class="sR" x="108" y="95" width="17" height="13" rx="2"/>
<rect class="sG" x="127" y="95" width="17" height="13" rx="2"/>
<rect class="sR" x="146" y="95" width="17" height="13" rx="2"/>
<rect class="sR" x="165" y="95" width="17" height="13" rx="2"/>
<rect class="sR" x="184" y="95" width="17" height="13" rx="2"/>
<rect class="sR" x="203" y="95" width="17" height="13" rx="2"/>
<rect class="sR" x="222" y="95" width="17" height="13" rx="2"/>
<rect class="sR" x="241" y="95" width="17" height="13" rx="2"/>
<rect class="sR" x="260" y="95" width="17" height="13" rx="2"/>
<rect class="sR" x="279" y="95" width="17" height="13" rx="2"/>
<rect class="sN" x="298" y="95" width="17" height="13" rx="2"/>
<rect class="sN" x="317" y="95" width="17" height="13" rx="2"/>
<rect class="sN" x="336" y="95" width="17" height="13" rx="2"/>
<rect class="sN" x="355" y="95" width="17" height="13" rx="2"/>
<rect class="sN" x="374" y="95" width="17" height="13" rx="2"/>
<rect class="sN" x="393" y="95" width="17" height="13" rx="2"/>
<rect class="sN" x="412" y="95" width="17" height="13" rx="2"/>
<rect class="sN" x="431" y="95" width="17" height="13" rx="2"/>
<rect class="sN" x="450" y="95" width="17" height="13" rx="2"/>
<rect class="sN" x="469" y="95" width="17" height="13" rx="2"/>
<rect class="sN" x="488" y="95" width="17" height="13" rx="2"/>
<rect class="sN" x="507" y="95" width="17" height="13" rx="2"/>
<rect class="sN" x="526" y="95" width="17" height="13" rx="2"/>
<rect class="sN" x="545" y="95" width="17" height="13" rx="2"/>
<rect class="sN" x="564" y="95" width="17" height="13" rx="2"/>
<rect class="sN" x="583" y="95" width="17" height="13" rx="2"/>
<rect class="sN" x="602" y="95" width="17" height="13" rx="2"/>
<rect class="sN" x="621" y="95" width="17" height="13" rx="2"/>
<rect class="sR" x="70" y="110" width="17" height="13" rx="2"/>
<rect class="sR" x="89" y="110" width="17" height="13" rx="2"/>
<rect class="sR" x="108" y="110" width="17" height="13" rx="2"/>
<rect class="sR" x="127" y="110" width="17" height="13" rx="2"/>
<rect class="sG" x="146" y="110" width="17" height="13" rx="2"/>
<rect class="sR" x="165" y="110" width="17" height="13" rx="2"/>
<rect class="sR" x="184" y="110" width="17" height="13" rx="2"/>
<rect class="sR" x="203" y="110" width="17" height="13" rx="2"/>
<rect class="sR" x="222" y="110" width="17" height="13" rx="2"/>
<rect class="sR" x="241" y="110" width="17" height="13" rx="2"/>
<rect class="sR" x="260" y="110" width="17" height="13" rx="2"/>
<rect class="sR" x="279" y="110" width="17" height="13" rx="2"/>
<rect class="sN" x="298" y="110" width="17" height="13" rx="2"/>
<rect class="sN" x="317" y="110" width="17" height="13" rx="2"/>
<rect class="sN" x="336" y="110" width="17" height="13" rx="2"/>
<rect class="sN" x="355" y="110" width="17" height="13" rx="2"/>
<rect class="sN" x="374" y="110" width="17" height="13" rx="2"/>
<rect class="sN" x="393" y="110" width="17" height="13" rx="2"/>
<rect class="sN" x="412" y="110" width="17" height="13" rx="2"/>
<rect class="sN" x="431" y="110" width="17" height="13" rx="2"/>
<rect class="sN" x="450" y="110" width="17" height="13" rx="2"/>
<rect class="sN" x="469" y="110" width="17" height="13" rx="2"/>
<rect class="sN" x="488" y="110" width="17" height="13" rx="2"/>
<rect class="sN" x="507" y="110" width="17" height="13" rx="2"/>
<rect class="sN" x="526" y="110" width="17" height="13" rx="2"/>
<rect class="sN" x="545" y="110" width="17" height="13" rx="2"/>
<rect class="sN" x="564" y="110" width="17" height="13" rx="2"/>
<rect class="sN" x="583" y="110" width="17" height="13" rx="2"/>
<rect class="sN" x="602" y="110" width="17" height="13" rx="2"/>
<rect class="sN" x="621" y="110" width="17" height="13" rx="2"/>
<rect class="sN" x="640" y="110" width="17" height="13" rx="2"/>
<rect class="sR" x="70" y="125" width="17" height="13" rx="2"/>
<rect class="sR" x="89" y="125" width="17" height="13" rx="2"/>
<rect class="sR" x="108" y="125" width="17" height="13" rx="2"/>
<rect class="sR" x="127" y="125" width="17" height="13" rx="2"/>
<rect class="sR" x="146" y="125" width="17" height="13" rx="2"/>
<rect class="sG" x="165" y="125" width="17" height="13" rx="2"/>
<rect class="sR" x="184" y="125" width="17" height="13" rx="2"/>
<rect class="sR" x="203" y="125" width="17" height="13" rx="2"/>
<rect class="sR" x="222" y="125" width="17" height="13" rx="2"/>
<rect class="sR" x="241" y="125" width="17" height="13" rx="2"/>
<rect class="sR" x="260" y="125" width="17" height="13" rx="2"/>
<rect class="sR" x="279" y="125" width="17" height="13" rx="2"/>
<rect class="sN" x="298" y="125" width="17" height="13" rx="2"/>
<rect class="sN" x="317" y="125" width="17" height="13" rx="2"/>
<rect class="sN" x="336" y="125" width="17" height="13" rx="2"/>
<rect class="sN" x="355" y="125" width="17" height="13" rx="2"/>
<rect class="sN" x="374" y="125" width="17" height="13" rx="2"/>
<rect class="sN" x="393" y="125" width="17" height="13" rx="2"/>
<rect class="sN" x="412" y="125" width="17" height="13" rx="2"/>
<rect class="sN" x="431" y="125" width="17" height="13" rx="2"/>
<rect class="sN" x="450" y="125" width="17" height="13" rx="2"/>
<rect class="sN" x="469" y="125" width="17" height="13" rx="2"/>
<rect class="sN" x="488" y="125" width="17" height="13" rx="2"/>
<rect class="sN" x="507" y="125" width="17" height="13" rx="2"/>
<rect class="sN" x="526" y="125" width="17" height="13" rx="2"/>
<rect class="sN" x="545" y="125" width="17" height="13" rx="2"/>
<rect class="sN" x="564" y="125" width="17" height="13" rx="2"/>
<rect class="sN" x="583" y="125" width="17" height="13" rx="2"/>
<rect class="sN" x="602" y="125" width="17" height="13" rx="2"/>
<rect class="sN" x="621" y="125" width="17" height="13" rx="2"/>
<rect class="sR" x="70" y="140" width="17" height="13" rx="2"/>
<rect class="sR" x="89" y="140" width="17" height="13" rx="2"/>
<rect class="sR" x="108" y="140" width="17" height="13" rx="2"/>
<rect class="sR" x="127" y="140" width="17" height="13" rx="2"/>
<rect class="sR" x="146" y="140" width="17" height="13" rx="2"/>
<rect class="sR" x="165" y="140" width="17" height="13" rx="2"/>
<rect class="sG" x="184" y="140" width="17" height="13" rx="2"/>
<rect class="sR" x="203" y="140" width="17" height="13" rx="2"/>
<rect class="sR" x="222" y="140" width="17" height="13" rx="2"/>
<rect class="sR" x="241" y="140" width="17" height="13" rx="2"/>
<rect class="sR" x="260" y="140" width="17" height="13" rx="2"/>
<rect class="sR" x="279" y="140" width="17" height="13" rx="2"/>
<rect class="sN" x="298" y="140" width="17" height="13" rx="2"/>
<rect class="sN" x="317" y="140" width="17" height="13" rx="2"/>
<rect class="sN" x="336" y="140" width="17" height="13" rx="2"/>
<rect class="sN" x="355" y="140" width="17" height="13" rx="2"/>
<rect class="sN" x="374" y="140" width="17" height="13" rx="2"/>
<rect class="sN" x="393" y="140" width="17" height="13" rx="2"/>
<rect class="sN" x="412" y="140" width="17" height="13" rx="2"/>
<rect class="sN" x="431" y="140" width="17" height="13" rx="2"/>
<rect class="sN" x="450" y="140" width="17" height="13" rx="2"/>
<rect class="sN" x="469" y="140" width="17" height="13" rx="2"/>
<rect class="sN" x="488" y="140" width="17" height="13" rx="2"/>
<rect class="sN" x="507" y="140" width="17" height="13" rx="2"/>
<rect class="sN" x="526" y="140" width="17" height="13" rx="2"/>
<rect class="sN" x="545" y="140" width="17" height="13" rx="2"/>
<rect class="sN" x="564" y="140" width="17" height="13" rx="2"/>
<rect class="sN" x="583" y="140" width="17" height="13" rx="2"/>
<rect class="sN" x="602" y="140" width="17" height="13" rx="2"/>
<rect class="sN" x="621" y="140" width="17" height="13" rx="2"/>
<rect class="sN" x="640" y="140" width="17" height="13" rx="2"/>
<rect class="sR" x="70" y="155" width="17" height="13" rx="2"/>
<rect class="sR" x="89" y="155" width="17" height="13" rx="2"/>
<rect class="sR" x="108" y="155" width="17" height="13" rx="2"/>
<rect class="sR" x="127" y="155" width="17" height="13" rx="2"/>
<rect class="sR" x="146" y="155" width="17" height="13" rx="2"/>
<rect class="sR" x="165" y="155" width="17" height="13" rx="2"/>
<rect class="sR" x="184" y="155" width="17" height="13" rx="2"/>
<rect class="sG" x="203" y="155" width="17" height="13" rx="2"/>
<rect class="sR" x="222" y="155" width="17" height="13" rx="2"/>
<rect class="sR" x="241" y="155" width="17" height="13" rx="2"/>
<rect class="sR" x="260" y="155" width="17" height="13" rx="2"/>
<rect class="sR" x="279" y="155" width="17" height="13" rx="2"/>
<rect class="sN" x="298" y="155" width="17" height="13" rx="2"/>
<rect class="sN" x="317" y="155" width="17" height="13" rx="2"/>
<rect class="sN" x="336" y="155" width="17" height="13" rx="2"/>
<rect class="sN" x="355" y="155" width="17" height="13" rx="2"/>
<rect class="sN" x="374" y="155" width="17" height="13" rx="2"/>
<rect class="sN" x="393" y="155" width="17" height="13" rx="2"/>
<rect class="sN" x="412" y="155" width="17" height="13" rx="2"/>
<rect class="sN" x="431" y="155" width="17" height="13" rx="2"/>
<rect class="sN" x="450" y="155" width="17" height="13" rx="2"/>
<rect class="sN" x="469" y="155" width="17" height="13" rx="2"/>
<rect class="sN" x="488" y="155" width="17" height="13" rx="2"/>
<rect class="sN" x="507" y="155" width="17" height="13" rx="2"/>
<rect class="sN" x="526" y="155" width="17" height="13" rx="2"/>
<rect class="sN" x="545" y="155" width="17" height="13" rx="2"/>
<rect class="sN" x="564" y="155" width="17" height="13" rx="2"/>
<rect class="sN" x="583" y="155" width="17" height="13" rx="2"/>
<rect class="sN" x="602" y="155" width="17" height="13" rx="2"/>
<rect class="sN" x="621" y="155" width="17" height="13" rx="2"/>
<rect class="sN" x="640" y="155" width="17" height="13" rx="2"/>
<rect class="sR" x="70" y="170" width="17" height="13" rx="2"/>
<rect class="sR" x="89" y="170" width="17" height="13" rx="2"/>
<rect class="sR" x="108" y="170" width="17" height="13" rx="2"/>
<rect class="sR" x="127" y="170" width="17" height="13" rx="2"/>
<rect class="sR" x="146" y="170" width="17" height="13" rx="2"/>
<rect class="sR" x="165" y="170" width="17" height="13" rx="2"/>
<rect class="sR" x="184" y="170" width="17" height="13" rx="2"/>
<rect class="sR" x="203" y="170" width="17" height="13" rx="2"/>
<rect class="sG" x="222" y="170" width="17" height="13" rx="2"/>
<rect class="sR" x="241" y="170" width="17" height="13" rx="2"/>
<rect class="sR" x="260" y="170" width="17" height="13" rx="2"/>
<rect class="sR" x="279" y="170" width="17" height="13" rx="2"/>
<rect class="sN" x="298" y="170" width="17" height="13" rx="2"/>
<rect class="sN" x="317" y="170" width="17" height="13" rx="2"/>
<rect class="sN" x="336" y="170" width="17" height="13" rx="2"/>
<rect class="sN" x="355" y="170" width="17" height="13" rx="2"/>
<rect class="sN" x="374" y="170" width="17" height="13" rx="2"/>
<rect class="sN" x="393" y="170" width="17" height="13" rx="2"/>
<rect class="sN" x="412" y="170" width="17" height="13" rx="2"/>
<rect class="sN" x="431" y="170" width="17" height="13" rx="2"/>
<rect class="sN" x="450" y="170" width="17" height="13" rx="2"/>
<rect class="sN" x="469" y="170" width="17" height="13" rx="2"/>
<rect class="sN" x="488" y="170" width="17" height="13" rx="2"/>
<rect class="sN" x="507" y="170" width="17" height="13" rx="2"/>
<rect class="sN" x="526" y="170" width="17" height="13" rx="2"/>
<rect class="sN" x="545" y="170" width="17" height="13" rx="2"/>
<rect class="sN" x="564" y="170" width="17" height="13" rx="2"/>
<rect class="sN" x="583" y="170" width="17" height="13" rx="2"/>
<rect class="sN" x="602" y="170" width="17" height="13" rx="2"/>
<rect class="sN" x="621" y="170" width="17" height="13" rx="2"/>
<rect class="sR" x="70" y="185" width="17" height="13" rx="2"/>
<rect class="sR" x="89" y="185" width="17" height="13" rx="2"/>
<rect class="sR" x="108" y="185" width="17" height="13" rx="2"/>
<rect class="sR" x="127" y="185" width="17" height="13" rx="2"/>
<rect class="sR" x="146" y="185" width="17" height="13" rx="2"/>
<rect class="sR" x="165" y="185" width="17" height="13" rx="2"/>
<rect class="sR" x="184" y="185" width="17" height="13" rx="2"/>
<rect class="sR" x="203" y="185" width="17" height="13" rx="2"/>
<rect class="sR" x="222" y="185" width="17" height="13" rx="2"/>
<rect class="sG" x="241" y="185" width="17" height="13" rx="2"/>
<rect class="sR" x="260" y="185" width="17" height="13" rx="2"/>
<rect class="sR" x="279" y="185" width="17" height="13" rx="2"/>
<rect class="sN" x="298" y="185" width="17" height="13" rx="2"/>
<rect class="sN" x="317" y="185" width="17" height="13" rx="2"/>
<rect class="sN" x="336" y="185" width="17" height="13" rx="2"/>
<rect class="sN" x="355" y="185" width="17" height="13" rx="2"/>
<rect class="sN" x="374" y="185" width="17" height="13" rx="2"/>
<rect class="sN" x="393" y="185" width="17" height="13" rx="2"/>
<rect class="sN" x="412" y="185" width="17" height="13" rx="2"/>
<rect class="sN" x="431" y="185" width="17" height="13" rx="2"/>
<rect class="sN" x="450" y="185" width="17" height="13" rx="2"/>
<rect class="sN" x="469" y="185" width="17" height="13" rx="2"/>
<rect class="sN" x="488" y="185" width="17" height="13" rx="2"/>
<rect class="sN" x="507" y="185" width="17" height="13" rx="2"/>
<rect class="sN" x="526" y="185" width="17" height="13" rx="2"/>
<rect class="sN" x="545" y="185" width="17" height="13" rx="2"/>
<rect class="sN" x="564" y="185" width="17" height="13" rx="2"/>
<rect class="sN" x="583" y="185" width="17" height="13" rx="2"/>
<rect class="sN" x="602" y="185" width="17" height="13" rx="2"/>
<rect class="sN" x="621" y="185" width="17" height="13" rx="2"/>
<rect class="sN" x="640" y="185" width="17" height="13" rx="2"/>
<rect class="sR" x="70" y="200" width="17" height="13" rx="2"/>
<rect class="sR" x="89" y="200" width="17" height="13" rx="2"/>
<rect class="sR" x="108" y="200" width="17" height="13" rx="2"/>
<rect class="sR" x="127" y="200" width="17" height="13" rx="2"/>
<rect class="sR" x="146" y="200" width="17" height="13" rx="2"/>
<rect class="sR" x="165" y="200" width="17" height="13" rx="2"/>
<rect class="sR" x="184" y="200" width="17" height="13" rx="2"/>
<rect class="sR" x="203" y="200" width="17" height="13" rx="2"/>
<rect class="sR" x="222" y="200" width="17" height="13" rx="2"/>
<rect class="sR" x="241" y="200" width="17" height="13" rx="2"/>
<rect class="sG" x="260" y="200" width="17" height="13" rx="2"/>
<rect class="sR" x="279" y="200" width="17" height="13" rx="2"/>
<rect class="sN" x="298" y="200" width="17" height="13" rx="2"/>
<rect class="sN" x="317" y="200" width="17" height="13" rx="2"/>
<rect class="sN" x="336" y="200" width="17" height="13" rx="2"/>
<rect class="sN" x="355" y="200" width="17" height="13" rx="2"/>
<rect class="sN" x="374" y="200" width="17" height="13" rx="2"/>
<rect class="sN" x="393" y="200" width="17" height="13" rx="2"/>
<rect class="sN" x="412" y="200" width="17" height="13" rx="2"/>
<rect class="sN" x="431" y="200" width="17" height="13" rx="2"/>
<rect class="sN" x="450" y="200" width="17" height="13" rx="2"/>
<rect class="sN" x="469" y="200" width="17" height="13" rx="2"/>
<rect class="sN" x="488" y="200" width="17" height="13" rx="2"/>
<rect class="sN" x="507" y="200" width="17" height="13" rx="2"/>
<rect class="sN" x="526" y="200" width="17" height="13" rx="2"/>
<rect class="sN" x="545" y="200" width="17" height="13" rx="2"/>
<rect class="sN" x="564" y="200" width="17" height="13" rx="2"/>
<rect class="sN" x="583" y="200" width="17" height="13" rx="2"/>
<rect class="sN" x="602" y="200" width="17" height="13" rx="2"/>
<rect class="sN" x="621" y="200" width="17" height="13" rx="2"/>
<rect class="sR" x="70" y="215" width="17" height="13" rx="2"/>
<rect class="sR" x="89" y="215" width="17" height="13" rx="2"/>
<rect class="sR" x="108" y="215" width="17" height="13" rx="2"/>
<rect class="sR" x="127" y="215" width="17" height="13" rx="2"/>
<rect class="sR" x="146" y="215" width="17" height="13" rx="2"/>
<rect class="sR" x="165" y="215" width="17" height="13" rx="2"/>
<rect class="sR" x="184" y="215" width="17" height="13" rx="2"/>
<rect class="sR" x="203" y="215" width="17" height="13" rx="2"/>
<rect class="sR" x="222" y="215" width="17" height="13" rx="2"/>
<rect class="sR" x="241" y="215" width="17" height="13" rx="2"/>
<rect class="sR" x="260" y="215" width="17" height="13" rx="2"/>
<rect class="sG" x="279" y="215" width="17" height="13" rx="2"/>
<rect class="sN" x="298" y="215" width="17" height="13" rx="2"/>
<rect class="sN" x="317" y="215" width="17" height="13" rx="2"/>
<rect class="sN" x="336" y="215" width="17" height="13" rx="2"/>
<rect class="sN" x="355" y="215" width="17" height="13" rx="2"/>
<rect class="sN" x="374" y="215" width="17" height="13" rx="2"/>
<rect class="sN" x="393" y="215" width="17" height="13" rx="2"/>
<rect class="sN" x="412" y="215" width="17" height="13" rx="2"/>
<rect class="sN" x="431" y="215" width="17" height="13" rx="2"/>
<rect class="sN" x="450" y="215" width="17" height="13" rx="2"/>
<rect class="sN" x="469" y="215" width="17" height="13" rx="2"/>
<rect class="sN" x="488" y="215" width="17" height="13" rx="2"/>
<rect class="sN" x="507" y="215" width="17" height="13" rx="2"/>
<rect class="sN" x="526" y="215" width="17" height="13" rx="2"/>
<rect class="sN" x="545" y="215" width="17" height="13" rx="2"/>
<rect class="sN" x="564" y="215" width="17" height="13" rx="2"/>
<rect class="sN" x="583" y="215" width="17" height="13" rx="2"/>
<rect class="sN" x="602" y="215" width="17" height="13" rx="2"/>
<rect class="sN" x="621" y="215" width="17" height="13" rx="2"/>
<rect class="sN" x="640" y="215" width="17" height="13" rx="2"/>
<text class="sS" x="64" y="60" text-anchor="end">Jan</text>
<text class="sS" x="64" y="75" text-anchor="end">Feb</text>
<text class="sS" x="64" y="90" text-anchor="end">Mar</text>
<text class="sS" x="64" y="105" text-anchor="end">Apr</text>
<text class="sS" x="64" y="120" text-anchor="end">May</text>
<text class="sS" x="64" y="135" text-anchor="end">Jun</text>
<text class="sS" x="64" y="150" text-anchor="end">Jul</text>
<text class="sS" x="64" y="165" text-anchor="end">Aug</text>
<text class="sS" x="64" y="180" text-anchor="end">Sep</text>
<text class="sS" x="64" y="195" text-anchor="end">Oct</text>
<text class="sS" x="64" y="210" text-anchor="end">Nov</text>
<text class="sS" x="64" y="225" text-anchor="end">Dec</text>
<text class="sS" x="78" y="44" text-anchor="middle">1</text>
<text class="sS" x="154" y="44" text-anchor="middle">5</text>
<text class="sS" x="249" y="44" text-anchor="middle">10</text>
<text class="sS" x="287" y="44" text-anchor="middle">12</text>
<text class="sS" x="344" y="44" text-anchor="middle">15</text>
<text class="sS" x="439" y="44" text-anchor="middle">20</text>
<text class="sS" x="534" y="44" text-anchor="middle">25</text>
<text class="sS" x="648" y="44" text-anchor="middle">31</text>
<line class="sLr" x1="297" y1="48" x2="297" y2="230" stroke-dasharray="4 3"/>
<text class="sM" x="14" y="16">every 2025 date: red ones read differently day-first vs month-first (132 of 365, 36%)</text>
<text class="sRt" x="184" y="248" text-anchor="middle">day ≤ 12: ambiguous</text><text class="sC" x="469" y="248" text-anchor="middle">day &gt; 12: only one reading parses</text>
<text class="sS" x="360" y="270" text-anchor="middle">green diagonal (1 Jan, 2 Feb, …) reads the same both ways; '03/04/2025' is 3 April with dayfirst=True, 4 March without</text>
</svg><figcaption>Why dayfirst matters: more than a third of all dates are silently ambiguous, and nothing errors. Computed.</figcaption></figure>

**`astype('category')`** is a real optimisation, not a formality. A category column stores integer codes plus one dictionary of levels. On a column with 1,000,000 rows and 5 distinct values, this can cut memory by an order of magnitude. The Supermarket notebook applies it systematically:

<figure class="dia"><svg viewBox="0 0 720 222" role="img" aria-label="A million-row column of five city names: stored as object it holds one Python string per row and takes about 55 megabytes; as category it holds one-byte codes plus five levels and takes about 1 megabyte">
<text class="sM" x="14" y="22">1,000,000 rows, 5 cities: memory_usage(deep=True)</text>
<text class="sT" x="14" y="56">object</text><text class="sS" x="14" y="72">one Python str per row</text>
<rect class="sN" x="170" y="42" width="68" height="26" rx="4"/><text class="sC" x="204" y="59" text-anchor="middle">'Cairo'</text>
<rect class="sN" x="244" y="42" width="68" height="26" rx="4"/><text class="sC" x="278" y="59" text-anchor="middle">'Giza'</text>
<rect class="sN" x="318" y="42" width="68" height="26" rx="4"/><text class="sC" x="352" y="59" text-anchor="middle">'Cairo'</text>
<rect class="sN" x="392" y="42" width="68" height="26" rx="4"/><text class="sC" x="426" y="59" text-anchor="middle">'Aswan'</text>
<rect class="sN" x="466" y="42" width="68" height="26" rx="4"/><text class="sC" x="500" y="59" text-anchor="middle">'Giza'</text>
<text class="sT" x="546" y="59" text-anchor="middle">…</text><text class="sRt" x="706" y="60" text-anchor="end">55.4 MB</text>
<text class="sT" x="14" y="126">category</text><text class="sS" x="14" y="142">int8 codes + 5 levels</text>
<rect class="sG" x="170" y="112" width="68" height="26" rx="4"/><text class="sC" x="204" y="129" text-anchor="middle">0</text>
<rect class="sG" x="244" y="112" width="68" height="26" rx="4"/><text class="sC" x="278" y="129" text-anchor="middle">2</text>
<rect class="sG" x="318" y="112" width="68" height="26" rx="4"/><text class="sC" x="352" y="129" text-anchor="middle">0</text>
<rect class="sG" x="392" y="112" width="68" height="26" rx="4"/><text class="sC" x="426" y="129" text-anchor="middle">4</text>
<rect class="sG" x="466" y="112" width="68" height="26" rx="4"/><text class="sC" x="500" y="129" text-anchor="middle">2</text>
<text class="sT" x="546" y="129" text-anchor="middle">…</text><text class="sGt" x="706" y="130" text-anchor="end">1.0 MB</text>
<rect class="sB" x="170" y="160" width="76" height="24" rx="4"/><text class="sS" x="208" y="176" text-anchor="middle">0: Alexandria</text>
<rect class="sB" x="250" y="160" width="76" height="24" rx="4"/><text class="sS" x="288" y="176" text-anchor="middle">1: Aswan</text>
<rect class="sB" x="330" y="160" width="76" height="24" rx="4"/><text class="sS" x="368" y="176" text-anchor="middle">2: Cairo</text>
<rect class="sB" x="410" y="160" width="76" height="24" rx="4"/><text class="sS" x="448" y="176" text-anchor="middle">3: Giza</text>
<rect class="sB" x="490" y="160" width="76" height="24" rx="4"/><text class="sS" x="528" y="176" text-anchor="middle">4: Mansoura</text>
<text class="sC" x="578" y="176">← stored once</text>
<text class="sGt" x="360" y="210" text-anchor="middle">55× smaller, and group-bys and comparisons run on small integers</text>
</svg><figcaption>astype("category") is a real optimisation: integer codes per row, the text stored once. Measured with pandas.</figcaption></figure>

```python
conv_to_cat = [col for col in obj_cols if df[col].nunique(dropna=True) <= 20]
for c in conv_to_cat:
    df[c] = df[c].astype('category')
```

"Fewer than 20 distinct values → make it a category" is a good default rule.

### The `.dt` accessor

Once a column is datetime, `.dt` unlocks its components:

```python
df1['year'] = df1.dates.dt.year
df1.dates.dt.month
df1.dates.dt.day
df1.dates.dt.hour / .minute / .second
df1.dates.dt.date
df1.dates.dt.day_name()          # 'Monday', ...
df1.dates.dt.weekday             # 0 = Monday
df1.dates.dt.floor('D')          # truncate to day
df1.dates.dt.ceil('H')           # round up to hour
df['Week_Number'] = df['Activation_Date'].dt.isocalendar().week
```

This is **feature engineering**, not just formatting. A raw timestamp is nearly useless to a model — it is a huge, monotonic number that never repeats. But `hour`, `dayofweek` and `is_weekend` capture the actual behavioural cycles. Both the Advertising notebook (Part 8) and the Road Accidents capstone (Part 13) do exactly this, and in the capstone `hour` ends up among the two most important features in the model.

### Date arithmetic and ranges

```python
df['expiry_Date'] = df['Activation_Date'] + pd.to_timedelta(df['Expiry_Days'], unit='D')

pd.date_range(start='2025-12-14', end='2025-12-18', freq='D')       # daily
pd.date_range(start='2025-12-14', periods=7, freq='D')
pd.date_range(start='2025-12-01', end='2025-12-31', freq='W')       # weekly
pd.date_range(start='2025-12-01', end='2025-12-31', freq='B',
              tz='Africa/Cairo')                                    # business days, tz-aware
```

Frequency aliases: `D` day, `B` business day, `W` week, `M` month end, `MS` month start, `H` hour, `T`/`min` minute. `tz=` makes the timestamps timezone-aware, which matters the moment you compare across regions.

---

## 3.7 Reading and writing data 🟢

```python
df = pd.read_csv('example.csv', sep=',', encoding='utf-8')

df_tsv  = pd.read_csv('data/Restaurant_Reviews.tsv', sep='\t', encoding='utf-8')
df_spam = pd.read_csv('data/spam_dataset.csv', sep='\t', names=['status', 'msg'])

df_excel = pd.read_excel('data/Excel_Sample.xlsx')
df_excel.drop('Unnamed: 0', axis=1, inplace=True)

df.to_csv('example_final.csv', index=False)
df.to_excel('output.xlsx')
pd.read_json('file.json')
```

The parameters worth knowing before you need them:

| Parameter | Why |
|---|---|
| `sep` | `,` CSV, `\t` TSV, `;` common in European exports and used by the `wiki4HE.csv` file in Part 4 |
| `encoding` | `utf-8` default; `latin-1` or `cp1256` for older Arabic/Windows exports |
| `names=[...]` | Supply headers when the file has none |
| `header=None` | Tell Pandas row 0 is data, not a header |
| `na_values=['?', ' ', 'xxx']` | Declare the sentinels *this* file uses for missing |
| `index_col=0` | Fixes the `Unnamed: 0` column that appears when someone saved with `index=True` |
| `nrows=1000` | Peek at a huge file before committing |
| `usecols=[...]` | Read only the columns you need |
| `parse_dates=['col']` | Parse at read time |
| `chunksize=100_000` | Iterate over a file too large for memory |

**`na_values` deserves emphasis.** The Part 4 notebook demonstrates it as a two-step discovery: read normally, notice that everything is `object` dtype, realise the file uses `'?'` for missing, re-read with `na_values=['N/A','no','?']`, and watch the dtypes become numeric. That is the actual workflow.

**`to_csv(index=False)`** — the missing `index=False` is what produced the `Unnamed: 0` column in the Excel file above. Always pass it unless the index is meaningful.

<figure class="dia"><svg viewBox="0 0 720 240" role="img" aria-label="Half a million orders saved as CSV and as Parquet: the Parquet file is several times smaller, reads faster, reads a single column much faster, and keeps the date column typed, while CSV returns it as text">
<text class="sM" x="14" y="22">500,000 orders × 4 columns, measured on this machine</text>
<text class="sT" x="150" y="62" text-anchor="end">file size</text>
<rect class="sW" x="160" y="40" width="360" height="16" rx="3" opacity=".75"/><text class="sC" x="526" y="53">CSV 16.3 MB</text>
<rect class="sG" x="160" y="60" width="98.0348" height="16" rx="3" opacity=".75"/><text class="sC" x="264.035" y="73">Parquet 4.4 MB</text>
<text class="sT" x="150" y="114" text-anchor="end">read all columns</text>
<rect class="sW" x="160" y="92" width="360" height="16" rx="3" opacity=".75"/><text class="sC" x="526" y="105">CSV 142 ms</text>
<rect class="sG" x="160" y="112" width="25.9586" height="16" rx="3" opacity=".75"/><text class="sC" x="191.959" y="125">Parquet 10 ms</text>
<text class="sT" x="150" y="166" text-anchor="end">read one column</text>
<rect class="sW" x="160" y="144" width="360" height="16" rx="3" opacity=".75"/><text class="sC" x="526" y="157">CSV 88 ms</text>
<rect class="sG" x="160" y="164" width="21.3957" height="16" rx="3" opacity=".75"/><text class="sC" x="187.396" y="177">Parquet 5 ms</text>
<text class="sC" x="160" y="206">order_date comes back as: CSV → object, Parquet → datetime64[ns]</text>
<text class="sS" x="360" y="228" text-anchor="middle">Parquet is columnar, compressed and typed: smaller files, column pruning, and dtypes that survive the round trip</text>
</svg><figcaption>CSV vs Parquet on the same DataFrame, measured with pandas and pyarrow. Exact numbers vary by machine.</figcaption></figure>

### SQL

```python
import sqlalchemy
import mysql.connector
import sqlite3

pd.read_sql('select * from customers', db_conn)
```

(The notebook has a typo — `pr.read_sql` — it is `pd.read_sql`.)

This is your shortest path from your existing SQL Server work to Pandas: query the database, get a DataFrame. `pd.read_sql`, `pd.read_sql_query` and `pd.read_sql_table` all take a SQLAlchemy connection or engine. See Part 12.

---

## 3.8 Sorting 🟢

```python
df.sort_values(by='col2')                              # ascending, returns a copy
df.sort_values(by='col2', ascending=False)
df.sort_values(by='col2', ascending=False, inplace=True)

df.sort_values('Monthly_Usage_MB', ascending=False)
df.sort_values(['Bundle', 'Monthly_Usage_MB'], ascending=[True, False])
```

Multi-column sort takes a list of columns and a matching list of directions — `ORDER BY Bundle ASC, Monthly_Usage_MB DESC`.

`sort_index()` sorts by the index instead. And after any operation that drops rows, `df.reset_index(drop=True, inplace=True)` renumbers 0..n-1; `drop=True` throws the old index away rather than making it a column.

---

## 3.9 Duplicates and missing values (preview of Part 4) 🟢 ⭐

```python
df.drop_duplicates()                       # exact duplicate ROWS
df.drop_duplicates(subset=['Bundle'])      # duplicates considering only these columns
df.duplicated().sum()                      # how many
df[df.duplicated(keep=False)]              # SHOW them — keep=False marks all copies

df.isna()                                  # boolean frame
df.isna().sum()                            # count per column — the standard check
df.dropna()                                # drop rows with ANY na
df.dropna(how='all')                       # drop rows where ALL values are na
df.fillna(0)
df.fillna(df.Monthly_Usage_MB.median())
```

`keep=False` in `duplicated` is the useful variant: the default marks only the second and later occurrences, so you never see what they duplicate. `keep=False` marks every member of each duplicate group.

The notebook also demonstrates **conditional imputation**, which is a better instinct than a global median:

```python
monthly_imputing = df[(df.Bundle == 'Social') & (df.Monthly_Usage_MB.notna())]
monthly_imputing.Monthly_Usage_MB.median()
```

"Fill a Social customer's missing usage with the median of *other Social customers*" respects group structure. Full treatment in Part 4.

---

## 3.10 `apply` — running your own function over data 🟡

### One column in, one column out

```python
df['radius'] = df['col1'] + 20

def area_of_circle(r):
    return 3.14 * (r ** 2)

df['area'] = df['radius'].apply(area_of_circle)
df['area_lambda'] = df['radius'].apply(lambda r: 3.14 * (r ** 2))

df['col3'].apply(len)          # built-ins work too
df['col2'].apply(lambda x: x ** 2)
```

### One column in, several out

```python
def make_multi_columns(value):
    return pd.Series((value + 50, value - 100))

df[['Col_New_1', 'Col_New_2']] = df['radius'].apply(make_multi_columns)
```

Returning a Series from the function makes Pandas expand it into columns.

### Several columns in, several out — note `axis=1`

```python
def apply_multi_columns_make_multi_columns(x):
    return pd.Series((x['area'] / x['radius'], x['radius'] + x['area']))

df[['Col_New_3', 'Col_New_4']] = df.apply(apply_multi_columns_make_multi_columns, axis=1)
```

**`axis=1` means "give my function one row at a time"**, with the row arriving as a Series you index by column name. `axis=0` (the default) passes whole columns.

⚠️ **The performance caveat the course omits.** `df.apply` is a Python-level loop in disguise. It is 10–100× slower than a vectorised alternative. For the toy frames here it does not matter; on a million rows it does.

```python
df['area'] = df['radius'].apply(lambda r: 3.14 * r**2)   # slow
df['area'] = 3.14 * df['radius'] ** 2                    # fast — vectorised
```

<figure class="dia"><svg viewBox="0 0 720 230" role="img" aria-label="Timing the same calculation on 200,000 rows: vectorised arithmetic took 0.8 milliseconds, Series.apply with a lambda about 34 times longer, and DataFrame.apply with axis=1 about 565 times longer">
<text class="sM" x="14" y="22">the same area column on 200,000 rows, timed on this machine (best of 3)</text>
<text class="sS" x="14" y="54" xml:space="preserve" style="white-space:pre">3.14 * df["radius"] ** 2</text>
<rect class="sG" x="14" y="60" width="111.933" height="18" rx="3" opacity=".75"/><text class="sT" x="131.933" y="74">0.8 ms</text>
<text class="sS" x="14" y="110" xml:space="preserve" style="white-space:pre">df["radius"].apply(lambda r: 3.14 * r**2)</text>
<rect class="sW" x="14" y="116" width="283.46" height="18" rx="3" opacity=".75"/><text class="sT" x="303.46" y="130">28.5 ms   (34× slower)</text>
<text class="sS" x="14" y="166" xml:space="preserve" style="white-space:pre">df.apply(lambda row: 3.14 * row["radius"]**2, axis=1)</text>
<rect class="sR" x="14" y="172" width="420" height="18" rx="3" opacity=".75"/><text class="sT" x="440" y="186">472.6 ms   (565× slower)</text>
<text class="sS" x="360" y="218" text-anchor="middle">bars on a log scale; apply calls a Python function per value, axis=1 also builds a Series per row</text>
</svg><figcaption>Why apply is a last resort: measured with timeit on 200,000 rows. Exact numbers vary by machine; the ratios do not.</figcaption></figure>

**Reach for `apply` only when there is no vectorised form** — genuinely irregular string parsing, or row-wise logic that cannot be expressed as column arithmetic. Before writing `apply`, check for:

- `.str` accessor: `.str.lower()`, `.str.contains()`, `.str.split()`, `.str.replace()`
- `.dt` accessor (§3.6)
- `np.where(cond, a, b)` for two-branch logic
- `.map(dict)` for lookups
- `pd.cut` / `pd.qcut` for binning

The capstone's `is_dark` feature is a good example of doing it right:

```python
df["is_dark"] = df["Lighting Conditions"].astype(str) \
                  .str.contains("Darkness", case=False, na=False).astype(int)
```

Vectorised `.str.contains`, no `apply` in sight.

---

## 3.11 `groupby` — split, apply, combine 🟢 ⭐

![Split → apply → combine: the same idea as SQL `GROUP BY`.](figures/fig03_groupby.png)
*Split → apply → combine: the same idea as SQL `GROUP BY`.*

> [!quote] 💬 Say it in the interview
> “`groupby` is split–apply–combine, the same as SQL `GROUP BY`. `agg` gives one row per group; `transform` keeps the original shape, which is how I build per-customer features.”

```python
df.groupby('Company')[['Sales', 'Calls']].mean()
df.groupby('Company')[['Sales', 'Calls']].std()
df.groupby('Company')[['Sales', 'Calls']].min()
df.groupby('Company')[['Sales', 'Calls']].max()
df.groupby('Company')[['Sales', 'Calls']].sum()
df.groupby('Company').count()
df.groupby('Company').describe()
df.groupby('Company').describe().transpose()
df.groupby('Company').describe().transpose()['GOOG']
```

**This is `GROUP BY`.** `df.groupby('Company')['Sales'].mean()` is `SELECT Company, AVG(Sales) FROM df GROUP BY Company`.

The mental model is Hadley Wickham's **split–apply–combine**:

1. **Split** the frame into groups by the key.
2. **Apply** an aggregation to each group independently.
3. **Combine** the results into a new frame, indexed by the group key.

`groupby('Company')` on its own returns a lazy `GroupBy` object — nothing is computed until you aggregate. Selecting columns before aggregating (`.groupby('Company')[['Sales','Calls']]`) avoids computing statistics for columns you do not want, and avoids errors on text columns.

Beyond the basics you will want:

```python
df.groupby('Company').agg({'Sales': ['mean', 'max'], 'Calls': 'sum'})   # per-column aggs
df.groupby(['Company', 'Region'])['Sales'].sum()                        # multi-key
df.groupby('Company')['Sales'].transform('mean')  # broadcast group mean back to rows
```

`transform` is the one worth learning early: it returns a result **the same length as the original frame**, which is how you do group-wise imputation ("fill each row's missing value with its own group's median") in one line.

---

## 3.12 Combining DataFrames 🟢 ⭐

> [!quote] 💬 Say it in the interview
> “`merge` is SQL `JOIN`; `concat` stacks frames. Before and after a merge I check row counts, and I use `validate=` to catch duplicate keys that would fan out rows.”

Three operations that people conflate. The distinction is what they align on.

### `concat` — stacking

```python
pd.concat([df1, df2, df3])              # axis=0 default: stack ROWS
pd.concat([df1, df2, df3], axis=1)      # stack COLUMNS side by side
```

`concat` glues frames together. With `axis=0` it needs matching columns; with `axis=1` it aligns on the **index**. In the notebook's second example the three frames all share index `[0,1,2,3]`, which is why `axis=1` produces a clean 12-column table.

**SQL equivalent:** `axis=0` is `UNION ALL`.

### `merge` — SQL joins on a key

```python
pd.merge(left, right, how='inner', on='key')
pd.merge(left, right, how='inner', on=['key1', 'key2'])   # composite key
pd.merge(left, right, how='outer', on=['key1', 'key2'])
pd.merge(left, right, how='right', on=['key1', 'key2'])
pd.merge(left, right, how='left',  on=['key1', 'key2'])
```

This *is* SQL `JOIN`, with the same four semantics:

| `how` | Keeps |
|---|---|
| `'inner'` (default) | Only keys present in **both** |
| `'left'` | All of left; NaN where right has no match |
| `'right'` | All of right |
| `'outer'` | Union of keys; NaN on both sides where unmatched |

<figure class="dia"><svg viewBox="0 0 720 204" role="img" aria-label="The four merge types on left keys k1 to k3 and right keys k2 to k4: inner keeps k2 and k3, left keeps k1 to k3, right keeps k2 to k4, outer keeps all four with NaN where a side has no match">
<text class="sM" x="94" y="22" text-anchor="middle">how='inner'</text>
<rect class="sN" x="14" y="34" width="50" height="24" rx="0"/><text class="sT" x="39" y="51" text-anchor="middle">k2</text>
<rect class="sB" x="64" y="34" width="50" height="24" rx="0" opacity=".55"/><text class="sC" x="89" y="51" text-anchor="middle">B</text>
<rect class="sV" x="114" y="34" width="50" height="24" rx="0" opacity=".55"/><text class="sC" x="139" y="51" text-anchor="middle">x</text>
<rect class="sN" x="14" y="62" width="50" height="24" rx="0"/><text class="sT" x="39" y="79" text-anchor="middle">k3</text>
<rect class="sB" x="64" y="62" width="50" height="24" rx="0" opacity=".55"/><text class="sC" x="89" y="79" text-anchor="middle">C</text>
<rect class="sV" x="114" y="62" width="50" height="24" rx="0" opacity=".55"/><text class="sC" x="139" y="79" text-anchor="middle">y</text>
<text class="sM" x="270" y="22" text-anchor="middle">how='left'</text>
<rect class="sN" x="190" y="34" width="50" height="24" rx="0"/><text class="sT" x="215" y="51" text-anchor="middle">k1</text>
<rect class="sB" x="240" y="34" width="50" height="24" rx="0" opacity=".55"/><text class="sC" x="265" y="51" text-anchor="middle">A</text>
<rect class="sR" x="290" y="34" width="50" height="24" rx="0" opacity=".55"/><text class="sC" x="315" y="51" text-anchor="middle">NaN</text>
<rect class="sN" x="190" y="62" width="50" height="24" rx="0"/><text class="sT" x="215" y="79" text-anchor="middle">k2</text>
<rect class="sB" x="240" y="62" width="50" height="24" rx="0" opacity=".55"/><text class="sC" x="265" y="79" text-anchor="middle">B</text>
<rect class="sV" x="290" y="62" width="50" height="24" rx="0" opacity=".55"/><text class="sC" x="315" y="79" text-anchor="middle">x</text>
<rect class="sN" x="190" y="90" width="50" height="24" rx="0"/><text class="sT" x="215" y="107" text-anchor="middle">k3</text>
<rect class="sB" x="240" y="90" width="50" height="24" rx="0" opacity=".55"/><text class="sC" x="265" y="107" text-anchor="middle">C</text>
<rect class="sV" x="290" y="90" width="50" height="24" rx="0" opacity=".55"/><text class="sC" x="315" y="107" text-anchor="middle">y</text>
<text class="sM" x="446" y="22" text-anchor="middle">how='right'</text>
<rect class="sN" x="366" y="34" width="50" height="24" rx="0"/><text class="sT" x="391" y="51" text-anchor="middle">k2</text>
<rect class="sB" x="416" y="34" width="50" height="24" rx="0" opacity=".55"/><text class="sC" x="441" y="51" text-anchor="middle">B</text>
<rect class="sV" x="466" y="34" width="50" height="24" rx="0" opacity=".55"/><text class="sC" x="491" y="51" text-anchor="middle">x</text>
<rect class="sN" x="366" y="62" width="50" height="24" rx="0"/><text class="sT" x="391" y="79" text-anchor="middle">k3</text>
<rect class="sB" x="416" y="62" width="50" height="24" rx="0" opacity=".55"/><text class="sC" x="441" y="79" text-anchor="middle">C</text>
<rect class="sV" x="466" y="62" width="50" height="24" rx="0" opacity=".55"/><text class="sC" x="491" y="79" text-anchor="middle">y</text>
<rect class="sN" x="366" y="90" width="50" height="24" rx="0"/><text class="sT" x="391" y="107" text-anchor="middle">k4</text>
<rect class="sR" x="416" y="90" width="50" height="24" rx="0" opacity=".55"/><text class="sC" x="441" y="107" text-anchor="middle">NaN</text>
<rect class="sV" x="466" y="90" width="50" height="24" rx="0" opacity=".55"/><text class="sC" x="491" y="107" text-anchor="middle">z</text>
<text class="sM" x="622" y="22" text-anchor="middle">how='outer'</text>
<rect class="sN" x="542" y="34" width="50" height="24" rx="0"/><text class="sT" x="567" y="51" text-anchor="middle">k1</text>
<rect class="sB" x="592" y="34" width="50" height="24" rx="0" opacity=".55"/><text class="sC" x="617" y="51" text-anchor="middle">A</text>
<rect class="sR" x="642" y="34" width="50" height="24" rx="0" opacity=".55"/><text class="sC" x="667" y="51" text-anchor="middle">NaN</text>
<rect class="sN" x="542" y="62" width="50" height="24" rx="0"/><text class="sT" x="567" y="79" text-anchor="middle">k2</text>
<rect class="sB" x="592" y="62" width="50" height="24" rx="0" opacity=".55"/><text class="sC" x="617" y="79" text-anchor="middle">B</text>
<rect class="sV" x="642" y="62" width="50" height="24" rx="0" opacity=".55"/><text class="sC" x="667" y="79" text-anchor="middle">x</text>
<rect class="sN" x="542" y="90" width="50" height="24" rx="0"/><text class="sT" x="567" y="107" text-anchor="middle">k3</text>
<rect class="sB" x="592" y="90" width="50" height="24" rx="0" opacity=".55"/><text class="sC" x="617" y="107" text-anchor="middle">C</text>
<rect class="sV" x="642" y="90" width="50" height="24" rx="0" opacity=".55"/><text class="sC" x="667" y="107" text-anchor="middle">y</text>
<rect class="sN" x="542" y="118" width="50" height="24" rx="0"/><text class="sT" x="567" y="135" text-anchor="middle">k4</text>
<rect class="sR" x="592" y="118" width="50" height="24" rx="0" opacity=".55"/><text class="sC" x="617" y="135" text-anchor="middle">NaN</text>
<rect class="sV" x="642" y="118" width="50" height="24" rx="0" opacity=".55"/><text class="sC" x="667" y="135" text-anchor="middle">z</text>
<text class="sC" x="360" y="170" text-anchor="middle">left keys k1 k2 k3 · right keys k2 k3 k4</text>
<text class="sS" x="360" y="192" text-anchor="middle">validate="one_to_one" and indicator=True catch surprises before they spread</text>
</svg><figcaption>merge is SQL JOIN: which keys survive, and where NaN fills the gaps.</figcaption></figure>

Two things to watch that the notebook does not raise:

- **Row multiplication.** If the key is not unique on either side, an inner join produces the Cartesian product within each key group. Two rows matching three rows gives six. Always check `len(result)` against expectation.
- **`validate='one_to_one'`** (or `'one_to_many'`, `'many_to_one'`) makes Pandas *assert* the cardinality you expect and raise if it is violated. This one keyword prevents a whole class of silent data corruption.
- **`indicator=True`** adds a `_merge` column recording whether each row came from left_only, right_only or both — invaluable for debugging a join that lost rows.

### `join` — merge on the index

```python
left.join(right, how='left')
left.join(right, how='outer')
left.join(right, how='inner')
```

`join` is `merge`'s convenience wrapper that defaults to matching on the **index** rather than a column. Everything else is the same. Use it when your frames are already indexed by the key.

### Pivot tables

```python
pd.pivot_table(df, 'Sales', 'Company', 'Person', aggfunc='sum')
pd.pivot_table(df, values='lifeExp', index=['country'], columns='year')
```

Signature: `pivot_table(data, values, index, columns, aggfunc)`. It reshapes long data into wide: one row per `index` value, one column per `columns` value, cells filled by applying `aggfunc` to `values`.

This is the Excel PivotTable, and it is also `GROUP BY` with the grouping split across two axes. Use keyword arguments — the positional order is easy to get wrong.

The related methods: `pivot` (no aggregation, errors on duplicates), `melt` (the inverse — wide back to long), `stack`/`unstack` (move levels between index and columns), and `pd.crosstab` (a frequency pivot table), which the capstone uses for its stacked severity bars:

```python
ctab = pd.crosstab(tmp[col], tmp[target_col], normalize="index")
```

`normalize="index"` makes each row sum to 1, turning counts into per-category proportions — which is the right way to compare severity rates across categories of very different sizes.

---

## 3.13 The profiling routine, assembled 🟢

Putting the whole part together, this is the sequence to run on any new dataset:

```python
df = pd.read_csv(path, na_values=['?', ' ', 'NA', ''])

df.shape                                  # how big
df.head(); df.sample(5)                   # what does it look like
df.info()                                 # dtypes + nulls + memory
df.describe().T                           # numeric summary (transposed reads better)
df.describe(include='O').T                # categorical summary
df.isna().mean().sort_values(ascending=False)   # missing RATE per column
df.duplicated().sum()                     # duplicate rows
for c in df.select_dtypes('object'):      # category levels — catches ' Dry' vs 'Dry'
    print(c, df[c].nunique(), df[c].unique()[:10])
```

The capstone formalises this into a `profile_dataframe()` function. Writing your own version of this and reusing it is one of the highest-return habits in the field.

---

> [!check] ✅ Key takeaways
> - A DataFrame is a labelled table; `loc` selects by label (inclusive end), `iloc` by position (exclusive end).
> - Filter with boolean masks, and assign with one `.loc[mask, col] = …` — never chained indexing.
> - `groupby` = SQL `GROUP BY`; `agg` gives one row per group, `transform` keeps the original shape.
> - `merge` = SQL `JOIN`; check row counts before and after to catch fan-out from duplicate keys.
> - Convert types early (`to_datetime`, `to_numeric(errors='coerce')`, `category`) and extract features from dates.
> - Prefer vectorised operations over `apply` for speed.

## ⚡ Interview quick-fire

Cover the right-hand column and answer out loud first.

| Question | Strong short answer |
|---|---|
| **`loc` vs `iloc`?** | `loc` selects by **label** (inclusive end), `iloc` by **integer position** (exclusive end). |
| **`agg` vs `transform`?** | `agg` returns one row per group; `transform` returns a result aligned to the original rows (e.g. each customer's share of the regional total). |
| **Top 3 customers by revenue in each region?** | `df.sort_values('rev', ascending=False).groupby('region').head(3)`, or `rank(method='first')` within the group. |
| **Month-over-month change per customer?** | `df.sort_values('month').groupby('cust')['usage'].pct_change()` (or `.diff()`); `shift(1)` gives the previous value. |
| **Why does `df[df.a > 0]['b'] = 1` fail silently?** | Chained indexing writes to a temporary copy. Use `df.loc[df.a > 0, 'b'] = 1`. |
| **Inner vs left merge — what can go wrong?** | Duplicate keys on the right fan out rows and inflate sums. Check with `validate='one_to_one'`/`'many_to_one'` and compare row counts before and after. |

---

## Further reading

- **Python for Data Analysis**, Wes McKinney, 3rd ed. — written by the author of Pandas, and free online: https://wesmckinney.com/book/
- **Pandas User Guide** — https://pandas.pydata.org/docs/user_guide/index.html. The "10 minutes to pandas" page is a good refresher; the "Comparison with SQL" page (https://pandas.pydata.org/docs/getting_started/comparison/comparison_with_sql.html) is written for exactly your background.
- **Effective Pandas**, Matt Harrison — the book on method chaining and writing Pandas that is readable rather than merely working. Directly addresses the `inplace=True` habit this course teaches.
- **Modern Pandas** by Tom Augspurger — a blog series on idiomatic, performant Pandas.
- **Polars** (https://pola.rs) — a newer DataFrame library with a stricter API and much better performance on large data. Not a replacement for learning Pandas, but worth knowing it exists once Pandas starts feeling slow.

---

<!-- nav -->
> [!example] 🧭 Step 3 of 26 · Stage 1 of 7: Toolkit
> ← [Part 02 · NumPy](02_NumPy.md) · [Part 12 · SQL](12_SQL_for_Data.md) → · [Course map](00_START_HERE.md)
<!-- /nav -->
