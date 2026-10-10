# Frontend Testing — Unit, Component and End-to-End Tests That Earn Their Keep

Testing is the gap your own audit flags most often, and interviewers know juniors rarely test UI. Being able to say what you'd test, at which level, and with which tool, and having a small test suite to show, moves you ahead of most candidates. FinSight's Angular front end had Jest configured; CS Visualizer's differential tests show you already think in terms of "prove it's right".

> [!focus]
> **Entry must:** explain the testing pyramid or trophy; write a unit test with arrange-act-assert; write a component test that finds elements by role and simulates a user; explain mocks vs stubs vs spies; know what end-to-end tests are for.
> **Mid adds:** mocking the network with MSW or HttpTestingController, Playwright end-to-end tests with stable locators, fixing flaky tests, accessibility tests, what coverage does and doesn't tell you, testing in CI.
> **Most asked:** *How do you test a component?* · *Unit vs integration vs E2E?* · *What do you mock?* · *Why do tests become flaky?* · *Is 100% coverage a good goal?* · *What's the difference between a mock and a stub?*
> **Time budget:** 3 hours, plus writing five real tests.

## F10.0 Foundations: what a test is, and why it pays 🟢

An automated **test** is code that runs your code with known inputs and checks that the outputs are what you expect. A **test runner** finds the test files, sets up an environment (for UI tests, a simulated DOM such as jsdom, or a real browser), runs each test in isolation and reports what passed and failed.

<figure class="dia"><svg viewBox="0 0 720 116" role="img" aria-label="A test run: the runner finds test files, sets up an environment, runs your code, checks assertions and reports results">
<rect class="sB" x="8" y="26" width="108" height="50" rx="8"/><text class="sT" x="62" y="49" text-anchor="middle">test files</text><text class="sC" x="62" y="65" text-anchor="middle">*.test.ts</text>
<line class="sLm" x1="116" y1="51" x2="125" y2="51" marker-end="url(#ahm)"/>
<rect class="sA" x="127" y="26" width="108" height="50" rx="8"/><text class="sT" x="181" y="49" text-anchor="middle">runner</text><text class="sC" x="181" y="65" text-anchor="middle">Vitest · Jest</text>
<line class="sLm" x1="235" y1="51" x2="244" y2="51" marker-end="url(#ahm)"/>
<rect class="sV" x="246" y="26" width="108" height="50" rx="8"/><text class="sT" x="300" y="49" text-anchor="middle">environment</text><text class="sC" x="300" y="65" text-anchor="middle">jsdom, browser</text>
<line class="sLm" x1="354" y1="51" x2="363" y2="51" marker-end="url(#ahm)"/>
<rect class="sW" x="365" y="26" width="108" height="50" rx="8"/><text class="sT" x="419" y="49" text-anchor="middle">your code</text><text class="sC" x="419" y="65" text-anchor="middle">a component</text>
<line class="sLm" x1="473" y1="51" x2="482" y2="51" marker-end="url(#ahm)"/>
<rect class="sG" x="484" y="26" width="108" height="50" rx="8"/><text class="sT" x="538" y="49" text-anchor="middle">assertions</text><text class="sC" x="538" y="65" text-anchor="middle">expect(…)</text>
<line class="sLm" x1="592" y1="51" x2="601" y2="51" marker-end="url(#ahm)"/>
<rect class="sB" x="603" y="26" width="108" height="50" rx="8"/><text class="sT" x="657" y="49" text-anchor="middle">report</text><text class="sC" x="657" y="65" text-anchor="middle">✓ 41  ✗ 1</text>
<text class="sS" x="360" y="104" text-anchor="middle">beforeEach sets up a clean state · each test arranges, acts, asserts · afterEach tears down</text>
</svg><figcaption>What happens when you run <code>npx vitest</code>. A test is just code that runs your code with known inputs and checks the outputs.</figcaption></figure>

**Why it pays:**

- **Regression safety.** The real value shows up months later, when someone changes code they don't fully understand and a test catches what they broke.
- **Refactoring with confidence.** Behaviour-focused tests let you restructure code and know within seconds that nothing visible changed.
- **Executable documentation.** A test called "shows a retry button when loading fails" states a requirement and proves it.
- **Faster debugging.** A failing test is a precise, repeatable reproduction.

**The vocabulary:** a **test case** checks one behaviour; a **suite** groups related cases (`describe`); an **assertion** is a check (`expect(x).toBe(y)`); **setup and teardown** (`beforeEach`, `afterEach`) give every test a clean starting point; a **fixture** is prepared test data. Good tests are **deterministic** (same result every run), **isolated** (no test depends on another) and **fast**.

<figure class="dia anim"><svg viewBox="0 0 720 210" role="img" aria-label="Animation: the test-driven development loop of red, green and refactor">
<ellipse class="sN" cx="360" cy="112" rx="200" ry="72" stroke-dasharray="6 5"/>
<rect class="sR" x="260" y="18" width="200" height="44" rx="10"/><text class="sT" x="360" y="37" text-anchor="middle">1 · red</text><text class="sC" x="360" y="53" text-anchor="middle">write a test that fails</text>
<rect class="sG" x="460" y="110" width="200" height="44" rx="10"/><text class="sT" x="560" y="129" text-anchor="middle">2 · green</text><text class="sC" x="560" y="145" text-anchor="middle">simplest code to pass</text>
<rect class="sA" x="60" y="110" width="200" height="44" rx="10"/><text class="sT" x="160" y="129" text-anchor="middle">3 · refactor</text><text class="sC" x="160" y="145" text-anchor="middle">clean up, tests stay green</text>
<circle class="sPv" r="7"><animateMotion dur="7s" repeatCount="indefinite" path="M360 40 A200 72 0 1 1 359.9 40"/></circle>
</svg><figcaption>Red, green, refactor. Even if you don't practise strict TDD, "see the test fail first" proves the test can catch the bug.</figcaption></figure>

## F10.1 What different tests are for 🟢 ⭐

| Level | Tests | Speed | Confidence it works for users | Tools |
|---|---|---|---|---|
| **Static** | Types, lint rules | Instant | Catches typos and whole bug classes | TypeScript, ESLint |
| **Unit** | One function, pipe, hook or service, in isolation | Milliseconds | Low to medium | Vitest, Jest |
| **Component / integration** | A component (or a few together) rendered in a DOM, interacting like a user | Fast | **High, for the cost** | Testing Library, Angular TestBed, Vitest browser mode |
| **End-to-end (E2E)** | The real app in a real browser against a real or staged backend | Seconds each | Highest | **Playwright**, Cypress |

> [!term] Testing pyramid vs testing trophy
> The **pyramid** says: many unit tests, fewer integration tests, very few E2E tests, because higher tests are slower and more brittle. The **trophy** (Kent C. Dodds) argues that for UI code the bulk should be **integration/component tests**, on top of static checks, because they give the most confidence per minute. Both agree: a few E2E tests for the critical journeys, not hundreds.

<figure class="dia"><svg viewBox="0 0 720 238" role="img" aria-label="The testing pyramid with many unit tests and few end-to-end tests, and the testing trophy with most effort in integration tests on top of static checks">
<text class="sT" x="180" y="20" text-anchor="middle">Testing pyramid</text><text class="sT" x="540" y="20" text-anchor="middle">Testing trophy (for UI code)</text>
<rect class="sR" x="105" y="34" width="150" height="46" rx="6"/><text class="sT" x="180" y="62" text-anchor="middle">E2E</text>
<rect class="sW" x="65" y="86" width="230" height="46" rx="6"/><text class="sT" x="180" y="114" text-anchor="middle">integration</text>
<rect class="sG" x="25" y="138" width="310" height="46" rx="6"/><text class="sT" x="180" y="166" text-anchor="middle">unit</text>
<rect class="sR" x="485" y="34" width="110" height="42" rx="6"/><text class="sT" x="540" y="60" text-anchor="middle">E2E</text>
<rect class="sW" x="395" y="80" width="290" height="56" rx="6"/><text class="sT" x="540" y="113" text-anchor="middle">integration / component</text>
<rect class="sG" x="465" y="140" width="150" height="36" rx="6"/><text class="sT" x="540" y="163" text-anchor="middle">unit</text>
<rect class="sB" x="430" y="180" width="220" height="34" rx="6"/><text class="sT" x="540" y="202" text-anchor="middle">static: types + lint</text>
<text class="sC" x="180" y="206" text-anchor="middle">many small fast tests at the base</text><text class="sC" x="540" y="228" text-anchor="middle">most effort where confidence per minute is highest</text>
</svg><figcaption>Two shapes, one agreement: few end-to-end tests, and plenty of fast tests below them. The trophy just moves the bulk up one level for UI code.</figcaption></figure>

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

<figure class="dia"><svg viewBox="0 0 720 244" role="img" aria-label="The component under test surrounded by test doubles: a stub API, a spy for analytics, a fake store and a fake clock">
<rect class="sA" x="270" y="80" width="180" height="60" rx="8"/><text class="sT" x="360" y="108" text-anchor="middle">InvoicesPage</text><text class="sC" x="360" y="124" text-anchor="middle">the code under test</text>
<rect class="sG" x="20" y="20" width="190" height="50" rx="8"/><text class="sT" x="115" y="43" text-anchor="middle">stub: api.getInvoices</text><text class="sC" x="115" y="59" text-anchor="middle">returns canned rows</text>
<rect class="sV" x="510" y="20" width="190" height="50" rx="8"/><text class="sT" x="605" y="43" text-anchor="middle">spy: analytics.track</text><text class="sC" x="605" y="59" text-anchor="middle">records its calls</text>
<rect class="sW" x="20" y="160" width="190" height="50" rx="8"/><text class="sT" x="115" y="183" text-anchor="middle">fake: in-memory store</text><text class="sC" x="115" y="199" text-anchor="middle">works, but simple</text>
<rect class="sB" x="510" y="160" width="190" height="50" rx="8"/><text class="sT" x="605" y="183" text-anchor="middle">fake clock</text><text class="sC" x="605" y="199" text-anchor="middle">vi.useFakeTimers()</text>
<line class="sLm" x1="270" y1="100" x2="212" y2="50" marker-end="url(#ahm)"/><line class="sLm" x1="450" y1="100" x2="508" y2="50" marker-end="url(#ahm)"/><line class="sLm" x1="270" y1="122" x2="212" y2="180" marker-end="url(#ahm)"/><line class="sLm" x1="450" y1="122" x2="508" y2="180" marker-end="url(#ahm)"/>
<text class="sS" x="360" y="232" text-anchor="middle">replace what you don't control (network, time, third parties); keep your own components real</text>
</svg><figcaption>Test doubles stand in for the edges. Mock your own child components and you test a world that doesn't exist.</figcaption></figure>

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

<figure class="dia"><svg viewBox="0 0 720 238" role="img" aria-label="Testing Library query variants on a timeline: getBy returns the element or throws immediately, queryBy returns the element or null, and findBy waits and resolves when the element appears or rejects after the one-second timeout">
<line class="sLm" x1="236" y1="30" x2="700" y2="30"/><text class="sS" x="236" y="22">now</text><text class="sS" x="566" y="22" text-anchor="end">1 s (default findBy timeout)</text>
<line class="sD" x1="566" y1="26" x2="566" y2="206"/>
<text class="sC" x="14" y="70" xml:space="preserve" style="white-space:pre">getByRole</text>
<text class="sS" x="228" y="58" text-anchor="end">element is there</text><text class="sS" x="228" y="82" text-anchor="end">element missing</text>
<rect class="sG" x="236" y="44" width="150" height="20" rx="4" opacity=".7"/><text class="sC" x="244" y="58">returns it</text>
<rect class="sR" x="236" y="68" width="150" height="20" rx="4" opacity=".7"/><text class="sC" x="244" y="82">throws at once</text>
<text class="sC" x="14" y="126" xml:space="preserve" style="white-space:pre">queryByRole</text>
<text class="sS" x="228" y="114" text-anchor="end">element is there</text><text class="sS" x="228" y="138" text-anchor="end">element missing</text>
<rect class="sG" x="236" y="100" width="150" height="20" rx="4" opacity=".7"/><text class="sC" x="244" y="114">returns it</text>
<rect class="sA" x="236" y="124" width="210" height="20" rx="4" opacity=".7"/><text class="sC" x="244" y="138">returns null (assert absence)</text>
<text class="sC" x="14" y="182" xml:space="preserve" style="white-space:pre">findByRole</text>
<text class="sS" x="228" y="170" text-anchor="end">appears at 300 ms</text><text class="sS" x="228" y="194" text-anchor="end">never appears</text>
<line class="sLg" x1="236" y1="166" x2="335" y2="166" stroke-dasharray="3 3"/><line class="sLr" x1="236" y1="190" x2="566" y2="190" stroke-dasharray="3 3"/>
<rect class="sG" x="335" y="156" width="150" height="20" rx="4" opacity=".7"/><text class="sC" x="343" y="170">resolves at 300 ms</text>
<rect class="sR" x="566" y="180" width="136" height="20" rx="4" opacity=".7"/><text class="sC" x="574" y="194">rejects after 1 s</text>
<text class="sGt" x="360" y="226" text-anchor="middle">present now → getBy · asserting it is gone → queryBy · appears after async work → await findBy</text>
</svg><figcaption>Pick the query variant by when the element should exist.</figcaption></figure>

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

<figure class="dia"><svg viewBox="0 0 720 200" role="img" aria-label="Mock Service Worker intercepts requests at the network layer in tests, so the component and data code are the same code that talks to the real API in production">
<text class="sT" x="180" y="20" text-anchor="middle">in tests and Storybook</text><text class="sT" x="540" y="20" text-anchor="middle">in production</text>
<line class="sD" x1="360" y1="10" x2="360" y2="196"/>
<rect class="sA" x="20" y="34" width="150" height="44" rx="8"/><text class="sT" x="95" y="54" text-anchor="middle">component</text><text class="sC" x="95" y="70" text-anchor="middle">unchanged</text><rect class="sB" x="20" y="96" width="150" height="44" rx="8"/><text class="sT" x="95" y="116" text-anchor="middle">fetch / HttpClient</text><text class="sC" x="95" y="132" text-anchor="middle">unchanged</text>
<line class="sLm" x1="95" y1="78" x2="95" y2="94" marker-end="url(#ahm)"/><line class="sL" x1="170" y1="118" x2="206" y2="118" marker-end="url(#ah)"/>
<rect class="sV" x="210" y="96" width="140" height="44" rx="8"/><text class="sT" x="280" y="116" text-anchor="middle">MSW handler</text><text class="sC" x="280" y="132" text-anchor="middle">returns fake JSON</text>
<rect class="sA" x="380" y="34" width="150" height="44" rx="8"/><text class="sT" x="455" y="54" text-anchor="middle">component</text><text class="sC" x="455" y="70" text-anchor="middle">unchanged</text><rect class="sB" x="380" y="96" width="150" height="44" rx="8"/><text class="sT" x="455" y="116" text-anchor="middle">fetch / HttpClient</text><text class="sC" x="455" y="132" text-anchor="middle">unchanged</text>
<line class="sLm" x1="455" y1="78" x2="455" y2="94" marker-end="url(#ahm)"/><line class="sL" x1="530" y1="118" x2="566" y2="118" marker-end="url(#ah)"/>
<rect class="sG" x="570" y="96" width="140" height="44" rx="8"/><text class="sT" x="640" y="116" text-anchor="middle">real API</text><text class="sC" x="640" y="132" text-anchor="middle">ASP.NET Core</text>
<text class="sC" x="180" y="172" text-anchor="middle">intercepted at the network layer</text><text class="sC" x="540" y="172" text-anchor="middle">same code, real network</text>
</svg><figcaption>Mocking at the network edge. Everything above the network runs for real, which is what makes these tests trustworthy.</figcaption></figure>

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

<figure class="dia"><svg viewBox="0 0 720 270" role="img" aria-label="Playwright actionability checks on a timeline: the button becomes attached at 80 milliseconds, visible at 180, stable at 300, uncovered at 420 and enabled at 470; only when all five are true does the click happen">
<text class="sS" x="14" y="22" xml:space="preserve" style="white-space:pre">await row.getByRole("button", { name: "Mark paid" }).click();</text>
<text class="sS" x="220" y="63" text-anchor="end">attached to the DOM</text>
<rect class="sW" x="230" y="50" width="54.6667" height="20" rx="4" opacity=".35"/><rect class="sG" x="284.667" y="50" width="355.333" height="20" rx="4" opacity=".55"/>
<text class="sGt" x="290.667" y="64">✓</text>
<text class="sS" x="220" y="95" text-anchor="end">visible</text>
<rect class="sW" x="230" y="82" width="123" height="20" rx="4" opacity=".35"/><rect class="sG" x="353" y="82" width="287" height="20" rx="4" opacity=".55"/>
<text class="sGt" x="359" y="96">✓</text>
<text class="sS" x="220" y="127" text-anchor="end">stable (not animating)</text>
<rect class="sW" x="230" y="114" width="205" height="20" rx="4" opacity=".35"/><rect class="sG" x="435" y="114" width="205" height="20" rx="4" opacity=".55"/>
<text class="sGt" x="441" y="128">✓</text>
<text class="sS" x="220" y="159" text-anchor="end">receives events (not covered)</text>
<rect class="sW" x="230" y="146" width="287" height="20" rx="4" opacity=".35"/><rect class="sG" x="517" y="146" width="123" height="20" rx="4" opacity=".55"/>
<text class="sGt" x="523" y="160">✓</text>
<text class="sS" x="220" y="191" text-anchor="end">enabled</text>
<rect class="sW" x="230" y="178" width="321.167" height="20" rx="4" opacity=".35"/><rect class="sG" x="551.167" y="178" width="88.8333" height="20" rx="4" opacity=".55"/>
<text class="sGt" x="557.167" y="192">✓</text>
<line class="sLg" x1="551.167" y1="40" x2="551.167" y2="214" stroke-dasharray="4 3" style="stroke-width:2"/><text class="sGt" x="551.167" y="230" text-anchor="middle">all true at 470 ms → click</text>
<text class="sS" x="230" y="40" text-anchor="middle">0</text>
<text class="sS" x="298.333" y="40" text-anchor="middle">100</text>
<text class="sS" x="366.667" y="40" text-anchor="middle">200</text>
<text class="sS" x="435" y="40" text-anchor="middle">300</text>
<text class="sS" x="503.333" y="40" text-anchor="middle">400</text>
<text class="sS" x="571.667" y="40" text-anchor="middle">500</text>
<text class="sS" x="640" y="40" text-anchor="middle">600 ms</text>
<text class="sS" x="360" y="252" text-anchor="middle">a fixed sleep(300) would click a covered button; Playwright retries the checks until they all pass (or the timeout)</text>
</svg><figcaption>What auto-waiting means for click(): every actionability check must pass at the same moment (timings illustrative).</figcaption></figure>

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

<figure class="dia"><svg viewBox="0 0 720 196" role="img" aria-label="A fixed 500 ms wait fails when rendering takes 650 ms; a findBy query waits for the condition and passes on every run">
<text class="sT" x="140" y="44" text-anchor="end">app</text><rect class="sW" x="150" y="30" width="351" height="24" rx="4"/><text class="sC" x="325.5" y="47" text-anchor="middle">fetch + render (sometimes 250 ms, sometimes 650)</text><rect class="sG" x="501" y="30" width="189" height="24" rx="4"/><text class="sC" x="595.5" y="47" text-anchor="middle">rows on screen</text>
<text class="sM" x="140" y="100" text-anchor="end">wait(500)</text><line class="sLr" x1="420.0" y1="84" x2="420.0" y2="112" stroke-width="3"/><text class="sRt" x="428" y="104">asserts too early on a slow run → red</text>
<text class="sM" x="140" y="150" text-anchor="end">findByRole</text><rect class="sN" x="150" y="138" width="351" height="20" rx="4" stroke-dasharray="4 3"/><text class="sC" x="325.5" y="152" text-anchor="middle">polls until the row appears (or a timeout)</text><circle class="sPg" cx="501.0" cy="148" r="7"/><text class="sGt" x="513" y="152">passes every time</text>
<text class="sC" x="150" y="186" text-anchor="middle">0 ms</text>
<text class="sC" x="285" y="186" text-anchor="middle">250 ms</text>
<text class="sC" x="420" y="186" text-anchor="middle">500 ms</text>
<text class="sC" x="555" y="186" text-anchor="middle">750 ms</text>
<text class="sC" x="690" y="186" text-anchor="middle">1000 ms</text>
</svg><figcaption>The most common cause of flaky UI tests: waiting for a time instead of for a condition.</figcaption></figure>

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
