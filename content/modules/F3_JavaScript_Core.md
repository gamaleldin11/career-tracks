# JavaScript Core — Types, Scope, Closures, `this` and Prototypes

Every frontend and full-stack interview has a JavaScript fundamentals round, and it's often the round that decides the outcome, because frameworks hide these ideas until something breaks. The classic questions ("what does this print?", "explain closures", "what is `this` here?") test the mental model of the language. Angular and React both sit on top of it.

> [!focus]
> **Entry must:** primitive vs reference types; `==` vs `===`; `let`/`const`/`var` and hoisting; closures with an example; the rules for `this`; array methods; spread and destructuring; ES modules.
> **Mid adds:** prototypes and how `class` maps to them, implementing debounce and throttle, deep vs shallow copy, immutability patterns, recent language additions (ES2023–ES2026).
> **Most asked:** *What is a closure?* · *`var` vs `let` vs `const`?* · *`==` vs `===`?* · *How does `this` work?* · *Arrow functions vs regular functions?* · *What is hoisting?* · *Implement debounce* · *What does this code print?*
> **Time budget:** 4 hours, with the browser console open to try every snippet.

## F3.1 Types and values 🟢 ⭐

JavaScript has **seven primitive types**: `string`, `number`, `bigint`, `boolean`, `undefined`, `symbol` and `null`. Everything else is an **object**, including arrays, functions, dates and maps.

| | Primitives | Objects |
|---|---|---|
| Stored as | The value itself | A **reference** to a value on the heap |
| Mutable? | No (operations make new values) | Yes |
| Compared by | Value | **Reference** (identity) |
| Copied by assignment | The value | The reference: both variables point to the same object |

```js
let a = { n: 1 };
let b = a;          // same object
b.n = 2;
console.log(a.n);   // 2
console.log({ n: 1 } === { n: 1 });   // false: two different objects
```

**Quirks interviewers enjoy:**

```js
typeof null            // "object"  (a historic bug kept for compatibility)
typeof []              // "object"  → use Array.isArray([])
typeof function () {}  // "function"
typeof NaN             // "number"
NaN === NaN            // false     → use Number.isNaN(x)
0.1 + 0.2 === 0.3      // false: floating point (IEEE 754 doubles)
Number.MAX_SAFE_INTEGER // 9007199254740991: beyond it use BigInt (123n)
```

> [!mistake] Money in floating point
> `0.1 + 0.2` is `0.30000000000000004`. For currency, compute in the smallest unit as integers (piastres or cents), use a decimal library, or let the server (C# `decimal`) do the arithmetic. Format for display with `Intl.NumberFormat`.

## F3.2 Equality and truthiness 🟢 ⭐

- `===` (strict) compares **without** type conversion. Use it by default.
- `==` (loose) **converts types first**, with rules nobody memorises: `0 == ""` is true, `null == undefined` is true, `"1" == 1` is true.
- `Object.is(a, b)` is like `===` but treats `NaN` as equal to itself and `+0` as different from `-0`.

The one common deliberate use of `==` is `x == null`, which matches both `null` and `undefined`.

**Falsy values** (everything else is truthy): `false`, `0`, `-0`, `0n`, `""`, `null`, `undefined`, `NaN`. Note that `"0"`, `[]` and `{}` are **truthy**.

```js
const count = 0;
const shown1 = count || 10;   // 10: || falls back on ANY falsy value, including 0
const shown2 = count ?? 10;   // 0:  ?? falls back only on null or undefined
user?.address?.city           // optional chaining: undefined instead of a crash
```

> [!say]
> "Triple equals compares value and type without conversion, so I use it everywhere; double equals coerces types with surprising rules. For defaults I prefer the nullish coalescing operator, because `||` also replaces legitimate values like 0 and the empty string."

## F3.3 `var`, `let`, `const` and hoisting 🟢 ⭐

| | `var` | `let` | `const` |
|---|---|---|---|
| Scope | **Function** | **Block** `{ }` | Block |
| Re-assign | Yes | Yes | **No** (but an object's contents can still change) |
| Re-declare in same scope | Yes | No | No |
| Hoisted | Yes, initialised to `undefined` | Yes, but **uninitialised** (temporal dead zone) | Same as `let` |
| Creates a global property | At top level, yes (`window.x`) | No | No |

> [!term] Hoisting
> Before running a scope, JavaScript registers its declarations. `var` variables exist from the start of the function with the value `undefined`; function declarations are available in full; `let`, `const` and `class` exist but can't be touched until their line runs. Accessing them earlier throws a `ReferenceError`; that window is the **temporal dead zone**.

```js
console.log(x);   // undefined (var is hoisted and initialised)
var x = 5;

console.log(y);   // ReferenceError: Cannot access 'y' before initialization
let y = 5;

hello();          // works: function declarations are hoisted whole
function hello() { console.log("hi"); }
```

**Rule:** `const` by default, `let` when you must reassign, never `var` in new code.

## F3.4 Scope and closures 🟢 ⭐

> [!term] Closure
> A function bundled with **the variables from the scope where it was created**. The function keeps access to those variables even after the outer function has returned. Closures are how JavaScript gives you private state, callbacks that remember context, and factories.

```js
function makeCounter() {
  let count = 0;                 // private: nothing outside can touch it
  return {
    increment: () => ++count,
    current: () => count,
  };
}
const c = makeCounter();
c.increment(); c.increment();
console.log(c.current());        // 2
```

**The classic loop question:**

```js
for (var i = 0; i < 3; i++) setTimeout(() => console.log(i), 0);   // 3 3 3
for (let j = 0; j < 3; j++) setTimeout(() => console.log(j), 0);   // 0 1 2
```

With `var` there is **one** `i` for the whole function; by the time the callbacks run, it's 3. With `let`, each iteration gets a **new binding**, and each callback closes over its own.

> [!say]
> "A closure is a function that remembers the variables of the scope it was defined in, even after that scope has finished. I use them for private state, like a counter factory, and they're everywhere in callbacks and React hooks. The classic bug is var in a loop: all the callbacks share one variable, while let creates a fresh one per iteration."

> [!story]
> React's **stale closure** bug is this exact idea: an effect or an interval callback captures the state value from the render it was created in, and keeps seeing that old value. It comes back in [[F6]].

## F3.5 How `this` works 🟢 ⭐

`this` is decided by **how a function is called**, not where it's written, except for arrow functions.

| Call style | `this` is | Example |
|---|---|---|
| Method call | The object before the dot | `user.greet()` → `user` |
| Plain call | `undefined` in strict mode (modules and classes are strict); the global object in sloppy scripts | `const f = user.greet; f()` |
| `new` | The newly created object | `new User()` |
| Explicit | Whatever you pass | `f.call(obj, a, b)`, `f.apply(obj, [a, b])`, `f.bind(obj)` |
| **Arrow function** | **Inherited** from the surrounding scope at creation; can't be changed | `() => this.name` |

```js
class Timer {
  seconds = 0;
  startBroken() { setInterval(function () { this.seconds++; }, 1000); }  // `this` is not the Timer
  start()       { setInterval(() => { this.seconds++; }, 1000); }          // arrow keeps the Timer's `this`
}
```

> [!mistake] Losing `this` when passing a method as a callback
> `button.addEventListener("click", this.handleClick)` calls `handleClick` with `this` set to the button. Use an arrow function (`() => this.handleClick()`), a class-field arrow, or `.bind(this)`.

**Arrow functions vs regular functions:** arrows have no own `this`, no `arguments`, can't be used with `new`, and have no `prototype`. Use them for callbacks; use regular functions or methods when `this` should be the object a method is called on.

## F3.6 Prototypes and classes 🟡 ⭐

Every object has a hidden link to another object, its **prototype**. When you read a property that the object doesn't have, JavaScript looks up the **prototype chain** until it finds it or reaches `null`.

```js
const animal = { speak() { return `${this.name} makes a sound`; } };
const dog = Object.create(animal);      // dog's prototype is animal
dog.name = "Rex";
dog.speak();                            // found on the prototype: "Rex makes a sound"
```

`class` syntax (ES2015) is a cleaner way to write the same prototype-based model:

```js
class Account {
  #balance = 0;                     // truly private field (ES2022)
  static count = 0;
  constructor(owner) { this.owner = owner; Account.count++; }
  deposit(amount) {
    if (amount <= 0) throw new RangeError("Amount must be positive");
    this.#balance += amount;
    return this;                    // allows chaining
  }
  get balance() { return this.#balance; }
}
class SavingsAccount extends Account {
  addInterest(rate) { return this.deposit(this.balance * rate); }
}
// Methods live on Account.prototype; instances link to it.
```

> [!say]
> "JavaScript inheritance is prototype-based: objects link to a prototype and property lookups walk that chain. The class keyword is syntax over the same mechanism; methods end up on the prototype and extends links the prototypes. Hash-prefixed fields are genuinely private."

## F3.7 Objects, arrays and immutability 🟢 ⭐

```js
const { name, address: { city } = {}, ...rest } = user;   // destructuring with default and rest
const [first, , third] = items;
const merged = { ...defaults, ...options };                // later keys win
const copy = [...items, newItem];                           // new array; items unchanged
```

**Shallow vs deep copy.** Spread and `Object.assign` copy only the **top level**; nested objects are still shared. For a real deep copy use `structuredClone(obj)` (built into browsers and Node since 2022), which also handles `Date`, `Map`, `Set` and circular references.

**Array methods you must use fluently:**

| Method | Returns | Mutates? |
|---|---|---|
| `map(fn)` | A new array of transformed items | No |
| `filter(fn)` | A new array of items that pass | No |
| `reduce(fn, init)` | A single accumulated value | No |
| `find(fn)` / `findIndex(fn)` / `findLast(fn)` | The first (or last) match / its index | No |
| `some(fn)` / `every(fn)` | A boolean | No |
| `includes(x)` | A boolean | No |
| `flatMap(fn)` | Mapped and flattened one level | No |
| `toSorted()`, `toReversed()`, `toSpliced()`, `with(i, v)` (ES2023) | A **copy** | No |
| `sort()`, `reverse()`, `splice()`, `push()`, `pop()` | — | **Yes** |

```js
const totals = orders
  .filter(o => o.status === "paid")
  .reduce((acc, o) => ({ ...acc, [o.city]: (acc[o.city] ?? 0) + o.amount }), {});

const byCity = Object.groupBy(orders, o => o.city);   // ES2024: { Cairo: [...], Giza: [...] }
```

> [!mistake] `sort()` sorts strings by default
> `[10, 9, 1].sort()` gives `[1, 10, 9]`, because elements are compared as strings. Pass a comparator: `.sort((a, b) => a - b)`. And `sort()` mutates; in React and Angular signal state, use `toSorted()` so the original array isn't changed.

**Why immutability matters in UI code:** React and Angular's `OnPush` and signals detect changes by **reference**. Mutating an array in place keeps the same reference, so the UI may not update. Creating a new array or object makes the change visible.

**Maps and Sets:** use `Map` when keys aren't strings or insertion order matters, `Set` for uniqueness. ES2025 added set operations: `a.union(b)`, `a.intersection(b)`, `a.difference(b)`.

## F3.8 Functions as values 🟢 🟡 ⭐

Functions are **first-class**: you can pass them, return them and store them. A **higher-order function** takes or returns a function (`map`, `filter`, `addEventListener`). A **pure function** returns the same output for the same input and has no side effects, which makes it easy to test and safe to memoise.

### Implement debounce and throttle ⭐

Asked constantly, because they combine closures, timers and `this`.

```js
// Debounce: run fn only after `wait` ms with no new calls (search-as-you-type).
function debounce(fn, wait = 300) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), wait);
  };
}

// Throttle: run fn at most once every `wait` ms (scroll and resize handlers).
function throttle(fn, wait = 200) {
  let last = 0;
  return function (...args) {
    const now = Date.now();
    if (now - last >= wait) { last = now; fn.apply(this, args); }
  };
}

const onSearch = debounce(q => fetchResults(q), 300);
input.addEventListener("input", e => onSearch(e.target.value));
```

> [!say]
> "Debounce waits until calls stop for a set time, so a search box only queries once the user pauses typing. Throttle guarantees at most one call per interval, which suits scroll or resize handlers. Both are closures that keep a timer or a timestamp between calls."

**Memoisation**, caching a pure function's results:

```js
function memoize(fn) {
  const cache = new Map();
  return (arg) => cache.has(arg) ? cache.get(arg) : (cache.set(arg, fn(arg)), cache.get(arg));
}
```

## F3.9 Modules 🟢 ⭐

| | ES modules (ESM) | CommonJS (CJS) |
|---|---|---|
| Syntax | `import x from "./x.js"`, `export const y = …` | `const x = require("./x")`, `module.exports = …` |
| Loading | Static, so it can be analysed before running, which enables **tree-shaking** | Dynamic, at runtime |
| Where | Browsers, modern Node, all modern bundlers | Older Node code and packages |
| Top-level `await` | Yes | No |

Use ESM for new code. Dynamic `import("./chart.js")` loads a module on demand, which is the basis of **code-splitting** and lazy-loaded routes ([[F9]]).

## F3.10 Errors 🟢

```js
try {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);   // fetch does NOT reject on 404 or 500
  return await res.json();
} catch (err) {
  console.error(err);
  throw new Error("Couldn't load invoices", { cause: err });   // keep the original with `cause`
} finally {
  setLoading(false);
}
```

Throw `Error` objects (they carry a stack trace), never strings. Custom error classes (`class ValidationError extends Error {}`) let callers handle cases differently.

## F3.11 What's new, in brief (2023–2026) 🟡

| Year | Additions worth knowing |
|---|---|
| ES2023 | `toSorted`, `toReversed`, `with`, `findLast` |
| ES2024 | `Object.groupBy`, `Map.groupBy`, `Promise.withResolvers` |
| ES2025 | **Set methods** (`union`, `intersection`, …), **iterator helpers** (`map`, `filter`, `take` on any iterator), `Promise.try`, `RegExp.escape`, JSON import attributes, `Float16Array` |
| ES2026 | **Temporal**, the long-awaited replacement for `Date`, reached Stage 4 in March 2026. Check browser support before relying on it; until then, use `Intl` and a small date library such as date-fns |

## F3.12 Predict the output 🟢 ⭐

Cover the answers and work them out first.

```js
// 1
console.log([] + []);          // ""          (both become empty strings)
console.log([] + {});          // "[object Object]"
console.log("5" - 2, "5" + 2); // 3 "52"      (minus converts to number, plus concatenates)

// 2
const obj = { name: "A", getName() { return this.name; } };
const fn = obj.getName;
console.log(obj.getName(), fn());   // "A", then a TypeError (this is undefined) in strict code

// 3
let a = 1;
{ let a = 2; console.log(a); }      // 2
console.log(a);                     // 1

// 4
const arr = [1, 2, 3];
const arr2 = arr;
arr2.push(4);
console.log(arr.length);            // 4 (same reference)

// 5
console.log(typeof undeclaredVar);  // "undefined" (typeof is safe on undeclared names)
```

Event-loop ordering questions (`setTimeout` vs `Promise.then`) are in [[F4]].

> [!lab] Rebuild five built-ins
> Without looking: write your own `map`, `filter` and `reduce` for arrays, then `debounce` and `deepEqual(a, b)`. Test each in the console with edge cases (empty arrays, nested objects, `NaN`). These are real interview tasks, and writing them cements closures and `this`.

## F3.13 Interview drill 🟢 ⭐

| Question | Strong short answer |
|---|---|
| What is a closure? | A function plus the variables of the scope it was created in, which it keeps access to after that scope ends. |
| var vs let vs const? | var is function-scoped and hoisted as undefined; let and const are block-scoped with a temporal dead zone; const can't be reassigned. |
| == vs ===? | `===` compares without type coercion; `==` coerces first. Use `===`. |
| What is hoisting? | Declarations are registered before code runs: var as undefined, functions in full, let/const uninitialised. |
| How is `this` determined? | By the call: the object before the dot, the new object with `new`, an explicit value with call/apply/bind, undefined for a plain strict call; arrows inherit it lexically. |
| Arrow vs regular function? | Arrows have lexical this, no arguments object, can't be constructors; regular functions get this from the call. |
| What's the prototype chain? | Objects link to a prototype; property lookups walk up the chain until found or null. |
| Shallow vs deep copy? | Shallow copies only the top level (spread); deep copies nested data too (structuredClone). |
| `||` vs `??`? | `||` falls back on any falsy value; `??` only on null or undefined. |
| Why does `[10,9,1].sort()` give `[1,10,9]`? | Default sort compares strings; pass `(a,b) => a - b`. |
| Debounce vs throttle? | Debounce runs after calls stop; throttle runs at most once per interval. |
| ESM vs CommonJS? | ESM uses static import/export, allowing tree-shaking and top-level await; CommonJS uses runtime require. |
| Why does mutating an array break UI updates? | Frameworks detect changes by reference; a mutated array keeps the same reference. |
| Does fetch reject on a 404? | No, it only rejects on network failure; check `response.ok`. |

## Key takeaways

> [!check]
> - Primitives are copied by value, objects by reference; compare with `===`.
> - `const` by default; block scope; know the temporal dead zone.
> - Closures remember their creation scope; that's the key to callbacks, private state and React hooks.
> - `this` depends on the call site, except for arrow functions.
> - Prefer non-mutating array methods; UI frameworks compare references.

## Sources

- MDN: [JavaScript guide](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide), [Closures](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Closures), [this](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/this), [Inheritance and the prototype chain](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Inheritance_and_the_prototype_chain), [Equality comparisons](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Equality_comparisons_and_sameness), [structuredClone](https://developer.mozilla.org/en-US/docs/Web/API/Window/structuredClone).
- Ecma International: [ECMA-262 (the language specification)](https://tc39.es/ecma262/); TC39 [finished proposals](https://github.com/tc39/proposals/blob/main/finished-proposals.md) (Temporal reached Stage 4 in March 2026).
- Kyle Simpson, [*You Don't Know JS Yet*](https://github.com/getify/You-Dont-Know-JS) (free, on scope, closures and `this`).
- [javascript.info](https://javascript.info/), a thorough modern tutorial.
