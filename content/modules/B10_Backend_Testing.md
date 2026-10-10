# Backend Testing — xUnit, Test Doubles, WebApplicationFactory and Testcontainers

Your own audit is blunt: FinSight has few tests, and CS Visualizer is the one project with real test discipline (differential and golden tests that caught thirteen semantic bugs). Interviewers ask about testing in almost every backend round, and "I'd write unit tests" isn't enough. This module gives you a clear strategy (what to test at which level, and with which .NET tools) plus the integration-testing setup that most impresses reviewers: `WebApplicationFactory` with a real database in Testcontainers.

> [!focus]
> **Entry must:** unit tests with xUnit (Fact, Theory, AAA); test doubles and when to use them; what makes a test good; testing an API endpoint.
> **Mid adds:** integration tests with WebApplicationFactory, real databases with Testcontainers and Respawn, testing authentication and tenant isolation, controlling time with TimeProvider, snapshot or golden tests, contract tests, load tests, coverage and mutation testing in CI.
> **Most asked:** *How do you test a service that uses the database?* · *Unit vs integration tests?* · *What do you mock?* · *How do you test an API end to end?* · *How do you test code that depends on the current time?* · *What's your testing strategy?*
> **Time budget:** 3 hours, plus the lab.

## B10.0 Foundations: seams and determinism 🟢

An automated test runs your code with known inputs and checks the result. Two properties decide whether backend code can be tested well at all:

- **Seams.** A seam is a place where a test can substitute what's on the other side: an interface passed to a constructor, an injected `TimeProvider`, a configurable base URL. Code that news up its own `HttpClient`, reads `DateTime.UtcNow` or calls a static SMTP helper has no seams, so its tests must hit the real world.
- **Determinism.** A test must give the same answer every run. The usual sources of randomness are the **clock**, **random numbers and GUIDs**, the **network** and third-party services, **shared data** left by other tests, **test order**, and **concurrency**. Each one needs a deliberate control: a fake clock, seeded randomness, faked edges, a reset database, independent tests.

<figure class="dia"><svg viewBox="0 0 720 248" role="img" aria-label="A service under test with four seams: an interface for the forecasting model, the TimeProvider, an email sender and the database context">
<rect class="sA" x="270" y="86" width="180" height="60" rx="8"/><text class="sT" x="360" y="114" text-anchor="middle">ForecastService</text><text class="sC" x="360" y="130" text-anchor="middle">logic under test</text>
<rect class="sV" x="20" y="20" width="200" height="50" rx="8"/><text class="sT" x="120" y="43" text-anchor="middle">IForecastModel</text><text class="sC" x="120" y="59" text-anchor="middle">real: TimeGPT · test: fake</text>
<rect class="sV" x="500" y="20" width="200" height="50" rx="8"/><text class="sT" x="600" y="43" text-anchor="middle">TimeProvider</text><text class="sC" x="600" y="59" text-anchor="middle">test: FakeTimeProvider</text>
<rect class="sV" x="20" y="164" width="200" height="50" rx="8"/><text class="sT" x="120" y="187" text-anchor="middle">IEmailSender</text><text class="sC" x="120" y="203" text-anchor="middle">real: SMTP · test: spy</text>
<rect class="sG" x="500" y="164" width="200" height="50" rx="8"/><text class="sT" x="600" y="187" text-anchor="middle">AppDbContext</text><text class="sC" x="600" y="203" text-anchor="middle">real DB in a container</text>
<line class="sLm" x1="270" y1="100" x2="222" y2="54" marker-end="url(#ahm)"/><line class="sLm" x1="450" y1="100" x2="498" y2="54" marker-end="url(#ahm)"/><line class="sLm" x1="270" y1="132" x2="222" y2="180" marker-end="url(#ahm)"/><line class="sLm" x1="450" y1="132" x2="498" y2="180" marker-end="url(#ahm)"/>
<text class="sS" x="360" y="236" text-anchor="middle">every dependency arrives through the constructor, so a test can choose what sits at the other end</text>
</svg><figcaption>Seams. Code is testable when everything it can't control (time, other systems, I/O) comes in from outside.</figcaption></figure>

The rest of this module is about choosing which seams to fake (the edges you don't own) and which to keep real (your code and, crucially, the database engine).

## B10.1 A testing strategy you can explain 🟢 ⭐

| Level | What it covers | Speed | .NET tools |
|---|---|---|---|
| **Unit** | Domain logic, calculations, validators, mappers, a service with its dependencies faked | Milliseconds | xUnit, NSubstitute or Moq |
| **Integration** | The real HTTP pipeline, DI, EF Core and a **real database**, through `WebApplicationFactory` | Seconds | `Microsoft.AspNetCore.Mvc.Testing`, Testcontainers, Respawn |
| **Contract** | The API's shape matches what clients (or a provider) expect | Fast | OpenAPI diffing, Pact |
| **End-to-end** | The deployed system through the UI or public API | Slow | Playwright ([[F10.6]]), API smoke tests |
| **Performance** | Throughput and latency under load; micro-benchmarks | Minutes | k6, NBomber, BenchmarkDotNet |

> [!say]
> "I unit-test the domain and business rules, which is where the logic is, and I put a lot of weight on integration tests that run the real ASP.NET Core pipeline against a real database in a Testcontainer, because that's where most backend bugs live: mapping, queries, filters, auth. A few end-to-end smoke tests cover the critical paths after deployment."

## B10.2 xUnit essentials 🟢 ⭐

```csharp
public class InvoiceTests
{
    [Fact]
    public void ApplyPayment_rejects_overpayment()
    {
        // Arrange
        var invoice = new Invoice(total: 900m);
        invoice.ApplyPayment(new Payment(600m));
        // Act
        var act = () => invoice.ApplyPayment(new Payment(400m));
        // Assert
        Assert.Throws<InvalidOperationException>(act);
        Assert.Equal(600m, invoice.Paid);
    }

    [Theory]
    [InlineData(900, 900, InvoiceStatus.Paid)]
    [InlineData(900, 300, InvoiceStatus.PartiallyPaid)]
    [InlineData(900, 0, InvoiceStatus.Sent)]
    public void Status_reflects_payments(decimal total, decimal paid, InvoiceStatus expected)
    {
        var invoice = new Invoice(total);
        if (paid > 0) invoice.ApplyPayment(new Payment(paid));
        Assert.Equal(expected, invoice.Status);
    }
}
```

| Concept | Meaning |
|---|---|
| `[Fact]` | A test with no parameters |
| `[Theory]` + `[InlineData]`/`[MemberData]` | The same test with several inputs |
| Constructor / `IDisposable` / `IAsyncLifetime` | Set-up and tear-down **per test** (xUnit creates a new class instance for every test) |
| `IClassFixture<T>` | Share an expensive object (a test server, a container) across the tests **in one class** |
| `[Collection]` + `ICollectionFixture<T>` | Share it across **several classes**; tests in one collection don't run in parallel |

<figure class="dia"><svg viewBox="0 0 720 242" role="img" aria-label="xUnit lifecycle: a collection fixture such as a database container is created once for several test classes, a class fixture such as a web application factory once per class, and a new test class instance is constructed and disposed for every single test">
<rect class="sN" x="14" y="26" width="692" height="186" rx="10" style="fill:none;stroke-dasharray:5 4"/><text class="sM" x="26" y="44">collection "Database": ICollectionFixture&lt;PostgresContainer&gt;, created once for both classes</text>
<rect class="sB" x="30" y="56" width="320" height="140" rx="8" opacity=".5"/><text class="sT" x="42" y="74">InvoiceTests : IClassFixture&lt;ApiFactory&gt;</text>
<rect class="sA" x="42" y="84" width="296" height="26" rx="5"/><text class="sC" x="190" y="102" text-anchor="middle">ApiFactory: built once for this class</text>
<rect class="sN" x="42" y="120" width="296" height="20" rx="4"/><text class="sS" x="52" y="134">new InvoiceTests()</text><text class="sS" x="190" y="134" text-anchor="middle">→</text><text class="sC" x="206" y="134">Fact A</text><text class="sS" x="330" y="134" text-anchor="end">Dispose</text>
<rect class="sN" x="42" y="144" width="296" height="20" rx="4"/><text class="sS" x="52" y="158">new InvoiceTests()</text><text class="sS" x="190" y="158" text-anchor="middle">→</text><text class="sC" x="206" y="158">Fact B</text><text class="sS" x="330" y="158" text-anchor="end">Dispose</text>
<rect class="sN" x="42" y="168" width="296" height="20" rx="4"/><text class="sS" x="52" y="182">new InvoiceTests()</text><text class="sS" x="190" y="182" text-anchor="middle">→</text><text class="sC" x="206" y="182">Theory × 3</text><text class="sS" x="330" y="182" text-anchor="end">Dispose</text>
<rect class="sB" x="370" y="56" width="320" height="140" rx="8" opacity=".5"/><text class="sT" x="382" y="74">PaymentTests : IClassFixture&lt;ApiFactory&gt;</text>
<rect class="sA" x="382" y="84" width="296" height="26" rx="5"/><text class="sC" x="530" y="102" text-anchor="middle">ApiFactory: built once for this class</text>
<rect class="sN" x="382" y="120" width="296" height="20" rx="4"/><text class="sS" x="392" y="134">new PaymentTests()</text><text class="sS" x="530" y="134" text-anchor="middle">→</text><text class="sC" x="546" y="134">Fact C</text><text class="sS" x="670" y="134" text-anchor="end">Dispose</text>
<rect class="sN" x="382" y="144" width="296" height="20" rx="4"/><text class="sS" x="392" y="158">new PaymentTests()</text><text class="sS" x="530" y="158" text-anchor="middle">→</text><text class="sC" x="546" y="158">Fact D</text><text class="sS" x="670" y="158" text-anchor="end">Dispose</text>
<text class="sS" x="360" y="230" text-anchor="middle">a fresh class instance per test keeps tests independent; fixtures exist for the expensive things you deliberately share</text>
</svg><figcaption>Three lifetimes in xUnit: per test (constructor), per class (IClassFixture), per collection (ICollectionFixture).</figcaption></figure>

**Naming:** say the behaviour, e.g. `ApplyPayment_rejects_overpayment`, or `Method_Scenario_ExpectedResult`.

**Frameworks and libraries in 2026:** **xUnit** (v3 released in 2025) is the most common in new .NET projects, with **NUnit** and **MSTest** also widely used. For assertions, built-in `Assert` or **Shouldly** are free choices. **FluentAssertions moved to a paid commercial licence with version 8 (January 2025)**, and the community fork **AwesomeAssertions** continues under the original open licence, so check which one a codebase uses.

## B10.3 Test doubles in .NET 🟢 ⭐

(Definitions of dummy, stub, spy, mock and fake are in [[F10.3]].)

```csharp
// NSubstitute: stub a return value, then verify an interaction
var model = Substitute.For<IForecastModel>();
model.PredictAsync(Arg.Any<Series>(), Arg.Any<CancellationToken>()).Returns(new Forecast(days: 90));
var email = Substitute.For<IEmailSender>();

var sut = new ForecastService(model, email, new FakeTimeProvider(new DateTimeOffset(2026, 10, 3, 2, 0, 0, TimeSpan.Zero)));
await sut.RunNightlyAsync(companyId, CancellationToken.None);

await email.Received(1).SendAsync(Arg.Is<Email>(e => e.Subject.Contains("forecast")), Arg.Any<CancellationToken>());
```

**What to fake:** things you don't own or can't control: external APIs (TimeGPT, payment gateways, LLMs), email and SMS, the clock, randomness, the file system. **What not to fake:** your own domain objects, and usually not EF Core's `DbContext` (use a real database instead, [[B10.5]]).

**Time:** never call `DateTime.UtcNow` directly in logic you want to test. Inject **`TimeProvider`** (built into .NET 8+) and use `FakeTimeProvider` (from `Microsoft.Extensions.TimeProvider.Testing`) in tests to set or advance the time, including timers and `Task.Delay`.

> [!mistake] Over-mocking
> A test that mocks every collaborator and verifies every call is a copy of the implementation: it breaks on every refactor and proves nothing about real behaviour. Prefer asserting **outcomes** (the returned value, the saved state) over **interactions**, and verify interactions only at real boundaries (an email was sent, a message was published).

## B10.4 Integration tests with WebApplicationFactory 🟡 ⭐

`WebApplicationFactory<TEntryPoint>` boots your **real** app (its `Program`, middleware, DI, routing, filters, serialisation) in memory and gives you an `HttpClient` to call it. No network or deployment needed.

<figure class="dia"><svg viewBox="0 0 720 230" role="img" aria-label="An integration test calls the real application in memory through an HttpClient; the app runs its real pipeline and EF Core against a containerised SQL Server, with only external edges replaced">
<rect class="sB" x="14" y="90" width="120" height="50" rx="8"/><text class="sT" x="74" y="113" text-anchor="middle">xUnit test</text><text class="sC" x="74" y="129" text-anchor="middle">HttpClient</text><line class="sL" x1="134" y1="115" x2="166" y2="115" marker-end="url(#ah)"/>
<rect class="sN" x="170" y="20" width="360" height="200" rx="12"/><text class="sC" x="350" y="40" text-anchor="middle">your real app, in memory (TestServer)</text>
<rect class="sA" x="186" y="52" width="328" height="32" rx="6"/><text class="sC" x="350" y="73" text-anchor="middle">middleware: errors, auth, CORS</text>
<rect class="sA" x="186" y="92" width="328" height="32" rx="6"/><text class="sC" x="350" y="113" text-anchor="middle">routing · binding · validation</text>
<rect class="sA" x="186" y="132" width="328" height="32" rx="6"/><text class="sC" x="350" y="153" text-anchor="middle">your services + DI</text>
<rect class="sG" x="186" y="172" width="328" height="32" rx="6"/><text class="sC" x="350" y="193" text-anchor="middle">EF Core + real migrations</text>
<line class="sLg" x1="514" y1="196" x2="566" y2="196" marker-end="url(#ahg)"/><rect class="sG" x="570" y="172" width="136" height="48" rx="8"/><text class="sT" x="638" y="194" text-anchor="middle">SQL Server</text><text class="sC" x="638" y="210" text-anchor="middle">Testcontainers</text>
<rect class="sV" x="570" y="30" width="136" height="120" rx="8"/><text class="sT" x="638" y="50" text-anchor="middle">replaced edges</text><text class="sC" x="638" y="74" text-anchor="middle">fake IForecastModel</text><text class="sC" x="638" y="94" text-anchor="middle">test auth handler</text><text class="sC" x="638" y="114" text-anchor="middle">spy email sender</text><text class="sC" x="638" y="134" text-anchor="middle">FakeTimeProvider</text>
<line class="sLw" x1="514" y1="110" x2="566" y2="90" marker-end="url(#ahw)"/>
</svg><figcaption>What an integration test exercises: everything you wrote, end to end, against the real database engine. Only the edges you don't own are swapped.</figcaption></figure>

```csharp
public class ApiFactory : WebApplicationFactory<Program>, IAsyncLifetime
{
    private readonly MsSqlContainer _db = new MsSqlBuilder().WithImage("mcr.microsoft.com/mssql/server:2022-latest").Build();

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");
        builder.ConfigureServices(services =>
        {
            services.RemoveAll<DbContextOptions<AppDbContext>>();
            services.AddDbContext<AppDbContext>(o => o.UseSqlServer(_db.GetConnectionString()));
            services.RemoveAll<IForecastModel>();
            services.AddSingleton<IForecastModel, FakeForecastModel>();      // fake the external AI
            services.AddAuthentication(TestAuthHandler.Scheme)                // fake login: claims from headers
                    .AddScheme<AuthenticationSchemeOptions, TestAuthHandler>(TestAuthHandler.Scheme, _ => { });
        });
    }

    public async ValueTask InitializeAsync()
    {
        await _db.StartAsync();
        using var scope = Services.CreateScope();
        await scope.ServiceProvider.GetRequiredService<AppDbContext>().Database.MigrateAsync();   // real migrations
    }
    public new async ValueTask DisposeAsync() => await _db.DisposeAsync();
}
```

(For the `Program` class to be visible to the test project, add `public partial class Program { }` at the end of `Program.cs`, or `InternalsVisibleTo`.)

```csharp
public class InvoiceEndpointsTests(ApiFactory factory) : IClassFixture<ApiFactory>
{
    [Fact]
    public async Task Create_returns_201_with_location_and_rejects_invalid_input()
    {
        var client = factory.CreateClient().AsUser(companyId: "c-1", role: "Accountant");

        var bad = await client.PostAsJsonAsync("/api/invoices", new { customer = "", amount = -5 });
        Assert.Equal(HttpStatusCode.BadRequest, bad.StatusCode);
        var problem = await bad.Content.ReadFromJsonAsync<ValidationProblemDetails>();
        Assert.Contains("Customer", problem!.Errors.Keys);

        var ok = await client.PostAsJsonAsync("/api/invoices", new { customer = "Nile Foods", amount = 900, dueDate = "2026-11-01" });
        Assert.Equal(HttpStatusCode.Created, ok.StatusCode);
        Assert.NotNull(ok.Headers.Location);
    }
}
```

This one test covers routing, binding, validation, ProblemDetails, auth, the service, EF Core mapping, the SQL Server schema and serialisation, all things unit tests miss.

## B10.5 Real databases: Testcontainers and Respawn 🟡 ⭐

> [!term] Testcontainers
> A library that starts throwaway Docker containers (SQL Server, PostgreSQL, Redis, RabbitMQ, Kafka…) from test code and disposes of them afterwards. Tests run against the **same engine as production**, so SQL translation, constraints, transactions and collation behave for real.

Why not the alternatives: EF's **InMemory** provider isn't relational and lets broken queries pass; **SQLite** is a different dialect ([[B5.9]]).

**Keeping tests independent:** reset data between tests. **Respawn** deletes all rows (in foreign-key order) quickly without dropping the schema; alternatives are a transaction rolled back per test, or a fresh database per test class.

<figure class="dia steps"><svg viewBox="0 0 720 160" role="img" aria-label="Integration test lifecycle: start a database container once, apply migrations, run a test, reset data with Respawn, run the next test, then dispose of the container">
<g data-s="1"><rect class="sB" x="14" y="40" width="126" height="50" rx="8"/><text class="sT" x="77" y="63" text-anchor="middle">start container</text><text class="sC" x="77" y="79" text-anchor="middle">once per class</text><line class="sLm" x1="140" y1="65" x2="152" y2="65" marker-end="url(#ahm)"/></g>
<g data-s="2"><rect class="sV" x="154" y="40" width="126" height="50" rx="8"/><text class="sT" x="217" y="63" text-anchor="middle">migrate</text><text class="sC" x="217" y="79" text-anchor="middle">real schema</text><line class="sLm" x1="280" y1="65" x2="292" y2="65" marker-end="url(#ahm)"/></g>
<g data-s="3"><rect class="sA" x="294" y="40" width="126" height="50" rx="8"/><text class="sT" x="357" y="63" text-anchor="middle">test 1</text><text class="sC" x="357" y="79" text-anchor="middle">seeds own data</text><line class="sLm" x1="420" y1="65" x2="432" y2="65" marker-end="url(#ahm)"/></g>
<g data-s="4"><rect class="sW" x="434" y="40" width="126" height="50" rx="8"/><text class="sT" x="497" y="63" text-anchor="middle">Respawn</text><text class="sC" x="497" y="79" text-anchor="middle">delete all rows</text><line class="sLm" x1="560" y1="65" x2="572" y2="65" marker-end="url(#ahm)"/></g>
<g data-s="5"><rect class="sA" x="574" y="40" width="126" height="50" rx="8"/><text class="sT" x="637" y="63" text-anchor="middle">test 2</text><text class="sC" x="637" y="79" text-anchor="middle">clean slate</text></g>
<g data-s="6"><rect class="sR" x="14" y="112" width="692" height="34" rx="8" opacity=".85"/><text class="sC" x="360" y="133" text-anchor="middle">dispose: the container and everything in it disappear</text></g>
</svg><ol class="dia-steps">
<li>An <code>IClassFixture</code> starts a SQL Server (or PostgreSQL) container once for the whole test class: a few seconds.</li>
<li>Apply the real migrations, so the schema is exactly production's.</li>
<li>Each test seeds only the data it needs, then exercises the API.</li>
<li>Between tests, Respawn deletes all rows in foreign-key order, which is much faster than recreating the database.</li>
<li>The next test starts from a clean, known state, so tests can run in any order.</li>
<li>At the end, the container is thrown away. Nothing is shared with other runs or developers.</li>
</ol><figcaption>Fast, isolated integration tests against a real database engine.</figcaption></figure>

## B10.6 Tests that prove security properties 🟡 ⭐

These are the integration tests reviewers love, because they prove the things that matter most:

<figure class="dia"><svg viewBox="0 0 720 208" role="img" aria-label="Tenant isolation test: company A creates an invoice; company B requests it by ID and must receive 404">
<text class="sT" x="100" y="22" text-anchor="middle">client as company A</text><line class="sD" x1="100" y1="32" x2="100" y2="170"/>
<text class="sT" x="360" y="22" text-anchor="middle">API + database</text><line class="sD" x1="360" y1="32" x2="360" y2="170"/>
<text class="sT" x="620" y="22" text-anchor="middle">client as company B</text><line class="sD" x1="620" y1="32" x2="620" y2="170"/>
<line class="sL" x1="100" y1="50" x2="356" y2="58" marker-end="url(#ah)"/><text class="sC" x="230" y="46" text-anchor="middle">POST invoice</text><line class="sLg" x1="356" y1="70" x2="104" y2="78" marker-end="url(#ahg)"/><text class="sGt" x="230" y="92" text-anchor="middle">201 · id 7</text>
<line class="sL" x1="620" y1="110" x2="364" y2="118" marker-end="url(#ah)"/><text class="sM" x="490" y="106" text-anchor="middle">GET /invoices/7</text><line class="sLg" x1="364" y1="130" x2="616" y2="138" marker-end="url(#ahg)"/><text class="sGt" x="490" y="152" text-anchor="middle">404: not even revealed</text>
<text class="sS" x="360" y="196" text-anchor="middle">Assert.Equal(HttpStatusCode.NotFound, res.StatusCode): proves the filter works, on every endpoint, forever</text>
</svg><figcaption>The test that turns "we use global query filters" into evidence.</figcaption></figure>

```csharp
[Fact]
public async Task Tenant_cannot_read_another_tenants_invoice()
{
    var companyA = factory.CreateClient().AsUser(companyId: "c-A", role: "Owner");
    var companyB = factory.CreateClient().AsUser(companyId: "c-B", role: "Owner");

    var created = await companyA.PostAsJsonAsync("/api/invoices", NewInvoice());
    var id = (await created.Content.ReadFromJsonAsync<InvoiceDto>())!.Id;

    var res = await companyB.GetAsync($"/api/invoices/{id}");
    Assert.Equal(HttpStatusCode.NotFound, res.StatusCode);       // not even revealed to exist
}

[Theory]
[InlineData("Accountant", HttpStatusCode.Forbidden)]
[InlineData("Owner", HttpStatusCode.NoContent)]
public async Task Only_owner_can_approve_payment(string role, HttpStatusCode expected) { /* … */ }

[Fact] public async Task Anonymous_request_gets_401() { /* … */ }
```

> [!story]
> Your gaps file names this exact test, "prove company A cannot read company B", as high-value and interview-ready. It turns "we used global query filters" into "and here's the test that proves they work, including on the endpoints added later".

## B10.7 Golden, snapshot and differential tests 🟡

> [!term] Golden / snapshot test
> Run the code, save its output (JSON, HTML, a report) as an approved **"golden" file**, and fail the test whenever the output differs, so a reviewer must approve the change. In .NET, the **Verify** library automates it.

> [!term] Differential test
> Run the same input through **two implementations** (yours and a trusted reference) and compare the outputs. It finds bugs without having to write expected values by hand.

> [!story]
> CS Visualizer's interpreter was checked with **differential tests** (your interpreter's output against real .NET execution of the same C#) and **golden tests**, gated in CI, and they caught **thirteen semantic bugs**. This is your best testing story: say how many bugs, of what kind (for example, integer overflow or short-circuit evaluation), and why ordinary unit tests would have missed them.

## B10.8 Contract, performance and other tests 🟡

- **Contract tests:** check that the OpenAPI document didn't change in a breaking way (diff it in CI), or use **Pact** for consumer-driven contracts between services.
- **Load tests:** **k6** (JavaScript scripts) or **NBomber** (C#) against a staging environment. Measure throughput and p95/p99 latency, and find the breaking point.
- **Micro-benchmarks:** **BenchmarkDotNet**, as in your ADO.NET vs Dapper vs EF Core study. Remember it measures one method in isolation, not the system.
- **Architecture tests:** `NetArchTest` or `ArchUnitNET` assert rules like "Domain must not reference Infrastructure" ([[B9.2]]).

## B10.9 Test data and readability 🟢

```csharp
var invoice = new InvoiceBuilder().ForCompany("c-1").WithAmount(900).Overdue(days: 10).Build();
```

- **Builders** with sensible defaults keep each test focused on what matters for it.
- **Bogus** generates realistic fake data (names, addresses, amounts); **AutoFixture** fills objects automatically.
- One behaviour per test; a test name that says what broke; no logic (loops, conditionals) inside tests.

## B10.10 Coverage, mutation testing and CI 🟡

- **Coverlet** collects coverage in `dotnet test` (`--collect:"XPlat Code Coverage"`); **ReportGenerator** turns it into HTML. Use it to find **untested critical code**, not as a target to game ([[F10.9]]).
- **Stryker.NET** mutation testing tells you whether tests actually detect changes in logic.

<figure class="dia"><svg viewBox="0 0 720 210" role="img" aria-label="Mutation testing changes a greater-than into greater-or-equal; if a test then fails the mutant is killed, and if all tests pass it survived, revealing a missing edge-case test">
<rect class="sB" x="14" y="30" width="330" height="90" rx="8"/><text class="sM" x="30" y="50">original</text><text class="sC" x="30" y="74" xml:space="preserve" style="white-space:pre">if (Paid + p.Amount &gt; Total)</text><text class="sC" x="30" y="96" xml:space="preserve" style="white-space:pre">    throw new InvalidOperationException();</text>
<rect class="sW" x="376" y="30" width="330" height="90" rx="8"/><text class="sM" x="392" y="50">mutant: &gt; becomes &gt;=</text><text class="sC" x="392" y="74" xml:space="preserve" style="white-space:pre">if (Paid + p.Amount &gt;= Total)</text><text class="sC" x="392" y="96" xml:space="preserve" style="white-space:pre">    throw new InvalidOperationException();</text>
<rect class="sG" x="14" y="140" width="330" height="60" rx="8"/><text class="sC" x="179" y="164" text-anchor="middle">a test pays exactly the total → now throws</text><text class="sGt" x="179" y="184" text-anchor="middle">test fails → mutant KILLED ✓</text>
<rect class="sR" x="376" y="140" width="330" height="60" rx="8" opacity=".85"/><text class="sC" x="541" y="164" text-anchor="middle">no test pays exactly the total</text><text class="sC" x="541" y="184" text-anchor="middle">all green → mutant SURVIVED ✗</text>
</svg><figcaption>Mutation testing grades the tests, not the code. A surviving mutant is an edge case nobody checked.</figcaption></figure>

- In CI: run unit tests on every push; run integration tests (with Docker available on the runner, as GitHub's Ubuntu runners have) on every pull request; publish results and coverage; fail the build on test failure, not on a coverage percentage alone.

**TDD** (red, green, refactor) works especially well for domain rules and parsers, like CS Visualizer's interpreter: write the failing case first, then the code. Know the cycle and where you've used it, or would.

> [!lab] The test suite FinSight should have had
> Add a test project to FinSight (or a copy) with: (1) five domain unit tests (`Theory` with edge cases for invoice payments, the transaction categoriser and the daily aggregation gap-filling); (2) an `ApiFactory` with Testcontainers SQL Server, real migrations, a fake `IForecastModel` and a test auth handler; (3) the tenant-isolation test and a role-authorisation theory from [[B10.6]]; (4) a `FakeTimeProvider` test for the nightly job. Run them in GitHub Actions. This is the single most valuable addition to your backend portfolio.

## B10.11 Interview drill 🟢 ⭐

| Question | Strong short answer |
|---|---|
| Unit vs integration test? | Unit tests one piece in isolation with fakes; integration tests real components together, such as the HTTP pipeline with a real database. |
| How do you test code that uses the database? | Integration tests against the real engine in a Testcontainer, with migrations applied and data reset between tests (Respawn). |
| Why not EF Core's InMemory provider? | It isn't relational: no real SQL translation, constraints or transactions, so bugs slip through. |
| What is WebApplicationFactory? | A test host that boots the real ASP.NET Core app in memory, letting you override services and call it with an HttpClient. |
| What do you mock? | External boundaries: third-party APIs, email, the clock, randomness, not your own domain or the DbContext. |
| How do you test time-dependent code? | Inject TimeProvider and use FakeTimeProvider to set and advance time. |
| Fact vs Theory? | Fact is a single test; Theory runs the same test with multiple data sets. |
| How do you share an expensive fixture in xUnit? | IClassFixture for one class, ICollectionFixture across classes. |
| How do you test authorisation? | Integration tests with a test auth handler: anonymous gets 401, the wrong role 403, the wrong tenant 404. |
| What's a golden or snapshot test? | Comparing output with an approved stored version, so changes need explicit review. |
| What's a differential test? | Comparing your implementation's output with a trusted reference on the same inputs. |
| Is high coverage enough? | No: it shows what ran, not what was checked; mutation testing measures test strength. |
| What changed with FluentAssertions? | Version 8 (January 2025) went commercial; teams use v7, the AwesomeAssertions fork, Shouldly, or plain Assert. |

## Key takeaways

> [!check]
> - Unit-test the domain; integration-test the pipeline against a real database.
> - WebApplicationFactory plus Testcontainers is the modern .NET integration-testing setup.
> - Fake only external boundaries and time (TimeProvider).
> - Write the security tests: 401, 403 and cross-tenant 404.
> - Your differential and golden tests are a standout story; tell it with numbers.

## Sources

- Microsoft Learn: [Integration tests in ASP.NET Core](https://learn.microsoft.com/en-us/aspnet/core/test/integration-tests), [Unit testing best practices](https://learn.microsoft.com/en-us/dotnet/core/testing/unit-testing-best-practices), [TimeProvider](https://learn.microsoft.com/en-us/dotnet/standard/datetime/timeprovider-overview), [Testing EF Core applications](https://learn.microsoft.com/en-us/ef/core/testing/).
- [xUnit.net documentation](https://xunit.net/) · [NSubstitute](https://nsubstitute.github.io/) · [Testcontainers for .NET](https://dotnet.testcontainers.org/) · [Respawn](https://github.com/jbogard/Respawn) · [Verify](https://github.com/VerifyTests/Verify) · [Stryker.NET](https://stryker-mutator.io/docs/stryker-net/introduction/) · [k6](https://grafana.com/docs/k6/latest/) · [NBomber](https://nbomber.com/).
- DevClass, [Fluent Assertions shifts to a restrictive licence](https://www.devclass.com/development/2025/01/16/another-open-source-project-shifts-to-restrictive-license-fluent-assertions-following-xceed-partnership/1621343) (January 2025); [AwesomeAssertions](https://www.nuget.org/packages/awesomeassertions).
- Martin Fowler, [The Practical Test Pyramid](https://martinfowler.com/articles/practical-test-pyramid.html).
