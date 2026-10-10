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

<figure class="dia"><svg viewBox="0 0 720 244" role="img" aria-label="Customer lifetime value as the sum of expected monthly margins of 60 pounds shrinking with 96 percent retention: about 1,440 pounds, 1,152 with 1 percent monthly discounting, and 1,940 if churn falls to 3 percent">
<text class="sM" x="14" y="20">expected margin in month t = 60 EGP × rᵗ, where r is monthly retention</text>
<rect class="sA" x="14" y="32" width="12" height="10" rx="2"/><text class="sC" x="32" y="41">churn 4%</text><rect class="sG" x="110" y="32" width="12" height="10" rx="2"/><text class="sC" x="128" y="41">churn 4%, discounted 1%/month</text>
<line class="sLv" x1="330" y1="37" x2="352" y2="37"/><text class="sC" x="358" y="41">churn 3%</text>
<rect class="sA" x="51" y="70.4" width="9" height="105.6" rx="1" opacity=".55"/><rect class="sG" x="53" y="71.4455" width="5" height="104.554" rx="1"/>
<rect class="sA" x="62" y="74.624" width="9" height="101.376" rx="1" opacity=".55"/><rect class="sG" x="64" y="76.6215" width="5" height="99.3785" rx="1"/>
<rect class="sA" x="73" y="78.679" width="9" height="97.321" rx="1" opacity=".55"/><rect class="sG" x="75" y="81.5412" width="5" height="94.4588" rx="1"/>
<rect class="sA" x="84" y="82.5719" width="9" height="93.4281" rx="1" opacity=".55"/><rect class="sG" x="86" y="86.2174" width="5" height="89.7826" rx="1"/>
<rect class="sA" x="95" y="86.309" width="9" height="89.691" rx="1" opacity=".55"/><rect class="sG" x="97" y="90.6621" width="5" height="85.3379" rx="1"/>
<rect class="sA" x="106" y="89.8966" width="9" height="86.1034" rx="1" opacity=".55"/><rect class="sG" x="108" y="94.8867" width="5" height="81.1133" rx="1"/>
<rect class="sA" x="117" y="93.3408" width="9" height="82.6592" rx="1" opacity=".55"/><rect class="sG" x="119" y="98.9023" width="5" height="77.0977" rx="1"/>
<rect class="sA" x="128" y="96.6471" width="9" height="79.3529" rx="1" opacity=".55"/><rect class="sG" x="130" y="102.719" width="5" height="73.281" rx="1"/>
<rect class="sA" x="139" y="99.8213" width="9" height="76.1787" rx="1" opacity=".55"/><rect class="sG" x="141" y="106.347" width="5" height="69.6533" rx="1"/>
<rect class="sA" x="150" y="102.868" width="9" height="73.1316" rx="1" opacity=".55"/><rect class="sG" x="152" y="109.795" width="5" height="66.2051" rx="1"/>
<rect class="sA" x="161" y="105.794" width="9" height="70.2063" rx="1" opacity=".55"/><rect class="sG" x="163" y="113.072" width="5" height="62.9276" rx="1"/>
<rect class="sA" x="172" y="108.602" width="9" height="67.3981" rx="1" opacity=".55"/><rect class="sG" x="174" y="116.188" width="5" height="59.8124" rx="1"/>
<rect class="sA" x="183" y="111.298" width="9" height="64.7022" rx="1" opacity=".55"/><rect class="sG" x="185" y="119.149" width="5" height="56.8514" rx="1"/>
<rect class="sA" x="194" y="113.886" width="9" height="62.1141" rx="1" opacity=".55"/><rect class="sG" x="196" y="121.963" width="5" height="54.0369" rx="1"/>
<rect class="sA" x="205" y="116.37" width="9" height="59.6295" rx="1" opacity=".55"/><rect class="sG" x="207" y="124.638" width="5" height="51.3618" rx="1"/>
<rect class="sA" x="216" y="118.756" width="9" height="57.2443" rx="1" opacity=".55"/><rect class="sG" x="218" y="127.181" width="5" height="48.8192" rx="1"/>
<rect class="sA" x="227" y="121.045" width="9" height="54.9545" rx="1" opacity=".55"/><rect class="sG" x="229" y="129.598" width="5" height="46.4024" rx="1"/>
<rect class="sA" x="238" y="123.244" width="9" height="52.7564" rx="1" opacity=".55"/><rect class="sG" x="240" y="131.895" width="5" height="44.1052" rx="1"/>
<rect class="sA" x="249" y="125.354" width="9" height="50.6461" rx="1" opacity=".55"/><rect class="sG" x="251" y="134.078" width="5" height="41.9218" rx="1"/>
<rect class="sA" x="260" y="127.38" width="9" height="48.6203" rx="1" opacity=".55"/><rect class="sG" x="262" y="136.154" width="5" height="39.8465" rx="1"/>
<rect class="sA" x="271" y="129.325" width="9" height="46.6755" rx="1" opacity=".55"/><rect class="sG" x="273" y="138.126" width="5" height="37.8739" rx="1"/>
<rect class="sA" x="282" y="131.192" width="9" height="44.8084" rx="1" opacity=".55"/><rect class="sG" x="284" y="140.001" width="5" height="35.9989" rx="1"/>
<rect class="sA" x="293" y="132.984" width="9" height="43.0161" rx="1" opacity=".55"/><rect class="sG" x="295" y="141.783" width="5" height="34.2168" rx="1"/>
<rect class="sA" x="304" y="134.705" width="9" height="41.2955" rx="1" opacity=".55"/><rect class="sG" x="306" y="143.477" width="5" height="32.5229" rx="1"/>
<rect class="sA" x="315" y="136.356" width="9" height="39.6436" rx="1" opacity=".55"/><rect class="sG" x="317" y="145.087" width="5" height="30.9129" rx="1"/>
<rect class="sA" x="326" y="137.942" width="9" height="38.0579" rx="1" opacity=".55"/><rect class="sG" x="328" y="146.617" width="5" height="29.3825" rx="1"/>
<rect class="sA" x="337" y="139.464" width="9" height="36.5356" rx="1" opacity=".55"/><rect class="sG" x="339" y="148.072" width="5" height="27.9279" rx="1"/>
<rect class="sA" x="348" y="140.926" width="9" height="35.0742" rx="1" opacity=".55"/><rect class="sG" x="350" y="149.455" width="5" height="26.5454" rx="1"/>
<rect class="sA" x="359" y="142.329" width="9" height="33.6712" rx="1" opacity=".55"/><rect class="sG" x="361" y="150.769" width="5" height="25.2312" rx="1"/>
<rect class="sA" x="370" y="143.676" width="9" height="32.3243" rx="1" opacity=".55"/><rect class="sG" x="372" y="152.018" width="5" height="23.9822" rx="1"/>
<rect class="sA" x="381" y="144.969" width="9" height="31.0314" rx="1" opacity=".55"/><rect class="sG" x="383" y="153.205" width="5" height="22.7949" rx="1"/>
<rect class="sA" x="392" y="146.21" width="9" height="29.7901" rx="1" opacity=".55"/><rect class="sG" x="394" y="154.334" width="5" height="21.6665" rx="1"/>
<rect class="sA" x="403" y="147.401" width="9" height="28.5985" rx="1" opacity=".55"/><rect class="sG" x="405" y="155.406" width="5" height="20.5939" rx="1"/>
<rect class="sA" x="414" y="148.545" width="9" height="27.4546" rx="1" opacity=".55"/><rect class="sG" x="416" y="156.426" width="5" height="19.5744" rx="1"/>
<rect class="sA" x="425" y="149.644" width="9" height="26.3564" rx="1" opacity=".55"/><rect class="sG" x="427" y="157.395" width="5" height="18.6053" rx="1"/>
<rect class="sA" x="436" y="150.698" width="9" height="25.3021" rx="1" opacity=".55"/><rect class="sG" x="438" y="158.316" width="5" height="17.6843" rx="1"/>
<rect class="sA" x="447" y="151.71" width="9" height="24.29" rx="1" opacity=".55"/><rect class="sG" x="449" y="159.191" width="5" height="16.8088" rx="1"/>
<rect class="sA" x="458" y="152.682" width="9" height="23.3184" rx="1" opacity=".55"/><rect class="sG" x="460" y="160.023" width="5" height="15.9767" rx="1"/>
<rect class="sA" x="469" y="153.614" width="9" height="22.3857" rx="1" opacity=".55"/><rect class="sG" x="471" y="160.814" width="5" height="15.1858" rx="1"/>
<rect class="sA" x="480" y="154.51" width="9" height="21.4903" rx="1" opacity=".55"/><rect class="sG" x="482" y="161.566" width="5" height="14.434" rx="1"/>
<rect class="sA" x="491" y="155.369" width="9" height="20.6307" rx="1" opacity=".55"/><rect class="sG" x="493" y="162.281" width="5" height="13.7195" rx="1"/>
<rect class="sA" x="502" y="156.195" width="9" height="19.8054" rx="1" opacity=".55"/><rect class="sG" x="504" y="162.96" width="5" height="13.0403" rx="1"/>
<rect class="sA" x="513" y="156.987" width="9" height="19.0132" rx="1" opacity=".55"/><rect class="sG" x="515" y="163.605" width="5" height="12.3947" rx="1"/>
<rect class="sA" x="524" y="157.747" width="9" height="18.2527" rx="1" opacity=".55"/><rect class="sG" x="526" y="164.219" width="5" height="11.7811" rx="1"/>
<rect class="sA" x="535" y="158.477" width="9" height="17.5226" rx="1" opacity=".55"/><rect class="sG" x="537" y="164.802" width="5" height="11.1979" rx="1"/>
<rect class="sA" x="546" y="159.178" width="9" height="16.8217" rx="1" opacity=".55"/><rect class="sG" x="548" y="165.356" width="5" height="10.6435" rx="1"/>
<rect class="sA" x="557" y="159.851" width="9" height="16.1488" rx="1" opacity=".55"/><rect class="sG" x="559" y="165.883" width="5" height="10.1166" rx="1"/>
<rect class="sA" x="568" y="160.497" width="9" height="15.5029" rx="1" opacity=".55"/><rect class="sG" x="570" y="166.384" width="5" height="9.61581" rx="1"/>
<polyline class="sLv" points="56,69.3 67,72.5 78,75.6 89,78.6 100,81.5 111,84.4 122,87.1 133,89.8 144,92.4 155,94.9 166,97.3 177,99.7 188,102.0 199,104.2 210,106.3 221,108.4 232,110.5 243,112.4 254,114.3 265,116.2 276,118.0 287,119.7 298,121.4 309,123.0 320,124.6 331,126.2 342,127.7 353,129.1 364,130.5 375,131.9 386,133.2 397,134.5 408,135.7 419,136.9 430,138.1 441,139.3 452,140.4 463,141.4 474,142.5 485,143.5 496,144.4 507,145.4 518,146.3 529,147.2 540,148.1 551,148.9 562,149.7 573,150.5"/>
<line class="sLm" x1="40" y1="176" x2="590" y2="176"/>
<text class="sS" x="56" y="190" text-anchor="middle">m1</text>
<text class="sS" x="177" y="190" text-anchor="middle">m12</text>
<text class="sS" x="309" y="190" text-anchor="middle">m24</text>
<text class="sS" x="441" y="190" text-anchor="middle">m36</text>
<text class="sS" x="573" y="190" text-anchor="middle">m48</text>
<rect class="sN" x="600" y="56" width="112" height="104" rx="8"/><text class="sT" x="656" y="76" text-anchor="middle">CLV (sum)</text><text class="sC" x="656" y="98" text-anchor="middle">1,440 EGP</text><text class="sGt" x="656" y="118" text-anchor="middle">1,152 discounted</text><text class="sC" x="656" y="140" text-anchor="middle">1,940 at 3%</text>
<text class="sGt" x="360" y="212" text-anchor="middle">one point less churn: 1,440 → 1,940 EGP, +35% lifetime value per subscriber</text>
<text class="sS" x="360" y="232" text-anchor="middle">the closed forms: margin × r / (1 − r) undiscounted, margin × r / (1 + d − r) discounted; margin / churn = 1,500 is the quick version</text>
</svg><figcaption>CLV is an area: each bar is next month's margin times the chance the subscriber is still there. Lower churn makes the tail far longer. Computed.</figcaption></figure>

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

<figure class="dia steps"><svg viewBox="0 0 720 226" role="img" aria-label="Churn snapshot design on a monthly timeline: features from the three months before a cut-off, a short gap, then a two-month label window; several past snapshots are stacked for training and today's snapshot is scored">
<text class="sM" x="127" y="24" text-anchor="middle">Jan</text>
<line class="sLm" x1="96" y1="30" x2="96" y2="34"/>
<text class="sM" x="189" y="24" text-anchor="middle">Feb</text>
<line class="sLm" x1="158" y1="30" x2="158" y2="34"/>
<text class="sM" x="251" y="24" text-anchor="middle">Mar</text>
<line class="sLm" x1="220" y1="30" x2="220" y2="34"/>
<text class="sM" x="313" y="24" text-anchor="middle">Apr</text>
<line class="sLm" x1="282" y1="30" x2="282" y2="34"/>
<text class="sM" x="375" y="24" text-anchor="middle">May</text>
<line class="sLm" x1="344" y1="30" x2="344" y2="34"/>
<text class="sM" x="437" y="24" text-anchor="middle">Jun</text>
<line class="sLm" x1="406" y1="30" x2="406" y2="34"/>
<text class="sM" x="499" y="24" text-anchor="middle">Jul</text>
<line class="sLm" x1="468" y1="30" x2="468" y2="34"/>
<text class="sM" x="561" y="24" text-anchor="middle">Aug</text>
<line class="sLm" x1="530" y1="30" x2="530" y2="34"/>
<line class="sLm" x1="96" y1="32" x2="592" y2="32"/>
<g data-s="1"><text class="sC" x="88" y="76" text-anchor="end">snapshot Mar</text><rect class="sB" x="96" y="60" width="186" height="24" rx="4"/><text class="sC" x="189" y="76" text-anchor="middle">features</text><rect class="sA" x="297" y="60" width="124" height="24" rx="4"/><text class="sC" x="359" y="76" text-anchor="middle">label: churned?</text></g>
<g data-s="3"><text class="sC" x="88" y="108" text-anchor="end">snapshot Apr</text><rect class="sB" x="158" y="92" width="186" height="24" rx="4"/><text class="sC" x="251" y="108" text-anchor="middle">features</text><rect class="sA" x="359" y="92" width="124" height="24" rx="4"/><text class="sC" x="421" y="108" text-anchor="middle">label: churned?</text></g>
<g data-s="3"><text class="sC" x="88" y="140" text-anchor="end">snapshot May</text><rect class="sB" x="220" y="124" width="186" height="24" rx="4"/><text class="sC" x="313" y="140" text-anchor="middle">features</text><rect class="sA" x="421" y="124" width="124" height="24" rx="4"/><text class="sC" x="483" y="140" text-anchor="middle">label: churned?</text></g>
<g data-s="2"><line class="sLr" x1="282" y1="42" x2="282" y2="88"/><line class="sLr" x1="297" y1="42" x2="297" y2="88"/><text class="sRt" x="303" y="50">gap</text></g>
<g data-s="4"><text class="sGt" x="88" y="172" text-anchor="end">today: score</text><rect class="sB" x="406" y="156" width="186" height="24" rx="4"/><text class="sC" x="499" y="172" text-anchor="middle">features</text><rect class="sN" x="598" y="156" width="112" height="24" rx="4" stroke-dasharray="4 3"/><text class="sC" x="654" y="172" text-anchor="middle">label unknown</text><line class="sLg" x1="592" y1="38" x2="592" y2="190"/><text class="sGt" x="598" y="52">now</text></g>
<text class="sS" x="360" y="214" text-anchor="middle">features stop at the cut-off; the label is counted only after it; training stacks past snapshots, scoring uses today's</text>
</svg><ol class="dia-steps">
<li>One snapshot: features use only the three months <b>up to</b> the cut-off date T; the label (no recharge and no usage) is counted in the window <b>after</b> T.</li>
<li>A small gap between T and the label window mirrors real life: scoring and calling customers takes days, so the model must predict churn that has not already started.</li>
<li>Training stacks several monthly snapshots, so seasonality is covered and every row is a (customer, month) pair. Validate on the latest complete snapshot, never on random rows.</li>
<li>Today's snapshot has features but no label yet: that is the set the deployed model scores. Its label window ends in the future.</li>
</ol><figcaption>Snapshot design for churn: the single biggest defence against leakage in telecom models.</figcaption></figure>

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

<figure class="dia"><svg viewBox="0 0 720 264" role="img" aria-label="Eight weeks of daily traffic with a weekly pattern, then a 14-day forecast: the naive forecast repeats the last value and misses the weekly peaks, while the seasonal naive repeats last week and tracks them with a much lower error">
<polyline class="sL" points="40.0,176.0 48.9,158.2 57.7,143.3 66.6,138.3 75.4,118.9 84.3,69.6 93.1,102.0 102.0,173.4 110.9,141.2 119.7,127.7 128.6,136.9 137.4,133.1 146.3,74.7 155.1,84.4 164.0,164.0 172.9,156.2 181.7,137.3 190.6,144.5 199.4,126.4 208.3,68.9 217.1,98.2 226.0,159.1 234.9,142.0 243.7,138.4 252.6,131.0 261.4,113.7 270.3,74.6 279.1,92.5 288.0,167.4 296.9,140.3 305.7,140.8 314.6,131.3 323.4,117.3 332.3,62.7 341.1,95.6 350.0,160.9 358.9,144.3 367.7,138.8 376.6,127.4 385.4,122.4 394.3,49.9 403.1,80.8 412.0,169.6 420.9,132.3 429.7,134.6 438.6,126.3 447.4,111.8 456.3,69.6 465.1,85.0 474.0,155.0 482.9,125.0 491.7,132.7 500.6,118.9 509.4,117.4 518.3,55.5 527.1,86.8" style="stroke-width:1.8"/>
<polyline class="sLm" points="536.0,140.5 544.9,125.3 553.7,104.9 562.6,117.1 571.4,101.3 580.3,44.9 589.1,82.7 598.0,148.7 606.9,117.4 615.7,122.3 624.6,117.8 633.4,104.9 642.3,44.0 651.1,78.6" style="stroke-width:1.8;stroke-dasharray:3 3"/>
<polyline class="sLr" points="536.0,86.8 544.9,86.8 553.7,86.8 562.6,86.8 571.4,86.8 580.3,86.8 589.1,86.8 598.0,86.8 606.9,86.8 615.7,86.8 624.6,86.8 633.4,86.8 642.3,86.8 651.1,86.8" style="stroke-width:2.2"/>
<polyline class="sLg" points="536.0,155.0 544.9,125.0 553.7,132.7 562.6,118.9 571.4,117.4 580.3,55.5 589.1,86.8 598.0,155.0 606.9,125.0 615.7,132.7 624.6,118.9 633.4,117.4 642.3,55.5 651.1,86.8" style="stroke-width:2.2"/>
<line class="sD" x1="536" y1="26" x2="536" y2="196"/><text class="sS" x="532" y="24" text-anchor="end">forecast from here</text>
<line class="sLm" x1="40" y1="196" x2="660" y2="196"/>
<text class="sS" x="288" y="212" text-anchor="middle">8 weeks of daily traffic (history)</text><text class="sS" x="598" y="212" text-anchor="middle">next 14 days</text>
<text class="sRt" x="40" y="232">naive (last value): MAE 4.4</text><text class="sGt" x="300" y="232">seasonal naive (last week): MAE 1.4</text><text class="sS" x="660" y="232" text-anchor="end">MASE 0.33</text>
<text class="sS" x="360" y="252" text-anchor="middle">any model must beat the seasonal naive on a backtest before it earns a place in production</text>
</svg><figcaption>The two baselines, computed on a simulated series: with weekly seasonality, "same day last week" is already hard to beat.</figcaption></figure>

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

<figure class="dia"><svg viewBox="0 0 720 204" role="img" aria-label="A rolling three-day mean computed without shift includes the value being predicted on day 7; shifting by one first averages days 4 to 6 only, which is what is known at prediction time">
<rect class="sB" x="40" y="30" width="84" height="30" rx="5"/><text class="sC" x="82" y="50" text-anchor="middle">day 1: 12</text>
<rect class="sB" x="132" y="30" width="84" height="30" rx="5"/><text class="sC" x="174" y="50" text-anchor="middle">day 2: 15</text>
<rect class="sB" x="224" y="30" width="84" height="30" rx="5"/><text class="sC" x="266" y="50" text-anchor="middle">day 3: 11</text>
<rect class="sB" x="316" y="30" width="84" height="30" rx="5"/><text class="sC" x="358" y="50" text-anchor="middle">day 4: 18</text>
<rect class="sB" x="408" y="30" width="84" height="30" rx="5"/><text class="sC" x="450" y="50" text-anchor="middle">day 5: 20</text>
<rect class="sB" x="500" y="30" width="84" height="30" rx="5"/><text class="sC" x="542" y="50" text-anchor="middle">day 6: 14</text>
<rect class="sA" x="592" y="30" width="84" height="30" rx="5"/><text class="sC" x="634" y="50" text-anchor="middle">day 7: 30</text>
<text class="sWt" x="634" y="76" text-anchor="middle">target (to predict)</text>
<rect class="sR" x="405" y="92" width="274" height="30" rx="6" style="fill:none;stroke-width:2"/><text class="sRt" x="408" y="112">rolling(3).mean() = 21.3</text><text class="sC" x="40" y="112">without shift:</text>
<rect class="sG" x="313" y="136" width="274" height="30" rx="6" style="fill:none;stroke-width:2"/><text class="sGt" x="316" y="156">shift(1).rolling(3).mean() = 17.3</text><text class="sC" x="40" y="156">with shift(1):</text>
<text class="sS" x="360" y="192" text-anchor="middle">the leaky feature contains day 7's own 30, so offline scores look great and production collapses</text>
</svg><figcaption>Lag-feature leakage in one row of numbers: shift first, then roll.</figcaption></figure>

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

<figure class="dia anim"><svg viewBox="0 0 720 376" role="img" aria-label="The eight-step case framework as a loop, highlighted one step at a time: objective, target, data and features, baseline, model and validation, metric tied to value, deployment and monitoring, and measuring impact, each annotated with the churn example; a panel below lists the risks to close with">
<line class="sLm" x1="190" y1="42" x2="283" y2="42" marker-end="url(#ahm)"/>
<line class="sLm" x1="435" y1="42" x2="528" y2="42" marker-end="url(#ahm)"/>
<line class="sLm" x1="605" y1="64" x2="635" y2="118" marker-end="url(#ahm)"/>
<line class="sLm" x1="635" y1="164" x2="605" y2="218" marker-end="url(#ahm)"/>
<line class="sLm" x1="530" y1="242" x2="437" y2="242" marker-end="url(#ahm)"/>
<line class="sLm" x1="285" y1="242" x2="192" y2="242" marker-end="url(#ahm)"/>
<line class="sLm" x1="115" y1="220" x2="85" y2="166" marker-end="url(#ahm)"/>
<line class="sLm" x1="85" y1="120" x2="115" y2="66" marker-end="url(#ahm)"/>
<text class="sS" x="360" y="136" text-anchor="middle">measure, learn, and start again</text><text class="sS" x="360" y="154" text-anchor="middle">from a sharper objective</text>
<rect class="sN" x="40" y="20" width="150" height="44" rx="8"/>
<rect class="sG" x="40" y="20" width="150" height="44" rx="8" opacity="1"><animate attributeName="opacity" dur="16.0s" repeatCount="indefinite" calcMode="discrete" values="1;0" keyTimes="0;0.1250"/></rect>
<text class="sT" x="115" y="39" text-anchor="middle">1 objective</text><text class="sS" x="115" y="55" text-anchor="middle">retained margin, 20k calls</text>
<rect class="sN" x="285" y="20" width="150" height="44" rx="8"/>
<rect class="sG" x="285" y="20" width="150" height="44" rx="8" opacity="0"><animate attributeName="opacity" dur="16.0s" repeatCount="indefinite" calcMode="discrete" values="0;1;0" keyTimes="0;0.1250;0.2500"/></rect>
<text class="sT" x="360" y="39" text-anchor="middle">2 target</text><text class="sS" x="360" y="55" text-anchor="middle">no recharge 60 days</text>
<rect class="sN" x="530" y="20" width="150" height="44" rx="8"/>
<rect class="sG" x="530" y="20" width="150" height="44" rx="8" opacity="0"><animate attributeName="opacity" dur="16.0s" repeatCount="indefinite" calcMode="discrete" values="0;1;0" keyTimes="0;0.2500;0.3750"/></rect>
<text class="sT" x="605" y="39" text-anchor="middle">3 data, features</text><text class="sS" x="605" y="55" text-anchor="middle">as of the snapshot</text>
<rect class="sN" x="560" y="120" width="150" height="44" rx="8"/>
<rect class="sG" x="560" y="120" width="150" height="44" rx="8" opacity="0"><animate attributeName="opacity" dur="16.0s" repeatCount="indefinite" calcMode="discrete" values="0;1;0" keyTimes="0;0.3750;0.5000"/></rect>
<text class="sT" x="635" y="139" text-anchor="middle">4 baseline</text><text class="sS" x="635" y="155" text-anchor="middle">rule: 21 days idle</text>
<rect class="sN" x="530" y="220" width="150" height="44" rx="8"/>
<rect class="sG" x="530" y="220" width="150" height="44" rx="8" opacity="0"><animate attributeName="opacity" dur="16.0s" repeatCount="indefinite" calcMode="discrete" values="0;1;0" keyTimes="0;0.5000;0.6250"/></rect>
<text class="sT" x="605" y="239" text-anchor="middle">5 model, validation</text><text class="sS" x="605" y="255" text-anchor="middle">temporal split, calibrate</text>
<rect class="sN" x="285" y="220" width="150" height="44" rx="8"/>
<rect class="sG" x="285" y="220" width="150" height="44" rx="8" opacity="0"><animate attributeName="opacity" dur="16.0s" repeatCount="indefinite" calcMode="discrete" values="0;1;0" keyTimes="0;0.6250;0.7500"/></rect>
<text class="sT" x="360" y="239" text-anchor="middle">6 metric = value</text><text class="sS" x="360" y="255" text-anchor="middle">lift in the top 20k</text>
<rect class="sN" x="40" y="220" width="150" height="44" rx="8"/>
<rect class="sG" x="40" y="220" width="150" height="44" rx="8" opacity="0"><animate attributeName="opacity" dur="16.0s" repeatCount="indefinite" calcMode="discrete" values="0;1;0" keyTimes="0;0.7500;0.8750"/></rect>
<text class="sT" x="115" y="239" text-anchor="middle">7 deploy, monitor</text><text class="sS" x="115" y="255" text-anchor="middle">monthly batch, PSI</text>
<rect class="sN" x="10" y="120" width="150" height="44" rx="8"/>
<rect class="sG" x="10" y="120" width="150" height="44" rx="8" opacity="0"><animate attributeName="opacity" dur="16.0s" repeatCount="indefinite" calcMode="discrete" values="0;1;0" keyTimes="0;0.8750;1.0000"/></rect>
<text class="sT" x="85" y="139" text-anchor="middle">8 measure impact</text><text class="sS" x="85" y="155" text-anchor="middle">10% no-call control</text>
<rect class="sN" x="14" y="284" width="692" height="84" rx="8" opacity=".5"/><text class="sT" x="24" y="304">close with the risks:</text>
<text class="sS" x="24" y="326">• leakage from post-snapshot fields</text>
<text class="sS" x="370" y="326">• feedback loops: retained users stop looking like churners</text>
<text class="sS" x="24" y="344">• privacy: anonymised IDs only</text>
<text class="sS" x="370" y="344">• fairness across regions and plans</text>
<text class="sS" x="24" y="362">• agent capacity and adoption</text>
</svg><figcaption>The framework as a loop, annotated with the retention example below: impact measurement feeds the next objective.</figcaption></figure>

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

<figure class="dia anim"><svg viewBox="0 0 720 262" role="img" aria-label="Two deployment patterns: batch scoring, where a nightly scheduler builds features, the pipeline scores every subscriber and writes a scores table that the campaign tool reads; and a real-time API, where an app request passes through the API gateway to a FastAPI service with the pipeline loaded once, which returns a churn probability; both lanes are monitored for drift and latency">
<text class="sT" x="14" y="22">1  batch scoring: nightly, everyone at once</text>
<rect class="sN" x="14" y="32" width="128" height="48" rx="8"/><text class="sT" x="78" y="54" text-anchor="middle">scheduler</text><text class="sS" x="78" y="70" text-anchor="middle">Airflow / cron 02:00</text>
<rect class="sB" x="152" y="32" width="128" height="48" rx="8"/><text class="sT" x="216" y="54" text-anchor="middle">features</text><text class="sS" x="216" y="70" text-anchor="middle">SQL / Spark</text>
<rect class="sG" x="290" y="32" width="128" height="48" rx="8"/><text class="sT" x="354" y="54" text-anchor="middle">pipe.predict</text><text class="sS" x="354" y="70" text-anchor="middle">all subscribers</text>
<rect class="sA" x="428" y="32" width="128" height="48" rx="8"/><text class="sT" x="492" y="54" text-anchor="middle">scores table</text><text class="sS" x="492" y="70" text-anchor="middle">msisdn, p, version</text>
<rect class="sV" x="566" y="32" width="128" height="48" rx="8"/><text class="sT" x="630" y="54" text-anchor="middle">campaign tool</text><text class="sS" x="630" y="70" text-anchor="middle">reads top-N</text>
<line class="sLm" x1="144" y1="56" x2="150" y2="56" marker-end="url(#ahm)"/>
<line class="sLm" x1="282" y1="56" x2="288" y2="56" marker-end="url(#ahm)"/>
<line class="sLm" x1="420" y1="56" x2="426" y2="56" marker-end="url(#ahm)"/>
<line class="sLm" x1="558" y1="56" x2="564" y2="56" marker-end="url(#ahm)"/>
<circle class="sPg" r="5"><animateMotion dur="3.2s" repeatCount="indefinite" path="M 142 56 L 290 56 L 420 56 L 566 56"/></circle>
<text class="sS" x="360" y="100" text-anchor="middle">simple, cheap, auditable: a bad score can be traced to a row and a model version</text>
<text class="sT" x="14" y="132">2  real-time API: one request, one answer, in milliseconds</text>
<rect class="sN" x="14" y="142" width="150" height="48" rx="8"/><text class="sT" x="89" y="164" text-anchor="middle">app / ASP.NET</text><text class="sS" x="89" y="180" text-anchor="middle">at recharge</text>
<rect class="sB" x="172" y="142" width="150" height="48" rx="8"/><text class="sT" x="247" y="164" text-anchor="middle">API gateway</text><text class="sS" x="247" y="180" text-anchor="middle">auth, rate limit</text>
<rect class="sG" x="330" y="142" width="150" height="48" rx="8"/><text class="sT" x="405" y="164" text-anchor="middle">FastAPI /predict</text><text class="sS" x="405" y="180" text-anchor="middle">pipe loaded once</text>
<rect class="sA" x="510" y="142" width="150" height="48" rx="8"/><text class="sT" x="585" y="164" text-anchor="middle">response</text><text class="sS" x="585" y="180" text-anchor="middle">{"churn_probability"}</text>
<line class="sLm" x1="166" y1="160" x2="170" y2="160" marker-end="url(#ahm)"/>
<line class="sLm" x1="324" y1="160" x2="328" y2="160" marker-end="url(#ahm)"/>
<line class="sLm" x1="482" y1="160" x2="508" y2="160" marker-end="url(#ahm)"/>
<circle class="sPw" r="5"><animateMotion dur="1.6s" repeatCount="indefinite" path="M 164 160 L 330 160 L 510 160"/></circle>
<line class="sLg" x1="510" y1="178" x2="164" y2="178" marker-end="url(#ahg)" stroke-dasharray="4 3"/>
<text class="sS" x="360" y="212" text-anchor="middle">same Pipeline object as training: the features are transformed identically in both lanes</text>
<rect class="sN" x="14" y="224" width="692" height="30" rx="6"/><text class="sS" x="360" y="244" text-anchor="middle">monitor both: input drift (PSI, new categories) · score drift · accuracy once labels arrive · latency</text>
</svg><figcaption>Batch versus real-time serving of the same saved pipeline. Most telecom marketing uses the first lane; fraud and offers at recharge need the second.</figcaption></figure>

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

<figure class="dia steps"><svg viewBox="0 0 720 220" role="img" aria-label="A six-row frame of governorates and revenue: groupby sum collapses it to three rows; groupby transform sum keeps six rows, each with its governorate total, so the share of the governorate can be computed; groupby rank numbers rows within each governorate">
<text class="sM" x="14" y="24">df</text>
<text class="sT" x="70" y="42" text-anchor="middle">governorate</text>
<text class="sT" x="170" y="42" text-anchor="middle">revenue</text>
<rect class="sB" x="14" y="52" width="210" height="21" rx="4" opacity=".45"/><text class="sS" x="70" y="68" text-anchor="middle">Cairo</text><text class="sS" x="170" y="68" text-anchor="middle">120</text>
<rect class="sV" x="14" y="76" width="210" height="21" rx="4" opacity=".45"/><text class="sS" x="70" y="92" text-anchor="middle">Giza</text><text class="sS" x="170" y="92" text-anchor="middle">80</text>
<rect class="sB" x="14" y="100" width="210" height="21" rx="4" opacity=".45"/><text class="sS" x="70" y="116" text-anchor="middle">Cairo</text><text class="sS" x="170" y="116" text-anchor="middle">60</text>
<rect class="sA" x="14" y="124" width="210" height="21" rx="4" opacity=".45"/><text class="sS" x="70" y="140" text-anchor="middle">Alex</text><text class="sS" x="170" y="140" text-anchor="middle">50</text>
<rect class="sV" x="14" y="148" width="210" height="21" rx="4" opacity=".45"/><text class="sS" x="70" y="164" text-anchor="middle">Giza</text><text class="sS" x="170" y="164" text-anchor="middle">40</text>
<rect class="sB" x="14" y="172" width="210" height="21" rx="4" opacity=".45"/><text class="sS" x="70" y="188" text-anchor="middle">Cairo</text><text class="sS" x="170" y="188" text-anchor="middle">20</text>
<g data-s="2-2"><text class="sS" x="270" y="24" xml:space="preserve" style="white-space:pre">df.groupby("governorate")["revenue"].sum()</text><text class="sT" x="330" y="42" text-anchor="middle">governorate</text><text class="sT" x="430" y="42" text-anchor="middle">revenue</text><rect class="sA" x="270" y="52" width="210" height="44" rx="4" opacity=".45"/><text class="sT" x="330" y="79" text-anchor="middle">Alex</text><text class="sT" x="430" y="79" text-anchor="middle">50</text><rect class="sB" x="270" y="100" width="210" height="44" rx="4" opacity=".45"/><text class="sT" x="330" y="127" text-anchor="middle">Cairo</text><text class="sT" x="430" y="127" text-anchor="middle">200</text><rect class="sV" x="270" y="148" width="210" height="44" rx="4" opacity=".45"/><text class="sT" x="330" y="175" text-anchor="middle">Giza</text><text class="sT" x="430" y="175" text-anchor="middle">120</text><text class="sWt" x="375" y="214" text-anchor="middle">6 rows → 3: one row per group</text></g>
<g data-s="3-3"><text class="sS" x="270" y="24" xml:space="preserve" style="white-space:pre">.transform("sum")  →  same index as df</text><text class="sT" x="320" y="42" text-anchor="middle">gov_total</text><text class="sT" x="420" y="42" text-anchor="middle">share_of_gov</text><rect class="sB" x="270" y="52" width="210" height="21" rx="4" opacity=".45"/><text class="sS" x="320" y="68" text-anchor="middle">200</text><text class="sGt" x="420" y="68" text-anchor="middle">60%</text><line class="sLm" x1="226" y1="62" x2="266" y2="62" marker-end="url(#ahm)" opacity=".5"/><rect class="sV" x="270" y="76" width="210" height="21" rx="4" opacity=".45"/><text class="sS" x="320" y="92" text-anchor="middle">120</text><text class="sGt" x="420" y="92" text-anchor="middle">67%</text><line class="sLm" x1="226" y1="86" x2="266" y2="86" marker-end="url(#ahm)" opacity=".5"/><rect class="sB" x="270" y="100" width="210" height="21" rx="4" opacity=".45"/><text class="sS" x="320" y="116" text-anchor="middle">200</text><text class="sGt" x="420" y="116" text-anchor="middle">30%</text><line class="sLm" x1="226" y1="110" x2="266" y2="110" marker-end="url(#ahm)" opacity=".5"/><rect class="sA" x="270" y="124" width="210" height="21" rx="4" opacity=".45"/><text class="sS" x="320" y="140" text-anchor="middle">50</text><text class="sGt" x="420" y="140" text-anchor="middle">100%</text><line class="sLm" x1="226" y1="134" x2="266" y2="134" marker-end="url(#ahm)" opacity=".5"/><rect class="sV" x="270" y="148" width="210" height="21" rx="4" opacity=".45"/><text class="sS" x="320" y="164" text-anchor="middle">120</text><text class="sGt" x="420" y="164" text-anchor="middle">33%</text><line class="sLm" x1="226" y1="158" x2="266" y2="158" marker-end="url(#ahm)" opacity=".5"/><rect class="sB" x="270" y="172" width="210" height="21" rx="4" opacity=".45"/><text class="sS" x="320" y="188" text-anchor="middle">200</text><text class="sGt" x="420" y="188" text-anchor="middle">10%</text><line class="sLm" x1="226" y1="182" x2="266" y2="182" marker-end="url(#ahm)" opacity=".5"/><text class="sGt" x="375" y="214" text-anchor="middle">every row keeps its place: divide row-wise</text></g>
<g data-s="4-4"><text class="sS" x="270" y="24" xml:space="preserve" style="white-space:pre">.rank(ascending=False, method="dense")</text><text class="sT" x="320" y="42" text-anchor="middle">rank_in_gov</text><rect class="sB" x="270" y="52" width="100" height="21" rx="4" opacity=".45"/><text class="sT" x="320" y="68" text-anchor="middle">1</text><rect class="sV" x="270" y="76" width="100" height="21" rx="4" opacity=".45"/><text class="sT" x="320" y="92" text-anchor="middle">1</text><rect class="sB" x="270" y="100" width="100" height="21" rx="4" opacity=".45"/><text class="sT" x="320" y="116" text-anchor="middle">2</text><rect class="sA" x="270" y="124" width="100" height="21" rx="4" opacity=".45"/><text class="sT" x="320" y="140" text-anchor="middle">1</text><rect class="sV" x="270" y="148" width="100" height="21" rx="4" opacity=".45"/><text class="sT" x="320" y="164" text-anchor="middle">2</text><rect class="sB" x="270" y="172" width="100" height="21" rx="4" opacity=".45"/><text class="sT" x="320" y="188" text-anchor="middle">3</text><text class="sGt" x="375" y="214" text-anchor="middle">ranks restart inside each group</text></g>
<rect class="sN" x="510" y="52" width="196" height="140" rx="8"/><text class="sT" x="608" y="74" text-anchor="middle">SQL equivalent</text>
<g data-s="2-2"><text class="sS" x="520" y="100" xml:space="preserve" style="white-space:pre">GROUP BY governorate</text></g>
<g data-s="3-3"><text class="sS" x="520" y="100" xml:space="preserve" style="white-space:pre">SUM(revenue) OVER</text><text class="sS" x="520" y="118" xml:space="preserve" style="white-space:pre">  (PARTITION BY gov)</text></g>
<g data-s="4-4"><text class="sS" x="520" y="100" xml:space="preserve" style="white-space:pre">DENSE_RANK() OVER</text><text class="sS" x="520" y="118" xml:space="preserve" style="white-space:pre">  (PARTITION BY gov</text><text class="sS" x="520" y="136" xml:space="preserve" style="white-space:pre">   ORDER BY revenue DESC)</text></g>
</svg><ol class="dia-steps">
<li>Six rows, three governorates.</li>
<li>agg (or sum) collapses each group to one row: the shape of GROUP BY.</li>
<li>transform computes the same group sum but returns it aligned to the original rows, so share_of_gov is a plain row-wise division: a window function.</li>
<li>rank within groups numbers rows inside each governorate, like DENSE_RANK() OVER (PARTITION BY …).</li>
</ol><figcaption>agg versus transform versus rank on the same six rows (computed with pandas), with the SQL each one corresponds to.</figcaption></figure>

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

<figure class="dia"><svg viewBox="0 0 720 280" role="img" aria-label="Customers in ten risk deciles: churn risk falls from 62 percent in decile 1 to 2 percent in decile 10, while the churn an offer prevents peaks at 9 percent in decile 3 and is only 2 percent in decile 1">
<text class="sM" x="706" y="60" text-anchor="end">churn risk without an offer</text><text class="sM" x="706" y="156" text-anchor="end">uplift: churn the offer prevents</text>
<rect class="sR" x="70" y="41.6" width="36" height="74.4" rx="2" opacity=".8"/><text class="sS" x="88" y="37.6" text-anchor="middle">62%</text>
<rect class="sG" x="70" y="198" width="36" height="12" rx="2"/><text class="sS" x="88" y="194" text-anchor="middle">+2%</text>
<text class="sC" x="88" y="128" text-anchor="middle">d1</text>
<rect class="sR" x="130" y="68" width="36" height="48" rx="2" opacity=".8"/><text class="sS" x="148" y="64" text-anchor="middle">40%</text>
<rect class="sG" x="130" y="174" width="36" height="36" rx="2"/><text class="sS" x="148" y="170" text-anchor="middle">+6%</text>
<text class="sC" x="148" y="128" text-anchor="middle">d2</text>
<rect class="sR" x="190" y="82.4" width="36" height="33.6" rx="2" opacity=".8"/><text class="sS" x="208" y="78.4" text-anchor="middle">28%</text>
<rect class="sG" x="190" y="156" width="36" height="54" rx="2"/><text class="sS" x="208" y="152" text-anchor="middle">+9%</text>
<text class="sC" x="208" y="128" text-anchor="middle">d3</text>
<rect class="sR" x="250" y="92" width="36" height="24" rx="2" opacity=".8"/><text class="sS" x="268" y="88" text-anchor="middle">20%</text>
<rect class="sG" x="250" y="162" width="36" height="48" rx="2"/><text class="sS" x="268" y="158" text-anchor="middle">+8%</text>
<text class="sC" x="268" y="128" text-anchor="middle">d4</text>
<rect class="sR" x="310" y="99.2" width="36" height="16.8" rx="2" opacity=".8"/><text class="sS" x="328" y="95.2" text-anchor="middle">14%</text>
<rect class="sG" x="310" y="174" width="36" height="36" rx="2"/><text class="sS" x="328" y="170" text-anchor="middle">+6%</text>
<text class="sC" x="328" y="128" text-anchor="middle">d5</text>
<rect class="sR" x="370" y="104" width="36" height="12" rx="2" opacity=".8"/><text class="sS" x="388" y="100" text-anchor="middle">10%</text>
<rect class="sG" x="370" y="186" width="36" height="24" rx="2"/><text class="sS" x="388" y="182" text-anchor="middle">+4%</text>
<text class="sC" x="388" y="128" text-anchor="middle">d6</text>
<rect class="sR" x="430" y="107.6" width="36" height="8.4" rx="2" opacity=".8"/><text class="sS" x="448" y="103.6" text-anchor="middle">7%</text>
<rect class="sG" x="430" y="198" width="36" height="12" rx="2"/><text class="sS" x="448" y="194" text-anchor="middle">+2%</text>
<text class="sC" x="448" y="128" text-anchor="middle">d7</text>
<rect class="sR" x="490" y="110" width="36" height="6" rx="2" opacity=".8"/><text class="sS" x="508" y="106" text-anchor="middle">5%</text>
<rect class="sG" x="490" y="204" width="36" height="6" rx="2"/><text class="sS" x="508" y="200" text-anchor="middle">+1%</text>
<text class="sC" x="508" y="128" text-anchor="middle">d8</text>
<rect class="sR" x="550" y="112.4" width="36" height="3.6" rx="2" opacity=".8"/><text class="sS" x="568" y="108.4" text-anchor="middle">3%</text>
<rect class="sG" x="550" y="210" width="36" height="1" rx="2"/><text class="sS" x="568" y="206" text-anchor="middle">0%</text>
<text class="sC" x="568" y="128" text-anchor="middle">d9</text>
<rect class="sR" x="610" y="113.6" width="36" height="2.4" rx="2" opacity=".8"/><text class="sS" x="628" y="109.6" text-anchor="middle">2%</text>
<rect class="sG" x="610" y="210" width="36" height="6" rx="2"/><text class="sS" x="628" y="226" text-anchor="middle">-1%</text>
<text class="sC" x="628" y="128" text-anchor="middle">d10</text>
<line class="sLm" x1="60" y1="116" x2="666" y2="116"/><line class="sLm" x1="60" y1="210" x2="666" y2="210"/>
<rect class="sR" x="64" y="26" width="48" height="196" rx="6" style="fill:none" stroke-dasharray="5 3"/><rect class="sG" x="184" y="26" width="48" height="196" rx="6" style="fill:none" stroke-dasharray="5 3"/>
<text class="sGt" x="360" y="250" text-anchor="middle">20,000 calls to decile 1 (highest risk) save 400 customers; the same calls to decile 3 save 1,800</text>
<text class="sS" x="360" y="268" text-anchor="middle">the riskiest customers are often lost causes; uplift peaks in the middle (illustrative numbers)</text>
</svg><figcaption>Why a 0.92-AUC risk model can drive a campaign that changes nothing: risk ranks who will leave, uplift ranks who an offer will keep.</figcaption></figure>

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

<figure class="dia"><svg viewBox="0 0 720 276" role="img" aria-label="The study plan as a calendar: week 1 covers ML basics, preprocessing, SQL, pandas and statistics; week 2 supervised learning, thresholds and calibration, boosting with SHAP and exercises; week 3 clustering, PyTorch, A/B test design and time series; week 4 use cases, recorded case answers, a FastAPI and Docker deployment, STAR stories, rapid-fire questions, a mock interview and a rest day; optional weeks 5 and 6 cover deep learning, forecasting, Arabic BERT and RAG, vision, generative models and reinforcement learning, state of the art, and more mock questions">
<text class="sS" x="134" y="22" text-anchor="middle">day 1</text>
<text class="sS" x="194" y="22" text-anchor="middle">day 2</text>
<text class="sS" x="254" y="22" text-anchor="middle">day 3</text>
<text class="sS" x="314" y="22" text-anchor="middle">day 4</text>
<text class="sS" x="374" y="22" text-anchor="middle">day 5</text>
<text class="sS" x="434" y="22" text-anchor="middle">day 6</text>
<text class="sS" x="494" y="22" text-anchor="middle">day 7</text>
<text class="sS" x="554" y="22" text-anchor="middle">day 8</text>
<text class="sS" x="614" y="22" text-anchor="middle">day 9</text>
<text class="sS" x="674" y="22" text-anchor="middle">day 10</text>
<text class="sT" x="14" y="48">week 1</text><text class="sS" x="14" y="63">foundations</text>
<rect class="sB" x="105" y="32" width="117" height="36" rx="5"/>
<text class="sS" x="164" y="54" text-anchor="middle">ML basics</text>
<rect class="sB" x="225" y="32" width="57" height="36" rx="5"/>
<text class="sS" x="254" y="47" text-anchor="middle">pre-</text><text class="sS" x="254" y="61" text-anchor="middle">process</text>
<rect class="sB" x="285" y="32" width="57" height="36" rx="5"/>
<text class="sS" x="314" y="54" text-anchor="middle">SQL</text>
<rect class="sB" x="345" y="32" width="57" height="36" rx="5"/>
<text class="sS" x="374" y="54" text-anchor="middle">pandas</text>
<rect class="sA" x="405" y="32" width="117" height="36" rx="5"/>
<text class="sS" x="464" y="47" text-anchor="middle">statistics</text><text class="sS" x="464" y="61" text-anchor="middle">puzzles</text>
<text class="sT" x="14" y="92">week 2</text><text class="sS" x="14" y="107">supervised</text>
<rect class="sG" x="105" y="76" width="57" height="36" rx="5"/>
<text class="sS" x="134" y="91" text-anchor="middle">GD in</text><text class="sS" x="134" y="105" text-anchor="middle">NumPy</text>
<rect class="sG" x="165" y="76" width="117" height="36" rx="5"/>
<text class="sS" x="224" y="91" text-anchor="middle">threshold, PR,</text><text class="sS" x="224" y="105" text-anchor="middle">calibration</text>
<rect class="sG" x="285" y="76" width="117" height="36" rx="5"/>
<text class="sS" x="344" y="91" text-anchor="middle">boosting</text><text class="sS" x="344" y="105" text-anchor="middle">+ SHAP</text>
<rect class="sG" x="405" y="76" width="117" height="36" rx="5"/>
<text class="sS" x="464" y="91" text-anchor="middle">Géron</text><text class="sS" x="464" y="105" text-anchor="middle">exercises</text>
<text class="sT" x="14" y="136">week 3</text><text class="sS" x="14" y="151">beyond</text>
<rect class="sV" x="105" y="120" width="117" height="36" rx="5"/>
<text class="sS" x="164" y="135" text-anchor="middle">clustering</text><text class="sS" x="164" y="149" text-anchor="middle">segments</text>
<rect class="sV" x="225" y="120" width="117" height="36" rx="5"/>
<text class="sS" x="284" y="135" text-anchor="middle">PyTorch</text><text class="sS" x="284" y="149" text-anchor="middle">MLP vs GBM</text>
<rect class="sA" x="345" y="120" width="117" height="36" rx="5"/>
<text class="sS" x="404" y="135" text-anchor="middle">A/B test</text><text class="sS" x="404" y="149" text-anchor="middle">design</text>
<rect class="sA" x="465" y="120" width="57" height="36" rx="5"/>
<text class="sS" x="494" y="135" text-anchor="middle">time</text><text class="sS" x="494" y="149" text-anchor="middle">series</text>
<text class="sT" x="14" y="180">week 4</text><text class="sS" x="14" y="195">interview</text>
<rect class="sW" x="105" y="164" width="57" height="36" rx="5"/>
<text class="sS" x="134" y="179" text-anchor="middle">use</text><text class="sS" x="134" y="193" text-anchor="middle">cases</text>
<rect class="sW" x="165" y="164" width="57" height="36" rx="5"/>
<text class="sS" x="194" y="179" text-anchor="middle">record</text><text class="sS" x="194" y="193" text-anchor="middle">cases</text>
<rect class="sW" x="225" y="164" width="57" height="36" rx="5"/>
<text class="sS" x="254" y="179" text-anchor="middle">FastAPI</text><text class="sS" x="254" y="193" text-anchor="middle">Docker</text>
<rect class="sW" x="285" y="164" width="57" height="36" rx="5"/>
<text class="sS" x="314" y="179" text-anchor="middle">STAR</text><text class="sS" x="314" y="193" text-anchor="middle">stories</text>
<rect class="sW" x="345" y="164" width="57" height="36" rx="5"/>
<text class="sS" x="374" y="179" text-anchor="middle">rapid-</text><text class="sS" x="374" y="193" text-anchor="middle">fire</text>
<rect class="sW" x="405" y="164" width="57" height="36" rx="5"/>
<text class="sS" x="434" y="179" text-anchor="middle">mock</text><text class="sS" x="434" y="193" text-anchor="middle">interview</text>
<rect class="sN" x="465" y="164" width="57" height="36" rx="5"/>
<text class="sS" x="494" y="186" text-anchor="middle">rest</text>
<text class="sT" x="14" y="224">weeks 5–6</text><text class="sS" x="14" y="239">optional</text>
<rect class="sV" x="105" y="208" width="117" height="36" rx="5" style="stroke-dasharray:4 3"/>
<text class="sS" x="164" y="223" text-anchor="middle">training</text><text class="sS" x="164" y="237" text-anchor="middle">deep nets</text>
<rect class="sV" x="225" y="208" width="57" height="36" rx="5" style="stroke-dasharray:4 3"/>
<text class="sS" x="254" y="223" text-anchor="middle">fore-</text><text class="sS" x="254" y="237" text-anchor="middle">casting</text>
<rect class="sV" x="285" y="208" width="117" height="36" rx="5" style="stroke-dasharray:4 3"/>
<text class="sS" x="344" y="223" text-anchor="middle">Arabic BERT</text><text class="sS" x="344" y="237" text-anchor="middle">+ RAG bot</text>
<rect class="sV" x="405" y="208" width="57" height="36" rx="5" style="stroke-dasharray:4 3"/>
<text class="sS" x="434" y="223" text-anchor="middle">CNN, ViT</text><text class="sS" x="434" y="237" text-anchor="middle">CLIP</text>
<rect class="sV" x="465" y="208" width="57" height="36" rx="5" style="stroke-dasharray:4 3"/>
<text class="sS" x="494" y="223" text-anchor="middle">GenAI, RL</text><text class="sS" x="494" y="237" text-anchor="middle">bandits</text>
<rect class="sV" x="525" y="208" width="57" height="36" rx="5" style="stroke-dasharray:4 3"/>
<text class="sS" x="554" y="223" text-anchor="middle">SOTA</text><text class="sS" x="554" y="237" text-anchor="middle">points</text>
<rect class="sW" x="585" y="208" width="117" height="36" rx="5" style="stroke-dasharray:4 3"/>
<text class="sS" x="644" y="223" text-anchor="middle">questions</text><text class="sS" x="644" y="237" text-anchor="middle">61–90 + mock</text>
<rect class="sB" x="20" y="254" width="14" height="12" rx="3"/><text class="sS" x="40" y="264">data foundations</text>
<rect class="sA" x="143.6" y="254" width="14" height="12" rx="3"/><text class="sS" x="163.6" y="264">stats &amp; experiments</text>
<rect class="sG" x="284" y="254" width="14" height="12" rx="3"/><text class="sS" x="304" y="264">supervised ML</text>
<rect class="sV" x="390.8" y="254" width="14" height="12" rx="3"/><text class="sS" x="410.8" y="264">unsupervised &amp; deep learning</text>
<rect class="sW" x="581.6" y="254" width="14" height="12" rx="3"/><text class="sS" x="601.6" y="264">interview</text>
</svg><figcaption>The plan below at a glance, assuming 2–3 focused hours a day. Dashed: the optional deep-learning extension for mid-level and AI-flavoured roles.</figcaption></figure>

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
