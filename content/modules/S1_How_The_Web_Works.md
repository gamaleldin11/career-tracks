# How the Web Works — URLs, DNS, HTTP, TLS, Cookies, CORS and Caching

Every frontend, backend and full-stack interview assumes this module. It is also where "explain your project" questions go when the interviewer wants to see whether you understand what happens *between* your Angular app and your ASP.NET Core API.

> [!focus]
> **Entry must:** walk through "what happens when I type a URL" without gaps; say which HTTP methods are safe and idempotent; know the main status codes by heart; explain cookies versus tokens at a basic level; explain why CORS exists.
> **Mid adds:** HTTP/2 and HTTP/3 differences, TLS handshake shape, cache headers and ETags, preflight requests, SameSite.
> **Most asked:** *What happens when you type a URL and press Enter?* · *PUT vs PATCH vs POST?* · *401 vs 403?* · *What is CORS and how do you fix a CORS error?* · *Where should a JWT live in the browser?*
> **Time budget:** 2–3 hours.

## S1.1 What happens when you type a URL and press Enter 🟢 ⭐

This is the single most common opening question in web interviews, because a good answer touches every layer. Tell it as a story with seven beats.

<figure class="dia"><svg viewBox="0 0 720 300" role="img" aria-label="Request path from browser through DNS, TCP and TLS to the server and back">
<rect class="sA" x="20" y="120" width="110" height="56" rx="8"/><text class="sT" x="75" y="144" text-anchor="middle">Browser</text><text class="sS" x="75" y="162" text-anchor="middle">parse URL, cache?</text>
<rect class="sB" x="190" y="20" width="130" height="50" rx="8"/><text class="sT" x="255" y="42" text-anchor="middle">DNS resolver</text><text class="sS" x="255" y="59" text-anchor="middle">name → IP</text>
<rect class="sB" x="190" y="230" width="130" height="50" rx="8"/><text class="sT" x="255" y="252" text-anchor="middle">CDN / proxy</text><text class="sS" x="255" y="269" text-anchor="middle">may answer from cache</text>
<rect class="sA" x="400" y="120" width="130" height="56" rx="8"/><text class="sT" x="465" y="144" text-anchor="middle">Load balancer</text><text class="sS" x="465" y="162" text-anchor="middle">TLS often ends here</text>
<rect class="sG" x="590" y="80" width="110" height="46" rx="8"/><text class="sT" x="645" y="108" text-anchor="middle">App server</text>
<rect class="sG" x="590" y="170" width="110" height="46" rx="8"/><text class="sT" x="645" y="198" text-anchor="middle">Database</text>
<line class="sL" x1="130" y1="135" x2="190" y2="55"/><text class="sM" x="120" y="88">① DNS</text>
<line class="sL" x1="130" y1="150" x2="400" y2="150"/><text class="sM" x="200" y="142">② TCP/QUIC  ③ TLS  ④ HTTP request</text>
<line class="sD" x1="130" y1="165" x2="190" y2="245"/>
<line class="sL" x1="530" y1="140" x2="590" y2="105"/><line class="sL" x1="645" y1="126" x2="645" y2="170"/><text class="sM" x="655" y="152">⑤</text>
<text class="sM" x="250" y="185">⑥ response ← status, headers, body</text>
<text class="sM" x="20" y="210">⑦ parse, fetch assets, render</text>
</svg><figcaption>The seven beats. A CDN or proxy may answer from its cache before the request ever reaches your server.</figcaption></figure>

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

> [!say]
> "HTTP/2 multiplexes many requests over one TCP connection; HTTP/3 does the same over QUIC on UDP, so a lost packet only blocks its own stream, and the handshake is faster because TLS 1.3 is built in."

## S1.4 HTTP messages: methods, status codes, headers 🟢 ⭐

A request is a **method**, a **target**, **headers** and an optional **body**. A response is a **status code**, **headers** and an optional **body**. The current definition of HTTP semantics is **RFC 9110** (2022).

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
