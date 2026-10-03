# Machine Learning in Production — Serving, Tracking, Monitoring and Retraining

A model in a notebook creates no value. Mid-level DS interviews increasingly ask how a model gets to users and stays good: batch or real time, how it's packaged and versioned, what you monitor, when you retrain. This is where your software-engineering background is a genuine advantage over typical data-science candidates: you've shipped APIs, containers, background jobs and CI pipelines. Your gaps file lists MLOps (MLflow, a model registry, drift monitoring) and "Python in production" as AI and DS gaps, and this module closes them conceptually; the lab closes them in practice.

> [!focus]
> **Entry must:** save and load a full pipeline; choose batch vs real-time scoring; wrap a model in an API; explain data drift; describe how you'd retrain.
> **Mid adds:** experiment tracking and a model registry with MLflow, training–serving skew and feature stores, drift and performance monitoring with delayed labels, shadow and canary deployments, champion–challenger, reproducibility, governance.
> **Most asked:** *How would you deploy this model?* · *Batch or real time?* · *What do you monitor after deployment?* · *What is data drift vs concept drift?* · *How often do you retrain?* · *What's training–serving skew?* · *How do you version models?*
> **Time budget:** 3.5 hours.

## DS8.1 What changes in production 🟢 ⭐

The model is a small part of a production ML system; the surrounding code (data collection, validation, features, serving, monitoring, configuration) is most of the work, and most of the risk. Google's well-known paper on "hidden technical debt in machine learning systems" makes exactly this point.

New failure modes appear:

- **Data changes silently:** an upstream team renames a category, a sensor recalibrates, a currency devaluation shifts every amount.
- **The world changes:** customer behaviour after a price change or a competitor's launch.
- **Feedback loops:** the model's own decisions change the data it later learns from.
- **Labels arrive late:** churn is known after 30 days, default after months, fraud after chargebacks weeks later.

## DS8.2 Batch or real time? 🟢 ⭐

| | **Batch scoring** | **Real-time (online) scoring** |
|---|---|---|
| How | A scheduled job scores everyone (nightly or weekly) and writes results to a table | An API scores one request at a time, in milliseconds |
| Fits | Churn lists, credit-limit reviews, demand forecasts, lead scores, recommendations precomputed per user | Fraud checks at payment time, pricing at checkout, search ranking, ETAs |
| Pros | Simple, cheap, easy to monitor and rerun; heavy features are fine | Uses the freshest context |
| Cons | Scores can be stale | Latency budget, availability, features must be computable fast online, more ops |

> [!say]
> "Most business models are batch: the retention team works from a weekly list, so I'd score every Sunday night in a scheduled job and write results to a table their CRM reads. That's cheaper and easier to monitor. I'd only build real-time scoring when the decision happens in the moment, like fraud checks at payment, and then design the features so they can be computed within the latency budget."

## DS8.3 Packaging and serving 🟢 🟡 ⭐

**Save the whole pipeline** (preprocessing + model), never just the estimator, so production applies identical transformations ([[DS2.5]]).

```python
import joblib
joblib.dump(pipeline, "churn_pipeline_v12.joblib")     # pickle-based: load only files you trust
```

> [!warning] Pickle files execute code
> Loading a pickle or joblib file can run arbitrary code, so never load one from an untrusted source. Alternatives: **skops** (a safer persistence format for scikit-learn), **ONNX** (a portable format runnable from C#, Java or JavaScript via ONNX Runtime), or each library's native format (LightGBM text models, XGBoost JSON).

**A real-time API with FastAPI:**

```python
from fastapi import FastAPI
from pydantic import BaseModel, Field
import joblib, pandas as pd

app = FastAPI(title="churn-scoring", version="12")
pipeline = joblib.load("churn_pipeline_v12.joblib")       # loaded once at start-up

class Features(BaseModel):
    days_since_last_recharge: int = Field(ge=0)
    spend_30d: float = Field(ge=0)
    spend_change_ratio: float
    complaints_30d: int = Field(ge=0)
    region: str
    plan_type: str

@app.post("/score")
def score(f: Features):
    proba = float(pipeline.predict_proba(pd.DataFrame([f.model_dump()]))[0, 1])
    return {"churn_probability": round(proba, 4), "model_version": "12"}

@app.get("/health")
def health(): return {"status": "ok"}
```

Package it in a Docker image ([[S5.8]]), deploy it like any service (Container Apps, Kubernetes, Azure ML managed endpoints), and give it the production basics: input validation (Pydantic does this), structured logs of inputs and outputs, latency metrics, health checks and versioned endpoints ([[B11]]).

**Calling it from .NET:** FinSight's ASP.NET Core API could call this service through a typed `HttpClient` with resilience ([[B3.9]]); or, for low latency without a Python service, export to **ONNX** and score in-process with ONNX Runtime from C#.

> [!story]
> Your gaps file notes that your shipped AI runs inside C#, while Egyptian AI and DS postings expect **FastAPI**. Wrapping the road-accident model in FastAPI, containerising it, and calling it from a small .NET client closes that gap and shows both halves of your profile.

## DS8.4 Experiment tracking and a model registry 🟡 ⭐

**Reproducibility** means you can rebuild any model: the same **code** (Git commit), **data** (a snapshot or version, e.g. DVC or a dated table), **environment** (pinned packages, a Docker image), **parameters** and **random seeds**.

**MLflow** is the most common open-source tool:

```python
import mlflow, mlflow.sklearn
mlflow.set_experiment("churn")
with mlflow.start_run(run_name="lgbm-optuna-best"):
    mlflow.log_params(best_params)
    mlflow.log_metrics({"pr_auc_cv": 0.412, "precision_at_5000": 0.38})
    mlflow.log_artifact("reliability_diagram.png")
    mlflow.sklearn.log_model(pipeline, name="model", registered_model_name="churn")   # versioned in the registry
# Later: promote a version, e.g. set the alias "champion" on version 12, and load "models:/churn@champion" in production
```

| Concept | Meaning |
|---|---|
| **Run** | One training execution with its parameters, metrics and artifacts |
| **Experiment** | A group of related runs |
| **Model registry** | Named models with **versions**, plus **aliases** (like `champion`, `challenger`) or stages, descriptions and lineage back to the run |
| **Model card** | Documentation: intended use, training data, metrics by segment, limitations, owners |

Managed equivalents: Azure Machine Learning (which uses MLflow tracking), Databricks (MLflow built in), SageMaker, Vertex AI. Weights & Biases is popular for deep learning.

## DS8.5 Training–serving skew and feature stores 🟡 ⭐

> [!term] Training–serving skew
> A difference between how features are computed in training and in production: different code paths (SQL in training, C# in the app), different time windows, a lookup table updated on a different schedule, or data that's available offline but not yet at prediction time. The model then sees inputs unlike those it learned from, and performance drops silently.

**Prevent it:** compute features **once**, with the same code, for both training and serving; use point-in-time correct training data ([[DS2.6]]); log the exact features used at prediction time and compare their distributions with training. **Feature stores** (Feast, Databricks, Azure ML managed feature store) exist largely to solve this: one feature definition, an **offline** store for training with point-in-time joins, and an **online** store for low-latency serving.

## DS8.6 Monitoring 🟡 ⭐

| What to monitor | Why | How |
|---|---|---|
| **Service health** | The API or job is up and fast | Latency, error rate, throughput, job success ([[B11]]) |
| **Data quality** | Broken inputs | Null rates, out-of-range values, unseen categories, schema changes |
| **Data (feature) drift** | Inputs no longer look like training data | Compare distributions: **PSI**, KS test, Jensen–Shannon distance, per feature |
| **Prediction drift** | The score distribution shifts (suddenly 3× more "high risk") | Distribution of outputs over time |
| **Performance** | The model is actually worse | Metrics computed as **labels arrive** (with their delay); proxy metrics meanwhile |
| **Business KPI** | The decision still adds value | Campaign retention, fraud losses, forecast cost |
| **Fairness** | Uneven degradation across groups | Metrics by segment ([[DS4.10]]) |

> [!term] Data drift vs concept drift
> **Data (covariate) drift:** the distribution of inputs changes (more young customers, higher amounts after inflation) while the relationship to the target may be the same. **Concept drift:** the relationship itself changes (the same usage pattern now means something different after a competitor's offer). Data drift is visible immediately in the inputs; concept drift shows up in performance once labels arrive.

> [!term] Population Stability Index (PSI)
> A drift score comparing a feature's (or score's) binned distribution now vs at training: Σ (actual% − expected%) × ln(actual% ÷ expected%). A common rule of thumb from credit scoring: below 0.1 little change, 0.1–0.25 some change worth watching, above 0.25 a significant shift worth investigating.

> [!say]
> "I'd monitor four layers: service health, input data quality, drift in features and in the score distribution, and actual performance once labels arrive, which for churn is 30 days later, so drift is my early warning. Alerts trigger an investigation first; retraining is one possible fix, but often the cause is an upstream data change."

Tools: **Evidently** (open source) for drift and quality reports, Azure ML / SageMaker / Vertex monitoring, or your own scheduled checks writing to dashboards.

## DS8.7 Retraining and safe rollout 🟡 ⭐

**When to retrain:**

- **On a schedule** (weekly, monthly) if the world changes steadily and retraining is cheap.
- **On a trigger:** drift or performance alerts, or major business changes.
- Always through the **same automated pipeline**, with validation gates: the new model must beat the current one on a recent out-of-time set and pass segment, calibration and fairness checks before promotion.

**Rolling out a new model:**

| Strategy | How |
|---|---|
| **Shadow** | The new model scores live traffic alongside the old one, but its outputs aren't used; compare offline |
| **Canary** | A small share of traffic uses the new model; watch metrics; expand ([[S10.3]]) |
| **Champion–challenger / A/B** | Randomly split decisions between models and measure the **business outcome** |
| **Rollback** | Keep the previous version deployable by alias; switch back instantly |

**Orchestration:** training pipelines (extract → validate → features → train → evaluate → register) run on Airflow, Prefect, Azure ML pipelines or Databricks Workflows ([[DE7]]), triggered by schedules or events, with every run logged.

## DS8.8 Governance 🟡

For regulated or high-impact models (credit, insurance, HR, health): model cards; documented data sources and consent; approval workflows before promotion; audit logs of predictions and model versions; explanations per decision ([[DS4.6]]); periodic reviews of performance and fairness; and data-protection compliance (Egypt's PDPL, Central Bank of Egypt rules for banks, [[DS1.7]]).

**Certification note (2026):** Microsoft retired **DP-100 (Azure Data Scientist Associate) on 1 June 2026** and replaced it with **AI-300, Machine Learning Operations (MLOps) Engineer Associate**, which emphasises CI/CD, infrastructure as code, observability, drift detection and operating generative-AI systems: a sign of where the role is heading.

> [!lab] Ship the road-accident model (from your gaps file)
> (1) Log your best pipeline to **MLflow** with parameters, metrics and plots, and register it with a `champion` alias. (2) Serve it with **FastAPI** in Docker, loading `models:/…@champion`. (3) Call it from a tiny ASP.NET Core minimal API with a typed `HttpClient`. (4) Generate an **Evidently** drift report comparing training data with a deliberately shifted "this month" sample. (5) Put it all in `compose.yaml` and a README with an architecture diagram. That's five gap keywords (FastAPI, Docker, MLflow, model registry, drift monitoring) turned into one demonstrable project.

## DS8.9 Interview drill 🟢 ⭐

| Question | Strong short answer |
|---|---|
| Batch vs real-time scoring? | Batch scores everyone on a schedule (simple, cheap); real-time scores per request (fresh context, strict latency, more ops). |
| How would you deploy a model? | Save the full pipeline, version it in a registry, serve via a batch job or an API in a container, with validation, logging, monitoring and rollback. |
| Why save the pipeline, not just the model? | Production must apply exactly the same preprocessing fitted in training. |
| Why be careful with pickle? | Loading it can execute arbitrary code; only load trusted files, or use skops, ONNX or native formats. |
| What is training–serving skew? | Features computed differently in training and production; prevent with shared feature code or a feature store. |
| What do you monitor? | Service health, data quality, feature and prediction drift, performance as labels arrive, business KPIs, fairness. |
| Data drift vs concept drift? | Inputs' distribution changes vs the input–target relationship changes. |
| What is PSI? | A binned distribution-shift score; above about 0.25 is commonly treated as significant. |
| How often do you retrain? | On a schedule or on triggers, through an automated pipeline with validation gates before promotion. |
| Shadow vs canary deployment? | Shadow runs the new model silently for comparison; canary serves it to a small share of real traffic. |
| What does MLflow give you? | Experiment tracking, model packaging and a registry with versions and aliases. |
| How do you make a model reproducible? | Versioned code, data and environment, logged parameters and seeds. |
| What replaced DP-100? | AI-300, Machine Learning Operations Engineer Associate, from June 2026. |

## Key takeaways

> [!check]
> - Most business models are batch; go real time only when the decision is.
> - Ship the whole pipeline, versioned in a registry, served like any production service.
> - Training–serving skew is the silent killer: one feature definition for both.
> - Monitor health, data, drift, delayed performance and business value; investigate before retraining.
> - Your engineering background is your edge here: show it with a FastAPI + MLflow + monitoring project.

## Sources

- D. Sculley et al., "Hidden Technical Debt in Machine Learning Systems" (NeurIPS 2015).
- Chip Huyen, *Designing Machine Learning Systems* (O'Reilly, 2022), chapters 7–9 (deployment, distribution shift, monitoring).
- [MLflow documentation](https://mlflow.org/docs/latest/): tracking, model registry and aliases.
- [FastAPI documentation](https://fastapi.tiangolo.com/); [skops](https://skops.readthedocs.io/); [ONNX Runtime](https://onnxruntime.ai/); scikit-learn: [Model persistence](https://scikit-learn.org/stable/model_persistence.html).
- [Evidently documentation](https://docs.evidentlyai.com/); [Feast](https://docs.feast.dev/).
- Google Cloud, [MLOps: Continuous delivery and automation pipelines in machine learning](https://cloud.google.com/architecture/mlops-continuous-delivery-and-automation-pipelines-in-machine-learning).
- Microsoft Learn: [Azure Machine Learning MLflow integration](https://learn.microsoft.com/en-us/azure/machine-learning/concept-mlflow); CBT Nuggets, [Microsoft is retiring the DP-100](https://www.cbtnuggets.com/blog/certifications/microsoft/tech-news-microsoft-is-retiring-the-dp-100).
