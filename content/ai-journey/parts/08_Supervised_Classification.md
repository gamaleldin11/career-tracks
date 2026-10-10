# Part 8 — Supervised Learning: Classification

<!-- nav -->
> [!example] 🧭 Step 10 of 26 · Stage 3 of 7: Classical ML
> ← [Part 07 · Regression](07_Supervised_Regression.md) · [Part 08B · Trees & ensembles](08B_Trees_and_Ensembles.md) → · [Course map](00_START_HERE.md)
<!-- /nav -->

**Source:** `AI_notebooks/2026-01-05/binary_classification_reference_notebook.ipynb` (18 cells), `advertising.csv` **Lecture:** Lec 12

The notebook describes itself as:

> This notebook is a **reference template** for any future **binary classification** problem.

That is how to treat it. The target is `Clicked on Ad`; the structure is the deliverable.

<!-- interview-focus -->

> [!tip] 🎯 Interview focus
> **Why it matters:** Churn, fraud and propensity are all classification problems — the core of telecom data science. Expect deep follow-ups on metrics and thresholds.
>
> | Level | What you should be able to do |
> |---|---|
> | 🟢 **Entry** | Logistic regression, KNN and trees; the confusion matrix; precision/recall/F1; ROC-AUC; stratified splits; why accuracy misleads on imbalanced data. |
> | 🟡 **Mid** | Choose the threshold from costs; PR vs ROC; calibration; multiclass strategies; error analysis; turn a model into a profit decision. |
> | 🔴 **Senior** | Cost-sensitive design, fairness metrics, calibration in production, uplift vs response modelling. |
>
> **⭐ Most-asked:** *Your fraud model is 99.8% accurate — good?* · *Precision vs recall for churn retention?* · *What does an AUC of 0.8 mean?* · *How do you choose the classification threshold?* · *Derive or explain the logistic regression loss.*
>
> **⏱ Time:** 5 h  ·  **Short on time?** Read §8.7, §8.8, §8.12.3–8.12.5, §8.14, §8.15, §8.17.

**Legend:** 🟢 Entry (0–2 yrs) · 🟡 Mid (2–5 yrs) · 🔴 Senior / specialist · ⭐ frequently asked · 📖 Géron, *Hands-On ML with Scikit-Learn and PyTorch* (2025) pages

> [!abstract]- 🗺️ Section map — level and book pages
>
> | § | Section | Level | 📖 Book |
> |---|---|:---:|---|
> | 8.1 | Regression vs classification — what actually changes | 🟢 | — |
> | 8.2 | Data quality and the imbalance check | 🟢 ⭐ | — |
> | 8.3 | Feature engineering | 🟢 | — |
> | 8.4 | Stratified split and pipeline | 🟢 ⭐ | — |
> | 8.5 | The three models | 🟢 | — |
> | 8.6 | Cross-validation with classification metrics | 🟢 | — |
> | 8.7 | Test evaluation | 🟢 ⭐ | — |
> | 8.8 | The ROC curve | 🟢 ⭐ | Ch. 3 · pp. 120–124 |
> | 8.9 | Saving | 🟢 | — |
> | 8.10 | The reusable template | 🟢 | — |
> | 8.11 | Models the course did not reach | 🟢 | — |
> | 8.12 | Classification in depth | 🟢 ⭐ | Ch. 3 · pp. 107–133 |
> | 8.13 | Logistic regression, the full derivation | 🟡 ⭐ | Ch. 4 · pp. 167–177 |
> | 8.14 | Choosing and reading classification metrics — the cheat sheet | 🟢 ⭐ | Ch. 3 · pp. 111–124 |
> | 8.15 | Worked example: turning a model into a business decision | 🟡 ⭐ | — |
> | 8.16 | Support Vector Machines — what you need for interviews | 🟡 | online chapter on SVMs (homl.info) — not in the printed 2025 edition |
> | 8.17 | Interview drill — classification | 🟢 ⭐ | Ch. 3 · p. 133 |
> | 8.18 | Real-world examples — classification decisions | 🟡 | — |
>

---

## 8.1 Regression vs classification — what actually changes 🟢

| | Regression (Part 7) | Classification (here) |
|---|---|---|
| Target | Continuous number | Discrete class |
| Output | A value | A **probability**, then a class |
| Loss | MSE | Log-loss (cross-entropy) |
| Metrics | RMSE, R² | Accuracy, precision, recall, F1, ROC-AUC |
| Split | `train_test_split` | `train_test_split(stratify=y)` |
| CV | `KFold` | `StratifiedKFold` |
| New concern | — | **Class imbalance** |

Everything else — the pipeline, the leakage rule, the baseline, the artifacts — is identical. That is the point of the template.

---

## 8.2 Data quality and the imbalance check 🟢 ⭐

> [!quote] 💬 Say it in the interview
> “Before modelling I check the class balance, because it decides the metric, the split (stratified) and the dummy baseline I must beat.”

```python
DATA_PATH = Path("advertising.csv")
assert DATA_PATH.exists(), f"File not found: {DATA_PATH.resolve()}"
df = pd.read_csv(DATA_PATH)

print("Duplicate rows:", df.duplicated().sum())
```

The notebook's own comments explain the checks:

> We check:
> 1) Duplicates: repeated rows can bias training.
> 2) Missing values: tells us where we need imputation.
> 3) Data types: helps separate numeric vs categorical preprocessing.

Then the step that is new for classification:

```python
TARGET = "Clicked on Ad"
counts = df[TARGET].value_counts()
```

> Class imbalance is important in classification. If a dataset is imbalanced (e.g., 95% zeros, 5% ones):
> - accuracy can be misleading
> - we may need `class_weight='balanced'` or resampling (advanced)

**Check the class balance before anything else.** It determines your metric, your splitter, your `class_weight`, and whether you need SMOTE. `advertising.csv` happens to be balanced 50/50, which makes it a gentle first classification dataset — the capstone in Part 13 is where imbalance bites.

---

## 8.3 Feature engineering 🟢

```python
# A) Timestamp -> hour/dayofweek/month
df["Timestamp"] = pd.to_datetime(df["Timestamp"], errors="coerce")
df["hour"]      = df["Timestamp"].dt.hour
df["dayofweek"] = df["Timestamp"].dt.dayofweek
df["month"]     = df["Timestamp"].dt.month

# B) Text length
df["ad_topic_len"] = df["Ad Topic Line"].astype(str).str.len()

# C) Top-N categories, everything else becomes "Other"
top_countries = df["Country"].value_counts().head(20).index
df["Country_top"] = df["Country"].where(df["Country"].isin(top_countries), "Other")
```

Three techniques, each solving a distinct problem:

**A — Datetime decomposition.** A raw timestamp is a large monotonic integer that never repeats; it is useless to a model. `hour` and `dayofweek` are small, cyclic, and capture real behaviour (people browse differently at 3am than at 3pm). This is the highest-value feature engineering move in tabular ML and it costs three lines.

📌 **A refinement worth knowing:** `hour` as an integer tells the model that 23 and 0 are 23 units apart, when they are adjacent. For cyclic features, encode as sine and cosine:

```python
df["hour_sin"] = np.sin(2 * np.pi * df["hour"] / 24)
df["hour_cos"] = np.cos(2 * np.pi * df["hour"] / 24)
```

Now midnight and 11pm are close in feature space. Matters for linear models and KNN; trees can carve the discontinuity themselves.

<figure class="dia"><svg viewBox="0 0 720 266" role="img" aria-label="Hours as integers put 23 and 0 at opposite ends of a line, 23 units apart; encoded as sine and cosine they sit on a circle where 23:00 and 00:00 are neighbours at the same distance as any two consecutive hours">
<text class="sT" x="180" y="22" text-anchor="middle">hour as an integer</text><line class="sLm" x1="30" y1="80" x2="330" y2="80"/>
<circle class="sPr" cx="30.0" cy="80" r="5"/>
<text class="sS" x="30" y="100" text-anchor="middle">0</text>
<circle class="sP" cx="43.0" cy="80" r="3"/>
<circle class="sP" cx="56.1" cy="80" r="3"/>
<circle class="sP" cx="69.1" cy="80" r="3"/>
<text class="sS" x="69.1304" y="100" text-anchor="middle">3</text>
<circle class="sP" cx="82.2" cy="80" r="3"/>
<circle class="sP" cx="95.2" cy="80" r="3"/>
<circle class="sP" cx="108.3" cy="80" r="3"/>
<text class="sS" x="108.261" y="100" text-anchor="middle">6</text>
<circle class="sP" cx="121.3" cy="80" r="3"/>
<circle class="sP" cx="134.3" cy="80" r="3"/>
<circle class="sP" cx="147.4" cy="80" r="3"/>
<text class="sS" x="147.391" y="100" text-anchor="middle">9</text>
<circle class="sP" cx="160.4" cy="80" r="3"/>
<circle class="sP" cx="173.5" cy="80" r="3"/>
<circle class="sP" cx="186.5" cy="80" r="3"/>
<text class="sS" x="186.522" y="100" text-anchor="middle">12</text>
<circle class="sP" cx="199.6" cy="80" r="3"/>
<circle class="sP" cx="212.6" cy="80" r="3"/>
<circle class="sP" cx="225.7" cy="80" r="3"/>
<text class="sS" x="225.652" y="100" text-anchor="middle">15</text>
<circle class="sP" cx="238.7" cy="80" r="3"/>
<circle class="sP" cx="251.7" cy="80" r="3"/>
<circle class="sP" cx="264.8" cy="80" r="3"/>
<text class="sS" x="264.783" y="100" text-anchor="middle">18</text>
<circle class="sP" cx="277.8" cy="80" r="3"/>
<circle class="sP" cx="290.9" cy="80" r="3"/>
<circle class="sP" cx="303.9" cy="80" r="3"/>
<text class="sS" x="303.913" y="100" text-anchor="middle">21</text>
<circle class="sP" cx="317.0" cy="80" r="3"/>
<circle class="sPr" cx="330.0" cy="80" r="5"/>
<text class="sS" x="330" y="100" text-anchor="middle">23</text>
<path class="sLr" d="M 30.0 70 Q 180 20 330.0 70" fill="none" marker-end="url(#ahr)"/>
<text class="sRt" x="180" y="130" text-anchor="middle">23:00 → 00:00 looks 23 apart</text>
<text class="sS" x="180" y="150" text-anchor="middle">the model sees midnight as far from 11 pm</text>
<text class="sT" x="540" y="16" text-anchor="middle">(sin, cos) of 2π·hour/24</text><circle class="sLm" cx="540" cy="126" r="74" style="fill:none"/>
<circle class="sPg" cx="540.0" cy="52.0" r="5"/>
<text class="sS" x="540" y="40" text-anchor="middle">0</text>
<circle class="sP" cx="559.2" cy="54.5" r="3"/>
<circle class="sP" cx="577.0" cy="61.9" r="3"/>
<circle class="sP" cx="592.3" cy="73.7" r="3"/>
<text class="sS" x="603.64" y="66.3604" text-anchor="middle">3</text>
<circle class="sP" cx="604.1" cy="89.0" r="3"/>
<circle class="sP" cx="611.5" cy="106.8" r="3"/>
<circle class="sP" cx="614.0" cy="126.0" r="3"/>
<text class="sS" x="630" y="130" text-anchor="middle">6</text>
<circle class="sP" cx="611.5" cy="145.2" r="3"/>
<circle class="sP" cx="604.1" cy="163.0" r="3"/>
<circle class="sP" cx="592.3" cy="178.3" r="3"/>
<text class="sS" x="603.64" y="193.64" text-anchor="middle">9</text>
<circle class="sP" cx="577.0" cy="190.1" r="3"/>
<circle class="sP" cx="559.2" cy="197.5" r="3"/>
<circle class="sP" cx="540.0" cy="200.0" r="3"/>
<text class="sS" x="540" y="220" text-anchor="middle">12</text>
<circle class="sP" cx="520.8" cy="197.5" r="3"/>
<circle class="sP" cx="503.0" cy="190.1" r="3"/>
<circle class="sP" cx="487.7" cy="178.3" r="3"/>
<text class="sS" x="476.36" y="193.64" text-anchor="middle">15</text>
<circle class="sP" cx="475.9" cy="163.0" r="3"/>
<circle class="sP" cx="468.5" cy="145.2" r="3"/>
<circle class="sP" cx="466.0" cy="126.0" r="3"/>
<text class="sS" x="450" y="130" text-anchor="middle">18</text>
<circle class="sP" cx="468.5" cy="106.8" r="3"/>
<circle class="sP" cx="475.9" cy="89.0" r="3"/>
<circle class="sP" cx="487.7" cy="73.7" r="3"/>
<text class="sS" x="476.36" y="66.3604" text-anchor="middle">21</text>
<circle class="sP" cx="503.0" cy="61.9" r="3"/>
<circle class="sPg" cx="520.8" cy="54.5" r="5"/>
<text class="sS" x="516.706" y="43.0667" text-anchor="middle">23</text>
<text class="sGt" x="540" y="238" text-anchor="middle">23:00 ↔ 00:00 distance 0.26, the same as 11:00 ↔ 12:00 (0.26)</text>
<text class="sS" x="540" y="256" text-anchor="middle">opposite hours (00:00 ↔ 12:00) are the farthest apart: 2</text>
</svg><figcaption>Cyclic encoding, computed: two columns place the 24 hours on a circle, so the wrap-around at midnight disappears.</figcaption></figure>

**B — Text length as a proxy.** The full ad topic line is high-cardinality free text. Its *length* is one clean numeric feature that may carry signal (long headlines vs short) at almost no cost. A cheap way to extract something from text without going full NLP — see Part 10 for the full treatment.

**C — Top-N + "Other".** The standard, robust fix for high cardinality. One-hot on 237 countries gives 237 sparse columns, most with a handful of rows each; the model cannot learn anything reliable from them and you have invited overfitting. Keeping the top 20 and bucketing the rest keeps the signal and drops the noise.

```python
y = df[TARGET].copy()
drop_cols = ["Timestamp", "Ad Topic Line", "Country", "City", TARGET]
X = df.drop(columns=drop_cols)
```

> We drop raw columns that were replaced by engineered features […] We also drop `City` (usually high-cardinality) to keep a clean baseline notebook.

Drop the originals once you have extracted from them. Keeping both the raw `Country` and the derived `Country_top` gives you two collinear representations of the same thing.

---

## 8.4 Stratified split and pipeline 🟢 ⭐

> [!quote] 💬 Say it in the interview
> “Stratified splitting keeps the class ratio identical in train and test, which matters when positives are rare.”

```python
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=RANDOM_STATE, stratify=y)
```

> Stratify keeps the same class ratio in train and test sets.

```python
num_cols = X.select_dtypes(include="number").columns.tolist()
cat_cols = X.select_dtypes(include=["object", "category", "bool"]).columns.tolist()

numeric_pipe = Pipeline([
    ("imputer", SimpleImputer(strategy="median")),   # robust
    ("scaler",  StandardScaler())                    # important for LogReg & KNN
])

categorical_pipe = Pipeline([
    ("imputer", SimpleImputer(strategy="most_frequent")),
    ("onehot",  OneHotEncoder(handle_unknown="ignore"))
])

preprocessor = ColumnTransformer([
    ("num", numeric_pipe, num_cols),
    ("cat", categorical_pipe, cat_cols)
])
```

Identical in shape to Part 7, minus the IQR clipper. The notebook's comment — *"scale (important for Logistic Regression & KNN)"* — is the §4.7 rule applied: both are distance/gradient methods.

---

## 8.5 The three models 🟢

```python
models = {
    "Logistic Regression": Pipeline([
        ("preprocess", preprocessor),
        ("model", LogisticRegression(max_iter=1000, random_state=RANDOM_STATE))
    ]),
    "KNN": Pipeline([
        ("preprocess", preprocessor),
        ("model", KNeighborsClassifier())
    ]),
    "Decision Tree": Pipeline([
        ("preprocess", preprocessor),
        ("model", DecisionTreeClassifier(random_state=RANDOM_STATE))
    ]),
}
```

> Best practice:
> - Each model is a Pipeline: preprocess -> model
> - This prevents leakage and makes saving/loading easy.

A dict of named pipelines, iterated over — clean, and trivially extensible. The capstone extends the same structure to five models.

<figure class="dia"><svg viewBox="0 0 720 272" role="img" aria-label="The same two-class data with a roughly circular positive region, classified by three models: logistic regression cannot wrap a ring with one straight line and predicts everything negative, KNN with k equal 5 follows the points closely, and a depth-3 decision tree carves axis-aligned rectangles">
<rect class="sN" x="14" y="34" width="196" height="196" rx="0" style="fill:none"/>
<circle class="sP" cx="58.4" cy="41.4" r="3"/>
<circle class="sP" cx="30.7" cy="181.5" r="3"/>
<circle class="sP" cx="209.8" cy="189.0" r="3"/>
<circle class="sPg" cx="102.8" cy="133.0" r="3"/>
<circle class="sP" cx="51.7" cy="67.2" r="3"/>
<circle class="sP" cx="17.9" cy="177.7" r="3"/>
<circle class="sP" cx="93.9" cy="53.2" r="3"/>
<circle class="sP" cx="64.6" cy="35.6" r="3"/>
<circle class="sP" cx="26.4" cy="108.4" r="3"/>
<circle class="sPg" cx="80.3" cy="94.5" r="3"/>
<circle class="sPg" cx="111.5" cy="102.7" r="3"/>
<circle class="sP" cx="41.9" cy="217.4" r="3"/>
<circle class="sP" cx="199.4" cy="134.2" r="3"/>
<circle class="sPg" cx="127.5" cy="87.1" r="3"/>
<circle class="sP" cx="186.7" cy="174.0" r="3"/>
<circle class="sP" cx="40.5" cy="80.2" r="3"/>
<circle class="sP" cx="33.1" cy="94.7" r="3"/>
<circle class="sP" cx="179.3" cy="131.3" r="3"/>
<circle class="sP" cx="52.7" cy="200.6" r="3"/>
<circle class="sP" cx="28.0" cy="53.0" r="3"/>
<circle class="sPg" cx="113.5" cy="92.5" r="3"/>
<circle class="sP" cx="16.3" cy="162.7" r="3"/>
<circle class="sPg" cx="66.3" cy="147.0" r="3"/>
<circle class="sP" cx="188.7" cy="195.7" r="3"/>
<circle class="sP" cx="91.7" cy="197.4" r="3"/>
<circle class="sP" cx="53.6" cy="79.8" r="3"/>
<circle class="sP" cx="72.8" cy="227.4" r="3"/>
<circle class="sP" cx="47.4" cy="144.6" r="3"/>
<circle class="sP" cx="59.4" cy="149.6" r="3"/>
<circle class="sPg" cx="129.3" cy="173.4" r="3"/>
<circle class="sP" cx="32.6" cy="213.3" r="3"/>
<circle class="sP" cx="84.6" cy="71.7" r="3"/>
<circle class="sPg" cx="113.0" cy="91.2" r="3"/>
<circle class="sP" cx="17.3" cy="202.5" r="3"/>
<circle class="sPg" cx="89.7" cy="117.6" r="3"/>
<circle class="sP" cx="203.1" cy="229.4" r="3"/>
<circle class="sP" cx="177.8" cy="188.8" r="3"/>
<circle class="sP" cx="203.2" cy="81.2" r="3"/>
<circle class="sP" cx="208.1" cy="116.3" r="3"/>
<circle class="sP" cx="100.5" cy="213.7" r="3"/>
<circle class="sPg" cx="132.7" cy="132.5" r="3"/>
<circle class="sP" cx="37.9" cy="116.2" r="3"/>
<circle class="sP" cx="102.7" cy="205.2" r="3"/>
<circle class="sPg" cx="154.2" cy="137.6" r="3"/>
<circle class="sPg" cx="91.2" cy="159.3" r="3"/>
<circle class="sP" cx="101.5" cy="208.8" r="3"/>
<circle class="sP" cx="156.1" cy="91.2" r="3"/>
<circle class="sPg" cx="85.4" cy="145.2" r="3"/>
<circle class="sP" cx="32.3" cy="40.3" r="3"/>
<circle class="sP" cx="152.2" cy="190.7" r="3"/>
<circle class="sPg" cx="59.0" cy="127.0" r="3"/>
<circle class="sP" cx="15.3" cy="109.8" r="3"/>
<circle class="sP" cx="192.1" cy="84.3" r="3"/>
<circle class="sP" cx="57.8" cy="171.9" r="3"/>
<circle class="sP" cx="121.3" cy="38.5" r="3"/>
<circle class="sP" cx="180.7" cy="128.8" r="3"/>
<circle class="sP" cx="136.5" cy="42.4" r="3"/>
<circle class="sP" cx="179.8" cy="191.6" r="3"/>
<circle class="sP" cx="86.5" cy="42.1" r="3"/>
<circle class="sPg" cx="70.9" cy="109.8" r="3"/>
<circle class="sP" cx="179.2" cy="95.9" r="3"/>
<circle class="sP" cx="174.9" cy="111.4" r="3"/>
<circle class="sPg" cx="85.0" cy="146.2" r="3"/>
<circle class="sP" cx="178.3" cy="177.3" r="3"/>
<circle class="sP" cx="27.5" cy="86.3" r="3"/>
<circle class="sP" cx="36.9" cy="67.5" r="3"/>
<circle class="sPg" cx="67.7" cy="172.8" r="3"/>
<circle class="sP" cx="68.4" cy="55.9" r="3"/>
<circle class="sPg" cx="94.7" cy="159.2" r="3"/>
<circle class="sP" cx="160.5" cy="181.0" r="3"/>
<text class="sT" x="112" y="24" text-anchor="middle">logistic regression</text><text class="sS" x="112" y="246" text-anchor="middle">no line fits a ring: all negative</text><text class="sS" x="112" y="261" text-anchor="middle">train accuracy 74%</text>
<rect class="sG" x="293.2" y="138.533" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="293.2" y="118.933" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="293.2" y="105.867" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="299.733" y="145.067" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="299.733" y="138.533" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="299.733" y="132" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="299.733" y="125.467" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="299.733" y="118.933" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="299.733" y="112.4" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="299.733" y="105.867" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="299.733" y="99.3333" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="306.267" y="171.2" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="306.267" y="164.667" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="306.267" y="158.133" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="306.267" y="151.6" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="306.267" y="145.067" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="306.267" y="138.533" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="306.267" y="132" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="306.267" y="125.467" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="306.267" y="118.933" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="306.267" y="112.4" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="306.267" y="105.867" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="306.267" y="99.3333" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="306.267" y="92.8" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="312.8" y="177.733" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="312.8" y="171.2" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="312.8" y="164.667" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="312.8" y="158.133" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="312.8" y="151.6" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="312.8" y="145.067" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="312.8" y="138.533" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="312.8" y="132" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="312.8" y="125.467" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="312.8" y="118.933" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="312.8" y="112.4" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="312.8" y="105.867" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="312.8" y="99.3333" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="312.8" y="92.8" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="312.8" y="86.2667" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="319.333" y="177.733" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="319.333" y="171.2" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="319.333" y="164.667" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="319.333" y="158.133" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="319.333" y="151.6" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="319.333" y="145.067" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="319.333" y="138.533" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="319.333" y="132" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="319.333" y="125.467" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="319.333" y="118.933" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="319.333" y="112.4" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="319.333" y="105.867" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="319.333" y="99.3333" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="319.333" y="92.8" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="319.333" y="86.2667" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="325.867" y="177.733" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="325.867" y="171.2" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="325.867" y="164.667" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="325.867" y="158.133" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="325.867" y="151.6" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="325.867" y="145.067" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="325.867" y="138.533" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="325.867" y="132" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="325.867" y="125.467" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="325.867" y="118.933" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="325.867" y="112.4" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="325.867" y="105.867" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="325.867" y="99.3333" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="325.867" y="92.8" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="325.867" y="86.2667" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="325.867" y="79.7333" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="325.867" y="73.2" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="332.4" y="171.2" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="332.4" y="164.667" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="332.4" y="158.133" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="332.4" y="151.6" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="332.4" y="145.067" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="332.4" y="138.533" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="332.4" y="132" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="332.4" y="125.467" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="332.4" y="118.933" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="332.4" y="112.4" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="332.4" y="105.867" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="332.4" y="99.3333" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="332.4" y="92.8" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="332.4" y="86.2667" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="332.4" y="79.7333" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="332.4" y="73.2" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="332.4" y="66.6667" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="338.933" y="171.2" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="338.933" y="164.667" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="338.933" y="158.133" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="338.933" y="151.6" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="338.933" y="145.067" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="338.933" y="138.533" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="338.933" y="132" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="338.933" y="125.467" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="338.933" y="118.933" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="338.933" y="112.4" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="338.933" y="105.867" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="338.933" y="99.3333" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="338.933" y="92.8" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="338.933" y="86.2667" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="338.933" y="79.7333" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="338.933" y="73.2" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="338.933" y="66.6667" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="345.467" y="177.733" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="345.467" y="171.2" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="345.467" y="164.667" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="345.467" y="158.133" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="345.467" y="151.6" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="345.467" y="145.067" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="345.467" y="138.533" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="345.467" y="132" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="345.467" y="125.467" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="345.467" y="118.933" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="345.467" y="112.4" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="345.467" y="105.867" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="345.467" y="99.3333" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="345.467" y="92.8" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="345.467" y="86.2667" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="345.467" y="79.7333" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="345.467" y="73.2" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="345.467" y="66.6667" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="352" y="171.2" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="352" y="164.667" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="352" y="158.133" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="352" y="151.6" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="352" y="145.067" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="352" y="138.533" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="352" y="132" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="352" y="125.467" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="352" y="118.933" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="352" y="112.4" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="352" y="105.867" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="352" y="99.3333" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="352" y="92.8" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="352" y="86.2667" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="352" y="79.7333" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="352" y="73.2" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="352" y="66.6667" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="352" y="60.1333" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="358.533" y="171.2" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="358.533" y="164.667" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="358.533" y="158.133" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="358.533" y="151.6" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="358.533" y="145.067" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="358.533" y="138.533" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="358.533" y="132" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="358.533" y="125.467" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="358.533" y="118.933" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="358.533" y="112.4" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="358.533" y="105.867" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="358.533" y="99.3333" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="358.533" y="92.8" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="358.533" y="86.2667" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="358.533" y="79.7333" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="358.533" y="73.2" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="358.533" y="66.6667" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="365.067" y="164.667" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="365.067" y="158.133" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="365.067" y="151.6" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="365.067" y="145.067" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="365.067" y="138.533" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="365.067" y="132" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="365.067" y="125.467" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="365.067" y="118.933" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="365.067" y="112.4" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="365.067" y="105.867" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="365.067" y="99.3333" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="365.067" y="92.8" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="365.067" y="86.2667" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="365.067" y="79.7333" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="365.067" y="73.2" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="365.067" y="66.6667" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="365.067" y="60.1333" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="371.6" y="171.2" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="371.6" y="164.667" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="371.6" y="158.133" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="371.6" y="151.6" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="371.6" y="145.067" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="371.6" y="138.533" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="371.6" y="132" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="371.6" y="125.467" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="371.6" y="118.933" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="371.6" y="112.4" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="371.6" y="105.867" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="371.6" y="99.3333" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="371.6" y="92.8" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="371.6" y="86.2667" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="371.6" y="79.7333" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="371.6" y="73.2" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="371.6" y="66.6667" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="378.133" y="164.667" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="378.133" y="158.133" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="378.133" y="151.6" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="378.133" y="145.067" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="378.133" y="138.533" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="378.133" y="132" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="378.133" y="125.467" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="378.133" y="118.933" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="378.133" y="112.4" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="378.133" y="105.867" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="378.133" y="99.3333" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="378.133" y="92.8" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="378.133" y="86.2667" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="378.133" y="79.7333" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="378.133" y="73.2" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="378.133" y="66.6667" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="384.667" y="158.133" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="384.667" y="151.6" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="384.667" y="145.067" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="384.667" y="138.533" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="384.667" y="105.867" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="384.667" y="79.7333" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="391.2" y="151.6" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sN" x="254" y="34" width="196" height="196" rx="0" style="fill:none"/>
<circle class="sP" cx="298.4" cy="41.4" r="3"/>
<circle class="sP" cx="270.7" cy="181.5" r="3"/>
<circle class="sP" cx="449.8" cy="189.0" r="3"/>
<circle class="sPg" cx="342.8" cy="133.0" r="3"/>
<circle class="sP" cx="291.7" cy="67.2" r="3"/>
<circle class="sP" cx="257.9" cy="177.7" r="3"/>
<circle class="sP" cx="333.9" cy="53.2" r="3"/>
<circle class="sP" cx="304.6" cy="35.6" r="3"/>
<circle class="sP" cx="266.4" cy="108.4" r="3"/>
<circle class="sPg" cx="320.3" cy="94.5" r="3"/>
<circle class="sPg" cx="351.5" cy="102.7" r="3"/>
<circle class="sP" cx="281.9" cy="217.4" r="3"/>
<circle class="sP" cx="439.4" cy="134.2" r="3"/>
<circle class="sPg" cx="367.5" cy="87.1" r="3"/>
<circle class="sP" cx="426.7" cy="174.0" r="3"/>
<circle class="sP" cx="280.5" cy="80.2" r="3"/>
<circle class="sP" cx="273.1" cy="94.7" r="3"/>
<circle class="sP" cx="419.3" cy="131.3" r="3"/>
<circle class="sP" cx="292.7" cy="200.6" r="3"/>
<circle class="sP" cx="268.0" cy="53.0" r="3"/>
<circle class="sPg" cx="353.5" cy="92.5" r="3"/>
<circle class="sP" cx="256.3" cy="162.7" r="3"/>
<circle class="sPg" cx="306.3" cy="147.0" r="3"/>
<circle class="sP" cx="428.7" cy="195.7" r="3"/>
<circle class="sP" cx="331.7" cy="197.4" r="3"/>
<circle class="sP" cx="293.6" cy="79.8" r="3"/>
<circle class="sP" cx="312.8" cy="227.4" r="3"/>
<circle class="sP" cx="287.4" cy="144.6" r="3"/>
<circle class="sP" cx="299.4" cy="149.6" r="3"/>
<circle class="sPg" cx="369.3" cy="173.4" r="3"/>
<circle class="sP" cx="272.6" cy="213.3" r="3"/>
<circle class="sP" cx="324.6" cy="71.7" r="3"/>
<circle class="sPg" cx="353.0" cy="91.2" r="3"/>
<circle class="sP" cx="257.3" cy="202.5" r="3"/>
<circle class="sPg" cx="329.7" cy="117.6" r="3"/>
<circle class="sP" cx="443.1" cy="229.4" r="3"/>
<circle class="sP" cx="417.8" cy="188.8" r="3"/>
<circle class="sP" cx="443.2" cy="81.2" r="3"/>
<circle class="sP" cx="448.1" cy="116.3" r="3"/>
<circle class="sP" cx="340.5" cy="213.7" r="3"/>
<circle class="sPg" cx="372.7" cy="132.5" r="3"/>
<circle class="sP" cx="277.9" cy="116.2" r="3"/>
<circle class="sP" cx="342.7" cy="205.2" r="3"/>
<circle class="sPg" cx="394.2" cy="137.6" r="3"/>
<circle class="sPg" cx="331.2" cy="159.3" r="3"/>
<circle class="sP" cx="341.5" cy="208.8" r="3"/>
<circle class="sP" cx="396.1" cy="91.2" r="3"/>
<circle class="sPg" cx="325.4" cy="145.2" r="3"/>
<circle class="sP" cx="272.3" cy="40.3" r="3"/>
<circle class="sP" cx="392.2" cy="190.7" r="3"/>
<circle class="sPg" cx="299.0" cy="127.0" r="3"/>
<circle class="sP" cx="255.3" cy="109.8" r="3"/>
<circle class="sP" cx="432.1" cy="84.3" r="3"/>
<circle class="sP" cx="297.8" cy="171.9" r="3"/>
<circle class="sP" cx="361.3" cy="38.5" r="3"/>
<circle class="sP" cx="420.7" cy="128.8" r="3"/>
<circle class="sP" cx="376.5" cy="42.4" r="3"/>
<circle class="sP" cx="419.8" cy="191.6" r="3"/>
<circle class="sP" cx="326.5" cy="42.1" r="3"/>
<circle class="sPg" cx="310.9" cy="109.8" r="3"/>
<circle class="sP" cx="419.2" cy="95.9" r="3"/>
<circle class="sP" cx="414.9" cy="111.4" r="3"/>
<circle class="sPg" cx="325.0" cy="146.2" r="3"/>
<circle class="sP" cx="418.3" cy="177.3" r="3"/>
<circle class="sP" cx="267.5" cy="86.3" r="3"/>
<circle class="sP" cx="276.9" cy="67.5" r="3"/>
<circle class="sPg" cx="307.7" cy="172.8" r="3"/>
<circle class="sP" cx="308.4" cy="55.9" r="3"/>
<circle class="sPg" cx="334.7" cy="159.2" r="3"/>
<circle class="sP" cx="400.5" cy="181.0" r="3"/>
<text class="sT" x="352" y="24" text-anchor="middle">KNN, k = 5</text><text class="sS" x="352" y="246" text-anchor="middle">follows the points</text><text class="sS" x="352" y="261" text-anchor="middle">train accuracy 99%</text>
<rect class="sG" x="539.733" y="223.467" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="539.733" y="216.933" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="539.733" y="210.4" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="539.733" y="203.867" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="539.733" y="197.333" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="539.733" y="190.8" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="539.733" y="184.267" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="539.733" y="177.733" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="539.733" y="171.2" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="539.733" y="164.667" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="539.733" y="158.133" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="539.733" y="151.6" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="539.733" y="145.067" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="539.733" y="138.533" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="539.733" y="132" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="539.733" y="125.467" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="539.733" y="118.933" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="539.733" y="112.4" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="539.733" y="105.867" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="539.733" y="99.3333" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="539.733" y="92.8" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="539.733" y="86.2667" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="546.267" y="223.467" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="546.267" y="216.933" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="546.267" y="210.4" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="546.267" y="203.867" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="546.267" y="197.333" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="546.267" y="190.8" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="546.267" y="184.267" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="546.267" y="177.733" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="546.267" y="171.2" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="546.267" y="164.667" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="546.267" y="158.133" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="546.267" y="151.6" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="546.267" y="145.067" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="546.267" y="138.533" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="546.267" y="132" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="546.267" y="125.467" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="546.267" y="118.933" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="546.267" y="112.4" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="546.267" y="105.867" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="546.267" y="99.3333" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="546.267" y="92.8" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="546.267" y="86.2667" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="552.8" y="223.467" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="552.8" y="216.933" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="552.8" y="210.4" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="552.8" y="203.867" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="552.8" y="197.333" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="552.8" y="190.8" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="552.8" y="184.267" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="552.8" y="177.733" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="552.8" y="171.2" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="552.8" y="164.667" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="552.8" y="158.133" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="552.8" y="151.6" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="552.8" y="145.067" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="552.8" y="138.533" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="552.8" y="132" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="552.8" y="125.467" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="552.8" y="118.933" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="552.8" y="112.4" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="552.8" y="105.867" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="552.8" y="99.3333" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="552.8" y="92.8" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="552.8" y="86.2667" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="559.333" y="223.467" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="559.333" y="216.933" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="559.333" y="210.4" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="559.333" y="203.867" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="559.333" y="197.333" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="559.333" y="190.8" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="559.333" y="184.267" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="559.333" y="177.733" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="559.333" y="171.2" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="559.333" y="164.667" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="559.333" y="158.133" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="559.333" y="151.6" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="559.333" y="145.067" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="559.333" y="138.533" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="559.333" y="132" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="559.333" y="125.467" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="559.333" y="118.933" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="559.333" y="112.4" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="559.333" y="105.867" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="559.333" y="99.3333" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="559.333" y="92.8" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="559.333" y="86.2667" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="565.867" y="223.467" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="565.867" y="216.933" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="565.867" y="210.4" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="565.867" y="203.867" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="565.867" y="197.333" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="565.867" y="190.8" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="565.867" y="184.267" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="565.867" y="177.733" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="565.867" y="171.2" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="565.867" y="164.667" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="565.867" y="158.133" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="565.867" y="151.6" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="565.867" y="145.067" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="565.867" y="138.533" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="565.867" y="132" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="565.867" y="125.467" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="565.867" y="118.933" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="565.867" y="112.4" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="565.867" y="105.867" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="565.867" y="99.3333" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="565.867" y="92.8" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="565.867" y="86.2667" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="572.4" y="223.467" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="572.4" y="216.933" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="572.4" y="210.4" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="572.4" y="203.867" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="572.4" y="197.333" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="572.4" y="190.8" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="572.4" y="184.267" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="572.4" y="177.733" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="572.4" y="171.2" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="572.4" y="164.667" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="572.4" y="158.133" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="572.4" y="151.6" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="572.4" y="145.067" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="572.4" y="138.533" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="572.4" y="132" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="572.4" y="125.467" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="572.4" y="118.933" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="572.4" y="112.4" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="572.4" y="105.867" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="572.4" y="99.3333" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="572.4" y="92.8" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="572.4" y="86.2667" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="578.933" y="223.467" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="578.933" y="216.933" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="578.933" y="210.4" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="578.933" y="203.867" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="578.933" y="197.333" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="578.933" y="190.8" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="578.933" y="184.267" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="578.933" y="177.733" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="578.933" y="171.2" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="578.933" y="164.667" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="578.933" y="158.133" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="578.933" y="151.6" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="578.933" y="145.067" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="578.933" y="138.533" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="578.933" y="132" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="578.933" y="125.467" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="578.933" y="118.933" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="578.933" y="112.4" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="578.933" y="105.867" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="578.933" y="99.3333" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="578.933" y="92.8" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="578.933" y="86.2667" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="585.467" y="223.467" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="585.467" y="216.933" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="585.467" y="210.4" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="585.467" y="203.867" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="585.467" y="197.333" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="585.467" y="190.8" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="585.467" y="184.267" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="585.467" y="177.733" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="585.467" y="171.2" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="585.467" y="164.667" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="585.467" y="158.133" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="585.467" y="151.6" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="585.467" y="145.067" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="585.467" y="138.533" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="585.467" y="132" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="585.467" y="125.467" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="585.467" y="118.933" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="585.467" y="112.4" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="585.467" y="105.867" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="585.467" y="99.3333" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="585.467" y="92.8" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="585.467" y="86.2667" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="592" y="223.467" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="592" y="216.933" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="592" y="210.4" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="592" y="203.867" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="592" y="197.333" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="592" y="190.8" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="592" y="184.267" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="592" y="177.733" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="592" y="171.2" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="592" y="164.667" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="592" y="158.133" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="592" y="151.6" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="592" y="145.067" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="592" y="138.533" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="592" y="132" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="592" y="125.467" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="592" y="118.933" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="592" y="112.4" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="592" y="105.867" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="592" y="99.3333" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="592" y="92.8" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="592" y="86.2667" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="598.533" y="223.467" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="598.533" y="216.933" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="598.533" y="210.4" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="598.533" y="203.867" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="598.533" y="197.333" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="598.533" y="190.8" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="598.533" y="184.267" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="598.533" y="177.733" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="598.533" y="171.2" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="598.533" y="164.667" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="598.533" y="158.133" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="598.533" y="151.6" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="598.533" y="145.067" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="598.533" y="138.533" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="598.533" y="132" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="598.533" y="125.467" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="598.533" y="118.933" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="598.533" y="112.4" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="598.533" y="105.867" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="598.533" y="99.3333" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="598.533" y="92.8" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="598.533" y="86.2667" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="605.067" y="223.467" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="605.067" y="216.933" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="605.067" y="210.4" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="605.067" y="203.867" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="605.067" y="197.333" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="605.067" y="190.8" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="605.067" y="184.267" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="605.067" y="177.733" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="605.067" y="171.2" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="605.067" y="164.667" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="605.067" y="158.133" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="605.067" y="151.6" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="605.067" y="145.067" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="605.067" y="138.533" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="605.067" y="132" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="605.067" y="125.467" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="605.067" y="118.933" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="605.067" y="112.4" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="605.067" y="105.867" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="605.067" y="99.3333" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="605.067" y="92.8" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="605.067" y="86.2667" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="611.6" y="223.467" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="611.6" y="216.933" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="611.6" y="210.4" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="611.6" y="203.867" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="611.6" y="197.333" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="611.6" y="190.8" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="611.6" y="184.267" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="611.6" y="177.733" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="611.6" y="171.2" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="611.6" y="164.667" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="611.6" y="158.133" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="611.6" y="151.6" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="611.6" y="145.067" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="611.6" y="138.533" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="611.6" y="132" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="611.6" y="125.467" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="611.6" y="118.933" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="611.6" y="112.4" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="611.6" y="105.867" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="611.6" y="99.3333" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="611.6" y="92.8" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="611.6" y="86.2667" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="618.133" y="223.467" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="618.133" y="216.933" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="618.133" y="210.4" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="618.133" y="203.867" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="618.133" y="197.333" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="618.133" y="190.8" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="618.133" y="184.267" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="618.133" y="177.733" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="618.133" y="171.2" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="618.133" y="164.667" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="618.133" y="158.133" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="618.133" y="151.6" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="618.133" y="145.067" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="618.133" y="138.533" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="618.133" y="132" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="618.133" y="125.467" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="618.133" y="118.933" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="618.133" y="112.4" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="618.133" y="105.867" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="618.133" y="99.3333" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="618.133" y="92.8" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="618.133" y="86.2667" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="624.667" y="223.467" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="624.667" y="216.933" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="624.667" y="210.4" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="624.667" y="203.867" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="624.667" y="197.333" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="624.667" y="190.8" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="624.667" y="184.267" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="624.667" y="177.733" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="624.667" y="171.2" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="624.667" y="164.667" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="624.667" y="158.133" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="624.667" y="151.6" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="624.667" y="145.067" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="624.667" y="138.533" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="624.667" y="132" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="624.667" y="125.467" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="624.667" y="118.933" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="624.667" y="112.4" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="624.667" y="105.867" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="624.667" y="99.3333" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="624.667" y="92.8" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="624.667" y="86.2667" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="631.2" y="223.467" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="631.2" y="216.933" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="631.2" y="210.4" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="631.2" y="203.867" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="631.2" y="197.333" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="631.2" y="190.8" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="631.2" y="184.267" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="631.2" y="177.733" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="631.2" y="171.2" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="631.2" y="164.667" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="631.2" y="158.133" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="631.2" y="151.6" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="631.2" y="145.067" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="631.2" y="138.533" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="631.2" y="132" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="631.2" y="125.467" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="631.2" y="118.933" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="631.2" y="112.4" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="631.2" y="105.867" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="631.2" y="99.3333" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="631.2" y="92.8" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sG" x="631.2" y="86.2667" width="6.83333" height="6.83333" rx="0" opacity=".55"/>
<rect class="sN" x="494" y="34" width="196" height="196" rx="0" style="fill:none"/>
<circle class="sP" cx="538.4" cy="41.4" r="3"/>
<circle class="sP" cx="510.7" cy="181.5" r="3"/>
<circle class="sP" cx="689.8" cy="189.0" r="3"/>
<circle class="sPg" cx="582.8" cy="133.0" r="3"/>
<circle class="sP" cx="531.7" cy="67.2" r="3"/>
<circle class="sP" cx="497.9" cy="177.7" r="3"/>
<circle class="sP" cx="573.9" cy="53.2" r="3"/>
<circle class="sP" cx="544.6" cy="35.6" r="3"/>
<circle class="sP" cx="506.4" cy="108.4" r="3"/>
<circle class="sPg" cx="560.3" cy="94.5" r="3"/>
<circle class="sPg" cx="591.5" cy="102.7" r="3"/>
<circle class="sP" cx="521.9" cy="217.4" r="3"/>
<circle class="sP" cx="679.4" cy="134.2" r="3"/>
<circle class="sPg" cx="607.5" cy="87.1" r="3"/>
<circle class="sP" cx="666.7" cy="174.0" r="3"/>
<circle class="sP" cx="520.5" cy="80.2" r="3"/>
<circle class="sP" cx="513.1" cy="94.7" r="3"/>
<circle class="sP" cx="659.3" cy="131.3" r="3"/>
<circle class="sP" cx="532.7" cy="200.6" r="3"/>
<circle class="sP" cx="508.0" cy="53.0" r="3"/>
<circle class="sPg" cx="593.5" cy="92.5" r="3"/>
<circle class="sP" cx="496.3" cy="162.7" r="3"/>
<circle class="sPg" cx="546.3" cy="147.0" r="3"/>
<circle class="sP" cx="668.7" cy="195.7" r="3"/>
<circle class="sP" cx="571.7" cy="197.4" r="3"/>
<circle class="sP" cx="533.6" cy="79.8" r="3"/>
<circle class="sP" cx="552.8" cy="227.4" r="3"/>
<circle class="sP" cx="527.4" cy="144.6" r="3"/>
<circle class="sP" cx="539.4" cy="149.6" r="3"/>
<circle class="sPg" cx="609.3" cy="173.4" r="3"/>
<circle class="sP" cx="512.6" cy="213.3" r="3"/>
<circle class="sP" cx="564.6" cy="71.7" r="3"/>
<circle class="sPg" cx="593.0" cy="91.2" r="3"/>
<circle class="sP" cx="497.3" cy="202.5" r="3"/>
<circle class="sPg" cx="569.7" cy="117.6" r="3"/>
<circle class="sP" cx="683.1" cy="229.4" r="3"/>
<circle class="sP" cx="657.8" cy="188.8" r="3"/>
<circle class="sP" cx="683.2" cy="81.2" r="3"/>
<circle class="sP" cx="688.1" cy="116.3" r="3"/>
<circle class="sP" cx="580.5" cy="213.7" r="3"/>
<circle class="sPg" cx="612.7" cy="132.5" r="3"/>
<circle class="sP" cx="517.9" cy="116.2" r="3"/>
<circle class="sP" cx="582.7" cy="205.2" r="3"/>
<circle class="sPg" cx="634.2" cy="137.6" r="3"/>
<circle class="sPg" cx="571.2" cy="159.3" r="3"/>
<circle class="sP" cx="581.5" cy="208.8" r="3"/>
<circle class="sP" cx="636.1" cy="91.2" r="3"/>
<circle class="sPg" cx="565.4" cy="145.2" r="3"/>
<circle class="sP" cx="512.3" cy="40.3" r="3"/>
<circle class="sP" cx="632.2" cy="190.7" r="3"/>
<circle class="sPg" cx="539.0" cy="127.0" r="3"/>
<circle class="sP" cx="495.3" cy="109.8" r="3"/>
<circle class="sP" cx="672.1" cy="84.3" r="3"/>
<circle class="sP" cx="537.8" cy="171.9" r="3"/>
<circle class="sP" cx="601.3" cy="38.5" r="3"/>
<circle class="sP" cx="660.7" cy="128.8" r="3"/>
<circle class="sP" cx="616.5" cy="42.4" r="3"/>
<circle class="sP" cx="659.8" cy="191.6" r="3"/>
<circle class="sP" cx="566.5" cy="42.1" r="3"/>
<circle class="sPg" cx="550.9" cy="109.8" r="3"/>
<circle class="sP" cx="659.2" cy="95.9" r="3"/>
<circle class="sP" cx="654.9" cy="111.4" r="3"/>
<circle class="sPg" cx="565.0" cy="146.2" r="3"/>
<circle class="sP" cx="658.3" cy="177.3" r="3"/>
<circle class="sP" cx="507.5" cy="86.3" r="3"/>
<circle class="sP" cx="516.9" cy="67.5" r="3"/>
<circle class="sPg" cx="547.7" cy="172.8" r="3"/>
<circle class="sP" cx="548.4" cy="55.9" r="3"/>
<circle class="sPg" cx="574.7" cy="159.2" r="3"/>
<circle class="sP" cx="640.5" cy="181.0" r="3"/>
<text class="sT" x="592" y="24" text-anchor="middle">decision tree, depth 3</text><text class="sS" x="592" y="246" text-anchor="middle">axis-aligned boxes</text><text class="sS" x="592" y="261" text-anchor="middle">train accuracy 90%</text>
</svg><figcaption>Three models, three shapes of boundary. Shaded cells are predicted positive. Each model was fitted on these 70 points.</figcaption></figure>

### Logistic Regression

**Despite the name, it is a classifier.** The mechanism:

1. Compute a linear score, exactly as in linear regression: `z = w·x + b`.
2. Squash it into (0, 1) with the **sigmoid**: `σ(z) = 1 / (1 + e^(−z))`.
3. Interpret the result as `P(y = 1 | x)`.
4. Threshold at 0.5 to get a class.

**Why the sigmoid rather than just clipping a linear output?** Because it is smooth and differentiable (so gradient descent works), it maps ℝ → (0,1) monotonically, and it gives `z` a clean interpretation: `z` is the **log-odds**, `log(p/(1−p))`. That makes the coefficients meaningful — `exp(wᵢ)` is the **odds ratio** for a one-unit change in feature i. This is why logistic regression remains standard in medicine and credit scoring, where someone must be able to explain the decision.

**The loss** is log-loss / binary cross-entropy, not MSE:

> **L = −(1/n) Σ [ yᵢ log(ŷᵢ) + (1 − yᵢ) log(1 − ŷᵢ) ]**

MSE with a sigmoid gives a non-convex surface with flat regions where gradients vanish. Cross-entropy is convex in the parameters and its gradient stays healthy when the model is confidently wrong — which is exactly when you need a strong correction signal.

<figure class="dia"><svg viewBox="0 0 720 246" role="img" aria-label="Loss against predicted probability when the true class is 1: log-loss rises without bound as the prediction approaches 0, while squared error never exceeds 1; at p equal 0.01 the log-loss gradient is about minus 1 but the squared-error gradient through the sigmoid is almost 0">
<polyline class="sLg" points="72.0,30.0 74.0,43.4 76.0,57.2 78.0,67.0 80.0,74.6 82.0,80.8 84.0,86.0 86.0,90.6 88.0,94.6 90.0,98.1 92.0,101.4 94.0,104.3 96.0,107.1 98.0,109.6 100.0,111.9 102.0,114.1 104.0,116.2 106.0,118.1 108.0,120.0 110.0,121.7 112.0,123.4 114.0,125.0 116.0,126.5 118.0,127.9 120.0,129.3 122.0,130.6 124.0,131.9 126.0,133.2 128.0,134.3 130.0,135.5 132.0,136.6 134.0,137.7 136.0,138.7 138.0,139.8 140.0,140.7 142.0,141.7 144.0,142.6 146.0,143.5 148.0,144.4 150.0,145.3 152.0,146.1 154.0,146.9 156.0,147.7 158.0,148.5 160.0,149.3 162.0,150.0 164.0,150.8 166.0,151.5 168.0,152.2 170.0,152.9 172.0,153.5 174.0,154.2 176.0,154.8 178.0,155.5 180.0,156.1 182.0,156.7 184.0,157.3 186.0,157.9 188.0,158.5 190.0,159.1 192.0,159.6 194.0,160.2 196.0,160.7 198.0,161.3 200.0,161.8 202.0,162.3 204.0,162.8 206.0,163.3 208.0,163.8 210.0,164.3 212.0,164.8 214.0,165.3 216.0,165.7 218.0,166.2 220.0,166.7 222.0,167.1 224.0,167.5 226.0,168.0 228.0,168.4 230.0,168.8 232.0,169.3 234.0,169.7 236.0,170.1 238.0,170.5 240.0,170.9 242.0,171.3 244.0,171.7 246.0,172.1 248.0,172.5 250.0,172.9 252.0,173.2 254.0,173.6 256.0,174.0 258.0,174.3 260.0,174.7 262.0,175.0 264.0,175.4 266.0,175.7 268.0,176.1 270.0,176.4 272.0,176.8 274.0,177.1 276.0,177.4 278.0,177.8 280.0,178.1 282.0,178.4 284.0,178.7 286.0,179.0 288.0,179.4 290.0,179.7 292.0,180.0 294.0,180.3 296.0,180.6 298.0,180.9 300.0,181.2 302.0,181.5 304.0,181.8 306.0,182.1 308.0,182.3 310.0,182.6 312.0,182.9 314.0,183.2 316.0,183.5 318.0,183.7 320.0,184.0 322.0,184.3 324.0,184.6 326.0,184.8 328.0,185.1 330.0,185.4 332.0,185.6 334.0,185.9 336.0,186.1 338.0,186.4 340.0,186.6 342.0,186.9 344.0,187.1 346.0,187.4 348.0,187.6 350.0,187.9 352.0,188.1 354.0,188.4 356.0,188.6 358.0,188.8 360.0,189.1 362.0,189.3 364.0,189.5 366.0,189.8 368.0,190.0 370.0,190.2 372.0,190.4 374.0,190.7 376.0,190.9 378.0,191.1 380.0,191.3 382.0,191.6 384.0,191.8 386.0,192.0 388.0,192.2 390.0,192.4 392.0,192.6 394.0,192.8 396.0,193.0 398.0,193.3 400.0,193.5 402.0,193.7 404.0,193.9 406.0,194.1 408.0,194.3 410.0,194.5 412.0,194.7 414.0,194.9 416.0,195.1 418.0,195.3 420.0,195.5 422.0,195.7 424.0,195.8 426.0,196.0 428.0,196.2 430.0,196.4 432.0,196.6 434.0,196.8 436.0,197.0 438.0,197.2 440.0,197.3 442.0,197.5 444.0,197.7 446.0,197.9 448.0,198.1 450.0,198.3 452.0,198.4 454.0,198.6 456.0,198.8 458.0,199.0 460.0,199.1 462.0,199.3 464.0,199.5 466.0,199.7 468.0,199.8 470.0,200.0" style="stroke-width:2.4"/>
<polyline class="sLr" points="70.0,166.0 72.0,166.3 74.0,166.7 76.0,167.0 78.0,167.3 80.0,167.7 82.0,168.0 84.0,168.3 86.0,168.7 88.0,169.0 90.0,169.3 92.0,169.6 94.0,170.0 96.0,170.3 98.0,170.6 100.0,170.9 102.0,171.2 104.0,171.5 106.0,171.8 108.0,172.2 110.0,172.5 112.0,172.8 114.0,173.1 116.0,173.4 118.0,173.7 120.0,174.0 122.0,174.3 124.0,174.6 126.0,174.9 128.0,175.1 130.0,175.4 132.0,175.7 134.0,176.0 136.0,176.3 138.0,176.6 140.0,176.9 142.0,177.1 144.0,177.4 146.0,177.7 148.0,178.0 150.0,178.2 152.0,178.5 154.0,178.8 156.0,179.0 158.0,179.3 160.0,179.6 162.0,179.8 164.0,180.1 166.0,180.4 168.0,180.6 170.0,180.9 172.0,181.1 174.0,181.4 176.0,181.6 178.0,181.9 180.0,182.1 182.0,182.4 184.0,182.6 186.0,182.9 188.0,183.1 190.0,183.3 192.0,183.6 194.0,183.8 196.0,184.0 198.0,184.3 200.0,184.5 202.0,184.7 204.0,185.0 206.0,185.2 208.0,185.4 210.0,185.6 212.0,185.9 214.0,186.1 216.0,186.3 218.0,186.5 220.0,186.7 222.0,186.9 224.0,187.1 226.0,187.3 228.0,187.6 230.0,187.8 232.0,188.0 234.0,188.2 236.0,188.4 238.0,188.6 240.0,188.8 242.0,189.0 244.0,189.1 246.0,189.3 248.0,189.5 250.0,189.7 252.0,189.9 254.0,190.1 256.0,190.3 258.0,190.4 260.0,190.6 262.0,190.8 264.0,191.0 266.0,191.2 268.0,191.3 270.0,191.5 272.0,191.7 274.0,191.8 276.0,192.0 278.0,192.2 280.0,192.3 282.0,192.5 284.0,192.6 286.0,192.8 288.0,193.0 290.0,193.1 292.0,193.3 294.0,193.4 296.0,193.6 298.0,193.7 300.0,193.9 302.0,194.0 304.0,194.1 306.0,194.3 308.0,194.4 310.0,194.6 312.0,194.7 314.0,194.8 316.0,195.0 318.0,195.1 320.0,195.2 322.0,195.3 324.0,195.5 326.0,195.6 328.0,195.7 330.0,195.8 332.0,196.0 334.0,196.1 336.0,196.2 338.0,196.3 340.0,196.4 342.0,196.5 344.0,196.6 346.0,196.7 348.0,196.8 350.0,196.9 352.0,197.0 354.0,197.1 356.0,197.2 358.0,197.3 360.0,197.4 362.0,197.5 364.0,197.6 366.0,197.7 368.0,197.8 370.0,197.9 372.0,198.0 374.0,198.0 376.0,198.1 378.0,198.2 380.0,198.3 382.0,198.4 384.0,198.4 386.0,198.5 388.0,198.6 390.0,198.6 392.0,198.7 394.0,198.8 396.0,198.8 398.0,198.9 400.0,199.0 402.0,199.0 404.0,199.1 406.0,199.1 408.0,199.2 410.0,199.2 412.0,199.3 414.0,199.3 416.0,199.4 418.0,199.4 420.0,199.5 422.0,199.5 424.0,199.6 426.0,199.6 428.0,199.6 430.0,199.7 432.0,199.7 434.0,199.7 436.0,199.8 438.0,199.8 440.0,199.8 442.0,199.8 444.0,199.9 446.0,199.9 448.0,199.9 450.0,199.9 452.0,199.9 454.0,199.9 456.0,200.0 458.0,200.0 460.0,200.0 462.0,200.0 464.0,200.0 466.0,200.0 468.0,200.0 470.0,200.0" style="stroke-width:2.4"/>
<line class="sLm" x1="70" y1="200" x2="480" y2="200"/><line class="sLm" x1="70" y1="200" x2="70" y2="24"/>
<text class="sS" x="70" y="216" text-anchor="middle">0</text>
<text class="sS" x="170" y="216" text-anchor="middle">0.25</text>
<text class="sS" x="270" y="216" text-anchor="middle">0.5</text>
<text class="sS" x="370" y="216" text-anchor="middle">0.75</text>
<text class="sS" x="470" y="216" text-anchor="middle">1</text>
<text class="sS" x="62" y="204" text-anchor="end">0</text>
<text class="sS" x="62" y="170" text-anchor="end">1</text>
<text class="sS" x="62" y="136" text-anchor="end">2</text>
<text class="sS" x="62" y="102" text-anchor="end">3</text>
<text class="sS" x="62" y="68" text-anchor="end">4</text>
<text class="sS" x="62" y="34" text-anchor="end">5</text>
<text class="sC" x="275" y="234" text-anchor="middle">predicted P(y = 1) when the truth is y = 1</text>
<text class="sGt" x="94" y="40">−log p</text><text class="sRt" x="102" y="165.1">(1 − p)²</text>
<rect class="sN" x="500" y="40" width="206" height="150" rx="8"/><text class="sT" x="603" y="62" text-anchor="middle">confidently wrong: p = 0.01</text>
<text class="sGt" x="603" y="90" text-anchor="middle">log-loss 4.61</text><text class="sC" x="603" y="108" text-anchor="middle">gradient wrt z: -0.99</text>
<text class="sRt" x="603" y="140" text-anchor="middle">MSE 0.98</text><text class="sC" x="603" y="158" text-anchor="middle">gradient wrt z: -0.020</text>
<text class="sS" x="603" y="182" text-anchor="middle">the sigmoid flattens MSE's signal</text>
</svg><figcaption>Why classifiers train on cross-entropy: it punishes confident mistakes hardest, and its gradient stays alive exactly there. Computed.</figcaption></figure>

**`max_iter=1000`** — the default of 100 often fails to converge and prints a `ConvergenceWarning`. Raising it is the standard fix; if it still will not converge, your features are not scaled.

**Regularisation is on by default.** sklearn's `LogisticRegression` applies L2 with `C=1.0` unless told otherwise. `C` is the *inverse* strength — smaller `C` means stronger regularisation. This trips people up because it is backwards from `alpha` in `Ridge`.

### KNN Classifier

Identical mechanism to Part 7's regressor, but step 3 is a **majority vote** among the k neighbours rather than a mean. `predict_proba` returns the fraction of neighbours in each class — which means with k=5 the only possible probabilities are 0, 0.2, 0.4, 0.6, 0.8, 1. That coarse granularity makes KNN's ROC curve visibly step-like.

### Decision Tree

A tree recursively splits the feature space with axis-aligned cuts, choosing at each node the feature and threshold that best separates the classes.

**"Best" is measured by impurity:**

- **Gini impurity** (sklearn's default): `1 − Σ pᵢ²`. Zero when a node is pure.
- **Entropy**: `−Σ pᵢ log₂ pᵢ`. Very similar in practice; Gini is slightly cheaper.

At each node the algorithm evaluates every feature and every candidate threshold, and picks the split that maximises the reduction in impurity. This is **greedy** — locally optimal at each step, with no backtracking — which is why trees are fast and why they are not guaranteed to find the globally best tree.

**Properties worth knowing:**

| Property | Consequence |
|---|---|
| No scaling needed | "Is age > 30?" is unaffected by salary's units |
| Handles non-linearity and interactions natively | No manual feature crosses required |
| Fully interpretable | You can print the rules and read them |
| **Overfits ferociously if unconstrained** | A deep tree memorises the training set |
| High variance | Change a few rows and you get a different tree |

**The last two are why the tree is here.** An unconstrained `DecisionTreeClassifier` will typically show ~1.0 training accuracy and much lower test accuracy — a live demonstration of §6.4's overfitting row. Constrain it with `max_depth`, `min_samples_leaf`, `min_samples_split`, or `ccp_alpha` (cost-complexity pruning).

**And it is the building block for everything better.** Random Forests average many decorrelated trees to cancel their variance; gradient boosting fits trees sequentially to each other's residuals. Both appear in Part 13.

---

## 8.6 Cross-validation with classification metrics 🟢

```python
cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=RANDOM_STATE)

scoring = {
    "accuracy": "accuracy",
    "f1": "f1",
    "roc_auc": "roc_auc",
}
```

> CV gives more stable evaluation than one split. We use StratifiedKFold to preserve class ratios in each fold.

Three metrics, because each answers a different question and no single one is sufficient:

- **Accuracy** — intuitive, and misleading under imbalance.
- **F1** — balances precision and recall on the positive class.
- **ROC-AUC** — threshold-independent ranking quality.

---

## 8.7 Test evaluation 🟢 ⭐

> [!quote] 💬 Say it in the interview
> “I read the confusion matrix first, then precision and recall per class. Accuracy alone hides the minority class.”

```python
probas = {}

for name, pipe in models.items():
    pipe.fit(X_train, y_train)
    y_pred  = pipe.predict(X_test)
    y_proba = pipe.predict_proba(X_test)[:, 1]
    probas[name] = y_proba

    print(classification_report(y_test, y_pred))
    ConfusionMatrixDisplay.from_predictions(y_test, y_pred)
    print("ROC-AUC:", roc_auc_score(y_test, y_proba))
```

**`predict` vs `predict_proba`** — the distinction that unlocks threshold tuning:

- `predict(X)` → hard class labels, using a fixed 0.5 cut.
- `predict_proba(X)` → an `(n, 2)` array of class probabilities. `[:, 1]` takes the positive class.

**ROC-AUC requires probabilities, not labels.** Passing `y_pred` to `roc_auc_score` is a common bug — it computes AUC over two points and gives a meaningless number.

<figure class="dia"><svg viewBox="0 0 720 248" role="img" aria-label="Two ROC curves for the same 200-sample test set: computed from predicted probabilities it is a smooth curve with an AUC of 0.89, while computed from hard 0/1 labels it collapses to three points and an AUC of 0.82">
<rect class="sN" x="60" y="20" width="200" height="200" rx="0" style="fill:none"/><line class="sLm" x1="60" y1="220" x2="260" y2="20" stroke-dasharray="4 4"/>
<polyline class="sLg" points="60.0,220.0 60.0,217.9 60.0,156.1 61.9,156.1 61.9,135.5 63.9,135.5 63.9,119.0 67.8,119.0 67.8,116.9 69.7,116.9 69.7,102.5 71.7,102.5 71.7,100.4 73.6,100.4 73.6,98.4 75.5,98.4 75.5,96.3 79.4,96.3 79.4,94.2 81.4,94.2 81.4,79.8 85.2,79.8 85.2,77.7 87.2,77.7 87.2,69.5 89.1,69.5 89.1,65.4 93.0,65.4 93.0,55.1 96.9,55.1 96.9,53.0 98.8,53.0 98.8,46.8 126.0,46.8 126.0,44.7 129.9,44.7 129.9,42.7 133.8,42.7 133.8,40.6 149.3,40.6 149.3,38.6 153.2,38.6 153.2,36.5 157.1,36.5 157.1,30.3 159.0,30.3 159.0,24.1 195.9,24.1 195.9,22.1 207.6,22.1 207.6,20.0 260.0,20.0" style="stroke-width:2.4"/>
<polyline class="sLr" points="60.0,220.0 96.9,55.1 260.0,20.0" style="stroke-width:2.4"/>
<circle class="sPr" cx="96.9" cy="55.1" r="5"/>
<text class="sS" x="160" y="238" text-anchor="middle">false-positive rate →</text><text class="sS" x="46" y="120" text-anchor="end">TPR</text>
<rect class="sN" x="300" y="30" width="406" height="150" rx="8"/>
<text class="sGt" x="314" y="56">roc_auc_score(y, predict_proba(X)[:, 1]) = 0.891</text>
<text class="sS" x="314" y="76">every threshold traced: a full curve</text>
<text class="sRt" x="314" y="110">roc_auc_score(y, predict(X)) = 0.820</text>
<text class="sS" x="314" y="130">one threshold only: three points joined by straight lines</text>
<text class="sC" x="314" y="162">the label version understates this model by 0.071</text>
<text class="sS" x="480" y="214" text-anchor="middle">pass probabilities (or decision_function scores), never hard labels</text>
</svg><figcaption>The predict-instead-of-predict_proba bug, computed: the "curve" from labels is a single corner.</figcaption></figure>

### Reading a classification report

```
              precision    recall  f1-score   support
           0       0.96      0.94      0.95       103
           1       0.94      0.96      0.95        97
    accuracy                           0.95       200
   macro avg       0.95      0.95      0.95       200
weighted avg       0.95      0.95      0.95       200
```

- One row per class. **Look at both rows** — a model can be excellent on class 0 and useless on class 1, and the accuracy line will hide it.
- **`support`** is the number of true instances of each class. It tells you how much to trust that row: precision computed from 6 examples means little.
- **macro avg** = unweighted mean across classes. **weighted avg** = weighted by support. The gap between them measures how much the majority class is carrying your score.

### The confusion matrix

```
              Predicted
              Neg    Pos
Actual Neg  [ TN     FP ]
       Pos  [ FN     TP ]
```

**Always plot it.** The aggregate metrics compress four numbers into one; the matrix shows you *which* errors you are making, and the two error types usually have very different costs. See §6.6 for precision/recall trade-offs.

---

## 8.8 The ROC curve 🟢 ⭐

> [!info] 📖 Géron Ch. 3 · “The ROC Curve” · pp. 120–124

![One model, three views: threshold trade-off, ROC curve and precision–recall curve (10% positives).](figures/fig08_threshold_roc_pr.png)
*One model, three views: threshold trade-off, ROC curve and precision–recall curve (10% positives).*

> [!quote] 💬 Say it in the interview
> “ROC plots TPR against FPR across thresholds; AUC is the probability that a random positive scores higher than a random negative. With rare positives I prefer the PR curve.”

```python
plt.figure(figsize=(6, 5))
for name, y_proba in probas.items():
    fpr, tpr, _ = roc_curve(y_test, y_proba)
    plt.plot(fpr, tpr, label=f"{name} (AUC={roc_auc_score(y_test, y_proba):.3f})")
plt.plot([0, 1], [0, 1], "k--", label="Chance")
plt.xlabel("False Positive Rate"); plt.ylabel("True Positive Rate")
plt.legend(); plt.show()
```

**How to read it.** Each point on the curve corresponds to one decision threshold:

- Threshold 1.0 → nothing predicted positive → bottom-left (0, 0).
- Threshold 0.0 → everything positive → top-right (1, 1).
- Sweeping between traces the curve.

The diagonal is random guessing. **Up and to the left is better.** A curve that hugs the top-left corner means you can achieve a high true-positive rate while keeping false positives low.

Plotting all models on one axis is the right way to compare them — a single AUC number hides where in the threshold range a model is strong. Two models can share an AUC of 0.90 while one is better at high-precision operating points and the other at high-recall ones.

**Choosing the threshold.** The 0.5 default is a convention, not a result. If false negatives cost ten times false positives, pick the threshold that reflects that:

```python
from sklearn.metrics import precision_recall_curve
prec, rec, thresholds = precision_recall_curve(y_test, y_proba)
# choose the threshold where recall first exceeds your requirement
```

📌 **Under heavy imbalance, prefer the Precision-Recall curve to ROC.** ROC's false-positive rate has the (huge) negative class in its denominator, so it stays flatteringly low even when most of your positive predictions are wrong. The PR curve puts precision on the axis and tells the truth. The course notebooks skipped it, so §8.12.5 below covers it in full — it matters for the fraud-style problems you are most likely to meet.

---

## 8.9 Saving 🟢

```python
joblib.dump(best_pipe, "artifacts/best_classifier.joblib")

metrics = {"model": best_name, "accuracy": acc, "f1": f1, "roc_auc": auc}
with open("artifacts/metrics.json", "w") as f:
    json.dump(metrics, f, indent=2)
```

Same as Part 7. Saving `metrics.json` alongside the model is a small habit with a large payoff: six months later you can answer "was this the version that scored 0.94?" without retraining.

---

## 8.10 The reusable template 🟢

This is what to lift for any binary classification problem:

```
 1. Load, check duplicates / nulls / dtypes
 2. CHECK CLASS BALANCE                       ← determines everything downstream
 3. EDA — numeric distributions, target relationships
 4. Feature engineering — datetime parts, text length, Top-N categories
 5. Drop raw columns replaced by engineered ones; drop identifiers
 6. train_test_split(..., stratify=y)
 7. ColumnTransformer(numeric_pipe, categorical_pipe)
 8. DummyClassifier baseline                  ← add this; the template omits it
 9. Several model pipelines in a dict
10. cross_validate with StratifiedKFold, multiple metrics
11. Test: classification_report + confusion matrix + ROC-AUC
12. ROC curves for all models on one axis
13. joblib.dump(pipeline) + metrics.json
```

Steps 2, 6 and 10 are the classification-specific ones. Everything else carries over from Part 7.

---

## 8.11 Models the course did not reach 🟢

Worth knowing they exist, because you will be asked:

| Model | One line |
|---|---|
| **Random Forest** | Many trees on bootstrapped samples and random feature subsets, averaged. Kills the single tree's variance. Appears in the capstone. |
| **Gradient Boosting / XGBoost / LightGBM** | Trees fitted sequentially to previous errors. **The default winner on tabular data.** |
| **SVM** | Finds the maximum-margin separating boundary; kernels give non-linearity. Strong on small, clean, high-dimensional data. |
| **Naive Bayes** | Assumes feature independence given the class. Absurd assumption, works remarkably well for text (Part 10). Very fast. |

**Practical advice:** for a new tabular classification problem, run a logistic regression for the baseline and interpretability, then a `HistGradientBoostingClassifier` or LightGBM for performance. That two-model pair covers most of the useful ground.

Random Forests, boosting and stacking now have their own part: **Part 8B — `08B_Trees_and_Ensembles.md`**. SVMs are covered in §8.16 below.

---

## 8.12 Classification in depth (Géron, Ch. 3) 🟢 ⭐

> [!info] 📖 Géron Ch. 3 · “MNIST” → “Multioutput Classification” · pp. 107–133

> [!quote] 💬 Say it in the interview
> “Precision = of those flagged, how many were right; recall = of all positives, how many we caught. The threshold trades one for the other, so I choose it from the business costs.”

> [!note] 📘 From the book
> Sections 8.12–8.16 add material from Géron's *Hands-On Machine Learning* (2025), Chapter 3 "Classification" and the logistic/softmax sections of Chapter 4. Classification metrics are the most frequently examined topic in entry and mid-level data science interviews. Know this section cold.

### 8.12.1 The accuracy trap, demonstrated

Géron trains an `SGDClassifier` to detect the digit **5** in MNIST (70,000 28×28 images, 784 pixel features). 3-fold CV accuracy: **95–96%**. Then:

```python
from sklearn.dummy import DummyClassifier
dummy_clf = DummyClassifier()                 # always predicts the most frequent class
cross_val_score(dummy_clf, X_train, y_train_5, cv=3, scoring="accuracy")
# array([0.90965, 0.90965, 0.90965])
```

A model that **never** predicts "5" is 91% accurate, because only ~10% of the images are 5s. His verdict: *"Beats Nostradamus."* On **skewed datasets**, accuracy says little. Churn (~2–5% per month in telecom), fraud (<1%) and default (~5%) are all skewed.

### 8.12.2 Honest predictions for the whole training set: `cross_val_predict`

To build a confusion matrix without touching the test set:

```python
from sklearn.model_selection import cross_val_predict
from sklearn.metrics import confusion_matrix

y_train_pred = cross_val_predict(sgd_clf, X_train, y_train_5, cv=3)
cm = confusion_matrix(y_train_5, y_train_pred)
# [[53892,   687],     ← actual non-5: TN, FP
#  [ 1891,  3530]]     ← actual 5:     FN, TP
```

`cross_val_predict` returns, for every training row, the prediction from the fold model that **did not see that row**: a clean, out-of-sample prediction. You will use it again for threshold tuning, error analysis and stacking.

**Convention:** rows are *actual* classes and columns are *predicted* classes. FP = Type I error (false alarm). FN = Type II error (miss).

Géron also shows how to write cross-validation by hand when you need custom control:

```python
from sklearn.model_selection import StratifiedKFold
from sklearn.base import clone

skfolds = StratifiedKFold(n_splits=3)
for train_idx, test_idx in skfolds.split(X_train, y_train_5):
    clone_clf = clone(sgd_clf)                      # fresh, unfitted copy per fold
    clone_clf.fit(X_train[train_idx], y_train_5[train_idx])
    y_pred = clone_clf.predict(X_train[test_idx])
    print((y_pred == y_train_5[test_idx]).mean())
```

### 8.12.3 Precision, recall, F1 — the numbers

For the 5-detector: **precision = 3530 / (3530 + 687) = 83.7%** and **recall = 3530 / (3530 + 1891) = 65.1%**. When it says "5" it is right 84% of the time, and it finds only 65% of the 5s. The 95% accuracy hid that.

F1 = harmonic mean = 2PR/(P+R) = TP / (TP + (FN+FP)/2) = **0.733**. The last form is worth remembering: F1 is TP divided by TP plus the *average* number of errors.

**Which one matters?** Géron's examples:
- **Kid-safe video filter:** high **precision**. Reject many good videos rather than let one bad video through, and add a human review.
- **Shoplifter detection:** high **recall**. 30% precision is fine if recall is 99%; guards just get extra alerts.
- **Medical screening:** high **recall**. Follow-up tests remove false positives.

**Telecom versions** you should be ready to argue:

| Use case | Costlier error | Optimise |
|---|---|---|
| Churn retention offer | Missing a churner (lost lifetime revenue) versus one wasted discount | Recall, within a campaign budget (precision@k) |
| Fraud / SIM-box detection that **blocks** lines | Blocking a genuine customer (complaints, regulatory risk) | Precision, with human review for borderline cases |
| Fraud detection that only **flags for review** | Missing fraud | Recall, limited by analyst capacity |
| Credit / BNPL / device-instalment approval | Approving a defaulter versus rejecting a good customer | Depends on margin; usually a cost matrix |
| Network fault prediction (dispatching engineers) | Unnecessary truck rolls versus outages | Cost-weighted; often precision |

### 8.12.4 The precision/recall trade-off and the decision threshold

A classifier computes a **score** for each instance (`decision_function()` or `predict_proba()`) and predicts positive when score > **threshold**. For `SGDClassifier` the threshold is 0; for `predict` on probability models it is 0.5.

- **Raise the threshold:** fewer positives, so precision usually rises and recall falls.
- **Lower the threshold:** more positives, so recall rises and precision falls.
- Recall can only fall as the threshold rises, so its curve is smooth. Precision can occasionally *drop* when the threshold rises (going from 4/5 to 3/4), so its curve is bumpy.

The standard procedure:

```python
from sklearn.metrics import precision_recall_curve

y_scores = cross_val_predict(sgd_clf, X_train, y_train_5, cv=3,
                             method="decision_function")     # or "predict_proba"[:, 1]
precisions, recalls, thresholds = precision_recall_curve(y_train_5, y_scores)

# lowest threshold that gives ≥ 90% precision
idx = (precisions >= 0.90).argmax()          # argmax on booleans = first True
threshold_90 = thresholds[idx]               # ≈ 3370
y_pred_90 = (y_scores >= threshold_90)
# precision 0.900, recall 0.480
```

Géron's tip: **if someone says "let's reach 99% precision", ask "at what recall?"** Any precision is achievable by raising the threshold; the question is what it costs in recall.

On a **precision-vs-recall plot**, look for the point just before precision starts falling sharply. For the 5-detector that is around 80% recall, so something like 60% recall is a sensible operating point.

**New in scikit-learn ≥ 1.5**, and worth mentioning:

```python
from sklearn.model_selection import FixedThresholdClassifier, TunedThresholdClassifierCV

fixed = FixedThresholdClassifier(model, threshold=0.3)      # probability threshold
tuned = TunedThresholdClassifierCV(model, scoring="f1")     # CV-optimised threshold
tuned.fit(X_train, y_train); tuned.best_threshold_
```

`TunedThresholdClassifierCV` optimises **balanced accuracy** by default (the mean of the per-class recalls). You can pass any metric, including a custom business-cost scorer built with `make_scorer`.

### 8.12.5 ROC vs PR — Géron's rule of thumb

The ROC curve plots **TPR (recall, sensitivity)** against **FPR (fall-out) = 1 − specificity (TNR)**. The random classifier is the diagonal, AUC = 0.5. A perfect one has AUC = 1.

> **Prefer the PR curve whenever the positive class is rare, or when you care more about false positives than false negatives. Otherwise use ROC.**

His demonstration: the SGD 5-detector has **ROC AUC 0.96**, which looks excellent. Its PR curve is visibly far from the top-right corner. The ROC looks good *because negatives dominate*, which keeps the FPR small.

Glossary to have instantly:

| Term | Formula | Also called |
|---|---|---|
| Recall | TP/(TP+FN) | Sensitivity, TPR, hit rate |
| Specificity | TN/(TN+FP) | TNR, selectivity |
| FPR | FP/(FP+TN) = 1 − specificity | Fall-out |
| Precision | TP/(TP+FP) | PPV |
| NPV | TN/(TN+FN) | — |
| Balanced accuracy | (TPR + TNR)/2 | Mean per-class recall |
| Average precision | Area under PR curve (step-wise) | PR-AUC |

📌 PR-AUC baseline: a random classifier's PR-AUC equals the **positive rate** (e.g. 0.02 for 2% churn), not 0.5. Always state it next to your PR-AUC.

### 8.12.6 Comparing models that have no `decision_function`

`RandomForestClassifier` exposes `predict_proba()` instead. Use the positive-class column as the score:

```python
y_probas_forest = cross_val_predict(forest_clf, X_train, y_train_5, cv=3,
                                    method="predict_proba")
y_scores_forest = y_probas_forest[:, 1]
# Random Forest: F1 0.927, ROC AUC 0.998, precision ≈ 99.0%, recall ≈ 87.3%
```

Every sklearn classifier has `decision_function()`, `predict_proba()` or both.

### 8.12.7 Calibration — "estimated probabilities, not actual probabilities"

![Calibration: a well-calibrated model's "70%" happens about 70% of the time.](figures/fig08_calibration.png)
*Calibration: a well-calibrated model's "70%" happens about 70% of the time.*

Géron's warning: among the images the forest gave a 50–60% probability of being a 5, **about 94% were actually 5s**. The model was badly *under*-confident. Models can be over-confident too.

**Why it matters:** whenever a probability becomes a *number someone uses* (expected loss = P(default) × exposure; expected revenue saved = P(churn) × CLV; risk tiers), it must be calibrated.

```python
from sklearn.calibration import CalibratedClassifierCV, CalibrationDisplay

cal = CalibratedClassifierCV(forest_clf, method="isotonic", cv=5)  # or "sigmoid" (Platt)
cal.fit(X_train, y_train)
CalibrationDisplay.from_estimator(cal, X_val, y_val, n_bins=10)    # reliability diagram
```

- **Platt / sigmoid:** fits a logistic curve to the scores. Good for small data and S-shaped distortion (SVMs, boosted trees).
- **Isotonic:** a non-parametric monotone fit. More flexible, needs more data (roughly >1,000 positives).
- Measure calibration with the **Brier score** (`brier_score_loss`, the MSE of the probabilities) or **log-loss**, plus the reliability diagram.
- Logistic regression is usually well calibrated out of the box. Naive Bayes, SVMs and boosted trees usually are not. Random forests tend to avoid extreme probabilities.
- ⚠️ Resampling (SMOTE, undersampling) and `class_weight` **distort** probabilities. If you rebalance, recalibrate on untouched validation data.

### 8.12.8 Multiclass strategies: OvR vs OvO

Some classifiers are **natively multiclass** (`LogisticRegression`, Random Forest, `GaussianNB`, KNN, trees). Others are strictly binary (`SGDClassifier`, `SVC`). Sklearn wraps binary ones automatically:

| Strategy | Models trained | Pros / cons | sklearn default for |
|---|---|---|---|
| **One-vs-Rest (OvR / OvA)** | N | Few models, each trained on all data | Most binary algorithms (`SGDClassifier`) |
| **One-vs-One (OvO)** | N(N−1)/2 (45 for 10 digits) | Each model sees only 2 classes' data, which is fast for algorithms that scale badly with n | `SVC` |

Force a strategy with `OneVsRestClassifier(...)` / `OneVsOneClassifier(...)`. After fitting, `clf.classes_` maps score columns to labels. Use `clf.classes_[scores.argmax()]`, never assume index = label.

<figure class="dia"><svg viewBox="0 0 720 246" role="img" aria-label="Multiclass with binary classifiers: one-vs-rest trains one model per class against all others; one-vs-one trains one model per pair of classes and takes a vote">
<text class="sT" x="176" y="22" text-anchor="middle">one-vs-rest: N models</text><text class="sT" x="540" y="22" text-anchor="middle">one-vs-one: N(N−1)/2 models</text>
<rect class="sA" x="30" y="40" width="70" height="36" rx="6"/><text class="sT" x="65" y="63" text-anchor="middle">cat</text><text class="sC" x="116" y="63" text-anchor="middle">vs</text><rect class="sN" x="132" y="40" width="190" height="36" rx="6"/><text class="sC" x="227" y="63" text-anchor="middle">all the others</text>
<rect class="sV" x="30" y="92" width="70" height="36" rx="6"/><text class="sT" x="65" y="115" text-anchor="middle">dog</text><text class="sC" x="116" y="115" text-anchor="middle">vs</text><rect class="sN" x="132" y="92" width="190" height="36" rx="6"/><text class="sC" x="227" y="115" text-anchor="middle">all the others</text>
<rect class="sG" x="30" y="144" width="70" height="36" rx="6"/><text class="sT" x="65" y="167" text-anchor="middle">fox</text><text class="sC" x="116" y="167" text-anchor="middle">vs</text><rect class="sN" x="132" y="144" width="190" height="36" rx="6"/><text class="sC" x="227" y="167" text-anchor="middle">all the others</text>
<rect class="sA" x="410" y="40" width="90" height="36" rx="6"/><text class="sT" x="455" y="63" text-anchor="middle">cat</text><text class="sC" x="520" y="63" text-anchor="middle">vs</text><rect class="sV" x="540" y="40" width="90" height="36" rx="6"/><text class="sT" x="585" y="63" text-anchor="middle">dog</text>
<rect class="sA" x="410" y="92" width="90" height="36" rx="6"/><text class="sT" x="455" y="115" text-anchor="middle">cat</text><text class="sC" x="520" y="115" text-anchor="middle">vs</text><rect class="sG" x="540" y="92" width="90" height="36" rx="6"/><text class="sT" x="585" y="115" text-anchor="middle">fox</text>
<rect class="sV" x="410" y="144" width="90" height="36" rx="6"/><text class="sT" x="455" y="167" text-anchor="middle">dog</text><text class="sC" x="520" y="167" text-anchor="middle">vs</text><rect class="sG" x="540" y="144" width="90" height="36" rx="6"/><text class="sT" x="585" y="167" text-anchor="middle">fox</text>
<text class="sC" x="176" y="210" text-anchor="middle">pick the class whose model is most confident</text><text class="sC" x="540" y="210" text-anchor="middle">each model votes; most votes wins</text>
<text class="sS" x="360" y="234" text-anchor="middle">10 digits: 10 models (OvR) vs 45 models on smaller datasets (OvO, scikit-learn's choice for SVC)</text>
</svg><figcaption>Two ways to make a binary classifier handle many classes.</figcaption></figure>

Géron's multiclass SGD gets ~86–87% CV accuracy on MNIST, and **simply adding `StandardScaler` lifts it to ~89–90%**. Scaling matters for linear gradient-based models.

### 8.12.9 Error analysis — how to actually improve a classifier

```python
from sklearn.metrics import ConfusionMatrixDisplay

y_train_pred = cross_val_predict(sgd_clf, X_train_scaled, y_train, cv=3)

ConfusionMatrixDisplay.from_predictions(y_train, y_train_pred,
                                        normalize="true", values_format=".0%")

sample_weight = (y_train_pred != y_train)          # hide the correct predictions
ConfusionMatrixDisplay.from_predictions(y_train, y_train_pred,
                                        sample_weight=sample_weight,
                                        normalize="true", values_format=".0%")
```

How to read it:
1. **Normalise by row (`normalize="true"`).** Otherwise a class looks bad just because it is frequent. Géron: only 82% of 5s were classified correctly, and 10% of 5s were called 8s.
2. **Confusion matrices are not symmetric.** 10% of 5s became 8s, but only 2% of 8s became 5s.
3. **Zero out the diagonal** to make the error pattern stand out. The bright "8" column shows that many digits are misclassified as 8.
4. **`normalize="pred"`** (by column) answers a different question: "of everything predicted as 9, what were they really?"
5. **Look at the individual misclassified examples.** Some would fool a human. Many are obvious to us but not to a *linear* model, which only weighs pixels. That tells you the model family is the limit.

The fixes error analysis suggests:
- **Collect more data** for the confusable cases (digits that look like 8 but aren't).
- **Engineer a feature** for the distinction (count closed loops: 8 has two, 6 has one, 5 has none).
- **Preprocess** to normalise the nuisance variation (centre and de-rotate images).
- **Data augmentation:** add shifted/rotated copies so the model becomes invariant (Exercise 2 of the chapter).

**Telecom analogue:** a complaint-category classifier confuses "billing dispute" with "unexpected charges". The row-normalised matrix shows which pairs; reading 30 examples shows whether the labels are inconsistent (a data problem) or the features are missing (e.g. the bill amount delta).

### 8.12.10 Multilabel and multioutput classification

| Type | Output per instance | Example | sklearn |
|---|---|---|---|
| Binary | 1 label, 2 classes | Churn yes/no | any classifier |
| Multiclass | 1 label, K classes | Complaint category | any (natively or via OvR/OvO) |
| **Multilabel** | Several **binary** labels | Customer interested in {data, roaming, TV, fintech} | `KNeighborsClassifier`, trees/forests natively; `MultiOutputClassifier`; **`ClassifierChain`** |
| **Multioutput–multiclass** | Several labels, each multiclass | Denoising: one 0–255 value per pixel | `KNeighborsClassifier`, `MultiOutputClassifier` |

- **Evaluating multilabel:** compute a metric per label and average. `average="macro"` treats labels equally; `average="weighted"` weights by support.
- **`ClassifierChain`** feeds earlier labels' predictions as features to later models, capturing label dependencies (a "large" digit is twice as likely to be odd). With `cv=3` it trains on out-of-sample predictions rather than true labels, which avoids leakage. Chain order affects results.
- Géron notes the line between classification and regression blurs here: predicting a pixel intensity is arguably regression.

---

## 8.13 Logistic regression, the full derivation (Géron, Ch. 4) 🟡 ⭐

> [!info] 📖 Géron Ch. 4 · “Logistic Regression”, “Softmax Regression” · pp. 167–177

![The sigmoid maps log-odds to probabilities; log loss punishes confident mistakes.](figures/fig08_sigmoid_logloss.png)
*The sigmoid maps log-odds to probabilities; log loss punishes confident mistakes.*

> [!quote] 💬 Say it in the interview
> “Logistic regression models the log-odds as a linear function, maps them through the sigmoid and trains with log-loss, which is convex. exp(coefficient) is an odds ratio.”

### Estimating probabilities

> **p̂ = σ(θᵀx)**  with  **σ(t) = 1 / (1 + e⁻ᵗ)**

Predict class 1 when p̂ ≥ 0.5, which is equivalent to **θᵀx ≥ 0**. The **decision boundary is linear**: the set of points where θᵀx = 0.

The score t = θᵀx is the **logit**. It equals **log(p/(1−p))**, the log-odds, because the logit function is the inverse of the sigmoid. This is why logistic coefficients are read as **log-odds ratios**, and exp(θⱼ) as the multiplicative change in odds per unit of xⱼ.

### The cost function, and why it is shaped that way

For one instance:

> **c(θ) = −log(p̂)**  if y = 1;  **−log(1 − p̂)**  if y = 0

−log(t) grows very large as t → 0. A confident wrong prediction (p̂ ≈ 0 for a true positive) is punished heavily; a confident correct one costs ≈ 0. Averaged over the training set, this gives **log loss**:

> **J(θ) = −(1/m) Σ [ y⁽ⁱ⁾ log p̂⁽ⁱ⁾ + (1 − y⁽ⁱ⁾) log(1 − p̂⁽ⁱ⁾) ]**

**Facts to state in an interview:**
- There is **no closed-form solution** (no normal equation), unlike linear regression.
- The cost is **convex**, so gradient descent finds the global minimum given a suitable learning rate.
- Log loss is what you get from **maximum likelihood estimation** when you assume a Bernoulli distribution for y given x. Minimising log loss = maximising the likelihood.
- The gradient has the same form as linear regression's: **∂J/∂θⱼ = (1/m) Σ (σ(θᵀx⁽ⁱ⁾) − y⁽ⁱ⁾) xⱼ⁽ⁱ⁾** (prediction error × feature, averaged).

### Géron's iris example, as intuition

Predict *Iris virginica* from petal width alone. The estimated probability crosses 50% at about **1.65 cm**, which is the decision boundary. Between ~1.4 and ~2.5 cm the classes overlap and the model is unsure. Outside that range it is confident. With two features (petal length and width) the boundary is a straight line, and the lines of equal probability (15%, 50%, 90%) run parallel to it.

### Regularisation in `LogisticRegression`

- ℓ₂ by default. The strength is set by **`C` = inverse of α**. **Higher C = less regularisation.** This is the reverse of Ridge's `alpha`.
- `penalty="l1"` (with `solver="liblinear"` or `"saga"`) gives sparse coefficients, which is embedded feature selection. `penalty="elasticnet"` with `l1_ratio` requires `solver="saga"`.
- Scale features first; the penalty depends on scale.

### Softmax regression (multinomial logistic regression)

For K classes, one parameter vector θ⁽ᵏ⁾ per class. Scores **sₖ(x) = (θ⁽ᵏ⁾)ᵀx**, then:

> **p̂ₖ = exp(sₖ(x)) / Σⱼ exp(sⱼ(x))**   (the softmax function)

Predict **argmaxₖ p̂ₖ**, which is the same as argmax of the scores. Softmax outputs one class at a time: it is **multiclass, not multilabel**. Use it for mutually exclusive classes only.

Its cost is **cross-entropy**:

> **J(Θ) = −(1/m) Σᵢ Σₖ yₖ⁽ⁱ⁾ log p̂ₖ⁽ⁱ⁾**

With K = 2 it reduces exactly to log loss. Cross-entropy comes from information theory: it is the average number of bits needed to encode events drawn from the true distribution using a code optimised for the predicted distribution. It equals the true entropy only when the predictions are perfect. The gap is the **KL divergence**.

In current sklearn, `LogisticRegression` uses the multinomial (softmax) formulation automatically for multiclass targets with the default `lbfgs` solver. The old `multi_class=` argument is deprecated (the capstone's `multi_class="multinomial"` is that deprecation). Softmax decision boundaries between any two classes are linear.

---

## 8.14 Choosing and reading classification metrics — the cheat sheet 🟢 ⭐

> [!info] 📖 Géron Ch. 3 · “Performance Measures” · pp. 111–124

> [!quote] 💬 Say it in the interview
> “Churn retention: recall at a precision the budget can afford. Fraud blocking: precision first. Fraud review: precision@k at analyst capacity. Heavy imbalance: PR-AUC over ROC-AUC.”

| Situation | Primary metric | Also report |
|---|---|---|
| Balanced classes, symmetric costs | Accuracy | F1, confusion matrix |
| Imbalanced, positive class matters | **PR-AUC / average precision** | Recall@precision target, F1, confusion matrix |
| Ranking quality across thresholds | ROC-AUC (or **Gini = 2·AUC − 1**, standard in credit scoring) | PR-AUC if imbalanced |
| Fixed contact budget (top 5% of customers) | **Precision@k / lift@k** | Recall@k, cumulative gains chart |
| Probabilities used as numbers | **Log-loss, Brier score** | Reliability diagram |
| Multiclass, all classes matter | **Macro-F1** | Per-class report, row-normalised confusion matrix |
| Multiclass, frequent classes matter more | Weighted-F1 | Macro-F1 for contrast |
| Asymmetric monetary costs | **Expected cost / profit** at the chosen threshold | Everything above |

**Lift and gains, the language of marketing and telecom analytics.** Sort customers by predicted churn probability and take the top decile. If 20% of them churn against a 4% base rate, the **lift is 5×**. A **cumulative gains chart** shows the percentage of all churners captured by contacting the top x% of customers. Retention managers think in these terms.

**KS statistic** (credit-risk teams, fintech arms such as e& money): the maximum distance between the cumulative score distributions of positives and negatives. Values of 0.4–0.6 are typically considered good for scorecards.

**Matthews correlation coefficient (MCC):** a single balanced number that uses all four confusion-matrix cells. It stays informative under imbalance and ranges −1…1.

---

## 8.15 Worked example: turning a model into a business decision 🟡 ⭐

> [!quote] 💬 Say it in the interview
> “I turn scores into money: expected value = P(churn) × P(save | offer) × customer value − contact cost, then pick the threshold or top-k that maximises it.”

A churn model outputs probabilities for 1,000,000 post-paid subscribers. The retention team can call **20,000** customers a month. An offer costs **EGP 50**, a saved customer is worth **EGP 1,500** in margin, and an offer saves about **30%** of the churners it reaches.

1. **The threshold is set by capacity, not 0.5.** Rank by p̂ and take the top 20,000. The operating metric is **precision@20k**.
2. Suppose precision@20k = 25%, so 5,000 of those contacted would have churned. Expected value = 5,000 × 0.30 × 1,500 − 20,000 × 50 = 2,250,000 − 1,000,000 = **EGP 1.25M per month**.
3. Compare against **random targeting** (base churn 3% → 600 churners in 20,000 → value = 600 × 0.30 × 1,500 − 1,000,000 = **−EGP 730k**). The model's value is the difference, not the AUC.
4. **Better still: uplift modelling.** Target customers whose behaviour the offer *changes* (persuadables), not simply those most likely to churn. Some high-risk customers leave regardless ("lost causes"); some "sleeping dogs" churn *because* you contacted them. This needs an A/B-tested treatment group (Part 15).

Being able to produce this kind of calculation in an interview is what moves you from "knows sklearn" to "can be trusted with a business problem".

---

## 8.16 Support Vector Machines — what you need for interviews 🟡

> [!info] 📖 Géron · online chapter on SVMs (homl.info) — not in the printed 2025 edition

Géron moved SVMs to an online chapter (https://homl.info/svm-p), but they still come up in interviews.

- **Idea:** find the separating hyperplane with the **largest margin** (the widest "street" between classes). Only the points on or inside the margin, the **support vectors**, determine it.
- **Hard vs soft margin:** real data is not perfectly separable. **`C`** trades margin width against violations. **Small C** gives a wider margin and more violations (more regularisation). **Large C** gives a narrow margin and fewer violations (risk of overfitting).
- **Kernel trick:** compute dot products in a high-dimensional feature space without constructing it. `kernel="poly"` (degree, coef0) and **`kernel="rbf"`** (Gaussian; **`gamma`** controls how far one training point's influence reaches: large γ gives wiggly boundaries and overfitting, small γ gives smooth ones).
- **Scaling is mandatory.**
- **Complexity:** kernel SVC is roughly O(m²)–O(m³) in training, so it doesn't scale past ~100k rows. `LinearSVC` / `SGDClassifier(loss="hinge")` scale linearly.
- **No native probabilities:** `SVC(probability=True)` runs an internal Platt calibration with 5-fold CV, which is slow. Use `decision_function` for ranking.
- **SVR** (regression) fits as many points as possible *inside* an ε-wide tube.
- **When to use:** small-to-medium, clean, high-dimensional data (text, genomics). For large tabular data, gradient boosting usually wins.

<figure class="dia"><svg viewBox="0 0 720 250" role="img" aria-label="A support vector machine: two classes separated by the line with the widest margin; the points on the margin edges, the support vectors, determine it">
<line class="sL" x1="157" y1="225" x2="503" y2="25" stroke-width="2.5"/>
<line class="sD" x1="177" y1="260" x2="523" y2="60"/>
<line class="sD" x1="137" y1="190" x2="483" y2="-10"/>
<circle class="sPg" cx="246" cy="220" r="6"/><circle class="sLm" cx="246" cy="220" r="11" fill="none" style="stroke-width:2"/>
<circle class="sPg" cx="313" cy="216" r="6"/>
<circle class="sPg" cx="350" cy="160" r="6"/><circle class="sLm" cx="350" cy="160" r="11" fill="none" style="stroke-width:2"/>
<circle class="sPg" cx="427" cy="173" r="6"/>
<circle class="sPg" cx="453" cy="118" r="6"/>
<circle class="sPg" cx="368" cy="230" r="6"/>
<circle class="sPg" cx="385" cy="140" r="6"/><circle class="sLm" cx="385" cy="140" r="11" fill="none" style="stroke-width:2"/>
<rect class="sR" x="209" y="139" width="12" height="12"/><circle class="sLm" cx="215" cy="145" r="12" fill="none" style="stroke-width:2"/>
<rect class="sR" x="249" y="70" width="12" height="12"/>
<rect class="sR" x="321" y="74" width="12" height="12"/><circle class="sLm" cx="327" cy="80" r="12" fill="none" style="stroke-width:2"/>
<rect class="sR" x="343" y="-8" width="12" height="12"/>
<rect class="sR" x="200" y="64" width="12" height="12"/>
<rect class="sR" x="405" y="20" width="12" height="12"/>
<rect class="sR" x="346" y="37" width="12" height="12"/>
<line class="sLw" x1="459.904" y1="50" x2="479.904" y2="84.641" marker-end="url(#ahw)"/><text class="sWt" x="487.904" y="102.641">margin</text>
<text class="sC" x="540" y="70">the widest street that</text><text class="sC" x="540" y="88">separates the classes</text><text class="sC" x="540" y="130">circled points sit on the</text><text class="sC" x="540" y="148">edges: the support vectors</text><text class="sGt" x="540" y="166">only they define the line</text>
</svg><figcaption>Move any point that isn't circled and the boundary doesn't change. That is why SVMs depend on scaling and on C.</figcaption></figure>

---

> [!check] ✅ Key takeaways
> - Accuracy misleads on imbalanced data — start from the confusion matrix and a dummy baseline.
> - Precision = how often a flag is right; recall = how many positives you catch; the threshold trades them.
> - Choose the threshold (or top-k) from business costs and capacity, not the default 0.5.
> - ROC-AUC measures ranking; prefer PR-AUC when positives are rare.
> - Calibrate probabilities when they drive decisions (expected value, pricing).
> - Logistic regression = linear log-odds + sigmoid + log loss; its coefficients are odds ratios.

## 8.17 Interview drill — classification 🟢 ⭐

> [!info] 📖 Géron Ch. 3 · Exercises · p. 133

**Q1. Your fraud model has 99.8% accuracy. Good?** Not necessarily. At 0.2% fraud, a constant "not fraud" model scores 99.8%. Report the confusion matrix, precision/recall, PR-AUC, and a comparison against a `DummyClassifier`.

**Q2. Precision vs recall, in one sentence each.** Precision: of the cases I flagged, what share were real? Recall: of the real cases, what share did I flag?

**Q3. How do you choose the threshold?** From the business costs or capacity: maximise expected profit, meet a minimum precision/recall, or fill a fixed contact budget. Tune it on validation predictions (e.g. `cross_val_predict` scores, `TunedThresholdClassifierCV`), never on the test set.

**Q4. ROC-AUC vs PR-AUC?** ROC measures ranking across both classes and is insensitive to the class ratio. PR focuses on the positive class and exposes false positives under imbalance. Use PR when positives are rare.

**Q5. What does AUC = 0.8 mean?** An 80% probability that a randomly chosen positive is scored above a randomly chosen negative.

**Q6. Why F1 as a harmonic mean?** It is dominated by the smaller of precision and recall, so a model cannot score well by maximising only one of them.

**Q7. Macro vs micro vs weighted F1?** Macro is the unweighted class average (rare classes count equally). Weighted is weighted by support. Micro pools all TP/FP/FN (equals accuracy in single-label multiclass).

**Q8. What is calibration and when do you need it?** Agreement between predicted probabilities and observed frequencies. You need it when probabilities feed decisions, pricing or expected-value calculations. Fix it with `CalibratedClassifierCV` (Platt or isotonic) and check it with a reliability diagram or the Brier score.

**Q9. OvR vs OvO?** OvR: N models, one class against all others. OvO: N(N−1)/2 pairwise models, preferred for algorithms that scale badly with dataset size (SVC).

**Q10. Why is logistic regression's loss log-loss and not MSE?** Log-loss is the negative Bernoulli log-likelihood. It is convex in θ and gives strong gradients for confident mistakes. MSE through a sigmoid is non-convex and its gradients vanish.

**Q11. Interpret a logistic coefficient of 0.7 on `num_complaints_90d`.** Each extra complaint multiplies the odds of churn by e^0.7 ≈ 2.0, holding the other features constant.

**Q12. Multiclass vs multilabel?** Multiclass: exactly one of K classes (softmax). Multilabel: any subset of labels (independent sigmoids, one per label, or a `ClassifierChain`).

**Q13. Your model does well offline but poorly in production. List the suspects.** Leakage in training (a feature unavailable at prediction time); training/serving skew (different preprocessing code paths); data drift; label definition changes; a threshold tuned on a different base rate; sampling bias in the training population.

**Q14. How do you do error analysis on a classifier?** Get out-of-fold predictions, row-normalise the confusion matrix, zero the diagonal to find the dominant confusions, read actual misclassified examples, then act: more data, new features, preprocessing, augmentation, or a different model family.

---

## 8.18 Real-world examples — classification decisions 🟡

- **Churn (every telco):** the model outputs a probability; the business chooses a **threshold from the profit curve** (§8.15), not 0.5. Operators typically contact the top 5–10% riskiest — so **precision@k** and lift in the top decile are what matter.
- **Credit scoring (e& money-style micro-loans, device instalments):** logistic regression scorecards remain standard because regulators require **explainability**; metrics: AUC/Gini, KS, calibration by score band.
- **Fraud (SIM-box, card fraud):** positives are < 0.1% → **PR-AUC**, cost-weighted thresholds, and human review capacity sets the operating point.
- **Medical screening:** recall is prioritised (missing a disease costs more than a false alarm) — the textbook example of choosing a threshold by error cost.
- **Spam filtering (Gmail):** a massive, continuously retrained classifier; claims to block >99.9% of spam — shows how monitoring and retraining handle adversarial drift.
- **COMPAS recidivism tool:** the ProPublica (2016) analysis showed different false-positive rates across groups — a key case for **fairness metrics** (equalised odds vs calibration can't all hold at once).

---

## Further reading

- **ISLR Chapter 4** (classification, logistic regression, LDA) and **Chapter 8** (trees) — https://www.statlearning.com/
- **scikit-learn: Linear Models §1.1.11** (logistic regression) and **Decision Trees §1.10** — https://scikit-learn.org/stable/modules/tree.html
- **Google's ML Crash Course — Classification module** — https://developers.google.com/machine-learning/crash-course — the ROC/AUC and precision/recall sections are unusually clear and interactive.
- **MLU-Explain: ROC & AUC** — https://mlu-explain.github.io/roc-auc/ — interactive; drag the threshold and watch the curve. Ten minutes here is worth an hour of reading.
- **StatQuest** — the logistic regression, ROC/AUC and decision tree videos.
- **Interpretable Machine Learning**, Christoph Molnar — free at https://christophm.github.io/interpretable-ml-book/ — for when "which features mattered?" becomes the question, which it will.

---

<!-- nav -->
> [!example] 🧭 Step 10 of 26 · Stage 3 of 7: Classical ML
> ← [Part 07 · Regression](07_Supervised_Regression.md) · [Part 08B · Trees & ensembles](08B_Trees_and_Ensembles.md) → · [Course map](00_START_HERE.md)
<!-- /nav -->
