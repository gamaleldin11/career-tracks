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

<figure class="dia anim"><svg viewBox="0 0 720 208" role="img" aria-label="Animation: churn system design; sources feed a point-in-time feature pipeline, a registered LightGBM model scores weekly, the CRM sends offers with a random holdout, outcomes arrive 30 days later and feed monitoring and retraining">
<rect class="sB" x="14" y="24" width="140" height="54" rx="8"/><text class="sT" x="84" y="49" text-anchor="middle">sources</text><text class="sC" x="84" y="65" text-anchor="middle">usage · CRM</text>
<line class="sL" x1="154" y1="51" x2="186" y2="51" marker-end="url(#ah)"/><rect class="sV" x="190" y="24" width="150" height="54" rx="8"/><text class="sT" x="265" y="49" text-anchor="middle">feature pipeline</text><text class="sC" x="265" y="65" text-anchor="middle">as of Sunday 00:00</text>
<line class="sL" x1="340" y1="51" x2="372" y2="51" marker-end="url(#ah)"/><rect class="sA" x="376" y="24" width="150" height="54" rx="8"/><text class="sT" x="451" y="49" text-anchor="middle">LightGBM</text><text class="sC" x="451" y="65" text-anchor="middle">registry: @champion</text>
<line class="sL" x1="526" y1="51" x2="558" y2="51" marker-end="url(#ah)"/><rect class="sG" x="562" y="24" width="144" height="54" rx="8"/><text class="sT" x="634" y="49" text-anchor="middle">weekly scores</text><text class="sC" x="634" y="65" text-anchor="middle">table, top 50,000</text>
<line class="sL" x1="634" y1="78" x2="634" y2="112" marker-end="url(#ah)"/>
<rect class="sW" x="562" y="114" width="144" height="54" rx="8"/><text class="sT" x="634" y="139" text-anchor="middle">CRM offers</text><text class="sC" x="634" y="155" text-anchor="middle">90% treated</text><rect class="sN" x="376" y="114" width="150" height="54" rx="8"/><text class="sT" x="451" y="139" text-anchor="middle">random holdout</text><text class="sC" x="451" y="155" text-anchor="middle">10% of the list</text>
<line class="sLm" x1="562" y1="141" x2="530" y2="141" marker-end="url(#ahm)"/>
<rect class="sB" x="190" y="114" width="150" height="54" rx="8"/><text class="sT" x="265" y="139" text-anchor="middle">outcomes</text><text class="sC" x="265" y="155" text-anchor="middle">30 days later</text><line class="sLm" x1="376" y1="141" x2="344" y2="141" marker-end="url(#ahm)"/>
<rect class="sR" x="14" y="114" width="140" height="54" rx="8"/><text class="sT" x="84" y="139" text-anchor="middle">monitor</text><text class="sC" x="84" y="155" text-anchor="middle">drift · uplift · KPIs</text><line class="sLm" x1="190" y1="141" x2="158" y2="141" marker-end="url(#ahm)"/>
<path class="sLw" d="M84 114 V96 H265 V82" fill="none" stroke-dasharray="5 4" marker-end="url(#ahw)"/><text class="sWt" x="170" y="106" text-anchor="middle">retrain with gates</text>
<circle class="sP" r="5"><animateMotion dur="6s" repeatCount="indefinite" path="M154 51 H634 V141 H158"/></circle>
<text class="sS" x="360" y="196" text-anchor="middle">framing, data, model, deployment, impact measurement and monitoring in one picture</text>
</svg><figcaption>The churn design answer as a system. The holdout box is what turns a model into measured business value.</figcaption></figure>

<figure class="dia"><svg viewBox="0 0 720 110" role="img" aria-label="A 20-minute ML design answer: goal 2 minutes, framing 3, data and features 4, models 3, validation 3, deployment 2, impact and monitoring 3">
<rect class="sB" x="14" y="30" width="67.2" height="44" rx="6"/><text class="sT" x="48.6" y="50" text-anchor="middle">goal</text><text class="sC" x="48.6" y="66" text-anchor="middle">2 min</text>
<rect class="sB" x="83.2" y="30" width="101.8" height="44" rx="6"/><text class="sT" x="135.1" y="50" text-anchor="middle">framing</text><text class="sC" x="135.1" y="66" text-anchor="middle">3 min</text>
<rect class="sA" x="187" y="30" width="136.4" height="44" rx="6"/><text class="sT" x="256.2" y="50" text-anchor="middle">data + features</text><text class="sC" x="256.2" y="66" text-anchor="middle">4 min</text>
<rect class="sA" x="325.4" y="30" width="101.8" height="44" rx="6"/><text class="sT" x="377.3" y="50" text-anchor="middle">models</text><text class="sC" x="377.3" y="66" text-anchor="middle">3 min</text>
<rect class="sV" x="429.2" y="30" width="101.8" height="44" rx="6"/><text class="sT" x="481.1" y="50" text-anchor="middle">validation</text><text class="sC" x="481.1" y="66" text-anchor="middle">3 min</text>
<rect class="sG" x="533" y="30" width="67.2" height="44" rx="6"/><text class="sT" x="567.6" y="50" text-anchor="middle">deploy</text><text class="sC" x="567.6" y="66" text-anchor="middle">2 min</text>
<rect class="sW" x="602.2" y="30" width="101.8" height="44" rx="6"/><text class="sT" x="654.1" y="50" text-anchor="middle">impact · monitor</text><text class="sC" x="654.1" y="66" text-anchor="middle">3 min</text>
<text class="sC" x="14" y="98">decision, budget, cadence</text><text class="sC" x="706" y="98" text-anchor="end">holdout, drift, retraining, risks</text>
</svg><figcaption>Spend the first five minutes on the decision and the target. Most weak answers jump straight to the model.</figcaption></figure>

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

<figure class="dia"><svg viewBox="0 0 720 230" role="img" aria-label="The data-science two-week plan as a calendar: statistics and coding, framing and leakage, the modelling leaderboard and evaluation, causal, forecasting, text and serving, then design practice and a mock take-home">
<rect class="sB" x="14" y="40" width="92" height="64" rx="8"/><text class="sM" x="22" y="56">day 1</text><text class="sT" x="60" y="78" text-anchor="middle">statistics</text><text class="sC" x="60" y="95" text-anchor="middle">aloud</text>
<rect class="sB" x="114" y="40" width="92" height="64" rx="8"/><text class="sM" x="122" y="56">day 2</text><text class="sT" x="160" y="78" text-anchor="middle">pandas · SQL</text><text class="sC" x="160" y="95" text-anchor="middle">timed</text>
<rect class="sV" x="214" y="40" width="92" height="64" rx="8"/><text class="sM" x="222" y="56">day 3</text><text class="sT" x="260" y="78" text-anchor="middle">framing ×3</text><text class="sC" x="260" y="95" text-anchor="middle">on paper</text>
<rect class="sV" x="314" y="40" width="92" height="64" rx="8"/><text class="sM" x="322" y="56">day 4</text><text class="sT" x="360" y="78" text-anchor="middle">leakage lab</text><text class="sC" x="360" y="95" text-anchor="middle">find it</text>
<rect class="sA" x="414" y="40" width="92" height="64" rx="8"/><text class="sM" x="422" y="56">day 5</text><text class="sT" x="460" y="78" text-anchor="middle">leaderboard</text><text class="sC" x="460" y="95" text-anchor="middle">LightGBM</text>
<rect class="sA" x="514" y="40" width="92" height="64" rx="8"/><text class="sM" x="522" y="56">day 6</text><text class="sT" x="560" y="78" text-anchor="middle">leaderboard</text><text class="sC" x="560" y="95" text-anchor="middle">CatBoost</text>
<rect class="sA" x="614" y="40" width="92" height="64" rx="8"/><text class="sM" x="622" y="56">day 7</text><text class="sT" x="660" y="78" text-anchor="middle">evaluation</text><text class="sC" x="660" y="95" text-anchor="middle">full page</text>
<rect class="sG" x="14" y="126" width="92" height="64" rx="8"/><text class="sM" x="22" y="142">day 8</text><text class="sT" x="60" y="164" text-anchor="middle">causal</text><text class="sC" x="60" y="181" text-anchor="middle">DiD · uplift</text>
<rect class="sG" x="114" y="126" width="92" height="64" rx="8"/><text class="sM" x="122" y="142">day 9</text><text class="sT" x="160" y="164" text-anchor="middle">forecasting</text><text class="sC" x="160" y="181" text-anchor="middle">backtest</text>
<rect class="sG" x="214" y="126" width="92" height="64" rx="8"/><text class="sM" x="222" y="142">day 10</text><text class="sT" x="260" y="164" text-anchor="middle">text</text><text class="sC" x="260" y="181" text-anchor="middle">3 ways</text>
<rect class="sG" x="314" y="126" width="92" height="64" rx="8"/><text class="sM" x="322" y="142">day 11</text><text class="sT" x="360" y="164" text-anchor="middle">MLflow</text><text class="sC" x="360" y="181" text-anchor="middle">+ FastAPI</text>
<rect class="sW" x="414" y="126" width="92" height="64" rx="8"/><text class="sM" x="422" y="142">day 12</text><text class="sT" x="460" y="164" text-anchor="middle">ML design ×2</text><text class="sC" x="460" y="181" text-anchor="middle">recorded</text>
<rect class="sW" x="514" y="126" width="92" height="64" rx="8"/><text class="sM" x="522" y="142">day 13</text><text class="sT" x="560" y="164" text-anchor="middle">take-home</text><text class="sC" x="560" y="181" text-anchor="middle">4 h + talk</text>
<rect class="sW" x="614" y="126" width="92" height="64" rx="8"/><text class="sM" x="622" y="142">day 14</text><text class="sT" x="660" y="164" text-anchor="middle">bank ×2</text><text class="sC" x="660" y="181" text-anchor="middle">stories · rest</text>
<text class="sM" x="14" y="30">week 1: foundations and the core model</text><text class="sM" x="14" y="116">week 2: beyond prediction, shipping, rehearsal</text>
<rect class="sB" x="20" y="204" width="16" height="16" rx="3"/><text class="sC" x="42" y="217">stats · code</text>
<rect class="sV" x="160" y="204" width="16" height="16" rx="3"/><text class="sC" x="182" y="217">framing · features</text>
<rect class="sA" x="300" y="204" width="16" height="16" rx="3"/><text class="sC" x="322" y="217">models · evaluation</text>
<rect class="sG" x="440" y="204" width="16" height="16" rx="3"/><text class="sC" x="462" y="217">beyond · production</text>
<rect class="sW" x="580" y="204" width="16" height="16" rx="3"/><text class="sC" x="602" y="217">rehearse</text>
</svg><figcaption>Days 5–7 produce the model everything else builds on. Protect them.</figcaption></figure>

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
