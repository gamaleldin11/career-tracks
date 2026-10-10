# HTML and Accessibility — Semantic Markup, Forms, ARIA, RTL

HTML looks easy, so candidates under-prepare for it, and then lose points on "why a `<button>` and not a `<div>`?" or "how would a screen-reader user fill in this form?". Accessibility has also become a legal requirement for many products, including the **European Accessibility Act** (applying since **28 June 2025**) for anyone building for EU customers. Your bilingual English/Arabic studio site gives you a rare and valuable story here: real right-to-left layout.

> [!focus]
> **Entry must:** use semantic elements correctly; build an accessible form with labels and error messages; write good alt text; explain why native elements beat ARIA; meet colour-contrast basics; make a page keyboard-usable.
> **Mid adds:** WCAG 2.2 AA in practice, focus management in single-page apps and dialogs, live regions, responsive images, RTL with logical properties, automated and manual accessibility testing.
> **Most asked:** *What is semantic HTML and why does it matter?* · *`<button>` vs `<a>` vs `<div onclick>`?* · *What's ARIA and when do you use it?* · *How do you make a modal accessible?* · *What's WCAG?* · *How do you support Arabic?*
> **Time budget:** 2.5 hours.

## F1.0 Foundations: from HTML text to the DOM and the accessibility tree 🟢

HTML is a text format. What the browser actually works with is a tree, and assistive technology works with a second tree derived from it. Most of this module follows from that.

**Elements and attributes.** `<a href="/invoices" class="nav-link">Invoices</a>` is one **element**: a start tag with **attributes** (`name="value"`), content, and an end tag. **Void elements** such as `<img>`, `<input>`, `<br>` and `<meta>` have no content and no end tag. Elements nest like boxes, and the parser quietly repairs bad nesting, which is why invalid HTML often seems to work until a screen reader or a test meets it.

**The DOM.** The parser turns the text into the **Document Object Model**: a tree of element nodes, text nodes and comments. CSS selects nodes in this tree; JavaScript reads and changes it (`document.querySelector`, `element.append`). "The DOM changed" means this tree changed, not the HTML file.

**The accessibility tree.** From the DOM and the CSS, the browser builds a simpler tree for assistive technology. Each node has a **role** (button, link, heading level 2, textbox), a **name** (from the label, the `alt`, or the text inside), a **state** (expanded, checked, disabled, invalid) and sometimes a description. Screen readers never see your HTML; they read this tree through the operating system's accessibility API.

<figure class="dia steps"><svg viewBox="0 0 720 264" role="img" aria-label="HTML source becomes a DOM tree, and the browser derives an accessibility tree of roles and names from it; the clickable div appears only as text">
<text class="sT" x="115" y="22" text-anchor="middle">HTML source</text><text class="sT" x="360" y="22" text-anchor="middle">DOM tree</text><text class="sT" x="605" y="22" text-anchor="middle">Accessibility tree</text>
<g data-s="1"><rect class="sB" x="8" y="34" width="226" height="196" rx="8"/><text class="sC" x="16" y="56" xml:space="preserve" style="white-space:pre">&lt;nav aria-label="Main"&gt;</text><text class="sC" x="16" y="78" xml:space="preserve" style="white-space:pre">  &lt;a href="/"&gt;Home&lt;/a&gt;</text><text class="sC" x="16" y="100" xml:space="preserve" style="white-space:pre">&lt;/nav&gt;</text><text class="sC" x="16" y="122" xml:space="preserve" style="white-space:pre">&lt;main&gt;</text><text class="sC" x="16" y="144" xml:space="preserve" style="white-space:pre">  &lt;h1&gt;Invoices&lt;/h1&gt;</text><text class="sC" x="16" y="166" xml:space="preserve" style="white-space:pre">  &lt;button&gt;New invoice&lt;/button&gt;</text><text class="sC" x="16" y="188" xml:space="preserve" style="white-space:pre">  &lt;div onclick="…"&gt;Export&lt;/div&gt;</text><text class="sC" x="16" y="210" xml:space="preserve" style="white-space:pre">&lt;/main&gt;</text></g>
<g data-s="2"><rect class="sB" x="258" y="39" width="206" height="20" rx="4"/><text class="sC" x="264" y="53">nav  aria-label="Main"</text><rect class="sB" x="280" y="63" width="184" height="20" rx="4"/><text class="sC" x="286" y="77">a  href="/"</text><path class="sLm" d="M268 58 V73 H280"/><rect class="sN" x="302" y="87" width="162" height="20" rx="4"/><text class="sC" x="308" y="101">#text "Home"</text><path class="sLm" d="M290 82 V97 H302"/><rect class="sB" x="258" y="115" width="206" height="20" rx="4"/><text class="sC" x="264" y="129">main</text><rect class="sB" x="280" y="139" width="184" height="20" rx="4"/><text class="sC" x="286" y="153">h1</text><path class="sLm" d="M268 134 V149 H280"/><rect class="sN" x="302" y="163" width="162" height="20" rx="4"/><text class="sC" x="308" y="177">#text "Invoices"</text><path class="sLm" d="M290 158 V173 H302"/><rect class="sB" x="280" y="187" width="184" height="20" rx="4"/><text class="sC" x="286" y="201">button  "New invoice"</text><path class="sLm" d="M268 182 V197 H280"/><rect class="sB" x="280" y="211" width="184" height="20" rx="4"/><text class="sC" x="286" y="225">div  onclick  "Export"</text><path class="sLm" d="M268 206 V221 H280"/></g>
<g data-s="3"><rect class="sA" x="500" y="39" width="206" height="20" rx="4"/><text class="sC" x="506" y="53">navigation "Main"</text><rect class="sA" x="522" y="63" width="184" height="20" rx="4"/><text class="sC" x="528" y="77">link "Home"</text><path class="sLm" d="M510 58 V73 H522"/><rect class="sA" x="500" y="115" width="206" height="20" rx="4"/><text class="sC" x="506" y="129">main</text><rect class="sA" x="522" y="139" width="184" height="20" rx="4"/><text class="sC" x="528" y="153">heading, level 1 "Invoices"</text><path class="sLm" d="M510 134 V149 H522"/><rect class="sG" x="522" y="187" width="184" height="20" rx="4"/><text class="sC" x="528" y="201">button "New invoice"</text><path class="sLm" d="M510 182 V197 H522"/><rect class="sN" x="522" y="211" width="184" height="20" rx="4"/><text class="sC" x="528" y="225">text "Export"</text><path class="sLm" d="M510 206 V221 H522"/></g>
<g data-s="4"><rect class="sN" x="497" y="210" width="212" height="28" rx="6" style="stroke:var(--senior);stroke-width:2.5"/><text class="sRt" x="605" y="254" text-anchor="middle">no role, not focusable: not a control</text></g>
</svg><ol class="dia-steps">
<li>You write text: tags, attributes and content.</li>
<li>The parser turns it into the DOM, a tree of element and text nodes. CSS and JavaScript work on this tree, not on your file.</li>
<li>From the DOM the browser derives the accessibility tree: for each meaningful node a role, a name and a state. Screen readers and voice control read this tree through the operating system.</li>
<li>The <code>&lt;div onclick&gt;</code> becomes plain text. To assistive technology there is no "Export" control at all: no role, not focusable, not announced as clickable. A <code>&lt;button&gt;</code> would have been.</li>
</ol><figcaption>Three views of the same page. Chrome DevTools shows the third one: Elements panel → Accessibility.</figcaption></figure>

### Who relies on it

| Assistive technology | Used by | What it needs from your page |
|---|---|---|
| Screen readers (NVDA, JAWS, VoiceOver, TalkBack) | Blind and low-vision users | Correct roles and names, headings, landmarks, alt text, announced changes |
| Keyboard only, switch devices | People with motor impairments; power users | Everything focusable and operable, a visible focus, a logical order |
| Magnifiers, zoom to 200–400% | Low-vision users | Layouts that reflow; no text baked into images |
| Voice control (Voice Access, Voice Control, Dragon) | People with motor impairments | Visible labels that match accessible names, so "click Submit" works |
| Captions and transcripts | Deaf and hard-of-hearing users | Captions on video, text for audio |

The World Health Organization estimates that about 1.3 billion people, roughly one in six, live with a significant disability. Add temporary limits (a broken arm) and situational ones (a phone in bright sun, a noisy café), and accessible design is simply good design for everyone.

## F1.1 Semantic HTML 🟢 ⭐

> [!term] Semantic HTML
> Using elements for what they **mean**, not how they look: `<nav>` for navigation, `<button>` for actions, `<h2>` for a section heading. Browsers, screen readers, search engines and browser features (reader mode, autofill, translation) all rely on that meaning.

**Page landmarks** let screen-reader users jump straight to a region:

```html
<body>
  <a class="skip-link" href="#main">Skip to content</a>
  <header>…logo, site title…</header>
  <nav aria-label="Main">…primary links…</nav>
  <main id="main">
    <h1>Invoices</h1>
    <section aria-labelledby="overdue-h">
      <h2 id="overdue-h">Overdue</h2>
      <article>…one invoice card…</article>
    </section>
  </main>
  <aside>…related help…</aside>
  <footer>…</footer>
</body>
```

| Element | Use it for |
|---|---|
| `<main>` | The unique main content, **one per page** |
| `<nav>` | Major navigation blocks |
| `<header>` / `<footer>` | Introductory / closing content of the page or of a section |
| `<section>` | A thematic group **with a heading** |
| `<article>` | Self-contained content that makes sense alone (a post, a card, a comment) |
| `<aside>` | Tangential content |
| `<h1>`–`<h6>` | A real outline: one `<h1>`, then don't skip levels for styling |
| `<ul>`/`<ol>`, `<table>` | Lists and **tabular data** (never tables for layout) |
| `<time datetime="2026-10-03">` | Machine-readable dates |

<figure class="dia"><svg viewBox="0 0 720 252" role="img" aria-label="Page wireframe with header, nav, main, aside and footer and the landmark role each one exposes">
<rect class="sN" x="20" y="14" width="680" height="230" rx="10"/>
<rect class="sB" x="30" y="24" width="660" height="34" rx="6"/><text class="sM" x="40" y="46">&lt;header&gt;</text><text class="sGt" x="680" y="46" text-anchor="end">banner</text>
<rect class="sB" x="30" y="64" width="660" height="26" rx="6"/><text class="sM" x="40" y="82">&lt;nav&gt;</text><text class="sGt" x="680" y="82" text-anchor="end">navigation</text>
<rect class="sA" x="30" y="96" width="470" height="106" rx="6"/><text class="sM" x="40" y="116">&lt;main&gt;</text><text class="sGt" x="490" y="116" text-anchor="end">main</text>
<text class="sC" x="48" y="140">h1 Invoices</text><rect class="sB" x="44" y="148" width="210" height="46" rx="4"/><text class="sC" x="54" y="166">&lt;section&gt; h2 Overdue</text><rect class="sB" x="270" y="148" width="220" height="46" rx="4"/><text class="sC" x="280" y="166">&lt;section&gt; h2 Paid</text>
<rect class="sB" x="510" y="96" width="180" height="106" rx="6"/><text class="sM" x="520" y="116">&lt;aside&gt;</text><text class="sGt" x="680" y="116" text-anchor="end">complementary</text>
<rect class="sB" x="30" y="208" width="660" height="28" rx="6"/><text class="sM" x="40" y="227">&lt;footer&gt;</text><text class="sGt" x="680" y="227" text-anchor="end">contentinfo</text>
</svg><figcaption>Landmarks: each element on the left exposes the role on the right, which screen-reader users jump between with one key (D in NVDA, the rotor in VoiceOver).</figcaption></figure>

### Button, link or div? 🟢 ⭐

| | `<a href>` | `<button>` | `<div onclick>` |
|---|---|---|---|
| Purpose | **Navigate** to a URL | **Do something** (submit, open, toggle) | Nothing, semantically |
| Keyboard | Focusable; Enter activates | Focusable; Enter **and Space** activate | Not focusable, no keys, unless you rebuild it all |
| Screen reader | "Link" | "Button" | Nothing useful |
| Extras | Open in new tab, copy link, middle-click | Form submission, `disabled` | — |

> [!say]
> "A link goes somewhere and a button does something. I use the native elements because they come with keyboard support, focus and the right role for free; a div with a click handler has none of that, and rebuilding it with tabindex, key handlers and ARIA is more code and easy to get wrong."

> [!mistake] `<button>` inside a `<form>` submits by default
> A `<button>` without a `type` attribute is `type="submit"`, so a "Cancel" or "Show password" button in a form will submit it. Write `type="button"` for non-submit buttons.

## F1.2 Document essentials 🟢

```html
<!doctype html>
<html lang="en" dir="ltr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Invoices · FinSight</title>
  <meta name="description" content="Track invoices and cash flow for your company.">
  <link rel="icon" href="/favicon.svg">
</head>
```

- `<!doctype html>` puts the browser in **standards mode** (without it, quirks mode emulates old browser bugs).
- `lang` sets pronunciation for screen readers, hyphenation and translation prompts; `dir` sets text direction.
- The viewport meta tag makes mobile browsers use the device width instead of pretending to be a 980-pixel desktop.
- A unique, descriptive `<title>` per page or route is the first thing a screen reader announces, and it's what appears in tabs and search results.

## F1.3 Forms that everyone can use 🟢 ⭐

```html
<form novalidate>
  <div class="field">
    <label for="email">Work email</label>
    <input id="email" name="email" type="email" autocomplete="email" required
           aria-describedby="email-hint email-error" aria-invalid="true">
    <p id="email-hint" class="hint">We'll send the invoice here.</p>
    <p id="email-error" class="error">Enter an email address like name@company.com</p>
  </div>

  <fieldset>
    <legend>Billing period</legend>
    <label><input type="radio" name="period" value="monthly" checked> Monthly</label>
    <label><input type="radio" name="period" value="yearly"> Yearly</label>
  </fieldset>

  <button type="submit">Create invoice</button>
</form>
```

What makes it good:

- **Every input has a `<label>`** tied by `for`/`id` (or wrapping). Clicking the label focuses the input, and screen readers read it. A placeholder is **not** a label: it disappears when you type and often has poor contrast.
- **The right `type`** (`email`, `tel`, `number`, `date`, `url`) gives the right mobile keyboard and built-in validation.
- **`autocomplete`** tokens (`email`, `name`, `tel`, `street-address`, `one-time-code`, `current-password`, `new-password`) let browsers and password managers fill fields, which also satisfies WCAG's *Identify Input Purpose* criterion.
- **Errors** are text (not just a red border), linked with `aria-describedby`, flagged with `aria-invalid`, and say **how to fix** the problem. On submit, move focus to the first invalid field or an error summary.
- **Related controls** are grouped with `<fieldset>` and `<legend>`.

## F1.4 Images and media 🟢 ⭐

**Alt text** describes the image's *purpose in context*:

| Image | `alt` |
|---|---|
| Informative ("Revenue rose 18% in Q3" chart) | The insight: `alt="Revenue rose 18% in Q3, led by subscriptions"` |
| Functional (an icon-only search button) | The action: `alt="Search"` (or `aria-label` on the button) |
| Decorative (a background flourish) | Empty: `alt=""`, so screen readers skip it |
| Complex (a detailed chart) | A short alt plus the data in a table or text nearby |

Never write "image of…"; the screen reader already says "image".

**Responsive images:**

```html
<img src="hero-800.jpg"
     srcset="hero-400.jpg 400w, hero-800.jpg 800w, hero-1600.jpg 1600w"
     sizes="(max-width: 600px) 100vw, 50vw"
     width="1600" height="900" alt="Team reviewing a dashboard"
     loading="lazy" decoding="async">
```

<figure class="dia"><svg viewBox="0 0 720 296" role="img" aria-label="Which srcset candidate each device downloads: phones get a slot of 100vw and tablets and computers 50vw; multiplying by the device pixel ratio gives the pixels needed, and the browser takes the smallest file at least that wide, so a 360-pixel phone at 1x gets the 400-pixel file, a 375-pixel phone at 2x, a tablet and a 1366-pixel laptop get the 800-pixel file, and a 390-pixel phone at 3x, a 1920-pixel desktop and a high-density laptop get the 1600-pixel file">
<text class="sT" x="14" y="22">device</text>
<text class="sT" x="128" y="22" text-anchor="middle">slot (sizes)</text>
<text class="sT" x="200" y="22" text-anchor="middle">× DPR</text>
<text class="sT" x="262" y="22" text-anchor="middle">needs</text>
<text class="sT" x="505" y="22" text-anchor="middle">file the browser downloads</text>
<line class="sLm" x1="422.5" y1="30" x2="422.5" y2="254" stroke-dasharray="3 4" opacity=".6"/><text class="sS" x="422.5" y="270" text-anchor="middle">400w</text>
<line class="sLm" x1="505" y1="30" x2="505" y2="254" stroke-dasharray="3 4" opacity=".6"/><text class="sS" x="505" y="270" text-anchor="middle">800w</text>
<line class="sLm" x1="670" y1="30" x2="670" y2="254" stroke-dasharray="3 4" opacity=".6"/><text class="sS" x="670" y="270" text-anchor="middle">1600w</text>
<text class="sS" x="14" y="54">old phone 360px</text><text class="sS" x="128" y="54" text-anchor="middle">360px</text><text class="sS" x="200" y="54" text-anchor="middle">1</text><text class="sS" x="262" y="54" text-anchor="middle">360px</text>
<rect class="sG" x="340" y="40" width="82.5" height="20" rx="4" opacity=".6"/><line class="sLw" x1="414.25" y1="37" x2="414.25" y2="63" style="stroke-width:2.5"/>
<text class="sT" x="430.5" y="54">hero-400.jpg</text>
<text class="sS" x="14" y="86">phone 375px</text><text class="sS" x="128" y="86" text-anchor="middle">375px</text><text class="sS" x="200" y="86" text-anchor="middle">2</text><text class="sS" x="262" y="86" text-anchor="middle">750px</text>
<rect class="sG" x="340" y="72" width="165" height="20" rx="4" opacity=".6"/><line class="sLw" x1="494.688" y1="69" x2="494.688" y2="95" style="stroke-width:2.5"/>
<text class="sT" x="499" y="86" text-anchor="end">hero-800.jpg</text>
<text class="sS" x="14" y="118">phone 390px</text><text class="sS" x="128" y="118" text-anchor="middle">390px</text><text class="sS" x="200" y="118" text-anchor="middle">3</text><text class="sS" x="262" y="118" text-anchor="middle">1170px</text>
<rect class="sB" x="340" y="104" width="330" height="20" rx="4" opacity=".6"/><line class="sLw" x1="581.312" y1="101" x2="581.312" y2="127" style="stroke-width:2.5"/>
<text class="sT" x="664" y="118" text-anchor="end">hero-1600.jpg</text>
<text class="sS" x="14" y="150">tablet 768px</text><text class="sS" x="128" y="150" text-anchor="middle">384px</text><text class="sS" x="200" y="150" text-anchor="middle">2</text><text class="sS" x="262" y="150" text-anchor="middle">768px</text>
<rect class="sG" x="340" y="136" width="165" height="20" rx="4" opacity=".6"/><line class="sLw" x1="498.4" y1="133" x2="498.4" y2="159" style="stroke-width:2.5"/>
<text class="sT" x="499" y="150" text-anchor="end">hero-800.jpg</text>
<text class="sS" x="14" y="182">laptop 1366px</text><text class="sS" x="128" y="182" text-anchor="middle">683px</text><text class="sS" x="200" y="182" text-anchor="middle">1</text><text class="sS" x="262" y="182" text-anchor="middle">683px</text>
<rect class="sG" x="340" y="168" width="165" height="20" rx="4" opacity=".6"/><line class="sLw" x1="480.869" y1="165" x2="480.869" y2="191" style="stroke-width:2.5"/>
<text class="sT" x="499" y="182" text-anchor="end">hero-800.jpg</text>
<text class="sS" x="14" y="214">desktop 1920px</text><text class="sS" x="128" y="214" text-anchor="middle">960px</text><text class="sS" x="200" y="214" text-anchor="middle">1</text><text class="sS" x="262" y="214" text-anchor="middle">960px</text>
<rect class="sB" x="340" y="200" width="330" height="20" rx="4" opacity=".6"/><line class="sLw" x1="538" y1="197" x2="538" y2="223" style="stroke-width:2.5"/>
<text class="sT" x="664" y="214" text-anchor="end">hero-1600.jpg</text>
<text class="sS" x="14" y="246">laptop 1440px</text><text class="sS" x="128" y="246" text-anchor="middle">720px</text><text class="sS" x="200" y="246" text-anchor="middle">2</text><text class="sS" x="262" y="246" text-anchor="middle">1440px</text>
<rect class="sB" x="340" y="232" width="330" height="20" rx="4" opacity=".6"/><line class="sLw" x1="637" y1="229" x2="637" y2="255" style="stroke-width:2.5"/>
<text class="sT" x="664" y="246" text-anchor="end">hero-1600.jpg</text>
<line class="sLw" x1="470" y1="284" x2="490" y2="284" style="stroke-width:2.5"/><text class="sS" x="496" y="288">pixels actually needed</text>
</svg><figcaption>The srcset and sizes above, worked through per device: slot width × device pixel ratio, then the smallest candidate that covers it (browsers may also reuse a larger cached file).</figcaption></figure>

`srcset` + `sizes` let the browser download the smallest file that looks sharp. **`width` and `height`** reserve space before the image loads, which prevents layout shift (CLS, [[F9]]). Use `loading="lazy"` for below-the-fold images, but **not** for the main hero image. `<picture>` serves modern formats (AVIF, WebP) with a fallback.

Video needs **captions** (`<track kind="captions">`); audio needs a transcript.

## F1.5 WCAG in practice 🟢 🟡 ⭐

> [!term] WCAG
> The **Web Content Accessibility Guidelines**, the W3C standard for accessible web content. The current version is **WCAG 2.2** (October 2023). Criteria are graded **A** (minimum), **AA** (the usual legal and contractual target) and **AAA** (enhanced). They're organised under four principles: **POUR**.

| Principle | Means | Examples |
|---|---|---|
| **Perceivable** | Users can perceive the content | Alt text, captions, contrast, content not conveyed by colour alone |
| **Operable** | Users can operate the interface | Keyboard access, enough time, no seizure-inducing flashing, visible focus |
| **Understandable** | Content and behaviour are predictable | Clear labels and errors, consistent navigation, the page language set |
| **Robust** | Works with assistive technologies | Valid semantics, correct names, roles and states |

**New in WCAG 2.2 at A and AA**, the ones to name in an interview:

| Criterion | Level | Requirement |
|---|---|---|
| 2.4.11 Focus Not Obscured (Minimum) | AA | The focused element isn't completely hidden by sticky headers, cookie banners and the like |
| 2.5.7 Dragging Movements | AA | Anything done by dragging also has a single-pointer alternative (buttons to reorder, not only drag-and-drop) |
| 2.5.8 Target Size (Minimum) | AA | Pointer targets are at least **24 × 24 CSS pixels** (or spaced to that), with exceptions |
| 3.2.6 Consistent Help | A | Help links or contact details appear in the same place across pages |
| 3.3.7 Redundant Entry | A | Don't make users re-type information they already gave in the same process |
| 3.3.8 Accessible Authentication (Minimum) | AA | No cognitive test (memorising, transcribing) to log in; allow paste and password managers |

WCAG 2.2 also removed criterion 4.1.1 *Parsing*, which modern browsers made obsolete.

> [!say]
> "I target WCAG 2.2 AA: semantic HTML first, every control keyboard-operable with a visible focus, labelled forms with clear errors, 4.5 to 1 text contrast, and alt text that conveys purpose. WCAG 2.2 added things like a 24-pixel minimum target size and not hiding the focused element under sticky headers."

## F1.6 Keyboard and focus 🟢 ⭐

Many users never touch a mouse: blind users, people with motor impairments, power users. Test every page with **Tab, Shift+Tab, Enter, Space, Esc and the arrow keys**.

- **Focus order follows the DOM order.** Don't fix visual order with CSS while the DOM says something else.
- `tabindex="0"` adds a custom element to the natural tab order; `tabindex="-1"` makes it focusable from code but not by Tab; **positive `tabindex` values are almost always a mistake**.
- **Never remove the focus outline** without a replacement. Use `:focus-visible` to show it for keyboard users without showing it on every mouse click.
- Add a **skip link** to jump past the navigation.
- **Single-page apps:** after a route change, nothing is announced and focus stays on the old link. Move focus to the new page's `<h1>` (with `tabindex="-1"`) or announce the change, and update `document.title`. Angular and React don't do this for you by default.

### Accessible dialogs 🟡 ⭐

The native `<dialog>` element handles most of the hard parts when opened with `showModal()`: it traps focus inside, makes the rest of the page **inert**, closes on Esc, and renders in the top layer.

```html
<dialog id="confirm" aria-labelledby="confirm-title">
  <h2 id="confirm-title">Delete this invoice?</h2>
  <p>This can't be undone.</p>
  <form method="dialog">
    <button value="cancel">Cancel</button>
    <button value="delete">Delete</button>
  </form>
</dialog>
<script>
  const dlg = document.getElementById("confirm");
  openBtn.addEventListener("click", () => dlg.showModal());
  dlg.addEventListener("close", () => { openBtn.focus(); /* dlg.returnValue === "delete"? */ });
</script>
```

The checklist for any modal: focus moves into it on open; Tab stays inside; Esc closes it; focus **returns to the element that opened it**; the background can't be reached by keyboard or screen reader; it has an accessible name.

<figure class="dia steps" data-start="1"><svg viewBox="0 0 720 246" role="img" aria-label="Focus management for a modal dialog: focus moves into the dialog, stays inside on Tab, and returns to the opening button on close">
<rect class="sB" x="20" y="20" width="300" height="200" rx="10"/><text class="sT" x="170" y="44" text-anchor="middle">Invoices page</text>
<rect class="sN" x="40" y="60" width="260" height="20" rx="4"/><rect class="sN" x="40" y="88" width="260" height="20" rx="4"/><rect class="sN" x="40" y="116" width="260" height="20" rx="4"/>
<rect class="sW" x="170" y="164" width="130" height="32" rx="6"/><text class="sC" x="235" y="185" text-anchor="middle">Delete invoice</text>
<g data-s="1-1"><rect class="sN" x="166" y="160" width="138" height="40" rx="9" style="stroke:var(--accent);stroke-width:3"/><text class="sS" x="520" y="120" text-anchor="middle">focus is on the button</text></g>
<g data-s="2-3"><rect class="sA" x="380" y="50" width="320" height="150" rx="12"/><text class="sT" x="540" y="78" text-anchor="middle">Delete this invoice?</text><text class="sC" x="540" y="100" text-anchor="middle">This can't be undone.</text><rect class="sB" x="420" y="140" width="110" height="34" rx="6"/><text class="sC" x="475" y="162" text-anchor="middle">Cancel</text><rect class="sR" x="560" y="140" width="110" height="34" rx="6"/><text class="sC" x="615" y="162" text-anchor="middle">Delete</text><rect class="sFs" x="20" y="20" width="300" height="200" rx="10" opacity=".7"/><text class="sRt" x="170" y="120" text-anchor="middle">inert: unreachable</text></g>
<g data-s="2-2"><rect class="sN" x="416" y="136" width="118" height="42" rx="9" style="stroke:var(--accent);stroke-width:3"/><text class="sS" x="540" y="226" text-anchor="middle">showModal(): focus moves into the dialog</text></g>
<g data-s="3-3"><rect class="sN" x="556" y="136" width="118" height="42" rx="9" style="stroke:var(--accent);stroke-width:3"/><path class="sLw" d="M530 196 C560 216 600 216 615 200" marker-end="url(#ahw)"/><path class="sLw" d="M600 136 C560 116 500 116 475 136" marker-end="url(#ahw)"/><text class="sS" x="540" y="236" text-anchor="middle">Tab cycles Cancel ↔ Delete; it never escapes</text></g>
<g data-s="4-4"><rect class="sN" x="166" y="160" width="138" height="40" rx="9" style="stroke:var(--accent);stroke-width:3"/><text class="sS" x="520" y="120" text-anchor="middle">Esc closes it;</text><text class="sGt" x="520" y="140" text-anchor="middle">focus returns to the opener</text></g>
</svg><ol class="dia-steps">
<li>A keyboard user reaches "Delete invoice" and presses Enter.</li>
<li><code>showModal()</code> moves focus into the dialog and makes the page behind it inert: no Tab stops, nothing for a screen reader to wander into.</li>
<li>Tab and Shift+Tab cycle between the dialog's controls only.</li>
<li>Esc (or either button) closes the dialog, and focus goes back to the button that opened it, so the user continues where they were.</li>
</ol><figcaption>The modal checklist, step by step. The native <code>&lt;dialog&gt;</code> does the middle two for you; returning focus is your job.</figcaption></figure>

## F1.7 ARIA, and the first rule of ARIA 🟢 🟡 ⭐

> [!term] ARIA (Accessible Rich Internet Applications)
> Attributes that tell assistive technology the **role** (what it is), **state** (expanded, checked, selected) and **properties** (label, description, relationships) of an element when native HTML can't express it. ARIA changes only what's *announced*; it adds **no behaviour**: no focus, no keyboard handling.

**The first rule of ARIA:** if a native HTML element or attribute already has the semantics and behaviour you need, **use it instead of adding ARIA**. "No ARIA is better than bad ARIA": incorrect roles make pages *worse* for screen-reader users.

ARIA you'll genuinely use:

| Attribute | Use |
|---|---|
| `aria-label="Close"` | Name an icon-only button |
| `aria-labelledby="id"` / `aria-describedby="id"` | Point to visible text that names or describes an element |
| `aria-expanded="true/false"` | On the button that toggles a menu, accordion or disclosure |
| `aria-controls="id"` | Which element that button controls |
| `aria-current="page"` | The current link in navigation |
| `aria-hidden="true"` | Hide decorative icons from screen readers (never on focusable elements) |
| `aria-live="polite"`, `role="status"` / `role="alert"` | Announce dynamic changes: "Saved", "3 results", errors |
| `aria-invalid`, `aria-required` | Form field state |

```html
<button aria-expanded="false" aria-controls="filters" id="filtersBtn">Filters</button>
<div id="filters" hidden>…</div>

<div role="status" aria-live="polite" class="visually-hidden" id="announcer"></div>
<!-- later, in JS: announcer.textContent = "Invoice saved"; -->
```

<figure class="dia steps"><svg viewBox="0 0 720 226" role="img" aria-label="A disclosure button and a live region traced through the DOM, the accessibility tree and speech: the collapsed button is announced as collapsed with its panel hidden; pressing Enter clicks the native button; setting aria-expanded to true and removing hidden updates the tree and is announced as expanded; writing Invoice saved into a polite status region is announced after the current speech">
<text class="sS" x="160" y="22" text-anchor="middle">DOM (what your code changes)</text><text class="sS" x="452" y="22" text-anchor="middle">accessibility tree</text><text class="sS" x="640" y="22" text-anchor="middle">screen reader says</text>
<rect class="sN" x="14" y="32" width="300" height="186" rx="8"/><rect class="sN" x="356" y="32" width="192" height="186" rx="8"/>
<g data-s="1-1"><text class="sS" x="24" y="56" xml:space="preserve" style="white-space:pre">&lt;button aria-expanded="false"</text><text class="sS" x="24" y="74" xml:space="preserve" style="white-space:pre">        aria-controls="filters"&gt;</text><text class="sS" x="24" y="92" xml:space="preserve" style="white-space:pre">  Filters&lt;/button&gt;</text><text class="sS" x="24" y="122" xml:space="preserve" style="white-space:pre">&lt;div id="filters" hidden&gt;…&lt;/div&gt;</text><text class="sS" x="24" y="152" xml:space="preserve" style="white-space:pre">&lt;div role="status"</text><text class="sS" x="24" y="170" xml:space="preserve" style="white-space:pre">     aria-live="polite"&gt;</text><text class="sS" x="24" y="188" xml:space="preserve" style="white-space:pre">  &lt;/div&gt;</text><rect class="sB" x="366" y="44" width="172" height="46" rx="6"/><text class="sT" x="452" y="62" text-anchor="middle">button "Filters"</text><text class="sWt" x="452" y="80" text-anchor="middle">collapsed</text><text class="sS" x="452" y="124" text-anchor="middle">(hidden: not in tree)</text><rect class="sA" x="366" y="148" width="172" height="46" rx="6"/><text class="sT" x="452" y="166" text-anchor="middle">status (polite)</text><text class="sS" x="452" y="184" text-anchor="middle">empty</text><rect class="sG" x="570" y="40" width="136" height="76" rx="12" opacity=".5"/><text class="sT" x="638" y="58" text-anchor="middle">"Filters,</text><text class="sT" x="638" y="76" text-anchor="middle">button,</text><text class="sT" x="638" y="94" text-anchor="middle">collapsed"</text></g>
<g data-s="2-2"><text class="sS" x="24" y="56" xml:space="preserve" style="white-space:pre">&lt;button aria-expanded="false"</text><text class="sS" x="24" y="74" xml:space="preserve" style="white-space:pre">        aria-controls="filters"&gt;</text><text class="sS" x="24" y="92" xml:space="preserve" style="white-space:pre">  Filters&lt;/button&gt;</text><text class="sS" x="24" y="122" xml:space="preserve" style="white-space:pre">&lt;div id="filters" hidden&gt;…&lt;/div&gt;</text><text class="sS" x="24" y="152" xml:space="preserve" style="white-space:pre">&lt;div role="status"</text><text class="sS" x="24" y="170" xml:space="preserve" style="white-space:pre">     aria-live="polite"&gt;</text><text class="sS" x="24" y="188" xml:space="preserve" style="white-space:pre">  &lt;/div&gt;</text><rect class="sB" x="366" y="44" width="172" height="46" rx="6"/><text class="sT" x="452" y="62" text-anchor="middle">button "Filters"</text><text class="sWt" x="452" y="80" text-anchor="middle">collapsed</text><text class="sS" x="452" y="124" text-anchor="middle">(hidden: not in tree)</text><rect class="sA" x="366" y="148" width="172" height="46" rx="6"/><text class="sT" x="452" y="166" text-anchor="middle">status (polite)</text><text class="sS" x="452" y="184" text-anchor="middle">empty</text><rect class="sW" x="14" y="36" width="300" height="64" rx="6" style="fill:none;stroke-width:2"/><text class="sWt" x="164" y="212" text-anchor="middle">Enter or Space → click: native button behaviour</text><rect class="sN" x="570" y="40" width="136" height="58" rx="12"/><text class="sS" x="638" y="64" text-anchor="middle">(user presses</text><text class="sS" x="638" y="82" text-anchor="middle">Enter)</text></g>
<g data-s="3-3"><text class="sS" x="24" y="56" xml:space="preserve" style="white-space:pre">&lt;button aria-expanded="true"</text><text class="sS" x="24" y="74" xml:space="preserve" style="white-space:pre">        aria-controls="filters"&gt;</text><text class="sS" x="24" y="92" xml:space="preserve" style="white-space:pre">  Filters&lt;/button&gt;</text><text class="sS" x="24" y="122" xml:space="preserve" style="white-space:pre">&lt;div id="filters"&gt;…&lt;/div&gt;</text><text class="sS" x="24" y="152" xml:space="preserve" style="white-space:pre">&lt;div role="status"</text><text class="sS" x="24" y="170" xml:space="preserve" style="white-space:pre">     aria-live="polite"&gt;</text><text class="sS" x="24" y="188" xml:space="preserve" style="white-space:pre">  &lt;/div&gt;</text><rect class="sB" x="366" y="44" width="172" height="46" rx="6"/><text class="sT" x="452" y="62" text-anchor="middle">button "Filters"</text><text class="sGt" x="452" y="80" text-anchor="middle">expanded</text><rect class="sV" x="366" y="104" width="172" height="30" rx="6"/><text class="sT" x="452" y="124" text-anchor="middle">region: filters</text><rect class="sA" x="366" y="148" width="172" height="46" rx="6"/><text class="sT" x="452" y="166" text-anchor="middle">status (polite)</text><text class="sS" x="452" y="184" text-anchor="middle">empty</text><rect class="sG" x="570" y="40" width="136" height="76" rx="12" opacity=".5"/><text class="sT" x="638" y="58" text-anchor="middle">"Filters,</text><text class="sT" x="638" y="76" text-anchor="middle">button,</text><text class="sT" x="638" y="94" text-anchor="middle">expanded"</text></g>
<g data-s="4-4"><text class="sS" x="24" y="56" xml:space="preserve" style="white-space:pre">&lt;button aria-expanded="true"</text><text class="sS" x="24" y="74" xml:space="preserve" style="white-space:pre">        aria-controls="filters"&gt;</text><text class="sS" x="24" y="92" xml:space="preserve" style="white-space:pre">  Filters&lt;/button&gt;</text><text class="sS" x="24" y="122" xml:space="preserve" style="white-space:pre">&lt;div id="filters"&gt;…&lt;/div&gt;</text><text class="sS" x="24" y="152" xml:space="preserve" style="white-space:pre">&lt;div role="status"</text><text class="sS" x="24" y="170" xml:space="preserve" style="white-space:pre">     aria-live="polite"&gt;</text><text class="sGt" x="24" y="188" xml:space="preserve" style="white-space:pre">  Invoice saved&lt;/div&gt;</text><rect class="sB" x="366" y="44" width="172" height="46" rx="6"/><text class="sT" x="452" y="62" text-anchor="middle">button "Filters"</text><text class="sGt" x="452" y="80" text-anchor="middle">expanded</text><rect class="sV" x="366" y="104" width="172" height="30" rx="6"/><text class="sT" x="452" y="124" text-anchor="middle">region: filters</text><rect class="sA" x="366" y="148" width="172" height="46" rx="6"/><text class="sT" x="452" y="166" text-anchor="middle">status (polite)</text><text class="sGt" x="452" y="184" text-anchor="middle">"Invoice saved"</text><rect class="sG" x="570" y="40" width="136" height="94" rx="12" opacity=".5"/><text class="sT" x="638" y="58" text-anchor="middle">… finishes</text><text class="sT" x="638" y="76" text-anchor="middle">current speech,</text><text class="sT" x="638" y="94" text-anchor="middle">then: "Invoice</text><text class="sT" x="638" y="112" text-anchor="middle">saved"</text></g>
</svg><ol class="dia-steps">
<li>The button's aria-expanded="false" becomes the state "collapsed" in the accessibility tree; the hidden panel is not in the tree at all.</li>
<li>Keyboard activation comes from the native button element, not from ARIA: Enter and Space fire click for free.</li>
<li>Your click handler sets aria-expanded="true" and removes hidden. The tree updates, and the screen reader announces the new state.</li>
<li>Later, writing text into the polite live region queues an announcement without moving focus: "Invoice saved".</li>
</ol><figcaption>ARIA changes what is announced, not what happens: the button supplies the behaviour, your code keeps the attributes true.</figcaption></figure>

> [!say]
> "ARIA describes roles and states to assistive technology but adds no behaviour, so my first choice is always a native element. I use ARIA to fill gaps: labelling icon buttons, aria-expanded on disclosure buttons, and live regions so screen readers hear 'saved' or new search results."

## F1.8 Colour and contrast 🟢

- **Text contrast** at AA: at least **4.5 : 1** for normal text, **3 : 1** for large text (about 24 px, or 18.66 px bold).
- **Non-text contrast**: UI component boundaries, focus indicators and meaningful graphics need **3 : 1** against adjacent colours.
<figure class="dia"><svg viewBox="0 0 720 272" role="img" aria-label="Contrast ratios computed with the WCAG formula: grey 999999 on white is 2.85 to 1 and fails; 777777 is 4.48 and just fails normal text; 767676 is 4.54 and passes; 595959 is 7 to 1; white on a 1e88e5 blue is about 3.7 and only passes for large text; white on 1565c0 passes; white on e53935 red is about 4.2 and only passes for large text">
<text class="sT" x="14" y="22">pair</text><text class="sT" x="430" y="22" text-anchor="middle">ratio</text><text class="sT" x="530" y="22" text-anchor="middle">text (4.5)</text><text class="sT" x="640" y="22" text-anchor="middle">large / UI (3)</text>
<rect x="14" y="32" width="210" height="24" rx="5" style="fill:#ffffff;stroke:#888;stroke-width:.5"/>
<text x="24" y="49" style="fill:#999999;font-size:13px;font-weight:600">Pay invoice · #999999</text>
<text class="sS" x="234" y="48">placeholder grey</text><text class="sT" x="430" y="48" text-anchor="middle">2.85 : 1</text>
<text class="sRt" x="530" y="48" text-anchor="middle">fail</text><text class="sRt" x="640" y="48" text-anchor="middle">fail</text>
<rect x="14" y="62" width="210" height="24" rx="5" style="fill:#ffffff;stroke:#888;stroke-width:.5"/>
<text x="24" y="79" style="fill:#777777;font-size:13px;font-weight:600">Pay invoice · #777777</text>
<text class="sS" x="234" y="78">looks fine…</text><text class="sT" x="430" y="78" text-anchor="middle">4.48 : 1</text>
<text class="sRt" x="530" y="78" text-anchor="middle">fail</text><text class="sGt" x="640" y="78" text-anchor="middle">pass</text>
<rect x="14" y="92" width="210" height="24" rx="5" style="fill:#ffffff;stroke:#888;stroke-width:.5"/>
<text x="24" y="109" style="fill:#767676;font-size:13px;font-weight:600">Pay invoice · #767676</text>
<text class="sS" x="234" y="108">one step darker</text><text class="sT" x="430" y="108" text-anchor="middle">4.54 : 1</text>
<text class="sGt" x="530" y="108" text-anchor="middle">pass</text><text class="sGt" x="640" y="108" text-anchor="middle">pass</text>
<rect x="14" y="122" width="210" height="24" rx="5" style="fill:#ffffff;stroke:#888;stroke-width:.5"/>
<text x="24" y="139" style="fill:#595959;font-size:13px;font-weight:600">Pay invoice · #595959</text>
<text class="sS" x="234" y="138">body text</text><text class="sT" x="430" y="138" text-anchor="middle">7.00 : 1</text>
<text class="sGt" x="530" y="138" text-anchor="middle">pass</text><text class="sGt" x="640" y="138" text-anchor="middle">pass</text>
<rect x="14" y="152" width="210" height="24" rx="5" style="fill:#1e88e5;stroke:#888;stroke-width:.5"/>
<text x="24" y="169" style="fill:#ffffff;font-size:13px;font-weight:600">Pay invoice · #ffffff</text>
<text class="sS" x="234" y="168">white on a blue button</text><text class="sT" x="430" y="168" text-anchor="middle">3.68 : 1</text>
<text class="sRt" x="530" y="168" text-anchor="middle">fail</text><text class="sGt" x="640" y="168" text-anchor="middle">pass</text>
<rect x="14" y="182" width="210" height="24" rx="5" style="fill:#1565c0;stroke:#888;stroke-width:.5"/>
<text x="24" y="199" style="fill:#ffffff;font-size:13px;font-weight:600">Pay invoice · #ffffff</text>
<text class="sS" x="234" y="198">a darker blue</text><text class="sT" x="430" y="198" text-anchor="middle">5.75 : 1</text>
<text class="sGt" x="530" y="198" text-anchor="middle">pass</text><text class="sGt" x="640" y="198" text-anchor="middle">pass</text>
<rect x="14" y="212" width="210" height="24" rx="5" style="fill:#e53935;stroke:#888;stroke-width:.5"/>
<text x="24" y="229" style="fill:#ffffff;font-size:13px;font-weight:600">Pay invoice · #ffffff</text>
<text class="sS" x="234" y="228">white on red</text><text class="sT" x="430" y="228" text-anchor="middle">4.23 : 1</text>
<text class="sRt" x="530" y="228" text-anchor="middle">fail</text><text class="sGt" x="640" y="228" text-anchor="middle">pass</text>
<text class="sS" x="14" y="260" xml:space="preserve" style="white-space:pre">ratio = (L_light + 0.05) / (L_dark + 0.05),   L = 0.2126 R + 0.7152 G + 0.0722 B  (linearised sRGB)</text>
</svg><figcaption>Contrast is a number, not a judgement: ratios computed with the WCAG 2 formula. #777 on white misses AA by a hair.</figcaption></figure>

- **Don't use colour alone** to convey meaning: an error shown only by a red border fails colour-blind users. Add an icon or text.
- Respect user settings: `prefers-reduced-motion` (turn off big animations), `prefers-color-scheme` (dark mode), and zoom to 200% without breaking the layout.

## F1.9 Arabic, RTL and internationalisation 🟢 🟡 ⭐

This matters in Egypt and across the Gulf, and few candidates can talk about it.

```html
<html lang="ar" dir="rtl">
```

- Set `dir="rtl"` on the root (or on a container) so the browser mirrors text flow, table column order, form layout and scrollbars.
- Use **CSS logical properties** instead of left and right, so one stylesheet serves both directions:

| Physical (avoid) | Logical (use) |
|---|---|
| `margin-left` | `margin-inline-start` |
| `padding-right` | `padding-inline-end` |
| `left: 0` | `inset-inline-start: 0` |
| `text-align: left` | `text-align: start` |
| `border-left` | `border-inline-start` |

- Flexbox and grid already follow the writing direction. **Mirror directional icons** (back arrows, "next" chevrons) but **not** universal ones (a play button, a clock, logos, checkmarks).

<figure class="dia"><svg viewBox="0 0 720 200" role="img" aria-label="The same card in left-to-right English and right-to-left Arabic, mirrored by logical CSS properties">
<text class="sM" x="180" y="20" text-anchor="middle">lang="en" dir="ltr"</text><rect class="sB" x="20" y="30" width="320" height="90" rx="10"/><circle class="sA" cx="60" cy="75" r="22"/><text class="sT" x="92" y="68">Mona Ahmed</text><text class="sC" x="92" y="88">Invoice 42 · EGP 1,200</text><text class="sX" x="316" y="80" text-anchor="middle">›</text>
<text class="sM" x="540" y="20" text-anchor="middle">lang="ar" dir="rtl"</text><rect class="sB" x="380" y="30" width="320" height="90" rx="10"/><circle class="sA" cx="660" cy="75" r="22"/><text class="sT" x="630" y="68" text-anchor="end">منى أحمد</text><text class="sC" x="630" y="88" text-anchor="end">فاتورة ٤٢ · ١٬٢٠٠ ج.م</text><text class="sX" x="404" y="80" text-anchor="middle">‹</text>
<line class="sLg" x1="40" y1="140" x2="200" y2="140" marker-end="url(#ahg)"/><text class="sGt" x="40" y="158">inline-start → inline-end</text>
<line class="sLg" x1="680" y1="140" x2="520" y2="140" marker-end="url(#ahg)"/><text class="sGt" x="680" y="158" text-anchor="end">inline-start → inline-end</text>
<text class="sS" x="360" y="186" text-anchor="middle">Same CSS: margin-inline-start, padding-inline-end, text-align: start. The chevron mirrors; a play icon or a logo would not.</text>
</svg><figcaption>One stylesheet, two directions. Logical properties follow the text direction; physical left and right do not.</figcaption></figure>

- Mixed text (an English product name or a phone number inside Arabic) can reorder unexpectedly; wrap it in `<bdi>` or set `dir="auto"` on user-generated content.
- Choose a typeface with a good Arabic design (Cairo, Tajawal, IBM Plex Sans Arabic, Noto Naskh/Kufi Arabic), and give Arabic text slightly more line height.
- Format numbers, dates and currency with `Intl` (`new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP' })`) and decide deliberately between Western (0–9) and Eastern Arabic (٠–٩) numerals.

<figure class="dia"><svg viewBox="0 0 720 184" role="img" aria-label="Intl formatting in Node for three locales: en-EG gives EGP 1,234,567.50, October 10, 2026 and 18.4 percent; ar-EG gives the same values with Eastern Arabic digits, the Arabic currency abbreviation and Arabic month name; ar-EG with the latn numbering system keeps Western digits with Arabic words">
<text class="sT" x="110" y="22" text-anchor="middle">locale</text>
<text class="sT" x="300" y="22" text-anchor="middle">currency(1234567.5, EGP)</text>
<text class="sT" x="480" y="22" text-anchor="middle">date (long)</text>
<text class="sT" x="630" y="22" text-anchor="middle">percent(0.184)</text>
<rect class="sN" x="14" y="34" width="692" height="32" rx="6"/>
<text class="sS" x="24" y="55" xml:space="preserve" style="white-space:pre">en-EG</text>
<text class="sT" x="300" y="55" text-anchor="middle">EGP 1,234,567.50</text>
<text class="sT" x="480" y="55" text-anchor="middle">October 10, 2026</text>
<text class="sT" x="630" y="55" text-anchor="middle">18.4%</text>
<rect class="sN" x="14" y="74" width="692" height="32" rx="6" opacity=".6"/>
<text class="sS" x="24" y="95" xml:space="preserve" style="white-space:pre">ar-EG</text>
<text class="sT" x="300" y="95" text-anchor="middle">١٬٢٣٤٬٥٦٧٫٥٠ ج.م.</text>
<text class="sT" x="480" y="95" text-anchor="middle">١٠ أكتوبر ٢٠٢٦</text>
<text class="sT" x="630" y="95" text-anchor="middle">١٨٫٤٪</text>
<rect class="sN" x="14" y="114" width="692" height="32" rx="6"/>
<text class="sS" x="24" y="135" xml:space="preserve" style="white-space:pre">ar-EG-u-nu-latn</text>
<text class="sT" x="300" y="135" text-anchor="middle">1,234,567.50 ج.م.</text>
<text class="sT" x="480" y="135" text-anchor="middle">10 أكتوبر 2026</text>
<text class="sT" x="630" y="135" text-anchor="middle">18.4%</text>
<text class="sS" x="360" y="172" text-anchor="middle">the ar-EG strings also carry 3 invisible direction marks (RLM, ALM) so they stay intact inside LTR text</text>
</svg><figcaption>The same three values formatted by Intl for three locales (real output from Node). The -u-nu-latn extension is how you choose Western digits in Arabic.</figcaption></figure>

- Keep translations out of the code: Angular's built-in i18n or `@ngx-translate`/Transloco; `react-i18next` or `next-intl` in React.

> [!story]
> Your client studio site is bilingual English/Arabic with RTL. In an interview: "I built a bilingual site where Arabic is right-to-left. I used logical CSS properties so one stylesheet works in both directions, mirrored only the directional icons, and set the `lang` and `dir` attributes on switch so screen readers pronounce each language correctly." That answer alone stands out in a Cairo or Gulf interview.

## F1.10 SEO basics a developer owns 🟢

- A unique `<title>` and meta description per page; one `<h1>`; a sensible heading outline.
- Real links (`<a href>`) that crawlers can follow, not click handlers.
- Content that exists in the HTML a crawler receives: client-side-only rendering is crawlable by Google but slower and less reliable for others, which is one reason for SSR or static generation ([[F9]]).
- `sitemap.xml`, `robots.txt`, canonical URLs (`<link rel="canonical">`), Open Graph tags for link previews, structured data (JSON-LD) for rich results.
- Performance and mobile usability feed into search ranking (Core Web Vitals).

## F1.11 Testing accessibility 🟢 🟡

Automated tools catch roughly a third to a half of issues; the rest need a human.

1. **Automated:** Lighthouse in Chrome DevTools, the **axe DevTools** extension, and `@axe-core/playwright` or `jest-axe` in your test suite so regressions fail the build.
2. **Keyboard pass:** unplug the mouse and use the whole flow.
3. **Screen reader pass:** NVDA (free, Windows) with Firefox or Chrome, VoiceOver on macOS and iOS, TalkBack on Android. Listen to one form and one dialog.
4. **Zoom to 200%** and check a 320-pixel-wide viewport (WCAG's *Reflow* criterion).

> [!lab] Audit one of your own sites in 30 minutes
> Run Lighthouse's accessibility audit and axe on your studio site or the CS Visualizer front end. Fix everything automated tools find, then do a keyboard-only pass and fix what you trip over. Record the before and after scores. It's a concrete line for your Frontend CV, and a story.

## F1.12 Interview drill 🟢 ⭐

| Question | Strong short answer |
|---|---|
| What is semantic HTML? | Choosing elements for their meaning (nav, main, button, h2) so browsers, assistive tech and search engines understand the page. |
| `<a>` vs `<button>`? | A link navigates to a URL; a button performs an action. Each brings the right keyboard behaviour and role. |
| Why not `<div onclick>`? | It isn't focusable, has no keyboard activation and no role; you'd have to rebuild all of that by hand. |
| What's the first rule of ARIA? | Use native HTML when it provides the semantics and behaviour; ARIA only describes, it adds no behaviour. |
| How do you make a form accessible? | Visible labels tied to inputs, correct types and autocomplete, grouped controls, text errors linked by aria-describedby, and focus moved to errors on submit. |
| What makes good alt text? | It conveys the image's purpose in context; decorative images get an empty alt. |
| What's WCAG 2.2 AA? | The W3C accessibility standard's middle conformance level, the usual legal target, built on the POUR principles. |
| Name something new in WCAG 2.2. | Target size of at least 24×24 CSS pixels, focus not obscured, dragging alternatives, accessible authentication. |
| How do you build an accessible modal? | The native dialog with showModal, or: move focus in, trap Tab, close on Esc, return focus to the opener, make the background inert, give it a name. |
| What does aria-live do? | It makes screen readers announce content changes in that region, politely or assertively. |
| Contrast requirement for body text? | At least 4.5 : 1 at AA (3 : 1 for large text). |
| How do you support Arabic? | `lang="ar" dir="rtl"`, logical CSS properties, mirroring only directional icons, `bdi` for mixed text, and `Intl` for numbers and dates. |
| Why set width and height on images? | So the browser reserves space and the layout doesn't shift when the image loads. |
| What happens to focus on SPA navigation, and what should? | It stays on the old link with nothing announced; move focus to the new heading or announce the change, and update the title. |

## Key takeaways

> [!check]
> - Native elements first; they bring roles, focus and keyboard behaviour for free.
> - Every input needs a real label; errors are text that says how to fix them.
> - WCAG 2.2 AA is the target: POUR, 4.5 : 1 contrast, keyboard everything, visible focus.
> - ARIA describes but doesn't behave. No ARIA beats bad ARIA.
> - RTL done right means `dir`, logical properties and selective icon mirroring.

## Sources

- W3C: [WCAG 2.2](https://www.w3.org/TR/WCAG22/), [What's new in WCAG 2.2](https://www.w3.org/WAI/standards-guidelines/wcag/new-in-22/), [ARIA Authoring Practices Guide](https://www.w3.org/WAI/ARIA/apg/), [Using ARIA (the rules of ARIA)](https://www.w3.org/TR/using-aria/).
- MDN: [HTML elements reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Element), [`<dialog>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dialog), [Responsive images](https://developer.mozilla.org/en-US/docs/Web/HTML/Responsive_images), [CSS logical properties](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_logical_properties_and_values), [autocomplete values](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/autocomplete).
- W3C Internationalization: [Structural markup and right-to-left text in HTML](https://www.w3.org/International/questions/qa-html-dir).
- European Commission: [European Accessibility Act](https://commission.europa.eu/strategy-and-policy/policies/justice-and-fundamental-rights/disability/union-equality-strategy-rights-persons-disabilities-2021-2030/european-accessibility-act_en) (applies from 28 June 2025).
- Deque: [axe-core](https://github.com/dequelabs/axe-core).
