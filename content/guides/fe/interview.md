# Frontend Developer — interview prep

*Short answers to the questions that come up most. Say the first sentence, then add detail if asked.*

## HTML, CSS and accessibility

### Why use semantic HTML?

Native elements carry a role, keyboard behaviour and meaning that browsers, search engines and assistive technology understand without extra code; a `<button>` is focusable and activates on Enter and Space, a `<div>` is not ([MDN: Semantics](https://developer.mozilla.org/en-US/docs/Glossary/Semantics), [MDN: button element](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/button)).

### When should you use ARIA?

Only when no native element gives the semantics you need; the first rule of ARIA is to prefer native HTML, and bad ARIA is worse than none ([W3C: Using ARIA](https://www.w3.org/TR/using-aria/)).

### How does the browser decide which CSS rule wins?

The cascade compares origin and importance, then cascade layers, then specificity (IDs, then classes, then elements), then source order ([MDN: Introduction to the CSS cascade](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Cascade/Introduction)).

### Flexbox or Grid?

Flexbox for one dimension, a row or a column of items; Grid for two-dimensional layouts where rows and columns line up ([MDN: Relationship of grid layout to other layout methods](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Grid_layout/Relationship_with_other_layout_methods)).

## JavaScript

### What is a closure?

A function together with references to the variables in the scope where it was created, so it can still read them after that scope has returned; used for private state and callbacks ([MDN: Closures](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Closures)).

### What is the difference between `var`, `let` and `const`?

`var` is function-scoped and hoisted as `undefined`; `let` and `const` are block-scoped and in a temporal dead zone until declared; `const` stops reassignment, not mutation of an object ([MDN: let](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/let), [MDN: const](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/const)).

### Explain the event loop.

The engine runs one task at a time; when the call stack is empty it runs all queued microtasks, such as promise callbacks, and then the next task, such as a timer callback; that is why a resolved promise's `then` runs before a `setTimeout(…, 0)` ([MDN: Using microtasks](https://developer.mozilla.org/en-US/docs/Web/API/HTML_DOM_API/Microtask_guide)).

### What does `this` refer to?

It depends on the call: the object before the dot for a method call, `undefined` in a strict-mode plain call, the new object with `new`; arrow functions do not have their own `this` and use the enclosing one ([MDN: this](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/this)).

### `Promise.all` or `Promise.allSettled`?

`all` rejects at the first failure, which suits "all or nothing"; `allSettled` waits for every promise and reports each result, which suits independent requests ([MDN: Promise.all](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/all), [MDN: Promise.allSettled](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/allSettled)).

### Why does `0.1 + 0.2 !== 0.3`?

Numbers are IEEE 754 double-precision values, and 0.1 and 0.2 cannot be represented exactly in binary; compare with a tolerance such as `Number.EPSILON` or work in integer units ([MDN: Number.EPSILON](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/EPSILON)).

## TypeScript

### `interface` or `type`?

Both describe object shapes; interfaces can be reopened and merged and are extended with `extends`, while type aliases can also name unions, tuples and other types ([TypeScript: Differences between type aliases and interfaces](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#differences-between-type-aliases-and-interfaces)).

### `any` or `unknown`?

`any` switches type checking off; `unknown` accepts any value but forces you to narrow it before use, so it is the safe choice for data from outside ([TypeScript 3.0 release notes: unknown](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-0.html#new-unknown-top-type)).

### What is a discriminated union?

A union whose members share a literal property, such as `status`, so checking that property narrows to one member; it makes impossible states unrepresentable ([TypeScript: Narrowing — Discriminated unions](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#discriminated-unions)).

## React and Angular

### Why do list items need keys?

Keys tell React which item is which between renders; a stable unique key keeps the right state with the right item, while an array index breaks when items are reordered or inserted ([React: Rendering Lists](https://react.dev/learn/rendering-lists)).

### When do you need `useEffect`?

To synchronise with something outside React, such as a subscription, a timer or a non-React widget; not for deriving values from props or state, and not for handling user events ([React: You Might Not Need an Effect](https://react.dev/learn/you-might-not-need-an-effect)).

### How do you stop unnecessary re-renders?

Measure first with the React Profiler, then keep state close to where it is used, and use `memo`, `useMemo` and `useCallback` where profiling shows a real cost ([React: Profiler](https://react.dev/reference/react/Profiler), [React: memo](https://react.dev/reference/react/memo)).

### What are Angular signals?

Reactive values that notify their consumers when they change; `computed` derives from them and `effect` runs side effects, which lets Angular update only what depends on a change ([Angular: Signals](https://angular.dev/guide/signals)).

## Performance and security

### How would you improve a slow page?

Measure with field data, find which Core Web Vital fails, then fix its biggest part: for LCP the server response or the hero image, for INP long main-thread tasks, for CLS unsized media ([web.dev: Web Vitals](https://web.dev/articles/vitals), [web.dev: Optimize LCP](https://web.dev/articles/optimize-lcp)).

### How do you prevent XSS in a frontend?

Let the framework escape output, never insert untrusted HTML without sanitising it, avoid `eval`-like sinks, and add a Content Security Policy ([OWASP: XSS Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)).

### What is CORS?

A browser mechanism that lets a server say which other origins may read its responses, using headers such as `Access-Control-Allow-Origin`; it protects users' data in the browser and is not a server-side access control ([MDN: CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS)).

### Where should an auth token live in the browser?

Preferably in an `HttpOnly`, `Secure`, `SameSite` cookie, out of reach of injected scripts; tokens in `localStorage` can be read by any XSS ([OWASP: HTML5 Security Cheat Sheet — Local Storage](https://cheatsheetseries.owasp.org/cheatsheets/HTML5_Security_Cheat_Sheet.html#local-storage)).

## Behavioural

### How should you answer "tell me about a time when…"?

Describe the situation briefly, then what you specifically did and the result; structured interviews score answers against the same job-related criteria for every candidate ([US OPM: Structured interviews](https://www.opm.gov/policy-data-oversight/assessment-and-selection/other-assessment-methods/structured-interviews/)).
