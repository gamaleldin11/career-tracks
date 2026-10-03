# TypeScript — Types That Catch Bugs Before Users Do

Angular is written in TypeScript, almost every serious React codebase uses it, and Node backends increasingly do. Interviews check that you use the type system to **model the domain** rather than sprinkling `any` to make errors go away. As a C# developer you have a head start: generics, interfaces and access modifiers feel familiar. The differences, **structural typing** and **types that vanish at runtime**, are exactly what interviewers probe.

> [!focus]
> **Entry must:** annotate functions and objects; interfaces vs type aliases; union types and narrowing; `any` vs `unknown`; basic generics; the common utility types; strict mode.
> **Mid adds:** discriminated unions for state, `keyof`/`typeof`/indexed access, mapped and conditional types, `satisfies`, typing API responses with runtime validation, and how the new Go-based compiler (TypeScript 7) changes tooling.
> **Most asked:** *interface vs type?* · *any vs unknown vs never?* · *What are generics?* · *Explain Partial, Pick, Omit and Record* · *What is a discriminated union?* · *Does TypeScript check types at runtime?* · *What is structural typing?*
> **Time budget:** 3 hours, with the [TypeScript Playground](https://www.typescriptlang.org/play) open.

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
