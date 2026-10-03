# Ship It — Deploying and Operating a Full-Stack App

"Is it deployed? Can I see it?" Your gaps file names **no live links** as the non-keyword gap that costs you the most interviews. Reviewers check before they call. This module is about getting a full-stack app online properly and keeping it healthy: choosing a hosting shape, a pipeline that deploys the UI, the API and the database together, domains and TLS, a go-live checklist, and how to run a **portfolio demo** safely and cheaply.

> [!focus]
> **Entry must:** deploy a full-stack app you built and explain each piece; describe your pipeline; know where configuration and secrets live; set up HTTPS and a custom domain.
> **Mid adds:** choose between a single VM, PaaS and containers with reasons; deploy without secrets in CI (OIDC federation); run migrations safely in the pipeline; backups and restores; a go-live checklist; demo hardening and cost limits.
> **Most asked:** *How did you deploy your project?* · *What would you change for production?* · *How do database migrations get applied?* · *How do you roll back?* · *How much does it cost to run?*
> **Time budget:** 2 hours to read; a weekend to deploy one project.

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

> [!term] OIDC federation for CI (workload identity federation)
> Instead of storing a cloud password or service-principal secret in GitHub, the cloud trusts **GitHub's identity tokens** for a specific repository, branch or environment. The workflow exchanges its short-lived token for cloud access at run time, so there's **no long-lived secret to leak**.

**Order matters:** database migrations must be **backward compatible** with the running API ([[S10.3]], expand and contract), so you can apply them before switching traffic and still roll the API back. Deploy the **API before the SPA** when the SPA depends on new endpoints; keep old endpoints until the old SPA bundle is gone (cached clients exist).

**Rollback:** API by shifting traffic back to the previous revision or image tag; SPA by redeploying the previous build (keep artifacts); database by **rolling forward** with a fix, since down-migrations on live data are risky.

## FS4.5 Data in production 🟡

- **Backups and restore drills:** know your **RPO** (how much data you can afford to lose) and **RTO** (how long you can afford to be down), and practise a restore into a separate database.
- **Never use production data for development or demos.** If realistic data is needed, use **seeded fake data** (Bogus) or anonymised copies.
- **Seed data for demos:** a script that creates a demo company with a year of transactions, invoices in every state and a forecast, re-runnable to reset the demo.
- **Migrations** run from the pipeline with a dedicated, limited-permission identity, not the app's runtime identity.

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
