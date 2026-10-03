# Part 25 — From Foundations to State of the Art: Map, Sources and Roadmap

<!-- nav -->
> [!example] 🧭 Step 24 of 26 · Stage 7 of 7: Interview & beyond
> ← [Part 24 · RL & bandits](24_Reinforcement_Learning.md) · [Part 14 · Gaps & next steps](14_Gaps_and_Where_To_Go_Next.md) → · [Course map](00_START_HERE.md)
<!-- /nav -->

**Purpose:** tie the whole course together. This part shows **how each foundation leads to today's state of the art**, gives a **curated, trustworthy source list**, a **catalogue of real-world case studies** you can cite in interviews, and a **plan to keep learning** after you're hired. Snapshot as of **late 2025 / 2026** — the field moves fast, so the sources section tells you where to check for updates.

<!-- interview-focus -->

> [!tip] 🎯 Interview focus
> **Why it matters:** "What recent AI development excites you?" and "how do you keep up?" are standard closing questions. Mid and senior candidates are expected to have an opinion.
>
> | Level | What you should be able to do |
> |---|---|
> | 🟢 **Entry** | Two current developments you can explain simply (e.g. RAG, reasoning models) and your learning routine. |
> | 🟡 **Mid** | Pick the right tool per problem (the §25.2 cheat-sheet); cite 2–3 real case studies with lessons. |
> | 🔴 **Senior** | Judge new techniques critically: cost, data fit, risk; set a team's technology direction. |
>
> **⭐ Most-asked:** *What recent AI development excites you, and would it matter for e&?* · *How do you keep up with the field?* · *Tell me about an ML project that failed in industry and why.* · *LightGBM or a foundation model for this problem?*
>
> **⏱ Time:** 1–2 h  ·  **Short on time?** Read §25.2, §25.4, §25.7.

**Legend:** 🟢 Entry (0–2 yrs) · 🟡 Mid (2–5 yrs) · 🔴 Senior / specialist · ⭐ frequently asked · 📖 Géron, *Hands-On ML with Scikit-Learn and PyTorch* (2025) pages

> [!abstract]- 🗺️ Section map — level and book pages
>
> | § | Section | Level | 📖 Book |
> |---|---|:---:|---|
> | 25.1 | The ladder: every SOTA idea stands on a foundation | 🟢 | — |
> | 25.2 | What "state of the art" means in practice (and what interviewers want) | 🟢 ⭐ | — |
> | 25.3 | Curated sources (quality over quantity) | 🟢 | — |
> | 25.4 | Real-world case-study catalogue (cite these in interviews) | 🟢 ⭐ | — |
> | 25.5 | The continuous-learning plan (after the course) | 🟢 | — |
> | 25.6 | e& / Egypt relevance recap | 🟢 ⭐ | — |
> | 25.7 | Final self-check — can you explain these to a non-expert in 60 seconds? | 🟢 ⭐ | — |
>

---

## 25.1 The ladder: every SOTA idea stands on a foundation 🟢

![The ladder from foundations to 2025–26 practice.](figures/fig25_sota_ladder.png)
*The ladder from foundations to 2025–26 practice.*

Read this table left to right. If a right-hand column feels shaky, go back to the part in the left-hand column.

| Foundation (course part) | Builds into (intermediate) | State of the art (2025–26) |
|---|---|---|
| Python, NumPy, Pandas (01–03) | Vectorised feature pipelines | **Polars**, DuckDB, Arrow; PySpark on the lakehouse (Databricks/Snowflake) |
| Cleaning & preprocessing (04) | `ColumnTransformer` pipelines, leakage-free CV | Feature stores (Feast, Databricks), data contracts, Great Expectations / data validation |
| EDA & visualisation (05) | Hypothesis-driven EDA | Automated profiling (ydata-profiling), LLM-assisted analysis — *you* still check the story |
| Statistics & A/B testing (15) | Power, CUPED, sequential tests | Bandits (Part 24), **causal ML** (uplift models, DoubleML/EconML), always-valid inference |
| ML foundations: bias–variance, CV, metrics (06) | Proper validation, calibration | Conformal prediction for uncertainty, drift monitoring (Evidently), model cards |
| Linear/logistic regression, GD (07–08) | Regularisation, SGD, softmax | The same softmax + cross-entropy trains every LLM; AdamW/Muon are GD variants |
| Trees & ensembles (08B) | Random Forest, **XGBoost/LightGBM/CatBoost** | Still the **tabular champion**; tabular foundation models (**TabPFN v2**, 2025, *Nature*) win on small datasets |
| PCA & clustering (09) | Embeddings, anomaly detection | Vector databases, embedding clustering (BERTopic), UMAP/HDBSCAN |
| Classic NLP (10) | TF-IDF, word embeddings | Sentence embeddings, RAG, LLMs — TF-IDF/BM25 still used in **hybrid search** |
| Neural networks (11) | MLPs in PyTorch | Everything below |
| Training DNNs (17) | Init, BN/LN, Adam, schedules, dropout | RMSNorm, pre-norm, AdamW + cosine/WSD, **mixed precision (BF16/FP8)**, **QLoRA** |
| CNNs (18) | ResNet, transfer learning, YOLO | ConvNeXt, **YOLO11/RT-DETR**, **SAM 2**, DINOv2 features |
| RNNs & time series (19) | SARIMA → LSTM → multivariate | LightGBM with lag features (M5 winner), **TimesFM / Chronos / TimeGPT** foundation models |
| NLP with RNNs & attention (20) | Seq2seq, attention, HF tokenizers | Subword tokenisers for Arabic, `transformers` ecosystem |
| Transformers & LLMs (21) | BERT, GPT, fine-tuning | **RAG**, agents + **MCP**, reasoning models, LoRA fine-tuning, vLLM serving, evals |
| Vision & multimodal transformers (22) | ViT, CLIP | VLMs (GPT-4o/5, Gemini, Claude, Qwen-VL), document AI |
| Generative models (23) | VAE, GAN, DDPM | Latent diffusion, DiT, **flow matching**, video generation, synthetic tabular data |
| Reinforcement learning (24) | DQN, PPO | **RLHF / DPO / GRPO**, contextual bandits, network optimisation |
| SQL (12) | Window functions, CTEs | Still the #1 tested skill; dbt, lakehouse SQL, text-to-SQL copilots |

**The one-sentence story:** *Everything is gradient descent on a differentiable function chosen to fit the data's structure (images → convolution, sequences → recurrence → attention), evaluated honestly on held-out data, and deployed with monitoring.* If you can say that and unpack any word in it, you have a strong foundation.

---

## 25.2 What "state of the art" means in practice (and what interviewers want) 🟢 ⭐

> [!quote] 💬 Say it in the interview
> “For tabular problems gradient boosting is still my default; for text I compare a fine-tuned small model against an LLM with RAG; I adopt a new technique only if it beats a strong baseline at acceptable cost.”

An entry/mid-level data scientist at e& (or any large telco) is **not** expected to train frontier models. They are expected to:

1. **Pick the right tool:** gradient boosting for tabular churn; a fine-tuned small transformer or an LLM + RAG for Arabic/English text; a forecasting baseline before a foundation model.
2. **Know the SOTA exists and when it pays off:** "For 50 labelled examples I'd try TabPFN or few-shot an LLM; for 5M rows, LightGBM."
3. **Evaluate honestly:** baselines, leakage checks, business metrics, A/B tests.
4. **Ship and monitor:** pipelines, drift, retraining, cost.
5. **Handle risk:** privacy (Egypt PDPL Law 151/2020), fairness, LLM safety (OWASP LLM Top 10), explainability (SHAP).

### Current SOTA cheat-sheet by problem type (2025–26)

| Problem | Strong default | SOTA / when to upgrade |
|---|---|---|
| Tabular classification/regression | LightGBM / XGBoost / CatBoost + good features | TabPFN v2 (≤ ~10k rows), ensembles, AutoGluon |
| Time-series forecasting (many series) | LightGBM global model with lags + calendar | TimesFM 2.x, Chronos-Bolt, TimeGPT zero-shot; N-HiTS/PatchTST |
| Anomaly detection (KPIs) | Isolation Forest, robust z-scores, STL residuals | Autoencoders, forecasting-residual methods, foundation-model residuals |
| Text classification (Arabic/English) | TF-IDF + logistic regression baseline | Fine-tuned AraBERT/CAMeLBERT/XLM-R; LLM zero/few-shot; SetFit |
| Search / Q&A over documents | BM25 | Hybrid BM25 + embeddings + **reranker** RAG; agentic RAG |
| Chatbots / assistants | LLM API + RAG + guardrails | Agents with tools via **MCP**, evals, human handoff |
| Image classification/detection | Pretrained ConvNeXt/ViT fine-tune; YOLO | DINOv2 features, RT-DETR, SAM 2, VLMs for zero-shot |
| Document extraction (invoices, IDs) | OCR + rules | VLM-based extraction (Gemini/GPT/Claude/Qwen-VL), Donut, LayoutLMv3 |
| Recommendations / next-best-offer | Popularity + collaborative filtering / LightGBM ranker | Two-tower retrieval + ranker, **contextual bandits**, sequential transformers |
| Causal questions ("did the campaign work?") | A/B test, diff-in-diff | Uplift modelling, synthetic control, DoubleML |
| Speech (call centre) | Whisper transcription | Whisper large-v3 / Arabic-tuned ASR + LLM summarisation & QA |

---

## 25.3 Curated sources (quality over quantity) 🟢

### Books (in suggested order)
1. **Géron — *Hands-On ML with Scikit-Learn and PyTorch* (2025)** — this course's backbone.
2. **James, Witten, Hastie, Tibshirani — *An Introduction to Statistical Learning* (ISLP, Python edition)** — free PDF; best for theory at interview depth.
3. **Chip Huyen — *Designing Machine Learning Systems*** — production, data, monitoring.
4. **Chip Huyen — *AI Engineering* (2025)** — building apps on foundation models: RAG, agents, evaluation, fine-tuning.
5. **Jay Alammar & Maarten Grootendorst — *Hands-On Large Language Models*** — visual, practical LLM book.
6. **Simon Prince — *Understanding Deep Learning*** (free PDF) — the clearest modern DL theory.
7. **Sutton & Barto — *Reinforcement Learning*** (free).
8. **Hyndman & Athanasopoulos — *Forecasting: Principles and Practice* (3rd ed.)** — free online; the forecasting reference.
9. **Kohavi, Tang, Xu — *Trustworthy Online Controlled Experiments*** — the A/B-testing bible.
10. **Sebastian Raschka — *Build a Large Language Model (From Scratch)*** — implement GPT in PyTorch.

### Courses (free unless noted)
- **Andrew Ng — Machine Learning Specialization / Deep Learning Specialization** (Coursera) and **DeepLearning.AI short courses** (RAG, agents, LangGraph, MCP, fine-tuning) — short and current.
- **fast.ai — Practical Deep Learning for Coders** — top-down, practical.
- **Andrej Karpathy — "Neural Networks: Zero to Hero"** (YouTube; micrograd → GPT) and *"Deep Dive into LLMs like ChatGPT"* (2025).
- **Stanford CS229 (ML), CS231n (vision), CS224n (NLP), CS336 (LLMs from scratch, 2025)** — lectures on YouTube.
- **Hugging Face courses:** LLM/NLP course, Diffusion, Deep RL, Agents, MCP.
- **Full Stack Deep Learning / Made With ML (Goku Mohandas)** — MLOps.
- **Kaggle Learn** micro-courses (Pandas, SQL, feature engineering, time series).

### Papers you should be able to summarise in 2 sentences
*Attention Is All You Need* (2017) · BERT (2018) · GPT-3 "Language Models are Few-Shot Learners" (2020) · Scaling laws (Kaplan 2020) & **Chinchilla** (2022) · ResNet (2015) · ViT (2020) · CLIP (2021) · DDPM (2020) & Latent Diffusion (2021) · InstructGPT/RLHF (2022) · LoRA (2021) & QLoRA (2023) · RAG (Lewis 2020) · DPO (2023) · XGBoost (2016) · LightGBM (2017) · DeepSeek-R1 (2025).

### Blogs and newsletters (keep current)
- **Lilian Weng** (lilianweng.github.io) — deep, reliable surveys.
- **Jay Alammar** — *The Illustrated Transformer* and friends.
- **Sebastian Raschka — Ahead of AI** — monthly research digests.
- **Chip Huyen's blog**, **Eugene Yan** (applied ML, RecSys, LLM evals), **Hamel Husain** (LLM evals in practice).
- **The Batch** (DeepLearning.AI), **Import AI** (Jack Clark), **Latent Space** (AI engineering podcast/newsletter), **Interconnects** (Nathan Lambert — post-training/RL).
- Engineering blogs with real case studies: **Uber, Airbnb, Netflix, Spotify, DoorDash, Booking.com, Meta, Google Research, Vodafone, Ericsson, Nokia Bell Labs**.

### Leaderboards and benchmarks (know what they measure — and their limits)
- **LMArena** (formerly Chatbot Arena) — human pairwise preference Elo for LLMs.
- **Hugging Face Open LLM Leaderboard** (archived 2025) & **Open Arabic LLM Leaderboard (OALL)** and **BALSAM** — Arabic model evaluation.
- **MMLU-Pro, GPQA Diamond, AIME, SWE-bench Verified, Humanity's Last Exam, ARC-AGI** — reasoning/coding benchmarks quoted in model releases.
- **MTEB** — embedding models (pick RAG embedders here; check the Arabic subset).
- **Papers with Code** (sunset 2025; use HF Papers / arXiv trending), **Kaggle competitions** and write-ups of winning solutions — the best source of *practical* SOTA for tabular and time series.
- Caveats to mention: **benchmark contamination**, overfitting to leaderboards, English bias. Always evaluate on *your* data.

### Tools you should have touched
scikit-learn · pandas/Polars · LightGBM/XGBoost/CatBoost · PyTorch · Hugging Face `transformers`/`datasets`/`peft`/`trl` · SHAP · MLflow · FastAPI · Docker · Git · SQL · one cloud (Azure is common at e& group; AWS/GCP also used) · an LLM API · a vector store (pgvector, FAISS, Chroma, Qdrant) · Evidently (monitoring) · Airflow/Prefect (orchestration).

---

## 25.4 Real-world case-study catalogue (cite these in interviews) 🟢 ⭐

> [!quote] 💬 Say it in the interview
> “Zillow Offers shows why forecast uncertainty and drift matter: overconfident price predictions in a shifting market led to a write-down of more than $500M.”

Use the **STAR-for-case-studies** pattern: *problem → data → model → metric → business impact → lesson*.

### Telecom
| Case | What happened | Lesson |
|---|---|---|
| **Churn prediction** (industry-wide) | Gradient boosting on usage, billing, complaints, network-experience features; retention offers ranked by **uplift**, not just churn risk | Target *persuadable* customers; measure with holdout control groups |
| **Network anomaly detection** | Operators monitor millions of cell-KPI time series; seasonal baselines + ML flag degradations before customers complain | Alert fatigue kills systems — tune precision, group alerts |
| **RAN energy saving** | ML/RL-driven cell sleep features from Ericsson/Nokia/Huawei; operators report meaningful RAN energy reductions | Reward = savings − QoS penalty; trial in a digital twin first |
| **Customer-service GenAI** | Telcos (e.g., Vodafone's TOBi, Deutsche Telekom, e& and Etisalat's AI assistants) use LLM assistants for care and agent assist | RAG over up-to-date tariff docs, human handoff, Arabic dialect support |
| **Telco LLMs** | Global Telco AI Alliance (SK Telecom, Deutsche Telekom, e&, Singtel, SoftBank) collaborating on telco-specific LLMs | Domain adaptation + data sovereignty |
| **Fraud** (SIM-box, subscription fraud, IRSF) | Graph features + anomaly detection on CDRs | Extreme class imbalance → PR-AUC, cost-based thresholds |

### Other industries (classic, widely reported)
| Case | Why it's instructive |
|---|---|
| **Netflix Prize (2009)** | The winning ensemble was never fully deployed — engineering cost outweighed the gain. *Accuracy isn't everything.* |
| **Zillow Offers (2021)** | Home-price model errors + distribution shift → ~\$500M+ write-down, business shut down. *Forecast uncertainty and drift matter.* |
| **Google Flu Trends** | Overestimated flu for years — search behaviour changed. *Correlation drifts; validate against ground truth.* |
| **Amazon recruiting tool (2018)** | Learned gender bias from historical hires; scrapped. *Historical labels encode bias.* |
| **Air Canada chatbot ruling (2024)** | Airline held liable for its chatbot's invented refund policy. *You own your LLM's outputs → RAG + guardrails.* |
| **Klarna AI assistant (2024–25)** | Handled ~⅔ of chats in its first month; later rebalanced toward human agents for quality. *Measure CSAT, not just deflection.* |
| **Uber Michelangelo** | Platform standardising features, training, deployment for thousands of models. *MLOps is a force multiplier.* |
| **DeepMind data-centre cooling** | RL cut cooling energy up to ~40%. *Control problems with clear rewards suit RL.* |
| **AlphaFold** | Structure prediction for ~200M proteins; 2024 Nobel Prize. *Domain + DL + good benchmark (CASP).* |
| **M5 forecasting competition (Walmart)** | LightGBM with good features beat deep nets. *Match the model to the data.* |
| **DeepSeek-R1 (2025)** | Open reasoning model trained cheaply with GRPO shook markets. *Algorithmic efficiency matters as much as compute.* |

---

## 25.5 The continuous-learning plan (after the course) 🟢

### Phase A — Interview-ready (weeks 1–4)
Follow the 4-week plan in **Part 16**. Minimum proof of skill:
- 1 **tabular** project (churn/uplift) with pipeline, SHAP, cost-based threshold.
- 1 **SQL** portfolio (Part 12 problems, solved and explained).
- 1 **LLM/RAG** mini-project (Arabic + English FAQ bot over public e&/telecom docs, with an evaluation set).
- 1 **time-series** notebook (Part 19 playbook on a public dataset).

### Phase B — First 90 days in the job
- Learn the company's data model, KPIs, and data governance rules (PDPL, internal classification).
- Ship **one small model to production end-to-end** (even a simple one) rather than a perfect notebook.
- Build baselines and a monitoring dashboard before optimising.

### Phase C — Mid-level growth (months 3–18)
- Deepen **one specialism**: (a) experimentation & causal inference, (b) forecasting & anomaly detection for networks, (c) NLP/LLM engineering for Arabic, or (d) MLOps.
- Certifications that telcos recognise (optional): **Azure AI Engineer / Data Scientist Associate**, AWS ML Specialty, Databricks ML Associate, TensorFlow/PyTorch are less critical than a portfolio.
- Read **one paper a week** (skim abstract, figures, results; 30 min) and reproduce one per quarter.
- Enter one **Kaggle** competition per quarter; study top write-ups even if you don't place.

### Weekly routine (≈ 4 hours)
| Time | Activity |
|---|---|
| 1 h | Newsletter digest (Ahead of AI / The Batch) + one paper skim |
| 1.5 h | Hands-on: a small experiment, Kaggle notebook, or HF course unit |
| 1 h | Revisit a foundation (stats/SQL/ML theory) with flashcards |
| 0.5 h | Write: a short LinkedIn/blog post or internal note explaining what you learned |

### How to judge whether a "new SOTA" matters
1. Is it on **my kind of data** (tabular? Arabic? time series)?
2. Does it beat a **strong baseline** on an honest benchmark, or just a weak one?
3. What's the **cost** (latency, GPU, licence, data residency)?
4. Is there an **open implementation** and independent replication?
5. Would it change a **business decision**?

---

## 25.6 e& / Egypt relevance recap 🟢 ⭐

- **e& group** (formerly Etisalat group) operates **e& Egypt**; e& enterprise and e& life have AI/data units; group-level AI strategy includes partnerships with Microsoft (Azure OpenAI), and membership of the **Global Telco AI Alliance**.
- **Egypt's National AI Strategy (2nd edition, 2025–2030)** emphasises Arabic LLMs, AI talent, and responsible AI; Egypt's **Personal Data Protection Law 151/2020** governs customer data — know consent, purpose limitation, cross-border transfer rules.
- **Arabic AI:** Jais (G42/Inception, UAE), ALLaM (SDAIA, Saudi), Fanar (Qatar), Falcon (TII, UAE), plus multilingual Qwen/Llama/Gemma — interviewers in the region like candidates who understand **Egyptian dialect vs MSA** challenges (Part 10 §10.10).
- **Typical DS use cases there:** churn and retention, next-best-offer, credit scoring for device instalments / e& money (fintech), network KPI anomaly detection, capacity forecasting, call-centre analytics (ASR + LLM), fraud, geospatial site planning.

---

## 25.7 Final self-check — can you explain these to a non-expert in 60 seconds? 🟢 ⭐

- [ ] Bias–variance trade-off and how cross-validation diagnoses it
- [ ] Why gradient boosting dominates tabular data
- [ ] Precision vs recall and choosing a threshold with costs
- [ ] p-value, confidence interval, statistical power, sample size for an A/B test
- [ ] How backpropagation and Adam work
- [ ] Why transformers replaced RNNs (parallelism, long-range attention)
- [ ] What an embedding is and how RAG uses it
- [ ] Fine-tuning vs RAG vs prompting — when to use which
- [ ] How an LLM is trained (pretraining → SFT → RLHF/DPO → RL for reasoning)
- [ ] Diffusion in one sentence (learn to denoise; generate by denoising noise)
- [ ] Q-learning and PPO in one sentence each; bandit vs A/B test
- [ ] How you'd monitor a model in production and detect drift
- [ ] One telecom project end-to-end, with the business impact

If every box is ticked, you are ready. Good luck — and keep building.

---

> [!check] ✅ Key takeaways
> - Every state-of-the-art method stands on the foundations: data, statistics, classical ML, then deep learning.
> - Pick the tool per problem: GBMs for tabular, fine-tuned models or RAG for text, baselines before foundation models.
> - Cite real case studies with their lesson (Zillow, Netflix Prize, Air Canada, M5).
> - Keep learning with a weekly routine: a paper skim, a hands-on experiment, and one write-up.

<!-- nav -->
> [!example] 🧭 Step 24 of 26 · Stage 7 of 7: Interview & beyond
> ← [Part 24 · RL & bandits](24_Reinforcement_Learning.md) · [Part 14 · Gaps & next steps](14_Gaps_and_Where_To_Go_Next.md) → · [Course map](00_START_HERE.md)
<!-- /nav -->
