# Part 2 — NumPy

<!-- nav -->
> [!example] 🧭 Step 2 of 26 · Stage 1 of 7: Toolkit
> ← [Part 01 · Python](01_Python_Foundations.md) · [Part 03 · Pandas](03_Pandas.md) → · [Course map](00_START_HERE.md)
<!-- /nav -->

**Source:** `AI_notebooks/2025-12-09/Numpy.ipynb` (141 cells), `Numpy_Cheat_Sheet.pdf`

NumPy is the foundation everything else sits on. Pandas is NumPy with labels. scikit-learn takes NumPy arrays in and gives NumPy arrays back. PyTorch and TensorFlow copied its API deliberately. Learn it once, and three other libraries become familiar.

<!-- interview-focus -->

> [!tip] 🎯 Interview focus
> **Why it matters:** NumPy questions test whether you think in vectors. Loops over rows are a red flag in a data-science coding round.
>
> | Level | What you should be able to do |
> |---|---|
> | 🟢 **Entry** | Create, index, slice and mask arrays; use `axis=` correctly in aggregations; `reshape`; explain why vectorised code is faster. |
> | 🟡 **Mid** | Broadcasting rules without trial and error; views vs copies; matrix products (`@`) and shapes; implementing a metric or gradient step in pure NumPy. |
> | 🔴 **Senior** | Memory layout (C vs Fortran order, strides), numerical stability (log-sum-exp), when to reach for Numba/JAX/PyTorch. |
>
> **⭐ Most-asked:** *Why is NumPy faster than a Python loop?* · *What does `axis=0` mean in `sum`?* · *Explain broadcasting with an example.* · *View vs copy — when does slicing copy?* · *Implement standardisation / softmax / Euclidean distance in NumPy.*
>
> **⏱ Time:** 2 h  ·  **Short on time?** Read §2.1, §2.4–2.7, §2.9.

**Legend:** 🟢 Entry (0–2 yrs) · 🟡 Mid (2–5 yrs) · 🔴 Senior / specialist · ⭐ frequently asked · 📖 Géron, *Hands-On ML with Scikit-Learn and PyTorch* (2025) pages

> [!abstract]- 🗺️ Section map — level and book pages
>
> | § | Section | Level | 📖 Book |
> |---|---|:---:|---|
> | 2.1 | What NumPy is, and why it exists | 🟢 ⭐ | — |
> | 2.2 | Creating arrays | 🟢 | — |
> | 2.3 | Array anatomy | 🟢 | — |
> | 2.4 | Indexing and slicing | 🟢 ⭐ | — |
> | 2.5 | Mathematics and aggregation | 🟢 ⭐ | — |
> | 2.6 | Reshaping | 🟢 | — |
> | 2.7 | Boolean masking (filtering) | 🟢 ⭐ | — |
> | 2.8 | Linear algebra | 🟡 | — |
> | 2.9 | Broadcasting — the concept the course used but never named | 🟡 ⭐ | — |
> | 2.10 | The mental model to carry forward | 🟢 | — |
>

---

## 2.1 What NumPy is, and why it exists 🟢 ⭐

> [!quote] 💬 Say it in the interview
> “NumPy stores typed data contiguously and runs loops in C, so vectorised operations are 10–100× faster than Python loops.”

The notebook's definition:

> **Numpy** stands for Numerical Python, it's a library that makes python great for numerical computing with different n-Array dimensions.

That is true but understates the point. The real answer is **performance and memory layout**, and as an engineer you will find the mechanism more convincing than the slogan.

A Python list of 1,000,000 integers is an array of 1,000,000 *pointers*, each to a separately heap-allocated `PyObject` carrying a type tag, a reference count, and a value. Iterating it means chasing pointers all over memory and dispatching on type at every step.

A NumPy array of 1,000,000 `int32` is **one contiguous block of 4 MB**. No per-element boxing, no type dispatch. The loop that adds two of them runs in compiled C, processes several elements per CPU instruction (SIMD), and never touches the Python interpreter.

```python
import numpy as np

list_1 = [1, 2, 3, 4, 5]
array = np.array([1, 2, 3, 4, 5])

type(list_1), type(array)   # (list, numpy.ndarray)
```

The consequence you must internalise: **you do not write loops over NumPy arrays.** If you find yourself writing `for i in range(len(arr))`, there is a vectorised operation you have not found yet. This is called *vectorisation* and it is the single biggest performance lever in the whole stack — routinely 10–100×.

---

## 2.2 Creating arrays 🟢

```python
arr1 = np.array([10, 20, 30, 40])          # from a Python list

arr2 = np.zeros(5)                         # [0. 0. 0. 0. 0.]  — float64 by default
arr2_1 = np.zeros((2, 2))                  # 2×2 of zeros
arr3 = np.ones(3)                          # [1. 1. 1.]

arr4 = np.arange(0, 10, 2)                 # [0 2 4 6 8]   — start, stop(exclusive), step
arr5 = np.linspace(0, 1, 25)               # 25 evenly spaced points, endpoint INCLUDED
```

**`arange` vs `linspace`** — the distinction trips everyone once:

- `arange(start, stop, step)` — *you* specify the step; the count falls out; `stop` is **excluded**. With float steps it can produce an off-by-one element because of floating-point accumulation.
- `linspace(start, stop, num)` — *you* specify how many points; the step falls out; `stop` is **included** by default.

For plotting axes and any float range, prefer `linspace`. For integer indices, `arange`.

### Random arrays

```python
arr6   = np.random.rand(4, 3)                            # uniform [0, 1)
arr6_1 = np.random.randint(0, 10, (5, 2), dtype='int16') # ints in [0, 10)
arr6_2 = np.random.randn(2, 2)                           # standard normal, mean 0 std 1
```

Three distinct generators; the names are unhelpfully similar:

| Call | Distribution |
|---|---|
| `rand(d0, d1, ...)` | Uniform over [0, 1) |
| `randn(d0, d1, ...)` | Standard normal (Gaussian, μ=0, σ=1) |
| `randint(low, high, size)` | Uniform integers, `high` exclusive |

### Reproducibility

```python
np.random.seed(42)          # Reproducibility
arr6_3 = np.random.randn(2, 2)
```

Seeding fixes the pseudo-random stream so a run is repeatable. **This is not a nicety, it is a correctness requirement.** Without it you cannot tell whether a model improved because your change was good or because the train/test split was luckier. Every reference notebook in this course defines `RANDOM_STATE` for exactly this reason.

📌 **Modern practice:** `np.random.seed()` sets a hidden global. Current NumPy prefers an explicit generator object:

```python
rng = np.random.default_rng(42)
rng.standard_normal((2, 2))
```

The course uses the legacy API — which is fine and still ubiquitous — but the generator API is what new code should use, because a global seed is a global variable.

---

## 2.3 Array anatomy 🟢

```python
arr6_1.nbytes    # total bytes consumed
arr6_1.ndim      # number of dimensions: 1 for a vector, 2 for a matrix
arr6_3.shape     # tuple of dimension sizes, e.g. (2, 2)
arr6_3.size      # total number of elements = product of shape
arr6_3.dtype     # element type, e.g. float64
```

Four attributes worth committing to muscle memory, because 90% of NumPy errors are shape or dtype errors and these are how you diagnose them.

**On `dtype`:** unlike a Python list, a NumPy array is **homogeneous** — one type for every element. That is what buys the contiguous memory. It also means dtype is a real decision:

- `int64` vs `int16` — the notebook's `dtype='int16'` cuts memory by 4×. On a 10 GB dataset that is the difference between fitting in RAM and not.
- `float32` vs `float64` — deep learning uses `float32` almost universally; half the memory, twice the throughput, and the extra precision buys nothing for gradient descent.
- **Overflow is silent.** `np.int8(127) + 1` gives `-128`. No exception. This is C semantics, not Python semantics, and it is a genuine trap.

`nbytes` is your tool for the memory question that will eventually matter: `arr.nbytes / 1024**3` gives gigabytes.

---

## 2.4 Indexing and slicing 🟢 ⭐

### Vectors

```python
arr1              # [10 20 30 40]
arr1[-1]          # 40    — negative indexes from the end
arr1[0]           # 10
arr1[5]           # IndexError
arr1[:-1]         # [10 20 30]  — everything except the last
```

Same rules as Python lists: `[start:stop:step]`, `stop` exclusive, negatives count back.

### Matrices

```python
arr6_3[0]         # first ROW (a 1-D array)
arr6_3[-1][1]     # chained indexing — works, but creates an intermediate
arr6_3[1, 1]      # single-element access — PREFERRED
arr6_3[:, :-1]    # all rows, all columns except the last
```

**`a[1, 1]` vs `a[1][1]`.** They give the same answer here but they are not the same operation. `a[1][1]` builds a temporary view of row 1, then indexes it. `a[1, 1]` computes one memory offset. For reads the difference is small; for **writes** it can be the difference between working and silently not working — the same failure mode as Pandas chained assignment, which you will meet in Part 4.

**The comma is the whole point of NumPy indexing.** Before the comma: rows. After: columns. `a[:, 0]` is "the first column of every row" — an operation a Python list cannot express without a loop.

### ⚠️ Views versus copies

The single most important NumPy behaviour the course did not state explicitly:

```python
a = np.array([1, 2, 3, 4, 5])
b = a[1:4]        # a VIEW — shares memory with a
b[0] = 99
a                 # array([ 1, 99,  3,  4,  5])   ← a changed!
```

**Basic slicing returns a view, not a copy.** This is what makes NumPy fast (no data copied) and is a frequent source of "why did my original array change?". Use `.copy()` when you want independence:

```python
b = a[1:4].copy()
```

**Fancy indexing** (with a list or a boolean mask) *does* copy:

```python
c = a[[0, 2, 4]]        # copy
d = a[a > 2]            # copy
```

---

## 2.5 Mathematics and aggregation 🟢 ⭐

### Element-wise arithmetic

```python
a = np.array([1, 2, 3])
b = np.array([4, 5, 6])

a + b      # [5 7 9]
a - b      # [-3 -3 -3]
a * b      # [ 4 10 18]   ← ELEMENT-WISE, not matrix multiplication
a / b
a ** 2     # [1 4 9]
np.power(a, 3)
```

**`*` is element-wise (Hadamard) multiplication.** This is the number-one confusion for anyone arriving from a linear-algebra background where `*` means matrix product. Matrix product is `@` or `np.dot` — covered in §2.8.

### Aggregations

```python
np.sum(a); np.mean(a); np.var(a); np.std(a); np.min(a); np.max(a)
np.argmax(a)    # INDEX of the maximum, not the value
np.argmin(a)
np.unique(a)    # sorted unique values
```

**`argmax` versus `max`** is a distinction you will use constantly in classification: `max(probabilities)` gives you the confidence; `argmax(probabilities)` gives you the predicted class. That is literally how `predict()` is implemented on top of `predict_proba()`.

### The `axis` argument — the thing to actually understand

```python
np.sum(arr6_3)            # scalar: sum of everything
np.sum(arr6_3, axis=0)    # sum by COLUMN → one value per column
np.sum(arr6_3, axis=1)    # sum by ROW    → one value per row
np.argmax(arr6_3, axis=0) # Columns
```

Everyone memorises this and everyone forgets it. Here is the rule that makes it stick:

> **`axis=n` is the axis that gets collapsed.**

For a 2-D array of shape `(rows, cols)`, axis 0 is rows and axis 1 is columns. So `axis=0` collapses the row dimension — you end up with one value per column, i.e. a **column-wise** result. `axis=1` collapses columns, giving a **row-wise** result.

Check it with shapes: `(5, 3)` summed with `axis=0` → shape `(3,)`. The 5 is gone.

This exact rule carries into Pandas, where it is the source of endless confusion because `df.drop(axis=1)` drops columns while `df.sum(axis=1)` sums *across* columns. Both are consistent with "axis 1 is the column axis"; they just do different things with it.

### Percentiles and quantiles

```python
x = np.array([[1, 10], [2, 20], [3, 30], [4, 40]])

medians = np.percentile(x, 50, axis=0)   # columns
med     = np.quantile(x, 0.5, axis=0)    # ML convention: use quantile
```

Identical computations on different scales — `percentile` takes 0–100, `quantile` takes 0–1. The notebook's aside ("regarding ML we used quantile instead of percentile") reflects sklearn's convention, which is 0–1 throughout.

You will need Q1 and Q3 specifically for **IQR outlier detection** in Part 4: `IQR = Q3 − Q1`, outliers are outside `[Q1 − 1.5·IQR, Q3 + 1.5·IQR]`.

### Mode — note the import

```python
from scipy import stats
print(stats.mode(a)[0])
```

NumPy has no `mode`. Mean, median and standard deviation are NumPy; mode lives in SciPy. The reason is principled — mode is a statistical concept about categorical frequency, not a numerical array operation — but the practical effect is one more import.

---

## 2.6 Reshaping 🟢

```python
arr6_4 = np.random.rand(6, 1)
arr6_4.reshape(3, 2)
arr6_4.reshape(2, 3)

arr6_5 = np.random.rand(6)
arr6_5.reshape(2, 3)
arr6_5.flatten()      # back to 1-D

A.reshape(-1)         # -1 means "infer this dimension"
```

`reshape` reinterprets the same memory with a different shape. The product of the new shape must equal `size`, or you get an error.

**`-1` is a wildcard**: `reshape(-1, 1)` means "one column, as many rows as needed". You will type this constantly, because scikit-learn insists that `X` be 2-D even when it holds a single feature:

```python
X = df['BuildingArea'].values.reshape(-1, 1)
```

**`flatten()` vs `ravel()`** — a distinction the course skipped: `flatten()` always returns a **copy**; `ravel()` returns a **view** when it can. Prefer `ravel()` for performance, `flatten()` when you need independence. And `.reshape(-1)` behaves like `ravel()`.

---

## 2.7 Boolean masking (filtering) 🟢 ⭐

> [!quote] 💬 Say it in the interview
> “Boolean masking filters with a condition array — `a[a > 0]` — and it returns a copy, not a view.”

```python
arr6_3 > 0.5           # array of True/False, same shape
arr6_3[arr6_3 > 0.5]   # a 1-D array of only the elements that passed
```

This is the two-step idea that everything downstream is built on:

1. A comparison against an array returns a **boolean array**, not a single boolean.
2. Indexing an array *with* a boolean array selects where `True`.

`df[df.Monthly_Usage_MB > 10000]` in Pandas is the same mechanism with labels attached.

**Combining conditions** — and the gotcha:

```python
mask = (a > 2) & (a < 5)      # element-wise AND — note the & and the parentheses
```

You must use `&`, `|`, `~` — **not** `and`, `or`, `not`. The Python keywords call `__bool__` on the whole array, which raises *"The truth value of an array with more than one element is ambiguous."* And the parentheses are mandatory because `&` binds tighter than `>`.

Useful relatives: `np.where(cond, x, y)` (vectorised ternary), `mask.sum()` (count of `True`, since `True == 1`), `mask.any()`, `mask.all()`.

---

## 2.8 Linear algebra 🟡

This section is why the course teaches NumPy before machine learning. Every model in Parts 7–11 is linear algebra underneath.

### Scalar multiplication

```python
v = np.array([1, 2, 3, 4, 5])
extend = 3 * v      # [ 3  6  9 12 15]  — stretches the vector
shrink = 0.5 * v    # shrinks it
```

Geometrically: scaling a vector changes its length, never its direction (unless the scalar is negative, which flips it).

### Element-wise vs dot product

```python
A = np.array([[1, 2], [3, 4]])
B = np.array([[5, 6], [7, 8]])

A * B                 # element-wise — shapes must MATCH exactly
np.dot(a, b)          # dot product of two vectors → a SCALAR
matrix_dot = np.dot(A, B)
matrix_mul = A @ B    # identical to np.dot for 2-D — preferred, PEP 465
```

**The dot product of two vectors is a single number**: `a·b = Σ aᵢbᵢ`. It measures alignment. This is not trivia — it is the core operation of the whole field:

- A **linear regression** prediction is `ŷ = w·x + b` — one dot product.
- A **neuron** computes `activation(w·x + b)` — one dot product.
- **Cosine similarity** (Part 10) is a normalised dot product.
- A **matrix multiply** is a grid of dot products: `(A@B)[i,j] = row i of A · column j of B`.

**Shape rules for `@`:** `(m, n) @ (n, p) → (m, p)`. The inner dimensions must match. The notebook demonstrates this by trying both orders:

```python
M = arr6_5.reshape(2, 3)
M @ A              # (2,3) @ (2,2) → ERROR: 3 ≠ 2
M.shape, A.shape
A @ M              # (2,2) @ (2,3) → (2,3) ✓
```

**Matrix multiplication is not commutative.** `A@B ≠ B@A` in general — often one of them is not even a legal shape. Coming from scalar arithmetic this is the biggest adjustment.

### Transpose

```python
M.T     # rows become columns
```

`(m, n) → (n, m)`. It is what you reach for when shapes almost line up. It is also a **view**, not a copy — free.

### Inverse, identity, determinant

```python
A_inv = np.linalg.inv(A)        # square matrices only
I = np.dot(A, A_inv)
print(np.round(I, decimals=10)) # ≈ identity matrix
det_A = np.linalg.det(A)
```

The inverse is the matrix analogue of `1/x`: `A @ A⁻¹ = I`, where `I` is the identity (ones on the diagonal). The `np.round(..., 10)` is doing real work — floating-point error means you get `0.9999999999999998` rather than `1.0`, and rounding reveals the intent.

**The determinant** is a single number summarising the matrix. `det(A) == 0` means the matrix is **singular** — not invertible — which geometrically means it squashes space flat and loses a dimension.

**Why this matters for ML.** The closed-form solution to linear regression is the *normal equation*:

> **β = (XᵀX)⁻¹ Xᵀy**

When two features are perfectly correlated, `XᵀX` is singular, the inverse does not exist, and the regression has no unique solution. That is **multicollinearity** — the exact thing the capstone notebook checks with VIF in Part 13, where `VIF = inf` signals perfect collinearity. The chain runs from `np.linalg.det` straight to a modelling decision.

In practice sklearn never actually inverts the matrix (it uses SVD or QR decomposition, which are numerically stabler), but the concept is the same.

---

## 2.9 Broadcasting — the concept the course used but never named 🟡 ⭐

![Broadcasting stretches the smaller array virtually — no copies are made.](figures/fig02_broadcasting.png)
*Broadcasting stretches the smaller array virtually — no copies are made.*

> [!quote] 💬 Say it in the interview
> “Broadcasting compares shapes from the right; dimensions must match or be 1. It lets me standardise a matrix with `(X - mean) / std` without copying data.”

Every time you wrote `3 * v` or `a + 1`, broadcasting was doing the work. It deserves to be named because it is NumPy's most powerful and most confusing feature.

**Broadcasting** lets NumPy operate on arrays of different shapes by virtually stretching the smaller one — without allocating any memory.

```python
a = np.array([[1, 2, 3],
              [4, 5, 6]])          # (2, 3)
b = np.array([10, 20, 30])         # (3,)
a + b
# [[11 22 33]
#  [14 25 36]]                     ← b was applied to every row
```

**The rule.** Align shapes from the **right**. Two dimensions are compatible if they are equal, or one of them is 1. Missing dimensions on the left are treated as 1.

```
a:  (2, 3)
b:     (3)  →  (1, 3)  →  stretched to (2, 3)  ✓

a:  (2, 3)
b:     (2)  →  (1, 2)  →  3 vs 2, neither is 1  ✗ ERROR
```

To make the second case work you reshape explicitly: `b.reshape(-1, 1)` gives `(2, 1)`, which broadcasts across columns.

**This is exactly what `StandardScaler` does** in Part 4:

```python
X_scaled = (X - X.mean(axis=0)) / X.std(axis=0)
#           (n, f) - (f,)        /  (f,)
```

One line, no loops, every feature standardised. When you understand that line you understand why the whole stack is written this way.

---

## 2.10 The mental model to carry forward 🟢

| You think | NumPy does |
|---|---|
| "For each element, square it" | `arr ** 2` |
| "Keep rows where x > 5" | `arr[arr[:, 0] > 5]` |
| "Average each column" | `arr.mean(axis=0)` |
| "Which class had the highest score?" | `arr.argmax(axis=1)` |
| "Standardise every feature" | `(arr - arr.mean(0)) / arr.std(0)` |
| "Predict with these weights" | `X @ w + b` |

If you catch yourself writing a `for` loop over an array, stop and look for the vectorised form. It is almost always there, and it is almost always faster and shorter.

---

> [!check] ✅ Key takeaways
> - NumPy is fast because arrays are typed, contiguous, and loops run in C — think in whole arrays, not rows.
> - `axis=0` collapses rows (one result per column); `axis=1` collapses columns.
> - Basic slices are **views** (edits propagate); boolean and fancy indexing return **copies**.
> - Broadcasting compares shapes from the right: each pair must match or be 1.
> - `@` is matrix multiplication; know the shapes (n, d) @ (d, k) → (n, k).
> - pandas, scikit-learn and PyTorch all share this model — learn it once.

## ⚡ Interview quick-fire

Cover the right-hand column and answer out loud first.

| Question | Strong short answer |
|---|---|
| **Why is NumPy fast?** | Contiguous typed memory and loops implemented in C (vectorisation), with no per-element Python overhead. |
| **`axis=0` vs `axis=1`?** | `axis=0` collapses the rows (one result per column); `axis=1` collapses the columns (one result per row). |
| **Does slicing copy?** | Basic slicing returns a **view** (changes propagate to the original); boolean or fancy indexing returns a **copy**. Use `.copy()` when in doubt. |
| **Standardise each column of `X`?** | `(X - X.mean(axis=0)) / X.std(axis=0)` — broadcasting shape (n, d) against (d,). |
| **Numerically stable softmax?** | `e = np.exp(z - z.max(axis=1, keepdims=True)); e / e.sum(axis=1, keepdims=True)`. Subtracting the max avoids overflow. |
| **Pairwise distances without loops?** | `np.sqrt(((A[:, None, :] - B[None, :, :]) ** 2).sum(-1))` — broadcasting to shape (n, m, d). |

---

## Further reading

- **NumPy: the absolute basics for beginners** — https://numpy.org/doc/stable/user/absolute_beginners.html (the official tutorial; short and genuinely good)
- **NumPy broadcasting docs** — https://numpy.org/doc/stable/user/basics.broadcasting.html
- **3Blue1Brown, *Essence of Linear Algebra*** (YouTube series) — the best available visual explanation of what matrices, determinants and eigenvectors *mean*. If the linear algebra in this part felt like symbol-pushing, watch this before Part 9 (PCA).
- **Python for Data Analysis**, Wes McKinney (3rd ed., O'Reilly) — Chapter 4 is NumPy; written by the creator of Pandas. Free online at https://wesmckinney.com/book/
- **From Python to NumPy**, Nicolas Rougier — free online, focused entirely on vectorisation technique.

---

<!-- nav -->
> [!example] 🧭 Step 2 of 26 · Stage 1 of 7: Toolkit
> ← [Part 01 · Python](01_Python_Foundations.md) · [Part 03 · Pandas](03_Pandas.md) → · [Course map](00_START_HERE.md)
<!-- /nav -->
