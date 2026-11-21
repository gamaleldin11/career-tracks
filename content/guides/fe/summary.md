# Frontend Developer — super summary

## How the web works

- A browser and a server talk HTTP: a request has a method, a target, headers and an optional body; the response has a status code, headers and a body ([RFC 9110: HTTP Semantics](https://www.rfc-editor.org/rfc/rfc9110.html)).
- GET and HEAD are *safe* (read-only by definition) and PUT and DELETE are *idempotent* (repeating them has the same effect as doing them once); POST is neither ([RFC 9110 §9.2](https://www.rfc-editor.org/rfc/rfc9110.html#section-9.2)).
- Caching is controlled with `Cache-Control`, `ETag` and conditional requests such as `If-None-Match`, which let a server answer `304 Not Modified` ([RFC 9111: HTTP Caching](https://www.rfc-editor.org/rfc/rfc9111.html)).
- Browsers enforce the same-origin policy; an origin is the scheme, host and port together ([MDN: Same-origin policy](https://developer.mozilla.org/en-US/docs/Web/Security/Defenses/Same-origin_policy)).

## HTML, accessibility and CSS

- Use the element that matches the meaning (`button`, `nav`, `main`, headings in order); native elements bring keyboard support and an accessible role for free ([MDN: Semantics](https://developer.mozilla.org/en-US/docs/Glossary/Semantics)).
- The first rule of ARIA: if a native HTML element or attribute gives the semantics and behaviour you need, use it instead of adding ARIA ([W3C: Using ARIA](https://www.w3.org/TR/using-aria/)).
- WCAG 2.2 is the current W3C accessibility standard; body text needs a contrast ratio of at least 4.5:1 at level AA ([W3C: WCAG 2.2](https://www.w3.org/TR/WCAG22/)).
- Every element is a box of content, padding, border and margin; `box-sizing: border-box` makes `width` include padding and border ([MDN: The box model](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Box_model/Introduction)).
- Flexbox lays items out in one dimension, Grid in two ([MDN: CSS grid layout](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Grid_layout)).
- When rules conflict, the cascade decides by origin and importance, then layer, then specificity, then order of appearance ([MDN: Introduction to the CSS cascade](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Cascade/Introduction)).

## JavaScript and TypeScript

- A closure is a function bundled with references to the variables of the scope where it was created ([MDN: Closures](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Closures)).
- `let` and `const` are block-scoped and sit in a temporal dead zone until their declaration runs; `var` is function-scoped ([MDN: let](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/let)).
- The value of `this` depends on how a function is called, except in arrow functions, which take `this` from the enclosing scope ([MDN: this](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/this)).
- JavaScript runs your code on one thread; callbacks from timers and I/O wait in a queue, and promise callbacks run as microtasks before the next task ([MDN: Using microtasks](https://developer.mozilla.org/en-US/docs/Web/API/HTML_DOM_API/Microtask_guide)).
- `async` functions always return a promise, and `await` pauses only that function until the promise settles ([MDN: async function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function)).
- TypeScript checks types at compile time and erases them; nothing about types exists at run time ([TypeScript: The Basics](https://www.typescriptlang.org/docs/handbook/2/basic-types.html)).
- Narrowing with `typeof`, `in`, equality and discriminated unions lets the compiler know a value's exact type inside a branch ([TypeScript: Narrowing](https://www.typescriptlang.org/docs/handbook/2/narrowing.html)).

## Frameworks

- React UI is a function of state: components return JSX, and changing state with its setter schedules a re-render ([React: State](https://react.dev/learn/state-a-components-memory)).
- Effects synchronise a component with something outside React; if you are only transforming data for rendering, you do not need an Effect ([React: You Might Not Need an Effect](https://react.dev/learn/you-might-not-need-an-effect)).
- List items need a `key` that is stable and unique among siblings so React can match them between renders ([React: Rendering Lists](https://react.dev/learn/rendering-lists)).
- Angular components are classes with a template; signals hold reactive state, and `computed` derives values from other signals ([Angular: Signals](https://angular.dev/guide/signals)).
- Angular's dependency injection provides services to components and other services through injectors ([Angular: Dependency injection](https://angular.dev/guide/di)).

## Quality

- Core Web Vitals measure loading (LCP, good at 2.5 s or less), responsiveness (INP, good at 200 ms or less) and visual stability (CLS, good at 0.1 or less), at the 75th percentile of page loads ([web.dev: Web Vitals](https://web.dev/articles/vitals)).
- Test the way a user uses the page: the more your tests resemble how the software is used, the more confidence they give ([Testing Library: Guiding principles](https://testing-library.com/docs/guiding-principles)).
- Cross-site scripting is prevented mainly by output encoding for the right context, plus a Content Security Policy as defence in depth ([OWASP: XSS Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)).
- The OWASP Top 10 is the reference list of the most critical web application security risks ([OWASP Top 10](https://top10.owasp.org/)).

## System design for the front end

- Choose where to render per page: server rendering and static generation give fast first content, client rendering suits highly interactive app screens ([web.dev: Rendering on the Web](https://web.dev/articles/rendering-on-the-web)).
- Serve images at the size they are displayed with `srcset` and `sizes`, and lazy-load those below the fold with `loading="lazy"` ([MDN: Lazy loading](https://developer.mozilla.org/en-US/docs/Web/Performance/Guides/Lazy_loading)).
- A content delivery network caches assets on servers close to users to reduce latency ([MDN: CDN](https://developer.mozilla.org/en-US/docs/Glossary/CDN)).

## Interview

- Interviewers commonly ask behavioural questions about past situations because past behaviour is used as evidence of future behaviour; answer with the situation, what you did and the result ([US OPM: Structured interviews](https://www.opm.gov/policy-data-oversight/assessment-and-selection/other-assessment-methods/structured-interviews/)).
- Know the cost of the data structures you reach for: a JavaScript `Map` keeps keys in insertion order and accepts any value as a key ([MDN: Map](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map)).
