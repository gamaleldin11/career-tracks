# Part 4 — Data Cleaning and Preprocessing

<!-- nav -->
> [!example] 🧭 Step 5 of 26 · Stage 2 of 7: Data & statistics
> ← [Part 12 · SQL](12_SQL_for_Data.md) · [Part 05 · Visualisation & EDA](05_Visualization_and_EDA.md) → · [Course map](00_START_HERE.md)
<!-- /nav -->

**Source:** `AI_notebooks/2025-12-19/` — seven notebooks: `00-Data Cleaning or Cleansing` (46 cells), `01-Work with Missing Data` (96), `02-Work with Categorical Data` (52), `03-Outliers Handling` (27), `04-Data Split to Train and Test Sets` (29), `05-Deal with Imbalanced Classes Problem` (22), `06-Feature Scaling` (29) **Lectures:** Lec 6, Lec 7

This is the longest session in the course and the most important. The notebook opens with the claim that carries the whole discipline:

> Data scientists spend 80% of their time cleaning the data.

That is roughly right, and it is not a complaint. Model choice is a small lever; data quality is a large one. A logistic regression on well-prepared features beats a gradient boosting machine on garbage, reliably.

<!-- interview-focus -->

> [!tip] 🎯 Interview focus
> **Why it matters:** "How would you prepare this data?" is in every loop. Leakage is the #1 thing interviewers probe to separate juniors from mid-levels.
>
> | Level | What you should be able to do |
> |---|---|
> | 🟢 **Entry** | Handle missing values, encode categoricals, treat outliers, scale features, split train/test (stratified), and explain **why fit on train only**. |
> | 🟡 **Mid** | Build a full `ColumnTransformer` pipeline; choose an imputer or encoder by data type; resample for imbalance **inside** CV; custom transformers; target transforms. |
> | 🔴 **Senior** | Point-in-time correctness, feature stores, data validation in production, drift-safe preprocessing. |
>
> **⭐ Most-asked:** *What is data leakage? Give two examples.* · *Mean vs median vs model-based imputation?* · *One-hot vs ordinal vs target encoding?* · *StandardScaler vs MinMaxScaler — which models need scaling?* · *How do you handle a 95/5 class imbalance?*
>
> **⏱ Time:** 4–5 h  ·  **Short on time?** Read §4.0, §4.5, §4.6, §4.8, §4.11 (drill).

**Legend:** 🟢 Entry (0–2 yrs) · 🟡 Mid (2–5 yrs) · 🔴 Senior / specialist · ⭐ frequently asked · 📖 Géron, *Hands-On ML with Scikit-Learn and PyTorch* (2025) pages

> [!abstract]- 🗺️ Section map — level and book pages
>
> | § | Section | Level | 📖 Book |
> |---|---|:---:|---|
> | 4.0 | The one rule that governs this entire part | 🟢 ⭐ | — |
> | 4.1 | Basic cleaning — the `friends.csv` walkthrough | 🟢 | — |
> | 4.2 | Missing data | 🟢 ⭐ | Ch. 2 · pp. 70–73 |
> | 4.3 | Categorical data | 🟢 ⭐ | Ch. 2 · pp. 73–77 |
> | 4.4 | Outliers | 🟢 | — |
> | 4.5 | Train/test split — and the leakage rule | 🟢 ⭐ | Ch. 2 · pp. 57–62 |
> | 4.6 | Imbalanced classes | 🟡 ⭐ | — |
> | 4.7 | Feature scaling | 🟢 ⭐ | Ch. 2 · pp. 77–81 |
> | 4.8 | Assembling it: the preprocessing pipeline | 🟡 ⭐ | Ch. 2 · pp. 86–90 |
> | 4.9 | The checklist | 🟢 | — |
> | 4.10 | Going deeper, with Géron (*Hands-On ML*, Ch. 2) | 🟡 | Ch. 2 · pp. 57–90 |
> | 4.11 | Interview drill — preprocessing | 🟢 ⭐ | — |
>

---

## 4.0 The one rule that governs this entire part 🟢 ⭐

![Fit every preprocessing step on the training data only, then reuse it to transform validation and test data.](figures/fig04_leakage_pipeline.png)
*Fit every preprocessing step on the training data only, then reuse it to transform validation and test data.*

> [!quote] 💬 Say it in the interview
> “Every preprocessing step learns parameters, so I fit it on the training data only — inside a Pipeline — and reuse it on validation and test. Anything else leaks information and inflates the score.”

Before any technique: **every statistic you learn from data must be learned from the training set only.**

The mean you impute with, the σ your scaler divides by, the categories your encoder knows about, the synthetic points SMOTE invents — all of these are *parameters fitted from data*. If you compute them using the whole dataset and then split, information from the test set has leaked into training, and your test score is measuring something that will not happen in production.

This is **data leakage**, and it is the defining error of applied ML. Section 4.5 covers it properly; I put it first because it changes how you should read everything before it.

The course teaches most techniques on the full frame for clarity, then corrects to pipelines in the project notebooks. Keep the correction in mind as you read.

---

## 4.1 Basic cleaning — the `friends.csv` walkthrough 🟢

The first notebook works a small deliberately-dirty file end to end. The value is in the *order of operations*.

<figure class="dia steps" data-start="1"><svg viewBox="0 0 720 138" role="img" aria-label="Four rows of friends.csv through the cleaning steps: the compound age_sex column is split, height and weight are read as text because of the values 18O and a question mark, coercion turns those into NaN and exposes a 0 cm height and a minus 60 kg weight, which are fixed with the median and abs">
<g data-s="1-1"><rect class="sN" x="40" y="20" width="90" height="22" rx="0"/><text class="sS" x="85" y="35" text-anchor="middle">name</text><rect class="sB" x="40" y="42" width="90" height="22" rx="0" opacity=".55"/><text class="sC" x="85" y="57" text-anchor="middle">Ali</text><rect class="sB" x="40" y="64" width="90" height="22" rx="0" opacity=".55"/><text class="sC" x="85" y="79" text-anchor="middle">Mona</text><rect class="sB" x="40" y="86" width="90" height="22" rx="0" opacity=".55"/><text class="sC" x="85" y="101" text-anchor="middle">Omar</text><rect class="sB" x="40" y="108" width="90" height="22" rx="0" opacity=".55"/><text class="sC" x="85" y="123" text-anchor="middle">Sara</text><rect class="sN" x="130" y="20" width="90" height="22" rx="0"/><text class="sS" x="175" y="35" text-anchor="middle">age_sex</text><rect class="sB" x="130" y="42" width="90" height="22" rx="0" opacity=".55"/><text class="sC" x="175" y="57" text-anchor="middle">24_male</text><rect class="sB" x="130" y="64" width="90" height="22" rx="0" opacity=".55"/><text class="sC" x="175" y="79" text-anchor="middle">31_female</text><rect class="sB" x="130" y="86" width="90" height="22" rx="0" opacity=".55"/><text class="sC" x="175" y="101" text-anchor="middle">27_male</text><rect class="sB" x="130" y="108" width="90" height="22" rx="0" opacity=".55"/><text class="sC" x="175" y="123" text-anchor="middle">22_female</text><rect class="sN" x="220" y="20" width="110" height="22" rx="0"/><text class="sS" x="275" y="35" text-anchor="middle">height(cm)</text><rect class="sB" x="220" y="42" width="110" height="22" rx="0" opacity=".55"/><text class="sC" x="275" y="57" text-anchor="middle">175</text><rect class="sW" x="220" y="64" width="110" height="22" rx="0" opacity=".55"/><text class="sC" x="275" y="79" text-anchor="middle">0</text><rect class="sW" x="220" y="86" width="110" height="22" rx="0" opacity=".55"/><text class="sC" x="275" y="101" text-anchor="middle">18O</text><rect class="sB" x="220" y="108" width="110" height="22" rx="0" opacity=".55"/><text class="sC" x="275" y="123" text-anchor="middle">160</text><rect class="sN" x="330" y="20" width="110" height="22" rx="0"/><text class="sS" x="385" y="35" text-anchor="middle">weight(kg)</text><rect class="sB" x="330" y="42" width="110" height="22" rx="0" opacity=".55"/><text class="sC" x="385" y="57" text-anchor="middle">70</text><rect class="sB" x="330" y="64" width="110" height="22" rx="0" opacity=".55"/><text class="sC" x="385" y="79" text-anchor="middle">55</text><rect class="sW" x="330" y="86" width="110" height="22" rx="0" opacity=".55"/><text class="sC" x="385" y="101" text-anchor="middle">-60</text><rect class="sW" x="330" y="108" width="110" height="22" rx="0" opacity=".55"/><text class="sC" x="385" y="123" text-anchor="middle">?</text><text class="sC" x="470" y="60">read with sep="|"</text><text class="sS" x="470" y="80">dtypes: height object,</text><text class="sS" x="470" y="96">weight object</text></g>
<g data-s="2-2"><rect class="sN" x="40" y="20" width="90" height="22" rx="0"/><text class="sS" x="85" y="35" text-anchor="middle">name</text><rect class="sB" x="40" y="42" width="90" height="22" rx="0" opacity=".55"/><text class="sC" x="85" y="57" text-anchor="middle">Ali</text><rect class="sB" x="40" y="64" width="90" height="22" rx="0" opacity=".55"/><text class="sC" x="85" y="79" text-anchor="middle">Mona</text><rect class="sB" x="40" y="86" width="90" height="22" rx="0" opacity=".55"/><text class="sC" x="85" y="101" text-anchor="middle">Omar</text><rect class="sB" x="40" y="108" width="90" height="22" rx="0" opacity=".55"/><text class="sC" x="85" y="123" text-anchor="middle">Sara</text><rect class="sN" x="130" y="20" width="90" height="22" rx="0"/><text class="sS" x="175" y="35" text-anchor="middle">sex</text><rect class="sA" x="130" y="42" width="90" height="22" rx="0" opacity=".55"/><text class="sC" x="175" y="57" text-anchor="middle">male</text><rect class="sA" x="130" y="64" width="90" height="22" rx="0" opacity=".55"/><text class="sC" x="175" y="79" text-anchor="middle">female</text><rect class="sA" x="130" y="86" width="90" height="22" rx="0" opacity=".55"/><text class="sC" x="175" y="101" text-anchor="middle">male</text><rect class="sA" x="130" y="108" width="90" height="22" rx="0" opacity=".55"/><text class="sC" x="175" y="123" text-anchor="middle">female</text><rect class="sN" x="220" y="20" width="110" height="22" rx="0"/><text class="sS" x="275" y="35" text-anchor="middle">height(cm)</text><rect class="sB" x="220" y="42" width="110" height="22" rx="0" opacity=".55"/><text class="sC" x="275" y="57" text-anchor="middle">175</text><rect class="sB" x="220" y="64" width="110" height="22" rx="0" opacity=".55"/><text class="sC" x="275" y="79" text-anchor="middle">0</text><rect class="sB" x="220" y="86" width="110" height="22" rx="0" opacity=".55"/><text class="sC" x="275" y="101" text-anchor="middle">18O</text><rect class="sB" x="220" y="108" width="110" height="22" rx="0" opacity=".55"/><text class="sC" x="275" y="123" text-anchor="middle">160</text><rect class="sN" x="330" y="20" width="110" height="22" rx="0"/><text class="sS" x="385" y="35" text-anchor="middle">weight(kg)</text><rect class="sB" x="330" y="42" width="110" height="22" rx="0" opacity=".55"/><text class="sC" x="385" y="57" text-anchor="middle">70</text><rect class="sB" x="330" y="64" width="110" height="22" rx="0" opacity=".55"/><text class="sC" x="385" y="79" text-anchor="middle">55</text><rect class="sB" x="330" y="86" width="110" height="22" rx="0" opacity=".55"/><text class="sC" x="385" y="101" text-anchor="middle">-60</text><rect class="sB" x="330" y="108" width="110" height="22" rx="0" opacity=".55"/><text class="sC" x="385" y="123" text-anchor="middle">?</text><text class="sC" x="470" y="60">age_sex split, sex kept</text><text class="sRt" x="470" y="84">describe() shows: no numeric columns</text><text class="sRt" x="470" y="100">height and weight are text</text></g>
<g data-s="3-3"><rect class="sN" x="40" y="20" width="90" height="22" rx="0"/><text class="sS" x="85" y="35" text-anchor="middle">name</text><rect class="sB" x="40" y="42" width="90" height="22" rx="0" opacity=".55"/><text class="sC" x="85" y="57" text-anchor="middle">Ali</text><rect class="sB" x="40" y="64" width="90" height="22" rx="0" opacity=".55"/><text class="sC" x="85" y="79" text-anchor="middle">Mona</text><rect class="sB" x="40" y="86" width="90" height="22" rx="0" opacity=".55"/><text class="sC" x="85" y="101" text-anchor="middle">Omar</text><rect class="sB" x="40" y="108" width="90" height="22" rx="0" opacity=".55"/><text class="sC" x="85" y="123" text-anchor="middle">Sara</text><rect class="sN" x="130" y="20" width="90" height="22" rx="0"/><text class="sS" x="175" y="35" text-anchor="middle">sex</text><rect class="sB" x="130" y="42" width="90" height="22" rx="0" opacity=".55"/><text class="sC" x="175" y="57" text-anchor="middle">male</text><rect class="sB" x="130" y="64" width="90" height="22" rx="0" opacity=".55"/><text class="sC" x="175" y="79" text-anchor="middle">female</text><rect class="sB" x="130" y="86" width="90" height="22" rx="0" opacity=".55"/><text class="sC" x="175" y="101" text-anchor="middle">male</text><rect class="sB" x="130" y="108" width="90" height="22" rx="0" opacity=".55"/><text class="sC" x="175" y="123" text-anchor="middle">female</text><rect class="sN" x="220" y="20" width="110" height="22" rx="0"/><text class="sS" x="275" y="35" text-anchor="middle">height(cm)</text><rect class="sB" x="220" y="42" width="110" height="22" rx="0" opacity=".55"/><text class="sC" x="275" y="57" text-anchor="middle">175</text><rect class="sR" x="220" y="64" width="110" height="22" rx="0" opacity=".55"/><text class="sC" x="275" y="79" text-anchor="middle">0</text><rect class="sW" x="220" y="86" width="110" height="22" rx="0" opacity=".55"/><text class="sC" x="275" y="101" text-anchor="middle">NaN</text><rect class="sB" x="220" y="108" width="110" height="22" rx="0" opacity=".55"/><text class="sC" x="275" y="123" text-anchor="middle">160</text><rect class="sN" x="330" y="20" width="110" height="22" rx="0"/><text class="sS" x="385" y="35" text-anchor="middle">weight(kg)</text><rect class="sB" x="330" y="42" width="110" height="22" rx="0" opacity=".55"/><text class="sC" x="385" y="57" text-anchor="middle">70</text><rect class="sB" x="330" y="64" width="110" height="22" rx="0" opacity=".55"/><text class="sC" x="385" y="79" text-anchor="middle">55</text><rect class="sR" x="330" y="86" width="110" height="22" rx="0" opacity=".55"/><text class="sC" x="385" y="101" text-anchor="middle">-60</text><rect class="sW" x="330" y="108" width="110" height="22" rx="0" opacity=".55"/><text class="sC" x="385" y="123" text-anchor="middle">NaN</text><text class="sC" x="470" y="60">to_numeric(errors="coerce"):</text><text class="sS" x="470" y="76">"18O" and "?" → NaN (amber)</text><text class="sRt" x="470" y="100">describe(): min height 0,</text><text class="sRt" x="470" y="116">min weight -60 (red)</text></g>
<g data-s="4-4"><rect class="sN" x="40" y="20" width="90" height="22" rx="0"/><text class="sS" x="85" y="35" text-anchor="middle">name</text><rect class="sB" x="40" y="42" width="90" height="22" rx="0" opacity=".55"/><text class="sC" x="85" y="57" text-anchor="middle">Ali</text><rect class="sB" x="40" y="64" width="90" height="22" rx="0" opacity=".55"/><text class="sC" x="85" y="79" text-anchor="middle">Mona</text><rect class="sB" x="40" y="86" width="90" height="22" rx="0" opacity=".55"/><text class="sC" x="85" y="101" text-anchor="middle">Omar</text><rect class="sB" x="40" y="108" width="90" height="22" rx="0" opacity=".55"/><text class="sC" x="85" y="123" text-anchor="middle">Sara</text><rect class="sN" x="130" y="20" width="90" height="22" rx="0"/><text class="sS" x="175" y="35" text-anchor="middle">sex</text><rect class="sB" x="130" y="42" width="90" height="22" rx="0" opacity=".55"/><text class="sC" x="175" y="57" text-anchor="middle">male</text><rect class="sB" x="130" y="64" width="90" height="22" rx="0" opacity=".55"/><text class="sC" x="175" y="79" text-anchor="middle">female</text><rect class="sB" x="130" y="86" width="90" height="22" rx="0" opacity=".55"/><text class="sC" x="175" y="101" text-anchor="middle">male</text><rect class="sB" x="130" y="108" width="90" height="22" rx="0" opacity=".55"/><text class="sC" x="175" y="123" text-anchor="middle">female</text><rect class="sN" x="220" y="20" width="110" height="22" rx="0"/><text class="sS" x="275" y="35" text-anchor="middle">height(cm)</text><rect class="sB" x="220" y="42" width="110" height="22" rx="0" opacity=".55"/><text class="sC" x="275" y="57" text-anchor="middle">175</text><rect class="sG" x="220" y="64" width="110" height="22" rx="0" opacity=".55"/><text class="sC" x="275" y="79" text-anchor="middle">160</text><rect class="sW" x="220" y="86" width="110" height="22" rx="0" opacity=".55"/><text class="sC" x="275" y="101" text-anchor="middle">NaN</text><rect class="sB" x="220" y="108" width="110" height="22" rx="0" opacity=".55"/><text class="sC" x="275" y="123" text-anchor="middle">160</text><rect class="sN" x="330" y="20" width="110" height="22" rx="0"/><text class="sS" x="385" y="35" text-anchor="middle">weight(kg)</text><rect class="sB" x="330" y="42" width="110" height="22" rx="0" opacity=".55"/><text class="sC" x="385" y="57" text-anchor="middle">70</text><rect class="sB" x="330" y="64" width="110" height="22" rx="0" opacity=".55"/><text class="sC" x="385" y="79" text-anchor="middle">55</text><rect class="sG" x="330" y="86" width="110" height="22" rx="0" opacity=".55"/><text class="sC" x="385" y="101" text-anchor="middle">60</text><rect class="sW" x="330" y="108" width="110" height="22" rx="0" opacity=".55"/><text class="sC" x="385" y="123" text-anchor="middle">NaN</text><text class="sGt" x="470" y="60">abs(): -60 → 60 (a sign error)</text><text class="sGt" x="470" y="80">height 0 → median 160</text><text class="sS" x="470" y="100">NaN: handled in missing data</text></g>
</svg><ol class="dia-steps">
<li>Read with the right separator. One stray letter ("18O") and a "?" make height and weight <b>text</b> columns.</li>
<li>Split the compound <code>age_sex</code> column. <code>describe()</code> now shows no numeric columns at all: the tell-tale sign of text where numbers belong.</li>
<li><code>pd.to_numeric(errors="coerce")</code> turns unparseable values into NaN, and <code>describe()</code> exposes impossible values: a 0 cm height and a −60 kg weight.</li>
<li>Fix each by its diagnosis: −60 is a sign error, so <code>abs()</code>; 0 cm carries no information, so the median. The NaNs are left for the missing-data step.</li>
</ol><figcaption>The friends.csv walkthrough on four rows, computed with pandas exactly as the notebook does it.</figcaption></figure>

### Step 1 — read and look

```python
df = pd.read_csv('../datasets/friends.csv', sep='|')
df.info()
df.describe()
```

Note `sep='|'`. Not every file is comma-separated; check before assuming.

### Step 2 — split a compound column

```python
df['sex'] = df['age_sex'].apply(lambda x: x.split('_')[-1])
df.drop('age_sex', axis=1, inplace=True)
```

A column holding two facts (`24_male`) violates first normal form and is useless to a model. Split it, then drop the original. This is the simplest kind of **feature engineering**.

### Step 3 — notice what `describe()` does not show

> **Problems:** Weight, height, spend_C are not shown in `describe` because they are not numeric

This is the diagnostic trick worth stealing. `describe()` silently omits non-numeric columns. A numeric-looking column that is missing from the output has been read as text — usually because it contains a stray `'?'`, a space, or a unit suffix.

### Step 4 — coerce types

```python
numerical_colms = ['height(cm)', 'weight(kg)', 'spend_C']
for col in numerical_colms:
    df[col] = pd.to_numeric(df[col], errors='coerce')
```

> using **`errors='coerce'`** you will be sure any data that not in format will be NaN

Exactly right. Unparseable values become `NaN`, which you can then count and handle, rather than an exception that stops the notebook. **Convert failures into measurable missingness.**

### Step 5 — find impossible values

```python
df.describe()
```

> **Problems:**
> - Weight column has -60 kg and that's wrong.
> - Height column has min value of 0 and that's wrong also.
> - Spend_B column has min value of -100 that makes no sense.

This is **domain validation**, and no library does it for you. It requires knowing that humans do not weigh −60 kg. `describe()`'s `min` and `max` rows are where you look.

Build the habit of asking, for every numeric column: what is the physically possible range? Then check the observed range against it.

### Step 6 — fix them, choosing the right fix per problem

```python
# Sign errors → take absolute value
df['weight(kg)'] = df['weight(kg)'].apply(lambda x: abs(x))
df['spend_B']    = df['spend_B'].apply(lambda x: abs(x))

# Impossible-but-not-sign-flipped → replace with a plausible central value
median_of_height = df['height(cm)'].median()
df.loc[df['height(cm)'] < 100, 'height(cm)'] = median_of_height
```

Two different diagnoses, two different treatments. A −60 kg reading is almost certainly a data-entry sign error, so `abs()` recovers the true value. A 0 cm height carries no information at all, so it is replaced with the median.

🐛 **The instructive failure.** The notebook first tries:

```python
df[df['height(cm)'] < 100]['height(cm)'] = median_of_height   # does NOTHING
```

then runs `df.describe()` and sees no change, then writes the correct `.loc` version. This is **chained assignment**: the first expression creates a temporary sub-frame, assigns into that, and discards it. Pandas usually emits `SettingWithCopyWarning`, which is easy to ignore — and the operation silently fails.

**Rule: any assignment that involves a condition must go through a single `.loc`.**

### Step 7 — categorical placeholders

```python
df['section'].unique()          # reveals a '?' category
df['section'].value_counts()
df['section'].mode()[0]         # most frequent value

df['section'] = df['section'].apply(
    lambda x: df['section'].mode()[0] if x == '?' else x)
```

`'?'` is missingness wearing a costume. Pandas does not know that, so `isna()` reports zero nulls while a whole category is junk. Two ways to handle it:

- At read time: `pd.read_csv(..., na_values=['?'])` — better, because it makes the missingness visible to every subsequent tool.
- After the fact, as here.

`.mode()` returns a *Series* (there can be ties), hence `[0]`.

⚠️ Note that this lambda recomputes `df['section'].mode()[0]` **for every row** — O(n²). Compute it once into a variable first.

---

## 4.2 Missing data 🟢 ⭐

> [!info] 📖 Géron Ch. 2 · “Clean the Data” · pp. 70–73

> [!quote] 💬 Say it in the interview
> “First I ask *why* data is missing (MCAR, MAR, MNAR). Then I impute with the median or a model inside the pipeline, and add a missing-indicator when missingness itself is predictive.”

### Why it happens

The notebook's framing:

> The data is dirty. It is incomplete, noisy and inconsistent.

The standard taxonomy — which the course does not name but which changes what you should do — is:

| Mechanism | Meaning | Safe to impute? |
|---|---|---|
| **MCAR** (Missing Completely At Random) | Missingness unrelated to anything | Yes; imputation is unbiased |
| **MAR** (Missing At Random) | Missingness depends on *observed* variables | Yes, if you condition on those variables |
| **MNAR** (Missing Not At Random) | Missingness depends on the *unobserved value itself* | No — imputation biases results |

Example of MNAR: high earners decline to state income. Filling with the mean pulls those rows *down*, systematically. The correct move there is often to add an `income_was_missing` indicator column and let the model use the fact of missingness as a signal.

<figure class="dia"><svg viewBox="0 0 720 248" role="img" aria-label="Simulated incomes where high earners decline to answer: the observed mean is lower than the true mean, and filling the gaps with the observed mean piles every missing high earner onto one low value">
<rect class="sN" x="40" y="195.2" width="26.5" height="0.8" rx="1"/><rect class="sG" x="43" y="195.2" width="20.5" height="0.8" rx="1"/>
<rect class="sN" x="68.5" y="167.4" width="26.5" height="28.6" rx="1"/><rect class="sG" x="71.5" y="167.6" width="20.5" height="28.4" rx="1"/>
<rect class="sN" x="97" y="100" width="26.5" height="96" rx="1"/><rect class="sG" x="100" y="100" width="20.5" height="96" rx="1"/>
<rect class="sN" x="125.5" y="50.4" width="26.5" height="145.6" rx="1"/><rect class="sG" x="128.5" y="51.4" width="20.5" height="144.6" rx="1"/>
<rect class="sN" x="154" y="66.2" width="26.5" height="129.8" rx="1"/><rect class="sG" x="157" y="69.8" width="20.5" height="126.2" rx="1"/>
<rect class="sN" x="182.5" y="83.6" width="26.5" height="112.4" rx="1"/><rect class="sG" x="185.5" y="92.2" width="20.5" height="103.8" rx="1"/>
<rect class="sN" x="211" y="106.6" width="26.5" height="89.4" rx="1"/><rect class="sG" x="214" y="122.4" width="20.5" height="73.6" rx="1"/>
<rect class="sN" x="239.5" y="133" width="26.5" height="63" rx="1"/><rect class="sG" x="242.5" y="161" width="20.5" height="35" rx="1"/>
<rect class="sN" x="268" y="153.6" width="26.5" height="42.4" rx="1"/><rect class="sG" x="271" y="180.8" width="20.5" height="15.2" rx="1"/>
<rect class="sN" x="296.5" y="165.2" width="26.5" height="30.8" rx="1"/><rect class="sG" x="299.5" y="188.2" width="20.5" height="7.8" rx="1"/>
<rect class="sN" x="325" y="179" width="26.5" height="17" rx="1"/><rect class="sG" x="328" y="194.8" width="20.5" height="1.2" rx="1"/>
<rect class="sN" x="353.5" y="179.8" width="26.5" height="16.2" rx="1"/><rect class="sG" x="356.5" y="195.4" width="20.5" height="0.6" rx="1"/>
<rect class="sN" x="382" y="187" width="26.5" height="9" rx="1"/><rect class="sG" x="385" y="195.8" width="20.5" height="0.2" rx="1"/>
<rect class="sN" x="410.5" y="188.6" width="26.5" height="7.4" rx="1"/><rect class="sG" x="413.5" y="196" width="20.5" height="0" rx="1"/>
<rect class="sN" x="439" y="193" width="26.5" height="3" rx="1"/><rect class="sG" x="442" y="196" width="20.5" height="0" rx="1"/>
<rect class="sN" x="467.5" y="193.6" width="26.5" height="2.4" rx="1"/><rect class="sG" x="470.5" y="196" width="20.5" height="0" rx="1"/>
<rect class="sR" x="157" y="48.975" width="20.5" height="20.825" rx="1" opacity=".85"/>
<line class="sLv" x1="199.465" y1="30" x2="199.465" y2="196" stroke-dasharray="5 3"/><text class="sC" x="203.465" y="40">true mean 16.8k</text>
<line class="sLr" x1="170.069" y1="26" x2="170.069" y2="196" stroke-dasharray="5 3"/><text class="sRt" x="166.069" y="34" text-anchor="end">observed mean 13.7k</text>
<line class="sLm" x1="40" y1="196" x2="500" y2="196"/>
<text class="sS" x="40" y="212" text-anchor="middle">0k</text>
<text class="sS" x="154" y="212" text-anchor="middle">12k</text>
<text class="sS" x="268" y="212" text-anchor="middle">24k</text>
<text class="sS" x="382" y="212" text-anchor="middle">36k</text>
<text class="sS" x="496" y="212" text-anchor="middle">48k</text>
<rect class="sN" x="520" y="30" width="186" height="166" rx="8"/>
<rect class="sN" x="532" y="44" width="12" height="10" rx="2"/><text class="sC" x="552" y="53">everyone (true)</text>
<rect class="sG" x="532" y="64" width="12" height="10" rx="2"/><text class="sC" x="552" y="73">who answered</text>
<rect class="sR" x="532" y="84" width="12" height="10" rx="2"/><text class="sC" x="552" y="93">mean-imputed (⅛ scale)</text>
<text class="sC" x="613" y="122" text-anchor="middle">833 of 4,000 missing,</text><text class="sC" x="613" y="138" text-anchor="middle">mostly high earners</text>
<text class="sRt" x="613" y="166" text-anchor="middle">after imputation: 13.7k</text><text class="sC" x="613" y="184" text-anchor="middle">true: 16.8k</text>
<text class="sS" x="270" y="236" text-anchor="middle">missingness depends on the value itself, so no amount of conditioning on other columns recovers it</text>
</svg><figcaption>MNAR in numbers: mean imputation does not just add noise, it biases the column toward the people who answered. Simulated.</figcaption></figure>

**Practical habit:** before imputing anything, check whether missingness correlates with the target. `df.groupby(df['col'].isna())['target'].mean()` answers it in one line.

### Detect

```python
df = pd.read_csv('../datasets/melb_data.csv')
df.isnull().sum()
```

And the declaration approach:

```python
df = pd.read_csv('../datasets/wiki4HE.csv', sep=';', na_values=['N/A', 'no', '?'])
```

> First to read data successfully, analyse it first and know what is the separator and what are the NaN indicator characters if found.

The notebook demonstrates the discovery loop: read → `info()` shows everything as `object` → realise sentinels are in use → re-read with `na_values` → dtypes become numeric.

Better than `.sum()` for reporting is the **rate**:

```python
df.isna().mean().sort_values(ascending=False)
```

which is what the capstone uses. "40% missing" drives a decision; "5,432 missing" does not, until you divide.

### Drop

```python
df.dropna(axis=0, inplace=True)     # drop ROWS containing any NaN
df.dropna(axis=1)                   # drop COLUMNS containing any NaN
df.drop('col_name', axis=1)         # drop one specific column
df.dropna(how='all')                # only rows where EVERYTHING is NaN
df.dropna(thresh=5)                 # keep rows with at least 5 non-null values
```

The simplest option and often the wrong one. The Melbourne dataset loses roughly half its rows to `dropna(axis=0)`. Rough guidance:

- Column >50–60% missing → usually drop the **column**.
- A handful of rows missing → drop the **rows**.
- Anything in between → impute.
- Always print `len(df)` before and after. Losing 40% of your data silently is a real outcome of a careless `dropna()`.

### Impute with Pandas

```python
# Numeric — mean for symmetric distributions
df['BuildingArea'].fillna(df['BuildingArea'].mean(), inplace=True)

# Numeric — median for skewed distributions or when outliers exist
df['YearBuilt'].fillna(df['YearBuilt'].median(), inplace=True)

# Categorical — mode (most frequent)
df['Car'].fillna(df['Car'].mode()[0], inplace=True)
df['CouncilArea'].fillna(df['CouncilArea'].mode()[0], inplace=True)
```

The choice matrix:

| Column type | Strategy | When |
|---|---|---|
| Numeric, symmetric | **mean** | No strong outliers, low skew |
| Numeric, skewed | **median** | Prices, incomes, areas — the usual case |
| Categorical | **mode** | Default |
| Any | **constant** (`-1`, `"Unknown"`) | When "missing" is itself meaningful |

The notebook makes the mean/median point visually and honestly:

```python
sns.jointplot(x='BuildingArea', y='Price', data=df)
```

> as we saw there is outliers so it's **not a good practice** to use mean, but I use it as an example xD

Correct. One extreme value drags the mean; the median ignores it.

### Impute with scikit-learn

```python
from sklearn.impute import SimpleImputer

imputer = SimpleImputer(strategy='mean')       # or 'median', 'most_frequent', 'constant'
df['BuildingArea'] = imputer.fit_transform(df[['BuildingArea']])
imputer.statistics_        # the learned value(s)
```

**Why bother, when `fillna` is shorter?** Because of `fit`/`transform` — the two-phase lifecycle that is the whole point of scikit-learn:

- **`fit(X_train)`** — *learn* the parameter (here, the mean) and store it.
- **`transform(X)`** — *apply* the stored parameter.
- `fit_transform(X_train)` — both, for convenience, on training data only.

The stored parameter (`imputer.statistics_`) is what you apply to the test set and to production rows. `fillna(df.mean())` cannot do that; it recomputes from whatever data it is handed, which at inference time might be a single row.

<figure class="dia steps"><svg viewBox="0 0 720 238" role="img" aria-label="An imputer is fitted on the training column and stores its median, 115; transform then fills missing values in the training data, the test data and a single live row with that same stored value">
<text class="sM" x="59" y="32" text-anchor="middle">train</text><rect class="sN" x="14" y="40" width="90" height="24" rx="3"/><text class="sC" x="59" y="57" text-anchor="middle">120</text><rect class="sR" x="14" y="66" width="90" height="24" rx="3"/><text class="sC" x="59" y="83" text-anchor="middle">NaN</text><rect class="sN" x="14" y="92" width="90" height="24" rx="3"/><text class="sC" x="59" y="109" text-anchor="middle">95</text><rect class="sN" x="14" y="118" width="90" height="24" rx="3"/><text class="sC" x="59" y="135" text-anchor="middle">300</text><rect class="sN" x="14" y="144" width="90" height="24" rx="3"/><text class="sC" x="59" y="161" text-anchor="middle">110</text>
<g data-s="1"><line class="sL" x1="110" y1="92" x2="246" y2="92" marker-end="url(#ah)"/><text class="sT" x="178" y="84" text-anchor="middle">fit</text><rect class="sB" x="250" y="62" width="170" height="60" rx="8"/><text class="sT" x="335" y="90" text-anchor="middle">imputer</text><text class="sC" x="335" y="106" text-anchor="middle">statistics_ = [115]</text><text class="sS" x="335" y="140" text-anchor="middle">median of 95, 110, 120, 300</text></g>
<g data-s="2"><text class="sGt" x="110" y="82">← 115</text><text class="sGt" x="59" y="190" text-anchor="middle">transform(train)</text></g>
<g data-s="3"><text class="sM" x="515" y="32" text-anchor="middle">test</text><rect class="sR" x="470" y="40" width="90" height="24" rx="3"/><text class="sC" x="515" y="57" text-anchor="middle">NaN</text><rect class="sN" x="470" y="66" width="90" height="24" rx="3"/><text class="sC" x="515" y="83" text-anchor="middle">80</text><line class="sLg" x1="420" y1="92" x2="466" y2="58" marker-end="url(#ahg)"/><text class="sGt" x="566" y="57">→ 115</text><text class="sS" x="515" y="112" text-anchor="middle">not the test median</text></g>
<g data-s="4"><text class="sM" x="515" y="142" text-anchor="middle">one live row</text><rect class="sR" x="470" y="150" width="90" height="24" rx="3"/><text class="sC" x="515" y="167" text-anchor="middle">NaN</text><line class="sLg" x1="420" y1="100" x2="466" y2="160" marker-end="url(#ahg)"/><text class="sGt" x="566" y="167">→ 115</text><text class="sRt" x="706" y="200" text-anchor="end">fillna(df.mean()) → NaN</text></g>
<text class="sS" x="360" y="226" text-anchor="middle">learn once on training data, apply the stored value everywhere: that is what fit and transform split apart</text>
</svg><ol class="dia-steps">
<li><code>fit(X_train)</code> learns the parameter from the training rows only and stores it: <code>statistics_ = [115]</code>.</li>
<li><code>transform(X_train)</code> fills the training gaps with the stored value.</li>
<li><code>transform(X_test)</code> uses the <b>same</b> 115. Recomputing a median from the test rows would leak test information and make the two sets inconsistent.</li>
<li>In production a single row arrives. The stored 115 still works; <code>fillna(df.mean())</code> on a one-row frame has nothing to average and leaves NaN.</li>
</ol><figcaption>The fit/transform lifecycle, the reason sklearn transformers beat pandas one-liners in a pipeline.</figcaption></figure>

**This is the entire argument for sklearn transformers over Pandas one-liners**, and it generalises to every preprocessing step in this part.

Note `df[['BuildingArea']]` — double brackets. Transformers expect 2-D input.

### KNN imputation

```python
from sklearn.impute import KNNImputer
imputer = KNNImputer()      # n_neighbors=5 by default
```

> Each sample's missing values are imputed using the mean value from `n_neighbors` nearest neighbours found in the training set. So you can say it's a smart way to calculate the mean but not from the whole data, just the nearest or similar data only.

A good description. Instead of one global mean, KNN finds the *k* most similar complete rows (by Euclidean distance over the other features) and averages their values for the missing column.

Three caveats the course does not mention:

1. **Scale first.** KNN uses distance, so an unscaled column with a large range dominates the neighbour search. Scale, then impute — or accept nonsense.
2. **Numeric only.** It cannot handle raw categorical columns.
3. **Cost.** It is O(n²) in the number of rows. Fine at 10k rows, painful at 1M.

Also worth knowing: `IterativeImputer` (sklearn's MICE-style method) models each column as a function of the others, iteratively. Stronger still, and slower still.

---

## 4.3 Categorical data 🟢 ⭐

> [!info] 📖 Géron Ch. 2 · “Handling Text and Categorical Attributes” · pp. 73–77

> [!quote] 💬 Say it in the interview
> “Nominal categories → one-hot (with `handle_unknown='ignore'`); ordered ones → ordinal; high-cardinality → target encoding with cross-fitting, or CatBoost.”

### The problem

> Machine Learning algorithms require that input data must be in numerical format.

Almost true — tree models in some libraries handle categories natively, and CatBoost specialises in it — but for sklearn's estimators it is effectively true. Text must become numbers.

### Ordinal versus nominal — the distinction that determines everything

The notebook's definitions:

> **Ordinal variable** can be understood as categorical values that can be sorted or ordered. For example, T-shirt size would be an ordinal feature, because we can define an order XL > L > M.
>
> **Nominal features** don't imply any order […] we could think of T-shirt colour as a nominal feature.

Get this wrong in either direction and you damage the model:

- Encoding **nominal** data as integers (`red=1, green=2, blue=3`) tells the model that green is between red and blue, and that blue is three times red. For a linear model or KNN that is a fabricated relationship it will happily fit.
- Encoding **ordinal** data as one-hot throws away real information — the model no longer knows XL > L.

### Ordinal → `map`

```python
size_dict = {'XS':1, 'S':2, 'M':3, 'L':4, 'XL':5, 'XXL':6}
df['Size'] = df['Size'].map(size_dict)
```

Manual and explicit, which is the right instinct: **you** supply the ordering, because only you know it. sklearn's `OrdinalEncoder` assigns codes alphabetically by default, which for sizes gives `L < M < S < XL < XS` — meaningless.

Inverting:

```python
inv_size_mapping = {v: k for k, v in size_dict.items()}
df['size_inv'] = df['Size'].map(inv_size_mapping)
```

The dict comprehension from Part 1, doing real work.

⚠️ `map` returns `NaN` for any value not in the dict. That is a useful property (unknown sizes become missing rather than silently wrong) but you must check for it.

**Note on `LabelEncoder`:** the notebook mentions it as an alternative. It is intended for the **target** `y`, not for features — it accepts only 1-D input. The capstone uses it correctly, on `y`:

```python
le = LabelEncoder()
y_encoded = le.fit_transform(y_raw.astype(str))
```

### Nominal → one-hot encoding

```python
df = pd.get_dummies(df, columns=['Design', 'Color', 'Brand', 'Delivery status'],
                    drop_first=True)
```

> In one hot encoding, a new binary (dummy) variable is created for each unique value in the categorical variable.

`Color ∈ {Red, Green, Blue}` becomes three 0/1 columns. No ordering is implied, which is the point.

**`drop_first=True` and the dummy variable trap:**

> we use `drop_first` to get k-1 features, due to the last feature will be redundant and correlated with other features so it can cause problems.

If you know `Color_Green=0` and `Color_Blue=0`, then `Color_Red` must be 1 — it carries no new information. Keeping all k columns makes them perfectly collinear (they always sum to 1), which makes `XᵀX` singular and a linear model's coefficients unstable or undefined. This connects directly to §2.8's determinant and to the capstone's `VIF = inf` check.

**But:** drop the first column only for **linear** models. For trees and random forests it makes no difference, and for regularised models some practitioners keep all k. It is a model-dependent choice, not a universal rule.

### `OneHotEncoder` — the sklearn version

```python
from sklearn.preprocessing import OneHotEncoder
Encoder = OneHotEncoder(sparse=False, drop='first')      # sklearn ≥ 1.2: sparse_output=False
Transformed_Color = Encoder.fit_transform(df[['Color']])
Transformed_Color_Df = pd.DataFrame(Transformed_Color,
                                    columns=Encoder.get_feature_names())   # now get_feature_names_out()
df = pd.concat([df, Transformed_Color_Df], axis=1)
df.drop('Color', axis=1, inplace=True)
```

Again the `fit`/`transform` advantage: the encoder **remembers the training vocabulary**. `get_dummies` does not. If your test set happens to contain a colour that never appeared in training — or is missing one that did — `get_dummies` produces a different number of columns and your model crashes at predict time. This is a real production failure and the reason every reference notebook in this course uses `OneHotEncoder` inside a pipeline:

```python
ohe = OneHotEncoder(handle_unknown="ignore", sparse_output=False)
```

`handle_unknown="ignore"` encodes an unseen category as all-zeros instead of raising.

<figure class="dia"><svg viewBox="0 0 720 256" role="img" aria-label="get_dummies builds columns from whatever data it is given, so a test set with Red and Purple produces two different columns from the three seen in training; a OneHotEncoder fitted on training keeps the same three columns and encodes the unseen Purple as all zeros">
<text class="sM" x="14" y="22">train: Red, Green, Blue</text><text class="sM" x="370" y="22">test: Red, Purple</text>
<text class="sT" x="14" y="50">pd.get_dummies</text>
<rect class="sN" x="14" y="60" width="72" height="22" rx="0"/><text class="sS" x="50" y="75" text-anchor="middle">Red</text><rect class="sB" x="14" y="82" width="72" height="22" rx="0"/><text class="sC" x="50" y="97" text-anchor="middle">1</text><rect class="sB" x="14" y="104" width="72" height="22" rx="0"/><text class="sC" x="50" y="119" text-anchor="middle">0</text><rect class="sB" x="14" y="126" width="72" height="22" rx="0"/><text class="sC" x="50" y="141" text-anchor="middle">0</text><rect class="sN" x="88" y="60" width="72" height="22" rx="0"/><text class="sS" x="124" y="75" text-anchor="middle">Green</text><rect class="sB" x="88" y="82" width="72" height="22" rx="0"/><text class="sC" x="124" y="97" text-anchor="middle">0</text><rect class="sB" x="88" y="104" width="72" height="22" rx="0"/><text class="sC" x="124" y="119" text-anchor="middle">1</text><rect class="sB" x="88" y="126" width="72" height="22" rx="0"/><text class="sC" x="124" y="141" text-anchor="middle">0</text><rect class="sN" x="162" y="60" width="72" height="22" rx="0"/><text class="sS" x="198" y="75" text-anchor="middle">Blue</text><rect class="sB" x="162" y="82" width="72" height="22" rx="0"/><text class="sC" x="198" y="97" text-anchor="middle">0</text><rect class="sB" x="162" y="104" width="72" height="22" rx="0"/><text class="sC" x="198" y="119" text-anchor="middle">0</text><rect class="sB" x="162" y="126" width="72" height="22" rx="0"/><text class="sC" x="198" y="141" text-anchor="middle">1</text>
<rect class="sN" x="370" y="60" width="72" height="22" rx="0"/><text class="sS" x="406" y="75" text-anchor="middle">Red</text><rect class="sR" x="370" y="82" width="72" height="22" rx="0"/><text class="sC" x="406" y="97" text-anchor="middle">1</text><rect class="sR" x="370" y="104" width="72" height="22" rx="0"/><text class="sC" x="406" y="119" text-anchor="middle">0</text><rect class="sN" x="444" y="60" width="72" height="22" rx="0"/><text class="sS" x="480" y="75" text-anchor="middle">Purple</text><rect class="sR" x="444" y="82" width="72" height="22" rx="0"/><text class="sC" x="480" y="97" text-anchor="middle">0</text><rect class="sR" x="444" y="104" width="72" height="22" rx="0"/><text class="sC" x="480" y="119" text-anchor="middle">1</text>
<text class="sRt" x="530" y="90">2 columns, not 3:</text><text class="sRt" x="530" y="108">predict() fails, or</text><text class="sRt" x="530" y="126">silently misaligns</text>
<text class="sT" x="14" y="176">OneHotEncoder(handle_unknown="ignore"), fitted on train</text>
<rect class="sN" x="14" y="186" width="72" height="22" rx="0"/><text class="sS" x="50" y="201" text-anchor="middle">Red</text><rect class="sB" x="14" y="208" width="72" height="22" rx="0"/><text class="sC" x="50" y="223" text-anchor="middle">1</text><rect class="sN" x="88" y="186" width="72" height="22" rx="0"/><text class="sS" x="124" y="201" text-anchor="middle">Green</text><rect class="sB" x="88" y="208" width="72" height="22" rx="0"/><text class="sC" x="124" y="223" text-anchor="middle">0</text><rect class="sN" x="162" y="186" width="72" height="22" rx="0"/><text class="sS" x="198" y="201" text-anchor="middle">Blue</text><rect class="sB" x="162" y="208" width="72" height="22" rx="0"/><text class="sC" x="198" y="223" text-anchor="middle">0</text>
<rect class="sN" x="370" y="186" width="72" height="22" rx="0"/><text class="sS" x="406" y="201" text-anchor="middle">Red</text><rect class="sG" x="370" y="208" width="72" height="22" rx="0"/><text class="sC" x="406" y="223" text-anchor="middle">1</text><rect class="sG" x="370" y="230" width="72" height="22" rx="0"/><text class="sC" x="406" y="245" text-anchor="middle">0</text><rect class="sN" x="444" y="186" width="72" height="22" rx="0"/><text class="sS" x="480" y="201" text-anchor="middle">Green</text><rect class="sG" x="444" y="208" width="72" height="22" rx="0"/><text class="sC" x="480" y="223" text-anchor="middle">0</text><rect class="sG" x="444" y="230" width="72" height="22" rx="0"/><text class="sC" x="480" y="245" text-anchor="middle">0</text><rect class="sN" x="518" y="186" width="72" height="22" rx="0"/><text class="sS" x="554" y="201" text-anchor="middle">Blue</text><rect class="sG" x="518" y="208" width="72" height="22" rx="0"/><text class="sC" x="554" y="223" text-anchor="middle">0</text><rect class="sG" x="518" y="230" width="72" height="22" rx="0"/><text class="sC" x="554" y="245" text-anchor="middle">0</text>
<text class="sGt" x="600" y="220">same 3 columns;</text><text class="sGt" x="600" y="238">Purple → zeros</text>
<line class="sLm" x1="250" y1="96" x2="360" y2="96" marker-end="url(#ahm)"/><line class="sLm" x1="250" y1="208" x2="360" y2="208" marker-end="url(#ahm)"/>
</svg><figcaption>The encoder remembers the training vocabulary; get_dummies does not. The column count is part of the model's contract.</figcaption></figure>

📌 **API churn to be aware of:** `sparse=` was renamed `sparse_output=` in sklearn 1.2, and `get_feature_names()` became `get_feature_names_out()`. The capstone handles the first with a `try/except TypeError`. Your notebooks span this transition, so some cells will not run on a current install.

### Binary encoding

```python
from category_encoders import BinaryEncoder
encoder = BinaryEncoder()
Transformed_Color_Df = encoder.fit_transform(df[['Color']])
encoder.inverse_transform(Transformed_Color_Df)
```

The middle ground for **high-cardinality** features. One-hot on a column with 1,000 distinct values gives 1,000 columns; binary encoding gives ⌈log₂(1000)⌉ = 10. It assigns each category an integer, then writes that integer in binary across several columns.

It is a compromise — the bit columns are not individually meaningful — but it beats a 10,000-column sparse matrix. The `category_encoders` package also offers **target encoding** (replace each category with the mean target for that category), which is powerful and leaks badly if done outside a CV fold. Use with care.

**High-cardinality alternatives, ranked by how often they are the right answer:**

1. **Group rare levels into `"Other"`** — the Advertising notebook does this with a Top-N approach. Simple, robust, usually enough.
2. **Binary / hashing encoding** — when you need compactness.
3. **Target/mean encoding with out-of-fold computation** — powerful, dangerous.
4. **Drop the column** — the Ecommerce notebook drops `Email` and `Address` as pure identifiers, and the capstone drops `Reference Number`. An ID column has one distinct value per row and contributes only noise and leakage risk.

---

## 4.4 Outliers 🟢

### The framing, which the notebook gets right

> **Outliers are not always a bad thing.** Handle an outlier if you believe it's wrong or anomalous data; if the outlier represents useful information of the variance of data, don't handle it.

This is the correct posture and it is often taught badly elsewhere. An outlier is either:

- **An error** — a −60 kg weight, a 999 age. Fix or remove.
- **A rare but real event** — a fraudulent transaction, a fatal accident. **These are frequently the exact thing you are trying to predict.** Removing them destroys the task.

Ask "is this value *impossible*, or merely *unusual*?" before touching it.

### Detect visually

```python
sns.boxplot(x='DIS', data=df)
sns.stripplot(x='DIS', data=df, color="#474646")
```

Overlaying a strip plot on a box plot is a good habit: the box gives you the summary, the strip shows you the individual points behind it — including whether the "outliers" are one stray value or a dense second cluster.

### Detect statistically — the IQR method

> - IQR = Q3 − Q1
> - Outliers are the observations below (Q1 − 1.5 × IQR) or above (Q3 + 1.5 × IQR)

The procedure:

1. Q1 = 25th percentile, Q3 = 75th percentile.
2. IQR = Q3 − Q1 (the middle 50% of the data).
3. Fences at Q1 − 1.5·IQR and Q3 + 1.5·IQR.
4. Anything outside is flagged.

This is exactly what a box plot's whiskers draw, which is why the two methods agree.

<figure class="dia"><svg viewBox="0 0 720 208" role="img" aria-label="A box plot over 43 values: the box spans the first to third quartile with the median inside, fences sit 1.5 IQR beyond the box, and three points outside the fences are flagged as outliers">
<line class="sLm" x1="40" y1="150" x2="688" y2="150" marker-end="url(#ahm)"/>
<text class="sC" x="40" y="168" text-anchor="middle">0</text>
<text class="sC" x="112" y="168" text-anchor="middle">100</text>
<text class="sC" x="184" y="168" text-anchor="middle">200</text>
<text class="sC" x="256" y="168" text-anchor="middle">300</text>
<text class="sC" x="328" y="168" text-anchor="middle">400</text>
<text class="sC" x="400" y="168" text-anchor="middle">500</text>
<text class="sC" x="472" y="168" text-anchor="middle">600</text>
<text class="sC" x="544" y="168" text-anchor="middle">700</text>
<text class="sC" x="616" y="168" text-anchor="middle">800</text>
<text class="sC" x="688" y="168" text-anchor="middle">900</text>
<circle class="sP" cx="204.9" cy="134.7" r="3" opacity=".6"/>
<circle class="sP" cx="206.3" cy="127.6" r="3" opacity=".6"/>
<circle class="sP" cx="284.8" cy="128.3" r="3" opacity=".6"/>
<circle class="sP" cx="156.6" cy="126.0" r="3" opacity=".6"/>
<circle class="sP" cx="249.5" cy="125.7" r="3" opacity=".6"/>
<circle class="sP" cx="158.8" cy="124.8" r="3" opacity=".6"/>
<circle class="sP" cx="303.5" cy="127.6" r="3" opacity=".6"/>
<circle class="sP" cx="264.6" cy="131.2" r="3" opacity=".6"/>
<circle class="sP" cx="314.3" cy="124.0" r="3" opacity=".6"/>
<circle class="sP" cx="234.4" cy="132.1" r="3" opacity=".6"/>
<circle class="sP" cx="273.3" cy="128.1" r="3" opacity=".6"/>
<circle class="sP" cx="243.8" cy="127.7" r="3" opacity=".6"/>
<circle class="sP" cx="224.3" cy="133.8" r="3" opacity=".6"/>
<circle class="sP" cx="262.5" cy="129.8" r="3" opacity=".6"/>
<circle class="sP" cx="202.0" cy="127.8" r="3" opacity=".6"/>
<circle class="sP" cx="240.9" cy="129.8" r="3" opacity=".6"/>
<circle class="sP" cx="286.2" cy="132.5" r="3" opacity=".6"/>
<circle class="sP" cx="258.2" cy="124.7" r="3" opacity=".6"/>
<circle class="sP" cx="238.0" cy="135.7" r="3" opacity=".6"/>
<circle class="sP" cx="350.3" cy="124.3" r="3" opacity=".6"/>
<circle class="sP" cx="258.2" cy="133.0" r="3" opacity=".6"/>
<circle class="sP" cx="230.8" cy="134.1" r="3" opacity=".6"/>
<circle class="sP" cx="263.2" cy="124.2" r="3" opacity=".6"/>
<circle class="sP" cx="233.7" cy="133.5" r="3" opacity=".6"/>
<circle class="sP" cx="239.4" cy="128.4" r="3" opacity=".6"/>
<circle class="sP" cx="240.9" cy="130.9" r="3" opacity=".6"/>
<circle class="sP" cx="343.8" cy="124.1" r="3" opacity=".6"/>
<circle class="sP" cx="256.7" cy="124.6" r="3" opacity=".6"/>
<circle class="sP" cx="263.9" cy="126.2" r="3" opacity=".6"/>
<circle class="sP" cx="284.8" cy="135.5" r="3" opacity=".6"/>
<circle class="sP" cx="343.1" cy="126.4" r="3" opacity=".6"/>
<circle class="sP" cx="246.6" cy="133.1" r="3" opacity=".6"/>
<circle class="sP" cx="229.4" cy="135.2" r="3" opacity=".6"/>
<circle class="sP" cx="362.6" cy="135.3" r="3" opacity=".6"/>
<circle class="sP" cx="192.6" cy="128.1" r="3" opacity=".6"/>
<circle class="sP" cx="240.2" cy="128.3" r="3" opacity=".6"/>
<circle class="sP" cx="284.8" cy="130.3" r="3" opacity=".6"/>
<circle class="sP" cx="354.6" cy="133.3" r="3" opacity=".6"/>
<circle class="sP" cx="215.0" cy="125.3" r="3" opacity=".6"/>
<circle class="sP" cx="150.9" cy="133.0" r="3" opacity=".6"/>
<circle class="sPr" cx="558.4" cy="133.6" r="5"/>
<circle class="sPr" cx="659.2" cy="134.3" r="5"/>
<circle class="sPr" cx="68.8" cy="124.4" r="5"/>
<rect class="sA" x="230.08" y="54" width="54.72" height="40" rx="4" opacity=".55"/><line class="sL" x1="250" y1="54" x2="250" y2="94" stroke-width="3"/>
<line class="sLm" x1="150.88" y1="74" x2="230.08" y2="74"/><line class="sLm" x1="284.8" y1="74" x2="362.56" y2="74"/>
<line class="sLr" x1="148" y1="30" x2="148" y2="146" stroke-dasharray="5 4"/><text class="sRt" x="148" y="24" text-anchor="middle">Q1 − 1.5·IQR = 150</text>
<line class="sLr" x1="367" y1="30" x2="367" y2="146" stroke-dasharray="5 4"/><text class="sRt" x="366.88" y="24" text-anchor="middle">Q3 + 1.5·IQR = 454</text>
<text class="sC" x="230.08" y="108" text-anchor="end">Q1 264</text><text class="sC" x="284.8" y="108">Q3 340</text><text class="sC" x="249.52" y="48" text-anchor="middle">median 291</text>
<text class="sS" x="360" y="196" text-anchor="middle">3 points outside the fences are flagged; clipping pulls them to the fences (150 and 454)</text>
</svg><figcaption>The IQR rule, computed on 43 values. Quartiles barely move when outliers are added, which is why this beats mean ± 3σ.</figcaption></figure>

**Why 1.5?** It is a convention from Tukey. For normally distributed data these fences sit at roughly ±2.7σ and flag about 0.7% of points. Use 3.0 for a more permissive rule.

**Why IQR rather than mean ± 3σ?** Because the mean and standard deviation are themselves distorted by the outliers you are trying to find. Quartiles are not. This is *robustness*, and it is the same reason the median beats the mean for imputation.

### Handle — remove

```python
from datasist.structdata import detect_outliers

outliers_indices = detect_outliers(df, 0, df.columns)
df['is_outliers'] = df.index.isin(outliers_indices)
df.drop(outliers_indices, inplace=True)
```

(`datasist` is a small third-party convenience library. Nothing here needs it — the IQR rule is four lines of Pandas — and depending on an unmaintained package for four lines is a poor trade. Worth knowing the notebook uses it, and worth replacing.)

### Handle — replace with median

```python
for col in df.columns:
    outliers_indices = detect_outliers(df, 0, [col])
    col_median = df[col].median()
    df[col].iloc[outliers_indices] = col_median
```

Keeps the row (so you do not lose the other features) while neutralising the extreme value.

### The third option the course skips: **clipping / winsorising**

Rather than deleting or replacing with the centre, pull extreme values in to the fence:

```python
lower = Q1 - 1.5 * IQR
upper = Q3 + 1.5 * IQR
df[col] = df[col].clip(lower, upper)
```

This preserves the *ordering* — an unusually large value stays the largest — while removing its leverage. It is usually the best default, and it is what the Ecommerce notebook implements as a custom transformer:

```python
class IQRClipper(BaseEstimator, TransformerMixin):
    def __init__(self, factor=1.5):
        self.factor = factor
    def fit(self, X, y=None):
        X = np.asarray(X, dtype=float)
        q1 = np.nanpercentile(X, 25, axis=0)
        q3 = np.nanpercentile(X, 75, axis=0)
        iqr = q3 - q1
        self.lower_ = q1 - self.factor * iqr
        self.upper_ = q3 + self.factor * iqr
        return self
    # transform: np.clip(X, self.lower_, self.upper_)
```

Note what makes this correct: the fences are **learned in `fit`** (from training data) and **applied in `transform`**. Same fences on the test set. No leakage. This is the Part 1 OOP material paying off — you inherit from `BaseEstimator` and `TransformerMixin`, implement two methods, and the object drops into any `Pipeline`.

⚠️ **The course's outlier notebooks operate on the full dataset before splitting.** For teaching that is fine; in a real project, outlier bounds are parameters and belong in the pipeline.

---

## 4.5 Train/test split — and the leakage rule 🟢 ⭐

> [!info] 📖 Géron Ch. 2 · “Create a Test Set” · pp. 57–62

> [!quote] 💬 Say it in the interview
> “I split before any deep EDA, stratify on the target (or a binned key feature), and for anything that predicts the future I split by time.”

### Why

> When you're working on a model and want to train it, you obviously have a dataset. But after training, we have to test the model on some test dataset. […] the obvious solution is to split the dataset you have into two sets.

The deeper reason: a model's training-set score measures **memorisation**, not learning. Any sufficiently flexible model can achieve perfect training accuracy by memorising. The question that matters is *generalisation* — performance on data it has never seen — and the only honest way to estimate it is to hold data back.

### How

```python
x = df.drop('tip', axis=1)      # features
y = df['tip']                   # target

from sklearn.model_selection import train_test_split
x_train, x_test, y_train, y_test = train_test_split(
    x, y, test_size=0.2, random_state=1)
```

**Naming convention** (worth adopting because everyone uses it): capital `X` for the feature matrix (2-D), lowercase `y` for the target vector (1-D).

`test_size=0.2` is the usual default. `random_state` fixes the shuffle so the split is reproducible — without it, every run gives a different score and you cannot tell whether your change helped.

### Stratified split

```python
df = sns.load_dataset('titanic')
x, y = df.drop('survived', axis=1), df['survived']

y.value_counts(normalize=True)        # e.g. 0.62 / 0.38

x_train, x_test, y_train, y_test = train_test_split(x, y, test_size=0.2)
y_train.value_counts(normalize=True)  # drifted

x_train, x_test, y_train, y_test = train_test_split(x, y, test_size=0.2, stratify=y)
y_train.value_counts(normalize=True)  # preserved
```

`stratify=y` forces both splits to preserve the class proportions of the original.

**For classification, always pass `stratify=y`.** With a rare class it is not a refinement but a necessity: on a fraud dataset with 0.17% positives, a random split can easily put zero fraud cases in the test set, at which point your evaluation is meaningless.

<figure class="dia"><svg viewBox="0 0 720 244" role="img" aria-label="Histogram of how many of 10 positive rows land in a 20 percent test set across 5,000 random splits: usually around 2, but about one split in ten gets none; a stratified split always gets exactly 2">
<text class="sM" x="14" y="22">2,000 rows, 10 positives (0.5%), 20% test split: positives in the test set over 5,000 random splits</text>
<rect class="sR" x="60" y="151.312" width="40" height="44.688" rx="2"/><text class="sS" x="80" y="145.312" text-anchor="middle">11%</text><text class="sC" x="80" y="212" text-anchor="middle">0</text>
<rect class="sB" x="112" y="87.052" width="40" height="108.948" rx="2"/><text class="sS" x="132" y="81.052" text-anchor="middle">26%</text><text class="sC" x="132" y="212" text-anchor="middle">1</text>
<rect class="sG" x="164" y="65.212" width="40" height="130.788" rx="2"/><text class="sS" x="184" y="59.212" text-anchor="middle">31%</text><text class="sC" x="184" y="212" text-anchor="middle">2</text>
<rect class="sB" x="216" y="111.748" width="40" height="84.252" rx="2"/><text class="sS" x="236" y="105.748" text-anchor="middle">20%</text><text class="sC" x="236" y="212" text-anchor="middle">3</text>
<rect class="sB" x="268" y="159.544" width="40" height="36.456" rx="2"/><text class="sS" x="288" y="153.544" text-anchor="middle">9%</text><text class="sC" x="288" y="212" text-anchor="middle">4</text>
<rect class="sB" x="320" y="183.484" width="40" height="12.516" rx="2"/><text class="sS" x="340" y="177.484" text-anchor="middle">3%</text><text class="sC" x="340" y="212" text-anchor="middle">5</text>
<rect class="sB" x="372" y="194.152" width="40" height="1.848" rx="2"/><text class="sS" x="392" y="188.152" text-anchor="middle">0%</text><text class="sC" x="392" y="212" text-anchor="middle">6</text>
<rect class="sB" x="424" y="195.496" width="40" height="0.504" rx="2"/><text class="sS" x="444" y="189.496" text-anchor="middle">0%</text><text class="sC" x="444" y="212" text-anchor="middle">7</text>
<rect class="sB" x="476" y="196" width="40" height="0" rx="2"/><text class="sS" x="496" y="190" text-anchor="middle">0%</text><text class="sC" x="496" y="212" text-anchor="middle">8+</text>
<line class="sLm" x1="50" y1="196" x2="530" y2="196"/>
<text class="sC" x="290" y="232" text-anchor="middle">positives in the test set</text>
<rect class="sN" x="548" y="46" width="158" height="140" rx="8"/><text class="sT" x="627" y="68" text-anchor="middle">random split</text><text class="sRt" x="627" y="88" text-anchor="middle">11% of splits: 0 positives</text><text class="sC" x="627" y="106" text-anchor="middle">test recall undefined</text><text class="sT" x="627" y="140" text-anchor="middle">stratify=y</text><text class="sGt" x="627" y="160" text-anchor="middle">always exactly 2</text>
</svg><figcaption>Why stratify=y is a necessity with rare classes, not a refinement. Simulated.</figcaption></figure>

### Train / validation / test — the three-way split

The course mostly uses two sets. The ANN assignment (Part 11) uses three, and that is the more correct pattern:

```python
X_trainval, X_test, y_trainval, y_test = train_test_split(
    X, y, test_size=0.15, random_state=42, stratify=y)

X_train, X_val, y_train, y_val = train_test_split(
    X_trainval, y_trainval, test_size=0.1765, random_state=42, stratify=y_trainval)
```

(`0.1765` of 85% ≈ 15% of the original — the arithmetic is deliberate.)

| Set | Used for | Touched how often |
|---|---|---|
| **Train** | Fitting parameters | Constantly |
| **Validation** | Choosing hyperparameters, early stopping, model selection | Many times |
| **Test** | Final honest estimate | **Once** |

Every time you look at the test set and change something in response, you leak a little information into your choices. Do it enough and the test score becomes optimistic too. The discipline is: touch it once, at the end, and report whatever it says.

Cross-validation (Part 6) replaces the fixed validation set with k rotating ones and is generally better; the held-out test set stays either way.

### Data leakage, stated properly

**Leakage is any situation where information unavailable at prediction time influences training.** The three forms you will actually meet:

1. **Preprocessing leakage** — scaling, imputing or encoding fitted on the full dataset. The most common, and the one pipelines solve.
2. **Target leakage** — a feature that is a consequence of the target. `days_in_hospital` predicting `was_admitted`. Perfect scores, useless model. The test is: *would this value exist at the moment I need the prediction?*
3. **Temporal leakage** — training on future data to predict the past. Any time-ordered problem must be split by time, not randomly. (See `TimeSeriesSplit`.)

The symptom of leakage is a suspiciously good score. If your first model gets 0.99 AUC, your first hypothesis should be a bug, not brilliance.

---

## 4.6 Imbalanced classes 🟡 ⭐

> [!quote] 💬 Say it in the interview
> “With 95/5 imbalance I first change the metric (PR-AUC, recall at a precision), then try class weights, and only then SMOTE — always inside the CV folds, never before the split.”

### Detect

```python
df = pd.read_csv('../datasets/creditcard.csv')
df['Class'].value_counts()
df['Class'].value_counts() * 100 / len(df)     # as percentages
sns.countplot(x='Class', data=df, palette='viridis')
```

The credit-card fraud dataset is ~99.83% legitimate. Which means:

**A model that predicts "not fraud" for every transaction is 99.83% accurate and completely worthless.** That single sentence is the entire lesson. It is why the capstone compares against a `DummyClassifier(strategy="most_frequent")` before trusting anything.

### The three families of fix

**1. Undersample the majority**

```python
from imblearn.under_sampling import RandomUnderSampler

x_train, x_test, y_train, y_test = train_test_split(
    x, y, test_size=0.25, stratify=y, random_state=42)

rus = RandomUnderSampler(random_state=42)
x_res, y_res = rus.fit_resample(x_train, y_train)
```

Throw away majority-class rows until balanced. Fast, but on the fraud dataset it discards ~284,000 of 284,807 rows. Enormous information loss. Only sensible when you have abundant data.

**2. Oversample the minority**

```python
from imblearn.over_sampling import RandomOverSampler
ros = RandomOverSampler(random_state=42)
x_res, y_res = ros.fit_resample(x_train, y_train)
```

Duplicate minority rows until balanced. Loses nothing, but exact duplicates encourage overfitting — the model can memorise the few real minority points.

**3. SMOTE — synthesise new minority points**

```python
from imblearn.over_sampling import SMOTE
from sklearn.preprocessing import StandardScaler

x_train, x_test, y_train, y_test = train_test_split(
    x, y, test_size=0.25, stratify=y, random_state=42)

scaler = StandardScaler()
x_train_scaled = scaler.fit_transform(x_train)

sm = SMOTE(random_state=42)
x_train_res, y_train_res = sm.fit_resample(x_train_scaled, y_train)
```

> SMOTE or Synthetic Minority Oversampling Technique is a popular algorithm that creates synthetic observations of the minority class.

**How it works:** for a minority point, find its k nearest minority neighbours, pick one, and create a new point at a random position **on the line segment between them**. The result is a plausible new example rather than a copy.

<figure class="dia steps"><svg viewBox="0 0 720 242" role="img" aria-label="SMOTE: for a minority point, find its three nearest minority neighbours, pick one, and place a synthetic point at a random position on the segment between them; repeated, this fills the minority region with new points">
<circle class="sP" cx="418.2" cy="114.5" r="3.5" opacity=".45"/>
<circle class="sP" cx="107.6" cy="121.9" r="3.5" opacity=".45"/>
<circle class="sP" cx="69.5" cy="88.5" r="3.5" opacity=".45"/>
<circle class="sP" cx="68.1" cy="169.5" r="3.5" opacity=".45"/>
<circle class="sP" cx="442.5" cy="194.4" r="3.5" opacity=".45"/>
<circle class="sP" cx="96.1" cy="42.4" r="3.5" opacity=".45"/>
<circle class="sP" cx="109.9" cy="78.7" r="3.5" opacity=".45"/>
<circle class="sP" cx="42.6" cy="114.2" r="3.5" opacity=".45"/>
<circle class="sP" cx="215.0" cy="174.8" r="3.5" opacity=".45"/>
<circle class="sP" cx="449.0" cy="199.3" r="3.5" opacity=".45"/>
<circle class="sP" cx="382.9" cy="153.2" r="3.5" opacity=".45"/>
<circle class="sP" cx="162.4" cy="76.7" r="3.5" opacity=".45"/>
<circle class="sP" cx="151.4" cy="51.2" r="3.5" opacity=".45"/>
<circle class="sP" cx="432.4" cy="175.6" r="3.5" opacity=".45"/>
<circle class="sP" cx="30.2" cy="73.6" r="3.5" opacity=".45"/>
<circle class="sP" cx="441.8" cy="103.6" r="3.5" opacity=".45"/>
<circle class="sP" cx="60.7" cy="140.7" r="3.5" opacity=".45"/>
<circle class="sP" cx="357.0" cy="83.2" r="3.5" opacity=".45"/>
<circle class="sP" cx="66.6" cy="93.2" r="3.5" opacity=".45"/>
<circle class="sP" cx="434.9" cy="161.3" r="3.5" opacity=".45"/>
<circle class="sP" cx="79.6" cy="79.4" r="3.5" opacity=".45"/>
<circle class="sP" cx="72.4" cy="49.6" r="3.5" opacity=".45"/>
<circle class="sP" cx="364.7" cy="68.4" r="3.5" opacity=".45"/>
<circle class="sP" cx="264.9" cy="111.6" r="3.5" opacity=".45"/>
<circle class="sP" cx="110.1" cy="157.1" r="3.5" opacity=".45"/>
<circle class="sP" cx="85.0" cy="143.0" r="3.5" opacity=".45"/>
<circle class="sP" cx="78.9" cy="107.3" r="3.5" opacity=".45"/>
<circle class="sP" cx="119.4" cy="83.2" r="3.5" opacity=".45"/>
<circle class="sP" cx="437.8" cy="168.5" r="3.5" opacity=".45"/>
<circle class="sP" cx="157.7" cy="181.6" r="3.5" opacity=".45"/>
<circle class="sP" cx="118.5" cy="103.1" r="3.5" opacity=".45"/>
<circle class="sP" cx="388.8" cy="142.7" r="3.5" opacity=".45"/>
<circle class="sP" cx="72.1" cy="198.3" r="3.5" opacity=".45"/>
<circle class="sP" cx="119.6" cy="81.3" r="3.5" opacity=".45"/>
<circle class="sP" cx="154.5" cy="51.7" r="3.5" opacity=".45"/>
<circle class="sP" cx="67.8" cy="133.2" r="3.5" opacity=".45"/>
<circle class="sP" cx="132.1" cy="136.2" r="3.5" opacity=".45"/>
<circle class="sP" cx="186.1" cy="112.5" r="3.5" opacity=".45"/>
<circle class="sP" cx="432.8" cy="117.4" r="3.5" opacity=".45"/>
<circle class="sP" cx="106.8" cy="64.7" r="3.5" opacity=".45"/>
<circle class="sP" cx="411.5" cy="170.8" r="3.5" opacity=".45"/>
<circle class="sP" cx="134.8" cy="70.4" r="3.5" opacity=".45"/>
<circle class="sP" cx="340.6" cy="190.5" r="3.5" opacity=".45"/>
<circle class="sP" cx="112.6" cy="192.0" r="3.5" opacity=".45"/>
<circle class="sP" cx="400.5" cy="136.6" r="3.5" opacity=".45"/>
<circle class="sP" cx="207.0" cy="56.6" r="3.5" opacity=".45"/>
<circle class="sPr" cx="250" cy="80" r="5"/>
<circle class="sPr" cx="316" cy="56" r="5"/>
<circle class="sPr" cx="340" cy="120" r="5"/>
<circle class="sPr" cx="282" cy="150" r="5"/>
<circle class="sPr" cx="392" cy="92" r="5"/>
<circle class="sPr" cx="236" cy="140" r="5"/>
<g data-s="1"><line class="sD" x1="250" y1="80" x2="236" y2="140"/><line class="sD" x1="250" y1="80" x2="316" y2="56"/><line class="sD" x1="250" y1="80" x2="282" y2="150"/><circle class="sPr" cx="250" cy="80" r="9" style="fill:none;stroke-width:2"/><text class="sRt" x="236" y="98" text-anchor="end">x</text></g>
<g data-s="2"><line class="sLg" x1="250" y1="80" x2="316" y2="56"/><circle class="sPg" cx="289.6" cy="65.6" r="5"/><text class="sC" x="322" y="44">neighbour</text><text class="sGt" x="283.6" y="55.6" text-anchor="end">new point</text></g>
<g data-s="3"><circle class="sPg" cx="242.8" cy="110.7" r="4" opacity=".8"/><circle class="sPg" cx="265.7" cy="74.3" r="4" opacity=".8"/><circle class="sPg" cx="262.5" cy="107.4" r="4" opacity=".8"/><circle class="sPg" cx="261.6" cy="75.8" r="4" opacity=".8"/><circle class="sPg" cx="353.3" cy="73.7" r="4" opacity=".8"/><circle class="sPg" cx="329.3" cy="62.3" r="4" opacity=".8"/><circle class="sPg" cx="316.5" cy="57.5" r="4" opacity=".8"/><circle class="sPg" cx="351.9" cy="113.6" r="4" opacity=".8"/><circle class="sPg" cx="324.3" cy="78.2" r="4" opacity=".8"/><circle class="sPg" cx="262.3" cy="107.0" r="4" opacity=".8"/><circle class="sPg" cx="294.3" cy="143.6" r="4" opacity=".8"/><circle class="sPg" cx="247.5" cy="142.5" r="4" opacity=".8"/><circle class="sPg" cx="378.0" cy="99.5" r="4" opacity=".8"/><circle class="sPg" cx="373.1" cy="83.0" r="4" opacity=".8"/><circle class="sPg" cx="382.8" cy="96.9" r="4" opacity=".8"/><circle class="sPg" cx="243.4" cy="108.1" r="4" opacity=".8"/><circle class="sPg" cx="240.2" cy="140.9" r="4" opacity=".8"/><circle class="sPg" cx="277.0" cy="148.9" r="4" opacity=".8"/></g>
<rect class="sN" x="480" y="30" width="226" height="172" rx="8"/>
<text class="sT" x="593" y="54" text-anchor="middle">x_new = x + λ·(x_nn − x)</text><text class="sC" x="593" y="76" text-anchor="middle">λ uniform in [0, 1]</text>
<circle class="sP" cx="500" cy="104" r="4" opacity=".45"/><text class="sC" x="512" y="108">majority class</text>
<circle class="sPr" cx="500" cy="128" r="4"/><text class="sC" x="512" y="132">real minority rows</text>
<circle class="sPg" cx="500" cy="152" r="4"/><text class="sC" x="512" y="156">synthetic minority rows</text>
<text class="sS" x="593" y="186" text-anchor="middle">k = 3 nearest minority neighbours</text>
<text class="sS" x="360" y="230" text-anchor="middle">new points stay inside the region the minority class already occupies: no copies, no new information</text>
</svg><ol class="dia-steps">
<li>Take a real minority row <b>x</b> and find its k nearest neighbours <b>of the same class</b> (k = 5 by default; 3 here). Distance is involved, which is why you scale first.</li>
<li>Pick one neighbour at random and place a new row at a random point on the segment between them: x + λ·(neighbour − x).</li>
<li>Repeat for every minority row until the classes balance. The synthetic rows are interpolations, never copies, but they add no information beyond the real rows.</li>
</ol><figcaption>How SMOTE invents minority rows. Points and neighbours computed.</figcaption></figure>

Three things that follow from that mechanism:

- **Scale first.** SMOTE uses nearest neighbours, which uses distance. The notebook scales before SMOTE, correctly.
- **Numeric features only.** Interpolating between one-hot columns produces `0.37` of a category, which is meaningless. Use `SMOTENC` for mixed data.
- **Never on the test set.** Only the training fold gets resampled. Evaluating on synthetic data measures nothing.

The `SMOTE` family the notebook lists:

- **SMOTETomek** — SMOTE, then remove Tomek links (pairs of opposite-class nearest neighbours), cleaning the boundary.
- **SMOTEENN** — SMOTE, then Edited Nearest Neighbours removal. More aggressive cleaning.

**4. The fourth option, and often the best: `class_weight='balanced'`**

The course under-sells this. Most sklearn classifiers accept it:

```python
LogisticRegression(class_weight='balanced')
RandomForestClassifier(class_weight='balanced')
```

It does not touch your data at all — it re-weights the *loss function* so that errors on the minority class cost proportionally more. No synthetic points, no discarded rows, no leakage risk, one keyword. The capstone uses both this and SMOTE, and the AI_Project readme uses `class_weight='balanced'` alone.

**Start here.** Reach for SMOTE only if reweighting is not enough.

### ⚠️ The critical detail: SMOTE must live inside the CV pipeline

If you resample and *then* cross-validate, the synthetic points generated from a given minority row can end up in the validation fold while their source is in training. That is leakage, and it inflates your score substantially.

<figure class="dia"><svg viewBox="0 0 720 234" role="img" aria-label="Resampling before cross-validation puts synthetic copies of training rows into validation folds and inflates the score; resampling inside each fold's training portion keeps validation rows real">
<text class="sRt" x="14" y="28">wrong: resample, then cross-validate</text><rect class="sB" x="14" y="36" width="152" height="54" rx="8"/><text class="sT" x="90" y="61" text-anchor="middle">all training rows</text><text class="sC" x="90" y="77" text-anchor="middle">950 vs 50</text><line class="sLm" x1="166" y1="63" x2="182" y2="63" marker-end="url(#ahm)"/><rect class="sR" x="184" y="36" width="152" height="54" rx="8"/><text class="sT" x="260" y="61" text-anchor="middle">SMOTE</text><text class="sC" x="260" y="77" text-anchor="middle">+900 synthetic</text><line class="sLm" x1="336" y1="63" x2="352" y2="63" marker-end="url(#ahm)"/><rect class="sB" x="354" y="36" width="152" height="54" rx="8"/><text class="sT" x="430" y="61" text-anchor="middle">split into 5 folds</text><text class="sC" x="430" y="77" text-anchor="middle">random rows</text><line class="sLm" x1="506" y1="63" x2="522" y2="63" marker-end="url(#ahm)"/><rect class="sB" x="524" y="36" width="152" height="54" rx="8"/><text class="sT" x="600" y="61" text-anchor="middle">validate fold k</text><text class="sC" x="600" y="77" text-anchor="middle">twins of training rows</text><text class="sRt" x="706" y="112" text-anchor="end">synthetic twins of a training row sit in the validation fold: the score is inflated</text>
<text class="sGt" x="14" y="136">right: cross-validate, resample inside each fold</text><rect class="sB" x="14" y="144" width="152" height="54" rx="8"/><text class="sT" x="90" y="169" text-anchor="middle">all training rows</text><text class="sC" x="90" y="185" text-anchor="middle">950 vs 50</text><line class="sLm" x1="166" y1="171" x2="182" y2="171" marker-end="url(#ahm)"/><rect class="sG" x="184" y="144" width="152" height="54" rx="8"/><text class="sT" x="260" y="169" text-anchor="middle">split into 5 folds</text><text class="sC" x="260" y="185" text-anchor="middle">real rows only</text><line class="sLm" x1="336" y1="171" x2="352" y2="171" marker-end="url(#ahm)"/><rect class="sB" x="354" y="144" width="152" height="54" rx="8"/><text class="sT" x="430" y="169" text-anchor="middle">SMOTE on 4 folds</text><text class="sC" x="430" y="185" text-anchor="middle">fit time only</text><line class="sLm" x1="506" y1="171" x2="522" y2="171" marker-end="url(#ahm)"/><rect class="sB" x="524" y="144" width="152" height="54" rx="8"/><text class="sT" x="600" y="169" text-anchor="middle">validate fold k</text><text class="sC" x="600" y="185" text-anchor="middle">real rows, untouched</text><text class="sGt" x="706" y="220" text-anchor="end">the validation fold looks exactly like production data: the score is honest</text>
</svg><figcaption>Order matters: imblearn's Pipeline runs SMOTE at fit time on each fold's training part and skips it at predict time.</figcaption></figure>

The correct construction — from the capstone — uses `imblearn`'s pipeline, which knows to apply resampling only during `fit`:

```python
from imblearn.pipeline import Pipeline as ImbPipeline

pipe = ImbPipeline(steps=[
    ("preprocess", preprocessor),
    ("smote", SMOTE(random_state=RANDOM_STATE)),
    ("model", model)
])
```

`imblearn.pipeline.Pipeline`, not `sklearn.pipeline.Pipeline`. The sklearn one will not skip the resampler at predict time.

---

## 4.7 Feature scaling 🟢 ⭐

> [!info] 📖 Géron Ch. 2 · “Feature Scaling and Transformation” · pp. 77–81

![Scalers change the range; only transforms such as log or Box-Cox change the shape of a skewed feature.](figures/fig04_scalers.png)
*Scalers change the range; only transforms such as log or Box-Cox change the shape of a skewed feature.*

> [!quote] 💬 Say it in the interview
> “Distance- and gradient-based models (KNN, SVM, logistic regression, neural nets, PCA) need scaling; trees don't. StandardScaler by default, MinMax for bounded inputs, log first for heavy tails.”

### Why

> the independent or feature variables may be mapped onto different scales. This could cause some problems, like a feature with a higher value range makes the model biased to this feature and it starts dominating.

Concretely: `age` ranges 0–100, `salary` ranges 0–200,000. In a Euclidean distance, the salary difference swamps the age difference entirely — not because salary matters more, but because its units are bigger. Change salary to thousands and the model changes. That is a bug, not a modelling choice.

<figure class="dia"><svg viewBox="0 0 720 238" role="img" aria-label="KNN distance before and after scaling: in raw units the nearest neighbour of a 30-year-old earning 50k is a 70-year-old earning 51k, because the 40-year age gap is negligible next to salary; after standardising, the nearest neighbour is a 32-year-old earning 58k">
<rect class="sN" x="14" y="30" width="330" height="170" rx="8"/><text class="sRt" x="179" y="22" text-anchor="middle">raw units: salary swamps age</text>
<rect class="sN" x="376" y="30" width="330" height="170" rx="8"/><text class="sGt" x="541" y="22" text-anchor="middle">standardised: both count</text>
<line class="sLm" x1="150" y1="40" x2="150" y2="194"/><text class="sS" x="144" y="144" text-anchor="end">50k</text><text class="sS" x="144" y="64" text-anchor="end">58k</text><text class="sS" x="144" y="190" text-anchor="end">45k</text>
<line class="sLr" x1="180" y1="140" x2="180" y2="130"/><line class="sD" x1="180" y1="130" x2="180" y2="60"/>
<circle class="sP" cx="180" cy="140.0" r="5"/><text class="sC" x="190" y="154">Q: age 30, 50k</text>
<circle class="sPg" cx="180" cy="60.0" r="5"/><text class="sC" x="190" y="64">A: age 32, 58k</text>
<circle class="sPr" cx="180" cy="130.0" r="5"/><text class="sC" x="190" y="126">B: age 70, 51k</text>
<text class="sRt" x="158" y="186">nearest to Q: B, the 70-year-old</text>
<text class="sS" x="26" y="60">same units on</text><text class="sS" x="26" y="74">both axes: all</text><text class="sS" x="26" y="88">ages collapse</text><text class="sS" x="26" y="102">onto one line</text>
<line class="sLm" x1="400" y1="150" x2="690" y2="150"/><line class="sLm" x1="420" y1="44" x2="420" y2="190"/><text class="sS" x="690" y="166" text-anchor="end">age (z)</text><text class="sS" x="426" y="50">salary (z)</text>
<line class="sLg" x1="420" y1="150" x2="432" y2="126"/><line class="sD" x1="420" y1="150" x2="660" y2="147"/>
<circle class="sP" cx="420.0" cy="150.0" r="5"/>
<circle class="sPg" cx="432.0" cy="126.0" r="5"/>
<circle class="sPr" cx="660.0" cy="147.0" r="5"/>
<text class="sC" x="412" y="168" text-anchor="middle">Q</text><text class="sGt" x="442" y="122">A 0.30</text><text class="sC" x="660" y="135" text-anchor="middle">B 2.67</text>
<text class="sGt" x="541" y="186" text-anchor="middle">nearest to Q: A, the 32-year-old</text>
<text class="sS" x="360" y="226" text-anchor="middle">standardised with σ(age) = 15 years and σ(salary) = 30,000: each feature now moves the distance by its spread, not its units</text>
</svg><figcaption>The same three people, two distance computations. Raw: |QA| = 8,000, |QB| = 1,001. Standardised: 0.30 vs 2.67. Computed.</figcaption></figure>

### Which algorithms care

| Needs scaling | Does not care |
|---|---|
| KNN (distance) | Decision Trees |
| SVM (distance / kernels) | Random Forests |
| Logistic & Linear Regression **with regularisation** | Gradient Boosting (XGBoost, LightGBM) |
| Neural networks (gradient conditioning) | Naive Bayes |
| PCA (variance-based) | |
| K-Means (distance) | |

**The rule:** if the algorithm computes a **distance** or follows a **gradient**, scale. If it makes **axis-aligned splits** on one feature at a time, do not bother — a tree asking "is age > 30?" is unaffected by the units of salary.

This is why the capstone still scales inside its pipeline even when comparing tree models: the same pipeline must serve Logistic Regression and KNN, and scaling is harmless for the trees.

### The three scalers

**MinMaxScaler — normalisation to [0, 1]**

> x(i)norm = (xᵢ − xmin) / (xmax − xmin)

Bounded output. Use when you need a fixed range (image pixels, some neural network input layers). **Extremely sensitive to outliers** — one huge value compresses everything else into a sliver near zero.

**StandardScaler — standardisation to μ=0, σ=1**

> we centre the feature columns at mean 0 with standard deviation 1 so that the feature columns take the form of a normal distribution

> z = (x − μ) / σ

Unbounded output, typically in [−3, 3]. **The default choice.** Better for optimisation algorithms, as the notebook says — a gradient descent surface over standardised features is far better conditioned (see Part 6).

Note it does **not** make a distribution normal. It re-centres and re-scales; a skewed distribution stays skewed. For actual normality you need a transform — `PowerTransformer` (Yeo-Johnson) or `np.log1p`.

**RobustScaler**

> x(i)RS = (x − median) / IQR

```python
from sklearn.preprocessing import RobustScaler
scaler = RobustScaler()
x_train[['tip', 'total_bill']] = scaler.fit_transform(x_train[['tip', 'total_bill']])
```

Median and IQR instead of mean and σ — the same robustness argument as §4.4. **Use when outliers are present and you want to keep them.**

### The correct application — the notebook gets this exactly right

```python
scaler = StandardScaler()
columns = ['total_bill', 'size']

scaler.fit(x_train[columns])                             # LEARN from train only
x_train[columns] = scaler.transform(x_train[columns])    # apply to train
x_test[columns]  = scaler.transform(x_test[columns])     # apply SAME params to test
```

Read those three lines again. `fit` on train. `transform` both. **Never `fit_transform(x_test)`** — that would compute a *new* mean and σ from test data, which is leakage and also produces a differently-scaled space than the model was trained in.

Note also that only the numeric columns are scaled, and one-hot columns are left alone (they are already 0/1).

The notebook's before/after KDE plots make the effect visible:

```python
sns.kdeplot(df['total_bill'], shade=True)   # current seaborn: fill=True
sns.kdeplot(df['size'], shade=True)
# ... after scaling, the two curves sit on the same axis
```

---

## 4.8 Assembling it: the preprocessing pipeline 🟡 ⭐

> [!info] 📖 Géron Ch. 2 · “Transformation Pipelines” · pp. 86–90

> [!quote] 💬 Say it in the interview
> “My model is a `Pipeline` of a `ColumnTransformer` plus the estimator. That makes cross-validation honest and lets production send raw rows.”

Everything in this part composes into one object. This construction appears in every project notebook from Part 7 onward and is the single most reusable thing in the course:

```python
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler, OneHotEncoder

num_cols = X.select_dtypes(include="number").columns.tolist()
cat_cols = X.select_dtypes(include=["object", "category", "bool"]).columns.tolist()

numeric_pipe = Pipeline(steps=[
    ("imputer", SimpleImputer(strategy="median")),
    ("clip",    IQRClipper(factor=1.5)),
    ("scaler",  StandardScaler())
])

categorical_pipe = Pipeline(steps=[
    ("imputer", SimpleImputer(strategy="most_frequent")),
    ("onehot",  OneHotEncoder(handle_unknown="ignore"))
])

preprocessor = ColumnTransformer(transformers=[
    ("num", numeric_pipe, num_cols),
    ("cat", categorical_pipe, cat_cols)
], remainder="drop")
```

**What each piece does:**

<figure class="dia steps"><svg viewBox="0 0 720 244" role="img" aria-label="A six-row DataFrame flows through the preprocessor: age and income go to a numeric pipeline that imputes the median, clips the income outlier and scales, city and plan go to a categorical pipeline that imputes the most frequent value and one-hot encodes, the date column is dropped, and the result is a 6 by 7 numeric matrix">
<text class="sM" x="360" y="16" text-anchor="middle">Pipeline inside a ColumnTransformer, run by scikit-learn on a 6-row frame</text>
<rect class="sN" x="14" y="30" width="34" height="20" rx="3"/><text class="sS" x="31" y="44" text-anchor="middle">age</text>
<rect class="sN" x="50" y="30" width="46" height="20" rx="3"/><text class="sS" x="73" y="44" text-anchor="middle">income</text>
<rect class="sN" x="98" y="30" width="46" height="20" rx="3"/><text class="sS" x="121" y="44" text-anchor="middle">city</text>
<rect class="sN" x="146" y="30" width="42" height="20" rx="3"/><text class="sS" x="167" y="44" text-anchor="middle">plan</text>
<rect class="sN" x="190" y="30" width="60" height="20" rx="3"/><text class="sS" x="220" y="44" text-anchor="middle">signup</text>
<text class="sS" x="31" y="67" text-anchor="middle">34</text>
<text class="sS" x="73" y="67" text-anchor="middle">42</text>
<text class="sS" x="121" y="67" text-anchor="middle">Cairo</text>
<text class="sS" x="167" y="67" text-anchor="middle">basic</text>
<text class="sS" x="220" y="67" text-anchor="middle">2024-01</text>
<text class="sS" x="31" y="89" text-anchor="middle">28</text>
<text class="sS" x="73" y="89" text-anchor="middle">38</text>
<text class="sS" x="121" y="89" text-anchor="middle">Giza</text>
<text class="sS" x="167" y="89" text-anchor="middle">pro</text>
<text class="sS" x="220" y="89" text-anchor="middle">2024-02</text>
<text class="sRt" x="31" y="111" text-anchor="middle">NaN</text>
<text class="sS" x="73" y="111" text-anchor="middle">51</text>
<text class="sS" x="121" y="111" text-anchor="middle">Cairo</text>
<text class="sS" x="167" y="111" text-anchor="middle">basic</text>
<text class="sS" x="220" y="111" text-anchor="middle">2024-03</text>
<text class="sS" x="31" y="133" text-anchor="middle">45</text>
<text class="sS" x="73" y="133" text-anchor="middle">47</text>
<text class="sRt" x="121" y="133" text-anchor="middle">NaN</text>
<text class="sS" x="167" y="133" text-anchor="middle">basic</text>
<text class="sS" x="220" y="133" text-anchor="middle">2024-03</text>
<text class="sS" x="31" y="155" text-anchor="middle">52</text>
<text class="sRt" x="73" y="155" text-anchor="middle">300</text>
<text class="sS" x="121" y="155" text-anchor="middle">Alex</text>
<text class="sS" x="167" y="155" text-anchor="middle">pro</text>
<text class="sS" x="220" y="155" text-anchor="middle">2024-05</text>
<text class="sS" x="31" y="177" text-anchor="middle">39</text>
<text class="sS" x="73" y="177" text-anchor="middle">44</text>
<text class="sS" x="121" y="177" text-anchor="middle">Cairo</text>
<text class="sS" x="167" y="177" text-anchor="middle">pro</text>
<text class="sS" x="220" y="177" text-anchor="middle">2024-06</text>
<text class="sS" x="130" y="200" text-anchor="middle">X: 6 rows × 5 columns</text>
<g data-s="2"><rect class="sG" x="14" y="30" width="34" height="20" rx="3" opacity=".55"/><rect class="sG" x="50" y="30" width="46" height="20" rx="3" opacity=".55"/><rect class="sV" x="98" y="30" width="46" height="20" rx="3" opacity=".55"/><rect class="sV" x="146" y="30" width="42" height="20" rx="3" opacity=".55"/><rect class="sR" x="190" y="30" width="60" height="20" rx="3" opacity=".55"/><line class="sLg" x1="250" y1="92" x2="270" y2="72" marker-end="url(#ahg)"/><line class="sLv" x1="250" y1="128" x2="270" y2="150" marker-end="url(#ahv)"/><line class="sLr" x1="250" y1="176" x2="270" y2="218" marker-end="url(#ahr)"/><rect class="sG" x="274" y="34" width="176" height="92" rx="8"/><text class="sT" x="362" y="52" text-anchor="middle">num: age, income</text><text class="sS" x="362" y="69" text-anchor="middle">median → clip → scale</text><rect class="sV" x="274" y="132" width="176" height="72" rx="8"/><text class="sT" x="362" y="150" text-anchor="middle">cat: city, plan</text><text class="sS" x="362" y="167" text-anchor="middle">most_frequent → one-hot</text><rect class="sR" x="274" y="210" width="176" height="24" rx="6"/><text class="sS" x="362" y="226" text-anchor="middle">remainder='drop': signup</text></g>
<g data-s="3"><text class="sGt" x="362" y="89" text-anchor="middle">age NaN → 39 (median)</text><text class="sGt" x="362" y="106" text-anchor="middle">income 300 → 61.2 (fence)</text><text class="sS" x="362" y="120" text-anchor="middle">then scaled: mean 0, sd 1</text></g>
<g data-s="4"><text class="sGt" x="362" y="185" text-anchor="middle">city NaN → Cairo; 5 dummies</text></g>
<g data-s="5"><line class="sLg" x1="452" y1="80" x2="464" y2="80" marker-end="url(#ahg)"/><line class="sLv" x1="452" y1="168" x2="464" y2="168" marker-end="url(#ahv)"/><rect class="sG" x="466" y="30" width="32.5" height="20" rx="3" opacity=".55"/><text class="sS" x="482.25" y="44" text-anchor="middle">age</text><text class="sS" x="482.25" y="67" text-anchor="middle">-0.72</text><text class="sS" x="482.25" y="89" text-anchor="middle">-1.51</text><text class="sS" x="482.25" y="111" text-anchor="middle">-0.07</text><text class="sS" x="482.25" y="133" text-anchor="middle">0.72</text><text class="sS" x="482.25" y="155" text-anchor="middle">1.64</text><text class="sS" x="482.25" y="177" text-anchor="middle">-0.07</text><rect class="sG" x="500.5" y="30" width="32.5" height="20" rx="3" opacity=".55"/><text class="sS" x="516.75" y="44" text-anchor="middle">inc</text><text class="sS" x="516.75" y="67" text-anchor="middle">-0.70</text><text class="sS" x="516.75" y="89" text-anchor="middle">-1.23</text><text class="sS" x="516.75" y="111" text-anchor="middle">0.51</text><text class="sS" x="516.75" y="133" text-anchor="middle">-0.03</text><text class="sS" x="516.75" y="155" text-anchor="middle">1.88</text><text class="sS" x="516.75" y="177" text-anchor="middle">-0.43</text><rect class="sV" x="535" y="30" width="32.5" height="20" rx="3" opacity=".55"/><text class="sS" x="551.25" y="44" text-anchor="middle">Alex</text><text class="sS" x="551.25" y="67" text-anchor="middle" opacity=".45">0</text><text class="sS" x="551.25" y="89" text-anchor="middle" opacity=".45">0</text><text class="sS" x="551.25" y="111" text-anchor="middle" opacity=".45">0</text><text class="sS" x="551.25" y="133" text-anchor="middle" opacity=".45">0</text><text class="sS" x="551.25" y="155" text-anchor="middle">1</text><text class="sS" x="551.25" y="177" text-anchor="middle" opacity=".45">0</text><rect class="sV" x="569.5" y="30" width="32.5" height="20" rx="3" opacity=".55"/><text class="sS" x="585.75" y="44" text-anchor="middle">Cairo</text><text class="sS" x="585.75" y="67" text-anchor="middle">1</text><text class="sS" x="585.75" y="89" text-anchor="middle" opacity=".45">0</text><text class="sS" x="585.75" y="111" text-anchor="middle">1</text><text class="sS" x="585.75" y="133" text-anchor="middle">1</text><text class="sS" x="585.75" y="155" text-anchor="middle" opacity=".45">0</text><text class="sS" x="585.75" y="177" text-anchor="middle">1</text><rect class="sV" x="604" y="30" width="32.5" height="20" rx="3" opacity=".55"/><text class="sS" x="620.25" y="44" text-anchor="middle">Giza</text><text class="sS" x="620.25" y="67" text-anchor="middle" opacity=".45">0</text><text class="sS" x="620.25" y="89" text-anchor="middle">1</text><text class="sS" x="620.25" y="111" text-anchor="middle" opacity=".45">0</text><text class="sS" x="620.25" y="133" text-anchor="middle" opacity=".45">0</text><text class="sS" x="620.25" y="155" text-anchor="middle" opacity=".45">0</text><text class="sS" x="620.25" y="177" text-anchor="middle" opacity=".45">0</text><rect class="sV" x="638.5" y="30" width="32.5" height="20" rx="3" opacity=".55"/><text class="sS" x="654.75" y="44" text-anchor="middle">basic</text><text class="sS" x="654.75" y="67" text-anchor="middle">1</text><text class="sS" x="654.75" y="89" text-anchor="middle" opacity=".45">0</text><text class="sS" x="654.75" y="111" text-anchor="middle">1</text><text class="sS" x="654.75" y="133" text-anchor="middle">1</text><text class="sS" x="654.75" y="155" text-anchor="middle" opacity=".45">0</text><text class="sS" x="654.75" y="177" text-anchor="middle" opacity=".45">0</text><rect class="sV" x="673" y="30" width="32.5" height="20" rx="3" opacity=".55"/><text class="sS" x="689.25" y="44" text-anchor="middle">pro</text><text class="sS" x="689.25" y="67" text-anchor="middle" opacity=".45">0</text><text class="sS" x="689.25" y="89" text-anchor="middle">1</text><text class="sS" x="689.25" y="111" text-anchor="middle" opacity=".45">0</text><text class="sS" x="689.25" y="133" text-anchor="middle" opacity=".45">0</text><text class="sS" x="689.25" y="155" text-anchor="middle">1</text><text class="sS" x="689.25" y="177" text-anchor="middle">1</text><text class="sGt" x="586.75" y="200" text-anchor="middle">Xt.shape = (6, 7): numbers only</text></g>
</svg><ol class="dia-steps">
<li>The raw frame: a missing age, an income outlier (300), a missing city, and a date column.</li>
<li>select_dtypes routes the number columns to the numeric branch and the text columns to the categorical one. The date is in neither list, so remainder='drop' discards it.</li>
<li>The numeric branch learns its parameters in fit: median age 39, an upper income fence of 61.2, then the scaler's mean and sd.</li>
<li>The categorical branch fills the missing city with the most frequent value (Cairo) and one-hot encodes city (3 columns) and plan (2).</li>
<li>The branches are concatenated: a 6 × 7 numeric matrix the estimator can use. pipe.predict on a raw row replays exactly these steps.</li>
</ol><figcaption>The preprocessor above, run for real on six rows: what each branch receives, what it learns, and the matrix that comes out.</figcaption></figure>

- **`Pipeline`** chains steps so that `fit` flows through all of them in order, and `transform` at predict time replays exactly the same learned parameters.
- **`ColumnTransformer`** routes different columns down different branches — numeric columns get imputed/clipped/scaled, categorical columns get imputed/encoded — then concatenates the results.
- **`remainder="drop"`** discards any column not explicitly listed. The alternative, `"passthrough"`, keeps them unchanged. Being explicit prevents a stray ID column from silently entering your model.

**Why this is not optional:** because the whole object has one `fit` and one `transform`, leakage becomes *structurally impossible*. When you pass this pipeline to `cross_validate`, sklearn refits the imputer, the clipper, the scaler and the encoder **inside each fold**, on that fold's training portion only. You cannot get it wrong by accident.

It also means `joblib.dump(pipe, 'model.joblib')` saves the preprocessing *with* the model. At inference you load one object and hand it a raw DataFrame row. No separate scaler file to keep in sync — which is the classic production bug this design eliminates.

---

## 4.9 The checklist 🟢

For any new tabular dataset, in order:

1. **Load** with the right `sep`, `encoding`, and `na_values`.
2. **Profile** — `shape`, `info()`, `describe()`, `describe(include='O')`, missing rate, duplicate count, unique values per categorical (watch for `'Dry '` vs `'Dry'`).
3. **Fix types** — `to_numeric(errors='coerce')`, `to_datetime`, `astype('category')`.
4. **Validate domains** — check min/max against physical possibility.
5. **Drop identifiers** — anything with cardinality ≈ n rows.
6. **Engineer features** — split compound columns, extract datetime parts, build flags.
7. **Split** — `train_test_split(..., stratify=y)` for classification. **Do this before anything below.**
8. **Build the pipeline** — impute → outlier-handle → scale for numeric; impute → encode for categorical.
9. **Handle imbalance** — `class_weight='balanced'` first; SMOTE inside the pipeline if needed.
10. **Fit on train, evaluate once on test.**

Steps 7 and 8 are the ones people get wrong. Everything before step 7 that computes a statistic from data is a potential leak.

---

## 4.10 Going deeper, with Géron (*Hands-On ML*, Ch. 2) 🟡

> [!info] 📖 Géron Ch. 2 · “Create a Test Set” → “Transformation Pipelines” · pp. 57–90

> [!note] 📘 From the book
> This section and the ones after it add material from Géron's *Hands-On Machine Learning with Scikit-Learn and PyTorch* (2025), Chapter 2, "End-to-End Machine Learning Project". The course covered the core; Géron adds the techniques a mid-level interviewer expects you to know by name.

### 4.10.1 Set the test set aside *before* you explore

Géron's first warning in the chapter comes right after one `hist()` call:

> Before you look at the data any further, you need to create a test set, put it aside, and never look at it.

The reason is **data snooping bias**. Your brain is a pattern detector and it overfits. If you look at the test set during EDA, you may notice a pattern and pick a model because of it. The test score then comes out optimistic. So: do a quick first look (`head`, `info`, `describe`, histograms), split, and then run all deeper EDA on the **training set only**. Part 7 was more relaxed about this; Géron's rule is the stricter one, and the one to quote in an interview.

### 4.10.2 Stable splits when the data grows

`train_test_split(random_state=42)` gives the same split every time you run it on the **same** data. When the dataset is refreshed with new rows, the shuffle changes and rows that were in the test set can move into training. Over several refreshes your model will have seen the whole dataset.

Géron's fix is to **hash a stable ID** and put a row in the test set when the hash falls in the bottom 20%:

```python
from zlib import crc32
import numpy as np

def is_id_in_test_set(identifier, test_ratio):
    return crc32(np.int64(identifier)) < test_ratio * 2**32

def split_data_with_id_hash(data, test_ratio, id_column):
    ids = data[id_column]
    in_test_set = ids.apply(lambda id_: is_id_in_test_set(id_, test_ratio))
    return data.loc[~in_test_set], data.loc[in_test_set]
```

A row's test/train membership now depends only on its own ID, so it never changes. (Telecom example: hash the `customer_id` or `MSISDN` so a subscriber stays in the same set across monthly snapshots.)

### 4.10.3 Stratifying on a *feature*, not just the target

Part 4.5 stratified on `y`. Géron stratifies on an **important input feature**. Median income is the strongest predictor of house price, so he makes the test set match the training set's income mix:

```python
housing["income_cat"] = pd.cut(housing["median_income"],
                               bins=[0., 1.5, 3.0, 4.5, 6., np.inf],
                               labels=[1, 2, 3, 4, 5])

strat_train_set, strat_test_set = train_test_split(
    housing, test_size=0.2, stratify=housing["income_cat"], random_state=42)

for set_ in (strat_train_set, strat_test_set):
    set_.drop("income_cat", axis=1, inplace=True)   # helper column, remove after
```

Rules for building the strata:
- **Few strata, each one large enough.** Too many small strata make the per-stratum estimates noisy.
- For a **regression** target, bin the target (or a key feature) with `pd.cut` and stratify on the bins. That answers the "you can't stratify a regression" objection.

Géron's survey example shows why this matters. 51.6% of US voting-age citizens are female (US Census), so a good survey of 1,000 people keeps **516 women and 484 men**. With purely random sampling there is **over a 10% chance** of a skewed sample with below 49% or above 54% women (Géron Ch. 2, p. 57).

`StratifiedShuffleSplit(n_splits=10, test_size=0.2)` gives you many stratified splits. That is useful for repeated evaluation.

### 4.10.4 Correlation — and its blind spot

```python
corr_matrix = housing.corr(numeric_only=True)
corr_matrix["median_house_value"].sort_values(ascending=False)
```

Pearson's r only measures **linear** relationships. Remember two points:

1. **r = 0 does not mean independent.** A parabola, a circle or a V-shape can all have r ≈ 0 while `y` is fully determined by `x`.
2. **r is not the slope.** Height in inches and height in centimetres correlate at exactly 1.0. The strength of the association and the size of the effect are different things.

<figure class="dia"><svg viewBox="0 0 720 248" role="img" aria-label="Pearson correlation on four point clouds: a noisy line has r near 1, a parabola and a circle have r near 0 despite a perfect relationship, and a rescaled line has r equal to 1">
<rect class="sN" x="14" y="30" width="160" height="160" rx="6"/>
<circle class="sP" cx="24.0" cy="173.9" r="3"/>
<circle class="sP" cx="27.6" cy="161.3" r="3"/>
<circle class="sP" cx="31.2" cy="149.4" r="3"/>
<circle class="sP" cx="34.8" cy="144.5" r="3"/>
<circle class="sP" cx="38.4" cy="144.6" r="3"/>
<circle class="sP" cx="41.9" cy="151.2" r="3"/>
<circle class="sP" cx="45.5" cy="146.0" r="3"/>
<circle class="sP" cx="49.1" cy="148.0" r="3"/>
<circle class="sP" cx="52.7" cy="154.0" r="3"/>
<circle class="sP" cx="56.3" cy="144.0" r="3"/>
<circle class="sP" cx="59.9" cy="129.4" r="3"/>
<circle class="sP" cx="63.5" cy="132.3" r="3"/>
<circle class="sP" cx="67.1" cy="134.2" r="3"/>
<circle class="sP" cx="70.7" cy="137.5" r="3"/>
<circle class="sP" cx="74.3" cy="126.6" r="3"/>
<circle class="sP" cx="77.8" cy="127.8" r="3"/>
<circle class="sP" cx="81.4" cy="119.7" r="3"/>
<circle class="sP" cx="85.0" cy="113.1" r="3"/>
<circle class="sP" cx="88.6" cy="133.4" r="3"/>
<circle class="sP" cx="92.2" cy="112.2" r="3"/>
<circle class="sP" cx="95.8" cy="120.8" r="3"/>
<circle class="sP" cx="99.4" cy="113.5" r="3"/>
<circle class="sP" cx="103.0" cy="113.2" r="3"/>
<circle class="sP" cx="106.6" cy="90.7" r="3"/>
<circle class="sP" cx="110.2" cy="91.5" r="3"/>
<circle class="sP" cx="113.7" cy="90.0" r="3"/>
<circle class="sP" cx="117.3" cy="97.5" r="3"/>
<circle class="sP" cx="120.9" cy="100.5" r="3"/>
<circle class="sP" cx="124.5" cy="88.8" r="3"/>
<circle class="sP" cx="128.1" cy="81.0" r="3"/>
<circle class="sP" cx="131.7" cy="80.5" r="3"/>
<circle class="sP" cx="135.3" cy="71.2" r="3"/>
<circle class="sP" cx="138.9" cy="77.1" r="3"/>
<circle class="sP" cx="142.5" cy="56.2" r="3"/>
<circle class="sP" cx="146.1" cy="62.9" r="3"/>
<circle class="sP" cx="149.6" cy="48.8" r="3"/>
<circle class="sP" cx="153.2" cy="60.6" r="3"/>
<circle class="sP" cx="156.8" cy="61.7" r="3"/>
<circle class="sP" cx="160.4" cy="63.9" r="3"/>
<circle class="sP" cx="164.0" cy="47.3" r="3"/>
<text class="sT" x="94" y="22" text-anchor="middle">linear</text><text class="sGt" x="94" y="210" text-anchor="middle">r = 0.97</text>
<rect class="sN" x="190" y="30" width="160" height="160" rx="6"/>
<circle class="sP" cx="200.0" cy="54.0" r="3"/>
<circle class="sP" cx="203.6" cy="65.2" r="3"/>
<circle class="sP" cx="207.2" cy="75.8" r="3"/>
<circle class="sP" cx="210.8" cy="85.8" r="3"/>
<circle class="sP" cx="214.4" cy="95.2" r="3"/>
<circle class="sP" cx="217.9" cy="104.1" r="3"/>
<circle class="sP" cx="221.5" cy="112.3" r="3"/>
<circle class="sP" cx="225.1" cy="120.0" r="3"/>
<circle class="sP" cx="228.7" cy="127.0" r="3"/>
<circle class="sP" cx="232.3" cy="133.5" r="3"/>
<circle class="sP" cx="235.9" cy="139.4" r="3"/>
<circle class="sP" cx="239.5" cy="144.7" r="3"/>
<circle class="sP" cx="243.1" cy="149.4" r="3"/>
<circle class="sP" cx="246.7" cy="153.6" r="3"/>
<circle class="sP" cx="250.3" cy="157.1" r="3"/>
<circle class="sP" cx="253.8" cy="160.0" r="3"/>
<circle class="sP" cx="257.4" cy="162.4" r="3"/>
<circle class="sP" cx="261.0" cy="164.2" r="3"/>
<circle class="sP" cx="264.6" cy="165.3" r="3"/>
<circle class="sP" cx="268.2" cy="165.9" r="3"/>
<circle class="sP" cx="271.8" cy="165.9" r="3"/>
<circle class="sP" cx="275.4" cy="165.3" r="3"/>
<circle class="sP" cx="279.0" cy="164.2" r="3"/>
<circle class="sP" cx="282.6" cy="162.4" r="3"/>
<circle class="sP" cx="286.2" cy="160.0" r="3"/>
<circle class="sP" cx="289.7" cy="157.1" r="3"/>
<circle class="sP" cx="293.3" cy="153.6" r="3"/>
<circle class="sP" cx="296.9" cy="149.4" r="3"/>
<circle class="sP" cx="300.5" cy="144.7" r="3"/>
<circle class="sP" cx="304.1" cy="139.4" r="3"/>
<circle class="sP" cx="307.7" cy="133.5" r="3"/>
<circle class="sP" cx="311.3" cy="127.0" r="3"/>
<circle class="sP" cx="314.9" cy="120.0" r="3"/>
<circle class="sP" cx="318.5" cy="112.3" r="3"/>
<circle class="sP" cx="322.1" cy="104.1" r="3"/>
<circle class="sP" cx="325.6" cy="95.2" r="3"/>
<circle class="sP" cx="329.2" cy="85.8" r="3"/>
<circle class="sP" cx="332.8" cy="75.8" r="3"/>
<circle class="sP" cx="336.4" cy="65.2" r="3"/>
<circle class="sP" cx="340.0" cy="54.0" r="3"/>
<text class="sT" x="270" y="22" text-anchor="middle">parabola</text><text class="sRt" x="270" y="210" text-anchor="middle">r = 0.00</text>
<rect class="sN" x="366" y="30" width="160" height="160" rx="6"/>
<circle class="sP" cx="509.0" cy="110.0" r="3"/>
<circle class="sP" cx="508.2" cy="100.1" r="3"/>
<circle class="sP" cx="505.9" cy="90.5" r="3"/>
<circle class="sP" cx="502.1" cy="81.4" r="3"/>
<circle class="sP" cx="497.0" cy="73.0" r="3"/>
<circle class="sP" cx="490.5" cy="65.5" r="3"/>
<circle class="sP" cx="483.0" cy="59.0" r="3"/>
<circle class="sP" cx="474.6" cy="53.9" r="3"/>
<circle class="sP" cx="465.5" cy="50.1" r="3"/>
<circle class="sP" cx="455.9" cy="47.8" r="3"/>
<circle class="sP" cx="446.0" cy="47.0" r="3"/>
<circle class="sP" cx="436.1" cy="47.8" r="3"/>
<circle class="sP" cx="426.5" cy="50.1" r="3"/>
<circle class="sP" cx="417.4" cy="53.9" r="3"/>
<circle class="sP" cx="409.0" cy="59.0" r="3"/>
<circle class="sP" cx="401.5" cy="65.5" r="3"/>
<circle class="sP" cx="395.0" cy="73.0" r="3"/>
<circle class="sP" cx="389.9" cy="81.4" r="3"/>
<circle class="sP" cx="386.1" cy="90.5" r="3"/>
<circle class="sP" cx="383.8" cy="100.1" r="3"/>
<circle class="sP" cx="383.0" cy="110.0" r="3"/>
<circle class="sP" cx="383.8" cy="119.9" r="3"/>
<circle class="sP" cx="386.1" cy="129.5" r="3"/>
<circle class="sP" cx="389.9" cy="138.6" r="3"/>
<circle class="sP" cx="395.0" cy="147.0" r="3"/>
<circle class="sP" cx="401.5" cy="154.5" r="3"/>
<circle class="sP" cx="409.0" cy="161.0" r="3"/>
<circle class="sP" cx="417.4" cy="166.1" r="3"/>
<circle class="sP" cx="426.5" cy="169.9" r="3"/>
<circle class="sP" cx="436.1" cy="172.2" r="3"/>
<circle class="sP" cx="446.0" cy="173.0" r="3"/>
<circle class="sP" cx="455.9" cy="172.2" r="3"/>
<circle class="sP" cx="465.5" cy="169.9" r="3"/>
<circle class="sP" cx="474.6" cy="166.1" r="3"/>
<circle class="sP" cx="483.0" cy="161.0" r="3"/>
<circle class="sP" cx="490.5" cy="154.5" r="3"/>
<circle class="sP" cx="497.0" cy="147.0" r="3"/>
<circle class="sP" cx="502.1" cy="138.6" r="3"/>
<circle class="sP" cx="505.9" cy="129.5" r="3"/>
<circle class="sP" cx="508.2" cy="119.9" r="3"/>
<text class="sT" x="446" y="22" text-anchor="middle">circle</text><text class="sRt" x="446" y="210" text-anchor="middle">r = 0.00</text>
<rect class="sN" x="542" y="30" width="160" height="160" rx="6"/>
<circle class="sP" cx="552.0" cy="137.3" r="3"/>
<circle class="sP" cx="555.6" cy="135.9" r="3"/>
<circle class="sP" cx="559.2" cy="134.5" r="3"/>
<circle class="sP" cx="562.8" cy="133.1" r="3"/>
<circle class="sP" cx="566.4" cy="131.7" r="3"/>
<circle class="sP" cx="569.9" cy="130.3" r="3"/>
<circle class="sP" cx="573.5" cy="128.9" r="3"/>
<circle class="sP" cx="577.1" cy="127.5" r="3"/>
<circle class="sP" cx="580.7" cy="126.1" r="3"/>
<circle class="sP" cx="584.3" cy="124.7" r="3"/>
<circle class="sP" cx="587.9" cy="123.3" r="3"/>
<circle class="sP" cx="591.5" cy="121.9" r="3"/>
<circle class="sP" cx="595.1" cy="120.5" r="3"/>
<circle class="sP" cx="598.7" cy="119.1" r="3"/>
<circle class="sP" cx="602.3" cy="117.7" r="3"/>
<circle class="sP" cx="605.8" cy="116.3" r="3"/>
<circle class="sP" cx="609.4" cy="114.9" r="3"/>
<circle class="sP" cx="613.0" cy="113.5" r="3"/>
<circle class="sP" cx="616.6" cy="112.1" r="3"/>
<circle class="sP" cx="620.2" cy="110.7" r="3"/>
<circle class="sP" cx="623.8" cy="109.3" r="3"/>
<circle class="sP" cx="627.4" cy="107.9" r="3"/>
<circle class="sP" cx="631.0" cy="106.5" r="3"/>
<circle class="sP" cx="634.6" cy="105.1" r="3"/>
<circle class="sP" cx="638.2" cy="103.7" r="3"/>
<circle class="sP" cx="641.7" cy="102.3" r="3"/>
<circle class="sP" cx="645.3" cy="100.9" r="3"/>
<circle class="sP" cx="648.9" cy="99.5" r="3"/>
<circle class="sP" cx="652.5" cy="98.1" r="3"/>
<circle class="sP" cx="656.1" cy="96.7" r="3"/>
<circle class="sP" cx="659.7" cy="95.3" r="3"/>
<circle class="sP" cx="663.3" cy="93.9" r="3"/>
<circle class="sP" cx="666.9" cy="92.5" r="3"/>
<circle class="sP" cx="670.5" cy="91.1" r="3"/>
<circle class="sP" cx="674.1" cy="89.7" r="3"/>
<circle class="sP" cx="677.6" cy="88.3" r="3"/>
<circle class="sP" cx="681.2" cy="86.9" r="3"/>
<circle class="sP" cx="684.8" cy="85.5" r="3"/>
<circle class="sP" cx="688.4" cy="84.1" r="3"/>
<circle class="sP" cx="692.0" cy="82.7" r="3"/>
<text class="sT" x="622" y="22" text-anchor="middle">cm vs inches</text><text class="sGt" x="622" y="210" text-anchor="middle">r = 1.00</text>
<text class="sS" x="360" y="236" text-anchor="middle">r ≈ 0 for the parabola and circle, yet y depends completely on x · r = 1 says nothing about the slope</text>
</svg><figcaption>Pearson's r, computed on four shapes. It measures linear association only; plot before you trust it.</figcaption></figure>

For non-linear but monotonic relationships use **Spearman's ρ** (`df.corr(method="spearman")`). For arbitrary dependence use **mutual information** (`sklearn.feature_selection.mutual_info_regression`).

Always plot the top candidates with `pandas.plotting.scatter_matrix` or a seaborn `pairplot`. In Géron's data the income-vs-price scatter shows the \$500k **cap** as a horizontal line. It also shows fainter lines at \$450k, \$350k and \$280k, which are data-collection quirks. You would consider removing those districts so the model does not learn to reproduce the quirks.

### 4.10.5 Attribute combinations — the cheapest feature engineering

```python
housing["rooms_per_house"]  = housing["total_rooms"]    / housing["households"]
housing["bedrooms_ratio"]   = housing["total_bedrooms"] / housing["total_rooms"]
housing["people_per_house"] = housing["population"]     / housing["households"]
```

`total_rooms` correlates with price at 0.14. `bedrooms_ratio` correlates at **−0.26**, nearly twice as strongly, even though it is built from the same raw columns. **Totals depend on the size of the group; ratios describe it.** The same idea applies in telecom: `total_minutes` is less useful than `minutes_per_active_day`, and `total_recharge` is less useful than `recharge_per_month_of_tenure`.

⚠️ Géron's caveat: avoid new features that are just **weighted sums of existing ones**. They are collinear with the originals, which hurts linear regression (see VIF, Part 13).

### 4.10.6 Imputers beyond `SimpleImputer`

| Imputer | How it fills a gap | When |
|---|---|---|
| `SimpleImputer(strategy="median")` | Column median, learned on train | Default for numeric |
| `SimpleImputer(strategy="most_frequent")` / `"constant"` | Mode / fixed value | Categorical (works on strings) |
| `KNNImputer(n_neighbors=5)` | Mean of the k nearest rows' values, using the other features | Features are related; moderate data size |
| `IterativeImputer` | Fits a regression per feature and predicts the missing values from the others, repeating a few rounds | Strongly related features; the MICE-style approach |

Two points interviewers check:
- Géron applies the imputer to **every** numeric column, even columns with no gaps today, because *"you cannot be sure that there won't be any missing values in new data after the system goes live."*
- **Missingness can itself be signal.** `SimpleImputer(add_indicator=True)` adds a 0/1 "was missing" column. In telecom, a missing `last_complaint_date` usually means "never complained", which is informative.

### 4.10.7 The scikit-learn design principles (a favourite interview question)

Géron summarises the API design paper (Buitinck et al., 2013):

| Principle | Meaning |
|---|---|
| **Estimators** | Anything with `fit()`. Hyperparameters go in the constructor. |
| **Transformers** | Estimators with `transform()` (and `fit_transform()`, sometimes optimised). |
| **Predictors** | Estimators with `predict()` and `score()` (R² for regressors, accuracy for classifiers). |
| **Inspection** | Hyperparameters are public attributes (`imputer.strategy`). Learned parameters end with an underscore (`imputer.statistics_`). |
| **Non-proliferation of classes** | Data is NumPy arrays or SciPy sparse matrices, not custom classes. |
| **Composition** | `Pipeline`, `ColumnTransformer`, and meta-estimators reuse building blocks. |
| **Sensible defaults** | A working baseline needs almost no configuration. |

Two quality-of-life settings:

```python
import sklearn
sklearn.set_config(transform_output="pandas")   # transformers return DataFrames, with names
sklearn.set_config(display="diagram")            # pipelines render as clickable diagrams
```

### 4.10.8 `OrdinalEncoder` vs `OneHotEncoder` vs `get_dummies`

- **`OrdinalEncoder`** maps categories to 0, 1, 2, … Use it only when the order is real (`bad < average < good`). Otherwise the model will treat `INLAND` (1) as "between" `<1H OCEAN` (0) and `ISLAND` (2), which means nothing.
- **`OneHotEncoder`** returns a **sparse matrix** by default, which stores only the non-zeros. Set `sparse_output=False` for a dense array.
- **Why not `pd.get_dummies`?** It has **no memory**. Géron's demonstration: fit on 5 categories, then call `get_dummies` on a 2-row frame, and you get 2 columns instead of 5. Pass it an unseen category and it silently creates a new column. A fitted `OneHotEncoder` always outputs the same columns in the same order. It raises an error on unknown categories, or encodes them as all zeros with `handle_unknown="ignore"`. **In production, column-schema stability is everything.**

For **high-cardinality** categoricals (country, city, handset model, cell-tower ID), Géron lists these options:
1. Replace the category with **meaningful numeric attributes** (country → population, GDP; cell tower → distance to city centre, urban/rural flag).
2. Use the encoders in the `category_encoders` package, or sklearn's own **`TargetEncoder`** (sklearn ≥ 1.3), which uses internal cross-fitting to avoid leakage. This is what the capstone does.
3. With neural networks, use learned **embeddings**: a small dense vector per category. This is representation learning.
4. The Top-N + "Other" trick from Part 8.

Every fitted sklearn estimator records `feature_names_in_`. Transformers provide `get_feature_names_out()`. Use them to build readable DataFrames and to catch column mismatches.

### 4.10.9 Feature scaling — the parts Part 4.7 did not cover

**Fit scalers on training data only.** Values in new data can still land outside the training range. `MinMaxScaler(clip=True)` clamps them.

`MinMaxScaler(feature_range=(-1, 1))`: neural networks prefer zero-centred inputs, so Géron suggests −1…1 over 0…1.

`StandardScaler(with_mean=False)` scales a **sparse** matrix without densifying it. Subtracting the mean would turn every zero into a non-zero.

**Heavy tails.** When extreme values are *not exponentially rare* (income, population, data usage in MB, call counts), both scalers squash the bulk of the data into a narrow band. **Transform before scaling:**

| Shape | Fix |
|---|---|
| Right-skewed, moderate | `np.sqrt(x)` or `x**p` with 0 < p < 1 |
| Very long tail / power law | `np.log(x)` (or `np.log1p(x)` if zeros exist) |
| Any shape, want uniform | **Bucketize** into quantiles; bucket index ÷ n_buckets is already in 0–1 |
| Mixed signs, want Gaussian | `PowerTransformer(method="yeo-johnson")` |

**Multimodal features** (two or more peaks, such as `housing_median_age`) have two options:
1. **Bucketize and treat the buckets as categories** (one-hot them), so the model can learn a separate effect per range.
2. **RBF similarity features.** Add a feature that measures closeness to each mode:

```python
from sklearn.metrics.pairwise import rbf_kernel
age_simil_35 = rbf_kernel(housing[["housing_median_age"]], [[35]], gamma=0.1)
# exp(-γ (x − 35)²): peaks at 1 when age = 35, decays with distance.
# Larger γ → narrower bump.
```

The same trick in 2-D gives a "similarity to San Francisco" feature from latitude and longitude. For e&, the equivalent could be similarity to Cairo, Alexandria or the Smart Village business district.

### 4.10.10 Transforming the **target**

If `y` is heavy-tailed (revenue, ARPU, claim size), training on `log(y)` often helps linear models a lot. You then have to invert the predictions. Let `TransformedTargetRegressor` handle both directions so you cannot forget:

```python
from sklearn.compose import TransformedTargetRegressor
from sklearn.linear_model import LinearRegression
import numpy as np

model = TransformedTargetRegressor(
    regressor=LinearRegression(),
    func=np.log1p, inverse_func=np.expm1)       # or transformer=StandardScaler()
model.fit(X_train, y_train)                     # raw y in
model.predict(X_new)                            # raw-scale predictions out
```

📌 Interview nuance: `expm1(mean of log y)` estimates the **median** of `y`, not the mean, because the exponential of an average is not the average of exponentials (Jensen's inequality). If the business needs expected revenue, you have to correct for that.

### 4.10.11 Custom transformers — three levels

**Level 1: stateless function → `FunctionTransformer`**

```python
from sklearn.preprocessing import FunctionTransformer

log_transformer = FunctionTransformer(np.log, inverse_func=np.exp,
                                      feature_names_out="one-to-one")
ratio_transformer = FunctionTransformer(lambda X: X[:, [0]] / X[:, [1]])
rbf_transformer = FunctionTransformer(rbf_kernel,
                                      kw_args=dict(Y=[[35.]], gamma=0.1))
```

**Level 2: learns something in `fit` → write a class.** This is the full contract, as in Géron's `StandardScalerClone`:

```python
from sklearn.base import BaseEstimator, TransformerMixin
from sklearn.utils.validation import check_array, check_is_fitted

class StandardScalerClone(BaseEstimator, TransformerMixin):
    def __init__(self, with_mean=True):      # no *args / **kwargs → get_params works
        self.with_mean = with_mean

    def fit(self, X, y=None):                # y=None required by Pipeline
        X = check_array(X)                   # validates: finite, 2-D, numeric
        self.mean_ = X.mean(axis=0)
        self.scale_ = X.std(axis=0)
        self.n_features_in_ = X.shape[1]     # every estimator sets this
        return self                          # always return self

    def transform(self, X):
        check_is_fitted(self)                # looks for attributes ending in "_"
        X = check_array(X)
        assert self.n_features_in_ == X.shape[1]
        if self.with_mean:
            X = X - self.mean_
        return X / self.scale_
```

A complete implementation would also set `feature_names_in_` when given a DataFrame, implement `get_feature_names_out()`, and implement `inverse_transform()` where possible. `sklearn.utils.estimator_checks.check_estimator(MyTransformer())` tests all of this for you.

**Level 3: a transformer that uses another model inside.** Géron's `ClusterSimilarity` runs K-Means on latitude/longitude, weighted by house value, and outputs each district's RBF similarity to the 10 cluster centres:

```python
from sklearn.cluster import KMeans

class ClusterSimilarity(BaseEstimator, TransformerMixin):
    def __init__(self, n_clusters=10, gamma=1.0, random_state=None):
        self.n_clusters = n_clusters
        self.gamma = gamma
        self.random_state = random_state

    def fit(self, X, y=None, sample_weight=None):
        self.kmeans_ = KMeans(self.n_clusters, random_state=self.random_state)
        self.kmeans_.fit(X, sample_weight=sample_weight)
        return self

    def transform(self, X):
        return rbf_kernel(X, self.kmeans_.cluster_centers_, gamma=self.gamma)

    def get_feature_names_out(self, names=None):
        return [f"Cluster {i} similarity" for i in range(self.n_clusters)]
```

This is **unsupervised learning used as feature engineering inside a supervised pipeline**, the same idea as the capstone's HDBSCAN hotspots. Because it is a transformer, `n_clusters` can be tuned by grid search together with the model.

### 4.10.12 Géron's full preprocessing pipeline — study this one

```python
from sklearn.pipeline import make_pipeline
from sklearn.compose import ColumnTransformer, make_column_selector

def column_ratio(X):
    return X[:, [0]] / X[:, [1]]

def ratio_name(function_transformer, feature_names_in):
    return ["ratio"]

def ratio_pipeline():
    return make_pipeline(
        SimpleImputer(strategy="median"),
        FunctionTransformer(column_ratio, feature_names_out=ratio_name),
        StandardScaler())

log_pipeline = make_pipeline(
    SimpleImputer(strategy="median"),
    FunctionTransformer(np.log, feature_names_out="one-to-one"),
    StandardScaler())

cluster_simil = ClusterSimilarity(n_clusters=10, gamma=1., random_state=42)
default_num_pipeline = make_pipeline(SimpleImputer(strategy="median"), StandardScaler())
cat_pipeline = make_pipeline(SimpleImputer(strategy="most_frequent"),
                             OneHotEncoder(handle_unknown="ignore"))

preprocessing = ColumnTransformer([
    ("bedrooms",         ratio_pipeline(), ["total_bedrooms", "total_rooms"]),
    ("rooms_per_house",  ratio_pipeline(), ["total_rooms", "households"]),
    ("people_per_house", ratio_pipeline(), ["population", "households"]),
    ("log", log_pipeline, ["total_bedrooms", "total_rooms", "population",
                           "households", "median_income"]),
    ("geo", cluster_simil, ["latitude", "longitude"]),
    ("cat", cat_pipeline, make_column_selector(dtype_include=object)),
], remainder=default_num_pipeline)        # housing_median_age falls through to here
```

Things to notice:
- **`make_pipeline` / `make_column_transformer`** auto-name steps (`"simpleimputer"`, `"pipeline-1"`). Use the explicit `Pipeline([...])` form when you will tune by name.
- **`make_column_selector(dtype_include=object)`** picks columns by dtype, so new text columns are routed automatically.
- **`remainder=`** can be a transformer, not just `"drop"`/`"passthrough"`.
- A column can appear in **several** branches (`total_rooms` feeds two ratios and the log branch).
- **`sparse_threshold=0.3`**: if the overall output density is below 30%, `ColumnTransformer` returns a sparse matrix.
- `Pipeline(..., memory="cache_dir")` caches fitted transformers, so a grid search does not refit the same expensive preprocessing again and again.
- You can index pipelines: `pipe[0]`, `pipe[:-1]`, `pipe["preprocessing"]`, `pipe.named_steps`.

### 4.10.13 Feature selection, after the model

Once a model is trained, Géron inspects it:

```python
final_model["random_forest"].feature_importances_
```

He finds that only one `ocean_proximity` category really matters, and suggests dropping the rest. To automate this, put **`SelectFromModel(RandomForestRegressor(...))`** inside the pipeline. It keeps features whose importance is above a threshold. Other tools worth naming in an interview:

| Tool | Idea |
|---|---|
| `VarianceThreshold` | Drop near-constant columns |
| `SelectKBest(f_classif / mutual_info_classif, k=…)` | Univariate filter |
| `RFE` / `RFECV` | Recursive feature elimination, wrapped around a model |
| `SelectFromModel(Lasso / L1-logistic)` | Keep non-zero coefficients (Part 7 §7.14) |
| `permutation_importance` | Shuffle one feature on validation data and measure the drop. Model-agnostic and less biased than impurity importance |

---

> [!check] ✅ Key takeaways
> - **Fit on train, transform everything.** Every learned statistic (mean, σ, categories, SMOTE points) comes from training data only.
> - Ask *why* data is missing (MCAR/MAR/MNAR); median-impute skewed columns and add a missing indicator when missingness is informative.
> - One-hot for nominal, ordinal mapping for ordered categories, target encoding (cross-fitted) or native handling for high cardinality.
> - Outliers: fix errors, keep rare-but-real values (often the thing you predict); clipping is a safe default.
> - Stratify classification splits; split by time for anything that forecasts; use a stable ID hash when data grows.
> - Put it all in a `Pipeline` + `ColumnTransformer`, so CV is honest and production receives raw rows.

## 4.11 Interview drill — preprocessing 🟢 ⭐

Answer out loud before reading the answer.

**Q1. Why split before EDA and before any preprocessing?** Any statistic computed with test rows (a median, a scaler's σ, a category vocabulary, or even *your own* choice of a feature after seeing a pattern) leaks information about the test set. The test score then overstates real-world performance.

**Q2. Mean or median imputation?** Median when the distribution is skewed or has outliers. Mean when it is roughly symmetric. For categorical data, use the most frequent value or a constant `"Missing"`. Consider `add_indicator=True` when missingness may be informative, and KNN/Iterative imputation when features are strongly related.

**Q3. Normalisation vs standardisation?** Min-max maps to a fixed range and is very sensitive to outliers. Standardisation gives mean 0 and σ 1, is unbounded, and is less affected by outliers. Standardisation is the default for gradient and distance methods. Neither one fixes skew; for skew, apply a log/sqrt/power transform first.

**Q4. Which models need scaling?** Distance-based (KNN, K-Means, SVM-RBF), gradient-based (linear/logistic regression with GD, neural networks), regularised linear models, and PCA. Tree models don't.

**Q5. How do you encode a feature with 5,000 categories?** Not with plain one-hot. Options: Top-N + "Other"; target encoding with cross-fitting; frequency encoding; domain-derived numeric attributes; embeddings in a neural network; or a native categorical-handling model such as CatBoost, LightGBM or `HistGradientBoosting(categorical_features=...)`.

**Q6. What is wrong with `pd.get_dummies` in production?** It has no memory of the training categories. It produces different columns for different batches and new columns for unseen values. A fitted `OneHotEncoder` inside the pipeline fixes the schema.

**Q7. How do you stratify a regression split?** Bin the target (or a dominant feature) with `pd.cut`/`pd.qcut` into a few well-populated strata and pass the bins to `stratify=`.

**Q8. When would you log-transform the target, and what is the catch?** When the target is right-skewed and positive (revenue, usage). Wrap it in `TransformedTargetRegressor`. The catch: back-transformed predictions estimate the median, not the mean.

**Q9. Write a custom transformer. What are the rules?** Inherit `BaseEstimator` and `TransformerMixin`. `__init__` only stores hyperparameters (no `*args`). `fit(X, y=None)` learns attributes ending in `_` and returns `self`. `transform` only applies what was learned. Set `n_features_in_`, and implement `get_feature_names_out()`.

**Q10. What is data snooping bias?** Letting knowledge of the test set influence modelling decisions. It produces an optimistic generalisation estimate even when no code touches the test set during training.

---

## Further reading

- **scikit-learn User Guide §6.3, "Preprocessing data"** — https://scikit-learn.org/stable/modules/preprocessing.html. Also §6.4 (imputation) and the "Common pitfalls / Data leakage" page, which is short and worth reading in full: https://scikit-learn.org/stable/common_pitfalls.html
- **`imbalanced-learn` User Guide** — https://imbalanced-learn.org/stable/user_guide.html
- **Chawla et al. (2002), "SMOTE: Synthetic Minority Over-sampling Technique"**, *JAIR* — the original paper; short and readable.
- **Feature Engineering for Machine Learning**, Zheng & Casari (O'Reilly) — the best single book on this material.
- **Hands-On Machine Learning**, Aurélien Géron — Chapter 2 builds exactly this pipeline end to end. You already own three copies of the 2025 PyTorch edition in `code/Assignments/AI_Project/`.
- **Kaggle's "Data Cleaning" micro-course** — free, practical, five hours.

---

<!-- nav -->
> [!example] 🧭 Step 5 of 26 · Stage 2 of 7: Data & statistics
> ← [Part 12 · SQL](12_SQL_for_Data.md) · [Part 05 · Visualisation & EDA](05_Visualization_and_EDA.md) → · [Course map](00_START_HERE.md)
<!-- /nav -->
