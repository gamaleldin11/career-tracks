# Backend Developer — interview prep

*Short answers to the questions that come up most in .NET backend interviews.*

## C# and .NET

### Value types and reference types?

Value types such as `int` and `struct` hold their data and are copied on assignment; reference types such as classes and strings hold a reference, so two variables can point at the same object ([C# reference: Value types](https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/builtin-types/value-types), [C# reference: Reference types](https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/keywords/reference-types)).

### What does `async`/`await` actually do?

It lets a method wait for I/O without holding a thread; the method returns a `Task`, and the rest of it runs when the awaited work completes, so a server serves more concurrent requests ([C#: Asynchronous programming](https://learn.microsoft.com/en-us/dotnet/csharp/asynchronous-programming/)).

### Why is `.Result` dangerous in ASP.NET Core?

It blocks a thread-pool thread while waiting, which under load leads to thread-pool starvation; use `await` throughout ([ASP.NET Core: Best practices — avoid blocking calls](https://learn.microsoft.com/en-us/aspnet/core/fundamentals/best-practices#avoid-blocking-calls)).

### `IEnumerable` or `IQueryable`?

`IQueryable` builds an expression that a provider such as EF Core translates to SQL, so filters run in the database; `IEnumerable` runs in memory over whatever was already loaded ([EF Core: How queries work](https://learn.microsoft.com/en-us/ef/core/querying/how-query-works)).

## ASP.NET Core

### Explain the DI lifetimes.

Transient: a new instance each time it is requested. Scoped: one per request. Singleton: one for the app's lifetime. Do not inject a scoped service such as a `DbContext` into a singleton ([.NET: Service lifetimes](https://learn.microsoft.com/en-us/dotnet/core/extensions/dependency-injection/service-lifetimes)).

### What is middleware?

Components that form the request pipeline; each can act before and after calling the next one, and their order matters, for example authentication before authorization ([ASP.NET Core: Middleware](https://learn.microsoft.com/en-us/aspnet/core/fundamentals/middleware/)).

### How do you return errors from an API?

As Problem Details (RFC 9457) with an appropriate status code; ASP.NET Core can produce them for you ([RFC 9457](https://www.rfc-editor.org/rfc/rfc9457.html), [ASP.NET Core: Handle errors](https://learn.microsoft.com/en-us/aspnet/core/fundamentals/error-handling)).

### PUT or PATCH?

PUT replaces the target's state with the request content and is idempotent; PATCH applies a partial change ([RFC 9110 §9.3.4: PUT](https://www.rfc-editor.org/rfc/rfc9110.html#section-9.3.4), [RFC 5789: PATCH](https://www.rfc-editor.org/rfc/rfc5789.html)).

## Data

### What is the N+1 problem and how do you fix it?

Loading a list with one query and then each item's related data with one query per item; fix it with eager loading via `Include` or a projection with `Select` ([EF Core: Efficient querying](https://learn.microsoft.com/en-us/ef/core/performance/efficient-querying)).

### How do you find out why a query is slow?

Read the actual plan with `EXPLAIN ANALYZE` (or the actual execution plan in SQL Server), look for scans of large tables and bad row estimates, then add or fix an index ([PostgreSQL: Using EXPLAIN](https://www.postgresql.org/docs/current/using-explain.html)).

### When does an index not help?

When the query filters on a function of the column, on a non-leading column of a composite index, or returns a large share of the table; every index also slows writes ([PostgreSQL: Indexes](https://www.postgresql.org/docs/current/indexes.html), [PostgreSQL: Multicolumn indexes](https://www.postgresql.org/docs/current/indexes-multicolumn.html)).

### How do you handle two users editing the same record?

Optimistic concurrency: a version column is checked in the `UPDATE`'s `WHERE`; if no row matches, EF Core throws `DbUpdateConcurrencyException` and you reload or ask the user ([EF Core: Handling concurrency conflicts](https://learn.microsoft.com/en-us/ef/core/saving/concurrency)).

## Security

### What is in a JWT, and is it encrypted?

A header, a payload of claims and a signature, each Base64url-encoded; a signed JWT is readable by anyone, so never put secrets in it ([RFC 7519: JSON Web Token](https://www.rfc-editor.org/rfc/rfc7519.html)).

### Which OAuth flow for a single-page app?

Authorization code with PKCE; the implicit flow is deprecated ([RFC 9700: OAuth 2.0 Security BCP](https://www.rfc-editor.org/rfc/rfc9700.html)).

### How do you store passwords?

With a slow, salted password-hashing function such as Argon2id, scrypt, bcrypt or PBKDF2, never encryption or a fast hash ([OWASP: Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)).

### How do you prevent SQL injection?

Send values as parameters, never by string concatenation; EF Core LINQ and interpolated `FromSql` do this for you ([OWASP: SQL Injection Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html), [EF Core: SQL queries](https://learn.microsoft.com/en-us/ef/core/querying/sql-queries)).

## Production and design

### How do you make a call to another service reliable?

Timeouts on every call, retries with exponential backoff and jitter for transient errors only, a circuit breaker for a failing dependency, and idempotency keys for operations you retry ([.NET: Build resilient HTTP apps](https://learn.microsoft.com/en-us/dotnet/core/resilience/http-resilience), [AWS Builders' Library: Timeouts, retries and backoff](https://builder.aws.com/content/3EumjoZascWd1oZiEgL8ORlv3qE/timeouts-retries-and-backoff-with-jitter)).

### How do you publish an event reliably after a database change?

The transactional outbox: write the event to an outbox table in the same transaction, then a relay publishes it; consumers must be idempotent because delivery is at least once ([Azure Architecture Center: Transactional outbox](https://learn.microsoft.com/en-us/azure/architecture/databases/guide/transactional-out-box-cosmos)).

### Monolith or microservices?

Start with a well-modularised monolith unless teams or scaling needs force a split; microservices add network calls, distributed data and operational cost ([.NET microservices: Architecting container and microservice-based applications](https://learn.microsoft.com/en-us/dotnet/architecture/microservices/architect-microservice-container-applications/)).

### How would you know your API is healthy in production?

Define SLOs on the signals users feel, such as latency and error rate, and collect traces, metrics and logs with OpenTelemetry ([Google SRE book: Service Level Objectives](https://sre.google/sre-book/service-level-objectives/), [OpenTelemetry: Signals](https://opentelemetry.io/docs/concepts/signals/)).

## Behavioural

### How do you answer a question about a past conflict or mistake?

Give the situation, what you did yourself and what changed as a result; structured interviews score every candidate against the same job-related criteria ([US OPM: Structured interviews](https://www.opm.gov/policy-data-oversight/assessment-and-selection/other-assessment-methods/structured-interviews/)).
