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

## SD3.6 Picking where code runs 🟡 ⭐

| Option | You manage | Pick it for | Trade-offs |
|---|---|---|---|
| **Virtual machines** | OS, runtime, scaling, patching | Legacy software, special OS needs, steady workloads you want full control of | The most operational work |
| **PaaS** (Azure App Service, Heroku-style platforms, Render, Fly.io) | Your app and its config | Most web apps and APIs of small and medium teams | Less control; per-platform limits |
| **Containers on a managed service** (Azure Container Apps, AWS Fargate/ECS, Google Cloud Run) | Your container image | Containerised apps without running a cluster; scale-to-zero on some | Cold starts on scale-to-zero |
| **Kubernetes** (AKS, EKS, GKE) | Workloads, plus a lot of cluster configuration | Many services, a platform team, portability, complex scheduling | Real expertise needed; easy to over-adopt |
| **Serverless functions** (Azure Functions, AWS Lambda) | Your function code | Event-driven glue, spiky low-volume work, scheduled tasks | Cold starts, execution time limits, per-invocation pricing that gets expensive at constant high volume |
| **Edge functions** (Cloudflare Workers, Vercel and CDN edge runtimes) | Small functions at CDN locations | Personalisation, redirects, auth checks, A/B routing near the user | Restricted runtimes; data still lives in one region unless replicated |

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
