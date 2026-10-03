# Authentication and Authorisation — Identity, JWT, OAuth 2.0, OpenID Connect and Policies

Auth questions appear in every backend and full-stack interview, and they're where vague answers get exposed quickly: "we used JWT" is followed by "where was it stored?", "how did you revoke it?", "what's in it?", "how did you stop an accountant calling an admin endpoint?". FinSight gives you real material: ASP.NET Identity with Admin, Owner and Accountant roles, JWT with an HttpOnly-cookie fallback, server-side verification of Google sign-in, and a team-management role matrix from your hardening sweep.

> [!focus]
> **Entry must:** authentication vs authorisation; how JWT works and how it's validated; where tokens should live in a browser; password hashing; roles vs claims in ASP.NET Core.
> **Mid adds:** refresh-token rotation, revocation strategies, OAuth 2.0 and OpenID Connect flows (authorisation code with PKCE, client credentials), access vs ID tokens, policy and resource-based authorisation, the backend-for-frontend pattern, service-to-service auth.
> **Most asked:** *AuthN vs AuthZ?* · *How does JWT work?* · *How do you revoke a JWT?* · *What's a refresh token?* · *OAuth vs OpenID Connect?* · *What is PKCE?* · *Roles vs claims vs policies?*
> **Time budget:** 3 hours.

## B7.1 Two different questions 🟢 ⭐

| | Authentication (AuthN) | Authorisation (AuthZ) |
|---|---|---|
| Asks | **Who are you?** | **What may you do?** |
| Evidence | Password, passkey, OTP, a token from an identity provider | Roles, claims, ownership, policies |
| Fails with | **401** Unauthorized | **403** Forbidden |
| ASP.NET Core | `AddAuthentication()` + a scheme (JWT bearer, cookies) → `UseAuthentication()` | `AddAuthorization()` + policies → `UseAuthorization()`, `[Authorize]` |

## B7.2 JSON Web Tokens 🟢 ⭐

> [!term] JWT (JSON Web Token)
> A compact, **signed** token carrying **claims** about a subject, in three Base64url parts separated by dots: `header.payload.signature`. Anyone can **read** the payload; only someone with the key can **create a valid signature**, so the server can trust the claims without a database lookup. It's defined in **RFC 7519**.

```json
// header
{ "alg": "RS256", "typ": "JWT", "kid": "2026-10" }
// payload (claims)
{
  "iss": "https://auth.finsight.example",   // issuer
  "aud": "finsight-api",                    // audience: which API it's for
  "sub": "8f3c…",                           // subject: the user ID
  "exp": 1791060000, "iat": 1791059100,     // expiry and issued-at (Unix seconds): 15 minutes here
  "role": ["Accountant"],
  "company_id": "c-42"                      // custom claim: the tenant
}
```

**Signing algorithms:** **HS256** uses one shared secret to sign and verify, so every verifier could also mint tokens; fine inside one app. **RS256/ES256** sign with a **private key** and verify with a **public key** (published as a JWKS), so many services can verify while only the auth server can sign.

**Validation, every request:**

```csharp
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(o =>
    {
        o.Authority = "https://auth.finsight.example";     // downloads signing keys (JWKS) automatically
        o.Audience = "finsight-api";
        o.TokenValidationParameters = new()
        {
            ValidateIssuer = true, ValidateAudience = true,
            ValidateLifetime = true, ClockSkew = TimeSpan.FromSeconds(30),   // the default skew is 5 minutes
            ValidAlgorithms = [SecurityAlgorithms.RsaSha256],                // pin the algorithm
        };
    });
```

> [!mistake] JWT pitfalls
> - **Putting secrets or personal data in the payload.** It's readable by anyone; only signed.
> - **Long lifetimes.** A stolen 30-day token is a 30-day breach. Keep access tokens short (minutes) and use refresh tokens.
> - **Not validating** issuer, audience or algorithm (historic attacks used `alg: none`, or confused HS256 and RS256).
> - **Weak HS256 secrets** that can be brute-forced offline.
> - **Storing it in `localStorage`**, where any XSS can read it ([[S1.6]], [[S9.4]]).

> [!say]
> "A JWT is a signed set of claims: header, payload and signature, Base64url-encoded. The API validates the signature with the issuer's key and checks the issuer, audience and expiry, so it can trust the user ID, roles and tenant without a database call. It isn't encrypted, so nothing sensitive goes in it, and I keep access tokens short-lived."

## B7.3 Revocation and refresh tokens 🟡 ⭐

A JWT stays valid until it expires, even after logout or a password change. Options:

| Approach | Trade-off |
|---|---|
| **Short-lived access tokens** (5–15 minutes) plus **refresh tokens** | Standard. Revoking the refresh token cuts access within minutes |
| **Deny-list** of revoked token IDs (`jti`) in Redis | Immediate revocation, at the cost of a lookup per request |
| **Security stamp / token version** per user, checked against the database or cache | Revokes all of a user's tokens on password change |
| Server-side **sessions** instead of JWTs | Instant revocation; needs a shared session store |

> [!term] Refresh token
> A long-lived credential, used **only** with the auth server, to obtain new short-lived access tokens without asking the user to log in again. It must be stored securely (an HttpOnly, Secure, SameSite cookie on a path scoped to the refresh endpoint, or server-side), and should be **rotated**.

**Refresh-token rotation with reuse detection:** every refresh returns a **new** refresh token and invalidates the old one. If an old one is ever presented again, someone stole it, so the server revokes the whole token family and forces a new login. That's what current OAuth security guidance recommends for browser-based apps.

## B7.4 Passwords and ASP.NET Core Identity 🟢

**ASP.NET Core Identity** provides users, password hashing (PBKDF2 with many iterations), lockout after failed attempts, email confirmation, two-factor authentication, external logins and, in **.NET 10, passkeys** (WebAuthn/FIDO2). Since .NET 8, `MapIdentityApi<TUser>()` exposes ready-made login, register and refresh endpoints for SPAs.

```csharp
builder.Services.AddIdentityCore<AppUser>(o =>
    {
        o.Password.RequiredLength = 10;
        o.Lockout.MaxFailedAccessAttempts = 5;
        o.User.RequireUniqueEmail = true;
    })
    .AddRoles<IdentityRole>()
    .AddEntityFrameworkStores<AppDbContext>();
```

Password rules from [[S9.7]] apply: slow salted hashing, rate limiting, breached-password checks, MFA, generic error messages.

> [!term] Passkey
> A phishing-resistant replacement for passwords based on public-key cryptography (WebAuthn/FIDO2). The device holds a private key unlocked by fingerprint, face or PIN; the server stores only the public key. There's nothing to steal from the server and nothing to type into a fake site.

## B7.5 OAuth 2.0 and OpenID Connect 🟡 ⭐

> [!term] OAuth 2.0
> A framework for **delegated authorisation**: it lets an application obtain an **access token** to call an API on a user's behalf (or on its own behalf), without handling the user's password. It's about *access*, not identity.

> [!term] OpenID Connect (OIDC)
> An identity layer **on top of OAuth 2.0**. It adds an **ID token** (a JWT that says who the user is and how they logged in), a `userinfo` endpoint and standard scopes (`openid`, `profile`, `email`). "Sign in with Google or Microsoft" is OIDC.

| Token | For | Audience | Who reads it |
|---|---|---|---|
| **ID token** | Telling the **client app** who logged in | The client | The client, never sent to APIs |
| **Access token** | Calling an **API** | The API (resource server) | The API |
| **Refresh token** | Getting new access tokens | The auth server | The auth server |

**The roles:** resource owner (the user), client (your app), **authorisation server** (Entra ID, Auth0, Keycloak, Google), resource server (your API).

### Which flow? ⭐

| Flow | Use it for |
|---|---|
| **Authorisation code + PKCE** | **Any app with a user**: SPAs, mobile apps and server-side web apps. The current recommendation for all of them |
| **Client credentials** | **Service-to-service** calls with no user (a background worker calling another API) |
| **Device authorisation** | TVs and CLIs without a browser keyboard |
| ~~Implicit~~ | **Deprecated** (tokens in the URL fragment) |
| ~~Resource owner password~~ | **Deprecated** (the app sees the password) |

The deprecations are formalised in **RFC 9700, OAuth 2.0 Security Best Current Practice** (January 2025), and the consolidated **OAuth 2.1** draft drops both flows.

> [!term] PKCE (Proof Key for Code Exchange)
> The client creates a random **code verifier**, sends its hash (the **code challenge**) when starting login, and must present the original verifier when exchanging the authorisation code for tokens. A stolen authorisation code is useless without the verifier, which is why public clients (SPAs, mobile apps) that can't keep a secret are safe using the code flow.

<figure class="dia"><svg viewBox="0 0 720 220" role="img" aria-label="Authorization code flow with PKCE between browser app, authorization server and API">
<rect class="sA" x="20" y="20" width="140" height="180" rx="10"/><text class="sT" x="90" y="45" text-anchor="middle">App (SPA/BFF)</text>
<rect class="sW" x="290" y="20" width="160" height="180" rx="10"/><text class="sT" x="370" y="45" text-anchor="middle">Authorisation server</text>
<rect class="sG" x="580" y="20" width="120" height="180" rx="10"/><text class="sT" x="640" y="45" text-anchor="middle">Your API</text>
<line class="sL" x1="160" y1="70" x2="290" y2="70"/><text class="sM" x="166" y="64">① redirect + code_challenge</text>
<line class="sD" x1="290" y1="95" x2="160" y2="95"/><text class="sM" x="180" y="110">② user logs in → code</text>
<line class="sL" x1="160" y1="130" x2="290" y2="130"/><text class="sM" x="166" y="124">③ code + code_verifier</text>
<line class="sD" x1="290" y1="150" x2="160" y2="150"/><text class="sM" x="172" y="166">④ access + ID + refresh tokens</text>
<line class="sL" x1="160" y1="185" x2="580" y2="185"/><text class="sM" x="300" y="180">⑤ Authorization: Bearer access_token</text>
</svg><figcaption>Authorisation code with PKCE. With a backend-for-frontend, steps ③–④ happen on your server, and the browser only ever holds a session cookie.</figcaption></figure>

> [!say]
> "OAuth 2.0 is about delegated access, getting an access token to call an API; OpenID Connect adds identity with an ID token. For anything with a user, SPAs included, I use the authorisation code flow with PKCE, which protects the code exchange without a client secret. For service-to-service calls with no user, client credentials. The implicit and password flows are deprecated."

### Where should a SPA keep tokens? The BFF pattern 🟡 ⭐

> [!term] Backend for Frontend (BFF), for auth
> A small server-side component, possibly your own API, that performs the OAuth code flow as a **confidential client**, keeps the tokens **on the server**, and gives the browser only an **HttpOnly, Secure, SameSite session cookie**. The SPA calls the BFF, which attaches the access token when calling APIs. No token is ever exposed to JavaScript.

That's the current recommendation for high-security browser apps (the IETF's "OAuth 2.0 for Browser-Based Applications" guidance). The alternative, tokens held **in memory** in the SPA with silent refresh, is acceptable with short lifetimes and a strict CSP. `localStorage` is the weakest option. The end-to-end picture, with CORS and cookies, is in [[FS2]].

> [!story]
> FinSight issued a **JWT with an HttpOnly-cookie fallback**, and **verified Google sign-in on the server**: the API validated Google's ID token (signature, audience equal to your client ID, issuer, expiry) before creating or linking the user, instead of trusting whatever the browser claimed. (A teammate implemented the Google sign-in feature; you integrated it and can explain the verification.) Say both halves: why the cookie (keeping the token away from XSS), and why server-side verification (the client can't be trusted to say who the user is).

## B7.6 Authorisation in ASP.NET Core 🟢 🟡 ⭐

| Mechanism | Example | Use for |
|---|---|---|
| **Roles** | `[Authorize(Roles = "Admin,Owner")]` | Coarse groups of users |
| **Claims** | `policy.RequireClaim("company_id")` | Facts about the user (tenant, department, subscription tier) |
| **Policies** | `[Authorize(Policy = "CanApprovePayments")]` | **Named rules** combining roles, claims and custom logic in one place |
| **Requirements + handlers** | `MinimumTenureRequirement` + `MinimumTenureHandler` | Custom logic, with access to DI services |
| **Resource-based** | `await authz.AuthorizeAsync(User, invoice, "CanEditInvoice")` | Rules that depend on **the specific object**: owner, tenant, status |

```csharp
builder.Services.AddAuthorizationBuilder()
    .AddPolicy("CanApprovePayments", p => p.RequireRole("Owner").RequireClaim("mfa", "true"))
    .SetFallbackPolicy(new AuthorizationPolicyBuilder().RequireAuthenticatedUser().Build());   // deny by default

public class InvoiceEditHandler : AuthorizationHandler<OperationAuthorizationRequirement, Invoice>
{
    protected override Task HandleRequirementAsync(AuthorizationHandlerContext ctx,
        OperationAuthorizationRequirement req, Invoice invoice)
    {
        var sameTenant = ctx.User.FindFirst("company_id")?.Value == invoice.CompanyId.ToString();
        var canEdit = ctx.User.IsInRole("Owner") || (ctx.User.IsInRole("Accountant") && invoice.Status == InvoiceStatus.Draft);
        if (sameTenant && canEdit) ctx.Succeed(req);
        return Task.CompletedTask;
    }
}
```

**Permission-based authorisation** (mid level): instead of hard-coding roles in attributes, map roles to fine-grained **permissions** (`invoices.approve`, `team.manage`) stored in data, and check permissions in policies. Roles can then change without redeploying.

> [!story]
> Your July sweep added **team management with a role matrix**: which of Admin, Owner and Accountant may invite users, change roles, approve payments or see reports. That's permission-based design. In an interview, describe the matrix, how it was enforced on the server with policies, and how the Angular UI used the same matrix only to hide buttons, not to secure anything.

> [!say]
> "Roles are fine for coarse checks, but I centralise rules in named policies, and for anything that depends on the record, like same tenant and draft status, I use resource-based authorisation with a handler. The fallback policy requires an authenticated user, so every endpoint is denied by default unless I mark it public."

## B7.7 Service-to-service and machine identities 🟡

- **Client credentials** flow: the calling service authenticates with its own ID and secret (or a certificate) and gets an access token with app permissions.
- **Managed identities** in Azure: no secret at all; Azure issues tokens to the app ([[S10.6]]).
- **API keys** for simple partner integrations: random, hashed at rest like passwords, scoped, rotatable, sent in a header (never the URL), and rate-limited.
- **mTLS** (mutual TLS): both sides present certificates, common inside service meshes and for banking integrations.

## B7.8 Common auth mistakes reviewers look for 🟢 ⭐

1. Checking permissions only in the UI or route guards ([[S9.6]]).
2. Trusting a `userId` or `companyId` from the request **body** instead of the authenticated token.
3. Long-lived tokens with no revocation path.
4. Tokens in `localStorage` with no CSP.
5. Returning different errors for "unknown user" and "wrong password" (account enumeration).
6. No rate limit on login, OTP verification or password reset.
7. Password-reset tokens that don't expire, or that can be reused.
8. Logging tokens or passwords.
9. `[AllowAnonymous]` left on an endpoint after testing.
10. Not validating the `aud` claim, so a token issued for another API is accepted.

> [!lab] Build the auth slice of a real app
> In a small ASP.NET Core API: Identity with lockout; short-lived JWT access tokens plus rotating refresh tokens in an HttpOnly cookie (with reuse detection); a fallback policy that denies by default; one role-based, one claims-based and one resource-based policy; a rate-limited login. Then attack it: replay an old refresh token, call another tenant's invoice, and send a token with the wrong audience. Each should fail with the right status code.

## B7.9 Interview drill 🟢 ⭐

| Question | Strong short answer |
|---|---|
| AuthN vs AuthZ? | Authentication proves who you are (401 on failure); authorisation decides what you may do (403). |
| How does a JWT work? | Signed Base64url claims; the API verifies the signature and checks issuer, audience and expiry, then trusts the claims. |
| Is a JWT encrypted? | No, only signed; anyone can read the payload. |
| HS256 vs RS256? | A shared secret signs and verifies vs a private key signs and a public key verifies, so many services can verify safely. |
| How do you revoke a JWT? | Short expiry plus refresh tokens, a deny-list of token IDs, or a per-user token version or security stamp. |
| What's refresh-token rotation? | Every refresh returns a new refresh token and invalidates the old; reuse of an old one revokes the whole family. |
| OAuth 2.0 vs OpenID Connect? | OAuth is delegated authorisation (access tokens); OIDC adds authentication with an ID token. |
| ID token vs access token? | The ID token tells the client who logged in; the access token is sent to APIs. |
| Which flow for a SPA? | Authorisation code with PKCE, ideally through a backend-for-frontend. |
| What does PKCE protect against? | Interception of the authorisation code: without the original verifier, the code can't be exchanged. |
| Which flow between services? | Client credentials, or a managed identity in Azure. |
| Roles vs claims vs policies? | Roles are groups, claims are facts about the user, policies are named rules combining them and custom logic. |
| What is resource-based authorisation? | Deciding based on the specific object, e.g. same tenant and draft status, using IAuthorizationService with the resource. |
| Where should a browser app keep tokens? | Server-side behind a BFF with an HttpOnly session cookie; otherwise in memory; not localStorage. |
| What's a passkey? | A WebAuthn credential: a device-held private key unlocked biometrically; phishing-resistant, supported in ASP.NET Core Identity since .NET 10. |

## Key takeaways

> [!check]
> - 401 means "who are you"; 403 means "not allowed".
> - JWTs are readable, signed claims: validate issuer, audience, expiry and algorithm; keep them short-lived.
> - Refresh tokens rotate, with reuse detection; revocation needs a plan.
> - Authorisation code with PKCE for anything with a user; client credentials between services.
> - Deny by default; policies over scattered role checks; resource-based checks for per-record rules.

## Sources

- IETF: [RFC 7519 — JSON Web Token](https://www.rfc-editor.org/rfc/rfc7519), [RFC 6749 — OAuth 2.0](https://www.rfc-editor.org/rfc/rfc6749), [RFC 7636 — PKCE](https://www.rfc-editor.org/rfc/rfc7636), [RFC 9700 — OAuth 2.0 Security Best Current Practice](https://www.rfc-editor.org/rfc/rfc9700) (January 2025), [RFC 8725 — JWT Best Current Practices](https://www.rfc-editor.org/rfc/rfc8725), [OAuth 2.0 for Browser-Based Applications (draft)](https://datatracker.ietf.org/doc/draft-ietf-oauth-browser-based-apps/).
- OpenID Foundation: [OpenID Connect Core 1.0](https://openid.net/specs/openid-connect-core-1_0.html).
- Microsoft Learn: [Configure JWT bearer authentication](https://learn.microsoft.com/en-us/aspnet/core/security/authentication/configure-jwt-bearer-authentication), [Policy-based authorization](https://learn.microsoft.com/en-us/aspnet/core/security/authorization/policies), [Resource-based authorization](https://learn.microsoft.com/en-us/aspnet/core/security/authorization/resourcebased), [Identity API endpoints for SPAs](https://learn.microsoft.com/en-us/aspnet/core/security/authentication/identity-api-authorization), [Passkeys in ASP.NET Core Identity](https://learn.microsoft.com/en-us/aspnet/core/security/authentication/passkeys/).
- OWASP: [Authentication cheat sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html), [JSON Web Token cheat sheet](https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_Cheat_Sheet.html).
- [FIDO Alliance: passkeys](https://fidoalliance.org/passkeys/).
