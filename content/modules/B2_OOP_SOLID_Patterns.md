# OOP, SOLID and Design Patterns — Explained With Code You'd Actually Write

Egyptian .NET interviews almost always include "explain the four pillars of OOP", "explain SOLID with an example" and "which design patterns have you used?". The trap is giving textbook definitions with no examples. This module gives each principle a short **before and after** in C#, and ties patterns to things you've built: the Composite lab at ITI, FinSight's repositories and background jobs, ASP.NET Core's middleware pipeline.

> [!focus]
> **Entry must:** the four pillars with examples; each SOLID principle with a code example; five or six patterns you can explain and say where you used them; composition over inheritance.
> **Mid adds:** when a pattern is overkill, the Repository and Unit of Work debate with EF Core, Decorator vs inheritance, Strategy and Chain of Responsibility in ASP.NET Core, code smells and refactoring.
> **Most asked:** *Explain SOLID* · *Which pattern have you used and why?* · *Polymorphism with an example* · *Composition vs inheritance?* · *Is the Repository pattern needed with EF Core?* · *What's wrong with the Singleton pattern?*
> **Time budget:** 3 hours.

## B2.0 Foundations: what design is protecting you from 🟢

Code that runs once never needs design. Code that changes every week does, and almost all business software does. Object-oriented design and the principles below are tools for one goal: **making the next change cheap and safe.**

**Objects and classes.** A **class** is a blueprint: data (**fields** and **properties**) plus behaviour (**methods**). An **object** (an **instance**) is one thing built from it, with its own data. A **constructor** builds a valid object; methods change it while keeping it valid.

**Coupling and cohesion** are the two measures behind every principle in this module:

<figure class="dia"><svg viewBox="0 0 720 234" role="img" aria-label="Five tightly coupled classes all referencing each other, versus two cohesive modules connected through one small interface">
<text class="sT" x="180" y="22" text-anchor="middle">tightly coupled</text><text class="sT" x="540" y="22" text-anchor="middle">loosely coupled, cohesive</text>
<line class="sLr" x1="80" y1="70" x2="200" y2="60" opacity=".45"/>
<line class="sLr" x1="80" y1="70" x2="290" y2="110" opacity=".45"/>
<line class="sLr" x1="80" y1="70" x2="110" y2="160" opacity=".45"/>
<line class="sLr" x1="80" y1="70" x2="230" y2="180" opacity=".45"/>
<line class="sLr" x1="200" y1="60" x2="290" y2="110" opacity=".45"/>
<line class="sLr" x1="200" y1="60" x2="110" y2="160" opacity=".45"/>
<line class="sLr" x1="200" y1="60" x2="230" y2="180" opacity=".45"/>
<line class="sLr" x1="290" y1="110" x2="110" y2="160" opacity=".45"/>
<line class="sLr" x1="290" y1="110" x2="230" y2="180" opacity=".45"/>
<line class="sLr" x1="110" y1="160" x2="230" y2="180" opacity=".45"/>
<rect class="sB" x="40" y="55" width="80" height="30" rx="6"/><text class="sC" x="80" y="75" text-anchor="middle">Orders</text>
<rect class="sB" x="160" y="45" width="80" height="30" rx="6"/><text class="sC" x="200" y="65" text-anchor="middle">Billing</text>
<rect class="sB" x="250" y="95" width="80" height="30" rx="6"/><text class="sC" x="290" y="115" text-anchor="middle">Email</text>
<rect class="sB" x="70" y="145" width="80" height="30" rx="6"/><text class="sC" x="110" y="165" text-anchor="middle">Reports</text>
<rect class="sB" x="190" y="165" width="80" height="30" rx="6"/><text class="sC" x="230" y="185" text-anchor="middle">Users</text>
<text class="sRt" x="180" y="222" text-anchor="middle">a change anywhere ripples everywhere</text>
<line class="sD" x1="360" y1="12" x2="360" y2="232"/>
<rect class="sA" x="375" y="40" width="150" height="110" rx="10"/><text class="sT" x="450" y="58" text-anchor="middle">Ordering</text>
<rect class="sB" x="390" y="70" width="120" height="20" rx="4"/><text class="sC" x="450" y="84" text-anchor="middle">Order</text>
<rect class="sB" x="390" y="94" width="120" height="20" rx="4"/><text class="sC" x="450" y="108" text-anchor="middle">OrderLine</text>
<rect class="sB" x="390" y="118" width="120" height="20" rx="4"/><text class="sC" x="450" y="132" text-anchor="middle">rules</text>
<rect class="sA" x="555" y="40" width="150" height="110" rx="10"/><text class="sT" x="630" y="58" text-anchor="middle">Billing</text>
<rect class="sB" x="570" y="70" width="120" height="20" rx="4"/><text class="sC" x="630" y="84" text-anchor="middle">Invoice</text>
<rect class="sB" x="570" y="94" width="120" height="20" rx="4"/><text class="sC" x="630" y="108" text-anchor="middle">Payment</text>
<rect class="sB" x="570" y="118" width="120" height="20" rx="4"/><text class="sC" x="630" y="132" text-anchor="middle">rules</text>
<line class="sLg" x1="525" y1="100" x2="555" y2="100" marker-end="url(#ahg)"/><text class="sGt" x="540" y="170" text-anchor="middle">one small interface between them</text>
<text class="sGt" x="540" y="222" text-anchor="middle">things that change together live together</text>
</svg><figcaption>Coupling is how much modules know about each other; cohesion is how closely the contents of one module belong together. Good design lowers the first and raises the second.</figcaption></figure>

**Reading class diagrams.** Patterns are usually drawn in UML. You need only this much:

<figure class="dia"><svg viewBox="0 0 720 266" role="img" aria-label="UML class diagram notation: class boxes with fields and methods, an interface implemented with a dashed arrow, inheritance with a solid arrow, and composition with a filled diamond">
<rect class="sB" x="20" y="30" width="170" height="80" rx="4"/><text class="sT" x="105" y="48" text-anchor="middle">Invoice</text><line class="sN" x1="20" y1="54" x2="190" y2="54"/><text class="sC" x="28" y="70">- payments: List</text><text class="sC" x="28" y="88">+ Total: decimal</text><text class="sC" x="28" y="106">+ ApplyPayment(p)</text>
<rect class="sV" x="270" y="30" width="170" height="58" rx="4"/><text class="sC" x="355" y="46" text-anchor="middle">«interface»</text><text class="sT" x="355" y="62" text-anchor="middle">INotifier</text><line class="sN" x1="270" y1="68" x2="440" y2="68"/><text class="sC" x="278" y="84">+ SendAsync(msg)</text>
<rect class="sB" x="270" y="150" width="170" height="44" rx="4"/><text class="sT" x="355" y="168" text-anchor="middle">SmsNotifier</text><line class="sN" x1="270" y1="174" x2="440" y2="174"/><text class="sC" x="278" y="190">+ SendAsync(msg)</text>
<rect class="sB" x="520" y="30" width="180" height="44" rx="4"/><text class="sT" x="610" y="48" text-anchor="middle">Account</text><line class="sN" x1="520" y1="54" x2="700" y2="54"/><text class="sC" x="528" y="70">+ Deposit(amount)</text>
<rect class="sB" x="520" y="150" width="180" height="44" rx="4"/><text class="sT" x="610" y="168" text-anchor="middle">SavingsAccount</text><line class="sN" x1="520" y1="174" x2="700" y2="174"/><text class="sC" x="528" y="190">+ AddInterest(rate)</text>
<line class="sLm" x1="355" y1="150" x2="355" y2="90" stroke-dasharray="5 4" marker-end="url(#ahm)"/><text class="sC" x="362" y="132">implements (dashed, hollow arrow)</text>
<line class="sLm" x1="610" y1="150" x2="610" y2="76" marker-end="url(#ahm)"/><text class="sC" x="616" y="132">inherits</text>
<path class="sLm" d="M105 110 V200 H120"/><path class="sFm" d="M105 110 l-6 10 l6 10 l6 -10z"/><rect class="sB" x="120" y="186" width="110" height="28" rx="4"/><text class="sC" x="175" y="205" text-anchor="middle">Payment</text><text class="sC" x="30" y="236">filled diamond: composition (Invoice owns its Payments)</text>
<text class="sC" x="30" y="254">+ public · - private · # protected</text>
</svg><figcaption>Enough UML to read any pattern diagram: a box per class (name, fields, methods), arrows for "implements" and "inherits", diamonds for "owns".</figcaption></figure>

## B2.1 The four pillars 🟢 ⭐

| Pillar | Meaning | One-line C# example |
|---|---|---|
| **Encapsulation** | Hide internal state; expose behaviour that keeps it valid | `Amount { get; private set; }` changed only by `ApplyPayment()`, which rejects overpayment |
| **Abstraction** | Expose *what* something does, hide *how* | `IPaymentGateway.ChargeAsync()` hides whether it's Paymob or Stripe |
| **Inheritance** | A type reuses and specialises another | `SavingsAccount : Account` |
| **Polymorphism** | One call, different behaviour depending on the actual type | `foreach (var n in notifiers) await n.SendAsync(msg);` where each is Email, SMS or Push |

```csharp
public class Invoice
{
    private readonly List<Payment> _payments = [];
    public decimal Total { get; }
    public decimal Paid => _payments.Sum(p => p.Amount);
    public IReadOnlyList<Payment> Payments => _payments;      // callers can't add directly

    public Invoice(decimal total) => Total = total > 0 ? total : throw new ArgumentOutOfRangeException(nameof(total));

    public void ApplyPayment(Payment p)                        // the only way in: rules enforced here
    {
        if (Paid + p.Amount > Total) throw new InvalidOperationException("Overpayment");
        _payments.Add(p);
    }
}
```

> [!say]
> "Encapsulation means the object protects its own rules: an invoice's payments can only be added through ApplyPayment, which rejects overpayment. Polymorphism means I can loop over a list of notifiers and call SendAsync, and each type, email or SMS, does its own thing, without the caller knowing which."

### Composition over inheritance 🟢 ⭐

Inheritance creates the **tightest** coupling there is: a subclass depends on its parent's internals, and deep hierarchies become rigid. Prefer **composing** objects from smaller parts behind interfaces, and keep inheritance for genuine "is-a" relationships with shared behaviour.

```csharp
// Inheritance explosion: EmailNotifier, SmsNotifier, RetryingEmailNotifier, LoggingRetryingSmsNotifier…
// Composition: small pieces combined at runtime
INotifier notifier = new LoggingNotifier(new RetryingNotifier(new SmsNotifier(client), retries: 3), logger);
```

<figure class="dia"><svg viewBox="0 0 720 218" role="img" aria-label="Inheritance needs a subclass for every combination of features; composition stacks small decorators that share one interface">
<text class="sT" x="180" y="22" text-anchor="middle">inheritance: a class per combination</text><text class="sT" x="540" y="22" text-anchor="middle">composition: combine at runtime</text>
<rect class="sB" x="110" y="34" width="140" height="30" rx="8"/><text class="sT" x="180" y="54" text-anchor="middle">Notifier</text>
<rect class="sB" x="30" y="90" width="140" height="28" rx="6"/><text class="sC" x="100" y="109" text-anchor="middle">EmailNotifier</text><line class="sLm" x1="100" y1="90" x2="180" y2="66"/>
<rect class="sB" x="190" y="90" width="140" height="28" rx="6"/><text class="sC" x="260" y="109" text-anchor="middle">SmsNotifier</text><line class="sLm" x1="260" y1="90" x2="180" y2="66"/>
<rect class="sR" x="10" y="146" width="88" height="28" rx="6" opacity=".8"/><text class="sC" x="54" y="165" text-anchor="middle">RetryingEmail</text><line class="sLm" x1="54" y1="146" x2="100" y2="118"/>
<rect class="sR" x="100" y="146" width="88" height="28" rx="6" opacity=".8"/><text class="sC" x="144" y="165" text-anchor="middle">LoggingEmail</text><line class="sLm" x1="144" y1="146" x2="100" y2="118"/>
<rect class="sR" x="190" y="146" width="88" height="28" rx="6" opacity=".8"/><text class="sC" x="234" y="165" text-anchor="middle">RetryingSms</text><line class="sLm" x1="234" y1="146" x2="260" y2="118"/>
<rect class="sR" x="280" y="146" width="88" height="28" rx="6" opacity=".8"/><text class="sC" x="324" y="165" text-anchor="middle">LoggingSms</text><line class="sLm" x1="324" y1="146" x2="260" y2="118"/>
<text class="sRt" x="180" y="200" text-anchor="middle">LoggingRetryingSms? Another class…</text>
<line class="sD" x1="360" y1="12" x2="360" y2="214"/>
<rect class="sV" x="390" y="90" width="96" height="40" rx="8"/><text class="sT" x="438" y="108" text-anchor="middle">Logging</text><text class="sC" x="438" y="123" text-anchor="middle">INotifier</text>
<line class="sLm" x1="486" y1="110" x2="498" y2="110" marker-end="url(#ahm)"/>
<rect class="sW" x="500" y="90" width="96" height="40" rx="8"/><text class="sT" x="548" y="108" text-anchor="middle">Retrying</text><text class="sC" x="548" y="123" text-anchor="middle">INotifier</text>
<line class="sLm" x1="596" y1="110" x2="608" y2="110" marker-end="url(#ahm)"/>
<rect class="sG" x="610" y="90" width="96" height="40" rx="8"/><text class="sT" x="658" y="108" text-anchor="middle">Sms</text><text class="sC" x="658" y="123" text-anchor="middle">INotifier</text>
<text class="sGt" x="540" y="160" text-anchor="middle">each piece is small and tested alone;</text><text class="sGt" x="540" y="178" text-anchor="middle">reorder or swap without new classes</text>
</svg><figcaption>Composition over inheritance. Behaviours become pieces you combine, not branches you multiply.</figcaption></figure>

## B2.2 SOLID 🟢 ⭐

### S — Single Responsibility Principle

> A class should have **one reason to change**, meaning it answers to one actor or concern.

```csharp
// ❌ One class parses CSV, validates, saves to the database, and emails a report
public class TransactionImporter { /* parse + validate + save + email */ }

// ✅ Each concern changes independently
public class CsvTransactionParser { }      // changes when the file format changes
public class TransactionValidator { }      // changes when business rules change
public class TransactionRepository { }     // changes when storage changes
public class ImportReportMailer { }        // changes when the report changes
```

### O — Open/Closed Principle

> Open for **extension**, closed for **modification**: add behaviour by adding code, not by editing working code.

```csharp
// ❌ Every new payment method edits this switch
decimal Fee(string method, decimal amount) => method switch { "card" => amount * 0.025m, "wallet" => 2m, _ => 0 };

// ✅ New methods are new classes
public interface IFeePolicy { string Method { get; } decimal Fee(decimal amount); }
public class CardFee   : IFeePolicy { public string Method => "card";   public decimal Fee(decimal a) => a * 0.025m; }
public class WalletFee : IFeePolicy { public string Method => "wallet"; public decimal Fee(decimal a) => 2m; }
// registered in DI; a resolver picks by Method
```

### L — Liskov Substitution Principle

> Subtypes must be usable wherever the base type is expected **without breaking expectations**.

The classic violation: `Square : Rectangle`, where setting the width also changes the height and breaks code that assumes they're independent. A practical one: a `ReadOnlyRepository : Repository` whose `Add()` throws `NotSupportedException`. If a subclass has to throw "not supported" for an inherited member, the hierarchy is wrong; split the interface instead.

<figure class="dia"><svg viewBox="0 0 720 192" role="img" aria-label="Code that sets a rectangle's width and height expects area 20; a Square subclass that keeps its sides equal gives 16, breaking the caller">
<text class="sC" x="20" y="34" xml:space="preserve" style="white-space:pre">void Resize(Rectangle r) {</text>
<text class="sC" x="20" y="54" xml:space="preserve" style="white-space:pre">  r.Width = 5;  r.Height = 4;</text>
<text class="sC" x="20" y="74" xml:space="preserve" style="white-space:pre">  Debug.Assert(r.Area == 20);</text>
<text class="sC" x="20" y="94" xml:space="preserve" style="white-space:pre">}</text>
<rect class="sG" x="380" y="20" width="140" height="90" rx="6"/><text class="sT" x="450" y="60" text-anchor="middle">Rectangle 5 × 4</text><text class="sGt" x="450" y="80" text-anchor="middle">area 20 ✓</text>
<rect class="sR" x="552" y="20" width="126" height="110" rx="6" opacity=".8"/><text class="sT" x="615" y="66" text-anchor="middle">Square</text><text class="sC" x="615" y="84" text-anchor="middle">height = 4 also</text><text class="sC" x="615" y="100" text-anchor="middle">sets width: 4 × 4</text><text class="sRt" x="615" y="120" text-anchor="middle">area 16 ✗</text>
<text class="sS" x="360" y="160" text-anchor="middle">Square : Rectangle compiles, but a Square passed in breaks a promise callers relied on.</text>
<text class="sS" x="360" y="180" text-anchor="middle">Liskov: a subtype must keep the base type's promises, not just its method signatures.</text>
</svg><figcaption>The classic Liskov violation. If substituting a subclass changes behaviour callers depend on, the "is-a" relationship is wrong.</figcaption></figure>

### I — Interface Segregation Principle

> Clients shouldn't depend on methods they don't use. Prefer several small interfaces to one fat one.

```csharp
// ❌ A report job is forced to depend on writes it never does
public interface IInvoiceRepository { Task<Invoice?> Get(Guid id); Task Add(Invoice i); Task Delete(Guid id); Task<Report> BuildReport(); }

// ✅
public interface IInvoiceReader { Task<Invoice?> Get(Guid id); }
public interface IInvoiceWriter { Task Add(Invoice i); Task Delete(Guid id); }
```

### D — Dependency Inversion Principle

> High-level policy shouldn't depend on low-level details; **both depend on abstractions**, and the abstraction is owned by the high-level side.

```csharp
// ❌ Business logic welded to an implementation
public class ForecastService { private readonly TimeGptHttpClient _client = new(); }

// ✅ Depends on an abstraction; DI supplies TimeGPT in production and a fake in tests
public class ForecastService(IForecastModel model, IClock clock) { }
```

Dependency **inversion** is the principle; dependency **injection** is a technique for achieving it ([[B1.11]]).

<figure class="dia"><svg viewBox="0 0 720 226" role="img" aria-label="Before, ForecastService depends directly on TimeGptHttpClient; after, it depends on IForecastModel in the core project and TimeGptModel implements it">
<text class="sT" x="180" y="22" text-anchor="middle">before: policy depends on a detail</text><text class="sT" x="540" y="22" text-anchor="middle">after: both depend on an abstraction</text>
<rect class="sA" x="100" y="40" width="160" height="46" rx="8"/><text class="sT" x="180" y="61" text-anchor="middle">ForecastService</text><text class="sC" x="180" y="77" text-anchor="middle">business policy</text><line class="sLr" x1="180" y1="86" x2="180" y2="126" marker-end="url(#ahr)"/><rect class="sB" x="100" y="130" width="160" height="46" rx="8"/><text class="sT" x="180" y="151" text-anchor="middle">TimeGptHttpClient</text><text class="sC" x="180" y="167" text-anchor="middle">infrastructure detail</text>
<text class="sRt" x="180" y="200" text-anchor="middle">can't test without TimeGPT; can't swap it</text>
<line class="sD" x1="360" y1="12" x2="360" y2="214"/>
<rect class="sN" x="380" y="32" width="320" height="90" rx="10" stroke-dasharray="5 4"/><text class="sC" x="392" y="48">core project</text>
<rect class="sA" x="395" y="56" width="140" height="46" rx="8"/><text class="sT" x="465" y="84" text-anchor="middle">ForecastService</text><line class="sLm" x1="535" y1="79" x2="556" y2="79" marker-end="url(#ahm)"/><rect class="sV" x="560" y="56" width="130" height="46" rx="8"/><text class="sT" x="625" y="77" text-anchor="middle">IForecastModel</text><text class="sC" x="625" y="93" text-anchor="middle">«interface»</text>
<rect class="sB" x="560" y="150" width="130" height="46" rx="8"/><text class="sT" x="625" y="171" text-anchor="middle">TimeGptModel</text><text class="sC" x="625" y="187" text-anchor="middle">infrastructure</text><line class="sLg" x1="625" y1="150" x2="625" y2="104" stroke-dasharray="5 4" marker-end="url(#ahg)"/><text class="sGt" x="560" y="136" text-anchor="end">implements ↑</text>
<text class="sGt" x="540" y="216" text-anchor="middle">the dependency arrow now points from detail to policy</text>
</svg><figcaption>Dependency inversion. The interface belongs to the high-level side, so infrastructure depends on the core, never the other way round.</figcaption></figure>

> [!say]
> "SOLID in one breath: single responsibility, one reason to change; open/closed, extend by adding classes rather than editing; Liskov, subtypes mustn't break the base's promises; interface segregation, small focused interfaces; and dependency inversion, business logic depends on abstractions that infrastructure implements. In FinSight, the forecasting service depended on an IForecastModel, so we could swap TimeGPT for a fake in tests."

> [!mistake] SOLID as dogma
> Ten interfaces with one implementation each, "just in case", make code harder to read. Apply the principles where change is likely or testing needs a seam. **YAGNI** (you aren't gonna need it) and **KISS** (keep it simple) are principles too.

## B2.3 Other principles worth naming 🟢

| Principle | Meaning |
|---|---|
| **DRY** | Don't repeat *knowledge*. Duplicated code that changes for different reasons is fine; a single rule copied in five places isn't |
| **KISS** | The simplest design that works |
| **YAGNI** | Don't build for imagined future requirements |
| **Separation of concerns** | Different responsibilities in different places (UI, business rules, data access) |
| **High cohesion, low coupling** | Things that change together live together; modules know as little about each other as possible |
| **Law of Demeter** | Talk to your immediate collaborators: `order.Customer.Address.City.Name` is a smell |
| **Tell, don't ask** | Ask objects to do things (`invoice.ApplyPayment(p)`) rather than pulling their data out and deciding for them |

## B2.4 The patterns you should be able to explain 🟢 🟡 ⭐

### Creational

**Factory (method or simple factory):** centralise creating the right implementation.

```csharp
public class NotifierFactory(IServiceProvider sp)
{
    public INotifier For(Channel c) => c switch
    {
        Channel.Email => sp.GetRequiredService<EmailNotifier>(),
        Channel.Sms   => sp.GetRequiredService<SmsNotifier>(),
        _ => throw new ArgumentOutOfRangeException(nameof(c)),
    };
}
```

**Builder:** construct complex objects step by step with readable code. ASP.NET Core itself is one: `WebApplication.CreateBuilder(args)` … `builder.Build()`. So are `StringBuilder`, EF Core's `ModelBuilder`, and test-data builders (`new InvoiceBuilder().Overdue().WithAmount(900).Build()`).

**Singleton:** exactly one instance. The classic hand-written version (a static `Instance` property) is **criticised**: it's global state, it hides dependencies and it's hard to test. In modern .NET, register a class as a **DI singleton** instead: you get one instance without the downsides.

### Structural

**Adapter:** make an incompatible interface fit the one you need. Wrapping Paymob, Fawry and Stripe SDKs behind your own `IPaymentGateway` is the textbook use, and your template library's Egyptian payment guides are exactly this problem.

**Decorator ⭐:** wrap an object to add behaviour **without changing it**, with the same interface in and out. Caching, logging, retries and authorisation are classic decorators.

```csharp
public class CachedRatesProvider(IRatesProvider inner, IMemoryCache cache) : IRatesProvider
{
    public Task<Rates> GetAsync(CancellationToken ct) =>
        cache.GetOrCreateAsync("rates", e => { e.AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(10); return inner.GetAsync(ct); })!;
}
```

<figure class="dia anim"><svg viewBox="0 0 720 146" role="img" aria-label="Animation: a call passes through a logging decorator and a retrying decorator to the real SMS notifier and back">
<rect class="sB" x="20" y="50" width="150" height="50" rx="8"/><text class="sT" x="95" y="72" text-anchor="middle">caller</text><text class="sC" x="95" y="88" text-anchor="middle">await SendAsync()</text>
<line class="sL" x1="170" y1="66" x2="193" y2="66" marker-end="url(#ah)"/><line class="sLg" x1="193" y1="84" x2="170" y2="84" marker-end="url(#ahg)"/>
<rect class="sV" x="195" y="50" width="150" height="50" rx="8"/><text class="sT" x="270" y="72" text-anchor="middle">LoggingNotifier</text><text class="sC" x="270" y="88" text-anchor="middle">INotifier</text>
<line class="sL" x1="345" y1="66" x2="368" y2="66" marker-end="url(#ah)"/><line class="sLg" x1="368" y1="84" x2="345" y2="84" marker-end="url(#ahg)"/>
<rect class="sW" x="370" y="50" width="150" height="50" rx="8"/><text class="sT" x="445" y="72" text-anchor="middle">RetryingNotifier</text><text class="sC" x="445" y="88" text-anchor="middle">INotifier</text>
<line class="sL" x1="520" y1="66" x2="543" y2="66" marker-end="url(#ah)"/><line class="sLg" x1="543" y1="84" x2="520" y2="84" marker-end="url(#ahg)"/>
<rect class="sG" x="545" y="50" width="150" height="50" rx="8"/><text class="sT" x="620" y="72" text-anchor="middle">SmsNotifier</text><text class="sC" x="620" y="88" text-anchor="middle">INotifier</text>
<circle class="sPw" r="6"><animateMotion dur="5s" repeatCount="indefinite" path="M95 66 H620 V84 H95"/></circle>
<text class="sC" x="270" y="130" text-anchor="middle">logs, then passes on</text><text class="sC" x="445" y="130" text-anchor="middle">retries on failure</text><text class="sC" x="620" y="130" text-anchor="middle">actually sends</text>
</svg><figcaption>Decorators share the interface of the thing they wrap, so the caller can't tell how many layers there are.</figcaption></figure>

**Facade:** one simple interface over a complicated subsystem (a `ReportService` hiding queries, PDF rendering and email).

**Proxy:** a stand-in that controls access to the real object. EF Core's lazy-loading proxies and `HttpClient`-based API clients are proxies.

**Composite:** treat individual objects and groups of them the same way, through one interface: a tree of items where a folder and a file both have `Size()`.

> [!story]
> You implemented the **Composite** pattern in an ITI lab (in `source\repos`). Explain it with your own example, then add where it shows up for real: menu trees, organisation charts, and expression trees, which is also how CS Visualizer's interpreter walks Roslyn's syntax tree.

### Behavioural

**Strategy ⭐:** a family of interchangeable algorithms behind one interface, chosen at runtime. The `IFeePolicy` example above is Strategy; so is choosing a forecasting model or a pricing rule per tenant.

<figure class="dia"><svg viewBox="0 0 720 240" role="img" aria-label="Strategy pattern: FeeCalculator uses the IFeePolicy interface, implemented by CardFee, WalletFee and a new InstapayFee">
<rect class="sB" x="20" y="40" width="200" height="62" rx="4"/><text class="sT" x="120" y="58" text-anchor="middle">FeeCalculator</text><line class="sN" x1="20" y1="64" x2="220" y2="64"/><text class="sC" x="28" y="80">- policies: IFeePolicy[]</text><text class="sC" x="28" y="98">+ Fee(method, amount)</text>
<rect class="sV" x="290" y="40" width="170" height="76" rx="4"/><text class="sC" x="375" y="56" text-anchor="middle">«interface»</text><text class="sT" x="375" y="72" text-anchor="middle">IFeePolicy</text><line class="sN" x1="290" y1="78" x2="460" y2="78"/><text class="sC" x="298" y="94">+ Method: string</text><text class="sC" x="298" y="112">+ Fee(amount)</text>
<line class="sLm" x1="220" y1="80" x2="286" y2="80" marker-end="url(#ahm)"/><text class="sC" x="253" y="72" text-anchor="middle">uses</text>
<rect class="sG" x="240" y="170" width="140" height="44" rx="4"/><text class="sT" x="310" y="188" text-anchor="middle">CardFee</text><line class="sN" x1="240" y1="194" x2="380" y2="194"/><text class="sC" x="248" y="210">Fee: amount × 2.5%</text><line class="sLm" x1="310" y1="170" x2="375" y2="118" stroke-dasharray="5 4" marker-end="url(#ahm)"/>
<rect class="sG" x="400" y="170" width="140" height="44" rx="4"/><text class="sT" x="470" y="188" text-anchor="middle">WalletFee</text><line class="sN" x1="400" y1="194" x2="540" y2="194"/><text class="sC" x="408" y="210">Fee: 2 EGP flat</text><line class="sLm" x1="470" y1="170" x2="375" y2="118" stroke-dasharray="5 4" marker-end="url(#ahm)"/>
<rect class="sA" x="560" y="170" width="140" height="44" rx="4"/><text class="sT" x="630" y="188" text-anchor="middle">InstapayFee</text><line class="sN" x1="560" y1="194" x2="700" y2="194"/><text class="sC" x="568" y="210">Fee: new: just add</text><line class="sLm" x1="630" y1="170" x2="375" y2="118" stroke-dasharray="5 4" marker-end="url(#ahm)"/>
</svg><figcaption>Strategy in UML. A new payment method is a new class registered in DI; <code>FeeCalculator</code> never changes, which is Open/Closed in practice.</figcaption></figure>

**Observer:** subjects notify subscribers of changes. .NET events, `IObservable<T>`/RxJS, and SignalR broadcasting to clients are all Observer.

**Chain of Responsibility ⭐:** a request passes along a chain of handlers, each of which can handle it, modify it or pass it on. **ASP.NET Core middleware** is exactly this ([[B3]]), as are `HttpClient` `DelegatingHandler`s and Angular interceptors.

**Command:** wrap a request as an object, so it can be queued, logged, retried or undone. Background job payloads (Hangfire) and CQRS commands are commands.

**Template method:** a base class defines an algorithm's skeleton; subclasses fill in steps. `BackgroundService.ExecuteAsync` is a small example.

**Mediator:** objects communicate through a mediator instead of referencing each other. **MediatR** popularised it in .NET for CQRS handlers. Note that **MediatR moved to a commercial licence in 2025** (version 13 onwards, free for companies under US$5 million revenue), which is why some teams now use plain handler classes or alternatives.

**State:** an object changes behaviour when its internal state changes. An invoice workflow (Draft → Sent → Paid → Refunded) where each state allows different actions.

> [!say]
> "The patterns I use most are Strategy, for swapping algorithms like fee calculations behind an interface; Decorator, for adding caching or retries without touching the original class; Adapter, for wrapping payment providers behind our own interface; and Chain of Responsibility, which is how ASP.NET Core middleware works. I'm wary of the classic Singleton; a DI singleton gives one instance without hidden global state."

## B2.5 Repository and Unit of Work with EF Core 🟡 ⭐

> [!term] Repository
> An abstraction that makes a data store look like an in-memory collection of domain objects (`GetById`, `Add`, `Remove`), hiding query details from business logic.

> [!term] Unit of Work
> Tracks all changes made during a business operation and commits them together in one transaction.

**The debate:** EF Core's `DbSet<T>` already *is* a repository, and `DbContext` already *is* a unit of work (`SaveChanges` commits everything tracked). Wrapping them in a generic `IRepository<T>` with `GetAll()` often **hides** EF's power (projections, `Include`, `AsNoTracking`) and leaks `IQueryable` anyway.

| Approach | When it fits |
|---|---|
| Use `DbContext` directly in application services | Small and medium apps; less code; easy to optimise queries |
| **Specific** repositories (`IInvoiceRepository.GetOverdueAsync(companyId)`) | When you want named, testable queries and a clear boundary for the domain |
| A **generic** repository over EF Core | Rarely worth it; mostly duplicates `DbSet` |

> [!story]
> FinSight used a generic repository plus Unit of Work. A teammate (AhmedMosad0) built that layer; you integrated and used it. A mature answer: "it gave the team a consistent pattern, but in hindsight I'd use DbContext directly with a few specific query methods, because the generic repository made projections and AsNoTracking awkward." Be clear about who built what.

## B2.6 Patterns at the application level 🟡

- **Options pattern:** strongly typed configuration (`IOptions<SmtpSettings>`) validated at startup.
- **Result pattern:** return `Result<T>` (success or a list of errors) instead of throwing for expected failures like validation, so control flow stays explicit.
- **Specification:** encapsulate a query rule (`OverdueInvoicesSpec`) so it's reusable and testable.
- **CQRS:** separate commands (writes) from queries (reads), possibly with different models ([[B9]]).
- **Outbox:** save business data and outgoing messages in one transaction, publish later ([[B8]]).

## B2.7 Code smells and refactoring 🟡

| Smell | Symptom | Typical refactoring |
|---|---|---|
| **God class** | One class with thousands of lines and many reasons to change | Extract classes by responsibility (SRP) |
| **Long method** | Scrolling to read one method | Extract method; name the steps |
| **Primitive obsession** | `string email`, `decimal amount, string currency` everywhere | Value objects: `Email`, `Money` (records) |
| **Feature envy** | A method uses another object's data more than its own | Move the method to that object |
| **Shotgun surgery** | One change requires edits in many files | Gather the knowledge in one place |
| **Anaemic domain model** | Entities are only getters and setters, with all rules in services | Move invariants into entities where they belong (debated: fine for simple CRUD) |
| **Service locator** | Classes call `serviceProvider.GetService<X>()` themselves | Constructor injection, so dependencies are visible |

**Refactor safely:** tests first, small steps, one change at a time, with the IDE's automated refactorings.

> [!lab] Refactor a switch into a Strategy
> Find a `switch` on a type or status in one of your projects (payment methods, notification channels, file formats). Refactor it into Strategy classes registered in DI, with a unit test per strategy. You now have a concrete Open/Closed story with a before-and-after.

## B2.8 Interview drill 🟢 ⭐

| Question | Strong short answer |
|---|---|
| Four pillars of OOP? | Encapsulation, abstraction, inheritance and polymorphism, each with an example from your code. |
| Explain polymorphism. | One call, behaviour chosen by the object's actual type, e.g. a list of INotifier with Email and SMS implementations. |
| Composition vs inheritance? | Prefer composing small objects behind interfaces; inheritance couples tightly and suits only true is-a relationships. |
| Single Responsibility? | A class has one reason to change: one actor or concern. |
| Open/Closed? | Add behaviour by adding code (new classes), not editing working code. |
| Liskov? | Subtypes must honour the base type's contract; throwing NotSupported in an override is a red flag. |
| Interface Segregation? | Small, focused interfaces, so clients don't depend on methods they don't use. |
| Dependency Inversion? | High-level code depends on abstractions; infrastructure implements them; DI wires them. |
| Which patterns have you used? | Strategy for fees, Decorator for caching, Adapter for payment providers, Chain of Responsibility in middleware, Composite at ITI. |
| What's wrong with Singleton? | Hidden global state, hard to test; use a DI singleton instead. |
| Decorator vs inheritance? | Decorator adds behaviour at runtime by wrapping, combinable in any order; inheritance fixes it at compile time and multiplies subclasses. |
| Do you need Repository with EF Core? | Often not: DbSet and DbContext already are a repository and unit of work. Specific query repositories can still help. |
| What's the Strategy pattern? | Interchangeable algorithms behind one interface, selected at runtime. |
| What's a code smell? | A surface sign of a deeper design problem, like a god class or primitive obsession. |

## Key takeaways

> [!check]
> - Every principle needs a concrete example, ideally from your own code.
> - SOLID helps where change is likely; YAGNI and KISS stop it becoming ceremony.
> - Know Strategy, Decorator, Adapter, Factory, Observer and Chain of Responsibility well, plus where .NET uses them.
> - DbContext is already a unit of work; justify any repository layer.
> - Composition over inheritance; DI singletons over hand-written Singletons.

## Sources

- Robert C. Martin, *Clean Architecture* (2017) and *Agile Software Development: Principles, Patterns, and Practices* (2002), the origin of SOLID as a set.
- Gamma, Helm, Johnson and Vlissides, *Design Patterns: Elements of Reusable Object-Oriented Software* (1994), the "Gang of Four" catalogue.
- Martin Fowler, *Patterns of Enterprise Application Architecture* (2002): [Repository](https://martinfowler.com/eaaCatalog/repository.html), [Unit of Work](https://martinfowler.com/eaaCatalog/unitOfWork.html); *Refactoring*, 2nd ed. (2018).
- [Refactoring.Guru](https://refactoring.guru/design-patterns), an illustrated catalogue of patterns and smells.
- Microsoft Learn: [Implement the infrastructure persistence layer with EF Core](https://learn.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/infrastructure-persistence-layer-implementation-entity-framework-core), [Options pattern](https://learn.microsoft.com/en-us/aspnet/core/fundamentals/configuration/options).
- Jimmy Bogard, [AutoMapper and MediatR commercial editions launch](https://www.jimmybogard.com/automapper-and-mediatr-commercial-editions-launch-today/) (July 2025).
