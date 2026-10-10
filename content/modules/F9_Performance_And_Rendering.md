# Performance and Rendering — Core Web Vitals, Bundles, SSR and Hydration

"How would you make this page faster?" is a favourite mid-level question, because a good answer shows you measure before you change things and that you understand the whole path from server to pixel. In Egypt the question has teeth: many users are on mid-range Android phones and mobile data, so a 2 MB JavaScript bundle that feels fine on your laptop is slow for them.

> [!focus]
> **Entry must:** name the three Core Web Vitals and what they measure; explain lazy loading and code-splitting; know image best practices; explain CSR vs SSR in plain words.
> **Mid adds:** diagnosing LCP, INP and CLS separately; long tasks and main-thread work; bundle analysis and tree-shaking; SSR, SSG, ISR, streaming and hydration trade-offs; lab vs field data.
> **Most asked:** *What are Core Web Vitals?* · *How would you improve a slow page?* · *CSR vs SSR vs SSG?* · *What is hydration?* · *What is code-splitting / tree-shaking?* · *What causes layout shift?*
> **Time budget:** 3 hours, with Chrome DevTools' Performance and Lighthouse panels open.

## F9.0 Foundations: the critical rendering path 🟢

Every performance metric in this module measures a moment in one pipeline: how the browser turns bytes into pixels and how quickly it can respond afterwards.

<figure class="dia steps" data-start="1"><svg viewBox="0 0 720 232" role="img" aria-label="Critical rendering path: HTML to DOM, CSS to CSSOM, combined into a render tree, then layout, paint and composite">
<g data-s="1"><rect class="sB" x="20" y="30" width="140" height="50" rx="8"/><text class="sT" x="90" y="53" text-anchor="middle">HTML bytes</text><text class="sC" x="90" y="69" text-anchor="middle">parse</text></g>
<g data-s="1"><rect class="sA" x="170" y="30" width="140" height="50" rx="8"/><text class="sT" x="240" y="53" text-anchor="middle">DOM</text><text class="sC" x="240" y="69" text-anchor="middle">tree of nodes</text></g>
<g data-s="2"><rect class="sB" x="20" y="110" width="140" height="50" rx="8"/><text class="sT" x="90" y="133" text-anchor="middle">CSS bytes</text><text class="sC" x="90" y="149" text-anchor="middle">parse</text></g>
<g data-s="2"><rect class="sA" x="170" y="110" width="140" height="50" rx="8"/><text class="sT" x="240" y="133" text-anchor="middle">CSSOM</text><text class="sC" x="240" y="149" text-anchor="middle">style rules</text></g>
<g data-s="3"><rect class="sV" x="330" y="70" width="140" height="50" rx="8"/><text class="sT" x="400" y="93" text-anchor="middle">render tree</text><text class="sC" x="400" y="109" text-anchor="middle">nodes + styles</text></g>
<g data-s="4"><rect class="sW" x="490" y="70" width="140" height="50" rx="8"/><text class="sT" x="560" y="93" text-anchor="middle">layout</text><text class="sC" x="560" y="109" text-anchor="middle">sizes &amp; positions</text></g>
<g data-s="5"><rect class="sW" x="490" y="150" width="140" height="50" rx="8"/><text class="sT" x="560" y="173" text-anchor="middle">paint</text><text class="sC" x="560" y="189" text-anchor="middle">pixels in layers</text></g>
<g data-s="6"><rect class="sG" x="330" y="150" width="140" height="50" rx="8"/><text class="sT" x="400" y="173" text-anchor="middle">composite</text><text class="sC" x="400" y="189" text-anchor="middle">GPU joins layers</text></g>
<g data-s="1"><line class="sLm" x1="160" y1="55" x2="166" y2="55" marker-end="url(#ahm)"/></g><g data-s="2"><line class="sLm" x1="160" y1="135" x2="166" y2="135" marker-end="url(#ahm)"/></g>
<g data-s="3"><line class="sLm" x1="310" y1="55" x2="326" y2="88" marker-end="url(#ahm)"/><line class="sLm" x1="310" y1="135" x2="326" y2="102" marker-end="url(#ahm)"/></g>
<g data-s="4"><line class="sLm" x1="470" y1="95" x2="486" y2="95" marker-end="url(#ahm)"/></g>
<g data-s="5"><line class="sLm" x1="560" y1="120" x2="560" y2="146" marker-end="url(#ahm)"/></g>
<g data-s="6"><line class="sLm" x1="490" y1="175" x2="474" y2="175" marker-end="url(#ahm)"/><text class="sGt" x="400" y="222" text-anchor="middle">first pixels on screen</text></g>
<g data-s="2-2"><text class="sWt" x="100" y="190">CSS blocks rendering: nothing paints</text><text class="sWt" x="100" y="206">until the CSSOM is ready</text></g>
<g data-s="1-1"><text class="sWt" x="100" y="190">a plain &lt;script&gt; pauses parsing</text><text class="sWt" x="100" y="206">while it downloads and runs</text></g>
</svg><ol class="dia-steps">
<li>The browser parses HTML into the DOM as bytes arrive. A plain <code>&lt;script&gt;</code> stops the parser until it has downloaded and run, because it might change the document.</li>
<li>CSS is parsed into the CSSOM. CSS is <b>render-blocking</b>: the browser won't paint until the CSS it knows about is ready, to avoid a flash of unstyled content.</li>
<li>DOM and CSSOM combine into the render tree: only visible nodes (no <code>display: none</code>, no <code>&lt;head&gt;</code>) with their computed styles.</li>
<li><b>Layout</b> works out each box's size and position for the viewport width.</li>
<li><b>Paint</b> fills in pixels (text, colours, borders, images), often into several layers.</li>
<li><b>Composite</b>: the GPU stacks the layers into the frame you see. The faster this path, the sooner FCP and LCP happen.</li>
</ol><figcaption>The critical rendering path. Everything that delays one of these steps for above-the-fold content delays the first view.</figcaption></figure>

Two consequences explain most of the advice that follows:

- **What blocks the first paint:** CSS in the `<head>` (render-blocking), plain `<script>` tags (parser-blocking), and above all, for client-rendered apps, the JavaScript that must download and run before there is any content.
- **What makes later updates expensive:** JavaScript that changes the page triggers some of style, layout, paint and composite again on the main thread. Which ones depends on what you change.

<figure class="dia"><svg viewBox="0 0 720 222" role="img" aria-label="The pixel pipeline JavaScript, style, layout, paint, composite, and which stages run when you change geometry, colour, or transform and opacity">
<rect class="sB" x="210" y="20" width="92" height="36" rx="8"/><text class="sT" x="256" y="43" text-anchor="middle">JavaScript</text>
<line class="sLm" x1="302" y1="38" x2="308" y2="38" marker-end="url(#ahm)"/>
<rect class="sB" x="310" y="20" width="92" height="36" rx="8"/><text class="sT" x="356" y="43" text-anchor="middle">Style</text>
<line class="sLm" x1="402" y1="38" x2="408" y2="38" marker-end="url(#ahm)"/>
<rect class="sW" x="410" y="20" width="92" height="36" rx="8"/><text class="sT" x="456" y="43" text-anchor="middle">Layout</text>
<line class="sLm" x1="502" y1="38" x2="508" y2="38" marker-end="url(#ahm)"/>
<rect class="sW" x="510" y="20" width="92" height="36" rx="8"/><text class="sT" x="556" y="43" text-anchor="middle">Paint</text>
<line class="sLm" x1="602" y1="38" x2="608" y2="38" marker-end="url(#ahm)"/>
<rect class="sG" x="610" y="20" width="92" height="36" rx="8"/><text class="sT" x="656" y="43" text-anchor="middle">Composite</text>
<text class="sM" x="200" y="96" text-anchor="end">width, top, font-size</text>
<rect class="sA" x="210" y="78" width="92" height="26" rx="5"/><text class="sC" x="256" y="96" text-anchor="middle">✓</text>
<rect class="sA" x="310" y="78" width="92" height="26" rx="5"/><text class="sC" x="356" y="96" text-anchor="middle">✓</text>
<rect class="sA" x="410" y="78" width="92" height="26" rx="5"/><text class="sC" x="456" y="96" text-anchor="middle">✓</text>
<rect class="sA" x="510" y="78" width="92" height="26" rx="5"/><text class="sC" x="556" y="96" text-anchor="middle">✓</text>
<rect class="sA" x="610" y="78" width="92" height="26" rx="5"/><text class="sC" x="656" y="96" text-anchor="middle">✓</text>
<text class="sC" x="716" y="96" text-anchor="middle"></text>
<text class="sM" x="200" y="136" text-anchor="end">color, background, shadow</text>
<rect class="sA" x="210" y="118" width="92" height="26" rx="5"/><text class="sC" x="256" y="136" text-anchor="middle">✓</text>
<rect class="sA" x="310" y="118" width="92" height="26" rx="5"/><text class="sC" x="356" y="136" text-anchor="middle">✓</text>
<rect class="sN" x="410" y="118" width="92" height="26" rx="5" stroke-dasharray="4 3" opacity=".5"/><text class="sC" x="456" y="136" text-anchor="middle">skipped</text>
<rect class="sA" x="510" y="118" width="92" height="26" rx="5"/><text class="sC" x="556" y="136" text-anchor="middle">✓</text>
<rect class="sA" x="610" y="118" width="92" height="26" rx="5"/><text class="sC" x="656" y="136" text-anchor="middle">✓</text>
<text class="sC" x="716" y="136" text-anchor="middle"></text>
<text class="sM" x="200" y="176" text-anchor="end">transform, opacity</text>
<rect class="sA" x="210" y="158" width="92" height="26" rx="5"/><text class="sC" x="256" y="176" text-anchor="middle">✓</text>
<rect class="sA" x="310" y="158" width="92" height="26" rx="5"/><text class="sC" x="356" y="176" text-anchor="middle">✓</text>
<rect class="sN" x="410" y="158" width="92" height="26" rx="5" stroke-dasharray="4 3" opacity=".5"/><text class="sC" x="456" y="176" text-anchor="middle">skipped</text>
<rect class="sN" x="510" y="158" width="92" height="26" rx="5" stroke-dasharray="4 3" opacity=".5"/><text class="sC" x="556" y="176" text-anchor="middle">skipped</text>
<rect class="sA" x="610" y="158" width="92" height="26" rx="5"/><text class="sC" x="656" y="176" text-anchor="middle">✓</text>
<text class="sC" x="716" y="176" text-anchor="middle"></text>
<text class="sC" x="16" y="214">rows: what changing each kind of property makes the browser redo</text>
</svg><figcaption>Why animations should use <code>transform</code> and <code>opacity</code>: they skip layout and paint and run on the compositor.</figcaption></figure>

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

<figure class="dia"><svg viewBox="0 0 720 184" role="img" aria-label="LCP split into server response, resource load delay, resource load time and render delay; INP split into input delay, processing and presentation delay">
<text class="sT" x="16" y="28">LCP 2,400 ms on a mid-range phone</text><rect class="sB" x="16" y="36" width="138" height="34" rx="4"/><text class="sC" x="86" y="51" text-anchor="middle">TTFB</text><text class="sM" x="86" y="65" text-anchor="middle">600 ms</text><rect class="sW" x="156" y="36" width="114.667" height="34" rx="4"/><text class="sC" x="214.333" y="51" text-anchor="middle">load delay</text><text class="sM" x="214.333" y="65" text-anchor="middle">500 ms</text><rect class="sA" x="272.667" y="36" width="208" height="34" rx="4"/><text class="sC" x="377.667" y="51" text-anchor="middle">load time</text><text class="sM" x="377.667" y="65" text-anchor="middle">900 ms</text><rect class="sV" x="482.667" y="36" width="91.3333" height="34" rx="4"/><text class="sC" x="529.333" y="51" text-anchor="middle">render delay</text><text class="sM" x="529.333" y="65" text-anchor="middle">400 ms</text>
<text class="sC" x="16" y="86">fix the biggest part first</text>
<text class="sT" x="16" y="116">INP 320 ms for one tap</text><rect class="sR" x="16" y="124" width="243" height="34" rx="4"/><text class="sC" x="138.5" y="139" text-anchor="middle">input delay</text><text class="sM" x="138.5" y="153" text-anchor="middle">140 ms</text><rect class="sW" x="261" y="124" width="208" height="34" rx="4"/><text class="sC" x="366" y="139" text-anchor="middle">processing</text><text class="sM" x="366" y="153" text-anchor="middle">120 ms</text><rect class="sV" x="471" y="124" width="103" height="34" rx="4"/><text class="sC" x="523.5" y="139" text-anchor="middle">presentation</text><text class="sM" x="523.5" y="153" text-anchor="middle">60 ms</text>
<text class="sC" x="16" y="174">here, a long task was already running when the user tapped</text>
</svg><figcaption>Both metrics are sums. Measure the parts (DevTools and the <code>web-vitals</code> attribution build report them) before choosing a fix.</figcaption></figure>

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

<figure class="dia"><svg viewBox="0 0 720 196" role="img" aria-label="Timelines: a plain script blocks HTML parsing while it downloads and runs; defer downloads in parallel and runs after parsing; async downloads in parallel and interrupts parsing to run">
<text class="sM" x="140" y="44" text-anchor="end">&lt;script&gt;</text>
<rect class="sB" x="150" y="26" width="98" height="26" rx="4"/><text class="sC" x="200" y="44" text-anchor="middle">parse</text>
<rect class="sW" x="250" y="26" width="148" height="26" rx="4"/><text class="sC" x="325" y="44" text-anchor="middle">download</text>
<rect class="sR" x="400" y="26" width="48" height="26" rx="4"/><text class="sC" x="425" y="44" text-anchor="middle">run</text>
<rect class="sB" x="450" y="26" width="198" height="26" rx="4"/><text class="sC" x="550" y="44" text-anchor="middle">parse</text>
<text class="sWt" x="704" y="44" text-anchor="end">parsing stops</text>
<text class="sM" x="140" y="100" text-anchor="end">&lt;script defer&gt;</text>
<rect class="sB" x="150" y="82" width="348" height="26" rx="4"/><text class="sC" x="325" y="100" text-anchor="middle">parse</text>
<rect class="sG" x="500" y="82" width="48" height="26" rx="4"/><text class="sC" x="525" y="100" text-anchor="middle">run</text>
<rect class="sW" x="250" y="112" width="150" height="10" rx="3"/><text class="sC" x="404" y="121">download (in parallel)</text>
<text class="sGt" x="704" y="100" text-anchor="end">runs after parsing, in order</text>
<text class="sM" x="140" y="156" text-anchor="end">&lt;script async&gt;</text>
<rect class="sB" x="150" y="138" width="198" height="26" rx="4"/><text class="sC" x="250" y="156" text-anchor="middle">parse</text>
<rect class="sR" x="350" y="138" width="48" height="26" rx="4"/><text class="sC" x="375" y="156" text-anchor="middle">run</text>
<rect class="sB" x="400" y="138" width="148" height="26" rx="4"/><text class="sC" x="475" y="156" text-anchor="middle">parse</text>
<rect class="sW" x="200" y="168" width="150" height="10" rx="3"/><text class="sC" x="354" y="177">download (in parallel)</text>
<text class="sWt" x="704" y="156" text-anchor="end">runs when ready, any order</text>
</svg><figcaption>How a script tag affects the HTML parser. Use <code>defer</code> (or <code>type="module"</code>, deferred by default) for your own scripts.</figcaption></figure>

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

<figure class="dia"><svg viewBox="0 0 720 220" role="img" aria-label="Without dimensions a late image pushes the Pay button down; with width and height set the space is reserved and nothing moves">
<text class="sM" x="170" y="22" text-anchor="middle">no dimensions on &lt;img&gt;</text><rect class="sN" x="20" y="30" width="300" height="180" rx="12"/><rect class="sB" x="36" y="42" width="268" height="22" rx="4"/><text class="sT" x="46" y="57">Invoices</text><rect class="sW" x="36" y="72" width="268" height="70" rx="6"/><text class="sC" x="170" y="111" text-anchor="middle">image loaded late: 70 px</text><rect class="sR" x="36" y="150" width="268" height="26" rx="4"/><text class="sC" x="170" y="167" text-anchor="middle">"Pay" button jumped down</text><path class="sLr" d="M312 90 v52" marker-end="url(#ahr)"/><text class="sM" x="550" y="22" text-anchor="middle">&lt;img width="800" height="210"&gt;</text><rect class="sN" x="400" y="30" width="300" height="180" rx="12"/><rect class="sB" x="416" y="42" width="268" height="22" rx="4"/><text class="sT" x="426" y="57">Invoices</text><rect class="sB" x="416" y="72" width="268" height="70" rx="6" stroke-dasharray="5 4"/><text class="sC" x="550" y="104" text-anchor="middle">space reserved</text><text class="sC" x="550" y="120" text-anchor="middle">width + height set</text><rect class="sG" x="416" y="150" width="268" height="26" rx="4"/><text class="sC" x="550" y="167" text-anchor="middle">"Pay" stays put</text>
</svg><figcaption>The most common layout shift, and its one-line fix. Users mis-tap when content moves under their finger.</figcaption></figure>

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

<figure class="dia"><svg viewBox="0 0 720 240" role="img" aria-label="Timelines for client-side rendering, server-side rendering and static generation: when content becomes visible and when it becomes interactive">
<text class="sT" x="100" y="56" text-anchor="end">CSR</text>
<rect class="sV" x="110" y="40" width="36.3333" height="22" rx="3"/>
<rect class="sW" x="147.333" y="40" width="204.333" height="22" rx="3"/>
<rect class="sR" x="352.667" y="40" width="185.667" height="22" rx="3"/>
<path class="sFg" d="M539.3 38 l-6 -9 h12z"/><text class="sGt" x="547.333" y="36">content 2.3 s</text>
<circle class="sPv" cx="539.3" cy="70" r="5"/><text class="sC" x="547.333" y="74">interactive 2.3 s</text>
<text class="sT" x="100" y="110" text-anchor="end">SSR</text>
<rect class="sV" x="110" y="94" width="129.667" height="22" rx="3"/>
<rect class="sW" x="240.667" y="94" width="148.333" height="22" rx="3"/>
<rect class="sA" x="390" y="94" width="92.3333" height="22" rx="3"/>
<path class="sFg" d="M240.7 92 l-6 -9 h12z"/><text class="sGt" x="248.667" y="90">content 0.7 s</text>
<circle class="sPv" cx="483.3" cy="124" r="5"/><text class="sC" x="491.333" y="128">interactive 2 s</text>
<text class="sT" x="100" y="164" text-anchor="end">SSG</text>
<rect class="sV" x="110" y="148" width="27" height="22" rx="3"/>
<rect class="sW" x="138" y="148" width="139" height="22" rx="3"/>
<rect class="sA" x="278" y="148" width="92.3333" height="22" rx="3"/>
<path class="sFg" d="M138.0 146 l-6 -9 h12z"/><text class="sGt" x="146" y="144">content 0.15 s</text>
<circle class="sPv" cx="371.3" cy="178" r="5"/><text class="sC" x="379.333" y="182">interactive 1.4 s</text>
<text class="sC" x="110" y="206" text-anchor="middle">0 s</text>
<text class="sC" x="296.667" y="206" text-anchor="middle">1 s</text>
<text class="sC" x="483.333" y="206" text-anchor="middle">2 s</text>
<text class="sC" x="670" y="206" text-anchor="middle">3 s</text>
<rect class="sV" x="110" y="218" width="14" height="12" rx="2"/><text class="sC" x="130" y="229">server / CDN</text>
<rect class="sW" x="260" y="218" width="14" height="12" rx="2"/><text class="sC" x="280" y="229">download JS</text>
<rect class="sR" x="410" y="218" width="14" height="12" rx="2"/><text class="sC" x="430" y="229">run + fetch data</text>
<rect class="sA" x="560" y="218" width="14" height="12" rx="2"/><text class="sC" x="580" y="229">hydrate</text>
</svg><figcaption>When users see content and when they can use it. SSR and SSG show content early; hydration is the gap before it responds.</figcaption></figure>

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
