# Cloud, CI/CD and DevOps — Getting Code to Users Safely

"How does your code get to production?" is now a standard question for backend, full-stack and data-engineering roles, even at entry level. You have more to say than most juniors: CS Visualizer has a real GitHub Actions pipeline that publishes a container image, and FinSight ran in Docker on an Azure VM with a runbook. This module gives you the vocabulary around that: pipelines, deployment strategies, the cloud service map, infrastructure as code, and the shared-responsibility model.

> [!focus]
> **Entry must:** describe a CI/CD pipeline's stages; explain environments and configuration per environment; name the basic cloud service models (IaaS, PaaS, SaaS, serverless); know where secrets go.
> **Mid adds:** blue-green and canary deployments, rollbacks, database migrations during deployments, infrastructure as code, managed identities, the shared-responsibility model, cost awareness.
> **Most asked:** *What's the difference between CI and CD?* · *Walk me through your pipeline* · *How do you deploy without downtime?* · *IaaS vs PaaS?* · *How do you handle secrets in the cloud?* · *How do you run database migrations safely?*
> **Time budget:** 3 hours.

## S10.1 DevOps in one paragraph 🟢

**DevOps** is a way of working in which the people who build software also own how it is built, tested, deployed and run, supported by automation. The goal is to ship small changes **often** and **safely**. The **DORA** research programme measures delivery performance with four key metrics: **deployment frequency**, **lead time for changes**, **change failure rate** and **time to restore service**. Saying those four names marks you as someone who's read beyond tutorials.

> [!term] Environment
> A separate running copy of the system with its own configuration and data: typically **development** (your machine), **test or staging** (production-like, for checks before release) and **production** (real users). The same build artifact should move through them, with only configuration changing.

> [!term] Twelve-factor app
> A set of principles for cloud-friendly services. The ones interviewers quote: store **config in the environment** (not in code), treat backing services (databases, queues) as attached resources, keep processes **stateless**, make dev and prod as similar as possible, and treat logs as event streams.

## S10.2 CI and CD 🟢 ⭐

> [!term] Continuous integration (CI)
> Every change is merged into the main branch frequently, and every push automatically **builds and tests** the code, so integration problems show up within minutes, not at the end of a sprint.

> [!term] Continuous delivery / continuous deployment (CD)
> **Delivery:** every change that passes the pipeline is *ready* to release, and a person presses the button. **Deployment:** every change that passes goes to production automatically.

A typical pipeline:

<figure class="dia"><svg viewBox="0 0 720 120" role="img" aria-label="Pipeline: commit, build, test, scan, package, deploy to staging, checks, deploy to production">
<g class="sT" text-anchor="middle">
<rect class="sB" x="8" y="34" width="78" height="50" rx="8"/><text x="47" y="64">Commit</text>
<rect class="sA" x="96" y="34" width="78" height="50" rx="8"/><text x="135" y="64">Build</text>
<rect class="sA" x="184" y="34" width="78" height="50" rx="8"/><text x="223" y="64">Test</text>
<rect class="sA" x="272" y="34" width="78" height="50" rx="8"/><text x="311" y="57">Lint &amp;</text><text x="311" y="74">scan</text>
<rect class="sA" x="360" y="34" width="78" height="50" rx="8"/><text x="399" y="64">Package</text>
<rect class="sW" x="448" y="34" width="78" height="50" rx="8"/><text x="487" y="57">Deploy</text><text x="487" y="74">staging</text>
<rect class="sW" x="536" y="34" width="78" height="50" rx="8"/><text x="575" y="57">Smoke /</text><text x="575" y="74">approval</text>
<rect class="sG" x="624" y="34" width="88" height="50" rx="8"/><text x="668" y="57">Deploy</text><text x="668" y="74">production</text>
</g>
<text class="sM" x="96" y="105">CI: on every push and pull request</text><text class="sM" x="448" y="105">CD: on merge to main</text>
</svg><figcaption>Build once, then promote the same artifact (a container image, a zip) through each environment.</figcaption></figure>

```yaml
# .github/workflows/ci.yml — .NET API + Angular front end
name: ci
on:
  push: { branches: [main] }
  pull_request:
jobs:
  api:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-dotnet@v4
        with: { dotnet-version: '10.0.x' }
      - run: dotnet restore
      - run: dotnet build --no-restore -c Release -warnaserror
      - run: dotnet test --no-build -c Release --logger trx
  web:
    runs-on: ubuntu-latest
    defaults: { run: { working-directory: web } }
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 24, cache: npm, cache-dependency-path: web/package-lock.json }
      - run: npm ci
      - run: npm run lint
      - run: npm test -- --watch=false
      - run: npm run build
  image:
    if: github.ref == 'refs/heads/main'
    needs: [api, web]
    runs-on: ubuntu-latest
    permissions: { contents: read, packages: write }    # least privilege for the token
    steps:
      - uses: actions/checkout@v4
      - uses: docker/login-action@v3
        with: { registry: ghcr.io, username: '${{ github.actor }}', password: '${{ secrets.GITHUB_TOKEN }}' }
      - uses: docker/build-push-action@v6
        with: { push: true, tags: 'ghcr.io/${{ github.repository }}:${{ github.sha }}' }
```

Points to make about it: it runs on **pull requests** so broken code never reaches `main`; it tags images with the **commit SHA**, so every deployment is traceable to a commit; and the token gets only the permissions it needs.

> [!story]
> CS Visualizer's workflow does all of this: builds with warnings as errors, runs the differential and golden tests as a gate, type-checks and builds the React front end, and publishes a non-root image to GitHub Container Registry. When asked "have you set up CI/CD?", describe it stage by stage, then say what you'd add next: deploying the image automatically to a staging environment.

Azure DevOps Pipelines, GitLab CI and Jenkins follow the same ideas with different syntax. Many Egyptian enterprise teams use Azure DevOps, so recognise its vocabulary: *pipelines, stages, jobs, tasks, service connections, variable groups*.

## S10.3 Deploying without downtime 🟡 ⭐

| Strategy | How | Pros | Cons |
|---|---|---|---|
| **Recreate** | Stop the old version, start the new | Simple | Downtime |
| **Rolling** | Replace instances a few at a time | No downtime, no extra capacity | Old and new run side by side for a while; rollback is another rollout |
| **Blue-green** | Run the new version (green) next to the old (blue), then switch traffic at once | Instant switch and instant rollback | Double the capacity during the switch |
| **Canary** | Send a small share of traffic (say 5%) to the new version, watch the metrics, then increase | Limits the blast radius of a bad release | Needs good monitoring and traffic splitting |
| **Feature flags** | Deploy code dark, then turn features on per user group | Separates *deploy* from *release* | Flags must be cleaned up later |

Azure App Service **deployment slots** are blue-green out of the box: deploy to the staging slot, warm it up, swap.

### Database migrations in a live system 🟡 ⭐

The code can roll back in seconds; the database can't. Use the **expand and contract** (parallel change) pattern, so every version of the code works with the schema in place:

1. **Expand:** add the new column or table, nullable or with a default. The old code ignores it.
2. Deploy code that **writes both** old and new, and reads from the old.
3. **Backfill** existing rows.
4. Deploy code that **reads from the new**.
5. **Contract:** once nothing uses the old column, drop it in a later release.

Never rename or drop a column in the same release as the code that stops using it. In EF Core, generate **idempotent SQL scripts** (`dotnet ef migrations script --idempotent`) or migration bundles, review them, and run them as a pipeline step, rather than calling `Database.Migrate()` at app startup on several instances at once.

> [!say]
> "I separate schema changes from the code that depends on them: first add the new column, deploy code that writes to both, backfill, switch reads, and only drop the old column in a later release. That way every deployment can be rolled back without breaking the database."

## S10.4 Cloud fundamentals 🟢 ⭐

| Model | You manage | Provider manages | Azure examples |
|---|---|---|---|
| **IaaS** | OS, runtime, app, data | Hardware, network, virtualisation | Virtual Machines (FinSight's Ubuntu VM) |
| **PaaS** | App and data | Everything under them, including OS patching and scaling | App Service, Azure SQL Database, Container Apps |
| **Serverless (FaaS)** | Functions and their code | Servers entirely; you pay per execution | Azure Functions |
| **SaaS** | Your data and settings | The whole application | Microsoft 365, Jira |

> [!term] Shared responsibility model
> Security in the cloud is split: the provider secures the cloud itself (data centres, hardware, the hypervisor, its managed services); you secure what you put in it (identities, configuration, network rules, data, your code). The more managed the service, the more the provider takes on, but **identity, data and configuration are always yours**.

> [!term] Region and availability zone
> A **region** is a geographic area with data centres (for example "UAE North" or "West Europe"). **Availability zones** are physically separate data centres within a region; spreading instances across zones survives a single data-centre failure. Choose a region close to your users and compliant with data-residency rules.

**Scaling:** **vertical** (a bigger machine) is simple but has a ceiling and usually means a restart; **horizontal** (more machines behind a load balancer) needs **stateless** app servers, with sessions and caches in Redis or the database ([[B8]]).

### The service map you should recognise

| Need | Azure | AWS | Google Cloud |
|---|---|---|---|
| Run a web app (PaaS) | App Service | Elastic Beanstalk / App Runner | App Engine / Cloud Run |
| Run containers without a cluster | Container Apps | ECS on Fargate / App Runner | Cloud Run |
| Kubernetes | AKS | EKS | GKE |
| Functions | Azure Functions | Lambda | Cloud Run functions |
| Relational database | Azure SQL Database, Azure Database for PostgreSQL | RDS, Aurora | Cloud SQL, AlloyDB |
| NoSQL document database | Cosmos DB | DynamoDB | Firestore |
| Object storage | Blob Storage (ADLS Gen2 for analytics) | S3 | Cloud Storage |
| Cache | Azure Managed Redis | ElastiCache | Memorystore |
| Messaging | Service Bus, Event Grid, Event Hubs | SQS, SNS, EventBridge, Kinesis | Pub/Sub |
| Secrets | Key Vault | Secrets Manager | Secret Manager |
| Identity | Microsoft Entra ID (formerly Azure AD) | IAM, Cognito | IAM, Identity Platform |
| CDN / global entry | Front Door | CloudFront | Cloud CDN |
| Monitoring | Azure Monitor, Application Insights | CloudWatch, X-Ray | Cloud Monitoring, Cloud Trace |
| Infrastructure as code | Bicep, ARM | CloudFormation, CDK | Deployment Manager / Terraform |
| Data platform | Microsoft Fabric, Data Factory, Databricks | Glue, Redshift, EMR | BigQuery, Dataflow, Dataproc |

You don't need all three clouds. Know Azure well, because your stack and much of the Egyptian enterprise market lean that way, and be able to say "the AWS equivalent is…".

## S10.5 Infrastructure as code 🟡

> [!term] Infrastructure as code (IaC)
> Describing cloud resources in files kept in Git, then letting a tool create or update them. It makes environments **reproducible**, reviewable in pull requests, and easy to recreate after a disaster. Tools are **declarative**: you describe the desired end state, and re-running is safe (idempotent).

```bicep
// main.bicep — an App Service plan and a web app for the API
param location string = resourceGroup().location
resource plan 'Microsoft.Web/serverfarms@2023-12-01' = {
  name: 'finsight-plan'
  location: location
  sku: { name: 'B1' }
  kind: 'linux'
  properties: { reserved: true }
}
resource api 'Microsoft.Web/sites@2023-12-01' = {
  name: 'finsight-api'
  location: location
  identity: { type: 'SystemAssigned' }          // managed identity: no stored secrets
  properties: {
    serverFarmId: plan.id
    httpsOnly: true
    siteConfig: { linuxFxVersion: 'DOTNETCORE|10.0', minTlsVersion: '1.2' }
  }
}
```

**Terraform** (HashiCorp) is the popular multi-cloud alternative. It keeps a **state file** recording what it created, which must be stored remotely and locked when a team shares it. **Drift** is when someone changes resources by hand in the portal, so the code no longer matches reality.

## S10.6 Configuration, secrets and managed identity 🟢 🟡 ⭐

ASP.NET Core layers configuration: `appsettings.json` → `appsettings.{Environment}.json` → user secrets (development only) → environment variables → command-line arguments → optionally Azure Key Vault or App Configuration. Later sources override earlier ones.

> [!term] Managed identity
> An identity that Azure gives your app automatically (for example, the web app above). The app uses it to get tokens for Key Vault, Azure SQL or Storage **without any password or key in configuration**; Azure rotates the credentials behind the scenes. In code: `new DefaultAzureCredential()`.

```csharp
builder.Configuration.AddAzureKeyVault(
    new Uri("https://finsight-kv.vault.azure.net/"),
    new DefaultAzureCredential());           // managed identity in Azure, your login locally
```

> [!say]
> "Configuration that differs per environment comes from environment variables or App Configuration; secrets live in Key Vault. In Azure, the app reaches Key Vault and the database with a managed identity, so there's no secret to leak or rotate by hand."

## S10.7 Running it: monitoring and on-call basics 🟢

You can't operate what you can't see. At minimum: **health checks** that the platform probes, **structured logs** collected centrally, **metrics** (request rate, error rate, latency percentiles, CPU, memory), **alerts** on symptoms users feel, and **distributed traces** across services. Application Insights or OpenTelemetry with any backend covers this; details are in [[B11]].

A **runbook** says what to do when an alert fires. A **post-mortem** after an incident is **blameless**: what happened, why, and what we change so it can't recur.

## S10.8 Cost is a feature 🟡

Cloud bills surprise teams. Cheap habits: shut down or scale to zero non-production environments at night (Container Apps and Functions scale to zero); right-size instances by looking at actual CPU and memory use; set budgets and alerts; delete orphaned disks, IPs and snapshots; prefer managed services when the hours you'd spend running them cost more than the service. **Egress** (data leaving the cloud) is a common hidden cost.

## S10.9 Certifications worth knowing about (October 2026) 🟢

Microsoft retired several popular certifications in 2025–26, so check the current list before paying for one.

| Certification | Status | Fits |
|---|---|---|
| **AZ-900** Azure Fundamentals | Active | Anyone new to cloud; a cheap first step |
| **AI-200** Azure AI Cloud Developer Associate | Active; **replaced AZ-204** (Azure Developer), which retired 31 Jul 2026 | Backend and full-stack .NET developers |
| **AZ-104** Azure Administrator | Active | Operations-leaning roles |
| **AZ-400** DevOps Engineer Expert | Active | After a developer or administrator associate certification |
| **DP-700** Fabric Data Engineer Associate | Active; **replaced DP-203**, retired 31 Mar 2025 | Data engineers ([[DE10]]) |
| **AWS Certified Cloud Practitioner / Developer – Associate** | Active | Roles on AWS |

## S10.10 Interview drill 🟢 ⭐

| Question | Strong short answer |
|---|---|
| CI vs CD? | CI builds and tests every change automatically; continuous delivery keeps every passing build releasable; continuous deployment releases it automatically. |
| Walk me through a pipeline. | Trigger on push or PR → restore and build → tests → lint and security scans → package an artifact tagged with the commit → deploy to staging → smoke tests or approval → production. |
| How do you deploy with no downtime? | Rolling, blue-green or canary deployments behind a load balancer, with health checks and a quick rollback path. |
| Blue-green vs canary? | Blue-green switches all traffic at once with instant rollback; canary shifts a small share first and grows it while watching metrics. |
| How do you change a database schema safely? | Expand and contract: add, dual-write, backfill, switch reads, drop later, so each step is backward-compatible. |
| IaaS vs PaaS vs serverless? | IaaS: you manage the OS; PaaS: you manage the app and data; serverless: you manage functions and pay per execution. |
| What's the shared responsibility model? | The provider secures the cloud's infrastructure; you secure your identities, configuration, data and code in it. |
| Where do secrets go? | A vault such as Key Vault, accessed via managed identity; never in code, images or Git. |
| What is infrastructure as code? | Declaring infrastructure in versioned files (Bicep, Terraform) so environments are reproducible and reviewable. |
| What are the DORA metrics? | Deployment frequency, lead time for changes, change failure rate, time to restore service. |
| Why should app servers be stateless? | So any instance can serve any request, which allows horizontal scaling and rolling deployments. |
| What's a canary metric to watch? | Error rate and latency percentiles of the canary compared with the stable version. |

## Key takeaways

> [!check]
> - Build once, promote the same artifact through environments; only config changes.
> - CI catches breakage on every push; CD makes releasing boring.
> - Zero downtime comes from rolling, blue-green or canary releases, plus backward-compatible database changes.
> - In the cloud, identity, data and configuration are always your responsibility; use managed identities and Key Vault.
> - Check certification status before studying: AZ-204 and DP-203 are retired.

## Sources

- [DORA research](https://dora.dev/) and the *Accelerate* book (Forsgren, Humble and Kim, 2018) for the four key metrics.
- [The Twelve-Factor App](https://12factor.net/).
- GitHub Docs: [GitHub Actions](https://docs.github.com/en/actions), [Automatic token authentication and permissions](https://docs.github.com/en/actions/security-for-github-actions/security-guides/automatic-token-authentication).
- Microsoft Learn: [Shared responsibility in the cloud](https://learn.microsoft.com/en-us/azure/security/fundamentals/shared-responsibility), [App Service deployment slots](https://learn.microsoft.com/en-us/azure/app-service/deploy-staging-slots), [Bicep](https://learn.microsoft.com/en-us/azure/azure-resource-manager/bicep/overview), [Managed identities](https://learn.microsoft.com/en-us/entra/identity/managed-identities-azure-resources/overview), [EF Core migrations in production](https://learn.microsoft.com/en-us/ef/core/managing-schemas/migrations/applying).
- Martin Fowler: [ParallelChange (expand and contract)](https://martinfowler.com/bliki/ParallelChange.html), [BlueGreenDeployment](https://martinfowler.com/bliki/BlueGreenDeployment.html), [CanaryRelease](https://martinfowler.com/bliki/CanaryRelease.html).
- Microsoft Learn credential pages for [AI-200](https://learn.microsoft.com/en-us/credentials/certifications/azure-ai-cloud-developer-associate/) and AZ-204 (retired), checked October 2026.
