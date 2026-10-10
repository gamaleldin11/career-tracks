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

<figure class="dia"><svg viewBox="0 0 720 238" role="img" aria-label="Anscombe's quartet: four small datasets with the same mean, correlation and regression line but very different shapes: linear, curved, linear with one outlier, and vertical with one leverage point">
<rect class="sN" x="14" y="30" width="164" height="150" rx="6"/><text class="sT" x="96" y="22" text-anchor="middle">I</text>
<circle class="sP" cx="82.9" cy="103.5" r="3.5"/>
<circle class="sP" cx="65.5" cy="115.9" r="3.5"/>
<circle class="sP" cx="109.1" cy="108.8" r="3.5"/>
<circle class="sP" cx="74.2" cy="94.8" r="3.5"/>
<circle class="sP" cx="91.6" cy="100.3" r="3.5"/>
<circle class="sP" cx="117.8" cy="81.8" r="3.5"/>
<circle class="sP" cx="48.1" cy="112.6" r="3.5"/>
<circle class="sP" cx="30.7" cy="146.4" r="3.5"/>
<circle class="sP" cx="100.4" cy="71.8" r="3.5"/>
<circle class="sP" cx="56.8" cy="140.0" r="3.5"/>
<circle class="sP" cx="39.4" cy="130.3" r="3.5"/>
<line class="sLw" x1="22" y1="143.667" x2="170" y2="47.3333" opacity=".6"/>
<text class="sC" x="96" y="198" text-anchor="middle">mean y 7.50 · r 0.82</text>
<rect class="sN" x="190" y="30" width="164" height="150" rx="6"/><text class="sT" x="272" y="22" text-anchor="middle">II</text>
<circle class="sP" cx="258.9" cy="91.1" r="3.5"/>
<circle class="sP" cx="241.5" cy="102.4" r="3.5"/>
<circle class="sP" cx="285.1" cy="95.6" r="3.5"/>
<circle class="sP" cx="250.2" cy="95.3" r="3.5"/>
<circle class="sP" cx="267.6" cy="89.7" r="3.5"/>
<circle class="sP" cx="293.8" cy="102.9" r="3.5"/>
<circle class="sP" cx="224.1" cy="125.2" r="3.5"/>
<circle class="sP" cx="206.7" cy="159.5" r="3.5"/>
<circle class="sP" cx="276.4" cy="91.2" r="3.5"/>
<circle class="sP" cx="232.8" cy="112.4" r="3.5"/>
<circle class="sP" cx="215.4" cy="140.9" r="3.5"/>
<line class="sLw" x1="198" y1="143.667" x2="346" y2="47.3333" opacity=".6"/>
<text class="sC" x="272" y="198" text-anchor="middle">mean y 7.50 · r 0.82</text>
<rect class="sN" x="366" y="30" width="164" height="150" rx="6"/><text class="sT" x="448" y="22" text-anchor="middle">III</text>
<circle class="sP" cx="434.9" cy="110.1" r="3.5"/>
<circle class="sP" cx="417.5" cy="117.9" r="3.5"/>
<circle class="sP" cx="461.1" cy="50.3" r="3.5"/>
<circle class="sP" cx="426.2" cy="114.1" r="3.5"/>
<circle class="sP" cx="443.6" cy="106.2" r="3.5"/>
<circle class="sP" cx="469.8" cy="94.5" r="3.5"/>
<circle class="sP" cx="400.1" cy="125.8" r="3.5"/>
<circle class="sP" cx="382.7" cy="133.6" r="3.5"/>
<circle class="sP" cx="452.4" cy="102.3" r="3.5"/>
<circle class="sP" cx="408.8" cy="121.9" r="3.5"/>
<circle class="sP" cx="391.4" cy="129.7" r="3.5"/>
<line class="sLw" x1="374" y1="143.667" x2="522" y2="47.3333" opacity=".6"/>
<text class="sC" x="448" y="198" text-anchor="middle">mean y 7.50 · r 0.82</text>
<rect class="sN" x="542" y="30" width="164" height="150" rx="6"/><text class="sT" x="624" y="22" text-anchor="middle">IV</text>
<circle class="sP" cx="593.5" cy="120.1" r="3.5"/>
<circle class="sP" cx="593.5" cy="129.4" r="3.5"/>
<circle class="sP" cx="593.5" cy="107.3" r="3.5"/>
<circle class="sP" cx="593.5" cy="94.5" r="3.5"/>
<circle class="sP" cx="593.5" cy="98.7" r="3.5"/>
<circle class="sP" cx="593.5" cy="114.9" r="3.5"/>
<circle class="sP" cx="593.5" cy="135.2" r="3.5"/>
<circle class="sP" cx="689.3" cy="53.0" r="3.5"/>
<circle class="sP" cx="593.5" cy="131.7" r="3.5"/>
<circle class="sP" cx="593.5" cy="105.0" r="3.5"/>
<circle class="sP" cx="593.5" cy="116.6" r="3.5"/>
<line class="sLw" x1="550" y1="143.667" x2="698" y2="47.3333" opacity=".6"/>
<text class="sC" x="624" y="198" text-anchor="middle">mean y 7.50 · r 0.82</text>
<text class="sS" x="360" y="226" text-anchor="middle">identical means, variances, correlations and regression lines; four completely different stories</text>
</svg><figcaption>Anscombe's quartet (1973), plotted from the published data: summary statistics alone would call these four datasets the same.</figcaption></figure>

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

<figure class="dia steps"><svg viewBox="0 0 720 242" role="img" aria-label="Axes-level versus figure-level Seaborn: a figure created with plt.figure holds one Axes, into which boxplot and stripplot both draw; displot instead creates its own figure with one facet per Size category, leaving the figure created with plt.figure empty">
<rect class="sN" x="14" y="30" width="304" height="182" rx="8"/><text class="sS" x="166" y="48" text-anchor="middle">Figure from plt.figure(figsize=(10, 4))</text>
<rect class="sB" x="40" y="58" width="262" height="132" rx="2" style="fill:none"/><text class="sS" x="171" y="204" text-anchor="middle">one Axes (plt.gca())</text>
<g data-s="2"><rect class="sA" x="66" y="136.477" width="36" height="18.759" rx="2" opacity=".7"/><line class="sL" x1="66" y1="144.391" x2="102" y2="144.391"/><line class="sL" x1="84" y1="136.477" x2="84" y2="118.459"/><line class="sL" x1="84" y1="155.236" x2="84" y2="166.943"/><circle class="sPv" cx="88.2" cy="153.5" r="2.2"/><circle class="sPv" cx="73.5" cy="161.1" r="2.2"/><circle class="sPv" cx="85.3" cy="145.6" r="2.2"/><circle class="sPv" cx="78.5" cy="135.9" r="2.2"/><circle class="sPv" cx="93.1" cy="125.6" r="2.2"/><circle class="sPv" cx="73.5" cy="140.4" r="2.2"/><circle class="sPv" cx="88.3" cy="150.0" r="2.2"/><circle class="sPv" cx="92.9" cy="153.3" r="2.2"/><circle class="sPv" cx="77.5" cy="131.2" r="2.2"/><circle class="sPv" cx="93.5" cy="118.5" r="2.2"/><circle class="sPv" cx="92.9" cy="138.1" r="2.2"/><circle class="sPv" cx="72.4" cy="159.8" r="2.2"/><circle class="sPv" cx="89.0" cy="155.8" r="2.2"/><circle class="sPv" cx="72.0" cy="119.0" r="2.2"/><circle class="sPv" cx="84.1" cy="139.1" r="2.2"/><circle class="sPv" cx="82.5" cy="166.9" r="2.2"/><circle class="sPv" cx="76.9" cy="143.2" r="2.2"/><circle class="sPv" cx="79.8" cy="158.8" r="2.2"/><rect class="sA" x="154" y="120.252" width="36" height="19.6954" rx="2" opacity=".7"/><line class="sL" x1="154" y1="127.522" x2="190" y2="127.522"/><line class="sL" x1="172" y1="120.252" x2="172" y2="107.148"/><line class="sL" x1="172" y1="139.947" x2="172" y2="152.769"/><circle class="sPv" cx="169.6" cy="139.7" r="2.2"/><circle class="sPv" cx="182.5" cy="143.5" r="2.2"/><circle class="sPv" cx="173.3" cy="120.8" r="2.2"/><circle class="sPv" cx="165.8" cy="140.0" r="2.2"/><circle class="sPv" cx="177.8" cy="107.1" r="2.2"/><circle class="sPv" cx="176.2" cy="113.7" r="2.2"/><circle class="sPv" cx="176.4" cy="152.8" r="2.2"/><circle class="sPv" cx="171.1" cy="120.1" r="2.2"/><circle class="sPv" cx="165.3" cy="139.9" r="2.2"/><circle class="sPv" cx="175.4" cy="123.5" r="2.2"/><circle class="sPv" cx="162.6" cy="123.4" r="2.2"/><circle class="sPv" cx="176.6" cy="152.6" r="2.2"/><circle class="sPv" cx="175.2" cy="127.4" r="2.2"/><circle class="sPv" cx="169.0" cy="127.7" r="2.2"/><circle class="sPv" cx="179.2" cy="110.1" r="2.2"/><circle class="sPv" cx="164.7" cy="141.0" r="2.2"/><circle class="sPv" cx="169.4" cy="113.4" r="2.2"/><circle class="sPv" cx="179.2" cy="139.8" r="2.2"/><rect class="sA" x="242" y="98.9117" width="36" height="18.1024" rx="2" opacity=".7"/><line class="sL" x1="242" y1="109.434" x2="278" y2="109.434"/><line class="sL" x1="260" y1="98.9117" x2="260" y2="86.0756"/><line class="sL" x1="260" y1="117.014" x2="260" y2="118.698"/><circle class="sPv" cx="263.2" cy="98.5" r="2.2"/><circle class="sPv" cx="270.4" cy="112.5" r="2.2"/><circle class="sPv" cx="270.2" cy="87.1" r="2.2"/><circle class="sPv" cx="255.9" cy="118.7" r="2.2"/><circle class="sPv" cx="271.7" cy="117.3" r="2.2"/><circle class="sPv" cx="252.5" cy="118.5" r="2.2"/><circle class="sPv" cx="267.8" cy="86.1" r="2.2"/><circle class="sPv" cx="251.8" cy="105.2" r="2.2"/><circle class="sPv" cx="257.7" cy="114.0" r="2.2"/><circle class="sPv" cx="249.8" cy="116.4" r="2.2"/><circle class="sPv" cx="268.6" cy="93.9" r="2.2"/><circle class="sPv" cx="267.9" cy="115.2" r="2.2"/><circle class="sPv" cx="251.4" cy="118.3" r="2.2"/><circle class="sPv" cx="260.7" cy="91.2" r="2.2"/><circle class="sPv" cx="254.2" cy="117.2" r="2.2"/><circle class="sPv" cx="259.8" cy="104.6" r="2.2"/><circle class="sPv" cx="261.3" cy="100.1" r="2.2"/><circle class="sPv" cx="250.6" cy="106.4" r="2.2"/><text class="sS" x="14" y="232" xml:space="preserve" style="white-space:pre">sns.boxplot(...); sns.stripplot(...)  # same Axes, overlaid</text></g>
<g data-s="3"><rect class="sN" x="344" y="30" width="150" height="54" rx="8" style="stroke-dasharray:4 3"/><text class="sS" x="419" y="52" text-anchor="middle">plt.figure(figsize=...)</text><text class="sWt" x="419" y="70" text-anchor="middle">left empty</text><rect class="sV" x="344" y="94" width="362" height="118" rx="8" opacity=".35"/><text class="sS" x="525" y="110" text-anchor="middle">FacetGrid: displot made its own Figure</text><rect class="sN" x="356" y="118" width="104" height="84" rx="2"/><text class="sS" x="408" y="130" text-anchor="middle">Size = S</text><rect class="sV" x="364" y="193.091" width="10" height="4.90909" rx="1"/><rect class="sV" x="375" y="170.018" width="10" height="27.9818" rx="1"/><rect class="sV" x="386" y="147.927" width="10" height="50.0727" rx="1"/><rect class="sV" x="397" y="160.691" width="10" height="37.3091" rx="1"/><rect class="sV" x="408" y="179.345" width="10" height="18.6545" rx="1"/><rect class="sV" x="419" y="193.582" width="10" height="4.41818" rx="1"/><rect class="sV" x="430" y="197.018" width="10" height="0.981818" rx="1"/><rect class="sV" x="441" y="198" width="10" height="0" rx="1"/><rect class="sN" x="474" y="118" width="104" height="84" rx="2"/><text class="sS" x="526" y="130" text-anchor="middle">Size = M</text><rect class="sV" x="482" y="197.018" width="10" height="0.981818" rx="1"/><rect class="sV" x="493" y="191.127" width="10" height="6.87273" rx="1"/><rect class="sV" x="504" y="175.418" width="10" height="22.5818" rx="1"/><rect class="sV" x="515" y="159.218" width="10" height="38.7818" rx="1"/><rect class="sV" x="526" y="149.4" width="10" height="48.6" rx="1"/><rect class="sV" x="537" y="176.891" width="10" height="21.1091" rx="1"/><rect class="sV" x="548" y="190.145" width="10" height="7.85455" rx="1"/><rect class="sV" x="559" y="197.509" width="10" height="0.490909" rx="1"/><rect class="sN" x="592" y="118" width="104" height="84" rx="2"/><text class="sS" x="644" y="130" text-anchor="middle">Size = L</text><rect class="sV" x="600" y="198" width="10" height="0" rx="1"/><rect class="sV" x="611" y="198" width="10" height="0" rx="1"/><rect class="sV" x="622" y="195.545" width="10" height="2.45455" rx="1"/><rect class="sV" x="633" y="188.182" width="10" height="9.81818" rx="1"/><rect class="sV" x="644" y="169.036" width="10" height="28.9636" rx="1"/><rect class="sV" x="655" y="148.418" width="10" height="49.5818" rx="1"/><rect class="sV" x="666" y="159.218" width="10" height="38.7818" rx="1"/><rect class="sV" x="677" y="183.273" width="10" height="14.7273" rx="1"/><text class="sS" x="344" y="232" xml:space="preserve" style="white-space:pre">sns.displot(df, x='Price', col='Size', height=3)</text></g>
</svg><ol class="dia-steps">
<li>plt.figure(figsize=(10, 4)) creates a Figure, and the first plotting call gets its current Axes.</li>
<li>Axes-level functions (boxplot, stripplot, histplot, scatterplot) draw into that existing Axes, so two calls overlay on one chart and figsize is respected.</li>
<li>Figure-level functions (displot, catplot, relplot, pairplot) build a FacetGrid with a brand-new Figure. The one you sized stays empty; size the grid with height= and aspect= instead.</li>
</ol><figcaption>Why displot ignores your figsize: axes-level functions draw into the current Axes; figure-level functions create their own Figure.</figcaption></figure>

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

<figure class="dia"><svg viewBox="0 0 720 252" role="img" aria-label="The faceted histogram from the code, recomputed from the tips data: one panel per day, Thursday, Friday, Saturday and Sunday, each showing the sum of tips per total bill bin stacked by sex, with a box plot of total bill along the top; Friday has few tables, and Saturday and Sunday carry most of the tips">
<text class="sT" x="114" y="20" text-anchor="middle">day=Thur  (n=62)</text>
<line class="sLm" x1="62.2296" y1="44" x2="128.208" y2="44"/><rect class="sA" x="76.8298" y="36" width="22.829" height="16" rx="2" opacity=".6"/><line class="sL" x1="87.952" y1="36" x2="87.952" y2="52"/>
<circle class="sPw" cx="136.7" cy="44" r="2"/>
<circle class="sPw" cx="143.1" cy="44" r="2"/>
<circle class="sPw" cx="141.5" cy="44" r="2"/>
<circle class="sPw" cx="161.9" cy="44" r="2"/>
<circle class="sPw" cx="167.6" cy="44" r="2"/>
<line class="sLm" x1="40" y1="210" x2="188" y2="210"/>
<rect class="sV" x="54.8" y="204.63" width="13.8" height="5.37029" rx="1"/>
<rect class="sG" x="54.8" y="191.643" width="13.8" height="12.9863" rx="1"/>
<rect class="sV" x="69.6" y="149.033" width="13.8" height="60.9674" rx="1"/>
<rect class="sG" x="69.6" y="127.922" width="13.8" height="21.1101" rx="1"/>
<rect class="sV" x="84.4" y="164.44" width="13.8" height="45.5596" rx="1"/>
<rect class="sG" x="84.4" y="104.567" width="13.8" height="59.8738" rx="1"/>
<rect class="sV" x="99.2" y="198.771" width="13.8" height="11.2288" rx="1"/>
<rect class="sG" x="99.2" y="163.562" width="13.8" height="35.2096" rx="1"/>
<rect class="sV" x="114" y="192.034" width="13.8" height="17.9661" rx="1"/>
<rect class="sG" x="114" y="179.223" width="13.8" height="12.8106" rx="1"/>
<rect class="sV" x="128.8" y="199.904" width="13.8" height="10.0961" rx="1"/>
<rect class="sG" x="128.8" y="177.056" width="13.8" height="22.8481" rx="1"/>
<rect class="sV" x="158.4" y="200.236" width="13.8" height="9.76416" rx="1"/>
<rect class="sG" x="158.4" y="190.472" width="13.8" height="9.76416" rx="1"/>
<text class="sS" x="40" y="224" text-anchor="middle">0</text>
<text class="sS" x="114" y="224" text-anchor="middle">25</text>
<text class="sS" x="188" y="224" text-anchor="middle">50</text>
<text class="sT" x="286" y="20" text-anchor="middle">day=Fri  (n=19)</text>
<line class="sLm" x1="229.02" y1="44" x2="297.751" y2="44"/><rect class="sA" x="247.801" y="36" width="28.5788" height="16" rx="2" opacity=".6"/><line class="sL" x1="257.525" y1="36" x2="257.525" y2="52"/>
<circle class="sPw" cx="330.9" cy="44" r="2"/>
<line class="sLm" x1="212" y1="210" x2="360" y2="210"/>
<rect class="sV" x="226.8" y="208.047" width="13.8" height="1.95283" rx="1"/>
<rect class="sG" x="226.8" y="204.298" width="13.8" height="3.74944" rx="1"/>
<rect class="sV" x="241.6" y="194.416" width="13.8" height="15.5836" rx="1"/>
<rect class="sG" x="241.6" y="181.176" width="13.8" height="13.2402" rx="1"/>
<rect class="sV" x="256.4" y="185.004" width="13.8" height="24.9962" rx="1"/>
<rect class="sV" x="271.2" y="203.653" width="13.8" height="6.3467" rx="1"/>
<rect class="sG" x="271.2" y="190.96" width="13.8" height="12.6934" rx="1"/>
<rect class="sG" x="286" y="196.33" width="13.8" height="13.6698" rx="1"/>
<rect class="sG" x="330.4" y="200.763" width="13.8" height="9.23689" rx="1"/>
<text class="sS" x="212" y="224" text-anchor="middle">0</text>
<text class="sS" x="286" y="224" text-anchor="middle">25</text>
<text class="sS" x="360" y="224" text-anchor="middle">50</text>
<text class="sT" x="458" y="20" text-anchor="middle">day=Sat  (n=87)</text>
<line class="sLm" x1="393.087" y1="44" x2="500.683" y2="44"/><rect class="sA" x="425.159" y="36" width="32.0716" height="16" rx="2" opacity=".6"/><line class="sL" x1="437.99" y1="36" x2="437.99" y2="52"/>
<circle class="sPw" cx="526.9" cy="44" r="2"/>
<circle class="sPw" cx="515.1" cy="44" r="2"/>
<circle class="sPw" cx="534.4" cy="44" r="2"/>
<circle class="sPw" cx="527.1" cy="44" r="2"/>
<line class="sLm" x1="384" y1="210" x2="532" y2="210"/>
<rect class="sV" x="384" y="208.047" width="13.8" height="1.95283" rx="1"/>
<rect class="sV" x="398.8" y="208.047" width="13.8" height="1.95283" rx="1"/>
<rect class="sG" x="398.8" y="202.403" width="13.8" height="5.64368" rx="1"/>
<rect class="sV" x="413.6" y="179.458" width="13.8" height="30.5423" rx="1"/>
<rect class="sG" x="413.6" y="126.165" width="13.8" height="53.2928" rx="1"/>
<rect class="sV" x="428.4" y="177.251" width="13.8" height="32.749" rx="1"/>
<rect class="sG" x="428.4" y="80" width="13.8" height="97.251" rx="1"/>
<rect class="sV" x="443.2" y="179.458" width="13.8" height="30.5423" rx="1"/>
<rect class="sG" x="443.2" y="115.581" width="13.8" height="63.8771" rx="1"/>
<rect class="sV" x="458" y="174.576" width="13.8" height="35.4244" rx="1"/>
<rect class="sG" x="458" y="132.043" width="13.8" height="42.5327" rx="1"/>
<rect class="sV" x="472.8" y="203.966" width="13.8" height="6.03425" rx="1"/>
<rect class="sG" x="472.8" y="188.011" width="13.8" height="15.9546" rx="1"/>
<rect class="sV" x="487.6" y="200.88" width="13.8" height="9.11972" rx="1"/>
<rect class="sG" x="487.6" y="174.361" width="13.8" height="26.5195" rx="1"/>
<rect class="sV" x="502.4" y="205.118" width="13.8" height="4.88208" rx="1"/>
<rect class="sG" x="517.2" y="179.282" width="13.8" height="30.718" rx="1"/>
<text class="sS" x="384" y="224" text-anchor="middle">0</text>
<text class="sS" x="458" y="224" text-anchor="middle">25</text>
<text class="sS" x="532" y="224" text-anchor="middle">50</text>
<text class="sT" x="630" y="20" text-anchor="middle">day=Sun  (n=76)</text>
<line class="sLm" x1="577.46" y1="44" x2="676.028" y2="44"/><rect class="sA" x="600.363" y="36" width="31.4056" height="16" rx="2" opacity=".6"/><line class="sL" x1="614.105" y1="36" x2="614.105" y2="52"/>
<circle class="sPw" cx="698.6" cy="44" r="2"/>
<circle class="sPw" cx="690.2" cy="44" r="2"/>
<line class="sLm" x1="556" y1="210" x2="704" y2="210"/>
<rect class="sV" x="570.8" y="202.189" width="13.8" height="7.81133" rx="1"/>
<rect class="sG" x="570.8" y="182.602" width="13.8" height="19.5869" rx="1"/>
<rect class="sV" x="585.6" y="190.667" width="13.8" height="19.333" rx="1"/>
<rect class="sG" x="585.6" y="145.439" width="13.8" height="45.2276" rx="1"/>
<rect class="sV" x="600.4" y="177.759" width="13.8" height="32.2412" rx="1"/>
<rect class="sG" x="600.4" y="106.422" width="13.8" height="71.3369" rx="1"/>
<rect class="sV" x="615.2" y="196.115" width="13.8" height="13.8846" rx="1"/>
<rect class="sG" x="615.2" y="97.2044" width="13.8" height="98.9109" rx="1"/>
<rect class="sV" x="630" y="184.828" width="13.8" height="25.172" rx="1"/>
<rect class="sG" x="630" y="147.158" width="13.8" height="37.6701" rx="1"/>
<rect class="sV" x="644.8" y="199.845" width="13.8" height="10.1547" rx="1"/>
<rect class="sG" x="644.8" y="138.097" width="13.8" height="61.7485" rx="1"/>
<rect class="sV" x="659.6" y="200.236" width="13.8" height="9.76416" rx="1"/>
<rect class="sG" x="659.6" y="192.425" width="13.8" height="7.81133" rx="1"/>
<rect class="sG" x="674.4" y="204.142" width="13.8" height="5.85849" rx="1"/>
<rect class="sG" x="689.2" y="193.401" width="13.8" height="16.5991" rx="1"/>
<text class="sS" x="556" y="224" text-anchor="middle">0</text>
<text class="sS" x="630" y="224" text-anchor="middle">25</text>
<text class="sS" x="704" y="224" text-anchor="middle">50</text>
<text class="sS" x="24" y="140" text-anchor="middle" transform="rotate(-90 24 140)">sum of tip</text>
<text class="sS" x="290" y="242" text-anchor="middle">total_bill (bins of 5)  ·  top: box plot of total_bill</text>
<rect class="sV" x="560" y="232" width="12" height="12" rx="2"/><text class="sS" x="578" y="242">Female</text><rect class="sG" x="630" y="232" width="12" height="12" rx="2"/><text class="sS" x="648" y="242">Male</text>
</svg><figcaption>px.histogram(tips, x="total_bill", y="tip", color="sex", facet_col="day", marginal="box"), redrawn from the same data: y="tip" means each bar is a sum of tips, not a count.</figcaption></figure>

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

<figure class="dia"><svg viewBox="0 0 720 246" role="img" aria-label="A scatter of house value against median income: a dense rising cloud flattens into a horizontal line of points at the 500 thousand dollar cap, with fainter horizontal lines at 450 and 350 thousand">
<circle class="sP" cx="174.7" cy="125.0" r="2.2" opacity=".35"/>
<circle class="sP" cx="122.5" cy="162.7" r="2.2" opacity=".35"/>
<circle class="sP" cx="104.0" cy="174.9" r="2.2" opacity=".35"/>
<circle class="sP" cx="201.6" cy="127.5" r="2.2" opacity=".35"/>
<circle class="sP" cx="131.0" cy="124.5" r="2.2" opacity=".35"/>
<circle class="sP" cx="156.6" cy="93.6" r="2.2" opacity=".35"/>
<circle class="sP" cx="183.2" cy="65.1" r="2.2" opacity=".35"/>
<circle class="sP" cx="128.7" cy="153.0" r="2.2" opacity=".35"/>
<circle class="sP" cx="137.5" cy="152.0" r="2.2" opacity=".35"/>
<circle class="sP" cx="206.0" cy="107.5" r="2.2" opacity=".35"/>
<circle class="sP" cx="165.5" cy="144.2" r="2.2" opacity=".35"/>
<circle class="sP" cx="170.3" cy="135.2" r="2.2" opacity=".35"/>
<circle class="sP" cx="160.7" cy="139.5" r="2.2" opacity=".35"/>
<circle class="sP" cx="139.3" cy="170.3" r="2.2" opacity=".35"/>
<circle class="sP" cx="156.1" cy="122.6" r="2.2" opacity=".35"/>
<circle class="sP" cx="167.9" cy="145.8" r="2.2" opacity=".35"/>
<circle class="sP" cx="140.6" cy="167.8" r="2.2" opacity=".35"/>
<circle class="sP" cx="117.3" cy="133.9" r="2.2" opacity=".35"/>
<circle class="sP" cx="109.3" cy="145.7" r="2.2" opacity=".35"/>
<circle class="sP" cx="144.6" cy="135.0" r="2.2" opacity=".35"/>
<circle class="sP" cx="120.0" cy="150.4" r="2.2" opacity=".35"/>
<circle class="sP" cx="134.6" cy="129.3" r="2.2" opacity=".35"/>
<circle class="sP" cx="144.5" cy="116.1" r="2.2" opacity=".35"/>
<circle class="sP" cx="165.8" cy="85.2" r="2.2" opacity=".35"/>
<circle class="sP" cx="233.9" cy="81.1" r="2.2" opacity=".35"/>
<circle class="sP" cx="182.6" cy="111.6" r="2.2" opacity=".35"/>
<circle class="sP" cx="119.7" cy="140.6" r="2.2" opacity=".35"/>
<circle class="sP" cx="134.8" cy="170.2" r="2.2" opacity=".35"/>
<circle class="sP" cx="176.0" cy="122.4" r="2.2" opacity=".35"/>
<circle class="sP" cx="243.0" cy="31.7" r="2.2" opacity=".35"/>
<circle class="sP" cx="89.8" cy="182.6" r="2.2" opacity=".35"/>
<circle class="sP" cx="187.5" cy="63.4" r="2.2" opacity=".35"/>
<circle class="sP" cx="212.8" cy="98.2" r="2.2" opacity=".35"/>
<circle class="sP" cx="264.3" cy="46.5" r="2.2" opacity=".35"/>
<circle class="sP" cx="171.7" cy="173.0" r="2.2" opacity=".35"/>
<circle class="sP" cx="200.1" cy="80.7" r="2.2" opacity=".35"/>
<circle class="sP" cx="239.3" cy="114.6" r="2.2" opacity=".35"/>
<circle class="sP" cx="280.7" cy="74.0" r="2.2" opacity=".35"/>
<circle class="sP" cx="159.3" cy="131.6" r="2.2" opacity=".35"/>
<circle class="sP" cx="200.9" cy="128.4" r="2.2" opacity=".35"/>
<circle class="sP" cx="169.0" cy="133.6" r="2.2" opacity=".35"/>
<circle class="sP" cx="194.3" cy="92.8" r="2.2" opacity=".35"/>
<circle class="sP" cx="121.2" cy="160.0" r="2.2" opacity=".35"/>
<circle class="sP" cx="144.6" cy="158.0" r="2.2" opacity=".35"/>
<circle class="sP" cx="135.6" cy="139.0" r="2.2" opacity=".35"/>
<circle class="sP" cx="132.0" cy="140.0" r="2.2" opacity=".35"/>
<circle class="sP" cx="295.0" cy="31.7" r="2.2" opacity=".35"/>
<circle class="sP" cx="115.6" cy="165.1" r="2.2" opacity=".35"/>
<circle class="sP" cx="175.2" cy="128.2" r="2.2" opacity=".35"/>
<circle class="sP" cx="147.5" cy="152.9" r="2.2" opacity=".35"/>
<circle class="sP" cx="163.5" cy="120.1" r="2.2" opacity=".35"/>
<circle class="sP" cx="182.6" cy="93.8" r="2.2" opacity=".35"/>
<circle class="sP" cx="131.1" cy="177.9" r="2.2" opacity=".35"/>
<circle class="sP" cx="142.2" cy="164.4" r="2.2" opacity=".35"/>
<circle class="sP" cx="133.7" cy="144.4" r="2.2" opacity=".35"/>
<circle class="sP" cx="250.1" cy="91.0" r="2.2" opacity=".35"/>
<circle class="sP" cx="215.1" cy="95.3" r="2.2" opacity=".35"/>
<circle class="sP" cx="182.2" cy="132.2" r="2.2" opacity=".35"/>
<circle class="sP" cx="160.9" cy="124.4" r="2.2" opacity=".35"/>
<circle class="sP" cx="236.0" cy="54.9" r="2.2" opacity=".35"/>
<circle class="sP" cx="370.5" cy="31.7" r="2.2" opacity=".35"/>
<circle class="sP" cx="261.8" cy="36.9" r="2.2" opacity=".35"/>
<circle class="sP" cx="110.0" cy="145.8" r="2.2" opacity=".35"/>
<circle class="sP" cx="245.1" cy="97.1" r="2.2" opacity=".35"/>
<circle class="sP" cx="200.2" cy="119.4" r="2.2" opacity=".35"/>
<circle class="sP" cx="163.6" cy="115.6" r="2.2" opacity=".35"/>
<circle class="sP" cx="227.8" cy="80.8" r="2.2" opacity=".35"/>
<circle class="sP" cx="344.9" cy="31.7" r="2.2" opacity=".35"/>
<circle class="sP" cx="137.4" cy="147.1" r="2.2" opacity=".35"/>
<circle class="sP" cx="127.8" cy="139.3" r="2.2" opacity=".35"/>
<circle class="sP" cx="104.2" cy="168.6" r="2.2" opacity=".35"/>
<circle class="sP" cx="142.4" cy="127.6" r="2.2" opacity=".35"/>
<circle class="sP" cx="329.3" cy="31.7" r="2.2" opacity=".35"/>
<circle class="sP" cx="189.3" cy="91.6" r="2.2" opacity=".35"/>
<circle class="sP" cx="190.8" cy="101.5" r="2.2" opacity=".35"/>
<circle class="sP" cx="212.0" cy="118.1" r="2.2" opacity=".35"/>
<circle class="sP" cx="207.5" cy="119.2" r="2.2" opacity=".35"/>
<circle class="sP" cx="217.8" cy="79.2" r="2.2" opacity=".35"/>
<circle class="sP" cx="310.2" cy="31.7" r="2.2" opacity=".35"/>
<circle class="sP" cx="170.0" cy="146.8" r="2.2" opacity=".35"/>
<circle class="sP" cx="237.8" cy="73.0" r="2.2" opacity=".35"/>
<circle class="sP" cx="102.6" cy="174.8" r="2.2" opacity=".35"/>
<circle class="sP" cx="179.0" cy="115.7" r="2.2" opacity=".35"/>
<circle class="sP" cx="189.0" cy="131.3" r="2.2" opacity=".35"/>
<circle class="sP" cx="155.9" cy="170.6" r="2.2" opacity=".35"/>
<circle class="sP" cx="278.9" cy="83.2" r="2.2" opacity=".35"/>
<circle class="sP" cx="218.4" cy="76.7" r="2.2" opacity=".35"/>
<circle class="sP" cx="175.5" cy="117.7" r="2.2" opacity=".35"/>
<circle class="sP" cx="446.5" cy="31.7" r="2.2" opacity=".35"/>
<circle class="sP" cx="180.3" cy="99.0" r="2.2" opacity=".35"/>
<circle class="sP" cx="213.8" cy="103.6" r="2.2" opacity=".35"/>
<circle class="sP" cx="154.8" cy="121.0" r="2.2" opacity=".35"/>
<circle class="sP" cx="120.8" cy="122.2" r="2.2" opacity=".35"/>
<circle class="sP" cx="144.8" cy="148.5" r="2.2" opacity=".35"/>
<circle class="sP" cx="200.1" cy="128.9" r="2.2" opacity=".35"/>
<circle class="sP" cx="195.9" cy="113.8" r="2.2" opacity=".35"/>
<circle class="sP" cx="154.9" cy="114.0" r="2.2" opacity=".35"/>
<circle class="sP" cx="182.7" cy="114.5" r="2.2" opacity=".35"/>
<circle class="sP" cx="136.6" cy="138.9" r="2.2" opacity=".35"/>
<circle class="sP" cx="162.6" cy="110.1" r="2.2" opacity=".35"/>
<circle class="sP" cx="268.5" cy="73.5" r="2.2" opacity=".35"/>
<circle class="sP" cx="161.9" cy="101.9" r="2.2" opacity=".35"/>
<circle class="sP" cx="200.1" cy="107.4" r="2.2" opacity=".35"/>
<circle class="sP" cx="99.6" cy="176.0" r="2.2" opacity=".35"/>
<circle class="sP" cx="134.0" cy="153.5" r="2.2" opacity=".35"/>
<circle class="sP" cx="151.9" cy="96.1" r="2.2" opacity=".35"/>
<circle class="sP" cx="229.4" cy="103.6" r="2.2" opacity=".35"/>
<circle class="sP" cx="312.8" cy="42.6" r="2.2" opacity=".35"/>
<circle class="sP" cx="286.3" cy="66.0" r="2.2" opacity=".35"/>
<circle class="sP" cx="316.8" cy="31.7" r="2.2" opacity=".35"/>
<circle class="sP" cx="136.2" cy="147.7" r="2.2" opacity=".35"/>
<circle class="sP" cx="235.7" cy="103.6" r="2.2" opacity=".35"/>
<circle class="sP" cx="222.5" cy="90.1" r="2.2" opacity=".35"/>
<circle class="sP" cx="261.2" cy="59.4" r="2.2" opacity=".35"/>
<circle class="sP" cx="158.6" cy="135.4" r="2.2" opacity=".35"/>
<circle class="sP" cx="160.4" cy="125.2" r="2.2" opacity=".35"/>
<circle class="sP" cx="159.8" cy="166.7" r="2.2" opacity=".35"/>
<circle class="sP" cx="142.5" cy="168.0" r="2.2" opacity=".35"/>
<circle class="sP" cx="328.0" cy="31.7" r="2.2" opacity=".35"/>
<circle class="sP" cx="211.1" cy="86.2" r="2.2" opacity=".35"/>
<circle class="sP" cx="138.7" cy="134.5" r="2.2" opacity=".35"/>
<circle class="sP" cx="198.3" cy="109.5" r="2.2" opacity=".35"/>
<circle class="sP" cx="212.1" cy="71.9" r="2.2" opacity=".35"/>
<circle class="sP" cx="159.9" cy="125.7" r="2.2" opacity=".35"/>
<circle class="sP" cx="187.6" cy="87.5" r="2.2" opacity=".35"/>
<circle class="sP" cx="194.2" cy="142.8" r="2.2" opacity=".35"/>
<circle class="sP" cx="256.4" cy="63.1" r="2.2" opacity=".35"/>
<circle class="sP" cx="269.2" cy="61.1" r="2.2" opacity=".35"/>
<circle class="sP" cx="141.5" cy="130.5" r="2.2" opacity=".35"/>
<circle class="sP" cx="194.1" cy="138.7" r="2.2" opacity=".35"/>
<circle class="sP" cx="450.6" cy="31.7" r="2.2" opacity=".35"/>
<circle class="sP" cx="160.1" cy="144.3" r="2.2" opacity=".35"/>
<circle class="sP" cx="195.3" cy="81.7" r="2.2" opacity=".35"/>
<circle class="sP" cx="142.1" cy="145.6" r="2.2" opacity=".35"/>
<circle class="sP" cx="208.1" cy="126.3" r="2.2" opacity=".35"/>
<circle class="sP" cx="476.3" cy="31.7" r="2.2" opacity=".35"/>
<circle class="sP" cx="225.1" cy="86.1" r="2.2" opacity=".35"/>
<circle class="sP" cx="203.9" cy="122.1" r="2.2" opacity=".35"/>
<circle class="sP" cx="121.7" cy="168.9" r="2.2" opacity=".35"/>
<circle class="sP" cx="198.2" cy="95.1" r="2.2" opacity=".35"/>
<circle class="sP" cx="530.0" cy="31.7" r="2.2" opacity=".35"/>
<circle class="sP" cx="254.7" cy="77.4" r="2.2" opacity=".35"/>
<circle class="sP" cx="255.9" cy="64.1" r="2.2" opacity=".35"/>
<circle class="sP" cx="134.9" cy="135.1" r="2.2" opacity=".35"/>
<circle class="sP" cx="346.9" cy="31.7" r="2.2" opacity=".35"/>
<circle class="sP" cx="126.5" cy="150.7" r="2.2" opacity=".35"/>
<circle class="sP" cx="163.5" cy="86.2" r="2.2" opacity=".35"/>
<circle class="sP" cx="219.2" cy="101.2" r="2.2" opacity=".35"/>
<circle class="sP" cx="148.3" cy="128.2" r="2.2" opacity=".35"/>
<circle class="sP" cx="162.8" cy="123.3" r="2.2" opacity=".35"/>
<circle class="sP" cx="322.2" cy="34.8" r="2.2" opacity=".35"/>
<circle class="sP" cx="333.8" cy="37.0" r="2.2" opacity=".35"/>
<circle class="sP" cx="237.4" cy="67.8" r="2.2" opacity=".35"/>
<circle class="sP" cx="175.9" cy="98.7" r="2.2" opacity=".35"/>
<circle class="sP" cx="139.1" cy="129.6" r="2.2" opacity=".35"/>
<circle class="sP" cx="229.4" cy="58.9" r="2.2" opacity=".35"/>
<circle class="sP" cx="171.3" cy="105.6" r="2.2" opacity=".35"/>
<circle class="sP" cx="396.8" cy="31.7" r="2.2" opacity=".35"/>
<circle class="sP" cx="202.0" cy="113.5" r="2.2" opacity=".35"/>
<circle class="sP" cx="144.8" cy="141.7" r="2.2" opacity=".35"/>
<circle class="sP" cx="144.5" cy="141.7" r="2.2" opacity=".35"/>
<circle class="sP" cx="241.9" cy="99.2" r="2.2" opacity=".35"/>
<circle class="sP" cx="225.7" cy="97.2" r="2.2" opacity=".35"/>
<circle class="sP" cx="335.3" cy="31.7" r="2.2" opacity=".35"/>
<circle class="sP" cx="139.7" cy="141.3" r="2.2" opacity=".35"/>
<circle class="sP" cx="157.8" cy="90.2" r="2.2" opacity=".35"/>
<circle class="sP" cx="142.2" cy="101.1" r="2.2" opacity=".35"/>
<circle class="sP" cx="217.5" cy="105.1" r="2.2" opacity=".35"/>
<circle class="sP" cx="141.8" cy="177.5" r="2.2" opacity=".35"/>
<circle class="sP" cx="214.4" cy="77.8" r="2.2" opacity=".35"/>
<circle class="sP" cx="158.3" cy="172.2" r="2.2" opacity=".35"/>
<circle class="sP" cx="289.1" cy="31.7" r="2.2" opacity=".35"/>
<circle class="sP" cx="139.6" cy="152.1" r="2.2" opacity=".35"/>
<circle class="sP" cx="119.0" cy="120.8" r="2.2" opacity=".35"/>
<circle class="sP" cx="107.0" cy="149.8" r="2.2" opacity=".35"/>
<circle class="sP" cx="84.8" cy="153.6" r="2.2" opacity=".35"/>
<circle class="sP" cx="136.7" cy="157.8" r="2.2" opacity=".35"/>
<circle class="sP" cx="109.7" cy="191.7" r="2.2" opacity=".35"/>
<circle class="sP" cx="150.3" cy="152.6" r="2.2" opacity=".35"/>
<circle class="sP" cx="131.9" cy="172.5" r="2.2" opacity=".35"/>
<circle class="sP" cx="289.5" cy="37.3" r="2.2" opacity=".35"/>
<circle class="sP" cx="124.7" cy="167.1" r="2.2" opacity=".35"/>
<circle class="sP" cx="154.2" cy="144.9" r="2.2" opacity=".35"/>
<circle class="sP" cx="148.4" cy="106.8" r="2.2" opacity=".35"/>
<circle class="sP" cx="162.1" cy="132.8" r="2.2" opacity=".35"/>
<circle class="sP" cx="171.8" cy="113.2" r="2.2" opacity=".35"/>
<circle class="sP" cx="219.2" cy="45.6" r="2.2" opacity=".35"/>
<circle class="sP" cx="276.4" cy="31.7" r="2.2" opacity=".35"/>
<circle class="sP" cx="186.3" cy="98.8" r="2.2" opacity=".35"/>
<circle class="sP" cx="197.2" cy="53.6" r="2.2" opacity=".35"/>
<circle class="sP" cx="155.9" cy="123.3" r="2.2" opacity=".35"/>
<circle class="sP" cx="181.7" cy="105.2" r="2.2" opacity=".35"/>
<circle class="sP" cx="149.0" cy="145.2" r="2.2" opacity=".35"/>
<circle class="sP" cx="119.9" cy="151.3" r="2.2" opacity=".35"/>
<circle class="sP" cx="326.5" cy="31.7" r="2.2" opacity=".35"/>
<circle class="sP" cx="169.0" cy="126.7" r="2.2" opacity=".35"/>
<circle class="sP" cx="208.5" cy="136.8" r="2.2" opacity=".35"/>
<circle class="sP" cx="201.8" cy="97.4" r="2.2" opacity=".35"/>
<circle class="sP" cx="158.2" cy="171.0" r="2.2" opacity=".35"/>
<circle class="sP" cx="233.3" cy="106.4" r="2.2" opacity=".35"/>
<circle class="sP" cx="216.3" cy="117.0" r="2.2" opacity=".35"/>
<circle class="sP" cx="210.7" cy="93.3" r="2.2" opacity=".35"/>
<circle class="sP" cx="144.3" cy="147.9" r="2.2" opacity=".35"/>
<circle class="sP" cx="248.3" cy="80.4" r="2.2" opacity=".35"/>
<circle class="sP" cx="172.8" cy="137.6" r="2.2" opacity=".35"/>
<circle class="sP" cx="174.4" cy="131.5" r="2.2" opacity=".35"/>
<circle class="sP" cx="215.2" cy="69.7" r="2.2" opacity=".35"/>
<circle class="sP" cx="118.7" cy="157.7" r="2.2" opacity=".35"/>
<circle class="sP" cx="194.9" cy="121.9" r="2.2" opacity=".35"/>
<circle class="sP" cx="250.2" cy="86.6" r="2.2" opacity=".35"/>
<circle class="sP" cx="516.4" cy="31.7" r="2.2" opacity=".35"/>
<circle class="sP" cx="143.7" cy="145.0" r="2.2" opacity=".35"/>
<circle class="sP" cx="153.9" cy="111.2" r="2.2" opacity=".35"/>
<circle class="sP" cx="245.2" cy="69.8" r="2.2" opacity=".35"/>
<circle class="sP" cx="242.5" cy="80.5" r="2.2" opacity=".35"/>
<circle class="sP" cx="209.5" cy="71.6" r="2.2" opacity=".35"/>
<circle class="sP" cx="134.8" cy="178.7" r="2.2" opacity=".35"/>
<circle class="sP" cx="214.7" cy="83.7" r="2.2" opacity=".35"/>
<circle class="sP" cx="113.7" cy="189.6" r="2.2" opacity=".35"/>
<circle class="sP" cx="168.3" cy="109.7" r="2.2" opacity=".35"/>
<circle class="sP" cx="127.6" cy="179.7" r="2.2" opacity=".35"/>
<circle class="sP" cx="135.0" cy="144.3" r="2.2" opacity=".35"/>
<circle class="sP" cx="142.8" cy="104.2" r="2.2" opacity=".35"/>
<circle class="sP" cx="138.1" cy="109.8" r="2.2" opacity=".35"/>
<circle class="sP" cx="268.8" cy="31.7" r="2.2" opacity=".35"/>
<circle class="sP" cx="289.0" cy="31.7" r="2.2" opacity=".35"/>
<circle class="sP" cx="206.6" cy="97.1" r="2.2" opacity=".35"/>
<circle class="sP" cx="168.8" cy="120.8" r="2.2" opacity=".35"/>
<circle class="sP" cx="174.6" cy="92.0" r="2.2" opacity=".35"/>
<circle class="sP" cx="121.8" cy="133.6" r="2.2" opacity=".35"/>
<circle class="sP" cx="304.0" cy="45.5" r="2.2" opacity=".35"/>
<circle class="sP" cx="248.3" cy="80.3" r="2.2" opacity=".35"/>
<circle class="sP" cx="220.4" cy="80.5" r="2.2" opacity=".35"/>
<circle class="sP" cx="175.5" cy="120.2" r="2.2" opacity=".35"/>
<circle class="sP" cx="260.3" cy="33.9" r="2.2" opacity=".35"/>
<circle class="sP" cx="151.2" cy="153.7" r="2.2" opacity=".35"/>
<circle class="sP" cx="205.5" cy="102.7" r="2.2" opacity=".35"/>
<circle class="sP" cx="255.8" cy="56.6" r="2.2" opacity=".35"/>
<circle class="sP" cx="126.8" cy="139.1" r="2.2" opacity=".35"/>
<circle class="sP" cx="211.2" cy="96.8" r="2.2" opacity=".35"/>
<circle class="sP" cx="386.7" cy="31.7" r="2.2" opacity=".35"/>
<circle class="sP" cx="115.2" cy="184.3" r="2.2" opacity=".35"/>
<circle class="sP" cx="269.3" cy="88.4" r="2.2" opacity=".35"/>
<circle class="sP" cx="207.1" cy="94.8" r="2.2" opacity=".35"/>
<circle class="sP" cx="121.3" cy="156.4" r="2.2" opacity=".35"/>
<circle class="sP" cx="406.5" cy="31.7" r="2.2" opacity=".35"/>
<circle class="sP" cx="338.9" cy="31.7" r="2.2" opacity=".35"/>
<circle class="sP" cx="246.4" cy="56.5" r="2.2" opacity=".35"/>
<circle class="sP" cx="143.9" cy="111.5" r="2.2" opacity=".35"/>
<circle class="sP" cx="104.8" cy="189.7" r="2.2" opacity=".35"/>
<circle class="sP" cx="121.6" cy="127.2" r="2.2" opacity=".35"/>
<circle class="sP" cx="248.6" cy="70.0" r="2.2" opacity=".35"/>
<circle class="sP" cx="198.4" cy="138.2" r="2.2" opacity=".35"/>
<circle class="sP" cx="139.9" cy="132.5" r="2.2" opacity=".35"/>
<circle class="sP" cx="250.1" cy="72.0" r="2.2" opacity=".35"/>
<circle class="sP" cx="157.9" cy="147.4" r="2.2" opacity=".35"/>
<circle class="sP" cx="162.7" cy="137.2" r="2.2" opacity=".35"/>
<circle class="sP" cx="217.1" cy="72.0" r="2.2" opacity=".35"/>
<circle class="sP" cx="186.7" cy="98.3" r="2.2" opacity=".35"/>
<circle class="sP" cx="173.9" cy="94.0" r="2.2" opacity=".35"/>
<circle class="sP" cx="183.7" cy="134.6" r="2.2" opacity=".35"/>
<circle class="sP" cx="166.6" cy="152.9" r="2.2" opacity=".35"/>
<circle class="sP" cx="163.0" cy="139.6" r="2.2" opacity=".35"/>
<circle class="sP" cx="148.5" cy="142.6" r="2.2" opacity=".35"/>
<circle class="sP" cx="137.4" cy="182.4" r="2.2" opacity=".35"/>
<circle class="sP" cx="82.8" cy="193.6" r="2.2" opacity=".35"/>
<circle class="sP" cx="156.8" cy="120.4" r="2.2" opacity=".35"/>
<circle class="sP" cx="147.0" cy="153.8" r="2.2" opacity=".35"/>
<circle class="sP" cx="198.2" cy="82.8" r="2.2" opacity=".35"/>
<circle class="sP" cx="226.2" cy="69.3" r="2.2" opacity=".35"/>
<circle class="sP" cx="167.2" cy="116.1" r="2.2" opacity=".35"/>
<circle class="sP" cx="181.5" cy="122.1" r="2.2" opacity=".35"/>
<circle class="sP" cx="202.4" cy="100.6" r="2.2" opacity=".35"/>
<circle class="sP" cx="191.3" cy="94.2" r="2.2" opacity=".35"/>
<circle class="sP" cx="229.7" cy="72.0" r="2.2" opacity=".35"/>
<circle class="sP" cx="278.8" cy="75.8" r="2.2" opacity=".35"/>
<circle class="sP" cx="166.2" cy="113.9" r="2.2" opacity=".35"/>
<circle class="sP" cx="187.4" cy="119.6" r="2.2" opacity=".35"/>
<circle class="sP" cx="404.3" cy="31.7" r="2.2" opacity=".35"/>
<circle class="sP" cx="300.4" cy="31.7" r="2.2" opacity=".35"/>
<circle class="sP" cx="118.3" cy="177.6" r="2.2" opacity=".35"/>
<circle class="sP" cx="152.3" cy="144.0" r="2.2" opacity=".35"/>
<circle class="sP" cx="136.6" cy="125.7" r="2.2" opacity=".35"/>
<circle class="sP" cx="215.2" cy="89.8" r="2.2" opacity=".35"/>
<circle class="sP" cx="117.0" cy="134.4" r="2.2" opacity=".35"/>
<circle class="sP" cx="228.4" cy="95.5" r="2.2" opacity=".35"/>
<circle class="sP" cx="309.2" cy="31.7" r="2.2" opacity=".35"/>
<circle class="sP" cx="162.5" cy="145.8" r="2.2" opacity=".35"/>
<circle class="sP" cx="205.9" cy="73.5" r="2.2" opacity=".35"/>
<circle class="sP" cx="114.9" cy="156.0" r="2.2" opacity=".35"/>
<circle class="sP" cx="126.8" cy="140.4" r="2.2" opacity=".35"/>
<circle class="sP" cx="272.0" cy="41.6" r="2.2" opacity=".35"/>
<circle class="sP" cx="120.8" cy="160.1" r="2.2" opacity=".35"/>
<circle class="sP" cx="530.0" cy="31.7" r="2.2" opacity=".35"/>
<circle class="sP" cx="120.4" cy="154.6" r="2.2" opacity=".35"/>
<circle class="sP" cx="172.6" cy="93.4" r="2.2" opacity=".35"/>
<circle class="sP" cx="265.0" cy="84.0" r="2.2" opacity=".35"/>
<circle class="sP" cx="161.3" cy="116.1" r="2.2" opacity=".35"/>
<circle class="sP" cx="188.1" cy="105.8" r="2.2" opacity=".35"/>
<circle class="sP" cx="213.2" cy="122.2" r="2.2" opacity=".35"/>
<circle class="sP" cx="425.2" cy="31.7" r="2.2" opacity=".35"/>
<circle class="sP" cx="227.7" cy="96.3" r="2.2" opacity=".35"/>
<circle class="sP" cx="160.6" cy="95.8" r="2.2" opacity=".35"/>
<circle class="sP" cx="151.1" cy="114.4" r="2.2" opacity=".35"/>
<circle class="sP" cx="136.0" cy="184.8" r="2.2" opacity=".35"/>
<circle class="sP" cx="130.6" cy="146.4" r="2.2" opacity=".35"/>
<circle class="sP" cx="122.2" cy="97.0" r="2.2" opacity=".35"/>
<circle class="sP" cx="126.4" cy="152.9" r="2.2" opacity=".35"/>
<circle class="sP" cx="164.6" cy="117.5" r="2.2" opacity=".35"/>
<circle class="sP" cx="323.9" cy="31.7" r="2.2" opacity=".35"/>
<circle class="sP" cx="277.8" cy="31.7" r="2.2" opacity=".35"/>
<circle class="sP" cx="119.6" cy="174.4" r="2.2" opacity=".35"/>
<circle class="sP" cx="169.8" cy="132.5" r="2.2" opacity=".35"/>
<circle class="sP" cx="99.9" cy="140.9" r="2.2" opacity=".35"/>
<circle class="sP" cx="148.5" cy="168.6" r="2.2" opacity=".35"/>
<circle class="sP" cx="207.9" cy="75.7" r="2.2" opacity=".35"/>
<circle class="sP" cx="187.0" cy="115.8" r="2.2" opacity=".35"/>
<circle class="sP" cx="148.9" cy="146.4" r="2.2" opacity=".35"/>
<circle class="sP" cx="181.3" cy="115.4" r="2.2" opacity=".35"/>
<circle class="sP" cx="178.0" cy="99.3" r="2.2" opacity=".35"/>
<circle class="sP" cx="152.9" cy="117.7" r="2.2" opacity=".35"/>
<circle class="sP" cx="254.5" cy="70.2" r="2.2" opacity=".35"/>
<circle class="sP" cx="208.9" cy="105.3" r="2.2" opacity=".35"/>
<circle class="sP" cx="206.7" cy="82.1" r="2.2" opacity=".35"/>
<circle class="sP" cx="274.1" cy="58.0" r="2.2" opacity=".35"/>
<circle class="sP" cx="127.4" cy="129.8" r="2.2" opacity=".35"/>
<circle class="sP" cx="209.5" cy="157.9" r="2.2" opacity=".35"/>
<circle class="sP" cx="216.5" cy="127.9" r="2.2" opacity=".35"/>
<circle class="sP" cx="200.5" cy="74.3" r="2.2" opacity=".35"/>
<circle class="sP" cx="256.2" cy="43.6" r="2.2" opacity=".35"/>
<circle class="sP" cx="192.5" cy="95.2" r="2.2" opacity=".35"/>
<circle class="sP" cx="409.2" cy="31.7" r="2.2" opacity=".35"/>
<circle class="sP" cx="116.6" cy="173.2" r="2.2" opacity=".35"/>
<circle class="sP" cx="199.2" cy="80.9" r="2.2" opacity=".35"/>
<circle class="sP" cx="160.7" cy="146.8" r="2.2" opacity=".35"/>
<circle class="sP" cx="217.0" cy="102.0" r="2.2" opacity=".35"/>
<circle class="sP" cx="212.9" cy="85.4" r="2.2" opacity=".35"/>
<circle class="sP" cx="170.1" cy="104.7" r="2.2" opacity=".35"/>
<circle class="sP" cx="138.3" cy="153.3" r="2.2" opacity=".35"/>
<circle class="sP" cx="206.9" cy="101.9" r="2.2" opacity=".35"/>
<circle class="sP" cx="98.8" cy="169.4" r="2.2" opacity=".35"/>
<circle class="sP" cx="140.3" cy="163.4" r="2.2" opacity=".35"/>
<circle class="sP" cx="267.9" cy="59.8" r="2.2" opacity=".35"/>
<circle class="sP" cx="192.6" cy="108.6" r="2.2" opacity=".35"/>
<circle class="sP" cx="243.4" cy="76.1" r="2.2" opacity=".35"/>
<circle class="sP" cx="146.9" cy="129.5" r="2.2" opacity=".35"/>
<circle class="sP" cx="176.7" cy="106.0" r="2.2" opacity=".35"/>
<circle class="sP" cx="285.5" cy="39.4" r="2.2" opacity=".35"/>
<circle class="sP" cx="99.5" cy="166.8" r="2.2" opacity=".35"/>
<circle class="sP" cx="185.9" cy="141.2" r="2.2" opacity=".35"/>
<circle class="sP" cx="143.5" cy="136.6" r="2.2" opacity=".35"/>
<circle class="sP" cx="154.9" cy="168.2" r="2.2" opacity=".35"/>
<circle class="sP" cx="119.5" cy="167.3" r="2.2" opacity=".35"/>
<circle class="sP" cx="212.9" cy="91.0" r="2.2" opacity=".35"/>
<circle class="sP" cx="165.5" cy="102.6" r="2.2" opacity=".35"/>
<circle class="sP" cx="129.5" cy="137.8" r="2.2" opacity=".35"/>
<circle class="sP" cx="170.0" cy="89.2" r="2.2" opacity=".35"/>
<circle class="sP" cx="308.4" cy="31.7" r="2.2" opacity=".35"/>
<circle class="sP" cx="139.5" cy="140.9" r="2.2" opacity=".35"/>
<circle class="sP" cx="151.2" cy="163.6" r="2.2" opacity=".35"/>
<circle class="sP" cx="247.7" cy="97.8" r="2.2" opacity=".35"/>
<circle class="sP" cx="269.4" cy="60.9" r="2.2" opacity=".35"/>
<circle class="sP" cx="326.5" cy="31.7" r="2.2" opacity=".35"/>
<circle class="sP" cx="219.3" cy="98.1" r="2.2" opacity=".35"/>
<circle class="sP" cx="143.9" cy="142.7" r="2.2" opacity=".35"/>
<circle class="sP" cx="136.9" cy="134.5" r="2.2" opacity=".35"/>
<circle class="sP" cx="255.9" cy="57.7" r="2.2" opacity=".35"/>
<circle class="sP" cx="281.9" cy="37.0" r="2.2" opacity=".35"/>
<circle class="sP" cx="238.8" cy="82.6" r="2.2" opacity=".35"/>
<circle class="sP" cx="214.7" cy="91.1" r="2.2" opacity=".35"/>
<circle class="sP" cx="233.1" cy="85.6" r="2.2" opacity=".35"/>
<circle class="sP" cx="252.3" cy="50.1" r="2.2" opacity=".35"/>
<circle class="sP" cx="195.0" cy="100.3" r="2.2" opacity=".35"/>
<circle class="sP" cx="199.1" cy="102.8" r="2.2" opacity=".35"/>
<circle class="sP" cx="121.7" cy="148.4" r="2.2" opacity=".35"/>
<circle class="sP" cx="160.8" cy="122.8" r="2.2" opacity=".35"/>
<circle class="sP" cx="273.0" cy="66.3" r="2.2" opacity=".35"/>
<circle class="sP" cx="170.1" cy="134.9" r="2.2" opacity=".35"/>
<circle class="sP" cx="212.2" cy="125.7" r="2.2" opacity=".35"/>
<circle class="sP" cx="274.5" cy="87.3" r="2.2" opacity=".35"/>
<circle class="sP" cx="333.2" cy="31.7" r="2.2" opacity=".35"/>
<circle class="sP" cx="191.0" cy="119.8" r="2.2" opacity=".35"/>
<circle class="sP" cx="119.5" cy="179.4" r="2.2" opacity=".35"/>
<circle class="sP" cx="164.1" cy="93.6" r="2.2" opacity=".35"/>
<circle class="sP" cx="206.7" cy="53.5" r="2.2" opacity=".35"/>
<circle class="sP" cx="146.8" cy="143.3" r="2.2" opacity=".35"/>
<circle class="sP" cx="229.7" cy="87.7" r="2.2" opacity=".35"/>
<circle class="sP" cx="243.7" cy="88.1" r="2.2" opacity=".35"/>
<circle class="sP" cx="100.6" cy="148.6" r="2.2" opacity=".35"/>
<circle class="sP" cx="132.7" cy="123.0" r="2.2" opacity=".35"/>
<circle class="sP" cx="137.4" cy="179.7" r="2.2" opacity=".35"/>
<circle class="sP" cx="161.0" cy="135.0" r="2.2" opacity=".35"/>
<circle class="sP" cx="218.8" cy="95.1" r="2.2" opacity=".35"/>
<circle class="sP" cx="134.0" cy="124.4" r="2.2" opacity=".35"/>
<circle class="sP" cx="368.8" cy="31.7" r="2.2" opacity=".35"/>
<circle class="sP" cx="160.1" cy="117.8" r="2.2" opacity=".35"/>
<circle class="sP" cx="146.9" cy="160.2" r="2.2" opacity=".35"/>
<circle class="sP" cx="136.4" cy="131.7" r="2.2" opacity=".35"/>
<circle class="sP" cx="172.7" cy="131.3" r="2.2" opacity=".35"/>
<circle class="sP" cx="132.3" cy="160.8" r="2.2" opacity=".35"/>
<circle class="sP" cx="162.4" cy="88.8" r="2.2" opacity=".35"/>
<circle class="sP" cx="128.1" cy="131.7" r="2.2" opacity=".35"/>
<circle class="sP" cx="139.3" cy="130.5" r="2.2" opacity=".35"/>
<circle class="sP" cx="158.6" cy="122.4" r="2.2" opacity=".35"/>
<circle class="sP" cx="205.3" cy="98.3" r="2.2" opacity=".35"/>
<circle class="sP" cx="260.8" cy="56.7" r="2.2" opacity=".35"/>
<circle class="sP" cx="142.8" cy="136.5" r="2.2" opacity=".35"/>
<circle class="sP" cx="164.5" cy="128.9" r="2.2" opacity=".35"/>
<circle class="sP" cx="121.2" cy="121.2" r="2.2" opacity=".35"/>
<circle class="sP" cx="257.1" cy="75.0" r="2.2" opacity=".35"/>
<circle class="sP" cx="321.1" cy="31.7" r="2.2" opacity=".35"/>
<circle class="sP" cx="236.8" cy="90.2" r="2.2" opacity=".35"/>
<circle class="sP" cx="530.0" cy="31.7" r="2.2" opacity=".35"/>
<circle class="sP" cx="139.0" cy="176.3" r="2.2" opacity=".35"/>
<circle class="sP" cx="219.9" cy="88.3" r="2.2" opacity=".35"/>
<circle class="sP" cx="300.1" cy="31.7" r="2.2" opacity=".35"/>
<circle class="sP" cx="156.9" cy="139.3" r="2.2" opacity=".35"/>
<circle class="sP" cx="196.5" cy="95.1" r="2.2" opacity=".35"/>
<circle class="sP" cx="250.0" cy="78.1" r="2.2" opacity=".35"/>
<circle class="sP" cx="118.5" cy="105.3" r="2.2" opacity=".35"/>
<circle class="sP" cx="114.6" cy="156.7" r="2.2" opacity=".35"/>
<circle class="sP" cx="165.9" cy="153.3" r="2.2" opacity=".35"/>
<circle class="sP" cx="233.7" cy="84.8" r="2.2" opacity=".35"/>
<circle class="sP" cx="223.4" cy="59.6" r="2.2" opacity=".35"/>
<circle class="sP" cx="210.9" cy="86.6" r="2.2" opacity=".35"/>
<circle class="sP" cx="193.8" cy="91.7" r="2.2" opacity=".35"/>
<circle class="sP" cx="171.4" cy="134.0" r="2.2" opacity=".35"/>
<circle class="sP" cx="195.2" cy="113.8" r="2.2" opacity=".35"/>
<circle class="sP" cx="191.2" cy="123.9" r="2.2" opacity=".35"/>
<circle class="sP" cx="390.5" cy="31.7" r="2.2" opacity=".35"/>
<circle class="sP" cx="248.5" cy="74.2" r="2.2" opacity=".35"/>
<circle class="sP" cx="171.2" cy="83.6" r="2.2" opacity=".35"/>
<circle class="sP" cx="182.8" cy="127.9" r="2.2" opacity=".35"/>
<circle class="sP" cx="98.0" cy="184.1" r="2.2" opacity=".35"/>
<circle class="sP" cx="241.6" cy="70.7" r="2.2" opacity=".35"/>
<circle class="sP" cx="175.2" cy="95.9" r="2.2" opacity=".35"/>
<circle class="sP" cx="147.9" cy="136.7" r="2.2" opacity=".35"/>
<circle class="sP" cx="269.5" cy="31.7" r="2.2" opacity=".35"/>
<circle class="sP" cx="389.8" cy="31.7" r="2.2" opacity=".35"/>
<circle class="sP" cx="388.8" cy="31.7" r="2.2" opacity=".35"/>
<circle class="sP" cx="142.9" cy="139.7" r="2.2" opacity=".35"/>
<circle class="sP" cx="146.8" cy="128.0" r="2.2" opacity=".35"/>
<circle class="sP" cx="243.9" cy="66.1" r="2.2" opacity=".35"/>
<circle class="sP" cx="264.9" cy="56.9" r="2.2" opacity=".35"/>
<circle class="sP" cx="278.5" cy="44.5" r="2.2" opacity=".35"/>
<circle class="sP" cx="248.9" cy="61.5" r="2.2" opacity=".35"/>
<circle class="sP" cx="180.7" cy="90.9" r="2.2" opacity=".35"/>
<circle class="sP" cx="200.1" cy="136.8" r="2.2" opacity=".35"/>
<circle class="sP" cx="238.1" cy="31.7" r="2.2" opacity=".35"/>
<circle class="sP" cx="177.2" cy="111.3" r="2.2" opacity=".35"/>
<circle class="sP" cx="160.0" cy="104.5" r="2.2" opacity=".35"/>
<circle class="sP" cx="195.3" cy="106.2" r="2.2" opacity=".35"/>
<circle class="sP" cx="102.4" cy="160.8" r="2.2" opacity=".35"/>
<circle class="sP" cx="218.9" cy="73.8" r="2.2" opacity=".35"/>
<circle class="sP" cx="200.0" cy="66.4" r="2.2" opacity=".35"/>
<circle class="sP" cx="233.6" cy="56.0" r="2.2" opacity=".35"/>
<circle class="sP" cx="162.5" cy="123.3" r="2.2" opacity=".35"/>
<circle class="sP" cx="235.9" cy="48.5" r="2.2" opacity=".35"/>
<circle class="sP" cx="239.3" cy="83.8" r="2.2" opacity=".35"/>
<circle class="sP" cx="219.8" cy="100.7" r="2.2" opacity=".35"/>
<circle class="sP" cx="112.2" cy="134.3" r="2.2" opacity=".35"/>
<circle class="sP" cx="139.9" cy="159.5" r="2.2" opacity=".35"/>
<circle class="sP" cx="171.0" cy="163.2" r="2.2" opacity=".35"/>
<circle class="sP" cx="530.0" cy="31.7" r="2.2" opacity=".35"/>
<circle class="sP" cx="130.5" cy="134.0" r="2.2" opacity=".35"/>
<circle class="sP" cx="153.2" cy="106.8" r="2.2" opacity=".35"/>
<circle class="sP" cx="137.9" cy="121.9" r="2.2" opacity=".35"/>
<circle class="sP" cx="190.0" cy="110.3" r="2.2" opacity=".35"/>
<circle class="sP" cx="189.5" cy="69.5" r="2.2" opacity=".35"/>
<circle class="sP" cx="236.2" cy="70.2" r="2.2" opacity=".35"/>
<circle class="sP" cx="257.1" cy="59.6" r="2.2" opacity=".35"/>
<circle class="sP" cx="180.6" cy="113.5" r="2.2" opacity=".35"/>
<circle class="sP" cx="168.1" cy="99.3" r="2.2" opacity=".35"/>
<circle class="sP" cx="189.6" cy="88.4" r="2.2" opacity=".35"/>
<circle class="sP" cx="168.2" cy="127.4" r="2.2" opacity=".35"/>
<circle class="sP" cx="139.8" cy="164.8" r="2.2" opacity=".35"/>
<circle class="sP" cx="165.9" cy="111.5" r="2.2" opacity=".35"/>
<circle class="sP" cx="209.4" cy="75.4" r="2.2" opacity=".35"/>
<circle class="sP" cx="181.9" cy="125.1" r="2.2" opacity=".35"/>
<circle class="sP" cx="133.5" cy="108.6" r="2.2" opacity=".35"/>
<circle class="sP" cx="224.4" cy="109.9" r="2.2" opacity=".35"/>
<circle class="sP" cx="159.4" cy="146.7" r="2.2" opacity=".35"/>
<circle class="sP" cx="164.8" cy="121.9" r="2.2" opacity=".35"/>
<circle class="sP" cx="147.2" cy="149.7" r="2.2" opacity=".35"/>
<circle class="sP" cx="257.8" cy="73.2" r="2.2" opacity=".35"/>
<circle class="sP" cx="269.7" cy="67.9" r="2.2" opacity=".35"/>
<circle class="sP" cx="96.8" cy="166.6" r="2.2" opacity=".35"/>
<circle class="sP" cx="143.0" cy="118.8" r="2.2" opacity=".35"/>
<circle class="sP" cx="217.5" cy="67.9" r="2.2" opacity=".35"/>
<circle class="sP" cx="271.1" cy="57.3" r="2.2" opacity=".35"/>
<circle class="sP" cx="155.2" cy="119.8" r="2.2" opacity=".35"/>
<circle class="sP" cx="142.3" cy="134.5" r="2.2" opacity=".35"/>
<circle class="sP" cx="155.9" cy="126.0" r="2.2" opacity=".35"/>
<circle class="sP" cx="157.7" cy="133.3" r="2.2" opacity=".35"/>
<circle class="sP" cx="299.9" cy="57.7" r="2.2" opacity=".35"/>
<circle class="sP" cx="283.1" cy="55.8" r="2.2" opacity=".35"/>
<circle class="sP" cx="298.8" cy="39.8" r="2.2" opacity=".35"/>
<circle class="sP" cx="158.4" cy="122.1" r="2.2" opacity=".35"/>
<circle class="sP" cx="524.5" cy="31.7" r="2.2" opacity=".35"/>
<circle class="sP" cx="189.7" cy="99.2" r="2.2" opacity=".35"/>
<circle class="sP" cx="432.3" cy="31.7" r="2.2" opacity=".35"/>
<circle class="sP" cx="201.8" cy="142.8" r="2.2" opacity=".35"/>
<circle class="sP" cx="157.2" cy="129.7" r="2.2" opacity=".35"/>
<circle class="sP" cx="231.5" cy="87.8" r="2.2" opacity=".35"/>
<circle class="sP" cx="130.7" cy="151.9" r="2.2" opacity=".35"/>
<circle class="sP" cx="152.9" cy="103.6" r="2.2" opacity=".35"/>
<circle class="sP" cx="250.4" cy="69.1" r="2.2" opacity=".35"/>
<circle class="sP" cx="167.3" cy="134.9" r="2.2" opacity=".35"/>
<circle class="sP" cx="138.9" cy="126.1" r="2.2" opacity=".35"/>
<circle class="sP" cx="258.3" cy="82.9" r="2.2" opacity=".35"/>
<circle class="sP" cx="154.8" cy="161.8" r="2.2" opacity=".35"/>
<circle class="sP" cx="189.6" cy="172.8" r="2.2" opacity=".35"/>
<circle class="sP" cx="155.6" cy="140.3" r="2.2" opacity=".35"/>
<circle class="sP" cx="187.3" cy="100.3" r="2.2" opacity=".35"/>
<circle class="sP" cx="151.6" cy="98.6" r="2.2" opacity=".35"/>
<circle class="sP" cx="140.4" cy="135.8" r="2.2" opacity=".35"/>
<circle class="sP" cx="306.7" cy="47.5" r="2.2" opacity=".35"/>
<circle class="sP" cx="200.7" cy="104.3" r="2.2" opacity=".35"/>
<circle class="sP" cx="97.1" cy="140.1" r="2.2" opacity=".35"/>
<circle class="sP" cx="357.6" cy="31.7" r="2.2" opacity=".35"/>
<circle class="sP" cx="324.5" cy="31.7" r="2.2" opacity=".35"/>
<circle class="sP" cx="150.6" cy="142.9" r="2.2" opacity=".35"/>
<circle class="sP" cx="192.7" cy="119.1" r="2.2" opacity=".35"/>
<circle class="sP" cx="229.6" cy="97.6" r="2.2" opacity=".35"/>
<circle class="sP" cx="251.2" cy="80.7" r="2.2" opacity=".35"/>
<circle class="sP" cx="114.8" cy="151.1" r="2.2" opacity=".35"/>
<circle class="sP" cx="240.8" cy="79.3" r="2.2" opacity=".35"/>
<circle class="sP" cx="101.4" cy="185.8" r="2.2" opacity=".35"/>
<circle class="sP" cx="204.2" cy="85.9" r="2.2" opacity=".35"/>
<circle class="sP" cx="160.4" cy="136.9" r="2.2" opacity=".35"/>
<circle class="sP" cx="125.6" cy="129.0" r="2.2" opacity=".35"/>
<circle class="sP" cx="127.1" cy="140.7" r="2.2" opacity=".35"/>
<circle class="sP" cx="163.8" cy="125.5" r="2.2" opacity=".35"/>
<circle class="sP" cx="194.9" cy="95.0" r="2.2" opacity=".35"/>
<circle class="sP" cx="325.7" cy="31.7" r="2.2" opacity=".35"/>
<circle class="sP" cx="184.6" cy="127.4" r="2.2" opacity=".35"/>
<circle class="sP" cx="217.7" cy="67.7" r="2.2" opacity=".35"/>
<circle class="sP" cx="212.1" cy="108.3" r="2.2" opacity=".35"/>
<circle class="sP" cx="122.5" cy="159.6" r="2.2" opacity=".35"/>
<circle class="sP" cx="160.3" cy="145.8" r="2.2" opacity=".35"/>
<circle class="sP" cx="135.2" cy="146.9" r="2.2" opacity=".35"/>
<circle class="sP" cx="243.7" cy="61.5" r="2.2" opacity=".35"/>
<circle class="sP" cx="169.7" cy="128.9" r="2.2" opacity=".35"/>
<circle class="sP" cx="210.1" cy="92.7" r="2.2" opacity=".35"/>
<circle class="sP" cx="189.7" cy="106.5" r="2.2" opacity=".35"/>
<circle class="sP" cx="190.9" cy="104.0" r="2.2" opacity=".35"/>
<circle class="sP" cx="243.0" cy="78.6" r="2.2" opacity=".35"/>
<circle class="sP" cx="222.4" cy="75.9" r="2.2" opacity=".35"/>
<circle class="sP" cx="296.0" cy="36.9" r="2.2" opacity=".35"/>
<circle class="sP" cx="138.4" cy="151.4" r="2.2" opacity=".35"/>
<circle class="sP" cx="120.0" cy="133.2" r="2.2" opacity=".35"/>
<circle class="sP" cx="261.0" cy="56.1" r="2.2" opacity=".35"/>
<circle class="sP" cx="155.0" cy="127.6" r="2.2" opacity=".35"/>
<circle class="sP" cx="124.2" cy="175.9" r="2.2" opacity=".35"/>
<circle class="sP" cx="133.5" cy="101.4" r="2.2" opacity=".35"/>
<circle class="sP" cx="209.4" cy="39.4" r="2.2" opacity=".35"/>
<circle class="sP" cx="276.4" cy="52.5" r="2.2" opacity=".35"/>
<circle class="sP" cx="228.4" cy="106.8" r="2.2" opacity=".35"/>
<circle class="sP" cx="207.8" cy="78.3" r="2.2" opacity=".35"/>
<circle class="sP" cx="381.9" cy="31.7" r="2.2" opacity=".35"/>
<circle class="sP" cx="150.8" cy="129.6" r="2.2" opacity=".35"/>
<circle class="sP" cx="165.7" cy="103.7" r="2.2" opacity=".35"/>
<circle class="sP" cx="202.5" cy="99.1" r="2.2" opacity=".35"/>
<circle class="sP" cx="199.4" cy="95.2" r="2.2" opacity=".35"/>
<circle class="sP" cx="198.3" cy="117.9" r="2.2" opacity=".35"/>
<circle class="sP" cx="235.2" cy="69.3" r="2.2" opacity=".35"/>
<circle class="sP" cx="258.8" cy="59.7" r="2.2" opacity=".35"/>
<circle class="sP" cx="325.0" cy="31.7" r="2.2" opacity=".35"/>
<circle class="sP" cx="340.4" cy="31.7" r="2.2" opacity=".35"/>
<circle class="sP" cx="289.3" cy="57.0" r="2.2" opacity=".35"/>
<circle class="sP" cx="203.3" cy="118.1" r="2.2" opacity=".35"/>
<circle class="sP" cx="127.9" cy="162.6" r="2.2" opacity=".35"/>
<circle class="sP" cx="140.9" cy="122.4" r="2.2" opacity=".35"/>
<circle class="sP" cx="137.8" cy="168.8" r="2.2" opacity=".35"/>
<circle class="sP" cx="161.8" cy="142.7" r="2.2" opacity=".35"/>
<circle class="sP" cx="147.3" cy="112.4" r="2.2" opacity=".35"/>
<circle class="sP" cx="333.4" cy="31.7" r="2.2" opacity=".35"/>
<circle class="sP" cx="361.3" cy="31.7" r="2.2" opacity=".35"/>
<circle class="sP" cx="220.4" cy="105.3" r="2.2" opacity=".35"/>
<circle class="sP" cx="192.0" cy="94.9" r="2.2" opacity=".35"/>
<circle class="sP" cx="427.8" cy="31.7" r="2.2" opacity=".35"/>
<circle class="sP" cx="164.9" cy="96.7" r="2.2" opacity=".35"/>
<circle class="sP" cx="127.0" cy="170.6" r="2.2" opacity=".35"/>
<circle class="sP" cx="383.0" cy="31.7" r="2.2" opacity=".35"/>
<circle class="sP" cx="221.2" cy="126.6" r="2.2" opacity=".35"/>
<circle class="sP" cx="153.2" cy="116.0" r="2.2" opacity=".35"/>
<circle class="sP" cx="111.7" cy="119.1" r="2.2" opacity=".35"/>
<circle class="sP" cx="247.8" cy="78.7" r="2.2" opacity=".35"/>
<circle class="sP" cx="276.2" cy="63.1" r="2.2" opacity=".35"/>
<circle class="sP" cx="267.0" cy="44.4" r="2.2" opacity=".35"/>
<circle class="sP" cx="232.8" cy="83.4" r="2.2" opacity=".35"/>
<circle class="sP" cx="173.3" cy="166.6" r="2.2" opacity=".35"/>
<circle class="sP" cx="236.2" cy="91.2" r="2.2" opacity=".35"/>
<circle class="sP" cx="187.9" cy="123.5" r="2.2" opacity=".35"/>
<circle class="sP" cx="162.1" cy="152.1" r="2.2" opacity=".35"/>
<circle class="sP" cx="100.8" cy="143.3" r="2.2" opacity=".35"/>
<circle class="sP" cx="210.5" cy="98.6" r="2.2" opacity=".35"/>
<circle class="sP" cx="203.3" cy="100.1" r="2.2" opacity=".35"/>
<circle class="sP" cx="203.6" cy="131.9" r="2.2" opacity=".35"/>
<circle class="sP" cx="160.1" cy="108.6" r="2.2" opacity=".35"/>
<circle class="sP" cx="294.1" cy="35.4" r="2.2" opacity=".35"/>
<circle class="sP" cx="109.4" cy="154.0" r="2.2" opacity=".35"/>
<circle class="sP" cx="188.0" cy="99.8" r="2.2" opacity=".35"/>
<circle class="sP" cx="159.4" cy="112.1" r="2.2" opacity=".35"/>
<circle class="sP" cx="180.3" cy="126.6" r="2.2" opacity=".35"/>
<circle class="sP" cx="170.1" cy="103.7" r="2.2" opacity=".35"/>
<circle class="sP" cx="476.7" cy="31.7" r="2.2" opacity=".35"/>
<circle class="sP" cx="119.1" cy="158.2" r="2.2" opacity=".35"/>
<circle class="sP" cx="189.8" cy="116.2" r="2.2" opacity=".35"/>
<circle class="sP" cx="186.0" cy="110.3" r="2.2" opacity=".35"/>
<circle class="sP" cx="131.4" cy="131.3" r="2.2" opacity=".35"/>
<circle class="sP" cx="313.3" cy="31.7" r="2.2" opacity=".35"/>
<circle class="sP" cx="278.6" cy="69.3" r="2.2" opacity=".35"/>
<circle class="sP" cx="141.9" cy="166.0" r="2.2" opacity=".35"/>
<circle class="sP" cx="461.8" cy="31.7" r="2.2" opacity=".35"/>
<circle class="sP" cx="201.7" cy="52.6" r="2.2" opacity=".35"/>
<circle class="sP" cx="132.4" cy="135.4" r="2.2" opacity=".35"/>
<circle class="sP" cx="137.9" cy="134.5" r="2.2" opacity=".35"/>
<circle class="sP" cx="336.5" cy="36.9" r="2.2" opacity=".35"/>
<circle class="sP" cx="143.3" cy="138.7" r="2.2" opacity=".35"/>
<circle class="sP" cx="208.5" cy="161.8" r="2.2" opacity=".35"/>
<circle class="sP" cx="227.5" cy="58.5" r="2.2" opacity=".35"/>
<circle class="sP" cx="268.7" cy="61.4" r="2.2" opacity=".35"/>
<circle class="sP" cx="189.5" cy="100.3" r="2.2" opacity=".35"/>
<circle class="sP" cx="163.0" cy="104.3" r="2.2" opacity=".35"/>
<circle class="sP" cx="212.5" cy="80.8" r="2.2" opacity=".35"/>
<circle class="sP" cx="156.4" cy="91.8" r="2.2" opacity=".35"/>
<circle class="sP" cx="190.3" cy="113.2" r="2.2" opacity=".35"/>
<circle class="sP" cx="352.4" cy="31.7" r="2.2" opacity=".35"/>
<circle class="sP" cx="234.7" cy="42.9" r="2.2" opacity=".35"/>
<circle class="sP" cx="119.4" cy="160.0" r="2.2" opacity=".35"/>
<circle class="sP" cx="242.2" cy="106.8" r="2.2" opacity=".35"/>
<circle class="sP" cx="159.1" cy="141.4" r="2.2" opacity=".35"/>
<circle class="sP" cx="88.0" cy="193.5" r="2.2" opacity=".35"/>
<circle class="sP" cx="186.1" cy="83.7" r="2.2" opacity=".35"/>
<circle class="sP" cx="161.7" cy="137.1" r="2.2" opacity=".35"/>
<circle class="sP" cx="180.1" cy="125.8" r="2.2" opacity=".35"/>
<circle class="sP" cx="229.6" cy="66.8" r="2.2" opacity=".35"/>
<circle class="sP" cx="237.4" cy="73.9" r="2.2" opacity=".35"/>
<circle class="sP" cx="530.0" cy="31.7" r="2.2" opacity=".35"/>
<circle class="sP" cx="121.4" cy="142.5" r="2.2" opacity=".35"/>
<circle class="sP" cx="113.7" cy="159.4" r="2.2" opacity=".35"/>
<circle class="sP" cx="113.9" cy="148.8" r="2.2" opacity=".35"/>
<circle class="sP" cx="200.9" cy="102.4" r="2.2" opacity=".35"/>
<circle class="sP" cx="289.8" cy="50.7" r="2.2" opacity=".35"/>
<circle class="sP" cx="172.1" cy="123.3" r="2.2" opacity=".35"/>
<circle class="sP" cx="172.9" cy="116.3" r="2.2" opacity=".35"/>
<circle class="sP" cx="263.4" cy="46.5" r="2.2" opacity=".35"/>
<circle class="sP" cx="228.0" cy="97.9" r="2.2" opacity=".35"/>
<circle class="sP" cx="170.6" cy="138.4" r="2.2" opacity=".35"/>
<circle class="sP" cx="213.6" cy="109.0" r="2.2" opacity=".35"/>
<circle class="sP" cx="184.3" cy="102.7" r="2.2" opacity=".35"/>
<circle class="sP" cx="262.2" cy="65.0" r="2.2" opacity=".35"/>
<circle class="sP" cx="349.9" cy="31.7" r="2.2" opacity=".35"/>
<circle class="sP" cx="217.3" cy="82.1" r="2.2" opacity=".35"/>
<circle class="sP" cx="432.8" cy="31.7" r="2.2" opacity=".35"/>
<circle class="sP" cx="301.0" cy="31.7" r="2.2" opacity=".35"/>
<circle class="sP" cx="157.3" cy="109.0" r="2.2" opacity=".35"/>
<circle class="sP" cx="195.0" cy="127.9" r="2.2" opacity=".35"/>
<circle class="sP" cx="354.0" cy="31.7" r="2.2" opacity=".35"/>
<circle class="sP" cx="153.9" cy="114.5" r="2.2" opacity=".35"/>
<circle class="sP" cx="176.9" cy="120.2" r="2.2" opacity=".35"/>
<circle class="sP" cx="143.3" cy="138.9" r="2.2" opacity=".35"/>
<circle class="sP" cx="156.1" cy="159.0" r="2.2" opacity=".35"/>
<circle class="sP" cx="282.2" cy="31.7" r="2.2" opacity=".35"/>
<circle class="sP" cx="358.2" cy="31.7" r="2.2" opacity=".35"/>
<circle class="sP" cx="236.6" cy="80.2" r="2.2" opacity=".35"/>
<circle class="sP" cx="142.4" cy="119.3" r="2.2" opacity=".35"/>
<circle class="sP" cx="168.2" cy="180.1" r="2.2" opacity=".35"/>
<circle class="sP" cx="205.6" cy="88.1" r="2.2" opacity=".35"/>
<circle class="sP" cx="211.1" cy="75.3" r="2.2" opacity=".35"/>
<circle class="sP" cx="105.5" cy="160.6" r="2.2" opacity=".35"/>
<circle class="sP" cx="168.7" cy="117.6" r="2.2" opacity=".35"/>
<circle class="sP" cx="261.4" cy="63.9" r="2.2" opacity=".35"/>
<circle class="sP" cx="160.1" cy="157.1" r="2.2" opacity=".35"/>
<circle class="sP" cx="175.6" cy="111.6" r="2.2" opacity=".35"/>
<circle class="sP" cx="138.0" cy="152.2" r="2.2" opacity=".35"/>
<circle class="sP" cx="306.4" cy="31.7" r="2.2" opacity=".35"/>
<circle class="sP" cx="158.7" cy="123.1" r="2.2" opacity=".35"/>
<circle class="sP" cx="157.2" cy="148.6" r="2.2" opacity=".35"/>
<circle class="sP" cx="207.6" cy="72.7" r="2.2" opacity=".35"/>
<circle class="sP" cx="179.2" cy="128.2" r="2.2" opacity=".35"/>
<circle class="sP" cx="120.0" cy="158.2" r="2.2" opacity=".35"/>
<circle class="sP" cx="189.0" cy="140.1" r="2.2" opacity=".35"/>
<circle class="sP" cx="282.7" cy="41.3" r="2.2" opacity=".35"/>
<circle class="sP" cx="246.5" cy="112.7" r="2.2" opacity=".35"/>
<circle class="sP" cx="332.2" cy="32.3" r="2.2" opacity=".35"/>
<circle class="sP" cx="186.8" cy="129.5" r="2.2" opacity=".35"/>
<circle class="sP" cx="333.2" cy="31.7" r="2.2" opacity=".35"/>
<circle class="sP" cx="281.3" cy="64.4" r="2.2" opacity=".35"/>
<circle class="sP" cx="161.7" cy="165.4" r="2.2" opacity=".35"/>
<circle class="sP" cx="105.9" cy="179.1" r="2.2" opacity=".35"/>
<circle class="sP" cx="461.2" cy="31.7" r="2.2" opacity=".35"/>
<circle class="sP" cx="287.9" cy="50.6" r="2.2" opacity=".35"/>
<circle class="sP" cx="229.4" cy="107.4" r="2.2" opacity=".35"/>
<circle class="sP" cx="169.2" cy="128.4" r="2.2" opacity=".35"/>
<circle class="sP" cx="142.5" cy="127.1" r="2.2" opacity=".35"/>
<circle class="sP" cx="299.9" cy="42.2" r="2.2" opacity=".35"/>
<circle class="sP" cx="185.5" cy="109.5" r="2.2" opacity=".35"/>
<circle class="sP" cx="278.8" cy="31.7" r="2.2" opacity=".35"/>
<circle class="sP" cx="289.7" cy="48.6" r="2.2" opacity=".35"/>
<circle class="sP" cx="195.7" cy="48.6" r="2.2" opacity=".35"/>
<circle class="sP" cx="304.0" cy="48.6" r="2.2" opacity=".35"/>
<circle class="sP" cx="298.6" cy="48.6" r="2.2" opacity=".35"/>
<circle class="sP" cx="325.5" cy="48.6" r="2.2" opacity=".35"/>
<circle class="sP" cx="245.8" cy="48.6" r="2.2" opacity=".35"/>
<circle class="sP" cx="183.7" cy="48.6" r="2.2" opacity=".35"/>
<circle class="sP" cx="289.3" cy="48.6" r="2.2" opacity=".35"/>
<circle class="sP" cx="314.9" cy="48.6" r="2.2" opacity=".35"/>
<circle class="sP" cx="291.0" cy="48.6" r="2.2" opacity=".35"/>
<circle class="sP" cx="287.0" cy="48.6" r="2.2" opacity=".35"/>
<circle class="sP" cx="303.7" cy="48.6" r="2.2" opacity=".35"/>
<circle class="sP" cx="270.5" cy="48.6" r="2.2" opacity=".35"/>
<circle class="sP" cx="176.2" cy="48.6" r="2.2" opacity=".35"/>
<circle class="sP" cx="155.7" cy="82.2" r="2.2" opacity=".35"/>
<circle class="sP" cx="236.4" cy="82.2" r="2.2" opacity=".35"/>
<circle class="sP" cx="311.0" cy="82.2" r="2.2" opacity=".35"/>
<circle class="sP" cx="210.8" cy="82.2" r="2.2" opacity=".35"/>
<circle class="sP" cx="256.2" cy="82.2" r="2.2" opacity=".35"/>
<circle class="sP" cx="221.7" cy="82.2" r="2.2" opacity=".35"/>
<circle class="sP" cx="266.1" cy="82.2" r="2.2" opacity=".35"/>
<circle class="sP" cx="222.1" cy="82.2" r="2.2" opacity=".35"/>
<circle class="sP" cx="211.7" cy="82.2" r="2.2" opacity=".35"/>
<circle class="sP" cx="254.4" cy="82.2" r="2.2" opacity=".35"/>
<circle class="sP" cx="205.1" cy="82.2" r="2.2" opacity=".35"/>
<circle class="sP" cx="330.8" cy="82.2" r="2.2" opacity=".35"/>
<circle class="sP" cx="330.6" cy="82.2" r="2.2" opacity=".35"/>
<circle class="sP" cx="224.2" cy="82.2" r="2.2" opacity=".35"/>
<line class="sLm" x1="60" y1="200" x2="540" y2="200"/><line class="sLm" x1="60" y1="200" x2="60" y2="20"/>
<text class="sS" x="60" y="216" text-anchor="middle">0</text>
<text class="sS" x="216.667" y="216" text-anchor="middle">5</text>
<text class="sS" x="373.333" y="216" text-anchor="middle">10</text>
<text class="sS" x="530" y="216" text-anchor="middle">15</text>
<text class="sS" x="54" y="170.346" text-anchor="end">100k</text>
<text class="sS" x="54" y="103.038" text-anchor="end">300k</text>
<text class="sS" x="54" y="35.7308" text-anchor="end">500k</text>
<text class="sC" x="300" y="234" text-anchor="middle">median_income (scaled, capped at 15)</text>
<line class="sLr" x1="60" y1="31.7308" x2="540" y2="31.7308" stroke-dasharray="5 3"/><text class="sRt" x="548" y="35.7308">hard cap at $500k</text>
<text class="sWt" x="548" y="52.5577">faint lines: $450k,</text><text class="sWt" x="548" y="68.5577">$350k (quirks)</text>
<rect class="sN" x="556" y="120" width="150" height="70" rx="8"/><text class="sT" x="631" y="142" text-anchor="middle">72 of 728 rows</text><text class="sS" x="631" y="160" text-anchor="middle">sit on the cap: the</text><text class="sS" x="631" y="176" text-anchor="middle">model learns a ceiling</text>
</svg><figcaption>What Géron saw when he zoomed into income vs price: the correlation is real, the ceiling is an artefact. Simulated data in the same shape.</figcaption></figure>

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
