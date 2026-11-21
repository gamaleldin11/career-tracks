# Full-Stack Developer — entry level

*What a junior full-stack role expects: one front-end framework, one back-end stack, SQL, and the glue: HTTP, JSON, CORS, auth basics and a deploy.*

## HTTP and JSON

- `Content-Type: application/json` tells the receiver how to read the body ([RFC 9110 §8.3: Content-Type](https://www.rfc-editor.org/rfc/rfc9110.html#section-8.3)).
- JSON is a text format for objects, arrays, strings, numbers, booleans and null ([RFC 8259: JSON](https://www.rfc-editor.org/rfc/rfc8259.html)).
- `fetch` only rejects on network failure; check `response.ok` for HTTP errors ([MDN: Using the Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch)).
- 201 Created answers a POST that created something; 204 No Content answers success with no body ([RFC 9110 §15.3](https://www.rfc-editor.org/rfc/rfc9110.html#section-15.3)).

## Front end

- Components receive data through props and keep their own state ([React: Passing Props](https://react.dev/learn/passing-props-to-a-component)).
- Forms need labels and correct input types for accessibility and mobile keyboards ([MDN: The input element](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/input)).
- In Angular, `HttpClient` returns observables for API calls ([Angular: HttpClient](https://angular.dev/guide/http)).
- Flexbox and Grid handle almost every layout ([MDN: CSS grid layout](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Grid_layout)).

## Back end

- Minimal APIs or controllers map HTTP routes to handlers ([ASP.NET Core: APIs overview](https://learn.microsoft.com/en-us/aspnet/core/fundamentals/apis)).
- Validate input on the server even when the client already validated it ([ASP.NET Core: Model validation](https://learn.microsoft.com/en-us/aspnet/core/mvc/models/validation)).
- EF Core LINQ queries become parameterised SQL ([EF Core: How queries work](https://learn.microsoft.com/en-us/ef/core/querying/how-query-works)).
- Return DTOs shaped for the client rather than entities, so internal fields do not leak ([OWASP API Security: Broken Object Property Level Authorization](https://api-security.owasp.org/editions/2023/en/0xa3-broken-object-property-level-authorization/)).

## SQL

- `INNER JOIN` keeps matching rows; `LEFT JOIN` also keeps unmatched rows from the left table ([PostgreSQL: Joined tables](https://www.postgresql.org/docs/current/queries-table-expressions.html#QUERIES-JOIN)).
- `GROUP BY` with aggregates such as `COUNT` and `SUM` summarises rows per group ([PostgreSQL: Aggregate functions](https://www.postgresql.org/docs/current/tutorial-agg.html)).
- Foreign keys keep related rows consistent ([PostgreSQL: Foreign keys](https://www.postgresql.org/docs/current/ddl-constraints.html#DDL-CONSTRAINTS-FK)).

## Connecting the two

- In development, a dev-server proxy can forward API calls so the browser sees one origin ([Vite: server.proxy](https://vite.dev/config/server-options#server-proxy)).
- If the API is on another origin, configure CORS on the API with the exact front-end origin, not a wildcard, when credentials are sent ([ASP.NET Core: Enable CORS](https://learn.microsoft.com/en-us/aspnet/core/security/cors)).
- Only variables with the public prefix (such as `VITE_`) reach client code; never put secrets there ([Vite: Env variables and modes](https://vite.dev/guide/env-and-mode)).
- Angular uses build-time environment files for per-environment settings such as the API URL ([Angular: Configuring application environments](https://angular.dev/tools/cli/environments)).

## Auth basics

- Cookie authentication on one origin is the simplest secure design: the browser sends the cookie, and `HttpOnly` keeps it from scripts ([ASP.NET Core: Use cookie authentication without Identity](https://learn.microsoft.com/en-us/aspnet/core/security/authentication/cookie)).
- 401 means "log in", 403 means "logged in but not allowed" ([RFC 9110 §15.5](https://www.rfc-editor.org/rfc/rfc9110.html#section-15.5)).
- Hide UI the user may not use, but enforce the rule on the server, because the client can be bypassed ([OWASP: Authorization Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html)).

## Deploy

- A Dockerfile describes how to build an image of your app ([Docker: Writing a Dockerfile](https://docs.docker.com/learn/content/write-your-first-dockerfile/)).
- A CI workflow builds and tests every push or pull request ([GitHub Actions: Understanding GitHub Actions](https://docs.github.com/en/actions/get-started/understand-github-actions)).
- A DNS A record points a name at an IPv4 address and a CNAME points it at another name ([RFC 1035: Domain names](https://www.rfc-editor.org/rfc/rfc1035.html)).
- Serve the site over HTTPS; the ACME protocol automates getting and renewing the certificate ([RFC 8555: ACME](https://www.rfc-editor.org/rfc/rfc8555.html)).
