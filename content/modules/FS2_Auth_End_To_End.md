# Auth and CORS End to End — Cookies, Tokens, Refresh, CSRF and External Login Across the Stack

Auth is where full-stack candidates most often contradict themselves: "the token is in localStorage… and we're protected against XSS because Angular escapes output". This module puts the browser and server halves of authentication together into three coherent designs, shows the code on both sides, and covers the details that trip people up: CSRF with cookies, refresh-token races, CORS with credentials, the difference between same-site and same-origin, and SignalR authentication.

> [!focus]
> **Entry must:** explain how your app keeps a user logged in (where the credential lives, how it's sent, how it expires); handle 401 in the UI; configure CORS for your front end.
> **Mid adds:** pick and defend cookie sessions vs in-memory tokens vs a BFF; CSRF protection with cookies; refresh-token rotation and the single-flight refresh; same-site vs same-origin; external login verified server-side; authenticating SignalR.
> **Most asked:** *Where do you store the JWT in an SPA, and why?* · *How do you refresh tokens without logging the user out?* · *If you use cookies, how do you prevent CSRF?* · *Why does my cookie not get sent to the API?* · *How do you secure SignalR?*
> **Time budget:** 3 hours.

## FS2.0 Foundations: how a browser stays logged in 🟢

HTTP is **stateless**: each request arrives on its own and the server doesn't remember the previous one. "Being logged in" therefore means: prove who you are once (a password, a Google sign-in), receive a **credential**, and present that credential on every later request. Two choices define every design in this module.

**1. What the credential is.** A **session ID** is a random reference the server looks up; a **signed token** (usually a JWT) carries the user's claims inside and the server only checks the signature ([[B7]]).

<figure class="dia"><svg viewBox="0 0 720 240" role="img" aria-label="A session ID is a random reference the server looks up in a session store; a signed token carries its claims and is verified with a key">
<rect class="sN" x="14" y="20" width="336" height="210" rx="12"/><text class="sT" x="182" y="42" text-anchor="middle">session ID: a reference</text>
<rect class="sB" x="30" y="60" width="140" height="34" rx="6"/><text class="sC" x="40" y="82" xml:space="preserve" style="white-space:pre">sid=8f3a91c2…</text>
<line class="sL" x1="170" y1="77" x2="206" y2="77" marker-end="url(#ah)"/><rect class="sA" x="210" y="56" width="124" height="42" rx="8"/><text class="sT" x="272" y="82" text-anchor="middle">server</text>
<line class="sLw" x1="272" y1="98" x2="272" y2="124" marker-end="url(#ahw)"/><rect class="sW" x="196" y="126" width="150" height="46" rx="8"/><text class="sT" x="271" y="147" text-anchor="middle">session store</text><text class="sC" x="271" y="163" text-anchor="middle">8f3a… → user 42</text>
<text class="sGt" x="30" y="196">+ revoke instantly: delete the row</text><text class="sRt" x="30" y="216">− a lookup on every request</text>
<rect class="sN" x="370" y="20" width="336" height="210" rx="12"/><text class="sT" x="538" y="42" text-anchor="middle">signed token: self-contained</text>
<rect class="sV" x="386" y="60" width="150" height="34" rx="6"/><text class="sC" x="396" y="82" xml:space="preserve" style="white-space:pre">eyJ….eyJ….sig</text>
<line class="sL" x1="536" y1="77" x2="566" y2="77" marker-end="url(#ah)"/><rect class="sA" x="570" y="56" width="124" height="42" rx="8"/><text class="sT" x="632" y="82" text-anchor="middle">server</text>
<rect class="sV" x="386" y="112" width="308" height="60" rx="6" opacity=".6"/><text class="sC" x="540" y="132" text-anchor="middle">claims inside: sub 42, role, exp</text><text class="sC" x="540" y="152" text-anchor="middle">checked with the signing key, no lookup</text>
<text class="sGt" x="386" y="196">+ no shared store; any server can verify</text><text class="sRt" x="386" y="216">− can't be revoked: keep it short-lived</text>
</svg><figcaption>The two kinds of credential. Cookies usually carry the first; Authorization headers usually carry the second, but either can carry either.</figcaption></figure>

**2. Where the browser keeps it.** A **cookie** is stored by the browser and **attached automatically** to requests for its site. Anything in JavaScript (a variable, `localStorage`) is sent **only when your code adds it** to a header. That difference decides which attack you must design against:

- **XSS** (cross-site scripting): an attacker's script runs inside your page and can read whatever JavaScript can read.
- **CSRF** (cross-site request forgery): another site makes the user's browser send a request to your API, and the cookie rides along automatically.

<figure class="dia"><svg viewBox="0 0 720 216" role="img" aria-label="Comparison of an HttpOnly cookie, localStorage and JavaScript memory: whether JavaScript can read the credential, whether it is sent automatically, and whether it survives a reload">
<text class="sM" x="290" y="32" text-anchor="middle">JavaScript can read it?</text>
<text class="sM" x="456" y="32" text-anchor="middle">sent automatically?</text>
<text class="sM" x="622" y="32" text-anchor="middle">survives a reload?</text>
<text class="sT" x="196" y="70" text-anchor="end">HttpOnly cookie</text>
<rect class="sG" x="210" y="46" width="160" height="38" rx="6"/><text class="sC" x="290" y="70" text-anchor="middle">no: XSS can't steal it</text>
<rect class="sW" x="376" y="46" width="160" height="38" rx="6"/><text class="sC" x="456" y="70" text-anchor="middle">yes: needs CSRF defence</text>
<rect class="sG" x="542" y="46" width="160" height="38" rx="6"/><text class="sC" x="622" y="70" text-anchor="middle">yes</text>
<text class="sT" x="196" y="116" text-anchor="end">localStorage</text>
<rect class="sR" x="210" y="92" width="160" height="38" rx="6"/><text class="sC" x="290" y="116" text-anchor="middle">yes: any script can</text>
<rect class="sG" x="376" y="92" width="160" height="38" rx="6"/><text class="sC" x="456" y="116" text-anchor="middle">no</text>
<rect class="sW" x="542" y="92" width="160" height="38" rx="6"/><text class="sC" x="622" y="116" text-anchor="middle">yes, until removed</text>
<text class="sT" x="196" y="162" text-anchor="end">JS memory</text>
<rect class="sW" x="210" y="138" width="160" height="38" rx="6"/><text class="sC" x="290" y="162" text-anchor="middle">yes, while page is open</text>
<rect class="sG" x="376" y="138" width="160" height="38" rx="6"/><text class="sC" x="456" y="162" text-anchor="middle">no</text>
<rect class="sW" x="542" y="138" width="160" height="38" rx="6"/><text class="sC" x="622" y="162" text-anchor="middle">no: refresh at start</text>
<text class="sS" x="360" y="204" text-anchor="middle">readable by JavaScript → XSS risk · sent automatically → CSRF risk</text>
</svg><figcaption>Where the browser keeps the credential decides which attack you must defend against.</figcaption></figure>

Each design below is a deliberate combination of these choices.

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

<figure class="dia steps"><svg viewBox="0 0 720 312" role="img" aria-label="Cookie authentication with CSRF protection: login sets an HttpOnly cookie, the SPA gets an anti-forgery token, sends it as a header on writes, and a forged cross-site request is rejected">
<text class="sT" x="14" y="22">SPA on app.example.com</text><text class="sT" x="400" y="22" text-anchor="middle">API (same origin)</text><text class="sRt" x="706" y="22" text-anchor="end">evil.example</text>
<line class="sD" x1="70" y1="32" x2="70" y2="282"/>
<line class="sD" x1="400" y1="32" x2="400" y2="282"/>
<line class="sD" x1="650" y1="32" x2="650" y2="282"/>
<g data-s="1"><line class="sL" x1="70" y1="56" x2="396" y2="56" marker-end="url(#ah)"/><text class="sC" x="235" y="50" text-anchor="middle">POST /api/auth/login</text><line class="sLg" x1="400" y1="84" x2="74" y2="84" marker-end="url(#ahg)"/><text class="sC" x="235" y="78" text-anchor="middle">Set-Cookie: __Host-finsight (HttpOnly, Lax)</text></g>
<g data-s="2"><line class="sL" x1="70" y1="116" x2="396" y2="116" marker-end="url(#ah)"/><text class="sC" x="235" y="110" text-anchor="middle">GET /api/auth/antiforgery</text><line class="sLg" x1="400" y1="144" x2="74" y2="144" marker-end="url(#ahg)"/><text class="sC" x="235" y="138" text-anchor="middle">Set-Cookie: XSRF-TOKEN (JS can read)</text></g>
<g data-s="3"><line class="sL" x1="70" y1="180" x2="396" y2="180" marker-end="url(#ah)"/><text class="sC" x="235" y="174" text-anchor="middle">POST …/payments · cookie + X-XSRF-TOKEN</text><line class="sLg" x1="400" y1="208" x2="74" y2="208" marker-end="url(#ahg)"/><text class="sGt" x="235" y="202" text-anchor="middle">201 Created: token matches ✓</text></g>
<g data-s="4"><line class="sLr" x1="650" y1="240" x2="404" y2="240" marker-end="url(#ahr)"/><text class="sRt" x="525" y="234" text-anchor="middle">hidden form POST …/payments</text><line class="sLr" x1="400" y1="270" x2="646" y2="270" marker-end="url(#ahr)"/><text class="sRt" x="525" y="264" text-anchor="middle">rejected ✗</text></g>
<g data-s="5"><text class="sS" x="360" y="300" text-anchor="middle">Lax keeps the cookie off cross-site POSTs; the header proves the request came from your own JavaScript</text></g>
</svg><ol class="dia-steps">
<li>Login: the API sets the auth cookie. <code>HttpOnly</code> keeps it away from JavaScript (so XSS can't read it); <code>SameSite=Lax</code> keeps it off cross-site POSTs.</li>
<li>The SPA asks for an anti-forgery token. It arrives in a second cookie that JavaScript <b>can</b> read, on purpose.</li>
<li>On every write, Angular copies <code>XSRF-TOKEN</code> into the <code>X-XSRF-TOKEN</code> header. The API checks the header matches what it issued for this user.</li>
<li>A page on another site auto-submits a form to your API. Two locks stop it: SameSite keeps the cookie off, and the attacker can't read your cookie to forge the header.</li>
<li>Defence in depth: either lock alone usually suffices, and older browsers or same-site subdomains are why you keep both.</li>
</ol><figcaption>CSRF works because cookies are sent automatically. The defence is something an attacker's page can't send: a header your own code adds.</figcaption></figure>

> [!term] Same-site vs same-origin
> **Same-origin** means the same scheme, host and port (`https://app.example.com` ≠ `https://api.example.com`). **Same-site** means the same **registrable domain** ("eTLD+1": `example.com`), so those two hosts **are same-site**. CORS works on **origins**; `SameSite` cookies work on **sites**. That's why `app.example.com` calling `api.example.com` needs CORS but can still send a `SameSite=Lax` cookie (with `credentials: "include"`), whereas `app.netlify.app` calling `api.azurewebsites.net` is **cross-site**, and the cookie needs `SameSite=None; Secure` and is blocked by browsers that block third-party cookies, such as Safari and Firefox by default.

<figure class="dia"><svg viewBox="0 0 720 202" role="img" aria-label="app.example.com and api.example.com are different origins but the same site, example.com; evil.example is a different site">
<rect class="sN" x="14" y="24" width="440" height="140" rx="14" stroke-dasharray="7 5" style="stroke:var(--accent);stroke-width:2"/><text class="sM" x="234" y="46" text-anchor="middle">one site: example.com (eTLD+1)</text>
<rect class="sA" x="34" y="64" width="196" height="52" rx="8"/><text class="sT" x="132" y="88" text-anchor="middle">https://app.example.com</text><text class="sC" x="132" y="104" text-anchor="middle">origin 1</text><rect class="sG" x="240" y="64" width="196" height="52" rx="8"/><text class="sT" x="338" y="88" text-anchor="middle">https://api.example.com</text><text class="sC" x="338" y="104" text-anchor="middle">origin 2</text>
<text class="sC" x="234" y="142" text-anchor="middle">cross-origin, but same-site</text>
<rect class="sN" x="476" y="24" width="230" height="140" rx="14" stroke-dasharray="7 5" style="stroke:var(--senior);stroke-width:2"/><text class="sRt" x="591" y="46" text-anchor="middle">another site</text>
<rect class="sR" x="496" y="64" width="190" height="52" rx="8"/><text class="sT" x="591" y="88" text-anchor="middle">https://evil.example</text><text class="sC" x="591" y="104" text-anchor="middle">origin 3</text>
<text class="sC" x="591" y="142" text-anchor="middle">cross-origin and cross-site</text>
<text class="sS" x="360" y="190" text-anchor="middle">CORS is about origins · SameSite cookies are about sites</text>
</svg><figcaption>Two hosts under one registrable domain are same-site, so a <code>SameSite=Lax</code> cookie still flows between them, while CORS still applies.</figcaption></figure>

## FS2.3 Design B: in-memory access token + refresh cookie 🟡 ⭐

The flow:

1. Login (or the OIDC code flow) returns an **access token** (5–15 minutes) in the response body, and sets a **refresh token** as an HttpOnly, Secure cookie scoped to `Path=/api/auth/refresh`.
2. The SPA keeps the access token **in memory only** (a signal or service field), never in storage.
3. Every API call adds `Authorization: Bearer <token>` via an interceptor.
4. On a **401**, the SPA calls `/api/auth/refresh` (the browser sends the refresh cookie), gets a new access token (and the server **rotates** the refresh cookie), then **retries** the original request.
5. On page reload, memory is empty, so the app calls `/refresh` once at start-up to get a new access token silently.

**The trap: parallel 401s.** A dashboard fires five requests; all five get 401 at once; five refreshes start; with rotation, four of them present an already-used refresh token, and reuse detection logs the user out. You need **single-flight refresh**: the first 401 starts one refresh, and the others wait for it.

<figure class="dia steps" data-start="1"><svg viewBox="0 0 720 210" role="img" aria-label="Five parallel requests get 401; without single-flight they trigger five refreshes and reuse detection logs the user out; with single-flight one shared refresh serves all five retries">
<rect class="sB" x="14" y="30" width="130" height="28" rx="5"/><text class="sC" x="79" y="49" text-anchor="middle">GET /invoices</text>
<rect class="sB" x="14" y="64" width="130" height="28" rx="5"/><text class="sC" x="79" y="83" text-anchor="middle">GET /dashboard</text>
<rect class="sB" x="14" y="98" width="130" height="28" rx="5"/><text class="sC" x="79" y="117" text-anchor="middle">GET /forecast</text>
<rect class="sB" x="14" y="132" width="130" height="28" rx="5"/><text class="sC" x="79" y="151" text-anchor="middle">GET /alerts</text>
<rect class="sB" x="14" y="166" width="130" height="28" rx="5"/><text class="sC" x="79" y="185" text-anchor="middle">GET /me</text>
<g data-s="1-1"><rect class="sR" x="150" y="33" width="40" height="22" rx="4"/><text class="sX" x="170" y="49" text-anchor="middle">401</text><rect class="sR" x="150" y="67" width="40" height="22" rx="4"/><text class="sX" x="170" y="83" text-anchor="middle">401</text><rect class="sR" x="150" y="101" width="40" height="22" rx="4"/><text class="sX" x="170" y="117" text-anchor="middle">401</text><rect class="sR" x="150" y="135" width="40" height="22" rx="4"/><text class="sX" x="170" y="151" text-anchor="middle">401</text><rect class="sR" x="150" y="169" width="40" height="22" rx="4"/><text class="sX" x="170" y="185" text-anchor="middle">401</text><text class="sRt" x="420" y="110" text-anchor="middle">the access token expired: all five fail at once</text></g>
<g data-s="2-2"><line class="sLr" x1="144" y1="44" x2="386" y2="112" marker-end="url(#ahr)"/><line class="sLr" x1="144" y1="78" x2="386" y2="112" marker-end="url(#ahr)"/><line class="sLr" x1="144" y1="112" x2="386" y2="112" marker-end="url(#ahr)"/><line class="sLr" x1="144" y1="146" x2="386" y2="112" marker-end="url(#ahr)"/><line class="sLr" x1="144" y1="180" x2="386" y2="112" marker-end="url(#ahr)"/><rect class="sW" x="390" y="86" width="140" height="52" rx="8"/><text class="sT" x="460" y="110" text-anchor="middle">/auth/refresh ×5</text><text class="sC" x="460" y="126" text-anchor="middle">old token R1</text><line class="sLr" x1="530" y1="112" x2="560" y2="112" marker-end="url(#ahr)"/><rect class="sR" x="562" y="80" width="144" height="64" rx="8"/><text class="sT" x="634" y="110" text-anchor="middle">R1 reused 4×</text><text class="sC" x="634" y="126" text-anchor="middle">theft suspected</text><text class="sRt" x="634" y="166" text-anchor="middle">user logged out ✗</text></g>
<g data-s="3-3"><line class="sLm" x1="144" y1="44" x2="236" y2="112" marker-end="url(#ahm)"/><line class="sLm" x1="144" y1="78" x2="236" y2="112" marker-end="url(#ahm)"/><line class="sLm" x1="144" y1="112" x2="236" y2="112" marker-end="url(#ahm)"/><line class="sLm" x1="144" y1="146" x2="236" y2="112" marker-end="url(#ahm)"/><line class="sLm" x1="144" y1="180" x2="236" y2="112" marker-end="url(#ahm)"/><rect class="sV" x="240" y="86" width="120" height="52" rx="8"/><text class="sT" x="300" y="110" text-anchor="middle">shared refresh</text><text class="sC" x="300" y="126" text-anchor="middle">shareReplay(1)</text><line class="sL" x1="360" y1="112" x2="396" y2="112" marker-end="url(#ah)"/><rect class="sG" x="400" y="86" width="120" height="52" rx="8"/><text class="sT" x="460" y="110" text-anchor="middle">/auth/refresh ×1</text><text class="sC" x="460" y="126" text-anchor="middle">R1 → R2</text><line class="sLg" x1="520" y1="112" x2="560" y2="112" marker-end="url(#ahg)"/><rect class="sG" x="562" y="80" width="144" height="64" rx="8"/><text class="sT" x="634" y="110" text-anchor="middle">new access token</text><text class="sC" x="634" y="126" text-anchor="middle">5 requests retried</text><text class="sGt" x="634" y="166" text-anchor="middle">user never notices ✓</text></g>
</svg><ol class="dia-steps">
<li>A dashboard loads five things in parallel just after the access token expired. All five come back 401.</li>
<li><b>Naively</b>, each request starts its own refresh. With rotation, the first succeeds and the other four present an already-used refresh token, which looks exactly like theft, so the server revokes the session.</li>
<li><b>Single-flight:</b> the first 401 starts a refresh and stores the observable; the others subscribe to the same one. One refresh, one rotation, five retries.</li>
</ol><figcaption>Rotation and reuse detection are good security; single-flight is what makes them usable.</figcaption></figure>

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

<figure class="dia"><svg viewBox="0 0 720 250" role="img" aria-label="Backend-for-frontend: the browser holds only a session cookie; the BFF keeps the tokens server-side, runs the login flow with the identity provider and forwards calls to APIs with a bearer token">
<rect class="sB" x="14" y="84" width="120" height="56" rx="8"/><text class="sT" x="74" y="110" text-anchor="middle">browser</text><text class="sC" x="74" y="126" text-anchor="middle">cookie only</text>
<line class="sL" x1="134" y1="112" x2="196" y2="112" marker-end="url(#ah)"/><text class="sC" x="165" y="104" text-anchor="middle">cookie</text>
<rect class="sV" x="200" y="30" width="230" height="164" rx="12"/><text class="sT" x="315" y="52" text-anchor="middle">BFF (same origin as the SPA)</text>
<rect class="sN" x="216" y="66" width="198" height="50" rx="6"/><text class="sC" x="315" y="86" text-anchor="middle">session store</text><text class="sC" x="315" y="104" text-anchor="middle">access + refresh tokens</text>
<rect class="sN" x="216" y="126" width="198" height="50" rx="6"/><text class="sC" x="315" y="146" text-anchor="middle">proxy (YARP)</text><text class="sC" x="315" y="164" text-anchor="middle">attaches Bearer, refreshes</text>
<line class="sLg" x1="430" y1="140" x2="516" y2="74" marker-end="url(#ahg)"/><line class="sLg" x1="430" y1="160" x2="516" y2="172" marker-end="url(#ahg)"/><text class="sGt" x="474" y="128" text-anchor="middle">Bearer</text>
<rect class="sG" x="520" y="48" width="186" height="50" rx="8"/><text class="sT" x="613" y="71" text-anchor="middle">invoices API</text><text class="sC" x="613" y="87" text-anchor="middle">validates the token</text><rect class="sG" x="520" y="148" width="186" height="50" rx="8"/><text class="sT" x="613" y="171" text-anchor="middle">forecast API</text><text class="sC" x="613" y="187" text-anchor="middle">validates the token</text>
<path class="sLw" d="M315 194 V222 H560" fill="none" stroke-dasharray="5 4" marker-end="url(#ahw)"/><rect class="sW" x="564" y="206" width="142" height="34" rx="8"/><text class="sT" x="635" y="228" text-anchor="middle">identity provider</text>
<text class="sWt" x="326" y="214">code flow + PKCE, client secret</text>
</svg><figcaption>The BFF keeps every token on the server. The browser ends up with design A's simplicity and the APIs still get standard bearer tokens.</figcaption></figure>

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

<figure class="dia steps"><svg viewBox="0 0 720 338" role="img" aria-label="A CORS preflight: the browser sends OPTIONS with the origin and requested method and headers, the API answers with allow headers, then the real request is sent with credentials">
<text class="sT" x="14" y="22">browser · SPA on app.finsight.example</text><text class="sT" x="706" y="22" text-anchor="end">api.finsight.example</text>
<line class="sD" x1="60" y1="32" x2="60" y2="330"/><line class="sD" x1="660" y1="32" x2="660" y2="330"/>
<g data-s="1"><rect class="sB" x="76" y="38" width="420" height="26" rx="5"/><text class="sC" x="86" y="56" xml:space="preserve" style="white-space:pre">fetch(url, { method: "POST", credentials: "include" })</text></g>
<g data-s="2"><line class="sLw" x1="60" y1="80" x2="656" y2="80" marker-end="url(#ahw)"/><text class="sWt" x="360" y="74" text-anchor="middle">OPTIONS /api/invoices (preflight, no cookie)</text><rect class="sW" x="100" y="88" width="520" height="58" rx="6" opacity=".55"/><text class="sC" x="110" y="104" xml:space="preserve" style="white-space:pre">Origin: https://app.finsight.example</text><text class="sC" x="110" y="120" xml:space="preserve" style="white-space:pre">Access-Control-Request-Method: POST</text><text class="sC" x="110" y="136" xml:space="preserve" style="white-space:pre">Access-Control-Request-Headers: content-type, x-xsrf-token</text></g>
<g data-s="3"><line class="sLg" x1="660" y1="166" x2="64" y2="166" marker-end="url(#ahg)"/><text class="sGt" x="360" y="160" text-anchor="middle">204 No Content: the policy says yes</text><rect class="sG" x="100" y="174" width="520" height="74" rx="6" opacity=".55"/><text class="sC" x="110" y="190" xml:space="preserve" style="white-space:pre">Access-Control-Allow-Origin: https://app.finsight.example</text><text class="sC" x="110" y="206" xml:space="preserve" style="white-space:pre">Access-Control-Allow-Credentials: true</text><text class="sC" x="110" y="222" xml:space="preserve" style="white-space:pre">Access-Control-Allow-Headers: content-type, x-xsrf-token</text><text class="sC" x="110" y="238" xml:space="preserve" style="white-space:pre">Access-Control-Max-Age: 3600</text></g>
<g data-s="4"><line class="sL" x1="60" y1="270" x2="656" y2="270" marker-end="url(#ah)"/><text class="sC" x="360" y="264" text-anchor="middle">POST /api/invoices + cookie (the real request)</text><line class="sLg" x1="660" y1="296" x2="64" y2="296" marker-end="url(#ahg)"/><text class="sGt" x="360" y="290" text-anchor="middle">201 + Allow-Origin: JavaScript may read it</text></g>
<g data-s="5"><text class="sRt" x="360" y="326" text-anchor="middle">no matching headers → the browser hides the response: "blocked by CORS policy"</text></g>
</svg><ol class="dia-steps">
<li>Your code makes a cross-origin POST with JSON and credentials. That's not a "simple" request, so the browser checks first.</li>
<li>The browser sends a <b>preflight</b>: an <code>OPTIONS</code> request naming the origin, method and custom headers it wants to use. No cookies, no body.</li>
<li>The CORS middleware compares them with your policy and answers with <code>Allow-*</code> headers. <code>Max-Age</code> lets the browser cache the answer for an hour.</li>
<li>Now the real request goes, with the cookie. Its response also carries <code>Allow-Origin</code>, or the browser won't hand it to your JavaScript.</li>
<li>CORS is enforced by the browser to protect the <b>user's</b> data. It is not server security: <code>curl</code> ignores it entirely, so authentication and authorisation still do the real work.</li>
</ol><figcaption>Every "CORS error" is one of these headers missing or not matching. Read the preflight in the Network tab first.</figcaption></figure>

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

<figure class="dia steps"><svg viewBox="0 0 720 270" role="img" aria-label="Sequence of a SignalR connection with a bearer token: negotiate over HTTP with an Authorization header; the WebSocket upgrade carries the token as access_token in the query string because browsers cannot set headers there; the server reads it for hub paths and validates it; the hub adds the connection to its tenant group from the token claim; notifications are pushed to that group only">
<rect class="sA" x="20" y="14" width="120" height="30" rx="8"/><text class="sT" x="80" y="34" text-anchor="middle">browser</text><rect class="sB" x="380" y="14" width="120" height="30" rx="8"/><text class="sT" x="440" y="34" text-anchor="middle">ASP.NET Core</text>
<line class="sLm" x1="80" y1="44" x2="80" y2="262" stroke-dasharray="3 4"/><line class="sLm" x1="440" y1="44" x2="440" y2="262" stroke-dasharray="3 4"/>
<g data-s="1"><line class="sLg" x1="80" y1="66" x2="436" y2="66" marker-end="url(#ahg)"/><text class="sS" x="90" y="60" xml:space="preserve" style="white-space:pre">POST /hubs/notifications/negotiate</text><text class="sGt" x="90" y="80" xml:space="preserve" style="white-space:pre">Authorization: Bearer eyJ…  (plain HTTP: header OK)</text><line class="sLm" x1="440" y1="94" x2="84" y2="94" marker-end="url(#ahm)"/><text class="sS" x="260" y="108" text-anchor="middle">connectionToken, transports</text></g>
<g data-s="2"><line class="sLw" x1="80" y1="132" x2="436" y2="132" marker-end="url(#ahw)"/><text class="sS" x="90" y="126" xml:space="preserve" style="white-space:pre">GET /hubs/notifications?id=…&amp;access_token=eyJ…</text><text class="sWt" x="90" y="146" xml:space="preserve" style="white-space:pre">Upgrade: websocket  (browser API: no custom headers)</text></g>
<g data-s="3"><rect class="sB" x="454" y="110" width="252" height="52" rx="6"/><text class="sS" x="580" y="130" text-anchor="middle">OnMessageReceived: path is /hubs</text><text class="sS" x="580" y="148" text-anchor="middle">→ ctx.Token = query token, validated</text><line class="sLm" x1="440" y1="170" x2="84" y2="170" marker-end="url(#ahm)"/><text class="sS" x="260" y="164" text-anchor="middle">101 Switching Protocols</text></g>
<g data-s="4"><rect class="sV" x="454" y="176" width="252" height="44" rx="6"/><text class="sS" x="462" y="194" xml:space="preserve" style="white-space:pre">Groups.AddToGroupAsync(id,</text><text class="sS" x="462" y="212" xml:space="preserve" style="white-space:pre">  "company:" + token claim)</text></g>
<g data-s="5"><line class="sLg" x1="440" y1="236" x2="84" y2="236" marker-end="url(#ahg)"/><text class="sGt" x="260" y="230" text-anchor="middle">push to group company:7 only</text><text class="sS" x="360" y="258" text-anchor="middle">other tenants never receive it; scrub access_token from access logs</text></g>
</svg><ol class="dia-steps">
<li>Negotiate is an ordinary HTTP request, so the SignalR client sends the token in the Authorization header.</li>
<li>The WebSocket upgrade is made by the browser's WebSocket API, which cannot set headers, so the token travels in the query string.</li>
<li>OnMessageReceived copies the query token into the JWT handler only for hub paths; it is then validated like any bearer token.</li>
<li>On connect, the hub adds the connection to its tenant group using the claim from the validated token, never a value the client sends.</li>
<li>Messages go to the group, so each tenant only hears its own events. Keep query-string tokens out of your logs.</li>
</ol><figcaption>Where the token travels during a SignalR connection, and where tenant isolation is enforced.</figcaption></figure>

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
