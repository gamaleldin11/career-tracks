# Reliability and Distributed-System Patterns — Keeping It Up When Parts Fail

At scale, something is always broken: a disk, a server, a network link, a dependency, a bad deploy. Reliable systems aren't the ones where nothing fails; they are the ones where **a failure stays small, is noticed quickly and is recovered from safely**. This module covers the patterns that make that true: timeouts, retries and idempotency; protecting a system under overload; replication and partitioning in depth; limiting the blast radius; backups and disaster recovery; consistency across services; and the observability that tells you what is happening. It builds on [[SD1]] and [[SD2]]; the .NET implementation of many of these patterns is in [[B11]].

> [!focus]
> **Entry must:** explain timeouts, retries with backoff, idempotency and why "exactly once" is hard; describe RPO and RTO and why untested backups don't count; name the metrics you'd watch.
> **Mid adds:** circuit breakers, bulkheads, rate limiting, load shedding and graceful degradation; leader–follower replication and quorums; hash vs range partitioning and hot keys; outbox and sagas instead of distributed transactions; staged rollouts and blast-radius thinking.
> **Most asked:** *What happens when this dependency is down?* · *How do you avoid charging a customer twice?* · *Retry storms: what are they?* · *What is a circuit breaker?* · *How would you do a transaction across two services?* · *What are your RPO and RTO?*
> **Time budget:** 3–4 hours.

## SD4.1 Design for failure 🟢 ⭐

Start every design review by asking "what fails, and then what?" for each box and arrow.

| What fails | How it shows up | The usual defence |
|---|---|---|
| A server or container | Requests to it error or hang | Several instances, health checks, automatic replacement ([[SD2.4]]) |
| A whole availability zone | A data centre loses power or network | Spread instances and database replicas across zones |
| A dependency (payment gateway, LLM API, another team's service) | Slow responses, errors, rate limiting | Timeouts, retries with backoff, circuit breakers, fallbacks |
| The database primary | Writes fail for seconds to minutes | Automatic failover to a standby; retries in the app |
| A bad deploy or bad configuration | Errors right after a change | Staged rollouts, health-gated deploys, fast rollback, feature flags |
| A traffic spike | Latency climbs, queues grow, timeouts cascade | Autoscaling, caching, rate limiting, load shedding |
| Data corruption or deletion | Wrong data, quietly replicated everywhere | Point-in-time backups, soft deletes, audit logs |
| A region, or a provider | Everything in it is unreachable | Multi-region or multi-provider designs, if the business needs them ([[SD2.9]]) |

> [!term] Single point of failure (SPOF)
> Any component whose failure takes the whole system down: one database without a standby, one load balancer, one engineer who knows how to deploy, one expired TLS certificate. Finding SPOFs is a standard interview move.

> [!term] Blast radius
> How much of the system and how many users one failure affects. Good designs keep it small: one tenant, one zone, one cell, one percent of users during a rollout.

## SD4.2 Timeouts and retries — and how retries cause outages 🟢 ⭐

**Every network call needs a timeout.** Without one, a slow dependency ties up your threads and connections until your own service stops responding, and the failure spreads upstream. Set timeouts from the dependency's real latency (a little above its p99), and make sure the total of nested timeouts fits inside the caller's own timeout.

**Retries fix transient failures** (a dropped connection, a brief failover), but only when done carefully:

- Retry only errors that may succeed next time (timeouts, 503, 429), not a 400 or a validation failure.
- Retry only **idempotent** operations, or make them idempotent first ([[SD4.3]]).
- Use **exponential backoff with jitter**: wait roughly 100 ms, 200 ms, 400 ms… with a random spread, and give up after a few attempts.
- Retry at **one** layer. If the client, the gateway and three services each retry 3 times, one failing call at the bottom becomes 3⁵ = 243 attempts.

> [!term] Retry storm
> When a dependency slows down, every caller retries at once, multiplying the load on the thing that is already struggling, so it never recovers. Backoff, jitter, retry budgets (for example "retries may add at most 10% extra load") and circuit breakers prevent it.

> [!say]
> "Every remote call gets a timeout based on the dependency's real latency. I retry only transient errors on idempotent operations, with exponential backoff and jitter, at one layer only, so a struggling dependency isn't hit by a retry storm."

## SD4.3 Idempotency: doing it once, even when it happens twice 🟢 ⭐

Networks lose responses, users double-tap, queues redeliver, and retries resend. So **the same request will sometimes arrive twice**. An operation is **idempotent** if doing it twice has the same effect as doing it once.

| Naturally idempotent | Not idempotent until you make it so |
|---|---|
| `PUT /users/7 {name: "Mona"}`; `DELETE /orders/9`; "set status to Shipped" | `POST /payments`; "add 100 EGP to the balance"; "send the welcome email" |

**How to make a write idempotent:**

1. The client generates an **idempotency key** (a UUID) per logical operation and sends it with every attempt; Stripe's API popularised the `Idempotency-Key` header.
2. The server stores the key with the result, under a unique constraint, in the same transaction as the write.
3. A repeat with the same key returns the stored result instead of acting again.

For message consumers, the same idea: keep the IDs of processed messages (or design the update so applying it twice changes nothing, such as "set" rather than "add").

> [!term] Exactly-once delivery
> In a distributed system you can't guarantee a message is *delivered* exactly once; you choose at-most-once (may lose it) or at-least-once (may duplicate it). What you can build is **exactly-once effect**: at-least-once delivery plus idempotent processing. Kafka's "exactly-once semantics" are this idea applied within Kafka's own read-process-write cycle.

> [!mistake] Disabling the Pay button as the only protection
> A disabled button stops one double-click in one browser. It doesn't stop a retry after a timeout, a second tab, a mobile app resending on reconnect, or a gateway retry. The server must be idempotent.

## SD4.4 Protecting a system under overload 🟡 ⭐

When demand exceeds capacity, something has to give. Choose *what* gives, instead of letting everything slow down together.

| Pattern | What it does | Example |
|---|---|---|
| **Rate limiting** | Caps requests per client per time window; returns 429 with `Retry-After` | 100 requests a minute per API key ([[B12.6]]) |
| **Backpressure** | Slows producers when consumers can't keep up | A bounded queue that rejects or blocks new work when full |
| **Load shedding** | Rejects some requests early and cheaply so the rest succeed | Drop analytics calls and keep checkout when CPU passes 90% |
| **Circuit breaker** | After repeated failures, stops calling a dependency for a while and fails fast; probes it, then closes again | Stop calling a failing SMS gateway for 30 s; queue the messages instead |
| **Bulkhead** | Separates resources (thread pools, connection pools, queues) per dependency or tenant, so one can't exhaust them all | The slow reporting endpoint gets its own small pool; checkout keeps its own |
| **Graceful degradation** | Serves a reduced but useful experience | Show cached recommendations, or none, when the recommender is down; hide the "live stock" badge |

> [!term] Circuit breaker
> A wrapper around calls to a dependency with three states: **closed** (calls pass through; failures are counted), **open** (calls fail immediately without being attempted, giving the dependency time to recover), and **half-open** (a few trial calls decide whether to close again). Described by Michael Nygard in *Release It!* (2007); implemented in .NET by Polly and `Microsoft.Extensions.Http.Resilience` ([[B11]]).

<figure class="dia"><svg viewBox="0 0 720 200" role="img" aria-label="Circuit breaker state machine: closed, open, half-open">
<rect class="sG" x="10" y="50" width="160" height="56" rx="10"/><text class="sT" x="90" y="74" text-anchor="middle">CLOSED</text><text class="sS" x="90" y="92" text-anchor="middle">calls pass, count failures</text>
<rect class="sR" x="280" y="50" width="160" height="56" rx="10"/><text class="sT" x="360" y="74" text-anchor="middle">OPEN</text><text class="sS" x="360" y="92" text-anchor="middle">fail fast, don't call</text>
<rect class="sW" x="550" y="50" width="160" height="56" rx="10"/><text class="sT" x="630" y="74" text-anchor="middle">HALF-OPEN</text><text class="sS" x="630" y="92" text-anchor="middle">a few trial calls</text>
<line class="sL" x1="170" y1="66" x2="280" y2="66"/><text class="sM" x="225" y="40" text-anchor="middle">too many failures</text>
<line class="sL" x1="440" y1="66" x2="550" y2="66"/><text class="sM" x="495" y="40" text-anchor="middle">after cool-down</text>
<line class="sD" x1="550" y1="92" x2="440" y2="92"/><text class="sM" x="495" y="124" text-anchor="middle">trial fails</text>
<path class="sL" d="M630 106 C630 175 90 175 90 106"/><text class="sM" x="360" y="192" text-anchor="middle">trial calls succeed → closed again</text>
</svg><figcaption>A circuit breaker turns a slow, failing dependency into a fast, predictable failure, and gives it room to recover.</figcaption></figure>

## SD4.5 Replication in depth 🟡

Replication keeps copies of data on several nodes, for **availability** (survive a node failing), **read scale** and **lower latency** (a copy near the user).

| Model | How writes work | Strengths | Weaknesses |
|---|---|---|---|
| **Leader–follower** (primary–replica) | One leader takes writes; followers copy its log | Simple; the common default for relational databases | Leader is a write bottleneck; failover must elect a new leader; async followers lag |
| **Multi-leader** | Several leaders (often one per region) accept writes and sync | Local writes in each region; survives a region | **Write conflicts** must be resolved (last-write-wins loses data; merge logic is hard) |
| **Leaderless** (Dynamo-style: Cassandra, ScyllaDB, Riak) | Clients write to and read from several replicas | Highly available writes; no failover step | Tunable but weaker consistency; conflicts and repair |

**Synchronous vs asynchronous replication.** Synchronous: the write waits until a replica confirms, so no committed data is lost if the leader dies, but every write is slower and a slow replica stalls writes. Asynchronous: fast, but the last moments of writes can be lost on failover. Many systems use one synchronous standby plus asynchronous read replicas.

> [!term] Quorum
> In a leaderless store with N copies, a write waits for W acknowledgements and a read asks R replicas. If **W + R > N**, every read overlaps at least one replica with the latest write. With N = 3, W = 2, R = 2 the store tolerates one node down for both reads and writes. Described in Amazon's 2007 Dynamo paper.

## SD4.6 Partitioning in depth: keys, consistent hashing and hot spots 🟡

| Strategy | How rows are assigned | Good for | Risk |
|---|---|---|---|
| **Range** | Contiguous key ranges per partition (A–F, G–M… or by date) | Range scans ("orders in March") | Hot partitions: all of today's writes land on one partition |
| **Hash** | `hash(key)` decides the partition | Even spread | Range queries hit every partition |
| **Directory / lookup** | A table maps each key (tenant) to a partition | Moving one big tenant to its own database | The directory is a dependency to keep fast and available |

> [!term] Consistent hashing
> Keys and nodes are placed on the same hash ring; each key belongs to the next node clockwise. Adding or removing a node moves only the keys next to it, about 1/N of them, instead of reshuffling almost everything as `hash(key) % N` does. "Virtual nodes" (many points per server) even out the spread. Introduced by Karger and colleagues in 1997; used by Dynamo-style stores, distributed caches and some load balancers.

**Hot keys** (one celebrity's profile, one viral link, one huge tenant) defeat even a perfect partitioning scheme, because all requests for one key go to one place. Defences: cache the hot key in many places (CDN, in-process), split it (append a small random suffix and aggregate on read for counters), or give that tenant dedicated capacity.

## SD4.7 Limiting the blast radius 🟡 ⭐

The biggest outages of recent years were not caused by too little hardware. They were caused by **one change reaching everything at once**.

> [!sota] Three outages and the lessons they share
> - **CrowdStrike, 19 July 2024.** A faulty content-configuration update to the Falcon security sensor was pushed to Windows machines worldwide at once and crashed them on boot; Microsoft estimated **8.5 million** devices were affected, grounding flights and disrupting hospitals and banks. Lesson: even "just configuration" needs staged rollout and the ability to stop it.
> - **AWS us-east-1, 19–20 October 2025.** A race condition in the automation that manages DynamoDB's DNS left its regional endpoint with an empty record; internal systems that depend on DynamoDB (EC2 launches, Network Load Balancer health checks) failed in turn, with customer impact spread over about 14 hours. AWS disabled that automation worldwide and added safeguards. Lesson: hidden dependencies make failures cascade; know what your critical path depends on.
> - **Cloudflare, 18 November 2025.** A database permissions change made a query return duplicate rows, which doubled the size of a Bot Management feature file. The core proxy had a hard limit of 200 features, panicked on the oversized file, and returned errors for about three hours across a large share of the web. Cloudflare's fixes included treating internally generated configuration files as untrusted input and adding more global kill switches. Lesson: validate configuration like code, and fail safe rather than crash.

The defences:

- **Staged (canary) rollouts** for code *and* configuration: 1% of servers or users, then 10%, then everyone, with automatic halt on rising errors.
- **Blue-green deployments** (switch traffic to a new copy, switch back instantly) and fast **rollback**.
- **Feature flags** and **kill switches**: turn a feature off without deploying.
- **Availability zones and regions**: spread redundancy so failures are independent.
- **Cell-based architecture**: split the system into many identical, isolated copies ("cells"), each serving a subset of customers, so a failure or bad deploy hits one cell. AWS documents this pattern in its well-architected guidance; Shopify's "pods" ([[SD2.8]]) are a version of it.
- **Chaos engineering**: deliberately inject failures in a controlled way to prove the system copes (Netflix's Chaos Monkey, 2011, randomly terminated production instances).

## SD4.8 Backups and disaster recovery 🟢 ⭐

> [!term] RPO and RTO
> **Recovery Point Objective**: the maximum data loss you accept, measured in time (an RPO of 5 minutes means you may lose the last 5 minutes of writes). **Recovery Time Objective**: the maximum time to be back in service. Both are business decisions; lower numbers cost more.

| Approach | Typical RPO | Typical RTO | Cost |
|---|---|---|---|
| Nightly backups | Up to 24 hours | Hours | Low |
| Continuous backups with point-in-time restore | Minutes | An hour or so (restore time grows with size) | Low to moderate |
| Standby replica in another zone, automatic failover | Seconds | Minutes | Moderate |
| Warm standby in another region | Seconds to minutes | Minutes to an hour | High |
| Active-active across regions | Near zero | Near zero | Highest |

Rules that matter more than the table:

- **A backup you have never restored is not a backup.** Schedule restore drills and time them; the measured time *is* your RTO.
- **Replication is not a backup.** Accidental deletes and corruption replicate too. You need point-in-time copies.
- Keep at least one copy **isolated** (another account or region, immutable or write-once storage) so ransomware or a compromised admin account can't delete everything (the "3-2-1" rule: three copies, two media, one off-site).

## SD4.9 Consistency across services: outbox and sagas 🟡 ⭐

Inside one database, a transaction keeps several changes all-or-nothing. Across two services or a database plus a message broker, there is no shared transaction.

**Why not a distributed transaction (two-phase commit)?** 2PC exists, but it holds locks across services while a coordinator waits, blocks if the coordinator fails, and most brokers and cloud services don't support it. Modern designs avoid it.

- **Transactional outbox** ([[B8.7]]): write the business change and an "event to publish" row in the **same** local transaction; a relay publishes the row afterwards. Nothing is lost if the app crashes between the two.
- **Saga**: a long business process split into local transactions, each with a **compensating action** that undoes it if a later step fails.

| Step | Action | Compensation if a later step fails |
|---|---|---|
| 1 | Create order (Pending) | Cancel order |
| 2 | Reserve stock | Release stock |
| 3 | Charge payment | Refund payment |
| 4 | Confirm order | — |

Sagas are coordinated either by **choreography** (each service reacts to the previous service's events; simple for a few steps, hard to follow for many) or **orchestration** (one coordinator tells each service what to do next, with durable state; workflow engines such as Temporal, AWS Step Functions and Azure Durable Functions provide this).

> [!say]
> "I avoid distributed transactions. Each service commits locally and publishes events through an outbox; a multi-step process like checkout runs as a saga with compensating actions, orchestrated if it has more than a few steps, and every step is idempotent because messages can arrive twice."

## SD4.10 Observability and SLOs in production 🟢 ⭐

You can't fix what you can't see. The three signal types ([[B11]] has the .NET and OpenTelemetry details):

| Signal | Answers | Example |
|---|---|---|
| **Metrics** | Is something wrong, and how much? | Error rate 4%, p99 latency 1.8 s, queue age 12 min |
| **Logs** | What exactly happened in this case? | A structured log with the order ID and the exception |
| **Traces** | Where did the time go across services? | 1.6 s of 1.8 s spent waiting on the payment gateway |

What to watch:

- **Google's four golden signals** for user-facing services: **latency, traffic, errors, saturation**.
- **RED** per service (Rate, Errors, Duration) and **USE** per resource (Utilisation, Saturation, Errors).
- For asynchronous work: **queue depth, age of the oldest message, dead-letter count**.
- **Alert on symptoms users feel** (SLO burn: errors and latency against the objective), not on every CPU spike; page a human only for what needs a human now.

After an incident, run a **blameless postmortem**: timeline, impact, root causes, and actions that change the system, not the person.

## SD4.11 Security by design 🟢

Security is part of the design, not a layer added at the end ([[S9]] covers the OWASP Top 10).

- **At the edge:** TLS everywhere, a WAF and DDoS protection (usually from the CDN), rate limits on login and sign-up.
- **Identity:** authenticate once at the edge or gateway, authorise in every service (never trust a request just because it is "internal"), short-lived tokens, least-privilege service identities (managed identities rather than passwords in config).
- **Data:** encrypt in transit and at rest, classify personal data, keep secrets in a vault (Azure Key Vault, AWS Secrets Manager), and isolate tenants in queries, caches and storage paths.
- **Supply chain:** pin and scan dependencies and container images; OWASP's 2025 Top 10 added software supply-chain failures as a category.
- **Auditability:** who changed what, when, for anything involving money, health or personal data.

## SD4.12 Interview drill 🟢 ⭐

| Question | Strong short answer |
|---|---|
| Why does every remote call need a timeout? | Without one, a slow dependency holds threads and connections until your service stops responding and the failure spreads upstream. |
| How should retries be done? | Only for transient errors on idempotent operations, with exponential backoff and jitter, a small limit, at one layer. |
| What is a retry storm? | Callers retrying a struggling dependency all at once, multiplying its load so it can't recover. |
| How do you stop a customer being charged twice? | An idempotency key per payment attempt, stored with the result under a unique constraint, so repeats return the first result. |
| Is exactly-once delivery possible? | Not as delivery; you get exactly-once effect with at-least-once delivery plus idempotent processing. |
| What is a circuit breaker? | A wrapper that stops calling a failing dependency for a while and fails fast, then tests it with trial calls before resuming. |
| Bulkhead? | Separate resource pools per dependency or tenant so one slow part can't exhaust everything. |
| Load shedding vs rate limiting? | Rate limiting caps each client; load shedding drops low-priority work globally when the system is overloaded. |
| Leader–follower replication: main risk? | Asynchronous followers lag, so failover can lose recent writes and reads can be stale. |
| What does W + R > N guarantee? | Every read quorum overlaps a write quorum, so reads see the latest acknowledged write. |
| Why consistent hashing? | Adding or removing a node moves only about 1/N of the keys. |
| How do you handle a hot key? | Cache it widely, split it with suffixes and aggregate, or give it dedicated capacity. |
| RPO vs RTO? | RPO is how much data you may lose; RTO is how long you may be down. |
| Is replication a backup? | No: deletions and corruption replicate too; you need point-in-time, isolated backups that you test. |
| How do you keep data consistent across services? | Local transactions with an outbox, and sagas with compensating actions for multi-step processes. |
| What did the 2024–2025 big outages have in common? | One change or one hidden dependency reached everything at once; staged rollouts, validation of configuration and kill switches limit the blast radius. |
| What would you alert on? | User-facing symptoms against SLOs: error rate and latency, plus queue age for async work. |

## Key takeaways

> [!check]
> - Ask "what fails, and then what?" for every component; remove single points of failure.
> - Timeouts on every call; retries only with backoff, jitter, limits and idempotency.
> - Idempotency keys turn at-least-once delivery into exactly-once effect.
> - Under overload, choose what gives: rate limits, load shedding, circuit breakers, bulkheads, graceful degradation.
> - Replication buys availability and reads; partitioning buys write scale; hot keys need their own answer.
> - Limit the blast radius: staged rollouts for code and configuration, kill switches, zones, cells.
> - Untested backups don't count; replication isn't a backup; set RPO and RTO with the business.
> - Across services, use outbox and sagas, not distributed transactions.

## Sources

- AWS Builders' Library, [Timeouts, retries, and backoff with jitter](https://aws.amazon.com/builders-library/timeouts-retries-and-backoff-with-jitter/) and [Making retries safe with idempotent APIs](https://aws.amazon.com/builders-library/making-retries-safe-with-idempotent-APIs/).
- Stripe API reference, [Idempotent requests](https://docs.stripe.com/api/idempotent_requests).
- Michael Nygard, *Release It!* (Pragmatic Bookshelf, 2nd ed. 2018); Microsoft, [Circuit Breaker pattern](https://learn.microsoft.com/en-us/azure/architecture/patterns/circuit-breaker), [Bulkhead pattern](https://learn.microsoft.com/en-us/azure/architecture/patterns/bulkhead), [Saga pattern](https://learn.microsoft.com/en-us/azure/architecture/patterns/saga), [Transactional Outbox](https://learn.microsoft.com/en-us/azure/architecture/databases/guide/transactional-outbox-cosmos).
- Giuseppe DeCandia et al., "Dynamo: Amazon's Highly Available Key-value Store" (SOSP 2007); David Karger et al., "Consistent Hashing and Random Trees" (STOC 1997); Martin Kleppmann, *Designing Data-Intensive Applications*, chapters 5–9.
- Cloudflare, [Cloudflare outage on November 18, 2025](https://blog.cloudflare.com/18-november-2025-outage/); AWS, [Summary of the Amazon DynamoDB service disruption](https://aws.amazon.com/message/101925/) (October 2025); Microsoft, [Helping our customers through the CrowdStrike outage](https://blogs.microsoft.com/blog/2024/07/20/helping-our-customers-through-the-crowdstrike-outage/) (July 2024).
- AWS, [Reducing the scope of impact with cell-based architecture](https://docs.aws.amazon.com/wellarchitected/latest/reducing-scope-of-impact-with-cell-based-architecture/reducing-scope-of-impact-with-cell-based-architecture.html).
- Google, *Site Reliability Engineering*: [Monitoring distributed systems (the four golden signals)](https://sre.google/sre-book/monitoring-distributed-systems/) and [Postmortem culture](https://sre.google/sre-book/postmortem-culture/).
- [OWASP Top 10:2025](https://owasp.org/Top10/2025/0x00_2025-Introduction/).
