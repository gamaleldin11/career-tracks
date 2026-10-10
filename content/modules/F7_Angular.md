# Angular — Components, Signals, Dependency Injection and RxJS

Angular is the framework most Egyptian enterprise, banking and outsourcing teams use with a .NET backend, which makes it the natural partner for your stack. You've built with it twice: FinSight's front end on **Angular 17** (signals, RxJS, Chart.js, `@auth0/angular-jwt`, Jest) and the fractional-investment platform on **Angular 21** with Angular Material. Angular has changed fast since 2023, from NgModules and Zone.js to standalone components, signals, zoneless change detection and, in **v22 (June 2026)**, OnPush by default. Interviewers ask about both the old and the new way, because most companies maintain both.

> [!focus]
> **Entry must:** components with inputs and outputs; template syntax and control flow; services and dependency injection; HttpClient and interceptors; routing with lazy loading and guards; reactive forms; lifecycle hooks; the async pipe.
> **Mid adds:** signals vs RxJS and when to use each, change detection (Default, OnPush, zoneless), the higher-order mapping operators, hierarchical injectors, `@defer`, SSR and hydration, state management.
> **Most asked:** *What are signals?* · *How does change detection work, and what is OnPush?* · *switchMap vs mergeMap vs concatMap vs exhaustMap?* · *Subject vs BehaviorSubject?* · *How do you avoid memory leaks from subscriptions?* · *Template-driven vs reactive forms?* · *What's an interceptor?* · *What is dependency injection?*
> **Time budget:** 5 hours, with an Angular CLI project (`npm i -g @angular/cli && ng new`).

## F7.0 Foundations: what a framework adds, and how Angular starts 🟢

**Library or framework?** "You call a library; a framework calls you." React is a library for rendering; you choose the router, data fetching and forms. Angular is a **framework**: it owns the component model and also ships the router, `HttpClient`, forms, dependency injection, testing setup and the build. In exchange for following its structure, every Angular codebase looks broadly the same, which is why large enterprise teams like it.

**Decorators.** `@Component({ selector, template, imports })` attaches **metadata** to a class: which tag it renders as, what its template is, what the template may use. Angular reads that metadata to create and render the component. `@Injectable()` marks a class that the injector can create.

**Templates are compiled.** During `ng build`, the Angular compiler turns every template into JavaScript instructions **ahead of time** (AOT). Template mistakes (an unknown property, a wrong input type) fail the build instead of failing in a user's browser, and no compiler is shipped to the browser.

**How the app starts:**

<figure class="dia"><svg viewBox="0 0 760 148" role="img" aria-label="Angular startup: index.html, main.ts bootstraps the App with appConfig providers, the App renders, and the router fills the outlet">
<rect class="sB" x="8" y="30" width="140" height="52" rx="8"/><text class="sT" x="78" y="54" text-anchor="middle">index.html</text><text class="sC" x="78" y="70" text-anchor="middle">&lt;app-root&gt;</text>
<line class="sLm" x1="148" y1="56" x2="156" y2="56" marker-end="url(#ahm)"/>
<rect class="sA" x="158" y="30" width="140" height="52" rx="8"/><text class="sT" x="228" y="54" text-anchor="middle">main.ts</text><text class="sC" x="228" y="70" text-anchor="middle">bootstrapApplication</text>
<line class="sLm" x1="298" y1="56" x2="306" y2="56" marker-end="url(#ahm)"/>
<rect class="sV" x="308" y="30" width="140" height="52" rx="8"/><text class="sT" x="378" y="54" text-anchor="middle">appConfig</text><text class="sC" x="378" y="70" text-anchor="middle">providers → injector</text>
<line class="sLm" x1="448" y1="56" x2="456" y2="56" marker-end="url(#ahm)"/>
<rect class="sA" x="458" y="30" width="140" height="52" rx="8"/><text class="sT" x="528" y="54" text-anchor="middle">App component</text><text class="sC" x="528" y="70" text-anchor="middle">renders its template</text>
<line class="sLm" x1="598" y1="56" x2="606" y2="56" marker-end="url(#ahm)"/>
<rect class="sG" x="608" y="30" width="140" height="52" rx="8"/><text class="sT" x="678" y="54" text-anchor="middle">router-outlet</text><text class="sC" x="678" y="70" text-anchor="middle">page for the URL</text>
<text class="sM" x="380" y="112" text-anchor="middle">provideRouter(routes) · provideHttpClient(withInterceptors([…])) · …</text>
<text class="sC" x="380" y="136" text-anchor="middle">after that, a signal change (or, in older apps, any async event) triggers re-rendering</text>
</svg><figcaption>How a standalone Angular app starts. Everything injectable is configured once, in <code>appConfig</code>.</figcaption></figure>

## F7.1 How an Angular app is built 🟢 ⭐

- **Components** combine a TypeScript class, an HTML **template** and styles. Since **v19 they're standalone by default**; NgModules are optional (you'll still see them in older code).
- **Services** hold logic and state shared between components, delivered by **dependency injection**.
- The **router** maps URLs to components.
- The **CLI** (`ng new`, `ng generate`, `ng serve`, `ng build`, `ng test`, `ng update`) is the standard toolchain; builds use esbuild and Vite under the hood.

```ts
@Component({
  selector: "app-invoice-card",
  imports: [CurrencyPipe, DatePipe],          // standalone: import what the template uses
  template: `
    <article class="card" [class.overdue]="isOverdue()">
      <h3>{{ invoice().customer }}</h3>
      <p>{{ invoice().amount | currency: 'EGP' }} · due {{ invoice().dueDate | date }}</p>
      <button type="button" (click)="paid.emit(invoice().id)">Mark paid</button>
    </article>`,
})
export class InvoiceCard {
  invoice = input.required<Invoice>();               // signal input
  paid = output<string>();                           // typed output
  isOverdue = computed(() => this.invoice().dueDate < new Date() && this.invoice().status !== "paid");
}
```

## F7.2 Templates and control flow 🟢 ⭐

| Syntax | Meaning |
|---|---|
| `{{ value }}` | Interpolation (text, escaped automatically) |
| `[property]="expr"` | Property binding: component → DOM or child input |
| `(event)="handler($event)"` | Event binding: DOM or child output → component |
| `[(ngModel)]="x"` / `[(value)]="sig"` | Two-way binding ("banana in a box"); with `model()` signals in v17.2+ |
| `[class.active]="on"`, `[style.width.px]="w"` | Class and style bindings |
| `#ref` | A template reference variable |
| `value \| pipe: arg` | Transform for display |

**Built-in control flow** (since v17, replacing `*ngIf`, `*ngFor` and `ngSwitch`):

```html
@if (invoices().length) {
  <ul>
    @for (inv of invoices(); track inv.id) {
      <li><app-invoice-card [invoice]="inv" (paid)="markPaid($event)" /></li>
    } @empty {
      <li>No invoices match.</li>
    }
  </ul>
} @else {
  <p>Loading…</p>
}

@defer (on viewport; prefetch on idle) {
  <app-revenue-chart />                     <!-- its code is lazy-loaded when scrolled into view -->
} @placeholder { <div class="skeleton"></div> }
```

`track` is **required** in `@for`; it's the equivalent of React's `key` ([[F6.2]]), so track by a stable ID.

**Pipes** format values in templates. Built-ins include `date`, `currency`, `number`, `percent`, `async`, `json`, `titlecase`. A **pure** pipe (the default) re-runs only when its input reference changes, which makes it cheap; an **impure** pipe runs on every change detection.

## F7.3 Signals 🟢 ⭐

> [!term] Signal
> A reactive value wrapper. You read it by calling it (`count()`), and Angular **tracks** which templates, `computed` values and effects read it. When the value changes, exactly those dependents update. That's fine-grained reactivity, without checking the whole component tree.

<figure class="dia anim"><svg viewBox="0 0 720 244" role="img" aria-label="Animation: updating the items signal propagates to the count and total computeds and then to the two template bindings that read them; the unrelated theme signal stays idle">
<rect class="sA" x="40" y="70" width="160" height="46" rx="8"/><text class="sT" x="120" y="89" text-anchor="middle">items</text><text class="sC" x="120" y="106" text-anchor="middle">signal</text>
<rect class="sB" x="40" y="160" width="160" height="46" rx="8"/><text class="sT" x="120" y="179" text-anchor="middle">theme</text><text class="sC" x="120" y="196" text-anchor="middle">signal</text>
<rect class="sV" x="260" y="40" width="160" height="46" rx="8"/><text class="sT" x="340" y="59" text-anchor="middle">count</text><text class="sC" x="340" y="76" text-anchor="middle">computed</text>
<rect class="sV" x="260" y="110" width="160" height="46" rx="8"/><text class="sT" x="340" y="129" text-anchor="middle">total</text><text class="sC" x="340" y="146" text-anchor="middle">computed</text>
<rect class="sG" x="500" y="30" width="160" height="46" rx="8"/><text class="sT" x="580" y="49" text-anchor="middle">badge</text><text class="sC" x="580" y="66" text-anchor="middle">{{ count() }}</text>
<rect class="sG" x="500" y="100" width="160" height="46" rx="8"/><text class="sT" x="580" y="119" text-anchor="middle">footer</text><text class="sC" x="580" y="136" text-anchor="middle">{{ total() | currency }}</text>
<rect class="sB" x="500" y="170" width="160" height="46" rx="8"/><text class="sT" x="580" y="189" text-anchor="middle">body class</text><text class="sC" x="580" y="206" text-anchor="middle">[class.dark]</text>
<line class="sLm" x1="200" y1="93" x2="258" y2="63" marker-end="url(#ahm)"/>
<line class="sLm" x1="200" y1="93" x2="258" y2="133" marker-end="url(#ahm)"/>
<line class="sLm" x1="420" y1="63" x2="498" y2="53" marker-end="url(#ahm)"/>
<line class="sLm" x1="420" y1="133" x2="498" y2="123" marker-end="url(#ahm)"/>
<line class="sLm" x1="200" y1="183" x2="498" y2="193" marker-end="url(#ahm)"/>
<circle class="sPw" r="6" opacity="0"><animateMotion dur="3s" begin="0s" repeatCount="indefinite" path="M200 93 L260 63" keyPoints="0;1;1" keyTimes="0;0.25;1" calcMode="linear"/><animate attributeName="opacity" dur="3s" begin="0s" repeatCount="indefinite" calcMode="discrete" values="1;0" keyTimes="0;0.3"/></circle>
<circle class="sPw" r="6" opacity="0"><animateMotion dur="3s" begin="0s" repeatCount="indefinite" path="M200 93 L260 133" keyPoints="0;1;1" keyTimes="0;0.25;1" calcMode="linear"/><animate attributeName="opacity" dur="3s" begin="0s" repeatCount="indefinite" calcMode="discrete" values="1;0" keyTimes="0;0.3"/></circle>
<circle class="sPw" r="6" opacity="0"><animateMotion dur="3s" begin="0.9s" repeatCount="indefinite" path="M420 63 L500 53" keyPoints="0;1;1" keyTimes="0;0.25;1" calcMode="linear"/><animate attributeName="opacity" dur="3s" begin="0.9s" repeatCount="indefinite" calcMode="discrete" values="1;0" keyTimes="0;0.3"/></circle>
<circle class="sPw" r="6" opacity="0"><animateMotion dur="3s" begin="0.9s" repeatCount="indefinite" path="M420 133 L500 123" keyPoints="0;1;1" keyTimes="0;0.25;1" calcMode="linear"/><animate attributeName="opacity" dur="3s" begin="0.9s" repeatCount="indefinite" calcMode="discrete" values="1;0" keyTimes="0;0.3"/></circle>
<text class="sWt" x="120" y="32" text-anchor="middle">items.update(…)</text>
<text class="sS" x="360" y="232" text-anchor="middle">theme didn't change, so [class.dark] isn't touched; nothing walks the whole tree</text>
</svg><figcaption>Fine-grained reactivity. A change travels only along the edges of the dependency graph that Angular recorded when each value was read.</figcaption></figure>

```ts
export class CartStore {
  private items = signal<CartItem[]>([]);                 // writable
  readonly count = computed(() => this.items().length);   // derived, cached, read-only
  readonly total = computed(() => this.items().reduce((s, i) => s + i.price * i.qty, 0));

  add(item: CartItem) { this.items.update(list => [...list, item]); }   // immutable update
  clear() { this.items.set([]); }

  constructor() {
    effect(() => localStorage.setItem("cart", JSON.stringify(this.items())));  // side effect on change
  }
}
```

| API | Use |
|---|---|
| `signal(v)` | Writable state; `.set()`, `.update()` |
| `computed(fn)` | Derived state, recomputed lazily when its dependencies change |
| `effect(fn)` | Side effects (logging, localStorage, a non-Angular widget). **Not** for deriving state |
| `linkedSignal` | Writable state that resets when a source changes (a selected item that resets when the list changes) |
| `input()`, `output()`, `model()` | Signal-based component inputs, outputs and two-way bindings |
| `resource()`, `httpResource()`, `rxResource()` | Async data as signals, with `value()`, `isLoading()`, `error()`. **Stable since v22** |
| `toSignal(obs$)` / `toObservable(sig)` | Bridge to and from RxJS |

```ts
// Data loading with httpResource: re-fetches when customerId() changes, cancels the previous request
customerId = input.required<string>();
invoices = httpResource<Invoice[]>(() => `/api/customers/${this.customerId()}/invoices`);
// template: @if (invoices.isLoading()) {…} @else if (invoices.error()) {…} @else { …invoices.value() }
```

> [!say]
> "Signals are reactive values Angular tracks: when one changes, only the computeds, effects and template bindings that read it update. I keep state in signals, derive with computed, use effects only for side effects, and since v22 I load data with httpResource. RxJS is still the right tool for event streams like search-as-you-type or websockets, and toSignal bridges the two."

## F7.4 Change detection, from Zone.js to zoneless 🟡 ⭐

**The classic model (Zone.js + Default strategy).** Zone.js patched every browser async API (events, timers, XHR). After any of them finished, Angular ran **change detection over the whole component tree**, re-evaluating every template binding to see what changed. That's simple, but it does wasted work in big apps.

**OnPush.** A component marked `ChangeDetectionStrategy.OnPush` is checked only when (1) an input changes **by reference**, (2) an event happens inside it, (3) an `async` pipe or a signal it reads emits, or (4) you mark it explicitly. That is why OnPush requires **immutable** data: mutating an array in place doesn't change its reference, so the view doesn't update.

**Zoneless.** With signals telling Angular exactly what changed, Zone.js isn't needed. **Zoneless change detection became the default for new apps in v21** (November 2025), and **v22 (June 2026) made OnPush the default strategy** for components that don't specify one.

<figure class="dia steps" data-start="1"><svg viewBox="0 0 760 262" role="img" aria-label="The same component tree checked three ways: everything with Default change detection, a path with OnPush, and a single view with signals">
<line class="sLm" x1="300" y1="54" x2="110" y2="90"/>
<line class="sLm" x1="300" y1="54" x2="300" y2="90"/>
<line class="sLm" x1="300" y1="54" x2="490" y2="90"/>
<line class="sLm" x1="300" y1="124" x2="220" y2="160"/>
<line class="sLm" x1="300" y1="124" x2="380" y2="160"/>
<line class="sLm" x1="380" y1="194" x2="380" y2="220"/>
<rect class="sB" x="240" y="20" width="120" height="34" rx="8"/><text class="sC" x="300" y="42" text-anchor="middle">App</text>
<rect class="sB" x="50" y="90" width="120" height="34" rx="8"/><text class="sC" x="110" y="112" text-anchor="middle">Header</text>
<rect class="sB" x="240" y="90" width="120" height="34" rx="8"/><text class="sC" x="300" y="112" text-anchor="middle">Dashboard</text>
<rect class="sB" x="430" y="90" width="120" height="34" rx="8"/><text class="sC" x="490" y="112" text-anchor="middle">Sidebar</text>
<rect class="sB" x="160" y="160" width="120" height="34" rx="8"/><text class="sC" x="220" y="182" text-anchor="middle">Chart</text>
<rect class="sB" x="320" y="160" width="120" height="34" rx="8"/><text class="sC" x="380" y="182" text-anchor="middle">InvoiceList</text>
<rect class="sB" x="320" y="220" width="120" height="34" rx="8"/><text class="sC" x="380" y="242" text-anchor="middle">Row ×50</text>
<g data-s="1-1"><rect class="sN" x="237" y="17" width="126" height="40" rx="10" style="stroke:var(--mid);stroke-width:3"/><rect class="sN" x="47" y="87" width="126" height="40" rx="10" style="stroke:var(--mid);stroke-width:3"/><rect class="sN" x="237" y="87" width="126" height="40" rx="10" style="stroke:var(--mid);stroke-width:3"/><rect class="sN" x="427" y="87" width="126" height="40" rx="10" style="stroke:var(--mid);stroke-width:3"/><rect class="sN" x="157" y="157" width="126" height="40" rx="10" style="stroke:var(--mid);stroke-width:3"/><rect class="sN" x="317" y="157" width="126" height="40" rx="10" style="stroke:var(--mid);stroke-width:3"/><rect class="sN" x="317" y="217" width="126" height="40" rx="10" style="stroke:var(--mid);stroke-width:3"/><text class="sT" x="574" y="40">Default + Zone.js</text><text class="sC" x="574" y="60">a click anywhere:</text><text class="sC" x="574" y="76">check every binding</text><text class="sC" x="574" y="92">in every component</text></g>
<g data-s="2-2"><rect class="sN" x="237" y="17" width="126" height="40" rx="10" style="stroke:var(--mid);stroke-width:3"/><rect class="sN" x="237" y="87" width="126" height="40" rx="10" style="stroke:var(--mid);stroke-width:3"/><rect class="sN" x="317" y="157" width="126" height="40" rx="10" style="stroke:var(--mid);stroke-width:3"/><text class="sT" x="574" y="40">OnPush</text><text class="sC" x="574" y="60">only components whose</text><text class="sC" x="574" y="76">inputs changed by reference,</text><text class="sC" x="574" y="92">or that had an event, and</text><text class="sC" x="574" y="108">their ancestors</text></g>
<g data-s="3-3"><rect class="sN" x="317" y="157" width="126" height="40" rx="10" style="stroke:var(--entry);stroke-width:3"/><text class="sT" x="574" y="40">Signals, zoneless</text><text class="sC" x="574" y="60">only the view whose</text><text class="sC" x="574" y="76">template read the</text><text class="sC" x="574" y="92">changed signal</text></g>
</svg><ol class="dia-steps">
<li>Classic Angular: Zone.js notices any async event, and change detection re-evaluates every binding in every component, top to bottom.</li>
<li>OnPush: components are skipped unless an input changed by reference, an event happened inside them, or something they read marked them dirty. Immutable data is what makes this safe.</li>
<li>Signals and zoneless: Angular knows which template read the signal that changed, so it refreshes that one view and nothing else. This is the default for new apps.</li>
</ol><figcaption>Three generations of change detection on one tree. Highlighted components are the ones Angular checks.</figcaption></figure>

| Version | Milestone |
|---|---|
| v16 (2023) | Signals introduced (developer preview) |
| v17 | New control flow (`@if`, `@for`), `@defer`, new docs at angular.dev |
| v19 | Standalone components by default |
| v20 | Signals APIs (`effect`, `linkedSignal`, `toSignal`) stable; zoneless in preview |
| v21 (Nov 2025) | **Zoneless by default**, **Vitest replaces Karma** as the default test runner, Signal Forms experimental |
| v22 (Jun 2026) | **OnPush by default**, **Signal Forms and resources stable**, Angular Aria stable, `HttpClient` uses **Fetch** by default, `@Service()` decorator |

> [!say]
> "Classic Angular used Zone.js to notice any async event and then re-check the whole component tree. OnPush limits that to components whose inputs changed by reference, whose own events fired or whose observables emitted, which is why immutability matters. Signals let Angular know exactly what changed, so new apps are zoneless by default since v21, and v22 made OnPush the default."

> [!story]
> FinSight was built on Angular 17 with **signals** for dashboard state and RxJS for HTTP. The upgrade story is a good mid-level answer: "on a newer version I'd move the HTTP calls to httpResource, drop Zone.js, and rely on OnPush, which v22 now makes the default."

## F7.5 Dependency injection 🟢 ⭐

> [!term] Dependency injection (DI)
> Instead of a class creating its own dependencies (`new HttpClient()`), it **asks** for them, and the framework supplies instances from **injectors**. That makes classes easy to test (pass a fake) and lets you swap implementations through configuration. It's the same idea as ASP.NET Core's DI container ([[B1]]).

```ts
@Injectable({ providedIn: "root" })            // one app-wide singleton, tree-shakable
export class InvoiceApi {
  private http = inject(HttpClient);            // the inject() function (preferred over constructor params)
  list(status?: string) {
    return this.http.get<Invoice[]>("/api/invoices", { params: status ? { status } : {} });
  }
}
// v22 shorthand for the same thing:  @Service() export class InvoiceApi { … }
```

- **Hierarchical injectors:** the root (application) injector, then environment injectors for lazy routes, then **element injectors** for components. `providers: [X]` on a component gives each instance of that component **its own** X, which is handy for per-widget state.
- **`InjectionToken`** provides non-class values (configuration objects, an API base URL).
- `useClass`, `useValue`, `useFactory` and `useExisting` configure what gets injected; that's how tests swap in fakes.

<figure class="dia"><svg viewBox="0 0 720 230" role="img" aria-label="Angular injector hierarchy: a root injector with app singletons, a lazy route injector, and element injectors that give each chart component its own store">
<rect class="sV" x="130" y="14" width="460" height="52" rx="8"/><text class="sT" x="360" y="38" text-anchor="middle">root injector</text><text class="sC" x="360" y="54" text-anchor="middle">providedIn: "root" · HttpClient · InvoiceApi (one each)</text>
<rect class="sA" x="70" y="100" width="260" height="52" rx="8"/><text class="sT" x="200" y="124" text-anchor="middle">route injector (lazy /reports)</text><text class="sC" x="200" y="140" text-anchor="middle">ReportsService for that feature</text>
<rect class="sG" x="390" y="100" width="260" height="52" rx="8"/><text class="sT" x="520" y="124" text-anchor="middle">element injectors</text><text class="sC" x="520" y="140" text-anchor="middle">providers: [ChartStore] on a component</text>
<line class="sLm" x1="330" y1="66" x2="220" y2="98" marker-end="url(#ahm)"/><line class="sLm" x1="390" y1="66" x2="500" y2="98" marker-end="url(#ahm)"/>
<rect class="sB" x="390" y="180" width="80" height="40" rx="6"/><text class="sC" x="430" y="198" text-anchor="middle">Chart 1</text><text class="sC" x="430" y="212" text-anchor="middle">own store</text><line class="sLm" x1="520" y1="152" x2="430" y2="178"/>
<rect class="sB" x="480" y="180" width="80" height="40" rx="6"/><text class="sC" x="520" y="198" text-anchor="middle">Chart 2</text><text class="sC" x="520" y="212" text-anchor="middle">own store</text><line class="sLm" x1="520" y1="152" x2="520" y2="178"/>
<rect class="sB" x="570" y="180" width="80" height="40" rx="6"/><text class="sC" x="610" y="198" text-anchor="middle">Chart 3</text><text class="sC" x="610" y="212" text-anchor="middle">own store</text><line class="sLm" x1="520" y1="152" x2="610" y2="178"/>
<text class="sS" x="200" y="200" text-anchor="middle">a lookup walks up: element → route → root</text>
</svg><figcaption>Hierarchical injection. Ask for a dependency and Angular walks up from the component until an injector provides it.</figcaption></figure>

## F7.6 RxJS essentials 🟢 🟡 ⭐

An **Observable** is a lazy stream of values over time ([[F4.8]]). Angular's `HttpClient`, router events and reactive form `valueChanges` are all Observables.

| Subject type | Behaviour | Use |
|---|---|---|
| `Subject` | Multicasts; late subscribers miss earlier values | Event buses |
| `BehaviorSubject(initial)` | Holds the **current value**, given immediately to new subscribers | State in pre-signals services |
| `ReplaySubject(n)` | Replays the last n values to new subscribers | Caching recent events |

### The four flattening operators ⭐

When each value from one stream starts another async operation (an HTTP call), you pick a strategy for overlapping calls:

| Operator | When a new value arrives while the previous inner call is running… | Use for |
|---|---|---|
| **`switchMap`** | **Cancel** the previous call, switch to the new one | Search-as-you-type, route-param changes: only the latest matters |
| **`mergeMap`** | Run them **in parallel** | Independent requests where order doesn't matter |
| **`concatMap`** | **Queue** it; run one at a time, in order | Saves that must happen in sequence |
| **`exhaustMap`** | **Ignore** the new value until the current call finishes | A "Pay" or "Login" button clicked repeatedly |

<figure class="dia"><svg viewBox="0 0 720 276" role="img" aria-label="Marble diagram: three source values each start a two-unit request; switchMap cancels earlier ones, mergeMap overlaps, concatMap queues, exhaustMap ignores b">
<text class="sM" x="140" y="34" text-anchor="end">source</text><line class="sLm" x1="150" y1="30" x2="700" y2="30" marker-end="url(#ahm)"/>
<circle class="sA" cx="175.0" cy="30" r="12"/><text class="sT" x="175" y="35" text-anchor="middle">a</text>
<circle class="sA" cx="250.0" cy="30" r="12"/><text class="sT" x="250" y="35" text-anchor="middle">b</text>
<circle class="sA" cx="300.0" cy="30" r="12"/><text class="sT" x="300" y="35" text-anchor="middle">c</text>
<text class="sM" x="140" y="84" text-anchor="end">switchMap</text><line class="sLm" x1="150" y1="80" x2="700" y2="80" marker-end="url(#ahm)"/>
<text class="sRt" x="250" y="85" text-anchor="middle">✕ A</text>
<text class="sRt" x="300" y="85" text-anchor="middle">✕ B</text>
<circle class="sG" cx="400.0" cy="80" r="12"/><text class="sT" x="400" y="85" text-anchor="middle">C</text>
<text class="sGt" x="704" y="72" text-anchor="end">cancels the previous inner call</text>
<text class="sM" x="140" y="128" text-anchor="end">mergeMap</text><line class="sLm" x1="150" y1="124" x2="700" y2="124" marker-end="url(#ahm)"/>
<circle class="sG" cx="275.0" cy="124" r="12"/><text class="sT" x="275" y="129" text-anchor="middle">A</text>
<circle class="sG" cx="350.0" cy="124" r="12"/><text class="sT" x="350" y="129" text-anchor="middle">B</text>
<circle class="sG" cx="400.0" cy="124" r="12"/><text class="sT" x="400" y="129" text-anchor="middle">C</text>
<text class="sC" x="704" y="116" text-anchor="end">runs them all at once</text>
<text class="sM" x="140" y="172" text-anchor="end">concatMap</text><line class="sLm" x1="150" y1="168" x2="700" y2="168" marker-end="url(#ahm)"/>
<circle class="sG" cx="275.0" cy="168" r="12"/><text class="sT" x="275" y="173" text-anchor="middle">A</text>
<circle class="sG" cx="375.0" cy="168" r="12"/><text class="sT" x="375" y="173" text-anchor="middle">B</text>
<circle class="sG" cx="475.0" cy="168" r="12"/><text class="sT" x="475" y="173" text-anchor="middle">C</text>
<text class="sC" x="704" y="160" text-anchor="end">one at a time, in order</text>
<text class="sM" x="140" y="216" text-anchor="end">exhaustMap</text><line class="sLm" x1="150" y1="212" x2="700" y2="212" marker-end="url(#ahm)"/>
<circle class="sG" cx="275.0" cy="212" r="12"/><text class="sT" x="275" y="217" text-anchor="middle">A</text>
<circle class="sG" cx="400.0" cy="212" r="12"/><text class="sT" x="400" y="217" text-anchor="middle">C</text>
<text class="sWt" x="704" y="204" text-anchor="end">ignores b while A runs</text>
<text class="sC" x="360" y="266" text-anchor="middle">each source value starts a request that takes 2 time units; capital letters are its result</text>
</svg><figcaption>The flattening operators as a marble diagram. The only difference is what happens when a new value arrives while an inner call is still running.</figcaption></figure>

```ts
results$ = this.searchControl.valueChanges.pipe(
  debounceTime(300),                       // wait for a pause in typing
  map(q => q.trim()),
  distinctUntilChanged(),                  // skip if unchanged
  filter(q => q.length >= 2),
  switchMap(q => this.api.search(q).pipe(  // cancel stale requests
    catchError(() => of([])),              // keep the stream alive on error
  )),
);
```

> [!say]
> "switchMap cancels the previous inner request, so it's right for search where only the latest result matters. mergeMap runs them in parallel, concatMap queues them in order, and exhaustMap ignores new triggers while one is running, which is ideal for a submit button."

**Combining:** `combineLatest` emits whenever any source emits (after each has emitted once); `forkJoin` waits for all to **complete** and emits once (like `Promise.all`); `withLatestFrom` samples another stream.

### Not leaking subscriptions 🟢 ⭐

An unsubscribed Observable keeps its callback, and everything that callback references, alive. In order of preference:

1. The **`async` pipe** or **`toSignal`** in templates: they subscribe and unsubscribe for you.
2. **`takeUntilDestroyed()`** (from `@angular/core/rxjs-interop`) in an injection context.
3. Manual `subscription.unsubscribe()` in `ngOnDestroy`.

HTTP Observables complete after one response, so they don't leak, but long-lived streams (`valueChanges`, `interval`, websockets, store selectors) do.

## F7.7 HTTP and interceptors 🟢 ⭐

> [!term] HTTP interceptor
> A function that sees every request and response passing through `HttpClient`, so cross-cutting concerns live in one place: attaching the auth token, adding headers, mapping errors, showing a global spinner, retrying.

```ts
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(AuthService).token();
  const authReq = token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;
  return next(authReq).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401) inject(Router).navigate(["/login"]);
      return throwError(() => err);
    }),
  );
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(withInterceptors([authInterceptor])),   // uses fetch by default since v22
  ],
};
```

Requests are **immutable**; you `clone()` them to change them.

<figure class="dia"><svg viewBox="0 0 720 130" role="img" aria-label="An HTTP request passes from the component through HttpClient and two interceptors to the backend, and the response returns through them in reverse">
<rect class="sB" x="8" y="40" width="128" height="52" rx="8"/><text class="sT" x="72" y="64" text-anchor="middle">component</text><text class="sC" x="72" y="80" text-anchor="middle">api.list()</text>
<line class="sL" x1="136" y1="58" x2="148" y2="58" marker-end="url(#ah)"/><line class="sLg" x1="148" y1="76" x2="136" y2="76" marker-end="url(#ahg)"/>
<rect class="sA" x="150" y="40" width="128" height="52" rx="8"/><text class="sT" x="214" y="71" text-anchor="middle">HttpClient</text>
<line class="sL" x1="278" y1="58" x2="290" y2="58" marker-end="url(#ah)"/><line class="sLg" x1="290" y1="76" x2="278" y2="76" marker-end="url(#ahg)"/>
<rect class="sW" x="292" y="40" width="128" height="52" rx="8"/><text class="sT" x="356" y="64" text-anchor="middle">authInterceptor</text><text class="sC" x="356" y="80" text-anchor="middle">add Bearer token</text>
<line class="sL" x1="420" y1="58" x2="432" y2="58" marker-end="url(#ah)"/><line class="sLg" x1="432" y1="76" x2="420" y2="76" marker-end="url(#ahg)"/>
<rect class="sW" x="434" y="40" width="128" height="52" rx="8"/><text class="sT" x="498" y="64" text-anchor="middle">errorInterceptor</text><text class="sC" x="498" y="80" text-anchor="middle">401 → /login</text>
<line class="sL" x1="562" y1="58" x2="574" y2="58" marker-end="url(#ah)"/><line class="sLg" x1="574" y1="76" x2="562" y2="76" marker-end="url(#ahg)"/>
<rect class="sG" x="576" y="40" width="128" height="52" rx="8"/><text class="sT" x="640" y="64" text-anchor="middle">backend</text><text class="sC" x="640" y="80" text-anchor="middle">ASP.NET Core</text>
<text class="sC" x="360" y="22" text-anchor="middle">request →  (each interceptor clones and passes it on with next(req))</text>
<text class="sGt" x="360" y="118" text-anchor="middle">← response flows back through them in reverse order</text>
</svg><figcaption>Interceptors form a chain around every request. Order matters: they run in the order listed on the way out and in reverse on the way back.</figcaption></figure>

> [!story]
> FinSight used `@auth0/angular-jwt`, whose interceptor attaches the JWT to API calls automatically. Explaining what the library does under the hood (an interceptor that clones each request with a `Bearer` header for allowed domains) shows understanding rather than just usage.

## F7.8 Routing 🟢 ⭐

```ts
export const routes: Routes = [
  { path: "", component: HomePage },
  { path: "login", loadComponent: () => import("./auth/login.page").then(m => m.LoginPage) },
  {
    path: "invoices",
    canActivate: [authGuard],
    loadChildren: () => import("./invoices/invoices.routes").then(m => m.INVOICE_ROUTES),  // lazy-loaded chunk
  },
  { path: "**", component: NotFoundPage },
];

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  return auth.isLoggedIn() ? true : inject(Router).createUrlTree(["/login"]);
};
```

<figure class="dia steps"><svg viewBox="0 0 720 236" role="img" aria-label="Navigating to /invoices/42: the router matches the invoices route; while logged out the auth guard redirects to the login page and the invoices chunk is not downloaded; after login the guard allows activation, the lazy chunk is fetched once, and the child route :id renders the invoice page with id 42 as an input">
<text class="sS" x="130" y="22" text-anchor="middle">routes, checked top to bottom</text><text class="sS" x="400" y="22" text-anchor="middle">authGuard</text><text class="sS" x="610" y="22" text-anchor="middle">browser</text>
<rect class="sN" x="14" y="32" width="236" height="28" rx="6"/><text class="sS" x="24" y="51" xml:space="preserve" style="white-space:pre">""  → HomePage</text>
<rect class="sN" x="14" y="66" width="236" height="28" rx="6"/><text class="sS" x="24" y="85" xml:space="preserve" style="white-space:pre">"login"  → lazy LoginPage</text>
<rect class="sN" x="14" y="100" width="236" height="28" rx="6"/><text class="sS" x="24" y="119" xml:space="preserve" style="white-space:pre">"invoices"  → guard + lazy chunk</text>
<rect class="sN" x="14" y="134" width="236" height="28" rx="6"/><text class="sS" x="24" y="153" xml:space="preserve" style="white-space:pre">"**"  → NotFoundPage</text>
<rect class="sN" x="300" y="32" width="200" height="96" rx="8"/><rect class="sN" x="520" y="32" width="186" height="196" rx="8"/>
<g data-s="1-1"><text class="sT" x="24" y="196" xml:space="preserve" style="white-space:pre">navigate("/invoices/42")</text><rect class="sA" x="14" y="100" width="236" height="28" rx="6" style="fill:none;stroke-width:2.5"/><text class="sS" x="132" y="220" text-anchor="middle">"" and "login" do not match; "invoices" does</text><text class="sS" x="613" y="54" text-anchor="middle">URL: /invoices/42</text></g>
<g data-s="2-2"><rect class="sA" x="14" y="100" width="236" height="28" rx="6" style="fill:none;stroke-width:2.5"/><text class="sS" x="400" y="56" text-anchor="middle">auth.isLoggedIn()</text><text class="sRt" x="400" y="80" text-anchor="middle">false</text><text class="sRt" x="400" y="104" text-anchor="middle">→ UrlTree("/login")</text><text class="sWt" x="613" y="54" text-anchor="middle">URL: /login</text><text class="sS" x="613" y="80" text-anchor="middle">LoginPage chunk loads</text><text class="sS" x="613" y="104" text-anchor="middle">invoices chunk: not fetched</text><rect class="sW" x="14" y="66" width="236" height="28" rx="6" style="fill:none;stroke-width:2.5"/><line class="sLw" x1="250" y1="113" x2="250" y2="63" marker-end="url(#ahw)"/></g>
<g data-s="3-3"><rect class="sG" x="14" y="100" width="236" height="28" rx="6" style="fill:none;stroke-width:2.5"/><text class="sS" x="400" y="56" text-anchor="middle">auth.isLoggedIn()</text><text class="sGt" x="400" y="80" text-anchor="middle">true</text><text class="sGt" x="400" y="104" text-anchor="middle">→ activate</text><text class="sGt" x="613" y="54" text-anchor="middle">GET invoices-chunk.js</text><text class="sS" x="613" y="72" text-anchor="middle">(first visit only)</text></g>
<g data-s="4-4"><rect class="sG" x="14" y="100" width="236" height="28" rx="6" style="fill:none;stroke-width:2.5"/><rect class="sB" x="300" y="146" width="200" height="82" rx="8"/><text class="sT" x="400" y="166" text-anchor="middle">INVOICE_ROUTES</text><text class="sS" x="312" y="188" xml:space="preserve" style="white-space:pre">":id" → InvoicePage</text><text class="sGt" x="400" y="212" text-anchor="middle">id = input("42")</text><text class="sS" x="613" y="54" text-anchor="middle">URL: /invoices/42</text><text class="sGt" x="613" y="80" text-anchor="middle">InvoicePage rendered</text><text class="sS" x="613" y="104" text-anchor="middle">next visit: chunk cached</text></g>
</svg><ol class="dia-steps">
<li>The router tries the routes in order. Paths are matched by segment: "invoices" matches the first segment of /invoices/42.</li>
<li>Before activating, canActivate runs authGuard. Logged out, it returns a UrlTree, so the router redirects to /login and never downloads the invoices code.</li>
<li>After sign-in the guard returns true, and loadChildren fetches the feature chunk for the first time.</li>
<li>The child routes take over: ":id" matches 42, which arrives as a component input. The guard improved the UX; the API still checks every request.</li>
</ol><figcaption>The route configuration above in action: matching, a guard redirect, lazy loading on first visit, and child routes.</figcaption></figure>

- **Lazy loading** (`loadComponent`, `loadChildren`) splits each feature into its own JavaScript chunk, downloaded on first visit.
- **Guards** (`canActivate`, `canMatch`, `canDeactivate` for "unsaved changes") are UX, **not security**: the API must still authorise every request ([[S9.6]]).
- **Resolvers** fetch data before activation. With `withComponentInputBinding()`, route params arrive as component inputs (`id = input<string>()`).

## F7.9 Forms 🟢 ⭐

| | Template-driven | Reactive | Signal Forms (stable in v22) |
|---|---|---|---|
| Model lives in | The template (`ngModel`) | The component class (`FormGroup`, `FormControl`) | A signal holding the model |
| Validation | Directives in HTML | Validator functions in code | Schema functions on the model |
| Testing | Harder (needs the DOM) | Easy (pure TypeScript) | Easy |
| Best for | Very simple forms | Complex and dynamic forms (today's common choice) | New code on v22+ |

```ts
private fb = inject(NonNullableFormBuilder);
form = this.fb.group({
  customer: ["", [Validators.required, Validators.maxLength(120)]],
  amount: [0, [Validators.required, Validators.min(1)]],
  lines: this.fb.array<FormGroup>([]),                 // dynamic rows
});
submit() {
  if (this.form.invalid) { this.form.markAllAsTouched(); return; }
  this.api.create(this.form.getRawValue()).subscribe();  // fully typed since v14
}
```

```html
<form [formGroup]="form" (ngSubmit)="submit()">
  <label for="customer">Customer</label>
  <input id="customer" formControlName="customer" [attr.aria-invalid]="form.controls.customer.invalid && form.controls.customer.touched">
  @if (form.controls.customer.touched && form.controls.customer.hasError('required')) {
    <p class="error">Customer is required</p>
  }
  <button type="submit">Save</button>
</form>
```

<figure class="dia steps" data-start="1"><svg viewBox="0 0 720 242" role="img" aria-label="An Angular reactive form tree: a FormGroup with customer, amount and a FormArray of line groups; an invalid amount makes the whole form invalid, and an invalid line deep in the array does the same">
<rect class="sB" x="270" y="20" width="180" height="40" rx="8"/><text class="sT" x="360" y="38" text-anchor="middle">form (FormGroup)</text>
<rect class="sN" x="60" y="96" width="180" height="40" rx="8"/><text class="sC" x="150" y="114" text-anchor="middle">customer</text><text class="sS" x="150" y="130" text-anchor="middle">required, max 120</text>
<line class="sLm" x1="360" y1="60" x2="150" y2="96"/>
<rect class="sN" x="270" y="96" width="180" height="40" rx="8"/><text class="sC" x="360" y="114" text-anchor="middle">amount</text><text class="sS" x="360" y="130" text-anchor="middle">min 1</text>
<line class="sLm" x1="360" y1="60" x2="360" y2="96"/>
<rect class="sN" x="480" y="96" width="180" height="40" rx="8"/><text class="sC" x="570" y="114" text-anchor="middle">lines (FormArray)</text>
<line class="sLm" x1="360" y1="60" x2="570" y2="96"/>
<rect class="sN" x="480" y="170" width="180" height="36" rx="8"/><text class="sC" x="570" y="192" text-anchor="middle">line 1 (FormGroup)</text><line class="sLm" x1="570" y1="136" x2="570" y2="170"/>
<g data-s="1-1"><text class="sGt" x="360" y="230" text-anchor="middle">every control VALID, so the form is VALID and Save works</text></g>
<g data-s="2-3"><rect class="sR" x="270" y="96" width="180" height="40" rx="8" opacity=".5"/><text class="sRt" x="360" y="152" text-anchor="middle">amount = 0 → errors: { min }</text></g>
<g data-s="3-3"><rect class="sR" x="270" y="20" width="180" height="40" rx="8" opacity=".5"/><text class="sRt" x="470" y="40">INVALID: one bad child is enough</text><text class="sRt" x="360" y="230" text-anchor="middle">submit(): markAllAsTouched() shows every error, then stops</text></g>
<g data-s="4-4"><rect class="sR" x="480" y="170" width="180" height="36" rx="8" opacity=".5"/><rect class="sR" x="480" y="96" width="180" height="40" rx="8" opacity=".5"/><rect class="sR" x="270" y="20" width="180" height="40" rx="8" opacity=".5"/><text class="sRt" x="470" y="40">INVALID from deep inside</text><text class="sC" x="360" y="230" text-anchor="middle">a FormArray row added later rolls up the same way</text></g>
</svg><ol class="dia-steps">
<li>The form is a tree: a <code>FormGroup</code> with two controls and a <code>FormArray</code> of line groups. Each control runs its validators.</li>
<li>The user leaves amount at 0: <code>Validators.min(1)</code> sets <code>errors: { min: … }</code> on that control.</li>
<li>Validity rolls up: one invalid child makes every ancestor invalid, so <code>form.invalid</code> is true and <code>submit()</code> marks everything touched and returns.</li>
<li>The same happens from deep inside a dynamic row in the <code>FormArray</code>. Check <code>form.invalid</code> once at the top; read errors per control.</li>
</ol><figcaption>Reactive forms as a tree of controls: status and value propagate upward.</figcaption></figure>

**Custom validators** are functions `(control) => ValidationErrors | null`; **async validators** (is this email taken?) return an Observable or Promise of the same.

## F7.10 Lifecycle hooks 🟢 ⭐

| Hook | When | Typical use |
|---|---|---|
| `constructor` | Class created | Injection only; inputs aren't set yet |
| `ngOnChanges(changes)` | Before init and whenever an `@Input` reference changes | React to input changes (with signal inputs, use `computed` or `effect` instead) |
| `ngOnInit` | Once, after the first inputs are set | Start loading data |
| `ngAfterViewInit` | After the component's view and children render | Work with `viewChild` elements, third-party widgets |
| `ngOnDestroy` | Before removal | Clean up subscriptions, timers, listeners (or use `DestroyRef`) |

With signals, many hooks become unnecessary: `computed` replaces `ngOnChanges` logic; `afterNextRender()` replaces many `ngAfterViewInit` uses; `DestroyRef.onDestroy()` and `takeUntilDestroyed()` replace `ngOnDestroy` boilerplate.

## F7.11 Performance and rendering 🟡 ⭐

- **OnPush** everywhere (now the default), immutable data, signals.
- **`track`** by ID in `@for`, so Angular reuses DOM rows.
- **Lazy routes** and **`@defer`** blocks for heavy, below-the-fold or rarely used parts.
- **Pure pipes** instead of method calls in templates; a method called in a template runs on every check.
- **`NgOptimizedImage`** (`<img ngSrc>`) enforces width and height, lazy loading and priority hints.
- **SSR and hydration** (`ng new --ssr`): the server renders HTML for fast first paint and SEO, then the client **hydrates** it; **incremental hydration** hydrates `@defer` blocks only when they're needed.
- **Virtual scrolling** from the CDK for long lists.

## F7.12 State management 🟡

| Approach | When |
|---|---|
| Component signals | State used by one component |
| A service holding signals (a "signal store" by hand) | Feature or app state shared by several components: the default today |
| **NgRx SignalStore** | Structured stores with signals, less boilerplate than classic NgRx |
| **NgRx Store** (Redux pattern: actions, reducers, selectors, effects) | Large apps with complex shared state and strict traceability; common in older enterprise code |

> [!lab] Upgrade drill
> Take one FinSight Angular 17 component that subscribes to an HTTP call in `ngOnInit`. Rewrite it with `httpResource`, signal inputs and `@if`/`@for`, mark it OnPush, and remove the manual subscription. Run `ng update` on a copy of the project to see what the migrations do. That's a concrete "I modernised a component" story.

## F7.13 Interview drill 🟢 ⭐

| Question | Strong short answer |
|---|---|
| What is a signal? | A reactive value Angular tracks; when it changes, only the computeds, effects and bindings that read it update. |
| computed vs effect? | computed derives a value; effect performs side effects. Don't use effect to set other state. |
| How does change detection work? | Classically, Zone.js triggers a check of the whole tree after async events; OnPush limits checks; signals enable zoneless, targeted updates (default since v21; OnPush default since v22). |
| What triggers an OnPush component to update? | An input reference change, an event inside it, an async pipe or signal it reads emitting, or an explicit markForCheck. |
| switchMap vs mergeMap vs concatMap vs exhaustMap? | Cancel the previous / run in parallel / queue in order / ignore new until done. |
| Subject vs BehaviorSubject? | BehaviorSubject holds a current value and gives it to new subscribers; Subject doesn't. |
| How do you avoid subscription leaks? | async pipe or toSignal, takeUntilDestroyed, or unsubscribe in ngOnDestroy. |
| What is an interceptor? | A function in HttpClient's pipeline that can modify every request and response, e.g. add auth headers or handle 401s. |
| Template-driven vs reactive forms? | Template-driven keeps the model in the template; reactive keeps a typed model in code, easier to test and to make dynamic. |
| What is dependency injection? | Classes declare their dependencies and the injector provides instances, improving testability and configurability. |
| providedIn: 'root' vs component providers? | root gives one app-wide singleton; component providers give each component instance its own. |
| How do you lazy-load a feature? | loadComponent or loadChildren in the routes, or @defer blocks in templates. |
| Is a route guard security? | No, it's UX. The API must authorise every request. |
| What does track do in @for? | Identifies items so Angular reuses DOM nodes when the list changes. |
| What's new in Angular 22? | OnPush default, stable Signal Forms and resources, Angular Aria, HttpClient on fetch, the @Service decorator. |

## Key takeaways

> [!check]
> - Standalone components, signals for state, computed for derivation, effects only for side effects.
> - OnPush plus immutability plus signals: the modern performance model, now the default.
> - Pick the right flattening operator: switchMap for search, exhaustMap for submit.
> - Interceptors centralise auth and error handling; guards are UX, not security.
> - Know both eras: NgModules, Zone.js and BehaviorSubjects still run in most production code.

## Sources

- [angular.dev](https://angular.dev/overview): [Signals](https://angular.dev/guide/signals), [Components](https://angular.dev/guide/components), [Control flow](https://angular.dev/guide/templates/control-flow), [Deferrable views](https://angular.dev/guide/templates/defer), [Dependency injection](https://angular.dev/guide/di), [HTTP interceptors](https://angular.dev/guide/http/interceptors), [Routing](https://angular.dev/guide/routing), [Reactive forms](https://angular.dev/guide/forms/reactive-forms), [Zoneless](https://angular.dev/guide/zoneless), [Release schedule](https://angular.dev/reference/releases).
- Ninja Squad, [What's new in Angular 22.0](https://blog.ninja-squad.com/2026/06/03/what-is-new-angular-22.0) (June 2026), for the v22 changes.
- [RxJS operators reference](https://rxjs.dev/guide/operators).
- [NgRx SignalStore](https://ngrx.io/guide/signals).
