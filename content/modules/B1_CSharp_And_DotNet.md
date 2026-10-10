# C# and the .NET Runtime — Types, LINQ, async/await, Memory and DI

.NET backend interviews in Egypt open with C# fundamentals more reliably than anything else: value vs reference types, `IEnumerable` vs `IQueryable`, async/await, DI lifetimes, garbage collection. You've used C# for years (ITI's 60 projects, FinSight, a Roslyn-based interpreter in CS Visualizer), so the goal here is precise vocabulary and the "why" behind each answer.

> [!focus]
> **Entry must:** value vs reference types; classes, interfaces, abstract classes, records; properties and access modifiers; generics; LINQ basics and deferred execution; async/await and Task; exceptions; `using` and `IDisposable`; DI lifetimes.
> **Mid adds:** IEnumerable vs IQueryable in depth, async pitfalls (deadlocks, `async void`, cancellation), GC generations and the large object heap, `Span<T>`, equality and hashing, captive dependencies, what's new in C# 12–14.
> **Most asked:** *Value vs reference type?* · *struct vs class vs record?* · *Abstract class vs interface?* · *IEnumerable vs IQueryable?* · *How does async/await work?* · *Task vs Thread?* · *Singleton vs scoped vs transient?* · *How does the GC work?* · *`throw` vs `throw ex`?*
> **Time budget:** 4 hours, with a console app open (`dotnet new console`).

## B1.0 Foundations: what "managed code" means 🟢

C# runs on a **managed runtime**, the CLR. "Managed" means the runtime, not your code, takes care of four things that C and C++ programmers do by hand:

| The runtime handles | So you get |
|---|---|
| **Memory** | You allocate with `new`; the garbage collector frees. No dangling pointers, no double frees |
| **Type safety** | Every object knows its type; a bad cast throws `InvalidCastException`, an out-of-range index throws, instead of silently corrupting memory |
| **Errors** | Failures travel as exception objects with stack traces |
| **Compilation** | The same `.dll` runs on Windows, Linux and macOS, on x64 or ARM, compiled to machine code on the target ([[B1.1]]) |

**Inside the process.** Your API is one operating-system process. It holds the **managed heap** (objects), a **stack per thread** (method frames and locals), and the **thread pool**: a small set of reusable worker threads that run requests, timer callbacks and async continuations. ASP.NET Core never creates a thread per request; it hands each request to the pool.

<figure class="dia anim"><svg viewBox="0 0 720 236" role="img" aria-label="Animation: inside one .NET process, work items wait in a queue and are picked up by a small set of reusable thread-pool threads; objects live on the managed heap">
<rect class="sN" x="10" y="14" width="700" height="212" rx="12"/><text class="sC" x="24" y="34">one .NET process (your API)</text>
<rect class="sV" x="30" y="46" width="160" height="160" rx="10"/><text class="sT" x="110" y="68" text-anchor="middle">managed heap</text><text class="sC" x="110" y="86" text-anchor="middle">objects, collected</text><text class="sC" x="110" y="102" text-anchor="middle">by the GC</text>
<rect class="sB" x="48" y="118" width="36" height="28" rx="4"/>
<rect class="sB" x="94" y="118" width="36" height="28" rx="4"/>
<rect class="sB" x="140" y="118" width="36" height="28" rx="4"/>
<rect class="sB" x="48" y="158" width="36" height="28" rx="4"/>
<rect class="sB" x="94" y="158" width="36" height="28" rx="4"/>
<rect class="sW" x="220" y="70" width="150" height="110" rx="10"/><text class="sT" x="295" y="92" text-anchor="middle">work queue</text><text class="sC" x="295" y="110" text-anchor="middle">requests, timers,</text><text class="sC" x="295" y="126" text-anchor="middle">continuations</text>
<rect class="sA" x="450" y="50" width="240" height="32" rx="8"/><text class="sC" x="470" y="71">pool thread 1</text><text class="sC" x="682" y="71" text-anchor="end">own stack</text>
<rect class="sA" x="450" y="92" width="240" height="32" rx="8"/><text class="sC" x="470" y="113">pool thread 2</text><text class="sC" x="682" y="113" text-anchor="end">own stack</text>
<rect class="sA" x="450" y="134" width="240" height="32" rx="8"/><text class="sC" x="470" y="155">pool thread 3</text><text class="sC" x="682" y="155" text-anchor="end">own stack</text>
<rect class="sA" x="450" y="176" width="240" height="32" rx="8"/><text class="sC" x="470" y="197">pool thread 4</text><text class="sC" x="682" y="197" text-anchor="end">own stack</text>
<circle class="sPw" r="6" opacity="0"><animateMotion dur="8.0s" repeatCount="indefinite" calcMode="linear" path="M300 140 L450 66 H600" keyPoints="0;0;0.55;1;1" keyTimes="0;0.0375;0.0875;0.2125;1"/><animate attributeName="opacity" dur="8.0s" repeatCount="indefinite" calcMode="discrete" values="0;1;0" keyTimes="0;0.0375;0.2188"/></circle>
<circle class="sPw" r="6" opacity="0"><animateMotion dur="8.0s" repeatCount="indefinite" calcMode="linear" path="M300 140 L450 108 H600" keyPoints="0;0;0.55;1;1" keyTimes="0;0.1437;0.1937;0.3187;1"/><animate attributeName="opacity" dur="8.0s" repeatCount="indefinite" calcMode="discrete" values="0;1;0" keyTimes="0;0.1437;0.3250"/></circle>
<circle class="sPw" r="6" opacity="0"><animateMotion dur="8.0s" repeatCount="indefinite" calcMode="linear" path="M300 140 L450 150 H600" keyPoints="0;0;0.55;1;1" keyTimes="0;0.2500;0.3000;0.4250;1"/><animate attributeName="opacity" dur="8.0s" repeatCount="indefinite" calcMode="discrete" values="0;1;0" keyTimes="0;0.2500;0.4313"/></circle>
<circle class="sPw" r="6" opacity="0"><animateMotion dur="8.0s" repeatCount="indefinite" calcMode="linear" path="M300 140 L450 192 H600" keyPoints="0;0;0.55;1;1" keyTimes="0;0.3562;0.4062;0.5312;1"/><animate attributeName="opacity" dur="8.0s" repeatCount="indefinite" calcMode="discrete" values="0;1;0" keyTimes="0;0.3562;0.5375"/></circle>
<circle class="sPw" r="6" opacity="0"><animateMotion dur="8.0s" repeatCount="indefinite" calcMode="linear" path="M300 140 L450 66 H600" keyPoints="0;0;0.55;1;1" keyTimes="0;0.4625;0.5125;0.6375;1"/><animate attributeName="opacity" dur="8.0s" repeatCount="indefinite" calcMode="discrete" values="0;1;0" keyTimes="0;0.4625;0.6437"/></circle>
<circle class="sPw" r="6" opacity="0"><animateMotion dur="8.0s" repeatCount="indefinite" calcMode="linear" path="M300 140 L450 108 H600" keyPoints="0;0;0.55;1;1" keyTimes="0;0.5687;0.6188;0.7437;1"/><animate attributeName="opacity" dur="8.0s" repeatCount="indefinite" calcMode="discrete" values="0;1;0" keyTimes="0;0.5687;0.7500"/></circle>
<circle class="sPw" r="6" opacity="0"><animateMotion dur="8.0s" repeatCount="indefinite" calcMode="linear" path="M300 140 L450 150 H600" keyPoints="0;0;0.55;1;1" keyTimes="0;0.6750;0.7250;0.8500;1"/><animate attributeName="opacity" dur="8.0s" repeatCount="indefinite" calcMode="discrete" values="0;1;0" keyTimes="0;0.6750;0.8562"/></circle>
<circle class="sPw" r="6" opacity="0"><animateMotion dur="8.0s" repeatCount="indefinite" calcMode="linear" path="M300 140 L450 192 H600" keyPoints="0;0;0.55;1;1" keyTimes="0;0.7812;0.8313;0.9563;1"/><animate attributeName="opacity" dur="8.0s" repeatCount="indefinite" calcMode="discrete" values="0;1;0" keyTimes="0;0.7812;0.9625"/></circle>
<text class="sC" x="530" y="222" text-anchor="middle">threads are reused, never created per request</text>
</svg><figcaption>The thread pool. A handful of threads run thousands of requests by taking the next work item whenever they are free; blocking one of them takes it out of service.</figcaption></figure>

That picture explains two later topics. **Async** ([[B1.7]]) exists so that a thread waiting on a database gives itself back to the pool. And **thread-pool starvation**, where requests queue up while the CPU sits idle, is what happens when code blocks pool threads with `.Result`, `.Wait()` or `Thread.Sleep`.

## B1.1 The .NET platform 🟢 ⭐

- You write C#; the compiler (**Roslyn**) produces **IL** (intermediate language) inside an assembly (`.dll`).
- At runtime the **CLR** (common language runtime) loads it, and the **JIT** compiler turns IL into machine code as methods are first called. **Tiered compilation** compiles quickly first, then recompiles hot methods with full optimisation.
- **Native AOT** compiles ahead of time into a self-contained native executable: fast start-up and small memory, at the cost of some dynamic features (reflection-heavy code). It suits containers, functions and CLI tools.
- The **base class library** (BCL) provides collections, I/O, networking, JSON (`System.Text.Json`) and more.

<figure class="dia"><svg viewBox="0 0 720 184" role="img" aria-label="C# compiles to IL in a .dll; at run time the CLR's JIT compiles it to machine code in tiers; Native AOT compiles to a native executable ahead of time">
<rect class="sB" x="10" y="30" width="110" height="50" rx="8"/><text class="sT" x="65" y="53" text-anchor="middle">Program.cs</text><text class="sC" x="65" y="69" text-anchor="middle">C# source</text><line class="sLm" x1="120" y1="55" x2="146" y2="55" marker-end="url(#ahm)"/>
<rect class="sA" x="150" y="30" width="110" height="50" rx="8"/><text class="sT" x="205" y="53" text-anchor="middle">Roslyn</text><text class="sC" x="205" y="69" text-anchor="middle">compiler</text><line class="sLm" x1="260" y1="55" x2="286" y2="55" marker-end="url(#ahm)"/>
<rect class="sV" x="290" y="30" width="120" height="50" rx="8"/><text class="sT" x="350" y="53" text-anchor="middle">App.dll</text><text class="sC" x="350" y="69" text-anchor="middle">IL + metadata</text><line class="sLm" x1="410" y1="55" x2="436" y2="55" marker-end="url(#ahm)"/>
<rect class="sW" x="440" y="30" width="120" height="50" rx="8"/><text class="sT" x="500" y="53" text-anchor="middle">CLR + JIT</text><text class="sC" x="500" y="69" text-anchor="middle">at run time</text><line class="sLm" x1="560" y1="55" x2="586" y2="55" marker-end="url(#ahm)"/>
<rect class="sG" x="590" y="30" width="120" height="50" rx="8"/><text class="sT" x="650" y="53" text-anchor="middle">machine code</text><text class="sC" x="650" y="69" text-anchor="middle">tier 0 → tier 1</text>
<text class="sC" x="706" y="104" text-anchor="end">hot methods are recompiled, fully optimised</text>
<path class="sLv" d="M350 80 C350 150 520 150 590 150" stroke-dasharray="5 4" marker-end="url(#ahv)"/><rect class="sV" x="594" y="128" width="116" height="44" rx="8"/><text class="sT" x="652" y="148" text-anchor="middle">native exe</text><text class="sC" x="652" y="164" text-anchor="middle">Native AOT</text>
<text class="sC" x="420" y="168" text-anchor="middle">or compile everything ahead of time</text>
</svg><figcaption>From source to machine code. JIT gives portability and runtime optimisation; Native AOT trades some dynamism for instant start-up.</figcaption></figure>

**Releases:** a new major version every November. Even-numbered releases are **LTS** (three years of support); odd-numbered are **STS**, now supported for **24 months**. **.NET 10** (November 2025) is the current LTS, supported until **November 2028**, and it shipped with **C# 14**. .NET 8 and .NET 9 both reach end of support on **10 November 2026**, so many teams are migrating to .NET 10 right now. That's a good topic to show you're current.

## B1.2 Value types and reference types 🟢 ⭐

| | Value types | Reference types |
|---|---|---|
| Examples | `int`, `double`, `decimal`, `bool`, `DateTime`, `Guid`, enums, **`struct`**, `record struct` | **`class`**, `record` (class), `string`, arrays, delegates, `object` |
| Variable holds | The **data itself** | A **reference** to an object on the managed heap |
| Assignment copies | The whole value | The reference (both variables see the same object) |
| Default | Zeroed value (`0`, `false`) | `null` |
| Equality by default | Field-by-field (for structs, via reflection unless overridden) | **Reference identity** (records and `string` override this) |

> [!mistake] "Value types live on the stack"
> It's a useful simplification but not the rule. A value type lives **wherever its container is**: a local `int` is usually on the stack, but an `int` field inside a class object is on the heap with that object, and a boxed `int` is on the heap. The real difference is **copy semantics**.

<figure class="dia"><svg viewBox="0 0 720 234" role="img" aria-label="Structs are copied into each variable; class variables hold references to one shared heap object; boxing copies a value into a new heap object">
<text class="sT" x="150" y="22" text-anchor="middle">stack frame</text><text class="sT" x="500" y="22" text-anchor="middle">managed heap</text>
<rect class="sB" x="20" y="32" width="260" height="190" rx="10"/>
<text class="sC" x="28" y="56" xml:space="preserve" style="white-space:pre">Money m1 = new(900, "EGP")</text><rect class="sA" x="186" y="60" width="86" height="14" rx="3"/><text class="sC" x="229" y="71" text-anchor="middle">900 EGP</text>
<text class="sC" x="28" y="92" xml:space="preserve" style="white-space:pre">Money m2 = m1   (a copy)</text><rect class="sA" x="186" y="96" width="86" height="14" rx="3"/><text class="sC" x="229" y="107" text-anchor="middle">900 EGP</text>
<text class="sC" x="28" y="128" xml:space="preserve" style="white-space:pre">Invoice a = new(…)</text><rect class="sV" x="186" y="132" width="86" height="14" rx="3"/><text class="sC" x="229" y="143" text-anchor="middle">ref</text>
<text class="sC" x="28" y="164" xml:space="preserve" style="white-space:pre">Invoice b = a</text><rect class="sV" x="186" y="168" width="86" height="14" rx="3"/><text class="sC" x="229" y="179" text-anchor="middle">ref</text>
<text class="sC" x="28" y="200" xml:space="preserve" style="white-space:pre">object o = 42   (boxing)</text><rect class="sV" x="186" y="204" width="86" height="14" rx="3"/><text class="sC" x="229" y="215" text-anchor="middle">ref</text>
<rect class="sG" x="390" y="50" width="220" height="60" rx="10"/><text class="sT" x="500" y="74" text-anchor="middle">Invoice object</text><text class="sC" x="500" y="94" text-anchor="middle">Customer · Amount</text>
<rect class="sW" x="430" y="150" width="140" height="46" rx="10"/><text class="sT" x="500" y="170" text-anchor="middle">boxed int</text><text class="sM" x="500" y="186" text-anchor="middle">42</text>
<path class="sL" d="M272 121 C330 121 340 90 386 84" marker-end="url(#ah)"/><path class="sL" d="M272 157 C340 157 350 100 386 92" marker-end="url(#ah)"/><path class="sLw" d="M272 193 C340 193 380 175 426 173" marker-end="url(#ahw)"/>
<text class="sC" x="500" y="222" text-anchor="middle">two variables, one object</text>
</svg><figcaption>Copy semantics, drawn. A struct assignment copies the data; a class assignment copies the reference; boxing allocates a heap copy of a value.</figcaption></figure>

> [!term] Boxing
> Converting a value type to `object` (or an interface it implements) by copying it into a new heap object; **unboxing** copies it back. It allocates and is slow in hot loops, which is why generic collections (`List<int>`) replaced `ArrayList`.

**`string`** is a reference type that **behaves like a value**: it's **immutable** and compares by content. Every "modification" creates a new string, so building a large string in a loop should use `StringBuilder`.

**Nullable reference types** (enabled by default in new projects): `string` means "never null" and `string?` means "might be null", and the compiler warns when you might dereference a null. It's a compile-time check only.

> [!say]
> "A value type holds its data directly and is copied on assignment; a reference type holds a reference to a heap object, so assignments share the same object. Where it's stored depends on the container. A value-type field of a class lives on the heap. The practical difference is copy semantics and equality."

## B1.3 Classes, structs, records 🟢 ⭐

```csharp
public class Invoice                     // reference type, identity semantics, mutable
{
    public Guid Id { get; init; } = Guid.NewGuid();   // init: settable only during construction
    public required string Customer { get; set; }       // required (C# 11): must be set by the caller
    public decimal Amount { get; private set; }
    public void ApplyDiscount(decimal pct) => Amount -= Amount * pct;
}

public readonly record struct Money(decimal Amount, string Currency);   // small immutable value

public record InvoiceDto(Guid Id, string Customer, decimal Amount);     // immutable data carrier
var a = new InvoiceDto(id, "Nile Foods", 900);
var b = a with { Amount = 950 };        // non-destructive copy
Console.WriteLine(a == b);              // false: records compare by VALUE
```

<figure class="dia steps"><svg viewBox="0 0 720 284" role="img" aria-label="Memory and equality for C# classes, records and structs: two Invoice class instances with the same data are not equal while a copied reference is; two InvoiceDto records with the same data are equal though they are separate objects; a with-expression creates a new record and leaves the original unchanged; two Money record structs are stored inline and compare equal">
<text class="sS" x="119" y="22" text-anchor="middle">stack (variables)</text><text class="sS" x="368" y="22" text-anchor="middle">heap (objects)</text><text class="sS" x="615" y="22" text-anchor="middle">run with dotnet</text>
<g data-s="1"><rect class="sN" x="14" y="32" width="210" height="24" rx="5"/><text class="sT" x="24" y="49" xml:space="preserve" style="white-space:pre">c1</text><circle class="sP" cx="200" cy="44" r="3.5"/><rect class="sN" x="14" y="60" width="210" height="24" rx="5"/><text class="sT" x="24" y="77" xml:space="preserve" style="white-space:pre">c2</text><circle class="sP" cx="200" cy="72" r="3.5"/><rect class="sN" x="14" y="88" width="210" height="24" rx="5"/><text class="sT" x="24" y="105" xml:space="preserve" style="white-space:pre">c3</text><circle class="sP" cx="200" cy="100" r="3.5"/><rect class="sB" x="276" y="36" width="184" height="28" rx="6"/><text class="sT" x="368" y="55" text-anchor="middle">Invoice { Nile Foods }</text><rect class="sB" x="276" y="80" width="184" height="28" rx="6"/><text class="sT" x="368" y="99" text-anchor="middle">Invoice { Nile Foods }</text><line class="sLm" x1="204" y1="44" x2="272" y2="50" marker-end="url(#ahm)"/><line class="sLm" x1="204" y1="100" x2="272" y2="54" marker-end="url(#ahm)"/><line class="sLm" x1="204" y1="72" x2="272" y2="94" marker-end="url(#ahm)"/><text class="sS" x="524" y="49" xml:space="preserve" style="white-space:pre">c1 == c2</text><text class="sRt" x="700" y="49" text-anchor="end">False</text><text class="sS" x="524" y="105" xml:space="preserve" style="white-space:pre">c1 == c3</text><text class="sGt" x="700" y="105" text-anchor="end">True</text></g>
<g data-s="2"><rect class="sN" x="14" y="128" width="210" height="24" rx="5"/><text class="sT" x="24" y="145" xml:space="preserve" style="white-space:pre">r1</text><circle class="sP" cx="200" cy="140" r="3.5"/><rect class="sN" x="14" y="156" width="210" height="24" rx="5"/><text class="sT" x="24" y="173" xml:space="preserve" style="white-space:pre">r2</text><circle class="sP" cx="200" cy="168" r="3.5"/><rect class="sV" x="276" y="126" width="184" height="28" rx="6"/><text class="sT" x="368" y="145" text-anchor="middle">InvoiceDto(…, 900)</text><rect class="sV" x="276" y="162" width="184" height="28" rx="6"/><text class="sT" x="368" y="181" text-anchor="middle">InvoiceDto(…, 900)</text><line class="sLm" x1="204" y1="140" x2="272" y2="140" marker-end="url(#ahm)"/><line class="sLm" x1="204" y1="168" x2="272" y2="176" marker-end="url(#ahm)"/><text class="sS" x="524" y="145" xml:space="preserve" style="white-space:pre">r1 == r2</text><text class="sGt" x="700" y="145" text-anchor="end">True</text><text class="sS" x="524" y="173" xml:space="preserve" style="white-space:pre">ReferenceEquals</text><text class="sRt" x="700" y="173" text-anchor="end">False</text></g>
<g data-s="3"><rect class="sN" x="14" y="184" width="210" height="24" rx="5"/><text class="sT" x="24" y="201" xml:space="preserve" style="white-space:pre">r3</text><circle class="sP" cx="200" cy="196" r="3.5"/><rect class="sV" x="276" y="198" width="184" height="28" rx="6"/><text class="sT" x="368" y="217" text-anchor="middle">InvoiceDto(…, 950)</text><line class="sLm" x1="204" y1="196" x2="272" y2="212" marker-end="url(#ahm)"/><path class="sLv" d="M 460 140 C 488 140 488 212 464 212" marker-end="url(#ahv)" style="fill:none" stroke-dasharray="4 3"/><text class="sS" x="490" y="180">with</text><text class="sS" x="524" y="201" xml:space="preserve" style="white-space:pre">r1 == r3</text><text class="sRt" x="700" y="201" text-anchor="end">False</text><text class="sS" x="524" y="221" xml:space="preserve" style="white-space:pre">r1.Amount</text><text class="sGt" x="700" y="221" text-anchor="end">900</text></g>
<g data-s="4"><rect class="sA" x="14" y="224" width="210" height="24" rx="5"/><text class="sT" x="24" y="241" xml:space="preserve" style="white-space:pre">m1</text><text class="sS" x="150" y="241" text-anchor="middle">Money(900, EGP)</text><rect class="sA" x="14" y="252" width="210" height="24" rx="5"/><text class="sT" x="24" y="269" xml:space="preserve" style="white-space:pre">m2</text><text class="sS" x="150" y="269" text-anchor="middle">Money(900, EGP)</text><text class="sS" x="368" y="254" text-anchor="middle">structs live inline: m2 = m1 copies</text><text class="sS" x="368" y="270" text-anchor="middle">the value, no heap object at all</text><text class="sS" x="524" y="269" xml:space="preserve" style="white-space:pre">m1 == m2</text><text class="sGt" x="700" y="269" text-anchor="end">True</text></g>
</svg><ol class="dia-steps">
<li>Classes: two objects with identical data are still two identities, so c1 == c2 is False. c3 = c1 copies the reference, so c1 == c3 is True.</li>
<li>Records are reference types too (two heap objects), but the compiler generates value equality: same data, r1 == r2 is True.</li>
<li>with creates a new object with one property changed. r1 is untouched, which is why records suit DTOs and messages.</li>
<li>A struct is stored inline. Assigning copies the whole value, and a record struct also compares by value.</li>
</ol><figcaption>Identity versus value equality, from running the code above with dotnet: what each variable holds and what == returns.</figcaption></figure>

| | `class` | `struct` | `record` (class) |
|---|---|---|---|
| Kind | Reference | Value | Reference |
| Equality | Reference | Value (fields) | **Value** (compiler-generated) |
| Mutability | Usually mutable | Prefer `readonly struct` | Positional records are immutable (`init`) |
| Inheritance | Yes | No | Yes (records from records) |
| Good for | Entities with identity and behaviour | Small, short-lived values (≤ ~16 bytes): coordinates, money | DTOs, messages, value objects, query results |

> [!say]
> "I use classes for entities with identity and behaviour, records for DTOs and value objects because they're immutable with value equality and the with-expression, and structs only for small, immutable values where avoiding allocations matters."

## B1.4 Abstraction: interfaces and abstract classes 🟢 ⭐

| | Interface | Abstract class |
|---|---|---|
| Represents | A **capability** or contract ("can be saved") | A **base** with shared state and behaviour ("is a kind of payment") |
| Multiple? | A class can implement **many** | A class can inherit **one** |
| State (fields) | No instance fields | Yes |
| Constructors | No | Yes |
| Implementation | Signatures, plus default interface methods (C# 8+) | Abstract and concrete members |
| Typical use | Seams for DI and testing: `IInvoiceRepository`, `IClock` | Template method: shared algorithm with overridable steps |

**Access modifiers:** `public`, `private` (default for members), `protected` (derived classes), `internal` (same assembly, default for top-level types), `protected internal`, `private protected`, and `file` (C# 11: visible only in this file).

Other keywords to know: `static` (belongs to the type, not an instance), `sealed` (can't be inherited, which also allows some JIT optimisations), `virtual`/`override` (polymorphism), `new` (hides a base member, usually a smell), `partial` (a type split across files, used by source generators).

## B1.5 Generics, delegates and lambdas 🟢

```csharp
public interface IRepository<T> where T : class, IEntity    // constraint
{
    Task<T?> GetAsync(Guid id, CancellationToken ct = default);
    Task AddAsync(T entity, CancellationToken ct = default);
}

Func<decimal, decimal> addVat = x => x * 1.14m;      // takes decimal, returns decimal
Action<string> log = msg => Console.WriteLine(msg);  // returns nothing
Predicate<Invoice> overdue = i => i.DueDate < DateTime.UtcNow;
```

- **Generics** keep type safety and avoid boxing; constraints (`where T : class, new()`, `where T : IComparable<T>`) say what `T` must support.
- **Variance** (mid level): `IEnumerable<out T>` is **covariant**, so an `IEnumerable<string>` can be used as an `IEnumerable<object>`; `Action<in T>` is **contravariant**.
- A **delegate** is a type-safe reference to a method; `Func<>`, `Action<>` and `Predicate<>` are the built-in ones; **events** are delegates restricted so outsiders can only subscribe and unsubscribe.
- Lambdas that use outer variables form **closures** ([[F3.4]]), which can extend those variables' lifetime.

## B1.6 LINQ 🟢 ⭐

```csharp
var topCustomers = invoices
    .Where(i => i.Status == InvoiceStatus.Paid && i.PaidOn >= since)
    .GroupBy(i => i.CustomerId)
    .Select(g => new { CustomerId = g.Key, Total = g.Sum(i => i.Amount), Count = g.Count() })
    .OrderByDescending(x => x.Total)
    .Take(10)
    .ToList();                                 // executes here
```

> [!term] Deferred execution
> Most LINQ operators (`Where`, `Select`, `OrderBy`) don't run when called; they build a query that runs when you **enumerate** it (`foreach`, `ToList()`, `First()`, `Count()`). Enumerating twice runs it twice, which against a database means two queries.

### IEnumerable vs IQueryable ⭐

| | `IEnumerable<T>` | `IQueryable<T>` |
|---|---|---|
| Works on | Objects **in memory** | A **query provider** (EF Core → SQL, or other providers) |
| Lambdas are | Compiled delegates (`Func<T,bool>`) | **Expression trees** (`Expression<Func<T,bool>>`) the provider translates |
| Filtering happens | In your process, after the data is loaded | In the **database**, as SQL |

```csharp
IQueryable<Invoice> q = db.Invoices.Where(i => i.CompanyId == companyId);  // still SQL
var page = await q.OrderBy(i => i.DueDate).Skip(40).Take(20).ToListAsync(); // ONE SQL query with WHERE, ORDER BY, OFFSET/FETCH

IEnumerable<Invoice> e = db.Invoices.AsEnumerable();                         // from here on, in memory
var bad = e.Where(i => i.CompanyId == companyId).ToList();                   // loads EVERY invoice, then filters
```

> [!say]
> "IEnumerable runs LINQ in memory over objects already loaded. IQueryable keeps the query as an expression tree so EF Core can translate it to SQL, which means filtering, sorting and paging happen in the database. Switching to IEnumerable too early, for example by calling ToList or AsEnumerable before the Where, loads the whole table."

<figure class="dia"><svg viewBox="0 0 720 236" role="img" aria-label="With IQueryable the WHERE and paging run in SQL and only 20 rows travel; switching to IEnumerable first loads all 120,000 rows and filters in memory">
<text class="sT" x="180" y="22" text-anchor="middle">IQueryable: filter in the database</text><text class="sT" x="540" y="22" text-anchor="middle">AsEnumerable() first: filter in memory</text>
<line class="sD" x1="360" y1="12" x2="360" y2="232"/>
<rect class="sB" x="20" y="36" width="150" height="46" rx="8"/><text class="sT" x="95" y="57" text-anchor="middle">database</text><text class="sC" x="95" y="73" text-anchor="middle">Invoices: 120,000</text>
<rect class="sV" x="20" y="96" width="320" height="40" rx="8"/><text class="sC" x="180" y="120" text-anchor="middle">SELECT … WHERE CompanyId = @p ORDER BY DueDa…</text>
<line class="sLm" x1="95" y1="82" x2="95" y2="94" marker-end="url(#ahm)"/>
<line class="sLg" x1="180" y1="136" x2="180" y2="170" style="stroke-width:2" marker-end="url(#ahg)"/><text class="sGt" x="196" y="160">20 rows sent</text>
<rect class="sG" x="80" y="176" width="200" height="44" rx="8"/><text class="sT" x="180" y="196" text-anchor="middle">your API</text><text class="sC" x="180" y="212" text-anchor="middle">gets the 20 it needs</text>
<rect class="sB" x="380" y="36" width="150" height="46" rx="8"/><text class="sT" x="455" y="57" text-anchor="middle">database</text><text class="sC" x="455" y="73" text-anchor="middle">Invoices: 120,000</text>
<rect class="sR" x="380" y="96" width="320" height="40" rx="8" opacity=".8"/><text class="sC" x="540" y="120" text-anchor="middle">SELECT * FROM Invoices</text>
<line class="sLm" x1="455" y1="82" x2="455" y2="94" marker-end="url(#ahm)"/>
<line class="sLr" x1="540" y1="136" x2="540" y2="170" style="stroke-width:8" marker-end="url(#ahr)"/><text class="sRt" x="556" y="160">120,000 rows sent</text>
<rect class="sW" x="440" y="176" width="200" height="44" rx="8"/><text class="sT" x="540" y="196" text-anchor="middle">your API</text><text class="sC" x="540" y="212" text-anchor="middle">filters 120,000 → 20</text>
</svg><figcaption>Where the filter runs decides how much data crosses the network and how much memory your API spends.</figcaption></figure>

> [!mistake] Multiple enumeration
> Passing an `IEnumerable` from a database query around and calling `.Count()` then `foreach` runs the query twice. Materialise once with `ToList()` when you need the results more than once.

## B1.7 async/await 🟢 🟡 ⭐

**Why:** a web server has a limited pool of threads. While a request waits for the database or an HTTP call, a **blocking** call holds its thread hostage, while an **awaited** call **returns the thread to the pool** to serve other requests. Async is about **scalability**, not making one request faster.

```csharp
public async Task<DashboardDto> GetDashboardAsync(Guid companyId, CancellationToken ct)
{
    var summaryTask  = _db.GetSummaryAsync(companyId, ct);       // start both...
    var forecastTask = _forecast.GetAsync(companyId, 90, ct);
    await Task.WhenAll(summaryTask, forecastTask);                 // ...await together
    return new DashboardDto(summaryTask.Result, forecastTask.Result);   // safe: both completed
}
```

How it works: the compiler turns an `async` method into a **state machine**. At an `await` on an incomplete task, the method returns an incomplete `Task` to its caller, and the rest of the method is registered as a **continuation** to run when the awaited work finishes. No thread sits waiting.

<figure class="dia steps"><svg viewBox="0 0 720 206" role="img" aria-label="Timeline: request A awaits a database query, its thread serves request B meanwhile, and A continues on another pool thread when the query completes">
<text class="sM" x="110" y="50" text-anchor="end">thread 1</text><line class="sN" x1="120" y1="46" x2="700" y2="46"/>
<text class="sM" x="110" y="100" text-anchor="end">thread 2</text><line class="sN" x1="120" y1="96" x2="700" y2="96"/>
<text class="sM" x="110" y="150" text-anchor="end">database</text><line class="sN" x1="120" y1="146" x2="700" y2="146"/>
<g data-s="1"><rect class="sA" x="120" y="34" width="38.6667" height="24" rx="4"/><text class="sC" x="139.333" y="50" text-anchor="middle">A</text></g>
<g data-s="2"><rect class="sV" x="158.667" y="134" width="270.667" height="24" rx="4"/><text class="sC" x="294" y="150" text-anchor="middle">query for A</text></g>
<g data-s="3"><rect class="sG" x="168.333" y="34" width="183.667" height="24" rx="4"/><text class="sC" x="260.167" y="50" text-anchor="middle">request B (same thread)</text></g>
<g data-s="4"><rect class="sA" x="429.333" y="84" width="77.3333" height="24" rx="4"/><text class="sC" x="468" y="100" text-anchor="middle">A continues</text></g>
<g data-s="2"><path class="sLm" d="M158.7 58 V84" marker-end="url(#ahm)"/><text class="sWt" x="164.667" y="72">await → thread 1 returns to the pool</text></g>
<g data-s="4"><path class="sLg" d="M429.3 134 V110" marker-end="url(#ahg)"/><text class="sGt" x="435.333" y="124">continuation on any free thread</text></g>
<g data-s="5"><text class="sRt" x="400" y="196" text-anchor="middle">blocking with .Result would keep thread 1 idle for the whole 140 ms query</text></g>
<text class="sC" x="120" y="176" text-anchor="middle">0 ms</text>
<text class="sC" x="313.333" y="176" text-anchor="middle">100 ms</text>
<text class="sC" x="506.667" y="176" text-anchor="middle">200 ms</text>
<text class="sC" x="700" y="176" text-anchor="middle">300 ms</text>
</svg><ol class="dia-steps">
<li>Request A starts on pool thread 1.</li>
<li>It awaits a database query. The query is in flight, but no thread waits for it: the method returns and thread 1 goes back to the pool.</li>
<li>Thread 1 immediately serves request B. One thread, two requests in progress.</li>
<li>The query completes. The rest of A's method (the continuation) is queued and runs on whichever pool thread is free.</li>
<li>Compare: with <code>.Result</code>, thread 1 would sit blocked for the whole query. Under load, enough blocked threads starve the pool and requests queue up while the CPU is idle.</li>
</ol><figcaption>Why async scales. The same number of threads serves far more concurrent requests when none of them waits on I/O.</figcaption></figure>

| Rule | Why |
|---|---|
| **Async all the way**; never `.Result` or `.Wait()` on an incomplete task | Blocking wastes a thread, and in environments with a synchronisation context (UI apps, legacy ASP.NET) it can **deadlock** |
| **Never `async void`** except event handlers | Exceptions can't be caught by the caller and crash the process; nobody can await it |
| Pass and honour **`CancellationToken`** | When the client disconnects, `HttpContext.RequestAborted` cancels the database call too |
| `ConfigureAwait(false)` in **library** code | ASP.NET Core has no synchronisation context, so app code doesn't need it; libraries used by UI apps still do |
| Use `ValueTask` only when results are often synchronous (cached) | It avoids an allocation, but can only be awaited once |
| Don't wrap CPU work in `Task.Run` inside ASP.NET Core | It just moves work to another pool thread; use it for CPU work in UI apps |

> [!term] Task vs Thread
> A **thread** is an OS-level unit of execution, expensive to create and hold. A **Task** is a promise of a result that may complete later; it might run on a thread-pool thread, or (for I/O) not use a thread at all while waiting. async/await composes Tasks.

> [!say]
> "await doesn't block a thread. The method returns to its caller, and the rest of it runs as a continuation when the awaited operation completes, so the thread can serve other requests in the meantime. That's why I keep code async all the way down, never block with .Result, avoid async void, and pass cancellation tokens through to the database."

## B1.8 Memory and the garbage collector 🟡 ⭐

The **GC** frees heap objects that nothing references any more.

- **Generations:** new objects start in **gen 0**; survivors are promoted to **gen 1**, then **gen 2**. Most objects die young, so gen 0 collections are frequent and cheap; gen 2 collections are rarer and costlier.
- **Large object heap (LOH):** objects of **85,000 bytes or more** (big arrays and strings) go straight to the LOH, collected with gen 2 and not compacted by default, so lots of large temporary buffers cause fragmentation. Use `ArrayPool<T>` for big reusable buffers.
- **Server vs workstation GC:** ASP.NET Core uses server GC by default (one heap per core, throughput-oriented).

<figure class="dia steps" data-start="1"><svg viewBox="0 0 720 232" role="img" aria-label="Generational GC: objects allocated in gen 0, a gen 0 collection frees the dead ones, survivors move to gen 1 and long-lived ones to gen 2; large objects go to a separate heap">
<text class="sT" x="100" y="22" text-anchor="middle">gen 0</text><text class="sT" x="320" y="22" text-anchor="middle">gen 1</text><text class="sT" x="540" y="22" text-anchor="middle">gen 2</text>
<rect class="sN" x="20" y="30" width="200" height="120" rx="10"/>
<rect class="sN" x="240" y="30" width="200" height="120" rx="10"/>
<rect class="sN" x="460" y="30" width="200" height="120" rx="10"/>
<g data-s="1-1"><rect class="sB" x="30" y="40" width="52" height="40" rx="6"/><text class="sC" x="56" y="65" text-anchor="middle">req</text><rect class="sB" x="90" y="40" width="52" height="40" rx="6"/><text class="sC" x="116" y="65" text-anchor="middle">dto</text><rect class="sA" x="150" y="40" width="52" height="40" rx="6"/><text class="sC" x="176" y="65" text-anchor="middle">list</text><rect class="sB" x="30" y="90" width="52" height="40" rx="6"/><text class="sC" x="56" y="115" text-anchor="middle">str</text><rect class="sA" x="90" y="90" width="52" height="40" rx="6"/><text class="sC" x="116" y="115" text-anchor="middle">cache</text><rect class="sB" x="150" y="90" width="52" height="40" rx="6"/><text class="sC" x="176" y="115" text-anchor="middle">tmp</text><text class="sC" x="120" y="172" text-anchor="middle">new objects land in gen 0</text></g>
<g data-s="2-2"><rect class="sR" x="30" y="40" width="52" height="40" rx="6" opacity=".35"/><text class="sC" x="56" y="65" text-anchor="middle">req ✕</text><rect class="sR" x="90" y="40" width="52" height="40" rx="6" opacity=".35"/><text class="sC" x="116" y="65" text-anchor="middle">dto ✕</text><rect class="sA" x="150" y="40" width="52" height="40" rx="6"/><text class="sC" x="176" y="65" text-anchor="middle">list</text><rect class="sR" x="30" y="90" width="52" height="40" rx="6" opacity=".35"/><text class="sC" x="56" y="115" text-anchor="middle">str ✕</text><rect class="sA" x="90" y="90" width="52" height="40" rx="6"/><text class="sC" x="116" y="115" text-anchor="middle">cache</text><rect class="sR" x="150" y="90" width="52" height="40" rx="6" opacity=".35"/><text class="sC" x="176" y="115" text-anchor="middle">tmp ✕</text><text class="sRt" x="120" y="172" text-anchor="middle">gen 0 GC: most are already dead</text></g>
<g data-s="3"><rect class="sA" x="250" y="40" width="52" height="40" rx="6"/><text class="sC" x="276" y="65" text-anchor="middle">list</text><rect class="sA" x="310" y="40" width="52" height="40" rx="6"/><text class="sC" x="336" y="65" text-anchor="middle">cache</text><text class="sGt" x="340" y="172" text-anchor="middle">survivors promoted, compacted</text></g>
<g data-s="3-3"><text class="sGt" x="120" y="172" text-anchor="middle">gen 0 empty again: cheap</text></g>
<g data-s="4"><rect class="sA" x="470" y="40" width="52" height="40" rx="6"/><text class="sC" x="496" y="65" text-anchor="middle">cache</text><text class="sC" x="560" y="172" text-anchor="middle">long-lived: collected rarely</text><rect class="sW" x="240" y="186" width="440" height="36" rx="8"/><text class="sC" x="460" y="209" text-anchor="middle">large object heap: ≥ 85,000 bytes, collected with gen 2</text></g>
</svg><ol class="dia-steps">
<li>Every <code>new</code> allocates in gen 0, which is fast: just bump a pointer.</li>
<li>When gen 0 fills, a gen 0 collection runs. Most objects (the request, its DTOs, temporary strings) are already unreachable and are freed for almost no cost.</li>
<li>The survivors are moved (compacted) into gen 1.</li>
<li>Objects that keep surviving end up in gen 2, which is collected rarely and expensively. Very large objects skip straight to the large object heap.</li>
</ol><figcaption>Generational garbage collection rests on one observation: most objects die young.</figcaption></figure>

**Managed memory is the GC's job; unmanaged resources are yours.** Database connections, file handles and sockets must be released deterministically:

```csharp
await using var conn = new SqlConnection(cs);      // DisposeAsync at the end of the scope
using var stream = File.OpenRead(path);             // Dispose at the end of the scope
```

> [!term] IDisposable
> The pattern for releasing unmanaged resources deterministically through `Dispose()`, usually via a `using` statement. Finalisers (`~ClassName`) are a safety net run by the GC much later, and are rarely needed.

**Memory leaks still happen in .NET:** static collections that only grow, event handlers that are subscribed and never unsubscribed (the publisher keeps the subscriber alive), caches without size limits or expiry, and long-lived captured closures.

**`Span<T>` and `Memory<T>`** (mid level): views over contiguous memory (arrays, stack memory, slices of strings) without copying or allocating. Used in high-performance parsing; C# 14 added implicit conversions that make them easier to use.

> [!story]
> Your benchmark found EF Core allocated about **1.9× the memory** of raw ADO.NET and Dapper. That's a GC conversation: more allocations mean more gen 0 collections. Explain why it was still the right default for CRUD (developer speed, change tracking, migrations) and when you'd switch a hot path to Dapper or `AsNoTracking()` projections ([[B5]]).

## B1.9 Exceptions 🟢 ⭐

```csharp
try
{
    await _payments.ChargeAsync(invoice, ct);
}
catch (HttpRequestException ex) when (ex.StatusCode == HttpStatusCode.ServiceUnavailable)  // exception filter
{
    _logger.LogWarning(ex, "Payment provider unavailable for {InvoiceId}", invoice.Id);
    throw new PaymentUnavailableException(invoice.Id, ex);   // wrap with context, keep the inner exception
}
```

| Rule | Why |
|---|---|
| **`throw;`** not **`throw ex;`** to rethrow | `throw ex` resets the stack trace to this line, losing where it really failed |
| Catch **specific** exceptions you can handle | Catching `Exception` everywhere hides bugs; let unexpected ones reach the global handler |
| Don't use exceptions for normal control flow | They're expensive; use `TryParse`, `TryGetValue`, or a result type |
| Add context, keep the cause | Wrap with a meaningful message and pass the inner exception |
| One global handler in ASP.NET Core | Converts unhandled exceptions into `ProblemDetails` and logs them ([[B3]]) |

## B1.10 Equality, hashing and collections 🟡

- Override `Equals` **and** `GetHashCode` together (or use a record). Objects that are equal must have the same hash code, or `Dictionary` and `HashSet` break.
- Don't use mutable fields in a hash code: if the object changes while in a `HashSet`, it becomes unfindable.
- Pick collections by access pattern ([[S4.3]]); `IReadOnlyList<T>` and `IReadOnlyCollection<T>` express intent in APIs; `FrozenDictionary` and `FrozenSet` (.NET 8) are optimised for data built once and read many times, such as lookup tables.

## B1.11 Dependency injection in .NET 🟢 ⭐

ASP.NET Core has a built-in DI container. You register services at startup and receive them through constructor parameters.

```csharp
builder.Services.AddSingleton<IClock, SystemClock>();                 // one for the whole app
builder.Services.AddScoped<IInvoiceService, InvoiceService>();        // one per HTTP request
builder.Services.AddTransient<IPdfRenderer, PdfRenderer>();           // a new one every time it's injected
builder.Services.AddDbContext<AppDbContext>(o => o.UseSqlServer(cs)); // DbContext is scoped
builder.Services.AddKeyedSingleton<IStorage, BlobStorage>("blob");    // keyed services (.NET 8)

public class InvoiceService(AppDbContext db, IClock clock) : IInvoiceService   // primary constructor (C# 12)
{
    public Task<bool> IsOverdueAsync(Guid id) => /* uses db and clock */ ...;
}
```

| Lifetime | One instance per… | Use for | Watch out |
|---|---|---|---|
| **Singleton** | Application | Stateless services, caches, configuration, `HttpClient` handlers | Must be **thread-safe**; must not depend on scoped services |
| **Scoped** | Request (scope) | `DbContext`, unit of work, per-request user context | Not available outside a scope (background services must create one) |
| **Transient** | Injection | Lightweight, stateless helpers | Disposable transients are tracked until the scope ends |

<figure class="dia"><svg viewBox="0 0 720 252" role="img" aria-label="DI lifetimes across two requests: one singleton shared by both, one scoped DbContext per request, and a new transient instance per injection; a singleton capturing a scoped service is a bug">
<text class="sT" x="240" y="22" text-anchor="middle">request 1</text><text class="sT" x="560" y="22" text-anchor="middle">request 2</text>
<rect class="sN" x="100" y="30" width="280" height="170" rx="10"/><rect class="sN" x="420" y="30" width="280" height="170" rx="10"/>
<text class="sM" x="90" y="66" text-anchor="end">singleton</text><rect class="sG" x="110" y="50" width="580" height="30" rx="6"/><text class="sC" x="400" y="70" text-anchor="middle">the same SystemClock for the whole app</text>
<text class="sM" x="90" y="116" text-anchor="end">scoped</text><rect class="sA" x="110" y="100" width="260" height="30" rx="6"/><text class="sC" x="240" y="120" text-anchor="middle">DbContext #1</text><rect class="sA" x="430" y="100" width="260" height="30" rx="6"/><text class="sC" x="560" y="120" text-anchor="middle">DbContext #2</text>
<text class="sM" x="90" y="166" text-anchor="end">transient</text>
<rect class="sB" x="110" y="150" width="80" height="30" rx="6"/><text class="sC" x="150" y="170" text-anchor="middle">Pdf #1</text>
<rect class="sB" x="200" y="150" width="80" height="30" rx="6"/><text class="sC" x="240" y="170" text-anchor="middle">Pdf #2</text>
<rect class="sB" x="290" y="150" width="80" height="30" rx="6"/><text class="sC" x="330" y="170" text-anchor="middle">Pdf #3</text>
<rect class="sB" x="430" y="150" width="80" height="30" rx="6"/><text class="sC" x="470" y="170" text-anchor="middle">Pdf #4</text>
<rect class="sB" x="520" y="150" width="80" height="30" rx="6"/><text class="sC" x="560" y="170" text-anchor="middle">Pdf #5</text>
<rect class="sB" x="610" y="150" width="80" height="30" rx="6"/><text class="sC" x="650" y="170" text-anchor="middle">Pdf #6</text>
<rect class="sR" x="100" y="212" width="600" height="30" rx="8" opacity=".85"/><text class="sC" x="400" y="232" text-anchor="middle">captive dependency: a singleton holding DbContext #1 shares it with every later request</text>
</svg><figcaption>The three lifetimes over two requests, and the bug that comes from mixing them the wrong way round.</figcaption></figure>

> [!term] Captive dependency
> A longer-lived service holding a shorter-lived one, such as a **singleton that injects a scoped `DbContext`**. The DbContext gets "captured" for the app's lifetime: shared between requests, not thread-safe, never refreshed. ASP.NET Core's scope validation throws on this in Development. In a singleton or a `BackgroundService`, inject `IServiceScopeFactory` and create a scope per unit of work.

> [!say]
> "Singleton is one instance for the app, scoped is one per request, transient is new every injection. DbContext is scoped because it isn't thread-safe and tracks changes per unit of work. The classic bug is a captive dependency, a singleton holding a scoped service; in a background job I create a scope per iteration with IServiceScopeFactory."

> [!story]
> FinSight's **Hangfire** jobs and the nightly forecasting job run outside an HTTP request, so they need their own DI scope to get a `DbContext`, and a tenant context that isn't a JWT claim. That's a sharp mid-level answer to "how did multi-tenancy work in background jobs?".

## B1.12 Modern C# you should recognise 🟡

| Version (.NET) | Features worth naming |
|---|---|
| C# 9 (.NET 5) | Records, `init` setters, top-level statements, pattern-matching improvements |
| C# 10 (.NET 6) | Global usings, file-scoped namespaces, record structs |
| C# 11 (.NET 7) | Raw string literals `"""…"""`, `required` members, list patterns, `file` types |
| C# 12 (.NET 8) | **Primary constructors** for classes, **collection expressions** `[1, 2, 3]`, default lambda parameters |
| C# 13 (.NET 9) | `params` collections, the new `System.Threading.Lock` type, `\e` escape |
| **C# 14 (.NET 10)** | **Extension members** (extension properties and static extensions), the **`field`** keyword in property accessors, **null-conditional assignment** `customer?.Order = …`, `nameof(List<>)`, implicit `Span` conversions, partial constructors and events |

```csharp
// Pattern matching, which interviewers like to see
string Band(Invoice i) => i switch
{
    { Status: InvoiceStatus.Paid }                   => "settled",
    { DueDate: var d } when d < DateTime.UtcNow      => "overdue",
    { Amount: > 100_000 }                             => "large",
    _                                                 => "open",
};

// C# 14: field-backed property with validation, no separate backing field
public string Email
{
    get;
    set => field = value?.Trim().ToLowerInvariant() ?? throw new ArgumentNullException(nameof(value));
}
```

<figure class="dia"><svg viewBox="0 0 720 244" role="img" aria-label="The Band switch expression applied to four invoices: a paid invoice is settled even though it is overdue and large, an overdue unpaid one is overdue, a large current one is large, and a small current one falls through to open">
<rect class="sN" x="220" y="20" width="114" height="40" rx="6"/><text class="sS" x="226" y="36" xml:space="preserve" style="white-space:pre">{ Status: Paid }</text>
<text class="sC" x="277" y="76" text-anchor="middle">→ "settled"</text>
<rect class="sN" x="340" y="20" width="114" height="40" rx="6"/><text class="sS" x="346" y="36" xml:space="preserve" style="white-space:pre">{ DueDate: var d }</text><text class="sS" x="346" y="52" xml:space="preserve" style="white-space:pre">when d &lt; now</text>
<text class="sC" x="397" y="76" text-anchor="middle">→ "overdue"</text>
<rect class="sN" x="460" y="20" width="114" height="40" rx="6"/><text class="sS" x="466" y="36" xml:space="preserve" style="white-space:pre">{ Amount:</text><text class="sS" x="466" y="52" xml:space="preserve" style="white-space:pre">  &gt; 100_000 }</text>
<text class="sC" x="517" y="76" text-anchor="middle">→ "large"</text>
<rect class="sN" x="580" y="20" width="114" height="40" rx="6"/><text class="sS" x="586" y="36" xml:space="preserve" style="white-space:pre">_</text>
<text class="sC" x="637" y="76" text-anchor="middle">→ "open"</text>
<text class="sC" x="208" y="108" text-anchor="end">#1 Paid, 250,000, past due</text>
<rect class="sG" x="220" y="90" width="114" height="26" rx="5"/><text class="sT" x="277" y="108" text-anchor="middle">chosen: "settled"</text>
<rect class="sN" x="340" y="90" width="114" height="26" rx="5" opacity=".6"/><text class="sS" x="397" y="108" text-anchor="middle">would match</text>
<rect class="sN" x="460" y="90" width="114" height="26" rx="5" opacity=".6"/><text class="sS" x="517" y="108" text-anchor="middle">would match</text>
<rect class="sN" x="580" y="90" width="114" height="26" rx="5" opacity=".6"/><text class="sS" x="637" y="108" text-anchor="middle">would match</text>
<text class="sC" x="208" y="140" text-anchor="end">#2 Sent, 250,000, past due</text>
<rect class="sN" x="220" y="122" width="114" height="26" rx="5"/><text class="sS" x="277" y="140" text-anchor="middle">no</text>
<rect class="sG" x="340" y="122" width="114" height="26" rx="5"/><text class="sT" x="397" y="140" text-anchor="middle">chosen: "overdue"</text>
<rect class="sN" x="460" y="122" width="114" height="26" rx="5" opacity=".6"/><text class="sS" x="517" y="140" text-anchor="middle">would match</text>
<rect class="sN" x="580" y="122" width="114" height="26" rx="5" opacity=".6"/><text class="sS" x="637" y="140" text-anchor="middle">would match</text>
<text class="sC" x="208" y="172" text-anchor="end">#3 Sent, 250,000, due later</text>
<rect class="sN" x="220" y="154" width="114" height="26" rx="5"/><text class="sS" x="277" y="172" text-anchor="middle">no</text>
<rect class="sN" x="340" y="154" width="114" height="26" rx="5"/><text class="sS" x="397" y="172" text-anchor="middle">no</text>
<rect class="sG" x="460" y="154" width="114" height="26" rx="5"/><text class="sT" x="517" y="172" text-anchor="middle">chosen: "large"</text>
<rect class="sN" x="580" y="154" width="114" height="26" rx="5" opacity=".6"/><text class="sS" x="637" y="172" text-anchor="middle">would match</text>
<text class="sC" x="208" y="204" text-anchor="end">#4 Sent, 4,000, due later</text>
<rect class="sN" x="220" y="186" width="114" height="26" rx="5"/><text class="sS" x="277" y="204" text-anchor="middle">no</text>
<rect class="sN" x="340" y="186" width="114" height="26" rx="5"/><text class="sS" x="397" y="204" text-anchor="middle">no</text>
<rect class="sN" x="460" y="186" width="114" height="26" rx="5"/><text class="sS" x="517" y="204" text-anchor="middle">no</text>
<rect class="sG" x="580" y="186" width="114" height="26" rx="5"/><text class="sT" x="637" y="204" text-anchor="middle">chosen: "open"</text>
<text class="sS" x="360" y="232" text-anchor="middle">arms are tested top to bottom and the first match wins: put the most specific patterns first, the discard _ last</text>
</svg><figcaption>A switch expression picks the first arm that matches; later arms that would also match are never reached. Computed.</figcaption></figure>

> [!lab] One hour in a console app
> Write: a record vs class equality demo; an `IQueryable` vs `IEnumerable` comparison against SQLite with EF Core, logging the generated SQL; an async method that runs two delays with `Task.WhenAll` and one sequentially, timing both; and a singleton that injects a scoped service, to see scope validation throw. Each output is something you can describe in an interview.

## B1.13 Interview drill 🟢 ⭐

| Question | Strong short answer |
|---|---|
| Value vs reference type? | Value types hold data and copy on assignment; reference types hold a reference to a heap object, shared on assignment. |
| class vs struct vs record? | Class: reference, identity equality. Struct: value type, best small and immutable. Record: reference type with value equality, immutability and `with`. |
| Interface vs abstract class? | Interface: a contract, many per class, no state. Abstract class: a single base with shared state and behaviour. |
| What is boxing? | Wrapping a value type in a heap object when treated as object or an interface; it allocates. |
| IEnumerable vs IQueryable? | In-memory delegates vs expression trees translated by a provider, e.g. to SQL, so filtering runs in the database. |
| What is deferred execution? | LINQ queries run when enumerated, not when defined; enumerating twice runs twice. |
| How does async/await work? | The compiler builds a state machine; at an incomplete await the method returns and resumes as a continuation, freeing the thread. |
| Why not `.Result`? | It blocks a thread and can deadlock with a synchronisation context; stay async all the way. |
| Why avoid async void? | Exceptions can't be caught by callers and it can't be awaited; only for event handlers. |
| Task vs Thread? | A thread is an OS execution unit; a Task represents future work and may not use a thread while waiting for I/O. |
| How does the GC work? | Generational: gen 0, 1, 2, with frequent cheap young collections; large objects (≥ 85 KB) go to the LOH. |
| What's IDisposable for? | Deterministically releasing unmanaged resources, usually via `using`. |
| `throw` vs `throw ex`? | `throw;` keeps the original stack trace; `throw ex;` resets it. |
| Singleton vs scoped vs transient? | One per app, one per request, one per injection. |
| What's a captive dependency? | A longer-lived service holding a shorter-lived one, like a singleton holding a scoped DbContext. |
| What's new in C# 14? | Extension members, the field keyword, null-conditional assignment, implicit span conversions. |
| What's the current LTS? | .NET 10 (November 2025), supported to November 2028; .NET 8 and 9 end in November 2026. |

## Key takeaways

> [!check]
> - Copy semantics, not "stack vs heap", is the real value/reference difference.
> - Records for DTOs and value objects; classes for entities; structs only when small and immutable.
> - Keep queries `IQueryable` until the database has done the filtering.
> - async frees threads; never block on it; pass cancellation tokens.
> - DI lifetimes: DbContext is scoped; singletons must never capture scoped services.

## Sources

- Microsoft Learn: [Value types](https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/builtin-types/value-types), [Records](https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/builtin-types/record), [LINQ overview](https://learn.microsoft.com/en-us/dotnet/csharp/linq/), [Asynchronous programming with async and await](https://learn.microsoft.com/en-us/dotnet/csharp/asynchronous-programming/), [Fundamentals of garbage collection](https://learn.microsoft.com/en-us/dotnet/standard/garbage-collection/fundamentals), [Large object heap](https://learn.microsoft.com/en-us/dotnet/standard/garbage-collection/large-object-heap), [Dependency injection in .NET](https://learn.microsoft.com/en-us/dotnet/core/extensions/dependency-injection), [Service lifetimes](https://learn.microsoft.com/en-us/dotnet/core/extensions/dependency-injection#service-lifetimes), [What's new in C# 14](https://learn.microsoft.com/en-us/dotnet/csharp/whats-new/csharp-14), [Exception best practices](https://learn.microsoft.com/en-us/dotnet/standard/exceptions/best-practices-for-exceptions).
- [.NET support policy](https://dotnet.microsoft.com/platform/support/policy/dotnet-core).
- David Fowler, [ASP.NET Core diagnostic scenarios: async guidance](https://github.com/davidfowl/AspNetCoreDiagnosticScenarios/blob/master/AsyncGuidance.md).
- Stephen Toub, [How async/await really works in C#](https://devblogs.microsoft.com/dotnet/how-async-await-really-works/) (.NET blog).
