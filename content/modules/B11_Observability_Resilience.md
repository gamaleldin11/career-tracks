# Observability and Resilience — Logs, Metrics, Traces, OpenTelemetry, SLOs and Polly

"The API is slow for some users. What do you do?" and "the payment provider is timing out. How does your system behave?" are two of the best mid-level questions, because they show whether you've thought about software **running**, not just compiling. Your gaps file flags this: FinSight logs to a file, and Serilog plus OpenTelemetry would "visibly raise production readiness" in about two hours. This module gives you the concepts and the code.

> [!focus]
> **Entry must:** structured logging with log levels; what metrics and traces are; health checks; retries and timeouts.
> **Mid adds:** OpenTelemetry tracing and metrics in ASP.NET Core, correlation across services, percentiles, SLIs, SLOs and error budgets, alerting on symptoms, circuit breakers and bulkheads, the standard resilience handler, liveness vs readiness, diagnosing production issues.
> **Most asked:** *How do you debug a production issue?* · *What's structured logging?* · *Logs vs metrics vs traces?* · *What is distributed tracing?* · *What's a circuit breaker?* · *How do you retry safely?* · *What is an SLO?*
> **Time budget:** 3 hours.

## B11.1 Monitoring vs observability 🟢

**Monitoring** answers questions you knew to ask ("is CPU above 80%?"). **Observability** lets you answer questions you **didn't** anticipate ("why are only Android users in Alexandria seeing slow invoice saves since yesterday's release?") from the telemetry the system emits.

| Signal | What it is | Answers | Cost |
|---|---|---|---|
| **Logs** | Timestamped records of discrete events, ideally structured | What exactly happened in this request? | High volume |
| **Metrics** | Numeric measurements aggregated over time (counters, gauges, histograms) | Is something wrong, and how much? Trends, alerts | Cheap |
| **Traces** | The path of one request through services, as a tree of timed **spans** | Where did the time go? Which service failed? | Medium (usually sampled) |

## B11.2 Structured logging 🟢 ⭐

> [!term] Structured logging
> Logging **events with named properties** instead of formatted strings, so tools can filter and aggregate by those properties (`InvoiceId = 42`, `ElapsedMs > 500`) rather than searching text.

```csharp
// ✅ message template: InvoiceId and ElapsedMs are captured as properties
_logger.LogInformation("Invoice {InvoiceId} paid in {ElapsedMs} ms by {UserId}", invoice.Id, sw.ElapsedMilliseconds, userId);

// ❌ interpolation: one opaque string, and the formatting work happens even if the level is disabled
_logger.LogInformation($"Invoice {invoice.Id} paid in {sw.ElapsedMilliseconds} ms");
```

| Level | Use for |
|---|---|
| `Trace` / `Debug` | Detailed diagnostics; off in production |
| `Information` | Normal significant events: request finished, job completed, invoice paid |
| `Warning` | Unexpected but handled: a retry happened, a fallback was used |
| `Error` | A failure in the current operation (with the exception) |
| `Critical` | The app or a major function is down |

**Good practice:** a **correlation ID or trace ID** on every log entry (log scopes, [[B3.2]]); context such as tenant and user ID; **never** passwords, tokens or full card numbers, and mask personal data ([[S9.12]]); configure levels per category in `appsettings.json`; ship logs to a central store (Application Insights, Seq, Elasticsearch, Loki), not files on a container that will disappear. For hot paths, the `[LoggerMessage]` source generator avoids allocations.

**Serilog** is the popular .NET logging library: structured by design, with many "sinks" (console JSON, Seq, Elasticsearch, Application Insights) and enrichers. It plugs into `ILogger`, so the code above doesn't change.

## B11.3 Metrics and percentiles 🟡 ⭐

**What to measure for every service (the RED method):** **R**ate (requests per second), **E**rrors (failed requests per second, or the error ratio), **D**uration (latency distribution). For resources (CPU, memory, connection pools, queues), the **USE** method: **U**tilisation, **S**aturation, **E**rrors.

> [!term] Percentile latency (p50, p95, p99)
> p95 = 400 ms means 95% of requests were faster than 400 ms and 5% slower. **Averages hide pain**: a 120 ms average can include a p99 of 4 seconds, and those slowest requests are often your biggest customers or most important operations. Alert and set objectives on high percentiles.

```csharp
public class InvoiceMetrics
{
    private readonly Counter<long> _paid;
    private readonly Histogram<double> _importSeconds;
    public InvoiceMetrics(IMeterFactory meters)
    {
        var meter = meters.Create("FinSight.Invoices");
        _paid = meter.CreateCounter<long>("invoices.paid");
        _importSeconds = meter.CreateHistogram<double>("csv.import.duration", unit: "s");
    }
    public void Paid(string tenant) => _paid.Add(1, new KeyValuePair<string, object?>("tenant", tenant));
    public void Imported(double seconds) => _importSeconds.Record(seconds);
}
```

ASP.NET Core and `HttpClient` already emit standard metrics (request duration, active requests, connection counts) through `System.Diagnostics.Metrics`.

> [!warning] Cardinality
> Every distinct combination of metric tag values is a separate time series. Tagging by tenant is fine for a few hundred tenants; tagging by user ID or invoice ID explodes storage and cost. Put high-cardinality details in logs and traces instead.

## B11.4 Distributed tracing 🟡 ⭐

> [!term] Trace and span
> A **trace** is the full journey of one request. It's made of **spans**: timed operations (the HTTP request, a database query, a call to TimeGPT, a message being processed), each with a parent, forming a tree. Every span carries the same **trace ID**, propagated between services in the W3C **`traceparent`** header (and through message metadata for queues).

```text
POST /api/invoices/7/pay                          420 ms
├─ SQL: SELECT invoice …                           12 ms
├─ HTTP POST paymob /charge                       310 ms   ← the slow part
├─ SQL: UPDATE invoice; INSERT outbox              18 ms
└─ publish InvoicePaid (via outbox relay)           —     (continues in another trace segment)
```

With tracing, "why is this request slow?" becomes **looking at the waterfall**, not guessing. In .NET, spans are `System.Diagnostics.Activity` objects; ASP.NET Core, `HttpClient`, EF Core and SQL client libraries create them automatically once a listener (OpenTelemetry) is attached.

## B11.5 OpenTelemetry in ASP.NET Core 🟡 ⭐

> [!term] OpenTelemetry (OTel)
> A vendor-neutral CNCF standard and set of SDKs for producing **traces, metrics and logs**, exported over **OTLP** to any back end: Azure Monitor/Application Insights, Grafana (Tempo, Prometheus, Loki), Jaeger, Datadog, Elastic. You instrument once, then choose or change the vendor in configuration.

```csharp
builder.Services.AddOpenTelemetry()
    .ConfigureResource(r => r.AddService("finsight-api", serviceVersion: "1.4.0"))
    .WithTracing(t => t
        .AddAspNetCoreInstrumentation()
        .AddHttpClientInstrumentation()
        .AddEntityFrameworkCoreInstrumentation()
        .AddSource("FinSight.*")                  // your own ActivitySources
        .AddOtlpExporter())
    .WithMetrics(m => m
        .AddAspNetCoreInstrumentation()
        .AddHttpClientInstrumentation()
        .AddRuntimeInstrumentation()
        .AddMeter("FinSight.*")
        .AddOtlpExporter());
builder.Logging.AddOpenTelemetry(o => { o.IncludeScopes = true; o.IncludeFormattedMessage = true; });
// On Azure: builder.Services.AddOpenTelemetry().UseAzureMonitor();  (the Azure Monitor distro)
```

Locally, the **Aspire dashboard** (a standalone container image) receives OTLP and shows traces, metrics and structured logs, which is perfect for a demo.

> [!say]
> "I instrument with OpenTelemetry: ASP.NET Core, HttpClient and EF Core produce spans and metrics automatically, I add my own spans and counters for business operations, and everything goes over OTLP to Application Insights or Grafana. Logs are structured and carry the trace ID, so from an alert I can jump to the slow trace and from there to the exact log lines."

## B11.6 Health checks 🟢 🟡 ⭐

| Probe | Question | If it fails | Should check |
|---|---|---|---|
| **Liveness** | Is the process alive and not deadlocked? | **Restart** the container | Almost nothing: the app responds |
| **Readiness** | Can it serve traffic right now? | **Stop sending traffic** (don't restart) | Database, cache, critical dependencies, warm-up done |
| **Startup** | Has it finished starting? | Wait (for slow starts) | Migrations or cache warm-up complete |

```csharp
builder.Services.AddHealthChecks()
    .AddCheck("self", () => HealthCheckResult.Healthy(), tags: ["live"])
    .AddDbContextCheck<AppDbContext>(tags: ["ready"])
    .AddRedis(redisConn, tags: ["ready"]);                    // AspNetCore.HealthChecks.Redis package
app.MapHealthChecks("/health/live",  new() { Predicate = c => c.Tags.Contains("live") });
app.MapHealthChecks("/health/ready", new() { Predicate = c => c.Tags.Contains("ready") });
```

> [!mistake] Checking the database in the liveness probe
> If the database blips, every instance fails liveness and gets **restarted** at once, turning a short dependency outage into a full outage. Dependencies belong in **readiness**.

> [!story]
> FinSight split health checks into **live** and **full**. That's exactly liveness vs readiness, and you can explain why the split matters for Docker health-gated start-up and for a cloud load balancer.

## B11.7 SLIs, SLOs, SLAs and error budgets 🟡 ⭐

| Term | Meaning | Example |
|---|---|---|
| **SLI** (indicator) | A measurement of user experience | The share of `GET /dashboard` requests answered successfully in under 500 ms |
| **SLO** (objective) | The internal target for an SLI over a window | 99.5% over 30 days |
| **SLA** (agreement) | A contract with customers, with consequences | 99.9% monthly uptime or service credits |
| **Error budget** | 100% − SLO: how much failure is acceptable | 0.5% of 30 days ≈ **3.6 hours** of "bad" time per month |

When the budget is healthy, ship faster; when it's spent, prioritise reliability work. That turns reliability into a shared, measurable decision instead of an argument.

**Alert on symptoms, not causes:** page a human when users are hurting (the SLO is burning fast: error rate or p99 latency), not when CPU hits 80% while users are fine. Every page needs a runbook; noisy alerts get ignored (**alert fatigue**).

## B11.8 Resilience: surviving dependencies that fail 🟡 ⭐

Every network call can be slow, fail, or fail intermittently. Resilience patterns, usually combined:

| Pattern | What it does | Watch out |
|---|---|---|
| **Timeout** | Give up after N seconds instead of hanging threads and connections | Always set one; the default `HttpClient` timeout is 100 s |
| **Retry** with **exponential backoff and jitter** | Retry transient failures (network errors, 408, 429, 5xx) after 0.2 s, 0.4 s, 0.8 s…, plus randomness so clients don't retry in sync | Only **idempotent** operations ([[B4.4]]); cap attempts; respect `Retry-After` |
| **Circuit breaker** | After many failures, **stop calling** the dependency for a while (open), then let a test call through (half-open), then resume (closed) | Fail fast with a clear error or fallback while open |
| **Bulkhead** | Limit concurrent calls to a dependency, so one slow dependency can't consume every thread or connection | Size per dependency |
| **Fallback** | Return a cached value, a default, or a degraded response | Make degradation visible to users and in metrics |
| **Rate limiting / load shedding** | Reject excess load early (429/503) instead of collapsing | Prioritise important traffic |

> [!term] Circuit breaker
> A wrapper that tracks failures to a dependency. When failures pass a threshold, it **opens** and fails calls immediately for a cool-down period, protecting both your service (no threads stuck waiting) and the struggling dependency (no retry storm). Then it lets a trial request through, and closes again if it succeeds.

```csharp
// Microsoft.Extensions.Http.Resilience (built on Polly v8): sensible defaults in one line
builder.Services.AddHttpClient<IPaymentGateway, PaymobGateway>()
    .AddStandardResilienceHandler(o =>
    {
        o.AttemptTimeout.Timeout = TimeSpan.FromSeconds(5);        // per try
        o.TotalRequestTimeout.Timeout = TimeSpan.FromSeconds(20);  // overall
        o.Retry.MaxRetryAttempts = 3;                               // exponential backoff with jitter
        o.CircuitBreaker.FailureRatio = 0.5;                        // open at 50% failures in the sampling window
    });
```

The standard handler stacks a rate limiter, total timeout, retry, circuit breaker and per-attempt timeout in the right order. **Polly v8** "resilience pipelines" let you build the same for databases, queues or any code.

> [!say]
> "Every outbound call gets a timeout. Transient failures on idempotent calls are retried with exponential backoff and jitter, a few times only. A circuit breaker stops us hammering a dependency that's down, so we fail fast and show a fallback, and bulkheads stop one slow dependency from exhausting our threads. In .NET the standard resilience handler on HttpClient gives you that stack with good defaults."

> [!mistake] Retry storms
> Retries at every layer (the browser retries, the API retries, the HTTP client retries, the database driver retries) multiply load on an already-failing dependency: three layers of three retries is 27× traffic. Retry at **one** layer, with backoff, jitter and a circuit breaker.

## B11.9 Debugging production 🟡 ⭐

"Users say the API is slow. What do you do?":

1. **Scope it:** all endpoints or one? All tenants or one? Since when, and did a deployment happen then? Check dashboards (RED metrics, p95/p99) and the release timeline.
2. **Follow a slow trace** to the slow span: a query, an external call, a lock, a queue backlog.
3. **Read the logs** for that trace ID.
4. **Check resources:** CPU, memory and GC, thread-pool starvation (often caused by sync-over-async, [[B1.7]]), database waits and blocking, connection-pool exhaustion.
5. **Mitigate first** (roll back, scale out, disable a feature flag, open a circuit), **then** fix the root cause.
6. **Blameless post-mortem:** timeline, impact, root cause, what we'll change.

**.NET diagnostic tools:** `dotnet-counters` (live CPU, GC, thread pool, exception rate, request rate), `dotnet-trace` (CPU and event traces for PerfView or Visual Studio), `dotnet-dump` (memory dumps for leaks and hangs), `dotnet-gcdump`.

> [!lab] Two hours to production-grade telemetry (from your gaps file)
> In FinSight: switch logging to structured (Serilog or the OpenTelemetry logger) with tenant and trace IDs; add OpenTelemetry tracing and metrics for ASP.NET Core, HttpClient and EF Core; run the **Aspire dashboard** container from `compose.yaml` and watch a request's waterfall (API → SQL → TimeGPT). Add `AddStandardResilienceHandler` to the TimeGPT client, then kill the network to it and watch the retries and the circuit open. Screenshot the trace view for your README.

## B11.10 Interview drill 🟢 ⭐

| Question | Strong short answer |
|---|---|
| Logs vs metrics vs traces? | Logs record discrete events; metrics are cheap aggregated numbers for trends and alerts; traces show one request's path and timing across services. |
| What is structured logging? | Logging events with named properties (message templates) so they can be queried and aggregated. |
| Why use percentiles, not averages? | Averages hide the slow tail; p95 and p99 show what the slowest users experience. |
| What is distributed tracing? | Following a request across services via a shared trace ID and timed spans, propagated in the traceparent header. |
| What is OpenTelemetry? | A vendor-neutral standard and SDKs for traces, metrics and logs, exported over OTLP to any back end. |
| Liveness vs readiness? | Liveness: is it alive (restart if not); readiness: can it take traffic (stop routing if not). Dependencies go in readiness. |
| SLI vs SLO vs SLA? | A measurement / an internal target for it / a contractual promise with penalties. |
| What's an error budget? | The allowed unreliability (100% − SLO), spent on releases and incidents. |
| How do you retry safely? | Only idempotent, transient failures; exponential backoff with jitter; a capped number of attempts; one layer only. |
| What's a circuit breaker? | It stops calling a failing dependency after a failure threshold, fails fast, then tests recovery. |
| What's a bulkhead? | Isolating resources (concurrency limits) per dependency so one slow dependency can't exhaust everything. |
| How do you investigate a slow API? | Scope with metrics, follow a slow trace to the slow span, read correlated logs, check resources and recent deploys, mitigate, then fix. |
| What is thread-pool starvation? | All pool threads blocked (often sync-over-async), so requests queue even with low CPU. |

## Key takeaways

> [!check]
> - Structured logs with trace IDs, RED metrics with percentiles, and distributed traces: instrument once with OpenTelemetry.
> - Dependencies belong in readiness, never liveness.
> - Set SLOs, alert on symptoms, and keep runbooks.
> - Timeouts everywhere; retries only for idempotent transient failures, with backoff and jitter; circuit breakers and bulkheads to contain failures.
> - In incidents: mitigate first, root-cause second, blameless post-mortem always.

## Sources

- [OpenTelemetry documentation](https://opentelemetry.io/docs/) and [.NET getting started](https://opentelemetry.io/docs/languages/dotnet/getting-started/); W3C [Trace Context](https://www.w3.org/TR/trace-context/).
- Microsoft Learn: [Logging in .NET](https://learn.microsoft.com/en-us/dotnet/core/extensions/logging), [High-performance logging](https://learn.microsoft.com/en-us/dotnet/core/extensions/high-performance-logging), [.NET observability with OpenTelemetry](https://learn.microsoft.com/en-us/dotnet/core/diagnostics/observability-with-otel), [Creating metrics](https://learn.microsoft.com/en-us/dotnet/core/diagnostics/metrics-instrumentation), [Health checks in ASP.NET Core](https://learn.microsoft.com/en-us/aspnet/core/host-and-deploy/health-checks), [Build resilient HTTP apps](https://learn.microsoft.com/en-us/dotnet/core/resilience/http-resilience), [Circuit breaker pattern](https://learn.microsoft.com/en-us/azure/architecture/patterns/circuit-breaker), [Retry pattern](https://learn.microsoft.com/en-us/azure/architecture/patterns/retry), [Bulkhead pattern](https://learn.microsoft.com/en-us/azure/architecture/patterns/bulkhead), [dotnet-counters](https://learn.microsoft.com/en-us/dotnet/core/diagnostics/dotnet-counters).
- [Polly documentation](https://www.pollydocs.org/) · [Serilog](https://serilog.net/).
- Google, [*Site Reliability Engineering*](https://sre.google/sre-book/table-of-contents/) and [*The Site Reliability Workbook*](https://sre.google/workbook/table-of-contents/) (free online): SLOs, error budgets, alerting on symptoms.
- Tom Wilkie, the RED method; Brendan Gregg, [the USE method](https://www.brendangregg.com/usemethod.html).
- AWS Architecture Blog, [Exponential backoff and jitter](https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/).
