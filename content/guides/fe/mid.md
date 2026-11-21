# Frontend Developer — mid level

*What a mid-level role adds: performance you can measure, rendering strategy, state architecture, testing strategy and security you can explain.*

## Performance

- LCP, INP and CLS are judged at the 75th percentile of page loads, split by mobile and desktop ([web.dev: Web Vitals](https://web.dev/articles/vitals)).
- LCP breaks into time to first byte, resource load delay, resource load duration and element render delay; fix the largest part first ([web.dev: Optimize LCP](https://web.dev/articles/optimize-lcp)).
- INP replaced First Input Delay as a Core Web Vital in March 2024 ([web.dev: INP](https://web.dev/articles/inp)).
- An interaction's latency is input delay plus processing time plus presentation delay; long tasks on the main thread inflate the first ([web.dev: Optimize INP](https://web.dev/articles/optimize-inp)).
- A task longer than 50 ms counts as a long task ([MDN: Long task](https://developer.mozilla.org/en-US/docs/Glossary/Long_task)).
- Reserve space for images and embeds with `width`/`height` or `aspect-ratio` to avoid layout shifts ([web.dev: Optimize CLS](https://web.dev/articles/optimize-cls)).
- `<link rel="preload">` fetches a critical resource early; `fetchpriority="high"` raises the priority of the LCP image ([web.dev: Fetch Priority](https://web.dev/articles/fetch-priority)).
- Split JavaScript with dynamic `import()` so code loads when it is needed ([MDN: import()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/import)).
- Field data (from real users, such as the Chrome UX Report) and lab data (Lighthouse) answer different questions; use field data to know whether users have a problem ([web.dev: Lab and field data](https://web.dev/articles/lab-and-field-data-differences)).

## Rendering strategy

- Static rendering produces HTML at build time; server rendering produces it per request; client rendering builds it in the browser ([web.dev: Rendering on the Web](https://web.dev/articles/rendering-on-the-web)).
- Hydration attaches React to server-rendered HTML; the server and client output must match ([React: hydrateRoot](https://react.dev/reference/react-dom/client/hydrateRoot)).
- React Server Components run ahead of time on the server and send no component code to the client ([React: Server Components](https://react.dev/reference/rsc/server-components)).
- Angular supports server-side rendering and hydration for the same purpose ([Angular: Server-side rendering](https://angular.dev/guide/ssr)).

## React in depth

- `memo` skips re-rendering when props are unchanged by `Object.is` comparison; it is an optimisation, not a guarantee ([React: memo](https://react.dev/reference/react/memo)).
- `useMemo` caches a calculation and `useCallback` caches a function between renders ([React: useMemo](https://react.dev/reference/react/useMemo)).
- Context passes data deep without prop drilling, but every consumer re-renders when the context value changes ([React: useContext](https://react.dev/reference/react/useContext)).
- `useReducer` moves complex state transitions into one pure function ([React: Extracting State Logic into a Reducer](https://react.dev/learn/extracting-state-logic-into-a-reducer)).
- Effects need cleanup for subscriptions and requests; in development, Strict Mode mounts components twice to expose missing cleanup ([React: Synchronizing with Effects](https://react.dev/learn/synchronizing-with-effects)).
- `useOptimistic` shows a provisional result while an async action is in progress ([React: useOptimistic](https://react.dev/reference/react/useOptimistic)).
- Error boundaries catch render errors in the tree below them and show a fallback ([React: Catching rendering errors with an error boundary](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary)).

## Angular in depth

- `OnPush` change detection checks a component only when its inputs change, an event fires in it, or it is marked for check ([Angular: Skipping component subtrees](https://angular.dev/best-practices/skipping-subtrees)).
- Angular can run without Zone.js, driving change detection from signals and explicit notifications ([Angular: Zoneless](https://angular.dev/guide/zoneless)).
- Observables are lazy streams; operators such as `switchMap` cancel the previous inner request when a new value arrives ([RxJS: switchMap](https://rxjs.dev/api/operators/switchMap)).
- Route guards decide whether navigation may proceed, and resolvers fetch data before a route activates ([Angular: Route guards](https://angular.dev/guide/routing/route-guards)).

## State, data and forms

- URL state (path and query string) is shareable and survives reloads; keep filters and pagination there ([MDN: URLSearchParams](https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams)).
- Server data needs caching, deduplication and invalidation; a server-state library handles stale-while-revalidate for you ([TanStack Query: Overview](https://tanstack.com/query/latest/docs/framework/react/overview)).
- Validate on the client for usability and again on the server for security; HTML constraint validation covers the basics ([MDN: Client-side form validation](https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Forms/Form_validation)).
- `AbortController` cancels a `fetch` that is no longer needed ([MDN: AbortController](https://developer.mozilla.org/en-US/docs/Web/API/AbortController)).

## Testing

- Prefer queries that reflect what users see: `getByRole` first, test IDs last ([Testing Library: Priority](https://testing-library.com/docs/queries/about/#priority)).
- `findBy` queries wait for an element; `queryBy` returns `null` instead of throwing, for asserting absence ([Testing Library: Queries](https://testing-library.com/docs/queries/about/)).
- Playwright waits for elements to be actionable before acting, which removes most manual waits ([Playwright: Auto-waiting](https://playwright.dev/docs/actionability)).
- Mock the network at the request level so components use their real fetch code ([Mock Service Worker: Philosophy](https://mswjs.io/docs/philosophy)).

## Security

- A Content Security Policy restricts where scripts and other resources may load from, limiting the damage of injected markup ([MDN: CSP](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CSP)).
- `SameSite=Lax` cookies are not sent on cross-site subrequests such as form POSTs, which blocks most CSRF ([MDN: Set-Cookie — SameSite](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Set-Cookie#samesitesamesite-value)).
- Store tokens where script cannot read them where you can: an `HttpOnly` cookie is out of reach of injected JavaScript ([OWASP: Session Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)).
- Subresource Integrity lets the browser verify that a file from a CDN was not altered ([MDN: Subresource Integrity](https://developer.mozilla.org/en-US/docs/Web/Security/Subresource_Integrity)).

## Accessibility beyond the basics

- Move focus deliberately in single-page apps and dialogs; the native `<dialog>` with `showModal()` traps focus and closes on Escape ([MDN: dialog element](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/dialog)).
- Announce dynamic updates with live regions such as `aria-live="polite"` ([MDN: ARIA live regions](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Guides/Live_regions)).
- Follow the WAI-ARIA Authoring Practices patterns for widgets such as comboboxes and tabs ([W3C: ARIA Authoring Practices Guide](https://www.w3.org/WAI/ARIA/apg/patterns/)).
