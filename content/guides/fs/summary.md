# Full-Stack Developer — super summary

## Foundations

- HTTP gives every request a method, target, headers and body, and every response a status code ([RFC 9110: HTTP Semantics](https://www.rfc-editor.org/rfc/rfc9110.html)).
- An origin is scheme, host and port; the browser's same-origin policy separates them ([MDN: Same-origin policy](https://developer.mozilla.org/en-US/docs/Web/Security/Defenses/Same-origin_policy)).
- SQL transactions make a group of statements succeed or fail together ([PostgreSQL: Transactions](https://www.postgresql.org/docs/current/tutorial-transactions.html)).
- Git branches are lightweight pointers to commits, which makes feature branches cheap ([Pro Git: Branches in a Nutshell](https://git-scm.com/book/en/v2/Git-Branching-Branches-in-a-Nutshell)).

## The front end

- Semantic HTML gives elements a meaning and built-in accessibility ([MDN: Semantics](https://developer.mozilla.org/en-US/docs/Glossary/Semantics)).
- JavaScript runs on one thread; promise callbacks run as microtasks before the next task ([MDN: Using microtasks](https://developer.mozilla.org/en-US/docs/Web/API/HTML_DOM_API/Microtask_guide)).
- TypeScript types are checked at compile time and erased at run time, so data from an API must still be validated ([TypeScript: The Basics](https://www.typescriptlang.org/docs/handbook/2/basic-types.html)).
- React re-renders a component when its state changes; effects are for synchronising with outside systems ([React: You Might Not Need an Effect](https://react.dev/learn/you-might-not-need-an-effect)).
- Angular builds on components, dependency injection and signals ([Angular: Signals](https://angular.dev/guide/signals)).

## The back end

- ASP.NET Core handles each request through a middleware pipeline and resolves services through dependency injection ([ASP.NET Core: Middleware](https://learn.microsoft.com/en-us/aspnet/core/fundamentals/middleware/)).
- EF Core maps classes to tables, tracks changes and applies schema changes through migrations ([EF Core: Migrations](https://learn.microsoft.com/en-us/ef/core/managing-schemas/migrations/)).
- Node.js runs JavaScript on an event loop, so CPU-heavy work blocks every request ([Node.js: Don't block the event loop](https://nodejs.org/learn/asynchronous-work/dont-block-the-event-loop)).

## Joining the halves

- Describe the API once in OpenAPI and generate the typed client from it, so both halves share one contract ([OpenAPI Specification](https://spec.openapis.org/oas/latest.html)).
- Front-end build tools inline public environment values into the bundle, so anything there is visible to users ([Vite: Env variables and modes](https://vite.dev/guide/env-and-mode)).
- Serving the front end and the API from one origin avoids CORS; otherwise the API must allow the front end's origin explicitly ([ASP.NET Core: Enable CORS](https://learn.microsoft.com/en-us/aspnet/core/security/cors)).
- Cookie sessions on one origin, an in-memory token with a refresh cookie, or a backend-for-frontend are the three common browser auth designs ([RFC 10017: OAuth 2.0 for Browser-Based Applications](https://www.rfc-editor.org/rfc/rfc10017.html)).
- SignalR pushes server events to browsers over WebSockets, falling back to other transports when needed ([ASP.NET Core: SignalR overview](https://learn.microsoft.com/en-us/aspnet/core/signalr/introduction)).

## Shipping

- Build a small runtime image with a multi-stage Dockerfile ([Docker: Multi-stage builds](https://docs.docker.com/build/building/multi-stage/)).
- Behind a reverse proxy, the app must read `X-Forwarded-For` and `X-Forwarded-Proto` to know the real client and scheme ([ASP.NET Core: Configure for proxy servers and load balancers](https://learn.microsoft.com/en-us/aspnet/core/host-and-deploy/proxy-load-balancer)).
- TLS certificates can be issued and renewed automatically with the ACME protocol, which proves control of the domain ([RFC 8555: ACME](https://www.rfc-editor.org/rfc/rfc8555.html)).
- Azure App Service hosts web apps and APIs as a managed platform ([Azure: App Service overview](https://learn.microsoft.com/en-us/azure/app-service/overview)).

## System design and interview

- Cache-aside, queues and read replicas are the first tools for scaling reads and slow work ([Azure Architecture Center: Cache-Aside pattern](https://learn.microsoft.com/en-us/azure/architecture/patterns/cache-aside)).
- Set reliability targets as SLOs and watch them with metrics, traces and logs ([Google SRE book: Service Level Objectives](https://sre.google/sre-book/service-level-objectives/)).
- Behavioural rounds ask about real past situations; answer with what you did and the result ([US OPM: Structured interviews](https://www.opm.gov/policy-data-oversight/assessment-and-selection/other-assessment-methods/structured-interviews/)).
