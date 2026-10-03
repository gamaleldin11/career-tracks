# Real-World Features — Uploads, Real-Time, Payments, Email, Search, Time Zones and AI

Take-home tasks and "tell me about a feature you built" questions rarely stop at CRUD. They ask about the features where full-stack work gets hard: a large CSV import, a live dashboard, an Egyptian payment gateway, Arabic and English together, an AI assistant. You've built most of these (FinSight's CSV ingestion, SignalR updates and LangFlow assistant; Paymob, Fawry, Kashier and Stripe guides in your template library; a bilingual site). This module gives each one a production-quality design you can describe end to end.

> [!focus]
> **Entry must:** upload a file safely; push live updates with SignalR; describe a payment flow including the callback; store times in UTC; build a bilingual UI.
> **Mid adds:** direct-to-blob uploads with pre-signed URLs, background imports with per-row error reports, scaling SignalR, idempotent payment state machines and reconciliation, email deliverability, search options, time zones with DST, server-side AI features with streaming and cost controls.
> **Most asked:** *How would you handle uploading a 500 MB file?* · *How do you notify users in real time?* · *Walk me through integrating a payment gateway* · *How do you handle time zones?* · *How would you add an AI assistant safely?*
> **Time budget:** 3 hours.

## FS3.1 File uploads 🟢 🟡 ⭐

| Size and need | Approach |
|---|---|
| Small (avatars, documents up to a few MB) | `multipart/form-data` to the API; validate; store in **blob storage**, not the database or the web server's disk |
| Large (videos, big CSVs, hundreds of MB) | **Direct-to-storage upload** with a short-lived **pre-signed URL** (an Azure SAS URL, an S3 pre-signed URL): the file never passes through your API |
| Unreliable networks, very large files | **Resumable / chunked** uploads (Azure block blobs, the tus protocol) |

<figure class="dia"><svg viewBox="0 0 720 190" role="img" aria-label="Direct upload: request SAS URL from API, upload to blob storage, notify API, worker processes file">
<rect class="sB" x="10" y="70" width="110" height="50" rx="8"/><text class="sT" x="65" y="100" text-anchor="middle">Browser</text>
<rect class="sA" x="250" y="10" width="130" height="50" rx="8"/><text class="sT" x="315" y="40" text-anchor="middle">API</text>
<rect class="sG" x="250" y="130" width="130" height="50" rx="8"/><text class="sT" x="315" y="160" text-anchor="middle">Blob Storage</text>
<rect class="sW" x="480" y="10" width="110" height="50" rx="8"/><text class="sT" x="535" y="40" text-anchor="middle">Queue</text>
<rect class="sB" x="480" y="130" width="120" height="50" rx="8"/><text class="sT" x="540" y="160" text-anchor="middle">Import worker</text>
<line class="sL" x1="120" y1="80" x2="250" y2="35"/><text class="sM" x="128" y="48">① ask for upload URL</text>
<line class="sL" x1="120" y1="105" x2="250" y2="155"/><text class="sM" x="128" y="150">② PUT file (SAS)</text>
<line class="sD" x1="120" y1="95" x2="250" y2="45"/><text class="sM" x="150" y="78">③ "uploaded"</text>
<line class="sL" x1="380" y1="35" x2="480" y2="35"/><line class="sL" x1="535" y1="60" x2="540" y2="130"/><line class="sD" x1="480" y1="155" x2="380" y2="155"/>
</svg><figcaption>The API only issues a narrowly scoped, short-lived upload URL and later queues the processing; the bytes go straight to storage.</figcaption></figure>

```csharp
// Issue a write-only SAS URL for one blob, valid for 10 minutes
app.MapPost("/api/uploads", (UploadRequest req, BlobContainerClient container, ClaimsPrincipal user) =>
{
    if (req.SizeBytes > 500 * 1024 * 1024 || req.ContentType != "text/csv") return Results.Problem(statusCode: 400, title: "Unsupported file");
    var blob = container.GetBlobClient($"{user.CompanyId()}/{Guid.NewGuid()}.csv");     // server picks the name and path
    var sas = blob.GenerateSasUri(BlobSasPermissions.Create | BlobSasPermissions.Write, DateTimeOffset.UtcNow.AddMinutes(10));
    return Results.Ok(new { uploadUrl = sas, blobName = blob.Name });
}).RequireAuthorization();
```

(With a managed identity, use a **user-delegation SAS** instead of an account key.)

**Upload safety checklist:** limit the size (server and storage); check the **content**, not just the extension (magic bytes, or parse it); generate the stored name yourself (no user-supplied paths, so no path traversal); keep uploads private and serve them through authorised, expiring URLs; scan for malware where it matters (Microsoft Defender for Storage does this on Azure); and treat CSV and Excel content as **data**, never formulas, when you later export it (**CSV injection**: a cell starting with `=`, `+`, `-` or `@` can execute in Excel).

### Importing a large CSV 🟡 ⭐

1. The upload completes → the API queues `ImportRequested(blobName, companyId, userId)` and returns **202** with an import ID ([[B4.8]]).
2. A **worker** streams the file row by row (never loading it all), validates each row, and **batches** valid rows into the database (`ExecuteUpdate`, bulk insert, or batched `SaveChanges`).
3. Per-row errors are collected: "Row 214: amount 'twelve' is not a number".
4. Progress is published (SignalR, or a status endpoint the UI polls); at the end the UI shows "4,812 imported, 3 failed", with a **downloadable error report**.
5. Make it **idempotent**: a file hash or import ID prevents double import if the user uploads twice or the job retries.

> [!story]
> FinSight's **CSV ingestion and transaction categoriser**, followed by background re-forecasting, are this exact pipeline at a smaller scale. A strong answer describes what you built and what you'd change for scale: direct-to-blob upload, streaming parse, batching, an error report, and idempotency by file hash.

## FS3.2 Real-time updates with SignalR 🟢 🟡 ⭐

```csharp
// Server
public class NotificationsHub : Hub
{
    public override async Task OnConnectedAsync()
    {
        var companyId = Context.User!.FindFirst("company_id")!.Value;        // from the token, not the client
        await Groups.AddToGroupAsync(Context.ConnectionId, $"company:{companyId}");
        await base.OnConnectedAsync();
    }
}
app.MapHub<NotificationsHub>("/hubs/notifications").RequireAuthorization();

// Anywhere in the app (a service, a background job)
public class ForecastNotifier(IHubContext<NotificationsHub> hub)
{
    public Task ForecastUpdatedAsync(Guid companyId) =>
        hub.Clients.Group($"company:{companyId}").SendAsync("ForecastUpdated", new { companyId });
}
```

```ts
// Client (Angular or React): on the event, refresh the affected data
connection.on("ForecastUpdated", () => queryClient.invalidateQueries({ queryKey: ["forecast"] }));
await connection.start();
```

**Design rules:** send **small notifications** ("forecast updated") and let the client refetch through the normal API, which keeps authorisation and caching in one place; group connections by tenant or user on the server; handle reconnection (`withAutomaticReconnect`) and **refetch on reconnect**, because events sent while disconnected are lost.

**Scaling out:** with several API instances, a client connected to instance A won't receive a message sent from instance B. Use a **backplane** (Redis) or the managed **Azure SignalR Service**, which also offloads the connections themselves. Sticky sessions are needed for SignalR's non-WebSocket fallbacks unless you use the Azure service.

**SignalR or SSE?** For one-way server-to-browser updates, **Server-Sent Events** are simpler (plain HTTP, automatic reconnection, and since .NET 10, `TypedResults.ServerSentEvents`). Use SignalR when you need two-way messages, groups and fallbacks.

> [!story]
> FinSight used **SignalR** for live dashboard updates. Describe the tenant groups, what the event carried, and what happens on reconnect, and if you didn't handle reconnect refetching, say you'd add it.

## FS3.3 Payments, the Egyptian way 🟡 ⭐

In Egypt, customers pay by card, mobile wallets (Vodafone Cash and others), **Fawry reference codes paid at outlets or in apps**, InstaPay, and instalments (valU and others). Gateways such as **Paymob**, **Fawry**, **Kashier**, Geidea and Stripe (for international cards) aggregate these. Your template library has integration guides for Paymob, Fawry, Kashier and Stripe.

**The universal flow:**

1. The server creates an **order** (status `Pending`) with the amount computed **on the server** (never trust the client's price).
2. The server asks the gateway for a payment session (a payment key, intention or checkout URL), passing your order ID as a reference.
3. The customer pays on the gateway's **hosted page or iframe**. Card data never touches your servers, which keeps you out of most **PCI DSS** scope.
4. The gateway calls your **webhook / callback** server-to-server with the result. **This is the source of truth.**
5. The browser is also redirected back to a "thank you" URL, but that's **only UX**: redirects can be faked or never arrive.
6. Your webhook handler **verifies the signature** (Paymob, for example, sends an HMAC you recompute from the payload with your secret), checks the amount, currency and order reference, and moves the order to `Paid` **idempotently**.
7. Fulfil the order (send the course access or the receipt) from the `Paid` state change, through the outbox.

```csharp
app.MapPost("/api/payments/webhook", async (HttpRequest req, PaymentsService svc) =>
{
    var body = await new StreamReader(req.Body).ReadToEndAsync();
    if (!svc.SignatureIsValid(body, req.Headers["X-Signature"]!))   // or the gateway's HMAC scheme
        return Results.Unauthorized();
    var evt = svc.Parse(body);
    await svc.ApplyAsync(evt);         // idempotent by the gateway's transaction ID; checks amount and order
    return Results.Ok();               // acknowledge quickly; heavy work goes to the outbox and workers
});
```

**Order state machine:** `Pending → Paid → Fulfilled`, with `Failed`, `Expired` (Fawry codes expire), `Refunded` and `PartiallyRefunded`. Transitions are explicit; an unexpected transition (a "paid" event for an already refunded order) is logged and flagged, not silently applied.

**Reconciliation:** a daily job compares your orders with the gateway's settlement report, so missed or duplicated webhooks are found and fixed.

> [!mistake] Marking an order paid on the redirect
> The success redirect URL can be visited by anyone, or never reached if the customer closes the tab after paying. Only a **verified server-to-server callback** (or a server-side status query to the gateway) may mark an order paid.

> [!say]
> "The server creates the order and computes the amount, the customer pays on the gateway's hosted page, so card data never touches us, and the gateway's signed webhook is the source of truth: I verify the signature, check the amount and reference, and apply the state change idempotently by transaction ID. The browser redirect only updates the UI. A daily reconciliation against the gateway's report catches anything missed."

## FS3.4 Transactional email 🟢

- Send through a provider (SendGrid, Amazon SES, Mailgun, Azure Communication Services, or a company SMTP relay) from a **background job**, never inline in the request ([[B8.8]]).
- Templates per language; plain-text alternative; one clear call to action; links that work on mobile.
- **Deliverability:** set up **SPF**, **DKIM** and **DMARC** DNS records for your domain; Gmail and Yahoo have required them for bulk senders since 2024. Otherwise your password-reset emails land in spam.
- Track bounces and complaints via the provider's webhooks; stop sending to hard-bounced addresses.

## FS3.5 Search 🟡

| Need | Option |
|---|---|
| Filter and sort structured fields | Indexed SQL queries ([[B6.3]]) |
| Simple text search in one database | **SQL Server full-text search** or **PostgreSQL full-text** (`tsvector` with a GIN index) |
| Fuzzy matching, relevance ranking, facets, typo tolerance, Arabic analysers | A search engine: **Elasticsearch/OpenSearch**, **Azure AI Search**, Meilisearch, Typesense |
| "Find things with similar meaning" | **Vector search** (pgvector, Azure AI Search, SQL Server 2025 `vector`), often **hybrid** with keyword search |

**Arabic search** needs normalisation: unify alef forms (أ إ آ → ا), taa marbuta and haa (ة/ه), yaa and alef maqsura (ي/ى), and strip diacritics (tashkeel); search engines' Arabic analysers do much of this. In the UI: debounce, cancel stale requests ([[F11.2]]), highlight matches, and keep the query in the URL.

## FS3.6 Internationalisation and time zones 🟢 🟡 ⭐

**Language and direction** are covered in [[F1.9]]. On the server: localise validation and error messages (`IStringLocalizer`, resource files) by the request's `Accept-Language` or the user's preference; store user-entered text as Unicode (`nvarchar`); sort and compare with the right culture or collation.

**Time:**

- **Store instants in UTC** (`datetimeoffset`/`timestamptz`, or UTC `datetime2`), and convert to the user's time zone only for display.
- Store a **calendar date** (a due date, a birthday) as a **date** (`DateOnly`), not a midnight timestamp, which shifts by a day in other time zones.
- Use **IANA time-zone IDs** (`Africa/Cairo`), never fixed offsets: **Egypt reinstated daylight saving time in 2023**, so Cairo is UTC+2 in winter and UTC+3 in summer, and the rules can change again by decree. `TimeZoneInfo.FindSystemTimeZoneById("Africa/Cairo")` works on Linux and, with .NET 6+, on Windows too; in browsers, `Intl.DateTimeFormat` with `timeZone: "Africa/Cairo"`.
- Schedule recurring jobs ("every day at 08:00 Cairo time") in the user's zone, not UTC, or DST shifts them by an hour twice a year.
- Make "today" and "this month" explicit in reports: whose midnight?

> [!say]
> "I store instants in UTC and calendar dates as dates, convert to the user's IANA time zone only for display, and never hard-code offsets. Egypt brought daylight saving back in 2023, so a fixed +2 is wrong half the year. Recurring schedules use the business's local time zone so they don't drift with DST."

## FS3.7 Audit trails, soft delete and activity feeds 🟡

- **Audit log:** who did what, when, from where, and what changed (before and after), written in the **same transaction** as the change (an EF Core `SaveChangesInterceptor`, [[B5.7]]); append-only; retained per policy. Finance apps like FinSight need this.
- **Soft delete:** an `IsDeleted` flag with a global query filter ([[B5.6]]), plus a policy for **hard deletion** of personal data on request (data-protection laws, [[S9.8]]).
- **Activity feed** ("Sara marked invoice 1043 paid"): derive it from domain events rather than querying the audit log directly.

## FS3.8 AI features in a full-stack app 🟡 ⭐

Users now expect "ask a question about my data" features, and interviewers increasingly ask how you'd build one safely.

**Architecture rules:**

- **Call LLMs from the server only.** API keys never go to the browser, and the server can enforce authorisation, logging, rate limits and cost budgets.
- **Retrieval goes through your authorised data layer**, so the model only sees what this user may see. Never let the model query the database directly with broad credentials.
- **Stream** responses to the UI (SSE or SignalR) so the first words appear in a second or two; let the user cancel (pass the `CancellationToken` through to the model call).
- **Treat model output as untrusted input:** render it as text or sanitised Markdown (no raw HTML), validate any structured output against a schema before acting on it, and require confirmation for actions with side effects.
- **Prompt injection:** documents and user messages can contain instructions aimed at the model ("ignore previous instructions and…"). Keep tools least-privileged, scope data per tenant, and never let model output alone authorise an action.
- **Cost and abuse controls:** per-user and per-tenant rate limits and token budgets, caching of repeated questions, smaller models for simple tasks, and logs of token usage.
- **Evaluate:** keep a set of test questions with expected answers and check quality on every prompt or model change.

> [!story]
> FinSight's assistant used **retrieval through the app's own authenticated API, so the LLM never touched the database**, with LangFlow flows for the RAG assistant and scenario simulator, structured JSON outputs validated with Pydantic schemas, and a Hangfire job that parsed LLM output into alerts. That's a mature design; say it in exactly those terms, and add what you'd strengthen: per-tenant token budgets, streaming, an evaluation set.

> [!lab] Pick one, ship it properly
> Choose the feature closest to the job you want and build it to this module's standard in a demo app: (a) a direct-to-blob CSV import with a worker, progress over SignalR and an error report; or (b) a Paymob or Stripe test-mode checkout with a verified, idempotent webhook and an order state machine; or (c) a streaming "ask about my invoices" assistant whose retrieval is tenant-scoped. One feature done this way is worth five CRUD screens on a CV.

## FS3.9 Interview drill 🟢 ⭐

| Question | Strong short answer |
|---|---|
| How do you upload a 500 MB file? | Direct to blob storage with a short-lived, write-only pre-signed URL; then notify the API and process in a background worker. |
| How do you validate uploads? | Limit size, check content not extension, generate the stored name, keep it private, scan if needed, guard against CSV injection on export. |
| How do you import a large CSV? | Queue it, stream and validate row by row in a worker, batch inserts, report per-row errors, make it idempotent. |
| How do you push live updates? | SignalR (or SSE for one-way) with server-assigned tenant groups; send small notifications and let clients refetch; refetch on reconnect. |
| How do you scale SignalR? | A Redis backplane or Azure SignalR Service so messages reach clients on any instance. |
| Walk me through a payment integration. | Server creates the order and amount, customer pays on the hosted page, the signed webhook is the source of truth, idempotent state change, daily reconciliation. |
| Can the success redirect mark an order paid? | No: only a verified server-to-server callback or a server-side status check. |
| How do you handle time zones? | Instants in UTC, calendar dates as dates, IANA zones like Africa/Cairo (DST since 2023), convert on display. |
| How do you make email land in the inbox? | A reputable provider plus SPF, DKIM and DMARC, background sending, and bounce handling. |
| How would you add an AI assistant safely? | Server-side calls only, tenant-scoped retrieval through the API, streamed responses, output treated as untrusted, rate limits and token budgets, an evaluation set. |
| What is prompt injection? | Instructions hidden in user or document content that try to make the model ignore its rules or misuse tools; mitigated by least privilege and never letting output alone authorise actions. |

## Key takeaways

> [!check]
> - Big files go straight to storage via pre-signed URLs; processing happens in workers.
> - Real-time messages are small notifications; data still flows through the authorised API.
> - Payments: server-side amounts, verified idempotent webhooks, a state machine, reconciliation.
> - UTC instants, date-only dates, IANA zones; Cairo has DST again.
> - AI features run server-side, see only what the user may see, stream, and treat output as untrusted.

## Sources

- Microsoft Learn: [Create a user delegation SAS](https://learn.microsoft.com/en-us/azure/storage/blobs/storage-blob-user-delegation-sas-create-dotnet), [Upload files in ASP.NET Core](https://learn.microsoft.com/en-us/aspnet/core/mvc/models/file-uploads), [SignalR overview](https://learn.microsoft.com/en-us/aspnet/core/signalr/introduction), [Scale out SignalR (Redis backplane)](https://learn.microsoft.com/en-us/aspnet/core/signalr/redis-backplane), [Azure SignalR Service](https://learn.microsoft.com/en-us/azure/azure-signalr/signalr-overview), [Globalization and localization](https://learn.microsoft.com/en-us/aspnet/core/fundamentals/localization), [Microsoft Defender for Storage malware scanning](https://learn.microsoft.com/en-us/azure/defender-for-cloud/defender-for-storage-malware-scan).
- OWASP: [File Upload Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html), [CSV Injection](https://owasp.org/www-community/attacks/CSV_Injection), [Top 10 for LLM Applications](https://genai.owasp.org/llm-top-10/).
- Payment gateways' developer documentation: [Paymob](https://developers.paymob.com/), [Fawry](https://developer.fawrystaging.com/), [Kashier](https://developers.kashier.io/), [Stripe webhooks](https://docs.stripe.com/webhooks); [PCI Security Standards Council](https://www.pcisecuritystandards.org/).
- Google, [Email sender guidelines](https://support.google.com/a/answer/81126) (SPF, DKIM, DMARC requirements from 2024).
- IANA [Time Zone Database](https://www.iana.org/time-zones), which records Egypt's reinstatement of daylight saving time from April 2023 (`Africa/Cairo`).
