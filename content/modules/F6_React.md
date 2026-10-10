# React — Components, State, Hooks and React 19

React is the most requested frontend library in Egyptian startup and remote job postings; Angular dominates enterprise and outsourcing work ([[F7]]). You've built React with TypeScript in CS Visualizer (Vite), `aiforme` (TanStack Query, shadcn/ui), Cairo Fit and the FinSight presentation engine, and Next.js in the course-commerce platform. This module makes sure you can explain *why* React behaves as it does, which is what interviews test.

> [!focus]
> **Entry must:** components and props; state and re-rendering; keys in lists; useState, useEffect (with clean-up and dependencies), useRef, useContext; controlled forms; lifting state up; the rules of hooks.
> **Mid adds:** when effects are the wrong tool, stale closures, memoisation and the React Compiler, Suspense and code-splitting, error boundaries, React 19 Actions, Server Components and when to use Next.js.
> **Most asked:** *What is the virtual DOM / how does React update the page?* · *Why do lists need keys?* · *useEffect dependency array?* · *useMemo vs useCallback?* · *Controlled vs uncontrolled inputs?* · *How do you share state between components?* · *What's new in React 19?*
> **Time budget:** 5 hours, with a Vite project open (`npm create vite@latest`).

## F6.0 Foundations: why UI libraries exist 🟢

**Imperative UI.** Without a library you change the page step by step: find the element, set its text, toggle a class, add a row. Each user action needs its own code path, and with every new feature the number of states the page can be in, and the ways to get the DOM out of sync with your data, multiplies.

```js
// imperative: you write every transition
countEl.textContent = String(++count);
if (count > 0) resetBtn.removeAttribute("disabled");
if (count >= 10) warning.classList.add("visible");
```

**Declarative UI.** You describe what the page should look like **for a given state**, and the library works out which DOM operations get it there. You write one description instead of every transition.

```tsx
// declarative: describe the result for any count
<>
  <output>{count}</output>
  <button disabled={count === 0} onClick={() => setCount(0)}>Reset</button>
  {count >= 10 && <p className="warning">That's a lot of invoices</p>}
</>
```

**What JSX really is.** JSX is syntax, not HTML. The compiler turns `<button disabled={x}>Reset</button>` into a function call, `jsx("button", { disabled: x, children: "Reset" })`, which returns a plain JavaScript object describing an element. Your component returns a tree of these objects; nothing touches the DOM until React commits ([[F6.1]]). The same element trees can be turned into native mobile views by a different renderer: that is React Native.

<figure class="dia steps"><svg viewBox="0 0 720 256" role="img" aria-label="A JSX button compiled by TypeScript into a _jsx call with type button and props disabled, onClick and children, which returns a plain element object with disabled true when count is zero; React then commits a disabled button to the DOM">
<rect class="sN" x="14" y="30" width="692" height="40" rx="8"/><text class="sS" x="24" y="24">1  what you write (JSX)</text><text class="sS" x="26" y="55" xml:space="preserve" style="white-space:pre">&lt;button disabled={count === 0} onClick={() =&gt; setCount(0)}&gt;Reset&lt;/button&gt;</text>
<g data-s="2"><line class="sLm" x1="360" y1="72" x2="360" y2="86" marker-end="url(#ahm)"/><rect class="sB" x="14" y="92" width="692" height="40" rx="8" opacity=".5"/><text class="sS" x="24" y="86">2  what the compiler emits (tsc --jsx react-jsx)</text><text class="sS" x="26" y="117" xml:space="preserve" style="white-space:pre">_jsx("button", { disabled: count === 0, onClick: () =&gt; setCount(0), children: "Reset" })</text></g>
<g data-s="3"><line class="sLm" x1="350" y1="134" x2="350" y2="154" marker-end="url(#ahm)"/><rect class="sV" x="14" y="156" width="372" height="92" rx="8" opacity=".45"/><text class="sS" x="24" y="150">3  what it returns when count = 0: a plain object</text><text class="sS" x="26" y="176" xml:space="preserve" style="white-space:pre">{ $$typeof: Symbol(react.transitional.element),</text><text class="sS" x="26" y="194" xml:space="preserve" style="white-space:pre">  type: "button", key: null,</text><text class="sS" x="26" y="212" xml:space="preserve" style="white-space:pre">  props: { disabled: true, onClick: ƒ,</text><text class="sS" x="26" y="230" xml:space="preserve" style="white-space:pre">           children: "Reset" } }</text></g>
<g data-s="4"><line class="sLg" x1="388" y1="202" x2="430" y2="202" marker-end="url(#ahg)"/><text class="sGt" x="409" y="194" text-anchor="middle">commit</text><rect class="sG" x="436" y="156" width="270" height="92" rx="8" opacity=".45"/><text class="sS" x="446" y="150">4  what React puts in the DOM</text><text class="sT" x="448" y="192" xml:space="preserve" style="white-space:pre">&lt;button disabled&gt;Reset&lt;/button&gt;</text><text class="sS" x="571" y="222" text-anchor="middle">only now is the page touched</text></g>
</svg><ol class="dia-steps">
<li>JSX looks like HTML but is JavaScript syntax with expressions in braces.</li>
<li>The compiler turns each tag into a function call. This line is the real tsc output for the button above.</li>
<li>Calling it produces an ordinary object that describes the element; components return trees of these.</li>
<li>React compares the new tree with the previous one and commits only the DOM changes needed.</li>
</ol><figcaption>JSX is not HTML: source, compiled call, element object, then the DOM.</figcaption></figure>

**Components are functions.** A component takes props, may hold state through hooks, and returns elements. Because it's just a function of its inputs, React can call it again whenever the inputs change, and you can test it like a function.

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

<figure class="dia steps" data-start="1"><svg viewBox="0 0 720 288" role="img" aria-label="React update cycle: event, setState, render, diff of old and new element trees, commit to the DOM, then effects">
<rect class="sB" x="8" y="26" width="108" height="48" rx="8"/><text class="sT" x="62" y="48" text-anchor="middle">event</text><text class="sC" x="62" y="64" text-anchor="middle">a click</text>
<line class="sLm" x1="116" y1="50" x2="125" y2="50" marker-end="url(#ahm)"/>
<rect class="sW" x="127" y="26" width="108" height="48" rx="8"/><text class="sT" x="181" y="48" text-anchor="middle">setState</text><text class="sC" x="181" y="64" text-anchor="middle">schedules</text>
<line class="sLm" x1="235" y1="50" x2="244" y2="50" marker-end="url(#ahm)"/>
<rect class="sA" x="246" y="26" width="108" height="48" rx="8"/><text class="sT" x="300" y="48" text-anchor="middle">render</text><text class="sC" x="300" y="64" text-anchor="middle">calls component</text>
<line class="sLm" x1="354" y1="50" x2="363" y2="50" marker-end="url(#ahm)"/>
<rect class="sA" x="365" y="26" width="108" height="48" rx="8"/><text class="sT" x="419" y="48" text-anchor="middle">diff</text><text class="sC" x="419" y="64" text-anchor="middle">new tree vs old</text>
<line class="sLm" x1="473" y1="50" x2="482" y2="50" marker-end="url(#ahm)"/>
<rect class="sG" x="484" y="26" width="108" height="48" rx="8"/><text class="sT" x="538" y="48" text-anchor="middle">commit</text><text class="sC" x="538" y="64" text-anchor="middle">patch the DOM</text>
<line class="sLm" x1="592" y1="50" x2="601" y2="50" marker-end="url(#ahm)"/>
<rect class="sV" x="603" y="26" width="108" height="48" rx="8"/><text class="sT" x="657" y="48" text-anchor="middle">effects</text><text class="sC" x="657" y="64" text-anchor="middle">run useEffect</text>
<g data-s="1-1"><rect class="sN" x="4" y="22" width="116" height="56" rx="10" style="stroke:var(--accent);stroke-width:3"/></g>
<g data-s="2-2"><rect class="sN" x="123" y="22" width="116" height="56" rx="10" style="stroke:var(--accent);stroke-width:3"/></g>
<g data-s="3-3"><rect class="sN" x="242" y="22" width="116" height="56" rx="10" style="stroke:var(--accent);stroke-width:3"/></g>
<g data-s="4-4"><rect class="sN" x="361" y="22" width="116" height="56" rx="10" style="stroke:var(--accent);stroke-width:3"/></g>
<g data-s="5-5"><rect class="sN" x="480" y="22" width="116" height="56" rx="10" style="stroke:var(--accent);stroke-width:3"/></g>
<g data-s="6-6"><rect class="sN" x="599" y="22" width="116" height="56" rx="10" style="stroke:var(--accent);stroke-width:3"/></g>
<g data-s="3-4"><text class="sC" x="130" y="104" text-anchor="middle">previous elements</text><rect class="sB" x="40" y="112" width="170" height="22" rx="4"/><text class="sC" x="48" y="127">section</text><rect class="sB" x="60" y="140" width="150" height="22" rx="4"/><text class="sC" x="68" y="155">h2 "Invoices (2)"</text><rect class="sB" x="60" y="168" width="150" height="22" rx="4"/><text class="sC" x="68" y="183">ul</text><rect class="sB" x="80" y="196" width="130" height="22" rx="4"/><text class="sC" x="88" y="211">li INV-7</text><rect class="sB" x="80" y="224" width="130" height="22" rx="4"/><text class="sC" x="88" y="239">li INV-9</text><text class="sC" x="360" y="104" text-anchor="middle">new elements</text><rect class="sB" x="270" y="112" width="170" height="22" rx="4"/><text class="sC" x="278" y="127">section</text><rect class="sW" x="290" y="140" width="150" height="22" rx="4"/><text class="sC" x="298" y="155">h2 "Invoices (3)"</text><rect class="sB" x="290" y="168" width="150" height="22" rx="4"/><text class="sC" x="298" y="183">ul</text><rect class="sB" x="310" y="196" width="130" height="22" rx="4"/><text class="sC" x="318" y="211">li INV-7</text><rect class="sB" x="310" y="224" width="130" height="22" rx="4"/><text class="sC" x="318" y="239">li INV-9</text><rect class="sG" x="310" y="252" width="130" height="22" rx="4"/><text class="sC" x="318" y="267">li INV-4 (new)</text></g>
<g data-s="4-4"><text class="sWt" x="600" y="150" text-anchor="middle">changed: h2 text</text><text class="sGt" x="600" y="170" text-anchor="middle">added: one li</text><text class="sC" x="600" y="190" text-anchor="middle">everything else: untouched</text></g>
<g data-s="5-5"><text class="sM" x="360" y="160" text-anchor="middle">DOM writes: set h2.textContent, insert one &lt;li&gt;</text><text class="sC" x="360" y="184" text-anchor="middle">the browser then lays out and paints</text></g>
<g data-s="6-6"><text class="sM" x="360" y="160" text-anchor="middle">after the paint, effects whose dependencies changed run</text><text class="sC" x="360" y="184" text-anchor="middle">(their previous clean-ups run first)</text></g>
<g data-s="1-2"><text class="sC" x="360" y="160" text-anchor="middle">nothing has changed on screen yet</text></g>
</svg><ol class="dia-steps">
<li>A user event: the "Show paid" checkbox is clicked.</li>
<li>The handler calls the state setter. React doesn't re-render on the spot; it schedules a render (several updates in one handler are batched).</li>
<li><b>Render:</b> React calls your component function again with the new state. It returns a fresh tree of plain element objects. No DOM has been touched.</li>
<li><b>Diff:</b> React compares the new tree with the previous one. Same element type means update in place; list items are matched by key. Here only the heading text changed and one row was added.</li>
<li><b>Commit:</b> React applies just those differences to the real DOM, then the browser paints.</li>
<li><b>Effects:</b> after paint, <code>useEffect</code> callbacks whose dependencies changed run, each after its previous clean-up.</li>
</ol><figcaption>One update, from click to pixels. Render is pure calculation; only commit touches the DOM.</figcaption></figure>

> [!say]
> "A component is a function of props and state that returns JSX. When state changes, React re-runs the component, diffs the new element tree against the old one, and commits only the differences to the DOM. Data flows down through props, and events flow up through callbacks."

## F6.2 State, re-renders and keys 🟢 ⭐

**What triggers a re-render:** the component's own state changes (via its setter), its parent re-renders, or a context it reads changes. **Props changing is not a separate trigger**; props change *because* the parent re-rendered.

<figure class="dia"><svg viewBox="0 0 720 252" role="img" aria-label="A state change in App re-renders its descendants, except memoised children whose props did not change">
<line class="sLm" x1="370" y1="60" x2="160" y2="90"/>
<line class="sLm" x1="370" y1="60" x2="370" y2="90"/>
<line class="sLm" x1="370" y1="60" x2="580" y2="90"/>
<line class="sLm" x1="370" y1="130" x2="270" y2="160"/>
<line class="sLm" x1="370" y1="130" x2="470" y2="160"/>
<line class="sLm" x1="160" y1="130" x2="160" y2="160"/>
<rect class="sW" x="300" y="20" width="140" height="40" rx="8"/><text class="sC" x="370" y="38" text-anchor="middle">App</text><text class="sC" x="370" y="53" text-anchor="middle">state changes here</text>
<rect class="sW" x="90" y="90" width="140" height="40" rx="8"/><text class="sC" x="160" y="108" text-anchor="middle">Header</text><text class="sC" x="160" y="123" text-anchor="middle">re-renders</text>
<rect class="sW" x="300" y="90" width="140" height="40" rx="8"/><text class="sC" x="370" y="108" text-anchor="middle">InvoicePage</text><text class="sC" x="370" y="123" text-anchor="middle">re-renders</text>
<rect class="sG" x="510" y="90" width="140" height="40" rx="8"/><text class="sC" x="580" y="108" text-anchor="middle">Footer (memo)</text><text class="sC" x="580" y="123" text-anchor="middle">props same: skipped</text>
<rect class="sW" x="200" y="160" width="140" height="40" rx="8"/><text class="sC" x="270" y="178" text-anchor="middle">Filters</text><text class="sC" x="270" y="193" text-anchor="middle">re-renders</text>
<rect class="sG" x="400" y="160" width="140" height="40" rx="8"/><text class="sC" x="470" y="178" text-anchor="middle">InvoiceTable (memo)</text><text class="sC" x="470" y="193" text-anchor="middle">skipped</text>
<rect class="sV" x="90" y="160" width="140" height="40" rx="8"/><text class="sC" x="160" y="178" text-anchor="middle">UserBadge</text><text class="sC" x="160" y="193" text-anchor="middle">reads context</text>
<text class="sC" x="360" y="226" text-anchor="middle">orange: re-rendered · green: skipped by memo (or the React Compiler)</text><text class="sC" x="360" y="242" text-anchor="middle">purple: re-renders when its context value changes</text>
</svg><figcaption>A render flows down from the component whose state changed. Memoisation cuts the branches whose props are unchanged; context consumers re-render whenever their context value changes.</figcaption></figure>

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

<figure class="dia"><svg viewBox="0 0 720 222" role="img" aria-label="With index keys, typed text in row A jumps to the newly inserted row Z; with id keys it stays with row A">
<text class="sM" x="170" y="22" text-anchor="middle">key={index}  after inserting "Z" at the top</text><rect class="sB" x="20" y="34" width="300" height="30" rx="6"/><text class="sT" x="32" y="54">Z</text><rect class="sR" x="160" y="38" width="150" height="22" rx="4"/><text class="sC" x="170" y="53">draft: "hello"</text><rect class="sB" x="20" y="70" width="300" height="30" rx="6"/><text class="sT" x="32" y="90">A</text><rect class="sN" x="160" y="74" width="150" height="22" rx="4"/><text class="sC" x="170" y="89"></text><rect class="sB" x="20" y="106" width="300" height="30" rx="6"/><text class="sT" x="32" y="126">B</text><rect class="sN" x="160" y="110" width="150" height="22" rx="4"/><text class="sC" x="170" y="125"></text><rect class="sB" x="20" y="142" width="300" height="30" rx="6"/><text class="sT" x="32" y="162">C</text><rect class="sN" x="160" y="146" width="150" height="22" rx="4"/><text class="sC" x="170" y="161"></text><text class="sRt" x="170" y="194" text-anchor="middle">the draft stayed at position 0 and moved to Z</text>
<text class="sM" x="540" y="22" text-anchor="middle">key={item.id}  after the same insert</text><rect class="sB" x="390" y="34" width="300" height="30" rx="6"/><text class="sT" x="402" y="54">Z</text><rect class="sN" x="530" y="38" width="150" height="22" rx="4"/><text class="sC" x="540" y="53"></text><rect class="sB" x="390" y="70" width="300" height="30" rx="6"/><text class="sT" x="402" y="90">A</text><rect class="sG" x="530" y="74" width="150" height="22" rx="4"/><text class="sC" x="540" y="89">draft: "hello"</text><rect class="sB" x="390" y="106" width="300" height="30" rx="6"/><text class="sT" x="402" y="126">B</text><rect class="sN" x="530" y="110" width="150" height="22" rx="4"/><text class="sC" x="540" y="125"></text><rect class="sB" x="390" y="142" width="300" height="30" rx="6"/><text class="sT" x="402" y="162">C</text><rect class="sN" x="530" y="146" width="150" height="22" rx="4"/><text class="sC" x="540" y="161"></text><text class="sGt" x="540" y="194" text-anchor="middle">the draft followed A, where the user typed it</text>
<text class="sS" x="360" y="210" text-anchor="middle">Before the insert, the user had typed "hello" into row A.</text>
</svg><figcaption>Why keys must be stable IDs. React matches list items by key, and component state (here an input's draft) belongs to whatever item has that key.</figcaption></figure>

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

<figure class="dia"><svg viewBox="0 0 720 208" role="img" aria-label="Timeline of an effect: it runs after mount, cleans up and re-runs when its dependency changes, skips unrelated renders, and cleans up on unmount">
<line class="sLm" x1="20" y1="60" x2="700" y2="60" marker-end="url(#ahm)"/><text class="sC" x="700" y="50" text-anchor="end">time</text>
<rect class="sA" x="40" y="38" width="110" height="44" rx="8"/><text class="sT" x="95" y="64" text-anchor="middle">mount</text>
<rect class="sW" x="230" y="38" width="110" height="44" rx="8"/><text class="sT" x="285" y="64" text-anchor="middle">id: 7 → 9</text>
<rect class="sB" x="420" y="38" width="110" height="44" rx="8"/><text class="sT" x="475" y="64" text-anchor="middle">other state</text>
<rect class="sR" x="590" y="38" width="110" height="44" rx="8"/><text class="sT" x="645" y="64" text-anchor="middle">unmount</text>
<rect class="sG" x="40" y="104" width="110" height="26" rx="6"/><text class="sM" x="95" y="121" text-anchor="middle">effect(7)</text>
<rect class="sR" x="230" y="104" width="110" height="26" rx="6" opacity=".8"/><text class="sM" x="285" y="121" text-anchor="middle">clean-up(7)</text><rect class="sG" x="230" y="136" width="110" height="26" rx="6"/><text class="sM" x="285" y="153" text-anchor="middle">effect(9)</text>
<text class="sC" x="475" y="121" text-anchor="middle">nothing: deps [id]</text><text class="sC" x="475" y="137" text-anchor="middle">didn't change</text>
<rect class="sR" x="590" y="104" width="110" height="26" rx="6" opacity=".8"/><text class="sM" x="645" y="121" text-anchor="middle">clean-up(9)</text>
<text class="sM" x="360" y="196" text-anchor="middle">useEffect(() =&gt; { subscribe(id); return () =&gt; unsubscribe(id); }, [id])</text>
</svg><figcaption>An effect's life. The clean-up always runs before the next effect and on unmount, so subscriptions never pile up.</figcaption></figure>

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

<figure class="dia"><svg viewBox="0 0 720 288" role="img" aria-label="Three ways to get the current user from App to a deep Avatar: prop drilling passes it through Layout and Sidebar, which do not use it; composition lets App render the Avatar with the user and hand it to Layout as a prop; context provides it at App and Avatar reads it with useContext, at the cost of re-rendering every consumer when it changes">
<rect class="sN" x="8" y="10" width="224" height="268" rx="8" opacity=".35"/><text class="sRt" x="120" y="30" text-anchor="middle">1 prop drilling</text>
<rect class="sN" x="248" y="10" width="224" height="268" rx="8" opacity=".35"/><text class="sGt" x="360" y="30" text-anchor="middle">2 composition</text>
<rect class="sN" x="488" y="10" width="224" height="268" rx="8" opacity=".35"/><text class="sGt" x="600" y="30" text-anchor="middle">3 context: useContext</text>
<rect class="sA" x="60" y="44" width="120" height="30" rx="6" opacity=".75"/><text class="sT" x="120" y="64" text-anchor="middle">App</text><rect class="sN" x="60" y="104" width="120" height="30" rx="6"/><text class="sT" x="120" y="124" text-anchor="middle">Layout</text><rect class="sN" x="60" y="164" width="120" height="30" rx="6"/><text class="sT" x="120" y="184" text-anchor="middle">Sidebar</text><rect class="sG" x="60" y="224" width="120" height="30" rx="6" opacity=".75"/><text class="sT" x="120" y="244" text-anchor="middle">Avatar</text>
<line class="sLw" x1="120" y1="74" x2="120" y2="102" marker-end="url(#ahw)" stroke-dasharray="4 3"/>
<line class="sLw" x1="120" y1="134" x2="120" y2="162" marker-end="url(#ahw)" stroke-dasharray="4 3"/>
<line class="sLw" x1="120" y1="194" x2="120" y2="222" marker-end="url(#ahw)" stroke-dasharray="4 3"/>
<text class="sWt" x="128" y="92">user</text><text class="sWt" x="128" y="152">user</text><text class="sWt" x="128" y="212">user</text>
<text class="sS" x="120" y="272" text-anchor="middle">Layout and Sidebar only pass it on</text>
<rect class="sA" x="300" y="44" width="120" height="30" rx="6" opacity=".75"/><text class="sT" x="360" y="64" text-anchor="middle">App</text><rect class="sN" x="300" y="104" width="120" height="30" rx="6"/><text class="sT" x="360" y="124" text-anchor="middle">Layout</text><rect class="sN" x="250" y="164" width="120" height="30" rx="6"/><text class="sT" x="310" y="184" text-anchor="middle">Sidebar</text><rect class="sG" x="330" y="224" width="120" height="30" rx="6" opacity=".75"/><text class="sT" x="390" y="244" text-anchor="middle">Avatar</text>
<line class="sLm" x1="360" y1="74" x2="360" y2="102" marker-end="url(#ahm)"/><line class="sLm" x1="340" y1="134" x2="320" y2="162" marker-end="url(#ahm)"/><line class="sLm" x1="320" y1="194" x2="370" y2="222" marker-end="url(#ahm)"/>
<path class="sLg" d="M 420 59 C 472 104 460 184 420 222" marker-end="url(#ahg)" style="fill:none"/>
<text class="sGt" x="460" y="140" text-anchor="end">user</text>
<text class="sS" x="360" y="272" text-anchor="middle">App renders &lt;Avatar user/&gt; itself</text>
<rect class="sA" x="540" y="44" width="120" height="30" rx="6" opacity=".75"/><text class="sT" x="600" y="64" text-anchor="middle">App + Provider</text><rect class="sN" x="540" y="104" width="120" height="30" rx="6"/><text class="sT" x="600" y="124" text-anchor="middle">Layout</text><rect class="sN" x="540" y="164" width="120" height="30" rx="6"/><text class="sT" x="600" y="184" text-anchor="middle">Sidebar</text><rect class="sG" x="540" y="224" width="120" height="30" rx="6" opacity=".75"/><text class="sT" x="600" y="244" text-anchor="middle">Avatar</text>
<line class="sLm" x1="600" y1="74" x2="600" y2="102" marker-end="url(#ahm)"/>
<line class="sLm" x1="600" y1="134" x2="600" y2="162" marker-end="url(#ahm)"/>
<line class="sLm" x1="600" y1="194" x2="600" y2="222" marker-end="url(#ahm)"/>
<path class="sLv" d="M 540 59 C 488 104 500 184 540 239" marker-end="url(#ahv)" style="fill:none" stroke-dasharray="5 4"/>
<text class="sS" x="600" y="272" text-anchor="middle">every consumer re-renders on change</text>
</svg><figcaption>Prop drilling and its two usual fixes. Lifting state and two levels of props are fine; reach for these when the middle layers start carrying data they never use.</figcaption></figure>

## F6.5 Forms 🟢 ⭐

| | Controlled | Uncontrolled |
|---|---|---|
| Value lives in | React state (`value` + `onChange`) | The DOM (read with a ref or `FormData`) |
| Good for | Instant validation, dependent fields, formatting as you type | Simple forms, file inputs, performance with many fields |

<figure class="dia anim"><svg viewBox="0 0 720 226" role="img" aria-label="Animation: in a controlled input every keystroke calls onChange, updates state and re-renders with the new value; in an uncontrolled input the DOM holds the value and the form reads it with FormData on submit">
<text class="sM" x="14" y="22">controlled: React state is the source of truth</text>
<rect class="sN" x="30" y="34" width="116" height="36" rx="6"/><text class="sC" x="88" y="57" text-anchor="middle">keystroke</text>
<rect class="sA" x="170" y="34" width="116" height="36" rx="6"/><text class="sC" x="228" y="57" text-anchor="middle">onChange</text>
<rect class="sA" x="310" y="34" width="116" height="36" rx="6"/><text class="sC" x="368" y="57" text-anchor="middle">setState(v)</text>
<rect class="sB" x="450" y="34" width="116" height="36" rx="6"/><text class="sC" x="508" y="57" text-anchor="middle">re-render</text>
<rect class="sG" x="590" y="34" width="116" height="36" rx="6"/><text class="sC" x="648" y="57" text-anchor="middle">value={v}</text>
<line class="sL" x1="146" y1="52" x2="166" y2="52" marker-end="url(#ah)"/>
<line class="sL" x1="286" y1="52" x2="306" y2="52" marker-end="url(#ah)"/>
<line class="sL" x1="426" y1="52" x2="446" y2="52" marker-end="url(#ah)"/>
<line class="sL" x1="566" y1="52" x2="586" y2="52" marker-end="url(#ah)"/>
<path class="sLm" d="M 648 70 V 92 H 88 V 74" fill="none" marker-end="url(#ahm)"/><text class="sS" x="368" y="106" text-anchor="middle">every keystroke goes round this loop: validate, format, enable buttons as you type</text>
<circle class="sPg" r="5"><animateMotion dur="3s" repeatCount="indefinite" path="M 88 52 H 648 V 92 H 88 V 70"/></circle>
<text class="sM" x="14" y="140">uncontrolled: the DOM keeps the value</text>
<rect class="sN" x="30" y="152" width="116" height="36" rx="6"/><text class="sC" x="88" y="175" text-anchor="middle">keystroke</text>
<rect class="sB" x="170" y="152" width="116" height="36" rx="6"/><text class="sC" x="228" y="175" text-anchor="middle">&lt;input&gt; holds it</text>
<rect class="sA" x="450" y="152" width="116" height="36" rx="6"/><text class="sC" x="508" y="175" text-anchor="middle">submit</text>
<rect class="sG" x="590" y="152" width="116" height="36" rx="6"/><text class="sC" x="648" y="175" text-anchor="middle">read FormData</text>
<line class="sL" x1="146" y1="170" x2="166" y2="170" marker-end="url(#ah)"/><line class="sLm" x1="286" y1="170" x2="446" y2="170" marker-end="url(#ahm)"/><text class="sS" x="366" y="164" text-anchor="middle">no re-renders while typing</text><line class="sL" x1="566" y1="170" x2="586" y2="170" marker-end="url(#ah)"/>
<text class="sS" x="360" y="214" text-anchor="middle">React Hook Form registers inputs uncontrolled and still validates, which is why it stays fast with many fields</text>
</svg><figcaption>Controlled vs uncontrolled: where the value lives decides how often React renders.</figcaption></figure>

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
<figure class="dia steps"><svg viewBox="0 0 720 250" role="img" aria-label="A component tree of App with SearchBox, ResultsList with three rows, and Sidebar: a state change in App re-renders everything; memo skips Sidebar but not ResultsList because its callback prop is a new function; useCallback lets the list and rows be skipped; moving the state into SearchBox limits the re-render to SearchBox alone">
<line class="sLm" x1="300" y1="55" x2="110" y2="103"/>
<line class="sLm" x1="300" y1="55" x2="300" y2="103"/>
<line class="sLm" x1="300" y1="55" x2="490" y2="103"/>
<line class="sLm" x1="300" y1="133" x2="230" y2="175"/>
<line class="sLm" x1="300" y1="133" x2="300" y2="175"/>
<line class="sLm" x1="300" y1="133" x2="370" y2="175"/>
<g data-s="1-1"><rect class="sW" x="240" y="25" width="120" height="30" rx="6"/><text class="sT" x="300" y="45" text-anchor="middle">App</text><text class="sS" x="300" y="70" text-anchor="middle"></text><rect class="sW" x="50" y="103" width="120" height="30" rx="6"/><text class="sT" x="110" y="123" text-anchor="middle">SearchBox</text><rect class="sW" x="240" y="103" width="120" height="30" rx="6"/><text class="sT" x="300" y="123" text-anchor="middle">ResultsList</text><rect class="sW" x="430" y="103" width="120" height="30" rx="6"/><text class="sT" x="490" y="123" text-anchor="middle">Sidebar</text><rect class="sW" x="200" y="175" width="60" height="30" rx="6"/><text class="sT" x="230" y="195" text-anchor="middle">Row 1</text><rect class="sW" x="270" y="175" width="60" height="30" rx="6"/><text class="sT" x="300" y="195" text-anchor="middle">Row 2</text><rect class="sW" x="340" y="175" width="60" height="30" rx="6"/><text class="sT" x="370" y="195" text-anchor="middle">Row 3</text><text class="sWt" x="300" y="238" text-anchor="middle">setQuery("ab") in App: App and every descendant re-render</text></g>
<g data-s="2-2"><rect class="sW" x="240" y="25" width="120" height="30" rx="6"/><text class="sT" x="300" y="45" text-anchor="middle">App</text><rect class="sW" x="50" y="103" width="120" height="30" rx="6"/><text class="sT" x="110" y="123" text-anchor="middle">SearchBox</text><rect class="sW" x="240" y="103" width="120" height="30" rx="6"/><text class="sT" x="300" y="123" text-anchor="middle">ResultsList</text><rect class="sN" x="430" y="103" width="120" height="30" rx="6" opacity=".55"/><text class="sS" x="490" y="123" text-anchor="middle">Sidebar</text><text class="sS" x="490" y="148" text-anchor="middle">memo: props equal</text><rect class="sW" x="200" y="175" width="60" height="30" rx="6"/><text class="sT" x="230" y="195" text-anchor="middle">Row 1</text><rect class="sW" x="270" y="175" width="60" height="30" rx="6"/><text class="sT" x="300" y="195" text-anchor="middle">Row 2</text><rect class="sW" x="340" y="175" width="60" height="30" rx="6"/><text class="sT" x="370" y="195" text-anchor="middle">Row 3</text><text class="sGt" x="300" y="238" text-anchor="middle">memo skips Sidebar; ResultsList still renders: a new arrow function every time</text></g>
<g data-s="3-3"><rect class="sW" x="240" y="25" width="120" height="30" rx="6"/><text class="sT" x="300" y="45" text-anchor="middle">App</text><rect class="sW" x="50" y="103" width="120" height="30" rx="6"/><text class="sT" x="110" y="123" text-anchor="middle">SearchBox</text><rect class="sN" x="240" y="103" width="120" height="30" rx="6" opacity=".55"/><text class="sS" x="300" y="123" text-anchor="middle">ResultsList</text><rect class="sN" x="430" y="103" width="120" height="30" rx="6" opacity=".55"/><text class="sS" x="490" y="123" text-anchor="middle">Sidebar</text><text class="sS" x="490" y="148" text-anchor="middle">memo</text><rect class="sN" x="200" y="175" width="60" height="30" rx="6" opacity=".55"/><text class="sS" x="230" y="195" text-anchor="middle">Row 1</text><rect class="sN" x="270" y="175" width="60" height="30" rx="6" opacity=".55"/><text class="sS" x="300" y="195" text-anchor="middle">Row 2</text><rect class="sN" x="340" y="175" width="60" height="30" rx="6" opacity=".55"/><text class="sS" x="370" y="195" text-anchor="middle">Row 3</text><text class="sGt" x="300" y="238" text-anchor="middle">useCallback keeps onSelect stable: the list and its rows are skipped</text></g>
<g data-s="4-4"><rect class="sN" x="240" y="25" width="120" height="30" rx="6" opacity=".55"/><text class="sS" x="300" y="45" text-anchor="middle">App</text><rect class="sW" x="50" y="103" width="120" height="30" rx="6"/><text class="sT" x="110" y="123" text-anchor="middle">SearchBox</text><text class="sS" x="110" y="148" text-anchor="middle">owns query now</text><rect class="sN" x="240" y="103" width="120" height="30" rx="6" opacity=".55"/><text class="sS" x="300" y="123" text-anchor="middle">ResultsList</text><rect class="sN" x="430" y="103" width="120" height="30" rx="6" opacity=".55"/><text class="sS" x="490" y="123" text-anchor="middle">Sidebar</text><rect class="sN" x="200" y="175" width="60" height="30" rx="6" opacity=".55"/><text class="sS" x="230" y="195" text-anchor="middle">Row 1</text><rect class="sN" x="270" y="175" width="60" height="30" rx="6" opacity=".55"/><text class="sS" x="300" y="195" text-anchor="middle">Row 2</text><rect class="sN" x="340" y="175" width="60" height="30" rx="6" opacity=".55"/><text class="sS" x="370" y="195" text-anchor="middle">Row 3</text><text class="sGt" x="300" y="238" text-anchor="middle">move the state down into SearchBox: only SearchBox re-renders, no memo needed</text></g>
<rect class="sN" x="600" y="30" width="106" height="60" rx="8"/><rect class="sW" x="610" y="42" width="14" height="12" rx="3"/><text class="sS" x="630" y="52">rendered</text><rect class="sN" x="610" y="64" width="14" height="12" rx="3" opacity=".55"/><text class="sS" x="630" y="74">skipped</text>
</svg><ol class="dia-steps">
<li>A state change in App re-renders App and, by default, every component below it, whether or not their props changed.</li>
<li>React.memo skips a component when its props are shallowly equal. Sidebar is skipped, but ResultsList receives onSelect={() => …}, a new function on every render, so the comparison fails.</li>
<li>useCallback returns the same function until its dependencies change, so the memoised list and its rows are skipped too.</li>
<li>Often the better fix: keep state where it is used. With query inside SearchBox, nothing else re-renders. (The React Compiler automates the memo steps.)</li>
</ol><figcaption>What re-renders when you type in the search box, and what each optimisation saves.</figcaption></figure>

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

<figure class="dia steps"><svg viewBox="0 0 720 236" role="img" aria-label="A dashboard with KPI cards, an invoices table and a chart wrapped in an error boundary and a Suspense boundary: while loading the skeleton shows; then the chart renders; if it throws during render the error boundary catches it and shows a fallback while the rest of the page keeps working; errors in event handlers are not caught by boundaries">
<rect class="sN" x="250" y="14" width="140" height="30" rx="6"/><text class="sT" x="320" y="34" text-anchor="middle">Dashboard</text>
<line class="sLm" x1="320" y1="44" x2="150" y2="66" marker-end="url(#ahm)"/><line class="sLm" x1="320" y1="44" x2="320" y2="66" marker-end="url(#ahm)"/><line class="sLm" x1="320" y1="44" x2="500" y2="66" marker-end="url(#ahm)"/>
<rect class="sN" x="80" y="68" width="140" height="30" rx="6"/><text class="sT" x="150" y="88" text-anchor="middle">KPI cards</text><rect class="sN" x="430" y="68" width="140" height="30" rx="6"/><text class="sT" x="500" y="88" text-anchor="middle">Invoices table</text>
<g data-s="1-3"><rect class="sV" x="250" y="68" width="140" height="30" rx="6"/><text class="sT" x="320" y="88" text-anchor="middle">ErrorBoundary</text><line class="sLm" x1="320" y1="98" x2="320" y2="118" marker-end="url(#ahm)"/><rect class="sB" x="250" y="120" width="140" height="30" rx="6"/><text class="sT" x="320" y="140" text-anchor="middle">Suspense</text><line class="sLm" x1="320" y1="150" x2="320" y2="170" marker-end="url(#ahm)"/></g>
<g data-s="5-5"><rect class="sV" x="250" y="68" width="140" height="30" rx="6"/><text class="sT" x="320" y="88" text-anchor="middle">ErrorBoundary</text><line class="sLm" x1="320" y1="98" x2="320" y2="118" marker-end="url(#ahm)"/><rect class="sB" x="250" y="120" width="140" height="30" rx="6"/><text class="sT" x="320" y="140" text-anchor="middle">Suspense</text><line class="sLm" x1="320" y1="150" x2="320" y2="170" marker-end="url(#ahm)"/><rect class="sG" x="250" y="172" width="140" height="30" rx="6"/><text class="sT" x="320" y="192" text-anchor="middle">RevenueChart</text></g>
<g data-s="1-1"><rect class="sN" x="250" y="172" width="140" height="30" rx="6" stroke-dasharray="4 3"/><text class="sT" x="320" y="192" text-anchor="middle">ChartSkeleton</text><text class="sS" x="320" y="222" text-anchor="middle">data loading: Suspense shows its fallback</text></g>
<g data-s="2-2"><rect class="sG" x="250" y="172" width="140" height="30" rx="6"/><text class="sT" x="320" y="192" text-anchor="middle">RevenueChart</text><text class="sGt" x="320" y="222" text-anchor="middle">data arrived: the real chart renders</text></g>
<g data-s="3-3"><rect class="sR" x="250" y="172" width="140" height="30" rx="6"/><text class="sT" x="320" y="192" text-anchor="middle">RevenueChart</text><text class="sRt" x="320" y="222" text-anchor="middle">render throws: TypeError</text><path class="sLr" d="M 390 187 C 430 170 430 100 392 83" marker-end="url(#ahr)" style="fill:none"/><text class="sRt" x="436" y="140">caught</text></g>
<g data-s="4-4"><rect class="sW" x="250" y="68" width="140" height="30" rx="6"/><text class="sT" x="320" y="88" text-anchor="middle">Couldn't load chart</text><text class="sS" x="320" y="130" text-anchor="middle">fallback replaces the subtree;</text><text class="sGt" x="320" y="148" text-anchor="middle">KPI cards and the table keep working</text></g>
<g data-s="5-5"><rect class="sR" x="430" y="120" width="140" height="30" rx="6"/><text class="sT" x="500" y="140" text-anchor="middle">onClick handler</text><line class="sLm" x1="500" y1="98" x2="500" y2="118" marker-end="url(#ahm)"/><text class="sS" x="500" y="172" text-anchor="middle">errors in handlers and async</text><text class="sRt" x="500" y="190" text-anchor="middle">code are NOT caught:</text><text class="sS" x="500" y="208" text-anchor="middle">try/catch + error state</text></g>
</svg><ol class="dia-steps">
<li>While the chart's data loads, the nearest Suspense boundary shows ChartSkeleton.</li>
<li>When the data arrives, RevenueChart renders in its place.</li>
<li>If RevenueChart throws while rendering, React walks up to the nearest error boundary.</li>
<li>The boundary renders its fallback instead of its subtree. The rest of the dashboard is untouched.</li>
<li>Error boundaries only cover rendering. An exception in an event handler or a promise needs your own try/catch and an error state.</li>
</ol><figcaption>Where loading and errors stop in the component tree: Suspense handles waiting, error boundaries handle render failures, and handlers need their own try/catch.</figcaption></figure>

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
