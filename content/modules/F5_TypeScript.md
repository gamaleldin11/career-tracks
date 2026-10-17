# TypeScript — Types That Catch Bugs Before Users Do

Angular is written in TypeScript, almost every serious React codebase uses it, and Node backends increasingly do. Interviews check that you use the type system to **model the domain** rather than sprinkling `any` to make errors go away. As a C# developer you have a head start: generics, interfaces and access modifiers feel familiar. The differences, **structural typing** and **types that vanish at runtime**, are exactly what interviewers probe.

> [!focus]
> **Entry must:** annotate functions and objects; interfaces vs type aliases; union types and narrowing; `any` vs `unknown`; basic generics; the common utility types; strict mode.
> **Mid adds:** discriminated unions for state, `keyof`/`typeof`/indexed access, mapped and conditional types, `satisfies`, typing API responses with runtime validation, and how the new Go-based compiler (TypeScript 7) changes tooling.
> **Most asked:** *interface vs type?* · *any vs unknown vs never?* · *What are generics?* · *Explain Partial, Pick, Omit and Record* · *What is a discriminated union?* · *Does TypeScript check types at runtime?* · *What is structural typing?*
> **Time budget:** 3 hours, with the [TypeScript Playground](https://www.typescriptlang.org/play) open.

## F5.0 Foundations: what a type system does 🟢

**Dynamic vs static typing.** JavaScript is **dynamically** typed: types belong to *values* at runtime, and a variable can hold a string now and a number later. Mistakes show up when that line runs, maybe in front of a user. A **static** type system checks the program *before* it runs, from the code alone. C# and TypeScript are statically typed; TypeScript adds a static layer on top of a dynamic language.

**A type is a set of values.** This one idea makes most of TypeScript easy to reason about:

<figure class="dia"><svg viewBox="0 0 720 250" role="img" aria-label="Types as sets: unknown contains all values; string and number are sets; literal types are subsets of string; a union covers both; never is the empty set; any switches checking off">
<rect class="sN" x="20" y="20" width="470" height="220" rx="16"/><text class="sT" x="36" y="42">unknown: every possible value</text>
<ellipse class="sA" cx="160" cy="132" rx="110" ry="70" opacity=".8"/><text class="sT" x="160" y="86" text-anchor="middle">string</text>
<ellipse class="sG" cx="160" cy="146" rx="52" ry="30"/><text class="sC" x="160" y="142" text-anchor="middle">"paid" | "draft"</text><text class="sC" x="160" y="158" text-anchor="middle">literal types</text>
<ellipse class="sW" cx="370" cy="132" rx="90" ry="60" opacity=".85"/><text class="sT" x="370" y="128" text-anchor="middle">number</text><text class="sC" x="370" y="146" text-anchor="middle">42, 3.14, NaN…</text>
<path class="sLv" d="M60 206 H455" stroke-dasharray="6 4"/><text class="sC" x="258" y="224" text-anchor="middle">string | number covers both circles</text>
<rect class="sB" x="510" y="30" width="190" height="60" rx="10"/><text class="sT" x="605" y="54" text-anchor="middle">never</text><text class="sC" x="605" y="74" text-anchor="middle">the empty set: no value</text>
<rect class="sR" x="510" y="104" width="190" height="60" rx="10"/><text class="sT" x="605" y="128" text-anchor="middle">any</text><text class="sC" x="605" y="148" text-anchor="middle">not a set: checking off</text>
<text class="sS" x="605" y="196" text-anchor="middle">A is assignable to B</text><text class="sM" x="605" y="214" text-anchor="middle">when A ⊆ B</text>
</svg><figcaption>Think of a type as a set of values. Unions add sets together, narrowing removes members, and "assignable" just means "is a subset of".</figcaption></figure>

- `string` is the set of all strings; the literal type `"paid"` is a set with one member.
- `string | number` is the **union** of two sets; narrowing ([[F5.5]]) removes members until one remains.
- `unknown` is the set of everything (safe: you must narrow before use); `never` is the empty set (nothing can be assigned to it, which is why it catches missing cases).
- `any` is not a set at all: it switches checking off in both directions.

**Compile time vs run time.** The checker reasons about your code; it never sees real data. After checking, the types are removed and ordinary JavaScript runs.

<figure class="dia anim"><svg viewBox="0 0 720 210" role="img" aria-label="Animation: typeScript source goes to a type checker that reports errors and to an emitter that strips the types, producing JavaScript that runs">
<rect class="sA" x="10" y="70" width="110" height="50" rx="8"/><text class="sT" x="65" y="93" text-anchor="middle">invoice.ts</text><text class="sC" x="65" y="109" text-anchor="middle">types + code</text>
<line class="sL" x1="120" y1="85" x2="176" y2="60" marker-end="url(#ah)"/><line class="sL" x1="120" y1="105" x2="176" y2="130" marker-end="url(#ah)"/>
<rect class="sW" x="180" y="30" width="150" height="50" rx="8"/><text class="sT" x="255" y="53" text-anchor="middle">type checker</text><text class="sC" x="255" y="69" text-anchor="middle">tsc / tsgo</text><rect class="sB" x="180" y="112" width="150" height="50" rx="8"/><text class="sT" x="255" y="135" text-anchor="middle">emitter / stripper</text><text class="sC" x="255" y="151" text-anchor="middle">tsc, esbuild, swc</text>
<line class="sLr" x1="330" y1="55" x2="396" y2="55" marker-end="url(#ahr)"/><rect class="sR" x="400" y="34" width="170" height="42" rx="8"/><text class="sC" x="485" y="54" text-anchor="middle">errors in the editor</text><text class="sC" x="485" y="68" text-anchor="middle">and in CI</text>
<line class="sLg" x1="330" y1="137" x2="396" y2="137" marker-end="url(#ahg)"/><rect class="sG" x="400" y="112" width="170" height="50" rx="8"/><text class="sT" x="485" y="135" text-anchor="middle">invoice.js</text><text class="sC" x="485" y="151" text-anchor="middle">types erased</text>
<line class="sLm" x1="570" y1="137" x2="600" y2="137" marker-end="url(#ahm)"/><rect class="sB" x="604" y="112" width="106" height="50" rx="8"/><text class="sT" x="657" y="135" text-anchor="middle">runs</text><text class="sC" x="657" y="151" text-anchor="middle">browser · Node</text>
<text class="sS" x="360" y="196" text-anchor="middle">Vite and esbuild only strip types for speed; they never type-check. CI must run tsc --noEmit.</text>
<circle class="sPw" r="4" opacity="0"><animateMotion dur="8s" repeatCount="indefinite" calcMode="linear" keyPoints="0;0;1;1" keyTimes="0;0.000;0.100;1" path="M120 85 L176 60"/><animate attributeName="opacity" dur="8s" repeatCount="indefinite" values="0;0;1;1;0;0" keyTimes="0;0.000;0.002;0.100;0.102;1"/></circle>
<circle class="sP" r="4" opacity="0"><animateMotion dur="8s" repeatCount="indefinite" calcMode="linear" keyPoints="0;0;1;1" keyTimes="0;0.000;0.100;1" path="M120 105 L176 130"/><animate attributeName="opacity" dur="8s" repeatCount="indefinite" values="0;0;1;1;0;0" keyTimes="0;0.000;0.002;0.100;0.102;1"/></circle>
<circle class="sPr" r="4" opacity="0"><animateMotion dur="8s" repeatCount="indefinite" calcMode="linear" keyPoints="0;0;1;1" keyTimes="0;0.200;0.320;1" path="M330 55 L396 55"/><animate attributeName="opacity" dur="8s" repeatCount="indefinite" values="0;0;1;1;0;0" keyTimes="0;0.198;0.202;0.320;0.322;1"/></circle>
<circle class="sPg" r="4" opacity="0"><animateMotion dur="8s" repeatCount="indefinite" calcMode="linear" keyPoints="0;0;1;1" keyTimes="0;0.200;0.320;1" path="M330 137 L396 137"/><animate attributeName="opacity" dur="8s" repeatCount="indefinite" values="0;0;1;1;0;0" keyTimes="0;0.198;0.202;0.320;0.322;1"/></circle>
<circle class="sPg" r="4" opacity="0"><animateMotion dur="8s" repeatCount="indefinite" calcMode="linear" keyPoints="0;0;1;1" keyTimes="0;0.420;0.500;1" path="M570 137 L600 137"/><animate attributeName="opacity" dur="8s" repeatCount="indefinite" values="0;0;1;1;0;0" keyTimes="0;0.418;0.422;0.500;0.502;1"/></circle>
</svg><figcaption>Checking and emitting are separate jobs. The JavaScript that runs has no types left in it.</figcaption></figure>

**Inference.** You rarely write types for local variables: the compiler infers `let total = 0` as `number` and `const status = "paid"` as the literal `"paid"`. You annotate the **edges**: function parameters, exported functions and data that comes from outside.

## F5.1 What TypeScript is, and isn't 🟢 ⭐

TypeScript is JavaScript plus a **static type system**. The compiler checks types, then **erases** them, producing plain JavaScript. So:

- Types catch mistakes **at build time** and power editor features (autocomplete, safe renames, go-to-definition).
- Types **don't exist at runtime**. Data from an API, `localStorage` or a form is whatever it actually is, whatever your interface claims. You need runtime validation at those boundaries ([[F5.9]]).

> [!say]
> "TypeScript adds static types to JavaScript; they're checked at compile time and erased, so the output is plain JavaScript. That gives me safer refactoring and better tooling, but it doesn't validate data at runtime, so at boundaries like API responses I validate with a schema library."

> [!sota] TypeScript 7 (July 2026)
> The compiler and language service were ported to **Go** and ship as a native program; Microsoft reports full builds typically **8–12× faster**. The language is the same: the port aimed for identical type-checking results. Practical effects: much faster CI type-checks and a more responsive editor in large monorepos. Separately, recent Node.js versions can run `.ts` files directly by **stripping** type annotations, for code that uses only erasable syntax.

## F5.2 The everyday types 🟢

```ts
let title: string = "Invoice";
let amount = 1250;                         // inferred as number: don't annotate the obvious
const status = "paid";                     // inferred as the literal type "paid" (const)
let tags: string[] = [];                   // or Array<string>
let pair: [string, number] = ["EGP", 100]; // tuple: fixed length and positions

function total(items: { price: number; qty: number }[], discount = 0): number {
  return items.reduce((s, i) => s + i.price * i.qty, 0) * (1 - discount);
}

type Handler = (event: MouseEvent) => void;    // a function type
let maybe: string | undefined;                 // optional value
```

Let inference do the work for local variables; annotate **function parameters, return types of exported functions, and public APIs**.

<figure class="dia"><svg viewBox="0 0 720 186" role="img" aria-label="TypeScript inference: let amount = 1250 infers number; const status = paid infers the literal type paid; let status2 = paid widens to string; an empty array needs an annotation such as string[]; a tuple type fixes positions like string then number">
<rect class="sN" x="14" y="14" width="270" height="26" rx="5"/><text class="sC" x="24" y="32" xml:space="preserve" style="white-space:pre">let amount = 1250</text><line class="sLm" x1="284" y1="27" x2="310" y2="27" marker-end="url(#ahm)"/><rect class="sB" x="312" y="14" width="150" height="26" rx="5" opacity=".7"/><text class="sC" x="322" y="32" xml:space="preserve" style="white-space:pre">number</text><text class="sS" x="474" y="32">inferred</text>
<rect class="sN" x="14" y="48" width="270" height="26" rx="5"/><text class="sC" x="24" y="66" xml:space="preserve" style="white-space:pre">const status = "paid"</text><line class="sLm" x1="284" y1="61" x2="310" y2="61" marker-end="url(#ahm)"/><rect class="sB" x="312" y="48" width="150" height="26" rx="5" opacity=".7"/><text class="sC" x="322" y="66" xml:space="preserve" style="white-space:pre">"paid"</text><text class="sS" x="474" y="66">literal: const never changes</text>
<rect class="sN" x="14" y="82" width="270" height="26" rx="5"/><text class="sC" x="24" y="100" xml:space="preserve" style="white-space:pre">let status2 = "paid"</text><line class="sLm" x1="284" y1="95" x2="310" y2="95" marker-end="url(#ahm)"/><rect class="sB" x="312" y="82" width="150" height="26" rx="5" opacity=".7"/><text class="sC" x="322" y="100" xml:space="preserve" style="white-space:pre">string</text><text class="sS" x="474" y="100">widened: let can change</text>
<rect class="sN" x="14" y="116" width="270" height="26" rx="5"/><text class="sC" x="24" y="134" xml:space="preserve" style="white-space:pre">let tags: string[] = []</text><line class="sLm" x1="284" y1="129" x2="310" y2="129" marker-end="url(#ahm)"/><rect class="sB" x="312" y="116" width="150" height="26" rx="5" opacity=".7"/><text class="sC" x="322" y="134" xml:space="preserve" style="white-space:pre">string[]</text><text class="sS" x="474" y="134">annotate empty containers</text>
<rect class="sN" x="14" y="150" width="270" height="26" rx="5"/><text class="sC" x="24" y="168" xml:space="preserve" style="white-space:pre">let pair: [string, number]</text><line class="sLm" x1="284" y1="163" x2="310" y2="163" marker-end="url(#ahm)"/><rect class="sB" x="312" y="150" width="150" height="26" rx="5" opacity=".7"/><text class="sC" x="322" y="168" xml:space="preserve" style="white-space:pre">[string, number]</text><text class="sS" x="474" y="168">tuple: fixed positions</text>
</svg><figcaption>Annotate the boundaries (parameters, empty containers, public APIs) and let inference handle the rest. Hover any variable in the editor to see what TypeScript decided.</figcaption></figure>

## F5.3 Interfaces vs type aliases 🟢 ⭐

```ts
interface Invoice {
  readonly id: string;
  customerId: string;
  amount: number;
  dueDate: Date;
  notes?: string;                       // optional
}
interface OverdueInvoice extends Invoice { daysLate: number; }

type Currency = "EGP" | "USD" | "EUR";  // only a type alias can name a union
type Money = { amount: number; currency: Currency };
type InvoiceWithMoney = Omit<Invoice, "amount"> & { total: Money };   // intersection
```

| | `interface` | `type` |
|---|---|---|
| Object shapes | ✓ | ✓ |
| Unions, primitives, tuples, mapped and conditional types | ✗ | ✓ |
| `extends` | ✓ (and gives clearer errors) | Use `&` intersections |
| **Declaration merging** (two declarations combine) | ✓, useful for augmenting library types | ✗ (a duplicate is an error) |
| `class implements` | ✓ | ✓ (for object types) |

> [!say]
> "Both describe object shapes. I use interfaces for object contracts that may be extended, like DTOs and component inputs, and type aliases for unions, tuples and computed types. Interfaces can merge declarations, which is handy for augmenting library types; type aliases can't."

<figure class="dia"><svg viewBox="0 0 720 220" role="img" aria-label="Interface versus type alias in TypeScript: interfaces describe object shapes and class contracts, extend other interfaces and support declaration merging; type aliases can also name unions, intersections, mapped and conditional types, tuples, primitives and function types; for plain objects both work">
<text class="sM" x="180" y="22" text-anchor="middle">interface</text>
<text class="sM" x="540" y="22" text-anchor="middle">type alias</text>
<rect class="sB" x="14" y="34" width="330" height="150" rx="10" opacity=".35"/>
<rect class="sV" x="376" y="34" width="330" height="150" rx="10" opacity=".35"/>
<text class="sS" x="30" y="64">✓ object shapes, class contracts</text>
<text class="sS" x="30" y="92">✓ extends another interface</text>
<text class="sS" x="30" y="120">✓ declaration merging (libraries)</text>
<text class="sS" x="30" y="148">✓ clear error messages</text>
<text class="sS" x="392" y="64">✓ unions: "EGP" | "USD"</text>
<text class="sS" x="392" y="92">✓ intersections: A &amp; B</text>
<text class="sS" x="392" y="120">✓ mapped / conditional types</text>
<text class="sS" x="392" y="148">✓ tuples, primitives, functions</text>
<text class="sS" x="360" y="210" text-anchor="middle">both describe object shapes equally well; pick one convention per codebase and use type for what interfaces cannot express</text>
</svg><figcaption>A common rule: <code>interface</code> for public object shapes, <code>type</code> for unions and compositions. Consistency matters more than the choice.</figcaption></figure>

## F5.4 Structural typing 🟢 ⭐

> [!term] Structural typing
> TypeScript checks compatibility by **shape**, not by name. If an object has all the required properties with compatible types, it fits, even if it was never declared as that type. C# is **nominal**: a class must explicitly implement an interface.

```ts
interface Point { x: number; y: number; }
const p = { x: 1, y: 2, label: "A" };
function draw(pt: Point) {}
draw(p);                       // OK: p has x and y (extra properties are fine via a variable)
draw({ x: 1, y: 2, label: "A" });  // Error: object literals get an "excess property check"
```

## F5.5 Unions and narrowing 🟢 ⭐

A **union** (`A | B`) is a value that could be either. Before using it, you **narrow** it to one case, and the compiler follows your checks:

<figure class="dia steps" data-start="1"><svg viewBox="0 0 720 210" role="img" aria-label="The type of value at each line of a function, narrowing from string or number or Date down to one type in each branch">
<rect class="sB" x="10" y="14" width="430" height="168" rx="8"/>
<text class="sC" x="20" y="36" xml:space="preserve" style="white-space:pre">function format(value: string | number | Date) {</text>
<text class="sC" x="20" y="58" xml:space="preserve" style="white-space:pre">  if (typeof value === "string")</text>
<text class="sC" x="20" y="80" xml:space="preserve" style="white-space:pre">    return value.trim();</text>
<text class="sC" x="20" y="102" xml:space="preserve" style="white-space:pre">  if (value instanceof Date)</text>
<text class="sC" x="20" y="124" xml:space="preserve" style="white-space:pre">    return value.toLocaleDateString();</text>
<text class="sC" x="20" y="146" xml:space="preserve" style="white-space:pre">  return value.toFixed(2);</text>
<text class="sC" x="20" y="168" xml:space="preserve" style="white-space:pre">}</text>
<g data-s="1-1"><rect class="sA" x="14" y="22" width="422" height="20" rx="3" opacity=".55"/><rect class="sV" x="470" y="20" width="240" height="26" rx="6"/><text class="sM" x="590" y="37" text-anchor="middle">value: string | number | Date</text><line class="sLm" x1="440" y1="32" x2="466" y2="32" marker-end="url(#ahm)"/></g>
<g data-s="2-2"><rect class="sA" x="14" y="66" width="422" height="20" rx="3" opacity=".55"/><rect class="sV" x="470" y="64" width="240" height="26" rx="6"/><text class="sM" x="590" y="81" text-anchor="middle">value: string</text><line class="sLm" x1="440" y1="76" x2="466" y2="76" marker-end="url(#ahm)"/></g>
<g data-s="3-3"><rect class="sA" x="14" y="88" width="422" height="20" rx="3" opacity=".55"/><rect class="sV" x="470" y="86" width="240" height="26" rx="6"/><text class="sM" x="590" y="103" text-anchor="middle">value: number | Date</text><line class="sLm" x1="440" y1="98" x2="466" y2="98" marker-end="url(#ahm)"/></g>
<g data-s="4-4"><rect class="sA" x="14" y="110" width="422" height="20" rx="3" opacity=".55"/><rect class="sV" x="470" y="108" width="240" height="26" rx="6"/><text class="sM" x="590" y="125" text-anchor="middle">value: Date</text><line class="sLm" x1="440" y1="120" x2="466" y2="120" marker-end="url(#ahm)"/></g>
<g data-s="5-5"><rect class="sA" x="14" y="132" width="422" height="20" rx="3" opacity=".55"/><rect class="sV" x="470" y="130" width="240" height="26" rx="6"/><text class="sM" x="590" y="147" text-anchor="middle">value: number</text><line class="sLm" x1="440" y1="142" x2="466" y2="142" marker-end="url(#ahm)"/></g>
<text class="sC" x="590" y="200" text-anchor="middle">what your editor shows on hover</text>
</svg><ol class="dia-steps">
<li>At the top, <code>value</code> could be any of the three.</li>
<li>Inside the <code>typeof</code> check, the compiler knows it is a <code>string</code>, so <code>.trim()</code> is allowed.</li>
<li>After that branch returns, strings are gone: what's left is <code>number | Date</code>.</li>
<li><code>instanceof Date</code> narrows to <code>Date</code>.</li>
<li>Everything else has been ruled out, so the last line can only be a <code>number</code>. If you add a type to the union and forget a branch, this line stops compiling.</li>
</ol><figcaption>Control-flow narrowing. The compiler follows your checks and shrinks the set at every branch.</figcaption></figure>

```ts
function format(value: string | number | Date): string {
  if (typeof value === "string") return value.trim();           // typeof guard
  if (value instanceof Date) return value.toLocaleDateString(); // instanceof guard
  return value.toFixed(2);                                       // must be number here
}

function area(s: { kind: "circle"; r: number } | { kind: "rect"; w: number; h: number }) {
  if ("r" in s) return Math.PI * s.r ** 2;                       // `in` guard
  return s.w * s.h;
}
```

### Discriminated unions: model state honestly 🟡 ⭐

> [!term] Discriminated union
> A union of object types that share a literal "tag" property (`status`, `kind`, `type`). Checking the tag narrows to exactly one member, and the compiler can check that a `switch` handles every case.

```ts
type LoadState<T> =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: T }
  | { status: "error"; error: string };

function render(s: LoadState<Invoice[]>) {
  switch (s.status) {
    case "idle":    return "";
    case "loading": return "Loading…";
    case "success": return `${s.data.length} invoices`;     // data exists only here
    case "error":   return `Failed: ${s.error}`;
    default: {
      const unreachable: never = s;                          // compile error if a case is missing
      return unreachable;
    }
  }
}
```

Compare with `{ loading: boolean; error?: string; data?: T }`, which allows impossible states like `loading: true` *with* an error *and* data. Making impossible states unrepresentable is a strong mid-level talking point.

<figure class="dia"><svg viewBox="0 0 720 214" role="img" aria-label="Three independent flags allow eight combinations, four of them impossible; a discriminated union allows exactly the four real states">
<text class="sM" x="180" y="22" text-anchor="middle">{ loading: boolean; error?: string; data?: T }</text>
<rect class="sG" x="20" y="36" width="80" height="64" rx="8"/><text class="sM" x="60" y="60" text-anchor="middle">none</text><text class="sGt" x="60" y="82" text-anchor="middle">idle</text>
<rect class="sG" x="106" y="36" width="80" height="64" rx="8"/><text class="sM" x="146" y="60" text-anchor="middle">D</text><text class="sGt" x="146" y="82" text-anchor="middle">success</text>
<rect class="sG" x="192" y="36" width="80" height="64" rx="8"/><text class="sM" x="232" y="60" text-anchor="middle">E</text><text class="sGt" x="232" y="82" text-anchor="middle">error</text>
<rect class="sR" x="278" y="36" width="80" height="64" rx="8" opacity=".55"/><text class="sM" x="318" y="60" text-anchor="middle">E+D</text><text class="sRt" x="318" y="82" text-anchor="middle">✕ impossible</text>
<rect class="sG" x="20" y="110" width="80" height="64" rx="8"/><text class="sM" x="60" y="134" text-anchor="middle">L</text><text class="sGt" x="60" y="156" text-anchor="middle">loading</text>
<rect class="sR" x="106" y="110" width="80" height="64" rx="8" opacity=".55"/><text class="sM" x="146" y="134" text-anchor="middle">L+D</text><text class="sRt" x="146" y="156" text-anchor="middle">✕ impossible</text>
<rect class="sR" x="192" y="110" width="80" height="64" rx="8" opacity=".55"/><text class="sM" x="232" y="134" text-anchor="middle">L+E</text><text class="sRt" x="232" y="156" text-anchor="middle">✕ impossible</text>
<rect class="sR" x="278" y="110" width="80" height="64" rx="8" opacity=".55"/><text class="sM" x="318" y="134" text-anchor="middle">L+E+D</text><text class="sRt" x="318" y="156" text-anchor="middle">✕ impossible</text>
<text class="sRt" x="180" y="192" text-anchor="middle">8 combinations, 4 make no sense</text><text class="sC" x="180" y="208" text-anchor="middle">L = loading, E = error, D = data</text>
<line class="sD" x1="370" y1="14" x2="370" y2="208"/>
<text class="sM" x="545" y="22" text-anchor="middle">type LoadState&lt;T&gt; = …</text>
<rect class="sG" x="400" y="36" width="290" height="32" rx="8"/><text class="sM" x="414" y="57">{ status: "idle" }</text>
<rect class="sG" x="400" y="76" width="290" height="32" rx="8"/><text class="sM" x="414" y="97">{ status: "loading" }</text>
<rect class="sG" x="400" y="116" width="290" height="32" rx="8"/><text class="sM" x="414" y="137">{ status: "success"; data: T }</text>
<rect class="sG" x="400" y="156" width="290" height="32" rx="8"/><text class="sM" x="414" y="177">{ status: "error"; error: string }</text>
<text class="sGt" x="545" y="200" text-anchor="middle">exactly 4 states; the impossible ones can't be written</text>
</svg><figcaption>Make impossible states unrepresentable. The union lets the compiler reject the four combinations that should never exist.</figcaption></figure>

## F5.6 `any`, `unknown`, `never`, `void` 🟢 ⭐

| Type | Meaning | Use |
|---|---|---|
| `any` | Turn type checking **off** for this value; anything goes, and it spreads | Almost never; temporary migration only |
| `unknown` | "Could be anything", but you **must narrow before use** | Values from outside: `JSON.parse`, `catch (e)`, API responses before validation |
| `never` | A value that can't exist | Exhaustiveness checks; functions that always throw |
| `void` | A function returns nothing useful | Event handlers, callbacks |

```ts
try { risky(); }
catch (e: unknown) {                                        // the default with `strict` (useUnknownInCatchVariables)
  const msg = e instanceof Error ? e.message : String(e);
}
```

> [!say]
> "any switches the type checker off, so errors slip through and it spreads to everything it touches. unknown is the safe alternative: it accepts anything but forces me to check the type before using it. never represents the impossible, and I use it for exhaustive switch checks."

<figure class="dia"><svg viewBox="0 0 720 200" role="img" aria-label="TypeScript types ordered by how many values they allow: never allows none, a literal type like paid allows one, string allows all strings, unknown allows anything but must be narrowed before use, and any switches checking off and spreads through the code">
<line class="sLm" x1="30" y1="90" x2="690" y2="90" marker-end="url(#ahm)" style="stroke-width:2"/>
<text class="sS" x="30" y="140">fewer possible values</text>
<text class="sS" x="690" y="140" text-anchor="end">more possible values</text>
<rect class="sR" x="30" y="40" width="100" height="34" rx="6"/><text class="sC" x="40" y="62" xml:space="preserve" style="white-space:pre">never</text><text class="sC" x="80" y="108" text-anchor="middle">no value can exist</text>
<rect class="sW" x="150" y="40" width="100" height="34" rx="6"/><text class="sC" x="160" y="62" xml:space="preserve" style="white-space:pre">"paid"</text><text class="sC" x="200" y="108" text-anchor="middle">one literal</text>
<rect class="sB" x="260" y="40" width="100" height="34" rx="6"/><text class="sC" x="270" y="62" xml:space="preserve" style="white-space:pre">string</text><text class="sC" x="310" y="108" text-anchor="middle">all strings</text>
<rect class="sG" x="390" y="40" width="100" height="34" rx="6"/><text class="sC" x="400" y="62" xml:space="preserve" style="white-space:pre">unknown</text><text class="sC" x="440" y="108" text-anchor="middle">anything, narrow first</text>
<rect class="sN" x="550" y="40" width="100" height="34" rx="6"/><text class="sC" x="560" y="62" xml:space="preserve" style="white-space:pre">any</text><text class="sC" x="600" y="108" text-anchor="middle">checking switched off</text>
<rect class="sR" x="500" y="150" width="206" height="40" rx="6" opacity=".85"/><text class="sT" x="603" y="175" text-anchor="middle">any flows into everything</text>
<rect class="sG" x="14" y="150" width="300" height="40" rx="6" opacity=".7"/><text class="sT" x="164" y="175" text-anchor="middle">unknown → check → string: safe</text>
</svg><figcaption>Prefer the narrowest type that fits. For data from outside use <code>unknown</code> and narrow it (a type guard or a schema); <code>any</code> silently disables the compiler for everything it touches.</figcaption></figure>

## F5.7 Generics 🟢 ⭐

Generics let one piece of code work with many types **while keeping the relationship between them**, exactly like C#'s `List<T>`.

```ts
function first<T>(items: T[]): T | undefined { return items[0]; }
const n = first([1, 2, 3]);           // T inferred as number

interface ApiResponse<T> { data: T; page: number; total: number; }
async function getPage<T>(url: string): Promise<ApiResponse<T>> {
  const res = await fetch(url);
  return res.json() as Promise<ApiResponse<T>>;   // an assertion: still needs runtime validation
}
const invoices = await getPage<Invoice>("/api/invoices");

// Constraints: T must have an id
function byId<T extends { id: string }>(items: T[]): Record<string, T> {
  return Object.fromEntries(items.map(i => [i.id, i]));
}

// keyof constraint: K must be a key of T
function pluck<T, K extends keyof T>(items: T[], key: K): T[K][] {
  return items.map(i => i[key]);
}
pluck(invoices.data, "amount");       // number[]
pluck(invoices.data, "amont");        // compile error: typo caught
```

<figure class="dia steps"><svg viewBox="0 0 720 214" role="img" aria-label="How TypeScript checks pluck: T is inferred as Invoice from the array, K as the literal amount, which must be one of the keys id, customer, amount or dueDate; the return type Invoice amount array is number array; the misspelling amont is rejected because it is not a key of Invoice">
<text class="sS" x="14" y="22" xml:space="preserve" style="white-space:pre">function pluck&lt;T, K extends keyof T&gt;(items: T[], key: K): T[K][]</text>
<rect class="sN" x="14" y="34" width="220" height="54" rx="8"/><text class="sT" x="124" y="54" text-anchor="middle">T</text><rect class="sN" x="14" y="98" width="220" height="54" rx="8"/><text class="sT" x="124" y="118" text-anchor="middle">K</text>
<rect class="sN" x="260" y="34" width="446" height="118" rx="8"/><text class="sT" x="483" y="52" text-anchor="middle">keyof Invoice</text>
<rect class="sB" x="272" y="62" width="100" height="26" rx="5" opacity=".55"/><text class="sS" x="282" y="80" xml:space="preserve" style="white-space:pre">"id"</text><text class="sS" x="322" y="104" text-anchor="middle">string</text>
<rect class="sB" x="380" y="62" width="100" height="26" rx="5" opacity=".55"/><text class="sS" x="390" y="80" xml:space="preserve" style="white-space:pre">"customer"</text><text class="sS" x="430" y="104" text-anchor="middle">string</text>
<rect class="sB" x="488" y="62" width="100" height="26" rx="5" opacity=".55"/><text class="sS" x="498" y="80" xml:space="preserve" style="white-space:pre">"amount"</text><text class="sS" x="538" y="104" text-anchor="middle">number</text>
<rect class="sB" x="596" y="62" width="100" height="26" rx="5" opacity=".55"/><text class="sS" x="606" y="80" xml:space="preserve" style="white-space:pre">"dueDate"</text><text class="sS" x="646" y="104" text-anchor="middle">Date</text>
<g data-s="1"><text class="sGt" x="124" y="76" text-anchor="middle">Invoice</text></g>
<g data-s="1-3"><text class="sT" x="14" y="176" xml:space="preserve" style="white-space:pre">pluck(invoices.data, "amount")</text><text class="sS" x="124" y="202" text-anchor="middle">items is Invoice[], so T = Invoice</text></g>
<g data-s="2-3"><text class="sGt" x="124" y="140" text-anchor="middle">"amount"</text><rect class="sG" x="488" y="62" width="100" height="26" rx="5" style="fill:none;stroke-width:2.5"/><text class="sGt" x="483" y="140" text-anchor="middle">K extends keyof T ✓</text></g>
<g data-s="3-3"><rect class="sG" x="260" y="160" width="446" height="40" rx="8" opacity=".35"/><text class="sT" x="272" y="185" xml:space="preserve" style="white-space:pre">T[K][]  =  Invoice["amount"][]  =  number[]</text></g>
<g data-s="4-4"><text class="sT" x="14" y="176" xml:space="preserve" style="white-space:pre">pluck(invoices.data, "amont")</text><text class="sRt" x="124" y="140" text-anchor="middle">"amont"</text><text class="sRt" x="483" y="140" text-anchor="middle">"amont" is not in keyof Invoice</text><rect class="sR" x="260" y="158" width="446" height="52" rx="8" opacity=".35"/><text class="sS" x="270" y="174" xml:space="preserve" style="white-space:pre">tsc TS2345: Argument of type '"amont"'</text><text class="sS" x="270" y="192" xml:space="preserve" style="white-space:pre">is not assignable to parameter of type 'keyof Invoice'.</text></g>
</svg><ol class="dia-steps">
<li>TypeScript infers T from the argument: items is Invoice[], so T = Invoice.</li>
<li>K is inferred as the literal type "amount" and checked against the constraint keyof Invoice, the union of its property names.</li>
<li>The return type T[K][] is computed from the two: Invoice["amount"][] is number[]. Assigning it to string[] would not compile.</li>
<li>A typo fails the constraint at compile time, with the error shown by tsc.</li>
</ol><figcaption>Generic inference and constraints for pluck, step by step (the error is real tsc output).</figcaption></figure>

## F5.8 Utility and type operators 🟢 🟡 ⭐

| Utility | Produces | Typical use |
|---|---|---|
| `Partial<T>` | All properties optional | Update or patch payloads |
| `Required<T>` | All properties required | After defaults have been applied |
| `Readonly<T>` | All properties readonly | State that must not be mutated |
| `Pick<T, "a" \| "b">` | Only those keys | A list-row view model |
| `Omit<T, "id">` | All but those keys | A create DTO without the server-generated id |
| `Record<K, V>` | An object with keys K and values V | Lookups: `Record<Currency, number>` |
| `ReturnType<typeof fn>` | What a function returns | Typing from existing code |
| `Parameters<typeof fn>` | A tuple of its parameters | Wrappers |
| `Awaited<T>` | The value inside a promise | `Awaited<ReturnType<typeof load>>` |
| `NonNullable<T>` | T without null and undefined | After a check |

<figure class="dia"><svg viewBox="0 0 720 208" role="img" aria-label="The Invoice type and what Partial, Pick, Omit and Readonly produce from it">
<text class="sC" x="74" y="22" text-anchor="middle">Invoice</text>
<rect class="sB" x="8" y="32" width="134" height="24" rx="5"/><text class="sM" x="75" y="48" text-anchor="middle">id</text>
<rect class="sB" x="8" y="62" width="134" height="24" rx="5"/><text class="sM" x="75" y="78" text-anchor="middle">customerId</text>
<rect class="sB" x="8" y="92" width="134" height="24" rx="5"/><text class="sM" x="75" y="108" text-anchor="middle">amount</text>
<rect class="sB" x="8" y="122" width="134" height="24" rx="5"/><text class="sM" x="75" y="138" text-anchor="middle">dueDate</text>
<rect class="sB" x="8" y="152" width="134" height="24" rx="5"/><text class="sM" x="75" y="168" text-anchor="middle">notes?</text>
<text class="sC" x="217" y="22" text-anchor="middle">Partial&lt;Invoice&gt;</text>
<rect class="sW" x="151" y="32" width="134" height="24" rx="5"/><text class="sM" x="218" y="48" text-anchor="middle">id?</text>
<rect class="sW" x="151" y="62" width="134" height="24" rx="5"/><text class="sM" x="218" y="78" text-anchor="middle">customerId?</text>
<rect class="sW" x="151" y="92" width="134" height="24" rx="5"/><text class="sM" x="218" y="108" text-anchor="middle">amount?</text>
<rect class="sW" x="151" y="122" width="134" height="24" rx="5"/><text class="sM" x="218" y="138" text-anchor="middle">dueDate?</text>
<rect class="sW" x="151" y="152" width="134" height="24" rx="5"/><text class="sM" x="218" y="168" text-anchor="middle">notes?</text>
<text class="sC" x="360" y="22" text-anchor="middle">Pick&lt;Invoice, …&gt;</text>
<rect class="sA" x="294" y="32" width="134" height="24" rx="5"/><text class="sM" x="361" y="48" text-anchor="middle">amount</text>
<rect class="sA" x="294" y="62" width="134" height="24" rx="5"/><text class="sM" x="361" y="78" text-anchor="middle">dueDate</text>
<text class="sC" x="503" y="22" text-anchor="middle">Omit&lt;Invoice, "id"&gt;</text>
<rect class="sB" x="437" y="32" width="134" height="24" rx="5"/><text class="sM" x="504" y="48" text-anchor="middle">customerId</text>
<rect class="sB" x="437" y="62" width="134" height="24" rx="5"/><text class="sM" x="504" y="78" text-anchor="middle">amount</text>
<rect class="sB" x="437" y="92" width="134" height="24" rx="5"/><text class="sM" x="504" y="108" text-anchor="middle">dueDate</text>
<rect class="sB" x="437" y="122" width="134" height="24" rx="5"/><text class="sM" x="504" y="138" text-anchor="middle">notes?</text>
<text class="sC" x="646" y="22" text-anchor="middle">Readonly&lt;Invoice&gt;</text>
<rect class="sV" x="580" y="32" width="134" height="24" rx="5"/><text class="sM" x="647" y="48" text-anchor="middle">readonly id</text>
<rect class="sV" x="580" y="62" width="134" height="24" rx="5"/><text class="sM" x="647" y="78" text-anchor="middle">readonly customerId</text>
<rect class="sV" x="580" y="92" width="134" height="24" rx="5"/><text class="sM" x="647" y="108" text-anchor="middle">readonly amount</text>
<rect class="sV" x="580" y="122" width="134" height="24" rx="5"/><text class="sM" x="647" y="138" text-anchor="middle">readonly dueDate</text>
<rect class="sV" x="580" y="152" width="134" height="24" rx="5"/><text class="sM" x="647" y="168" text-anchor="middle">readonly notes?</text>
<text class="sS" x="360" y="196" text-anchor="middle">each utility is a mapped type: it walks the keys of Invoice and builds a new shape</text>
</svg><figcaption>The common utility types, as transformations of one type (the Pick here is <code>Pick&lt;Invoice, "amount" | "dueDate"&gt;</code>). None of them changes the runtime object; they only describe it.</figcaption></figure>

```ts
type CreateInvoiceDto = Omit<Invoice, "id">;
type InvoicePatch = Partial<Pick<Invoice, "amount" | "dueDate" | "notes">>;

const RATES = { EGP: 1, USD: 48.5, EUR: 52.7 } as const;   // illustrative values
type Code = keyof typeof RATES;                            // "EGP" | "USD" | "EUR"
```

**`keyof`** gives the union of a type's keys; **`typeof`** (in type position) gets the type of a value; **indexed access** `T["amount"]` gets a property's type.

**Mapped and conditional types** (mid level) build new types from old ones:

```ts
type Nullable<T> = { [K in keyof T]: T[K] | null };            // mapped type
type ElementType<T> = T extends (infer U)[] ? U : T;           // conditional type with infer
```

### `as const`, enums and `satisfies` 🟡

- **Prefer literal unions or `as const` objects to `enum`.** Unions erase completely, and plain objects behave predictably. (Angular code still often uses `enum`, which is fine.)
- **`as` assertions** tell the compiler "trust me"; they can be wrong. Use them sparingly.
- **`satisfies`** checks that a value matches a type **without widening** it:

```ts
const routes = {
  home: "/",
  invoices: "/invoices",
} satisfies Record<string, `/${string}`>;   // checked: every value starts with "/"
routes.invoices;                             // still the literal "/invoices", not a plain string
```

## F5.9 Types at the boundary: runtime validation 🟡 ⭐

An interface can't stop the API returning `amount: "12.50"` (a string) or `null`. Validate once, at the edge, and **derive** the static type from the schema so the two can't drift apart:

```ts
import { z } from "zod";

const InvoiceSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  amount: z.number().nonnegative(),
  dueDate: z.coerce.date(),
  notes: z.string().optional(),
});
type Invoice = z.infer<typeof InvoiceSchema>;     // the static type comes from the schema

async function loadInvoice(id: string): Promise<Invoice> {
  const json: unknown = await (await fetch(`/api/invoices/${id}`)).json();
  return InvoiceSchema.parse(json);               // throws a precise error if the shape is wrong
}
```

<figure class="dia anim"><svg viewBox="0 0 720 192" role="img" aria-label="Animation: runtime validation at the boundary: an API response is unknown JSON until InvoiceSchema.parse checks it; an object with amount 12.5 passes and becomes a typed Invoice used safely everywhere, while an object with amount as the string 12.50 is rejected with a ZodError naming the field">
<rect class="sN" x="14" y="60" width="120" height="50" rx="8"/><text class="sT" x="74" y="83" text-anchor="middle">API response</text><text class="sC" x="74" y="99" text-anchor="middle">unknown JSON</text>
<rect class="sV" x="230" y="60" width="170" height="50" rx="8"/><text class="sT" x="315" y="83" text-anchor="middle">InvoiceSchema.parse</text><text class="sC" x="315" y="99" text-anchor="middle">zod, at the edge</text>
<rect class="sG" x="500" y="20" width="206" height="50" rx="8"/><text class="sT" x="603" y="43" text-anchor="middle">Invoice (typed)</text><text class="sC" x="603" y="59" text-anchor="middle">safe for the whole app</text>
<rect class="sR" x="500" y="104" width="206" height="50" rx="8"/><text class="sT" x="603" y="127" text-anchor="middle">ZodError</text><text class="sC" x="603" y="143" text-anchor="middle">amount: expected number</text>
<line class="sLm" x1="134" y1="85" x2="230" y2="85" marker-end="url(#ahm)"/>
<line class="sLg" x1="400" y1="78" x2="500" y2="45" marker-end="url(#ahg)"/>
<line class="sLr" x1="400" y1="92" x2="500" y2="129" marker-end="url(#ahr)"/>
<circle class="sPg" r="6" opacity="0"><animateMotion dur="7s" repeatCount="indefinite" calcMode="linear" keyPoints="0;0;1;1" keyTimes="0;0.000;0.400;1" path="M134 80 L230 80 L400 78 L500 45"/><animate attributeName="opacity" dur="7s" repeatCount="indefinite" values="0;0;1;1;0;0" keyTimes="0;0.000;0.002;0.400;0.402;1"/></circle><text class="sC" x="182" y="52" text-anchor="middle">{ amount: 12.5 }</text>
<circle class="sPr" r="6" opacity="0"><animateMotion dur="7s" repeatCount="indefinite" calcMode="linear" keyPoints="0;0;1;1" keyTimes="0;0.500;0.900;1" path="M134 90 L230 90 L400 92 L500 129"/><animate attributeName="opacity" dur="7s" repeatCount="indefinite" values="0;0;1;1;0;0" keyTimes="0;0.498;0.502;0.900;0.902;1"/></circle><text class="sC" x="182" y="132" text-anchor="middle">{ amount: "12.50" }</text>
<text class="sS" x="360" y="182" text-anchor="middle">type Invoice = z.infer&lt;typeof InvoiceSchema&gt;: one definition gives the check and the type</text>
</svg><figcaption>TypeScript types disappear at runtime; the schema does not. Parse once where data enters, and everything inside can trust the type.</figcaption></figure>

Alternatives include Valibot, ArkType, and **generating** types from the backend's OpenAPI document (`openapi-typescript`, NSwag, Orval), so frontend and backend can't drift apart ([[FS1]]).

> [!story]
> Your course platform and `aiforme` are TypeScript React apps, and FinSight's Angular front end consumed a .NET API. A strong answer to "how did you keep the frontend in sync with the API?" is "the DTOs live in one place and the client types are generated from the OpenAPI spec", or, if you didn't do that, "next time I would, because…".

## F5.10 The compiler settings that matter 🟢 🟡

```json
{
  "compilerOptions": {
    "strict": true,                      // turns on the whole strict family below
    "noUncheckedIndexedAccess": true,    // arr[i] is T | undefined: catches off-by-one bugs
    "exactOptionalPropertyTypes": true,  // optional ≠ "can be explicitly undefined"
    "noImplicitOverride": true,
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "verbatimModuleSyntax": true,
    "skipLibCheck": true
  }
}
```

`strict` includes **`strictNullChecks`** (null and undefined must be handled explicitly; this alone prevents a whole class of crashes), **`noImplicitAny`**, `strictFunctionTypes` and `useUnknownInCatchVariables`. New projects should always have it on. Angular CLI projects enable strict mode by default.

> [!mistake] Silencing the compiler
> `// @ts-ignore`, `as any` and the non-null assertion `value!` hide real bugs. When you must, use `// @ts-expect-error` with a comment explaining why; it fails once the error is fixed, so it doesn't linger.

<figure class="dia steps"><svg viewBox="0 0 720 180" role="img" aria-label="Reading past the end of an array, run for real: with only strict on, tsc compiles the code and node then throws TypeError cannot read properties of undefined reading toFixed; with noUncheckedIndexedAccess, tsc reports error TS2322 that number or undefined is not assignable to number">
<rect class="sN" x="14" y="20" width="692" height="62" rx="8"/><text class="sC" x="26" y="42" xml:space="preserve" style="white-space:pre">const amounts: number[] = [120, 95];</text><text class="sC" x="26" y="60" xml:space="preserve" style="white-space:pre">const third: number = amounts[2];</text><text class="sC" x="26" y="76" xml:space="preserve" style="white-space:pre">console.log(third.toFixed(2));</text>
<g data-s="1-1"><rect class="sR" x="14" y="96" width="692" height="74" rx="8" opacity=".85"/><text class="sT" x="30" y="118">tsc --strict: compiles with 0 errors</text><text class="sS" x="30" y="140">then at runtime:</text><text class="sC" x="30" y="160" xml:space="preserve" style="white-space:pre">TypeError: Cannot read properties of undefined (reading 'toFixed')</text></g>
<g data-s="2-2"><rect class="sG" x="14" y="96" width="692" height="74" rx="8" opacity=".8"/><text class="sT" x="30" y="118">tsc --strict --noUncheckedIndexedAccess: caught before it ships</text><text class="sC" x="30" y="142" xml:space="preserve" style="white-space:pre">a.ts(2,7): error TS2322: Type 'number | undefined' is not</text><text class="sC" x="30" y="160" xml:space="preserve" style="white-space:pre">assignable to type 'number'.</text></g>
</svg><ol class="dia-steps">
<li>strict alone trusts amounts[2] to be a number, and the program crashes.</li>
<li>noUncheckedIndexedAccess makes every index read possibly undefined, so the compiler forces the check.</li>
</ol><figcaption>Both outputs are real: TypeScript 5 with and without the flag, then Node running the compiled file. This is the flag that pays for itself fastest.</figcaption></figure>

## F5.11 TypeScript with your frameworks 🟢

```ts
// Angular: typed inputs with signals
export class InvoiceCard {
  invoice = input.required<Invoice>();
  selected = output<string>();             // emits the invoice id
}
```

```tsx
// React: typed props and state
type Props = { invoice: Invoice; onSelect: (id: string) => void };
export function InvoiceCard({ invoice, onSelect }: Props) {
  const [open, setOpen] = useState(false);          // inferred boolean
  const [items, setItems] = useState<Invoice[]>([]); // annotate when the initial value is empty
  return <button onClick={() => onSelect(invoice.id)}>{invoice.customerId}</button>;
}
```

> [!lab] Type a real API in an evening
> Take one FinSight endpoint, such as invoices or the dashboard summary. Write a Zod schema for its response, derive the type, and model the screen's state as a discriminated union (`idle`/`loading`/`success`/`error`) with an exhaustive `switch`. Turn on `noUncheckedIndexedAccess` and fix what it finds.

<figure class="dia anim"><svg viewBox="0 0 720 190" role="img" aria-label="Animation: A typed component boundary: the parent passes invoice of type Invoice into InvoiceCard and receives onSelect with a string id back; the Props type checks both directions at compile time, as Angular’s typed input and output signals do">
<rect class="sA" x="14" y="50" width="200" height="70" rx="8"/><text class="sT" x="114" y="83" text-anchor="middle">Parent</text><text class="sC" x="114" y="99" text-anchor="middle">&lt;InvoiceCard invoice={inv}</text>
<text class="sC" x="114" y="140" text-anchor="middle">onSelect={id =&gt; …} /&gt;</text>
<rect class="sB" x="506" y="50" width="200" height="70" rx="8"/><text class="sT" x="606" y="83" text-anchor="middle">InvoiceCard</text><text class="sC" x="606" y="99" text-anchor="middle">type Props = { … }</text>
<line class="sLg" x1="214" y1="70" x2="504" y2="70" marker-end="url(#ahg)"/>
<text class="sGt" x="360" y="62" text-anchor="middle">invoice: Invoice (checked at compile time)</text>
<line class="sLw" x1="504" y1="102" x2="216" y2="102" marker-end="url(#ahw)"/>
<text class="sWt" x="360" y="120" text-anchor="middle">onSelect(id: string): the callback type flows back</text>
<text class="sS" x="360" y="160" text-anchor="middle">Angular: input.required&lt;Invoice&gt;() in, output&lt;string&gt;() out: the same contract</text>
<text class="sGt" x="360" y="180" text-anchor="middle">misspell a prop or pass the wrong type and the build fails, not the user</text>
<circle class="sPg" r="5" opacity="0"><animateMotion dur="7s" repeatCount="indefinite" calcMode="linear" keyPoints="0;0;1;1" keyTimes="0;0.000;0.350;1" path="M214 70 L504 70"/><animate attributeName="opacity" dur="7s" repeatCount="indefinite" values="0;0;1;1;0;0" keyTimes="0;0.000;0.002;0.350;0.352;1"/></circle>
<circle class="sPw" r="5" opacity="0"><animateMotion dur="7s" repeatCount="indefinite" calcMode="linear" keyPoints="0;0;1;1" keyTimes="0;0.450;0.800;1" path="M504 102 L216 102"/><animate attributeName="opacity" dur="7s" repeatCount="indefinite" values="0;0;1;1;0;0" keyTimes="0;0.448;0.452;0.800;0.802;1"/></circle>
</svg><figcaption>Component props are an API between two pieces of UI. Typing them turns integration mistakes into compile errors.</figcaption></figure>

## F5.12 Interview drill 🟢 ⭐

| Question | Strong short answer |
|---|---|
| Does TypeScript check types at runtime? | No. Types are erased at compile time; validate external data with a schema library. |
| interface vs type? | Both describe shapes; interfaces extend and merge, type aliases can express unions, tuples and computed types. |
| any vs unknown? | any disables checking; unknown accepts anything but requires narrowing before use. |
| What is never for? | Impossible values: exhaustive checks and functions that never return. |
| What are generics? | Type parameters that let code work with many types while preserving the relationships between them. |
| What does Partial / Pick / Omit / Record do? | Make all properties optional / keep some keys / drop some keys / build an object type from key and value types. |
| What is a discriminated union? | A union whose members share a literal tag; checking the tag narrows to one member and enables exhaustive switches. |
| What is structural typing? | Compatibility is decided by shape, not by declared names. |
| What is narrowing? | Refining a union to one member through checks like typeof, instanceof, in or a tag comparison. |
| What does strictNullChecks do? | Makes null and undefined separate types you must handle explicitly. |
| `as` vs `satisfies`? | `as` asserts a type without checking it; `satisfies` checks against a type while keeping the value's precise inferred type. |
| What changed in TypeScript 7? | The compiler was ported to native Go code: the same language, builds roughly 8–12× faster. |
| keyof and typeof in types? | keyof gives a union of a type's keys; typeof gets the type of a value. |

## Key takeaways

> [!check]
> - Types vanish at runtime: validate at the boundary and derive types from schemas.
> - `unknown` instead of `any`; strict mode always on.
> - Model state with discriminated unions so impossible states can't be written.
> - Generics preserve relationships; utility types derive variants without duplication.
> - TypeScript is structural; C# is nominal. Know the difference.

## Sources

- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html): Everyday Types, Narrowing, Generics, Utility Types, Type Manipulation.
- [TSConfig reference](https://www.typescriptlang.org/tsconfig/) (strict, noUncheckedIndexedAccess, exactOptionalPropertyTypes).
- TypeScript team blog: [Announcing TypeScript 7.0](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/) (July 2026); [Announcing TypeScript 4.9 (`satisfies`)](https://devblogs.microsoft.com/typescript/announcing-typescript-4-9/).
- Node.js docs: [Running TypeScript natively](https://nodejs.org/en/learn/typescript/run-natively).
- [Zod documentation](https://zod.dev/).
- Angular: [Signal inputs](https://angular.dev/guide/components/inputs). React: [Using TypeScript](https://react.dev/learn/typescript).
