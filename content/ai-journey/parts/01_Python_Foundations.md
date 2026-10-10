# Part 1 — Python Foundations

<!-- nav -->
> [!example] 🧭 Step 1 of 26 · Stage 1 of 7: Toolkit
> ← [Part 00 · Start here](00_START_HERE.md) · [Part 02 · NumPy](02_NumPy.md) → · [Course map](00_START_HERE.md)
<!-- /nav -->

**Source:** `AI_notebooks/2025-12-01/lec_3_OOP.ipynb` (112 cells), `oop.pdf`, `code/Assignments/Python-Recap_1_Gamaleldin_Salem.ipynb`, `Gamaleldin_Functions.ipynb` **Lecture:** Lec 3

This session is the bridge between "I can write Python" and "I can write the Python that data code is written in". Nothing here is exotic; all of it is idiom you will see in every notebook for the rest of the course.

<!-- interview-focus -->

> [!tip] 🎯 Interview focus
> **Why it matters:** Every coding round starts here. Python fluency is judged in the first 5 minutes of a live-coding screen.
>
> | Level | What you should be able to do |
> |---|---|
> | 🟢 **Entry** | Write comprehensions, functions with `*args/**kwargs`, `enumerate`/`zip`, a small class with `__init__` and a method; explain mutable vs immutable and the mutable-default-argument bug. |
> | 🟡 **Mid** | Idiomatic, readable code under time pressure; generators vs lists (memory); `@classmethod`/`@staticmethod`/`@property`; writing a custom sklearn transformer class. |
> | 🔴 **Senior** | Package structure, typing, testing (pytest), profiling and vectorising slow code; code-review judgement. |
>
> **⭐ Most-asked:** *List vs tuple vs set vs dict — when to use each?* · *What does `*args, **kwargs` do?* · *Why is `def f(x=[])` a bug?* · *Comprehension vs `map`/`filter`/`lambda`?* · *Class vs instance attributes; what is `self`?*
>
> **⏱ Time:** 2–3 h  ·  **Short on time?** Read §1.1, §1.3, §1.5 + the quick-fire box at the end.

**Legend:** 🟢 Entry (0–2 yrs) · 🟡 Mid (2–5 yrs) · 🔴 Senior / specialist · ⭐ frequently asked · 📖 Géron, *Hands-On ML with Scikit-Learn and PyTorch* (2025) pages

> [!abstract]- 🗺️ Section map — level and book pages
>
> | § | Section | Level | 📖 Book |
> |---|---|:---:|---|
> | 1.1 | Comprehensions | 🟢 ⭐ | — |
> | 1.2 | `enumerate` and `zip` | 🟢 | — |
> | 1.3 | Functions | 🟢 ⭐ | — |
> | 1.4 | `map`, `filter`, `lambda` | 🟢 | — |
> | 1.5 | Object-Oriented Programming | 🟢 ⭐ | — |
> | 1.6 | Where this shows up later | 🟢 | — |
>

---

## 1.1 Comprehensions 🟢 ⭐

> [!quote] 💬 Say it in the interview
> “A comprehension builds a list, dict or set in one readable expression — `[f(x) for x in xs if cond]`. For large data I use a generator expression so nothing is materialised.”

### What it is

A comprehension is an expression that builds a collection in one pass. It is Python's answer to `SELECT ... FROM ... WHERE` — and that is not a loose analogy, it is the same shape:

```
[ expression   for item in iterable   if condition ]
   SELECT           FROM                  WHERE
```

<figure class="dia anim"><svg viewBox="0 0 720 190" role="img" aria-label="Animation: a list comprehension as FROM, WHERE and SELECT: ten numbers, filtered to the even ones, then squared into 0, 4, 16, 36 and 64">
<text class="sM" x="360" y="22" text-anchor="middle">[x * x  for x in range(10)  if x % 2 == 0]</text>
<rect class="sB" x="14" y="36" width="200" height="30" rx="6"/><text class="sC" x="114" y="56" text-anchor="middle">FROM: for x in range(10)</text>
<rect class="sW" x="260" y="36" width="200" height="30" rx="6"/><text class="sC" x="360" y="56" text-anchor="middle">WHERE: if x % 2 == 0</text>
<rect class="sG" x="506" y="36" width="200" height="30" rx="6"/><text class="sC" x="606" y="56" text-anchor="middle">SELECT: x * x</text>
<rect class="sB" x="24" y="80" width="30" height="30" rx="4"/><text class="sT" x="39" y="100" text-anchor="middle">0</text>
<rect class="sB" x="60" y="80" width="30" height="30" rx="4"/><text class="sT" x="75" y="100" text-anchor="middle">1</text>
<rect class="sB" x="96" y="80" width="30" height="30" rx="4"/><text class="sT" x="111" y="100" text-anchor="middle">2</text>
<rect class="sB" x="132" y="80" width="30" height="30" rx="4"/><text class="sT" x="147" y="100" text-anchor="middle">3</text>
<rect class="sB" x="168" y="80" width="30" height="30" rx="4"/><text class="sT" x="183" y="100" text-anchor="middle">4</text>
<rect class="sB" x="24" y="116" width="30" height="30" rx="4"/><text class="sT" x="39" y="136" text-anchor="middle">5</text>
<rect class="sB" x="60" y="116" width="30" height="30" rx="4"/><text class="sT" x="75" y="136" text-anchor="middle">6</text>
<rect class="sB" x="96" y="116" width="30" height="30" rx="4"/><text class="sT" x="111" y="136" text-anchor="middle">7</text>
<rect class="sB" x="132" y="116" width="30" height="30" rx="4"/><text class="sT" x="147" y="136" text-anchor="middle">8</text>
<rect class="sB" x="168" y="116" width="30" height="30" rx="4"/><text class="sT" x="183" y="136" text-anchor="middle">9</text>
<rect class="sW" x="270" y="98" width="30" height="30" rx="4"/><text class="sT" x="285" y="118" text-anchor="middle">0</text>
<rect class="sW" x="306" y="98" width="30" height="30" rx="4"/><text class="sT" x="321" y="118" text-anchor="middle">2</text>
<rect class="sW" x="342" y="98" width="30" height="30" rx="4"/><text class="sT" x="357" y="118" text-anchor="middle">4</text>
<rect class="sW" x="378" y="98" width="30" height="30" rx="4"/><text class="sT" x="393" y="118" text-anchor="middle">6</text>
<rect class="sW" x="414" y="98" width="30" height="30" rx="4"/><text class="sT" x="429" y="118" text-anchor="middle">8</text>
<rect class="sG" x="516" y="98" width="34" height="30" rx="4"/><text class="sT" x="533" y="118" text-anchor="middle">0</text>
<rect class="sG" x="554" y="98" width="34" height="30" rx="4"/><text class="sT" x="571" y="118" text-anchor="middle">4</text>
<rect class="sG" x="592" y="98" width="34" height="30" rx="4"/><text class="sT" x="609" y="118" text-anchor="middle">16</text>
<rect class="sG" x="630" y="98" width="34" height="30" rx="4"/><text class="sT" x="647" y="118" text-anchor="middle">36</text>
<rect class="sG" x="668" y="98" width="34" height="30" rx="4"/><text class="sT" x="685" y="118" text-anchor="middle">64</text>
<line class="sL" x1="210" y1="113" x2="256" y2="113" marker-end="url(#ah)"/><line class="sL" x1="456" y1="113" x2="502" y2="113" marker-end="url(#ah)"/>
<circle class="sP" r="5"><animateMotion dur="3s" repeatCount="indefinite" path="M210 113 H256 M456 113 H502"/></circle>
<text class="sS" x="360" y="178" text-anchor="middle">read it as: take every x FROM the source, keep it WHERE the condition holds, SELECT the expression</text>
</svg><figcaption>A comprehension has the same shape as a SQL query; Python just writes the SELECT first.</figcaption></figure>

### List comprehension

```python
# create a list of squares from 0-9
squares = [i**2 for i in range(10)]
# [0, 1, 4, 9, 16, 25, 36, 49, 64, 81]
```

The imperative equivalent from the notebook:

```python
squ_list = []
for i in range(10):
    squ_list.append(i**2)
```

Both produce the same list. The comprehension is preferred for three reasons: it is one expression so it can be passed as an argument, it avoids the repeated `.append` attribute lookup so it is measurably faster, and it signals intent — "I am building a list" — before the reader has parsed the body.

**With a filter:**

```python
even_squares = [i**2 for i in range(10) if i % 2 == 0]
# [0, 4, 16, 36, 64]
```

The `if` at the end filters *which items are included*.

**With a conditional expression:**

```python
nums = range(1, 11)
even_odd = [f'{num} is even' if num % 2 == 0 else f'{num} is odd' for num in nums]
```

This is a different thing and the placement tells you which is which:

- `... for x in xs if cond` — a **filter**. Some items are dropped. `if` comes last.
- `... value_a if cond else value_b for x in xs` — a **ternary**. Every item is kept, but transformed differently. `if/else` comes *before* the `for`.

A ternary without `else` is a syntax error in the expression position, which is the mnemonic: filters have no `else`, ternaries must have one.

### Dict comprehension

```python
square_dict = {item: item**2 for item in range(10)}
# {0: 0, 1: 1, 2: 4, ...}
```

**Inverting a dict** — a genuinely useful pattern that appears later in the course when you build an inverse encoding map:

```python
original_dict = {'a': 1, 'b': 2, 'c': 3}
inverse_dict = {v: k for k, v in original_dict.items() if not v % 2 == 0}
# {1: 'a', 3: 'c'}     ← note the filter also applied
```

Without the filter this is the standard "reverse a mapping" idiom. You will use it in Part 4 to undo an ordinal encoding:

```python
inv_size_mapping = {v: k for k, v in size_dict.items()}
```

⚠️ **Caveat the course did not mention:** inverting a dict only works cleanly if the values are unique and hashable. Duplicate values silently collapse — last one wins.

### Set comprehension and generator expressions (course gap, worth knowing)

```python
unique_lengths = {len(w) for w in words}          # set comprehension
total = sum(i**2 for i in range(1_000_000))       # generator — no list is built
```

The generator expression is the one that matters at scale. `[i**2 for i in range(10**8)]` allocates 100 million objects; `(i**2 for i in range(10**8))` allocates one at a time. When you later meet chunked CSV reading in Pandas, this is the same idea.

---

## 1.2 `enumerate` and `zip` 🟢

**`enumerate`** pairs each item with its index:

```python
list(enumerate([10, 20, 30, 40, 50]))
# [(0, 10), (1, 20), (2, 30), (3, 40), (4, 50)]
```

Use it instead of `for i in range(len(xs))`. The latter appears in your own Python-Recap assignment answers (`for i in range(len(list))`) and is the classic beginner tell.

`enumerate(xs, start=1)` starts counting at 1, which is handy for human-facing output.

**`zip`** walks several iterables in lockstep:

```python
names = ['laila', 'amr', 'mo']
ages  = [6, 23, 30]

for name, age in zip(names, ages):
    print(f'{name} is {age} years old.')
```

`zip` stops at the **shortest** input. That silent truncation is a real bug source; if you need it to complain, `zip(a, b, strict=True)` (Python 3.10+) raises instead.

<figure class="dia"><svg viewBox="0 0 720 184" role="img" aria-label="zip pairs names with ages position by position and silently drops the fourth name because the ages list is shorter">
<rect class="sB" x="30" y="30" width="80" height="30" rx="4"/><text class="sC" x="70" y="50" text-anchor="middle">laila</text>
<rect class="sB" x="120" y="30" width="80" height="30" rx="4"/><text class="sC" x="160" y="50" text-anchor="middle">amr</text>
<rect class="sB" x="210" y="30" width="80" height="30" rx="4"/><text class="sC" x="250" y="50" text-anchor="middle">mo</text>
<rect class="sB" x="300" y="30" width="80" height="30" rx="4"/><text class="sC" x="340" y="50" text-anchor="middle">nour</text>
<rect class="sV" x="30" y="80" width="80" height="30" rx="4"/><text class="sC" x="70" y="100" text-anchor="middle">6</text>
<rect class="sV" x="120" y="80" width="80" height="30" rx="4"/><text class="sC" x="160" y="100" text-anchor="middle">23</text>
<rect class="sV" x="210" y="80" width="80" height="30" rx="4"/><text class="sC" x="250" y="100" text-anchor="middle">30</text>
<text class="sC" x="410" y="50">← names</text><text class="sC" x="410" y="100">← ages</text>
<line class="sLm" x1="70" y1="112" x2="70" y2="138" marker-end="url(#ahm)"/><rect class="sG" x="24" y="140" width="92" height="30" rx="15"/><text class="sC" x="70" y="160" text-anchor="middle">(laila, 6)</text>
<line class="sLm" x1="160" y1="112" x2="160" y2="138" marker-end="url(#ahm)"/><rect class="sG" x="114" y="140" width="92" height="30" rx="15"/><text class="sC" x="160" y="160" text-anchor="middle">(amr, 23)</text>
<line class="sLm" x1="250" y1="112" x2="250" y2="138" marker-end="url(#ahm)"/><rect class="sG" x="204" y="140" width="92" height="30" rx="15"/><text class="sC" x="250" y="160" text-anchor="middle">(mo, 30)</text>
<rect class="sR" x="300" y="30" width="80" height="30" rx="4" opacity=".5"/><text class="sRt" x="340" y="130" text-anchor="middle">"nour" dropped:</text><text class="sRt" x="340" y="146" text-anchor="middle">zip stops at the shortest</text>
<text class="sGt" x="560" y="140" text-anchor="middle">strict=True raises instead</text>
</svg><figcaption>zip walks its inputs in lockstep and stops at the shortest, silently. Use strict=True when lengths must match.</figcaption></figure>

`zip(*matrix)` transposes — a trick worth having, though NumPy's `.T` supersedes it once you get to Part 2.

---

## 1.3 Functions 🟢 ⭐

> [!quote] 💬 Say it in the interview
> “Functions take positional, keyword, `*args` and `**kwargs` parameters. I never use a mutable default argument, because it is created once and shared between calls.”

### The basics

```python
def greet():
    '''This Function saying Hello'''
    print('hello')
```

The string on the first line is a **docstring**, retrievable at runtime via `greet.__doc__` or `help(greet)`. This is not decoration — Jupyter's `Shift+Tab` reads it, and every library you are about to use (`sklearn`, `pandas`) is navigable precisely because its authors wrote them.

### Type hints

```python
def add(num1: int, num2: int) -> int:
    return num1 + num2
```

Coming from C#, the important difference: **Python does not enforce these**. They are annotations, not contracts. `add(3.5, 2)` returns `5.5` quite happily. Hints exist for readers, IDEs, and static checkers (`mypy`, `pyright`) — the interpreter ignores them.

If you want enforcement you write it yourself, which the notebook then does:

```python
def add(num1: int, num2: int) -> int:
    if not isinstance(num1, int) or not isinstance(num2, int):
        raise TypeError('Both num1 & num2 should be integers')
    return num1 + num2
```

### `raise` vs `assert`

```python
def sqrt(x):
    assert x >= 0
    return x ** 0.5

sqrt(-4)   # AssertionError
```

These are not interchangeable, and the distinction matters in production code:

| | `raise ValueError(...)` | `assert cond` |
|---|---|---|
| Purpose | Validate untrusted input | Check an internal invariant you believe is always true |
| Message | You control it | Optional, often absent |
| In production | Always runs | **Stripped entirely when Python runs with `-O`** |

Rule of thumb: `raise` for anything a user or a file could cause; `assert` for "this should be impossible, tell me if my own logic broke". The capstone notebook uses `assert DATA_PATH.exists()`, which is arguably the wrong tool — a missing file is an expected condition, not an impossible one.

### Default, positional and keyword arguments

```python
def calculator(num1=1, num2=1, op='+'):
    if op == "+":  return num1 + num2
    elif op == "-": return num1 - num2
    elif op == "*": return num1 * num2
    elif op == "/": return num1 / num2 if num2 != 0 else 'Can not divide by zero!'
    else: print('Invalid operator')
```

The notebook then demonstrates the rules by breaking them, which is the best way to learn them:

```python
calculator()                          # 2      — all defaults
calculator(20)                        # 21     — num1=20, num2 and op default
calculator('-', 20, 30)               # 'Invalid operator'  ← positional, so num1='-'
calculator(op='-', num1=20, num2=30)  # -10    — keyword, order irrelevant
calculator(20, num2=30, op='*')       # 600    — positional then keyword: legal
calculator(op='-', 20, 30)            # SyntaxError ← keyword before positional
```

**The rule:** positional arguments must come first. Once you use a keyword, everything after it must be a keyword. This is enforced at parse time, hence `SyntaxError` rather than `TypeError`.

⚠️ **The mutable-default trap** — not in the course, but it will bite you eventually:

```python
def append_to(item, target=[]):     # BAD: the list is created ONCE, at def time
    target.append(item); return target

append_to(1)   # [1]
append_to(2)   # [1, 2]   ← surprise
```

The fix is `target=None` and `if target is None: target = []`.

<figure class="dia steps"><svg viewBox="0 0 720 224" role="img" aria-label="The mutable default trap: the default list is created once when the function is defined and stored on the function object, so each call that omits target appends to the same list; the fix is a None default and a new list inside the function">
<rect class="sB" x="14" y="40" width="200" height="54" rx="8"/><text class="sT" x="114" y="65" text-anchor="middle">append_to</text><text class="sC" x="114" y="81" text-anchor="middle">function object</text>
<text class="sM" x="114" y="116" text-anchor="middle">.__defaults__</text>
<line class="sL" x1="214" y1="67" x2="300" y2="67" marker-end="url(#ah)"/>
<g data-s="1"><rect class="sW" x="304" y="46" width="150" height="42" rx="6"/><text class="sWt" x="379" y="30" text-anchor="middle">one list, made at def time</text></g>
<g data-s="1-1"><text class="sT" x="379" y="72" text-anchor="middle">[ ]</text></g><g data-s="2-2"><text class="sT" x="379" y="72" text-anchor="middle">[1]</text></g><g data-s="3-4"><text class="sRt" x="379" y="72" text-anchor="middle">[1, 2]</text></g>
<g data-s="2"><text class="sC" x="500" y="58" xml:space="preserve" style="white-space:pre">append_to(1)  → [1]</text></g>
<g data-s="3"><text class="sC" x="500" y="82" xml:space="preserve" style="white-space:pre">append_to(2)  → [1, 2]</text><text class="sRt" x="500" y="104">same object, still growing</text></g>
<g data-s="4"><rect class="sG" x="14" y="140" width="692" height="70" rx="8" opacity=".35"/><text class="sC" x="28" y="164" xml:space="preserve" style="white-space:pre">def append_to(item, target=None):</text><text class="sC" x="28" y="186" xml:space="preserve" style="white-space:pre">    if target is None: target = []   # a fresh list on every call</text><text class="sGt" x="692" y="200" text-anchor="end">immutable default, new object inside</text></g>
</svg><ol class="dia-steps">
<li><code>def</code> runs once. It evaluates <code>[]</code> right then and stores that one list on the function object, in <code>append_to.__defaults__</code>.</li>
<li><code>append_to(1)</code> omits <code>target</code>, so it receives the stored list and appends to it: <code>[1]</code>.</li>
<li><code>append_to(2)</code> receives the <b>same</b> list, which still holds 1: the result is <code>[1, 2]</code>. State leaks between calls.</li>
<li>The fix: default to <code>None</code> (immutable) and create the list inside the body, so every call gets a fresh one.</li>
</ol><figcaption>Defaults are evaluated once, at definition time. Harmless for numbers and strings, a trap for lists, dicts and sets.</figcaption></figure>

### `*args` and `**kwargs`

```python
def total_sales(*sales):
    return sum(sales)

total_sales(120, 400, 20, 40, 60, 900, 80.98)   # 1620.98 — sales is a tuple
```

```python
def customer_info(**kwargs):
    return kwargs

customer_info(name='ahmed', age='30', city='cairo')
# {'name': 'ahmed', 'age': '30', 'city': 'cairo'}   — kwargs is a dict
```

Combined, which is exactly how every ML library signature you are about to meet is written:

```python
def train_model(model, *datasets, **hyperparm):
    print('datasets:', datasets)
    print('hyperparameters:', hyperparm)

train_model('Xgboost', 'train.csv', 'test.csv', learning_rate=0.01, n_estimators=200)
# datasets: ('train.csv', 'test.csv')
# hyperparameters: {'learning_rate': 0.01, 'n_estimators': 200}
```

<figure class="dia"><svg viewBox="0 0 720 212" role="img" aria-label="Calling train_model with Xgboost, two file names and two keyword arguments: the first positional value binds to model, the remaining positionals pack into the datasets tuple, and the keyword arguments pack into the hyperparm dict">
<text class="sM" x="14" y="22">train_model(</text>
<rect class="sA" x="14" y="32" width="92" height="28" rx="5"/><text class="sC" x="60" y="51" text-anchor="middle">'Xgboost'</text>
<rect class="sB" x="112" y="32" width="104" height="28" rx="5"/><text class="sC" x="164" y="51" text-anchor="middle">'train.csv'</text>
<rect class="sB" x="222" y="32" width="96" height="28" rx="5"/><text class="sC" x="270" y="51" text-anchor="middle">'test.csv'</text>
<rect class="sV" x="324" y="32" width="154" height="28" rx="5"/><text class="sC" x="401" y="51" text-anchor="middle">learning_rate=0.01</text>
<rect class="sV" x="484" y="32" width="140" height="28" rx="5"/><text class="sC" x="554" y="51" text-anchor="middle">n_estimators=200</text>
<text class="sM" x="632" y="51">)</text>
<text class="sS" x="14" y="96">positional</text><text class="sS" x="324" y="96">keyword</text>
<text class="sT" x="69" y="128" text-anchor="middle">model</text><rect class="sA" x="14" y="138" width="110" height="30" rx="5"/><text class="sC" x="69" y="158" text-anchor="middle">'Xgboost'</text>
<text class="sT" x="260" y="128" text-anchor="middle">*datasets → tuple</text><rect class="sB" x="140" y="138" width="240" height="30" rx="5"/><text class="sC" x="260" y="158" text-anchor="middle">('train.csv', 'test.csv')</text>
<text class="sT" x="551" y="128" text-anchor="middle">**hyperparm → dict</text><rect class="sV" x="396" y="138" width="310" height="30" rx="5"/><text class="sC" x="551" y="158" text-anchor="middle">{'learning_rate': 0.01, 'n_estimators': 200}</text>
<line class="sLm" x1="60" y1="60" x2="69" y2="136" marker-end="url(#ahm)"/>
<line class="sLm" x1="164" y1="60" x2="240" y2="136" marker-end="url(#ahm)"/><line class="sLm" x1="270" y1="60" x2="280" y2="136" marker-end="url(#ahm)"/>
<line class="sLm" x1="401" y1="60" x2="520" y2="136" marker-end="url(#ahm)"/><line class="sLm" x1="554" y1="60" x2="580" y2="136" marker-end="url(#ahm)"/>
<text class="sS" x="360" y="200" text-anchor="middle">positional values fill named parameters in order; extra positionals pack into a tuple, extra keywords into a dict</text>
</svg><figcaption>How Python binds one call to def train_model(model, *datasets, **hyperparm).</figcaption></figure>

The names `args` and `kwargs` are convention only; `*` and `**` do the work. The full canonical signature order is `def f(pos, /, normal, *args, kw_only, **kwargs)` — you will rarely write it, but you will read it in library source.

---

## 1.4 `map`, `filter`, `lambda` 🟢

```python
nums = [1, 2, 3, 4, 5, 6, 7]

def square_root(num):
    return round(num ** 0.5, 2)

list(map(square_root, nums))
# [1.0, 1.41, 1.73, 2.0, 2.24, 2.45, 2.65]
```

`map(f, xs)` applies `f` to every element. `filter(pred, xs)` keeps elements where `pred` is truthy. Both return **lazy iterators** in Python 3 — hence the `list(...)` wrapper. Forget it and you print `<map object at 0x...>`, which is a rite of passage.

<figure class="dia steps"><svg viewBox="0 0 720 206" role="img" aria-label="A lazy map and filter pipeline over 1 to 7: creating it runs nothing; the first next call squares 1 and drops it, squares 2 and keeps 4; list then pulls 16 and 36 through; a second list returns an empty list because the iterator is exhausted">
<text class="sS" x="14" y="22" xml:space="preserve" style="white-space:pre">pipe = filter(lambda v: v % 2 == 0, map(lambda n: n * n, nums))</text>
<rect class="sN" x="60" y="36" width="50" height="26" rx="5"/><text class="sT" x="85" y="54" text-anchor="middle">1</text>
<rect class="sN" x="130" y="36" width="50" height="26" rx="5"/><text class="sT" x="155" y="54" text-anchor="middle">2</text>
<rect class="sN" x="200" y="36" width="50" height="26" rx="5"/><text class="sT" x="225" y="54" text-anchor="middle">3</text>
<rect class="sN" x="270" y="36" width="50" height="26" rx="5"/><text class="sT" x="295" y="54" text-anchor="middle">4</text>
<rect class="sN" x="340" y="36" width="50" height="26" rx="5"/><text class="sT" x="365" y="54" text-anchor="middle">5</text>
<rect class="sN" x="410" y="36" width="50" height="26" rx="5"/><text class="sT" x="435" y="54" text-anchor="middle">6</text>
<rect class="sN" x="480" y="36" width="50" height="26" rx="5"/><text class="sT" x="505" y="54" text-anchor="middle">7</text>
<text class="sS" x="52" y="54" text-anchor="end">nums</text><text class="sS" x="52" y="98" text-anchor="end">map</text><text class="sS" x="52" y="140" text-anchor="end">filter</text>
<g data-s="1-1"><text class="sWt" x="360" y="110" text-anchor="middle">nothing has run yet: map and filter are lazy iterators</text><text class="sS" x="360" y="190" text-anchor="middle">calls made so far: 0</text></g>
<g data-s="2-2"><line class="sLm" x1="85" y1="62" x2="85" y2="80" marker-end="url(#ahm)"/><rect class="sB" x="60" y="84" width="50" height="24" rx="5" opacity=".6"/><text class="sT" x="85" y="101" text-anchor="middle">1</text><line class="sLm" x1="85" y1="108" x2="85" y2="124" marker-end="url(#ahm)"/><rect class="sR" x="60" y="128" width="50" height="24" rx="5" opacity=".5"/><text class="sRt" x="85" y="145" text-anchor="middle">drop</text><line class="sLm" x1="155" y1="62" x2="155" y2="80" marker-end="url(#ahm)"/><rect class="sB" x="130" y="84" width="50" height="24" rx="5" opacity=".6"/><text class="sT" x="155" y="101" text-anchor="middle">4</text><line class="sLm" x1="155" y1="108" x2="155" y2="124" marker-end="url(#ahm)"/><rect class="sG" x="130" y="128" width="50" height="24" rx="5" opacity=".5"/><text class="sGt" x="155" y="145" text-anchor="middle">keep</text><text class="sGt" x="360" y="190" text-anchor="middle">next(pipe) → 4: it pulled only 4 calls (map, filter, map, filter)</text></g>
<g data-s="3-3"><line class="sLm" x1="85" y1="62" x2="85" y2="80" marker-end="url(#ahm)"/><rect class="sB" x="60" y="84" width="50" height="24" rx="5" opacity=".6"/><text class="sT" x="85" y="101" text-anchor="middle">1</text><line class="sLm" x1="85" y1="108" x2="85" y2="124" marker-end="url(#ahm)"/><rect class="sR" x="60" y="128" width="50" height="24" rx="5" opacity=".5"/><text class="sRt" x="85" y="145" text-anchor="middle">drop</text><line class="sLm" x1="155" y1="62" x2="155" y2="80" marker-end="url(#ahm)"/><rect class="sB" x="130" y="84" width="50" height="24" rx="5" opacity=".6"/><text class="sT" x="155" y="101" text-anchor="middle">4</text><line class="sLm" x1="155" y1="108" x2="155" y2="124" marker-end="url(#ahm)"/><rect class="sG" x="130" y="128" width="50" height="24" rx="5" opacity=".5"/><text class="sGt" x="155" y="145" text-anchor="middle">keep</text><line class="sLm" x1="225" y1="62" x2="225" y2="80" marker-end="url(#ahm)"/><rect class="sB" x="200" y="84" width="50" height="24" rx="5" opacity=".6"/><text class="sT" x="225" y="101" text-anchor="middle">9</text><line class="sLm" x1="225" y1="108" x2="225" y2="124" marker-end="url(#ahm)"/><rect class="sR" x="200" y="128" width="50" height="24" rx="5" opacity=".5"/><text class="sRt" x="225" y="145" text-anchor="middle">drop</text><line class="sLm" x1="295" y1="62" x2="295" y2="80" marker-end="url(#ahm)"/><rect class="sB" x="270" y="84" width="50" height="24" rx="5" opacity=".6"/><text class="sT" x="295" y="101" text-anchor="middle">16</text><line class="sLm" x1="295" y1="108" x2="295" y2="124" marker-end="url(#ahm)"/><rect class="sG" x="270" y="128" width="50" height="24" rx="5" opacity=".5"/><text class="sGt" x="295" y="145" text-anchor="middle">keep</text><line class="sLm" x1="365" y1="62" x2="365" y2="80" marker-end="url(#ahm)"/><rect class="sB" x="340" y="84" width="50" height="24" rx="5" opacity=".6"/><text class="sT" x="365" y="101" text-anchor="middle">25</text><line class="sLm" x1="365" y1="108" x2="365" y2="124" marker-end="url(#ahm)"/><rect class="sR" x="340" y="128" width="50" height="24" rx="5" opacity=".5"/><text class="sRt" x="365" y="145" text-anchor="middle">drop</text><line class="sLm" x1="435" y1="62" x2="435" y2="80" marker-end="url(#ahm)"/><rect class="sB" x="410" y="84" width="50" height="24" rx="5" opacity=".6"/><text class="sT" x="435" y="101" text-anchor="middle">36</text><line class="sLm" x1="435" y1="108" x2="435" y2="124" marker-end="url(#ahm)"/><rect class="sG" x="410" y="128" width="50" height="24" rx="5" opacity=".5"/><text class="sGt" x="435" y="145" text-anchor="middle">keep</text><line class="sLm" x1="505" y1="62" x2="505" y2="80" marker-end="url(#ahm)"/><rect class="sB" x="480" y="84" width="50" height="24" rx="5" opacity=".6"/><text class="sT" x="505" y="101" text-anchor="middle">49</text><line class="sLm" x1="505" y1="108" x2="505" y2="124" marker-end="url(#ahm)"/><rect class="sR" x="480" y="128" width="50" height="24" rx="5" opacity=".5"/><text class="sRt" x="505" y="145" text-anchor="middle">drop</text><text class="sGt" x="360" y="190" text-anchor="middle">list(pipe) → [16, 36]: the remaining values, one at a time</text></g>
<g data-s="4-4"><line class="sLm" x1="85" y1="62" x2="85" y2="80" marker-end="url(#ahm)"/><rect class="sB" x="60" y="84" width="50" height="24" rx="5" opacity=".6"/><text class="sT" x="85" y="101" text-anchor="middle">1</text><line class="sLm" x1="85" y1="108" x2="85" y2="124" marker-end="url(#ahm)"/><rect class="sR" x="60" y="128" width="50" height="24" rx="5" opacity=".5"/><text class="sRt" x="85" y="145" text-anchor="middle">drop</text><line class="sLm" x1="155" y1="62" x2="155" y2="80" marker-end="url(#ahm)"/><rect class="sB" x="130" y="84" width="50" height="24" rx="5" opacity=".6"/><text class="sT" x="155" y="101" text-anchor="middle">4</text><line class="sLm" x1="155" y1="108" x2="155" y2="124" marker-end="url(#ahm)"/><rect class="sG" x="130" y="128" width="50" height="24" rx="5" opacity=".5"/><text class="sGt" x="155" y="145" text-anchor="middle">keep</text><line class="sLm" x1="225" y1="62" x2="225" y2="80" marker-end="url(#ahm)"/><rect class="sB" x="200" y="84" width="50" height="24" rx="5" opacity=".6"/><text class="sT" x="225" y="101" text-anchor="middle">9</text><line class="sLm" x1="225" y1="108" x2="225" y2="124" marker-end="url(#ahm)"/><rect class="sR" x="200" y="128" width="50" height="24" rx="5" opacity=".5"/><text class="sRt" x="225" y="145" text-anchor="middle">drop</text><line class="sLm" x1="295" y1="62" x2="295" y2="80" marker-end="url(#ahm)"/><rect class="sB" x="270" y="84" width="50" height="24" rx="5" opacity=".6"/><text class="sT" x="295" y="101" text-anchor="middle">16</text><line class="sLm" x1="295" y1="108" x2="295" y2="124" marker-end="url(#ahm)"/><rect class="sG" x="270" y="128" width="50" height="24" rx="5" opacity=".5"/><text class="sGt" x="295" y="145" text-anchor="middle">keep</text><line class="sLm" x1="365" y1="62" x2="365" y2="80" marker-end="url(#ahm)"/><rect class="sB" x="340" y="84" width="50" height="24" rx="5" opacity=".6"/><text class="sT" x="365" y="101" text-anchor="middle">25</text><line class="sLm" x1="365" y1="108" x2="365" y2="124" marker-end="url(#ahm)"/><rect class="sR" x="340" y="128" width="50" height="24" rx="5" opacity=".5"/><text class="sRt" x="365" y="145" text-anchor="middle">drop</text><line class="sLm" x1="435" y1="62" x2="435" y2="80" marker-end="url(#ahm)"/><rect class="sB" x="410" y="84" width="50" height="24" rx="5" opacity=".6"/><text class="sT" x="435" y="101" text-anchor="middle">36</text><line class="sLm" x1="435" y1="108" x2="435" y2="124" marker-end="url(#ahm)"/><rect class="sG" x="410" y="128" width="50" height="24" rx="5" opacity=".5"/><text class="sGt" x="435" y="145" text-anchor="middle">keep</text><line class="sLm" x1="505" y1="62" x2="505" y2="80" marker-end="url(#ahm)"/><rect class="sB" x="480" y="84" width="50" height="24" rx="5" opacity=".6"/><text class="sT" x="505" y="101" text-anchor="middle">49</text><line class="sLm" x1="505" y1="108" x2="505" y2="124" marker-end="url(#ahm)"/><rect class="sR" x="480" y="128" width="50" height="24" rx="5" opacity=".5"/><text class="sRt" x="505" y="145" text-anchor="middle">drop</text><text class="sRt" x="360" y="190" text-anchor="middle">list(pipe) again → []: an iterator is used up after one pass</text></g>
</svg><ol class="dia-steps">
<li>Building the pipeline does no work: map and filter return iterators that compute on demand.</li>
<li>Asking for the first value pulls elements through one by one: map(1) = 1 is dropped, map(2) = 4 is kept and returned.</li>
<li>list() pulls the rest. Each element goes through map and filter before the next element is touched.</li>
<li>The iterator is now exhausted; looping over it again yields nothing. Materialise it with list() if you need it twice.</li>
</ol><figcaption>Lazy evaluation, traced by logging every call in Python: values flow through the pipeline one at a time, and only when asked for.</figcaption></figure>

A `lambda` is an anonymous single-expression function:

```python
list(map(lambda n: round(n ** 0.5, 2), nums))
```

**Where this actually matters:** `lambda` is the workhorse of `df.apply()` in Pandas. You will write hundreds of them:

```python
df['area_lambda'] = df['radius'].apply(lambda r: 3.14 * (r ** 2))
df['sex'] = df['age_sex'].apply(lambda x: x.split('_')[-1])
```

**Style note that will come up in code review:** a comprehension is usually preferred to `map`+`lambda` because it reads left-to-right. `[f(x) for x in xs]` beats `list(map(lambda x: f(x), xs))`. Use `map` when you already have a named function to pass.

---

## 1.5 Object-Oriented Programming 🟢 ⭐

> [!quote] 💬 Say it in the interview
> “A class bundles data and behaviour. I use inheritance sparingly, `super()` for cooperative initialisation, and I write sklearn-style classes with `fit`/`transform` for custom preprocessing.”

### The framing the course chose

The lecture opens by making one point, and it is the right one:

```python
lst = [1, 2, 3]
print(type(lst))   # <class 'list'>
dir(lst)           # ['__add__', '__class__', ..., 'append', 'clear', 'copy', ...]
lst.append(5)
```

**Everything in Python is already an object.** `lst` is an instance of class `list`; `.append` is a method on it. You have been doing OOP since your first line of Python. Defining your own class is not a new mode of programming, only a new type.

`dir(obj)` listing the dunder methods is also the first glimpse of Python's data model — `__add__` is what makes `+` work, `__len__` is what makes `len()` work. That is the mechanism behind everything you will find pleasant about NumPy and Pandas syntax.

### Minimal class

```python
class Employee:
    pass

emp1 = Employee()
print(emp1)   # <__main__.Employee object at 0x00000...>
```

The default `__repr__` prints the memory address, which is a signal to define your own — covered below.

### Constructor and instance attributes

```python
class Car:
    def __init__(self, model, fuel_type):
        self.no3_el3arbya = model     # (Arabic for "the car's type")
        self.fuel_type = fuel_type

bmw = Car('X6', 'Gasoline')
bmw.no3_el3arbya   # 'X6'
```

**`__init__` is not a constructor in the C# sense.** The object already exists by the time `__init__` runs; `__new__` created it. `__init__` is an *initialiser* — it decorates an existing instance. In practice you will only ever override `__init__`, but knowing this explains why it returns `None`.

**`self` is explicit.** In C# `this` is implicit; in Python the instance is passed as the first positional argument and you must name it. `self` is convention, not keyword — but never rename it.

### The full example: instance vs class vs static

```python
class Dog:
    '''Docstring'''
    # Static/class attribute — shared by ALL instances
    dog_count = 0

    def __init__(self, age, breed='husky', color='gray/white'):
        self.breed = breed          # instance attributes — per object
        self.age = age
        self.color = color
        Dog.dog_count += 1
        print('Object created')

    def bark(self):                 # instance method
        return 'haw haw'

    def play(self, toy):
        return f'{self.breed} like playnig with {toy}'

    @staticmethod
    def species():                  # no self, no cls
        print('All dogs are Mammals')

    @classmethod
    def get_dog_count(cls):         # receives the class
        return f'Total numbers of dogs created are {cls.get_dog_count}'
```

```python
my_dog = Dog(3)
my_dog.age            # 3
my_dog.dog_count      # 1
my_dog.play('bones')  # 'husky like playnig with bones'
rex = Dog(4, 'bulldog', 'brown')
rex.dog_count         # 2  ← class attribute, shared
```

**The three method types, and when to use each:**

| Decorator | First arg | Sees | Use for |
|---|---|---|---|
| *(none)* | `self` | The instance | Anything that reads or changes instance state |
| `@classmethod` | `cls` | The class | Alternative constructors, class-level counters |
| `@staticmethod` | — | Nothing | A function that logically belongs to the class but needs no state |

**The class-attribute gotcha you must internalise:** `my_dog.dog_count` reads the *class* attribute through the instance. But `my_dog.dog_count = 99` **creates a new instance attribute** that shadows it, leaving the class attribute untouched. This asymmetry (read falls through, write does not) is behind a whole family of confusing bugs.

🐛 **A real bug in this notebook.** `get_dog_count` returns `f'... {cls.get_dog_count}'` — which interpolates the *bound method object*, not the count. It prints something like `<bound method Dog.get_dog_count of <class Dog>>`. It should be:

```python
@classmethod
def get_dog_count(cls):
    return f'Total numbers of dogs created are {cls.dog_count}'
```

Worth internalising because it is the exact same class of error as writing `obj.method` instead of `obj.method()` — Python will not stop you, because a method is a first-class object.

<figure class="dia"><svg viewBox="0 0 720 232" role="img" aria-label="A Dog class holding a shared dog_count attribute and methods, and two instances each with their own age and breed that look up missing attributes on the class">
<rect class="sV" x="240" y="20" width="240" height="86" rx="10"/><text class="sT" x="360" y="42" text-anchor="middle">class Dog</text><text class="sC" x="256" y="66" xml:space="preserve" style="white-space:pre">dog_count = 2      # shared</text><text class="sC" x="256" y="88" xml:space="preserve" style="white-space:pre">bark(self) · total() …</text>
<rect class="sA" x="60" y="150" width="200" height="70" rx="10"/><text class="sT" x="160" y="172" text-anchor="middle">rex = Dog(3)</text><text class="sC" x="74" y="194" xml:space="preserve" style="white-space:pre">self.age = 3</text><text class="sC" x="74" y="212" xml:space="preserve" style="white-space:pre">self.breed = 'husky'</text>
<line class="sLm" x1="160" y1="150" x2="300" y2="108" marker-end="url(#ahm)"/>
<rect class="sA" x="460" y="150" width="200" height="70" rx="10"/><text class="sT" x="560" y="172" text-anchor="middle">luna = Dog(5)</text><text class="sC" x="474" y="194" xml:space="preserve" style="white-space:pre">self.age = 5</text><text class="sC" x="474" y="212" xml:space="preserve" style="white-space:pre">self.breed = 'collie'</text>
<line class="sLm" x1="560" y1="150" x2="420" y2="108" marker-end="url(#ahm)"/>
<text class="sC" x="360" y="140" text-anchor="middle">looked up here when the instance</text><text class="sC" x="360" y="156" text-anchor="middle">doesn't have the attribute itself</text>
</svg><figcaption>Instance attributes live on each object; class attributes and methods live once, on the class, and are found by lookup.</figcaption></figure>

### Single inheritance

```python
class Animal:                          # base / parent
    def __init__(self, species):
        self.species = species
        print('Animal created')
    def Eat(self):
        print('Eating')

class Dog(Animal):                     # derived / child
    def __init__(self, name, species):
        Animal.__init__(self, species) # explicit parent call
        self.name = name
        print('dog created')

sam = Dog('sam', 'dog')
# Animal created
# dog created
sam.Eat()   # Eating — inherited
```

The comment in your notebook — `# super().__init__ --> calling base attribute` — points at the better idiom:

```python
super().__init__(species)
```

`super()` and `Parent.__init__(self, ...)` do the same thing for single inheritance, but they diverge the moment you have multiple bases, which is the very next topic.

### Multiple inheritance

```python
class Father:
    def __init__(self, father_name):
        self.father_name = father_name
    def reading(self):
        print('Dad loves reading newpapers')

class Mother:
    def __init__(self, kiddness):
        self.kiddness = kiddness

class Son(Father, Mother):
    def __init__(self, father_name, kiddness, my_name):
        Father.__init__(self, father_name)
        Mother.__init__(self, kiddness)
        self.my_name = my_name
    def playingfotbaal(self):
        return f'{self.my_name} likes playing Football :)'

mo = Son('Adel', True, 'Mohmaed')
mo.reading()          # Dad loves reading newpapers
mo.playingfotbaal()   # 'Mohmaed likes playing Football :)'
```

C# forbids this; Python allows it. The cost is that "which method runs?" needs a rule, and the rule is the **Method Resolution Order (MRO)** — a linearisation computed by the C3 algorithm. Inspect it with `Son.__mro__`.

This is also why the explicit `Father.__init__(...)` / `Mother.__init__(...)` style used here is fragile in deep hierarchies: it can call a shared grandparent twice. The cooperative pattern — every class calling `super().__init__(...)` — walks the MRO exactly once. For a two-parent case like this it makes no practical difference; for anything deeper, use `super()`.

<figure class="dia"><svg viewBox="0 0 720 232" role="img" aria-label="Multiple inheritance: Child inherits from Father and Mother, which inherit from object; methods are looked up in the order Child, Father, Mother, object">
<rect class="sA" x="260" y="150" width="200" height="46" rx="8"/><text class="sT" x="360" y="171" text-anchor="middle">Child</text><text class="sC" x="360" y="187" text-anchor="middle">class Child(Father, Mother)</text>
<rect class="sB" x="150" y="70" width="140" height="46" rx="8"/><text class="sT" x="220" y="98" text-anchor="middle">Father</text><rect class="sB" x="430" y="70" width="140" height="46" rx="8"/><text class="sT" x="500" y="98" text-anchor="middle">Mother</text><rect class="sN" x="290" y="10" width="140" height="40" rx="8"/><text class="sT" x="360" y="35" text-anchor="middle">object</text>
<line class="sLm" x1="340" y1="150" x2="240" y2="118" marker-end="url(#ahm)"/><line class="sLm" x1="380" y1="150" x2="480" y2="118" marker-end="url(#ahm)"/><line class="sLm" x1="240" y1="70" x2="330" y2="52" marker-end="url(#ahm)"/><line class="sLm" x1="480" y1="70" x2="390" y2="52" marker-end="url(#ahm)"/>
<circle class="sPw" cx="360" cy="220" r="10"/><text class="sX" x="360" y="224" text-anchor="middle">1</text>
<circle class="sPw" cx="220" cy="140" r="10"/><text class="sX" x="220" y="144" text-anchor="middle">2</text>
<circle class="sPw" cx="500" cy="140" r="10"/><text class="sX" x="500" y="144" text-anchor="middle">3</text>
<circle class="sPw" cx="360" cy="66" r="10"/><text class="sX" x="360" y="70" text-anchor="middle">4</text>
<text class="sC" x="590" y="196" text-anchor="middle">method lookup order</text><text class="sC" x="470" y="216" xml:space="preserve" style="white-space:pre">Child → Father → Mother → object</text>
</svg><figcaption>With multiple parents, Python searches in method resolution order: left parent before right, each class once.</figcaption></figure>

### Multilevel inheritance

```python
class Grandfather: pass
class Father(Grandfather): pass
class Son(Father): pass
```

A chain rather than a fan. `Son` sees everything up the line.

### What the course did not cover but you should know

Three things you will meet immediately in real code:

**1. `__repr__` and `__str__`** — make your objects printable:

```python
class Dog:
    def __repr__(self):
        return f"Dog(breed={self.breed!r}, age={self.age})"
```

`__repr__` is for developers (unambiguous, ideally valid Python); `__str__` is for users. If you define only one, define `__repr__` — `str()` falls back to it.

**2. `@property`** — the Pythonic replacement for C#-style getters and setters:

```python
class Dog:
    @property
    def human_age(self):
        return self.age * 7
```

Accessed as `my_dog.human_age`, no parentheses. Python's answer to "don't write `GetX()`/`SetX()` — start with a plain attribute and upgrade to a property only if you later need logic."

**3. `@dataclass`** — removes the `__init__` boilerplate entirely:

```python
from dataclasses import dataclass

@dataclass
class Car:
    model: str
    fuel_type: str
```

You get `__init__`, `__repr__` and `__eq__` for free. For the data-carrying classes you will write in ML code (config objects, result records), this is almost always the right choice.

---

## 1.6 Where this shows up later 🟢

| Concept | Where you use it |
|---|---|
| List / dict comprehension | Building column lists: `[c for c in obj_cols if df[c].nunique() <= 20]` (Part 5) |
| Dict inversion | Reversing ordinal encodings (Part 4) |
| `lambda` | `df.apply(lambda x: ...)` throughout Parts 3–5 |
| `*args` / `**kwargs` | Reading sklearn signatures; passing `**params` to `GridSearchCV` |
| Classes + inheritance | Writing a custom sklearn transformer — the `IQRClipper(BaseEstimator, TransformerMixin)` in Part 7 is exactly this |
| `@staticmethod` | Utility functions bundled into a class |

The custom transformer in Part 7 is the payoff. It subclasses two sklearn base classes, implements `fit` and `transform`, and drops straight into a `Pipeline` — which only works because you understand inheritance and `self`.

---

> [!check] ✅ Key takeaways
> - Comprehensions (`[f(x) for x in xs if cond]`) are the idiom for building lists, dicts and sets; use a generator `( … )` for big streams.
> - `*args` collects extra positional arguments into a tuple, `**kwargs` extra keyword arguments into a dict.
> - Never use a mutable default argument (`def f(x=[])`): it is created once and shared. Use `None`.
> - `map`/`filter`/`lambda` exist, but comprehensions are usually clearer.
> - A class = data + behaviour. `self` is the instance; class attributes are shared, instance attributes are not; prefer `super().__init__()`.
> - sklearn-style classes (`fit`/`transform`) are just OOP — this is how you build custom preprocessing later.

## ⚡ Interview quick-fire

Cover the right-hand column and answer out loud first.

| Question | Strong short answer |
|---|---|
| **List vs tuple vs set vs dict?** | List: ordered, mutable. Tuple: ordered, immutable, hashable (usable as dict keys). Set: unique items, O(1) membership. Dict: key→value, O(1) lookup by key. |
| **Why is `def f(items=[])` dangerous?** | The default list is created once, when the function is defined, and shared across calls. Use `items=None` and create the list inside. |
| **What do `*args` and `**kwargs` capture?** | Extra positional arguments as a tuple, and extra keyword arguments as a dict. Common in wrappers and decorators. |
| **List comprehension vs generator expression?** | `[x*x for x in data]` builds the whole list in memory; `(x*x for x in data)` yields lazily. Use a generator for big streams. |
| **`is` vs `==`?** | `==` compares values; `is` compares identity (same object). Use `is` only for `None`. |
| **Deep vs shallow copy?** | A shallow copy duplicates the container but shares nested objects; `copy.deepcopy` duplicates everything. A classic bug with nested lists and DataFrames. |
| **`@classmethod` vs `@staticmethod`?** | A classmethod receives the class (`cls`), e.g. for alternative constructors; a staticmethod receives nothing and is just a namespaced function. |

---

## Further reading

- **Fluent Python**, Luciano Ramalho (2nd ed., O'Reilly) — the definitive book on the Python data model, dunder methods, and why the language behaves as it does.
- **Python Docs — Data model:** https://docs.python.org/3/reference/datamodel.html
- **Real Python** has reliable, well-edited articles on `*args`/`**kwargs`, `super()`, and dataclasses: https://realpython.com/
- **PEP 8** (style) and **PEP 20** (`import this` — the Zen of Python). The capstone's judging criteria list "clean, readable code" first; PEP 8 is what that means in practice.

---

<!-- nav -->
> [!example] 🧭 Step 1 of 26 · Stage 1 of 7: Toolkit
> ← [Part 00 · Start here](00_START_HERE.md) · [Part 02 · NumPy](02_NumPy.md) → · [Course map](00_START_HERE.md)
<!-- /nav -->
