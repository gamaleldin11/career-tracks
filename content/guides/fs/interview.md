# Full-Stack Developer — interview prep

*Short answers to the questions full-stack interviews ask most, especially the ones about how the two halves meet.*

## End to end

### What happens when a user submits a form in your app?

The browser validates, the client sends an HTTPS request with JSON; the API authenticates the caller, validates the input, checks authorisation for that record, writes in a transaction and returns a status code; the client updates the UI from the response ([RFC 9110: HTTP Semantics](https://www.rfc-editor.org/rfc/rfc9110.html), [ASP.NET Core: Model validation](https://learn.microsoft.com/en-us/aspnet/core/mvc/models/validation)).

### How do you keep front-end and back-end types in sync?

Treat the OpenAPI document as the contract and generate the TypeScript client from it in CI, so a breaking API change fails the front-end build ([OpenAPI Specification](https://spec.openapis.org/oas/latest.html), [openapi-typescript](https://openapi-ts.dev/)).

### Why is validation needed on both sides?

Client validation is for the user's convenience; the server must validate everything because any client can be bypassed ([OWASP: Input Validation Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html)).

## Auth and CORS

### How does your app keep a user logged in?

On one origin, with a `Secure`, `HttpOnly`, `SameSite` session cookie; across origins, with a short-lived access token in memory and a refresh token in an `HttpOnly` cookie, or a backend-for-frontend that holds the tokens ([RFC 10017: OAuth 2.0 for Browser-Based Applications](https://www.rfc-editor.org/rfc/rfc10017.html)).

### What is CORS and when do you need it?

When the front end calls an API on a different origin; the browser asks the API, sometimes with a preflight, and only exposes the response if the API's CORS headers allow that origin ([MDN: CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS)).

### Why not allow all origins?

`Access-Control-Allow-Origin: *` cannot be combined with credentials, and allowing every origin to read authenticated responses would expose users' data; list exact origins ([MDN: CORS — credentialed requests and wildcards](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS#credentialed_requests_and_wildcards)).

### How do you add "Sign in with Google"?

Use OpenID Connect with the authorization code flow and PKCE, validate the ID token, then issue your own session ([OpenID Connect Core 1.0](https://openid.net/specs/openid-connect-core-1_0.html), [RFC 9700](https://www.rfc-editor.org/rfc/rfc9700.html)).

## Features

### How would you add live notifications?

With SignalR (WebSockets underneath) from the API to the browser, authenticated with the same token, plus a Redis backplane once there is more than one server ([ASP.NET Core: SignalR overview](https://learn.microsoft.com/en-us/aspnet/core/signalr/introduction), [SignalR Redis backplane](https://learn.microsoft.com/en-us/aspnet/core/signalr/redis-backplane)).

### How do you handle large file uploads safely?

Issue a short-lived signed URL so the browser uploads straight to blob storage, then validate type and size, scan if needed and record metadata in the database ([Azure Storage: Shared access signatures](https://learn.microsoft.com/en-us/azure/storage/common/storage-sas-overview), [OWASP: File Upload Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html)).

### How do you avoid charging a customer twice?

Make payment confirmation idempotent: verify the webhook signature, record each event ID once, and send an idempotency key with retried requests ([Stripe: Webhooks](https://docs.stripe.com/webhooks), [IETF draft: Idempotency-Key header](https://datatracker.ietf.org/doc/draft-ietf-httpapi-idempotency-key-header/)).

### How do you handle time zones?

Store instants in UTC or with an offset, keep the user's time zone as a setting, and convert only for display ([.NET: Choosing between DateTime types](https://learn.microsoft.com/en-us/dotnet/standard/datetime/choosing-between-datetime), [MDN: Intl.DateTimeFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat)).

## Shipping

### How would you deploy your app?

Build and test in CI, produce a container image or build artefact, run migrations as a controlled step, deploy to a staging slot and swap, with HTTPS and health checks in place ([GitHub Actions](https://docs.github.com/en/actions/get-started/understand-github-actions), [Azure App Service: Staging slots](https://learn.microsoft.com/en-us/azure/app-service/deploy-staging-slots)).

### Redirects go to `http://` after you deployed behind a proxy. Why?

The proxy terminates TLS and the app sees plain HTTP; enable forwarded-headers middleware so it reads `X-Forwarded-Proto` ([ASP.NET Core: Configure for proxy servers and load balancers](https://learn.microsoft.com/en-us/aspnet/core/host-and-deploy/proxy-load-balancer)).

### The page is slow. Where do you start?

Find which side is slow: field Core Web Vitals and browser timings for the front end, traces for the API and database; then fix the largest contributor ([web.dev: Web Vitals](https://web.dev/articles/vitals), [OpenTelemetry: Traces](https://opentelemetry.io/docs/concepts/signals/traces/)).

## Behavioural

### "Tell me about something you built end to end."

Name the problem, your part in each layer, one decision and its trade-off, and the measurable result; interviewers score specific, job-related evidence ([US OPM: Structured interviews](https://www.opm.gov/policy-data-oversight/assessment-and-selection/other-assessment-methods/structured-interviews/)).
