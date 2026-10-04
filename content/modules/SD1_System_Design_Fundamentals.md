# System Design Fundamentals — How Software Works at Scale

System design is the skill of deciding **which parts a system needs, how they talk, where the data lives, and what happens when something breaks or traffic grows**. It used to be a senior backend topic. In 2026 it shows up on every track: frontend interviews ask how a feed loads fast on a weak phone connection, data interviews ask how a pipeline survives late data, AI interviews ask how a chatbot stays cheap and fast for a million users, and network interviews ask how a site stays up when a link or a whole data centre fails. This module gives every track the same foundation: the vocabulary, the building blocks and the numbers. [[SD2]] then scales a system step by step, [[SD3]] is about choosing between options, [[SD4]] about keeping it reliable, and [[SD5]] applies all of it to your role.

> [!focus]
> **Entry must:** follow one request from a browser to a database and back, naming every hop; explain what DNS, load balancers, caches, CDNs, SQL and NoSQL databases, object storage and queues are *for*; explain latency vs throughput, vertical vs horizontal scaling, and why servers should be stateless.
> **Mid adds:** availability in "nines" and what an SLO is; estimating traffic and storage on paper; the cost of each extra hop; reasoning about where the bottleneck is before adding anything.
> **Most asked:** *What happens when you type a URL and press Enter?* · *How would you make this app handle 10× the users?* · *What is a load balancer / CDN / cache for?* · *SQL or NoSQL?* · *Horizontal or vertical scaling?*
> **Time budget:** 3 hours. This is the module every other system-design module assumes.

## SD1.1 What system design is, and why every track needs it 🟢 ⭐

Writing code answers "does this feature work?". System design answers four other questions:

| Question | The property | Typical interview phrasing |
|---|---|---|
| Does it stay fast as usage grows? | **Scalability** and **performance** | "What happens at 100× the traffic?" |
| Does it keep working when parts fail? | **Reliability** and **availability** | "What if the database goes down?" |
| Can the team keep changing it safely? | **Maintainability** | "How would you add payments to this?" |
| Is it worth what it costs? | **Cost efficiency** | "Can we run this for less?" |

Martin Kleppmann's *Designing Data-Intensive Applications* frames the first three as reliability, scalability and maintainability; cloud providers add cost and security as first-class concerns (the AWS Well-Architected Framework has six pillars: operational excellence, security, reliability, performance efficiency, cost optimisation and sustainability).

**How each track meets it:**

| Track | What "system design" means in your interviews |
|---|---|
| Frontend | Rendering strategy, data fetching and caching in the client, performance budgets, offline and real-time behaviour ([[SD5.2]]) |
| Backend / Full-stack | The classic whiteboard design: APIs, databases, caches, queues, scaling ([[B12]]) |
| Data analyst | How data gets to the dashboard, how fresh it is, and why the report is slow ([[SD5.4]]) |
| Data engineer | Batch and streaming pipelines, storage formats, backfills, data quality at volume ([[SD5.5]]) |
| Data scientist | ML system design: training, serving, monitoring ([[SD5.6]]) |
| AI engineer | LLM and RAG applications: latency, token cost, evaluation, guardrails ([[SD5.7]]) |
| Network & connectivity | Redundant networks, load balancing, DNS, failover, monitoring ([[SD5.8]]) |

> [!say]
> "System design is choosing the components of a system and how they connect, so it meets its requirements for scale, reliability and cost, and knowing the trade-off behind every choice."

## SD1.2 The journey of one request 🟢 ⭐

Almost every system design starts by tracing a single request. Learn this path; every building block below sits somewhere on it.

<figure class="dia"><svg viewBox="0 0 760 250" role="img" aria-label="Request journey: browser, DNS, CDN, load balancer, app servers, cache, database, queue and workers">
<rect class="sB" x="10" y="100" width="90" height="46" rx="8"/><text class="sT" x="55" y="122" text-anchor="middle">Browser /</text><text class="sT" x="55" y="138" text-anchor="middle">mobile app</text>
<rect class="sB" x="40" y="10" width="90" height="38" rx="8"/><text class="sT" x="85" y="34" text-anchor="middle">DNS</text>
<line class="sD" x1="60" y1="100" x2="75" y2="48"/><text class="sM" x="12" y="78">1 · name → IP</text>
<rect class="sA" x="140" y="100" width="80" height="46" rx="8"/><text class="sT" x="180" y="128" text-anchor="middle">CDN edge</text>
<rect class="sA" x="250" y="100" width="90" height="46" rx="8"/><text class="sT" x="295" y="122" text-anchor="middle">Load</text><text class="sT" x="295" y="138" text-anchor="middle">balancer</text>
<rect class="sA" x="370" y="70" width="110" height="34" rx="8"/><text class="sT" x="425" y="92" text-anchor="middle">App server 1</text>
<rect class="sA" x="370" y="112" width="110" height="34" rx="8"/><text class="sT" x="425" y="134" text-anchor="middle">App server 2</text>
<rect class="sA" x="370" y="154" width="110" height="34" rx="8"/><text class="sT" x="425" y="176" text-anchor="middle">App server N</text>
<rect class="sG" x="530" y="40" width="100" height="40" rx="8"/><text class="sT" x="580" y="65" text-anchor="middle">Cache</text>
<rect class="sG" x="530" y="104" width="100" height="40" rx="8"/><text class="sT" x="580" y="129" text-anchor="middle">Database</text>
<rect class="sW" x="530" y="168" width="100" height="40" rx="8"/><text class="sT" x="580" y="193" text-anchor="middle">Queue</text>
<rect class="sB" x="660" y="168" width="90" height="40" rx="8"/><text class="sT" x="705" y="193" text-anchor="middle">Workers</text>
<rect class="sG" x="660" y="104" width="90" height="40" rx="8"/><text class="sT" x="705" y="122" text-anchor="middle">Object</text><text class="sT" x="705" y="137" text-anchor="middle">storage</text>
<line class="sL" x1="100" y1="123" x2="140" y2="123"/><line class="sL" x1="220" y1="123" x2="250" y2="123"/>
<line class="sL" x1="340" y1="115" x2="370" y2="87"/><line class="sL" x1="340" y1="123" x2="370" y2="129"/><line class="sL" x1="340" y1="131" x2="370" y2="171"/>
<line class="sL" x1="480" y1="120" x2="530" y2="60"/><line class="sL" x1="480" y1="126" x2="530" y2="124"/><line class="sD" x1="480" y1="134" x2="530" y2="188"/><line class="sD" x1="630" y1="188" x2="660" y2="188"/><line class="sD" x1="705" y1="168" x2="705" y2="144"/>
<text class="sS" x="140" y="232">Static files stop at the CDN · dynamic requests reach an app server · slow work goes through the queue</text>
</svg><figcaption>The common shape of a web system. Small apps collapse several boxes into one server; large ones multiply each box, but the path stays recognisable.</figcaption></figure>

1. **DNS** turns `app.example.com` into an IP address (cached by the browser, the OS and resolvers, so this is usually instant). See [[S1.2]] and [[N3.3]].
2. The browser opens a **TCP + TLS** connection (or QUIC for HTTP/3) to the nearest **CDN edge**. Static files (JavaScript, images, fonts) are served from there without touching your servers.
3. Dynamic requests go on to a **load balancer**, which picks a healthy **app server**.
4. The app server checks a **cache** first; on a miss it queries the **database**, then stores the answer in the cache.
5. Anything slow that the user doesn't need to wait for (sending an email, resizing an image, scoring a model) is put on a **queue** and done later by **workers**. Large files live in **object storage**.
6. The response travels back the same way.

> [!say]
> "DNS resolves the name, the CDN serves static assets from the edge, a load balancer spreads dynamic requests across stateless app servers, which read through a cache to the database and push slow work onto a queue for background workers."

## SD1.3 Clients, servers and the network between them 🟢

A **client** asks; a **server** answers. The contract between them is an **API** (REST over HTTP is the default; [[SD3.5]] compares gRPC, GraphQL, WebSockets and Server-Sent Events).

Three facts about the network shape every design:

- **The network is slow compared with memory.** A round trip inside one data centre is about half a millisecond; Cairo to Western Europe is roughly 50–80 ms; Cairo to the US West Coast roughly 150–200 ms. Every extra hop adds latency, and every chatty client that makes 30 calls instead of 3 pays it 30 times.
- **The network fails.** Packets drop, connections time out, a service is reachable from one place and not another. Designs that assume it never fails break in production (the "fallacies of distributed computing", collected at Sun Microsystems in the 1990s, start with "the network is reliable").
- **The client is not under your control.** Old phones, flaky mobile data and users who double-click the Pay button are normal. Validate on the server, make operations safe to retry ([[SD4.3]]), and never trust the client with secrets.

> [!term] Latency
> How long one operation takes, from request to response; usually reported as percentiles (**p50**, **p95**, **p99**), because the average hides the slow requests users actually notice.

> [!term] Throughput
> How many operations a system completes per unit of time, such as requests per second or rows per second.

**Latency and throughput are different.** A motorway can carry many cars per hour (throughput) while each car still takes an hour to arrive (latency). You can raise throughput by adding servers; you often can't lower latency that way, because it is set by the slowest hop on the path.

> [!term] Little's Law
> In a stable system, the average number of requests in flight = arrival rate × average time in the system (L = λW). At 1,000 requests per second and 200 ms each, about **200 requests are in progress at any moment**, which is how you size thread pools and database connection pools.

## SD1.4 Vertical vs horizontal scaling, and why servers must be stateless 🟢 ⭐

| | Vertical scaling ("scale up") | Horizontal scaling ("scale out") |
|---|---|---|
| How | A bigger machine: more CPU, RAM, faster disk | More machines behind a load balancer |
| Good | No code changes; one machine is simple to run | No hard ceiling; survives a machine failing; scale in small steps |
| Bad | A ceiling (the largest machine), a single point of failure, downtime to resize | Needs **stateless** servers, a load balancer, and care with shared data |
| Typical use | Databases first, and every early-stage app | Web and API tiers, workers, caches, most of the modern cloud |

Real systems use both: scale the database vertically for as long as you reasonably can (it is the hardest part to split), and scale the stateless tiers horizontally.

> [!term] Stateless server
> A server that keeps nothing about a user between requests in its own memory or disk. Sessions live in a shared store (Redis, the database) or in a signed token, uploads go to object storage, and any server can handle any request. This is what makes horizontal scaling, rolling deployments and automatic replacement of failed machines possible.

> [!mistake] Sticky sessions as a scaling strategy
> Pinning each user to one server ("session affinity") hides state in that server's memory. When it restarts or is removed, those users are logged out, and load becomes uneven. Use it only as a short-term crutch for a legacy app.

## SD1.5 DNS and load balancers 🟢 ⭐

**DNS** is the internet's distributed phone book: it maps names to IP addresses through a hierarchy (root → top-level domain → the domain's authoritative servers), with answers cached for their **TTL**. In system design it is also a traffic tool:

- **GeoDNS / latency-based routing** sends users to the nearest region.
- **DNS failover** points the name at a standby region when health checks fail; the TTL decides how long clients keep using the old answer, so a 1-hour TTL means up to an hour of failed requests for some users.
- **Anycast** (one IP address announced from many locations) lets the network itself route users to the nearest site; CDNs and public resolvers such as 1.1.1.1 and 8.8.8.8 use it.

A **load balancer** sits in front of a group of servers and:

1. spreads requests across them (round robin, least connections, or hashing a key so the same user or key lands on the same server);
2. runs **health checks** and stops sending traffic to unhealthy servers;
3. often terminates **TLS**, so certificates live in one place;
4. lets you deploy without downtime by draining servers one at a time.

| | Layer 4 (transport) | Layer 7 (application) |
|---|---|---|
| Sees | IP addresses and ports (TCP/UDP) | HTTP: paths, headers, cookies |
| Can do | Very fast forwarding of connections | Route `/api` and `/images` to different services, rewrite headers, rate-limit, authenticate |
| Examples | AWS Network Load Balancer, Azure Load Balancer, HAProxy in TCP mode | AWS Application Load Balancer, Azure Application Gateway, NGINX, Envoy, HAProxy in HTTP mode |

> [!note] The load balancer must not become the single point of failure
> Managed cloud load balancers are themselves spread across machines and zones. On your own hardware you run a pair with a floating virtual IP (VRRP, keepalived), the same idea as first-hop redundancy in [[N5.5]].

## SD1.6 Caching and CDNs 🟢 ⭐

A **cache** keeps a copy of data somewhere faster or closer than its source. Caches exist at every layer: the browser, the CDN, an in-process memory cache in the app, a shared cache such as **Redis** or **Memcached**, and the database's own buffer pool.

**Why it works:** most traffic is reads, and a small fraction of data gets most of the reads. If 90% of reads hit the cache, the database sees one-tenth of the read load and users get answers in about a millisecond instead of ten.

**The price is staleness.** A cached copy can be out of date. Every cache decision is "how stale can this be?": a product description for an hour is fine; an account balance is not. The patterns (cache-aside, write-through, TTLs, invalidation, stampede protection) are in [[B8.2]].

A **CDN** (content delivery network) is a cache spread across hundreds of cities. It serves static files from an edge server near the user, absorbs traffic spikes and attacks, and can also cache API responses that are the same for everyone. For a user in Cairo, an image served from a nearby edge instead of a server in Europe saves tens of milliseconds on every file.

> [!say]
> "I cache data that is read far more often than it changes, at the layer closest to the user that is still correct: the CDN for static assets, Redis for shared hot data, and I choose a TTL or explicit invalidation based on how stale each kind of data is allowed to be."

> [!mistake] Caching to hide a missing index
> A slow query behind a cache is still slow on every cache miss, after every deploy that flushes the cache, and for every user whose data isn't hot. Fix the query ([[B6.3]]) first; cache what is genuinely expensive or genuinely hot.

## SD1.7 Databases: SQL, NoSQL and object storage 🟢 ⭐

| | Relational (SQL) | Non-relational (NoSQL) |
|---|---|---|
| Examples | PostgreSQL, SQL Server, MySQL, Oracle | Key-value (Redis, DynamoDB), document (MongoDB, Cosmos DB), wide-column (Cassandra, ScyllaDB), graph (Neo4j) |
| Data shape | Tables with a schema, related by keys | Shaped around how it is read: a document, a key, a partition of rows |
| Strengths | Transactions (ACID), joins, ad-hoc queries, integrity constraints | Predictable performance at very large scale on known access patterns; built-in partitioning and replication |
| Weaknesses | Scaling writes beyond one machine takes work (replicas, partitioning, sharding) | Queries you didn't design for are slow or impossible; consistency and integrity are partly your job |
| Default for | Most business systems: orders, payments, users, inventory | Very high write volumes, simple lookups at huge scale, flexible per-item data |

The common internet summary ("SQL for structured data, NoSQL for unstructured data") is too simple. PostgreSQL stores and indexes JSON well, and many NoSQL systems require *more* up-front design than SQL, because you model each table around one query. The real questions are in [[SD3.3]]: what are the access patterns, how much consistency do you need, and how far must writes scale?

> [!term] ACID
> The guarantees of a database transaction: **Atomic** (all or nothing), **Consistent** (constraints hold), **Isolated** (concurrent transactions don't see each other's half-done work, to a chosen degree), **Durable** (once committed, it survives a crash).

**Object storage** (Amazon S3, Azure Blob Storage, Google Cloud Storage) holds files of any size: images, videos, uploads, backups, data-lake files, model weights. It is cheap, extremely durable and scales without limit, but it is not a database or a filesystem: you read and write whole objects by key. Clients usually upload and download directly with **pre-signed URLs**, so large files never pass through your app servers.

**Search engines** (Elasticsearch, OpenSearch) and **vector databases** (pgvector, Qdrant, Pinecone and others) are specialised read stores kept in sync from the main database: one for full-text search, the other for similarity search over embeddings ([[SD5.7]]).

## SD1.8 Queues, events and asynchronous work 🟢 ⭐

Not everything has to happen while the user waits. A **message queue** lets one part of the system hand work to another and move on.

| Without a queue | With a queue |
|---|---|
| The checkout request sends the email, generates the PDF invoice and updates analytics before replying: slow, and it fails if the email provider is down | The checkout request saves the order, publishes `OrderPlaced` and replies in milliseconds; workers send the email and build the invoice, retrying if a provider is down |

Queues give you three things: **faster responses**, **spike absorption** (a burst of 10,000 uploads waits in the queue instead of overloading the workers), and **decoupling** (the producer doesn't need to know who consumes, or whether they are up right now).

They also bring new problems you must design for: messages can be delivered **more than once** (so consumers must be idempotent, [[SD4.3]]), order is only guaranteed within limits, and failures become silent unless you watch queue depth and a **dead-letter queue**. RabbitMQ, Kafka and the managed options (Amazon SQS, Azure Service Bus) are compared in [[SD3.4]].

## SD1.9 Availability, SLOs and the "nines" 🟢 🟡 ⭐

**Availability** is the fraction of time (or of requests) a system works. It is usually quoted in nines:

| Availability | Downtime per year | Downtime per 30-day month |
|---|---|---|
| 99% ("two nines") | ~3.65 days | ~7.2 hours |
| 99.9% | ~8.8 hours | ~43 minutes |
| 99.95% | ~4.4 hours | ~22 minutes |
| 99.99% | ~53 minutes | ~4.3 minutes |
| 99.999% | ~5.3 minutes | ~26 seconds |

Two rules of thumb follow from multiplying probabilities:

- **Components in series multiply down.** If a request needs the API (99.9%) *and* the database (99.9%), the best you can expect is about 99.8%. Every hard dependency costs you availability.
- **Redundant components multiply up.** Two independent servers that are each up 99% of the time, where either can serve, are both down only 0.01 × 0.01 = 0.01% of the time: about 99.99%. This is why redundancy across machines, zones and regions works, *as long as the failures are independent*.

> [!term] SLI, SLO and SLA
> An **SLI** (service level indicator) is a measurement, such as the percentage of requests answered successfully in under 300 ms. An **SLO** (objective) is the target you set for it, such as 99.9% over 28 days. An **SLA** (agreement) is a contract with customers, with penalties, and is set looser than the internal SLO. The gap between 100% and the SLO is the **error budget**: while you have budget left you can ship fast; when it is spent, reliability work comes first (the approach in Google's *Site Reliability Engineering* book).

> [!mistake] Promising five nines
> 99.999% allows about five minutes of downtime a year, including deployments, database upgrades and your cloud provider's own incidents. Few products need it and very few teams can deliver it. Ask what the business actually loses per hour of downtime, then pick a target.

## SD1.10 Back-of-the-envelope estimation 🟢 🟡 ⭐

Interviewers don't want precise numbers; they want to see you check whether a design is the right *size*. Round aggressively.

**Conversions worth memorising:**

- 1 day ≈ 86,400 s ≈ **10⁵ seconds**.
- 1 million requests per day ≈ **12 per second** on average; peaks are commonly **2–10×** the average.
- 1 KB × 1 million = 1 GB; 1 KB × 1 billion = 1 TB.
- One modern server can usually handle **hundreds to a few thousand** simple API requests per second; one well-tuned relational database **thousands** of simple indexed queries per second; one Redis instance on the order of **100,000** simple operations per second. Treat these as orders of magnitude, then load-test ([[SD2.8]]).

**Worked example: a food-delivery app in Egypt.** 2 million daily active users, each opening the app 3 times a day and making about 20 API calls per session.

- Requests: 2 M × 3 × 20 = 120 M per day ≈ **1,400 per second** average; at a dinner-time peak of 5× ≈ **7,000 per second**. That is a load-balanced fleet of app servers plus a cache, not one server and not a global microservice mesh.
- Order writes: 300,000 orders per day ≈ 3.5 per second average, maybe 30 per second at peak: **one relational database handles this easily**. The read side (menus, restaurant lists) is where the load is, so it is cached.
- Courier locations: 20,000 active couriers sending a GPS point every 5 seconds = **4,000 writes per second**, tiny rows but constant. That stream deserves its own path (an in-memory store or a time-series/streaming system), separate from the orders database.

> [!say]
> "Let me size it first: about 1,400 requests a second on average and maybe 7,000 at peak, with orders at only tens per second. So the order database is not the problem; the read traffic and the courier-location stream are, and that's where I'll spend the design."

> [!lab] Estimate three systems you know
> On paper, estimate requests per second, writes per second and storage per year for (1) your own project (FinSight, CS Visualizer, the capstone), (2) a ride-hailing app in Cairo, and (3) a bank's mobile app on salary day. Write one sentence on what each estimate tells you about the design. Ten minutes each.

## SD1.11 Interview drill 🟢 ⭐

| Question | Strong short answer |
|---|---|
| What is system design? | Choosing a system's components and how they connect so it meets its requirements for scale, reliability, maintainability and cost, with a reason for every choice. |
| Walk me through what happens when I open a website. | DNS resolves the name, TLS connection to a CDN edge for static files, a load balancer forwards dynamic requests to an app server, which reads through a cache to the database and returns the response. |
| Latency vs throughput? | Latency is how long one request takes; throughput is how many complete per second. More servers raise throughput; latency is set by the slowest hop. |
| Why report p99 rather than the average? | Averages hide the slow tail; p99 is the experience of your unluckiest 1% of requests, often your heaviest users. |
| Vertical vs horizontal scaling? | A bigger machine vs more machines behind a load balancer; horizontal needs stateless servers but has no ceiling and survives failures. |
| Why must app servers be stateless? | So any server can serve any request, which enables load balancing, autoscaling, rolling deploys and replacing failed machines. |
| What does a load balancer do? | Spreads traffic across healthy servers, runs health checks, often terminates TLS, and enables zero-downtime deploys. |
| L4 vs L7 load balancing? | L4 forwards TCP/UDP connections by IP and port; L7 understands HTTP and can route by path, header or cookie. |
| What is a CDN for? | Serving static and cacheable content from edge servers near users: lower latency, less origin load, protection from spikes. |
| What is the main cost of caching? | Staleness and invalidation complexity; you decide per data type how stale it may be. |
| SQL or NoSQL by default? | SQL for most business data (transactions, joins, flexible queries); NoSQL when known access patterns need massive scale or flexible items. |
| Why use a queue? | Faster responses, absorbing spikes and decoupling services; at the cost of duplicate delivery and harder debugging. |
| What does 99.9% availability allow? | About 43 minutes of downtime a month, or 8.8 hours a year. |
| Two 99.9% services in series give? | About 99.8%: hard dependencies multiply availability down. |
| 1 million requests a day is how many per second? | About 12 on average; design for peaks several times higher. |

## Key takeaways

> [!check]
> - Trace one request end to end: DNS → CDN → load balancer → stateless app servers → cache → database, with queues for slow work.
> - Latency and throughput are different; report percentiles, not averages.
> - Scale stateless tiers horizontally; scale the database vertically for as long as it lasts.
> - Caches trade freshness for speed; decide staleness per data type.
> - Default to a relational database; choose NoSQL for a stated access pattern and scale, not because data is "unstructured".
> - Availability multiplies: dependencies in series lower it, independent redundancy raises it.
> - Estimate before designing: 1 M/day ≈ 12/s, and the numbers tell you where to spend effort.

## Sources

- Martin Kleppmann, *Designing Data-Intensive Applications* (O'Reilly, 2017), chapter 1 on reliability, scalability and maintainability.
- Betsy Beyer et al., *Site Reliability Engineering* (Google, 2016), [chapter 4: Service Level Objectives](https://sre.google/sre-book/service-level-objectives/), free online.
- AWS: [Well-Architected Framework](https://docs.aws.amazon.com/wellarchitected/latest/framework/welcome.html); Microsoft: [Azure Architecture Center](https://learn.microsoft.com/en-us/azure/architecture/).
- MDN: [How the web works](https://developer.mozilla.org/en-US/docs/Learn_web_development/Getting_started/Web_standards/How_the_web_works) and [HTTP caching](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Caching).
- Cloudflare Learning Center: [What is a CDN?](https://www.cloudflare.com/learning/cdn/what-is-a-cdn/), [What is load balancing?](https://www.cloudflare.com/learning/performance/what-is-load-balancing/), [What is DNS?](https://www.cloudflare.com/learning/dns/what-is-dns/).
- [The System Design Primer](https://github.com/donnemartin/system-design-primer) (open source).
- Jeff Dean, "Latency numbers every programmer should know" (rough orders of magnitude; several interactive versions online).
