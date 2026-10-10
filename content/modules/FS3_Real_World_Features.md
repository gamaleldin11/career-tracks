# Real-World Features — Uploads, Real-Time, Payments, Email, Search, Time Zones and AI

Take-home tasks and "tell me about a feature you built" questions rarely stop at CRUD. They ask about the features where full-stack work gets hard: a large CSV import, a live dashboard, an Egyptian payment gateway, Arabic and English together, an AI assistant. You've built most of these (FinSight's CSV ingestion, SignalR updates and LangFlow assistant; Paymob, Fawry, Kashier and Stripe guides in your template library; a bilingual site). This module gives each one a production-quality design you can describe end to end.

> [!focus]
> **Entry must:** upload a file safely; push live updates with SignalR; describe a payment flow including the callback; store times in UTC; build a bilingual UI.
> **Mid adds:** direct-to-blob uploads with pre-signed URLs, background imports with per-row error reports, scaling SignalR, idempotent payment state machines and reconciliation, email deliverability, search options, time zones with DST, server-side AI features with streaming and cost controls.
> **Most asked:** *How would you handle uploading a 500 MB file?* · *How do you notify users in real time?* · *Walk me through integrating a payment gateway* · *How do you handle time zones?* · *How would you add an AI assistant safely?*
> **Time budget:** 3 hours.

## FS3.0 Foundations: work that doesn't fit in a request 🟢

A request should finish in well under a second: the user is waiting, proxies and load balancers time out (often after 30 to 100 seconds), and a server tied up with slow requests has less capacity for everyone else. Yet many real features take longer or depend on someone else's timing: importing 50,000 rows, building a report, sending email, a customer paying on a gateway's page, a model writing an answer.

They all use one shape:

1. The request **records the intent and returns quickly**: `202 Accepted` with an ID to track, or an order in a `Pending` state.
2. The slow part runs **somewhere else**: a background **worker** reading a queue, or an external system (a payment gateway) that calls you back later through a **webhook**.
3. The UI learns the outcome by **push** (SignalR, Server-Sent Events) or by **polling** a status endpoint.
4. Anything in between can fail and be retried, so each step must be **idempotent**: doing it twice has the same effect as doing it once.

<figure class="dia anim"><svg viewBox="0 0 720 238" role="img" aria-label="Animation: the browser sends a request, the API enqueues work and returns 202 with an ID, a worker processes the job and pushes progress to the browser through a SignalR hub">
<rect class="sB" x="14" y="80" width="110" height="60" rx="8"/><text class="sT" x="69" y="108" text-anchor="middle">browser</text><text class="sC" x="69" y="124" text-anchor="middle">shows progress</text>
<rect class="sA" x="200" y="20" width="140" height="50" rx="8"/><text class="sT" x="270" y="43" text-anchor="middle">API</text><text class="sC" x="270" y="59" text-anchor="middle">validate · enqueue</text>
<rect class="sW" x="390" y="20" width="130" height="50" rx="8"/><text class="sT" x="455" y="43" text-anchor="middle">queue</text><text class="sC" x="455" y="59" text-anchor="middle">ImportRequested</text>
<rect class="sV" x="570" y="20" width="136" height="50" rx="8"/><text class="sT" x="638" y="43" text-anchor="middle">worker</text><text class="sC" x="638" y="59" text-anchor="middle">the slow part</text>
<rect class="sG" x="380" y="150" width="160" height="46" rx="8"/><text class="sT" x="460" y="171" text-anchor="middle">SignalR hub</text><text class="sC" x="460" y="187" text-anchor="middle">progress events</text>
<line class="sL" x1="124" y1="94" x2="198" y2="50" marker-end="url(#ah)"/><line class="sL" x1="340" y1="45" x2="388" y2="45" marker-end="url(#ah)"/><line class="sL" x1="520" y1="45" x2="568" y2="45" marker-end="url(#ah)"/>
<line class="sLg" x1="210" y1="70" x2="128" y2="114" marker-end="url(#ahg)" stroke-dasharray="5 4"/><text class="sGt" x="196" y="104">202 + importId</text>
<line class="sLm" x1="630" y1="70" x2="542" y2="168" marker-end="url(#ahm)"/><line class="sLm" x1="380" y1="173" x2="128" y2="128" marker-end="url(#ahm)"/><text class="sC" x="250" y="172" text-anchor="middle">push: 40%… 80%… done</text>
<circle class="sP" r="5"><animateMotion dur="3s" repeatCount="indefinite" path="M124 94 L200 50 H570"/></circle>
<circle class="sPg" r="5"><animateMotion dur="3s" begin="0.9s" repeatCount="indefinite" path="M210 70 L128 114"/></circle>
<circle class="sPv" r="5"><animateMotion dur="3s" begin="1.6s" repeatCount="indefinite" path="M630 70 L542 168 H380 L128 128"/></circle>
<text class="sS" x="360" y="226" text-anchor="middle">the request takes milliseconds; the work takes as long as it takes, and the UI is told when it's done</text>
</svg><figcaption>Accept quickly, work in the background, report back. Uploads, imports, payments, email and AI answers are all versions of this picture.</figcaption></figure>

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

<figure class="dia"><svg viewBox="0 0 720 240" role="img" aria-label="A CSV import worker streams rows through parsing and validation, bulk-inserts valid rows in batches, collects errors into a report and publishes progress">
<rect class="sB" x="14" y="50" width="96" height="120" rx="6"/><text class="sT" x="62" y="70" text-anchor="middle">orders.csv</text>
<line class="sLm" x1="26" y1="86" x2="98" y2="86"/>
<line class="sLm" x1="26" y1="99" x2="98" y2="99"/>
<line class="sLm" x1="26" y1="112" x2="98" y2="112"/>
<line class="sLr" x1="26" y1="125" x2="98" y2="125"/>
<line class="sLm" x1="26" y1="138" x2="98" y2="138"/>
<line class="sLm" x1="26" y1="151" x2="98" y2="151"/>
<line class="sL" x1="110" y1="110" x2="146" y2="110" marker-end="url(#ah)"/><text class="sC" x="128" y="100" text-anchor="middle">stream</text>
<rect class="sA" x="150" y="80" width="170" height="60" rx="8"/><text class="sT" x="235" y="108" text-anchor="middle">parse + validate</text><text class="sC" x="235" y="124" text-anchor="middle">one row at a time</text>
<line class="sLg" x1="320" y1="96" x2="376" y2="56" marker-end="url(#ahg)"/><rect class="sG" x="380" y="30" width="160" height="46" rx="8"/><text class="sT" x="460" y="51" text-anchor="middle">batch of 1,000 valid</text><text class="sC" x="460" y="67" text-anchor="middle">bulk insert</text><line class="sLg" x1="540" y1="53" x2="576" y2="53" marker-end="url(#ahg)"/><rect class="sB" x="580" y="30" width="126" height="46" rx="8"/><text class="sT" x="643" y="58" text-anchor="middle">database</text>
<line class="sLr" x1="320" y1="116" x2="376" y2="122" marker-end="url(#ahr)"/><rect class="sR" x="380" y="100" width="326" height="46" rx="8" opacity=".85"/><text class="sT" x="543" y="120" text-anchor="middle">error report</text><text class="sC" x="543" y="137" text-anchor="middle">row 214: amount "twelve" is not a number</text>
<line class="sLm" x1="235" y1="140" x2="235" y2="190"/><line class="sLm" x1="235" y1="190" x2="376" y2="190" marker-end="url(#ahm)"/>
<rect class="sN" x="380" y="176" width="326" height="28" rx="6"/><path class="sV" d="M386 176 h196 v28 h-196 a6 6 0 0 1 -6 -6 v-16 a6 6 0 0 1 6 -6 z"/><text class="sC" x="543" y="195" text-anchor="middle">progress over SignalR: 62%</text>
<text class="sS" x="360" y="228" text-anchor="middle">memory stays flat for any file size; a file hash stops the same file being imported twice</text>
</svg><figcaption>The import worker. Two outputs matter as much as the data: the error report and the progress the user watches.</figcaption></figure>

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

<figure class="dia steps" data-start="1"><svg viewBox="0 0 720 244" role="img" aria-label="With two API instances, a SignalR message sent on instance B never reaches a browser connected to instance A, until a Redis backplane relays messages between instances">
<rect class="sB" x="14" y="37" width="110" height="50" rx="8"/><text class="sT" x="69" y="60" text-anchor="middle">browser 1</text><text class="sC" x="69" y="76" text-anchor="middle">company 7</text><rect class="sB" x="14" y="147" width="110" height="50" rx="8"/><text class="sT" x="69" y="170" text-anchor="middle">browser 2</text><text class="sC" x="69" y="186" text-anchor="middle">company 9</text>
<rect class="sA" x="200" y="37" width="150" height="50" rx="8"/><text class="sT" x="275" y="60" text-anchor="middle">instance A</text><text class="sC" x="275" y="76" text-anchor="middle">holds browser 1</text><rect class="sA" x="200" y="147" width="150" height="50" rx="8"/><text class="sT" x="275" y="170" text-anchor="middle">instance B</text><text class="sC" x="275" y="186" text-anchor="middle">holds browser 2</text>
<line class="sLm" x1="124" y1="62" x2="200" y2="62"/><line class="sLm" x1="124" y1="172" x2="200" y2="172"/>
<rect class="sV" x="580" y="147" width="126" height="50" rx="8"/><text class="sT" x="643" y="170" text-anchor="middle">forecast job</text><text class="sC" x="643" y="186" text-anchor="middle">runs on B</text>
<line class="sLw" x1="580" y1="172" x2="354" y2="172" marker-end="url(#ahw)"/><text class="sWt" x="467" y="192" text-anchor="middle">send to company:7</text>
<g data-s="1-1"><line class="sLr" x1="200" y1="72" x2="128" y2="72" marker-end="url(#ahr)" stroke-dasharray="4 4"/><text class="sRt" x="162" y="108" text-anchor="middle">✗ never arrives</text><text class="sRt" x="360" y="232" text-anchor="middle">B only knows its own connections; browser 1 is on A</text></g>
<g data-s="2-2"><rect class="sR" x="410" y="70" width="120" height="50" rx="8"/><text class="sT" x="470" y="93" text-anchor="middle">Redis</text><text class="sC" x="470" y="109" text-anchor="middle">backplane</text><line class="sLg" x1="330" y1="147" x2="420" y2="120" marker-end="url(#ahg)"/><line class="sLg" x1="420" y1="80" x2="354" y2="66" marker-end="url(#ahg)"/><line class="sLg" x1="200" y1="70" x2="128" y2="70" marker-end="url(#ahg)"/><text class="sGt" x="162" y="108" text-anchor="middle">✓ delivered</text><text class="sGt" x="360" y="232" text-anchor="middle">Redis pub/sub relays every message to every instance</text></g>
<g class="pk" data-s="1"><circle class="sPw" r="5"><animateMotion dur="1s" begin="indefinite" fill="freeze" path="M580 172 H354"/></circle></g><g class="pk" data-s="2"><circle class="sPg" r="5"><animateMotion dur="2s" begin="indefinite" fill="freeze" path="M580 172 H354 L420 120 L354 66 H128"/></circle></g>
</svg><ol class="dia-steps">
<li>Two instances behind a load balancer. The job runs on B and sends to company 7's group, but browser 1 is connected to A, so the message is silently lost.</li>
<li>A <b>Redis backplane</b> publishes every hub message to all instances, and A delivers it. <b>Azure SignalR Service</b> goes further: clients connect to the service, so instances hold no connections at all.</li>
</ol><figcaption>Real-time works on one server and breaks on two. Plan for the backplane before you scale out.</figcaption></figure>

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

<figure class="dia steps"><svg viewBox="0 0 720 332" role="img" aria-label="Payment sequence: the server creates a pending order, gets a payment key from the gateway, the customer pays on the gateway page, the gateway's signed webhook marks the order paid, and the redirect is only for the user interface">
<text class="sT" x="70" y="22" text-anchor="middle">customer browser</text><text class="sT" x="330" y="22" text-anchor="middle">your server</text><text class="sT" x="620" y="22" text-anchor="middle">gateway (Paymob, Fawry…)</text>
<line class="sD" x1="70" y1="32" x2="70" y2="306"/>
<line class="sD" x1="330" y1="32" x2="330" y2="306"/>
<line class="sD" x1="620" y1="32" x2="620" y2="306"/>
<g data-s="1"><line class="sL" x1="70" y1="54" x2="326" y2="54" marker-end="url(#ah)"/><text class="sC" x="200" y="48" text-anchor="middle">POST /checkout { courseId }</text><rect class="sW" x="220" y="62" width="220" height="22" rx="11"/><text class="sC" x="330" y="77" text-anchor="middle">order 881 · Pending · 1,500 EGP</text></g>
<g data-s="2"><line class="sL" x1="330" y1="106" x2="616" y2="106" marker-end="url(#ah)"/><text class="sC" x="475" y="100" text-anchor="middle">create intention: 1,500 EGP, ref 881</text><line class="sLm" x1="620" y1="130" x2="334" y2="130" marker-end="url(#ahm)"/><text class="sC" x="475" y="124" text-anchor="middle">payment key / checkout URL</text></g>
<g data-s="3"><line class="sLm" x1="330" y1="158" x2="74" y2="158" marker-end="url(#ahm)"/><text class="sC" x="200" y="152" text-anchor="middle">open hosted page or iframe</text><line class="sL" x1="70" y1="184" x2="616" y2="184" marker-end="url(#ah)"/><text class="sC" x="345" y="178" text-anchor="middle">card or wallet details: never through you</text></g>
<g data-s="4"><line class="sLg" x1="620" y1="214" x2="334" y2="214" marker-end="url(#ahg)"/><text class="sGt" x="475" y="208" text-anchor="middle">signed webhook: paid, txn 5531</text><rect class="sG" x="230" y="222" width="200" height="22" rx="11"/><text class="sC" x="330" y="237" text-anchor="middle">verify HMAC + amount → Paid</text></g>
<g data-s="5"><line class="sLm" x1="620" y1="264" x2="74" y2="264" marker-end="url(#ahm)" stroke-dasharray="5 4"/><text class="sC" x="345" y="258" text-anchor="middle">redirect to /thank-you: UX only</text></g>
<g data-s="6"><rect class="sV" x="230" y="274" width="200" height="22" rx="11"/><text class="sC" x="330" y="289" text-anchor="middle">outbox → grant access, receipt</text></g>
<g data-s="7"><text class="sS" x="330" y="320" text-anchor="middle">every night: reconcile orders against the gateway's settlement report</text></g>
</svg><ol class="dia-steps">
<li>The server creates the order with the price <b>it</b> looks up. A price sent by the browser is never trusted.</li>
<li>The server asks the gateway for a payment session, passing the order ID as the reference.</li>
<li>The customer pays on the gateway's hosted page. Card numbers never touch your servers, which keeps you out of most PCI DSS scope.</li>
<li>The gateway calls your webhook server-to-server. Verify the signature, the amount, the currency and the reference, then move the order to <code>Paid</code>, idempotently by transaction ID. <b>This</b> is the source of truth.</li>
<li>The browser is redirected to a thank-you page. Show "confirming…" and poll the order's status; never mark anything paid from here.</li>
<li>The <code>Paid</code> transition writes an outbox event; a worker grants course access and emails the receipt.</li>
<li>A daily reconciliation job catches the webhook that never arrived or arrived twice.</li>
</ol><figcaption>Two channels back from the gateway: a signed server-to-server webhook you trust, and a browser redirect you don't.</figcaption></figure>

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

<figure class="dia"><svg viewBox="0 0 720 236" role="img" aria-label="Order state machine: Pending to Paid to Fulfilled, Pending to Failed or Expired, and Paid to Refunded or PartiallyRefunded">
<rect class="sW" x="40" y="70" width="140" height="48" rx="8"/><text class="sT" x="110" y="92" text-anchor="middle">Pending</text><text class="sC" x="110" y="108" text-anchor="middle">order created</text><rect class="sG" x="290" y="70" width="140" height="48" rx="8"/><text class="sT" x="360" y="92" text-anchor="middle">Paid</text><text class="sC" x="360" y="108" text-anchor="middle">webhook verified</text><rect class="sA" x="540" y="70" width="140" height="48" rx="8"/><text class="sT" x="610" y="92" text-anchor="middle">Fulfilled</text><text class="sC" x="610" y="108" text-anchor="middle">access granted</text>
<line class="sLg" x1="180" y1="94" x2="286" y2="94" marker-end="url(#ahg)"/><text class="sC" x="233" y="86" text-anchor="middle">signed callback</text><line class="sL" x1="430" y1="94" x2="536" y2="94" marker-end="url(#ah)"/><text class="sC" x="483" y="86" text-anchor="middle">outbox</text>
<line class="sLr" x1="90" y1="118" x2="74" y2="172" marker-end="url(#ahr)"/><line class="sLr" x1="130" y1="118" x2="214" y2="172" marker-end="url(#ahr)"/>
<rect class="sR" x="14" y="176" width="120" height="46" rx="8"/><text class="sT" x="74" y="197" text-anchor="middle">Failed</text><text class="sC" x="74" y="213" text-anchor="middle">declined</text><rect class="sN" x="146" y="176" width="150" height="46" rx="8"/><text class="sT" x="221" y="197" text-anchor="middle">Expired</text><text class="sC" x="221" y="213" text-anchor="middle">Fawry code timed out</text>
<line class="sLm" x1="340" y1="118" x2="368" y2="172" marker-end="url(#ahm)"/><line class="sLm" x1="390" y1="118" x2="520" y2="172" marker-end="url(#ahm)"/>
<rect class="sV" x="310" y="176" width="120" height="46" rx="8"/><text class="sT" x="370" y="197" text-anchor="middle">Refunded</text><text class="sC" x="370" y="213" text-anchor="middle">full amount</text><rect class="sV" x="446" y="176" width="190" height="46" rx="8"/><text class="sT" x="541" y="197" text-anchor="middle">PartiallyRefunded</text><text class="sC" x="541" y="213" text-anchor="middle">some of it</text>
<text class="sRt" x="360" y="30" text-anchor="middle">any transition not drawn here (a "paid" event for a refunded order) → log, alert, don't apply</text>
</svg><figcaption>Explicit states and transitions make duplicate, late or out-of-order webhooks harmless.</figcaption></figure>

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

<figure class="dia"><svg viewBox="0 0 720 266" role="img" aria-label="A due date stored as midnight Cairo time is the instant 22:00 UTC on 31 March, which a user in London sees as 31 March">
<text class="sT" x="150" y="62" text-anchor="end">UTC</text>
<rect class="sB" x="160" y="46" width="260" height="24" rx="4"/><text class="sC" x="290" y="62" text-anchor="middle">31 Mar</text>
<rect class="sA" x="420" y="46" width="260" height="24" rx="4"/><text class="sC" x="550" y="62" text-anchor="middle">1 Apr</text>
<text class="sT" x="150" y="122" text-anchor="end">Cairo (UTC+2)</text>
<rect class="sB" x="160" y="106" width="130" height="24" rx="4"/><text class="sC" x="225" y="122" text-anchor="middle">31 Mar</text>
<rect class="sA" x="290" y="106" width="390" height="24" rx="4"/><text class="sC" x="485" y="122" text-anchor="middle">1 Apr</text>
<text class="sT" x="150" y="182" text-anchor="end">London (UTC+1)</text>
<rect class="sB" x="160" y="166" width="195" height="24" rx="4"/><text class="sC" x="257.5" y="182" text-anchor="middle">31 Mar</text>
<rect class="sA" x="355" y="166" width="325" height="24" rx="4"/><text class="sC" x="517.5" y="182" text-anchor="middle">1 Apr</text>
<line class="sLr" x1="290" y1="36" x2="290" y2="214" stroke-width="2"/>
<text class="sRt" x="296" y="84">reads 31 Mar 22:00</text><text class="sGt" x="296" y="144">reads 1 Apr 00:00 ✓</text><text class="sRt" x="296" y="204">reads 31 Mar 23:00: "due 31 Mar" ✗</text>
<text class="sC" x="160" y="230" text-anchor="middle">20:00Z</text>
<text class="sC" x="290" y="230" text-anchor="middle">22:00Z</text>
<text class="sC" x="420" y="230" text-anchor="middle">00:00Z</text>
<text class="sC" x="550" y="230" text-anchor="middle">02:00Z</text>
<text class="sC" x="680" y="230" text-anchor="middle">04:00Z</text>
<text class="sRt" x="290" y="30" text-anchor="middle">stored instant</text>
<text class="sS" x="360" y="254" text-anchor="middle">a due date is a calendar date, not an instant: store DateOnly 2026-04-01 and every zone reads 1 April</text>
</svg><figcaption>Why calendar dates and instants are different types. Stored as a Cairo-midnight timestamp, "due 1 April" becomes 31 March in London.</figcaption></figure>

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

<figure class="dia"><svg viewBox="0 0 720 258" role="img" aria-label="AI feature architecture: the browser sends a question to the server, which authenticates and budgets it, retrieves only this tenant's data, calls the LLM with a server-side key, validates the output and streams it back">
<rect class="sB" x="14" y="96" width="110" height="50" rx="8"/><text class="sT" x="69" y="119" text-anchor="middle">browser</text><text class="sC" x="69" y="135" text-anchor="middle">question</text>
<rect class="sN" x="160" y="20" width="260" height="206" rx="12"/><text class="sT" x="290" y="40" text-anchor="middle">your server</text>
<rect class="sB" x="176" y="54" width="228" height="40" rx="6"/><text class="sC" x="290" y="79" text-anchor="middle">auth · rate limit · token budget</text>
<rect class="sG" x="176" y="106" width="228" height="40" rx="6"/><text class="sC" x="290" y="131" text-anchor="middle">retrieve: this tenant's data only</text>
<rect class="sW" x="176" y="158" width="228" height="40" rx="6"/><text class="sC" x="290" y="183" text-anchor="middle">validate output · sanitise</text>
<line class="sL" x1="124" y1="110" x2="172" y2="76" marker-end="url(#ah)"/><line class="sLm" x1="290" y1="94" x2="290" y2="104" marker-end="url(#ahm)"/>
<rect class="sB" x="560" y="30" width="146" height="50" rx="8"/><text class="sT" x="633" y="53" text-anchor="middle">database</text><text class="sC" x="633" y="69" text-anchor="middle">authorised queries</text><line class="sLg" x1="404" y1="120" x2="556" y2="62" marker-end="url(#ahg)"/>
<rect class="sV" x="470" y="110" width="130" height="54" rx="8"/><text class="sT" x="535" y="135" text-anchor="middle">LLM</text><text class="sC" x="535" y="151" text-anchor="middle">server-side key</text>
<line class="sL" x1="404" y1="132" x2="466" y2="132" marker-end="url(#ah)"/><line class="sLw" x1="500" y1="164" x2="408" y2="178" marker-end="url(#ahw)"/><text class="sWt" x="560" y="186" text-anchor="middle">tokens stream back</text>
<line class="sLm" x1="176" y1="186" x2="128" y2="136" marker-end="url(#ahm)"/><text class="sC" x="100" y="200" text-anchor="middle">SSE stream</text>
<text class="sRt" x="360" y="246" text-anchor="middle">retrieved documents may hide instructions: keep tools least-privileged and confirm side effects</text>
</svg><figcaption>The model is a powerful, untrusted component. Everything that touches users, data or money sits in your code around it.</figcaption></figure>

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
