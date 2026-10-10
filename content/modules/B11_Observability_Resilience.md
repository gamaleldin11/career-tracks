# Observability and Resilience — Logs, Metrics, Traces, OpenTelemetry, SLOs and Polly

"The API is slow for some users. What do you do?" and "the payment provider is timing out. How does your system behave?" are two of the best mid-level questions, because they show whether you've thought about software **running**, not just compiling. Your gaps file flags this: FinSight logs to a file, and Serilog plus OpenTelemetry would "visibly raise production readiness" in about two hours. This module gives you the concepts and the code.

> [!focus]
> **Entry must:** structured logging with log levels; what metrics and traces are; health checks; retries and timeouts.
> **Mid adds:** OpenTelemetry tracing and metrics in ASP.NET Core, correlation across services, percentiles, SLIs, SLOs and error budgets, alerting on symptoms, circuit breakers and bulkheads, the standard resilience handler, liveness vs readiness, diagnosing production issues.
> **Most asked:** *How do you debug a production issue?* · *What's structured logging?* · *Logs vs metrics vs traces?* · *What is distributed tracing?* · *What's a circuit breaker?* · *How do you retry safely?* · *What is an SLO?*
> **Time budget:** 3 hours.

## B11.0 Foundations: what telemetry is and how it travels 🟢

You can't attach a debugger to production. Instead, the running system **emits telemetry** (records of what it's doing) and you study it from outside. Three facts shape every decision in this module:

- **It's a pipeline.** Your code emits; an SDK batches and samples; a collector filters and routes; a back end stores and indexes; dashboards and alerts read it.
- **It costs money.** Every log line and every distinct metric series is stored and indexed. Volume, retention and **cardinality** (how many distinct label combinations) drive the bill.
- **Sampling.** Recording every trace of a busy service is expensive, so most systems keep a percentage, plus every trace that contains an error or is unusually slow.

<figure class="dia anim"><svg viewBox="0 0 720 162" role="img" aria-label="Animation: telemetry flows from the application code through the OpenTelemetry SDK and a collector to a back end where people see dashboards and alerts">
<rect class="sA" x="8" y="50" width="132" height="54" rx="8"/><text class="sT" x="74" y="75" text-anchor="middle">your code</text><text class="sC" x="74" y="91" text-anchor="middle">emits signals</text>
<line class="sLm" x1="140" y1="77" x2="150" y2="77" marker-end="url(#ahm)"/>
<rect class="sV" x="152" y="50" width="132" height="54" rx="8"/><text class="sT" x="218" y="75" text-anchor="middle">OTel SDK</text><text class="sC" x="218" y="91" text-anchor="middle">batch · sample</text>
<line class="sLm" x1="284" y1="77" x2="294" y2="77" marker-end="url(#ahm)"/>
<rect class="sW" x="296" y="50" width="132" height="54" rx="8"/><text class="sT" x="362" y="75" text-anchor="middle">collector</text><text class="sC" x="362" y="91" text-anchor="middle">filter · route</text>
<line class="sLm" x1="428" y1="77" x2="438" y2="77" marker-end="url(#ahm)"/>
<rect class="sB" x="440" y="50" width="132" height="54" rx="8"/><text class="sT" x="506" y="75" text-anchor="middle">back end</text><text class="sC" x="506" y="91" text-anchor="middle">store · index</text>
<line class="sLm" x1="572" y1="77" x2="582" y2="77" marker-end="url(#ahm)"/>
<rect class="sG" x="584" y="50" width="132" height="54" rx="8"/><text class="sT" x="650" y="75" text-anchor="middle">you</text><text class="sC" x="650" y="91" text-anchor="middle">dashboards · alerts</text>
<circle class="sP" r="5"><animateMotion dur="4s" begin="0.0s" repeatCount="indefinite" path="M140 77 H584"/></circle>
<circle class="sPg" r="5"><animateMotion dur="4s" begin="1.2s" repeatCount="indefinite" path="M140 77 H584"/></circle>
<circle class="sPw" r="5"><animateMotion dur="4s" begin="2.4s" repeatCount="indefinite" path="M140 77 H584"/></circle>
<text class="sS" x="360" y="130" text-anchor="middle">logs, metrics and traces travel the same road, usually over OTLP</text>
<text class="sC" x="360" y="150" text-anchor="middle">Prometheus-style systems instead scrape a /metrics endpoint on a schedule (pull)</text>
</svg><figcaption>The telemetry pipeline. Instrument once with OpenTelemetry; the back end can change without touching the code.</figcaption></figure>

## B11.1 Monitoring vs observability 🟢

**Monitoring** answers questions you knew to ask ("is CPU above 80%?"). **Observability** lets you answer questions you **didn't** anticipate ("why are only Android users in Alexandria seeing slow invoice saves since yesterday's release?") from the telemetry the system emits.

| Signal | What it is | Answers | Cost |
|---|---|---|---|
| **Logs** | Timestamped records of discrete events, ideally structured | What exactly happened in this request? | High volume |
| **Metrics** | Numeric measurements aggregated over time (counters, gauges, histograms) | Is something wrong, and how much? Trends, alerts | Cheap |
| **Traces** | The path of one request through services, as a tree of timed **spans** | Where did the time go? Which service failed? | Medium (usually sampled) |

<figure class="dia"><svg viewBox="0 0 720 184" role="img" aria-label="One incident through three signals: a p99 latency metric spikes, a trace shows the payment call is slow, and a log with the same trace ID shows the provider returned 503">
<rect class="sB" x="14" y="24" width="220" height="150" rx="10"/><text class="sT" x="124" y="44" text-anchor="middle">metric: p99 latency</text>
<polyline class="sLr" points="24,150 60,148 90,146 120,150 150,80 170,70 200,76 224,78"/><text class="sRt" x="124" y="166" text-anchor="middle">something is wrong since 14:05</text>
<rect class="sB" x="250" y="24" width="220" height="150" rx="10"/><text class="sT" x="360" y="44" text-anchor="middle">trace: one slow request</text>
<rect class="sA" x="262" y="58" width="200" height="18" rx="3"/><text class="sC" x="266" y="71">POST /pay</text>
<rect class="sG" x="266" y="82" width="14" height="18" rx="3"/><text class="sC" x="270" y="95">SELECT</text>
<rect class="sR" x="282" y="106" width="150" height="18" rx="3"/><text class="sC" x="286" y="119">paymob /charge</text>
<rect class="sG" x="437" y="130" width="25" height="18" rx="3"/><text class="sC" x="441" y="143">SQL</text>
<text class="sRt" x="360" y="166" text-anchor="middle">where: the payment call</text>
<rect class="sB" x="486" y="24" width="220" height="150" rx="10"/><text class="sT" x="596" y="44" text-anchor="middle">log, same trace ID</text>
<text class="sC" x="498" y="70" xml:space="preserve" style="white-space:pre">14:06:11 Warning</text>
<text class="sC" x="498" y="88" xml:space="preserve" style="white-space:pre">Paymob retry 2 of 3</text>
<text class="sC" x="498" y="106" xml:space="preserve" style="white-space:pre">status 503</text>
<text class="sC" x="498" y="124" xml:space="preserve" style="white-space:pre">traceId 4bf9…</text>
<text class="sC" x="498" y="142" xml:space="preserve" style="white-space:pre">tenant c-42</text>
<text class="sRt" x="596" y="166" text-anchor="middle">why: provider returning 503</text>
<line class="sLm" x1="234" y1="100" x2="248" y2="100" marker-end="url(#ahm)"/><line class="sLm" x1="470" y1="100" x2="484" y2="100" marker-end="url(#ahm)"/>
</svg><figcaption>Metrics tell you something is wrong, traces tell you where, logs tell you why. The trace ID is what links them.</figcaption></figure>

## B11.2 Structured logging 🟢 ⭐

> [!term] Structured logging
> Logging **events with named properties** instead of formatted strings, so tools can filter and aggregate by those properties (`InvoiceId = 42`, `ElapsedMs > 500`) rather than searching text.

```csharp
// ✅ message template: InvoiceId and ElapsedMs are captured as properties
_logger.LogInformation("Invoice {InvoiceId} paid in {ElapsedMs} ms by {UserId}", invoice.Id, sw.ElapsedMilliseconds, userId);

// ❌ interpolation: one opaque string, and the formatting work happens even if the level is disabled
_logger.LogInformation($"Invoice {invoice.Id} paid in {sw.ElapsedMilliseconds} ms");
```

<figure class="dia"><svg viewBox="0 0 720 304" role="img" aria-label="The JSON emitted for a message template contains InvoiceId, ElapsedMs and UserId as separate properties plus the shared template, so it can be filtered and grouped; the interpolated string emits only the formatted text, whose template differs for every invoice">
<text class="sGt" x="14" y="28">message template</text><text class="sS" x="14" y="46" xml:space="preserve" style="white-space:pre">LogInformation("Invoice {InvoiceId} paid in {ElapsedMs} ms by {UserId}", …)</text>
<rect class="sG" x="14" y="58" width="116.8" height="26" rx="5" opacity=".4"/><text class="sS" x="22" y="76" xml:space="preserve" style="white-space:pre">InvoiceId = 42</text>
<rect class="sG" x="138.8" y="58" width="124" height="26" rx="5" opacity=".4"/><text class="sS" x="146.8" y="76" xml:space="preserve" style="white-space:pre">ElapsedMs = 731</text>
<rect class="sG" x="270.8" y="58" width="124" height="26" rx="5" opacity=".4"/><text class="sS" x="278.8" y="76" xml:space="preserve" style="white-space:pre">UserId = "u-17"</text>
<rect class="sN" x="14" y="90" width="556" height="26" rx="5"/><text class="sS" x="22" y="108" xml:space="preserve" style="white-space:pre">{OriginalFormat} = "Invoice {InvoiceId} paid in {ElapsedMs} ms by {UserId}"</text>
<text class="sS" x="14" y="128">query ElapsedMs &gt; 500:</text><text class="sGt" x="170" y="128">matches</text>
<text class="sS" x="14" y="146">count events of this kind:</text><text class="sGt" x="190" y="146">group by {OriginalFormat}, the same for every invoice</text>
<text class="sRt" x="14" y="176">string interpolation</text><text class="sS" x="14" y="194" xml:space="preserve" style="white-space:pre">LogInformation($"Invoice {invoice.Id} paid in {ms} ms")</text>
<text class="sRt" x="14" y="224" xml:space="preserve" style="white-space:pre">(no properties: only the formatted Message)</text>
<rect class="sN" x="14" y="238" width="347.2" height="26" rx="5"/><text class="sS" x="22" y="256" xml:space="preserve" style="white-space:pre">{OriginalFormat} = "Invoice 42 paid in 731 ms"</text>
<text class="sS" x="14" y="276">query ElapsedMs &gt; 500:</text><text class="sRt" x="170" y="276">nothing to filter on: one opaque string</text>
<text class="sS" x="14" y="294">count events of this kind:</text><text class="sRt" x="190" y="294">{OriginalFormat} differs for every invoice</text>
</svg><figcaption>The two log calls above, written by the .NET JSON console logger: only the template produces properties you can query.</figcaption></figure>

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

<figure class="dia"><svg viewBox="0 0 720 242" role="img" aria-label="Histogram of 100,000 simulated request latencies on a log scale: most requests take around 80 milliseconds, and about one percent take several seconds. The mean is about 130 milliseconds, the median about 80, p95 about 160 milliseconds, while p99 is about 3 seconds">
<line class="sLm" x1="50" y1="196" x2="570" y2="196"/>
<line class="sLm" x1="50" y1="196" x2="50" y2="200"/><text class="sS" x="50" y="214" text-anchor="middle">10 ms</text>
<line class="sLm" x1="223.333" y1="196" x2="223.333" y2="200"/><text class="sS" x="223.333" y="214" text-anchor="middle">100 ms</text>
<line class="sLm" x1="396.667" y1="196" x2="396.667" y2="200"/><text class="sS" x="396.667" y="214" text-anchor="middle">1 s</text>
<line class="sLm" x1="570" y1="196" x2="570" y2="200"/><text class="sS" x="570" y="214" text-anchor="middle">10 s</text>
<rect class="sB" x="58.6667" y="194.489" width="8.06667" height="1.51078" rx="0"/>
<rect class="sB" x="67.3333" y="194.489" width="8.06667" height="1.51078" rx="0"/>
<rect class="sB" x="76" y="194.489" width="8.06667" height="1.51078" rx="0"/>
<rect class="sB" x="84.6667" y="193.863" width="8.06667" height="2.13656" rx="0"/>
<rect class="sB" x="93.3333" y="189.957" width="8.06667" height="6.04312" rx="0"/>
<rect class="sB" x="102" y="185.211" width="8.06667" height="10.7891" rx="0"/>
<rect class="sB" x="110.667" y="179.799" width="8.06667" height="16.2013" rx="0"/>
<rect class="sB" x="119.333" y="170.765" width="8.06667" height="25.235" rx="0"/>
<rect class="sB" x="128" y="160.86" width="8.06667" height="35.1398" rx="0"/>
<rect class="sB" x="136.667" y="146.581" width="8.06667" height="49.4189" rx="0"/>
<rect class="sB" x="145.333" y="131.019" width="8.06667" height="64.9811" rx="0"/>
<rect class="sB" x="154" y="110.952" width="8.06667" height="85.0476" rx="0"/>
<rect class="sB" x="162.667" y="91.6249" width="8.06667" height="104.375" rx="0"/>
<rect class="sB" x="171.333" y="75.1566" width="8.06667" height="120.843" rx="0"/>
<rect class="sB" x="180" y="54.9058" width="8.06667" height="141.094" rx="0"/>
<rect class="sB" x="188.667" y="43.344" width="8.06667" height="152.656" rx="0"/>
<rect class="sB" x="197.333" y="36.207" width="8.06667" height="159.793" rx="0"/>
<rect class="sB" x="206" y="36" width="8.06667" height="160" rx="0"/>
<rect class="sB" x="214.667" y="41.6268" width="8.06667" height="154.373" rx="0"/>
<rect class="sB" x="223.333" y="53.8663" width="8.06667" height="142.134" rx="0"/>
<rect class="sB" x="232" y="68.8699" width="8.06667" height="127.13" rx="0"/>
<rect class="sB" x="240.667" y="87.7814" width="8.06667" height="108.219" rx="0"/>
<rect class="sB" x="249.333" y="107.442" width="8.06667" height="88.558" rx="0"/>
<rect class="sB" x="258" y="127.347" width="8.06667" height="68.6532" rx="0"/>
<rect class="sB" x="266.667" y="144.611" width="8.06667" height="51.3887" rx="0"/>
<rect class="sB" x="275.333" y="160.026" width="8.06667" height="35.9743" rx="0"/>
<rect class="sB" x="284" y="170.675" width="8.06667" height="25.3253" rx="0"/>
<rect class="sB" x="292.667" y="178.708" width="8.06667" height="17.2917" rx="0"/>
<rect class="sB" x="301.333" y="185.317" width="8.06667" height="10.6828" rx="0"/>
<rect class="sB" x="310" y="189.771" width="8.06667" height="6.2291" rx="0"/>
<rect class="sB" x="318.667" y="190.767" width="8.06667" height="5.23349" rx="0"/>
<rect class="sB" x="327.333" y="193.383" width="8.06667" height="2.61675" rx="0"/>
<rect class="sB" x="336" y="193.863" width="8.06667" height="2.13656" rx="0"/>
<rect class="sR" x="414" y="194.489" width="8.06667" height="1.51078" rx="0"/>
<rect class="sR" x="422.667" y="193.383" width="8.06667" height="2.61675" rx="0"/>
<rect class="sR" x="431.333" y="192.978" width="8.06667" height="3.02156" rx="0"/>
<rect class="sR" x="440" y="188.755" width="8.06667" height="7.24544" rx="0"/>
<rect class="sR" x="448.667" y="185.979" width="8.06667" height="10.0214" rx="0"/>
<rect class="sR" x="457.333" y="183.634" width="8.06667" height="12.3663" rx="0"/>
<rect class="sR" x="466" y="178.841" width="8.06667" height="17.1592" rx="0"/>
<rect class="sR" x="474.667" y="177.745" width="8.06667" height="18.2548" rx="0"/>
<rect class="sR" x="483.333" y="177.374" width="8.06667" height="18.6261" rx="0"/>
<rect class="sR" x="492" y="175.844" width="8.06667" height="20.1563" rx="0"/>
<rect class="sR" x="500.667" y="176.712" width="8.06667" height="19.2883" rx="0"/>
<rect class="sR" x="509.333" y="178.124" width="8.06667" height="17.8758" rx="0"/>
<rect class="sR" x="518" y="183.36" width="8.06667" height="12.6401" rx="0"/>
<rect class="sR" x="526.667" y="187.454" width="8.06667" height="8.54626" rx="0"/>
<rect class="sR" x="535.333" y="191.222" width="8.06667" height="4.7775" rx="0"/>
<rect class="sR" x="544" y="192.003" width="8.06667" height="3.99715" rx="0"/>
<rect class="sR" x="552.667" y="192.978" width="8.06667" height="3.02156" rx="0"/>
<line class="sLw" x1="242.584" y1="30" x2="242.584" y2="196" stroke-dasharray="4 3" style="stroke-width:1.8"/>
<text class="sWt" x="247.584" y="40">mean 129 ms</text>
<line class="sLg" x1="207.199" y1="30" x2="207.199" y2="196" stroke-dasharray="4 3" style="stroke-width:1.8"/>
<text class="sGt" x="202.199" y="40" text-anchor="end">p50 81 ms</text>
<line class="sLg" x1="259.681" y1="30" x2="259.681" y2="196" stroke-dasharray="4 3" style="stroke-width:1.8"/>
<text class="sGt" x="264.681" y="58">p95 162 ms</text>
<line class="sLr" x1="467.907" y1="30" x2="467.907" y2="196" stroke-dasharray="4 3" style="stroke-width:1.8"/>
<text class="sRt" x="472.907" y="40">p99 2.6 s</text>
<text class="sS" x="310" y="232" text-anchor="middle">request latency (log scale); bar height ∝ √count so the tail stays visible</text>
<rect class="sN" x="590" y="30" width="116" height="166" rx="8"/>
<text class="sT" x="648" y="52" text-anchor="middle">100,000 requests</text><text class="sS" x="648" y="76" text-anchor="middle">1.2% hit a slow</text><text class="sS" x="648" y="92" text-anchor="middle">path (cold cache,</text><text class="sS" x="648" y="108" text-anchor="middle">lock, retry)</text>
<text class="sS" x="648" y="136" text-anchor="middle">the mean says</text><text class="sWt" x="648" y="152" text-anchor="middle">"129 ms, fine"</text><text class="sS" x="648" y="176" text-anchor="middle">p99 says 1 in 100</text><text class="sRt" x="648" y="192" text-anchor="middle">waits 2.6 s</text>
</svg><figcaption>Averages hide pain, simulated: a small slow path barely moves the mean but owns the p99. Alert on the percentile your users feel.</figcaption></figure>

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

<figure class="dia anim"><svg viewBox="0 0 720 180" role="img" aria-label="Animation: a request travels through the API, a payments service, a queue and a worker, carrying the same W3C traceparent header">
<rect class="sB" x="8" y="40" width="128" height="46" rx="8"/><text class="sT" x="72" y="68" text-anchor="middle">browser</text>
<line class="sLm" x1="136" y1="63" x2="150" y2="63" marker-end="url(#ahm)"/>
<rect class="sA" x="152" y="40" width="128" height="46" rx="8"/><text class="sT" x="216" y="68" text-anchor="middle">API</text>
<line class="sLm" x1="280" y1="63" x2="294" y2="63" marker-end="url(#ahm)"/>
<rect class="sV" x="296" y="40" width="128" height="46" rx="8"/><text class="sT" x="360" y="68" text-anchor="middle">payments service</text>
<line class="sLm" x1="424" y1="63" x2="438" y2="63" marker-end="url(#ahm)"/>
<rect class="sW" x="440" y="40" width="128" height="46" rx="8"/><text class="sT" x="504" y="68" text-anchor="middle">queue</text>
<line class="sLm" x1="568" y1="63" x2="582" y2="63" marker-end="url(#ahm)"/>
<rect class="sG" x="584" y="40" width="128" height="46" rx="8"/><text class="sT" x="648" y="68" text-anchor="middle">email worker</text>
<rect class="sV" x="150" y="110" width="420" height="30" rx="6"/><text class="sC" x="160" y="130" xml:space="preserve" style="white-space:pre">traceparent: 00-4bf92f…-00f067aa…-01</text>
<circle class="sPv" r="5"><animateMotion dur="5s" repeatCount="indefinite" path="M72 63 H648"/></circle>
<text class="sS" x="360" y="168" text-anchor="middle">each hop passes the trace ID on (HTTP header, message property), so one trace spans every service</text>
</svg><figcaption>Context propagation with the W3C <code>traceparent</code> header. .NET's HttpClient and most messaging libraries add and read it automatically.</figcaption></figure>

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

<figure class="dia steps" data-start="1"><svg viewBox="0 0 720 262" role="img" aria-label="During a database blip, a liveness probe that checks the database restarts every instance; a readiness probe only removes them from rotation until it recovers">
<rect class="sB" x="300" y="20" width="120" height="40" rx="8"/><text class="sT" x="360" y="45" text-anchor="middle">load balancer</text>
<line class="sLm" x1="360" y1="60" x2="180" y2="88"/>
<line class="sLm" x1="360" y1="60" x2="360" y2="88"/>
<line class="sLm" x1="360" y1="60" x2="540" y2="88"/>
<rect class="sG" x="300" y="186" width="120" height="40" rx="8"/><text class="sT" x="360" y="211" text-anchor="middle">database</text>
<g data-s="1-1"><rect class="sA" x="120" y="90" width="120" height="50" rx="8"/><text class="sT" x="180" y="113" text-anchor="middle">instance 1</text><text class="sC" x="180" y="129" text-anchor="middle">serving</text><rect class="sA" x="300" y="90" width="120" height="50" rx="8"/><text class="sT" x="360" y="113" text-anchor="middle">instance 2</text><text class="sC" x="360" y="129" text-anchor="middle">serving</text><rect class="sA" x="480" y="90" width="120" height="50" rx="8"/><text class="sT" x="540" y="113" text-anchor="middle">instance 3</text><text class="sC" x="540" y="129" text-anchor="middle">serving</text><text class="sC" x="360" y="250" text-anchor="middle">normal: all instances healthy</text></g>
<g data-s="2-2"><rect class="sR" x="120" y="90" width="120" height="50" rx="8"/><text class="sT" x="180" y="113" text-anchor="middle">instance 1</text><text class="sC" x="180" y="129" text-anchor="middle">restarting…</text><rect class="sR" x="300" y="90" width="120" height="50" rx="8"/><text class="sT" x="360" y="113" text-anchor="middle">instance 2</text><text class="sC" x="360" y="129" text-anchor="middle">restarting…</text><rect class="sR" x="480" y="90" width="120" height="50" rx="8"/><text class="sT" x="540" y="113" text-anchor="middle">instance 3</text><text class="sC" x="540" y="129" text-anchor="middle">restarting…</text><rect class="sN" x="296" y="182" width="128" height="48" rx="10" style="stroke:var(--senior);stroke-width:3"/><text class="sRt" x="434" y="211">blip (10 s)</text><text class="sRt" x="360" y="250" text-anchor="middle">DB in LIVENESS: every instance restarts at once → full outage</text></g>
<g data-s="3-3"><rect class="sW" x="120" y="90" width="120" height="50" rx="8"/><text class="sT" x="180" y="113" text-anchor="middle">instance 1</text><text class="sC" x="180" y="129" text-anchor="middle">out of rotation</text><rect class="sW" x="300" y="90" width="120" height="50" rx="8"/><text class="sT" x="360" y="113" text-anchor="middle">instance 2</text><text class="sC" x="360" y="129" text-anchor="middle">out of rotation</text><rect class="sW" x="480" y="90" width="120" height="50" rx="8"/><text class="sT" x="540" y="113" text-anchor="middle">instance 3</text><text class="sC" x="540" y="129" text-anchor="middle">out of rotation</text><rect class="sN" x="296" y="182" width="128" height="48" rx="10" style="stroke:var(--senior);stroke-width:3"/><text class="sRt" x="434" y="211">blip (10 s)</text><text class="sWt" x="360" y="250" text-anchor="middle">DB in READINESS: traffic paused, processes keep running</text></g>
<g data-s="4-4"><rect class="sA" x="120" y="90" width="120" height="50" rx="8"/><text class="sT" x="180" y="113" text-anchor="middle">instance 1</text><text class="sC" x="180" y="129" text-anchor="middle">back in rotation</text><rect class="sA" x="300" y="90" width="120" height="50" rx="8"/><text class="sT" x="360" y="113" text-anchor="middle">instance 2</text><text class="sC" x="360" y="129" text-anchor="middle">back in rotation</text><rect class="sA" x="480" y="90" width="120" height="50" rx="8"/><text class="sT" x="540" y="113" text-anchor="middle">instance 3</text><text class="sC" x="540" y="129" text-anchor="middle">back in rotation</text><text class="sGt" x="360" y="250" text-anchor="middle">the DB returns: readiness passes, traffic resumes with no cold start</text></g>
</svg><ol class="dia-steps">
<li>Three healthy instances behind the load balancer.</li>
<li>The database blips. If the <b>liveness</b> probe checks it, every instance fails liveness together and the orchestrator restarts all of them: a 10-second blip becomes minutes of downtime and cold starts.</li>
<li>If the database check is in <b>readiness</b> instead, the instances are just taken out of rotation. They stay alive, warm and ready.</li>
<li>When the database comes back, readiness passes and traffic resumes immediately.</li>
</ol><figcaption>Liveness asks "should I be restarted?"; readiness asks "should I get traffic?". Dependencies belong in the second.</figcaption></figure>

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

<figure class="dia"><svg viewBox="0 0 720 220" role="img" aria-label="Error budget over 30 days: 216 minutes allowed at 99.5%; a bad deploy consumes 90 minutes at once">
<line class="sLm" x1="70" y1="190" x2="680" y2="190" marker-end="url(#ahm)"/><line class="sLm" x1="70" y1="190" x2="70" y2="30" marker-end="url(#ahm)"/>
<line class="sLr" x1="70" y1="40.0" x2="670" y2="40.0" stroke-dasharray="6 4"/><text class="sRt" x="670" y="34" text-anchor="end">budget: 216 min (99.5% of 30 days)</text>
<polyline class="sLw" points="70.0,190.0 170.0,176.1 250.0,169.2 270.0,106.7 350.0,101.1 470.0,92.8 570.0,85.8 670.0,78.9"/>
<text class="sWt" x="276" y="100.667">bad deploy: 90 min</text>
<text class="sC" x="670" y="58" text-anchor="end">nearly spent: slow down, fix reliability first</text>
<text class="sC" x="70" y="208" text-anchor="middle">day 0</text>
<text class="sC" x="270" y="208" text-anchor="middle">day 10</text>
<text class="sC" x="470" y="208" text-anchor="middle">day 20</text>
<text class="sC" x="670" y="208" text-anchor="middle">day 30</text>
<text class="sC" x="74" y="28">minutes of "bad" service used</text>
</svg><figcaption>An error budget makes the trade-off visible: spend it on shipping fast, but when a bad deploy eats most of it, reliability work comes first.</figcaption></figure>

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

<figure class="dia"><svg viewBox="0 0 720 262" role="img" aria-label="The standard resilience handler as nested layers: rate limiter, total timeout, retry, circuit breaker, per-attempt timeout, then the HttpClient call">
<rect class="sB" x="14" y="20" width="692" height="220" rx="10" opacity=".9"/><text class="sC" x="24" y="36">rate limiter</text>
<rect class="sW" x="34" y="42" width="652" height="176" rx="10" opacity=".9"/><text class="sC" x="44" y="58">total timeout 20 s</text>
<rect class="sA" x="54" y="64" width="612" height="132" rx="10" opacity=".9"/><text class="sC" x="64" y="80">retry ×3, backoff</text>
<rect class="sR" x="74" y="86" width="572" height="88" rx="10" opacity=".9"/><text class="sC" x="84" y="102">circuit breaker</text>
<rect class="sW" x="94" y="108" width="532" height="44" rx="10" opacity=".9"/><text class="sC" x="104" y="124">attempt timeout 5 s</text>
<rect class="sG" x="114" y="130" width="492" height="0" rx="10" opacity=".9"/><text class="sC" x="124" y="146">HttpClient</text>
<text class="sS" x="360" y="252" text-anchor="middle">outer layers see the whole operation; inner layers see a single attempt</text>
</svg><figcaption>The order <code>AddStandardResilienceHandler</code> uses. Retries sit inside the total timeout, so they can never extend a request indefinitely.</figcaption></figure>

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
