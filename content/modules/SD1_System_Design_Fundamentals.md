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

<figure class="dia anim"><svg viewBox="0 0 760 250" role="img" aria-label="Animation: a request travels from the browser through the CDN and load balancer to an app server, reads the cache and database and returns; a background job goes through the queue to a worker">
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
<circle class="sP" r="5"><animateMotion dur="6s" repeatCount="indefinite" path="M100 123 H250 L370 129 L480 124 L530 60 L480 124 L530 124 L480 126 L370 129 L250 123 H100"/></circle>
<circle class="sPw" r="5"><animateMotion dur="6s" repeatCount="indefinite" path="M480 134 L530 188 H660 L705 168 V144"/></circle>
<text class="sS" x="140" y="232">Static files stop at the CDN · dynamic requests reach an app server · slow work goes through the queue</text>
</svg><figcaption>The common shape of a web system. The blue request reads the cache, misses, reads the database and returns; the orange job takes the slow path through the queue. Small apps collapse several boxes into one server; large ones multiply each box, but the path stays recognisable.</figcaption></figure>

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

<figure class="dia"><svg viewBox="0 0 720 268" role="img" aria-label="Latency numbers on a logarithmic scale from a nanosecond cache hit to a 170 millisecond intercontinental round trip">
<text class="sS" x="240" y="45" text-anchor="end">L1 cache reference</text>
<rect class="sG" x="250" y="32" width="11.9318" height="18" rx="3"/>
<text class="sM" x="269.932" y="45">~1 ns</text>
<text class="sS" x="240" y="75" text-anchor="end">Main memory (RAM)</text>
<rect class="sG" x="250" y="62" width="91.4773" height="18" rx="3"/>
<text class="sM" x="349.477" y="75">~100 ns</text>
<text class="sS" x="240" y="105" text-anchor="end">SSD random read</text>
<rect class="sA" x="250" y="92" width="198.823" height="18" rx="3"/>
<text class="sM" x="456.823" y="105">~20–100 µs</text>
<text class="sS" x="240" y="135" text-anchor="end">Round trip in one data centre</text>
<rect class="sA" x="250" y="122" width="238.595" height="18" rx="3"/>
<text class="sM" x="496.595" y="135">~0.5 ms</text>
<text class="sS" x="240" y="165" text-anchor="end">Hard-disk seek</text>
<rect class="sA" x="250" y="152" width="278.368" height="18" rx="3"/>
<text class="sM" x="536.368" y="165">~5–10 ms</text>
<text class="sS" x="240" y="195" text-anchor="end">Cairo ↔ Western Europe</text>
<rect class="sW" x="250" y="182" width="322.673" height="18" rx="3"/>
<text class="sM" x="580.673" y="195">~50–80 ms</text>
<text class="sS" x="240" y="225" text-anchor="end">Cairo ↔ US West Coast</text>
<rect class="sW" x="250" y="212" width="339.279" height="18" rx="3"/>
<text class="sM" x="597.279" y="225">~150–200 ms</text>
<line class="sD" x1="261.9" y1="24" x2="261.9" y2="244" opacity=".6"/><text class="sC" x="261.932" y="258" text-anchor="middle">1 ns</text>
<line class="sD" x1="381.2" y1="24" x2="381.2" y2="244" opacity=".6"/><text class="sC" x="381.25" y="258" text-anchor="middle">1 µs</text>
<line class="sD" x1="500.6" y1="24" x2="500.6" y2="244" opacity=".6"/><text class="sC" x="500.568" y="258" text-anchor="middle">1 ms</text>
<text class="sC" x="20" y="16">log scale: each gridline is 1,000× the previous one</text>
</svg><figcaption>Orders of magnitude worth remembering. Memory is about a million times faster than a trip across the Mediterranean, which is why chatty designs and remote calls in loops hurt.</figcaption></figure>

> [!term] Latency
> How long one operation takes, from request to response; usually reported as percentiles (**p50**, **p95**, **p99**), because the average hides the slow requests users actually notice.

<figure class="dia"><svg viewBox="0 0 720 248" role="img" aria-label="Histogram of request latencies with a long right tail and markers at p50, p95 and p99">
<rect class="sA" x="40" y="190" width="14" height="0" rx="1"/>
<rect class="sA" x="56" y="188.614" width="14" height="1.38632" rx="1"/>
<rect class="sA" x="72" y="174.473" width="14" height="15.5268" rx="1"/>
<rect class="sA" x="88" y="140.37" width="14" height="49.6303" rx="1"/>
<rect class="sA" x="104" y="90.7394" width="14" height="99.2606" rx="1"/>
<rect class="sA" x="120" y="56.6359" width="14" height="133.364" rx="1"/>
<rect class="sA" x="136" y="40" width="14" height="150" rx="1"/>
<rect class="sA" x="152" y="69.6673" width="14" height="120.333" rx="1"/>
<rect class="sA" x="168" y="75.4898" width="14" height="114.51" rx="1"/>
<rect class="sA" x="184" y="93.7893" width="14" height="96.2107" rx="1"/>
<rect class="sA" x="200" y="107.375" width="14" height="82.6248" rx="1"/>
<rect class="sA" x="216" y="129.834" width="14" height="60.1664" rx="1"/>
<rect class="sA" x="232" y="144.251" width="14" height="45.7486" rx="1"/>
<rect class="sA" x="248" y="153.956" width="14" height="36.0444" rx="1"/>
<rect class="sA" x="264" y="163.66" width="14" height="26.3401" rx="1"/>
<rect class="sA" x="280" y="172.532" width="14" height="17.4677" rx="1"/>
<rect class="sA" x="296" y="172.532" width="14" height="17.4677" rx="1"/>
<rect class="sA" x="312" y="181.682" width="14" height="8.31793" rx="1"/>
<rect class="sA" x="328" y="180.85" width="14" height="9.14972" rx="1"/>
<rect class="sA" x="344" y="184.732" width="14" height="5.26802" rx="1"/>
<rect class="sA" x="360" y="185.287" width="14" height="4.71349" rx="1"/>
<rect class="sA" x="376" y="187.227" width="14" height="2.77264" rx="1"/>
<rect class="sA" x="392" y="188.614" width="14" height="1.38632" rx="1"/>
<rect class="sA" x="408" y="188.059" width="14" height="1.94085" rx="1"/>
<rect class="sA" x="424" y="188.336" width="14" height="1.66359" rx="1"/>
<rect class="sA" x="440" y="188.336" width="14" height="1.66359" rx="1"/>
<rect class="sA" x="456" y="189.445" width="14" height="0.554529" rx="1"/>
<rect class="sA" x="472" y="188.614" width="14" height="1.38632" rx="1"/>
<rect class="sA" x="488" y="189.445" width="14" height="0.554529" rx="1"/>
<rect class="sA" x="504" y="189.445" width="14" height="0.554529" rx="1"/>
<rect class="sA" x="520" y="189.445" width="14" height="0.554529" rx="1"/>
<rect class="sA" x="536" y="189.445" width="14" height="0.554529" rx="1"/>
<rect class="sA" x="552" y="190" width="14" height="0" rx="1"/>
<rect class="sA" x="568" y="189.445" width="14" height="0.554529" rx="1"/>
<rect class="sA" x="584" y="190" width="14" height="0" rx="1"/>
<rect class="sA" x="600" y="189.445" width="14" height="0.554529" rx="1"/>
<rect class="sA" x="616" y="190" width="14" height="0" rx="1"/>
<rect class="sA" x="632" y="190" width="14" height="0" rx="1"/>
<rect class="sA" x="648" y="189.723" width="14" height="0.277264" rx="1"/>
<rect class="sA" x="664" y="190" width="14" height="0" rx="1"/>
<line class="sLm" x1="40" y1="190" x2="686" y2="190" marker-end="url(#ahm)"/>
<line class="sLg" x1="166.2" y1="34" x2="166.2" y2="196" stroke-dasharray="5 3"/>
<text class="sGt" x="170.193" y="30">p50 ≈ 79 ms</text>
<line class="sLw" x1="300.0" y1="34" x2="300.0" y2="196" stroke-dasharray="5 3"/>
<text class="sWt" x="303.951" y="30">p95 ≈ 162 ms</text>
<line class="sLr" x1="411.4" y1="34" x2="411.4" y2="196" stroke-dasharray="5 3"/>
<text class="sRt" x="415.433" y="30">p99 ≈ 232 ms</text>
<text class="sC" x="680" y="210" text-anchor="end">request latency (ms) →</text>
<text class="sC" x="40" y="210" text-anchor="middle">0</text>
<text class="sC" x="200" y="210" text-anchor="middle">100</text>
<text class="sC" x="360" y="210" text-anchor="middle">200</text>
<text class="sC" x="520" y="210" text-anchor="middle">300</text>
<text class="sS" x="360" y="236" text-anchor="middle">Half the requests beat p50; one in a hundred is slower than p99. The mean hides that tail.</text>
</svg><figcaption>Latency percentiles. A user who loads a page making 20 API calls is likely to hit at least one request slower than the p95.</figcaption></figure>

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

<figure class="dia steps" data-start="1"><svg viewBox="0 0 720 245" role="img" aria-label="Scaling a server vertically, then horizontally behind a load balancer with sessions in Redis, and surviving a server failure">
<rect class="sB" x="20" y="100" width="90" height="44" rx="8"/><text class="sT" x="65" y="127" text-anchor="middle">users</text>
<g data-s="1-1"><line class="sL" x1="110" y1="122" x2="246" y2="122" marker-end="url(#ah)"/><rect class="sR" x="250" y="100" width="110" height="40" rx="8"/><text class="sT" x="305" y="118" text-anchor="middle">app + DB</text><text class="sC" x="305" y="134" text-anchor="middle">CPU 85%</text><text class="sT" x="560" y="116" text-anchor="middle">One server: simple,</text><text class="sS" x="560" y="134" text-anchor="middle">but it is near its limit.</text></g>
<g data-s="2-2"><line class="sL" x1="110" y1="122" x2="246" y2="122" marker-end="url(#ah)"/><rect class="sW" x="250" y="70" width="170" height="104" rx="10"/><text class="sT" x="335" y="116" text-anchor="middle">bigger server</text><text class="sC" x="335" y="134" text-anchor="middle">4× CPU, 4× RAM</text><text class="sT" x="570" y="110" text-anchor="middle">Scale up: no code change.</text><text class="sS" x="570" y="128" text-anchor="middle">A ceiling, a restart to resize,</text><text class="sS" x="570" y="146" text-anchor="middle">still one point of failure.</text></g>
<g data-s="3-3"><rect class="sB" x="160" y="100" width="100" height="44" rx="8"/><text class="sT" x="210" y="120" text-anchor="middle">load</text><text class="sC" x="210" y="136" text-anchor="middle">balancer</text><line class="sL" x1="110" y1="122" x2="156" y2="122" marker-end="url(#ah)"/><rect class="sA" x="320" y="40" width="110" height="40" rx="8"/><text class="sT" x="375" y="58" text-anchor="middle">app 1</text><text class="sC" x="375" y="74" text-anchor="middle">stateless</text><line class="sL" x1="260" y1="122" x2="316" y2="60" marker-end="url(#ah)"/><line class="sL" x1="430" y1="60" x2="486" y2="122"/><rect class="sA" x="320" y="102" width="110" height="40" rx="8"/><text class="sT" x="375" y="120" text-anchor="middle">app 2</text><text class="sC" x="375" y="136" text-anchor="middle">stateless</text><line class="sL" x1="260" y1="122" x2="316" y2="122" marker-end="url(#ah)"/><line class="sL" x1="430" y1="122" x2="486" y2="122"/><rect class="sA" x="320" y="164" width="110" height="40" rx="8"/><text class="sT" x="375" y="182" text-anchor="middle">app 3</text><text class="sC" x="375" y="198" text-anchor="middle">stateless</text><line class="sL" x1="260" y1="122" x2="316" y2="184" marker-end="url(#ah)"/><line class="sL" x1="430" y1="184" x2="486" y2="122"/><rect class="sG" x="490" y="100" width="100" height="44" rx="8"/><text class="sT" x="540" y="120" text-anchor="middle">Redis</text><text class="sC" x="540" y="136" text-anchor="middle">sessions</text><rect class="sG" x="610" y="100" width="96" height="44" rx="8"/><text class="sT" x="658" y="127" text-anchor="middle">database</text><line class="sLm" x1="590" y1="122" x2="606" y2="122"/><text class="sS" x="360" y="230" text-anchor="middle">Scale out: any server can take any request because none of them keeps user state.</text></g>
<g data-s="4-4"><rect class="sB" x="160" y="100" width="100" height="44" rx="8"/><text class="sT" x="210" y="120" text-anchor="middle">load</text><text class="sC" x="210" y="136" text-anchor="middle">balancer</text><line class="sL" x1="110" y1="122" x2="156" y2="122" marker-end="url(#ah)"/><rect class="sA" x="320" y="40" width="110" height="40" rx="8"/><text class="sT" x="375" y="58" text-anchor="middle">app 1</text><text class="sC" x="375" y="74" text-anchor="middle">stateless</text><line class="sL" x1="260" y1="122" x2="316" y2="60" marker-end="url(#ah)"/><line class="sL" x1="430" y1="60" x2="486" y2="122"/><rect class="sR" x="320" y="102" width="110" height="40" rx="8"/><text class="sT" x="375" y="120" text-anchor="middle">app 2</text><text class="sC" x="375" y="136" text-anchor="middle">down</text><line class="sLm" x1="260" y1="122" x2="316" y2="122" stroke-dasharray="4 3"/><line class="sLm" x1="430" y1="122" x2="486" y2="122"/><rect class="sA" x="320" y="164" width="110" height="40" rx="8"/><text class="sT" x="375" y="182" text-anchor="middle">app 3</text><text class="sC" x="375" y="198" text-anchor="middle">stateless</text><line class="sL" x1="260" y1="122" x2="316" y2="184" marker-end="url(#ah)"/><line class="sL" x1="430" y1="184" x2="486" y2="122"/><rect class="sG" x="490" y="100" width="100" height="44" rx="8"/><text class="sT" x="540" y="120" text-anchor="middle">Redis</text><text class="sC" x="540" y="136" text-anchor="middle">sessions</text><rect class="sG" x="610" y="100" width="96" height="44" rx="8"/><text class="sT" x="658" y="127" text-anchor="middle">database</text><line class="sLm" x1="590" y1="122" x2="606" y2="122"/><text class="sS" x="360" y="230" text-anchor="middle">App 2 dies: health checks fail, the balancer stops sending it traffic, nobody is logged out.</text></g>
</svg><ol class="dia-steps">
<li>One server does everything and is running hot.</li>
<li>Vertical: buy a bigger machine. Quick, but there is a largest machine, resizing usually means downtime, and it is still a single point of failure.</li>
<li>Horizontal: several identical, stateless app servers behind a load balancer; sessions live in Redis, data in the database.</li>
<li>When one server fails, the load balancer's health checks notice and route around it. Because no state lived on it, users don't notice.</li>
</ol><figcaption>Vertical vs horizontal scaling. Stateless servers are what make the last step boring.</figcaption></figure>

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

<figure class="dia"><svg viewBox="0 0 720 402" role="img" aria-label="Round robin sends the next request to server 2 even though it is busy with a slow report, while least connections sends it to a less busy server; in a simulation of three servers at 60 percent load where one request in ten is slow, least connections cuts p95 latency from about 9.3 to 5.9 seconds and p99 from about 14 to 10 seconds, with the same median">
<text class="sT" x="160" y="22" text-anchor="middle">round robin: next in turn</text><rect class="sA" x="10" y="92" width="70" height="40" rx="8"/><text class="sT" x="45" y="117" text-anchor="middle">LB</text><rect class="sB" x="130" y="40" width="80" height="38" rx="6"/><text class="sS" x="170" y="64" text-anchor="middle">server 1</text><rect class="sN" x="218" y="50" width="10" height="18" rx="3"/><line class="sLm" x1="82" y1="112" x2="128" y2="59" marker-end="url(#ahm)" opacity=".4"/><rect class="sB" x="130" y="92" width="80" height="38" rx="6"/><text class="sS" x="170" y="116" text-anchor="middle">server 2</text><rect class="sR" x="218" y="102" width="34" height="18" rx="3"/><rect class="sN" x="256" y="102" width="10" height="18" rx="3"/><rect class="sN" x="270" y="102" width="10" height="18" rx="3"/><line class="sLr" x1="82" y1="112" x2="128" y2="111" marker-end="url(#ahr)"/><rect class="sB" x="130" y="144" width="80" height="38" rx="6"/><text class="sS" x="170" y="168" text-anchor="middle">server 3</text><rect class="sN" x="218" y="154" width="10" height="18" rx="3"/><line class="sLm" x1="82" y1="112" x2="128" y2="163" marker-end="url(#ahm)" opacity=".4"/><text class="sRt" x="160" y="210" text-anchor="middle">request 7 waits behind a 5.5 s report</text>
<text class="sT" x="520" y="22" text-anchor="middle">least connections</text><rect class="sA" x="370" y="92" width="70" height="40" rx="8"/><text class="sT" x="405" y="117" text-anchor="middle">LB</text><rect class="sB" x="490" y="40" width="80" height="38" rx="6"/><text class="sS" x="530" y="64" text-anchor="middle">server 1</text><rect class="sN" x="578" y="50" width="10" height="18" rx="3"/><line class="sLg" x1="442" y1="112" x2="488" y2="59" marker-end="url(#ahg)"/><rect class="sB" x="490" y="92" width="80" height="38" rx="6"/><text class="sS" x="530" y="116" text-anchor="middle">server 2</text><rect class="sR" x="578" y="102" width="34" height="18" rx="3"/><rect class="sN" x="616" y="102" width="10" height="18" rx="3"/><rect class="sN" x="630" y="102" width="10" height="18" rx="3"/><line class="sLm" x1="442" y1="112" x2="488" y2="111" marker-end="url(#ahm)" opacity=".4"/><rect class="sB" x="490" y="144" width="80" height="38" rx="6"/><text class="sS" x="530" y="168" text-anchor="middle">server 3</text><rect class="sN" x="578" y="154" width="10" height="18" rx="3"/><line class="sLm" x1="442" y1="112" x2="488" y2="163" marker-end="url(#ahm)" opacity=".4"/><text class="sGt" x="520" y="210" text-anchor="middle">goes to a server with the fewest open</text>
<text class="sS" x="160" y="226" text-anchor="middle">(red block: one slow request)</text><text class="sGt" x="520" y="226" text-anchor="middle">requests, avoiding the slow one</text>
<text class="sS" x="360" y="254" text-anchor="middle">Simulated: 3 servers, 60% busy, 10% of requests take 5.5 s, the rest 0.5 s (60,000 requests)</text>
<rect class="sR" x="150" y="376.428" width="40" height="3.57185" rx="3"/><text class="sS" x="170" y="371.428" text-anchor="middle">0.5 s</text>
<rect class="sG" x="196" y="376.5" width="40" height="3.5" rx="3"/><text class="sS" x="216" y="371.5" text-anchor="middle">0.5 s</text>
<text class="sT" x="193" y="396" text-anchor="middle">p50</text>
<rect class="sR" x="320" y="314.631" width="40" height="65.3687" rx="3"/><text class="sS" x="340" y="309.631" text-anchor="middle">9.3 s</text>
<rect class="sG" x="366" y="338.82" width="40" height="41.1796" rx="3"/><text class="sS" x="386" y="333.82" text-anchor="middle">5.9 s</text>
<text class="sT" x="363" y="396" text-anchor="middle">p95</text>
<rect class="sR" x="490" y="279.627" width="40" height="100.373" rx="3"/><text class="sS" x="510" y="274.627" text-anchor="middle">14.3 s</text>
<rect class="sG" x="536" y="312.021" width="40" height="67.9794" rx="3"/><text class="sS" x="556" y="307.021" text-anchor="middle">9.7 s</text>
<text class="sT" x="533" y="396" text-anchor="middle">p99</text>
<line class="sLm" x1="120" y1="380" x2="640" y2="380"/>
<rect class="sR" x="596" y="300" width="12" height="12" rx="2"/><text class="sS" x="614" y="310">round robin</text><rect class="sG" x="596" y="320" width="12" height="12" rx="2"/><text class="sS" x="614" y="330">least connections</text>
</svg><figcaption>Why the balancing algorithm matters when request costs vary: same servers, same traffic, different tail latency (queueing simulation).</figcaption></figure>

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

<figure class="dia anim" data-rest="2"><svg viewBox="0 0 720 195" role="img" aria-label="Animation: a burst of twelve orders enters a queue at once and a worker processes them one by one at a steady pace">
<rect class="sA" x="10" y="80" width="110" height="50" rx="8"/><text class="sT" x="65" y="103" text-anchor="middle">checkout API</text><text class="sC" x="65" y="119" text-anchor="middle">burst of orders</text>
<rect class="sN" x="170" y="88" width="330" height="34" rx="17"/><text class="sT" x="335" y="76" text-anchor="middle">queue</text>
<rect class="sG" x="560" y="80" width="140" height="50" rx="8"/><text class="sT" x="630" y="103" text-anchor="middle">worker</text><text class="sC" x="630" y="119" text-anchor="middle">1 job / 0.6 s</text>
<line class="sL" x1="120" y1="105" x2="166" y2="105" marker-end="url(#ah)"/><line class="sL" x1="500" y1="105" x2="556" y2="105" marker-end="url(#ah)"/>
<circle class="sPw" r="6" opacity="0"><animateMotion dur="11.0s" repeatCount="indefinite" calcMode="linear" path="M120 105 H630" keyPoints="0;0;0.7059;0.7059;1;1" keyTimes="0;0.0273;0.0545;0.1455;0.1773;1"/><animate attributeName="opacity" dur="11.0s" repeatCount="indefinite" calcMode="discrete" values="0;1;0" keyTimes="0;0.0273;0.1773"/></circle>
<circle class="sPw" r="6" opacity="0"><animateMotion dur="11.0s" repeatCount="indefinite" calcMode="linear" path="M120 105 H630" keyPoints="0;0;0.6569;0.6569;1;1" keyTimes="0;0.0364;0.0636;0.2018;0.2336;1"/><animate attributeName="opacity" dur="11.0s" repeatCount="indefinite" calcMode="discrete" values="0;1;0" keyTimes="0;0.0364;0.2336"/></circle>
<circle class="sPw" r="6" opacity="0"><animateMotion dur="11.0s" repeatCount="indefinite" calcMode="linear" path="M120 105 H630" keyPoints="0;0;0.6078;0.6078;1;1" keyTimes="0;0.0455;0.0727;0.2582;0.2900;1"/><animate attributeName="opacity" dur="11.0s" repeatCount="indefinite" calcMode="discrete" values="0;1;0" keyTimes="0;0.0455;0.2900"/></circle>
<circle class="sPw" r="6" opacity="0"><animateMotion dur="11.0s" repeatCount="indefinite" calcMode="linear" path="M120 105 H630" keyPoints="0;0;0.5588;0.5588;1;1" keyTimes="0;0.0545;0.0818;0.3145;0.3464;1"/><animate attributeName="opacity" dur="11.0s" repeatCount="indefinite" calcMode="discrete" values="0;1;0" keyTimes="0;0.0545;0.3464"/></circle>
<circle class="sPw" r="6" opacity="0"><animateMotion dur="11.0s" repeatCount="indefinite" calcMode="linear" path="M120 105 H630" keyPoints="0;0;0.5098;0.5098;1;1" keyTimes="0;0.0636;0.0909;0.3709;0.4027;1"/><animate attributeName="opacity" dur="11.0s" repeatCount="indefinite" calcMode="discrete" values="0;1;0" keyTimes="0;0.0636;0.4027"/></circle>
<circle class="sPw" r="6" opacity="0"><animateMotion dur="11.0s" repeatCount="indefinite" calcMode="linear" path="M120 105 H630" keyPoints="0;0;0.4608;0.4608;1;1" keyTimes="0;0.0727;0.1000;0.4273;0.4591;1"/><animate attributeName="opacity" dur="11.0s" repeatCount="indefinite" calcMode="discrete" values="0;1;0" keyTimes="0;0.0727;0.4591"/></circle>
<circle class="sPw" r="6" opacity="0"><animateMotion dur="11.0s" repeatCount="indefinite" calcMode="linear" path="M120 105 H630" keyPoints="0;0;0.4118;0.4118;1;1" keyTimes="0;0.0818;0.1091;0.4836;0.5155;1"/><animate attributeName="opacity" dur="11.0s" repeatCount="indefinite" calcMode="discrete" values="0;1;0" keyTimes="0;0.0818;0.5155"/></circle>
<circle class="sPw" r="6" opacity="0"><animateMotion dur="11.0s" repeatCount="indefinite" calcMode="linear" path="M120 105 H630" keyPoints="0;0;0.3627;0.3627;1;1" keyTimes="0;0.0909;0.1182;0.5400;0.5718;1"/><animate attributeName="opacity" dur="11.0s" repeatCount="indefinite" calcMode="discrete" values="0;1;0" keyTimes="0;0.0909;0.5718"/></circle>
<circle class="sPw" r="6" opacity="0"><animateMotion dur="11.0s" repeatCount="indefinite" calcMode="linear" path="M120 105 H630" keyPoints="0;0;0.3137;0.3137;1;1" keyTimes="0;0.1000;0.1273;0.5964;0.6282;1"/><animate attributeName="opacity" dur="11.0s" repeatCount="indefinite" calcMode="discrete" values="0;1;0" keyTimes="0;0.1000;0.6282"/></circle>
<circle class="sPw" r="6" opacity="0"><animateMotion dur="11.0s" repeatCount="indefinite" calcMode="linear" path="M120 105 H630" keyPoints="0;0;0.2647;0.2647;1;1" keyTimes="0;0.1091;0.1364;0.6527;0.6845;1"/><animate attributeName="opacity" dur="11.0s" repeatCount="indefinite" calcMode="discrete" values="0;1;0" keyTimes="0;0.1091;0.6845"/></circle>
<circle class="sPw" r="6" opacity="0"><animateMotion dur="11.0s" repeatCount="indefinite" calcMode="linear" path="M120 105 H630" keyPoints="0;0;0.2157;0.2157;1;1" keyTimes="0;0.1182;0.1455;0.7091;0.7409;1"/><animate attributeName="opacity" dur="11.0s" repeatCount="indefinite" calcMode="discrete" values="0;1;0" keyTimes="0;0.1182;0.7409"/></circle>
<circle class="sPw" r="6" opacity="0"><animateMotion dur="11.0s" repeatCount="indefinite" calcMode="linear" path="M120 105 H630" keyPoints="0;0;0.1667;0.1667;1;1" keyTimes="0;0.1273;0.1545;0.7655;0.7973;1"/><animate attributeName="opacity" dur="11.0s" repeatCount="indefinite" calcMode="discrete" values="0;1;0" keyTimes="0;0.1273;0.7973"/></circle>
<text class="sS" x="335" y="160" text-anchor="middle">arrives in a burst, drains at the workers' pace</text>
<text class="sGt" x="335" y="180" text-anchor="middle">the API answered every order in milliseconds</text>
</svg><figcaption>Spike absorption. The queue turns a burst the workers couldn't handle into a backlog they clear steadily. Watch the queue's depth: if it keeps growing, add workers.</figcaption></figure>

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

<figure class="dia"><svg viewBox="0 0 720 236" role="img" aria-label="Availability multiplies down for components in series and up for redundant components in parallel">
<text class="sT" x="20" y="26">In series: every part must work</text>
<rect class="sA" x="40" y="40" width="110" height="40" rx="8"/><text class="sT" x="95" y="58" text-anchor="middle">API</text><text class="sC" x="95" y="74" text-anchor="middle">99.9%</text><line class="sLm" x1="150" y1="60" x2="196" y2="60" marker-end="url(#ahm)"/><rect class="sA" x="200" y="40" width="110" height="40" rx="8"/><text class="sT" x="255" y="58" text-anchor="middle">database</text><text class="sC" x="255" y="74" text-anchor="middle">99.9%</text><line class="sLm" x1="310" y1="60" x2="356" y2="60" marker-end="url(#ahm)"/><rect class="sA" x="360" y="40" width="110" height="40" rx="8"/><text class="sT" x="415" y="58" text-anchor="middle">payments</text><text class="sC" x="415" y="74" text-anchor="middle">99.9%</text>
<text class="sM" x="490" y="56">0.999 × 0.999 × 0.999</text><text class="sRt" x="490" y="74">≈ 99.7%: lower than any part</text>
<text class="sT" x="20" y="126">In parallel: any one part is enough</text>
<rect class="sG" x="200" y="136" width="110" height="40" rx="8"/><text class="sT" x="255" y="154" text-anchor="middle">server A</text><text class="sC" x="255" y="170" text-anchor="middle">99%</text><rect class="sG" x="200" y="186" width="110" height="40" rx="8"/><text class="sT" x="255" y="204" text-anchor="middle">server B</text><text class="sC" x="255" y="220" text-anchor="middle">99%</text>
<line class="sLm" x1="150" y1="181" x2="196" y2="156" marker-end="url(#ahm)"/><line class="sLm" x1="150" y1="181" x2="196" y2="206" marker-end="url(#ahm)"/><rect class="sB" x="40" y="160" width="110" height="40" rx="8"/><text class="sT" x="95" y="185" text-anchor="middle">balancer</text>
<text class="sM" x="340" y="172">1 − (0.01 × 0.01)</text><text class="sGt" x="340" y="190">= 99.99%: higher than either</text>
<text class="sC" x="340" y="214">(only if their failures are independent)</text>
</svg><figcaption>The arithmetic behind "remove hard dependencies" and "add redundancy". Shared failure causes (one zone, one bad deploy) break the parallel rule.</figcaption></figure>

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
