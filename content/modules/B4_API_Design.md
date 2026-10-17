# API Design — REST Done Well, Pagination, Idempotency, Versioning, gRPC and GraphQL

Building an endpoint is easy; designing an API that other teams, mobile apps and your future self can rely on for years is the skill interviewers test. Questions here are open-ended, such as "design the API for invoices and payments", so a clear set of conventions and the reasons behind them carries you through.

> [!focus]
> **Entry must:** resource-oriented URLs, the right method and status code, consistent JSON shapes, pagination and filtering, error format, basic versioning.
> **Mid adds:** cursor (keyset) pagination, idempotency keys, optimistic concurrency with ETags, long-running operations, webhooks, backward compatibility and deprecation, choosing REST vs gRPC vs GraphQL.
> **Most asked:** *What makes an API RESTful?* · *How do you paginate?* · *How do you version an API?* · *How do you make POST safe to retry?* · *How do you stop two users overwriting each other's changes?* · *REST vs GraphQL vs gRPC?*
> **Time budget:** 3 hours.

## B4.0 Foundations: what an API contract is 🟢

An **API** (application programming interface) is how one program uses another. For a web API, the **contract** is everything a client relies on: the URLs and methods, the request and response shapes, the status codes and error format, authentication, limits and versions.

<figure class="dia"><svg viewBox="0 0 720 238" role="img" aria-label="Several consumers with their own release schedules depend on one API contract; the implementation behind it can change freely">
<rect class="sB" x="16" y="24" width="170" height="50" rx="8"/><text class="sT" x="101" y="47" text-anchor="middle">Angular app</text><text class="sC" x="101" y="63" text-anchor="middle">deploys with you</text>
<line class="sLm" x1="186" y1="49" x2="256" y2="115" marker-end="url(#ahm)"/>
<rect class="sB" x="16" y="90" width="170" height="50" rx="8"/><text class="sT" x="101" y="113" text-anchor="middle">Android app v3.2</text><text class="sC" x="101" y="129" text-anchor="middle">users update… eventually</text>
<line class="sLm" x1="186" y1="115" x2="256" y2="115" marker-end="url(#ahm)"/>
<rect class="sB" x="16" y="156" width="170" height="50" rx="8"/><text class="sT" x="101" y="179" text-anchor="middle">partner ERP</text><text class="sC" x="101" y="195" text-anchor="middle">their own schedule</text>
<line class="sLm" x1="186" y1="181" x2="256" y2="115" marker-end="url(#ahm)"/>
<rect class="sV" x="260" y="30" width="200" height="170" rx="12"/><text class="sT" x="360" y="54" text-anchor="middle">the contract</text>
<text class="sC" x="360" y="82" text-anchor="middle">URLs and methods</text>
<text class="sC" x="360" y="104" text-anchor="middle">request / response shapes</text>
<text class="sC" x="360" y="126" text-anchor="middle">status codes, error format</text>
<text class="sC" x="360" y="148" text-anchor="middle">auth, limits, versions</text>
<text class="sM" x="360" y="184" text-anchor="middle">written down: OpenAPI</text>
<line class="sLm" x1="460" y1="115" x2="530" y2="115" marker-end="url(#ahm)"/><rect class="sA" x="534" y="88" width="170" height="54" rx="8"/><text class="sT" x="619" y="113" text-anchor="middle">your API</text><text class="sC" x="619" y="129" text-anchor="middle">free to change inside</text>
<text class="sS" x="360" y="226" text-anchor="middle">you can change anything behind the contract; changing the contract breaks people you can't see</text>
</svg><figcaption>An API is a promise to consumers you don't control. The implementation is yours; the contract is shared.</figcaption></figure>

Three facts shape every rule in this module:

- **You don't control your consumers.** A mobile app version stays installed for months; a partner's integration changes on their schedule. Anything you remove or rename breaks someone you may not know exists.
- **The network is between you.** Every call can be slow, fail half-way or be retried, so the contract must say what's safe to repeat ([[B4.4]]).
- **JSON is the common language, and it has gaps.** It has only strings, numbers, booleans, null, arrays and objects: no dates and no decimal type. Conventions fill the gaps: ISO 8601 strings for dates, decimal strings or integer minor units for money, strings for enums ([[B4.2]]).

**Resource and representation.** The *resource* is the thing (invoice 7); a *representation* is one way of showing it (JSON today, maybe CSV or PDF tomorrow). Clients work with representations; the resource lives on the server.

## B4.1 What REST actually means 🟢 ⭐

REST (Roy Fielding, 2000) is an architectural style. In practice, "RESTful" HTTP APIs mean:

- **Resources** identified by URLs (`/invoices/7`), manipulated through **representations** (JSON).
- A **uniform interface:** standard methods with their standard meanings (GET reads, POST creates, PUT replaces, PATCH updates, DELETE removes) and standard status codes ([[S1.4]]).
- **Stateless** requests: each carries everything needed (credentials, parameters); the server keeps no client session between calls, which is what lets you scale horizontally.
- **Cacheable** responses, marked as such.
- (Rarely practised) **HATEOAS:** responses include links to related actions.

> [!term] Richardson Maturity Model
> A scale for HTTP APIs. Level 0: one endpoint and RPC over POST. Level 1: separate resources. Level 2: proper HTTP methods and status codes. Level 3: hypermedia links (HATEOAS). Most good real-world APIs sit at **level 2**.

## B4.2 URLs and methods 🟢 ⭐

| Action | Method and URL | Success |
|---|---|---|
| List invoices | `GET /api/v1/invoices?status=overdue&page[size]=20` | 200 |
| Get one | `GET /api/v1/invoices/{id}` | 200, or 404 |
| Create | `POST /api/v1/invoices` | **201** + `Location: /api/v1/invoices/{id}` |
| Replace | `PUT /api/v1/invoices/{id}` | 200 or 204 |
| Partial update | `PATCH /api/v1/invoices/{id}` | 200 or 204 |
| Delete | `DELETE /api/v1/invoices/{id}` | 204 (and 204 or 404 on repeat) |
| Sub-collection | `GET /api/v1/customers/{id}/invoices` | 200 |
| A domain **action** that isn't CRUD | `POST /api/v1/invoices/{id}/payments` (create a payment), or `POST /api/v1/invoices/{id}:send` | 201 or 202 |

**Conventions:** plural nouns; lowercase with hyphens (`/credit-notes`); nest at most one level (`/customers/{id}/invoices`, not deeper); verbs only for genuine actions that don't map to CRUD; filters, sorting and paging in the **query string**; IDs that don't leak information (GUIDs, or encoded IDs, rather than guessable sequences for public APIs).

**JSON shapes:** consistent casing (`camelCase` is the .NET and JavaScript default), ISO 8601 dates in UTC (`"2026-10-03T09:30:00Z"`), money as a decimal string or integer minor units plus a currency code (never a float), and enums as **strings** (`"overdue"`), not numbers, so they survive reordering.

<figure class="dia"><svg viewBox="0 0 720 264" role="img" aria-label="REST methods on an invoices resource and their usual status codes: GET a list or one invoice returns 200 or 404, POST creates and returns 201 with a Location header, PUT replaces and PATCH updates returning 200 or 204, DELETE returns 204, and a non-CRUD action is a POST to a sub-resource such as payments returning 201 or 202">
<text class="sM" x="14" y="20">nouns in the URL, verbs in the method, outcome in the status code</text>
<rect class="sB" x="14" y="30" width="70" height="24" rx="4"/><text class="sT" x="49" y="47" text-anchor="middle">GET</text><text class="sC" x="96" y="47" xml:space="preserve" style="white-space:pre">/api/v1/invoices</text><text class="sS" x="706" y="47" text-anchor="end">200 list</text>
<rect class="sB" x="14" y="60" width="70" height="24" rx="4"/><text class="sT" x="49" y="77" text-anchor="middle">GET</text><text class="sC" x="96" y="77" xml:space="preserve" style="white-space:pre">/api/v1/invoices/{id}</text><text class="sS" x="706" y="77" text-anchor="end">200 or 404</text>
<rect class="sG" x="14" y="90" width="70" height="24" rx="4"/><text class="sT" x="49" y="107" text-anchor="middle">POST</text><text class="sC" x="96" y="107" xml:space="preserve" style="white-space:pre">/api/v1/invoices</text><text class="sS" x="706" y="107" text-anchor="end">201 + Location</text>
<rect class="sA" x="14" y="120" width="70" height="24" rx="4"/><text class="sT" x="49" y="137" text-anchor="middle">PUT</text><text class="sC" x="96" y="137" xml:space="preserve" style="white-space:pre">/api/v1/invoices/{id}</text><text class="sS" x="706" y="137" text-anchor="end">200 / 204 (replace)</text>
<rect class="sA" x="14" y="150" width="70" height="24" rx="4"/><text class="sT" x="49" y="167" text-anchor="middle">PATCH</text><text class="sC" x="96" y="167" xml:space="preserve" style="white-space:pre">/api/v1/invoices/{id}</text><text class="sS" x="706" y="167" text-anchor="end">200 / 204 (partial)</text>
<rect class="sR" x="14" y="180" width="70" height="24" rx="4"/><text class="sT" x="49" y="197" text-anchor="middle">DELETE</text><text class="sC" x="96" y="197" xml:space="preserve" style="white-space:pre">/api/v1/invoices/{id}</text><text class="sS" x="706" y="197" text-anchor="end">204, again: 204/404</text>
<rect class="sV" x="14" y="210" width="70" height="24" rx="4"/><text class="sT" x="49" y="227" text-anchor="middle">POST</text><text class="sC" x="96" y="227" xml:space="preserve" style="white-space:pre">/api/v1/invoices/{id}/payments</text><text class="sS" x="706" y="227" text-anchor="end">201 or 202</text>
<text class="sS" x="360" y="254" text-anchor="middle">safe (no change): GET · idempotent (repeat = same result): GET, PUT, DELETE · neither: POST</text>
</svg><figcaption>Idempotency is the property that matters for retries: a client can safely resend a PUT or DELETE, but a repeated POST needs an idempotency key.</figcaption></figure>

## B4.3 Pagination, filtering and sorting 🟢 🟡 ⭐

| | Offset (`?page=3&pageSize=20`) | Cursor / keyset (`?after=eyJkdWUiOi…&limit=20`) |
|---|---|---|
| SQL | `ORDER BY due_date, id OFFSET 40 ROWS FETCH NEXT 20` | `WHERE (due_date, id) > (@lastDue, @lastId) ORDER BY due_date, id FETCH FIRST 20` |
| Jump to page N | Yes | No (next and previous only) |
| Performance on deep pages | **Degrades**: the database still reads and discards all skipped rows | **Constant**: an index seek to the cursor |
| Stability when rows are inserted or deleted | Items can be **skipped or duplicated** between pages | Stable |
| Total count | Usually provided (an extra `COUNT(*)`, which is expensive on big tables) | Usually not |
| Fits | Admin tables, small data sets, numbered pages | Feeds, infinite scroll, large tables, exports, sync |

```json
{
  "items": [ { "id": "…", "customer": "Nile Foods", "amount": "900.00", "currency": "EGP", "status": "overdue" } ],
  "nextCursor": "eyJkdWUiOiIyMDI2LTEwLTAxIiwiaWQiOiI3In0",
  "hasMore": true
}
```

The cursor is an **opaque**, encoded position (the last row's sort key and ID). Clients pass it back; they never construct it. **Always cap** the page size on the server.

<figure class="dia anim"><svg viewBox="0 0 720 172" role="img" aria-label="Animation: OFFSET pagination makes the database read and discard ten thousand rows to return page 501; keyset pagination seeks directly to the cursor through the index">
<text class="sT" x="20" y="22">rows the database reads to return page 501 (20 rows each)</text>
<text class="sM" x="160" y="58" text-anchor="end">OFFSET 10000</text><rect class="sR" x="170" y="44" width="520" height="22" rx="3" opacity=".55"/><text class="sC" x="430" y="59" text-anchor="middle">read and thrown away: 10,000 rows</text><rect class="sG" x="688" y="44" width="12" height="22" rx="2"/>
<text class="sM" x="160" y="108" text-anchor="end">keyset (after cursor)</text><path class="sLg" d="M170.0 105 C326.0 80 534.0 80 686.0 100" marker-end="url(#ahg)"/><rect class="sG" x="688" y="94" width="12" height="22" rx="2"/><text class="sGt" x="430" y="130" text-anchor="middle">index seek straight to (dueDate, id) &gt; cursor, then read 20</text>
<text class="sS" x="360" y="160" text-anchor="middle">page 1 costs the same either way; page 501 costs 500× more with OFFSET</text>
<circle class="sPr" r="4" opacity="0"><animateMotion dur="9s" repeatCount="indefinite" calcMode="linear" keyPoints="0;0;1;1" keyTimes="0;0.000;0.800;1" path="M170 72 L688 72"/><animate attributeName="opacity" dur="9s" repeatCount="indefinite" values="0;0;1;1;0;0" keyTimes="0;0.000;0.002;0.800;0.802;1"/></circle>
<circle class="sPg" r="4" opacity="0"><animateMotion dur="9s" repeatCount="indefinite" calcMode="linear" keyPoints="0;0;1;1" keyTimes="0;0.000;0.120;1" path="M170.0 105 C326.0 80 534.0 80 686.0 100"/><animate attributeName="opacity" dur="9s" repeatCount="indefinite" values="0;0;1;1;0;0" keyTimes="0;0.000;0.002;0.120;0.122;1"/></circle>
</svg><figcaption>Why deep offset pages get slow and keyset pages don't.</figcaption></figure>

> [!say]
> "Offset pagination is simple and supports page numbers, but deep pages get slow because the database still walks the skipped rows, and inserts shift items between pages. For large or changing data I use keyset pagination: the cursor encodes the last row's sort key and ID, and the next query seeks past it using an index, so every page costs the same."

**Filtering and sorting:** `?status=overdue&customerId=…&dueBefore=2026-11-01&sort=-dueDate,customer`. **Allow-list** the sortable and filterable fields: never pass user input into dynamic SQL ([[S9.3]]).

## B4.4 Idempotency and safe retries 🟡 ⭐

Networks fail **after** the server acted but **before** the client heard back. The client retries, and without care a customer is charged twice.

- `GET`, `PUT` and `DELETE` are idempotent by definition, so they're safe to retry.
- Make `POST` retry-safe with an **idempotency key**:

```http
POST /api/v1/payments
Idempotency-Key: 6f1c2a1e-8b1d-4c1e-9a77-2f3b5a0d9c41
Content-Type: application/json

{ "invoiceId": "…", "amount": "900.00", "currency": "EGP" }
```

The server stores `(key, request hash, response)` for a while, typically 24 hours. A repeat with the same key **returns the stored response** without charging again; the same key with a *different* body returns 422 or 409. Stripe popularised this design, and an IETF draft standardises the `Idempotency-Key` header.

```csharp
// Simplified: the unique index on Key makes concurrent duplicates fail safely
var existing = await db.IdempotencyRecords.FindAsync([key], ct);
if (existing is not null)
    return existing.RequestHash == hash ? Results.Content(existing.ResponseJson, "application/json", statusCode: existing.Status)
                                        : Results.Problem(statusCode: 422, title: "Idempotency key reused with a different request");
```

> [!story]
> Your template library includes **Paymob, Fawry, Kashier and Stripe** integration guides. Payment callbacks and webhooks arrive more than once, and out of order. A strong answer: "I process each payment notification idempotently, keyed by the provider's transaction ID, so a duplicate callback can't mark an order paid twice or ship it twice."

<figure class="dia anim"><svg viewBox="0 0 720 224" role="img" aria-label="Animation: an idempotency key: the client posts a payment with key 6f1c, the API stores the key and charges the card, but the response is lost; the client retries with the same key, the API finds the key and returns the stored result, so the customer is charged once">
<text class="sT" x="100" y="22" text-anchor="middle">client</text>
<line class="sD" x1="100" y1="30" x2="100" y2="226"/>
<text class="sT" x="360" y="22" text-anchor="middle">API</text>
<line class="sD" x1="360" y1="30" x2="360" y2="226"/>
<text class="sT" x="620" y="22" text-anchor="middle">keys table</text>
<line class="sD" x1="620" y1="30" x2="620" y2="226"/>
<line class="sLm" x1="100" y1="50" x2="356" y2="56" marker-end="url(#ahm)"/>
<text class="sC" x="230" y="46" text-anchor="middle">POST /payments  key 6f1c…</text>
<line class="sLm" x1="364" y1="66" x2="616" y2="70" marker-end="url(#ahm)"/>
<text class="sC" x="490" y="62" text-anchor="middle">store key + charge</text>
<line class="sLr" x1="356" y1="90" x2="180" y2="98"/>
<text class="sRt" x="270" y="86" text-anchor="middle">response lost</text>
<rect class="sR" x="160" y="92" width="22" height="16" rx="3" opacity=".8"/>
<line class="sLw" x1="100" y1="130" x2="356" y2="136" marker-end="url(#ahw)"/>
<text class="sWt" x="230" y="126" text-anchor="middle">retry, same key 6f1c…</text>
<line class="sLm" x1="364" y1="146" x2="616" y2="150" marker-end="url(#ahm)"/>
<text class="sC" x="490" y="142" text-anchor="middle">key seen: stored result</text>
<line class="sLg" x1="356" y1="176" x2="104" y2="184" marker-end="url(#ahg)"/>
<text class="sGt" x="230" y="172" text-anchor="middle">201, the original payment</text>
<text class="sS" x="360" y="214" text-anchor="middle">charged once: the server remembers keys for a day and replays the first result</text>
<circle class="sP" r="4" opacity="0"><animateMotion dur="12s" repeatCount="indefinite" calcMode="linear" keyPoints="0;0;1;1" keyTimes="0;0.000;0.100;1" path="M100 50 L356 56"/><animate attributeName="opacity" dur="12s" repeatCount="indefinite" values="0;0;1;1;0;0" keyTimes="0;0.000;0.002;0.100;0.102;1"/></circle>
<circle class="sP" r="4" opacity="0"><animateMotion dur="12s" repeatCount="indefinite" calcMode="linear" keyPoints="0;0;1;1" keyTimes="0;0.120;0.220;1" path="M364 66 L616 70"/><animate attributeName="opacity" dur="12s" repeatCount="indefinite" values="0;0;1;1;0;0" keyTimes="0;0.118;0.122;0.220;0.222;1"/></circle>
<circle class="sPr" r="4" opacity="0"><animateMotion dur="12s" repeatCount="indefinite" calcMode="linear" keyPoints="0;0;1;1" keyTimes="0;0.260;0.340;1" path="M356 90 L180 98"/><animate attributeName="opacity" dur="12s" repeatCount="indefinite" values="0;0;1;1;0;0" keyTimes="0;0.258;0.262;0.340;0.342;1"/></circle>
<circle class="sPw" r="4" opacity="0"><animateMotion dur="12s" repeatCount="indefinite" calcMode="linear" keyPoints="0;0;1;1" keyTimes="0;0.440;0.540;1" path="M100 130 L356 136"/><animate attributeName="opacity" dur="12s" repeatCount="indefinite" values="0;0;1;1;0;0" keyTimes="0;0.438;0.442;0.540;0.542;1"/></circle>
<circle class="sPw" r="4" opacity="0"><animateMotion dur="12s" repeatCount="indefinite" calcMode="linear" keyPoints="0;0;1;1" keyTimes="0;0.560;0.660;1" path="M364 146 L616 150"/><animate attributeName="opacity" dur="12s" repeatCount="indefinite" values="0;0;1;1;0;0" keyTimes="0;0.558;0.562;0.660;0.662;1"/></circle>
<circle class="sPg" r="4" opacity="0"><animateMotion dur="12s" repeatCount="indefinite" calcMode="linear" keyPoints="0;0;1;1" keyTimes="0;0.720;0.840;1" path="M356 176 L104 184"/><animate attributeName="opacity" dur="12s" repeatCount="indefinite" values="0;0;1;1;0;0" keyTimes="0;0.718;0.722;0.840;0.842;1"/></circle>
</svg><figcaption>Same key and same body: replay the stored response. Same key with a different body: reject it with 422, it is a client bug.</figcaption></figure>

## B4.5 Concurrency: lost updates 🟡 ⭐

Two accountants open invoice 7. Both edit and save. Without protection, the second save silently overwrites the first, a **lost update**.

**Optimistic concurrency:** each resource has a version, and an update must say which version it's based on.

```http
GET /api/v1/invoices/7          →  200, ETag: "AAAAAAAAB9E="
PUT /api/v1/invoices/7
If-Match: "AAAAAAAAB9E="        →  204 if unchanged; 412 Precondition Failed if someone else saved first
```

In EF Core, a `rowversion` column (SQL Server) or an `xmin`/version column (PostgreSQL) marked as a **concurrency token** makes `SaveChanges` include it in the `WHERE` clause and throw `DbUpdateConcurrencyException` when no row matched ([[B5]]). The API maps that to **409 Conflict** or **412**, and the UI asks the user to reload or merge.

**Pessimistic concurrency** (locking the row while someone edits) is rarely right for web apps: users leave tabs open for hours.

<figure class="dia steps"><svg viewBox="0 0 720 266" role="img" aria-label="Optimistic concurrency with ETags: both users read version 1, A saves first and creates version 2, B's save based on version 1 is rejected with 412">
<text class="sT" x="90" y="22" text-anchor="middle">Accountant A</text><line class="sD" x1="90" y1="32" x2="90" y2="262"/>
<text class="sT" x="360" y="22" text-anchor="middle">API (invoice 7)</text><line class="sD" x1="360" y1="32" x2="360" y2="262"/>
<text class="sT" x="630" y="22" text-anchor="middle">Accountant B</text><line class="sD" x1="630" y1="32" x2="630" y2="262"/>
<g data-s="1"><line class="sLg" x1="356" y1="52" x2="94" y2="60" marker-end="url(#ahg)"/><text class="sC" x="225" y="50" text-anchor="middle">GET → ETag "v1"</text><line class="sLg" x1="364" y1="52" x2="626" y2="60" marker-end="url(#ahg)"/><text class="sC" x="495" y="50" text-anchor="middle">GET → ETag "v1"</text></g>
<g data-s="2"><line class="sL" x1="90" y1="96" x2="356" y2="106" marker-end="url(#ah)"/><text class="sM" x="225" y="92" text-anchor="middle">PUT If-Match: "v1"</text><line class="sLg" x1="356" y1="118" x2="94" y2="126" marker-end="url(#ahg)"/><text class="sGt" x="225" y="138" text-anchor="middle">204 · ETag "v2"</text><rect class="sG" x="300" y="102" width="120" height="24" rx="6"/><text class="sC" x="360" y="118" text-anchor="middle">now v2</text></g>
<g data-s="3"><line class="sL" x1="630" y1="156" x2="364" y2="166" marker-end="url(#ah)"/><text class="sM" x="495" y="152" text-anchor="middle">PUT If-Match: "v1"</text><line class="sLr" x1="364" y1="178" x2="626" y2="186" marker-end="url(#ahr)"/><text class="sRt" x="495" y="198" text-anchor="middle">412 Precondition Failed</text></g>
<g data-s="4"><line class="sLm" x1="630" y1="220" x2="364" y2="226" marker-end="url(#ahm)"/><text class="sC" x="495" y="216" text-anchor="middle">reload, merge, retry with "v2"</text><text class="sGt" x="360" y="256" text-anchor="middle">A's change was not silently overwritten</text></g>
</svg><ol class="dia-steps">
<li>Both accountants open invoice 7. Each response carries the version they saw: ETag "v1".</li>
<li>A saves first, sending <code>If-Match: "v1"</code>. The version still matches, so the update succeeds and the invoice becomes "v2".</li>
<li>B saves, also based on "v1". The server checks <code>If-Match</code>, sees the current version is "v2", and refuses with 412 instead of overwriting A's work.</li>
<li>B's client reloads the latest invoice, shows what changed, and lets B reapply their edit.</li>
</ol><figcaption>Preventing the lost update. In EF Core the same check is a concurrency token in the UPDATE's WHERE clause.</figcaption></figure>

## B4.6 Versioning and evolving an API 🟢 🟡 ⭐

**Backward-compatible (non-breaking) changes:** adding an endpoint, adding an **optional** request field, adding a response field (clients must ignore unknown fields), adding a new enum value *if* clients were told to expect unknown values.

**Breaking changes:** removing or renaming a field, changing a type or format, making an optional field required, changing status codes or error shapes, changing default behaviour.

| Versioning style | Example | Notes |
|---|---|---|
| **URL path** | `/api/v1/invoices` | Most visible, easiest to route and cache; the common choice |
| Query string | `?api-version=2.0` | Used by Azure's APIs |
| Header | `Api-Version: 2` | Clean URLs, less visible |
| Media type | `Accept: application/vnd.finsight.v2+json` | Most "RESTful", least convenient |

In ASP.NET Core, the `Asp.Versioning.Http` / `Asp.Versioning.Mvc` packages implement all four.

<figure class="dia anim"><svg viewBox="0 0 720 214" role="img" aria-label="Animation: an API version lifecycle over two years: v1 runs alone until v2 is released at month 6; both run side by side; v1 is announced as deprecated at month 9 and returns a Deprecation header; at month 18, the sunset date, v1 is removed and only v2 remains">
<line class="sLm" x1="40" y1="140" x2="680" y2="140" style="stroke-width:2"/>
<line class="sLm" x1="40" y1="134" x2="40" y2="146"/><text class="sS" x="40" y="162" text-anchor="middle">month 0</text>
<line class="sLm" x1="200" y1="134" x2="200" y2="146"/><text class="sS" x="200" y="162" text-anchor="middle">month 6</text>
<line class="sLm" x1="360" y1="134" x2="360" y2="146"/><text class="sS" x="360" y="162" text-anchor="middle">month 12</text>
<line class="sLm" x1="520" y1="134" x2="520" y2="146"/><text class="sS" x="520" y="162" text-anchor="middle">month 18</text>
<line class="sLm" x1="680" y1="134" x2="680" y2="146"/><text class="sS" x="680" y="162" text-anchor="middle">month 24</text>
<rect class="sB" x="40" y="40" width="480" height="30" rx="4" opacity=".8"/><text class="sT" x="146.667" y="60" text-anchor="middle">/api/v1</text>
<rect class="sW" x="280" y="40" width="240" height="30" rx="4"/><text class="sT" x="400" y="60" text-anchor="middle">v1 + Deprecation header</text>
<rect class="sG" x="200" y="84" width="480" height="30" rx="4" opacity=".8"/><text class="sT" x="440" y="104" text-anchor="middle">/api/v2</text>
<line class="sLm" x1="200" y1="30" x2="200" y2="134" stroke-dasharray="3 4"/><text class="sGt" x="200" y="186" text-anchor="middle">v2 released</text>
<line class="sLm" x1="280" y1="30" x2="280" y2="134" stroke-dasharray="3 4"/><text class="sWt" x="280" y="204" text-anchor="middle">v1 deprecated (announced)</text>
<line class="sLm" x1="520" y1="30" x2="520" y2="134" stroke-dasharray="3 4"/><text class="sRt" x="520" y="186" text-anchor="middle">Sunset: v1 removed</text>
<text class="sM" x="360" y="22" text-anchor="middle">versions overlap for months; clients get warnings long before anything breaks</text>
<circle class="sPw" r="4" opacity="0"><animateMotion dur="12s" repeatCount="indefinite" calcMode="linear" keyPoints="0;0;1;1" keyTimes="0;0.000;0.900;1" path="M40 140 L680 140"/><animate attributeName="opacity" dur="12s" repeatCount="indefinite" values="0;0;1;1;0;0" keyTimes="0;0.000;0.002;0.900;0.902;1"/></circle>
</svg><figcaption>Breaking changes are a migration project for every client, so they get time: a parallel period, a Deprecation header, a published Sunset date, and usage metrics showing who is still on v1. Illustrative timeline.</figcaption></figure>

**Deprecating well:** announce it, document migration, run versions side by side, and signal it in responses with the **`Deprecation`** header (RFC 9745) and the **`Sunset`** header (RFC 8594) giving the shutdown date; log who still calls the old version and contact them.

> [!say]
> "I avoid breaking changes by only adding optional fields and new endpoints, and I tell clients to ignore unknown fields. When a breaking change is unavoidable, I version in the URL path, run both versions side by side, mark the old one with Deprecation and Sunset headers, and watch the logs until callers have moved."

## B4.7 Errors and validation responses 🟢

Use **ProblemDetails** everywhere (RFC 9457, [[B3.5]]): validation errors with an `errors` dictionary per field, domain errors with a stable `type` URI or `code` the client can switch on, and always a `traceId`. Never return 200 with `{ "success": false }`.

## B4.8 Long-running work and webhooks 🟡 ⭐

**Long-running operations** (generating a large report, re-forecasting a year of data):

```http
POST /api/v1/reports            → 202 Accepted
                                  Location: /api/v1/report-jobs/91
GET  /api/v1/report-jobs/91     → 200 { "status": "running", "progress": 40 }
GET  /api/v1/report-jobs/91     → 303 See Other, Location: /api/v1/reports/91.pdf   (or 200 with a download URL)
```

Or push completion over SignalR, SSE or a webhook instead of polling.

<figure class="dia anim"><svg viewBox="0 0 720 240" role="img" aria-label="Animation: a long-running request: POST returns 202 with a job URL while the job is enqueued for a worker, the client polls the job and sees it running, and finally gets a 303 redirect to the result">
<text class="sT" x="100" y="22" text-anchor="middle">Client</text><line class="sD" x1="100" y1="32" x2="100" y2="232"/>
<text class="sT" x="400" y="22" text-anchor="middle">API</text><line class="sD" x1="400" y1="32" x2="400" y2="232"/>
<text class="sT" x="640" y="22" text-anchor="middle">Worker</text><line class="sD" x1="640" y1="32" x2="640" y2="232"/>
<line class="sL" x1="100" y1="48" x2="396" y2="54" marker-end="url(#ah)"/><text class="sM" x="250" y="44" text-anchor="middle">POST /reports</text>
<line class="sLw" x1="404" y1="60" x2="636" y2="66" marker-end="url(#ahw)"/><text class="sC" x="520" y="56" text-anchor="middle">enqueue job 91</text>
<line class="sLg" x1="396" y1="76" x2="104" y2="82" marker-end="url(#ahg)"/><text class="sGt" x="250" y="96" text-anchor="middle">202 Accepted · Location: /report-jobs/91</text>
<line class="sL" x1="100" y1="120" x2="396" y2="124" marker-end="url(#ah)"/><text class="sM" x="250" y="116" text-anchor="middle">GET /report-jobs/91</text><line class="sLg" x1="396" y1="132" x2="104" y2="136" marker-end="url(#ahg)"/><text class="sC" x="250" y="150" text-anchor="middle">200 {status: "running", progress: 40}</text>
<rect class="sW" x="600" y="80" width="80" height="90" rx="6"/><text class="sC" x="640" y="128" text-anchor="middle">working</text>
<line class="sL" x1="100" y1="180" x2="396" y2="184" marker-end="url(#ah)"/><text class="sM" x="250" y="176" text-anchor="middle">GET /report-jobs/91</text><line class="sLg" x1="396" y1="192" x2="104" y2="196" marker-end="url(#ahg)"/><text class="sGt" x="250" y="214" text-anchor="middle">303 See Other → /reports/91.pdf</text>
<circle class="sP" r="5" opacity="0"><animateMotion dur="10s" repeatCount="indefinite" calcMode="linear" keyPoints="0;0;1;1" keyTimes="0;0.000;0.080;1" path="M100 48 L396 54"/><animate attributeName="opacity" dur="10s" repeatCount="indefinite" values="0;0;1;1;0;0" keyTimes="0;0.000;0.002;0.080;0.082;1"/></circle>
<circle class="sPv" r="5" opacity="0"><animateMotion dur="10s" repeatCount="indefinite" calcMode="linear" keyPoints="0;0;1;1" keyTimes="0;0.100;0.180;1" path="M404 60 L636 66"/><animate attributeName="opacity" dur="10s" repeatCount="indefinite" values="0;0;1;1;0;0" keyTimes="0;0.098;0.102;0.180;0.182;1"/></circle>
<circle class="sPg" r="5" opacity="0"><animateMotion dur="10s" repeatCount="indefinite" calcMode="linear" keyPoints="0;0;1;1" keyTimes="0;0.170;0.250;1" path="M396 76 L104 82"/><animate attributeName="opacity" dur="10s" repeatCount="indefinite" values="0;0;1;1;0;0" keyTimes="0;0.168;0.172;0.250;0.252;1"/></circle>
<circle class="sP" r="5" opacity="0"><animateMotion dur="10s" repeatCount="indefinite" calcMode="linear" keyPoints="0;0;1;1" keyTimes="0;0.360;0.440;1" path="M100 120 L396 124"/><animate attributeName="opacity" dur="10s" repeatCount="indefinite" values="0;0;1;1;0;0" keyTimes="0;0.358;0.362;0.440;0.442;1"/></circle>
<circle class="sPw" r="5" opacity="0"><animateMotion dur="10s" repeatCount="indefinite" calcMode="linear" keyPoints="0;0;1;1" keyTimes="0;0.460;0.540;1" path="M396 132 L104 136"/><animate attributeName="opacity" dur="10s" repeatCount="indefinite" values="0;0;1;1;0;0" keyTimes="0;0.458;0.462;0.540;0.542;1"/></circle>
<circle class="sP" r="5" opacity="0"><animateMotion dur="10s" repeatCount="indefinite" calcMode="linear" keyPoints="0;0;1;1" keyTimes="0;0.660;0.740;1" path="M100 180 L396 184"/><animate attributeName="opacity" dur="10s" repeatCount="indefinite" values="0;0;1;1;0;0" keyTimes="0;0.658;0.662;0.740;0.742;1"/></circle>
<circle class="sPg" r="5" opacity="0"><animateMotion dur="10s" repeatCount="indefinite" calcMode="linear" keyPoints="0;0;1;1" keyTimes="0;0.760;0.840;1" path="M396 192 L104 196"/><animate attributeName="opacity" dur="10s" repeatCount="indefinite" values="0;0;1;1;0;0" keyTimes="0;0.758;0.762;0.840;0.842;1"/></circle>
</svg><figcaption>The 202 pattern. The request returns in milliseconds; the work happens elsewhere; the client checks back (or is told by a webhook or SignalR).</figcaption></figure>

**Webhooks** (your API calls the client's URL when something happens):

- **Sign** each payload (an HMAC of the body with a shared secret, in a header) so receivers can verify it came from you, and include a timestamp to stop replays.
- **Retry** with exponential backoff on failure; receivers must be **idempotent**, because duplicates will happen.
- Send an **event ID** and type; keep payloads small (or send IDs and let them fetch).
- Give a way to see deliveries and replay them.

<figure class="dia anim"><svg viewBox="0 0 720 210" role="img" aria-label="Animation: webhook signing: the payload and a timestamp are signed with an HMAC using a shared secret; the receiver recomputes and compares">
<rect class="sB" x="16" y="40" width="150" height="50" rx="8"/><text class="sT" x="91" y="63" text-anchor="middle">event payload</text><text class="sC" x="91" y="79" text-anchor="middle">invoice.paid</text><text class="sX" x="186" y="70" text-anchor="middle">+</text><rect class="sR" x="200" y="40" width="130" height="50" rx="8"/><text class="sT" x="265" y="63" text-anchor="middle">shared secret</text><text class="sC" x="265" y="79" text-anchor="middle">never sent</text>
<text class="sX" x="186" y="120" text-anchor="middle">+</text><rect class="sB" x="200" y="100" width="130" height="40" rx="8"/><text class="sT" x="265" y="125" text-anchor="middle">timestamp</text>
<line class="sLm" x1="330" y1="80" x2="366" y2="80" marker-end="url(#ahm)"/><rect class="sV" x="370" y="54" width="130" height="50" rx="8"/><text class="sT" x="435" y="84" text-anchor="middle">HMAC-SHA256</text>
<line class="sLm" x1="500" y1="80" x2="536" y2="80" marker-end="url(#ahm)"/><rect class="sG" x="540" y="50" width="168" height="60" rx="8"/><text class="sC" x="624" y="72" text-anchor="middle">header:</text><text class="sC" x="624" y="92" text-anchor="middle">X-Signature: t=…,v1=9f2c…</text>
<text class="sS" x="360" y="176" text-anchor="middle">Receiver: recompute the HMAC over the raw body with the same secret, compare in constant time,</text>
<text class="sS" x="360" y="196" text-anchor="middle">reject old timestamps (replays), and process each event ID once (deliveries repeat).</text>
<circle class="sPv" r="4" opacity="0"><animateMotion dur="9s" repeatCount="indefinite" calcMode="linear" keyPoints="0;0;1;1" keyTimes="0;0.000;0.100;1" path="M330 80 L366 80"/><animate attributeName="opacity" dur="9s" repeatCount="indefinite" values="0;0;1;1;0;0" keyTimes="0;0.000;0.002;0.100;0.102;1"/></circle>
<circle class="sPg" r="4" opacity="0"><animateMotion dur="9s" repeatCount="indefinite" calcMode="linear" keyPoints="0;0;1;1" keyTimes="0;0.180;0.280;1" path="M500 80 L536 80"/><animate attributeName="opacity" dur="9s" repeatCount="indefinite" values="0;0;1;1;0;0" keyTimes="0;0.178;0.182;0.280;0.282;1"/></circle>
</svg><figcaption>Signed webhooks. The signature proves who sent it and that nobody changed it; the timestamp and event ID stop replays and duplicates.</figcaption></figure>

## B4.9 Other recurring design questions 🟡

- **Bulk operations:** `POST /invoices:batch` with a per-item result list (207-style), or an async job for big batches.
- **File upload:** small files as `multipart/form-data`; large files uploaded **directly to blob storage** using a short-lived pre-signed URL (a SAS token in Azure) so they never pass through your API ([[FS3]]).
- **Partial responses:** `?fields=id,customer,amount` for heavy resources, or a dedicated summary endpoint.
- **Rate limits:** return 429 with `Retry-After`; document the limits; consider the IETF `RateLimit` headers.
- **Time zones:** store and send UTC; convert for display on the client; be explicit for date-only values (`DateOnly`) such as a due date.

## B4.10 REST, gRPC or GraphQL? 🟡 ⭐

| | REST (JSON over HTTP) | gRPC | GraphQL |
|---|---|---|---|
| Contract | OpenAPI (optional) | **`.proto` files** (required), code generated | **Schema** (required), typed |
| Payload | JSON text | **Protocol Buffers**, a compact binary format | JSON |
| Transport | HTTP/1.1 or 2 | **HTTP/2** | Usually HTTP POST to one endpoint |
| Strengths | Universal, cacheable, simple, every tool supports it | Fast, strongly typed, **streaming** (client, server, bidirectional), deadlines and cancellation | Clients fetch **exactly the fields** they need from many resources in one request |
| Weaknesses | Over- or under-fetching on complex screens | Browsers need gRPC-Web or JSON transcoding; harder to debug by eye | Caching is harder; servers must guard against expensive queries; **N+1** resolver problem |
| Best for | Public and partner APIs, CRUD, most web backends | Internal service-to-service calls, high throughput, real-time streams | Front ends with many varied screens, mobile apps, aggregating several services |

<figure class="dia anim"><svg viewBox="0 0 720 218" role="img" aria-label="Animation: A screen needing an invoice, its customer name and its last three payments takes three REST calls or one GraphQL query">
<text class="sT" x="180" y="22" text-anchor="middle">REST: three round trips</text><text class="sT" x="540" y="22" text-anchor="middle">GraphQL: one query, exact fields</text>
<rect class="sB" x="20" y="40" width="200" height="36" rx="6"/><text class="sM" x="120" y="62" text-anchor="middle">GET /invoices/7</text><text class="sC" x="234" y="62">whole invoice</text>
<rect class="sB" x="20" y="90" width="200" height="36" rx="6"/><text class="sM" x="120" y="112" text-anchor="middle">GET /customers/31</text><text class="sC" x="234" y="112">whole customer</text>
<rect class="sB" x="20" y="140" width="200" height="36" rx="6"/><text class="sM" x="120" y="162" text-anchor="middle">GET /invoices/7/payments</text><text class="sC" x="234" y="162">all payments</text>
<text class="sWt" x="180" y="206" text-anchor="middle">3 × latency, plus fields the screen never shows</text>
<line class="sD" x1="360" y1="12" x2="360" y2="214"/>
<rect class="sV" x="380" y="36" width="320" height="150" rx="8"/><text class="sC" x="392" y="58" xml:space="preserve" style="white-space:pre">query {</text><text class="sC" x="392" y="77" xml:space="preserve" style="white-space:pre">  invoice(id: 7) {</text><text class="sC" x="392" y="96" xml:space="preserve" style="white-space:pre">    amount  status</text><text class="sC" x="392" y="115" xml:space="preserve" style="white-space:pre">    customer { name }</text><text class="sC" x="392" y="134" xml:space="preserve" style="white-space:pre">    payments(last: 3) { amount paidAt }</text><text class="sC" x="392" y="153" xml:space="preserve" style="white-space:pre">  }</text><text class="sC" x="392" y="172" xml:space="preserve" style="white-space:pre">}</text>
<text class="sGt" x="540" y="206" text-anchor="middle">one round trip; the server must guard cost and N+1</text>
<circle class="sPw" r="4" opacity="0"><animateMotion dur="10s" repeatCount="indefinite" calcMode="linear" keyPoints="0;0;1;1" keyTimes="0;0.000;0.080;1" path="M222 46 L352 46"/><animate attributeName="opacity" dur="10s" repeatCount="indefinite" values="0;0;1;1;0;0" keyTimes="0;0.000;0.002;0.080;0.082;1"/></circle>
<circle class="sPw" r="4" opacity="0"><animateMotion dur="10s" repeatCount="indefinite" calcMode="linear" keyPoints="0;0;1;1" keyTimes="0;0.100;0.180;1" path="M352 74 L222 74"/><animate attributeName="opacity" dur="10s" repeatCount="indefinite" values="0;0;1;1;0;0" keyTimes="0;0.098;0.102;0.180;0.182;1"/></circle>
<circle class="sPw" r="4" opacity="0"><animateMotion dur="10s" repeatCount="indefinite" calcMode="linear" keyPoints="0;0;1;1" keyTimes="0;0.200;0.280;1" path="M222 96 L352 96"/><animate attributeName="opacity" dur="10s" repeatCount="indefinite" values="0;0;1;1;0;0" keyTimes="0;0.198;0.202;0.280;0.282;1"/></circle>
<circle class="sPw" r="4" opacity="0"><animateMotion dur="10s" repeatCount="indefinite" calcMode="linear" keyPoints="0;0;1;1" keyTimes="0;0.300;0.380;1" path="M352 124 L222 124"/><animate attributeName="opacity" dur="10s" repeatCount="indefinite" values="0;0;1;1;0;0" keyTimes="0;0.298;0.302;0.380;0.382;1"/></circle>
<circle class="sPw" r="4" opacity="0"><animateMotion dur="10s" repeatCount="indefinite" calcMode="linear" keyPoints="0;0;1;1" keyTimes="0;0.400;0.480;1" path="M222 146 L352 146"/><animate attributeName="opacity" dur="10s" repeatCount="indefinite" values="0;0;1;1;0;0" keyTimes="0;0.398;0.402;0.480;0.482;1"/></circle>
<circle class="sPw" r="4" opacity="0"><animateMotion dur="10s" repeatCount="indefinite" calcMode="linear" keyPoints="0;0;1;1" keyTimes="0;0.500;0.580;1" path="M352 174 L222 174"/><animate attributeName="opacity" dur="10s" repeatCount="indefinite" values="0;0;1;1;0;0" keyTimes="0;0.498;0.502;0.580;0.582;1"/></circle>
<circle class="sPg" r="4" opacity="0"><animateMotion dur="10s" repeatCount="indefinite" calcMode="linear" keyPoints="0;0;1;1" keyTimes="0;0.000;0.180;1" path="M380 192 L700 192 L380 192"/><animate attributeName="opacity" dur="10s" repeatCount="indefinite" values="0;0;1;1;0;0" keyTimes="0;0.000;0.002;0.180;0.182;1"/></circle>
</svg><figcaption>Over-fetching and under-fetching, the problem GraphQL solves. A BFF endpoint shaped for the screen solves it too, without a new technology ([[FS1]]).</figcaption></figure>

> [!term] The N+1 problem (GraphQL and ORMs)
> Fetching a list (1 query), then running one more query **per item** for related data (N queries). In GraphQL, resolvers for a nested field cause it; **DataLoader**-style batching collects the IDs and loads them in one query. In EF Core, the fix is eager loading or projection ([[B5]]).

> [!say]
> "REST is my default for public and web APIs because it's simple and cacheable. For internal service-to-service calls where performance and strong contracts matter, gRPC with protobuf over HTTP/2 is better, especially with streaming. GraphQL makes sense when many different screens need different shapes of data, but you have to handle caching, query cost limits and batching to avoid N+1."

In .NET: `Grpc.AspNetCore` for gRPC services (with JSON transcoding to also expose REST); **Hot Chocolate** is the main .NET GraphQL server.

> [!lab] Design before you code
> On paper, design the FinSight API for invoices and payments: URLs, methods, status codes, request and response JSON, pagination style, error format, an idempotent payment endpoint, concurrency with ETags, and v1-to-v2 evolution for one breaking change. Then compare with what you actually built and list three improvements. That's a complete answer to the "design an API" interview question.

## B4.11 Interview drill 🟢 ⭐

| Question | Strong short answer |
|---|---|
| What makes an API RESTful? | Resources with URLs, standard methods and status codes, stateless requests, cacheable representations. |
| How should you name endpoints? | Plural nouns, nested at most one level, verbs only for real actions, filters in the query string. |
| Offset vs cursor pagination? | Offset supports page numbers but slows on deep pages and shifts with inserts; cursor/keyset is stable and constant-cost. |
| How do you make POST safe to retry? | An Idempotency-Key header; store and replay the first response for that key. |
| What's a lost update and how do you prevent it? | Concurrent edits overwriting each other; optimistic concurrency with ETag/If-Match or a rowversion token, returning 412 or 409. |
| How do you version an API? | Prefer additive changes; for breaking ones, a URL version (/v2) run side by side with Deprecation and Sunset headers. |
| Which changes are breaking? | Removing or renaming fields, changing types, making optional fields required, changing semantics or error shapes. |
| How do you design a long-running operation? | Return 202 with a status resource to poll, or notify via webhook, SignalR or SSE when done. |
| How do you secure webhooks? | Sign payloads with an HMAC and timestamp, retry with backoff, require idempotent receivers. |
| REST vs gRPC vs GraphQL? | REST for general and public APIs; gRPC for fast, typed internal calls and streaming; GraphQL for flexible client-driven queries. |
| What is the N+1 problem? | One query for a list plus one per item for related data; fix with batching, eager loading or projection. |
| How should money be represented in JSON? | A decimal string or integer minor units, plus an ISO currency code; never a float. |
| What does 202 mean? | Accepted for processing, not yet completed. |

## Key takeaways

> [!check]
> - Resources, standard methods, correct status codes, consistent JSON: that's most of "good REST".
> - Keyset pagination for anything large or changing; always cap page size.
> - Retries are inevitable: idempotency keys for POST, idempotent webhook and callback handling.
> - Optimistic concurrency with ETags or rowversion prevents lost updates.
> - Evolve additively; version and deprecate deliberately when you must break.

## Sources

- Roy Fielding, [Architectural Styles and the Design of Network-based Software Architectures](https://ics.uci.edu/~fielding/pubs/dissertation/top.htm) (2000), chapter 5 (REST).
- IETF: [RFC 9110 — HTTP Semantics](https://www.rfc-editor.org/rfc/rfc9110) (conditional requests, If-Match, 412), [RFC 9457 — Problem Details](https://www.rfc-editor.org/rfc/rfc9457), [RFC 8594 — Sunset header](https://www.rfc-editor.org/rfc/rfc8594), [RFC 9745 — Deprecation header](https://www.rfc-editor.org/rfc/rfc9745), [The Idempotency-Key HTTP header (draft)](https://datatracker.ietf.org/doc/draft-ietf-httpapi-idempotency-key-header/).
- Microsoft: [REST API design best practices (Azure Architecture Center)](https://learn.microsoft.com/en-us/azure/architecture/best-practices/api-design), [Microsoft REST API Guidelines](https://github.com/microsoft/api-guidelines), [Handling concurrency conflicts in EF Core](https://learn.microsoft.com/en-us/ef/core/saving/concurrency), [gRPC on .NET](https://learn.microsoft.com/en-us/aspnet/core/grpc/).
- Stripe: [Idempotent requests](https://docs.stripe.com/api/idempotent_requests).
- Markus Winand, [We need tool support for keyset pagination](https://use-the-index-luke.com/no-offset).
- [GraphQL learn](https://graphql.org/learn/), including [Performance and N+1 / DataLoader](https://graphql.org/learn/performance/).
