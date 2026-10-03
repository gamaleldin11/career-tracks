# Statistics and A/B Testing — What Analysts and Data Scientists Get Asked

Statistics questions in Egyptian analyst and data-scientist interviews are mostly about **interpretation**: what a p-value means, whether a difference is real, whether an experiment was run properly. You won't be asked to derive formulas. You will be asked to explain them to a product manager, the "Bob" from the recruiter videos. Your *AI Journey* Part 15 goes deeper on the theory; this module is the interview-ready core shared by the analyst and data-scientist tracks.

> [!focus]
> **Entry must:** choose mean vs median; explain standard deviation, percentiles and outliers; state Bayes' rule and use it; explain the central limit theorem, confidence intervals and p-values **correctly**; know type I and II errors; design a basic A/B test.
> **Mid adds:** sample size and power, the right test for the data, sample-ratio mismatch, peeking, multiple comparisons, Simpson's paradox, guardrail metrics.
> **Most asked:** *What is a p-value?* · *Explain a confidence interval to a manager* · *How long should this A/B test run?* · *Correlation vs causation* · *Mean or median for salaries?* · *The test is significant but the effect is tiny. Ship it?*
> **Time budget:** 4 hours.

## S6.1 Describing data 🟢 ⭐

| Measure | What it tells you | Sensitive to outliers? |
|---|---|---|
| **Mean** | Arithmetic average | Very |
| **Median** | Middle value (50th percentile) | No |
| **Mode** | Most frequent value | No |
| **Variance** | Average squared distance from the mean | Very |
| **Standard deviation (SD)** | Square root of variance, in the data's own units | Very |
| **Percentiles** (p25, p75, p95) | The value below which that share of data falls | No |
| **IQR** | p75 − p25, the spread of the middle half | No |

**Skew.** Money data (salaries, order values, revenue per user) is usually **right-skewed**: most values are small and a few are huge. Then **mean > median**, and the median describes the "typical" user better. Report both when they differ much.

> [!term] Outlier
> A value far from the rest. A common rule flags values below p25 − 1.5·IQR or above p75 + 1.5·IQR (the box-plot whiskers). An outlier is a question, not an error: is it a data-entry bug, fraud, or your best customer?

> [!say]
> "For salaries or order values I'd report the median, because the data is right-skewed and a few large values pull the mean up. I'd show the p25 to p75 range as the spread, and look at the extreme values separately rather than deleting them."

## S6.2 Distributions you should recognise 🟢

| Distribution | Models | Example | Key fact |
|---|---|---|---|
| **Normal** | Sums of many small effects | Heights, measurement error, sample means | ≈68% within 1 SD, 95% within 1.96 SD, 99.7% within 3 SD |
| **Binomial** | Number of successes in *n* yes/no trials | Conversions out of 1,000 visitors | Mean *np*, variance *np(1−p)* |
| **Bernoulli** | One yes/no trial | Did this user convert? | Variance *p(1−p)*, largest at p = 0.5 |
| **Poisson** | Counts of events in a fixed interval | Support tickets per hour | Mean = variance = λ |
| **Exponential** | Time between Poisson events | Minutes between tickets | Memoryless |
| **Uniform** | Every value equally likely | A random number generator | — |
| **Log-normal / long-tailed** | Multiplicative effects | Revenue per user, file sizes | Analyse the log, or use medians |

## S6.3 Probability and Bayes 🟢 ⭐

- **Conditional probability:** P(A | B) = P(A and B) / P(B).
- **Independence:** P(A and B) = P(A) · P(B), only if knowing one tells you nothing about the other.
- **Bayes' rule:** P(A | B) = P(B | A) · P(A) / P(B).

**The classic question.** A fraud model flags 99% of fraudulent transactions and wrongly flags 2% of genuine ones. 0.5% of transactions are fraud. A transaction is flagged: how likely is it to be fraud?

Think in counts of 100,000 transactions:

| | Fraud (500) | Genuine (99,500) |
|---|---|---|
| Flagged | 495 | 1,990 |
| Not flagged | 5 | 97,510 |

P(fraud | flagged) = 495 / (495 + 1,990) ≈ **20%**. Even an accurate test produces mostly false alarms when the thing is rare. This is **base-rate neglect**, and it's why precision matters in fraud and medical models ([[DS4]]).

> [!say]
> "Bayes says the chance something is true after a positive result depends heavily on how common it was to begin with. With 0.5% fraud and a 2% false-positive rate, only about one in five flagged transactions is actually fraud, so we'd tune the threshold and add a second check."

## S6.4 Samples, the central limit theorem and standard error 🟢 ⭐

We almost never see the whole population, only a **sample**, and we estimate from it.

> [!term] Central limit theorem (CLT)
> For a large enough sample, the **mean of the sample** is approximately normally distributed around the true mean, whatever the shape of the original data (as long as its variance is finite). That's why normal-based confidence intervals and tests work on skewed data like revenue, given enough data.

> [!term] Standard error (SE)
> How much the sample mean would vary from sample to sample: SE = SD / √n. Quadrupling the sample size halves the standard error. That square root is why precise experiments need many users.

For a proportion *p* (a conversion rate), SE = √(p(1−p)/n).

## S6.5 Confidence intervals 🟢 ⭐

A 95% confidence interval for a mean is roughly **estimate ± 1.96 × SE**.

Example: 2,000 visitors, 240 conversions. p̂ = 12%. SE = √(0.12 × 0.88 / 2000) ≈ 0.73 percentage points. 95% CI ≈ 12% ± 1.4 pp = **10.6% to 13.4%**.

**What it means (precisely):** if we repeated the sampling many times and built an interval each time, about 95% of those intervals would contain the true value. **What it doesn't mean:** "there's a 95% probability the true value is in *this* interval". In the frequentist view the true value is fixed, and this interval either contains it or not. (A Bayesian **credible interval** does have that probability reading.)

> [!say]
> "Our conversion rate is 12%, and the 95% confidence interval is about 10.6 to 13.4%. In plain terms, the true rate is very plausibly in that range. If we need a narrower range, we need more traffic; four times the users would halve the width."

## S6.6 Hypothesis testing and the p-value 🟢 ⭐

1. **Null hypothesis H₀**: no difference (the new checkout converts the same as the old).
2. **Alternative H₁**: there is a difference.
3. Choose a **significance level α** before looking, usually 0.05.
4. Compute a test statistic and its **p-value**.
5. If p < α, **reject H₀**; otherwise you **fail to reject** it (which is not the same as proving no difference).

> [!term] p-value
> The probability of seeing a result **at least as extreme** as the one observed, **assuming the null hypothesis is true**. A small p-value says "this data would be surprising if there were no effect". It is **not** the probability that the null is true, and it says nothing about how big or important the effect is.

| | H₀ actually true | H₀ actually false |
|---|---|---|
| **Reject H₀** | **Type I error** (false positive), probability α | Correct: probability = **power** (1 − β) |
| **Fail to reject** | Correct | **Type II error** (false negative), probability β |

> [!mistake] Three classic misreadings
> - "p = 0.03 means a 3% chance the result is due to luck." No: it's the probability of data this extreme *if* there were no effect.
> - "p = 0.20, so there's no effect." No: the test may just lack power. Look at the confidence interval.
> - "p = 0.0001, so it's a huge effect." No: with millions of users, tiny effects become significant. Report the **effect size** with its CI.

> [!say]
> "The p-value is how surprising our data would be if there were really no difference. Below 5% we treat the difference as real. But I always report the effect size and its confidence interval too, because a statistically significant difference can be too small to matter for the business."

## S6.7 Which test? 🟢 🟡

| Question | Data | Test |
|---|---|---|
| Do two groups' means differ? | Continuous, independent groups | **Welch's t-test** (doesn't assume equal variances; a safe default) |
| Same users before and after? | Continuous, paired | Paired t-test |
| Do two conversion rates differ? | Proportions, large n | Two-proportion **z-test** (or chi-square, equivalent for 2×2) |
| Are two categorical variables related? | Counts in a table | **Chi-square test of independence** (Fisher's exact test for small counts) |
| Do 3+ groups' means differ? | Continuous | **ANOVA** (then post-hoc tests for which pairs) |
| Two groups, heavy skew or outliers, ordinal data | Not normal | **Mann–Whitney U** (rank-based) |
| Is there a linear relationship? | Two continuous variables | Pearson correlation; **Spearman** for monotonic or ranked |

```python
from scipy import stats
from statsmodels.stats.proportion import proportions_ztest

# Welch's t-test on order values
t, p = stats.ttest_ind(new_checkout_values, old_checkout_values, equal_var=False)

# Conversion: 260/2000 vs 240/2000
z, p = proportions_ztest(count=[260, 240], nobs=[2000, 2000])

# Chi-square: plan type vs churned
chi2, p, dof, expected = stats.chi2_contingency(contingency_table)
```

> [!story]
> Your road-accident capstone used **chi-square** tests between categorical features and severity, **ANOVA** for numeric features across severity classes, and **VIF** for multicollinearity. That's the answer to "have you used statistical tests on real data?". Say which test, on which variables, and what you did with the result.

## S6.8 Correlation, causation and paradoxes 🟢 ⭐

**Correlation does not imply causation.** Ice-cream sales and drownings both rise in summer; the **confounder** is temperature. In business data, confounders are everywhere: heavy users both see more features *and* churn less.

Ways to get closer to causation: a **randomised experiment** (A/B test) is the gold standard; otherwise quasi-experimental methods ([[DS5]]).

> [!term] Simpson's paradox
> A trend that appears in every subgroup reverses when the groups are combined, because the groups have different sizes or mixes. Example: a new support process resolves more tickets in time for both "simple" and "complex" tickets, yet looks worse overall, because it was given a much higher share of complex tickets. Always ask how the mix differs between groups.

> [!term] Survivorship bias
> Drawing conclusions only from what "survived". Analysing only customers still active today hides why the others left.

## S6.9 A/B testing from start to finish 🟢 🟡 ⭐

<figure class="dia"><svg viewBox="0 0 720 120" role="img" aria-label="A/B testing steps: hypothesis, metrics, sample size, randomise, run, check, analyse, decide">
<g class="sT" text-anchor="middle">
<rect class="sA" x="10" y="30" width="80" height="54" rx="8"/><text x="50" y="62">Hypothesis</text>
<rect class="sA" x="100" y="30" width="80" height="54" rx="8"/><text x="140" y="62">Metrics</text>
<rect class="sA" x="190" y="30" width="80" height="54" rx="8"/><text x="230" y="55">Sample</text><text x="230" y="72">size</text>
<rect class="sB" x="280" y="30" width="80" height="54" rx="8"/><text x="320" y="62">Randomise</text>
<rect class="sB" x="370" y="30" width="80" height="54" rx="8"/><text x="410" y="55">Run full</text><text x="410" y="72">weeks</text>
<rect class="sW" x="460" y="30" width="80" height="54" rx="8"/><text x="500" y="55">Sanity</text><text x="500" y="72">checks</text>
<rect class="sG" x="550" y="30" width="80" height="54" rx="8"/><text x="590" y="62">Analyse</text>
<rect class="sG" x="640" y="30" width="70" height="54" rx="8"/><text x="675" y="62">Decide</text>
</g>
<text class="sS" x="10" y="110">Everything left of "Randomise" is decided before any data is collected.</text>
</svg><figcaption>The steps of a trustworthy experiment. The left half is planned before launch; peeking and changing plans midway is the most common way experiments go wrong.</figcaption></figure>

**1. Hypothesis.** "Showing delivery fees on the product page (instead of at checkout) will **increase completed orders**, because fewer people abandon at the surprise."

**2. Metrics.**
- **Primary metric**: the one that decides the outcome (orders per visitor).
- **Guardrail metrics**: things that must not get worse (revenue per visitor, page load time, refund rate).
- **Secondary or diagnostic metrics**: help explain *why* (add-to-cart rate, checkout abandonment).

**3. Randomisation unit.** Usually the **user** (so one person always sees the same version), not the page view. Assignment must be random and sticky.

**4. Sample size and duration.** Decide the **minimum detectable effect (MDE)**, the smallest lift worth detecting, then compute the users needed. A good approximation for α = 0.05 (two-sided) and 80% power:

<p class="formula"><b>n per group ≈ 16 · σ² / δ²</b> &nbsp;where σ² is the metric's variance and δ the minimum detectable effect</p>

For a conversion rate, σ² = p(1−p). With a baseline of 10% and an MDE of 1 percentage point: 16 × 0.09 / 0.01² = **14,400 users per group**. Halving the MDE quadruples the sample. Then:

- run for **whole weeks** (at least one, usually two), because behaviour differs between days, and Egyptian traffic patterns around Friday and the weekend can differ sharply from weekdays;
- don't run over unusual periods (Ramadan, Black Friday or White Friday sales, exam season) unless that's what you're testing.

```python
from statsmodels.stats.power import NormalIndPower
from statsmodels.stats.proportion import proportion_effectsize
effect = proportion_effectsize(0.11, 0.10)          # Cohen's h for 10% → 11%
n = NormalIndPower().solve_power(effect, alpha=0.05, power=0.8, alternative="two-sided")
print(round(n))                                     # ≈ 14,700 per group
```

(The library's answer is slightly higher than the rule of thumb because it uses the exact variance; both are fine to quote.)

**5. Sanity checks before reading results.**
- **Sample ratio mismatch (SRM):** a 50/50 split that came out 50.8/49.2 on 200,000 users is a chi-square red flag. Something in assignment or logging is broken, and the results can't be trusted.
- Invariant metrics (the share of mobile users, for example) should match between groups.

**6. Analyse:** the effect, its confidence interval and its p-value for the primary metric; then the guardrails; then the segments you **planned** to look at.

**7. Decide:** ship, don't ship, or iterate. Write down the decision and why.

### The pitfalls interviewers probe

| Pitfall | What goes wrong | Fix |
|---|---|---|
| **Peeking** | Checking daily and stopping the first time p < 0.05 inflates false positives well above 5% | Fix the sample size in advance, or use a sequential testing method designed for continuous monitoring |
| **Multiple comparisons** | Test 20 metrics or segments and one will be "significant" by chance | Pre-register the primary metric; correct with Bonferroni (α/k) or control the false discovery rate (Benjamini–Hochberg) |
| **Novelty / primacy effects** | Users click something new because it's new, or resist change at first | Run longer; look at the effect over time and for new vs returning users |
| **Network effects / interference** | Treated users affect control users (a marketplace, a referral feature) | Randomise by cluster: region, city or time |
| **Underpowered test** | "No significant difference" from too few users | Size the test first; report the CI, which shows what effects are still plausible |
| **Wrong unit of analysis** | Randomise by user but analyse per page view, so the observations aren't independent | Analyse at the randomisation unit, or use corrected (delta-method) variance |

> [!say]
> "Before launching I'd fix one primary metric and some guardrails, pick the user as the randomisation unit, and compute the sample size from the smallest lift worth detecting. I'd run whole weeks, check for sample ratio mismatch first, and not stop early just because it looks significant. Then I'd report the lift with its confidence interval, not just the p-value."

> [!sota] Variance reduction
> Large experimentation teams use **CUPED** (controlled-experiment using pre-experiment data), which adjusts each user's metric by their pre-experiment behaviour. It cuts variance and therefore the required sample size substantially. Knowing the name and the idea is a strong mid-level signal; it's covered in [[DS5]].

## S6.10 "Significant but tiny. Do we ship?" 🟡 ⭐

Statistical significance answers "is it real?"; **practical significance** answers "does it matter?". Weigh the effect and its CI against the cost: engineering maintenance, the risk to guardrails, and whether the CI's *lower* bound still beats the cost. A 0.1% lift on a checkout for millions of users can be worth a lot; the same lift on an internal tool is noise.

## S6.11 Interview drill 🟢 ⭐

| Question | Strong short answer |
|---|---|
| Mean or median for salaries? | Median, because salaries are right-skewed and the mean is pulled up by a few large values. |
| What does standard deviation measure? | The typical distance of values from the mean, in the data's units. |
| What is a p-value? | The probability of results at least this extreme if there were truly no effect. It's not the probability the null is true. |
| What's a 95% confidence interval? | A range built so that, over many repeated samples, 95% of such ranges contain the true value; practically, the plausible range for the effect. |
| Type I vs Type II error? | Type I: a false positive (finding an effect that isn't there). Type II: a false negative (missing a real one). |
| What is statistical power? | The probability of detecting an effect of a given size if it exists; usually targeted at 80%. |
| State the central limit theorem. | Sample means are approximately normal for large samples, whatever the data's shape, which justifies normal-based tests and intervals. |
| How do you choose the sample size for an A/B test? | From the baseline rate, the minimum detectable effect, α and power; roughly 16σ²/δ² per group. |
| Why not stop a test as soon as it's significant? | Repeated peeking inflates the false-positive rate; fix the duration in advance or use sequential methods. |
| What's sample ratio mismatch? | The observed split differs from the planned split more than chance allows, signalling a bug in assignment or logging. |
| Correlation vs causation? | Correlation can come from confounders or chance; causation needs an experiment or a careful causal design. |
| What's Simpson's paradox? | A trend in every subgroup reverses when combined, because the group mix differs. |
| Which test for two conversion rates? | A two-proportion z-test, or chi-square on the 2×2 table. |
| What's a guardrail metric? | A metric that must not get worse, such as revenue, latency or refunds, even if the primary metric improves. |
| The model flags 2% of genuine transactions and fraud is rare. Why are most flags false? | Base rates: false positives from the huge genuine group outnumber true positives from the tiny fraud group. |

## Key takeaways

> [!check]
> - Skewed data: report medians and percentiles alongside means.
> - A p-value is about data given the null, not the null given the data. Always add the effect size and CI.
> - Standard error shrinks with √n: precision is expensive.
> - Plan experiments before launch: one primary metric, guardrails, sample size, whole weeks, no peeking.
> - Check for sample ratio mismatch before trusting any result.

## Sources

- David Diez, Mine Çetinkaya-Rundel and Christopher Barr, [*OpenIntro Statistics*, 4th ed.](https://www.openintro.org/book/os/) (free).
- Ron Kohavi, Diane Tang and Ya Xu, *Trustworthy Online Controlled Experiments: A Practical Guide to A/B Testing* (Cambridge University Press, 2020): SRM, peeking, guardrails, CUPED.
- Alex Deng et al., "Improving the Sensitivity of Online Controlled Experiments by Utilizing Pre-Experiment Data" (WSDM 2013), the CUPED paper.
- American Statistical Association, [Statement on p-values (2016)](https://www.amstat.org/asa/files/pdfs/p-valuestatement.pdf).
- Gerald van Belle, *Statistical Rules of Thumb*, 2nd ed. (Wiley, 2008), the source of the 16σ²/δ² sample-size rule.
- SciPy: [scipy.stats](https://docs.scipy.org/doc/scipy/reference/stats.html); statsmodels: [power and proportion tests](https://www.statsmodels.org/stable/stats.html).
- Your *AI Journey* Part 15 (Statistics, probability and A/B testing) for derivations and puzzles.
