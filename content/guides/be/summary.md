# Backend Developer — super summary

## Foundations

- HTTP methods have defined semantics: GET is safe, PUT and DELETE are idempotent, POST is neither ([RFC 9110 §9.2](https://www.rfc-editor.org/rfc/rfc9110.html#section-9.2)).
- SQL joins combine rows from tables; an outer join keeps rows that have no match and fills the other side with NULL ([PostgreSQL: Joined tables](https://www.postgresql.org/docs/current/queries-table-expressions.html#QUERIES-JOIN)).
- Window functions compute across related rows without collapsing them, unlike `GROUP BY` ([PostgreSQL: Window functions tutorial](https://www.postgresql.org/docs/current/tutorial-window.html)).
- A container is an isolated process that packages an application with everything it needs, so it runs the same way on any machine ([Docker: What is a container?](https://docs.docker.com/learn/content/what-is-a-container/)).

## C# and .NET

- Value types hold their data directly and are copied on assignment; reference types hold a reference to an object on the heap ([C# reference: Value types](https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/builtin-types/value-types)).
- The garbage collector frees managed memory automatically; unmanaged resources such as connections are released with `IDisposable` and `using` ([.NET: Fundamentals of garbage collection](https://learn.microsoft.com/en-us/dotnet/standard/garbage-collection/fundamentals)).
- `async`/`await` frees the thread while I/O is in progress, so a server handles more requests with the same threads ([C#: Asynchronous programming](https://learn.microsoft.com/en-us/dotnet/csharp/asynchronous-programming/)).
- LINQ queries are deferred: they run when you enumerate them, not when you define them ([C#: Introduction to LINQ queries](https://learn.microsoft.com/en-us/dotnet/csharp/linq/get-started/introduction-to-linq-queries)).

## ASP.NET Core

- Requests pass through a middleware pipeline in the order the middleware is added ([ASP.NET Core: Middleware](https://learn.microsoft.com/en-us/aspnet/core/fundamentals/middleware/)).
- Services are registered with a lifetime: transient (new each time), scoped (one per request) or singleton (one for the app) ([.NET: Service lifetimes](https://learn.microsoft.com/en-us/dotnet/core/extensions/dependency-injection/service-lifetimes)).
- Configuration is layered from providers such as `appsettings.json`, environment variables and command-line arguments, later ones overriding earlier ([ASP.NET Core: Configuration](https://learn.microsoft.com/en-us/aspnet/core/fundamentals/configuration/)).
- Error responses use the Problem Details format standardised in RFC 9457 ([RFC 9457](https://www.rfc-editor.org/rfc/rfc9457.html)).

## Data

- EF Core tracks the entities it loads and turns changes into SQL on `SaveChanges` ([EF Core: Change tracking](https://learn.microsoft.com/en-us/ef/core/change-tracking/)).
- Load related data explicitly with `Include` or projection; lazy loading in a loop causes the N+1 query problem ([EF Core: Efficient querying](https://learn.microsoft.com/en-us/ef/core/performance/efficient-querying)).
- Migrations keep the database schema in step with the model as code ([EF Core: Migrations](https://learn.microsoft.com/en-us/ef/core/managing-schemas/migrations/)).
- An index speeds up reads on the indexed columns and costs extra work on every write ([PostgreSQL: Indexes](https://www.postgresql.org/docs/current/indexes.html)).
- `EXPLAIN ANALYZE` shows the plan the database chose and the real time each step took ([PostgreSQL: Using EXPLAIN](https://www.postgresql.org/docs/current/using-explain.html)).

## Security

- A JWT is a signed set of claims; signing protects integrity, not confidentiality, so the payload is readable ([RFC 7519: JSON Web Token](https://www.rfc-editor.org/rfc/rfc7519.html)).
- Browser and mobile apps should use the authorization code flow with PKCE ([RFC 9700: OAuth 2.0 Security Best Current Practice](https://www.rfc-editor.org/rfc/rfc9700.html)).
- Store passwords with a slow, salted algorithm such as Argon2id, scrypt or bcrypt, never plain hashes ([OWASP: Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)).
- Prevent SQL injection with parameterised queries ([OWASP: SQL Injection Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html)).
- Broken object level authorization is the top API risk: check that the caller may access *this* record, not just that they are logged in ([OWASP API Security Top 10 2023](https://api-security.owasp.org/editions/2023/en/0x11-t10/)).

## Production concerns

- Cache-aside: read from the cache, fall back to the database on a miss and populate the cache ([Azure Architecture Center: Cache-Aside pattern](https://learn.microsoft.com/en-us/azure/architecture/patterns/cache-aside)).
- Long or unreliable work goes to a queue and a background worker; `BackgroundService` hosts such workers in ASP.NET Core ([ASP.NET Core: Hosted services](https://learn.microsoft.com/en-us/aspnet/core/fundamentals/host/hosted-services)).
- Observability rests on three signals: traces, metrics and logs ([OpenTelemetry: Signals](https://opentelemetry.io/docs/concepts/signals/)).
- Retry transient failures with exponential backoff and jitter, and stop calling a failing dependency with a circuit breaker ([.NET: Build resilient HTTP apps](https://learn.microsoft.com/en-us/dotnet/core/resilience/http-resilience)).

## Design, testing and delivery

- Keep business logic independent of frameworks and infrastructure by depending on abstractions ([.NET architecture: Architectural principles](https://learn.microsoft.com/en-us/dotnet/architecture/modern-web-apps-azure/architectural-principles)).
- Integration tests can host the real app in memory with `WebApplicationFactory` ([ASP.NET Core: Integration tests](https://learn.microsoft.com/en-us/aspnet/core/test/integration-tests)).
- A CI workflow runs on events such as a push or pull request and executes jobs of steps ([GitHub Actions: Understanding GitHub Actions](https://docs.github.com/en/actions/get-started/understand-github-actions)).

## System design

- In a network partition a distributed system must choose between consistency and availability; Brewer later stressed that partitions are rare and the trade-off is about degrees ([Brewer: CAP twelve years later](https://www.infoq.com/articles/cap-twelve-years-later-how-the-rules-have-changed/)).
- Sharding splits data across partitions by a key to scale writes and storage ([Azure Architecture Center: Sharding pattern](https://learn.microsoft.com/en-us/azure/architecture/patterns/sharding)).
- Define reliability with service level objectives measured by service level indicators ([Google SRE book: Service Level Objectives](https://sre.google/sre-book/service-level-objectives/)).
