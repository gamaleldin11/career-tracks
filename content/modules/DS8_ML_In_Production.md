# Machine Learning in Production — Serving, Tracking, Monitoring and Retraining

A model in a notebook creates no value. Mid-level DS interviews increasingly ask how a model gets to users and stays good: batch or real time, how it's packaged and versioned, what you monitor, when you retrain. This is where your software-engineering background is a genuine advantage over typical data-science candidates: you've shipped APIs, containers, background jobs and CI pipelines. Your gaps file lists MLOps (MLflow, a model registry, drift monitoring) and "Python in production" as AI and DS gaps, and this module closes them conceptually; the lab closes them in practice.

> [!focus]
> **Entry must:** save and load a full pipeline; choose batch vs real-time scoring; wrap a model in an API; explain data drift; describe how you'd retrain.
> **Mid adds:** experiment tracking and a model registry with MLflow, training–serving skew and feature stores, drift and performance monitoring with delayed labels, shadow and canary deployments, champion–challenger, reproducibility, governance.
> **Most asked:** *How would you deploy this model?* · *Batch or real time?* · *What do you monitor after deployment?* · *What is data drift vs concept drift?* · *How often do you retrain?* · *What's training–serving skew?* · *How do you version models?*
> **Time budget:** 3.5 hours.

## DS8.0 Foundations: a model is a snapshot of the past 🟢

A trained model encodes the patterns in its training data **as of the day it was trained**. Production is where that snapshot meets a world that keeps moving: prices change, customers change, upstream data changes, and the model's own decisions change what happens next. So a production model isn't a deliverable; it's one stage in a **loop** that keeps checking it against reality.

<figure class="dia anim"><svg viewBox="0 0 720 284" role="img" aria-label="Animation: the production ML loop from data to training, the registry, deployment, predictions, decisions, outcomes arriving later, monitoring and back to data">
<ellipse class="sLm" cx="360" cy="140" rx="270" ry="100" fill="none" stroke-dasharray="6 5"/>
<rect class="sB" x="290" y="23" width="140" height="34" rx="8"/><text class="sT" x="360" y="45" text-anchor="middle">data</text>
<rect class="sA" x="480.919" y="52.2893" width="140" height="34" rx="8"/><text class="sT" x="550.919" y="74.2893" text-anchor="middle">train + validate</text>
<rect class="sV" x="560" y="123" width="140" height="34" rx="8"/><text class="sT" x="630" y="145" text-anchor="middle">registry</text>
<rect class="sV" x="480.919" y="193.711" width="140" height="34" rx="8"/><text class="sT" x="550.919" y="215.711" text-anchor="middle">deploy</text>
<rect class="sA" x="290" y="223" width="140" height="34" rx="8"/><text class="sT" x="360" y="245" text-anchor="middle">predict</text>
<rect class="sG" x="99.0812" y="193.711" width="140" height="34" rx="8"/><text class="sT" x="169.081" y="215.711" text-anchor="middle">decisions</text>
<rect class="sW" x="20" y="123" width="140" height="34" rx="8"/><text class="sT" x="90" y="145" text-anchor="middle">outcomes arrive</text>
<rect class="sR" x="99.0812" y="52.2893" width="140" height="34" rx="8"/><text class="sT" x="169.081" y="74.2893" text-anchor="middle">monitor</text>
<text class="sC" x="360" y="132" text-anchor="middle">a model is a snapshot of the past;</text><text class="sC" x="360" y="152" text-anchor="middle">the loop keeps it matched to the present</text>
<text class="sWt" x="96" y="178">labels: days to months later</text>
<circle class="sP" r="7"><animateMotion dur="10s" repeatCount="indefinite" path="M360 40 A270 100 0 0 1 360 240 A270 100 0 0 1 360 40"/></circle>
</svg><figcaption>Production ML is a loop, not a launch. The slow arc from decisions to outcomes is why monitoring can't wait for labels.</figcaption></figure>

Two consequences shape this module. Most of the engineering is **around** the model (data, features, serving, monitoring), not in it. And because outcomes arrive late, you need signals that warn you **before** the labels do.

## DS8.1 What changes in production 🟢 ⭐

The model is a small part of a production ML system; the surrounding code (data collection, validation, features, serving, monitoring, configuration) is most of the work, and most of the risk. Google's well-known paper on "hidden technical debt in machine learning systems" makes exactly this point.

<figure class="dia"><svg viewBox="0 0 720 254" role="img" aria-label="A production ML system where the ML code is a small box surrounded by much larger data collection, verification, feature extraction, configuration, serving, monitoring, process and analysis components">
<rect class="sB" x="14" y="20" width="220" height="60" rx="8"/><text class="sT" x="124" y="55" text-anchor="middle">data collection</text>
<rect class="sB" x="250" y="20" width="220" height="60" rx="8"/><text class="sT" x="360" y="55" text-anchor="middle">data verification</text>
<rect class="sB" x="486" y="20" width="220" height="60" rx="8"/><text class="sT" x="596" y="55" text-anchor="middle">feature extraction</text>
<rect class="sN" x="14" y="96" width="160" height="70" rx="8"/><text class="sT" x="94" y="136" text-anchor="middle">configuration</text>
<rect class="sV" x="546" y="96" width="160" height="70" rx="8"/><text class="sT" x="626" y="136" text-anchor="middle">serving infrastructure</text>
<rect class="sR" x="14" y="182" width="220" height="60" rx="8"/><text class="sT" x="124" y="217" text-anchor="middle">monitoring</text>
<rect class="sN" x="250" y="182" width="220" height="60" rx="8"/><text class="sT" x="360" y="217" text-anchor="middle">process management</text>
<rect class="sN" x="486" y="182" width="220" height="60" rx="8"/><text class="sT" x="596" y="217" text-anchor="middle">analysis tools</text>
<rect class="sN" x="190" y="96" width="340" height="70" rx="8" style="fill:none" stroke-dasharray="5 4"/><rect class="sA" x="320" y="102" width="80" height="38" rx="8"/><text class="sT" x="360" y="126" text-anchor="middle">ML code</text>
<text class="sC" x="360" y="158" text-anchor="middle">the part most courses teach</text>
</svg><figcaption>After Sculley et al., "Hidden Technical Debt in Machine Learning Systems" (2015). Most of the work, and most of the risk, is around the model.</figcaption></figure>

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

<figure class="dia"><svg viewBox="0 0 720 232" role="img" aria-label="Batch scoring runs a weekly job that scores every subscriber into a table for the CRM; real-time scoring answers each card payment through a fast API with online features">
<text class="sM" x="14" y="30">batch</text>
<rect class="sB" x="14" y="40" width="160" height="54" rx="8"/><text class="sT" x="94" y="65" text-anchor="middle">Sunday 01:00 job</text><text class="sC" x="94" y="81" text-anchor="middle">scheduled</text>
<line class="sLm" x1="174" y1="67" x2="188" y2="67" marker-end="url(#ahm)"/>
<rect class="sA" x="190" y="40" width="160" height="54" rx="8"/><text class="sT" x="270" y="65" text-anchor="middle">score 2.4M</text><text class="sC" x="270" y="81" text-anchor="middle">subscribers</text>
<line class="sLm" x1="350" y1="67" x2="364" y2="67" marker-end="url(#ahm)"/>
<rect class="sV" x="366" y="40" width="160" height="54" rx="8"/><text class="sT" x="446" y="65" text-anchor="middle">scores table</text><text class="sC" x="446" y="81" text-anchor="middle">dated, versioned</text>
<line class="sLm" x1="526" y1="67" x2="540" y2="67" marker-end="url(#ahm)"/>
<rect class="sG" x="542" y="40" width="160" height="54" rx="8"/><text class="sT" x="622" y="65" text-anchor="middle">CRM, Monday</text><text class="sC" x="622" y="81" text-anchor="middle">campaign list</text>
<text class="sM" x="14" y="130">real time</text>
<rect class="sB" x="14" y="140" width="160" height="54" rx="8"/><text class="sT" x="94" y="165" text-anchor="middle">card payment</text><text class="sC" x="94" y="181" text-anchor="middle">one request</text>
<line class="sLm" x1="174" y1="167" x2="188" y2="167" marker-end="url(#ahm)"/>
<rect class="sA" x="190" y="140" width="160" height="54" rx="8"/><text class="sT" x="270" y="165" text-anchor="middle">fraud API</text><text class="sC" x="270" y="181" text-anchor="middle">p99 &lt; 50 ms</text>
<line class="sLm" x1="350" y1="167" x2="364" y2="167" marker-end="url(#ahm)"/>
<rect class="sV" x="366" y="140" width="160" height="54" rx="8"/><text class="sT" x="446" y="165" text-anchor="middle">online features</text><text class="sC" x="446" y="181" text-anchor="middle">Redis</text>
<line class="sLm" x1="526" y1="167" x2="540" y2="167" marker-end="url(#ahm)"/>
<rect class="sG" x="542" y="140" width="160" height="54" rx="8"/><text class="sT" x="622" y="165" text-anchor="middle">allow · OTP · block</text><text class="sC" x="622" y="181" text-anchor="middle">instant</text>
<text class="sS" x="360" y="220" text-anchor="middle">choose by when the decision is made, not by which sounds more advanced</text>
</svg><figcaption>Most business models are batch. Real time is for decisions that happen inside a user's click.</figcaption></figure>

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

<figure class="dia"><svg viewBox="0 0 720 258" role="img" aria-label="Packaging and serving: the fitted pipeline with all preprocessing steps is saved as one artifact, a FastAPI container loads it once at start-up, validates each request with Pydantic, scores it and returns the probability with the model version; a .NET API calls it over HTTP">
<text class="sM" x="14" y="22">training</text><text class="sM" x="250" y="22">artifact</text><text class="sM" x="420" y="22">serving (Docker image)</text>
<rect class="sB" x="14" y="34" width="200" height="60" rx="8"/><text class="sT" x="114" y="62" text-anchor="middle">pipeline.fit(X_train)</text><text class="sC" x="114" y="78" text-anchor="middle">imputer → encoder → LightGBM</text>
<line class="sL" x1="214" y1="64" x2="246" y2="64" marker-end="url(#ah)"/>
<rect class="sA" x="250" y="34" width="150" height="60" rx="8"/><text class="sT" x="325" y="62" text-anchor="middle">churn_pipeline</text><text class="sC" x="325" y="78" text-anchor="middle">v12.joblib (all steps)</text>
<line class="sL" x1="400" y1="64" x2="432" y2="64" marker-end="url(#ah)"/><text class="sS" x="416" y="56" text-anchor="middle">load</text><text class="sS" x="416" y="84" text-anchor="middle">once</text>
<rect class="sN" x="436" y="34" width="270" height="136" rx="8"/>
<rect class="sN" x="448" y="42" width="246" height="24" rx="5"/><text class="sC" x="571" y="58" text-anchor="middle">POST /score (JSON)</text>
<line class="sLm" x1="571" y1="66" x2="571" y2="72"/>
<rect class="sW" x="448" y="73" width="246" height="24" rx="5"/><text class="sC" x="571" y="89" text-anchor="middle">Pydantic: types, ranges → 422</text>
<line class="sLm" x1="571" y1="97" x2="571" y2="103"/>
<rect class="sB" x="448" y="104" width="246" height="24" rx="5"/><text class="sC" x="571" y="120" text-anchor="middle">DataFrame → predict_proba</text>
<line class="sLm" x1="571" y1="128" x2="571" y2="134"/>
<rect class="sG" x="448" y="135" width="246" height="24" rx="5"/><text class="sC" x="571" y="151" text-anchor="middle">{ churn_probability, model_version }</text>
<rect class="sB" x="14" y="130" width="200" height="44" rx="8"/><text class="sT" x="114" y="157" text-anchor="middle">.NET API (typed HttpClient)</text>
<line class="sLg" x1="214" y1="152" x2="432" y2="152" marker-end="url(#ahg)"/><text class="sGt" x="323" y="144" text-anchor="middle">HTTP call, with retries</text>
<rect class="sR" x="14" y="196" width="692" height="34" rx="6" opacity=".35"/><text class="sRt" x="360" y="218" text-anchor="middle">save only the estimator, and serving must re-implement preprocessing: training/serving skew</text>
<text class="sS" x="360" y="248" text-anchor="middle">alternative for low latency: export to ONNX and score in-process from C# with ONNX Runtime</text>
</svg><figcaption>Ship the whole pipeline as one versioned artifact, so production transforms features exactly as training did.</figcaption></figure>

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

<figure class="dia steps" data-start="1"><svg viewBox="0 0 720 246" role="img" aria-label="A model registry with versions v10 to v13 and aliases: champion on v12, challenger v13 passes gates, the champion alias moves to v13, and a rollback moves it back">
<rect class="sB" x="110" y="110" width="110" height="50" rx="8"/><text class="sT" x="165" y="133" text-anchor="middle">v10</text><text class="sC" x="165" y="150" text-anchor="middle">run + metrics</text>
<rect class="sB" x="250" y="110" width="110" height="50" rx="8"/><text class="sT" x="305" y="133" text-anchor="middle">v11</text><text class="sC" x="305" y="150" text-anchor="middle">run + metrics</text>
<rect class="sB" x="390" y="110" width="110" height="50" rx="8"/><text class="sT" x="445" y="133" text-anchor="middle">v12</text><text class="sC" x="445" y="150" text-anchor="middle">run + metrics</text>
<rect class="sN" x="530" y="110" width="110" height="50" rx="8"/><text class="sT" x="585" y="133" text-anchor="middle">v13</text><text class="sC" x="585" y="150" text-anchor="middle">run + metrics</text>
<rect class="sN" x="14" y="196" width="270" height="40" rx="8"/><text class="sT" x="149" y="221" text-anchor="middle">serving loads models:/churn@champion</text>
<g data-s="1-1"><rect class="sG" x="393" y="60" width="104" height="26" rx="13"/><text class="sT" x="445" y="78" text-anchor="middle">champion</text><line class="sLm" x1="445" y1="86" x2="445" y2="108" marker-end="url(#ahm)"/><text class="sC" x="420" y="222">v12 answers every request</text></g>
<g data-s="2-2"><rect class="sG" x="393" y="60" width="104" height="26" rx="13"/><text class="sT" x="445" y="78" text-anchor="middle">champion</text><line class="sLm" x1="445" y1="86" x2="445" y2="108" marker-end="url(#ahm)"/><rect class="sW" x="533" y="60" width="104" height="26" rx="13"/><text class="sT" x="585" y="78" text-anchor="middle">challenger</text><line class="sLm" x1="585" y1="86" x2="585" y2="108" marker-end="url(#ahm)"/><text class="sWt" x="420" y="222">v13 passes the validation gates</text></g>
<g data-s="3-3"><rect class="sG" x="533" y="60" width="104" height="26" rx="13"/><text class="sT" x="585" y="78" text-anchor="middle">champion</text><line class="sLm" x1="585" y1="86" x2="585" y2="108" marker-end="url(#ahm)"/><rect class="sN" x="393" y="60" width="104" height="26" rx="13"/><text class="sT" x="445" y="78" text-anchor="middle">previous</text><line class="sLm" x1="445" y1="86" x2="445" y2="108" marker-end="url(#ahm)"/><text class="sGt" x="420" y="222">promote: move the alias, no redeploy</text></g>
<g data-s="4-4"><rect class="sG" x="393" y="60" width="104" height="26" rx="13"/><text class="sT" x="445" y="78" text-anchor="middle">champion</text><line class="sLm" x1="445" y1="86" x2="445" y2="108" marker-end="url(#ahm)"/><rect class="sR" x="533" y="60" width="104" height="26" rx="13"/><text class="sT" x="585" y="78" text-anchor="middle">rolled back</text><line class="sLm" x1="585" y1="86" x2="585" y2="108" marker-end="url(#ahm)"/><text class="sRt" x="420" y="222">metrics dip: move it back in seconds</text></g>
</svg><ol class="dia-steps">
<li>Every training run that might ship is registered as a version, linked to its code, data and metrics. Serving asks for whatever the <code>champion</code> alias points to.</li>
<li>A retrained v13 is tagged <code>challenger</code> after beating v12 on a recent out-of-time set and passing segment and calibration checks.</li>
<li>Promotion is moving the alias. Serving picks up v13 without a code change.</li>
<li>If live metrics dip, rollback is moving the alias back. Nothing is rebuilt.</li>
</ol><figcaption>Aliases turn deployment and rollback into a pointer change, with a full history of what was live when.</figcaption></figure>

Managed equivalents: Azure Machine Learning (which uses MLflow tracking), Databricks (MLflow built in), SageMaker, Vertex AI. Weights & Biases is popular for deep learning.

## DS8.5 Training–serving skew and feature stores 🟡 ⭐

> [!term] Training–serving skew
> A difference between how features are computed in training and in production: different code paths (SQL in training, C# in the app), different time windows, a lookup table updated on a different schedule, or data that's available offline but not yet at prediction time. The model then sees inputs unlike those it learned from, and performance drops silently.

**Prevent it:** compute features **once**, with the same code, for both training and serving; use point-in-time correct training data ([[DS2.6]]); log the exact features used at prediction time and compare their distributions with training. **Feature stores** (Feast, Databricks, Azure ML managed feature store) exist largely to solve this: one feature definition, an **offline** store for training with point-in-time joins, and an **online** store for low-latency serving.

<figure class="dia"><svg viewBox="0 0 720 212" role="img" aria-label="Training-serving skew: the same feature computed in SQL as Cairo calendar days gives 3 and in C# as UTC fractional days gives 2.6; the fix is a single shared feature definition">
<text class="sM" x="14" y="24">training</text><rect class="sB" x="14" y="32" width="330" height="60" rx="8"/><text class="sC" x="26" y="56" xml:space="preserve" style="white-space:pre">CURRENT_DATE - last_recharge::date</text><text class="sC" x="179" y="80" text-anchor="middle">Cairo calendar days → 3</text>
<text class="sM" x="376" y="24">serving</text><rect class="sW" x="376" y="32" width="330" height="60" rx="8"/><text class="sC" x="388" y="56" xml:space="preserve" style="white-space:pre">(DateTime.UtcNow - lastRecharge).TotalDays</text><text class="sC" x="541" y="80" text-anchor="middle">UTC fractional days → 2.6</text>
<text class="sRt" x="360" y="120" text-anchor="middle">same feature name, different numbers: the model sees inputs it was never trained on</text>
<line class="sLm" x1="179" y1="92" x2="179" y2="106"/><line class="sLm" x1="541" y1="92" x2="541" y2="106"/>
<rect class="sG" x="150" y="140" width="420" height="60" rx="10"/><text class="sT" x="360" y="164" text-anchor="middle">fix: one feature definition, one code path</text><text class="sC" x="360" y="184" text-anchor="middle">a feature pipeline or feature store feeds training and serving</text>
<line class="sLg" x1="250" y1="140" x2="179" y2="96" marker-end="url(#ahg)"/><line class="sLg" x1="470" y1="140" x2="541" y2="96" marker-end="url(#ahg)"/>
</svg><figcaption>Skew rarely comes from the model. It comes from two teams computing "the same" feature in two languages.</figcaption></figure>

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

<figure class="dia"><svg viewBox="0 0 720 242" role="img" aria-label="Population stability index for monthly spend comparing training and this month's distributions, and a timeline showing churn labels arriving weeks after scoring">
<rect class="sB" x="40" y="150" width="26" height="40" rx="2"/><rect class="sW" x="68" y="170" width="26" height="20" rx="2"/><text class="sC" x="67" y="206" text-anchor="middle">&lt; 100</text>
<rect class="sB" x="104" y="110" width="26" height="80" rx="2"/><rect class="sW" x="132" y="142" width="26" height="48" rx="2"/><text class="sC" x="131" y="206" text-anchor="middle">100–200</text>
<rect class="sB" x="168" y="70" width="26" height="120" rx="2"/><rect class="sW" x="196" y="90" width="26" height="100" rx="2"/><text class="sC" x="195" y="206" text-anchor="middle">200–400</text>
<rect class="sB" x="232" y="90" width="26" height="100" rx="2"/><rect class="sW" x="260" y="70" width="26" height="120" rx="2"/><text class="sC" x="259" y="206" text-anchor="middle">400–800</text>
<rect class="sB" x="296" y="130" width="26" height="60" rx="2"/><rect class="sW" x="324" y="78" width="26" height="112" rx="2"/><text class="sC" x="323" y="206" text-anchor="middle">800+</text>
<line class="sLm" x1="30" y1="190" x2="360" y2="190"/>
<text class="sT" x="190" y="24" text-anchor="middle">monthly spend (EGP): PSI = 0.17</text><text class="sC" x="70" y="44">training</text><rect class="sB" x="52" y="34" width="12" height="12" rx="2"/><text class="sC" x="170" y="44">this month</text><rect class="sW" x="152" y="34" width="12" height="12" rx="2"/>
<text class="sWt" x="190" y="230" text-anchor="middle">0.1–0.25: moderate shift; investigate</text>
<text class="sT" x="560" y="24" text-anchor="middle">label delay (churn)</text>
<line class="sLm" x1="420" y1="110" x2="700" y2="110" marker-end="url(#ahm)"/>
<circle class="sP" cx="430" cy="110" r="7"/><text class="sC" x="430" y="136" text-anchor="middle">scored</text><circle class="sPg" cx="660" cy="110" r="7"/><text class="sC" x="660" y="136" text-anchor="middle">label known</text>
<rect class="sW" x="440" y="70" width="212" height="26" rx="6" opacity=".6"/><text class="sC" x="546" y="88" text-anchor="middle">weeks 0–5: no labels yet</text>
<text class="sC" x="546" y="170" text-anchor="middle">meanwhile watch inputs (PSI) and</text><text class="sC" x="546" y="188" text-anchor="middle">the score distribution, then</text><text class="sC" x="546" y="206" text-anchor="middle">performance once labels land</text>
</svg><figcaption>Drift metrics are the early warning; labelled performance is the verdict, and it arrives late. Computed PSI shown.</figcaption></figure>

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

<figure class="dia steps" data-start="1"><svg viewBox="0 0 720 262" role="img" aria-label="Rolling out a new model: shadow scoring, a 5% canary, a randomised 50/50 champion-challenger test, then full promotion with the old model kept for rollback">
<rect class="sB" x="14" y="100" width="110" height="50" rx="8"/><text class="sT" x="69" y="130" text-anchor="middle">requests</text>
<rect class="sG" x="300" y="40" width="160" height="50" rx="8"/><text class="sT" x="380" y="70" text-anchor="middle">champion v12</text><rect class="sW" x="300" y="160" width="160" height="50" rx="8"/><text class="sT" x="380" y="190" text-anchor="middle">challenger v13</text>
<rect class="sA" x="586" y="100" width="120" height="50" rx="8"/><text class="sT" x="646" y="130" text-anchor="middle">decisions</text>
<g data-s="1-1"><line class="sL" x1="124" y1="115" x2="296" y2="68" marker-end="url(#ah)" stroke-width="6.0"/><text class="sT" x="210" y="74" text-anchor="middle">100%</text><line class="sLm" x1="124" y1="135" x2="296" y2="182" marker-end="url(#ahm)" stroke-width="6.0" stroke-dasharray="5 4"/><text class="sT" x="210" y="180" text-anchor="middle">100%</text><line class="sL" x1="460" y1="65" x2="582" y2="118" marker-end="url(#ah)"/><text class="sC" x="530" y="200" text-anchor="middle">logged only</text><text class="sT" x="360" y="250" text-anchor="middle">shadow: both score everything; only v12 decides</text></g>
<g data-s="2-2"><line class="sL" x1="124" y1="115" x2="296" y2="68" marker-end="url(#ah)" stroke-width="5.8"/><text class="sT" x="210" y="74" text-anchor="middle">95%</text><line class="sLw" x1="124" y1="135" x2="296" y2="182" marker-end="url(#ahw)" stroke-width="1.2"/><text class="sT" x="210" y="180" text-anchor="middle">5%</text><line class="sL" x1="460" y1="65" x2="582" y2="118" marker-end="url(#ah)"/><line class="sLw" x1="460" y1="185" x2="582" y2="132" marker-end="url(#ahw)"/><text class="sT" x="360" y="250" text-anchor="middle">canary: 5% of decisions use v13; watch errors and latency</text></g>
<g data-s="3-3"><line class="sL" x1="124" y1="115" x2="296" y2="68" marker-end="url(#ah)" stroke-width="3.5"/><text class="sT" x="210" y="74" text-anchor="middle">50%</text><line class="sLw" x1="124" y1="135" x2="296" y2="182" marker-end="url(#ahw)" stroke-width="3.5"/><text class="sT" x="210" y="180" text-anchor="middle">50%</text><line class="sL" x1="460" y1="65" x2="582" y2="118" marker-end="url(#ah)"/><line class="sLw" x1="460" y1="185" x2="582" y2="132" marker-end="url(#ahw)"/><text class="sT" x="360" y="250" text-anchor="middle">champion–challenger: random 50/50; compare business outcomes</text></g>
<g data-s="4-4"><line class="sLw" x1="124" y1="125" x2="296" y2="185" marker-end="url(#ahw)" stroke-width="6"/><text class="sT" x="210" y="180" text-anchor="middle">100%</text><line class="sLw" x1="460" y1="185" x2="582" y2="132" marker-end="url(#ahw)"/><text class="sC" x="380" y="108" text-anchor="middle">kept for rollback</text><text class="sT" x="360" y="250" text-anchor="middle">promote: v13 takes all traffic; v12 stays deployable</text></g>
</svg><ol class="dia-steps">
<li><b>Shadow:</b> v13 scores live traffic but its outputs are only logged. You learn latency, errors and how its scores differ, with zero risk.</li>
<li><b>Canary:</b> a small share of real decisions use v13. Expand only if nothing breaks.</li>
<li><b>Champion–challenger:</b> a randomised split measures what matters, the business outcome, not just offline metrics.</li>
<li><b>Promote</b> when the challenger wins; keep the old version one alias-move away.</li>
</ol><figcaption>Each stage risks a little more traffic for a little more evidence.</figcaption></figure>

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
