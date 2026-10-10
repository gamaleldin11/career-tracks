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

<figure class="dia"><svg viewBox="0 0 720 230" role="img" aria-label="An icon array of 1,000 SIMs: 5 are fraudulent and all 5 are flagged, while 20 genuine SIMs are also flagged, so only 5 of the 25 flagged SIMs, about 20 percent, are really fraud">
<circle class="sP" cx="20.0" cy="30.0" r="3.2" opacity=".25"/>
<circle class="sP" cx="29.6" cy="30.0" r="3.2" opacity=".25"/>
<circle class="sP" cx="39.2" cy="30.0" r="3.2" opacity=".25"/>
<circle class="sP" cx="48.8" cy="30.0" r="3.2" opacity=".25"/>
<circle class="sP" cx="58.4" cy="30.0" r="3.2" opacity=".25"/>
<circle class="sP" cx="68.0" cy="30.0" r="3.2" opacity=".25"/>
<circle class="sP" cx="77.6" cy="30.0" r="3.2" opacity=".25"/>
<circle class="sP" cx="87.2" cy="30.0" r="3.2" opacity=".25"/>
<circle class="sP" cx="96.8" cy="30.0" r="3.2" opacity=".25"/>
<circle class="sP" cx="106.4" cy="30.0" r="3.2" opacity=".25"/>
<circle class="sP" cx="116.0" cy="30.0" r="3.2" opacity=".25"/>
<circle class="sP" cx="125.6" cy="30.0" r="3.2" opacity=".25"/>
<circle class="sP" cx="135.2" cy="30.0" r="3.2" opacity=".25"/>
<circle class="sP" cx="144.8" cy="30.0" r="3.2" opacity=".25"/>
<circle class="sP" cx="154.4" cy="30.0" r="3.2" opacity=".25"/>
<circle class="sP" cx="164.0" cy="30.0" r="3.2" opacity=".25"/>
<circle class="sP" cx="173.6" cy="30.0" r="3.2" opacity=".25"/>
<circle class="sP" cx="183.2" cy="30.0" r="3.2" opacity=".25"/>
<circle class="sP" cx="192.8" cy="30.0" r="3.2" opacity=".25"/>
<circle class="sP" cx="202.4" cy="30.0" r="3.2" opacity=".25"/>
<circle class="sP" cx="212.0" cy="30.0" r="3.2" opacity=".25"/>
<circle class="sP" cx="221.6" cy="30.0" r="3.2" opacity=".25"/>
<circle class="sP" cx="231.2" cy="30.0" r="3.2" opacity=".25"/>
<circle class="sP" cx="240.8" cy="30.0" r="3.2" opacity=".25"/>
<circle class="sPw" cx="250.4" cy="30.0" r="3.2" opacity="1"/>
<circle class="sL" cx="250.4" cy="30.0" r="5.2" style="fill:none;stroke-width:1.4"/>
<circle class="sP" cx="260.0" cy="30.0" r="3.2" opacity=".25"/>
<circle class="sP" cx="269.6" cy="30.0" r="3.2" opacity=".25"/>
<circle class="sP" cx="279.2" cy="30.0" r="3.2" opacity=".25"/>
<circle class="sP" cx="288.8" cy="30.0" r="3.2" opacity=".25"/>
<circle class="sP" cx="298.4" cy="30.0" r="3.2" opacity=".25"/>
<circle class="sP" cx="308.0" cy="30.0" r="3.2" opacity=".25"/>
<circle class="sP" cx="317.6" cy="30.0" r="3.2" opacity=".25"/>
<circle class="sP" cx="327.2" cy="30.0" r="3.2" opacity=".25"/>
<circle class="sP" cx="336.8" cy="30.0" r="3.2" opacity=".25"/>
<circle class="sP" cx="346.4" cy="30.0" r="3.2" opacity=".25"/>
<circle class="sP" cx="356.0" cy="30.0" r="3.2" opacity=".25"/>
<circle class="sP" cx="365.6" cy="30.0" r="3.2" opacity=".25"/>
<circle class="sP" cx="375.2" cy="30.0" r="3.2" opacity=".25"/>
<circle class="sP" cx="384.8" cy="30.0" r="3.2" opacity=".25"/>
<circle class="sP" cx="394.4" cy="30.0" r="3.2" opacity=".25"/>
<circle class="sP" cx="404.0" cy="30.0" r="3.2" opacity=".25"/>
<circle class="sP" cx="413.6" cy="30.0" r="3.2" opacity=".25"/>
<circle class="sP" cx="423.2" cy="30.0" r="3.2" opacity=".25"/>
<circle class="sP" cx="432.8" cy="30.0" r="3.2" opacity=".25"/>
<circle class="sP" cx="442.4" cy="30.0" r="3.2" opacity=".25"/>
<circle class="sP" cx="452.0" cy="30.0" r="3.2" opacity=".25"/>
<circle class="sP" cx="461.6" cy="30.0" r="3.2" opacity=".25"/>
<circle class="sP" cx="471.2" cy="30.0" r="3.2" opacity=".25"/>
<circle class="sP" cx="480.8" cy="30.0" r="3.2" opacity=".25"/>
<circle class="sP" cx="490.4" cy="30.0" r="3.2" opacity=".25"/>
<circle class="sP" cx="20.0" cy="39.6" r="3.2" opacity=".25"/>
<circle class="sPw" cx="29.6" cy="39.6" r="3.2" opacity="1"/>
<circle class="sL" cx="29.6" cy="39.6" r="5.2" style="fill:none;stroke-width:1.4"/>
<circle class="sP" cx="39.2" cy="39.6" r="3.2" opacity=".25"/>
<circle class="sP" cx="48.8" cy="39.6" r="3.2" opacity=".25"/>
<circle class="sP" cx="58.4" cy="39.6" r="3.2" opacity=".25"/>
<circle class="sP" cx="68.0" cy="39.6" r="3.2" opacity=".25"/>
<circle class="sP" cx="77.6" cy="39.6" r="3.2" opacity=".25"/>
<circle class="sP" cx="87.2" cy="39.6" r="3.2" opacity=".25"/>
<circle class="sP" cx="96.8" cy="39.6" r="3.2" opacity=".25"/>
<circle class="sP" cx="106.4" cy="39.6" r="3.2" opacity=".25"/>
<circle class="sP" cx="116.0" cy="39.6" r="3.2" opacity=".25"/>
<circle class="sP" cx="125.6" cy="39.6" r="3.2" opacity=".25"/>
<circle class="sP" cx="135.2" cy="39.6" r="3.2" opacity=".25"/>
<circle class="sP" cx="144.8" cy="39.6" r="3.2" opacity=".25"/>
<circle class="sPw" cx="154.4" cy="39.6" r="3.2" opacity="1"/>
<circle class="sL" cx="154.4" cy="39.6" r="5.2" style="fill:none;stroke-width:1.4"/>
<circle class="sP" cx="164.0" cy="39.6" r="3.2" opacity=".25"/>
<circle class="sP" cx="173.6" cy="39.6" r="3.2" opacity=".25"/>
<circle class="sP" cx="183.2" cy="39.6" r="3.2" opacity=".25"/>
<circle class="sP" cx="192.8" cy="39.6" r="3.2" opacity=".25"/>
<circle class="sP" cx="202.4" cy="39.6" r="3.2" opacity=".25"/>
<circle class="sP" cx="212.0" cy="39.6" r="3.2" opacity=".25"/>
<circle class="sP" cx="221.6" cy="39.6" r="3.2" opacity=".25"/>
<circle class="sP" cx="231.2" cy="39.6" r="3.2" opacity=".25"/>
<circle class="sP" cx="240.8" cy="39.6" r="3.2" opacity=".25"/>
<circle class="sP" cx="250.4" cy="39.6" r="3.2" opacity=".25"/>
<circle class="sP" cx="260.0" cy="39.6" r="3.2" opacity=".25"/>
<circle class="sP" cx="269.6" cy="39.6" r="3.2" opacity=".25"/>
<circle class="sP" cx="279.2" cy="39.6" r="3.2" opacity=".25"/>
<circle class="sP" cx="288.8" cy="39.6" r="3.2" opacity=".25"/>
<circle class="sP" cx="298.4" cy="39.6" r="3.2" opacity=".25"/>
<circle class="sP" cx="308.0" cy="39.6" r="3.2" opacity=".25"/>
<circle class="sP" cx="317.6" cy="39.6" r="3.2" opacity=".25"/>
<circle class="sP" cx="327.2" cy="39.6" r="3.2" opacity=".25"/>
<circle class="sP" cx="336.8" cy="39.6" r="3.2" opacity=".25"/>
<circle class="sP" cx="346.4" cy="39.6" r="3.2" opacity=".25"/>
<circle class="sP" cx="356.0" cy="39.6" r="3.2" opacity=".25"/>
<circle class="sP" cx="365.6" cy="39.6" r="3.2" opacity=".25"/>
<circle class="sP" cx="375.2" cy="39.6" r="3.2" opacity=".25"/>
<circle class="sP" cx="384.8" cy="39.6" r="3.2" opacity=".25"/>
<circle class="sP" cx="394.4" cy="39.6" r="3.2" opacity=".25"/>
<circle class="sP" cx="404.0" cy="39.6" r="3.2" opacity=".25"/>
<circle class="sP" cx="413.6" cy="39.6" r="3.2" opacity=".25"/>
<circle class="sP" cx="423.2" cy="39.6" r="3.2" opacity=".25"/>
<circle class="sP" cx="432.8" cy="39.6" r="3.2" opacity=".25"/>
<circle class="sP" cx="442.4" cy="39.6" r="3.2" opacity=".25"/>
<circle class="sP" cx="452.0" cy="39.6" r="3.2" opacity=".25"/>
<circle class="sP" cx="461.6" cy="39.6" r="3.2" opacity=".25"/>
<circle class="sP" cx="471.2" cy="39.6" r="3.2" opacity=".25"/>
<circle class="sP" cx="480.8" cy="39.6" r="3.2" opacity=".25"/>
<circle class="sP" cx="490.4" cy="39.6" r="3.2" opacity=".25"/>
<circle class="sP" cx="20.0" cy="49.2" r="3.2" opacity=".25"/>
<circle class="sP" cx="29.6" cy="49.2" r="3.2" opacity=".25"/>
<circle class="sP" cx="39.2" cy="49.2" r="3.2" opacity=".25"/>
<circle class="sP" cx="48.8" cy="49.2" r="3.2" opacity=".25"/>
<circle class="sP" cx="58.4" cy="49.2" r="3.2" opacity=".25"/>
<circle class="sP" cx="68.0" cy="49.2" r="3.2" opacity=".25"/>
<circle class="sP" cx="77.6" cy="49.2" r="3.2" opacity=".25"/>
<circle class="sP" cx="87.2" cy="49.2" r="3.2" opacity=".25"/>
<circle class="sP" cx="96.8" cy="49.2" r="3.2" opacity=".25"/>
<circle class="sP" cx="106.4" cy="49.2" r="3.2" opacity=".25"/>
<circle class="sP" cx="116.0" cy="49.2" r="3.2" opacity=".25"/>
<circle class="sP" cx="125.6" cy="49.2" r="3.2" opacity=".25"/>
<circle class="sP" cx="135.2" cy="49.2" r="3.2" opacity=".25"/>
<circle class="sP" cx="144.8" cy="49.2" r="3.2" opacity=".25"/>
<circle class="sP" cx="154.4" cy="49.2" r="3.2" opacity=".25"/>
<circle class="sP" cx="164.0" cy="49.2" r="3.2" opacity=".25"/>
<circle class="sP" cx="173.6" cy="49.2" r="3.2" opacity=".25"/>
<circle class="sP" cx="183.2" cy="49.2" r="3.2" opacity=".25"/>
<circle class="sP" cx="192.8" cy="49.2" r="3.2" opacity=".25"/>
<circle class="sP" cx="202.4" cy="49.2" r="3.2" opacity=".25"/>
<circle class="sP" cx="212.0" cy="49.2" r="3.2" opacity=".25"/>
<circle class="sP" cx="221.6" cy="49.2" r="3.2" opacity=".25"/>
<circle class="sP" cx="231.2" cy="49.2" r="3.2" opacity=".25"/>
<circle class="sP" cx="240.8" cy="49.2" r="3.2" opacity=".25"/>
<circle class="sP" cx="250.4" cy="49.2" r="3.2" opacity=".25"/>
<circle class="sP" cx="260.0" cy="49.2" r="3.2" opacity=".25"/>
<circle class="sP" cx="269.6" cy="49.2" r="3.2" opacity=".25"/>
<circle class="sP" cx="279.2" cy="49.2" r="3.2" opacity=".25"/>
<circle class="sP" cx="288.8" cy="49.2" r="3.2" opacity=".25"/>
<circle class="sP" cx="298.4" cy="49.2" r="3.2" opacity=".25"/>
<circle class="sP" cx="308.0" cy="49.2" r="3.2" opacity=".25"/>
<circle class="sP" cx="317.6" cy="49.2" r="3.2" opacity=".25"/>
<circle class="sP" cx="327.2" cy="49.2" r="3.2" opacity=".25"/>
<circle class="sP" cx="336.8" cy="49.2" r="3.2" opacity=".25"/>
<circle class="sP" cx="346.4" cy="49.2" r="3.2" opacity=".25"/>
<circle class="sP" cx="356.0" cy="49.2" r="3.2" opacity=".25"/>
<circle class="sP" cx="365.6" cy="49.2" r="3.2" opacity=".25"/>
<circle class="sP" cx="375.2" cy="49.2" r="3.2" opacity=".25"/>
<circle class="sP" cx="384.8" cy="49.2" r="3.2" opacity=".25"/>
<circle class="sP" cx="394.4" cy="49.2" r="3.2" opacity=".25"/>
<circle class="sP" cx="404.0" cy="49.2" r="3.2" opacity=".25"/>
<circle class="sP" cx="413.6" cy="49.2" r="3.2" opacity=".25"/>
<circle class="sP" cx="423.2" cy="49.2" r="3.2" opacity=".25"/>
<circle class="sP" cx="432.8" cy="49.2" r="3.2" opacity=".25"/>
<circle class="sP" cx="442.4" cy="49.2" r="3.2" opacity=".25"/>
<circle class="sP" cx="452.0" cy="49.2" r="3.2" opacity=".25"/>
<circle class="sP" cx="461.6" cy="49.2" r="3.2" opacity=".25"/>
<circle class="sP" cx="471.2" cy="49.2" r="3.2" opacity=".25"/>
<circle class="sP" cx="480.8" cy="49.2" r="3.2" opacity=".25"/>
<circle class="sP" cx="490.4" cy="49.2" r="3.2" opacity=".25"/>
<circle class="sP" cx="20.0" cy="58.8" r="3.2" opacity=".25"/>
<circle class="sP" cx="29.6" cy="58.8" r="3.2" opacity=".25"/>
<circle class="sP" cx="39.2" cy="58.8" r="3.2" opacity=".25"/>
<circle class="sP" cx="48.8" cy="58.8" r="3.2" opacity=".25"/>
<circle class="sP" cx="58.4" cy="58.8" r="3.2" opacity=".25"/>
<circle class="sP" cx="68.0" cy="58.8" r="3.2" opacity=".25"/>
<circle class="sP" cx="77.6" cy="58.8" r="3.2" opacity=".25"/>
<circle class="sP" cx="87.2" cy="58.8" r="3.2" opacity=".25"/>
<circle class="sP" cx="96.8" cy="58.8" r="3.2" opacity=".25"/>
<circle class="sP" cx="106.4" cy="58.8" r="3.2" opacity=".25"/>
<circle class="sP" cx="116.0" cy="58.8" r="3.2" opacity=".25"/>
<circle class="sP" cx="125.6" cy="58.8" r="3.2" opacity=".25"/>
<circle class="sP" cx="135.2" cy="58.8" r="3.2" opacity=".25"/>
<circle class="sP" cx="144.8" cy="58.8" r="3.2" opacity=".25"/>
<circle class="sP" cx="154.4" cy="58.8" r="3.2" opacity=".25"/>
<circle class="sP" cx="164.0" cy="58.8" r="3.2" opacity=".25"/>
<circle class="sP" cx="173.6" cy="58.8" r="3.2" opacity=".25"/>
<circle class="sP" cx="183.2" cy="58.8" r="3.2" opacity=".25"/>
<circle class="sP" cx="192.8" cy="58.8" r="3.2" opacity=".25"/>
<circle class="sP" cx="202.4" cy="58.8" r="3.2" opacity=".25"/>
<circle class="sP" cx="212.0" cy="58.8" r="3.2" opacity=".25"/>
<circle class="sP" cx="221.6" cy="58.8" r="3.2" opacity=".25"/>
<circle class="sP" cx="231.2" cy="58.8" r="3.2" opacity=".25"/>
<circle class="sP" cx="240.8" cy="58.8" r="3.2" opacity=".25"/>
<circle class="sP" cx="250.4" cy="58.8" r="3.2" opacity=".25"/>
<circle class="sP" cx="260.0" cy="58.8" r="3.2" opacity=".25"/>
<circle class="sP" cx="269.6" cy="58.8" r="3.2" opacity=".25"/>
<circle class="sP" cx="279.2" cy="58.8" r="3.2" opacity=".25"/>
<circle class="sP" cx="288.8" cy="58.8" r="3.2" opacity=".25"/>
<circle class="sP" cx="298.4" cy="58.8" r="3.2" opacity=".25"/>
<circle class="sP" cx="308.0" cy="58.8" r="3.2" opacity=".25"/>
<circle class="sP" cx="317.6" cy="58.8" r="3.2" opacity=".25"/>
<circle class="sP" cx="327.2" cy="58.8" r="3.2" opacity=".25"/>
<circle class="sP" cx="336.8" cy="58.8" r="3.2" opacity=".25"/>
<circle class="sP" cx="346.4" cy="58.8" r="3.2" opacity=".25"/>
<circle class="sP" cx="356.0" cy="58.8" r="3.2" opacity=".25"/>
<circle class="sP" cx="365.6" cy="58.8" r="3.2" opacity=".25"/>
<circle class="sP" cx="375.2" cy="58.8" r="3.2" opacity=".25"/>
<circle class="sP" cx="384.8" cy="58.8" r="3.2" opacity=".25"/>
<circle class="sP" cx="394.4" cy="58.8" r="3.2" opacity=".25"/>
<circle class="sP" cx="404.0" cy="58.8" r="3.2" opacity=".25"/>
<circle class="sP" cx="413.6" cy="58.8" r="3.2" opacity=".25"/>
<circle class="sP" cx="423.2" cy="58.8" r="3.2" opacity=".25"/>
<circle class="sP" cx="432.8" cy="58.8" r="3.2" opacity=".25"/>
<circle class="sP" cx="442.4" cy="58.8" r="3.2" opacity=".25"/>
<circle class="sP" cx="452.0" cy="58.8" r="3.2" opacity=".25"/>
<circle class="sP" cx="461.6" cy="58.8" r="3.2" opacity=".25"/>
<circle class="sP" cx="471.2" cy="58.8" r="3.2" opacity=".25"/>
<circle class="sP" cx="480.8" cy="58.8" r="3.2" opacity=".25"/>
<circle class="sP" cx="490.4" cy="58.8" r="3.2" opacity=".25"/>
<circle class="sP" cx="20.0" cy="68.4" r="3.2" opacity=".25"/>
<circle class="sP" cx="29.6" cy="68.4" r="3.2" opacity=".25"/>
<circle class="sP" cx="39.2" cy="68.4" r="3.2" opacity=".25"/>
<circle class="sP" cx="48.8" cy="68.4" r="3.2" opacity=".25"/>
<circle class="sP" cx="58.4" cy="68.4" r="3.2" opacity=".25"/>
<circle class="sP" cx="68.0" cy="68.4" r="3.2" opacity=".25"/>
<circle class="sP" cx="77.6" cy="68.4" r="3.2" opacity=".25"/>
<circle class="sP" cx="87.2" cy="68.4" r="3.2" opacity=".25"/>
<circle class="sP" cx="96.8" cy="68.4" r="3.2" opacity=".25"/>
<circle class="sP" cx="106.4" cy="68.4" r="3.2" opacity=".25"/>
<circle class="sP" cx="116.0" cy="68.4" r="3.2" opacity=".25"/>
<circle class="sP" cx="125.6" cy="68.4" r="3.2" opacity=".25"/>
<circle class="sP" cx="135.2" cy="68.4" r="3.2" opacity=".25"/>
<circle class="sP" cx="144.8" cy="68.4" r="3.2" opacity=".25"/>
<circle class="sP" cx="154.4" cy="68.4" r="3.2" opacity=".25"/>
<circle class="sP" cx="164.0" cy="68.4" r="3.2" opacity=".25"/>
<circle class="sP" cx="173.6" cy="68.4" r="3.2" opacity=".25"/>
<circle class="sP" cx="183.2" cy="68.4" r="3.2" opacity=".25"/>
<circle class="sP" cx="192.8" cy="68.4" r="3.2" opacity=".25"/>
<circle class="sP" cx="202.4" cy="68.4" r="3.2" opacity=".25"/>
<circle class="sP" cx="212.0" cy="68.4" r="3.2" opacity=".25"/>
<circle class="sP" cx="221.6" cy="68.4" r="3.2" opacity=".25"/>
<circle class="sP" cx="231.2" cy="68.4" r="3.2" opacity=".25"/>
<circle class="sP" cx="240.8" cy="68.4" r="3.2" opacity=".25"/>
<circle class="sP" cx="250.4" cy="68.4" r="3.2" opacity=".25"/>
<circle class="sP" cx="260.0" cy="68.4" r="3.2" opacity=".25"/>
<circle class="sP" cx="269.6" cy="68.4" r="3.2" opacity=".25"/>
<circle class="sP" cx="279.2" cy="68.4" r="3.2" opacity=".25"/>
<circle class="sPw" cx="288.8" cy="68.4" r="3.2" opacity="1"/>
<circle class="sL" cx="288.8" cy="68.4" r="5.2" style="fill:none;stroke-width:1.4"/>
<circle class="sP" cx="298.4" cy="68.4" r="3.2" opacity=".25"/>
<circle class="sP" cx="308.0" cy="68.4" r="3.2" opacity=".25"/>
<circle class="sP" cx="317.6" cy="68.4" r="3.2" opacity=".25"/>
<circle class="sPw" cx="327.2" cy="68.4" r="3.2" opacity="1"/>
<circle class="sL" cx="327.2" cy="68.4" r="5.2" style="fill:none;stroke-width:1.4"/>
<circle class="sP" cx="336.8" cy="68.4" r="3.2" opacity=".25"/>
<circle class="sP" cx="346.4" cy="68.4" r="3.2" opacity=".25"/>
<circle class="sP" cx="356.0" cy="68.4" r="3.2" opacity=".25"/>
<circle class="sP" cx="365.6" cy="68.4" r="3.2" opacity=".25"/>
<circle class="sP" cx="375.2" cy="68.4" r="3.2" opacity=".25"/>
<circle class="sP" cx="384.8" cy="68.4" r="3.2" opacity=".25"/>
<circle class="sP" cx="394.4" cy="68.4" r="3.2" opacity=".25"/>
<circle class="sP" cx="404.0" cy="68.4" r="3.2" opacity=".25"/>
<circle class="sP" cx="413.6" cy="68.4" r="3.2" opacity=".25"/>
<circle class="sP" cx="423.2" cy="68.4" r="3.2" opacity=".25"/>
<circle class="sP" cx="432.8" cy="68.4" r="3.2" opacity=".25"/>
<circle class="sP" cx="442.4" cy="68.4" r="3.2" opacity=".25"/>
<circle class="sP" cx="452.0" cy="68.4" r="3.2" opacity=".25"/>
<circle class="sP" cx="461.6" cy="68.4" r="3.2" opacity=".25"/>
<circle class="sP" cx="471.2" cy="68.4" r="3.2" opacity=".25"/>
<circle class="sP" cx="480.8" cy="68.4" r="3.2" opacity=".25"/>
<circle class="sP" cx="490.4" cy="68.4" r="3.2" opacity=".25"/>
<circle class="sP" cx="20.0" cy="78.0" r="3.2" opacity=".25"/>
<circle class="sP" cx="29.6" cy="78.0" r="3.2" opacity=".25"/>
<circle class="sP" cx="39.2" cy="78.0" r="3.2" opacity=".25"/>
<circle class="sP" cx="48.8" cy="78.0" r="3.2" opacity=".25"/>
<circle class="sP" cx="58.4" cy="78.0" r="3.2" opacity=".25"/>
<circle class="sP" cx="68.0" cy="78.0" r="3.2" opacity=".25"/>
<circle class="sP" cx="77.6" cy="78.0" r="3.2" opacity=".25"/>
<circle class="sP" cx="87.2" cy="78.0" r="3.2" opacity=".25"/>
<circle class="sP" cx="96.8" cy="78.0" r="3.2" opacity=".25"/>
<circle class="sP" cx="106.4" cy="78.0" r="3.2" opacity=".25"/>
<circle class="sP" cx="116.0" cy="78.0" r="3.2" opacity=".25"/>
<circle class="sP" cx="125.6" cy="78.0" r="3.2" opacity=".25"/>
<circle class="sP" cx="135.2" cy="78.0" r="3.2" opacity=".25"/>
<circle class="sP" cx="144.8" cy="78.0" r="3.2" opacity=".25"/>
<circle class="sP" cx="154.4" cy="78.0" r="3.2" opacity=".25"/>
<circle class="sP" cx="164.0" cy="78.0" r="3.2" opacity=".25"/>
<circle class="sP" cx="173.6" cy="78.0" r="3.2" opacity=".25"/>
<circle class="sP" cx="183.2" cy="78.0" r="3.2" opacity=".25"/>
<circle class="sP" cx="192.8" cy="78.0" r="3.2" opacity=".25"/>
<circle class="sP" cx="202.4" cy="78.0" r="3.2" opacity=".25"/>
<circle class="sP" cx="212.0" cy="78.0" r="3.2" opacity=".25"/>
<circle class="sP" cx="221.6" cy="78.0" r="3.2" opacity=".25"/>
<circle class="sP" cx="231.2" cy="78.0" r="3.2" opacity=".25"/>
<circle class="sP" cx="240.8" cy="78.0" r="3.2" opacity=".25"/>
<circle class="sP" cx="250.4" cy="78.0" r="3.2" opacity=".25"/>
<circle class="sP" cx="260.0" cy="78.0" r="3.2" opacity=".25"/>
<circle class="sP" cx="269.6" cy="78.0" r="3.2" opacity=".25"/>
<circle class="sP" cx="279.2" cy="78.0" r="3.2" opacity=".25"/>
<circle class="sP" cx="288.8" cy="78.0" r="3.2" opacity=".25"/>
<circle class="sP" cx="298.4" cy="78.0" r="3.2" opacity=".25"/>
<circle class="sP" cx="308.0" cy="78.0" r="3.2" opacity=".25"/>
<circle class="sPw" cx="317.6" cy="78.0" r="3.2" opacity="1"/>
<circle class="sL" cx="317.6" cy="78.0" r="5.2" style="fill:none;stroke-width:1.4"/>
<circle class="sP" cx="327.2" cy="78.0" r="3.2" opacity=".25"/>
<circle class="sP" cx="336.8" cy="78.0" r="3.2" opacity=".25"/>
<circle class="sP" cx="346.4" cy="78.0" r="3.2" opacity=".25"/>
<circle class="sP" cx="356.0" cy="78.0" r="3.2" opacity=".25"/>
<circle class="sP" cx="365.6" cy="78.0" r="3.2" opacity=".25"/>
<circle class="sP" cx="375.2" cy="78.0" r="3.2" opacity=".25"/>
<circle class="sPw" cx="384.8" cy="78.0" r="3.2" opacity="1"/>
<circle class="sL" cx="384.8" cy="78.0" r="5.2" style="fill:none;stroke-width:1.4"/>
<circle class="sP" cx="394.4" cy="78.0" r="3.2" opacity=".25"/>
<circle class="sP" cx="404.0" cy="78.0" r="3.2" opacity=".25"/>
<circle class="sP" cx="413.6" cy="78.0" r="3.2" opacity=".25"/>
<circle class="sP" cx="423.2" cy="78.0" r="3.2" opacity=".25"/>
<circle class="sP" cx="432.8" cy="78.0" r="3.2" opacity=".25"/>
<circle class="sP" cx="442.4" cy="78.0" r="3.2" opacity=".25"/>
<circle class="sP" cx="452.0" cy="78.0" r="3.2" opacity=".25"/>
<circle class="sP" cx="461.6" cy="78.0" r="3.2" opacity=".25"/>
<circle class="sP" cx="471.2" cy="78.0" r="3.2" opacity=".25"/>
<circle class="sP" cx="480.8" cy="78.0" r="3.2" opacity=".25"/>
<circle class="sP" cx="490.4" cy="78.0" r="3.2" opacity=".25"/>
<circle class="sP" cx="20.0" cy="87.6" r="3.2" opacity=".25"/>
<circle class="sP" cx="29.6" cy="87.6" r="3.2" opacity=".25"/>
<circle class="sP" cx="39.2" cy="87.6" r="3.2" opacity=".25"/>
<circle class="sP" cx="48.8" cy="87.6" r="3.2" opacity=".25"/>
<circle class="sP" cx="58.4" cy="87.6" r="3.2" opacity=".25"/>
<circle class="sP" cx="68.0" cy="87.6" r="3.2" opacity=".25"/>
<circle class="sP" cx="77.6" cy="87.6" r="3.2" opacity=".25"/>
<circle class="sP" cx="87.2" cy="87.6" r="3.2" opacity=".25"/>
<circle class="sP" cx="96.8" cy="87.6" r="3.2" opacity=".25"/>
<circle class="sP" cx="106.4" cy="87.6" r="3.2" opacity=".25"/>
<circle class="sP" cx="116.0" cy="87.6" r="3.2" opacity=".25"/>
<circle class="sP" cx="125.6" cy="87.6" r="3.2" opacity=".25"/>
<circle class="sP" cx="135.2" cy="87.6" r="3.2" opacity=".25"/>
<circle class="sP" cx="144.8" cy="87.6" r="3.2" opacity=".25"/>
<circle class="sP" cx="154.4" cy="87.6" r="3.2" opacity=".25"/>
<circle class="sP" cx="164.0" cy="87.6" r="3.2" opacity=".25"/>
<circle class="sP" cx="173.6" cy="87.6" r="3.2" opacity=".25"/>
<circle class="sP" cx="183.2" cy="87.6" r="3.2" opacity=".25"/>
<circle class="sP" cx="192.8" cy="87.6" r="3.2" opacity=".25"/>
<circle class="sP" cx="202.4" cy="87.6" r="3.2" opacity=".25"/>
<circle class="sP" cx="212.0" cy="87.6" r="3.2" opacity=".25"/>
<circle class="sP" cx="221.6" cy="87.6" r="3.2" opacity=".25"/>
<circle class="sP" cx="231.2" cy="87.6" r="3.2" opacity=".25"/>
<circle class="sP" cx="240.8" cy="87.6" r="3.2" opacity=".25"/>
<circle class="sP" cx="250.4" cy="87.6" r="3.2" opacity=".25"/>
<circle class="sP" cx="260.0" cy="87.6" r="3.2" opacity=".25"/>
<circle class="sP" cx="269.6" cy="87.6" r="3.2" opacity=".25"/>
<circle class="sP" cx="279.2" cy="87.6" r="3.2" opacity=".25"/>
<circle class="sP" cx="288.8" cy="87.6" r="3.2" opacity=".25"/>
<circle class="sP" cx="298.4" cy="87.6" r="3.2" opacity=".25"/>
<circle class="sP" cx="308.0" cy="87.6" r="3.2" opacity=".25"/>
<circle class="sP" cx="317.6" cy="87.6" r="3.2" opacity=".25"/>
<circle class="sP" cx="327.2" cy="87.6" r="3.2" opacity=".25"/>
<circle class="sP" cx="336.8" cy="87.6" r="3.2" opacity=".25"/>
<circle class="sP" cx="346.4" cy="87.6" r="3.2" opacity=".25"/>
<circle class="sP" cx="356.0" cy="87.6" r="3.2" opacity=".25"/>
<circle class="sP" cx="365.6" cy="87.6" r="3.2" opacity=".25"/>
<circle class="sP" cx="375.2" cy="87.6" r="3.2" opacity=".25"/>
<circle class="sP" cx="384.8" cy="87.6" r="3.2" opacity=".25"/>
<circle class="sP" cx="394.4" cy="87.6" r="3.2" opacity=".25"/>
<circle class="sPw" cx="404.0" cy="87.6" r="3.2" opacity="1"/>
<circle class="sL" cx="404.0" cy="87.6" r="5.2" style="fill:none;stroke-width:1.4"/>
<circle class="sP" cx="413.6" cy="87.6" r="3.2" opacity=".25"/>
<circle class="sP" cx="423.2" cy="87.6" r="3.2" opacity=".25"/>
<circle class="sP" cx="432.8" cy="87.6" r="3.2" opacity=".25"/>
<circle class="sP" cx="442.4" cy="87.6" r="3.2" opacity=".25"/>
<circle class="sP" cx="452.0" cy="87.6" r="3.2" opacity=".25"/>
<circle class="sP" cx="461.6" cy="87.6" r="3.2" opacity=".25"/>
<circle class="sP" cx="471.2" cy="87.6" r="3.2" opacity=".25"/>
<circle class="sP" cx="480.8" cy="87.6" r="3.2" opacity=".25"/>
<circle class="sP" cx="490.4" cy="87.6" r="3.2" opacity=".25"/>
<circle class="sP" cx="20.0" cy="97.2" r="3.2" opacity=".25"/>
<circle class="sP" cx="29.6" cy="97.2" r="3.2" opacity=".25"/>
<circle class="sP" cx="39.2" cy="97.2" r="3.2" opacity=".25"/>
<circle class="sP" cx="48.8" cy="97.2" r="3.2" opacity=".25"/>
<circle class="sP" cx="58.4" cy="97.2" r="3.2" opacity=".25"/>
<circle class="sP" cx="68.0" cy="97.2" r="3.2" opacity=".25"/>
<circle class="sP" cx="77.6" cy="97.2" r="3.2" opacity=".25"/>
<circle class="sP" cx="87.2" cy="97.2" r="3.2" opacity=".25"/>
<circle class="sP" cx="96.8" cy="97.2" r="3.2" opacity=".25"/>
<circle class="sP" cx="106.4" cy="97.2" r="3.2" opacity=".25"/>
<circle class="sPw" cx="116.0" cy="97.2" r="3.2" opacity="1"/>
<circle class="sL" cx="116.0" cy="97.2" r="5.2" style="fill:none;stroke-width:1.4"/>
<circle class="sP" cx="125.6" cy="97.2" r="3.2" opacity=".25"/>
<circle class="sP" cx="135.2" cy="97.2" r="3.2" opacity=".25"/>
<circle class="sP" cx="144.8" cy="97.2" r="3.2" opacity=".25"/>
<circle class="sP" cx="154.4" cy="97.2" r="3.2" opacity=".25"/>
<circle class="sP" cx="164.0" cy="97.2" r="3.2" opacity=".25"/>
<circle class="sP" cx="173.6" cy="97.2" r="3.2" opacity=".25"/>
<circle class="sP" cx="183.2" cy="97.2" r="3.2" opacity=".25"/>
<circle class="sP" cx="192.8" cy="97.2" r="3.2" opacity=".25"/>
<circle class="sP" cx="202.4" cy="97.2" r="3.2" opacity=".25"/>
<circle class="sP" cx="212.0" cy="97.2" r="3.2" opacity=".25"/>
<circle class="sP" cx="221.6" cy="97.2" r="3.2" opacity=".25"/>
<circle class="sP" cx="231.2" cy="97.2" r="3.2" opacity=".25"/>
<circle class="sP" cx="240.8" cy="97.2" r="3.2" opacity=".25"/>
<circle class="sP" cx="250.4" cy="97.2" r="3.2" opacity=".25"/>
<circle class="sP" cx="260.0" cy="97.2" r="3.2" opacity=".25"/>
<circle class="sP" cx="269.6" cy="97.2" r="3.2" opacity=".25"/>
<circle class="sP" cx="279.2" cy="97.2" r="3.2" opacity=".25"/>
<circle class="sP" cx="288.8" cy="97.2" r="3.2" opacity=".25"/>
<circle class="sP" cx="298.4" cy="97.2" r="3.2" opacity=".25"/>
<circle class="sP" cx="308.0" cy="97.2" r="3.2" opacity=".25"/>
<circle class="sP" cx="317.6" cy="97.2" r="3.2" opacity=".25"/>
<circle class="sP" cx="327.2" cy="97.2" r="3.2" opacity=".25"/>
<circle class="sP" cx="336.8" cy="97.2" r="3.2" opacity=".25"/>
<circle class="sP" cx="346.4" cy="97.2" r="3.2" opacity=".25"/>
<circle class="sP" cx="356.0" cy="97.2" r="3.2" opacity=".25"/>
<circle class="sP" cx="365.6" cy="97.2" r="3.2" opacity=".25"/>
<circle class="sP" cx="375.2" cy="97.2" r="3.2" opacity=".25"/>
<circle class="sP" cx="384.8" cy="97.2" r="3.2" opacity=".25"/>
<circle class="sP" cx="394.4" cy="97.2" r="3.2" opacity=".25"/>
<circle class="sP" cx="404.0" cy="97.2" r="3.2" opacity=".25"/>
<circle class="sP" cx="413.6" cy="97.2" r="3.2" opacity=".25"/>
<circle class="sP" cx="423.2" cy="97.2" r="3.2" opacity=".25"/>
<circle class="sP" cx="432.8" cy="97.2" r="3.2" opacity=".25"/>
<circle class="sP" cx="442.4" cy="97.2" r="3.2" opacity=".25"/>
<circle class="sP" cx="452.0" cy="97.2" r="3.2" opacity=".25"/>
<circle class="sP" cx="461.6" cy="97.2" r="3.2" opacity=".25"/>
<circle class="sP" cx="471.2" cy="97.2" r="3.2" opacity=".25"/>
<circle class="sPw" cx="480.8" cy="97.2" r="3.2" opacity="1"/>
<circle class="sL" cx="480.8" cy="97.2" r="5.2" style="fill:none;stroke-width:1.4"/>
<circle class="sP" cx="490.4" cy="97.2" r="3.2" opacity=".25"/>
<circle class="sPw" cx="20.0" cy="106.8" r="3.2" opacity="1"/>
<circle class="sL" cx="20.0" cy="106.8" r="5.2" style="fill:none;stroke-width:1.4"/>
<circle class="sP" cx="29.6" cy="106.8" r="3.2" opacity=".25"/>
<circle class="sP" cx="39.2" cy="106.8" r="3.2" opacity=".25"/>
<circle class="sP" cx="48.8" cy="106.8" r="3.2" opacity=".25"/>
<circle class="sP" cx="58.4" cy="106.8" r="3.2" opacity=".25"/>
<circle class="sP" cx="68.0" cy="106.8" r="3.2" opacity=".25"/>
<circle class="sP" cx="77.6" cy="106.8" r="3.2" opacity=".25"/>
<circle class="sP" cx="87.2" cy="106.8" r="3.2" opacity=".25"/>
<circle class="sP" cx="96.8" cy="106.8" r="3.2" opacity=".25"/>
<circle class="sP" cx="106.4" cy="106.8" r="3.2" opacity=".25"/>
<circle class="sP" cx="116.0" cy="106.8" r="3.2" opacity=".25"/>
<circle class="sP" cx="125.6" cy="106.8" r="3.2" opacity=".25"/>
<circle class="sP" cx="135.2" cy="106.8" r="3.2" opacity=".25"/>
<circle class="sP" cx="144.8" cy="106.8" r="3.2" opacity=".25"/>
<circle class="sP" cx="154.4" cy="106.8" r="3.2" opacity=".25"/>
<circle class="sP" cx="164.0" cy="106.8" r="3.2" opacity=".25"/>
<circle class="sP" cx="173.6" cy="106.8" r="3.2" opacity=".25"/>
<circle class="sP" cx="183.2" cy="106.8" r="3.2" opacity=".25"/>
<circle class="sP" cx="192.8" cy="106.8" r="3.2" opacity=".25"/>
<circle class="sP" cx="202.4" cy="106.8" r="3.2" opacity=".25"/>
<circle class="sP" cx="212.0" cy="106.8" r="3.2" opacity=".25"/>
<circle class="sP" cx="221.6" cy="106.8" r="3.2" opacity=".25"/>
<circle class="sP" cx="231.2" cy="106.8" r="3.2" opacity=".25"/>
<circle class="sP" cx="240.8" cy="106.8" r="3.2" opacity=".25"/>
<circle class="sP" cx="250.4" cy="106.8" r="3.2" opacity=".25"/>
<circle class="sP" cx="260.0" cy="106.8" r="3.2" opacity=".25"/>
<circle class="sP" cx="269.6" cy="106.8" r="3.2" opacity=".25"/>
<circle class="sP" cx="279.2" cy="106.8" r="3.2" opacity=".25"/>
<circle class="sP" cx="288.8" cy="106.8" r="3.2" opacity=".25"/>
<circle class="sP" cx="298.4" cy="106.8" r="3.2" opacity=".25"/>
<circle class="sP" cx="308.0" cy="106.8" r="3.2" opacity=".25"/>
<circle class="sP" cx="317.6" cy="106.8" r="3.2" opacity=".25"/>
<circle class="sP" cx="327.2" cy="106.8" r="3.2" opacity=".25"/>
<circle class="sP" cx="336.8" cy="106.8" r="3.2" opacity=".25"/>
<circle class="sP" cx="346.4" cy="106.8" r="3.2" opacity=".25"/>
<circle class="sP" cx="356.0" cy="106.8" r="3.2" opacity=".25"/>
<circle class="sP" cx="365.6" cy="106.8" r="3.2" opacity=".25"/>
<circle class="sP" cx="375.2" cy="106.8" r="3.2" opacity=".25"/>
<circle class="sP" cx="384.8" cy="106.8" r="3.2" opacity=".25"/>
<circle class="sP" cx="394.4" cy="106.8" r="3.2" opacity=".25"/>
<circle class="sP" cx="404.0" cy="106.8" r="3.2" opacity=".25"/>
<circle class="sP" cx="413.6" cy="106.8" r="3.2" opacity=".25"/>
<circle class="sP" cx="423.2" cy="106.8" r="3.2" opacity=".25"/>
<circle class="sP" cx="432.8" cy="106.8" r="3.2" opacity=".25"/>
<circle class="sP" cx="442.4" cy="106.8" r="3.2" opacity=".25"/>
<circle class="sP" cx="452.0" cy="106.8" r="3.2" opacity=".25"/>
<circle class="sP" cx="461.6" cy="106.8" r="3.2" opacity=".25"/>
<circle class="sP" cx="471.2" cy="106.8" r="3.2" opacity=".25"/>
<circle class="sP" cx="480.8" cy="106.8" r="3.2" opacity=".25"/>
<circle class="sP" cx="490.4" cy="106.8" r="3.2" opacity=".25"/>
<circle class="sP" cx="20.0" cy="116.4" r="3.2" opacity=".25"/>
<circle class="sP" cx="29.6" cy="116.4" r="3.2" opacity=".25"/>
<circle class="sP" cx="39.2" cy="116.4" r="3.2" opacity=".25"/>
<circle class="sP" cx="48.8" cy="116.4" r="3.2" opacity=".25"/>
<circle class="sP" cx="58.4" cy="116.4" r="3.2" opacity=".25"/>
<circle class="sP" cx="68.0" cy="116.4" r="3.2" opacity=".25"/>
<circle class="sPr" cx="77.6" cy="116.4" r="3.2" opacity="1"/>
<circle class="sL" cx="77.6" cy="116.4" r="5.2" style="fill:none;stroke-width:1.4"/>
<circle class="sP" cx="87.2" cy="116.4" r="3.2" opacity=".25"/>
<circle class="sP" cx="96.8" cy="116.4" r="3.2" opacity=".25"/>
<circle class="sP" cx="106.4" cy="116.4" r="3.2" opacity=".25"/>
<circle class="sP" cx="116.0" cy="116.4" r="3.2" opacity=".25"/>
<circle class="sP" cx="125.6" cy="116.4" r="3.2" opacity=".25"/>
<circle class="sP" cx="135.2" cy="116.4" r="3.2" opacity=".25"/>
<circle class="sP" cx="144.8" cy="116.4" r="3.2" opacity=".25"/>
<circle class="sP" cx="154.4" cy="116.4" r="3.2" opacity=".25"/>
<circle class="sP" cx="164.0" cy="116.4" r="3.2" opacity=".25"/>
<circle class="sP" cx="173.6" cy="116.4" r="3.2" opacity=".25"/>
<circle class="sP" cx="183.2" cy="116.4" r="3.2" opacity=".25"/>
<circle class="sP" cx="192.8" cy="116.4" r="3.2" opacity=".25"/>
<circle class="sP" cx="202.4" cy="116.4" r="3.2" opacity=".25"/>
<circle class="sP" cx="212.0" cy="116.4" r="3.2" opacity=".25"/>
<circle class="sP" cx="221.6" cy="116.4" r="3.2" opacity=".25"/>
<circle class="sP" cx="231.2" cy="116.4" r="3.2" opacity=".25"/>
<circle class="sP" cx="240.8" cy="116.4" r="3.2" opacity=".25"/>
<circle class="sP" cx="250.4" cy="116.4" r="3.2" opacity=".25"/>
<circle class="sP" cx="260.0" cy="116.4" r="3.2" opacity=".25"/>
<circle class="sP" cx="269.6" cy="116.4" r="3.2" opacity=".25"/>
<circle class="sP" cx="279.2" cy="116.4" r="3.2" opacity=".25"/>
<circle class="sP" cx="288.8" cy="116.4" r="3.2" opacity=".25"/>
<circle class="sP" cx="298.4" cy="116.4" r="3.2" opacity=".25"/>
<circle class="sP" cx="308.0" cy="116.4" r="3.2" opacity=".25"/>
<circle class="sP" cx="317.6" cy="116.4" r="3.2" opacity=".25"/>
<circle class="sP" cx="327.2" cy="116.4" r="3.2" opacity=".25"/>
<circle class="sP" cx="336.8" cy="116.4" r="3.2" opacity=".25"/>
<circle class="sP" cx="346.4" cy="116.4" r="3.2" opacity=".25"/>
<circle class="sP" cx="356.0" cy="116.4" r="3.2" opacity=".25"/>
<circle class="sP" cx="365.6" cy="116.4" r="3.2" opacity=".25"/>
<circle class="sP" cx="375.2" cy="116.4" r="3.2" opacity=".25"/>
<circle class="sP" cx="384.8" cy="116.4" r="3.2" opacity=".25"/>
<circle class="sP" cx="394.4" cy="116.4" r="3.2" opacity=".25"/>
<circle class="sP" cx="404.0" cy="116.4" r="3.2" opacity=".25"/>
<circle class="sP" cx="413.6" cy="116.4" r="3.2" opacity=".25"/>
<circle class="sP" cx="423.2" cy="116.4" r="3.2" opacity=".25"/>
<circle class="sP" cx="432.8" cy="116.4" r="3.2" opacity=".25"/>
<circle class="sP" cx="442.4" cy="116.4" r="3.2" opacity=".25"/>
<circle class="sP" cx="452.0" cy="116.4" r="3.2" opacity=".25"/>
<circle class="sP" cx="461.6" cy="116.4" r="3.2" opacity=".25"/>
<circle class="sP" cx="471.2" cy="116.4" r="3.2" opacity=".25"/>
<circle class="sP" cx="480.8" cy="116.4" r="3.2" opacity=".25"/>
<circle class="sP" cx="490.4" cy="116.4" r="3.2" opacity=".25"/>
<circle class="sP" cx="20.0" cy="126.0" r="3.2" opacity=".25"/>
<circle class="sP" cx="29.6" cy="126.0" r="3.2" opacity=".25"/>
<circle class="sP" cx="39.2" cy="126.0" r="3.2" opacity=".25"/>
<circle class="sP" cx="48.8" cy="126.0" r="3.2" opacity=".25"/>
<circle class="sP" cx="58.4" cy="126.0" r="3.2" opacity=".25"/>
<circle class="sP" cx="68.0" cy="126.0" r="3.2" opacity=".25"/>
<circle class="sP" cx="77.6" cy="126.0" r="3.2" opacity=".25"/>
<circle class="sP" cx="87.2" cy="126.0" r="3.2" opacity=".25"/>
<circle class="sP" cx="96.8" cy="126.0" r="3.2" opacity=".25"/>
<circle class="sP" cx="106.4" cy="126.0" r="3.2" opacity=".25"/>
<circle class="sP" cx="116.0" cy="126.0" r="3.2" opacity=".25"/>
<circle class="sP" cx="125.6" cy="126.0" r="3.2" opacity=".25"/>
<circle class="sP" cx="135.2" cy="126.0" r="3.2" opacity=".25"/>
<circle class="sP" cx="144.8" cy="126.0" r="3.2" opacity=".25"/>
<circle class="sP" cx="154.4" cy="126.0" r="3.2" opacity=".25"/>
<circle class="sP" cx="164.0" cy="126.0" r="3.2" opacity=".25"/>
<circle class="sP" cx="173.6" cy="126.0" r="3.2" opacity=".25"/>
<circle class="sP" cx="183.2" cy="126.0" r="3.2" opacity=".25"/>
<circle class="sP" cx="192.8" cy="126.0" r="3.2" opacity=".25"/>
<circle class="sP" cx="202.4" cy="126.0" r="3.2" opacity=".25"/>
<circle class="sP" cx="212.0" cy="126.0" r="3.2" opacity=".25"/>
<circle class="sP" cx="221.6" cy="126.0" r="3.2" opacity=".25"/>
<circle class="sP" cx="231.2" cy="126.0" r="3.2" opacity=".25"/>
<circle class="sP" cx="240.8" cy="126.0" r="3.2" opacity=".25"/>
<circle class="sP" cx="250.4" cy="126.0" r="3.2" opacity=".25"/>
<circle class="sP" cx="260.0" cy="126.0" r="3.2" opacity=".25"/>
<circle class="sP" cx="269.6" cy="126.0" r="3.2" opacity=".25"/>
<circle class="sP" cx="279.2" cy="126.0" r="3.2" opacity=".25"/>
<circle class="sP" cx="288.8" cy="126.0" r="3.2" opacity=".25"/>
<circle class="sP" cx="298.4" cy="126.0" r="3.2" opacity=".25"/>
<circle class="sP" cx="308.0" cy="126.0" r="3.2" opacity=".25"/>
<circle class="sP" cx="317.6" cy="126.0" r="3.2" opacity=".25"/>
<circle class="sP" cx="327.2" cy="126.0" r="3.2" opacity=".25"/>
<circle class="sP" cx="336.8" cy="126.0" r="3.2" opacity=".25"/>
<circle class="sP" cx="346.4" cy="126.0" r="3.2" opacity=".25"/>
<circle class="sP" cx="356.0" cy="126.0" r="3.2" opacity=".25"/>
<circle class="sP" cx="365.6" cy="126.0" r="3.2" opacity=".25"/>
<circle class="sPw" cx="375.2" cy="126.0" r="3.2" opacity="1"/>
<circle class="sL" cx="375.2" cy="126.0" r="5.2" style="fill:none;stroke-width:1.4"/>
<circle class="sP" cx="384.8" cy="126.0" r="3.2" opacity=".25"/>
<circle class="sP" cx="394.4" cy="126.0" r="3.2" opacity=".25"/>
<circle class="sP" cx="404.0" cy="126.0" r="3.2" opacity=".25"/>
<circle class="sP" cx="413.6" cy="126.0" r="3.2" opacity=".25"/>
<circle class="sP" cx="423.2" cy="126.0" r="3.2" opacity=".25"/>
<circle class="sP" cx="432.8" cy="126.0" r="3.2" opacity=".25"/>
<circle class="sP" cx="442.4" cy="126.0" r="3.2" opacity=".25"/>
<circle class="sP" cx="452.0" cy="126.0" r="3.2" opacity=".25"/>
<circle class="sP" cx="461.6" cy="126.0" r="3.2" opacity=".25"/>
<circle class="sP" cx="471.2" cy="126.0" r="3.2" opacity=".25"/>
<circle class="sP" cx="480.8" cy="126.0" r="3.2" opacity=".25"/>
<circle class="sP" cx="490.4" cy="126.0" r="3.2" opacity=".25"/>
<circle class="sP" cx="20.0" cy="135.6" r="3.2" opacity=".25"/>
<circle class="sP" cx="29.6" cy="135.6" r="3.2" opacity=".25"/>
<circle class="sP" cx="39.2" cy="135.6" r="3.2" opacity=".25"/>
<circle class="sP" cx="48.8" cy="135.6" r="3.2" opacity=".25"/>
<circle class="sP" cx="58.4" cy="135.6" r="3.2" opacity=".25"/>
<circle class="sP" cx="68.0" cy="135.6" r="3.2" opacity=".25"/>
<circle class="sP" cx="77.6" cy="135.6" r="3.2" opacity=".25"/>
<circle class="sP" cx="87.2" cy="135.6" r="3.2" opacity=".25"/>
<circle class="sP" cx="96.8" cy="135.6" r="3.2" opacity=".25"/>
<circle class="sP" cx="106.4" cy="135.6" r="3.2" opacity=".25"/>
<circle class="sP" cx="116.0" cy="135.6" r="3.2" opacity=".25"/>
<circle class="sP" cx="125.6" cy="135.6" r="3.2" opacity=".25"/>
<circle class="sP" cx="135.2" cy="135.6" r="3.2" opacity=".25"/>
<circle class="sP" cx="144.8" cy="135.6" r="3.2" opacity=".25"/>
<circle class="sP" cx="154.4" cy="135.6" r="3.2" opacity=".25"/>
<circle class="sP" cx="164.0" cy="135.6" r="3.2" opacity=".25"/>
<circle class="sP" cx="173.6" cy="135.6" r="3.2" opacity=".25"/>
<circle class="sP" cx="183.2" cy="135.6" r="3.2" opacity=".25"/>
<circle class="sP" cx="192.8" cy="135.6" r="3.2" opacity=".25"/>
<circle class="sP" cx="202.4" cy="135.6" r="3.2" opacity=".25"/>
<circle class="sP" cx="212.0" cy="135.6" r="3.2" opacity=".25"/>
<circle class="sP" cx="221.6" cy="135.6" r="3.2" opacity=".25"/>
<circle class="sP" cx="231.2" cy="135.6" r="3.2" opacity=".25"/>
<circle class="sP" cx="240.8" cy="135.6" r="3.2" opacity=".25"/>
<circle class="sP" cx="250.4" cy="135.6" r="3.2" opacity=".25"/>
<circle class="sP" cx="260.0" cy="135.6" r="3.2" opacity=".25"/>
<circle class="sP" cx="269.6" cy="135.6" r="3.2" opacity=".25"/>
<circle class="sP" cx="279.2" cy="135.6" r="3.2" opacity=".25"/>
<circle class="sP" cx="288.8" cy="135.6" r="3.2" opacity=".25"/>
<circle class="sP" cx="298.4" cy="135.6" r="3.2" opacity=".25"/>
<circle class="sP" cx="308.0" cy="135.6" r="3.2" opacity=".25"/>
<circle class="sP" cx="317.6" cy="135.6" r="3.2" opacity=".25"/>
<circle class="sP" cx="327.2" cy="135.6" r="3.2" opacity=".25"/>
<circle class="sP" cx="336.8" cy="135.6" r="3.2" opacity=".25"/>
<circle class="sP" cx="346.4" cy="135.6" r="3.2" opacity=".25"/>
<circle class="sP" cx="356.0" cy="135.6" r="3.2" opacity=".25"/>
<circle class="sP" cx="365.6" cy="135.6" r="3.2" opacity=".25"/>
<circle class="sP" cx="375.2" cy="135.6" r="3.2" opacity=".25"/>
<circle class="sP" cx="384.8" cy="135.6" r="3.2" opacity=".25"/>
<circle class="sP" cx="394.4" cy="135.6" r="3.2" opacity=".25"/>
<circle class="sP" cx="404.0" cy="135.6" r="3.2" opacity=".25"/>
<circle class="sP" cx="413.6" cy="135.6" r="3.2" opacity=".25"/>
<circle class="sP" cx="423.2" cy="135.6" r="3.2" opacity=".25"/>
<circle class="sP" cx="432.8" cy="135.6" r="3.2" opacity=".25"/>
<circle class="sPw" cx="442.4" cy="135.6" r="3.2" opacity="1"/>
<circle class="sL" cx="442.4" cy="135.6" r="5.2" style="fill:none;stroke-width:1.4"/>
<circle class="sP" cx="452.0" cy="135.6" r="3.2" opacity=".25"/>
<circle class="sP" cx="461.6" cy="135.6" r="3.2" opacity=".25"/>
<circle class="sP" cx="471.2" cy="135.6" r="3.2" opacity=".25"/>
<circle class="sP" cx="480.8" cy="135.6" r="3.2" opacity=".25"/>
<circle class="sP" cx="490.4" cy="135.6" r="3.2" opacity=".25"/>
<circle class="sPr" cx="20.0" cy="145.2" r="3.2" opacity="1"/>
<circle class="sL" cx="20.0" cy="145.2" r="5.2" style="fill:none;stroke-width:1.4"/>
<circle class="sP" cx="29.6" cy="145.2" r="3.2" opacity=".25"/>
<circle class="sP" cx="39.2" cy="145.2" r="3.2" opacity=".25"/>
<circle class="sP" cx="48.8" cy="145.2" r="3.2" opacity=".25"/>
<circle class="sP" cx="58.4" cy="145.2" r="3.2" opacity=".25"/>
<circle class="sP" cx="68.0" cy="145.2" r="3.2" opacity=".25"/>
<circle class="sP" cx="77.6" cy="145.2" r="3.2" opacity=".25"/>
<circle class="sP" cx="87.2" cy="145.2" r="3.2" opacity=".25"/>
<circle class="sP" cx="96.8" cy="145.2" r="3.2" opacity=".25"/>
<circle class="sP" cx="106.4" cy="145.2" r="3.2" opacity=".25"/>
<circle class="sP" cx="116.0" cy="145.2" r="3.2" opacity=".25"/>
<circle class="sP" cx="125.6" cy="145.2" r="3.2" opacity=".25"/>
<circle class="sP" cx="135.2" cy="145.2" r="3.2" opacity=".25"/>
<circle class="sP" cx="144.8" cy="145.2" r="3.2" opacity=".25"/>
<circle class="sP" cx="154.4" cy="145.2" r="3.2" opacity=".25"/>
<circle class="sP" cx="164.0" cy="145.2" r="3.2" opacity=".25"/>
<circle class="sP" cx="173.6" cy="145.2" r="3.2" opacity=".25"/>
<circle class="sP" cx="183.2" cy="145.2" r="3.2" opacity=".25"/>
<circle class="sP" cx="192.8" cy="145.2" r="3.2" opacity=".25"/>
<circle class="sP" cx="202.4" cy="145.2" r="3.2" opacity=".25"/>
<circle class="sP" cx="212.0" cy="145.2" r="3.2" opacity=".25"/>
<circle class="sP" cx="221.6" cy="145.2" r="3.2" opacity=".25"/>
<circle class="sP" cx="231.2" cy="145.2" r="3.2" opacity=".25"/>
<circle class="sP" cx="240.8" cy="145.2" r="3.2" opacity=".25"/>
<circle class="sP" cx="250.4" cy="145.2" r="3.2" opacity=".25"/>
<circle class="sP" cx="260.0" cy="145.2" r="3.2" opacity=".25"/>
<circle class="sPw" cx="269.6" cy="145.2" r="3.2" opacity="1"/>
<circle class="sL" cx="269.6" cy="145.2" r="5.2" style="fill:none;stroke-width:1.4"/>
<circle class="sP" cx="279.2" cy="145.2" r="3.2" opacity=".25"/>
<circle class="sP" cx="288.8" cy="145.2" r="3.2" opacity=".25"/>
<circle class="sP" cx="298.4" cy="145.2" r="3.2" opacity=".25"/>
<circle class="sP" cx="308.0" cy="145.2" r="3.2" opacity=".25"/>
<circle class="sP" cx="317.6" cy="145.2" r="3.2" opacity=".25"/>
<circle class="sP" cx="327.2" cy="145.2" r="3.2" opacity=".25"/>
<circle class="sP" cx="336.8" cy="145.2" r="3.2" opacity=".25"/>
<circle class="sP" cx="346.4" cy="145.2" r="3.2" opacity=".25"/>
<circle class="sP" cx="356.0" cy="145.2" r="3.2" opacity=".25"/>
<circle class="sP" cx="365.6" cy="145.2" r="3.2" opacity=".25"/>
<circle class="sP" cx="375.2" cy="145.2" r="3.2" opacity=".25"/>
<circle class="sP" cx="384.8" cy="145.2" r="3.2" opacity=".25"/>
<circle class="sP" cx="394.4" cy="145.2" r="3.2" opacity=".25"/>
<circle class="sP" cx="404.0" cy="145.2" r="3.2" opacity=".25"/>
<circle class="sP" cx="413.6" cy="145.2" r="3.2" opacity=".25"/>
<circle class="sP" cx="423.2" cy="145.2" r="3.2" opacity=".25"/>
<circle class="sP" cx="432.8" cy="145.2" r="3.2" opacity=".25"/>
<circle class="sP" cx="442.4" cy="145.2" r="3.2" opacity=".25"/>
<circle class="sP" cx="452.0" cy="145.2" r="3.2" opacity=".25"/>
<circle class="sP" cx="461.6" cy="145.2" r="3.2" opacity=".25"/>
<circle class="sP" cx="471.2" cy="145.2" r="3.2" opacity=".25"/>
<circle class="sP" cx="480.8" cy="145.2" r="3.2" opacity=".25"/>
<circle class="sP" cx="490.4" cy="145.2" r="3.2" opacity=".25"/>
<circle class="sP" cx="20.0" cy="154.8" r="3.2" opacity=".25"/>
<circle class="sP" cx="29.6" cy="154.8" r="3.2" opacity=".25"/>
<circle class="sP" cx="39.2" cy="154.8" r="3.2" opacity=".25"/>
<circle class="sP" cx="48.8" cy="154.8" r="3.2" opacity=".25"/>
<circle class="sP" cx="58.4" cy="154.8" r="3.2" opacity=".25"/>
<circle class="sP" cx="68.0" cy="154.8" r="3.2" opacity=".25"/>
<circle class="sP" cx="77.6" cy="154.8" r="3.2" opacity=".25"/>
<circle class="sP" cx="87.2" cy="154.8" r="3.2" opacity=".25"/>
<circle class="sP" cx="96.8" cy="154.8" r="3.2" opacity=".25"/>
<circle class="sP" cx="106.4" cy="154.8" r="3.2" opacity=".25"/>
<circle class="sP" cx="116.0" cy="154.8" r="3.2" opacity=".25"/>
<circle class="sP" cx="125.6" cy="154.8" r="3.2" opacity=".25"/>
<circle class="sP" cx="135.2" cy="154.8" r="3.2" opacity=".25"/>
<circle class="sP" cx="144.8" cy="154.8" r="3.2" opacity=".25"/>
<circle class="sP" cx="154.4" cy="154.8" r="3.2" opacity=".25"/>
<circle class="sP" cx="164.0" cy="154.8" r="3.2" opacity=".25"/>
<circle class="sP" cx="173.6" cy="154.8" r="3.2" opacity=".25"/>
<circle class="sP" cx="183.2" cy="154.8" r="3.2" opacity=".25"/>
<circle class="sP" cx="192.8" cy="154.8" r="3.2" opacity=".25"/>
<circle class="sP" cx="202.4" cy="154.8" r="3.2" opacity=".25"/>
<circle class="sP" cx="212.0" cy="154.8" r="3.2" opacity=".25"/>
<circle class="sP" cx="221.6" cy="154.8" r="3.2" opacity=".25"/>
<circle class="sP" cx="231.2" cy="154.8" r="3.2" opacity=".25"/>
<circle class="sPr" cx="240.8" cy="154.8" r="3.2" opacity="1"/>
<circle class="sL" cx="240.8" cy="154.8" r="5.2" style="fill:none;stroke-width:1.4"/>
<circle class="sP" cx="250.4" cy="154.8" r="3.2" opacity=".25"/>
<circle class="sP" cx="260.0" cy="154.8" r="3.2" opacity=".25"/>
<circle class="sP" cx="269.6" cy="154.8" r="3.2" opacity=".25"/>
<circle class="sPw" cx="279.2" cy="154.8" r="3.2" opacity="1"/>
<circle class="sL" cx="279.2" cy="154.8" r="5.2" style="fill:none;stroke-width:1.4"/>
<circle class="sP" cx="288.8" cy="154.8" r="3.2" opacity=".25"/>
<circle class="sP" cx="298.4" cy="154.8" r="3.2" opacity=".25"/>
<circle class="sP" cx="308.0" cy="154.8" r="3.2" opacity=".25"/>
<circle class="sP" cx="317.6" cy="154.8" r="3.2" opacity=".25"/>
<circle class="sPw" cx="327.2" cy="154.8" r="3.2" opacity="1"/>
<circle class="sL" cx="327.2" cy="154.8" r="5.2" style="fill:none;stroke-width:1.4"/>
<circle class="sP" cx="336.8" cy="154.8" r="3.2" opacity=".25"/>
<circle class="sP" cx="346.4" cy="154.8" r="3.2" opacity=".25"/>
<circle class="sP" cx="356.0" cy="154.8" r="3.2" opacity=".25"/>
<circle class="sP" cx="365.6" cy="154.8" r="3.2" opacity=".25"/>
<circle class="sP" cx="375.2" cy="154.8" r="3.2" opacity=".25"/>
<circle class="sP" cx="384.8" cy="154.8" r="3.2" opacity=".25"/>
<circle class="sP" cx="394.4" cy="154.8" r="3.2" opacity=".25"/>
<circle class="sP" cx="404.0" cy="154.8" r="3.2" opacity=".25"/>
<circle class="sP" cx="413.6" cy="154.8" r="3.2" opacity=".25"/>
<circle class="sP" cx="423.2" cy="154.8" r="3.2" opacity=".25"/>
<circle class="sP" cx="432.8" cy="154.8" r="3.2" opacity=".25"/>
<circle class="sP" cx="442.4" cy="154.8" r="3.2" opacity=".25"/>
<circle class="sP" cx="452.0" cy="154.8" r="3.2" opacity=".25"/>
<circle class="sP" cx="461.6" cy="154.8" r="3.2" opacity=".25"/>
<circle class="sP" cx="471.2" cy="154.8" r="3.2" opacity=".25"/>
<circle class="sP" cx="480.8" cy="154.8" r="3.2" opacity=".25"/>
<circle class="sP" cx="490.4" cy="154.8" r="3.2" opacity=".25"/>
<circle class="sP" cx="20.0" cy="164.4" r="3.2" opacity=".25"/>
<circle class="sP" cx="29.6" cy="164.4" r="3.2" opacity=".25"/>
<circle class="sP" cx="39.2" cy="164.4" r="3.2" opacity=".25"/>
<circle class="sP" cx="48.8" cy="164.4" r="3.2" opacity=".25"/>
<circle class="sP" cx="58.4" cy="164.4" r="3.2" opacity=".25"/>
<circle class="sP" cx="68.0" cy="164.4" r="3.2" opacity=".25"/>
<circle class="sP" cx="77.6" cy="164.4" r="3.2" opacity=".25"/>
<circle class="sP" cx="87.2" cy="164.4" r="3.2" opacity=".25"/>
<circle class="sP" cx="96.8" cy="164.4" r="3.2" opacity=".25"/>
<circle class="sPr" cx="106.4" cy="164.4" r="3.2" opacity="1"/>
<circle class="sL" cx="106.4" cy="164.4" r="5.2" style="fill:none;stroke-width:1.4"/>
<circle class="sP" cx="116.0" cy="164.4" r="3.2" opacity=".25"/>
<circle class="sP" cx="125.6" cy="164.4" r="3.2" opacity=".25"/>
<circle class="sP" cx="135.2" cy="164.4" r="3.2" opacity=".25"/>
<circle class="sP" cx="144.8" cy="164.4" r="3.2" opacity=".25"/>
<circle class="sP" cx="154.4" cy="164.4" r="3.2" opacity=".25"/>
<circle class="sP" cx="164.0" cy="164.4" r="3.2" opacity=".25"/>
<circle class="sP" cx="173.6" cy="164.4" r="3.2" opacity=".25"/>
<circle class="sP" cx="183.2" cy="164.4" r="3.2" opacity=".25"/>
<circle class="sP" cx="192.8" cy="164.4" r="3.2" opacity=".25"/>
<circle class="sP" cx="202.4" cy="164.4" r="3.2" opacity=".25"/>
<circle class="sP" cx="212.0" cy="164.4" r="3.2" opacity=".25"/>
<circle class="sP" cx="221.6" cy="164.4" r="3.2" opacity=".25"/>
<circle class="sP" cx="231.2" cy="164.4" r="3.2" opacity=".25"/>
<circle class="sP" cx="240.8" cy="164.4" r="3.2" opacity=".25"/>
<circle class="sP" cx="250.4" cy="164.4" r="3.2" opacity=".25"/>
<circle class="sP" cx="260.0" cy="164.4" r="3.2" opacity=".25"/>
<circle class="sP" cx="269.6" cy="164.4" r="3.2" opacity=".25"/>
<circle class="sP" cx="279.2" cy="164.4" r="3.2" opacity=".25"/>
<circle class="sP" cx="288.8" cy="164.4" r="3.2" opacity=".25"/>
<circle class="sP" cx="298.4" cy="164.4" r="3.2" opacity=".25"/>
<circle class="sP" cx="308.0" cy="164.4" r="3.2" opacity=".25"/>
<circle class="sP" cx="317.6" cy="164.4" r="3.2" opacity=".25"/>
<circle class="sP" cx="327.2" cy="164.4" r="3.2" opacity=".25"/>
<circle class="sP" cx="336.8" cy="164.4" r="3.2" opacity=".25"/>
<circle class="sP" cx="346.4" cy="164.4" r="3.2" opacity=".25"/>
<circle class="sP" cx="356.0" cy="164.4" r="3.2" opacity=".25"/>
<circle class="sP" cx="365.6" cy="164.4" r="3.2" opacity=".25"/>
<circle class="sP" cx="375.2" cy="164.4" r="3.2" opacity=".25"/>
<circle class="sP" cx="384.8" cy="164.4" r="3.2" opacity=".25"/>
<circle class="sP" cx="394.4" cy="164.4" r="3.2" opacity=".25"/>
<circle class="sP" cx="404.0" cy="164.4" r="3.2" opacity=".25"/>
<circle class="sP" cx="413.6" cy="164.4" r="3.2" opacity=".25"/>
<circle class="sP" cx="423.2" cy="164.4" r="3.2" opacity=".25"/>
<circle class="sP" cx="432.8" cy="164.4" r="3.2" opacity=".25"/>
<circle class="sPw" cx="442.4" cy="164.4" r="3.2" opacity="1"/>
<circle class="sL" cx="442.4" cy="164.4" r="5.2" style="fill:none;stroke-width:1.4"/>
<circle class="sP" cx="452.0" cy="164.4" r="3.2" opacity=".25"/>
<circle class="sP" cx="461.6" cy="164.4" r="3.2" opacity=".25"/>
<circle class="sP" cx="471.2" cy="164.4" r="3.2" opacity=".25"/>
<circle class="sPw" cx="480.8" cy="164.4" r="3.2" opacity="1"/>
<circle class="sL" cx="480.8" cy="164.4" r="5.2" style="fill:none;stroke-width:1.4"/>
<circle class="sP" cx="490.4" cy="164.4" r="3.2" opacity=".25"/>
<circle class="sP" cx="20.0" cy="174.0" r="3.2" opacity=".25"/>
<circle class="sP" cx="29.6" cy="174.0" r="3.2" opacity=".25"/>
<circle class="sP" cx="39.2" cy="174.0" r="3.2" opacity=".25"/>
<circle class="sP" cx="48.8" cy="174.0" r="3.2" opacity=".25"/>
<circle class="sP" cx="58.4" cy="174.0" r="3.2" opacity=".25"/>
<circle class="sP" cx="68.0" cy="174.0" r="3.2" opacity=".25"/>
<circle class="sPr" cx="77.6" cy="174.0" r="3.2" opacity="1"/>
<circle class="sL" cx="77.6" cy="174.0" r="5.2" style="fill:none;stroke-width:1.4"/>
<circle class="sP" cx="87.2" cy="174.0" r="3.2" opacity=".25"/>
<circle class="sP" cx="96.8" cy="174.0" r="3.2" opacity=".25"/>
<circle class="sP" cx="106.4" cy="174.0" r="3.2" opacity=".25"/>
<circle class="sP" cx="116.0" cy="174.0" r="3.2" opacity=".25"/>
<circle class="sP" cx="125.6" cy="174.0" r="3.2" opacity=".25"/>
<circle class="sP" cx="135.2" cy="174.0" r="3.2" opacity=".25"/>
<circle class="sP" cx="144.8" cy="174.0" r="3.2" opacity=".25"/>
<circle class="sP" cx="154.4" cy="174.0" r="3.2" opacity=".25"/>
<circle class="sP" cx="164.0" cy="174.0" r="3.2" opacity=".25"/>
<circle class="sP" cx="173.6" cy="174.0" r="3.2" opacity=".25"/>
<circle class="sP" cx="183.2" cy="174.0" r="3.2" opacity=".25"/>
<circle class="sP" cx="192.8" cy="174.0" r="3.2" opacity=".25"/>
<circle class="sP" cx="202.4" cy="174.0" r="3.2" opacity=".25"/>
<circle class="sP" cx="212.0" cy="174.0" r="3.2" opacity=".25"/>
<circle class="sP" cx="221.6" cy="174.0" r="3.2" opacity=".25"/>
<circle class="sP" cx="231.2" cy="174.0" r="3.2" opacity=".25"/>
<circle class="sP" cx="240.8" cy="174.0" r="3.2" opacity=".25"/>
<circle class="sP" cx="250.4" cy="174.0" r="3.2" opacity=".25"/>
<circle class="sP" cx="260.0" cy="174.0" r="3.2" opacity=".25"/>
<circle class="sPw" cx="269.6" cy="174.0" r="3.2" opacity="1"/>
<circle class="sL" cx="269.6" cy="174.0" r="5.2" style="fill:none;stroke-width:1.4"/>
<circle class="sP" cx="279.2" cy="174.0" r="3.2" opacity=".25"/>
<circle class="sP" cx="288.8" cy="174.0" r="3.2" opacity=".25"/>
<circle class="sP" cx="298.4" cy="174.0" r="3.2" opacity=".25"/>
<circle class="sP" cx="308.0" cy="174.0" r="3.2" opacity=".25"/>
<circle class="sP" cx="317.6" cy="174.0" r="3.2" opacity=".25"/>
<circle class="sP" cx="327.2" cy="174.0" r="3.2" opacity=".25"/>
<circle class="sP" cx="336.8" cy="174.0" r="3.2" opacity=".25"/>
<circle class="sP" cx="346.4" cy="174.0" r="3.2" opacity=".25"/>
<circle class="sP" cx="356.0" cy="174.0" r="3.2" opacity=".25"/>
<circle class="sP" cx="365.6" cy="174.0" r="3.2" opacity=".25"/>
<circle class="sP" cx="375.2" cy="174.0" r="3.2" opacity=".25"/>
<circle class="sP" cx="384.8" cy="174.0" r="3.2" opacity=".25"/>
<circle class="sP" cx="394.4" cy="174.0" r="3.2" opacity=".25"/>
<circle class="sP" cx="404.0" cy="174.0" r="3.2" opacity=".25"/>
<circle class="sP" cx="413.6" cy="174.0" r="3.2" opacity=".25"/>
<circle class="sP" cx="423.2" cy="174.0" r="3.2" opacity=".25"/>
<circle class="sP" cx="432.8" cy="174.0" r="3.2" opacity=".25"/>
<circle class="sP" cx="442.4" cy="174.0" r="3.2" opacity=".25"/>
<circle class="sP" cx="452.0" cy="174.0" r="3.2" opacity=".25"/>
<circle class="sP" cx="461.6" cy="174.0" r="3.2" opacity=".25"/>
<circle class="sP" cx="471.2" cy="174.0" r="3.2" opacity=".25"/>
<circle class="sP" cx="480.8" cy="174.0" r="3.2" opacity=".25"/>
<circle class="sP" cx="490.4" cy="174.0" r="3.2" opacity=".25"/>
<circle class="sP" cx="20.0" cy="183.6" r="3.2" opacity=".25"/>
<circle class="sP" cx="29.6" cy="183.6" r="3.2" opacity=".25"/>
<circle class="sP" cx="39.2" cy="183.6" r="3.2" opacity=".25"/>
<circle class="sP" cx="48.8" cy="183.6" r="3.2" opacity=".25"/>
<circle class="sP" cx="58.4" cy="183.6" r="3.2" opacity=".25"/>
<circle class="sP" cx="68.0" cy="183.6" r="3.2" opacity=".25"/>
<circle class="sP" cx="77.6" cy="183.6" r="3.2" opacity=".25"/>
<circle class="sP" cx="87.2" cy="183.6" r="3.2" opacity=".25"/>
<circle class="sP" cx="96.8" cy="183.6" r="3.2" opacity=".25"/>
<circle class="sP" cx="106.4" cy="183.6" r="3.2" opacity=".25"/>
<circle class="sP" cx="116.0" cy="183.6" r="3.2" opacity=".25"/>
<circle class="sP" cx="125.6" cy="183.6" r="3.2" opacity=".25"/>
<circle class="sPw" cx="135.2" cy="183.6" r="3.2" opacity="1"/>
<circle class="sL" cx="135.2" cy="183.6" r="5.2" style="fill:none;stroke-width:1.4"/>
<circle class="sP" cx="144.8" cy="183.6" r="3.2" opacity=".25"/>
<circle class="sP" cx="154.4" cy="183.6" r="3.2" opacity=".25"/>
<circle class="sP" cx="164.0" cy="183.6" r="3.2" opacity=".25"/>
<circle class="sP" cx="173.6" cy="183.6" r="3.2" opacity=".25"/>
<circle class="sP" cx="183.2" cy="183.6" r="3.2" opacity=".25"/>
<circle class="sP" cx="192.8" cy="183.6" r="3.2" opacity=".25"/>
<circle class="sP" cx="202.4" cy="183.6" r="3.2" opacity=".25"/>
<circle class="sP" cx="212.0" cy="183.6" r="3.2" opacity=".25"/>
<circle class="sP" cx="221.6" cy="183.6" r="3.2" opacity=".25"/>
<circle class="sP" cx="231.2" cy="183.6" r="3.2" opacity=".25"/>
<circle class="sP" cx="240.8" cy="183.6" r="3.2" opacity=".25"/>
<circle class="sP" cx="250.4" cy="183.6" r="3.2" opacity=".25"/>
<circle class="sP" cx="260.0" cy="183.6" r="3.2" opacity=".25"/>
<circle class="sP" cx="269.6" cy="183.6" r="3.2" opacity=".25"/>
<circle class="sP" cx="279.2" cy="183.6" r="3.2" opacity=".25"/>
<circle class="sP" cx="288.8" cy="183.6" r="3.2" opacity=".25"/>
<circle class="sP" cx="298.4" cy="183.6" r="3.2" opacity=".25"/>
<circle class="sP" cx="308.0" cy="183.6" r="3.2" opacity=".25"/>
<circle class="sP" cx="317.6" cy="183.6" r="3.2" opacity=".25"/>
<circle class="sP" cx="327.2" cy="183.6" r="3.2" opacity=".25"/>
<circle class="sP" cx="336.8" cy="183.6" r="3.2" opacity=".25"/>
<circle class="sP" cx="346.4" cy="183.6" r="3.2" opacity=".25"/>
<circle class="sP" cx="356.0" cy="183.6" r="3.2" opacity=".25"/>
<circle class="sP" cx="365.6" cy="183.6" r="3.2" opacity=".25"/>
<circle class="sP" cx="375.2" cy="183.6" r="3.2" opacity=".25"/>
<circle class="sP" cx="384.8" cy="183.6" r="3.2" opacity=".25"/>
<circle class="sP" cx="394.4" cy="183.6" r="3.2" opacity=".25"/>
<circle class="sP" cx="404.0" cy="183.6" r="3.2" opacity=".25"/>
<circle class="sP" cx="413.6" cy="183.6" r="3.2" opacity=".25"/>
<circle class="sP" cx="423.2" cy="183.6" r="3.2" opacity=".25"/>
<circle class="sP" cx="432.8" cy="183.6" r="3.2" opacity=".25"/>
<circle class="sP" cx="442.4" cy="183.6" r="3.2" opacity=".25"/>
<circle class="sP" cx="452.0" cy="183.6" r="3.2" opacity=".25"/>
<circle class="sP" cx="461.6" cy="183.6" r="3.2" opacity=".25"/>
<circle class="sP" cx="471.2" cy="183.6" r="3.2" opacity=".25"/>
<circle class="sP" cx="480.8" cy="183.6" r="3.2" opacity=".25"/>
<circle class="sP" cx="490.4" cy="183.6" r="3.2" opacity=".25"/>
<circle class="sP" cx="20.0" cy="193.2" r="3.2" opacity=".25"/>
<circle class="sP" cx="29.6" cy="193.2" r="3.2" opacity=".25"/>
<circle class="sP" cx="39.2" cy="193.2" r="3.2" opacity=".25"/>
<circle class="sP" cx="48.8" cy="193.2" r="3.2" opacity=".25"/>
<circle class="sP" cx="58.4" cy="193.2" r="3.2" opacity=".25"/>
<circle class="sP" cx="68.0" cy="193.2" r="3.2" opacity=".25"/>
<circle class="sP" cx="77.6" cy="193.2" r="3.2" opacity=".25"/>
<circle class="sP" cx="87.2" cy="193.2" r="3.2" opacity=".25"/>
<circle class="sP" cx="96.8" cy="193.2" r="3.2" opacity=".25"/>
<circle class="sP" cx="106.4" cy="193.2" r="3.2" opacity=".25"/>
<circle class="sP" cx="116.0" cy="193.2" r="3.2" opacity=".25"/>
<circle class="sP" cx="125.6" cy="193.2" r="3.2" opacity=".25"/>
<circle class="sP" cx="135.2" cy="193.2" r="3.2" opacity=".25"/>
<circle class="sP" cx="144.8" cy="193.2" r="3.2" opacity=".25"/>
<circle class="sP" cx="154.4" cy="193.2" r="3.2" opacity=".25"/>
<circle class="sP" cx="164.0" cy="193.2" r="3.2" opacity=".25"/>
<circle class="sP" cx="173.6" cy="193.2" r="3.2" opacity=".25"/>
<circle class="sP" cx="183.2" cy="193.2" r="3.2" opacity=".25"/>
<circle class="sP" cx="192.8" cy="193.2" r="3.2" opacity=".25"/>
<circle class="sP" cx="202.4" cy="193.2" r="3.2" opacity=".25"/>
<circle class="sP" cx="212.0" cy="193.2" r="3.2" opacity=".25"/>
<circle class="sP" cx="221.6" cy="193.2" r="3.2" opacity=".25"/>
<circle class="sP" cx="231.2" cy="193.2" r="3.2" opacity=".25"/>
<circle class="sP" cx="240.8" cy="193.2" r="3.2" opacity=".25"/>
<circle class="sP" cx="250.4" cy="193.2" r="3.2" opacity=".25"/>
<circle class="sP" cx="260.0" cy="193.2" r="3.2" opacity=".25"/>
<circle class="sP" cx="269.6" cy="193.2" r="3.2" opacity=".25"/>
<circle class="sP" cx="279.2" cy="193.2" r="3.2" opacity=".25"/>
<circle class="sP" cx="288.8" cy="193.2" r="3.2" opacity=".25"/>
<circle class="sP" cx="298.4" cy="193.2" r="3.2" opacity=".25"/>
<circle class="sP" cx="308.0" cy="193.2" r="3.2" opacity=".25"/>
<circle class="sP" cx="317.6" cy="193.2" r="3.2" opacity=".25"/>
<circle class="sP" cx="327.2" cy="193.2" r="3.2" opacity=".25"/>
<circle class="sP" cx="336.8" cy="193.2" r="3.2" opacity=".25"/>
<circle class="sP" cx="346.4" cy="193.2" r="3.2" opacity=".25"/>
<circle class="sP" cx="356.0" cy="193.2" r="3.2" opacity=".25"/>
<circle class="sP" cx="365.6" cy="193.2" r="3.2" opacity=".25"/>
<circle class="sP" cx="375.2" cy="193.2" r="3.2" opacity=".25"/>
<circle class="sP" cx="384.8" cy="193.2" r="3.2" opacity=".25"/>
<circle class="sP" cx="394.4" cy="193.2" r="3.2" opacity=".25"/>
<circle class="sP" cx="404.0" cy="193.2" r="3.2" opacity=".25"/>
<circle class="sP" cx="413.6" cy="193.2" r="3.2" opacity=".25"/>
<circle class="sP" cx="423.2" cy="193.2" r="3.2" opacity=".25"/>
<circle class="sP" cx="432.8" cy="193.2" r="3.2" opacity=".25"/>
<circle class="sP" cx="442.4" cy="193.2" r="3.2" opacity=".25"/>
<circle class="sP" cx="452.0" cy="193.2" r="3.2" opacity=".25"/>
<circle class="sP" cx="461.6" cy="193.2" r="3.2" opacity=".25"/>
<circle class="sP" cx="471.2" cy="193.2" r="3.2" opacity=".25"/>
<circle class="sP" cx="480.8" cy="193.2" r="3.2" opacity=".25"/>
<circle class="sP" cx="490.4" cy="193.2" r="3.2" opacity=".25"/>
<circle class="sP" cx="20.0" cy="202.8" r="3.2" opacity=".25"/>
<circle class="sP" cx="29.6" cy="202.8" r="3.2" opacity=".25"/>
<circle class="sP" cx="39.2" cy="202.8" r="3.2" opacity=".25"/>
<circle class="sP" cx="48.8" cy="202.8" r="3.2" opacity=".25"/>
<circle class="sP" cx="58.4" cy="202.8" r="3.2" opacity=".25"/>
<circle class="sP" cx="68.0" cy="202.8" r="3.2" opacity=".25"/>
<circle class="sP" cx="77.6" cy="202.8" r="3.2" opacity=".25"/>
<circle class="sP" cx="87.2" cy="202.8" r="3.2" opacity=".25"/>
<circle class="sP" cx="96.8" cy="202.8" r="3.2" opacity=".25"/>
<circle class="sP" cx="106.4" cy="202.8" r="3.2" opacity=".25"/>
<circle class="sP" cx="116.0" cy="202.8" r="3.2" opacity=".25"/>
<circle class="sP" cx="125.6" cy="202.8" r="3.2" opacity=".25"/>
<circle class="sP" cx="135.2" cy="202.8" r="3.2" opacity=".25"/>
<circle class="sP" cx="144.8" cy="202.8" r="3.2" opacity=".25"/>
<circle class="sP" cx="154.4" cy="202.8" r="3.2" opacity=".25"/>
<circle class="sP" cx="164.0" cy="202.8" r="3.2" opacity=".25"/>
<circle class="sP" cx="173.6" cy="202.8" r="3.2" opacity=".25"/>
<circle class="sP" cx="183.2" cy="202.8" r="3.2" opacity=".25"/>
<circle class="sP" cx="192.8" cy="202.8" r="3.2" opacity=".25"/>
<circle class="sP" cx="202.4" cy="202.8" r="3.2" opacity=".25"/>
<circle class="sP" cx="212.0" cy="202.8" r="3.2" opacity=".25"/>
<circle class="sP" cx="221.6" cy="202.8" r="3.2" opacity=".25"/>
<circle class="sP" cx="231.2" cy="202.8" r="3.2" opacity=".25"/>
<circle class="sP" cx="240.8" cy="202.8" r="3.2" opacity=".25"/>
<circle class="sP" cx="250.4" cy="202.8" r="3.2" opacity=".25"/>
<circle class="sP" cx="260.0" cy="202.8" r="3.2" opacity=".25"/>
<circle class="sP" cx="269.6" cy="202.8" r="3.2" opacity=".25"/>
<circle class="sP" cx="279.2" cy="202.8" r="3.2" opacity=".25"/>
<circle class="sP" cx="288.8" cy="202.8" r="3.2" opacity=".25"/>
<circle class="sP" cx="298.4" cy="202.8" r="3.2" opacity=".25"/>
<circle class="sP" cx="308.0" cy="202.8" r="3.2" opacity=".25"/>
<circle class="sP" cx="317.6" cy="202.8" r="3.2" opacity=".25"/>
<circle class="sP" cx="327.2" cy="202.8" r="3.2" opacity=".25"/>
<circle class="sP" cx="336.8" cy="202.8" r="3.2" opacity=".25"/>
<circle class="sP" cx="346.4" cy="202.8" r="3.2" opacity=".25"/>
<circle class="sP" cx="356.0" cy="202.8" r="3.2" opacity=".25"/>
<circle class="sP" cx="365.6" cy="202.8" r="3.2" opacity=".25"/>
<circle class="sP" cx="375.2" cy="202.8" r="3.2" opacity=".25"/>
<circle class="sP" cx="384.8" cy="202.8" r="3.2" opacity=".25"/>
<circle class="sP" cx="394.4" cy="202.8" r="3.2" opacity=".25"/>
<circle class="sP" cx="404.0" cy="202.8" r="3.2" opacity=".25"/>
<circle class="sP" cx="413.6" cy="202.8" r="3.2" opacity=".25"/>
<circle class="sP" cx="423.2" cy="202.8" r="3.2" opacity=".25"/>
<circle class="sP" cx="432.8" cy="202.8" r="3.2" opacity=".25"/>
<circle class="sP" cx="442.4" cy="202.8" r="3.2" opacity=".25"/>
<circle class="sP" cx="452.0" cy="202.8" r="3.2" opacity=".25"/>
<circle class="sP" cx="461.6" cy="202.8" r="3.2" opacity=".25"/>
<circle class="sP" cx="471.2" cy="202.8" r="3.2" opacity=".25"/>
<circle class="sP" cx="480.8" cy="202.8" r="3.2" opacity=".25"/>
<circle class="sP" cx="490.4" cy="202.8" r="3.2" opacity=".25"/>
<circle class="sP" cx="20.0" cy="212.4" r="3.2" opacity=".25"/>
<circle class="sP" cx="29.6" cy="212.4" r="3.2" opacity=".25"/>
<circle class="sP" cx="39.2" cy="212.4" r="3.2" opacity=".25"/>
<circle class="sP" cx="48.8" cy="212.4" r="3.2" opacity=".25"/>
<circle class="sP" cx="58.4" cy="212.4" r="3.2" opacity=".25"/>
<circle class="sP" cx="68.0" cy="212.4" r="3.2" opacity=".25"/>
<circle class="sP" cx="77.6" cy="212.4" r="3.2" opacity=".25"/>
<circle class="sP" cx="87.2" cy="212.4" r="3.2" opacity=".25"/>
<circle class="sP" cx="96.8" cy="212.4" r="3.2" opacity=".25"/>
<circle class="sP" cx="106.4" cy="212.4" r="3.2" opacity=".25"/>
<circle class="sP" cx="116.0" cy="212.4" r="3.2" opacity=".25"/>
<circle class="sP" cx="125.6" cy="212.4" r="3.2" opacity=".25"/>
<circle class="sP" cx="135.2" cy="212.4" r="3.2" opacity=".25"/>
<circle class="sP" cx="144.8" cy="212.4" r="3.2" opacity=".25"/>
<circle class="sP" cx="154.4" cy="212.4" r="3.2" opacity=".25"/>
<circle class="sP" cx="164.0" cy="212.4" r="3.2" opacity=".25"/>
<circle class="sP" cx="173.6" cy="212.4" r="3.2" opacity=".25"/>
<circle class="sP" cx="183.2" cy="212.4" r="3.2" opacity=".25"/>
<circle class="sP" cx="192.8" cy="212.4" r="3.2" opacity=".25"/>
<circle class="sP" cx="202.4" cy="212.4" r="3.2" opacity=".25"/>
<circle class="sP" cx="212.0" cy="212.4" r="3.2" opacity=".25"/>
<circle class="sP" cx="221.6" cy="212.4" r="3.2" opacity=".25"/>
<circle class="sP" cx="231.2" cy="212.4" r="3.2" opacity=".25"/>
<circle class="sP" cx="240.8" cy="212.4" r="3.2" opacity=".25"/>
<circle class="sP" cx="250.4" cy="212.4" r="3.2" opacity=".25"/>
<circle class="sP" cx="260.0" cy="212.4" r="3.2" opacity=".25"/>
<circle class="sP" cx="269.6" cy="212.4" r="3.2" opacity=".25"/>
<circle class="sP" cx="279.2" cy="212.4" r="3.2" opacity=".25"/>
<circle class="sP" cx="288.8" cy="212.4" r="3.2" opacity=".25"/>
<circle class="sP" cx="298.4" cy="212.4" r="3.2" opacity=".25"/>
<circle class="sP" cx="308.0" cy="212.4" r="3.2" opacity=".25"/>
<circle class="sP" cx="317.6" cy="212.4" r="3.2" opacity=".25"/>
<circle class="sP" cx="327.2" cy="212.4" r="3.2" opacity=".25"/>
<circle class="sP" cx="336.8" cy="212.4" r="3.2" opacity=".25"/>
<circle class="sP" cx="346.4" cy="212.4" r="3.2" opacity=".25"/>
<circle class="sP" cx="356.0" cy="212.4" r="3.2" opacity=".25"/>
<circle class="sP" cx="365.6" cy="212.4" r="3.2" opacity=".25"/>
<circle class="sP" cx="375.2" cy="212.4" r="3.2" opacity=".25"/>
<circle class="sP" cx="384.8" cy="212.4" r="3.2" opacity=".25"/>
<circle class="sP" cx="394.4" cy="212.4" r="3.2" opacity=".25"/>
<circle class="sP" cx="404.0" cy="212.4" r="3.2" opacity=".25"/>
<circle class="sP" cx="413.6" cy="212.4" r="3.2" opacity=".25"/>
<circle class="sP" cx="423.2" cy="212.4" r="3.2" opacity=".25"/>
<circle class="sP" cx="432.8" cy="212.4" r="3.2" opacity=".25"/>
<circle class="sP" cx="442.4" cy="212.4" r="3.2" opacity=".25"/>
<circle class="sP" cx="452.0" cy="212.4" r="3.2" opacity=".25"/>
<circle class="sP" cx="461.6" cy="212.4" r="3.2" opacity=".25"/>
<circle class="sP" cx="471.2" cy="212.4" r="3.2" opacity=".25"/>
<circle class="sP" cx="480.8" cy="212.4" r="3.2" opacity=".25"/>
<circle class="sP" cx="490.4" cy="212.4" r="3.2" opacity=".25"/>
<text class="sM" x="14" y="20">1,000 SIMs: 5 fraudulent (red), 20 genuine but flagged (amber); rings = flagged</text>
<rect class="sN" x="520" y="30" width="186" height="186" rx="8"/>
<text class="sT" x="613" y="54" text-anchor="middle">of the flagged SIMs</text>
<text class="sC" x="613" y="84" text-anchor="middle">5 fraud + 20 genuine</text><text class="sC" x="613" y="104" text-anchor="middle">= 25 flagged</text>
<text class="sRt" x="613" y="138" text-anchor="middle">P(fraud | flag) = 5/25</text><text class="sRt" x="613" y="158" text-anchor="middle">≈ 20%</text>
<text class="sS" x="613" y="190" text-anchor="middle">the 2% of 995 genuine</text><text class="sS" x="613" y="206" text-anchor="middle">swamps 99% of 5 frauds</text>
</svg><figcaption>Bayes as counting: with a 0.5% base rate, a 99%-sensitive detector with a 2% false-positive rate is right about one flag in five.</figcaption></figure>

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

<figure class="dia"><svg viewBox="0 0 720 248" role="img" aria-label="Six small charts of common distributions: a binomial with 20 trials, a Poisson with mean 4, a geometric with a long tail, an exponential decay, the bell-shaped normal and a right-skewed log-normal">
<text class="sT" x="124" y="28" text-anchor="middle">Binomial(20, 0.3)</text><line class="sLm" x1="14" y1="110" x2="234" y2="110"/>
<rect class="sB" x="15" y="109.709" width="8.47619" height="0.291457" rx="1"/>
<rect class="sB" x="25.4762" y="107.502" width="8.47619" height="2.49821" rx="1"/>
<rect class="sB" x="35.9524" y="99.8287" width="8.47619" height="10.1713" rx="1"/>
<rect class="sB" x="46.4286" y="83.8453" width="8.47619" height="26.1547" rx="1"/>
<rect class="sB" x="56.9048" y="62.3611" width="8.47619" height="47.6389" rx="1"/>
<rect class="sB" x="67.381" y="44.6667" width="8.47619" height="65.3333" rx="1"/>
<rect class="sB" x="77.8571" y="40" width="8.47619" height="70" rx="1"/>
<rect class="sB" x="88.3333" y="50" width="8.47619" height="60" rx="1"/>
<rect class="sB" x="98.8095" y="68.2143" width="8.47619" height="41.7857" rx="1"/>
<rect class="sB" x="109.286" y="86.1224" width="8.47619" height="23.8776" rx="1"/>
<rect class="sB" x="119.762" y="98.7434" width="8.47619" height="11.2566" rx="1"/>
<rect class="sB" x="130.238" y="105.614" width="8.47619" height="4.38567" rx="1"/>
<rect class="sB" x="140.714" y="108.59" width="8.47619" height="1.40968" rx="1"/>
<rect class="sB" x="151.19" y="109.628" width="8.47619" height="0.371784" rx="1"/>
<rect class="sB" x="161.667" y="109.92" width="8.47619" height="0.079668" rx="1"/>
<rect class="sB" x="172.143" y="109.986" width="8.47619" height="0.0136574" rx="1"/>
<rect class="sB" x="182.619" y="109.998" width="8.47619" height="0.00182911" rx="1"/>
<rect class="sB" x="193.095" y="110" width="8.47619" height="0.000184448" rx="1"/>
<rect class="sB" x="203.571" y="110" width="8.47619" height="1.31749e-05" rx="1"/>
<rect class="sB" x="214.048" y="110" width="8.47619" height="5.94355e-07" rx="1"/>
<rect class="sB" x="224.524" y="110" width="8.47619" height="1.27362e-08" rx="1"/>
<text class="sS" x="124" y="126" text-anchor="middle">mean 6, var 4.2</text>
<text class="sT" x="360" y="28" text-anchor="middle">Poisson(4)</text><line class="sLm" x1="250" y1="110" x2="470" y2="110"/>
<rect class="sB" x="251" y="103.438" width="12.6667" height="6.5625" rx="1"/>
<rect class="sB" x="265.667" y="83.75" width="12.6667" height="26.25" rx="1"/>
<rect class="sB" x="280.333" y="57.5" width="12.6667" height="52.5" rx="1"/>
<rect class="sB" x="295" y="40" width="12.6667" height="70" rx="1"/>
<rect class="sB" x="309.667" y="40" width="12.6667" height="70" rx="1"/>
<rect class="sB" x="324.333" y="54" width="12.6667" height="56" rx="1"/>
<rect class="sB" x="339" y="72.6667" width="12.6667" height="37.3333" rx="1"/>
<rect class="sB" x="353.667" y="88.6667" width="12.6667" height="21.3333" rx="1"/>
<rect class="sB" x="368.333" y="99.3333" width="12.6667" height="10.6667" rx="1"/>
<rect class="sB" x="383" y="105.259" width="12.6667" height="4.74074" rx="1"/>
<rect class="sB" x="397.667" y="108.104" width="12.6667" height="1.8963" rx="1"/>
<rect class="sB" x="412.333" y="109.31" width="12.6667" height="0.689562" rx="1"/>
<rect class="sB" x="427" y="109.77" width="12.6667" height="0.229854" rx="1"/>
<rect class="sB" x="441.667" y="109.929" width="12.6667" height="0.0707243" rx="1"/>
<rect class="sB" x="456.333" y="109.98" width="12.6667" height="0.020207" rx="1"/>
<text class="sS" x="360" y="126" text-anchor="middle">mean 4 = var 4</text>
<text class="sT" x="596" y="28" text-anchor="middle">Geometric(0.3)</text><line class="sLm" x1="486" y1="110" x2="706" y2="110"/>
<rect class="sB" x="487" y="40" width="12.6667" height="70" rx="1"/>
<rect class="sB" x="501.667" y="61" width="12.6667" height="49" rx="1"/>
<rect class="sB" x="516.333" y="75.7" width="12.6667" height="34.3" rx="1"/>
<rect class="sB" x="531" y="85.99" width="12.6667" height="24.01" rx="1"/>
<rect class="sB" x="545.667" y="93.193" width="12.6667" height="16.807" rx="1"/>
<rect class="sB" x="560.333" y="98.2351" width="12.6667" height="11.7649" rx="1"/>
<rect class="sB" x="575" y="101.765" width="12.6667" height="8.23543" rx="1"/>
<rect class="sB" x="589.667" y="104.235" width="12.6667" height="5.7648" rx="1"/>
<rect class="sB" x="604.333" y="105.965" width="12.6667" height="4.03536" rx="1"/>
<rect class="sB" x="619" y="107.175" width="12.6667" height="2.82475" rx="1"/>
<rect class="sB" x="633.667" y="108.023" width="12.6667" height="1.97733" rx="1"/>
<rect class="sB" x="648.333" y="108.616" width="12.6667" height="1.38413" rx="1"/>
<rect class="sB" x="663" y="109.031" width="12.6667" height="0.96889" rx="1"/>
<rect class="sB" x="677.667" y="109.322" width="12.6667" height="0.678223" rx="1"/>
<rect class="sB" x="692.333" y="109.525" width="12.6667" height="0.474756" rx="1"/>
<text class="sS" x="596" y="126" text-anchor="middle">mean 3.3, long tail</text>
<text class="sT" x="124" y="144" text-anchor="middle">Exponential(0.5)</text><line class="sLm" x1="14" y1="226" x2="234" y2="226"/>
<polyline class="sLv" points="14.0,156.0 15.8,159.4 17.7,162.7 19.5,165.8 21.3,168.7 23.2,171.5 25.0,174.1 26.8,176.7 28.7,179.1 30.5,181.4 32.3,183.5 34.2,185.6 36.0,187.6 37.8,189.5 39.7,191.2 41.5,192.9 43.3,194.5 45.2,196.1 47.0,197.5 48.8,198.9 50.7,200.2 52.5,201.5 54.3,202.7 56.2,203.8 58.0,204.9 59.8,205.9 61.7,206.9 63.5,207.9 65.3,208.7 67.2,209.6 69.0,210.4 70.8,211.1 72.7,211.9 74.5,212.6 76.3,213.2 78.2,213.8 80.0,214.4 81.8,215.0 83.7,215.5 85.5,216.0 87.3,216.5 89.2,217.0 91.0,217.4 92.8,217.8 94.7,218.2 96.5,218.6 98.3,219.0 100.2,219.3 102.0,219.6 103.8,220.0 105.7,220.3 107.5,220.5 109.3,220.8 111.2,221.1 113.0,221.3 114.8,221.5 116.7,221.7 118.5,222.0 120.3,222.1 122.2,222.3 124.0,222.5 125.8,222.7 127.7,222.8 129.5,223.0 131.3,223.1 133.2,223.3 135.0,223.4 136.8,223.5 138.7,223.7 140.5,223.8 142.3,223.9 144.2,224.0 146.0,224.1 147.8,224.2 149.7,224.3 151.5,224.4 153.3,224.4 155.2,224.5 157.0,224.6 158.8,224.7 160.7,224.7 162.5,224.8 164.3,224.8 166.2,224.9 168.0,225.0 169.8,225.0 171.7,225.1 173.5,225.1 175.3,225.1 177.2,225.2 179.0,225.2 180.8,225.3 182.7,225.3 184.5,225.3 186.3,225.4 188.2,225.4 190.0,225.4 191.8,225.5 193.7,225.5 195.5,225.5 197.3,225.5 199.2,225.6 201.0,225.6 202.8,225.6 204.7,225.6 206.5,225.6 208.3,225.7 210.2,225.7 212.0,225.7 213.8,225.7 215.7,225.7 217.5,225.7 219.3,225.7 221.2,225.8 223.0,225.8 224.8,225.8 226.7,225.8 228.5,225.8 230.3,225.8 232.2,225.8 234.0,225.8" style="stroke-width:2.2"/>
<text class="sS" x="124" y="242" text-anchor="middle">memoryless waits</text>
<text class="sT" x="360" y="144" text-anchor="middle">Normal(0, 1)</text><line class="sLm" x1="250" y1="226" x2="470" y2="226"/>
<polyline class="sLv" points="250.0,226.0 252.8,226.0 255.5,225.9 258.2,225.9 261.0,225.9 263.8,225.8 266.5,225.8 269.2,225.7 272.0,225.6 274.8,225.4 277.5,225.2 280.2,225.0 283.0,224.6 285.8,224.2 288.5,223.6 291.2,222.9 294.0,222.1 296.8,221.0 299.5,219.8 302.2,218.3 305.0,216.5 307.8,214.5 310.5,212.1 313.2,209.5 316.0,206.5 318.8,203.3 321.5,199.7 324.2,195.9 327.0,191.9 329.8,187.8 332.5,183.5 335.2,179.3 338.0,175.2 340.8,171.2 343.5,167.5 346.2,164.2 349.0,161.4 351.8,159.1 354.5,157.4 357.2,156.3 360.0,156.0 362.8,156.3 365.5,157.4 368.2,159.1 371.0,161.4 373.8,164.2 376.5,167.5 379.2,171.2 382.0,175.2 384.8,179.3 387.5,183.5 390.2,187.8 393.0,191.9 395.8,195.9 398.5,199.7 401.2,203.3 404.0,206.5 406.8,209.5 409.5,212.1 412.2,214.5 415.0,216.5 417.8,218.3 420.5,219.8 423.2,221.0 426.0,222.1 428.8,222.9 431.5,223.6 434.2,224.2 437.0,224.6 439.8,225.0 442.5,225.2 445.2,225.4 448.0,225.6 450.8,225.7 453.5,225.8 456.2,225.8 459.0,225.9 461.8,225.9 464.5,225.9 467.2,226.0 470.0,226.0" style="stroke-width:2.2"/>
<text class="sS" x="360" y="242" text-anchor="middle">68 / 95 / 99.7</text>
<text class="sT" x="596" y="144" text-anchor="middle">Log-normal(0, 0.8)</text><line class="sLm" x1="486" y1="226" x2="706" y2="226"/>
<polyline class="sLv" points="486.0,226.0 487.8,225.1 489.7,217.9 491.5,205.6 493.3,192.4 495.2,180.6 497.0,171.3 498.8,164.5 500.7,160.0 502.5,157.3 504.3,156.1 506.2,156.0 508.0,156.8 509.8,158.3 511.7,160.2 513.5,162.4 515.3,164.8 517.2,167.3 519.0,169.9 520.8,172.5 522.7,175.1 524.5,177.6 526.3,180.1 528.2,182.4 530.0,184.7 531.8,186.8 533.7,188.9 535.5,190.9 537.3,192.7 539.2,194.5 541.0,196.2 542.8,197.7 544.7,199.2 546.5,200.6 548.3,202.0 550.2,203.2 552.0,204.4 553.8,205.5 555.7,206.6 557.5,207.6 559.3,208.5 561.2,209.4 563.0,210.2 564.8,211.0 566.7,211.8 568.5,212.5 570.3,213.1 572.2,213.8 574.0,214.3 575.8,214.9 577.7,215.4 579.5,215.9 581.3,216.4 583.2,216.9 585.0,217.3 586.8,217.7 588.7,218.1 590.5,218.4 592.3,218.8 594.2,219.1 596.0,219.4 597.8,219.7 599.7,220.0 601.5,220.2 603.3,220.5 605.2,220.7 607.0,220.9 608.8,221.1 610.7,221.4 612.5,221.5 614.3,221.7 616.2,221.9 618.0,222.1 619.8,222.2 621.7,222.4 623.5,222.5 625.3,222.7 627.2,222.8 629.0,222.9 630.8,223.0 632.7,223.2 634.5,223.3 636.3,223.4 638.2,223.5 640.0,223.6 641.8,223.7 643.7,223.8 645.5,223.8 647.3,223.9 649.2,224.0 651.0,224.1 652.8,224.1 654.7,224.2 656.5,224.3 658.3,224.3 660.2,224.4 662.0,224.4 663.8,224.5 665.7,224.6 667.5,224.6 669.3,224.7 671.2,224.7 673.0,224.7 674.8,224.8 676.7,224.8 678.5,224.9 680.3,224.9 682.2,224.9 684.0,225.0 685.8,225.0 687.7,225.0 689.5,225.1 691.3,225.1 693.2,225.1 695.0,225.2 696.8,225.2 698.7,225.2 700.5,225.2 702.3,225.3 704.2,225.3 706.0,225.3" style="stroke-width:2.2"/>
<text class="sS" x="596" y="242" text-anchor="middle">skewed: revenue, usage</text>
</svg><figcaption>The table's distributions, drawn from their formulas: count models are bars, continuous ones are curves.</figcaption></figure>

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

<figure class="dia"><svg viewBox="0 0 720 262" role="img" aria-label="Twenty simulated 95% confidence intervals for a mean of 50 from samples of 25: nineteen contain the true mean and one misses">
<line class="sLg" x1="360.0" y1="20" x2="360.0" y2="236" stroke-width="2"/><text class="sGt" x="360" y="14" text-anchor="middle">true mean (unknown in real life)</text>
<line class="sL" x1="227.847" y1="30" x2="504.389" y2="30" stroke-width="2"/><circle class="sP" cx="366.1" cy="30.0" r="2.5"/>
<line class="sL" x1="272.904" y1="40.4" x2="542.557" y2="40.4" stroke-width="2"/><circle class="sP" cx="407.7" cy="40.4" r="2.5"/>
<line class="sL" x1="246.444" y1="50.8" x2="482.806" y2="50.8" stroke-width="2"/><circle class="sP" cx="364.6" cy="50.8" r="2.5"/>
<line class="sLr" x1="98.8212" y1="61.2" x2="327.684" y2="61.2" stroke-width="3"/><circle class="sPr" cx="213.3" cy="61.2" r="2.5"/>
<line class="sL" x1="264.034" y1="71.6" x2="505.857" y2="71.6" stroke-width="2"/><circle class="sP" cx="384.9" cy="71.6" r="2.5"/>
<line class="sL" x1="244.554" y1="82" x2="500.897" y2="82" stroke-width="2"/><circle class="sP" cx="372.7" cy="82.0" r="2.5"/>
<line class="sL" x1="171.325" y1="92.4" x2="440.115" y2="92.4" stroke-width="2"/><circle class="sP" cx="305.7" cy="92.4" r="2.5"/>
<line class="sL" x1="315.111" y1="102.8" x2="565.056" y2="102.8" stroke-width="2"/><circle class="sP" cx="440.1" cy="102.8" r="2.5"/>
<line class="sL" x1="235.432" y1="113.2" x2="585.761" y2="113.2" stroke-width="2"/><circle class="sP" cx="410.6" cy="113.2" r="2.5"/>
<line class="sL" x1="239.415" y1="123.6" x2="485.553" y2="123.6" stroke-width="2"/><circle class="sP" cx="362.5" cy="123.6" r="2.5"/>
<line class="sL" x1="247.412" y1="134" x2="549.162" y2="134" stroke-width="2"/><circle class="sP" cx="398.3" cy="134.0" r="2.5"/>
<line class="sL" x1="256.885" y1="144.4" x2="550.075" y2="144.4" stroke-width="2"/><circle class="sP" cx="403.5" cy="144.4" r="2.5"/>
<line class="sL" x1="299.958" y1="154.8" x2="522.76" y2="154.8" stroke-width="2"/><circle class="sP" cx="411.4" cy="154.8" r="2.5"/>
<line class="sL" x1="219.988" y1="165.2" x2="524.958" y2="165.2" stroke-width="2"/><circle class="sP" cx="372.5" cy="165.2" r="2.5"/>
<line class="sL" x1="315.008" y1="175.6" x2="644.781" y2="175.6" stroke-width="2"/><circle class="sP" cx="479.9" cy="175.6" r="2.5"/>
<line class="sL" x1="323.494" y1="186" x2="584.59" y2="186" stroke-width="2"/><circle class="sP" cx="454.0" cy="186.0" r="2.5"/>
<line class="sL" x1="223.492" y1="196.4" x2="532.952" y2="196.4" stroke-width="2"/><circle class="sP" cx="378.2" cy="196.4" r="2.5"/>
<line class="sL" x1="245.484" y1="206.8" x2="571.217" y2="206.8" stroke-width="2"/><circle class="sP" cx="408.4" cy="206.8" r="2.5"/>
<line class="sL" x1="190.076" y1="217.2" x2="406.202" y2="217.2" stroke-width="2"/><circle class="sP" cx="298.1" cy="217.2" r="2.5"/>
<line class="sL" x1="190.289" y1="227.6" x2="475.287" y2="227.6" stroke-width="2"/><circle class="sP" cx="332.8" cy="227.6" r="2.5"/>
<text class="sT" x="570" y="120">19 of 20 intervals</text><text class="sC" x="570" y="138">contain the true mean</text><text class="sRt" x="570" y="170">1 misses (red)</text>
<text class="sC" x="156" y="252" text-anchor="middle">44</text>
<text class="sC" x="258" y="252" text-anchor="middle">47</text>
<text class="sC" x="360" y="252" text-anchor="middle">50</text>
<text class="sC" x="462" y="252" text-anchor="middle">53</text>
<text class="sC" x="564" y="252" text-anchor="middle">56</text>
</svg><figcaption>What "95% confidence" means: the procedure captures the truth in about 95% of repeated samples. Simulated: 20 samples of 25 from a population with mean 50.</figcaption></figure>

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

<figure class="dia"><svg viewBox="0 0 720 238" role="img" aria-label="Simpson's paradox: the new plan has lower churn than the old plan among prepaid and among postpaid customers, yet higher churn overall because most new-plan users are prepaid">
<text class="sT" x="110" y="60" text-anchor="end">prepaid</text>
<rect class="sG" x="120" y="30" width="198" height="22" rx="3"/><text class="sC" x="324" y="46">new plan (900 users) 18.0%</text><rect class="sB" x="120" y="56" width="220" height="22" rx="3"/><text class="sC" x="346" y="72">old plan (100 users) 20.0%</text>
<text class="sT" x="110" y="130" text-anchor="end">postpaid</text>
<rect class="sG" x="120" y="100" width="44" height="22" rx="3"/><text class="sC" x="170" y="116">new plan (100 users) 4.0%</text><rect class="sB" x="120" y="126" width="55" height="22" rx="3"/><text class="sC" x="181" y="142">old plan (900 users) 5.0%</text>
<text class="sT" x="110" y="200" text-anchor="end">overall</text><rect class="sR" x="120" y="170" width="182.6" height="22" rx="3"/><text class="sC" x="308.6" y="186">new plan 16.6%</text><rect class="sB" x="120" y="196" width="71.5" height="22" rx="3"/><text class="sC" x="197.5" y="212">old plan 6.5%</text>
<text class="sGt" x="548" y="60">churn is LOWER on the new</text><text class="sGt" x="548" y="78">plan in both segments…</text><text class="sRt" x="548" y="186">…but HIGHER overall,</text><text class="sRt" x="548" y="204">because it went mostly</text><text class="sRt" x="548" y="222">to high-churn prepaid</text>
</svg><figcaption>Simpson's paradox with real arithmetic: 18% < 20% and 4% < 5%, yet 16.6% > 6.5% overall. Compare within segments when group mixes differ.</figcaption></figure>

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

<figure class="dia steps"><svg viewBox="0 0 720 210" role="img" aria-label="Monty Hall in four steps: you pick door 1 with a one-in-three chance; the other two doors share two thirds; the host opens a goat door among them, so the remaining closed door now carries two thirds; in 10,000 simulated games switching wins about 67 percent and staying about 33 percent">
<rect class="sN" x="60" y="50" width="90" height="120" rx="6"/><text class="sT" x="105" y="40" text-anchor="middle">door 1</text>
<rect class="sN" x="190" y="50" width="90" height="120" rx="6"/><text class="sT" x="235" y="40" text-anchor="middle">door 2</text>
<rect class="sN" x="320" y="50" width="90" height="120" rx="6"/><text class="sT" x="365" y="40" text-anchor="middle">door 3</text>
<g data-s="1-4"><rect class="sB" x="54" y="44" width="102" height="132" rx="10" style="fill:none;stroke-width:2.5"/><text class="sC" x="105" y="196" text-anchor="middle">your pick</text></g>
<g data-s="1-1"><text class="sT" x="105" y="116" text-anchor="middle">1/3</text><text class="sT" x="235" y="116" text-anchor="middle">1/3</text><text class="sT" x="365" y="116" text-anchor="middle">1/3</text></g>
<g data-s="2-2"><text class="sT" x="105" y="116" text-anchor="middle">1/3</text><rect class="sW" x="182" y="104" width="228" height="20" rx="10" opacity=".35"/><text class="sWt" x="300" y="119" text-anchor="middle">together 2/3</text></g>
<g data-s="3-4"><text class="sT" x="105" y="116" text-anchor="middle">1/3</text><rect class="sR" x="194" y="56" width="82" height="108" rx="4" opacity=".35"/><text class="sRt" x="235" y="104" text-anchor="middle">goat</text><text class="sS" x="235" y="122" text-anchor="middle">opened</text></g>
<g data-s="3-3"><text class="sWt" x="365" y="116" text-anchor="middle">2/3</text><line class="sLw" x1="250" y1="150" x2="340" y2="150" marker-end="url(#ahw)"/><text class="sWt" x="300" y="196" text-anchor="middle">the 2/3 moves here</text></g>
<g data-s="4-4"><text class="sGt" x="365" y="116" text-anchor="middle">2/3</text><text class="sGt" x="365" y="196" text-anchor="middle">switch</text></g>
<rect class="sN" x="450" y="50" width="256" height="146" rx="8"/><text class="sT" x="578" y="72" text-anchor="middle">10,000 simulated games</text>
<g data-s="4"><text class="sT" x="578" y="104" text-anchor="middle">stay wins   32.6%</text><rect class="sB" x="470" y="112" width="70.3944" height="12" rx="3"/><text class="sGt" x="578" y="148" text-anchor="middle">switch wins 67.4%</text><rect class="sG" x="470" y="156" width="145.606" height="12" rx="3"/><text class="sS" x="578" y="186" text-anchor="middle">switching wins if pick 1 was a goat</text></g>
</svg><ol class="dia-steps">
<li>You pick door 1. Each door hides the car with probability 1/3.</li>
<li>The two doors you did not pick hold the car with probability 2/3 between them.</li>
<li>The host, who knows where the car is, always opens a goat door among those two. Your door's 1/3 does not change, so the remaining door carries the full 2/3.</li>
<li>Simulation: staying wins 32.6% of 10,000 games, switching 67.4%. The host's choice is information, not a coin flip.</li>
</ol><figcaption>Monty Hall, step by step, with a simulation to settle the argument.</figcaption></figure>

**6. A test is 95% accurate and the disease prevalence is 1%. P(disease | positive)?** (0.95·0.01) / (0.95·0.01 + 0.05·0.99) = 0.0095/0.059 ≈ **16%**. Base rates again.

**7. Expected number of rolls to get a 6?** Geometric: **6**.

**8. You flip a fair coin 10 times and get 10 heads. P(next is heads)?** **0.5**. Independence; the gambler's fallacy.

**9. A churn rate of 3% per month, constant: P(a customer survives 12 months)?** 0.97¹² ≈ **0.694**. Expected lifetime ≈ 1/0.03 ≈ **33 months**. **This is the basis of CLV:** CLV ≈ monthly margin × (retention / (1 + discount − retention)), or ≈ margin/churn without discounting.

**10. A/B test with 10 variants at α = 0.05 each. P(at least one false positive if none work)?** 1 − 0.95¹⁰ ≈ **40%**. Correct with Bonferroni (0.005 each) or BH.

<figure class="dia"><svg viewBox="0 0 720 242" role="img" aria-label="Three probability curves built with the complement rule: the chance of a shared birthday passes one half at 23 people, the chance of at least one six reaches 0.518 at four rolls, and the chance of at least one false positive reaches about 0.40 at ten tests">
<text class="sT" x="142" y="22" text-anchor="middle">shared birthday</text><text class="sS" x="142" y="38" text-anchor="middle">1 − ∏(365−k)/365</text>
<line class="sLm" x1="44" y1="196" x2="240" y2="196"/><line class="sLm" x1="44" y1="196" x2="44" y2="42"/>
<text class="sS" x="38" y="200" text-anchor="end">0</text>
<text class="sS" x="38" y="125" text-anchor="end">0.5</text>
<text class="sS" x="38" y="50" text-anchor="end">1</text>
<line class="sLm" x1="44" y1="121" x2="240" y2="121" stroke-dasharray="3 3" opacity=".5"/>
<text class="sS" x="44" y="212" text-anchor="middle">0</text>
<text class="sS" x="142" y="212" text-anchor="middle">30</text>
<text class="sS" x="240" y="212" text-anchor="middle">60</text>
<text class="sS" x="142" y="230" text-anchor="middle">people in the room</text>
<polyline class="sLv" points="44.0,196.0 47.3,196.0 50.5,195.6 53.8,194.8 57.1,193.5 60.3,191.9 63.6,189.9 66.9,187.6 70.1,184.8 73.4,181.8 76.7,178.5 79.9,174.8 83.2,170.9 86.5,166.8 89.7,162.5 93.0,158.1 96.3,153.5 99.5,148.7 102.8,144.0 106.1,139.1 109.3,134.3 112.6,129.4 115.9,124.6 119.1,119.9 122.4,115.2 125.7,110.7 128.9,106.3 132.2,102.0 135.5,97.8 138.7,93.9 142.0,90.1 145.3,86.4 148.5,83.0 151.8,79.8 155.1,76.7 158.3,73.8 161.6,71.2 164.9,68.7 168.1,66.4 171.4,64.3 174.7,62.3 177.9,60.5 181.2,58.9 184.5,57.4 187.7,56.1 191.0,54.9 194.3,53.8 197.5,52.8 200.8,51.9 204.1,51.1 207.3,50.4 210.6,49.8 213.9,49.3 217.1,48.8 220.4,48.4 223.7,48.1 226.9,47.8 230.2,47.5 233.5,47.3 236.7,47.1 240.0,46.9" style="fill:none;stroke-width:2.4"/>
<line class="sLm" x1="119.133" y1="196" x2="119.133" y2="119.905" stroke-dasharray="2 3"/>
<circle class="sP" cx="119.1" cy="119.9" r="4.5"/>
<text class="sGt" x="127.133" y="137.905">n = 23: 0.507</text>
<text class="sT" x="378" y="22" text-anchor="middle">at least one six</text><text class="sS" x="378" y="38" text-anchor="middle">1 − (5/6)ⁿ</text>
<line class="sLm" x1="280" y1="196" x2="476" y2="196"/><line class="sLm" x1="280" y1="196" x2="280" y2="42"/>
<text class="sS" x="274" y="200" text-anchor="end">0</text>
<text class="sS" x="274" y="125" text-anchor="end">0.5</text>
<text class="sS" x="274" y="50" text-anchor="end">1</text>
<line class="sLm" x1="280" y1="121" x2="476" y2="121" stroke-dasharray="3 3" opacity=".5"/>
<text class="sS" x="280" y="212" text-anchor="middle">0</text>
<text class="sS" x="378" y="212" text-anchor="middle">10</text>
<text class="sS" x="476" y="212" text-anchor="middle">20</text>
<text class="sS" x="378" y="230" text-anchor="middle">rolls of a die</text>
<polyline class="sLw" points="280.0,196.0 289.8,171.0 299.6,150.2 309.4,132.8 319.2,118.3 329.0,106.3 338.8,96.2 348.6,87.9 358.4,80.9 368.2,75.1 378.0,70.2 387.8,66.2 397.6,62.8 407.4,60.0 417.2,57.7 427.0,55.7 436.8,54.1 446.6,52.8 456.4,51.6 466.2,50.7 476.0,49.9" style="fill:none;stroke-width:2.4"/>
<line class="sLm" x1="319.2" y1="196" x2="319.2" y2="118.338" stroke-dasharray="2 3"/>
<circle class="sP" cx="319.2" cy="118.3" r="4.5"/>
<text class="sGt" x="327.2" y="136.338">n = 4: 0.518</text>
<text class="sT" x="614" y="22" text-anchor="middle">≥ 1 false positive</text><text class="sS" x="614" y="38" text-anchor="middle">1 − 0.95ᵏ</text>
<line class="sLm" x1="516" y1="196" x2="712" y2="196"/><line class="sLm" x1="516" y1="196" x2="516" y2="42"/>
<text class="sS" x="510" y="200" text-anchor="end">0</text>
<text class="sS" x="510" y="125" text-anchor="end">0.5</text>
<text class="sS" x="510" y="50" text-anchor="end">1</text>
<line class="sLm" x1="516" y1="121" x2="712" y2="121" stroke-dasharray="3 3" opacity=".5"/>
<text class="sS" x="516" y="212" text-anchor="middle">0</text>
<text class="sS" x="614" y="212" text-anchor="middle">30</text>
<text class="sS" x="712" y="212" text-anchor="middle">60</text>
<text class="sS" x="614" y="230" text-anchor="middle">tests at α = 0.05</text>
<polyline class="sLr" points="516.0,196.0 519.3,188.5 522.5,181.4 525.8,174.6 529.1,168.2 532.3,162.1 535.6,156.3 538.9,150.8 542.1,145.5 545.4,140.5 548.7,135.8 551.9,131.3 555.2,127.1 558.5,123.0 561.7,119.2 565.0,115.5 568.3,112.0 571.5,108.7 574.8,105.6 578.1,102.6 581.3,99.8 584.6,97.1 587.9,94.5 591.1,92.1 594.4,89.8 597.7,87.6 600.9,85.5 604.2,83.6 607.5,81.7 610.7,79.9 614.0,78.2 617.3,76.6 620.5,75.1 623.8,73.6 627.1,72.2 630.3,70.9 633.6,69.7 636.9,68.5 640.1,67.4 643.4,66.3 646.7,65.3 649.9,64.3 653.2,63.4 656.5,62.5 659.7,61.7 663.0,60.9 666.3,60.2 669.5,59.5 672.8,58.8 676.1,58.1 679.3,57.5 682.6,57.0 685.9,56.4 689.1,55.9 692.4,55.4 695.7,54.9 698.9,54.5 702.2,54.1 705.5,53.7 708.7,53.3 712.0,52.9" style="fill:none;stroke-width:2.4"/>
<line class="sLm" x1="548.667" y1="196" x2="548.667" y2="135.811" stroke-dasharray="2 3"/>
<circle class="sP" cx="548.7" cy="135.8" r="4.5"/>
<text class="sGt" x="556.667" y="153.811">n = 10: 0.401</text>
</svg><figcaption>Puzzles 2, 3 and 10 share one trick: P(at least one) = 1 − P(none). Each curve is exact; the dot is the puzzle's answer.</figcaption></figure>

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
