# Linux, the Shell and Docker — Where Your Code Actually Runs

Your API runs in a Linux container even if you write it on Windows. Backend, full-stack and data-engineering interviews check that you can get around a server, read logs, and explain a Dockerfile. Your *Connectivity Bootcamp* covers Linux from an administrator's side (users, disks, services). This module covers it from a **developer's** side, and goes deep on containers.

> [!focus]
> **Entry must:** navigate and inspect files; read permissions; find a process and its logs; use pipes and grep; explain image vs container; read and write a simple Dockerfile; run a multi-container app with Compose.
> **Mid adds:** multi-stage builds, layer caching, non-root images, health checks, volumes vs bind mounts, container networking, what Kubernetes adds.
> **Most asked:** *Container vs virtual machine?* · *Image vs container?* · *Walk me through your Dockerfile* · *How do containers talk to each other in Compose?* · *How do you persist a database's data?* · *The app works locally but not in the container. Where do you look?*
> **Time budget:** 3 hours, plus an hour of hands-on.

## S5.1 The Linux filesystem and moving around 🟢

Everything is a file under one root `/`; there are no drive letters.

| Path | Holds |
|---|---|
| `/home/<user>` | Users' files (`~` is yours) |
| `/etc` | Configuration |
| `/var/log` | Logs |
| `/usr/bin`, `/usr/local/bin` | Programs |
| `/tmp` | Temporary files, often cleared at reboot |
| `/proc`, `/sys` | Live kernel and process information, as files |
| `/dev` | Devices |

```bash
pwd                    # where am I
ls -lah                # list, long format, all (incl. hidden), human sizes
cd /var/log            # absolute path;  cd ..  up one;  cd -  back to previous
cat app.log            # print a file;  less app.log  to page through (q quits, / searches)
head -n 20 app.log     # first 20 lines;  tail -n 50  last 50
tail -f app.log        # follow new lines live: the debugging staple
mkdir -p a/b/c         # create nested folders
cp -r src dst;  mv old new;  rm file;  rm -r folder   # no recycle bin: be careful
find . -name "*.json" -mtime -1     # JSON files changed in the last day
du -sh *               # size of each item here;   df -h   free space per disk
```

## S5.2 Permissions 🟢 ⭐

```text
-rwxr-x---  1 app  devs  4096 Oct  3 10:12 deploy.sh
│└┬┘└┬┘└┬┘     │    │
│ │  │  │      owner group
│ │  │  └ others: ---  (nothing)
│ │  └ group:  r-x  (read, execute)
│ └ owner:  rwx  (read, write, execute)
└ type: - file, d directory, l link
```

Each triple is a number: r = 4, w = 2, x = 1. So `rwxr-x---` is **750**.

```bash
chmod 750 deploy.sh        # set exactly
chmod +x deploy.sh         # add execute for everyone
chown app:devs deploy.sh   # change owner and group
sudo <command>             # run one command as root
```

> [!mistake] `chmod 777` to "fix" a permissions error
> It makes the file writable by every user and process on the machine. Find out *which* user needs access, usually the service account running the app, and grant only that.

## S5.3 Processes, services and logs 🟢 ⭐

```bash
ps aux | grep dotnet       # find a process
top                        # live CPU and memory (htop is friendlier if installed)
kill <pid>                 # ask it to stop (SIGTERM);  kill -9 <pid>  forces it (SIGKILL)
systemctl status nginx     # is the service running? recent log lines
systemctl restart nginx
journalctl -u nginx -f     # follow a systemd service's logs
journalctl -u nginx --since "10 min ago"
```

> [!term] Signal (SIGTERM, SIGKILL)
> A message the OS sends to a process. **SIGTERM** asks it to shut down gracefully: finish requests, close connections. **SIGKILL** ends it immediately, with no clean-up. Docker sends SIGTERM on `docker stop`, waits (10 seconds by default), then sends SIGKILL. ASP.NET Core handles SIGTERM for a graceful shutdown.

## S5.4 Pipes, redirection and text tools 🟢 ⭐

The Unix idea: small tools that each do one thing, joined with **pipes** (`|`), which send one program's output to the next one's input.

```bash
command > out.txt          # write stdout to a file (overwrite);  >> appends
command 2> err.txt         # stderr to a file;  2>&1  merges stderr into stdout
command < input.txt        # read stdin from a file

grep -i "error" app.log                    # lines containing error (case-insensitive)
grep -c " 500 " access.log                 # count them
grep -rn "ConnectionString" ./src          # search recursively with line numbers

# The ten most frequent client IPs in an nginx access log
awk '{print $1}' access.log | sort | uniq -c | sort -rn | head -10

sed -i 's/localhost/db/g' appsettings.json # replace text in place
cut -d',' -f2,5 data.csv | head            # columns 2 and 5 of a CSV
wc -l data.csv                             # line count
```

> [!say]
> "If an API is throwing errors in production I'd tail the logs and filter with grep for the request or error ID, then count with sort and uniq to see whether it's one endpoint or everything, before I go near the code."

## S5.5 Networking from the command line 🟢

```bash
curl -i https://api.example.com/health          # request with response headers
curl -X POST -H "Content-Type: application/json" -d '{"name":"x"}' http://localhost:8080/api/items
ss -tulpn                    # what's listening on which port, and which process
ip a                         # interfaces and IP addresses
dig api.example.com          # DNS lookup (nslookup works too)
ping -c 4 db                 # reachability
nc -zv db 5432               # can I open TCP port 5432 on host db?
```

## S5.6 Environment variables, SSH and scripts 🟢

**Environment variables** carry configuration into processes, which is how containers and cloud platforms configure apps. ASP.NET Core maps `ConnectionStrings__Default` (double underscore) onto `ConnectionStrings:Default`.

```bash
export ASPNETCORE_ENVIRONMENT=Production
echo $ASPNETCORE_ENVIRONMENT
env | grep ASPNET
```

**SSH** logs into remote machines with a **key pair**: your private key stays on your laptop; the public key goes in the server's `~/.ssh/authorized_keys`.

```bash
ssh-keygen -t ed25519 -C "you@example.com"
ssh azureuser@20.50.x.x
scp ./backup.sql azureuser@20.50.x.x:/tmp/
```

**A safe script header:**

```bash
#!/usr/bin/env bash
set -euo pipefail          # stop on error, on unset variables, and on failures inside pipes
BACKUP_DIR="/var/backups/finsight"
mkdir -p "$BACKUP_DIR"
docker exec db pg_dump -U app finsight > "$BACKUP_DIR/$(date +%F).sql"
```

**cron** runs commands on a schedule (`crontab -e`): `0 2 * * * /opt/backup.sh` means 02:00 every day. Fields are minute, hour, day of month, month, day of week.

> [!story]
> FinSight ran on an **Azure Ubuntu VM** with a network security group allowing only ports 22, 80 and 443, and you wrote the VM-setup document and runbook. That's real Linux operations experience: SSH key login, firewall rules, Docker installation, and recovery steps. Say "runbook"; interviewers like hearing it.

## S5.7 Containers: the idea 🟢 ⭐

> [!term] Container
> A process (or group of processes) running in an isolated view of the operating system: its own filesystem, network interfaces and process list, with limits on CPU and memory. It **shares the host's kernel**. On Linux the isolation comes from **namespaces** and the limits from **cgroups**.

> [!term] Image
> A read-only, layered template of a filesystem plus metadata (the command to run, environment variables, exposed ports). A **container** is a running instance of an image, with a thin writable layer on top. One image can run as many containers.

| | Virtual machine | Container |
|---|---|---|
| Virtualises | Hardware: each VM runs its **own kernel** | The OS: containers **share the host kernel** |
| Size | Gigabytes | Megabytes |
| Starts in | Tens of seconds to minutes | Under a second to a few seconds |
| Isolation | Stronger (hypervisor boundary) | Weaker (shared kernel), so harden it |
| Typical use | Running different OSes, strong tenant isolation | Packaging and shipping applications |

On Windows and macOS, Docker Desktop runs a small Linux VM behind the scenes (WSL 2 on Windows), which is why Linux containers work there.

> [!say]
> "A container is an isolated process sharing the host's kernel, so it's lightweight and starts in seconds; a VM virtualises hardware and runs its own kernel, which is heavier but more isolated. An image is the read-only template; a container is a running instance of it."

## S5.8 A production-grade Dockerfile for ASP.NET Core 🟢 🟡 ⭐

```dockerfile
# ---------- build stage: has the SDK, compilers, NuGet cache ----------
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
# Copy only project files first, so 'restore' is cached until dependencies change
COPY FinSight.Api/FinSight.Api.csproj FinSight.Api/
COPY FinSight.Core/FinSight.Core.csproj FinSight.Core/
RUN dotnet restore FinSight.Api/FinSight.Api.csproj
# Now the source, which changes often
COPY . .
RUN dotnet publish FinSight.Api/FinSight.Api.csproj -c Release -o /app/publish --no-restore

# ---------- runtime stage: only the ASP.NET runtime, much smaller ----------
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
COPY --from=build /app/publish .
# The non-root user built into .NET 8+ images (Dockerfile comments must be on their own line)
USER $APP_UID
# .NET 8+ images listen on 8080 by default
EXPOSE 8080
ENTRYPOINT ["dotnet", "FinSight.Api.dll"]
```

What to say about each choice:

- **Multi-stage build.** The SDK image is large; the final image carries only the runtime and your published output, so it's smaller, faster to pull and has less attack surface.
- **Layer caching.** Each instruction creates a layer, and Docker reuses a layer if its inputs haven't changed. Copying `.csproj` files and restoring *before* copying the source means a code-only change skips the slow restore. The same trick in Node is copying `package.json` and `package-lock.json` and running `npm ci` before `COPY . .`.
- **Non-root user.** If the app is compromised, the attacker isn't root inside the container. .NET 8 and later images include an `app` user for this purpose.
- **`.dockerignore`.** Keep `bin/`, `obj/`, `node_modules/`, `.git/` and secrets out of the build context.
- **Pin versions.** Use `10.0` (or a digest) rather than `latest`, so builds are reproducible.

> [!mistake] Secrets in images
> `ENV DB_PASSWORD=...` or copying `appsettings.Production.json` with secrets bakes them into a layer that anyone who pulls the image can read, even if a later layer deletes the file. Pass secrets at runtime (environment variables from a secret store, mounted files), or use BuildKit `--secret` for build-time secrets.

> [!story]
> CS Visualizer publishes a **non-root** image to GitHub Container Registry from CI, and FinSight's `docker` labs on `E:\docker` split SQL Server, the API and an nginx-served Angular build across separate networks. You can describe both a single-image pipeline and a multi-service system.

## S5.9 Docker commands that matter 🟢

```bash
docker build -t finsight-api:1.4.0 .
docker images
docker run -d --name api -p 8080:8080 -e ASPNETCORE_ENVIRONMENT=Development finsight-api:1.4.0
docker ps                  # running containers;  docker ps -a  includes stopped
docker logs -f api         # follow its output
docker exec -it api sh     # a shell inside the running container
docker stop api && docker rm api
docker system df           # disk used by images, containers, volumes
docker system prune        # clean up stopped containers, dangling images, unused networks
```

`-p 8080:8080` means **host port : container port**. The most common "it doesn't work" bug is an app listening on `localhost` (127.0.0.1) *inside* the container, which nothing outside can reach. Listen on `0.0.0.0` (ASP.NET Core in the official images already does).

## S5.10 Data that must survive: volumes 🟢 ⭐

A container's writable layer disappears when the container is removed. Databases need storage outside it.

| Option | What it is | Use for |
|---|---|---|
| **Named volume** (`pgdata:/var/lib/postgresql/data`) | Storage managed by Docker | Database files in development and simple deployments |
| **Bind mount** (`./src:/app/src`) | A host folder mapped into the container | Live-editing source code in development, config files |
| **tmpfs** | In memory only | Scratch data that must not touch disk |

## S5.11 Docker Compose: multi-container apps 🟢 ⭐

```yaml
# compose.yaml (the top-level 'version:' key is obsolete in Compose v2)
services:
  db:
    image: postgres:18
    environment:
      POSTGRES_PASSWORD: ${DB_PASSWORD}         # from a .env file that is git-ignored
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      retries: 10
  api:
    build: ./api
    environment:
      ConnectionStrings__Default: "Host=db;Database=app;Username=postgres;Password=${DB_PASSWORD}"
    depends_on:
      db:
        condition: service_healthy              # wait until the DB is actually ready
    ports: ["8080:8080"]
  web:
    build: ./web                                # Angular built and served by nginx
    ports: ["80:80"]
    depends_on: [api]
volumes:
  pgdata:
```

- Compose creates a **network** for the project; services reach each other **by service name** (`Host=db`), through Docker's built-in DNS. Only published `ports` are reachable from the host.
- `depends_on` alone only orders **startup**; with `condition: service_healthy` it waits for the health check. Even so, the app should retry its database connection, because databases restart.

```bash
docker compose up -d --build
docker compose logs -f api
docker compose ps
docker compose down          # stop and remove containers (add -v to delete volumes too)
```

> [!story]
> FinSight's compose file ran **seven services with a health-gated boot**, behind Caddy (automatic HTTPS) and nginx. In an interview, draw it: browser → Caddy → nginx → Angular static files and the API → SQL Server, with LangFlow and the forecasting job alongside. Then explain why the API waits for the database's health check.

## S5.12 "Works on my machine, not in the container" 🟡 ⭐

A checklist you can say out loud:

1. **Logs first:** `docker logs <container>`. Most failures say why at startup.
2. **Configuration:** is the environment (`ASPNETCORE_ENVIRONMENT`) right? Are the environment variables there (`docker exec ... env`)? Is the connection string pointing at `localhost` instead of the service name?
3. **Network:** is the app listening on `0.0.0.0` and the expected port? Is the port published? Can the container resolve and reach the database (`nc -zv db 5432` from inside)?
4. **Files and case sensitivity:** Linux filenames are case-sensitive (`Appsettings.json` ≠ `appsettings.json`), and paths use `/`.
5. **Permissions:** the non-root user can't write to a folder owned by root.
6. **Architecture:** an image built for `arm64` (an Apple-silicon Mac) won't run on an `amd64` server without a multi-platform build.

## S5.13 Kubernetes in one section 🟡

When one machine isn't enough, an **orchestrator** runs containers across a cluster, restarts them when they die, scales them and routes traffic. **Kubernetes** is the standard one.

| Object | Role |
|---|---|
| **Pod** | The smallest unit: one or more containers sharing a network namespace |
| **Deployment** | Desired state, such as "3 replicas of image X"; handles rolling updates and rollbacks |
| **Service** | A stable name and virtual IP that load-balances across a Deployment's pods |
| **Ingress / Gateway API** | HTTP routing from outside the cluster to Services |
| **ConfigMap / Secret** | Configuration and secrets injected as environment variables or files |
| **Probes** | Liveness (restart if dead) and readiness (only send traffic when ready) |

Managed offerings are Azure Kubernetes Service (AKS), Amazon EKS and Google GKE. For a small app, **Azure Container Apps**, **Azure App Service** or **Fly.io** give you containers without managing a cluster.

> [!say]
> "Kubernetes keeps a declared state: a Deployment says how many replicas of which image should run, a Service gives them a stable address, and probes tell it when to restart a pod or stop sending it traffic. For a small team I'd start with a managed container service and move to Kubernetes when the operational need justifies it."

> [!lab] One hour, one real answer
> Take any of your APIs, write the multi-stage Dockerfile above, add a `compose.yaml` with PostgreSQL and a health check, and bring it up. Then break it on purpose: point the connection string at `localhost`, read the error in `docker logs`, and fix it. Now "the app works locally but not in the container" is a story, not a theory.

## S5.14 Interview drill 🟢 ⭐

| Question | Strong short answer |
|---|---|
| Container vs virtual machine? | Containers share the host kernel and isolate processes, so they're light and fast; VMs virtualise hardware with their own kernel, so they're heavier but more isolated. |
| Image vs container? | An image is the read-only layered template; a container is a running instance with a writable layer. |
| Why use a multi-stage Dockerfile? | Build with the full SDK, ship only the runtime and published output: smaller, faster and safer images. |
| How does layer caching affect Dockerfile order? | Put rarely changing steps (dependency restore) before often changing ones (copying source) so rebuilds reuse cached layers. |
| How do containers in Compose find each other? | By service name, through the Compose network's built-in DNS. |
| How do you keep database data across restarts? | A named volume mounted at the database's data directory. |
| What does `-p 8080:80` mean? | Host port 8080 forwards to container port 80. |
| Why run as non-root? | To limit the damage if the app is compromised. |
| How should secrets reach a container? | At runtime from a secret store or environment variables, never baked into the image. |
| What does `chmod 640` mean? | Owner read and write, group read, others nothing. |
| How do you watch a log file live? | `tail -f file`, or `docker logs -f` or `journalctl -u service -f`. |
| SIGTERM vs SIGKILL? | SIGTERM asks for a graceful shutdown; SIGKILL kills immediately with no clean-up. |
| What does Kubernetes add over Compose? | Multi-machine scheduling, self-healing, scaling, rolling updates and service discovery across a cluster. |
| `depends_on` doesn't wait for the DB to be ready. Why, and how do you fix it? | It only orders startup; add a health check with `condition: service_healthy`, and make the app retry its connection. |

## Key takeaways

> [!check]
> - Logs first: `tail -f`, `journalctl -u`, `docker logs -f`.
> - Permissions are three triples of rwx; never "fix" access with 777.
> - Containers share the kernel; images are layers; order the Dockerfile for caching.
> - Multi-stage, pinned, non-root, no secrets: that's a production Dockerfile.
> - In Compose, services talk by name; data lives in volumes; readiness needs health checks.

## Sources

- Docker Docs: [Dockerfile best practices](https://docs.docker.com/build/building/best-practices/), [Multi-stage builds](https://docs.docker.com/build/building/multi-stage/), [Compose file reference](https://docs.docker.com/reference/compose-file/), [Control startup order](https://docs.docker.com/compose/how-tos/startup-order/), [Volumes](https://docs.docker.com/engine/storage/volumes/).
- Microsoft Learn: [Containerize a .NET app](https://learn.microsoft.com/en-us/dotnet/core/docker/build-container), [.NET 8 container images: default port 8080 and non-root user](https://learn.microsoft.com/en-us/dotnet/core/compatibility/containers/8.0/aspnet-port).
- Kubernetes documentation: [Concepts](https://kubernetes.io/docs/concepts/).
- The Linux man pages (`man chmod`, `man grep`) and [The Linux Command Line](https://linuxcommand.org/tlcl.php) by William Shotts (free).
