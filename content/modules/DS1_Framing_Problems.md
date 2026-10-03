# Framing Data-Science Problems — From a Business Goal to a Well-Posed Prediction

The most common reason data-science projects fail isn't a weak model. It's solving the wrong problem: a target that leaks the answer, a prediction made when nobody can act on it, an accuracy metric that ignores what errors cost. Interviewers know this, so DS case rounds start with framing: "we want to reduce churn. How would you approach it?". Your *AI Journey* course (Parts 6–13 and the e& interview hub in Part 16) covers the modelling depth; this track focuses on what turns modelling into data science: framing, features, evaluation, causality and production.

> [!focus]
> **Entry must:** translate a business goal into an ML task; define the target, the unit and the prediction time; propose a baseline; choose an evaluation metric that reflects the decision; say when ML isn't needed.
> **Mid adds:** point-in-time correctness, label windows, costs of errors and decision thresholds, what can go wrong after deployment, fairness and regulation, structuring a full DS case answer.
> **Most asked:** *How would you build a churn model?* · *How do you define the target?* · *What's your baseline?* · *Which metric and why?* · *How would the business use the predictions?* · *Do we even need ML here?*
> **Time budget:** 2.5 hours.

## DS1.1 Data science roles here 🟢

| Role | Core output | Typical tools |
|---|---|---|
| **Data analyst** | Answers, dashboards, decisions ([[DA1]]) | SQL, Excel, Power BI |
| **Data scientist** | Models and analyses that predict, explain or test: churn, credit risk, demand forecasts, experiments | Python, SQL, scikit-learn, gradient boosting, statistics |
| **ML engineer** | Models running reliably in production: pipelines, serving, monitoring | Python, Docker, MLflow, cloud ML platforms |
| **AI engineer** | Applications built on foundation models: RAG, agents, LLM features | LLM APIs, vector stores, orchestration (your AI Journey and FinSight AI work) |
| **Data engineer** | The data platform everyone else depends on ([[DE1]]) | SQL, Python, Spark, Airflow, dbt |

In Egypt, data-scientist roles concentrate in **telecoms** (churn, next-best offer, network analytics), **banking and fintech** (credit scoring, fraud, collections), **e-commerce and delivery** (demand forecasting, recommendations, ETA prediction), consultancies, and global companies' Cairo hubs. Many postings mix analyst, DS and ML-engineering duties.

## DS1.2 The project life cycle 🟢 ⭐

**CRISP-DM** (Cross-Industry Standard Process for Data Mining, 1999) is still the most cited life cycle:

1. **Business understanding:** the objective, the decision, the constraints, what success means.
2. **Data understanding:** sources, quality, coverage, how labels are produced.
3. **Data preparation:** cleaning, joining, features ([[DS2]]).
4. **Modelling:** baselines first, then better models ([[DS3]]).
5. **Evaluation:** against the **business** objective, not just a metric ([[DS4]]).
6. **Deployment:** batch scores, an API, or a decision rule, plus monitoring ([[DS8]]).

It's iterative: evaluation often sends you back to the business question or the data.

## DS1.3 Framing: the questions to answer first 🟢 ⭐

| Question | Churn example (telecom, prepaid) |
|---|---|
| **What decision will the prediction drive?** | Which subscribers get a retention offer this week |
| **Who acts, when, and how?** | The CRM team sends an SMS offer every Sunday; budget for 50,000 offers |
| **Unit of prediction** | One subscriber (MSISDN) per weekly run |
| **Prediction time** (the "cut-off") | Every Sunday 00:00, using data up to Saturday night |
| **Target definition** | Churned = no revenue-generating activity for 30 days, starting within the **next 30 days** after the cut-off |
| **ML task** | Binary classification (rank subscribers by churn risk) |
| **Baseline** | Rules the CRM team uses now (no recharge in 14 days), and a simple logistic regression |
| **Metric that reflects the decision** | **Precision and recall in the top 50,000** (precision@k), and expected **saved revenue** after offer cost, not accuracy |
| **Constraints** | Scoring must run in under 2 hours; explanations needed for the CRM team; personal-data rules |

> [!term] Prediction point (cut-off time)
> The moment at which a prediction is made. **Every feature must use only data available at that moment**, and the target is defined over a window **after** it. Getting this wrong is the single most common source of leakage ([[DS2.4]]).

> [!say]
> "Before modelling, I'd pin down the decision: who acts on the prediction, how often, and with what budget. That gives me the unit, the prediction time and the target window, for example the subscribers who'll become inactive for 30 days within the next 30 days, scored every Sunday. Then I'd choose a metric that matches the action, like precision in the top 50,000 we can afford to contact, and compare against the current rules as a baseline."

### Mapping goals to tasks 🟢

| Business question | ML task | Typical metric |
|---|---|---|
| Will this customer churn / default / click? | Binary classification | PR-AUC, recall at a precision, precision@k, calibrated probabilities |
| Which category (complaint type, product group)? | Multiclass classification | Macro F1, per-class recall |
| How much / how long (basket value, delivery ETA, house price)? | Regression | MAE (robust), RMSE (penalises big errors), MAPE (relative) |
| What will demand be next week? | Time-series forecasting | MAE, MAPE/WAPE, coverage of prediction intervals ([[DS6]]) |
| Which items to show this user? | Ranking / recommendation | NDCG, precision@k, hit rate |
| Which customers are alike? | Clustering | Business usefulness, silhouette |
| Which transactions are unusual? | Anomaly detection | Precision at an alert budget |
| Did the campaign **cause** more sales? | **Causal inference**, not prediction ([[DS5]]) | Effect with a confidence interval |

> [!mistake] Prediction when the question is causal
> "Which customers will churn?" is prediction. "Will a discount **stop** them churning?" is causal: the customers most likely to churn may not respond to offers at all, and some loyal customers would accept a discount they didn't need. The second question needs experiments or uplift modelling ([[DS5.6]]), not a churn score alone.

## DS1.4 Is ML even needed? 🟢 ⭐

Start with the simplest thing that could work:

- **A rule or a heuristic** ("no recharge in 14 days") may get most of the value, is transparent, and is a **baseline** you must beat anyway.
- **A SQL report** may answer the question without predicting anything.
- ML earns its keep when patterns are complex, data is plentiful, decisions repeat at scale, and the cost of building and maintaining a model is justified by the improvement.

> [!say]
> "I'd first check how well the existing rule does, because a model has to beat it by enough to justify the maintenance. If the gain is small, a better rule might be the right answer."

## DS1.5 Errors have costs 🟡 ⭐

Accuracy treats all errors as equal; businesses don't.

| | Actually churns | Actually stays |
|---|---|---|
| **Predicted churn** (gets an offer) | True positive: offer cost, maybe saved revenue | **False positive**: wasted offer (discount given to someone who'd have stayed) |
| **Predicted stay** | **False negative**: lost customer's future revenue | True negative: nothing |

With costs and benefits per cell, you choose the **threshold** (or the number of customers to contact) that **maximises expected profit**, not the one that maximises F1 ([[DS4.4]]). Your *AI Journey* Part 8 works through threshold choice from costs.

## DS1.6 Worked framings to practise 🟡 ⭐

**Credit default (a bank or BNPL fintech):** decision: approve, decline or set a limit at application time; target: 90+ days past due within 12 months of origination; features: only data available at application (bureau data such as Egypt's credit bureau (i-Score), application form, past relationship); metric: AUC and KS for ranking, calibration for pricing, approval rate vs bad rate trade-off; constraints: **explainability** and regulatory requirements, fairness, **reject inference** (you never see outcomes for declined applicants).

**Demand forecasting (groceries or delivery):** decision: how much stock to order or how many couriers to schedule per zone and hour; target: units sold per product per store per day for the next 14 days; features: lags, calendar (Ramadan, Eid, weekends), promotions, prices, weather; metric: WAPE at the level decisions are made, plus stock-out and waste costs; baselines: seasonal naive ([[DS6]]).

**Fraud detection (payments):** decision: block, challenge (OTP) or allow, in milliseconds; target: confirmed fraud (labels arrive **weeks later** via chargebacks); extreme imbalance; metric: recall at an alert budget, precision of blocks, money saved; constraints: latency, adversaries adapting, feedback loops (blocked transactions never get a label).

**Telecom next-best offer:** decision: which bundle to offer each subscriber; framing as a ranking or a contextual-bandit problem (your *AI Journey* Part 24); success measured by **incremental** revenue in a holdout experiment.

## DS1.7 Responsible data science 🟡

- **Personal data:** Egypt's **Personal Data Protection Law (No. 151 of 2020)** regulates collecting and processing personal data; banks also follow **Central Bank of Egypt** rules; for EU customers, the GDPR and the EU AI Act (high-risk uses such as credit scoring carry obligations). Minimise data, restrict access, and document purposes.
- **Fairness:** a model can discriminate through proxies (location for income, name for gender). Check performance and outcomes across groups; remove or constrain problematic features; document decisions.
- **Explainability:** credit, insurance and HR decisions often need reasons per decision (SHAP-style explanations, reason codes).
- **Feedback loops:** a model that decides who gets loans only sees outcomes for approved people; a fraud model shapes the fraud it later sees.

## DS1.8 Answering a DS case question 🟢 ⭐

A structure that works for "build a model to X" in 20–30 minutes:

1. **Goal and decision:** who uses the output, how, how often, with what budget.
2. **Framing:** unit, prediction time, target and its window, the ML task.
3. **Data:** sources, labels, availability at prediction time, quality risks, leakage risks.
4. **Baseline and approach:** the current rule; a simple model; then gradient boosting ([[DS3]]).
5. **Evaluation:** a time-based split; metrics matching the decision; a business metric; error analysis ([[DS4]]).
6. **Deployment:** batch or real time; how the decision is made from scores ([[DS8]]).
7. **Measuring impact:** an experiment with a holdout, not just offline metrics.
8. **Risks and monitoring:** drift, fairness, feedback loops, label delay.

> [!story]
> Your road-accident capstone is a framing story: the target was accident severity, the classes were heavily imbalanced ("slight" dominated), so you chose F1-macro over accuracy and compared against a dummy baseline. Be ready to add what you'd change if it were a real deployment: who would use the prediction (emergency dispatch? road-safety planning?), and therefore which errors matter most.

> [!lab] Frame three problems on one page each
> Write a one-page framing (decision, unit, prediction time, target window, task, baseline, metric, data, risks) for: telecom churn, BNPL credit default, and FinSight's "which invoices will be paid late?". The third one is yours: it would make a strong new feature and portfolio project.

## DS1.9 Interview drill 🟢 ⭐

| Question | Strong short answer |
|---|---|
| How would you approach a churn model? | Start from the retention decision (who acts, budget, cadence), define the target window after a prediction time, use only past data, beat the current rule, evaluate on the contactable top-k with business value, then test the impact with a holdout. |
| What is the prediction point? | The moment a prediction is made; features must only use data available then. |
| How do you define a churn target? | A precise inactivity or cancellation rule, measured in a window after the prediction time. |
| What's your baseline? | The current rule or a trivial model (majority class, last value), which the model must beat meaningfully. |
| Why not accuracy? | With imbalance, a do-nothing model looks accurate; choose metrics matching the decision and costs. |
| Prediction vs causal question? | Who will churn vs whether an action changes the outcome; the latter needs experiments or uplift modelling. |
| When would you not use ML? | When a rule performs nearly as well, data is scarce, or the decision is rare. |
| How do you pick a threshold? | From the costs and benefits of each error type, or the action budget (top-k), not a default 0.5. |
| What is CRISP-DM? | A six-phase iterative life cycle: business understanding, data understanding, preparation, modelling, evaluation, deployment. |
| What makes credit scoring special? | Explainability and regulation, fairness, calibration, and reject inference. |
| How do you prove a model created value? | An experiment with a holdout group, measuring the business outcome. |

## Key takeaways

> [!check]
> - Frame before you model: decision, unit, prediction time, target window, task.
> - Features may only use the past; targets live in a window after the prediction point.
> - Beat a simple baseline, and pick metrics that reflect the action and the costs of errors.
> - Distinguish prediction from causal questions.
> - Value is proven by an experiment, not by an offline score.

## Sources

- Pete Chapman et al., *CRISP-DM 1.0: Step-by-step data mining guide* (1999); IBM's [CRISP-DM overview](https://www.ibm.com/docs/en/spss-modeler/saas?topic=dm-crisp-help-overview).
- Aurélien Géron, *Hands-On Machine Learning with Scikit-Learn and PyTorch* (O'Reilly, 2025), chapter 2 (framing an end-to-end project), the PDF in your AI Journey folder.
- Chip Huyen, *Designing Machine Learning Systems* (O'Reilly, 2022), chapters 1–2 and 4 (framing, labels).
- Foster Provost and Tom Fawcett, *Data Science for Business* (O'Reilly, 2013): expected value framing and costs of errors.
- Egypt's Personal Data Protection Law No. 151 of 2020; European Commission, [AI Act overview](https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai).
- Your *AI Journey* Parts 6, 8, 13 and 16.
