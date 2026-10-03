# Models That Win on Tables — Baselines, Linear Models, Trees and Gradient Boosting

Most data-science work in banks, telecoms and e-commerce is on **tabular** data: rows of customers, transactions or orders with mixed numeric and categorical columns. On that data, **gradient-boosted trees** (XGBoost, LightGBM, CatBoost) remain the strongest general-purpose choice, and your own course notes flag them as your biggest modelling gap. This module covers the models interviewers expect you to compare and defend, with the depth needed to tune and explain them. *AI Journey* Parts 7, 8 and 8B have the full derivations and Géron page references.

> [!focus]
> **Entry must:** start from a baseline; explain linear and logistic regression and interpret coefficients; explain decision trees, random forests and boosting at an intuitive level; know which models need scaling; tune with cross-validation.
> **Mid adds:** how gradient boosting fits residuals, the key hyperparameters and early stopping, XGBoost vs LightGBM vs CatBoost, regularisation, Bayesian tuning with Optuna, stacking, when neural networks or tabular foundation models are worth trying.
> **Most asked:** *Bagging vs boosting?* · *Random forest vs gradient boosting?* · *How does gradient boosting work?* · *Which hyperparameters matter in XGBoost or LightGBM?* · *Logistic regression: how do you interpret a coefficient?* · *L1 vs L2?* · *Why not deep learning here?*
> **Time budget:** 4 hours, with a notebook.

## DS3.1 Baselines first 🟢 ⭐

Every model needs something to beat:

| Baseline | Example |
|---|---|
| **Trivial** | Predict the majority class; predict the mean or median; for time series, last value or the same day last week |
| **Business rule** | "No recharge in 14 days → churn risk" |
| **Simple model** | Logistic regression on a handful of strong features |

If the complex model beats the rule by a hair, the rule may be the better product (transparent, cheap, already trusted). Reporting the baseline is also how you show the model's value honestly: "the model catches 62% of churners in the top 10%, vs 38% for the current rule."

## DS3.2 Linear and logistic regression 🟢 ⭐

**Linear regression** predicts a number as a weighted sum of features; **logistic regression** passes that sum through a sigmoid to predict a probability.

- **Interpretation (linear):** a coefficient is the expected change in the target for a one-unit increase in that feature, **holding the others constant**.
- **Interpretation (logistic):** a coefficient is the change in the **log-odds**; `exp(coefficient)` is an **odds ratio**: 1.30 means each extra complaint multiplies the odds of churn by 1.3, other things equal.
- **Needs scaling** when regularised (so the penalty treats features fairly), and benefits from transformed skewed features.
- **Regularisation:**

| Penalty | Effect | Use |
|---|---|---|
| **L2 (Ridge)** | Shrinks all coefficients smoothly | Many correlated features; general default |
| **L1 (Lasso)** | Drives some coefficients **exactly to zero** | Feature selection, sparse models |
| **Elastic net** | A mix | Correlated groups plus sparsity |

> [!say]
> "Logistic regression gives me a fast, calibrated-ish, explainable baseline: each coefficient is a change in log-odds, so the exponent is an odds ratio I can explain to the business. L2 regularisation handles correlated features; L1 zeroes out weak ones, which doubles as feature selection."

**Strengths:** fast, explainable, stable, good probability estimates, works well with limited data, the standard in credit **scorecards** (often on binned features with weight-of-evidence encoding). **Weaknesses:** misses non-linear effects and interactions unless you engineer them.

## DS3.3 Decision trees 🟢

A tree splits the data on feature thresholds to make groups as **pure** as possible (by Gini impurity or entropy for classification, variance for regression).

- **Pros:** no scaling needed; handles non-linearity and interactions; readable when shallow.
- **Cons:** a single deep tree **overfits** badly and is unstable (small data changes, different tree). Control with `max_depth`, `min_samples_leaf` and pruning.

Trees matter mainly as the building block of the ensembles below.

## DS3.4 Random forests (bagging) 🟢 ⭐

> [!term] Bagging (bootstrap aggregating)
> Train many models on **bootstrap samples** (random samples with replacement) of the data and **average** their predictions. Averaging many high-variance, low-bias models (deep trees) **reduces variance**.

A **random forest** adds a second source of randomness: each split considers only a random subset of features (`max_features`), so trees are less correlated and the average improves more.

- **Strengths:** strong out of the box, hard to overfit badly by adding trees, few sensitive hyperparameters, parallel training, built-in **out-of-bag (OOB)** validation (each tree is scored on the samples it didn't see).
- **Weaknesses:** large models, slower prediction; usually beaten by well-tuned boosting on tabular data; probability estimates often need calibration.

## DS3.5 Gradient boosting 🟢 🟡 ⭐

> [!term] Boosting
> Train models **sequentially**, each one focusing on the errors of the ensemble so far, and **add** them up. Boosting mainly **reduces bias**: it combines many weak, shallow trees into a strong model.

**How gradient boosting works, intuitively:**

1. Start with a simple prediction (the mean, or the log-odds of the base rate).
2. Compute the **residuals**, more precisely the negative **gradient** of the loss with respect to the current predictions.
3. Fit a small tree to those residuals.
4. Add the tree's predictions, **scaled by a learning rate** (say 0.05), to the ensemble.
5. Repeat for hundreds or thousands of rounds, stopping when validation error stops improving (**early stopping**).

<figure class="dia"><svg viewBox="0 0 720 150" role="img" aria-label="Gradient boosting: each tree fits the residuals of the ensemble so far">
<g class="sT" text-anchor="middle">
<rect class="sB" x="10" y="45" width="110" height="56" rx="8"/><text x="65" y="70">Base</text><text class="sS" x="65" y="88">mean / log-odds</text>
<rect class="sA" x="160" y="45" width="110" height="56" rx="8"/><text x="215" y="70">Tree 1</text><text class="sS" x="215" y="88">fits residuals</text>
<rect class="sA" x="310" y="45" width="110" height="56" rx="8"/><text x="365" y="70">Tree 2</text><text class="sS" x="365" y="88">fits new residuals</text>
<rect class="sA" x="460" y="45" width="110" height="56" rx="8"/><text x="515" y="70">Tree N</text><text class="sS" x="515" y="88">… until early stop</text>
<rect class="sG" x="610" y="45" width="100" height="56" rx="8"/><text x="660" y="70">Prediction</text><text class="sS" x="660" y="88">sum × η</text>
</g>
<line class="sL" x1="120" y1="73" x2="160" y2="73"/><line class="sL" x1="270" y1="73" x2="310" y2="73"/><line class="sD" x1="420" y1="73" x2="460" y2="73"/><line class="sL" x1="570" y1="73" x2="610" y2="73"/>
<text class="sS" x="10" y="135">Each small tree corrects what the ensemble still gets wrong; the learning rate η keeps each step small.</text>
</svg><figcaption>Bagging averages independent trees to cut variance; boosting adds dependent trees to cut bias.</figcaption></figure>

**The hyperparameters that matter** (names from LightGBM / XGBoost):

| Hyperparameter | Effect | Typical starting range |
|---|---|---|
| `learning_rate` (eta) | Step size; smaller = better generalisation but more trees | 0.03–0.1 |
| `n_estimators` (rounds) | Number of trees; set high and use **early stopping** on a validation set | Hundreds to thousands |
| `num_leaves` (LightGBM) / `max_depth` | Tree complexity; the main overfitting control | 15–127 leaves / depth 4–8 |
| `min_child_samples` / `min_child_weight` | Minimum data in a leaf | Larger → smoother |
| `subsample` (bagging fraction), `colsample_bytree` (feature fraction) | Randomness that reduces overfitting and speeds training | 0.6–0.9 |
| `reg_alpha` (L1), `reg_lambda` (L2) | Regularise leaf values | 0–10 |
| `scale_pos_weight` / class weights | Imbalance | ≈ negatives ÷ positives as a start |

```python
import lightgbm as lgb
model = lgb.LGBMClassifier(n_estimators=5000, learning_rate=0.05, num_leaves=31,
                           subsample=0.8, subsample_freq=1, colsample_bytree=0.8,
                           reg_lambda=1.0, class_weight="balanced", random_state=42)
model.fit(X_train, y_train, eval_set=[(X_valid, y_valid)], eval_metric="average_precision",
          callbacks=[lgb.early_stopping(200), lgb.log_evaluation(0)],
          categorical_feature=["region", "plan_type"])          # native categorical support
```

### XGBoost, LightGBM, CatBoost, scikit-learn ⭐

| | XGBoost | LightGBM | CatBoost | scikit-learn `HistGradientBoosting` |
|---|---|---|---|---|
| Tree growth | Level-wise by default (also leaf-wise via `grow_policy`) | **Leaf-wise** (faster, can overfit on small data) | **Symmetric (oblivious)** trees | Leaf-wise |
| Speed | Fast (histogram method) | Very fast on large data | Slower to train, fast to predict | Fast for medium data |
| Categoricals | Supported (`enable_categorical`) | Native | **Best native handling** (ordered target statistics) | Native (`categorical_features`) |
| Missing values | Native | Native | Native | Native |
| Defaults | Need some tuning | Need some tuning | **Strong out of the box** | Reasonable |
| GPU | Yes | Yes | Yes | No |

> [!say]
> "Random forests average many deep, independent trees to reduce variance; gradient boosting adds many shallow trees sequentially, each fitting the remaining errors, which reduces bias. On tabular data boosting usually wins. I'd start with LightGBM or CatBoost (CatBoost if there are many categoricals), use early stopping on a time-based validation set, then tune the leaves, learning rate and sampling fractions."

> [!sota] Tabular foundation models
> Pre-trained transformers for tables are emerging: **TabPFN** (v2 published in *Nature* in January 2025) predicts on small datasets (up to about 10,000 rows) in a single forward pass with no tuning, often matching tuned boosting there. For typical business datasets of hundreds of thousands of rows, well-tuned gradient boosting remains the default. Knowing this exists is a strong mid-level signal; *AI Journey* Part 25 tracks the state of the art.

## DS3.6 Tuning without fooling yourself 🟡 ⭐

- **Validation design first** ([[DS4.2]]): time-based for time-ordered data; grouped by customer when they repeat.
- **Random search** beats grid search for the same budget (most hyperparameters barely matter; random search tries more values of the ones that do).
- **Bayesian optimisation** with **Optuna** (tree-structured Parzen estimator) finds good settings faster, and prunes bad trials early.
- **Early stopping** chooses the number of rounds; don't also tune it by grid.
- Keep a **final untouched test set** (ideally the most recent period) for one honest estimate.

```python
import optuna
def objective(trial):
    params = dict(learning_rate=trial.suggest_float("lr", 0.01, 0.2, log=True),
                  num_leaves=trial.suggest_int("leaves", 15, 255, log=True),
                  min_child_samples=trial.suggest_int("min_child", 10, 200, log=True),
                  colsample_bytree=trial.suggest_float("colsample", 0.5, 1.0),
                  subsample=trial.suggest_float("subsample", 0.5, 1.0), subsample_freq=1,
                  reg_lambda=trial.suggest_float("l2", 1e-3, 10, log=True), n_estimators=5000)
    return time_series_cv_score(lgb.LGBMClassifier(**params), X, y)   # your CV with early stopping inside
study = optuna.create_study(direction="maximize"); study.optimize(objective, n_trials=60)
```

## DS3.7 Bias, variance and regularisation in one table 🟢

| Symptom | Diagnosis | Remedies |
|---|---|---|
| Train score ≫ validation score | **Overfitting** (high variance) | More data, simpler model, stronger regularisation, fewer features, early stopping, more randomness (subsampling) |
| Train and validation both poor | **Underfitting** (high bias) | Better features, a more flexible model, less regularisation |
| Validation good, later-period test poor | **Drift or leakage** | Check time-based validation, leakage ([[DS2.4]]), and drift ([[DS8]]) |

Learning curves (score vs training-set size) tell you whether more data would help. *AI Journey* Parts 6 and 7 cover these with figures.

## DS3.8 Other models, and when they're the right call 🟢

| Model | Use when |
|---|---|
| **k-nearest neighbours** | Small data, a meaningful distance; recommendations by similarity. Needs scaling; slow on big data |
| **Support vector machines** | Medium-sized, high-dimensional data (text with TF-IDF). Needs scaling |
| **Naive Bayes** | Fast text classification baselines |
| **Generalised linear models** (Poisson, Tweedie, Gamma) | Counts, insurance claims, money amounts with many zeros |
| **Neural networks** | Text, images, audio, sequences, very large tabular data with rich categorical embeddings, multi-task learning. On ordinary tabular data, usually not better than boosting and harder to tune |
| **Survival models** (Cox, survival forests) | "**When** will this customer churn / default?" with censored data (customers who haven't churned yet) |

## DS3.9 Ensembles and stacking 🟡

- **Averaging** a boosting model with a linear model often helps a little, because their errors differ.
- **Stacking:** train a simple **meta-model** on **out-of-fold** predictions of several base models. Gains are usually small; complexity and maintenance are real. Kaggle loves it; production teams use it sparingly.

> [!story]
> Your road-accident capstone compared several classifiers on imbalanced data with F1-macro and used SHAP to explain them. The natural next step (and your notes' top gap) is to add **HistGradientBoosting, LightGBM and CatBoost** to that leaderboard with time-aware validation and Optuna tuning. Your gaps file estimates this at "one line of code each" for the first pass. Doing it turns "familiar with XGBoost/LightGBM" into a real CV bullet.

> [!lab] The tabular leaderboard
> On the road-accident data (or Telco churn): dummy baseline → logistic regression pipeline → random forest → HistGradientBoosting → LightGBM with early stopping → CatBoost with native categoricals → Optuna-tuned LightGBM. Record PR-AUC (or F1-macro) on the same validation folds, plus training time, in one table. Then pick the model you'd actually deploy and justify it in three sentences (performance, explainability, cost to maintain).

## DS3.10 Interview drill 🟢 ⭐

| Question | Strong short answer |
|---|---|
| Why start with a baseline? | To measure real improvement and to check whether a model is worth its cost at all. |
| How do you interpret a logistic coefficient? | Change in log-odds per unit; exp(coefficient) is the odds ratio, holding other features constant. |
| L1 vs L2? | L1 drives some coefficients to zero (selection); L2 shrinks all smoothly (good with correlated features). |
| Which models need feature scaling? | Linear models with regularisation, k-NN, SVMs, neural networks, PCA; not trees or tree ensembles. |
| Bagging vs boosting? | Bagging trains independent models on bootstrap samples and averages (cuts variance); boosting trains models sequentially on remaining errors (cuts bias). |
| Random forest vs gradient boosting? | RF: robust, few tuning knobs, parallel; GBM: usually more accurate on tabular data but needs tuning and early stopping. |
| How does gradient boosting work? | Each new shallow tree fits the gradient of the loss (residuals) of the current ensemble, added with a small learning rate. |
| Key GBM hyperparameters? | Learning rate with early-stopped rounds, leaves or depth, min samples per leaf, row and column subsampling, L1/L2 regularisation. |
| XGBoost vs LightGBM vs CatBoost? | LightGBM: fast, leaf-wise; CatBoost: strong defaults and categorical handling, symmetric trees; XGBoost: mature and flexible, level-wise by default. |
| Grid vs random vs Bayesian search? | Random beats grid for the same budget; Bayesian (Optuna) learns from trials to find good settings faster. |
| Why not deep learning on this table? | On typical tabular data, boosted trees are usually as good or better, faster and easier to tune and explain. |
| How do you detect overfitting? | A large gap between training and validation scores, and learning curves. |
| What model for "when will a customer churn"? | A survival model, which handles customers who haven't churned yet (censoring). |

## Key takeaways

> [!check]
> - Always report a baseline, including the current business rule.
> - Logistic regression is the explainable benchmark; know how to read its coefficients.
> - Random forests reduce variance; boosting reduces bias and usually wins on tables.
> - Tune boosting with early stopping on a realistic validation split; Optuna saves time.
> - Add LightGBM and CatBoost to your own project: it closes your top modelling gap.

## Sources

- scikit-learn user guide: [Linear models](https://scikit-learn.org/stable/modules/linear_model.html), [Decision trees](https://scikit-learn.org/stable/modules/tree.html), [Ensembles: gradient boosting, random forests, stacking](https://scikit-learn.org/stable/modules/ensemble.html).
- [XGBoost documentation](https://xgboost.readthedocs.io/) and Chen and Guestrin, "XGBoost: A Scalable Tree Boosting System" (KDD 2016); [LightGBM documentation: parameters tuning](https://lightgbm.readthedocs.io/en/stable/Parameters-Tuning.html) and Ke et al. (NeurIPS 2017); [CatBoost documentation](https://catboost.ai/docs/) and Prokhorenkova et al. (NeurIPS 2018).
- Jerome Friedman, "Greedy Function Approximation: A Gradient Boosting Machine" (*Annals of Statistics*, 2001).
- Léo Grinsztajn, Edouard Oyallon and Gaël Varoquaux, "Why do tree-based models still outperform deep learning on typical tabular data?" (NeurIPS 2022 Datasets and Benchmarks).
- Noah Hollmann et al., "Accurate predictions on small data with a tabular foundation model" (*Nature*, January 2025), TabPFN v2.
- Bergstra and Bengio, "Random Search for Hyper-Parameter Optimization" (*JMLR*, 2012); [Optuna documentation](https://optuna.readthedocs.io/).
- Your *AI Journey* Parts 7, 8 and 8B (with Géron chapter and page references).
