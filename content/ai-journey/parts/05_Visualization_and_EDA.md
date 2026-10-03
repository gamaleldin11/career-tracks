# Part 5 — Visualization and Exploratory Data Analysis

<!-- nav -->
> [!example] 🧭 Step 6 of 26 · Stage 2 of 7: Data & statistics
> ← [Part 04 · Cleaning & preprocessing](04_Data_Cleaning_and_Preprocessing.md) · [Part 15 · Statistics & A/B tests](15_Statistics_Probability_and_AB_Testing.md) → · [Course map](00_START_HERE.md)
<!-- /nav -->

**Source:** `AI_notebooks/2025-12-21/` — `Seaborn_summary.ipynb` (43 cells), `00-Distribution Plots_Plotly.ipynb` (58), `01-Categorical Plots_Plotly.ipynb` (53), `Supermarket Sales Analysis.ipynb` (44) **Lectures:** Lec 8, Lec 9

<!-- interview-focus -->

> [!tip] 🎯 Interview focus
> **Why it matters:** Take-home tasks and case rounds are judged heavily on EDA: did you find the story, and can you show it clearly?
>
> | Level | What you should be able to do |
> |---|---|
> | 🟢 **Entry** | Pick the right chart for the question; read distributions, box plots and correlations; spot skew, outliers and leakage-like features. |
> | 🟡 **Mid** | Hypothesis-driven EDA tied to the business question; segment-level insights; presenting 3–5 clear findings to non-technical stakeholders. |
> | 🔴 **Senior** | Dashboard and KPI design; choosing what *not* to show; guiding decisions with uncertainty. |
>
> **⭐ Most-asked:** *Walk me through your EDA on a new dataset.* · *Which plot for X vs Y?* · *Correlation of 0.9 between two features — so what?* · *How do you present findings to a manager?* · *What did EDA change in your model?*
>
> **⏱ Time:** 2 h  ·  **Short on time?** Read §5.1, §5.2, §5.7, §5.8.

**Legend:** 🟢 Entry (0–2 yrs) · 🟡 Mid (2–5 yrs) · 🔴 Senior / specialist · ⭐ frequently asked · 📖 Géron, *Hands-On ML with Scikit-Learn and PyTorch* (2025) pages

> [!abstract]- 🗺️ Section map — level and book pages
>
> | § | Section | Level | 📖 Book |
> |---|---|:---:|---|
> | 5.1 | What EDA is actually for | 🟢 ⭐ | Ch. 2 · pp. 54–57 |
> | 5.2 | The plot-selection decision tree | 🟢 ⭐ | — |
> | 5.3 | Seaborn — the mental model | 🟢 | — |
> | 5.4 | Plotly — interactive plots | 🟢 | — |
> | 5.5 | A worked EDA — the Supermarket Sales notebook | 🟢 | — |
> | 5.6 | Visualization principles the course assumed | 🟢 | — |
> | 5.7 | From EDA to conclusions | 🟡 ⭐ | — |
> | 5.8 | EDA the Géron way (*Hands-On ML*, Ch. 2) | 🟢 ⭐ | Ch. 2 · pp. 62–69 |
>

---

## 5.1 What EDA is actually for 🟢 ⭐

> [!info] 📖 Géron Ch. 2 · “Take a Quick Look at the Data Structure” · pp. 54–57

> [!quote] 💬 Say it in the interview
> “EDA is there to find the story and the risks: target balance, data quality, leakage suspects, and the 3–5 relationships that will drive the model and the business message.”

Exploratory Data Analysis is not "making charts before the real work". It is the real work. Three distinct jobs:

1. **Diagnosis** — find the errors, the missing values, the impossible ranges, the duplicated categories that differ by a trailing space.
2. **Understanding** — learn what the variables mean, how they are distributed, and which ones move together.
3. **Communication** — the capstone's judging criteria list *"Excellent insightful visualizations"* and *"How clearly and concisely you can communicate your findings"* as two of six points. Half the marks are for explanation, not prediction.

The single most valuable finding in the whole capstone came from EDA, not the model:

> Motorcyclists are at exceptionally high risk. Accidents involving "Motorcycles over 500cc" have a ~42% Serious/Fatal rate, compared to just ~8% for Cars.

No classifier produced that sentence. A crosstab did.

---

## 5.2 The plot-selection decision tree 🟢 ⭐

![Start from the question you are asking, then choose the chart.](figures/fig05_chart_gallery.png)
*Start from the question you are asking, then choose the chart.*

> [!quote] 💬 Say it in the interview
> “I choose the chart from the question: distribution → histogram or box plot, relationship → scatter, comparison → sorted bars, change over time → line, many correlations → heatmap.”

The `Seaborn_summary` notebook is organised around exactly the right question — *what types of variable am I looking at?* — and that structure is worth memorising because it removes all guesswork.

### One numeric variable

| Question | Plot |
|---|---|
| What is its distribution? | `histplot` / `displot` / `kdeplot` |
| Are there outliers? | `boxplot` |

```python
sns.displot(data=df, x='total_bill')
sns.kdeplot(data=df, x='total_bill', shade=True)   # current seaborn: fill=True
sns.boxplot(data=df, x='tip')
```

**Histogram vs KDE.** A histogram bins raw counts — honest, but the shape depends on your bin width. A KDE (kernel density estimate) replaces each observation with a small Gaussian and sums them, giving a smooth curve — prettier, but the smoothing can invent structure that is not there, and it will happily show density below zero for a strictly positive variable. Plot both when it matters.

(Note: `shade=` is deprecated in current Seaborn in favour of `fill=`.)

### Two numeric variables

```python
sns.scatterplot(data=df, x='total_bill', y='tip')
df[['total_bill', 'tip']].corr()
```

Scatter first, correlation second — **always in that order**. Anscombe's quartet is four datasets with identical means, variances and correlations that look completely different when plotted. A correlation coefficient is a one-number summary of a relationship you have not looked at yet.

### One categorical variable

```python
sns.countplot(data=df, x='sex')
df['sex'].value_counts()
```

The chart and the number answer the same question; use the number when you need precision, the chart when you need to compare many categories at once.

### Two categoricals

```python
sns.countplot(data=df, x='sex', hue='smoker')

df['dummy'] = 1
pd.pivot_table(data=df, index='smoker', columns='sex', values='dummy', aggfunc='count')
```

`hue` splits any Seaborn plot by a categorical variable. The pivot table is the numeric equivalent. (The `dummy = 1` trick works but `pd.crosstab(df.smoker, df.sex)` is the purpose-built version.)

### One categorical + one numeric

```python
sns.barplot(data=df, x='sex', y='total_bill', estimator=np.sum)
df.groupby('sex')['total_bill'].sum().plot(kind='bar')
```

⚠️ **The `estimator` argument matters more than it looks.** Seaborn's `barplot` defaults to plotting the **mean** with a bootstrapped 95% confidence interval — not the sum, not the count. That surprises people constantly. If you want totals, say so, as the notebook does.

Better alternatives to a bar of means, when you have enough data: `boxplot` (shows the distribution) or `violinplot` (shows the shape of it). A bar chart of means hides everything about spread.

### Two categoricals + one numeric

```python
sns.barplot(data=df, x='sex', y='total_bill', hue='smoker', estimator=np.sum)
pd.pivot_table(data=df, index='sex', columns='smoker', values='total_bill', aggfunc='mean')
```

### Two numerics + one categorical

```python
sns.scatterplot(data=df, x='total_bill', y='tip', hue='smoker')
```

The general principle: **`x` and `y` carry the numeric variables; `hue`, `size`, `style` and `col` carry additional categorical ones.** With those five channels you can show five variables in one chart — though three is usually the readability limit.

### Correlation heatmap

```python
corr = df.corr(method='spearman', numeric_only=True)
plt.figure(figsize=(12, 8))
sns.heatmap(corr, annot=True, cmap='RdBu', center=0)
plt.show()
```

Every argument here is a deliberate choice worth copying:

- **`method='spearman'`** — rank correlation. Catches monotonic non-linear relationships and shrugs off outliers. Pearson is the default but is the weaker choice for exploration.
- **`numeric_only=True`** — required in current Pandas; without it you get an error on text columns.
- **`annot=True`** — prints the numbers in the cells. A heatmap without annotations makes you squint at colours to recover values you already computed.
- **`cmap='RdBu'` with `center=0`** — a **diverging** colormap centred at zero, so that positive and negative correlations are visually distinguishable and 0 is neutral. Using a sequential colormap (`viridis`) for correlation is a genuine visual bug: it makes −1 and +1 look maximally different from each other in the wrong way.

**How to read it:** look for (a) strong correlations with the *target* — candidate predictors; (b) strong correlations *between features* — multicollinearity, which the capstone follows up with VIF.

---

## 5.3 Seaborn — the mental model 🟢

Seaborn sits on Matplotlib. Matplotlib gives you total control and requires you to build a chart out of primitives; Seaborn knows about DataFrames and statistical plot types and gives you a chart in one line.

```python
import seaborn as sns
import matplotlib.pyplot as plt

sns.set(rc={'figure.figsize': [10, 10]}, font_scale=1.3)
sns.set_theme(style="whitegrid")
%matplotlib inline
```

`sns.set_theme()` is the modern name. `%matplotlib inline` is a Jupyter magic that renders figures in the notebook rather than a separate window.

**Figure-level vs axes-level functions** — the distinction that explains most Seaborn confusion:

| | Axes-level | Figure-level |
|---|---|---|
| Examples | `histplot`, `boxplot`, `scatterplot`, `countplot` | `displot`, `catplot`, `relplot`, `jointplot`, `pairplot` |
| Draws into | An existing Matplotlib axes | Its own new figure |
| Composable with `plt.figure()` | Yes | **No** |
| Supports `col=` / `row=` faceting | No | Yes |

So `sns.boxplot(...)` then `sns.stripplot(...)` overlay on the same axes — which is why the outlier notebook in Part 4 could stack them. But `sns.displot(...)` after `plt.figure(figsize=...)` ignores your figure size, because it makes its own. That is the single most common Seaborn frustration and this table resolves it.

**Plots worth knowing that the course used in passing:**

```python
sns.jointplot(x='BuildingArea', y='Price', data=df)   # scatter + marginal distributions
sns.pairplot(df, hue='species')                       # every numeric pair, at once
sns.violinplot(x='Size', y='Price', data=df)          # box plot + KDE
sns.swarmplot(x='Design', y='Price', data=df)         # every point, non-overlapping
```

`pairplot` is the highest-information-per-keystroke command in the library. On a frame with 6 numeric columns it produces 36 panels showing every pairwise relationship and every marginal distribution. It is also O(n²) in columns, so cap it at ~10 columns.

`swarmplot` shows every individual observation, offset so none overlap. Honest, but it fails on large data — Seaborn will warn that points could not be placed.

---

## 5.4 Plotly — interactive plots 🟢

```python
import plotly.express as px

px.data.__all__          # built-in datasets
tips = px.data.tips()
```

Plotly renders to JavaScript, so the output is interactive: hover for values, zoom, pan, click legend entries to toggle series. Given your web background, the mental model is immediate — Seaborn produces a PNG, Plotly produces a `<div>` with a JSON spec and a renderer.

**When to use which:**

| Use | For |
|---|---|
| **Seaborn/Matplotlib** | Notebooks, PDF reports, papers, anything printed. Faster, smaller, works everywhere. |
| **Plotly** | Dashboards, HTML deliverables, exploring dense data where hover-to-identify matters. |

The `plotly.express` API deliberately mirrors Seaborn's — `px.histogram`, `px.box`, `px.violin`, `px.strip`, `px.scatter`, `px.line` — so the decision tree in §5.2 transfers unchanged.

### Distribution plots

```python
px.histogram(tips, x='total_bill', hover_data=tips.columns)
px.histogram(tips, x='total_bill', hover_data=tips.columns, color='smoker')
px.histogram(tips, x='total_bill', color='smoker',
             color_discrete_sequence=['black', 'green'])
px.histogram(tips, x="total_bill", nbins=20)
px.histogram(tips, x="day")                     # categorical → bar chart of counts

fig = px.histogram(tips, x="total_bill", y="tip", color="sex",
                   facet_col="day", marginal="box")
fig.show()
```

That last call is worth studying — it shows five variables at once: `x` and `y` (numeric), `color` (sex), `facet_col` (one panel per day), and `marginal="box"` (a box plot along the top edge). **Faceting** — small multiples — is one of the most effective techniques in data visualisation and is a single keyword here.

### KDE via figure factory

```python
import plotly.figure_factory as ff

hist_data = tips.total_bill.to_list()
ff.create_distplot([hist_data], ['total_bill'], bin_size=2, show_rug=True)
ff.create_distplot([hist_data], ['total_bill'], bin_size=2, show_rug=False, show_hist=False)

fig = ff.create_distplot([hist_data], ['total_bill'], bin_size=2,
                         show_rug=False, show_hist=False)
fig.update_xaxes(title_text='Total Bill')
fig.update_yaxes(title_text='Frequency')
fig.show()
```

The **rug plot** is the strip of tick marks along the axis — one per observation. It is the honest companion to a KDE: it shows you where the actual data is, so you can see when the smooth curve is interpolating across a gap.

`fig.update_xaxes(...)` is the general Plotly pattern: build with `px`, refine with `update_*` methods on the returned figure.

### Scatter and matrix

```python
px.scatter(x='total_bill', y='tip', data_frame=tips)
px.scatter(x='total_bill', y='tip', data_frame=tips, color='smoker')
px.scatter(x='total_bill', y='tip', data_frame=tips,
           marginal_x='histogram', marginal_y='histogram')
px.scatter(x='total_bill', y='tip', data_frame=tips,
           marginal_x='violin', marginal_y='box',
           color='smoker', color_discrete_map={'Yes': 'green', 'No': 'darkred'})
px.scatter(..., size='size')          # bubble chart — a 4th variable via point area

px.scatter_matrix(tips)
px.scatter_matrix(tips, dimensions=['total_bill', 'tip', 'size'], color='smoker')
```

`scatter_matrix` is Plotly's `pairplot`. `dimensions=` restricts it to columns you care about — do use it, since the default plots everything.

**`color_discrete_map` vs `color_discrete_sequence`:** the map assigns colours to specific category *values* (`{'Yes': 'green'}`), the sequence assigns them in order of appearance. Use the map when the colour should mean something consistent across charts.

### Categorical plots

```python
px.box(tips, x="day", y="total_bill", title="Tips Distribution")
px.box(tips, y="time", x="total_bill", color="day")

px.violin(tips, x="day", y="total_bill", color="smoker")
px.violin(tips, x="day", y="total_bill", box=True)     # violin with a box plot inside

px.strip(tips, x="day", y="total_bill", color="smoker")
```

**Box vs violin**, from the notebook's own definitions:

> A box plot […] shows the quartiles of the dataset while the whiskers extend to show the rest of the distribution, except for points that are determined to be "outliers".
>
> Unlike a box plot, in which all of the plot components correspond to actual datapoints, the violin plot features a kernel density estimation of the underlying distribution.

The practical difference: a box plot **cannot show bimodality**. Two distinct clusters and one broad blob produce the same box. A violin shows the two humps. If you suspect subgroups, use a violin — or overlay a strip plot, which the notebook recommends:

> we can mix strip plot with another plots like box plot and violin plot to get better representation

Swapping `x` and `y` flips the orientation. Horizontal box plots are much easier to read when the category names are long.

---

## 5.5 A worked EDA — the Supermarket Sales notebook 🟢

This notebook is the template. Its structure is the answer to "how do I start?"

### Setup

```python
import numpy as np, pandas as pd
import matplotlib.pyplot as plt, seaborn as sns
import warnings; warnings.filterwarnings('ignore')
from pathlib import Path

pd.set_option("display.max_columns", 200)
pd.set_option("display.width", 140)
sns.set_theme(style="whitegrid")

DATA_PATH = Path("supermarket_sales - Sheet1.csv")
```

`display.max_columns` stops Pandas truncating wide frames with `...`, which is essential when profiling. `Path` over string concatenation is the right habit — it handles Windows/POSIX separators for you.

(`warnings.filterwarnings('ignore')` is convenient and a little dangerous. Some of those warnings are `SettingWithCopyWarning` telling you about a real bug. Suppress at the end, not the beginning.)

### Ingest, and keep a pristine copy

```python
df_raw = pd.read_csv(DATA_PATH, na_values=['?', ' ', 'xxx'])
df = df_raw.copy()          # keep a clean working copy
print('Shape:', df.shape)
print('\nColumns:\n', df.columns.tolist())
print('\nInfo:', df.info())
```

**Keeping `df_raw` untouched is a habit worth adopting permanently.** When you are twelve cells deep and realise you dropped the wrong column, you re-run one line instead of restarting the kernel.

Note `na_values=['?', ' ', 'xxx']` — declaring this file's specific missing-value sentinels at read time.

### Normalise column names

```python
def clean_cols_names(columns):
    cleaned = (
        pd.Index(columns).str.strip()
        .str.lower()
        .str.replace(' ', '_')
        .str.replace(r"[^\w]+", '_', regex=True)   # Tax 5% --> tax_5_
    )
    return cleaned

df.columns = clean_cols_names(df.columns)
```

Excellent practice, and rarely taught. `"Tax 5%"` cannot be accessed as `df.Tax 5%`; `"Unit price"` and `"Unit Price "` are different columns as far as Pandas is concerned. Normalising to `snake_case` once at the top removes an entire category of bug and makes `df.tab`-completion work.

The regex `[^\w]+` replaces any run of non-word characters with a single underscore.

### Duplicates

```python
duplicated_count = df.duplicated().sum()
df[df.duplicated(keep=False)].head(10)      # SHOW them, don't just count
```

`keep=False` marks **every** member of a duplicate group, so you can see what duplicates what. The default (`keep='first'`) only flags the copies, which makes them impossible to inspect in context.

The capstone extends this with a genuinely important judgement call:

> We remove only **exact duplicate rows** (same values across all columns). We **do not remove** repeated `Reference Number` because it can represent multiple casualties / vehicles in the same accident.

A repeated ID is not necessarily a duplicate row. Knowing the difference requires domain understanding, and getting it wrong silently deletes real observations.

### Types

```python
df.dtypes
df.invoice_id.nunique()                       # cardinality check → is it an ID?

obj_cols = df.select_dtypes(include=['O']).columns.tolist()
conv_to_cat = [col for col in obj_cols if df[col].nunique(dropna=True) <= 20]
for c in conv_to_cat:
    df[c] = df[c].astype('category')

df['date'] = pd.to_datetime(df['date'], errors='coerce')
df['time'] = pd.to_datetime(df['time'], errors='coerce')
```

The list comprehension is the Part 1 material earning its place. "Object column with ≤20 distinct values → category" is a solid automatic rule.

### Nulls, and dropping identifiers

```python
df.isna().sum()          # → NO NULLS FOUND
df.drop('invoice_id', axis=1, inplace=True)    # high cardinality
```

`invoice_id` has one distinct value per row. It cannot generalise — it can only let a model memorise. Drop every such column. (The same reasoning removes `Email` and `Address` in Part 7 and `Reference Number` in Part 13.)

### Split columns by role, then summarise

```python
num_cols = df.select_dtypes(include=['number']).columns.tolist()
cat_cols = df.select_dtypes(include=['category', 'object']).columns.tolist()

df[num_cols].describe(percentiles=[0.01, 0.05, 0.25, 0.5, 0.75, 0.95, 0.99]).T
```

Two refinements over plain `describe()`:

- **The extra percentiles.** The 1st and 99th reveal tail behaviour that the quartiles hide. If P99 is 10× P95, you have a heavy tail and should think about the median, robust scaling, or a log transform.
- **`.T`** — transposing puts one row per feature, which reads far better when you have more than about six columns.

---

## 5.6 Visualization principles the course assumed 🟢

Since half the capstone's marks are for communication, these are worth stating.

**1. Every chart answers one question.** If you cannot say what the question is, delete the chart. The capstone's stacked bars answer "does severity vary by road surface?" — that is a question, and the chart answers it in one glance.

**2. Row-normalise when group sizes differ.** This is the most consequential technical point in the whole part:

```python
ctab = pd.crosstab(tmp[col], tmp[target_col], normalize="index")
ctab.plot(kind="bar", stacked=True)
```

Raw counts of serious accidents by vehicle type mostly tell you which vehicle is common. Normalising each row to sum to 1 turns counts into **rates**, and rates are comparable. The "42% vs 8%" motorcycle finding is only visible after normalising — in raw counts, cars dominate everything.

**3. Limit categories.** The capstone caps at the top 12:

```python
def stacked_bar(col, top_n=12):
    vc = df_model[col].value_counts()
    keep = vc.index[:top_n]
    tmp = df_model[df_model[col].isin(keep)].copy()
```

A bar chart with 80 categories is not a chart.

**4. Label everything.** Title, axis labels, units. `fig.update_xaxes(title_text='Total Bill')` exists for a reason. A chart in a report with unlabelled axes is not evidence.

**5. Choose the right colormap family.**

| Data | Colormap | Examples |
|---|---|---|
| Sequential (low → high) | Perceptually uniform | `viridis`, `magma` |
| Diverging (has a meaningful centre) | Two-hue | `RdBu`, `coolwarm` — **with `center=0`** |
| Categorical (no order) | Qualitative | `tab10`, `Set2` |

Avoid `jet`/`rainbow`: it is not perceptually uniform, it invents visual boundaries where the data has none, and it is unreadable when printed greyscale or by a colourblind reader.

**6. Do not use pie charts for comparison.** Humans compare lengths well and angles badly. A bar chart is better in almost every case. (Neither the course nor the capstone uses one, which is a good sign.)

---

## 5.7 From EDA to conclusions 🟡 ⭐

> [!quote] 💬 Say it in the interview
> “I end EDA with written, quantified findings — ‘month-to-month customers churn at 3× the rate of two-year contracts’ — each tied to a decision or a feature.”

The capstone models the final step properly — it converts charts into written findings:

> **1) Target imbalance is strong** — `Slight` is the majority class, while `Fatal` is rare. This is why we prefer **F1-macro** and use **SMOTE** inside the CV pipeline.
>
> **2) Time-related patterns matter** — features like `hour`, `is_weekend`, and `day_period` help capture behavioural patterns (rush hours, late night).
>
> **3) Weather / Road conditions add useful signal** — binary features such as `road_not_dry` […]

Notice the structure of each: **observation → modelling consequence.** Not "here is a chart of the target distribution" but "the target is imbalanced, *therefore* we use F1-macro and SMOTE".

That is what separates an EDA that informs the work from an EDA that decorates it. Write your conclusions this way and the modelling section justifies itself.

---

## 5.8 EDA the Géron way (*Hands-On ML*, Ch. 2) 🟢 ⭐

> [!info] 📖 Géron Ch. 2 · “Explore and Visualize the Data to Gain Insights” · pp. 62–69

> [!quote] 💬 Say it in the interview
> “Géron's rule: quick look, then split, then explore the training set only. Correlations rank candidates, but the scatter plot shows the truth — caps, clusters, non-linearity.”

> [!note] 📘 From the book
> Techniques from Géron's California-housing EDA that complement the course's decision tree in §5.2.

**1. Split first, explore the training set only.** Géron creates the test set *before* any serious exploration to avoid **data snooping bias** (Part 4 §4.10.1). Work on a copy (`housing = strat_train_set.copy()`) so you can revert. If the training set is huge, explore a sample.

**2. The quick look reveals data provenance problems.** A single `df.hist(bins=50, figsize=(12, 8))` showed Géron that:
- `median_income` was **scaled and capped** (0.5–15, not dollars);
- the **target was capped** at \$500k, which is a serious problem because the model will learn that prices never exceed it;
- the features had very different scales;
- many distributions were **right-skewed**, so transforms were needed (Part 4 §4.10.9).

Each observation led to a question for the data owners or a preprocessing decision. That is the "observation → consequence" structure of §5.7.

**3. Geographic scatter with transparency and encodings.**

```python
housing.plot(kind="scatter", x="longitude", y="latitude", grid=True, alpha=0.2)

housing.plot(kind="scatter", x="longitude", y="latitude", grid=True,
             s=housing["population"] / 100, label="population",
             c="median_house_value", cmap="jet", colorbar=True,
             legend=True, sharex=False, figsize=(10, 7))
```

- `alpha=0.2` reveals density (the Bay Area, LA, San Diego, the Central Valley).
- **Size = population, colour = price** puts four variables on one chart. That led Géron to the conclusion that location clusters matter, which became the `ClusterSimilarity` feature (Part 4 §4.10.11).
- (Géron uses `jet` here for its familiarity. Prefer `viridis` per §5.6.)
- **Telecom translation:** plot cell sites with size = traffic, colour = drop-call rate. Coverage and quality hotspots appear immediately.

**4. Correlations: rank, then look.**

```python
corr = housing.corr(numeric_only=True)
corr["median_house_value"].sort_values(ascending=False)

from pandas.plotting import scatter_matrix
scatter_matrix(housing[["median_house_value", "median_income",
                        "total_rooms", "housing_median_age"]], figsize=(12, 8))
```

Zooming into the strongest pair (income vs price, `alpha=0.1`) exposed the \$500k cap line and fainter horizontal lines at ~\$450k, \$350k and \$280k. Those are quirks to consider removing. **Correlation ranks candidates; the scatter plot tells you the truth** (non-linear shapes, caps, clusters). Remember: r only measures *linear* association (Part 4 §4.10.4).

**5. Try attribute combinations and re-rank.** Ratios (rooms per household, bedrooms per room) beat raw totals (Part 4 §4.10.5). EDA is where feature ideas are born and tested cheaply.

**6. It is iterative.** Géron: this exploration *"does not have to be absolutely thorough"*. Get a prototype working, analyse its errors, and come back to EDA with better questions.

### EDA interview questions

- **"You get a new dataset. What are your first 10 minutes?"** Shape, dtypes, `info()`, missing rates, duplicates, `describe()` for ranges and impossible values, cardinality of categoricals, the target distribution (imbalance? caps?), histograms, then split off the test set before going deeper.
- **"How do you find outliers, and do you remove them?"** Boxplot/IQR, z-scores, domain limits, Isolation Forest. Remove only *errors*. Keep genuine extremes (the VIP customer), maybe capping them or using robust models. Document the decision.
- **"Two features have a correlation of 0. Are they unrelated?"** Not necessarily. The relationship may be non-linear. Plot it; use Spearman or mutual information.
- **"How would you present EDA findings to a business audience?"** Three to five findings, each an observation plus a "so what", with one clear chart each. No distribution zoo.

---

> [!check] ✅ Key takeaways
> - EDA has three jobs: diagnose data problems, understand relationships, and communicate findings.
> - Choose the chart from the question: distribution, comparison, relationship, change over time.
> - Plot before you correlate — r only measures linear association (Anscombe's quartet).
> - Normalise to **rates** when group sizes differ; raw counts mostly show which group is common.
> - Géron's rule: quick look, then split, then explore the training set only (avoid data snooping).
> - End EDA with 3–5 written findings, each an observation plus its modelling or business consequence.

## ⚡ Interview quick-fire

Cover the right-hand column and answer out loud first.

| Question | Strong short answer |
|---|---|
| **Your EDA checklist in 30 seconds?** | Shape and dtypes → missingness → target distribution → univariate distributions (skew, outliers) → relationships with the target → correlations and multicollinearity → time effects → leakage suspects → 3–5 written findings. |
| **Pearson vs Spearman?** | Pearson measures linear association; Spearman measures monotonic association on ranks and is robust to outliers and non-linear-but-monotonic shapes. |
| **A feature is almost perfectly predictive — what do you do?** | Suspect leakage: check whether it is only known *after* the outcome (e.g. "cancellation_reason" for churn). |
| **How do you show churn rate by tenure?** | Bin tenure, then plot a bar or line of churn **rate** (not counts) with the sample size per bin. |
| **Why not pie charts?** | Humans compare lengths better than angles; use sorted bars. |

---

## Further reading

- **Seaborn tutorial** — https://seaborn.pydata.org/tutorial.html. The "Overview of plotting functions" page explains the figure-level/axes-level split properly.
- **Plotly Express docs** — https://plotly.com/python/plotly-express/
- **Fundamentals of Data Visualization**, Claus Wilke — free online at https://clauswilke.com/dataviz/. The best available book on *why* charts work, with a whole chapter on colour choice. Read the "Directory of visualizations" chapter.
- **The Visual Display of Quantitative Information**, Edward Tufte — the classic.
- **From Data to Viz** — https://www.data-to-viz.com/ — an interactive decision tree from "what data do I have" to "which chart", with code in Python and R. A better version of §5.2.
- **Matplotlib's "Anatomy of a Figure"** — https://matplotlib.org/stable/gallery/showcase/anatomy.html. Worth 10 minutes: once you know what an Axes is versus a Figure, Matplotlib stops being mysterious.

---

<!-- nav -->
> [!example] 🧭 Step 6 of 26 · Stage 2 of 7: Data & statistics
> ← [Part 04 · Cleaning & preprocessing](04_Data_Cleaning_and_Preprocessing.md) · [Part 15 · Statistics & A/B tests](15_Statistics_Probability_and_AB_Testing.md) → · [Course map](00_START_HERE.md)
<!-- /nav -->
