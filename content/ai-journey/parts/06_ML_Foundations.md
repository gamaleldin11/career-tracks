# Part 6 — Machine Learning Foundations

<!-- nav -->
> [!example] 🧭 Step 8 of 26 · Stage 3 of 7: Classical ML
> ← [Part 15 · Statistics & A/B tests](15_Statistics_Probability_and_AB_Testing.md) · [Part 07 · Regression](07_Supervised_Regression.md) → · [Course map](00_START_HERE.md)
<!-- /nav -->

**Source:** `AI_notebooks/2025-12-30/` (`descent.png`, `useful links.txt`), plus the concepts threaded through every project notebook from 2026-01-01 onward. **Lectures:** Lec 10

The 2025-12-30 session left almost nothing on disk — one image of gradient descent and a text file with two links:

```
https://mlu-explain.github.io/linear-regression/
https://www.youtube.com/watch?v=AeRwohPuUHQ
```

That is the theory session. This part reconstructs it, because everything in Parts 7–11 assumes it.

<!-- interview-focus -->

> [!tip] 🎯 Interview focus
> **Why it matters:** This is the most tested part at every level. Bias–variance, cross-validation, metrics and leakage appear in nearly every DS interview.
>
> | Level | What you should be able to do |
> |---|---|
> | 🟢 **Entry** | Define supervised/unsupervised learning, overfitting/underfitting, train/validation/test, k-fold CV, gradient descent, and the main metrics (RMSE, MAE, precision, recall, F1, AUC). |
> | 🟡 **Mid** | Diagnose a model from its learning curves; choose a validation scheme (stratified, grouped, time-based); frame a business problem end to end; monitoring and retraining. |
> | 🔴 **Senior** | Design the evaluation strategy for a new product, trade offline metrics against online impact, set up governance for model changes. |
>
> **⭐ Most-asked:** *Explain the bias–variance trade-off.* · *How does k-fold cross-validation work, and when is it wrong?* · *Precision vs recall — give a telecom example.* · *What is data leakage?* · *How do you know a model is ready for production?*
>
> **⏱ Time:** 5–6 h  ·  **Short on time?** Read §6.3–6.6, §6.13 (drill).

**Legend:** 🟢 Entry (0–2 yrs) · 🟡 Mid (2–5 yrs) · 🔴 Senior / specialist · ⭐ frequently asked · 📖 Géron, *Hands-On ML with Scikit-Learn and PyTorch* (2025) pages

> [!abstract]- 🗺️ Section map — level and book pages
>
> | § | Section | Level | 📖 Book |
> |---|---|:---:|---|
> | 6.1 | What "learning" means | 🟢 | — |
> | 6.2 | Linear regression, from the ground up | 🟢 ⭐ | Ch. 4 · pp. 136–141 |
> | 6.3 | Gradient descent | 🟢 ⭐ | Ch. 4 · pp. 142–153 |
> | 6.4 | Overfitting, underfitting, and the bias–variance tradeoff | 🟢 ⭐ | Ch. 1 · pp. 31–34 |
> | 6.5 | Cross-validation | 🟢 ⭐ | Ch. 2 · pp. 92–94 |
> | 6.6 | Metrics | 🟢 ⭐ | Ch. 2, Ch. 3 · pp. 45–47, pp. 111–124 |
> | 6.7 | The workflow, assembled | 🟢 | — |
> | 6.8 | The map of machine learning | 🟢 ⭐ | Ch. 1 · pp. 4–27 |
> | 6.9 | The main challenges: bad data and bad models | 🟢 | Ch. 1 · pp. 27–34 |
> | 6.10 | Testing and validating — the full protocol | 🟡 | Ch. 1 · pp. 35–39 |
> | 6.11 | Framing a project like a professional | 🟡 ⭐ | Ch. 2 · pp. 43–48, pp. 100–103 |
> | 6.12 | Fine-tuning at depth | 🟡 | Ch. 2 · pp. 94–100 |
> | 6.13 | Interview drill — ML fundamentals | 🟢 ⭐ | Ch. 1 · p. 39 |
> | 6.14 | Real-world examples — foundations in the wild | 🟡 | — |
>

---

## 6.1 What "learning" means 🟢

A supervised learning problem is: given examples `(x, y)`, find a function `f` such that `f(x) ≈ y` for examples you have **not** seen.

Three components, and every algorithm in this course is a different choice of the three:

| Component | Question it answers | Examples |
|---|---|---|
| **Hypothesis space** | What shapes of function am I willing to consider? | Straight lines (linear regression); axis-aligned boxes (decision trees); local neighbourhoods (KNN) |
| **Loss function** | How wrong is a given function? | MSE, log-loss, Gini impurity |
| **Optimiser** | How do I search for the least-wrong one? | Closed form, gradient descent, greedy splitting |

Once you see a model this way, new algorithms stop being a list to memorise. XGBoost is "additive trees + any differentiable loss + gradient descent in function space". A neural network is "composed affine maps and nonlinearities + cross-entropy + gradient descent".

### Supervised vs unsupervised

| | Supervised | Unsupervised |
|---|---|---|
| Data | `(X, y)` — labelled | `X` only |
| Goal | Predict `y` for new `X` | Find structure in `X` |
| Evaluate with | Held-out accuracy, RMSE, F1 | Internal metrics (silhouette, inertia) or human judgement |
| In this course | Parts 7, 8, 11 | Part 9 (PCA, clustering) |

The evaluation row is the important one. Supervised learning has a ground truth to check against; unsupervised learning does not, which is why the clustering notebook says:

> In clustering, there is no single 'accuracy'. We use **internal metrics** (e.g., inertia, silhouette).

### Regression vs classification

Both are supervised; they differ in the type of `y`.

- **Regression** — `y` is continuous. "How much will this customer spend?" (Part 7)
- **Classification** — `y` is a category. "Will they click the ad?" (Part 8), "How severe is this accident?" (Part 13)

The distinction determines your loss function and every metric you report. A confusion matrix is meaningless for regression; RMSE is meaningless for classification.

---

## 6.2 Linear regression, from the ground up 🟢 ⭐

> [!info] 📖 Géron Ch. 4 · “Linear Regression”, “The Normal Equation” · pp. 136–141

> [!quote] 💬 Say it in the interview
> “Linear regression predicts a weighted sum of the features, trained by minimising MSE, either in closed form (normal equation) or by gradient descent.”

The reference link the course gave — **MLU-Explain's Linear Regression** — is genuinely one of the best interactive explanations available, and it is worth opening while you read this section.

### The model

For one feature:

> **ŷ = w·x + b**

`w` is the slope (how much `y` changes per unit of `x`), `b` the intercept. For many features it becomes a dot product, exactly as in §2.8:

> **ŷ = w₁x₁ + w₂x₂ + … + wₙxₙ + b = w·x + b**

That is the whole model. Everything else is how you choose `w` and `b`.

### The loss

**Mean Squared Error:**

> **MSE = (1/n) Σ (yᵢ − ŷᵢ)²**

Why squared, rather than absolute error?

1. **It is differentiable everywhere.** `|x|` has a kink at zero; `x²` does not. Gradient descent needs a derivative.
2. **It penalises large errors disproportionately.** Being wrong by 10 costs 100, being wrong by 1 costs 1. Whether that is desirable depends on your problem — it also makes MSE sensitive to outliers, which is why MAE is sometimes preferred.
3. **It has a unique closed-form minimum** (see below).

Squaring also makes the units awkward (dollars-squared), which is why we report **RMSE** — the square root — instead.

### Two ways to solve it

**Closed form — the normal equation:**

> **β = (XᵀX)⁻¹ Xᵀy**

One matrix expression gives the exact optimum. This is why Part 2 spent time on `inv`, transpose, and the determinant. It also explains the failure mode: when features are perfectly collinear, `XᵀX` is singular, no inverse exists, and there is no unique answer. That is multicollinearity, and it is why the capstone checks VIF.

Cost: roughly O(n·p²) — fine for hundreds of features, impossible for millions of rows or features.

**Iterative — gradient descent:**

Which is what the session's `descent.png` is about, and what generalises to every other model in this course.

---

## 6.3 Gradient descent 🟢 ⭐

> [!info] 📖 Géron Ch. 4 · “Gradient Descent” · pp. 142–153

![The learning rate decides whether gradient descent crawls, converges or diverges.](figures/fig06_gd_learning_rates.png)
*The learning rate decides whether gradient descent crawls, converges or diverges.*

> [!quote] 💬 Say it in the interview
> “Gradient descent moves the parameters against the gradient of the loss. The learning rate is the key knob: too small is slow, too large diverges. Mini-batch GD is the practical default.”

### The idea

You are standing on a hillside in fog. You want the bottom. You cannot see the valley, but you can feel which way is downhill under your feet. So: take a step downhill. Repeat.

Formally — for each parameter, compute the partial derivative of the loss with respect to it (the gradient points **uphill**), then step in the opposite direction:

> **w ← w − α · ∂L/∂w**

`α` is the **learning rate** — how big a step you take.

### The learning rate is the whole game

| α | What happens |
|---|---|
| Too small | Converges, but takes forever. You waste hours. |
| About right | Steady, fast descent to the minimum. |
| Too large | Overshoots the minimum, bounces between walls. |
| Far too large | **Diverges** — loss increases every step, then becomes `NaN`. |

If your neural network's loss becomes `NaN` in the first few epochs, the learning rate is the first thing to check. The ANN in Part 11 uses `learning_rate=0.001` — the Adam default, and a sane starting point.

### The three variants

| Variant | Gradient computed on | Character |
|---|---|---|
| **Batch** | The entire dataset, every step | Smooth, accurate, slow. Needs all data in memory. |
| **Stochastic (SGD)** | One sample at a time | Very noisy, very fast per step. The noise can help escape bad regions. |
| **Mini-batch** | A small batch (32, 64, 256…) | **The universal practical choice.** Smooth enough, and GPU-friendly. |

`batch_size=64` in the Part 11 ANN is mini-batch gradient descent. One pass over all batches is one **epoch**.

### Why scaling matters — the geometric answer

This is the payoff for Part 4's feature scaling section.

If `x₁ ∈ [0, 1]` and `x₂ ∈ [0, 100000]`, the loss surface is a long thin ravine rather than a round bowl. Gradient descent zig-zags across the narrow direction and crawls along the long one — it can take orders of magnitude more steps for the same result.

Standardising features makes the contours roughly circular, so the gradient points more or less straight at the minimum. **This is the mechanism behind "scale your features", and it is why the requirement applies to gradient-based methods and not to trees.**

### Convexity

Linear and logistic regression have **convex** loss surfaces: one global minimum, no local traps. Gradient descent will find it from any starting point.

Neural networks are **non-convex**: many local minima and vast saddle regions. That sounds fatal and is not — in high dimensions, most critical points are saddles rather than bad minima, and modern optimisers (Adam, momentum) handle them well. But it explains why a neural network gives different results on different random initialisations, and why `random_state` / seeding matters even more there.

---

## 6.4 Overfitting, underfitting, and the bias–variance tradeoff 🟢 ⭐

> [!info] 📖 Géron Ch. 1 · “Overfitting / Underfitting the Training Data” · pp. 31–34

![Underfitting vs overfitting, and the U-shaped total error.](figures/fig06_bias_variance.png)
*Underfitting vs overfitting, and the U-shaped total error.*

> [!quote] 💬 Say it in the interview
> “High bias = underfitting: both train and validation errors are high. High variance = overfitting: low train error, high validation error. Fix bias with more capacity or features; fix variance with more data, regularisation or a simpler model.”

The central problem of the field.

### The two failure modes

**Underfitting (high bias)** — the model is too simple to capture the pattern. Fitting a straight line to a curve. Symptom: **poor on training data, poor on test data.**

**Overfitting (high variance)** — the model is complex enough to memorise noise. Symptom: **excellent on training data, poor on test data.** This is the common one.

### The decomposition

Expected prediction error decomposes into three parts:

> **Error = Bias² + Variance + Irreducible noise**

- **Bias** — error from wrong assumptions. A linear model on a quadratic relationship has high bias no matter how much data you give it.
- **Variance** — how much the fitted model would change if you resampled the training set. A deep unpruned decision tree has huge variance: change ten rows and you get a different tree.
- **Irreducible noise** — the floor. No model beats it.

Increasing model complexity lowers bias and raises variance. The optimum is in the middle, and the only way to locate it is to measure on held-out data.

### The diagnostic table

This is the practical form. Memorise it:

| Train score | Test score | Diagnosis | Do this |
|---|---|---|---|
| Low | Low | **Underfitting** | More complex model, better features, less regularisation |
| High | Low | **Overfitting** | More data, simpler model, more regularisation, feature selection |
| High | High | Good fit | Ship it |
| Low | High | Something is wrong | Bug, tiny/unrepresentative test set, or leakage |

The Ecommerce notebook computes both train and test metrics for exactly this comparison:

```python
y_pred_train_lr = lr_pipe.predict(X_train)
rmse_train_lr = np.sqrt(mean_squared_error(y_train, y_pred_train_lr))
r2_train_lr   = r2_score(y_train, y_pred_train_lr)

y_pred_test_lr = lr_pipe.predict(X_test)
rmse_test_lr = np.sqrt(mean_squared_error(y_test, y_pred_test_lr))
```

**Always report both.** A test score alone cannot tell you *which* problem you have, and therefore cannot tell you what to do next.

### Regularisation — the standard lever

Penalise complexity directly by adding a term to the loss:

| Method | Penalty | Effect |
|---|---|---|
| **Ridge (L2)** | `λ Σ wᵢ²` | Shrinks all coefficients toward zero; handles collinearity well |
| **Lasso (L1)** | `λ Σ|wᵢ|` | Drives some coefficients **exactly to zero** — automatic feature selection |
| **Elastic Net** | Both | Compromise |

`λ` (called `alpha` in sklearn, `C = 1/λ` in `LogisticRegression`) controls the strength. Choose it by cross-validation.

⚠️ **Regularisation penalises coefficient magnitude, so it is scale-dependent.** An unscaled feature with a small range gets a large coefficient and is penalised more heavily for no good reason. **You must scale before regularising.** This is a second, independent reason for `StandardScaler`.

The course does not cover Ridge and Lasso explicitly. `LogisticRegression` in sklearn applies L2 by default, though, so you have been using regularisation whether you knew it or not. **The gap is now filled in Part 7, §7.14–7.18:** the Normal equation vs gradient descent, learning curves, Ridge/Lasso/Elastic Net with the geometry of why ℓ₁ gives sparsity, and early stopping, all from Géron Ch. 4.

---

## 6.5 Cross-validation 🟢 ⭐

> [!info] 📖 Géron Ch. 2 · “Better Evaluation Using Cross-Validation” · pp. 92–94

![Five-fold cross-validation: every row is used for validation exactly once. The test set stays locked away.](figures/fig06_kfold.png)
*Five-fold cross-validation: every row is used for validation exactly once. The test set stays locked away.*

> [!quote] 💬 Say it in the interview
> “k-fold CV trains on k−1 folds and validates on the one left out, k times, and I report mean ± std. I use stratified folds for classification, grouped folds when rows share an entity, and time-series splits for temporal data.”

### Why a single split is not enough

`train_test_split(test_size=0.2)` gives you one number. Change `random_state` and you get a different number. On a 500-row dataset the spread can be several percentage points — larger than the difference between the models you are comparing.

**k-fold cross-validation** fixes this. Split the training data into k parts; train on k−1 and validate on the held-out one; rotate; average.

```python
from sklearn.model_selection import KFold, cross_validate

cv = KFold(n_splits=5, shuffle=True, random_state=RANDOM_STATE)

cv_scores = cross_validate(
    lr_pipe, X, y, cv=cv,
    scoring={"rmse": "neg_root_mean_squared_error", "r2": "r2"},
    return_train_score=True
)
```

You get five scores. Report the **mean and the standard deviation**. The standard deviation is the part people omit and the part that matters: a model scoring 0.82 ± 0.01 is a different proposition from one scoring 0.82 ± 0.09.

The capstone does this correctly:

```python
results.append({
    "model": name,
    "f1_macro_mean": np.mean(cv_out["test_f1_macro"]),
    "f1_macro_std":  np.std(cv_out["test_f1_macro"]),
    ...
})
```

### `StratifiedKFold` for classification

```python
cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=RANDOM_STATE)
```

Each fold preserves the class proportions. Same argument as `stratify=y` in §4.5, applied per fold. **Use it for every classification problem.** (sklearn actually defaults to stratified folds when you pass an integer `cv` to a classifier, but being explicit is better.)

### Other splitters worth knowing

- **`TimeSeriesSplit`** — always trains on the past and validates on the future. Mandatory for anything time-ordered; random k-fold on a time series is temporal leakage.
- **`GroupKFold`** — keeps all rows sharing a group ID in the same fold. Needed when you have repeated measurements per subject; otherwise the same patient appears in both train and validation, and your score is memorisation.

Note this would matter for the Road Accidents data: multiple casualty rows share a `Reference Number`. A strict treatment would use `GroupKFold` on it. The capstone does not, which is a defensible simplification but worth knowing.

### ⚠️ Cross-validate the pipeline, not the model

```python
cross_validate(pipe, X, y, cv=cv)      # ✅ preprocessing refit inside each fold
cross_validate(model, X_scaled, y)     # ❌ scaler saw all the data — leakage
```

If you scale first and cross-validate second, every fold's "validation" data contributed to the scaler's mean and σ. The reported score is optimistic. Passing the whole pipeline makes this impossible to get wrong.

### Hyperparameter search

**Parameters** are learned from data (regression coefficients, network weights). **Hyperparameters** are set by you before training (k in KNN, tree depth, learning rate).

```python
param_grid = {
    "model__n_neighbors": [3, 5, 7, 9, 11],
    "model__weights": ["uniform", "distance"],
    "model__p": [1, 2]                     # Manhattan / Euclidean
}

grid = GridSearchCV(
    estimator=knn_pipe,
    param_grid=param_grid,
    scoring="neg_root_mean_squared_error",
    cv=5,
    n_jobs=-1
)
grid.fit(X_train, y_train)
grid.best_params_, grid.best_estimator_
```

Two syntax details:

- **`model__n_neighbors`** — double underscore. It means "the parameter `n_neighbors` of the pipeline step named `model`". This is how you tune inside a pipeline, and you can nest further: `preprocess__num__imputer__strategy`.
- **`n_jobs=-1`** — use all CPU cores.

`GridSearchCV` tries every combination — here 5 × 2 × 2 = 20 configurations × 5 folds = 100 fits. It explodes combinatorially. `RandomizedSearchCV` samples a fixed number of random configurations instead and is usually the better choice beyond three hyperparameters; empirically it finds comparable optima for a fraction of the compute.

**`scoring="neg_root_mean_squared_error"`** — note the `neg_`. sklearn's convention is that **higher is always better**, so error metrics are negated. Your best RMSE will print as a negative number. This confuses everyone once.

---

## 6.6 Metrics 🟢 ⭐

> [!info] 📖 Géron Ch. 2 · “Select a Performance Measure” pp. 45–47; Ch. 3 · “Performance Measures” pp. 111–124

![The confusion matrix: every classification metric is built from these four cells.](figures/fig06_confusion_matrix.png)
*The confusion matrix: every classification metric is built from these four cells.*

> [!quote] 💬 Say it in the interview
> “I pick the metric from the business cost: RMSE/MAE for regression, precision/recall/PR-AUC for imbalanced classification, and I always compare against a dummy baseline.”

### Regression metrics

| Metric | Formula | Reads as |
|---|---|---|
| **MAE** | mean(\|y − ŷ\|) | Average error, in the target's own units. Robust to outliers. |
| **MSE** | mean((y − ŷ)²) | Penalises large errors. Units are squared — not interpretable. |
| **RMSE** | √MSE | Same units as the target. The default report. |
| **R²** | 1 − SS_res/SS_tot | Fraction of variance explained. 1 is perfect, 0 is "no better than predicting the mean", negative is worse than that. |

```python
rmse = np.sqrt(mean_squared_error(y_test, y_pred))
r2   = r2_score(y_test, y_pred)
```

**RMSE and R² answer different questions.** RMSE says *how far off are we, in dollars*. R² says *how much of the variation did we capture*. Report both: RMSE for the stakeholder, R² for the comparison across datasets.

**MAE vs RMSE:** RMSE > MAE always, and the gap grows with error variance. If RMSE is much larger than MAE, a few predictions are very wrong — go look at them.

### Classification metrics

Start with the confusion matrix. For a binary problem:

|  | Predicted Negative | Predicted Positive |
|---|---|---|
| **Actual Negative** | TN | FP *(Type I error — false alarm)* |
| **Actual Positive** | FN *(Type II error — miss)* | TP |

Everything else is derived:

| Metric | Formula | Question it answers |
|---|---|---|
| **Accuracy** | (TP+TN)/all | What fraction did I get right? |
| **Precision** | TP/(TP+FP) | Of those I flagged, how many were real? |
| **Recall** (sensitivity) | TP/(TP+FN) | Of the real ones, how many did I catch? |
| **F1** | 2·P·R/(P+R) | Harmonic mean of precision and recall |
| **ROC-AUC** | area under TPR-vs-FPR curve | How well are the classes ranked, at any threshold? |

**Precision vs recall is a business decision, not a statistical one:**

- **Cancer screening** — a miss is fatal, a false alarm means another test. **Maximise recall.**
- **Spam filtering** — a missed spam is an annoyance, a real email in the spam folder is a disaster. **Maximise precision.**
- **Fraud detection** — depends entirely on the cost of investigating a flag versus the cost of a fraudulent transaction.

**Why F1 uses the harmonic mean:** the arithmetic mean of precision 1.0 and recall 0.0 is 0.5, which flatters a useless model. The harmonic mean is 0. It punishes imbalance between the two, which is the point.

### Averaging for multi-class

The capstone reports F1 in two flavours, and the difference matters:

| Average | How | Effect |
|---|---|---|
| **`macro`** | Compute F1 per class, then average unweighted | Every class counts equally — **rare classes matter as much as common ones** |
| **`weighted`** | Average weighted by class support | Dominated by the majority class |
| **`micro`** | Pool all TP/FP/FN globally | Equals accuracy in single-label multi-class |

> This is why we prefer **F1-macro**

Correct, and it is the key metric decision in the whole project. On Road Accidents, `Slight` is ~89% of the data. Weighted F1 would be almost entirely a measure of how well you predict `Slight` — which is easy and uninteresting. Macro F1 forces the `Fatal` class, with a handful of examples, to count as much as `Slight`.

**Choose your metric before you look at results.** Otherwise you will pick the one that flatters the model you already built.

### ROC-AUC and the threshold

A classifier does not really output a class; it outputs a **probability**. `predict()` just applies a 0.5 threshold to `predict_proba()`.

The **ROC curve** plots True Positive Rate against False Positive Rate as you sweep that threshold from 0 to 1. **AUC** is the area underneath.

Interpretation: **AUC is the probability that a randomly chosen positive is ranked above a randomly chosen negative.**

- 1.0 — perfect ranking
- 0.5 — random guessing
- <0.5 — worse than random; your labels or signs are probably flipped

AUC's great advantage is being **threshold-independent** — it measures the quality of the ranking, not of one arbitrary cut. That is why it survives class imbalance better than accuracy.

For multi-class, One-vs-Rest:

```python
test_roc_auc = roc_auc_score(y_test_enc, y_proba,
                             multi_class="ovr", average="weighted",
                             labels=best_pipe.classes_)
```

📌 **Where AUC misleads:** on severe imbalance, ROC-AUC can look excellent while precision is terrible, because the false-positive rate has a huge denominator. For rare-positive problems (fraud at 0.17%), report **Precision-Recall AUC / average precision** as well. The course notebooks skipped it; Part 8 §8.12.5 covers it in full.

### The baseline — the most under-used idea in the course

```python
from sklearn.dummy import DummyClassifier

dummy = DummyClassifier(strategy="most_frequent", random_state=RANDOM_STATE)
dummy_pipe = ImbPipeline(steps=[("preprocess", preprocessor), ("model", dummy)])
cv_out_dummy = cross_validate(dummy_pipe, X_train, y_train_enc,
                              scoring=scoring, cv=cv, n_jobs=-1)
```

The capstone's own justification:

> Before trusting any ML model, we compare against a **baseline** model. […] If our ML models do **not** outperform this baseline, then the ML pipeline is not providing real value.

**Do this on every project, first, before any modelling.** It takes four lines and it calibrates every number that follows. On Road Accidents the dummy scores ~89% accuracy and ~0.31 macro-F1; knowing that instantly tells you which of your model's numbers are real.

For regression, the equivalent is `DummyRegressor(strategy="mean")`, whose R² is 0 by construction.

---

## 6.7 The workflow, assembled 🟢

Every project notebook in this course follows the same skeleton. Internalise it and you have a template for any tabular problem:

```
 1. Load and profile          →  shape, info, describe, nulls, duplicates, cardinality
 2. Clean                     →  types, domain validation, sentinels
 3. Engineer features         →  datetime parts, flags, ratios, binned categories
 4. EDA                       →  univariate, bivariate, target relationships, correlations
 5. Split                     →  train_test_split(stratify=y)   ← nothing above touched test
 6. Build the pipeline        →  ColumnTransformer(numeric_pipe, categorical_pipe)
 7. Baseline                  →  DummyClassifier / DummyRegressor
 8. Compare models with CV    →  cross_validate(pipe, X_train, y_train, cv=StratifiedKFold)
 9. Tune the winner           →  GridSearchCV / RandomizedSearchCV
10. Evaluate ONCE on test     →  classification_report, confusion matrix, ROC-AUC
11. Interpret                 →  feature importance, SHAP, error analysis
12. Save artifacts            →  joblib.dump(pipeline), metrics.json, leaderboard.csv
```

Steps 5–8 are where correctness lives. Steps 1–4 are where insight lives. Step 11 is where trust lives.

---

## 6.8 The map of machine learning (Géron, Ch. 1) 🟢 ⭐

> [!info] 📖 Géron Ch. 1 · “What Is ML?” → “Instance- vs Model-Based Learning” · pp. 4–27

> [!quote] 💬 Say it in the interview
> “ML systems are classified by supervision (supervised, unsupervised, self-supervised, RL), by batch vs online learning, and by instance- vs model-based learning.”

> [!note] 📘 From the book
> Sections 6.8–6.13 add material from Géron's *Hands-On Machine Learning with Scikit-Learn and PyTorch* (2025), Chapters 1, 2 and 4. Chapter 1 is the vocabulary chapter; Géron says it covers concepts "that every data scientist should know by heart". Interviewers often open with exactly these questions.

### Two definitions worth quoting

- **Arthur Samuel (1959):** *the field of study that gives computers the ability to learn without being explicitly programmed.*
- **Tom Mitchell (1997):** *a program learns from experience **E** with respect to task **T** and performance measure **P** if its performance on T, as measured by P, improves with E.*

Mitchell's version is the useful one, because it makes you name T, E and P. For a churn model: T = flag subscribers likely to leave next month, E = historical subscribers with a churned/stayed label, P = recall at a fixed contact budget. Géron's counter-example: *downloading all of Wikipedia* gives you more data but no better performance on any task, so it is not machine learning.

### When ML is the right tool

Géron lists four situations:
1. Problems whose rule-based solution is a **long, fragile list of rules** (spam filters, fraud rules).
2. **Complex problems with no known algorithm** (speech, vision).
3. **Fluctuating environments.** Retraining is easier than rewriting rules. Géron's spam example: spammers switch from "4U" to "For U", and an ML filter adapts from newly flagged emails without anyone editing a rule.
4. **Getting insight from large data.** Inspecting what a model learned is *data mining*.

The converse matters too: if a simple rule works, is stable and is explainable, ship the rule. Say this in an interview; it signals judgement.

### Classification axis 1: how much supervision

| Type | Training data | Typical tasks | Telecom example |
|---|---|---|---|
| **Supervised** | Features + labels | Classification, regression | Churn (yes/no), next-month ARPU |
| **Unsupervised** | Features only | Clustering, dimensionality reduction, anomaly/novelty detection, association rules | Customer segmentation; detecting abnormal cell-tower traffic; "customers who buy bundle A also buy B" |
| **Semi-supervised** | Few labels, many unlabelled | Usually clustering + label propagation | 500 confirmed fraud cases + 5M unlabelled SIMs |
| **Self-supervised** | Unlabelled data from which labels are *generated* (mask part of the input, predict it) | Pretraining, then fine-tune | How LLMs and speech models (e.g. HuBERT) are pretrained |
| **Reinforcement learning** | An *agent* acts in an *environment* and receives *rewards*; it learns a *policy* | Games, robotics, some pricing/offer optimisation | Choosing which retention offer to make, learning from acceptance |

Terms to have ready:
- **Label vs target:** synonyms. "Label" is more common for classification, "target" for regression. Features are also called predictors or attributes.
- **Anomaly detection vs novelty detection:** novelty detection assumes a *clean* training set and flags anything unlike it. Anomaly detection tolerates contamination in training. Géron's example: with 1% Chihuahuas among dog photos, novelty detection should not flag a new Chihuahua, but anomaly detection might.
- **Transfer learning:** reuse a model trained on one task for another. This is the second half of self-supervised learning.
- **Feature extraction** (dimensionality reduction) merges correlated features into one. Géron's example: car mileage + age → "wear and tear".

### Classification axis 2: batch vs online

| | Batch (offline) learning | Online (incremental) learning |
|---|---|---|
| Trains on | All data at once, from scratch | Instances or mini-batches, one after another |
| Adapts to new data | Only by retraining on old + new data | Continuously |
| Examples | Random Forest, standard sklearn `fit` | SGD models: `SGDClassifier.partial_fit`, `MiniBatchKMeans`, neural nets |
| Risk | **Model rot / data drift** between retrains | **Bad data degrades the live model**, possibly quickly |

- **Out-of-core learning** means training on data too big for memory by streaming chunks. It uses online algorithms, but is usually run *offline*. Géron suggests calling it *incremental* learning to avoid the confusion.
- **The learning rate** controls how fast an online system adapts. Set it high and it adapts quickly but **catastrophically forgets** older patterns. Set it low and it has inertia, which also makes it robust to noise.
- Protect online systems with monitoring, an automatic "switch learning off" trigger, and rollback. Anomaly detection on the *inputs* catches bad data before it trains the model.
- Géron's warning: even a cats-vs-dogs model drifts, *"because cameras keep changing, along with image formats, sharpness, brightness"*. **Every production model needs a retraining plan.**

### Classification axis 3: instance-based vs model-based

- **Instance-based:** memorise the examples and predict by **similarity** to them (KNN). It works well on small data that changes often. It scales poorly: the training set must ship to production, prediction means searching it, and it struggles in high dimensions.
- **Model-based:** choose a model family (*model selection*), define a **cost function** (or a utility/fitness function), and let a **training algorithm** find the **parameters** that minimise the cost. Predicting on new data is called **inference**.

Géron's life-satisfaction example contrasts the two. Linear regression predicts 6.02 for Puerto Rico. 3-NN regression averages Poland (6.1), Portugal (5.4) and Estonia (5.7) to get 5.73. In sklearn the swap is one line.

⚠️ **"Model" has three meanings:** a model *type* (linear regression), a fully specified *architecture* (linear regression with one input), and a *trained* model with its parameters. **Parameters** are learned (θ₀, θ₁). **Hyperparameters** belong to the learning algorithm, are set before training, and stay constant during it (the regularisation strength, k in KNN).

---

## 6.9 The main challenges: bad data and bad models 🟢

> [!info] 📖 Géron Ch. 1 · “Main Challenges of Machine Learning” · pp. 27–34

Géron's framing: since the job is "select a model and train it on data", only two things can go wrong: **bad data** or **bad model**.

### Bad data

| Problem | What it looks like | Remedy |
|---|---|---|
| **Insufficient quantity** | Thousands of examples needed even for simple tasks, millions for vision/speech | More data, transfer learning, simpler models |
| **Non-representative data** | Training set doesn't cover the cases you'll predict | Better sampling. Beware **sampling noise** (small samples) and **sampling bias** (flawed method, even with big samples) |
| **Poor quality** | Errors, outliers, noise | Cleaning. Drop or fix outliers; decide per feature how to handle missing values |
| **Irrelevant features** | Garbage in, garbage out | **Feature engineering** = feature selection + feature extraction + creating new features from new data |

**"The unreasonable effectiveness of data."** Banko & Brill (2001) showed that very different algorithms, including simple ones, performed almost identically on a language task once they had enough data. Norvig et al. (2009) popularised the idea. Géron's caveat: small and medium datasets are still the norm, *"so don't abandon algorithms just yet."*

**Sampling bias, the classic story.** The 1936 *Literary Digest* poll mailed ~10 million people and got 2.4 million answers. It predicted Landon would win 57%; Roosevelt won with 62%. Two flaws: (1) the address lists (phone directories, magazine subscribers, clubs) skewed wealthy; (2) fewer than 25% responded, which is **nonresponse bias**. **Telecom translation:** a satisfaction model trained only on customers who answered an NPS survey is biased toward engaged customers. A churn model trained only on post-paid customers will not transfer to pre-paid.

### Bad model

**Overfitting** is when the model fits noise, because it is too complex for the amount and noisiness of the data. Géron's example: a model that notices every country with a "w" in its name (New Zealand, Norway, Sweden, Switzerland) has high life satisfaction. That rule is pure chance, and a complex model cannot tell. Fixes:
- **Simplify:** fewer parameters, fewer features, or **constrain the model (regularisation)**.
- **Get more data.**
- **Reduce noise:** fix errors, remove outliers.

The regularisation intuition in *degrees of freedom*: a line has two (intercept θ₀ and slope θ₁). Force θ₁ = 0 and you have one. Allow θ₁ but keep it small, and you have "somewhere between one and two". The hyperparameter controlling this trades training fit against generalisation.

**Underfitting** means the model is too simple for the structure in the data. Fixes: a more powerful model, better features, fewer constraints (less regularisation).

**Deployment issues:** a model can be too slow, too big, not scalable, insecure, or stale. That is why companies have **MLOps** teams. At e&-scale (tens of millions of subscribers), inference latency and batch-scoring cost are real design constraints.

---

## 6.10 Testing and validating — the full protocol 🟡

> [!info] 📖 Géron Ch. 1 · “Testing and Validating”, “Data Mismatch” · pp. 35–39

### Generalisation error

The error on new cases is the **generalisation error** (or out-of-sample error). The test set estimates it. **Low training error with high generalisation error is overfitting.**

Split size depends on data volume. 80/20 is typical, but with 10 million rows a 1% test set (100,000 rows) is plenty.

### Why you must not tune on the test set

Géron's cautionary tale: you try 100 values of a regularisation hyperparameter, pick the one with 5% test error, deploy, and get 15% in production. You **adapted the model to that particular test set**. The test error is now an optimistic, biased estimate.

### Holdout validation, then retrain

1. Split the training data into a **reduced training set** and a **validation (dev) set**.
2. Train candidate models and hyperparameters on the reduced training set; pick the best on validation.
3. **Retrain the winner on the full training set** (train + validation).
4. Evaluate **once** on the test set.

Trade-off: a small validation set gives imprecise comparisons. A large one leaves the candidates trained on much less data than the final model; Géron compares that to *"selecting the fastest sprinter to participate in a marathon."* **Repeated cross-validation** fixes both problems at the cost of k× training time. It is §6.5, and it is also what `GridSearchCV(refit=True)` does automatically.

### Data mismatch and the train-dev set (Andrew Ng)

Sometimes your abundant training data does not look like production data. Géron's example is flower photos from the web versus photos taken in your mobile app.

**The rule:** validation and test sets must be **as representative of production as possible**, so build them *only* from real production-like data.

Then, to know *why* the dev score is bad, hold out part of the (web) training data as a **train-dev set**:

| Train-dev score | Dev score | Diagnosis | Action |
|---|---|---|---|
| Bad | — | **Overfitting** the training set | Regularise, simplify, more/cleaner data |
| Good | Bad | **Data mismatch** | Make training data look like production (preprocess, augment, collect real data) |
| Good | Good | Ready | Evaluate once on test |

**Telecom version:** you train a fraud model on a public dataset or another country's data. You validate on Egyptian traffic. A train-dev set tells you whether a poor Egyptian score is overfitting or a population difference.

### The No Free Lunch theorem

Wolpert (1996): **with no assumptions about the data, no model is a priori better than any other.** A linear model assumes linearity; a tree assumes axis-aligned structure. The only way to know which is best is to evaluate them, and since you cannot evaluate all of them, you make reasonable assumptions and test a sensible shortlist. This is the formal reason behind "always compare against a baseline and a couple of model families".

---

## 6.11 Framing a project like a professional (Géron, Ch. 2) 🟡 ⭐

> [!info] 📖 Géron Ch. 2 · “Look at the Big Picture” pp. 43–48; “Launch, Monitor, and Maintain” pp. 100–103

> [!quote] 💬 Say it in the interview
> “I frame a project by the decision it supports: objective, target definition, metric tied to value, baseline, constraints. Then I plan deployment and monitoring from day one.”

Géron's eight-step project outline. Memorise it; it is the answer to "walk me through how you would approach an ML problem":

```
1. Look at the big picture          5. Select a model and train it
2. Get the data                      6. Fine-tune your model
3. Explore and visualise the data    7. Present your solution
4. Prepare the data                  8. Launch, monitor, and maintain
```

### Step 1 in detail: the questions to ask before writing code

1. **What is the business objective?** The model is rarely the end goal. How will its output be used? This decides the framing, the algorithm, the metric, and how much tuning effort is justified.
2. **What does the current solution look like?** It gives you a performance reference (Géron's experts were off by more than 30%) and domain insight.
3. **What kind of problem is it?** Supervised or not; classification or regression; batch or online. Géron's housing case is a **multiple regression** (several features) and a **univariate regression** (one output per district). Predicting several outputs per row would be *multivariate* regression.
4. **Which performance measure?** (below)
5. **What assumptions are you making?** Verify them. Géron's example: if the downstream system only uses price *categories* (cheap/medium/expensive), the problem should be **classification**, and months of regression work would be wasted. *"You don't want to find this out after working on a regression system for months."*

Also from the chapter: ML systems are usually **pipelines of components** that talk through data stores. This is robust, since downstream components keep working on the last output, but a broken upstream component can go **unnoticed** without monitoring.

### Choosing the regression metric: RMSE vs MAE, and why norms matter

- **RMSE** corresponds to the **ℓ₂ (Euclidean) norm** of the error vector.
- **MAE** corresponds to the **ℓ₁ (Manhattan) norm**.
- In general, ‖v‖ₖ = (Σ|vᵢ|ᵏ)^(1/k). ℓ₀ counts non-zeros; ℓ∞ is the max absolute value.
- **The higher the norm index, the more it focuses on large values.** So RMSE is more outlier-sensitive than MAE. When outliers are exponentially rare (bell-shaped errors), RMSE works well and is preferred. When there are many outliers, prefer MAE.

### Get the data: notation Géron uses throughout

| Symbol | Meaning |
|---|---|
| m | number of instances |
| **x**⁽ⁱ⁾ | feature vector of instance i (column vector) |
| y⁽ⁱ⁾ | label of instance i |
| **X** | matrix of all features, one row per instance, row i = (**x**⁽ⁱ⁾)ᵀ |
| h | the prediction function, or *hypothesis*; ŷ⁽ⁱ⁾ = h(**x**⁽ⁱ⁾) |
| θ | model parameters |

Check the data's **provenance**: Géron's `median_income` was scaled and capped (0.5–15), and the *target* was capped at \$500k. A capped target means the model will learn that prices never exceed the cap. Either collect proper labels for the capped rows, or remove them from **both** train and test.

### Evaluate on the test set — with a confidence interval

A point estimate isn't enough when the new model is only slightly better than the one in production. Géron bootstraps a 95% confidence interval for the test RMSE:

```python
from scipy import stats
import numpy as np

def rmse(squared_errors):
    return np.sqrt(np.mean(squared_errors))

squared_errors = (final_predictions - y_test) ** 2
boot = stats.bootstrap([squared_errors], rmse,
                       confidence_level=0.95, random_state=42)
rmse_lower, rmse_upper = boot.confidence_interval   # ≈ 39,521 – 43,702
```

Two rules from the chapter:
- After heavy tuning, the test score is usually **slightly worse** than the CV score. **Do not tweak hyperparameters to improve the test number.** Those gains won't generalise.
- **Check fairness.** Slice the validation set by segment (rural/urban, rich/poor, region, and in telecom also pre-paid/post-paid, governorate, handset tier) and compare performance per slice. If a segment is badly served, either fix it or don't use the model for that segment.

### Present, launch, monitor, maintain

**Presenting** (Géron: this *"sets great data scientists apart from good ones"*): concise reports, key visuals, a message tailored to the audience, memorable statements (*"the median income is the number one predictor of housing prices"*), and honest notes on what worked, what didn't, the assumptions and the limitations.

**Reproducibility:** code in Git, a README, `requirements.txt` / `environment.yml` or a Docker image with pinned versions, fixed seeds.

**Deployment patterns:**
1. Load the `joblib` model inside the web app (load once at start-up, not per request). Custom classes and functions (`ClusterSimilarity`, `column_ratio`) must be importable in production, because pickle stores references, not code.
2. **Wrap the model in its own REST web service.** This lets you upgrade the model independently, scale with load balancing, and call it from any language (e.g. from ASP.NET).
3. A **managed cloud service** (Vertex AI, SageMaker, Azure ML) handles scaling for you.

**Monitoring:**
- Performance can fall **suddenly** (a broken component) or **slowly** (data drift). Slow decay is the dangerous one.
- Measure live performance through **downstream metrics** (e.g. recommended products sold) or through **human raters** on a sample, especially low-confidence predictions.
- **Monitor the inputs.** Alert when the missing-value rate rises, when a feature's mean/std drifts from training, or when a categorical feature shows new categories. Input monitoring catches problems before the performance metric does.

**Maintenance, automated:** collect and label fresh data; a scheduled script retrains and tunes; another script compares new vs old model on the updated test set **and on important slices**, and only promotes the new model if it is not worse. **Keep backups of every model and every dataset version** so you can roll back quickly and compare any model against any dataset.

Géron's summary: *"much of the work is in the data preparation step, building monitoring tools, setting up human evaluation pipelines, and automating regular model training"*. He also advises that it is better to know the whole process and three or four algorithms well than to chase exotic ones.

---

## 6.12 Fine-tuning at depth (Géron, Ch. 2) 🟡

> [!info] 📖 Géron Ch. 2 · “Fine-Tune Your Model” → “Evaluate on the Test Set” · pp. 94–100

### Reading Géron's model comparison

On California housing, he gets:

| Model | Training RMSE | 10-fold CV RMSE |
|---|---:|---:|
| Linear Regression | 68,973 | 70,003 ± 4,182 |
| Decision Tree | **0** | 66,573 ± 1,103 |
| Random Forest | 17,551 | 47,038 ± 1,021 |
| Random Forest, tuned | — | 43,590 |
| **Final model on test** | — | **41,445** (95% CI 39,521–43,702) |

Read it with the §6.4 table:
- Linear regression: train ≈ CV, both poor → **underfitting**.
- Decision tree: train 0, CV terrible → **severe overfitting**.
- Random Forest: much better, but train ≪ CV → still overfitting. Regularise or get more data.

Géron's advice: before tuning anything, **shortlist 2–5 promising models from different families** without spending long on each.

### Grid search over the *whole* pipeline

```python
full_pipeline = Pipeline([
    ("preprocessing", preprocessing),
    ("random_forest", RandomForestRegressor(random_state=42)),
])
param_grid = [
    {"preprocessing__geo__n_clusters": [5, 8, 10],
     "random_forest__max_features": [4, 6, 8]},
    {"preprocessing__geo__n_clusters": [10, 15],
     "random_forest__max_features": [6, 8, 10]},
]
grid_search = GridSearchCV(full_pipeline, param_grid, cv=3,
                           scoring="neg_root_mean_squared_error")
grid_search.fit(housing, housing_labels)
```

- The `param_grid` can be a **list of dicts**: 3×3 + 2×3 = 15 combinations × 3 folds = 45 fits.
- `preprocessing__geo__n_clusters` reaches **inside** the ColumnTransformer. Tune preprocessing and model together, because they interact.
- **If the best value is at the edge of the grid** (15 was the maximum tried), extend the grid in that direction.
- `refit=True` (the default) retrains the best configuration on the full training set. `grid_search.cv_results_` in a DataFrame shows every fold's score.

### Randomized search, halving search

`RandomizedSearchCV(n_iter=…)` samples from **distributions** (`scipy.stats.randint`, `loguniform`). Géron gives three reasons to prefer it:
1. With continuous hyperparameters it tries many distinct values instead of a few.
2. **An unimportant hyperparameter costs nothing extra.** In a grid, a useless 10-value hyperparameter makes the search 10× longer.
3. You control the budget directly (`n_iter`).

`HalvingGridSearchCV` / `HalvingRandomSearchCV` (successive halving) start many candidates with **limited resources** (a small sample, or few iterations), keep the best, and give them more resources each round. Optuna (Part 11) goes further with Bayesian optimisation and pruning.

### Ensembles and error analysis

- **Combine** your best models. Averaging models that make *different* errors reduces error; this is the whole idea of Part 8B.
- **Inspect the best model:** `feature_importances_`, then drop useless features (`SelectFromModel`).
- **Look at the specific errors** and ask why each happens. That points to new features, cleaning, or data collection.

---

> [!check] ✅ Key takeaways
> - Learning = hypothesis space + loss + optimiser; the goal is **generalisation**, not training score.
> - Gradient descent follows the negative gradient; the learning rate decides slow / converge / diverge.
> - Underfitting = high bias (both errors high); overfitting = high variance (big train–validation gap).
> - Use k-fold CV for model selection (stratified, grouped or time-based as the data demands) and touch the test set once.
> - Pick metrics from business costs and always compare against a dummy baseline.
> - Frame the problem first (objective, target, metric, baseline, constraints) and plan monitoring from day one.

## 6.13 Interview drill — ML fundamentals (Géron Ch. 1 exercises, answered) 🟢 ⭐

> [!info] 📖 Géron Ch. 1 · Exercises · p. 39

**1. Define machine learning.** Building systems that improve at a task by learning from data instead of hand-coded rules. Mitchell: performance P on task T improves with experience E.

**2. Four types of problem where ML shines.** Rule-heavy problems; complex problems with no algorithmic solution; changing environments that need adaptation; mining insight from large data.

**3. What is a labelled training set?** Examples paired with the desired output (label or target).

**4. The two most common supervised tasks?** Classification and regression.

**5. Four common unsupervised tasks?** Clustering, dimensionality reduction/visualisation, anomaly (and novelty) detection, association rule learning.

**6. A robot walking on unknown terrain?** Reinforcement learning.

**7. Segmenting customers?** Clustering if you don't know the groups; classification if you have labelled groups.

**8. Spam: supervised or unsupervised?** Supervised. Users provide spam/ham labels.

**9. Online learning?** Learning incrementally from a stream of instances or mini-batches, adapting to change quickly and cheaply.

**10. Out-of-core learning?** Training on data too large for memory by feeding chunks to an online algorithm.

**11. Which algorithms rely on a similarity measure?** Instance-based ones (KNN).

**12. Parameter vs hyperparameter?** A parameter is learned by the training algorithm (e.g. a weight). A hyperparameter belongs to the learning algorithm and is set before training (e.g. regularisation strength).

**13. What do model-based algorithms search for, and how do they predict?** Parameter values that minimise a cost function on the training set, usually by gradient-based or closed-form optimisation. They predict by feeding new features into the model function with the learned parameters.

**14. Four main challenges?** Too little data, non-representative data, poor-quality data, irrelevant features. On the model side: overfitting and underfitting. Plus deployment constraints.

**15. Great on training, poor on new data: what is happening, and three fixes?** Overfitting. More data; a simpler or more regularised model; fewer or better features; less noise.

**16. What is a test set for?** Estimating the generalisation error on data never used for training or selection.

**17. What is a validation set for?** Comparing models and tuning hyperparameters without touching the test set.

**18. Train-dev set?** A held-out slice of the *training distribution*. It separates overfitting from data mismatch when training data differs from production data.

**19. What goes wrong if you tune on the test set?** You overfit the test set. The reported error becomes optimistic and production performance disappoints.

**Extra questions that often follow:**

- *"How would you explain overfitting to a non-technical manager?"* The model memorised the exam answers instead of learning the subject. It aces the practice test and fails the real one.
- *"How do you know your model will still work in six months?"* It won't unless you monitor it. Track input drift (e.g. PSI/KS tests on key features), track live metrics against labels as they arrive, retrain on a schedule or on a drift trigger, and keep rollback ready.
- *"Why might a random train/test split be wrong?"* Time-ordered data (use a temporal split), grouped data (use GroupKFold on customer or account), or a production population that differs from the training population (data mismatch).
- *"What is the difference between a data scientist's and an MLOps engineer's job, according to Géron?"* Modelling (data, features, algorithms, evaluation) versus operating the model (deployment, scaling, monitoring, retraining, rollback). They need different skills, but a strong candidate understands both.

---

## 6.14 Real-world examples — foundations in the wild 🟡

| Case | Foundation it illustrates | Lesson to say in an interview |
|---|---|---|
| **Zillow Offers (2021)** — the home-buying arm shut down after a ~\$500M+ write-down when its price model kept overpaying as the market shifted | Distribution shift, overconfident point predictions | Monitor drift; use prediction intervals; a model is a decision system, not just an estimator |
| **Google Flu Trends (2008–2015)** — overestimated flu for several seasons | Spurious correlations, non-stationarity | Validate against ground truth continuously; correlation found in search data can drift |
| **Netflix Prize (2009)** — the \$1M winning ensemble was never fully put into production | Accuracy vs cost/complexity | Marginal accuracy gains must pay for their engineering cost |
| **Amazon recruiting model (2018)** — penalised CVs mentioning "women's" | Biased labels = biased model | Audit training labels and outcomes by group |
| **Telecom churn at e&-type operators** — a model trained on a random split scored AUC 0.92, but only 0.74 on next month's customers | Leakage + temporal validation | Always split by time for anything that will predict the future (§6.5, Part 16 §16.3) |
| **Kaggle "leak" competitions** (e.g., IDs correlated with the target) | Data leakage | If the score looks too good, hunt for leakage first |

→ More case studies: Part 25 §25.4.

---

## Further reading

- **MLU-Explain** — https://mlu-explain.github.io/ — the link from your own notes. Beyond linear regression it has excellent visual explainers on the bias–variance tradeoff, ROC curves, cross-validation, and random forests. Start here.
- **StatQuest with Josh Starmer** (YouTube) — the standard recommendation for intuition on every concept in this part. The bias–variance, ROC/AUC, and cross-validation videos are particularly good.
- **An Introduction to Statistical Learning** (ISLR), James, Witten, Hastie, Tibshirani — free PDF at https://www.statlearning.com/. Chapters 2 (assessing model accuracy), 3 (linear regression), 5 (resampling), 6 (regularisation). The Python edition (ISLP) exists now. **This is the single best book for the gap between this course and rigour.**
- **The Elements of Statistical Learning** (ESL), same authors — the graduate-level version. Free online. Reach for it when ISLR is not deep enough.
- **scikit-learn User Guide §3, "Model selection and evaluation"** — https://scikit-learn.org/stable/model_selection.html. The metrics page is the authoritative reference for everything in §6.6.
- **Andrew Ng, *Machine Learning Specialization*** (Coursera) — the gradient descent and bias/variance material is still the clearest structured treatment available.

---

<!-- nav -->
> [!example] 🧭 Step 8 of 26 · Stage 3 of 7: Classical ML
> ← [Part 15 · Statistics & A/B tests](15_Statistics_Probability_and_AB_Testing.md) · [Part 07 · Regression](07_Supervised_Regression.md) → · [Course map](00_START_HERE.md)
<!-- /nav -->
