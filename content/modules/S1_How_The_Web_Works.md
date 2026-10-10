# How the Web Works — URLs, DNS, HTTP, TLS, Cookies, CORS and Caching

Every frontend, backend and full-stack interview assumes this module. It is also where "explain your project" questions go when the interviewer wants to see whether you understand what happens *between* your Angular app and your ASP.NET Core API.

> [!focus]
> **Entry must:** walk through "what happens when I type a URL" without gaps; say which HTTP methods are safe and idempotent; know the main status codes by heart; explain cookies versus tokens at a basic level; explain why CORS exists.
> **Mid adds:** HTTP/2 and HTTP/3 differences, TLS handshake shape, cache headers and ETags, preflight requests, SameSite.
> **Most asked:** *What happens when you type a URL and press Enter?* · *PUT vs PATCH vs POST?* · *401 vs 403?* · *What is CORS and how do you fix a CORS error?* · *Where should a JWT live in the browser?*
> **Time budget:** 2–3 hours.

## S1.0 Foundations: the network under HTTP 🟢

Everything in this module rides on a few networking ideas. If *port*, *packet* or *round trip* feel vague, spend fifteen minutes here first. The Network track goes much deeper in [[N1]] and [[N2]].

### Layers and encapsulation

The internet is built in layers. Each layer solves one problem and trusts the layer below it for everything else. Software interviews use the four-layer **TCP/IP model**; network interviews also use the seven-layer **OSI model**, which splits the top layer into three and the bottom layer into two.

| TCP/IP layer | OSI layers | Its job | Addresses it uses | Examples |
|---|---|---|---|---|
| **Application** | 7 Application, 6 Presentation, 5 Session | What two programs say to each other | Names and URLs | HTTP, DNS, SMTP, SSH; TLS sits between HTTP and TCP |
| **Transport** | 4 Transport | Deliver data to the right **program** on a machine, reliably (TCP) or not (UDP) | **Ports** | TCP, UDP, QUIC (built on UDP) |
| **Internet** | 3 Network | Get packets **across networks**, hop by hop | **IP addresses** | IPv4, IPv6, ICMP (`ping`) |
| **Link** | 2 Data link, 1 Physical | Move frames across **one** physical link | **MAC addresses** | Ethernet, Wi-Fi |

On the way out, each layer wraps what it got from the layer above in its own header. This is **encapsulation**, and the receiver unwraps it in reverse order.

<figure class="dia steps"><svg viewBox="0 0 720 300" role="img" aria-label="Encapsulation: the HTTP request is wrapped in a TCP header, then an IP header, then a link-layer frame; routers forward it and the server unwraps it">
<text class="sC" x="95" y="16" text-anchor="middle">YOUR LAPTOP</text><text class="sC" x="625" y="16" text-anchor="middle">SERVER</text>
<rect class="sA" x="20" y="26" width="150" height="44" rx="8"/><text class="sT" x="95" y="45" text-anchor="middle">Application</text><text class="sS" x="95" y="61" text-anchor="middle">HTTP (+ TLS)</text>
<rect class="sB" x="20" y="84" width="150" height="44" rx="8"/><text class="sT" x="95" y="103" text-anchor="middle">Transport</text><text class="sS" x="95" y="119" text-anchor="middle">TCP · ports</text>
<rect class="sB" x="20" y="142" width="150" height="44" rx="8"/><text class="sT" x="95" y="161" text-anchor="middle">Internet</text><text class="sS" x="95" y="177" text-anchor="middle">IP · addresses</text>
<rect class="sB" x="20" y="200" width="150" height="44" rx="8"/><text class="sT" x="95" y="219" text-anchor="middle">Link</text><text class="sS" x="95" y="235" text-anchor="middle">Wi-Fi / Ethernet · MAC</text>
<rect class="sA" x="550" y="26" width="150" height="44" rx="8"/><text class="sT" x="625" y="45" text-anchor="middle">Application</text><text class="sS" x="625" y="61" text-anchor="middle">web server process</text>
<rect class="sB" x="550" y="84" width="150" height="44" rx="8"/><text class="sT" x="625" y="103" text-anchor="middle">Transport</text><text class="sS" x="625" y="119" text-anchor="middle">port 443 → which program</text>
<rect class="sB" x="550" y="142" width="150" height="44" rx="8"/><text class="sT" x="625" y="161" text-anchor="middle">Internet</text><text class="sS" x="625" y="177" text-anchor="middle">is this IP mine?</text>
<rect class="sB" x="550" y="200" width="150" height="44" rx="8"/><text class="sT" x="625" y="219" text-anchor="middle">Link</text><text class="sS" x="625" y="235" text-anchor="middle">frame for my MAC?</text>
<g data-s="1"><rect class="sA" x="386" y="32" width="144" height="32" rx="5"/><text class="sM" x="458" y="52" text-anchor="middle">GET /dashboard</text><line class="sLm" x1="172" y1="48" x2="382" y2="48" marker-end="url(#ahm)"/></g>
<g data-s="2"><rect class="sG" x="314" y="90" width="70" height="32" rx="5"/><text class="sT" x="349" y="110" text-anchor="middle">TCP</text><rect class="sA" x="386" y="90" width="144" height="32" rx="5"/><text class="sC" x="458" y="110" text-anchor="middle">data</text><text class="sC" x="349" y="136" text-anchor="middle">:52344 → :443</text><line class="sLm" x1="172" y1="106" x2="310" y2="106" marker-end="url(#ahm)"/></g>
<g data-s="3"><rect class="sW" x="242" y="148" width="70" height="32" rx="5"/><text class="sT" x="277" y="168" text-anchor="middle">IP</text><rect class="sG" x="314" y="148" width="70" height="32" rx="5"/><text class="sC" x="349" y="168" text-anchor="middle">TCP</text><rect class="sA" x="386" y="148" width="144" height="32" rx="5"/><text class="sC" x="458" y="168" text-anchor="middle">data</text><text class="sC" x="277" y="194" text-anchor="middle">192.168.1.20 → 203.0.113.10</text><line class="sLm" x1="172" y1="164" x2="238" y2="164" marker-end="url(#ahm)"/></g>
<g data-s="4"><rect class="sV" x="190" y="206" width="50" height="32" rx="5"/><text class="sT" x="215" y="226" text-anchor="middle">Eth</text><rect class="sW" x="242" y="206" width="70" height="32" rx="5"/><text class="sC" x="277" y="226" text-anchor="middle">IP</text><rect class="sG" x="314" y="206" width="70" height="32" rx="5"/><text class="sC" x="349" y="226" text-anchor="middle">TCP</text><rect class="sA" x="386" y="206" width="144" height="32" rx="5"/><text class="sC" x="458" y="226" text-anchor="middle">data</text><text class="sC" x="215" y="252" text-anchor="middle">next-hop MAC</text></g>
<g data-s="5"><line class="sD" x1="95" y1="246" x2="95" y2="282"/><line class="sD" x1="625" y1="246" x2="625" y2="282"/><line class="sL" x1="95" y1="282" x2="330" y2="282"/><line class="sL" x1="390" y1="282" x2="625" y2="282" marker-end="url(#ah)"/><rect class="sW" x="330" y="268" width="60" height="28" rx="14"/><text class="sC" x="360" y="286" text-anchor="middle">router</text></g>
<g class="pk" data-s="5"><rect class="sP" x="-14" y="-8" width="28" height="16" rx="3"><animateMotion dur="2.4s" begin="indefinite" fill="freeze" path="M95 282 H625"/></rect></g>
<g data-s="6"><line class="sL" x1="708" y1="236" x2="708" y2="40" marker-end="url(#ah)"/><text class="sM" x="700" y="270" text-anchor="end">unwrap ↑</text></g>
</svg><ol class="dia-steps">
<li>Your browser produces application data: an HTTP request such as <code>GET /dashboard</code>, encrypted by TLS when the URL is https.</li>
<li>The transport layer (TCP here) adds a header with the source and destination <b>ports</b> (a random one on your side, 443 on the server) and sequence numbers so the bytes can be put back in order.</li>
<li>The internet layer adds an IP header with the source and destination <b>IP addresses</b>. This is what gets the packet across networks.</li>
<li>The link layer adds a frame header with <b>MAC addresses</b> for the next hop only (your Wi-Fi router) and a checksum at the end. Now it's a frame on the wire.</li>
<li>Each router reads the IP header, chooses the next hop and writes a new link header. IP addresses stay the same end to end (unless NAT rewrites them); MAC addresses change at every hop.</li>
<li>The server unwraps in reverse: link, then IP, then TCP, which uses the port to hand the data to the right program, your web server.</li>
</ol><figcaption>Encapsulation: every layer adds its own header on the way down and strips it on the way up.</figcaption></figure>

### IP addresses, ports and sockets

- An **IPv4** address is 32 bits, written as four numbers (`203.0.113.10`): about 4.3 billion addresses, which ran out years ago. **IPv6** uses 128 bits (`2001:db8::10`).
- **Private ranges** (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`) are reused in every home and office. Your router uses **NAT** to share one public address among all your devices, which is also why a server can't open a connection *to* your laptop unless your laptop asked first.
- A **port** picks the program on a machine. Servers listen on well-known ports; your side uses a random, short-lived **ephemeral port**.
- A connection is identified by four values: source IP, source port, destination IP, destination port. That is how one server listening on port 443 talks to thousands of clients at once: every connection differs in at least the client's address or port.

| Port | Service | Port | Service |
|---|---|---|---|
| 22 | SSH | 1433 | SQL Server |
| 53 | DNS | 3306 | MySQL |
| 80 | HTTP | 5432 | PostgreSQL |
| 443 | HTTPS (and HTTP/3 over UDP) | 6379 | Redis |

> [!term] Port
> A 16-bit number (0–65535) that tells the operating system which program should receive the data. Ports below 1024 are reserved for well-known services; `localhost:4200` and `localhost:5000` are two programs on the same machine.

> [!mistake] "It works on my machine but not in Docker"
> A server bound to `127.0.0.1` (loopback) only accepts connections from the same machine, and inside a container "the same machine" means the container. Bind to `0.0.0.0` (all interfaces) inside containers, then publish the port. Details in [[S5]].

### Latency, bandwidth and round trips

**Latency** is how long one message takes to arrive; **bandwidth** is how much data per second the link carries. A wider pipe doesn't make a long pipe shorter. Light in fibre covers about 200 km per millisecond, so every 100 km of distance adds at least 1 ms to a **round trip** (there and back), before routing and queuing. Cairo to Western Europe is typically 50–80 ms per round trip.

Web pages are usually limited by **round trips**, not bandwidth: a new HTTPS connection needs several of them before the first byte of HTML arrives ([[S1.5]] counts them). That is the reason behind most web performance advice: CDNs shorten the distance, keep-alive and HTTP/2 reuse connections, HTTP/3 merges handshakes, and fewer sequential requests mean fewer waits.

> [!lab] Measure it yourself
> `ping example.com` shows the round-trip time; `tracert example.com` (Windows) or `traceroute example.com` lists every router on the way. Then let curl split one request into its phases:
> ```bash
> curl -o /dev/null -s -w "dns %{time_namelookup}s  tcp %{time_connect}s  tls %{time_appconnect}s  first byte %{time_starttransfer}s  total %{time_total}s\n" https://example.com
> ```
> Each figure is cumulative from the start, so the gaps between them are the cost of each phase.

## S1.1 What happens when you type a URL and press Enter 🟢 ⭐

This is the single most common opening question in web interviews, because a good answer touches every layer. Tell it as a story with seven beats.

<figure class="dia steps"><svg viewBox="0 0 720 300" role="img" aria-label="Request path from browser through DNS, TCP and TLS to the server and back">
<rect class="sA" x="20" y="120" width="110" height="56" rx="8"/><text class="sT" x="75" y="144" text-anchor="middle">Browser</text><text class="sS" x="75" y="162" text-anchor="middle">parse URL, cache?</text>
<rect class="sB" x="190" y="20" width="130" height="50" rx="8"/><text class="sT" x="255" y="42" text-anchor="middle">DNS resolver</text><text class="sS" x="255" y="59" text-anchor="middle">name → IP</text>
<rect class="sB" x="190" y="230" width="130" height="50" rx="8"/><text class="sT" x="255" y="252" text-anchor="middle">CDN / proxy</text><text class="sS" x="255" y="269" text-anchor="middle">may answer from cache</text>
<rect class="sA" x="400" y="120" width="130" height="56" rx="8"/><text class="sT" x="465" y="144" text-anchor="middle">Load balancer</text><text class="sS" x="465" y="162" text-anchor="middle">TLS often ends here</text>
<rect class="sG" x="590" y="80" width="110" height="46" rx="8"/><text class="sT" x="645" y="108" text-anchor="middle">App server</text>
<rect class="sG" x="590" y="170" width="110" height="46" rx="8"/><text class="sT" x="645" y="198" text-anchor="middle">Database</text>
<g data-s="1"><text class="sM" x="20" y="108">① cache + HSTS check</text></g>
<g data-s="2"><line class="sL" x1="130" y1="135" x2="190" y2="55"/><text class="sM" x="120" y="88">② DNS</text><text class="sC" x="330" y="50">203.0.113.10</text></g>
<g class="pk" data-s="2"><circle class="sP" r="6"><animateMotion dur="1.6s" begin="indefinite" fill="freeze" path="M130 135 L190 55 L130 135"/></circle></g>
<g data-s="3"><line class="sL" x1="130" y1="150" x2="400" y2="150"/><text class="sM" x="200" y="142">③ TCP/QUIC  ④ TLS</text></g>
<g class="pk" data-s="3"><circle class="sPw" r="6"><animateMotion dur="2.2s" begin="indefinite" fill="freeze" path="M130 150 H400 H130 H400"/></circle></g>
<g data-s="4"><text class="sM" x="200" y="128">⑤ HTTP request →</text></g>
<g class="pk" data-s="4"><circle class="sP" r="6"><animateMotion dur="1.4s" begin="indefinite" fill="freeze" path="M130 150 H400 L530 140 L590 105"/></circle></g>
<g data-s="5"><line class="sL" x1="530" y1="140" x2="590" y2="105"/><line class="sL" x1="645" y1="126" x2="645" y2="170"/><text class="sM" x="640" y="152" text-anchor="end">⑥ your code</text></g>
<g class="pk" data-s="5"><circle class="sPg" r="6"><animateMotion dur="1.2s" begin="indefinite" fill="freeze" path="M645 126 V170 V126"/></circle></g>
<g data-s="6"><line class="sD" x1="130" y1="165" x2="190" y2="245"/><text class="sM" x="250" y="185">response ← status, headers, body</text></g>
<g class="pk" data-s="6"><circle class="sPg" r="6"><animateMotion dur="1.4s" begin="indefinite" fill="freeze" path="M590 105 L530 140 L400 160 H130"/></circle></g>
<g data-s="7"><text class="sM" x="20" y="210">⑦ parse, fetch assets, render</text></g>
</svg><ol class="dia-steps">
<li>The browser parses the URL and checks its own cache and HSTS list. A fresh cached copy means no network at all.</li>
<li>DNS turns the host name into an IP address: browser cache, operating system, then the resolver.</li>
<li>A connection opens (TCP, or QUIC for HTTP/3), then TLS verifies the certificate and agrees keys. Each handshake costs a round trip.</li>
<li>The HTTP request goes out. A CDN may answer it from cache; otherwise the load balancer forwards it to an app server.</li>
<li>Your code runs: routing, authentication, a database query or two.</li>
<li>The response travels back: status line, headers, body.</li>
<li>The browser builds the DOM and CSSOM, runs scripts, fetches images and styles, lays out and paints.</li>
</ol><figcaption>The journey of one request. A CDN or proxy may answer from its cache before the request ever reaches your server.</figcaption></figure>

1. **Parse and check caches.** The browser parses the URL (scheme, host, port, path, query) and checks whether it already has a valid cached copy, or an HSTS rule that forces `https`.
2. **DNS.** It resolves the host name to an IP address: browser cache, then the operating system, then the configured resolver (your ISP's, or something like 1.1.1.1), which walks root → `.com` → the domain's authoritative name server if it doesn't already have the answer cached.
3. **Connection.** For HTTP/1.1 and HTTP/2 it opens a **TCP** connection (three-way handshake: SYN, SYN-ACK, ACK). For HTTP/3 it uses **QUIC** over UDP instead.
4. **TLS.** For `https` it performs a TLS handshake: agrees keys, and checks the server's **certificate** against trusted certificate authorities. TLS 1.3 needs one round trip for a new connection.
5. **HTTP request.** It sends something like `GET /dashboard HTTP/2` with headers (`Host`, `Accept`, `Cookie`, `Authorization`...).
6. **Server side.** A load balancer or reverse proxy forwards it to an application server; your code runs (routing, auth, database queries) and returns a **response**: status line, headers, body.
7. **Render.** The browser parses HTML into the DOM, CSS into the CSSOM, runs JavaScript, fetches images, scripts and stylesheets (often over the same connection), lays out and paints. Rendering is covered properly in [[F9]].

> [!say]
> "The browser resolves the domain through DNS, opens a TCP connection, or QUIC for HTTP/3, does a TLS handshake to verify the certificate and agree keys, then sends the HTTP request. A load balancer passes it to the app server, which runs the route, maybe queries the database, and returns a status, headers and body. The browser then builds the DOM and CSSOM, runs scripts, fetches the other assets and paints the page."

> [!story]
> In FinSight the request from Angular went to **Caddy** (which obtains and renews the Let's Encrypt certificate automatically and terminates TLS), then **nginx** as a reverse proxy, then the ASP.NET Core container. That's beats 4–6 in a real system you deployed, and it makes a much better answer than a generic diagram.

## S1.2 URLs and DNS 🟢

```text
https://api.finsight.example:443/v1/invoices?status=paid&page=2#totals
└─┬─┘   └────────┬─────────┘└┬┘└────┬─────┘└──────────┬───────┘└──┬──┘
scheme         host         port   path             query      fragment
```

- The **fragment** (`#totals`) never leaves the browser. That is why single-page apps once used `#/routes`, and why it can't be logged by the server.
- The **origin** is scheme + host + port. It is the unit of the same-origin policy ([[S1.7]]).
- Query strings appear in server logs, proxy logs and browser history. **Never put secrets or personal data in a URL.**

> [!term] DNS (Domain Name System)
> The internet's distributed phone book: it maps names like `example.com` to IP addresses and other records. Answers are cached at every level for as long as the record's **TTL** (time to live) allows.

<figure class="dia steps"><svg viewBox="0 0 720 250" role="img" aria-label="Recursive DNS resolution: after the browser and OS caches miss, a recursive resolver asks a root server, is referred to the .example TLD servers, then to the authoritative servers for finsight.example, which return the A record 203.0.113.10 with a TTL of 300 seconds; the answer is cached for that long">
<rect class="sA" x="14" y="98" width="130" height="56" rx="8"/><text class="sT" x="79" y="124" text-anchor="middle">browser + OS</text><text class="sS" x="79" y="140" text-anchor="middle">caches: miss</text>
<rect class="sB" x="262" y="98" width="160" height="56" rx="8"/><text class="sT" x="342" y="124" text-anchor="middle">recursive resolver</text><text class="sS" x="342" y="140" text-anchor="middle">ISP or 1.1.1.1</text>
<rect class="sN" x="560" y="18" width="146" height="50" rx="8"/><text class="sT" x="633" y="41" text-anchor="middle">root servers</text><text class="sS" x="633" y="57" text-anchor="middle">"."</text>
<rect class="sN" x="560" y="101" width="146" height="50" rx="8"/><text class="sT" x="633" y="124" text-anchor="middle">TLD servers</text><text class="sS" x="633" y="140" text-anchor="middle">.example</text>
<rect class="sV" x="560" y="184" width="146" height="50" rx="8"/><text class="sT" x="633" y="207" text-anchor="middle">authoritative</text><text class="sS" x="633" y="223" text-anchor="middle">finsight.example</text>
<line class="sLm" x1="146" y1="118" x2="260" y2="118" marker-end="url(#ahm)"/><line class="sLm" x1="260" y1="134" x2="146" y2="134" marker-end="url(#ahm)"/>
<line class="sLm" x1="424" y1="108" x2="558" y2="50" marker-end="url(#ahm)"/><line class="sLm" x1="558" y1="62" x2="424" y2="120" marker-end="url(#ahm)"/>
<line class="sLm" x1="424" y1="124" x2="558" y2="120" marker-end="url(#ahm)"/><line class="sLm" x1="558" y1="134" x2="424" y2="138" marker-end="url(#ahm)"/>
<line class="sLm" x1="424" y1="140" x2="558" y2="196" marker-end="url(#ahm)"/><line class="sLm" x1="558" y1="210" x2="424" y2="150" marker-end="url(#ahm)"/>
<g data-s="1-1"><text class="sS" x="203" y="92" text-anchor="middle">api.finsight.example?</text><g class="pk" data-s="1"><circle class="sPw" r="5"><animateMotion dur="0.8s" begin="indefinite" fill="freeze" path="M 146 118 L 260 118"/></circle></g></g>
<g data-s="2-2"><text class="sS" x="470" y="62" text-anchor="end">ask root</text><text class="sWt" x="633" y="88" text-anchor="middle">refer: .example NS</text><g class="pk" data-s="2"><circle class="sPw" r="5"><animateMotion dur="0.7s" begin="indefinite" fill="freeze" path="M 424 108 L 558 50"/></circle></g><g class="pk" data-s="2"><circle class="sPw" r="5"><animateMotion dur="0.7s" begin="indefinite" fill="freeze" path="M 558 62 L 424 120"/></circle></g></g>
<g data-s="3-3"><text class="sWt" x="633" y="171" text-anchor="middle">refer: finsight NS</text><g class="pk" data-s="3"><circle class="sPw" r="5"><animateMotion dur="0.7s" begin="indefinite" fill="freeze" path="M 424 124 L 558 120"/></circle></g><g class="pk" data-s="3"><circle class="sPw" r="5"><animateMotion dur="0.7s" begin="indefinite" fill="freeze" path="M 558 134 L 424 138"/></circle></g></g>
<g data-s="4-4"><text class="sGt" x="470" y="196" text-anchor="end">A 203.0.113.10</text><text class="sGt" x="470" y="212" text-anchor="end">TTL 300 s</text><g class="pk" data-s="4"><circle class="sPw" r="5"><animateMotion dur="0.7s" begin="indefinite" fill="freeze" path="M 424 140 L 558 196"/></circle></g><g class="pk" data-s="4"><circle class="sPg" r="5"><animateMotion dur="0.7s" begin="indefinite" fill="freeze" path="M 558 210 L 424 150"/></circle></g></g>
<g data-s="5-5"><text class="sGt" x="203" y="154" text-anchor="middle">203.0.113.10</text><g class="pk" data-s="5"><circle class="sPg" r="5"><animateMotion dur="0.8s" begin="indefinite" fill="freeze" path="M 260 134 L 146 134"/></circle></g><rect class="sG" x="14" y="190" width="410" height="50" rx="8" opacity=".35"/><text class="sS" x="219" y="210" text-anchor="middle">cached at the resolver and the browser for 300 s:</text><text class="sS" x="219" y="228" text-anchor="middle">the next lookups skip root, TLD and authoritative</text></g>
</svg><ol class="dia-steps">
<li>The browser and operating system caches miss, so the stub resolver asks a recursive resolver (your ISP's, or a public one such as 1.1.1.1).</li>
<li>The resolver starts at a root server, which does not know the answer but refers it to the name servers for .example.</li>
<li>The TLD servers refer it to the name servers that are authoritative for finsight.example.</li>
<li>The authoritative server answers with the A record and its TTL.</li>
<li>The answer is cached for the TTL at every level. That cache is why DNS changes are not instant: lower the TTL a day before a move.</li>
</ol><figcaption>Resolving api.finsight.example from cold caches: referrals down the hierarchy, then an answer that is cached for its TTL.</figcaption></figure>

| Record | Maps | Typical use |
|---|---|---|
| **A** | name → IPv4 address | `api.example.com → 203.0.113.10` |
| **AAAA** | name → IPv6 address | The same, for IPv6 |
| **CNAME** | name → another name | `www → example.azurewebsites.net` |
| **MX** | domain → mail servers | Email delivery |
| **TXT** | name → text | Domain verification, SPF and DKIM email records |
| **NS** | zone → its name servers | Delegation |

> [!mistake] "DNS changes are instant"
> They're not. Resolvers keep the old answer until its TTL expires. Before moving a site, lower the TTL a day ahead so the switch propagates quickly.

## S1.3 TCP, UDP and the HTTP versions 🟢 🟡

**TCP** gives a reliable, ordered byte stream: it retransmits lost packets and reorders them. **UDP** just sends datagrams; anything reliable has to be built on top.

| Version | Transport | What changed | Why it matters |
|---|---|---|---|
| **HTTP/1.1** (1997, now RFC 9112) | TCP | Persistent connections (`keep-alive`) | One request at a time per connection, so browsers open about six connections per origin |
| **HTTP/2** (2015, now RFC 9113) | TCP | Binary framing, **multiplexing** many requests on one connection, header compression (HPACK) | Removes most HTTP-level head-of-line blocking; domain sharding and sprite sheets stop being useful |
| **HTTP/3** (2022, RFC 9114) | **QUIC** over UDP | Streams are independent at the transport layer; TLS 1.3 built in; connection migration when your phone switches from Wi-Fi to 4G | A lost packet only stalls its own stream, not every request |

> [!term] Head-of-line blocking
> When one slow or lost item holds up everything queued behind it. HTTP/2 fixed it at the HTTP layer, but on TCP a single lost packet still stalls all streams. HTTP/3 moves to QUIC to fix that too.

<figure class="dia anim" data-rest="4"><svg viewBox="0 0 720 300" role="img" aria-label="Animation: three streams share one connection. One packet of stream C is lost. Over TCP every later packet waits for its resend; over QUIC only stream C waits.">
<circle class="sP" cx="300" cy="16" r="6"/><text class="sS" x="310" y="20">stream A</text><circle class="sPg" cx="380" cy="16" r="6"/><text class="sS" x="390" y="20">stream B</text><circle class="sPw" cx="460" cy="16" r="6"/><text class="sS" x="470" y="20">stream C</text>
<text class="sT" x="20" y="61">HTTP/2 over TCP</text><text class="sS" x="20" y="77">one ordered byte stream for every request</text>
<rect class="sB" x="30" y="81" width="34" height="28" rx="5"/><text class="sC" x="47" y="99" text-anchor="middle">tx</text>
<line class="sD" x1="70" y1="95" x2="520" y2="95"/>
<rect class="sB" x="508" y="79" width="84" height="32" rx="5"/><text class="sC" x="550" y="125" text-anchor="middle">buffer</text>
<rect class="sA" x="604" y="75" width="96" height="40" rx="7"/><text class="sT" x="652" y="100" text-anchor="middle">browser</text>
<g><circle class="sP" r="7"><animateMotion dur="7s" repeatCount="indefinite" calcMode="linear" path="M70 95 H600" keyPoints="0;0;0.8491;0.8491;1;1" keyTimes="0;0;0.2;0.2001;0.25;1"/><animate attributeName="opacity" dur="7s" repeatCount="indefinite" calcMode="discrete" values="0;1;0" keyTimes="0;0;0.25"/></circle></g>
<g><circle class="sPg" r="7"><animateMotion dur="7s" repeatCount="indefinite" calcMode="linear" path="M70 95 H600" keyPoints="0;0;0.8491;0.8491;1;1" keyTimes="0;0.0643;0.2643;0.2644;0.3143;1"/><animate attributeName="opacity" dur="7s" repeatCount="indefinite" calcMode="discrete" values="0;1;0" keyTimes="0;0.0643;0.3143"/></circle></g>
<g><circle class="sPw" r="7"><animateMotion dur="7s" repeatCount="indefinite" calcMode="linear" path="M70 95 H600" keyPoints="0;0;0.434;0.434" keyTimes="0;0.1286;0.2308;1"/><animate attributeName="opacity" dur="7s" repeatCount="indefinite" calcMode="discrete" values="0;1;0" keyTimes="0;0.1286;0.2522"/></circle><text class="sRt" x="300" y="99" text-anchor="middle" opacity="0">✕ lost<animate attributeName="opacity" dur="7s" repeatCount="indefinite" calcMode="discrete" values="0;1;0" keyTimes="0;0.2308;0.4286"/></text></g>
<g><circle class="sP" r="7"><animateMotion dur="7s" repeatCount="indefinite" calcMode="linear" path="M70 95 H600" keyPoints="0;0;0.8491;0.8491;1;1" keyTimes="0;0.1929;0.3929;0.6457;0.6957;1"/><animate attributeName="opacity" dur="7s" repeatCount="indefinite" calcMode="discrete" values="0;1;0" keyTimes="0;0.1929;0.6957"/></circle></g>
<g><circle class="sPg" r="7"><animateMotion dur="7s" repeatCount="indefinite" calcMode="linear" path="M70 95 H600" keyPoints="0;0;0.8491;0.8491;1;1" keyTimes="0;0.2571;0.4571;0.6629;0.7129;1"/><animate attributeName="opacity" dur="7s" repeatCount="indefinite" calcMode="discrete" values="0;1;0" keyTimes="0;0.2571;0.7129"/></circle></g>
<g><circle class="sPw" r="7"><animateMotion dur="7s" repeatCount="indefinite" calcMode="linear" path="M70 95 H600" keyPoints="0;0;0.8491;0.8491;1;1" keyTimes="0;0.4286;0.6286;0.6287;0.6786;1"/><animate attributeName="opacity" dur="7s" repeatCount="indefinite" calcMode="discrete" values="0;1;0" keyTimes="0;0.4286;0.6786"/></circle></g>
<text class="sRt" x="335" y="129" text-anchor="middle" opacity="0">A2 and B2 arrived but wait for C1: head-of-line blocking<animate attributeName="opacity" dur="7s" repeatCount="indefinite" calcMode="discrete" values="0;1;0" keyTimes="0;0.3929;0.6714"/></text>
<text class="sT" x="20" y="191">HTTP/3 over QUIC</text><text class="sS" x="20" y="207">each stream is ordered on its own</text>
<rect class="sB" x="30" y="211" width="34" height="28" rx="5"/><text class="sC" x="47" y="229" text-anchor="middle">tx</text>
<line class="sD" x1="70" y1="225" x2="520" y2="225"/>
<rect class="sB" x="508" y="209" width="84" height="32" rx="5"/><text class="sC" x="550" y="255" text-anchor="middle">buffer</text>
<rect class="sA" x="604" y="205" width="96" height="40" rx="7"/><text class="sT" x="652" y="230" text-anchor="middle">browser</text>
<g><circle class="sP" r="7"><animateMotion dur="7s" repeatCount="indefinite" calcMode="linear" path="M70 225 H600" keyPoints="0;0;0.8491;0.8491;1;1" keyTimes="0;0;0.2;0.2001;0.25;1"/><animate attributeName="opacity" dur="7s" repeatCount="indefinite" calcMode="discrete" values="0;1;0" keyTimes="0;0;0.25"/></circle></g>
<g><circle class="sPg" r="7"><animateMotion dur="7s" repeatCount="indefinite" calcMode="linear" path="M70 225 H600" keyPoints="0;0;0.8491;0.8491;1;1" keyTimes="0;0.0643;0.2643;0.2644;0.3143;1"/><animate attributeName="opacity" dur="7s" repeatCount="indefinite" calcMode="discrete" values="0;1;0" keyTimes="0;0.0643;0.3143"/></circle></g>
<g><circle class="sPw" r="7"><animateMotion dur="7s" repeatCount="indefinite" calcMode="linear" path="M70 225 H600" keyPoints="0;0;0.434;0.434" keyTimes="0;0.1286;0.2308;1"/><animate attributeName="opacity" dur="7s" repeatCount="indefinite" calcMode="discrete" values="0;1;0" keyTimes="0;0.1286;0.2522"/></circle><text class="sRt" x="300" y="229" text-anchor="middle" opacity="0">✕ lost<animate attributeName="opacity" dur="7s" repeatCount="indefinite" calcMode="discrete" values="0;1;0" keyTimes="0;0.2308;0.4286"/></text></g>
<g><circle class="sP" r="7"><animateMotion dur="7s" repeatCount="indefinite" calcMode="linear" path="M70 225 H600" keyPoints="0;0;0.8491;0.8491;1;1" keyTimes="0;0.1929;0.3929;0.393;0.4429;1"/><animate attributeName="opacity" dur="7s" repeatCount="indefinite" calcMode="discrete" values="0;1;0" keyTimes="0;0.1929;0.4429"/></circle></g>
<g><circle class="sPg" r="7"><animateMotion dur="7s" repeatCount="indefinite" calcMode="linear" path="M70 225 H600" keyPoints="0;0;0.8491;0.8491;1;1" keyTimes="0;0.2571;0.4571;0.4573;0.5071;1"/><animate attributeName="opacity" dur="7s" repeatCount="indefinite" calcMode="discrete" values="0;1;0" keyTimes="0;0.2571;0.5071"/></circle></g>
<g><circle class="sPw" r="7"><animateMotion dur="7s" repeatCount="indefinite" calcMode="linear" path="M70 225 H600" keyPoints="0;0;0.8491;0.8491;1;1" keyTimes="0;0.4286;0.6286;0.6287;0.6786;1"/><animate attributeName="opacity" dur="7s" repeatCount="indefinite" calcMode="discrete" values="0;1;0" keyTimes="0;0.4286;0.6786"/></circle></g>
<text class="sGt" x="335" y="259" text-anchor="middle" opacity="0">A2 and B2 are delivered at once; only stream C waits<animate attributeName="opacity" dur="7s" repeatCount="indefinite" calcMode="discrete" values="0;1;0" keyTimes="0;0.3929;0.6714"/></text>
</svg><figcaption>Head-of-line blocking. The same packet of stream C is lost on both connections. TCP must hand bytes to the browser in order, so the packets of streams A and B that arrived after it wait in the buffer; QUIC orders each stream separately, so only C waits for its resend.</figcaption></figure>

> [!say]
> "HTTP/2 multiplexes many requests over one TCP connection; HTTP/3 does the same over QUIC on UDP, so a lost packet only blocks its own stream, and the handshake is faster because TLS 1.3 is built in."

## S1.4 HTTP messages: methods, status codes, headers 🟢 ⭐

A request is a **method**, a **target**, **headers** and an optional **body**. A response is a **status code**, **headers** and an optional **body**. The current definition of HTTP semantics is **RFC 9110** (2022).

<figure class="dia"><svg viewBox="0 0 720 218" role="img" aria-label="An HTTP request with a request line, headers, a blank line and a JSON body, and the matching 201 Created response with a status line, a Location header, a blank line and a body">
<text class="sM" x="14" y="22">request</text><rect class="sB" x="14" y="30" width="250" height="21" rx="3"/><text class="sC" x="22" y="45" xml:space="preserve" style="white-space:pre">POST /api/orders HTTP/1.1</text><rect class="sN" x="14" y="54" width="250" height="21" rx="3"/><text class="sC" x="22" y="69" xml:space="preserve" style="white-space:pre">Host: shop.example.com</text><rect class="sN" x="14" y="78" width="250" height="21" rx="3"/><text class="sC" x="22" y="93" xml:space="preserve" style="white-space:pre">Content-Type: application/json</text><rect class="sN" x="14" y="102" width="250" height="21" rx="3"/><text class="sC" x="22" y="117" xml:space="preserve" style="white-space:pre">Authorization: Bearer eyJhbGci…</text><line class="sD" x1="14" y1="136" x2="264" y2="136"/><rect class="sA" x="14" y="150" width="250" height="21" rx="3"/><text class="sC" x="22" y="165" xml:space="preserve" style="white-space:pre">{"sku": "A-17", "qty": 2}</text>
<text class="sS" x="272" y="45">← method, target, version</text>
<text class="sS" x="272" y="69">← headers, one per line</text>
<text class="sS" x="272" y="141">← blank line ends headers</text>
<text class="sS" x="272" y="165">← body (optional)</text>
<text class="sM" x="456" y="22">response</text><rect class="sG" x="456" y="30" width="250" height="21" rx="3"/><text class="sC" x="464" y="45" xml:space="preserve" style="white-space:pre">HTTP/1.1 201 Created</text><rect class="sN" x="456" y="54" width="250" height="21" rx="3"/><text class="sC" x="464" y="69" xml:space="preserve" style="white-space:pre">Location: /api/orders/981</text><rect class="sN" x="456" y="78" width="250" height="21" rx="3"/><text class="sC" x="464" y="93" xml:space="preserve" style="white-space:pre">Content-Type: application/json</text><line class="sD" x1="456" y1="112" x2="706" y2="112"/><rect class="sA" x="456" y="126" width="250" height="21" rx="3"/><text class="sC" x="464" y="141" xml:space="preserve" style="white-space:pre">{"id": 981, "status": "new"}</text>
<text class="sS" x="581" y="170" text-anchor="middle">← status line, headers,</text><text class="sS" x="581" y="184" text-anchor="middle">blank line, body: same shape</text>
<text class="sS" x="360" y="206" text-anchor="middle">HTTP/1.1 is literally this text over TCP; HTTP/2 and /3 carry the same fields as binary frames</text>
</svg><figcaption>Every HTTP message has the same four parts. HTTP/2 and HTTP/3 change the encoding, not these semantics.</figcaption></figure>

### Methods and their guarantees

> [!term] Safe method
> A method the client asks to have no side effects on the server: `GET`, `HEAD`, `OPTIONS`, `TRACE`. Crawlers and prefetchers assume they can call these freely.

> [!term] Idempotent method
> A method where sending the same request once or ten times leaves the server in the same state. `PUT`, `DELETE` and every safe method are idempotent; `POST` and `PATCH` are not guaranteed to be.

| Method | Meaning | Safe | Idempotent | Body |
|---|---|:-:|:-:|:-:|
| `GET` | Read a representation | ✓ | ✓ | No (ignored) |
| `HEAD` | `GET` without the body | ✓ | ✓ | No |
| `POST` | Process this (usually: create a child resource, or run an action) | ✗ | ✗ | Yes |
| `PUT` | Replace the resource at this URL with this full representation | ✗ | ✓ | Yes |
| `PATCH` | Apply a partial change | ✗ | ✗ (can be made so) | Yes |
| `DELETE` | Remove it | ✗ | ✓ | Rare |
| `OPTIONS` | What can I do here? (used by CORS preflight) | ✓ | ✓ | No |

**Why idempotency matters in practice:** networks fail after the server has acted but before the client hears back. A client can safely **retry** an idempotent request. To make `POST` retry-safe, payment APIs ask for an **`Idempotency-Key`** header and store the result for each key, as covered in [[B4]].

> [!say]
> "PUT replaces the whole resource and is idempotent: sending it twice gives the same state. PATCH sends only the changes and isn't guaranteed idempotent; incrementing a counter is the classic example. POST creates or triggers an action and isn't idempotent, which is why payment APIs use an idempotency key."

### Status codes you must know cold

| Code | Name | When you return it |
|---|---|---|
| **200** | OK | Successful `GET`, or an update that returns the resource |
| **201** | Created | `POST` created something; add a `Location` header with its URL |
| **204** | No Content | Success with no body, typical for `DELETE` |
| **301 / 308** | Moved Permanently / Permanent Redirect | The URL changed for good (308 keeps the method and body) |
| **302 / 307** | Found / Temporary Redirect | Temporary move (307 keeps the method) |
| **304** | Not Modified | The client's cached copy is still valid ([[S1.8]]) |
| **400** | Bad Request | Malformed request, failed validation |
| **401** | Unauthorized | **Not authenticated**: no credentials, or bad ones. Send `WWW-Authenticate` |
| **403** | Forbidden | **Authenticated, but not allowed** |
| **404** | Not Found | No such resource (also used to hide the existence of something you can't see) |
| **405** | Method Not Allowed | `DELETE` on a read-only resource |
| **409** | Conflict | State conflict: duplicate email, or a stale version on update |
| **415** | Unsupported Media Type | Wrong `Content-Type` |
| **422** | Unprocessable Content | Well-formed but semantically invalid; many APIs use 400 instead |
| **429** | Too Many Requests | Rate limited; add `Retry-After` |
| **500** | Internal Server Error | Unhandled failure on your side |
| **502 / 503 / 504** | Bad Gateway / Service Unavailable / Gateway Timeout | A proxy couldn't get a good answer from upstream, the service is down or overloaded, or upstream was too slow |

> [!mistake] 401 versus 403
> The names are historical and confusing. **401 means "who are you?"** (log in). **403 means "I know who you are, and no."** A logged-in accountant calling an admin-only endpoint gets 403, not 401.

<figure class="dia"><svg viewBox="0 0 720 274" role="img" aria-label="A decision chain for client errors: over the rate limit gives 429, malformed request 400, not authenticated 401, not allowed 403, missing resource 404, invalid content 422, state conflict 409, otherwise success">
<rect class="sB" x="40" y="22" width="200" height="24" rx="12"/><text class="sC" x="140" y="38" text-anchor="middle">under the rate limit?</text>
<line class="sLr" x1="240" y1="34" x2="300" y2="34" marker-end="url(#ahr)"/><text class="sRt" x="270" y="30" text-anchor="middle">no</text>
<rect class="sR" x="304" y="22" width="150" height="24" rx="4" opacity=".8"/><text class="sC" x="379" y="38" text-anchor="middle">429 Too Many</text>
<line class="sLg" x1="140" y1="46" x2="140" y2="52"/>
<rect class="sB" x="40" y="52" width="200" height="24" rx="12"/><text class="sC" x="140" y="68" text-anchor="middle">request well-formed?</text>
<line class="sLr" x1="240" y1="64" x2="300" y2="64" marker-end="url(#ahr)"/><text class="sRt" x="270" y="60" text-anchor="middle">no</text>
<rect class="sR" x="304" y="52" width="150" height="24" rx="4" opacity=".8"/><text class="sC" x="379" y="68" text-anchor="middle">400 Bad Request</text>
<line class="sLg" x1="140" y1="76" x2="140" y2="82"/>
<rect class="sB" x="40" y="82" width="200" height="24" rx="12"/><text class="sC" x="140" y="98" text-anchor="middle">authenticated?</text>
<line class="sLr" x1="240" y1="94" x2="300" y2="94" marker-end="url(#ahr)"/><text class="sRt" x="270" y="90" text-anchor="middle">no</text>
<rect class="sR" x="304" y="82" width="150" height="24" rx="4" opacity=".8"/><text class="sC" x="379" y="98" text-anchor="middle">401 Unauthorized</text>
<line class="sLg" x1="140" y1="106" x2="140" y2="112"/>
<rect class="sB" x="40" y="112" width="200" height="24" rx="12"/><text class="sC" x="140" y="128" text-anchor="middle">allowed to do this?</text>
<line class="sLr" x1="240" y1="124" x2="300" y2="124" marker-end="url(#ahr)"/><text class="sRt" x="270" y="120" text-anchor="middle">no</text>
<rect class="sR" x="304" y="112" width="150" height="24" rx="4" opacity=".8"/><text class="sC" x="379" y="128" text-anchor="middle">403 Forbidden</text>
<line class="sLg" x1="140" y1="136" x2="140" y2="142"/>
<rect class="sB" x="40" y="142" width="200" height="24" rx="12"/><text class="sC" x="140" y="158" text-anchor="middle">resource exists?</text>
<line class="sLr" x1="240" y1="154" x2="300" y2="154" marker-end="url(#ahr)"/><text class="sRt" x="270" y="150" text-anchor="middle">no</text>
<rect class="sR" x="304" y="142" width="150" height="24" rx="4" opacity=".8"/><text class="sC" x="379" y="158" text-anchor="middle">404 Not Found</text>
<line class="sLg" x1="140" y1="166" x2="140" y2="172"/>
<rect class="sB" x="40" y="172" width="200" height="24" rx="12"/><text class="sC" x="140" y="188" text-anchor="middle">content valid?</text>
<line class="sLr" x1="240" y1="184" x2="300" y2="184" marker-end="url(#ahr)"/><text class="sRt" x="270" y="180" text-anchor="middle">no</text>
<rect class="sR" x="304" y="172" width="150" height="24" rx="4" opacity=".8"/><text class="sC" x="379" y="188" text-anchor="middle">422 / 400</text>
<line class="sLg" x1="140" y1="196" x2="140" y2="202"/>
<rect class="sB" x="40" y="202" width="200" height="24" rx="12"/><text class="sC" x="140" y="218" text-anchor="middle">no state conflict?</text>
<line class="sLr" x1="240" y1="214" x2="300" y2="214" marker-end="url(#ahr)"/><text class="sRt" x="270" y="210" text-anchor="middle">no</text>
<rect class="sR" x="304" y="202" width="150" height="24" rx="4" opacity=".8"/><text class="sC" x="379" y="218" text-anchor="middle">409 Conflict</text>
<line class="sLg" x1="140" y1="226" x2="140" y2="234" marker-end="url(#ahg)"/><rect class="sG" x="60" y="236" width="160" height="26" rx="13"/><text class="sGt" x="140" y="253" text-anchor="middle">2xx: do it</text>
<rect class="sN" x="490" y="40" width="216" height="132" rx="8"/><text class="sT" x="598" y="62" text-anchor="middle">the order matters</text>
<text class="sS" x="502" y="88">401 before 403: you can't</text><text class="sS" x="502" y="104">be refused before you are known</text>
<text class="sS" x="502" y="130">403 vs 404: return 404 to hide</text><text class="sS" x="502" y="146">what the caller may not see</text>
</svg><figcaption>Picking the 4xx: walk the checks in a typical server order. Rate limiting usually happens first, at the gateway.</figcaption></figure>

### Headers worth knowing

| Header | Direction | Purpose |
|---|---|---|
| `Content-Type` | both | Media type of the body: `application/json`, `text/html; charset=utf-8` |
| `Accept` | request | What the client can handle (content negotiation) |
| `Authorization` | request | Credentials, e.g. `Bearer eyJ...` |
| `Cookie` / `Set-Cookie` | request / response | Send stored cookies / store a cookie |
| `Cache-Control`, `ETag`, `If-None-Match` | both | Caching ([[S1.8]]) |
| `Location` | response | Where the new resource or the redirect target is |
| `Origin` | request | Which origin made a cross-origin request (CORS) |
| `Access-Control-Allow-Origin` | response | CORS permission |
| `Strict-Transport-Security` | response | HSTS: always use HTTPS for this host |
| `Content-Security-Policy` | response | Which scripts, styles and sources the page may load ([[S9]]) |

## S1.5 HTTPS and TLS 🟢 🟡

**HTTPS is HTTP inside TLS.** TLS gives three things: **confidentiality** (encryption), **integrity** (tampering is detected) and **authentication** (you're really talking to `bank.com`).

How the handshake works, in one breath (TLS 1.3, RFC 8446):

1. The client says hello, lists the cipher suites it supports, and sends its share of a key exchange (ECDHE).
2. The server replies with its key share, its **certificate**, and a signature proving it owns the certificate's private key.
3. Both derive the same session keys from the exchange. The client checks the certificate chain up to a **certificate authority (CA)** it trusts, and that the name matches the host.
4. Encrypted HTTP flows. A new connection takes one round trip; resumed sessions can send data immediately (0-RTT), at some replay risk.

<figure class="dia steps"><svg viewBox="0 0 720 420" role="img" aria-label="Sequence diagram: DNS, TCP, TLS and HTTP each cost a round trip before the first byte of a new HTTPS connection">
<text class="sT" x="110" y="28" text-anchor="middle">Browser</text><text class="sT" x="330" y="28" text-anchor="middle">DNS resolver</text><text class="sT" x="590" y="28" text-anchor="middle">Server</text>
<line class="sD" x1="110" y1="40" x2="110" y2="318"/><line class="sD" x1="330" y1="40" x2="330" y2="318"/><line class="sD" x1="590" y1="40" x2="590" y2="318"/>
<line class="sLm" x1="30" y1="60" x2="30" y2="310" marker-end="url(#ahm)"/><text class="sC" x="38" y="318">time</text>
<g data-s="1"><line class="sL" x1="110" y1="70" x2="328" y2="86" marker-end="url(#ah)"/><text class="sC" x="220" y="70" text-anchor="middle">A? api.example.com</text><line class="sL" x1="330" y1="94" x2="112" y2="110" marker-end="url(#ah)"/><text class="sC" x="220" y="122" text-anchor="middle">203.0.113.10</text><path class="sN" d="M640 70 h8 v40 h-8"/><text class="sM" x="654" y="86">DNS</text><text class="sC" x="654" y="100">1 RTT</text></g>
<g class="pk" data-s="1"><circle class="sP" r="5"><animateMotion dur="1.4s" begin="indefinite" fill="freeze" path="M110 70 L330 86 L110 110"/></circle></g>
<g data-s="2"><line class="sL" x1="110" y1="136" x2="588" y2="154" marker-end="url(#ah)"/><text class="sC" x="460" y="140" text-anchor="middle">SYN</text><line class="sL" x1="590" y1="160" x2="112" y2="178" marker-end="url(#ah)"/><text class="sC" x="460" y="184" text-anchor="middle">SYN-ACK</text><path class="sN" d="M640 136 h8 v42 h-8"/><text class="sM" x="654" y="154">TCP</text><text class="sC" x="654" y="168">1 RTT</text></g>
<g class="pk" data-s="2"><circle class="sPw" r="5"><animateMotion dur="1.8s" begin="indefinite" fill="freeze" path="M110 136 L590 154 L110 178"/></circle></g>
<g data-s="3"><line class="sL" x1="110" y1="198" x2="588" y2="216" marker-end="url(#ah)"/><text class="sC" x="430" y="201" text-anchor="middle">ACK + ClientHello (key share)</text><line class="sL" x1="590" y1="222" x2="112" y2="240" marker-end="url(#ah)"/><text class="sC" x="430" y="247" text-anchor="middle">ServerHello, certificate, Finished</text><path class="sN" d="M640 198 h8 v42 h-8"/><text class="sM" x="654" y="216">TLS 1.3</text><text class="sC" x="654" y="230">1 RTT</text></g>
<g class="pk" data-s="3"><circle class="sPv" r="5"><animateMotion dur="1.8s" begin="indefinite" fill="freeze" path="M110 198 L590 216 L110 240"/></circle></g>
<g data-s="4"><line class="sL" x1="110" y1="260" x2="588" y2="278" marker-end="url(#ah)"/><text class="sC" x="430" y="263" text-anchor="middle">Finished + GET /</text><line class="sLg" x1="590" y1="284" x2="112" y2="302" marker-end="url(#ahg)"/><text class="sC" x="430" y="309" text-anchor="middle">200 OK, first bytes of HTML</text><path class="sN" d="M640 260 h8 v42 h-8"/><text class="sM" x="654" y="278">HTTP</text><text class="sC" x="654" y="292">1 RTT</text></g>
<g class="pk" data-s="4"><circle class="sPg" r="5"><animateMotion dur="1.8s" begin="indefinite" fill="freeze" path="M110 260 L590 278 L110 302"/></circle></g>
<g data-s="5"><text class="sS" x="20" y="353">New HTTPS over TCP</text><rect class="sA" x="250" y="340" width="70" height="18" rx="3"/><rect class="sW" x="322" y="340" width="70" height="18" rx="3"/><rect class="sV" x="394" y="340" width="70" height="18" rx="3"/><rect class="sG" x="466" y="340" width="70" height="18" rx="3"/><text class="sC" x="548" y="353">4 RTT ≈ 240 ms at 60 ms</text>
<text class="sS" x="20" y="378">New HTTP/3 (QUIC + TLS together)</text><rect class="sA" x="250" y="365" width="70" height="18" rx="3"/><rect class="sV" x="322" y="365" width="70" height="18" rx="3"/><rect class="sG" x="394" y="365" width="70" height="18" rx="3"/><text class="sC" x="476" y="378">3 RTT</text>
<text class="sS" x="20" y="403">Reused connection (keep-alive)</text><rect class="sG" x="250" y="390" width="70" height="18" rx="3"/><text class="sC" x="332" y="403">1 RTT</text></g>
</svg><ol class="dia-steps">
<li>DNS: one round trip to the resolver, unless the answer is already cached in the browser or the operating system.</li>
<li>TCP's three-way handshake: SYN, SYN-ACK, then the ACK, which leaves together with the next message.</li>
<li>TLS 1.3: the ClientHello carries a key share, so one round trip agrees keys and proves the certificate.</li>
<li>Only now does the HTTP request go out, and the first bytes of HTML come back a round trip later.</li>
<li>That is four round trips for a cold HTTPS request. HTTP/3 merges the transport and TLS handshakes, and a reused connection skips straight to the request.</li>
</ol><figcaption>Round trips before the first byte. Latency, not bandwidth, sets the floor; this is why connection reuse, CDNs and HTTP/3 help.</figcaption></figure>

> [!term] Certificate (X.509)
> A file binding a domain name to a public key, signed by a certificate authority. Browsers trust a built-in list of root CAs, and a server sends the **chain** from its own certificate up to one of them.

> [!term] HSTS
> `Strict-Transport-Security: max-age=31536000; includeSubDomains` tells the browser to use HTTPS for this host for the next year, even if a link says `http://`. It closes the window where an attacker could intercept the first plain-HTTP request.

> [!note] Where TLS ends
> TLS often **terminates** at the load balancer or reverse proxy, and traffic inside the private network is plain HTTP. That's why ASP.NET Core apps behind a proxy need the **forwarded headers** middleware: otherwise the app thinks every request came over `http` from the proxy's IP.

## S1.6 State on a stateless protocol: cookies, sessions, tokens 🟢 ⭐

HTTP is **stateless**: each request stands alone. "Logged in" has to be carried on every request, in one of two ways.

| | Server session + cookie | Token (e.g. JWT) in a header |
|---|---|---|
| What the client holds | An opaque session ID in a cookie | A signed token containing claims |
| Where state lives | Server (memory, Redis, database) | In the token itself |
| Revocation | Easy: delete the session | Hard until it expires, so keep tokens short-lived and use refresh tokens |
| Scaling | Needs a shared session store | Any server with the key can verify it |
| CSRF risk | Yes, because the browser sends cookies automatically | No, if it's sent in a header by your code |
| XSS risk | Low with `HttpOnly` | High if the token sits in `localStorage` |

### Cookie attributes

```http
Set-Cookie: session=abc123; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=3600
```

| Attribute | Effect |
|---|---|
| `Secure` | Only sent over HTTPS |
| `HttpOnly` | JavaScript can't read it (`document.cookie` won't show it), so XSS can't steal it |
| `SameSite=Strict` | Never sent on cross-site requests |
| `SameSite=Lax` | Sent on top-level navigations (clicking a link) but not on cross-site `POST`s, `fetch`es or iframes. Chrome and Edge apply this when no `SameSite` is set |
| `SameSite=None` | Sent everywhere; **requires `Secure`** |
| `Domain`, `Path` | Scope of the cookie |
| `Max-Age` / `Expires` | Lifetime; without either it's a session cookie |

> [!say]
> "For a browser app I prefer the token, or the session ID, in an HttpOnly, Secure, SameSite cookie, so JavaScript can't read it if we ever have an XSS bug. That brings back CSRF risk for cross-site requests, which SameSite mostly handles and anti-forgery tokens cover the rest. A token in localStorage is simpler for cross-domain APIs, but any XSS can steal it."

> [!story]
> FinSight issued a JWT and also supported an **HttpOnly cookie fallback**. That's a good discussion point: say why you added the cookie (to keep the token away from JavaScript), and what it changed (you had to think about SameSite and CORS credentials). The full picture is in [[FS2]].

<figure class="dia"><svg viewBox="0 0 720 228" role="img" aria-label="A matrix of when a cookie is sent: Strict sends it only on same-site requests; Lax also sends it on cross-site link clicks but not on cross-site form posts, fetches or iframes; None with Secure sends it on all of them">
<text class="sT" x="420" y="24" text-anchor="middle">Strict</text>
<text class="sT" x="520" y="24" text-anchor="middle">Lax (default)</text>
<text class="sT" x="620" y="24" text-anchor="middle">None; Secure</text>
<text class="sC" x="360" y="54" text-anchor="end">same-site request</text>
<rect class="sG" x="374" y="36" width="92" height="26" rx="5" opacity=".7"/><text class="sT" x="420" y="54" text-anchor="middle">sent</text>
<rect class="sG" x="474" y="36" width="92" height="26" rx="5" opacity=".7"/><text class="sT" x="520" y="54" text-anchor="middle">sent</text>
<rect class="sG" x="574" y="36" width="92" height="26" rx="5" opacity=".7"/><text class="sT" x="620" y="54" text-anchor="middle">sent</text>
<text class="sC" x="360" y="86" text-anchor="end">click a link from another site (GET)</text>
<rect class="sN" x="374" y="68" width="92" height="26" rx="5"/><text class="sS" x="420" y="86" text-anchor="middle">not sent</text>
<rect class="sG" x="474" y="68" width="92" height="26" rx="5" opacity=".7"/><text class="sT" x="520" y="86" text-anchor="middle">sent</text>
<rect class="sG" x="574" y="68" width="92" height="26" rx="5" opacity=".7"/><text class="sT" x="620" y="86" text-anchor="middle">sent</text>
<text class="sC" x="360" y="118" text-anchor="end">form POST from another site</text>
<rect class="sN" x="374" y="100" width="92" height="26" rx="5"/><text class="sS" x="420" y="118" text-anchor="middle">not sent</text>
<rect class="sN" x="474" y="100" width="92" height="26" rx="5"/><text class="sS" x="520" y="118" text-anchor="middle">not sent</text>
<rect class="sG" x="574" y="100" width="92" height="26" rx="5" opacity=".7"/><text class="sT" x="620" y="118" text-anchor="middle">sent</text>
<text class="sC" x="360" y="150" text-anchor="end">fetch() / XHR from another site</text>
<rect class="sN" x="374" y="132" width="92" height="26" rx="5"/><text class="sS" x="420" y="150" text-anchor="middle">not sent</text>
<rect class="sN" x="474" y="132" width="92" height="26" rx="5"/><text class="sS" x="520" y="150" text-anchor="middle">not sent</text>
<rect class="sG" x="574" y="132" width="92" height="26" rx="5" opacity=".7"/><text class="sT" x="620" y="150" text-anchor="middle">sent</text>
<text class="sC" x="360" y="182" text-anchor="end">your page inside another site's iframe</text>
<rect class="sN" x="374" y="164" width="92" height="26" rx="5"/><text class="sS" x="420" y="182" text-anchor="middle">not sent</text>
<rect class="sN" x="474" y="164" width="92" height="26" rx="5"/><text class="sS" x="520" y="182" text-anchor="middle">not sent</text>
<rect class="sG" x="574" y="164" width="92" height="26" rx="5" opacity=".7"/><text class="sT" x="620" y="182" text-anchor="middle">sent</text>
<text class="sS" x="360" y="216" text-anchor="middle">Lax blocks the cross-site POSTs and fetches that CSRF needs, while links into your site still arrive logged in</text>
</svg><figcaption>SameSite in one table: the attribute decides which cross-site requests carry your session.</figcaption></figure>

### Browser storage at a glance

| Storage | Size (approx.) | Lifetime | Readable by JS | Sent automatically |
|---|---|---|---|---|
| Cookie | ~4 KB each | Set by `Max-Age` | Unless `HttpOnly` | Yes, every matching request |
| `localStorage` | ~5 MB per origin | Until cleared | Yes | No |
| `sessionStorage` | ~5 MB per origin | Until the tab closes | Yes | No |
| IndexedDB | Large (quota-based) | Until cleared | Yes, async | No |

## S1.7 The same-origin policy and CORS 🟢 ⭐

> [!term] Same-origin policy
> The browser rule that a script loaded from one **origin** (scheme + host + port) can't read responses from another origin. `https://app.com` and `https://api.app.com` are different origins; so are `http://localhost:4200` and `http://localhost:5000`.

> [!term] CORS (Cross-Origin Resource Sharing)
> The opt-in mechanism that lets a server tell the browser "this other origin may read my responses", using `Access-Control-Allow-*` response headers. **CORS loosens** the same-origin policy; it is not a security feature you add to an API to protect it.

How it plays out:

- **Simple requests** (`GET`, `HEAD` or `POST` with only basic headers and a form-like content type) go straight through. The browser then checks the response's `Access-Control-Allow-Origin`; if your origin isn't allowed, **the request still happened**, but your JavaScript can't read the response.
- **Preflighted requests**, for anything else (`PUT`, `DELETE`, `Content-Type: application/json`, an `Authorization` header), make the browser first send an `OPTIONS` request asking permission. The server answers with allowed origins, methods and headers, and can let the browser cache that answer with `Access-Control-Max-Age`.
- **With credentials** (cookies), the server must name the exact origin (not `*`) and send `Access-Control-Allow-Credentials: true`, and the client must opt in (`credentials: 'include'` in `fetch`, `withCredentials: true` in Angular's `HttpClient`).

<figure class="dia steps"><svg viewBox="0 0 720 400" role="img" aria-label="Sequence diagram of a CORS preflight: OPTIONS request, permission headers, the real PUT, and the browser's checks">
<text class="sT" x="90" y="28" text-anchor="middle">Your JS (app.com)</text><text class="sT" x="320" y="28" text-anchor="middle">Browser</text><text class="sT" x="610" y="28" text-anchor="middle">API (api.app.com)</text>
<line class="sD" x1="90" y1="40" x2="90" y2="380"/><line class="sD" x1="320" y1="40" x2="320" y2="380"/><line class="sD" x1="610" y1="40" x2="610" y2="380"/>
<g data-s="1"><line class="sL" x1="90" y1="62" x2="318" y2="76" marker-end="url(#ah)"/><text class="sC" x="200" y="60" text-anchor="middle">fetch(url, {method: 'PUT'})</text><text class="sC" x="200" y="92" text-anchor="middle">JSON body + Authorization</text></g>
<g data-s="2"><line class="sLw" x1="320" y1="104" x2="608" y2="118" marker-end="url(#ahw)"/><text class="sC" x="465" y="102" text-anchor="middle">OPTIONS /invoices/7  (preflight)</text><text class="sC" x="465" y="134" text-anchor="middle">Origin: https://app.com</text><text class="sC" x="465" y="148" text-anchor="middle">Access-Control-Request-Method: PUT</text></g>
<g class="pk" data-s="2"><circle class="sPw" r="5"><animateMotion dur="1s" begin="indefinite" fill="freeze" path="M320 104 L610 118"/></circle></g>
<g data-s="3"><line class="sLw" x1="610" y1="166" x2="322" y2="180" marker-end="url(#ahw)"/><text class="sC" x="465" y="164" text-anchor="middle">204 No Content</text><text class="sC" x="465" y="196" text-anchor="middle">Allow-Origin: https://app.com · Allow-Methods: PUT</text><text class="sC" x="465" y="210" text-anchor="middle">Allow-Headers: authorization, content-type · Max-Age: 600</text></g>
<g class="pk" data-s="3"><circle class="sPw" r="5"><animateMotion dur="1s" begin="indefinite" fill="freeze" path="M610 166 L320 180"/></circle></g>
<g data-s="4"><rect class="sG" x="220" y="222" width="200" height="24" rx="6"/><text class="sC" x="320" y="238" text-anchor="middle">allowed ✓ (cached for 600 s)</text><line class="sL" x1="320" y1="258" x2="608" y2="272" marker-end="url(#ah)"/><text class="sC" x="465" y="256" text-anchor="middle">PUT /invoices/7  (the real request)</text></g>
<g class="pk" data-s="4"><circle class="sP" r="5"><animateMotion dur="1s" begin="indefinite" fill="freeze" path="M320 258 L610 272"/></circle></g>
<g data-s="5"><line class="sLg" x1="610" y1="294" x2="322" y2="308" marker-end="url(#ahg)"/><text class="sC" x="465" y="292" text-anchor="middle">200 OK + Access-Control-Allow-Origin: https://app.com</text></g>
<g class="pk" data-s="5"><circle class="sPg" r="5"><animateMotion dur="1s" begin="indefinite" fill="freeze" path="M610 294 L320 308"/></circle></g>
<g data-s="6"><line class="sLg" x1="320" y1="328" x2="92" y2="342" marker-end="url(#ahg)"/><text class="sC" x="205" y="326" text-anchor="middle">response readable ✓</text><text class="sRt" x="20" y="374">Missing or wrong header → your code only sees a network error.</text></g>
</svg><ol class="dia-steps">
<li>Your code calls <code>fetch</code> with <code>PUT</code>, a JSON body and an <code>Authorization</code> header. None of those is "simple", so the browser won't send it yet.</li>
<li>The browser sends a preflight: an <code>OPTIONS</code> request naming your origin, the method and the headers it wants to use. Your code never sees this request.</li>
<li>The API answers with the origins, methods and headers it allows, and how long the browser may remember that answer.</li>
<li>Everything matches, so the browser sends the real <code>PUT</code>. For the next 600 seconds it skips the preflight for requests of the same shape.</li>
<li>The API handles the request and includes <code>Access-Control-Allow-Origin</code> on the real response too.</li>
<li>The browser checks that header once more and only then lets your JavaScript read the response. If any check fails, your code gets a generic network error and the details appear only in the console.</li>
</ol><figcaption>A preflighted CORS request. The browser enforces every check; the server only states its policy.</figcaption></figure>

```csharp
// ASP.NET Core: allow the Angular dev server and production front end
builder.Services.AddCors(o => o.AddPolicy("spa", p => p
    .WithOrigins("http://localhost:4200", "https://app.finsight.example")
    .AllowAnyHeader()
    .AllowAnyMethod()
    .AllowCredentials()));      // needed if the browser sends the auth cookie
// ...
app.UseCors("spa");            // before auth and endpoints
```

> [!mistake] "Postman works, so the API is fine"
> CORS is enforced **by the browser only**. Postman, curl and server-to-server calls ignore it. A CORS error means the API answered but didn't grant this origin permission, so fix the server's policy (or put the API behind the same origin with a proxy), never by disabling security in the browser.

> [!say]
> "Browsers block a page from reading responses from another origin. CORS is how the API opts in, by sending Access-Control-Allow-Origin, and for non-simple requests the browser asks first with an OPTIONS preflight. If you use cookies, the origin has to be explicit and credentials allowed on both sides."

## S1.8 HTTP caching 🟡 ⭐

Caching is the cheapest performance win there is, and interviewers like it because it tests whether you understand freshness.

| Header | Meaning |
|---|---|
| `Cache-Control: max-age=3600` | Fresh for an hour; no need to ask the server |
| `Cache-Control: no-cache` | You may store it, but **revalidate** before every use |
| `Cache-Control: no-store` | Never store it (bank pages, personal data) |
| `Cache-Control: private` / `public` | Only the browser may cache it / shared caches (CDN) may too |
| `Cache-Control: immutable` | It will never change; skip revalidation (fingerprinted assets) |
| `ETag: "v42"` | A version tag for the representation |
| `If-None-Match: "v42"` | "I have v42, is it still current?" The server replies **304 Not Modified** with no body if so |
| `Last-Modified` / `If-Modified-Since` | The same idea using dates |

<figure class="dia steps"><svg viewBox="0 0 720 340" role="img" aria-label="Sequence diagram of HTTP caching: a fresh response is served from cache, a stale one is revalidated with an ETag and answered with 304 or a new 200">
<text class="sT" x="90" y="26" text-anchor="middle">Page</text><text class="sT" x="340" y="26" text-anchor="middle">Browser HTTP cache</text><text class="sT" x="610" y="26" text-anchor="middle">Server</text>
<line class="sD" x1="90" y1="38" x2="90" y2="330"/><line class="sD" x1="340" y1="38" x2="340" y2="330"/><line class="sD" x1="610" y1="38" x2="610" y2="330"/>
<g data-s="1"><text class="sM" x="8" y="62">t = 0</text><line class="sL" x1="90" y1="54" x2="338" y2="62" marker-end="url(#ah)"/><text class="sC" x="215" y="52" text-anchor="middle">GET /api/rates</text><line class="sL" x1="340" y1="68" x2="608" y2="76" marker-end="url(#ah)"/><text class="sC" x="475" y="66" text-anchor="middle">miss → forward</text><line class="sLg" x1="610" y1="84" x2="342" y2="92" marker-end="url(#ahg)"/><text class="sC" x="475" y="106" text-anchor="middle">200 · Cache-Control: max-age=60 · ETag: "v42"</text><line class="sLg" x1="340" y1="96" x2="92" y2="104" marker-end="url(#ahg)"/><rect class="sG" x="255" y="114" width="170" height="22" rx="6"/><text class="sC" x="340" y="129" text-anchor="middle">stored "v42", fresh 60 s</text></g>
<g data-s="2"><text class="sM" x="8" y="166">t = 30 s</text><line class="sL" x1="90" y1="158" x2="338" y2="166" marker-end="url(#ah)"/><line class="sLg" x1="340" y1="172" x2="92" y2="180" marker-end="url(#ahg)"/><text class="sC" x="215" y="196" text-anchor="middle">fresh → served from cache</text><text class="sGt" x="610" y="176" text-anchor="middle">no request at all</text></g>
<g data-s="3"><text class="sM" x="8" y="224">t = 90 s</text><line class="sL" x1="90" y1="216" x2="338" y2="224" marker-end="url(#ah)"/><text class="sC" x="215" y="214" text-anchor="middle">GET /api/rates (stale now)</text><line class="sLw" x1="340" y1="230" x2="608" y2="238" marker-end="url(#ahw)"/><text class="sC" x="475" y="228" text-anchor="middle">If-None-Match: "v42"</text></g>
<g data-s="4"><line class="sLg" x1="610" y1="250" x2="342" y2="258" marker-end="url(#ahg)"/><text class="sC" x="475" y="272" text-anchor="middle">304 Not Modified (no body)</text><line class="sLg" x1="340" y1="262" x2="92" y2="270" marker-end="url(#ahg)"/><text class="sC" x="215" y="286" text-anchor="middle">cached body, fresh for 60 s more</text></g>
<g data-s="5"><line class="sLr" x1="610" y1="300" x2="342" y2="308" marker-end="url(#ahr)"/><text class="sC" x="475" y="322" text-anchor="middle">or, if it changed: 200 · ETag: "v43" · new body</text><line class="sLr" x1="340" y1="312" x2="92" y2="320" marker-end="url(#ahr)"/></g>
</svg><ol class="dia-steps">
<li>First request: the cache misses, so it goes to the server. The response says it stays fresh for 60 seconds and names its version, the ETag.</li>
<li>Thirty seconds later the copy is still fresh, so the browser answers from its cache. Nothing reaches the network.</li>
<li>After 60 seconds the copy is stale. The browser doesn't throw it away; it asks whether version "v42" is still current.</li>
<li>Nothing changed: the server sends 304 with no body, which costs a round trip but almost no bandwidth, and the copy is fresh again.</li>
<li>If the data had changed, the server would send a normal 200 with the new body and a new ETag instead.</li>
</ol><figcaption>Freshness (<code>max-age</code>) decides whether to ask at all; validation (<code>ETag</code> and <code>If-None-Match</code>) makes asking cheap.</figcaption></figure>

**The standard strategy for a single-page app:**

- `index.html` → `Cache-Control: no-cache`, so users always get the newest app shell.
- `main.3f9a1c.js`, `styles.81b2.css` (file name contains a content hash) → `Cache-Control: public, max-age=31536000, immutable`, because a new build gets a new name. This is called **cache busting**.

> [!term] CDN (Content Delivery Network)
> A network of servers close to users that cache and serve your static (and sometimes dynamic) content. It cuts latency and absorbs traffic spikes. Examples: Cloudflare, Azure Front Door, Amazon CloudFront.

## S1.9 Ways a client and server talk 🟢 🟡

| Style | Shape | Good for | Watch out for |
|---|---|---|---|
| **REST over HTTP** | Resources + methods + status codes | Most CRUD and public APIs | Over- or under-fetching on complex screens |
| **RPC (gRPC)** | Call a function; Protocol Buffers over HTTP/2 | Fast service-to-service calls, streaming | Browsers need gRPC-Web or a gateway |
| **GraphQL** | One endpoint; the client asks for exactly the fields it needs | Many screens with different data needs, mobile apps | Caching, N+1 queries on the server, query cost limits |
| **WebSockets** | Full-duplex connection kept open | Chat, live dashboards, collaborative editing | Scaling sticky connections; reconnect logic |
| **Server-Sent Events (SSE)** | Server pushes text events over one HTTP response | Notifications, progress, streaming LLM tokens | One direction only |
| **Polling / long polling** | Client asks repeatedly | Simple, works everywhere | Wasteful at scale |

> [!story]
> FinSight used **SignalR**, which picks WebSockets when available and falls back to SSE or long polling. That's the right answer to "how did you push updates to the dashboard?", and to "what happens on a network that blocks WebSockets?".

## S1.10 What the browser does with the response 🟢

1. **Parse HTML → DOM**, incrementally, as bytes arrive.
2. **Parse CSS → CSSOM.** CSS is **render-blocking**: nothing paints until the CSS needed for the page is loaded.
3. **Scripts.** A plain `<script>` blocks parsing while it downloads and runs. `defer` downloads in parallel and runs after parsing, in order. `async` downloads in parallel and runs as soon as it arrives, in any order. `type="module"` scripts are deferred by default.
4. **Render tree → layout** (sizes and positions) **→ paint → composite** (layers combined by the GPU).
5. JavaScript that changes layout properties (`width`, `top`) forces layout again; changing `transform` or `opacity` can often be done by the compositor alone, which is why animations should use them.

The performance side of this is [[F9]].

## S1.11 Interview drill 🟢 ⭐

| Question | Strong short answer |
|---|---|
| What happens when you type a URL and press Enter? | Cache and HSTS check, DNS lookup, TCP (or QUIC) connection, TLS handshake, HTTP request, the server handles it behind a load balancer, response with status, headers and body, then the browser parses, fetches subresources, lays out and paints. |
| Difference between PUT and PATCH? | PUT replaces the whole resource and is idempotent; PATCH applies a partial change and isn't guaranteed to be idempotent. |
| Which HTTP methods are idempotent? | GET, HEAD, OPTIONS, PUT and DELETE. POST and PATCH aren't guaranteed to be. |
| 401 vs 403? | 401: not authenticated (log in). 403: authenticated but not permitted. |
| What does 304 mean? | Not Modified: the client's cached copy, identified by ETag or date, is still valid, so no body is sent. |
| Why does CORS exist? | The same-origin policy stops scripts reading other origins' responses; CORS lets a server explicitly allow specific origins to read them. |
| When does the browser send a preflight? | For non-simple requests: methods other than GET, HEAD or POST, custom headers such as Authorization, or a JSON content type. It sends OPTIONS first and checks the Access-Control-Allow-* headers. |
| Is CORS a protection for my API? | No. It only controls what browsers let pages read. Non-browser clients ignore it; protect the API with authentication and authorisation. |
| What do HttpOnly, Secure and SameSite do? | HttpOnly hides the cookie from JavaScript; Secure sends it only over HTTPS; SameSite controls whether it's sent on cross-site requests, which mitigates CSRF. |
| Cookie session vs JWT? | Sessions keep state on the server and are easy to revoke; JWTs carry signed claims and scale without shared state but are hard to revoke, so keep them short-lived. |
| HTTP/2 vs HTTP/3? | Both multiplex requests on one connection; HTTP/3 runs on QUIC over UDP, so packet loss only blocks one stream, and setup is faster. |
| How do you cache a single-page app correctly? | `no-cache` on index.html; long `max-age` with `immutable` on hashed asset files, so a new deploy changes the file names. |
| What does TLS give you? | Encryption, integrity and server authentication via a certificate chain to a trusted CA. |
| What is a CDN? | Geographically distributed caches that serve content close to users, cutting latency and load on your origin. |
| `async` vs `defer` on a script? | Both download in parallel; `defer` runs after parsing, in order, while `async` runs as soon as it's downloaded, in any order. |

## Key takeaways

> [!check]
> - Tell "type a URL" as seven beats: cache, DNS, connection, TLS, request, server, render.
> - Safe means no side effects; idempotent means repeating is harmless. Retries depend on it.
> - 401 is "who are you", 403 is "no".
> - CORS is the browser asking the server for permission to let a page read a response. Fix it on the server.
> - HttpOnly + Secure + SameSite cookies are the default answer for browser auth.
> - Hash your asset file names and cache them forever; never cache `index.html` for long.

## Sources

- IETF [RFC 9110 — HTTP Semantics](https://www.rfc-editor.org/rfc/rfc9110) (methods, safety, idempotency, status codes), [RFC 9113 — HTTP/2](https://www.rfc-editor.org/rfc/rfc9113), [RFC 9114 — HTTP/3](https://www.rfc-editor.org/rfc/rfc9114), [RFC 8446 — TLS 1.3](https://www.rfc-editor.org/rfc/rfc8446), [RFC 6265 — HTTP cookies](https://www.rfc-editor.org/rfc/rfc6265).
- MDN: [CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS), [HTTP caching](https://developer.mozilla.org/en-US/docs/Web/HTTP/Caching), [Set-Cookie and SameSite](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie), [HTTP status codes](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status).
- Microsoft Learn: [Enable CORS in ASP.NET Core](https://learn.microsoft.com/en-us/aspnet/core/security/cors), [Configure ASP.NET Core to work with proxy servers and load balancers](https://learn.microsoft.com/en-us/aspnet/core/host-and-deploy/proxy-load-balancer).
- web.dev: [How browsers work (critical rendering path)](https://web.dev/articles/critical-rendering-path).
