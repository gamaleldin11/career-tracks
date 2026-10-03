# Features and Leakage — Building Inputs That Help, Without Cheating

On tabular business data, **features matter more than the choice of algorithm**, and **leakage** is the most common way a model that looked brilliant offline fails in production. Interviewers probe both: "what features would you build for churn?" and "your validation AUC is 0.99. What's wrong?". Your *AI Journey* Part 4 covers cleaning and preprocessing mechanics in depth; this module focuses on feature design for real business problems and on leakage in all its forms.

> [!focus]
> **Entry must:** encode categoricals and scale numerics appropriately; build features as of a prediction time; explain data leakage with examples; use scikit-learn pipelines so preprocessing is fitted on training data only; handle class imbalance sensibly.
> **Mid adds:** target encoding without leakage, temporal and group leakage, point-in-time joins, time-based and grouped validation, feature selection with permutation importance, recognising leakage from suspicious results.
> **Most asked:** *What is data leakage?* · *How do you encode a high-cardinality categorical?* · *Do trees need scaling?* · *How do you handle imbalance?* · *Why use a pipeline?* · *Your model scores 0.99 AUC. What do you check?*
> **Time budget:** 3 hours.

## DS2.1 What good features look like 🟢 ⭐

A good feature carries signal about the target, is **available at prediction time**, is computed the **same way** in training and in production, and is robust to small data changes.

For churn-like problems, the strongest features usually describe **behaviour over time, relative to the customer's own history**:

| Family | Examples (as of the prediction time) |
|---|---|
| **Recency** | Days since last recharge, last order, last login |
| **Frequency** | Orders in the last 7, 30 and 90 days |
| **Monetary** | Spend in the last 30 days; average order value |
| **Trend** | Spend last 30 days ÷ spend previous 30 days; slope of weekly activity |
| **Engagement** | Distinct services used; app sessions per week |
| **Experience** | Complaints, failed payments, late deliveries, dropped calls in the last 30 days |
| **Tenure and lifecycle** | Days since sign-up; plan changes |
| **Context** | Region, device, acquisition channel, plan type |

> [!say]
> "For churn I'd build recency, frequency and spend features over several windows, ratios that capture a change in behaviour, like this month's usage compared with the previous month, and experience features like complaints or failed payments, all computed as of the prediction date so nothing from the future leaks in."

## DS2.2 Numeric features 🟢

| Technique | When |
|---|---|
| **Scaling** (standardisation, min-max) | Distance- and gradient-based models: k-NN, SVM, linear/logistic regression with regularisation, neural networks, PCA, k-means. **Trees and gradient-boosted trees don't need it** |
| **Log or Box-Cox transform** | Right-skewed money and count data, for linear models |
| **Robust scaling / clipping (winsorising)** | Outliers that would dominate a linear model |
| **Binning** | Explainability (age bands in a scorecard); otherwise often loses information |
| **Ratios and differences** | Domain knowledge: debt-to-income, usage change, price relative to category average |
| **Interactions** | For linear models; tree ensembles find many interactions themselves |

## DS2.3 Categorical encoding 🟢 🟡 ⭐

| Encoding | How | Use | Watch out |
|---|---|---|---|
| **One-hot** | A 0/1 column per category | Low cardinality (city, plan type) | Explodes with many categories; handle unknown categories at prediction |
| **Ordinal** | Map ordered categories to integers | Ordered levels (bronze < silver < gold); fine for trees with any category | Implies an order for linear models |
| **Frequency / count** | Replace a category with how often it appears | High cardinality | Different categories with equal counts collide |
| **Target (mean) encoding** | Replace a category with the mean target for it | High cardinality (merchant ID, postcode) | **Leaks** unless computed out-of-fold and smoothed |
| **Native categorical support** | LightGBM, CatBoost and scikit-learn's HistGradientBoosting handle categories directly | Tree ensembles | CatBoost uses ordered target statistics to avoid leakage |
| **Embeddings** | Learned dense vectors | Very high cardinality in neural models | Needs data and training |

```python
from sklearn.preprocessing import TargetEncoder        # scikit-learn 1.3+: cross-fitted internally
enc = TargetEncoder(smooth="auto", cv=5)                # fit_transform uses out-of-fold means on the training data
```

> [!mistake] Target encoding fitted on all the data
> If each row's category mean includes **that row's own target**, the feature quietly contains the answer; validation scores soar and production disappoints. Use out-of-fold (cross-fitted) encoding with smoothing, and fit it only on training folds.

## DS2.4 Data leakage, in all its forms ⭐

> [!term] Data leakage
> When information that **won't be available at prediction time** (often the answer itself, or data from the future, or from the test set) gets into training or evaluation. Offline scores look excellent; the deployed model performs much worse.

| Type | Example | Prevention |
|---|---|---|
| **Target leakage** | A churn model uses "cancellation reason", "account closed date" or "number of retention calls", which only exist **because** the customer churned | Ask for every feature: "would I know this at the prediction time?" Build features from data timestamped before the cut-off |
| **Train-test contamination** | Scaling, imputation, encoding or SMOTE **fitted on the full data** before splitting | Fit all preprocessing **inside a pipeline** on training folds only |
| **Temporal leakage** | A random split on time-ordered data: the model trains on December and is tested on November | **Time-based splits**: train on the past, validate on the future |
| **Group leakage** | The same customer (or patient, device, store) appears in both train and test, so the model memorises the entity | **Group k-fold** by customer ID |
| **Duplicate leakage** | Near-identical rows in train and test | Deduplicate before splitting |
| **Label-definition leakage** | The target window overlaps the feature window | Features end at the cut-off; the target window starts after it |
| **Tuning on the test set** | Choosing hyperparameters by test score | Tune on validation (cross-validation); touch the test set once |

**Signs of leakage:** a suspiciously high score (AUC 0.99 on a hard problem); one feature dominates importance; performance drops sharply on a later time period; a feature's meaning involves the outcome.

> [!say]
> "Leakage is when the model sees information it won't have at prediction time, like a cancellation reason in a churn model, preprocessing fitted on the whole dataset, or future rows in a random split of time data. I prevent it by building features strictly before a cut-off date, putting all preprocessing inside a pipeline fitted on training folds, and validating on later time periods and with grouped splits by customer."

> [!story]
> Your capstone used imbalanced-learn and SMOTE. A sharp interviewer will ask **where** SMOTE was applied. The correct answer is inside the pipeline, on the training folds only (`imblearn.pipeline.Pipeline`), never on the full dataset before splitting; otherwise synthetic points built from test-set neighbours leak into training. *AI Journey* Part 4 covers this, and its "fit on train, transform everything" idea is the core of this module.

## DS2.5 Pipelines: preprocessing that can't leak 🟢 ⭐

```python
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import cross_val_score, TimeSeriesSplit

numeric = ["days_since_last_recharge", "spend_30d", "spend_change_ratio", "complaints_30d", "tenure_days"]
categorical = ["region", "plan_type", "device_os"]

preprocess = ColumnTransformer([
    ("num", Pipeline([("impute", SimpleImputer(strategy="median", add_indicator=True)),
                      ("scale", StandardScaler())]), numeric),
    ("cat", OneHotEncoder(handle_unknown="infrequent_if_exist", min_frequency=50), categorical),
])
model = Pipeline([("prep", preprocess), ("clf", LogisticRegression(max_iter=1000, class_weight="balanced"))])

scores = cross_val_score(model, X, y, cv=TimeSeriesSplit(n_splits=5), scoring="average_precision")
```

The **pipeline** is what you cross-validate, tune, save and deploy, so production applies exactly the same transformations, fitted on training data ([[DS8]]).

## DS2.6 Temporal features and point-in-time correctness 🟡 ⭐

Build a training table with **one row per entity per prediction date** (a "snapshot"), with features computed from data **before** that date and the label from **after** it:

```sql
-- One row per subscriber per weekly cut-off; features from the past 30/90 days, label from the next 30
WITH cutoffs AS (SELECT generate_series('2026-01-04'::date, '2026-06-28'::date, interval '7 days')::date AS cutoff)
SELECT s.subscriber_id, c.cutoff,
       COUNT(*) FILTER (WHERE r.recharge_at >= c.cutoff - 30 AND r.recharge_at < c.cutoff)          AS recharges_30d,
       SUM(r.amount) FILTER (WHERE r.recharge_at >= c.cutoff - 30 AND r.recharge_at < c.cutoff)     AS spend_30d,
       c.cutoff - MAX(r.recharge_at::date) FILTER (WHERE r.recharge_at < c.cutoff)                  AS days_since_last,
       (NOT EXISTS (SELECT 1 FROM activity a WHERE a.subscriber_id = s.subscriber_id
                    AND a.active_on >= c.cutoff AND a.active_on < c.cutoff + 30))::int              AS churned_next_30d
FROM subscribers s CROSS JOIN cutoffs c
LEFT JOIN recharges r ON r.subscriber_id = s.subscriber_id AND r.recharge_at < c.cutoff + 30
WHERE s.activated_at < c.cutoff
GROUP BY s.subscriber_id, c.cutoff;
```

Every feature filter ends at `< c.cutoff`; the label looks at `[cutoff, cutoff + 30)`.

> [!term] Point-in-time join
> Joining a slowly changing attribute (a customer's plan, a credit limit, a price) **as it was** at each snapshot date, not as it is today. Using today's value for past rows is quiet temporal leakage. Warehouses keep history with slowly changing dimensions ([[DE2.5]]); **feature stores** (Feast, Databricks Feature Store, Azure ML managed feature store) automate point-in-time correct joins and serve the same features online.

> [!story]
> FinSight's forecasting used a **time shift**: forecasting from an earlier date and comparing against real data that arrived later. That's exactly the discipline of point-in-time evaluation, and a strong bridge from your engineering work to data science.

## DS2.7 Missing values and outliers in models 🟢

- Ask why values are missing; missingness is often a signal (no phone number given, no previous loan), so add a **missing indicator** (`add_indicator=True`).
- Impute inside the pipeline (median for skewed numerics, a constant "missing" category for categoricals).
- **Gradient-boosted trees** (XGBoost, LightGBM, HistGradientBoosting) handle missing values natively by learning which branch they go down.
- Outliers: investigate first (errors or genuine extremes?); then cap, transform, or use robust models and losses (MAE, Huber).

## DS2.8 Imbalanced classes 🟢 ⭐

With 2% fraud or 5% churn, a model predicting "no" always is 95–98% accurate and useless.

| Approach | Notes |
|---|---|
| **Use the right metrics** | PR-AUC (average precision), recall at a fixed precision, precision@k, cost-based metrics ([[DS4]]) |
| **Class weights** (`class_weight="balanced"`, `scale_pos_weight` in XGBoost) | Simple, often enough; keeps all data |
| **Threshold tuning** | The default 0.5 is rarely right; choose from costs or the action budget |
| **Resampling** (random undersampling, oversampling, **SMOTE**) | Only inside cross-validation on training folds; it can distort probabilities, so recalibrate if you need them |
| **More positive examples** | Longer history, better labels, sometimes worth more than any technique |

> [!say]
> "I start by choosing metrics that reflect the imbalance, like PR-AUC and recall at the precision we need, then use class weights and tune the decision threshold from the business costs. Resampling such as SMOTE only goes inside the pipeline on training folds, and if the business uses the probabilities, I recalibrate afterwards."

## DS2.9 Feature selection 🟡

- **Start from domain logic**; too many weak features add noise and maintenance cost.
- **Permutation importance** on a validation set: how much the score drops when a feature is shuffled. More reliable than tree "gain" importance, which favours high-cardinality features.
- **SHAP values** for direction and size of effects, globally and per prediction ([[DS4.6]]).
- **Correlated features** split importance between them; **VIF** checks multicollinearity for linear models (which your capstone used).
- L1 regularisation (Lasso) for sparse linear models; recursive feature elimination when features are expensive.
- Drop features that are unstable over time, unavailable in production, or legally sensitive.

## DS2.10 Other feature types, briefly 🟢

- **Dates:** day of week, month, holidays and Ramadan flags, days to payday or month end (in Egypt, many salaries arrive near month end), cyclical encoding (sine and cosine) for linear models.
- **Geography:** governorate or zone; distances (to the nearest store, branch or hub); population density; avoid raw latitude/longitude in linear models.
- **Text:** TF-IDF or embeddings of complaint text and product descriptions ([[DS7]]).
- **Aggregations over related entities:** a merchant's fraud rate (out-of-fold!), a store's average basket.

> [!lab] Find the leak
> Build a churn snapshot table from any subscription dataset (the Telco Customer Churn dataset on Kaggle is common, or simulate with the snapshot SQL above). Train a gradient-boosted model twice: (1) with a deliberately leaky feature (something only known after churn) and preprocessing fitted on all data with a random split; (2) properly, with a pipeline, cut-off features and a time-based split. Compare the scores and the feature importances, and write down how you'd have spotted the leak. That's a memorable interview story.

## DS2.11 Interview drill 🟢 ⭐

| Question | Strong short answer |
|---|---|
| What is data leakage? | Information unavailable at prediction time reaching training or evaluation, inflating offline scores. |
| Give three kinds of leakage. | Target leakage (post-outcome features), contamination (preprocessing fitted on all data), temporal (random splits on time data); also group leakage. |
| How do you prevent leakage? | Features strictly before a cut-off, preprocessing inside a pipeline fitted on training folds, time-based and grouped validation. |
| Your AUC is 0.99. What do you check? | Features that encode the outcome, preprocessing fitted on all data, time or group leakage, duplicates; look at the top features. |
| Do tree models need scaling? | No. Splits depend on order, not scale. |
| How do you encode a high-cardinality categorical? | Out-of-fold, smoothed target encoding; frequency encoding; native categorical handling in LightGBM or CatBoost; embeddings for neural nets. |
| Why use pipelines? | Preprocessing is fitted only on training data in each fold, and the same transformations ship to production. |
| How do you handle imbalance? | Proper metrics, class weights, threshold tuning; resampling only inside CV; recalibrate if probabilities matter. |
| What's a point-in-time join? | Joining attributes as they were at each snapshot date, not today's values. |
| Permutation vs gain importance? | Permutation measures the score drop on validation data; gain is biased toward high-cardinality features. |
| What features would you build for churn? | Recency, frequency, monetary over several windows, behaviour change ratios, experience signals, tenure and context. |

## Key takeaways

> [!check]
> - Ask of every feature: would I know this at prediction time?
> - Build snapshot tables: features before the cut-off, labels after it.
> - All preprocessing, encoding and resampling lives inside the pipeline.
> - Validate the way the model will be used: by time and by entity.
> - Behavioural features relative to a customer's own history usually beat raw attributes.

## Sources

- scikit-learn user guide: [Common pitfalls and recommended practices (data leakage)](https://scikit-learn.org/stable/common_pitfalls.html), [Pipelines and composite estimators](https://scikit-learn.org/stable/modules/compose.html), [TargetEncoder](https://scikit-learn.org/stable/modules/preprocessing.html#target-encoder), [Permutation importance](https://scikit-learn.org/stable/modules/permutation_importance.html), [Cross-validation iterators (TimeSeriesSplit, GroupKFold)](https://scikit-learn.org/stable/modules/cross_validation.html#cross-validation-iterators).
- imbalanced-learn: [Pipeline and resampling](https://imbalanced-learn.org/stable/common_pitfalls.html).
- Shachar Kaufman et al., "Leakage in Data Mining: Formulation, Detection, and Avoidance" (*ACM TKDD*, 2012).
- Feast: [Point-in-time joins](https://docs.feast.dev/getting-started/concepts/point-in-time-joins).
- Kaggle: [Telco Customer Churn](https://www.kaggle.com/datasets/blastchar/telco-customer-churn).
- Your *AI Journey* Part 4 (cleaning, preprocessing, leakage-free pipelines).
