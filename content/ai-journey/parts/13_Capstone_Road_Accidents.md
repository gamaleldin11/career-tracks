# Part 13 — Capstone: Road Accidents (Leeds, 2011)

<!-- nav -->
> [!example] 🧭 Step 15 of 26 · Stage 4 of 7: Applied ML
> ← [Part 11 · Neural networks](11_Neural_Networks.md) · [Part 17 · Training deep nets](17_Training_Deep_Neural_Networks.md) → · [Course map](00_START_HERE.md)
<!-- /nav -->

**Source:** `AI_notebooks/2026-01-22/project description .txt`, `2026-01-25/Road_Accidents_FINAL_Classification_Reference.ipynb` (82 cells), `code/Assignments/AI_Project/` (`readme.md`, `collective_project.ipynb`, `EDA.py`, `data_handling.py`, `training.py`, `evaluation.py`, `libraries.py`, saved plots)

This is the course's final project and its best single artifact. The notebook calls itself a **"FINAL Industrial Reference"**, and that is fair — it is the template to reuse.

<!-- interview-focus -->

> [!tip] 🎯 Interview focus
> **Why it matters:** This is your portfolio story. "Walk me through a project" is asked in every loop — this part gives you the structure and the numbers.
>
> | Level | What you should be able to do |
> |---|---|
> | 🟢 **Entry** | Explain the project end to end: goal, data, cleaning, EDA findings, pipeline, baseline, metric choice (F1-macro), results and limitations. |
> | 🟡 **Mid** | Defend the decisions: stratified CV, SMOTE inside the folds, statistical tests, VIF, SHAP; what you would do with more time. |
> | 🔴 **Senior** | How it would run in production: monitoring, retraining, stakeholders, and the impact on decisions. |
>
> **⭐ Most-asked:** *Walk me through your capstone in 3 minutes.* · *Why F1-macro and not accuracy?* · *Where did you apply SMOTE, and why there?* · *What was your baseline?* · *What would you do differently?*
>
> **⏱ Time:** 2 h + rehearse the story aloud  ·  **Short on time?** Read §13.1, §13.2, §13.8, §13.9, §13.12.

**Legend:** 🟢 Entry (0–2 yrs) · 🟡 Mid (2–5 yrs) · 🔴 Senior / specialist · ⭐ frequently asked · 📖 Géron, *Hands-On ML with Scikit-Learn and PyTorch* (2025) pages

> [!abstract]- 🗺️ Section map — level and book pages
>
> | § | Section | Level | 📖 Book |
> |---|---|:---:|---|
> | 13.1 | The brief | 🟢 ⭐ | — |
> | 13.2 | The plan | 🟢 ⭐ | — |
> | 13.3 | Profiling — writing a reusable function | 🟢 | — |
> | 13.4 | Feature engineering — the heart of the project | 🟢 ⭐ | — |
> | 13.5 | EDA | 🟢 | — |
> | 13.6 | Statistical tests | 🟡 | — |
> | 13.7 | Multicollinearity and VIF | 🟡 | — |
> | 13.8 | The modelling pipeline | 🟢 ⭐ | — |
> | 13.9 | The findings — criteria 2 and 6, delivered | 🟢 ⭐ | — |
> | 13.10 | The advanced extensions | 🟡 | — |
> | 13.11 | The sibling: `AI_Project/` as a module | 🟡 | — |
> | 13.12 | What to lift from this project | 🟢 ⭐ | — |
> | 13.13 | What would make it stronger | 🟡 | — |
>

---

## 13.1 The brief 🟢 ⭐

> [!quote] 💬 Say it in the interview
> “The goal was to predict accident severity and explain its drivers; the classes were highly imbalanced, so I used F1-macro and a dummy baseline.”

> The data attached is about Car Accidents across Leeds City - UK for 2011.
>
> **Data Description:** Reference Number, Easting, Northing, Number of Vehicles, Accident Date, Time (24hr), 1st Road Class, Road Surface, Lighting Conditions, Weather Conditions, Casualty Class, Sex of Casualty, Age of Casualty, Type of Vehicle
>
> **Output Required:** Casualty Severity: (Slight, Serious, Fatal)

And the judging criteria, which are worth reading twice:

> We don't care about the best metric. Points that we care about are
> 1. **Coding style.** I expect a clean, readable code. Code that I can follow along and understand without having to run it line by line.
> 2. **What insights you can extract from the data.**
> 3. **Excellent insightful visualizations.**
> 4. **Feature engineering**, adding new features if needed and feature transformation.
> 5. **The general approach** that you follow. For example, I expect to see how the model is generalizable, no data leakage, … etc.
> 6. **How clearly and concisely you can communicate your findings.**

**Five of six criteria are not about model performance.** This is an accurate reflection of the job. Nobody at work will ask for your F1 score; they will ask what you found and whether they can trust it.

---

## 13.2 The plan 🟢 ⭐

![The capstone as a reusable template for any tabular classification take-home.](figures/fig13_capstone_pipeline.png)
*The capstone as a reusable template for any tabular classification take-home.*

The notebook's own header:

> - Load + audit dataset (**types, missing, duplicates**)
> - Feature engineering (**time**, **day period**, **weather/road/lighting risk**)
> - EDA (Univariate + Bivariate) using **Seaborn**
> - Location visualization: quick scatter (Easting/Northing), optional interactive **Folium map**
> - **Industrial preprocessing pipeline**: imputation + scaling + one-hot encoding
> - Imbalance handling with **SMOTE inside pipeline**
> - Compare **5 models** using **StratifiedKFold CV**
> - Evaluate on test set (**F1 Macro + ROC AUC OvR**)
> - Save artifacts (`joblib`, `json`, `csv`)

---

## 13.3 Profiling — writing a reusable function 🟢

```python
def profile_dataframe(df, target_col=None, top_n_unique=15):
    """Industrial quick profiling for teaching purposes.

    Prints:
    - numeric describe
    - categorical describe
    - unique values preview for categoricals (and potential whitespace issues)
    - missing values rate
    """
```

> Before diving into EDA and cleaning, we should **profile** the dataset […] This helps us catch:
> - invisible typos like `"Dry "` vs `"Dry"`
> - inconsistent categories like `"Rain"` vs `"rain"`
> - unexpected numeric ranges

**Trailing-whitespace category duplication is one of the most common and most invisible data bugs.** `"Dry"` and `"Dry "` are two distinct categories to `value_counts`, to `get_dummies`, and to `OneHotEncoder`. Your model silently splits one signal across two features, and no error is ever raised.

The fix is `df[col].str.strip()`, but you have to know to look. Wrapping the check in a reusable function means you never forget.

**Write your own `profile_dataframe` and carry it between projects.** It is the single highest-return utility in this course.

```python
df.info()
missing_rate = df.isna().mean().sort_values(ascending=False)
missing_rate[missing_rate > 0]
```

Rate, not count (§4.2).

### The duplicate judgement call

```python
before = len(df)
df = df.drop_duplicates().reset_index(drop=True)
after = len(df)
print("Exact duplicates removed:", before - after)

dup_ref = df["Reference Number"].duplicated().sum()
print("Rows with duplicated Reference Number:", dup_ref)
```

> We remove only **exact duplicate rows** (same values across all columns). We **do not remove** repeated `Reference Number` because it can represent multiple casualties / vehicles in the same accident.

**This is the most professionally mature moment in the notebook.** A naive `drop_duplicates(subset=['Reference Number'])` would delete every casualty after the first in each multi-casualty accident — silently discarding exactly the severe accidents you most want to model.

The general lesson: **understand what one row means before deduplicating.** Here, one row = one casualty, not one accident.

📌 **The follow-on the notebook does not take:** because rows are grouped by accident, a strict evaluation would use `GroupKFold` on `Reference Number` (§6.5). Otherwise two casualties from the same accident can land in train and validation respectively, and the model sees near-identical rows on both sides. Worth knowing as a limitation of the reported scores.

---

## 13.4 Feature engineering — the heart of the project 🟢 ⭐

### Parsing an awkward time format

```python
def time_int_to_hhmm(t):
    if pd.isna(t):
        return np.nan
    t = int(t)
    hh = t // 100
    mm = t % 100
    return f"{hh:02d}:{mm:02d}"

df["time_str"] = df["Time (24hr)"].apply(time_int_to_hhmm)

df["accident_datetime"] = pd.to_datetime(
    df["Accident Date"].dt.date.astype(str) + " " + df["time_str"],
    errors="coerce")

df["hour"] = df["accident_datetime"].dt.hour
df["dayofweek"] = df["accident_datetime"].dt.dayofweek
```

> `Time (24hr)` sometimes comes like: 830 → 08:30, 45 → 00:45, NaN → we'll treat as unknown time

The time is stored as an integer where the last two digits are minutes. Integer division by 100 gives hours, modulo 100 gives minutes. Simple once seen, and impossible to guess from a schema — this is what "look at your data" means.

`{hh:02d}` zero-pads to two digits, so 8 becomes `"08"`.

### Sunrise/sunset — the standout feature

```python
from astral import LocationInfo
from astral.sun import sun
import pytz

leeds = LocationInfo(name="Leeds", region="UK", timezone="Europe/London",
                     latitude=53.8008, longitude=-1.5491)
tz = pytz.timezone(leeds.timezone)
# is_daylight = 1 if time is between sunrise and sunset
# is_darkness = 1 - is_daylight
```

> This is more accurate than guessing from lighting text only.

**This is genuinely excellent feature engineering** and worth dwelling on. The reasoning:

1. There is a `Lighting Conditions` text column, but it is a subjective human report.
2. Whether it was actually dark is a *computable astronomical fact*, given a date, a time and a location.
3. In Leeds, sunset moves from about 15:45 in December to about 21:40 in June. A fixed "dark after 6pm" rule would be wrong for half the year.
4. So: bring in an external library, compute the truth, and give the model a clean binary.

The general principle: **the best features often come from outside the dataset.** Weather APIs, public holidays, school terms, geography, economic indicators. Anything you can join on a key you already have.

### Text-derived condition flags

```python
df["is_dark"] = df["Lighting Conditions"].astype(str) \
                  .str.contains("Darkness", case=False, na=False).astype(int)
df["street_lights_present"] = df["Lighting Conditions"].astype(str) \
                  .str.contains("street lights present", case=False, na=False).astype(int)
df["street_lights_unlit"] = df["Lighting Conditions"].astype(str) \
                  .str.contains("unlit", case=False, na=False).astype(int)

df["road_not_dry"]    = (df["Road Surface"].astype(str).str.lower() != "dry").astype(int)
df["weather_adverse"] = ...
df["adverse_condition_score"] = df["is_dark"] + df["road_not_dry"] + df["weather_adverse"]
```

> These features are very useful for interpretability.

Four techniques in one block:

1. **`.str.contains` on messy text**, with `case=False` and `na=False` so it never raises. Vectorised, no `apply` (§3.10).
2. **`.astype(int)`** turns booleans into 0/1 — what models want.
3. **Decomposition** — one messy text column becomes three orthogonal binary facts. Now the model can distinguish "dark with working street lights" from "dark with unlit street lights", which turns out to matter enormously.
4. **A composite score** — `adverse_condition_score ∈ {0,1,2,3}` gives the model a single ordinal "how bad were conditions" summary alongside the individual flags.

The payoff shows up in the findings: the `street_lights_unlit` distinction is what surfaces the infrastructure-maintenance insight in §13.9.

---

## 13.5 EDA 🟢

```python
target_col = "Casualty Severity"
drop_cols = ["Reference Number", "Accident Date", "Time (24hr)",
             "time_str", "accident_datetime"]
df_model = df.drop(columns=drop_cols)

print(df_model[target_col].value_counts(normalize=True))
```

Identifiers and raw columns replaced by engineered features are dropped (§8.3).

```python
sns.countplot(data=df_model, x=target_col,
              order=df_model[target_col].value_counts().index)

for col in numeric_cols:
    sns.histplot(df_model[col], bins=30, kde=True)

for col in ["Age of Casualty", "Number of Vehicles", "hour", "adverse_condition_score"]:
    sns.boxplot(data=df_model, x=target_col, y=col)
```

Boxplots of each numeric feature **split by target class** — the right bivariate view for a numeric-vs-categorical relationship (§5.2). If the boxes for Slight, Serious and Fatal sit at visibly different levels, that feature carries signal.

### The stacked bar — the most important chart in the project

```python
def stacked_bar(col, top_n=12):
    vc = df_model[col].value_counts()
    keep = vc.index[:top_n]
    tmp = df_model[df_model[col].isin(keep)].copy()

    ctab = pd.crosstab(tmp[col], tmp[target_col], normalize="index")
    ctab.plot(kind="bar", stacked=True, figsize=(10, 4))
    plt.title(f"{col} vs {target_col} (row-normalized)")
    plt.ylabel("Proportion")
```

**`normalize="index"` is the line that makes this work.** Raw counts would show that most serious accidents involve cars — which is only true because most accidents involve cars. Row-normalising converts counts into **rates per category**, and rates are comparable across categories of wildly different size.

This chart is what produced the headline finding: motorcycles over 500cc at ~42% serious/fatal versus cars at ~8%.

`top_n=12` keeps the chart readable (§5.6).

### The map

```python
sns.scatterplot(data=df_model, x="Easting", y="Northing", hue=target_col, alpha=0.6, s=30)
```

```python
from pyproj import CRS, Transformer
import folium
from folium.plugins import MarkerCluster

# Convert BNG (EPSG:27700) -> WGS84 (EPSG:4326)
transformer = Transformer.from_crs(CRS.from_epsg(27700), CRS.from_epsg(4326))
```

> **Note:** not required for modeling, but great for storytelling.

Easting/Northing are **British National Grid** coordinates (EPSG:27700) — metres from a projection origin, not degrees. Folium needs WGS84 latitude/longitude (EPSG:4326), so a coordinate-reference-system transform is required. Knowing that CRS conversion is a thing, and that `pyproj` does it, is the useful takeaway.

The notebook's own framing — *"great for storytelling"* — is the right justification, given criterion 6.

---

## 13.6 Statistical tests 🟡

> These tests are **not modeling**. They are **data understanding tools**.
>
> **1) Chi-Square Test (Categorical vs Target)**
> - **H0 (Null):** Feature is independent of the target (no relationship)
> - **H1:** Feature and target are associated
> - If **p-value < 0.05** → statistically significant association
>
> **2) ANOVA Test (Numeric vs Target)**
> - **H0:** All classes have the same mean of the numeric feature
> - **H1:** At least one class mean is different
> - If **p-value < 0.05** → numeric feature differs across severity classes

```python
from scipy.stats import chi2_contingency, f_oneway

for col in cat_cols:
    ct = pd.crosstab(X_all[col].astype(str), y_labels)
    chi2, p, dof, expected = chi2_contingency(ct)
    chi_results.append({"feature": col, "chi2": chi2, "p_value": p})
```

**This section is unusual in an ML course and it is a genuine strength.** Most courses jump from EDA to modelling without ever quantifying whether an apparent relationship could be chance.

Two cautions worth adding:

1. **Multiple testing.** Running 20 chi-square tests at α = 0.05 means you expect one false positive by chance alone. If you are making decisions from these, apply a correction (Bonferroni: divide α by the number of tests; or Benjamini–Hochberg for something less conservative).
2. **Significance is not effect size.** With 10,000 rows, trivially small associations become "significant". A p-value of 0.001 tells you the effect is probably real; it says nothing about whether it is large enough to care about. Report **Cramér's V** alongside chi-square for the effect size.

---

## 13.7 Multicollinearity and VIF 🟡

```python
from statsmodels.stats.outliers_influence import variance_inflation_factor
```

> **VIF (Variance Inflation Factor)** measures how strongly one numeric feature is explained by the others.
> - VIF ≈ 1 → no multicollinearity
> - VIF 5–10 → moderate multicollinearity
> - VIF > 10 → strong multicollinearity (consider dropping/reducing features)

VIF for feature j is `1 / (1 − R²_j)`, where `R²_j` comes from regressing feature j on all the others. If the other features predict it perfectly, `R² = 1` and VIF is infinite.

```python
drop_cols = []

# (A) day/night redundancy
if "is_daylight" in df_model.columns and "is_darkness" in df_model.columns:
    drop_cols.append("is_darkness")     # keep only one

# (B) score redundancy
if "adverse_condition_score" in df_model.columns:
    ...
```

**The `VIF = inf` cases are the interesting ones**, and both are self-inflicted by the feature engineering:

- `is_darkness = 1 − is_daylight`. Perfect collinearity by construction. Keep one.
- `adverse_condition_score = is_dark + road_not_dry + weather_adverse`. It is an exact linear combination of its three components. Keep the score *or* the components, not both.

This is the dummy-variable trap (§4.3) in a different costume, and it traces straight back to `det(XᵀX) = 0` in §2.8.

The notebook's own caveat is correct:

> optional as it will affect more the linear models; like Logistic Regression

Trees do not care about collinearity for *prediction* — they just pick one of the correlated features. It hurts **interpretation** (feature importance gets split arbitrarily between the twins) and it breaks linear models' coefficients.

---

## 13.8 The modelling pipeline 🟢 ⭐

> [!quote] 💬 Say it in the interview
> “Everything lived in one imblearn pipeline — preprocessing, SMOTE, model — evaluated with stratified CV, so no step saw validation data.”

### Mixed-type defence

```python
def fix_mixed_types_for_categoricals(df, categorical_cols, verbose=True):
    """
    Industrial Fix:
    Some categorical columns coming from Excel/CSV can contain mixed types
    (e.g., numbers + strings). This breaks OneHotEncoder in scikit-learn.
    Solution: Convert categorical columns to string to ensure consistent dtype.
    """
```

A real production problem. Excel columns arrive with `1`, `"1"` and `"One"` in the same column; `OneHotEncoder` raises on the mixed types. Casting everything to `str` fixes it.

### Split and preprocess

```python
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=RANDOM_STATE, stratify=y)

numeric_features = X_train.select_dtypes(include=["int64", "float64"]).columns.tolist()
categorical_features = X_train.select_dtypes(
    include=["object", "bool", "category"]).columns.tolist()

try:
    ohe = OneHotEncoder(handle_unknown="ignore", sparse_output=False)
except TypeError:
    ohe = OneHotEncoder(handle_unknown="ignore", sparse=False)   # sklearn ≥ 1.2: sparse_output=False
```

The `try/except` handles the sklearn 1.2 rename (§4.3). Defensive, and a reasonable response to an API that moved.

### Target encoding

```python
y_raw = df_model[target_col]
is_numeric_target = pd.api.types.is_numeric_dtype(y_raw)

if not is_numeric_target:
    le = LabelEncoder()
    y_encoded = le.fit_transform(y_raw.astype(str))
```

> Some models (e.g., **XGBoost**) require the target `y` to be **numeric** (0, 1, 2, ...), not strings.

`LabelEncoder` on the target is its correct use (§4.3). Keep the `le` object — you need `le.classes_` to turn predictions back into readable labels in the report.

### The baseline

```python
from sklearn.dummy import DummyClassifier

dummy = DummyClassifier(strategy="most_frequent", random_state=RANDOM_STATE)
dummy_pipe = ImbPipeline(steps=[("preprocess", preprocessor), ("model", dummy)])

cv_out_dummy = cross_validate(dummy_pipe, X_train, y_train_enc,
                              scoring=scoring, cv=cv, n_jobs=-1)
```

> If our ML models do **not** outperform this baseline, then the ML pipeline is not providing real value.

**The most under-rated four lines in the whole course** (§6.6). On this data the dummy gets ~89% accuracy and ~0.31 macro-F1. Every subsequent number is now interpretable.

### Five models with SMOTE inside the pipeline

```python
cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=RANDOM_STATE)

scoring = {
    "f1_macro": "f1_macro",
    "f1_weighted": "f1_weighted",
    "roc_auc_ovr_weighted": "roc_auc_ovr_weighted"
}

smote = SMOTE(random_state=RANDOM_STATE)

models = {
    "LogReg": LogisticRegression(max_iter=2000, multi_class="multinomial",
                                 solver="lbfgs", class_weight="balanced",
                                 random_state=RANDOM_STATE),
    "KNN": KNeighborsClassifier(n_neighbors=15),
    "DecisionTree": DecisionTreeClassifier(class_weight="balanced",
                                           random_state=RANDOM_STATE),
    "RandomForest": RandomForestClassifier(...),
    # + a fifth (gradient boosting / XGBoost)
}

pipelines = {name: ImbPipeline([("preprocess", preprocessor),
                                ("smote", smote),
                                ("model", model)])
             for name, model in models.items()}
```

**Everything correct here is worth naming:**

1. **`ImbPipeline`**, not sklearn's `Pipeline` — so SMOTE runs during `fit` and is skipped during `predict`. The critical detail from §4.6.
2. **SMOTE inside the CV loop** — resampling happens per fold, on that fold's training portion only. No synthetic point ever appears in a validation fold.
3. **`f1_macro` first** — every class weighted equally, so the rare `Fatal` class counts.
4. **`class_weight="balanced"` as well** — belt and braces on the imbalance.
5. **`multi_class="multinomial"`** — true softmax multinomial logistic regression rather than one-vs-rest. (Deprecated in current sklearn, where multinomial is the default.)
6. **A dict comprehension** builds five pipelines from five models — Part 1 idiom, real use.

### Compare, select, evaluate once

```python
results = []
for name, pipe in pipelines.items():
    cv_out = cross_validate(pipe, X_train, y_train_enc,
                            scoring=scoring, cv=cv, n_jobs=-1)
    results.append({
        "model": name,
        "f1_macro_mean": np.mean(cv_out["test_f1_macro"]),
        "f1_macro_std":  np.std(cv_out["test_f1_macro"]),
        ...
    })

best_model_name = results_df.iloc[0]["model"]
best_pipe = pipelines[best_model_name]

best_pipe.fit(X_train, y_train_enc)
y_pred  = best_pipe.predict(X_test)
y_proba = best_pipe.predict_proba(X_test)

print(classification_report(y_test_enc, y_pred, target_names=le.classes_))

test_roc_auc = roc_auc_score(y_test_enc, y_proba, multi_class="ovr",
                             average="weighted", labels=best_pipe.classes_)
```

**Model selection happens on cross-validated *training* scores. The test set is touched exactly once, at the end, by the winner only.** That is the discipline criterion 5 is asking about, and getting it right is worth more than any metric.

Reporting `std` alongside `mean` (§6.5) lets you see whether the winner actually beat the runner-up or just got a luckier fold split.

`target_names=le.classes_` makes the report say "Fatal / Serious / Slight" instead of "0 / 1 / 2".

### Artifacts

```python
joblib.dump(best_pipe, ARTIFACT_DIR / f"best_model_{best_model_name}.joblib")

metrics = {
    "best_model": best_model_name,
    "test_f1_macro": float(test_f1_macro),
    "test_f1_weighted": float(test_f1_weighted),
    "test_roc_auc_ovr_weighted": float(test_roc_auc),
}
json.dump(metrics, open(artifact_metrics_path, "w"), indent=2)
results_df.to_csv(artifact_leaderboard_path, index=False)
```

Model, metrics and the full CV leaderboard. Six months later you can answer any question about this run without rerunning it.

---

## 13.9 The findings — criteria 2 and 6, delivered 🟢 ⭐

> [!quote] 💬 Say it in the interview
> “The key findings were quantified: motorcyclists had ~42% serious or fatal outcomes vs ~8% for cars, and time of day was among the strongest predictors.”

From the sibling `AI_Project/readme.md`:

> **Vulnerable Road Users:** Motorcyclists are at exceptionally high risk. For instance, accidents involving "Motorcycles over 500cc" have a ~42% Serious/Fatal rate, compared to just ~8% for Cars.
>
> **Infrastructure Impact:** Lighting is a critical factor. Accidents occurring in "Darkness: street lights present but unlit" showed a 66% severity rate (sample size permitting), suggesting **infrastructure maintenance is a key safety lever**. "Darkness: no street lighting" also carries double the risk (22%) compared to daylight (11%).
>
> **Time & Demographics:** Age of Casualty and Hour of Day are the two most important features in the predictive model, indicating that *who* is involved and *when* the accident happens matters more than weather conditions.

Look at what makes these good:

- **They are quantified.** "42% vs 8%", not "motorcycles are riskier".
- **They are actionable.** "Street lights present but unlit" is worse than no lights at all — which points at a specific, fixable maintenance failure. That is a finding a city council could act on tomorrow.
- **They are honest.** *"sample size permitting"* flags that the 66% figure rests on few observations. Stating your own uncertainty builds more credibility than hiding it.
- **They contradict an intuition.** Weather turns out to matter less than time and age. Findings that surprise are the ones worth reporting.

The notebook's EDA conclusions section then closes the loop from observation to method:

> **1) Target imbalance is strong** — `Slight` is the majority class, while `Fatal` is rare. **This is why we prefer F1-macro and use SMOTE inside the CV pipeline.**

**Observation → modelling consequence.** That sentence structure is the template for writing up any analysis.

---

## 13.10 The advanced extensions 🟡

### HDBSCAN for spatial hotspots

> Accidents are **spatial events**. We can discover **hotspots** (high-density accident zones) and **noise/outliers** (isolated accidents).
>
> **Why HDBSCAN?** Automatically finds clusters with different densities, handles noise points naturally, more flexible than KMeans for geographic data.
>
> Output: A new feature `cluster_id` that can be used later in classification.

**Unsupervised learning as feature engineering** (§9.10). Cluster the coordinates, feed the cluster ID back into the classifier. The model gains "this happened in a known accident hotspot" — a fact that no single raw column contains.

The three reasons given for HDBSCAN over K-Means are all correct and all matter for geographic data: variable density, automatic cluster count, and explicit noise labelling.

### SHAP

```python
!pip install shap
import shap
explainer = shap.TreeExplainer(best_pipe)
```

**SHAP (SHapley Additive exPlanations)** assigns each feature a contribution to each individual prediction, based on cooperative game theory — the Shapley value from economics, which is the unique attribution satisfying a set of fairness axioms.

The improvement over built-in feature importance is substantial:

| | `feature_importances_` | SHAP |
|---|---|---|
| Scope | Global only | **Per-prediction** and global |
| Direction | No — magnitude only | **Signed** — pushed toward or away |
| Correlated features | Splits importance arbitrarily | Handles more principledly |
| Model support | Tree models | Any model |

Per-prediction explanation is what lets you answer "why did the model say *this* accident would be serious?" — which is the question a stakeholder actually asks.

⚠️ `shap.TreeExplainer(best_pipe)` will not work on a Pipeline directly — it needs the raw tree model and the transformed feature matrix:

```python
model = best_pipe.named_steps["model"]
X_trans = best_pipe.named_steps["preprocess"].transform(X_test)
explainer = shap.TreeExplainer(model)
shap_values = explainer.shap_values(X_trans)
```

(Or use the model-agnostic `shap.Explainer` with a prediction function.) The notebook's line is aspirational rather than working — worth fixing if you revisit it.

---

## 13.11 The sibling: `AI_Project/` as a module 🟡

The collective version of the same project uses the Part 11 structure rather than one notebook:

```
AI_Project/
├── libraries.py       # shared imports
├── data_handling.py   # loading + cleaning
├── EDA.py             # plots
├── training.py        # model fitting
├── evaluation.py      # metrics + confusion matrix
├── collective_project.ipynb   # the narrative, importing the above
├── readme.md          # the findings write-up
├── requirements.txt
└── *.png              # saved figures
```

**This is the right pattern for team work.** Logic lives in modules that can be reviewed and diffed; the notebook is the narrative layer that imports them. Four people can work on four modules without merge conflicts in JSON.

(`libraries.py` as a shared import module is a slight anti-pattern — `from libraries import *` obscures where names come from. Explicit imports per module are better. But the overall separation is sound.)

The saved figures — `accidents_by_hour.png`, `severity_by_lighting.png`, `severity_by_road_surface.png`, `severity_distribution.png`, `confusion_matrix_final.png` — are the deliverable for criterion 3.

---

## 13.12 What to lift from this project 🟢 ⭐

| Practice | Why |
|---|---|
| `profile_dataframe()` as a reusable function | Catches whitespace/type bugs every time |
| Exact-duplicate-only removal, with reasoning | Understand what a row means first |
| Domain-informed features (astral sunrise) | The best features come from outside the data |
| Decomposing messy text into orthogonal flags | Interpretable and model-friendly |
| Row-normalised stacked bars | Rates, not counts — the only fair comparison |
| Chi-square / ANOVA screening | Quantify what EDA suggested |
| VIF before linear models | Catches self-inflicted collinearity |
| **`DummyClassifier` baseline** | Calibrates every number that follows |
| **`ImbPipeline` with SMOTE inside CV** | The only leak-free way to resample |
| F1-macro on imbalanced multi-class | Rare classes count |
| Model selection on CV, test touched once | The definition of an honest estimate |
| Leaderboard + metrics.json + model saved | Reproducibility |
| Findings written as quantified statements | Half the marks |

---

## 13.13 What would make it stronger 🟡

An honest critique, since you may revisit this as a portfolio piece:

1. **`GroupKFold` on `Reference Number`** — casualties from one accident are not independent observations.
2. **Fix the SHAP call** so the interpretation section actually runs.
3. **Threshold/cost analysis** — a false "Slight" on a genuinely Fatal case is not the same error as the reverse. A cost matrix would express that.
4. **Precision-Recall curves per class**, not only ROC — better under this much imbalance (§8.8).
5. **Multiple-testing correction** on the chi-square battery.
6. **Calibration check** — `CalibratedClassifierCV` and a reliability diagram, if the predicted probabilities are to be used as risk scores rather than just ranked.
7. **A model card** — a short document stating intended use, training data, known limitations, and performance by subgroup. Increasingly expected, and it would suit this project's public-safety subject particularly well.

---

> [!check] ✅ Key takeaways
> - The template: brief → profile → features → EDA → split → pipeline → baseline → models (CV) → test once → explain → save.
> - F1-macro and a dummy baseline because the target is ~89% one class.
> - SMOTE lives inside the imblearn pipeline so it only touches training folds.
> - Findings are quantified and actionable (motorcycles ~42% serious/fatal vs ~8% for cars).
> - Know the limitations: grouped rows (use GroupKFold), no temporal validation, uncalibrated probabilities.
> - Rehearse it as a 3-minute story with numbers.

## ⚡ Interview quick-fire

Cover the right-hand column and answer out loud first.

| Question | Strong short answer |
|---|---|
| **3-minute project pitch structure?** | Problem and why it matters → data (size, source, issues) → 2 EDA insights with numbers → approach (pipeline, baseline, models, metric) → result vs baseline → limitation and next step. |
| **Why F1-macro?** | The severity classes are imbalanced (~89% "Slight"); macro-F1 weights every class equally, so the rare serious and fatal classes count. |
| **Why SMOTE inside the CV folds?** | Oversampling before splitting leaks synthetic copies of validation rows into training and inflates the scores. |
| **What did the dummy baseline score, and why report it?** | About 89% accuracy by always predicting "Slight". It proves accuracy is meaningless here and sets the bar. |
| **One thing you would improve?** | Temporal or geographic validation, calibrated probabilities and cost-weighted thresholds, plus SHAP-based error analysis per class. |

---

## Further reading

- **imbalanced-learn: "Common pitfalls and recommended practices"** — https://imbalanced-learn.org/stable/common_pitfalls.html — specifically on why resampling must live inside the CV loop.
- **SHAP documentation** — https://shap.readthedocs.io/ — start with the "An introduction to explainable AI with Shapley values" notebook.
- **Interpretable Machine Learning**, Christoph Molnar — https://christophm.github.io/interpretable-ml-book/ — the chapters on SHAP, permutation importance and partial dependence.
- **"Model Cards for Model Reporting"**, Mitchell et al. (2019) — the origin of the model card practice.
- **Kaggle competition write-ups** — reading the top solutions' notebooks is the fastest way to absorb the norms of this kind of project.

---

<!-- nav -->
> [!example] 🧭 Step 15 of 26 · Stage 4 of 7: Applied ML
> ← [Part 11 · Neural networks](11_Neural_Networks.md) · [Part 17 · Training deep nets](17_Training_Deep_Neural_Networks.md) → · [Course map](00_START_HERE.md)
<!-- /nav -->
