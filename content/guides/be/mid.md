# Backend Developer — mid level

*What a mid-level role adds: database tuning, concurrency, real auth flows, caching and messaging, resilience, observability, architecture and testing strategy.*

## Database design and tuning

- Normalise to remove update anomalies, then denormalise deliberately where reads justify it ([PostgreSQL: Data definition — constraints and normal design via keys](https://www.postgresql.org/docs/current/ddl-constraints.html)).
- A B-tree index on several columns is most useful when queries filter on its leading columns ([PostgreSQL: Multicolumn indexes](https://www.postgresql.org/docs/current/indexes-multicolumn.html)).
- A covering index can answer a query from the index alone (an index-only scan) ([PostgreSQL: Index-only scans and covering indexes](https://www.postgresql.org/docs/current/indexes-index-only-scans.html)).
- Wrapping an indexed column in a function stops a plain index from being used; index the expression instead ([PostgreSQL: Indexes on expressions](https://www.postgresql.org/docs/current/indexes-expressional.html)).
- Isolation levels trade anomalies for concurrency: read committed, repeatable read and serializable ([PostgreSQL: Transaction isolation](https://www.postgresql.org/docs/current/transaction-iso.html)).
- SQL Server offers the same standard levels plus snapshot isolation, which reads row versions instead of taking shared locks ([SQL Server: SET TRANSACTION ISOLATION LEVEL](https://learn.microsoft.com/en-us/sql/t-sql/statements/set-transaction-isolation-level-transact-sql)).

## EF Core beyond the basics

- Including two collections in one query multiplies rows (a cartesian explosion); `AsSplitQuery()` loads them in separate queries ([EF Core: Single vs. split queries](https://learn.microsoft.com/en-us/ef/core/querying/single-split-queries)).
- Optimistic concurrency uses a concurrency token; a conflicting update throws `DbUpdateConcurrencyException` ([EF Core: Handling concurrency conflicts](https://learn.microsoft.com/en-us/ef/core/saving/concurrency)).
- `ExecuteUpdate` and `ExecuteDelete` change many rows in one SQL statement without loading them ([EF Core: ExecuteUpdate and ExecuteDelete](https://learn.microsoft.com/en-us/ef/core/saving/execute-insert-update-delete)).
- Compiled queries and DbContext pooling reduce per-request overhead in hot paths ([EF Core: Advanced performance topics](https://learn.microsoft.com/en-us/ef/core/performance/advanced-performance-topics)).

## Auth in depth

- OAuth 2.0 defines roles (resource owner, client, authorization server, resource server) and grants for obtaining access tokens ([RFC 6749: OAuth 2.0](https://www.rfc-editor.org/rfc/rfc6749.html)).
- PKCE binds the authorization code to the client that requested it, protecting public clients from code interception ([RFC 7636: PKCE](https://www.rfc-editor.org/rfc/rfc7636.html)).
- The implicit grant and the resource owner password grant should not be used ([RFC 9700 §2.1.2 and §2.4](https://www.rfc-editor.org/rfc/rfc9700.html)).
- OpenID Connect adds an ID token and user identity on top of OAuth 2.0 ([OpenID Connect Core 1.0](https://openid.net/specs/openid-connect-core-1_0.html)).
- Validate a JWT's signature, issuer, audience and expiry before trusting its claims ([RFC 8725: JWT Best Current Practices](https://www.rfc-editor.org/rfc/rfc8725.html)).
- Policy-based authorization expresses rules as requirements and handlers ([ASP.NET Core: Policy-based authorization](https://learn.microsoft.com/en-us/aspnet/core/security/authorization/policies)).

## Caching and messaging

- `IDistributedCache` stores cache entries in an external store such as Redis, shared by all app instances ([ASP.NET Core: Distributed caching](https://learn.microsoft.com/en-us/aspnet/core/performance/caching/distributed)).
- `HybridCache` combines an in-memory and a distributed cache and protects against stampedes ([ASP.NET Core: HybridCache](https://learn.microsoft.com/en-us/aspnet/core/performance/caching/hybrid)).
- Redis sorted sets keep members ordered by score, which suits leaderboards and sliding-window counters ([Redis: Sorted sets](https://redis.io/docs/latest/develop/data-types/sorted-sets/)).
- The transactional outbox writes the event in the same database transaction as the change, then publishes it, so the two cannot diverge ([Azure Architecture Center: Transactional outbox](https://learn.microsoft.com/en-us/azure/architecture/databases/guide/transactional-out-box-cosmos)).
- Most brokers deliver at least once, so consumers must be idempotent ([RabbitMQ: Reliability guide](https://www.rabbitmq.com/docs/reliability)).
- A saga coordinates a business transaction across services with compensating actions instead of a distributed lock ([Azure Architecture Center: Saga pattern](https://learn.microsoft.com/en-us/azure/architecture/patterns/saga)).

## Resilience and observability

- Retries need exponential backoff with jitter so clients do not retry in lockstep ([AWS Builders' Library: Timeouts, retries and backoff with jitter](https://builder.aws.com/content/3EumjoZascWd1oZiEgL8ORlv3qE/timeouts-retries-and-backoff-with-jitter)).
- A circuit breaker fails fast while a dependency is unhealthy and probes it before closing again ([Azure Architecture Center: Circuit Breaker pattern](https://learn.microsoft.com/en-us/azure/architecture/patterns/circuit-breaker)).
- Rate limiting middleware applies fixed-window, sliding-window, token-bucket or concurrency limiters ([ASP.NET Core: Rate limiting middleware](https://learn.microsoft.com/en-us/aspnet/core/performance/rate-limit)).
- Health checks expose liveness and readiness endpoints for load balancers and orchestrators ([ASP.NET Core: Health checks](https://learn.microsoft.com/en-us/aspnet/core/host-and-deploy/health-checks)).
- .NET emits traces and metrics through `ActivitySource` and `Meter`, which OpenTelemetry exports ([.NET: Observability with OpenTelemetry](https://learn.microsoft.com/en-us/dotnet/core/diagnostics/observability-with-otel)).
- Alert on symptoms users feel, measured against an error budget, rather than on every cause ([Google SRE book: Monitoring distributed systems](https://sre.google/sre-book/monitoring-distributed-systems/)).

## Architecture

- Model a complex domain with aggregates that guard their own invariants inside one consistency boundary ([.NET microservices: Designing a DDD-oriented microservice](https://learn.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/ddd-oriented-microservice)).
- CQRS separates the write model from read models when their needs differ ([Azure Architecture Center: CQRS pattern](https://learn.microsoft.com/en-us/azure/architecture/patterns/cqrs)).
- Record significant decisions and their trade-offs as architecture decision records ([Azure Well-Architected: Architecture decision record](https://learn.microsoft.com/en-us/azure/well-architected/architect-role/architecture-decision-record)).

## Testing

- Unit tests should be fast, isolated, repeatable and self-checking ([.NET: Unit testing best practices](https://learn.microsoft.com/en-us/dotnet/core/testing/unit-testing-best-practices)).
- Share expensive setup such as a database container across tests with xUnit class or collection fixtures ([xUnit.net: Shared context between tests](https://xunit.net/docs/shared-context)).
- Testcontainers starts real dependencies such as PostgreSQL in Docker for integration tests ([Testcontainers for .NET](https://dotnet.testcontainers.org/)).

## Scaling

- Output caching stores whole responses on the server for repeated requests ([ASP.NET Core: Output caching middleware](https://learn.microsoft.com/en-us/aspnet/core/performance/caching/output)).
- Choose a load balancer by layer and scope: global or regional, HTTP-aware (layer 7) or transport (layer 4) ([Azure: Load-balancing options](https://learn.microsoft.com/en-us/azure/architecture/guide/technology-choices/load-balancing-overview)).
- Node.js runs JavaScript on one thread; CPU-heavy work blocks every request, so move it to worker threads ([Node.js: Don't block the event loop](https://nodejs.org/learn/asynchronous-work/dont-block-the-event-loop)).
