# The AI Journey — A Complete Written Course, Tuned for Data-Science Interviews

<!-- nav -->
> [!example] 🧭 Start
> [Part 01 · Python](01_Python_Foundations.md) →
<!-- /nav -->

**Goal:** pass an **entry- to mid-level data scientist** interview at a multinational telecom such as **e& (Etisalat) Egypt**, with a foundation strong enough to grow into senior work.

**Built from:** your course (25 notebooks, 15 lectures, 1 Dec 2025 → 25 Jan 2026) + Aurélien Géron, *Hands-On Machine Learning with Scikit-Learn and PyTorch* (O'Reilly, 2025, **complete edition, Ch. 1–19 + appendices** — the PDF in this folder) + interview material the book doesn't cover (SQL, statistics, A/B testing, telecom domain, current state of the art).

---

## 🧭 How to use this course (read this first)

| Step | Do this | Why |
|---|---|---|
| 1 | Decide your **target level** (table below). | It tells you which sections you can skim. |
| 2 | Open each part and read its **🎯 Interview focus** card first. | It lists what each level must be able to do, the most-asked questions, and the time budget. |
| 3 | Use the **🗺️ Section map** in each part. | Every section has a level badge and the **exact Géron pages** to check. |
| 4 | Read the **💬 Say it in the interview** boxes aloud as you go. | Each is a ready 1–2 sentence answer to the section's most likely question. |
| 5 | Finish each part with its **✅ Key takeaways**, then the **Interview drill** or **⚡ quick-fire** table — answer out loud. | Speaking the answer is the skill being tested. |
| 6 | Follow the **🧭 Previous / Next** links at the top and bottom of every part. | They walk the learning path in order, from basic to advanced. |
| 7 | In the final week, live in **[Part 16](16_Interview_Prep_eand_Egypt.md)** (the interview hub). | Cases, the 90-question bank, mock answers, study plan. |

**Legend used everywhere**

| Badge | Meaning |
|---|---|
| 🟢 **Entry** | Junior / associate DS (0–2 yrs). You must answer these confidently. |
| 🟡 **Mid** | DS (2–5 yrs). Expected at mid level; an entry candidate who knows it stands out. |
| 🔴 **Senior / specialist** | Senior, lead or specialist (CV, NLP, RL). For entry/mid: know the one-line idea only. |
| ⭐ | Frequently asked in interviews. |
| 📖 | Where it is in Géron (2025): chapter and **page numbers of the final printed edition**. |
| 🔭 | State of the art (2025–26), beyond the book. |

![Course map](figures/fig00_course_map.png)
*The course map. Colour = the level at which each part is typically tested.*

---

## 🎚️ What each level is expected to know

![Level expectations](figures/fig16_level_expectations.png)

| | 🟢 Entry (0–2 yrs) | 🟡 Mid (2–5 yrs) | 🔴 Senior (5+ yrs) |
|---|---|---|---|
| **Typical titles** | Junior / Associate DS, Data Analyst → DS | Data Scientist, ML Engineer | Senior / Lead DS, Staff, specialist |
| **Interviewers test** | Fundamentals, clean pandas/SQL, metrics, one project told well | Choosing and defending methods, end-to-end ownership, experimentation, deployment basics | System design, trade-offs, ambiguity, mentoring, business impact |
| **Python / pandas / SQL** | Filter, group, join, window basics | Fast, idiomatic, window functions, cohort queries | Performance, data modelling, code review |
| **Statistics** | CIs, p-values, Bayes, CLT | Full A/B design, power, pitfalls | Causal inference, CUPED, sequential tests |
| **Classical ML** | Pipelines, CV, bias–variance, logistic/trees/RF, metrics | GBMs, thresholds from costs, calibration, SHAP, error analysis | Model strategy, fairness, risk |
| **Deep learning / GenAI** | Concepts: neurons, backprop, what an LLM and RAG are | PyTorch loop, fine-tuning, RAG design, evaluation | Serving, cost, agents, LLM ops, security |
| **Production** | Save/load a pipeline, what drift is | FastAPI/Docker, monitoring, retraining | Platform and MLOps design |
| **Parts to master** | 1–9, 12, 13, 15, 16 | + 8B, 10, 11, 17, 19, 21 | + 18, 20, 22–25 in depth |

---

## 📚 The parts — one learning path, from basic to advanced

Follow the steps in order. Each part opens and ends with a **🧭 Previous / Next** line, and the website follows the same order. 26 steps in 7 stages.

### Stage 1: Toolkit

The tools every coding round uses.

| Step | Part | Covers | Level | 📖 Géron |
|:---:|---|---|:---:|---|
| 1 | [01 Python](01_Python_Foundations.md) | Comprehensions, functions, `*args/**kwargs`, `map`/`filter`/`lambda`, OOP | 🟢 | — |
| 2 | [02 NumPy](02_NumPy.md) | Arrays, indexing, masking, broadcasting, linear algebra, vectorisation | 🟢 | — |
| 3 | [03 Pandas](03_Pandas.md) | `loc`/`iloc`, filtering, dtypes, datetimes, `groupby`, `merge`, pivots | 🟢 | — |
| 4 | [12 SQL](12_SQL_for_Data.md) | Joins, windows, CTEs, 13 telecom interview problems | 🟢 ⭐ | — |

### Stage 2: Data & statistics

Preparing and exploring data, and the statistics interviews test.

| Step | Part | Covers | Level | 📖 Géron |
|:---:|---|---|:---:|---|
| 5 | [04 Cleaning & preprocessing](04_Data_Cleaning_and_Preprocessing.md) | Missing data, encoding, outliers, splits, imbalance, scaling, leakage-free pipelines | 🟢 🟡 | Ch. 2 |
| 6 | [05 Visualisation & EDA](05_Visualization_and_EDA.md) | Choosing charts, Seaborn/Plotly, EDA workflow and storytelling | 🟢 | Ch. 2 |
| 7 | [15 Statistics & A/B testing](15_Statistics_Probability_and_AB_Testing.md) | Probability, CLT, CIs, tests, A/B design, paradoxes, puzzles | 🟢 🟡 ⭐ | — |

### Stage 3: Classical ML

The core of every DS interview, from foundations to ensembles and clustering.

| Step | Part | Covers | Level | 📖 Géron |
|:---:|---|---|:---:|---|
| 8 | [06 ML foundations](06_ML_Foundations.md) | Learning, gradient descent, bias–variance, CV, metrics, framing, deployment | 🟢 ⭐ | Ch. 1, 2, 4 |
| 9 | [07 Regression](07_Supervised_Regression.md) | Linear/KNN regression, normal equation, GD variants, learning curves, Ridge/Lasso | 🟢 | Ch. 4 |
| 10 | [08 Classification](08_Supervised_Classification.md) | Logistic/KNN/trees, confusion matrix, PR/ROC, thresholds, calibration, profit decisions | 🟢 ⭐ | Ch. 3, 4 |
| 11 | [08B Trees & ensembles](08B_Trees_and_Ensembles.md) | CART, bagging, RF, boosting, XGBoost/LightGBM/CatBoost, stacking, SHAP | 🟢 🟡 ⭐ | Ch. 5, 6 |
| 12 | [09 Unsupervised](09_Unsupervised_PCA_and_Clustering.md) | PCA, K-Means, DBSCAN, GMM, anomaly detection, semi-supervised | 🟢 🟡 | Ch. 7, 8 |

### Stage 4: Applied ML

Text, neural networks, and your end-to-end project story.

| Step | Part | Covers | Level | 📖 Géron |
|:---:|---|---|:---:|---|
| 13 | [10 NLP (classical + Arabic)](10_NLP.md) | Tokenisation, TF-IDF, cosine similarity, Egyptian dialect & Franco-Arabic | 🟢 🟡 | Ch. 14 (modern view) |
| 14 | [11 Neural networks](11_Neural_Networks.md) | MLPs, backprop, Keras project, full PyTorch workflow, Optuna | 🟢 🟡 | Ch. 9, 10 |
| 15 | [13 Capstone](13_Capstone_Road_Accidents.md) | The "industrial" end-to-end classification template — your project story | 🟢 ⭐ | — |

### Stage 5: Deep learning

How deep networks are trained, then images, sequences and attention.

| Step | Part | Covers | Level | 📖 Géron |
|:---:|---|---|:---:|---|
| 16 | [17 Training deep networks](17_Training_Deep_Neural_Networks.md) | Initialisation, normalisation, optimisers, schedules, regularisation, mixed precision, quantisation | 🟡 | Ch. 11, App. A–B |
| 17 | [18 CNNs & vision](18_Computer_Vision_CNNs.md) | Convolutions, ResNet, transfer learning, detection, segmentation | 🟡 🔴 | Ch. 12 |
| 18 | [19 Time series & RNNs](19_Sequences_RNNs_and_Time_Series.md) | Baselines, SARIMA, RNN/LSTM/GRU, forecasting playbook, foundation models | 🟢 🟡 ⭐ | Ch. 13 |
| 19 | [20 NLP + attention](20_NLP_RNNs_HuggingFace_and_Attention.md) | Embeddings, tokenisers, Hugging Face, decoding, seq2seq, attention | 🟡 | Ch. 14 |

### Stage 6: Modern AI

Transformers, LLMs and RAG, vision-language models, generative models, RL.

| Step | Part | Covers | Level | 📖 Géron |
|:---:|---|---|:---:|---|
| 20 | [21 Transformers, LLMs, RAG](21_Transformers_LLMs_RAG_and_Agents.md) | Transformer, BERT/GPT, SFT/RLHF/DPO, LoRA, RAG, agents, MCP, serving | 🟢 🟡 ⭐ | Ch. 15, 17 (online) |
| 21 | [22 ViT & multimodal](22_Vision_and_Multimodal_Transformers.md) | ViT, DINO/MAE, CLIP, VLMs | 🟡 🔴 | Ch. 16 |
| 22 | [23 Generative models](23_Generative_Models_Autoencoders_GANs_Diffusion.md) | Autoencoders (anomalies), VAEs, GANs, diffusion, synthetic data | 🟡 🔴 | Ch. 18 |
| 23 | [24 RL & bandits](24_Reinforcement_Learning.md) | MDPs, Q-learning, DQN, PPO, RLHF/GRPO, bandits for offers | 🟡 🔴 | Ch. 19 |

### Stage 7: Interview & beyond

Pull it together: the state of the art, honest gaps, and the interview hub for the final week.

| Step | Part | Covers | Level | 📖 Géron |
|:---:|---|---|:---:|---|
| 24 | [25 SOTA roadmap](25_State_of_the_Art_and_Learning_Roadmap.md) | Foundation → SOTA ladder, best tool per problem, sources, case studies | 🟢 🟡 | — |
| 25 | [14 Gaps & next steps](14_Gaps_and_Where_To_Go_Next.md) | Honest audit, status of every gap, reading list | — | — |
| 26 | [16 Interview hub (e&, telecom)](16_Interview_Prep_eand_Egypt.md) | Telecom KPIs, 11 use cases, case framework, deployment, 90 questions, mock answers, study plan | 🟢 🟡 ⭐ | — |

---
## 🗓️ Study paths by target and time

| Your situation | Path |
|---|---|
| **Entry interview in ≤ 2 weeks** | 16 (§16.1–16.5) → 6 → 8 (§8.7, 8.8, 8.12.3–8.12.5, 8.14) → 8B (§8B.1, 8B.4–8B.6) → 12 §12.6 → 15 (§15.3–15.7) → 13 (rehearse the story) → 16 §16.9 questions 1–60 → 21 §21.2, §21.7 (RAG basics). Read only 🟢 sections. |
| **Entry → mid, 4 weeks** | Follow [Part 16 §16.11](16_Interview_Prep_eand_Egypt.md): weeks 1–4. Read 🟢 and 🟡 sections of Parts 1–16. |
| **Mid-level / AI-flavoured role, 6 weeks** | The 4-week plan + weeks 5–6 in §16.11: Parts 17 → 19 → 20 → 21 → 25; skim 18, 22–24 (🟡 sections only). |
| **After you're hired** | Part 25 §25.5 (90-day and 18-month plan); deepen one specialism. |

**Rule for every path:** a section marked 🔴 is "know the idea in one sentence" unless you are applying for that specialism.

---

## 📖 Where each Géron chapter lives (final 2025 edition)

| Géron chapter (pages) | Course location |
|---|---|
| 1 — The ML Landscape (pp. 3–40) | Part 6 §6.8–6.10, §6.13 |
| 2 — End-to-End ML Project (pp. 41–105) | Part 4 §4.2–4.10, Part 5 §5.8, Part 6 §6.5, §6.11–6.12, Part 7 §7.6 |
| 3 — Classification (pp. 107–134) | Part 8 §8.8, §8.12, §8.14, §8.17 |
| 4 — Training Models (pp. 135–178) | Part 6 §6.2–6.3, Part 7 §7.14–7.19, Part 8 §8.13 |
| 5 — Decision Trees (pp. 179–194) | Part 8B §8B.1 |
| 6 — Ensemble Learning & Random Forests (pp. 195–220) | Part 8B §8B.2–8B.10 |
| 7 — Dimensionality Reduction (pp. 221–244) | Part 9 §9.1–9.5, §9.11–9.15 |
| 8 — Unsupervised Learning (pp. 245–282) | Part 9 §9.7, §9.16–9.21 |
| 9 — Intro to Artificial Neural Networks (pp. 285–315) | Part 11 §11.9 |
| 10 — Building NNs with PyTorch (pp. 317–361) | Part 11 §11.10–11.16 |
| 11 — Training Deep Neural Networks (pp. 363–416) | Part 17 §17.1–17.6, §17.10 |
| 12 — Deep Computer Vision with CNNs (pp. 417–482) | Part 18 |
| 13 — Processing Sequences with RNNs and CNNs (pp. 483–524) | Part 19, Part 16 §16.4 |
| 14 — NLP with RNNs and Attention (pp. 525–576) | Part 20, Part 10 §10.2, §10.8 |
| 15 — Transformers for NLP and Chatbots (pp. 577–642) | Part 21 §21.1–21.8, §21.12 |
| 16 — Vision and Multimodal Transformers (pp. 643–694) | Part 22 |
| 17 — Speeding Up Transformers (online, homl.info) | Part 21 §21.9 |
| 18 — Autoencoders, GANs, and Diffusion Models (pp. 695–740) | Part 23 |
| 19 — Reinforcement Learning (pp. 741–786) | Part 24 |
| Appendix A — Autodiff (p. 787) · Appendix B — Mixed Precision & Quantization (p. 795) | Part 17 §17.8, §17.7 |
| SVMs (online chapter, homl.info) | Part 8 §8.16 |

**Accuracy note (September 2026):** Parts 4–11 were first written from the 2025 *early release*. Every number quoted from the book has since been re-checked against the **final edition**, and the ones that changed were corrected. Examples: the test RMSE is 41,445 (95% CI 39,521–43,702); the Fashion-MNIST MLP gets 87.1% test accuracy; the representative- images result is 83.4%; the survey example uses 51.6% female. Every chapter's end-of-chapter **exercises are answered** in the matching "Interview drill" section.

---

## 💡 Five ideas that carry the whole course

If you remember nothing else, remember these. Every part is an elaboration — and each one is a strong interview answer on its own.

| # | Idea | Say it like this in an interview |
|---|---|---|
| 1 | **Fit on train, transform everything.** | "Every statistic — imputation means, scaler σ, encoder vocabularies, SMOTE samples — is learned on the training fold only. Otherwise the test score is a lie." |
| 2 | **A model is a pipeline, not an estimator.** | "`Pipeline([impute, scale, encode, model])` is what I cross-validate, save and serve, so raw rows go in at inference." |
| 3 | **Accuracy is usually the wrong metric.** | "On 89% 'Slight' accidents, a dummy scores 89%. I report F1-macro or PR-AUC and always show the dummy baseline." |
| 4 | **Look at the data before you model it.** | "EDA found motorcyclists have ~42% serious/fatal outcomes vs ~8% for cars — a finding the classifier alone wouldn't give." |
| 5 | **Scaling matters for distances and gradients, not trees.** | "KNN, SVM, logistic regression, neural networks and PCA need scaling; tree ensembles don't." |

---

## Who this is written for

You: an engineer with **comfortable Python** and **web development** (ASP.NET, Angular, SQL Server, Docker). The course leans on that:

- **Web-dev analogues** where they exist: a scikit-learn `Pipeline` is middleware; `fit`/`transform` is a two-phase lifecycle; data leakage is a cache-invalidation bug.
- **SQL transfers directly:** `groupby` *is* `GROUP BY`, `merge` *is* `JOIN`.
- **Maths is not skipped**, but intuition comes first and the formula second, because in an interview you must defend choices, not derive them.

## What this is

A written reconstruction of the course — every concept, in order, with the code from your own notebooks — refined twice with Géron's book and extended for interviews and the 2025–26 state of the art. **It replaces re-watching 3.2 GB of video.**

**Source material:** `C:\Users\gehaz\OneDrive\Desktop\AI journey` — 25 notebooks across 14 dated sessions, 15 lecture recordings (Lec 1–13), 3 SQL scripts, 3 assignments, 1 collective project and `oop.pdf`.

## 📱 Reading on your phone (Obsidian) or in the browser

**Obsidian on Android**
1. Copy the whole course folder to your phone (keep `figures/` next to the `.md` files).
2. In Obsidian: *Open folder as vault* → pick the folder. The included `.obsidian/app.json` hides the backup and `site/` folders so search stays clean.
3. The boxes are Obsidian **callouts**: 🎯 focus cards, 💬 soundbites, 📖 book pages and ✅ takeaways; the 🗺️ section map is collapsed — tap it to open.
4. Links between parts and the figures work offline.

**Website** — `site/index.html` is the same content with search, a level filter, flash cards and progress tracking. Rebuild it after editing any `.md` file with `python site/build_site.py`. If you change the learning order in `site/learning_path.py`, also run `python site/update_md_nav.py` to refresh the Previous/Next lines.

**Figures:** all illustrations are in `figures/` and are regenerated by `python figures/make_figures.py` (they are drawn for this course, not copied from the book). A backup of the pre-refinement text is in `_backup_2026-09-26_before_interview_refinement/`.

## A note on the source material's rough edges

Your notebooks contain typos, half-finished cells and a few wrong lines. The code is kept faithful where it is instructive, and the errors are **flagged** where they would mislead — for example the `get_dog_count` classmethod that returns the method object instead of the counter, and the chained assignment `df[df['height(cm)'] < 100]['height(cm)'] = median`, which silently does nothing. Paths are also inconsistent (`../dastasets/` is a recurring typo for `../datasets/`). The full list is in Part 14 §14.3.

---

<!-- nav -->
> [!example] 🧭 Start
> [Part 01 · Python](01_Python_Foundations.md) →
<!-- /nav -->
