# Part 8B — Decision Trees, Random Forests and Gradient Boosting

<!-- nav -->
> [!example] 🧭 Step 11 of 26 · Stage 3 of 7: Classical ML
> ← [Part 08 · Classification](08_Supervised_Classification.md) · [Part 09 · Unsupervised](09_Unsupervised_PCA_and_Clustering.md) → · [Course map](00_START_HERE.md)
<!-- /nav -->

**Source:** Géron, *Hands-On Machine Learning with Scikit-Learn and PyTorch* (2025), Chapter 5 "Decision Trees" and Chapter 6 "Ensemble Learning and Random Forests", plus the industry material (XGBoost / LightGBM / CatBoost, SHAP) that interviews expect. **Why this part exists:** Part 14 ranked gradient boosting as *the most consequential omission* of the course. The capstone used a Random Forest without explaining it. On tabular data, the kind a telecom company runs on (subscribers, usage, billing, network KPIs), **tree ensembles are the default winning model**, and you will be asked how they work.

Read Part 8 §8.5 (the decision tree basics from the course) first. This part goes underneath it.

<!-- interview-focus -->

> [!tip] 🎯 Interview focus
> **Why it matters:** Gradient-boosted trees are the production default for tabular data (churn, credit, fraud). Expect "RF vs XGBoost" at every level.
>
> | Level | What you should be able to do |
> |---|---|
> | 🟢 **Entry** | How a decision tree splits (Gini/entropy), why trees overfit, bagging and Random Forests, feature importance, OOB score. |
> | 🟡 **Mid** | Boosting (AdaBoost vs gradient boosting), XGBoost/LightGBM/CatBoost differences, key hyperparameters and early stopping, SHAP explanations, stacking. |
> | 🔴 **Senior** | Monotonic constraints, categorical handling at scale, model risk and explainability requirements (credit), GBM vs deep learning trade-offs. |
>
> **⭐ Most-asked:** *Random forest vs gradient boosting?* · *Why do trees overfit, and how do you regularise them?* · *Bagging vs boosting — bias or variance?* · *How does XGBoost handle missing values?* · *How do you explain a GBM's prediction to a business user?*
>
> **⏱ Time:** 4 h  ·  **Short on time?** Read §8B.1, §8B.4–8B.6, §8B.8, §8B.10.

**Legend:** 🟢 Entry (0–2 yrs) · 🟡 Mid (2–5 yrs) · 🔴 Senior / specialist · ⭐ frequently asked · 📖 Géron, *Hands-On ML with Scikit-Learn and PyTorch* (2025) pages

> [!abstract]- 🗺️ Section map — level and book pages
>
> | § | Section | Level | 📖 Book |
> |---|---|:---:|---|
> | 8B.1 | Decision trees — how they really work | 🟢 ⭐ | Ch. 5 · pp. 179–193 |
> | 8B.2 | Ensemble learning — the wisdom of the crowd | 🟢 | Ch. 6 · p. 195 |
> | 8B.3 | Voting classifiers | 🟢 | Ch. 6 · pp. 196–199 |
> | 8B.4 | Bagging and pasting | 🟢 ⭐ | Ch. 6 · pp. 199–204 |
> | 8B.5 | Random Forests and Extra-Trees | 🟢 ⭐ | Ch. 6 · pp. 204–207 |
> | 8B.6 | Boosting — sequential error correction | 🟡 ⭐ | Ch. 6 · pp. 207–215 |
> | 8B.7 | Stacking | 🟡 | Ch. 6 · pp. 215–219 |
> | 8B.8 | Géron's summary: which ensemble when | 🟡 ⭐ | Ch. 6 · p. 219 |
> | 8B.9 | Putting it in a pipeline: a realistic churn model | 🟡 ⭐ | — |
> | 8B.10 | Interview drill — trees and ensembles | 🟢 ⭐ | Ch. 5, Ch. 6 · p. 193, p. 219 |
> | 8B.11 | Real-world examples — ensembles in production | 🟡 | — |
>

---

## 8B.1 Decision trees — how they really work 🟢 ⭐

> [!info] 📖 Géron Ch. 5 · “Decision Trees” · pp. 179–193

> [!quote] 💬 Say it in the interview
> “A tree greedily picks the split that most reduces impurity (Gini or entropy). Unconstrained trees memorise the data, so I limit depth or leaf size.”

### A tree you can read

```python
from sklearn.datasets import load_iris
from sklearn.tree import DecisionTreeClassifier, export_graphviz

iris = load_iris(as_frame=True)
X_iris = iris.data[["petal length (cm)", "petal width (cm)"]].values
y_iris = iris.target

tree_clf = DecisionTreeClassifier(max_depth=2, random_state=42)
tree_clf.fit(X_iris, y_iris)
export_graphviz(tree_clf, out_file="iris_tree.dot",
                feature_names=["petal length (cm)", "petal width (cm)"],
                class_names=iris.target_names, rounded=True, filled=True)
# or, without graphviz:  from sklearn.tree import plot_tree, export_text
```

Géron's iris tree:

```
                 [petal length ≤ 2.45?]   gini=0.667, samples=150, value=[50,50,50]
                  /                  \
          True  /                      \ False
   leaf: setosa                  [petal width ≤ 1.75?]  gini=0.5, samples=100
   gini=0.0, samples=50            /                 \
                        leaf: versicolor        leaf: virginica
                        gini=0.168              gini=0.043
                        samples=54              samples=46
                        value=[0,49,5]          value=[0,1,45]
```

Each node shows:
- **`samples`**: how many training instances reach the node.
- **`value`**: how many of each class.
- **`gini`**: the node's impurity.

**Gini impurity** of node i:

> **Gᵢ = 1 − Σₖ pᵢ,ₖ²**

Depth-2 left node: 1 − (0/54)² − (49/54)² − (5/54)² ≈ **0.168**. A pure node has G = 0. With K equally mixed classes, G = 1 − 1/K, which is its maximum.

**Entropy** (`criterion="entropy"`):

> **Hᵢ = −Σₖ pᵢ,ₖ log₂ pᵢ,ₖ**   (terms with p = 0 are skipped)

The same node has entropy ≈ **0.445**. The reduction in entropy from a split is the **information gain**.

**Gini or entropy?** Géron: *"most of the time it does not make a big difference."* Gini is slightly faster, so it is the default. When they differ, Gini tends to isolate the most frequent class in its own branch, while entropy gives slightly more balanced trees.

**Predicting probabilities.** Find the instance's leaf and return the class proportions there. A flower with petals 5 cm × 1.5 cm lands in the depth-2 left leaf, giving `[0, 0.907, 0.093]`. Every point in that rectangle gets **exactly the same probability**, even at 6 cm × 1.5 cm where virginica is more likely. Trees give piecewise-constant, coarse probabilities, which is one reason to calibrate them (Part 8 §8.12.7).

**No scaling needed.** *"They don't require feature scaling or centering at all."* A threshold on one feature is unaffected by the units of another.

### CART — the training algorithm

sklearn uses **CART** (Classification And Regression Trees), which always produces **binary** trees. (ID3 and C4.5 can create nodes with more than two children.) At each node it searches for the feature k and threshold tₖ that minimise the **size-weighted impurity of the two children**:

> **J(k, tₖ) = (m_left/m)·G_left + (m_right/m)·G_right**

It then recurses on each subset until it reaches `max_depth`, cannot reduce impurity, or hits another stopping rule.

**CART is greedy.** It optimises each split locally with no look-ahead. Finding the *optimal* tree is **NP-complete** (O(exp(m))), so a "reasonably good" greedy tree is the practical choice.

**Complexity**, a common interview follow-up:

| | Cost | Consequence |
|---|---|---|
| Prediction | **O(log₂ m)** nodes, one feature check per node, independent of n | Very fast inference |
| Training | **O(n × m log₂ m)** | Compares all features on all samples at each level |

So 10× more rows costs about 10 × log(10m)/log(m) ≈ **11.7×** the training time (1 hour at 1M rows → ~11.7 hours at 10M). Doubling the features roughly doubles the time.

### Regression trees

The same algorithm, but each leaf predicts the **mean target** of its training instances, and CART minimises the weighted **MSE** of the children:

> **J(k, tₖ) = (m_left/m)·MSE_left + (m_right/m)·MSE_right**

The prediction is a **step function**. Géron's regression tree on a noisy quadratic (`max_depth=2`) predicts 0.038 for x₁ = 0.2, the average of the 133 training points in that leaf. Unregularised, it overfits into a jagged staircase; `min_samples_leaf=10` smooths it.

⚠️ **Trees cannot extrapolate.** Outside the training range, a regression tree (and any forest or boosted ensemble built from trees) predicts a constant, the value of the edge leaf. If next year's traffic exceeds anything seen in training, a tree model will flatten out. This matters for forecasting growth metrics (data consumption, 5G adoption), where linear models or trend terms extrapolate and trees do not.

### Regularisation hyperparameters

Trees are **non-parametric**: the number of parameters is not fixed before training, so the structure grows to fit the data and overfits if unconstrained. (Linear models are **parametric**: fixed parameters, less overfitting, more underfitting.)

| Hyperparameter | Effect when **increased** | Géron's advice |
|---|---|---|
| `max_depth` | Deeper tree, **less** regularisation | "Usually a good default": effective and keeps the tree interpretable |
| `min_samples_split` | **More** regularisation | — |
| `min_samples_leaf` | **More** regularisation | "A good idea, especially for small datasets" |
| `min_weight_fraction_leaf` | More regularisation | Weighted version of the above |
| `max_leaf_nodes` | **Less** regularisation | Good single knob to tune |
| `max_features` | **Less** regularisation (more features considered per split) | "Great for high-dimensional datasets" |
| `min_impurity_decrease` | More regularisation | — |
| `ccp_alpha` | **More pruning** (minimal cost-complexity pruning) | Post-hoc pruning |

**The rule:** increase `min_*` or `ccp_alpha`, or decrease `max_*`, to regularise. Géron's moons example: an unregularised tree scores 0.898 on test; the same tree with `min_samples_leaf=5` scores **0.920**.

Other algorithms grow the full tree and then **prune** nodes whose improvement is not statistically significant, using a χ² test with p > 0.05 → delete.

### Limitations

1. **Sensitivity to axis orientation.** Trees only make axis-perpendicular splits. Rotate a linearly separable dataset by 45° and the tree needs a staircase of splits, which generalises poorly. Géron's mitigation is `make_pipeline(StandardScaler(), PCA())` before the tree, since PCA rotates the data to decorrelate features. Engineering ratio or difference features does the same job.
2. **High variance.** Small changes in the data or hyperparameters, or even just a different `random_state` (sklearn samples features randomly at each node), can produce a very different tree. **The fix is averaging many trees: Random Forests.**

Also: recent sklearn trees and forests **handle missing values natively**, so no imputer is needed.

### White box vs black box

Trees are **white-box** models: you can print the rules and apply them by hand. Random forests and neural networks are **black boxes**: you can check each calculation but cannot explain the decision simply. Géron lists why interpretability matters: doctors reviewing a diagnosis, analysts in finance, judicial decisions, and **HR decisions free of bias**. In a regulated telecom or fintech setting (credit limits, device-instalment approval), expect to need either an interpretable model or post-hoc explanations (SHAP, §8B.6).

---

## 8B.2 Ensemble learning — the wisdom of the crowd 🟢

> [!info] 📖 Géron Ch. 6 · introduction · p. 195

> If you aggregate the predictions of a group of predictors, you will often get better predictions than with the best individual predictor.

**Why it works, through the biased coin.** A coin with a 51% chance of heads gives a majority of heads in 1,000 tosses about **75%** of the time, and in 10,000 tosses more than **97%** of the time (the law of large numbers). Likewise, 1,000 classifiers that are each right 51% of the time could reach 75% accuracy by majority vote, **but only if their errors are independent.** Models trained on the same data make correlated errors, so the real gain is smaller.

**The central principle: ensembles need *diversity*.** Ways to get it:
- Very **different algorithms** (voting, stacking).
- The **same algorithm on different data subsets** (bagging, pasting).
- **Different feature subsets** (random subspaces, random forests).
- **Sequential correction of errors** (boosting).

Costs: more compute for training *and* inference, more complex deployment, less interpretability. The Netflix Prize and most Kaggle wins used ensembles.

---

## 8B.3 Voting classifiers 🟢

> [!info] 📖 Géron Ch. 6 · “Voting Classifiers” · pp. 196–199

```python
from sklearn.datasets import make_moons
from sklearn.ensemble import RandomForestClassifier, VotingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.svm import SVC

X, y = make_moons(n_samples=500, noise=0.30, random_state=42)
X_train, X_test, y_train, y_test = train_test_split(X, y, random_state=42)

voting_clf = VotingClassifier(estimators=[
    ("lr", LogisticRegression(random_state=42)),
    ("rf", RandomForestClassifier(random_state=42)),
    ("svc", SVC(random_state=42)),
])
voting_clf.fit(X_train, y_train)
# individual:  lr 0.864, rf 0.896, svc 0.896   →   hard vote 0.912
```

- **Hard voting:** majority of predicted classes.
- **Soft voting** (`voting="soft"`): average the predicted **probabilities** and take the argmax. It usually beats hard voting because confident votes count more (**0.92** here). Every estimator needs `predict_proba` (`SVC(probability=True)`), and it works best when the probabilities are **calibrated**.
- `VotingClassifier` clones the estimators. The fitted clones are in `estimators_` / `named_estimators_`.

---

## 8B.4 Bagging and pasting 🟢 ⭐

> [!info] 📖 Géron Ch. 6 · “Bagging and Pasting” → “Random Patches” · pp. 199–204

> [!quote] 💬 Say it in the interview
> “Bagging trains models on bootstrap samples and averages them, which cuts variance. The out-of-bag rows give a free validation score.”

Train the **same algorithm** on different random subsets of the training set:
- **Bagging** (bootstrap aggregating): sampling **with replacement**.
- **Pasting**: sampling **without replacement**.

Aggregate with the **mode** (classification, soft vote if probabilities exist) or the **mean** (regression).

**The bias/variance effect.** Each predictor is trained on less or duplicated data, so it is individually a bit worse. Aggregation reduces variance a lot. Géron's arithmetic: average two independent regressors, each with σ = \$10,000, and the variance halves (σ ≈ \$7,071). Bias ends up similar and **variance ends up lower**, so bagging suits **high-variance, low-bias models** such as deep trees, not linear regression.

```python
from sklearn.ensemble import BaggingClassifier
from sklearn.tree import DecisionTreeClassifier

bag_clf = BaggingClassifier(DecisionTreeClassifier(), n_estimators=500,
                            max_samples=100, n_jobs=-1, random_state=42)
# bootstrap=False → pasting
```

- **Bagging vs pasting:** bagging adds diversity (slightly higher bias, less correlated predictors, lower variance) and usually wins. Prefer bagging when data is noisy or the model overfits; pasting is slightly cheaper.
- **Parallel by nature.** Predictors train and predict independently across cores or servers, so it scales well.

### Out-of-bag (OOB) evaluation — free validation

Sampling m instances with replacement from m leaves about **1 − e⁻¹ ≈ 63%** of the instances in each bootstrap sample. The other **~37% are out-of-bag** for that predictor, and they differ per predictor. Each training instance can therefore be predicted by the predictors that never saw it:

```python
bag_clf = BaggingClassifier(DecisionTreeClassifier(), n_estimators=500,
                            oob_score=True, n_jobs=-1, random_state=42)
bag_clf.fit(X_train, y_train)
bag_clf.oob_score_                    # 0.896  (the test set gives 0.912)
bag_clf.oob_decision_function_[:3]    # OOB class probabilities per training row
```

**Benefit:** an honest generalisation estimate **without a separate validation set**, so all the data can be used for training. In Géron's run OOB was slightly pessimistic.

### Random patches and random subspaces

Also sample **features** (`max_features`, `bootstrap_features`):
- **Random patches:** sample instances *and* features.
- **Random subspaces:** keep all instances (`bootstrap=False, max_samples=1.0`), sample features.

This adds diversity, trading a little more bias for less variance. It is useful for high-dimensional inputs.

---

## 8B.5 Random Forests and Extra-Trees 🟢 ⭐

> [!info] 📖 Géron Ch. 6 · “Random Forests”, “Extra-Trees”, “Feature Importance” · pp. 204–207

![Regularising one tree helps; averaging many (bagging) or chaining them (boosting) helps more. Moons, noise 0.3.](figures/fig08B_tree_ensembles.png)
*Regularising one tree helps; averaging many (bagging) or chaining them (boosting) helps more. Moons, noise 0.3.*

> [!quote] 💬 Say it in the interview
> “A random forest is bagged trees plus random feature subsets at each split, which de-correlates the trees. It is robust, needs little tuning and gives a quick feature importance.”

A **Random Forest** is bagged decision trees plus **a random subset of features considered at each split** (default **√n** features for classification). The extra randomness **decorrelates the trees**: without it, every tree would split on the same dominant feature first. This is the key interview sentence.

```python
from sklearn.ensemble import RandomForestClassifier
rnd_clf = RandomForestClassifier(n_estimators=500, max_leaf_nodes=16,
                                 n_jobs=-1, random_state=42)
# ≈ BaggingClassifier(DecisionTreeClassifier(max_features="sqrt", max_leaf_nodes=16),
#                     n_estimators=500, n_jobs=-1, random_state=42)
```

A `RandomForestClassifier` has the tree hyperparameters plus the bagging ones.

**Hyperparameters that matter, in practice:**

| Parameter | Typical | Effect |
|---|---|---|
| `n_estimators` | 200–1000 | More trees reduce variance and **never cause overfitting**. Returns diminish; cost grows linearly |
| `max_features` | `"sqrt"` (clf), 1.0 or ~0.33 (reg) | Lower gives more diverse trees and more bias. The single most important knob |
| `max_depth` / `min_samples_leaf` / `max_leaf_nodes` | tune | Tree size, for regularisation and speed |
| `class_weight="balanced"` / `"balanced_subsample"` | for imbalance | Reweights the loss |
| `oob_score=True` | — | Free validation estimate |
| `n_jobs=-1` | — | Parallel training |

**Extra-Trees** (Extremely Randomized Trees) also use **random thresholds** for each candidate feature instead of searching for the best one (`splitter="random"`). They trade more bias for less variance and are **much faster to train**, since threshold search is the expensive part. They can beat RFs on noisy or high-dimensional data. `ExtraTrees*` default to `bootstrap=False`.

### Feature importance — and its pitfalls

`rnd_clf.feature_importances_`: for each feature, the **impurity reduction it produces, averaged over all nodes and trees, weighted by the samples at each node**, normalised to sum to 1. On iris: petal length 0.44, petal width 0.42, sepal length 0.11, sepal width 0.02. On MNIST the important pixels form a digit-shaped blob in the centre.

⚠️ **What interviewers want you to add:**
1. **Impurity-based (MDI) importance is biased toward high-cardinality and continuous features.** A random ID column can look important.
2. It is computed on **training data**, so it reflects what the model used, not what generalises.
3. **Correlated features split the importance** between them, so each looks less important than it is.
4. It gives **no direction**: it doesn't say whether high values raise or lower the prediction.

Better tools:

```python
from sklearn.inspection import permutation_importance, PartialDependenceDisplay

r = permutation_importance(model, X_val, y_val, n_repeats=10,
                           scoring="average_precision", random_state=42)
# importance = drop in validation score when one feature's values are shuffled

PartialDependenceDisplay.from_estimator(model, X_val, ["tenure_months"])  # direction + shape
```

---

## 8B.6 Boosting — sequential error correction 🟡 ⭐

> [!info] 📖 Géron Ch. 6 · “Boosting” → “Histogram-Based Gradient Boosting” · pp. 207–215

![Gradient boosting: each tree fits the residual errors of the ensemble so far.](figures/fig08B_boosting_stages.png)
*Gradient boosting: each tree fits the residual errors of the ensemble so far.*

> [!quote] 💬 Say it in the interview
> “Boosting adds shallow trees sequentially, each fitting the errors of the ensemble so far, which cuts bias. The learning rate, number of trees (with early stopping) and depth are the key knobs; XGBoost, LightGBM and CatBoost are optimised implementations.”

**Boosting** combines weak learners into a strong one by training predictors **sequentially, each correcting its predecessor**. Its drawback: **it cannot be parallelised across predictors**, so it scales less easily than bagging. Modern libraries parallelise *within* each tree.

### AdaBoost

Reweight the **training instances** so the next predictor focuses on the ones the previous predictors got wrong.

1. Initialise weights w⁽ⁱ⁾ = 1/m.
2. Train predictor j and compute its **weighted error rate**: **rⱼ = Σ w⁽ⁱ⁾ over misclassified i** (weights sum to 1).
3. Compute the **predictor weight**: **αⱼ = η · log((1 − rⱼ)/rⱼ)**. An accurate predictor gets a large α; a random guesser gets α ≈ 0; one worse than random gets a negative α.
4. **Boost the misclassified instances:** w⁽ⁱ⁾ ← w⁽ⁱ⁾·exp(αⱼ) if wrong, then normalise.
5. Repeat until N predictors are trained (or a perfect one is found).
6. **Predict** by weighted vote: ŷ(x) = argmaxₖ Σⱼ αⱼ·[ŷⱼ(x) = k].

sklearn implements **SAMME** (multiclass AdaBoost). The default base learner is a **decision stump** (`max_depth=1`).

```python
from sklearn.ensemble import AdaBoostClassifier
ada_clf = AdaBoostClassifier(DecisionTreeClassifier(max_depth=1), n_estimators=30,
                             learning_rate=0.5, random_state=42)
```

**Tuning:** if it **overfits**, reduce `n_estimators` or regularise the base estimator more. If it **underfits**, add estimators, allow a stronger base estimator (e.g. `max_depth=2`), or raise the learning rate slightly. AdaBoost is sensitive to label noise and outliers, since it keeps upweighting them.

### Gradient boosting — fit the residuals

Instead of reweighting instances, **fit each new predictor to the residual errors of the ensemble so far**:

```python
import numpy as np
from sklearn.tree import DecisionTreeRegressor

rng = np.random.default_rng(seed=42)
X = rng.random((100, 1)) - 0.5
y = 3 * X[:, 0] ** 2 + 0.05 * rng.standard_normal(100)

tree_reg1 = DecisionTreeRegressor(max_depth=2, random_state=42).fit(X, y)
y2 = y - tree_reg1.predict(X)                       # residuals of tree 1
tree_reg2 = DecisionTreeRegressor(max_depth=2, random_state=43).fit(X, y2)
y3 = y2 - tree_reg2.predict(X)                      # residuals of trees 1+2
tree_reg3 = DecisionTreeRegressor(max_depth=2, random_state=44).fit(X, y3)

X_new = np.array([[-0.4], [0.], [0.5]])
sum(tree.predict(X_new) for tree in (tree_reg1, tree_reg2, tree_reg3))
```

**Why "gradient":** for MSE loss, the residual y − ŷ is exactly the **negative gradient** of the loss with respect to the prediction. So each tree takes a **gradient-descent step in function space**. Swap the loss (log-loss, Huber, quantile, Poisson…) and you fit the negative gradient of that loss instead. That is how the same algorithm does classification, robust regression and quantile regression.

```python
from sklearn.ensemble import GradientBoostingRegressor
gbrt = GradientBoostingRegressor(max_depth=2, n_estimators=3, learning_rate=1.0)
```

**The key hyperparameters and their interaction:**

- **`learning_rate` (shrinkage):** scales each tree's contribution. **Low (0.01–0.1)** needs more trees but **generalises better**. This is regularisation. **If a GBM overfits, decrease the learning rate** (and use early stopping to pick the number of trees).
- **`n_estimators`:** too few underfits, too many overfits. Unlike Random Forests, **more boosting rounds can overfit.** Find the right number with **early stopping**:

```python
gbrt_best = GradientBoostingRegressor(max_depth=2, learning_rate=0.05,
                                      n_estimators=500, n_iter_no_change=10,
                                      random_state=42)
gbrt_best.fit(X, y)
gbrt_best.n_estimators_          # 53: stopped long before 500
```

`n_iter_no_change` automatically holds out `validation_fraction` (default 10%) and stops when `tol` improvement hasn't happened for that many rounds. Too low a value underfits; too high overfits.

- **`subsample < 1.0`:** each tree sees a random fraction of rows. This is **stochastic gradient boosting**: more bias, less variance, faster.
- **Tree size** (`max_depth` 3–8, or `max_leaf_nodes`): boosting uses **shallow trees** (weak learners), unlike RFs, which use deep ones.

### Histogram-based gradient boosting (HGB) — the one to use in sklearn

**Bin** each feature into at most **255** integer bins (`max_bins`). There are far fewer candidate thresholds, integer data structures are faster, and no per-tree sorting is needed. Complexity drops from **O(n·m·log m)** to **O(b·m)**, so it can be **hundreds of times faster** on large data. The binning also slightly regularises.

```python
from sklearn.ensemble import HistGradientBoostingRegressor
from sklearn.compose import make_column_transformer
from sklearn.preprocessing import OrdinalEncoder

hgb_reg = make_pipeline(
    make_column_transformer((OrdinalEncoder(), ["ocean_proximity"]),
                            remainder="passthrough", force_int_remainder_cols=False),
    HistGradientBoostingRegressor(categorical_features=[0], random_state=42))
hgb_reg.fit(housing, housing_labels)       # RMSE ≈ 47,600 with zero tuning
```

What makes it convenient:
- **Native missing-value support:** no imputer.
- **Native categorical support:** ordinal-encode, then pass `categorical_features`. Recent versions also accept `categorical_features="from_dtype"` for pandas `category` columns.
- **No scaling needed.**
- **Early stopping on automatically** when m > 10,000.
- `n_estimators` is called **`max_iter`** here. Tunable tree parameters: `max_leaf_nodes` (default 31), `min_samples_leaf`, `max_depth`, `max_features`, plus `l2_regularization`.
- No `subsample`.

Géron: HGB is *"a great choice when you have a fairly large dataset, especially when it contains categorical features and missing values."*

### XGBoost, LightGBM, CatBoost — what to say about each

Géron points to these libraries. Every tabular interview assumes you know them:

| | **XGBoost** | **LightGBM** | **CatBoost** |
|---|---|---|---|
| Tree growth | Level-wise (depth-wise) by default | **Leaf-wise** (best-first): grows the leaf with the biggest loss reduction, so deeper and more accurate trees, which can overfit on small data | **Symmetric (oblivious)** trees: the same split at every node of a level, fast and regularised |
| Split finding | Exact or histogram (`tree_method="hist"`) | Histogram + **GOSS** (keeps large-gradient rows, samples small-gradient ones) + **EFB** (bundles mutually exclusive sparse features) | Histogram |
| Categoricals | Native in recent versions (`enable_categorical=True`) | Native (`categorical_feature=`) | **Best-in-class**: *ordered target statistics* avoid target leakage |
| Regularisation | ℓ₁ (`reg_alpha`), ℓ₂ (`reg_lambda`), `gamma` (min split gain), `min_child_weight` | `lambda_l1/l2`, `min_data_in_leaf`, `num_leaves` | `l2_leaf_reg`, ordered boosting |
| Strength | Mature, robust, everywhere | **Fastest on large data**; the common production choice | Least tuning; strong with many categoricals |
| Key knobs | `n_estimators`, `learning_rate`, `max_depth`, `subsample`, `colsample_bytree` | `num_leaves`, `learning_rate`, `min_data_in_leaf`, `feature_fraction`, `bagging_fraction` | `depth`, `learning_rate`, `iterations` |

All three support GPUs, early stopping (`early_stopping_rounds` / callbacks), class weighting (`scale_pos_weight` in XGBoost ≈ negatives/positives), custom losses, and sklearn-compatible wrappers that drop into your `Pipeline`.

**XGBoost's objective**, in one line (for mid-level interviews): it minimises **Σ loss + Σ Ω(treeₖ)**, with **Ω = γT + ½λ‖w‖²** (T = number of leaves, w = leaf weights). It uses a **second-order Taylor expansion** (gradients *and* Hessians) of the loss to score splits. The **gain** of a split is computed in closed form from sums of gradients and Hessians in each child, and a split is kept only if gain > γ.

A sensible tuning order for GBMs:
1. Fix `learning_rate=0.05–0.1` and use early stopping to find the number of trees.
2. Tune tree complexity (`max_depth` / `num_leaves`, `min_child_weight` / `min_data_in_leaf`).
3. Tune randomness (`subsample`, `colsample_bytree`).
4. Tune regularisation (`reg_lambda`, `reg_alpha`, `gamma`).
5. Lower the learning rate (e.g. 0.01), raise the tree budget, and re-fit with early stopping. Use Optuna (Part 11 §11.12) rather than a grid.

### SHAP — explaining boosted trees

Impurity importance is global and biased (§8B.5). **SHAP** (SHapley Additive exPlanations) gives each feature's **contribution to each individual prediction**, based on Shapley values from cooperative game theory. The contributions add up exactly: **prediction = base value + Σ SHAP values**.

```python
import shap
explainer = shap.TreeExplainer(fitted_lgbm_model)       # fast, exact for tree models
X_val_t = preprocess.transform(X_val)                     # the TRANSFORMED features
shap_values = explainer(X_val_t)
shap.plots.beeswarm(shap_values)        # global: importance + direction
shap.plots.waterfall(shap_values[0])    # local: why THIS customer got THIS score
```

(This is exactly the fix Part 13 needed. `TreeExplainer` wants the *unwrapped* model and the *transformed* X, not the pipeline.)

For a churn model, a waterfall plot turns "p = 0.81" into something a retention agent can act on: *"high because 3 complaints in 30 days (+0.22), contract ends in 2 weeks (+0.15), and data usage fell 60% (+0.12)."*

---

## 8B.7 Stacking 🟡

> [!info] 📖 Géron Ch. 6 · “Stacking” · pp. 215–219

Rather than a fixed rule (vote or average), **train a model, the *blender* or meta-learner, to combine the base predictions.**

Training without leakage:
1. For each base model, produce **out-of-fold predictions** on the training set with `cross_val_predict`.
2. These predictions (one column per base model) become the **blender's training features**. The targets stay the same.
3. Train the blender.
4. **Retrain every base model on the full training set** for inference.

Multi-layer stacking (several blenders, then a blender of blenders) can squeeze out a little more performance, at a cost in time and complexity.

```python
from sklearn.ensemble import StackingClassifier
stacking_clf = StackingClassifier(
    estimators=[("lr", LogisticRegression(random_state=42)),
                ("rf", RandomForestClassifier(random_state=42)),
                ("svc", SVC(probability=True, random_state=42))],
    final_estimator=RandomForestClassifier(random_state=43),
    cv=5)                         # out-of-fold predictions are built internally
# test accuracy 0.928 vs 0.92 for soft voting
```

Defaults: the base models' `predict_proba` is used, falling back to `decision_function` and then `predict`. The final estimator defaults to `LogisticRegression` (classifier) or `RidgeCV` (regressor).

⚠️ **Classic interview trap:** training the blender on **in-sample** base predictions leaks. The base models have memorised the training set, so the blender learns to trust them too much. Out-of-fold predictions are mandatory.

---

## 8B.8 Géron's summary: which ensemble when 🟡 ⭐

> [!info] 📖 Géron Ch. 6 · Table 6-1 “When to use each ensemble learning method” · p. 219

> [!quote] 💬 Say it in the interview
> “Random forest reduces variance and is hard to break; gradient boosting reduces bias and usually wins on tabular data once tuned with early stopping.”

| Method | Use when | Example use cases |
|---|---|---|
| Hard voting | Several strong but diverse classifiers, balanced data | Spam, sentiment |
| Soft voting | Probabilistic, calibrated models where confidence matters | Medical diagnosis, **credit risk** |
| Bagging | High-variance, overfitting-prone models | Financial risk, recommendations |
| Pasting | You want more independent models, cheaper than bagging | Segmentation |
| **Random Forest** | High-dimensional tabular data with noisy features | **Customer churn**, **fraud detection**, genetics |
| Extra-Trees | Large data, many features, training speed matters | Real-time fraud, sensors |
| AdaBoost | Small/medium, low-noise data with weak learners | Credit scoring, predictive maintenance |
| Gradient Boosting | Medium/large data where accuracy is paramount | Pricing, risk, **demand forecasting** |
| **HGB / LightGBM** | Large data where speed and scalability are key | **CTR prediction, ranking, ad bidding** |
| Stacking | Squeezing out maximum accuracy from diverse models | Kaggle, recommendation engines |

Géron's closing tip: *"Random forests, AdaBoost, GBRT, and HGB are among the first models you should test for most machine learning tasks, particularly with heterogeneous tabular data"*, partly because they need very little preprocessing.

### Bagging vs boosting — the comparison table interviewers love

| | Bagging / Random Forest | Boosting (GBM, XGBoost, LightGBM) |
|---|---|---|
| Training | **Parallel**, independent models | **Sequential**; each fixes the last |
| Base learners | **Deep**, low-bias, high-variance trees | **Shallow**, high-bias weak learners |
| Mainly reduces | **Variance** | **Bias** (and variance, with shrinkage and subsampling) |
| More estimators | Never overfits, just plateaus | **Can overfit**; use early stopping |
| Sensitivity to noise/outliers | Robust | More sensitive (especially AdaBoost) |
| Tuning effort | Low; good defaults | Higher; learning rate × trees × depth interact |
| Typical accuracy on tabular | Very good | Usually **best** |

---

## 8B.9 Putting it in a pipeline: a realistic churn model 🟡 ⭐

> [!quote] 💬 Say it in the interview
> “My default tabular model is LightGBM or HGB in a pipeline, with early stopping, a cost-based threshold and SHAP to explain predictions.”

```python
import numpy as np
import pandas as pd
from sklearn.model_selection import StratifiedKFold, cross_validate
from sklearn.ensemble import HistGradientBoostingClassifier
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OrdinalEncoder
from sklearn.pipeline import Pipeline

cat_cols = ["plan_type", "governorate", "handset_tier", "payment_method"]
num_cols = ["tenure_months", "arpu_3m", "data_gb_30d", "data_gb_trend",
            "calls_out_30d", "complaints_90d", "days_to_contract_end",
            "recharge_count_30d", "network_drop_rate"]

preprocess = ColumnTransformer([
    ("cat", OrdinalEncoder(handle_unknown="use_encoded_value", unknown_value=-1,
                           encoded_missing_value=-1), cat_cols),
    ("num", "passthrough", num_cols),
])

hgb = HistGradientBoostingClassifier(
    categorical_features=list(range(len(cat_cols))),   # first block = categoricals
    learning_rate=0.05, max_iter=2000, early_stopping=True,
    validation_fraction=0.1, n_iter_no_change=50,
    l2_regularization=1.0, class_weight="balanced", random_state=42)

pipe = Pipeline([("prep", preprocess), ("model", hgb)])

cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
scores = cross_validate(pipe, X_train, y_train, cv=cv,
                        scoring={"pr_auc": "average_precision", "roc_auc": "roc_auc"})
print({k: f"{v.mean():.3f} ± {v.std():.3f}" for k, v in scores.items() if "test" in k})
```

Points to narrate in an interview:
- No scaling or imputation is needed for trees; the ordinal encoding is just the categorical representation.
- **`class_weight="balanced"` distorts probabilities.** Recalibrate before using them as risk scores.
- **Temporal validation** is needed if the features are monthly snapshots: train on Jan–Jun, validate on Jul, test on Aug (`TimeSeriesSplit` or manual cut-offs). A random KFold on snapshots leaks future behaviour.
- **Feature windows must end before the label window starts.** Features up to 31 March, churn label = "left during April–May". Anything computed after the cut-off is target leakage.

---

> [!check] ✅ Key takeaways
> - Trees split greedily on impurity (Gini/entropy); unconstrained trees overfit, so limit depth or leaf size.
> - Trees don't need scaling but can't extrapolate beyond the training range.
> - Bagging and random forests average de-correlated trees → lower variance; OOB gives a free validation score.
> - Boosting adds trees sequentially to fix errors → lower bias; tune learning rate × trees with early stopping.
> - XGBoost/LightGBM/CatBoost are the tabular default; explain them with SHAP.
> - Stacking can add a little accuracy at a real complexity cost.

## 8B.10 Interview drill — trees and ensembles (Géron Ch. 5–6 exercises, answered) 🟢 ⭐

> [!info] 📖 Géron Ch. 5 · Exercises p. 193; Ch. 6 · Exercises p. 219

**1. Approximate depth of an unrestricted tree trained on 1 million instances?** About log₂(10⁶) ≈ **20** if balanced; in practice somewhat deeper, since trees aren't perfectly balanced.

**2. Is a node's Gini impurity lower or higher than its parent's? Always?** *Generally lower*, because CART minimises the weighted impurity of the children. A child can still be *more* impure than its parent, as long as the other child's decrease more than compensates. Only the weighted sum is guaranteed not to increase.

**3. A tree overfits: decrease `max_depth`?** Yes, that constrains it.

**4. A tree underfits: scale the inputs?** No. Trees don't care about scale. Loosen the constraints or improve the features instead.

**5. One hour at 1M rows. How long at 10M?** O(n·m·log m) → 10 × log(10⁷)/log(10⁶) ≈ **11.7 hours**.

**6. One hour of training. How long with twice the features?** About **2 hours** (linear in n).

**7. Five different models, each with 95% precision. Can combining them help?** Yes, if they make *different* errors. Use a voting or stacking ensemble. The more diverse the models (different algorithms or data), the bigger the gain.

**8. Hard vs soft voting?** Hard counts predicted labels. Soft averages predicted probabilities, so confident votes weigh more; it is usually better and needs `predict_proba` from every model.

**9. Can each ensemble be distributed across servers?** Bagging, pasting and Random Forests: **yes**, the predictors are independent. Boosting: **no**, predictors are sequential (though each tree can be parallelised internally). Stacking: the base models of one layer can be parallelised; the layers are sequential.

**10. Benefit of OOB evaluation?** Each instance is evaluated by the predictors that didn't train on it, which gives a free, fairly unbiased validation score and leaves all the data for training.

**11. What makes Extra-Trees more random, and does it help? Faster or slower?** Random split thresholds on top of random feature subsets. This adds bias but reduces variance, which helps on noisy data. Training is **faster** (no threshold search); prediction speed is about the same.

**12. AdaBoost underfits: which knobs?** Increase `n_estimators`, reduce the base estimator's regularisation (deeper trees), or slightly increase `learning_rate`.

**13. Gradient boosting overfits: raise or lower the learning rate?** **Lower** it, and use early stopping to set the number of trees. Also: shallower trees, `subsample < 1`, stronger ℓ₂.

**Beyond the book, frequently asked:**

- **"Why does a Random Forest pick a random subset of features at each split?"** To decorrelate the trees. With one dominant feature, every bagged tree would split on it first and they would all make the same errors, so averaging would reduce variance less.
- **"Can a Random Forest overfit?"** Adding trees does not overfit. Individual trees can be too deep for very noisy data, so tune `min_samples_leaf` and `max_features`. Its training score is always optimistic; use OOB or CV.
- **"Why do tree ensembles beat neural networks on tabular data?"** They handle mixed types, irregular non-smooth target functions, uninformative features, missing values and unscaled data natively. Neural networks have an inductive bias toward smooth functions and need a lot of preprocessing (Grinsztajn et al., 2022).
- **"LightGBM vs XGBoost?"** LightGBM grows leaf-wise with histogram, GOSS and EFB, so it is faster on large data but can overfit small data unless `num_leaves` and `min_data_in_leaf` are constrained. XGBoost grows level-wise by default and has a very mature regularised objective.
- **"How do you handle a categorical feature with 10,000 levels in LightGBM or CatBoost?"** Use native categorical handling (CatBoost's ordered target statistics are the most leakage-safe), or target encoding with cross-fitting. Not one-hot.
- **"How would you explain a GBM's prediction to a regulator or customer?"** SHAP values (per-prediction additive contributions), partial dependence or ICE plots for feature effects, and monotonic constraints (`monotonic_cst` in HGB; `monotone_constraints` in XGBoost/LightGBM) so that, for example, more missed payments can never lower the risk score.
- **"Your model's top feature is `customer_id`. What happened?"** Leakage or memorisation: an identifier correlated with the label, e.g. IDs assigned sequentially in time. Drop identifiers, and check with permutation importance on a time-based validation set.

---

## 8B.11 Real-world examples — ensembles in production 🟡

- **Kaggle & the M5 forecasting competition (Walmart, 2020):** LightGBM-based solutions dominated the accuracy track — gradient boosting with good lag features beat deep networks on tabular/time-series data.
- **Uber (Michelangelo) & Airbnb:** XGBoost/LightGBM power ETA correction, pricing and search ranking; Airbnb documented moving from GBDT to deep learning for search only after years of feature work — a DL model has to *earn* its place against boosting.
- **Credit & fraud at banks/fintechs:** GBMs + **SHAP reason codes** so every declined application gets an explanation ("high utilisation, short credit history").
- **Telecom churn and NBO:** LightGBM/CatBoost is the typical production model; CatBoost handles high-cardinality categoricals (handset model, area code) natively.
- **Tabular foundation models (2025):** TabPFN v2 (published in *Nature*) beats tuned GBMs on small datasets (≤ ~10k rows) with zero tuning — worth knowing as a "what's new" talking point (Part 25).

---

## Further reading

- **Géron, *Hands-On ML*** Chapters 5–6, and the chapter notebooks at https://homl.info/colab-p. Do Exercise 8 of Chapter 5 ("grow a forest by hand"): it makes bagging click.
- **StatQuest**: *Decision Trees*, *Random Forests*, *AdaBoost*, *Gradient Boost (Parts 1–4)*, *XGBoost (Parts 1–4)*. The clearest intuition available.
- **ISLR Chapter 8**: tree-based methods, with bagging, RF and boosting explained statistically.
- **Friedman (2001), "Greedy Function Approximation: A Gradient Boosting Machine"**: the original GBM paper.
- **Chen & Guestrin (2016), "XGBoost: A Scalable Tree Boosting System"**.
- **Ke et al. (2017), "LightGBM: A Highly Efficient Gradient Boosting Decision Tree"**.
- **Lundberg & Lee (2017), "A Unified Approach to Interpreting Model Predictions"**: the SHAP paper. Also the `shap` documentation.
- **scikit-learn User Guide §1.10 (Trees), §1.11 (Ensembles)**, and the "Permutation feature importance" page.
- **Grinsztajn, Oyallon & Varoquaux (2022)**, "Why do tree-based models still outperform deep learning on typical tabular data?"

---

<!-- nav -->
> [!example] 🧭 Step 11 of 26 · Stage 3 of 7: Classical ML
> ← [Part 08 · Classification](08_Supervised_Classification.md) · [Part 09 · Unsupervised](09_Unsupervised_PCA_and_Clustering.md) → · [Course map](00_START_HERE.md)
<!-- /nav -->
