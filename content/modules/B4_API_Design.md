# API Design — REST Done Well, Pagination, Idempotency, Versioning, gRPC and GraphQL

Building an endpoint is easy; designing an API that other teams, mobile apps and your future self can rely on for years is the skill interviewers test. Questions here are open-ended, such as "design the API for invoices and payments", so a clear set of conventions and the reasons behind them carries you through.

> [!focus]
> **Entry must:** resource-oriented URLs, the right method and status code, consistent JSON shapes, pagination and filtering, error format, basic versioning.
> **Mid adds:** cursor (keyset) pagination, idempotency keys, optimistic concurrency with ETags, long-running operations, webhooks, backward compatibility and deprecation, choosing REST vs gRPC vs GraphQL.
> **Most asked:** *What makes an API RESTful?* · *How do you paginate?* · *How do you version an API?* · *How do you make POST safe to retry?* · *How do you stop two users overwriting each other's changes?* · *REST vs GraphQL vs gRPC?*
> **Time budget:** 3 hours.

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

**Webhooks** (your API calls the client's URL when something happens):

- **Sign** each payload (an HMAC of the body with a shared secret, in a header) so receivers can verify it came from you, and include a timestamp to stop replays.
- **Retry** with exponential backoff on failure; receivers must be **idempotent**, because duplicates will happen.
- Send an **event ID** and type; keep payloads small (or send IDs and let them fetch).
- Give a way to see deliveries and replay them.

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
