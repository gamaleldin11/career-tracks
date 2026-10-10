# Authentication and Authorisation — Identity, JWT, OAuth 2.0, OpenID Connect and Policies

Auth questions appear in every backend and full-stack interview, and they're where vague answers get exposed quickly: "we used JWT" is followed by "where was it stored?", "how did you revoke it?", "what's in it?", "how did you stop an accountant calling an admin endpoint?". FinSight gives you real material: ASP.NET Identity with Admin, Owner and Accountant roles, JWT with an HttpOnly-cookie fallback, server-side verification of Google sign-in, and a team-management role matrix from your hardening sweep.

> [!focus]
> **Entry must:** authentication vs authorisation; how JWT works and how it's validated; where tokens should live in a browser; password hashing; roles vs claims in ASP.NET Core.
> **Mid adds:** refresh-token rotation, revocation strategies, OAuth 2.0 and OpenID Connect flows (authorisation code with PKCE, client credentials), access vs ID tokens, policy and resource-based authorisation, the backend-for-frontend pattern, service-to-service auth.
> **Most asked:** *AuthN vs AuthZ?* · *How does JWT work?* · *How do you revoke a JWT?* · *What's a refresh token?* · *OAuth vs OpenID Connect?* · *What is PKCE?* · *Roles vs claims vs policies?*
> **Time budget:** 3 hours.

## B7.0 Foundations: how "logged in" works on a stateless protocol 🟢

HTTP remembers nothing between requests ([[S1.6]]). So "logging in" is really two steps: **prove who you are once**, then **carry proof on every request after that**.

**Proving who you are** uses one or more **factors**: something you **know** (a password, a PIN), something you **have** (a phone receiving a code, a hardware key, a passkey on your device), something you **are** (a fingerprint or face that unlocks that key). **Multi-factor authentication** combines two kinds, so one stolen password isn't enough.

**Carrying proof** means the server issues a credential the client presents each time. There are two designs:

<figure class="dia"><svg viewBox="0 0 720 210" role="img" aria-label="A reference token is an ID the server looks up in a session store; a self-contained token carries signed claims the server verifies without a lookup">
<text class="sT" x="180" y="22" text-anchor="middle">reference token (session ID)</text><text class="sT" x="540" y="22" text-anchor="middle">self-contained token (JWT)</text>
<rect class="sB" x="20" y="40" width="110" height="46" rx="8"/><text class="sT" x="75" y="61" text-anchor="middle">browser</text><text class="sC" x="75" y="77" text-anchor="middle">sid=9f2c…</text><line class="sL" x1="130" y1="63" x2="196" y2="63" marker-end="url(#ah)"/><rect class="sA" x="200" y="40" width="140" height="46" rx="8"/><text class="sT" x="270" y="61" text-anchor="middle">API</text><text class="sC" x="270" y="77" text-anchor="middle">who is 9f2c?</text>
<line class="sLw" x1="270" y1="86" x2="270" y2="116" marker-end="url(#ahw)"/><rect class="sW" x="200" y="120" width="140" height="46" rx="8"/><text class="sT" x="270" y="141" text-anchor="middle">session store</text><text class="sC" x="270" y="157" text-anchor="middle">Redis / database</text>
<text class="sC" x="180" y="196" text-anchor="middle">a lookup per request; revoke = delete it</text>
<line class="sD" x1="360" y1="12" x2="360" y2="210"/>
<rect class="sB" x="380" y="40" width="120" height="46" rx="8"/><text class="sT" x="440" y="61" text-anchor="middle">browser</text><text class="sC" x="440" y="77" text-anchor="middle">eyJhbGci…</text><line class="sL" x1="500" y1="63" x2="556" y2="63" marker-end="url(#ah)"/><rect class="sA" x="560" y="40" width="140" height="46" rx="8"/><text class="sT" x="630" y="61" text-anchor="middle">API</text><text class="sC" x="630" y="77" text-anchor="middle">check signature</text>
<rect class="sG" x="560" y="120" width="140" height="46" rx="8"/><text class="sC" x="630" y="140" text-anchor="middle">claims inside:</text><text class="sC" x="630" y="156" text-anchor="middle">sub · role · tenant</text>
<text class="sC" x="540" y="196" text-anchor="middle">no lookup; hard to revoke before expiry</text>
</svg><figcaption>Two ways to remember who someone is. Both are bearer credentials: whoever holds one can use it, so both must be protected in transit and in storage.</figcaption></figure>

> [!term] Bearer token
> A token that grants access to whoever presents it, like cash: no further proof is required. That's why tokens travel only over HTTPS, live as short a time as practical, and are kept away from JavaScript where possible.

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

<figure class="dia"><svg viewBox="0 0 720 226" role="img" aria-label="A JWT's three dot-separated parts: a header naming the algorithm, a readable payload of claims, and a signature made with the issuer's private key">
<rect class="sR" x="20" y="30" width="210" height="30" rx="4"/><text class="sC" x="125" y="50" text-anchor="middle">eyJhbGciOiJSUzI1NiJ9</text><text class="sM" x="125" y="80" text-anchor="middle">header</text>
<text class="sX" x="237" y="52" text-anchor="middle">.</text>
<rect class="sV" x="244" y="30" width="210" height="30" rx="4"/><text class="sC" x="349" y="50" text-anchor="middle">eyJzdWIiOiI4ZjNj…</text><text class="sM" x="349" y="80" text-anchor="middle">payload (claims)</text>
<text class="sX" x="461" y="52" text-anchor="middle">.</text>
<rect class="sA" x="468" y="30" width="210" height="30" rx="4"/><text class="sC" x="573" y="50" text-anchor="middle">SflKxwRJSMeKKF2QT4…</text><text class="sM" x="573" y="80" text-anchor="middle">signature</text>
<rect class="sB" x="20" y="100" width="210" height="70" rx="6"/><text class="sC" x="28" y="122" xml:space="preserve" style="white-space:pre">{ "alg": "RS256",</text><text class="sC" x="28" y="140" xml:space="preserve" style="white-space:pre">  "kid": "2026-10" }</text>
<rect class="sB" x="244" y="100" width="210" height="90" rx="6"/><text class="sC" x="252" y="122" xml:space="preserve" style="white-space:pre">{ "sub": "8f3c…",</text><text class="sC" x="252" y="140" xml:space="preserve" style="white-space:pre">  "role": ["Accountant"],</text><text class="sC" x="252" y="158" xml:space="preserve" style="white-space:pre">  "company_id": "c-42",</text><text class="sC" x="252" y="176" xml:space="preserve" style="white-space:pre">  "exp": 1791060000 }</text>
<rect class="sG" x="468" y="100" width="232" height="90" rx="6"/><text class="sC" x="584" y="124" text-anchor="middle">sign(header.payload)</text><text class="sC" x="584" y="142" text-anchor="middle">with the issuer's PRIVATE key</text><text class="sGt" x="584" y="168" text-anchor="middle">API verifies with the PUBLIC key</text>
<text class="sWt" x="240" y="214" text-anchor="middle">Base64url, not encryption: anyone can decode the first two parts</text>
</svg><figcaption>Anatomy of a JWT. The signature makes the claims trustworthy; it doesn't make them secret.</figcaption></figure>

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

<figure class="dia steps" data-start="1"><svg viewBox="0 0 720 254" role="img" aria-label="Refresh token rotation: each refresh returns a new refresh token; when an attacker replays an old one, the server detects reuse and revokes the whole token family">
<text class="sT" x="100" y="22" text-anchor="middle">App</text><line class="sD" x1="100" y1="32" x2="100" y2="246"/>
<text class="sT" x="380" y="22" text-anchor="middle">Auth server</text><line class="sD" x1="380" y1="32" x2="380" y2="246"/>
<text class="sT" x="640" y="22" text-anchor="middle">Attacker</text><line class="sD" x1="640" y1="32" x2="640" y2="246"/>
<g data-s="1"><line class="sL" x1="100" y1="50" x2="376" y2="56" marker-end="url(#ah)"/><text class="sM" x="240" y="46" text-anchor="middle">refresh with RT1</text><line class="sLg" x1="376" y1="70" x2="104" y2="76" marker-end="url(#ahg)"/><text class="sGt" x="240" y="90" text-anchor="middle">new AT + RT2; RT1 marked used</text></g>
<g data-s="2"><rect class="sR" x="560" y="104" width="160" height="28" rx="6"/><text class="sC" x="640" y="123" text-anchor="middle">stole RT1 earlier</text></g>
<g data-s="3"><line class="sLr" x1="636" y1="146" x2="384" y2="152" marker-end="url(#ahr)"/><text class="sRt" x="510" y="142" text-anchor="middle">refresh with RT1 (already used!)</text></g>
<g data-s="4"><rect class="sR" x="300" y="166" width="160" height="40" rx="8"/><text class="sC" x="380" y="184" text-anchor="middle">reuse detected:</text><text class="sC" x="380" y="199" text-anchor="middle">revoke the whole family</text></g>
<g data-s="5"><line class="sLm" x1="376" y1="222" x2="104" y2="228" marker-end="url(#ahm)"/><text class="sWt" x="240" y="242" text-anchor="middle">RT2 rejected too → log in again</text></g>
</svg><ol class="dia-steps">
<li>The access token (AT) expired, so the app refreshes with RT1 and receives a new access token plus a new refresh token, RT2. RT1 is now spent.</li>
<li>Suppose an attacker had copied RT1 at some point.</li>
<li>The attacker tries to use RT1. It has already been used once, which can only mean a copy exists.</li>
<li>The server can't tell which party is legitimate, so it revokes every token descended from that login.</li>
<li>The real user's RT2 stops working too, and they sign in again. The stolen token bought the attacker nothing.</li>
</ol><figcaption>Rotation with reuse detection turns a stolen refresh token from a long-term breach into a forced re-login.</figcaption></figure>

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

<figure class="dia"><svg viewBox="0 0 720 242" role="img" aria-label="Guesses per second measured on one CPU core: hundreds of thousands per second for salted SHA-256, about two dozen for ASP.NET Core Identity's PBKDF2 with HMAC-SHA512 and 100,000 iterations, and about 9 for scrypt, so a million-password dictionary against one account takes about a second, about half a day and more than a day respectively; below, the decoded layout of a real Identity hash: format byte, PRF, iteration count, salt length, salt and subkey">
<text class="sS" x="14" y="20">guesses per second on one CPU core (log scale), and the time to try 1,000,000 common passwords against ONE account</text>
<line class="sLm" x1="300" y1="30" x2="300" y2="134" opacity=".15"/><text class="sS" x="300" y="146" text-anchor="middle">1</text>
<line class="sLm" x1="357.143" y1="30" x2="357.143" y2="134" opacity=".15"/><text class="sS" x="357.143" y="146" text-anchor="middle">1e1</text>
<line class="sLm" x1="414.286" y1="30" x2="414.286" y2="134" opacity=".15"/><text class="sS" x="414.286" y="146" text-anchor="middle">1e2</text>
<line class="sLm" x1="471.429" y1="30" x2="471.429" y2="134" opacity=".15"/><text class="sS" x="471.429" y="146" text-anchor="middle">1e3</text>
<line class="sLm" x1="528.571" y1="30" x2="528.571" y2="134" opacity=".15"/><text class="sS" x="528.571" y="146" text-anchor="middle">1e4</text>
<line class="sLm" x1="585.714" y1="30" x2="585.714" y2="134" opacity=".15"/><text class="sS" x="585.714" y="146" text-anchor="middle">1e5</text>
<line class="sLm" x1="642.857" y1="30" x2="642.857" y2="134" opacity=".15"/><text class="sS" x="642.857" y="146" text-anchor="middle">1e6</text>
<line class="sLm" x1="700" y1="30" x2="700" y2="134" opacity=".15"/><text class="sS" x="700" y="146" text-anchor="middle">1e7</text>
<text class="sS" x="290" y="50" text-anchor="end">salted SHA-256 (Python)</text><rect class="sR" x="300" y="34" width="338.34" height="22" rx="4" opacity=".7"/><text class="sT" x="632.34" y="50" text-anchor="end">833,591/s · 1.2 s</text>
<text class="sS" x="290" y="82" text-anchor="end">Identity: PBKDF2-SHA512 ×100,000 (.NET)</text><rect class="sG" x="300" y="66" width="79.7828" height="22" rx="4" opacity=".7"/><text class="sT" x="385.783" y="82">25/s · 11.2 hours</text>
<text class="sS" x="290" y="114" text-anchor="end">scrypt N=2¹⁵, r=8 (Python)</text><rect class="sG" x="300" y="98" width="55.658" height="22" rx="4" opacity=".7"/><text class="sT" x="361.658" y="114">9/s · 1.2 days</text>
<text class="sS" x="14" y="178">what Identity stores (61 bytes, Base64): decoded from a real PasswordHasher output</text>
<rect class="sB" x="14" y="188" width="60" height="26" rx="4" opacity=".6"/><text class="sS" x="20" y="206" xml:space="preserve" style="white-space:pre">01</text><text class="sS" x="44" y="230" text-anchor="middle">format v3</text>
<rect class="sB" x="78" y="188" width="114" height="26" rx="4" opacity=".6"/><text class="sS" x="84" y="206" xml:space="preserve" style="white-space:pre">00000002</text><text class="sS" x="135" y="230" text-anchor="middle">PRF: HMAC-SHA512</text>
<rect class="sB" x="196" y="188" width="114" height="26" rx="4" opacity=".6"/><text class="sS" x="202" y="206" xml:space="preserve" style="white-space:pre">000186a0</text><text class="sS" x="253" y="230" text-anchor="middle">100,000 iterations</text>
<rect class="sB" x="314" y="188" width="114" height="26" rx="4" opacity=".6"/><text class="sS" x="320" y="206" xml:space="preserve" style="white-space:pre">00000010</text><text class="sS" x="371" y="230" text-anchor="middle">salt length 16</text>
<rect class="sV" x="432" y="188" width="76" height="26" rx="4" opacity=".6"/><text class="sS" x="438" y="206" xml:space="preserve" style="white-space:pre">salt</text><text class="sS" x="470" y="230" text-anchor="middle">16 random bytes</text>
<rect class="sV" x="512" y="188" width="156" height="26" rx="4" opacity=".6"/><text class="sS" x="518" y="206" xml:space="preserve" style="white-space:pre">subkey</text><text class="sS" x="590" y="230" text-anchor="middle">32-byte derived key</text>
</svg><figcaption>Why "slow on purpose" matters, measured on this machine (GPUs multiply the SHA-256 figure by thousands). The salt makes that cost apply per account.</figcaption></figure>

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

<figure class="dia steps"><svg viewBox="0 0 720 266" role="img" aria-label="Authorization code flow with PKCE: the app sends a code challenge, the user signs in, the app exchanges the code plus the verifier for tokens, then calls the API with the access token">
<text class="sT" x="70" y="22" text-anchor="middle">Browser</text><line class="sD" x1="70" y1="32" x2="70" y2="256"/>
<text class="sT" x="270" y="22" text-anchor="middle">App / BFF</text><line class="sD" x1="270" y1="32" x2="270" y2="256"/>
<text class="sT" x="480" y="22" text-anchor="middle">Auth server</text><line class="sD" x1="480" y1="32" x2="480" y2="256"/>
<text class="sT" x="660" y="22" text-anchor="middle">Your API</text><line class="sD" x1="660" y1="32" x2="660" y2="256"/>
<g data-s="1"><rect class="sV" x="190" y="40" width="160" height="24" rx="6"/><text class="sC" x="270" y="56" text-anchor="middle">make verifier + hash</text><line class="sL" x1="270" y1="70" x2="476" y2="78" marker-end="url(#ah)"/><text class="sM" x="373" y="70" text-anchor="middle">redirect + code_challenge</text></g>
<g data-s="2"><line class="sLm" x1="70" y1="96" x2="476" y2="104" marker-end="url(#ahm)"/><text class="sC" x="270" y="92" text-anchor="middle">user signs in (password, passkey, MFA)</text><line class="sLg" x1="476" y1="116" x2="274" y2="124" marker-end="url(#ahg)"/><text class="sGt" x="373" y="136" text-anchor="middle">redirect back with a one-time code</text></g>
<g data-s="3"><line class="sL" x1="270" y1="152" x2="476" y2="160" marker-end="url(#ah)"/><text class="sM" x="373" y="150" text-anchor="middle">code + code_verifier</text></g>
<g data-s="4"><rect class="sG" x="400" y="166" width="160" height="24" rx="6"/><text class="sC" x="480" y="182" text-anchor="middle">hash(verifier) matches ✓</text><line class="sLg" x1="476" y1="196" x2="274" y2="204" marker-end="url(#ahg)"/><text class="sGt" x="373" y="216" text-anchor="middle">access + ID + refresh tokens</text></g>
<g data-s="5"><line class="sL" x1="270" y1="236" x2="656" y2="244" marker-end="url(#ah)"/><text class="sM" x="560" y="234" text-anchor="middle">Bearer &lt;access token&gt;</text></g>
</svg><ol class="dia-steps">
<li>The app generates a random <b>code verifier</b>, keeps it, and redirects to the authorisation server with only its hash, the <b>code challenge</b>.</li>
<li>The user signs in at the authorisation server, never at your app. The server redirects back with a short-lived authorisation code.</li>
<li>The app exchanges the code for tokens, presenting the original verifier.</li>
<li>The server hashes the verifier and checks it against the challenge from step 1. A stolen code is useless without the verifier, so public clients need no secret.</li>
<li>The app (or, with a BFF, your server) calls the API with the access token. With a BFF, steps 3–5 happen server-side and the browser holds only a session cookie.</li>
</ol><figcaption>Authorisation code with PKCE, the recommended flow for any app with a user.</figcaption></figure>

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

<figure class="dia"><svg viewBox="0 0 720 194" role="img" aria-label="Authorisation path: unauthenticated requests get 401, failed policies 403, failed resource checks 404 or 403, and only then does the handler run">
<rect class="sB" x="8" y="40" width="130" height="52" rx="8"/><text class="sT" x="73" y="64" text-anchor="middle">request</text><text class="sC" x="73" y="80" text-anchor="middle">GET /invoices/1043</text>
<line class="sLg" x1="138" y1="66" x2="150" y2="66" marker-end="url(#ahg)"/>
<rect class="sW" x="152" y="40" width="130" height="52" rx="8"/><text class="sT" x="217" y="64" text-anchor="middle">authenticated?</text><text class="sS" x="217" y="80" text-anchor="middle">valid token / cookie</text>
<line class="sLg" x1="282" y1="66" x2="294" y2="66" marker-end="url(#ahg)"/>
<rect class="sW" x="296" y="40" width="130" height="52" rx="8"/><text class="sT" x="361" y="64" text-anchor="middle">policy?</text><text class="sC" x="361" y="80" text-anchor="middle">role, claims, MFA</text>
<line class="sLg" x1="426" y1="66" x2="438" y2="66" marker-end="url(#ahg)"/>
<rect class="sW" x="440" y="40" width="130" height="52" rx="8"/><text class="sT" x="505" y="64" text-anchor="middle">this resource?</text><text class="sC" x="505" y="80" text-anchor="middle">same tenant, status</text>
<line class="sLg" x1="570" y1="66" x2="582" y2="66" marker-end="url(#ahg)"/>
<rect class="sG" x="584" y="40" width="130" height="52" rx="8"/><text class="sT" x="649" y="64" text-anchor="middle">handler runs</text><text class="sC" x="649" y="80" text-anchor="middle">200</text>
<line class="sLr" x1="217" y1="92" x2="217" y2="122" marker-end="url(#ahr)"/><rect class="sR" x="155" y="126" width="124" height="26" rx="6" opacity=".85"/><text class="sC" x="217" y="144" text-anchor="middle">401 Unauthorized</text>
<line class="sLr" x1="361" y1="92" x2="361" y2="122" marker-end="url(#ahr)"/><rect class="sR" x="299" y="126" width="124" height="26" rx="6" opacity=".85"/><text class="sC" x="361" y="144" text-anchor="middle">403 Forbidden</text>
<line class="sLr" x1="505" y1="92" x2="505" y2="122" marker-end="url(#ahr)"/><rect class="sR" x="443" y="126" width="124" height="26" rx="6" opacity=".85"/><text class="sC" x="505" y="144" text-anchor="middle">404 or 403</text>
<text class="sS" x="360" y="182" text-anchor="middle">roles and policies answer "this kind of user"; the resource check answers "this user, this record"</text>
</svg><figcaption>Three gates, three failure codes. Returning 404 for another tenant's record avoids confirming that it exists.</figcaption></figure>

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
