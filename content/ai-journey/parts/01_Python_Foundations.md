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
