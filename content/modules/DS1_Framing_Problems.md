# Framing Data-Science Problems — From a Business Goal to a Well-Posed Prediction

The most common reason data-science projects fail isn't a weak model. It's solving the wrong problem: a target that leaks the answer, a prediction made when nobody can act on it, an accuracy metric that ignores what errors cost. Interviewers know this, so DS case rounds start with framing: "we want to reduce churn. How would you approach it?". Your *AI Journey* course (Parts 6–13 and the e& interview hub in Part 16) covers the modelling depth; this track focuses on what turns modelling into data science: framing, features, evaluation, causality and production.

> [!focus]
> **Entry must:** translate a business goal into an ML task; define the target, the unit and the prediction time; propose a baseline; choose an evaluation metric that reflects the decision; say when ML isn't needed.
> **Mid adds:** point-in-time correctness, label windows, costs of errors and decision thresholds, what can go wrong after deployment, fairness and regulation, structuring a full DS case answer.
> **Most asked:** *How would you build a churn model?* · *How do you define the target?* · *What's your baseline?* · *Which metric and why?* · *How would the business use the predictions?* · *Do we even need ML here?*
> **Time budget:** 2.5 hours.

## DS1.0 Foundations: what "learning from data" means 🟢

A machine-learning model is a function that maps **features** (what you know about a case: tenure, days since last recharge, monthly spend) to a **prediction** (will this subscriber churn?). Instead of writing the rules by hand, you **train** it on past examples whose answer, the **label**, is known:

1. The model predicts for the training examples.
2. A **loss function** measures how wrong those predictions are.
3. An optimiser adjusts the model's **parameters** to reduce the loss, and repeats.

What matters isn't how well it fits the examples it learned from but how well it **generalises** to new cases, which is why a model is always judged on data it never saw ([[DS4]]).

<figure class="dia anim"><svg viewBox="0 0 720 248" role="img" aria-label="Animation: training compares the model's predictions on labelled examples with the labels, measures the loss and adjusts the parameters; the trained model then predicts for a new case">
<rect class="sN" x="14" y="30" width="54" height="22" rx="0"/><text class="sT" x="41" y="46" text-anchor="middle">tenure</text>
<rect class="sN" x="68" y="30" width="54" height="22" rx="0"/><text class="sT" x="95" y="46" text-anchor="middle">recharge</text>
<rect class="sN" x="122" y="30" width="54" height="22" rx="0"/><text class="sT" x="149" y="46" text-anchor="middle">spend</text>
<rect class="sN" x="176" y="30" width="54" height="22" rx="0"/><text class="sGt" x="203" y="46" text-anchor="middle">label</text>
<rect class="sB" x="14" y="52" width="54" height="22" rx="0" opacity=".6"/><text class="sC" x="41" y="67" text-anchor="middle">24</text>
<rect class="sB" x="68" y="52" width="54" height="22" rx="0" opacity=".6"/><text class="sC" x="95" y="67" text-anchor="middle">3 d</text>
<rect class="sB" x="122" y="52" width="54" height="22" rx="0" opacity=".6"/><text class="sC" x="149" y="67" text-anchor="middle">210</text>
<rect class="sG" x="176" y="52" width="54" height="22" rx="0" opacity=".6"/><text class="sC" x="203" y="67" text-anchor="middle">0</text>
<rect class="sB" x="14" y="74" width="54" height="22" rx="0" opacity=".6"/><text class="sC" x="41" y="89" text-anchor="middle">2</text>
<rect class="sB" x="68" y="74" width="54" height="22" rx="0" opacity=".6"/><text class="sC" x="95" y="89" text-anchor="middle">19 d</text>
<rect class="sB" x="122" y="74" width="54" height="22" rx="0" opacity=".6"/><text class="sC" x="149" y="89" text-anchor="middle">40</text>
<rect class="sG" x="176" y="74" width="54" height="22" rx="0" opacity=".6"/><text class="sC" x="203" y="89" text-anchor="middle">1</text>
<rect class="sB" x="14" y="96" width="54" height="22" rx="0" opacity=".6"/><text class="sC" x="41" y="111" text-anchor="middle">11</text>
<rect class="sB" x="68" y="96" width="54" height="22" rx="0" opacity=".6"/><text class="sC" x="95" y="111" text-anchor="middle">6 d</text>
<rect class="sB" x="122" y="96" width="54" height="22" rx="0" opacity=".6"/><text class="sC" x="149" y="111" text-anchor="middle">95</text>
<rect class="sG" x="176" y="96" width="54" height="22" rx="0" opacity=".6"/><text class="sC" x="203" y="111" text-anchor="middle">0</text>
<rect class="sB" x="14" y="118" width="54" height="22" rx="0" opacity=".6"/><text class="sC" x="41" y="133" text-anchor="middle">5</text>
<rect class="sB" x="68" y="118" width="54" height="22" rx="0" opacity=".6"/><text class="sC" x="95" y="133" text-anchor="middle">25 d</text>
<rect class="sB" x="122" y="118" width="54" height="22" rx="0" opacity=".6"/><text class="sC" x="149" y="133" text-anchor="middle">30</text>
<rect class="sG" x="176" y="118" width="54" height="22" rx="0" opacity=".6"/><text class="sC" x="203" y="133" text-anchor="middle">1</text>
<text class="sC" x="122" y="162" text-anchor="middle">past examples with known answers</text>
<line class="sL" x1="230" y1="85" x2="276" y2="85" marker-end="url(#ah)"/><rect class="sV" x="280" y="55" width="130" height="60" rx="8"/><text class="sT" x="345" y="83" text-anchor="middle">model</text><text class="sC" x="345" y="99" text-anchor="middle">parameters θ</text>
<line class="sL" x1="410" y1="85" x2="456" y2="85" marker-end="url(#ah)"/>
<rect class="sA" x="460" y="52" width="70" height="88" rx="6"/><text class="sC" x="495" y="46" text-anchor="middle">predicted</text>
<text class="sC" x="495" y="67" text-anchor="middle">0.2</text>
<text class="sC" x="495" y="89" text-anchor="middle">0.6</text>
<text class="sC" x="495" y="111" text-anchor="middle">0.3</text>
<text class="sC" x="495" y="133" text-anchor="middle">0.7</text>
<line class="sL" x1="530" y1="85" x2="576" y2="85" marker-end="url(#ah)"/><rect class="sR" x="580" y="55" width="126" height="60" rx="8"/><text class="sT" x="643" y="83" text-anchor="middle">loss</text><text class="sC" x="643" y="99" text-anchor="middle">how wrong?</text>
<path class="sLw" d="M643 55 V22 H345 V53" fill="none" marker-end="url(#ahw)"/><text class="sWt" x="494" y="16" text-anchor="middle">adjust θ to reduce the loss, repeat</text>
<line class="sD" x1="14" y1="182" x2="706" y2="182"/>
<rect class="sB" x="14" y="198" width="216" height="34" rx="6"/><text class="sC" x="122" y="220" text-anchor="middle">new subscriber: 3 · 21 d · 35</text>
<line class="sL" x1="230" y1="215" x2="276" y2="215" marker-end="url(#ah)"/><rect class="sV" x="280" y="192" width="130" height="46" rx="8"/><text class="sT" x="345" y="220" text-anchor="middle">trained model</text><line class="sL" x1="410" y1="215" x2="456" y2="215" marker-end="url(#ah)"/>
<rect class="sG" x="460" y="192" width="246" height="46" rx="8"/><text class="sT" x="583" y="213" text-anchor="middle">churn risk 0.81</text><text class="sC" x="583" y="229" text-anchor="middle">a prediction for an unseen case</text>
<circle class="sPw" r="5"><animateMotion dur="4s" repeatCount="indefinite" path="M230 85 H576 M643 55 V22 H345 V53"/></circle>
</svg><figcaption>Training fits parameters on examples with known labels; the payoff is the prediction for cases it has never seen.</figcaption></figure>

- **Supervised** learning has labels (churned or not, the order value): classification and regression.
- **Unsupervised** learning finds structure without labels: clusters, anomalies.

Framing, the subject of this module, is making each piece (the features, the label, the moment of prediction, the measure of "wrong") match the real decision.

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

<figure class="dia anim"><svg viewBox="0 0 720 270" role="img" aria-label="Animation: the CRISP-DM cycle of business understanding, data understanding, data preparation, modelling, evaluation and deployment, with evaluation often leading back to business understanding">
<ellipse class="sLm" cx="360" cy="136" rx="250" ry="96" fill="none" stroke-dasharray="6 5"/>
<rect class="sB" x="272" y="22" width="176" height="36" rx="8"/><text class="sT" x="360" y="45" text-anchor="middle">1 business understanding</text>
<rect class="sB" x="488.506" y="70" width="176" height="36" rx="8"/><text class="sT" x="576.506" y="93" text-anchor="middle">2 data understanding</text>
<rect class="sA" x="488.506" y="166" width="176" height="36" rx="8"/><text class="sT" x="576.506" y="189" text-anchor="middle">3 data preparation</text>
<rect class="sV" x="272" y="214" width="176" height="36" rx="8"/><text class="sT" x="360" y="237" text-anchor="middle">4 modelling</text>
<rect class="sW" x="55.4936" y="166" width="176" height="36" rx="8"/><text class="sT" x="143.494" y="189" text-anchor="middle">5 evaluation</text>
<rect class="sG" x="55.4936" y="70" width="176" height="36" rx="8"/><text class="sT" x="143.494" y="93" text-anchor="middle">6 deployment</text>
<text class="sM" x="360" y="132" text-anchor="middle">data</text><text class="sC" x="360" y="150" text-anchor="middle">at the centre of every step</text>
<path class="sLr" d="M203 166 Q 300 96 320 60" fill="none" stroke-dasharray="5 4" marker-end="url(#ahr)"/>
<text class="sRt" x="300" y="190" text-anchor="middle">often: back to step 1</text>
<circle class="sP" r="7"><animateMotion dur="8s" repeatCount="indefinite" path="M360 40 A250 96 0 0 1 360 232 A250 96 0 0 1 360 40"/></circle>
</svg><figcaption>CRISP-DM is a loop, not a line. Evaluation regularly reveals that the question or the data needs changing.</figcaption></figure>

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

<figure class="dia steps"><svg viewBox="0 0 720 222" role="img" aria-label="A prediction-point timeline: features come from the 90 days before the cut-off, the label from the 30 days after; a feature computed later leaks the future; training rows come from many past cut-offs">
<line class="sLm" x1="80" y1="70" x2="666" y2="70" marker-end="url(#ahm)"/>
<text class="sC" x="176" y="92" text-anchor="middle">−90 d</text>
<text class="sC" x="368" y="92" text-anchor="middle">−30 d</text>
<text class="sC" x="464" y="92" text-anchor="middle">Sunday 00:00</text>
<text class="sC" x="560" y="92" text-anchor="middle">+30 d</text>
<g data-s="1"><line class="sLr" x1="464.0" y1="22" x2="464.0" y2="80" stroke-width="2.5"/><text class="sRt" x="464" y="16" text-anchor="middle">prediction point</text></g>
<g data-s="2"><rect class="sA" x="176" y="46" width="286" height="18" rx="4"/><text class="sC" x="320" y="40" text-anchor="middle">features: only data before the cut-off</text></g>
<g data-s="3"><rect class="sG" x="466" y="46" width="96" height="18" rx="4"/><text class="sGt" x="516" y="40" text-anchor="middle">label window</text></g>
<g data-s="4-4"><rect class="sR" x="441.6" y="104" width="44.8" height="18" rx="4"/><text class="sRt" x="433.6" y="117" text-anchor="end">✗ leak: support calls counted to month end</text></g>
<g data-s="5"><text class="sC" x="70" y="154" text-anchor="end">cut-off 1</text><rect class="sA" x="131.2" y="140" width="288" height="18" rx="3" opacity=".7"/><rect class="sG" x="421.2" y="140" width="96" height="18" rx="3" opacity=".7"/></g>
<g data-s="5"><text class="sC" x="70" y="180" text-anchor="end">cut-off 2</text><rect class="sA" x="153.6" y="166" width="288" height="18" rx="3" opacity=".7"/><rect class="sG" x="443.6" y="166" width="96" height="18" rx="3" opacity=".7"/></g>
<g data-s="5"><text class="sC" x="70" y="206" text-anchor="end">cut-off 3</text><rect class="sA" x="176" y="192" width="288" height="18" rx="3" opacity=".7"/><rect class="sG" x="466" y="192" width="96" height="18" rx="3" opacity=".7"/></g>
</svg><ol class="dia-steps">
<li>Pick the moment the prediction is made: every Sunday at midnight, because that's when the CRM team plans the week.</li>
<li>Features summarise only what was known at that moment: recharges, calls and data usage in the previous 90 days.</li>
<li>The label lives entirely after the cut-off: did the subscriber become inactive in the next 30 days?</li>
<li>The classic leak: a feature recomputed later (here, support calls counted up to month end) quietly includes days after the cut-off. The model looks brilliant offline and fails in production.</li>
<li>The training set repeats this at many past cut-offs: one row per subscriber per Sunday, each with its own feature and label windows.</li>
</ol><figcaption>Point-in-time correctness: draw this timeline before writing any feature code.</figcaption></figure>

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

<figure class="dia"><svg viewBox="0 0 720 262" role="img" aria-label="A ladder of approaches from a rule, to a SQL segment, to logistic regression, to gradient boosting, with rising accuracy and rising cost">
<rect class="sB" x="14" y="170" width="170" height="50" rx="8"/><text class="sT" x="99" y="193" text-anchor="middle">a rule</text><text class="sC" x="99" y="209" text-anchor="middle">no recharge in 14 days</text>
<rect class="sB" x="164" y="126" width="170" height="50" rx="8"/><text class="sT" x="249" y="149" text-anchor="middle">a SQL segment</text><text class="sS" x="249" y="165" text-anchor="middle">or a report, no prediction</text>
<rect class="sA" x="314" y="82" width="170" height="50" rx="8"/><text class="sT" x="399" y="105" text-anchor="middle">logistic regression</text><text class="sC" x="399" y="121" text-anchor="middle">simple, explainable</text>
<rect class="sV" x="464" y="38" width="170" height="50" rx="8"/><text class="sT" x="549" y="61" text-anchor="middle">gradient boosting</text><text class="sC" x="549" y="77" text-anchor="middle">usually best on tables</text>
<line class="sLm" x1="40" y1="236" x2="650" y2="236" marker-end="url(#ahm)"/><text class="sC" x="345" y="252" text-anchor="middle">more accuracy possible; more cost to build, explain and maintain</text>
<text class="sGt" x="560" y="214" text-anchor="middle">climb only while each step beats</text><text class="sGt" x="560" y="232" text-anchor="middle">the one below by enough to pay</text>
</svg><figcaption>The rule at the bottom is also your baseline. A model that can't beat it clearly isn't worth running.</figcaption></figure>

> [!say]
> "I'd first check how well the existing rule does, because a model has to beat it by enough to justify the maintenance. If the gain is small, a better rule might be the right answer."

## DS1.5 Errors have costs 🟡 ⭐

Accuracy treats all errors as equal; businesses don't.

| | Actually churns | Actually stays |
|---|---|---|
| **Predicted churn** (gets an offer) | True positive: offer cost, maybe saved revenue | **False positive**: wasted offer (discount given to someone who'd have stayed) |
| **Predicted stay** | **False negative**: lost customer's future revenue | True negative: nothing |

With costs and benefits per cell, you choose the **threshold** (or the number of customers to contact) that **maximises expected profit**, not the one that maximises F1 ([[DS4.4]]). Your *AI Journey* Part 8 works through threshold choice from costs.

<figure class="dia"><svg viewBox="0 0 720 250" role="img" aria-label="A cost matrix for a churn offer and the expected profit curve as more customers are contacted in order of risk, peaking near 60 thousand with a budget of 50 thousand">
<text class="sM" x="160" y="22" text-anchor="middle">per customer (EGP)</text>
<text class="sC" x="110" y="46" text-anchor="middle">churns</text><text class="sC" x="220" y="46" text-anchor="middle">stays</text>
<text class="sC" x="46" y="80" text-anchor="end">contact</text><text class="sC" x="46" y="134" text-anchor="end">skip</text>
<rect class="sG" x="56" y="56" width="106" height="48" rx="6"/><text class="sC" x="109" y="78" text-anchor="middle">offer, saved</text><text class="sT" x="109" y="95" text-anchor="middle">+350</text>
<rect class="sW" x="166" y="56" width="106" height="48" rx="6"/><text class="sC" x="219" y="78" text-anchor="middle">wasted offer</text><text class="sT" x="219" y="95" text-anchor="middle">−50</text>
<rect class="sR" x="56" y="110" width="106" height="48" rx="6"/><text class="sC" x="109" y="132" text-anchor="middle">lost customer</text><text class="sT" x="109" y="149" text-anchor="middle">−400</text>
<rect class="sN" x="166" y="110" width="106" height="48" rx="6"/><text class="sC" x="219" y="132" text-anchor="middle">nothing</text><text class="sT" x="219" y="149" text-anchor="middle">0</text>
<line class="sLm" x1="330" y1="200" x2="700" y2="200" marker-end="url(#ahm)"/><line class="sLm" x1="330" y1="200" x2="330" y2="35" marker-end="url(#ahm)"/>
<polyline class="sL" points="330,200 354,152 378,114 402,88 426,70 450,59 474,55 498,57 522,64 570,86 618,114 690,167" fill="none" stroke-width="2.5"/>
<line class="sLw" x1="450" y1="200" x2="450" y2="42" stroke-dasharray="5 4"/><text class="sWt" x="456" y="186.8">budget: 50k offers</text>
<circle class="sPg" cx="474" cy="55" r="6"/><text class="sGt" x="484" y="46.8">best: about 60k</text>
<text class="sC" x="330" y="218" text-anchor="middle">0k</text>
<text class="sC" x="450" y="218" text-anchor="middle">50k</text>
<text class="sC" x="570" y="218" text-anchor="middle">100k</text>
<text class="sC" x="690" y="218" text-anchor="middle">150k</text>
<text class="sC" x="510" y="238" text-anchor="middle">customers contacted, highest risk first</text><text class="sC" x="336" y="26">expected profit</text>
</svg><figcaption>Put money in the four cells, then pick how many to contact from the profit curve, not from a default 0.5 threshold.</figcaption></figure>

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
