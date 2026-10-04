# Scaling in Production — From One Server to Millions of Users

Every large system started small, and most of them grew one bottleneck at a time. This module walks the ladder that almost every web product climbs: one server, a separate database, many app servers behind a load balancer, caches and replicas, queues, then partitioned data, multiple regions and, sometimes, microservices. For each rung it gives **the signal that tells you to climb, what you add, and what it costs you**, with real examples from companies that published their numbers. The building blocks are explained in [[SD1]]; choosing between products is [[SD3]].

> [!focus]
> **Entry must:** describe the ladder in order and say why each step exists; explain connection pooling, horizontal scaling behind a load balancer, caching, read replicas and queues; answer "how would you handle 10× the users?" for your own project.
> **Mid adds:** identify the bottleneck from metrics before choosing a fix; partitioning and sharding and their costs; autoscaling and load testing; multi-region trade-offs; why microservices solve an organisational problem more than a traffic problem.
> **Most asked:** *How would you scale this to a million users?* · *Your database CPU is at 90%: what do you do?* · *When would you introduce caching / read replicas / sharding?* · *Monolith or microservices?* · *How do you know it will survive launch day?*
> **Time budget:** 3 hours.

## SD2.1 The one rule: measure, find the bottleneck, fix only that 🟢 ⭐

Scaling is not a checklist you complete in advance. It is a loop:

1. **Measure** what users experience (latency percentiles, error rate) and what the machines feel (CPU, memory, disk I/O, connections, queue depth).
2. **Find the bottleneck**: the one resource that saturates first. There is always exactly one at a time.
3. **Fix that** with the simplest change that buys enough headroom.
4. **Repeat**, because the bottleneck has now moved somewhere else.

> [!say]
> "I wouldn't add components up front. I'd measure where the time and the saturation are, fix that specific bottleneck with the simplest change, then measure again. Each step on the scaling ladder adds operational cost, so each one has to be earned by a real limit."

> [!mistake] Designing for Google's traffic on day one
> Microservices, Kubernetes, Kafka and sharding for a product with 500 users slow the team down for years and buy nothing. The opposite mistake is also real: no backups, no monitoring and no way to add a second server. Start simple, but keep the doors open: stateless app servers, a managed database, and metrics from day one.

## SD2.2 The ladder at a glance 🟢 ⭐

User counts are often attached to these stages ("1,000 users: one server; 1 million: microservices"). Treat them as very loose: a chat app with 10,000 active users can do more work than a brochure site with 10 million visitors. **Climb when you see the signal, not when you pass a number.**

| Stage | Add | Climb when you see | What it costs you |
|---|---|---|---|
| 1 | **One server** running app and database | (start here) | One failure takes everything down |
| 2 | **Separate, managed database** + connection pooling | App and database fight for CPU/RAM; you need backups and point-in-time restore | A network hop; a monthly bill |
| 3 | **Load balancer + several stateless app servers**, autoscaling | App CPU saturates; deploys cause downtime; one server is a single point of failure | Sessions and files must move out of the servers |
| 4 | **Cache + CDN + read replicas** | Database CPU is mostly reads; the same queries repeat; users far away see slow pages | Staleness, invalidation, replication lag |
| 5 | **Queues and workers** | Requests are slow because of work the user doesn't need to wait for; spikes overload downstream systems | Duplicate messages, retries, harder debugging |
| 6 | **Partitioning and sharding** | The primary database can't keep up with *writes* or storage even on the biggest sensible machine | Cross-shard queries and transactions become hard; resharding is a project |
| 7 | **Multiple regions** | Users on other continents need low latency; the business needs to survive a region outage | Data replication across regions, conflict handling, much higher cost |
| (any) | **Splitting into services** | Many teams block each other in one codebase; parts need very different scaling or release cycles | Network calls, distributed failures, observability and platform work |

<figure class="dia"><svg viewBox="0 0 720 210" role="img" aria-label="Scaling ladder from one server to multi-region">
<rect class="sB" x="10" y="150" width="88" height="44" rx="6"/><text class="sT" x="54" y="170" text-anchor="middle">1 · one</text><text class="sT" x="54" y="185" text-anchor="middle">server</text>
<rect class="sB" x="110" y="128" width="88" height="66" rx="6"/><text class="sT" x="154" y="158" text-anchor="middle">2 · own</text><text class="sT" x="154" y="173" text-anchor="middle">database</text>
<rect class="sA" x="210" y="106" width="88" height="88" rx="6"/><text class="sT" x="254" y="146" text-anchor="middle">3 · LB +</text><text class="sT" x="254" y="161" text-anchor="middle">N servers</text>
<rect class="sA" x="310" y="84" width="88" height="110" rx="6"/><text class="sT" x="354" y="134" text-anchor="middle">4 · cache,</text><text class="sT" x="354" y="149" text-anchor="middle">CDN, replicas</text>
<rect class="sG" x="410" y="62" width="88" height="132" rx="6"/><text class="sT" x="454" y="124" text-anchor="middle">5 · queues</text><text class="sT" x="454" y="139" text-anchor="middle">+ workers</text>
<rect class="sW" x="510" y="40" width="88" height="154" rx="6"/><text class="sT" x="554" y="112" text-anchor="middle">6 · shards</text>
<rect class="sR" x="610" y="18" width="98" height="176" rx="6"/><text class="sT" x="659" y="100" text-anchor="middle">7 · multi-</text><text class="sT" x="659" y="115" text-anchor="middle">region</text>
<text class="sS" x="10" y="20">Each step: more capacity and resilience, more moving parts to run</text>
</svg><figcaption>Most products never need the last two steps. Many successful ones stop at step 4 or 5 for years.</figcaption></figure>

## SD2.3 Stages 1–2: one server, then a separate database 🟢 ⭐

**One server** (a single VM, or a platform such as Azure App Service, Render or a small VPS) is the right start. It is fast to build, cheap and easy to reason about. Do these things from day one, because they are cheap now and painful later:

- **Automated backups**, and one restore actually tested.
- **Basic monitoring**: uptime checks, error logging, CPU and memory graphs.
- **Configuration and secrets outside the code**, so a second server can be started identically.
- **Files in object storage** rather than the server's disk.

**Stage 2: move the database to its own managed instance** (Azure SQL, Amazon RDS or Aurora, Cloud SQL, or a managed PostgreSQL provider). The app and the database stop competing for memory, and the provider handles patching, backups, point-in-time restore and failover to a standby.

> [!term] Connection pooling
> Opening a database connection is expensive (a TCP and TLS handshake, authentication, a server process or thread), and databases support a limited number at once; PostgreSQL's default `max_connections` is 100. A **pool** keeps a set of open connections and lends them to requests. Every serious driver pools inside the app (ADO.NET and EF Core do by default); when many app instances or serverless functions connect, an external pooler such as **PgBouncer** or a managed proxy (Amazon RDS Proxy) sits in front of the database so 500 app processes share 50 real connections.

> [!mistake] Scaling app servers into a connection storm
> Autoscaling from 4 to 40 app instances, each with a pool of 50, means up to 2,000 connections hitting a database that allows a few hundred. The database falls over *because* you scaled. Size pools with Little's Law ([[SD1.3]]) and put a pooler in front.

## SD2.4 Stage 3: a load balancer and stateless app servers 🟢 ⭐

When one app server runs out of CPU, or you want deploys and machine failures to stop causing downtime, run **several identical app servers behind a load balancer** ([[SD1.5]]).

What has to change first is **state** ([[SD1.4]]):

| State that lived on the server | Where it goes |
|---|---|
| Login sessions | A signed token (JWT, [[B7]]) or a shared session store (Redis) |
| Uploaded files | Object storage, uploaded directly with pre-signed URLs |
| In-memory caches | A shared cache (Redis), or accept that each server has its own short-lived copy |
| Scheduled jobs | A job scheduler that runs each job once (Hangfire with a shared database, Quartz clustering, a cloud scheduler), not a timer in every instance |
| WebSocket connections | Still on one server each, so fan-out between servers goes through a backplane (Redis pub/sub for SignalR or Socket.IO) |

> [!term] Autoscaling
> Adding and removing instances automatically based on a metric: CPU, requests per instance, or queue length. It saves money at night and absorbs daytime peaks. It only works if instances start quickly, are stateless, and the things behind them (database connections, third-party rate limits) can absorb the extra instances.

**Health checks** decide which instances receive traffic. Distinguish a **liveness** check (is the process alive? if not, restart it) from a **readiness** check (can it serve right now? if not, stop sending it traffic but don't kill it). A readiness check that calls the database can take the whole fleet out of rotation when the database blips, so keep it cheap and think about what it should really mean.

## SD2.5 Stage 4: caching, CDNs and read replicas 🟢 ⭐

Most applications read far more than they write (10:1 to 100:1 is common). Stage 4 attacks the read load in three layers, cheapest first:

1. **A CDN** for static assets and for public responses that are the same for everyone (product pages, images, the JavaScript bundle).
2. **An application cache** (Redis, Valkey or Memcached) for hot data that is expensive to compute: the home-page feed, a user's permissions, an aggregated dashboard. Patterns, TTLs and stampede protection are in [[B8.2]].
3. **Read replicas**: copies of the database that receive changes from the primary and serve read-only queries such as reports, search pages and dashboards ([[B6.7]]).

> [!term] Replication lag
> Replicas usually receive changes asynchronously, a few milliseconds to seconds behind the primary. A user who saves their profile and is immediately sent to a replica may see the old value. Fixes: read your own recent writes from the primary for a short time ("read-your-writes"), or route a session to the primary after it writes.

> [!sota] What large read-heavy sites actually ran
> Stack Overflow described its 2016 setup in detail: on a sample day it served about **209 million HTTP requests** and **66 million page loads** from **9 primary web servers**, **4 SQL Server machines** (two clusters, each a primary with a replica) and a pair of Redis servers that answered about **5.8 billion cache hits** that day, with Redis below 2% CPU. The lesson isn't "use few servers"; it's that heavy caching, efficient queries and measurement took a monolith a very long way. (Its public sites moved to Google Cloud in 2025.)

## SD2.6 Stage 5: queues and background workers 🟢 ⭐

Move work out of the request when the user doesn't need its result immediately: emails and notifications, image and video processing, PDF generation, imports of large files, calls to slow third parties, model scoring in batches, search-index updates.

```
POST /orders  →  save order + outbox row (one transaction)  →  202/201 in ~50 ms
                                   ↓
                     relay publishes OrderPlaced
                                   ↓
        email worker · invoice worker · analytics worker · loyalty worker
```

Design points that interviewers probe:

- **At-least-once delivery** is the norm, so every consumer must be **idempotent** ([[SD4.3]]).
- The **outbox pattern** ([[B8.7]]) avoids saving the order but losing the message (or the reverse) when the app crashes between the two.
- **Separate queues by priority**, so a password-reset code isn't stuck behind a marketing campaign.
- **Watch queue depth and the age of the oldest message**, and scale workers on them; send poison messages to a **dead-letter queue** after a few retries.
- Queues **move** load; they don't remove it. If workers are permanently slower than producers, the queue grows until something breaks. That needs more workers or **backpressure** ([[SD4.4]]).

## SD2.7 Stage 6: partitioning and sharding 🟡 ⭐

When the primary database can't keep up with **writes** or **storage** even on a large machine, and you've already fixed queries, indexes, caching and replicas, you split the data.

| Technique | What it means | Example |
|---|---|---|
| **Vertical partitioning** | Move groups of tables to separate databases by domain | Users and billing in one database, files and comments in another |
| **Table partitioning** | Split one big table into partitions inside the *same* database, usually by time or key | `transactions` partitioned by month; old months archived cheaply |
| **Horizontal sharding** | Split the *rows* of a table across several databases by a **shard key** | Tenants 1–1,000 on shard A, 1,001–2,000 on shard B |

**Choosing the shard key is the whole game.** A good key spreads load evenly and keeps the data one request needs on one shard: `tenant_id` for a B2B SaaS, `user_id` for a consumer app. A bad key creates **hot shards** (sharding by country when 80% of users are in Egypt) or forces **scatter-gather** queries across every shard. Cross-shard joins, transactions and unique constraints become application problems, and moving data when you add shards (**resharding**) is a project of its own; consistent hashing ([[SD4.6]]) limits how much moves.

> [!sota] How Figma did it (2020–2024)
> Figma's database team published the path in March 2024. In 2020 Figma ran **a single PostgreSQL database on AWS's largest physical instance**. By the end of 2022 they had added caching, read replicas and about a dozen **vertically partitioned** databases. When single tables still outgrew one machine, they spent roughly nine months building **horizontal sharding**: first "logical sharding" (queries routed as if sharded while the data still sat in one database, so mistakes were cheap to undo), then "physical sharding", behind a proxy (DBProxy) that parses each query and routes it to the right shard. Every step on this ladder, in order, at a company whose database load grew almost 100× in four years.

> [!note] Managed options that shard for you
> Distributed SQL databases (Google Spanner, CockroachDB, YugabyteDB, Azure Cosmos DB for PostgreSQL built on Citus) and NoSQL stores such as DynamoDB and Cassandra partition data automatically. They don't remove the need for a good partition key; they make the mechanics someone else's problem, at a price.

## SD2.8 Capacity planning, load testing and launch day 🟡 ⭐

**Capacity planning** is estimation ([[SD1.10]]) plus measurement: know your current peak, your growth rate, and the headroom left on each resource, and act before headroom runs out, not after.

**Load testing** proves it. Tools such as **k6**, **JMeter**, **Locust**, **Gatling** or Azure Load Testing replay realistic traffic against a production-like environment:

1. Model real behaviour: the mix of endpoints, think time, realistic data sizes, logged-in vs anonymous users.
2. Ramp up until something breaks; note *what* broke first and at what load. That is your current ceiling.
3. Run a **soak test** (hours at expected peak) to find memory leaks and slow degradation.
4. Run a **spike test** (sudden 10× jump) to check autoscaling and queues react in time.

> [!sota] Planning for a known peak
> Shopify prepares all year for Black Friday–Cyber Monday. Over the 2025 weekend its platform peaked at about **489 million requests per minute at the edge** and **more than 117 million per minute on its application servers**, and processed **14.8 trillion database queries** over the weekend (company press release, December 2025). That is a known date with rehearsed load tests and capacity reserved in advance, and it runs on a Ruby on Rails **modular monolith**, with stores grouped into isolated "pods".

**For Egyptian products the known peaks are predictable:** Ramadan evenings (iftar and suhoor for food delivery), salary days at the end of the month (banking and wallets), White Friday sales in November, Thanaweya Amma results day (education sites), and big football matches (streaming and betting traffic). Load-test against them.

## SD2.9 Stage 7: multiple regions 🟡 🔴

Go multi-region for one of two reasons: **latency** for users on other continents, or **surviving the loss of a whole region**. Both are expensive, so be clear which one you need.

| Pattern | How | Trade-off |
|---|---|---|
| **Backup and restore** in another region | Regular backups copied across regions | Cheapest; recovery takes hours |
| **Warm standby (active-passive)** | A smaller copy of the system runs in region B, data replicated asynchronously; fail over when A fails | Minutes of downtime and some lost writes (the replication lag), for a moderate cost |
| **Active-active** | Both regions serve traffic and accept writes | Lowest latency and fastest failover; you must handle write conflicts or partition users by region; the most complex and expensive |

**Recovery targets** decide which pattern you need: the **RTO** (how long you may be down) and the **RPO** (how much recent data you may lose). See [[SD4.8]].

> [!sota] Why "one region" is a business decision, not just a technical one
> On 19–20 October 2025 a race condition in the automation that manages DynamoDB's DNS records left the service's regional endpoint in AWS's us-east-1 (Northern Virginia) with an empty DNS record. Because other AWS internals depend on DynamoDB, EC2 instance launches and Network Load Balancer health checks were affected too, and impact on customer applications lasted, in stages, for about 14 hours. Products that ran only in that region went down with it. Most can accept that risk; banks, payment gateways and hospitals usually can't.

**Data residency** is part of this decision. Egypt's Personal Data Protection Law (No. 151 of 2020) restricts transferring personal data abroad without meeting its conditions, and regulated sectors (banking, health, government) often have stricter rules, so check with legal before choosing regions for Egyptian users' personal data.

## SD2.10 Microservices are about teams, not traffic 🟡 ⭐

A popular rule says "at a million users, break the monolith into microservices". That reverses cause and effect. **A well-built monolith scales to very large traffic** by running many copies behind a load balancer; the companies above prove it. Microservices mainly solve an **organisational** problem: many teams that need to release independently without blocking each other.

| | Monolith (well-structured, "modular") | Microservices |
|---|---|---|
| Deploy | One unit, many copies | Many units, each its own pipeline |
| Scales traffic? | Yes, horizontally | Yes, and each part independently |
| Team scaling | Gets harder past many teams in one codebase, unless boundaries are enforced | Teams own services end to end |
| Failure | In-process calls don't fail on the network | Every call can time out; needs retries, circuit breakers, tracing |
| Data | One database, real transactions | A database per service; consistency through events and sagas |
| Cost to run | Low | High: platform, observability, on-call per service |

> [!sota] Three public data points
> - **Shopify** runs one of the largest Ruby on Rails codebases as a **modular monolith** with enforced component boundaries ("Deconstructing the Monolith", 2019), and serves Black Friday at the scale in [[SD2.8]].
> - **Amazon Prime Video**'s team wrote in March 2023 that moving a stream-monitoring service from distributed serverless components (AWS Step Functions and Lambda, with S3 between steps) into a **single process** on EC2 and ECS cut that service's infrastructure cost by **over 90%** and let it scale further. The per-state-transition pricing and the data passed between steps were the problem.
> - **Figma** ([[SD2.7]]) scaled PostgreSQL to the limit before sharding, rather than rewriting into services.

Martin Fowler's "MonolithFirst" (2015) puts it plainly: almost all successful microservice systems he saw started as a monolith that was split once its boundaries were understood. The practical path is a **modular monolith** first: clear modules with their own folders, interfaces and ideally their own database schema, which can be extracted into a service later if a team or a scaling need demands it ([[B9]]).

> [!say]
> "Traffic alone isn't a reason for microservices: a stateless monolith scales horizontally. I'd start with a modular monolith and extract a service when a module needs independent releases by its own team, or very different scaling, like a CPU-heavy video encoder next to a light CRUD API."

## SD2.11 Cost at scale 🟡

At small scale, engineers cost far more than servers. At large scale, the cloud bill becomes a design input.

- **Know your unit cost**: cost per active user, per order, per thousand API calls, per LLM conversation ([[SD5.7]]). It tells you whether growth makes you richer or poorer.
- **The usual leaks**: oversized instances running at 5% CPU, forgotten environments, **data egress** (moving data out of a cloud or between regions is billed per GB), chatty services calling each other across zones, logs kept forever at full detail, and per-request pricing (serverless functions, step functions, managed APIs) used for very high-volume work, which is exactly the Prime Video case.
- **The usual levers**: autoscaling to zero at night for internal tools, reserved or committed-use capacity for the steady baseline, spot or preemptible instances for interruptible batch work, caching, compression, storage tiers (hot, cool, archive), and deleting what nobody uses.

Many organisations run this as **FinOps**: engineering, finance and product share cost visibility and own their spend.

## SD2.12 Interview drill 🟢 ⭐

| Question | Strong short answer |
|---|---|
| How would you scale a web app from 1,000 to 1 million users? | Measure first, then climb in order: separate managed database with pooling, stateless servers behind a load balancer, cache and CDN, read replicas, queues for slow work, and only then partitioning or more regions. |
| Database CPU is at 90%. First steps? | Find the expensive queries (query store, slow log), fix indexes and N+1s, cache hot reads, move reads to replicas; scale the instance if needed; shard last. |
| What is connection pooling and why does autoscaling make it matter? | Reusing open connections; many instances each opening many connections can exceed the database limit, so size pools and use a pooler like PgBouncer. |
| What must change before running several app servers? | Remove server state: sessions to tokens or Redis, files to object storage, scheduled jobs to a single scheduler, WebSocket fan-out via a backplane. |
| Read replicas: benefit and catch? | They scale reads and isolate reporting; replication lag means users may not see their own writes. |
| When do you shard? | When writes or storage exceed one primary after query fixes, caching, replicas and vertical scaling; with a key that spreads load and keeps a request on one shard. |
| What makes a bad shard key? | Uneven load (hot shards) or queries that must hit every shard. |
| Liveness vs readiness checks? | Liveness: is the process alive, restart if not. Readiness: can it serve now, stop routing traffic if not. |
| How do you know the system survives launch? | Load, soak and spike tests on a production-like environment against modelled real traffic, plus capacity headroom and a rollback plan. |
| Active-passive vs active-active regions? | A standby that takes over on failure (cheaper, some downtime and data loss) vs both regions serving (fast failover and low latency, but write conflicts and cost). |
| Monolith or microservices at a million users? | Traffic doesn't decide it; a stateless monolith scales out. Split when teams need independent deployment or parts need very different scaling. |
| Why can queues hide a problem? | They move load, not remove it; if consumers are slower than producers the backlog grows until something fails, so watch queue age and apply backpressure. |
| Name three cloud cost leaks. | Idle oversized instances, data egress between regions or out of the cloud, and per-request pricing on very high-volume workloads. |

## Key takeaways

> [!check]
> - Scaling is a loop: measure, find the one bottleneck, fix it simply, repeat.
> - The ladder: one server → managed database + pooling → load balancer + stateless servers → cache, CDN, replicas → queues → partitioning/sharding → multiple regions.
> - Climb on signals (saturation, latency, failure risk), not on user-count rules.
> - Reads scale with caches and replicas; writes scale with partitioning, which is the expensive step.
> - Microservices solve team scaling; a modular monolith scales traffic a long way (Shopify, Stack Overflow).
> - Load-test against your known peaks, and know your unit cost.

## Sources

- Figma Engineering, [How Figma's databases team lived to tell the scale](https://www.figma.com/blog/how-figmas-databases-team-lived-to-tell-the-scale/) (March 2024).
- Nick Craver, [Stack Overflow: The Architecture – 2016 Edition](https://nickcraver.com/blog/2016/02/17/stack-overflow-the-architecture-2016-edition/); Stack Overflow, [Moving the public Stack Overflow sites to the cloud: Part 1](https://stackoverflow.blog/2025/08/28/moving-the-public-stack-overflow-sites-to-the-cloud-part-1/) (August 2025).
- Shopify Engineering, [Deconstructing the Monolith](https://shopify.engineering/deconstructing-monolith-designing-software-maximizes-developer-productivity) (2019) and [BFCM readiness 2025](https://shopify.engineering/bfcm-readiness-2025); Shopify, [Black Friday–Cyber Monday 2025 press release](https://www.shopify.com/investors/press-releases/shopify-merchants-achieve-record-breaking-146-billion-black).
- The Prime Video team's March 2023 post has since been taken down; contemporary reports with quotations: [DevClass](https://devclass.com/2023/05/05/reduce-costs-by-90-by-moving-from-microservices-to-monolith-amazon-internal-case-study-raises-eyebrows/), [The New Stack](https://thenewstack.io/return-of-the-monolith-amazon-dumps-microservices-for-video-monitoring/).
- AWS, [Summary of the Amazon DynamoDB service disruption in the Northern Virginia (US-EAST-1) Region](https://aws.amazon.com/message/101925/) (October 2025).
- Martin Fowler, [MonolithFirst](https://martinfowler.com/bliki/MonolithFirst.html) (2015).
- PostgreSQL documentation: [Connections and authentication (`max_connections`)](https://www.postgresql.org/docs/current/runtime-config-connection.html); [PgBouncer](https://www.pgbouncer.org/).
- AWS, [Disaster recovery options in the cloud](https://docs.aws.amazon.com/whitepapers/latest/disaster-recovery-workloads-on-aws/disaster-recovery-options-in-the-cloud.html); [FinOps Foundation](https://www.finops.org/introduction/what-is-finops/).
