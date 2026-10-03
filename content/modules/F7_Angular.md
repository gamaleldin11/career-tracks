# Angular — Components, Signals, Dependency Injection and RxJS

Angular is the framework most Egyptian enterprise, banking and outsourcing teams use with a .NET backend, which makes it the natural partner for your stack. You've built with it twice: FinSight's front end on **Angular 17** (signals, RxJS, Chart.js, `@auth0/angular-jwt`, Jest) and the fractional-investment platform on **Angular 21** with Angular Material. Angular has changed fast since 2023, from NgModules and Zone.js to standalone components, signals, zoneless change detection and, in **v22 (June 2026)**, OnPush by default. Interviewers ask about both the old and the new way, because most companies maintain both.

> [!focus]
> **Entry must:** components with inputs and outputs; template syntax and control flow; services and dependency injection; HttpClient and interceptors; routing with lazy loading and guards; reactive forms; lifecycle hooks; the async pipe.
> **Mid adds:** signals vs RxJS and when to use each, change detection (Default, OnPush, zoneless), the higher-order mapping operators, hierarchical injectors, `@defer`, SSR and hydration, state management.
> **Most asked:** *What are signals?* · *How does change detection work, and what is OnPush?* · *switchMap vs mergeMap vs concatMap vs exhaustMap?* · *Subject vs BehaviorSubject?* · *How do you avoid memory leaks from subscriptions?* · *Template-driven vs reactive forms?* · *What's an interceptor?* · *What is dependency injection?*
> **Time budget:** 5 hours, with an Angular CLI project (`npm i -g @angular/cli && ng new`).

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
