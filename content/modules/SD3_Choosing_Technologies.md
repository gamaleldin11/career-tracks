# Choosing Technologies and Patterns — How to Pick, and How to Defend It

Interviewers rarely care whether you pick PostgreSQL or MongoDB, Kafka or RabbitMQ. They care **why**: which requirement drove the choice, what you gave up, and what would make you change your mind. This module gives you a method for every decision and the trade-offs behind the choices that come up most: consistency, databases, caches and queues, communication styles, where code runs, architecture style, and build vs buy. The building blocks are in [[SD1]]; when to add each one is in [[SD2]].

> [!focus]
> **Entry must:** justify a database choice from the data and its access patterns; explain the CAP theorem correctly; tell a queue from a log; know when REST, WebSockets or a queue fits; say "it depends on…" and then *finish the sentence*.
> **Mid adds:** PACELC and consistency levels; choosing between managed and self-hosted; containers vs serverless vs PaaS by workload; recording decisions as ADRs; recognising reversible and irreversible decisions.
> **Most asked:** *SQL or NoSQL for this?* · *Explain the CAP theorem* · *Kafka or RabbitMQ?* · *REST, GraphQL or gRPC?* · *Kubernetes or serverless?* · *Why did you choose X in your project?*
> **Time budget:** 3 hours.

## SD3.1 A method for any technical decision 🟢 ⭐

1. **Requirements.** What must it do, and at what scale, latency, consistency and availability? What does a failure cost?
2. **Constraints.** Team skills, budget, deadline, compliance (data residency, audit), what the company already runs and supports.
3. **Options.** Two or three realistic candidates, including "the boring one we already have".
4. **Trade-offs.** Compare on the requirements that matter, not on a feature list. Name what each option makes *hard*.
5. **Decide, and write it down** in a short **architecture decision record** (ADR): context, decision, consequences, and the signal that would make you revisit it.

> [!term] Architecture decision record (ADR)
> A one-page note, kept with the code, that records one significant decision: the context, the options considered, the decision and its consequences. Popularised by Michael Nygard in 2011. Six months later it answers "why on earth did we pick this?" without archaeology.

> [!term] One-way and two-way doors
> Amazon's framing (from Jeff Bezos's shareholder letters) for decisions that are hard to reverse (choosing a primary database, a public API contract, a data model that customers depend on) versus easy to reverse (a library, a cache, an internal service boundary). Spend time on one-way doors; decide two-way doors quickly and change them if wrong.

<figure class="dia"><svg viewBox="0 0 720 262" role="img" aria-label="Decisions placed by how costly they are to reverse: two-way doors such as a library, a cache, an internal service boundary or a CI tool can be decided fast; one-way doors such as the primary database, a public API contract, a data model customers depend on or a cloud provider deserve time and an architecture decision record; an example ADR lists context, options, decision, consequences and the signal to revisit">
<rect class="sG" x="30" y="20" width="200" height="200" rx="8" opacity=".15"/><rect class="sR" x="230" y="20" width="200" height="200" rx="8" opacity=".15"/>
<text class="sGt" x="130" y="42" text-anchor="middle">two-way doors</text><text class="sS" x="130" y="58" text-anchor="middle">decide fast, change if wrong</text>
<text class="sRt" x="330" y="42" text-anchor="middle">one-way doors</text><text class="sS" x="330" y="58" text-anchor="middle">slow down, write an ADR</text>
<text class="sT" x="130" y="92" text-anchor="middle">a library</text>
<text class="sT" x="130" y="114" text-anchor="middle">a cache</text>
<text class="sT" x="130" y="136" text-anchor="middle">an internal service</text>
<text class="sT" x="130" y="158" text-anchor="middle">boundary</text>
<text class="sT" x="130" y="180" text-anchor="middle">a CI tool</text>
<text class="sT" x="330" y="92" text-anchor="middle">the primary database</text>
<text class="sT" x="330" y="114" text-anchor="middle">a public API contract</text>
<text class="sT" x="330" y="136" text-anchor="middle">a data model customers</text>
<text class="sT" x="330" y="158" text-anchor="middle">depend on</text>
<text class="sT" x="330" y="180" text-anchor="middle">a cloud provider</text>
<line class="sLm" x1="30" y1="232" x2="430" y2="232" marker-end="url(#ahm)"/><text class="sS" x="230" y="250" text-anchor="middle">cost of reversing the decision →</text>
<rect class="sN" x="460" y="20" width="246" height="212" rx="8"/>
<text class="sT" x="472" y="42" xml:space="preserve" style="white-space:pre">ADR 007: PostgreSQL as primary store</text>
<text class="sS" x="472" y="63" xml:space="preserve" style="white-space:pre">Context: multi-tenant invoices, team</text>
<text class="sS" x="472" y="84" xml:space="preserve" style="white-space:pre">  knows SQL, Azure is the platform</text>
<text class="sS" x="472" y="105" xml:space="preserve" style="white-space:pre">Options: PostgreSQL, SQL Server,</text>
<text class="sS" x="472" y="126" xml:space="preserve" style="white-space:pre">  Cosmos DB</text>
<text class="sS" x="472" y="147" xml:space="preserve" style="white-space:pre">Decision: PostgreSQL (managed)</text>
<text class="sS" x="472" y="168" xml:space="preserve" style="white-space:pre">Consequences: JSON columns OK;</text>
<text class="sS" x="472" y="189" xml:space="preserve" style="white-space:pre">  no global multi-region writes</text>
<text class="sS" x="472" y="210" xml:space="preserve" style="white-space:pre">Revisit if: write volume &gt; 5k/s</text>
</svg><figcaption>Where to spend decision time, and what a one-page ADR for a one-way door looks like (example).</figcaption></figure>

> [!term] Choose boring technology
> Dan McKinley's 2015 essay: every team has a few "innovation tokens" to spend on new, unproven technology; spend them where they give a real advantage, and use well-understood tools everywhere else, because their failure modes are already known.

> [!say]
> "My default is the simplest well-understood option that meets the requirements, usually something the team already operates. I move off it only for a requirement it can't meet, and I write down that reason, so we know what would make us revisit it."

## SD3.2 Consistency, CAP and PACELC — stated correctly 🟢 🟡 ⭐

**Consistency** has several meanings. In system design it usually means: *after a write, which value can a later read return?*

| Model | A read after a write returns… | Example |
|---|---|---|
| **Strong (linearisable)** | The latest write, everywhere, as if there were one copy | A bank balance; a seat booking |
| **Read-your-writes** | Your own latest write; others may lag | Seeing your own new post immediately |
| **Causal** | Effects after their causes (a reply after its question) | Comment threads |
| **Eventual** | Possibly an old value; replicas converge if writes stop | Like counts, follower counts, view counters |

**The CAP theorem** (Eric Brewer's conjecture in 2000, proved by Seth Gilbert and Nancy Lynch in 2002) says: when a **network partition** splits a distributed data store, each side must either **refuse some requests to stay consistent (CP)** or **keep answering and risk returning stale or conflicting data (AP)**.

Three corrections to the common version ("pick two of Consistency, Availability, Partition tolerance"):

1. **Partitions aren't optional** in a system spread over a network, so "CA" isn't a real choice for a distributed system. The choice is C *or* A, **during a partition**.
2. **When there is no partition, CAP says nothing.** That is most of the time.
3. **It isn't one switch for the whole system.** Many databases let you choose per operation (DynamoDB offers eventually consistent and strongly consistent reads; Cassandra has per-query consistency levels), and a good design picks per data type.

**PACELC** (Daniel Abadi, 2012) fills the gap: if there is a **P**artition, choose **A** or **C**; **E**lse, choose between **L**atency and **C**onsistency. Even on a healthy network, waiting for replicas to confirm a write makes it slower. That everyday latency-versus-consistency trade-off is the one you actually feel.

<figure class="dia steps" data-start="1"><svg viewBox="0 0 720 225" role="img" aria-label="CAP in five steps: replication, a partition, the consistent choice that refuses requests, the available choice that diverges, and reconciliation">
<text class="sT" x="150" y="22" text-anchor="middle">Data centre 1</text><text class="sT" x="570" y="22" text-anchor="middle">Data centre 2</text>
<rect class="sB" x="90" y="36" width="120" height="34" rx="8"/><text class="sT" x="150" y="58" text-anchor="middle">client 1</text><rect class="sB" x="510" y="36" width="120" height="34" rx="8"/><text class="sT" x="570" y="58" text-anchor="middle">client 2</text>
<line class="sLm" x1="150" y1="70" x2="150" y2="98" marker-end="url(#ahm)"/><line class="sLm" x1="570" y1="70" x2="570" y2="98" marker-end="url(#ahm)"/>
<g data-s="1-1"><rect class="sA" x="70" y="100" width="160" height="56" rx="10"/><text class="sT" x="150" y="122" text-anchor="middle">replica</text><text class="sM" x="150" y="142" text-anchor="middle">x = 1</text><rect class="sA" x="490" y="100" width="160" height="56" rx="10"/><text class="sT" x="570" y="122" text-anchor="middle">replica</text><text class="sM" x="570" y="142" text-anchor="middle">x = 1</text><line class="sLg" x1="230" y1="128" x2="486" y2="128" marker-end="url(#ahg)"/><text class="sGt" x="360" y="120" text-anchor="middle">replicate x = 1</text></g>
<g data-s="2-2"><rect class="sA" x="70" y="100" width="160" height="56" rx="10"/><text class="sT" x="150" y="122" text-anchor="middle">replica</text><text class="sM" x="150" y="142" text-anchor="middle">x = 1</text><rect class="sA" x="490" y="100" width="160" height="56" rx="10"/><text class="sT" x="570" y="122" text-anchor="middle">replica</text><text class="sM" x="570" y="142" text-anchor="middle">x = 1</text><line class="sLr" x1="230" y1="128" x2="490" y2="128" stroke-dasharray="6 4"/><text class="sRt" x="360" y="120" text-anchor="middle">✕ link down: partition</text></g>
<g data-s="3-3"><rect class="sG" x="70" y="100" width="160" height="56" rx="10"/><text class="sT" x="150" y="122" text-anchor="middle">replica</text><text class="sM" x="150" y="142" text-anchor="middle">x = 2</text><text class="sC" x="150" y="176" text-anchor="middle">accepts the write</text><rect class="sR" x="490" y="100" width="160" height="56" rx="10"/><text class="sT" x="570" y="122" text-anchor="middle">replica</text><text class="sM" x="570" y="142" text-anchor="middle">x = 1</text><text class="sC" x="570" y="176" text-anchor="middle">refuses: may be stale</text><line class="sLr" x1="230" y1="128" x2="490" y2="128" stroke-dasharray="6 4"/><text class="sRt" x="360" y="120" text-anchor="middle">✕</text><text class="sS" x="360" y="210" text-anchor="middle">CP: correct or nothing. Client 2 gets an error until the link heals.</text></g>
<g data-s="4-4"><rect class="sW" x="70" y="100" width="160" height="56" rx="10"/><text class="sT" x="150" y="122" text-anchor="middle">replica</text><text class="sM" x="150" y="142" text-anchor="middle">x = 2</text><text class="sC" x="150" y="176" text-anchor="middle">accepts</text><rect class="sW" x="490" y="100" width="160" height="56" rx="10"/><text class="sT" x="570" y="122" text-anchor="middle">replica</text><text class="sM" x="570" y="142" text-anchor="middle">x = 3</text><text class="sC" x="570" y="176" text-anchor="middle">accepts too</text><line class="sLr" x1="230" y1="128" x2="490" y2="128" stroke-dasharray="6 4"/><text class="sRt" x="360" y="120" text-anchor="middle">✕</text><text class="sS" x="360" y="210" text-anchor="middle">AP: everyone gets an answer, but the replicas now disagree.</text></g>
<g data-s="5-5"><rect class="sA" x="70" y="100" width="160" height="56" rx="10"/><text class="sT" x="150" y="122" text-anchor="middle">replica</text><text class="sM" x="150" y="142" text-anchor="middle">x = 3</text><text class="sC" x="150" y="176" text-anchor="middle">resolved</text><rect class="sA" x="490" y="100" width="160" height="56" rx="10"/><text class="sT" x="570" y="122" text-anchor="middle">replica</text><text class="sM" x="570" y="142" text-anchor="middle">x = 3</text><text class="sC" x="570" y="176" text-anchor="middle">resolved</text><line class="sLg" x1="230" y1="128" x2="490" y2="128" marker-start="url(#ahg)" marker-end="url(#ahg)"/><text class="sGt" x="360" y="120" text-anchor="middle">link back: reconcile</text><text class="sS" x="360" y="210" text-anchor="middle">Last-writer-wins kept x = 3 and silently lost x = 2; a merge rule or the app must decide.</text></g>
</svg><ol class="dia-steps">
<li>Normally, a write on one replica is copied to the other, and both answer with the same value.</li>
<li>The network between the data centres fails. Both sides are still running and still getting requests.</li>
<li>Consistent choice (CP): the side that can't confirm it has the latest data refuses to answer. Nothing wrong is ever returned, but client 2 sees errors.</li>
<li>Available choice (AP): both sides keep accepting writes. Nobody sees an error, but the two replicas now hold different values.</li>
<li>When the link returns, the replicas must reconcile. A simple rule like last-writer-wins quietly throws one write away, which is fine for a like count and unacceptable for a balance.</li>
</ol><figcaption>CAP only bites during a partition, and the real question is which failure your users can live with: an error, or a stale or conflicting value.</figcaption></figure>

> [!say]
> "CAP is about what happens during a network partition: a distributed store either rejects some requests to stay consistent, or stays available and may return stale data. Outside partitions, PACELC's trade-off applies: stronger consistency costs latency. I choose per data type: strong for payments and inventory, eventual for counters and feeds."

> [!mistake] "We chose MongoDB because CAP"
> Naming a theorem doesn't justify a product. Say what consistency each piece of data needs and what the business loses if it is stale for a second, then show that the store you chose provides it.

## SD3.3 Picking a database 🟢 🟡 ⭐

Answer these in order; they usually settle it.

| Question | If the answer is… | Lean towards |
|---|---|---|
| Do you need multi-row transactions, joins and constraints (money, stock, bookings)? | Yes | **Relational**: PostgreSQL, SQL Server, MySQL |
| What are the access patterns? Are they known and few? | A few lookups by key, at very high volume | **Key-value or wide-column**: DynamoDB, Cassandra, ScyllaDB, Redis |
| | Self-contained items read and written whole, with varying fields | **Document**: MongoDB, Cosmos DB, or PostgreSQL `jsonb` |
| | Many-hop relationship queries (friends of friends, fraud rings) | **Graph**: Neo4j, or recursive SQL at small scale |
| | Ad-hoc questions, unknown in advance | **Relational** (or a warehouse for analytics) |
| How far must *writes* scale? | Beyond one large machine, permanently | Built-in partitioning: Cassandra or ScyllaDB, DynamoDB, a distributed SQL database (Spanner, CockroachDB, YugabyteDB) |
| Is it analytics over large history? | Yes | **Column-store warehouse or lakehouse**: BigQuery, Snowflake, Fabric, Databricks, ClickHouse, DuckDB locally ([[DE5]]) |
| Is it time-stamped measurements? | Metrics, IoT, prices | **Time-series**: TimescaleDB, InfluxDB, Prometheus for metrics |
| Is it full-text or similarity search? | Yes | **Search engine** or **vector index** next to the main store, not instead of it |

<figure class="dia"><svg viewBox="0 0 720 272" role="img" aria-label="Flowchart for picking a database: transactions lead to relational, analytics to a warehouse, known high-volume access patterns to key-value, wide-column, document or graph stores">
<rect class="sW" x="20" y="20" width="210" height="44" rx="22"/><text class="sS" x="125" y="39" text-anchor="middle">Money, stock, bookings:</text><text class="sS" x="125" y="55" text-anchor="middle">transactions &amp; joins?</text>
<line class="sLg" x1="230" y1="42" x2="276" y2="42" marker-end="url(#ahg)"/><text class="sGt" x="253" y="34" text-anchor="middle">yes</text>
<rect class="sG" x="280" y="22" width="160" height="40" rx="8"/><text class="sT" x="360" y="40" text-anchor="middle">Relational</text><text class="sC" x="360" y="56" text-anchor="middle">PostgreSQL · SQL Server</text>
<line class="sLm" x1="125" y1="64" x2="125" y2="92" marker-end="url(#ahm)"/><text class="sC" x="136" y="82">no / partly</text>
<rect class="sW" x="20" y="94" width="210" height="44" rx="22"/><text class="sS" x="125" y="113" text-anchor="middle">Analytics over</text><text class="sS" x="125" y="129" text-anchor="middle">large history?</text>
<line class="sLg" x1="230" y1="116" x2="276" y2="116" marker-end="url(#ahg)"/><text class="sGt" x="253" y="108" text-anchor="middle">yes</text>
<rect class="sV" x="280" y="96" width="160" height="40" rx="8"/><text class="sT" x="360" y="114" text-anchor="middle">Warehouse / lakehouse</text><text class="sC" x="360" y="130" text-anchor="middle">BigQuery, Fabric</text>
<line class="sLm" x1="125" y1="138" x2="125" y2="166" marker-end="url(#ahm)"/>
<rect class="sW" x="20" y="168" width="210" height="44" rx="22"/><text class="sS" x="125" y="187" text-anchor="middle">Few known access patterns</text><text class="sS" x="125" y="203" text-anchor="middle">at very high volume?</text>
<line class="sLg" x1="230" y1="190" x2="276" y2="190" marker-end="url(#ahg)"/><text class="sGt" x="253" y="182" text-anchor="middle">yes</text>
<rect class="sB" x="280" y="166" width="120" height="48" rx="8"/><text class="sS" x="340" y="186" text-anchor="middle">shape of</text><text class="sS" x="340" y="202" text-anchor="middle">each read?</text>
<line class="sLm" x1="400" y1="190" x2="456" y2="148" marker-end="url(#ahm)"/><rect class="sA" x="460" y="134" width="250" height="28" rx="6"/><text class="sC" x="470" y="153">by key: key-value (DynamoDB)</text>
<line class="sLm" x1="400" y1="190" x2="456" y2="182" marker-end="url(#ahm)"/><rect class="sA" x="460" y="168" width="250" height="28" rx="6"/><text class="sC" x="470" y="187">key + time: wide-column (Cassandra)</text>
<line class="sLm" x1="400" y1="190" x2="456" y2="216" marker-end="url(#ahm)"/><rect class="sA" x="460" y="202" width="250" height="28" rx="6"/><text class="sC" x="470" y="221">whole items: document (MongoDB)</text>
<line class="sLm" x1="400" y1="190" x2="456" y2="250" marker-end="url(#ahm)"/><rect class="sA" x="460" y="236" width="250" height="28" rx="6"/><text class="sC" x="470" y="255">many hops: graph (Neo4j)</text>
<line class="sLm" x1="125" y1="212" x2="125" y2="236" marker-end="url(#ahm)"/><text class="sC" x="20" y="256">no: start relational; add stores when measured</text>
<text class="sC" x="460" y="52">search or similarity? add a</text><text class="sC" x="460" y="68">search engine or vector index</text><text class="sGt" x="460" y="84">NEXT TO the main store</text>
</svg><figcaption>A first pass at the database question. The answers are defaults to argue from, not rules.</figcaption></figure>

**Polyglot persistence** (several stores, each for its job) is normal in large systems, but every extra store is something to run, secure, back up and keep in sync. Start with one relational database and add a store when a measured requirement needs it.

> [!sota] Discord's messages: picking for one access pattern
> Discord's messages are read and written by channel and time, at a volume of trillions of rows: a textbook wide-column pattern. Discord moved from MongoDB to **Cassandra** in 2017, then, after years of hot partitions and garbage-collection pauses, to **ScyllaDB** (a Cassandra-compatible store written in C++) in 2022, adding a Rust "data services" layer that merges duplicate reads of the same hot channel. They reported going from 177 Cassandra nodes to 72 ScyllaDB nodes, with p99 read latency falling from 40–125 ms to about 15 ms. The *data model* stayed the same; the access pattern decided the family, and operations decided the product.

**Two quick defaults worth defending in interviews:**

- **A payments ledger:** relational, with double-entry rows, transactions and constraints, idempotency keys on every write, never updated in place.
- **A chat or activity feed at very large scale:** a partitioned store keyed by conversation or user plus time, with eventual consistency for read receipts and counts.

## SD3.4 Picking a cache, queue or event stream 🟡 ⭐

**Caches.**

| | Redis | Valkey | Memcached |
|---|---|---|---|
| What | In-memory data structures: strings, hashes, lists, sorted sets, streams, pub/sub, vector sets | A community fork of Redis 7.2.4, created in March 2024 under the Linux Foundation | A simple, multi-threaded in-memory key-value cache |
| Licence (2026) | Redis 7.4 moved from BSD to dual RSALv2/SSPLv1 in 2024; **Redis 8 (2025) added AGPLv3** as a third option | BSD-3-Clause | BSD |
| Pick it when | You want the richest features and Redis's own modules or support | You want a permissive open-source licence; AWS and Google Cloud both offer it as a managed service | You only need a plain cache and want the simplest thing |

For most applications the three behave the same for cache-aside caching. The licence matters if you redistribute or offer it as a service, and for long-term vendor choice.

**Queues and logs.** Two different shapes are both called "messaging":

| | Message broker / queue | Event log / stream |
|---|---|---|
| Examples | RabbitMQ, Amazon SQS, Azure Service Bus queues | Apache Kafka, Amazon Kinesis, Azure Event Hubs, Redpanda |
| Model | A message is delivered to one consumer and removed once acknowledged | Events are appended to a partitioned log and **kept**; each consumer group tracks its own position |
| Replay | No (once consumed, gone) | Yes, re-read from any retained offset |
| Ordering | Per queue, weakened by parallel consumers and retries | Per partition |
| Best for | **Work distribution**: jobs, tasks, commands, routing by type or priority | **Event distribution and streaming**: many independent consumers, analytics, change data capture, rebuilding state |
| Operating it | Simple to moderate; fully managed options are trivial | More to run (Kafka 4.0 removed ZooKeeper, which helps); managed options exist |

<figure class="dia anim" data-rest="7.5"><svg viewBox="0 0 720 218" role="img" aria-label="Animation: on the left a queue hands each message to one of two workers and it disappears; on the right a log keeps events at numbered offsets while two consumer groups read at different speeds">
<text class="sT" x="170" y="22" text-anchor="middle">Queue: each message to ONE worker, then gone</text><text class="sT" x="545" y="22" text-anchor="middle">Log: kept; each group reads at its own pace</text>
<rect class="sA" x="10" y="90" width="80" height="40" rx="8"/><text class="sT" x="50" y="115" text-anchor="middle">producer</text><rect class="sN" x="110" y="96" width="110" height="28" rx="14"/><text class="sC" x="165" y="88" text-anchor="middle">queue</text>
<rect class="sG" x="250" y="50" width="100" height="36" rx="8"/><text class="sT" x="300" y="73" text-anchor="middle">worker 1</text><rect class="sG" x="250" y="134" width="100" height="36" rx="8"/><text class="sT" x="300" y="157" text-anchor="middle">worker 2</text>
<line class="sLm" x1="90" y1="110" x2="106" y2="110" marker-end="url(#ahm)"/><line class="sLm" x1="220" y1="104" x2="246" y2="72" marker-end="url(#ahm)"/><line class="sLm" x1="220" y1="116" x2="246" y2="148" marker-end="url(#ahm)"/>
<circle class="sPw" r="6" opacity="0"><animateMotion dur="10.0s" repeatCount="indefinite" calcMode="linear" path="M90 110 H200 L300 68" keyPoints="0;0;0.5;0.5;1;1" keyTimes="0;0.0400;0.0800;0.1100;0.1500;1"/><animate attributeName="opacity" dur="10.0s" repeatCount="indefinite" calcMode="discrete" values="0;1;0" keyTimes="0;0.0400;0.1550"/></circle>
<circle class="sPw" r="6" opacity="0"><animateMotion dur="10.0s" repeatCount="indefinite" calcMode="linear" path="M90 110 H200 L300 152" keyPoints="0;0;0.5;0.5;1;1" keyTimes="0;0.1700;0.2100;0.2400;0.2800;1"/><animate attributeName="opacity" dur="10.0s" repeatCount="indefinite" calcMode="discrete" values="0;1;0" keyTimes="0;0.1700;0.2850"/></circle>
<circle class="sPw" r="6" opacity="0"><animateMotion dur="10.0s" repeatCount="indefinite" calcMode="linear" path="M90 110 H200 L300 68" keyPoints="0;0;0.5;0.5;1;1" keyTimes="0;0.3000;0.3400;0.3700;0.4100;1"/><animate attributeName="opacity" dur="10.0s" repeatCount="indefinite" calcMode="discrete" values="0;1;0" keyTimes="0;0.3000;0.4150"/></circle>
<circle class="sPw" r="6" opacity="0"><animateMotion dur="10.0s" repeatCount="indefinite" calcMode="linear" path="M90 110 H200 L300 152" keyPoints="0;0;0.5;0.5;1;1" keyTimes="0;0.4300;0.4700;0.5000;0.5400;1"/><animate attributeName="opacity" dur="10.0s" repeatCount="indefinite" calcMode="discrete" values="0;1;0" keyTimes="0;0.4300;0.5450"/></circle>
<circle class="sPw" r="6" opacity="0"><animateMotion dur="10.0s" repeatCount="indefinite" calcMode="linear" path="M90 110 H200 L300 68" keyPoints="0;0;0.5;0.5;1;1" keyTimes="0;0.5600;0.6000;0.6300;0.6700;1"/><animate attributeName="opacity" dur="10.0s" repeatCount="indefinite" calcMode="discrete" values="0;1;0" keyTimes="0;0.5600;0.6750"/></circle>
<circle class="sPw" r="6" opacity="0"><animateMotion dur="10.0s" repeatCount="indefinite" calcMode="linear" path="M90 110 H200 L300 152" keyPoints="0;0;0.5;0.5;1;1" keyTimes="0;0.6900;0.7300;0.7600;0.8000;1"/><animate attributeName="opacity" dur="10.0s" repeatCount="indefinite" calcMode="discrete" values="0;1;0" keyTimes="0;0.6900;0.8050"/></circle>
<line class="sD" x1="372" y1="14" x2="372" y2="210"/>
<text class="sC" x="406" y="60" text-anchor="middle">0</text>
<rect class="sV" x="392" y="68" width="27" height="34" rx="3" opacity="0"><animate attributeName="opacity" dur="10.0s" repeatCount="indefinite" calcMode="discrete" values="0;1;0" keyTimes="0;0.0300;0.9700"/></rect>
<text class="sC" x="436" y="60" text-anchor="middle">1</text>
<rect class="sV" x="422" y="68" width="27" height="34" rx="3" opacity="0"><animate attributeName="opacity" dur="10.0s" repeatCount="indefinite" calcMode="discrete" values="0;1;0" keyTimes="0;0.1100;0.9700"/></rect>
<text class="sC" x="466" y="60" text-anchor="middle">2</text>
<rect class="sV" x="452" y="68" width="27" height="34" rx="3" opacity="0"><animate attributeName="opacity" dur="10.0s" repeatCount="indefinite" calcMode="discrete" values="0;1;0" keyTimes="0;0.1900;0.9700"/></rect>
<text class="sC" x="496" y="60" text-anchor="middle">3</text>
<rect class="sV" x="482" y="68" width="27" height="34" rx="3" opacity="0"><animate attributeName="opacity" dur="10.0s" repeatCount="indefinite" calcMode="discrete" values="0;1;0" keyTimes="0;0.2700;0.9700"/></rect>
<text class="sC" x="526" y="60" text-anchor="middle">4</text>
<rect class="sV" x="512" y="68" width="27" height="34" rx="3" opacity="0"><animate attributeName="opacity" dur="10.0s" repeatCount="indefinite" calcMode="discrete" values="0;1;0" keyTimes="0;0.3500;0.9700"/></rect>
<text class="sC" x="556" y="60" text-anchor="middle">5</text>
<rect class="sV" x="542" y="68" width="27" height="34" rx="3" opacity="0"><animate attributeName="opacity" dur="10.0s" repeatCount="indefinite" calcMode="discrete" values="0;1;0" keyTimes="0;0.4300;0.9700"/></rect>
<text class="sC" x="586" y="60" text-anchor="middle">6</text>
<rect class="sV" x="572" y="68" width="27" height="34" rx="3" opacity="0"><animate attributeName="opacity" dur="10.0s" repeatCount="indefinite" calcMode="discrete" values="0;1;0" keyTimes="0;0.5100;0.9700"/></rect>
<text class="sC" x="616" y="60" text-anchor="middle">7</text>
<rect class="sV" x="602" y="68" width="27" height="34" rx="3" opacity="0"><animate attributeName="opacity" dur="10.0s" repeatCount="indefinite" calcMode="discrete" values="0;1;0" keyTimes="0;0.5900;0.9700"/></rect>
<text class="sC" x="646" y="60" text-anchor="middle">8</text>
<rect class="sV" x="632" y="68" width="27" height="34" rx="3" opacity="0"><animate attributeName="opacity" dur="10.0s" repeatCount="indefinite" calcMode="discrete" values="0;1;0" keyTimes="0;0.6700;0.9700"/></rect>
<text class="sC" x="676" y="60" text-anchor="middle">9</text>
<rect class="sV" x="662" y="68" width="27" height="34" rx="3" opacity="0"><animate attributeName="opacity" dur="10.0s" repeatCount="indefinite" calcMode="discrete" values="0;1;0" keyTimes="0;0.7500;0.9700"/></rect>
<text class="sC" x="542" y="42" text-anchor="middle">offsets (append only)</text>
<g><path class="sFg" d="M0 -10 l-7 12 h14z" transform="translate(0 0)"><animateMotion dur="10.0s" repeatCount="indefinite" calcMode="discrete" path="M406 120 H676" keyPoints="0.0000;0.1111;0.2222;0.3333;0.4444;0.5556;0.6667;0.7778;0.8889;1.0000;1.0000" keyTimes="0.0000;0.1650;0.2500;0.3350;0.4200;0.5050;0.5900;0.6750;0.7600;0.8450;1.0000"/></path></g><text class="sC" x="388" y="124" text-anchor="end">email</text>
<g><path class="sFw" d="M0 -10 l-7 12 h14z" transform="translate(0 0)"><animateMotion dur="10.0s" repeatCount="indefinite" calcMode="discrete" path="M406 150 H676" keyPoints="0.0000;0.1111;0.2222;0.3333;0.4444;0.4444" keyTimes="0.0000;0.3000;0.5200;0.7400;0.9600;1.0000"/></path></g><text class="sC" x="388" y="154" text-anchor="end">analytics</text>
<text class="sS" x="545" y="190" text-anchor="middle">two consumer groups, same events, different positions</text>
<text class="sC" x="545" y="206" text-anchor="middle">a new group can replay from offset 0</text>
</svg><figcaption>Queue versus log. RabbitMQ, SQS and Service Bus behave like the left; Kafka, Kinesis and Event Hubs like the right.</figcaption></figure>

> [!say]
> "If I'm handing jobs to workers, I want a queue: RabbitMQ or a managed queue like SQS or Service Bus. If several independent systems need the same stream of events, or I need replay, I want a log like Kafka or Event Hubs. For a small team, the managed version of either is usually the right call."

## SD3.5 Picking how components talk 🟢 🟡 ⭐

| Style | Shape | Pick it for | Watch out for |
|---|---|---|---|
| **REST over HTTP + JSON** | Request–response on resources | Public and most internal APIs; the default | Chatty clients; over- and under-fetching ([[B4]]) |
| **GraphQL** | One endpoint; the client asks for exactly the fields it needs | Many different clients (web, mobile) over a rich data graph | Caching is harder; one query can be very expensive, so limit depth and cost |
| **gRPC** | Binary Protocol Buffers over HTTP/2, generated clients, streaming | Fast service-to-service calls inside your system | Not natively callable from browsers without a proxy (gRPC-Web); harder to inspect by hand |
| **WebSockets** | A persistent two-way connection | Chat, collaboration, live games, trading screens | Stateful connections complicate load balancing and scaling ([[SD2.4]]) |
| **Server-Sent Events (SSE)** | One-way stream from server to browser over plain HTTP | Live feeds, notifications, **streaming LLM tokens** (the major LLM APIs stream this way) | Server-to-client only |
| **Webhooks** | Your server calls the subscriber's URL when something happens | Notifying third parties (payment succeeded) | Retries, signatures to prove the sender, idempotent receivers |
| **Queue / event** | Fire and forget through a broker ([[SD1.8]]) | Work that needn't finish within the user's request | Eventual consistency; tracing across hops |

**Synchronous or asynchronous?** Use a synchronous call when the caller truly needs the answer to continue (checking stock before confirming an order). Use asynchronous messaging when it doesn't (sending the confirmation email). A long chain of synchronous calls multiplies latency and failure ([[SD1.9]]).

<figure class="dia"><svg viewBox="0 0 720 218" role="img" aria-label="Five ways components talk: REST request and response, WebSocket two-way messages, Server-Sent Events streaming, webhooks calling back, and a queue in between">
<rect class="sB" x="8" y="14" width="134" height="196" rx="10"/><text class="sT" x="75" y="34" text-anchor="middle">REST</text><text class="sC" x="75" y="50" text-anchor="middle">request → response</text>
<text class="sM" x="30" y="70" text-anchor="middle">C</text><text class="sM" x="120" y="70" text-anchor="middle">S</text><line class="sD" x1="30" y1="76" x2="30" y2="198"/><line class="sD" x1="120" y1="76" x2="120" y2="198"/>
<line class="sL" x1="30" y1="92" x2="118" y2="104" marker-end="url(#ah)"/><line class="sLg" x1="120" y1="112" x2="32" y2="124" marker-end="url(#ahg)"/><line class="sL" x1="30" y1="146" x2="118" y2="158" marker-end="url(#ah)"/><line class="sLg" x1="120" y1="166" x2="32" y2="178" marker-end="url(#ahg)"/>
<rect class="sB" x="150" y="14" width="134" height="196" rx="10"/><text class="sT" x="217" y="34" text-anchor="middle">WebSocket</text><text class="sC" x="217" y="50" text-anchor="middle">both ways, kept open</text>
<text class="sM" x="172" y="70" text-anchor="middle">C</text><text class="sM" x="262" y="70" text-anchor="middle">S</text><line class="sD" x1="172" y1="76" x2="172" y2="198"/><line class="sD" x1="262" y1="76" x2="262" y2="198"/>
<line class="sL" x1="172" y1="88" x2="260" y2="96" marker-end="url(#ah)"/><line class="sLg" x1="262" y1="108" x2="174" y2="116" marker-end="url(#ahg)"/><line class="sLg" x1="262" y1="128" x2="174" y2="136" marker-end="url(#ahg)"/><line class="sL" x1="172" y1="148" x2="260" y2="156" marker-end="url(#ah)"/><line class="sLg" x1="262" y1="168" x2="174" y2="176" marker-end="url(#ahg)"/>
<rect class="sB" x="292" y="14" width="134" height="196" rx="10"/><text class="sT" x="359" y="34" text-anchor="middle">SSE</text><text class="sC" x="359" y="50" text-anchor="middle">server streams</text>
<text class="sM" x="314" y="70" text-anchor="middle">C</text><text class="sM" x="404" y="70" text-anchor="middle">S</text><line class="sD" x1="314" y1="76" x2="314" y2="198"/><line class="sD" x1="404" y1="76" x2="404" y2="198"/>
<line class="sL" x1="314" y1="88" x2="402" y2="98" marker-end="url(#ah)"/>
<line class="sLg" x1="404" y1="112" x2="316" y2="120" marker-end="url(#ahg)"/>
<line class="sLg" x1="404" y1="129" x2="316" y2="137" marker-end="url(#ahg)"/>
<line class="sLg" x1="404" y1="146" x2="316" y2="154" marker-end="url(#ahg)"/>
<line class="sLg" x1="404" y1="163" x2="316" y2="171" marker-end="url(#ahg)"/>
<line class="sLg" x1="404" y1="180" x2="316" y2="188" marker-end="url(#ahg)"/>
<rect class="sB" x="434" y="14" width="134" height="196" rx="10"/><text class="sT" x="501" y="34" text-anchor="middle">Webhook</text><text class="sC" x="501" y="50" text-anchor="middle">they call you back</text>
<text class="sM" x="456" y="70" text-anchor="middle">C</text><text class="sM" x="546" y="70" text-anchor="middle">S</text><line class="sD" x1="456" y1="76" x2="456" y2="198"/><line class="sD" x1="546" y1="76" x2="546" y2="198"/>
<line class="sL" x1="456" y1="92" x2="544" y2="102" marker-end="url(#ah)"/><text class="sC" x="501" y="90" text-anchor="middle">subscribe</text><text class="sC" x="501" y="140" text-anchor="middle">… later …</text><line class="sLw" x1="546" y1="160" x2="458" y2="172" marker-end="url(#ahw)"/><text class="sC" x="501" y="192" text-anchor="middle">POST event</text>
<rect class="sB" x="576" y="14" width="134" height="196" rx="10"/><text class="sT" x="643" y="34" text-anchor="middle">Queue</text><text class="sC" x="643" y="50" text-anchor="middle">fire and forget</text>
<text class="sM" x="598" y="70" text-anchor="middle">C</text><text class="sM" x="688" y="70" text-anchor="middle">S</text><line class="sD" x1="598" y1="76" x2="598" y2="198"/><line class="sD" x1="688" y1="76" x2="688" y2="198"/>
<rect class="sW" x="628" y="120" width="30" height="40" rx="4"/><line class="sL" x1="598" y1="120" x2="626" y2="130" marker-end="url(#ah)"/><line class="sL" x1="658" y1="150" x2="686" y2="160" marker-end="url(#ah)"/><text class="sC" x="643" y="182" text-anchor="middle">later</text>
</svg><figcaption>Five shapes of conversation between a client (C) and a server (S). Pick the shape first; the protocol follows.</figcaption></figure>

## SD3.6 Picking where code runs 🟡 ⭐

| Option | You manage | Pick it for | Trade-offs |
|---|---|---|---|
| **Virtual machines** | OS, runtime, scaling, patching | Legacy software, special OS needs, steady workloads you want full control of | The most operational work |
| **PaaS** (Azure App Service, Heroku-style platforms, Render, Fly.io) | Your app and its config | Most web apps and APIs of small and medium teams | Less control; per-platform limits |
| **Containers on a managed service** (Azure Container Apps, AWS Fargate/ECS, Google Cloud Run) | Your container image | Containerised apps without running a cluster; scale-to-zero on some | Cold starts on scale-to-zero |
| **Kubernetes** (AKS, EKS, GKE) | Workloads, plus a lot of cluster configuration | Many services, a platform team, portability, complex scheduling | Real expertise needed; easy to over-adopt |
| **Serverless functions** (Azure Functions, AWS Lambda) | Your function code | Event-driven glue, spiky low-volume work, scheduled tasks | Cold starts, execution time limits, per-invocation pricing that gets expensive at constant high volume |
| **Edge functions** (Cloudflare Workers, Vercel and CDN edge runtimes) | Small functions at CDN locations | Personalisation, redirects, auth checks, A/B routing near the user | Restricted runtimes; data still lives in one region unless replicated |

<figure class="dia"><svg viewBox="0 0 720 254" role="img" aria-label="Monthly cost against monthly requests: a serverless function costs about one dollar per million 100-millisecond calls and grows linearly, while two always-on containers cost about 72 dollars a month regardless of traffic; the lines cross at roughly 70 million requests a month, about 27 requests per second on average">
<line class="sLm" x1="70" y1="210" x2="510" y2="210"/><line class="sLm" x1="70" y1="210" x2="70" y2="24"/>
<text class="sS" x="70" y="226" text-anchor="middle">1e5</text><line class="sLm" x1="70" y1="30" x2="70" y2="210" opacity=".12"/>
<text class="sS" x="180" y="226" text-anchor="middle">1e6</text><line class="sLm" x1="180" y1="30" x2="180" y2="210" opacity=".12"/>
<text class="sS" x="290" y="226" text-anchor="middle">1e7</text><line class="sLm" x1="290" y1="30" x2="290" y2="210" opacity=".12"/>
<text class="sS" x="400" y="226" text-anchor="middle">1e8</text><line class="sLm" x1="400" y1="30" x2="400" y2="210" opacity=".12"/>
<text class="sS" x="510" y="226" text-anchor="middle">1e9</text><line class="sLm" x1="510" y1="30" x2="510" y2="210" opacity=".12"/>
<text class="sS" x="62" y="178" text-anchor="end">$1</text><line class="sLm" x1="70" y1="174" x2="510" y2="174" opacity=".12"/>
<text class="sS" x="62" y="142" text-anchor="end">$10</text><line class="sLm" x1="70" y1="138" x2="510" y2="138" opacity=".12"/>
<text class="sS" x="62" y="106" text-anchor="end">$100</text><line class="sLm" x1="70" y1="102" x2="510" y2="102" opacity=".12"/>
<text class="sS" x="62" y="70" text-anchor="end">$1000</text><line class="sLm" x1="70" y1="66" x2="510" y2="66" opacity=".12"/>
<text class="sS" x="62" y="34" text-anchor="end">$10000</text><line class="sLm" x1="70" y1="30" x2="510" y2="30" opacity=".12"/>
<text class="sS" x="290" y="244" text-anchor="middle">requests per month (log scale)</text><text class="sS" x="18" y="117" text-anchor="middle" transform="rotate(-90 18 117)">cost per month</text>
<polyline class="sLw" points="70.0,209.5 75.5,207.7 81.0,205.9 86.5,204.1 92.0,202.3 97.5,200.5 103.0,198.7 108.5,196.9 114.0,195.1 119.5,193.3 125.0,191.5 130.5,189.7 136.0,187.9 141.5,186.1 147.0,184.3 152.5,182.5 158.0,180.7 163.5,178.9 169.0,177.1 174.5,175.3 180.0,173.5 185.5,171.7 191.0,169.9 196.5,168.1 202.0,166.3 207.5,164.5 213.0,162.7 218.5,160.9 224.0,159.1 229.5,157.3 235.0,155.5 240.5,153.7 246.0,151.9 251.5,150.1 257.0,148.3 262.5,146.5 268.0,144.7 273.5,142.9 279.0,141.1 284.5,139.3 290.0,137.5 295.5,135.7 301.0,133.9 306.5,132.1 312.0,130.3 317.5,128.5 323.0,126.7 328.5,124.9 334.0,123.1 339.5,121.3 345.0,119.5 350.5,117.7 356.0,115.9 361.5,114.1 367.0,112.3 372.5,110.5 378.0,108.7 383.5,106.9 389.0,105.1 394.5,103.3 400.0,101.5 405.5,99.7 411.0,97.9 416.5,96.1 422.0,94.3 427.5,92.5 433.0,90.7 438.5,88.9 444.0,87.1 449.5,85.3 455.0,83.5 460.5,81.7 466.0,79.9 471.5,78.1 477.0,76.3 482.5,74.5 488.0,72.7 493.5,70.9 499.0,69.1 504.5,67.3 510.0,65.5" style="fill:none;stroke-width:2.5"/>
<line class="sLg" x1="70" y1="107.119" x2="510" y2="107.119" style="stroke-width:2.5"/>
<circle class="sP" cx="382.8" cy="107.1" r="5"/>
<text class="sT" x="372.793" y="83.1186" text-anchor="end">break-even ≈ 70M requests/month</text>
<text class="sS" x="372.793" y="99.1186" text-anchor="end">≈ 27 requests/s on average</text>
<rect class="sN" x="530" y="30" width="176" height="180" rx="8"/>
<text class="sWt" x="618" y="52" text-anchor="middle">serverless function</text><text class="sS" x="618" y="70" text-anchor="middle">$1.03 per million calls</text><text class="sS" x="618" y="86" text-anchor="middle">(100 ms, 512 MB each)</text>
<text class="sGt" x="618" y="118" text-anchor="middle">2 always-on containers</text><text class="sS" x="618" y="136" text-anchor="middle">$72 per month</text><text class="sS" x="618" y="152" text-anchor="middle">(1 vCPU, 2 GB each)</text>
<text class="sS" x="618" y="184" text-anchor="middle">illustrative AWS list</text><text class="sS" x="618" y="200" text-anchor="middle">prices, us-east-1</text>
</svg><figcaption>Why serverless is cheap for spiky, low-volume work and expensive at constant high volume: pay per call versus pay per hour (Lambda and Fargate list prices; free tiers ignored).</figcaption></figure>

> [!say]
> "For one team with a web app and an API, I'd start on a PaaS or a managed container service. Kubernetes earns its cost once there are many services and someone owns the platform. Serverless is great for spiky, event-driven work, but I'd check the bill for anything that runs constantly at high volume."

## SD3.7 Picking an architecture style 🟡

| Style | Choose when | Read more |
|---|---|---|
| **Modular monolith** | The default for one to a few teams: one deployable, strong internal boundaries | [[SD2.10]], [[B9]] |
| **Microservices** | Many teams need independent deployment; parts have very different scaling or reliability needs | [[SD2.10]] |
| **Event-driven** | Many consumers react to the same business events; you need loose coupling and an audit trail | [[B8.4]], [[DE8]] |
| **Serverless-first** | Small event-driven workloads with spiky traffic and a small team | [[SD3.6]] |
| **Cell-based** | Very large systems that must limit the blast radius of any failure | [[SD4.7]] |

## SD3.8 Build, buy or use a managed service 🟡

Before building, ask whether it is **core to what makes your product different**. If not, use a managed service or buy it.

| Usually buy or use managed | Usually build |
|---|---|
| Databases, queues, caches, search clusters | Your domain logic: pricing rules, matching, risk scoring |
| Authentication and identity (Entra ID, Auth0, Cognito, Keycloak if self-hosting) | The workflows and user experience that differentiate the product |
| Email, SMS and push delivery | Integrations unique to your customers |
| Payments (Paymob, Fawry, Stripe and others, depending on market) | Internal tools specific to your process |
| Observability (Azure Monitor, Grafana, Datadog) | |

<figure class="dia"><svg viewBox="0 0 720 254" role="img" aria-label="Monthly cost of a managed service, the infrastructure price times 1.6, against self-hosting, the infrastructure price plus about 3,000 dollars a month of engineering and on-call time: managed is cheaper until about 5,000 dollars a month of infrastructure, after which self-hosting starts to pay for its team">
<line class="sLm" x1="70" y1="210" x2="490" y2="210"/><line class="sLm" x1="70" y1="210" x2="70" y2="26"/>
<text class="sS" x="70" y="226" text-anchor="middle">$0k</text>
<text class="sS" x="210" y="226" text-anchor="middle">$5k</text>
<text class="sS" x="350" y="226" text-anchor="middle">$10k</text>
<text class="sS" x="490" y="226" text-anchor="middle">$15k</text>
<text class="sS" x="62" y="142" text-anchor="end">$10k</text><line class="sLm" x1="70" y1="138" x2="490" y2="138" opacity=".15"/>
<text class="sS" x="62" y="70" text-anchor="end">$20k</text><line class="sLm" x1="70" y1="66" x2="490" y2="66" opacity=".15"/>
<text class="sS" x="280" y="244" text-anchor="middle">infrastructure you need, per month (what raw VMs and disks would cost)</text>
<text class="sS" x="20" y="118" text-anchor="middle" transform="rotate(-90 20 118)">total monthly cost</text>
<rect class="sG" x="70" y="26" width="140" height="184" rx="0" opacity=".08"/>
<line class="sLv" x1="70" y1="210" x2="490" y2="37.2" style="stroke-width:2.5"/>
<line class="sLw" x1="70" y1="188.4" x2="490" y2="80.4" style="stroke-width:2.5"/>
<circle class="sP" cx="210.0" cy="152.4" r="5"/><text class="sT" x="218" y="172.4">break-even ≈ $5,000/month</text>
<text class="sGt" x="140" y="44" text-anchor="middle">managed wins</text>
<rect class="sN" x="510" y="30" width="196" height="180" rx="8"/>
<text class="sT" x="608" y="52" text-anchor="middle">managed service</text><line class="sLv" x1="530" y1="64" x2="550" y2="64" style="stroke-width:2.5"/><text class="sS" x="556" y="68">infra × 1.6</text>
<text class="sT" x="608" y="96" text-anchor="middle">self-hosted</text><line class="sLw" x1="530" y1="108" x2="550" y2="108" style="stroke-width:2.5"/><text class="sS" x="556" y="112">infra + $3,000/month</text><text class="sS" x="556" y="128">of people time and on-call</text>
<text class="sS" x="608" y="160" text-anchor="middle">illustrative assumptions:</text><text class="sS" x="608" y="176" text-anchor="middle">plug in your own numbers</text><text class="sS" x="608" y="192" text-anchor="middle">before deciding</text>
</svg><figcaption>Why managed services win at small scale and get revisited at large scale: a percentage premium against a fixed people cost (illustrative numbers).</figcaption></figure>

Managed services cost more per unit than self-hosting and create some lock-in; they save engineering time, on-call and security work, which at small scale is almost always the better deal. Revisit at large scale, where the bill may justify a team.

## SD3.9 One product, different answers 🟡 ⭐

The same decision comes out differently depending on requirements. A useful exercise, and a good interview answer shape:

| | Mobile wallet (EGP transfers) | Group chat app | Sales analytics dashboard |
|---|---|---|---|
| Consistency | **Strong** for balances; idempotent transfers | Eventual for receipts and presence; ordering per conversation | Freshness SLA (e.g. data up to 15 minutes old) |
| Primary store | Relational ledger (PostgreSQL or SQL Server) | Partitioned store keyed by conversation + time | Warehouse or lakehouse with aggregate tables |
| Messaging | Outbox → queue for notifications and fraud checks | WebSockets for delivery; a log for fan-out and history | Batch or micro-batch loads; CDC from source systems |
| Caching | Careful: never cache balances for decisions | Recent messages and presence in memory | Pre-aggregated tables; BI tool cache |
| Availability stance | Refuse a transfer rather than risk a double spend (CP) | Keep chatting through partitions, reconcile later (AP) | Show the last good data with a "last updated" time |

## SD3.10 Interview drill 🟢 ⭐

| Question | Strong short answer |
|---|---|
| How do you choose between two technologies? | Start from requirements and constraints, compare two or three options on the trade-offs that matter, prefer what the team already runs, and record the decision in an ADR. |
| State the CAP theorem correctly. | During a network partition, a distributed store must either refuse some requests to stay consistent or keep answering with possibly stale data. |
| Why is "CA" not a real option? | Partitions happen in any networked system; the choice is consistency or availability while one lasts. |
| What does PACELC add? | Without a partition, you still trade latency against consistency. |
| Strong vs eventual consistency: give one example of each. | Strong for an account balance or a seat booking; eventual for like counts or follower numbers. |
| SQL or NoSQL for an e-commerce order system? | Relational: orders, payments and stock need transactions and constraints; add caches and search alongside it. |
| When does a wide-column store fit? | Huge volumes read by a known key and time range, such as messages per channel or events per device. |
| Kafka or RabbitMQ? | RabbitMQ (or a managed queue) to distribute jobs to workers; Kafka when many consumers need the same event stream or replay. |
| Redis vs Valkey? | Functionally similar for caching; Valkey is a BSD-licensed fork from 2024, Redis 8 is available under AGPLv3 or its source-available licences. |
| REST, GraphQL or gRPC? | REST by default; GraphQL for many clients over a rich graph; gRPC for fast internal service-to-service calls. |
| How would you stream an LLM answer to a browser? | Server-Sent Events: one-way, plain HTTP, what the major LLM APIs use. |
| Kubernetes or serverless? | PaaS or managed containers for most single-team apps; Kubernetes with many services and a platform team; serverless for spiky event-driven work. |
| What is an ADR? | A short record of one architecture decision: context, options, decision, consequences. |
| What is a one-way-door decision? | One that is expensive to reverse, like a primary database or a public API contract: worth slowing down for. |

## Key takeaways

> [!check]
> - Decide from requirements and constraints; compare trade-offs, not feature lists; write the decision down.
> - CAP is about partitions; PACELC covers normal operation; choose consistency per data type.
> - Relational is the default database; access patterns and write scale justify the alternatives.
> - Queues distribute work; logs distribute events and allow replay.
> - REST by default; WebSockets or SSE for real time; gRPC inside; queues for anything that can wait.
> - Prefer managed and boring for anything that isn't your differentiator; save innovation for where it pays.

## Sources

- Eric Brewer, [CAP Twelve Years Later: How the "Rules" Have Changed](https://www.infoq.com/articles/cap-twelve-years-later-how-the-rules-have-changed/) (*IEEE Computer*, 2012); Seth Gilbert and Nancy Lynch, "Brewer's conjecture and the feasibility of consistent, available, partition-tolerant web services" (*ACM SIGACT News*, 2002).
- Daniel Abadi, "Consistency Tradeoffs in Modern Distributed Database System Design" (*IEEE Computer*, 2012) on PACELC; [Jepsen: consistency models](https://jepsen.io/consistency).
- Discord, [How Discord Stores Trillions of Messages](https://discord.com/blog/how-discord-stores-trillions-of-messages) (March 2023).
- Redis, [Redis is now available under the AGPLv3 open source license](https://redis.io/blog/agplv3/) (May 2025); [Valkey](https://valkey.io/) (Linux Foundation).
- Apache Kafka [documentation](https://kafka.apache.org/documentation/); RabbitMQ [documentation](https://www.rabbitmq.com/docs).
- Michael Nygard, [Documenting Architecture Decisions](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions) (2011); Dan McKinley, [Choose Boring Technology](https://mcfunley.com/choose-boring-technology) (2015).
- AWS, [DynamoDB read consistency](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/HowItWorks.ReadConsistency.html); Microsoft, [Azure Architecture Center: technology choices](https://learn.microsoft.com/en-us/azure/architecture/guide/technology-choices/technology-choices-overview).
- MDN: [Server-sent events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events); [gRPC](https://grpc.io/docs/what-is-grpc/introduction/); [GraphQL](https://graphql.org/learn/).
