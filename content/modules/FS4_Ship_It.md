# Ship It — Deploying and Operating a Full-Stack App

"Is it deployed? Can I see it?" Your gaps file names **no live links** as the non-keyword gap that costs you the most interviews. Reviewers check before they call. This module is about getting a full-stack app online properly and keeping it healthy: choosing a hosting shape, a pipeline that deploys the UI, the API and the database together, domains and TLS, a go-live checklist, and how to run a **portfolio demo** safely and cheaply.

> [!focus]
> **Entry must:** deploy a full-stack app you built and explain each piece; describe your pipeline; know where configuration and secrets live; set up HTTPS and a custom domain.
> **Mid adds:** choose between a single VM, PaaS and containers with reasons; deploy without secrets in CI (OIDC federation); run migrations safely in the pipeline; backups and restores; a go-live checklist; demo hardening and cost limits.
> **Most asked:** *How did you deploy your project?* · *What would you change for production?* · *How do database migrations get applied?* · *How do you roll back?* · *How much does it cost to run?*
> **Time budget:** 2 hours to read; a weekend to deploy one project.

## FS4.0 Foundations: from a repository to a URL 🟢

"Deploying" means three things happen, whatever the platform:

1. **Build an artifact:** a versioned, runnable package made from one commit. Here that's a **container image** for the API and a folder of **static files** for the SPA. The same artifact moves through every environment ([[S10.1]]).
2. **Run it** on a machine or platform, with the configuration and secrets for that environment.
3. **Route traffic to it:** a domain name resolves to an IP address ([[S1.2]]), the connection is encrypted with TLS, and a reverse proxy or load balancer hands each request to a running copy.

<figure class="dia anim"><svg viewBox="0 0 720 252" role="img" aria-label="Animation: the browser resolves the domain name through DNS, connects through the firewall on port 443, Caddy terminates TLS and routes / to the web container and /api to the API container">
<rect class="sB" x="14" y="100" width="110" height="56" rx="8"/><text class="sT" x="69" y="126" text-anchor="middle">browser</text><text class="sC" x="69" y="142" text-anchor="middle">types the URL</text>
<rect class="sV" x="150" y="14" width="150" height="50" rx="8"/><text class="sT" x="225" y="37" text-anchor="middle">DNS</text><text class="sC" x="225" y="53" text-anchor="middle">name → 20.1.2.3</text>
<line class="sLm" x1="90" y1="100" x2="176" y2="66" marker-end="url(#ahm)"/><line class="sLm" x1="196" y1="66" x2="110" y2="100" marker-end="url(#ahm)"/><text class="sC" x="160" y="92">1 lookup</text>
<rect class="sR" x="170" y="108" width="120" height="40" rx="8"/><text class="sT" x="230" y="126" text-anchor="middle">firewall</text><text class="sC" x="230" y="142" text-anchor="middle">443 open</text>
<rect class="sW" x="330" y="100" width="150" height="56" rx="8"/><text class="sT" x="405" y="126" text-anchor="middle">Caddy</text><text class="sC" x="405" y="142" text-anchor="middle">TLS · reverse proxy</text>
<rect class="sA" x="540" y="40" width="166" height="50" rx="8"/><text class="sT" x="623" y="63" text-anchor="middle">web container</text><text class="sC" x="623" y="79" text-anchor="middle">SPA files</text><rect class="sG" x="540" y="166" width="166" height="50" rx="8"/><text class="sT" x="623" y="189" text-anchor="middle">api container</text><text class="sC" x="623" y="205" text-anchor="middle">ASP.NET Core</text>
<line class="sL" x1="124" y1="128" x2="168" y2="128" marker-end="url(#ah)"/><line class="sL" x1="290" y1="128" x2="328" y2="128" marker-end="url(#ah)"/>
<line class="sL" x1="480" y1="118" x2="536" y2="70" marker-end="url(#ah)"/><line class="sL" x1="480" y1="140" x2="536" y2="186" marker-end="url(#ah)"/><text class="sC" x="508" y="98">/</text><text class="sC" x="514" y="170">/api</text>
<text class="sC" x="230" y="182" text-anchor="middle">2 TCP + TLS handshake</text><text class="sC" x="405" y="182" text-anchor="middle">3 route by path</text>
<circle class="sPv" r="5"><animateMotion dur="4s" repeatCount="indefinite" path="M90 100 L190 64 L110 100"/></circle>
<circle class="sP" r="5"><animateMotion dur="4s" begin="1.6s" repeatCount="indefinite" path="M124 128 H480 L540 186"/></circle>
<text class="sS" x="360" y="240" text-anchor="middle">a domain name, an open port, a certificate, and a proxy that knows where each path goes</text>
</svg><figcaption>Everything between a typed address and your code. Each box is something you either configure or pay a platform to configure.</figcaption></figure>

Hosting options differ mainly in **how much of that stack you look after yourself**:

<figure class="dia"><svg viewBox="0 0 720 250" role="img" aria-label="Responsibility by hosting choice: on a VM you manage the OS, runtime, TLS and scaling; on a PaaS the provider manages everything below your code; managed Kubernetes splits the middle layers">
<text class="sM" x="300" y="28" text-anchor="middle">one VM + Compose</text>
<text class="sM" x="460" y="28" text-anchor="middle">PaaS / Container Apps</text>
<text class="sM" x="620" y="28" text-anchor="middle">managed Kubernetes</text>
<text class="sC" x="212" y="61" text-anchor="end">your code + configuration</text>
<rect class="sW" x="224" y="40" width="152" height="30" rx="5"/><text class="sC" x="300" y="60" text-anchor="middle">you</text>
<rect class="sW" x="384" y="40" width="152" height="30" rx="5"/><text class="sC" x="460" y="60" text-anchor="middle">you</text>
<rect class="sW" x="544" y="40" width="152" height="30" rx="5"/><text class="sC" x="620" y="60" text-anchor="middle">you</text>
<text class="sC" x="212" y="97" text-anchor="end">TLS, scaling, load balancing</text>
<rect class="sW" x="224" y="76" width="152" height="30" rx="5"/><text class="sC" x="300" y="96" text-anchor="middle">you (Caddy)</text>
<rect class="sB" x="384" y="76" width="152" height="30" rx="5"/><text class="sC" x="460" y="96" text-anchor="middle">provider</text>
<rect class="sV" x="544" y="76" width="152" height="30" rx="5"/><text class="sC" x="620" y="96" text-anchor="middle">you configure it</text>
<text class="sC" x="212" y="133" text-anchor="end">container runtime</text>
<rect class="sW" x="224" y="112" width="152" height="30" rx="5"/><text class="sC" x="300" y="132" text-anchor="middle">you</text>
<rect class="sB" x="384" y="112" width="152" height="30" rx="5"/><text class="sC" x="460" y="132" text-anchor="middle">provider</text>
<rect class="sV" x="544" y="112" width="152" height="30" rx="5"/><text class="sC" x="620" y="132" text-anchor="middle">shared</text>
<text class="sC" x="212" y="169" text-anchor="end">operating system, patches</text>
<rect class="sW" x="224" y="148" width="152" height="30" rx="5"/><text class="sC" x="300" y="168" text-anchor="middle">you</text>
<rect class="sB" x="384" y="148" width="152" height="30" rx="5"/><text class="sC" x="460" y="168" text-anchor="middle">provider</text>
<rect class="sV" x="544" y="148" width="152" height="30" rx="5"/><text class="sC" x="620" y="168" text-anchor="middle">shared</text>
<text class="sC" x="212" y="205" text-anchor="end">hardware, network</text>
<rect class="sB" x="224" y="184" width="152" height="30" rx="5"/><text class="sC" x="300" y="204" text-anchor="middle">provider</text>
<rect class="sB" x="384" y="184" width="152" height="30" rx="5"/><text class="sC" x="460" y="204" text-anchor="middle">provider</text>
<rect class="sB" x="544" y="184" width="152" height="30" rx="5"/><text class="sC" x="620" y="204" text-anchor="middle">provider</text>
<text class="sS" x="450" y="238" text-anchor="middle">more managed = less to patch and page on, more cost and less control</text>
</svg><figcaption>The hosting decision is mostly a decision about which of these rows you want to own.</figcaption></figure>

## FS4.1 Three hosting shapes 🟢 ⭐

| | **One VM + Docker Compose** | **PaaS / managed containers** | **Kubernetes** |
|---|---|---|---|
| Example | Azure or any VPS: Caddy + nginx + API + DB containers (**FinSight**) | Azure Static Web Apps (SPA) + Container Apps or App Service (API) + Azure SQL; or Fly.io (**CS Visualizer**), Render, Railway | AKS, EKS, GKE |
| You manage | OS patches, Docker, backups, TLS (Caddy automates it), monitoring | Your app and configuration | The cluster (or much of it) plus manifests |
| Scaling | Vertical, manual | Automatic, including scale to zero | Automatic, fine-grained |
| Cost for a small app | Predictable, low | Low to free at small scale; grows with use | Highest baseline |
| Fits | Demos, small internal apps, learning | Most small and medium production apps | Many services, platform teams |

> [!say]
> "FinSight runs on one Azure Ubuntu VM with Docker Compose: Caddy for automatic HTTPS, nginx serving the Angular build and proxying the API, SQL Server and the LangFlow containers, with health-gated start-up and a runbook. It's cheap and fully under our control, but we patch and back it up ourselves and it doesn't scale out. For production I'd move the API to Container Apps, the database to Azure SQL with point-in-time restore, and the Angular build to Static Web Apps or a CDN."

## FS4.2 The single-VM setup, done properly 🟢 🟡

What makes a VM deployment defensible in an interview:

- **Access:** SSH with keys only (password login disabled), a non-root sudo user; the network security group or firewall allows only **22 (ideally restricted to your IP), 80 and 443**.
- **TLS:** **Caddy** obtains and renews Let's Encrypt certificates automatically; HTTP redirects to HTTPS; HSTS.
- **Containers:** pinned image tags, non-root users, `restart: unless-stopped`, health checks, resource limits, and secrets in an `.env` file readable only by the deploy user (or better, fetched from Key Vault at start-up).
- **Updates:** unattended security upgrades for the OS; a documented process to pull new images and restart (`docker compose pull && docker compose up -d`).
- **Backups:** scheduled database backups copied **off the machine** (to Blob Storage), and a **tested restore**. A backup you've never restored is a hope, not a backup.
- **Monitoring:** an external uptime check (one ping every minute or so; free tiers exist), container logs shipped somewhere, disk-space alerts.
- **A runbook:** how to deploy, roll back, restore, rotate secrets, and what to do when the site is down.

<figure class="dia"><svg viewBox="0 0 720 276" role="img" aria-label="A single VM deployment: only ports 22 (restricted), 80 and 443 are open; Caddy terminates TLS and routes to the web and API containers; SQL Server data is backed up nightly to Blob Storage">
<rect class="sB" x="14" y="84" width="90" height="56" rx="8"/><text class="sT" x="59" y="117" text-anchor="middle">internet</text>
<rect class="sN" x="124" y="16" width="582" height="190" rx="12"/><text class="sT" x="415" y="36" text-anchor="middle">one Azure VM (Ubuntu) running Docker Compose</text>
<rect class="sW" x="134" y="50" width="112" height="30" rx="5"/><text class="sC" x="190" y="70" text-anchor="middle">22 · your IP only</text>
<rect class="sB" x="134" y="90" width="112" height="30" rx="5"/><text class="sC" x="190" y="110" text-anchor="middle">80 → 443</text>
<rect class="sG" x="134" y="130" width="112" height="30" rx="5"/><text class="sC" x="190" y="150" text-anchor="middle">443 HTTPS</text>
<line class="sL" x1="104" y1="112" x2="132" y2="112" marker-end="url(#ah)"/>
<text class="sRt" x="190" y="182" text-anchor="middle">all other ports closed</text>
<rect class="sW" x="276" y="84" width="120" height="56" rx="8"/><text class="sT" x="336" y="110" text-anchor="middle">Caddy</text><text class="sC" x="336" y="126" text-anchor="middle">Let's Encrypt</text><line class="sL" x1="246" y1="145" x2="274" y2="125" marker-end="url(#ah)"/>
<rect class="sA" x="436" y="50" width="120" height="50" rx="8"/><text class="sT" x="496" y="73" text-anchor="middle">web</text><text class="sC" x="496" y="89" text-anchor="middle">nginx + SPA</text><rect class="sG" x="436" y="124" width="120" height="50" rx="8"/><text class="sT" x="496" y="147" text-anchor="middle">api</text><text class="sC" x="496" y="163" text-anchor="middle">ASP.NET Core</text><rect class="sB" x="586" y="124" width="110" height="50" rx="8"/><text class="sT" x="641" y="147" text-anchor="middle">SQL Server</text><text class="sC" x="641" y="163" text-anchor="middle">data volume</text>
<line class="sL" x1="396" y1="104" x2="434" y2="78" marker-end="url(#ah)"/><line class="sL" x1="396" y1="120" x2="434" y2="146" marker-end="url(#ah)"/><line class="sL" x1="556" y1="149" x2="584" y2="149" marker-end="url(#ah)"/>
<text class="sC" x="415" y="198" text-anchor="middle">pinned tags · non-root · health checks · secrets readable by the deploy user only</text>
<line class="sLg" x1="641" y1="174" x2="641" y2="226" marker-end="url(#ahg)"/><rect class="sG" x="500" y="228" width="206" height="40" rx="8"/><text class="sT" x="603" y="246" text-anchor="middle">Blob Storage</text><text class="sC" x="603" y="262" text-anchor="middle">nightly backup, off the machine</text>
<text class="sRt" x="14" y="248">a backup you have never restored is a hope, not a backup</text>
</svg><figcaption>FinSight's shape. Simple, cheap and perfectly defensible, if the boring parts (ports, patches, backups) are done.</figcaption></figure>

```text
# Caddyfile: the entire TLS + routing config for a same-origin deployment
finsight.example.com {
    encode zstd gzip
    header Strict-Transport-Security "max-age=31536000; includeSubDomains"
    handle /api/*  { reverse_proxy api:8080 }
    handle /hubs/* { reverse_proxy api:8080 }
    handle         { reverse_proxy web:80 }
}
```

> [!story]
> You wrote FinSight's **runbook and VM-setup documents**. That's operations maturity many developers lack. In an interview, mention two specifics, for example how a deploy is rolled back and how the database is backed up, and you'll be remembered.

## FS4.3 The managed path on Azure 🟡

| Piece | Service | Notes |
|---|---|---|
| Angular/React build | **Azure Static Web Apps** (or Blob Storage + Front Door) | Global CDN, free TLS, preview environments per pull request |
| API | **Azure Container Apps** (or App Service for containers) | HTTPS, revisions for blue-green and canary ([[S10.3]]), autoscale including to zero |
| Database | **Azure SQL Database** or **Azure Database for PostgreSQL – Flexible Server** | Automated backups with **point-in-time restore** |
| Cache, queue | Azure Managed Redis, Service Bus | When you need them ([[B8]]) |
| Secrets | **Key Vault** via **managed identity** | No secrets in configuration ([[S10.6]]) |
| Telemetry | Application Insights (OpenTelemetry) | Alerts on errors and latency ([[B11]]) |
| Files | Blob Storage | Pre-signed uploads ([[FS3.1]]) |

Free or very cheap tiers exist for several of these at demo scale, but they change often, so check current pricing pages and set a **budget alert** before deploying anything.

## FS4.4 A full-stack pipeline 🟡 ⭐

```yaml
# .github/workflows/deploy.yml (outline)
on: { push: { branches: [main] } }
permissions: { id-token: write, contents: read }       # OIDC: no stored Azure secrets
jobs:
  build-test:
    steps:
      - api: restore, build (-warnaserror), unit tests, integration tests (Testcontainers)
      - web: npm ci, lint, unit/component tests, build
      - contract: regenerate the API client from OpenAPI → fail if it differs from the committed one
      - image: build and push the API image tagged with the commit SHA
  deploy-staging:
    needs: build-test
    steps:
      - azure/login (OIDC federated credential)
      - migrations: run the idempotent EF script / migration bundle against staging
      - api: deploy the new image as a new Container Apps revision
      - web: deploy the static build
      - smoke: Playwright smoke tests against staging (login → dashboard)
  deploy-prod:
    needs: deploy-staging
    environment: production                              # requires manual approval
    steps: [same as staging, then shift traffic to the new revision; keep the old one for rollback]
```

<figure class="dia steps"><svg viewBox="0 0 720 248" role="img" aria-label="Full-stack pipeline: build and test, push an image tagged with the commit, deploy to staging with migrations and smoke tests, a manual approval gate, deploy to production by shifting traffic, and roll back by shifting it back">
<g data-s="1"><rect class="sB" x="14" y="40" width="150" height="120" rx="10"/><text class="sT" x="89" y="60" text-anchor="middle">build + test</text><text class="sC" x="89" y="84" text-anchor="middle">api: build, tests</text><text class="sC" x="89" y="104" text-anchor="middle">web: lint, tests</text><text class="sC" x="89" y="124" text-anchor="middle">contract: drift check</text><text class="sC" x="89" y="144" text-anchor="middle">Testcontainers</text></g>
<g data-s="2"><line class="sLm" x1="164" y1="100" x2="182" y2="100" marker-end="url(#ahm)"/><rect class="sV" x="184" y="74" width="104" height="52" rx="8"/><text class="sT" x="236" y="98" text-anchor="middle">image</text><text class="sC" x="236" y="114" text-anchor="middle">api:3f9c2e1</text></g>
<g data-s="3"><line class="sLm" x1="288" y1="100" x2="306" y2="100" marker-end="url(#ahm)"/><rect class="sA" x="308" y="40" width="166" height="120" rx="10"/><text class="sT" x="391" y="60" text-anchor="middle">staging</text><text class="sC" x="391" y="84" text-anchor="middle">migrate (idempotent)</text><text class="sC" x="391" y="104" text-anchor="middle">new API revision</text><text class="sC" x="391" y="124" text-anchor="middle">deploy SPA build</text><text class="sC" x="391" y="144" text-anchor="middle">Playwright smoke</text></g>
<g data-s="4"><line class="sLm" x1="474" y1="100" x2="490" y2="100" marker-end="url(#ahm)"/><rect class="sW" x="492" y="74" width="62" height="52" rx="8"/><text class="sT" x="523" y="98" text-anchor="middle">gate</text><text class="sC" x="523" y="114" text-anchor="middle">approve</text></g>
<g data-s="5"><line class="sLm" x1="554" y1="100" x2="570" y2="100" marker-end="url(#ahm)"/><rect class="sG" x="572" y="40" width="134" height="120" rx="10"/><text class="sT" x="639" y="60" text-anchor="middle">production</text><text class="sC" x="639" y="84" text-anchor="middle">migrate</text><text class="sC" x="639" y="104" text-anchor="middle">new revision</text><text class="sC" x="639" y="124" text-anchor="middle">shift traffic</text><text class="sC" x="639" y="144" text-anchor="middle">old one kept</text></g>
<g data-s="6"><path class="sLr" d="M639 160 V196 H360" fill="none" stroke-dasharray="5 4" marker-end="url(#ahr)"/><text class="sRt" x="352" y="200" text-anchor="end">rollback: send traffic back to the previous revision</text></g>
<text class="sS" x="360" y="236" text-anchor="middle">one image, built once from one commit, promoted through every environment</text>
</svg><ol class="dia-steps">
<li>Every push builds and tests both halves, and regenerates the API client to catch contract drift before merge.</li>
<li>The API image is tagged with the commit SHA, so you always know exactly what is running.</li>
<li>Staging gets the same image: idempotent migrations first, then a new API revision, the SPA build, and Playwright smoke tests (log in, open the dashboard).</li>
<li>A person approves the production deployment. GitHub environments enforce this.</li>
<li>Production repeats staging's steps, then shifts traffic to the new revision (all at once, or 10% first). The previous revision keeps running.</li>
<li>If metrics go red, rollback is a traffic shift back: seconds, with no rebuild. The database rolls <b>forward</b> with a fix instead.</li>
</ol><figcaption>A pipeline is the runbook, automated. Each stage either proves something or limits the blast radius of what it can't prove.</figcaption></figure>

> [!term] OIDC federation for CI (workload identity federation)
> Instead of storing a cloud password or service-principal secret in GitHub, the cloud trusts **GitHub's identity tokens** for a specific repository, branch or environment. The workflow exchanges its short-lived token for cloud access at run time, so there's **no long-lived secret to leak**.

**Order matters:** database migrations must be **backward compatible** with the running API ([[S10.3]], expand and contract), so you can apply them before switching traffic and still roll the API back. Deploy the **API before the SPA** when the SPA depends on new endpoints; keep old endpoints until the old SPA bundle is gone (cached clients exist).

<figure class="dia steps"><svg viewBox="0 0 720 244" role="img" aria-label="Deploy order: expand the database first while the old API still works, deploy the API keeping old endpoints for cached SPAs, deploy the SPA, and only later remove the old column and endpoints">
<text class="sT" x="230" y="26" text-anchor="middle">database</text>
<text class="sT" x="400" y="26" text-anchor="middle">API</text>
<text class="sT" x="570" y="26" text-anchor="middle">SPA</text>
<g data-s="1"><text class="sM" x="150" y="59" text-anchor="end">before</text><rect class="sB" x="154" y="38" width="152" height="32" rx="6"/><text class="sC" x="230" y="59" text-anchor="middle">schema v1</text><rect class="sB" x="324" y="38" width="152" height="32" rx="6"/><text class="sC" x="400" y="59" text-anchor="middle">v1</text><rect class="sB" x="494" y="38" width="152" height="32" rx="6"/><text class="sC" x="570" y="59" text-anchor="middle">v1</text></g>
<g data-s="2"><text class="sM" x="150" y="99" text-anchor="end">1 migrate (expand)</text><rect class="sG" x="154" y="78" width="152" height="32" rx="6"/><text class="sC" x="230" y="99" text-anchor="middle">v2: column added</text><rect class="sB" x="324" y="78" width="152" height="32" rx="6"/><text class="sC" x="400" y="99" text-anchor="middle">v1 still works ✓</text><rect class="sB" x="494" y="78" width="152" height="32" rx="6"/><text class="sC" x="570" y="99" text-anchor="middle">v1</text></g>
<g data-s="3"><text class="sM" x="150" y="139" text-anchor="end">2 deploy API</text><rect class="sB" x="154" y="118" width="152" height="32" rx="6"/><text class="sC" x="230" y="139" text-anchor="middle">v2</text><rect class="sG" x="324" y="118" width="152" height="32" rx="6"/><text class="sC" x="400" y="139" text-anchor="middle">v2 + old endpoints</text><rect class="sB" x="494" y="118" width="152" height="32" rx="6"/><text class="sC" x="570" y="139" text-anchor="middle">v1 cached ✓</text></g>
<g data-s="4"><text class="sM" x="150" y="179" text-anchor="end">3 deploy SPA</text><rect class="sB" x="154" y="158" width="152" height="32" rx="6"/><text class="sC" x="230" y="179" text-anchor="middle">v2</text><rect class="sB" x="324" y="158" width="152" height="32" rx="6"/><text class="sC" x="400" y="179" text-anchor="middle">v2</text><rect class="sG" x="494" y="158" width="152" height="32" rx="6"/><text class="sC" x="570" y="179" text-anchor="middle">v2</text></g>
<g data-s="5"><text class="sM" x="150" y="219" text-anchor="end">4 later: contract</text><rect class="sW" x="154" y="198" width="152" height="32" rx="6"/><text class="sC" x="230" y="219" text-anchor="middle">v3: old column gone</text><rect class="sW" x="324" y="198" width="152" height="32" rx="6"/><text class="sC" x="400" y="219" text-anchor="middle">old endpoints gone</text><rect class="sB" x="494" y="198" width="152" height="32" rx="6"/><text class="sC" x="570" y="219" text-anchor="middle">v2</text></g>
</svg><ol class="dia-steps">
<li>Everything on version 1.</li>
<li>Migrate first, additively: a new nullable column or table. The running v1 API ignores it, so nothing breaks and the API can still be rolled back.</li>
<li>Deploy the API. It uses the new column and still serves the old endpoints, because browsers holding the old SPA bundle are still out there.</li>
<li>Deploy the SPA. New page loads get v2.</li>
<li>Days later, once nothing uses them, remove the old endpoints and drop the old column: the "contract" half of expand-and-contract.</li>
</ol><figcaption>Each step must work with the previous version of its neighbours. That's what makes every step individually reversible.</figcaption></figure>

**Rollback:** API by shifting traffic back to the previous revision or image tag; SPA by redeploying the previous build (keep artifacts); database by **rolling forward** with a fix, since down-migrations on live data are risky.

## FS4.5 Data in production 🟡

- **Backups and restore drills:** know your **RPO** (how much data you can afford to lose) and **RTO** (how long you can afford to be down), and practise a restore into a separate database.
- **Never use production data for development or demos.** If realistic data is needed, use **seeded fake data** (Bogus) or anonymised copies.
- **Seed data for demos:** a script that creates a demo company with a year of transactions, invoices in every state and a forecast, re-runnable to reset the demo.
- **Migrations** run from the pipeline with a dedicated, limited-permission identity, not the app's runtime identity.

<figure class="dia"><svg viewBox="0 0 720 226" role="img" aria-label="Timeline: a nightly backup at 02:00, the disk is lost at 09:40 and service is restored at 11:10; the recovery point objective is the data lost since the backup and the recovery time objective is the downtime">
<line class="sLm" x1="60" y1="120" x2="670" y2="120" marker-end="url(#ahm)"/>
<line class="sLm" x1="60" y1="116" x2="60" y2="124"/><text class="sC" x="60" y="140" text-anchor="middle">00:00</text>
<line class="sLm" x1="160" y1="116" x2="160" y2="124"/><text class="sC" x="160" y="140" text-anchor="middle">02:00</text>
<line class="sLm" x1="260" y1="116" x2="260" y2="124"/><text class="sC" x="260" y="140" text-anchor="middle">04:00</text>
<line class="sLm" x1="360" y1="116" x2="360" y2="124"/><text class="sC" x="360" y="140" text-anchor="middle">06:00</text>
<line class="sLm" x1="460" y1="116" x2="460" y2="124"/><text class="sC" x="460" y="140" text-anchor="middle">08:00</text>
<line class="sLm" x1="560" y1="116" x2="560" y2="124"/><text class="sC" x="560" y="140" text-anchor="middle">10:00</text>
<line class="sLm" x1="660" y1="116" x2="660" y2="124"/><text class="sC" x="660" y="140" text-anchor="middle">12:00</text>
<circle class="sPg" cx="160" cy="120" r="7"/><text class="sGt" x="160" y="164" text-anchor="middle">last backup</text>
<circle class="sPr" cx="543.3" cy="120" r="7"/><text class="sRt" x="543.333" y="164" text-anchor="middle">disk lost</text>
<circle class="sPg" cx="618.3" cy="120" r="7"/><text class="sGt" x="626.333" y="186" text-anchor="middle">restored</text>
<path class="sLr" d="M160 96 V86 H543.3 V96" fill="none"/><text class="sRt" x="351.667" y="78" text-anchor="middle">RPO: 7 h 40 min of data lost</text>
<path class="sLw" d="M543.3 50 V40 H618.3 V50" fill="none"/><text class="sWt" x="580.833" y="30" text-anchor="middle">RTO: 1 h 30 down</text>
<text class="sS" x="360" y="214" text-anchor="middle">point-in-time restore (managed databases) shrinks the RPO to minutes; a rehearsed runbook shrinks the RTO</text>
</svg><figcaption>RPO measures data you can afford to lose; RTO measures time you can afford to be down. Both should be numbers someone agreed to.</figcaption></figure>

## FS4.6 Domains, DNS and TLS 🟢

- Buy a domain (or use a subdomain of one you own) and point it at your app: an **A record** to a VM's IP, or a **CNAME** to the platform's host name; platforms verify ownership with a TXT record.
- TLS is automatic with Caddy, Static Web Apps, App Service managed certificates, Container Apps managed certificates, and Fly.io.
- Lower the DNS TTL before a migration ([[S1.2]]).
- A custom domain on a demo (`finsight-demo.yourname.dev`) looks far more professional on a CV than `random-words-1234.azurewebsites.net`.

## FS4.7 The go-live checklist 🟢 ⭐

| Area | Check |
|---|---|
| Security | HTTPS only + HSTS; security headers and CSP ([[S9.9]]); CORS exact origins; no secrets in code, images or the SPA bundle; rate limits on auth endpoints; dependencies scanned |
| Auth | Deny-by-default; tenant isolation tested; cookies HttpOnly, Secure, SameSite ([[FS2.9]]) |
| Data | Backups automated and a restore tested; migrations applied by the pipeline; production data never in demos |
| Reliability | Liveness and readiness probes; graceful shutdown; timeouts and retries on outbound calls ([[B11]]) |
| Observability | Structured logs with trace IDs; metrics; alerts on error rate and latency; an uptime check |
| UX | Friendly error pages (404, 500, offline); loading and empty states; works on a phone and in Arabic if needed |
| Performance | Hashed assets cached for a long time; compression; images optimised; Lighthouse checked ([[F9]]) |
| Legal and trust | Privacy page; cookie notice if you use non-essential cookies; terms for a public product |
| Operations | Runbook; on-call contact; budget alerts; documented rollback |

## FS4.8 A portfolio demo that won't embarrass you 🟢 ⭐

A public demo is visited by strangers, bots and recruiters. Make it **safe, cheap and impressive**:

1. **Seeded demo tenant** with realistic data, and a **one-click "log in as demo user"** (no sign-up friction for recruiters).
2. The demo user is **read-mostly**, or its changes are **reset nightly** by a scheduled job.
3. **Rate limits** on everything, especially sign-up, login and any **AI endpoint**; put a **hard monthly budget** on LLM spend, or replace live LLM calls with cached or recorded responses in the demo.
4. **Disable** outbound email and payments in the demo (or use the gateway's test mode with a visible "test mode" banner).
5. A **README** with the live link, a GIF or screenshots, an architecture diagram, how to run it locally (`docker compose up`), and the tech decisions.
6. Show **build status** and **test** badges from CI.
7. Use **scale to zero** or the smallest tier, plus a **budget alert**, so a demo can't surprise you with a bill.

> [!lab] Get one link on your CV this weekend
> Deploy CS Visualizer (it already has a container and a Fly.io setup) or FinSight with a seeded demo tenant. Use a custom subdomain, HTTPS, an uptime check, a budget alert and a nightly reset job. Add the link and a screenshot to the README and to your Full-Stack and Backend CVs. Your gaps file calls this the highest-value non-keyword fix.

## FS4.9 Interview drill 🟢 ⭐

| Question | Strong short answer |
|---|---|
| How did you deploy your project? | Name each piece (proxy and TLS, SPA hosting, API container, database), how the pipeline delivers it, and where config and secrets live. |
| VM vs PaaS? | A VM is cheap and fully controlled but you patch, back up and scale it; PaaS handles those for you and scales automatically, at less control. |
| How do migrations get applied? | From the pipeline, as reviewed idempotent scripts or bundles, backward compatible with the running version, before traffic shifts. |
| How do you roll back? | Shift traffic to the previous API revision or image, redeploy the previous SPA build, and roll the database forward with a fix. |
| How does CI access Azure without a secret? | OIDC workload identity federation: Azure trusts GitHub's short-lived token for that repository and environment. |
| What's in your go-live checklist? | HTTPS and headers, auth and tenant tests, backups with a tested restore, health checks, logs, metrics and alerts, error pages, budget alerts, a runbook. |
| How do you keep a public demo safe and cheap? | A seeded demo tenant reset nightly, rate limits, LLM budgets or cached responses, disabled email and payments, scale-to-zero and budget alerts. |
| What's a tested backup? | One you've actually restored, measuring how long it took and how much data you'd lose. |

## Key takeaways

> [!check]
> - A live, well-documented demo link is worth more than another unfinished project.
> - Know your hosting shape and its trade-offs; move from VM to PaaS when the operating burden outgrows you.
> - Pipelines build once, test both halves, check the contract, migrate compatibly, deploy API then SPA, smoke-test, and keep rollback ready.
> - No secrets in CI (OIDC), in images or in the SPA.
> - Demos need seeded data, nightly resets, rate limits and budget caps.

## Sources

- Microsoft Learn: [Azure Static Web Apps](https://learn.microsoft.com/en-us/azure/static-web-apps/overview), [Azure Container Apps](https://learn.microsoft.com/en-us/azure/container-apps/overview), [Revisions and traffic splitting](https://learn.microsoft.com/en-us/azure/container-apps/revisions), [Use GitHub Actions with OpenID Connect to connect to Azure](https://learn.microsoft.com/en-us/azure/developer/github/connect-from-azure-openid-connect), [Automated backups and point-in-time restore in Azure SQL Database](https://learn.microsoft.com/en-us/azure/azure-sql/database/automated-backups-overview), [Cost management budgets](https://learn.microsoft.com/en-us/azure/cost-management-billing/costs/tutorial-acm-create-budgets).
- GitHub Docs: [Security hardening with OpenID Connect](https://docs.github.com/en/actions/security-for-github-actions/security-hardening-your-deployments/about-security-hardening-with-openid-connect), [Using environments for deployment](https://docs.github.com/en/actions/managing-workflow-runs-and-deployments/managing-deployments/managing-environments-for-deployment).
- [Caddy documentation: automatic HTTPS](https://caddyserver.com/docs/automatic-https) · [Let's Encrypt](https://letsencrypt.org/) · [Fly.io docs](https://fly.io/docs/).
