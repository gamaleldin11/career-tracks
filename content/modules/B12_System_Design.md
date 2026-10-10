# System Design — A Framework, the Building Blocks, and Worked Designs

At entry level, "system design" usually means "explain how your project is put together". At mid level it becomes "design a URL shortener / a notification system / a rate limiter" on a whiteboard in 45 minutes. In both cases interviewers score **structured thinking and trade-offs**, not memorised diagrams. This module gives you a repeatable framework, the building blocks with their trade-offs, back-of-the-envelope maths, and four worked designs, including one built on FinSight. It is the backend workout for the shared system-design series: [[SD1]] explains the fundamentals, [[SD2]] scaling in production, [[SD3]] how to choose technologies, and [[SD4]] reliability patterns in more depth.

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

<figure class="dia steps"><svg viewBox="0 0 720 248" role="img" aria-label="Estimation chain for a URL shortener: 10 million links a month times 500 bytes is 5 gigabytes a month, 60 a year and 300 over five years; 1 billion reads a month is about 386 reads per second on average and about 770 to 3,900 at peak">
<text class="sT" x="14" y="22">storage</text>
<rect class="sN" x="14" y="32" width="150" height="50" rx="8"/><text class="sS" x="89" y="52" text-anchor="middle">new links per month</text><text class="sT" x="89" y="72" text-anchor="middle">10,000,000</text>
<g data-s="1"><line class="sLm" x1="166" y1="57" x2="220" y2="57" marker-end="url(#ahm)"/><text class="sS" x="193" y="51" text-anchor="middle">× 500 B</text><rect class="sB" x="222" y="32" width="140" height="50" rx="8"/><text class="sS" x="292" y="52" text-anchor="middle">per month</text><text class="sT" x="292" y="72" text-anchor="middle">5 GB</text></g>
<g data-s="2"><line class="sLm" x1="364" y1="57" x2="410" y2="57" marker-end="url(#ahm)"/><text class="sS" x="387" y="51" text-anchor="middle">× 12</text><rect class="sB" x="412" y="32" width="120" height="50" rx="8"/><text class="sS" x="472" y="52" text-anchor="middle">per year</text><text class="sT" x="472" y="72" text-anchor="middle">60 GB</text><line class="sLm" x1="534" y1="57" x2="576" y2="57" marker-end="url(#ahm)"/><text class="sS" x="555" y="51" text-anchor="middle">× 5</text><rect class="sG" x="578" y="32" width="128" height="50" rx="8"/><text class="sS" x="642" y="52" text-anchor="middle">5 years</text><text class="sT" x="642" y="72" text-anchor="middle">300 GB</text><text class="sGt" x="642" y="100" text-anchor="middle">fits one database</text></g>
<text class="sT" x="14" y="132">traffic</text>
<g data-s="3"><rect class="sN" x="14" y="142" width="150" height="50" rx="8"/><text class="sS" x="89" y="162" text-anchor="middle">reads per month (100:1)</text><text class="sT" x="89" y="182" text-anchor="middle">1,000,000,000</text><line class="sLm" x1="166" y1="167" x2="220" y2="167" marker-end="url(#ahm)"/><text class="sS" x="193" y="161" text-anchor="middle">÷ 2.6M s</text><rect class="sB" x="222" y="142" width="140" height="50" rx="8"/><text class="sS" x="292" y="162" text-anchor="middle">average reads/s</text><text class="sT" x="292" y="182" text-anchor="middle">≈ 386</text><text class="sS" x="292" y="210" text-anchor="middle">(writes ≈ 3.9/s)</text></g>
<g data-s="4"><line class="sLm" x1="364" y1="167" x2="410" y2="167" marker-end="url(#ahm)"/><text class="sS" x="387" y="161" text-anchor="middle">× 2–10</text><rect class="sW" x="412" y="142" width="160" height="50" rx="8"/><text class="sS" x="492" y="162" text-anchor="middle">peak reads/s</text><text class="sT" x="492" y="182" text-anchor="middle">≈ 772–3,858</text><text class="sGt" x="640" y="162" text-anchor="middle">a cache in front</text><text class="sGt" x="640" y="180" text-anchor="middle">handles it easily</text></g>
<text class="sS" x="360" y="236" text-anchor="middle">a month ≈ 30 × 86,400 s ≈ 2.6 million seconds; 1 million per day ≈ 12 per second</text>
</svg><ol class="dia-steps">
<li>Ten million new short links a month at about 500 bytes each is 5 GB a month.</li>
<li>That is 60 GB a year and 300 GB over five years: one database (plus replicas) holds it.</li>
<li>At 100 reads per write, a billion reads a month averages about 386 per second.</li>
<li>Peaks run 2–10× the average, a few thousand per second: a cache makes that comfortable.</li>
</ol><figcaption>The worked estimate above as a chain of multiplications: round boldly, keep the units, and say what each number implies.</figcaption></figure>

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

Each step, the signal that justifies it and what it costs, with real examples from Figma, Shopify and Stack Overflow, is in [[SD2]].

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

<figure class="dia"><svg viewBox="0 0 720 212" role="img" aria-label="Converting the number one million to Base62 by repeated division by 62, giving the code 4c92">
<text class="sT" x="20" y="24">encode ID 1,000,000 in Base62 (0–9, a–z, A–Z)</text>
<text class="sM" x="130" y="50" text-anchor="middle">division</text><text class="sM" x="300" y="50" text-anchor="middle">quotient</text><text class="sM" x="420" y="50" text-anchor="middle">remainder</text><text class="sM" x="540" y="50" text-anchor="middle">digit</text>
<rect class="sB" x="40" y="60" width="560" height="26" rx="4"/><text class="sC" x="130" y="78" text-anchor="middle">1,000,000 ÷ 62</text><text class="sC" x="300" y="78" text-anchor="middle">16,129</text><text class="sC" x="420" y="78" text-anchor="middle">2</text><rect class="sA" x="515" y="63" width="50" height="20" rx="4"/><text class="sX" x="540" y="78" text-anchor="middle">2</text>
<rect class="sB" x="40" y="90" width="560" height="26" rx="4"/><text class="sC" x="130" y="108" text-anchor="middle">16,129 ÷ 62</text><text class="sC" x="300" y="108" text-anchor="middle">260</text><text class="sC" x="420" y="108" text-anchor="middle">9</text><rect class="sA" x="515" y="93" width="50" height="20" rx="4"/><text class="sX" x="540" y="108" text-anchor="middle">9</text>
<rect class="sB" x="40" y="120" width="560" height="26" rx="4"/><text class="sC" x="130" y="138" text-anchor="middle">260 ÷ 62</text><text class="sC" x="300" y="138" text-anchor="middle">4</text><text class="sC" x="420" y="138" text-anchor="middle">12</text><rect class="sA" x="515" y="123" width="50" height="20" rx="4"/><text class="sX" x="540" y="138" text-anchor="middle">c</text>
<rect class="sB" x="40" y="150" width="560" height="26" rx="4"/><text class="sC" x="130" y="168" text-anchor="middle">4 ÷ 62</text><text class="sC" x="300" y="168" text-anchor="middle">0</text><text class="sC" x="420" y="168" text-anchor="middle">4</text><rect class="sA" x="515" y="153" width="50" height="20" rx="4"/><text class="sX" x="540" y="168" text-anchor="middle">4</text>
<path class="sLg" d="M580 168 V72" marker-end="url(#ahg)"/><text class="sGt" x="620" y="120">read</text><text class="sGt" x="620" y="136">upward</text>
<text class="sS" x="320" y="200" text-anchor="middle">code = "4c92": 4 characters for a million; 7 characters cover 62⁷ ≈ 3.5 trillion</text>
</svg><figcaption>Base62 is ordinary base conversion with a 62-symbol alphabet. A unique counter becomes a short, collision-free code.</figcaption></figure>

**High-level design.**

<figure class="dia anim"><svg viewBox="0 0 720 230" role="img" aria-label="Animation: a redirect request goes through the CDN and load balancer to the link API, is answered from the Redis cache, and a click event is queued for analytics">
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
<circle class="sP" r="5"><animateMotion dur="4s" repeatCount="indefinite" path="M90 115 H360 L470 42 L360 108 H90"/></circle>
<circle class="sPw" r="5"><animateMotion dur="4s" begin="1.6s" repeatCount="indefinite" path="M420 135 L470 188 H610"/></circle>
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

<figure class="dia"><svg viewBox="0 0 720 184" role="img" aria-label="Fixed-window rate limiting allows 100 requests at the end of one minute and 100 at the start of the next, 200 in two seconds">
<line class="sLm" x1="60" y1="120" x2="670" y2="120" marker-end="url(#ahm)"/>
<line class="sD" x1="60.0" y1="30" x2="60.0" y2="130"/><text class="sC" x="60" y="146" text-anchor="middle">0:00</text>
<line class="sD" x1="360.0" y1="30" x2="360.0" y2="130"/><text class="sC" x="360" y="146" text-anchor="middle">1:00</text>
<line class="sD" x1="660.0" y1="30" x2="660.0" y2="130"/><text class="sC" x="660" y="146" text-anchor="middle">2:00</text>
<rect class="sR" x="335" y="60" width="25" height="58" rx="3"/><text class="sRt" x="331" y="54" text-anchor="end">100 requests at 0:59</text>
<rect class="sR" x="360" y="60" width="25" height="58" rx="3"/><text class="sRt" x="389" y="54">100 more at 1:00</text>
<text class="sS" x="360" y="172" text-anchor="middle">each window says "100, fine", yet 200 arrived within 2 seconds</text>
<text class="sC" x="210" y="100" text-anchor="middle">window 1: limit 100</text><text class="sC" x="535" y="100" text-anchor="middle">window 2: limit 100</text>
</svg><figcaption>The fixed-window edge problem. Sliding windows and token buckets smooth it out.</figcaption></figure>

<figure class="dia anim" data-rest="2"><svg viewBox="0 0 720 226" role="img" aria-label="Animation: a token bucket with capacity five refills one token per second; a burst of three requests takes three tokens, which then refill">
<rect class="sN" x="270" y="40" width="140" height="150" rx="10" style="stroke-width:2"/><text class="sC" x="340" y="32" text-anchor="middle">bucket: capacity 5</text>
<text class="sGt" x="110" y="60" text-anchor="middle">refill: 1 token / second</text>
<line class="sLg" x1="200" y1="66" x2="268" y2="90" marker-end="url(#ahg)"/>
<circle class="sPg" cx="340" cy="170" r="10"/>
<circle class="sPg" cx="340" cy="144" r="10"/>
<circle class="sPg" cx="340" cy="118" r="10"><animate attributeName="opacity" dur="8.0s" repeatCount="indefinite" calcMode="discrete" values="1;0;1" keyTimes="0;0.4125;0.5625"/></circle>
<circle class="sPg" cx="340" cy="92" r="10"><animate attributeName="opacity" dur="8.0s" repeatCount="indefinite" calcMode="discrete" values="1;0;1" keyTimes="0;0.3937;0.6875"/></circle>
<circle class="sPg" cx="340" cy="66" r="10"><animate attributeName="opacity" dur="8.0s" repeatCount="indefinite" calcMode="discrete" values="1;0;1" keyTimes="0;0.3750;0.8125"/></circle>
<circle class="sP" r="6" opacity="0"><animateMotion dur="8.0s" repeatCount="indefinite" calcMode="linear" path="M560 115 H420" keyPoints="0;0;1;1" keyTimes="0;0.3250;0.3750;1"/><animate attributeName="opacity" dur="8.0s" repeatCount="indefinite" calcMode="discrete" values="0;1;0" keyTimes="0;0.3250;0.3875"/></circle>
<circle class="sP" r="6" opacity="0"><animateMotion dur="8.0s" repeatCount="indefinite" calcMode="linear" path="M560 115 H420" keyPoints="0;0;1;1" keyTimes="0;0.3438;0.3937;1"/><animate attributeName="opacity" dur="8.0s" repeatCount="indefinite" calcMode="discrete" values="0;1;0" keyTimes="0;0.3438;0.4062"/></circle>
<circle class="sP" r="6" opacity="0"><animateMotion dur="8.0s" repeatCount="indefinite" calcMode="linear" path="M560 115 H420" keyPoints="0;0;1;1" keyTimes="0;0.3625;0.4125;1"/><animate attributeName="opacity" dur="8.0s" repeatCount="indefinite" calcMode="discrete" values="0;1;0" keyTimes="0;0.3625;0.4250"/></circle>
<rect class="sA" x="560" y="92" width="140" height="46" rx="8"/><text class="sT" x="630" y="113" text-anchor="middle">burst of 3</text><text class="sC" x="630" y="129" text-anchor="middle">each takes a token</text>
<text class="sS" x="340" y="214" text-anchor="middle">bursts up to the capacity pass; a sustained rate above the refill gets 429</text>
</svg><figcaption>Token bucket: two numbers per key (tokens and last refill time) in Redis, updated atomically with a small Lua script.</figcaption></figure>

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

<figure class="dia"><svg viewBox="0 0 720 248" role="img" aria-label="Notification system: domain events reach a notification service that applies preferences and templates, then priority queues feed channel workers that call providers">
<rect class="sB" x="10" y="90" width="110" height="50" rx="8"/><text class="sT" x="65" y="113" text-anchor="middle">domain events</text><text class="sC" x="65" y="129" text-anchor="middle">via outbox</text><line class="sL" x1="120" y1="115" x2="146" y2="115" marker-end="url(#ah)"/>
<rect class="sA" x="150" y="60" width="170" height="110" rx="10"/><text class="sT" x="235" y="82" text-anchor="middle">notification service</text><text class="sC" x="235" y="104" text-anchor="middle">preferences, quiet hours</text><text class="sC" x="235" y="122" text-anchor="middle">templates (EN / AR)</text><text class="sC" x="235" y="140" text-anchor="middle">dedupe key</text>
<line class="sLm" x1="320" y1="115" x2="356" y2="48" marker-end="url(#ahm)"/><rect class="sR" x="360" y="30" width="150" height="36" rx="6"/><text class="sC" x="435" y="53" text-anchor="middle">high: OTP, alerts</text><line class="sLm" x1="510" y1="48" x2="536" y2="48" marker-end="url(#ahm)"/>
<line class="sLm" x1="320" y1="115" x2="356" y2="118" marker-end="url(#ahm)"/><rect class="sW" x="360" y="100" width="150" height="36" rx="6"/><text class="sC" x="435" y="123" text-anchor="middle">normal: email</text><line class="sLm" x1="510" y1="118" x2="536" y2="118" marker-end="url(#ahm)"/>
<line class="sLm" x1="320" y1="115" x2="356" y2="188" marker-end="url(#ahm)"/><rect class="sB" x="360" y="170" width="150" height="36" rx="6"/><text class="sC" x="435" y="193" text-anchor="middle">bulk: marketing</text><line class="sLm" x1="510" y1="188" x2="536" y2="188" marker-end="url(#ahm)"/>
<rect class="sG" x="540" y="20" width="160" height="50" rx="8"/><text class="sT" x="620" y="43" text-anchor="middle">SMS / push workers</text><text class="sC" x="620" y="59" text-anchor="middle">retries · breaker</text><rect class="sG" x="540" y="90" width="160" height="50" rx="8"/><text class="sT" x="620" y="113" text-anchor="middle">email workers</text><text class="sC" x="620" y="129" text-anchor="middle">per-provider limits</text><rect class="sG" x="540" y="160" width="160" height="50" rx="8"/><text class="sT" x="620" y="183" text-anchor="middle">bulk workers</text><text class="sC" x="620" y="199" text-anchor="middle">throttled</text>
<text class="sS" x="360" y="236" text-anchor="middle">provider callbacks update delivery status; permanent failures go to a dead-letter queue</text>
</svg><figcaption>Priority queues keep a password-reset code from waiting behind 100,000 marketing emails.</figcaption></figure>

## B12.8 Worked design 4: FinSight at scale (multi-tenant SaaS) 🟡 ⭐

"FinSight now has 5,000 companies. Some upload 200,000 transactions a month. Design it."

<figure class="dia anim"><svg viewBox="0 0 720 284" role="img" aria-label="FinSight at scale: the client uploads CSVs straight to Blob Storage with a pre-signed URL; an UploadReceived message on a queue triggers the import worker, which writes daily aggregates to the SQL primary; a TransactionsChanged event feeds a forecasting service that calls TimeGPT once per tenant per day; dashboards are served through the API from a per-tenant Redis cache backed by a read replica; a tenant catalogue routes large tenants to their own databases">
<line class="sLm" x1="142" y1="52" x2="162" y2="52" marker-end="url(#ahm)"/>
<line class="sLm" x1="442" y1="52" x2="448" y2="52" marker-end="url(#ahm)"/>
<line class="sLm" x1="578" y1="52" x2="584" y2="52" marker-end="url(#ahm)"/>
<line class="sLm" x1="650" y1="74" x2="650" y2="116" marker-end="url(#ahm)"/>
<line class="sLm" x1="650" y1="162" x2="650" y2="204" marker-end="url(#ahm)"/>
<line class="sLm" x1="586" y1="228" x2="580" y2="228" marker-end="url(#ahm)"/>
<line class="sLm" x1="450" y1="228" x2="444" y2="228" marker-end="url(#ahm)"/>
<line class="sLm" x1="228" y1="74" x2="228" y2="116" marker-end="url(#ahm)"/>
<line class="sLm" x1="586" y1="140" x2="580" y2="140" marker-end="url(#ahm)"/>
<line class="sLm" x1="450" y1="140" x2="444" y2="140" marker-end="url(#ahm)"/>
<path class="sLw" d="M 78.0 30 C 78.0 19 378.0 19 378.0 28" marker-end="url(#ahw)" style="fill:none" stroke-dasharray="5 4"/>
<text class="sWt" x="228" y="13" text-anchor="middle">upload straight to Blob with a pre-signed URL</text>
<line class="sLm" x1="248" y1="74" x2="348" y2="118" marker-end="url(#ahm)"/>
<rect class="sA" x="14" y="30" width="128" height="44" rx="8" opacity=".8"/><text class="sT" x="78" y="49" text-anchor="middle">Angular client</text><text class="sS" x="78" y="65" text-anchor="middle">per tenant</text>
<rect class="sB" x="164" y="30" width="128" height="44" rx="8" opacity=".8"/><text class="sT" x="228" y="49" text-anchor="middle">API</text><text class="sS" x="228" y="65" text-anchor="middle">auth, rate limits</text>
<rect class="sN" x="314" y="30" width="128" height="44" rx="8"/><text class="sT" x="378" y="49" text-anchor="middle">Blob Storage</text><text class="sS" x="378" y="65" text-anchor="middle">raw CSV</text>
<rect class="sV" x="450" y="30" width="128" height="44" rx="8" opacity=".8"/><text class="sT" x="514" y="49" text-anchor="middle">queue</text><text class="sS" x="514" y="65" text-anchor="middle">UploadReceived</text>
<rect class="sB" x="586" y="30" width="128" height="44" rx="8" opacity=".8"/><text class="sT" x="650" y="49" text-anchor="middle">import worker</text><text class="sS" x="650" y="65" text-anchor="middle">batch, validate</text>
<rect class="sN" x="164" y="118" width="128" height="44" rx="8"/><text class="sT" x="228" y="137" text-anchor="middle">tenant catalogue</text><text class="sS" x="228" y="153" text-anchor="middle">shared or own DB</text>
<rect class="sR" x="314" y="118" width="128" height="44" rx="8" opacity=".8"/><text class="sT" x="378" y="137" text-anchor="middle">Redis</text><text class="sS" x="378" y="153" text-anchor="middle">per-tenant cache</text>
<rect class="sG" x="450" y="118" width="128" height="44" rx="8" opacity=".8"/><text class="sT" x="514" y="137" text-anchor="middle">read replica</text><text class="sS" x="514" y="153" text-anchor="middle">dashboards, reports</text>
<rect class="sG" x="586" y="118" width="128" height="44" rx="8" opacity=".8"/><text class="sT" x="650" y="137" text-anchor="middle">SQL primary</text><text class="sS" x="650" y="153" text-anchor="middle">aggregates per day</text>
<rect class="sN" x="314" y="206" width="128" height="44" rx="8"/><text class="sT" x="378" y="225" text-anchor="middle">TimeGPT</text><text class="sS" x="378" y="241" text-anchor="middle">external API</text>
<rect class="sB" x="450" y="206" width="128" height="44" rx="8" opacity=".8"/><text class="sT" x="514" y="225" text-anchor="middle">forecast service</text><text class="sS" x="514" y="241" text-anchor="middle">dedup tenant/day</text>
<rect class="sV" x="586" y="206" width="128" height="44" rx="8" opacity=".8"/><text class="sT" x="650" y="225" text-anchor="middle">event</text><text class="sS" x="650" y="241" text-anchor="middle">TransactionsChanged</text>
<circle class="sPw" r="5"><animateMotion dur="6s" repeatCount="indefinite" path="M 78.0 30 C 78.0 19 378.0 19 378.0 52.0 L 514.0 52.0 L 650.0 52.0 L 650.0 140.0 L 650.0 228.0 L 514.0 228.0 L 378.0 228.0"/></circle>
<circle class="sPg" r="5"><animateMotion dur="3s" repeatCount="indefinite" path="M 78.0 52.0 L 228.0 52.0 L 348.0 118 L 378.0 140.0"/></circle>
<text class="sS" x="14" y="274">amber: an upload flowing through import, aggregation and forecasting · green: a dashboard read served from cache</text>
</svg><figcaption>The design above as one picture: the write path is asynchronous end to end, and reads never touch the primary.</figcaption></figure>

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
