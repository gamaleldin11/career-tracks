# System Design by Role — The Same Thinking, Applied to Your Job

Every track now gets a system-design round, but it looks different in each. A frontend candidate is asked to design an autocomplete or a feed, a data engineer a pipeline, an AI engineer a chatbot over company documents, a network engineer a site that must survive a link failure. The thinking underneath is the same: **requirements and scale first, then the simplest design that meets them, then the hard parts, failure modes and trade-offs**. This module gives one framework and then a worked design for each role. Read [[SD1]] first; [[SD2]]–[[SD4]] supply the deeper patterns.

> [!focus]
> **Entry must:** use the framework out loud for a problem in your own field; draw the main components and walk one request or one record through them; name two failure modes and two trade-offs.
> **Mid adds:** estimate scale, go deep on the hardest part of your role's design (rendering and caching, freshness, idempotent loads, serving latency, token cost, redundancy), and say what you would monitor.
> **Most asked by role:** frontend *Design an autocomplete / news feed / image gallery* · backend *Design a URL shortener / notifications* · analyst *Why is this dashboard slow, and how would you fix it?* · data engineer *Design a pipeline for X* · data scientist *Design a churn / fraud / recommendation system* · AI engineer *Design a RAG assistant / an agent* · network *Design a resilient network for a branch or a hospital*.
> **Time budget:** 1 hour for the framework, then your role's section, then one practice design every other day.

## SD5.1 One framework for every role 🟢 ⭐

| Step | Ask yourself | Time in a 45-minute round |
|---|---|---|
| **1. Requirements** | What must it do? Who uses it, how many, how often? What matters most: latency, freshness, accuracy, cost, availability? What is out of scope? | 5–8 min |
| **2. Estimates** | Requests or records per second, data size, growth, peak vs average ([[SD1.10]]) | 3–5 min |
| **3. Interfaces** | The API, the event, the table, the component props: the contract | 3–5 min |
| **4. Data** | What is stored, where, in what shape, read how ([[SD3.3]]) | 5 min |
| **5. High-level design** | The boxes and arrows; walk one request or record through | 10 min |
| **6. Deep dives** | The hard part for *this* problem; failure modes ([[SD4.1]]) | 10–15 min |
| **7. Wrap-up** | Trade-offs made, what you'd monitor, what you'd do next | 2 min |

The backend version, with four worked designs, is [[B12]]. The sections below adapt it.

<figure class="dia"><svg viewBox="0 0 720 122" role="img" aria-label="Time budget for a 45-minute system design round across the seven framework steps">
<rect class="sA" x="20" y="34" width="103.778" height="40" rx="4"/><text class="sT" x="72.8889" y="59" text-anchor="middle">7′</text>
<text class="sS" x="72.8889" y="94" text-anchor="middle">Requirements</text>
<rect class="sB" x="125.778" y="34" width="58.4444" height="40" rx="4"/><text class="sT" x="156" y="59" text-anchor="middle">4′</text>
<text class="sS" x="156" y="112" text-anchor="middle">Estimates</text>
<rect class="sB" x="186.222" y="34" width="58.4444" height="40" rx="4"/><text class="sT" x="216.444" y="59" text-anchor="middle">4′</text>
<text class="sS" x="216.444" y="94" text-anchor="middle">Interfaces</text>
<rect class="sB" x="246.667" y="34" width="73.5556" height="40" rx="4"/><text class="sT" x="284.444" y="59" text-anchor="middle">5′</text>
<text class="sS" x="284.444" y="112" text-anchor="middle">Data</text>
<rect class="sG" x="322.222" y="34" width="149.111" height="40" rx="4"/><text class="sT" x="397.778" y="59" text-anchor="middle">10′</text>
<text class="sS" x="397.778" y="94" text-anchor="middle">High-level design</text>
<rect class="sW" x="473.333" y="34" width="194.444" height="40" rx="4"/><text class="sT" x="571.556" y="59" text-anchor="middle">13′</text>
<text class="sS" x="571.556" y="112" text-anchor="middle">Deep dives</text>
<rect class="sV" x="669.778" y="34" width="28.2222" height="40" rx="4"/><text class="sT" x="684.889" y="59" text-anchor="middle">2′</text>
<text class="sS" x="684.889" y="94" text-anchor="middle">Wrap-up</text>
<text class="sT" x="20" y="22">A 45-minute round</text>
</svg><figcaption>Where the minutes go. Most of the score is earned in the high-level design and the deep dives, but only if the requirements made them the right ones.</figcaption></figure>

> [!say]
> "I'll start with requirements and rough scale, because they decide the design. Then the interface and data, a simple high-level design, and we'll go deep on whichever part is hardest. I'll call out trade-offs and failure modes as I go."

## SD5.2 Frontend system design 🟡 ⭐

Frontend rounds design the **client**: how it is structured, how it gets and caches data, and how it stays fast and usable on real devices. A common shape is **RADIO** (from GreatFrontEnd): **R**equirements, **A**rchitecture, **D**ata model, **I**nterface (API between client and server, and between components), **O**ptimisations. [[F11.4]] has more practice questions.

**The decisions that are specific to the frontend:**

| Decision | Options | Choose by |
|---|---|---|
| Rendering | Client-side (CSR), server-side (SSR), static generation (SSG), incremental regeneration, streaming SSR, islands | SEO needs, how personalised the page is, time-to-first-content on slow devices ([[F9]]) |
| Data fetching | Fetch on the client with a query cache, server components, a BFF that shapes data per screen | Number of round trips, caching, who owns the shape ([[F8]]) |
| Client state | Local component state, a global store, URL state, server-state cache | Who else needs it; whether it should survive refresh |
| Real time | Polling, SSE, WebSockets | Direction and frequency of updates ([[SD3.5]]) |
| Performance budget | Core Web Vitals targets: LCP ≤ 2.5 s, INP ≤ 200 ms, CLS ≤ 0.1 at the 75th percentile | Measure on mid-range Android phones on 4G, which is much of Egypt's traffic |
| Offline and resilience | Service worker caching, optimistic updates with rollback, retry queues | Whether users act while connectivity drops |

**Worked: design a search-as-you-type box** (product search for an e-commerce site).

- **Requirements:** suggestions as the user types, in Arabic and English, within ~150 ms of a pause; keyboard and screen-reader accessible; works on slow connections.
- **Interface:** `GET /suggest?q=lap&lang=ar&limit=8` → `[{id, label, type, url}]`.
- **Client design:** **debounce** keystrokes (~200–300 ms); **cancel** in-flight requests when the query changes (`AbortController`) so an old slow response can't overwrite a newer one; cache results per query in memory (an LRU of the last ~50 queries); show cached results instantly for a prefix the user already typed.

<figure class="dia"><svg viewBox="0 0 720 232" role="img" aria-label="Timeline: without debounce six requests race and a slow old one overwrites the newest; with debounce and cancellation one request is sent after typing pauses">
<text class="sC" x="20" y="22">keystrokes</text>
<rect class="sB" x="106" y="28" width="50" height="20" rx="4"/><text class="sM" x="131" y="42" text-anchor="middle">l</text>
<rect class="sB" x="155.714" y="28" width="50" height="20" rx="4"/><text class="sM" x="180.714" y="42" text-anchor="middle">la</text>
<rect class="sB" x="205.429" y="28" width="50" height="20" rx="4"/><text class="sM" x="230.429" y="42" text-anchor="middle">lap</text>
<rect class="sB" x="255.143" y="28" width="50" height="20" rx="4"/><text class="sM" x="280.143" y="42" text-anchor="middle">lapt</text>
<rect class="sB" x="304.857" y="28" width="50" height="20" rx="4"/><text class="sM" x="329.857" y="42" text-anchor="middle">lapto</text>
<rect class="sB" x="354.571" y="28" width="50" height="20" rx="4"/><text class="sM" x="379.571" y="42" text-anchor="middle">laptop</text>
<text class="sT" x="20" y="82">no debounce</text><text class="sRt" x="20" y="98">6 requests</text>
<line class="sLm" x1="110.0" y1="64" x2="234.3" y2="64" marker-end="url(#ahm)"/>
<line class="sLm" x1="159.7" y1="74" x2="267.4" y2="74" marker-end="url(#ahm)"/>
<line class="sLr" x1="209.4" y1="84" x2="582.3" y2="84" marker-end="url(#ahr)"/>
<line class="sLm" x1="259.1" y1="94" x2="375.1" y2="94" marker-end="url(#ahm)"/>
<line class="sLm" x1="308.9" y1="104" x2="408.3" y2="104" marker-end="url(#ahm)"/>
<line class="sLm" x1="358.6" y1="114" x2="449.7" y2="114" marker-end="url(#ahm)"/>
<text class="sRt" x="588.286" y="88">"lap" answers last and</text><text class="sRt" x="588.286" y="104">overwrites "laptop"</text>
<text class="sT" x="20" y="160">debounce 250 ms</text><text class="sT" x="20" y="176">+ AbortController</text>
<line class="sLg" x1="462.1" y1="166" x2="553.3" y2="166" marker-end="url(#ahg)"/><text class="sGt" x="553.286" y="156" text-anchor="end">one request for "laptop", after the pause</text>
<rect class="sV" x="404.571" y="160" width="57.5714" height="12" rx="3" opacity=".6"/><text class="sC" x="433.357" y="196" text-anchor="middle">quiet period</text>
<text class="sC" x="110" y="222" text-anchor="middle">0 ms</text>
<text class="sC" x="317.143" y="222" text-anchor="middle">500 ms</text>
<text class="sC" x="524.286" y="222" text-anchor="middle">1000 ms</text>
</svg><figcaption>Debounce sends fewer requests; cancellation makes sure only the newest answer can ever be shown.</figcaption></figure>

- **Server side (the part to mention, not design fully):** a prefix index (search engine or an in-memory trie of popular queries), results cached at the CDN for very common prefixes.
- **Accessibility:** the ARIA combobox pattern, arrow keys and Enter, `aria-activedescendant`, announcing the number of results ([[F1]]).
- **Arabic specifics:** normalise alef and hamza variants and taa marbuta, ignore diacritics, handle right-to-left layout and mixed-direction text.
- **Failure modes:** a slow API (show nothing rather than stale results for a different query), offline (hide suggestions, keep the box usable).

## SD5.3 Backend and full-stack 🟢 ⭐

This is the classic round, covered in depth in [[B12]]: the framework, estimates, the building blocks, and worked designs for a URL shortener, a rate limiter, a notification system and FinSight as a multi-tenant SaaS. Use [[SD2]] to answer "scale it 100×" and [[SD4]] for "what happens when it fails?".

Full-stack candidates are expected to connect both ends: say how the API shape serves the screen (a BFF or GraphQL for a complex dashboard), where authentication lives end to end ([[FS2]]), and how a deploy rolls out without breaking clients that still run the old version (backwards-compatible API changes, versioning, feature flags).

## SD5.4 Data analyst: analytics system design 🟢 🟡 ⭐

Analysts are rarely asked to draw servers, but they are increasingly asked **how data gets to a dashboard, how fresh it is, and why it is slow or wrong**. That is system design.

**The pieces of an analytics system:**

```
source systems (POS, app, CRM, ERP)
   → ingestion (batch loads or change data capture)
   → warehouse / lakehouse  (raw → cleaned → modelled star schema)
   → semantic layer (shared metric definitions: "net revenue", "active customer")
   → BI tool (Power BI, Tableau, Looker) → dashboards, alerts, exports
```

<figure class="dia"><svg viewBox="0 0 720 134" role="img" aria-label="Analytics stack from source systems through ingestion, warehouse layers and a semantic layer to the BI tool">
<rect class="sB" x="10" y="40" width="126" height="52" rx="8"/><text class="sT" x="73" y="64" text-anchor="middle">sources</text><text class="sC" x="73" y="80" text-anchor="middle">POS · app · CRM</text>
<line class="sLm" x1="136" y1="66" x2="150" y2="66" marker-end="url(#ahm)"/>
<rect class="sB" x="152" y="40" width="126" height="52" rx="8"/><text class="sT" x="215" y="64" text-anchor="middle">ingestion</text><text class="sC" x="215" y="80" text-anchor="middle">batch · CDC</text>
<line class="sLm" x1="278" y1="66" x2="292" y2="66" marker-end="url(#ahm)"/>
<rect class="sA" x="294" y="40" width="126" height="52" rx="8"/><text class="sT" x="357" y="64" text-anchor="middle">warehouse</text><text class="sC" x="357" y="80" text-anchor="middle">raw → clean → star</text>
<line class="sLm" x1="420" y1="66" x2="434" y2="66" marker-end="url(#ahm)"/>
<rect class="sG" x="436" y="40" width="126" height="52" rx="8"/><text class="sT" x="499" y="64" text-anchor="middle">semantic layer</text><text class="sC" x="499" y="80" text-anchor="middle">one "net revenue"</text>
<line class="sLm" x1="562" y1="66" x2="576" y2="66" marker-end="url(#ahm)"/>
<rect class="sV" x="578" y="40" width="126" height="52" rx="8"/><text class="sT" x="641" y="64" text-anchor="middle">BI tool</text><text class="sC" x="641" y="80" text-anchor="middle">dashboards</text>
<text class="sS" x="360" y="122" text-anchor="middle">freshness is set by the slowest step; correctness by the semantic layer; speed by the model and the BI storage mode</text>
</svg><figcaption>The path data takes to a dashboard. "Why is this number wrong or late?" is answered by walking it from right to left.</figcaption></figure>

**Decisions an analyst should be able to defend:**

| Decision | Options | Trade-off |
|---|---|---|
| Power BI storage mode | **Import** (data copied into the model, fast, refreshed on a schedule), **DirectQuery** (queries the source live, always fresh, slower and loads the source), **Direct Lake** in Microsoft Fabric (reads lakehouse files directly) | Speed vs freshness vs load on the source ([[DA4]]) |
| Freshness | Daily, hourly, near-real-time | Each step up costs money and complexity; agree a freshness SLA with the business and show "data as of…" on the page |
| Where metrics are defined | In each report vs once in a semantic layer or dbt metrics | One definition prevents three versions of "revenue" in one meeting |
| Aggregation | Query raw rows vs pre-built aggregate tables | Aggregates make dashboards fast; they must be rebuilt when logic changes |
| Security | Separate reports per audience vs **row-level security** in one model | RLS scales to many regions or branches with one report |

**Worked: "The national sales dashboard takes 40 seconds to open. Fix it."**

1. **Measure** where the time goes (Power BI's Performance Analyzer: DAX query vs visual rendering vs DirectQuery wait).
2. **Reduce the data**: import only needed columns, summarise to daily per store and product instead of raw receipts, use a star schema instead of one wide flat table.
3. **Fix the model**: relationships on integer keys, a proper date table, measures instead of calculated columns where possible.
4. **Fewer, cheaper visuals** on the landing page; detail on drill-through pages.
5. **If it must be live**, use aggregations or a composite model: imported aggregates for most visuals, DirectQuery only for the detail.
6. **Then** agree the refresh schedule with the business and add "last refreshed" to the page.

## SD5.5 Data engineer: pipeline design 🟡 ⭐

Data-engineering rounds ask you to design a pipeline: from where to where, how often, how reliably, at what volume. The building blocks are in [[DE1]]–[[DE9]].

| Decision | Options | Choose by |
|---|---|---|
| Latency | **Batch** (hourly or daily), **micro-batch** (minutes), **streaming** (seconds) | How fresh consumers truly need it; streaming costs much more to build and run ([[DE8]]) |
| Ingestion | Full extracts, incremental by timestamp or ID, **change data capture** (CDC) from the database log | Source size and load; CDC captures deletes and doesn't load the source |
| Storage layers | Raw / bronze → cleaned / silver → modelled / gold (the "medallion" layout) on open table formats (Delta Lake, Apache Iceberg) | Reprocessing from raw, auditing, separation of concerns ([[DE5]]) |
| Processing | SQL in the warehouse (dbt), Spark for large or complex jobs, a stream processor (Flink, Spark Structured Streaming) for streams | Volume, team skills, latency ([[DE6]], [[DE7]]) |
| Orchestration | Airflow, Dagster, Azure Data Factory / Fabric pipelines | Dependencies, retries, backfills, alerting |
| Quality | Tests on every model, contracts with source teams, write-audit-publish | Consumers never see bad data ([[DE9]]) |

**The properties interviewers check:**

- **Idempotent loads**: re-running a day's job produces the same result, not duplicates (`MERGE` or overwrite by partition, never blind `INSERT`).
- **Backfills**: you can reprocess last March after a logic fix without touching other months.
- **Late and out-of-order data**: event-time windows with **watermarks** in streaming; reprocessing recent partitions in batch.
- **Schema evolution**: a new column at the source doesn't break the pipeline; a dropped one raises an alert.
- **Observability**: freshness, row counts and volume anomalies, failed tests, with an owner for each dataset.

**Worked: a ride-hailing trips pipeline for Cairo.** Trip events stream from the apps (requested, accepted, started, ended, paid) at a few thousand per second at peak. Operations wants live supply-and-demand by district every minute; finance wants exact daily revenue by morning.

- **Two consumers, two latencies, one source of truth:** events go to a **log** (Kafka or Event Hubs). A **streaming job** computes per-district counts in one-minute windows with a watermark for late events, into a low-latency store behind the ops dashboard. The same events land in **bronze** files; a nightly batch builds the **gold** `fact_trip` and revenue tables with exact, deduplicated, reconciled numbers.

<figure class="dia anim"><svg viewBox="0 0 720 214" role="img" aria-label="Animation: trip events flow into a log; a fast streaming path feeds a live operations map every minute while a slow batch path builds exact finance tables overnight">
<rect class="sB" x="10" y="92" width="100" height="50" rx="8"/><text class="sT" x="60" y="115" text-anchor="middle">rider &amp; driver</text><text class="sC" x="60" y="131" text-anchor="middle">apps</text>
<rect class="sW" x="150" y="92" width="100" height="50" rx="8"/><text class="sT" x="200" y="115" text-anchor="middle">event log</text><text class="sC" x="200" y="131" text-anchor="middle">Kafka</text>
<rect class="sA" x="300" y="30" width="140" height="50" rx="8"/><text class="sT" x="370" y="53" text-anchor="middle">streaming job</text><text class="sC" x="370" y="69" text-anchor="middle">1-min windows</text><rect class="sA" x="490" y="30" width="120" height="50" rx="8"/><text class="sT" x="550" y="60" text-anchor="middle">live store</text><rect class="sG" x="640" y="30" width="76" height="50" rx="8"/><text class="sT" x="678" y="53" text-anchor="middle">ops</text><text class="sC" x="678" y="69" text-anchor="middle">map</text>
<rect class="sB" x="300" y="154" width="140" height="50" rx="8"/><text class="sT" x="370" y="177" text-anchor="middle">bronze files</text><text class="sC" x="370" y="193" text-anchor="middle">every raw event</text><rect class="sV" x="490" y="154" width="120" height="50" rx="8"/><text class="sT" x="550" y="177" text-anchor="middle">nightly batch</text><text class="sC" x="550" y="193" text-anchor="middle">dedupe · reconcile</text><rect class="sG" x="640" y="154" width="76" height="50" rx="8"/><text class="sT" x="678" y="177" text-anchor="middle">finance</text><text class="sC" x="678" y="193" text-anchor="middle">gold</text>
<line class="sL" x1="110" y1="117" x2="146" y2="117" marker-end="url(#ah)"/>
<line class="sL" x1="250" y1="108" x2="296" y2="60" marker-end="url(#ah)"/><line class="sL" x1="440" y1="55" x2="486" y2="55" marker-end="url(#ah)"/><line class="sL" x1="610" y1="55" x2="636" y2="55" marker-end="url(#ah)"/>
<line class="sL" x1="250" y1="126" x2="296" y2="176" marker-end="url(#ah)"/><line class="sL" x1="440" y1="179" x2="486" y2="179" marker-end="url(#ah)"/><line class="sL" x1="610" y1="179" x2="636" y2="179" marker-end="url(#ah)"/>
<circle class="sP" r="5"><animateMotion dur="3s" begin="0s" repeatCount="indefinite" path="M110 117 H200 L300 55 H678"/></circle>
<circle class="sP" r="5"><animateMotion dur="3s" begin="1s" repeatCount="indefinite" path="M110 117 H200 L300 55 H678"/></circle>
<circle class="sP" r="5"><animateMotion dur="3s" begin="2s" repeatCount="indefinite" path="M110 117 H200 L300 55 H678"/></circle>
<circle class="sPv" r="5"><animateMotion dur="9s" repeatCount="indefinite" path="M110 117 H200 L300 179 H678"/></circle>
<text class="sC" x="370" y="104" text-anchor="middle">seconds: approximate, live</text><text class="sC" x="370" y="132" text-anchor="middle">next morning: exact</text>
</svg><figcaption>One source of truth, two latencies. The streaming path is fast and approximate; the batch path is slow and exact, and finance only trusts the second.</figcaption></figure>

- **Deduplication:** each event carries a unique ID; the batch layer deduplicates on it; finance reconciles against the payment provider's settlement file.
- **Failure handling:** a dead-letter topic for malformed events, alerting on lag and on a sudden drop in event volume (often an app release bug, not a quiet day).

## SD5.6 Data scientist: ML system design 🟡 ⭐

The full answer structure is in [[DS9.2]] and production details in [[DS8]]. In summary: **problem framing → data and labels → features → model and offline evaluation → serving → monitoring → retraining**, with the business metric at both ends.

| Decision | Options | Choose by |
|---|---|---|
| Serving | **Batch scoring** (score everyone nightly, store results) vs **online** (score per request in milliseconds) | Whether the decision happens in real time; batch is far simpler and cheaper |
| Features | Computed in the training notebook vs a shared pipeline or **feature store** used for both training and serving | Avoiding **training–serving skew** (the model sees different feature logic in production) |
| Rollout | Shadow mode, A/B test, gradual ramp | Proving business impact, not just offline metrics |
| Monitoring | Input drift, prediction drift, performance once labels arrive, data-quality checks | Labels often arrive weeks later (churn), so drift is the early warning |

**Contrast two designs in one breath:** *telecom churn* is batch: score all subscribers weekly, push the top-risk list to the retention team's CRM, measure with a holdout group. *Card fraud* is online: score each transaction in under ~100 ms inside the payment flow, with features from a fast store (recent transaction counts per card), a rules fallback if the model service is down, and human review for borderline scores.

<figure class="dia"><svg viewBox="0 0 720 226" role="img" aria-label="Batch scoring writes weekly churn scores to a table for the CRM; online scoring calls a model API with fresh features during each payment">
<text class="sT" x="20" y="24">Batch: churn</text>
<rect class="sB" x="20" y="34" width="150" height="46" rx="8"/><text class="sT" x="95" y="55" text-anchor="middle">warehouse</text><text class="sC" x="95" y="71" text-anchor="middle">all subscribers</text>
<line class="sLm" x1="170" y1="57" x2="190" y2="57" marker-end="url(#ahm)"/>
<rect class="sA" x="192" y="34" width="150" height="46" rx="8"/><text class="sT" x="267" y="55" text-anchor="middle">weekly job</text><text class="sC" x="267" y="71" text-anchor="middle">score everyone</text>
<line class="sLm" x1="342" y1="57" x2="362" y2="57" marker-end="url(#ahm)"/>
<rect class="sG" x="364" y="34" width="150" height="46" rx="8"/><text class="sT" x="439" y="55" text-anchor="middle">scores table</text><text class="sC" x="439" y="71" text-anchor="middle">risk per customer</text>
<line class="sLm" x1="514" y1="57" x2="534" y2="57" marker-end="url(#ahm)"/>
<rect class="sV" x="536" y="34" width="150" height="46" rx="8"/><text class="sT" x="611" y="55" text-anchor="middle">CRM</text><text class="sC" x="611" y="71" text-anchor="middle">retention calls</text>
<text class="sT" x="20" y="122">Online: card fraud</text>
<rect class="sB" x="20" y="132" width="150" height="46" rx="8"/><text class="sT" x="95" y="153" text-anchor="middle">payment</text><text class="sC" x="95" y="169" text-anchor="middle">in flight</text>
<rect class="sA" x="192" y="132" width="150" height="46" rx="8"/><text class="sT" x="267" y="153" text-anchor="middle">model API</text><text class="sC" x="267" y="169" text-anchor="middle">&lt; 100 ms</text>
<rect class="sG" x="364" y="132" width="150" height="46" rx="8"/><text class="sT" x="439" y="153" text-anchor="middle">feature store</text><text class="sC" x="439" y="169" text-anchor="middle">recent counts</text>
<rect class="sV" x="536" y="132" width="150" height="46" rx="8"/><text class="sT" x="611" y="153" text-anchor="middle">decision</text><text class="sC" x="611" y="169" text-anchor="middle">approve · review</text>
<line class="sLm" x1="170" y1="155" x2="190" y2="155" marker-end="url(#ahm)"/><line class="sLm" x1="340" y1="150" x2="362" y2="150" marker-end="url(#ahm)"/><line class="sLm" x1="362" y1="162" x2="342" y2="162" marker-end="url(#ahm)"/><path class="sLm" d="M265 178 v18 h366 v-18" marker-end="url(#ahm)"/>
<text class="sC" x="448" y="216" text-anchor="middle">rules fallback if the model is down</text>
</svg><figcaption>Batch when the decision can wait; online when it can't. The online path needs a feature store, a latency budget and a fallback.</figcaption></figure>

## SD5.7 AI engineer: LLM and RAG application design 🟡 ⭐

LLM applications add new requirements to every system-design rule: **quality is probabilistic, latency is seconds rather than milliseconds, and cost scales with tokens**. The model background is in [[AI21]]; RAG in [[AI21.7]]; productionisation in [[AI16.6]].

**Requirements that are new here:**

- **Quality**: how correct and grounded must answers be? What happens on a wrong answer (annoying, or legally risky)?
- **Latency**: **time to first token** (TTFT) matters more than total time, because answers stream.
- **Cost**: tokens in plus tokens out, per request, times volume.
- **Safety and privacy**: personal data in prompts, prompt injection through retrieved documents, what the model must never do.

**A reference architecture:**

<figure class="dia anim"><svg viewBox="0 0 760 250" role="img" aria-label="Animation: a question goes to the API, retrieves passages from the index, then goes through the gateway to a model and streams back. Components: client, API with guardrails, retrieval over vector index, LLM gateway with routing and caching, providers, evaluation and observability">
<rect class="sB" x="10" y="100" width="80" height="44" rx="8"/><text class="sT" x="50" y="126" text-anchor="middle">Client</text>
<rect class="sA" x="120" y="88" width="120" height="68" rx="8"/><text class="sT" x="180" y="112" text-anchor="middle">App API</text><text class="sS" x="180" y="128" text-anchor="middle">auth · guardrails</text><text class="sS" x="180" y="142" text-anchor="middle">prompt versions</text>
<rect class="sG" x="280" y="20" width="130" height="50" rx="8"/><text class="sT" x="345" y="42" text-anchor="middle">Retrieval</text><text class="sS" x="345" y="58" text-anchor="middle">hybrid search + rerank</text>
<rect class="sG" x="450" y="20" width="120" height="50" rx="8"/><text class="sT" x="510" y="42" text-anchor="middle">Vector + text</text><text class="sS" x="510" y="58" text-anchor="middle">index</text>
<rect class="sA" x="280" y="100" width="130" height="56" rx="8"/><text class="sT" x="345" y="122" text-anchor="middle">LLM gateway</text><text class="sS" x="345" y="138" text-anchor="middle">routing · cache · limits</text>
<rect class="sB" x="450" y="92" width="120" height="34" rx="8"/><text class="sT" x="510" y="114" text-anchor="middle">Large model</text>
<rect class="sB" x="450" y="132" width="120" height="34" rx="8"/><text class="sT" x="510" y="154" text-anchor="middle">Small model</text>
<rect class="sW" x="280" y="186" width="130" height="44" rx="8"/><text class="sT" x="345" y="212" text-anchor="middle">Tools / agents</text>
<rect class="sB" x="610" y="100" width="140" height="56" rx="8"/><text class="sT" x="680" y="122" text-anchor="middle">Traces, evals,</text><text class="sT" x="680" y="138" text-anchor="middle">cost dashboards</text>
<rect class="sW" x="610" y="20" width="140" height="50" rx="8"/><text class="sT" x="680" y="42" text-anchor="middle">Ingestion</text><text class="sS" x="680" y="58" text-anchor="middle">parse · chunk · embed</text>
<line class="sL" x1="90" y1="122" x2="120" y2="122"/><line class="sL" x1="240" y1="110" x2="280" y2="50"/><line class="sL" x1="410" y1="45" x2="450" y2="45"/><line class="sL" x1="240" y1="125" x2="280" y2="128"/>
<line class="sL" x1="410" y1="120" x2="450" y2="109"/><line class="sL" x1="410" y1="136" x2="450" y2="149"/><line class="sD" x1="240" y1="145" x2="280" y2="205"/><line class="sD" x1="610" y1="45" x2="570" y2="45"/><line class="sD" x1="570" y1="128" x2="610" y2="128"/>
<circle class="sP" r="5"><animateMotion dur="7s" repeatCount="indefinite" path="M90 122 H180 L280 50 H450 H280 L180 122 L280 128 L450 109 L280 128 L180 122 H90"/></circle>
</svg><figcaption>Retrieval grounds the answer in your documents; the gateway controls which model is used, caches, enforces budgets and logs every call for evaluation and cost tracking.</figcaption></figure>

**Deep dives an interviewer will push on:**

| Topic | What to say |
|---|---|
| **Retrieval quality** | Chunk by document structure, hybrid search (keyword + vector), a reranker, metadata filters (department, date, the user's permissions), and measure retrieval separately from generation |
| **Permissions** | Filter retrieved documents by what *this user* may see before they reach the prompt; never rely on the model to hide them |
| **Model routing** | A small, cheap model for classification, extraction and simple questions; the large model only when needed; a fallback provider if one is down or rate-limited |
| **Caching** | Provider-side **prompt caching** for long fixed system prompts and documents (offered by the major LLM providers), an exact-match response cache for repeated questions, and, with care, a semantic cache for near-duplicates |
| **Streaming** | Stream tokens to the browser with SSE ([[SD3.5]]) so the first words appear in about a second |
| **Rate limits and budgets** | Per-user and per-tenant token budgets; queue or degrade gracefully when the provider returns 429 |
| **Guardrails** | Input checks (personal data, prompt injection patterns), output checks (grounding against sources, banned content), and refusing gracefully |
| **Evaluation** | A fixed test set of real questions with expected answers, scored on every prompt or model change (offline), plus user feedback and sampled human review (online) |
| **Agents and tools** | Every tool call is an API call with its own permissions, timeouts and idempotency ([[SD4.3]]); cap the number of steps; log the full trace; the Model Context Protocol (introduced by Anthropic in November 2024) is a common standard for exposing tools |
| **Self-hosting** | Only with a reason (data residency, cost at very high volume, a fine-tuned open model); serving engines such as vLLM use continuous batching and paged KV-cache memory to raise GPU throughput |

**Worked: an Arabic customer-support assistant for an Egyptian telecom.** 3 million customers; about 50,000 conversations a day, averaging 6 turns.

- **Estimate cost before designing:** if each turn sends ~3,000 input tokens (system prompt + retrieved passages + history) and returns ~300 output tokens, that is 50,000 × 6 × 3,300 ≈ **1 billion tokens a day**. Multiply by your provider's current per-million-token prices for input and output, and the monthly bill is a design input. Prompt caching of the fixed system prompt, trimming history, and routing simple intents ("my balance", "my bundle") to deterministic APIs instead of the LLM can cut it by more than half.
- **Design:** intent classification by a small model → account questions answered by calling the billing API directly (no generation needed); policy and troubleshooting questions answered by RAG over the help centre and plan documents in Arabic and English → the large model for complex cases → hand-off to a human agent with the conversation summary when confidence is low or the customer asks.
- **Arabic specifics:** Egyptian dialect in, Modern Standard Arabic or dialect out depending on brand voice; normalisation for retrieval; an evaluation set written by native speakers, including Franco-Arabic ("3arabizi") inputs.
- **Risk controls:** never let the model change a plan or issue a refund without a confirmed, authenticated tool call; mask national ID and phone numbers in logs; PDPL review for where conversations are stored ([[SD2.9]]).

> [!say]
> "For an LLM feature I size cost and latency first, because both scale with tokens. Then: retrieval with permission filters for grounding, a gateway for routing, caching and budgets, streaming for perceived latency, guardrails on input and output, and an evaluation set that runs on every change, because quality is probabilistic and regressions are silent."

## SD5.8 Network and connectivity: infrastructure design 🟡 ⭐

Network rounds ask you to design for **availability and performance at the infrastructure level**: remove single points of failure at every layer, segment for security, and prove it with monitoring. The building blocks are in [[N4]], [[N5]], [[N6]] and [[N7]].

**Redundancy, layer by layer:**

| Layer | Single point of failure | Redundant design |
|---|---|---|
| Internet | One ISP link | Two ISPs on diverse physical paths; BGP or SD-WAN to fail over |
| Edge | One firewall | A firewall pair in active-passive with state sync |
| Gateway | One default-gateway router | First-hop redundancy (HSRP, VRRP) with a virtual gateway IP ([[N5]]) |
| Switching | One uplink per access switch | Two uplinks bundled with LACP, or to two distribution switches; STP or a loop-free design ([[N4]]) |
| Data centre fabric | A single core switch | Spine-leaf: every leaf connects to every spine, equal-cost paths |
| Servers | One web server | Several behind a load-balancer pair with health checks ([[SD1.5]]) |
| Name resolution | One DNS server | Two or more resolvers; anycast for public services |
| Power | One feed | Dual power supplies on separate circuits, UPS, generator |

**Worked: a hospital campus network** (thinking of the systems you supported at Farwaniya Hospital).

- **Requirements:** clinical systems (the HIS, lab and radiology results, the pharmacy) must stay up 24/7; patient Wi-Fi must never reach clinical systems; medical devices often run old operating systems that can't be patched.
- **Segmentation:** separate VLANs and firewall zones for clinical workstations, servers, medical devices, staff Wi-Fi, guest Wi-Fi and management; deny by default between zones, allow only named flows (device → PACS on its port) ([[N7]]).
- **Redundancy:** dual core switches, dual uplinks from every closet, HSRP/VRRP gateways, a firewall pair, two ISPs, UPS on every closet switch; the server room's critical systems replicated to a second room or site.

<figure class="dia"><svg viewBox="0 0 720 284" role="img" aria-label="Redundant hospital network: two ISPs, a firewall pair, two core switches with a shared virtual gateway, and every closet switch dual-homed to both cores">
<rect class="sB" x="150" y="10" width="120" height="34" rx="8"/><text class="sT" x="210" y="32" text-anchor="middle">ISP 1</text><rect class="sB" x="450" y="10" width="120" height="34" rx="8"/><text class="sT" x="510" y="32" text-anchor="middle">ISP 2</text>
<rect class="sR" x="210" y="66" width="130" height="38" rx="8"/><text class="sT" x="275" y="83" text-anchor="middle">firewall A</text><text class="sC" x="275" y="99" text-anchor="middle">active</text><rect class="sR" x="380" y="66" width="130" height="38" rx="8"/><text class="sT" x="445" y="83" text-anchor="middle">firewall B</text><text class="sC" x="445" y="99" text-anchor="middle">standby</text>
<line class="sD" x1="340" y1="85" x2="380" y2="85"/><text class="sC" x="360" y="120" text-anchor="middle">state sync</text>
<line class="sLm" x1="210" y1="44" x2="250" y2="64"/><line class="sLm" x1="510" y1="44" x2="470" y2="64"/><line class="sLm" x1="270" y1="44" x2="430" y2="64" opacity=".4"/><line class="sLm" x1="450" y1="44" x2="290" y2="64" opacity=".4"/>
<rect class="sA" x="210" y="132" width="130" height="38" rx="8"/><text class="sT" x="275" y="149" text-anchor="middle">core switch 1</text><text class="sC" x="275" y="165" text-anchor="middle">VRRP gateway</text><rect class="sA" x="380" y="132" width="130" height="38" rx="8"/><text class="sT" x="445" y="149" text-anchor="middle">core switch 2</text><text class="sC" x="445" y="165" text-anchor="middle">VRRP gateway</text>
<line class="sLm" x1="275" y1="104" x2="275" y2="130"/><line class="sLm" x1="445" y1="104" x2="445" y2="130"/><line class="sLm" x1="275" y1="104" x2="445" y2="130" opacity=".4"/><line class="sLm" x1="445" y1="104" x2="275" y2="130" opacity=".4"/>
<line class="sLm" x1="340" y1="151" x2="380" y2="151" style="stroke-width:3"/>
<rect class="sB" x="40" y="202" width="130" height="36" rx="8"/><text class="sT" x="105" y="218" text-anchor="middle">ward A closet</text><text class="sC" x="105" y="234" text-anchor="middle">access switch</text>
<line class="sLg" x1="90" y1="202" x2="275" y2="170"/><line class="sLg" x1="120" y1="202" x2="445" y2="170"/>
<rect class="sB" x="200" y="202" width="130" height="36" rx="8"/><text class="sT" x="265" y="218" text-anchor="middle">ward B closet</text><text class="sC" x="265" y="234" text-anchor="middle">access switch</text>
<line class="sLg" x1="250" y1="202" x2="275" y2="170"/><line class="sLg" x1="280" y1="202" x2="445" y2="170"/>
<rect class="sB" x="360" y="202" width="130" height="36" rx="8"/><text class="sT" x="425" y="218" text-anchor="middle">radiology closet</text><text class="sC" x="425" y="234" text-anchor="middle">access switch</text>
<line class="sLg" x1="410" y1="202" x2="275" y2="170"/><line class="sLg" x1="440" y1="202" x2="445" y2="170"/>
<rect class="sB" x="520" y="202" width="130" height="36" rx="8"/><text class="sT" x="585" y="218" text-anchor="middle">admin closet</text><text class="sC" x="585" y="234" text-anchor="middle">access switch</text>
<line class="sLg" x1="570" y1="202" x2="275" y2="170"/><line class="sLg" x1="600" y1="202" x2="445" y2="170"/>
<text class="sC" x="360" y="258" text-anchor="middle">VLANs: clinical · servers · devices · staff Wi-Fi · guest Wi-Fi · management</text>
<text class="sC" x="360" y="274" text-anchor="middle">deny by default between them</text>
</svg><figcaption>No single box or cable takes the hospital offline: two ISPs, a firewall pair, two cores sharing a virtual gateway, and two uplinks from every closet (green).</figcaption></figure>

- **Wi-Fi:** WPA2/WPA3-Enterprise with 802.1X for staff, a captive portal on an isolated guest network, coverage surveys for wards ([[N6]]).
- **Monitoring and operations:** SNMP and flow monitoring with alerts on link and device health, centralised syslog, configuration backups, and a tested runbook for "core switch down" ([[N8]], [[N13]]).

> [!say]
> "I'd go layer by layer removing single points of failure (dual ISPs, a firewall pair, first-hop redundancy, dual uplinks with LACP, redundant power), segment by trust level with deny-by-default between zones, and prove it with monitoring and a failover test, because redundancy that has never been tested is a guess."

## SD5.9 A practice plan, by role 🟢

| Track | Practise these (45 minutes each, out loud) |
|---|---|
| Frontend | Autocomplete; infinite news feed; image gallery with lazy loading; a collaborative to-do list (offline + sync); a checkout form with validation and retries |
| Backend / full-stack | URL shortener; rate limiter; notifications; file upload service; chat; e-commerce checkout ([[B12.9]]) |
| Data analyst | A slow dashboard; a KPI that differs between two reports; designing a self-service sales model with row-level security |
| Data engineer | Ride-hailing events pipeline; CDC from an ERP into a lakehouse; a daily finance reconciliation; a clickstream pipeline with late data |
| Data scientist | Churn (batch); fraud (online); product recommendations; demand forecasting for a grocery chain |
| AI engineer | RAG over company documents with permissions; a customer-support assistant; a document-extraction pipeline for invoices; an agent that books appointments |
| Network & connectivity | A resilient branch; a hospital campus; connecting two offices with a VPN and failover; keeping a public website reachable through a DDoS |

> [!lab] Your own system, ten times bigger
> Take the project you know best and write one page: what exists today, the first bottleneck at 10× (with a rough estimate), the second at 100×, and what you would change in what order. For FinSight see [[B12.8]]; for the road-accident capstone, design the batch scoring and monitoring; for a network role, redesign a site you supported without its single points of failure. This page becomes your strongest interview answer.

## SD5.10 Interview drill 🟢 ⭐

| Question | Strong short answer |
|---|---|
| What framework do you use for any system design question? | Requirements and scale, estimates, interfaces, data, a high-level design, deep dives on the hard part, then trade-offs and monitoring. |
| Frontend: how do you stop stale autocomplete results? | Debounce input and cancel in-flight requests when the query changes, so an old response can't overwrite a newer one. |
| Frontend: CSR or SSR? | SSR or static generation when SEO and first-content speed on slow devices matter; CSR for logged-in, highly interactive apps. |
| Analyst: Import or DirectQuery in Power BI? | Import for speed with scheduled refresh; DirectQuery when data must be live, at the cost of speed and source load; composite models mix them. |
| Analyst: first step for a slow dashboard? | Measure with Performance Analyzer, then reduce data, fix the model to a star schema, and simplify the landing page. |
| Data engineer: what makes a pipeline idempotent? | Re-running a load produces the same result: merge or overwrite by partition, deduplicate on keys, never blind inserts. |
| Data engineer: batch or streaming? | Batch unless consumers truly need seconds-fresh data; streaming costs much more to build and operate. |
| Data scientist: batch or online scoring? | Batch when the decision isn't real-time (churn lists); online when it is (fraud at payment time), with a fallback. |
| Data scientist: what is training–serving skew? | Features computed differently in training and production; shared feature pipelines or a feature store prevent it. |
| AI engineer: how do you control LLM cost? | Estimate tokens per request × volume, route simple requests to small models or plain APIs, cache prompts and responses, trim context, enforce budgets. |
| AI engineer: how do you stop a RAG bot leaking documents? | Filter retrieval by the user's permissions before anything reaches the prompt; never trust the model to withhold. |
| AI engineer: how do you know a prompt change didn't make it worse? | Run a fixed evaluation set on every change and watch online feedback; quality regressions are otherwise silent. |
| Network: how do you make a default gateway redundant? | First-hop redundancy (HSRP or VRRP): two routers share a virtual IP and the standby takes over. |
| Network: why segment a hospital network? | So guest and staff devices can't reach clinical systems or unpatched medical devices; deny by default between zones. |

## Key takeaways

> [!check]
> - One framework everywhere: requirements and scale, estimates, interfaces, data, design, deep dives, trade-offs.
> - Frontend designs the client: rendering, fetching and caching, performance budgets on real devices, accessibility.
> - Analysts design for freshness, one definition per metric, and fast models.
> - Data engineers design idempotent, backfillable pipelines that cope with late data.
> - Data scientists choose batch or online serving and guard against skew and drift.
> - AI engineers design for token cost, time to first token, grounded answers, permissions and continuous evaluation.
> - Network engineers remove single points of failure layer by layer and segment by trust.

## Sources

- GreatFrontEnd, [Front End System Design: the RADIO framework](https://www.greatfrontend.com/front-end-system-design-playbook/framework); web.dev, [Core Web Vitals thresholds](https://web.dev/articles/defining-core-web-vitals-thresholds); W3C WAI-ARIA Authoring Practices, [Combobox pattern](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/).
- Microsoft Learn: [Power BI storage modes](https://learn.microsoft.com/en-us/power-bi/transform-model/desktop-storage-mode), [Direct Lake overview](https://learn.microsoft.com/en-us/fabric/fundamentals/direct-lake-overview), [Performance Analyzer](https://learn.microsoft.com/en-us/power-bi/create-reports/desktop-performance-analyzer).
- Databricks, [What is the medallion lakehouse architecture?](https://docs.databricks.com/aws/en/lakehouse/medallion); Martin Kleppmann, *Designing Data-Intensive Applications*, chapters 10–11 on batch and stream processing.
- Chip Huyen, *Designing Machine Learning Systems* (O'Reilly, 2022); Google, [Rules of Machine Learning](https://developers.google.com/machine-learning/guides/rules-of-ml).
- Anthropic, [Prompt caching](https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching) and [Introducing the Model Context Protocol](https://www.anthropic.com/news/model-context-protocol) (November 2024); OpenAI, [Prompt caching](https://platform.openai.com/docs/guides/prompt-caching); Woosuk Kwon et al., "Efficient Memory Management for Large Language Model Serving with PagedAttention" (SOSP 2023, the vLLM paper); [OWASP Top 10 for LLM Applications](https://genai.owasp.org/llm-top-10/).
- Cisco, [Spine-leaf architecture](https://www.cisco.com/c/en/us/products/collateral/switches/nexus-7000-series-switches/white-paper-c11-737022.html); IETF [RFC 5798: VRRP version 3](https://www.rfc-editor.org/rfc/rfc5798).
