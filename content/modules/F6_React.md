# React — Components, State, Hooks and React 19

React is the most requested frontend library in Egyptian startup and remote job postings; Angular dominates enterprise and outsourcing work ([[F7]]). You've built React with TypeScript in CS Visualizer (Vite), `aiforme` (TanStack Query, shadcn/ui), Cairo Fit and the FinSight presentation engine, and Next.js in the course-commerce platform. This module makes sure you can explain *why* React behaves as it does, which is what interviews test.

> [!focus]
> **Entry must:** components and props; state and re-rendering; keys in lists; useState, useEffect (with clean-up and dependencies), useRef, useContext; controlled forms; lifting state up; the rules of hooks.
> **Mid adds:** when effects are the wrong tool, stale closures, memoisation and the React Compiler, Suspense and code-splitting, error boundaries, React 19 Actions, Server Components and when to use Next.js.
> **Most asked:** *What is the virtual DOM / how does React update the page?* · *Why do lists need keys?* · *useEffect dependency array?* · *useMemo vs useCallback?* · *Controlled vs uncontrolled inputs?* · *How do you share state between components?* · *What's new in React 19?*
> **Time budget:** 5 hours, with a Vite project open (`npm create vite@latest`).

## F6.1 The mental model: UI is a function of state 🟢 ⭐

A React **component** is a function that takes **props** and returns a description of the UI (JSX). When **state** changes, React calls the function again (a **re-render**), compares the new description with the previous one, and updates only the parts of the real DOM that differ.

```tsx
type Props = { invoices: Invoice[]; onPay: (id: string) => void };

export function InvoiceList({ invoices, onPay }: Props) {
  const [showPaid, setShowPaid] = useState(false);
  const visible = showPaid ? invoices : invoices.filter(i => i.status !== "paid");  // derived, not stored
  return (
    <section aria-labelledby="inv-h">
      <h2 id="inv-h">Invoices ({visible.length})</h2>
      <label><input type="checkbox" checked={showPaid} onChange={e => setShowPaid(e.target.checked)} /> Show paid</label>
      <ul>
        {visible.map(inv => (
          <li key={inv.id}>
            {inv.customer}: {inv.amount.toLocaleString("en-EG", { style: "currency", currency: "EGP" })}
            {inv.status !== "paid" && <button onClick={() => onPay(inv.id)}>Mark paid</button>}
          </li>
        ))}
      </ul>
    </section>
  );
}
```

> [!term] Reconciliation (and the "virtual DOM")
> On every render React builds a lightweight tree of elements and **diffs** it against the previous tree. Elements of a different type are replaced; the same type is updated in place; list children are matched by **key**. Only the differences are applied to the real DOM in the **commit** phase. "Virtual DOM" is the popular name for that tree.

**Data flows one way:** parents pass data down as props, and children report up by calling functions passed as props (`onPay`). A child never edits its props.

> [!say]
> "A component is a function of props and state that returns JSX. When state changes, React re-runs the component, diffs the new element tree against the old one, and commits only the differences to the DOM. Data flows down through props, and events flow up through callbacks."

## F6.2 State, re-renders and keys 🟢 ⭐

**What triggers a re-render:** the component's own state changes (via its setter), its parent re-renders, or a context it reads changes. **Props changing is not a separate trigger**; props change *because* the parent re-rendered.

**State updates are asynchronous and batched.** Inside one event handler, several `setX` calls cause one re-render, and the state variable still holds the old value until then:

```tsx
const [count, setCount] = useState(0);
function addThree() {
  setCount(count + 1); setCount(count + 1); setCount(count + 1);   // → 1, not 3 (same stale `count`)
  setCount(c => c + 1); setCount(c => c + 1); setCount(c => c + 1); // → +3: functional updates queue
}
```

**State must be treated as immutable.** React compares by reference (`Object.is`), so mutating an array or object in place doesn't trigger a render:

```tsx
setItems(items.push(x));                    // ❌ mutates and passes a number
setItems([...items, x]);                    // ✅ new array
setUser(u => ({ ...u, address: { ...u.address, city: "Giza" } }));   // ✅ copy each level you change
```

### Keys 🟢 ⭐

> [!term] Key
> A stable, unique identifier for each item in a list, so React can match items between renders. With good keys, an inserted or reordered item keeps its DOM node and its state; without them, React matches by position.

> [!mistake] Using the array index as the key
> If items can be inserted, removed or reordered, an index key makes React attach the wrong state to the wrong row: a half-typed input or a checked box jumps to a different item. Use the item's ID. Index keys are acceptable only for static lists that never change order.

**Changing a key on purpose** resets a component: `<InvoiceForm key={invoice.id} invoice={invoice} />` gives each invoice a fresh form state.

**Don't store what you can compute.** `visible` above is derived on each render; putting it in state creates two sources of truth that drift apart.

## F6.3 The hooks you use every day 🟢 ⭐

| Hook | Purpose |
|---|---|
| `useState` | Local state that triggers a re-render when set |
| `useReducer` | State with many related transitions, managed by a reducer function `(state, action) => newState` |
| `useEffect` | **Synchronise with something outside React** (subscriptions, timers, the DOM, a non-React widget) after render |
| `useRef` | A mutable box (`.current`) that survives renders **without** triggering one; also holds DOM elements |
| `useContext` | Read a value from the nearest Provider above, without prop drilling |
| `useMemo` | Cache a computed **value** between renders |
| `useCallback` | Cache a **function** identity between renders |
| `useId` | Stable unique IDs for accessibility attributes (`htmlFor`, `aria-describedby`) |
| `useTransition` / `useDeferredValue` | Mark updates as non-urgent so typing stays responsive |

**The rules of hooks:** call them **only at the top level** of a component or custom hook (never inside conditions, loops or after an early `return`), and **only from React functions**. React identifies each hook by its **call order**, so the order must be the same on every render. The `eslint-plugin-react-hooks` rules enforce this.

### `useEffect` properly 🟢 🟡 ⭐

```tsx
useEffect(() => {
  const id = setInterval(() => setNow(Date.now()), 1000);
  return () => clearInterval(id);          // clean-up: runs before the next effect and on unmount
}, []);                                    // [] = run once after the first render
```

| Dependency array | Effect runs |
|---|---|
| *(none)* | After **every** render |
| `[]` | Once, after mount (and its clean-up on unmount) |
| `[a, b]` | After mount and whenever `a` or `b` changed (`Object.is` comparison) |

**Fetching in an effect without races:**

```tsx
useEffect(() => {
  let ignore = false;
  const ctrl = new AbortController();
  fetch(`/api/customers/${id}`, { signal: ctrl.signal })
    .then(r => r.json())
    .then(data => { if (!ignore) setCustomer(data); })
    .catch(e => { if (e.name !== "AbortError") setError(e); });
  return () => { ignore = true; ctrl.abort(); };    // a newer id cancels the older request
}, [id]);
```

In real apps, prefer a data-fetching library (TanStack Query) or the framework's loader, which handle caching, deduplication, retries and races ([[F8]]).

> [!mistake] Effects you don't need
> The React docs' own advice: **you might not need an effect.** Don't use an effect to (1) compute derived data from props or state (just compute it during render, or `useMemo` it if it's expensive), (2) respond to a user event (do it in the event handler), or (3) reset state when a prop changes (use a `key`). Effects are for synchronising with **external** systems.

> [!mistake] Lying about dependencies
> Leaving a used value out of the dependency array to "run it only once" creates a **stale closure**: the effect keeps the value from the first render. Include every reactive value, and restructure the code if that causes loops: move the function inside the effect, use a functional state update, or, since React 19.2, `useEffectEvent` for logic that should read the latest value without re-running the effect.

> [!say]
> "useEffect is for synchronising with things outside React, like timers, subscriptions or a non-React widget. It runs after render, re-runs when its dependencies change, and the function it returns cleans up. I avoid effects for derived data or event handling, and for data fetching I'd rather use TanStack Query or the framework's loader."

### `useRef` 🟢

```tsx
const inputRef = useRef<HTMLInputElement>(null);
useEffect(() => { inputRef.current?.focus(); }, []);
return <input ref={inputRef} />;
```

Use a ref for values that must persist but shouldn't cause renders: a timer ID, the previous value, a DOM node. In React 19, function components can accept `ref` as an ordinary prop, so `forwardRef` is no longer needed for new code.

### Custom hooks 🟢 ⭐

A custom hook is a function starting with `use` that calls other hooks. It shares **logic**, not state: each component that calls it gets its own state.

```tsx
function useDebouncedValue<T>(value: T, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}
const q = useDebouncedValue(searchText);   // query the API with q, not on every keystroke
```

## F6.4 Sharing state 🟢 ⭐

1. **Lift state up** to the closest common parent and pass it down. This is the default answer.
2. **Composition:** pass components as `children` or props instead of threading data through intermediate layers.
3. **Context** for values many components need that change rarely: the current user, theme, locale. Every consumer re-renders when the context value changes, so don't put fast-changing data in one big context.
4. **A state library** (Zustand, Redux Toolkit) for complex, frequently updated client state shared across distant parts of the app.
5. **Server state** (data from the API) belongs in a server-state cache like TanStack Query, not in Redux ([[F8]]).

> [!term] Prop drilling
> Passing props through several components that don't use them, just to reach a deep child. Fix it with composition or context, but don't reach for global state just to avoid two levels of props.

## F6.5 Forms 🟢 ⭐

| | Controlled | Uncontrolled |
|---|---|---|
| Value lives in | React state (`value` + `onChange`) | The DOM (read with a ref or `FormData`) |
| Good for | Instant validation, dependent fields, formatting as you type | Simple forms, file inputs, performance with many fields |

For anything non-trivial, use **React Hook Form** (mostly uncontrolled, so fast) with a **Zod** schema shared with your types ([[F5.9]]).

### React 19 Actions 🟡 ⭐

React 19 added first-class support for async form submissions:

```tsx
async function saveInvoice(prev: State, formData: FormData): Promise<State> {
  const res = await fetch("/api/invoices", { method: "POST", body: formData });
  return res.ok ? { ok: true } : { ok: false, error: "Couldn't save" };
}

function NewInvoice() {
  const [state, formAction, isPending] = useActionState(saveInvoice, { ok: false });
  return (
    <form action={formAction}>
      <input name="customer" required />
      <button disabled={isPending}>{isPending ? "Saving…" : "Save"}</button>
      {state.error && <p role="alert">{state.error}</p>}
    </form>
  );
}
```

`useFormStatus` lets a nested submit button know the form is pending, and `useOptimistic` shows the expected result immediately and rolls back if the request fails.

## F6.6 Performance 🟡 ⭐

**First, measure.** React DevTools' Profiler shows which components rendered and why; most apps never need manual optimisation.

- **`React.memo(Component)`** skips re-rendering when props are shallowly equal.
- **`useMemo`** caches an expensive computation; **`useCallback`** keeps a function's identity stable so a memoised child doesn't re-render because it receives a "new" function each time.
- **The React Compiler** (stable **v1.0, October 2025**) inserts this memoisation automatically at build time, so in compiler-enabled projects hand-written `useMemo`, `useCallback` and `memo` are mostly unnecessary. Next.js 16 supports it with one setting (`reactCompiler: true`).
- **Code-splitting:** `const Chart = lazy(() => import("./Chart"))` inside `<Suspense fallback={<Spinner />}>` loads heavy components only when needed.
- **Long lists:** virtualise them (TanStack Virtual).
- **Keep state local**, close to where it's used, so a change re-renders a small subtree.

> [!say]
> "I measure with the React Profiler first. The usual fixes are keeping state close to where it's used, memoising expensive child components and their callbacks, splitting heavy routes with lazy and Suspense, and virtualising long lists. With the React Compiler enabled, most manual memoisation goes away."

## F6.7 Errors and loading states 🟡

**Error boundaries** catch rendering errors in their subtree and show a fallback, so one broken widget doesn't blank the app. They're still written as class components or via the `react-error-boundary` package:

```tsx
<ErrorBoundary fallback={<p>Couldn't load the chart.</p>}>
  <Suspense fallback={<ChartSkeleton />}>
    <RevenueChart />
  </Suspense>
</ErrorBoundary>
```

Error boundaries don't catch errors in event handlers or async code; handle those with `try/catch` and state.

## F6.8 React 19 and beyond 🟡 ⭐

| Feature | Version | What it is |
|---|---|---|
| **Actions**, `useActionState`, `useFormStatus`, `useOptimistic` | 19.0 (Dec 2024) | Async transitions and form handling with pending and optimistic states |
| **`use(promise \| context)`** | 19.0 | Read a promise (suspending until it resolves) or a context, even conditionally |
| **`ref` as a prop** | 19.0 | No more `forwardRef` for function components |
| **Server Components and Server Functions** | 19.0, used via frameworks | Components that run only on the server (no JavaScript sent for them), and functions the client can call on the server (`"use server"`) |
| **`<Activity>`** | 19.2 (Oct 2025) | Hide part of the UI while keeping its state, and pre-render it in the background |
| **`useEffectEvent`** | 19.2 | Logic inside an effect that reads the latest props and state without becoming a dependency |
| **React Compiler 1.0** | Oct 2025 | Automatic memoisation at build time |
| **View Transitions**, Fragment refs | 19.3 (Sep 2026) | Animated transitions between UI states using the browser's View Transitions API |

> [!warning] Server Components need patching discipline
> In December 2025 the React team disclosed a **critical, unauthenticated remote-code-execution vulnerability in React Server Components**, fixed in 19.0.1, 19.1.2 and 19.2.1, followed by further fixes the same month. If an app uses Server Components (Next.js App Router, for instance), keeping React and the framework patched is a security task, not a chore. That's a good real example for supply-chain questions ([[S9.10]]).

### Which way to start a React app? 🟢 ⭐

**Create React App was deprecated in February 2025.** Today:

- **Vite** for single-page apps behind your own API (what CS Visualizer and `aiforme` use).
- **Next.js** (version 16 since October 2025) when you want server rendering, static generation, Server Components, or a full-stack app in one codebase, like your course platform. Next 16 makes Turbopack the default bundler, adds opt-in **Cache Components** (`"use cache"`), and renames `middleware.ts` to `proxy.ts`.
- **React Router 7** in framework mode (it absorbed Remix) is the other full framework option.

## F6.9 React vs Angular, for someone who knows both 🟢 ⭐

| | React | Angular |
|---|---|---|
| What it is | A UI **library**; you choose routing, data and forms libraries | A full **framework**: router, HTTP client, forms, DI, testing built in |
| Language | JavaScript or TypeScript (JSX) | TypeScript, HTML templates |
| Reactivity | Re-render the component, diff, commit | **Signals** with fine-grained updates; zoneless by default since v21 |
| State sharing | Props, context, external stores | Services with dependency injection, signals |
| Async | Promises; TanStack Query | RxJS Observables, increasingly signals and `resource()` |
| Typical Egyptian employers | Startups, product companies, remote roles | Enterprise, banks, outsourcing for Gulf clients |

> [!say]
> "I've shipped both. Angular gives you the whole toolbox with strong conventions, which suits large teams, and its signals now give fine-grained updates. React is smaller and more flexible, with a bigger ecosystem of choices. The core ideas carry across: components, one-way data flow, derived state, and keeping side effects at the edges."

> [!lab] Build it twice
> Build a small "invoices" screen in React: list, filter, add with validation, mark paid, a loading and an error state, and data from a mock API. Use TanStack Query and React Hook Form with Zod. Then add the React Compiler and check in the Profiler that typing in the filter doesn't re-render every row. If you have time, build the same screen in Angular with signals ([[F7]]), and you'll have a perfect answer to "React or Angular?".

## F6.10 Interview drill 🟢 ⭐

| Question | Strong short answer |
|---|---|
| How does React update the DOM? | It re-renders components into an element tree, diffs it against the previous one (reconciliation), and commits only the changes. |
| Why do lists need keys? | So React can match items across renders; stable IDs keep state and DOM with the right item when the list changes. |
| Why not index as key? | When items are inserted, removed or reordered, state attaches to the wrong item. |
| What triggers a re-render? | A state setter, a parent re-render, or a consumed context changing. |
| Why didn't `setCount(count + 1)` three times add three? | Each call used the same stale count from this render; use `setCount(c => c + 1)`. |
| What does the dependency array do? | Controls when the effect re-runs: none means every render, empty means once, values mean when any changes. |
| What's the effect clean-up for? | Undoing the effect (clear timers, unsubscribe, abort fetches) before it re-runs and on unmount. |
| useMemo vs useCallback? | useMemo caches a computed value; useCallback caches a function's identity. |
| Controlled vs uncontrolled input? | Controlled: React state holds the value; uncontrolled: the DOM does and you read it when needed. |
| How do you share state between siblings? | Lift it to their common parent; use context or a store when it's needed widely. |
| What are the rules of hooks? | Call hooks only at the top level of React functions, never conditionally, so the call order is stable. |
| What does the React Compiler do? | Automatically memoises components and values at build time, removing most manual useMemo, useCallback and memo. |
| What are Server Components? | Components rendered only on the server, sending no JavaScript for themselves, used through frameworks like Next.js. |
| What replaced Create React App? | It was deprecated in 2025; use Vite for SPAs or a framework like Next.js or React Router. |
| What do error boundaries catch? | Errors thrown while rendering their subtree, not errors in event handlers or async code. |

## Key takeaways

> [!check]
> - UI is a function of state: compute derived values, don't store them.
> - Treat state as immutable; use functional updates when the next value depends on the last.
> - Effects synchronise with external systems; most "effects" should be event handlers or plain computation.
> - Stable keys from IDs, never indexes for changing lists.
> - React 19: Actions, `use`, ref as a prop; the Compiler handles memoisation; Server Components need prompt patching.

## Sources

- [react.dev](https://react.dev/learn): Thinking in React, State as a Snapshot, Queueing a Series of State Updates, Preserving and Resetting State, [You Might Not Need an Effect](https://react.dev/learn/you-might-not-need-an-effect), [Rules of Hooks](https://react.dev/reference/rules/rules-of-hooks).
- React blog: [React 19](https://react.dev/blog/2024/12/05/react-19), [React 19.2](https://react.dev/blog/2025/10/01/react-19-2), [React Compiler v1.0](https://react.dev/blog/2025/10/07/react-compiler-1), [Critical security vulnerability in React Server Components](https://react.dev/blog/2025/12/03/critical-security-vulnerability-in-react-server-components), [Sunsetting Create React App](https://react.dev/blog/2025/02/14/sunsetting-create-react-app), [React versions](https://react.dev/versions).
- [Next.js 16 release notes](https://nextjs.org/blog/next-16).
- [TanStack Query](https://tanstack.com/query/latest), [React Hook Form](https://react-hook-form.com/).
