# Part 7 — Supervised Learning: Regression

<!-- nav -->
> [!example] 🧭 Step 9 of 26 · Stage 3 of 7: Classical ML
> ← [Part 06 · ML foundations](06_ML_Foundations.md) · [Part 08 · Classification](08_Supervised_Classification.md) → · [Course map](00_START_HERE.md)
<!-- /nav -->

**Source:** `AI_notebooks/2026-01-01/ml_lr_knn_ecommerce_notebook.ipynb` (26 cells), `Ecommerce Customers.csv` **Lecture:** Lec 11

The notebook's own summary:

> **End-to-End Regression Notebook (Linear Regression + KNN)** Dataset: **Ecommerce Customers** Target variable: **Yearly Amount Spent**

This is the first notebook that is a *complete project* rather than a topic tour. Its structure is the template; the two algorithms are almost incidental.

<!-- interview-focus -->

> [!tip] 🎯 Interview focus
> **Why it matters:** Linear regression is the interviewer's favourite "explain it from scratch" model: assumptions, loss, regularisation and diagnostics.
>
> | Level | What you should be able to do |
> |---|---|
> | 🟢 **Entry** | Fit and evaluate a regression pipeline; RMSE vs MAE vs R²; the normal equation vs gradient descent; Ridge vs Lasso; polynomial features. |
> | 🟡 **Mid** | Read learning curves; choose regularisation strength by CV; early stopping; interpret coefficients carefully (scaling, collinearity); log-transform skewed targets. |
> | 🔴 **Senior** | Heteroscedasticity, prediction intervals, causal vs predictive use of coefficients, marketing-mix and pricing models. |
>
> **⭐ Most-asked:** *What are the assumptions of linear regression?* · *Ridge vs Lasso — which one does feature selection, and why?* · *RMSE vs MAE — when do you prefer each?* · *Normal equation vs gradient descent?* · *Your training error is low and validation error is high — what next?*
>
> **⏱ Time:** 4 h  ·  **Short on time?** Read §7.8, §7.14, §7.16, §7.17, §7.19.

**Legend:** 🟢 Entry (0–2 yrs) · 🟡 Mid (2–5 yrs) · 🔴 Senior / specialist · ⭐ frequently asked · 📖 Géron, *Hands-On ML with Scikit-Learn and PyTorch* (2025) pages

> [!abstract]- 🗺️ Section map — level and book pages
>
> | § | Section | Level | 📖 Book |
> |---|---|:---:|---|
> | 7.1 | The problem | 🟢 | — |
> | 7.2 | Setup and data quality | 🟢 | — |
> | 7.3 | Feature selection, and why identifiers must go | 🟢 ⭐ | — |
> | 7.4 | EDA | 🟢 | — |
> | 7.5 | Split — and note where it sits | 🟢 ⭐ | — |
> | 7.6 | A custom transformer | 🟡 | Ch. 2 · pp. 81–86 |
> | 7.7 | The preprocessing pipeline | 🟢 | — |
> | 7.8 | Model 1 — Linear Regression | 🟢 ⭐ | — |
> | 7.9 | Cross-validation | 🟢 ⭐ | Ch. 2 · pp. 92–94 |
> | 7.10 | Model 2 — K-Nearest Neighbours Regressor | 🟢 | — |
> | 7.11 | Comparing the two | 🟢 | — |
> | 7.12 | Saving artifacts | 🟢 | — |
> | 7.13 | What this notebook establishes | 🟢 | — |
> | 7.14 | How linear models are actually trained | 🟢 ⭐ | Ch. 4 · pp. 136–153 |
> | 7.15 | Polynomial regression — curves with a linear model | 🟢 | Ch. 4 · p. 153 |
> | 7.16 | Learning curves — the diagnostic you should draw | 🟡 ⭐ | Ch. 4 · pp. 154–159 |
> | 7.17 | Regularised linear models: Ridge, Lasso, Elastic Net | 🟢 ⭐ | Ch. 4 · pp. 159–166 |
> | 7.18 | Early stopping — Hinton's "beautiful free lunch" | 🟢 | Ch. 4 · pp. 166–167 |
> | 7.19 | Interview drill — regression and training | 🟢 ⭐ | Ch. 4 · p. 177 |
> | 7.20 | Real-world examples — regression at work | 🟡 | — |
>

---

## 7.1 The problem 🟢

Predict how much a customer will spend per year, from features like session length, time on app, time on website, and length of membership. Continuous target → regression.

---

## 7.2 Setup and data quality 🟢

```python
import numpy as np, pandas as pd
from pathlib import Path
import matplotlib.pyplot as plt, seaborn as sns
from sklearn.base import BaseEstimator, TransformerMixin
from sklearn.model_selection import train_test_split, GridSearchCV, KFold, cross_validate
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.linear_model import LinearRegression
from sklearn.neighbors import KNeighborsRegressor
from sklearn.metrics import mean_squared_error, r2_score
import joblib
```

Worth pausing on that import list — it is the entire working vocabulary of applied ML in one cell. Splitters, transformers, a column router, two estimators, two metrics, and persistence.

```python
df = pd.read_csv(DATA_PATH)

n_dups = df.duplicated().sum()
nulls  = df.isna().sum().sort_values(ascending=False)
df.dtypes
df.describe(include="all").T
df.describe(include='O')
```

`describe(include="all")` covers numeric and categorical in one table (with `NaN` where a statistic does not apply). Transposing makes it readable.

---

## 7.3 Feature selection, and why identifiers must go 🟢 ⭐

> [!quote] 💬 Say it in the interview
> “I drop identifiers and anything known only after the target. IDs let a model memorise rows and don't generalise.”

> - `Email` and `Address` are usually **unique identifiers** (high-cardinality) and tend to add noise.
> - We will **drop** them for modeling.
> - `Avatar` is categorical and can be one-hot encoded.

```python
TARGET = "Yearly Amount Spent"
drop_cols = ["Email", "Address"]

X = df.drop(columns=[TARGET] + drop_cols)
y = df[TARGET].copy()

num_cols = X.select_dtypes(include="number").columns.tolist()
cat_cols = X.select_dtypes(include=["object", "category", "bool"]).columns.tolist()
```

**Why identifiers hurt.** A column with one distinct value per row cannot generalise. A tree can split on it and achieve perfect training accuracy by memorising; a one-hot encoding of it produces n columns of a single 1 each. Either way you get overfitting dressed as signal.

The notebook's aside is a genuinely good exercise:

> If you want to experiment later, you can try engineered features from `Address` so this will be your H.W to make FE

An address is not useless — it contains a city, a postcode, a country. Those are low-cardinality and potentially predictive. The raw string is useless; a feature *extracted* from it may not be. That distinction is most of what feature engineering is.

---

## 7.4 EDA 🟢

```python
# Univariate — numeric distributions
for col in num_cols + [TARGET]:
    plt.figure(figsize=(6, 4))
    sns.histplot(data=df, x=col, bins=25, kde=True)
    plt.title(f"Distribution: {col}")
    plt.show()

# Categorical frequencies (top 20)
for col in cat_cols:
    top = X[col].value_counts().head(20)
    plt.figure(figsize=(8, 4))
    sns.barplot(x=top.index, y=top.values)
    plt.xticks(rotation=90)
    plt.show()

# Bivariate — each numeric feature against the target
for col in num_cols:
    plt.figure(figsize=(6, 4))
    plt.scatter(df[col], df[TARGET], alpha=0.7)
    plt.xlabel(col); plt.ylabel(TARGET)
    plt.show()

# Correlation
corr_df = df[num_cols + [TARGET]].corr()
sns.heatmap(corr_df, annot=True, fmt=".2f", cmap="coolwarm")
```

The looping pattern is the point: **look at every feature, do not cherry-pick**. `alpha=0.7` on the scatter handles overplotting — with 500 points, opaque markers hide density.

On this dataset the bivariate plots show `Length of Membership` with a strong linear relationship to spend, and `Time on Website` with almost none — which is a genuinely interesting business finding before any model is fitted.

---

## 7.5 Split — and note where it sits 🟢 ⭐

```python
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=RANDOM_STATE)

print("Train:", X_train.shape, "Test:", X_test.shape)
```

The split happens **after** EDA and **before** any preprocessing. That ordering is deliberate and correct:

- EDA on the full data is acceptable (you are looking, not fitting) — though strict practice does EDA on train only, to avoid your own knowledge of the test set biasing your feature choices.
- Preprocessing after the split is **mandatory**, and the pipeline enforces it.

No `stratify` here, because this is regression — there are no classes to stratify.

---

## 7.6 A custom transformer 🟡

> [!info] 📖 Géron Ch. 2 · “Custom Transformers” · pp. 81–86

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

    def transform(self, X):
        return np.clip(np.asarray(X, dtype=float), self.lower_, self.upper_)
```

This is where Part 1's OOP earns its place. The scikit-learn transformer contract is small:

1. **Inherit** from `BaseEstimator` (gives you `get_params`/`set_params`, which is what makes `GridSearchCV` able to tune your object) and `TransformerMixin` (gives you `fit_transform` for free).
2. **`__init__`** stores hyperparameters only. No computation, no validation, and the parameter names must match the attribute names exactly — sklearn's cloning machinery depends on it.
3. **`fit`** learns from data and stores results in attributes with a **trailing underscore** (`self.lower_`). That convention is not decorative: it is how sklearn's `check_is_fitted` decides whether an estimator has been fitted.
4. **`fit` returns `self`** — so that `.fit(X).transform(X)` chains.
5. **`transform`** applies the stored parameters. It must not learn anything.

The result drops into any pipeline and is automatically leak-free: fences learned on the training fold, applied unchanged everywhere else.

`np.nanpercentile` rather than `np.percentile` because NaNs may still be present depending on step order — though here imputation runs first.

---

## 7.7 The preprocessing pipeline 🟢

```python
numeric_pipe = Pipeline(steps=[
    ("imputer", SimpleImputer(strategy="median")),
    ("clip",    IQRClipper(factor=1.5)),      # outlier handling
    ("scaler",  StandardScaler())
])

categorical_pipe = Pipeline(steps=[
    ("imputer", SimpleImputer(strategy="most_frequent")),
    ("onehot",  OneHotEncoder(handle_unknown="ignore"))
])

preprocessor = ColumnTransformer(transformers=[
    ("num", numeric_pipe, num_cols),
    ("cat", categorical_pipe, cat_cols)
])
```

**The order within `numeric_pipe` is not arbitrary:**

1. **Impute first** — the clipper and scaler cannot handle NaN.
2. **Clip second** — remove outlier leverage *before* computing the mean and σ, so the scaler is not itself distorted by the outliers.
3. **Scale last** — the model sees standardised features.

Swap steps 2 and 3 and the scaler's statistics are computed on the un-clipped data, which partially defeats the purpose.

`handle_unknown="ignore"` means an unseen category at predict time encodes as all-zeros rather than raising. Essential for production.

---

## 7.8 Model 1 — Linear Regression 🟢 ⭐

> [!quote] 💬 Say it in the interview
> “Linear regression assumes linearity, independent errors, constant variance and no severe multicollinearity. I check residual plots rather than trusting R² alone.”

```python
lr_pipe = Pipeline(steps=[
    ("preprocess", preprocessor),
    ("model", LinearRegression())
])

lr_pipe.fit(X_train, y_train)

y_pred_train_lr = lr_pipe.predict(X_train)
rmse_train_lr = np.sqrt(mean_squared_error(y_train, y_pred_train_lr))
r2_train_lr   = r2_score(y_train, y_pred_train_lr)

y_pred_test_lr = lr_pipe.predict(X_test)
rmse_test_lr = np.sqrt(mean_squared_error(y_test, y_pred_test_lr))
r2_test_lr   = r2_score(y_test, y_pred_test_lr)
```

**The model.** `ŷ = w·x + b`, fitted by minimising MSE. sklearn solves it in closed form (via SVD, which is numerically stabler than inverting `XᵀX` directly).

**Its assumptions**, which the course does not enumerate but which you should know because violating them invalidates the inference (though not necessarily the prediction):

1. **Linearity** — the relationship between features and target really is linear.
2. **Independence** — observations are independent. Violated by time series and by repeated measures.
3. **Homoscedasticity** — error variance is constant across the range of predictions. Check by plotting residuals against fitted values: a funnel shape means trouble.
4. **Normality of residuals** — needed for confidence intervals, not for the point predictions.
5. **No perfect multicollinearity** — see §2.8 and the VIF check in Part 13.

**Its strengths:** fast, deterministic, and **interpretable**. Each coefficient reads as "holding everything else constant, a one-unit increase in this feature changes the prediction by `w`". Nothing else in this course gives you that so directly.

**Its weakness:** it can only fit a hyperplane. Curvature must be supplied manually (`x²`, `log x`, interaction terms) or you need a different model.

**Note that both train and test metrics are computed** — the bias/variance diagnostic from §6.4. Similar train and test RMSE means no overfitting; a large gap means it.

---

## 7.9 Cross-validation 🟢 ⭐

> [!info] 📖 Géron Ch. 2 · “Better Evaluation Using Cross-Validation” · pp. 92–94

> [!quote] 💬 Say it in the interview
> “I cross-validate the whole pipeline and report mean ± std RMSE, so the preprocessing is refitted inside every fold.”

```python
cv = KFold(n_splits=5, shuffle=True, random_state=RANDOM_STATE)

cv_scores = cross_validate(
    lr_pipe, X, y, cv=cv,
    scoring={"rmse": "neg_root_mean_squared_error", "r2": "r2"},
    return_train_score=True
)
```

`KFold` (not `StratifiedKFold`) because this is regression.

`shuffle=True` matters: without it, `KFold` takes contiguous blocks. If the CSV happens to be sorted by anything meaningful, unshuffled folds are systematically different from each other and your CV estimate is biased.

`return_train_score=True` gives you the train/test comparison in every fold, not just once.

The `neg_` prefix — sklearn negates error metrics so that "higher is better" holds universally. Your RMSE will print negative; take the absolute value when reporting.

---

## 7.10 Model 2 — K-Nearest Neighbours Regressor 🟢

### How it works

KNN is the simplest possible learning algorithm, and it is instructive precisely because of that. To predict for a new point:

1. Compute the distance from it to every training point.
2. Take the k closest.
3. Return the **mean of their target values** (for regression; the majority vote for classification).

There is no training phase. `fit()` just stores the data — hence the term **lazy learner** or *instance-based* learning. All the work happens at prediction time, which inverts the usual cost profile: instant training, slow inference.

### Tuning it

```python
param_grid = {
    "model__n_neighbors": [3, 5, 7, 9, 11],
    "model__weights": ["uniform", "distance"],
    "model__p": [1, 2]                       # Manhattan / Euclidean
}

grid = GridSearchCV(
    estimator=knn_pipe,
    param_grid=param_grid,
    scoring="neg_root_mean_squared_error",
    cv=5,
    n_jobs=-1
)
grid.fit(X_train, y_train)
best_knn_pipe = grid.best_estimator_
```

The three hyperparameters, and what each controls:

**`n_neighbors` (k)** — the bias/variance dial in its purest form:

- **k = 1** — the prediction is whatever the single nearest neighbour says. Zero training error, maximum variance. Textbook overfitting.
- **k = n** — every prediction is the global mean. Maximum bias, zero variance.
- The optimum is in between and must be found empirically. This is §6.4 made concrete and tunable.

**`weights`**:
- `"uniform"` — all k neighbours vote equally.
- `"distance"` — vote weight is 1/distance, so nearer neighbours count more. Usually better, and it makes the choice of k less critical.

**`p`** — the Minkowski distance exponent:
- `p=1` — **Manhattan** distance, `Σ|xᵢ − yᵢ|`. Sum of axis-aligned steps.
- `p=2` — **Euclidean** distance, `√Σ(xᵢ − yᵢ)²`. Straight line.

Manhattan is often better in high dimensions, where Euclidean distances concentrate (all points become roughly equidistant).

### KNN's requirements and limits

- **Scaling is mandatory.** KNN is distance-based; an unscaled large-range feature dominates the metric entirely. The pipeline handles this.
- **The curse of dimensionality.** In high dimensions, the volume of space grows so fast that "nearest" stops meaning "similar" — the ratio between the nearest and farthest neighbour approaches 1. KNN degrades badly beyond a few dozen informative features. This is also the motivation for PCA in Part 9.
- **Memory and inference cost.** The entire training set must be kept, and each prediction is O(n) without a spatial index (sklearn uses KD-trees/ball-trees to help in low dimensions).
- **No interpretability.** There are no coefficients. You can inspect which neighbours drove a prediction, which is a kind of case-based explanation, but nothing global.

**Why teach it at all?** Because it makes explicit what every model does implicitly: predict from similar past examples. And because it has no assumptions about functional form, it can capture non-linearity that linear regression cannot — a useful contrast on the same dataset.

---

## 7.11 Comparing the two 🟢

```python
def plot_actual_vs_pred_sns(y_true, y_pred, title):
    plot_df = pd.DataFrame({"Actual": y_true, "Predicted": y_pred})
    plt.figure(figsize=(6, 5))
    sns.scatterplot(data=plot_df, x="Actual", y="Predicted", alpha=0.7)
    # perfect line y = x
    mn = min(plot_df["Actual"].min(), plot_df["Predicted"].min())
    mx = max(plot_df["Actual"].max(), plot_df["Predicted"].max())
    plt.plot([mn, mx], [mn, mx], linestyle="--")
    plt.title(title)
```

**The actual-vs-predicted plot with a y = x reference line** is the standard regression diagnostic. Read it like this:

- Points tight on the line → good fit.
- A systematic bend → the model is missing non-linearity.
- A funnel widening to the right → heteroscedasticity; consider log-transforming the target.
- Points flattening at the extremes → the model is regressing toward the mean, common with KNN at the edges of the data.

Its companion, which the notebook omits, is the **residual plot** — `y − ŷ` against `ŷ`. Residuals should be a structureless cloud centred on zero. **Any visible pattern is signal you failed to capture.**

On this dataset linear regression typically wins comfortably (R² around 0.98), because the underlying relationship genuinely is close to linear. That is the right lesson: **more complex is not better.** KNN's flexibility buys nothing here and costs interpretability and inference speed.

---

## 7.12 Saving artifacts 🟢

```python
out_dir = Path("artifacts")
out_dir.mkdir(exist_ok=True)

# 1) Save models (pipeline = preprocessing + model)
joblib.dump(lr_pipe,       out_dir / "linear_regression.joblib")
joblib.dump(best_knn_pipe, out_dir / "knn_model.joblib")

# 2) Save evaluation results
results = {
    "Linear Regression": {"RMSE": rmse_test_lr,  "R2": r2_test_lr},
    "KNN (Best)":        {"RMSE": rmse_test_knn, "R2": r2_test_knn},
}
```

The comment says the important thing: **pipeline = preprocessing + model.** One file contains the imputer's medians, the clipper's fences, the scaler's μ and σ, the encoder's vocabulary, and the fitted coefficients.

Contrast with the alternative — saving the model alone and rebuilding preprocessing at inference. That requires keeping two artifacts in sync forever, and the day they drift is the day your production predictions become quietly wrong. **This is the classic ML deployment bug, and pipelines eliminate it structurally.**

### Inference demo

```python
lr_loaded  = joblib.load(Path("artifacts") / "linear_regression.joblib")
knn_loaded = joblib.load(Path("artifacts") / "knn_model.joblib")

sample = X_test.iloc[:5].copy()
preds_lr  = lr_loaded.predict(sample)
preds_knn = knn_loaded.predict(sample)

display(pd.DataFrame({
    "pred_lr":  preds_lr,
    "pred_knn": preds_knn,
    "actual":   y_test.iloc[:5].values
}))
```

Note what `sample` is: **raw, unprocessed DataFrame rows**, same schema as training. The pipeline does everything else. That is exactly the contract you want at an API boundary — and given your ASP.NET background, this is where a FastAPI or Flask endpoint would sit: JSON in → DataFrame → `pipeline.predict` → JSON out.

Also useful:

```python
print(lr_pipe.feature_names_in_)
```

The pipeline records the exact column names it was fitted on, and will complain if you hand it something different. Free schema validation.

⚠️ **`joblib` caveats for production:** the pickle format is version-sensitive — a model saved under sklearn 1.3 may not load under 1.5, and may load *incorrectly* rather than failing loudly. Pin your library versions alongside the artifact. And never unpickle a file from an untrusted source; pickle can execute arbitrary code on load.

---

## 7.13 What this notebook establishes 🟢

| Step | Why it is here |
|---|---|
| Duplicate/null/dtype audit | Never model data you have not inspected |
| Drop identifiers | They only enable memorisation |
| Loop the EDA over every column | No cherry-picking |
| Split before preprocessing | The leakage rule |
| Custom transformer | Preprocessing steps are learned parameters too |
| `Pipeline` + `ColumnTransformer` | Makes leakage structurally impossible |
| Train **and** test metrics | Diagnose bias vs variance |
| `cross_validate` | One split is one sample |
| `GridSearchCV` with `model__` prefix | Tune inside the pipeline |
| Two models compared | Complexity must earn its place |
| Actual-vs-predicted plot | Look at the errors, not just the summary |
| `joblib.dump(pipeline)` | Ship preprocessing and model together |

That checklist is transferable to any regression problem you will meet.

---

## 7.14 How linear models are actually trained (Géron, Ch. 4) 🟢 ⭐

> [!info] 📖 Géron Ch. 4 · “Linear Regression” → “Mini-Batch Gradient Descent” · pp. 136–153

> [!quote] 💬 Say it in the interview
> “The normal equation solves for θ in one step but costs O(n³) in the number of features. Gradient descent scales to many features and rows, which is why every large model uses it.”

> [!note] 📘 From the book
> Sections 7.14–7.19 add material from Géron's *Hands-On Machine Learning* (2025), Chapter 4 "Training Models". Géron's reason for opening the black box: understanding it *"can help you quickly home in on the appropriate model, the right training algorithm to use, and a good set of hyperparameters"*, and debug faster. Everything here carries over directly to neural networks in Part 11.

### 7.14.1 The model, in Géron's notation

> **ŷ = θ₀ + θ₁x₁ + θ₂x₂ + … + θₙxₙ = θᵀx**   (with x₀ = 1 so that θ₀ is the bias)

It is trained by minimising **MSE(θ) = (1/m) Σ (θᵀx⁽ⁱ⁾ − y⁽ⁱ⁾)²**. Minimising MSE gives the same θ as minimising RMSE, and it is simpler to differentiate.

⚠️ Géron's point about **loss vs metric**: the loss you *train* on often differs from the metric you *evaluate* with. A good metric is close to the business objective. A good training loss is easy to optimise and strongly correlated with the metric. Classifiers train on log-loss and are judged on precision/recall. The regularisation term exists only during training; evaluate with the *unregularised* metric.

### 7.14.2 Closed form: the Normal Equation

> **θ̂ = (XᵀX)⁻¹ Xᵀ y**

```python
import numpy as np
from sklearn.preprocessing import add_dummy_feature

rng = np.random.default_rng(seed=42)
m = 200
X = 2 * rng.random((m, 1))
y = 4 + 3 * X + rng.standard_normal((m, 1))   # true θ₀=4, θ₁=3, plus noise

X_b = add_dummy_feature(X)                     # prepend x₀ = 1
theta_best = np.linalg.inv(X_b.T @ X_b) @ X_b.T @ y
# ≈ [[3.69], [3.33]]  — noise prevents exact recovery of 4 and 3
```

What `LinearRegression` really does: it calls `scipy.linalg.lstsq`, which computes **θ̂ = X⁺y** using the **Moore-Penrose pseudoinverse** X⁺ = VΣ⁺Uᵀ from the **SVD** X = UΣVᵀ. Why this is better than inverting XᵀX:
- It is **always defined**, even when XᵀX is singular (more features than rows, or perfectly collinear features). Tiny singular values are zeroed rather than inverted.
- It is numerically more stable.

**Computational complexity**, a favourite interview question:

| Method | Cost in n (features) | Cost in m (rows) | Out-of-core? |
|---|---|---|---|
| Normal equation | O(n^2.4) to O(n³) (double n → 5.3× to 8× slower) | O(m) | No |
| SVD (`LinearRegression`) | O(n²) (double n → 4× slower) | O(m) | No |
| Batch GD | Fast | Slow (full pass per step) | No |
| Stochastic GD | Fast | Fast | **Yes** |
| Mini-batch GD | Fast | Fast | **Yes** |

**Prediction** is O(m·n) for every method, which is linear and fast. All methods end at nearly the same model; they differ only in how they get there.

**Rule of thumb:** at around 100,000+ features the closed forms become impractical and gradient descent wins. With millions of rows that don't fit in memory, use SGD or mini-batch GD out-of-core.

### 7.14.3 Gradient descent, precisely

The **gradient vector** of the MSE, all partial derivatives at once:

> **∇θ MSE(θ) = (2/m) Xᵀ(Xθ − y)**

> **θ(next) = θ − η ∇θ MSE(θ)**   (η = learning rate)

```python
eta, n_epochs = 0.1, 1000
theta = rng.standard_normal((2, 1))            # random initialisation
for epoch in range(n_epochs):
    gradients = 2 / m * X_b.T @ (X_b @ theta - y)
    theta = theta - eta * gradients
# converges to exactly the Normal-equation answer [[3.69], [3.33]]
```

Facts Géron emphasises:
- The **MSE of linear regression is convex** (the chord between any two points never goes below the curve) and its slope never changes abruptly. GD is therefore **guaranteed** to approach the global minimum, given a suitable η and enough time.
- **Unscaled features** make the bowl *elongated*. GD first heads almost perpendicular to the minimum, then marches along a flat valley. **Always scale before GD.**
- Training is a **search in parameter space**. More parameters mean more dimensions and a harder search.
- **Stopping:** set many epochs and stop when the gradient norm falls below a tolerance ε. Convergence can take O(1/ε) iterations: 10× the precision costs about 10× the time.
- **Local minima and plateaus** exist for non-convex losses (neural networks). A bad random start can land in a local minimum, or take forever to cross a plateau.

**Stochastic GD**: one random instance per step.

```python
n_epochs, t0, t1 = 50, 5, 50
def learning_schedule(t):
    return t0 / (t + t1)                          # decaying learning rate

theta = rng.standard_normal((2, 1))
for epoch in range(n_epochs):
    for iteration in range(m):
        i = rng.integers(m)
        xi, yi = X_b[i:i+1], y[i:i+1]
        gradients = 2 * xi.T @ (xi @ theta - yi)   # no /m: one instance
        eta = learning_schedule(epoch * m + iteration)
        theta = theta - eta * gradients
# ≈ [[3.70], [3.31]] after only 50 epochs (book: 3.698, 3.307)
```

- The cost **bounces** and decreases only on average. It never fully settles at the minimum, but the noise **helps escape local minima**.
- A **learning schedule** (simulated annealing) resolves this: big steps early, small steps late. Decay too fast and you freeze halfway; decay too slow and you keep jumping around.
- **Instances must be IID, so shuffle.** If data is sorted by label, SGD optimises for one label, then the next, and never settles.

```python
from sklearn.linear_model import SGDRegressor
sgd_reg = SGDRegressor(max_iter=1000, tol=1e-5, penalty=None, eta0=0.01,
                       n_iter_no_change=100, random_state=42)
sgd_reg.fit(X, y.ravel())                      # y must be 1-D
```

`partial_fit()` runs one round of training on the data you pass (for streaming or out-of-core use). `warm_start=True` makes `fit()` continue from the current parameters. `fit()` resets the learning-schedule counter; `partial_fit()` does not.

**Mini-batch GD**: a small random batch per step. It gets **hardware acceleration** (vectorised matrix operations on GPUs) and is less erratic than SGD, so it ends closer to the minimum, though it is slightly worse at escaping local minima. It is the standard for neural networks (Part 11).

---

## 7.15 Polynomial regression — curves with a linear model 🟢

> [!info] 📖 Géron Ch. 4 · “Polynomial Regression” · p. 153

A linear model can fit non-linear data if you **add powers of the features as new features**:

```python
from sklearn.preprocessing import PolynomialFeatures

X = 6 * rng.random((m, 1)) - 3
y = 0.5 * X**2 + X + 2 + rng.standard_normal((m, 1))   # a quadratic with noise

poly_features = PolynomialFeatures(degree=2, include_bias=False)
X_poly = poly_features.fit_transform(X)    # [x, x²]
lin_reg = LinearRegression().fit(X_poly, y)
# intercept ≈ 2.01, coefs ≈ [1.11, 0.51]  (true: 2, 1, 0.5)
```

The model is still **linear in its parameters**, which is why it is called linear regression even though the curve bends.

With several features, `PolynomialFeatures` also creates **interaction terms**. With features a, b and `degree=3` you get a², a³, b², b³, **ab, a²b, ab²**. That is how a linear model captures feature interactions.

⚠️ **Combinatorial explosion:** n features at degree d produce **(n+d)! / (d!·n!)** columns. 20 features at degree 3 already give 1,771. Always scale after expanding, and regularise.

---

## 7.16 Learning curves — the diagnostic you should draw 🟡 ⭐

> [!info] 📖 Géron Ch. 4 · “Learning Curves” · pp. 154–159

![Learning curves diagnose underfitting (both errors high) vs overfitting (a big gap).](figures/fig07_learning_curves.png)
*Learning curves diagnose underfitting (both errors high) vs overfitting (a big gap).*

> [!quote] 💬 Say it in the interview
> “Learning curves show error against training-set size. Two high curves close together = underfitting; a persistent gap = overfitting, where more data helps.”

**Learning curves** plot training and validation error against **training-set size** (or training iteration). They show *why* a model is failing.

```python
from sklearn.model_selection import learning_curve

train_sizes, train_scores, valid_scores = learning_curve(
    LinearRegression(), X, y, train_sizes=np.linspace(0.01, 1.0, 40), cv=5,
    scoring="neg_root_mean_squared_error")
train_errors = -train_scores.mean(axis=1)
valid_errors = -valid_scores.mean(axis=1)
plt.plot(train_sizes, train_errors, "r-+", label="train")
plt.plot(train_sizes, valid_errors, "b-", label="valid")
```

**The two signatures to recognise:**

```
UNDERFITTING (linear model on quadratic data)      OVERFITTING (degree-10 polynomial)

error                                              error
  │ ╲ valid                                          │ ╲ valid
  │  ╲___________________                            │  ╲__________
  │  ___________________  ← both plateau,            │             ‾‾‾‾‾‾‾‾‾‾‾ ← gap
  │ ╱  train              close together and HIGH    │  ______________________
  │╱                                                 │ ╱ train (LOW)
  └──────────── training set size                    └──────────── training set size
```

| Pattern | Diagnosis | What helps | What does **not** help |
|---|---|---|---|
| Both curves plateau **close together** at a **high** error | **Underfitting / high bias** | Better model, better features, less regularisation | **More data**: Géron says adding examples will not help |
| Training error **low**, a **gap** to validation error | **Overfitting / high variance** | **More data** (the curves converge as m grows), regularisation, a simpler model | — |

Why the training curve starts at 0: with one or two points, any model fits perfectly. As points are added, noise and non-linearity make a perfect fit impossible and the error rises to a plateau.

`learning_curve(..., exploit_incremental_learning=True)` uses `partial_fit` for models that support it.

**This answers a classic interview question:** *"Would getting more data help this model?"* Draw the learning curve. If the validation error is still falling and there is a gap, yes. If both curves are flat and close, no: improve the model or the features.

### The bias/variance decomposition, Géron's version

Generalisation error = **Bias²** (wrong assumptions, e.g. linear for quadratic data → underfit) + **Variance** (excessive sensitivity to small changes in the training data, e.g. a high-degree polynomial → overfit) + **Irreducible error** (noise in the data itself. The only fix is cleaner data: repair sensors, remove bad records).

More complexity → lower bias, higher variance. More regularisation → higher bias, lower variance. Hence the **trade-off**.

---

## 7.17 Regularised linear models: Ridge, Lasso, Elastic Net 🟢 ⭐

> [!info] 📖 Géron Ch. 4 · “Regularized Linear Models” · pp. 159–166

![Ridge shrinks every coefficient; Lasso zeroes some of them out.](figures/fig07_regularization_paths.png)
*Ridge shrinks every coefficient; Lasso zeroes some of them out.*

> [!quote] 💬 Say it in the interview
> “Ridge (ℓ2) shrinks all coefficients; Lasso (ℓ1) sets some exactly to zero, so it does feature selection; Elastic Net mixes both and is safer with correlated features. Scale first and tune α by CV.”

This closes the course gap flagged in Part 14. The idea: **constrain the weights**. Fewer effective degrees of freedom means less overfitting. (For polynomial models, the crude version is just lowering the degree.)

### Ridge (ℓ₂, Tikhonov)

> **J(θ) = MSE(θ) + (α/m) Σᵢ₌₁ⁿ θᵢ²**

- **The bias θ₀ is not regularised** (the sum starts at i = 1).
- α = 0 is plain linear regression. Very large α pushes all weights toward 0, giving a **flat line through the mean**.
- Closed form: **θ̂ = (XᵀX + αA)⁻¹ Xᵀy**, where A is the identity with a 0 in the bias position. The **+αA also makes the matrix invertible**, which is why Ridge handles multicollinearity.
- **Scale first.** The penalty depends on scale.
- Increasing α makes predictions flatter and more reasonable: **less variance, more bias**.

```python
from sklearn.linear_model import Ridge, RidgeCV
ridge_reg = Ridge(alpha=0.1, solver="cholesky").fit(X, y)
ridge_cv = RidgeCV(alphas=np.logspace(-3, 3, 20)).fit(X, y)   # efficient built-in CV
# SGD equivalent: SGDRegressor(penalty="l2", alpha=0.1 / m)   ← note the /m
```

### Lasso (ℓ₁)

> **J(θ) = MSE(θ) + 2α Σᵢ₌₁ⁿ |θᵢ|**

(The factors α/m for Ridge and 2α for Lasso are chosen so that the best α does not depend on the training-set size.)

**The key property: Lasso drives the weights of the least important features to *exactly zero*.** It performs **automatic feature selection** and returns a **sparse** model. In Géron's degree-10 polynomial example, Lasso with α = 0.01 zeroes all the high-degree terms and leaves a roughly cubic curve.

**Why ℓ₁ gives exact zeros and ℓ₂ does not.** This is the geometric argument interviewers want:
- The ℓ₁ penalty's gradient has **constant magnitude** (sign(θᵢ) = ±1) however small θᵢ gets. It keeps pushing each weight toward 0 at the same rate, so small weights *reach* 0 and stay there. The optimum then "rolls down the gutter" along an axis.
- The ℓ₂ penalty's gradient is **proportional to θᵢ**. It weakens as a weight shrinks, so weights approach 0 asymptotically and never get there.
- Equivalently, in constrained form the ℓ₁ constraint region is a **diamond with corners on the axes**. The loss contours usually first touch it **at a corner**, where some coordinates are 0. The ℓ₂ region is a **circle**, with no corners.

Practical consequences:
- Lasso is not differentiable at θᵢ = 0. GD uses the **subgradient** (sign(0) = 0). Because its gradient never shrinks, Lasso **bounces around the optimum** unless you decay the learning rate. Ridge naturally slows down near the optimum.
- **Too large an α** gives a very sparse model whose performance collapses.

```python
from sklearn.linear_model import Lasso, LassoCV
lasso_reg = Lasso(alpha=0.1).fit(X, y)       # or SGDRegressor(penalty="l1", alpha=0.1)
```

### Elastic Net

> **J(θ) = MSE(θ) + r·(2α Σ|θᵢ|) + (1−r)·(α/m Σθᵢ²)**

The mix ratio r (`l1_ratio`) gives Ridge at r = 0 and Lasso at r = 1.

```python
from sklearn.linear_model import ElasticNet
elastic_net = ElasticNet(alpha=0.1, l1_ratio=0.5).fit(X, y)
```

### Which one? Géron's recommendation

1. **Avoid plain `LinearRegression`.** *"It is almost always preferable to have at least a little bit of regularization."*
2. **Ridge is a good default.**
3. If you suspect **only a few features matter**, use **Lasso or Elastic Net** for sparsity.
4. **Prefer Elastic Net over Lasso** when **features outnumber samples (n > m)** or when several features are **strongly correlated**. Lasso behaves erratically there, often picking one of a correlated group arbitrarily.

| | Ridge (ℓ₂) | Lasso (ℓ₁) | Elastic Net |
|---|---|---|---|
| Shrinks weights | Yes, smoothly | Yes, some to exactly 0 | Both |
| Feature selection | No | **Yes** | Yes |
| Correlated features | Spreads weight across the group | Picks one, unstably | Keeps groups together |
| n > m | Fine | Selects at most m features; erratic | **Best** |
| Closed form | Yes | No (coordinate descent) | No |
| sklearn strength knob | `alpha` ↑ = stronger | `alpha` ↑ = stronger | `alpha`, `l1_ratio` |

(In `LogisticRegression` the knob is **`C = 1/α`**, and **↑C means weaker** regularisation. See §8.13.)

---

## 7.18 Early stopping — Hinton's "beautiful free lunch" 🟢

> [!info] 📖 Géron Ch. 4 · “Early Stopping” · pp. 166–167

![Stop at the epoch with the lowest validation error.](figures/fig07_early_stopping.png)
*Stop at the epoch with the lowest validation error.*

For iterative learners: **stop training when the validation error reaches its minimum.** The training error keeps falling, but the validation error bottoms out and then rises as the model starts overfitting.

```python
from copy import deepcopy
from sklearn.metrics import root_mean_squared_error

preprocessing = make_pipeline(PolynomialFeatures(degree=90, include_bias=False),
                              StandardScaler())
X_train_prep = preprocessing.fit_transform(X_train)
X_valid_prep = preprocessing.transform(X_valid)
sgd_reg = SGDRegressor(penalty=None, eta0=0.002, random_state=42)

best_valid_rmse = float("inf")
for epoch in range(500):
    sgd_reg.partial_fit(X_train_prep, y_train)
    val_error = root_mean_squared_error(y_valid, sgd_reg.predict(X_valid_prep))
    if val_error < best_valid_rmse:
        best_valid_rmse = val_error
        best_model = deepcopy(sgd_reg)       # deepcopy keeps the LEARNED parameters
```

- With SGD and mini-batch GD the validation curve is noisy. Wait until it has stayed above its minimum for a while (**patience**), then **roll back to the best parameters**. That is exactly Keras' `EarlyStopping(patience=7, restore_best_weights=True)` from Part 11.
- **`copy.deepcopy`** copies hyperparameters *and* learned parameters. **`sklearn.base.clone`** copies only hyperparameters (an unfitted twin). Mixing them up is a subtle bug.
- Built-in versions: `SGDRegressor(early_stopping=True, validation_fraction=0.1, n_iter_no_change=5)`, and `HistGradientBoosting*(early_stopping=True)`.

---

> [!check] ✅ Key takeaways
> - Linear regression minimises MSE; solve it in closed form (normal equation / SVD) or with gradient descent.
> - The normal equation scales badly with many features; GD (batch, stochastic, mini-batch) scales to big data.
> - Polynomial features let a linear model fit curves — scale them, and watch the feature count explode.
> - Learning curves diagnose under- vs overfitting better than a single score.
> - Ridge shrinks, Lasso zeroes (feature selection), Elastic Net mixes both; tune α by CV on scaled features.
> - Early stopping is regularisation for free: keep the weights from the best validation epoch.

## 7.19 Interview drill — regression and training (Géron Ch. 4 exercises, answered) 🟢 ⭐

> [!info] 📖 Géron Ch. 4 · Exercises · p. 177

**1. Millions of features: which training algorithm?** Stochastic or mini-batch GD (batch GD too, if the data fits in memory). Not the Normal equation or SVD, whose cost grows with n² to n³.

**2. Features on very different scales: which algorithms suffer, and how?** Gradient descent (the elongated bowl makes convergence slow). The Normal equation and SVD are unaffected. Regularised models are affected because the penalty treats large-scale and small-scale features unequally. Fix: `StandardScaler`.

**3. Can GD get stuck in a local minimum when training logistic regression?** No. Its cost is convex.

**4. Do all GD variants reach the same model?** If the problem is convex and the learning rate is right, all approach the global optimum. Without a decaying learning rate, SGD and mini-batch GD keep bouncing around it, so they end slightly different unless you anneal.

**5. Validation error goes up every epoch with batch GD. Why?** Either the learning rate is too high and the model is diverging (training error rises too), or it is overfitting (training error falls). Lower η in the first case; stop training in the second.

**6. Stop mini-batch GD the moment validation error rises?** No. The curve is noisy. Use patience and roll back to the best checkpoint.

**7. Which GD variant reaches the vicinity of the optimum fastest, and which converges?** SGD takes the fastest steps, since each iteration uses one instance. Only batch GD truly converges with a fixed η. SGD and mini-batch converge if η decays.

**8. Polynomial regression with a big gap between training and validation error?** Overfitting. Lower the degree, regularise (Ridge/Lasso), or get more data.

**9. Ridge: training and validation errors both high and similar. Bias or variance?** High bias (underfitting). **Reduce α**.

**10. Why use Ridge over plain linear regression? Lasso over Ridge? Elastic Net over Lasso?** Regularisation generalises better and handles collinearity. Lasso when you want sparsity or automatic feature selection. Elastic Net when n > m or features are correlated, where Lasso is erratic.

**11. Classify pictures as outdoor/indoor and daytime/nighttime: two logistic regressions or one softmax?** Two logistic regressions. The labels are not mutually exclusive (multilabel), and softmax assumes exactly one class.

**12. Implement batch GD with early stopping for softmax regression, without sklearn.** (Géron's coding exercise. Be able to sketch it: one-hot encode y; P = softmax(XΘ); gradient = (1/m) Xᵀ(P − Y); Θ −= η·gradient; track the validation loss each epoch; keep the best Θ.)

**Additional regression questions that often come up:**

- **"Explain R² and adjusted R²."** R² = 1 − SS_res/SS_tot, the share of variance explained. It never decreases when you add features. Adjusted R² = 1 − (1−R²)(m−1)/(m−n−1) penalises useless features.
- **"What is multicollinearity and how do you detect or fix it?"** Highly correlated predictors make coefficients unstable and uninterpretable (predictions can still be fine). Detect with the correlation matrix or **VIF > 5–10**. Fix by dropping or combining features, using Ridge, or using PCA.
- **"How do you interpret a coefficient?"** The expected change in y for a one-unit change in xⱼ, *holding the other features fixed*. On standardised features it is per one standard deviation. With a log target, a coefficient β means roughly a 100·β% change in y.
- **"MAE, RMSE or MAPE for a revenue forecast?"** RMSE if large misses are disproportionately costly. MAE for robustness and interpretability. MAPE is intuitive for business audiences but explodes near zero actuals and penalises over-forecasts more heavily than under-forecasts. **WAPE** (Σ|error| / Σ|actual|) is the safer business-facing alternative.
- **"Residuals fan out as predictions grow. What now?"** That is heteroscedasticity. Try a log or Box-Cox transform of the target, weighted least squares, or a model that predicts intervals (quantile regression).
- **"Linear regression assumptions?"** Linearity, independence of errors, homoscedasticity, normality of residuals (needed for inference only), and no perfect multicollinearity. See §7.8.

---

## 7.20 Real-world examples — regression at work 🟡

- **Telecom ARPU / CLV prediction:** linear or GBM regression on tenure, usage trend, bundle and payment behaviour; a **log-transformed target** (§7.14+) tames the heavy right tail of high-value enterprise accounts. Report MAE in EGP — managers understand it.
- **Capacity planning:** regress busy-hour traffic on subscribers, device mix (5G share) and seasonality to decide where to add carriers; Ridge is a sensible choice because the features are correlated (§7.17).
- **Real estate (Zillow Zestimate):** started with hedonic regression (price ~ size, rooms, location); median error is published openly (~2% on-market). Shows why an **interpretable baseline** and honest error reporting build trust.
- **Energy:** utilities forecast load with linear models on temperature (degree-days) — a strong, explainable baseline that complex models must beat.
- **Marketing mix modelling (Meta Robyn, Google Meridian):** regularised regression (Ridge / Bayesian) with adstock and saturation transforms estimates each channel's ROI — widely used by telcos to split budget across TV, digital and SMS.

---

## Further reading

- **MLU-Explain: Linear Regression** — https://mlu-explain.github.io/linear-regression/ (the link from your own course notes; interactive and excellent)
- **ISLR Chapter 3** (linear regression) and **Chapter 3.5 / 4** (KNN) — https://www.statlearning.com/
- **scikit-learn: Nearest Neighbors** — https://scikit-learn.org/stable/modules/neighbors.html
- **scikit-learn: Pipelines and composite estimators** — https://scikit-learn.org/stable/modules/compose.html — read this one properly; it is the design pattern the whole course leans on.
- **Not covered here, and worth learning next:** `Ridge`, `Lasso` and `ElasticNet` (regularised linear regression), `PolynomialFeatures` (to give a linear model curvature), and `HistGradientBoostingRegressor` (sklearn's fast, strong default for tabular regression).

---

<!-- nav -->
> [!example] 🧭 Step 9 of 26 · Stage 3 of 7: Classical ML
> ← [Part 06 · ML foundations](06_ML_Foundations.md) · [Part 08 · Classification](08_Supervised_Classification.md) → · [Course map](00_START_HERE.md)
<!-- /nav -->
