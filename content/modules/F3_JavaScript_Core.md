# JavaScript Core — Types, Scope, Closures, `this` and Prototypes

Every frontend and full-stack interview has a JavaScript fundamentals round, and it's often the round that decides the outcome, because frameworks hide these ideas until something breaks. The classic questions ("what does this print?", "explain closures", "what is `this` here?") test the mental model of the language. Angular and React both sit on top of it.

> [!focus]
> **Entry must:** primitive vs reference types; `==` vs `===`; `let`/`const`/`var` and hoisting; closures with an example; the rules for `this`; array methods; spread and destructuring; ES modules.
> **Mid adds:** prototypes and how `class` maps to them, implementing debounce and throttle, deep vs shallow copy, immutability patterns, recent language additions (ES2023–ES2026).
> **Most asked:** *What is a closure?* · *`var` vs `let` vs `const`?* · *`==` vs `===`?* · *How does `this` work?* · *Arrow functions vs regular functions?* · *What is hoisting?* · *Implement debounce* · *What does this code print?*
> **Time budget:** 4 hours, with the browser console open to try every snippet.

## F3.0 Foundations: how JavaScript runs 🟢

**Engines.** Your code runs inside a JavaScript engine: **V8** in Chrome, Edge and Node.js, **SpiderMonkey** in Firefox, **JavaScriptCore** in Safari and Bun. The engine parses the source, starts running it at once in an interpreter, and compiles the functions that run often into fast machine code while the program is running (**just-in-time compilation**). That's why the same code can get faster after a few hundred calls.

**One thread.** Your JavaScript runs on a single thread: one call stack, one thing at a time. How a page still handles timers, network responses and clicks without freezing is the event loop, in [[F4]].

**Stack and heap.** The **call stack** holds a frame for each running function ([[S4.0]] shows it step by step). The **heap** holds everything longer-lived: objects, arrays, functions and the environments that closures keep. A variable holds a primitive directly, or a reference to something on the heap.

<figure class="dia"><svg viewBox="0 0 720 218" role="img" aria-label="A primitive is stored directly in its variable; object variables hold references to one shared object on the heap">
<text class="sT" x="140" y="22" text-anchor="middle">Stack frame (variables)</text><text class="sT" x="520" y="22" text-anchor="middle">Heap (objects)</text>
<rect class="sB" x="20" y="34" width="240" height="150" rx="10"/>
<text class="sC" x="32" y="69" xml:space="preserve" style="white-space:pre">let n = 5</text><rect class="sA" x="190" y="50" width="56" height="30" rx="4"/><text class="sM" x="218" y="70" text-anchor="middle">5</text>
<text class="sC" x="32" y="111" xml:space="preserve" style="white-space:pre">let a = { n: 1 }</text><rect class="sV" x="190" y="92" width="56" height="30" rx="4"/><text class="sM" x="218" y="112" text-anchor="middle">ref</text>
<path class="sL" d="M246 107 C320 107 330 100 396 100" marker-end="url(#ah)"/>
<text class="sC" x="32" y="153" xml:space="preserve" style="white-space:pre">let b = a</text><rect class="sV" x="190" y="134" width="56" height="30" rx="4"/><text class="sM" x="218" y="154" text-anchor="middle">ref</text>
<path class="sL" d="M246 149 C320 149 330 100 396 100" marker-end="url(#ah)"/>
<rect class="sG" x="400" y="70" width="200" height="60" rx="10"/><text class="sX" x="500" y="96" text-anchor="middle">{ n: 2 }</text><text class="sC" x="500" y="116" text-anchor="middle">one object, two references</text>
<text class="sS" x="140" y="206" text-anchor="middle">b.n = 2 changed the object both names point to</text>
<text class="sC" x="500" y="160" text-anchor="middle">{ n: 1 } === { n: 1 } is false:</text><text class="sC" x="500" y="176" text-anchor="middle">two objects, compared by identity</text>
</svg><figcaption>Primitives live in the variable; objects live on the heap and variables hold references to them. Assignment copies the reference.</figcaption></figure>

**Garbage collection.** You never free memory yourself. The garbage collector periodically finds objects that can no longer be reached from the globals or the current stack, and frees them. So a JavaScript **memory leak** is an object that is still reachable but no longer needed: an event listener whose handler captures a big array, a `setInterval` that's never cleared, a module-level cache that only grows, a removed DOM node still held in a variable. In single-page apps these pile up with every route change, which is why React's effect clean-up and Angular's `DestroyRef` exist.

**Scope is decided where code is written.** Every call gets an environment for its local variables plus a link to the environment where the function was **defined**, not where it's called. Looking a name up walks those links outward: the **scope chain**. That one rule is the whole explanation of closures ([[F3.4]]).

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

<figure class="dia"><svg viewBox="0 0 720 234" role="img" aria-label="A number line of the representable doubles around 0.3: the literal 0.3 is stored as the double just below 0.3, while 0.1 plus 0.2 rounds to the next double above it, one step away">
<line class="sLm" x1="80" y1="110" x2="640" y2="110"/>
<line class="sL" x1="120" y1="100" x2="120" y2="120" style="stroke-width:2"/>
<line class="sL" x1="240" y1="100" x2="240" y2="120" style="stroke-width:2"/>
<line class="sL" x1="360" y1="100" x2="360" y2="120" style="stroke-width:2"/>
<line class="sL" x1="480" y1="100" x2="480" y2="120" style="stroke-width:2"/>
<line class="sL" x1="600" y1="100" x2="600" y2="120" style="stroke-width:2"/>
<text class="sM" x="360" y="22" text-anchor="middle">the only numbers a double can hold near 0.3 (one tick = 2⁻⁵⁴ ≈ 5.6 × 10⁻¹⁷ apart)</text>
<circle class="sPg" cx="360.0" cy="110" r="6"/><text class="sGt" x="360" y="66" text-anchor="middle">0.3 is stored as</text><text class="sS" x="360" y="86" text-anchor="middle">0.29999999999999998889…</text>
<circle class="sPr" cx="480.0" cy="110" r="6"/><text class="sRt" x="480" y="146" text-anchor="middle">0.1 + 0.2 lands on</text><text class="sS" x="480" y="166" text-anchor="middle">0.30000000000000004440…</text>
<text class="sS" x="360" y="200" text-anchor="middle">0.1 ≈ 0.100000000000000005…  and  0.2 ≈ 0.200000000000000011…: both rounding errors add up</text>
<text class="sS" x="360" y="222" text-anchor="middle">so 0.1 + 0.2 === 0.3 is false; compare with a tolerance, or do money in integer cents</text>
</svg><figcaption>Why 0.1 + 0.2 !== 0.3: two different neighbouring doubles. Exact stored values computed.</figcaption></figure>

> [!mistake] Money in floating point
> `0.1 + 0.2` is `0.30000000000000004`. For currency, compute in the smallest unit as integers (piastres or cents), use a decimal library, or let the server (C# `decimal`) do the arithmetic. Format for display with `Intl.NumberFormat`.

## F3.2 Equality and truthiness 🟢 ⭐

- `===` (strict) compares **without** type conversion. Use it by default.
- `==` (loose) **converts types first**, with rules nobody memorises: `0 == ""` is true, `null == undefined` is true, `"1" == 1` is true.
- `Object.is(a, b)` is like `===` but treats `NaN` as equal to itself and `+0` as different from `-0`.

<figure class="dia"><svg viewBox="0 0 720 346" role="img" aria-label="An eleven by eleven matrix of loose equality between true, false, 1, 0, the strings 1, 0 and empty, null, undefined, NaN and an empty array, computed in Node: green cells are equal under both double and triple equals, amber cells only under double equals, such as 0 equals empty string, the string 0 equals false and the empty array equals false; NaN is not equal even to itself; a truthiness column shows that the string 0 and the empty array are truthy">
<text class="sT" x="297" y="20" text-anchor="middle">a == b, evaluated by Node</text>
<text class="sS" x="131" y="84" transform="rotate(-90 131.0 84)">true</text>
<text class="sS" x="165" y="84" transform="rotate(-90 165.0 84)">false</text>
<text class="sS" x="199" y="84" transform="rotate(-90 199.0 84)">1</text>
<text class="sS" x="233" y="84" transform="rotate(-90 233.0 84)">0</text>
<text class="sS" x="267" y="84" transform="rotate(-90 267.0 84)">"1"</text>
<text class="sS" x="301" y="84" transform="rotate(-90 301.0 84)">"0"</text>
<text class="sS" x="335" y="84" transform="rotate(-90 335.0 84)">""</text>
<text class="sS" x="369" y="84" transform="rotate(-90 369.0 84)">null</text>
<text class="sS" x="403" y="84" transform="rotate(-90 403.0 84)">undefined</text>
<text class="sS" x="437" y="84" transform="rotate(-90 437.0 84)">NaN</text>
<text class="sS" x="471" y="84" transform="rotate(-90 471.0 84)">[]</text>
<text class="sS" x="102" y="107" text-anchor="end">true</text><text class="sGt" x="34" y="107" text-anchor="middle">T</text>
<rect class="sG" x="112" y="94" width="30" height="18" rx="3" opacity=".8"/>
<rect class="sW" x="180" y="94" width="30" height="18" rx="3" opacity=".8"/>
<rect class="sW" x="248" y="94" width="30" height="18" rx="3" opacity=".8"/>
<text class="sS" x="102" y="129" text-anchor="end">false</text><text class="sRt" x="34" y="129" text-anchor="middle">F</text>
<rect class="sG" x="146" y="116" width="30" height="18" rx="3" opacity=".8"/>
<rect class="sW" x="214" y="116" width="30" height="18" rx="3" opacity=".8"/>
<rect class="sW" x="282" y="116" width="30" height="18" rx="3" opacity=".8"/>
<rect class="sW" x="316" y="116" width="30" height="18" rx="3" opacity=".8"/>
<rect class="sW" x="452" y="116" width="30" height="18" rx="3" opacity=".8"/>
<text class="sS" x="102" y="151" text-anchor="end">1</text><text class="sGt" x="34" y="151" text-anchor="middle">T</text>
<rect class="sW" x="112" y="138" width="30" height="18" rx="3" opacity=".8"/>
<rect class="sG" x="180" y="138" width="30" height="18" rx="3" opacity=".8"/>
<rect class="sW" x="248" y="138" width="30" height="18" rx="3" opacity=".8"/>
<text class="sS" x="102" y="173" text-anchor="end">0</text><text class="sRt" x="34" y="173" text-anchor="middle">F</text>
<rect class="sW" x="146" y="160" width="30" height="18" rx="3" opacity=".8"/>
<rect class="sG" x="214" y="160" width="30" height="18" rx="3" opacity=".8"/>
<rect class="sW" x="282" y="160" width="30" height="18" rx="3" opacity=".8"/>
<rect class="sW" x="316" y="160" width="30" height="18" rx="3" opacity=".8"/>
<rect class="sW" x="452" y="160" width="30" height="18" rx="3" opacity=".8"/>
<text class="sS" x="102" y="195" text-anchor="end">"1"</text><text class="sGt" x="34" y="195" text-anchor="middle">T</text>
<rect class="sW" x="112" y="182" width="30" height="18" rx="3" opacity=".8"/>
<rect class="sW" x="180" y="182" width="30" height="18" rx="3" opacity=".8"/>
<rect class="sG" x="248" y="182" width="30" height="18" rx="3" opacity=".8"/>
<text class="sS" x="102" y="217" text-anchor="end">"0"</text><text class="sGt" x="34" y="217" text-anchor="middle">T</text>
<rect class="sW" x="146" y="204" width="30" height="18" rx="3" opacity=".8"/>
<rect class="sW" x="214" y="204" width="30" height="18" rx="3" opacity=".8"/>
<rect class="sG" x="282" y="204" width="30" height="18" rx="3" opacity=".8"/>
<text class="sS" x="102" y="239" text-anchor="end">""</text><text class="sRt" x="34" y="239" text-anchor="middle">F</text>
<rect class="sW" x="146" y="226" width="30" height="18" rx="3" opacity=".8"/>
<rect class="sW" x="214" y="226" width="30" height="18" rx="3" opacity=".8"/>
<rect class="sG" x="316" y="226" width="30" height="18" rx="3" opacity=".8"/>
<rect class="sW" x="452" y="226" width="30" height="18" rx="3" opacity=".8"/>
<text class="sS" x="102" y="261" text-anchor="end">null</text><text class="sRt" x="34" y="261" text-anchor="middle">F</text>
<rect class="sG" x="350" y="248" width="30" height="18" rx="3" opacity=".8"/>
<rect class="sW" x="384" y="248" width="30" height="18" rx="3" opacity=".8"/>
<text class="sS" x="102" y="283" text-anchor="end">undefined</text><text class="sRt" x="34" y="283" text-anchor="middle">F</text>
<rect class="sW" x="350" y="270" width="30" height="18" rx="3" opacity=".8"/>
<rect class="sG" x="384" y="270" width="30" height="18" rx="3" opacity=".8"/>
<text class="sS" x="102" y="305" text-anchor="end">NaN</text><text class="sRt" x="34" y="305" text-anchor="middle">F</text>
<rect class="sR" x="418" y="292" width="30" height="18" rx="3" opacity=".6"/>
<text class="sS" x="102" y="327" text-anchor="end">[]</text><text class="sGt" x="34" y="327" text-anchor="middle">T</text>
<rect class="sW" x="146" y="314" width="30" height="18" rx="3" opacity=".8"/>
<rect class="sW" x="214" y="314" width="30" height="18" rx="3" opacity=".8"/>
<rect class="sW" x="316" y="314" width="30" height="18" rx="3" opacity=".8"/>
<rect class="sG" x="452" y="314" width="30" height="18" rx="3" opacity=".8"/>
<text class="sS" x="34" y="84" text-anchor="middle">truthy?</text>
<rect class="sG" x="508" y="96" width="14" height="12" rx="3"/><text class="sS" x="528" y="106">equal with == and ===</text>
<rect class="sW" x="508" y="120" width="14" height="12" rx="3"/><text class="sS" x="528" y="130">equal only with == (coercion)</text>
<rect class="sR" x="508" y="144" width="14" height="12" rx="3" opacity=".6"/><text class="sS" x="528" y="154">not even equal to itself</text>
<text class="sT" x="508" y="186">12 surprising pairs, e.g.</text><text class="sS" x="508" y="206" xml:space="preserve" style="white-space:pre">0 == ""   "0" == false</text><text class="sS" x="508" y="224" xml:space="preserve" style="white-space:pre">[] == false   null == undefined</text>
<text class="sS" x="508" y="252">but [] is truthy and "0" is truthy:</text><text class="sWt" x="508" y="270">if ("0") runs, yet "0" == false</text>
</svg><figcaption>Loose equality is not transitive and not intuitive: every amber cell is a conversion you would have to remember. Use === and test == null only on purpose.</figcaption></figure>

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

<figure class="dia steps"><svg viewBox="0 0 720 240" role="img" aria-label="Hoisting step by step: before the script runs, hello is a full function, x is undefined and y is uninitialised; hello prints hi, logging x prints undefined, x becomes 5, and reading y throws a ReferenceError because it is in the temporal dead zone">
<rect class="sN" x="14" y="28" width="340" height="172" rx="8"/><text class="sS" x="22" y="22">script.js</text>
<text class="sS" x="30" y="54" text-anchor="end">1</text><text class="sS" x="40" y="54" xml:space="preserve" style="white-space:pre">hello();</text>
<text class="sS" x="30" y="80" text-anchor="end">2</text><text class="sS" x="40" y="80" xml:space="preserve" style="white-space:pre">console.log(x);</text>
<text class="sS" x="30" y="106" text-anchor="end">3</text><text class="sS" x="40" y="106" xml:space="preserve" style="white-space:pre">var x = 5;</text>
<text class="sS" x="30" y="132" text-anchor="end">4</text><text class="sS" x="40" y="132" xml:space="preserve" style="white-space:pre">console.log(y);</text>
<text class="sS" x="30" y="158" text-anchor="end">5</text><text class="sS" x="40" y="158" xml:space="preserve" style="white-space:pre">let y = 5;</text>
<text class="sS" x="30" y="184" text-anchor="end">6</text><text class="sS" x="40" y="184" xml:space="preserve" style="white-space:pre">function hello() { console.log("hi"); }</text>
<text class="sT" x="530" y="22" text-anchor="middle">the scope's bindings</text>
<rect class="sN" x="380" y="32" width="70" height="28" rx="6"/><text class="sT" x="415" y="51" text-anchor="middle">hello</text>
<rect class="sN" x="380" y="66" width="70" height="28" rx="6"/><text class="sT" x="415" y="85" text-anchor="middle">x</text>
<rect class="sN" x="380" y="100" width="70" height="28" rx="6"/><text class="sT" x="415" y="119" text-anchor="middle">y</text>
<g data-s="1-1"><rect class="sB" x="456" y="32" width="250" height="28" rx="6" opacity=".5"/><text class="sGt" x="581" y="51" text-anchor="middle">ƒ hello</text><rect class="sB" x="456" y="66" width="250" height="28" rx="6" opacity=".5"/><text class="sWt" x="581" y="85" text-anchor="middle">undefined</text><rect class="sB" x="456" y="100" width="250" height="28" rx="6" opacity=".5"/><text class="sRt" x="581" y="119" text-anchor="middle">&lt;uninitialised&gt;</text><text class="sS" x="530" y="148" text-anchor="middle">creation phase: before line 1 runs</text><text class="sRt" x="530" y="166" text-anchor="middle">let y is in its temporal dead zone</text></g>
<g data-s="2-2"><rect class="sB" x="456" y="32" width="250" height="28" rx="6" opacity=".5"/><text class="sGt" x="581" y="51" text-anchor="middle">ƒ hello</text><rect class="sB" x="456" y="66" width="250" height="28" rx="6" opacity=".5"/><text class="sWt" x="581" y="85" text-anchor="middle">undefined</text><rect class="sB" x="456" y="100" width="250" height="28" rx="6" opacity=".5"/><text class="sRt" x="581" y="119" text-anchor="middle">&lt;uninitialised&gt;</text><rect class="sA" x="18" y="38" width="332" height="24" rx="4" opacity=".35"/><rect class="sN" x="380" y="140" width="326" height="92" rx="6"/><text class="sS" x="390" y="156">console</text><text class="sS" x="390" y="176" xml:space="preserve" style="white-space:pre">hi</text></g>
<g data-s="3-3"><rect class="sB" x="456" y="32" width="250" height="28" rx="6" opacity=".5"/><text class="sGt" x="581" y="51" text-anchor="middle">ƒ hello</text><rect class="sB" x="456" y="66" width="250" height="28" rx="6" opacity=".5"/><text class="sWt" x="581" y="85" text-anchor="middle">undefined</text><rect class="sB" x="456" y="100" width="250" height="28" rx="6" opacity=".5"/><text class="sRt" x="581" y="119" text-anchor="middle">&lt;uninitialised&gt;</text><rect class="sA" x="18" y="64" width="332" height="24" rx="4" opacity=".35"/><rect class="sN" x="380" y="140" width="326" height="92" rx="6"/><text class="sS" x="390" y="156">console</text><text class="sS" x="390" y="176" xml:space="preserve" style="white-space:pre">hi</text><text class="sS" x="390" y="192" xml:space="preserve" style="white-space:pre">undefined</text></g>
<g data-s="4-4"><rect class="sB" x="456" y="32" width="250" height="28" rx="6" opacity=".5"/><text class="sGt" x="581" y="51" text-anchor="middle">ƒ hello</text><rect class="sB" x="456" y="66" width="250" height="28" rx="6" opacity=".5"/><text class="sGt" x="581" y="85" text-anchor="middle">5</text><rect class="sB" x="456" y="100" width="250" height="28" rx="6" opacity=".5"/><text class="sRt" x="581" y="119" text-anchor="middle">&lt;uninitialised&gt;</text><rect class="sA" x="18" y="90" width="332" height="24" rx="4" opacity=".35"/><rect class="sN" x="380" y="140" width="326" height="92" rx="6"/><text class="sS" x="390" y="156">console</text><text class="sS" x="390" y="176" xml:space="preserve" style="white-space:pre">hi</text><text class="sS" x="390" y="192" xml:space="preserve" style="white-space:pre">undefined</text></g>
<g data-s="5-5"><rect class="sB" x="456" y="32" width="250" height="28" rx="6" opacity=".5"/><text class="sGt" x="581" y="51" text-anchor="middle">ƒ hello</text><rect class="sB" x="456" y="66" width="250" height="28" rx="6" opacity=".5"/><text class="sGt" x="581" y="85" text-anchor="middle">5</text><rect class="sB" x="456" y="100" width="250" height="28" rx="6" opacity=".5"/><text class="sRt" x="581" y="119" text-anchor="middle">&lt;uninitialised&gt;</text><rect class="sR" x="18" y="116" width="332" height="24" rx="4" opacity=".35"/><rect class="sN" x="380" y="140" width="326" height="92" rx="6"/><text class="sS" x="390" y="156">console</text><text class="sS" x="390" y="176" xml:space="preserve" style="white-space:pre">hi</text><text class="sS" x="390" y="192" xml:space="preserve" style="white-space:pre">undefined</text><text class="sRt" x="390" y="208" xml:space="preserve" style="white-space:pre">ReferenceError: Cannot access 'y'</text><text class="sRt" x="390" y="224" xml:space="preserve" style="white-space:pre">    before initialization</text></g>
</svg><ol class="dia-steps">
<li>Before any line runs, the engine registers the scope's declarations: the function in full, var x as undefined, let y as uninitialised.</li>
<li>Line 1: hello() works, because function declarations are hoisted whole.</li>
<li>Line 2: x exists but has not been assigned yet, so it prints undefined.</li>
<li>Line 3: the assignment runs; x is now 5.</li>
<li>Line 4: y is still in its temporal dead zone, so reading it throws. Execution stops; line 5 never runs.</li>
</ol><figcaption>Hoisting, traced line by line (the outputs are from running the script in Node).</figcaption></figure>

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

<figure class="dia steps" data-start="1"><svg viewBox="0 0 720 266" role="img" aria-label="A closure in five steps: the outer call creates an environment, the returned function keeps a link to it, the frame disappears but the environment survives, and a later call updates it">
<rect class="sB" x="14" y="14" width="300" height="128" rx="8"/><text class="sC" x="24" y="34" xml:space="preserve" style="white-space:pre">function makeCounter() {</text><text class="sC" x="24" y="53" xml:space="preserve" style="white-space:pre">  let count = 0;</text><text class="sC" x="24" y="72" xml:space="preserve" style="white-space:pre">  return { increment: () =&gt; ++count };</text><text class="sC" x="24" y="91" xml:space="preserve" style="white-space:pre">}</text><text class="sC" x="24" y="110" xml:space="preserve" style="white-space:pre">const c = makeCounter();</text><text class="sC" x="24" y="129" xml:space="preserve" style="white-space:pre">c.increment();</text>
<text class="sC" x="160" y="162" text-anchor="middle">call stack</text><text class="sC" x="530" y="22" text-anchor="middle">heap</text>
<rect class="sB" x="30" y="222" width="260" height="34" rx="6"/><text class="sT" x="40" y="244">global</text>
<g data-s="3"><text class="sM" x="130" y="244">c</text><path class="sL" d="M150 239 C330 239 440 220 560 206" marker-end="url(#ah)"/></g>
<g data-s="1-2"><rect class="sA" x="30" y="180" width="260" height="34" rx="6"/><text class="sT" x="40" y="202">makeCounter()</text><path class="sLm" d="M290 197 C330 197 340 92 376 92" marker-end="url(#ahm)"/><text class="sC" x="338" y="150">local scope</text></g>
<g data-s="4-4"><rect class="sW" x="30" y="180" width="260" height="34" rx="6"/><text class="sT" x="40" y="202">increment()</text><path class="sLw" d="M290 197 C330 197 340 104 376 104" marker-end="url(#ahw)"/><text class="sWt" x="338" y="150">scope chain → count</text></g>
<g data-s="1-3"><rect class="sG" x="380" y="60" width="210" height="62" rx="10"/><text class="sC" x="485" y="82" text-anchor="middle">makeCounter's environment</text><text class="sX" x="485" y="106" text-anchor="middle">count: 0</text></g>
<g data-s="4-5"><rect class="sG" x="380" y="60" width="210" height="62" rx="10"/><text class="sC" x="485" y="82" text-anchor="middle">makeCounter's environment</text><text class="sX" x="485" y="106" text-anchor="middle">count: 1</text></g>
<g data-s="2"><rect class="sV" x="560" y="170" width="150" height="50" rx="10"/><text class="sM" x="635" y="192" text-anchor="middle">{ increment: ƒ }</text><text class="sC" x="635" y="210" text-anchor="middle">returned object</text><path class="sLg" d="M620 170 C620 140 560 118 560 118" marker-end="url(#ahg)"/><text class="sGt" x="612" y="152" text-anchor="end">[[Environment]]</text></g>
<g data-s="3-3"><text class="sWt" x="160" y="176" text-anchor="middle">makeCounter has returned: its frame is gone</text></g>
<g data-s="5"><text class="sGt" x="485" y="48" text-anchor="middle">still reachable through c → private state</text></g>
</svg><ol class="dia-steps">
<li>Calling <code>makeCounter()</code> pushes a frame and creates an environment on the heap holding <code>count = 0</code>.</li>
<li>The arrow function is created inside that call, so it gets a hidden link, <code>[[Environment]]</code>, to the environment it was created in.</li>
<li>The call returns and its frame is popped. The environment is <i>not</i> freed: the returned function still refers to it, and <code>c</code> refers to the function.</li>
<li>Calling <code>c.increment()</code> pushes a new frame. Looking up <code>count</code> follows the scope chain to that saved environment and changes it to 1.</li>
<li>Nothing outside can reach <code>count</code> except through <code>increment</code>: that is a closure giving you private state.</li>
</ol><figcaption>What a closure is, in memory: an environment kept alive by the function that was created inside it.</figcaption></figure>

**The classic loop question:**

```js
for (var i = 0; i < 3; i++) setTimeout(() => console.log(i), 0);   // 3 3 3
for (let j = 0; j < 3; j++) setTimeout(() => console.log(j), 0);   // 0 1 2
```

With `var` there is **one** `i` for the whole function; by the time the callbacks run, it's 3. With `let`, each iteration gets a **new binding**, and each callback closes over its own.

<figure class="dia"><svg viewBox="0 0 720 204" role="img" aria-label="With var all three callbacks share one variable that ends at 3; with let each iteration has its own binding">
<text class="sM" x="180" y="22" text-anchor="middle">for (var i …)</text><text class="sM" x="540" y="22" text-anchor="middle">for (let j …)</text>
<rect class="sR" x="130" y="120" width="100" height="44" rx="8"/><text class="sT" x="180" y="140" text-anchor="middle">one i</text><text class="sC" x="180" y="156" text-anchor="middle">ends at 3</text>
<rect class="sB" x="30" y="44" width="90" height="34" rx="6"/><text class="sC" x="75" y="66" text-anchor="middle">callback 1</text><line class="sLr" x1="75" y1="78" x2="170" y2="118" marker-end="url(#ahr)"/>
<rect class="sB" x="140" y="44" width="90" height="34" rx="6"/><text class="sC" x="185" y="66" text-anchor="middle">callback 2</text><line class="sLr" x1="185" y1="78" x2="180" y2="118" marker-end="url(#ahr)"/>
<rect class="sB" x="250" y="44" width="90" height="34" rx="6"/><text class="sC" x="295" y="66" text-anchor="middle">callback 3</text><line class="sLr" x1="295" y1="78" x2="190" y2="118" marker-end="url(#ahr)"/>
<text class="sRt" x="180" y="192" text-anchor="middle">prints 3 3 3</text>
<rect class="sB" x="390" y="44" width="90" height="34" rx="6"/><text class="sC" x="435" y="66" text-anchor="middle">callback 1</text><line class="sLg" x1="435" y1="78" x2="435" y2="118" marker-end="url(#ahg)"/><rect class="sG" x="390" y="120" width="90" height="44" rx="8"/><text class="sT" x="435" y="140" text-anchor="middle">j = 0</text><text class="sC" x="435" y="156" text-anchor="middle">own binding</text>
<rect class="sB" x="500" y="44" width="90" height="34" rx="6"/><text class="sC" x="545" y="66" text-anchor="middle">callback 2</text><line class="sLg" x1="545" y1="78" x2="545" y2="118" marker-end="url(#ahg)"/><rect class="sG" x="500" y="120" width="90" height="44" rx="8"/><text class="sT" x="545" y="140" text-anchor="middle">j = 1</text><text class="sC" x="545" y="156" text-anchor="middle">own binding</text>
<rect class="sB" x="610" y="44" width="90" height="34" rx="6"/><text class="sC" x="655" y="66" text-anchor="middle">callback 3</text><line class="sLg" x1="655" y1="78" x2="655" y2="118" marker-end="url(#ahg)"/><rect class="sG" x="610" y="120" width="90" height="44" rx="8"/><text class="sT" x="655" y="140" text-anchor="middle">j = 2</text><text class="sC" x="655" y="156" text-anchor="middle">own binding</text>
<text class="sGt" x="540" y="192" text-anchor="middle">prints 0 1 2</text>
<line class="sD" x1="360" y1="12" x2="360" y2="200"/>
</svg><figcaption>The loop question as a picture: <code>var</code> gives the whole function one binding; <code>let</code> gives every iteration a fresh one.</figcaption></figure>

> [!say]
> "A closure is a function that remembers the variables of the scope it was defined in, even after that scope has finished. I use them for private state, like a counter factory, and they're everywhere in callbacks and React hooks. The classic bug is var in a loop: all the callbacks share one variable, while let creates a fresh one per iteration."

> [!story]
> React's **stale closure** bug is this exact idea: an effect or an interval callback captures the state value from the render it was created in, and keeps seeing that old value. It comes back in [[F6]].

## F3.5 How `this` works 🟢 ⭐

`this` is decided by **how a function is called**, not where it's written, except for arrow functions.

<figure class="dia"><svg viewBox="0 0 720 272" role="img" aria-label="Flowchart for working out this: arrow function, new, call apply or bind, method call, or a plain call">
<rect class="sW" x="20" y="14" width="300" height="40" rx="20"/><text class="sS" x="170" y="39" text-anchor="middle">Is it an arrow function?</text>
<line class="sLg" x1="320" y1="34" x2="396" y2="34" marker-end="url(#ahg)"/><text class="sGt" x="358" y="28" text-anchor="middle">yes</text>
<rect class="sG" x="400" y="14" width="300" height="40" rx="8"/><text class="sS" x="550" y="39" text-anchor="middle">this of the code around it (lexical)</text>
<line class="sLm" x1="170" y1="54" x2="170" y2="66" marker-end="url(#ahm)"/><text class="sC" x="180" y="64">no</text>
<rect class="sW" x="20" y="68" width="300" height="40" rx="20"/><text class="sS" x="170" y="93" text-anchor="middle">Called with new?</text>
<line class="sLg" x1="320" y1="88" x2="396" y2="88" marker-end="url(#ahg)"/><text class="sGt" x="358" y="82" text-anchor="middle">yes</text>
<rect class="sG" x="400" y="68" width="300" height="40" rx="8"/><text class="sS" x="550" y="93" text-anchor="middle">the newly created object</text>
<line class="sLm" x1="170" y1="108" x2="170" y2="120" marker-end="url(#ahm)"/><text class="sC" x="180" y="118">no</text>
<rect class="sW" x="20" y="122" width="300" height="40" rx="20"/><text class="sS" x="170" y="147" text-anchor="middle">Called via call / apply / bind?</text>
<line class="sLg" x1="320" y1="142" x2="396" y2="142" marker-end="url(#ahg)"/><text class="sGt" x="358" y="136" text-anchor="middle">yes</text>
<rect class="sG" x="400" y="122" width="300" height="40" rx="8"/><text class="sS" x="550" y="147" text-anchor="middle">the object you passed</text>
<line class="sLm" x1="170" y1="162" x2="170" y2="174" marker-end="url(#ahm)"/><text class="sC" x="180" y="172">no</text>
<rect class="sW" x="20" y="176" width="300" height="40" rx="20"/><text class="sS" x="170" y="201" text-anchor="middle">Called as obj.method()?</text>
<line class="sLg" x1="320" y1="196" x2="396" y2="196" marker-end="url(#ahg)"/><text class="sGt" x="358" y="190" text-anchor="middle">yes</text>
<rect class="sG" x="400" y="176" width="300" height="40" rx="8"/><text class="sS" x="550" y="201" text-anchor="middle">obj, the thing before the dot</text>
<line class="sLm" x1="170" y1="216" x2="170" y2="232" marker-end="url(#ahm)"/><text class="sC" x="180" y="230">no</text><rect class="sR" x="20" y="234" width="680" height="30" rx="8"/><text class="sS" x="360" y="254" text-anchor="middle">a plain call f(): undefined in strict code (modules, classes); globalThis in old sloppy scripts</text>
</svg><figcaption>Ask the questions in this order. Only the call site matters, except for arrow functions, which never have their own <code>this</code>.</figcaption></figure>

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

<figure class="dia"><svg viewBox="0 0 720 208" role="img" aria-label="Prototype chain from an instance through SavingsAccount.prototype and Account.prototype to Object.prototype, with the lookup of deposit">
<rect class="sA" x="10" y="40" width="160" height="56" rx="8"/><text class="sC" x="90" y="62" text-anchor="middle">savings</text><text class="sM" x="90" y="82" text-anchor="middle">owner · #balance</text>
<line class="sLm" x1="170" y1="68" x2="180" y2="68" marker-end="url(#ahm)"/>
<rect class="sB" x="182" y="40" width="160" height="56" rx="8"/><text class="sC" x="262" y="62" text-anchor="middle">SavingsAccount.prototype</text><text class="sM" x="262" y="82" text-anchor="middle">addInterest()</text>
<line class="sLm" x1="342" y1="68" x2="352" y2="68" marker-end="url(#ahm)"/>
<rect class="sB" x="354" y="40" width="160" height="56" rx="8"/><text class="sC" x="434" y="62" text-anchor="middle">Account.prototype</text><text class="sM" x="434" y="82" text-anchor="middle">deposit() · balance</text>
<line class="sLm" x1="514" y1="68" x2="524" y2="68" marker-end="url(#ahm)"/>
<rect class="sB" x="526" y="40" width="160" height="56" rx="8"/><text class="sC" x="606" y="62" text-anchor="middle">Object.prototype</text><text class="sM" x="606" y="82" text-anchor="middle">toString() · …</text>
<text class="sM" x="700" y="72" text-anchor="end">null</text>
<text class="sC" x="360" y="24" text-anchor="middle">each object links to its prototype, its [[Prototype]]</text>
<path class="sLw" d="M90 100 C90 140 250 140 250 102" marker-end="url(#ahw)"/><text class="sWt" x="170" y="152" text-anchor="middle">not here</text>
<path class="sLg" d="M250 100 C250 160 422 160 422 102" marker-end="url(#ahg)"/><text class="sGt" x="336" y="170" text-anchor="middle">found: deposit()</text>
<text class="sS" x="360" y="196" text-anchor="middle">savings.deposit(100): look on the object, then up the chain until found (or null → undefined)</text>
</svg><figcaption><code>class</code> and <code>extends</code> build exactly this chain. Methods live once on the prototypes, not on every instance.</figcaption></figure>

## F3.7 Objects, arrays and immutability 🟢 ⭐

```js
const { name, address: { city } = {}, ...rest } = user;   // destructuring with default and rest
const [first, , third] = items;
const merged = { ...defaults, ...options };                // later keys win
const copy = [...items, newItem];                           // new array; items unchanged
```

**Shallow vs deep copy.** Spread and `Object.assign` copy only the **top level**; nested objects are still shared. For a real deep copy use `structuredClone(obj)` (built into browsers and Node since 2022), which also handles `Date`, `Map`, `Set` and circular references.

<figure class="dia"><svg viewBox="0 0 720 228" role="img" aria-label="A spread copy shares the nested address object with the original; structuredClone copies the nested object too">
<rect class="sA" x="20" y="40" width="150" height="60" rx="8"/><text class="sC" x="95" y="62" text-anchor="middle">user</text><text class="sM" x="95" y="84" text-anchor="middle">name · address</text><rect class="sV" x="285" y="40" width="150" height="60" rx="8"/><text class="sC" x="360" y="62" text-anchor="middle">copy = {...user}</text><text class="sM" x="360" y="84" text-anchor="middle">name · address</text><rect class="sG" x="550" y="40" width="150" height="60" rx="8"/><text class="sC" x="625" y="62" text-anchor="middle">structuredClone(user)</text><text class="sM" x="625" y="84" text-anchor="middle">name · address</text>
<rect class="sW" x="150" y="150" width="150" height="46" rx="8"/><text class="sC" x="225" y="170" text-anchor="middle">address</text><text class="sM" x="225" y="188" text-anchor="middle">{ city: "Giza" }</text>
<rect class="sG" x="550" y="150" width="150" height="46" rx="8"/><text class="sC" x="625" y="170" text-anchor="middle">its own address</text><text class="sM" x="625" y="188" text-anchor="middle">{ city: "Giza" }</text>
<line class="sL" x1="130" y1="100" x2="200" y2="148" marker-end="url(#ah)"/><line class="sLw" x1="360" y1="100" x2="260" y2="148" marker-end="url(#ahw)"/><line class="sLg" x1="625" y1="100" x2="625" y2="148" marker-end="url(#ahg)"/>
<text class="sWt" x="225" y="218" text-anchor="middle">shared: copy.address.city = "Cairo" changes user too</text>
<text class="sGt" x="625" y="218" text-anchor="middle">independent</text>
</svg><figcaption>Spread copies one level. Nested objects are still shared until you copy them too, or use <code>structuredClone</code>.</figcaption></figure>

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

<figure class="dia"><svg viewBox="0 0 720 220" role="img" aria-label="Timeline: a burst of input events, debounce firing once after each pause, throttle firing at regular intervals during the burst">
<text class="sS" x="110" y="50" text-anchor="end">input events</text>
<line class="sLm" x1="120.0" y1="36" x2="120.0" y2="56"/>
<line class="sLm" x1="142.8" y1="36" x2="142.8" y2="56"/>
<line class="sLm" x1="165.6" y1="36" x2="165.6" y2="56"/>
<line class="sLm" x1="188.4" y1="36" x2="188.4" y2="56"/>
<line class="sLm" x1="211.2" y1="36" x2="211.2" y2="56"/>
<line class="sLm" x1="234.0" y1="36" x2="234.0" y2="56"/>
<line class="sLm" x1="256.8" y1="36" x2="256.8" y2="56"/>
<line class="sLm" x1="279.6" y1="36" x2="279.6" y2="56"/>
<line class="sLm" x1="302.4" y1="36" x2="302.4" y2="56"/>
<line class="sLm" x1="325.2" y1="36" x2="325.2" y2="56"/>
<line class="sLm" x1="348.0" y1="36" x2="348.0" y2="56"/>
<line class="sLm" x1="370.8" y1="36" x2="370.8" y2="56"/>
<line class="sLm" x1="490.5" y1="36" x2="490.5" y2="56"/>
<line class="sLm" x1="513.3" y1="36" x2="513.3" y2="56"/>
<line class="sLm" x1="536.1" y1="36" x2="536.1" y2="56"/>
<text class="sS" x="110" y="100" text-anchor="end">debounce(300)</text><line class="sN" x1="120" y1="96" x2="690" y2="96"/>
<circle class="sPg" cx="456.3" cy="96" r="8"/>
<circle class="sPg" cx="621.6" cy="96" r="8"/>
<text class="sGt" x="456.3" y="122" text-anchor="middle">fires once the typing pauses</text>
<text class="sS" x="110" y="160" text-anchor="end">throttle(400)</text><line class="sN" x1="120" y1="156" x2="690" y2="156"/>
<circle class="sPw" cx="120.0" cy="156" r="8"/>
<circle class="sPw" cx="234.0" cy="156" r="8"/>
<circle class="sPw" cx="348.0" cy="156" r="8"/>
<circle class="sPw" cx="490.5" cy="156" r="8"/>
<text class="sWt" x="234" y="182" text-anchor="middle">fires at most every 400 ms while events keep coming</text>
<text class="sC" x="120" y="210" text-anchor="middle">0 ms</text>
<text class="sC" x="262.5" y="210" text-anchor="middle">500 ms</text>
<text class="sC" x="405" y="210" text-anchor="middle">1000 ms</text>
<text class="sC" x="547.5" y="210" text-anchor="middle">1500 ms</text>
<text class="sC" x="690" y="210" text-anchor="middle">2000 ms</text>
</svg><figcaption>Debounce waits for quiet; throttle keeps a steady beat. Search boxes want the first, scroll and resize handlers the second.</figcaption></figure>

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
