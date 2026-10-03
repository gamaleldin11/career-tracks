# Part 15 — Statistics, Probability and A/B Testing for Data Science Interviews

<!-- nav -->
> [!example] 🧭 Step 7 of 26 · Stage 2 of 7: Data & statistics
> ← [Part 05 · Visualisation & EDA](05_Visualization_and_EDA.md) · [Part 06 · ML foundations](06_ML_Foundations.md) → · [Course map](00_START_HERE.md)
<!-- /nav -->

**Why this part exists:** Part 14 ranked *statistical inference* as a Tier-2 gap: *"there is no coverage of confidence intervals, hypothesis-testing logic, p-value interpretation, statistical power, or A/B testing. Data roles ask about all of these."* Géron's book is about ML, not inference, so this part is written from standard statistics references (Bruce & Bruce, *Practical Statistics for Data Scientists*; Kohavi, Tang & Xu, *Trustworthy Online Controlled Experiments*) and aimed at interview level.

Every entry-to-mid data science loop at a company like e& has at least one of: a stats round, an A/B-test case, or probability puzzles. This part covers all three.

<!-- interview-focus -->

> [!tip] 🎯 Interview focus
> **Why it matters:** Almost every loop has a stats round or an A/B-test case. For entry candidates it is often the deciding round.
>
> | Level | What you should be able to do |
> |---|---|
> | 🟢 **Entry** | Mean/median/variance, distributions, Bayes' rule, CLT, confidence intervals, p-values and Type I/II errors, choosing a basic test. |
> | 🟡 **Mid** | Design an A/B test end to end (metric, power, sample size, duration), pitfalls (peeking, SRM, novelty, multiple testing), Simpson's paradox. |
> | 🔴 **Senior** | Variance reduction (CUPED), sequential testing, network effects, causal inference when you can't randomise (DiD, synthetic control, uplift). |
>
> **⭐ Most-asked:** *Explain a p-value to a manager.* · *How do you choose the sample size for an A/B test?* · *What is statistical power?* · *Bayes: a 99%-accurate fraud test flags a customer — how likely is it fraud?* · *Correlation vs causation — give an example.*
>
> **⏱ Time:** 5 h  ·  **Short on time?** Read §15.3–15.5, §15.7, §15.10, §15.11.

**Legend:** 🟢 Entry (0–2 yrs) · 🟡 Mid (2–5 yrs) · 🔴 Senior / specialist · ⭐ frequently asked · 📖 Géron, *Hands-On ML with Scikit-Learn and PyTorch* (2025) pages

> [!abstract]- 🗺️ Section map — level and book pages
>
> | § | Section | Level | 📖 Book |
> |---|---|:---:|---|
> | 15.1 | Descriptive statistics — what to say precisely | 🟢 ⭐ | — |
> | 15.2 | Probability essentials | 🟢 ⭐ | — |
> | 15.3 | The Central Limit Theorem and sampling | 🟢 ⭐ | — |
> | 15.4 | Confidence intervals | 🟢 ⭐ | — |
> | 15.5 | Hypothesis testing — the logic | 🟢 ⭐ | — |
> | 15.6 | Which test? The decision table | 🟡 | — |
> | 15.7 | A/B testing end to end — the case study you will be given | 🟡 ⭐ | — |
> | 15.8 | Correlation, causation and the classic paradoxes | 🟢 ⭐ | — |
> | 15.9 | Statistics you need *for ML* specifically | 🟡 | Ch. 2 · p. 99 |
> | 15.10 | Probability and statistics puzzles — worked | 🟢 ⭐ | — |
> | 15.11 | Interview drill — statistics | 🟢 ⭐ | — |
>

---

## 15.1 Descriptive statistics — what to say precisely 🟢 ⭐

| Measure | Formula / meaning | Robust to outliers? | Note |
|---|---|---|---|
| Mean | Σx/n | ❌ | ARPU is a mean; a few enterprise accounts can drag it |
| Median | 50th percentile | ✅ | Report next to the mean for skewed data (income, data usage) |
| Mode | Most frequent value | ✅ | For categoricals |
| Variance | Σ(x − x̄)²/(n − 1) | ❌ | **n − 1 (Bessel's correction)** makes the *sample* variance unbiased |
| Standard deviation | √variance | ❌ | Same units as the data |
| IQR | Q3 − Q1 | ✅ | The basis of boxplot whiskers (1.5×IQR, Part 4 §4.4) |
| MAD | median(\|x − median\|) | ✅ | A robust σ ≈ 1.4826 × MAD |
| Skewness | Asymmetry | — | Right skew: mean > median (usage, revenue, call duration) |
| Kurtosis | Tail heaviness | — | Heavy tails: extreme values more frequent than the normal predicts |
| Coefficient of variation | σ/μ | — | Compares variability across different scales |

**Why n − 1?** The sample mean is computed from the same data, so deviations from x̄ are systematically smaller than deviations from the true μ. One degree of freedom is "used up". Dividing by n − 1 corrects that bias.

**Standard deviation vs standard error:** SD describes the spread of **individual observations**. **SE = SD/√n** describes the spread of **the sample mean** across repeated samples. It shrinks as n grows; the SD doesn't.

**Percentiles in business:** P50 and P90/P95/P99 latency and throughput are how network KPIs are reported. Averages hide the tail that users actually feel.

---

## 15.2 Probability essentials 🟢 ⭐

> [!quote] 💬 Say it in the interview
> “Bayes: P(A|B) = P(B|A)·P(A)/P(B). With rare events, even an accurate test produces mostly false positives — the base-rate trap.”

**Rules:**
- P(A or B) = P(A) + P(B) − P(A and B)
- P(A and B) = P(A)·P(B | A); = P(A)·P(B) **only if independent**
- Complement: P(at least one) = 1 − P(none)
- **Conditional probability:** P(A | B) = P(A ∩ B) / P(B)

**Bayes' theorem:**

> **P(A | B) = P(B | A) · P(A) / P(B)**,  with  P(B) = P(B|A)P(A) + P(B|¬A)P(¬A)

**The classic fraud/medical-test question.** A fraud detector flags 99% of fraudulent SIMs (sensitivity) and wrongly flags 2% of genuine ones (false-positive rate). 0.5% of SIMs are fraudulent. If a SIM is flagged, what is the probability it is really fraudulent?

```
P(F) = 0.005,  P(flag|F) = 0.99,  P(flag|¬F) = 0.02
P(flag) = 0.99·0.005 + 0.02·0.995 = 0.00495 + 0.0199 = 0.02485
P(F|flag) = 0.00495 / 0.02485 ≈ 0.199   →   only ~20%!
```

**The base rate dominates.** This is the same effect as low precision under class imbalance (Part 8 §8.12.5), and it is why flagged cases need human review before anyone's line is blocked.

**Expected value and variance of common distributions:**

| Distribution | Models | Mean | Variance | Telecom example |
|---|---|---|---|---|
| **Bernoulli(p)** | One yes/no | p | p(1−p) | Did this subscriber churn? |
| **Binomial(n, p)** | Count of successes in n trials | np | np(1−p) | Accepted offers out of 1,000 sent |
| **Poisson(λ)** | Count of events in an interval | λ | **λ** | Calls per minute at a cell; complaints per day |
| **Geometric(p)** | Trials until first success | 1/p | (1−p)/p² | Offers sent until the first acceptance |
| **Exponential(λ)** | Time between Poisson events | 1/λ | 1/λ² | Time between calls. **Memoryless** |
| **Normal(μ, σ²)** | Sums of many small effects | μ | σ² | Measurement noise; sample means (via the CLT) |
| **Log-normal** | Multiplicative effects | — | — | Revenue, session length, data usage |
| **Uniform(a, b)** | Equal likelihood | (a+b)/2 | (b−a)²/12 | Random assignment |
| **Power law / Pareto** | Heavy tails | — | Can be infinite | Géron's district population; top 1% of data users |

**Normal-distribution rules (68-95-99.7):** ±1σ holds ~68%, ±2σ ~95% (precisely ±1.96σ for 95%), ±3σ ~99.7%.

**Poisson ≈ Binomial** when n is large and p small (λ = np). **Poisson variance equals its mean.** If call counts show variance ≫ mean (**overdispersion**), use a negative-binomial model instead.

---

## 15.3 The Central Limit Theorem and sampling 🟢 ⭐

![The Central Limit Theorem: averages of skewed data still become Normal, with standard error σ/√n.](figures/fig15_clt.png)
*The Central Limit Theorem: averages of skewed data still become Normal, with standard error σ/√n.*

> [!quote] 💬 Say it in the interview
> “The CLT says means of large samples are approximately Normal with standard error σ/√n, whatever the population's shape. That's why t-tests and confidence intervals work on skewed business metrics.”

**CLT:** for independent samples from *any* distribution with finite variance, the **distribution of the sample mean** approaches **Normal(μ, σ²/n)** as n grows (n ≳ 30 for mild skew; much more for heavy-tailed data such as revenue).

**Why it matters:** it is why we can put confidence intervals on means and run t-tests and z-tests on skewed business metrics such as ARPU. It is the averages that are normal, not the underlying data.

**Law of Large Numbers:** the sample mean converges to the true mean as n → ∞. This is Géron's biased-coin argument for ensembles (Part 8B §8B.2).

**Sampling methods:**

| Method | How | When |
|---|---|---|
| Simple random | Every unit equally likely | Baseline |
| **Stratified** | Sample within strata proportionally | Guarantee representation (Géron's income_cat, Part 4 §4.10.3; governorates; pre/post-paid) |
| Cluster | Randomly select whole groups | Field surveys (pick 50 retail shops, survey everyone) |
| Systematic | Every k-th unit | Streams, logs |
| Convenience | Whoever is available | ⚠️ Biased: avoid for inference |

**Biases to name:** selection bias, **survivorship bias** (analysing only customers still active), **nonresponse bias** (Géron's *Literary Digest*), self-selection (opt-in surveys), and **look-ahead bias** (using future information).

---

## 15.4 Confidence intervals 🟢 ⭐

> [!quote] 💬 Say it in the interview
> “A 95% CI means that if we repeated the experiment many times, 95% of such intervals would contain the true value — not that there's a 95% chance this one does.”

A **95% confidence interval** is produced by a procedure that captures the true parameter in 95% of repeated samples.

⚠️ **Correct phrasing:** *"If we repeated this study many times, 95% of the intervals built this way would contain the true value."* It is **not** "there is a 95% probability that the true value is in this particular interval" (that is the Bayesian *credible interval* reading). Interviewers test this distinction.

**For a mean:** x̄ ± t* · s/√n (use t with n−1 df; for large n, t* ≈ 1.96). **For a proportion:** p̂ ± 1.96·√(p̂(1−p̂)/n). Use the Wilson interval for small n or p near 0 or 1.

```python
import numpy as np
from scipy import stats

# mean
x = np.array(arpu_sample)
ci = stats.t.interval(0.95, df=len(x) - 1, loc=x.mean(), scale=stats.sem(x))

# proportion (e.g. churn rate)
from statsmodels.stats.proportion import proportion_confint
low, high = proportion_confint(count=312, nobs=10_000, alpha=0.05, method="wilson")

# anything (median, RMSE, AUC): the BOOTSTRAP, as Géron uses for test RMSE (Part 6 §6.11)
boot = stats.bootstrap((x,), np.median, confidence_level=0.95, random_state=42)
boot.confidence_interval
```

**Width drivers:** the interval shrinks with **√n**. Quadrupling n halves the width. Higher confidence (99%) means a wider interval.

**The bootstrap:** resample the data *with replacement* many times, compute the statistic each time, and take the 2.5th and 97.5th percentiles. It is assumption-light and works for any statistic. It is the same resampling idea as bagging (Part 8B §8B.4).

---

## 15.5 Hypothesis testing — the logic 🟢 ⭐

![α, β and power on one picture.](figures/fig15_hypothesis_power.png)
*α, β and power on one picture.*

> [!quote] 💬 Say it in the interview
> “A p-value is the probability of data at least this extreme *if the null hypothesis were true*. It is not the probability that the null is true, and it says nothing about effect size.”

1. **H₀ (null):** no effect or no difference (e.g. the new retention offer does not change the churn rate).
2. **H₁ (alternative):** there is an effect (two-sided ≠, or one-sided > / <).
3. Choose **α** (significance level, usually 0.05) **before** looking at the data.
4. Compute a **test statistic** and its **p-value**.
5. If p < α, **reject H₀**. Otherwise **fail to reject** it. Never say "accept H₀": absence of evidence is not evidence of absence.

**p-value:** *the probability, assuming H₀ is true, of observing a result at least as extreme as the one observed.*

What the p-value is **not**:
- ❌ The probability that H₀ is true.
- ❌ The probability that the result is due to chance.
- ❌ A measure of effect size or importance. With n = 10 million, a 0.01% difference can have p < 0.001 and be commercially meaningless.

**Errors:**

|  | H₀ true | H₀ false |
|---|---|---|
| Reject H₀ | **Type I error** (false positive), probability **α** | Correct: **power = 1 − β** |
| Fail to reject | Correct | **Type II error** (false negative), probability **β** |

This is the confusion matrix again (Part 6 §6.6): α plays the role of the false-positive rate and power plays the role of recall.

**Power** depends on:
1. **Effect size**: bigger effects are easier to detect.
2. **Sample size**: more data, more power.
3. **Variance**: noisier metrics need more data.
4. **α**: a looser α gives more power and more false positives.

The convention is power = 0.8, α = 0.05.

---

## 15.6 Which test? The decision table 🟡

| Question | Data | Test | Python |
|---|---|---|---|
| Is a mean different from a value? | 1 numeric sample | One-sample t-test | `stats.ttest_1samp` |
| Do two groups' means differ? | 2 independent numeric samples | **Welch's t-test** (don't assume equal variances) | `stats.ttest_ind(a, b, equal_var=False)` |
| Before/after on the same units? | Paired numeric | Paired t-test | `stats.ttest_rel` |
| Two means, non-normal and small, or heavy outliers? | 2 samples | **Mann-Whitney U** (rank-based) | `stats.mannwhitneyu` |
| Two proportions differ? (conversion, churn) | 2 × binary | **Two-proportion z-test** or χ² | `statsmodels…proportions_ztest` |
| Are two categoricals associated? | Contingency table | **χ² test of independence** (Fisher's exact if counts < 5) | `stats.chi2_contingency` |
| Do 3+ group means differ? | k numeric groups | **One-way ANOVA** (then Tukey HSD post-hoc) | `stats.f_oneway` |
| 3+ groups, non-normal? | k samples | Kruskal-Wallis | `stats.kruskal` |
| Is a distribution normal? | 1 sample | Shapiro-Wilk (small n), Q-Q plot | `stats.shapiro` |
| Did a feature's distribution drift? | 2 samples | **Kolmogorov-Smirnov**; PSI | `stats.ks_2samp` |
| Linear association? | 2 numeric | Pearson r (test r = 0); Spearman ρ for monotonic | `stats.pearsonr`, `stats.spearmanr` |

The capstone (Part 13 §13.6) used χ² and ANOVA. This table puts them in context.

```python
from scipy import stats
from statsmodels.stats.proportion import proportions_ztest

# churn: control 412/10,000 vs treatment 356/10,000
z, p = proportions_ztest(count=[356, 412], nobs=[10_000, 10_000])

# ARPU difference (skewed → Welch, or Mann-Whitney / bootstrap)
t, p = stats.ttest_ind(arpu_treat, arpu_ctrl, equal_var=False)

# plan type × churned
chi2, p, dof, expected = stats.chi2_contingency(pd.crosstab(df.plan_type, df.churned))
```

**Parametric vs non-parametric:** parametric tests (t, ANOVA) assume a distributional form and are more powerful when that assumption holds. Non-parametric tests (Mann-Whitney, Kruskal-Wallis) are rank-based and robust, but they test a slightly different hypothesis (stochastic ordering or medians, not means).

---

## 15.7 A/B testing end to end — the case study you will be given 🟡 ⭐

![The seven steps of an A/B test.](figures/fig15_ab_test_flow.png)
*The seven steps of an A/B test.*

> [!quote] 💬 Say it in the interview
> “An A/B test: one primary metric, guardrails, randomisation unit, power analysis for the sample size, a fixed duration with no peeking, an SRM check, then a decision on practical as well as statistical significance.”

**The scenario** (typical e& case): *"Marketing wants to launch a new in-app bundle recommendation for pre-paid users. How would you test whether it works?"*

### Step 1 — Clarify the goal and choose metrics

- **Primary (decision) metric:** one metric, decided in advance. For example, the **bundle purchase rate per user over 14 days**, or ARPU.
- **Secondary metrics:** revenue per user, recharge frequency, app sessions.
- **Guardrail metrics:** must *not* get worse. Churn, complaint rate, app crash rate, page latency, unsubscribe rate.
- The metric should be **sensitive** (it moves when the product changes), **timely** (measurable within the test window), and **aligned** with long-term value. A metric that can be gamed (clicks) is weaker than one tied to value (purchases, retained revenue).

### Step 2 — Randomisation unit and population

- **Unit:** usually the **user** (MSISDN / account), not the session. Otherwise the same person sees both versions.
- **Randomise with a hash** of user_id + experiment_id, the same stable-hash idea as Géron's test-set split (Part 4 §4.10.2), so assignment is sticky and reproducible.
- **Population:** eligible active pre-paid app users. Trigger only users who would actually see the feature, to avoid diluting the effect.

### Step 3 — Hypotheses and parameters

- H₀: p_treatment = p_control. H₁: p_treatment ≠ p_control (two-sided is standard).
- α = 0.05, power = 0.80.
- **Baseline** p₀ (from historical data), e.g. a 5% purchase rate.
- **MDE (minimum detectable effect):** the smallest effect worth detecting, set by the business. For example, +0.5 percentage points absolute (a 10% relative lift). **The MDE is a business decision, not a statistical one.**

### Step 4 — Sample size

For two proportions (per group):

> **n ≈ (z₁₋α/₂ + z₁₋β)² · [p₁(1−p₁) + p₂(1−p₂)] / (p₁ − p₂)²**

With z₀.₉₇₅ = 1.96 and z₀.₈₀ = 0.84, so (1.96 + 0.84)² ≈ 7.84.

**Worked:** p₁ = 0.05, p₂ = 0.055 → numerator 7.84 × (0.0475 + 0.051975) ≈ 0.780; denominator 0.005² = 0.000025 → **n ≈ 31,200 per group.**

Rule of thumb (Lehr): **n ≈ 16·σ²/δ²** per group for 80% power at α = 0.05. For proportions σ² = p(1−p): 16 × 0.0475 / 0.000025 ≈ 30,400. The same ballpark.

```python
from statsmodels.stats.power import NormalIndPower
from statsmodels.stats.proportion import proportion_effectsize

es = proportion_effectsize(0.055, 0.05)                  # Cohen's h
n = NormalIndPower().solve_power(effect_size=es, alpha=0.05, power=0.8,
                                 alternative="two-sided")
# ≈ 31,000 per group
```

**Implications to say out loud:**
- Halving the MDE **quadruples** n.
- **Duration** = n per group × number of groups / daily eligible traffic. Round **up to whole weeks** (at least 1–2 full weeks) to cover day-of-week effects (weekend and Friday behaviour in Egypt differs) and pay-day cycles (usually the start of the month).
- **Variance reduction** shrinks n: **CUPED** (regress out each user's pre-experiment value of the metric), stratification, or a less noisy metric (trimmed or capped revenue).

### Step 5 — Run it properly

- **Sanity-check the split first. Sample Ratio Mismatch (SRM):** with a 50/50 design, test whether the observed counts are consistent with 50/50 (χ² goodness of fit). An SRM (e.g. 50,000 vs 48,700, p < 0.001) means assignment or logging is broken, and **the results are untrustworthy.** Do not analyse further until it is fixed.
- **A/A test** (both groups get control) beforehand validates the pipeline. It should show "no difference" about 95% of the time.
- **No peeking.** Checking p-values daily and stopping at the first p < 0.05 inflates the false-positive rate far above 5%. Either fix the duration up front, or use **sequential testing** (alpha spending such as O'Brien-Fleming, or always-valid p-values) or a Bayesian approach designed for continuous monitoring.

### Step 6 — Analyse

```python
import numpy as np
from statsmodels.stats.proportion import proportions_ztest, confint_proportions_2indep

conv = np.array([1_720, 1_560])       # treatment, control purchases
n    = np.array([31_500, 31_400])
z, p = proportions_ztest(conv, n)
low, high = confint_proportions_2indep(conv[0], n[0], conv[1], n[1], compare="diff")
lift = conv[0]/n[0] - conv[1]/n[1]    # absolute lift in purchase rate
```

**Report effect size + CI + p-value**, not just a p-value: *"+0.49 pp purchase rate (95% CI +0.14 to +0.84 pp), p = 0.006; relative lift 9.9%; guardrails flat."*

**Statistical vs practical significance:** is the lower bound of the CI still worth the cost of launching and maintaining the feature?

### Step 7 — Pitfalls interviewers probe

| Pitfall | What happens | Mitigation |
|---|---|---|
| **Peeking / optional stopping** | Inflated Type I error | Fixed horizon or sequential methods |
| **Multiple testing** | 20 metrics at α = 0.05 give ~64% chance of at least one false positive (1 − 0.95²⁰) | One primary metric; **Bonferroni** (α/m) or **Benjamini-Hochberg** (FDR) for the rest |
| **Novelty / primacy effects** | Early lift from curiosity (or early dip from change aversion) fades | Run longer; look at the effect over time and on new vs existing users |
| **Network effects / interference** | Treated users affect control users (referral schemes, on-net call pricing, "family bundles") | **Cluster randomisation** (by household, geography or cell region) |
| **SRM** | Broken randomisation | Always check; don't analyse broken tests |
| **Simpson's paradox** | The aggregate effect reverses within segments (mix shift) | Analyse by pre-registered segments; keep randomisation balanced |
| **Seasonality / external events** | Ramadan, Eid, exam season, pay day, the football league | Full-week cycles; avoid launching into unusual periods; concurrent control |
| **Heavy-tailed revenue** | A few whales swing the means | Winsorise/cap, log-transform, Mann-Whitney, bootstrap CIs |
| **Wrong unit of analysis** | Randomise by user but analyse by session: sessions aren't independent, so p-values are too small | Analyse at the randomisation unit, or use the delta method / clustered SEs |
| **Survivorship** | Measuring only users still active at the end | Intention-to-treat on everyone assigned |
| **Long-term effects** | A discount raises revenue now but trains customers to wait for discounts | Holdout groups kept for months; measure 90-day retention |

### When you *can't* randomise

A regulator requirement, or a nationwide network upgrade. Use **quasi-experiments**:
- **Difference-in-differences:** compare the change in a treated region with the change in a similar untreated region. Assumes parallel trends.
- **Synthetic control:** build a weighted combination of untreated regions that matches the treated one before the change.
- **Regression discontinuity:** users just above and below an eligibility threshold.
- **Propensity-score matching:** match treated and untreated users on their likelihood of treatment.
- **Interrupted time series.**

This is the causal-inference gap from Part 14 (Tier 3, #13). At interview level, knowing these names and their assumptions is enough.

---

## 15.8 Correlation, causation and the classic paradoxes 🟢 ⭐

> [!quote] 💬 Say it in the interview
> “Correlation isn't causation: confounders, reverse causality and selection bias. Simpson's paradox shows an aggregate trend can reverse inside every segment.”

- **Correlation ≠ causation.** Confounders: ice-cream sales and drowning (summer). In telecom, customers who call customer care more also churn more. Calling care doesn't cause churn; network problems cause both.
- **Simpson's paradox.** A treatment looks better in every subgroup but worse overall (or the reverse), because group sizes differ. Classic telecom version: the new plan shows higher churn overall only because it was sold mostly in a region with poor coverage.
- **Regression to the mean.** Cells picked *because* they had the worst drop rate last week will look better this week even without intervention. Always keep a control group.
- **Berkson's paradox (selection).** Among hired candidates, interview score and experience look negatively correlated, because you only see those who passed a combined threshold.
- **Ecological fallacy.** Governorate-level correlations do not apply to individuals.
- **Survivorship bias.** "Our loyal 10-year customers love feature X". The unhappy ones already left.

---

## 15.9 Statistics you need *for ML* specifically 🟡

> [!info] 📖 Géron Ch. 2 · bootstrap confidence interval for the test RMSE · p. 99

- **Likelihood vs probability, MLE and MAP:** Part 9 §9.19. **Ridge = MAP with a Gaussian prior; Lasso = MAP with a Laplace prior.**
- **Log-loss = the negative Bernoulli log-likelihood:** Part 8 §8.13.
- **Bias-variance decomposition:** Part 6 §6.4, Part 7 §7.16.
- **Information criteria (AIC/BIC):** Part 9 §9.19.
- **Entropy, cross-entropy, KL divergence:** Part 8 §8.13, Part 8B §8B.1.
- **Distribution drift tests:** KS test, χ² on categorical frequencies, **Population Stability Index (PSI)**. PSI = Σ (actualᵢ − expectedᵢ)·ln(actualᵢ/expectedᵢ) over bins. **< 0.1 stable, 0.1–0.25 moderate shift, > 0.25 significant shift.** PSI is standard in credit and telecom model monitoring.
- **Comparing two models statistically:** paired tests on the same CV folds (e.g. the **5×2cv paired t-test**), **McNemar's test** on paired classification errors on the same test set, or bootstrap CIs of the metric difference.
- **Heteroscedasticity, multicollinearity (VIF), residual normality:** Part 7 §7.8 and §7.19.

---

## 15.10 Probability and statistics puzzles — worked 🟢 ⭐

**1. Two dice: P(sum = 7)?** 6/36 = **1/6**.

**2. At least one six in 4 rolls?** 1 − (5/6)⁴ ≈ **0.518**.

**3. Birthday problem: 23 people, P(shared birthday)?** 1 − ∏(365−k)/365 for k = 0..22 ≈ **0.507**.

**4. A family has two children, at least one a boy. P(both boys)?** Sample space {BB, BG, GB} → **1/3**. (If you know the *eldest* is a boy: 1/2.)

**5. Monty Hall. Switch?** Yes. Switching wins **2/3** of the time, because the host's reveal carries information.

**6. A test is 95% accurate and the disease prevalence is 1%. P(disease | positive)?** (0.95·0.01) / (0.95·0.01 + 0.05·0.99) = 0.0095/0.059 ≈ **16%**. Base rates again.

**7. Expected number of rolls to get a 6?** Geometric: **6**.

**8. You flip a fair coin 10 times and get 10 heads. P(next is heads)?** **0.5**. Independence; the gambler's fallacy.

**9. A churn rate of 3% per month, constant: P(a customer survives 12 months)?** 0.97¹² ≈ **0.694**. Expected lifetime ≈ 1/0.03 ≈ **33 months**. **This is the basis of CLV:** CLV ≈ monthly margin × (retention / (1 + discount − retention)), or ≈ margin/churn without discounting.

**10. A/B test with 10 variants at α = 0.05 each. P(at least one false positive if none work)?** 1 − 0.95¹⁰ ≈ **40%**. Correct with Bonferroni (0.005 each) or BH.

**11. Estimate the number of smartphones sold in Egypt per year (a Fermi problem).** Population ~107M → mobile subscriptions ~100M+ → smartphone share ~75% → about 75M smartphones in use → replacement cycle ~3 years → **~25M/year**. What is graded is the structure and the stated assumptions, not the exact number.

**12. The mean of a sample of 100 is 50 with SD 10. 95% CI?** 50 ± 1.96 × 10/√100 = **50 ± 1.96 → [48.04, 51.96]**.

**13. How does the CI change if n goes from 100 to 400?** The width **halves** (√4 = 2).

**14. You measure ARPU weekly and it jumped 8%. Real?** Check the week's variability (the SE of weekly ARPU), seasonality (same week last year, pay-day timing), composition change (new customers, a price change, a promo), data or pipeline changes, and outliers. Then test.

---

> [!check] ✅ Key takeaways
> - Know mean vs median, variance, and when each summary misleads.
> - Bayes' rule and the base-rate trap: rare events → most positives are false positives.
> - CLT: sample means are ~Normal with SE = σ/√n — the basis of CIs and tests.
> - A p-value is P(data this extreme | H₀), not P(H₀ | data); report effect size and a CI.
> - A/B tests: one primary metric, guardrails, a power-based sample size, no peeking, an SRM check.
> - Correlation ≠ causation; watch for confounders and Simpson's paradox.

## 15.11 Interview drill — statistics 🟢 ⭐

**Q1. Explain a p-value to a marketing manager.** "If the offer really had no effect, a difference this big or bigger would show up only 2% of the time by chance. That makes 'no effect' hard to believe."

**Q2. Type I vs Type II error, with a telecom example?** Type I: we conclude the new retention offer works when it doesn't, and waste the budget rolling it out. Type II: we miss an offer that does work and lose the saved customers.

**Q3. How do you pick the sample size for an A/B test?** From the baseline rate, the MDE (a business input), α, power and the metric's variance, using the power formula or `statsmodels.stats.power`. Then convert to duration using eligible daily traffic, rounded up to whole weeks.

**Q4. Your test shows p = 0.04 on the 3rd day. Stop and launch?** No. That is peeking. Stick to the planned sample size or duration, or use a sequential design. Also check guardrails, SRM and novelty effects.

**Q5. Your A/B test's groups are 52%/48% instead of 50/50. What do you do?** Run a χ² SRM test. If it is significant, stop: randomisation or logging is broken (bot filtering, a redirect bug, app-version eligibility). Don't interpret the metric.

**Q6. The treatment improved the overall conversion rate but lowered it in every region. How?** Simpson's paradox: the treatment group had a different regional mix. Check the randomisation and analyse stratified by region.

**Q7. When would you use Mann-Whitney instead of a t-test?** Small samples from clearly non-normal or heavy-tailed data (revenue with whales), or ordinal data. With large samples the t-test on means is usually fine because of the CLT, but consider trimming or a bootstrap.

**Q8. What is the CLT and why do we care?** The distribution of the sample mean tends to normal as n grows, whatever the population's distribution. It justifies CIs and z/t-tests on means of skewed metrics.

**Q9. Correlation between complaints and churn is 0.4. Should we reduce complaints to reduce churn?** Not necessarily. There may be confounders (network quality, billing errors). Test causally: an experiment on complaint-resolution speed, or a quasi-experiment.

**Q10. How would you measure the impact of a network upgrade in Alexandria when you can't A/B test it?** Difference-in-differences against comparable untreated regions, checking pre-trend parallelism, or synthetic control. Use KPIs such as data usage per user, churn and NPS.

**Q11. Bayesian vs frequentist A/B testing?** Frequentist: fixed α, p-values, no probability statements about the hypothesis. Bayesian: a prior plus data gives a posterior, from which you can state "P(B > A) = 97%" and an expected loss. It is more intuitive for stakeholders, but the priors must be justified.

**Q12. What is statistical power and how do you increase it?** The probability of detecting a real effect of the MDE size. Increase it with more samples, lower-variance metrics (CUPED, trimming), a larger true effect (bolder treatment), or a larger α (with more false positives as the cost).

**Q13. How do you check that a feature's distribution in production matches training?** PSI or the KS test per feature over time, plus missing-rate and new-category checks. These are Géron's input monitoring (Part 6 §6.11) made quantitative.

---

## Further reading

- **Practical Statistics for Data Scientists**, Bruce, Bruce & Gedeck (O'Reilly, 2nd ed.) — the most direct book for this part; Python code throughout.
- **Trustworthy Online Controlled Experiments**, Kohavi, Tang & Xu (Cambridge, 2020) — the A/B testing bible, from Microsoft/Google/LinkedIn practice. The chapters on Twyman's law, the statistics behind experiments, and sample ratio mismatch are essential.
- **Udacity: A/B Testing by Google** (free course) — the classic interview-prep course.
- **Seeing Theory** — https://seeing-theory.brown.edu/ — interactive probability and statistics visualisations.
- **StatQuest** — p-values, power, t-tests, the CLT, bootstrapping.
- **Evan Miller's A/B tools** — https://www.evanmiller.org/ab-testing/ — sample-size calculator and the classic "How Not To Run an A/B Test" essay on peeking.
- **Causal Inference: The Mixtape**, Scott Cunningham (free online) — DiD, synthetic control, RD when you are ready.

---

<!-- nav -->
> [!example] 🧭 Step 7 of 26 · Stage 2 of 7: Data & statistics
> ← [Part 05 · Visualisation & EDA](05_Visualization_and_EDA.md) · [Part 06 · ML foundations](06_ML_Foundations.md) → · [Course map](00_START_HERE.md)
<!-- /nav -->
