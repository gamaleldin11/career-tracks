# Git and Team Workflow — Commits, Branches, Merging, Reviews

Git questions are short but revealing. An interviewer who asks "merge or rebase?" is really asking whether you've worked on a team. You have: you merged every FinSight branch and resolved the conflicts, which is a better story than most juniors can tell.

> [!focus]
> **Entry must:** explain working tree, staging area and repository; commit, branch, merge, pull and push without thinking; resolve a merge conflict; describe a pull-request workflow.
> **Mid adds:** rebase versus merge and when each is wrong; reset versus revert; recovering with reflog; a branching strategy and why; keeping secrets out of history.
> **Most asked:** *Merge vs rebase?* · *Reset vs revert?* · *How do you resolve a conflict?* · *What's in a good pull request?* · *You committed a password. What now?*
> **Time budget:** 1.5–2 hours, plus 30 minutes of practice in a scratch repository.

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
