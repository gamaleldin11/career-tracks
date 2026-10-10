# Part 14 — What the Course Did Not Cover, and Where to Go Next

<!-- nav -->
> [!example] 🧭 Step 25 of 26 · Stage 7 of 7: Interview & beyond
> ← [Part 25 · SOTA roadmap](25_State_of_the_Art_and_Learning_Roadmap.md) · [Part 16 · Interview hub (e&)](16_Interview_Prep_eand_Egypt.md) → · [Course map](00_START_HERE.md)
<!-- /nav -->

An honest audit. The course was good — better than most, particularly on pipeline discipline and leakage — but it is a ~14-session introduction, and it has gaps. Knowing exactly which ones is more useful than a vague sense that there is more to learn.

<!-- interview-focus -->

> [!tip] 🎯 Interview focus
> **Why it matters:** Knowing your gaps lets you answer "what are you learning now?" honestly — and shows self-awareness, which interviewers value.
>
> | Level | What you should be able to do |
> |---|---|
> | 🟢 **Entry** | Know which topics are your strong ground (Parts 4–9, 12, 15) and which you only know at concept level. |
> | 🟡 **Mid** | Have a concrete plan and a recent project for each gap you claim to be closing. |
>
> **⭐ Most-asked:** *What are you learning at the moment?* · *What is a weakness in your ML knowledge?* · *What would you study next, and why?*
>
> **⏱ Time:** 30 min  ·  **Short on time?** Read the status table at the top, then §14.6.

**Legend:** 🟢 Entry (0–2 yrs) · 🟡 Mid (2–5 yrs) · 🔴 Senior / specialist · ⭐ frequently asked · 📖 Géron, *Hands-On ML with Scikit-Learn and PyTorch* (2025) pages

---

## 14.1 What you genuinely have

Do not undersell this. After this course you can:

- Write idiomatic Python for data work — comprehensions, functions, classes, custom sklearn transformers.
- Manipulate arrays and tables fluently, including reshaping, merging, grouping and time handling.
- Take a raw, dirty file and produce a clean, modelled, evaluated result.
- **Build a leak-free pipeline** — this is the single most valuable skill here, and many working practitioners get it wrong.
- Choose an appropriate metric and justify the choice.
- Handle class imbalance correctly, including the subtle part (resampling inside CV).
- Run supervised regression, supervised classification, PCA, clustering, classical NLP and a small neural network.
- Communicate findings as quantified, actionable statements.

That is a real, working foundation. The gaps below are additions, not corrections.

> [!note] 📘 From the book
> **Update (September 2026):** several gaps below are now filled inside this document set, using Géron's *Hands-On ML* (2025) and interview-oriented material:
>
> | Gap | Status | Where |
> |---|---|---|
> | #1 Gradient boosting | ✅ Filled | Part 8B (Géron Ch. 5–6 + XGBoost/LightGBM/CatBoost + SHAP) |
> | #2 Ridge / Lasso / ElasticNet | ✅ Filled | Part 7 §7.17 (Géron Ch. 4) |
> | #3 Time series | ✅ Filled | Part 16 §16.4 (primer) + **Part 19** (SARIMA → RNN/LSTM → forecasting playbook → TimesFM/Chronos). *FPP3* still the best deep reference |
> | #4 Deployment / MLOps | ◐ Primer | Part 6 §6.11 (Géron's launch/monitor/maintain), Part 16 §16.6 (FastAPI, monitoring) |
> | #5 Statistical inference / A/B testing | ✅ Filled | Part 15 |
> | #6 CV variants | ✅ Covered | Part 6 §6.5, §6.10; Part 8 §8.12.2 |
> | #7 Feature selection | ✅ Covered | Part 4 §4.10.13, Part 8B §8B.5 |
> | #8 Calibration | ✅ Filled | Part 8 §8.12.7 (Géron Ch. 3) |
> | #9 Precision-Recall curves | ✅ Filled | Part 8 §8.12.4–8.12.5 (Géron Ch. 3) |
> | #11 Modern NLP | ✅ Filled | Part 10 §10.10 (Arabic), **Part 20** (tokenizers, Hugging Face, attention), **Part 21** (transformers, LLMs, RAG, agents, fine-tuning) |
> | #12 Deep learning breadth | ✅ Filled | Part 11 + **Parts 17–23** (training DNNs, CNNs, RNNs, transformers, ViT/multimodal, generative models) from the complete Géron book |
> | Reinforcement learning (not in original audit) | ✅ Filled | **Part 24** (Q-learning, DQN, PPO, RLHF/GRPO, bandits for offers) |
> | Keeping up with SOTA | ✅ Filled | **Part 25** (foundation → SOTA ladder, curated sources, case studies, learning plan) |
> | #13 Causal inference | ◐ Primer | Part 15 §15.7–15.8 (quasi-experiments, paradoxes) |
> | #16 Anomaly detection | ✅ Filled | Part 9 §9.20 (Géron Ch. 8) |
>
> The rest of this part is the original audit, kept as written.

---

## 14.2 The gaps, ranked by how much they matter to you

### Tier 1 — fill these first

**1. Gradient boosting (XGBoost / LightGBM / CatBoost)**

The most consequential omission. Gradient-boosted trees are **the default winning approach for tabular data**, and the course never mentions them. Every Kaggle tabular competition of the last decade was won by one.

```python
from sklearn.ensemble import HistGradientBoostingClassifier   # built in, fast, no install
import lightgbm as lgb                                        # the production standard
```

`HistGradientBoostingClassifier` is in sklearn already, handles missing values natively, and slots into the pipelines you already know. Start there, then LightGBM.

*Learn from:* the LightGBM docs; StatQuest's gradient boosting series; ISLR Ch. 8.

**2. Regularisation — Ridge, Lasso, ElasticNet**

The course teaches `LinearRegression` and `LogisticRegression` but never `alpha` or `C`. Regularisation is the primary defence against overfitting in linear models, and Lasso doing automatic feature selection is a genuinely useful property.

*Learn from:* ISLR Ch. 6; scikit-learn Linear Models §1.1.

**3. Time series**

Nothing at all — no `resample`, no `rolling`, no autocorrelation, no `TimeSeriesSplit`, no forecasting. **This is a live gap for you specifically**, because FinSight is a cash-flow forecasting product built on Nixtla TimeGPT. You are shipping time-series predictions without having covered the fundamentals: stationarity, seasonality, trend decomposition, lag features, backtesting, and why a random train/test split is invalid on temporal data.

*Learn from:* **Forecasting: Principles and Practice**, Hyndman & Athanasopoulos — free at https://otexts.com/fpp3/ (R, but the concepts are language-agnostic; there is a Python adaptation). Then Nixtla's own docs, and `statsmodels`/`sktime`/`Prophet`.

**4. Model deployment and MLOps**

Every notebook ends at `joblib.dump`. Nothing on serving, monitoring, or drift. Given your ASP.NET and Docker background this is the *easiest* gap for you to close and the one that most differentiates you — most data scientists cannot ship.

The stack: **FastAPI** to serve the pipeline, **Docker** to package it (you have this), **MLflow** for experiment tracking and a model registry, **Evidently** for drift detection.

*Learn from:* the FastAPI docs; **Designing Machine Learning Systems**, Chip Huyen — the best book on the engineering side of ML, and the one most aligned with your background.

### Tier 2 — fill these next

**5. Statistical inference**

The capstone uses chi-square and ANOVA, but there is no coverage of confidence intervals, hypothesis-testing logic, p-value interpretation, statistical power, or A/B testing. Data roles ask about all of these, and "is this difference real?" is a question you will be asked constantly.

*Learn from:* **Practical Statistics for Data Scientists**, Bruce & Bruce (O'Reilly) — short, Python-based, exactly the right level.

**6. Cross-validation variants**

`KFold` and `StratifiedKFold` only. Missing: `TimeSeriesSplit` (essential for FinSight), `GroupKFold` (needed for the capstone's own data), nested CV (the correct way to combine hyperparameter search with performance estimation).

**7. Feature selection**

Not covered as a topic. `SelectKBest`, recursive feature elimination, permutation importance, and the practice of dropping features that do not earn their place.

**8. Calibration**

`predict_proba` is used throughout, but nobody asks whether the probabilities are *honest*. A model that says "70%" should be right 70% of the time. Tree ensembles are typically badly calibrated. For FinSight — where a probability becomes a risk alert — this matters directly.

*Learn from:* scikit-learn's "Probability calibration" page; `CalibratedClassifierCV`.

**9. Precision-Recall curves**

The course covers ROC-AUC only. Under heavy imbalance, PR-AUC / average precision is the more informative metric (§8.8).

**10. Experiment tracking and reproducibility**

`random_state` is used consistently — good — but there is no environment pinning, no run tracking, no data versioning. `requirements.txt` appears once, in the ANN assignment.

*Learn from:* MLflow; DVC for data versioning; `uv` or Poetry for environments.

### Tier 3 — know they exist

**11. Modern NLP** — the course stops at TF-IDF. Transformers, embeddings, fine-tuning, RAG. You are already doing this work in `E:\GenAI` and FinSight, so you are learning it in parallel; Part 10 §10.8 maps the connection.

**12. Deep learning breadth** — one dense network. No CNNs, RNNs, attention, transfer learning. Your SER thesis actually used a pretrained HuBERT transformer, so you have more practical exposure here than the course gave.

**13. Causal inference** — the entire course is correlational. "Does X cause Y?" needs different machinery: DAGs, confounders, propensity scores, difference-in-differences. The capstone's "unlit street lights cause severe accidents" claim is exactly the sort of statement that needs it.

*Learn from:* **The Book of Why**, Judea Pearl (accessible); **Causal Inference: The Mixtape**, Scott Cunningham (free online).

**14. Fairness, bias and ethics** — nothing. The capstone predicts injury severity using `Sex of Casualty` and `Age of Casualty`, which is precisely where these questions arise.

**15. Big data tooling** — everything fits in memory. Spark/PySpark, Dask, Polars, and the modern warehouse stack (dbt, DuckDB) are absent. You have HCIA Big Data material on `E:` already.

**16. Recommender systems, anomaly detection, survival analysis, reinforcement learning** — whole families of problem not touched.

---

<figure class="dia"><svg viewBox="0 0 720 278" role="img" aria-label="The sixteen gaps from the original course grouped into three tiers, each pointing to the part of this course or the handbook module that now covers it">
<rect class="sR" x="14" y="14" width="220" height="30" rx="6"/><text class="sT" x="124" y="34" text-anchor="middle">Tier 1: fill first</text>
<rect class="sN" x="14" y="54" width="220" height="28" rx="5"/><text class="sC" x="24" y="73">gradient boosting</text><text class="sGt" x="224" y="73" text-anchor="end">→ 8B</text>
<rect class="sN" x="14" y="86" width="220" height="28" rx="5"/><text class="sC" x="24" y="105">regularisation</text><text class="sGt" x="224" y="105" text-anchor="end">→ 7</text>
<rect class="sN" x="14" y="118" width="220" height="28" rx="5"/><text class="sC" x="24" y="137">time series</text><text class="sGt" x="224" y="137" text-anchor="end">→ 19</text>
<rect class="sN" x="14" y="150" width="220" height="28" rx="5"/><text class="sC" x="24" y="169">deployment, MLOps</text><text class="sGt" x="224" y="169" text-anchor="end">→ DS8</text>
<rect class="sW" x="250" y="14" width="220" height="30" rx="6"/><text class="sT" x="360" y="34" text-anchor="middle">Tier 2: fill next</text>
<rect class="sN" x="250" y="54" width="220" height="28" rx="5"/><text class="sC" x="260" y="73">statistical inference</text><text class="sGt" x="460" y="73" text-anchor="end">→ 15</text>
<rect class="sN" x="250" y="86" width="220" height="28" rx="5"/><text class="sC" x="260" y="105">CV variants</text><text class="sGt" x="460" y="105" text-anchor="end">→ 6</text>
<rect class="sN" x="250" y="118" width="220" height="28" rx="5"/><text class="sC" x="260" y="137">feature selection</text><text class="sGt" x="460" y="137" text-anchor="end">→ DS2</text>
<rect class="sN" x="250" y="150" width="220" height="28" rx="5"/><text class="sC" x="260" y="169">calibration</text><text class="sGt" x="460" y="169" text-anchor="end">→ 8</text>
<rect class="sN" x="250" y="182" width="220" height="28" rx="5"/><text class="sC" x="260" y="201">PR curves</text><text class="sGt" x="460" y="201" text-anchor="end">→ 8</text>
<rect class="sN" x="250" y="214" width="220" height="28" rx="5"/><text class="sC" x="260" y="233">experiment tracking</text><text class="sGt" x="460" y="233" text-anchor="end">→ DS8</text>
<rect class="sB" x="486" y="14" width="220" height="30" rx="6"/><text class="sT" x="596" y="34" text-anchor="middle">Tier 3: know they exist</text>
<rect class="sN" x="486" y="54" width="220" height="28" rx="5"/><text class="sC" x="496" y="73">modern NLP, RAG</text><text class="sGt" x="696" y="73" text-anchor="end">→ 20–21</text>
<rect class="sN" x="486" y="86" width="220" height="28" rx="5"/><text class="sC" x="496" y="105">deep learning breadth</text><text class="sGt" x="696" y="105" text-anchor="end">→ 17–22</text>
<rect class="sN" x="486" y="118" width="220" height="28" rx="5"/><text class="sC" x="496" y="137">causal inference</text><text class="sGt" x="696" y="137" text-anchor="end">→ DS5</text>
<rect class="sN" x="486" y="150" width="220" height="28" rx="5"/><text class="sC" x="496" y="169">fairness</text><text class="sGt" x="696" y="169" text-anchor="end">→ DS4</text>
<rect class="sN" x="486" y="182" width="220" height="28" rx="5"/><text class="sC" x="496" y="201">big-data tools</text><text class="sGt" x="696" y="201" text-anchor="end">→ DE5–DE6</text>
<rect class="sN" x="486" y="214" width="220" height="28" rx="5"/><text class="sC" x="496" y="233">recsys, anomalies, RL</text><text class="sGt" x="696" y="233" text-anchor="end">→ 9, 24</text>
<text class="sS" x="360" y="266" text-anchor="middle">numbers are parts of this course; DS and DE are handbook modules: every original gap is now covered</text>
</svg><figcaption>The gap list as a study map: each gap points to where it is now taught.</figcaption></figure>

## 14.3 Errors and rough edges in the source notebooks

Worth fixing if you re-run them, and worth being able to spot in general:

| Location | Issue |
|---|---|
| `lec_3_OOP.ipynb` | `get_dog_count` returns `cls.get_dog_count` (the method object) instead of `cls.dog_count` |
| `00-Data Cleaning` | `df[cond]['col'] = value` chained assignment — silently does nothing; the `.loc` version follows |
| Several `2025-12-19` notebooks | Path typo `../dastasets/` for `../datasets/` |
| `02-Work with Categorical` | `Encoder.get_feature_names()` — renamed to `get_feature_names_out()` in sklearn ≥1.0 |
| `02-Work with Categorical` | `OneHotEncoder(sparse=False)` — renamed to `sparse_output` in sklearn ≥1.2 |
| `Pandas_2.ipynb` | `pr.read_sql` should be `pd.read_sql` |
| `Seaborn_summary` | `shade=True` deprecated in favour of `fill=True` |
| `03-Outliers` | Depends on `datasist` for what is four lines of Pandas |
| `train.py` (ANN) | Comment says `'min' because we want to minimize loss` while the code correctly uses `mode='max'` |
| Capstone | `shap.TreeExplainer(best_pipe)` — needs the unwrapped model and transformed X |
| Capstone | `multi_class="multinomial"` deprecated in current sklearn |
| Throughout | Heavy `inplace=True`; being removed in Pandas 3.0 |
| Throughout | `warnings.filterwarnings('ignore')` at the top hides real `SettingWithCopyWarning`s |

**None of these invalidate the teaching.** Spotting them is part of the refresher — real code has this texture, and being able to read past a stale comment or a deprecated keyword is a skill.

---

## 14.4 A concrete plan

Given your background and what you are already building, in priority order:

### Immediate (this month)

1. **Re-run the capstone notebook** on a current environment. Fix the deprecations. Add `GroupKFold`, fix the SHAP call, add PR curves. You now have a portfolio piece that demonstrates both ML competence and the judgement to critique your own work.

2. **Add `HistGradientBoostingClassifier` to that leaderboard.** One line, and it will very likely win. It closes Tier 1 gap #1 by doing rather than reading.

3. **Write `profile_dataframe()` and `IQRClipper` into a small personal `dslib` package.** Pip-installable from a local path. Every future project starts from it.

### Near term (next three months)

4. **Time series properly**, because FinSight depends on it. Work through *Forecasting: Principles and Practice* Ch. 1–5 and 8. Then re-examine FinSight's TimeGPT integration with backtesting: does the forecast actually beat a seasonal-naive baseline? That is the `DummyClassifier` question in a forecasting costume, and it is the first thing a technical reviewer will ask.

5. **Deploy one model.** Take the road-accidents pipeline, wrap it in FastAPI, containerise it, add a `/predict` endpoint and a `/health` check. You already know Docker and REST; this is a weekend, and it is the thing most ML candidates cannot do.

6. **Add MLflow to one project.** Track runs, params, metrics, artifacts. It replaces `metrics.json` with something you can actually query.

7. **Read ISLR chapters 2, 3, 5, 6, 8.** It is the rigour under everything in Parts 6–8, and it is free.

### Ongoing

8. **Practise SQL window functions** on StrataScratch or DataLemur until they are automatic (§12.5).

9. **Enter one Kaggle competition properly** — not for the medal, but to read the top solutions afterwards. That is the fastest available calibration of what "good" looks like.

10. **Write up one project publicly.** A blog post or a polished GitHub README on the road-accidents analysis. The findings are genuinely interesting and the write-up is already half-drafted in `AI_Project/readme.md`.

---

## 14.5 The reading list, consolidated

**Free and online:**

| Resource | For |
|---|---|
| **ISLR** — https://www.statlearning.com/ | The statistical foundation. Start here. |
| **Forecasting: Principles and Practice** — https://otexts.com/fpp3/ | Time series |
| **Python for Data Analysis** — https://wesmckinney.com/book/ | Pandas, from its author |
| **Fundamentals of Data Visualization** — https://clauswilke.com/dataviz/ | Charts that work |
| **Interpretable ML** — https://christophm.github.io/interpretable-ml-book/ | SHAP and explanation |
| **Speech and Language Processing** — https://web.stanford.edu/~jurafsky/slp3/ | NLP, classical → modern |
| **Neural Networks and Deep Learning** — http://neuralnetworksanddeeplearning.com/ | Backprop from scratch |
| **MLU-Explain** — https://mlu-explain.github.io/ | Interactive intuition for everything in Part 6 |
| **Google ML Crash Course** — https://developers.google.com/machine-learning/crash-course | Structured basics |
| **scikit-learn User Guide** | The reference. Read the "Common pitfalls" page. |

**Books worth buying:**

| Book | For |
|---|---|
| **Hands-On ML with Scikit-Learn and PyTorch**, Géron | The single best practical ML book. The **complete** edition (Ch. 1–19) sits in this folder; its content is integrated into Parts 4–11 and 17–24 (see Part 00). |
| **Designing Machine Learning Systems**, Chip Huyen | The engineering half. Best fit for your background. |
| **Practical Statistics for Data Scientists**, Bruce & Bruce | The inference gap |
| **Feature Engineering for Machine Learning**, Zheng & Casari | Part 4, deeper |
| **Effective Pandas**, Matt Harrison | Idiomatic, chainable Pandas |
| **Fluent Python**, Ramalho | Python beyond the basics |
| **SQL for Data Scientists**, Teate | Analytical SQL patterns |

**Video:**

- **StatQuest** — intuition for every algorithm in this course
- **3Blue1Brown** — *Essence of Linear Algebra*, *Neural Networks*
- **Andrej Karpathy, *Neural Networks: Zero to Hero*** — builds backprop, then a transformer, from scratch. The best deep-learning content available anywhere.

---

## 14.6 The one-page summary of the whole course

If you retain nothing else from these fourteen documents:

1. **Fit on train, transform everything.** Every learned statistic — means, σ, category vocabularies, SMOTE points — comes from training data only.

2. **Your model is a `Pipeline`, not an estimator.** It makes leakage structurally impossible and ships preprocessing with the weights.

3. **Baseline first.** `DummyClassifier` before anything else. If you cannot beat it, you have not built anything.

4. **Accuracy is usually the wrong metric.** Choose the metric before you see results, and choose it from the cost of the errors, not from convenience.

5. **Look at the data.** Profile it, plot it, check its ranges against physical reality. More projects are saved here than in model selection.

6. **The best features come from domain knowledge**, often from outside the dataset — sunrise times, holidays, geography.

7. **Report the standard deviation, not just the mean.** One split is one sample.

8. **Scale for distance and gradients; do not bother for trees.**

9. **Complexity must earn its place.** Linear regression beat KNN in Part 7. Gradient boosting beats neural networks on tabular data. Start simple.

10. **Half the value is in the write-up.** "Motorcycles over 500cc have a 42% serious/fatal rate versus 8% for cars" is worth more than any F1 score, because someone can act on it.

---

> [!check] ✅ Key takeaways
> - Your strong ground: preprocessing, pipelines, classical ML, evaluation, SQL, statistics.
> - Former gaps (boosting, regularisation, time series, deep learning, modern NLP, RL) are now covered in Parts 8B–25.
> - Remaining depth to build: MLOps in practice, causal inference, and a deployed portfolio project.
> - Answer "what are you learning?" with one gap, one plan, and one recent project.

<!-- nav -->
> [!example] 🧭 Step 25 of 26 · Stage 7 of 7: Interview & beyond
> ← [Part 25 · SOTA roadmap](25_State_of_the_Art_and_Learning_Roadmap.md) · [Part 16 · Interview hub (e&)](16_Interview_Prep_eand_Egypt.md) → · [Course map](00_START_HERE.md)
<!-- /nav -->
