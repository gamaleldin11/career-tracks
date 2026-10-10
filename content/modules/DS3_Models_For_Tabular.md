# Models That Win on Tables — Baselines, Linear Models, Trees and Gradient Boosting

Most data-science work in banks, telecoms and e-commerce is on **tabular** data: rows of customers, transactions or orders with mixed numeric and categorical columns. On that data, **gradient-boosted trees** (XGBoost, LightGBM, CatBoost) remain the strongest general-purpose choice, and your own course notes flag them as your biggest modelling gap. This module covers the models interviewers expect you to compare and defend, with the depth needed to tune and explain them. *AI Journey* Parts 7, 8 and 8B have the full derivations and Géron page references.

> [!focus]
> **Entry must:** start from a baseline; explain linear and logistic regression and interpret coefficients; explain decision trees, random forests and boosting at an intuitive level; know which models need scaling; tune with cross-validation.
> **Mid adds:** how gradient boosting fits residuals, the key hyperparameters and early stopping, XGBoost vs LightGBM vs CatBoost, regularisation, Bayesian tuning with Optuna, stacking, when neural networks or tabular foundation models are worth trying.
> **Most asked:** *Bagging vs boosting?* · *Random forest vs gradient boosting?* · *How does gradient boosting work?* · *Which hyperparameters matter in XGBoost or LightGBM?* · *Logistic regression: how do you interpret a coefficient?* · *L1 vs L2?* · *Why not deep learning here?*
> **Time budget:** 4 hours, with a notebook.

## DS3.0 Foundations: fitting, overfitting and the bias–variance trade-off 🟢

Every model sits somewhere between two failures:

- **Underfitting (high bias):** too simple to capture the pattern, so it's wrong on the training data and on new data alike.
- **Overfitting (high variance):** so flexible that it memorises the noise in its training data. It looks excellent there and does worse on new data.

<figure class="dia"><svg viewBox="0 0 720 226" role="img" aria-label="The same noisy points fitted by a straight line that underfits, a smooth curve that fits well, and a jagged line through every point that overfits">
<rect class="sN" x="14" y="30" width="220" height="160" rx="8"/><text class="sWt" x="124" y="22" text-anchor="middle">underfit: a straight line</text>
<circle class="sP" cx="28.0" cy="98.4" r="4"/>
<circle class="sP" cx="45.1" cy="84.0" r="4"/>
<circle class="sP" cx="62.2" cy="48.6" r="4"/>
<circle class="sP" cx="79.3" cy="58.6" r="4"/>
<circle class="sP" cx="96.4" cy="38.8" r="4"/>
<circle class="sP" cx="113.5" cy="50.6" r="4"/>
<circle class="sP" cx="130.6" cy="75.1" r="4"/>
<circle class="sP" cx="147.7" cy="77.5" r="4"/>
<circle class="sP" cx="164.8" cy="115.6" r="4"/>
<circle class="sP" cx="181.9" cy="121.2" r="4"/>
<circle class="sP" cx="199.0" cy="149.9" r="4"/>
<circle class="sP" cx="216.1" cy="157.7" r="4"/>
<polyline class="sLw" points="28.0,47.8 218.0,132.4" fill="none" stroke-width="2.5"/>
<rect class="sN" x="250" y="30" width="220" height="160" rx="8"/><text class="sGt" x="360" y="22" text-anchor="middle">good fit</text>
<circle class="sP" cx="264.0" cy="98.4" r="4"/>
<circle class="sP" cx="281.1" cy="84.0" r="4"/>
<circle class="sP" cx="298.2" cy="48.6" r="4"/>
<circle class="sP" cx="315.3" cy="58.6" r="4"/>
<circle class="sP" cx="332.4" cy="38.8" r="4"/>
<circle class="sP" cx="349.5" cy="50.6" r="4"/>
<circle class="sP" cx="366.6" cy="75.1" r="4"/>
<circle class="sP" cx="383.7" cy="77.5" r="4"/>
<circle class="sP" cx="400.8" cy="115.6" r="4"/>
<circle class="sP" cx="417.9" cy="121.2" r="4"/>
<circle class="sP" cx="435.0" cy="149.9" r="4"/>
<circle class="sP" cx="452.1" cy="157.7" r="4"/>
<polyline class="sLg" points="264.0,92.0 271.6,82.6 279.2,73.5 286.8,65.0 294.4,57.4 302.0,51.0 309.6,45.9 317.2,42.3 324.8,40.4 332.4,40.1 340.0,41.6 347.6,44.7 355.2,49.4 362.8,55.5 370.4,62.8 378.0,71.1 385.6,80.0 393.2,89.4 400.8,98.8 408.4,108.0 416.0,116.7 423.6,124.6 431.2,131.4 438.8,136.9 446.4,140.9 454.0,143.3" fill="none" stroke-width="2.5"/>
<rect class="sN" x="486" y="30" width="220" height="160" rx="8"/><text class="sRt" x="596" y="22" text-anchor="middle">overfit: chases the noise</text>
<circle class="sP" cx="500.0" cy="98.4" r="4"/>
<circle class="sP" cx="517.1" cy="84.0" r="4"/>
<circle class="sP" cx="534.2" cy="48.6" r="4"/>
<circle class="sP" cx="551.3" cy="58.6" r="4"/>
<circle class="sP" cx="568.4" cy="38.8" r="4"/>
<circle class="sP" cx="585.5" cy="50.6" r="4"/>
<circle class="sP" cx="602.6" cy="75.1" r="4"/>
<circle class="sP" cx="619.7" cy="77.5" r="4"/>
<circle class="sP" cx="636.8" cy="115.6" r="4"/>
<circle class="sP" cx="653.9" cy="121.2" r="4"/>
<circle class="sP" cx="671.0" cy="149.9" r="4"/>
<circle class="sP" cx="688.1" cy="157.7" r="4"/>
<polyline class="sLr" points="500.0,98.4 517.1,84.0 534.2,48.6 551.3,58.6 568.4,38.8 585.5,50.6 602.6,75.1 619.7,77.5 636.8,115.6 653.9,121.2 671.0,149.9 688.1,157.7" fill="none" stroke-width="2.5"/>
<text class="sS" x="360" y="214" text-anchor="middle">the right-hand model has zero training error and will predict new points worst</text>
</svg><figcaption>Too simple, about right, too flexible. Only new data can tell the middle one from the right-hand one.</figcaption></figure>

Complexity (deeper trees, more features, more boosting rounds, weaker regularisation) moves a model from the first failure towards the second. Training error keeps falling as complexity grows; **validation error** falls, bottoms out, then rises again. Every technique in this module, from regularisation to early stopping to ensembles, is a way of controlling where a model sits on that curve.

<figure class="dia"><svg viewBox="0 0 720 244" role="img" aria-label="Training error falls steadily as model complexity grows, while validation error falls, reaches a minimum and rises again">
<line class="sLm" x1="80" y1="190" x2="650" y2="190" marker-end="url(#ahm)"/><line class="sLm" x1="80" y1="190" x2="80" y2="34" marker-end="url(#ahm)"/>
<polyline class="sL" points="80.0,56.5 108.0,78.8 136.0,97.2 164.0,112.4 192.0,124.9 220.0,135.3 248.0,143.8 276.0,150.8 304.0,156.6 332.0,161.4 360.0,165.4 388.0,168.6 416.0,171.3 444.0,173.5 472.0,175.4 500.0,176.9 528.0,178.1 556.0,179.2 584.0,180.0 612.0,180.7 640.0,181.3" fill="none" stroke-width="2.5"/><polyline class="sLr" points="80.0,56.5 108.0,78.3 136.0,95.4 164.0,108.5 192.0,118.2 220.0,125.0 248.0,129.3 276.0,131.4 304.0,131.6 332.0,130.1 360.0,127.1 388.0,122.7 416.0,117.1 444.0,110.5 472.0,102.8 500.0,94.1 528.0,84.6 556.0,74.2 584.0,63.0 612.0,51.0 640.0,38.3" fill="none" stroke-width="2.5"/>
<line class="sLg" x1="304" y1="190" x2="304" y2="55" stroke-dasharray="5 4"/><text class="sGt" x="304" y="49" text-anchor="middle">best on new data</text>
<text class="sC" x="617.6" y="173.276" text-anchor="end">training error</text><text class="sRt" x="617.6" y="30.2973" text-anchor="end">validation error</text>
<text class="sWt" x="147.2" y="210" text-anchor="middle">← underfitting (bias)</text><text class="sRt" x="550.4" y="210" text-anchor="middle">overfitting (variance) →</text>
<text class="sC" x="360" y="232" text-anchor="middle">model complexity: depth, features, boosting rounds, less regularisation</text><text class="sC" x="86" y="22">error</text>
</svg><figcaption>The bias–variance trade-off. Regularisation, early stopping and tuning are all ways of landing at the bottom of the red curve.</figcaption></figure>

## DS3.1 Baselines first 🟢 ⭐

Every model needs something to beat:

| Baseline | Example |
|---|---|
| **Trivial** | Predict the majority class; predict the mean or median; for time series, last value or the same day last week |
| **Business rule** | "No recharge in 14 days → churn risk" |
| **Simple model** | Logistic regression on a handful of strong features |

If the complex model beats the rule by a hair, the rule may be the better product (transparent, cheap, already trusted). Reporting the baseline is also how you show the model's value honestly: "the model catches 62% of churners in the top 10%, vs 38% for the current rule."

## DS3.2 Linear and logistic regression 🟢 ⭐

**Linear regression** predicts a number as a weighted sum of features; **logistic regression** passes that sum through a sigmoid to predict a probability.

<figure class="dia"><svg viewBox="0 0 720 220" role="img" aria-label="Logistic regression: a weighted sum of features gives the log-odds z, and the sigmoid curve turns z into a probability between 0 and 1">
<rect class="sB" x="14" y="30" width="300" height="70" rx="8"/><text class="sT" x="164" y="52" text-anchor="middle">weighted sum (log-odds)</text><text class="sC" x="26" y="80" xml:space="preserve" style="white-space:pre">z = −2.1 + 0.26·complaints</text>
<text class="sC" x="26" y="96" xml:space="preserve" style="white-space:pre">      + 0.08·days_since_recharge</text>
<line class="sLm" x1="164" y1="100" x2="164" y2="128" marker-end="url(#ahm)"/><rect class="sV" x="14" y="130" width="300" height="60" rx="8"/><text class="sT" x="164" y="152" text-anchor="middle">sigmoid: p = 1 ÷ (1 + e^−z)</text><text class="sC" x="164" y="174" text-anchor="middle">squashes any z into 0…1</text>
<line class="sLm" x1="380" y1="190" x2="700" y2="190" marker-end="url(#ahm)"/><line class="sD" x1="536" y1="190" x2="536" y2="34"/>
<polyline class="sL" points="380.0,189.6 386.5,189.5 393.0,189.4 399.5,189.2 406.0,189.0 412.5,188.7 419.0,188.4 425.5,187.9 432.0,187.3 438.5,186.6 445.0,185.6 451.5,184.4 458.0,182.9 464.5,181.0 471.0,178.6 477.5,175.7 484.0,172.1 490.5,167.8 497.0,162.6 503.5,156.6 510.0,149.7 516.5,141.9 523.0,133.4 529.5,124.3 536.0,115.0 542.5,105.7 549.0,96.6 555.5,88.1 562.0,80.3 568.5,73.4 575.0,67.4 581.5,62.2 588.0,57.9 594.5,54.3 601.0,51.4 607.5,49.0 614.0,47.1 620.5,45.6 627.0,44.4 633.5,43.4 640.0,42.7 646.5,42.1 653.0,41.6 659.5,41.3 666.0,41.0 672.5,40.8 679.0,40.6 685.5,40.5 692.0,40.4" fill="none" stroke-width="2.5"/>
<text class="sC" x="380" y="208" text-anchor="middle">−6</text><text class="sC" x="536" y="208" text-anchor="middle">z = 0 → p = 0.5</text><text class="sC" x="692" y="208" text-anchor="middle">+6</text>
<circle class="sPg" cx="567" cy="75" r="6"/><text class="sGt" x="555.2" y="64.7213" text-anchor="end">this customer: z = 1.2 → p = 0.77</text>
<text class="sC" x="380" y="32">p (churn probability)</text>
</svg><figcaption>A linear model on the log-odds scale. e^0.26 ≈ 1.30: each extra complaint multiplies the odds of churn by about 1.3.</figcaption></figure>

- **Interpretation (linear):** a coefficient is the expected change in the target for a one-unit increase in that feature, **holding the others constant**.
- **Interpretation (logistic):** a coefficient is the change in the **log-odds**; `exp(coefficient)` is an **odds ratio**: 1.30 means each extra complaint multiplies the odds of churn by 1.3, other things equal.
- **Needs scaling** when regularised (so the penalty treats features fairly), and benefits from transformed skewed features.
- **Regularisation:**

| Penalty | Effect | Use |
|---|---|---|
| **L2 (Ridge)** | Shrinks all coefficients smoothly | Many correlated features; general default |
| **L1 (Lasso)** | Drives some coefficients **exactly to zero** | Feature selection, sparse models |
| **Elastic net** | A mix | Correlated groups plus sparsity |

> [!say]
> "Logistic regression gives me a fast, calibrated-ish, explainable baseline: each coefficient is a change in log-odds, so the exponent is an odds ratio I can explain to the business. L2 regularisation handles correlated features; L1 zeroes out weak ones, which doubles as feature selection."

**Strengths:** fast, explainable, stable, good probability estimates, works well with limited data, the standard in credit **scorecards** (often on binned features with weight-of-evidence encoding). **Weaknesses:** misses non-linear effects and interactions unless you engineer them.

## DS3.3 Decision trees 🟢

A tree splits the data on feature thresholds to make groups as **pure** as possible (by Gini impurity or entropy for classification, variance for regression).

<figure class="dia"><svg viewBox="0 0 720 248" role="img" aria-label="A decision tree for churn splitting on days since recharge, then complaints or tenure, ending in leaves with churn rates from 2% to 54%">
<rect class="sB" x="250" y="10" width="220" height="46" rx="8"/><text class="sT" x="360" y="30" text-anchor="middle">days since recharge &gt; 14?</text><text class="sC" x="360" y="47" text-anchor="middle">n = 10,000 · churn 8%</text>
<line class="sLm" x1="300" y1="56" x2="190" y2="86" marker-end="url(#ahm)"/><line class="sLm" x1="420" y1="56" x2="530" y2="86" marker-end="url(#ahm)"/><text class="sC" x="232" y="66" text-anchor="middle">yes</text><text class="sC" x="488" y="66" text-anchor="middle">no</text>
<rect class="sW" x="80" y="88" width="200" height="46" rx="8"/><text class="sT" x="180" y="108" text-anchor="middle">complaints_30d ≥ 2?</text><text class="sC" x="180" y="125" text-anchor="middle">n = 1,800 · 31%</text><rect class="sB" x="440" y="88" width="200" height="46" rx="8"/><text class="sT" x="540" y="108" text-anchor="middle">tenure &lt; 90 days?</text><text class="sC" x="540" y="125" text-anchor="middle">n = 8,200 · 3%</text>
<line class="sLm" x1="140" y1="134" x2="100" y2="164" marker-end="url(#ahm)"/><line class="sLm" x1="220" y1="134" x2="260" y2="164" marker-end="url(#ahm)"/><line class="sLm" x1="500" y1="134" x2="460" y2="164" marker-end="url(#ahm)"/><line class="sLm" x1="580" y1="134" x2="620" y2="164" marker-end="url(#ahm)"/>
<rect class="sR" x="15" y="166" width="150" height="46" rx="8"/><text class="sT" x="90" y="186" text-anchor="middle">54% churn</text><text class="sC" x="90" y="203" text-anchor="middle">n = 400</text>
<rect class="sW" x="195" y="166" width="150" height="46" rx="8"/><text class="sT" x="270" y="186" text-anchor="middle">24% churn</text><text class="sC" x="270" y="203" text-anchor="middle">n = 1,400</text>
<rect class="sN" x="375" y="166" width="150" height="46" rx="8"/><text class="sT" x="450" y="186" text-anchor="middle">9% churn</text><text class="sC" x="450" y="203" text-anchor="middle">n = 1,100</text>
<rect class="sG" x="555" y="166" width="150" height="46" rx="8"/><text class="sT" x="630" y="186" text-anchor="middle">2% churn</text><text class="sC" x="630" y="203" text-anchor="middle">n = 7,100</text>
<text class="sS" x="360" y="236" text-anchor="middle">each split picks the feature and threshold that make the groups below purest</text>
</svg><figcaption>A shallow tree is readable: each path is a rule. A deep one memorises the training data, which is why trees are used in ensembles.</figcaption></figure>

- **Pros:** no scaling needed; handles non-linearity and interactions; readable when shallow.
- **Cons:** a single deep tree **overfits** badly and is unstable (small data changes, different tree). Control with `max_depth`, `min_samples_leaf` and pruning.

Trees matter mainly as the building block of the ensembles below.

## DS3.4 Random forests (bagging) 🟢 ⭐

> [!term] Bagging (bootstrap aggregating)
> Train many models on **bootstrap samples** (random samples with replacement) of the data and **average** their predictions. Averaging many high-variance, low-bias models (deep trees) **reduces variance**.

A **random forest** adds a second source of randomness: each split considers only a random subset of features (`max_features`), so trees are less correlated and the average improves more.

- **Strengths:** strong out of the box, hard to overfit badly by adding trees, few sensitive hyperparameters, parallel training, built-in **out-of-bag (OOB)** validation (each tree is scored on the samples it didn't see).
- **Weaknesses:** large models, slower prediction; usually beaten by well-tuned boosting on tabular data; probability estimates often need calibration.

## DS3.5 Gradient boosting 🟢 🟡 ⭐

> [!term] Boosting
> Train models **sequentially**, each one focusing on the errors of the ensemble so far, and **add** them up. Boosting mainly **reduces bias**: it combines many weak, shallow trees into a strong model.

**How gradient boosting works, intuitively:**

1. Start with a simple prediction (the mean, or the log-odds of the base rate).
2. Compute the **residuals**, more precisely the negative **gradient** of the loss with respect to the current predictions.
3. Fit a small tree to those residuals.
4. Add the tree's predictions, **scaled by a learning rate** (say 0.05), to the ensemble.
5. Repeat for hundreds or thousands of rounds, stopping when validation error stops improving (**early stopping**).

<figure class="dia"><svg viewBox="0 0 720 150" role="img" aria-label="Gradient boosting: each tree fits the residuals of the ensemble so far">
<g class="sT" text-anchor="middle">
<rect class="sB" x="10" y="45" width="110" height="56" rx="8"/><text x="65" y="70">Base</text><text class="sS" x="65" y="88">mean / log-odds</text>
<rect class="sA" x="160" y="45" width="110" height="56" rx="8"/><text x="215" y="70">Tree 1</text><text class="sS" x="215" y="88">fits residuals</text>
<rect class="sA" x="310" y="45" width="110" height="56" rx="8"/><text x="365" y="70">Tree 2</text><text class="sS" x="365" y="88">fits new residuals</text>
<rect class="sA" x="460" y="45" width="110" height="56" rx="8"/><text x="515" y="70">Tree N</text><text class="sS" x="515" y="88">… until early stop</text>
<rect class="sG" x="610" y="45" width="100" height="56" rx="8"/><text x="660" y="70">Prediction</text><text class="sS" x="660" y="88">sum × η</text>
</g>
<line class="sL" x1="120" y1="73" x2="160" y2="73"/><line class="sL" x1="270" y1="73" x2="310" y2="73"/><line class="sD" x1="420" y1="73" x2="460" y2="73"/><line class="sL" x1="570" y1="73" x2="610" y2="73"/>
<text class="sS" x="10" y="135">Each small tree corrects what the ensemble still gets wrong; the learning rate η keeps each step small.</text>
</svg><figcaption>Bagging averages independent trees to cut variance; boosting adds dependent trees to cut bias.</figcaption></figure>

<figure class="dia steps" data-start="1"><svg viewBox="0 0 720 222" role="img" aria-label="Gradient boosting on toy data: start from the mean, compute residuals, add a one-split tree fitted to them, and repeat; after many rounds the model starts fitting noise">
<line class="sLm" x1="50" y1="200" x2="670" y2="200" marker-end="url(#ahm)"/>
<circle class="sP" cx="70.0" cy="184.4" r="4"/>
<circle class="sP" cx="90.0" cy="172.7" r="4"/>
<circle class="sP" cx="110.0" cy="179.0" r="4"/>
<circle class="sP" cx="130.0" cy="169.8" r="4"/>
<circle class="sP" cx="150.0" cy="168.5" r="4"/>
<circle class="sP" cx="170.0" cy="189.0" r="4"/>
<circle class="sP" cx="190.0" cy="189.9" r="4"/>
<circle class="sP" cx="210.0" cy="157.1" r="4"/>
<circle class="sP" cx="230.0" cy="176.7" r="4"/>
<circle class="sP" cx="250.0" cy="174.4" r="4"/>
<circle class="sP" cx="270.0" cy="141.0" r="4"/>
<circle class="sP" cx="290.0" cy="154.8" r="4"/>
<circle class="sP" cx="310.0" cy="132.9" r="4"/>
<circle class="sP" cx="330.0" cy="136.6" r="4"/>
<circle class="sP" cx="350.0" cy="119.0" r="4"/>
<circle class="sP" cx="370.0" cy="125.0" r="4"/>
<circle class="sP" cx="390.0" cy="94.3" r="4"/>
<circle class="sP" cx="410.0" cy="74.0" r="4"/>
<circle class="sP" cx="430.0" cy="77.1" r="4"/>
<circle class="sP" cx="450.0" cy="60.8" r="4"/>
<circle class="sP" cx="470.0" cy="57.3" r="4"/>
<circle class="sP" cx="490.0" cy="75.8" r="4"/>
<circle class="sP" cx="510.0" cy="46.3" r="4"/>
<circle class="sP" cx="530.0" cy="50.3" r="4"/>
<circle class="sP" cx="550.0" cy="59.7" r="4"/>
<circle class="sP" cx="570.0" cy="68.8" r="4"/>
<circle class="sP" cx="590.0" cy="36.5" r="4"/>
<circle class="sP" cx="610.0" cy="50.9" r="4"/>
<circle class="sP" cx="630.0" cy="41.2" r="4"/>
<circle class="sP" cx="650.0" cy="34.9" r="4"/>
<g data-s="1-1"><polyline class="sLw" points="60.0,113.3 80.0,113.3 80.0,113.3 100.0,113.3 100.0,113.3 120.0,113.3 120.0,113.3 140.0,113.3 140.0,113.3 160.0,113.3 160.0,113.3 180.0,113.3 180.0,113.3 200.0,113.3 200.0,113.3 220.0,113.3 220.0,113.3 240.0,113.3 240.0,113.3 260.0,113.3 260.0,113.3 280.0,113.3 280.0,113.3 300.0,113.3 300.0,113.3 320.0,113.3 320.0,113.3 340.0,113.3 340.0,113.3 360.0,113.3 360.0,113.3 380.0,113.3 380.0,113.3 400.0,113.3 400.0,113.3 420.0,113.3 420.0,113.3 440.0,113.3 440.0,113.3 460.0,113.3 460.0,113.3 480.0,113.3 480.0,113.3 500.0,113.3 500.0,113.3 520.0,113.3 520.0,113.3 540.0,113.3 540.0,113.3 560.0,113.3 560.0,113.3 580.0,113.3 580.0,113.3 600.0,113.3 600.0,113.3 620.0,113.3 620.0,113.3 640.0,113.3 640.0,113.3 660.0,113.3" fill="none" stroke-width="2.5"/><text class="sWt" x="70" y="30">start: predict the mean for everyone</text></g>
<g data-s="2-2"><polyline class="sLw" points="60.0,113.3 80.0,113.3 80.0,113.3 100.0,113.3 100.0,113.3 120.0,113.3 120.0,113.3 140.0,113.3 140.0,113.3 160.0,113.3 160.0,113.3 180.0,113.3 180.0,113.3 200.0,113.3 200.0,113.3 220.0,113.3 220.0,113.3 240.0,113.3 240.0,113.3 260.0,113.3 260.0,113.3 280.0,113.3 280.0,113.3 300.0,113.3 300.0,113.3 320.0,113.3 320.0,113.3 340.0,113.3 340.0,113.3 360.0,113.3 360.0,113.3 380.0,113.3 380.0,113.3 400.0,113.3 400.0,113.3 420.0,113.3 420.0,113.3 440.0,113.3 440.0,113.3 460.0,113.3 460.0,113.3 480.0,113.3 480.0,113.3 500.0,113.3 500.0,113.3 520.0,113.3 520.0,113.3 540.0,113.3 540.0,113.3 560.0,113.3 560.0,113.3 580.0,113.3 580.0,113.3 600.0,113.3 600.0,113.3 620.0,113.3 620.0,113.3 640.0,113.3 640.0,113.3 660.0,113.3" fill="none" stroke-width="2.5"/><line class="sLr" x1="70.0" y1="113.3" x2="70.0" y2="184.4"/><line class="sLr" x1="90.0" y1="113.3" x2="90.0" y2="172.7"/><line class="sLr" x1="110.0" y1="113.3" x2="110.0" y2="179.0"/><line class="sLr" x1="130.0" y1="113.3" x2="130.0" y2="169.8"/><line class="sLr" x1="150.0" y1="113.3" x2="150.0" y2="168.5"/><line class="sLr" x1="170.0" y1="113.3" x2="170.0" y2="189.0"/><line class="sLr" x1="190.0" y1="113.3" x2="190.0" y2="189.9"/><line class="sLr" x1="210.0" y1="113.3" x2="210.0" y2="157.1"/><line class="sLr" x1="230.0" y1="113.3" x2="230.0" y2="176.7"/><line class="sLr" x1="250.0" y1="113.3" x2="250.0" y2="174.4"/><line class="sLr" x1="270.0" y1="113.3" x2="270.0" y2="141.0"/><line class="sLr" x1="290.0" y1="113.3" x2="290.0" y2="154.8"/><line class="sLr" x1="310.0" y1="113.3" x2="310.0" y2="132.9"/><line class="sLr" x1="330.0" y1="113.3" x2="330.0" y2="136.6"/><line class="sLr" x1="350.0" y1="113.3" x2="350.0" y2="119.0"/><line class="sLr" x1="370.0" y1="113.3" x2="370.0" y2="125.0"/><line class="sLg" x1="390.0" y1="113.3" x2="390.0" y2="94.3"/><line class="sLg" x1="410.0" y1="113.3" x2="410.0" y2="74.0"/><line class="sLg" x1="430.0" y1="113.3" x2="430.0" y2="77.1"/><line class="sLg" x1="450.0" y1="113.3" x2="450.0" y2="60.8"/><line class="sLg" x1="470.0" y1="113.3" x2="470.0" y2="57.3"/><line class="sLg" x1="490.0" y1="113.3" x2="490.0" y2="75.8"/><line class="sLg" x1="510.0" y1="113.3" x2="510.0" y2="46.3"/><line class="sLg" x1="530.0" y1="113.3" x2="530.0" y2="50.3"/><line class="sLg" x1="550.0" y1="113.3" x2="550.0" y2="59.7"/><line class="sLg" x1="570.0" y1="113.3" x2="570.0" y2="68.8"/><line class="sLg" x1="590.0" y1="113.3" x2="590.0" y2="36.5"/><line class="sLg" x1="610.0" y1="113.3" x2="610.0" y2="50.9"/><line class="sLg" x1="630.0" y1="113.3" x2="630.0" y2="41.2"/><line class="sLg" x1="650.0" y1="113.3" x2="650.0" y2="34.9"/><text class="sC" x="70" y="30">residuals: what the mean gets wrong</text></g>
<g data-s="3-3"><polyline class="sLw" points="60.0,113.3 80.0,113.3 80.0,113.3 100.0,113.3 100.0,113.3 120.0,113.3 120.0,113.3 140.0,113.3 140.0,113.3 160.0,113.3 160.0,113.3 180.0,113.3 180.0,113.3 200.0,113.3 200.0,113.3 220.0,113.3 220.0,113.3 240.0,113.3 240.0,113.3 260.0,113.3 260.0,113.3 280.0,113.3 280.0,113.3 300.0,113.3 300.0,113.3 320.0,113.3 320.0,113.3 340.0,113.3 340.0,113.3 360.0,113.3 360.0,113.3 380.0,113.3 380.0,113.3 400.0,113.3 400.0,113.3 420.0,113.3 420.0,113.3 440.0,113.3 440.0,113.3 460.0,113.3 460.0,113.3 480.0,113.3 480.0,113.3 500.0,113.3 500.0,113.3 520.0,113.3 520.0,113.3 540.0,113.3 540.0,113.3 560.0,113.3 560.0,113.3 580.0,113.3 580.0,113.3 600.0,113.3 600.0,113.3 620.0,113.3 620.0,113.3 640.0,113.3 640.0,113.3 660.0,113.3" fill="none" stroke-width="2.5"/><polyline class="sLg" points="60.0,137.0 80.0,137.0 80.0,137.0 100.0,137.0 100.0,137.0 120.0,137.0 120.0,137.0 140.0,137.0 140.0,137.0 160.0,137.0 160.0,137.0 180.0,137.0 180.0,137.0 200.0,137.0 200.0,137.0 220.0,137.0 220.0,137.0 240.0,137.0 240.0,137.0 260.0,137.0 260.0,137.0 280.0,137.0 280.0,137.0 300.0,137.0 300.0,137.0 320.0,137.0 320.0,137.0 340.0,137.0 340.0,137.0 360.0,137.0 360.0,137.0 380.0,137.0 380.0,86.2 400.0,86.2 400.0,86.2 420.0,86.2 420.0,86.2 440.0,86.2 440.0,86.2 460.0,86.2 460.0,86.2 480.0,86.2 480.0,86.2 500.0,86.2 500.0,86.2 520.0,86.2 520.0,86.2 540.0,86.2 540.0,86.2 560.0,86.2 560.0,86.2 580.0,86.2 580.0,86.2 600.0,86.2 600.0,86.2 620.0,86.2 620.0,86.2 640.0,86.2 640.0,86.2 660.0,86.2" fill="none" stroke-width="2.5"/><line class="sD" x1="380" y1="40" x2="380" y2="200.0"/><text class="sGt" x="70" y="30">tree 1: one split at x = 15.5, added × 0.5</text></g>
<g data-s="4-4"><polyline class="sLg" points="60.0,160.5 80.0,160.5 80.0,160.5 100.0,160.5 100.0,160.5 120.0,160.5 120.0,160.5 140.0,160.5 140.0,160.5 160.0,160.5 160.0,160.5 180.0,160.5 180.0,160.5 200.0,160.5 200.0,160.5 220.0,160.5 220.0,160.5 240.0,160.5 240.0,160.5 260.0,160.5 260.0,160.5 280.0,160.5 280.0,160.5 300.0,160.5 300.0,131.8 320.0,131.8 320.0,131.8 340.0,131.8 340.0,131.8 360.0,131.8 360.0,131.8 380.0,131.8 380.0,81.0 400.0,81.0 400.0,81.0 420.0,81.0 420.0,81.0 440.0,81.0 440.0,63.8 460.0,63.8 460.0,63.8 480.0,63.8 480.0,63.8 500.0,63.8 500.0,63.8 520.0,63.8 520.0,63.8 540.0,63.8 540.0,63.8 560.0,63.8 560.0,63.8 580.0,63.8 580.0,63.8 600.0,63.8 600.0,63.8 620.0,63.8 620.0,63.8 640.0,63.8 640.0,63.8 660.0,63.8" fill="none" stroke-width="2.5"/><text class="sGt" x="70" y="30">after 3 trees: each fixed part of what was left</text></g>
<g data-s="5-5"><polyline class="sLg" points="60.0,181.1 80.0,181.1 80.0,174.6 100.0,174.6 100.0,174.6 120.0,174.6 120.0,174.6 140.0,174.6 140.0,174.6 160.0,174.6 160.0,183.2 180.0,183.2 180.0,183.2 200.0,183.2 200.0,169.2 220.0,169.2 220.0,169.2 240.0,169.2 240.0,169.2 260.0,169.2 260.0,156.7 280.0,156.7 280.0,156.7 300.0,156.7 300.0,128.8 320.0,128.8 320.0,128.8 340.0,128.8 340.0,128.8 360.0,128.8 360.0,128.8 380.0,128.8 380.0,79.0 400.0,79.0 400.0,79.0 420.0,79.0 420.0,79.0 440.0,79.0 440.0,61.8 460.0,61.8 460.0,61.8 480.0,61.8 480.0,61.8 500.0,61.8 500.0,55.9 520.0,55.9 520.0,55.9 540.0,55.9 540.0,57.1 560.0,57.1 560.0,57.1 580.0,57.1 580.0,45.0 600.0,45.0 600.0,45.0 620.0,45.0 620.0,40.8 640.0,40.8 640.0,37.3 660.0,37.3" fill="none" stroke-width="2.5"/><text class="sGt" x="70" y="30">after 30 trees: the shape is learned</text></g>
<g data-s="6-6"><polyline class="sLr" points="60.0,183.1 80.0,183.1 80.0,175.0 100.0,175.0 100.0,175.0 120.0,175.0 120.0,172.2 140.0,172.2 140.0,172.2 160.0,172.2 160.0,185.6 180.0,185.6 180.0,185.6 200.0,185.6 200.0,164.8 220.0,164.8 220.0,171.4 240.0,171.4 240.0,171.4 260.0,171.4 260.0,149.2 280.0,149.2 280.0,154.9 300.0,154.9 300.0,130.4 320.0,130.4 320.0,130.4 340.0,130.4 340.0,126.2 360.0,126.2 360.0,126.2 380.0,126.2 380.0,86.1 400.0,86.1 400.0,78.0 420.0,78.0 420.0,78.0 440.0,78.0 440.0,60.9 460.0,60.9 460.0,60.9 480.0,60.9 480.0,67.7 500.0,67.7 500.0,52.0 520.0,52.0 520.0,52.0 540.0,52.0 540.0,59.4 560.0,59.4 560.0,62.7 580.0,62.7 580.0,42.2 600.0,42.2 600.0,46.2 620.0,46.2 620.0,41.9 640.0,41.9 640.0,36.9 660.0,36.9" fill="none" stroke-width="2.5"/><text class="sRt" x="70" y="30">after 200 trees: fitting the noise. Early stopping prevents this</text></g>
</svg><ol class="dia-steps">
<li>Boosting starts with the simplest prediction: the mean.</li>
<li>The residuals (data minus prediction) show what's still unexplained: positive on the right, negative on the left.</li>
<li>A tiny tree (one split) is fitted to the <b>residuals</b>, not to the data, and added at half strength (learning rate 0.5).</li>
<li>Three trees in, each one has corrected part of what the previous ones left.</li>
<li>Thirty rounds of small corrections recover the S-shape.</li>
<li>Keep going and the ensemble starts bending around individual noisy points. Early stopping on a validation set ends training at the bottom of the validation curve.</li>
</ol><figcaption>This is real gradient boosting with one-split trees, computed for this figure: each round fits what the ensemble still gets wrong.</figcaption></figure>

**The hyperparameters that matter** (names from LightGBM / XGBoost):

| Hyperparameter | Effect | Typical starting range |
|---|---|---|
| `learning_rate` (eta) | Step size; smaller = better generalisation but more trees | 0.03–0.1 |
| `n_estimators` (rounds) | Number of trees; set high and use **early stopping** on a validation set | Hundreds to thousands |
| `num_leaves` (LightGBM) / `max_depth` | Tree complexity; the main overfitting control | 15–127 leaves / depth 4–8 |
| `min_child_samples` / `min_child_weight` | Minimum data in a leaf | Larger → smoother |
| `subsample` (bagging fraction), `colsample_bytree` (feature fraction) | Randomness that reduces overfitting and speeds training | 0.6–0.9 |
| `reg_alpha` (L1), `reg_lambda` (L2) | Regularise leaf values | 0–10 |
| `scale_pos_weight` / class weights | Imbalance | ≈ negatives ÷ positives as a start |

```python
import lightgbm as lgb
model = lgb.LGBMClassifier(n_estimators=5000, learning_rate=0.05, num_leaves=31,
                           subsample=0.8, subsample_freq=1, colsample_bytree=0.8,
                           reg_lambda=1.0, class_weight="balanced", random_state=42)
model.fit(X_train, y_train, eval_set=[(X_valid, y_valid)], eval_metric="average_precision",
          callbacks=[lgb.early_stopping(200), lgb.log_evaluation(0)],
          categorical_feature=["region", "plan_type"])          # native categorical support
```

### XGBoost, LightGBM, CatBoost, scikit-learn ⭐

| | XGBoost | LightGBM | CatBoost | scikit-learn `HistGradientBoosting` |
|---|---|---|---|---|
| Tree growth | Level-wise by default (also leaf-wise via `grow_policy`) | **Leaf-wise** (faster, can overfit on small data) | **Symmetric (oblivious)** trees | Leaf-wise |
| Speed | Fast (histogram method) | Very fast on large data | Slower to train, fast to predict | Fast for medium data |
| Categoricals | Supported (`enable_categorical`) | Native | **Best native handling** (ordered target statistics) | Native (`categorical_features`) |
| Missing values | Native | Native | Native | Native |
| Defaults | Need some tuning | Need some tuning | **Strong out of the box** | Reasonable |
| GPU | Yes | Yes | Yes | No |

> [!say]
> "Random forests average many deep, independent trees to reduce variance; gradient boosting adds many shallow trees sequentially, each fitting the remaining errors, which reduces bias. On tabular data boosting usually wins. I'd start with LightGBM or CatBoost (CatBoost if there are many categoricals), use early stopping on a time-based validation set, then tune the leaves, learning rate and sampling fractions."

> [!sota] Tabular foundation models
> Pre-trained transformers for tables are emerging: **TabPFN** (v2 published in *Nature* in January 2025) predicts on small datasets (up to about 10,000 rows) in a single forward pass with no tuning, often matching tuned boosting there. For typical business datasets of hundreds of thousands of rows, well-tuned gradient boosting remains the default. Knowing this exists is a strong mid-level signal; *AI Journey* Part 25 tracks the state of the art.

## DS3.6 Tuning without fooling yourself 🟡 ⭐

- **Validation design first** ([[DS4.2]]): time-based for time-ordered data; grouped by customer when they repeat.
- **Random search** beats grid search for the same budget (most hyperparameters barely matter; random search tries more values of the ones that do).
- **Bayesian optimisation** with **Optuna** (tree-structured Parzen estimator) finds good settings faster, and prunes bad trials early.
- **Early stopping** chooses the number of rounds; don't also tune it by grid.
- Keep a **final untouched test set** (ideally the most recent period) for one honest estimate.

<figure class="dia"><svg viewBox="0 0 720 282" role="img" aria-label="Grid search tries only three distinct values of the hyperparameter that matters and misses the peak; random search with the same nine trials tries nine values and gets close">
<text class="sM" x="200" y="16" text-anchor="middle">grid search: 9 trials</text>
<polyline class="sLg" points="100.0,70.0 104.0,70.0 108.0,70.0 112.0,70.0 116.0,70.0 120.0,70.0 124.0,70.0 128.0,70.0 132.0,70.0 136.0,70.0 140.0,70.0 144.0,70.0 148.0,70.0 152.0,70.0 156.0,70.0 160.0,70.0 164.0,70.0 168.0,69.9 172.0,69.8 176.0,69.6 180.0,69.2 184.0,68.4 188.0,67.0 192.0,64.8 196.0,61.4 200.0,56.7 204.0,50.9 208.0,44.2 212.0,37.4 216.0,31.5 220.0,27.4 224.0,26.0 228.0,27.4 232.0,31.5 236.0,37.4 240.0,44.2 244.0,50.9 248.0,56.7 252.0,61.4 256.0,64.8 260.0,67.0 264.0,68.4 268.0,69.2 272.0,69.6 276.0,69.8 280.0,69.9 284.0,70.0 288.0,70.0 292.0,70.0 296.0,70.0 300.0,70.0" fill="none" stroke-width="2"/>
<rect class="sN" x="100" y="80" width="200" height="150" rx="4"/>
<circle class="sP" cx="130" cy="208" r="5"/><line class="sD" x1="130" y1="70" x2="130" y2="80"/>
<circle class="sPg" cx="130" cy="70" r="3.5"/>
<circle class="sP" cx="130" cy="155" r="5"/><line class="sD" x1="130" y1="70" x2="130" y2="80"/>
<circle class="sPg" cx="130" cy="70" r="3.5"/>
<circle class="sP" cx="130" cy="102" r="5"/><line class="sD" x1="130" y1="70" x2="130" y2="80"/>
<circle class="sPg" cx="130" cy="70" r="3.5"/>
<circle class="sP" cx="200" cy="208" r="5"/><line class="sD" x1="200" y1="57" x2="200" y2="80"/>
<circle class="sPg" cx="200" cy="57" r="3.5"/>
<circle class="sP" cx="200" cy="155" r="5"/><line class="sD" x1="200" y1="57" x2="200" y2="80"/>
<circle class="sPg" cx="200" cy="57" r="3.5"/>
<circle class="sP" cx="200" cy="102" r="5"/><line class="sD" x1="200" y1="57" x2="200" y2="80"/>
<circle class="sPg" cx="200" cy="57" r="3.5"/>
<circle class="sP" cx="270" cy="208" r="5"/><line class="sD" x1="270" y1="69" x2="270" y2="80"/>
<circle class="sPg" cx="270" cy="69" r="3.5"/>
<circle class="sP" cx="270" cy="155" r="5"/><line class="sD" x1="270" y1="69" x2="270" y2="80"/>
<circle class="sPg" cx="270" cy="69" r="3.5"/>
<circle class="sP" cx="270" cy="102" r="5"/><line class="sD" x1="270" y1="69" x2="270" y2="80"/>
<circle class="sPg" cx="270" cy="69" r="3.5"/>
<text class="sC" x="200" y="250" text-anchor="middle">important hyperparameter →</text>
<text class="sC" x="92" y="140" text-anchor="end">unimportant</text>
<text class="sM" x="530" y="16" text-anchor="middle">random search: 9 trials</text>
<polyline class="sLg" points="430.0,70.0 434.0,70.0 438.0,70.0 442.0,70.0 446.0,70.0 450.0,70.0 454.0,70.0 458.0,70.0 462.0,70.0 466.0,70.0 470.0,70.0 474.0,70.0 478.0,70.0 482.0,70.0 486.0,70.0 490.0,70.0 494.0,70.0 498.0,69.9 502.0,69.8 506.0,69.6 510.0,69.2 514.0,68.4 518.0,67.0 522.0,64.8 526.0,61.4 530.0,56.7 534.0,50.9 538.0,44.2 542.0,37.4 546.0,31.5 550.0,27.4 554.0,26.0 558.0,27.4 562.0,31.5 566.0,37.4 570.0,44.2 574.0,50.9 578.0,56.7 582.0,61.4 586.0,64.8 590.0,67.0 594.0,68.4 598.0,69.2 602.0,69.6 606.0,69.8 610.0,69.9 614.0,70.0 618.0,70.0 622.0,70.0 626.0,70.0 630.0,70.0" fill="none" stroke-width="2"/>
<rect class="sN" x="430" y="80" width="200" height="150" rx="4"/>
<circle class="sP" cx="520" cy="146" r="5"/><line class="sD" x1="520" y1="66" x2="520" y2="80"/>
<circle class="sPg" cx="520" cy="66" r="3.5"/>
<circle class="sP" cx="615" cy="160" r="5"/><line class="sD" x1="615" y1="70" x2="615" y2="80"/>
<circle class="sPg" cx="615" cy="70" r="3.5"/>
<circle class="sP" cx="532" cy="142" r="5"/><line class="sD" x1="532" y1="55" x2="532" y2="80"/>
<circle class="sPg" cx="532" cy="55" r="3.5"/>
<circle class="sP" cx="467" cy="153" r="5"/><line class="sD" x1="467" y1="70" x2="467" y2="80"/>
<circle class="sPg" cx="467" cy="70" r="3.5"/>
<circle class="sP" cx="556" cy="111" r="5"/><line class="sD" x1="556" y1="26" x2="556" y2="80"/>
<circle class="sPg" cx="556" cy="26" r="3.5"/>
<circle class="sP" cx="449" cy="184" r="5"/><line class="sD" x1="449" y1="70" x2="449" y2="80"/>
<circle class="sPg" cx="449" cy="70" r="3.5"/>
<circle class="sP" cx="448" cy="109" r="5"/><line class="sD" x1="448" y1="70" x2="448" y2="80"/>
<circle class="sPg" cx="448" cy="70" r="3.5"/>
<circle class="sP" cx="569" cy="224" r="5"/><line class="sD" x1="569" y1="42" x2="569" y2="80"/>
<circle class="sPg" cx="569" cy="42" r="3.5"/>
<circle class="sP" cx="626" cy="85" r="5"/><line class="sD" x1="626" y1="70" x2="626" y2="80"/>
<circle class="sPg" cx="626" cy="70" r="3.5"/>
<text class="sC" x="530" y="250" text-anchor="middle">important hyperparameter →</text>
<text class="sC" x="422" y="140" text-anchor="end">unimportant</text>
<text class="sRt" x="200" y="270" text-anchor="middle">3 distinct values tried; misses the peak</text><text class="sGt" x="530" y="270" text-anchor="middle">9 distinct values; one lands near the peak</text>
</svg><figcaption>Most hyperparameters barely matter. Random search spends the same budget exploring more values of the ones that do.</figcaption></figure>

```python
import optuna
def objective(trial):
    params = dict(learning_rate=trial.suggest_float("lr", 0.01, 0.2, log=True),
                  num_leaves=trial.suggest_int("leaves", 15, 255, log=True),
                  min_child_samples=trial.suggest_int("min_child", 10, 200, log=True),
                  colsample_bytree=trial.suggest_float("colsample", 0.5, 1.0),
                  subsample=trial.suggest_float("subsample", 0.5, 1.0), subsample_freq=1,
                  reg_lambda=trial.suggest_float("l2", 1e-3, 10, log=True), n_estimators=5000)
    return time_series_cv_score(lgb.LGBMClassifier(**params), X, y)   # your CV with early stopping inside
study = optuna.create_study(direction="maximize"); study.optimize(objective, n_trials=60)
```

## DS3.7 Bias, variance and regularisation in one table 🟢

| Symptom | Diagnosis | Remedies |
|---|---|---|
| Train score ≫ validation score | **Overfitting** (high variance) | More data, simpler model, stronger regularisation, fewer features, early stopping, more randomness (subsampling) |
| Train and validation both poor | **Underfitting** (high bias) | Better features, a more flexible model, less regularisation |
| Validation good, later-period test poor | **Drift or leakage** | Check time-based validation, leakage ([[DS2.4]]), and drift ([[DS8]]) |

Learning curves (score vs training-set size) tell you whether more data would help. *AI Journey* Parts 6 and 7 cover these with figures.

<figure class="dia"><svg viewBox="0 0 720 238" role="img" aria-label="Two learning curves: with high variance the validation score keeps rising towards the training score as data grows; with high bias both plateau at a low score">
<text class="sGt" x="180" y="20" text-anchor="middle">high variance: more data helps</text>
<line class="sLm" x1="50" y1="180" x2="316" y2="180" marker-end="url(#ahm)"/><line class="sLm" x1="50" y1="180" x2="50" y2="30" marker-end="url(#ahm)"/>
<polyline class="sL" points="76.0,34.8 102.0,36.6 128.0,38.4 154.0,40.2 180.0,42.0 206.0,43.8 232.0,45.6 258.0,47.4 284.0,49.2 310.0,51.0" fill="none" stroke-width="2.5"/><polyline class="sLr" points="76.0,86.3 102.0,77.9 128.0,71.6 154.0,66.9 180.0,63.3 206.0,60.6 232.0,58.6 258.0,57.1 284.0,55.9 310.0,55.1" fill="none" stroke-width="2.5"/>
<text class="sC" x="310" y="43" text-anchor="end">train</text><text class="sRt" x="310" y="71.0845" text-anchor="end">validation</text>
<text class="sC" x="180" y="200" text-anchor="middle">training-set size →</text>
<text class="sRt" x="530" y="20" text-anchor="middle">high bias: more data won't help</text>
<line class="sLm" x1="400" y1="180" x2="666" y2="180" marker-end="url(#ahm)"/><line class="sLm" x1="400" y1="180" x2="400" y2="30" marker-end="url(#ahm)"/>
<polyline class="sL" points="426.0,76.1 452.0,78.6 478.0,80.2 504.0,81.1 530.0,81.6 556.0,82.0 582.0,82.2 608.0,82.3 634.0,82.4 660.0,82.4" fill="none" stroke-width="2.5"/><polyline class="sLr" points="426.0,102.5 452.0,96.4 478.0,92.7 504.0,90.5 530.0,89.1 556.0,88.3 582.0,87.8 608.0,87.5 634.0,87.3 660.0,87.2" fill="none" stroke-width="2.5"/>
<text class="sC" x="660" y="74.4293" text-anchor="end">train</text><text class="sRt" x="660" y="103.172" text-anchor="end">validation</text>
<text class="sC" x="530" y="200" text-anchor="middle">training-set size →</text>
<text class="sS" x="360" y="226" text-anchor="middle">left: the gap is closing, so collect data · right: both plateau low, so improve features or the model</text>
</svg><figcaption>A learning curve answers "should we get more data or a better model?" before anyone spends money on either.</figcaption></figure>

## DS3.8 Other models, and when they're the right call 🟢

| Model | Use when |
|---|---|
| **k-nearest neighbours** | Small data, a meaningful distance; recommendations by similarity. Needs scaling; slow on big data |
| **Support vector machines** | Medium-sized, high-dimensional data (text with TF-IDF). Needs scaling |
| **Naive Bayes** | Fast text classification baselines |
| **Generalised linear models** (Poisson, Tweedie, Gamma) | Counts, insurance claims, money amounts with many zeros |
| **Neural networks** | Text, images, audio, sequences, very large tabular data with rich categorical embeddings, multi-task learning. On ordinary tabular data, usually not better than boosting and harder to tune |
| **Survival models** (Cox, survival forests) | "**When** will this customer churn / default?" with censored data (customers who haven't churned yet) |

## DS3.9 Ensembles and stacking 🟡

- **Averaging** a boosting model with a linear model often helps a little, because their errors differ.
- **Stacking:** train a simple **meta-model** on **out-of-fold** predictions of several base models. Gains are usually small; complexity and maintenance are real. Kaggle loves it; production teams use it sparingly.

> [!story]
> Your road-accident capstone compared several classifiers on imbalanced data with F1-macro and used SHAP to explain them. The natural next step (and your notes' top gap) is to add **HistGradientBoosting, LightGBM and CatBoost** to that leaderboard with time-aware validation and Optuna tuning. Your gaps file estimates this at "one line of code each" for the first pass. Doing it turns "familiar with XGBoost/LightGBM" into a real CV bullet.

> [!lab] The tabular leaderboard
> On the road-accident data (or Telco churn): dummy baseline → logistic regression pipeline → random forest → HistGradientBoosting → LightGBM with early stopping → CatBoost with native categoricals → Optuna-tuned LightGBM. Record PR-AUC (or F1-macro) on the same validation folds, plus training time, in one table. Then pick the model you'd actually deploy and justify it in three sentences (performance, explainability, cost to maintain).

## DS3.10 Interview drill 🟢 ⭐

| Question | Strong short answer |
|---|---|
| Why start with a baseline? | To measure real improvement and to check whether a model is worth its cost at all. |
| How do you interpret a logistic coefficient? | Change in log-odds per unit; exp(coefficient) is the odds ratio, holding other features constant. |
| L1 vs L2? | L1 drives some coefficients to zero (selection); L2 shrinks all smoothly (good with correlated features). |
| Which models need feature scaling? | Linear models with regularisation, k-NN, SVMs, neural networks, PCA; not trees or tree ensembles. |
| Bagging vs boosting? | Bagging trains independent models on bootstrap samples and averages (cuts variance); boosting trains models sequentially on remaining errors (cuts bias). |
| Random forest vs gradient boosting? | RF: robust, few tuning knobs, parallel; GBM: usually more accurate on tabular data but needs tuning and early stopping. |
| How does gradient boosting work? | Each new shallow tree fits the gradient of the loss (residuals) of the current ensemble, added with a small learning rate. |
| Key GBM hyperparameters? | Learning rate with early-stopped rounds, leaves or depth, min samples per leaf, row and column subsampling, L1/L2 regularisation. |
| XGBoost vs LightGBM vs CatBoost? | LightGBM: fast, leaf-wise; CatBoost: strong defaults and categorical handling, symmetric trees; XGBoost: mature and flexible, level-wise by default. |
| Grid vs random vs Bayesian search? | Random beats grid for the same budget; Bayesian (Optuna) learns from trials to find good settings faster. |
| Why not deep learning on this table? | On typical tabular data, boosted trees are usually as good or better, faster and easier to tune and explain. |
| How do you detect overfitting? | A large gap between training and validation scores, and learning curves. |
| What model for "when will a customer churn"? | A survival model, which handles customers who haven't churned yet (censoring). |

## Key takeaways

> [!check]
> - Always report a baseline, including the current business rule.
> - Logistic regression is the explainable benchmark; know how to read its coefficients.
> - Random forests reduce variance; boosting reduces bias and usually wins on tables.
> - Tune boosting with early stopping on a realistic validation split; Optuna saves time.
> - Add LightGBM and CatBoost to your own project: it closes your top modelling gap.

## Sources

- scikit-learn user guide: [Linear models](https://scikit-learn.org/stable/modules/linear_model.html), [Decision trees](https://scikit-learn.org/stable/modules/tree.html), [Ensembles: gradient boosting, random forests, stacking](https://scikit-learn.org/stable/modules/ensemble.html).
- [XGBoost documentation](https://xgboost.readthedocs.io/) and Chen and Guestrin, "XGBoost: A Scalable Tree Boosting System" (KDD 2016); [LightGBM documentation: parameters tuning](https://lightgbm.readthedocs.io/en/stable/Parameters-Tuning.html) and Ke et al. (NeurIPS 2017); [CatBoost documentation](https://catboost.ai/docs/) and Prokhorenkova et al. (NeurIPS 2018).
- Jerome Friedman, "Greedy Function Approximation: A Gradient Boosting Machine" (*Annals of Statistics*, 2001).
- Léo Grinsztajn, Edouard Oyallon and Gaël Varoquaux, "Why do tree-based models still outperform deep learning on typical tabular data?" (NeurIPS 2022 Datasets and Benchmarks).
- Noah Hollmann et al., "Accurate predictions on small data with a tabular foundation model" (*Nature*, January 2025), TabPFN v2.
- Bergstra and Bengio, "Random Search for Hyper-Parameter Optimization" (*JMLR*, 2012); [Optuna documentation](https://optuna.readthedocs.io/).
- Your *AI Journey* Parts 7, 8 and 8B (with Géron chapter and page references).
