# Part 16 — Interview Preparation: Data Scientist at e& (Etisalat) Egypt

<!-- nav -->
> [!example] 🧭 Step 26 of 26 · Stage 7 of 7: Interview & beyond
> ← [Part 14 · Gaps & next steps](14_Gaps_and_Where_To_Go_Next.md) · 🏁 End of the path · [Course map](00_START_HERE.md)
<!-- /nav -->

**Goal:** pass an entry-to-mid-level data scientist interview at a multinational telecom such as **e& Egypt** (formerly Etisalat Misr; the group rebranded from Etisalat to *e&*) or its business arm **e& enterprise**. The same preparation transfers to Vodafone Egypt, Orange Egypt, WE (Telecom Egypt) and regional fintechs.

**How to use this part:** it is the hub. Each section points back to the part of the course that holds the depth. Sections 16.1–16.4 give you the *domain* (the thing most candidates lack). Sections 16.5–16.8 give you *answer frameworks*. Sections 16.9–16.12 give you *practice material and a plan*.

> [!warning] ⚠️ Note
> Company facts change: org structure, products, the interview process, the tech stack. Before the interview, check the current job description, e&'s careers page, the company's latest annual report or press releases, and people's accounts of their own interviews (LinkedIn, Glassdoor). Treat anything company-specific here as a starting hypothesis to verify, not as fact.

<!-- interview-focus -->

> [!tip] 🎯 Interview focus
> **Why it matters:** This is the hub. It turns the course into interview answers for a telecom such as e& Egypt.
>
> | Level | What you should be able to do |
> |---|---|
> | 🟢 **Entry** | Telecom vocabulary and KPIs (ARPU, churn, MOU…), the churn case end to end, the case framework, the pandas round, STAR stories. |
> | 🟡 **Mid** | All 11 use cases with modelling choices, forecasting, deployment and monitoring, a full mock case in 6 minutes. |
> | 🔴 **Senior** | Portfolio-level thinking: prioritising use cases by value, build vs buy, governance (PDPL), leading stakeholders. |
>
> **⭐ Most-asked:** *How would you predict churn?* · *Design a next-best-offer system.* · *How would you forecast network traffic?* · *How do you deploy and monitor a model?* · *Tell me about a time you…*
>
> **⏱ Time:** the whole last week  ·  **Short on time?** Read §16.0, §16.3 (churn, NBO), §16.5, §16.9, §16.12.

**Legend:** 🟢 Entry (0–2 yrs) · 🟡 Mid (2–5 yrs) · 🔴 Senior / specialist · ⭐ frequently asked · 📖 Géron, *Hands-On ML with Scikit-Learn and PyTorch* (2025) pages

> [!abstract]- 🗺️ Section map — level and book pages
>
> | § | Section | Level | 📖 Book |
> |---|---|:---:|---|
> | 16.0 | The interview loop — and what each level is tested on | 🟢 ⭐ | — |
> | 16.1 | What the job usually is | 🟢 | — |
> | 16.2 | Telecom domain primer — the vocabulary | 🟢 ⭐ | — |
> | 16.3 | The telecom use-case catalogue — how to model each | 🟢 ⭐ | — |
> | 16.4 | Time-series essentials (for forecasting questions) | 🟡 ⭐ | Ch. 13 · pp. 490–511 |
> | 16.5 | The case-study answer framework (use this every time) | 🟢 ⭐ | — |
> | 16.6 | Productionisation — your differentiator | 🟡 ⭐ | Ch. 2 · pp. 100–103 |
> | 16.7 | Python and pandas coding round — patterns to have in your fingers | 🟢 ⭐ | — |
> | 16.8 | Behavioural round — STAR stories from your own work | 🟢 ⭐ | — |
> | 16.9 | Master question bank — rapid-fire, with pointers (90 questions) | 🟢 ⭐ | — |
> | 16.10 | Mock interview — five full questions with model answers | 🟢 ⭐ | — |
> | 16.11 | A 4-week study plan using this course | 🟢 | — |
> | 16.12 | The one-page cheat sheet — the night before | 🟢 ⭐ | — |
>

---

## 16.0 The interview loop — and what each level is tested on 🟢 ⭐

![Interview loop](figures/fig16_interview_loop.png)
*A typical multinational DS loop. The order and number of rounds vary by team; some merge the test and Technical 1.*

### What each round looks for, by level

| Round | 🟢 Entry — they check you can… | 🟡 Mid — they also check… | 🔴 Senior — they also check… |
|---|---|---|---|
| **HR / recruiter** | explain why data science, why e&, and your project in 60 s | ownership of results | leadership, scope, why this role |
| **Online test** (Python, SQL, ML MCQ) | filter/group/join in pandas and SQL; basic ML definitions | window functions, clean code under time pressure | usually skipped |
| **Technical 1 — ML & stats** | bias–variance, CV, metrics, leakage, logistic/trees/RF, p-values, CLT | GBMs, thresholds from costs, calibration, A/B design and power | evaluation strategy, causal inference, trade-offs |
| **Technical 2 — case / take-home** | a clean notebook: EDA → pipeline → baseline → model → honest metric → 3 findings | a business framing, deployment and monitoring plan, uplift | system design: data, model, serving, cost, org |
| **Hiring manager + behavioural** | curiosity, communication, learning speed (STAR stories) | stakeholder management, handling ambiguity | influence, mentoring, prioritisation |

### The six things that fail most candidates (all levels)

| Failure | Fix | Where |
|---|---|---|
| Jumping to a model before framing the problem | Say the objective, decision, target, metric and baseline first | §16.5 |
| Using accuracy on imbalanced data | Confusion matrix, PR-AUC, cost-based threshold | Part 8 §8.12–8.15 |
| Leakage (random split on time data, fitting scalers on all data) | Pipelines + time-based validation | Part 4 §4.0, §4.5 |
| Can't explain their own project's numbers | Rehearse the 3-minute story with numbers | Part 13 quick-fire, §16.8 |
| Weak SQL window functions | Solve §12.6 P1–P13 twice | Part 12 |
| No business translation | End every answer with "so the business can…" | §16.5, Part 8 §8.15 |

### Self-assessment: are you ready for your target level?

| Tick when you can… | 🟢 | 🟡 |
|---|:---:|:---:|
| Explain bias–variance, CV and leakage with a telecom example | ✅ | ✅ |
| Write top-N-per-group and a MoM change in both SQL and pandas in < 10 min | ✅ | ✅ |
| Choose and justify a metric and threshold for churn and for fraud | ✅ | ✅ |
| Design an A/B test with a sample-size calculation | ⬜ basic | ✅ |
| Explain RF vs GBM and tune LightGBM with early stopping | ✅ | ✅ |
| Write a PyTorch training loop from memory | ⬜ concept | ✅ |
| Sketch a RAG system with evaluation and guardrails | ⬜ concept | ✅ |
| Describe deployment and monitoring (drift, retraining) | ⬜ concept | ✅ |
| Tell 5 STAR stories with numbers | ✅ | ✅ |

---

## 16.1 What the job usually is 🟢

A data scientist at a telecom operator typically sits in a **Data & AI / Analytics / Business Intelligence** function and serves:
- **Commercial / Marketing** (consumer B2C): churn, cross-sell/up-sell, next best offer, campaign targeting, pricing, segmentation.
- **Network / Technology:** traffic forecasting, capacity planning, anomaly detection, predictive maintenance, site selection, customer-experience scores from network KPIs.
- **Finance / Risk / Fraud:** revenue assurance, fraud management, credit scoring (device instalments, post-paid limits, mobile-wallet lending).
- **Customer care:** complaint classification, call-volume forecasting, sentiment and topic mining (Arabic text and speech).
- **Enterprise (B2B):** lead scoring, account churn, SLA-breach prediction, IoT analytics.

**Stack you will likely meet:** SQL on a large warehouse (Teradata, Oracle, Hive/Spark or a cloud warehouse), Python (pandas, scikit-learn, LightGBM/XGBoost, PySpark), BI tools (Power BI, Tableau, Qlik), Git, sometimes an ML platform (Azure ML, Databricks, SageMaker, or on-premises Cloudera/Hadoop). Big data is normal: tens of millions of subscribers and billions of usage records.

**What entry vs mid level means in interviews:**

| | Entry (0–2 yrs) | Mid (2–5 yrs) |
|---|---|---|
| Expectation | Correct fundamentals, clean SQL/pandas, can build and evaluate a model properly | Frames business problems, owns a model end to end, deploys, monitors, communicates to stakeholders |
| Probes | Definitions, metrics, overfitting, leakage, basic stats | Trade-offs, failure modes, experiment design, production issues, impact in money |
| Case study | "Build a churn model on this CSV" | "Reduce churn by X%: design the whole thing, including measurement" |

Your course plus this add-on targets the **top of entry, bottom of mid**. The capstone's "industrial" discipline (Part 13) and your software background (ASP.NET, Docker, APIs) are what push you toward mid.

---

## 16.2 Telecom domain primer — the vocabulary 🟢 ⭐

### Identifiers and systems

| Term | Meaning |
|---|---|
| **MSISDN** | The phone number: the subscriber-facing ID |
| **IMSI** | SIM identity (in the SIM card) |
| **IMEI** | Device (handset) identity. Frequent IMEI changes on one SIM can signal fraud or SIM-boxing |
| **CDR / xDR** | Call Detail Record: one row per call/SMS/data session (who, whom, when, duration, cell, bytes) |
| **BSS** | Business Support Systems: billing, CRM, order management, product catalogue |
| **OSS** | Operations Support Systems: network monitoring, fault and performance management |
| **RAN** | Radio Access Network: cell sites (towers), 2G/3G/4G/5G technology |
| **Cell / site / sector** | A site has several sectors (cells). Each cell has KPIs by the hour |
| **Pre-paid / post-paid** | Pay before (recharge/top-up, dominant in Egypt) / billed monthly (contract) |
| **Recharge / top-up** | Adding credit: cards, retail, e-payment (Fawry and similar), the app |
| **Bundle** | A package of minutes, data (GB) and SMS, often with validity (daily/weekly/monthly) |
| **On-net / off-net** | A call to the same operator / to another operator |
| **Interconnect** | Fees operators pay each other for off-net and international traffic. The target of bypass fraud |
| **MNP** | Mobile Number Portability: switching operator while keeping the number. An explicit churn event |
| **NTRA** | Egypt's National Telecom Regulatory Authority (regulates pricing, quality and data use) |

### Business KPIs — know the formulas

| KPI | Formula / meaning |
|---|---|
| **ARPU** | Average Revenue Per User = total revenue / average active subscribers (per month) |
| **AMPU** | Average Margin Per User (revenue minus direct costs) |
| **MOU** | Minutes Of Use per user per month |
| **Data usage per user** | GB/user/month: the main growth driver today |
| **Churn rate** | Subscribers lost in the period / subscribers at the start (monthly). Pre-paid churn is defined by *inactivity* (Part 12 P4) |
| **Gross adds / net adds** | New subscribers / new minus churned |
| **CLV** | Customer Lifetime Value ≈ monthly margin × expected lifetime (≈ margin / monthly churn, before discounting). With discounting: margin × r/(1 + d − r) |
| **CAC / SAC** | Customer (subscriber) acquisition cost |
| **NPS** | Net Promoter Score = % promoters (9–10) − % detractors (0–6) |
| **Market share / penetration** | Subscribers / market or population |
| **Take rate / conversion** | Accepted offers / offers made |
| **Blended vs segment ARPU** | Always ask which, because mix changes move blended ARPU |

### Network KPIs

| KPI | Meaning |
|---|---|
| **CSSR** | Call Setup Success Rate |
| **Drop call rate (DCR)** | Share of calls dropped abnormally |
| **Throughput** | Mbps delivered to users (DL/UL) |
| **Latency / jitter / packet loss** | Quality for data, video and gaming |
| **PRB utilisation** | Physical Resource Block usage: how "full" a 4G cell is. Drives capacity upgrades |
| **Availability** | % of time a cell or site is up |
| **Busy hour** | The hour of peak traffic. Capacity is planned for it, not for the average |

### Data sources and their traps

| Source | Grain | Traps |
|---|---|---|
| CDRs / xDRs | One event | Huge volumes; aggregate in SQL/Spark; timezone and partition pitfalls |
| Recharges | One transaction | Promotions distort the patterns; multi-SIM users |
| Billing | Customer × month | Corrections and adjustments arrive late |
| CRM | Customer attributes | Stale demographics; free-text notes |
| Complaints / care | Ticket | Arabic and Franco-Arabic text; category labels are inconsistent across agents |
| Network KPIs | Cell × hour | Missing hours during outages (the most interesting hours!) |
| App / web logs | Event | Bots, logged-out users, tracking changes |

**Privacy and regulation:** subscriber data is sensitive (location, calls, identity). Expect data-minimisation rules, anonymised MSISDNs in analytics environments, and regulatory limits on use. Mentioning **privacy-by-design** (aggregate where you can, pseudonymise IDs, restrict location granularity, use fairness checks) shows maturity.

---

## 16.3 The telecom use-case catalogue — how to model each 🟢 ⭐

> [!quote] 💬 Say it in the interview
> “For every use case I state: the decision, the target and windows, the features, the model, the metric tied to value, and how we'd measure impact with a control group.”

For every use case: **problem framing → target → key features → model → metric → how it creates value.** This is the structure interviewers want to hear.

### 1. Churn prediction (the #1 question)

- **Framing:** binary classification. *Will this subscriber churn in the next N days?*
- **Target:** post-paid: contract termination or MNP port-out. Pre-paid: **inactivity for X days** (no recharge and no usage). Discuss the choice of X.
- **Snapshot design:** features up to date T, label in (T, T + horizon], optionally with a gap between them (Part 12 P13).
- **Features:** tenure; ARPU level and **trend**; data/voice usage trend (last 30 days vs the previous 60); recharge frequency and recency; **days to contract end**; complaints and care calls (count, recency, resolved or not); network experience (dropped calls, throughput at home and work cells); bundle expiry; handset age and brand; price-plan changes; competitor-promotion periods; **social features** (share of on-net calls to already-churned contacts, "churn contagion").
- **Model:** logistic regression baseline → **LightGBM / HistGradientBoosting** (Part 8B). Calibrate (Part 8 §8.12.7).
- **Metrics:** PR-AUC, **lift and precision in the top decile/k**, recall at budget, calibration (Part 8 §8.14).
- **Value:** retention campaign ROI (Part 8 §8.15). Better still, **uplift modelling** (target the persuadables) validated by an A/B test (Part 15 §15.7).
- **Traps:** leakage (e.g. a "deactivation reason" or "port-out request" feature), random splits on snapshot data, and class imbalance that distorts probabilities.

### 2. Next Best Offer / propensity to buy

- **Framing:** multiple binary propensity models (one per offer), or a multiclass or ranking model, or a recommender.
- **Features:** usage mix (data-heavy? social apps? roaming?), recent bundle purchases, price sensitivity (response to past discounts), segment, device capability (5G?).
- **Decision layer:** expected value = P(accept) × margin − cost, subject to contact-policy rules (max N messages a week, no offers during an open complaint).
- **Measure:** hold-out control group, incremental revenue.
- **Going further:** contextual bandits (Thompson sampling / LinUCB) learn which offer works for whom while serving it, and off-policy evaluation estimates a new policy from logs before launch. → Part 24 §24.12

### 3. Customer segmentation

- **Framing:** clustering (Part 9). K-Means on scaled behavioural features, GMM for soft membership, or rules plus RFM (Recency, Frequency, Monetary) for simplicity.
- **Deliverable:** named, profiled, actionable segments (Part 9 §9.17), stable month to month.
- **Validate:** silhouette, stability (ARI across bootstrap samples), business separation on KPIs *not* used for clustering (churn, campaign response).

### 4. CLV prediction

- **Framing:** regression of future 12-month margin, or a probabilistic model (BG/NBD + Gamma-Gamma for non-contract settings, via the `lifetimes` / `pymc-marketing` libraries), or churn probability × ARPU projection.
- **Use:** acquisition budget per segment, retention priority, service tier.
- **Metric:** RMSE/MAE on log-margin; decile calibration (predicted vs actual CLV per decile).

### 5. Credit scoring (device instalments, post-paid limits, mobile-wallet micro-loans)

- **Framing:** binary classification. *Default (e.g. 90+ days past due) within 12 months?*
- **Features:** telecom behaviour is valuable for "thin-file" customers without bank history: tenure, recharge regularity, bill payment history, ARPU stability, number stability (same SIM for years), social or network stability.
- **Model:** logistic regression scorecards (WoE binning, interpretable, regulator-friendly) or GBMs with **monotonic constraints** + SHAP (Part 8B §8B.6).
- **Metrics:** AUC/**Gini** (= 2·AUC − 1), **KS**, calibration, PSI for stability over time.
- **Fairness and regulation:** avoid prohibited attributes; test for disparate impact; document everything.

### 6. Fraud detection

- **Types:** SIM-box / interconnect bypass, IRSF (International Revenue Share Fraud), Wangiri (one-ring callbacks to premium numbers), subscription/identity fraud, dealer commission fraud, mobile-wallet fraud.
- **Framing:** few labels, adversaries adapt, patterns shift. Combine **rules + anomaly detection (Isolation Forest, LOF, GMM density; Part 9 §9.20) + supervised models** on analyst-confirmed cases + graph features (call-graph communities, many-to-one patterns).
- **SIM-box signature:** very high outgoing volume, almost no incoming, no SMS or data, a fixed location/cell, many distinct destinations, short gaps between calls, SIMs activated in batches.
- **Metric:** precision at the top of the review queue (analyst capacity), time to detection, money saved. Blocking needs very high precision.
- **Operations:** active learning with analysts (Part 9 §9.17) and frequent retraining.

### 7. Network anomaly detection and predictive maintenance

- **Framing:** time-series anomaly detection per cell (the residual from a seasonal baseline, or Isolation Forest on KPI vectors), or classification of *"will this site fail / alarm in the next 24h?"* from alarm history, weather, power and hardware age.
- **Challenges:** seasonality by hour-of-week, many correlated alarms (root-cause grouping), label scarcity, and the cost of false truck rolls.

### 8. Traffic and capacity forecasting

- **Framing:** time-series forecasting per cell, region or the network, for busy-hour traffic and PRB utilisation 3–12 months ahead to plan upgrades.
- **Models:** seasonal naive baseline → ETS/ARIMA/Prophet → **gradient boosting on lag/rolling/calendar features** (the global-model approach) → foundation models (TimeGPT, Chronos). Your FinSight experience applies directly here. See §16.4.
- **Also:** call-centre volume forecasting (staffing), revenue forecasting.

### 9. Customer-care text analytics (Arabic)

- **Tasks:** complaint classification (routing), sentiment, topic discovery, intent detection for chatbots, speech-to-text for call analytics.
- **Egypt-specific difficulty:** **Egyptian Arabic dialect**, **Franco-Arabic / Arabizi** ("3ayez a8ayar el bundle"), code-switching with English, spelling variation, diacritics, and letter normalisation (أ/إ/آ → ا, ى → ي, ة → ه).
- **Approach:** classical baseline (TF-IDF with char n-grams, robust to spelling variation; Part 10) + logistic regression/SVM → fine-tuned Arabic transformers (**AraBERT, MARBERT, CAMeLBERT**; multilingual XLM-R) → LLM-based classification and extraction with few-shot prompts (mind cost, latency and data privacy).
- **Tools:** CAMeL Tools (Arabic morphology), `pyarabic`, Hugging Face.
- Your SER thesis (HuBERT) is speech-side experience you can connect to call analytics.
- **Deeper:** tokenizers and fine-tuning → Part 20; LLMs, RAG, agents and guardrails for care chatbots → Part 21.

### 10. Geo-analytics and site selection

- Where to build new sites or shops: population density, traffic demand, coverage-gap complaints, competitor coverage, footfall. Clustering hotspots (HDBSCAN; Part 13) plus scoring. Géron's `ClusterSimilarity` RBF geo-features (Part 4 §4.10.11) apply.

### 11. B2B / e& enterprise

- Lead scoring (propensity to buy cloud, IoT, cybersecurity or connectivity), account churn (renewals), SLA-breach prediction for enterprise circuits, IoT telemetry anomaly detection. Smaller *n* per account, so blend ML with account-manager knowledge.

---

## 16.4 Time-series essentials (for forecasting questions) 🟡 ⭐

> [!info] 📖 Géron Ch. 13 · “Forecasting a Time Series” → “Forecasting Several Time Steps Ahead” · pp. 490–511

Part 14 flagged time series as a course gap. The minimum you need for interviews:

**Components:** trend + seasonality (daily, weekly, yearly; Ramadan moves ~11 days earlier each Gregorian year) + holidays/events + noise.

**Stationarity:** constant mean and variance over time. Most classical models (ARIMA) assume it. Test with **ADF** (null hypothesis = non-stationary) or **KPSS**. Fix with differencing or log transforms.

**ACF / PACF:** autocorrelation plots used to pick AR (p) and MA (q) orders. Seasonal spikes appear at lags 7 or 24.

**Baselines first (the `DummyRegressor` of forecasting):**
- **Naive:** tomorrow = today.
- **Seasonal naive:** next Tuesday 20:00 = last Tuesday 20:00.
- **Moving average.**

A model that doesn't beat the seasonal naive **adds nothing**. Part 14 made this point about FinSight's TimeGPT.

**Model families:**

| Family | Examples | When |
|---|---|---|
| Exponential smoothing | ETS, Holt-Winters | Few series, clear trend and seasonality |
| ARIMA / SARIMA(X) | `statsmodels`, `pmdarima` | Classical, interpretable, one series at a time |
| Prophet | Meta's additive model | Business series with holidays; quick |
| **ML on lag features** | LightGBM with lags, rolling stats, calendar, holiday flags | **Many related series** (thousands of cells): one global model. Often the best in practice |
| Deep learning | N-BEATS, TFT, DeepAR | Large collections of series; probabilistic forecasts |
| Foundation models | TimeGPT, Chronos, TimesFM | Zero-shot baselines; always backtest |

**Validation:** **never random KFold.** Use **`TimeSeriesSplit`** or a rolling-origin **backtest**: train on the data up to t, forecast t+1…t+h, move t forward, repeat. Keep a gap if features lag.

**Metrics:** MAE, RMSE, **MAPE** (breaks near zero, asymmetric), **WAPE** (Σ|e|/Σ|y|, business-friendly), **MASE** (scaled by the in-sample naive error: < 1 means the model beats naive), plus **prediction-interval coverage** (do 90% intervals contain ~90% of the actuals?).

**Lag-feature leakage:** a rolling mean must use only the *past* (`shift(1)` before `rolling`). The value being predicted must never appear in its own features.

```python
df = df.sort_values(["cell_id", "hour_ts"])
g = df.groupby("cell_id")["traffic_gb"]
df["lag_24"]   = g.shift(24)                       # same hour yesterday
df["lag_168"]  = g.shift(168)                      # same hour last week
df["roll_24"]  = g.shift(1).rolling(24).mean().reset_index(level=0, drop=True)
df["hour"], df["dow"] = df.hour_ts.dt.hour, df.hour_ts.dt.dayofweek
# then: LightGBM, validated with TimeSeriesSplit / rolling-origin backtest
```

---

## 16.5 The case-study answer framework (use this every time) 🟢 ⭐

> [!quote] 💬 Say it in the interview
> “Clarify the objective → define the target → data and features → baseline → model → evaluation tied to business value → deployment and monitoring → risks.”

When given an open question such as *"How would you reduce churn?"* or *"Build a model to detect fraud"*, walk through **eight steps**. This is Géron's project checklist (Part 6 §6.11) adapted for interviews.

1. **Clarify the business objective and constraints.** What decision will the model drive? Who acts on it? What budget, capacity or latency? What does success look like in money? *"Is the goal fewer churners, or more retained margin? Those lead to different targets."*
2. **Define the target precisely,** including the time windows and the population. Say what is excluded (e.g. corporate lines, test SIMs, employees).
3. **Data sources and features:** what exists, at what grain, how fresh, any leakage risks. Name 8–10 concrete features grouped by theme.
4. **Baseline:** a business rule or `DummyClassifier`, then a simple interpretable model.
5. **Model choice and validation:** GBM vs logistic regression trade-offs; a **temporal** split; class imbalance; calibration; hyperparameter search.
6. **Metric linked to value:** precision@k and lift for a budgeted campaign; expected profit; guardrails.
7. **Deployment and monitoring:** batch scoring (monthly or daily) vs real-time API; feature pipeline; drift (PSI) and performance monitoring; retraining cadence; rollback.
8. **Measure the real impact:** an A/B test or holdout group (Part 15 §15.7). Iterate.

**Close with risks:** privacy, fairness, feedback loops (the model changes the data it will later be trained on: retained customers no longer churn, so labels shift), and stakeholder adoption.

### A full worked answer (practise saying this in ~6 minutes)

> *"The retention team can call 20k pre-paid customers a month. Build something to help."*

- **Objective:** maximise retained margin within 20k contacts a month, not raw accuracy.
- **Target:** a pre-paid subscriber with no recharge and no chargeable usage for 60 days, measured in the 60 days after a monthly snapshot. Exclude SIMs younger than 30 days and corporate SIMs.
- **Features (as of the snapshot):** tenure; recharge recency, frequency and amount (30/90 days); the data-usage trend ratio; active days; bundle type and expiry; complaints in 90 days; network drop rate on the top-2 cells; handset age; share of calls to numbers that churned; governorate. Built in SQL like Part 12 P13.
- **Validation:** train on Jan–Jun snapshots, validate on Jul, test on Aug. Baseline: the rule "no recharge for 21 days".
- **Model:** logistic regression (interpretable) vs LightGBM with `class_weight`, then isotonic calibration.
- **Metric:** precision and lift in the top 20k (≈ the top 2%), plus expected retained margin (Part 8 §8.15). Report PR-AUC for model comparison.
- **Output:** a monthly ranked list with the **top 3 SHAP reasons** per customer, so the agent knows what to say ("your bundle expired; here is a data offer" vs "network issue: escalate").
- **Deployment:** a monthly batch job (SQL feature build → Python scoring → table for the campaign tool). Monitor PSI on the features, the realised churn among contacted vs control customers, and the model's lift each month. Retrain quarterly or on a drift alert.
- **Impact:** keep a random 10% of the top-20k list as a **no-call control**. Incremental retention = churn(control) − churn(called). Next step: **uplift modelling**, to target those the call actually persuades.
- **Risks:** leakage from post-snapshot fields, feedback loops, agent capacity variance, and privacy (only anonymised IDs leave the warehouse).

---

## 16.6 Productionisation — your differentiator 🟡 ⭐

> [!info] 📖 Géron Ch. 2 · “Launch, Monitor, and Maintain Your System” · pp. 100–103

Most entry-level candidates stop at the notebook. You have ASP.NET, APIs and Docker. Use them.

**Two deployment patterns:**
1. **Batch scoring** (most telecom marketing use cases): a scheduled job (Airflow, cron, or the ML platform's scheduler) builds the features in SQL/Spark, loads the pipeline, scores everyone, and writes a table the campaign system reads. Simple, cheap, auditable.
2. **Real-time API** (fraud checks, offer at recharge, credit decisions at checkout):

```python
# app.py — FastAPI wrapper around a saved sklearn Pipeline (Part 7 §7.12 contract)
from fastapi import FastAPI
from pydantic import BaseModel
import joblib, pandas as pd

app = FastAPI()
pipe = joblib.load("artifacts/churn_pipeline.joblib")   # load ONCE at start-up (Géron)

class Subscriber(BaseModel):
    tenure_days: int
    arpu_3m: float
    data_trend: float | None = None
    complaints_90d: int
    plan_type: str
    governorate: str

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/predict")
def predict(s: Subscriber):
    X = pd.DataFrame([s.model_dump()])
    p = float(pipe.predict_proba(X)[0, 1])
    return {"churn_probability": round(p, 4), "model_version": "2026-09"}
```

Package it with Docker, pin versions (`requirements.txt`), and put it behind the existing API gateway. An ASP.NET service can call it over REST, or load an **ONNX** export directly (Part 11 §11.15).

**MLOps checklist to mention:**
- **Versioning:** code (Git), data snapshots, and model artifacts with metrics (MLflow model registry).
- **Reproducibility:** seeds, pinned environments, Docker.
- **Training/serving skew:** a single `Pipeline` object (Part 4 §4.8) or a feature store guarantees the same transformations in both places.
- **Monitoring:** input drift (PSI, missing rates, new categories), prediction drift (score distribution), performance once labels arrive, latency and errors.
- **Retraining:** scheduled or triggered; champion/challenger comparison on recent data and important slices; automatic rollback (Géron, Part 6 §6.11).
- **Governance:** documentation (model cards), fairness checks, approvals for high-impact models (credit).

---

## 16.7 Python and pandas coding round — patterns to have in your fingers 🟢 ⭐

Typical format: a 30–45 minute live exercise on a small dataset, or a take-home.

```python
import pandas as pd, numpy as np

# 1. Profile quickly (Part 3 §3.13 / Part 13 §13.3)
df.info(); df.describe(include="all").T; df.isna().mean().sort_values(ascending=False)
df.duplicated().sum(); df.nunique().sort_values()

# 2. Group-by with several aggregations, named
out = (df.groupby("governorate")
         .agg(n=("msisdn", "nunique"), arpu=("revenue", "mean"),
              churn_rate=("churned", "mean"))
         .sort_values("churn_rate", ascending=False))

# 3. Window-function equivalents (Part 12 §12.3)
df = df.sort_values(["msisdn", "date"])
df["prev_amt"] = df.groupby("msisdn")["amount"].shift(1)
df["cum_amt"]  = df.groupby("msisdn")["amount"].cumsum()
df["rank_in_gov"] = df.groupby("governorate")["revenue"].rank(ascending=False, method="dense")
df["share_of_gov"] = df["revenue"] / df.groupby("governorate")["revenue"].transform("sum")
df["roll7"] = (df.groupby("msisdn")["data_mb"]
                 .transform(lambda s: s.rolling(7, min_periods=1).mean()))

# 4. Top-N per group
top3 = df.sort_values("revenue", ascending=False).groupby("governorate").head(3)

# 5. Pivot / crosstab
pd.crosstab(df.plan_type, df.churned, normalize="index")
df.pivot_table(index="month", columns="plan_type", values="revenue", aggfunc="sum")

# 6. Dates
df["date"] = pd.to_datetime(df["date"], errors="coerce")
df["month"] = df["date"].dt.to_period("M")
daily = df.set_index("date").resample("D")["amount"].sum()

# 7. Merge safely (check for fan-out)
m = a.merge(b, on="customer_id", how="left", validate="many_to_one", indicator=True)
m["_merge"].value_counts()

# 8. Days since last event per customer, as of a snapshot
snap = pd.Timestamp("2026-06-30")
last = df[df.date <= snap].groupby("msisdn")["date"].max()
recency_days = (snap - last).dt.days
```

Also be ready for plain-Python questions: string manipulation, dictionaries and counting (`collections.Counter`), list comprehensions (Part 1), writing a function with tests in mind, time complexity of your solution, and implementing a metric (precision/recall, RMSE) or a simple algorithm (k-means step, gradient descent) from scratch with NumPy (Part 7 §7.14 has the GD code).

---

## 16.8 Behavioural round — STAR stories from your own work 🟢 ⭐

Multinationals score behaviour seriously (e& publishes values around customer focus, collaboration and innovation; read the current version). Prepare **5–6 stories** in **STAR** form (**S**ituation, **T**ask, **A**ction, **R**esult), each 1.5–2 minutes, with a number in the result.

Draft stories from your background (fill in your real details and numbers):

| Theme | Story source | Angle |
|---|---|---|
| End-to-end ML project | **Road-accidents capstone** (Part 13) | Leak-free pipeline, macro-F1 against a dummy baseline, SMOTE inside CV, turning findings into actions ("motorcycles >500cc: 42% serious/fatal vs 8% for cars") |
| Owning a product / forecasting | **FinSight** (cash-flow forecasting with TimeGPT) | Framing, building, and what you would validate next (backtesting against seasonal naive; §16.4). Honest about lessons learned |
| Deep learning / research | **SER thesis** (HuBERT) | Transfer learning, handling small labelled data, evaluation rigour |
| Engineering to production | ASP.NET / Angular / Docker work | Shipping, APIs, reliability. Why you can deploy models, not just train them |
| Learning fast | This course + Géron | Self-driven upskilling. Mention concrete gaps you closed (gradient boosting, statistics) |
| Handling a mistake | A bug you found (e.g. leakage, the chained-assignment bug in Part 4, a wrong metric) | Accountability, the fix, the process change |
| Stakeholder communication | Explaining a model to non-technical people | Simplifying without distorting; a visual; a decision recommendation |
| Disagreement | Choosing a simpler model over a flashier one | Data-driven argument (linear beat KNN in Part 7; GBM vs NN on tabular data) |

**Common behavioural questions:** tell me about yourself (a 90-second story: engineer → ML → why telecom data); why e&; a challenging project; a failure; a conflict; working under a deadline; prioritising requests; explaining a technical result to a manager; where you see yourself in 3 years.

**"Why e&?"** Base it on facts you have verified: scale of data (tens of millions of customers), breadth of problems (network + commercial + fintech + enterprise), the group's digital and AI ambitions, and your fit (software engineering + ML → you can take models to production).

**Questions to ask them (pick 3):**
1. How are models deployed today: batch tables, APIs, a platform? Who owns monitoring?
2. What does success look like for this role in the first 6 months?
3. How do you measure the business impact of models: holdout groups, A/B tests?
4. What does the data stack look like (warehouse, Spark, cloud or on-prem)?
5. How is the data science team organised with the business and IT teams?

---

## 16.9 Master question bank — rapid-fire, with pointers (90 questions) 🟢 ⭐

Answer each in 30–60 seconds, out loud. The arrow points to the full answer.

**How to use the level tags:** entry candidates should nail every 🟢 and ⭐ question and be able to say one sentence on each 🟡. Mid candidates should handle all 🟢 and 🟡. 🔴 questions come up in specialist or senior loops.  
Count: 🟢 35 · 🟡 49 · 🔴 6 · ⭐ 20 most-asked.

### ML fundamentals
1. 🟢 Supervised vs unsupervised vs self-supervised vs RL, with an example of each. → 6 §6.8
2. 🟢 Parameter vs hyperparameter. → 6 §6.8, §6.13
3. 🟢 ⭐ Bias-variance trade-off; how to diagnose it from train/validation scores and learning curves. → 6 §6.4, 7 §7.16
4. 🟢 Overfitting remedies (list 6). → 6 §6.9
5. 🟡 Why a validation set *and* a test set? What is a train-dev set? → 6 §6.10
6. 🟡 ⭐ k-fold vs stratified vs group vs time-series CV. → 6 §6.5
7. 🟢 ⭐ Types of leakage, with examples; how to detect them. → 4 §4.5, 8B §8B.10
8. 🟡 The No Free Lunch theorem. → 6 §6.10
9. 🟢 Batch vs online learning; data drift. → 6 §6.8
10. 🟢 Instance-based vs model-based learning. → 6 §6.8

### Data preparation
11. 🟢 Missing values: options and trade-offs; missingness as a signal. → 4 §4.2, §4.10.6
12. 🟡 Encoding high-cardinality categoricals. → 4 §4.10.8
13. 🟢 Scaling: which models need it and why (the geometry). → 4 §4.7, 7 §7.14.3
14. 🟡 Handling skewed features and targets. → 4 §4.10.9–10
15. 🟡 ⭐ Imbalanced data: class weights vs SMOTE; where SMOTE must live. → 4 §4.6
16. 🟡 Why a `Pipeline`? Training/serving skew. → 4 §4.8, 7 §7.12

### Models
17. 🟢 Linear regression assumptions; Normal equation vs GD; complexity. → 7 §7.8, §7.14
18. 🟢 ⭐ Ridge vs Lasso vs ElasticNet; why ℓ₁ gives zeros. → 7 §7.17
19. 🟢 Logistic regression: sigmoid, log-loss, odds-ratio interpretation, C vs α. → 8 §8.13
20. 🟡 Softmax vs multiple sigmoids. → 8 §8.13, 7 §7.19 Q11
21. 🟢 ⭐ Decision trees: Gini vs entropy, CART, regularisation, extrapolation. → 8B §8B.1
22. 🟢 Random forest: why feature subsampling; OOB. → 8B §8B.4–5
23. 🟢 ⭐ Bagging vs boosting. → 8B §8B.8
24. 🟡 Gradient boosting mechanics; learning rate vs number of trees; early stopping. → 8B §8B.6
25. 🟡 XGBoost vs LightGBM vs CatBoost. → 8B §8B.6
26. 🟡 SVM: margin, C, kernels, gamma. → 8 §8.16
27. 🟢 KNN: k's effect, scaling, the curse of dimensionality. → 7 §7.10, 9 §9.11
28. 🟢 Naive Bayes: the assumption and why it still works for text. → 8 §8.11, 10
29. 🟡 Stacking without leakage. → 8B §8B.7
30. 🟡 Feature importance: MDI vs permutation vs SHAP. → 8B §8B.5–6

### Evaluation
31. 🟢 ⭐ Precision, recall, F1; which one for fraud blocking vs fraud review vs churn. → 8 §8.12.3
32. 🟢 ⭐ ROC-AUC vs PR-AUC; interpret AUC = 0.8. → 8 §8.12.5
33. 🟡 ⭐ Choosing a threshold. → 8 §8.12.4, §8.15
34. 🟡 Calibration: what, why, how. → 8 §8.12.7
35. 🟡 Macro vs weighted vs micro averaging. → 6 §6.6
36. 🟡 Lift, gains, precision@k, KS, Gini. → 8 §8.14
37. 🟢 RMSE vs MAE vs MAPE vs WAPE. → 6 §6.11, 7 §7.19, 16 §16.4
38. 🟡 How to compare two models statistically. → 15 §15.9

### Unsupervised
39. 🟢 ⭐ K-Means algorithm, k-means++, choosing k, limitations. → 9 §9.7, §9.16
40. 🟡 DBSCAN vs K-Means vs GMM. → 9 §9.18–19
41. 🟢 ⭐ PCA: what it maximises, why scale, choosing components, PCA vs LDA. → 9 §9.13, §9.15
42. 🟡 The curse of dimensionality. → 9 §9.11
43. 🟡 Anomaly detection methods; anomaly vs novelty. → 9 §9.20
44. 🟡 Validating a segmentation. → 9 §9.21

### Deep learning
45. 🟢 ⭐ Why non-linear activations; ReLU vs sigmoid; vanishing gradients. → 11 §11.9, §11.16
46. 🟢 ⭐ Backpropagation in plain words. → 11 §11.9
47. 🟢 Dropout, batch norm, early stopping. → 11 §11.4–5, §11.16
48. 🟡 The PyTorch training loop; `train()`/`eval()`; `zero_grad()`. → 11 §11.11
49. 🟡 CrossEntropyLoss takes logits: why. → 11 §11.13
50. 🟡 When not to use deep learning. → 11 §11.7

### Statistics & experiments
51. 🟢 p-value, CI, Type I/II errors, power. → 15 §15.4–5
52. 🟡 ⭐ Design an A/B test end to end; sample size. → 15 §15.7
53. 🟡 Peeking, SRM, novelty, network effects. → 15 §15.7
54. 🟢 ⭐ Bayes theorem with the base-rate trap. → 15 §15.2
55. 🟢 CLT and why it matters. → 15 §15.3
56. 🟢 Correlation vs causation; Simpson's paradox. → 15 §15.8

### SQL / data
57. 🟢 ⭐ Top-N per group; running totals; LAG; gaps and islands. → 12 §12.6
58. 🟡 Build a point-in-time feature table. → 12 §12.6 P13
59. 🟡 `NOT IN` with NULLs; join fan-out. → 12 §12.6

### Production
60. 🟡 Batch vs real-time scoring; monitoring; retraining. → 16 §16.6, 6 §6.11

### Deep learning, LLMs and modern AI (Parts 17–25) — questions 61–90
61. 🟡 Vanishing/exploding gradients: causes and 5 fixes (init, ReLU-family, BN/LN, residuals, clipping). → 17
62. 🟡 He vs Glorot initialisation — which with which activation. → 17
63. 🟡 BatchNorm vs LayerNorm — why transformers use LayerNorm/RMSNorm. → 17, 21
64. 🟡 Adam vs SGD+momentum vs AdamW; why a warm-up + cosine schedule. → 17
65. 🟡 Transfer learning: freeze, then unfreeze with a lower LR. Why? → 17, 18
66. 🔴 Mixed precision (FP16/BF16) and why a GradScaler is needed for FP16. → 17
67. 🔴 Quantization: PTQ vs QAT; what QLoRA does. → 17, 21
68. 🟡 Convolution: what a filter, stride, padding and receptive field are; params of a conv layer. → 18
69. 🟡 Why ResNet's skip connections work. → 18
70. 🔴 Object detection metrics: IoU, NMS, mAP. → 18
71. 🟢 ⭐ How would you forecast daily data traffic per cell for 90 days? Baselines, validation, model. → 19, 16 §16.4
72. 🟡 LSTM vs GRU vs 1D-CNN vs gradient boosting with lags for time series. → 19
73. 🟡 Tokenisation: BPE vs WordPiece; why subwords help Arabic. → 20, 10 §10.10
74. 🟡 Greedy vs beam search vs top-k/top-p sampling vs temperature. → 20
75. 🟡 Explain self-attention (Q, K, V) and why divide by √d_k. → 21
76. 🟢 Encoder-only vs decoder-only vs encoder–decoder: examples and uses. → 21
77. 🟡 How is an LLM trained end to end (pretraining → SFT → RLHF/DPO → RL for reasoning)? → 21, 24
78. 🟢 ⭐ RAG: architecture, chunking, embeddings, hybrid search, reranking, evaluation. → 21
79. 🟢 ⭐ Fine-tuning vs RAG vs prompting — decision rule. → 21
80. 🟡 LoRA in one sentence; why it's cheap. → 21
81. 🟡 Hallucination and prompt injection: mitigations (OWASP LLM Top 10). → 21
82. 🔴 Why is LLM inference memory-bound? KV cache, GQA, quantization, vLLM. → 21 §21.9
83. 🟡 What is an agent? What is MCP? → 21
84. 🔴 ViT: how an image becomes tokens. CLIP: how zero-shot classification works. → 22
85. 🟡 Autoencoder for anomaly detection on network KPIs — how and how to set the threshold. → 23
86. 🔴 VAE vs GAN vs diffusion — trade-offs. → 23
87. 🟡 Synthetic data: when it helps and how to validate it (fidelity, utility, privacy). → 23
88. 🟡 Q-learning vs policy gradients vs PPO in one sentence each. → 24
89. 🟡 Bandits vs A/B tests for next-best-offer; off-policy evaluation. → 24, 15
90. 🟢 What's a recent AI development you find interesting, and would it matter for e&? → 25

---

## 16.10 Mock interview — five full questions with model answers 🟢 ⭐

Each answer is laid out the way you should *say* it: a one-line headline, then a structured body, then next steps. Practise until each takes 2–3 minutes.

### Q1 🟡 ⭐ "Our churn model has 0.92 AUC in development, but the retention campaign showed no improvement. Why?"

> [!question] 🎯 What the interviewer is testing
> whether you see beyond the model (leakage, uplift, operations, measurement).

**Headline:** "A high AUC predicts churn; it doesn't prove the *campaign* can change it. I'd check five things, most likely first."

| # | Cause | What it looks like |
|---|---|---|
| 1 | **Leakage** | A feature was only known after the churn signal (e.g. a "deactivation request" flag), so the real AUC is lower. |
| 2 | **Wrong target for the action** | The model finds sure-to-churn "lost causes" whom no offer saves. We need **uplift**, not risk. |
| 3 | **Operations** | Offers weren't attractive, calls didn't happen, or the horizon was shorter than the campaign lead time. |
| 4 | **Measurement** | No proper control group, or too small a sample to detect the effect (power). |
| 5 | **Drift** | Behaviour changed between training and deployment (price change, competitor promotion). |

**Next steps:** audit features with a temporal backtest → confirm the campaign actually ran → design an uplift test with a holdout.

### Q2 🟢 ⭐ "Explain gradient boosting to a product manager, then to a data scientist."

> [!question] 🎯 What the interviewer is testing
> communication at two levels of abstraction.

- **To the PM:** *"It builds hundreds of small decision rules in sequence. Each new rule focuses on the customers the previous ones got wrong, and the final answer adds them all up — like a team where each member fixes the last one's mistakes."*
- **To the DS:** additive trees fitted to the negative gradient of the loss (residuals for MSE), with shrinkage (learning rate), subsampling, shallow trees and early stopping. XGBoost adds a second-order approximation and a regularised objective; LightGBM grows leaf-wise with histograms and GOSS. → Part 8B §8B.6

### Q3 🟡 ⭐ "You have 5M subscribers and 0.3% fraud. How do you build and evaluate a detector?"

> [!question] 🎯 What the interviewer is testing
> imbalance, the business action, evaluation under capacity limits.

| Step | Answer |
|---|---|
| **Clarify** | Action (block vs review) and daily analyst capacity. |
| **Features** | Usage asymmetry, IMEI churn, destination diversity, activation batches, graph degree. |
| **Baseline** | The existing rules. |
| **Models** | Unsupervised scores (Isolation Forest) for unknown patterns + a supervised GBM on confirmed cases with a **temporal** split and class weights (no naive oversampling across time). |
| **Evaluate** | PR-AUC, **precision@k where k = daily review capacity**, recall of fraud *value* (EGP). |
| **Threshold** | From the cost of a false block vs the fraud loss. |
| **Operate** | Weekly drift monitoring (fraudsters adapt); feed analyst decisions back as labels (active learning). |

### Q4 🟡 ⭐ "Marketing says the new bundle increased ARPU 6% in the month after launch. Do you believe it?"

> [!question] 🎯 What the interviewer is testing
> causal thinking — confounding, self-selection, the counterfactual.

**Headline:** "Not yet — what was the comparison?"

- **Confounders in a before/after:** seasonality (Ramadan, pay day, summer), concurrent promotions, price changes, **self-selection** (heavy users buy the bundle).
- **If there was no control group:** difference-in-differences against comparable non-exposed customers, or a propensity-matched comparison; check parallel pre-trends; report a confidence interval.
- **Next launch:** propose a randomised rollout. → Part 15 §15.7–15.8

### Q5 🟡 "Walk me through how you would detect that a deployed model has degraded."

> [!question] 🎯 What the interviewer is testing
> production maturity.

| When | Monitor |
|---|---|
| **Before labels arrive** | Inputs: PSI per feature, missing rates, unseen categories, volume. Outputs: score distribution, share above the threshold. |
| **After labels arrive** | Rolling precision@k / recall / calibration vs the validation baseline, by segment. |
| **Alerting** | e.g. PSI > 0.25, lift drop > 20%. |
| **Response** | Champion/challenger, retrain on recent data, roll back if the new model underperforms on recent holdouts. |

→ Part 6 §6.11, Part 16 §16.6

---

## 16.11 A 4-week study plan using this course 🟢

Assumes ~2–3 focused hours a day. Adjust to your interview date.

**Week 1 — Foundations and data (the part most interviews test first)**
- Day 1–2: Part 6 (all, including §6.8–6.13). Answer §6.13 out loud.
- Day 3: Part 4 §4.5–4.11. Re-implement Géron's full preprocessing pipeline (§4.10.12) on a Kaggle telecom churn dataset (e.g. "Telco Customer Churn").
- Day 4: Part 12 §12.6. Solve P1–P13 without looking; then 10 window-function problems on DataLemur or StrataScratch.
- Day 5: Part 3 + §16.7 pandas patterns. Timed exercises.
- Day 6–7: Part 15 §15.1–15.6. Do the puzzles in §15.10 on paper.

**Week 2 — Supervised learning in depth**
- Day 1: Part 7 §7.14–7.19. Implement batch GD and SGD for linear regression in NumPy.
- Day 2–3: Part 8 §8.12–8.17. On the churn dataset: threshold tuning, PR curve, calibration, lift chart, and the §8.15 profit calculation.
- Day 4–5: Part 8B. Train LightGBM/HGB with early stopping; add SHAP; compare with logistic regression. Write up the result as for a manager.
- Day 6–7: Géron Ch. 3–6 exercises (the ones answered in the drills). Redo any you got wrong.

**Week 3 — Unsupervised, deep learning, experiments**
- Day 1–2: Part 9 §9.11–9.21. Segment the churn dataset with K-Means/GMM; profile and name the segments.
- Day 3–4: Part 11 §11.9–11.16. Write the PyTorch training loop from memory; train an MLP on tabular data; compare with GBM (it should lose, and you should be able to explain why).
- Day 5–6: Part 15 §15.7. Design two A/B tests on paper (a bundle recommendation; a retention call), with sample sizes computed in `statsmodels`.
- Day 7: §16.4 time series. Backtest seasonal naive vs LightGBM on any public traffic or sales dataset.

**Week 4 — Domain, cases, polish**
- Day 1: §16.2–16.3. Write one paragraph per use case in your own words.
- Day 2: §16.5. Record yourself answering three cases (churn, fraud, NBO) in 6 minutes each.
- Day 3: §16.6. Wrap your churn pipeline in FastAPI + Docker. That is a portfolio piece.
- Day 4: §16.8. Write the STAR stories; rehearse "tell me about yourself".
- Day 5: §16.9 master bank. Answer all 60 rapid-fire; mark the weak ones and review them.
- Day 6: a full mock interview with a friend (SQL 30 min + ML 30 min + case 30 min + behavioural 20 min).
- Day 7: rest, then light review of the one-page summaries (Part 14 §14.6 + §16.12).

**Weeks 5–6 (optional but recommended for mid-level / AI-flavoured roles) — deep learning to SOTA**
- Day 1–2: Part 17 (training DNNs). Re-run the PyTorch loop with BN, AdamW, a cosine schedule and mixed precision; answer the drill.
- Day 3: Part 19 (forecasting). Add an LSTM and a TimesFM/Chronos zero-shot run to your Week 3 backtest; compare MASE.
- Day 4–5: Part 20 → Part 21. Fine-tune a small Arabic BERT with the HF `Trainer`; build a RAG bot over public telecom FAQ pages (Arabic + English) with a 30-question eval set.
- Day 6: Part 18 + Part 22 (skim; know CNN/ViT/CLIP concepts and one example each).
- Day 7: Part 23 §23.1 + §23.5 (autoencoder anomaly detection) and Part 24 §24.12 (bandits, RLHF/GRPO).
- Day 8: Part 25 — tick the §25.7 self-check; prepare two SOTA talking points (e.g., reasoning models, TabPFN, forecasting foundation models) with a telecom angle.
- Day 9–10: questions 61–90 of §16.9 out loud; one mock "design an LLM assistant for customer care" case (§16.5 framework + Part 21).

**Portfolio items that impress a telecom panel (pick two):**
1. A churn project with a temporal validation, a calibrated GBM, SHAP reasons, and a profit curve, deployed as an API. Include a README with the business framing.
2. An Arabic (Egyptian dialect) complaint or tweet classifier: TF-IDF baseline vs a fine-tuned MARBERT.
3. A traffic-forecasting backtest (seasonal naive vs LightGBM vs a foundation model) with MASE and interval coverage.
4. The road-accidents capstone (Part 13), with the fixes from Part 14 §14.4 applied.
5. A bilingual **RAG customer-care assistant** with an evaluation harness (faithfulness, answer relevance, refusal on out-of-scope), guardrails and cost/latency numbers (Part 21).
6. A **KPI anomaly detector**: STL residuals vs Isolation Forest vs an autoencoder, evaluated on injected incidents (Parts 19, 23).
7. A **Thompson-sampling offer simulator** comparing bandit regret vs a 50/50 A/B test (Parts 15, 24).

---

## 16.12 The one-page cheat sheet — the night before 🟢 ⭐

**Framing:** objective → decision → target (with windows) → population → baseline → metric in money. **Splits:** test set aside first; stratify; **time-based for time-ordered data**; group split for repeated entities. **Pipeline:** impute → transform skew → scale (non-tree models) → encode → model, all inside one `Pipeline`, cross-validated as a whole. **Imbalance:** class weights first; resampling only inside CV; recalibrate afterwards. **Models:** logistic regression (baseline, interpretable) → **gradient boosting** (tabular winner) → neural nets for text, images, audio and sequences. **Regularisation:** Ridge (shrink), Lasso (select), ElasticNet (correlated or n > m); GBM: lower the learning rate + early stopping; RF: more trees never overfit. **Metrics:** imbalanced → PR-AUC, precision@k, lift; probabilities used → calibration and Brier; regression → RMSE/MAE/WAPE; forecasting → MASE vs seasonal naive. **Threshold:** set by cost or capacity, tuned on validation, never on test. **Unsupervised:** scale first; k by silhouette/BIC plus business sense; profile and name the clusters; Isolation Forest for anomalies. **Stats:** the p-value is P(data this extreme | H₀), not P(H₀); CI width ∝ 1/√n; power 0.8, α 0.05; the MDE is a business choice; no peeking; check SRM. **Production:** batch vs API; version everything; monitor PSI, score drift and live lift; champion/challenger; rollback. **Communication:** lead with the decision and the money, then the evidence, then the caveats.

Good luck. Prepared this way, you will be well above the typical entry-level candidate.

---

> [!check] ✅ Key takeaways
> - Frame every case: objective → decision → target & windows → data → baseline → model → metric tied to value → deployment → risks.
> - Churn: predict *who* is at risk, then target *persuadable* customers (uplift) and measure with a holdout.
> - Speak telecom: ARPU, churn, MOU, recharge, CDRs, network KPIs.
> - Show production maturity: monitoring inputs and outputs, drift, retraining, rollback.
> - Prepare 5 STAR stories with numbers, and practise answers out loud.

<!-- nav -->
> [!example] 🧭 Step 26 of 26 · Stage 7 of 7: Interview & beyond
> ← [Part 14 · Gaps & next steps](14_Gaps_and_Where_To_Go_Next.md) · 🏁 End of the path · [Course map](00_START_HERE.md)
<!-- /nav -->
