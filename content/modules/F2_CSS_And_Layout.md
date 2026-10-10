# CSS and Layout — The Cascade, Flexbox, Grid and Responsive Design

CSS questions in frontend interviews come in three kinds: **concepts** (specificity, the box model, stacking), **layout** ("build this card grid", "centre this") and **architecture** (how you keep styles maintainable in a big app). Modern CSS has also changed a lot since 2022. Nesting, `:has()`, container queries and cascade layers now work in every major browser, and knowing that marks you as current.

> [!focus]
> **Entry must:** calculate specificity; explain the box model and `box-sizing`; choose flexbox or grid and build common layouts with each; write mobile-first media queries; centre anything.
> **Mid adds:** stacking contexts and z-index bugs, container queries, custom properties for theming, cascade layers, animation performance, a styling strategy for a large Angular or React app.
> **Most asked:** *How does specificity work?* · *Explain the box model* · *Flexbox vs grid?* · *How do you centre a div?* · *`position: absolute` vs `relative` vs `fixed` vs `sticky`?* · *Why doesn't my z-index work?* · *rem vs em?*
> **Time budget:** 3 hours, with a CodePen or a local file open.

## F2.0 Foundations: rules, selectors and normal flow 🟢

### Anatomy of a rule

```css
.card > h2:hover {          /* the selector: which elements          */
  color: var(--accent);     /* a declaration: property and value      */
  margin-block: 0 8px;
}
```

A stylesheet is a list of rules. The browser starts with its own **user-agent stylesheet** (that's why `<h1>` is big and links are blue), then applies yours, from `<link rel="stylesheet">` files, `<style>` blocks and `style=""` attributes.

### Selectors to read at a glance

| Selector | Matches | Example |
|---|---|---|
| Type | Every element of that type | `p` |
| Class | Elements with that class | `.card` |
| ID | The element with that `id` | `#main` |
| Attribute | Elements with an attribute, or a value | `input[type="email"]` |
| Pseudo-class | Elements in a state or position | `:hover`, `:focus-visible`, `:nth-child(2n)`, `:disabled` |
| Pseudo-element | A part of an element | `::before`, `::placeholder`, `::first-line` |
| Descendant (a space) | Anywhere inside | `.card p` |
| Child `>` | Direct children only | `.menu > li` |
| Next sibling `+`, later siblings `~` | Siblings after an element | `h2 + p`, `h2 ~ p` |

Browsers match selectors **right to left**: for `.card p` they take each `<p>` and look for a `.card` ancestor. That is why a very broad rightmost part, such as `.sidebar *`, is the expensive kind.

### From a declaration to pixels

For every element and every property, the browser collects the matching declarations, lets the **cascade** pick a winner ([[F2.1]]), falls back to the inherited or initial value if nothing matched, resolves relative values (`2em` becomes `32px`; percentages are settled during layout), lays the boxes out, and paints them. The **Computed** tab in DevTools shows the final value and which rule supplied it: the fastest way to answer "why is this blue?".

### Normal flow

Before any flexbox or grid, elements are laid out in **normal flow**. Flex and grid replace it only for the direct children of the container that asks for them.

<figure class="dia"><svg viewBox="0 0 720 222" role="img" aria-label="Normal flow: block boxes stack vertically at full width; inline boxes flow along lines and wrap">
<rect class="sN" x="20" y="14" width="680" height="196" rx="10"/><text class="sC" x="30" y="32">&lt;article&gt;  (a block container)</text>
<rect class="sA" x="36" y="42" width="648" height="30" rx="4"/><text class="sC" x="46" y="62">&lt;h1&gt; block: full width, starts a new line</text>
<rect class="sB" x="36" y="80" width="648" height="78" rx="4"/><text class="sC" x="46" y="96">&lt;p&gt; block, containing inline boxes that flow in lines and wrap:</text>
<rect class="sN" x="46" y="108" width="92.8" height="20" rx="3"/><text class="sC" x="92.4" y="122" text-anchor="middle">Revenue rose</text>
<rect class="sG" x="144.8" y="108" width="148" height="20" rx="3"/><text class="sC" x="218.8" y="122" text-anchor="middle">&lt;strong&gt;18%&lt;/strong&gt;</text>
<rect class="sN" x="298.8" y="108" width="99.7" height="20" rx="3"/><text class="sC" x="348.65" y="122" text-anchor="middle">in Q3, led by</text>
<rect class="sW" x="404.5" y="108" width="148" height="20" rx="3"/><text class="sC" x="478.5" y="122" text-anchor="middle">&lt;a&gt;subscriptions&lt;/a&gt;</text>
<rect class="sN" x="558.5" y="108" width="30.7" height="20" rx="3"/><text class="sC" x="573.85" y="122" text-anchor="middle">and</text>
<rect class="sV" x="46" y="134" width="127.3" height="20" rx="3"/><text class="sC" x="109.65" y="148" text-anchor="middle">&lt;em&gt;renewals&lt;/em&gt;</text>
<rect class="sN" x="179.3" y="134" width="99.7" height="20" rx="3"/><text class="sC" x="229.15" y="148" text-anchor="middle">from existing</text>
<rect class="sN" x="285" y="134" width="72.1" height="20" rx="3"/><text class="sC" x="321.05" y="148" text-anchor="middle">customers</text>
<rect class="sN" x="363.1" y="134" width="72.1" height="20" rx="3"/><text class="sC" x="399.15" y="148" text-anchor="middle">in Cairo.</text>
<rect class="sA" x="36" y="166" width="648" height="32" rx="4"/><text class="sC" x="46" y="186">&lt;div&gt; block: the next box starts below</text>
</svg><figcaption>Normal flow, the layout you get before any flex or grid: blocks stack, inline content flows in lines. In a right-to-left page the lines simply run the other way.</figcaption></figure>

## F2.1 The cascade, specificity and inheritance 🟢 ⭐

When several rules set the same property on an element, the browser picks one by checking, **in order**:

1. **Origin and importance:** user-agent, user and author styles, with `!important` flipping the order.
2. **Cascade layers** (`@layer`): later layers beat earlier ones; unlayered styles beat all layers.
3. **Specificity**.
4. **Order of appearance**: the later rule wins on a tie.

<figure class="dia steps"><svg viewBox="0 0 720 256" role="img" aria-label="Five CSS declarations compete for the color of one link: the browser default loses on origin, a layered ID rule loses on cascade layers, a.link loses on specificity, and of the two remaining rules with equal specificity the later one, teal, wins on order of appearance">
<text class="sS" x="14" y="22" xml:space="preserve" style="white-space:pre">&lt;nav class="nav"&gt;&lt;a id="home" class="link" href="/"&gt;Home&lt;/a&gt;&lt;/nav&gt;</text>
<text class="sT" x="20" y="46">declaration</text><text class="sT" x="300" y="46" text-anchor="middle">origin</text><text class="sT" x="384" y="46" text-anchor="middle">specificity</text><text class="sT" x="448" y="46" text-anchor="middle">order</text>
<rect class="sN" x="14" y="56" width="460" height="28" rx="6"/><text class="sS" x="22" y="75" xml:space="preserve" style="white-space:pre">a:any-link { color: LinkText }</text><text class="sS" x="300" y="75" text-anchor="middle">browser default</text><text class="sS" x="384" y="75" text-anchor="middle">(0,1,1)</text><text class="sS" x="448" y="75" text-anchor="middle">1st</text>
<rect class="sN" x="14" y="90" width="460" height="28" rx="6"/><text class="sS" x="22" y="109" xml:space="preserve" style="white-space:pre">@layer base { #home { color: red } }</text><text class="sS" x="300" y="109" text-anchor="middle">author, layer</text><text class="sS" x="384" y="109" text-anchor="middle">(1,0,0)</text><text class="sS" x="448" y="109" text-anchor="middle">2nd</text>
<rect class="sN" x="14" y="124" width="460" height="28" rx="6"/><text class="sS" x="22" y="143" xml:space="preserve" style="white-space:pre">.nav .link { color: blue }</text><text class="sS" x="300" y="143" text-anchor="middle">author</text><text class="sS" x="384" y="143" text-anchor="middle">(0,2,0)</text><text class="sS" x="448" y="143" text-anchor="middle">3rd</text>
<rect class="sN" x="14" y="158" width="460" height="28" rx="6"/><text class="sS" x="22" y="177" xml:space="preserve" style="white-space:pre">a.link { color: green }</text><text class="sS" x="300" y="177" text-anchor="middle">author</text><text class="sS" x="384" y="177" text-anchor="middle">(0,1,1)</text><text class="sS" x="448" y="177" text-anchor="middle">4th</text>
<rect class="sN" x="14" y="192" width="460" height="28" rx="6"/><text class="sS" x="22" y="211" xml:space="preserve" style="white-space:pre">[href].link { color: teal }</text><text class="sS" x="300" y="211" text-anchor="middle">author</text><text class="sS" x="384" y="211" text-anchor="middle">(0,2,0)</text><text class="sS" x="448" y="211" text-anchor="middle">5th</text>
<rect class="sN" x="496" y="56" width="210" height="28" rx="6"/>
<g data-s="2-2"><rect class="sA" x="496" y="56" width="210" height="28" rx="6"/></g>
<text class="sT" x="601" y="75" text-anchor="middle">1 origin &amp; importance</text>
<rect class="sN" x="496" y="90" width="210" height="28" rx="6"/>
<g data-s="3-3"><rect class="sA" x="496" y="90" width="210" height="28" rx="6"/></g>
<text class="sT" x="601" y="109" text-anchor="middle">2 cascade layers</text>
<rect class="sN" x="496" y="124" width="210" height="28" rx="6"/>
<g data-s="4-4"><rect class="sA" x="496" y="124" width="210" height="28" rx="6"/></g>
<text class="sT" x="601" y="143" text-anchor="middle">3 specificity</text>
<rect class="sN" x="496" y="158" width="210" height="28" rx="6"/>
<g data-s="5-5"><rect class="sA" x="496" y="158" width="210" height="28" rx="6"/></g>
<text class="sT" x="601" y="177" text-anchor="middle">4 order of appearance</text>
<g data-s="2-6"><rect class="sR" x="14" y="56" width="460" height="28" rx="6" opacity=".3"/><line class="sLr" x1="22" y1="70" x2="466" y2="70"/></g>
<g data-s="3-6"><rect class="sR" x="14" y="90" width="460" height="28" rx="6" opacity=".3"/><line class="sLr" x1="22" y1="104" x2="466" y2="104"/></g>
<g data-s="5-6"><rect class="sR" x="14" y="124" width="460" height="28" rx="6" opacity=".3"/><line class="sLr" x1="22" y1="138" x2="466" y2="138"/></g>
<g data-s="4-6"><rect class="sR" x="14" y="158" width="460" height="28" rx="6" opacity=".3"/><line class="sLr" x1="22" y1="172" x2="466" y2="172"/></g>
<g data-s="6-6"><rect class="sG" x="14" y="192" width="460" height="28" rx="6" style="fill:none;stroke-width:2.5"/><rect class="sG" x="496" y="196" width="210" height="28" rx="6"/><text class="sT" x="601" y="215" text-anchor="middle">color: teal wins</text></g>
<g data-s="2-2"><text class="sWt" x="360" y="244" text-anchor="middle">author styles beat the browser default</text></g>
<g data-s="3-3"><text class="sWt" x="360" y="244" text-anchor="middle">unlayered beats any @layer, even with an ID</text></g>
<g data-s="4-4"><text class="sWt" x="360" y="244" text-anchor="middle">(0,1,1) loses to (0,2,0)</text></g>
<g data-s="5-5"><text class="sWt" x="360" y="244" text-anchor="middle">tie at (0,2,0): the later rule wins</text></g>
</svg><ol class="dia-steps">
<li>Five declarations set color on the same link. The browser checks four tie-breakers in order and stops as soon as one decides.</li>
<li>Origin and importance: the browser default loses to any author style (no !important here).</li>
<li>Cascade layers: unlayered styles beat every @layer, so the #home rule loses despite its ID.</li>
<li>Specificity among the survivors: a.link (0,1,1) loses to the two (0,2,0) selectors.</li>
<li>Order of appearance breaks the remaining tie: the later rule wins.</li>
<li>The link is teal. Each stage only matters when every earlier one ties.</li>
</ol><figcaption>The cascade as a sequence of tie-breakers, applied to one link. Later stages only run on ties.</figcaption></figure>

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

<figure class="dia"><svg viewBox="0 0 800 210" role="img" aria-label="Box model: margin, border, padding and content nested boxes">
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

<figure class="dia"><svg viewBox="0 0 720 204" role="img" aria-label="The same width, padding and border take 350 pixels with content-box and exactly 300 pixels with border-box">
<text class="sM" x="20" y="22">width: 300px; padding: 20px; border: 5px</text>
<text class="sM" x="20" y="58">content-box</text><rect class="sR" x="170" y="36" width="6.5" height="34" rx="2"/><rect class="sG" x="176.5" y="36" width="26" height="34" rx="2"/><text class="sC" x="189.5" y="58" text-anchor="middle">20</text><rect class="sA" x="202.5" y="36" width="390" height="34" rx="2"/><text class="sC" x="397.5" y="58" text-anchor="middle">content 300</text><rect class="sG" x="592.5" y="36" width="26" height="34" rx="2"/><text class="sC" x="605.5" y="58" text-anchor="middle">20</text><rect class="sR" x="618.5" y="36" width="6.5" height="34" rx="2"/><path class="sLm" d="M170 78 v6 H625.0 v-6"/><text class="sS" x="397.5" y="98" text-anchor="middle">takes 350px: padding and border are added on top</text>
<text class="sM" x="20" y="142">border-box</text><rect class="sR" x="170" y="120" width="6.5" height="34" rx="2"/><rect class="sG" x="176.5" y="120" width="26" height="34" rx="2"/><text class="sC" x="189.5" y="142" text-anchor="middle">20</text><rect class="sA" x="202.5" y="120" width="325" height="34" rx="2"/><text class="sC" x="365" y="142" text-anchor="middle">content 250</text><rect class="sG" x="527.5" y="120" width="26" height="34" rx="2"/><text class="sC" x="540.5" y="142" text-anchor="middle">20</text><rect class="sR" x="553.5" y="120" width="6.5" height="34" rx="2"/><path class="sLm" d="M170 162 v6 H560.0 v-6"/><text class="sS" x="365" y="182" text-anchor="middle">takes exactly 300px: the content shrinks to fit</text>
</svg><figcaption>Why every project sets <code>box-sizing: border-box</code>: the width you write is the width you get.</figcaption></figure>

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

<figure class="dia steps" data-start="1"><svg viewBox="0 0 720 262" role="img" aria-label="A modal with z-index 9999 inside a transformed card is painted under a header with z-index 10; moving the modal to the body fixes it">
<text class="sT" x="130" y="22" text-anchor="middle">DOM</text><text class="sT" x="500" y="22" text-anchor="middle">What you see</text>
<g data-s="1-3"><text class="sC" x="24" y="50" xml:space="preserve" style="white-space:pre">body</text></g>
<g data-s="1-3"><text class="sC" x="42" y="76" xml:space="preserve" style="white-space:pre">└ header  z-index: 10</text></g>
<g data-s="1-3"><text class="sC" x="42" y="102" xml:space="preserve" style="white-space:pre">└ div.card  transform · z-index: 1</text></g>
<g data-s="1-3"><text class="sC" x="60" y="128" xml:space="preserve" style="white-space:pre">└ div.modal  z-index: 9999</text></g>
<g data-s="4"><text class="sC" x="24" y="50" xml:space="preserve" style="white-space:pre">body</text></g>
<g data-s="4"><text class="sC" x="42" y="76" xml:space="preserve" style="white-space:pre">└ header  z-index: 10</text></g>
<g data-s="4"><text class="sC" x="42" y="102" xml:space="preserve" style="white-space:pre">└ div.card  transform · z-index: 1</text></g>
<g data-s="4-4"><text class="sC" x="42" y="128" xml:space="preserve" style="white-space:pre">└ div.modal  z-index: 9999  (portalled)</text></g>
<g data-s="2-3"><rect class="sN" x="16" y="92" width="290" height="46" rx="8" style="stroke:var(--mid);stroke-width:2.5"/><text class="sWt" x="160" y="156" text-anchor="middle">the card's transform makes its own stacking context</text></g>
<g data-s="1-3"><rect class="sB" x="360" y="34" width="340" height="200" rx="10"/><rect class="sB" x="380" y="120" width="200" height="90" rx="8"/><text class="sC" x="480" y="200" text-anchor="middle">card</text><rect class="sA" x="420" y="56" width="220" height="110" rx="10"/><text class="sT" x="530" y="104" text-anchor="middle">modal (9999)</text><rect class="sW" x="360" y="34" width="340" height="48" rx="10"/><text class="sT" x="530" y="63" text-anchor="middle">header (10)</text></g>
<g data-s="4"><rect class="sB" x="360" y="34" width="340" height="200" rx="10"/><rect class="sB" x="380" y="120" width="200" height="90" rx="8"/><text class="sC" x="480" y="200" text-anchor="middle">card</text><rect class="sW" x="360" y="34" width="340" height="48" rx="10"/><text class="sT" x="530" y="63" text-anchor="middle">header (10)</text><rect class="sA" x="420" y="56" width="220" height="110" rx="10"/><text class="sT" x="530" y="104" text-anchor="middle">modal (9999)</text></g>
<g data-s="3-3"><text class="sRt" x="706" y="252" text-anchor="end">inside the card 9999 is irrelevant: card 1 &lt; header 10</text></g>
<g data-s="4-4"><text class="sGt" x="706" y="252" text-anchor="end">now 9999 competes with 10 at the root, and wins</text></g>
</svg><ol class="dia-steps">
<li>A header with <code>z-index: 10</code>, and a card with a <code>transform</code> and <code>z-index: 1</code>. Inside the card, a modal with <code>z-index: 9999</code>.</li>
<li>The <code>transform</code> makes the card a stacking context. Everything inside it is stacked as one unit, and 9999 only ranks the modal against the card's other children.</li>
<li>In the page's root context the comparison is card (1) against header (10). The header wins, so it paints over the whole card, modal included.</li>
<li>The fix: render the modal as a child of <code>body</code> (a "portal", or the native <code>&lt;dialog&gt;</code>, which uses the top layer). Now 9999 is compared with 10, and wins.</li>
</ol><figcaption>The z-index bug, explained. No number can lift an element out of its stacking context.</figcaption></figure>

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

<figure class="dia anim"><svg viewBox="0 0 720 156" role="img" aria-label="Animation: three flex items move between the positions given by each value of justify-content">
<rect class="sN" x="60" y="40" width="600" height="70" rx="8"/>
<line class="sLm" x1="60" y1="128" x2="660" y2="128" marker-end="url(#ahm)"/><text class="sC" x="360" y="146" text-anchor="middle">main axis (flex-direction: row)</text>
<rect class="sA" x="60" y="52" width="80" height="46" rx="6"><animate attributeName="x" dur="13.0s" repeatCount="indefinite" values="60;60;240;240;420;420;60;60;120;120;150;150;60" keyTimes="0.0000;0.1282;0.1667;0.2949;0.3333;0.4615;0.5000;0.6282;0.6667;0.7949;0.8333;0.9615;1.0000"/></rect>
<rect class="sG" x="140" y="52" width="80" height="46" rx="6"><animate attributeName="x" dur="13.0s" repeatCount="indefinite" values="140;140;320;320;500;500;320;320;320;320;320;320;140" keyTimes="0.0000;0.1282;0.1667;0.2949;0.3333;0.4615;0.5000;0.6282;0.6667;0.7949;0.8333;0.9615;1.0000"/></rect>
<rect class="sW" x="220" y="52" width="80" height="46" rx="6"><animate attributeName="x" dur="13.0s" repeatCount="indefinite" values="220;220;400;400;580;580;580;580;520;520;490;490;220" keyTimes="0.0000;0.1282;0.1667;0.2949;0.3333;0.4615;0.5000;0.6282;0.6667;0.7949;0.8333;0.9615;1.0000"/></rect>
<text class="sM" x="360" y="26" text-anchor="middle" opacity="1">justify-content: flex-start;<animate attributeName="opacity" dur="13.0s" repeatCount="indefinite" calcMode="discrete" values="1;0" keyTimes="0;0.1667"/></text>
<text class="sM" x="360" y="26" text-anchor="middle" opacity="0">justify-content: center;<animate attributeName="opacity" dur="13.0s" repeatCount="indefinite" calcMode="discrete" values="0;1;0" keyTimes="0;0.1667;0.3333"/></text>
<text class="sM" x="360" y="26" text-anchor="middle" opacity="0">justify-content: flex-end;<animate attributeName="opacity" dur="13.0s" repeatCount="indefinite" calcMode="discrete" values="0;1;0" keyTimes="0;0.3333;0.5000"/></text>
<text class="sM" x="360" y="26" text-anchor="middle" opacity="0">justify-content: space-between;<animate attributeName="opacity" dur="13.0s" repeatCount="indefinite" calcMode="discrete" values="0;1;0" keyTimes="0;0.5000;0.6667"/></text>
<text class="sM" x="360" y="26" text-anchor="middle" opacity="0">justify-content: space-around;<animate attributeName="opacity" dur="13.0s" repeatCount="indefinite" calcMode="discrete" values="0;1;0" keyTimes="0;0.6667;0.8333"/></text>
<text class="sM" x="360" y="26" text-anchor="middle" opacity="0">justify-content: space-evenly;<animate attributeName="opacity" dur="13.0s" repeatCount="indefinite" calcMode="discrete" values="0;1;0" keyTimes="0;0.8333;1.0000"/></text>
</svg><figcaption>The six values of <code>justify-content</code>, one after another. They only distribute the <em>free</em> space along the main axis; <code>align-items</code> does the same job on the cross axis.</figcaption></figure>

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

<figure class="dia"><svg viewBox="0 0 720 214" role="img" aria-label="auto-fill keeps empty column tracks so two cards stay narrow; auto-fit collapses the empty tracks so the two cards stretch">
<text class="sM" x="20" y="22">repeat(auto-fill, minmax(150px, 1fr))</text><rect class="sN" x="20" y="30" width="680" height="54" rx="8"/><rect class="sA" x="27" y="37" width="158" height="40" rx="6"/><text class="sC" x="106" y="62" text-anchor="middle">card 1</text><rect class="sA" x="195" y="37" width="158" height="40" rx="6"/><text class="sC" x="274" y="62" text-anchor="middle">card 2</text><rect class="sN" x="363" y="37" width="158" height="40" rx="6" stroke-dasharray="5 4"/><text class="sC" x="442" y="62" text-anchor="middle">empty track</text><rect class="sN" x="531" y="37" width="160" height="40" rx="6" stroke-dasharray="5 4"/><text class="sC" x="611" y="62" text-anchor="middle">empty track</text>
<text class="sM" x="20" y="122">repeat(auto-fit, minmax(150px, 1fr))</text><rect class="sN" x="20" y="130" width="680" height="54" rx="8"/><rect class="sG" x="27" y="137" width="326" height="40" rx="6"/><text class="sC" x="190" y="162" text-anchor="middle">card 1</text><rect class="sG" x="363" y="137" width="328" height="40" rx="6"/><text class="sC" x="527" y="162" text-anchor="middle">card 2</text>
<text class="sS" x="360" y="204" text-anchor="middle">With many items both behave the same; the difference shows when items are few.</text>
</svg><figcaption><code>auto-fill</code> keeps the empty tracks; <code>auto-fit</code> collapses them and lets the items grow.</figcaption></figure>

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

<figure class="dia"><svg viewBox="0 0 720 236" role="img" aria-label="Left: nested list items with font-size 1.2em grow 19.2, 23, 27.6 and 33.2 pixels because em compounds, while 1.2rem stays at 19.2 pixels. Right: clamp(1.5rem, 1rem + 2vw, 2.5rem) stays at 24 pixels below a 400 pixel viewport, grows linearly, and caps at 40 pixels from 1,200 pixels">
<text class="sM" x="14" y="22">each nested level: 1.2em vs 1.2rem (root 16px)</text>
<text class="sC" x="70" y="58" text-anchor="end">level 1</text>
<rect class="sW" x="80" y="38" width="115.2" height="14" rx="3"/><text class="sWt" x="201.2" y="50">19.2px (em)</text>
<rect class="sG" x="80" y="54" width="115.2" height="14" rx="3"/><text class="sGt" x="201.2" y="66">19.2px (rem)</text>
<text class="sC" x="70" y="98" text-anchor="end">level 2</text>
<rect class="sW" x="80" y="78" width="138.24" height="14" rx="3"/><text class="sWt" x="224.24" y="90">23.0px (em)</text>
<rect class="sG" x="80" y="94" width="115.2" height="14" rx="3"/><text class="sGt" x="201.2" y="106">19.2px (rem)</text>
<text class="sC" x="70" y="138" text-anchor="end">level 3</text>
<rect class="sW" x="80" y="118" width="165.888" height="14" rx="3"/><text class="sWt" x="251.888" y="130">27.6px (em)</text>
<rect class="sG" x="80" y="134" width="115.2" height="14" rx="3"/><text class="sGt" x="201.2" y="146">19.2px (rem)</text>
<text class="sC" x="70" y="178" text-anchor="end">level 4</text>
<rect class="sW" x="80" y="158" width="199.066" height="14" rx="3"/><text class="sWt" x="285.066" y="170">33.2px (em)</text>
<rect class="sG" x="80" y="174" width="115.2" height="14" rx="3"/><text class="sGt" x="201.2" y="186">19.2px (rem)</text>
<line class="sLm" x1="440" y1="190" x2="700" y2="190"/><line class="sLm" x1="440" y1="190" x2="440" y2="40"/>
<polyline class="sLv" points="440.0,150.0 444.1,150.0 448.1,150.0 452.2,150.0 456.2,150.0 460.3,148.0 464.4,146.0 468.4,144.0 472.5,142.0 476.6,140.0 480.6,138.0 484.7,136.0 488.8,134.0 492.8,132.0 496.9,130.0 500.9,128.0 505.0,126.0 509.1,124.0 513.1,122.0 517.2,120.0 521.2,118.0 525.3,116.0 529.4,114.0 533.4,112.0 537.5,110.0 541.6,108.0 545.6,106.0 549.7,104.0 553.8,102.0 557.8,100.0 561.9,98.0 565.9,96.0 570.0,94.0 574.1,92.0 578.1,90.0 582.2,88.0 586.2,86.0 590.3,84.0 594.4,82.0 598.4,80.0 602.5,78.0 606.6,76.0 610.6,74.0 614.7,72.0 618.8,70.0 622.8,70.0 626.9,70.0 630.9,70.0 635.0,70.0 639.1,70.0 643.1,70.0 647.2,70.0 651.2,70.0 655.3,70.0 659.4,70.0 663.4,70.0 667.5,70.0 671.6,70.0 675.6,70.0 679.7,70.0 683.8,70.0 687.8,70.0 691.9,70.0 695.9,70.0 700.0,70.0" style="stroke-width:2.4"/>
<line class="sD" x1="456.25" y1="46" x2="456.25" y2="190"/><text class="sS" x="456.25" y="206" text-anchor="middle">400px</text>
<line class="sD" x1="618.75" y1="46" x2="618.75" y2="190"/><text class="sS" x="618.75" y="206" text-anchor="middle">1200px</text>
<text class="sS" x="434" y="154" text-anchor="end">24</text>
<text class="sS" x="434" y="74" text-anchor="end">40</text>
<text class="sM" x="570" y="30" text-anchor="middle">clamp(1.5rem, 1rem + 2vw, 2.5rem)</text>
<text class="sS" x="470" y="166">floor</text><text class="sS" x="600" y="64" text-anchor="middle">ceiling</text><text class="sS" x="570" y="224" text-anchor="middle">viewport width → (font-size in px)</text>
</svg><figcaption>em multiplies down the tree, rem always refers to the root; clamp() gives fluid type with a floor and a ceiling. Computed.</figcaption></figure>

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
