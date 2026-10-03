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
