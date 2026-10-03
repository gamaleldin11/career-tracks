# Auth and CORS End to End — Cookies, Tokens, Refresh, CSRF and External Login Across the Stack

Auth is where full-stack candidates most often contradict themselves: "the token is in localStorage… and we're protected against XSS because Angular escapes output". This module puts the browser and server halves of authentication together into three coherent designs, shows the code on both sides, and covers the details that trip people up: CSRF with cookies, refresh-token races, CORS with credentials, the difference between same-site and same-origin, and SignalR authentication.

> [!focus]
> **Entry must:** explain how your app keeps a user logged in (where the credential lives, how it's sent, how it expires); handle 401 in the UI; configure CORS for your front end.
> **Mid adds:** pick and defend cookie sessions vs in-memory tokens vs a BFF; CSRF protection with cookies; refresh-token rotation and the single-flight refresh; same-site vs same-origin; external login verified server-side; authenticating SignalR.
> **Most asked:** *Where do you store the JWT in an SPA, and why?* · *How do you refresh tokens without logging the user out?* · *If you use cookies, how do you prevent CSRF?* · *Why does my cookie not get sent to the API?* · *How do you secure SignalR?*
> **Time budget:** 3 hours.

## FS2.1 Three coherent designs 🟢 🟡 ⭐

| | **A. Cookie session, same origin** | **B. Access token in memory + refresh cookie** | **C. Backend-for-frontend (BFF)** |
|---|---|---|---|
| Browser holds | An HttpOnly session or auth cookie | A short-lived access token **in JS memory** + an HttpOnly refresh cookie | Only an HttpOnly session cookie |
| Sent to API by | The browser, automatically | Your code (`Authorization: Bearer`) | The browser, to the BFF; the BFF attaches tokens downstream |
| XSS can steal it? | No (HttpOnly) | The access token, yes, while the page is compromised; but it's short-lived and not persisted | No |
| CSRF risk | Yes: needs SameSite + anti-forgery | Low for API calls (header-based); the refresh endpoint needs SameSite | Yes: same mitigations as A |
| Works cross-origin | Needs care (same-site at least) | Yes | Same origin by design |
| Complexity | **Lowest** | Medium | Medium-high |
| Fits | One SPA + one API on one domain (**FinSight's shape**) | SPAs calling APIs on other domains, mobile clients | Many downstream APIs, external identity providers, high-security apps |

> [!say]
> "For an SPA and API on the same origin, I prefer a plain HttpOnly, Secure, SameSite cookie: JavaScript can't read it, so XSS can't steal it, and SameSite plus an anti-forgery header handles CSRF. If the API lives on another domain or serves mobile clients, I'd keep a short-lived access token in memory with a rotating refresh token in an HttpOnly cookie. With an external identity provider or many downstream APIs, a backend-for-frontend keeps all tokens on the server."

> [!mistake] "localStorage, but we escape everything"
> Framework escaping reduces XSS; it doesn't eliminate it (a vulnerable dependency, a `bypassSecurityTrust…`, a third-party script). Anything in `localStorage` is readable by any script on the page and persists until removed. Choose a design where a single XSS doesn't hand over a long-lived credential.

## FS2.2 Design A: cookie authentication on one origin 🟢 ⭐

**Server (ASP.NET Core 10):**

```csharp
builder.Services.AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme)
    .AddCookie(o =>
    {
        o.Cookie.Name = "__Host-finsight";          // __Host- prefix: Secure, Path=/, no Domain → can't be set by subdomains
        o.Cookie.HttpOnly = true;
        o.Cookie.SecurePolicy = CookieSecurePolicy.Always;
        o.Cookie.SameSite = SameSiteMode.Lax;
        o.ExpireTimeSpan = TimeSpan.FromHours(8);
        o.SlidingExpiration = true;
        // .NET 10: API endpoints get 401/403 instead of a redirect to a login page
    });
builder.Services.AddAntiforgery(o => o.HeaderName = "X-XSRF-TOKEN");

app.MapPost("/api/auth/login", async (LoginRequest req, SignInManager<AppUser> signIn) =>
{
    var result = await signIn.PasswordSignInAsync(req.Email, req.Password, isPersistent: false, lockoutOnFailure: true);
    return result.Succeeded ? Results.NoContent() : Results.Problem(statusCode: 401, title: "Invalid email or password");
});

// Give the SPA a readable anti-forgery token cookie after login / on app start
app.MapGet("/api/auth/antiforgery", (IAntiforgery af, HttpContext ctx) =>
{
    var tokens = af.GetAndStoreTokens(ctx);
    ctx.Response.Cookies.Append("XSRF-TOKEN", tokens.RequestToken!, new() { HttpOnly = false, Secure = true, SameSite = SameSiteMode.Strict });
    return Results.NoContent();
}).RequireAuthorization();
```

(ASP.NET Core Identity's `MapIdentityApi` also supports cookie mode: `POST /login?useCookies=true`.)

**Client (Angular):** `HttpClient` has built-in XSRF support. It reads a cookie named `XSRF-TOKEN` and sends it as the `X-XSRF-TOKEN` header on **mutating** requests (POST, PUT, PATCH, DELETE) to **relative** URLs, exactly what the server above expects.

```ts
provideHttpClient(withInterceptors([authErrorInterceptor]), withXsrfConfiguration({ cookieName: "XSRF-TOKEN", headerName: "X-XSRF-TOKEN" }));
```

On app start, call `GET /api/auth/me`: a 200 returns the user and their permissions; a 401 means "show the login page". The cookie itself is invisible to the app, which is the point.

> [!term] Same-site vs same-origin
> **Same-origin** means the same scheme, host and port (`https://app.example.com` ≠ `https://api.example.com`). **Same-site** means the same **registrable domain** ("eTLD+1": `example.com`), so those two hosts **are same-site**. CORS works on **origins**; `SameSite` cookies work on **sites**. That's why `app.example.com` calling `api.example.com` needs CORS but can still send a `SameSite=Lax` cookie (with `credentials: "include"`), whereas `app.netlify.app` calling `api.azurewebsites.net` is **cross-site**, and the cookie needs `SameSite=None; Secure` and is blocked by browsers that block third-party cookies, such as Safari and Firefox by default.

## FS2.3 Design B: in-memory access token + refresh cookie 🟡 ⭐

The flow:

1. Login (or the OIDC code flow) returns an **access token** (5–15 minutes) in the response body, and sets a **refresh token** as an HttpOnly, Secure cookie scoped to `Path=/api/auth/refresh`.
2. The SPA keeps the access token **in memory only** (a signal or service field), never in storage.
3. Every API call adds `Authorization: Bearer <token>` via an interceptor.
4. On a **401**, the SPA calls `/api/auth/refresh` (the browser sends the refresh cookie), gets a new access token (and the server **rotates** the refresh cookie), then **retries** the original request.
5. On page reload, memory is empty, so the app calls `/refresh` once at start-up to get a new access token silently.

**The trap: parallel 401s.** A dashboard fires five requests; all five get 401 at once; five refreshes start; with rotation, four of them present an already-used refresh token, and reuse detection logs the user out. You need **single-flight refresh**: the first 401 starts one refresh, and the others wait for it.

```ts
// Angular: functional interceptor with single-flight refresh
let refreshInFlight: Observable<string> | null = null;

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const withToken = (t: string | null) => t ? req.clone({ setHeaders: { Authorization: `Bearer ${t}` } }) : req;

  return next(withToken(auth.accessToken())).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status !== 401 || req.url.endsWith("/auth/refresh")) return throwError(() => err);
      refreshInFlight ??= auth.refresh().pipe(                 // POST /api/auth/refresh (cookie sent automatically)
        finalize(() => (refreshInFlight = null)),
        shareReplay(1),                                         // every waiting request gets the same new token
      );
      return refreshInFlight.pipe(
        switchMap(token => next(withToken(token))),             // retry once with the new token
        catchError(e => { auth.logout(); return throwError(() => e); }),
      );
    }),
  );
};
```

React equivalents: an axios or `fetch` wrapper with the same single shared refresh promise; libraries such as TanStack Query only need the wrapper.

**Server side of refresh:** look up the refresh token **hash** (store hashes, like passwords), check it isn't expired, revoked or already used; issue a new access token and a **new** refresh token; mark the old one used; if a used token is presented again, **revoke the whole family** ([[B7.3]]).

## FS2.4 Design C: backend-for-frontend 🟡

The BFF is a confidential OAuth client: it runs the authorisation-code flow with the identity provider (Entra ID, Auth0, Keycloak, Google), stores the tokens **server-side** (in its session store), and gives the browser a session cookie. API calls from the SPA go to the BFF, which forwards them with the access token attached (often using **YARP** as the proxy), refreshing it as needed. The SPA's code is as simple as design A's.

In .NET, Duende's BFF library (commercial for larger companies) implements this; a small custom version needs the OIDC handler, a session store and YARP.

## FS2.5 External login (Google, Microsoft) done right 🟡 ⭐

Two valid patterns:

1. **Server-side OIDC flow:** the API (or BFF) redirects to Google with authorisation code + PKCE, receives the code, exchanges it, and signs the user in with a cookie. ASP.NET Core has `AddGoogle()` and `AddOpenIdConnect()` handlers.
2. **Client-side Google Identity Services** returns a Google **ID token** (a JWT) to the SPA; the SPA posts it to your API; the API **verifies it** and then issues **its own** session or tokens.

```csharp
// Pattern 2: never trust the browser's claim; verify Google's ID token on the server
var payload = await GoogleJsonWebSignature.ValidateAsync(request.IdToken, new GoogleJsonWebSignature.ValidationSettings
{
    Audience = [configuration["Google:ClientId"]!],          // must be YOUR client ID
});                                                           // also checks signature, issuer and expiry
if (!payload.EmailVerified) return Results.Problem(statusCode: 401, title: "Email not verified");
var user = await users.FindOrLinkGoogleAsync(payload.Subject, payload.Email);   // link by Google's stable 'sub', not by email alone
await signIn.SignInAsync(user, isPersistent: false);
```

> [!story]
> FinSight **verified Google sign-in on the server** (the feature itself was built by a teammate; you integrated it). Explain the two checks that matter most: the **audience** must be your client ID (otherwise a token issued to any other app would be accepted), and users are linked by Google's stable **`sub`**, not by email alone.

## FS2.6 CORS when the API is on another origin 🟢 ⭐

```csharp
builder.Services.AddCors(o => o.AddPolicy("web", p => p
    .WithOrigins("https://app.finsight.example")      // exact origins: never AllowAnyOrigin with credentials
    .AllowCredentials()                               // needed for cookies
    .WithHeaders("Content-Type", "Authorization", "X-XSRF-TOKEN", "Idempotency-Key")
    .WithMethods("GET", "POST", "PUT", "PATCH", "DELETE")
    .SetPreflightMaxAge(TimeSpan.FromHours(1))));      // fewer OPTIONS round trips
```

```ts
// Angular: send cookies cross-origin
this.http.get("https://api.finsight.example/api/me", { withCredentials: true });
// fetch: fetch(url, { credentials: "include" })
```

Debugging "my cookie isn't sent": look at the cookie in DevTools → Application. Is it `Secure` on an HTTPS page? Is `SameSite` compatible with same-site vs cross-site ([[FS2.2]])? Is `withCredentials`/`credentials` set? Does the response have `Access-Control-Allow-Credentials: true` and the **exact** origin? Is the browser blocking third-party cookies?

## FS2.7 Sessions in a real UI 🟡

- **Expiry UX:** when the session ends, keep the user's unsaved form data, show a sign-in dialog, and continue after re-authentication, rather than discarding work.
- **Logout:** clear server-side state (sign out the cookie, revoke refresh tokens), clear in-memory state and query caches, and redirect. **Logout everywhere** revokes all of the user's refresh tokens or bumps their token version.
- **Multiple tabs:** use `BroadcastChannel` so logging out in one tab logs out the others, and so only one tab performs a refresh at a time.
- **Permissions in the UI:** `GET /api/auth/me` returns the user's roles and permissions; the UI hides what the user can't do (and Angular guards or React route checks keep them out of pages), **but every API endpoint still authorises** ([[S9.6]]).

## FS2.8 Authenticating SignalR and WebSockets 🟡 ⭐

Browsers can't set an `Authorization` header on a WebSocket handshake. Two options:

- **Cookies** (designs A and C): the browser sends them on the handshake automatically. Simplest.
- **Access token in the query string** (design B): the SignalR client sends `?access_token=…`, and the server reads it **only for hub paths**:

```csharp
.AddJwtBearer(o => o.Events = new JwtBearerEvents
{
    OnMessageReceived = ctx =>
    {
        var token = ctx.Request.Query["access_token"];
        if (!string.IsNullOrEmpty(token) && ctx.HttpContext.Request.Path.StartsWithSegments("/hubs"))
            ctx.Token = token;
        return Task.CompletedTask;
    },
});
```

```ts
const connection = new signalR.HubConnectionBuilder()
  .withUrl("/hubs/notifications", { accessTokenFactory: () => auth.accessToken() ?? "" })
  .withAutomaticReconnect()
  .build();
```

Then authorise inside the hub: add each connection to its **tenant group** (`Groups.AddToGroupAsync(Context.ConnectionId, $"company:{companyId}")`) from the **token's** claim, never from a value the client sends. Make sure access logs don't record query-string tokens.

## FS2.9 Checklist before you ship auth 🟢 ⭐

1. The credential is HttpOnly, Secure, with a deliberate SameSite, or a short-lived in-memory token. Nothing in `localStorage`.
2. Cookie-authenticated, state-changing requests require an anti-forgery header, and nothing changes state on GET.
3. CORS lists exact origins; credentials only when needed.
4. Refresh tokens rotate, are stored hashed, and reuse revokes the family; refresh is single-flight in the client.
5. External identity tokens are verified on the server (signature, issuer, audience, expiry).
6. Every endpoint authorises on the server; the fallback policy denies by default; tenant comes from the token.
7. Login, refresh and reset endpoints are rate-limited; errors don't reveal whether an account exists.
8. SignalR connections are authenticated and grouped by the server, not the client.
9. Logout clears server state and client caches; sessions expire gracefully without losing work.
10. Tests: 401 without credentials, 403 for the wrong role, 404 for another tenant, CSRF rejection without the header ([[B10.6]]).

> [!lab] Implement design A, then design B, in one afternoon
> Start with FinSight's Angular app and API on one origin through the dev proxy. (1) Switch to cookie auth with `__Host-` cookies and Angular's XSRF support; prove a cross-site form post fails. (2) In a branch, implement design B with the single-flight interceptor above; open the dashboard with an expired token and confirm only **one** refresh request appears in the Network tab. You'll be able to answer every question in this module from your own code.

## FS2.10 Interview drill 🟢 ⭐

| Question | Strong short answer |
|---|---|
| Where should an SPA keep its credential? | An HttpOnly, Secure, SameSite cookie (same origin or via a BFF), or a short-lived access token in memory with a refresh cookie; not localStorage. |
| How do you prevent CSRF with cookie auth? | SameSite cookies plus an anti-forgery token sent in a header on state-changing requests; no state changes on GET. |
| How does Angular help with CSRF? | HttpClient reads the XSRF-TOKEN cookie and sends X-XSRF-TOKEN on mutating requests to relative URLs. |
| How do you refresh tokens without logging users out? | On 401, call the refresh endpoint once (single-flight), share the new token with all waiting requests, retry them; rotate refresh tokens server-side. |
| Why single-flight refresh? | Parallel refreshes with rotation present already-used tokens, triggering reuse detection and logout. |
| Same-site vs same-origin? | Origin is scheme+host+port (CORS); site is the registrable domain (SameSite cookies). app.example.com and api.example.com are cross-origin but same-site. |
| Why isn't my cookie sent to the API? | Missing credentials flag, incompatible SameSite for a cross-site request, not Secure, CORS not allowing credentials or the exact origin, or third-party cookie blocking. |
| How do you handle "Sign in with Google"? | Code flow on the server, or verify Google's ID token on the server (signature, issuer, audience = your client ID, expiry), then issue your own session. |
| How do you authenticate SignalR? | Cookies on the handshake, or the access_token query parameter read only for hub paths; group connections by the token's tenant. |
| Is hiding admin buttons security? | No, only UX; the API authorises every request. |

## Key takeaways

> [!check]
> - Pick one coherent design: cookie session (same origin), in-memory token + refresh cookie, or BFF.
> - Cookies need CSRF protection; tokens in JavaScript need XSS discipline and short lifetimes.
> - Refresh tokens rotate server-side and refresh single-flight client-side.
> - Same-site isn't same-origin: know which one CORS and SameSite each care about.
> - Verify external identity on the server; derive tenant and groups from the token, never the client.

## Sources

- IETF: [OAuth 2.0 for Browser-Based Applications (draft)](https://datatracker.ietf.org/doc/draft-ietf-oauth-browser-based-apps/), [RFC 9700 — OAuth 2.0 Security BCP](https://www.rfc-editor.org/rfc/rfc9700), [Cookies: HTTP State Management Mechanism (RFC 6265bis draft: SameSite, cookie prefixes)](https://datatracker.ietf.org/doc/draft-ietf-httpbis-rfc6265bis/).
- Microsoft Learn: [Cookie authentication](https://learn.microsoft.com/en-us/aspnet/core/security/authentication/cookie), [Prevent CSRF in ASP.NET Core](https://learn.microsoft.com/en-us/aspnet/core/security/anti-request-forgery), [Identity API endpoints (cookie and token modes)](https://learn.microsoft.com/en-us/aspnet/core/security/authentication/identity-api-authorization), [Authentication and authorization in SignalR](https://learn.microsoft.com/en-us/aspnet/core/signalr/authn-and-authz), [Enable CORS](https://learn.microsoft.com/en-us/aspnet/core/security/cors).
- Angular: [HttpClient security: XSRF protection](https://angular.dev/best-practices/security#httpclient-xsrf-csrf-security).
- web.dev: [SameSite cookies explained](https://web.dev/articles/samesite-cookies-explained), [Understanding "same-site" and "same-origin"](https://web.dev/articles/same-site-same-origin).
- Google: [Verify the Google ID token on your server side](https://developers.google.com/identity/gsi/web/guides/verify-google-id-token).
- OWASP: [CSRF Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html).
