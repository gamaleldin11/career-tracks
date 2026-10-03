# Data Quality, Observability and Governance — Tests, Contracts, Lineage, Access and Privacy

A pipeline that runs on time but publishes wrong numbers is worse than one that fails loudly: decisions get made on bad data, and trust takes months to rebuild. Mid-level DE interviews ask how you'd **know** data is right, what happens when it isn't, who owns it, who may see it, and how you'd delete a customer's personal data on request. This module covers data-quality dimensions and tests, observability, failure handling, data contracts, lineage and catalogs, and governance and privacy, including Egypt's data-protection law.

> [!focus]
> **Entry must:** name the main data-quality dimensions; add tests for uniqueness, nulls, accepted values and relationships; check freshness and volume; explain why a pipeline should fail rather than publish bad data.
> **Mid adds:** where to place checks in a pipeline (contracts, write-audit-publish), fail vs warn vs quarantine, the five pillars of data observability, data contracts with producers, column-level lineage and catalogs, access control with row- and column-level security and masking, PII handling, retention and deletion.
> **Most asked:** *How do you ensure data quality?* · *What do you test?* · *What happens when a check fails?* · *How do you detect a silent upstream change?* · *What is a data contract?* · *What is data lineage?* · *How do you protect PII?* · *How do you handle a deletion request?*
> **Time budget:** 3 hours.

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

## DE9.7 Lineage, catalogs and documentation 🟡 ⭐

> [!term] Data lineage
> The map of where data comes from and where it goes: which sources, jobs and transformations produced a table or a column, and what depends on it downstream. It answers "why is this number wrong?" (trace upstream) and "who breaks if I change this?" (trace downstream). **Column-level** lineage is the most useful kind.

- **OpenLineage** is an open standard for emitting lineage events from jobs (Airflow, Spark, dbt integrations), collected by tools such as Marquez.
- **Catalogs** tie it together: table and column descriptions, owners, tags (PII, certified), lineage, usage and search. Examples: **Microsoft Purview**, **Unity Catalog**, DataHub, OpenMetadata, AWS Glue Data Catalog, Google Dataplex ([[DE5.4]]).
- **Documentation that lives with code:** dbt descriptions and docs, a README per pipeline, a glossary of business terms aligned with the metric definitions analysts use ([[DA1.4]]).

## DE9.8 Governance, security and privacy 🟡 ⭐

**Access control:**

- **Least privilege** with **role-based access** (groups, not individuals) at catalog, schema and table level.
- **Row-level security** (a regional manager sees only their region) and **column-level security / dynamic masking** (show `0100*****67` instead of the full phone number, hide salary columns), in the warehouse (Snowflake masking policies, Unity Catalog row filters and column masks, Fabric and SQL Server dynamic data masking and RLS) and in BI ([[DA4.9]]).
- Service identities (managed identities) for pipelines, not shared passwords ([[S10.6]]).

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
