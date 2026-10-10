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

<figure class="dia"><svg viewBox="0 0 720 246" role="img" aria-label="Retry timing for 40 clients: fixed backoff produces synchronised spikes, jittered backoff spreads them out">
<text class="sT" x="70" y="32">Fixed backoff (100, 200, 400, 800 ms): every client retries in lock-step</text><rect class="sR" x="108.75" y="46" width="8.6875" height="64" rx="1"/><rect class="sR" x="186.25" y="46" width="8.6875" height="64" rx="1"/><rect class="sR" x="341.25" y="46" width="8.6875" height="64" rx="1"/><rect class="sR" x="651.25" y="46" width="8.6875" height="64" rx="1"/><line class="sLm" x1="70" y1="110" x2="690" y2="110"/>
<text class="sT" x="70" y="142">Backoff with full jitter: the same retries, spread out</text><rect class="sG" x="70" y="204" width="8.6875" height="16" rx="1"/><rect class="sG" x="79.6875" y="200.8" width="8.6875" height="19.2" rx="1"/><rect class="sG" x="89.375" y="197.6" width="8.6875" height="22.4" rx="1"/><rect class="sG" x="99.0625" y="194.4" width="8.6875" height="25.6" rx="1"/><rect class="sG" x="108.75" y="216.8" width="8.6875" height="3.2" rx="1"/><rect class="sG" x="118.438" y="213.6" width="8.6875" height="6.4" rx="1"/><rect class="sG" x="128.125" y="215.2" width="8.6875" height="4.8" rx="1"/><rect class="sG" x="137.812" y="210.4" width="8.6875" height="9.6" rx="1"/><rect class="sG" x="147.5" y="194.4" width="8.6875" height="25.6" rx="1"/><rect class="sG" x="157.188" y="218.4" width="8.6875" height="1.6" rx="1"/><rect class="sG" x="166.875" y="204" width="8.6875" height="16" rx="1"/><rect class="sG" x="176.562" y="215.2" width="8.6875" height="4.8" rx="1"/><rect class="sG" x="186.25" y="213.6" width="8.6875" height="6.4" rx="1"/><rect class="sG" x="195.938" y="218.4" width="8.6875" height="1.6" rx="1"/><rect class="sG" x="205.625" y="215.2" width="8.6875" height="4.8" rx="1"/><rect class="sG" x="215.312" y="216.8" width="8.6875" height="3.2" rx="1"/><rect class="sG" x="225" y="213.6" width="8.6875" height="6.4" rx="1"/><rect class="sG" x="234.688" y="212" width="8.6875" height="8" rx="1"/><rect class="sG" x="244.375" y="216.8" width="8.6875" height="3.2" rx="1"/><rect class="sG" x="254.062" y="215.2" width="8.6875" height="4.8" rx="1"/><rect class="sG" x="263.75" y="216.8" width="8.6875" height="3.2" rx="1"/><rect class="sG" x="273.438" y="216.8" width="8.6875" height="3.2" rx="1"/><rect class="sG" x="283.125" y="218.4" width="8.6875" height="1.6" rx="1"/><rect class="sG" x="292.812" y="216.8" width="8.6875" height="3.2" rx="1"/><rect class="sG" x="302.5" y="216.8" width="8.6875" height="3.2" rx="1"/><rect class="sG" x="312.188" y="216.8" width="8.6875" height="3.2" rx="1"/><rect class="sG" x="321.875" y="216.8" width="8.6875" height="3.2" rx="1"/><rect class="sG" x="331.562" y="213.6" width="8.6875" height="6.4" rx="1"/><rect class="sG" x="341.25" y="218.4" width="8.6875" height="1.6" rx="1"/><rect class="sG" x="350.938" y="218.4" width="8.6875" height="1.6" rx="1"/><rect class="sG" x="360.625" y="218.4" width="8.6875" height="1.6" rx="1"/><rect class="sG" x="370.312" y="218.4" width="8.6875" height="1.6" rx="1"/><rect class="sG" x="389.688" y="218.4" width="8.6875" height="1.6" rx="1"/><rect class="sG" x="409.062" y="215.2" width="8.6875" height="4.8" rx="1"/><rect class="sG" x="428.438" y="216.8" width="8.6875" height="3.2" rx="1"/><rect class="sG" x="447.812" y="216.8" width="8.6875" height="3.2" rx="1"/><rect class="sG" x="457.5" y="215.2" width="8.6875" height="4.8" rx="1"/><rect class="sG" x="476.875" y="215.2" width="8.6875" height="4.8" rx="1"/><rect class="sG" x="515.625" y="216.8" width="8.6875" height="3.2" rx="1"/><rect class="sG" x="554.375" y="218.4" width="8.6875" height="1.6" rx="1"/><rect class="sG" x="564.062" y="218.4" width="8.6875" height="1.6" rx="1"/><line class="sLm" x1="70" y1="220" x2="690" y2="220"/>
<text class="sRt" x="116.75" y="52">40 retries at the same instant</text>
<text class="sC" x="70" y="236" text-anchor="middle">0 ms</text>
<text class="sC" x="225" y="236" text-anchor="middle">400 ms</text>
<text class="sC" x="380" y="236" text-anchor="middle">800 ms</text>
<text class="sC" x="535" y="236" text-anchor="middle">1200 ms</text>
<text class="sC" x="690" y="236" text-anchor="middle">1600 ms</text>
</svg><figcaption>Forty clients hit the same failure at once. Without jitter their retries arrive as synchronised spikes that can knock the recovering service over again; random jitter turns the spikes into a trickle.</figcaption></figure>

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

<figure class="dia steps"><svg viewBox="0 0 720 272" role="img" aria-label="Sequence: a payment request with an idempotency key succeeds but its response is lost; the retry with the same key returns the stored result without charging again">
<text class="sT" x="90" y="22" text-anchor="middle">Mobile app</text><line class="sD" x1="90" y1="32" x2="90" y2="262"/>
<text class="sT" x="340" y="22" text-anchor="middle">Payments API</text><line class="sD" x1="340" y1="32" x2="340" y2="262"/>
<text class="sT" x="600" y="22" text-anchor="middle">Database</text><line class="sD" x1="600" y1="32" x2="600" y2="262"/>
<g data-s="1"><line class="sL" x1="90" y1="52" x2="336" y2="60" marker-end="url(#ah)"/><text class="sC" x="215" y="46" text-anchor="middle">POST /payments  500 EGP</text><text class="sM" x="215" y="76" text-anchor="middle">Idempotency-Key: 7f3a…</text></g>
<g data-s="2"><line class="sL" x1="340" y1="92" x2="596" y2="100" marker-end="url(#ah)"/><text class="sC" x="470" y="88" text-anchor="middle">one transaction:</text><rect class="sG" x="470" y="104" width="236" height="40" rx="6"/><text class="sC" x="588" y="120" text-anchor="middle">INSERT key 7f3a (unique)</text><text class="sC" x="588" y="136" text-anchor="middle">charge · result = pay_91</text></g>
<g data-s="3"><line class="sLr" x1="340" y1="160" x2="200" y2="168" stroke-dasharray="5 4"/><text class="sRt" x="190" y="172" text-anchor="end">✕ response lost</text><text class="sC" x="86" y="192" text-anchor="end">times out</text></g>
<g data-s="4"><line class="sLw" x1="90" y1="208" x2="336" y2="214" marker-end="url(#ahw)"/><text class="sWt" x="215" y="204" text-anchor="middle">retry, SAME key 7f3a</text></g>
<g data-s="5"><line class="sLm" x1="340" y1="222" x2="596" y2="226" marker-end="url(#ahm)"/><text class="sC" x="470" y="218" text-anchor="middle">key exists → stored result</text><rect class="sB" x="512" y="232" width="176" height="22" rx="6"/><text class="sGt" x="600" y="247" text-anchor="middle">no second charge</text></g>
<g data-s="6"><line class="sLg" x1="336" y1="244" x2="94" y2="252" marker-end="url(#ahg)"/><text class="sGt" x="215" y="262" text-anchor="middle">201 · pay_91 (the same one)</text></g>
</svg><ol class="dia-steps">
<li>The app creates one key for this payment and sends it with the request.</li>
<li>The API records the key under a unique constraint, charges the card and stores the result, all in one transaction.</li>
<li>The response is lost on a flaky connection. The app can't tell whether the payment happened.</li>
<li>So it retries, which is safe only because it reuses the same key.</li>
<li>The API finds the key already recorded and returns the stored result instead of charging again.</li>
<li>The user is charged exactly once, however many times the request arrives.</li>
</ol><figcaption>An idempotency key turns at-least-once delivery into an exactly-once effect.</figcaption></figure>

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

<figure class="dia steps" data-start="1"><svg viewBox="0 0 720 210" role="img" aria-label="Circuit breaker walkthrough: closed, opening after failures, open, half-open trial, failing back to open, and closing after successful trials">
<rect class="sG" x="10" y="50" width="160" height="56" rx="10"/><text class="sT" x="90" y="74" text-anchor="middle">CLOSED</text><text class="sC" x="90" y="92" text-anchor="middle">calls pass; count fails</text>
<rect class="sR" x="280" y="50" width="160" height="56" rx="10"/><text class="sT" x="360" y="74" text-anchor="middle">OPEN</text><text class="sC" x="360" y="92" text-anchor="middle">fail fast, don't call</text>
<rect class="sW" x="550" y="50" width="160" height="56" rx="10"/><text class="sT" x="630" y="74" text-anchor="middle">HALF-OPEN</text><text class="sC" x="630" y="92" text-anchor="middle">a few trial calls</text>
<g data-s="1-1"><rect class="sN" x="6" y="46" width="168" height="64" rx="12" style="stroke:var(--accent);stroke-width:3"/><text class="sS" x="360" y="160" text-anchor="middle">Requests flow; each failure is counted in a rolling window.</text></g>
<g data-s="2"><line class="sLr" x1="170" y1="66" x2="276" y2="66" marker-end="url(#ahr)"/><text class="sRt" x="225" y="40" text-anchor="middle">5 failures in 10 s</text></g>
<g data-s="2-3"><rect class="sN" x="276" y="46" width="168" height="64" rx="12" style="stroke:var(--accent);stroke-width:3"/></g>
<g data-s="2-2"><text class="sS" x="360" y="160" text-anchor="middle">Too many failures: the breaker opens.</text></g>
<g data-s="3-3"><text class="sS" x="360" y="160" text-anchor="middle">For 30 s every call fails instantly: no threads tied up, no load on the dependency.</text></g>
<g data-s="4"><line class="sLw" x1="440" y1="66" x2="546" y2="66" marker-end="url(#ahw)"/><text class="sWt" x="495" y="40" text-anchor="middle">cool-down over</text></g>
<g data-s="4-5"><rect class="sN" x="546" y="46" width="168" height="64" rx="12" style="stroke:var(--accent);stroke-width:3"/></g>
<g data-s="4-4"><text class="sS" x="360" y="160" text-anchor="middle">One trial call is let through to test the dependency.</text></g>
<g data-s="5-5"><line class="sLr" x1="546" y1="92" x2="444" y2="92" stroke-dasharray="5 4" marker-end="url(#ahr)"/><text class="sRt" x="495" y="124" text-anchor="middle">trial fails → open again</text><text class="sS" x="360" y="160" text-anchor="middle">Still broken: back to OPEN for another cool-down.</text></g>
<g data-s="6"><path class="sLg" d="M630 106 C630 190 90 190 90 112" marker-end="url(#ahg)"/><text class="sGt" x="360" y="200" text-anchor="middle">trials succeed → closed again</text></g>
<g data-s="6-6"><rect class="sN" x="6" y="46" width="168" height="64" rx="12" style="stroke:var(--accent);stroke-width:3"/></g>
</svg><ol class="dia-steps">
<li>Closed: the normal state. Calls go through, and failures are counted.</li>
<li>Failures cross the threshold, so the breaker trips open.</li>
<li>Open: calls fail immediately with a fallback (a cached value, a queued retry, a friendly error) instead of waiting on a timeout.</li>
<li>After the cool-down the breaker goes half-open and lets a trial call through.</li>
<li>If the trial fails, it reopens and waits again.</li>
<li>When trial calls succeed, it closes and normal traffic resumes.</li>
</ol><figcaption>A circuit breaker turns a slow, failing dependency into a fast, predictable failure, and gives it room to recover.</figcaption></figure>

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

<figure class="dia steps" data-start="1"><svg viewBox="0 0 720 246" role="img" aria-label="Quorum with three replicas: a write succeeds after two acknowledgements; a read of two replicas sees one fresh copy and repairs the stale one">
<rect class="sA" x="20" y="96" width="110" height="44" rx="8"/><text class="sT" x="75" y="116" text-anchor="middle">writer</text><text class="sC" x="75" y="132" text-anchor="middle">x = 7 (v2)</text><rect class="sB" x="590" y="96" width="110" height="44" rx="8"/><text class="sT" x="645" y="116" text-anchor="middle">reader</text><text class="sC" x="645" y="132" text-anchor="middle">R = 2</text>
<rect class="sB" x="300" y="30" width="130" height="46" rx="8"/><text class="sT" x="365" y="48" text-anchor="middle">replica 1</text>
<rect class="sB" x="300" y="98" width="130" height="46" rx="8"/><text class="sT" x="365" y="116" text-anchor="middle">replica 2</text>
<rect class="sB" x="300" y="166" width="130" height="46" rx="8"/><text class="sT" x="365" y="184" text-anchor="middle">replica 3</text>
<g data-s="1"><line class="sL" x1="130" y1="118" x2="296" y2="53" marker-end="url(#ah)"/><line class="sL" x1="130" y1="118" x2="296" y2="121" marker-end="url(#ah)"/><line class="sLm" x1="130" y1="118" x2="296" y2="189" stroke-dasharray="4 4"/><text class="sC" x="213" y="214" text-anchor="middle">replica 3 is slow</text></g>
<g data-s="1"><text class="sGt" x="365" y="66" text-anchor="middle">x = 7 · v2 ✓</text><text class="sGt" x="365" y="134" text-anchor="middle">x = 7 · v2 ✓</text></g>
<g data-s="1-2"><text class="sWt" x="365" y="202" text-anchor="middle">x = 5 · v1 (old)</text></g>
<g data-s="1-1"><text class="sGt" x="213" y="92" text-anchor="middle">W = 2 acks → success</text></g>
<g data-s="2"><line class="sL" x1="586" y1="118" x2="434" y2="121" marker-end="url(#ah)"/><line class="sL" x1="586" y1="118" x2="434" y2="189" marker-end="url(#ah)"/><text class="sC" x="510" y="168" text-anchor="middle">asks 2 of 3</text></g>
<g data-s="2"><text class="sC" x="645" y="170" text-anchor="middle">sees v2 and v1</text><text class="sGt" x="645" y="188" text-anchor="middle">→ newest: x = 7</text></g>
<g data-s="3-3"><text class="sGt" x="365" y="202" text-anchor="middle">x = 7 · v2 (repaired)</text><text class="sS" x="213" y="236">W + R = 4 &gt; N = 3: every read overlaps a fresh copy</text></g>
</svg><ol class="dia-steps">
<li>N = 3 copies. A write needs W = 2 acknowledgements, so it succeeds even though replica 3 is slow and still holds the old value.</li>
<li>A read asks R = 2 replicas. Whichever two it picks, at least one has the new version, because 2 + 2 &gt; 3. It returns the highest version.</li>
<li>The reader also writes the newer value back to the stale replica: <b>read repair</b>.</li>
</ol><figcaption>Quorums in a leaderless store: with W + R &gt; N, reads and writes always overlap on at least one replica.</figcaption></figure>

## SD4.6 Partitioning in depth: keys, consistent hashing and hot spots 🟡

| Strategy | How rows are assigned | Good for | Risk |
|---|---|---|---|
| **Range** | Contiguous key ranges per partition (A–F, G–M… or by date) | Range scans ("orders in March") | Hot partitions: all of today's writes land on one partition |
| **Hash** | `hash(key)` decides the partition | Even spread | Range queries hit every partition |
| **Directory / lookup** | A table maps each key (tenant) to a partition | Moving one big tenant to its own database | The directory is a dependency to keep fast and available |

> [!term] Consistent hashing
> Keys and nodes are placed on the same hash ring; each key belongs to the next node clockwise. Adding or removing a node moves only the keys next to it, about 1/N of them, instead of reshuffling almost everything as `hash(key) % N` does. "Virtual nodes" (many points per server) even out the spread. Introduced by Karger and colleagues in 1997; used by Dynamo-style stores, distributed caches and some load balancers.

<figure class="dia steps" data-start="1"><svg viewBox="0 0 720 240" role="img" aria-label="Consistent hashing ring with nodes A, B and C; adding node D moves only the keys in its arc">
<circle class="sN" cx="200" cy="130" r="92"/>
<g data-s="1-1"><circle class="sPg" cx="246.0" cy="50.3" r="6"/><circle class="sPg" cx="286.5" cy="98.5" r="6"/><circle class="sPg" cx="290.6" cy="146.0" r="6"/><circle class="sPw" cx="265.1" cy="195.1" r="6"/><circle class="sPw" cx="231.5" cy="216.5" r="6"/><circle class="sPw" cx="168.5" cy="216.5" r="6"/><circle class="sP" cx="109.4" cy="146.0" r="6"/><circle class="sP" cx="140.9" cy="59.5" r="6"/><circle class="sP" cx="184.0" cy="39.4" r="6"/><rect class="sA" x="185.0" y="23.0" width="30" height="30" rx="6"/><text class="sT" x="200" y="43" text-anchor="middle">A</text><rect class="sG" x="264.7" y="161.0" width="30" height="30" rx="6"/><text class="sT" x="279.674" y="181" text-anchor="middle">B</text><rect class="sW" x="105.3" y="161.0" width="30" height="30" rx="6"/><text class="sT" x="120.326" y="181" text-anchor="middle">C</text></g>
<g data-s="2"><circle class="sPg" cx="246.0" cy="50.3" r="6"/><circle class="sPg" cx="286.5" cy="98.5" r="6"/><circle class="sPg" cx="290.6" cy="146.0" r="6"/><circle class="sPv" cx="265.1" cy="195.1" r="6"/><circle class="sPv" cx="231.5" cy="216.5" r="6"/><circle class="sPw" cx="168.5" cy="216.5" r="6"/><circle class="sP" cx="109.4" cy="146.0" r="6"/><circle class="sP" cx="140.9" cy="59.5" r="6"/><circle class="sP" cx="184.0" cy="39.4" r="6"/><rect class="sA" x="185.0" y="23.0" width="30" height="30" rx="6"/><text class="sT" x="200" y="43" text-anchor="middle">A</text><rect class="sG" x="264.7" y="161.0" width="30" height="30" rx="6"/><text class="sT" x="279.674" y="181" text-anchor="middle">B</text><rect class="sW" x="105.3" y="161.0" width="30" height="30" rx="6"/><text class="sT" x="120.326" y="181" text-anchor="middle">C</text><rect class="sV" x="185.0" y="207.0" width="30" height="30" rx="6"/><text class="sT" x="200" y="227" text-anchor="middle">D</text></g>
<g data-s="2-2"><text class="sM" x="200" y="135" text-anchor="middle">D joins</text><text class="sC" x="200" y="152" text-anchor="middle">2 of 9 keys move</text></g>
<g data-s="1-1"><text class="sM" x="200" y="135" text-anchor="middle">each key →</text><text class="sC" x="200" y="152" text-anchor="middle">next node clockwise</text></g>
<text class="sT" x="560" y="60" text-anchor="middle">Adding a 4th node</text>
<text class="sM" x="560" y="92" text-anchor="middle">hash(key) % N, N: 3 → 4</text><text class="sRt" x="560" y="112" text-anchor="middle">~75% of keys change owner</text>
<text class="sM" x="560" y="152" text-anchor="middle">consistent hashing ring</text><text class="sGt" x="560" y="172" text-anchor="middle">~1/4 of keys move, all to D</text>
<text class="sC" x="560" y="212" text-anchor="middle">virtual nodes (many points per server)</text><text class="sC" x="560" y="228" text-anchor="middle">even out the arcs</text>
</svg><ol class="dia-steps">
<li>Nodes and keys are hashed onto the same ring. Each key (dot) belongs to the first node clockwise from it; the colours show the owners.</li>
<li>Add node D. Only the keys in the arc just before D change owner, and they all move to D. Every other key stays where it was.</li>
</ol><figcaption>Why caches and Dynamo-style stores use a ring: growing the cluster moves a fair share of keys, not nearly all of them.</figcaption></figure>

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

<figure class="dia steps"><svg viewBox="0 0 720 290" role="img" aria-label="Orchestrated saga: create order, reserve stock, payment fails, then compensations release the stock and cancel the order">
<text class="sT" x="90" y="22" text-anchor="middle">Orchestrator</text><line class="sD" x1="90" y1="32" x2="90" y2="282"/>
<text class="sT" x="270" y="22" text-anchor="middle">Orders</text><line class="sD" x1="270" y1="32" x2="270" y2="282"/>
<text class="sT" x="440" y="22" text-anchor="middle">Stock</text><line class="sD" x1="440" y1="32" x2="440" y2="282"/>
<text class="sT" x="610" y="22" text-anchor="middle">Payments</text><line class="sD" x1="610" y1="32" x2="610" y2="282"/>
<g data-s="1"><line class="sL" x1="90" y1="56" x2="266" y2="62" marker-end="url(#ah)"/><text class="sC" x="180" y="52" text-anchor="middle">create order</text><text class="sGt" x="278" y="70">Pending ✓</text></g>
<g data-s="2"><line class="sL" x1="90" y1="96" x2="436" y2="102" marker-end="url(#ah)"/><text class="sC" x="265" y="92" text-anchor="middle">reserve stock</text><text class="sGt" x="448" y="110">reserved ✓</text></g>
<g data-s="3"><line class="sLr" x1="90" y1="136" x2="606" y2="142" marker-end="url(#ahr)"/><text class="sC" x="350" y="132" text-anchor="middle">charge card</text><text class="sRt" x="618" y="150">✕ declined</text></g>
<g data-s="4"><line class="sLw" x1="90" y1="186" x2="436" y2="192" marker-end="url(#ahw)"/><text class="sC" x="265" y="182" text-anchor="middle">compensate: release stock</text><text class="sGt" x="448" y="200">released</text></g>
<g data-s="5"><line class="sLw" x1="90" y1="226" x2="266" y2="232" marker-end="url(#ahw)"/><text class="sC" x="180" y="222" text-anchor="middle">compensate: cancel order</text><text class="sGt" x="278" y="240">Cancelled</text><text class="sC" x="90" y="268">customer told "payment failed"</text></g>
</svg><ol class="dia-steps">
<li>Each step is a local transaction in one service. First, Orders creates the order as Pending.</li>
<li>Stock reserves the items.</li>
<li>Payments fails: the card is declined. There is no global rollback to call.</li>
<li>So the orchestrator runs the compensations in reverse order, starting with releasing the stock.</li>
<li>Then it cancels the order. The system is consistent again, through business actions rather than a database rollback.</li>
</ol><figcaption>A saga with an orchestrator. Every step and every compensation must be idempotent, because any message may be delivered twice.</figcaption></figure>

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
