# HTML and Accessibility — Semantic Markup, Forms, ARIA, RTL

HTML looks easy, so candidates under-prepare for it, and then lose points on "why a `<button>` and not a `<div>`?" or "how would a screen-reader user fill in this form?". Accessibility has also become a legal requirement for many products, including the **European Accessibility Act** (applying since **28 June 2025**) for anyone building for EU customers. Your bilingual English/Arabic studio site gives you a rare and valuable story here: real right-to-left layout.

> [!focus]
> **Entry must:** use semantic elements correctly; build an accessible form with labels and error messages; write good alt text; explain why native elements beat ARIA; meet colour-contrast basics; make a page keyboard-usable.
> **Mid adds:** WCAG 2.2 AA in practice, focus management in single-page apps and dialogs, live regions, responsive images, RTL with logical properties, automated and manual accessibility testing.
> **Most asked:** *What is semantic HTML and why does it matter?* · *`<button>` vs `<a>` vs `<div onclick>`?* · *What's ARIA and when do you use it?* · *How do you make a modal accessible?* · *What's WCAG?* · *How do you support Arabic?*
> **Time budget:** 2.5 hours.

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

> [!say]
> "ARIA describes roles and states to assistive technology but adds no behaviour, so my first choice is always a native element. I use ARIA to fill gaps: labelling icon buttons, aria-expanded on disclosure buttons, and live regions so screen readers hear 'saved' or new search results."

## F1.8 Colour and contrast 🟢

- **Text contrast** at AA: at least **4.5 : 1** for normal text, **3 : 1** for large text (about 24 px, or 18.66 px bold).
- **Non-text contrast**: UI component boundaries, focus indicators and meaningful graphics need **3 : 1** against adjacent colours.
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
- Mixed text (an English product name or a phone number inside Arabic) can reorder unexpectedly; wrap it in `<bdi>` or set `dir="auto"` on user-generated content.
- Choose a typeface with a good Arabic design (Cairo, Tajawal, IBM Plex Sans Arabic, Noto Naskh/Kufi Arabic), and give Arabic text slightly more line height.
- Format numbers, dates and currency with `Intl` (`new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP' })`) and decide deliberately between Western (0–9) and Eastern Arabic (٠–٩) numerals.
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
