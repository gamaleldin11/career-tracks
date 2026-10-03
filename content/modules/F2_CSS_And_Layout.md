# CSS and Layout — The Cascade, Flexbox, Grid and Responsive Design

CSS questions in frontend interviews come in three kinds: **concepts** (specificity, the box model, stacking), **layout** ("build this card grid", "centre this") and **architecture** (how you keep styles maintainable in a big app). Modern CSS has also changed a lot since 2022. Nesting, `:has()`, container queries and cascade layers now work in every major browser, and knowing that marks you as current.

> [!focus]
> **Entry must:** calculate specificity; explain the box model and `box-sizing`; choose flexbox or grid and build common layouts with each; write mobile-first media queries; centre anything.
> **Mid adds:** stacking contexts and z-index bugs, container queries, custom properties for theming, cascade layers, animation performance, a styling strategy for a large Angular or React app.
> **Most asked:** *How does specificity work?* · *Explain the box model* · *Flexbox vs grid?* · *How do you centre a div?* · *`position: absolute` vs `relative` vs `fixed` vs `sticky`?* · *Why doesn't my z-index work?* · *rem vs em?*
> **Time budget:** 3 hours, with a CodePen or a local file open.

## F2.1 The cascade, specificity and inheritance 🟢 ⭐

When several rules set the same property on an element, the browser picks one by checking, **in order**:

1. **Origin and importance:** user-agent, user and author styles, with `!important` flipping the order.
2. **Cascade layers** (`@layer`): later layers beat earlier ones; unlayered styles beat all layers.
3. **Specificity**.
4. **Order of appearance**: the later rule wins on a tie.

> [!term] Specificity
> A score that ranks selectors, written as three columns **(IDs, classes, elements)**. IDs count in the first column; classes, attributes and pseudo-classes in the second; elements and pseudo-elements in the third. Compare column by column from the left: one ID beats any number of classes.

| Selector | (IDs, classes, elements) |
|---|---|
| `p` | (0, 0, 1) |
| `.card p` | (0, 1, 1) |
| `.card .title:hover` | (0, 3, 0) |
| `#nav a` | (1, 0, 1) |
| `button[type="submit"]` | (0, 1, 1) |
| `:where(.card) p` | (0, 0, 1), because `:where()` always adds zero |
| `:is(#a, .b) p` | (1, 0, 1), because `:is()` takes its most specific argument |
| `style="..."` attribute | beats any selector |

> [!mistake] Fighting specificity with `!important`
> Each `!important` invites another one to override it. Keep selectors flat (single classes), use `:where()` for low-specificity defaults, and use `@layer` to order whole groups of styles (reset, base, components, utilities) without specificity wars.

**Inheritance:** some properties (mostly text-related: `color`, `font-*`, `line-height`, `direction`) pass to children; layout properties (`margin`, `border`, `width`) don't. `inherit`, `initial`, `unset` and `revert` control it explicitly.

> [!say]
> "When rules conflict, the cascade checks importance and origin, then cascade layers, then specificity (IDs over classes over elements), then source order. I keep specificity low with single-class selectors and use cascade layers to order resets, components and utilities, so I almost never need !important."

## F2.2 The box model 🟢 ⭐

Every element is a box: **content**, then **padding**, then **border**, then **margin**.

<figure class="dia"><svg viewBox="0 0 720 210" role="img" aria-label="Box model: margin, border, padding and content nested boxes">
<rect class="sW" x="150" y="10" width="420" height="190" rx="4"/><text class="sM" x="160" y="28">margin</text>
<rect class="sR" x="180" y="38" width="360" height="134" rx="4"/><text class="sM" x="190" y="56">border</text>
<rect class="sG" x="200" y="64" width="320" height="90" rx="4"/><text class="sM" x="210" y="82">padding</text>
<rect class="sA" x="250" y="90" width="220" height="44" rx="4"/><text class="sT" x="360" y="117" text-anchor="middle">content</text>
<text class="sS" x="590" y="80">box-sizing: content-box →</text><text class="sS" x="590" y="96">width = content only</text>
<text class="sS" x="590" y="126">box-sizing: border-box →</text><text class="sS" x="590" y="142">width = content + padding + border</text>
</svg><figcaption>With the default <code>content-box</code>, padding and border are added on top of the width you set. Almost every project switches to <code>border-box</code>.</figcaption></figure>

```css
*, *::before, *::after { box-sizing: border-box; }   /* width now includes padding and border */
```

> [!term] Margin collapsing
> Vertical margins between adjacent block elements merge into the **larger** of the two instead of adding up (and a child's top margin can escape through its parent). It doesn't happen inside flex or grid containers, which is one reason modern layouts use `gap` instead of margins between items.

## F2.3 Display, positioning and stacking 🟢 ⭐

| `display` | Behaviour |
|---|---|
| `block` | Starts on a new line, takes the full available width; width and height apply |
| `inline` | Flows within text; width, height and vertical margins are ignored |
| `inline-block` | Flows inline but respects width and height |
| `flex` / `grid` | Makes the element a flex or grid container for its children |
| `none` | Removed from layout and from the accessibility tree |

| `position` | Positioned relative to | In normal flow? | Typical use |
|---|---|---|---|
| `static` (default) | — | Yes | Everything |
| `relative` | Its own normal position | Yes (space kept) | Small nudges; containing block for absolute children |
| `absolute` | Nearest **positioned** ancestor | No | Badges, tooltips, overlays inside a card |
| `fixed` | The viewport (unless an ancestor has a `transform`) | No | Floating action buttons, toasts |
| `sticky` | Acts relative until a scroll threshold, then sticks within its container | Yes | Sticky headers, table headers |

> [!term] Stacking context
> A self-contained layer in which children are stacked by `z-index`. It's created by, among others: a positioned element with a `z-index`, `opacity` below 1, a `transform`, `filter`, `isolation: isolate`, and flex or grid children with a `z-index`. **A child can never rise above its stacking context's siblings, whatever its z-index.**

> [!mistake] "z-index: 9999 doesn't work"
> Either the element isn't positioned (so `z-index` doesn't apply to it), or it's inside a stacking context that is itself below the thing you want to cover. Find the ancestor creating the context (often a `transform` or `opacity`), or render the overlay at the top level of the document, which is why dialogs and dropdowns are often "portalled" to `<body>`.

> [!mistake] `position: sticky` doesn't stick
> The usual causes: an ancestor has `overflow: hidden` or `auto`, no `top` is set, or the sticky element's container is no taller than the element itself.

## F2.4 Flexbox: one dimension 🟢 ⭐

Flexbox lays children out along **one axis**, a row or a column, and distributes space between them.

```css
.toolbar {
  display: flex;
  flex-direction: row;            /* main axis: horizontal */
  justify-content: space-between; /* along the main axis */
  align-items: center;            /* along the cross axis */
  gap: 12px;
  flex-wrap: wrap;                /* allow a new line on small screens */
}
.toolbar .search { flex: 1; }     /* take the remaining space */
```

| Property | Meaning |
|---|---|
| `justify-content` | Distribute items along the **main** axis: `flex-start`, `center`, `space-between`, `space-around`, `space-evenly` |
| `align-items` | Align items on the **cross** axis: `stretch` (default), `center`, `flex-start`, `baseline` |
| `flex: 1` | Shorthand for `flex-grow: 1; flex-shrink: 1; flex-basis: 0%`: share free space equally |
| `flex: none` | Don't grow or shrink |
| `flex-basis` | The starting size before growing or shrinking |
| `order` | Visual order only (doesn't change tab order, so use it sparingly for accessibility) |
| `align-self` | Override `align-items` for one child |

> [!mistake] Text overflowing a flex item
> Flex items default to `min-width: auto`, so a long word or a `<pre>` refuses to shrink and overflows. Set `min-width: 0` on the flex child (and `overflow-wrap: anywhere` if needed).

## F2.5 Grid: two dimensions 🟢 ⭐

Grid lays children out in **rows and columns at once**.

```css
/* A responsive card grid with no media queries */
.cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 16px;
}

/* A page layout with named areas */
.page {
  display: grid;
  grid-template-columns: 260px 1fr;
  grid-template-rows: auto 1fr auto;
  grid-template-areas:
    "header header"
    "nav    main"
    "footer footer";
  min-height: 100dvh;
}
.page > header { grid-area: header; }
.page > nav    { grid-area: nav; }
.page > main   { grid-area: main; }
.page > footer { grid-area: footer; }

@media (max-width: 760px) {
  .page { grid-template-columns: 1fr; grid-template-areas: "header" "main" "footer"; }
  .page > nav { display: none; }       /* or move it into a drawer */
}
```

> [!term] `fr` unit
> A fraction of the **free** space in a grid container. `1fr 2fr` gives the second column twice the leftover space of the first.

**`auto-fill` vs `auto-fit`:** both create as many columns as fit. With few items, `auto-fill` keeps empty column tracks, so the items stay at their minimum size; `auto-fit` collapses empty tracks, so items stretch to fill the row.

### Flexbox or grid? 🟢 ⭐

| Use flexbox when… | Use grid when… |
|---|---|
| Content decides the size (a toolbar, a row of tags, centring one thing) | The **layout** decides the size (a page, a dashboard, a card grid) |
| You need one direction | You need rows **and** columns to line up |
| Items should wrap naturally | Items must align across rows |

> [!say]
> "Flexbox is one-dimensional and content-driven: I use it for toolbars, navigation and aligning items in a row. Grid is two-dimensional and layout-driven: I use it for page layouts and card grids, where columns must line up across rows. They combine well: a grid page whose cells use flexbox inside."

## F2.6 Centring, because someone will ask 🟢 ⭐

```css
/* Both axes, the modern way */
.parent { display: grid; place-items: center; }

/* With flexbox */
.parent { display: flex; justify-content: center; align-items: center; }

/* Horizontally, a block with a width */
.child { width: 600px; margin-inline: auto; }

/* An absolutely positioned overlay */
.child { position: absolute; inset: 0; margin: auto; width: 300px; height: 200px; }
```

## F2.7 Units and responsive design 🟢 ⭐

| Unit | Relative to | Use for |
|---|---|---|
| `px` | A CSS pixel | Borders, small fixed details |
| `rem` | The **root** font size (usually 16 px) | Font sizes and spacing, which respect the user's browser setting |
| `em` | The element's **own** font size | Padding that should scale with a component's text |
| `%` | The parent (for width) | Fluid widths |
| `vw` / `vh` | 1% of the viewport width / height | Full-bleed sections |
| `dvh` / `svh` / `lvh` | The dynamic / small / large viewport height | Mobile, where browser toolbars change the visible height (`100vh` overflows on phones) |
| `ch` | Width of "0" in the current font | Line length: `max-width: 65ch` for readable text |

**Mobile-first:** write base styles for small screens, then add `min-width` media queries for larger ones. It forces you to prioritise content, and phones dominate traffic in Egypt.

```css
.layout { padding: 16px; }
@media (min-width: 768px)  { .layout { padding: 24px; } }
@media (min-width: 1200px) { .layout { padding: 40px; max-width: 1200px; margin-inline: auto; } }

/* Fluid type with no breakpoints: at least 1.5rem, ideally 4vw, at most 2.5rem */
h1 { font-size: clamp(1.5rem, 1rem + 2vw, 2.5rem); }
```

### Container queries 🟡 ⭐

Media queries respond to the **viewport**; **container queries** respond to the size of the element's **container**. A card can then lay itself out differently in a narrow sidebar and in a wide main column, without knowing where it's placed.

```css
.card-slot { container-type: inline-size; }
@container (min-width: 420px) {
  .card { display: grid; grid-template-columns: 140px 1fr; }
}
```

> [!say]
> "I build mobile-first with min-width media queries for the page layout, and container queries for components, so a card adapts to the space it's given rather than to the screen size. Fonts and spacing are in rem so they respect the user's settings, and I use clamp for fluid type."

## F2.8 Modern CSS you should know exists 🟡 ⭐

All of these are **Baseline** features, meaning supported in the current versions of Chrome, Edge, Firefox and Safari.

| Feature | What it does | Example |
|---|---|---|
| **Custom properties** | Variables that cascade and can change at runtime | `--accent: #0B6E8A; color: var(--accent);` |
| **Nesting** | Sass-style nesting in plain CSS (Baseline since 2023) | `.card { & h2 { margin: 0 } &:hover { … } }` |
| **`:has()`** | The "parent selector": style an element by what it contains | `.field:has(input:invalid) { border-color: red }` |
| **Container queries** | Size-based component styles | See above |
| **Cascade layers** (`@layer`) | Explicit ordering of groups of styles | `@layer reset, base, components, utilities;` |
| **Logical properties** | Direction-independent spacing for RTL | `margin-inline-start` ([[F1.9]]) |
| **Subgrid** | Children align to the parent grid's tracks | `grid-template-columns: subgrid` |
| **`color-mix()`** | Mix colours in CSS | `color-mix(in srgb, var(--accent) 20%, white)` |
| **View transitions** | Animated transitions between DOM states (same-document Baseline since late 2025) | `document.startViewTransition(() => update())` |

> [!tip] Check support quickly
> MDN pages show a **Baseline** badge; [caniuse.com](https://caniuse.com) gives version details. "Baseline widely available" means it has worked everywhere for at least 30 months.

## F2.9 Theming and dark mode 🟢 🟡

The pattern this handbook itself uses: colours as custom properties, redefined for dark mode, with a manual override.

```css
:root { --bg: #f5f7f6; --ink: #17212b; --accent: #0b6e8a; color-scheme: light dark; }
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) { --bg: #0f1418; --ink: #e3e9ee; --accent: #5cc0dc; }
}
:root[data-theme="dark"] { --bg: #0f1418; --ink: #e3e9ee; --accent: #5cc0dc; }
body { background: var(--bg); color: var(--ink); }
```

Components use only the variables, so supporting a brand theme or a client's colours means changing values in one place. Named, shared values like these are called **design tokens**.

## F2.10 Animation and performance 🟡

- Animate **`transform`** and **`opacity`**: the compositor can handle them on the GPU without re-running layout. Animating `width`, `height`, `top` or `left` forces layout on every frame and stutters.
- `will-change: transform` hints at an upcoming animation; use it sparingly, because each promoted layer costs memory.
- Respect users who get motion sickness:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; scroll-behavior: auto !important; }
}
```

> [!story]
> Your studio site uses **GSAP** and **Lenis** smooth scrolling. Be ready for "how did you keep it fast and accessible?": animate transforms and opacity, and honour `prefers-reduced-motion` by turning off smooth scrolling and large animations.

## F2.11 Keeping CSS maintainable 🟡 ⭐

| Approach | Idea | Seen in |
|---|---|---|
| **BEM** naming | `.card`, `.card__title`, `.card--featured`: flat, predictable selectors | Plain CSS and Sass projects |
| **Component-scoped styles** | Styles apply only to one component | Angular's default **view encapsulation**; CSS Modules in React |
| **Utility-first** | Small single-purpose classes composed in markup | **Tailwind CSS** (used in your course platform and `aiforme`) |
| **CSS-in-JS** | Styles written in JavaScript | styled-components, Emotion: less popular now because of runtime cost and server-rendering friction |
| **Preprocessors** | Variables, mixins, nesting compiled to CSS | **Sass/SCSS**: still common in Angular projects, though native CSS now covers much of it |
| **Component libraries** | Pre-built accessible components | Angular Material, shadcn/ui (your `aiforme`), MUI, PrimeNG |

> [!say]
> "In Angular I lean on component encapsulation plus a small set of global tokens and utilities; in React I've used Tailwind with shadcn/ui. Whatever the approach, I keep design tokens in one place, keep selectors flat, and make sure the component library's accessibility isn't undone by custom styling."

> [!lab] Build three layouts from memory
> Without looking anything up: (1) a header with a logo left, links centred and a button right; (2) a responsive card grid that goes from one to four columns; (3) a holy-grail page layout that collapses to one column under 760 px. Then make the cards switch to a horizontal layout with a container query. That covers most CSS layout questions.

## F2.12 Interview drill 🟢 ⭐

| Question | Strong short answer |
|---|---|
| How is specificity calculated? | As (IDs, classes/attributes/pseudo-classes, elements/pseudo-elements), compared left to right; inline styles beat selectors; `!important` overrides normal declarations. |
| What does `box-sizing: border-box` do? | Makes width and height include padding and border, so sizes are predictable. |
| What is margin collapsing? | Adjacent vertical margins of blocks merge into the larger one; it doesn't happen in flex or grid layouts. |
| absolute vs relative vs fixed vs sticky? | relative offsets from its own spot; absolute positions against the nearest positioned ancestor; fixed against the viewport; sticky toggles between relative and fixed within its container on scroll. |
| Why might z-index not work? | The element isn't positioned, or it's trapped in a lower stacking context created by an ancestor's transform, opacity or z-index. |
| Flexbox vs grid? | Flexbox is one-dimensional and content-driven; grid is two-dimensional and layout-driven. |
| What does `flex: 1` mean? | Grow and shrink equally from a zero basis, sharing the free space. |
| rem vs em? | rem is relative to the root font size; em to the element's own font size, so em compounds when nested. |
| Media queries vs container queries? | Media queries react to the viewport; container queries react to a container's size, which suits reusable components. |
| How do you centre a div? | `display: grid; place-items: center` on the parent (or flex with justify-content and align-items). |
| What does `:has()` do? | Selects an element based on its descendants or following siblings, effectively a parent selector. |
| Which properties animate cheaply? | transform and opacity, which avoid layout and paint. |
| How do you implement dark mode? | Colours as custom properties, redefined under `prefers-color-scheme: dark` and a manual data-theme override. |
| Why is `100vh` a problem on phones? | Mobile browser toolbars change the visible height; use `dvh` or `svh`. |

## Key takeaways

> [!check]
> - The cascade: importance, layers, specificity, then order. Keep specificity flat.
> - Always `box-sizing: border-box`; use `gap` instead of margins between items.
> - Flexbox for one dimension, grid for two; container queries for components.
> - Most z-index bugs are stacking-context bugs.
> - Animate transform and opacity, and respect reduced motion.

## Sources

- MDN: [Cascade, specificity and inheritance](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Styling_basics/Handling_conflicts), [Box model](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Styling_basics/Box_model), [Stacking context](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_positioned_layout/Stacking_context), [Flexbox](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/CSS_layout/Flexbox), [Grid layout](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_grid_layout), [Container queries](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_containment/Container_queries), [Cascade layers](https://developer.mozilla.org/en-US/docs/Web/CSS/@layer), [Baseline](https://developer.mozilla.org/en-US/docs/Glossary/Baseline/Compatibility).
- web.dev: [Learn CSS](https://web.dev/learn/css), [Baseline](https://web.dev/baseline).
- W3C CSS specifications: [Selectors Level 4 (specificity)](https://www.w3.org/TR/selectors-4/#specificity-rules), [CSS Cascade Level 5](https://www.w3.org/TR/css-cascade-5/).
- Angular: [Component styling and view encapsulation](https://angular.dev/guide/components/styling).
