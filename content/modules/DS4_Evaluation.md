# Evaluation and Error Analysis — Validation Design, Metrics, Thresholds, Calibration and Explanations

A model is only as good as the evidence that it works. DS interviews test evaluation more than any algorithm: "how did you validate it?", "why PR-AUC?", "how did you pick the threshold?", "are the probabilities trustworthy?", "where does the model fail?". This module covers validation designs that match how a model will be used, the metrics for classification and regression, decisions from costs, calibration, explanations with SHAP, and the error analysis that tells you what to do next. *AI Journey* Part 8 has worked figures for ROC, PR curves and calibration.

> [!focus]
> **Entry must:** explain train, validation and test sets; use cross-validation correctly; read a confusion matrix; define precision, recall, F1 and ROC-AUC; choose MAE vs RMSE; explain why accuracy misleads on imbalanced data.
> **Mid adds:** time-based and grouped validation, PR-AUC vs ROC-AUC, threshold choice from costs, precision@k and lift, calibration, SHAP and permutation importance (and their limits), slice-based error analysis, comparing models with uncertainty.
> **Most asked:** *Precision vs recall?* · *ROC-AUC vs PR-AUC?* · *How do you choose a threshold?* · *What is calibration?* · *How do you validate a time-dependent model?* · *How do you explain a prediction?* · *MAE or RMSE?*
> **Time budget:** 3.5 hours.

## DS4.1 Train, validation and test 🟢 ⭐

| Set | Purpose | Touched |
|---|---|---|
| **Training** | Fit the model's parameters | Constantly |
| **Validation** (or cross-validation folds) | Choose features, models, hyperparameters, thresholds | Many times |
| **Test** | One honest estimate of future performance | **Once**, at the end |

Every decision made by looking at a set leaks a little information from it, so a test set used repeatedly stops being a test set.

## DS4.2 Validation designs 🟢 🟡 ⭐

**Validate the way the model will be used.**

| Design | How | Use when |
|---|---|---|
| **k-fold** | Split into k folds; train on k−1, validate on 1, rotate | Independent rows, no time order |
| **Stratified k-fold** | Each fold keeps the class proportions | Classification, especially imbalanced |
| **Group k-fold** | All rows of one entity (customer, patient, store) stay in the same fold | Entities appear many times ([[DS2.4]]) |
| **Time-series split / rolling origin** | Train on data up to time t, validate on the next period; move t forward | **Anything predicting the future**: churn, demand, credit |
| **Out-of-time test** | Hold out the most recent period entirely | Final check that performance survives time |
| **Nested CV** | An inner loop for tuning inside an outer loop for evaluation | Small datasets where you need an unbiased estimate after tuning |

<figure class="dia"><svg viewBox="0 0 720 150" role="img" aria-label="Rolling-origin time series validation folds">
<text class="sS" x="10" y="20">time →</text>
<g>
<rect class="sA" x="80" y="30" width="200" height="18" rx="3"/><rect class="sW" x="280" y="30" width="60" height="18" rx="3"/>
<rect class="sA" x="80" y="56" width="260" height="18" rx="3"/><rect class="sW" x="340" y="56" width="60" height="18" rx="3"/>
<rect class="sA" x="80" y="82" width="320" height="18" rx="3"/><rect class="sW" x="400" y="82" width="60" height="18" rx="3"/>
<rect class="sA" x="80" y="108" width="380" height="18" rx="3"/><rect class="sW" x="460" y="108" width="60" height="18" rx="3"/>
<rect class="sR" x="560" y="30" width="80" height="96" rx="3"/>
</g>
<text class="sS" x="10" y="44">fold 1</text><text class="sS" x="10" y="70">fold 2</text><text class="sS" x="10" y="96">fold 3</text><text class="sS" x="10" y="122">fold 4</text>
<text class="sM" x="600" y="146" text-anchor="middle">final test</text>
<text class="sM" x="200" y="146">train (blue) · validate (amber)</text>
</svg><figcaption>Rolling-origin validation: always train on the past and validate on the next period, then a final out-of-time test.</figcaption></figure>

> [!say]
> "Because the model predicts the future, I validate with rolling time-based folds, always training on the past and scoring the next period, keeping the same customer within one fold, and I hold out the most recent months as a final out-of-time test. A random split would let the model learn from the future and overstate performance."

## DS4.3 Classification metrics 🟢 ⭐

| | Predicted positive | Predicted negative |
|---|---|---|
| **Actually positive** | True positive (TP) | False negative (FN) |
| **Actually negative** | False positive (FP) | True negative (TN) |

| Metric | Formula | Answers |
|---|---|---|
| Accuracy | (TP+TN) ÷ all | Share correct; **misleading under imbalance** |
| **Precision** | TP ÷ (TP+FP) | Of those we flagged, how many were right? |
| **Recall** (sensitivity, TPR) | TP ÷ (TP+FN) | Of the real positives, how many did we catch? |
| Specificity | TN ÷ (TN+FP) | Of the real negatives, how many did we leave alone? |
| **F1** | Harmonic mean of precision and recall | A single balance of the two |
| **ROC-AUC** | Area under the TPR vs FPR curve across thresholds | Probability a random positive is ranked above a random negative |
| **PR-AUC** (average precision) | Area under precision vs recall | Ranking quality **focused on the positives**: better for rare events |
| Log loss | −mean of log of the probability given to the true class | Quality of the **probabilities** themselves |
| Brier score | Mean squared error of probabilities | Probability quality; decomposes into calibration and refinement |
| **Precision@k / recall@k** | Precision or recall among the top k scored | When you can only act on k cases (call 5,000 customers) |
| **Lift / gains** | Positive rate in the top decile ÷ overall rate | "The top 10% has 4× the churn rate" for business audiences |
| **KS statistic** | Max distance between the score distributions of positives and negatives | Credit-scoring convention |

> [!term] ROC-AUC vs PR-AUC
> ROC-AUC uses the false-positive **rate**, whose denominator is all negatives. With 1% positives, even many false alarms barely move it, so ROC-AUC can look excellent while precision is poor. PR-AUC uses **precision**, so it reflects how many alerts are useful. For rare events (fraud, churn in a short window, default), report PR-AUC (and precision at the operating point) alongside ROC-AUC. The PR baseline is the positive rate, not 0.5.

> [!say]
> "Precision is how many of the flagged cases are real; recall is how many real cases we catch. Which matters more depends on the cost: for fraud blocks I protect precision so good customers aren't blocked; for disease screening I protect recall. With rare positives I report PR-AUC rather than only ROC-AUC, because ROC hides a flood of false positives behind a tiny false-positive rate."

> [!story]
> Your capstone used **F1-macro** because "slight" accidents dominated, so accuracy would have rewarded predicting "slight" for everything (your notes record a dummy model at about 89% accuracy). That's exactly the reasoning interviewers want. Also be ready to say what you'd report if the model were used to dispatch help: **recall on serious and fatal accidents** at an acceptable alert rate.

## DS4.4 Choosing a threshold from costs 🟡 ⭐

A model outputs scores; a **decision** needs a threshold (or a top-k). Choose it from value, not from 0.5:

```python
import numpy as np
benefit_tp, cost_fp, cost_fn = 600.0, 50.0, 0.0      # EGP: saved margin per retained churner; offer cost; (missed churner's loss counted via benefit)
thresholds = np.linspace(0.01, 0.99, 99)
def expected_profit(t):
    pred = proba >= t
    tp = np.sum(pred & (y == 1)); fp = np.sum(pred & (y == 0))
    return tp * benefit_tp * acceptance_rate - (tp + fp) * cost_fp      # only some churners accept the offer
best_t = max(thresholds, key=expected_profit)
```

Also common: fix the **capacity** (the CRM team can call 5,000 per week, so take the top 5,000), or fix a **constraint** (precision ≥ 90% for automatic fraud blocks) and maximise recall under it. Re-check the threshold whenever base rates or costs change. *AI Journey* Part 8 has the profit-curve figure.

## DS4.5 Calibration 🟡 ⭐

> [!term] Calibration
> A model is calibrated if, among cases given a probability of 0.3, about 30% are actually positive. Rankings (AUC) can be excellent while probabilities are badly off. Boosted trees, random forests, SVMs and anything trained with resampling or class weights are often **miscalibrated**.

**Why it matters:** expected-value decisions (probability × value), risk-based **pricing** in credit and insurance, combining scores across models, and communicating risk to people.

**How to check and fix:** a **reliability diagram** (predicted probability bins vs observed rates) and the Brier score; then calibrate on held-out data with **Platt scaling** (a logistic fit, good for little data) or **isotonic regression** (non-parametric, needs more data), via `CalibratedClassifierCV`.

## DS4.6 Explaining models 🟡 ⭐

| Method | Scope | Answers | Caveat |
|---|---|---|---|
| Coefficients (linear models) | Global | Direction and size per feature | Only with scaled, not-too-correlated features |
| **Permutation importance** | Global | How much validation performance depends on each feature | Correlated features share and hide importance |
| **Partial dependence / ICE plots** | Global / per instance | How predictions change as one feature varies | Assumes the feature can vary independently |
| **SHAP values** | Global **and** local | Each feature's contribution to **this** prediction, relative to the average prediction | Fast and exact for trees (TreeSHAP); still **association, not causation** |

```python
import shap
explainer = shap.TreeExplainer(lgb_model)
sv = explainer(X_valid)
shap.plots.beeswarm(sv)          # global: which features matter, and in which direction
shap.plots.waterfall(sv[0])      # local: why this customer got this score
```

**Reason codes** (credit decisions): the top features pushing a score towards decline, translated into plain language ("high utilisation of existing credit lines").

> [!mistake] Reading SHAP as causal
> "Customers with more complaints have higher churn SHAP values" doesn't mean reducing complaints will reduce churn by that amount. SHAP explains the **model**, which learned **correlations**. For "what if we change X?", you need causal methods ([[DS5]]).

> [!story]
> You used **SHAP** in the road-accident capstone. Say what you learned from it and what you'd caution a road-safety official about: the features push predictions, but that doesn't prove that changing a road condition changes outcomes by that much.

## DS4.7 Regression metrics 🟢 ⭐

| Metric | Meaning | Use |
|---|---|---|
| **MAE** | Mean absolute error, in the target's units | Robust to outliers; easy to explain ("off by EGP 120 on average") |
| **RMSE** | Square root of mean squared error | Penalises large errors more; matches a squared-error loss |
| **MAPE** | Mean absolute **percentage** error | Intuitive, but explodes near zero and is asymmetric; avoid for intermittent demand |
| **WAPE** (weighted APE) | Σ\|error\| ÷ Σ\|actual\| | Forecasting across many items; stable with small values |
| **R²** | Share of variance explained | Comparisons on the same data; not a business metric |
| **Pinball (quantile) loss** | Error for a predicted quantile | Prediction intervals, safety stock ([[DS6]]) |

**MAE vs RMSE:** if a few large misses are very costly (under-staffing on a peak day), optimise and report RMSE; if typical error matters and outliers are noisy, MAE.

## DS4.8 Error analysis: where does the model fail? 🟡 ⭐

Aggregate metrics hide uneven performance. After choosing a model:

1. **Slice** performance by segment: region, channel, tenure band, device, customer value, new vs existing. A model with good overall AUC can be useless for new customers.
2. **Inspect the worst errors** (largest false positives and false negatives) individually: often they reveal **label problems**, data bugs or a missing feature.
3. **Confusion matrix by class** for multiclass problems: which classes are confused with which?
4. **Check stability over time:** performance by month in the out-of-time period.
5. **Turn findings into actions:** a new feature, better labels, a separate model or rule for a segment, or a documented limitation.

> [!say]
> "After the headline metric, I slice performance by segment and time, because a good average can hide a segment where the model fails, often new customers. Then I read the worst errors one by one; that's usually where label problems or a missing feature show up."

## DS4.9 Is model B really better? 🟡

Two models whose AUC differs by 0.003 may be indistinguishable. Estimate uncertainty: the spread across CV folds, **bootstrap** confidence intervals on the test set, or paired tests on the same folds. Prefer the simpler, more stable or more explainable model when the difference is within noise.

## DS4.10 Fairness checks 🟡

Compare outcomes and errors across groups where it matters (credit, hiring, insurance):

- **Demographic parity:** similar positive-decision rates across groups.
- **Equal opportunity / equalised odds:** similar true-positive (and false-positive) rates across groups.
- **Calibration within groups:** a score of 0.3 means about 30% in every group.

These criteria can't all hold at once when base rates differ, so the choice is a policy decision, documented and reviewed. Tools: Fairlearn, AIF360.

## DS4.11 Offline vs online evaluation 🟢

Offline metrics estimate potential; **online experiments measure impact** ([[S6.9]], [[DA6.4]]). A churn model with better PR-AUC proves its worth only when a randomised holdout shows that contacting its top-k retains more customers (or more margin) than the old rule did.

> [!lab] Evaluate one model like a professional
> Take your best model from [[DS3]]'s lab. Produce: rolling time-based CV scores with spread; ROC and PR curves; a profit curve with the chosen threshold; a reliability diagram before and after isotonic calibration; a SHAP beeswarm and two waterfall explanations; a performance table sliced by two segments; and a five-sentence evaluation summary. That page is what interviewers mean by "how did you evaluate it?".

## DS4.12 Interview drill 🟢 ⭐

| Question | Strong short answer |
|---|---|
| Why a separate test set? | Every decision based on validation data overfits it slightly; the test set gives one honest final estimate. |
| How do you validate a model that predicts the future? | Rolling time-based splits, entity-grouped where needed, plus an out-of-time test. |
| Precision vs recall? | Of flagged, how many are right vs of real positives, how many we caught. |
| When is accuracy misleading? | With imbalanced classes: predicting the majority class scores highly. |
| ROC-AUC vs PR-AUC? | ROC uses the FP rate (hides false alarms when negatives dominate); PR uses precision, better for rare events. |
| How do you choose a threshold? | Maximise expected value from costs and benefits, or meet a capacity or precision constraint. |
| What is calibration? | Predicted probabilities match observed frequencies; fix with Platt or isotonic on held-out data. |
| What does SHAP tell you? | Each feature's contribution to a prediction relative to the average, globally and locally; not causal. |
| Permutation importance? | The drop in validation performance when a feature is shuffled. |
| MAE vs RMSE? | MAE is robust and in units; RMSE penalises large errors more. |
| Why avoid MAPE for low-volume items? | It explodes near zero and is asymmetric; use WAPE or MAE. |
| What's precision@k? | Precision among the top k scored cases, matching a fixed action capacity. |
| What is error analysis? | Slicing performance by segment and time and inspecting the worst errors to find fixes. |
| How do you know the model created value? | An online experiment with a holdout measuring the business outcome. |

## Key takeaways

> [!check]
> - Validate the way the model will be used: forward in time, grouped by entity, with an out-of-time test.
> - Pick metrics that match the decision: PR-AUC and precision@k for rare events; MAE/WAPE for forecasts.
> - Thresholds come from costs or capacity, not 0.5.
> - Check calibration when probabilities drive decisions.
> - SHAP explains the model, not the world; slice errors to learn what to fix.

## Sources

- scikit-learn user guide: [Model evaluation (metrics)](https://scikit-learn.org/stable/modules/model_evaluation.html), [Cross-validation](https://scikit-learn.org/stable/modules/cross_validation.html), [Probability calibration](https://scikit-learn.org/stable/modules/calibration.html), [Tuning the decision threshold](https://scikit-learn.org/stable/modules/classification_threshold.html), [Permutation importance](https://scikit-learn.org/stable/modules/permutation_importance.html), [Partial dependence](https://scikit-learn.org/stable/modules/partial_dependence.html).
- Takaya Saito and Marc Rehmsmeier, "The Precision-Recall Plot Is More Informative than the ROC Plot When Evaluating Binary Classifiers on Imbalanced Datasets" (*PLOS ONE*, 2015).
- Scott Lundberg and Su-In Lee, "A Unified Approach to Interpreting Model Predictions" (NeurIPS 2017); [SHAP documentation](https://shap.readthedocs.io/).
- Christoph Molnar, [*Interpretable Machine Learning*](https://christophm.github.io/interpretable-ml-book/) (free online).
- Rob Hyndman and George Athanasopoulos, [*Forecasting: Principles and Practice*, 3rd ed.](https://otexts.com/fpp3/), chapter 5 (forecast accuracy measures).
- [Fairlearn](https://fairlearn.org/) documentation on fairness metrics.
- Your *AI Journey* Parts 6 and 8.
