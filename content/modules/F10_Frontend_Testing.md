# Frontend Testing — Unit, Component and End-to-End Tests That Earn Their Keep

Testing is the gap your own audit flags most often, and interviewers know juniors rarely test UI. Being able to say what you'd test, at which level, and with which tool, and having a small test suite to show, moves you ahead of most candidates. FinSight's Angular front end had Jest configured; CS Visualizer's differential tests show you already think in terms of "prove it's right".

> [!focus]
> **Entry must:** explain the testing pyramid or trophy; write a unit test with arrange-act-assert; write a component test that finds elements by role and simulates a user; explain mocks vs stubs vs spies; know what end-to-end tests are for.
> **Mid adds:** mocking the network with MSW or HttpTestingController, Playwright end-to-end tests with stable locators, fixing flaky tests, accessibility tests, what coverage does and doesn't tell you, testing in CI.
> **Most asked:** *How do you test a component?* · *Unit vs integration vs E2E?* · *What do you mock?* · *Why do tests become flaky?* · *Is 100% coverage a good goal?* · *What's the difference between a mock and a stub?*
> **Time budget:** 3 hours, plus writing five real tests.

## F10.1 What different tests are for 🟢 ⭐

| Level | Tests | Speed | Confidence it works for users | Tools |
|---|---|---|---|---|
| **Static** | Types, lint rules | Instant | Catches typos and whole bug classes | TypeScript, ESLint |
| **Unit** | One function, pipe, hook or service, in isolation | Milliseconds | Low to medium | Vitest, Jest |
| **Component / integration** | A component (or a few together) rendered in a DOM, interacting like a user | Fast | **High, for the cost** | Testing Library, Angular TestBed, Vitest browser mode |
| **End-to-end (E2E)** | The real app in a real browser against a real or staged backend | Seconds each | Highest | **Playwright**, Cypress |

> [!term] Testing pyramid vs testing trophy
> The **pyramid** says: many unit tests, fewer integration tests, very few E2E tests, because higher tests are slower and more brittle. The **trophy** (Kent C. Dodds) argues that for UI code the bulk should be **integration/component tests**, on top of static checks, because they give the most confidence per minute. Both agree: a few E2E tests for the critical journeys, not hundreds.

> [!say]
> "I lean on TypeScript and lint for whole classes of bugs, write unit tests for logic like formatters and reducers, put most effort into component tests that render the UI and interact the way a user does, and keep a handful of Playwright tests for the critical journeys: login, checkout, the core workflow."

## F10.2 Test behaviour, not implementation 🟢 ⭐

A good test checks what a **user** (or a caller) can observe: text on screen, a button's state, a request sent, a value returned. A bad test checks internals (a private method was called, the state variable equals 3, the component has a CSS class), so it breaks on every refactor even when the behaviour is fine, and passes when the behaviour is broken.

**The guiding principle of Testing Library:** the closer a test is to the way people actually use the software, the more confidence it gives.

**Arrange, Act, Assert** in every test:

```ts
import { describe, it, expect } from "vitest";
import { formatEgp } from "./money";

describe("formatEgp", () => {
  it("formats whole pounds with grouping", () => {
    // Arrange
    const amount = 1250000;
    // Act
    const text = formatEgp(amount);
    // Assert
    expect(text).toBe("EGP 1,250,000.00");
  });

  it.each([[0, "EGP 0.00"], [-15.5, "-EGP 15.50"]])("formats %d as %s", (input, expected) => {
    expect(formatEgp(input)).toBe(expected);
  });
});
```

## F10.3 Test doubles: mocks, stubs, spies, fakes 🟢 ⭐

| Double | What it does | Example |
|---|---|---|
| **Dummy** | Fills a parameter, never used | An empty logger |
| **Stub** | Returns canned answers | `getRates()` always returns `{ USD: 48.5 }` |
| **Spy** | Records how it was called (and may call through) | Check `track()` was called once with `"invoice_paid"` |
| **Mock** | A spy with expectations built in | "Expect `save` to be called with this invoice" |
| **Fake** | A working lightweight implementation | An in-memory repository; MSW serving fake API responses |

```ts
const track = vi.fn();                                   // spy
const api = { getInvoices: vi.fn().mockResolvedValue([invoice]) };   // stub
vi.useFakeTimers(); vi.advanceTimersByTime(300);         // control debounce timers
```

**What to mock:** the **edges** you don't control (the network, time, randomness, browser APIs like `localStorage`, third-party SDKs). **What not to mock:** your own child components and internal modules, in most cases. Mocking them makes tests pass while the real integration is broken.

## F10.4 Component tests with Testing Library 🟢 ⭐

```tsx
// React + Vitest + Testing Library
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

it("lets the user mark an overdue invoice as paid", async () => {
  const onPay = vi.fn();
  const user = userEvent.setup();
  render(<InvoiceList invoices={[{ id: "7", customer: "Nile Foods", amount: 900, status: "overdue" }]} onPay={onPay} />);

  expect(screen.getByRole("heading", { name: /invoices \(1\)/i })).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: /mark paid/i }));
  expect(onPay).toHaveBeenCalledWith("7");
});
```

**Query priority**, from most to least preferred, because it mirrors how people find things and quietly checks accessibility:

1. `getByRole("button", { name: "Save" })`: if this fails, a screen-reader user can't find it either.
2. `getByLabelText("Email")` for form fields.
3. `getByPlaceholderText`, `getByText`, `getByDisplayValue`.
4. `getByAltText`, `getByTitle`.
5. `getByTestId`: a last resort.

| Variant | Behaviour |
|---|---|
| `getBy…` | Returns the element or **throws** if it's missing: use for things that should be there now |
| `queryBy…` | Returns `null` if missing: use to assert something is **absent** |
| `findBy…` | Returns a promise that **waits** for it to appear: use after async work |

Use **`user-event`**, not `fireEvent`: it simulates full interactions (focus, key presses, pointer events) as a browser would.

### Angular 🟢

```ts
// Angular + Vitest (the default test runner since Angular 21) + Testing Library for Angular
import { render, screen } from "@testing-library/angular";
import userEvent from "@testing-library/user-event";

it("emits the id when Mark paid is clicked", async () => {
  const paid = vi.fn();
  await render(InvoiceCard, { inputs: { invoice: overdueInvoice }, on: { paid } });
  await userEvent.click(screen.getByRole("button", { name: /mark paid/i }));
  expect(paid).toHaveBeenCalledWith(overdueInvoice.id);
});
```

Plain **TestBed** (`TestBed.configureTestingModule`, `fixture.detectChanges()`) works too, and **component harnesses** (`MatButtonHarness`) give stable APIs for testing Angular Material components without depending on their internal DOM.

## F10.5 Mocking the network 🟡 ⭐

> [!term] Mock Service Worker (MSW)
> A library that intercepts requests at the network level, in the browser (with a service worker) or in Node (in tests), and answers with handlers you define. Your components and data layer run **unchanged**; only the network is fake. The same handlers can power tests, Storybook and local development without a backend.

```ts
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";

const server = setupServer(
  http.get("/api/invoices", () => HttpResponse.json([{ id: "7", customer: "Nile Foods", amount: 900, status: "overdue" }])),
);
beforeAll(() => server.listen()); afterEach(() => server.resetHandlers()); afterAll(() => server.close());

it("shows an error with a retry button when loading fails", async () => {
  server.use(http.get("/api/invoices", () => new HttpResponse(null, { status: 500 })));
  render(<InvoicesPage />, { wrapper: QueryProvider });
  expect(await screen.findByRole("alert")).toHaveTextContent(/couldn't load/i);
  expect(screen.getByRole("button", { name: /retry/i })).toBeEnabled();
});
```

In Angular, `provideHttpClientTesting()` with **`HttpTestingController`** lets you assert which requests were made and flush responses:

```ts
const http = TestBed.inject(HttpTestingController);
service.list("overdue").subscribe(r => (result = r));
const req = http.expectOne("/api/invoices?status=overdue");
expect(req.request.method).toBe("GET");
req.flush([invoice]);
http.verify();      // fails if unexpected requests were made
```

## F10.6 End-to-end tests with Playwright 🟢 🟡 ⭐

Playwright drives real Chromium, Firefox and WebKit, **auto-waits** for elements to be actionable, runs tests in parallel, and records **traces** (DOM snapshots, network and console for every step) that make CI failures debuggable.

```ts
import { test, expect } from "@playwright/test";

test("accountant can record a payment", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill("accountant@demo.test");
  await page.getByLabel("Password").fill(process.env.DEMO_PASSWORD!);
  await page.getByRole("button", { name: "Sign in" }).click();

  await page.getByRole("link", { name: "Invoices" }).click();
  const row = page.getByRole("row", { name: /Nile Foods/ });
  await row.getByRole("button", { name: "Mark paid" }).click();
  await expect(row.getByText("Paid")).toBeVisible();          // web-first assertion: retries until true
});
```

**Good E2E practice:**

- Cover the **critical paths** only: sign-in, the core workflow, payment. Leave edge cases to component tests.
- **Seed known test data** through the API or the database before each test; never depend on what another test left behind.
- Reuse a logged-in state (`storageState`) instead of logging in through the UI in every test.
- Use role and label locators, not CSS classes or XPath.
- Run them in CI against a preview or staging environment, with traces kept on failure.

| | Playwright | Cypress |
|---|---|---|
| Browsers | Chromium, Firefox, WebKit | Chromium-family and Firefox (WebKit experimental) |
| Model | Tests run outside the browser and control it; multi-tab, multi-origin | Runs inside the browser; great interactive runner |
| Parallelism | Built in, free | Through its paid cloud or third-party tools |
| Languages | TypeScript/JS, Python, .NET, Java | JavaScript/TypeScript |

## F10.7 Accessibility, visual and component-workshop tests 🟡

- **Accessibility:** `@axe-core/playwright` or `vitest-axe`/`jest-axe` fail the build on detectable WCAG violations ([[F1.11]]).
- **Visual regression:** compare screenshots against approved baselines (`await expect(page).toHaveScreenshot()` in Playwright, or Chromatic). Useful for design systems; noisy if fonts or data vary.
- **Storybook:** develop components in isolation, one "story" per state (loading, error, empty, long text, RTL), which doubles as living documentation and a base for interaction and visual tests.

## F10.8 Flaky tests 🟡 ⭐

> [!term] Flaky test
> A test that sometimes passes and sometimes fails **without any code change**. Flaky tests are worse than no tests: people stop trusting red builds.

| Cause | Fix |
|---|---|
| Waiting with fixed sleeps (`wait(2000)`) | Wait for a **condition**: `findBy…`, Playwright's auto-waiting assertions |
| Shared state between tests (data, `localStorage`, singletons, module mocks) | Isolate and reset in `beforeEach`/`afterEach`; seed fresh data per test |
| Order dependence | Run tests in random order to expose it; make each test self-contained |
| Real time, dates, time zones, randomness | Fake timers, a fixed clock, seeded randomness, explicit time zones in CI |
| Real network or third-party services | Mock at the network edge (MSW) or use a controlled test backend |
| Animations | Disable them in tests (`prefers-reduced-motion`, a test flag) |

**Policy:** quarantine a flaky test immediately (skip it with a ticket), fix the cause, then bring it back. Don't just add retries.

## F10.9 Coverage and what it means 🟡 ⭐

**Coverage** reports which lines or branches ran during tests. It shows you what's **untested**; it says nothing about whether the tests **check anything**. A test that calls every function with no assertions gets high coverage.

> [!say]
> "Coverage tells me what isn't tested, which is useful, but not whether the tested code is correct. I'd rather have well-chosen tests on the critical logic and user journeys than chase a percentage. A threshold in CI can still be useful to stop coverage silently dropping."

**Mutation testing** (Stryker) is the stronger check: it changes your code slightly (flips a `>` to `>=`) and sees whether any test fails.

## F10.10 Tests in the pipeline 🟢

- Run lint, type-check, unit and component tests on **every pull request**; they should take a few minutes at most.
- Run E2E against a deployed **preview** environment on PRs to `main`, or nightly if slow.
- Keep the suite **fast** and **deterministic**, or people will skip it.
- **TDD** (write a failing test, make it pass, refactor) works well for logic-heavy code (formatters, reducers, validation rules). Know the cycle and say where you'd use it.

> [!lab] Five tests that would impress a reviewer
> In one of your React or Angular apps: (1) a unit test for a formatter with `it.each` edge cases; (2) a component test for a form, using `getByRole` and `user-event`, asserting the validation message; (3) a page test with MSW covering the error state and its retry button; (4) one Playwright test for the main journey, with a trace on failure; (5) an axe accessibility check. Wire them into GitHub Actions. Then a recruiter's "testing" keyword sits in a real bullet, not a skills list.

## F10.11 Interview drill 🟢 ⭐

| Question | Strong short answer |
|---|---|
| Unit vs integration vs E2E? | Unit tests one piece in isolation; integration (component) tests pieces together in a DOM; E2E drives the real app in a real browser. |
| What should most frontend tests be? | Component/integration tests that render and interact like a user, with few E2E tests for critical journeys. |
| How do you find elements in tests? | By role and accessible name first, then label text, with test IDs as a last resort. |
| getBy vs queryBy vs findBy? | getBy throws if missing; queryBy returns null (for absence); findBy waits asynchronously. |
| Mock vs stub vs spy? | A stub returns canned data; a spy records calls; a mock is a spy with built-in expectations; a fake is a working simplified implementation. |
| What should you mock? | Things at the edges: the network, time, randomness, browser and third-party APIs, not your own components. |
| What is MSW? | A library that intercepts network requests and serves fake responses, so app code runs unchanged in tests and development. |
| Why are tests flaky? | Fixed sleeps, shared state, order dependence, real time or network, animations. |
| Is 100% coverage the goal? | No. Coverage shows untested code, not correctness; focus on meaningful assertions on important behaviour. |
| Why Playwright? | Auto-waiting, multiple browser engines, built-in parallelism, and traces that make CI failures debuggable. |
| What is Angular's default test runner now? | Vitest, since Angular 21 (replacing Karma). |
| What is arrange-act-assert? | Set up the inputs, perform the action, check the outcome: one behaviour per test. |

## Key takeaways

> [!check]
> - Most confidence per minute comes from component tests that act like users.
> - Query by role and label; that also tests accessibility.
> - Mock the network at the edge (MSW, HttpTestingController), not your own code.
> - A few deterministic Playwright tests for critical paths, with seeded data and traces.
> - Flaky tests get quarantined and fixed, not retried into silence.

## Sources

- Testing Library: [Guiding principles](https://testing-library.com/docs/guiding-principles), [Which query should I use?](https://testing-library.com/docs/queries/about#priority), [user-event](https://testing-library.com/docs/user-event/intro), [Angular Testing Library](https://testing-library.com/docs/angular-testing-library/intro).
- [Vitest](https://vitest.dev/guide/), [Mock Service Worker](https://mswjs.io/docs/), [Playwright: best practices](https://playwright.dev/docs/best-practices), [Playwright trace viewer](https://playwright.dev/docs/trace-viewer).
- Angular: [Testing guide](https://angular.dev/guide/testing), [HTTP testing](https://angular.dev/guide/http/testing), [Component harnesses](https://material.angular.dev/cdk/test-harnesses/overview).
- Kent C. Dodds, [The Testing Trophy and Testing Classifications](https://kentcdodds.com/blog/the-testing-trophy-and-testing-classifications); Martin Fowler, [The Practical Test Pyramid](https://martinfowler.com/articles/practical-test-pyramid.html) and [Mocks Aren't Stubs](https://martinfowler.com/articles/mocksArentStubs.html).
- [Stryker mutation testing](https://stryker-mutator.io/).
