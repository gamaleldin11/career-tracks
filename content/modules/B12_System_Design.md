# System Design — A Framework, the Building Blocks, and Worked Designs

At entry level, "system design" usually means "explain how your project is put together". At mid level it becomes "design a URL shortener / a notification system / a rate limiter" on a whiteboard in 45 minutes. In both cases interviewers score **structured thinking and trade-offs**, not memorised diagrams. This module gives you a repeatable framework, the building blocks with their trade-offs, back-of-the-envelope maths, and four worked designs, including one built on FinSight.

> [!focus]
> **Entry must:** describe your own system's architecture clearly; explain load balancers, caches, databases, queues and CDNs and why each exists; scale a simple web app from one server to several.
> **Mid adds:** a structured approach (requirements → estimates → API → data → high-level design → deep dives); replication and sharding; consistency trade-offs; designing for failure; classic problems (URL shortener, rate limiter, notifications, file storage).
> **Most asked:** *Design a URL shortener* · *How would you scale this to a million users?* · *Design a rate limiter* · *Design a notification system* · *SQL or NoSQL here?* · *What happens when this component fails?*
> **Time budget:** 4 hours, then one practice design every other day.

## B12.1 The framework (45 minutes) 🟢 ⭐

| Step | Time | What you do | Say things like |
|---|---|---|---|
| **1. Requirements** | 5–8 min | **Functional** (what it does) and **non-functional** (scale, latency, availability, consistency, security, cost); agree what's **out of scope** | "Do we need custom aliases? Analytics? How many URLs per day? Can a link expire?" |
| **2. Estimates** | 3–5 min | Rough traffic, storage and bandwidth; the read/write ratio | "About 100 writes per second and 10,000 reads, so it's read-heavy and caching matters" |
| **3. API** | 3–5 min | The main endpoints or messages | `POST /links`, `GET /{code}` → 301/302 |
| **4. Data model** | 5 min | Entities, keys, access patterns; SQL vs NoSQL | "Lookups are by short code only, so a key-value access pattern" |
| **5. High-level design** | 10 min | Boxes and arrows: clients, load balancer, services, cache, database, queue, workers | Walk one read and one write through it |
| **6. Deep dives** | 10–15 min | The hard parts: ID generation, hot keys, consistency, failure modes, scaling the bottleneck | "If Redis goes down, we fall back to the database and shed load" |
| **7. Wrap-up** | 2 min | Trade-offs, what you'd monitor, what you'd do next | "The main risk is hot links; I'd add a CDN in front" |

> [!say]
> "Before drawing anything, let me pin down the requirements and rough scale, because they decide almost every choice. Then I'll sketch the API and data model, draw the high-level design, and we can go deep on whichever part you're most interested in."

> [!mistake] Jumping to Kafka and Kubernetes
> Adding every technology you know, before knowing the scale, signals inexperience. Start simple, grow the design to the stated requirements, and justify each component by the problem it solves.

## B12.2 Back-of-the-envelope numbers 🟢 🟡 ⭐

**Handy conversions:**

- 1 day ≈ 86,400 s ≈ **10⁵ s** (round it).
- 1 million requests per day ≈ **12 requests per second** on average; plan for **peak ≈ 2–10× the average**.
- 1 billion per day ≈ 12,000 per second.

**Latency orders of magnitude** (approximate, to reason with):

| Operation | Rough time |
|---|---|
| Main-memory reference | ~100 ns |
| Read 1 MB sequentially from memory | ~tens of µs |
| SSD random read | ~100 µs |
| Round trip within a data centre | ~0.5 ms |
| Redis GET over the network | ~sub-ms to 1 ms |
| Simple indexed database query | ~1–10 ms |
| Read 1 MB from SSD | ~1 ms |
| Round trip Cairo ↔ Western Europe | ~50–80 ms |
| Round trip Cairo ↔ US West Coast | ~150–200 ms |

**Example:** 10 million new short links per month, each ~500 bytes with metadata → 5 GB per month → 60 GB per year → **300 GB over 5 years**: one database can hold that. Reads at 100:1 → ~400 reads per second average, a few thousand at peak: comfortable with a cache.

## B12.3 Building blocks and their trade-offs 🟢 🟡 ⭐

| Block | Why it exists | Key choices and trade-offs |
|---|---|---|
| **DNS / GeoDNS** | Route users to the nearest region | TTLs delay failover |
| **CDN** | Serve static (and cacheable dynamic) content near users | Freshness vs hit rate; purging |
| **Load balancer** | Spread traffic, remove unhealthy instances, terminate TLS | **L4** (TCP, fast) vs **L7** (HTTP-aware: routing by path or header); algorithms: round robin, least connections, consistent hashing; sticky sessions (avoid; keep servers stateless) |
| **Stateless app servers** | Scale horizontally behind the load balancer | Sessions and caches move to Redis or the database ([[S10.4]]) |
| **Cache** | Cut latency and database load | Invalidation, stampedes, consistency ([[B8.2]]) |
| **Relational database** | Integrity, transactions, flexible queries | Vertical scaling limit; **read replicas** (replication lag); **sharding** (cross-shard queries are hard) ([[B6.7]]) |
| **NoSQL store** | Massive scale on simple access patterns | Weaker query flexibility; data modelled per access pattern ([[B6.8]]) |
| **Object storage** (Blob, S3) | Files, images, backups, data lakes: cheap and durable | Not a filesystem; use pre-signed URLs for uploads and downloads |
| **Message queue / log** | Decouple, absorb spikes, async work | At-least-once delivery, ordering, idempotency ([[B8.4]]) |
| **Search index** | Full-text search, filtering, facets | Eventually consistent with the source of truth |
| **Workers / jobs** | Background processing | Retries, idempotency, monitoring |

> [!term] Consistent hashing
> A way to spread keys over N servers so that adding or removing a server moves only about 1/N of the keys, instead of nearly all of them as with `hash(key) % N`. Used by distributed caches, Cassandra and DynamoDB, and some load balancers.

> [!term] Replication
> Keeping copies of data on several nodes for availability and read scaling. **Leader–follower** (one node takes writes, followers replicate, usually asynchronously, which means **lag**) is the common model; multi-leader and leaderless designs trade simplicity for write availability.

**Consistency, briefly:** **strong** consistency means every read sees the latest write; **eventual** consistency means replicas converge if writes stop. Many systems mix them: strong for the account balance, eventual for the "followers" count. **CAP** says that under a network partition you choose consistency or availability; **PACELC** adds that *else*, in normal operation, you trade **latency vs consistency**.

## B12.4 Scaling a web app from one server to many 🟢 ⭐

This is the most common entry-level design question, often phrased as "how would FinSight handle 100× the users?":

1. **One server** running the app and the database. Simple; one failure takes everything down.
2. **Separate the database** onto its own (managed) server; back it up.
3. **Several stateless app servers** behind a **load balancer**; sessions in Redis or tokens; health checks.
4. **Cache** hot reads (Redis); **CDN** for static assets.
5. **Read replicas** for read-heavy traffic; route reports and dashboards to them.
6. **Move slow work to queues and workers** (forecasting, emails, imports).
7. **Split the data** when one database can't keep up: partition big tables, then shard by tenant.
8. **Multiple regions** for latency and disaster recovery, with failover.
9. Throughout: **monitoring**, autoscaling, and load tests to find the next bottleneck.

## B12.5 Worked design 1: URL shortener 🟡 ⭐

**Requirements.** Create a short link for a long URL; redirect quickly; optional custom alias and expiry; basic click counts. Non-functional: 100 M new links per month, 100:1 read:write ratio, redirect p99 < 50 ms within region, highly available reads, links never collide.

**Estimates.** ~40 writes/s average; ~4,000 reads/s average, maybe 20,000 at peak. Storage: 100 M × 500 B ≈ 50 GB per month, ≈ 3 TB over 5 years.

**API.** `POST /api/links {url, alias?, expiresAt?}` → `201 {code, shortUrl}`; `GET /{code}` → **302** (or 301) with `Location`.

> [!note] 301 or 302?
> **301** (permanent) lets browsers cache the redirect, which means less load but no click counting after the first visit. **302** (temporary) sends every click through you, which is needed for analytics. Many shorteners use 302 for that reason.

**Data model.** `links(code PK, long_url, owner_id, created_at, expires_at)`; `clicks` aggregated asynchronously. The access pattern is a key-value lookup by `code`, so either a relational table with a primary key on `code`, or a key-value store, works. 3 TB argues for sharding by `code` eventually, or a NoSQL store such as DynamoDB or Cassandra.

**Generating codes (the main deep dive):**

| Approach | How | Pros | Cons |
|---|---|---|---|
| Hash the URL (MD5/SHA → first 7 chars of Base62) | Deterministic | Same URL → same code | Collisions must be detected and retried |
| **Counter + Base62** | A unique 64-bit ID (database sequence, or a range of IDs handed out to each server, or Snowflake-style IDs) encoded in Base62 | No collisions; short | Sequential codes are guessable (shuffle or encrypt the ID if that matters) |
| Random 7-char Base62 | Random | Unpredictable | Check for collisions on insert (a unique constraint) |

Base62 with 7 characters gives 62⁷ ≈ **3.5 trillion** codes, plenty.

**High-level design.**

<figure class="dia"><svg viewBox="0 0 720 230" role="img" aria-label="URL shortener: clients, CDN, load balancer, API, cache, database, click queue, analytics workers">
<rect class="sB" x="10" y="95" width="80" height="40" rx="8"/><text class="sT" x="50" y="120" text-anchor="middle">Users</text>
<rect class="sB" x="110" y="95" width="70" height="40" rx="8"/><text class="sT" x="145" y="120" text-anchor="middle">CDN</text>
<rect class="sA" x="200" y="95" width="80" height="40" rx="8"/><text class="sT" x="240" y="120" text-anchor="middle">LB</text>
<rect class="sA" x="300" y="80" width="120" height="70" rx="8"/><text class="sT" x="360" y="110" text-anchor="middle">Link API</text><text class="sS" x="360" y="128" text-anchor="middle">(stateless × N)</text>
<rect class="sG" x="470" y="20" width="110" height="44" rx="8"/><text class="sT" x="525" y="47" text-anchor="middle">Redis cache</text>
<rect class="sG" x="470" y="93" width="110" height="44" rx="8"/><text class="sT" x="525" y="120" text-anchor="middle">Links DB</text>
<rect class="sW" x="470" y="166" width="110" height="44" rx="8"/><text class="sT" x="525" y="193" text-anchor="middle">Click queue</text>
<rect class="sB" x="610" y="166" width="100" height="44" rx="8"/><text class="sT" x="660" y="193" text-anchor="middle">Analytics</text>
<line class="sL" x1="90" y1="115" x2="110" y2="115"/><line class="sL" x1="180" y1="115" x2="200" y2="115"/><line class="sL" x1="280" y1="115" x2="300" y2="115"/>
<line class="sL" x1="420" y1="100" x2="470" y2="42"/><line class="sL" x1="420" y1="115" x2="470" y2="115"/><line class="sD" x1="420" y1="135" x2="470" y2="188"/><line class="sD" x1="580" y1="188" x2="610" y2="188"/>
</svg><figcaption>Redirects are served from cache, falling back to the database; clicks are recorded asynchronously so they never slow the redirect.</figcaption></figure>

**Deep dives to offer:** cache-aside with long TTLs (links rarely change) and cache warming for viral links; a **hot key** (one link going viral) handled by the CDN caching 301s or in-process caching; recording clicks **asynchronously** through a queue so the redirect path stays fast; expiry with a TTL index or a cleanup job; abuse prevention (rate limiting creation, scanning destination URLs for malware); custom aliases with a unique constraint.

## B12.6 Worked design 2: rate limiter 🟡 ⭐

**Requirements.** Limit each API key or user to N requests per window (e.g. 100 per minute), across many API instances; low overhead; return 429 with `Retry-After`.

| Algorithm | How | Pros | Cons |
|---|---|---|---|
| **Fixed window** | Count per calendar minute | Simple, cheap | A burst at the window edge allows up to 2N |
| **Sliding window log** | Store each request's timestamp; count those in the last 60 s | Accurate | Memory per request |
| **Sliding window counter** | Weighted mix of the current and previous fixed windows | Accurate enough, cheap | Approximate |
| **Token bucket** | Tokens refill at a steady rate up to a capacity; each request takes one | Allows controlled bursts; the most common | Two values per key |
| **Leaky bucket** | Requests queue and drain at a fixed rate | Smooth output | Queues add latency |

**Distributed design:** counters in **Redis** (atomic `INCR` with `EXPIRE`, or a Lua script for a token bucket) so all instances share them; the limiter runs in an API gateway or middleware ([[B3.11]]); fail **open** (allow) or **closed** (deny) if Redis is unavailable, which is a business decision; return `429` with `Retry-After` and rate-limit headers.

## B12.7 Worked design 3: notification system 🟡 ⭐

**Requirements.** Send email, SMS and push notifications triggered by events (invoice due, payment received, forecast alert); user preferences and quiet hours; templates in English and Arabic; retries; no duplicates; delivery tracking; up to ~1 M notifications per day with bursts.

**Design:**

1. Domain services publish **events** (`InvoiceOverdue`) through the **outbox** ([[B8.7]]).
2. A **notification service** consumes events, checks **preferences** (channel, opt-outs, quiet hours, language), renders **templates**, and enqueues one message per channel.
3. **Channel workers** (email, SMS, push) call providers (SendGrid or SES, an SMS gateway, Firebase Cloud Messaging) with **retries, backoff and circuit breakers**, and per-provider rate limits.
4. **Idempotency:** a deduplication key (`event ID + user + channel`) stored before sending, so redelivered events don't send twice.
5. **Tracking:** a `notifications` table with status (queued, sent, delivered, failed) updated from provider callbacks; a **dead-letter queue** for permanent failures.
6. **Priorities:** separate queues so a password-reset OTP isn't stuck behind 100,000 marketing emails.

## B12.8 Worked design 4: FinSight at scale (multi-tenant SaaS) 🟡 ⭐

"FinSight now has 5,000 companies. Some upload 200,000 transactions a month. Design it."

- **Tenancy:** shared database with `CompanyId` and global query filters for small tenants; the option to move large tenants to their own database (hybrid, [[B9.8]]), routed by a tenant catalogue.
- **Ingestion:** CSV uploads go **directly to Blob Storage** (pre-signed URL); an `UploadReceived` message triggers an **import worker** that parses, validates and categorises in batches, writes with bulk operations, and reports per-row errors.
- **Aggregation:** the daily aggregation runs as part of the import (incremental, only affected days), not a full recompute.
- **Forecasting:** a separate **forecasting service** consuming `TransactionsChanged` events, deduplicated per tenant per day (no need to re-forecast after every upload), calling TimeGPT with resilience; results cached per tenant.
- **Reads:** dashboards from the aggregate tables and a per-tenant Redis cache invalidated by events; reports from a **read replica**.
- **AI assistant:** retrieval through the authenticated API (as now), with **per-tenant rate limits and token budgets** to control LLM cost.
- **Noisy neighbours:** per-tenant queue partitions or concurrency limits, so one large import can't delay everyone.
- **Observability:** traces across API, workers and TimeGPT; SLOs on dashboard latency and import completion time.

> [!story]
> This is your own system scaled up. Telling it this way (what exists today, which bottleneck appears first at 100×, and what you'd change in order) is far more convincing than a generic design you memorised.

## B12.9 More problems to practise 🟡

| Problem | The core challenge to discuss |
|---|---|
| Pastebin / file sharing | Object storage, pre-signed URLs, expiry, access control |
| Chat (WhatsApp-lite) | WebSockets at scale, presence, message ordering and delivery receipts, offline delivery |
| News feed | Fan-out on write vs on read, hot users, ranking, caching |
| E-commerce checkout | Inventory reservation, payment idempotency, sagas, oversell prevention |
| Ride-hailing (Uber/Careem-like) | Geospatial indexing, location updates at high frequency, matching |
| Food-delivery tracking | Real-time location, ETAs, order state machine |
| Payment ledger / wallet | Double-entry bookkeeping, exactly-once effects via idempotency, reconciliation, audit |
| Distributed job scheduler | Leader election, at-least-once execution, idempotent jobs |

> [!lab] Practise out loud, against the clock
> Pick one problem every other day. Set a 45-minute timer, talk through the framework aloud (record yourself), draw on paper or Excalidraw, then compare with a good write-up (the sources below) and note what you missed. Five of these and the framework becomes automatic.

## B12.10 Interview drill 🟢 ⭐

| Question | Strong short answer |
|---|---|
| How do you start a system design question? | Clarify functional and non-functional requirements and scale, estimate, then API, data model, high-level design and deep dives. |
| Horizontal vs vertical scaling? | Adding machines behind a load balancer vs a bigger machine; horizontal needs stateless servers. |
| L4 vs L7 load balancer? | L4 balances TCP connections; L7 understands HTTP and can route by path, header or cookie. |
| Why must app servers be stateless? | So any instance can serve any request, enabling scaling, rolling deploys and failover. |
| Read replicas: what's the catch? | Replication lag: a user may not see their own write; route read-your-writes to the primary. |
| What is sharding and its main risk? | Splitting data across databases by a shard key; a bad key causes hot shards, and cross-shard queries and transactions get hard. |
| What is consistent hashing? | Mapping keys to nodes so that adding or removing a node moves only a fraction of keys. |
| Strong vs eventual consistency? | Every read sees the latest write vs replicas converge over time; choose per data type. |
| How would you generate short codes? | A unique ID (sequence ranges or Snowflake-style) encoded in Base62, or random codes with a uniqueness check. |
| Which rate-limiting algorithm would you pick? | A token bucket in Redis for controlled bursts across instances, returning 429 with Retry-After. |
| How do you avoid duplicate notifications? | A deduplication key per event, user and channel, checked before sending; idempotent consumers. |
| How many requests per second is 1 million per day? | About 12 on average; plan for peaks several times higher. |
| What would you monitor in your design? | RED metrics per service, queue depth and age, cache hit rate, database latency, and SLOs on user-facing paths. |

## Key takeaways

> [!check]
> - Requirements and scale first; every component must solve a stated problem.
> - Know the building blocks' trade-offs: load balancers, caches, replicas, shards, queues, object storage, CDNs.
> - Estimate quickly: 1 M per day ≈ 12 per second; read:write ratios drive caching.
> - Go deep on the hard part: ID generation, hot keys, consistency, failure modes.
> - Practise on your own systems (FinSight at 100×) as well as the classics.

## Sources

- Martin Kleppmann, *Designing Data-Intensive Applications* (O'Reilly, 2017).
- Alex Xu, *System Design Interview: An Insider's Guide*, volumes 1 and 2 (2020, 2022): URL shortener, rate limiter, notification system, chat, news feed.
- [The System Design Primer](https://github.com/donnemartin/system-design-primer) (open source).
- Microsoft Learn: [Azure Architecture Center](https://learn.microsoft.com/en-us/azure/architecture/), [Cloud design patterns](https://learn.microsoft.com/en-us/azure/architecture/patterns/), [Rate limiting pattern](https://learn.microsoft.com/en-us/azure/architecture/patterns/rate-limiting-pattern).
- Jeff Dean, "Latency numbers every programmer should know" (rough figures; see the interactive versions online for updated values).
- Daniel Abadi, "Consistency Tradeoffs in Modern Distributed Database System Design" (*IEEE Computer*, 2012), on PACELC.
