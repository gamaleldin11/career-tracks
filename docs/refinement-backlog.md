# Refinement backlog

Status of the diagram and foundations refinement pass, written so the work can be picked up again later. Last updated 21 Nov 2026.

## Where things stand

- **1,127 diagrams** on the site (inline SVG: static, animated and step-through; 928 of them animated or stepped), up from about 600 at the start of the pass. **1,247 self-test questions** across the eight tracks.
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

- **November 2026 pass:** cited study guides at `/guides` (32 pages: see the README); measured or simulated figures for AI2.1 (list vs NumPy), AI9.12 (Swiss roll, PCA vs LLE), AI9.16 (inertia vs silhouette, k-means++), AI15.1 (mean vs median under outliers), AI15.6 (Student vs Welch false positives), AI18.6 (training vs inference memory), S3.10 (SQLite index seek, leftmost prefix, write cost), B12.3 (consistent hashing), DS4.8 (sliced AUC), DS5.7 (loyalty programme estimates); drawn step-throughs for S2.6 (branching strategies), F1.5 (WCAG 2.2 focus and target size), DE8.5 (Avro schema evolution) and an animated store map in B6.8; later in the pass AI3.9, AI5.6, AI5.7, AI8B.2, AI9.5, AI9.14, AI9.15, AI11.7, F5.4, F7.10, F10.9, DS6.4, DE2.2, DE3.7, DE5.1 and DE9.5. Most have a quiz question, and AI19, AI20 and AI22 gained interview-drill questions. Then a run of real or computed examples: S7.9, B6.9, B2.7, DS2.10, F8.5, AI13.7 (VIF), DS5.5, DE1.7, B5.9, S9.12, B9.9, S2.9, F1.11, DS6.1, DS6.9, F10.10, B1.4, S9.1 (SQLite injection), DS1.7, DS8.8, F2.10, F9.10 (this site measured in production: about 180,000 DOM elements, a candidate for lazy module rendering), DA4.10 (column size by cardinality), DS3.8 (scaling on UCI Wine), S3.1 (SQLite key constraints), B4.1 (a real REST exchange), F7.11 (track by identity vs id), DE9.3 (dbt tests in DuckDB), B3.11 (ASP.NET Core rate limiter), S7.11 (pytest catching a grouping bug), FS3.5 (Arabic normalisation), FS2.7 (multi-tab refresh with Web Locks) and S1.10 (measured defer and async). Later still: DE2.1 (3NF vs star in DuckDB), AI10.8 (TF-IDF synonyms), AI21.8 (T5 span corruption), DA3.11 (Parquet pruning), F5.1 (tsc type erasure), S1.9 (polling vs SSE), DE6.10 (skew metrics), S9.11 (open redirect), B7.8 (login timing leak), B1.10 (equality and hashing), F3.9 (ESM bindings), F2.9 (this site's contrast, fixed), DE4.5 (load rates), B5.7 (EF lost update), B5.8 (EF vs Dapper), B3.7 (configuration precedence), DE2.7 (JSON drift), DA6.7 and DA3.10 (Superstore backtest and checks), F1.10 (this site's SEO audit; sitemap, robots, canonical and Open Graph now generated), FS3.7 (soft delete and partial indexes), B3.8 (OpenAPI generation), B10.7 (differential rounding test), DE7.1 (DAG critical path), B10.8 (load test), B13.6 (AsyncLocalStorage), AI15.9 (McNemar), AI8.14 (gains and lift), AI3.13 (profiling Superstore), AI6.7 (selection leakage), AI9.6 and AI9.10 (k-means duplicates, HDBSCAN), AI2.10 (vectorisation speed-ups), AI11.3 (dead ReLUs without scaling) and F10.7 (this site's accessibility audit; duplicate ids fixed). Glossary cross-references and term ids were fixed in the build along the way. Then: DS4.10 (fairness trade-off), DE3.8 (reconciliation vs volume checks), B12.4 (cache load test), B7.7 (API keys), B9.1 (testing through HTTP vs a class), FS3.4 (real SPF/DMARC records), F3.11 (ES2023–2026 features in Node and Chrome), DE1.5 (the stack end to end on Superstore), B13.9 (CPU work in Node vs .NET), B4.9 (time zones and Cairo's DST), F9.8 (tsc vs transpilers), DA5.8 and DA2.11 (Superstore chart redesign and Excel test), S6.10 (significant but tiny), DE6.1 (DuckDB at 50M rows), DE4.6 (one pandas call over several stores), B10.1 (mutation testing) and AI4.9 (two-stage leakage).

## What is left

### AI Journey sections still without a diagram

- §5.5 and §13.5 (worked EDAs). Both need the original datasets (Supermarket Sales, UK road accidents), which are not in the repo.
- §9.6 (mostly notebook walkthroughs and translation tables).
- §14.1, §14.5, §14.6, §25.2–25.4, §25.7 (lists, reading lists and summaries: low value for diagrams).

### Handbook sections still without a diagram (most valuable first)

- **Backend:**
  - B4.4 is deliberately skipped (SD4 already has the idempotency-key figure).
- Interview hubs, take-home sections and drills are intentionally text-only.

### Other follow-ups

- Copy this pass's AI Journey and Bootcamp changes into `E:\AI Journey - Written Course` and `E:\interview prep` if the mirror should show them too.
- Add quiz questions for the newest figures that still have none: AI16, AI21, AI24 §24.3, SD1.5, DE2.4 and others as figures land. Questions go in `content/quizzes.js`, FOUNDATIONS object, keyed by module id. Inside single-quoted strings, use the typographic apostrophe `’`, not `\'`.
- Keep the README counts in step: "Over 1,000 diagrams", "1,247 questions".

## How the work was done (to continue in the same style)

1. Read the section. Pick a picture that teaches something the text only states: a mechanism, a trade-off, a trap. Prefer computing it (run the real code, measure, simulate) and quote the numbers in the caption and alt text.
2. Write the SVG with the classes in the README "Writing conventions" table. Width is 720. Use `<figure class="dia steps">` with `data-s` for step-throughs, and `dia anim` for SMIL animations.
3. Pitfalls:
   - A persistent `data-s="3"` part is previewed faintly before step 3, so replacing text must be ranged (`data-s="3-N"`). Ranged parts that end before the last step are hidden in the overview (k = 0), which shows the finished picture.
   - Never put "Part N" or "§x.y" inside SVG text in the AI Journey (sources.js rewrites them into links).
   - SVG class fill overrides the `fill` attribute; use `style="fill:none"`.
   - Leave a blank line after `</figure>`.
   - Do not insert a figure between a callout's first line and its body.
4. Run `npm run build -- --strict` with no warnings. With `npm run dev` running, run both checks from `site/qa/` (README, "Checking diagrams"); both must come back clean apart from the DA1 false positive.
5. After changing `content/modules/*.md` or `content/quizzes.js`, copy them to the mirror (`modules/`, `site/quiz.js`) and run `node site/build.js --strict` there.

Tooling notes: this machine has Python with numpy, pandas, scikit-learn, SciPy, PyTorch, Gymnasium, NLTK and Plotly (no statsmodels, and no NLTK corpora such as WordNet or punkt), plus Node, `tsc` and .NET 10. .NET file-based apps (`dotnet run x.cs` with `#:package` and `#:sdk Microsoft.NET.Sdk.Web`) produce real output; EF Core model building needs `#:property PublishAot=false`.
