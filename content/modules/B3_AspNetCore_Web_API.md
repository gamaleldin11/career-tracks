# ASP.NET Core Web API — The Pipeline, Endpoints, Validation, Errors and OpenAPI

This is your home ground: FinSight's backend, ITI's Web API labs, CS Visualizer's API. Interviews here go beyond "I built CRUD endpoints". They ask what happens to a request between Kestrel and your controller, why middleware order matters, where validation and error handling belong, and how you'd call another API safely. Everything below targets **ASP.NET Core 10** (the November 2025 LTS).

> [!focus]
> **Entry must:** the middleware pipeline and why order matters; controllers vs minimal APIs; routing and model binding; validation and automatic 400s; ProblemDetails and global error handling; configuration and environments; OpenAPI.
> **Mid adds:** filters vs middleware, writing custom middleware, IHttpClientFactory and typed clients, background services, rate limiting and output caching, health checks, what changed in .NET 9 and 10.
> **Most asked:** *Explain the middleware pipeline* · *Middleware vs filters?* · *Controllers or minimal APIs?* · *How do you handle errors globally?* · *How do you validate input?* · *Why IHttpClientFactory?* · *What does `[ApiController]` do?*
> **Time budget:** 4 hours, with `dotnet new webapi` open.

## B3.0 Foundations: what a web framework does for you 🟢

A web API is a program that listens on a port, reads HTTP requests and writes HTTP responses. Everything else is help from the framework:

1. **A server** (Kestrel) accepts connections and parses raw HTTP into objects.
2. **Hosting** wires up dependency injection, configuration and logging before the first request ([[B1.11]], [[S10.6]]).
3. **Middleware** runs code for every request: errors, HTTPS, CORS, authentication.
4. **Routing** maps the method and path to one piece of your code, an **endpoint**.
5. **Model binding and validation** turn the route, query and JSON body into typed C# objects and reject bad input.
6. **Serialisation** turns your return value back into JSON (`System.Text.Json`, camelCase property names by default).

<figure class="dia"><svg viewBox="0 0 720 232" role="img" aria-label="Raw HTTP bytes are parsed by Kestrel into an HttpContext object, and model binding turns the JSON body into a typed, validated request object">
<rect class="sB" x="14" y="20" width="220" height="200" rx="10"/><text class="sT" x="124" y="40" text-anchor="middle">bytes on a socket</text>
<text class="sC" x="22" y="62" xml:space="preserve" style="white-space:pre">POST /api/invoices HTTP/1.1</text>
<text class="sC" x="22" y="82" xml:space="preserve" style="white-space:pre">Host: api.example.com</text>
<text class="sC" x="22" y="102" xml:space="preserve" style="white-space:pre">Authorization: Bearer eyJ…</text>
<text class="sC" x="22" y="122" xml:space="preserve" style="white-space:pre">Content-Type: application/json</text>
<text class="sC" x="22" y="142" xml:space="preserve" style="white-space:pre"></text>
<text class="sC" x="22" y="162" xml:space="preserve" style="white-space:pre">{"customer":"Nile Foods",</text>
<text class="sC" x="22" y="182" xml:space="preserve" style="white-space:pre"> "amount":900}</text>
<line class="sL" x1="236" y1="120" x2="270" y2="120" marker-end="url(#ah)"/><text class="sC" x="253" y="110" text-anchor="middle">Kestrel</text>
<rect class="sA" x="274" y="20" width="230" height="200" rx="10"/><text class="sT" x="389" y="40" text-anchor="middle">HttpContext</text>
<text class="sC" x="286" y="62">Request.Method = "POST"</text>
<text class="sC" x="286" y="82">Request.Path = "/api/invoices"</text>
<text class="sC" x="286" y="102">Request.Headers[…]</text>
<text class="sC" x="286" y="122">Request.Body (a stream)</text>
<text class="sC" x="286" y="142">User (after authentication)</text>
<text class="sC" x="286" y="162">RequestServices (DI scope)</text>
<text class="sC" x="286" y="182">RequestAborted (cancellation)</text>
<line class="sL" x1="506" y1="120" x2="540" y2="120" marker-end="url(#ah)"/><text class="sC" x="523" y="110" text-anchor="middle">binding</text>
<rect class="sG" x="544" y="54" width="162" height="112" rx="10"/><text class="sT" x="625" y="74" text-anchor="middle">CreateInvoiceRequest</text><text class="sC" x="625" y="98" text-anchor="middle">Customer = "Nile Foods"</text><text class="sC" x="625" y="116" text-anchor="middle">Amount = 900</text><text class="sGt" x="625" y="146" text-anchor="middle">validated, typed</text>
</svg><figcaption>What the framework does before your code runs: parse bytes into an <code>HttpContext</code>, then bind and validate a typed object. On the way out it serialises your object back to JSON.</figcaption></figure>

`HttpContext` is the object every middleware and endpoint receives: the request, the response being built, the authenticated `User`, the request's DI scope (`RequestServices`) and `RequestAborted`, the token that fires if the client disconnects.

## B3.1 What happens to a request 🟢 ⭐

<figure class="dia anim"><svg viewBox="0 0 720 200" role="img" aria-label="Animation: a request passes through Kestrel and each middleware to the endpoint, and the response flows back through them in reverse">
<rect class="sB" x="10" y="70" width="80" height="50" rx="8"/><text class="sT" x="50" y="100" text-anchor="middle">Kestrel</text>
<g class="sT" text-anchor="middle">
<rect class="sA" x="110" y="30" width="96" height="130" rx="8"/><text x="158" y="60">Exception</text><text x="158" y="76">handler</text>
<rect class="sA" x="216" y="30" width="80" height="130" rx="8"/><text x="256" y="68">HTTPS</text><text x="256" y="84">redirect</text>
<rect class="sA" x="306" y="30" width="80" height="130" rx="8"/><text x="346" y="76">Routing</text>
<rect class="sA" x="396" y="30" width="70" height="130" rx="8"/><text x="431" y="76">CORS</text>
<rect class="sA" x="476" y="30" width="80" height="130" rx="8"/><text x="516" y="68">AuthN</text><text x="516" y="84">AuthZ</text>
<rect class="sG" x="566" y="30" width="144" height="130" rx="8"/><text x="638" y="68">Endpoint</text><text x="638" y="84">(filters → action)</text>
</g>
<line class="sL" x1="90" y1="85" x2="110" y2="85"/><text class="sM" x="120" y="185">request →  each middleware can act, then call next() …  ← response flows back in reverse</text>
<circle class="sP" r="6"><animateMotion dur="6s" repeatCount="indefinite" calcMode="linear" path="M50 70 H638 V140 H50" keyPoints="0;0.47;0.53;1" keyTimes="0;0.45;0.55;1"/></circle>
<text class="sM" x="40" y="58">→ request</text><text class="sGt" x="40" y="160">← response</text>
</svg><figcaption>The pipeline is a chain of middleware. Each one can handle the request, short-circuit it, or call the next, and sees the response on the way back out.</figcaption></figure>

1. **Kestrel**, ASP.NET Core's built-in web server, receives the connection (usually behind a reverse proxy or load balancer that terminates TLS, [[S1.5]]).
2. An `HttpContext` is created and passed through the **middleware pipeline** in the order you registered it.
3. **Routing** matches the URL to an **endpoint** (a controller action or a minimal-API handler).
4. Authentication, authorisation, CORS and rate limiting run against that endpoint's metadata.
5. The endpoint runs: model binding, validation, filters, your code (usually calling services and the database).
6. The response travels back **through the same middleware in reverse**.

## B3.2 The middleware pipeline 🟢 ⭐

```csharp
var builder = WebApplication.CreateBuilder(args);
builder.Services.AddControllers();
builder.Services.AddProblemDetails();
builder.Services.AddExceptionHandler<GlobalExceptionHandler>();
builder.Services.AddAuthentication().AddJwtBearer();
builder.Services.AddAuthorization();
builder.Services.AddCors(o => o.AddPolicy("spa", p => p.WithOrigins(spaOrigin).AllowAnyHeader().AllowAnyMethod().AllowCredentials()));
builder.Services.AddRateLimiter(o => o.AddFixedWindowLimiter("api", l => { l.PermitLimit = 100; l.Window = TimeSpan.FromMinutes(1); }));
builder.Services.AddOpenApi();
builder.Services.AddHealthChecks().AddDbContextCheck<AppDbContext>();

var app = builder.Build();

app.UseExceptionHandler();          // 1. outermost: catches everything below it
if (!app.Environment.IsDevelopment()) app.UseHsts();
app.UseHttpsRedirection();
app.UseRouting();                   // (implicit in minimal hosting, but order still matters)
app.UseCors("spa");                 // after routing, before auth
app.UseAuthentication();            // who are you?
app.UseAuthorization();             // are you allowed?
app.UseRateLimiter();
app.MapOpenApi();
app.MapHealthChecks("/health");
app.MapControllers().RequireRateLimiting("api");
app.Run();
```

**Why order matters:** each middleware only sees what earlier ones let through, and only handles what comes after it. The exception handler must be first to catch errors from everything else; authentication must come before authorisation; CORS must run before authentication so preflight `OPTIONS` requests aren't rejected for lacking a token.

**Writing your own:**

```csharp
public class CorrelationIdMiddleware(RequestDelegate next)
{
    public async Task InvokeAsync(HttpContext ctx, ILogger<CorrelationIdMiddleware> log)
    {
        var id = ctx.Request.Headers["X-Correlation-Id"].FirstOrDefault() ?? Guid.NewGuid().ToString();
        ctx.Response.Headers["X-Correlation-Id"] = id;
        using (log.BeginScope(new Dictionary<string, object> { ["CorrelationId"] = id }))
            await next(ctx);                       // call the rest of the pipeline
    }
}
app.UseMiddleware<CorrelationIdMiddleware>();
```

`app.Use(...)` adds middleware that can call `next`; `app.Run(...)` adds a **terminal** middleware that ends the chain; `app.Map(...)` branches the pipeline by path.

<figure class="dia steps" data-start="1"><svg viewBox="0 0 720 180" role="img" aria-label="Four paths through the middleware: a normal request, a missing token rejected at authentication, an exception caught by the outer handler, and a CORS preflight answered early">
<rect class="sA" x="30" y="40" width="120" height="60" rx="8"/><text class="sT" x="90" y="74" text-anchor="middle">Exception handler</text>
<rect class="sA" x="166" y="40" width="120" height="60" rx="8"/><text class="sT" x="226" y="74" text-anchor="middle">CORS</text>
<rect class="sA" x="302" y="40" width="120" height="60" rx="8"/><text class="sT" x="362" y="74" text-anchor="middle">AuthN</text>
<rect class="sA" x="438" y="40" width="120" height="60" rx="8"/><text class="sT" x="498" y="74" text-anchor="middle">AuthZ</text>
<rect class="sG" x="574" y="40" width="120" height="60" rx="8"/><text class="sT" x="634" y="74" text-anchor="middle">Endpoint</text>
<g data-s="1-1"><path class="sL" d="M40 30 H634 V38" marker-end="url(#ah)"/><path class="sLg" d="M634 102 V118 H60 V104" marker-end="url(#ahg)"/><text class="sS" x="360" y="146" text-anchor="middle">a normal request reaches the endpoint and returns through every middleware</text><text class="sGt" x="360" y="168" text-anchor="middle">200 OK + JSON</text></g>
<g data-s="2-2"><path class="sL" d="M40 30 H362 V38" marker-end="url(#ah)"/><path class="sLr" d="M362 102 V118 H60 V104" marker-end="url(#ahr)"/><text class="sS" x="360" y="146" text-anchor="middle">no valid token: authentication can't identify the user; the challenge returns early</text><text class="sRt" x="360" y="168" text-anchor="middle">401: the endpoint never runs</text></g>
<g data-s="3-3"><path class="sL" d="M40 30 H634 V38" marker-end="url(#ah)"/><path class="sLr" d="M634 102 V118 H60 V104" marker-end="url(#ahr)"/><text class="sS" x="360" y="146" text-anchor="middle">the endpoint throws: the exception unwinds back out to the exception handler</text><text class="sRt" x="360" y="168" text-anchor="middle">500 ProblemDetails with a traceId</text></g>
<g data-s="4-4"><path class="sL" d="M40 30 H226 V38" marker-end="url(#ah)"/><path class="sLw" d="M226 102 V118 H60 V104" marker-end="url(#ahw)"/><text class="sS" x="360" y="146" text-anchor="middle">a CORS preflight (OPTIONS) is answered by the CORS middleware itself</text><text class="sWt" x="360" y="168" text-anchor="middle">204 with Access-Control-Allow-* headers</text></g>
</svg><ol class="dia-steps">
<li>The normal path: every middleware passes the request on, the endpoint runs, and the response travels back out through each of them.</li>
<li>No token: authentication can't identify the caller, so an authorised endpoint gets a 401 challenge without ever running your code.</li>
<li>Your code throws: the exception propagates back up the chain until the outermost middleware, the exception handler, turns it into ProblemDetails.</li>
<li>A preflight <code>OPTIONS</code> request is answered by the CORS middleware, which is why it must sit before authentication: preflights carry no token.</li>
</ol><figcaption>Middleware order decides who gets to answer. Each scenario stops at a different place.</figcaption></figure>

> [!say]
> "ASP.NET Core passes each request through a chain of middleware in the order registered; each one can act, short-circuit, or call next, and sees the response on the way back. Order matters: the exception handler goes first so it catches everything, CORS before authentication so preflights work, and authentication before authorisation. It's the Chain of Responsibility pattern."

## B3.3 Controllers or minimal APIs? 🟢 ⭐

```csharp
// Controller style
[ApiController]
[Route("api/[controller]")]
public class InvoicesController(IInvoiceService service) : ControllerBase
{
    [HttpGet("{id:guid}")]
    [ProducesResponseType<InvoiceDto>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<InvoiceDto>> Get(Guid id, CancellationToken ct)
        => await service.GetAsync(id, ct) is { } dto ? Ok(dto) : NotFound();

    [HttpPost]
    public async Task<ActionResult<InvoiceDto>> Create(CreateInvoiceRequest req, CancellationToken ct)
    {
        var dto = await service.CreateAsync(req, ct);
        return CreatedAtAction(nameof(Get), new { id = dto.Id }, dto);   // 201 + Location header
    }
}

// Minimal API style, the same endpoints
var invoices = app.MapGroup("/api/invoices").RequireAuthorization().WithTags("Invoices");
invoices.MapGet("/{id:guid}", async Task<Results<Ok<InvoiceDto>, NotFound>> (Guid id, IInvoiceService s, CancellationToken ct)
    => await s.GetAsync(id, ct) is { } dto ? TypedResults.Ok(dto) : TypedResults.NotFound());
invoices.MapPost("/", async (CreateInvoiceRequest req, IInvoiceService s, CancellationToken ct) =>
{
    var dto = await s.CreateAsync(req, ct);
    return TypedResults.Created($"/api/invoices/{dto.Id}", dto);
});
```

| | Controllers | Minimal APIs |
|---|---|---|
| Style | Classes, attributes, conventions | Lambdas or methods mapped directly |
| Features | Filters, model binding conventions, `[ApiController]` behaviours | Endpoint filters, route groups, `TypedResults`, built-in validation since .NET 10 |
| Performance | Slightly more overhead | Leaner, and compatible with Native AOT |
| Fits | Large existing codebases, teams used to MVC | New services, microservices, small and medium APIs |

<figure class="dia"><svg viewBox="0 0 720 240" role="img" aria-label="One request through a controller and through a minimal API: both route, run filters, bind parameters with validation, call your code and write the result; controllers use MVC filters and output formatters, minimal APIs use endpoint filters and TypedResults">
<text class="sT" x="14" y="60">controller</text>
<rect class="sN" x="110" y="30" width="108" height="52" rx="8"/><text class="sC" x="164" y="61" text-anchor="middle">routing</text>
<line class="sLm" x1="218" y1="56" x2="226" y2="56" marker-end="url(#ahm)"/>
<rect class="sB" x="228" y="30" width="108" height="52" rx="8"/><text class="sC" x="282" y="61" text-anchor="middle">MVC filters</text>
<line class="sLm" x1="336" y1="56" x2="344" y2="56" marker-end="url(#ahm)"/>
<rect class="sB" x="346" y="30" width="108" height="52" rx="8"/><text class="sC" x="400" y="52" text-anchor="middle">model binding</text><text class="sS" x="400" y="70" text-anchor="middle">+ automatic 400</text>
<line class="sLm" x1="454" y1="56" x2="462" y2="56" marker-end="url(#ahm)"/>
<rect class="sA" x="464" y="30" width="108" height="52" rx="8"/><text class="sC" x="518" y="61" text-anchor="middle">action method</text>
<line class="sLm" x1="572" y1="56" x2="580" y2="56" marker-end="url(#ahm)"/>
<rect class="sG" x="582" y="30" width="108" height="52" rx="8"/><text class="sC" x="636" y="52" text-anchor="middle">ActionResult</text><text class="sS" x="636" y="70" text-anchor="middle">output formatter</text>
<text class="sT" x="14" y="152">minimal API</text>
<rect class="sN" x="110" y="122" width="108" height="52" rx="8"/><text class="sC" x="164" y="153" text-anchor="middle">routing</text>
<line class="sLm" x1="218" y1="148" x2="226" y2="148" marker-end="url(#ahm)"/>
<rect class="sB" x="228" y="122" width="108" height="52" rx="8"/><text class="sC" x="282" y="153" text-anchor="middle">endpoint filters</text>
<line class="sLm" x1="336" y1="148" x2="344" y2="148" marker-end="url(#ahm)"/>
<rect class="sB" x="346" y="122" width="108" height="52" rx="8"/><text class="sC" x="400" y="144" text-anchor="middle">param binding</text><text class="sS" x="400" y="162" text-anchor="middle">+ validation</text>
<line class="sLm" x1="454" y1="148" x2="462" y2="148" marker-end="url(#ahm)"/>
<rect class="sA" x="464" y="122" width="108" height="52" rx="8"/><text class="sC" x="518" y="153" text-anchor="middle">lambda / method</text>
<line class="sLm" x1="572" y1="148" x2="580" y2="148" marker-end="url(#ahm)"/>
<rect class="sG" x="582" y="122" width="108" height="52" rx="8"/><text class="sC" x="636" y="144" text-anchor="middle">TypedResults</text><text class="sS" x="636" y="162" text-anchor="middle">writes the response</text>
<text class="sS" x="360" y="228" text-anchor="middle">[ApiController] returns 400 before the action runs; minimal APIs validate built-in since .NET 10</text>
</svg><figcaption>Controllers and minimal APIs are two front-ends on the same pipeline. Choose one per project and stay consistent.</figcaption></figure>

Both are first-class. Pick one per project and organise it well: minimal APIs grouped by feature with `MapGroup`, or thin controllers delegating to services.

**What `[ApiController]` does:** attribute routing is required; **automatic 400 responses** with `ValidationProblemDetails` when model validation fails; binding-source inference (`[FromBody]` for complex types, `[FromRoute]`/`[FromQuery]` for simple ones); ProblemDetails for error status codes.

## B3.4 Model binding and validation 🟢 ⭐

| Attribute | Reads from |
|---|---|
| `[FromRoute]` | `/api/invoices/{id}` |
| `[FromQuery]` | `?status=paid&page=2` |
| `[FromBody]` | The JSON body (one per action) |
| `[FromHeader]` | A request header |
| `[FromForm]` | Form fields and file uploads |
| `[FromServices]` | DI (implicit in minimal APIs) |
| `[AsParameters]` | Bind a group of parameters from a class (minimal APIs) |

**Validation** happens at the boundary, on request DTOs, **never** on EF entities:

```csharp
public record CreateInvoiceRequest(
    [Required, StringLength(120)] string Customer,
    [Range(0.01, 10_000_000)] decimal Amount,
    [Required] DateOnly DueDate);
```

- **DataAnnotations** for simple rules; **FluentValidation** for complex or cross-field rules and readable tests.
- With `[ApiController]`, invalid models return **400 with ValidationProblemDetails** automatically. **.NET 10 added built-in validation to minimal APIs**: call `builder.Services.AddValidation()` and DataAnnotations on parameters and records are enforced.
- Business-rule failures that need the database ("this customer is blocked") belong in the service layer and return 409 or 422 with ProblemDetails, not 500.

> [!mistake] Binding straight to entities
> Accepting an EF entity in a POST lets clients set fields they shouldn't (`IsAdmin`, `CompanyId`), which is **over-posting** ([[S9.11]]), and couples your API contract to your database schema. Bind to request DTOs; map to entities in the service.

## B3.5 Errors: ProblemDetails and a global handler 🟢 ⭐

> [!term] ProblemDetails
> The standard JSON shape for HTTP API errors (**RFC 9457**, which replaced RFC 7807): `type`, `title`, `status`, `detail`, `instance`, plus extensions such as `errors` or a `traceId`. Clients can handle every error the same way.

```csharp
public sealed class GlobalExceptionHandler(ILogger<GlobalExceptionHandler> log, IProblemDetailsService pds) : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(HttpContext ctx, Exception ex, CancellationToken ct)
    {
        var (status, title) = ex switch
        {
            NotFoundException      => (404, "Resource not found"),
            ConflictException      => (409, "Conflict"),
            ForbiddenException     => (403, "Forbidden"),
            _                      => (500, "An unexpected error occurred"),
        };
        if (status == 500) log.LogError(ex, "Unhandled exception for {Path}", ctx.Request.Path);
        ctx.Response.StatusCode = status;
        return await pds.TryWriteAsync(new() { HttpContext = ctx, ProblemDetails = { Status = status, Title = title }, Exception = ex });
    }
}
```

<figure class="dia steps"><svg viewBox="0 0 720 252" role="img" aria-label="A request passes through UseExceptionHandler, routing and the endpoint into a service, which throws NotFoundException; the exception unwinds to the global handler, which maps it to 404 and writes an application/problem+json body with type, title, status and traceId; an unexpected exception becomes a generic 500 whose details stay in the log">
<rect class="sN" x="14" y="58" width="104" height="64" rx="8"/><text class="sT" x="66" y="88" text-anchor="middle">client</text><text class="sS" x="66" y="104" text-anchor="middle">Angular app</text>
<rect class="sV" x="150" y="26" width="556" height="132" rx="10" opacity=".35"/><text class="sT" x="160" y="44">UseExceptionHandler (outermost)</text>
<rect class="sB" x="330" y="52" width="366" height="98" rx="10" opacity=".45"/><text class="sS" x="340" y="70">routing, auth</text>
<rect class="sB" x="450" y="78" width="236" height="64" rx="10"/><text class="sS" x="460" y="96">endpoint</text>
<rect class="sA" x="560" y="92" width="116" height="40" rx="8"/><text class="sT" x="618" y="116" text-anchor="middle">service</text>
<g data-s="1-1"><line class="sLg" x1="120" y1="84" x2="556" y2="84" marker-end="url(#ahg)"/><text class="sGt" x="240" y="78" text-anchor="middle">GET /invoices/42</text><g class="pk" data-s="1"><circle class="sPg" r="5"><animateMotion dur="1.4s" begin="indefinite" fill="freeze" path="M 120 84 L 556 84"/></circle></g></g>
<g data-s="2-2"><text class="sRt" x="618" y="154" text-anchor="middle">throw NotFoundException</text><line class="sLr" x1="558" y1="120" x2="152" y2="120" marker-end="url(#ahr)" stroke-dasharray="5 4"/><text class="sRt" x="240" y="114" text-anchor="middle">unwinds through every layer</text><g class="pk" data-s="2"><circle class="sPr" r="5"><animateMotion dur="1.4s" begin="indefinite" fill="freeze" path="M 558 120 L 160 120"/></circle></g></g>
<g data-s="3-3"><rect class="sN" x="156" y="92" width="168" height="56" rx="6"/><text class="sS" x="164" y="110" xml:space="preserve" style="white-space:pre">NotFoundException → 404</text><text class="sS" x="164" y="126" xml:space="preserve" style="white-space:pre">ConflictException → 409</text><text class="sS" x="164" y="142" xml:space="preserve" style="white-space:pre">_ → 500 (and log it)</text></g>
<g data-s="4-4"><line class="sLg" x1="150" y1="100" x2="120" y2="100" marker-end="url(#ahg)"/><rect class="sN" x="14" y="170" width="692" height="74" rx="8"/><text class="sS" x="24" y="190" xml:space="preserve" style="white-space:pre">HTTP/1.1 404  Content-Type: application/problem+json</text><text class="sS" x="24" y="210" xml:space="preserve" style="white-space:pre">{"type":"https://tools.ietf.org/html/rfc9110#section-15.5.5",</text><text class="sGt" x="24" y="228" xml:space="preserve" style="white-space:pre"> "title":"Resource not found","status":404,"traceId":"0HNP6QVU4O41B:00000001"}</text><text class="sGt" x="700" y="190" text-anchor="end">one shape for every error</text></g>
<g data-s="5-5"><line class="sLg" x1="150" y1="100" x2="120" y2="100" marker-end="url(#ahg)"/><rect class="sN" x="14" y="170" width="692" height="74" rx="8"/><text class="sS" x="24" y="190" xml:space="preserve" style="white-space:pre">HTTP/1.1 500  Content-Type: application/problem+json</text><text class="sS" x="24" y="210" xml:space="preserve" style="white-space:pre">{"type":"https://tools.ietf.org/html/rfc9110#section-15.6.1",</text><text class="sWt" x="24" y="228" xml:space="preserve" style="white-space:pre"> "title":"An unexpected error occurred","status":500,"traceId":"0HNP6QVU4O41C:00000001"}</text><text class="sWt" x="700" y="190" text-anchor="end">message "db password=…" stays in the log</text><text class="sS" x="700" y="210" text-anchor="end">support searches logs by traceId</text></g>
</svg><ol class="dia-steps">
<li>The request enters the pipeline. UseExceptionHandler is registered first, so it wraps everything after it.</li>
<li>The service throws NotFoundException. Nothing in between catches it; it unwinds all the way out to the handler.</li>
<li>The global handler maps exception types to status codes in one place.</li>
<li>The client receives a ProblemDetails body (captured from a real ASP.NET Core 10 app): type, title, status and a traceId.</li>
<li>An unexpected exception becomes a generic 500. Its message and stack trace go to the log, never to the client; the traceId links the two.</li>
</ol><figcaption>One global handler turns any exception into a ProblemDetails response. The JSON shown is real output from the handler above.</figcaption></figure>

`IExceptionHandler` (.NET 8+) with `UseExceptionHandler()` replaces hand-written try/catch middleware. Never return stack traces or exception messages to clients in production ([[S9.12]]); include the **trace ID** so support can find the log entry.

> [!story]
> FinSight had a **global exception handler**. Describe what it returned (ProblemDetails with a trace ID), what it logged, and how it mapped domain exceptions to 404, 409 and 403, so the Angular client could show sensible messages.

## B3.6 Filters vs middleware 🟡 ⭐

**Filters** run inside the MVC or endpoint layer, around a specific action, so they can see the action, its arguments and its result. **Middleware** runs for every request, before any endpoint is chosen or only knowing its metadata.

| Filter type (MVC) | Runs | Use |
|---|---|---|
| Authorization | First | Custom authorisation logic (prefer policies) |
| Resource | Around model binding | Short-circuit caching |
| **Action** | Around the action method, with access to arguments | Validation tweaks, auditing which action ran with what |
| Exception | When the action throws | Action-specific error mapping |
| Result | Around the result execution | Adding headers, wrapping responses |

<figure class="dia"><svg viewBox="0 0 720 150" role="img" aria-label="MVC filter order: authorization, resource, model binding, action filters, the action, result filters, the result; exception filters wrap the action">
<rect class="sR" x="8" y="40" width="94" height="50" rx="8"/><text class="sC" x="55" y="70" text-anchor="middle">authorization</text>
<line class="sLm" x1="102" y1="65" x2="108" y2="65" marker-end="url(#ahm)"/>
<rect class="sB" x="109" y="40" width="94" height="50" rx="8"/><text class="sC" x="156" y="70" text-anchor="middle">resource</text>
<line class="sLm" x1="203" y1="65" x2="209" y2="65" marker-end="url(#ahm)"/>
<rect class="sV" x="210" y="40" width="94" height="50" rx="8"/><text class="sC" x="257" y="70" text-anchor="middle">model binding</text>
<line class="sLm" x1="304" y1="65" x2="310" y2="65" marker-end="url(#ahm)"/>
<rect class="sW" x="311" y="40" width="94" height="50" rx="8"/><text class="sC" x="358" y="70" text-anchor="middle">action filters</text>
<line class="sLm" x1="405" y1="65" x2="411" y2="65" marker-end="url(#ahm)"/>
<rect class="sG" x="412" y="40" width="94" height="50" rx="8"/><text class="sC" x="459" y="70" text-anchor="middle">action</text>
<line class="sLm" x1="506" y1="65" x2="512" y2="65" marker-end="url(#ahm)"/>
<rect class="sW" x="513" y="40" width="94" height="50" rx="8"/><text class="sC" x="560" y="70" text-anchor="middle">result filters</text>
<line class="sLm" x1="607" y1="65" x2="613" y2="65" marker-end="url(#ahm)"/>
<rect class="sB" x="614" y="40" width="94" height="50" rx="8"/><text class="sC" x="661" y="70" text-anchor="middle">result</text>
<path class="sLr" d="M459 92 V120 H358" stroke-dasharray="4 3"/><text class="sRt" x="459" y="138" text-anchor="middle">exception filters wrap the action</text>
<text class="sC" x="360" y="24" text-anchor="middle">inside the endpoint, for one action (middleware runs before all of this)</text>
</svg><figcaption>The MVC filter pipeline. Filters see the action, its arguments and its result, which middleware never does.</figcaption></figure>

Minimal APIs have **endpoint filters** (`.AddEndpointFilter<T>()`) for the same purposes.

> [!say]
> "Middleware handles cross-cutting concerns for every request, like logging, CORS, authentication and exception handling, before an endpoint runs. Filters run inside the MVC or endpoint pipeline around specific actions, so they can see the action's arguments and result, which suits auditing or action-specific behaviour."

## B3.7 Configuration and environments 🟢

- `appsettings.json` → `appsettings.{Environment}.json` → user secrets (Development) → environment variables → command line; later sources override earlier ones ([[S10.6]]).
- `ASPNETCORE_ENVIRONMENT` = `Development`, `Staging` or `Production` controls which file loads and enables developer features.
- **Options pattern** with validation at startup, so a missing setting fails fast instead of at 3 a.m.:

```csharp
builder.Services.AddOptions<SmtpOptions>()
    .Bind(builder.Configuration.GetSection("Smtp"))
    .ValidateDataAnnotations()
    .ValidateOnStart();
```

`IOptions<T>` is read once (singleton); `IOptionsSnapshot<T>` is re-read per request (scoped); `IOptionsMonitor<T>` notifies on change.

## B3.8 OpenAPI documentation 🟢

Since **.NET 9**, the Web API template no longer includes Swashbuckle; ASP.NET Core generates OpenAPI documents itself (`AddOpenApi()` and `MapOpenApi()`), and you choose a UI (Scalar, or Swagger UI added separately). **.NET 10 generates OpenAPI 3.1 by default**, can serve YAML, and pulls XML documentation comments into the document.

Why it matters beyond documentation: **client generation** for the frontend (TypeScript types and clients via NSwag, Kiota or `openapi-typescript`, [[FS1]]), contract tests, and API gateways.

> [!warning]
> Don't expose the interactive UI publicly in production without authentication ([[S9.9]]).

## B3.9 Calling other APIs: IHttpClientFactory 🟢 🟡 ⭐

> [!mistake] `new HttpClient()` per request, or one static forever
> Creating an `HttpClient` per call can exhaust sockets (closed connections linger in TIME_WAIT). A single static instance never picks up **DNS changes**. **`IHttpClientFactory`** pools and recycles the underlying handlers to solve both.

```csharp
builder.Services.AddHttpClient<ITimeGptClient, TimeGptClient>(c =>
{
    c.BaseAddress = new Uri(builder.Configuration["TimeGpt:BaseUrl"]!);
    c.Timeout = TimeSpan.FromSeconds(30);
})
.AddStandardResilienceHandler();     // retries with backoff, circuit breaker, timeouts (Microsoft.Extensions.Http.Resilience)

public class TimeGptClient(HttpClient http) : ITimeGptClient       // typed client
{
    public async Task<Forecast> ForecastAsync(Series s, CancellationToken ct)
    {
        using var res = await http.PostAsJsonAsync("/forecast", s, ct);
        res.EnsureSuccessStatusCode();
        return (await res.Content.ReadFromJsonAsync<Forecast>(ct))!;
    }
}
```

Resilience (retries, circuit breakers, timeouts) is covered in [[B11]].

<figure class="dia"><svg viewBox="0 0 720 172" role="img" aria-label="A typed client uses an HttpClient whose request passes through a resilience handler to a pooled primary handler that the factory recycles">
<rect class="sA" x="10" y="50" width="130" height="50" rx="8"/><text class="sT" x="75" y="73" text-anchor="middle">TimeGptClient</text><text class="sC" x="75" y="89" text-anchor="middle">typed client</text>
<line class="sL" x1="140" y1="75" x2="166" y2="75" marker-end="url(#ah)"/><rect class="sB" x="170" y="50" width="130" height="50" rx="8"/><text class="sT" x="235" y="73" text-anchor="middle">HttpClient</text><text class="sC" x="235" y="89" text-anchor="middle">cheap, per use</text>
<line class="sL" x1="300" y1="75" x2="326" y2="75" marker-end="url(#ah)"/><rect class="sW" x="330" y="50" width="150" height="50" rx="8"/><text class="sT" x="405" y="73" text-anchor="middle">resilience handler</text><text class="sC" x="405" y="89" text-anchor="middle">retry · breaker</text>
<line class="sL" x1="480" y1="75" x2="506" y2="75" marker-end="url(#ah)"/><rect class="sG" x="510" y="50" width="190" height="50" rx="8"/><text class="sT" x="605" y="73" text-anchor="middle">pooled primary handler</text><text class="sC" x="605" y="89" text-anchor="middle">sockets kept, recycled ~2 min</text>
<text class="sS" x="355" y="140" text-anchor="middle">the factory hands out new HttpClients that share pooled handlers:</text>
<text class="sGt" x="355" y="160" text-anchor="middle">no socket exhaustion (reuse) and no stale DNS (handlers rotate)</text>
</svg><figcaption>What <code>IHttpClientFactory</code> builds. Delegating handlers form a little pipeline of their own, like middleware for outgoing calls.</figcaption></figure>

## B3.10 Background work in the same process 🟡

```csharp
public class ReforecastWorker(IServiceScopeFactory scopes, Channel<Guid> queue, ILogger<ReforecastWorker> log) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        await foreach (var companyId in queue.Reader.ReadAllAsync(stoppingToken))
        {
            using var scope = scopes.CreateScope();                     // a fresh scope per job: scoped DbContext
            var svc = scope.ServiceProvider.GetRequiredService<IForecastService>();
            try { await svc.RecomputeAsync(companyId, stoppingToken); }
            catch (Exception ex) { log.LogError(ex, "Reforecast failed for {CompanyId}", companyId); }
        }
    }
}
```

`BackgroundService` (an `IHostedService`) runs for the app's lifetime. For **durable** jobs that must survive restarts, be retried and be visible on a dashboard, use **Hangfire** or Quartz.NET, or a queue with a separate worker ([[B8]]).

> [!story]
> FinSight re-forecast **in the background** after a CSV upload or an invoice payment, so the request returned immediately and the dashboard updated later through SignalR. That's the right design, and a great answer to "how do you keep a slow operation out of the request path?".

## B3.11 Built-in production features 🟡

| Feature | Since | Use |
|---|---|---|
| **Rate limiting** middleware (fixed window, sliding window, token bucket, concurrency) | .NET 7 | Protect login, expensive endpoints, public APIs; returns 429 |
| **Output caching** | .NET 7 | Cache whole responses server-side with tag-based eviction |
| **Response compression** | — | Brotli or gzip, if the proxy doesn't already do it |
| **Health checks** (`MapHealthChecks`) | — | Liveness and readiness probes ([[B11]]) |
| **Problem details**, `IExceptionHandler` | .NET 7–8 | Consistent errors |
| **Minimal API validation**, OpenAPI 3.1, Server-Sent Events results (`TypedResults.ServerSentEvents`) | .NET 10 | Less boilerplate; streaming updates |
| Cookie authentication returns **401/403 for API endpoints** instead of redirecting to a login page | .NET 10 | Saner behaviour for SPAs calling cookie-protected APIs |

> [!story]
> FinSight split health checks into **live** (is the process up?) and **full** (can it reach the database and dependencies?). That distinction, liveness vs readiness, is exactly what Kubernetes and Azure probes need, and it's a mid-level talking point.

> [!lab] A production-shaped API in two hours
> `dotnet new webapi -n Ledger`. Add: a global `IExceptionHandler` returning ProblemDetails; request DTOs with validation (try `AddValidation()` on minimal APIs); a correlation-ID middleware; a typed `HttpClient` with the standard resilience handler calling any public API; a rate-limited login endpoint; live and ready health checks; and OpenAPI 3.1 with Scalar. Call it with a bad payload, an unknown ID and a burst of 200 requests, and read what comes back.

## B3.12 Interview drill 🟢 ⭐

| Question | Strong short answer |
|---|---|
| What is middleware? | A component in the request pipeline that can handle the request, short-circuit it, or pass it to the next and act on the response. |
| Why does middleware order matter? | Each only sees what earlier ones pass on: exception handling first, CORS before authentication, authentication before authorisation. |
| Use vs Run vs Map? | Use adds middleware that can call next; Run is terminal; Map branches by path. |
| Middleware vs filters? | Middleware is for all requests and cross-cutting concerns; filters wrap specific actions with access to arguments and results. |
| Controllers vs minimal APIs? | Both first-class: controllers bring conventions and filters; minimal APIs are leaner, AOT-friendly, with route groups and endpoint filters. |
| What does [ApiController] do? | Attribute routing, automatic 400 ValidationProblemDetails, binding-source inference, ProblemDetails for errors. |
| How do you validate input? | DataAnnotations or FluentValidation on request DTOs at the boundary; business rules in services with 409/422. |
| What's ProblemDetails? | The RFC 9457 JSON error format: type, title, status, detail, instance and extensions. |
| How do you handle exceptions globally? | IExceptionHandler with UseExceptionHandler, mapping known exceptions to status codes and logging the rest. |
| Why IHttpClientFactory? | It pools and recycles handlers, avoiding socket exhaustion and stale DNS, and centralises configuration and resilience. |
| IOptions vs IOptionsSnapshot vs IOptionsMonitor? | Read once / per request / with change notifications. |
| How do you run background work? | BackgroundService with a scope per job, or Hangfire or a queue for durable, retryable jobs. |
| What changed in .NET 10 for APIs? | Built-in minimal API validation, OpenAPI 3.1 by default, SSE results, 401/403 instead of redirects for cookie-authenticated APIs, passkeys in Identity. |
| Why return 201 with Location? | It tells the client the new resource's URL, per HTTP semantics. |

## Key takeaways

> [!check]
> - The pipeline is ordered middleware: exception handler first, CORS before auth, AuthN before AuthZ.
> - Validate request DTOs at the boundary; never bind entities.
> - One global exception handler returning ProblemDetails with a trace ID.
> - IHttpClientFactory and typed clients with resilience for every outbound call.
> - Keep slow work out of the request: background services or durable jobs.

## Sources

- Microsoft Learn (ASP.NET Core 10): [Middleware](https://learn.microsoft.com/en-us/aspnet/core/fundamentals/middleware/), [Minimal APIs overview](https://learn.microsoft.com/en-us/aspnet/core/fundamentals/minimal-apis/overview), [Create web APIs with controllers](https://learn.microsoft.com/en-us/aspnet/core/web-api/), [Model validation](https://learn.microsoft.com/en-us/aspnet/core/mvc/models/validation), [Handle errors in web APIs](https://learn.microsoft.com/en-us/aspnet/core/web-api/handle-errors), [Filters](https://learn.microsoft.com/en-us/aspnet/core/mvc/controllers/filters), [IHttpClientFactory](https://learn.microsoft.com/en-us/dotnet/core/extensions/httpclient-factory), [Background tasks with hosted services](https://learn.microsoft.com/en-us/aspnet/core/fundamentals/host/hosted-services), [Rate limiting middleware](https://learn.microsoft.com/en-us/aspnet/core/performance/rate-limit), [OpenAPI support](https://learn.microsoft.com/en-us/aspnet/core/fundamentals/openapi/overview), [What's new in ASP.NET Core 10](https://learn.microsoft.com/en-us/aspnet/core/release-notes/aspnetcore-10.0).
- IETF [RFC 9457 — Problem Details for HTTP APIs](https://www.rfc-editor.org/rfc/rfc9457).
