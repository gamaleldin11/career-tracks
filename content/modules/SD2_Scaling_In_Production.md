# Scaling in Production — From One Server to Millions of Users

Every large system started small, and most of them grew one bottleneck at a time. This module walks the ladder that almost every web product climbs: one server, a separate database, many app servers behind a load balancer, caches and replicas, queues, then partitioned data, multiple regions and, sometimes, microservices. For each rung it gives **the signal that tells you to climb, what you add, and what it costs you**, with real examples from companies that published their numbers. The building blocks are explained in [[SD1]]; choosing between products is [[SD3]].

> [!focus]
> **Entry must:** describe the ladder in order and say why each step exists; explain connection pooling, horizontal scaling behind a load balancer, caching, read replicas and queues; answer "how would you handle 10× the users?" for your own project.
> **Mid adds:** identify the bottleneck from metrics before choosing a fix; partitioning and sharding and their costs; autoscaling and load testing; multi-region trade-offs; why microservices solve an organisational problem more than a traffic problem.
> **Most asked:** *How would you scale this to a million users?* · *Your database CPU is at 90%: what do you do?* · *When would you introduce caching / read replicas / sharding?* · *Monolith or microservices?* · *How do you know it will survive launch day?*
> **Time budget:** 3 hours.

## SD2.1 The one rule: measure, find the bottleneck, fix only that 🟢 ⭐

Scaling is not a checklist you complete in advance. It is a loop:

1. **Measure** what users experience (latency percentiles, error rate) and what the machines feel (CPU, memory, disk I/O, connections, queue depth).
2. **Find the bottleneck**: the one resource that saturates first. There is always exactly one at a time.
3. **Fix that** with the simplest change that buys enough headroom.
4. **Repeat**, because the bottleneck has now moved somewhere else.

<figure class="dia anim"><svg viewBox="0 0 720 222" role="img" aria-label="Animation: a loop of measure, find the bottleneck, fix only that, and repeat">
<ellipse class="sN" cx="360" cy="112" rx="205" ry="78" stroke-dasharray="6 5"/>
<rect class="sA" x="253" y="12" width="214" height="44" rx="10"/><text class="sT" x="360" y="31" text-anchor="middle">1 · measure</text><text class="sC" x="360" y="47" text-anchor="middle">latency, errors, CPU, queues</text>
<rect class="sW" x="458" y="90" width="214" height="44" rx="10"/><text class="sT" x="565" y="109" text-anchor="middle">2 · find the bottleneck</text><text class="sC" x="565" y="125" text-anchor="middle">the ONE resource that saturates</text>
<rect class="sG" x="253" y="168" width="214" height="44" rx="10"/><text class="sT" x="360" y="187" text-anchor="middle">3 · fix only that</text><text class="sC" x="360" y="203" text-anchor="middle">simplest change with headroom</text>
<rect class="sB" x="48" y="90" width="214" height="44" rx="10"/><text class="sT" x="155" y="109" text-anchor="middle">4 · it moved: repeat</text><text class="sC" x="155" y="125" text-anchor="middle">the next limit appears</text>
<circle class="sPv" r="7"><animateMotion dur="8s" repeatCount="indefinite" path="M360 34 A205 78 0 1 1 359.9 34"/></circle>
</svg><figcaption>Scaling is a loop, not a checklist. Each fix moves the bottleneck somewhere else.</figcaption></figure>

> [!say]
> "I wouldn't add components up front. I'd measure where the time and the saturation are, fix that specific bottleneck with the simplest change, then measure again. Each step on the scaling ladder adds operational cost, so each one has to be earned by a real limit."

> [!mistake] Designing for Google's traffic on day one
> Microservices, Kubernetes, Kafka and sharding for a product with 500 users slow the team down for years and buy nothing. The opposite mistake is also real: no backups, no monitoring and no way to add a second server. Start simple, but keep the doors open: stateless app servers, a managed database, and metrics from day one.

## SD2.2 The ladder at a glance 🟢 ⭐

User counts are often attached to these stages ("1,000 users: one server; 1 million: microservices"). Treat them as very loose: a chat app with 10,000 active users can do more work than a brochure site with 10 million visitors. **Climb when you see the signal, not when you pass a number.**

| Stage | Add | Climb when you see | What it costs you |
|---|---|---|---|
| 1 | **One server** running app and database | (start here) | One failure takes everything down |
| 2 | **Separate, managed database** + connection pooling | App and database fight for CPU/RAM; you need backups and point-in-time restore | A network hop; a monthly bill |
| 3 | **Load balancer + several stateless app servers**, autoscaling | App CPU saturates; deploys cause downtime; one server is a single point of failure | Sessions and files must move out of the servers |
| 4 | **Cache + CDN + read replicas** | Database CPU is mostly reads; the same queries repeat; users far away see slow pages | Staleness, invalidation, replication lag |
| 5 | **Queues and workers** | Requests are slow because of work the user doesn't need to wait for; spikes overload downstream systems | Duplicate messages, retries, harder debugging |
| 6 | **Partitioning and sharding** | The primary database can't keep up with *writes* or storage even on the biggest sensible machine | Cross-shard queries and transactions become hard; resharding is a project |
| 7 | **Multiple regions** | Users on other continents need low latency; the business needs to survive a region outage | Data replication across regions, conflict handling, much higher cost |
| (any) | **Splitting into services** | Many teams block each other in one codebase; parts need very different scaling or release cycles | Network calls, distributed failures, observability and platform work |

<figure class="dia anim"><svg viewBox="0 0 720 210" role="img" aria-label="Animation: scaling ladder from one server to multi-region">
<rect class="sB" x="10" y="150" width="88" height="44" rx="6"/><text class="sT" x="54" y="170" text-anchor="middle">1 · one</text><text class="sT" x="54" y="185" text-anchor="middle">server</text>
<rect class="sB" x="110" y="128" width="88" height="66" rx="6"/><text class="sT" x="154" y="158" text-anchor="middle">2 · own</text><text class="sT" x="154" y="173" text-anchor="middle">database</text>
<rect class="sA" x="210" y="106" width="88" height="88" rx="6"/><text class="sT" x="254" y="146" text-anchor="middle">3 · LB +</text><text class="sT" x="254" y="161" text-anchor="middle">N servers</text>
<rect class="sA" x="310" y="84" width="88" height="110" rx="6"/><text class="sT" x="354" y="134" text-anchor="middle">4 · cache,</text><text class="sT" x="354" y="149" text-anchor="middle">CDN, replicas</text>
<rect class="sG" x="410" y="62" width="88" height="132" rx="6"/><text class="sT" x="454" y="124" text-anchor="middle">5 · queues</text><text class="sT" x="454" y="139" text-anchor="middle">+ workers</text>
<rect class="sW" x="510" y="40" width="88" height="154" rx="6"/><text class="sT" x="554" y="112" text-anchor="middle">6 · shards</text>
<rect class="sR" x="610" y="18" width="98" height="176" rx="6"/><text class="sT" x="659" y="100" text-anchor="middle">7 · multi-</text><text class="sT" x="659" y="115" text-anchor="middle">region</text>
<text class="sS" x="10" y="20">Each step: more capacity and resilience, more moving parts to run</text>
<circle class="sPg" r="4" opacity="0"><animateMotion dur="10s" repeatCount="indefinite" calcMode="linear" keyPoints="0;0;1;1" keyTimes="0;0.000;0.850;1" path="M54 146 L154 124 L254 102 L354 80 L454 58 L554 36 L659 14"/><animate attributeName="opacity" dur="10s" repeatCount="indefinite" values="0;0;1;1;0;0" keyTimes="0;0.000;0.002;0.850;0.852;1"/></circle>
</svg><figcaption>Most products never need the last two steps. Many successful ones stop at step 4 or 5 for years.</figcaption></figure>

## SD2.3 Stages 1–2: one server, then a separate database 🟢 ⭐

**One server** (a single VM, or a platform such as Azure App Service, Render or a small VPS) is the right start. It is fast to build, cheap and easy to reason about. Do these things from day one, because they are cheap now and painful later:

- **Automated backups**, and one restore actually tested.
- **Basic monitoring**: uptime checks, error logging, CPU and memory graphs.
- **Configuration and secrets outside the code**, so a second server can be started identically.
- **Files in object storage** rather than the server's disk.

**Stage 2: move the database to its own managed instance** (Azure SQL, Amazon RDS or Aurora, Cloud SQL, or a managed PostgreSQL provider). The app and the database stop competing for memory, and the provider handles patching, backups, point-in-time restore and failover to a standby.

> [!term] Connection pooling
> Opening a database connection is expensive (a TCP and TLS handshake, authentication, a server process or thread), and databases support a limited number at once; PostgreSQL's default `max_connections` is 100. A **pool** keeps a set of open connections and lends them to requests. Every serious driver pools inside the app (ADO.NET and EF Core do by default); when many app instances or serverless functions connect, an external pooler such as **PgBouncer** or a managed proxy (Amazon RDS Proxy) sits in front of the database so 500 app processes share 50 real connections.

> [!mistake] Scaling app servers into a connection storm
> Autoscaling from 4 to 40 app instances, each with a pool of 50, means up to 2,000 connections hitting a database that allows a few hundred. The database falls over *because* you scaled. Size pools with Little's Law ([[SD1.3]]) and put a pooler in front.

<figure class="dia anim"><svg viewBox="0 0 720 240" role="img" aria-label="Animation: forty app instances each opening fifty connections overwhelm a database with a storm of connections; with a connection pooler, apps connect to PgBouncer, which funnels the work into fifty real connections">
<text class="sT" x="180" y="22" text-anchor="middle">Without a pooler</text><text class="sT" x="540" y="22" text-anchor="middle">With PgBouncer in front</text>
<rect class="sA" x="20" y="36" width="70" height="18" rx="3"/><text class="sC" x="55" y="49" text-anchor="middle">app 1</text>
<line class="sLr" x1="90" y1="45" x2="236" y2="86" opacity=".35"/>
<line class="sLr" x1="90" y1="45" x2="236" y2="116" opacity=".35"/>
<line class="sLr" x1="90" y1="45" x2="236" y2="146" opacity=".35"/>
<rect class="sA" x="20" y="58" width="70" height="18" rx="3"/><text class="sC" x="55" y="71" text-anchor="middle">app 2</text>
<line class="sLr" x1="90" y1="67" x2="236" y2="86" opacity=".35"/>
<line class="sLr" x1="90" y1="67" x2="236" y2="116" opacity=".35"/>
<line class="sLr" x1="90" y1="67" x2="236" y2="146" opacity=".35"/>
<rect class="sA" x="20" y="80" width="70" height="18" rx="3"/><text class="sC" x="55" y="93" text-anchor="middle">app 3</text>
<line class="sLr" x1="90" y1="89" x2="236" y2="86" opacity=".35"/>
<line class="sLr" x1="90" y1="89" x2="236" y2="116" opacity=".35"/>
<line class="sLr" x1="90" y1="89" x2="236" y2="146" opacity=".35"/>
<rect class="sA" x="20" y="102" width="70" height="18" rx="3"/><text class="sC" x="55" y="115" text-anchor="middle">app 4</text>
<line class="sLr" x1="90" y1="111" x2="236" y2="86" opacity=".35"/>
<line class="sLr" x1="90" y1="111" x2="236" y2="116" opacity=".35"/>
<line class="sLr" x1="90" y1="111" x2="236" y2="146" opacity=".35"/>
<rect class="sA" x="20" y="124" width="70" height="18" rx="3"/><text class="sC" x="55" y="137" text-anchor="middle">app 5</text>
<line class="sLr" x1="90" y1="133" x2="236" y2="86" opacity=".35"/>
<line class="sLr" x1="90" y1="133" x2="236" y2="116" opacity=".35"/>
<line class="sLr" x1="90" y1="133" x2="236" y2="146" opacity=".35"/>
<rect class="sA" x="20" y="146" width="70" height="18" rx="3"/><text class="sC" x="55" y="159" text-anchor="middle">app 6</text>
<line class="sLr" x1="90" y1="155" x2="236" y2="86" opacity=".35"/>
<line class="sLr" x1="90" y1="155" x2="236" y2="116" opacity=".35"/>
<line class="sLr" x1="90" y1="155" x2="236" y2="146" opacity=".35"/>
<rect class="sA" x="20" y="168" width="70" height="18" rx="3"/><text class="sC" x="55" y="181" text-anchor="middle">app 7</text>
<line class="sLr" x1="90" y1="177" x2="236" y2="86" opacity=".35"/>
<line class="sLr" x1="90" y1="177" x2="236" y2="116" opacity=".35"/>
<line class="sLr" x1="90" y1="177" x2="236" y2="146" opacity=".35"/>
<rect class="sA" x="20" y="190" width="70" height="18" rx="3"/><text class="sC" x="55" y="203" text-anchor="middle">app 8</text>
<line class="sLr" x1="90" y1="199" x2="236" y2="86" opacity=".35"/>
<line class="sLr" x1="90" y1="199" x2="236" y2="116" opacity=".35"/>
<line class="sLr" x1="90" y1="199" x2="236" y2="146" opacity=".35"/>
<text class="sC" x="20" y="228">… 40 instances × pool 50</text>
<rect class="sR" x="240" y="70" width="110" height="90" rx="10"/><text class="sT" x="295" y="102" text-anchor="middle">database</text><text class="sRt" x="295" y="120" text-anchor="middle">2,000 asked</text><text class="sC" x="295" y="138" text-anchor="middle">~100–500 allowed</text>
<rect class="sA" x="380" y="36" width="70" height="18" rx="3"/><text class="sC" x="415" y="49" text-anchor="middle">app 1</text>
<line class="sLm" x1="450" y1="45" x2="496" y2="115" opacity=".6"/>
<rect class="sA" x="380" y="58" width="70" height="18" rx="3"/><text class="sC" x="415" y="71" text-anchor="middle">app 2</text>
<line class="sLm" x1="450" y1="67" x2="496" y2="115" opacity=".6"/>
<rect class="sA" x="380" y="80" width="70" height="18" rx="3"/><text class="sC" x="415" y="93" text-anchor="middle">app 3</text>
<line class="sLm" x1="450" y1="89" x2="496" y2="115" opacity=".6"/>
<rect class="sA" x="380" y="102" width="70" height="18" rx="3"/><text class="sC" x="415" y="115" text-anchor="middle">app 4</text>
<line class="sLm" x1="450" y1="111" x2="496" y2="115" opacity=".6"/>
<rect class="sA" x="380" y="124" width="70" height="18" rx="3"/><text class="sC" x="415" y="137" text-anchor="middle">app 5</text>
<line class="sLm" x1="450" y1="133" x2="496" y2="115" opacity=".6"/>
<rect class="sA" x="380" y="146" width="70" height="18" rx="3"/><text class="sC" x="415" y="159" text-anchor="middle">app 6</text>
<line class="sLm" x1="450" y1="155" x2="496" y2="115" opacity=".6"/>
<rect class="sA" x="380" y="168" width="70" height="18" rx="3"/><text class="sC" x="415" y="181" text-anchor="middle">app 7</text>
<line class="sLm" x1="450" y1="177" x2="496" y2="115" opacity=".6"/>
<rect class="sA" x="380" y="190" width="70" height="18" rx="3"/><text class="sC" x="415" y="203" text-anchor="middle">app 8</text>
<line class="sLm" x1="450" y1="199" x2="496" y2="115" opacity=".6"/>
<rect class="sV" x="500" y="85" width="90" height="60" rx="10"/><text class="sT" x="545" y="112" text-anchor="middle">PgBouncer</text><text class="sC" x="545" y="128" text-anchor="middle">2,000 in</text>
<line class="sLg" x1="590" y1="100" x2="616" y2="100"/>
<line class="sLg" x1="590" y1="110" x2="616" y2="110"/>
<line class="sLg" x1="590" y1="120" x2="616" y2="120"/>
<line class="sLg" x1="590" y1="130" x2="616" y2="130"/>
<rect class="sG" x="620" y="70" width="90" height="90" rx="10"/><text class="sT" x="665" y="108" text-anchor="middle">database</text><text class="sGt" x="665" y="126" text-anchor="middle">50 real</text>
<text class="sC" x="545" y="168" text-anchor="middle">50 out</text>
<circle class="sPr" r="3" opacity="0"><animateMotion dur="6s" repeatCount="indefinite" calcMode="linear" keyPoints="0;0;1;1" keyTimes="0;0.000;0.120;1" path="M90 45 L236 86"/><animate attributeName="opacity" dur="6s" repeatCount="indefinite" values="0;0;1;1;0;0" keyTimes="0;0.000;0.002;0.120;0.122;1"/></circle>
<circle class="sPr" r="3" opacity="0"><animateMotion dur="6s" repeatCount="indefinite" calcMode="linear" keyPoints="0;0;1;1" keyTimes="0;0.037;0.157;1" path="M90 45 L236 116"/><animate attributeName="opacity" dur="6s" repeatCount="indefinite" values="0;0;1;1;0;0" keyTimes="0;0.035;0.039;0.157;0.159;1"/></circle>
<circle class="sPr" r="3" opacity="0"><animateMotion dur="6s" repeatCount="indefinite" calcMode="linear" keyPoints="0;0;1;1" keyTimes="0;0.074;0.194;1" path="M90 45 L236 146"/><animate attributeName="opacity" dur="6s" repeatCount="indefinite" values="0;0;1;1;0;0" keyTimes="0;0.072;0.076;0.194;0.196;1"/></circle>
<circle class="sPr" r="3" opacity="0"><animateMotion dur="6s" repeatCount="indefinite" calcMode="linear" keyPoints="0;0;1;1" keyTimes="0;0.111;0.231;1" path="M90 67 L236 86"/><animate attributeName="opacity" dur="6s" repeatCount="indefinite" values="0;0;1;1;0;0" keyTimes="0;0.109;0.113;0.231;0.233;1"/></circle>
<circle class="sPr" r="3" opacity="0"><animateMotion dur="6s" repeatCount="indefinite" calcMode="linear" keyPoints="0;0;1;1" keyTimes="0;0.148;0.268;1" path="M90 67 L236 116"/><animate attributeName="opacity" dur="6s" repeatCount="indefinite" values="0;0;1;1;0;0" keyTimes="0;0.146;0.150;0.268;0.270;1"/></circle>
<circle class="sPr" r="3" opacity="0"><animateMotion dur="6s" repeatCount="indefinite" calcMode="linear" keyPoints="0;0;1;1" keyTimes="0;0.185;0.305;1" path="M90 67 L236 146"/><animate attributeName="opacity" dur="6s" repeatCount="indefinite" values="0;0;1;1;0;0" keyTimes="0;0.183;0.187;0.305;0.307;1"/></circle>
<circle class="sPr" r="3" opacity="0"><animateMotion dur="6s" repeatCount="indefinite" calcMode="linear" keyPoints="0;0;1;1" keyTimes="0;0.222;0.342;1" path="M90 89 L236 86"/><animate attributeName="opacity" dur="6s" repeatCount="indefinite" values="0;0;1;1;0;0" keyTimes="0;0.220;0.224;0.342;0.344;1"/></circle>
<circle class="sPr" r="3" opacity="0"><animateMotion dur="6s" repeatCount="indefinite" calcMode="linear" keyPoints="0;0;1;1" keyTimes="0;0.259;0.379;1" path="M90 89 L236 116"/><animate attributeName="opacity" dur="6s" repeatCount="indefinite" values="0;0;1;1;0;0" keyTimes="0;0.257;0.261;0.379;0.381;1"/></circle>
<circle class="sPr" r="3" opacity="0"><animateMotion dur="6s" repeatCount="indefinite" calcMode="linear" keyPoints="0;0;1;1" keyTimes="0;0.296;0.416;1" path="M90 89 L236 146"/><animate attributeName="opacity" dur="6s" repeatCount="indefinite" values="0;0;1;1;0;0" keyTimes="0;0.294;0.298;0.416;0.418;1"/></circle>
<circle class="sPr" r="3" opacity="0"><animateMotion dur="6s" repeatCount="indefinite" calcMode="linear" keyPoints="0;0;1;1" keyTimes="0;0.333;0.453;1" path="M90 111 L236 86"/><animate attributeName="opacity" dur="6s" repeatCount="indefinite" values="0;0;1;1;0;0" keyTimes="0;0.331;0.335;0.453;0.455;1"/></circle>
<circle class="sPr" r="3" opacity="0"><animateMotion dur="6s" repeatCount="indefinite" calcMode="linear" keyPoints="0;0;1;1" keyTimes="0;0.370;0.490;1" path="M90 111 L236 116"/><animate attributeName="opacity" dur="6s" repeatCount="indefinite" values="0;0;1;1;0;0" keyTimes="0;0.368;0.372;0.490;0.492;1"/></circle>
<circle class="sPr" r="3" opacity="0"><animateMotion dur="6s" repeatCount="indefinite" calcMode="linear" keyPoints="0;0;1;1" keyTimes="0;0.407;0.527;1" path="M90 111 L236 146"/><animate attributeName="opacity" dur="6s" repeatCount="indefinite" values="0;0;1;1;0;0" keyTimes="0;0.405;0.409;0.527;0.529;1"/></circle>
<circle class="sPr" r="3" opacity="0"><animateMotion dur="6s" repeatCount="indefinite" calcMode="linear" keyPoints="0;0;1;1" keyTimes="0;0.444;0.564;1" path="M90 133 L236 86"/><animate attributeName="opacity" dur="6s" repeatCount="indefinite" values="0;0;1;1;0;0" keyTimes="0;0.442;0.446;0.564;0.566;1"/></circle>
<circle class="sPr" r="3" opacity="0"><animateMotion dur="6s" repeatCount="indefinite" calcMode="linear" keyPoints="0;0;1;1" keyTimes="0;0.481;0.601;1" path="M90 133 L236 116"/><animate attributeName="opacity" dur="6s" repeatCount="indefinite" values="0;0;1;1;0;0" keyTimes="0;0.479;0.483;0.601;0.603;1"/></circle>
<circle class="sPr" r="3" opacity="0"><animateMotion dur="6s" repeatCount="indefinite" calcMode="linear" keyPoints="0;0;1;1" keyTimes="0;0.518;0.638;1" path="M90 133 L236 146"/><animate attributeName="opacity" dur="6s" repeatCount="indefinite" values="0;0;1;1;0;0" keyTimes="0;0.516;0.520;0.638;0.640;1"/></circle>
<circle class="sPr" r="3" opacity="0"><animateMotion dur="6s" repeatCount="indefinite" calcMode="linear" keyPoints="0;0;1;1" keyTimes="0;0.555;0.675;1" path="M90 155 L236 86"/><animate attributeName="opacity" dur="6s" repeatCount="indefinite" values="0;0;1;1;0;0" keyTimes="0;0.553;0.557;0.675;0.677;1"/></circle>
<circle class="sPr" r="3" opacity="0"><animateMotion dur="6s" repeatCount="indefinite" calcMode="linear" keyPoints="0;0;1;1" keyTimes="0;0.592;0.712;1" path="M90 155 L236 116"/><animate attributeName="opacity" dur="6s" repeatCount="indefinite" values="0;0;1;1;0;0" keyTimes="0;0.590;0.594;0.712;0.714;1"/></circle>
<circle class="sPr" r="3" opacity="0"><animateMotion dur="6s" repeatCount="indefinite" calcMode="linear" keyPoints="0;0;1;1" keyTimes="0;0.629;0.749;1" path="M90 155 L236 146"/><animate attributeName="opacity" dur="6s" repeatCount="indefinite" values="0;0;1;1;0;0" keyTimes="0;0.627;0.631;0.749;0.751;1"/></circle>
<circle class="sPr" r="3" opacity="0"><animateMotion dur="6s" repeatCount="indefinite" calcMode="linear" keyPoints="0;0;1;1" keyTimes="0;0.666;0.786;1" path="M90 177 L236 86"/><animate attributeName="opacity" dur="6s" repeatCount="indefinite" values="0;0;1;1;0;0" keyTimes="0;0.664;0.668;0.786;0.788;1"/></circle>
<circle class="sPr" r="3" opacity="0"><animateMotion dur="6s" repeatCount="indefinite" calcMode="linear" keyPoints="0;0;1;1" keyTimes="0;0.703;0.823;1" path="M90 177 L236 116"/><animate attributeName="opacity" dur="6s" repeatCount="indefinite" values="0;0;1;1;0;0" keyTimes="0;0.701;0.705;0.823;0.825;1"/></circle>
<circle class="sPr" r="3" opacity="0"><animateMotion dur="6s" repeatCount="indefinite" calcMode="linear" keyPoints="0;0;1;1" keyTimes="0;0.740;0.860;1" path="M90 177 L236 146"/><animate attributeName="opacity" dur="6s" repeatCount="indefinite" values="0;0;1;1;0;0" keyTimes="0;0.738;0.742;0.860;0.862;1"/></circle>
<circle class="sPr" r="3" opacity="0"><animateMotion dur="6s" repeatCount="indefinite" calcMode="linear" keyPoints="0;0;1;1" keyTimes="0;0.777;0.897;1" path="M90 199 L236 86"/><animate attributeName="opacity" dur="6s" repeatCount="indefinite" values="0;0;1;1;0;0" keyTimes="0;0.775;0.779;0.897;0.899;1"/></circle>
<circle class="sPr" r="3" opacity="0"><animateMotion dur="6s" repeatCount="indefinite" calcMode="linear" keyPoints="0;0;1;1" keyTimes="0;0.814;0.934;1" path="M90 199 L236 116"/><animate attributeName="opacity" dur="6s" repeatCount="indefinite" values="0;0;1;1;0;0" keyTimes="0;0.812;0.816;0.934;0.936;1"/></circle>
<circle class="sPr" r="3" opacity="0"><animateMotion dur="6s" repeatCount="indefinite" calcMode="linear" keyPoints="0;0;1;1" keyTimes="0;0.001;0.121;1" path="M90 199 L236 146"/><animate attributeName="opacity" dur="6s" repeatCount="indefinite" values="0;0;1;1;0;0" keyTimes="0;0.000;0.003;0.121;0.123;1"/></circle>
<circle class="sP" r="3" opacity="0"><animateMotion dur="6s" repeatCount="indefinite" calcMode="linear" keyPoints="0;0;1;1" keyTimes="0;0.000;0.080;1" path="M450 45 L496 115"/><animate attributeName="opacity" dur="6s" repeatCount="indefinite" values="0;0;1;1;0;0" keyTimes="0;0.000;0.002;0.080;0.082;1"/></circle>
<circle class="sP" r="3" opacity="0"><animateMotion dur="6s" repeatCount="indefinite" calcMode="linear" keyPoints="0;0;1;1" keyTimes="0;0.100;0.180;1" path="M450 67 L496 115"/><animate attributeName="opacity" dur="6s" repeatCount="indefinite" values="0;0;1;1;0;0" keyTimes="0;0.098;0.102;0.180;0.182;1"/></circle>
<circle class="sP" r="3" opacity="0"><animateMotion dur="6s" repeatCount="indefinite" calcMode="linear" keyPoints="0;0;1;1" keyTimes="0;0.200;0.280;1" path="M450 89 L496 115"/><animate attributeName="opacity" dur="6s" repeatCount="indefinite" values="0;0;1;1;0;0" keyTimes="0;0.198;0.202;0.280;0.282;1"/></circle>
<circle class="sP" r="3" opacity="0"><animateMotion dur="6s" repeatCount="indefinite" calcMode="linear" keyPoints="0;0;1;1" keyTimes="0;0.300;0.380;1" path="M450 111 L496 115"/><animate attributeName="opacity" dur="6s" repeatCount="indefinite" values="0;0;1;1;0;0" keyTimes="0;0.298;0.302;0.380;0.382;1"/></circle>
<circle class="sP" r="3" opacity="0"><animateMotion dur="6s" repeatCount="indefinite" calcMode="linear" keyPoints="0;0;1;1" keyTimes="0;0.400;0.480;1" path="M450 133 L496 115"/><animate attributeName="opacity" dur="6s" repeatCount="indefinite" values="0;0;1;1;0;0" keyTimes="0;0.398;0.402;0.480;0.482;1"/></circle>
<circle class="sP" r="3" opacity="0"><animateMotion dur="6s" repeatCount="indefinite" calcMode="linear" keyPoints="0;0;1;1" keyTimes="0;0.500;0.580;1" path="M450 155 L496 115"/><animate attributeName="opacity" dur="6s" repeatCount="indefinite" values="0;0;1;1;0;0" keyTimes="0;0.498;0.502;0.580;0.582;1"/></circle>
<circle class="sP" r="3" opacity="0"><animateMotion dur="6s" repeatCount="indefinite" calcMode="linear" keyPoints="0;0;1;1" keyTimes="0;0.600;0.680;1" path="M450 177 L496 115"/><animate attributeName="opacity" dur="6s" repeatCount="indefinite" values="0;0;1;1;0;0" keyTimes="0;0.598;0.602;0.680;0.682;1"/></circle>
<circle class="sP" r="3" opacity="0"><animateMotion dur="6s" repeatCount="indefinite" calcMode="linear" keyPoints="0;0;1;1" keyTimes="0;0.700;0.780;1" path="M450 199 L496 115"/><animate attributeName="opacity" dur="6s" repeatCount="indefinite" values="0;0;1;1;0;0" keyTimes="0;0.698;0.702;0.780;0.782;1"/></circle>
<circle class="sPg" r="3" opacity="0"><animateMotion dur="6s" repeatCount="indefinite" calcMode="linear" keyPoints="0;0;1;1" keyTimes="0;0.080;0.130;1" path="M590 100 L616 100"/><animate attributeName="opacity" dur="6s" repeatCount="indefinite" values="0;0;1;1;0;0" keyTimes="0;0.078;0.082;0.130;0.132;1"/></circle>
<circle class="sPg" r="3" opacity="0"><animateMotion dur="6s" repeatCount="indefinite" calcMode="linear" keyPoints="0;0;1;1" keyTimes="0;0.380;0.430;1" path="M590 100 L616 100"/><animate attributeName="opacity" dur="6s" repeatCount="indefinite" values="0;0;1;1;0;0" keyTimes="0;0.378;0.382;0.430;0.432;1"/></circle>
<circle class="sPg" r="3" opacity="0"><animateMotion dur="6s" repeatCount="indefinite" calcMode="linear" keyPoints="0;0;1;1" keyTimes="0;0.680;0.730;1" path="M590 100 L616 100"/><animate attributeName="opacity" dur="6s" repeatCount="indefinite" values="0;0;1;1;0;0" keyTimes="0;0.678;0.682;0.730;0.732;1"/></circle>
<circle class="sPg" r="3" opacity="0"><animateMotion dur="6s" repeatCount="indefinite" calcMode="linear" keyPoints="0;0;1;1" keyTimes="0;0.130;0.180;1" path="M590 110 L616 110"/><animate attributeName="opacity" dur="6s" repeatCount="indefinite" values="0;0;1;1;0;0" keyTimes="0;0.128;0.132;0.180;0.182;1"/></circle>
<circle class="sPg" r="3" opacity="0"><animateMotion dur="6s" repeatCount="indefinite" calcMode="linear" keyPoints="0;0;1;1" keyTimes="0;0.430;0.480;1" path="M590 110 L616 110"/><animate attributeName="opacity" dur="6s" repeatCount="indefinite" values="0;0;1;1;0;0" keyTimes="0;0.428;0.432;0.480;0.482;1"/></circle>
<circle class="sPg" r="3" opacity="0"><animateMotion dur="6s" repeatCount="indefinite" calcMode="linear" keyPoints="0;0;1;1" keyTimes="0;0.730;0.780;1" path="M590 110 L616 110"/><animate attributeName="opacity" dur="6s" repeatCount="indefinite" values="0;0;1;1;0;0" keyTimes="0;0.728;0.732;0.780;0.782;1"/></circle>
<circle class="sPg" r="3" opacity="0"><animateMotion dur="6s" repeatCount="indefinite" calcMode="linear" keyPoints="0;0;1;1" keyTimes="0;0.180;0.230;1" path="M590 120 L616 120"/><animate attributeName="opacity" dur="6s" repeatCount="indefinite" values="0;0;1;1;0;0" keyTimes="0;0.178;0.182;0.230;0.232;1"/></circle>
<circle class="sPg" r="3" opacity="0"><animateMotion dur="6s" repeatCount="indefinite" calcMode="linear" keyPoints="0;0;1;1" keyTimes="0;0.480;0.530;1" path="M590 120 L616 120"/><animate attributeName="opacity" dur="6s" repeatCount="indefinite" values="0;0;1;1;0;0" keyTimes="0;0.478;0.482;0.530;0.532;1"/></circle>
<circle class="sPg" r="3" opacity="0"><animateMotion dur="6s" repeatCount="indefinite" calcMode="linear" keyPoints="0;0;1;1" keyTimes="0;0.780;0.830;1" path="M590 120 L616 120"/><animate attributeName="opacity" dur="6s" repeatCount="indefinite" values="0;0;1;1;0;0" keyTimes="0;0.778;0.782;0.830;0.832;1"/></circle>
<circle class="sPg" r="3" opacity="0"><animateMotion dur="6s" repeatCount="indefinite" calcMode="linear" keyPoints="0;0;1;1" keyTimes="0;0.230;0.280;1" path="M590 130 L616 130"/><animate attributeName="opacity" dur="6s" repeatCount="indefinite" values="0;0;1;1;0;0" keyTimes="0;0.228;0.232;0.280;0.282;1"/></circle>
<circle class="sPg" r="3" opacity="0"><animateMotion dur="6s" repeatCount="indefinite" calcMode="linear" keyPoints="0;0;1;1" keyTimes="0;0.530;0.580;1" path="M590 130 L616 130"/><animate attributeName="opacity" dur="6s" repeatCount="indefinite" values="0;0;1;1;0;0" keyTimes="0;0.528;0.532;0.580;0.582;1"/></circle>
<circle class="sPg" r="3" opacity="0"><animateMotion dur="6s" repeatCount="indefinite" calcMode="linear" keyPoints="0;0;1;1" keyTimes="0;0.830;0.880;1" path="M590 130 L616 130"/><animate attributeName="opacity" dur="6s" repeatCount="indefinite" values="0;0;1;1;0;0" keyTimes="0;0.828;0.832;0.880;0.882;1"/></circle>
</svg><figcaption>Scaling the app tier multiplies connections. A pooler lets thousands of short client connections share a few dozen real ones.</figcaption></figure>

## SD2.4 Stage 3: a load balancer and stateless app servers 🟢 ⭐

When one app server runs out of CPU, or you want deploys and machine failures to stop causing downtime, run **several identical app servers behind a load balancer** ([[SD1.5]]).

What has to change first is **state** ([[SD1.4]]):

| State that lived on the server | Where it goes |
|---|---|
| Login sessions | A signed token (JWT, [[B7]]) or a shared session store (Redis) |
| Uploaded files | Object storage, uploaded directly with pre-signed URLs |
| In-memory caches | A shared cache (Redis), or accept that each server has its own short-lived copy |
| Scheduled jobs | A job scheduler that runs each job once (Hangfire with a shared database, Quartz clustering, a cloud scheduler), not a timer in every instance |
| WebSocket connections | Still on one server each, so fan-out between servers goes through a backplane (Redis pub/sub for SignalR or Socket.IO) |

> [!term] Autoscaling
> Adding and removing instances automatically based on a metric: CPU, requests per instance, or queue length. It saves money at night and absorbs daytime peaks. It only works if instances start quickly, are stateless, and the things behind them (database connections, third-party rate limits) can absorb the extra instances.

**Health checks** decide which instances receive traffic. Distinguish a **liveness** check (is the process alive? if not, restart it) from a **readiness** check (can it serve right now? if not, stop sending it traffic but don't kill it). A readiness check that calls the database can take the whole fleet out of rotation when the database blips, so keep it cheap and think about what it should really mean.

<figure class="dia anim"><svg viewBox="0 0 720 236" role="img" aria-label="Animation: a load balancer spreads user requests across three stateless app servers that keep sessions in Redis; when app 2 fails its readiness check the load balancer stops sending it requests and the other two carry the traffic">
<rect class="sB" x="14" y="90" width="120" height="50" rx="8"/><text class="sT" x="74" y="120" text-anchor="middle">Users</text>
<rect class="sA" x="220" y="84" width="140" height="62" rx="8"/><text class="sT" x="290" y="113" text-anchor="middle">Load balancer</text><text class="sC" x="290" y="129" text-anchor="middle">health checks /ready</text>
<rect class="sG" x="470" y="24" width="140" height="46" rx="8"/><text class="sT" x="540" y="45" text-anchor="middle">app 1</text><text class="sC" x="540" y="61" text-anchor="middle">stateless</text>
<line class="sLm" x1="360" y1="115" x2="470" y2="47" opacity=".5"/>
<rect class="sG" x="470" y="94" width="140" height="46" rx="8"/><text class="sT" x="540" y="115" text-anchor="middle">app 2</text><text class="sC" x="540" y="131" text-anchor="middle">stateless</text>
<line class="sLm" x1="360" y1="115" x2="470" y2="117" opacity=".5"/>
<rect class="sG" x="470" y="164" width="140" height="46" rx="8"/><text class="sT" x="540" y="185" text-anchor="middle">app 3</text><text class="sC" x="540" y="201" text-anchor="middle">stateless</text>
<line class="sLm" x1="360" y1="115" x2="470" y2="187" opacity=".5"/>
<rect class="sV" x="640" y="94" width="66" height="46" rx="8"/><text class="sT" x="673" y="115" text-anchor="middle">Redis</text><text class="sC" x="673" y="131" text-anchor="middle">sessions</text>
<line class="sLm" x1="134" y1="115" x2="220" y2="115"/>
<circle class="sPg" r="6" opacity="0"><animateMotion dur="9s" repeatCount="indefinite" calcMode="linear" keyPoints="0;0;1;1" keyTimes="0;0.000;0.080;1" path="M134 115 L360 115 L470 47"/><animate attributeName="opacity" dur="9s" repeatCount="indefinite" values="0;0;1;1;0;0" keyTimes="0;0.000;0.002;0.080;0.082;1"/></circle>
<circle class="sPg" r="6" opacity="0"><animateMotion dur="9s" repeatCount="indefinite" calcMode="linear" keyPoints="0;0;1;1" keyTimes="0;0.100;0.180;1" path="M134 115 L360 115 L470 117"/><animate attributeName="opacity" dur="9s" repeatCount="indefinite" values="0;0;1;1;0;0" keyTimes="0;0.098;0.102;0.180;0.182;1"/></circle>
<circle class="sPg" r="6" opacity="0"><animateMotion dur="9s" repeatCount="indefinite" calcMode="linear" keyPoints="0;0;1;1" keyTimes="0;0.200;0.280;1" path="M134 115 L360 115 L470 187"/><animate attributeName="opacity" dur="9s" repeatCount="indefinite" values="0;0;1;1;0;0" keyTimes="0;0.198;0.202;0.280;0.282;1"/></circle>
<circle class="sPg" r="6" opacity="0"><animateMotion dur="9s" repeatCount="indefinite" calcMode="linear" keyPoints="0;0;1;1" keyTimes="0;0.300;0.380;1" path="M134 115 L360 115 L470 47"/><animate attributeName="opacity" dur="9s" repeatCount="indefinite" values="0;0;1;1;0;0" keyTimes="0;0.298;0.302;0.380;0.382;1"/></circle>
<circle class="sPg" r="6" opacity="0"><animateMotion dur="9s" repeatCount="indefinite" calcMode="linear" keyPoints="0;0;1;1" keyTimes="0;0.550;0.630;1" path="M134 115 L360 115 L470 47"/><animate attributeName="opacity" dur="9s" repeatCount="indefinite" values="0;0;1;1;0;0" keyTimes="0;0.548;0.552;0.630;0.632;1"/></circle>
<circle class="sPg" r="6" opacity="0"><animateMotion dur="9s" repeatCount="indefinite" calcMode="linear" keyPoints="0;0;1;1" keyTimes="0;0.650;0.730;1" path="M134 115 L360 115 L470 187"/><animate attributeName="opacity" dur="9s" repeatCount="indefinite" values="0;0;1;1;0;0" keyTimes="0;0.648;0.652;0.730;0.732;1"/></circle>
<circle class="sPg" r="6" opacity="0"><animateMotion dur="9s" repeatCount="indefinite" calcMode="linear" keyPoints="0;0;1;1" keyTimes="0;0.750;0.830;1" path="M134 115 L360 115 L470 47"/><animate attributeName="opacity" dur="9s" repeatCount="indefinite" values="0;0;1;1;0;0" keyTimes="0;0.748;0.752;0.830;0.832;1"/></circle>
<circle class="sPg" r="6" opacity="0"><animateMotion dur="9s" repeatCount="indefinite" calcMode="linear" keyPoints="0;0;1;1" keyTimes="0;0.850;0.930;1" path="M134 115 L360 115 L470 187"/><animate attributeName="opacity" dur="9s" repeatCount="indefinite" values="0;0;1;1;0;0" keyTimes="0;0.848;0.852;0.930;0.932;1"/></circle>
<g opacity="0"><animate attributeName="opacity" dur="9s" repeatCount="indefinite" values="0;0;1;1;0" keyTimes="0;0.42;0.44;0.97;1"/><rect class="sR" x="468" y="92" width="144" height="50" rx="8" style="fill:none;stroke-width:3"/><text class="sRt" x="540" y="160" text-anchor="middle">fails /ready → removed</text></g>
<text class="sS" x="360" y="226" text-anchor="middle">round-robin while all are ready; a failed readiness check takes app 2 out within seconds</text>
</svg><figcaption>Because no server holds state of its own, any of them can take any request, and losing one costs nothing but capacity.</figcaption></figure>

## SD2.5 Stage 4: caching, CDNs and read replicas 🟢 ⭐

Most applications read far more than they write (10:1 to 100:1 is common). Stage 4 attacks the read load in three layers, cheapest first:

1. **A CDN** for static assets and for public responses that are the same for everyone (product pages, images, the JavaScript bundle).
2. **An application cache** (Redis, Valkey or Memcached) for hot data that is expensive to compute: the home-page feed, a user's permissions, an aggregated dashboard. Patterns, TTLs and stampede protection are in [[B8.2]].
3. **Read replicas**: copies of the database that receive changes from the primary and serve read-only queries such as reports, search pages and dashboards ([[B6.7]]).

> [!term] Replication lag
> Replicas usually receive changes asynchronously, a few milliseconds to seconds behind the primary. A user who saves their profile and is immediately sent to a replica may see the old value. Fixes: read your own recent writes from the primary for a short time ("read-your-writes"), or route a session to the primary after it writes.

<figure class="dia steps"><svg viewBox="0 0 720 258" role="img" aria-label="Sequence diagram: a write goes to the primary, a read immediately after goes to a lagging replica and returns the old value; reading from the primary after one's own write fixes it">
<text class="sT" x="70" y="22" text-anchor="middle">User</text><line class="sD" x1="70" y1="32" x2="70" y2="250"/>
<text class="sT" x="240" y="22" text-anchor="middle">App</text><line class="sD" x1="240" y1="32" x2="240" y2="250"/>
<text class="sT" x="450" y="22" text-anchor="middle">Primary</text><line class="sD" x1="450" y1="32" x2="450" y2="250"/>
<text class="sT" x="640" y="22" text-anchor="middle">Replica</text><line class="sD" x1="640" y1="32" x2="640" y2="250"/>
<g data-s="1"><line class="sL" x1="70" y1="50" x2="236" y2="56" marker-end="url(#ah)"/><text class="sC" x="155" y="46" text-anchor="middle">save name = Mona</text><line class="sL" x1="240" y1="62" x2="446" y2="70" marker-end="url(#ah)"/><text class="sC" x="343" y="60" text-anchor="middle">UPDATE</text></g>
<g data-s="2"><line class="sLg" x1="450" y1="82" x2="244" y2="90" marker-end="url(#ahg)"/><line class="sLg" x1="240" y1="96" x2="74" y2="102" marker-end="url(#ahg)"/><text class="sGt" x="155" y="112" text-anchor="middle">200 OK</text><line class="sLw" x1="450" y1="90" x2="636" y2="200" stroke-dasharray="6 4" marker-end="url(#ahw)"/><text class="sWt" x="600" y="130" text-anchor="middle">replicating…</text></g>
<g data-s="3"><line class="sL" x1="70" y1="132" x2="236" y2="138" marker-end="url(#ah)"/><text class="sC" x="155" y="128" text-anchor="middle">reload profile</text><line class="sL" x1="240" y1="146" x2="636" y2="154" marker-end="url(#ah)"/><text class="sC" x="345" y="144" text-anchor="middle">SELECT (a replica)</text><line class="sLr" x1="640" y1="162" x2="244" y2="170" marker-end="url(#ahr)"/><line class="sLr" x1="240" y1="176" x2="74" y2="182" marker-end="url(#ahr)"/><text class="sRt" x="155" y="196" text-anchor="middle">shows "Mina": the old name!</text></g>
<g data-s="4"><rect class="sG" x="578" y="204" width="124" height="22" rx="6"/><text class="sC" x="640" y="219" text-anchor="middle">now has "Mona"</text></g>
<g data-s="5"><line class="sLg" x1="240" y1="230" x2="446" y2="234" marker-end="url(#ahg)"/><text class="sGt" x="343" y="226" text-anchor="middle">read-your-writes: this user reads</text><text class="sGt" x="343" y="248" text-anchor="middle">from the primary for a few seconds</text></g>
</svg><ol class="dia-steps">
<li>The user saves a new name; the app writes it to the primary.</li>
<li>The primary confirms and the user sees "saved". Replication to the replica runs asynchronously and takes a moment.</li>
<li>The user reloads at once. The read goes to a replica that hasn't received the change yet, so it shows the old name. The data isn't lost; it's just not there yet.</li>
<li>A fraction of a second later the replica catches up.</li>
<li>The usual fix: for a short time after a user writes, send that user's reads to the primary. Everyone else keeps reading from replicas.</li>
</ol><figcaption>Replication lag as users experience it. Eventual consistency is fine for a news feed and confusing for "I just saved this".</figcaption></figure>

> [!sota] What large read-heavy sites actually ran
> Stack Overflow described its 2016 setup in detail: on a sample day it served about **209 million HTTP requests** and **66 million page loads** from **9 primary web servers**, **4 SQL Server machines** (two clusters, each a primary with a replica) and a pair of Redis servers that answered about **5.8 billion cache hits** that day, with Redis below 2% CPU. The lesson isn't "use few servers"; it's that heavy caching, efficient queries and measurement took a monolith a very long way. (Its public sites moved to Google Cloud in 2025.)

## SD2.6 Stage 5: queues and background workers 🟢 ⭐

Move work out of the request when the user doesn't need its result immediately: emails and notifications, image and video processing, PDF generation, imports of large files, calls to slow third parties, model scoring in batches, search-index updates.

```
POST /orders  →  save order + outbox row (one transaction)  →  202/201 in ~50 ms
                                   ↓
                     relay publishes OrderPlaced
                                   ↓
        email worker · invoice worker · analytics worker · loyalty worker
```

Design points that interviewers probe:

- **At-least-once delivery** is the norm, so every consumer must be **idempotent** ([[SD4.3]]).
- The **outbox pattern** ([[B8.7]]) avoids saving the order but losing the message (or the reverse) when the app crashes between the two.
- **Separate queues by priority**, so a password-reset code isn't stuck behind a marketing campaign.
- **Watch queue depth and the age of the oldest message**, and scale workers on them; send poison messages to a **dead-letter queue** after a few retries.
- Queues **move** load; they don't remove it. If workers are permanently slower than producers, the queue grows until something breaks. That needs more workers or **backpressure** ([[SD4.4]]).

<figure class="dia anim"><svg viewBox="0 0 720 228" role="img" aria-label="Animation: A queue absorbing a burst, computed: arrivals run at 100 jobs a minute, jump to 300 a minute for five minutes, then drop to 50; workers process 150 a minute; the queue grows to 750 jobs at minute 10 and is empty again at minute 18, while the web tier never sees the burst">
<line class="sLm" x1="70" y1="200" x2="670" y2="200"/>
<line class="sLm" x1="70" y1="200" x2="70" y2="30"/>
<text class="sS" x="62" y="204" text-anchor="end">0</text>
<text class="sS" x="62" y="164" text-anchor="end">200</text>
<text class="sS" x="62" y="124" text-anchor="end">400</text>
<text class="sS" x="62" y="84" text-anchor="end">600</text>
<text class="sS" x="62" y="44" text-anchor="end">800</text>
<text class="sS" x="70" y="218" text-anchor="middle">0 min</text>
<text class="sS" x="220" y="218" text-anchor="middle">5 min</text>
<text class="sS" x="370" y="218" text-anchor="middle">10 min</text>
<text class="sS" x="520" y="218" text-anchor="middle">15 min</text>
<text class="sS" x="670" y="218" text-anchor="middle">20 min</text>
<polyline class="sLw" points="70.0,180.0 100.0,180.0 100.0,180.0 130.0,180.0 130.0,180.0 160.0,180.0 160.0,180.0 190.0,180.0 190.0,180.0 220.0,180.0 220.0,140.0 250.0,140.0 250.0,140.0 280.0,140.0 280.0,140.0 310.0,140.0 310.0,140.0 340.0,140.0 340.0,140.0 370.0,140.0 370.0,190.0 400.0,190.0 400.0,190.0 430.0,190.0 430.0,190.0 460.0,190.0 460.0,190.0 490.0,190.0 490.0,190.0 520.0,190.0 520.0,190.0 550.0,190.0 550.0,190.0 580.0,190.0 580.0,190.0 610.0,190.0 610.0,190.0 640.0,190.0 640.0,190.0 670.0,190.0" style="fill:none;stroke-width:2"/>
<polyline class="sLv" points="100.0,200.0 130.0,200.0 160.0,200.0 190.0,200.0 220.0,200.0 250.0,170.0 280.0,140.0 310.0,110.0 340.0,80.0 370.0,50.0 400.0,70.0 430.0,90.0 460.0,110.0 490.0,130.0 520.0,150.0 550.0,170.0 580.0,190.0 610.0,200.0 640.0,200.0 670.0,200.0" style="fill:none;stroke-width:3"/>
<line class="sLg" x1="70" y1="170" x2="670" y2="170" stroke-dasharray="5 4"/>
<text class="sWt" x="295" y="132" text-anchor="middle">arrivals: 300/min burst</text>
<text class="sT" x="376" y="42">queue peaks at 750 jobs</text>
<text class="sGt" x="668" y="164" text-anchor="end">workers: 150/min</text>
<text class="sS" x="610" y="192" text-anchor="middle">empty again at 18 min</text>
<circle class="sPv" r="4" opacity="0"><animateMotion dur="10s" repeatCount="indefinite" calcMode="linear" keyPoints="0;0;1;1" keyTimes="0;0.000;0.850;1" path="M100 200 L130 200 L160 200 L190 200 L220 200 L250 170 L280 140 L310 110 L340 80 L370 50 L400 70 L430 90 L460 110 L490 130 L520 150 L550 170 L580 190 L610 200 L640 200 L670 200"/><animate attributeName="opacity" dur="10s" repeatCount="indefinite" values="0;0;1;1;0;0" keyTimes="0;0.000;0.002;0.850;0.852;1"/></circle>
</svg><figcaption>Computed minute by minute: the queue absorbs the burst (750 jobs at its peak) and the workers drain it by minute 18. Users only see a delay in background work, never errors. Watch queue depth and the age of the oldest message.</figcaption></figure>

## SD2.7 Stage 6: partitioning and sharding 🟡 ⭐

When the primary database can't keep up with **writes** or **storage** even on a large machine, and you've already fixed queries, indexes, caching and replicas, you split the data.

| Technique | What it means | Example |
|---|---|---|
| **Vertical partitioning** | Move groups of tables to separate databases by domain | Users and billing in one database, files and comments in another |
| **Table partitioning** | Split one big table into partitions inside the *same* database, usually by time or key | `transactions` partitioned by month; old months archived cheaply |
| **Horizontal sharding** | Split the *rows* of a table across several databases by a **shard key** | Tenants 1–1,000 on shard A, 1,001–2,000 on shard B |

**Choosing the shard key is the whole game.** A good key spreads load evenly and keeps the data one request needs on one shard: `tenant_id` for a B2B SaaS, `user_id` for a consumer app. A bad key creates **hot shards** (sharding by country when 80% of users are in Egypt) or forces **scatter-gather** queries across every shard. Cross-shard joins, transactions and unique constraints become application problems, and moving data when you add shards (**resharding**) is a project of its own; consistent hashing ([[SD4.6]]) limits how much moves.

<figure class="dia anim"><svg viewBox="0 0 720 242" role="img" aria-label="Animation: two sharding schemes: by tenant spreads load evenly; by country puts most users on one hot shard">
<text class="sT" x="170" y="22" text-anchor="middle">shard key = tenant_id</text><rect class="sB" x="120" y="34" width="100" height="36" rx="8"/><text class="sT" x="170" y="50" text-anchor="middle">router</text><text class="sC" x="170" y="66" text-anchor="middle">hash(tenant)</text><line class="sLm" x1="170" y1="70" x2="70" y2="104" marker-end="url(#ahm)"/><rect class="sB" x="20" y="108" width="100" height="50" rx="8"/><text class="sT" x="70" y="128" text-anchor="middle">shard 1</text><text class="sC" x="70" y="146" text-anchor="middle">tenants 1–1k</text><rect class="sN" x="20" y="168" width="100" height="12" rx="3"/><rect class="sG" x="20" y="168" width="55" height="12" rx="3"/><line class="sLm" x1="170" y1="70" x2="180" y2="104" marker-end="url(#ahm)"/><rect class="sB" x="130" y="108" width="100" height="50" rx="8"/><text class="sT" x="180" y="128" text-anchor="middle">shard 2</text><text class="sC" x="180" y="146" text-anchor="middle">1k–2k</text><rect class="sN" x="130" y="168" width="100" height="12" rx="3"/><rect class="sG" x="130" y="168" width="50" height="12" rx="3"/><line class="sLm" x1="170" y1="70" x2="290" y2="104" marker-end="url(#ahm)"/><rect class="sB" x="240" y="108" width="100" height="50" rx="8"/><text class="sT" x="290" y="128" text-anchor="middle">shard 3</text><text class="sC" x="290" y="146" text-anchor="middle">2k–3k</text><rect class="sN" x="240" y="168" width="100" height="12" rx="3"/><rect class="sG" x="240" y="168" width="60" height="12" rx="3"/>
<text class="sT" x="530" y="22" text-anchor="middle">shard key = country</text><rect class="sB" x="480" y="34" width="100" height="36" rx="8"/><text class="sT" x="530" y="50" text-anchor="middle">router</text><text class="sC" x="530" y="66" text-anchor="middle">by country</text><line class="sLm" x1="530" y1="70" x2="430" y2="104" marker-end="url(#ahm)"/><rect class="sB" x="380" y="108" width="100" height="50" rx="8"/><text class="sT" x="430" y="128" text-anchor="middle">shard 1</text><text class="sC" x="430" y="146" text-anchor="middle">EG</text><rect class="sN" x="380" y="168" width="100" height="12" rx="3"/><rect class="sR" x="380" y="168" width="98" height="12" rx="3"/><line class="sLm" x1="530" y1="70" x2="540" y2="104" marker-end="url(#ahm)"/><rect class="sB" x="490" y="108" width="100" height="50" rx="8"/><text class="sT" x="540" y="128" text-anchor="middle">shard 2</text><text class="sC" x="540" y="146" text-anchor="middle">SA</text><rect class="sN" x="490" y="168" width="100" height="12" rx="3"/><rect class="sG" x="490" y="168" width="15" height="12" rx="3"/><line class="sLm" x1="530" y1="70" x2="650" y2="104" marker-end="url(#ahm)"/><rect class="sB" x="600" y="108" width="100" height="50" rx="8"/><text class="sT" x="650" y="128" text-anchor="middle">shard 3</text><text class="sC" x="650" y="146" text-anchor="middle">AE</text><rect class="sN" x="600" y="168" width="100" height="12" rx="3"/><rect class="sG" x="600" y="168" width="10" height="12" rx="3"/>
<text class="sGt" x="170" y="204" text-anchor="middle">load spreads evenly; a tenant's data stays together</text>
<text class="sRt" x="530" y="204" text-anchor="middle">80% of users in Egypt → one hot shard</text>
<text class="sC" x="360" y="230" text-anchor="middle">bars: share of each shard's capacity in use</text>
<circle class="sPg" r="4" opacity="0"><animateMotion dur="10s" repeatCount="indefinite" calcMode="linear" keyPoints="0;0;1;1" keyTimes="0;0.000;0.100;1" path="M170 70 L70 104"/><animate attributeName="opacity" dur="10s" repeatCount="indefinite" values="0;0;1;1;0;0" keyTimes="0;0.000;0.002;0.100;0.102;1"/></circle>
<circle class="sPg" r="4" opacity="0"><animateMotion dur="10s" repeatCount="indefinite" calcMode="linear" keyPoints="0;0;1;1" keyTimes="0;0.100;0.200;1" path="M170 70 L180 104"/><animate attributeName="opacity" dur="10s" repeatCount="indefinite" values="0;0;1;1;0;0" keyTimes="0;0.098;0.102;0.200;0.202;1"/></circle>
<circle class="sPg" r="4" opacity="0"><animateMotion dur="10s" repeatCount="indefinite" calcMode="linear" keyPoints="0;0;1;1" keyTimes="0;0.200;0.300;1" path="M170 70 L290 104"/><animate attributeName="opacity" dur="10s" repeatCount="indefinite" values="0;0;1;1;0;0" keyTimes="0;0.198;0.202;0.300;0.302;1"/></circle>
<circle class="sPr" r="4" opacity="0"><animateMotion dur="10s" repeatCount="indefinite" calcMode="linear" keyPoints="0;0;1;1" keyTimes="0;0.000;0.100;1" path="M530 70 L430 104"/><animate attributeName="opacity" dur="10s" repeatCount="indefinite" values="0;0;1;1;0;0" keyTimes="0;0.000;0.002;0.100;0.102;1"/></circle>
<circle class="sPr" r="4" opacity="0"><animateMotion dur="10s" repeatCount="indefinite" calcMode="linear" keyPoints="0;0;1;1" keyTimes="0;0.080;0.180;1" path="M530 70 L430 104"/><animate attributeName="opacity" dur="10s" repeatCount="indefinite" values="0;0;1;1;0;0" keyTimes="0;0.078;0.082;0.180;0.182;1"/></circle>
<circle class="sPr" r="4" opacity="0"><animateMotion dur="10s" repeatCount="indefinite" calcMode="linear" keyPoints="0;0;1;1" keyTimes="0;0.160;0.260;1" path="M530 70 L430 104"/><animate attributeName="opacity" dur="10s" repeatCount="indefinite" values="0;0;1;1;0;0" keyTimes="0;0.158;0.162;0.260;0.262;1"/></circle>
<circle class="sPg" r="4" opacity="0"><animateMotion dur="10s" repeatCount="indefinite" calcMode="linear" keyPoints="0;0;1;1" keyTimes="0;0.240;0.340;1" path="M530 70 L540 104"/><animate attributeName="opacity" dur="10s" repeatCount="indefinite" values="0;0;1;1;0;0" keyTimes="0;0.238;0.242;0.340;0.342;1"/></circle>
<circle class="sPg" r="4" opacity="0"><animateMotion dur="10s" repeatCount="indefinite" calcMode="linear" keyPoints="0;0;1;1" keyTimes="0;0.320;0.420;1" path="M530 70 L650 104"/><animate attributeName="opacity" dur="10s" repeatCount="indefinite" values="0;0;1;1;0;0" keyTimes="0;0.318;0.322;0.420;0.422;1"/></circle>
</svg><figcaption>The shard key decides everything. Good keys spread load and keep one request's data on one shard.</figcaption></figure>

> [!sota] How Figma did it (2020–2024)
> Figma's database team published the path in March 2024. In 2020 Figma ran **a single PostgreSQL database on AWS's largest physical instance**. By the end of 2022 they had added caching, read replicas and about a dozen **vertically partitioned** databases. When single tables still outgrew one machine, they spent roughly nine months building **horizontal sharding**: first "logical sharding" (queries routed as if sharded while the data still sat in one database, so mistakes were cheap to undo), then "physical sharding", behind a proxy (DBProxy) that parses each query and routes it to the right shard. Every step on this ladder, in order, at a company whose database load grew almost 100× in four years.

> [!note] Managed options that shard for you
> Distributed SQL databases (Google Spanner, CockroachDB, YugabyteDB, Azure Cosmos DB for PostgreSQL built on Citus) and NoSQL stores such as DynamoDB and Cassandra partition data automatically. They don't remove the need for a good partition key; they make the mechanics someone else's problem, at a price.

## SD2.8 Capacity planning, load testing and launch day 🟡 ⭐

**Capacity planning** is estimation ([[SD1.10]]) plus measurement: know your current peak, your growth rate, and the headroom left on each resource, and act before headroom runs out, not after.

**Load testing** proves it. Tools such as **k6**, **JMeter**, **Locust**, **Gatling** or Azure Load Testing replay realistic traffic against a production-like environment:

1. Model real behaviour: the mix of endpoints, think time, realistic data sizes, logged-in vs anonymous users.
2. Ramp up until something breaks; note *what* broke first and at what load. That is your current ceiling.
3. Run a **soak test** (hours at expected peak) to find memory leaks and slow degradation.
4. Run a **spike test** (sudden 10× jump) to check autoscaling and queues react in time.

<figure class="dia anim"><svg viewBox="0 0 720 246" role="img" aria-label="Animation: response time against utilisation for a single queue with random arrivals and 10 milliseconds of work per request, computed as 10 divided by one minus utilisation: 20 ms at 50 percent, 50 ms at 80 percent, 100 ms at 90 percent and 200 ms at 95 percent; capacity plans target roughly 60 to 80 percent">
<line class="sLm" x1="70" y1="200" x2="670" y2="200"/>
<line class="sLm" x1="70" y1="200" x2="70" y2="30"/>
<text class="sS" x="62" y="204" text-anchor="end">0</text>
<text class="sS" x="62" y="162.75" text-anchor="end">50</text>
<text class="sS" x="62" y="121.5" text-anchor="end">100</text>
<text class="sS" x="62" y="80.25" text-anchor="end">150</text>
<text class="sS" x="62" y="39" text-anchor="end">200</text>
<text class="sS" x="70" y="218" text-anchor="middle">0%</text>
<text class="sS" x="190" y="218" text-anchor="middle">20%</text>
<text class="sS" x="310" y="218" text-anchor="middle">40%</text>
<text class="sS" x="430" y="218" text-anchor="middle">60%</text>
<text class="sS" x="550" y="218" text-anchor="middle">80%</text>
<text class="sS" x="670" y="218" text-anchor="middle">100%</text>
<polyline class="sLr" points="70.0,191.8 73.0,191.7 76.0,191.7 79.0,191.6 82.0,191.6 85.0,191.5 88.0,191.5 91.0,191.5 94.0,191.4 97.0,191.4 100.0,191.3 103.0,191.3 106.0,191.2 109.0,191.2 112.0,191.1 115.0,191.1 118.0,191.0 121.0,191.0 124.0,190.9 127.0,190.9 130.0,190.8 133.0,190.8 136.0,190.7 139.0,190.7 142.0,190.6 145.0,190.6 148.0,190.5 151.0,190.5 154.0,190.4 157.0,190.4 160.0,190.3 163.0,190.2 166.0,190.2 169.0,190.1 172.0,190.1 175.0,190.0 178.0,189.9 181.0,189.9 184.0,189.8 187.0,189.8 190.0,189.7 193.0,189.6 196.0,189.6 199.0,189.5 202.0,189.4 205.0,189.4 208.0,189.3 211.0,189.2 214.0,189.1 217.0,189.1 220.0,189.0 223.0,188.9 226.0,188.9 229.0,188.8 232.0,188.7 235.0,188.6 238.0,188.5 241.0,188.5 244.0,188.4 247.0,188.3 250.0,188.2 253.0,188.1 256.0,188.0 259.0,188.0 262.0,187.9 265.0,187.8 268.0,187.7 271.0,187.6 274.0,187.5 277.0,187.4 280.0,187.3 283.0,187.2 286.0,187.1 289.0,187.0 292.0,186.9 295.0,186.8 298.0,186.7 301.0,186.6 304.0,186.5 307.0,186.4 310.0,186.2 313.0,186.1 316.0,186.0 319.0,185.9 322.0,185.8 325.0,185.7 328.0,185.5 331.0,185.4 334.0,185.3 337.0,185.1 340.0,185.0 343.0,184.9 346.0,184.7 349.0,184.6 352.0,184.4 355.0,184.3 358.0,184.1 361.0,184.0 364.0,183.8 367.0,183.7 370.0,183.5 373.0,183.3 376.0,183.2 379.0,183.0 382.0,182.8 385.0,182.6 388.0,182.4 391.0,182.3 394.0,182.1 397.0,181.9 400.0,181.7 403.0,181.5 406.0,181.2 409.0,181.0 412.0,180.8 415.0,180.6 418.0,180.4 421.0,180.1 424.0,179.9 427.0,179.6 430.0,179.4 433.0,179.1 436.0,178.8 439.0,178.6 442.0,178.3 445.0,178.0 448.0,177.7 451.0,177.4 454.0,177.1 457.0,176.8 460.0,176.4 463.0,176.1 466.0,175.7 469.0,175.4 472.0,175.0 475.0,174.6 478.0,174.2 481.0,173.8 484.0,173.4 487.0,173.0 490.0,172.5 493.0,172.0 496.0,171.6 499.0,171.1 502.0,170.5 505.0,170.0 508.0,169.4 511.0,168.9 514.0,168.3 517.0,167.6 520.0,167.0 523.0,166.3 526.0,165.6 529.0,164.9 532.0,164.1 535.0,163.3 538.0,162.5 541.0,161.6 544.0,160.7 547.0,159.8 550.0,158.8 553.0,157.7 556.0,156.6 559.0,155.4 562.0,154.2 565.0,152.9 568.0,151.5 571.0,150.0 574.0,148.4 577.0,146.8 580.0,145.0 583.0,143.1 586.0,141.1 589.0,138.9 592.0,136.5 595.0,134.0 598.0,131.2 601.0,128.3 604.0,125.0 607.0,121.4 610.0,117.5 613.0,113.2 616.0,108.3 619.0,102.9 622.0,96.9 625.0,90.0 628.0,82.1 631.0,73.1 634.0,62.5 637.0,50.0 640.0,35.0 643.0,35.0 646.0,35.0 649.0,35.0 652.0,35.0 655.0,35.0" style="fill:none;stroke-width:3"/>
<circle class="sPw" cx="370.0" cy="183.5" r="5"/><text class="sC" x="362" y="179.5" text-anchor="end">50%: 20 ms</text>
<circle class="sPw" cx="550.0" cy="158.8" r="5"/><text class="sC" x="542" y="154.75" text-anchor="end">80%: 50 ms</text>
<circle class="sPw" cx="610.0" cy="117.5" r="5"/><text class="sC" x="602" y="113.5" text-anchor="end">90%: 100 ms</text>
<circle class="sPw" cx="640.0" cy="35.0" r="5"/><text class="sC" x="632" y="31" text-anchor="end">95%: 200 ms</text>
<rect class="sG" x="430" y="30" width="120" height="170" rx="0" opacity=".12"/><text class="sGt" x="490" y="46" text-anchor="middle">plan to run here</text>
<text class="sS" x="370" y="238" text-anchor="middle">server utilisation (one queue, random arrivals, 10 ms of work per request)</text>
<text class="sS" x="22" y="115" text-anchor="middle" transform="rotate(-90 22 115)">response time, ms</text>
<circle class="sPr" r="5" opacity="0"><animateMotion dur="9s" repeatCount="indefinite" calcMode="linear" keyPoints="0;0;1;1" keyTimes="0;0.000;0.850;1" path="M70.0 191.8 L88.0 191.5 L106.0 191.2 L124.0 190.9 L142.0 190.6 L160.0 190.3 L178.0 189.9 L196.0 189.6 L214.0 189.1 L232.0 188.7 L250.0 188.2 L268.0 187.7 L286.0 187.1 L304.0 186.5 L322.0 185.8 L340.0 185.0 L358.0 184.1 L376.0 183.2 L394.0 182.1 L412.0 180.8 L430.0 179.4 L448.0 177.7 L466.0 175.7 L484.0 173.4 L502.0 170.5 L520.0 167.0 L538.0 162.5 L556.0 156.6 L574.0 148.4 L592.0 136.5 L601.0 128.3 L604.0 125.0 L607.0 121.4 L610.0 117.5 L613.0 113.2 L616.0 108.3 L619.0 102.9 L622.0 96.9 L625.0 90.0 L628.0 82.1 L631.0 73.1 L634.0 62.5 L637.0 50.0 L640.0 35.0"/><animate attributeName="opacity" dur="9s" repeatCount="indefinite" values="0;0;1;1;0;0" keyTimes="0;0.000;0.002;0.850;0.852;1"/></circle>
</svg><figcaption>Computed with the M/M/1 queueing formula, response time = service time ÷ (1 − utilisation). Latency doubles from 50% to 75% busy and explodes past 90%. That is why capacity plans keep headroom and why load tests look for the knee, not the maximum.</figcaption></figure>

> [!sota] Planning for a known peak
> Shopify prepares all year for Black Friday–Cyber Monday. Over the 2025 weekend its platform peaked at about **489 million requests per minute at the edge** and **more than 117 million per minute on its application servers**, and processed **14.8 trillion database queries** over the weekend (company press release, December 2025). That is a known date with rehearsed load tests and capacity reserved in advance, and it runs on a Ruby on Rails **modular monolith**, with stores grouped into isolated "pods".

**For Egyptian products the known peaks are predictable:** Ramadan evenings (iftar and suhoor for food delivery), salary days at the end of the month (banking and wallets), White Friday sales in November, Thanaweya Amma results day (education sites), and big football matches (streaming and betting traffic). Load-test against them.

## SD2.9 Stage 7: multiple regions 🟡 🔴

Go multi-region for one of two reasons: **latency** for users on other continents, or **surviving the loss of a whole region**. Both are expensive, so be clear which one you need.

| Pattern | How | Trade-off |
|---|---|---|
| **Backup and restore** in another region | Regular backups copied across regions | Cheapest; recovery takes hours |
| **Warm standby (active-passive)** | A smaller copy of the system runs in region B, data replicated asynchronously; fail over when A fails | Minutes of downtime and some lost writes (the replication lag), for a moderate cost |
| **Active-active** | Both regions serve traffic and accept writes | Lowest latency and fastest failover; you must handle write conflicts or partition users by region; the most complex and expensive |

**Recovery targets** decide which pattern you need: the **RTO** (how long you may be down) and the **RPO** (how much recent data you may lose). See [[SD4.8]].

<figure class="dia anim"><svg viewBox="0 0 720 248" role="img" aria-label="Animation: three multi-region patterns: backup and restore, warm standby with async replication, and active-active with both regions live">
<text class="sT" x="120" y="22" text-anchor="middle">Backup &amp; restore</text><text class="sC" x="120" y="236" text-anchor="middle">RTO: hours · cheapest</text>
<rect class="sA" x="10" y="36" width="100" height="150" rx="10"/><text class="sT" x="60" y="56" text-anchor="middle">Region A</text><text class="sC" x="60" y="76" text-anchor="middle">live</text>
<rect class="sB" x="24" y="92" width="72" height="18" rx="3"/>
<rect class="sB" x="24" y="118" width="72" height="18" rx="3"/>
<rect class="sB" x="24" y="144" width="72" height="18" rx="3"/>
<rect class="sN" x="130" y="36" width="100" height="150" rx="10"/><text class="sT" x="180" y="56" text-anchor="middle">Region B</text><text class="sC" x="180" y="76" text-anchor="middle">nothing running</text><rect class="sG" x="144" y="130" width="72" height="30" rx="4"/><text class="sC" x="180" y="150" text-anchor="middle">backups</text>
<line class="sLm" x1="110" y1="145" x2="142" y2="145" marker-end="url(#ahm)"/>
<text class="sS" x="120" y="210" text-anchor="middle">restore from copies</text>
<text class="sT" x="358" y="22" text-anchor="middle">Warm standby</text><text class="sC" x="358" y="236" text-anchor="middle">RTO: minutes · RPO = lag</text>
<rect class="sA" x="248" y="36" width="100" height="150" rx="10"/><text class="sT" x="298" y="56" text-anchor="middle">Region A</text><text class="sC" x="298" y="76" text-anchor="middle">live</text>
<rect class="sB" x="262" y="92" width="72" height="18" rx="3"/>
<rect class="sB" x="262" y="118" width="72" height="18" rx="3"/>
<rect class="sB" x="262" y="144" width="72" height="18" rx="3"/>
<rect class="sB" x="368" y="36" width="100" height="150" rx="10"/><text class="sT" x="418" y="56" text-anchor="middle">Region B</text><text class="sC" x="418" y="76" text-anchor="middle">small copy</text><rect class="sB" x="382" y="92" width="72" height="18" rx="3"/>
<line class="sLw" x1="348" y1="120" x2="380" y2="120" stroke-dasharray="5 3" marker-end="url(#ahw)"/>
<text class="sS" x="358" y="210" text-anchor="middle">promote B on failure</text>
<text class="sT" x="596" y="22" text-anchor="middle">Active-active</text><text class="sC" x="596" y="236" text-anchor="middle">seconds · most complex</text>
<rect class="sA" x="486" y="36" width="100" height="150" rx="10"/><text class="sT" x="536" y="56" text-anchor="middle">Region A</text><text class="sC" x="536" y="76" text-anchor="middle">live</text>
<rect class="sB" x="500" y="92" width="72" height="18" rx="3"/>
<rect class="sB" x="500" y="118" width="72" height="18" rx="3"/>
<rect class="sB" x="500" y="144" width="72" height="18" rx="3"/>
<rect class="sA" x="606" y="36" width="100" height="150" rx="10"/><text class="sT" x="656" y="56" text-anchor="middle">Region B</text><text class="sC" x="656" y="76" text-anchor="middle">live</text>
<rect class="sB" x="620" y="92" width="72" height="18" rx="3"/>
<rect class="sB" x="620" y="118" width="72" height="18" rx="3"/>
<rect class="sB" x="620" y="144" width="72" height="18" rx="3"/>
<line class="sLw" x1="586" y1="120" x2="606" y2="120" marker-start="url(#ahw)" marker-end="url(#ahw)"/>
<text class="sS" x="596" y="210" text-anchor="middle">both take writes</text>
<circle class="sPg" r="4" opacity="0"><animateMotion dur="9s" repeatCount="indefinite" calcMode="linear" keyPoints="0;0;1;1" keyTimes="0;0.000;0.300;1" path="M110 145 L142 145"/><animate attributeName="opacity" dur="9s" repeatCount="indefinite" values="0;0;1;1;0;0" keyTimes="0;0.000;0.002;0.300;0.302;1"/></circle>
<circle class="sPw" r="4" opacity="0"><animateMotion dur="9s" repeatCount="indefinite" calcMode="linear" keyPoints="0;0;1;1" keyTimes="0;0.000;0.120;1" path="M348 120 L380 120"/><animate attributeName="opacity" dur="9s" repeatCount="indefinite" values="0;0;1;1;0;0" keyTimes="0;0.000;0.002;0.120;0.122;1"/></circle>
<circle class="sPw" r="4" opacity="0"><animateMotion dur="9s" repeatCount="indefinite" calcMode="linear" keyPoints="0;0;1;1" keyTimes="0;0.400;0.520;1" path="M348 120 L380 120"/><animate attributeName="opacity" dur="9s" repeatCount="indefinite" values="0;0;1;1;0;0" keyTimes="0;0.398;0.402;0.520;0.522;1"/></circle>
<circle class="sPw" r="3" opacity="0"><animateMotion dur="9s" repeatCount="indefinite" calcMode="linear" keyPoints="0;0;1;1" keyTimes="0;0.000;0.100;1" path="M586 116 L606 116"/><animate attributeName="opacity" dur="9s" repeatCount="indefinite" values="0;0;1;1;0;0" keyTimes="0;0.000;0.002;0.100;0.102;1"/></circle>
<circle class="sPw" r="3" opacity="0"><animateMotion dur="9s" repeatCount="indefinite" calcMode="linear" keyPoints="0;0;1;1" keyTimes="0;0.200;0.300;1" path="M606 124 L586 124"/><animate attributeName="opacity" dur="9s" repeatCount="indefinite" values="0;0;1;1;0;0" keyTimes="0;0.198;0.202;0.300;0.302;1"/></circle>
<circle class="sPw" r="3" opacity="0"><animateMotion dur="9s" repeatCount="indefinite" calcMode="linear" keyPoints="0;0;1;1" keyTimes="0;0.500;0.600;1" path="M586 116 L606 116"/><animate attributeName="opacity" dur="9s" repeatCount="indefinite" values="0;0;1;1;0;0" keyTimes="0;0.498;0.502;0.600;0.602;1"/></circle>
<circle class="sPw" r="3" opacity="0"><animateMotion dur="9s" repeatCount="indefinite" calcMode="linear" keyPoints="0;0;1;1" keyTimes="0;0.700;0.800;1" path="M606 124 L586 124"/><animate attributeName="opacity" dur="9s" repeatCount="indefinite" values="0;0;1;1;0;0" keyTimes="0;0.698;0.702;0.800;0.802;1"/></circle>
</svg><figcaption>Multi-region patterns, cheapest to most resilient. RTO is how long you're down; RPO is how much recent data you lose.</figcaption></figure>

> [!sota] Why "one region" is a business decision, not just a technical one
> On 19–20 October 2025 a race condition in the automation that manages DynamoDB's DNS records left the service's regional endpoint in AWS's us-east-1 (Northern Virginia) with an empty DNS record. Because other AWS internals depend on DynamoDB, EC2 instance launches and Network Load Balancer health checks were affected too, and impact on customer applications lasted, in stages, for about 14 hours. Products that ran only in that region went down with it. Most can accept that risk; banks, payment gateways and hospitals usually can't.

**Data residency** is part of this decision. Egypt's Personal Data Protection Law (No. 151 of 2020) restricts transferring personal data abroad without meeting its conditions, and regulated sectors (banking, health, government) often have stricter rules, so check with legal before choosing regions for Egyptian users' personal data.

## SD2.10 Microservices are about teams, not traffic 🟡 ⭐

A popular rule says "at a million users, break the monolith into microservices". That reverses cause and effect. **A well-built monolith scales to very large traffic** by running many copies behind a load balancer; the companies above prove it. Microservices mainly solve an **organisational** problem: many teams that need to release independently without blocking each other.

| | Monolith (well-structured, "modular") | Microservices |
|---|---|---|
| Deploy | One unit, many copies | Many units, each its own pipeline |
| Scales traffic? | Yes, horizontally | Yes, and each part independently |
| Team scaling | Gets harder past many teams in one codebase, unless boundaries are enforced | Teams own services end to end |
| Failure | In-process calls don't fail on the network | Every call can time out; needs retries, circuit breakers, tracing |
| Data | One database, real transactions | A database per service; consistency through events and sagas |
| Cost to run | Low | High: platform, observability, on-call per service |

<figure class="dia anim"><svg viewBox="0 0 720 244" role="img" aria-label="Animation: A modular monolith with four modules in one deployable and one database, versus four microservices each with its own database talking over the network">
<text class="sT" x="170" y="22" text-anchor="middle">Modular monolith</text><text class="sT" x="540" y="22" text-anchor="middle">Microservices</text>
<rect class="sA" x="20" y="36" width="300" height="140" rx="12"/><text class="sC" x="170" y="54" text-anchor="middle">one deployable, many copies</text>
<rect class="sB" x="34" y="64" width="128" height="40" rx="8" stroke-dasharray="5 3"/><text class="sT" x="98" y="89" text-anchor="middle">Orders</text>
<rect class="sB" x="178" y="64" width="128" height="40" rx="8" stroke-dasharray="5 3"/><text class="sT" x="242" y="89" text-anchor="middle">Payments</text>
<rect class="sB" x="34" y="116" width="128" height="40" rx="8" stroke-dasharray="5 3"/><text class="sT" x="98" y="141" text-anchor="middle">Catalog</text>
<rect class="sB" x="178" y="116" width="128" height="40" rx="8" stroke-dasharray="5 3"/><text class="sT" x="242" y="141" text-anchor="middle">Users</text>
<text class="sC" x="170" y="168" text-anchor="middle">calls are in-process method calls</text>
<rect class="sG" x="70" y="196" width="200" height="34" rx="8"/><text class="sC" x="170" y="218" text-anchor="middle">one DB, a schema per module</text><line class="sLm" x1="170" y1="176" x2="170" y2="194" marker-end="url(#ahm)"/>
<rect class="sA" x="380" y="40" width="130" height="40" rx="8"/><text class="sT" x="445" y="65" text-anchor="middle">Orders</text><rect class="sG" x="410" y="92" width="70" height="26" rx="6"/><text class="sC" x="445" y="110" text-anchor="middle">own DB</text><line class="sLm" x1="445" y1="80" x2="445" y2="90"/>
<rect class="sA" x="550" y="40" width="130" height="40" rx="8"/><text class="sT" x="615" y="65" text-anchor="middle">Payments</text><rect class="sG" x="580" y="92" width="70" height="26" rx="6"/><text class="sC" x="615" y="110" text-anchor="middle">own DB</text><line class="sLm" x1="615" y1="80" x2="615" y2="90"/>
<rect class="sA" x="380" y="140" width="130" height="40" rx="8"/><text class="sT" x="445" y="165" text-anchor="middle">Catalog</text><rect class="sG" x="410" y="192" width="70" height="26" rx="6"/><text class="sC" x="445" y="210" text-anchor="middle">own DB</text><line class="sLm" x1="445" y1="180" x2="445" y2="190"/>
<rect class="sA" x="550" y="140" width="130" height="40" rx="8"/><text class="sT" x="615" y="165" text-anchor="middle">Users</text><rect class="sG" x="580" y="192" width="70" height="26" rx="6"/><text class="sC" x="615" y="210" text-anchor="middle">own DB</text><line class="sLm" x1="615" y1="180" x2="615" y2="190"/>
<line class="sLw" x1="510" y1="60" x2="550" y2="60" marker-start="url(#ahw)" marker-end="url(#ahw)"/><line class="sLw" x1="445" y1="118" x2="445" y2="140" marker-end="url(#ahw)"/><line class="sLw" x1="510" y1="160" x2="550" y2="160" marker-start="url(#ahw)" marker-end="url(#ahw)"/>
<text class="sWt" x="530" y="234" text-anchor="middle">network calls: timeouts, retries, tracing, events</text>
<circle class="sPg" r="3" opacity="0"><animateMotion dur="10s" repeatCount="indefinite" calcMode="linear" keyPoints="0;0;1;1" keyTimes="0;0.000;0.040;1" path="M162 84 L178 84"/><animate attributeName="opacity" dur="10s" repeatCount="indefinite" values="0;0;1;1;0;0" keyTimes="0;0.000;0.002;0.040;0.042;1"/></circle>
<circle class="sPg" r="3" opacity="0"><animateMotion dur="10s" repeatCount="indefinite" calcMode="linear" keyPoints="0;0;1;1" keyTimes="0;0.060;0.120;1" path="M170 176 L170 194"/><animate attributeName="opacity" dur="10s" repeatCount="indefinite" values="0;0;1;1;0;0" keyTimes="0;0.058;0.062;0.120;0.122;1"/></circle>
<circle class="sPw" r="4" opacity="0"><animateMotion dur="10s" repeatCount="indefinite" calcMode="linear" keyPoints="0;0;1;1" keyTimes="0;0.300;0.420;1" path="M510 60 L550 60"/><animate attributeName="opacity" dur="10s" repeatCount="indefinite" values="0;0;1;1;0;0" keyTimes="0;0.298;0.302;0.420;0.422;1"/></circle>
<circle class="sPw" r="4" opacity="0"><animateMotion dur="10s" repeatCount="indefinite" calcMode="linear" keyPoints="0;0;1;1" keyTimes="0;0.460;0.580;1" path="M550 64 L510 64"/><animate attributeName="opacity" dur="10s" repeatCount="indefinite" values="0;0;1;1;0;0" keyTimes="0;0.458;0.462;0.580;0.582;1"/></circle>
<circle class="sPw" r="4" opacity="0"><animateMotion dur="10s" repeatCount="indefinite" calcMode="linear" keyPoints="0;0;1;1" keyTimes="0;0.620;0.720;1" path="M445 118 L445 140"/><animate attributeName="opacity" dur="10s" repeatCount="indefinite" values="0;0;1;1;0;0" keyTimes="0;0.618;0.622;0.720;0.722;1"/></circle>
</svg><figcaption>Same boundaries, different deployment. A modular monolith keeps the option to extract a service later, without paying the distributed-systems tax now.</figcaption></figure>

> [!sota] Three public data points
> - **Shopify** runs one of the largest Ruby on Rails codebases as a **modular monolith** with enforced component boundaries ("Deconstructing the Monolith", 2019), and serves Black Friday at the scale in [[SD2.8]].
> - **Amazon Prime Video**'s team wrote in March 2023 that moving a stream-monitoring service from distributed serverless components (AWS Step Functions and Lambda, with S3 between steps) into a **single process** on EC2 and ECS cut that service's infrastructure cost by **over 90%** and let it scale further. The per-state-transition pricing and the data passed between steps were the problem.
> - **Figma** ([[SD2.7]]) scaled PostgreSQL to the limit before sharding, rather than rewriting into services.

Martin Fowler's "MonolithFirst" (2015) puts it plainly: almost all successful microservice systems he saw started as a monolith that was split once its boundaries were understood. The practical path is a **modular monolith** first: clear modules with their own folders, interfaces and ideally their own database schema, which can be extracted into a service later if a team or a scaling need demands it ([[B9]]).

> [!say]
> "Traffic alone isn't a reason for microservices: a stateless monolith scales horizontally. I'd start with a modular monolith and extract a service when a module needs independent releases by its own team, or very different scaling, like a CPU-heavy video encoder next to a light CRUD API."

## SD2.11 Cost at scale 🟡

At small scale, engineers cost far more than servers. At large scale, the cloud bill becomes a design input.

- **Know your unit cost**: cost per active user, per order, per thousand API calls, per LLM conversation ([[SD5.7]]). It tells you whether growth makes you richer or poorer.
- **The usual leaks**: oversized instances running at 5% CPU, forgotten environments, **data egress** (moving data out of a cloud or between regions is billed per GB), chatty services calling each other across zones, logs kept forever at full detail, and per-request pricing (serverless functions, step functions, managed APIs) used for very high-volume work, which is exactly the Prime Video case.
- **The usual levers**: autoscaling to zero at night for internal tools, reserved or committed-use capacity for the steady baseline, spot or preemptible instances for interruptible batch work, caching, compression, storage tiers (hot, cool, archive), and deleting what nobody uses.

<figure class="dia anim"><svg viewBox="0 0 720 240" role="img" aria-label="Animation: Matching cloud pricing to the shape of the load over a day: a steady baseline of two instances runs all day on reserved or committed capacity; daytime load up to four instances and an evening peak up to six are covered by autoscaled on-demand instances; interruptible batch jobs use spot capacity">
<line class="sLm" x1="70" y1="190" x2="670" y2="190"/>
<line class="sLm" x1="70" y1="190" x2="70" y2="30"/>
<text class="sS" x="62" y="194" text-anchor="end">0</text>
<text class="sS" x="62" y="151.143" text-anchor="end">2</text>
<text class="sS" x="62" y="108.286" text-anchor="end">4</text>
<text class="sS" x="62" y="65.4286" text-anchor="end">6</text>
<text class="sS" x="70" y="208" text-anchor="middle">00:00</text>
<text class="sS" x="220" y="208" text-anchor="middle">06:00</text>
<text class="sS" x="370" y="208" text-anchor="middle">12:00</text>
<text class="sS" x="520" y="208" text-anchor="middle">18:00</text>
<text class="sS" x="670" y="208" text-anchor="middle">24:00</text>
<rect class="sG" x="70" y="147.143" width="600" height="42.8571" rx="0" opacity=".55"/><text class="sT" x="370" y="172.571" text-anchor="middle">steady baseline: reserved / committed (biggest discount)</text>
<polygon class="sB" points="70.0,147.14285714285714 70.0,147.1 95.0,147.1 95.0,147.1 120.0,147.1 120.0,147.1 145.0,147.1 145.0,147.1 170.0,147.1 170.0,147.1 195.0,147.1 195.0,147.1 220.0,147.1 220.0,147.1 245.0,147.1 245.0,147.1 270.0,147.1 270.0,104.3 295.0,104.3 295.0,104.3 320.0,104.3 320.0,104.3 345.0,104.3 345.0,104.3 370.0,104.3 370.0,104.3 395.0,104.3 395.0,104.3 420.0,104.3 420.0,104.3 445.0,104.3 445.0,104.3 470.0,104.3 470.0,104.3 495.0,104.3 495.0,104.3 520.0,104.3 520.0,61.4 545.0,61.4 545.0,61.4 570.0,61.4 570.0,104.3 595.0,104.3 595.0,147.1 620.0,147.1 620.0,147.1 645.0,147.1 645.0,147.1 670.0,147.1 670.0,147.14285714285714" opacity=".55"/>
<text class="sT" x="420" y="122.286" text-anchor="middle">daytime: autoscaled on-demand</text>
<text class="sWt" x="557.5" y="53.4286" text-anchor="middle">evening peak</text>
<text class="sS" x="370" y="230" text-anchor="middle">batch jobs that can be interrupted (re-index, reports): spot capacity at the deepest discount</text>
<text class="sS" x="22" y="110" text-anchor="middle" transform="rotate(-90 22 110)">instances</text>
<circle class="sPw" r="4" opacity="0"><animateMotion dur="12s" repeatCount="indefinite" calcMode="linear" keyPoints="0;0;1;1" keyTimes="0;0.000;0.900;1" path="M70 147 L270 147 L270 104 L520 104 L520 61 L570 61 L570 104 L595 104 L595 147 L670 147"/><animate attributeName="opacity" dur="12s" repeatCount="indefinite" values="0;0;1;1;0;0" keyTimes="0;0.000;0.002;0.900;0.902;1"/></circle>
</svg><figcaption>Buy the floor, rent the peaks: commit to the capacity you always use, autoscale the rest, and push interruptible work to spot. Illustrative load shape.</figcaption></figure>

Many organisations run this as **FinOps**: engineering, finance and product share cost visibility and own their spend.

## SD2.12 Interview drill 🟢 ⭐

| Question | Strong short answer |
|---|---|
| How would you scale a web app from 1,000 to 1 million users? | Measure first, then climb in order: separate managed database with pooling, stateless servers behind a load balancer, cache and CDN, read replicas, queues for slow work, and only then partitioning or more regions. |
| Database CPU is at 90%. First steps? | Find the expensive queries (query store, slow log), fix indexes and N+1s, cache hot reads, move reads to replicas; scale the instance if needed; shard last. |
| What is connection pooling and why does autoscaling make it matter? | Reusing open connections; many instances each opening many connections can exceed the database limit, so size pools and use a pooler like PgBouncer. |
| What must change before running several app servers? | Remove server state: sessions to tokens or Redis, files to object storage, scheduled jobs to a single scheduler, WebSocket fan-out via a backplane. |
| Read replicas: benefit and catch? | They scale reads and isolate reporting; replication lag means users may not see their own writes. |
| When do you shard? | When writes or storage exceed one primary after query fixes, caching, replicas and vertical scaling; with a key that spreads load and keeps a request on one shard. |
| What makes a bad shard key? | Uneven load (hot shards) or queries that must hit every shard. |
| Liveness vs readiness checks? | Liveness: is the process alive, restart if not. Readiness: can it serve now, stop routing traffic if not. |
| How do you know the system survives launch? | Load, soak and spike tests on a production-like environment against modelled real traffic, plus capacity headroom and a rollback plan. |
| Active-passive vs active-active regions? | A standby that takes over on failure (cheaper, some downtime and data loss) vs both regions serving (fast failover and low latency, but write conflicts and cost). |
| Monolith or microservices at a million users? | Traffic doesn't decide it; a stateless monolith scales out. Split when teams need independent deployment or parts need very different scaling. |
| Why can queues hide a problem? | They move load, not remove it; if consumers are slower than producers the backlog grows until something fails, so watch queue age and apply backpressure. |
| Name three cloud cost leaks. | Idle oversized instances, data egress between regions or out of the cloud, and per-request pricing on very high-volume workloads. |

## Key takeaways

> [!check]
> - Scaling is a loop: measure, find the one bottleneck, fix it simply, repeat.
> - The ladder: one server → managed database + pooling → load balancer + stateless servers → cache, CDN, replicas → queues → partitioning/sharding → multiple regions.
> - Climb on signals (saturation, latency, failure risk), not on user-count rules.
> - Reads scale with caches and replicas; writes scale with partitioning, which is the expensive step.
> - Microservices solve team scaling; a modular monolith scales traffic a long way (Shopify, Stack Overflow).
> - Load-test against your known peaks, and know your unit cost.

## Sources

- Figma Engineering, [How Figma's databases team lived to tell the scale](https://www.figma.com/blog/how-figmas-databases-team-lived-to-tell-the-scale/) (March 2024).
- Nick Craver, [Stack Overflow: The Architecture – 2016 Edition](https://nickcraver.com/blog/2016/02/17/stack-overflow-the-architecture-2016-edition/); Stack Overflow, [Moving the public Stack Overflow sites to the cloud: Part 1](https://stackoverflow.blog/2025/08/28/moving-the-public-stack-overflow-sites-to-the-cloud-part-1/) (August 2025).
- Shopify Engineering, [Deconstructing the Monolith](https://shopify.engineering/deconstructing-monolith-designing-software-maximizes-developer-productivity) (2019) and [BFCM readiness 2025](https://shopify.engineering/bfcm-readiness-2025); Shopify, [Black Friday–Cyber Monday 2025 press release](https://www.shopify.com/investors/press-releases/shopify-merchants-achieve-record-breaking-146-billion-black).
- The Prime Video team's March 2023 post has since been taken down; contemporary reports with quotations: [DevClass](https://devclass.com/2023/05/05/reduce-costs-by-90-by-moving-from-microservices-to-monolith-amazon-internal-case-study-raises-eyebrows/), [The New Stack](https://thenewstack.io/return-of-the-monolith-amazon-dumps-microservices-for-video-monitoring/).
- AWS, [Summary of the Amazon DynamoDB service disruption in the Northern Virginia (US-EAST-1) Region](https://aws.amazon.com/message/101925/) (October 2025).
- Martin Fowler, [MonolithFirst](https://martinfowler.com/bliki/MonolithFirst.html) (2015).
- PostgreSQL documentation: [Connections and authentication (`max_connections`)](https://www.postgresql.org/docs/current/runtime-config-connection.html); [PgBouncer](https://www.pgbouncer.org/).
- AWS, [Disaster recovery options in the cloud](https://docs.aws.amazon.com/whitepapers/latest/disaster-recovery-workloads-on-aws/disaster-recovery-options-in-the-cloud.html); [FinOps Foundation](https://www.finops.org/introduction/what-is-finops/).
