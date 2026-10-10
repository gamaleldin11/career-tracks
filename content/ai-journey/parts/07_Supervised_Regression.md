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

<figure class="dia"><svg viewBox="0 0 720 246" role="img" aria-label="Residuals against fitted values for three linear regressions: when the assumptions hold the residuals form a flat random band around zero; a curved relationship leaves a U shape; growing error variance leaves a funnel that widens to the right">
<text class="sT" x="140" y="22" text-anchor="middle">assumptions hold</text>
<rect class="sN" x="40" y="40" width="200" height="160" rx="4" opacity=".4"/><line class="sLm" x1="40" y1="120" x2="240" y2="120" stroke-dasharray="4 3"/>
<circle class="sPg" cx="62.7" cy="136.8" r="2.3" opacity=".75"/><circle class="sPg" cx="138.3" cy="112.1" r="2.3" opacity=".75"/><circle class="sPg" cx="159.1" cy="110.6" r="2.3" opacity=".75"/><circle class="sPg" cx="42.4" cy="108.5" r="2.3" opacity=".75"/><circle class="sPg" cx="66.7" cy="108.9" r="2.3" opacity=".75"/><circle class="sPg" cx="225.6" cy="115.9" r="2.3" opacity=".75"/><circle class="sPg" cx="50.9" cy="116.4" r="2.3" opacity=".75"/><circle class="sPg" cx="63.0" cy="150.8" r="2.3" opacity=".75"/><circle class="sPg" cx="229.7" cy="123.5" r="2.3" opacity=".75"/><circle class="sPg" cx="163.2" cy="135.4" r="2.3" opacity=".75"/><circle class="sPg" cx="111.7" cy="117.4" r="2.3" opacity=".75"/><circle class="sPg" cx="140.7" cy="129.6" r="2.3" opacity=".75"/><circle class="sPg" cx="171.6" cy="107.4" r="2.3" opacity=".75"/><circle class="sPg" cx="92.6" cy="103.2" r="2.3" opacity=".75"/><circle class="sPg" cx="64.7" cy="113.7" r="2.3" opacity=".75"/><circle class="sPg" cx="197.1" cy="113.6" r="2.3" opacity=".75"/><circle class="sPg" cx="173.1" cy="118.1" r="2.3" opacity=".75"/><circle class="sPg" cx="140.9" cy="129.2" r="2.3" opacity=".75"/><circle class="sPg" cx="202.9" cy="123.4" r="2.3" opacity=".75"/><circle class="sPg" cx="148.4" cy="130.2" r="2.3" opacity=".75"/><circle class="sPg" cx="236.4" cy="112.1" r="2.3" opacity=".75"/><circle class="sPg" cx="78.2" cy="119.7" r="2.3" opacity=".75"/><circle class="sPg" cx="149.3" cy="108.1" r="2.3" opacity=".75"/><circle class="sPg" cx="135.1" cy="147.3" r="2.3" opacity=".75"/><circle class="sPg" cx="108.5" cy="101.8" r="2.3" opacity=".75"/><circle class="sPg" cx="157.1" cy="135.7" r="2.3" opacity=".75"/><circle class="sPg" cx="84.5" cy="135.1" r="2.3" opacity=".75"/><circle class="sPg" cx="200.0" cy="124.1" r="2.3" opacity=".75"/><circle class="sPg" cx="213.2" cy="131.6" r="2.3" opacity=".75"/><circle class="sPg" cx="62.8" cy="114.0" r="2.3" opacity=".75"/><circle class="sPg" cx="131.7" cy="131.8" r="2.3" opacity=".75"/><circle class="sPg" cx="93.0" cy="142.0" r="2.3" opacity=".75"/><circle class="sPg" cx="53.5" cy="137.3" r="2.3" opacity=".75"/><circle class="sPg" cx="219.0" cy="93.1" r="2.3" opacity=".75"/><circle class="sPg" cx="124.1" cy="119.1" r="2.3" opacity=".75"/><circle class="sPg" cx="66.6" cy="144.0" r="2.3" opacity=".75"/><circle class="sPg" cx="173.7" cy="119.9" r="2.3" opacity=".75"/><circle class="sPg" cx="77.8" cy="151.9" r="2.3" opacity=".75"/><circle class="sPg" cx="220.2" cy="83.4" r="2.3" opacity=".75"/><circle class="sPg" cx="80.8" cy="151.3" r="2.3" opacity=".75"/><circle class="sPg" cx="43.3" cy="110.2" r="2.3" opacity=".75"/><circle class="sPg" cx="77.5" cy="108.9" r="2.3" opacity=".75"/><circle class="sPg" cx="107.0" cy="149.8" r="2.3" opacity=".75"/><circle class="sPg" cx="132.1" cy="113.9" r="2.3" opacity=".75"/><circle class="sPg" cx="221.1" cy="99.6" r="2.3" opacity=".75"/><circle class="sPg" cx="178.6" cy="110.5" r="2.3" opacity=".75"/><circle class="sPg" cx="105.7" cy="114.7" r="2.3" opacity=".75"/><circle class="sPg" cx="40.0" cy="100.5" r="2.3" opacity=".75"/><circle class="sPg" cx="69.1" cy="116.7" r="2.3" opacity=".75"/><circle class="sPg" cx="239.5" cy="113.2" r="2.3" opacity=".75"/><circle class="sPg" cx="130.2" cy="122.6" r="2.3" opacity=".75"/><circle class="sPg" cx="177.3" cy="107.1" r="2.3" opacity=".75"/><circle class="sPg" cx="47.7" cy="139.3" r="2.3" opacity=".75"/><circle class="sPg" cx="43.5" cy="103.8" r="2.3" opacity=".75"/><circle class="sPg" cx="208.9" cy="130.4" r="2.3" opacity=".75"/><circle class="sPg" cx="156.3" cy="142.4" r="2.3" opacity=".75"/><circle class="sPg" cx="99.4" cy="112.5" r="2.3" opacity=".75"/><circle class="sPg" cx="101.2" cy="85.3" r="2.3" opacity=".75"/><circle class="sPg" cx="54.7" cy="100.3" r="2.3" opacity=".75"/><circle class="sPg" cx="71.7" cy="130.6" r="2.3" opacity=".75"/><circle class="sPg" cx="41.6" cy="105.7" r="2.3" opacity=".75"/><circle class="sPg" cx="207.5" cy="129.4" r="2.3" opacity=".75"/><circle class="sPg" cx="131.5" cy="122.6" r="2.3" opacity=".75"/><circle class="sPg" cx="62.5" cy="118.2" r="2.3" opacity=".75"/><circle class="sPg" cx="187.1" cy="167.6" r="2.3" opacity=".75"/><circle class="sPg" cx="76.4" cy="116.1" r="2.3" opacity=".75"/><circle class="sPg" cx="49.2" cy="141.1" r="2.3" opacity=".75"/><circle class="sPg" cx="158.4" cy="134.3" r="2.3" opacity=".75"/><circle class="sPg" cx="219.0" cy="150.3" r="2.3" opacity=".75"/><circle class="sPg" cx="42.1" cy="151.1" r="2.3" opacity=".75"/><circle class="sPg" cx="200.6" cy="139.4" r="2.3" opacity=".75"/><circle class="sPg" cx="75.3" cy="103.1" r="2.3" opacity=".75"/><circle class="sPg" cx="55.5" cy="85.8" r="2.3" opacity=".75"/><circle class="sPg" cx="40.2" cy="120.5" r="2.3" opacity=".75"/><circle class="sPg" cx="96.2" cy="97.6" r="2.3" opacity=".75"/><circle class="sPg" cx="184.7" cy="125.5" r="2.3" opacity=".75"/><circle class="sPg" cx="137.0" cy="159.3" r="2.3" opacity=".75"/><circle class="sPg" cx="210.3" cy="117.0" r="2.3" opacity=".75"/><circle class="sPg" cx="80.8" cy="110.9" r="2.3" opacity=".75"/><circle class="sPg" cx="100.8" cy="128.8" r="2.3" opacity=".75"/><circle class="sPg" cx="89.1" cy="113.8" r="2.3" opacity=".75"/><circle class="sPg" cx="235.8" cy="108.3" r="2.3" opacity=".75"/><circle class="sPg" cx="228.2" cy="137.8" r="2.3" opacity=".75"/><circle class="sPg" cx="106.0" cy="150.3" r="2.3" opacity=".75"/><circle class="sPg" cx="125.4" cy="124.6" r="2.3" opacity=".75"/><circle class="sPg" cx="100.6" cy="124.3" r="2.3" opacity=".75"/><circle class="sPg" cx="188.6" cy="127.3" r="2.3" opacity=".75"/><circle class="sPg" cx="44.7" cy="99.7" r="2.3" opacity=".75"/><circle class="sPg" cx="50.3" cy="84.6" r="2.3" opacity=".75"/><circle class="sPg" cx="118.9" cy="128.6" r="2.3" opacity=".75"/><circle class="sPg" cx="86.5" cy="105.7" r="2.3" opacity=".75"/><circle class="sPg" cx="208.7" cy="100.8" r="2.3" opacity=".75"/><circle class="sPg" cx="187.7" cy="105.4" r="2.3" opacity=".75"/><circle class="sPg" cx="147.7" cy="98.5" r="2.3" opacity=".75"/><circle class="sPg" cx="171.3" cy="128.0" r="2.3" opacity=".75"/><circle class="sPg" cx="177.6" cy="104.9" r="2.3" opacity=".75"/><circle class="sPg" cx="195.6" cy="78.5" r="2.3" opacity=".75"/><circle class="sPg" cx="225.5" cy="103.6" r="2.3" opacity=".75"/><circle class="sPg" cx="67.1" cy="132.7" r="2.3" opacity=".75"/><circle class="sPg" cx="164.1" cy="107.6" r="2.3" opacity=".75"/><circle class="sPg" cx="65.8" cy="94.1" r="2.3" opacity=".75"/><circle class="sPg" cx="126.8" cy="112.5" r="2.3" opacity=".75"/><circle class="sPg" cx="196.7" cy="131.6" r="2.3" opacity=".75"/><circle class="sPg" cx="218.8" cy="88.4" r="2.3" opacity=".75"/><circle class="sPg" cx="191.2" cy="145.7" r="2.3" opacity=".75"/><circle class="sPg" cx="43.8" cy="109.7" r="2.3" opacity=".75"/><circle class="sPg" cx="109.8" cy="120.4" r="2.3" opacity=".75"/><circle class="sPg" cx="69.8" cy="144.5" r="2.3" opacity=".75"/><circle class="sPg" cx="240.0" cy="95.1" r="2.3" opacity=".75"/><circle class="sPg" cx="65.9" cy="112.9" r="2.3" opacity=".75"/><circle class="sPg" cx="86.3" cy="143.9" r="2.3" opacity=".75"/><circle class="sPg" cx="109.3" cy="107.7" r="2.3" opacity=".75"/><circle class="sPg" cx="49.0" cy="128.9" r="2.3" opacity=".75"/><circle class="sPg" cx="213.8" cy="159.1" r="2.3" opacity=".75"/><circle class="sPg" cx="166.2" cy="134.2" r="2.3" opacity=".75"/><circle class="sPg" cx="69.1" cy="114.6" r="2.3" opacity=".75"/><circle class="sPg" cx="138.1" cy="107.0" r="2.3" opacity=".75"/><circle class="sPg" cx="52.6" cy="116.6" r="2.3" opacity=".75"/><circle class="sPg" cx="161.0" cy="119.1" r="2.3" opacity=".75"/><circle class="sPg" cx="83.7" cy="110.4" r="2.3" opacity=".75"/><circle class="sPg" cx="44.4" cy="124.3" r="2.3" opacity=".75"/><circle class="sPg" cx="60.0" cy="95.9" r="2.3" opacity=".75"/><circle class="sPg" cx="149.7" cy="117.0" r="2.3" opacity=".75"/><circle class="sPg" cx="166.3" cy="114.0" r="2.3" opacity=".75"/><circle class="sPg" cx="102.7" cy="108.9" r="2.3" opacity=".75"/><circle class="sPg" cx="167.6" cy="141.7" r="2.3" opacity=".75"/><circle class="sPg" cx="108.3" cy="134.6" r="2.3" opacity=".75"/><circle class="sPg" cx="63.2" cy="88.6" r="2.3" opacity=".75"/><circle class="sPg" cx="100.8" cy="113.1" r="2.3" opacity=".75"/><circle class="sPg" cx="117.1" cy="125.8" r="2.3" opacity=".75"/><circle class="sPg" cx="222.5" cy="113.1" r="2.3" opacity=".75"/><circle class="sPg" cx="60.1" cy="129.9" r="2.3" opacity=".75"/><circle class="sPg" cx="54.1" cy="114.3" r="2.3" opacity=".75"/><circle class="sPg" cx="150.9" cy="133.7" r="2.3" opacity=".75"/><circle class="sPg" cx="232.8" cy="114.4" r="2.3" opacity=".75"/><circle class="sPg" cx="221.4" cy="152.4" r="2.3" opacity=".75"/><circle class="sPg" cx="179.2" cy="92.7" r="2.3" opacity=".75"/><circle class="sPg" cx="50.2" cy="130.5" r="2.3" opacity=".75"/><circle class="sPg" cx="200.8" cy="152.5" r="2.3" opacity=".75"/><circle class="sPg" cx="175.8" cy="124.6" r="2.3" opacity=".75"/><circle class="sPg" cx="65.9" cy="127.6" r="2.3" opacity=".75"/><circle class="sPg" cx="131.3" cy="116.9" r="2.3" opacity=".75"/><circle class="sPg" cx="46.6" cy="143.5" r="2.3" opacity=".75"/><circle class="sPg" cx="199.9" cy="111.9" r="2.3" opacity=".75"/><circle class="sPg" cx="182.9" cy="45.7" r="2.3" opacity=".75"/><circle class="sPg" cx="200.5" cy="146.3" r="2.3" opacity=".75"/><circle class="sPg" cx="191.4" cy="113.1" r="2.3" opacity=".75"/><circle class="sPg" cx="91.0" cy="126.4" r="2.3" opacity=".75"/><circle class="sPg" cx="197.4" cy="116.1" r="2.3" opacity=".75"/><circle class="sPg" cx="87.3" cy="157.2" r="2.3" opacity=".75"/><circle class="sPg" cx="64.6" cy="143.6" r="2.3" opacity=".75"/><circle class="sPg" cx="116.1" cy="110.6" r="2.3" opacity=".75"/><circle class="sPg" cx="138.0" cy="120.8" r="2.3" opacity=".75"/><circle class="sPg" cx="94.8" cy="86.5" r="2.3" opacity=".75"/><circle class="sPg" cx="159.9" cy="134.5" r="2.3" opacity=".75"/><circle class="sPg" cx="159.3" cy="116.5" r="2.3" opacity=".75"/><circle class="sPg" cx="85.4" cy="60.3" r="2.3" opacity=".75"/><circle class="sPg" cx="163.4" cy="135.7" r="2.3" opacity=".75"/><circle class="sPg" cx="109.3" cy="138.6" r="2.3" opacity=".75"/><circle class="sPg" cx="186.2" cy="120.8" r="2.3" opacity=".75"/>
<text class="sS" x="240" y="216" text-anchor="end">fitted ŷ →</text><text class="sGt" x="140" y="236" text-anchor="middle">random band around 0</text>
<text class="sS" x="34" y="124" text-anchor="end">0</text><text class="sS" x="40" y="216">R² = 0.96</text>
<text class="sT" x="378" y="22" text-anchor="middle">non-linearity</text>
<rect class="sN" x="278" y="40" width="200" height="160" rx="4" opacity=".4"/><line class="sLm" x1="278" y1="120" x2="478" y2="120" stroke-dasharray="4 3"/>
<circle class="sPw" cx="300.7" cy="105.9" r="2.3" opacity=".75"/><circle class="sPw" cx="376.3" cy="148.6" r="2.3" opacity=".75"/><circle class="sPw" cx="397.1" cy="150.1" r="2.3" opacity=".75"/><circle class="sPw" cx="280.4" cy="79.7" r="2.3" opacity=".75"/><circle class="sPw" cx="304.7" cy="108.8" r="2.3" opacity=".75"/><circle class="sPw" cx="463.6" cy="45.7" r="2.3" opacity=".75"/><circle class="sPw" cx="288.9" cy="73.5" r="2.3" opacity=".75"/><circle class="sPw" cx="301.0" cy="135.1" r="2.3" opacity=".75"/><circle class="sPw" cx="467.7" cy="67.2" r="2.3" opacity=".75"/><circle class="sPw" cx="401.2" cy="158.4" r="2.3" opacity=".75"/><circle class="sPw" cx="349.7" cy="145.8" r="2.3" opacity=".75"/><circle class="sPw" cx="378.7" cy="159.0" r="2.3" opacity=".75"/><circle class="sPw" cx="409.6" cy="123.4" r="2.3" opacity=".75"/><circle class="sPw" cx="330.6" cy="130.1" r="2.3" opacity=".75"/><circle class="sPw" cx="302.7" cy="98.9" r="2.3" opacity=".75"/><circle class="sPw" cx="435.1" cy="116.0" r="2.3" opacity=".75"/><circle class="sPw" cx="411.1" cy="142.9" r="2.3" opacity=".75"/><circle class="sPw" cx="378.9" cy="153.6" r="2.3" opacity=".75"/><circle class="sPw" cx="440.9" cy="96.5" r="2.3" opacity=".75"/><circle class="sPw" cx="386.4" cy="150.0" r="2.3" opacity=".75"/><circle class="sPw" cx="474.4" cy="56.1" r="2.3" opacity=".75"/><circle class="sPw" cx="316.2" cy="112.1" r="2.3" opacity=".75"/><circle class="sPw" cx="387.3" cy="153.4" r="2.3" opacity=".75"/><circle class="sPw" cx="373.1" cy="158.4" r="2.3" opacity=".75"/><circle class="sPw" cx="346.5" cy="159.1" r="2.3" opacity=".75"/><circle class="sPw" cx="395.1" cy="158.4" r="2.3" opacity=".75"/><circle class="sPw" cx="322.5" cy="139.0" r="2.3" opacity=".75"/><circle class="sPw" cx="438.0" cy="143.5" r="2.3" opacity=".75"/><circle class="sPw" cx="451.2" cy="84.1" r="2.3" opacity=".75"/><circle class="sPw" cx="300.8" cy="99.6" r="2.3" opacity=".75"/><circle class="sPw" cx="369.7" cy="159.8" r="2.3" opacity=".75"/><circle class="sPw" cx="331.0" cy="129.2" r="2.3" opacity=".75"/><circle class="sPw" cx="291.5" cy="86.5" r="2.3" opacity=".75"/><circle class="sPw" cx="457.0" cy="81.2" r="2.3" opacity=".75"/><circle class="sPw" cx="362.1" cy="182.5" r="2.3" opacity=".75"/><circle class="sPw" cx="304.6" cy="113.4" r="2.3" opacity=".75"/><circle class="sPw" cx="411.7" cy="136.4" r="2.3" opacity=".75"/><circle class="sPw" cx="315.8" cy="108.1" r="2.3" opacity=".75"/><circle class="sPw" cx="458.2" cy="63.9" r="2.3" opacity=".75"/><circle class="sPw" cx="318.8" cy="113.4" r="2.3" opacity=".75"/><circle class="sPw" cx="281.3" cy="85.6" r="2.3" opacity=".75"/><circle class="sPw" cx="315.5" cy="147.8" r="2.3" opacity=".75"/><circle class="sPw" cx="345.0" cy="144.0" r="2.3" opacity=".75"/><circle class="sPw" cx="370.1" cy="157.3" r="2.3" opacity=".75"/><circle class="sPw" cx="459.1" cy="71.4" r="2.3" opacity=".75"/><circle class="sPw" cx="416.6" cy="139.2" r="2.3" opacity=".75"/><circle class="sPw" cx="343.7" cy="146.9" r="2.3" opacity=".75"/><circle class="sPw" cx="278.0" cy="82.9" r="2.3" opacity=".75"/><circle class="sPw" cx="307.1" cy="109.6" r="2.3" opacity=".75"/><circle class="sPw" cx="477.5" cy="50.5" r="2.3" opacity=".75"/><circle class="sPw" cx="368.2" cy="153.7" r="2.3" opacity=".75"/><circle class="sPw" cx="415.3" cy="134.2" r="2.3" opacity=".75"/><circle class="sPw" cx="285.7" cy="82.5" r="2.3" opacity=".75"/><circle class="sPw" cx="281.5" cy="70.4" r="2.3" opacity=".75"/><circle class="sPw" cx="446.9" cy="101.7" r="2.3" opacity=".75"/><circle class="sPw" cx="394.3" cy="144.8" r="2.3" opacity=".75"/><circle class="sPw" cx="337.4" cy="139.9" r="2.3" opacity=".75"/><circle class="sPw" cx="339.2" cy="152.1" r="2.3" opacity=".75"/><circle class="sPw" cx="292.7" cy="99.4" r="2.3" opacity=".75"/><circle class="sPw" cx="309.7" cy="99.4" r="2.3" opacity=".75"/><circle class="sPw" cx="279.6" cy="71.2" r="2.3" opacity=".75"/><circle class="sPw" cx="445.5" cy="93.2" r="2.3" opacity=".75"/><circle class="sPw" cx="369.5" cy="153.4" r="2.3" opacity=".75"/><circle class="sPw" cx="300.5" cy="111.0" r="2.3" opacity=".75"/><circle class="sPw" cx="425.1" cy="137.4" r="2.3" opacity=".75"/><circle class="sPw" cx="314.4" cy="122.2" r="2.3" opacity=".75"/><circle class="sPw" cx="287.2" cy="81.2" r="2.3" opacity=".75"/><circle class="sPw" cx="396.4" cy="145.3" r="2.3" opacity=".75"/><circle class="sPw" cx="457.0" cy="98.5" r="2.3" opacity=".75"/><circle class="sPw" cx="280.1" cy="77.3" r="2.3" opacity=".75"/><circle class="sPw" cx="438.6" cy="114.4" r="2.3" opacity=".75"/><circle class="sPw" cx="313.3" cy="105.3" r="2.3" opacity=".75"/><circle class="sPw" cx="293.5" cy="119.2" r="2.3" opacity=".75"/><circle class="sPw" cx="278.2" cy="63.0" r="2.3" opacity=".75"/><circle class="sPw" cx="334.2" cy="148.5" r="2.3" opacity=".75"/><circle class="sPw" cx="422.7" cy="127.6" r="2.3" opacity=".75"/><circle class="sPw" cx="375.0" cy="162.7" r="2.3" opacity=".75"/><circle class="sPw" cx="448.3" cy="95.6" r="2.3" opacity=".75"/><circle class="sPw" cx="318.8" cy="112.0" r="2.3" opacity=".75"/><circle class="sPw" cx="338.8" cy="142.4" r="2.3" opacity=".75"/><circle class="sPw" cx="327.1" cy="132.2" r="2.3" opacity=".75"/><circle class="sPw" cx="473.8" cy="49.6" r="2.3" opacity=".75"/><circle class="sPw" cx="466.2" cy="76.4" r="2.3" opacity=".75"/><circle class="sPw" cx="344.0" cy="143.7" r="2.3" opacity=".75"/><circle class="sPw" cx="363.4" cy="159.0" r="2.3" opacity=".75"/><circle class="sPw" cx="338.6" cy="154.5" r="2.3" opacity=".75"/><circle class="sPw" cx="426.6" cy="128.3" r="2.3" opacity=".75"/><circle class="sPw" cx="282.7" cy="78.3" r="2.3" opacity=".75"/><circle class="sPw" cx="288.3" cy="77.9" r="2.3" opacity=".75"/><circle class="sPw" cx="356.9" cy="155.6" r="2.3" opacity=".75"/><circle class="sPw" cx="324.5" cy="139.8" r="2.3" opacity=".75"/><circle class="sPw" cx="446.7" cy="86.5" r="2.3" opacity=".75"/><circle class="sPw" cx="425.7" cy="118.6" r="2.3" opacity=".75"/><circle class="sPw" cx="385.7" cy="142.5" r="2.3" opacity=".75"/><circle class="sPw" cx="409.3" cy="137.5" r="2.3" opacity=".75"/><circle class="sPw" cx="415.6" cy="140.0" r="2.3" opacity=".75"/><circle class="sPw" cx="433.6" cy="124.1" r="2.3" opacity=".75"/><circle class="sPw" cx="463.5" cy="76.6" r="2.3" opacity=".75"/><circle class="sPw" cx="305.1" cy="101.6" r="2.3" opacity=".75"/><circle class="sPw" cx="402.1" cy="147.5" r="2.3" opacity=".75"/><circle class="sPw" cx="303.8" cy="125.4" r="2.3" opacity=".75"/><circle class="sPw" cx="364.8" cy="157.4" r="2.3" opacity=".75"/><circle class="sPw" cx="434.7" cy="133.2" r="2.3" opacity=".75"/><circle class="sPw" cx="456.8" cy="83.8" r="2.3" opacity=".75"/><circle class="sPw" cx="429.2" cy="137.7" r="2.3" opacity=".75"/><circle class="sPw" cx="281.8" cy="87.5" r="2.3" opacity=".75"/><circle class="sPw" cx="347.8" cy="150.2" r="2.3" opacity=".75"/><circle class="sPw" cx="307.8" cy="116.0" r="2.3" opacity=".75"/><circle class="sPw" cx="478.0" cy="62.3" r="2.3" opacity=".75"/><circle class="sPw" cx="303.9" cy="102.1" r="2.3" opacity=".75"/><circle class="sPw" cx="324.3" cy="111.4" r="2.3" opacity=".75"/><circle class="sPw" cx="347.3" cy="166.8" r="2.3" opacity=".75"/><circle class="sPw" cx="287.0" cy="64.4" r="2.3" opacity=".75"/><circle class="sPw" cx="451.8" cy="101.0" r="2.3" opacity=".75"/><circle class="sPw" cx="404.2" cy="152.6" r="2.3" opacity=".75"/><circle class="sPw" cx="307.1" cy="116.2" r="2.3" opacity=".75"/><circle class="sPw" cx="376.1" cy="172.7" r="2.3" opacity=".75"/><circle class="sPw" cx="290.6" cy="76.0" r="2.3" opacity=".75"/><circle class="sPw" cx="399.0" cy="145.3" r="2.3" opacity=".75"/><circle class="sPw" cx="321.7" cy="139.4" r="2.3" opacity=".75"/><circle class="sPw" cx="282.4" cy="78.4" r="2.3" opacity=".75"/><circle class="sPw" cx="298.0" cy="117.4" r="2.3" opacity=".75"/><circle class="sPw" cx="387.7" cy="158.9" r="2.3" opacity=".75"/><circle class="sPw" cx="404.3" cy="137.5" r="2.3" opacity=".75"/><circle class="sPw" cx="340.7" cy="165.4" r="2.3" opacity=".75"/><circle class="sPw" cx="405.6" cy="151.1" r="2.3" opacity=".75"/><circle class="sPw" cx="346.3" cy="149.1" r="2.3" opacity=".75"/><circle class="sPw" cx="301.2" cy="95.1" r="2.3" opacity=".75"/><circle class="sPw" cx="338.8" cy="131.9" r="2.3" opacity=".75"/><circle class="sPw" cx="355.1" cy="159.3" r="2.3" opacity=".75"/><circle class="sPw" cx="460.5" cy="87.0" r="2.3" opacity=".75"/><circle class="sPw" cx="298.1" cy="96.9" r="2.3" opacity=".75"/><circle class="sPw" cx="292.1" cy="96.0" r="2.3" opacity=".75"/><circle class="sPw" cx="388.9" cy="158.1" r="2.3" opacity=".75"/><circle class="sPw" cx="470.8" cy="48.3" r="2.3" opacity=".75"/><circle class="sPw" cx="459.4" cy="63.4" r="2.3" opacity=".75"/><circle class="sPw" cx="417.2" cy="134.6" r="2.3" opacity=".75"/><circle class="sPw" cx="288.2" cy="87.6" r="2.3" opacity=".75"/><circle class="sPw" cx="438.8" cy="107.0" r="2.3" opacity=".75"/><circle class="sPw" cx="413.8" cy="160.2" r="2.3" opacity=".75"/><circle class="sPw" cx="303.9" cy="110.1" r="2.3" opacity=".75"/><circle class="sPw" cx="369.3" cy="168.6" r="2.3" opacity=".75"/><circle class="sPw" cx="284.6" cy="54.3" r="2.3" opacity=".75"/><circle class="sPw" cx="437.9" cy="106.7" r="2.3" opacity=".75"/><circle class="sPw" cx="420.9" cy="132.3" r="2.3" opacity=".75"/><circle class="sPw" cx="438.5" cy="115.6" r="2.3" opacity=".75"/><circle class="sPw" cx="429.4" cy="151.2" r="2.3" opacity=".75"/><circle class="sPw" cx="329.0" cy="131.0" r="2.3" opacity=".75"/><circle class="sPw" cx="435.4" cy="100.4" r="2.3" opacity=".75"/><circle class="sPw" cx="325.3" cy="142.7" r="2.3" opacity=".75"/><circle class="sPw" cx="302.6" cy="101.0" r="2.3" opacity=".75"/><circle class="sPw" cx="354.1" cy="146.6" r="2.3" opacity=".75"/><circle class="sPw" cx="376.0" cy="173.8" r="2.3" opacity=".75"/><circle class="sPw" cx="332.8" cy="131.8" r="2.3" opacity=".75"/><circle class="sPw" cx="397.9" cy="136.8" r="2.3" opacity=".75"/><circle class="sPw" cx="397.3" cy="149.0" r="2.3" opacity=".75"/><circle class="sPw" cx="323.4" cy="133.9" r="2.3" opacity=".75"/><circle class="sPw" cx="401.4" cy="140.9" r="2.3" opacity=".75"/><circle class="sPw" cx="347.3" cy="167.4" r="2.3" opacity=".75"/><circle class="sPw" cx="424.2" cy="129.5" r="2.3" opacity=".75"/>
<text class="sS" x="478" y="216" text-anchor="end">fitted ŷ →</text><text class="sWt" x="378" y="236" text-anchor="middle">a U shape: add x² or log x</text>
<text class="sS" x="272" y="124" text-anchor="end">0</text><text class="sS" x="278" y="216">R² = 0.76</text>
<text class="sT" x="616" y="22" text-anchor="middle">heteroscedasticity</text>
<rect class="sN" x="516" y="40" width="200" height="160" rx="4" opacity=".4"/><line class="sLm" x1="516" y1="120" x2="716" y2="120" stroke-dasharray="4 3"/>
<circle class="sPr" cx="538.7" cy="115.2" r="2.3" opacity=".75"/><circle class="sPr" cx="614.3" cy="140.4" r="2.3" opacity=".75"/><circle class="sPr" cx="635.1" cy="96.6" r="2.3" opacity=".75"/><circle class="sPr" cx="518.4" cy="122.8" r="2.3" opacity=".75"/><circle class="sPr" cx="542.7" cy="133.9" r="2.3" opacity=".75"/><circle class="sPr" cx="701.6" cy="118.4" r="2.3" opacity=".75"/><circle class="sPr" cx="526.9" cy="125.1" r="2.3" opacity=".75"/><circle class="sPr" cx="539.0" cy="119.3" r="2.3" opacity=".75"/><circle class="sPr" cx="705.7" cy="153.0" r="2.3" opacity=".75"/><circle class="sPr" cx="639.2" cy="94.5" r="2.3" opacity=".75"/><circle class="sPr" cx="587.7" cy="129.2" r="2.3" opacity=".75"/><circle class="sPr" cx="616.7" cy="111.8" r="2.3" opacity=".75"/><circle class="sPr" cx="647.6" cy="130.8" r="2.3" opacity=".75"/><circle class="sPr" cx="568.6" cy="123.4" r="2.3" opacity=".75"/><circle class="sPr" cx="540.7" cy="114.0" r="2.3" opacity=".75"/><circle class="sPr" cx="673.1" cy="110.3" r="2.3" opacity=".75"/><circle class="sPr" cx="649.1" cy="126.2" r="2.3" opacity=".75"/><circle class="sPr" cx="616.9" cy="141.0" r="2.3" opacity=".75"/><circle class="sPr" cx="678.9" cy="83.2" r="2.3" opacity=".75"/><circle class="sPr" cx="624.4" cy="103.7" r="2.3" opacity=".75"/><circle class="sPr" cx="712.4" cy="125.6" r="2.3" opacity=".75"/><circle class="sPr" cx="554.2" cy="118.6" r="2.3" opacity=".75"/><circle class="sPr" cx="625.3" cy="138.0" r="2.3" opacity=".75"/><circle class="sPr" cx="611.1" cy="135.9" r="2.3" opacity=".75"/><circle class="sPr" cx="584.5" cy="130.1" r="2.3" opacity=".75"/><circle class="sPr" cx="633.1" cy="110.3" r="2.3" opacity=".75"/><circle class="sPr" cx="560.5" cy="117.6" r="2.3" opacity=".75"/><circle class="sPr" cx="676.0" cy="136.7" r="2.3" opacity=".75"/><circle class="sPr" cx="689.2" cy="93.5" r="2.3" opacity=".75"/><circle class="sPr" cx="538.8" cy="116.7" r="2.3" opacity=".75"/><circle class="sPr" cx="607.7" cy="115.7" r="2.3" opacity=".75"/><circle class="sPr" cx="569.0" cy="109.1" r="2.3" opacity=".75"/><circle class="sPr" cx="529.5" cy="122.6" r="2.3" opacity=".75"/><circle class="sPr" cx="695.0" cy="118.8" r="2.3" opacity=".75"/><circle class="sPr" cx="600.1" cy="111.5" r="2.3" opacity=".75"/><circle class="sPr" cx="542.6" cy="121.2" r="2.3" opacity=".75"/><circle class="sPr" cx="649.7" cy="98.4" r="2.3" opacity=".75"/><circle class="sPr" cx="553.8" cy="130.6" r="2.3" opacity=".75"/><circle class="sPr" cx="696.2" cy="71.2" r="2.3" opacity=".75"/><circle class="sPr" cx="556.8" cy="127.1" r="2.3" opacity=".75"/><circle class="sPr" cx="519.3" cy="122.2" r="2.3" opacity=".75"/><circle class="sPr" cx="553.5" cy="131.5" r="2.3" opacity=".75"/><circle class="sPr" cx="583.0" cy="111.8" r="2.3" opacity=".75"/><circle class="sPr" cx="608.1" cy="97.2" r="2.3" opacity=".75"/><circle class="sPr" cx="697.1" cy="81.9" r="2.3" opacity=".75"/><circle class="sPr" cx="654.6" cy="96.6" r="2.3" opacity=".75"/><circle class="sPr" cx="581.7" cy="139.0" r="2.3" opacity=".75"/><circle class="sPr" cx="516.0" cy="123.5" r="2.3" opacity=".75"/><circle class="sPr" cx="545.1" cy="123.9" r="2.3" opacity=".75"/><circle class="sPr" cx="715.5" cy="146.4" r="2.3" opacity=".75"/><circle class="sPr" cx="606.2" cy="100.1" r="2.3" opacity=".75"/><circle class="sPr" cx="653.3" cy="112.4" r="2.3" opacity=".75"/><circle class="sPr" cx="523.7" cy="121.7" r="2.3" opacity=".75"/><circle class="sPr" cx="519.5" cy="120.6" r="2.3" opacity=".75"/><circle class="sPr" cx="684.9" cy="143.4" r="2.3" opacity=".75"/><circle class="sPr" cx="632.3" cy="136.4" r="2.3" opacity=".75"/><circle class="sPr" cx="575.4" cy="129.9" r="2.3" opacity=".75"/><circle class="sPr" cx="577.2" cy="113.8" r="2.3" opacity=".75"/><circle class="sPr" cx="530.7" cy="119.9" r="2.3" opacity=".75"/><circle class="sPr" cx="547.7" cy="116.7" r="2.3" opacity=".75"/><circle class="sPr" cx="517.6" cy="119.6" r="2.3" opacity=".75"/><circle class="sPr" cx="683.5" cy="155.0" r="2.3" opacity=".75"/><circle class="sPr" cx="607.5" cy="127.9" r="2.3" opacity=".75"/><circle class="sPr" cx="538.5" cy="120.3" r="2.3" opacity=".75"/><circle class="sPr" cx="663.1" cy="151.1" r="2.3" opacity=".75"/><circle class="sPr" cx="552.4" cy="124.7" r="2.3" opacity=".75"/><circle class="sPr" cx="525.2" cy="118.2" r="2.3" opacity=".75"/><circle class="sPr" cx="634.4" cy="94.4" r="2.3" opacity=".75"/><circle class="sPr" cx="695.0" cy="82.2" r="2.3" opacity=".75"/><circle class="sPr" cx="518.1" cy="121.8" r="2.3" opacity=".75"/><circle class="sPr" cx="676.6" cy="121.9" r="2.3" opacity=".75"/><circle class="sPr" cx="551.3" cy="112.4" r="2.3" opacity=".75"/><circle class="sPr" cx="531.5" cy="123.0" r="2.3" opacity=".75"/><circle class="sPr" cx="516.2" cy="121.3" r="2.3" opacity=".75"/><circle class="sPr" cx="572.2" cy="105.3" r="2.3" opacity=".75"/><circle class="sPr" cx="660.7" cy="125.9" r="2.3" opacity=".75"/><circle class="sPr" cx="613.0" cy="129.1" r="2.3" opacity=".75"/><circle class="sPr" cx="686.3" cy="115.9" r="2.3" opacity=".75"/><circle class="sPr" cx="556.8" cy="115.4" r="2.3" opacity=".75"/><circle class="sPr" cx="576.8" cy="114.1" r="2.3" opacity=".75"/><circle class="sPr" cx="565.1" cy="118.6" r="2.3" opacity=".75"/><circle class="sPr" cx="711.8" cy="96.1" r="2.3" opacity=".75"/><circle class="sPr" cx="704.2" cy="166.5" r="2.3" opacity=".75"/><circle class="sPr" cx="582.0" cy="130.3" r="2.3" opacity=".75"/><circle class="sPr" cx="601.4" cy="116.2" r="2.3" opacity=".75"/><circle class="sPr" cx="576.6" cy="130.6" r="2.3" opacity=".75"/><circle class="sPr" cx="664.6" cy="151.1" r="2.3" opacity=".75"/><circle class="sPr" cx="520.7" cy="125.0" r="2.3" opacity=".75"/><circle class="sPr" cx="526.3" cy="124.9" r="2.3" opacity=".75"/><circle class="sPr" cx="594.9" cy="121.6" r="2.3" opacity=".75"/><circle class="sPr" cx="562.5" cy="129.9" r="2.3" opacity=".75"/><circle class="sPr" cx="684.7" cy="108.9" r="2.3" opacity=".75"/><circle class="sPr" cx="663.7" cy="72.9" r="2.3" opacity=".75"/><circle class="sPr" cx="623.7" cy="120.8" r="2.3" opacity=".75"/><circle class="sPr" cx="647.3" cy="87.7" r="2.3" opacity=".75"/><circle class="sPr" cx="653.6" cy="109.9" r="2.3" opacity=".75"/><circle class="sPr" cx="671.6" cy="146.4" r="2.3" opacity=".75"/><circle class="sPr" cx="701.5" cy="123.2" r="2.3" opacity=".75"/><circle class="sPr" cx="543.1" cy="127.1" r="2.3" opacity=".75"/><circle class="sPr" cx="640.1" cy="100.5" r="2.3" opacity=".75"/><circle class="sPr" cx="541.8" cy="128.0" r="2.3" opacity=".75"/><circle class="sPr" cx="602.8" cy="97.7" r="2.3" opacity=".75"/><circle class="sPr" cx="672.7" cy="100.4" r="2.3" opacity=".75"/><circle class="sPr" cx="694.8" cy="177.4" r="2.3" opacity=".75"/><circle class="sPr" cx="667.2" cy="95.7" r="2.3" opacity=".75"/><circle class="sPr" cx="519.8" cy="117.9" r="2.3" opacity=".75"/><circle class="sPr" cx="585.8" cy="129.8" r="2.3" opacity=".75"/><circle class="sPr" cx="545.8" cy="114.2" r="2.3" opacity=".75"/><circle class="sPr" cx="716.0" cy="175.9" r="2.3" opacity=".75"/><circle class="sPr" cx="541.9" cy="119.5" r="2.3" opacity=".75"/><circle class="sPr" cx="562.3" cy="135.8" r="2.3" opacity=".75"/><circle class="sPr" cx="585.3" cy="113.1" r="2.3" opacity=".75"/><circle class="sPr" cx="525.0" cy="127.6" r="2.3" opacity=".75"/><circle class="sPr" cx="689.8" cy="194.3" r="2.3" opacity=".75"/><circle class="sPr" cx="642.2" cy="108.5" r="2.3" opacity=".75"/><circle class="sPr" cx="545.1" cy="105.8" r="2.3" opacity=".75"/><circle class="sPr" cx="614.1" cy="128.9" r="2.3" opacity=".75"/><circle class="sPr" cx="528.6" cy="118.2" r="2.3" opacity=".75"/><circle class="sPr" cx="637.0" cy="115.1" r="2.3" opacity=".75"/><circle class="sPr" cx="559.7" cy="123.2" r="2.3" opacity=".75"/><circle class="sPr" cx="520.4" cy="120.2" r="2.3" opacity=".75"/><circle class="sPr" cx="536.0" cy="112.8" r="2.3" opacity=".75"/><circle class="sPr" cx="625.7" cy="142.1" r="2.3" opacity=".75"/><circle class="sPr" cx="642.3" cy="104.7" r="2.3" opacity=".75"/><circle class="sPr" cx="578.7" cy="115.5" r="2.3" opacity=".75"/><circle class="sPr" cx="643.6" cy="149.2" r="2.3" opacity=".75"/><circle class="sPr" cx="584.3" cy="98.6" r="2.3" opacity=".75"/><circle class="sPr" cx="539.2" cy="110.1" r="2.3" opacity=".75"/><circle class="sPr" cx="576.8" cy="130.9" r="2.3" opacity=".75"/><circle class="sPr" cx="593.1" cy="94.2" r="2.3" opacity=".75"/><circle class="sPr" cx="698.5" cy="113.4" r="2.3" opacity=".75"/><circle class="sPr" cx="536.1" cy="122.0" r="2.3" opacity=".75"/><circle class="sPr" cx="530.1" cy="115.1" r="2.3" opacity=".75"/><circle class="sPr" cx="626.9" cy="113.3" r="2.3" opacity=".75"/><circle class="sPr" cx="708.8" cy="104.2" r="2.3" opacity=".75"/><circle class="sPr" cx="697.4" cy="68.0" r="2.3" opacity=".75"/><circle class="sPr" cx="655.2" cy="85.4" r="2.3" opacity=".75"/><circle class="sPr" cx="526.2" cy="118.4" r="2.3" opacity=".75"/><circle class="sPr" cx="676.8" cy="155.0" r="2.3" opacity=".75"/><circle class="sPr" cx="651.8" cy="154.3" r="2.3" opacity=".75"/><circle class="sPr" cx="541.9" cy="114.1" r="2.3" opacity=".75"/><circle class="sPr" cx="607.3" cy="134.0" r="2.3" opacity=".75"/><circle class="sPr" cx="522.6" cy="121.3" r="2.3" opacity=".75"/><circle class="sPr" cx="675.9" cy="145.7" r="2.3" opacity=".75"/><circle class="sPr" cx="658.9" cy="121.2" r="2.3" opacity=".75"/><circle class="sPr" cx="676.5" cy="151.5" r="2.3" opacity=".75"/><circle class="sPr" cx="667.4" cy="73.4" r="2.3" opacity=".75"/><circle class="sPr" cx="567.0" cy="130.4" r="2.3" opacity=".75"/><circle class="sPr" cx="673.4" cy="119.4" r="2.3" opacity=".75"/><circle class="sPr" cx="563.3" cy="122.0" r="2.3" opacity=".75"/><circle class="sPr" cx="540.6" cy="113.9" r="2.3" opacity=".75"/><circle class="sPr" cx="592.1" cy="139.3" r="2.3" opacity=".75"/><circle class="sPr" cx="614.0" cy="118.9" r="2.3" opacity=".75"/><circle class="sPr" cx="570.8" cy="122.2" r="2.3" opacity=".75"/><circle class="sPr" cx="635.9" cy="106.3" r="2.3" opacity=".75"/><circle class="sPr" cx="635.3" cy="107.6" r="2.3" opacity=".75"/><circle class="sPr" cx="561.4" cy="124.6" r="2.3" opacity=".75"/><circle class="sPr" cx="639.4" cy="112.2" r="2.3" opacity=".75"/><circle class="sPr" cx="585.3" cy="124.3" r="2.3" opacity=".75"/><circle class="sPr" cx="662.2" cy="104.6" r="2.3" opacity=".75"/>
<text class="sS" x="716" y="216" text-anchor="end">fitted ŷ →</text><text class="sRt" x="616" y="236" text-anchor="middle">a funnel: try log(y)</text>
<text class="sS" x="510" y="124" text-anchor="end">0</text><text class="sS" x="516" y="216">R² = 0.85</text>
<text class="sS" x="14" y="120" text-anchor="middle" transform="rotate(-90 14 120)">residual y − ŷ</text>
</svg><figcaption>Three linear fits, three residual plots (synthetic data, fitted with scikit-learn). R² can look fine in all three; the shape of the residuals is what tells them apart.</figcaption></figure>

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

<figure class="dia"><svg viewBox="0 0 720 234" role="img" aria-label="KNN regression on the same noisy points: with k equal to 1 the prediction jumps through every point; with k equal to 7 it is a smooth average">
<rect class="sN" x="14" y="30" width="340" height="170" rx="6"/><text class="sRt" x="184" y="22" text-anchor="middle">k = 1: memorises every point (overfits)</text>
<circle class="sP" cx="28.2" cy="102.6" r="3.5"/>
<circle class="sP" cx="33.9" cy="123.3" r="3.5"/>
<circle class="sP" cx="44.5" cy="100.9" r="3.5"/>
<circle class="sP" cx="45.0" cy="61.1" r="3.5"/>
<circle class="sP" cx="72.2" cy="91.3" r="3.5"/>
<circle class="sP" cx="99.0" cy="34.8" r="3.5"/>
<circle class="sP" cx="100.1" cy="42.1" r="3.5"/>
<circle class="sP" cx="107.0" cy="51.9" r="3.5"/>
<circle class="sP" cx="120.4" cy="42.3" r="3.5"/>
<circle class="sP" cx="142.4" cy="52.4" r="3.5"/>
<circle class="sP" cx="174.5" cy="72.2" r="3.5"/>
<circle class="sP" cx="175.3" cy="92.9" r="3.5"/>
<circle class="sP" cx="176.4" cy="99.7" r="3.5"/>
<circle class="sP" cx="191.4" cy="115.1" r="3.5"/>
<circle class="sP" cx="198.2" cy="127.7" r="3.5"/>
<circle class="sP" cx="213.2" cy="127.0" r="3.5"/>
<circle class="sP" cx="217.3" cy="142.0" r="3.5"/>
<circle class="sP" cx="224.2" cy="118.5" r="3.5"/>
<circle class="sP" cx="227.2" cy="166.4" r="3.5"/>
<circle class="sP" cx="228.5" cy="155.2" r="3.5"/>
<circle class="sP" cx="238.9" cy="159.1" r="3.5"/>
<circle class="sP" cx="254.0" cy="182.4" r="3.5"/>
<circle class="sP" cx="261.2" cy="121.2" r="3.5"/>
<circle class="sP" cx="266.6" cy="188.6" r="3.5"/>
<circle class="sP" cx="291.7" cy="148.7" r="3.5"/>
<circle class="sP" cx="292.0" cy="152.3" r="3.5"/>
<circle class="sP" cx="301.0" cy="113.0" r="3.5"/>
<circle class="sP" cx="301.8" cy="169.3" r="3.5"/>
<circle class="sP" cx="305.2" cy="119.2" r="3.5"/>
<circle class="sP" cx="342.6" cy="113.5" r="3.5"/>
<polyline class="sLr" points="24.0,102.6 25.6,102.6 27.2,102.6 28.8,102.6 30.4,102.6 32.0,123.3 33.6,123.3 35.2,123.3 36.8,123.3 38.4,123.3 40.0,100.9 41.6,100.9 43.2,100.9 44.8,61.1 46.4,61.1 48.0,61.1 49.6,61.1 51.2,61.1 52.8,61.1 54.4,61.1 56.0,61.1 57.6,61.1 59.2,91.3 60.8,91.3 62.4,91.3 64.0,91.3 65.6,91.3 67.2,91.3 68.8,91.3 70.4,91.3 72.0,91.3 73.6,91.3 75.2,91.3 76.8,91.3 78.4,91.3 80.0,91.3 81.6,91.3 83.2,91.3 84.8,91.3 86.4,34.8 88.0,34.8 89.6,34.8 91.2,34.8 92.8,34.8 94.4,34.8 96.0,34.8 97.6,34.8 99.2,34.8 100.8,42.1 102.4,42.1 104.0,51.9 105.6,51.9 107.2,51.9 108.8,51.9 110.4,51.9 112.0,51.9 113.6,51.9 115.2,42.3 116.8,42.3 118.4,42.3 120.0,42.3 121.6,42.3 123.2,42.3 124.8,42.3 126.4,42.3 128.0,42.3 129.6,42.3 131.2,42.3 132.8,52.4 134.4,52.4 136.0,52.4 137.6,52.4 139.2,52.4 140.8,52.4 142.4,52.4 144.0,52.4 145.6,52.4 147.2,52.4 148.8,52.4 150.4,52.4 152.0,52.4 153.6,52.4 155.2,52.4 156.8,52.4 158.4,52.4 160.0,72.2 161.6,72.2 163.2,72.2 164.8,72.2 166.4,72.2 168.0,72.2 169.6,72.2 171.2,72.2 172.8,72.2 174.4,72.2 176.0,99.7 177.6,99.7 179.2,99.7 180.8,99.7 182.4,99.7 184.0,115.1 185.6,115.1 187.2,115.1 188.8,115.1 190.4,115.1 192.0,115.1 193.6,115.1 195.2,127.7 196.8,127.7 198.4,127.7 200.0,127.7 201.6,127.7 203.2,127.7 204.8,127.7 206.4,127.0 208.0,127.0 209.6,127.0 211.2,127.0 212.8,127.0 214.4,127.0 216.0,142.0 217.6,142.0 219.2,142.0 220.8,118.5 222.4,118.5 224.0,118.5 225.6,118.5 227.2,166.4 228.8,155.2 230.4,155.2 232.0,155.2 233.6,155.2 235.2,159.1 236.8,159.1 238.4,159.1 240.0,159.1 241.6,159.1 243.2,159.1 244.8,159.1 246.4,159.1 248.0,182.4 249.6,182.4 251.2,182.4 252.8,182.4 254.4,182.4 256.0,182.4 257.6,182.4 259.2,121.2 260.8,121.2 262.4,121.2 264.0,188.6 265.6,188.6 267.2,188.6 268.8,188.6 270.4,188.6 272.0,188.6 273.6,188.6 275.2,188.6 276.8,188.6 278.4,188.6 280.0,148.7 281.6,148.7 283.2,148.7 284.8,148.7 286.4,148.7 288.0,148.7 289.6,148.7 291.2,148.7 292.8,152.3 294.4,152.3 296.0,152.3 297.6,113.0 299.2,113.0 300.8,113.0 302.4,169.3 304.0,119.2 305.6,119.2 307.2,119.2 308.8,119.2 310.4,119.2 312.0,119.2 313.6,119.2 315.2,119.2 316.8,119.2 318.4,119.2 320.0,119.2 321.6,119.2 323.2,119.2 324.8,113.5 326.4,113.5 328.0,113.5 329.6,113.5 331.2,113.5 332.8,113.5 334.4,113.5 336.0,113.5 337.6,113.5 339.2,113.5 340.8,113.5 342.4,113.5 344.0,113.5" fill="none" stroke-width="2"/>
<rect class="sN" x="370" y="30" width="340" height="170" rx="6"/><text class="sGt" x="540" y="22" text-anchor="middle">k = 7: averages neighbours (smoother)</text>
<circle class="sP" cx="384.2" cy="102.6" r="3.5"/>
<circle class="sP" cx="389.9" cy="123.3" r="3.5"/>
<circle class="sP" cx="400.5" cy="100.9" r="3.5"/>
<circle class="sP" cx="401.0" cy="61.1" r="3.5"/>
<circle class="sP" cx="428.2" cy="91.3" r="3.5"/>
<circle class="sP" cx="455.0" cy="34.8" r="3.5"/>
<circle class="sP" cx="456.1" cy="42.1" r="3.5"/>
<circle class="sP" cx="463.0" cy="51.9" r="3.5"/>
<circle class="sP" cx="476.4" cy="42.3" r="3.5"/>
<circle class="sP" cx="498.4" cy="52.4" r="3.5"/>
<circle class="sP" cx="530.5" cy="72.2" r="3.5"/>
<circle class="sP" cx="531.3" cy="92.9" r="3.5"/>
<circle class="sP" cx="532.4" cy="99.7" r="3.5"/>
<circle class="sP" cx="547.4" cy="115.1" r="3.5"/>
<circle class="sP" cx="554.2" cy="127.7" r="3.5"/>
<circle class="sP" cx="569.2" cy="127.0" r="3.5"/>
<circle class="sP" cx="573.3" cy="142.0" r="3.5"/>
<circle class="sP" cx="580.2" cy="118.5" r="3.5"/>
<circle class="sP" cx="583.2" cy="166.4" r="3.5"/>
<circle class="sP" cx="584.5" cy="155.2" r="3.5"/>
<circle class="sP" cx="594.9" cy="159.1" r="3.5"/>
<circle class="sP" cx="610.0" cy="182.4" r="3.5"/>
<circle class="sP" cx="617.2" cy="121.2" r="3.5"/>
<circle class="sP" cx="622.6" cy="188.6" r="3.5"/>
<circle class="sP" cx="647.7" cy="148.7" r="3.5"/>
<circle class="sP" cx="648.0" cy="152.3" r="3.5"/>
<circle class="sP" cx="657.0" cy="113.0" r="3.5"/>
<circle class="sP" cx="657.8" cy="169.3" r="3.5"/>
<circle class="sP" cx="661.2" cy="119.2" r="3.5"/>
<circle class="sP" cx="698.6" cy="113.5" r="3.5"/>
<polyline class="sLg" points="380.0,79.4 381.6,79.4 383.2,79.4 384.8,79.4 386.4,79.4 388.0,79.4 389.6,79.4 391.2,79.4 392.8,79.4 394.4,79.4 396.0,79.4 397.6,79.4 399.2,79.4 400.8,79.4 402.4,79.4 404.0,79.4 405.6,79.4 407.2,79.4 408.8,79.4 410.4,79.4 412.0,79.4 413.6,79.4 415.2,79.4 416.8,79.4 418.4,79.4 420.0,79.4 421.6,79.4 423.2,79.4 424.8,72.2 426.4,72.2 428.0,72.2 429.6,72.2 431.2,72.2 432.8,72.2 434.4,60.6 436.0,60.6 437.6,60.6 439.2,60.6 440.8,60.6 442.4,60.6 444.0,60.6 445.6,60.6 447.2,60.6 448.8,60.6 450.4,53.7 452.0,53.7 453.6,53.7 455.2,53.7 456.8,53.7 458.4,53.7 460.0,53.7 461.6,53.7 463.2,53.7 464.8,53.7 466.4,55.3 468.0,55.3 469.6,55.3 471.2,55.3 472.8,55.3 474.4,55.3 476.0,55.3 477.6,55.3 479.2,55.3 480.8,55.5 482.4,55.5 484.0,55.5 485.6,55.5 487.2,55.5 488.8,55.5 490.4,55.5 492.0,55.5 493.6,55.5 495.2,64.8 496.8,64.8 498.4,64.8 500.0,64.8 501.6,64.8 503.2,75.2 504.8,75.2 506.4,75.2 508.0,75.2 509.6,86.1 511.2,86.1 512.8,86.1 514.4,86.1 516.0,86.1 517.6,86.1 519.2,86.1 520.8,86.1 522.4,86.1 524.0,98.2 525.6,98.2 527.2,98.2 528.8,98.2 530.4,98.2 532.0,98.2 533.6,98.2 535.2,98.2 536.8,111.0 538.4,111.0 540.0,111.0 541.6,111.0 543.2,111.0 544.8,111.0 546.4,111.0 548.0,111.0 549.6,111.0 551.2,111.0 552.8,111.0 554.4,111.0 556.0,117.6 557.6,128.1 559.2,136.0 560.8,136.0 562.4,136.0 564.0,136.0 565.6,136.0 567.2,136.0 568.8,136.0 570.4,136.0 572.0,142.3 573.6,142.3 575.2,142.3 576.8,142.3 578.4,142.3 580.0,142.3 581.6,142.3 583.2,150.1 584.8,150.1 586.4,150.1 588.0,150.1 589.6,150.1 591.2,150.1 592.8,150.1 594.4,149.3 596.0,149.3 597.6,149.3 599.2,155.9 600.8,155.9 602.4,155.9 604.0,155.9 605.6,155.9 607.2,155.9 608.8,155.9 610.4,155.9 612.0,155.9 613.6,155.9 615.2,160.2 616.8,158.2 618.4,158.2 620.0,158.2 621.6,152.2 623.2,152.2 624.8,152.2 626.4,153.6 628.0,153.6 629.6,153.6 631.2,153.6 632.8,153.6 634.4,153.6 636.0,144.6 637.6,144.6 639.2,144.6 640.8,144.6 642.4,144.6 644.0,144.6 645.6,144.6 647.2,144.6 648.8,144.6 650.4,144.6 652.0,144.6 653.6,144.6 655.2,144.6 656.8,144.6 658.4,143.5 660.0,143.5 661.6,143.5 663.2,143.5 664.8,143.5 666.4,143.5 668.0,143.5 669.6,143.5 671.2,143.5 672.8,143.5 674.4,143.5 676.0,143.5 677.6,143.5 679.2,143.5 680.8,143.5 682.4,143.5 684.0,143.5 685.6,143.5 687.2,143.5 688.8,143.5 690.4,143.5 692.0,143.5 693.6,143.5 695.2,143.5 696.8,143.5 698.4,143.5 700.0,143.5" fill="none" stroke-width="2"/>
<text class="sS" x="360" y="222" text-anchor="middle">k is the bias–variance dial: small k follows the noise, large k smooths it away (and eventually the signal too)</text>
</svg><figcaption>KNN regression predictions, computed on 30 noisy points. There is no training: the "model" is the data plus the averaging rule.</figcaption></figure>

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

<figure class="dia"><svg viewBox="0 0 720 234" role="img" aria-label="What a saved pipeline file contains: the imputer's medians, the scaler's means and standard deviations, the encoder's categories and the regression coefficients, all fitted on training data, so loading it and calling predict on raw rows reproduces training-time preprocessing">
<text class="sM" x="14" y="22">linear_regression.joblib (3.5 KB): one Pipeline object, every fitted parameter inside</text>
<rect class="sB" x="14" y="36" width="170" height="32" rx="6"/><text class="sT" x="99" y="57" text-anchor="middle">SimpleImputer(median)</text>
<line class="sLm" x1="184" y1="52" x2="196" y2="52" marker-end="url(#ahm)"/><text class="sS" x="202" y="57" xml:space="preserve" style="white-space:pre">statistics_ = [118, 3]</text>
<rect class="sB" x="14" y="78" width="170" height="32" rx="6"/><text class="sT" x="99" y="99" text-anchor="middle">StandardScaler</text>
<line class="sLm" x1="184" y1="94" x2="196" y2="94" marker-end="url(#ahm)"/><text class="sS" x="202" y="99" xml:space="preserve" style="white-space:pre">mean_ = [118.4, 2.98]   scale_ = [28.8, 1.35]</text>
<rect class="sV" x="14" y="120" width="170" height="32" rx="6"/><text class="sT" x="99" y="141" text-anchor="middle">OneHotEncoder</text>
<line class="sLm" x1="184" y1="136" x2="196" y2="136" marker-end="url(#ahm)"/><text class="sS" x="202" y="141" xml:space="preserve" style="white-space:pre">categories_ = [Alex, Cairo, Giza]</text>
<rect class="sG" x="14" y="162" width="170" height="32" rx="6"/><text class="sT" x="99" y="183" text-anchor="middle">LinearRegression</text>
<line class="sLm" x1="184" y1="178" x2="196" y2="178" marker-end="url(#ahm)"/><text class="sS" x="202" y="183" xml:space="preserve" style="white-space:pre">coef_ = [57,057, 66,356, -22,872, 27,326, -4,454]   intercept_ = 448,675</text>
<text class="sGt" x="14" y="222">joblib.load(...).predict(raw rows) → 437,582, 373,409: no preprocessing code needed at inference</text>
</svg><figcaption>Inside the artifact, from a real fitted pipeline: the "preprocessing + model" the comment talks about, as numbers.</figcaption></figure>

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

<figure class="dia"><svg viewBox="0 0 720 238" role="img" aria-label="Ten gradient-descent steps on a parabola with minimum at 3: a learning rate of 0.05 crawls only to about 1.6, 0.4 reaches 3 almost immediately, and 1.02 overshoots further each step and diverges">
<rect class="sN" x="14" y="30" width="220" height="172" rx="8"/><text class="sWt" x="124" y="22" text-anchor="middle">η = 0.05: too small</text>
<polyline class="sLm" points="32.0,98.5 33.8,102.0 35.7,105.4 37.5,108.7 39.4,111.9 41.2,115.1 43.0,118.2 44.9,121.3 46.7,124.3 48.6,127.2 50.4,130.0 52.2,132.8 54.1,135.5 55.9,138.1 57.8,140.6 59.6,143.1 61.4,145.5 63.3,147.9 65.1,150.2 67.0,152.4 68.8,154.5 70.6,156.6 72.5,158.6 74.3,160.5 76.2,162.3 78.0,164.1 79.8,165.8 81.7,167.5 83.5,169.1 85.4,170.6 87.2,172.0 89.0,173.4 90.9,174.7 92.7,175.9 94.6,177.0 96.4,178.1 98.2,179.1 100.1,180.1 101.9,181.0 103.8,181.8 105.6,182.5 107.4,183.2 109.3,183.8 111.1,184.3 113.0,184.7 114.8,185.1 116.6,185.4 118.5,185.7 120.3,185.9 122.2,186.0 124.0,186.0 125.8,186.0 127.7,185.9 129.5,185.7 131.4,185.4 133.2,185.1 135.0,184.7 136.9,184.3 138.7,183.8 140.6,183.2 142.4,182.5 144.2,181.8 146.1,181.0 147.9,180.1 149.8,179.1 151.6,178.1 153.4,177.0 155.3,175.9 157.1,174.7 159.0,173.4 160.8,172.0 162.6,170.6 164.5,169.1 166.3,167.5 168.2,165.8 170.0,164.1 171.8,162.3 173.7,160.5 175.5,158.6 177.4,156.6 179.2,154.5 181.0,152.4 182.9,150.2 184.7,147.9 186.6,145.5 188.4,143.1 190.2,140.6 192.1,138.1 193.9,135.5 195.8,132.8 197.6,130.0 199.4,127.2 201.3,124.3 203.1,121.3 205.0,118.2 206.8,115.1 208.6,111.9 210.5,108.7 212.3,105.4 214.2,102.0 216.0,98.5"/>
<polyline class="sL" points="50.4,130.0 57.8,140.6 64.4,149.3 70.3,156.2 75.7,161.9 80.5,166.5 84.9,170.2 88.8,173.2 92.3,175.6 95.5,177.6 98.3,179.2" style="stroke-dasharray:3 3"/>
<circle class="sPw" cx="50.4" cy="130.0" r="4.5"/>
<circle class="sPw" cx="57.8" cy="140.6" r="3.5"/>
<circle class="sPw" cx="64.4" cy="149.3" r="3.5"/>
<circle class="sPw" cx="70.3" cy="156.2" r="3.5"/>
<circle class="sPw" cx="75.7" cy="161.9" r="3.5"/>
<circle class="sPw" cx="80.5" cy="166.5" r="3.5"/>
<circle class="sPw" cx="84.9" cy="170.2" r="3.5"/>
<circle class="sPw" cx="88.8" cy="173.2" r="3.5"/>
<circle class="sPw" cx="92.3" cy="175.6" r="3.5"/>
<circle class="sPw" cx="95.5" cy="177.6" r="3.5"/>
<circle class="sPw" cx="98.3" cy="179.2" r="3.5"/>
<text class="sC" x="124" y="196" text-anchor="middle">after 10 steps: θ = 1.61</text>
<rect class="sN" x="250" y="30" width="220" height="172" rx="8"/><text class="sGt" x="360" y="22" text-anchor="middle">η = 0.4: about right</text>
<polyline class="sLm" points="268.0,98.5 269.8,102.0 271.7,105.4 273.5,108.7 275.4,111.9 277.2,115.1 279.0,118.2 280.9,121.3 282.7,124.3 284.6,127.2 286.4,130.0 288.2,132.8 290.1,135.5 291.9,138.1 293.8,140.6 295.6,143.1 297.4,145.5 299.3,147.9 301.1,150.2 303.0,152.4 304.8,154.5 306.6,156.6 308.5,158.6 310.3,160.5 312.2,162.3 314.0,164.1 315.8,165.8 317.7,167.5 319.5,169.1 321.4,170.6 323.2,172.0 325.0,173.4 326.9,174.7 328.7,175.9 330.6,177.0 332.4,178.1 334.2,179.1 336.1,180.1 337.9,181.0 339.8,181.8 341.6,182.5 343.4,183.2 345.3,183.8 347.1,184.3 349.0,184.7 350.8,185.1 352.6,185.4 354.5,185.7 356.3,185.9 358.2,186.0 360.0,186.0 361.8,186.0 363.7,185.9 365.5,185.7 367.4,185.4 369.2,185.1 371.0,184.7 372.9,184.3 374.7,183.8 376.6,183.2 378.4,182.5 380.2,181.8 382.1,181.0 383.9,180.1 385.8,179.1 387.6,178.1 389.4,177.0 391.3,175.9 393.1,174.7 395.0,173.4 396.8,172.0 398.6,170.6 400.5,169.1 402.3,167.5 404.2,165.8 406.0,164.1 407.8,162.3 409.7,160.5 411.5,158.6 413.4,156.6 415.2,154.5 417.0,152.4 418.9,150.2 420.7,147.9 422.6,145.5 424.4,143.1 426.2,140.6 428.1,138.1 429.9,135.5 431.8,132.8 433.6,130.0 435.4,127.2 437.3,124.3 439.1,121.3 441.0,118.2 442.8,115.1 444.6,111.9 446.5,108.7 448.3,105.4 450.2,102.0 452.0,98.5"/>
<polyline class="sL" points="286.4,130.0 345.3,183.8 357.1,185.9 359.4,186.0 359.9,186.0 360.0,186.0 360.0,186.0 360.0,186.0 360.0,186.0 360.0,186.0 360.0,186.0" style="stroke-dasharray:3 3"/>
<circle class="sPg" cx="286.4" cy="130.0" r="4.5"/>
<circle class="sPg" cx="345.3" cy="183.8" r="3.5"/>
<circle class="sPg" cx="357.1" cy="185.9" r="3.5"/>
<circle class="sPg" cx="359.4" cy="186.0" r="3.5"/>
<circle class="sPg" cx="359.9" cy="186.0" r="3.5"/>
<circle class="sPg" cx="360.0" cy="186.0" r="3.5"/>
<circle class="sPg" cx="360.0" cy="186.0" r="3.5"/>
<circle class="sPg" cx="360.0" cy="186.0" r="3.5"/>
<circle class="sPg" cx="360.0" cy="186.0" r="3.5"/>
<circle class="sPg" cx="360.0" cy="186.0" r="3.5"/>
<circle class="sPg" cx="360.0" cy="186.0" r="3.5"/>
<text class="sC" x="360" y="196" text-anchor="middle">after 10 steps: θ = 3.00</text>
<rect class="sN" x="486" y="30" width="220" height="172" rx="8"/><text class="sRt" x="596" y="22" text-anchor="middle">η = 1.02: diverges</text>
<polyline class="sLm" points="504.0,98.5 505.8,102.0 507.7,105.4 509.5,108.7 511.4,111.9 513.2,115.1 515.0,118.2 516.9,121.3 518.7,124.3 520.6,127.2 522.4,130.0 524.2,132.8 526.1,135.5 527.9,138.1 529.8,140.6 531.6,143.1 533.4,145.5 535.3,147.9 537.1,150.2 539.0,152.4 540.8,154.5 542.6,156.6 544.5,158.6 546.3,160.5 548.2,162.3 550.0,164.1 551.8,165.8 553.7,167.5 555.5,169.1 557.4,170.6 559.2,172.0 561.0,173.4 562.9,174.7 564.7,175.9 566.6,177.0 568.4,178.1 570.2,179.1 572.1,180.1 573.9,181.0 575.8,181.8 577.6,182.5 579.4,183.2 581.3,183.8 583.1,184.3 585.0,184.7 586.8,185.1 588.6,185.4 590.5,185.7 592.3,185.9 594.2,186.0 596.0,186.0 597.8,186.0 599.7,185.9 601.5,185.7 603.4,185.4 605.2,185.1 607.0,184.7 608.9,184.3 610.7,183.8 612.6,183.2 614.4,182.5 616.2,181.8 618.1,181.0 619.9,180.1 621.8,179.1 623.6,178.1 625.4,177.0 627.3,175.9 629.1,174.7 631.0,173.4 632.8,172.0 634.6,170.6 636.5,169.1 638.3,167.5 640.2,165.8 642.0,164.1 643.8,162.3 645.7,160.5 647.5,158.6 649.4,156.6 651.2,154.5 653.0,152.4 654.9,150.2 656.7,147.9 658.6,145.5 660.4,143.1 662.2,140.6 664.1,138.1 665.9,135.5 667.8,132.8 669.6,130.0 671.4,127.2 673.3,124.3 675.1,121.3 677.0,118.2 678.8,115.1 680.6,111.9 682.5,108.7 684.3,105.4 686.2,102.0 688.0,98.5"/>
<polyline class="sL" points="522.4,130.0 672.5,125.4 516.4,120.5 678.8,115.1 509.9,109.4 685.5,103.1" style="stroke-dasharray:3 3"/>
<circle class="sPr" cx="522.4" cy="130.0" r="4.5"/>
<circle class="sPr" cx="672.5" cy="125.4" r="3.5"/>
<circle class="sPr" cx="516.4" cy="120.5" r="3.5"/>
<circle class="sPr" cx="678.8" cy="115.1" r="3.5"/>
<circle class="sPr" cx="509.9" cy="109.4" r="3.5"/>
<circle class="sPr" cx="685.5" cy="103.1" r="3.5"/>
<text class="sC" x="596" y="196" text-anchor="middle">after 10 steps: θ = -2.92</text>
<text class="sS" x="360" y="226" text-anchor="middle">L(θ) = (θ − 3)², start θ = −1, update θ ← θ − η·2(θ − 3); above η = 1 every step overshoots further than the last</text>
</svg><figcaption>The learning rate is the one hyperparameter of plain gradient descent, and it fails in both directions. Computed.</figcaption></figure>

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

<figure class="dia"><svg viewBox="0 0 720 254" role="img" aria-label="Left: Géron's noisy quadratic data fitted with a straight line, R squared about 0.5, and with features x and x squared, R squared about 0.78, recovering coefficients close to 2, 1 and 0.5. Right: the number of polynomial feature columns grows from 6 for two features at degree 2 to 1,771 for twenty features at degree 3 and 316,251 for fifty features at degree 4">
<line class="sLm" x1="40" y1="210" x2="340" y2="210"/><line class="sLm" x1="40" y1="210" x2="40" y2="30"/>
<text class="sS" x="40" y="224" text-anchor="middle">-3</text>
<text class="sS" x="190" y="224" text-anchor="middle">0</text>
<text class="sS" x="340" y="224" text-anchor="middle">3</text>
<circle class="sPv" cx="272.2" cy="99.1" r="2.4" opacity=".7"/><circle class="sPv" cx="171.7" cy="168.1" r="2.4" opacity=".7"/><circle class="sPv" cx="297.6" cy="88.7" r="2.4" opacity=".7"/><circle class="sPv" cx="249.2" cy="102.2" r="2.4" opacity=".7"/><circle class="sPv" cx="68.3" cy="147.4" r="2.4" opacity=".7"/><circle class="sPv" cx="332.7" cy="35.1" r="2.4" opacity=".7"/><circle class="sPv" cx="268.3" cy="122.1" r="2.4" opacity=".7"/><circle class="sPv" cx="275.8" cy="105.2" r="2.4" opacity=".7"/><circle class="sPv" cx="78.4" cy="160.4" r="2.4" opacity=".7"/><circle class="sPv" cx="175.1" cy="158.9" r="2.4" opacity=".7"/><circle class="sPv" cx="151.2" cy="144.5" r="2.4" opacity=".7"/><circle class="sPv" cx="318.0" cy="88.3" r="2.4" opacity=".7"/><circle class="sPv" cx="233.2" cy="124.9" r="2.4" opacity=".7"/><circle class="sPv" cx="286.8" cy="89.3" r="2.4" opacity=".7"/><circle class="sPv" cx="173.0" cy="163.1" r="2.4" opacity=".7"/><circle class="sPv" cx="108.2" cy="176.2" r="2.4" opacity=".7"/><circle class="sPv" cx="206.4" cy="143.2" r="2.4" opacity=".7"/><circle class="sPv" cx="59.1" cy="145.8" r="2.4" opacity=".7"/><circle class="sPv" cx="288.3" cy="88.0" r="2.4" opacity=".7"/><circle class="sPv" cx="229.5" cy="133.1" r="2.4" opacity=".7"/><circle class="sPv" cx="267.4" cy="84.8" r="2.4" opacity=".7"/><circle class="sPv" cx="146.4" cy="161.0" r="2.4" opacity=".7"/><circle class="sPv" cx="331.2" cy="63.2" r="2.4" opacity=".7"/><circle class="sPv" cx="307.9" cy="70.2" r="2.4" opacity=".7"/><circle class="sPv" cx="273.5" cy="100.7" r="2.4" opacity=".7"/><circle class="sPv" cx="98.4" cy="131.9" r="2.4" opacity=".7"/><circle class="sPv" cx="180.0" cy="140.2" r="2.4" opacity=".7"/><circle class="sPv" cx="53.1" cy="129.5" r="2.4" opacity=".7"/><circle class="sPv" cx="86.3" cy="126.9" r="2.4" opacity=".7"/><circle class="sPv" cx="244.9" cy="142.3" r="2.4" opacity=".7"/><circle class="sPv" cx="263.4" cy="121.4" r="2.4" opacity=".7"/><circle class="sPv" cx="330.3" cy="62.8" r="2.4" opacity=".7"/><circle class="sPv" cx="137.7" cy="163.3" r="2.4" opacity=".7"/><circle class="sPv" cx="151.1" cy="177.8" r="2.4" opacity=".7"/><circle class="sPv" cx="180.9" cy="143.0" r="2.4" opacity=".7"/><circle class="sPv" cx="96.8" cy="155.2" r="2.4" opacity=".7"/><circle class="sPv" cx="79.0" cy="168.4" r="2.4" opacity=".7"/><circle class="sPv" cx="182.7" cy="167.3" r="2.4" opacity=".7"/><circle class="sPv" cx="108.1" cy="149.7" r="2.4" opacity=".7"/><circle class="sPv" cx="240.9" cy="114.4" r="2.4" opacity=".7"/><circle class="sPv" cx="171.1" cy="124.6" r="2.4" opacity=".7"/><circle class="sPv" cx="289.8" cy="46.5" r="2.4" opacity=".7"/><circle class="sPv" cx="250.1" cy="114.9" r="2.4" opacity=".7"/><circle class="sPv" cx="133.7" cy="172.2" r="2.4" opacity=".7"/><circle class="sPv" cx="289.7" cy="122.3" r="2.4" opacity=".7"/><circle class="sPv" cx="281.4" cy="93.5" r="2.4" opacity=".7"/><circle class="sPv" cx="156.2" cy="168.9" r="2.4" opacity=".7"/><circle class="sPv" cx="126.5" cy="163.2" r="2.4" opacity=".7"/><circle class="sPv" cx="244.7" cy="133.8" r="2.4" opacity=".7"/><circle class="sPv" cx="81.9" cy="149.5" r="2.4" opacity=".7"/><circle class="sPv" cx="100.0" cy="136.7" r="2.4" opacity=".7"/><circle class="sPv" cx="42.2" cy="126.5" r="2.4" opacity=".7"/><circle class="sPv" cx="276.1" cy="104.3" r="2.4" opacity=".7"/><circle class="sPv" cx="239.5" cy="143.4" r="2.4" opacity=".7"/><circle class="sPv" cx="251.5" cy="145.3" r="2.4" opacity=".7"/><circle class="sPv" cx="274.2" cy="110.8" r="2.4" opacity=".7"/><circle class="sPv" cx="177.7" cy="154.0" r="2.4" opacity=".7"/><circle class="sPv" cx="210.6" cy="116.0" r="2.4" opacity=".7"/><circle class="sPv" cx="81.9" cy="145.4" r="2.4" opacity=".7"/><circle class="sPv" cx="74.4" cy="129.8" r="2.4" opacity=".7"/><circle class="sPv" cx="240.5" cy="134.7" r="2.4" opacity=".7"/><circle class="sPv" cx="181.3" cy="170.1" r="2.4" opacity=".7"/><circle class="sPv" cx="209.6" cy="157.5" r="2.4" opacity=".7"/><circle class="sPv" cx="269.5" cy="118.1" r="2.4" opacity=".7"/><circle class="sPv" cx="230.4" cy="101.0" r="2.4" opacity=".7"/><circle class="sPv" cx="206.1" cy="156.7" r="2.4" opacity=".7"/><circle class="sPv" cx="207.8" cy="131.1" r="2.4" opacity=".7"/><circle class="sPv" cx="131.2" cy="170.8" r="2.4" opacity=".7"/><circle class="sPv" cx="49.2" cy="118.8" r="2.4" opacity=".7"/><circle class="sPv" cx="171.0" cy="148.8" r="2.4" opacity=".7"/><circle class="sPv" cx="104.4" cy="156.0" r="2.4" opacity=".7"/><circle class="sPv" cx="162.6" cy="156.6" r="2.4" opacity=".7"/><circle class="sPv" cx="296.0" cy="94.3" r="2.4" opacity=".7"/><circle class="sPv" cx="110.2" cy="148.1" r="2.4" opacity=".7"/><circle class="sPv" cx="57.5" cy="143.9" r="2.4" opacity=".7"/><circle class="sPv" cx="124.4" cy="175.2" r="2.4" opacity=".7"/><circle class="sPv" cx="128.1" cy="176.2" r="2.4" opacity=".7"/><circle class="sPv" cx="238.6" cy="125.8" r="2.4" opacity=".7"/><circle class="sPv" cx="207.1" cy="120.3" r="2.4" opacity=".7"/><circle class="sPv" cx="275.2" cy="100.3" r="2.4" opacity=".7"/><circle class="sPv" cx="239.3" cy="129.7" r="2.4" opacity=".7"/><circle class="sPv" cx="161.9" cy="151.8" r="2.4" opacity=".7"/><circle class="sPv" cx="284.2" cy="75.5" r="2.4" opacity=".7"/><circle class="sPv" cx="90.1" cy="146.7" r="2.4" opacity=".7"/><circle class="sPv" cx="46.8" cy="137.6" r="2.4" opacity=".7"/><circle class="sPv" cx="67.0" cy="124.9" r="2.4" opacity=".7"/><circle class="sPv" cx="256.7" cy="110.2" r="2.4" opacity=".7"/><circle class="sPv" cx="178.6" cy="130.0" r="2.4" opacity=".7"/><circle class="sPv" cx="88.4" cy="146.8" r="2.4" opacity=".7"/><circle class="sPv" cx="190.3" cy="168.3" r="2.4" opacity=".7"/><circle class="sPv" cx="85.7" cy="169.2" r="2.4" opacity=".7"/><circle class="sPv" cx="248.9" cy="97.2" r="2.4" opacity=".7"/><circle class="sPv" cx="173.8" cy="128.2" r="2.4" opacity=".7"/><circle class="sPv" cx="154.3" cy="159.6" r="2.4" opacity=".7"/><circle class="sPv" cx="130.5" cy="163.0" r="2.4" opacity=".7"/><circle class="sPv" cx="229.1" cy="111.8" r="2.4" opacity=".7"/><circle class="sPv" cx="148.5" cy="173.9" r="2.4" opacity=".7"/><circle class="sPv" cx="66.3" cy="154.6" r="2.4" opacity=".7"/><circle class="sPv" cx="75.4" cy="135.3" r="2.4" opacity=".7"/><circle class="sPv" cx="328.6" cy="56.7" r="2.4" opacity=".7"/>
<polyline class="sLw" points="40.0,170.8 45.0,169.5 50.0,168.1 55.0,166.8 60.0,165.4 65.0,164.1 70.0,162.7 75.0,161.3 80.0,160.0 85.0,158.6 90.0,157.3 95.0,155.9 100.0,154.6 105.0,153.2 110.0,151.9 115.0,150.5 120.0,149.2 125.0,147.8 130.0,146.5 135.0,145.1 140.0,143.8 145.0,142.4 150.0,141.1 155.0,139.7 160.0,138.4 165.0,137.0 170.0,135.7 175.0,134.3 180.0,133.0 185.0,131.6 190.0,130.3 195.0,128.9 200.0,127.6 205.0,126.2 210.0,124.9 215.0,123.5 220.0,122.2 225.0,120.8 230.0,119.5 235.0,118.1 240.0,116.8 245.0,115.4 250.0,114.1 255.0,112.7 260.0,111.3 265.0,110.0 270.0,108.6 275.0,107.3 280.0,105.9 285.0,104.6 290.0,103.2 295.0,101.9 300.0,100.5 305.0,99.2 310.0,97.8 315.0,96.5 320.0,95.1 325.0,93.8 330.0,92.4 335.0,91.1 340.0,89.7" style="fill:none;stroke-width:2"/>
<polyline class="sLg" points="40.0,130.8 45.0,133.4 50.0,135.9 55.0,138.3 60.0,140.5 65.0,142.6 70.0,144.6 75.0,146.4 80.0,148.1 85.0,149.6 90.0,151.0 95.0,152.2 100.0,153.3 105.0,154.3 110.0,155.1 115.0,155.8 120.0,156.3 125.0,156.7 130.0,157.0 135.0,157.1 140.0,157.1 145.0,156.9 150.0,156.6 155.0,156.1 160.0,155.5 165.0,154.8 170.0,153.9 175.0,152.9 180.0,151.8 185.0,150.5 190.0,149.0 195.0,147.5 200.0,145.7 205.0,143.9 210.0,141.9 215.0,139.7 220.0,137.4 225.0,135.0 230.0,132.4 235.0,129.7 240.0,126.9 245.0,123.9 250.0,120.7 255.0,117.5 260.0,114.1 265.0,110.5 270.0,106.8 275.0,103.0 280.0,99.0 285.0,94.9 290.0,90.6 295.0,86.2 300.0,81.6 305.0,77.0 310.0,72.1 315.0,67.2 320.0,62.0 325.0,56.8 330.0,51.4 335.0,45.9 340.0,40.2" style="fill:none;stroke-width:2.5"/>
<text class="sWt" x="48" y="40">features [x]: R² = 0.49</text>
<text class="sGt" x="48" y="58">features [x, x²]: R² = 0.78</text>
<text class="sS" x="190" y="244" text-anchor="middle">learned ŷ = 2.06 + 1.01x + 0.47x²  (this run; true 2, 1, 0.5)</text>
<text class="sT" x="543" y="26" text-anchor="middle">columns from PolynomialFeatures(degree=d)</text>
<text class="sS" x="400" y="50" text-anchor="middle">n</text>
<text class="sS" x="480" y="50" text-anchor="middle">d = 2</text>
<text class="sS" x="570" y="50" text-anchor="middle">d = 3</text>
<text class="sS" x="660" y="50" text-anchor="middle">d = 4</text>
<text class="sT" x="400" y="75" text-anchor="middle">2</text>
<rect class="sG" x="440" y="58" width="80" height="24" rx="4" opacity=".45"/><text class="sT" x="480" y="75" text-anchor="middle">6</text>
<rect class="sG" x="530" y="58" width="80" height="24" rx="4" opacity=".45"/><text class="sT" x="570" y="75" text-anchor="middle">10</text>
<rect class="sG" x="620" y="58" width="80" height="24" rx="4" opacity=".45"/><text class="sT" x="660" y="75" text-anchor="middle">15</text>
<text class="sT" x="400" y="103" text-anchor="middle">5</text>
<rect class="sG" x="440" y="86" width="80" height="24" rx="4" opacity=".45"/><text class="sT" x="480" y="103" text-anchor="middle">21</text>
<rect class="sG" x="530" y="86" width="80" height="24" rx="4" opacity=".45"/><text class="sT" x="570" y="103" text-anchor="middle">56</text>
<rect class="sG" x="620" y="86" width="80" height="24" rx="4" opacity=".45"/><text class="sT" x="660" y="103" text-anchor="middle">126</text>
<text class="sT" x="400" y="131" text-anchor="middle">10</text>
<rect class="sG" x="440" y="114" width="80" height="24" rx="4" opacity=".45"/><text class="sT" x="480" y="131" text-anchor="middle">66</text>
<rect class="sG" x="530" y="114" width="80" height="24" rx="4" opacity=".45"/><text class="sT" x="570" y="131" text-anchor="middle">286</text>
<rect class="sW" x="620" y="114" width="80" height="24" rx="4" opacity=".45"/><text class="sT" x="660" y="131" text-anchor="middle">1,001</text>
<text class="sT" x="400" y="159" text-anchor="middle">20</text>
<rect class="sG" x="440" y="142" width="80" height="24" rx="4" opacity=".45"/><text class="sT" x="480" y="159" text-anchor="middle">231</text>
<rect class="sW" x="530" y="142" width="80" height="24" rx="4" opacity=".45"/><text class="sT" x="570" y="159" text-anchor="middle">1,771</text>
<rect class="sR" x="620" y="142" width="80" height="24" rx="4" opacity=".45"/><text class="sT" x="660" y="159" text-anchor="middle">10,626</text>
<text class="sT" x="400" y="187" text-anchor="middle">50</text>
<rect class="sW" x="440" y="170" width="80" height="24" rx="4" opacity=".45"/><text class="sT" x="480" y="187" text-anchor="middle">1,326</text>
<rect class="sR" x="530" y="170" width="80" height="24" rx="4" opacity=".45"/><text class="sT" x="570" y="187" text-anchor="middle">23,426</text>
<rect class="sR" x="620" y="170" width="80" height="24" rx="4" opacity=".45"/><text class="sT" x="660" y="187" text-anchor="middle">316,251</text>
<text class="sS" x="543" y="214" text-anchor="middle">(n+d)! / (d!·n!), including the bias column</text><text class="sS" x="543" y="232" text-anchor="middle">checked against sklearn for n ≤ 20, d ≤ 3</text>
</svg><figcaption>Polynomial features, both sides of the trade: the same linear model bends to fit a quadratic, and the column count explodes with features and degree.</figcaption></figure>

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
