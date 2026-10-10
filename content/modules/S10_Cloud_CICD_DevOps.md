# Cloud, CI/CD and DevOps — Getting Code to Users Safely

"How does your code get to production?" is now a standard question for backend, full-stack and data-engineering roles, even at entry level. You have more to say than most juniors: CS Visualizer has a real GitHub Actions pipeline that publishes a container image, and FinSight ran in Docker on an Azure VM with a runbook. This module gives you the vocabulary around that: pipelines, deployment strategies, the cloud service map, infrastructure as code, and the shared-responsibility model.

> [!focus]
> **Entry must:** describe a CI/CD pipeline's stages; explain environments and configuration per environment; name the basic cloud service models (IaaS, PaaS, SaaS, serverless); know where secrets go.
> **Mid adds:** blue-green and canary deployments, rollbacks, database migrations during deployments, infrastructure as code, managed identities, the shared-responsibility model, cost awareness.
> **Most asked:** *What's the difference between CI and CD?* · *Walk me through your pipeline* · *How do you deploy without downtime?* · *IaaS vs PaaS?* · *How do you handle secrets in the cloud?* · *How do you run database migrations safely?*
> **Time budget:** 3 hours.

## S10.0 Foundations: builds, artifacts, environments and what the cloud is 🟢

### From source code to something that runs

- **Build** turns source code into something runnable: `dotnet publish` compiles C# into assemblies; `ng build` bundles and minifies TypeScript into JavaScript files; `docker build` packages either one together with its runtime into an image.
- An **artifact** is the output of a build: a zip, a NuGet or npm package, a container image. Give every artifact a unique version that never changes: a **semantic version** such as `1.4.0` for releases, and the commit SHA so you can always trace it back to the code.
- **Deploying** puts one specific artifact into one specific environment, together with that environment's configuration.

<figure class="dia"><svg viewBox="0 0 720 235" role="img" aria-label="One commit is built once into a versioned image, and the same image is deployed to dev, staging and production with different configuration">
<rect class="sB" x="10" y="80" width="100" height="50" rx="8"/><text class="sT" x="60" y="103" text-anchor="middle">git commit</text><text class="sC" x="60" y="119" text-anchor="middle">a1b2c3d</text>
<line class="sLm" x1="110" y1="105" x2="140" y2="105" marker-end="url(#ahm)"/>
<rect class="sA" x="144" y="80" width="110" height="50" rx="8"/><text class="sT" x="199" y="103" text-anchor="middle">build</text><text class="sC" x="199" y="119" text-anchor="middle">once</text>
<line class="sLm" x1="254" y1="105" x2="284" y2="105" marker-end="url(#ahm)"/>
<rect class="sV" x="288" y="74" width="130" height="62" rx="10"/><text class="sT" x="353" y="98" text-anchor="middle">image</text><text class="sM" x="353" y="114" text-anchor="middle">api:1.4.0</text><text class="sC" x="353" y="128" text-anchor="middle">sha a1b2c3d</text>
<line class="sL" x1="418" y1="105" x2="486" y2="52" marker-end="url(#ah)"/>
<rect class="sB" x="490" y="30" width="220" height="44" rx="8"/><text class="sT" x="502" y="49">dev</text><text class="sC" x="502" y="66">config: local DB, debug logs</text>
<line class="sL" x1="418" y1="105" x2="486" y2="114" marker-end="url(#ah)"/>
<rect class="sW" x="490" y="92" width="220" height="44" rx="8"/><text class="sT" x="502" y="111">staging</text><text class="sC" x="502" y="128">config: test DB, prod-like</text>
<line class="sL" x1="418" y1="105" x2="486" y2="176" marker-end="url(#ah)"/>
<rect class="sG" x="490" y="154" width="220" height="44" rx="8"/><text class="sT" x="502" y="173">production</text><text class="sC" x="502" y="190">config: prod DB via Key Vault</text>
<text class="sS" x="360" y="222" text-anchor="middle">Only configuration differs between environments; the bits you tested are the bits you ship.</text>
</svg><figcaption>Build once, promote everywhere. Rebuilding per environment would mean production runs something nobody tested.</figcaption></figure>

> [!term] Semantic versioning
> `MAJOR.MINOR.PATCH`. Increase MAJOR for breaking changes, MINOR for new backward-compatible features and PATCH for backward-compatible fixes. That's why `"^1.4.0"` in a `package.json` accepts any `1.x.y` from 1.4.0 upwards but never `2.0.0`.

### What "the cloud" actually is

A cloud provider runs very large data centres and rents slices of them by the second, through an API. Almost everything it sells falls into four families:

| Family | Examples |
|---|---|
| **Compute** | Virtual machines, containers, functions |
| **Storage** | Disks, object storage, managed databases |
| **Networking** | Virtual networks, load balancers, DNS, CDNs, firewalls |
| **Identity** | Who (a person or an app) may do what to which resource |

The portal, the command line and infrastructure-as-code tools all call the same API, which is why everything you can click can also be scripted ([[S10.5]]). The trade is simple: you stop buying and maintaining hardware and pay only for what you use, scaling out in minutes, but in exchange you must manage access and cost with care. In Azure, resources live in **resource groups** (things that share a lifecycle), inside a **subscription** (the billing and access boundary), inside your organisation's **tenant**.

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

<figure class="dia anim" data-rest="8.5"><svg viewBox="0 0 720 145" role="img" aria-label="Animation: a commit moves through build, test, scan, package, staging, approval and production, each gate ticking green">
<rect class="sB" x="8" y="34" width="78" height="50" rx="8"/>
<text class="sT" x="47" y="64" text-anchor="middle">Commit</text>
<rect class="sA" x="96" y="34" width="78" height="50" rx="8"/>
<text class="sT" x="135" y="64" text-anchor="middle">Build</text>
<rect class="sA" x="184" y="34" width="78" height="50" rx="8"/>
<text class="sT" x="223" y="64" text-anchor="middle">Test</text>
<rect class="sA" x="272" y="34" width="78" height="50" rx="8"/>
<text class="sT" x="311" y="56" text-anchor="middle">Lint &amp;</text><text class="sT" x="311" y="72" text-anchor="middle">scan</text>
<rect class="sA" x="360" y="34" width="78" height="50" rx="8"/>
<text class="sT" x="399" y="64" text-anchor="middle">Package</text>
<rect class="sW" x="448" y="34" width="78" height="50" rx="8"/>
<text class="sT" x="487" y="64" text-anchor="middle">Staging</text>
<rect class="sW" x="536" y="34" width="78" height="50" rx="8"/>
<text class="sT" x="575" y="56" text-anchor="middle">Smoke</text><text class="sT" x="575" y="72" text-anchor="middle">/ approve</text>
<rect class="sG" x="624" y="34" width="88" height="50" rx="8"/>
<text class="sT" x="668" y="64" text-anchor="middle">Production</text>
<circle class="sPv" r="7"><animateMotion dur="9.0s" repeatCount="indefinite" calcMode="linear" path="M47.0 22 H668.0" keyPoints="0.0000;0.0000;0.0000;0.1417;0.1417;0.2834;0.2834;0.4251;0.4251;0.5668;0.5668;0.7085;0.7085;0.8502;0.8502;1.0000;1.0000;1.0000" keyTimes="0.0000;0.0333;0.0929;0.1417;0.2012;0.2500;0.3096;0.3583;0.4179;0.4667;0.5262;0.5750;0.6346;0.6833;0.7429;0.7917;0.8512;1.0000"/></circle>
<text class="sGt" x="47.0" y="100" text-anchor="middle" opacity="0">✓<animate attributeName="opacity" dur="9.0s" repeatCount="indefinite" calcMode="discrete" values="0;1;0" keyTimes="0;0.0929;0.9722"/></text>
<text class="sGt" x="135.0" y="100" text-anchor="middle" opacity="0">✓<animate attributeName="opacity" dur="9.0s" repeatCount="indefinite" calcMode="discrete" values="0;1;0" keyTimes="0;0.2012;0.9722"/></text>
<text class="sGt" x="223.0" y="100" text-anchor="middle" opacity="0">✓<animate attributeName="opacity" dur="9.0s" repeatCount="indefinite" calcMode="discrete" values="0;1;0" keyTimes="0;0.3096;0.9722"/></text>
<text class="sGt" x="311.0" y="100" text-anchor="middle" opacity="0">✓<animate attributeName="opacity" dur="9.0s" repeatCount="indefinite" calcMode="discrete" values="0;1;0" keyTimes="0;0.4179;0.9722"/></text>
<text class="sGt" x="399.0" y="100" text-anchor="middle" opacity="0">✓<animate attributeName="opacity" dur="9.0s" repeatCount="indefinite" calcMode="discrete" values="0;1;0" keyTimes="0;0.5262;0.9722"/></text>
<text class="sGt" x="487.0" y="100" text-anchor="middle" opacity="0">✓<animate attributeName="opacity" dur="9.0s" repeatCount="indefinite" calcMode="discrete" values="0;1;0" keyTimes="0;0.6346;0.9722"/></text>
<text class="sGt" x="575.0" y="100" text-anchor="middle" opacity="0">✓<animate attributeName="opacity" dur="9.0s" repeatCount="indefinite" calcMode="discrete" values="0;1;0" keyTimes="0;0.7429;0.9722"/></text>
<text class="sGt" x="668.0" y="100" text-anchor="middle" opacity="0">✓<animate attributeName="opacity" dur="9.0s" repeatCount="indefinite" calcMode="discrete" values="0;1;0" keyTimes="0;0.8512;0.9722"/></text>
<path class="sN" d="M8 114 v6 h430 v-6"/><text class="sM" x="223" y="134" text-anchor="middle">CI: every push and pull request</text>
<path class="sN" d="M448 114 v6 h264 v-6"/><text class="sM" x="580" y="134" text-anchor="middle">CD: on merge to main</text>
</svg><figcaption>Build once, then promote the same artifact (a container image, a zip) through each environment. Any red gate stops the line.</figcaption></figure>

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

<figure class="dia steps" data-start="1"><svg viewBox="0 0 720 222" role="img" aria-label="Rolling, blue-green and canary deployments shown as traffic from a load balancer to old and new instances">
<rect class="sB" x="20" y="96" width="110" height="50" rx="8"/><text class="sT" x="75" y="119" text-anchor="middle">load</text><text class="sC" x="75" y="135" text-anchor="middle">balancer</text>
<g data-s="1-1"><line class="sL" x1="130" y1="121" x2="296" y2="47" style="stroke-width:2" marker-end="url(#ah)"/><rect class="sG" x="300" y="30" width="110" height="34" rx="6"/><text class="sT" x="355" y="52" text-anchor="middle">v2</text><line class="sL" x1="130" y1="121" x2="296" y2="93" style="stroke-width:2" marker-end="url(#ah)"/><rect class="sG" x="300" y="76" width="110" height="34" rx="6"/><text class="sT" x="355" y="98" text-anchor="middle">v2</text><line class="sL" x1="130" y1="121" x2="296" y2="139" style="stroke-width:2" marker-end="url(#ah)"/><rect class="sA" x="300" y="122" width="110" height="34" rx="6"/><text class="sT" x="355" y="144" text-anchor="middle">v1</text><line class="sL" x1="130" y1="121" x2="296" y2="185" style="stroke-width:2" marker-end="url(#ah)"/><rect class="sA" x="300" y="168" width="110" height="34" rx="6"/><text class="sT" x="355" y="190" text-anchor="middle">v1</text><text class="sT" x="560" y="100" text-anchor="middle">Rolling: swap a few</text><text class="sS" x="560" y="118" text-anchor="middle">instances at a time.</text><text class="sC" x="560" y="142" text-anchor="middle">Old and new serve together</text><text class="sC" x="560" y="158" text-anchor="middle">for a while.</text></g>
<g data-s="2-2"><rect class="sA" x="300" y="30" width="110" height="34" rx="6"/><text class="sT" x="355" y="52" text-anchor="middle">v1 blue</text><rect class="sA" x="300" y="76" width="110" height="34" rx="6"/><text class="sT" x="355" y="98" text-anchor="middle">v1 blue</text><rect class="sG" x="300" y="122" width="110" height="34" rx="6"/><text class="sT" x="355" y="144" text-anchor="middle">v2 green</text><rect class="sG" x="300" y="168" width="110" height="34" rx="6"/><text class="sT" x="355" y="190" text-anchor="middle">v2 green</text><line class="sL" x1="130" y1="121" x2="296" y2="47" style="stroke-width:3" marker-end="url(#ah)"/><line class="sL" x1="130" y1="121" x2="296" y2="93" style="stroke-width:3" marker-end="url(#ah)"/><text class="sT" x="560" y="100" text-anchor="middle">Blue-green: green is</text><text class="sS" x="560" y="118" text-anchor="middle">deployed and tested</text><text class="sS" x="560" y="136" text-anchor="middle">while blue takes traffic.</text></g>
<g data-s="3-3"><rect class="sA" x="300" y="30" width="110" height="34" rx="6"/><text class="sT" x="355" y="52" text-anchor="middle">v1 blue</text><rect class="sA" x="300" y="76" width="110" height="34" rx="6"/><text class="sT" x="355" y="98" text-anchor="middle">v1 blue</text><rect class="sG" x="300" y="122" width="110" height="34" rx="6"/><text class="sT" x="355" y="144" text-anchor="middle">v2 green</text><rect class="sG" x="300" y="168" width="110" height="34" rx="6"/><text class="sT" x="355" y="190" text-anchor="middle">v2 green</text><line class="sLg" x1="130" y1="121" x2="296" y2="139" style="stroke-width:3" marker-end="url(#ah)"/><line class="sLg" x1="130" y1="121" x2="296" y2="185" style="stroke-width:3" marker-end="url(#ah)"/><text class="sT" x="560" y="100" text-anchor="middle">Switch: all traffic</text><text class="sS" x="560" y="118" text-anchor="middle">moves to green at once.</text><text class="sS" x="560" y="136" text-anchor="middle">Blue stays up: rollback</text><text class="sS" x="560" y="154" text-anchor="middle">is one switch back.</text></g>
<g data-s="4-4"><line class="sL" x1="130" y1="121" x2="296" y2="47" style="stroke-width:3.5" marker-end="url(#ah)"/><rect class="sA" x="300" y="30" width="110" height="34" rx="6"/><text class="sT" x="355" y="52" text-anchor="middle">v1</text><line class="sL" x1="130" y1="121" x2="296" y2="93" style="stroke-width:3.5" marker-end="url(#ah)"/><rect class="sA" x="300" y="76" width="110" height="34" rx="6"/><text class="sT" x="355" y="98" text-anchor="middle">v1</text><line class="sL" x1="130" y1="121" x2="296" y2="139" style="stroke-width:3.5" marker-end="url(#ah)"/><rect class="sA" x="300" y="122" width="110" height="34" rx="6"/><text class="sT" x="355" y="144" text-anchor="middle">v1</text><line class="sLw" x1="130" y1="121" x2="296" y2="185" style="stroke-width:1" marker-end="url(#ah)"/><rect class="sW" x="300" y="168" width="110" height="34" rx="6"/><text class="sT" x="355" y="190" text-anchor="middle">v2 canary</text><text class="sWt" x="232" y="214" text-anchor="middle">5%</text><text class="sM" x="232" y="44" text-anchor="middle">95%</text><text class="sT" x="560" y="100" text-anchor="middle">Canary: 5% of traffic</text><text class="sS" x="560" y="118" text-anchor="middle">to the new version.</text><text class="sC" x="560" y="142" text-anchor="middle">Compare its errors and</text><text class="sC" x="560" y="158" text-anchor="middle">latency, then 25 → 50 → 100%.</text></g>
</svg><ol class="dia-steps">
<li>Rolling: the platform replaces instances a few at a time. No extra capacity, no downtime, but for a while two versions answer requests, so they must be compatible.</li>
<li>Blue-green: a complete second environment (green) gets the new version and is tested while blue still takes all the traffic.</li>
<li>The switch moves all traffic at once. If anything looks wrong, switching back is instant, because blue is still running.</li>
<li>Canary: send a small slice of real traffic to the new version, compare its error rate and latency with the old, and grow the slice only while it looks healthy.</li>
</ol><figcaption>Three ways to deploy without downtime. Each needs health checks and a rollback plan.</figcaption></figure>

### Database migrations in a live system 🟡 ⭐

The code can roll back in seconds; the database can't. Use the **expand and contract** (parallel change) pattern, so every version of the code works with the schema in place:

1. **Expand:** add the new column or table, nullable or with a default. The old code ignores it.
2. Deploy code that **writes both** old and new, and reads from the old.
3. **Backfill** existing rows.
4. Deploy code that **reads from the new**.
5. **Contract:** once nothing uses the old column, drop it in a later release.

Never rename or drop a column in the same release as the code that stops using it. In EF Core, generate **idempotent SQL scripts** (`dotnet ef migrations script --idempotent`) or migration bundles, review them, and run them as a pipeline step, rather than calling `Database.Migrate()` at app startup on several instances at once.

<figure class="dia steps" data-start="1"><svg viewBox="0 0 720 248" role="img" aria-label="Expand and contract: add new columns, dual-write, backfill, switch reads, then drop the old column">
<text class="sT" x="130" y="24" text-anchor="middle">Customers table</text>
<g data-s="1-4"><rect class="sB" x="40" y="40" width="180" height="32" rx="6"/><text class="sM" x="130" y="61" text-anchor="middle">FullName</text></g>
<g data-s="5-5"><rect class="sR" x="40" y="40" width="180" height="32" rx="6" opacity=".5"/><text class="sM" x="130" y="61" text-anchor="middle">FullName  (dropped)</text></g>
<g data-s="1"><rect class="sG" x="40" y="84" width="180" height="32" rx="6"/><text class="sM" x="130" y="105" text-anchor="middle">FirstName  (new)</text><rect class="sG" x="40" y="128" width="180" height="32" rx="6"/><text class="sM" x="130" y="149" text-anchor="middle">LastName  (new)</text></g>
<g data-s="3-3"><rect class="sB" x="40" y="176" width="180" height="14" rx="4"/><rect class="sA" x="40" y="176" width="126" height="14" rx="4"/><text class="sC" x="130" y="206" text-anchor="middle">backfilling old rows… 70%</text></g>
<g data-s="1-1"><rect class="sA" x="300" y="40" width="400" height="120" rx="10"/><text class="sX" x="500" y="66" text-anchor="middle">app v1</text><text class="sM" x="500" y="92" text-anchor="middle">writes FullName</text><text class="sM" x="500" y="114" text-anchor="middle">reads FullName</text><text class="sC" x="500" y="142" text-anchor="middle">unchanged: ignores new columns</text></g>
<g data-s="2-2"><rect class="sA" x="300" y="40" width="400" height="120" rx="10"/><text class="sX" x="500" y="66" text-anchor="middle">app v2</text><text class="sM" x="500" y="92" text-anchor="middle">writes FullName AND First/Last</text><text class="sM" x="500" y="114" text-anchor="middle">reads FullName</text><text class="sC" x="500" y="142" text-anchor="middle">new rows fill both</text></g>
<g data-s="3-3"><rect class="sA" x="300" y="40" width="400" height="120" rx="10"/><text class="sX" x="500" y="66" text-anchor="middle">app v2</text><text class="sM" x="500" y="92" text-anchor="middle">writes both</text><text class="sM" x="500" y="114" text-anchor="middle">reads FullName</text><text class="sC" x="500" y="142" text-anchor="middle">a batch job splits old FullName values</text></g>
<g data-s="4-4"><rect class="sA" x="300" y="40" width="400" height="120" rx="10"/><text class="sX" x="500" y="66" text-anchor="middle">app v3</text><text class="sM" x="500" y="92" text-anchor="middle">writes both</text><text class="sM" x="500" y="114" text-anchor="middle">reads First/Last</text><text class="sC" x="500" y="142" text-anchor="middle">rolling back to v2 is still safe</text></g>
<g data-s="5-5"><rect class="sG" x="300" y="40" width="400" height="120" rx="10"/><text class="sX" x="500" y="66" text-anchor="middle">app v4</text><text class="sM" x="500" y="92" text-anchor="middle">writes First/Last</text><text class="sM" x="500" y="114" text-anchor="middle">reads First/Last</text><text class="sC" x="500" y="142" text-anchor="middle">a later release drops FullName</text></g>
<text class="sS" x="360" y="236" text-anchor="middle">Every step is backward-compatible, so any single deployment can be rolled back.</text>
</svg><ol class="dia-steps">
<li><b>Expand:</b> add the new columns, nullable. The running v1 code doesn't know they exist, and doesn't need to.</li>
<li>Deploy v2, which writes both shapes but still reads the old one. New and updated rows now fill both.</li>
<li><b>Backfill:</b> a batch job copies old rows into the new columns, in small chunks to avoid long locks.</li>
<li>Deploy v3, which reads the new columns. If it misbehaves, rolling back to v2 is safe: v2 never stopped writing both.</li>
<li><b>Contract:</b> once nothing reads <code>FullName</code>, a later release drops it.</li>
</ol><figcaption>Splitting one column into two, live. The schema and the code never disagree about what exists.</figcaption></figure>

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

<figure class="dia"><svg viewBox="0 0 720 272" role="img" aria-label="Who manages each layer, from data down to the data centre, for on-premises, IaaS, PaaS, serverless and SaaS">
<text class="sT" x="266" y="34" text-anchor="middle">On-premises</text>
<text class="sT" x="358" y="34" text-anchor="middle">IaaS</text>
<text class="sT" x="450" y="34" text-anchor="middle">PaaS</text>
<text class="sT" x="542" y="34" text-anchor="middle">Serverless</text>
<text class="sT" x="634" y="34" text-anchor="middle">SaaS</text>
<text class="sS" x="196" y="63" text-anchor="end">Data &amp; access</text>
<rect class="sA" x="222" y="46" width="88" height="24" rx="4"/><text class="sC" x="266" y="62" text-anchor="middle">you</text>
<rect class="sA" x="314" y="46" width="88" height="24" rx="4"/><text class="sC" x="358" y="62" text-anchor="middle">you</text>
<rect class="sA" x="406" y="46" width="88" height="24" rx="4"/><text class="sC" x="450" y="62" text-anchor="middle">you</text>
<rect class="sA" x="498" y="46" width="88" height="24" rx="4"/><text class="sC" x="542" y="62" text-anchor="middle">you</text>
<rect class="sA" x="590" y="46" width="88" height="24" rx="4"/><text class="sC" x="634" y="62" text-anchor="middle">you</text>
<text class="sS" x="196" y="91" text-anchor="end">Application code</text>
<rect class="sA" x="222" y="74" width="88" height="24" rx="4"/><text class="sC" x="266" y="90" text-anchor="middle">you</text>
<rect class="sA" x="314" y="74" width="88" height="24" rx="4"/><text class="sC" x="358" y="90" text-anchor="middle">you</text>
<rect class="sA" x="406" y="74" width="88" height="24" rx="4"/><text class="sC" x="450" y="90" text-anchor="middle">you</text>
<rect class="sA" x="498" y="74" width="88" height="24" rx="4"/><text class="sC" x="542" y="90" text-anchor="middle">you</text>
<rect class="sB" x="590" y="74" width="88" height="24" rx="4"/><text class="sC" x="634" y="90" text-anchor="middle">provider</text>
<text class="sS" x="196" y="119" text-anchor="end">Runtime</text>
<rect class="sA" x="222" y="102" width="88" height="24" rx="4"/><text class="sC" x="266" y="118" text-anchor="middle">you</text>
<rect class="sA" x="314" y="102" width="88" height="24" rx="4"/><text class="sC" x="358" y="118" text-anchor="middle">you</text>
<rect class="sB" x="406" y="102" width="88" height="24" rx="4"/><text class="sC" x="450" y="118" text-anchor="middle">provider</text>
<rect class="sB" x="498" y="102" width="88" height="24" rx="4"/><text class="sC" x="542" y="118" text-anchor="middle">provider</text>
<rect class="sB" x="590" y="102" width="88" height="24" rx="4"/><text class="sC" x="634" y="118" text-anchor="middle">provider</text>
<text class="sS" x="196" y="147" text-anchor="end">Operating system</text>
<rect class="sA" x="222" y="130" width="88" height="24" rx="4"/><text class="sC" x="266" y="146" text-anchor="middle">you</text>
<rect class="sA" x="314" y="130" width="88" height="24" rx="4"/><text class="sC" x="358" y="146" text-anchor="middle">you</text>
<rect class="sB" x="406" y="130" width="88" height="24" rx="4"/><text class="sC" x="450" y="146" text-anchor="middle">provider</text>
<rect class="sB" x="498" y="130" width="88" height="24" rx="4"/><text class="sC" x="542" y="146" text-anchor="middle">provider</text>
<rect class="sB" x="590" y="130" width="88" height="24" rx="4"/><text class="sC" x="634" y="146" text-anchor="middle">provider</text>
<text class="sS" x="196" y="175" text-anchor="end">Virtualisation</text>
<rect class="sA" x="222" y="158" width="88" height="24" rx="4"/><text class="sC" x="266" y="174" text-anchor="middle">you</text>
<rect class="sB" x="314" y="158" width="88" height="24" rx="4"/><text class="sC" x="358" y="174" text-anchor="middle">provider</text>
<rect class="sB" x="406" y="158" width="88" height="24" rx="4"/><text class="sC" x="450" y="174" text-anchor="middle">provider</text>
<rect class="sB" x="498" y="158" width="88" height="24" rx="4"/><text class="sC" x="542" y="174" text-anchor="middle">provider</text>
<rect class="sB" x="590" y="158" width="88" height="24" rx="4"/><text class="sC" x="634" y="174" text-anchor="middle">provider</text>
<text class="sS" x="196" y="203" text-anchor="end">Servers &amp; storage</text>
<rect class="sA" x="222" y="186" width="88" height="24" rx="4"/><text class="sC" x="266" y="202" text-anchor="middle">you</text>
<rect class="sB" x="314" y="186" width="88" height="24" rx="4"/><text class="sC" x="358" y="202" text-anchor="middle">provider</text>
<rect class="sB" x="406" y="186" width="88" height="24" rx="4"/><text class="sC" x="450" y="202" text-anchor="middle">provider</text>
<rect class="sB" x="498" y="186" width="88" height="24" rx="4"/><text class="sC" x="542" y="202" text-anchor="middle">provider</text>
<rect class="sB" x="590" y="186" width="88" height="24" rx="4"/><text class="sC" x="634" y="202" text-anchor="middle">provider</text>
<text class="sS" x="196" y="231" text-anchor="end">Network &amp; data centre</text>
<rect class="sA" x="222" y="214" width="88" height="24" rx="4"/><text class="sC" x="266" y="230" text-anchor="middle">you</text>
<rect class="sB" x="314" y="214" width="88" height="24" rx="4"/><text class="sC" x="358" y="230" text-anchor="middle">provider</text>
<rect class="sB" x="406" y="214" width="88" height="24" rx="4"/><text class="sC" x="450" y="230" text-anchor="middle">provider</text>
<rect class="sB" x="498" y="214" width="88" height="24" rx="4"/><text class="sC" x="542" y="230" text-anchor="middle">provider</text>
<rect class="sB" x="590" y="214" width="88" height="24" rx="4"/><text class="sC" x="634" y="230" text-anchor="middle">provider</text>
<text class="sGt" x="360" y="262" text-anchor="middle">The row you always own: your data, who can access it, and how it is configured.</text>
</svg><figcaption>The shared-responsibility model as a stack. Moving right buys you less to manage and less control.</figcaption></figure>

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

<figure class="dia steps" data-start="1"><svg viewBox="0 0 720 222" role="img" aria-label="Infrastructure as code: the code, the state file and the real cloud start in sync; a manual portal change creates drift; adding a storage account to the code makes plan show one change reverting the drift and one addition; apply brings all three back in line">
<text class="sT" x="120" y="22" text-anchor="middle">code in Git (desired)</text>
<text class="sT" x="360" y="22" text-anchor="middle">state file (last applied)</text>
<text class="sT" x="600" y="22" text-anchor="middle">the real cloud</text>
<g data-s="1-2"><rect class="sB" x="30" y="34" width="180" height="26" rx="5"/><text class="sC" x="120" y="52" text-anchor="middle">plan: sku B1</text><rect class="sB" x="30" y="66" width="180" height="26" rx="5"/><text class="sC" x="120" y="84" text-anchor="middle">api: httpsOnly</text></g>
<g data-s="1-2"><rect class="sB" x="270" y="34" width="180" height="26" rx="5"/><text class="sC" x="360" y="52" text-anchor="middle">plan: sku B1</text><rect class="sB" x="270" y="66" width="180" height="26" rx="5"/><text class="sC" x="360" y="84" text-anchor="middle">api: httpsOnly</text></g>
<g data-s="1-1"><rect class="sB" x="510" y="34" width="180" height="26" rx="5"/><text class="sC" x="600" y="52" text-anchor="middle">plan: sku B1</text></g><g data-s="1-2"><rect class="sB" x="510" y="66" width="180" height="26" rx="5"/><text class="sC" x="600" y="84" text-anchor="middle">api: httpsOnly</text></g>
<g data-s="1-1"><text class="sGt" x="360" y="120" text-anchor="middle">in sync: plan shows "No changes"</text></g>
<g data-s="2-2"><rect class="sR" x="510" y="34" width="180" height="26" rx="5" style="fill:none;stroke-width:2.2"/><text class="sRt" x="600" y="116" text-anchor="middle">someone scales to P1v3 in the portal</text></g>
<g data-s="2-2"><rect class="sW" x="510" y="34" width="180" height="26" rx="5"/><text class="sC" x="600" y="52" text-anchor="middle">plan: sku P1v3 (drift)</text></g>
<g data-s="3-4"><rect class="sB" x="30" y="34" width="180" height="26" rx="5"/><text class="sC" x="120" y="52" text-anchor="middle">plan: sku B1</text><rect class="sB" x="30" y="66" width="180" height="26" rx="5"/><text class="sC" x="120" y="84" text-anchor="middle">api: httpsOnly</text><rect class="sG" x="30" y="98" width="180" height="26" rx="5"/><text class="sC" x="120" y="116" text-anchor="middle">storage account (new)</text></g>
<g data-s="3-3"><rect class="sB" x="270" y="34" width="180" height="26" rx="5"/><text class="sC" x="360" y="52" text-anchor="middle">plan: sku B1</text><rect class="sB" x="270" y="66" width="180" height="26" rx="5"/><text class="sC" x="360" y="84" text-anchor="middle">api: httpsOnly</text><rect class="sW" x="510" y="34" width="180" height="26" rx="5"/><text class="sC" x="600" y="52" text-anchor="middle">plan: sku P1v3 (drift)</text><rect class="sB" x="510" y="66" width="180" height="26" rx="5"/><text class="sC" x="600" y="84" text-anchor="middle">api: httpsOnly</text></g>
<g data-s="3-3"><rect class="sN" x="30" y="140" width="660" height="66" rx="8"/><text class="sC" x="44" y="162" xml:space="preserve" style="white-space:pre">~ plan.sku   P1v3 → B1      (revert the manual change)</text><text class="sC" x="44" y="182" xml:space="preserve" style="white-space:pre">+ storage    will be created</text><text class="sS" x="44" y="200" xml:space="preserve" style="white-space:pre">Plan: 1 to add, 1 to change, 0 to destroy</text></g>
<g data-s="4-4"><rect class="sB" x="270" y="34" width="180" height="26" rx="5"/><text class="sC" x="360" y="52" text-anchor="middle">plan: sku B1</text><rect class="sB" x="270" y="66" width="180" height="26" rx="5"/><text class="sC" x="360" y="84" text-anchor="middle">api: httpsOnly</text><rect class="sG" x="270" y="98" width="180" height="26" rx="5"/><text class="sC" x="360" y="116" text-anchor="middle">storage account</text><rect class="sB" x="510" y="34" width="180" height="26" rx="5"/><text class="sC" x="600" y="52" text-anchor="middle">plan: sku B1</text><rect class="sB" x="510" y="66" width="180" height="26" rx="5"/><text class="sC" x="600" y="84" text-anchor="middle">api: httpsOnly</text><rect class="sG" x="510" y="98" width="180" height="26" rx="5"/><text class="sC" x="600" y="116" text-anchor="middle">storage account</text><text class="sGt" x="360" y="170" text-anchor="middle">apply: reality and state match the code again</text></g>
</svg><ol class="dia-steps">
<li>Code, state and reality agree: <code>terraform plan</code> (or a Bicep what-if) reports no changes.</li>
<li>Someone scales the plan up by hand in the portal. Reality now differs from both the code and the state: that is <b>drift</b>.</li>
<li>A pull request adds a storage account. <code>plan</code> compares the desired code with the real resources and proposes two actions: create the storage account and revert the manual change. Review this diff in the PR.</li>
<li><code>apply</code> makes reality match the code and records it in the state. Fixing the portal change for good means putting it in the code.</li>
</ol><figcaption>Declarative IaC: you describe the end state, the tool works out the steps, and the plan is the thing you review.</figcaption></figure>

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
