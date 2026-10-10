# Git and Team Workflow — Commits, Branches, Merging, Reviews

Git questions are short but revealing. An interviewer who asks "merge or rebase?" is really asking whether you've worked on a team. You have: you merged every FinSight branch and resolved the conflicts, which is a better story than most juniors can tell.

> [!focus]
> **Entry must:** explain working tree, staging area and repository; commit, branch, merge, pull and push without thinking; resolve a merge conflict; describe a pull-request workflow.
> **Mid adds:** rebase versus merge and when each is wrong; reset versus revert; recovering with reflog; a branching strategy and why; keeping secrets out of history.
> **Most asked:** *Merge vs rebase?* · *Reset vs revert?* · *How do you resolve a conflict?* · *What's in a good pull request?* · *You committed a password. What now?*
> **Time budget:** 1.5–2 hours, plus 30 minutes of practice in a scratch repository.

## S2.0 Foundations: version control and what lives inside `.git` 🟢

Version control answers three questions: *what changed*, *who changed it and why*, and *how do we get back to a version that worked*. Older centralised systems (Subversion, Team Foundation Version Control) kept the history on one server, so committing or reading the log needed the network. Git is **distributed**: every clone holds the complete history. Commits, branches, diffs and logs work offline and are fast, and "pushing" simply copies commits from one complete repository to another.

### Four kinds of object

Everything Git stores sits in `.git/objects`, and there are only four kinds of object:

| Object | What it holds |
|---|---|
| **blob** | The contents of one file. No name, no date: just bytes |
| **tree** | One directory: file names mapped to blobs, folder names mapped to other trees |
| **commit** | One tree (the snapshot of the whole project), the parent commit or commits, author, date and message |
| **tag** (annotated) | A name, a message and a pointer to a commit, used for releases such as `v1.4.0` |

Every object is named by a **hash of its content** (SHA-1 by default; new repositories can choose SHA-256). Two consequences follow, and both come up in interviews:

- **Snapshots are cheap.** A file that didn't change between two commits has the same content, so the same hash, so it is stored once and both trees point to it.
- **History is tamper-evident.** Changing anything in an old commit changes its hash, which changes the parent hash recorded in its child, and so on up to the newest commit.

<figure class="dia"><svg viewBox="0 0 720 300" role="img" aria-label="Git object model: HEAD points to main, main to the newest commit; each commit points to its parent and to a tree; trees point to blobs, and unchanged blobs are shared">
<rect class="sV" x="590" y="10" width="80" height="26" rx="13"/><text class="sT" x="630" y="28" text-anchor="middle">HEAD</text>
<rect class="sW" x="590" y="52" width="80" height="26" rx="13"/><text class="sT" x="630" y="70" text-anchor="middle">main</text>
<line class="sLm" x1="630" y1="36" x2="630" y2="50" marker-end="url(#ahm)"/><line class="sLm" x1="630" y1="78" x2="630" y2="94" marker-end="url(#ahm)"/>
<rect class="sB" x="40" y="98" width="140" height="48" rx="8"/><text class="sT" x="110" y="118" text-anchor="middle">commit 1c4e…</text><text class="sS" x="110" y="136" text-anchor="middle">"Initial import"</text>
<rect class="sA" x="300" y="98" width="140" height="48" rx="8"/><text class="sT" x="370" y="118" text-anchor="middle">commit 7a9b…</text><text class="sS" x="370" y="136" text-anchor="middle">"Add alerts"</text>
<rect class="sA" x="560" y="98" width="140" height="48" rx="8"/><text class="sT" x="630" y="118" text-anchor="middle">commit e31f…</text><text class="sS" x="630" y="136" text-anchor="middle">"Fix alert parsing"</text>
<line class="sL" x1="558" y1="122" x2="444" y2="122" marker-end="url(#ah)"/><text class="sC" x="501" y="114" text-anchor="middle">parent</text>
<line class="sL" x1="298" y1="122" x2="184" y2="122" marker-end="url(#ah)"/><text class="sC" x="241" y="114" text-anchor="middle">parent</text>
<rect class="sG" x="320" y="180" width="100" height="34" rx="6"/><text class="sT" x="370" y="202" text-anchor="middle">tree</text>
<rect class="sG" x="580" y="180" width="100" height="34" rx="6"/><text class="sT" x="630" y="202" text-anchor="middle">tree</text>
<line class="sLm" x1="370" y1="146" x2="370" y2="178" marker-end="url(#ahm)"/><line class="sLm" x1="630" y1="146" x2="630" y2="178" marker-end="url(#ahm)"/>
<rect class="sB" x="230" y="250" width="130" height="36" rx="6"/><text class="sC" x="295" y="266" text-anchor="middle">blob</text><text class="sC" x="295" y="280" text-anchor="middle">Alerts.cs (v1)</text>
<rect class="sB" x="430" y="250" width="130" height="36" rx="6"/><text class="sC" x="495" y="266" text-anchor="middle">blob</text><text class="sC" x="495" y="280" text-anchor="middle">README.md</text>
<rect class="sB" x="590" y="250" width="110" height="36" rx="6"/><text class="sC" x="645" y="266" text-anchor="middle">blob</text><text class="sC" x="645" y="280" text-anchor="middle">Alerts.cs (v2)</text>
<line class="sLm" x1="350" y1="214" x2="305" y2="248" marker-end="url(#ahm)"/><line class="sLm" x1="390" y1="214" x2="480" y2="248" marker-end="url(#ahm)"/>
<line class="sLm" x1="610" y1="214" x2="510" y2="248" marker-end="url(#ahm)"/><line class="sLm" x1="645" y1="214" x2="645" y2="248" marker-end="url(#ahm)"/>
<text class="sGt" x="40" y="200">README.md didn't change,</text><text class="sGt" x="40" y="216">so both trees share one blob</text>
</svg><figcaption>The object graph. A branch and HEAD are tiny pointers; commits point to their parents and to a tree; trees point to blobs. Unchanged files are shared, which is why snapshots cost almost nothing.</figcaption></figure>

Branches and tags are just files in `.git/refs` that contain a commit hash, and `.git/HEAD` usually contains a line such as `ref: refs/heads/main`. That is the whole implementation of "a branch is a pointer".

> [!lab] Look inside your own repository
> `cat .git/HEAD` shows where HEAD points. `git cat-file -p HEAD` prints the current commit: its tree, its parent, the author and the message. `git cat-file -p HEAD^{tree}` lists that tree's files and their blob hashes. Five minutes of this makes every later section concrete.

### Local and remote repositories

A **remote** is another copy of the same repository, usually named `origin` (the one you cloned from, such as GitHub). For each branch on the remote, Git keeps a **remote-tracking branch** such as `origin/main`: your local, read-only note of where `main` was on `origin` *the last time you talked to it*. It never moves on its own.

- `git fetch` downloads new commits and moves `origin/main`. Your own `main` and your files don't change.
- `git pull` is a fetch followed by a merge or rebase into your current branch.
- `git push` uploads your commits and moves the remote's branch (and your `origin/main`) forward, but only if that is a fast-forward; otherwise it's rejected and you pull first.

<figure class="dia steps" data-start="1"><svg viewBox="0 0 720 290" role="img" aria-label="Clone, commit, a teammate's push, fetch, pull with rebase, and push shown on a local and a remote commit graph">
<text class="sT" x="180" y="24" text-anchor="middle">Your laptop</text><text class="sT" x="550" y="24" text-anchor="middle">GitHub (origin)</text>
<line class="sD" x1="380" y1="10" x2="380" y2="240"/>
<line class="sLm" x1="20" y1="170" x2="46" y2="170"/><circle class="sB" cx="60" cy="170" r="14"/><text class="sT" x="60" y="175" text-anchor="middle">C</text>
<line class="sLm" x1="390" y1="170" x2="416" y2="170"/><circle class="sB" cx="430" cy="170" r="14"/><text class="sT" x="430" y="175" text-anchor="middle">C</text>
<g data-s="1-1"><rect class="sW" x="22" y="190" width="76" height="20" rx="10"/><text class="sC" x="60" y="204" text-anchor="middle">main</text></g>
<g data-s="1-3"><rect class="sV" x="12" y="214" width="96" height="20" rx="10"/><text class="sC" x="60" y="228" text-anchor="middle">origin/main</text></g>
<g data-s="1-2"><rect class="sW" x="392" y="190" width="76" height="20" rx="10"/><text class="sC" x="430" y="204" text-anchor="middle">main</text></g>
<g data-s="2-4"><line class="sLm" x1="74" y1="170" x2="126" y2="170"/><circle class="sA" cx="140" cy="170" r="14"/><text class="sT" x="140" y="175" text-anchor="middle">D</text><rect class="sW" x="102" y="190" width="76" height="20" rx="10"/><text class="sC" x="140" y="204" text-anchor="middle">main</text></g>
<g data-s="3"><line class="sLm" x1="444" y1="170" x2="496" y2="170"/><circle class="sG" cx="510" cy="170" r="14"/><text class="sT" x="510" y="175" text-anchor="middle">E</text></g>
<g data-s="3-5"><rect class="sW" x="472" y="190" width="76" height="20" rx="10"/><text class="sC" x="510" y="204" text-anchor="middle">main</text></g>
<g data-s="4"><line class="sLm" x1="70" y1="160" x2="130" y2="118"/><circle class="sG" cx="140" cy="110" r="14"/><text class="sT" x="140" y="115" text-anchor="middle">E</text></g>
<g data-s="4-5"><rect class="sV" x="92" y="70" width="96" height="20" rx="10"/><text class="sC" x="140" y="84" text-anchor="middle">origin/main</text></g>
<g data-s="5"><line class="sLm" x1="154" y1="110" x2="206" y2="110"/><circle class="sA" cx="220" cy="110" r="14"/><text class="sT" x="220" y="115" text-anchor="middle">D′</text><rect class="sW" x="182" y="130" width="76" height="20" rx="10"/><text class="sC" x="220" y="144" text-anchor="middle">main</text></g>
<g data-s="6"><rect class="sV" x="172" y="70" width="96" height="20" rx="10"/><text class="sC" x="220" y="84" text-anchor="middle">origin/main</text><line class="sLm" x1="524" y1="170" x2="576" y2="170"/><circle class="sA" cx="590" cy="170" r="14"/><text class="sT" x="590" y="175" text-anchor="middle">D′</text><rect class="sW" x="552" y="190" width="76" height="20" rx="10"/><text class="sC" x="590" y="204" text-anchor="middle">main</text></g>
<g data-s="1-1"><line class="sL" x1="370" y1="266" x2="130" y2="266" marker-end="url(#ah)"/><text class="sM" x="250" y="258" text-anchor="middle">git clone: copy everything</text></g>
<g data-s="2-2"><text class="sM" x="20" y="266">git commit: only your main moves</text></g>
<g data-s="3-3"><text class="sM" x="400" y="266">a teammate pushes E</text></g>
<g data-s="4-4"><line class="sL" x1="430" y1="266" x2="200" y2="266" marker-end="url(#ah)"/><text class="sM" x="315" y="258" text-anchor="middle">git fetch: E arrives, origin/main moves</text></g>
<g data-s="5-5"><text class="sM" x="20" y="266">git pull --rebase: D is replayed on E as D′</text></g>
<g data-s="6-6"><line class="sL" x1="200" y1="266" x2="560" y2="266" marker-end="url(#ah)"/><text class="sM" x="380" y="258" text-anchor="middle">git push: a fast-forward on origin</text></g>
</svg><ol class="dia-steps">
<li>Cloning copies the whole history. Your <code>main</code> and your note of the remote, <code>origin/main</code>, both point at C.</li>
<li>You commit D. Only your local <code>main</code> moves; GitHub knows nothing yet.</li>
<li>Meanwhile a teammate pushes E to GitHub. Your <code>origin/main</code> still says C, because you haven't asked.</li>
<li><code>git fetch</code> downloads E and moves <code>origin/main</code>. Your branch and files are untouched, and the two lines of work have diverged.</li>
<li><code>git pull --rebase</code> replays your D on top of E as a new commit, D′ (new parent, so a new hash). A plain <code>git pull</code> would create a merge commit instead.</li>
<li><code>git push</code> is now a fast-forward for GitHub's <code>main</code>, so it's accepted, and <code>origin/main</code> moves too.</li>
</ol><figcaption>Local and remote branches. "Your branch is behind origin/main by 2 commits" compares against your last fetch, not against GitHub right now.</figcaption></figure>

> [!term] Remote-tracking branch
> A read-only local branch such as `origin/main` that records where a branch on the remote pointed the last time you fetched, pulled or pushed. `git status` compares your branch with it.

## S2.1 How Git thinks 🟢 ⭐

Git stores **snapshots**, not diffs. Each **commit** records the full state of the tracked files (cleverly deduplicated), a message, an author, and a pointer to its **parent** commit(s). Commits form a **directed acyclic graph**, and every commit is named by a hash of its content, so history can't be silently altered.

> [!term] Branch
> A movable pointer to a commit, nothing more. Creating a branch is instant and costs a few bytes. When you commit on a branch, the pointer moves forward to the new commit.

> [!term] HEAD
> A pointer to "where you are now", usually to the current branch. "Detached HEAD" means it points straight at a commit rather than a branch, so new commits there belong to no branch until you create one.

<figure class="dia"><svg viewBox="0 0 720 170" role="img" aria-label="Working tree, staging area and repository with the commands that move changes between them">
<rect class="sB" x="20" y="40" width="170" height="70" rx="10"/><text class="sT" x="105" y="70" text-anchor="middle">Working tree</text><text class="sS" x="105" y="90" text-anchor="middle">the files you edit</text>
<rect class="sW" x="275" y="40" width="170" height="70" rx="10"/><text class="sT" x="360" y="70" text-anchor="middle">Staging area (index)</text><text class="sS" x="360" y="90" text-anchor="middle">the next commit, prepared</text>
<rect class="sA" x="530" y="40" width="170" height="70" rx="10"/><text class="sT" x="615" y="70" text-anchor="middle">Repository</text><text class="sS" x="615" y="90" text-anchor="middle">.git — commits</text>
<line class="sL" x1="190" y1="60" x2="275" y2="60"/><text class="sM" x="203" y="52">git add</text>
<line class="sL" x1="445" y1="60" x2="530" y2="60"/><text class="sM" x="455" y="52">git commit</text>
<line class="sD" x1="275" y1="95" x2="190" y2="95"/><text class="sM" x="196" y="125">git restore --staged</text>
<line class="sD" x1="530" y1="95" x2="190" y2="140"/><text class="sM" x="355" y="155">git restore / switch / checkout</text>
</svg><figcaption>The three areas. The staging area lets you commit part of your changes as one clean, focused commit.</figcaption></figure>

> [!say]
> "Git stores snapshots as a graph of commits, each pointing to its parent. A branch is just a pointer to a commit and HEAD says where I am. I edit in the working tree, stage exactly what belongs in the next commit, and commit it to the repository."

## S2.2 The commands you use every day 🟢

```bash
git status                      # what changed, what's staged
git switch -c feature/alerts    # create and move to a new branch (older: git checkout -b)
git add -p                      # stage hunk by hunk: the habit that makes clean commits
git commit -m "Add CFO alert parsing"
git fetch origin                # download others' work without touching your files
git pull --rebase origin main   # fetch, then replay your local commits on top
git push -u origin feature/alerts
git log --oneline --graph --all # see the shape of history
git diff                        # unstaged changes;  git diff --staged  for staged ones
```

`git pull` is `git fetch` followed by a merge (or a rebase, with `--rebase` or `pull.rebase=true`). Knowing that one fact answers half the "why did my pull create a weird merge commit?" questions.

## S2.3 Merge versus rebase 🟢 🟡 ⭐

Both bring work from one branch into another. They differ in what history looks like afterwards.

| | `git merge feature` | `git rebase main` (on the feature branch) |
|---|---|---|
| What it does | Creates a **merge commit** with two parents (unless a fast-forward is possible) | **Replays** your commits one by one on top of the new base, creating new commits with new hashes |
| History | True record of what happened, including parallel work | Linear, as if you'd started from the latest main |
| Rewrites history? | No | **Yes**, so the old commits are replaced |
| Conflicts | Resolved once | May be resolved per replayed commit |
| Safe on shared branches? | Yes | **No**, never rebase commits other people have pulled |

<figure class="dia steps" data-start="1"><svg viewBox="0 0 720 280" role="img" aria-label="The same diverged history integrated by a merge commit, and by a rebase followed by a fast-forward">
<line class="sLm" x1="20" y1="110" x2="46" y2="110"/>
<circle class="sB" cx="60" cy="110" r="14"/><text class="sT" x="60" y="115" text-anchor="middle">A</text>
<line class="sLm" x1="74" y1="110" x2="126" y2="110"/><circle class="sB" cx="140" cy="110" r="14"/><text class="sT" x="140" y="115" text-anchor="middle">B</text>
<line class="sLm" x1="154" y1="110" x2="206" y2="110"/><circle class="sB" cx="220" cy="110" r="14"/><text class="sT" x="220" y="115" text-anchor="middle">C</text>
<g data-s="1-2"><line class="sLm" x1="150" y1="120" x2="208" y2="182"/><circle class="sA" cx="220" cy="190" r="14"/><text class="sT" x="220" y="195" text-anchor="middle">D</text><line class="sLm" x1="234" y1="190" x2="286" y2="190"/><circle class="sA" cx="300" cy="190" r="14"/><text class="sT" x="300" y="195" text-anchor="middle">E</text><rect class="sV" x="262" y="212" width="76" height="20" rx="10"/><text class="sC" x="300" y="226" text-anchor="middle">feature</text></g>
<g data-s="1-1"><rect class="sW" x="182" y="62" width="76" height="20" rx="10"/><text class="sC" x="220" y="76" text-anchor="middle">main</text></g>
<g data-s="2-2"><line class="sLm" x1="234" y1="110" x2="366" y2="110"/><line class="sLm" x1="312" y1="182" x2="370" y2="122"/><circle class="sW" cx="380" cy="110" r="16"/><text class="sT" x="380" y="115" text-anchor="middle">M</text><rect class="sW" x="342" y="62" width="76" height="20" rx="10"/><text class="sC" x="380" y="76" text-anchor="middle">main</text><text class="sS" x="420" y="150">M has two parents, C and E.</text><text class="sS" x="420" y="168">History shows the parallel work.</text></g>
<g data-s="3-4"><circle class="sN" cx="220" cy="190" r="14" stroke-dasharray="3 3"/><text class="sC" x="220" y="195" text-anchor="middle">D</text><circle class="sN" cx="300" cy="190" r="14" stroke-dasharray="3 3"/><text class="sC" x="300" y="195" text-anchor="middle">E</text><text class="sC" x="340" y="195">old commits, now unreachable</text>
<line class="sLm" x1="234" y1="110" x2="286" y2="110"/><circle class="sA" cx="300" cy="110" r="14"/><text class="sT" x="300" y="115" text-anchor="middle">D′</text><line class="sLm" x1="314" y1="110" x2="366" y2="110"/><circle class="sA" cx="380" cy="110" r="14"/><text class="sT" x="380" y="115" text-anchor="middle">E′</text>
<rect class="sV" x="342" y="130" width="76" height="20" rx="10"/><text class="sC" x="380" y="144" text-anchor="middle">feature</text></g>
<g data-s="3-3"><rect class="sW" x="182" y="62" width="76" height="20" rx="10"/><text class="sC" x="220" y="76" text-anchor="middle">main</text></g>
<g data-s="4"><rect class="sW" x="342" y="62" width="76" height="20" rx="10"/><text class="sC" x="380" y="76" text-anchor="middle">main</text><text class="sS" x="420" y="100">main just slides forward:</text><text class="sS" x="420" y="118">a fast-forward, no merge commit</text></g>
<g data-s="1-1"><text class="sM" x="20" y="262">The starting point: main and feature have diverged since B.</text></g>
<g data-s="2-2"><text class="sM" x="20" y="262">git switch main; git merge feature</text></g>
<g data-s="3-3"><text class="sM" x="20" y="262">git switch feature; git rebase main</text></g>
<g data-s="4-4"><text class="sM" x="20" y="262">git switch main; git merge feature  (now a fast-forward)</text></g>
</svg><ol class="dia-steps">
<li>Both branches moved on after B: main got C, the feature branch got D and E.</li>
<li>Merging creates M, a commit with two parents. Nothing is rewritten, so this is always safe on shared branches.</li>
<li>Rebasing replays D and E on top of C as new commits D′ and E′, with new hashes. The old D and E still exist (reflog can find them) but no branch points to them.</li>
<li>Main hasn't moved since C, so merging the rebased branch just slides the pointer forward. History is a straight line.</li>
</ol><figcaption>Merge versus rebase, on the same history. Use Play to compare the two outcomes.</figcaption></figure>

> [!term] Fast-forward
> If the target branch hasn't moved since you branched, Git can just slide its pointer forward to your latest commit, with no merge commit needed. `--no-ff` forces a merge commit anyway, to keep a visible record of the feature.

> [!term] Squash merge
> Combines all of a branch's commits into a single new commit on the target. It keeps `main` tidy (one commit per pull request), at the cost of losing the branch's step-by-step history on `main`.

**The golden rule:** rebase your own local or private branch freely to tidy it before review; once others have based work on those commits, use merge.

> [!say]
> "Merge keeps the true history and adds a merge commit; rebase rewrites my commits on top of the new base so history is linear. I rebase my own feature branch onto main before opening a pull request, but I never rebase a branch other people have pulled, because it changes the commit hashes under them."

## S2.4 Resolving a merge conflict 🟢 ⭐

A conflict happens when both sides changed the **same lines** (or one deleted a file the other edited). Git stops and marks the file:

```text
<<<<<<< HEAD
var cutoff = DateTime.UtcNow.AddDays(-90);
=======
var cutoff = _clock.UtcNow.AddDays(-settings.ForecastWindowDays);
>>>>>>> feature/forecast-window
```

<figure class="dia steps"><svg viewBox="0 0 720 230" role="img" aria-label="A three-way merge: the merge base, our branch that renamed the method and changed the cutoff line, and the feature branch that changed the same cutoff line and sorted the result; Git applies the rename and the sort automatically and marks the cutoff line as a conflict, which is resolved by combining both intentions">
<text class="sT" x="18" y="30">merge base (common ancestor)</text><text class="sS" x="20" y="54" xml:space="preserve" style="white-space:pre">Invoice[] Overdue()</text><text class="sS" x="20" y="71" xml:space="preserve" style="white-space:pre">{</text><text class="sS" x="20" y="88" xml:space="preserve" style="white-space:pre">    var cutoff = DateTime.Now.AddDays(-90);</text><text class="sS" x="20" y="105" xml:space="preserve" style="white-space:pre">    var due = Due(cutoff);</text><text class="sS" x="20" y="122" xml:space="preserve" style="white-space:pre">    return due;</text><text class="sS" x="20" y="139" xml:space="preserve" style="white-space:pre">}</text>
<g data-s="2-2"><text class="sT" x="376" y="30">HEAD (main): ours</text><rect class="sB" x="372" y="42" width="330" height="16" rx="3" opacity=".4"/><text class="sS" x="378" y="54" xml:space="preserve" style="white-space:pre">Invoice[] OverdueInvoices()</text><text class="sS" x="378" y="71" xml:space="preserve" style="white-space:pre">{</text><rect class="sB" x="372" y="76" width="330" height="16" rx="3" opacity=".4"/><text class="sS" x="378" y="88" xml:space="preserve" style="white-space:pre">    var cutoff = DateTime.UtcNow.AddDays(-90);</text><text class="sS" x="378" y="105" xml:space="preserve" style="white-space:pre">    var due = Due(cutoff);</text><text class="sS" x="378" y="122" xml:space="preserve" style="white-space:pre">    return due;</text><text class="sS" x="378" y="139" xml:space="preserve" style="white-space:pre">}</text><text class="sS" x="178" y="176" text-anchor="middle">ours changed lines 1 and 3</text></g>
<g data-s="3-3"><text class="sT" x="376" y="30">feature/forecast-window: theirs</text><text class="sS" x="378" y="54" xml:space="preserve" style="white-space:pre">Invoice[] Overdue()</text><text class="sS" x="378" y="71" xml:space="preserve" style="white-space:pre">{</text><rect class="sV" x="372" y="76" width="330" height="16" rx="3" opacity=".4"/><text class="sS" x="378" y="88" xml:space="preserve" style="white-space:pre">    var cutoff = _clock.UtcNow.AddDays(-_window);</text><text class="sS" x="378" y="105" xml:space="preserve" style="white-space:pre">    var due = Due(cutoff);</text><rect class="sV" x="372" y="110" width="330" height="16" rx="3" opacity=".4"/><text class="sS" x="378" y="122" xml:space="preserve" style="white-space:pre">    return due.OrderBy(i =&gt; i.Due);</text><text class="sS" x="378" y="139" xml:space="preserve" style="white-space:pre">}</text><text class="sS" x="178" y="176" text-anchor="middle">theirs changed lines 3 and 5</text></g>
<g data-s="4-4"><text class="sT" x="376" y="30">git merge: result in the file</text><rect class="sB" x="372" y="42" width="330" height="16" rx="3" opacity=".4"/><text class="sS" x="378" y="54" xml:space="preserve" style="white-space:pre">Invoice[] OverdueInvoices()</text><text class="sS" x="378" y="71" xml:space="preserve" style="white-space:pre">{</text><rect class="sR" x="372" y="76" width="330" height="16" rx="3" opacity=".4"/><text class="sS" x="378" y="88" xml:space="preserve" style="white-space:pre">&lt;&lt;&lt;&lt;&lt;&lt;&lt; HEAD</text><rect class="sR" x="372" y="93" width="330" height="16" rx="3" opacity=".4"/><text class="sS" x="378" y="105" xml:space="preserve" style="white-space:pre">    var cutoff = DateTime.UtcNow.AddDays(-90);</text><rect class="sR" x="372" y="110" width="330" height="16" rx="3" opacity=".4"/><text class="sS" x="378" y="122" xml:space="preserve" style="white-space:pre">=======</text><rect class="sR" x="372" y="127" width="330" height="16" rx="3" opacity=".4"/><text class="sS" x="378" y="139" xml:space="preserve" style="white-space:pre">    var cutoff = _clock.UtcNow.AddDays(-_window);</text><rect class="sR" x="372" y="144" width="330" height="16" rx="3" opacity=".4"/><text class="sS" x="378" y="156" xml:space="preserve" style="white-space:pre">&gt;&gt;&gt;&gt;&gt;&gt;&gt; feature/forecast-window</text><text class="sS" x="378" y="173" xml:space="preserve" style="white-space:pre">    var due = Due(cutoff);</text><rect class="sV" x="372" y="178" width="330" height="16" rx="3" opacity=".4"/><text class="sS" x="378" y="190" xml:space="preserve" style="white-space:pre">    return due.OrderBy(i =&gt; i.Due);</text><text class="sS" x="378" y="207" xml:space="preserve" style="white-space:pre">}</text><text class="sS" x="178" y="176" text-anchor="middle">one side changed → Git takes it</text><text class="sRt" x="178" y="194" text-anchor="middle">both changed line 3 → conflict</text></g>
<g data-s="5-5"><text class="sT" x="376" y="30">resolved by hand</text><text class="sS" x="378" y="54" xml:space="preserve" style="white-space:pre">Invoice[] OverdueInvoices()</text><text class="sS" x="378" y="71" xml:space="preserve" style="white-space:pre">{</text><rect class="sG" x="372" y="76" width="330" height="16" rx="3" opacity=".4"/><text class="sS" x="378" y="88" xml:space="preserve" style="white-space:pre">    var cutoff = _clock.UtcNow.AddDays(-_window);</text><text class="sS" x="378" y="105" xml:space="preserve" style="white-space:pre">    var due = Due(cutoff);</text><text class="sS" x="378" y="122" xml:space="preserve" style="white-space:pre">    return due.OrderBy(i =&gt; i.Due);</text><text class="sS" x="378" y="139" xml:space="preserve" style="white-space:pre">}</text><text class="sS" x="178" y="176" text-anchor="middle">keep the injected clock and the</text><text class="sS" x="178" y="194" text-anchor="middle">window setting (default 90 days)</text><text class="sGt" x="178" y="218" text-anchor="middle">then build, test, git add, commit</text></g>
</svg><ol class="dia-steps">
<li>Git compares both branches with their merge base, the last commit they share.</li>
<li>Your branch renamed the method (line 1) and switched to UtcNow (line 3).</li>
<li>The feature branch injected a clock and a configurable window (line 3) and sorted the result (line 5).</li>
<li>git merge takes each change made on one side only, automatically. Line 3 changed on both sides, so Git writes conflict markers and stops.</li>
<li>Resolving means understanding both intentions: here, combine them. Remove the markers, build and run the tests before committing.</li>
</ol><figcaption>A three-way merge, computed with git merge-file: Git only stops on lines that both sides changed.</figcaption></figure>

The routine:

1. `git status` lists the conflicted files.
2. For each one, **understand both intentions** before editing. Often the right answer combines them: here, use the injected clock *and* keep 90 as the configured default.
3. Remove the markers, build and **run the tests**.
4. `git add` the file, then `git commit` (for a merge) or `git rebase --continue` (for a rebase). `git merge --abort` or `git rebase --abort` gets you out if it goes wrong.

> [!story]
> You merged every FinSight team branch (Unit of Work, Alerts, the scenario simulator, Admin, the UI and Google sign-in) and resolved the conflicts. In an interview, tell **one** conflict in detail. Two branches both touched the same file. You talked to the author to understand their intention, combined the changes, ran the tests, and agreed a convention that stopped it happening again. That's a collaboration answer and a Git answer at once.

> [!mistake] Picking "ours" for everything
> Accepting your side wholesale makes the conflict disappear, and the other person's work disappears with it. If you don't understand their change, ask them.

## S2.5 Undoing things safely 🟢 🟡 ⭐

| Situation | Command | Rewrites history? |
|---|---|---|
| Discard unstaged edits in a file | `git restore file.cs` | No (but the edits are gone) |
| Unstage a file | `git restore --staged file.cs` | No |
| Fix the last commit's message, or add a forgotten file | `git commit --amend` | Yes (last commit only) |
| Move the branch back, keep changes **staged** | `git reset --soft HEAD~1` | Yes |
| Move the branch back, keep changes **unstaged** (the default) | `git reset HEAD~1` (`--mixed`) | Yes |
| Move the branch back and **throw changes away** | `git reset --hard HEAD~1` | Yes |
| Undo a commit that's **already pushed** and shared | `git revert <sha>` (a new commit that inverts it) | No |
| Put work aside to switch branches | `git stash`, then `git stash pop` | No |
| Copy one commit onto the current branch | `git cherry-pick <sha>` | No (new commit) |
| "I lost a commit after a bad reset or rebase" | `git reflog`, then `git reset --hard <sha>` or `git branch rescue <sha>` | — |

<figure class="dia"><svg viewBox="0 0 720 250" role="img" aria-label="What git reset --soft, --mixed and --hard change: the branch pointer, the staging area and the working tree">
<line class="sLm" x1="40" y1="40" x2="86" y2="40"/><circle class="sB" cx="100" cy="40" r="14"/><text class="sT" x="100" y="45" text-anchor="middle">A</text>
<line class="sLm" x1="114" y1="40" x2="166" y2="40"/><circle class="sA" cx="180" cy="40" r="14"/><text class="sT" x="180" y="45" text-anchor="middle">B</text>
<line class="sD" x1="194" y1="40" x2="246" y2="40"/><circle class="sN" cx="260" cy="40" r="14" stroke-dasharray="3 3"/><text class="sC" x="260" y="45" text-anchor="middle">C</text>
<path class="sLw" d="M260 64 Q220 84 186 64" marker-end="url(#ahw)"/><text class="sM" x="300" y="36">git reset HEAD~1</text><text class="sS" x="300" y="56">moves main (and HEAD) from C back to B;</text><text class="sS" x="300" y="72">reflog still remembers C</text>
<text class="sT" x="275" y="112" text-anchor="middle">Branch pointer</text><text class="sT" x="455" y="112" text-anchor="middle">Staging area</text><text class="sT" x="635" y="112" text-anchor="middle">Working tree</text>
<text class="sM" x="20" y="146">--soft</text><rect class="sW" x="190" y="128" width="170" height="28" rx="6"/><text class="sC" x="275" y="146" text-anchor="middle">moved to B</text><rect class="sG" x="370" y="128" width="170" height="28" rx="6"/><text class="sC" x="455" y="146" text-anchor="middle">kept: C's changes staged</text><rect class="sG" x="550" y="128" width="170" height="28" rx="6"/><text class="sC" x="635" y="146" text-anchor="middle">kept</text>
<text class="sM" x="20" y="186">--mixed</text><text class="sC" x="20" y="200">(default)</text><rect class="sW" x="190" y="168" width="170" height="28" rx="6"/><text class="sC" x="275" y="186" text-anchor="middle">moved to B</text><rect class="sW" x="370" y="168" width="170" height="28" rx="6"/><text class="sC" x="455" y="186" text-anchor="middle">reset to match B</text><rect class="sG" x="550" y="168" width="170" height="28" rx="6"/><text class="sC" x="635" y="186" text-anchor="middle">kept: changes unstaged</text>
<text class="sM" x="20" y="226">--hard</text><rect class="sW" x="190" y="208" width="170" height="28" rx="6"/><text class="sC" x="275" y="226" text-anchor="middle">moved to B</text><rect class="sW" x="370" y="208" width="170" height="28" rx="6"/><text class="sC" x="455" y="226" text-anchor="middle">reset to match B</text><rect class="sR" x="550" y="208" width="170" height="28" rx="6"/><text class="sC" x="635" y="226" text-anchor="middle">overwritten: edits lost</text>
</svg><figcaption>The three reset modes differ only in how far the reset reaches. Uncommitted edits destroyed by <code>--hard</code> are the one thing reflog can't bring back.</figcaption></figure>

> [!term] reflog
> A local log of where HEAD and each branch pointed, recording every move. By default, entries are kept for 90 days, or 30 days for commits that no branch can reach any more (`gc.reflogExpire` and `gc.reflogExpireUnreachable`). It's how you recover from almost any mistake, even `reset --hard`, as long as the work had been committed.

> [!say]
> "Reset moves the branch pointer back and rewrites history, so I only use it on local commits. Revert adds a new commit that undoes an old one, so it's safe on shared branches. If I ever lose something, reflog shows every position HEAD has been at."

## S2.6 Branching strategies 🟡

| Strategy | Shape | Fits |
|---|---|---|
| **GitHub flow** | `main` is always deployable; short-lived feature branches; pull request → review → merge → deploy | Most web teams and startups; your FinSight team effectively did this |
| **Trunk-based development** | Everyone integrates to `main` at least daily; unfinished work hidden behind **feature flags** | Teams with strong CI and continuous deployment |
| **Git Flow** | `main` + `develop` + feature, release and hotfix branches | Software shipped in versions (desktop apps, on-premise releases); heavy for web apps |

> [!term] Feature flag
> A runtime switch that turns a feature on or off without deploying, so unfinished code can be merged safely and features can be rolled out to some users first.

**Naming that reviewers like:** `feature/KAN-159-cash-flow-chart`, `fix/tenant-filter-leak`, `chore/upgrade-dotnet-10`. Including the Jira key links the branch to the ticket automatically in most tools.

## S2.7 Commits and pull requests that reviewers love 🟢 ⭐

**A good commit** does one thing, builds, and has a message that explains *why*:

```text
fix(forecast): fill missing days before calling TimeGPT

TimeGPT needs a continuous daily series, but real transactions
skip weekends and holidays. Aggregate per day and insert zero rows
for gaps so the API stops rejecting sparse tenants.

Refs: KAN-162
```

That's the **Conventional Commits** style (`type(scope): summary`, with types like `feat`, `fix`, `docs`, `refactor`, `test` and `chore`). Many teams use it so changelogs and version numbers can be generated automatically.

**A good pull request:**

- is **small**, with a few hundred changed lines at most. Large pull requests get rubber-stamped, not reviewed;
- has a description: *what* changed, *why*, *how to test it*, and screenshots for UI changes;
- passes CI (build, tests, lint) before anyone is asked to look;
- links the ticket.

**Being a good reviewer:** comment on the code, not the person; separate "must fix" from "nit"; ask questions ("what happens if this list is empty?") rather than issuing orders; approve when it's better than before, not when it's how you'd have written it.

## S2.8 Secrets, large files and things that must not be in Git 🟢 🟡 ⭐

**What goes in `.gitignore`:** build output (`bin/`, `obj/`, `dist/`, `node_modules/`), local settings (`appsettings.Development.json` if it holds secrets, `.env`), IDE folders, data dumps.

**"I committed a password." What now?** In this order:

1. **Rotate the secret immediately.** Assume it's compromised the moment it was pushed. Deleting it in a new commit does nothing; it's still in history and in every clone.
2. Remove it from history with `git filter-repo` (or BFG Repo-Cleaner), then force-push and ask everyone to re-clone.
3. Prevent a repeat: secrets in environment variables, a secret store (Azure Key Vault, GitHub Actions secrets), .NET **User Secrets** for local development, and a pre-commit or CI secret scanner. GitHub's secret scanning and push protection catch many known token formats.

> [!story]
> Your July FinSight hardening sweep started with **scrubbing secrets** (WS1). Tell it in that order: rotate first, then clean history, then move configuration to environment variables, then add a check so it can't recur. Interviewers listen for "rotate first".

> [!say]
> "First I rotate the credential, because once it's pushed it's compromised; removing it in a new commit doesn't take it out of history. Then I rewrite history with git filter-repo and force-push, and I move secrets to environment variables or a vault with a scanner in CI so it can't happen again."

**Large files and data:** Git is built for text. Binary datasets and model files bloat every clone forever. Use **Git LFS** for necessary binaries, **DVC** (Data Version Control) for datasets and models in data-science projects, and keep raw data in object storage with only the pointer in Git.

**Notebooks:** `.ipynb` files contain outputs and metadata that make diffs unreadable and can leak data. Clear outputs before committing (`nbstripout` does this automatically), or pair notebooks with plain `.py` files using Jupytext.

## S2.9 Git in CI and automation 🟢

Every push or pull request can trigger a pipeline: restore, build, test, lint, scan, and package. A pull request can then require **status checks** to pass and **reviews** before merge (branch protection rules). [[S10]] covers pipelines in depth.

> [!story]
> CS Visualizer's GitHub Actions workflow builds with warnings as errors, runs the differential and golden tests, type-checks and builds the front end, and publishes a non-root container image to GitHub Container Registry. That's a complete answer to "have you set up CI?".

> [!lab] Ten-minute Git gym
> In an empty folder: `git init`, make three commits on `main`, branch to `feature`, change the same line on both branches, then **merge** and resolve the conflict. Undo it with `git reset --hard ORIG_HEAD`, then do the same thing with **rebase** and compare `git log --graph`. Finally `git reset --hard HEAD~2` and recover the commits from `git reflog`. After this, every question in this module is something you've done.

## S2.10 Interview drill 🟢 ⭐

| Question | Strong short answer |
|---|---|
| What's the staging area for? | It lets you choose exactly which changes go into the next commit, so each commit is focused. |
| What is a branch in Git? | A lightweight movable pointer to a commit. |
| Merge vs rebase? | Merge preserves history and adds a merge commit; rebase replays commits on a new base for linear history but rewrites hashes, so only rebase unshared work. |
| Reset vs revert? | Reset moves the branch pointer back and rewrites history (local use only); revert creates a new commit that undoes an old one, which is safe for shared branches. |
| `git fetch` vs `git pull`? | Fetch downloads remote commits without changing your branch; pull is fetch plus merge (or rebase). |
| How do you resolve a conflict? | Find the conflicted files, understand both changes, combine them correctly, remove the markers, build and test, then add and continue. |
| You committed an API key. What do you do? | Rotate it immediately, purge it from history with filter-repo and force-push, then move secrets to a vault or environment variables and add secret scanning. |
| How do you get back a commit you lost after a reset? | Find its hash in `git reflog` and reset or branch to it. |
| What makes a good pull request? | Small, one purpose, clear why and how to test, passing CI, linked ticket. |
| What's a fast-forward merge? | When the target hasn't diverged, Git just moves its pointer forward to the branch tip without a merge commit. |
| GitHub flow vs Git Flow? | GitHub flow has one always-deployable main and short feature branches; Git Flow adds develop, release and hotfix branches for versioned releases. |
| What's `git stash`? | It shelves uncommitted changes so you can switch context, and `stash pop` restores them. |
| How do you version a 2 GB dataset? | Not in plain Git: use DVC or object storage with a pointer, or Git LFS for a few necessary binaries. |

## Key takeaways

> [!check]
> - A commit is a snapshot with a parent; a branch is a pointer; HEAD is where you are.
> - Rebase private work for a clean history; merge shared work. Never rewrite what others have pulled.
> - Revert on shared branches, reset on local ones, and reflog when things go wrong.
> - A leaked secret is rotated first and cleaned second.
> - Small, well-described pull requests with green CI get reviewed properly.

## Sources

- Scott Chacon and Ben Straub, [*Pro Git*, 2nd ed.](https://git-scm.com/book/en/v2) (free, official): chapters on Git basics, branching, rebasing and Git tools.
- Git reference: [git-reset](https://git-scm.com/docs/git-reset), [git-revert](https://git-scm.com/docs/git-revert), [git-reflog](https://git-scm.com/docs/git-reflog), [git-rebase](https://git-scm.com/docs/git-rebase).
- GitHub Docs: [GitHub flow](https://docs.github.com/en/get-started/using-github/github-flow), [Removing sensitive data from a repository](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository), [Secret scanning](https://docs.github.com/en/code-security/secret-scanning/introduction/about-secret-scanning).
- [Conventional Commits 1.0.0](https://www.conventionalcommits.org/en/v1.0.0/) · [trunkbaseddevelopment.com](https://trunkbaseddevelopment.com/) · [DVC documentation](https://dvc.org/doc).
