# Asynchronous JavaScript and the Browser — Event Loop, Promises, fetch and the DOM

Almost everything a frontend does is asynchronous: fetching data, waiting for clicks, timers, animations. Interviewers test it with event-loop ordering puzzles, "implement `Promise.all`", and "how do you cancel a request when the user types again?". This module also covers the DOM and events underneath every framework.

> [!focus]
> **Entry must:** explain the event loop, the call stack and the task queues; convert callbacks to promises and async/await; handle errors in async code; use fetch correctly; explain event bubbling and delegation.
> **Mid adds:** microtasks vs tasks and rendering, `Promise.all`/`allSettled`/`race`/`any`, cancellation with AbortController, race conditions between responses, long tasks and web workers.
> **Most asked:** *Explain the event loop* · *What prints first: setTimeout or a resolved promise?* · *Promise.all vs allSettled?* · *How do you cancel a fetch?* · *What is event delegation?* · *Promise vs Observable?*
> **Time budget:** 3 hours.

## F4.0 Foundations: blocking, non-blocking and the frame budget 🟢

- **Synchronous** code runs from start to finish before anything else happens. **Asynchronous** code *starts* an operation (a timer, a network request, reading a file) and arranges to be called back when it completes, leaving the thread free meanwhile.
- **Blocking** means the thread is stuck, waiting or computing, and can do nothing else. On a page's main thread that is serious, because the same thread handles clicks and keystrokes, runs your event handlers and produces the next frame.
- **The frame budget.** At 60 frames per second the browser has about **16.7 ms** per frame for your JavaScript plus style, layout and paint; a 120 Hz display halves it. JavaScript that runs longer delays the next frame and the next response to input.
- **Concurrency is not parallelism.** Concurrency is juggling several jobs by interleaving them on one thread; parallelism is doing several at the same instant on different cores. Your page's JavaScript is concurrent, not parallel. The browser underneath *is* parallel (networking, image decoding and compositing run on other threads), and Web Workers give your own code real parallelism ([[F4.7]]).
- **Where the asynchronous APIs come from.** `setTimeout`, `fetch`, DOM events and IndexedDB are provided by the **browser**, not by the JavaScript language. Node.js provides its own (files, sockets, timers) on top of a library called libuv. The event-loop idea is the same in both.

<figure class="dia"><svg viewBox="0 0 720 206" role="img" aria-label="Timelines: a 600 ms busy loop delays a click by 450 ms; an awaited fetch leaves the thread free so the click is handled at once">
<text class="sT" x="140" y="52" text-anchor="end">blocking</text><text class="sC" x="140" y="68" text-anchor="end">busy loop 600 ms</text>
<rect class="sR" x="150" y="40" width="318" height="30" rx="4"/><text class="sC" x="309" y="60" text-anchor="middle">main thread busy: nothing else can run</text>
<line class="sLw" x1="229.5" y1="24" x2="229.5" y2="40" marker-end="url(#ahw)"/><text class="sWt" x="229.5" y="20" text-anchor="middle">click</text>
<rect class="sW" x="468" y="40" width="31.8" height="30" rx="4"/><text class="sRt" x="525" y="60">handled 450 ms late</text>
<text class="sT" x="140" y="132" text-anchor="end">non-blocking</text><text class="sC" x="140" y="148" text-anchor="end">await fetch(…)</text>
<rect class="sA" x="150" y="120" width="10.6" height="30" rx="4"/><rect class="sA" x="468" y="120" width="15.9" height="30" rx="4"/>
<line class="sD" x1="160.6" y1="135" x2="468.0" y2="135"/><text class="sC" x="314.3" y="168" text-anchor="middle">the browser waits for the network; the thread is free</text>
<line class="sLg" x1="229.5" y1="104" x2="229.5" y2="120" marker-end="url(#ahg)"/><text class="sGt" x="229.5" y="100" text-anchor="middle">click</text><rect class="sG" x="229.5" y="120" width="15.9" height="30" rx="4"/>
<text class="sC" x="237.45" y="116" text-anchor="middle"></text>
<text class="sC" x="473.3" y="116" text-anchor="middle">response</text>
<text class="sC" x="150" y="196" text-anchor="middle">0 ms</text>
<text class="sC" x="282.5" y="196" text-anchor="middle">250 ms</text>
<text class="sC" x="415" y="196" text-anchor="middle">500 ms</text>
<text class="sC" x="547.5" y="196" text-anchor="middle">750 ms</text>
<text class="sC" x="680" y="196" text-anchor="middle">1000 ms</text>
</svg><figcaption>Waiting is the browser's job; computing is yours. Asynchronous APIs keep the main thread free while the waiting happens elsewhere.</figcaption></figure>

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
<line class="sL" x1="170" y1="70" x2="260" y2="70"/><text class="sM" x="174" y="56">setTimeout, fetch</text>
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

<figure class="dia steps" data-start="1"><svg viewBox="0 0 720 256" role="img" aria-label="Step-by-step run of the output puzzle showing the microtask queue, the task queue and the console after each statement">
<rect class="sB" x="10" y="12" width="330" height="236" rx="8"/>
<g data-s="1-1"><rect class="sA" x="14" y="22" width="322" height="20" rx="3" opacity=".6"/></g>
<g data-s="2-2"><rect class="sA" x="14" y="44" width="322" height="20" rx="3" opacity=".6"/></g>
<g data-s="3-3"><rect class="sA" x="14" y="66" width="322" height="20" rx="3" opacity=".6"/></g>
<g data-s="4-4"><rect class="sA" x="14" y="88" width="322" height="20" rx="3" opacity=".6"/></g>
<g data-s="5-5"><rect class="sA" x="14" y="110" width="322" height="20" rx="3" opacity=".6"/><rect class="sA" x="14" y="132" width="322" height="20" rx="3" opacity=".6"/><rect class="sA" x="14" y="154" width="322" height="20" rx="3" opacity=".6"/></g>
<g data-s="6-6"><rect class="sA" x="14" y="220" width="322" height="20" rx="3" opacity=".6"/></g>
<text class="sC" x="20" y="36" xml:space="preserve" style="white-space:pre">console.log("1");</text>
<text class="sC" x="20" y="58" xml:space="preserve" style="white-space:pre">setTimeout(() =&gt; console.log("2"), 0);</text>
<text class="sC" x="20" y="80" xml:space="preserve" style="white-space:pre">Promise.resolve().then(() =&gt; console.log("3"));</text>
<text class="sC" x="20" y="102" xml:space="preserve" style="white-space:pre">queueMicrotask(() =&gt; console.log("4"));</text>
<text class="sC" x="20" y="124" xml:space="preserve" style="white-space:pre">(async () =&gt; {</text>
<text class="sC" x="20" y="146" xml:space="preserve" style="white-space:pre">  console.log("5");</text>
<text class="sC" x="20" y="168" xml:space="preserve" style="white-space:pre">  await null;</text>
<text class="sC" x="20" y="190" xml:space="preserve" style="white-space:pre">  console.log("6");</text>
<text class="sC" x="20" y="212" xml:space="preserve" style="white-space:pre">})();</text>
<text class="sC" x="20" y="234" xml:space="preserve" style="white-space:pre">console.log("7");</text>
<g data-s="1-1"><text class="sC" x="445" y="24" text-anchor="middle">microtask queue</text><rect class="sN" x="360" y="30" width="170" height="90" rx="8"/><text class="sC" x="445" y="144" text-anchor="middle">task queue</text><rect class="sN" x="360" y="150" width="170" height="40" rx="8"/><text class="sC" x="630" y="24" text-anchor="middle">console</text><rect class="sN" x="560" y="30" width="150" height="160" rx="8"/><text class="sX" x="574" y="50">1</text></g>
<g data-s="2-2"><text class="sC" x="445" y="24" text-anchor="middle">microtask queue</text><rect class="sN" x="360" y="30" width="170" height="90" rx="8"/><text class="sC" x="445" y="144" text-anchor="middle">task queue</text><rect class="sN" x="360" y="150" width="170" height="40" rx="8"/><rect class="sW" x="366" y="156" width="158" height="22" rx="4"/><text class="sM" x="445" y="171" text-anchor="middle">timer → log 2</text><text class="sC" x="630" y="24" text-anchor="middle">console</text><rect class="sN" x="560" y="30" width="150" height="160" rx="8"/><text class="sX" x="574" y="50">1</text></g>
<g data-s="3-3"><text class="sC" x="445" y="24" text-anchor="middle">microtask queue</text><rect class="sN" x="360" y="30" width="170" height="90" rx="8"/><rect class="sG" x="366" y="36" width="158" height="22" rx="4"/><text class="sM" x="445" y="51" text-anchor="middle">log 3</text><text class="sC" x="445" y="144" text-anchor="middle">task queue</text><rect class="sN" x="360" y="150" width="170" height="40" rx="8"/><rect class="sW" x="366" y="156" width="158" height="22" rx="4"/><text class="sM" x="445" y="171" text-anchor="middle">timer → log 2</text><text class="sC" x="630" y="24" text-anchor="middle">console</text><rect class="sN" x="560" y="30" width="150" height="160" rx="8"/><text class="sX" x="574" y="50">1</text></g>
<g data-s="4-4"><text class="sC" x="445" y="24" text-anchor="middle">microtask queue</text><rect class="sN" x="360" y="30" width="170" height="90" rx="8"/><rect class="sG" x="366" y="36" width="158" height="22" rx="4"/><text class="sM" x="445" y="51" text-anchor="middle">log 3</text><rect class="sG" x="366" y="62" width="158" height="22" rx="4"/><text class="sM" x="445" y="77" text-anchor="middle">log 4</text><text class="sC" x="445" y="144" text-anchor="middle">task queue</text><rect class="sN" x="360" y="150" width="170" height="40" rx="8"/><rect class="sW" x="366" y="156" width="158" height="22" rx="4"/><text class="sM" x="445" y="171" text-anchor="middle">timer → log 2</text><text class="sC" x="630" y="24" text-anchor="middle">console</text><rect class="sN" x="560" y="30" width="150" height="160" rx="8"/><text class="sX" x="574" y="50">1</text></g>
<g data-s="5-5"><text class="sC" x="445" y="24" text-anchor="middle">microtask queue</text><rect class="sN" x="360" y="30" width="170" height="90" rx="8"/><rect class="sG" x="366" y="36" width="158" height="22" rx="4"/><text class="sM" x="445" y="51" text-anchor="middle">log 3</text><rect class="sG" x="366" y="62" width="158" height="22" rx="4"/><text class="sM" x="445" y="77" text-anchor="middle">log 4</text><rect class="sG" x="366" y="88" width="158" height="22" rx="4"/><text class="sM" x="445" y="103" text-anchor="middle">rest after await</text><text class="sC" x="445" y="144" text-anchor="middle">task queue</text><rect class="sN" x="360" y="150" width="170" height="40" rx="8"/><rect class="sW" x="366" y="156" width="158" height="22" rx="4"/><text class="sM" x="445" y="171" text-anchor="middle">timer → log 2</text><text class="sC" x="630" y="24" text-anchor="middle">console</text><rect class="sN" x="560" y="30" width="150" height="160" rx="8"/><text class="sX" x="574" y="50">1</text><text class="sX" x="574" y="69">5</text></g>
<g data-s="6-6"><text class="sC" x="445" y="24" text-anchor="middle">microtask queue</text><rect class="sN" x="360" y="30" width="170" height="90" rx="8"/><rect class="sG" x="366" y="36" width="158" height="22" rx="4"/><text class="sM" x="445" y="51" text-anchor="middle">log 3</text><rect class="sG" x="366" y="62" width="158" height="22" rx="4"/><text class="sM" x="445" y="77" text-anchor="middle">log 4</text><rect class="sG" x="366" y="88" width="158" height="22" rx="4"/><text class="sM" x="445" y="103" text-anchor="middle">rest after await</text><text class="sC" x="445" y="144" text-anchor="middle">task queue</text><rect class="sN" x="360" y="150" width="170" height="40" rx="8"/><rect class="sW" x="366" y="156" width="158" height="22" rx="4"/><text class="sM" x="445" y="171" text-anchor="middle">timer → log 2</text><text class="sC" x="630" y="24" text-anchor="middle">console</text><rect class="sN" x="560" y="30" width="150" height="160" rx="8"/><text class="sX" x="574" y="50">1</text><text class="sX" x="574" y="69">5</text><text class="sX" x="574" y="88">7</text></g>
<g data-s="7-7"><text class="sC" x="445" y="24" text-anchor="middle">microtask queue</text><rect class="sN" x="360" y="30" width="170" height="90" rx="8"/><text class="sC" x="445" y="144" text-anchor="middle">task queue</text><rect class="sN" x="360" y="150" width="170" height="40" rx="8"/><rect class="sW" x="366" y="156" width="158" height="22" rx="4"/><text class="sM" x="445" y="171" text-anchor="middle">timer → log 2</text><text class="sC" x="630" y="24" text-anchor="middle">console</text><rect class="sN" x="560" y="30" width="150" height="160" rx="8"/><text class="sX" x="574" y="50">1</text><text class="sX" x="574" y="69">5</text><text class="sX" x="574" y="88">7</text><text class="sX" x="574" y="107">3</text><text class="sX" x="574" y="126">4</text><text class="sX" x="574" y="145">6</text></g>
<g data-s="8-8"><text class="sC" x="445" y="24" text-anchor="middle">microtask queue</text><rect class="sN" x="360" y="30" width="170" height="90" rx="8"/><text class="sC" x="445" y="144" text-anchor="middle">task queue</text><rect class="sN" x="360" y="150" width="170" height="40" rx="8"/><text class="sC" x="630" y="24" text-anchor="middle">console</text><rect class="sN" x="560" y="30" width="150" height="160" rx="8"/><text class="sX" x="574" y="50">1</text><text class="sX" x="574" y="69">5</text><text class="sX" x="574" y="88">7</text><text class="sX" x="574" y="107">3</text><text class="sX" x="574" y="126">4</text><text class="sX" x="574" y="145">6</text><text class="sX" x="574" y="164">2</text></g>
<g data-s="7-7"><text class="sGt" x="445" y="216" text-anchor="middle">stack empty → drain ALL microtasks</text></g>
<g data-s="8-8"><text class="sWt" x="445" y="216" text-anchor="middle">then the next task: the timer</text></g>
</svg><ol class="dia-steps">
<li><code>console.log("1")</code> runs synchronously. Console: 1.</li>
<li><code>setTimeout</code> hands the callback to the browser's timer. When it fires (almost at once), the callback joins the <b>task</b> queue. It can't run until the current script finishes.</li>
<li>A resolved promise's <code>.then</code> callback goes into the <b>microtask</b> queue.</li>
<li><code>queueMicrotask</code> adds another microtask behind it.</li>
<li>The async function starts running synchronously: it logs 5, then hits <code>await</code>. The rest of the function becomes a microtask too.</li>
<li><code>console.log("7")</code> runs. The script is finished and the call stack is empty.</li>
<li>Now the event loop drains the microtask queue completely, in order: 3, 4, then the code after <code>await</code>, which logs 6.</li>
<li>Only then does it take the next task, the timer callback: 2. Final output: 1 5 7 3 4 6 2.</li>
</ol><figcaption>The puzzle above, one statement at a time. Synchronous code first, then every microtask, then one task.</figcaption></figure>

> [!mistake] "setTimeout(fn, 0) runs immediately"
> It runs no sooner than the next task, after all microtasks and possibly a render, and browsers clamp nested timers to at least 4 ms. It means "soon", not "now".

> [!warning] Microtasks can starve the page
> Because the microtask queue is drained completely, an endless chain of promise callbacks blocks rendering and input just like a `while (true)` loop.

## F4.3 From callbacks to promises to async/await 🟢 ⭐

**Callbacks** nest ("callback hell") and make error handling scattered. A **promise** is an object representing a value that will be available later, in one of three states: **pending**, **fulfilled** or **rejected**. Once settled, it never changes.

<figure class="dia"><svg viewBox="0 0 720 206" role="img" aria-label="A promise starts pending and settles once, either fulfilled with a value or rejected with a reason">
<rect class="sW" x="40" y="70" width="150" height="50" rx="8"/><text class="sT" x="115" y="93" text-anchor="middle">pending</text><text class="sC" x="115" y="109" text-anchor="middle">waiting</text>
<rect class="sG" x="330" y="20" width="170" height="50" rx="8"/><text class="sT" x="415" y="43" text-anchor="middle">fulfilled</text><text class="sC" x="415" y="59" text-anchor="middle">has a value</text><rect class="sR" x="330" y="120" width="170" height="50" rx="8"/><text class="sT" x="415" y="143" text-anchor="middle">rejected</text><text class="sC" x="415" y="159" text-anchor="middle">has a reason (error)</text>
<line class="sLg" x1="190" y1="88" x2="326" y2="48" marker-end="url(#ahg)"/><text class="sGt" x="258" y="56" text-anchor="middle">resolve(value)</text>
<line class="sLr" x1="190" y1="104" x2="326" y2="142" marker-end="url(#ahr)"/><text class="sRt" x="258" y="140" text-anchor="middle">reject(error) / throw</text>
<text class="sM" x="600" y="50" text-anchor="middle">.then(onFulfilled)</text><text class="sM" x="600" y="150" text-anchor="middle">.catch(onRejected)</text>
<line class="sLm" x1="500" y1="45" x2="530" y2="45" marker-end="url(#ahm)"/><line class="sLm" x1="500" y1="145" x2="530" y2="145" marker-end="url(#ahm)"/>
<text class="sS" x="415" y="196" text-anchor="middle">settled: it never changes again, and late .then calls still get the result</text>
</svg><figcaption>The three states of a promise. Settling happens at most once.</figcaption></figure>

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

<figure class="dia"><svg viewBox="0 0 720 240" role="img" aria-label="Three promises settling at 300, 600 and 900 ms, one rejecting, and when Promise.all, allSettled, race and any each settle">
<text class="sM" x="160" y="40" text-anchor="end">A: 300 ms ✓</text><rect class="sG" x="170" y="26" width="141" height="18" rx="3"/>
<text class="sM" x="160" y="66" text-anchor="end">B: 600 ms ✗</text><rect class="sR" x="170" y="52" width="282" height="18" rx="3"/>
<text class="sM" x="160" y="92" text-anchor="end">C: 900 ms ✓</text><rect class="sG" x="170" y="78" width="423" height="18" rx="3"/>
<text class="sT" x="160" y="123" text-anchor="end">Promise.all</text><line class="sLm" x1="170.0" y1="118" x2="452.0" y2="118"/><circle class="sPr" cx="452.0" cy="118" r="6"/><text class="sRt" x="464" y="123">rejects at B</text>
<text class="sT" x="160" y="149" text-anchor="end">Promise.allSettled</text><line class="sLm" x1="170.0" y1="144" x2="593.0" y2="144"/><circle class="sPg" cx="593.0" cy="144" r="6"/><text class="sGt" x="605" y="149">all 3 results</text>
<text class="sT" x="160" y="175" text-anchor="end">Promise.race</text><line class="sLm" x1="170.0" y1="170" x2="311.0" y2="170"/><circle class="sPg" cx="311.0" cy="170" r="6"/><text class="sGt" x="323" y="175">A's value</text>
<text class="sT" x="160" y="201" text-anchor="end">Promise.any</text><line class="sLm" x1="170.0" y1="196" x2="311.0" y2="196"/><circle class="sPg" cx="311.0" cy="196" r="6"/><text class="sGt" x="323" y="201">A's value (first success)</text>
<text class="sC" x="170" y="230" text-anchor="middle">0 ms</text><line class="sD" x1="170.0" y1="20" x2="170.0" y2="218" opacity=".4"/>
<text class="sC" x="311" y="230" text-anchor="middle">300 ms</text><line class="sD" x1="311.0" y1="20" x2="311.0" y2="218" opacity=".4"/>
<text class="sC" x="452" y="230" text-anchor="middle">600 ms</text><line class="sD" x1="452.0" y1="20" x2="452.0" y2="218" opacity=".4"/>
<text class="sC" x="593" y="230" text-anchor="middle">900 ms</text><line class="sD" x1="593.0" y1="20" x2="593.0" y2="218" opacity=".4"/>
</svg><figcaption>Same three promises, four combinators. <code>all</code> fails fast, <code>allSettled</code> waits for everyone, <code>race</code> takes the first to settle, <code>any</code> the first to succeed.</figcaption></figure>

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

<figure class="dia"><svg viewBox="0 0 720 256" role="img" aria-label="A search box sends ca then cai; the cai response arrives first and is shown, then the slower ca response arrives and overwrites it with wrong results. Aborting the previous request when a new one starts cancels ca, so the page keeps showing cai">
<text class="sT" x="14" y="60">without abort</text>
<line class="sLm" x1="140" y1="104" x2="700" y2="104"/>
<rect class="sR" x="140" y="40" width="468" height="22" rx="4" opacity=".7"/><text class="sC" x="148" y="56">"ca" request</text>
<rect class="sG" x="275" y="70" width="162" height="22" rx="4" opacity=".7"/><text class="sC" x="283" y="86">"cai" request</text>
<circle class="sPg" cx="437.0" cy="104" r="5"/><text class="sGt" x="437" y="122" text-anchor="middle">shows cai ✓</text>
<circle class="sPr" cx="608.0" cy="104" r="5"/><text class="sRt" x="608" y="122" text-anchor="middle">then shows ca ✗</text>
<text class="sT" x="14" y="164">with abort()</text>
<line class="sLm" x1="140" y1="208" x2="700" y2="208"/>
<rect class="sN" x="140" y="144" width="135" height="22" rx="4" opacity=".7"/><text class="sC" x="148" y="160">"ca" request</text>
<rect class="sG" x="275" y="174" width="162" height="22" rx="4" opacity=".7"/><text class="sC" x="283" y="190">"cai" request</text>
<circle class="sPg" cx="437.0" cy="208" r="5"/><text class="sGt" x="437" y="226" text-anchor="middle">shows cai ✓</text>
<line class="sLr" x1="275" y1="142" x2="275" y2="168" style="stroke-width:2.4"/><text class="sRt" x="281" y="138">new keystroke: abort()</text>
<text class="sS" x="269" y="138" text-anchor="end">ca cancelled</text>
<text class="sS" x="420" y="246" text-anchor="middle">time → (ms); responses don't arrive in the order requests were sent</text>
</svg><figcaption>The stale-response race: the last response to arrive wins unless you cancel the older request.</figcaption></figure>

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

<figure class="dia anim"><svg viewBox="0 0 720 206" role="img" aria-label="Animation: a click event travels down from window to the button in the capture phase, then bubbles back up to window">
<rect class="sB" x="250" y="30" width="220" height="26" rx="6"/><text class="sM" x="360" y="48" text-anchor="middle">window</text>
<rect class="sB" x="250" y="64" width="220" height="26" rx="6"/><text class="sM" x="360" y="82" text-anchor="middle">document</text>
<rect class="sB" x="250" y="98" width="220" height="26" rx="6"/><text class="sM" x="360" y="116" text-anchor="middle">&lt;ul id="invoices"&gt;</text>
<rect class="sB" x="250" y="132" width="220" height="26" rx="6"/><text class="sM" x="360" y="150" text-anchor="middle">&lt;li data-id="42"&gt;</text>
<rect class="sA" x="250" y="166" width="220" height="26" rx="6"/><text class="sM" x="360" y="184" text-anchor="middle">&lt;button&gt; (target)</text>
<line class="sLw" x1="210" y1="40" x2="210" y2="176" marker-end="url(#ahw)"/><text class="sWt" x="200" y="110" text-anchor="end">capture ↓</text>
<line class="sLg" x1="510" y1="176" x2="510" y2="40" marker-end="url(#ahg)"/><text class="sGt" x="520" y="110">bubble ↑</text>
<circle class="sPv" r="7"><animateMotion dur="5s" repeatCount="indefinite" calcMode="linear" path="M230 43 V179 H490 V43" keyPoints="0;0.3;0.4;0.7;1" keyTimes="0;0.35;0.45;0.8;1"/></circle>
<text class="sC" x="630" y="150" text-anchor="middle">one listener on the &lt;ul&gt;</text><text class="sC" x="630" y="166" text-anchor="middle">hears clicks from every</text><text class="sC" x="630" y="182" text-anchor="middle">row: delegation</text>
</svg><figcaption>The three phases of an event: capture down to the target, the target itself, then bubbling back up. Listeners run in the bubbling phase unless you ask for capture.</figcaption></figure>

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

<figure class="dia"><svg viewBox="0 0 720 180" role="img" aria-label="A 300 ms long task delays a tap until it ends; splitting the work into chunks with yields lets the tap run within a few milliseconds">
<text class="sT" x="130" y="42" text-anchor="end">one long task</text><rect class="sR" x="140" y="28" width="420" height="26" rx="3"/><text class="sC" x="350" y="46" text-anchor="middle">processRows(10 000): 300 ms</text>
<line class="sLw" x1="224.0" y1="10" x2="224.0" y2="26" marker-end="url(#ahw)"/><text class="sWt" x="232" y="18">tap at 60 ms</text>
<rect class="sW" x="560" y="28" width="28" height="26" rx="3"/><text class="sRt" x="602" y="46">answered at 300 ms</text>
<text class="sT" x="130" y="112" text-anchor="end">chunks + yield</text>
<rect class="sA" x="140" y="98" width="64.4" height="26" rx="3"/>
<rect class="sA" x="212.8" y="98" width="64.4" height="26" rx="3"/>
<rect class="sA" x="285.6" y="98" width="64.4" height="26" rx="3"/>
<rect class="sA" x="358.4" y="98" width="64.4" height="26" rx="3"/>
<rect class="sA" x="431.2" y="98" width="64.4" height="26" rx="3"/>
<rect class="sA" x="504" y="98" width="64.4" height="26" rx="3"/>
<rect class="sG" x="268.8" y="98" width="19.6" height="26" rx="3"/><line class="sLg" x1="224.0" y1="80" x2="278.6" y2="96" marker-end="url(#ahg)"/><text class="sGt" x="232" y="88">tap handled between chunks</text>
<text class="sS" x="360" y="150" text-anchor="middle">await scheduler.yield() (or a zero-delay timeout) between chunks lets input and rendering in</text>
<text class="sC" x="140" y="172" text-anchor="middle">0 ms</text>
<text class="sC" x="280" y="172" text-anchor="middle">100 ms</text>
<text class="sC" x="420" y="172" text-anchor="middle">200 ms</text>
<text class="sC" x="560" y="172" text-anchor="middle">300 ms</text>
<text class="sC" x="700" y="172" text-anchor="middle">400 ms</text>
</svg><figcaption>Long tasks are the main cause of a poor INP. The total work is the same; what changes is that input can get in between.</figcaption></figure>

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
