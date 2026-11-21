# Backend Developer — entry level

*What a junior backend role expects: C# and .NET basics, a working ASP.NET Core API, SQL, EF Core, Git and the shell.*

## HTTP and APIs

- Use nouns for resources and HTTP methods for actions: `GET /invoices`, `POST /invoices`, `GET /invoices/42` ([RFC 9110 §9.3: Method definitions](https://www.rfc-editor.org/rfc/rfc9110.html#section-9.3)).
- 201 Created answers a successful POST that created a resource, usually with a `Location` header ([RFC 9110 §15.3.2](https://www.rfc-editor.org/rfc/rfc9110.html#section-15.3.2)).
- 400 is a malformed request, 404 a missing resource, 409 a conflict with the resource's current state ([RFC 9110 §15.5](https://www.rfc-editor.org/rfc/rfc9110.html#section-15.5)).
- An OpenAPI document describes an HTTP API's paths, parameters and schemas in a machine-readable way ([OpenAPI Specification](https://spec.openapis.org/oas/latest.html)).

## SQL

- `WHERE` filters rows before grouping; `HAVING` filters groups after aggregation ([PostgreSQL: The GROUP BY and HAVING clauses](https://www.postgresql.org/docs/current/queries-table-expressions.html#QUERIES-GROUP)).
- Comparing with NULL using `=` yields NULL, not true; use `IS NULL` ([PostgreSQL: Comparison functions and operators](https://www.postgresql.org/docs/current/functions-comparison.html)).
- A primary key uniquely identifies each row; a foreign key makes a column match a key in another table ([PostgreSQL: Constraints](https://www.postgresql.org/docs/current/ddl-constraints.html)).
- A transaction groups statements so that they all succeed or none do ([PostgreSQL: Transactions](https://www.postgresql.org/docs/current/tutorial-transactions.html)).

## C# essentials

- `string` is an immutable reference type; build long strings with `StringBuilder` ([.NET: StringBuilder](https://learn.microsoft.com/en-us/dotnet/standard/base-types/stringbuilder)).
- Nullable reference types make the compiler warn when a possibly-null reference is used without a check ([C#: Nullable reference types](https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/null-safety/nullable-reference-types)).
- Records give value-based equality and concise immutable data types ([C# reference: Records](https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/builtin-types/record)).
- `using` declarations dispose an object when it goes out of scope ([C# reference: using statement](https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/statements/using)).
- `List<T>`, `Dictionary<TKey,TValue>` and `HashSet<T>` are the everyday generic collections ([.NET: Collections](https://learn.microsoft.com/en-us/dotnet/standard/collections/)).
- Retrieving a value by key from a `Dictionary` is close to O(1) ([.NET API: Dictionary&lt;TKey,TValue&gt;](https://learn.microsoft.com/en-us/dotnet/api/system.collections.generic.dictionary-2)).
- Do not block on async code with `.Result` or `.Wait()`; await it all the way up ([.NET: Async best practices — ASP.NET Core performance](https://learn.microsoft.com/en-us/aspnet/core/fundamentals/best-practices#avoid-blocking-calls)).

## OOP

- Encapsulation, inheritance and polymorphism are the core object-oriented ideas in C# ([C#: Object-oriented programming](https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/tutorials/oop)).
- An interface defines a contract that classes implement; code that depends on the interface can be given any implementation ([C#: Interfaces](https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/types/interfaces)).
- Depend on abstractions, keep each class to one responsibility and separate concerns ([.NET architecture: Architectural principles](https://learn.microsoft.com/en-us/dotnet/architecture/modern-web-apps-azure/architectural-principles)).

## ASP.NET Core

- Minimal APIs map routes to handlers in a few lines; controllers group endpoints in classes ([ASP.NET Core: APIs overview](https://learn.microsoft.com/en-us/aspnet/core/fundamentals/apis)).
- Constructor injection is the normal way to receive services ([ASP.NET Core: Dependency injection](https://learn.microsoft.com/en-us/aspnet/core/fundamentals/dependency-injection)).
- Register a `DbContext` as scoped so each request gets its own ([EF Core: DbContext lifetime, configuration, and initialization](https://learn.microsoft.com/en-us/ef/core/dbcontext-configuration/)).
- Model binding reads route values, query strings and the body into parameters; validation attributes such as `[Required]` check them ([ASP.NET Core: Model validation](https://learn.microsoft.com/en-us/aspnet/core/mvc/models/validation)).
- `ILogger<T>` writes structured logs with message templates such as `"Order {OrderId} paid"` ([ASP.NET Core: Logging](https://learn.microsoft.com/en-us/aspnet/core/fundamentals/logging/)).
- Bind settings to typed classes with the options pattern instead of reading strings ([ASP.NET Core: Options pattern](https://learn.microsoft.com/en-us/aspnet/core/fundamentals/configuration/options)).

## EF Core

- A `DbContext` represents a session with the database; `DbSet<T>` properties are its tables ([EF Core: Overview](https://learn.microsoft.com/en-us/ef/core/)).
- Use `AsNoTracking()` for read-only queries to skip change-tracking overhead ([EF Core: Tracking vs. no-tracking queries](https://learn.microsoft.com/en-us/ef/core/querying/tracking)).
- `Include` loads related entities in the same query (eager loading) ([EF Core: Eager loading](https://learn.microsoft.com/en-us/ef/core/querying/related-data/eager)).
- `dotnet ef migrations add` creates a migration and `dotnet ef database update` applies it ([EF Core: Migrations overview](https://learn.microsoft.com/en-us/ef/core/managing-schemas/migrations/)).
- `FromSql` with an interpolated string sends values as parameters, which protects against SQL injection ([EF Core: SQL queries](https://learn.microsoft.com/en-us/ef/core/querying/sql-queries)).

## Tools

- Git records snapshots; branches are movable pointers to commits ([Pro Git: Branches in a Nutshell](https://git-scm.com/book/en/v2/Git-Branching-Branches-in-a-Nutshell)).
- `systemctl status` shows a service's state and its latest log lines ([systemctl man page](https://www.freedesktop.org/software/systemd/man/latest/systemctl.html)).
- A multi-stage Dockerfile builds in one stage and copies only the output into a small runtime image ([Docker: Multi-stage builds](https://docs.docker.com/build/building/multi-stage/)).

## Security basics

- Hash passwords with a dedicated algorithm; ASP.NET Core Identity does this for you ([ASP.NET Core: Introduction to Identity](https://learn.microsoft.com/en-us/aspnet/core/security/authentication/identity)).
- Authentication establishes who the user is; authorization decides what they may do ([ASP.NET Core: Authentication overview](https://learn.microsoft.com/en-us/aspnet/core/security/authentication/)).
- Keep secrets out of source control; use user secrets in development and a vault such as Azure Key Vault in production ([ASP.NET Core: Safe storage of app secrets](https://learn.microsoft.com/en-us/aspnet/core/security/app-secrets)).
