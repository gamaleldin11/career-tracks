# Linux, the Shell and Docker — Where Your Code Actually Runs

Your API runs in a Linux container even if you write it on Windows. Backend, full-stack and data-engineering interviews check that you can get around a server, read logs, and explain a Dockerfile. Your *Connectivity Bootcamp* covers Linux from an administrator's side (users, disks, services). This module covers it from a **developer's** side, and goes deep on containers.

> [!focus]
> **Entry must:** navigate and inspect files; read permissions; find a process and its logs; use pipes and grep; explain image vs container; read and write a simple Dockerfile; run a multi-container app with Compose.
> **Mid adds:** multi-stage builds, layer caching, non-root images, health checks, volumes vs bind mounts, container networking, what Kubernetes adds.
> **Most asked:** *Container vs virtual machine?* · *Image vs container?* · *Walk me through your Dockerfile* · *How do containers talk to each other in Compose?* · *How do you persist a database's data?* · *The app works locally but not in the container. Where do you look?*
> **Time budget:** 3 hours, plus an hour of hands-on.

## S5.0 Foundations: what an operating system does 🟢

Linux questions get easier once you have the model behind the commands. Five ideas cover it.

**The kernel and processes.** The **kernel** is the core of the operating system: the only code that talks to hardware, and the part that decides which program runs on which CPU core and when. A **process** is a running program with its own memory, a process ID (**PID**), a user it runs as, environment variables and a list of open files. A **thread** is one line of execution inside a process; threads share their process's memory.

**System calls.** A process can't touch the disk or the network card itself. It asks the kernel through **system calls** (`open`, `read`, `write`, `socket`, `fork`, `exec`), and the kernel checks permissions before doing it. `strace -p <pid>` shows them live.

<figure class="dia"><svg viewBox="0 0 720 280" role="img" aria-label="Processes in user space ask the kernel for everything through system calls; only the kernel touches the hardware">
<rect class="sB" x="20" y="236" width="680" height="34" rx="6"/><text class="sT" x="360" y="258" text-anchor="middle">Hardware: CPU cores, memory, disk, network card</text>
<rect class="sW" x="20" y="186" width="680" height="40" rx="6"/><text class="sT" x="360" y="204" text-anchor="middle">Kernel</text><text class="sC" x="360" y="219" text-anchor="middle">scheduling · memory · files · network · permissions</text>
<line class="sD" x1="20" y1="170" x2="700" y2="170"/>
<text class="sC" x="700" y="164" text-anchor="end">system calls: open, read, write, fork, exec, socket…</text>
<rect class="sB" x="20" y="60" width="160" height="72" rx="6"/><text class="sT" x="100" y="84" text-anchor="middle">bash</text><text class="sC" x="100" y="102" text-anchor="middle">PID 812 · you</text><text class="sC" x="100" y="120" text-anchor="middle">own memory · fds 0 1 2…</text>
<line class="sLm" x1="100" y1="132" x2="100" y2="184" marker-end="url(#ahm)"/>
<rect class="sA" x="192" y="60" width="160" height="72" rx="6"/><text class="sT" x="272" y="84" text-anchor="middle">dotnet Api.dll</text><text class="sC" x="272" y="102" text-anchor="middle">PID 1405 · app</text><text class="sC" x="272" y="120" text-anchor="middle">own memory · fds 0 1 2…</text>
<line class="sLm" x1="272" y1="132" x2="272" y2="184" marker-end="url(#ahm)"/>
<rect class="sB" x="364" y="60" width="160" height="72" rx="6"/><text class="sT" x="444" y="84" text-anchor="middle">nginx</text><text class="sC" x="444" y="102" text-anchor="middle">PID 977 · www-data</text><text class="sC" x="444" y="120" text-anchor="middle">own memory · fds 0 1 2…</text>
<line class="sLm" x1="444" y1="132" x2="444" y2="184" marker-end="url(#ahm)"/>
<rect class="sB" x="536" y="60" width="160" height="72" rx="6"/><text class="sT" x="616" y="84" text-anchor="middle">postgres</text><text class="sC" x="616" y="102" text-anchor="middle">PID 640 · postgres</text><text class="sC" x="616" y="120" text-anchor="middle">own memory · fds 0 1 2…</text>
<line class="sLm" x1="616" y1="132" x2="616" y2="184" marker-end="url(#ahm)"/>
<text class="sS" x="20" y="40">User space: processes, each isolated in its own memory</text>
</svg><figcaption>Processes never touch hardware directly. They ask the kernel through system calls, and the kernel enforces who may do what. A container (§S5.7) is a process that the kernel shows a restricted view of all this.</figcaption></figure>

**File descriptors and the three standard streams.** "Everything is a file" means files, folders, devices, sockets and pipes are all used through small numbers called **file descriptors**. Every process starts with three: **0 = stdin**, **1 = stdout**, **2 = stderr**. Now `2>&1` reads naturally: point descriptor 2 at wherever descriptor 1 points. Docker captures a container's stdout and stderr as its logs, which is why apps in containers should log to the console rather than to files.

**What the shell does with your line.** When you press Enter, the shell (bash, zsh) splits the line into words; expands `$VARIABLES`, `~` and wildcards like `*.json`; sets up any redirections and pipes; finds the program by searching the folders in `$PATH` (`which dotnet` shows which one it found); starts it as a child process; and waits.

**Exit codes.** Every process ends with a number: **0 means success**, anything else is a failure. The shell keeps it in `$?`. `make && ./run` runs the second command only if the first succeeded; `cmd || echo failed` only if it failed. CI pipelines and `set -e` scripts stop on a non-zero exit code, which is why a test runner that exits 0 after failing tests is a real bug.

> [!mistake] Unquoted variables
> `rm -rf $BUILD_DIR/` with `BUILD_DIR` unset becomes `rm -rf /`. Quote every variable (`"$BUILD_DIR"`), add `set -u` so unset variables are errors, or write `"${BUILD_DIR:?}"`, which stops the script if it's empty.

> [!term] Process ID 1
> The first process the kernel starts; every other process descends from it. On a server it's `systemd`. Inside a container it's your app's process, which is why your app must handle SIGTERM: there's no init system to do it for you.

## S5.1 The Linux filesystem and moving around 🟢

Everything is a file under one root `/`; there are no drive letters.

<figure class="dia steps"><svg viewBox="0 0 720 246" role="img" aria-label="The Linux directory tree from the root: home with sara, etc, var with log, usr with bin, tmp, proc and dev; a sequence of cd commands moves from the home directory to /var/log with an absolute path, up to /var with dot dot, to /etc with a relative path, and back home with tilde">
<line class="sLm" x1="360" y1="48" x2="72" y2="84"/>
<line class="sLm" x1="360" y1="48" x2="168" y2="84"/>
<line class="sLm" x1="360" y1="48" x2="264" y2="84"/>
<line class="sLm" x1="360" y1="48" x2="360" y2="84"/>
<line class="sLm" x1="360" y1="48" x2="456" y2="84"/>
<line class="sLm" x1="360" y1="48" x2="552" y2="84"/>
<line class="sLm" x1="360" y1="48" x2="648" y2="84"/>
<line class="sLm" x1="72" y1="112" x2="72" y2="148"/>
<line class="sLm" x1="264" y1="112" x2="264" y2="148"/>
<line class="sLm" x1="360" y1="112" x2="360" y2="148"/>
<rect class="sN" x="324" y="20" width="72" height="28" rx="6"/><text class="sT" x="360" y="39" text-anchor="middle">/</text>
<rect class="sN" x="36" y="84" width="72" height="28" rx="6"/><text class="sT" x="72" y="103" text-anchor="middle">home</text>
<rect class="sN" x="132" y="84" width="72" height="28" rx="6"/><text class="sT" x="168" y="103" text-anchor="middle">etc</text><text class="sS" x="168" y="128" text-anchor="middle">config</text>
<rect class="sN" x="228" y="84" width="72" height="28" rx="6"/><text class="sT" x="264" y="103" text-anchor="middle">var</text>
<rect class="sN" x="324" y="84" width="72" height="28" rx="6"/><text class="sT" x="360" y="103" text-anchor="middle">usr</text>
<rect class="sN" x="420" y="84" width="72" height="28" rx="6"/><text class="sT" x="456" y="103" text-anchor="middle">tmp</text><text class="sS" x="456" y="128" text-anchor="middle">scratch</text>
<rect class="sN" x="516" y="84" width="72" height="28" rx="6"/><text class="sT" x="552" y="103" text-anchor="middle">proc</text><text class="sS" x="552" y="128" text-anchor="middle">kernel</text>
<rect class="sN" x="612" y="84" width="72" height="28" rx="6"/><text class="sT" x="648" y="103" text-anchor="middle">dev</text><text class="sS" x="648" y="128" text-anchor="middle">devices</text>
<rect class="sN" x="36" y="148" width="72" height="28" rx="6"/><text class="sT" x="72" y="167" text-anchor="middle">sara</text><text class="sS" x="72" y="192" text-anchor="middle">~</text>
<rect class="sN" x="228" y="148" width="72" height="28" rx="6"/><text class="sT" x="264" y="167" text-anchor="middle">log</text><text class="sS" x="264" y="192" text-anchor="middle">logs</text>
<rect class="sN" x="324" y="148" width="72" height="28" rx="6"/><text class="sT" x="360" y="167" text-anchor="middle">bin</text><text class="sS" x="360" y="192" text-anchor="middle">programs</text>
<g data-s="1-1"><rect class="sG" x="32" y="144" width="80" height="36" rx="8" style="fill:none;stroke-width:2.5"/><text class="sT" x="20" y="236" xml:space="preserve" style="white-space:pre">$ pwd</text><text class="sGt" x="700" y="236" text-anchor="end">now in /home/sara</text></g>
<g data-s="2-2"><rect class="sG" x="224" y="144" width="80" height="36" rx="8" style="fill:none;stroke-width:2.5"/><text class="sT" x="20" y="236" xml:space="preserve" style="white-space:pre">$ cd /var/log</text><text class="sGt" x="700" y="236" text-anchor="end">now in /var/log</text><rect class="sW" x="32" y="144" width="80" height="36" rx="8" style="fill:none;stroke-width:2" stroke-dasharray="5 4"/><text class="sWt" x="20" y="216">was /home/sara</text></g>
<g data-s="3-3"><rect class="sG" x="224" y="80" width="80" height="36" rx="8" style="fill:none;stroke-width:2.5"/><text class="sT" x="20" y="236" xml:space="preserve" style="white-space:pre">$ cd ..</text><text class="sGt" x="700" y="236" text-anchor="end">now in /var</text><rect class="sW" x="224" y="144" width="80" height="36" rx="8" style="fill:none;stroke-width:2" stroke-dasharray="5 4"/><text class="sWt" x="20" y="216">was /var/log</text></g>
<g data-s="4-4"><rect class="sG" x="128" y="80" width="80" height="36" rx="8" style="fill:none;stroke-width:2.5"/><text class="sT" x="20" y="236" xml:space="preserve" style="white-space:pre">$ cd log/../../etc</text><text class="sGt" x="700" y="236" text-anchor="end">now in /etc</text><rect class="sW" x="224" y="80" width="80" height="36" rx="8" style="fill:none;stroke-width:2" stroke-dasharray="5 4"/><text class="sWt" x="20" y="216">was /var</text></g>
<g data-s="5-5"><rect class="sG" x="32" y="144" width="80" height="36" rx="8" style="fill:none;stroke-width:2.5"/><text class="sT" x="20" y="236" xml:space="preserve" style="white-space:pre">$ cd ~</text><text class="sGt" x="700" y="236" text-anchor="end">now in /home/sara</text><rect class="sW" x="128" y="80" width="80" height="36" rx="8" style="fill:none;stroke-width:2" stroke-dasharray="5 4"/><text class="sWt" x="20" y="216">was /etc</text></g>
</svg><ol class="dia-steps">
<li>pwd prints the working directory. Your home, /home/sara, is also written ~.</li>
<li>A path starting with / is absolute: it is resolved from the root, wherever you are.</li>
<li>.. means the parent directory, so you move up from /var/log to /var.</li>
<li>A path without a leading / is relative to where you are: log, up, up again to /, then etc. You land in /etc.</li>
<li>cd ~ (or plain cd) always takes you home.</li>
</ol><figcaption>One tree, no drive letters (dashed: where you were, green: where you are now): absolute paths start at /, relative paths start where you are (resolved here with posixpath).</figcaption></figure>

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

<figure class="dia steps"><svg viewBox="0 0 720 222" role="img" aria-label="The permission string rwxr-x--- split into owner, group and others; each letter is a bit worth 4, 2 or 1, and the sums give the octal digits 7, 5 and 0; examples show chmod 750, chmod +x giving 751, chmod 644 and the danger of 777">
<text class="sM" x="14" y="82">ls -l</text>
<text class="sT" x="162" y="34" text-anchor="middle">owner (app)</text>
<rect class="sB" x="98" y="52" width="40" height="40" rx="6"/><text class="sT" x="118" y="79" text-anchor="middle">r</text>
<rect class="sB" x="142" y="52" width="40" height="40" rx="6"/><text class="sT" x="162" y="79" text-anchor="middle">w</text>
<rect class="sB" x="186" y="52" width="40" height="40" rx="6"/><text class="sT" x="206" y="79" text-anchor="middle">x</text>
<text class="sT" x="294" y="34" text-anchor="middle">group (devs)</text>
<rect class="sV" x="230" y="52" width="40" height="40" rx="6"/><text class="sT" x="250" y="79" text-anchor="middle">r</text>
<rect class="sV" x="274" y="52" width="40" height="40" rx="6" opacity=".35"/><text class="sT" x="294" y="79" text-anchor="middle">-</text>
<rect class="sV" x="318" y="52" width="40" height="40" rx="6"/><text class="sT" x="338" y="79" text-anchor="middle">x</text>
<text class="sT" x="426" y="34" text-anchor="middle">others</text>
<rect class="sA" x="362" y="52" width="40" height="40" rx="6" opacity=".35"/><text class="sT" x="382" y="79" text-anchor="middle">-</text>
<rect class="sA" x="406" y="52" width="40" height="40" rx="6" opacity=".35"/><text class="sT" x="426" y="79" text-anchor="middle">-</text>
<rect class="sA" x="450" y="52" width="40" height="40" rx="6" opacity=".35"/><text class="sT" x="470" y="79" text-anchor="middle">-</text>
<g data-s="2"><text class="sS" x="14" y="126">weight</text><text class="sS" x="14" y="152">bit</text><text class="sM" x="14" y="196">octal</text><text class="sS" x="118" y="126" text-anchor="middle">4</text><text class="sGt" x="118" y="152" text-anchor="middle">1</text><text class="sS" x="162" y="126" text-anchor="middle">2</text><text class="sGt" x="162" y="152" text-anchor="middle">1</text><text class="sS" x="206" y="126" text-anchor="middle">1</text><text class="sGt" x="206" y="152" text-anchor="middle">1</text><line class="sLm" x1="104" y1="164" x2="220" y2="164"/><text class="sM" x="162" y="198" text-anchor="middle" style="font-size:26px">7</text><text class="sS" x="250" y="126" text-anchor="middle">4</text><text class="sGt" x="250" y="152" text-anchor="middle">1</text><text class="sS" x="294" y="126" text-anchor="middle">2</text><text class="sS" x="294" y="152" text-anchor="middle">0</text><text class="sS" x="338" y="126" text-anchor="middle">1</text><text class="sGt" x="338" y="152" text-anchor="middle">1</text><line class="sLm" x1="236" y1="164" x2="352" y2="164"/><text class="sM" x="294" y="198" text-anchor="middle" style="font-size:26px">5</text><text class="sS" x="382" y="126" text-anchor="middle">4</text><text class="sS" x="382" y="152" text-anchor="middle">0</text><text class="sS" x="426" y="126" text-anchor="middle">2</text><text class="sS" x="426" y="152" text-anchor="middle">0</text><text class="sS" x="470" y="126" text-anchor="middle">1</text><text class="sS" x="470" y="152" text-anchor="middle">0</text><line class="sLm" x1="368" y1="164" x2="484" y2="164"/><text class="sM" x="426" y="198" text-anchor="middle" style="font-size:26px">0</text></g>
<g data-s="3"><rect class="sN" x="512" y="26" width="194" height="186" rx="8"/><text class="sS" x="524" y="52" xml:space="preserve" style="white-space:pre">chmod 750 deploy.sh</text><text class="sGt" x="700" y="70" text-anchor="end">rwxr-x---</text><text class="sS" x="524" y="96" xml:space="preserve" style="white-space:pre">chmod +x deploy.sh</text><text class="sT" x="700" y="114" text-anchor="end">rwxr-x--x = 751</text><text class="sS" x="524" y="140" xml:space="preserve" style="white-space:pre">chmod 644 notes.txt</text><text class="sT" x="700" y="158" text-anchor="end">rw-r--r--</text><text class="sS" x="524" y="184" xml:space="preserve" style="white-space:pre">chmod 777 deploy.sh</text><text class="sRt" x="700" y="202" text-anchor="end">anyone can edit it</text></g>
</svg><ol class="dia-steps">
<li>ls -l shows nine permission letters in three groups: the owner, the owning group, and everyone else.</li>
<li>Each position is a bit worth 4 (read), 2 (write) or 1 (execute). Add the bits in each group: rwx = 7, r-x = 5, --- = 0, so the file is 750.</li>
<li>chmod takes either the three digits or a symbolic change. 777 grants write to every user and process: never the fix for a permissions error.</li>
</ol><figcaption>Reading permissions as three octal digits: letters → bits → sums.</figcaption></figure>

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

<figure class="dia anim"><svg viewBox="0 0 780 205" role="img" aria-label="Animation: lines flow from a log file through awk, sort, uniq -c, sort -rn and head, each connected by a pipe">
<rect class="sG" x="8" y="40" width="112" height="40" rx="8"/><text class="sM" x="64" y="65" text-anchor="middle">access.log</text>
<text class="sC" x="64" y="112" text-anchor="middle">41.2.0.9 GET /</text>
<text class="sC" x="64" y="130" text-anchor="middle">10.0.0.4 GET /a</text>
<text class="sC" x="64" y="148" text-anchor="middle">41.2.0.9 GET /b</text>
<line class="sL aFlow" x1="120" y1="60" x2="140" y2="60"/><text class="sM" x="130" y="34" text-anchor="middle">|</text>
<circle class="sP" r="4" cx="0" cy="0"><animateMotion dur="1.4s" begin="0.00s" repeatCount="indefinite" path="M120 60 H140"/></circle>
<circle class="sP" r="4" cx="0" cy="0"><animateMotion dur="1.4s" begin="0.70s" repeatCount="indefinite" path="M120 60 H140"/></circle>
<rect class="sA" x="140" y="40" width="112" height="40" rx="8"/><text class="sM" x="196" y="65" text-anchor="middle">awk '{print $1}'</text>
<text class="sC" x="196" y="112" text-anchor="middle">41.2.0.9</text>
<text class="sC" x="196" y="130" text-anchor="middle">10.0.0.4</text>
<text class="sC" x="196" y="148" text-anchor="middle">41.2.0.9</text>
<line class="sL aFlow" x1="252" y1="60" x2="272" y2="60"/><text class="sM" x="262" y="34" text-anchor="middle">|</text>
<circle class="sP" r="4" cx="0" cy="0"><animateMotion dur="1.4s" begin="0.25s" repeatCount="indefinite" path="M252 60 H272"/></circle>
<circle class="sP" r="4" cx="0" cy="0"><animateMotion dur="1.4s" begin="0.95s" repeatCount="indefinite" path="M252 60 H272"/></circle>
<rect class="sA" x="272" y="40" width="112" height="40" rx="8"/><text class="sM" x="328" y="65" text-anchor="middle">sort</text>
<text class="sC" x="328" y="112" text-anchor="middle">10.0.0.4</text>
<text class="sC" x="328" y="130" text-anchor="middle">41.2.0.9</text>
<text class="sC" x="328" y="148" text-anchor="middle">41.2.0.9</text>
<line class="sL aFlow" x1="384" y1="60" x2="404" y2="60"/><text class="sM" x="394" y="34" text-anchor="middle">|</text>
<circle class="sP" r="4" cx="0" cy="0"><animateMotion dur="1.4s" begin="0.50s" repeatCount="indefinite" path="M384 60 H404"/></circle>
<circle class="sP" r="4" cx="0" cy="0"><animateMotion dur="1.4s" begin="1.20s" repeatCount="indefinite" path="M384 60 H404"/></circle>
<rect class="sA" x="404" y="40" width="112" height="40" rx="8"/><text class="sM" x="460" y="65" text-anchor="middle">uniq -c</text>
<text class="sC" x="460" y="112" text-anchor="middle">1 10.0.0.4</text>
<text class="sC" x="460" y="130" text-anchor="middle">2 41.2.0.9</text>
<line class="sL aFlow" x1="516" y1="60" x2="536" y2="60"/><text class="sM" x="526" y="34" text-anchor="middle">|</text>
<circle class="sP" r="4" cx="0" cy="0"><animateMotion dur="1.4s" begin="0.75s" repeatCount="indefinite" path="M516 60 H536"/></circle>
<circle class="sP" r="4" cx="0" cy="0"><animateMotion dur="1.4s" begin="1.45s" repeatCount="indefinite" path="M516 60 H536"/></circle>
<rect class="sA" x="536" y="40" width="112" height="40" rx="8"/><text class="sM" x="592" y="65" text-anchor="middle">sort -rn</text>
<text class="sC" x="592" y="112" text-anchor="middle">2 41.2.0.9</text>
<text class="sC" x="592" y="130" text-anchor="middle">1 10.0.0.4</text>
<line class="sL aFlow" x1="648" y1="60" x2="668" y2="60"/><text class="sM" x="658" y="34" text-anchor="middle">|</text>
<circle class="sP" r="4" cx="0" cy="0"><animateMotion dur="1.4s" begin="1.00s" repeatCount="indefinite" path="M648 60 H668"/></circle>
<circle class="sP" r="4" cx="0" cy="0"><animateMotion dur="1.4s" begin="1.70s" repeatCount="indefinite" path="M648 60 H668"/></circle>
<rect class="sA" x="668" y="40" width="112" height="40" rx="8"/><text class="sM" x="724" y="65" text-anchor="middle">head -1</text>
<text class="sC" x="724" y="112" text-anchor="middle">2 41.2.0.9</text>
<text class="sS" x="8" y="14">stdout of each program → stdin of the next</text>
<text class="sS" x="390" y="190" text-anchor="middle">All six run at the same time; the kernel buffers the bytes between them.</text>
</svg><figcaption>The pipeline from §S5.4, with sample data under each stage. A pipe connects one process's standard output to the next one's standard input.</figcaption></figure>

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

<figure class="dia steps"><svg viewBox="0 0 720 188" role="img" aria-label="SSH public-key login: the client offers its public key, the server sends a random challenge, the client signs it with the private key that never leaves the laptop, and the server verifies the signature with the stored public key">
<rect class="sB" x="14" y="40" width="200" height="70" rx="8"/><text class="sT" x="114" y="73" text-anchor="middle">your laptop</text><text class="sC" x="114" y="89" text-anchor="middle">~/.ssh/id_ed25519 (private)</text>
<rect class="sB" x="506" y="40" width="200" height="70" rx="8"/><text class="sT" x="606" y="73" text-anchor="middle">server</text><text class="sC" x="606" y="89" text-anchor="middle">authorized_keys (public)</text>
<g data-s="1"><line class="sL" x1="214" y1="60" x2="502" y2="60" marker-end="url(#ah)"/><text class="sC" x="358" y="52" text-anchor="middle">"I'm azureuser, here is my public key"</text></g>
<g data-s="2"><line class="sLv" x1="502" y1="84" x2="218" y2="84" marker-end="url(#ahv)"/><text class="sC" x="358" y="102" text-anchor="middle">random challenge (bound to this session)</text></g>
<g data-s="3"><line class="sLg" x1="214" y1="128" x2="502" y2="128" marker-end="url(#ahg)"/><text class="sGt" x="358" y="122" text-anchor="middle">challenge signed with the private key</text><text class="sS" x="114" y="134" text-anchor="middle">key never leaves</text></g>
<g data-s="4"><text class="sGt" x="606" y="134" text-anchor="middle">verify with the public key ✓</text><text class="sGt" x="606" y="150" text-anchor="middle">shell opened</text></g>
<text class="sS" x="360" y="176" text-anchor="middle">a stolen authorized_keys file is harmless; protect the private key (passphrase, agent)</text>
</svg><ol class="dia-steps">
<li>The client connects and offers the public key it wants to use.</li>
<li>The server finds that key in <code>~/.ssh/authorized_keys</code> and sends a random challenge tied to this session.</li>
<li>The client signs the challenge with its <b>private</b> key. The private key itself is never sent.</li>
<li>The server checks the signature with the public key. Only the holder of the private key could have produced it, so the login succeeds.</li>
</ol><figcaption>Why key login beats passwords: nothing secret ever crosses the network.</figcaption></figure>

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

<figure class="dia"><svg viewBox="0 0 720 216" role="img" aria-label="The five cron fields of 0 2 * * *: minute 0, hour 2, any day of month, any month, any day of week, meaning 02:00 every day, with three more examples">
<rect class="sA" x="40" y="30" width="112" height="40" rx="6"/><text class="sT" x="96" y="56" text-anchor="middle">0</text>
<text class="sC" x="96" y="88" text-anchor="middle">minute</text><text class="sS" x="96" y="104" text-anchor="middle">0–59</text>
<rect class="sA" x="172" y="30" width="112" height="40" rx="6"/><text class="sT" x="228" y="56" text-anchor="middle">2</text>
<text class="sC" x="228" y="88" text-anchor="middle">hour</text><text class="sS" x="228" y="104" text-anchor="middle">0–23</text>
<rect class="sN" x="304" y="30" width="112" height="40" rx="6"/><text class="sT" x="360" y="56" text-anchor="middle">*</text>
<text class="sC" x="360" y="88" text-anchor="middle">day of month</text><text class="sS" x="360" y="104" text-anchor="middle">1–31</text>
<rect class="sN" x="436" y="30" width="112" height="40" rx="6"/><text class="sT" x="492" y="56" text-anchor="middle">*</text>
<text class="sC" x="492" y="88" text-anchor="middle">month</text><text class="sS" x="492" y="104" text-anchor="middle">1–12</text>
<rect class="sN" x="568" y="30" width="112" height="40" rx="6"/><text class="sT" x="624" y="56" text-anchor="middle">*</text>
<text class="sC" x="624" y="88" text-anchor="middle">day of week</text><text class="sS" x="624" y="104" text-anchor="middle">0–6, Sun = 0</text>
<text class="sM" x="360" y="22" text-anchor="middle">0 2 * * *  /opt/backup.sh  →  02:00 every day</text>
<text class="sC" x="120" y="128" xml:space="preserve" style="white-space:pre">*/15 * * * *</text><text class="sC" x="260" y="128">every 15 minutes</text>
<text class="sC" x="120" y="150" xml:space="preserve" style="white-space:pre">0 9 * * 1-5</text><text class="sC" x="260" y="150">09:00 Monday to Friday</text>
<text class="sC" x="120" y="172" xml:space="preserve" style="white-space:pre">30 1 1 * *</text><text class="sC" x="260" y="172">01:30 on the 1st of each month</text>
<text class="sS" x="360" y="204" text-anchor="middle">cron runs in the server's timezone with a minimal environment: use absolute paths and log the output</text>
</svg><figcaption>Reading a crontab line: five time fields, then the command.</figcaption></figure>

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

<figure class="dia"><svg viewBox="0 0 720 250" role="img" aria-label="Virtual machines each run their own guest kernel on a hypervisor; containers share the host kernel">
<text class="sT" x="170" y="22" text-anchor="middle">Virtual machines</text>
<rect class="sA" x="10" y="36" width="150" height="30" rx="5"/><text class="sC" x="85" y="55" text-anchor="middle">App A</text>
<rect class="sA" x="180" y="36" width="150" height="30" rx="5"/><text class="sC" x="255" y="55" text-anchor="middle">App B</text>
<rect class="sB" x="10" y="70" width="150" height="30" rx="5"/><text class="sC" x="85" y="89" text-anchor="middle">libraries</text>
<rect class="sB" x="180" y="70" width="150" height="30" rx="5"/><text class="sC" x="255" y="89" text-anchor="middle">libraries</text>
<rect class="sW" x="10" y="104" width="150" height="34" rx="5"/><text class="sC" x="85" y="125" text-anchor="middle">guest OS + kernel</text>
<rect class="sW" x="180" y="104" width="150" height="34" rx="5"/><text class="sC" x="255" y="125" text-anchor="middle">guest OS + kernel</text>
<rect class="sV" x="10" y="148" width="320" height="30" rx="5"/><text class="sC" x="170" y="167" text-anchor="middle">hypervisor (Hyper-V, ESXi, KVM)</text>
<rect class="sB" x="10" y="182" width="320" height="30" rx="5"/><text class="sC" x="170" y="201" text-anchor="middle">host OS / hardware</text>
<text class="sT" x="540" y="22" text-anchor="middle">Containers</text>
<rect class="sA" x="380" y="36" width="100" height="30" rx="5"/><text class="sC" x="430" y="55" text-anchor="middle">App A</text>
<rect class="sA" x="490" y="36" width="100" height="30" rx="5"/><text class="sC" x="540" y="55" text-anchor="middle">App B</text>
<rect class="sA" x="600" y="36" width="100" height="30" rx="5"/><text class="sC" x="650" y="55" text-anchor="middle">App C</text>
<rect class="sB" x="380" y="70" width="100" height="30" rx="5"/><text class="sC" x="430" y="89" text-anchor="middle">libraries</text>
<rect class="sB" x="490" y="70" width="100" height="30" rx="5"/><text class="sC" x="540" y="89" text-anchor="middle">libraries</text>
<rect class="sB" x="600" y="70" width="100" height="30" rx="5"/><text class="sC" x="650" y="89" text-anchor="middle">libraries</text>
<rect class="sV" x="380" y="104" width="320" height="34" rx="5"/><text class="sC" x="540" y="125" text-anchor="middle">container runtime (containerd, Docker)</text>
<rect class="sW" x="380" y="148" width="320" height="30" rx="5"/><text class="sC" x="540" y="167" text-anchor="middle">host OS: ONE shared kernel</text>
<rect class="sB" x="380" y="182" width="320" height="30" rx="5"/><text class="sC" x="540" y="201" text-anchor="middle">hardware</text>
<text class="sWt" x="170" y="236" text-anchor="middle">each VM boots a whole OS: GBs, minutes</text>
<text class="sGt" x="540" y="236" text-anchor="middle">each container is an isolated process: MBs, seconds</text>
</svg><figcaption>Where the boundary sits. A VM brings its own kernel; containers share one, isolated by namespaces and limited by cgroups.</figcaption></figure>

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

<figure class="dia steps"><svg viewBox="0 0 720 300" role="img" aria-label="Docker layer cache: which build steps are cached after editing code versus after adding a package, and the multi-stage final image">
<rect class="sB" x="10" y="50" width="270" height="26" rx="4"/><text class="sM" x="20" y="67">FROM sdk:10.0 AS build</text>
<rect class="sB" x="10" y="82" width="270" height="26" rx="4"/><text class="sM" x="20" y="99">WORKDIR /src</text>
<rect class="sB" x="10" y="114" width="270" height="26" rx="4"/><text class="sM" x="20" y="131">COPY *.csproj ./</text>
<rect class="sB" x="10" y="146" width="270" height="26" rx="4"/><text class="sM" x="20" y="163">RUN dotnet restore</text>
<rect class="sB" x="10" y="178" width="270" height="26" rx="4"/><text class="sM" x="20" y="195">COPY . .</text>
<rect class="sB" x="10" y="210" width="270" height="26" rx="4"/><text class="sM" x="20" y="227">RUN dotnet publish …</text>
<g data-s="1"><text class="sT" x="362" y="40" text-anchor="middle">first build</text><rect class="sA" x="300" y="50" width="124" height="26" rx="4"/><text class="sC" x="362" y="67" text-anchor="middle">built</text><rect class="sA" x="300" y="82" width="124" height="26" rx="4"/><text class="sC" x="362" y="99" text-anchor="middle">built</text><rect class="sA" x="300" y="114" width="124" height="26" rx="4"/><text class="sC" x="362" y="131" text-anchor="middle">built</text><rect class="sA" x="300" y="146" width="124" height="26" rx="4"/><text class="sC" x="362" y="163" text-anchor="middle">built</text><rect class="sA" x="300" y="178" width="124" height="26" rx="4"/><text class="sC" x="362" y="195" text-anchor="middle">built</text><rect class="sA" x="300" y="210" width="124" height="26" rx="4"/><text class="sC" x="362" y="227" text-anchor="middle">built</text></g>
<g data-s="2"><text class="sT" x="502" y="40" text-anchor="middle">edit a .cs file</text><rect class="sG" x="440" y="50" width="124" height="26" rx="4"/><text class="sC" x="502" y="67" text-anchor="middle">CACHED</text><rect class="sG" x="440" y="82" width="124" height="26" rx="4"/><text class="sC" x="502" y="99" text-anchor="middle">CACHED</text><rect class="sG" x="440" y="114" width="124" height="26" rx="4"/><text class="sC" x="502" y="131" text-anchor="middle">CACHED</text><rect class="sG" x="440" y="146" width="124" height="26" rx="4"/><text class="sC" x="502" y="163" text-anchor="middle">CACHED</text><rect class="sW" x="440" y="178" width="124" height="26" rx="4"/><text class="sC" x="502" y="195" text-anchor="middle">rebuilt</text><rect class="sW" x="440" y="210" width="124" height="26" rx="4"/><text class="sC" x="502" y="227" text-anchor="middle">rebuilt</text></g>
<g data-s="3"><text class="sT" x="642" y="40" text-anchor="middle">add a NuGet package</text><rect class="sG" x="580" y="50" width="124" height="26" rx="4"/><text class="sC" x="642" y="67" text-anchor="middle">CACHED</text><rect class="sG" x="580" y="82" width="124" height="26" rx="4"/><text class="sC" x="642" y="99" text-anchor="middle">CACHED</text><rect class="sW" x="580" y="114" width="124" height="26" rx="4"/><text class="sC" x="642" y="131" text-anchor="middle">rebuilt</text><rect class="sW" x="580" y="146" width="124" height="26" rx="4"/><text class="sC" x="642" y="163" text-anchor="middle">rebuilt</text><rect class="sW" x="580" y="178" width="124" height="26" rx="4"/><text class="sC" x="642" y="195" text-anchor="middle">rebuilt</text><rect class="sW" x="580" y="210" width="124" height="26" rx="4"/><text class="sC" x="642" y="227" text-anchor="middle">rebuilt</text></g>
<g data-s="4"><rect class="sV" x="10" y="252" width="690" height="40" rx="8"/><text class="sM" x="355" y="270" text-anchor="middle">final stage: FROM aspnet:10.0 + COPY --from=build /app/publish</text><text class="sC" x="355" y="286" text-anchor="middle">the SDK, sources and NuGet cache never reach the image you ship</text></g>
</svg><ol class="dia-steps">
<li>The first build runs every instruction, and each one produces a layer that Docker stores with a key based on its inputs.</li>
<li>Edit a <code>.cs</code> file: the project files didn't change, so the slow <code>dotnet restore</code> layer is reused. Only <code>COPY . .</code> and everything after it rebuild.</li>
<li>Add a NuGet package: a <code>.csproj</code> changed, so its <code>COPY</code> layer and every layer after it rebuild. A cache miss invalidates everything below it.</li>
<li>The final stage starts from the small runtime image and copies only the published output across. The build stage is thrown away.</li>
</ol><figcaption>Order instructions from least to most often changing, and the expensive steps stay cached.</figcaption></figure>

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

<figure class="dia anim"><svg viewBox="0 0 720 262" role="img" aria-label="Animation: a request from the browser enters through published port 80 to web, which calls api by name, which calls db by name; the database stores its files in a named volume">
<rect class="sB" x="10" y="98" width="92" height="44" rx="8"/><text class="sT" x="56" y="125" text-anchor="middle">browser</text>
<rect class="sN" x="130" y="22" width="580" height="236" rx="12"/><text class="sC" x="140" y="40">your machine (Docker host)</text>
<rect class="sB" x="186" y="54" width="424" height="164" rx="10"/><text class="sC" x="196" y="208">compose network · Docker DNS resolves service names</text>
<rect class="sW" x="122" y="92" width="30" height="20" rx="4"/><text class="sC" x="137" y="106" text-anchor="middle">:80</text>
<rect class="sW" x="116" y="162" width="42" height="20" rx="4"/><text class="sC" x="137" y="176" text-anchor="middle">:8080</text>
<rect class="sA" x="200" y="80" width="100" height="46" rx="8"/><text class="sT" x="250" y="100" text-anchor="middle">web</text><text class="sC" x="250" y="116" text-anchor="middle">nginx + Angular</text>
<rect class="sA" x="360" y="80" width="100" height="46" rx="8"/><text class="sT" x="410" y="100" text-anchor="middle">api</text><text class="sC" x="410" y="116" text-anchor="middle">ASP.NET Core</text>
<rect class="sA" x="500" y="80" width="100" height="46" rx="8"/><text class="sT" x="550" y="100" text-anchor="middle">db</text><text class="sC" x="550" y="116" text-anchor="middle">postgres</text>
<rect class="sG" x="624" y="150" width="78" height="46" rx="8"/><text class="sT" x="663" y="170" text-anchor="middle">pgdata</text><text class="sC" x="663" y="186" text-anchor="middle">volume</text>
<line class="sLm" x1="550" y1="126" x2="624" y2="170"/>
<line class="sL" x1="102" y1="112" x2="122" y2="102"/><line class="sL" x1="152" y1="102" x2="200" y2="102"/>
<line class="sL" x1="300" y1="102" x2="360" y2="102"/><text class="sM" x="330" y="72" text-anchor="middle">api:8080</text>
<line class="sL" x1="460" y1="102" x2="500" y2="102"/><text class="sM" x="480" y="72" text-anchor="middle">db:5432</text>
<path class="sD" d="M158 172 H410 V126"/>
<text class="sC" x="290" y="166" text-anchor="middle">published for debugging</text>
<circle class="sP" r="5"><animateMotion dur="4s" repeatCount="indefinite" path="M102 112 L137 102 H500 L137 102 L102 112"/></circle>
<text class="sS" x="370" y="246" text-anchor="middle">Only published ports reach the host; inside the network, services use names.</text>
</svg><figcaption>The compose file from §S5.11 as a picture. <code>localhost</code> inside the api container means the api container itself, which is why the connection string says <code>Host=db</code>.</figcaption></figure>

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
