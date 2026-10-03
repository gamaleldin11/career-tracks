# Performance and Rendering — Core Web Vitals, Bundles, SSR and Hydration

"How would you make this page faster?" is a favourite mid-level question, because a good answer shows you measure before you change things and that you understand the whole path from server to pixel. In Egypt the question has teeth: many users are on mid-range Android phones and mobile data, so a 2 MB JavaScript bundle that feels fine on your laptop is slow for them.

> [!focus]
> **Entry must:** name the three Core Web Vitals and what they measure; explain lazy loading and code-splitting; know image best practices; explain CSR vs SSR in plain words.
> **Mid adds:** diagnosing LCP, INP and CLS separately; long tasks and main-thread work; bundle analysis and tree-shaking; SSR, SSG, ISR, streaming and hydration trade-offs; lab vs field data.
> **Most asked:** *What are Core Web Vitals?* · *How would you improve a slow page?* · *CSR vs SSR vs SSG?* · *What is hydration?* · *What is code-splitting / tree-shaking?* · *What causes layout shift?*
> **Time budget:** 3 hours, with Chrome DevTools' Performance and Lighthouse panels open.

## F9.1 Core Web Vitals 🟢 ⭐

Google's **Core Web Vitals** are three user-centred metrics. They're measured on real users' devices, and a page passes when **at least 75% of page views** (the 75th percentile) meet the "good" threshold.

| Metric | Measures | Good | Needs improvement | Poor |
|---|---|---|---|---|
| **LCP**: Largest Contentful Paint | **Loading**: when the largest image or text block in the viewport has rendered | ≤ 2.5 s | 2.5–4 s | > 4 s |
| **INP**: Interaction to Next Paint | **Responsiveness**: the delay from a click, tap or key press to the next frame, across the whole visit (roughly the worst interaction) | ≤ 200 ms | 200–500 ms | > 500 ms |
| **CLS**: Cumulative Layout Shift | **Visual stability**: how much visible content unexpectedly moves | ≤ 0.1 | 0.1–0.25 | > 0.25 |

**INP replaced FID** (First Input Delay) as a Core Web Vital in **March 2024**. FID measured only the delay before the *first* interaction's handler started; INP covers every interaction and includes processing and rendering time.

Supporting diagnostics: **TTFB** (time to first byte, the server and network share) and **FCP** (first contentful paint).

> [!term] Lab data vs field data
> **Lab data** comes from a controlled test (Lighthouse, DevTools) on one device and network, which is reproducible and good for debugging. **Field data** (real-user monitoring, Google's Chrome UX Report, the `web-vitals` library) comes from actual users and is what Core Web Vitals are judged on. A great Lighthouse score with poor field data usually means real users have slower phones or networks than your test assumed.

> [!say]
> "Core Web Vitals are LCP for loading (good is under 2.5 seconds), INP for responsiveness (under 200 milliseconds) and CLS for visual stability (under 0.1), judged at the 75th percentile of real users. I debug with Lighthouse and the Performance panel, but I trust field data, because our users' phones and networks are slower than my laptop."

## F9.2 How to approach "make this page faster" 🟢 ⭐

1. **Measure first**, on a realistic device: DevTools' **CPU throttling (4× or 6×) and "Slow 4G"**, plus PageSpeed Insights for field data.
2. **Find which metric is bad**, and why, because each has different causes.
3. **Fix the biggest cause**, measure again, and repeat.
4. **Prevent regressions**: a performance budget in CI (Lighthouse CI, bundle-size limits).

## F9.3 Fixing LCP 🟡 ⭐

LCP breaks into four parts. Find the big one:

| Part | Typical causes | Fixes |
|---|---|---|
| **TTFB** (server response) | Slow API or database, no caching, far from users | Cache HTML or API responses, a CDN, SSR or static pages, faster queries |
| **Resource load delay** (the LCP image is discovered late) | Image injected by JavaScript, or set as a CSS background | Put it in the HTML as an `<img>`, `<link rel="preload">` it, add `fetchpriority="high"` |
| **Resource load time** | A huge image | Right size (`srcset`), AVIF or WebP, compression, a CDN |
| **Render delay** | Render-blocking CSS or JS, client-side rendering waiting for a bundle | Inline critical CSS, `defer` scripts, SSR or SSG |

> [!mistake] Lazy-loading the hero image
> `loading="lazy"` on the largest above-the-fold image delays the LCP itself. Lazy-load what's below the fold; give the hero `fetchpriority="high"`.

## F9.4 Fixing INP 🟡 ⭐

An interaction has three phases: **input delay** (the main thread is busy with something else), **processing** (your event handlers run), and **presentation delay** (style, layout and paint of the next frame). Causes and fixes:

- **Long tasks** (over 50 ms) block input. Break them up and **yield** to the main thread (`await scheduler.yield()` where supported, or a `setTimeout` chunk) ([[F4.7]]).
- **Do less in handlers.** Update the visual state first (show the dropdown), and defer the expensive work (analytics, filtering a huge list) with `requestAnimationFrame`/`setTimeout`, or mark it as a non-urgent transition (`useTransition` in React).
- **Ship less JavaScript.** Every kilobyte must be parsed, compiled and executed. Hydrating a large page is a common INP killer.
- **Avoid layout thrashing:** reading a layout property (`offsetHeight`) right after writing styles forces a synchronous layout; batch reads, then writes.
- **Big DOM:** thousands of nodes make every style and layout recalculation slow. Virtualise long lists.
- **Re-render storms:** in React, state that's too global re-renders big subtrees on each keystroke; in Angular, Default change detection checks everything (OnPush and signals fix it).

## F9.5 Fixing CLS 🟢 ⭐

| Cause | Fix |
|---|---|
| Images and videos without dimensions | Set `width` and `height` (or `aspect-ratio`) so space is reserved |
| Ads, embeds, banners injected above content | Reserve their space with a fixed-height container |
| Content inserted above existing content (a cookie bar pushing the page) | Overlay it, or put it below; or reserve space |
| **Web fonts** swapping and changing text size | `font-display: swap` with a **size-matched fallback** (`size-adjust`, or `next/font`, which does it automatically), and preload the main font |
| Animating `top`, `height` and the like | Animate `transform` instead |

Layout shifts within **500 ms after a user input** don't count, because the user expected them.

## F9.6 JavaScript weight: splitting and shaking 🟢 🟡 ⭐

> [!term] Code-splitting
> Breaking the bundle into chunks loaded on demand, typically one per route or per heavy component, using dynamic `import()`. Angular's `loadComponent` and `@defer`, React's `lazy()` and Next.js routes all do this.

> [!term] Tree-shaking
> The bundler removing exports that nothing imports. It relies on static ES module `import`/`export` ([[F3.9]]) and on packages marked side-effect-free. Importing a whole library (`import _ from "lodash"`) defeats it; import just what you use (`import debounce from "lodash-es/debounce"`).

**Checklist:**

- Analyse the bundle (`source-map-explorer`, `rollup-plugin-visualizer`, Angular's `ng build --stats-json` with an analyser). The first look usually finds one surprisingly large dependency: a date library with every locale, a full icon set, a chart library on a page that doesn't chart.
- Replace heavy dependencies with lighter ones, or with the platform (`Intl` instead of moment.js; native `fetch` instead of axios when you don't need its features).
- **Third-party scripts** (chat widgets, analytics, tag managers) are often the heaviest code on the page. Load them `async`/`defer`, after interaction, or not at all.
- Respect **budgets**: Angular's `angular.json` has `budgets` that fail the build when a bundle grows past a limit.

## F9.7 Rendering strategies 🟢 🟡 ⭐

| Strategy | HTML is produced | First view | Freshness | Server cost | Good for |
|---|---|---|---|---|---|
| **CSR** (client-side rendering, a classic SPA) | In the browser, after JS downloads and runs | Slower (blank until JS runs) | Always fresh | Low (static files) | Dashboards behind a login, internal tools |
| **SSR** (server-side rendering) | On the server, **per request** | Fast | Fresh | Higher | Personalised or frequently changing public pages |
| **SSG** (static site generation) | At **build time** | Fastest (from a CDN) | Stale until rebuilt | Lowest | Docs, marketing pages, blogs |
| **ISR** (incremental static regeneration) / cached rendering | Statically, then **regenerated in the background** after a set time or on demand | Fast | Eventually fresh | Low | Product and catalogue pages |
| **Streaming SSR** | Server sends HTML in pieces as data resolves (Suspense boundaries) | Fast first bytes | Fresh | Medium | Pages with slow and fast parts |

> [!term] Hydration
> After server-rendered HTML arrives, the client downloads the JavaScript, rebuilds the component tree and **attaches event listeners** to the existing HTML, making it interactive. Until hydration finishes, the page looks ready but buttons may not respond, a classic INP problem. A **hydration mismatch** happens when the client renders something different from the server (dates, random numbers, `window` checks).

Ways to do less hydration:

- **Partial or progressive hydration:** hydrate parts only when needed. Angular's **incremental hydration** hydrates `@defer` blocks on triggers like viewport or interaction.
- **Islands architecture:** a mostly static page with small interactive "islands" (Astro).
- **React Server Components:** components that render only on the server and ship **no JavaScript** for themselves; only Client Components (`"use client"`) hydrate ([[F6.8]]).

> [!say]
> "Client-side rendering ships an empty page and builds it in the browser, which is fine behind a login. Server-side rendering sends real HTML per request for a fast first view and SEO, then hydrates it to attach behaviour. Static generation renders at build time and serves from a CDN, and incremental regeneration refreshes static pages in the background. The cost of SSR is hydration, so modern frameworks hydrate less: Angular's incremental hydration, islands, or React Server Components."

> [!story]
> Your course platform is on Next.js (server rendering for public course pages: good for SEO and first load), while FinSight is an Angular SPA behind a login (CSR is fine there because it doesn't need search ranking). That's the trade-off in one sentence, using your own projects.

## F9.8 Build tools in one table 🟢

| Tool | Role |
|---|---|
| **Vite** | Dev server using native ES modules (near-instant start) plus an optimised production build; the default for new React, Vue and Svelte SPAs; Angular's CLI uses Vite and esbuild internally |
| **esbuild** | A very fast bundler and transpiler written in Go, used inside other tools |
| **Rollup / Rolldown** | Production bundling (Rolldown is the Rust rewrite the Vite team is moving to) |
| **Webpack** | The long-time standard; still in many existing apps |
| **Turbopack** | Next.js's Rust bundler, the default since Next.js 16 |
| **SWC / Babel** | Transpilers (TypeScript and JSX to JavaScript) |

## F9.9 Delivery: the network side 🟢

- **Compression:** Brotli (or gzip) for text assets, usually 70–80% smaller.
- **HTTP/2 or HTTP/3** to multiplex requests ([[S1.3]]).
- **Caching:** hashed file names with `immutable` and long `max-age`; `no-cache` for `index.html` ([[S1.8]]).
- **CDN** for static assets and, where possible, cached HTML.
- **Resource hints:** `preconnect` to critical third-party origins, `preload` for the LCP image and main font, `fetchpriority` to rank requests.
- **Images:** AVIF or WebP, `srcset`/`sizes`, lazy below the fold, explicit dimensions ([[F1.4]]).
- **Fonts:** few weights, WOFF2, subset (Latin plus Arabic only if needed), `font-display: swap`, self-host when possible.

## F9.10 Measuring in practice 🟡

- **Lighthouse** (DevTools, CLI or CI): a lab audit with specific recommendations.
- **PageSpeed Insights**: Lighthouse plus **field data** from the Chrome UX Report for real URLs.
- **DevTools Performance panel**: record an interaction, find long tasks (red triangles), see which functions take time; the "Interactions" track shows INP candidates.
- **`web-vitals` library**: report LCP, INP and CLS from real users to your analytics or Application Insights.
- **Framework profilers**: the React DevTools Profiler, Angular DevTools.

```js
import { onLCP, onINP, onCLS } from "web-vitals";
const send = (m) => navigator.sendBeacon("/api/vitals", JSON.stringify({ name: m.name, value: m.value, id: m.id, page: location.pathname }));
onLCP(send); onINP(send); onCLS(send);
```

> [!lab] A measured before-and-after
> Pick CS Visualizer or your studio site. Record Lighthouse (mobile, throttled) and the bundle analysis. Fix three things: for example preload and prioritise the LCP image, lazy-load a heavy component or route, and add dimensions to images. Record again. A sentence like "I cut LCP on mobile from 4.1 s to 2.2 s by…" is gold on a frontend CV. (Remember the recruiter rule about numbers: keep it for the interview, or one well-earned figure.)

## F9.11 Interview drill 🟢 ⭐

| Question | Strong short answer |
|---|---|
| What are the Core Web Vitals? | LCP (loading, ≤ 2.5 s), INP (responsiveness, ≤ 200 ms), CLS (stability, ≤ 0.1), at the 75th percentile of real users. |
| What replaced FID? | INP, in March 2024; it measures the full latency of all interactions, not just the first input's delay. |
| How do you improve LCP? | Faster TTFB (caching, CDN, SSR), discover the LCP image early with preload and fetchpriority, optimise its size and format, remove render-blocking resources. |
| How do you improve INP? | Break up long tasks and yield, do less in handlers, ship less JavaScript, avoid layout thrashing, virtualise big lists. |
| What causes CLS? | Media without dimensions, injected content above existing content, font swaps, animating layout properties. |
| Code-splitting vs tree-shaking? | Splitting loads code on demand in chunks; tree-shaking removes unused exports at build time. |
| CSR vs SSR vs SSG? | Browser renders after JS loads / server renders per request / pages rendered at build time and served statically. |
| What is hydration? | Attaching client-side JavaScript and event handlers to server-rendered HTML to make it interactive. |
| What is a hydration mismatch? | The client's first render differs from the server HTML (dates, randomness, browser-only checks). |
| Lab vs field data? | Lab is a controlled test for debugging; field is real-user data, which is what CWV are judged on. |
| Why shouldn't the hero image be lazy-loaded? | It delays the LCP element; lazy-load only below-the-fold media. |
| How do you stop a bundle growing? | Analyse it, set budgets in CI, import narrowly, lazy-load routes and heavy components, audit third-party scripts. |

## Key takeaways

> [!check]
> - Measure on a slow phone profile; trust field data.
> - LCP is about getting the main content early; INP is about keeping the main thread free; CLS is about reserving space.
> - Ship less JavaScript: split by route, shake unused code, question every dependency.
> - Choose the rendering strategy per page: CSR behind login, SSR or SSG for public pages, with as little hydration as possible.
> - Set budgets so performance doesn't silently regress.

## Sources

- web.dev: [Web Vitals](https://web.dev/articles/vitals), [Defining the Core Web Vitals thresholds](https://web.dev/articles/defining-core-web-vitals-thresholds), [Optimize LCP](https://web.dev/articles/optimize-lcp), [Optimize INP](https://web.dev/articles/optimize-inp), [Optimize CLS](https://web.dev/articles/optimize-cls), [INP becomes a Core Web Vital (March 2024)](https://web.dev/blog/inp-cwv-march-12), [Rendering on the web](https://web.dev/articles/rendering-on-the-web).
- Chrome for Developers: [Lighthouse](https://developer.chrome.com/docs/lighthouse/overview), [Performance panel](https://developer.chrome.com/docs/devtools/performance).
- GoogleChrome: [web-vitals library](https://github.com/GoogleChrome/web-vitals).
- Angular: [Hydration](https://angular.dev/guide/hydration), [Incremental hydration](https://angular.dev/guide/incremental-hydration). Next.js: [Rendering](https://nextjs.org/docs/app/building-your-application/rendering).
- [Vite documentation](https://vite.dev/guide/).
