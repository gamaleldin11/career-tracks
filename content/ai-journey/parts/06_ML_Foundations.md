# Part 6 — Machine Learning Foundations

<!-- nav -->
> [!example] 🧭 Step 8 of 26 · Stage 3 of 7: Classical ML
> ← [Part 15 · Statistics & A/B tests](15_Statistics_Probability_and_AB_Testing.md) · [Part 07 · Regression](07_Supervised_Regression.md) → · [Course map](00_START_HERE.md)
<!-- /nav -->

**Source:** `AI_notebooks/2025-12-30/` (`descent.png`, `useful links.txt`), plus the concepts threaded through every project notebook from 2026-01-01 onward. **Lectures:** Lec 10

The 2025-12-30 session left almost nothing on disk — one image of gradient descent and a text file with two links:

```
https://mlu-explain.github.io/linear-regression/
https://www.youtube.com/watch?v=AeRwohPuUHQ
```

That is the theory session. This part reconstructs it, because everything in Parts 7–11 assumes it.

<!-- interview-focus -->

> [!tip] 🎯 Interview focus
> **Why it matters:** This is the most tested part at every level. Bias–variance, cross-validation, metrics and leakage appear in nearly every DS interview.
>
> | Level | What you should be able to do |
> |---|---|
> | 🟢 **Entry** | Define supervised/unsupervised learning, overfitting/underfitting, train/validation/test, k-fold CV, gradient descent, and the main metrics (RMSE, MAE, precision, recall, F1, AUC). |
> | 🟡 **Mid** | Diagnose a model from its learning curves; choose a validation scheme (stratified, grouped, time-based); frame a business problem end to end; monitoring and retraining. |
> | 🔴 **Senior** | Design the evaluation strategy for a new product, trade offline metrics against online impact, set up governance for model changes. |
>
> **⭐ Most-asked:** *Explain the bias–variance trade-off.* · *How does k-fold cross-validation work, and when is it wrong?* · *Precision vs recall — give a telecom example.* · *What is data leakage?* · *How do you know a model is ready for production?*
>
> **⏱ Time:** 5–6 h  ·  **Short on time?** Read §6.3–6.6, §6.13 (drill).

**Legend:** 🟢 Entry (0–2 yrs) · 🟡 Mid (2–5 yrs) · 🔴 Senior / specialist · ⭐ frequently asked · 📖 Géron, *Hands-On ML with Scikit-Learn and PyTorch* (2025) pages

> [!abstract]- 🗺️ Section map — level and book pages
>
> | § | Section | Level | 📖 Book |
> |---|---|:---:|---|
> | 6.1 | What "learning" means | 🟢 | — |
> | 6.2 | Linear regression, from the ground up | 🟢 ⭐ | Ch. 4 · pp. 136–141 |
> | 6.3 | Gradient descent | 🟢 ⭐ | Ch. 4 · pp. 142–153 |
> | 6.4 | Overfitting, underfitting, and the bias–variance tradeoff | 🟢 ⭐ | Ch. 1 · pp. 31–34 |
> | 6.5 | Cross-validation | 🟢 ⭐ | Ch. 2 · pp. 92–94 |
> | 6.6 | Metrics | 🟢 ⭐ | Ch. 2, Ch. 3 · pp. 45–47, pp. 111–124 |
> | 6.7 | The workflow, assembled | 🟢 | — |
> | 6.8 | The map of machine learning | 🟢 ⭐ | Ch. 1 · pp. 4–27 |
> | 6.9 | The main challenges: bad data and bad models | 🟢 | Ch. 1 · pp. 27–34 |
> | 6.10 | Testing and validating — the full protocol | 🟡 | Ch. 1 · pp. 35–39 |
> | 6.11 | Framing a project like a professional | 🟡 ⭐ | Ch. 2 · pp. 43–48, pp. 100–103 |
> | 6.12 | Fine-tuning at depth | 🟡 | Ch. 2 · pp. 94–100 |
> | 6.13 | Interview drill — ML fundamentals | 🟢 ⭐ | Ch. 1 · p. 39 |
> | 6.14 | Real-world examples — foundations in the wild | 🟡 | — |
>

---

## 6.1 What "learning" means 🟢

A supervised learning problem is: given examples `(x, y)`, find a function `f` such that `f(x) ≈ y` for examples you have **not** seen.

Three components, and every algorithm in this course is a different choice of the three:

| Component | Question it answers | Examples |
|---|---|---|
| **Hypothesis space** | What shapes of function am I willing to consider? | Straight lines (linear regression); axis-aligned boxes (decision trees); local neighbourhoods (KNN) |
| **Loss function** | How wrong is a given function? | MSE, log-loss, Gini impurity |
| **Optimiser** | How do I search for the least-wrong one? | Closed form, gradient descent, greedy splitting |

Once you see a model this way, new algorithms stop being a list to memorise. XGBoost is "additive trees + any differentiable loss + gradient descent in function space". A neural network is "composed affine maps and nonlinearities + cross-entropy + gradient descent".

### Supervised vs unsupervised

| | Supervised | Unsupervised |
|---|---|---|
| Data | `(X, y)` — labelled | `X` only |
| Goal | Predict `y` for new `X` | Find structure in `X` |
| Evaluate with | Held-out accuracy, RMSE, F1 | Internal metrics (silhouette, inertia) or human judgement |
| In this course | Parts 7, 8, 11 | Part 9 (PCA, clustering) |

The evaluation row is the important one. Supervised learning has a ground truth to check against; unsupervised learning does not, which is why the clustering notebook says:

> In clustering, there is no single 'accuracy'. We use **internal metrics** (e.g., inertia, silhouette).

### Regression vs classification

Both are supervised; they differ in the type of `y`.

- **Regression** — `y` is continuous. "How much will this customer spend?" (Part 7)
- **Classification** — `y` is a category. "Will they click the ad?" (Part 8), "How severe is this accident?" (Part 13)

The distinction determines your loss function and every metric you report. A confusion matrix is meaningless for regression; RMSE is meaningless for classification.

---

## 6.2 Linear regression, from the ground up 🟢 ⭐

> [!info] 📖 Géron Ch. 4 · “Linear Regression”, “The Normal Equation” · pp. 136–141

> [!quote] 💬 Say it in the interview
> “Linear regression predicts a weighted sum of the features, trained by minimising MSE, either in closed form (normal equation) or by gradient descent.”

The reference link the course gave — **MLU-Explain's Linear Regression** — is genuinely one of the best interactive explanations available, and it is worth opening while you read this section.

### The model

For one feature:

> **ŷ = w·x + b**

`w` is the slope (how much `y` changes per unit of `x`), `b` the intercept. For many features it becomes a dot product, exactly as in §2.8:

> **ŷ = w₁x₁ + w₂x₂ + … + wₙxₙ + b = w·x + b**

That is the whole model. Everything else is how you choose `w` and `b`.

### The loss

**Mean Squared Error:**

> **MSE = (1/n) Σ (yᵢ − ŷᵢ)²**

Why squared, rather than absolute error?

1. **It is differentiable everywhere.** `|x|` has a kink at zero; `x²` does not. Gradient descent needs a derivative.
2. **It penalises large errors disproportionately.** Being wrong by 10 costs 100, being wrong by 1 costs 1. Whether that is desirable depends on your problem — it also makes MSE sensitive to outliers, which is why MAE is sometimes preferred.
3. **It has a unique closed-form minimum** (see below).

<figure class="dia steps"><svg viewBox="0 0 720 256" role="img" aria-label="Eight salary points against years of experience. A guessed line leaves large residuals drawn as squares; the normal-equation line leaves much smaller squares, and its mean squared error is the minimum possible">
<line class="sLm" x1="64" y1="214" x2="430" y2="214"/><line class="sLm" x1="64" y1="214" x2="64" y2="24"/>
<text class="sS" x="104" y="230" text-anchor="middle">1</text>
<text class="sS" x="144" y="230" text-anchor="middle">2</text>
<text class="sS" x="184" y="230" text-anchor="middle">3</text>
<text class="sS" x="224" y="230" text-anchor="middle">4</text>
<text class="sS" x="264" y="230" text-anchor="middle">5</text>
<text class="sS" x="304" y="230" text-anchor="middle">6</text>
<text class="sS" x="344" y="230" text-anchor="middle">7</text>
<text class="sS" x="384" y="230" text-anchor="middle">8</text>
<text class="sS" x="56" y="192" text-anchor="end">20</text><line class="sLm" x1="64" y1="188" x2="430" y2="188" opacity=".15"/>
<text class="sS" x="56" y="140" text-anchor="end">40</text><line class="sLm" x1="64" y1="136" x2="430" y2="136" opacity=".15"/>
<text class="sS" x="56" y="88" text-anchor="end">60</text><line class="sLm" x1="64" y1="84" x2="430" y2="84" opacity=".15"/>
<text class="sS" x="56" y="36" text-anchor="end">80</text><line class="sLm" x1="64" y1="32" x2="430" y2="32" opacity=".15"/>
<text class="sS" x="247" y="246" text-anchor="middle">years of experience (x)</text>
<text class="sS" x="20" y="120" text-anchor="middle" transform="rotate(-90 20 120)">salary, k (y)</text>
<g data-s="2-2"><line class="sLw" x1="80" y1="157.84" x2="408" y2="72.56" style="stroke-width:2.2"/><rect class="sW" x="104" y="151.6" width="32.76" height="32.76" rx="0" opacity=".35"/><line class="sLw" x1="104" y1="184.36" x2="104" y2="151.6" opacity=".7"/><rect class="sW" x="144" y="141.2" width="22.62" height="22.62" rx="0" opacity=".35"/><line class="sLw" x1="144" y1="163.82" x2="144" y2="141.2" opacity=".7"/><rect class="sW" x="184" y="128.98" width="1.82" height="1.82" rx="0" opacity=".35"/><line class="sLw" x1="184" y1="128.98" x2="184" y2="130.8" opacity=".7"/><rect class="sW" x="224" y="120.4" width="3.64" height="3.64" rx="0" opacity=".35"/><line class="sLw" x1="224" y1="124.04" x2="224" y2="120.4" opacity=".7"/><rect class="sW" x="264" y="110" width="22.36" height="22.36" rx="0" opacity=".35"/><line class="sLw" x1="264" y1="132.36" x2="264" y2="110" opacity=".7"/><rect class="sW" x="304" y="99.6" width="0" height="0" rx="0" opacity=".35"/><line class="sLw" x1="304" y1="99.6" x2="304" y2="99.6" opacity=".7"/><rect class="sW" x="344" y="89.2" width="1.3" height="1.3" rx="0" opacity=".35"/><line class="sLw" x1="344" y1="90.5" x2="344" y2="89.2" opacity=".7"/><rect class="sW" x="384" y="66.84" width="11.96" height="11.96" rx="0" opacity=".35"/><line class="sLw" x1="384" y1="66.84" x2="384" y2="78.8" opacity=".7"/></g>
<g data-s="3-3"><line class="sLg" x1="80" y1="185.755" x2="408" y2="61.8703" style="stroke-width:2.2"/><rect class="sG" x="104" y="176.69" width="7.67" height="7.67" rx="0" opacity=".35"/><line class="sLg" x1="104" y1="184.36" x2="104" y2="176.69" opacity=".7"/><rect class="sG" x="144" y="161.582" width="2.23786" height="2.23786" rx="0" opacity=".35"/><line class="sLg" x1="144" y1="163.82" x2="144" y2="161.582" opacity=".7"/><rect class="sG" x="184" y="128.98" width="17.4943" height="17.4943" rx="0" opacity=".35"/><line class="sLg" x1="184" y1="128.98" x2="184" y2="146.474" opacity=".7"/><rect class="sG" x="224" y="124.04" width="7.32643" height="7.32643" rx="0" opacity=".35"/><line class="sLg" x1="224" y1="124.04" x2="224" y2="131.366" opacity=".7"/><rect class="sG" x="264" y="116.259" width="16.1014" height="16.1014" rx="0" opacity=".35"/><line class="sLg" x1="264" y1="132.36" x2="264" y2="116.259" opacity=".7"/><rect class="sG" x="304" y="99.6" width="1.55071" height="1.55071" rx="0" opacity=".35"/><line class="sLg" x1="304" y1="99.6" x2="304" y2="101.151" opacity=".7"/><rect class="sG" x="344" y="86.0429" width="4.45714" height="4.45714" rx="0" opacity=".35"/><line class="sLg" x1="344" y1="90.5" x2="344" y2="86.0429" opacity=".7"/><rect class="sG" x="384" y="66.84" width="4.095" height="4.095" rx="0" opacity=".35"/><line class="sLg" x1="384" y1="66.84" x2="384" y2="70.935" opacity=".7"/></g>
<circle class="sP" cx="104.0" cy="184.4" r="4"/>
<circle class="sP" cx="144.0" cy="163.8" r="4"/>
<circle class="sP" cx="184.0" cy="129.0" r="4"/>
<circle class="sP" cx="224.0" cy="124.0" r="4"/>
<circle class="sP" cx="264.0" cy="132.4" r="4"/>
<circle class="sP" cx="304.0" cy="99.6" r="4"/>
<circle class="sP" cx="344.0" cy="90.5" r="4"/>
<circle class="sP" cx="384.0" cy="66.8" r="4"/>
<rect class="sN" x="458" y="30" width="250" height="196" rx="8"/>
<text class="sT" x="583" y="52" text-anchor="middle">MSE = mean of the square areas</text>
<g data-s="2-2"><text class="sWt" x="583" y="86" text-anchor="middle">guess: ŷ = 4x + 30</text><text class="sWt" x="583" y="108" text-anchor="middle">MSE = 41.5</text><text class="sS" x="583" y="140" text-anchor="middle">largest square: x = 1, a miss of 12.6</text><text class="sS" x="583" y="156" text-anchor="middle">which alone adds 159 / 8 = 19.8</text></g>
<g data-s="3-3"><text class="sS" x="470" y="82" xml:space="preserve" style="white-space:pre">np.linalg.inv(X.T @ X) @ X.T @ y</text><text class="sGt" x="583" y="108" text-anchor="middle">b = 18.54,  w = 5.81</text><text class="sGt" x="583" y="130" text-anchor="middle">MSE = 13.3</text><text class="sS" x="583" y="160" text-anchor="middle">no other line has a smaller</text><text class="sS" x="583" y="176" text-anchor="middle">total square area</text><text class="sS" x="583" y="204" text-anchor="middle">X has a column of 1s for b: shape (8, 2)</text></g>
</svg><ol class="dia-steps">
<li>Eight people: years of experience and salary. We want the line ŷ = w·x + b that fits them best.</li>
<li>Try a guess, ŷ = 4x + 30. Each residual becomes a square; MSE is the average square area (41.5).</li>
<li>The normal equation computes the best line in one step: w = 5.81, b = 18.54, MSE = 13.3. Squaring is why one large miss counts more than several small ones.</li>
</ol><figcaption>Mean squared error, drawn literally: every residual is the side of a square. The normal equation finds the line with the least total area.</figcaption></figure>

Squaring also makes the units awkward (dollars-squared), which is why we report **RMSE** — the square root — instead.

### Two ways to solve it

**Closed form — the normal equation:**

> **β = (XᵀX)⁻¹ Xᵀy**

One matrix expression gives the exact optimum. This is why Part 2 spent time on `inv`, transpose, and the determinant. It also explains the failure mode: when features are perfectly collinear, `XᵀX` is singular, no inverse exists, and there is no unique answer. That is multicollinearity, and it is why the capstone checks VIF.

Cost: roughly O(n·p²) — fine for hundreds of features, impossible for millions of rows or features.

**Iterative — gradient descent:**

Which is what the session's `descent.png` is about, and what generalises to every other model in this course.

---

## 6.3 Gradient descent 🟢 ⭐

> [!info] 📖 Géron Ch. 4 · “Gradient Descent” · pp. 142–153

![The learning rate decides whether gradient descent crawls, converges or diverges.](figures/fig06_gd_learning_rates.png)
*The learning rate decides whether gradient descent crawls, converges or diverges.*

> [!quote] 💬 Say it in the interview
> “Gradient descent moves the parameters against the gradient of the loss. The learning rate is the key knob: too small is slow, too large diverges. Mini-batch GD is the practical default.”

### The idea

You are standing on a hillside in fog. You want the bottom. You cannot see the valley, but you can feel which way is downhill under your feet. So: take a step downhill. Repeat.

Formally — for each parameter, compute the partial derivative of the loss with respect to it (the gradient points **uphill**), then step in the opposite direction:

> **w ← w − α · ∂L/∂w**

`α` is the **learning rate** — how big a step you take.

### The learning rate is the whole game

| α | What happens |
|---|---|
| Too small | Converges, but takes forever. You waste hours. |
| About right | Steady, fast descent to the minimum. |
| Too large | Overshoots the minimum, bounces between walls. |
| Far too large | **Diverges** — loss increases every step, then becomes `NaN`. |

If your neural network's loss becomes `NaN` in the first few epochs, the learning rate is the first thing to check. The ANN in Part 11 uses `learning_rate=0.001` — the Adam default, and a sane starting point.

### The three variants

| Variant | Gradient computed on | Character |
|---|---|---|
| **Batch** | The entire dataset, every step | Smooth, accurate, slow. Needs all data in memory. |
| **Stochastic (SGD)** | One sample at a time | Very noisy, very fast per step. The noise can help escape bad regions. |
| **Mini-batch** | A small batch (32, 64, 256…) | **The universal practical choice.** Smooth enough, and GPU-friendly. |

`batch_size=64` in the Part 11 ANN is mini-batch gradient descent. One pass over all batches is one **epoch**.

<figure class="dia"><svg viewBox="0 0 720 248" role="img" aria-label="Three gradient-descent variants on the same loss surface: batch descent moves smoothly, stochastic descent wanders noisily, mini-batch descent is in between">
<ellipse class="sLm" cx="360" cy="120" rx="31" ry="18" fill="none" opacity=".5"/>
<ellipse class="sLm" cx="360" cy="120" rx="70" ry="40" fill="none" opacity=".5"/>
<ellipse class="sLm" cx="360" cy="120" rx="121" ry="69" fill="none" opacity=".5"/>
<ellipse class="sLm" cx="360" cy="120" rx="185" ry="106" fill="none" opacity=".5"/>
<polyline class="sLg" points="150.0,24.0 175.2,35.5 197.4,45.7 216.9,54.6 234.1,62.4 249.2,69.3 262.5,75.4 274.2,80.8 284.5,85.5 293.5,89.6 301.5,93.3 308.5,96.5 314.7,99.3 320.1,101.8 324.9,104.0 329.1,105.9 332.8,107.6 336.1,109.1 339.0,110.4 341.5,111.5 343.7,112.6 345.7,113.4 347.4,114.2 348.9,114.9 350.2,115.5 351.4,116.1 352.4,116.5 353.3,117.0 354.1,117.3 354.8,117.6 355.5,117.9" fill="none" stroke-width="1.8"/>
<text class="sGt" x="20" y="200">batch: smooth, every step uses all the data</text>
<polyline class="sLr" points="150.0,24.0 141.4,39.0 187.8,54.1 205.1,73.0 248.0,90.4 242.7,101.9 244.3,118.8 243.8,120.9 272.4,133.2 263.5,135.4 271.2,141.9 328.0,143.2 377.7,143.6 354.8,161.6 363.3,161.7 363.3,133.4 348.3,132.2 347.5,121.1 348.9,122.4 325.3,125.8 263.2,121.2 278.9,121.0 302.9,137.6 296.8,122.3 301.5,134.9 334.2,135.2 340.8,158.9 334.5,150.3 347.2,167.4 356.6,186.7 385.4,177.1" fill="none" stroke-width="1.8"/>
<text class="sRt" x="20" y="218">stochastic: one row per step, noisy</text>
<polyline class="sLw" points="150.0,24.0 176.3,33.3 199.4,46.2 222.3,50.3 230.6,63.9 249.9,71.8 278.2,81.3 295.7,84.2 290.2,84.4 298.2,85.1 316.3,85.5 319.7,85.4 327.8,92.2 332.3,91.2 326.4,95.2 321.8,94.8 316.1,93.4 331.5,95.3 336.8,99.3 342.7,104.1 336.5,103.9 347.3,104.6 343.7,109.4 347.4,107.5 348.8,112.4 354.1,117.9 353.2,119.3 357.5,124.2 357.3,118.7 352.4,117.6 346.7,118.6" fill="none" stroke-width="1.8"/>
<text class="sWt" x="20" y="236">mini-batch (32–256 rows): the practical middle</text>
<circle class="sP" cx="150" cy="24" r="5"/><circle class="sPg" cx="360" cy="120" r="4"/>
</svg><figcaption>Same surface, same learning rate, different amounts of data per step. Simulated with gradient noise.</figcaption></figure>

### Why scaling matters — the geometric answer

This is the payoff for Part 4's feature scaling section.

If `x₁ ∈ [0, 1]` and `x₂ ∈ [0, 100000]`, the loss surface is a long thin ravine rather than a round bowl. Gradient descent zig-zags across the narrow direction and crawls along the long one — it can take orders of magnitude more steps for the same result.

Standardising features makes the contours roughly circular, so the gradient points more or less straight at the minimum. **This is the mechanism behind "scale your features", and it is why the requirement applies to gradient-based methods and not to trees.**

<figure class="dia"><svg viewBox="0 0 720 234" role="img" aria-label="Gradient descent on unscaled features zig-zags across a long thin ravine and is still far from the minimum after 25 steps; on standardised features the bowl is round and it reaches the minimum">
<text class="sRt" x="190" y="22" text-anchor="middle">unscaled: a long thin ravine</text>
<ellipse class="sLm" cx="190" cy="118" rx="39" ry="9" fill="none" opacity=".55"/>
<ellipse class="sLm" cx="190" cy="118" rx="76" ry="18" fill="none" opacity=".55"/>
<ellipse class="sLm" cx="190" cy="118" rx="132" ry="31" fill="none" opacity=".55"/>
<polyline class="sLr" points="46.0,58.0 49.0,169.6 51.9,73.6 54.7,156.2 57.5,85.2 60.3,146.2 63.0,93.7 65.6,138.9 68.2,100.0 70.7,133.4 73.1,104.7 75.6,129.4 77.9,108.2 80.2,126.4 82.5,110.7 84.7,124.2 86.9,112.6 89.0,122.6 91.1,114.0 93.2,121.4 95.2,115.1 97.1,120.5 99.0,115.8 100.9,119.9 102.8,116.4 104.6,119.4" fill="none" stroke-width="2.2"/>
<circle class="sP" cx="46" cy="58" r="5"/><circle class="sPg" cx="190" cy="118" r="4"/>
<text class="sRt" x="190" y="222" text-anchor="middle">after 25 steps: still far along the ravine</text>
<text class="sGt" x="530" y="22" text-anchor="middle">standardised: a round bowl</text>
<ellipse class="sLm" cx="530" cy="118" rx="14" ry="14" fill="none" opacity=".55"/>
<ellipse class="sLm" cx="530" cy="118" rx="28" ry="28" fill="none" opacity=".55"/>
<ellipse class="sLm" cx="530" cy="118" rx="45" ry="45" fill="none" opacity=".55"/>
<ellipse class="sLm" cx="530" cy="118" rx="64" ry="64" fill="none" opacity=".55"/>
<polyline class="sLg" points="452.0,60.8 475.4,78.0 491.8,90.0 503.2,98.4 511.3,104.3 516.9,108.4 520.8,111.3 523.6,113.3 525.5,114.7 526.9,115.7 527.8,116.4 528.5,116.9 528.9,117.2 529.2,117.4 529.5,117.6 529.6,117.7 529.7,117.8 529.8,117.9 529.9,117.9 529.9,117.9 529.9,118.0 530.0,118.0 530.0,118.0 530.0,118.0 530.0,118.0 530.0,118.0" fill="none" stroke-width="2.2"/>
<circle class="sP" cx="452" cy="61" r="5"/><circle class="sPg" cx="530" cy="118" r="4"/>
<text class="sGt" x="530" y="222" text-anchor="middle">after 25 steps: at the minimum</text>
</svg><figcaption>Why "scale your features": the same 25 gradient steps, computed on both surfaces. Only the feature scales differ.</figcaption></figure>

### Convexity

Linear and logistic regression have **convex** loss surfaces: one global minimum, no local traps. Gradient descent will find it from any starting point.

Neural networks are **non-convex**: many local minima and vast saddle regions. That sounds fatal and is not — in high dimensions, most critical points are saddles rather than bad minima, and modern optimisers (Adam, momentum) handle them well. But it explains why a neural network gives different results on different random initialisations, and why `random_state` / seeding matters even more there.

---

## 6.4 Overfitting, underfitting, and the bias–variance tradeoff 🟢 ⭐

> [!info] 📖 Géron Ch. 1 · “Overfitting / Underfitting the Training Data” · pp. 31–34

![Underfitting vs overfitting, and the U-shaped total error.](figures/fig06_bias_variance.png)
*Underfitting vs overfitting, and the U-shaped total error.*

> [!quote] 💬 Say it in the interview
> “High bias = underfitting: both train and validation errors are high. High variance = overfitting: low train error, high validation error. Fix bias with more capacity or features; fix variance with more data, regularisation or a simpler model.”

The central problem of the field.

### The two failure modes

**Underfitting (high bias)** — the model is too simple to capture the pattern. Fitting a straight line to a curve. Symptom: **poor on training data, poor on test data.**

**Overfitting (high variance)** — the model is complex enough to memorise noise. Symptom: **excellent on training data, poor on test data.** This is the common one.

### The decomposition

Expected prediction error decomposes into three parts:

> **Error = Bias² + Variance + Irreducible noise**

- **Bias** — error from wrong assumptions. A linear model on a quadratic relationship has high bias no matter how much data you give it.
- **Variance** — how much the fitted model would change if you resampled the training set. A deep unpruned decision tree has huge variance: change ten rows and you get a different tree.
- **Irreducible noise** — the floor. No model beats it.

Increasing model complexity lowers bias and raises variance. The optimum is in the middle, and the only way to locate it is to measure on held-out data.

### The diagnostic table

This is the practical form. Memorise it:

| Train score | Test score | Diagnosis | Do this |
|---|---|---|---|
| Low | Low | **Underfitting** | More complex model, better features, less regularisation |
| High | Low | **Overfitting** | More data, simpler model, more regularisation, feature selection |
| High | High | Good fit | Ship it |
| Low | High | Something is wrong | Bug, tiny/unrepresentative test set, or leakage |

The Ecommerce notebook computes both train and test metrics for exactly this comparison:

```python
y_pred_train_lr = lr_pipe.predict(X_train)
rmse_train_lr = np.sqrt(mean_squared_error(y_train, y_pred_train_lr))
r2_train_lr   = r2_score(y_train, y_pred_train_lr)

y_pred_test_lr = lr_pipe.predict(X_test)
rmse_test_lr = np.sqrt(mean_squared_error(y_test, y_pred_test_lr))
```

**Always report both.** A test score alone cannot tell you *which* problem you have, and therefore cannot tell you what to do next.

### Regularisation — the standard lever

Penalise complexity directly by adding a term to the loss:

| Method | Penalty | Effect |
|---|---|---|
| **Ridge (L2)** | `λ Σ wᵢ²` | Shrinks all coefficients toward zero; handles collinearity well |
| **Lasso (L1)** | `λ Σ|wᵢ|` | Drives some coefficients **exactly to zero** — automatic feature selection |
| **Elastic Net** | Both | Compromise |

`λ` (called `alpha` in sklearn, `C = 1/λ` in `LogisticRegression`) controls the strength. Choose it by cross-validation.

⚠️ **Regularisation penalises coefficient magnitude, so it is scale-dependent.** An unscaled feature with a small range gets a large coefficient and is penalised more heavily for no good reason. **You must scale before regularising.** This is a second, independent reason for `StandardScaler`.

The course does not cover Ridge and Lasso explicitly. `LogisticRegression` in sklearn applies L2 by default, though, so you have been using regularisation whether you knew it or not. **The gap is now filled in Part 7, §7.14–7.18:** the Normal equation vs gradient descent, learning curves, Ridge/Lasso/Elastic Net with the geometry of why ℓ₁ gives sparsity, and early stopping, all from Géron Ch. 4.

---

## 6.5 Cross-validation 🟢 ⭐

> [!info] 📖 Géron Ch. 2 · “Better Evaluation Using Cross-Validation” · pp. 92–94

![Five-fold cross-validation: every row is used for validation exactly once. The test set stays locked away.](figures/fig06_kfold.png)
*Five-fold cross-validation: every row is used for validation exactly once. The test set stays locked away.*

> [!quote] 💬 Say it in the interview
> “k-fold CV trains on k−1 folds and validates on the one left out, k times, and I report mean ± std. I use stratified folds for classification, grouped folds when rows share an entity, and time-series splits for temporal data.”

### Why a single split is not enough

`train_test_split(test_size=0.2)` gives you one number. Change `random_state` and you get a different number. On a 500-row dataset the spread can be several percentage points — larger than the difference between the models you are comparing.

**k-fold cross-validation** fixes this. Split the training data into k parts; train on k−1 and validate on the held-out one; rotate; average.

```python
from sklearn.model_selection import KFold, cross_validate

cv = KFold(n_splits=5, shuffle=True, random_state=RANDOM_STATE)

cv_scores = cross_validate(
    lr_pipe, X, y, cv=cv,
    scoring={"rmse": "neg_root_mean_squared_error", "r2": "r2"},
    return_train_score=True
)
```

You get five scores. Report the **mean and the standard deviation**. The standard deviation is the part people omit and the part that matters: a model scoring 0.82 ± 0.01 is a different proposition from one scoring 0.82 ± 0.09.

The capstone does this correctly:

```python
results.append({
    "model": name,
    "f1_macro_mean": np.mean(cv_out["test_f1_macro"]),
    "f1_macro_std":  np.std(cv_out["test_f1_macro"]),
    ...
})
```

### `StratifiedKFold` for classification

```python
cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=RANDOM_STATE)
```

Each fold preserves the class proportions. Same argument as `stratify=y` in §4.5, applied per fold. **Use it for every classification problem.** (sklearn actually defaults to stratified folds when you pass an integer `cv` to a classifier, but being explicit is better.)

### Other splitters worth knowing

- **`TimeSeriesSplit`** — always trains on the past and validates on the future. Mandatory for anything time-ordered; random k-fold on a time series is temporal leakage.
- **`GroupKFold`** — keeps all rows sharing a group ID in the same fold. Needed when you have repeated measurements per subject; otherwise the same patient appears in both train and validation, and your score is memorisation.

Note this would matter for the Road Accidents data: multiple casualty rows share a `Reference Number`. A strict treatment would use `GroupKFold` on it. The capstone does not, which is a defensible simplification but worth knowing.

### ⚠️ Cross-validate the pipeline, not the model

```python
cross_validate(pipe, X, y, cv=cv)      # ✅ preprocessing refit inside each fold
cross_validate(model, X_scaled, y)     # ❌ scaler saw all the data — leakage
```

If you scale first and cross-validate second, every fold's "validation" data contributed to the scaler's mean and σ. The reported score is optimistic. Passing the whole pipeline makes this impossible to get wrong.

### Hyperparameter search

**Parameters** are learned from data (regression coefficients, network weights). **Hyperparameters** are set by you before training (k in KNN, tree depth, learning rate).

```python
param_grid = {
    "model__n_neighbors": [3, 5, 7, 9, 11],
    "model__weights": ["uniform", "distance"],
    "model__p": [1, 2]                     # Manhattan / Euclidean
}

grid = GridSearchCV(
    estimator=knn_pipe,
    param_grid=param_grid,
    scoring="neg_root_mean_squared_error",
    cv=5,
    n_jobs=-1
)
grid.fit(X_train, y_train)
grid.best_params_, grid.best_estimator_
```

Two syntax details:

- **`model__n_neighbors`** — double underscore. It means "the parameter `n_neighbors` of the pipeline step named `model`". This is how you tune inside a pipeline, and you can nest further: `preprocess__num__imputer__strategy`.
- **`n_jobs=-1`** — use all CPU cores.

`GridSearchCV` tries every combination — here 5 × 2 × 2 = 20 configurations × 5 folds = 100 fits. It explodes combinatorially. `RandomizedSearchCV` samples a fixed number of random configurations instead and is usually the better choice beyond three hyperparameters; empirically it finds comparable optima for a fraction of the compute.

**`scoring="neg_root_mean_squared_error"`** — note the `neg_`. sklearn's convention is that **higher is always better**, so error metrics are negated. Your best RMSE will print as a negative number. This confuses everyone once.

---

## 6.6 Metrics 🟢 ⭐

> [!info] 📖 Géron Ch. 2 · “Select a Performance Measure” pp. 45–47; Ch. 3 · “Performance Measures” pp. 111–124

![The confusion matrix: every classification metric is built from these four cells.](figures/fig06_confusion_matrix.png)
*The confusion matrix: every classification metric is built from these four cells.*

> [!quote] 💬 Say it in the interview
> “I pick the metric from the business cost: RMSE/MAE for regression, precision/recall/PR-AUC for imbalanced classification, and I always compare against a dummy baseline.”

### Regression metrics

| Metric | Formula | Reads as |
|---|---|---|
| **MAE** | mean(\|y − ŷ\|) | Average error, in the target's own units. Robust to outliers. |
| **MSE** | mean((y − ŷ)²) | Penalises large errors. Units are squared — not interpretable. |
| **RMSE** | √MSE | Same units as the target. The default report. |
| **R²** | 1 − SS_res/SS_tot | Fraction of variance explained. 1 is perfect, 0 is "no better than predicting the mean", negative is worse than that. |

```python
rmse = np.sqrt(mean_squared_error(y_test, y_pred))
r2   = r2_score(y_test, y_pred)
```

**RMSE and R² answer different questions.** RMSE says *how far off are we, in dollars*. R² says *how much of the variation did we capture*. Report both: RMSE for the stakeholder, R² for the comparison across datasets.

**MAE vs RMSE:** RMSE > MAE always, and the gap grows with error variance. If RMSE is much larger than MAE, a few predictions are very wrong — go look at them.

### Classification metrics

Start with the confusion matrix. For a binary problem:

|  | Predicted Negative | Predicted Positive |
|---|---|---|
| **Actual Negative** | TN | FP *(Type I error — false alarm)* |
| **Actual Positive** | FN *(Type II error — miss)* | TP |

Everything else is derived:

| Metric | Formula | Question it answers |
|---|---|---|
| **Accuracy** | (TP+TN)/all | What fraction did I get right? |
| **Precision** | TP/(TP+FP) | Of those I flagged, how many were real? |
| **Recall** (sensitivity) | TP/(TP+FN) | Of the real ones, how many did I catch? |
| **F1** | 2·P·R/(P+R) | Harmonic mean of precision and recall |
| **ROC-AUC** | area under TPR-vs-FPR curve | How well are the classes ranked, at any threshold? |

**Precision vs recall is a business decision, not a statistical one:**

- **Cancer screening** — a miss is fatal, a false alarm means another test. **Maximise recall.**
- **Spam filtering** — a missed spam is an annoyance, a real email in the spam folder is a disaster. **Maximise precision.**
- **Fraud detection** — depends entirely on the cost of investigating a flag versus the cost of a fraudulent transaction.

**Why F1 uses the harmonic mean:** the arithmetic mean of precision 1.0 and recall 0.0 is 0.5, which flatters a useless model. The harmonic mean is 0. It punishes imbalance between the two, which is the point.

### Averaging for multi-class

The capstone reports F1 in two flavours, and the difference matters:

| Average | How | Effect |
|---|---|---|
| **`macro`** | Compute F1 per class, then average unweighted | Every class counts equally — **rare classes matter as much as common ones** |
| **`weighted`** | Average weighted by class support | Dominated by the majority class |
| **`micro`** | Pool all TP/FP/FN globally | Equals accuracy in single-label multi-class |

> This is why we prefer **F1-macro**

Correct, and it is the key metric decision in the whole project. On Road Accidents, `Slight` is ~89% of the data. Weighted F1 would be almost entirely a measure of how well you predict `Slight` — which is easy and uninteresting. Macro F1 forces the `Fatal` class, with a handful of examples, to count as much as `Slight`.

**Choose your metric before you look at results.** Otherwise you will pick the one that flatters the model you already built.

### ROC-AUC and the threshold

A classifier does not really output a class; it outputs a **probability**. `predict()` just applies a 0.5 threshold to `predict_proba()`.

The **ROC curve** plots True Positive Rate against False Positive Rate as you sweep that threshold from 0 to 1. **AUC** is the area underneath.

Interpretation: **AUC is the probability that a randomly chosen positive is ranked above a randomly chosen negative.**

- 1.0 — perfect ranking
- 0.5 — random guessing
- <0.5 — worse than random; your labels or signs are probably flipped

AUC's great advantage is being **threshold-independent** — it measures the quality of the ranking, not of one arbitrary cut. That is why it survives class imbalance better than accuracy.

For multi-class, One-vs-Rest:

```python
test_roc_auc = roc_auc_score(y_test_enc, y_proba,
                             multi_class="ovr", average="weighted",
                             labels=best_pipe.classes_)
```

📌 **Where AUC misleads:** on severe imbalance, ROC-AUC can look excellent while precision is terrible, because the false-positive rate has a huge denominator. For rare-positive problems (fraud at 0.17%), report **Precision-Recall AUC / average precision** as well. The course notebooks skipped it; Part 8 §8.12.5 covers it in full.

### The baseline — the most under-used idea in the course

```python
from sklearn.dummy import DummyClassifier

dummy = DummyClassifier(strategy="most_frequent", random_state=RANDOM_STATE)
dummy_pipe = ImbPipeline(steps=[("preprocess", preprocessor), ("model", dummy)])
cv_out_dummy = cross_validate(dummy_pipe, X_train, y_train_enc,
                              scoring=scoring, cv=cv, n_jobs=-1)
```

The capstone's own justification:

> Before trusting any ML model, we compare against a **baseline** model. […] If our ML models do **not** outperform this baseline, then the ML pipeline is not providing real value.

**Do this on every project, first, before any modelling.** It takes four lines and it calibrates every number that follows. On Road Accidents the dummy scores ~89% accuracy and ~0.31 macro-F1; knowing that instantly tells you which of your model's numbers are real.

For regression, the equivalent is `DummyRegressor(strategy="mean")`, whose R² is 0 by construction.

---

## 6.7 The workflow, assembled 🟢

Every project notebook in this course follows the same skeleton. Internalise it and you have a template for any tabular problem:

```
 1. Load and profile          →  shape, info, describe, nulls, duplicates, cardinality
 2. Clean                     →  types, domain validation, sentinels
 3. Engineer features         →  datetime parts, flags, ratios, binned categories
 4. EDA                       →  univariate, bivariate, target relationships, correlations
 5. Split                     →  train_test_split(stratify=y)   ← nothing above touched test
 6. Build the pipeline        →  ColumnTransformer(numeric_pipe, categorical_pipe)
 7. Baseline                  →  DummyClassifier / DummyRegressor
 8. Compare models with CV    →  cross_validate(pipe, X_train, y_train, cv=StratifiedKFold)
 9. Tune the winner           →  GridSearchCV / RandomizedSearchCV
10. Evaluate ONCE on test     →  classification_report, confusion matrix, ROC-AUC
11. Interpret                 →  feature importance, SHAP, error analysis
12. Save artifacts            →  joblib.dump(pipeline), metrics.json, leaderboard.csv
```

Steps 5–8 are where correctness lives. Steps 1–4 are where insight lives. Step 11 is where trust lives.

---

## 6.8 The map of machine learning (Géron, Ch. 1) 🟢 ⭐

> [!info] 📖 Géron Ch. 1 · “What Is ML?” → “Instance- vs Model-Based Learning” · pp. 4–27

> [!quote] 💬 Say it in the interview
> “ML systems are classified by supervision (supervised, unsupervised, self-supervised, RL), by batch vs online learning, and by instance- vs model-based learning.”

<figure class="dia"><svg viewBox="0 0 720 224" role="img" aria-label="Three independent ways to classify machine learning systems: by supervision (supervised, unsupervised, semi-supervised, self-supervised, reinforcement), by batch versus online learning, and by instance-based versus model-based generalisation">
<text class="sT" x="14" y="46">1. supervision</text>
<rect class="sB" x="150" y="20" width="104.8" height="44" rx="6"/><text class="sT" x="202.4" y="39" text-anchor="middle">supervised</text><text class="sS" x="202.4" y="56" text-anchor="middle">churn yes/no</text>
<rect class="sV" x="262.8" y="20" width="104.8" height="44" rx="6"/><text class="sT" x="315.2" y="39" text-anchor="middle">unsupervised</text><text class="sS" x="315.2" y="56" text-anchor="middle">segments</text>
<rect class="sA" x="375.6" y="20" width="104.8" height="44" rx="6"/><text class="sT" x="428" y="39" text-anchor="middle">semi-supervised</text><text class="sS" x="428" y="56" text-anchor="middle">500 frauds + 5M</text>
<rect class="sG" x="488.4" y="20" width="104.8" height="44" rx="6"/><text class="sT" x="540.8" y="39" text-anchor="middle">self-supervised</text><text class="sS" x="540.8" y="56" text-anchor="middle">LLM pretraining</text>
<rect class="sW" x="601.2" y="20" width="104.8" height="44" rx="6"/><text class="sT" x="653.6" y="39" text-anchor="middle">reinforcement</text><text class="sS" x="653.6" y="56" text-anchor="middle">offer policy</text>
<text class="sT" x="14" y="106">2. over time</text>
<rect class="sB" x="150" y="80" width="274" height="44" rx="6"/><text class="sT" x="287" y="99" text-anchor="middle">batch</text><text class="sS" x="287" y="116" text-anchor="middle">retrain from scratch</text>
<rect class="sG" x="432" y="80" width="274" height="44" rx="6"/><text class="sT" x="569" y="99" text-anchor="middle">online</text><text class="sS" x="569" y="116" text-anchor="middle">partial_fit per chunk</text>
<text class="sT" x="14" y="166">3. generalisation</text>
<rect class="sA" x="150" y="140" width="274" height="44" rx="6"/><text class="sT" x="287" y="159" text-anchor="middle">instance-based</text><text class="sS" x="287" y="176" text-anchor="middle">KNN: compare to memory</text>
<rect class="sV" x="432" y="140" width="274" height="44" rx="6"/><text class="sT" x="569" y="159" text-anchor="middle">model-based</text><text class="sS" x="569" y="176" text-anchor="middle">fit θ, then predict</text>
<text class="sGt" x="360" y="212" text-anchor="middle">every system sits somewhere on all three: a churn LightGBM is supervised, batch and model-based</text>
</svg><figcaption>Géron's three axes: answer all three to describe any ML system in one sentence.</figcaption></figure>

> [!note] 📘 From the book
> Sections 6.8–6.13 add material from Géron's *Hands-On Machine Learning with Scikit-Learn and PyTorch* (2025), Chapters 1, 2 and 4. Chapter 1 is the vocabulary chapter; Géron says it covers concepts "that every data scientist should know by heart". Interviewers often open with exactly these questions.

### Two definitions worth quoting

- **Arthur Samuel (1959):** *the field of study that gives computers the ability to learn without being explicitly programmed.*
- **Tom Mitchell (1997):** *a program learns from experience **E** with respect to task **T** and performance measure **P** if its performance on T, as measured by P, improves with E.*

Mitchell's version is the useful one, because it makes you name T, E and P. For a churn model: T = flag subscribers likely to leave next month, E = historical subscribers with a churned/stayed label, P = recall at a fixed contact budget. Géron's counter-example: *downloading all of Wikipedia* gives you more data but no better performance on any task, so it is not machine learning.

### When ML is the right tool

Géron lists four situations:
1. Problems whose rule-based solution is a **long, fragile list of rules** (spam filters, fraud rules).
2. **Complex problems with no known algorithm** (speech, vision).
3. **Fluctuating environments.** Retraining is easier than rewriting rules. Géron's spam example: spammers switch from "4U" to "For U", and an ML filter adapts from newly flagged emails without anyone editing a rule.
4. **Getting insight from large data.** Inspecting what a model learned is *data mining*.

The converse matters too: if a simple rule works, is stable and is explainable, ship the rule. Say this in an interview; it signals judgement.

### Classification axis 1: how much supervision

| Type | Training data | Typical tasks | Telecom example |
|---|---|---|---|
| **Supervised** | Features + labels | Classification, regression | Churn (yes/no), next-month ARPU |
| **Unsupervised** | Features only | Clustering, dimensionality reduction, anomaly/novelty detection, association rules | Customer segmentation; detecting abnormal cell-tower traffic; "customers who buy bundle A also buy B" |
| **Semi-supervised** | Few labels, many unlabelled | Usually clustering + label propagation | 500 confirmed fraud cases + 5M unlabelled SIMs |
| **Self-supervised** | Unlabelled data from which labels are *generated* (mask part of the input, predict it) | Pretraining, then fine-tune | How LLMs and speech models (e.g. HuBERT) are pretrained |
| **Reinforcement learning** | An *agent* acts in an *environment* and receives *rewards*; it learns a *policy* | Games, robotics, some pricing/offer optimisation | Choosing which retention offer to make, learning from acceptance |

Terms to have ready:
- **Label vs target:** synonyms. "Label" is more common for classification, "target" for regression. Features are also called predictors or attributes.
- **Anomaly detection vs novelty detection:** novelty detection assumes a *clean* training set and flags anything unlike it. Anomaly detection tolerates contamination in training. Géron's example: with 1% Chihuahuas among dog photos, novelty detection should not flag a new Chihuahua, but anomaly detection might.
- **Transfer learning:** reuse a model trained on one task for another. This is the second half of self-supervised learning.
- **Feature extraction** (dimensionality reduction) merges correlated features into one. Géron's example: car mileage + age → "wear and tear".

### Classification axis 2: batch vs online

| | Batch (offline) learning | Online (incremental) learning |
|---|---|---|
| Trains on | All data at once, from scratch | Instances or mini-batches, one after another |
| Adapts to new data | Only by retraining on old + new data | Continuously |
| Examples | Random Forest, standard sklearn `fit` | SGD models: `SGDClassifier.partial_fit`, `MiniBatchKMeans`, neural nets |
| Risk | **Model rot / data drift** between retrains | **Bad data degrades the live model**, possibly quickly |

- **Out-of-core learning** means training on data too big for memory by streaming chunks. It uses online algorithms, but is usually run *offline*. Géron suggests calling it *incremental* learning to avoid the confusion.
- **The learning rate** controls how fast an online system adapts. Set it high and it adapts quickly but **catastrophically forgets** older patterns. Set it low and it has inertia, which also makes it robust to noise.
- Protect online systems with monitoring, an automatic "switch learning off" trigger, and rollback. Anomaly detection on the *inputs* catches bad data before it trains the model.
- Géron's warning: even a cats-vs-dogs model drifts, *"because cameras keep changing, along with image formats, sharpness, brightness"*. **Every production model needs a retraining plan.**

### Classification axis 3: instance-based vs model-based

- **Instance-based:** memorise the examples and predict by **similarity** to them (KNN). It works well on small data that changes often. It scales poorly: the training set must ship to production, prediction means searching it, and it struggles in high dimensions.
- **Model-based:** choose a model family (*model selection*), define a **cost function** (or a utility/fitness function), and let a **training algorithm** find the **parameters** that minimise the cost. Predicting on new data is called **inference**.

Géron's life-satisfaction example contrasts the two. Linear regression predicts 6.02 for Puerto Rico. 3-NN regression averages Poland (6.1), Portugal (5.4) and Estonia (5.7) to get 5.73. In sklearn the swap is one line.

⚠️ **"Model" has three meanings:** a model *type* (linear regression), a fully specified *architecture* (linear regression with one input), and a *trained* model with its parameters. **Parameters** are learned (θ₀, θ₁). **Hyperparameters** belong to the learning algorithm, are set before training, and stay constant during it (the regularisation strength, k in KNN).

---

## 6.9 The main challenges: bad data and bad models 🟢

> [!info] 📖 Géron Ch. 1 · “Main Challenges of Machine Learning” · pp. 27–34

Géron's framing: since the job is "select a model and train it on data", only two things can go wrong: **bad data** or **bad model**.

### Bad data

| Problem | What it looks like | Remedy |
|---|---|---|
| **Insufficient quantity** | Thousands of examples needed even for simple tasks, millions for vision/speech | More data, transfer learning, simpler models |
| **Non-representative data** | Training set doesn't cover the cases you'll predict | Better sampling. Beware **sampling noise** (small samples) and **sampling bias** (flawed method, even with big samples) |
| **Poor quality** | Errors, outliers, noise | Cleaning. Drop or fix outliers; decide per feature how to handle missing values |
| **Irrelevant features** | Garbage in, garbage out | **Feature engineering** = feature selection + feature extraction + creating new features from new data |

**"The unreasonable effectiveness of data."** Banko & Brill (2001) showed that very different algorithms, including simple ones, performed almost identically on a language task once they had enough data. Norvig et al. (2009) popularised the idea. Géron's caveat: small and medium datasets are still the norm, *"so don't abandon algorithms just yet."*

**Sampling bias, the classic story.** The 1936 *Literary Digest* poll mailed ~10 million people and got 2.4 million answers. It predicted Landon would win 57%; Roosevelt won with 62%. Two flaws: (1) the address lists (phone directories, magazine subscribers, clubs) skewed wealthy; (2) fewer than 25% responded, which is **nonresponse bias**. **Telecom translation:** a satisfaction model trained only on customers who answered an NPS survey is biased toward engaged customers. A churn model trained only on post-paid customers will not transfer to pre-paid.

### Bad model

**Overfitting** is when the model fits noise, because it is too complex for the amount and noisiness of the data. Géron's example: a model that notices every country with a "w" in its name (New Zealand, Norway, Sweden, Switzerland) has high life satisfaction. That rule is pure chance, and a complex model cannot tell. Fixes:
- **Simplify:** fewer parameters, fewer features, or **constrain the model (regularisation)**.
- **Get more data.**
- **Reduce noise:** fix errors, remove outliers.

The regularisation intuition in *degrees of freedom*: a line has two (intercept θ₀ and slope θ₁). Force θ₁ = 0 and you have one. Allow θ₁ but keep it small, and you have "somewhere between one and two". The hyperparameter controlling this trades training fit against generalisation.

**Underfitting** means the model is too simple for the structure in the data. Fixes: a more powerful model, better features, fewer constraints (less regularisation).

**Deployment issues:** a model can be too slow, too big, not scalable, insecure, or stale. That is why companies have **MLOps** teams. At e&-scale (tens of millions of subscribers), inference latency and batch-scoring cost are real design constraints.

---

## 6.10 Testing and validating — the full protocol 🟡

> [!info] 📖 Géron Ch. 1 · “Testing and Validating”, “Data Mismatch” · pp. 35–39

### Generalisation error

The error on new cases is the **generalisation error** (or out-of-sample error). The test set estimates it. **Low training error with high generalisation error is overfitting.**

Split size depends on data volume. 80/20 is typical, but with 10 million rows a 1% test set (100,000 rows) is plenty.

### Why you must not tune on the test set

Géron's cautionary tale: you try 100 values of a regularisation hyperparameter, pick the one with 5% test error, deploy, and get 15% in production. You **adapted the model to that particular test set**. The test error is now an optimistic, biased estimate.

<figure class="dia"><svg viewBox="0 0 720 244" role="img" aria-label="Simulation of tuning on the test set: one hundred hyperparameter values with true errors between 9 and 12 percent are each measured on 400 test rows; the best-looking one scores about 6 percent but its true error is about 9 percent, and over 3,000 repetitions the reported minimum averages about 6 percent against a true error of about 10 percent">
<line class="sLm" x1="66" y1="214" x2="470" y2="214"/><line class="sLm" x1="66" y1="214" x2="66" y2="26"/>
<text class="sS" x="58" y="218" text-anchor="end">4%</text><line class="sLm" x1="66" y1="214" x2="470" y2="214" opacity=".15"/>
<text class="sS" x="58" y="156.667" text-anchor="end">8%</text><line class="sLm" x1="66" y1="152.667" x2="470" y2="152.667" opacity=".15"/>
<text class="sS" x="58" y="95.3333" text-anchor="end">12%</text><line class="sLm" x1="66" y1="91.3333" x2="470" y2="91.3333" opacity=".15"/>
<text class="sS" x="58" y="34" text-anchor="end">16%</text><line class="sLm" x1="66" y1="30" x2="470" y2="30" opacity=".15"/>
<text class="sS" x="268" y="232" text-anchor="middle">100 hyperparameter values, sorted by their true error</text>
<polyline class="sLm" points="66.0,137.3 70.0,135.9 74.1,134.9 78.1,134.8 82.2,133.4 86.2,133.4 90.2,133.2 94.3,133.0 98.3,132.6 102.4,132.1 106.4,131.6 110.4,131.5 114.5,130.6 118.5,130.0 122.6,129.6 126.6,129.0 130.6,128.4 134.7,128.3 138.7,128.2 142.8,127.9 146.8,127.8 150.8,127.5 154.9,127.5 158.9,127.3 163.0,126.4 167.0,124.7 171.1,124.3 175.1,123.9 179.1,123.9 183.2,123.7 187.2,123.6 191.3,123.6 195.3,122.9 199.3,120.4 203.4,120.3 207.4,120.1 211.5,119.3 215.5,119.2 219.5,118.9 223.6,117.6 227.6,117.5 231.7,117.4 235.7,115.7 239.7,115.3 243.8,115.3 247.8,114.7 251.9,114.6 255.9,113.6 259.9,113.3 264.0,112.3 268.0,111.8 272.1,111.5 276.1,111.3 280.1,110.6 284.2,110.4 288.2,110.3 292.3,110.2 296.3,109.4 300.3,109.1 304.4,108.6 308.4,108.3 312.5,107.5 316.5,107.1 320.5,107.0 324.6,106.6 328.6,106.5 332.7,106.1 336.7,105.9 340.7,105.3 344.8,105.2 348.8,104.9 352.9,104.8 356.9,104.8 360.9,104.1 365.0,103.5 369.0,103.4 373.1,103.2 377.1,103.0 381.2,102.7 385.2,102.4 389.2,101.8 393.3,101.1 397.3,101.0 401.4,100.5 405.4,99.6 409.4,99.2 413.5,98.3 417.5,98.2 421.6,98.2 425.6,97.8 429.6,97.3 433.7,96.9 437.7,96.3 441.8,95.0 445.8,94.5 449.8,93.3 453.9,93.0 457.9,92.9 462.0,92.7 466.0,92.6" style="fill:none;stroke-width:2"/>
<circle class="sPv" cx="66.0" cy="133.5" r="2.6" opacity=".75"/>
<circle class="sPv" cx="70.0" cy="141.2" r="2.6" opacity=".75"/>
<circle class="sPv" cx="74.1" cy="118.2" r="2.6" opacity=".75"/>
<circle class="sPv" cx="78.1" cy="152.7" r="2.6" opacity=".75"/>
<circle class="sPv" cx="82.2" cy="141.2" r="2.6" opacity=".75"/>
<circle class="sPv" cx="86.2" cy="152.7" r="2.6" opacity=".75"/>
<circle class="sPv" cx="90.2" cy="125.8" r="2.6" opacity=".75"/>
<circle class="sPv" cx="94.3" cy="114.3" r="2.6" opacity=".75"/>
<circle class="sPv" cx="98.3" cy="179.5" r="2.6" opacity=".75"/>
<circle class="sPv" cx="102.4" cy="187.2" r="2.6" opacity=".75"/>
<circle class="sPv" cx="106.4" cy="133.5" r="2.6" opacity=".75"/>
<circle class="sPv" cx="110.4" cy="129.7" r="2.6" opacity=".75"/>
<circle class="sPv" cx="114.5" cy="141.2" r="2.6" opacity=".75"/>
<circle class="sPv" cx="118.5" cy="148.8" r="2.6" opacity=".75"/>
<circle class="sPv" cx="122.6" cy="145.0" r="2.6" opacity=".75"/>
<circle class="sPv" cx="126.6" cy="114.3" r="2.6" opacity=".75"/>
<circle class="sPv" cx="130.6" cy="118.2" r="2.6" opacity=".75"/>
<circle class="sPv" cx="134.7" cy="156.5" r="2.6" opacity=".75"/>
<circle class="sPv" cx="138.7" cy="160.3" r="2.6" opacity=".75"/>
<circle class="sPv" cx="142.8" cy="148.8" r="2.6" opacity=".75"/>
<circle class="sPv" cx="146.8" cy="102.8" r="2.6" opacity=".75"/>
<circle class="sPv" cx="150.8" cy="133.5" r="2.6" opacity=".75"/>
<circle class="sPv" cx="154.9" cy="148.8" r="2.6" opacity=".75"/>
<circle class="sPv" cx="158.9" cy="122.0" r="2.6" opacity=".75"/>
<circle class="sPv" cx="163.0" cy="102.8" r="2.6" opacity=".75"/>
<circle class="sPv" cx="167.0" cy="102.8" r="2.6" opacity=".75"/>
<circle class="sPv" cx="171.1" cy="129.7" r="2.6" opacity=".75"/>
<circle class="sPv" cx="175.1" cy="64.5" r="2.6" opacity=".75"/>
<circle class="sPv" cx="179.1" cy="68.3" r="2.6" opacity=".75"/>
<circle class="sPv" cx="183.2" cy="141.2" r="2.6" opacity=".75"/>
<circle class="sPv" cx="187.2" cy="95.2" r="2.6" opacity=".75"/>
<circle class="sPv" cx="191.3" cy="129.7" r="2.6" opacity=".75"/>
<circle class="sPv" cx="195.3" cy="141.2" r="2.6" opacity=".75"/>
<circle class="sPv" cx="199.3" cy="118.2" r="2.6" opacity=".75"/>
<circle class="sPv" cx="203.4" cy="145.0" r="2.6" opacity=".75"/>
<circle class="sPv" cx="207.4" cy="106.7" r="2.6" opacity=".75"/>
<circle class="sPv" cx="211.5" cy="145.0" r="2.6" opacity=".75"/>
<circle class="sPv" cx="215.5" cy="129.7" r="2.6" opacity=".75"/>
<circle class="sPv" cx="219.5" cy="141.2" r="2.6" opacity=".75"/>
<circle class="sPv" cx="223.6" cy="110.5" r="2.6" opacity=".75"/>
<circle class="sPv" cx="227.6" cy="114.3" r="2.6" opacity=".75"/>
<circle class="sPv" cx="231.7" cy="68.3" r="2.6" opacity=".75"/>
<circle class="sPv" cx="235.7" cy="118.2" r="2.6" opacity=".75"/>
<circle class="sPv" cx="239.7" cy="99.0" r="2.6" opacity=".75"/>
<circle class="sPv" cx="243.8" cy="118.2" r="2.6" opacity=".75"/>
<circle class="sPv" cx="247.8" cy="79.8" r="2.6" opacity=".75"/>
<circle class="sPv" cx="251.9" cy="110.5" r="2.6" opacity=".75"/>
<circle class="sPv" cx="255.9" cy="110.5" r="2.6" opacity=".75"/>
<circle class="sPv" cx="259.9" cy="91.3" r="2.6" opacity=".75"/>
<circle class="sPv" cx="264.0" cy="118.2" r="2.6" opacity=".75"/>
<circle class="sPv" cx="268.0" cy="76.0" r="2.6" opacity=".75"/>
<circle class="sPv" cx="272.1" cy="106.7" r="2.6" opacity=".75"/>
<circle class="sPv" cx="276.1" cy="114.3" r="2.6" opacity=".75"/>
<circle class="sPv" cx="280.1" cy="118.2" r="2.6" opacity=".75"/>
<circle class="sPv" cx="284.2" cy="64.5" r="2.6" opacity=".75"/>
<circle class="sPv" cx="288.2" cy="118.2" r="2.6" opacity=".75"/>
<circle class="sPv" cx="292.3" cy="99.0" r="2.6" opacity=".75"/>
<circle class="sPv" cx="296.3" cy="152.7" r="2.6" opacity=".75"/>
<circle class="sPv" cx="300.3" cy="99.0" r="2.6" opacity=".75"/>
<circle class="sPv" cx="304.4" cy="95.2" r="2.6" opacity=".75"/>
<circle class="sPv" cx="308.4" cy="102.8" r="2.6" opacity=".75"/>
<circle class="sPv" cx="312.5" cy="99.0" r="2.6" opacity=".75"/>
<circle class="sPv" cx="316.5" cy="145.0" r="2.6" opacity=".75"/>
<circle class="sPv" cx="320.5" cy="125.8" r="2.6" opacity=".75"/>
<circle class="sPv" cx="324.6" cy="141.2" r="2.6" opacity=".75"/>
<circle class="sPv" cx="328.6" cy="102.8" r="2.6" opacity=".75"/>
<circle class="sPv" cx="332.7" cy="91.3" r="2.6" opacity=".75"/>
<circle class="sPv" cx="336.7" cy="99.0" r="2.6" opacity=".75"/>
<circle class="sPv" cx="340.7" cy="83.7" r="2.6" opacity=".75"/>
<circle class="sPv" cx="344.8" cy="118.2" r="2.6" opacity=".75"/>
<circle class="sPv" cx="348.8" cy="91.3" r="2.6" opacity=".75"/>
<circle class="sPv" cx="352.9" cy="79.8" r="2.6" opacity=".75"/>
<circle class="sPv" cx="356.9" cy="79.8" r="2.6" opacity=".75"/>
<circle class="sPv" cx="360.9" cy="148.8" r="2.6" opacity=".75"/>
<circle class="sPv" cx="365.0" cy="68.3" r="2.6" opacity=".75"/>
<circle class="sPv" cx="369.0" cy="137.3" r="2.6" opacity=".75"/>
<circle class="sPv" cx="373.1" cy="118.2" r="2.6" opacity=".75"/>
<circle class="sPv" cx="377.1" cy="68.3" r="2.6" opacity=".75"/>
<circle class="sPv" cx="381.2" cy="53.0" r="2.6" opacity=".75"/>
<circle class="sPv" cx="385.2" cy="125.8" r="2.6" opacity=".75"/>
<circle class="sPv" cx="389.2" cy="99.0" r="2.6" opacity=".75"/>
<circle class="sPv" cx="393.3" cy="148.8" r="2.6" opacity=".75"/>
<circle class="sPv" cx="397.3" cy="118.2" r="2.6" opacity=".75"/>
<circle class="sPv" cx="401.4" cy="122.0" r="2.6" opacity=".75"/>
<circle class="sPv" cx="405.4" cy="95.2" r="2.6" opacity=".75"/>
<circle class="sPv" cx="409.4" cy="122.0" r="2.6" opacity=".75"/>
<circle class="sPv" cx="413.5" cy="87.5" r="2.6" opacity=".75"/>
<circle class="sPv" cx="417.5" cy="133.5" r="2.6" opacity=".75"/>
<circle class="sPv" cx="421.6" cy="76.0" r="2.6" opacity=".75"/>
<circle class="sPv" cx="425.6" cy="129.7" r="2.6" opacity=".75"/>
<circle class="sPv" cx="429.6" cy="87.5" r="2.6" opacity=".75"/>
<circle class="sPv" cx="433.7" cy="83.7" r="2.6" opacity=".75"/>
<circle class="sPv" cx="437.7" cy="114.3" r="2.6" opacity=".75"/>
<circle class="sPv" cx="441.8" cy="53.0" r="2.6" opacity=".75"/>
<circle class="sPv" cx="445.8" cy="110.5" r="2.6" opacity=".75"/>
<circle class="sPv" cx="449.8" cy="83.7" r="2.6" opacity=".75"/>
<circle class="sPv" cx="453.9" cy="45.3" r="2.6" opacity=".75"/>
<circle class="sPv" cx="457.9" cy="125.8" r="2.6" opacity=".75"/>
<circle class="sPv" cx="462.0" cy="99.0" r="2.6" opacity=".75"/>
<circle class="sPv" cx="466.0" cy="72.2" r="2.6" opacity=".75"/>
<circle class="sPr" cx="102.4" cy="187.2" r="5"/>
<line class="sLr" x1="102.364" y1="181.167" x2="102.364" y2="136.104" marker-end="url(#ahr)"/>
<text class="sRt" x="112.364" y="191.167">picked: 5.8% on the test set, 9.3% in reality</text>
<text class="sS" x="76" y="40">grey line: true error</text><text class="sS" x="76" y="56">dots: measured on 400 test rows</text>
<rect class="sN" x="492" y="34" width="214" height="170" rx="8"/>
<text class="sT" x="599" y="58" text-anchor="middle">repeat 3,000 times</text>
<text class="sRt" x="599" y="86" text-anchor="middle">reported (min of 100): 6.4%</text>
<text class="sT" x="599" y="108" text-anchor="middle">actual error of that pick: 9.6%</text>
<text class="sS" x="599" y="136" text-anchor="middle">the minimum of 100 noisy scores</text><text class="sS" x="599" y="152" text-anchor="middle">is mostly luck, not skill</text>
<text class="sGt" x="599" y="180" text-anchor="middle">choose on validation, then test</text><text class="sGt" x="599" y="196" text-anchor="middle">once: no selection, no bias</text>
</svg><figcaption>Géron's cautionary tale, simulated: pick the best of 100 test scores and you mostly pick the luckiest one. The test score is then an optimistic estimate.</figcaption></figure>

### Holdout validation, then retrain

1. Split the training data into a **reduced training set** and a **validation (dev) set**.
2. Train candidate models and hyperparameters on the reduced training set; pick the best on validation.
3. **Retrain the winner on the full training set** (train + validation).
4. Evaluate **once** on the test set.

Trade-off: a small validation set gives imprecise comparisons. A large one leaves the candidates trained on much less data than the final model; Géron compares that to *"selecting the fastest sprinter to participate in a marathon."* **Repeated cross-validation** fixes both problems at the cost of k× training time. It is §6.5, and it is also what `GridSearchCV(refit=True)` does automatically.

### Data mismatch and the train-dev set (Andrew Ng)

Sometimes your abundant training data does not look like production data. Géron's example is flower photos from the web versus photos taken in your mobile app.

**The rule:** validation and test sets must be **as representative of production as possible**, so build them *only* from real production-like data.

Then, to know *why* the dev score is bad, hold out part of the (web) training data as a **train-dev set**:

| Train-dev score | Dev score | Diagnosis | Action |
|---|---|---|---|
| Bad | — | **Overfitting** the training set | Regularise, simplify, more/cleaner data |
| Good | Bad | **Data mismatch** | Make training data look like production (preprocess, augment, collect real data) |
| Good | Good | Ready | Evaluate once on test |

<figure class="dia"><svg viewBox="0 0 720 272" role="img" aria-label="Web data is split into train and train-dev sets, app data into dev and test sets. In the first example train error is 2 percent and train-dev 9 percent, a jump that means overfitting; in the second, train-dev is 3 percent but dev is 11 percent, a jump that means data mismatch">
<text class="sS" x="175" y="22" text-anchor="middle">web photos: plentiful, not like production</text><text class="sS" x="530" y="22" text-anchor="middle">app photos: scarce, production-like</text>
<rect class="sB" x="20" y="30" width="228" height="32" rx="6"/><text class="sT" x="134" y="51" text-anchor="middle">train</text><rect class="sB" x="252" y="30" width="78" height="32" rx="6" opacity=".55"/><text class="sT" x="291" y="51" text-anchor="middle">train-dev</text>
<rect class="sG" x="380" y="30" width="148" height="32" rx="6"/><text class="sT" x="454" y="51" text-anchor="middle">dev (validation)</text><rect class="sV" x="532" y="30" width="148" height="32" rx="6"/><text class="sT" x="606" y="51" text-anchor="middle">test</text>
<line class="sLm" x1="20" y1="74" x2="700" y2="74" opacity=".3"/><line class="sLm" x1="360" y1="84" x2="360" y2="244" opacity=".3"/>
<text class="sT" x="160" y="92" text-anchor="middle">case 1: overfitting</text><rect class="sB" x="60" y="208" width="50" height="18" rx="3"/><text class="sS" x="85" y="202" text-anchor="middle">2%</text><text class="sS" x="85" y="242" text-anchor="middle">train</text><rect class="sB" x="150" y="145" width="50" height="81" rx="3" opacity=".55"/><text class="sS" x="175" y="139" text-anchor="middle">9%</text><text class="sS" x="175" y="242" text-anchor="middle">train-dev</text><rect class="sG" x="240" y="136" width="50" height="90" rx="3"/><text class="sS" x="265" y="130" text-anchor="middle">10%</text><text class="sS" x="265" y="242" text-anchor="middle">dev</text><line class="sLr" x1="110" y1="208" x2="130" y2="208" stroke-dasharray="3 3"/><line class="sLr" x1="130" y1="208" x2="130" y2="147" marker-end="url(#ahr)"/><text class="sRt" x="160" y="112" text-anchor="middle">big jump from train to train-dev</text>
<text class="sT" x="520" y="92" text-anchor="middle">case 2: data mismatch</text><rect class="sB" x="420" y="208" width="50" height="18" rx="3"/><text class="sS" x="445" y="202" text-anchor="middle">2%</text><text class="sS" x="445" y="242" text-anchor="middle">train</text><rect class="sB" x="510" y="199" width="50" height="27" rx="3" opacity=".55"/><text class="sS" x="535" y="193" text-anchor="middle">3%</text><text class="sS" x="535" y="242" text-anchor="middle">train-dev</text><rect class="sG" x="600" y="127" width="50" height="99" rx="3"/><text class="sS" x="625" y="121" text-anchor="middle">11%</text><text class="sS" x="625" y="242" text-anchor="middle">dev</text><line class="sLw" x1="560" y1="199" x2="580" y2="199" stroke-dasharray="3 3"/><line class="sLw" x1="580" y1="199" x2="580" y2="129" marker-end="url(#ahw)"/><text class="sWt" x="520" y="112" text-anchor="middle">big jump from train-dev to dev</text>
<text class="sS" x="160" y="262" text-anchor="middle">fix: regularise, simplify, more data</text><text class="sS" x="520" y="262" text-anchor="middle">fix: make training data look like the app</text>
</svg><figcaption>Reading the train-dev set (example error rates): where the big jump happens tells you which problem you have.</figcaption></figure>

**Telecom version:** you train a fraud model on a public dataset or another country's data. You validate on Egyptian traffic. A train-dev set tells you whether a poor Egyptian score is overfitting or a population difference.

### The No Free Lunch theorem

Wolpert (1996): **with no assumptions about the data, no model is a priori better than any other.** A linear model assumes linearity; a tree assumes axis-aligned structure. The only way to know which is best is to evaluate them, and since you cannot evaluate all of them, you make reasonable assumptions and test a sensible shortlist. This is the formal reason behind "always compare against a baseline and a couple of model families".

---

## 6.11 Framing a project like a professional (Géron, Ch. 2) 🟡 ⭐

> [!info] 📖 Géron Ch. 2 · “Look at the Big Picture” pp. 43–48; “Launch, Monitor, and Maintain” pp. 100–103

> [!quote] 💬 Say it in the interview
> “I frame a project by the decision it supports: objective, target definition, metric tied to value, baseline, constraints. Then I plan deployment and monitoring from day one.”

Géron's eight-step project outline. Memorise it; it is the answer to "walk me through how you would approach an ML problem":

```
1. Look at the big picture          5. Select a model and train it
2. Get the data                      6. Fine-tune your model
3. Explore and visualise the data    7. Present your solution
4. Prepare the data                  8. Launch, monitor, and maintain
```

### Step 1 in detail: the questions to ask before writing code

1. **What is the business objective?** The model is rarely the end goal. How will its output be used? This decides the framing, the algorithm, the metric, and how much tuning effort is justified.
2. **What does the current solution look like?** It gives you a performance reference (Géron's experts were off by more than 30%) and domain insight.
3. **What kind of problem is it?** Supervised or not; classification or regression; batch or online. Géron's housing case is a **multiple regression** (several features) and a **univariate regression** (one output per district). Predicting several outputs per row would be *multivariate* regression.
4. **Which performance measure?** (below)
5. **What assumptions are you making?** Verify them. Géron's example: if the downstream system only uses price *categories* (cheap/medium/expensive), the problem should be **classification**, and months of regression work would be wasted. *"You don't want to find this out after working on a regression system for months."*

Also from the chapter: ML systems are usually **pipelines of components** that talk through data stores. This is robust, since downstream components keep working on the last output, but a broken upstream component can go **unnoticed** without monitoring.

### Choosing the regression metric: RMSE vs MAE, and why norms matter

- **RMSE** corresponds to the **ℓ₂ (Euclidean) norm** of the error vector.
- **MAE** corresponds to the **ℓ₁ (Manhattan) norm**.
- In general, ‖v‖ₖ = (Σ|vᵢ|ᵏ)^(1/k). ℓ₀ counts non-zeros; ℓ∞ is the max absolute value.
- **The higher the norm index, the more it focuses on large values.** So RMSE is more outlier-sensitive than MAE. When outliers are exponentially rare (bell-shaped errors), RMSE works well and is preferred. When there are many outliers, prefer MAE.

<figure class="dia"><svg viewBox="0 0 720 226" role="img" aria-label="Left: the unit balls of the l1, l2 and l-infinity norms, a diamond, a circle and a square. Right: with ten moderate errors and then one outlier of 40, mean absolute error grows least, RMSE grows more, and the maximum error grows most">
<line class="sLm" x1="25" y1="120" x2="215" y2="120"/><line class="sLm" x1="120" y1="215" x2="120" y2="25"/>
<polygon class="sLw" style="fill:none;stroke-width:2.2" points="120,50 190,120 120,190 50,120"/>
<circle class="sLg" style="fill:none;stroke-width:2.2" cx="120" cy="120" r="70"/>
<rect class="sLv" style="fill:none;stroke-width:2.2" x="50" y="50" width="140" height="140"/>
<text class="sWt" x="174" y="66" text-anchor="middle">ℓ₁</text><text class="sGt" x="166" y="186" text-anchor="middle">ℓ₂</text><text class="sC" x="200" y="54">ℓ∞</text>
<text class="sS" x="120" y="214" text-anchor="middle">all points at distance 1 from the centre</text>
<text class="sM" x="500" y="22" text-anchor="middle">ten errors, then one of them becomes 40</text>
<text class="sC" x="380" y="62" text-anchor="end">MAE (ℓ₁)</text>
<rect class="sW" x="390" y="44" width="13.2" height="16" rx="3" opacity=".5"/><text class="sS" x="409.2" y="57">2.4</text>
<rect class="sW" x="390" y="64" width="34.1" height="16" rx="3"/><text class="sS" x="430.1" y="77">6.2  (×2.6)</text>
<text class="sC" x="380" y="114" text-anchor="end">RMSE (ℓ₂)</text>
<rect class="sG" x="390" y="96" width="14.3422" height="16" rx="3" opacity=".5"/><text class="sS" x="410.342" y="109">2.6</text>
<rect class="sG" x="390" y="116" width="70.9479" height="16" rx="3"/><text class="sS" x="466.948" y="129">12.9  (×4.9)</text>
<text class="sC" x="380" y="166" text-anchor="end">max error (ℓ∞)</text>
<rect class="sV" x="390" y="148" width="22" height="16" rx="3" opacity=".5"/><text class="sS" x="418" y="161">4.0</text>
<rect class="sV" x="390" y="168" width="220" height="16" rx="3"/><text class="sS" x="616" y="181">40.0  (×10.0)</text>
<text class="sS" x="500" y="214" text-anchor="middle">faded: clean errors · solid: with one outlier</text>
</svg><figcaption>Higher norm index, more weight on the largest error: why RMSE punishes outliers harder than MAE. Computed.</figcaption></figure>

### Get the data: notation Géron uses throughout

| Symbol | Meaning |
|---|---|
| m | number of instances |
| **x**⁽ⁱ⁾ | feature vector of instance i (column vector) |
| y⁽ⁱ⁾ | label of instance i |
| **X** | matrix of all features, one row per instance, row i = (**x**⁽ⁱ⁾)ᵀ |
| h | the prediction function, or *hypothesis*; ŷ⁽ⁱ⁾ = h(**x**⁽ⁱ⁾) |
| θ | model parameters |

Check the data's **provenance**: Géron's `median_income` was scaled and capped (0.5–15), and the *target* was capped at \$500k. A capped target means the model will learn that prices never exceed the cap. Either collect proper labels for the capped rows, or remove them from **both** train and test.

### Evaluate on the test set — with a confidence interval

A point estimate isn't enough when the new model is only slightly better than the one in production. Géron bootstraps a 95% confidence interval for the test RMSE:

```python
from scipy import stats
import numpy as np

def rmse(squared_errors):
    return np.sqrt(np.mean(squared_errors))

squared_errors = (final_predictions - y_test) ** 2
boot = stats.bootstrap([squared_errors], rmse,
                       confidence_level=0.95, random_state=42)
rmse_lower, rmse_upper = boot.confidence_interval   # ≈ 39,521 – 43,702
```

Two rules from the chapter:
- After heavy tuning, the test score is usually **slightly worse** than the CV score. **Do not tweak hyperparameters to improve the test number.** Those gains won't generalise.
- **Check fairness.** Slice the validation set by segment (rural/urban, rich/poor, region, and in telecom also pre-paid/post-paid, governorate, handset tier) and compare performance per slice. If a segment is badly served, either fix it or don't use the model for that segment.

### Present, launch, monitor, maintain

**Presenting** (Géron: this *"sets great data scientists apart from good ones"*): concise reports, key visuals, a message tailored to the audience, memorable statements (*"the median income is the number one predictor of housing prices"*), and honest notes on what worked, what didn't, the assumptions and the limitations.

**Reproducibility:** code in Git, a README, `requirements.txt` / `environment.yml` or a Docker image with pinned versions, fixed seeds.

**Deployment patterns:**
1. Load the `joblib` model inside the web app (load once at start-up, not per request). Custom classes and functions (`ClusterSimilarity`, `column_ratio`) must be importable in production, because pickle stores references, not code.
2. **Wrap the model in its own REST web service.** This lets you upgrade the model independently, scale with load balancing, and call it from any language (e.g. from ASP.NET).
3. A **managed cloud service** (Vertex AI, SageMaker, Azure ML) handles scaling for you.

**Monitoring:**
- Performance can fall **suddenly** (a broken component) or **slowly** (data drift). Slow decay is the dangerous one.
- Measure live performance through **downstream metrics** (e.g. recommended products sold) or through **human raters** on a sample, especially low-confidence predictions.
- **Monitor the inputs.** Alert when the missing-value rate rises, when a feature's mean/std drifts from training, or when a categorical feature shows new categories. Input monitoring catches problems before the performance metric does.

**Maintenance, automated:** collect and label fresh data; a scheduled script retrains and tunes; another script compares new vs old model on the updated test set **and on important slices**, and only promotes the new model if it is not worse. **Keep backups of every model and every dataset version** so you can roll back quickly and compare any model against any dataset.

Géron's summary: *"much of the work is in the data preparation step, building monitoring tools, setting up human evaluation pipelines, and automating regular model training"*. He also advises that it is better to know the whole process and three or four algorithms well than to chase exotic ones.

---

## 6.12 Fine-tuning at depth (Géron, Ch. 2) 🟡

> [!info] 📖 Géron Ch. 2 · “Fine-Tune Your Model” → “Evaluate on the Test Set” · pp. 94–100

### Reading Géron's model comparison

On California housing, he gets:

| Model | Training RMSE | 10-fold CV RMSE |
|---|---:|---:|
| Linear Regression | 68,973 | 70,003 ± 4,182 |
| Decision Tree | **0** | 66,573 ± 1,103 |
| Random Forest | 17,551 | 47,038 ± 1,021 |
| Random Forest, tuned | — | 43,590 |
| **Final model on test** | — | **41,445** (95% CI 39,521–43,702) |

Read it with the §6.4 table:
- Linear regression: train ≈ CV, both poor → **underfitting**.
- Decision tree: train 0, CV terrible → **severe overfitting**.
- Random Forest: much better, but train ≪ CV → still overfitting. Regularise or get more data.

<figure class="dia"><svg viewBox="0 0 720 238" role="img" aria-label="Training versus cross-validation RMSE from Géron's housing example: linear regression about 69,000 and 70,000, a decision tree 0 and 66,573, a random forest 17,551 and 47,038, a tuned forest 43,590 in cross-validation and 41,445 on the test set">
<rect class="sW" x="160" y="14" width="12" height="10" rx="2"/><text class="sC" x="178" y="23">training RMSE</text><rect class="sB" x="290" y="14" width="12" height="10" rx="2"/><text class="sC" x="308" y="23">cross-validation RMSE</text>
<text class="sC" x="150" y="56" text-anchor="end">Linear Regression</text>
<rect class="sW" x="160" y="38" width="303.481" height="13" rx="2"/><text class="sS" x="469.481" y="49">68,973</text>
<rect class="sB" x="160" y="53" width="308.013" height="13" rx="2"/><text class="sS" x="474.013" y="64">70,003</text>
<text class="sRt" x="706" y="58" text-anchor="end">underfits: both high</text>
<text class="sC" x="150" y="92" text-anchor="end">Decision Tree</text>
<rect class="sW" x="160" y="74" width="1.5" height="13" rx="2"/><text class="sS" x="166" y="85">0</text>
<rect class="sB" x="160" y="89" width="292.921" height="13" rx="2"/><text class="sS" x="458.921" y="100">66,573</text>
<text class="sRt" x="706" y="94" text-anchor="end">overfits: train 0, CV bad</text>
<text class="sC" x="150" y="128" text-anchor="end">Random Forest</text>
<rect class="sW" x="160" y="110" width="77.2244" height="13" rx="2"/><text class="sS" x="243.224" y="121">17,551</text>
<rect class="sB" x="160" y="125" width="206.967" height="13" rx="2"/><text class="sS" x="372.967" y="136">47,038</text>
<text class="sRt" x="706" y="130" text-anchor="end">better, still a gap</text>
<text class="sC" x="150" y="164" text-anchor="end">RF tuned</text>
<rect class="sB" x="160" y="161" width="191.796" height="13" rx="2"/><text class="sS" x="357.796" y="172">43,590</text>
<text class="sGt" x="706" y="166" text-anchor="end">CV after grid search</text>
<text class="sC" x="150" y="200" text-anchor="end">final, on test</text>
<rect class="sG" x="160" y="197" width="182.358" height="13" rx="2"/><text class="sS" x="348.358" y="208">41,445</text>
<text class="sGt" x="706" y="202" text-anchor="end">reported once</text>
<text class="sS" x="360" y="226" text-anchor="middle">read the gap: train ≈ CV and both high → underfit; train ≪ CV → overfit (California housing, RMSE in dollars)</text>
</svg><figcaption>The model comparison as bars: the distance between the two bars of each model is the diagnosis. Numbers from the table above.</figcaption></figure>

Géron's advice: before tuning anything, **shortlist 2–5 promising models from different families** without spending long on each.

### Grid search over the *whole* pipeline

```python
full_pipeline = Pipeline([
    ("preprocessing", preprocessing),
    ("random_forest", RandomForestRegressor(random_state=42)),
])
param_grid = [
    {"preprocessing__geo__n_clusters": [5, 8, 10],
     "random_forest__max_features": [4, 6, 8]},
    {"preprocessing__geo__n_clusters": [10, 15],
     "random_forest__max_features": [6, 8, 10]},
]
grid_search = GridSearchCV(full_pipeline, param_grid, cv=3,
                           scoring="neg_root_mean_squared_error")
grid_search.fit(housing, housing_labels)
```

- The `param_grid` can be a **list of dicts**: 3×3 + 2×3 = 15 combinations × 3 folds = 45 fits.
- `preprocessing__geo__n_clusters` reaches **inside** the ColumnTransformer. Tune preprocessing and model together, because they interact.
- **If the best value is at the edge of the grid** (15 was the maximum tried), extend the grid in that direction.
- `refit=True` (the default) retrains the best configuration on the full training set. `grid_search.cv_results_` in a DataFrame shows every fold's score.

### Randomized search, halving search

`RandomizedSearchCV(n_iter=…)` samples from **distributions** (`scipy.stats.randint`, `loguniform`). Géron gives three reasons to prefer it:
1. With continuous hyperparameters it tries many distinct values instead of a few.
2. **An unimportant hyperparameter costs nothing extra.** In a grid, a useless 10-value hyperparameter makes the search 10× longer.
3. You control the budget directly (`n_iter`).

<figure class="dia"><svg viewBox="0 0 720 272" role="img" aria-label="Nine trials over two hyperparameters where only one matters: a 3 by 3 grid tests just three values of the important one and misses the narrow peak, while nine random trials test nine distinct values and land closer to it">
<rect class="sN" x="30" y="30" width="150" height="150" rx="0" style="fill:none"/><text class="sT" x="105" y="22" text-anchor="middle">grid: 9 trials, 3 distinct values</text>
<text class="sS" x="22" y="105" text-anchor="end" transform="rotate(-90 22 105.0)">unimportant</text>
<polyline class="sLv" points="30.0,240.0 31.5,240.0 33.0,240.0 34.5,240.0 36.0,240.0 37.5,240.0 39.0,240.0 40.5,240.0 42.0,240.0 43.5,240.0 45.0,240.0 46.5,240.0 48.0,240.0 49.5,240.0 51.0,240.0 52.5,240.0 54.0,240.0 55.5,240.0 57.0,240.0 58.5,240.0 60.0,240.0 61.5,240.0 63.0,240.0 64.5,240.0 66.0,240.0 67.5,240.0 69.0,240.0 70.5,240.0 72.0,240.0 73.5,240.0 75.0,240.0 76.5,240.0 78.0,240.0 79.5,240.0 81.0,240.0 82.5,240.0 84.0,240.0 85.5,240.0 87.0,240.0 88.5,240.0 90.0,240.0 91.5,240.0 93.0,240.0 94.5,240.0 96.0,240.0 97.5,240.0 99.0,240.0 100.5,240.0 102.0,240.0 103.5,240.0 105.0,240.0 106.5,240.0 108.0,239.9 109.5,239.9 111.0,239.8 112.5,239.7 114.0,239.5 115.5,239.1 117.0,238.5 118.5,237.7 120.0,236.4 121.5,234.7 123.0,232.5 124.5,229.5 126.0,225.9 127.5,221.6 129.0,216.7 130.5,211.5 132.0,206.2 133.5,201.1 135.0,196.6 136.5,193.0 138.0,190.8 139.5,190.0 141.0,190.8 142.5,193.0 144.0,196.6 145.5,201.1 147.0,206.2 148.5,211.5 150.0,216.7 151.5,221.6 153.0,225.9 154.5,229.5 156.0,232.5 157.5,234.7 159.0,236.4 160.5,237.7 162.0,238.5 163.5,239.1 165.0,239.5 166.5,239.7 168.0,239.8 169.5,239.9 171.0,239.9 172.5,240.0 174.0,240.0 175.5,240.0 177.0,240.0 178.5,240.0 180.0,240.0"/><text class="sS" x="186" y="220">score</text>
<circle class="sPw" cx="52.5" cy="157.5" r="4.5"/>
<line class="sD" x1="52.5" y1="180" x2="52.5" y2="240"/>
<circle class="sPw" cx="52.5" cy="105.0" r="4.5"/>
<line class="sD" x1="52.5" y1="180" x2="52.5" y2="240"/>
<circle class="sPw" cx="52.5" cy="52.5" r="4.5"/>
<line class="sD" x1="52.5" y1="180" x2="52.5" y2="240"/>
<circle class="sPw" cx="105.0" cy="157.5" r="4.5"/>
<line class="sD" x1="105" y1="180" x2="105" y2="239.987"/>
<circle class="sPw" cx="105.0" cy="105.0" r="4.5"/>
<line class="sD" x1="105" y1="180" x2="105" y2="239.987"/>
<circle class="sPw" cx="105.0" cy="52.5" r="4.5"/>
<line class="sD" x1="105" y1="180" x2="105" y2="239.987"/>
<circle class="sPw" cx="157.5" cy="157.5" r="4.5"/>
<line class="sD" x1="157.5" y1="180" x2="157.5" y2="234.73"/>
<circle class="sPw" cx="157.5" cy="105.0" r="4.5"/>
<line class="sD" x1="157.5" y1="180" x2="157.5" y2="234.73"/>
<circle class="sPw" cx="157.5" cy="52.5" r="4.5"/>
<line class="sD" x1="157.5" y1="180" x2="157.5" y2="234.73"/>
<text class="sS" x="190" y="60">best score found</text><text class="sRt" x="190" y="78">0.11</text>
<text class="sS" x="105" y="254" text-anchor="middle">important hyperparameter →</text>
<rect class="sN" x="380" y="30" width="150" height="150" rx="0" style="fill:none"/><text class="sT" x="455" y="22" text-anchor="middle">random: 9 trials, 9 distinct values</text>
<text class="sS" x="372" y="105" text-anchor="end" transform="rotate(-90 372 105.0)">unimportant</text>
<polyline class="sLv" points="380.0,240.0 381.5,240.0 383.0,240.0 384.5,240.0 386.0,240.0 387.5,240.0 389.0,240.0 390.5,240.0 392.0,240.0 393.5,240.0 395.0,240.0 396.5,240.0 398.0,240.0 399.5,240.0 401.0,240.0 402.5,240.0 404.0,240.0 405.5,240.0 407.0,240.0 408.5,240.0 410.0,240.0 411.5,240.0 413.0,240.0 414.5,240.0 416.0,240.0 417.5,240.0 419.0,240.0 420.5,240.0 422.0,240.0 423.5,240.0 425.0,240.0 426.5,240.0 428.0,240.0 429.5,240.0 431.0,240.0 432.5,240.0 434.0,240.0 435.5,240.0 437.0,240.0 438.5,240.0 440.0,240.0 441.5,240.0 443.0,240.0 444.5,240.0 446.0,240.0 447.5,240.0 449.0,240.0 450.5,240.0 452.0,240.0 453.5,240.0 455.0,240.0 456.5,240.0 458.0,239.9 459.5,239.9 461.0,239.8 462.5,239.7 464.0,239.5 465.5,239.1 467.0,238.5 468.5,237.7 470.0,236.4 471.5,234.7 473.0,232.5 474.5,229.5 476.0,225.9 477.5,221.6 479.0,216.7 480.5,211.5 482.0,206.2 483.5,201.1 485.0,196.6 486.5,193.0 488.0,190.8 489.5,190.0 491.0,190.8 492.5,193.0 494.0,196.6 495.5,201.1 497.0,206.2 498.5,211.5 500.0,216.7 501.5,221.6 503.0,225.9 504.5,229.5 506.0,232.5 507.5,234.7 509.0,236.4 510.5,237.7 512.0,238.5 513.5,239.1 515.0,239.5 516.5,239.7 518.0,239.8 519.5,239.9 521.0,239.9 522.5,240.0 524.0,240.0 525.5,240.0 527.0,240.0 528.5,240.0 530.0,240.0"/><text class="sS" x="536" y="220">score</text>
<circle class="sPg" cx="462.2" cy="128.1" r="4.5"/>
<line class="sD" x1="462.218" y1="180" x2="462.218" y2="239.715"/>
<circle class="sPg" cx="506.7" cy="136.7" r="4.5"/>
<line class="sD" x1="506.728" y1="180" x2="506.728" y2="233.634"/>
<circle class="sPg" cx="456.6" cy="128.4" r="4.5"/>
<line class="sD" x1="456.552" y1="180" x2="456.552" y2="239.973"/>
<circle class="sPg" cx="442.3" cy="33.9" r="4.5"/>
<line class="sD" x1="442.324" y1="180" x2="442.324" y2="240"/>
<circle class="sPg" cx="395.6" cy="113.3" r="4.5"/>
<line class="sD" x1="395.56" y1="180" x2="395.56" y2="240"/>
<circle class="sPg" cx="413.7" cy="127.6" r="4.5"/>
<line class="sD" x1="413.721" y1="180" x2="413.721" y2="240"/>
<circle class="sPg" cx="529.8" cy="130.6" r="4.5"/>
<line class="sD" x1="529.811" y1="180" x2="529.811" y2="239.999"/>
<circle class="sPg" cx="471.2" cy="117.1" r="4.5"/>
<line class="sD" x1="471.167" y1="180" x2="471.167" y2="235.155"/>
<circle class="sPg" cx="489.6" cy="112.9" r="4.5"/>
<line class="sD" x1="489.568" y1="180" x2="489.568" y2="190.002"/>
<text class="sS" x="540" y="60">best score found</text><text class="sGt" x="540" y="78">1.00</text>
<text class="sS" x="455" y="254" text-anchor="middle">important hyperparameter →</text>
</svg><figcaption>Why randomized search wins when some hyperparameters barely matter (Bergstra and Bengio, 2012). The score curve depends only on the horizontal axis. Computed.</figcaption></figure>

`HalvingGridSearchCV` / `HalvingRandomSearchCV` (successive halving) start many candidates with **limited resources** (a small sample, or few iterations), keep the best, and give them more resources each round. Optuna (Part 11) goes further with Bayesian optimisation and pruning.

<figure class="dia"><svg viewBox="0 0 720 232" role="img" aria-label="Successive halving: 27 candidates get one unit of resources, the best 9 get three, the best 3 get nine, and the winner gets 27, for 108 units instead of 729">
<text class="sC" x="14" y="54">round 1: 27 candidates</text>
<rect class="sB" x="170" y="34" width="13" height="28" rx="3" opacity="0.37"/>
<rect class="sB" x="185" y="34" width="13" height="28" rx="3" opacity="0.37"/>
<rect class="sB" x="200" y="34" width="13" height="28" rx="3" opacity="0.37"/>
<rect class="sB" x="215" y="34" width="13" height="28" rx="3" opacity="0.37"/>
<rect class="sB" x="230" y="34" width="13" height="28" rx="3" opacity="0.37"/>
<rect class="sB" x="245" y="34" width="13" height="28" rx="3" opacity="0.37"/>
<rect class="sB" x="260" y="34" width="13" height="28" rx="3" opacity="0.37"/>
<rect class="sB" x="275" y="34" width="13" height="28" rx="3" opacity="0.37"/>
<rect class="sB" x="290" y="34" width="13" height="28" rx="3" opacity="0.37"/>
<rect class="sB" x="305" y="34" width="13" height="28" rx="3" opacity="0.37"/>
<rect class="sB" x="320" y="34" width="13" height="28" rx="3" opacity="0.37"/>
<rect class="sB" x="335" y="34" width="13" height="28" rx="3" opacity="0.37"/>
<rect class="sB" x="350" y="34" width="13" height="28" rx="3" opacity="0.37"/>
<rect class="sB" x="365" y="34" width="13" height="28" rx="3" opacity="0.37"/>
<rect class="sB" x="380" y="34" width="13" height="28" rx="3" opacity="0.37"/>
<rect class="sB" x="395" y="34" width="13" height="28" rx="3" opacity="0.37"/>
<rect class="sB" x="410" y="34" width="13" height="28" rx="3" opacity="0.37"/>
<rect class="sB" x="425" y="34" width="13" height="28" rx="3" opacity="0.37"/>
<rect class="sB" x="440" y="34" width="13" height="28" rx="3" opacity="0.37"/>
<rect class="sB" x="455" y="34" width="13" height="28" rx="3" opacity="0.37"/>
<rect class="sB" x="470" y="34" width="13" height="28" rx="3" opacity="0.37"/>
<rect class="sB" x="485" y="34" width="13" height="28" rx="3" opacity="0.37"/>
<rect class="sB" x="500" y="34" width="13" height="28" rx="3" opacity="0.37"/>
<rect class="sB" x="515" y="34" width="13" height="28" rx="3" opacity="0.37"/>
<rect class="sB" x="530" y="34" width="13" height="28" rx="3" opacity="0.37"/>
<rect class="sB" x="545" y="34" width="13" height="28" rx="3" opacity="0.37"/>
<rect class="sB" x="560" y="34" width="13" height="28" rx="3" opacity="0.37"/>
<text class="sS" x="706" y="54" text-anchor="end">1× resources each</text>
<text class="sC" x="14" y="98">round 2: 9 candidates</text>
<rect class="sB" x="170" y="78" width="13" height="28" rx="3" opacity="0.42"/>
<rect class="sB" x="185" y="78" width="13" height="28" rx="3" opacity="0.42"/>
<rect class="sB" x="200" y="78" width="13" height="28" rx="3" opacity="0.42"/>
<rect class="sB" x="215" y="78" width="13" height="28" rx="3" opacity="0.42"/>
<rect class="sB" x="230" y="78" width="13" height="28" rx="3" opacity="0.42"/>
<rect class="sB" x="245" y="78" width="13" height="28" rx="3" opacity="0.42"/>
<rect class="sB" x="260" y="78" width="13" height="28" rx="3" opacity="0.42"/>
<rect class="sB" x="275" y="78" width="13" height="28" rx="3" opacity="0.42"/>
<rect class="sB" x="290" y="78" width="13" height="28" rx="3" opacity="0.42"/>
<text class="sS" x="706" y="98" text-anchor="end">3× resources each</text>
<text class="sC" x="14" y="142">round 3: 3 candidates</text>
<rect class="sB" x="170" y="122" width="13" height="28" rx="3" opacity="0.57"/>
<rect class="sB" x="185" y="122" width="13" height="28" rx="3" opacity="0.57"/>
<rect class="sB" x="200" y="122" width="13" height="28" rx="3" opacity="0.57"/>
<text class="sS" x="706" y="142" text-anchor="end">9× resources each</text>
<text class="sC" x="14" y="186">round 4: 1 candidate</text>
<rect class="sG" x="170" y="166" width="13" height="28" rx="3"/>
<text class="sS" x="706" y="186" text-anchor="end">27× resources each</text>
<text class="sS" x="360" y="220" text-anchor="middle">total budget 108 units vs 729 to train all 27 at full size; the risk is dropping a slow starter early</text>
</svg><figcaption>HalvingGridSearchCV with factor 3: cheap rounds weed out bad candidates; only survivors earn more data or iterations. Computed.</figcaption></figure>

### Ensembles and error analysis

- **Combine** your best models. Averaging models that make *different* errors reduces error; this is the whole idea of Part 8B.
- **Inspect the best model:** `feature_importances_`, then drop useless features (`SelectFromModel`).
- **Look at the specific errors** and ask why each happens. That points to new features, cleaning, or data collection.

---

> [!check] ✅ Key takeaways
> - Learning = hypothesis space + loss + optimiser; the goal is **generalisation**, not training score.
> - Gradient descent follows the negative gradient; the learning rate decides slow / converge / diverge.
> - Underfitting = high bias (both errors high); overfitting = high variance (big train–validation gap).
> - Use k-fold CV for model selection (stratified, grouped or time-based as the data demands) and touch the test set once.
> - Pick metrics from business costs and always compare against a dummy baseline.
> - Frame the problem first (objective, target, metric, baseline, constraints) and plan monitoring from day one.

## 6.13 Interview drill — ML fundamentals (Géron Ch. 1 exercises, answered) 🟢 ⭐

> [!info] 📖 Géron Ch. 1 · Exercises · p. 39

**1. Define machine learning.** Building systems that improve at a task by learning from data instead of hand-coded rules. Mitchell: performance P on task T improves with experience E.

**2. Four types of problem where ML shines.** Rule-heavy problems; complex problems with no algorithmic solution; changing environments that need adaptation; mining insight from large data.

**3. What is a labelled training set?** Examples paired with the desired output (label or target).

**4. The two most common supervised tasks?** Classification and regression.

**5. Four common unsupervised tasks?** Clustering, dimensionality reduction/visualisation, anomaly (and novelty) detection, association rule learning.

**6. A robot walking on unknown terrain?** Reinforcement learning.

**7. Segmenting customers?** Clustering if you don't know the groups; classification if you have labelled groups.

**8. Spam: supervised or unsupervised?** Supervised. Users provide spam/ham labels.

**9. Online learning?** Learning incrementally from a stream of instances or mini-batches, adapting to change quickly and cheaply.

**10. Out-of-core learning?** Training on data too large for memory by feeding chunks to an online algorithm.

**11. Which algorithms rely on a similarity measure?** Instance-based ones (KNN).

**12. Parameter vs hyperparameter?** A parameter is learned by the training algorithm (e.g. a weight). A hyperparameter belongs to the learning algorithm and is set before training (e.g. regularisation strength).

**13. What do model-based algorithms search for, and how do they predict?** Parameter values that minimise a cost function on the training set, usually by gradient-based or closed-form optimisation. They predict by feeding new features into the model function with the learned parameters.

**14. Four main challenges?** Too little data, non-representative data, poor-quality data, irrelevant features. On the model side: overfitting and underfitting. Plus deployment constraints.

**15. Great on training, poor on new data: what is happening, and three fixes?** Overfitting. More data; a simpler or more regularised model; fewer or better features; less noise.

**16. What is a test set for?** Estimating the generalisation error on data never used for training or selection.

**17. What is a validation set for?** Comparing models and tuning hyperparameters without touching the test set.

**18. Train-dev set?** A held-out slice of the *training distribution*. It separates overfitting from data mismatch when training data differs from production data.

**19. What goes wrong if you tune on the test set?** You overfit the test set. The reported error becomes optimistic and production performance disappoints.

**Extra questions that often follow:**

- *"How would you explain overfitting to a non-technical manager?"* The model memorised the exam answers instead of learning the subject. It aces the practice test and fails the real one.
- *"How do you know your model will still work in six months?"* It won't unless you monitor it. Track input drift (e.g. PSI/KS tests on key features), track live metrics against labels as they arrive, retrain on a schedule or on a drift trigger, and keep rollback ready.
- *"Why might a random train/test split be wrong?"* Time-ordered data (use a temporal split), grouped data (use GroupKFold on customer or account), or a production population that differs from the training population (data mismatch).
- *"What is the difference between a data scientist's and an MLOps engineer's job, according to Géron?"* Modelling (data, features, algorithms, evaluation) versus operating the model (deployment, scaling, monitoring, retraining, rollback). They need different skills, but a strong candidate understands both.

---

## 6.14 Real-world examples — foundations in the wild 🟡

| Case | Foundation it illustrates | Lesson to say in an interview |
|---|---|---|
| **Zillow Offers (2021)** — the home-buying arm shut down after a ~\$500M+ write-down when its price model kept overpaying as the market shifted | Distribution shift, overconfident point predictions | Monitor drift; use prediction intervals; a model is a decision system, not just an estimator |
| **Google Flu Trends (2008–2015)** — overestimated flu for several seasons | Spurious correlations, non-stationarity | Validate against ground truth continuously; correlation found in search data can drift |
| **Netflix Prize (2009)** — the \$1M winning ensemble was never fully put into production | Accuracy vs cost/complexity | Marginal accuracy gains must pay for their engineering cost |
| **Amazon recruiting model (2018)** — penalised CVs mentioning "women's" | Biased labels = biased model | Audit training labels and outcomes by group |
| **Telecom churn at e&-type operators** — a model trained on a random split scored AUC 0.92, but only 0.74 on next month's customers | Leakage + temporal validation | Always split by time for anything that will predict the future (§6.5, Part 16 §16.3) |
| **Kaggle "leak" competitions** (e.g., IDs correlated with the target) | Data leakage | If the score looks too good, hunt for leakage first |

→ More case studies: Part 25 §25.4.

---

## Further reading

- **MLU-Explain** — https://mlu-explain.github.io/ — the link from your own notes. Beyond linear regression it has excellent visual explainers on the bias–variance tradeoff, ROC curves, cross-validation, and random forests. Start here.
- **StatQuest with Josh Starmer** (YouTube) — the standard recommendation for intuition on every concept in this part. The bias–variance, ROC/AUC, and cross-validation videos are particularly good.
- **An Introduction to Statistical Learning** (ISLR), James, Witten, Hastie, Tibshirani — free PDF at https://www.statlearning.com/. Chapters 2 (assessing model accuracy), 3 (linear regression), 5 (resampling), 6 (regularisation). The Python edition (ISLP) exists now. **This is the single best book for the gap between this course and rigour.**
- **The Elements of Statistical Learning** (ESL), same authors — the graduate-level version. Free online. Reach for it when ISLR is not deep enough.
- **scikit-learn User Guide §3, "Model selection and evaluation"** — https://scikit-learn.org/stable/model_selection.html. The metrics page is the authoritative reference for everything in §6.6.
- **Andrew Ng, *Machine Learning Specialization*** (Coursera) — the gradient descent and bias/variance material is still the clearest structured treatment available.

---

<!-- nav -->
> [!example] 🧭 Step 8 of 26 · Stage 3 of 7: Classical ML
> ← [Part 15 · Statistics & A/B tests](15_Statistics_Probability_and_AB_Testing.md) · [Part 07 · Regression](07_Supervised_Regression.md) → · [Course map](00_START_HERE.md)
<!-- /nav -->
