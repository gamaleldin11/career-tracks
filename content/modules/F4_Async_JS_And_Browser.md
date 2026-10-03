# Asynchronous JavaScript and the Browser — Event Loop, Promises, fetch and the DOM

Almost everything a frontend does is asynchronous: fetching data, waiting for clicks, timers, animations. Interviewers test it with event-loop ordering puzzles, "implement `Promise.all`", and "how do you cancel a request when the user types again?". This module also covers the DOM and events underneath every framework.

> [!focus]
> **Entry must:** explain the event loop, the call stack and the task queues; convert callbacks to promises and async/await; handle errors in async code; use fetch correctly; explain event bubbling and delegation.
> **Mid adds:** microtasks vs tasks and rendering, `Promise.all`/`allSettled`/`race`/`any`, cancellation with AbortController, race conditions between responses, long tasks and web workers.
> **Most asked:** *Explain the event loop* · *What prints first: setTimeout or a resolved promise?* · *Promise.all vs allSettled?* · *How do you cancel a fetch?* · *What is event delegation?* · *Promise vs Observable?*
> **Time budget:** 3 hours.

## F4.1 One thread and the event loop 🟢 ⭐

JavaScript in the browser runs your code on **one main thread**. It can't do two pieces of JavaScript at once, yet it handles timers, network requests and clicks concurrently, because the **browser** does the waiting and the **event loop** feeds the results back.

<figure class="dia"><svg viewBox="0 0 720 250" role="img" aria-label="Event loop: call stack, web APIs, microtask queue, task queue, rendering">
<rect class="sA" x="20" y="30" width="150" height="190" rx="10"/><text class="sT" x="95" y="52" text-anchor="middle">Call stack</text>
<rect class="sB" x="40" y="160" width="110" height="26" rx="5"/><text class="sS" x="95" y="178" text-anchor="middle">main()</text>
<rect class="sB" x="40" y="128" width="110" height="26" rx="5"/><text class="sS" x="95" y="146" text-anchor="middle">handleClick()</text>
<rect class="sB" x="260" y="30" width="190" height="80" rx="10"/><text class="sT" x="355" y="55" text-anchor="middle">Browser (Web APIs)</text><text class="sS" x="355" y="75" text-anchor="middle">timers · fetch · DOM events</text><text class="sS" x="355" y="92" text-anchor="middle">run outside JS</text>
<rect class="sG" x="260" y="135" width="190" height="40" rx="10"/><text class="sT" x="355" y="160" text-anchor="middle">Microtask queue</text>
<rect class="sW" x="260" y="190" width="190" height="40" rx="10"/><text class="sT" x="355" y="215" text-anchor="middle">Task queue</text>
<rect class="sB" x="540" y="120" width="160" height="60" rx="10"/><text class="sT" x="620" y="146" text-anchor="middle">Render</text><text class="sS" x="620" y="164" text-anchor="middle">style · layout · paint</text>
<line class="sL" x1="170" y1="70" x2="260" y2="70"/><text class="sM" x="178" y="62">setTimeout, fetch</text>
<line class="sD" x1="355" y1="110" x2="355" y2="135"/><line class="sD" x1="450" y1="70" x2="470" y2="210"/><line class="sD" x1="470" y1="210" x2="450" y2="210"/>
<line class="sL" x1="260" y1="155" x2="170" y2="155"/><line class="sL" x1="260" y1="210" x2="170" y2="200"/>
<text class="sS" x="180" y="244">loop: stack empty → ALL microtasks → maybe render → ONE task → repeat</text>
</svg><figcaption>The event loop. Promise callbacks are microtasks and all of them run before the next task, such as a timer, and before the next render.</figcaption></figure>

The loop, in order:

1. Run the current **task** (a script, an event handler, a timer callback) until the **call stack** is empty.
2. Run **every microtask** in the microtask queue: promise reactions (`.then`, the code after `await`), `queueMicrotask`, `MutationObserver`. Microtasks added meanwhile also run now.
3. If it's time for a frame (about every 16.7 ms at 60 Hz), **render**: run `requestAnimationFrame` callbacks, then style, layout and paint.
4. Take the **next task** from the task queue (timers, I/O, UI events) and go back to 1.

> [!term] Task (macrotask) vs microtask
> **Tasks** are whole units of work: the initial script, each event handler, each `setTimeout` callback. **Microtasks** are small follow-ups that run right after the current task, before anything else: promise callbacks and `queueMicrotask`. The microtask queue is always drained completely before the next task or render.

> [!say]
> "JavaScript runs on one thread with a call stack. Slow work like timers and network calls is handed to the browser, which queues a callback when it's done. When the stack is empty, the event loop runs all pending microtasks, such as promise callbacks, then possibly renders, then takes the next task, such as a timer or click handler. That's why a resolved promise's then runs before a zero-millisecond setTimeout."

## F4.2 Order-of-output puzzles 🟢 🟡 ⭐

```js
console.log("1");
setTimeout(() => console.log("2"), 0);
Promise.resolve().then(() => console.log("3"));
queueMicrotask(() => console.log("4"));
(async () => {
  console.log("5");
  await null;
  console.log("6");
})();
console.log("7");
```

**Output: 1, 5, 7, 3, 4, 6, 2.**

- Synchronous first: `1`; the async function runs synchronously **until its first `await`**, so `5`; then `7`.
- Then microtasks, in the order they were queued: `3`, `4`, then the continuation after `await`, `6`.
- Finally the timer task: `2`.

> [!mistake] "setTimeout(fn, 0) runs immediately"
> It runs no sooner than the next task, after all microtasks and possibly a render, and browsers clamp nested timers to at least 4 ms. It means "soon", not "now".

> [!warning] Microtasks can starve the page
> Because the microtask queue is drained completely, an endless chain of promise callbacks blocks rendering and input just like a `while (true)` loop.

## F4.3 From callbacks to promises to async/await 🟢 ⭐

**Callbacks** nest ("callback hell") and make error handling scattered. A **promise** is an object representing a value that will be available later, in one of three states: **pending**, **fulfilled** or **rejected**. Once settled, it never changes.

```js
// Wrapping a callback API in a promise
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Promise chain
getUser(id)
  .then(user => getInvoices(user.companyId))
  .then(invoices => render(invoices))
  .catch(err => showError(err))          // catches a rejection anywhere above
  .finally(() => setLoading(false));

// The same with async/await: reads like synchronous code
async function loadInvoices(id) {
  try {
    const user = await getUser(id);
    const invoices = await getInvoices(user.companyId);
    render(invoices);
  } catch (err) {
    showError(err);
  } finally {
    setLoading(false);
  }
}
```

An `async` function **always returns a promise**. `await` pauses only that function, never the thread; the rest of the page keeps working.

> [!mistake] Accidentally sequential awaits
> ```js
> const a = await getSales();      // waits...
> const b = await getExpenses();   // ...then waits again, although they're independent
> ```
> Start both, then await together: `const [a, b] = await Promise.all([getSales(), getExpenses()]);`

> [!mistake] `forEach` with async
> `items.forEach(async x => await save(x))` doesn't wait for anything; `forEach` ignores the returned promises. Use `for (const x of items) await save(x)` for one at a time, or `await Promise.all(items.map(save))` for all at once.

## F4.4 Combining promises 🟢 🟡 ⭐

| Method | Resolves when | Rejects when | Use for |
|---|---|---|---|
| `Promise.all([...])` | **All** fulfil (with an array of values, in input order) | **Any one** rejects (fail fast) | Independent requests that must all succeed |
| `Promise.allSettled([...])` | All settle, either way (with `{status, value/reason}` for each) | Never | Dashboards where some widgets may fail |
| `Promise.race([...])` | The **first to settle** settles it | The first to settle rejects | Timeouts |
| `Promise.any([...])` | The **first to fulfil** | All reject (`AggregateError`) | Fastest of several mirrors |

```js
// Implement Promise.all: a classic interview task
function promiseAll(items) {
  return new Promise((resolve, reject) => {
    const results = new Array(items.length);
    let remaining = items.length;
    if (remaining === 0) return resolve(results);
    items.forEach((item, i) => {
      Promise.resolve(item).then(value => {
        results[i] = value;                       // keep input order
        if (--remaining === 0) resolve(results);
      }, reject);                                 // first rejection wins
    });
  });
}
```

> [!story]
> A FinSight dashboard loads summary, chart and alerts from separate endpoints. `Promise.allSettled` (or independent requests per widget) means a failing alerts endpoint shows "couldn't load alerts" in one card instead of blanking the whole page. That's a good answer to "how do you handle partial failures in the UI?".

## F4.5 fetch done properly 🟢 🟡 ⭐

```js
async function getJson(url, { signal, timeoutMs = 10_000 } = {}) {
  const res = await fetch(url, {
    headers: { Accept: "application/json" },
    credentials: "include",                                     // send cookies cross-origin (needs CORS)
    signal: AbortSignal.any([signal, AbortSignal.timeout(timeoutMs)].filter(Boolean)),
  });
  if (!res.ok) {                                                // 4xx/5xx don't reject!
    const problem = await res.json().catch(() => ({}));
    throw Object.assign(new Error(problem.title ?? `HTTP ${res.status}`), { status: res.status });
  }
  return res.status === 204 ? null : res.json();
}
```

**Cancelling requests and the stale-response race.** In a search box, the user types "ca", then "cai". If the "ca" response arrives *after* the "cai" response, the page shows the wrong results. Abort the previous request when a new one starts:

```js
let controller;
async function search(q) {
  controller?.abort();                       // cancel the previous request
  controller = new AbortController();
  try {
    const results = await getJson(`/api/search?q=${encodeURIComponent(q)}`, { signal: controller.signal });
    render(results);
  } catch (e) {
    if (e.name !== "AbortError") showError(e);   // aborts are expected, not errors
  }
}
```

In Angular, RxJS's `switchMap` does exactly this for you ([[F7]]); in React, TanStack Query handles it by query key ([[F8]]).

> [!say]
> "fetch only rejects on network failure, so I check response.ok and turn error responses into exceptions. I pass an AbortSignal, both for timeouts and to cancel the previous request when a search changes, which also prevents an older, slower response from overwriting a newer one."

**Retries:** retry only **idempotent** requests ([[S1.4]]), only on transient failures (network errors, 502, 503, 504, 429), with **exponential backoff and jitter** (wait 0.5 s, 1 s, 2 s, plus a random amount), and a limit.

## F4.6 The DOM and events 🟢 ⭐

```js
const list = document.querySelector("#invoices");          // first match (CSS selector)
const rows = document.querySelectorAll(".row");             // static NodeList
const li = document.createElement("li");
li.textContent = invoice.title;                             // textContent is safe; innerHTML can inject (XSS)
li.dataset.id = invoice.id;                                 // → data-id="..."
list.append(li);
li.classList.toggle("overdue", invoice.overdue);
```

### Event propagation 🟢 ⭐

An event travels in **three phases**: **capturing** (from `window` down to the target), **target**, then **bubbling** (from the target back up to `window`). Listeners run in the bubbling phase by default; pass `{ capture: true }` for the capturing phase.

| Method | Effect |
|---|---|
| `event.preventDefault()` | Cancel the browser's **default action** (following a link, submitting a form). The event still propagates |
| `event.stopPropagation()` | Stop the event travelling further up or down. The default action still happens |
| `event.target` | The element where the event **originated** |
| `event.currentTarget` | The element whose listener is **running now** |

> [!term] Event delegation
> Attaching **one** listener to a parent instead of one per child, and using `event.target` to see which child was involved. It works because events bubble. It saves memory and automatically covers children added later.

```js
list.addEventListener("click", (e) => {
  const row = e.target.closest("li[data-id]");     // the row that contains whatever was clicked
  if (!row || !list.contains(row)) return;
  openInvoice(row.dataset.id);
});
```

> [!say]
> "Events bubble from the target up through its ancestors, so I can put one listener on a list and use event.target.closest to find which item was clicked. That's event delegation: fewer listeners, and it works for items added later. preventDefault stops the browser's default action; stopPropagation stops the bubbling."

**Cleaning up:** remove listeners when a component is destroyed (`removeEventListener`, or pass `{ signal }` from an AbortController and abort it). Forgotten listeners and timers are the most common source of memory leaks in single-page apps; frameworks do this for template bindings, but not for listeners you add by hand.

## F4.7 Keeping the main thread free 🟡

A **long task** is anything that blocks the main thread for more than 50 ms; during it, clicks and typing feel frozen, which hurts **INP** ([[F9]]).

- **Break work up:** process a big list in chunks, yielding between them (`await scheduler.yield()` where supported, or `await new Promise(r => setTimeout(r))`).
- **Move heavy computation off the thread** with a **Web Worker**: parsing a large CSV, image processing, heavy calculations. Workers communicate by `postMessage` and can't touch the DOM.
- **`requestAnimationFrame`** for visual updates, so they run right before the next paint.
- **Virtualise** long lists: render only the rows on screen (Angular CDK's virtual scroll, TanStack Virtual in React).

## F4.8 Promise vs Observable 🟡 ⭐

| | Promise | Observable (RxJS) |
|---|---|---|
| Values | **One** value (or an error) | **Zero to many** values over time |
| Starts | **Eagerly**, as soon as it's created | **Lazily**, when someone subscribes |
| Cancellable | Not by itself (needs an AbortSignal) | Yes, unsubscribe |
| Operators | `then`, `catch`, combinators | Hundreds: `map`, `filter`, `debounceTime`, `switchMap`, `retry`, `combineLatest` |
| Native? | Yes | A library (RxJS); Angular uses it heavily |

Angular's `HttpClient` returns Observables; React code mostly uses promises. Details in [[F7]].

## F4.9 Real-time from the browser 🟢

```js
// Server-Sent Events: server → client only, plain HTTP, reconnects automatically
const es = new EventSource("/api/alerts/stream");
es.addEventListener("alert", (e) => showAlert(JSON.parse(e.data)));

// WebSocket: two-way
const ws = new WebSocket("wss://example.com/ws");
ws.addEventListener("message", (e) => handle(JSON.parse(e.data)));
ws.addEventListener("close", () => scheduleReconnect());   // you must reconnect yourself
```

SignalR's JavaScript client wraps this: it negotiates WebSockets, SSE or long polling, and has `withAutomaticReconnect()`.

> [!lab] Event-loop and fetch kata
> (1) Predict, then run, three output-order puzzles of your own that mix `setTimeout`, promises, `await` and `queueMicrotask`. (2) Build a search box against any public API with debounce plus AbortController, and log in the console when a stale request is aborted. (3) Write `promiseAll` and `promiseAllSettled` from scratch and test them with a rejected promise.

## F4.10 Interview drill 🟢 ⭐

| Question | Strong short answer |
|---|---|
| Explain the event loop. | When the call stack empties, run all microtasks, maybe render, then take the next task; async work waits in the browser and queues its callback. |
| Microtask vs task? | Microtasks (promise callbacks) run right after the current task, all of them; tasks (timers, events) run one per loop turn. |
| setTimeout 0 vs Promise.then: which first? | The promise callback, because microtasks run before the next task. |
| What does `async` return? | Always a promise. |
| Promise.all vs allSettled? | all rejects on the first failure; allSettled waits for everything and reports each outcome. |
| How do you cancel a fetch? | Pass an AbortController's signal and call abort(); also AbortSignal.timeout for timeouts. |
| Does fetch reject on HTTP 500? | No. Check response.ok. |
| What's the race condition in search-as-you-type? | An older, slower response can arrive after a newer one and overwrite it; cancel previous requests or ignore stale ones. |
| What is event delegation? | One listener on a parent handles events from its children via bubbling and event.target. |
| preventDefault vs stopPropagation? | preventDefault cancels the browser's default action; stopPropagation stops the event travelling through the DOM. |
| target vs currentTarget? | target is where the event started; currentTarget is the element whose listener is running. |
| How do you keep the UI responsive during heavy work? | Chunk work and yield, use a Web Worker, virtualise long lists. |
| Promise vs Observable? | Promise: one eager value, not cancellable by itself; Observable: many lazy values, cancellable, with rich operators. |
| Why is `forEach(async ...)` a bug? | forEach doesn't await the returned promises; use for...of or Promise.all. |

## Key takeaways

> [!check]
> - One thread: sync code, then all microtasks, then render, then the next task.
> - Use `Promise.all` for independent work; `allSettled` when partial failure is acceptable.
> - fetch needs `res.ok` checks, timeouts and cancellation.
> - Events capture down and bubble up; delegate listeners to parents.
> - Long tasks freeze the page: chunk, yield or use a worker.

## Sources

- MDN: [The event loop](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Event_loop), [Using microtasks](https://developer.mozilla.org/en-US/docs/Web/API/HTML_DOM_API/Microtask_guide), [Using promises](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Using_promises), [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise), [Using the Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch), [AbortController](https://developer.mozilla.org/en-US/docs/Web/API/AbortController), [Event bubbling](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Scripting/Event_bubbling), [Web Workers](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API).
- WHATWG [HTML Standard: event loops](https://html.spec.whatwg.org/multipage/webappapis.html#event-loops).
- Jake Archibald, "In The Loop" (JSConf.Asia talk) and [Tasks, microtasks, queues and schedules](https://jakearchibald.com/2015/tasks-microtasks-queues-and-schedules/).
- web.dev: [Optimize long tasks](https://web.dev/articles/optimize-long-tasks).
- RxJS: [Observable](https://rxjs.dev/guide/observable).
