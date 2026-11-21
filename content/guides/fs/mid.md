# Full-Stack Developer — mid level

*What a mid-level role adds: choosing an architecture, auth across origins and providers, real-time and file features, and operating what you ship.*

## Architecture

- Pick rendering per screen: static or server rendering for fast first content and SEO, client rendering for app-like screens ([web.dev: Rendering on the Web](https://web.dev/articles/rendering-on-the-web)).
- Generate the front-end client and types from the API's OpenAPI document so a breaking change fails the build ([openapi-typescript](https://openapi-ts.dev/)).
- A backend-for-frontend keeps tokens on the server and gives the browser only a session cookie ([RFC 10017: OAuth 2.0 for Browser-Based Applications](https://www.rfc-editor.org/rfc/rfc10017.html)).

## Auth across origins and providers

- External login uses OpenID Connect: the app receives an ID token describing the user ([OpenID Connect Core 1.0](https://openid.net/specs/openid-connect-core-1_0.html)).
- Use the authorization code flow with PKCE and an exact redirect URI match ([RFC 9700: OAuth 2.0 Security BCP](https://www.rfc-editor.org/rfc/rfc9700.html)).
- Cross-origin requests with cookies need `credentials: 'include'` on the client and `Access-Control-Allow-Credentials` plus an explicit origin on the server ([MDN: CORS — requests with credentials](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS#requests_with_credentials)).
- Preflight `OPTIONS` requests check non-simple requests, such as JSON POSTs, before they are sent ([MDN: Preflight request](https://developer.mozilla.org/en-US/docs/Glossary/Preflight_request)).
- `SameSite` limits when cookies cross sites; `Lax` blocks them on cross-site POSTs ([MDN: Set-Cookie — SameSite](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Set-Cookie#samesitesamesite-value)).
- WebSockets cannot set headers from the browser, so SignalR sends the access token in the query string for WebSocket connections ([ASP.NET Core: SignalR authentication and authorization](https://learn.microsoft.com/en-us/aspnet/core/signalr/authn-and-authz)).

## Real-world features

- Validate uploads by type, size and content, store them outside the web root and rename them ([OWASP: File Upload Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html)).
- For large files, let the browser upload straight to blob storage with a short-lived shared access signature ([Azure Storage: Shared access signatures](https://learn.microsoft.com/en-us/azure/storage/common/storage-sas-overview)).
- Server-sent events stream one-way updates over plain HTTP; WebSockets give a two-way channel ([MDN: Server-sent events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events), [RFC 6455: WebSocket](https://www.rfc-editor.org/rfc/rfc6455.html)).
- With more than one server, SignalR needs a backplane such as Redis so messages reach clients on every instance ([ASP.NET Core: SignalR Redis backplane](https://learn.microsoft.com/en-us/aspnet/core/signalr/redis-backplane)).
- Verify payment webhooks by their signature and handle each event idempotently, because providers retry ([Stripe: Webhooks](https://docs.stripe.com/webhooks)).
- Store instants as UTC or with an offset and format them in the user's time zone at the edge ([.NET: Choose between DateTime, DateOnly, DateTimeOffset, TimeSpan, TimeOnly and TimeZoneInfo](https://learn.microsoft.com/en-us/dotnet/standard/datetime/choosing-between-datetime)).
- `Intl.DateTimeFormat` and `Intl.NumberFormat` format dates and numbers per locale in the browser ([MDN: Intl](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl)).
- PostgreSQL full-text search matches `tsvector` documents against `tsquery` queries, which is often enough before a search engine ([PostgreSQL: Full text search introduction](https://www.postgresql.org/docs/current/textsearch-intro.html)).
- EF Core global query filters implement soft delete and multi-tenancy rules once for every query ([EF Core: Global query filters](https://learn.microsoft.com/en-us/ef/core/querying/filters)).
- Transactional email needs SPF, DKIM and DMARC records to be delivered and trusted ([RFC 7208: SPF](https://www.rfc-editor.org/rfc/rfc7208.html), [RFC 6376: DKIM](https://www.rfc-editor.org/rfc/rfc6376.html), [RFC 7489: DMARC](https://www.rfc-editor.org/rfc/rfc7489.html)).

## Shipping and operating

- Behind Nginx or a load balancer, enable forwarded-headers middleware so redirects and cookies use the right scheme ([ASP.NET Core: Configure for proxy servers and load balancers](https://learn.microsoft.com/en-us/aspnet/core/host-and-deploy/proxy-load-balancer)).
- Deployment slots on App Service let you warm up and swap a release with no downtime ([Azure App Service: Set up staging environments](https://learn.microsoft.com/en-us/azure/app-service/deploy-staging-slots)).
- Azure Static Web Apps hosts a built front end with a global CDN and an attached API ([Azure Static Web Apps overview](https://learn.microsoft.com/en-us/azure/static-web-apps/overview)).
- Run database migrations as a deliberate pipeline step, and make each change backward compatible with the running version ([EF Core: Applying migrations](https://learn.microsoft.com/en-us/ef/core/managing-schemas/migrations/applying)).
- Health checks tell the platform when an instance is ready for traffic ([ASP.NET Core: Health checks](https://learn.microsoft.com/en-us/aspnet/core/host-and-deploy/health-checks)).
- Trace a request from the browser through the API to the database with OpenTelemetry context propagation ([OpenTelemetry: Context propagation](https://opentelemetry.io/docs/concepts/context-propagation/)).
- Clients should send an idempotency key with retried POSTs so the server can deduplicate them ([IETF draft: The Idempotency-Key HTTP header](https://datatracker.ietf.org/doc/draft-ietf-httpapi-idempotency-key-header/)).
