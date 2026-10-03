# Causal Inference — Did It Work, and Would It Work for This Customer?

Businesses rarely want only predictions. They want to know whether an action **causes** an outcome: did the loyalty programme increase spending, does a discount stop churn, did the new app version reduce complaints? Predictive models can't answer that, because they learn correlations. Causal inference is what separates a data scientist from a model builder in mid-level interviews, and it's the natural continuation of the A/B testing in [[S6.9]]. *AI Journey* Part 15 covers the experiment side; this module covers what to do when you can't randomise, and how to target actions by their effect.

> [!focus]
> **Entry must:** explain correlation vs causation with confounders; describe a randomised experiment as the gold standard; explain difference-in-differences and its key assumption.
> **Mid adds:** potential outcomes and counterfactuals, DAGs and the back-door idea, colliders and selection bias, CUPED, regression discontinuity, instrumental variables, synthetic control, propensity scores, uplift modelling and the four customer types.
> **Most asked:** *How do you measure the effect of something you couldn't A/B test?* · *What is difference-in-differences?* · *What's a confounder?* · *What is propensity score matching?* · *How would you choose who gets a retention offer?* · *What is CUPED?*
> **Time budget:** 3.5 hours.

## DS5.1 The core idea: counterfactuals 🟢 ⭐

> [!term] Potential outcomes (counterfactuals)
> For each customer there are two outcomes: what happens **with** the treatment (Y₁) and **without** it (Y₀). The causal effect for that customer is Y₁ − Y₀. We only ever observe **one** of them, so the other is the **counterfactual**. Causal inference is about estimating the missing one credibly.

| Quantity | Meaning |
|---|---|
| **ATE** (average treatment effect) | Average of Y₁ − Y₀ over everyone |
| **ATT** (on the treated) | Average effect among those who actually got the treatment |
| **CATE** (conditional) | The effect for a subgroup with given features: the basis of targeting ([[DS5.6]]) |

**Why naive comparisons fail:** customers who joined the loyalty programme already spent more before joining. Comparing members with non-members measures **selection**, not the programme's effect.

> [!say]
> "Correlation can come from confounders or selection. Customers who join a loyalty programme are already heavier spenders, so comparing members with non-members overstates its effect. The causal question is what members would have spent without the programme. A randomised experiment answers it directly; otherwise I need a design that constructs a credible counterfactual."

## DS5.2 Confounders, colliders and DAGs 🟡 ⭐

A **causal graph (DAG)** draws your assumptions: arrows from causes to effects.

<figure class="dia"><svg viewBox="0 0 720 170" role="img" aria-label="Confounder and collider DAG examples">
<g transform="translate(20,10)">
<text class="sT" x="0" y="15">Confounder</text>
<rect class="sW" x="110" y="25" width="120" height="34" rx="8"/><text class="sS" x="170" y="47" text-anchor="middle">Prior engagement</text>
<rect class="sA" x="30" y="105" width="120" height="34" rx="8"/><text class="sS" x="90" y="127" text-anchor="middle">Joins programme</text>
<rect class="sG" x="200" y="105" width="120" height="34" rx="8"/><text class="sS" x="260" y="127" text-anchor="middle">Spending</text>
<line class="sL" x1="150" y1="59" x2="100" y2="105"/><line class="sL" x1="190" y1="59" x2="250" y2="105"/><line class="sD" x1="150" y1="122" x2="200" y2="122"/>
<text class="sS" x="0" y="160">Adjust for it (or randomise)</text>
</g>
<g transform="translate(380,10)">
<text class="sT" x="0" y="15">Collider</text>
<rect class="sA" x="20" y="25" width="120" height="34" rx="8"/><text class="sS" x="80" y="47" text-anchor="middle">Talent</text>
<rect class="sA" x="190" y="25" width="120" height="34" rx="8"/><text class="sS" x="250" y="47" text-anchor="middle">Connections</text>
<rect class="sR" x="105" y="105" width="120" height="34" rx="8"/><text class="sS" x="165" y="127" text-anchor="middle">Got hired</text>
<line class="sL" x1="80" y1="59" x2="150" y2="105"/><line class="sL" x1="250" y1="59" x2="180" y2="105"/>
<text class="sS" x="0" y="160">Don't condition on it</text>
</g>
</svg><figcaption>Adjust for confounders (common causes). Conditioning on a collider (a common effect) creates a false association.</figcaption></figure>

| Structure | Example | Do |
|---|---|---|
| **Confounder** (common cause of treatment and outcome) | Prior engagement drives both joining the programme and spending | **Adjust** for it (stratify, regress, match), or randomise |
| **Mediator** (on the causal path) | Programme → more app visits → spending | Don't adjust if you want the **total** effect |
| **Collider** (common effect of two variables) | Analysing only hired candidates makes talent and connections look negatively related | **Don't condition** on it; that's how **selection bias** arises |

> [!term] Selection bias
> Analysing a sample selected on something affected by the variables you study, such as only customers who responded to a survey, or only approved loan applicants (whose outcomes you can see). It distorts associations and is often a collider in disguise.

## DS5.3 Experiments, done more efficiently: CUPED 🟡 ⭐

Randomised experiments remain the best design ([[S6.9]]). **CUPED** makes them cheaper by removing predictable variance:

> [!term] CUPED
> Controlled-experiment Using Pre-Experiment Data. Adjust each user's outcome Y by their pre-experiment value X of the same metric: Y′ = Y − θ(X − mean(X)), with θ = cov(X, Y) ÷ var(X). Randomisation makes X balanced across groups, so the estimate stays unbiased, while variance drops by roughly the squared correlation between X and Y. A correlation of 0.7 cuts variance by about half, which halves the sample size needed.

```python
theta = np.cov(pre, post)[0, 1] / np.var(pre, ddof=1)
post_cuped = post - theta * (pre - pre.mean())
# then compare post_cuped between treatment and control as usual
```

## DS5.4 When you can't randomise: quasi-experiments 🟡 ⭐

### Difference-in-differences (DiD) ⭐

Compare the **change** in the treated group with the **change** in a comparable untreated group over the same period. The control group's change estimates what would have happened to the treated group anyway (seasonality, market trends).

| | Before | After | Change |
|---|---|---|---|
| **Cairo** (new delivery-fee policy) | 100 | 112 | +12 |
| **Alexandria** (no change) | 90 | 96 | +6 |
| **DiD estimate** | | | **+6** |

```python
import statsmodels.formula.api as smf
# rows: city-week observations; treated = Cairo; post = after the change
model = smf.ols("orders ~ treated * post + C(week)", data=df).fit(cov_type="cluster", cov_kwds={"groups": df["city"]})
print(model.params["treated:post"])          # the DiD effect
```

**Key assumption: parallel trends.** Without the policy, both groups would have moved in parallel. Check that their **pre-period trends** look parallel (plot them), and be wary when the treated group was chosen *because* it was doing badly. Clustered standard errors matter, because observations within a city are correlated.

### Other designs

| Design | Idea | Example | Key assumption |
|---|---|---|---|
| **Regression discontinuity** | Units just above and just below a cut-off are comparable | Customers just above vs below the EGP 5,000 spend threshold for "Gold" status | Nothing else changes at the cut-off; no precise manipulation of the running variable |
| **Instrumental variables** | A variable that shifts treatment but affects the outcome only through treatment | Random assignment of call-centre agents (some offer discounts more) as an instrument for "got a discount" | Relevance and the exclusion restriction (no other path) |
| **Synthetic control** | Build a weighted combination of untreated units that tracks the treated unit before the change | A campaign in one governorate vs a weighted mix of others | The pre-period fit is good; no spill-over |
| **Interrupted time series** | Model the trend before an intervention and compare with what follows | A price change on one date with no comparison group | No other change at the same time; the trend would have continued |

> [!say]
> "If we can't randomise, I'd look for a comparison group and use difference-in-differences: the change in the treated city minus the change in a similar city, which removes common trends. The key assumption is parallel trends, so I'd check the pre-period. If eligibility depends on a threshold, a regression discontinuity around it is often more convincing."

## DS5.5 Observational adjustment: regression and propensity scores 🟡

When the treatment wasn't assigned by a clean design, you can adjust for **observed** confounders:

- **Regression adjustment:** regress the outcome on treatment plus confounders.
- **Propensity score** (the probability of treatment given confounders): **match** treated and control units with similar scores, **stratify** by score, or **weight** by the inverse of the probability of the treatment received (IPW) to create a pseudo-population where treatment is unrelated to the confounders.
- **Doubly robust** estimators combine an outcome model and a propensity model; they're consistent if either one is right.

**Assumptions you must state:** **no unmeasured confounding** (everything that drives both treatment and outcome is in the data, which is untestable and often doubtful), and **overlap** (every kind of customer had some chance of each treatment; check the propensity distributions). Report sensitivity analyses: how strong would a hidden confounder have to be to erase the effect?

## DS5.6 Uplift modelling: targeting by effect 🟡 ⭐

A churn model ranks customers by **risk**. A retention campaign should rank them by **how much the offer changes their behaviour**.

| Customer type | Without offer | With offer | Offer them? |
|---|---|---|---|
| **Persuadables** | Churn | Stay | **Yes**: this is the value |
| **Sure things** | Stay | Stay | No: wasted discount |
| **Lost causes** | Churn | Churn | No: wasted cost |
| **Sleeping dogs** | Stay | Churn (the contact reminds them to leave) | **No**: the offer hurts |

> [!term] Uplift (heterogeneous treatment effect) modelling
> Estimating the **conditional** treatment effect for each customer from **randomised** campaign data (a treated group and a holdout), so the next campaign targets those with the largest predicted uplift.

Common approaches: the **T-learner** (separate outcome models for treated and control; uplift = difference), the **S-learner** (one model with treatment as a feature), the **X-learner**, and causal forests (EconML, CausalML). Evaluate with **uplift (Qini) curves** on held-out randomised data: incremental outcomes as you target more of the ranked population.

> [!say]
> "A churn score tells me who's at risk, not who an offer will save. I'd run the first campaign with a random holdout, then train an uplift model, for example a T-learner, to estimate each customer's incremental response, and target the persuadables. Customers who stay anyway, or who leave either way, shouldn't get the discount, and some customers react badly to being contacted at all."

## DS5.7 A worked case: "Did the loyalty programme increase spending?" 🟡 ⭐

1. **Clarify:** the outcome (monthly spend? margin?), the population, and the timing (launched 1 March, opt-in).
2. **Name the threat:** opt-in members self-select (they were already engaged), so a members vs non-members comparison is biased.
3. **Options, best first:**
   - If a **staggered rollout** by city happened → **DiD** with not-yet-treated cities as controls.
   - If eligibility had a **threshold** (spend ≥ EGP X) → **regression discontinuity**.
   - Otherwise → **matched comparison** on pre-launch behaviour (spend, frequency, tenure, region) with propensity scores, plus DiD on the matched sample (members' spend change vs matched non-members' change), plus a sensitivity analysis.
4. **Checks:** parallel pre-trends; balance after matching; robustness to alternative specifications; spill-over (members' families?).
5. **Answer:** an effect with a confidence interval and the assumptions in plain words, plus a recommendation: run a randomised holdout for the next programme change so the question gets a clean answer.

> [!lab] Run a difference-in-differences
> Simulate (or find on Kaggle) panel data for two regions over 20 weeks, with a policy in one region from week 11 and a true effect you choose. Plot pre-trends, estimate DiD with statsmodels and clustered errors, then break the parallel-trends assumption on purpose (give the treated region a steeper pre-trend) and watch the estimate go wrong. Write two paragraphs on what you'd check in real data. This makes the method concrete for interviews.

## DS5.8 Tools 🟡

[DoWhy](https://www.pywhy.org/dowhy/) (model, identify, estimate, refute), [EconML](https://econml.azurewebsites.net/) (Microsoft; heterogeneous effects, DML, causal forests), [CausalML](https://causalml.readthedocs.io/) (Uber; uplift modelling), `statsmodels` (regressions with clustered errors), `linearmodels` (panel data).

## DS5.9 Interview drill 🟢 ⭐

| Question | Strong short answer |
|---|---|
| What is a counterfactual? | The outcome that would have happened under the other treatment, which we never observe directly. |
| ATE vs ATT vs CATE? | Average effect overall / among the treated / for a subgroup with given features. |
| What's a confounder? | A common cause of treatment and outcome that creates a spurious association unless adjusted for. |
| What's a collider? | A common effect; conditioning on it creates a false association (selection bias). |
| Why is randomisation the gold standard? | It balances observed and unobserved confounders in expectation. |
| What is CUPED? | Adjusting outcomes with pre-experiment data to cut variance (and sample size) without bias. |
| Explain difference-in-differences. | The treated group's change minus the control group's change, assuming parallel trends without treatment. |
| What is regression discontinuity? | Comparing units just either side of an eligibility cut-off, which are otherwise similar. |
| What is an instrumental variable? | Something that affects treatment but the outcome only through treatment. |
| What's a propensity score for? | Matching or weighting so treated and control groups are comparable on observed confounders. |
| What assumption do propensity methods need? | No unmeasured confounding, and overlap in propensity scores. |
| Churn model vs uplift model? | Who's at risk vs whose behaviour the treatment changes. |
| Who are "sleeping dogs"? | Customers who'd stay unless contacted; the treatment makes them leave. |
| How do you evaluate an uplift model? | Qini or uplift curves on randomised held-out data. |

## Key takeaways

> [!check]
> - Causal questions need counterfactuals, not correlations or SHAP values.
> - Randomise when you can; use CUPED to need fewer users.
> - When you can't: difference-in-differences, discontinuities, instruments, synthetic controls, each with assumptions to check.
> - Observational adjustment requires no hidden confounders: say so and test sensitivity.
> - Target treatments by uplift, not by risk.

## Sources

- Miguel Hernán and James Robins, [*Causal Inference: What If*](https://www.hsph.harvard.edu/miguel-hernan/causal-inference-book/) (free online).
- Scott Cunningham, [*Causal Inference: The Mixtape*](https://mixtape.scunning.com/) (free online).
- Joshua Angrist and Jörn-Steffen Pischke, *Mastering 'Metrics* (Princeton, 2014).
- Judea Pearl and Dana Mackenzie, *The Book of Why* (2018).
- Alex Deng et al., "Improving the Sensitivity of Online Controlled Experiments by Utilizing Pre-Experiment Data" (WSDM 2013): CUPED.
- Alberto Abadie, "Using Synthetic Controls" (*Journal of Economic Literature*, 2021).
- Sören Künzel et al., "Metalearners for estimating heterogeneous treatment effects" (*PNAS*, 2019); Nicholas Radcliffe and Patrick Surry on uplift and Qini curves.
- PyWhy [DoWhy](https://www.pywhy.org/dowhy/), [EconML](https://econml.azurewebsites.net/), [CausalML](https://causalml.readthedocs.io/).
- Your *AI Journey* Part 15 (A/B testing) and Part 24 (bandits for offers).
