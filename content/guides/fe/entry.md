# Frontend Developer — entry level

*What a junior frontend role expects on day one: solid HTML, CSS and JavaScript, one framework, Git and the basics of HTTP.*

## HTTP and the browser

- A URL's origin is its scheme, host and port; two URLs share an origin only if all three match ([MDN: Origin](https://developer.mozilla.org/en-US/docs/Glossary/Origin)).
- Status code classes: 2xx success, 3xx redirection, 4xx client error, 5xx server error ([RFC 9110 §15](https://www.rfc-editor.org/rfc/rfc9110.html#section-15)).
- 401 means the request lacks valid authentication; 403 means the server understood it and refuses to authorise it ([RFC 9110 §15.5](https://www.rfc-editor.org/rfc/rfc9110.html#section-15.5)).
- A cookie is set with the `Set-Cookie` header; `HttpOnly` hides it from JavaScript and `Secure` sends it only over HTTPS ([MDN: Set-Cookie](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Set-Cookie)).
- Cross-origin `fetch` requests are allowed only when the server answers with the right CORS headers such as `Access-Control-Allow-Origin` ([MDN: CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS)).
- `localStorage` keeps strings per origin with no expiry; `sessionStorage` is cleared when the tab's session ends ([MDN: Web Storage API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API)).

## Git

- A branch in Git is a lightweight movable pointer to a commit ([Pro Git: Branches in a Nutshell](https://git-scm.com/book/en/v2/Git-Branching-Branches-in-a-Nutshell)).
- Do not rebase commits that exist outside your repository and that people may have based work on ([Pro Git: Rebasing](https://git-scm.com/book/en/v2/Git-Branching-Rebasing)).
- `git revert` creates a new commit that undoes an earlier one, which is the safe way to undo shared history ([Git: git-revert](https://git-scm.com/docs/git-revert)).

## HTML and accessibility

- Every page needs a `<!doctype html>`, a `lang` on `<html>`, a `<title>` and a viewport `<meta>` for mobile ([MDN: Basic HTML syntax](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Structuring_content/Basic_HTML_syntax)).
- Landmark elements such as `header`, `nav`, `main` and `footer` let screen-reader users jump between page regions ([MDN: Document and website structure](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Structuring_content/Structuring_documents)).
- A `<button>` is focusable and fires on Enter and Space by default; a clickable `<div>` is neither ([MDN: button element](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/button)).
- Every form control needs an accessible name, usually a `<label>` tied to it with `for` and `id` ([MDN: label element](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/label)).
- Images that carry meaning need `alt` text; decorative images take an empty `alt=""` ([MDN: img element](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/img)).
- WCAG 2.2 level AA requires 4.5:1 contrast for normal text and 3:1 for large text ([W3C: Understanding Contrast (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html)).

## CSS

- Specificity is compared as three columns: IDs, then classes, attributes and pseudo-classes, then elements and pseudo-elements ([MDN: Specificity](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Cascade/Specificity)).
- `box-sizing: border-box` makes `width` and `height` include padding and border ([MDN: box-sizing](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/box-sizing)).
- Flexbox: `justify-content` aligns items on the main axis and `align-items` on the cross axis ([MDN: Basic concepts of flexbox](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Flexible_box_layout/Basic_concepts)).
- Grid: `grid-template-columns: repeat(auto-fill, minmax(200px, 1fr))` builds a responsive grid without media queries ([MDN: repeat()](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/repeat)).
- Media queries apply styles by viewport features such as width; mobile-first means base styles for small screens, then `min-width` queries ([MDN: Using media queries](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Media_queries/Using)).
- `position: sticky` keeps an element in normal flow until it reaches a threshold, then sticks ([MDN: position](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/position)).

## JavaScript

- Primitive types are copied by value; objects, arrays and functions are passed as references ([MDN: JavaScript data types](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Data_structures)).
- `===` compares without type conversion; `==` converts types first, which leads to surprises ([MDN: Equality comparisons](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Equality_comparisons_and_sameness)).
- `map` returns a new array, `filter` keeps the items that pass a test, and `reduce` folds an array into one value ([MDN: Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array)).
- Spread (`...`) copies only one level deep; nested objects are still shared ([MDN: Spread syntax](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Spread_syntax)).
- `structuredClone()` makes a deep copy of most values ([MDN: structuredClone](https://developer.mozilla.org/en-US/docs/Web/API/Window/structuredClone)).
- Events bubble from the target up through its ancestors, which makes event delegation on a parent possible ([MDN: Event bubbling](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Scripting/Event_bubbling)).
- `fetch` resolves its promise even for 404 or 500 responses; check `response.ok` yourself ([MDN: Using the Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch)).
- `Promise.all` rejects as soon as any input rejects; `Promise.allSettled` waits for every one ([MDN: Promise.allSettled](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/allSettled)).

## TypeScript

- Basic annotations: `string`, `number`, `boolean`, arrays such as `number[]`, and object types ([TypeScript: Everyday Types](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html)).
- Union types (`string | number`) need narrowing before you use members specific to one type ([TypeScript: Everyday Types — Union types](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#union-types)).
- `unknown` is the type-safe counterpart of `any`: you must narrow it before using it ([TypeScript 3.0 release notes: unknown](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-0.html#new-unknown-top-type)).
- The `strict` compiler option turns on a family of stricter checks, including `strictNullChecks` ([TSConfig: strict](https://www.typescriptlang.org/tsconfig/#strict)).

## React (or Angular)

- Components are functions that return JSX; props flow from parent to child and are read-only ([React: Passing Props](https://react.dev/learn/passing-props-to-a-component)).
- Hooks may only be called at the top level of a component or custom hook, never inside conditions or loops ([React: Rules of Hooks](https://react.dev/reference/rules/rules-of-hooks)).
- State updates are not immediate: the new value appears on the next render ([React: State as a Snapshot](https://react.dev/learn/state-as-a-snapshot)).
- To share state between siblings, lift it to their closest common parent ([React: Sharing State Between Components](https://react.dev/learn/sharing-state-between-components)).
- Controlled inputs take their `value` from state and update it in `onChange` ([React: input](https://react.dev/reference/react-dom/components/input)).
- In Angular, the `@if` and `@for` control-flow blocks render conditionally and repeat items, and `@for` requires a `track` expression ([Angular: Control flow](https://angular.dev/guide/templates/control-flow)).
- Angular services marked `providedIn: 'root'` are singletons for the whole app ([Angular: Creating an injectable service](https://angular.dev/guide/di/creating-injectable-service)).
