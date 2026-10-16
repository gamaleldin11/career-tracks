# Refinement backlog

Status of the diagram and foundations refinement pass, written so the work can be picked up again later. Last updated 10 Oct 2026.

## Where things stand

- **863 diagrams** on the site (inline SVG: static, animated and step-through), up from about 600 at the start of the pass. **849 self-test questions** across the eight tracks.
- Every diagram passes both checks in `site/qa/` (see the README, "Checking diagrams"). The one remaining report is a known false positive: `DA1 fig8 SPILL "needs attention"`.
- Most new figures are **computed, not drawn by hand**: scikit-learn, PyTorch, pandas, NumPy, SciPy, Gymnasium, NLTK, SQLite, Node, `tsc` and small .NET 10 programs produced the numbers, and alt texts and captions quote those numbers.
- `E:\Career Tracks - Written Course` (the older local mirror) is synced: `modules/`, `site/quiz.js`, `site/course.js` and the templates match this repo, and its README counts are updated. Its AI Journey and Bootcamp tracks read from `E:\AI Journey - Written Course` and `E:\interview prep`, which did **not** receive this pass's AI Journey and Bootcamp changes.

## What was added in this pass (by area)

- **AI Journey:** NumPy reshape and strides; lazy map and filter; pandas internals, agg vs transform; a preprocessing pipeline; MSE as squares; test-set tuning bias; the train-dev diagnosis; residual plots; polynomial features; calibration; soft voting; stacking leakage; stemming and stopwords; BPE tokenisation; autograd; vanishing gradients; transfer learning; a CNN shape and parameter trace; scaling (tokens per parameter); a CartPole genetic algorithm and a policy-network forward pass; a case-framework loop; batch vs real-time serving; a study-plan calendar; Monty Hall and complement-rule curves.
- **Handbook:**
  - **Web, frontend and accessibility:** DNS resolution; the CSS cascade; hoisting and the TDZ; a JS equality matrix; ARIA live regions; srcset; WCAG contrast; Intl formatting; React re-renders, JSX compilation, prop drilling and error boundaries; TypeScript generics; Angular routing; Playwright auto-waiting.
  - **Fundamentals, SQL, statistics and data:** git three-way merges; Linux permissions and filesystem; Two Sum, backtracking, the bracket stack and list vs set timing; conditional aggregation; which test, and Simpson's paradox; resample and vectorisation timing; percentile_cont vs disc; window functions (running totals, MoM vs YoY); a recursive CTE walk; transaction atomicity; CSV vs Parquet measured; churn denominators; threshold from costs; the LLM approach flow; a star schema with conformed dimensions.
  - **Backend:**
    - .NET: C# equality (class, record, struct); ProblemDetails; EF Core DDL; structured logging.
    - Security and auth: password-hashing cost (a decoded Identity hash); SignalR token flow.
    - Data and operations: latency percentiles; keyset pagination timing; sargable predicates.
  - **System design:** load-balancing tail latency; serverless and managed-service cost break-evens; one-way and two-way doors; back-of-envelope chains; the FinSight-at-scale architecture.
- **Connectivity track (Oct 2026):** new Modules 18 (servers, hardware and Dell tools), 19 (cloud and identity) and 20 (PowerShell and Bash), sections 7.5 (encryption), 9.7 (Dell storage), 10.9 (Hyper-V) and 13.5 (customer handling), an 11-topic interview checklist in Orientation, about 110 new or newly animated diagrams across Modules 1–20, and new figures in SD1, SD2, SD4 and SD5 (caching, load balancing, queues, utilisation, RPO/RTO, cells, error budgets, spine-leaf).
- **Bootcamp:** MAC learning, STP, FHRP, LVM, VMware shares, RAID URE, stateful firewalls, ARP spoofing, ITIL, availability nines, 5 Whys, SD-WAN, the deleted-but-open file case, routing failure patterns.

## What is left

### AI Journey sections still without a diagram

- §5.5 and §13.5 (worked EDAs). Both need the original datasets (Supermarket Sales, UK road accidents), which are not in the repo.
- §13.6 statistical tests (needs the accident data), §13.9, §13.11.
- §17.6 Géron's default configuration (a table; a figure is optional).
- §22.2 data-efficient ViTs (a DeiT distillation-token diagram would fit), §23.5.
- §6.1, §6.9, §7.2–7.4, §7.6, §7.7, §7.9, §7.11, §8.2, §8.4, §9.6, §9.9, §11.1, §11.3, §12.3, §12.4 (mostly notebook walkthroughs and translation tables).
- §14.1, §14.5, §14.6, §25.2–25.4, §25.7 (lists, reading lists and summaries: low value for diagrams).

### Handbook sections still without a diagram (most valuable first)

- **SQL and data:** DE4.1 and DE4.8; DA3.3; DA4.7.
- **Backend:**
  - API and ASP.NET: B4.2.
  - B4.4 is deliberately skipped (SD4 already has the idempotency-key figure).
- **Frontend:** F1.2; F2.8, F2.11; F5.2, F5.3, F5.6, F5.10, F5.11; F6.8 React 19, F6.9; F7.1; F10.2.
- **System design and platform:** SD1.1.
- **Other:** S2.2, S2.7, S2.8; S4.8, S4.10 trees, S4.15; FS1.5, FS1.7, FS2.1, FS2.5 external login; DE2.4; DE7.6; DS6.6.
- Interview hubs, take-home sections and drills are intentionally text-only.

### Other follow-ups

- Copy this pass's AI Journey and Bootcamp changes into `E:\AI Journey - Written Course` and `E:\interview prep` if the mirror should show them too.
- Add quiz questions for the newest figures that still have none: AI16, AI21, AI24 §24.3, SD1.5, DE2.4 and others as figures land. Questions go in `content/quizzes.js`, FOUNDATIONS object, keyed by module id. Inside single-quoted strings, use the typographic apostrophe `’`, not `\'`.
- Keep the README counts in step: "Over 800 diagrams", "849 questions".

## How the work was done (to continue in the same style)

1. Read the section. Pick a picture that teaches something the text only states: a mechanism, a trade-off, a trap. Prefer computing it (run the real code, measure, simulate) and quote the numbers in the caption and alt text.
2. Write the SVG with the classes in the README "Writing conventions" table. Width is 720. Use `<figure class="dia steps">` with `data-s` for step-throughs, and `dia anim` for SMIL animations.
3. Pitfalls:
   - A persistent `data-s="3"` part is previewed faintly before step 3, so replacing text must be ranged (`data-s="3-N"`).
   - Never put "Part N" or "§x.y" inside SVG text in the AI Journey (sources.js rewrites them into links).
   - SVG class fill overrides the `fill` attribute; use `style="fill:none"`.
   - Leave a blank line after `</figure>`.
   - Do not insert a figure between a callout's first line and its body.
4. Run `npm run build -- --strict` with no warnings. With `npm run dev` running, run both checks from `site/qa/` (README, "Checking diagrams"); both must come back clean apart from the DA1 false positive.
5. After changing `content/modules/*.md` or `content/quizzes.js`, copy them to the mirror (`modules/`, `site/quiz.js`) and run `node site/build.js --strict` there.

Tooling notes: this machine has Python with numpy, pandas, scikit-learn, SciPy, PyTorch, Gymnasium, NLTK and Plotly (no statsmodels, and no NLTK corpora such as WordNet or punkt), plus Node, `tsc` and .NET 10. .NET file-based apps (`dotnet run x.cs` with `#:package` and `#:sdk Microsoft.NET.Sdk.Web`) produce real output; EF Core model building needs `#:property PublishAot=false`.
