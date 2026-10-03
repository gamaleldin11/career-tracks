# Data Scientist Interview Hub — Cases, ML Design, Take-Homes and the Question Bank

This is the module to live in during the final week before a data-scientist interview. It brings the DS track together with your *AI Journey* course (whose Part 16 has a 90-question bank, telecom use cases and mock answers for e& Egypt). Here: how DS interviews usually run, a full ML system design answer, how take-homes are judged, the portfolio fixes that matter most for you, and a question bank across statistics, modelling, evaluation, causality and production.

> [!focus]
> **Entry must:** explain your projects end to end (framing, data, model, evaluation, impact); answer statistics and ML fundamentals precisely; write pandas and SQL under time pressure.
> **Mid adds:** design an ML system from business goal to monitoring, reason about causality and experiments, discuss trade-offs and failure modes, review a flawed analysis.
> **Time budget:** the final week: the bank daily, one case or design every day, one timed take-home.

## DS9.1 How data-science interviews usually run 🟢 ⭐

| Round | What happens | Prepared by |
|---|---|---|
| HR screen | Background, English, salary, military status | [[S8]] |
| Statistics and probability | p-values, CIs, A/B design, Bayes, distributions | [[S6]], *AI Journey* Part 15 |
| ML fundamentals | Bias–variance, regularisation, trees vs boosting, metrics, leakage | [[DS2]]–[[DS4]], *AI Journey* Parts 6–8B |
| Coding | pandas or SQL tasks; sometimes an easy algorithm problem | [[S7]], [[S3]], [[DA3]], [[S4]] |
| **Case / ML design** | "Build a churn model", "Design fraud detection", "Was the campaign effective?" | [[DS1]], [[DS9.2]], [[DS5]] |
| Take-home | A dataset and a question: notebook plus a short presentation | [[DS9.3]] |
| Project deep-dive and team round | Your capstone, Emotidect, FinSight forecasting | [[S8]] |

## DS9.2 ML system design: a complete answer ⭐

"**Design a system to reduce churn for a telecom operator.**" Use the structure from [[DS1.8]], spoken in about 20 minutes:

1. **Goal and decision.** Reduce prepaid churn through weekly retention offers from the CRM team; budget for 50,000 offers per week; offers cost money, so target carefully.
2. **Framing.** Unit: subscriber; prediction time: Sunday 00:00; target: inactive 30 days starting within the next 30 days; because the real question is *whom an offer saves*, plan for **uplift** modelling once we have randomised campaign data ([[DS5.6]]).
3. **Data.** Recharges, usage (calls, data), plan changes, complaints, network quality in the subscriber's area, tenure, device; labels from the activity table; check availability at the cut-off and point-in-time joins ([[DS2.6]]).
4. **Features.** Recency, frequency, spend over 7/30/90 days, usage trend ratios, complaints and dropped calls, bundle expiry proximity, region ([[DS2.1]]).
5. **Baseline and models.** The current rule (no recharge for 14 days); logistic regression; LightGBM with early stopping and Optuna ([[DS3]]).
6. **Validation and metrics.** Rolling time-based CV plus an out-of-time test; PR-AUC, **precision and recall at 50,000**, calibration; profit at the chosen cut-off; error analysis by region and tenure ([[DS4]]).
7. **Deployment.** Weekly batch scoring in a pipeline (Airflow or Azure ML), results to a table the CRM tool reads, registered model with versioning ([[DS8]]).
8. **Measuring impact.** A randomised holdout within the targeted list: retention and margin, treated vs holdout; this also produces the data for an uplift model.
9. **Monitoring.** Data quality, feature and score drift (PSI), performance as 30-day labels arrive, campaign KPIs; retrain monthly or on alerts with validation gates.
10. **Risks.** Leakage from post-churn signals, feedback loops (offers change future behaviour), fairness across regions, offer fatigue, personal-data rules.

> [!say]
> "I'd frame it from the CRM team's weekly budget of 50,000 offers: score subscribers every Sunday on their 30-day churn risk using only data up to Saturday, beat the current 14-day rule with a gradient-boosted model validated forward in time, and pick the top 50,000 by expected value. The first campaigns keep a random holdout, which proves the impact and gives us data to move from churn risk to uplift, so we stop paying offers to people who'd stay anyway. Then I'd monitor drift and the campaign's retained margin, and retrain monthly through the pipeline."

**More designs to practise:** fraud detection at payment time (real time, latency, label delay, adversaries); demand forecasting for dark stores ([[DS6]]); a product recommender for an e-commerce app; credit scoring for a BNPL fintech (explainability, reject inference, regulation); delivery ETA prediction; complaint routing with Arabic text ([[DS7]]).

## DS9.3 Take-home assignments 🟢 ⭐

**What reviewers score:**

| Area | Great looks like |
|---|---|
| Framing | Restates the question as a decision; states assumptions; defines the target precisely |
| Data handling | Profiling, cleaning decisions logged, no leakage ([[DS2.4]]) |
| Baseline | A trivial or rule baseline reported first |
| Modelling | Sensible models in pipelines; tuned reasonably, not obsessively |
| Validation | A split that matches how it would be used (time or group); honest test |
| Metrics | Chosen for the decision, with thresholds from costs ([[DS4.4]]) |
| Insight | Error analysis and explanations; what drives predictions, with causal caveats |
| Communication | A short summary up front: answer, evidence, recommendation, limitations |
| Reproducibility | A notebook that runs top to bottom, pinned environment, seeds |

**Common mistakes that sink take-homes:** accuracy on imbalanced data; random splits on time data; preprocessing fitted on all data; ten models and no conclusion; no baseline; no business recommendation; a notebook that doesn't run.

## DS9.4 Your DS portfolio: what to fix first 🟢

From your gaps file and this track, in order of value per hour:

| Action | Closes |
|---|---|
| Add HistGradientBoosting, LightGBM and CatBoost (Optuna-tuned, time-aware CV) to the road-accident leaderboard ([[DS3]] lab) | XGBoost/LightGBM, the top modelling gap |
| Evaluate it properly: PR curves, profit threshold, calibration, SHAP, slices ([[DS4]] lab) | Evaluation depth |
| Serve it: MLflow + FastAPI + Docker + drift report ([[DS8]] lab) | MLOps, Python in production |
| Backtest FinSight's TimeGPT against baselines with interval coverage ([[DS6]] lab) | Turns forecasting into a DS result |
| Analyse a public A/B test, or run a DiD simulation ([[DA6]], [[DS5]] labs) | Experimentation in practice |
| Optional: a Kaggle competition entry with a write-up | A visible, checkable signal |

**Certifications:** Microsoft's data-scientist exam (DP-100) retired in June 2026; its successor **AI-300 (MLOps Engineer Associate)** suits you if the role leans toward production ML.

## DS9.5 The question bank 🟢 ⭐

Answer aloud, then reveal. For 90 more questions with telecom flavour, see *AI Journey* Part 16 §16.9.

| Question | Strong short answer |
|---|---|
| Mean or median for incomes? | Median, because incomes are right-skewed. |
| What is a p-value? | How surprising the data would be if there were no effect; not the probability the null is true. |
| What's a confidence interval? | A range built so that, over repeated samples, 95% of such ranges contain the true value. |
| Type I vs Type II error? | False positive vs false negative. |
| What is power? | The probability of detecting an effect of a given size if it exists. |
| State the CLT. | Sample means are approximately normal for large samples, whatever the data's shape. |
| How do you size an A/B test? | From baseline, minimum detectable effect, α and power; about 16σ²/δ² per group. |
| Why not peek and stop early? | It inflates false positives; fix the duration or use sequential methods. |
| Bayes: rare event, accurate test? | Most positives can still be false because of the low base rate. |
| Bias–variance trade-off? | Simple models underfit (bias); flexible models overfit (variance); balance with regularisation and data. |
| How do you detect overfitting? | A large train–validation gap; learning curves. |
| L1 vs L2? | L1 zeroes coefficients (selection); L2 shrinks smoothly. |
| Logistic regression coefficient? | Change in log-odds; exp gives the odds ratio. |
| Bagging vs boosting? | Independent models averaged (variance) vs sequential models on residuals (bias). |
| How does gradient boosting work? | Each shallow tree fits the gradient of the loss of the ensemble so far, added with a small learning rate. |
| Key boosting hyperparameters? | Learning rate with early stopping, leaves or depth, min leaf size, subsampling, regularisation. |
| Do trees need scaling? | No. |
| What is data leakage? | Information unavailable at prediction time reaching training or evaluation. |
| How do you prevent leakage? | Cut-off-based features, pipelines fitted on training folds, time and group splits. |
| How do you handle imbalance? | Right metrics, class weights, threshold tuning; resampling only inside CV. |
| Precision vs recall? | Correct among flagged vs caught among actual positives. |
| ROC-AUC vs PR-AUC? | PR-AUC is more informative when positives are rare. |
| How do you choose a threshold? | Expected value from costs, or capacity, not 0.5. |
| What is calibration? | Predicted probabilities matching observed frequencies; Platt or isotonic to fix. |
| What does SHAP show? | Each feature's contribution to a prediction; associations, not causes. |
| MAE vs RMSE? | Robust average error vs penalising large errors. |
| How do you validate a forecasting model? | Rolling-origin backtests forward in time. |
| What baseline for forecasting? | Seasonal naive; report MASE. |
| How do you handle Ramadan in forecasts? | Explicit Hijri-calendar features; it moves about 11 days earlier each year. |
| What is difference-in-differences? | Treated change minus control change, assuming parallel trends. |
| What's a confounder? | A common cause of treatment and outcome. |
| What is CUPED? | Variance reduction using pre-experiment data. |
| Churn model vs uplift model? | Who's at risk vs whom the treatment changes. |
| How do you choose k in k-means? | Elbow and silhouette as guides, mainly usefulness and stability. |
| TF-IDF vs embeddings? | Sparse word-importance features vs dense semantic vectors. |
| LLM vs a trained classifier? | LLMs for fast starts with few labels; trained models for volume, cost and privacy; evaluate both on held-out labels. |
| Batch vs real-time scoring? | Scheduled scoring for everyone vs per-request scoring with latency constraints. |
| What is training–serving skew? | Different feature computation in training and production. |
| Data drift vs concept drift? | Inputs change vs the input–target relationship changes. |
| What do you monitor in production? | Health, data quality, drift, delayed performance, business KPIs, fairness. |
| How do you prove a model's value? | An experiment with a holdout measuring the business outcome. |
| Tell me about your capstone. | Road-accident severity: imbalanced classes (F1-macro vs a dummy baseline), statistical tests, SHAP, HDBSCAN hotspots, and what you'd add (boosting, time-aware validation). |
| Tell me about Emotidect. | HuBERT fine-tuned for speech emotion on Persian data, validated on Egyptian-Arabic speech, defended before two juries. |
| Tell me about your forecasting work. | TimeGPT 90-day cash-flow forecasts, a gap-filled daily series for sparse data, a time-shifted backtest, background re-forecasting. |

## DS9.6 A two-week plan 🟢

| Days | Do |
|---|---|
| 1 | [[S6]] and *AI Journey* Part 15: statistics drill aloud |
| 2 | [[S7]], [[DA3]]: pandas and SQL tasks, timed |
| 3 | [[DS1]]: frame three problems on paper |
| 4 | [[DS2]]: the leakage lab |
| 5–6 | [[DS3]]: the tabular leaderboard with LightGBM and CatBoost |
| 7 | [[DS4]]: the full evaluation page for that model |
| 8 | [[DS5]]: DiD simulation; uplift concepts aloud |
| 9 | [[DS6]]: backtest a forecast against baselines |
| 10 | [[DS7]]: the complaints notebook (TF-IDF vs embeddings vs LLM) |
| 11 | [[DS8]]: MLflow + FastAPI serving of your best model |
| 12 | ML design practice ×2 ([[DS9.2]]), timed and recorded |
| 13 | A mock take-home (4 hours) and a 10-minute presentation |
| 14 | The question bank twice, project stories ([[S8]]) aloud, rest |

## Key takeaways

> [!check]
> - DS interviews reward framing, evaluation and judgement more than exotic models.
> - Answer design questions as a pipeline from decision to monitoring, with impact measured by experiment.
> - Take-homes fail on leakage, wrong metrics, missing baselines and missing recommendations; avoid all four.
> - Your fastest wins: boosting on your capstone, proper evaluation, and a served, monitored model.
> - Tell your three projects (capstone, Emotidect, FinSight forecasting) with numbers and honest limitations.

## Sources

- Modules S3, S6, S7, DA3, DA6 and DS1–DS8 of this handbook and their sources.
- Your *AI Journey* Part 16 (interview hub: telecom KPIs, use cases, 90 questions, mock answers, study plan).
- Chip Huyen, [*Introduction to Machine Learning Interviews*](https://huyenchip.com/ml-interviews-book/) (free online).
