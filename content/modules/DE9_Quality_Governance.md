# Data Quality, Observability and Governance — Tests, Contracts, Lineage, Access and Privacy

A pipeline that runs on time but publishes wrong numbers is worse than one that fails loudly: decisions get made on bad data, and trust takes months to rebuild. Mid-level DE interviews ask how you'd **know** data is right, what happens when it isn't, who owns it, who may see it, and how you'd delete a customer's personal data on request. This module covers data-quality dimensions and tests, observability, failure handling, data contracts, lineage and catalogs, and governance and privacy, including Egypt's data-protection law.

> [!focus]
> **Entry must:** name the main data-quality dimensions; add tests for uniqueness, nulls, accepted values and relationships; check freshness and volume; explain why a pipeline should fail rather than publish bad data.
> **Mid adds:** where to place checks in a pipeline (contracts, write-audit-publish), fail vs warn vs quarantine, the five pillars of data observability, data contracts with producers, column-level lineage and catalogs, access control with row- and column-level security and masking, PII handling, retention and deletion.
> **Most asked:** *How do you ensure data quality?* · *What do you test?* · *What happens when a check fails?* · *How do you detect a silent upstream change?* · *What is a data contract?* · *What is data lineage?* · *How do you protect PII?* · *How do you handle a deletion request?*
> **Time budget:** 3 hours.

## DE9.0 Foundations: data fails silently 🟢

When code breaks, it usually crashes: an exception, a failed build, a red alert. When **data** breaks, everything keeps running. A renamed field becomes NULLs, a unit change multiplies revenue by 100, a half-delivered file halves yesterday's orders, and every job still reports success. The wrong numbers flow downstream into dashboards and models, looking perfectly plausible, until a person happens to notice.

So data quality can't rely on things failing loudly. It needs **explicit checks** at each stage, **monitoring** that knows what normal looks like, **contracts** with the teams that produce data, and **lineage** to find causes and consequences fast.

<figure class="dia steps"><svg viewBox="0 0 720 256" role="img" aria-label="A silent upstream change multiplies amounts by 100; every pipeline job succeeds, and the wrong numbers reach a CFO dashboard, an operations dashboard and a forecast model, unless a distribution check stops it">
<line class="sLm" x1="144" y1="116" x2="162" y2="116" marker-end="url(#ahm)"/>
<line class="sLm" x1="274" y1="116" x2="292" y2="116" marker-end="url(#ahm)"/>
<line class="sLm" x1="404" y1="116" x2="422" y2="116" marker-end="url(#ahm)"/>
<line class="sLm" x1="554" y1="116" x2="578" y2="40" marker-end="url(#ahm)"/>
<line class="sLm" x1="554" y1="116" x2="578" y2="116" marker-end="url(#ahm)"/>
<line class="sLm" x1="554" y1="116" x2="578" y2="192" marker-end="url(#ahm)"/>
<rect class="sB" x="14" y="96" width="130" height="40" rx="8"/>
<rect class="sB" x="164" y="96" width="110" height="40" rx="8"/>
<rect class="sB" x="294" y="96" width="110" height="40" rx="8"/>
<rect class="sB" x="424" y="96" width="130" height="40" rx="8"/>
<rect class="sB" x="580" y="20" width="126" height="40" rx="8"/>
<rect class="sB" x="580" y="96" width="126" height="40" rx="8"/>
<rect class="sB" x="580" y="172" width="126" height="40" rx="8"/>
<g data-s="1"><rect class="sR" x="14" y="96" width="130" height="40" rx="8"/><text class="sRt" x="80" y="160" text-anchor="middle">amount now in piastres</text><text class="sRt" x="80" y="178" text-anchor="middle">(× 100), no announcement</text></g>
<g data-s="2"><rect class="sW" x="164" y="96" width="110" height="40" rx="8"/><rect class="sW" x="294" y="96" width="110" height="40" rx="8"/><rect class="sW" x="424" y="96" width="130" height="40" rx="8"/><text class="sWt" x="300" y="160" text-anchor="middle">every job succeeds: no error, no alert</text></g>
<g data-s="3"><rect class="sR" x="580" y="20" width="126" height="40" rx="8"/><rect class="sR" x="580" y="96" width="126" height="40" rx="8"/><rect class="sR" x="580" y="172" width="126" height="40" rx="8"/><text class="sRt" x="300" y="200" text-anchor="middle">plausible-looking wrong numbers spread</text></g>
<g data-s="4"><rect class="sG" x="150" y="222" width="420" height="26" rx="6"/><text class="sC" x="360" y="240" text-anchor="middle">a distribution check at bronze would have stopped it at step 2</text></g>
<text class="sC" x="79" y="121" text-anchor="middle">payments API</text>
<text class="sC" x="643" y="121" text-anchor="middle">ops dashboard</text>
<text class="sC" x="643" y="197" text-anchor="middle">forecast model</text>
<g data-s="1-1"><text class="sC" x="219" y="121" text-anchor="middle">bronze</text><text class="sC" x="349" y="121" text-anchor="middle">silver</text><text class="sC" x="489" y="121" text-anchor="middle">gold: revenue</text></g>
<g data-s="2-4"><text class="sC" x="219" y="121" text-anchor="middle">bronze ✓</text><text class="sC" x="349" y="121" text-anchor="middle">silver ✓</text><text class="sC" x="489" y="121" text-anchor="middle">gold ✓</text></g>
<g data-s="1-2"><text class="sC" x="643" y="45" text-anchor="middle">CFO dashboard</text></g>
<g data-s="3-4"><text class="sC" x="643" y="45" text-anchor="middle">CFO: revenue ×100</text></g>
</svg><ol class="dia-steps">
<li>The payments team switches the <code>amount</code> field from pounds to piastres. To them it's a small internal change.</li>
<li>Bronze, silver and gold all run successfully. Nothing crashes, because the data is still valid numbers of the right type.</li>
<li>Revenue is now 100× too high on the CFO's dashboard, the ops view and the forecast model's training data, until someone happens to notice.</li>
<li>A simple distribution check (amounts suddenly 100× their usual median) at ingestion would have failed the run before anything was published.</li>
</ol><figcaption>Code bugs crash; data bugs produce believable wrong answers. That asymmetry is why data quality is its own discipline.</figcaption></figure>

## DE9.1 Dimensions of data quality 🟢 ⭐

| Dimension | Question | Example check |
|---|---|---|
| **Completeness** | Is all the expected data there? | Null rate of `customer_id` = 0; yesterday's partition has rows from all 27 governorates |
| **Uniqueness** | Are there duplicates? | `order_id` unique |
| **Validity** | Do values conform to rules and formats? | `status` in the allowed set; Egyptian mobile numbers match `^01[0125]\d{8}$`; amounts ≥ 0 |
| **Consistency** | Do related data agree? | Every fact's `product_sk` exists in `dim_product`; order totals equal the sum of their lines |
| **Accuracy** | Does the data reflect reality? | Warehouse revenue reconciles with the finance system's total |
| **Timeliness / freshness** | Is it up to date? | The latest `_ingested_at` is under 2 hours old; the gold mart is complete for yesterday by 07:00 |

> [!say]
> "I think of data quality as completeness, uniqueness, validity, consistency, accuracy and freshness, and I turn each into an automated check: unique and not-null keys, accepted values, referential integrity between facts and dimensions, reconciliation of totals against the source, and freshness and volume checks against expectations."

## DE9.2 Where to check 🟢 🟡 ⭐

<figure class="dia"><svg viewBox="0 0 720 150" role="img" aria-label="Checks along a pipeline: contract at ingestion, tests after transformation, audit before publish, monitoring in production">
<g class="sT" text-anchor="middle">
<rect class="sB" x="10" y="45" width="110" height="56" rx="8"/><text x="65" y="78">Source</text>
<rect class="sW" x="150" y="45" width="130" height="56" rx="8"/><text x="215" y="70">Ingest</text><text class="sS" x="215" y="88">contract / schema</text>
<rect class="sA" x="310" y="45" width="130" height="56" rx="8"/><text x="375" y="70">Transform</text><text class="sS" x="375" y="88">tests per model</text>
<rect class="sR" x="470" y="45" width="110" height="56" rx="8"/><text x="525" y="70">Audit</text><text class="sS" x="525" y="88">before publish</text>
<rect class="sG" x="610" y="45" width="100" height="56" rx="8"/><text x="660" y="70">Publish</text><text class="sS" x="660" y="88">+ monitoring</text>
</g>
<line class="sL" x1="120" y1="73" x2="150" y2="73"/><line class="sL" x1="280" y1="73" x2="310" y2="73"/><line class="sL" x1="440" y1="73" x2="470" y2="73"/><line class="sL" x1="580" y1="73" x2="610" y2="73"/>
<text class="sS" x="10" y="135">Catch problems as early as possible; never let consumers be the first to notice.</text>
</svg><figcaption>Checks at every stage: validate inputs against a contract, test each transformation, audit before publishing, and monitor what's published.</figcaption></figure>

1. **At ingestion:** schema and contract checks; reject or quarantine malformed records ([[DE4.7]]).
2. **After each transformation:** model-level tests (dbt tests, [[DE7.4]]).
3. **Before publishing:** the **write-audit-publish (WAP)** pattern: write to a staging table or branch, run audits (reconciliations, volume vs history, business rules), and publish (swap or merge) only if they pass ([[DE3.10]]).
4. **After publishing:** continuous monitoring for freshness, volume, schema and distribution changes ([[DE9.4]]).

## DE9.3 Tools 🟡

| Tool | Style |
|---|---|
| **dbt tests** (generic, singular, unit) and packages (dbt-utils, dbt-expectations, Elementary) | Declarative tests next to models |
| **Great Expectations (GX)** | Python "expectations" suites with data docs |
| **Soda** | Checks written in a YAML language (SodaCL) |
| **pandera / Pydantic** | Python schema validation in code ([[DE4.7]]) |
| **Table constraints** | Delta `CHECK` constraints and `NOT NULL`; Lakeflow pipeline **expectations** (warn, drop or fail on violation) |
| **Data observability platforms** | Monte Carlo, Elementary, Soda Cloud, Bigeye, and cloud-native options (Purview data quality, Dataplex, Glue Data Quality): learned baselines and anomaly alerts |

## DE9.4 Data observability 🟡 ⭐

Tests catch what you anticipated; **observability** catches what you didn't, by watching signals over time. The commonly cited **five pillars**:

| Pillar | Watches for |
|---|---|
| **Freshness** | Data arriving late, or not at all |
| **Volume** | Row counts far above or below the usual pattern (a source sent half the file) |
| **Schema** | Columns added, removed, renamed or retyped upstream |
| **Distribution** | Null rates, value ranges and category mixes drifting (a currency field suddenly in piastres) |
| **Lineage** | What's upstream and downstream, to find the cause and the blast radius |

<figure class="dia"><svg viewBox="0 0 720 228" role="img" aria-label="Daily row counts over thirty days with a learned expected band that includes a weekly pattern; one day drops to half and is flagged">
<polygon class="sG" opacity=".25" points="50,62 71,62 92,62 113,62 134,34 155,34 176,62 197,62 218,62 239,62 260,62 281,34 302,34 323,62 344,62 365,62 386,62 407,62 428,34 449,34 470,62 491,62 512,62 533,62 554,62 575,34 596,34 617,62 638,62 659,62 659,98 638,98 617,98 596,78 575,78 554,98 533,98 512,98 491,98 470,98 449,78 428,78 407,98 386,98 365,98 344,98 323,98 302,78 281,78 260,98 239,98 218,98 197,98 176,98 155,78 134,78 113,98 92,98 71,98 50,98"/>
<polyline class="sL" points="50,76 71,75 92,80 113,83 134,63 155,54 176,80 197,76 218,82 239,76 260,83 281,52 302,53 323,81 344,79 365,77 386,84 407,79 428,52 449,59 470,76 491,77 512,75 533,82 554,86 575,52 596,138 617,81 638,86 659,84" fill="none" stroke-width="2"/>
<circle class="sPr" cx="596" cy="138" r="7"/><text class="sRt" x="586" y="143.6" text-anchor="end">half the file arrived: alert</text>
<line class="sLm" x1="50" y1="200" x2="667" y2="200" marker-end="url(#ahm)"/><text class="sC" x="365" y="218" text-anchor="middle">daily row count (thousands), last 30 days</text>
<text class="sGt" x="50" y="30">band: expected range from history, weekends included</text>
</svg><figcaption>Observability learns what normal looks like, including weekly rhythm, and flags what no hand-written test anticipated.</figcaption></figure>

> [!say]
> "Tests cover the rules I know; observability covers the surprises. I monitor freshness, volume against the normal pattern, schema changes, and distribution shifts like null rates, and use lineage to find the cause upstream and tell the right downstream owners. A silent upstream change usually shows up first as a volume or distribution anomaly."

## DE9.5 When a check fails 🟢 🟡 ⭐

| Response | When |
|---|---|
| **Fail (stop the pipeline, don't publish)** | Critical rules: duplicate primary keys, broken referential integrity, reconciliation off, empty partitions, schema breaks |
| **Quarantine and continue** | A small share of bad records that can be isolated (malformed rows go to an error table with the reason, the rest proceeds) |
| **Warn** | Soft anomalies worth a look (volume 15% lower than usual on a holiday) |

**Then:** alert the **owner** (every dataset needs one), with context (the check, the sample of failing rows, the run, the lineage); follow a runbook; **communicate** to consumers if published data was wrong ("Yesterday's revenue dashboard is being corrected; expected by 11:00"); fix the root cause; backfill ([[DE7.3]]); add a test so it can't recur. Track **data incidents** like service incidents, with blameless post-mortems.

> [!story]
> FinSight's **CSV import** is a natural place for quarantine-and-continue: valid rows import, invalid rows go to an error report with the row number and reason, and the user decides ([[FS3.1]]). Describing that design in data-engineering terms (contract at ingestion, quarantine, report) makes your backend work relevant to a DE interview.

## DE9.6 Data contracts 🟡 ⭐

> [!term] Data contract
> An explicit, versioned agreement between a data **producer** (often an application team) and its **consumers**: the **schema** (fields, types, nullability), **semantics** (what each field means, units, time zones), **quality** rules, **SLAs** (freshness, availability), **ownership** and a **change process** (how breaking changes are announced and versioned).

Contracts move quality **upstream**: instead of the data team discovering a renamed column when dashboards break, the producer's CI fails when they change the contract without a new version. Mechanisms: a schema registry with compatibility rules for events ([[DE8.5]]); dbt **model contracts** for published models ([[DE7.4]]); contract files (the open **Open Data Contract Standard**, ODCS) checked in CI; and CDC tables treated as an API with versioning.

<figure class="dia"><svg viewBox="0 0 720 232" role="img" aria-label="A data contract between an orders service team and its consumers specifies schema, semantics, quality rules, SLA and owner; a breaking rename fails the producer's CI">
<rect class="sB" x="14" y="70" width="150" height="56" rx="8"/><text class="sT" x="89" y="96" text-anchor="middle">producer team</text><text class="sC" x="89" y="112" text-anchor="middle">orders service</text>
<rect class="sV" x="220" y="30" width="330" height="140" rx="10"/><text class="sT" x="385" y="52" text-anchor="middle">orders contract v2</text>
<text class="sC" x="236" y="80">schema: order_id, amount decimal(12,2)</text>
<text class="sC" x="236" y="102">semantics: amount in EGP, incl. VAT</text>
<text class="sC" x="236" y="124">quality: order_id unique, amount ≥ 0</text>
<text class="sC" x="236" y="146">SLA 02:00 · owner @orders-team</text>
<line class="sL" x1="164" y1="98" x2="216" y2="98" marker-end="url(#ah)"/>
<line class="sLm" x1="550" y1="100" x2="596" y2="50" marker-end="url(#ahm)"/><rect class="sG" x="600" y="30" width="106" height="40" rx="8"/><text class="sT" x="653" y="55" text-anchor="middle">finance mart</text>
<line class="sLm" x1="550" y1="100" x2="596" y2="102" marker-end="url(#ahm)"/><rect class="sG" x="600" y="82" width="106" height="40" rx="8"/><text class="sT" x="653" y="107" text-anchor="middle">fraud model</text>
<line class="sLm" x1="550" y1="100" x2="596" y2="154" marker-end="url(#ahm)"/><rect class="sG" x="600" y="134" width="106" height="40" rx="8"/><text class="sT" x="653" y="159" text-anchor="middle">BI dashboards</text>
<rect class="sR" x="14" y="188" width="536" height="34" rx="8" opacity=".85"/><text class="sC" x="282" y="210" text-anchor="middle">a breaking rename fails the producer's CI, not your dashboards</text>
</svg><figcaption>Contracts move breakage to where it can be fixed cheaply: the producer's pull request.</figcaption></figure>

## DE9.7 Lineage, catalogs and documentation 🟡 ⭐

> [!term] Data lineage
> The map of where data comes from and where it goes: which sources, jobs and transformations produced a table or a column, and what depends on it downstream. It answers "why is this number wrong?" (trace upstream) and "who breaks if I change this?" (trace downstream). **Column-level** lineage is the most useful kind.

- **OpenLineage** is an open standard for emitting lineage events from jobs (Airflow, Spark, dbt integrations), collected by tools such as Marquez.
- **Catalogs** tie it together: table and column descriptions, owners, tags (PII, certified), lineage, usage and search. Examples: **Microsoft Purview**, **Unity Catalog**, DataHub, OpenMetadata, AWS Glue Data Catalog, Google Dataplex ([[DE5.4]]).
- **Documentation that lives with code:** dbt descriptions and docs, a README per pipeline, a glossary of business terms aligned with the metric definitions analysts use ([[DA1.4]]).

<figure class="dia"><svg viewBox="0 0 720 234" role="img" aria-label="Column-level lineage from a source payments amount through a staging column to fact table columns and on to a revenue KPI, a refund rate and forecast features">
<rect class="sB" x="14" y="90" width="162" height="36" rx="6"/><text class="sC" x="95" y="113" text-anchor="middle">payments.amount</text>
<rect class="sV" x="192" y="90" width="162" height="36" rx="6"/><text class="sC" x="273" y="113" text-anchor="middle">stg_payments.amount_egp</text>
<rect class="sA" x="370" y="60" width="162" height="36" rx="6"/><text class="sC" x="451" y="83" text-anchor="middle">fct_orders.net_revenue</text>
<rect class="sA" x="370" y="120" width="162" height="36" rx="6"/><text class="sC" x="451" y="143" text-anchor="middle">fct_refunds.amount</text>
<rect class="sG" x="548" y="30" width="162" height="36" rx="6"/><text class="sC" x="629" y="53" text-anchor="middle">Revenue KPI</text>
<rect class="sG" x="548" y="90" width="162" height="36" rx="6"/><text class="sC" x="629" y="113" text-anchor="middle">Refund rate</text>
<rect class="sG" x="548" y="150" width="162" height="36" rx="6"/><text class="sC" x="629" y="173" text-anchor="middle">Forecast features</text>
<line class="sLm" x1="176" y1="108" x2="190" y2="108" marker-end="url(#ahm)"/>
<line class="sLm" x1="354" y1="108" x2="368" y2="78" marker-end="url(#ahm)"/>
<line class="sLm" x1="354" y1="108" x2="368" y2="138" marker-end="url(#ahm)"/>
<line class="sLm" x1="532" y1="78" x2="546" y2="48" marker-end="url(#ahm)"/>
<line class="sLm" x1="532" y1="138" x2="546" y2="108" marker-end="url(#ahm)"/>
<line class="sLm" x1="532" y1="78" x2="546" y2="168" marker-end="url(#ahm)"/>
<text class="sWt" x="14" y="222">← upstream: "why is this number wrong?"</text><text class="sGt" x="706" y="222" text-anchor="end">downstream: "what breaks if I change this?" →</text>
</svg><figcaption>Lineage answers two questions: trace a bad number upstream to its cause, and trace a planned change downstream to everything it touches.</figcaption></figure>

## DE9.8 Governance, security and privacy 🟡 ⭐

**Access control:**

- **Least privilege** with **role-based access** (groups, not individuals) at catalog, schema and table level.
- **Row-level security** (a regional manager sees only their region) and **column-level security / dynamic masking** (show `0100*****67` instead of the full phone number, hide salary columns), in the warehouse (Snowflake masking policies, Unity Catalog row filters and column masks, Fabric and SQL Server dynamic data masking and RLS) and in BI ([[DA4.9]]).
- Service identities (managed identities) for pipelines, not shared passwords ([[S10.6]]).

<figure class="dia"><svg viewBox="0 0 720 212" role="img" aria-label="The same customer table seen by an admin with all rows and full phone numbers, and by a Cairo analyst who sees only Cairo rows with phone numbers masked">
<text class="sM" x="180" y="20" text-anchor="middle">admin role</text>
<rect class="sN" x="14" y="30" width="92" height="24" rx="0"/><text class="sT" x="60" y="47" text-anchor="middle">customer</text>
<rect class="sN" x="106" y="30" width="112" height="24" rx="0"/><text class="sT" x="162" y="47" text-anchor="middle">phone</text>
<rect class="sN" x="218" y="30" width="66" height="24" rx="0"/><text class="sT" x="251" y="47" text-anchor="middle">city</text>
<rect class="sN" x="284" y="30" width="62" height="24" rx="0"/><text class="sT" x="315" y="47" text-anchor="middle">spend</text>
<rect class="sB" x="14" y="54" width="92" height="24" rx="0" opacity=".55"/><text class="sC" x="60" y="71" text-anchor="middle">Mona A.</text>
<rect class="sB" x="106" y="54" width="112" height="24" rx="0" opacity=".55"/><text class="sC" x="162" y="71" text-anchor="middle">01001234567</text>
<rect class="sB" x="218" y="54" width="66" height="24" rx="0" opacity=".55"/><text class="sC" x="251" y="71" text-anchor="middle">Cairo</text>
<rect class="sB" x="284" y="54" width="62" height="24" rx="0" opacity=".55"/><text class="sC" x="315" y="71" text-anchor="middle">8,200</text>
<rect class="sB" x="14" y="78" width="92" height="24" rx="0" opacity=".55"/><text class="sC" x="60" y="95" text-anchor="middle">Ali H.</text>
<rect class="sB" x="106" y="78" width="112" height="24" rx="0" opacity=".55"/><text class="sC" x="162" y="95" text-anchor="middle">01117654321</text>
<rect class="sB" x="218" y="78" width="66" height="24" rx="0" opacity=".55"/><text class="sC" x="251" y="95" text-anchor="middle">Giza</text>
<rect class="sB" x="284" y="78" width="62" height="24" rx="0" opacity=".55"/><text class="sC" x="315" y="95" text-anchor="middle">3,100</text>
<rect class="sB" x="14" y="102" width="92" height="24" rx="0" opacity=".55"/><text class="sC" x="60" y="119" text-anchor="middle">Sara M.</text>
<rect class="sB" x="106" y="102" width="112" height="24" rx="0" opacity=".55"/><text class="sC" x="162" y="119" text-anchor="middle">01223456789</text>
<rect class="sB" x="218" y="102" width="66" height="24" rx="0" opacity=".55"/><text class="sC" x="251" y="119" text-anchor="middle">Cairo</text>
<rect class="sB" x="284" y="102" width="62" height="24" rx="0" opacity=".55"/><text class="sC" x="315" y="119" text-anchor="middle">5,600</text>
<text class="sM" x="540" y="20" text-anchor="middle">Cairo analyst role</text>
<rect class="sN" x="374" y="30" width="92" height="24" rx="0"/><text class="sT" x="420" y="47" text-anchor="middle">customer</text>
<rect class="sN" x="466" y="30" width="112" height="24" rx="0"/><text class="sT" x="522" y="47" text-anchor="middle">phone</text>
<rect class="sN" x="578" y="30" width="66" height="24" rx="0"/><text class="sT" x="611" y="47" text-anchor="middle">city</text>
<rect class="sN" x="644" y="30" width="62" height="24" rx="0"/><text class="sT" x="675" y="47" text-anchor="middle">spend</text>
<rect class="sB" x="374" y="54" width="92" height="24" rx="0" opacity=".55"/><text class="sC" x="420" y="71" text-anchor="middle">Mona A.</text>
<rect class="sW" x="466" y="54" width="112" height="24" rx="0" opacity=".55"/><text class="sC" x="522" y="71" text-anchor="middle">0100*****67</text>
<rect class="sB" x="578" y="54" width="66" height="24" rx="0" opacity=".55"/><text class="sC" x="611" y="71" text-anchor="middle">Cairo</text>
<rect class="sB" x="644" y="54" width="62" height="24" rx="0" opacity=".55"/><text class="sC" x="675" y="71" text-anchor="middle">8,200</text>
<rect class="sB" x="374" y="78" width="92" height="24" rx="0" opacity=".55"/><text class="sC" x="420" y="95" text-anchor="middle">Sara M.</text>
<rect class="sW" x="466" y="78" width="112" height="24" rx="0" opacity=".55"/><text class="sC" x="522" y="95" text-anchor="middle">0122*****89</text>
<rect class="sB" x="578" y="78" width="66" height="24" rx="0" opacity=".55"/><text class="sC" x="611" y="95" text-anchor="middle">Cairo</text>
<rect class="sB" x="644" y="78" width="62" height="24" rx="0" opacity=".55"/><text class="sC" x="675" y="95" text-anchor="middle">5,600</text>
<text class="sC" x="540" y="150" text-anchor="middle">Giza row filtered out (row-level security)</text><text class="sWt" x="540" y="168" text-anchor="middle">phone masked (column-level security)</text>
<text class="sS" x="360" y="200" text-anchor="middle">one table, one copy of the data; the role decides what each person sees</text>
</svg><figcaption>Row-level security filters rows; dynamic masking hides values. Both are enforced by the platform, not by remembering to.</figcaption></figure>

**Personal data (PII):**

- **Classify** columns (national ID, phone, email, address, card data, health data) with tags in the catalog; scanners in Purview and similar tools help.
- **Minimise:** don't copy PII into analytics layers that don't need it; **pseudonymise** (replace identifiers with keyed hashes or tokens) where joins are needed without identity.
- **Encrypt** in transit and at rest (default on major clouds), with stricter key management for sensitive data.
- **Retention:** keep data only as long as there's a purpose and a legal basis; enforce with partition expiry.
- **Deletion requests** (the right to erasure): find the person's data via lineage and the catalog, delete it in every layer, **including** physically removing old file versions in lakehouse tables (vacuum or snapshot expiry, [[DE5.6]]) and backups per policy, and log the action.
- **Audit** who accessed sensitive data.

**Law and regulation:** Egypt's **Personal Data Protection Law (No. 151 of 2020)** governs the collection, processing, storage and transfer of personal data, including cross-border transfers; banks also follow **Central Bank of Egypt** regulations; companies serving EU residents fall under the **GDPR**. **Data residency** requirements may dictate which cloud region data can live in. Data engineers aren't lawyers, but they implement the controls, so know the principles: purpose limitation, minimisation, security, retention and data-subject rights.

> [!say]
> "I tag PII in the catalog, keep it out of layers that don't need it, pseudonymise identifiers where analysts only need to join, and apply column masking and row-level security so people see only what their role allows. For a deletion request I'd use lineage to find every copy, delete it, physically remove old file versions in the lakehouse after the retention window, and log the action, in line with Egypt's data-protection law or GDPR for EU customers."

## DE9.9 Ownership at scale: data products and data mesh 🟡

> [!term] Data mesh
> An organisational approach (Zhamak Dehghani, 2019) in which **domain teams** own and publish their data as **products** (discoverable, documented, quality-guaranteed, with contracts and SLAs) on a self-serve platform, under federated governance. It answers the bottleneck of one central data team owning everything. In practice, many companies adopt the **data product** ideas (clear owners, contracts, SLAs) without the full reorganisation.

## DE9.10 Data SLAs and SLOs 🟢

Apply reliability practice ([[B11.7]]) to data: **SLIs** such as "share of days the sales mart was complete by 07:00 Cairo time" and "share of checks passing"; **SLOs** ("99% of days"); alerts when they're at risk; and a status page or channel where consumers can see data health.

> [!lab] Add a quality layer to your pipeline
> In the dbt project from [[DE7]]'s lab: add generic tests on every primary key and foreign key, accepted values, a reconciliation singular test against the source totals, and source **freshness** checks; add an Elementary (or Soda) report for volume and schema-change anomalies; quarantine malformed CSV rows to an error table in the Python ingestion; tag PII columns and create a masked view for analysts; and write a one-page runbook for "the daily load failed a check". That's a complete answer to "how do you ensure data quality?" with evidence.

## DE9.11 Interview drill 🟢 ⭐

| Question | Strong short answer |
|---|---|
| What are the dimensions of data quality? | Completeness, uniqueness, validity, consistency, accuracy and freshness. |
| What would you test on a fact table? | Unique, not-null keys; foreign keys present in dimensions; accepted values; non-negative amounts; reconciliation to source; freshness and volume. |
| Where do checks go? | At ingestion (contracts), after each transformation (tests), before publishing (write-audit-publish), and after (monitoring). |
| What happens when a check fails? | Fail critical checks before publishing, quarantine isolatable bad rows, warn on soft anomalies; alert the owner, communicate, fix, backfill, add a test. |
| What is data observability? | Monitoring freshness, volume, schema, distribution and lineage to catch problems no test anticipated. |
| How do you detect a silent upstream change? | Schema-change detection, volume and distribution anomalies, and contracts that fail the producer's CI. |
| What is a data contract? | A versioned agreement on schema, semantics, quality, SLAs, ownership and change process between producers and consumers. |
| What is data lineage for? | Tracing causes upstream and impact downstream, ideally at column level. |
| How do you protect PII in analytics? | Classify and tag it, minimise and pseudonymise, mask columns and apply row-level security by role, encrypt, audit access. |
| How do you handle a deletion request in a lakehouse? | Find all copies via lineage, delete rows, vacuum or expire snapshots beyond retention, handle backups per policy, log it. |
| What is write-audit-publish? | Write to staging, audit with checks, publish only if they pass. |
| What is data mesh? | Domain teams owning data as products on a self-serve platform with federated governance. |
| Which Egyptian law covers personal data? | The Personal Data Protection Law, No. 151 of 2020 (plus CBE rules for banks). |

## Key takeaways

> [!check]
> - Turn quality dimensions into automated checks at ingestion, transformation, publication and in production.
> - Fail before publishing on critical problems; quarantine what you can isolate; always alert an owner.
> - Observability catches what tests don't: freshness, volume, schema, distribution, lineage.
> - Contracts push quality upstream; lineage and catalogs make data findable and debuggable.
> - Least privilege, masking, minimisation and real deletion: governance is part of the engineering.

## Sources

- Barr Moses, Lior Gavish and Molly Vorwerck, *Data Quality Fundamentals* (O'Reilly, 2022): the five pillars of data observability.
- DAMA International, *DAMA-DMBOK: Data Management Body of Knowledge*, 2nd ed. (2017): data-quality dimensions and governance.
- dbt: [Data tests](https://docs.getdbt.com/docs/build/data-tests), [Source freshness](https://docs.getdbt.com/docs/build/sources#source-data-freshness), [Model contracts](https://docs.getdbt.com/docs/mesh/govern/model-contracts); [Great Expectations](https://docs.greatexpectations.io/); [Soda](https://docs.soda.io/); [Elementary](https://docs.elementary-data.com/).
- [OpenLineage](https://openlineage.io/); [Open Data Contract Standard (Bitol, Linux Foundation)](https://bitol-io.github.io/open-data-contract-standard/).
- Microsoft Learn: [Microsoft Purview overview](https://learn.microsoft.com/en-us/purview/purview), [Dynamic data masking](https://learn.microsoft.com/en-us/sql/relational-databases/security/dynamic-data-masking), [Row-level security](https://learn.microsoft.com/en-us/sql/relational-databases/security/row-level-security); Databricks: [Unity Catalog row filters and column masks](https://docs.databricks.com/aws/en/tables/row-and-column-filters); Delta Lake: [Constraints](https://docs.delta.io/latest/delta-constraints.html).
- Zhamak Dehghani, *Data Mesh* (O'Reilly, 2022).
- Egypt's Personal Data Protection Law No. 151 of 2020; [GDPR (EUR-Lex)](https://eur-lex.europa.eu/eli/reg/2016/679/oj).
