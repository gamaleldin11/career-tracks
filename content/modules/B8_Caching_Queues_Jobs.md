# Caching, Message Queues and Background Jobs — Redis, RabbitMQ, Kafka, Hangfire and the Outbox

These are the three topics your gaps file lists as blocking the most backend jobs: **Redis**, **message queues** and **jobs at scale**. You already have the hardest part, which is the instinct to move slow work out of the request (FinSight's Hangfire forecasting job and background re-forecasting). This module adds the vocabulary and patterns interviewers expect, so you can talk about caching and messaging as confidently as you talk about EF Core, and it ends with a lab that closes the gap for real.

> [!focus]
> **Entry must:** why and where to cache; cache-aside; TTLs and invalidation; why queues decouple services; producer, consumer, queue and topic; at-least-once delivery and idempotent consumers; background jobs.
> **Mid adds:** cache stampede, distributed vs in-memory cache, HybridCache, Redis data structures, RabbitMQ vs Kafka vs Azure Service Bus, dead-letter queues, ordering, the transactional outbox, retries with backoff, Hangfire vs hosted services.
> **Most asked:** *How would you cache this?* · *How do you invalidate a cache?* · *What's a cache stampede?* · *Why use a message queue?* · *RabbitMQ vs Kafka?* · *What is at-least-once delivery?* · *How do you publish an event reliably after saving to the database?*
> **Time budget:** 4 hours, plus the lab.

## B8.0 Foundations: why caches and queues work 🟢

**Caches work because access is uneven.** Two patterns show up in almost every system: **recency** (something used a moment ago is likely to be used again soon) and **popularity skew** (a small fraction of items gets most of the reads: today's dashboard, the top products, the logged-in users' permissions). Keep those few items in fast memory and most reads never reach the slow store.

The payoff is plain arithmetic:

<figure class="dia"><svg viewBox="0 0 720 242" role="img" aria-label="Average read latency falls from 20 ms with no cache to 2.9 ms at a 90% hit ratio and about 1.2 ms at 99%">
<line class="sLm" x1="80" y1="196" x2="650" y2="196" marker-end="url(#ahm)"/><line class="sLm" x1="80" y1="196" x2="80" y2="34" marker-end="url(#ahm)"/>
<polyline class="sL" points="80.0,46.0 91.2,48.8 102.4,51.7 113.6,54.6 124.8,57.4 136.0,60.2 147.2,63.1 158.4,65.9 169.6,68.8 180.8,71.6 192.0,74.5 203.2,77.3 214.4,80.2 225.6,83.0 236.8,85.9 248.0,88.7 259.2,91.6 270.4,94.5 281.6,97.3 292.8,100.1 304.0,103.0 315.2,105.8 326.4,108.7 337.6,111.5 348.8,114.4 360.0,117.2 371.2,120.1 382.4,123.0 393.6,125.8 404.8,128.6 416.0,131.5 427.2,134.4 438.4,137.2 449.6,140.1 460.8,142.9 472.0,145.8 483.2,148.6 494.4,151.4 505.6,154.3 516.8,157.2 528.0,160.0 539.2,162.8 550.4,165.7 561.6,168.6 572.8,171.4 584.0,174.2 595.2,177.1 606.4,179.9 617.6,182.8 628.8,185.7 640.0,188.5"/>
<circle class="sPw" cx="80.0" cy="46.0" r="5"/><text class="sM" x="88" y="38">0% → 20.0 ms</text>
<circle class="sPw" cx="360.0" cy="117.2" r="5"/><text class="sM" x="368" y="109.25">50% → 10.5 ms</text>
<circle class="sPw" cx="584.0" cy="174.2" r="5"/><text class="sM" x="592" y="166.25">90% → 2.9 ms</text>
<circle class="sPw" cx="634.4" cy="187.1" r="5"/><text class="sM" x="626.4" y="179.075" text-anchor="end">99% → 1.2 ms</text>
<text class="sC" x="80" y="214" text-anchor="middle">0%</text>
<text class="sC" x="220" y="214" text-anchor="middle">25%</text>
<text class="sC" x="360" y="214" text-anchor="middle">50%</text>
<text class="sC" x="500" y="214" text-anchor="middle">75%</text>
<text class="sC" x="640" y="214" text-anchor="middle">100%</text>
<text class="sC" x="640" y="230" text-anchor="end">cache hit ratio →</text><text class="sC" x="74" y="14">average read latency</text>
<text class="sS" x="390" y="70" text-anchor="middle">average = hit% × 1 ms + miss% × 20 ms</text>
</svg><figcaption>The arithmetic of caching, with a 1 ms cache and a 20 ms query. The last few percent of hit ratio matter most, and the database load falls by the same factor.</figcaption></figure>

The cost is also plain: a cached copy can be **stale**, and every cache needs an answer to "when do I throw this away?".

**Queues work because they decouple time.** A synchronous call needs the other side to be up and fast *right now*. A queue lets the producer hand the work over and move on; the consumer does it when it can, at its own pace, and retries if it fails. The trade is that the result arrives later, and the system is **eventually** consistent rather than immediately.

## B8.1 Why cache, and where 🟢 ⭐

A cache keeps a copy of expensive-to-produce data somewhere faster to read. Every cache trades **freshness** for **speed**, so the first question is always: **how stale can this be?**

| Layer | Example | Scope |
|---|---|---|
| Browser | `Cache-Control`, service worker | One user ([[S1.8]]) |
| CDN | Front Door, Cloudflare | Everyone near an edge location |
| Reverse proxy / output cache | ASP.NET Core output caching, nginx | Whole HTTP responses |
| **Application, in-memory** | `IMemoryCache` | One server instance |
| **Application, distributed** | **Redis** (`IDistributedCache`) | All instances |
| Database | Buffer pool, materialised views | The database's own |

**Good cache candidates:** read often, changed rarely, expensive to compute, and tolerant of slight staleness: exchange rates, product catalogues, permissions, dashboard summaries, external API responses.

**Bad candidates:** data that must always be exact (account balances at the moment of payment), data unique per request, anything cheap to fetch anyway.

## B8.2 Caching patterns 🟢 🟡 ⭐

| Pattern | How | Notes |
|---|---|---|
| **Cache-aside** (lazy loading) | Read the cache; on a miss, read the database, then store in the cache | **The default.** The app controls everything; the first request after expiry is slow |
| **Read-through** | The cache itself loads from the database on a miss | Needs a cache library or provider that supports it |
| **Write-through** | Writes go to the cache and the database together | The cache is always fresh; writes are slower |
| **Write-behind** (write-back) | Writes go to the cache, flushed to the database later | Fast writes; risk of loss on crash |

<figure class="dia steps"><svg viewBox="0 0 720 256" role="img" aria-label="Cache-aside: the first request misses the cache, reads the database and stores the result; the next request is served from the cache">
<text class="sT" x="90" y="22" text-anchor="middle">Client</text><line class="sD" x1="90" y1="32" x2="90" y2="246"/>
<text class="sT" x="290" y="22" text-anchor="middle">API</text><line class="sD" x1="290" y1="32" x2="290" y2="246"/>
<text class="sT" x="480" y="22" text-anchor="middle">Redis</text><line class="sD" x1="480" y1="32" x2="480" y2="246"/>
<text class="sT" x="650" y="22" text-anchor="middle">Database</text><line class="sD" x1="650" y1="32" x2="650" y2="246"/>
<g data-s="1"><line class="sL" x1="90" y1="46" x2="286" y2="52" marker-end="url(#ah)"/><text class="sC" x="190" y="42" text-anchor="middle">GET summary</text><line class="sL" x1="290" y1="60" x2="476" y2="66" marker-end="url(#ah)"/><text class="sM" x="385" y="56" text-anchor="middle">GET dash:42</text><line class="sLr" x1="476" y1="76" x2="294" y2="82" marker-end="url(#ahr)"/><text class="sRt" x="385" y="94" text-anchor="middle">miss</text></g>
<g data-s="2"><line class="sL" x1="290" y1="104" x2="646" y2="110" marker-end="url(#ah)"/><text class="sC" x="470" y="100" text-anchor="middle">SELECT … (20 ms)</text><line class="sLg" x1="646" y1="118" x2="294" y2="124" marker-end="url(#ahg)"/></g>
<g data-s="3"><line class="sLw" x1="290" y1="136" x2="476" y2="142" marker-end="url(#ahw)"/><text class="sM" x="385" y="134" text-anchor="middle">SET dash:42 TTL 5 min</text><line class="sLg" x1="286" y1="150" x2="94" y2="156" marker-end="url(#ahg)"/><text class="sGt" x="190" y="168" text-anchor="middle">200 (~25 ms)</text></g>
<g data-s="4"><line class="sL" x1="90" y1="186" x2="286" y2="192" marker-end="url(#ah)"/><line class="sL" x1="290" y1="200" x2="476" y2="206" marker-end="url(#ah)"/><line class="sLg" x1="476" y1="214" x2="294" y2="220" marker-end="url(#ahg)"/><text class="sGt" x="385" y="232" text-anchor="middle">hit (~1 ms)</text><line class="sLg" x1="286" y1="228" x2="94" y2="234" marker-end="url(#ahg)"/><text class="sGt" x="190" y="246" text-anchor="middle">database untouched</text></g>
</svg><ol class="dia-steps">
<li>A request arrives. The API checks Redis first, using a key that includes the tenant. It's a miss.</li>
<li>So it runs the real query against the database.</li>
<li>It stores the result in Redis with a TTL and returns it. This first request paid for the cache.</li>
<li>The next request for the same key is a hit: about a millisecond, and the database never sees it. When an invoice is paid, the key (or its tag) is removed so the next read rebuilds it.</li>
</ol><figcaption>Cache-aside, the default pattern: the application reads through the cache and fills it on misses.</figcaption></figure>

```csharp
// Cache-aside with HybridCache (.NET 9+): in-memory L1 + Redis L2, with stampede protection built in
builder.Services.AddStackExchangeRedisCache(o => o.Configuration = builder.Configuration["Redis"]);
builder.Services.AddHybridCache(o => o.DefaultEntryOptions = new() { Expiration = TimeSpan.FromMinutes(5), LocalCacheExpiration = TimeSpan.FromMinutes(1) });

public class DashboardService(HybridCache cache, AppDbContext db)
{
    public ValueTask<DashboardSummary> GetSummaryAsync(Guid companyId, CancellationToken ct) =>
        cache.GetOrCreateAsync(
            $"dashboard:summary:{companyId}",                                   // tenant in the key!
            async token => await BuildSummaryFromDbAsync(companyId, token),
            tags: [$"company:{companyId}"],                                     // evict by tag later
            cancellationToken: ct);

    public Task OnInvoicePaidAsync(Guid companyId, CancellationToken ct) =>
        cache.RemoveByTagAsync($"company:{companyId}", ct).AsTask();           // invalidate on change
}
```

> [!mistake] Forgetting the tenant (or user) in the cache key
> `dashboard:summary` without the company ID serves one company's numbers to another, a tenant-isolation breach through the cache. Include every dimension the data depends on: tenant, user, culture, filters.

### Invalidation: the hard part ⭐

| Strategy | When |
|---|---|
| **TTL (time to live)** only | Data that can be stale for N minutes (rates, catalogues) |
| **Explicit eviction on write** | Remove or update the entry when the underlying data changes (above: on invoice paid) |
| **Tags / versioned keys** | Evict a group at once (`company:42`), or bump a version number in the key so old entries are simply never read again |
| **Events** | Other services publish "customer changed" and every cache holder evicts |

Combine them: evict on write **and** keep a TTL as a safety net, in case an eviction is missed.

<figure class="dia steps"><svg viewBox="0 0 720 210" role="img" aria-label="When a popular cache entry expires, every concurrent request queries the database; with per-key locking only one does and the rest wait for its result">
<text class="sT" x="180" y="22" text-anchor="middle">popular key expires</text><text class="sT" x="540" y="22" text-anchor="middle">with per-key locking</text>
<line class="sD" x1="360" y1="12" x2="360" y2="206"/>
<rect class="sB" x="20" y="40" width="70" height="18" rx="3"/><text class="sC" x="55" y="53" text-anchor="middle">req 1</text>
<g data-s="1"><line class="sLr" x1="90" y1="49" x2="236" y2="120" marker-end="url(#ahr)" opacity=".7"/></g>
<rect class="sB" x="380" y="40" width="70" height="18" rx="3"/><text class="sC" x="415" y="53" text-anchor="middle">req 1</text>
<rect class="sB" x="20" y="64" width="70" height="18" rx="3"/><text class="sC" x="55" y="77" text-anchor="middle">req 2</text>
<g data-s="1"><line class="sLr" x1="90" y1="73" x2="236" y2="120" marker-end="url(#ahr)" opacity=".7"/></g>
<rect class="sB" x="380" y="64" width="70" height="18" rx="3"/><text class="sC" x="415" y="77" text-anchor="middle">req 2</text>
<rect class="sB" x="20" y="88" width="70" height="18" rx="3"/><text class="sC" x="55" y="101" text-anchor="middle">req 3</text>
<g data-s="1"><line class="sLr" x1="90" y1="97" x2="236" y2="120" marker-end="url(#ahr)" opacity=".7"/></g>
<rect class="sB" x="380" y="88" width="70" height="18" rx="3"/><text class="sC" x="415" y="101" text-anchor="middle">req 3</text>
<rect class="sB" x="20" y="112" width="70" height="18" rx="3"/><text class="sC" x="55" y="125" text-anchor="middle">req 4</text>
<g data-s="1"><line class="sLr" x1="90" y1="121" x2="236" y2="120" marker-end="url(#ahr)" opacity=".7"/></g>
<rect class="sB" x="380" y="112" width="70" height="18" rx="3"/><text class="sC" x="415" y="125" text-anchor="middle">req 4</text>
<rect class="sB" x="20" y="136" width="70" height="18" rx="3"/><text class="sC" x="55" y="149" text-anchor="middle">req 5</text>
<g data-s="1"><line class="sLr" x1="90" y1="145" x2="236" y2="120" marker-end="url(#ahr)" opacity=".7"/></g>
<rect class="sB" x="380" y="136" width="70" height="18" rx="3"/><text class="sC" x="415" y="149" text-anchor="middle">req 5</text>
<rect class="sB" x="20" y="160" width="70" height="18" rx="3"/><text class="sC" x="55" y="173" text-anchor="middle">req 6</text>
<g data-s="1"><line class="sLr" x1="90" y1="169" x2="236" y2="120" marker-end="url(#ahr)" opacity=".7"/></g>
<rect class="sB" x="380" y="160" width="70" height="18" rx="3"/><text class="sC" x="415" y="173" text-anchor="middle">req 6</text>
<rect class="sR" x="232" y="96" width="116" height="50" rx="8"/><text class="sT" x="290" y="119" text-anchor="middle">database</text><text class="sC" x="290" y="135" text-anchor="middle">6 same queries</text>
<g data-s="2"><line class="sLg" x1="450" y1="49" x2="586" y2="110" marker-end="url(#ahg)"/><line class="sLm" x1="450" y1="73" x2="476" y2="73"/><line class="sLm" x1="450" y1="97" x2="476" y2="97"/><line class="sLm" x1="450" y1="121" x2="476" y2="121"/><line class="sLm" x1="450" y1="145" x2="476" y2="145"/><line class="sLm" x1="450" y1="169" x2="476" y2="169"/><text class="sGt" x="470" y="196" text-anchor="middle">one recomputes, five wait for it</text></g>
<rect class="sG" x="590" y="96" width="110" height="50" rx="8"/><text class="sT" x="645" y="119" text-anchor="middle">database</text><text class="sC" x="645" y="135" text-anchor="middle">1 query</text>
</svg><ol class="dia-steps">
<li>Without protection, every request that arrives during the rebuild misses and runs the same expensive query, at the worst possible moment.</li>
<li>With "single flight" (HybridCache does this per key), the first miss rebuilds the entry and the others await the same result. Jittered TTLs help too, so popular keys don't all expire together.</li>
</ol><figcaption>Cache stampede, and its fix.</figcaption></figure>

> [!term] Cache stampede (thundering herd)
> A popular entry expires and hundreds of concurrent requests all miss at once and hit the database together. Fixes: let **one** request recompute while others wait (`HybridCache` and `GetOrCreate` locking do this per key), add **random jitter** to TTLs so entries don't expire together, or refresh hot entries in the background before expiry.

> [!say]
> "I use cache-aside: check the cache, on a miss load from the database and store it with a TTL. The key includes the tenant and anything else the data depends on. I invalidate on writes, by key or by tag, and keep the TTL as a safety net. For hot keys I protect against stampedes so only one request rebuilds the entry; HybridCache in .NET does that and layers an in-memory cache over Redis."

### In-memory vs distributed 🟢 ⭐

| | `IMemoryCache` | Redis (`IDistributedCache`) | `HybridCache` |
|---|---|---|---|
| Speed | Fastest (no network) | ~sub-millisecond network hop | L1 speed, L2 sharing |
| Shared across instances | **No**: each server has its own copy, which can disagree | Yes | Yes (L2) |
| Survives restarts | No | Yes (if persistence is on) | L2 does |
| Fits | Single instance, or data where per-instance staleness is fine | Multiple instances, sessions, rate limits | Most new .NET code |

## B8.3 Redis beyond a cache 🟡

Redis is an in-memory data-structure server. Knowing its structures turns "I know Redis" into specific answers:

| Structure | Example use |
|---|---|
| **String** (with TTL) | Cached JSON, counters (`INCR`), OTP codes with expiry |
| **Hash** | An object's fields, e.g. a session |
| **List** | Simple queues, recent-activity feeds |
| **Set** | Unique visitors, tags |
| **Sorted set** | Leaderboards, rate-limit windows, scheduled items by time |
| **Streams** | A lightweight log with consumer groups |
| **Pub/Sub** | Fire-and-forget broadcast; used as the **SignalR backplane** across servers |

Also: distributed locks (with care), rate limiting, and session storage. Note the licensing history: Redis changed licence in 2024 (source-available), the community fork **Valkey** appeared under the Linux Foundation, and **Redis 8** (2025) added an open-source AGPL option. Azure's newer offering is **Azure Managed Redis**.

## B8.4 Why message queues 🟢 ⭐

A message broker lets services communicate **asynchronously**: the producer sends a message and moves on; consumers process it when they can.

<figure class="dia anim"><svg viewBox="0 0 720 170" role="img" aria-label="Animation: the API publishes messages to a broker queue; workers take them one at a time; a poison message fails, is retried, and is moved to the dead-letter queue">
<rect class="sA" x="20" y="55" width="130" height="56" rx="10"/><text class="sT" x="85" y="80" text-anchor="middle">API (producer)</text><text class="sS" x="85" y="98" text-anchor="middle">"InvoicePaid"</text>
<rect class="sW" x="240" y="35" width="220" height="96" rx="10"/><text class="sT" x="350" y="58" text-anchor="middle">Broker</text>
<rect class="sB" x="258" y="70" width="184" height="24" rx="5"/><text class="sS" x="350" y="87" text-anchor="middle">queue: ▮▮▮▮▮</text>
<rect class="sR" x="258" y="100" width="184" height="22" rx="5"/><text class="sS" x="350" y="116" text-anchor="middle">dead-letter queue</text>
<rect class="sG" x="560" y="20" width="140" height="44" rx="8"/><text class="sT" x="630" y="47" text-anchor="middle">Email worker</text>
<rect class="sG" x="560" y="80" width="140" height="44" rx="8"/><text class="sT" x="630" y="107" text-anchor="middle">Forecast worker</text>
<line class="sL" x1="150" y1="83" x2="240" y2="83"/><line class="sL" x1="460" y1="75" x2="560" y2="42"/><line class="sL" x1="460" y1="85" x2="560" y2="102"/>
<text class="sS" x="20" y="160">The API responds immediately; workers scale independently; failed messages are retried, then parked for inspection.</text>
<circle class="sPw" r="6" opacity="0"><animateMotion dur="10.0s" repeatCount="indefinite" calcMode="linear" path="M150 83 H350 L560 42" keyPoints="0;0;0.45;0.45;1;1" keyTimes="0;0.0300;0.0800;0.1200;0.1600;1"/><animate attributeName="opacity" dur="10.0s" repeatCount="indefinite" calcMode="discrete" values="0;1;0" keyTimes="0;0.0300;0.1650"/></circle>
<circle class="sPw" r="6" opacity="0"><animateMotion dur="10.0s" repeatCount="indefinite" calcMode="linear" path="M150 83 H350 L560 102" keyPoints="0;0;0.45;0.45;1;1" keyTimes="0;0.1700;0.2200;0.2600;0.3000;1"/><animate attributeName="opacity" dur="10.0s" repeatCount="indefinite" calcMode="discrete" values="0;1;0" keyTimes="0;0.1700;0.3050"/></circle>
<circle class="sPw" r="6" opacity="0"><animateMotion dur="10.0s" repeatCount="indefinite" calcMode="linear" path="M150 83 H350 L560 42" keyPoints="0;0;0.45;0.45;1;1" keyTimes="0;0.3100;0.3600;0.4000;0.4400;1"/><animate attributeName="opacity" dur="10.0s" repeatCount="indefinite" calcMode="discrete" values="0;1;0" keyTimes="0;0.3100;0.4450"/></circle>
<circle class="sPw" r="6" opacity="0"><animateMotion dur="10.0s" repeatCount="indefinite" calcMode="linear" path="M150 83 H350 L560 102" keyPoints="0;0;0.45;0.45;1;1" keyTimes="0;0.4500;0.5000;0.5400;0.5800;1"/><animate attributeName="opacity" dur="10.0s" repeatCount="indefinite" calcMode="discrete" values="0;1;0" keyTimes="0;0.4500;0.5850"/></circle>
<circle class="sPr" r="6" opacity="0"><animateMotion dur="10.0s" repeatCount="indefinite" calcMode="linear" path="M150 83 H350 L560 42 L350 83 L560 42 L350 83 L350 111" keyPoints="0;0;0.2;0.4;0.6;0.8;0.95;1;1" keyTimes="0;0.6000;0.6400;0.6800;0.7200;0.7600;0.8000;0.8300;1"/><animate attributeName="opacity" dur="10.0s" repeatCount="indefinite" calcMode="discrete" values="0;1;0" keyTimes="0;0.6000;0.9700"/></circle>
<text class="sRt" x="600" y="150" text-anchor="middle" opacity="0">poison → DLQ after retries<animate attributeName="opacity" dur="10.0s" repeatCount="indefinite" calcMode="discrete" values="0;1;0" keyTimes="0;0.8000;0.9700"/></text>
</svg><figcaption>A broker decouples the API from slow or unreliable work. Normal messages (orange) go to whichever worker is free; a poison message (red) fails, is retried, and is parked in the dead-letter queue instead of blocking the line.</figcaption></figure>

**What queues give you:**

- **Decoupling:** the producer doesn't know or wait for consumers; new consumers can be added without touching it.
- **Load levelling:** a burst of 10,000 uploads queues up instead of overwhelming the forecasting service.
- **Resilience:** if the email service is down, messages wait and are delivered when it's back.
- **Scaling:** add more consumer instances to drain the queue faster (competing consumers).

**What they cost:** eventual consistency, more moving parts, harder debugging, and delivery semantics you must design for.

| Term | Meaning |
|---|---|
| **Queue** (point-to-point) | Each message is processed by **one** consumer: work distribution |
| **Topic / pub-sub** | Each message is delivered to **every subscriber**: event broadcasting |
| **Command** vs **event** | "SendInvoiceEmail" (do this, one handler) vs "InvoicePaid" (this happened, anyone may react) |
| **Acknowledgement** | The consumer confirms success; unacknowledged messages are redelivered |
| **Dead-letter queue (DLQ)** | Where messages go after too many failed attempts, for inspection and replay |
| **Poison message** | One that always fails (bad data); without a DLQ it blocks or loops forever |

## B8.5 Delivery guarantees and idempotent consumers 🟡 ⭐

| Guarantee | Meaning | Reality |
|---|---|---|
| At-most-once | Delivered zero or one time | Messages can be lost |
| **At-least-once** | Delivered one or more times | **The common default**: duplicates happen |
| Exactly-once | Delivered and processed once | Only within narrow boundaries (e.g. Kafka transactions between Kafka topics). End to end, you build it as at-least-once plus **idempotent processing** |

> [!term] Idempotent consumer
> A consumer that produces the same result whether it handles a message once or five times. Common technique: record each processed **message ID** in a table in the **same transaction** as the business change, and skip IDs already seen. Or make the operation naturally idempotent ("set status to Paid" rather than "add 1 to the count").

> [!say]
> "Most brokers give at-least-once delivery, so duplicates will happen: after a consumer crash, a timeout or a redelivery. I make consumers idempotent by storing the processed message ID in the same transaction as the business change and skipping repeats, and failures retry with backoff before going to a dead-letter queue."

**Ordering:** most queues don't guarantee global order once you have several consumers. If order matters per entity, route by a key: Kafka keeps order **within a partition** (key by `invoiceId`); Azure Service Bus has **sessions**; RabbitMQ gives order within a single queue and consumer.

## B8.6 RabbitMQ, Kafka, Azure Service Bus 🟡 ⭐

| | **RabbitMQ** | **Apache Kafka** | **Azure Service Bus** |
|---|---|---|---|
| Model | A **message broker**: exchanges route messages to queues; consumed messages are removed | A distributed, partitioned **log**: messages are retained (days, or forever) and consumers track their own **offset** | A managed enterprise broker: queues and topics with subscriptions |
| Strengths | Flexible routing, per-message acknowledgements, priorities, easy to run | Very high throughput, **replay** from any point, many independent consumer groups, stream processing | Fully managed; sessions (ordering), dead-lettering, scheduled messages, duplicate detection, transactions |
| Ordering | Per queue | **Per partition** | Per session |
| Typical use | Task queues, commands, RPC-style work between services | Event streaming, analytics pipelines, change data capture, audit logs, event sourcing | Business workflows in Azure: orders, payments, integration |
| In .NET | `RabbitMQ.Client`, MassTransit | `Confluent.Kafka` | `Azure.Messaging.ServiceBus`, MassTransit |

Kafka is covered from the data-engineering side in [[DE8]]. **Azure Event Hubs** is Azure's Kafka-compatible event-streaming service; **Event Grid** routes lightweight events (a blob was created) to handlers.

> [!say]
> "RabbitMQ is a traditional broker: it routes messages to queues and deletes them once acknowledged, which suits task and command processing. Kafka is a partitioned, retained log: consumers track offsets, so many consumer groups can read the same stream independently and replay it, which suits event streaming and data pipelines. On Azure, Service Bus is the managed broker for business messaging, with sessions and dead-lettering built in."

**MassTransit** (a popular .NET abstraction over RabbitMQ, Service Bus and others) handles retries, the outbox and sagas for you; note that **MassTransit v9 moved to a commercial licence** in 2025–26, while v8 remains open source. Check the licence before choosing.

## B8.7 Publishing reliably: the transactional outbox 🟡 ⭐

The **dual-write problem:** you save an invoice payment to the database **and** publish `InvoicePaid` to the broker. If the process crashes between the two, either the database says paid but no event was sent (the email never goes out), or the event was sent but the transaction rolled back (an email for a payment that didn't happen). You can't make a database and a broker commit atomically.

> [!term] Transactional outbox
> Write the outgoing message into an **outbox table in the same database transaction** as the business change. A separate relay (a background service, or change-data-capture) reads unsent outbox rows, publishes them to the broker, and marks them sent. The message is guaranteed to be published **at least once** if and only if the business change committed, so consumers must be idempotent.

```csharp
await using var tx = await db.Database.BeginTransactionAsync(ct);
invoice.MarkPaid(clock.UtcNow);
db.OutboxMessages.Add(OutboxMessage.From(new InvoicePaid(invoice.Id, invoice.CompanyId, invoice.Amount)));
await db.SaveChangesAsync(ct);              // both rows, one transaction
await tx.CommitAsync(ct);
// OutboxRelay (BackgroundService) polls unsent rows → publishes → sets SentAt
```

The mirror image on the consumer side is the **inbox** (store processed message IDs), which gives you idempotency ([[B8.5]]).

<figure class="dia steps" data-start="1"><svg viewBox="0 0 720 220" role="img" aria-label="Transactional outbox: the business change and the outgoing message commit together; a relay publishes unsent rows; after a crash it may publish again, and an idempotent consumer skips the duplicate">
<rect class="sN" x="20" y="30" width="300" height="120" rx="10"/><text class="sC" x="170" y="50" text-anchor="middle">one database transaction</text>
<g data-s="1"><rect class="sA" x="36" y="62" width="130" height="30" rx="6"/><text class="sC" x="101" y="82" text-anchor="middle">invoice: Paid</text><rect class="sV" x="176" y="62" width="130" height="30" rx="6"/><text class="sC" x="241" y="82" text-anchor="middle">outbox: InvoicePaid</text><text class="sGt" x="170" y="124" text-anchor="middle">COMMIT: both or neither</text></g>
<g data-s="2"><rect class="sW" x="380" y="40" width="130" height="50" rx="8"/><text class="sT" x="445" y="63" text-anchor="middle">outbox relay</text><text class="sC" x="445" y="79" text-anchor="middle">polls unsent rows</text><line class="sLw" x1="306" y1="77" x2="376" y2="65" marker-end="url(#ahw)"/></g>
<g data-s="3-3"><line class="sL" x1="510" y1="65" x2="566" y2="65" marker-end="url(#ah)"/><rect class="sG" x="570" y="40" width="130" height="50" rx="8"/><text class="sT" x="635" y="63" text-anchor="middle">broker</text><text class="sC" x="635" y="79" text-anchor="middle">InvoicePaid</text><text class="sC" x="445" y="120" text-anchor="middle">publish, then mark SentAt</text></g>
<g data-s="4-5"><rect class="sR" x="380" y="104" width="320" height="40" rx="8" opacity=".85"/><text class="sC" x="540" y="122" text-anchor="middle">crash after publish, before marking sent?</text><text class="sC" x="540" y="137" text-anchor="middle">the relay publishes it again on restart</text></g>
<g data-s="5"><rect class="sG" x="570" y="160" width="130" height="50" rx="8"/><text class="sT" x="635" y="183" text-anchor="middle">consumer</text><text class="sC" x="635" y="199" text-anchor="middle">inbox: seen IDs</text><line class="sLg" x1="635" y1="90" x2="635" y2="158" marker-end="url(#ahg)"/><text class="sGt" x="360" y="200" text-anchor="middle">duplicates are harmless: the consumer skips message IDs it already processed</text></g>
</svg><ol class="dia-steps">
<li>The business change and the outgoing message are written in <b>one</b> local transaction. Either both exist or neither does: no event without data, no data without an event.</li>
<li>A relay (a background service, or change-data capture) reads outbox rows that haven't been sent.</li>
<li>It publishes each one to the broker, then marks it sent.</li>
<li>If it crashes after publishing but before marking, it will publish the same row again after restart. That's at-least-once delivery.</li>
<li>So the consumer is idempotent: it records processed message IDs (the inbox) and skips repeats.</li>
</ol><figcaption>Outbox on the way out, inbox on the way in: reliable messaging without a distributed transaction.</figcaption></figure>

> [!say]
> "Saving to the database and publishing to a broker can't be done atomically, so I use the outbox pattern: the event is written to an outbox table in the same transaction as the change, and a background relay publishes it afterwards. That guarantees the event goes out if and only if the data committed, at least once, so the consumers are idempotent."

## B8.8 Background jobs 🟢 🟡 ⭐

| Option | Durable (survives restart) | Retries | Dashboard | Scale-out | Fits |
|---|---|---|---|---|---|
| `BackgroundService` + `Channel<T>` | No | Hand-written | No | No | In-process, best-effort work |
| **Hangfire** | **Yes** (stored in SQL Server, Redis…) | **Automatic** with backoff | **Yes** | Multiple servers share the storage | Fire-and-forget, delayed and **recurring (cron)** jobs in .NET apps |
| **Quartz.NET** | Yes (with a job store) | Configurable | Third-party | Clustering | Complex scheduling |
| A **queue + worker service** | Yes (the broker) | Broker redelivery + DLQ | Broker tooling | Independent scaling | Cross-service work, high volume |
| **Azure Functions** with queue or timer triggers | Yes | Built in | Azure portal | Serverless | Event-driven work on Azure |

```csharp
// Hangfire: what FinSight used
BackgroundJob.Enqueue<IForecastService>(s => s.RecomputeAsync(companyId, CancellationToken.None));        // fire-and-forget
BackgroundJob.Schedule<IReminderService>(s => s.SendDueReminderAsync(invoiceId), TimeSpan.FromDays(3));    // delayed
RecurringJob.AddOrUpdate<ICfoAgentJob>("nightly-cfo-agent", j => j.RunAsync(), Cron.Daily(2));            // 02:00 daily
```

<figure class="dia"><svg viewBox="0 0 720 224" role="img" aria-label="Hangfire job states: enqueued, processing, succeeded or failed; failed jobs are scheduled for automatic retries">
<rect class="sB" x="40" y="70" width="130" height="38" rx="8"/><text class="sC" x="105" y="94" text-anchor="middle">Enqueued</text>
<rect class="sA" x="210" y="70" width="130" height="38" rx="8"/><text class="sC" x="275" y="94" text-anchor="middle">Processing</text>
<rect class="sG" x="400" y="30" width="130" height="38" rx="8"/><text class="sC" x="465" y="54" text-anchor="middle">Succeeded</text>
<rect class="sR" x="400" y="120" width="130" height="38" rx="8"/><text class="sC" x="465" y="144" text-anchor="middle">Failed</text>
<rect class="sW" x="580" y="120" width="130" height="38" rx="8"/><text class="sC" x="645" y="144" text-anchor="middle">Scheduled (retry)</text>
<rect class="sB" x="580" y="30" width="130" height="38" rx="8"/><text class="sC" x="645" y="54" text-anchor="middle">Deleted</text>
<line class="sLm" x1="170" y1="89" x2="206" y2="89" marker-end="url(#ahm)"/><line class="sLg" x1="340" y1="82" x2="396" y2="54" marker-end="url(#ahg)"/><line class="sLr" x1="340" y1="96" x2="396" y2="134" marker-end="url(#ahr)"/><line class="sLw" x1="530" y1="139" x2="576" y2="139" marker-end="url(#ahw)"/>
<path class="sLw" d="M645 158 C645 210 105 210 105 112" marker-end="url(#ahw)"/><text class="sC" x="375" y="214" text-anchor="middle">automatic retries with growing delays (10 by default), then it stays Failed for a human</text>
<line class="sLm" x1="530" y1="49" x2="576" y2="49" marker-end="url(#ahm)"/><text class="sC" x="553" y="40" text-anchor="middle">expiry</text>
</svg><figcaption>A durable job's life. Because a retry re-runs the whole job, jobs must be idempotent.</figcaption></figure>

**Job hygiene:** jobs must be **idempotent** (Hangfire retries them); pass IDs, not whole objects (the data may have changed); keep them short or checkpoint progress; set the tenant context explicitly; log a correlation ID; alert when the failed-job count rises.

> [!story]
> FinSight's **`CFOAgentJob`** ran on Hangfire: it prompted the LLM, parsed the output into structured JSON, and saved insights to the Alert table, plus nightly forecasting and re-forecasting after CSV uploads or invoice payments. Interview angle: "what happens if the LLM call fails halfway?". Answer: Hangfire retries with backoff, the job is idempotent per company and day, and repeated failures are visible on the dashboard. If you didn't build all of that, say what you would add.

> [!lab] Close the gap this weekend (from your gaps file)
> In FinSight (or a copy): (1) add **Redis** with `HybridCache` for the dashboard summary, keyed by tenant and invalidated by tag when an invoice is paid or a CSV is uploaded; (2) replace the direct "send alert email" call with a message on **RabbitMQ** or Azure Service Bus, written through an **outbox** table and consumed by an idempotent worker with a dead-letter queue. Add both to `compose.yaml`. That turns three gap keywords (Redis, caching, message queues) into real CV bullets.

## B8.9 Interview drill 🟢 ⭐

| Question | Strong short answer |
|---|---|
| What is cache-aside? | Read the cache; on a miss read the source and populate the cache; the app manages the cache explicitly. |
| How do you invalidate a cache? | Evict on writes by key or tag, version keys, plus a TTL as a safety net. |
| What's a cache stampede? | Many requests missing the same expired key at once and hammering the database; fix with per-key locking, jitter or early refresh. |
| In-memory vs distributed cache? | In-memory is per instance and fastest; distributed (Redis) is shared across instances and survives restarts; HybridCache combines them. |
| What must go into a cache key? | Every dimension the data depends on, especially the tenant or user. |
| Why use a message queue? | Decoupling, load levelling, resilience to downstream outages, and independent scaling of consumers. |
| Queue vs topic? | A queue delivers each message to one consumer; a topic delivers it to every subscriber. |
| What is at-least-once delivery? | Messages may be delivered more than once, so consumers must be idempotent. |
| How do you make a consumer idempotent? | Record processed message IDs in the same transaction as the change, or make the operation naturally idempotent. |
| What's a dead-letter queue? | Where messages go after repeated failures, so poison messages don't block processing and can be inspected. |
| RabbitMQ vs Kafka? | RabbitMQ routes and deletes messages after acknowledgement (tasks, commands); Kafka is a retained partitioned log with offsets and replay (streams, pipelines). |
| What is the outbox pattern? | Write the event to an outbox table in the same transaction as the data change, then publish it asynchronously. |
| How does Kafka keep order? | Only within a partition; key messages by entity to keep their order. |
| Hangfire vs BackgroundService? | Hangfire is durable with retries, scheduling and a dashboard; BackgroundService is in-process and best-effort. |

## Key takeaways

> [!check]
> - Ask "how stale can this be?" before caching; put the tenant in every key.
> - Cache-aside plus eviction on write plus a TTL; protect hot keys from stampedes.
> - Brokers give at-least-once delivery: idempotent consumers and dead-letter queues are mandatory.
> - RabbitMQ for task queues, Kafka for retained event streams, Service Bus for managed business messaging on Azure.
> - Never dual-write: use the outbox.

## Sources

- Microsoft Learn: [Caching in .NET](https://learn.microsoft.com/en-us/aspnet/core/performance/caching/overview), [HybridCache library](https://learn.microsoft.com/en-us/aspnet/core/performance/caching/hybrid), [Distributed caching](https://learn.microsoft.com/en-us/aspnet/core/performance/caching/distributed), [Cache-aside pattern](https://learn.microsoft.com/en-us/azure/architecture/patterns/cache-aside), [Transactional outbox pattern](https://learn.microsoft.com/en-us/azure/architecture/databases/guide/transactional-outbox-cosmos), [Competing consumers pattern](https://learn.microsoft.com/en-us/azure/architecture/patterns/competing-consumers), [Azure Service Bus messaging overview](https://learn.microsoft.com/en-us/azure/service-bus-messaging/service-bus-messaging-overview).
- [Redis documentation: data types](https://redis.io/docs/latest/develop/data-types/) · [Valkey](https://valkey.io/).
- [RabbitMQ tutorials and reliability guide](https://www.rabbitmq.com/docs/reliability) · [Apache Kafka documentation: design](https://kafka.apache.org/documentation/#design).
- [Hangfire documentation](https://docs.hangfire.io/) · [MassTransit documentation](https://masstransit.io/).
- Chris Richardson, [microservices.io: Transactional outbox](https://microservices.io/patterns/data/transactional-outbox.html), [Idempotent consumer](https://microservices.io/patterns/communication-style/idempotent-consumer.html).
- Gregor Hohpe and Bobby Woolf, *Enterprise Integration Patterns* (2003).
