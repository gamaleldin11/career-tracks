# Career Tracks Handbook

Eight interview-preparation courses in one website: **Frontend, Backend, Full-Stack, Data Analyst, Data Scientist, Data Engineer, AI Engineer and Network & Connectivity Engineer**.

- **116 modules**, each with an interview-focus card, model answers, drills and key takeaways. Ten shared modules (S1–S10) appear on several tracks.
- **System design on every track**: five shared modules (SD1–SD5) from fundamentals to scaling in production, choosing technologies, reliability patterns and role-specific design, placed in a *System design* stage on all eight paths.
- **A self-test per track** (444 questions). Every wrong answer links to the section to reread.
- **Level filter** (Entry / Mid / Senior), full-text search, a site-wide glossary, dark and light themes, and per-module progress saved in the browser.
- Facts in the six software and data tracks were checked against primary sources in October 2026; each module ends with its sources.

## Repository layout

```
content/                      everything you read: edit here
  course.js                   modules, tracks and levels (the table of contents)
  quizzes.js                  self-test questions, one list per track
  modules/                    Markdown modules: 00, S1–S10, SD1–SD5, F*, B*, FS*, DA*, DS*, DE*
  ai-journey/parts/           The AI Journey Handbook, Obsidian Markdown (modules AI0–AI25)
  ai-journey/figures/         its figures, plus make_figures.py that draws them
  connectivity-bootcamp/      The Connectivity Interview Bootcamp, one HTML page (modules N0–N16)
site/                         the code that turns content/ into a website
  build.js                    the build
  sources.js                  importers for the AI Journey and the Bootcamp formats
  template_head.html          styles
  template_body.html          page shell and browser code
  serve.js                    local preview server
  check-links.mjs             external-link checker
dist/                         build output (generated, not committed)
vercel.json                   how Vercel builds and serves the site
.github/workflows/build.yml   checks every push and pull request builds with no warnings
```

## Run it locally

Needs Node.js 20 or later.

```
npm install
npm run dev
```

Then open http://localhost:8790. `npm run build` only builds; `npm run serve` only serves; `npm run check-links` checks every external link in `content/`.

## Add a topic

1. Write `content/modules/<ID>_<Name>.md`. IDs are a letter prefix plus a number, such as `F12` or `DE11`; numbered sections inside it are `## F12.1 Title 🟢 ⭐`.
2. In `content/course.js`, add the ID to `MODULES` (short title and file name) and to `LEVEL`, then put it in the stage of every track that should include it.
3. Add a few questions to that track's list in `content/quizzes.js`, each pointing to the section that teaches it.
4. `npm run build`. It warns about anything half-done: a file not in `MODULES`, a module on no track, a cross-reference or quiz reference to a section that doesn't exist.

## Add a track

1. Give it a prefix for its own modules (for example `CY` for cybersecurity) and write them as above. Reuse shared modules (S1–S10) where they fit.
2. Add an entry to `TRACKS` in `content/course.js`: a new `id`, a name, a one-line blurb and its ordered stages.
3. Add a list under the same `id` in `content/quizzes.js`.

The start page, sidebar, track picker, search, glossary and self-test page pick it up automatically.

## Writing conventions

| Write | You get |
|---|---|
| `## F3.2 Closures 🟢 ⭐` | Numbered section with a level badge (🟢 Entry, 🟡 Mid, 🔴 Senior) and an "asked often" star |
| `> [!focus]`, `> [!say]`, `> [!term] Word`, `> [!story]`, `> [!lab]`, `> [!mistake]`, `> [!sota]`, `> [!note]`, `> [!warning]` | Interview focus card, model answer, glossary term, your own experience, exercise, trap, state of the art, note, warning |
| `## Key takeaways` then `> [!check]` | The takeaways box that closes a module |
| `> [!map]- Title` | A callout folded shut (`+` instead of `-` starts it open) |
| A table headed `\| Question \| Strong short answer \|` | Flash cards |
| `[[F3]]` or `[[F3.2]]` | A link to a module or a section |
| `![alt](figures/name.png)` then `*caption*` | A figure; put the image in `content/ai-journey/figures/` |

The AI Journey and the Bootcamp keep their original formats and numbering; `site/sources.js` maps them (AI Journey §6.3 becomes §AI6.3; Bootcamp section 2.3 becomes §N2.3, its Level 2 deep dives count as Mid and Levels 3–4 as Senior). New material should be plain Markdown in `content/modules/`.

## Publishing (Vercel)

One-time setup: on vercel.com choose **Add New → Project**, import this GitHub repository and keep the defaults; `vercel.json` already sets the install command (`npm ci`), the build command (`npm run build -- --strict`) and the output folder (`dist`). After that, every push to `main` deploys to production and every other branch or pull request gets its own preview URL. Vercel's Hobby plan deploys from private repositories too.

`--strict` turns any build warning into a failed build, so a broken cross-reference or quiz link never goes live; the same check runs on GitHub in `.github/workflows/build.yml`.

## What is deliberately not in this repository

The `.gitignore` keeps out build output, `node_modules`, secrets, editor settings, and reference material that must not be published: PDFs (such as the Géron textbook the AI Journey cites by page), archives and backup folders. Keep those on your own drive.

## Link check (4 Oct 2026)

640 unique source links in `content/modules/`: 627 returned OK; two broken ones were replaced. Five sites block automated checks (Microsoft's Fabric community blog, Medium, LeetCode), and six didn't respond at the time (Vitest, Conventional Commits, Let's Encrypt, Sam Newman's site, *The Mixtape*, Great Expectations). The AI Journey and Bootcamp links have not been re-checked; run `npm run check-links`.
