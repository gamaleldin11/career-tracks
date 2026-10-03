# Caching, Message Queues and Background Jobs — Redis, RabbitMQ, Kafka, Hangfire and the Outbox

These are the three topics your gaps file lists as blocking the most backend jobs: **Redis**, **message queues** and **jobs at scale**. You already have the hardest part, which is the instinct to move slow work out of the request (FinSight's Hangfire forecasting job and background re-forecasting). This module adds the vocabulary and patterns interviewers expect, so you can talk about caching and messaging as confidently as you talk about EF Core, and it ends with a lab that closes the gap for real.

> [!focus]
> **Entry must:** why and where to cache; cache-aside; TTLs and invalidation; why queues decouple services; producer, consumer, queue and topic; at-least-once delivery and idempotent consumers; background jobs.
> **Mid adds:** cache stampede, distributed vs in-memory cache, HybridCache, Redis data structures, RabbitMQ vs Kafka vs Azure Service Bus, dead-letter queues, ordering, the transactional outbox, retries with backoff, Hangfire vs hosted services.
> **Most asked:** *How would you cache this?* · *How do you invalidate a cache?* · *What's a cache stampede?* · *Why use a message queue?* · *RabbitMQ vs Kafka?* · *What is at-least-once delivery?* · *How do you publish an event reliably after saving to the database?*
> **Time budget:** 4 hours, plus the lab.

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

<figure class="dia"><svg viewBox="0 0 720 170" role="img" aria-label="Producer, broker with queue and dead-letter queue, consumers">
<rect class="sA" x="20" y="55" width="130" height="56" rx="10"/><text class="sT" x="85" y="80" text-anchor="middle">API (producer)</text><text class="sS" x="85" y="98" text-anchor="middle">"InvoicePaid"</text>
<rect class="sW" x="240" y="35" width="220" height="96" rx="10"/><text class="sT" x="350" y="58" text-anchor="middle">Broker</text>
<rect class="sB" x="258" y="70" width="184" height="24" rx="5"/><text class="sS" x="350" y="87" text-anchor="middle">queue: ▮▮▮▮▮</text>
<rect class="sR" x="258" y="100" width="184" height="22" rx="5"/><text class="sS" x="350" y="116" text-anchor="middle">dead-letter queue</text>
<rect class="sG" x="560" y="20" width="140" height="44" rx="8"/><text class="sT" x="630" y="47" text-anchor="middle">Email worker</text>
<rect class="sG" x="560" y="80" width="140" height="44" rx="8"/><text class="sT" x="630" y="107" text-anchor="middle">Forecast worker</text>
<line class="sL" x1="150" y1="83" x2="240" y2="83"/><line class="sL" x1="460" y1="75" x2="560" y2="42"/><line class="sL" x1="460" y1="85" x2="560" y2="102"/>
<text class="sS" x="20" y="160">The API responds immediately; workers scale independently; failed messages are retried, then parked for inspection.</text>
</svg><figcaption>A broker decouples the API from slow or unreliable work.</figcaption></figure>

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
