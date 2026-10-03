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
