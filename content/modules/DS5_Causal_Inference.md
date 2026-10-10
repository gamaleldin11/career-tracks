# Causal Inference — Did It Work, and Would It Work for This Customer?

Businesses rarely want only predictions. They want to know whether an action **causes** an outcome: did the loyalty programme increase spending, does a discount stop churn, did the new app version reduce complaints? Predictive models can't answer that, because they learn correlations. Causal inference is what separates a data scientist from a model builder in mid-level interviews, and it's the natural continuation of the A/B testing in [[S6.9]]. *AI Journey* Part 15 covers the experiment side; this module covers what to do when you can't randomise, and how to target actions by their effect.

> [!focus]
> **Entry must:** explain correlation vs causation with confounders; describe a randomised experiment as the gold standard; explain difference-in-differences and its key assumption.
> **Mid adds:** potential outcomes and counterfactuals, DAGs and the back-door idea, colliders and selection bias, CUPED, regression discontinuity, instrumental variables, synthetic control, propensity scores, uplift modelling and the four customer types.
> **Most asked:** *How do you measure the effect of something you couldn't A/B test?* · *What is difference-in-differences?* · *What's a confounder?* · *What is propensity score matching?* · *How would you choose who gets a retention offer?* · *What is CUPED?*
> **Time budget:** 3.5 hours.

## DS5.0 Foundations: correlation, causation and the missing world 🟢

Prediction asks "**what will happen?**". Causal inference asks "**what would happen if we did something different?**". The second is harder because, for any one customer, you only ever see one version of events: the one where they got the offer, or the one where they didn't.

<figure class="dia"><svg viewBox="0 0 720 194" role="img" aria-label="A potential-outcomes table: each customer shows spend with or without the offer, never both, so the individual effect column is always unknown">
<rect class="sN" x="40" y="20" width="110" height="26" rx="0"/><text class="sT" x="95" y="38" text-anchor="middle">customer</text>
<rect class="sN" x="150" y="20" width="120" height="26" rx="0"/><text class="sT" x="210" y="38" text-anchor="middle">got the offer?</text>
<rect class="sN" x="270" y="20" width="140" height="26" rx="0"/><text class="sT" x="340" y="38" text-anchor="middle">spend with (Y₁)</text>
<rect class="sN" x="410" y="20" width="150" height="26" rx="0"/><text class="sT" x="485" y="38" text-anchor="middle">spend without (Y₀)</text>
<rect class="sN" x="560" y="20" width="110" height="26" rx="0"/><text class="sT" x="615" y="38" text-anchor="middle">effect</text>
<rect class="sB" x="40" y="46" width="110" height="28" rx="0" opacity=".55"/><text class="sC" x="95" y="65" text-anchor="middle">Mona</text>
<rect class="sB" x="150" y="46" width="120" height="28" rx="0" opacity=".55"/><text class="sC" x="210" y="65" text-anchor="middle">yes</text>
<rect class="sA" x="270" y="46" width="140" height="28" rx="0" opacity=".55"/><text class="sC" x="340" y="65" text-anchor="middle">900</text>
<rect class="sN" x="410" y="46" width="150" height="28" rx="0"/><text class="sRt" x="485" y="65" text-anchor="middle">?</text>
<rect class="sN" x="560" y="46" width="110" height="28" rx="0"/><text class="sRt" x="615" y="65" text-anchor="middle">?</text>
<rect class="sB" x="40" y="74" width="110" height="28" rx="0" opacity=".55"/><text class="sC" x="95" y="93" text-anchor="middle">Ali</text>
<rect class="sB" x="150" y="74" width="120" height="28" rx="0" opacity=".55"/><text class="sC" x="210" y="93" text-anchor="middle">no</text>
<rect class="sN" x="270" y="74" width="140" height="28" rx="0"/><text class="sRt" x="340" y="93" text-anchor="middle">?</text>
<rect class="sA" x="410" y="74" width="150" height="28" rx="0" opacity=".55"/><text class="sC" x="485" y="93" text-anchor="middle">400</text>
<rect class="sN" x="560" y="74" width="110" height="28" rx="0"/><text class="sRt" x="615" y="93" text-anchor="middle">?</text>
<rect class="sB" x="40" y="102" width="110" height="28" rx="0" opacity=".55"/><text class="sC" x="95" y="121" text-anchor="middle">Sara</text>
<rect class="sB" x="150" y="102" width="120" height="28" rx="0" opacity=".55"/><text class="sC" x="210" y="121" text-anchor="middle">yes</text>
<rect class="sA" x="270" y="102" width="140" height="28" rx="0" opacity=".55"/><text class="sC" x="340" y="121" text-anchor="middle">700</text>
<rect class="sN" x="410" y="102" width="150" height="28" rx="0"/><text class="sRt" x="485" y="121" text-anchor="middle">?</text>
<rect class="sN" x="560" y="102" width="110" height="28" rx="0"/><text class="sRt" x="615" y="121" text-anchor="middle">?</text>
<rect class="sB" x="40" y="130" width="110" height="28" rx="0" opacity=".55"/><text class="sC" x="95" y="149" text-anchor="middle">Omar</text>
<rect class="sB" x="150" y="130" width="120" height="28" rx="0" opacity=".55"/><text class="sC" x="210" y="149" text-anchor="middle">no</text>
<rect class="sN" x="270" y="130" width="140" height="28" rx="0"/><text class="sRt" x="340" y="149" text-anchor="middle">?</text>
<rect class="sA" x="410" y="130" width="150" height="28" rx="0" opacity=".55"/><text class="sC" x="485" y="149" text-anchor="middle">650</text>
<rect class="sN" x="560" y="130" width="110" height="28" rx="0"/><text class="sRt" x="615" y="149" text-anchor="middle">?</text>
<text class="sS" x="360" y="182" text-anchor="middle">every row is missing one outcome, so every individual effect is unknown</text>
</svg><figcaption>The fundamental problem of causal inference: one person, one world. Every method in this module estimates the missing column for groups.</figcaption></figure>

So causal methods estimate effects for **groups**, by finding a comparison group that tells you what would have happened otherwise. The danger is a comparison group that differs in some other way: a **confounder**, something that affects both who gets the treatment and the outcome. **Randomisation** solves this by construction, which is why experiments come first and every other method in this module is a way of approximating one.

<figure class="dia steps" data-start="1"><svg viewBox="0 0 720 240" role="img" aria-label="Self-selection puts mostly engaged customers among programme members, inflating the difference; random assignment balances engaged and casual customers so the difference measures the effect">
<rect class="sN" x="30" y="30" width="300" height="150" rx="10"/><rect class="sN" x="390" y="30" width="300" height="150" rx="10"/>
<g data-s="1-1"><text class="sT" x="180" y="22" text-anchor="middle">joined (members)</text><text class="sT" x="540" y="22" text-anchor="middle">didn't join</text><circle class="sPg" cx="70" cy="70" r="11"/><circle class="sPg" cx="114" cy="70" r="11"/><circle class="sPg" cx="158" cy="70" r="11"/><circle class="sPg" cx="202" cy="70" r="11"/><circle class="sPg" cx="246" cy="70" r="11"/><circle class="sPg" cx="290" cy="70" r="11"/><circle class="sP" cx="70" cy="104" r="11"/><circle class="sP" cx="114" cy="104" r="11"/><circle class="sPg" cx="430" cy="70" r="11"/><circle class="sPg" cx="474" cy="70" r="11"/><circle class="sP" cx="518" cy="70" r="11"/><circle class="sP" cx="562" cy="70" r="11"/><circle class="sP" cx="606" cy="70" r="11"/><circle class="sP" cx="650" cy="70" r="11"/><circle class="sP" cx="430" cy="104" r="11"/><circle class="sP" cx="474" cy="104" r="11"/><circle class="sP" cx="518" cy="104" r="11"/><circle class="sP" cx="562" cy="104" r="11"/><circle class="sP" cx="606" cy="104" r="11"/><circle class="sP" cx="650" cy="104" r="11"/><text class="sT" x="180" y="200" text-anchor="middle">average spend 820</text><text class="sT" x="540" y="200" text-anchor="middle">average spend 430</text><text class="sRt" x="360" y="226" text-anchor="middle">difference 390: mostly WHO joined, not what the programme did</text></g>
<g data-s="2-2"><text class="sT" x="180" y="22" text-anchor="middle">randomly offered</text><text class="sT" x="540" y="22" text-anchor="middle">randomly not offered</text><circle class="sPg" cx="70" cy="70" r="11"/><circle class="sPg" cx="114" cy="70" r="11"/><circle class="sPg" cx="158" cy="70" r="11"/><circle class="sPg" cx="202" cy="70" r="11"/><circle class="sP" cx="246" cy="70" r="11"/><circle class="sP" cx="290" cy="70" r="11"/><circle class="sP" cx="70" cy="104" r="11"/><circle class="sP" cx="114" cy="104" r="11"/><circle class="sP" cx="158" cy="104" r="11"/><circle class="sP" cx="202" cy="104" r="11"/><circle class="sPg" cx="430" cy="70" r="11"/><circle class="sPg" cx="474" cy="70" r="11"/><circle class="sPg" cx="518" cy="70" r="11"/><circle class="sPg" cx="562" cy="70" r="11"/><circle class="sP" cx="606" cy="70" r="11"/><circle class="sP" cx="650" cy="70" r="11"/><circle class="sP" cx="430" cy="104" r="11"/><circle class="sP" cx="474" cy="104" r="11"/><circle class="sP" cx="518" cy="104" r="11"/><circle class="sP" cx="562" cy="104" r="11"/><text class="sT" x="180" y="200" text-anchor="middle">average spend 640</text><text class="sT" x="540" y="200" text-anchor="middle">average spend 600</text><text class="sGt" x="360" y="226" text-anchor="middle">same mix of people on both sides: the 40 difference is the effect</text></g>
</svg><ol class="dia-steps">
<li>Engaged customers (green) both spend more <b>and</b> are more likely to join. Comparing members with non-members mixes the programme's effect with who chose it: <b>selection bias</b> from a confounder.</li>
<li>Assign the offer by coin flip and both groups get the same mix of engaged and casual customers, measured or not. Now the difference in averages estimates the causal effect.</li>
</ol><figcaption>Randomisation balances every confounder at once, including the ones you never measured. That's why experiments come first.</figcaption></figure>

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

<figure class="dia"><svg viewBox="0 0 720 180" role="img" aria-label="Confounder and collider DAG examples">
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

<figure class="dia"><svg viewBox="0 0 720 240" role="img" aria-label="Raw spend distributions for control and treatment overlap heavily; after CUPED adjustment the same difference in means sits on much narrower distributions">
<text class="sT" x="180" y="22" text-anchor="middle">raw spend: wide, overlapping</text>
<line class="sLm" x1="40" y1="180" x2="330" y2="180"/>
<polyline class="sLm" points="50.0,179.8 54.6,179.7 59.2,179.6 63.8,179.5 68.4,179.3 73.0,179.0 77.6,178.6 82.2,178.2 86.8,177.6 91.4,176.9 96.0,175.9 100.6,174.8 105.2,173.5 109.8,172.0 114.4,170.1 119.0,168.1 123.6,165.7 128.2,163.1 132.8,160.3 137.4,157.3 142.0,154.2 146.6,151.0 151.2,147.8 155.8,144.6 160.4,141.7 165.0,139.0 169.6,136.6 174.2,134.7 178.8,133.3 183.4,132.4 188.0,132.1 192.6,132.4 197.2,133.3 201.8,134.7 206.4,136.6 211.0,139.0 215.6,141.7 220.2,144.6 224.8,147.8 229.4,151.0 234.0,154.2 238.6,157.3 243.2,160.3 247.8,163.1 252.4,165.7 257.0,168.1 261.6,170.1 266.2,172.0 270.8,173.5 275.4,174.8 280.0,175.9 284.6,176.9 289.2,177.6 293.8,178.2 298.4,178.6 303.0,179.0 307.6,179.3 312.2,179.5 316.8,179.6 321.4,179.7 326.0,179.8" fill="none" stroke-width="2.5"/>
<polyline class="sLg" points="50.0,180.0 54.6,180.0 59.2,179.9 63.8,179.9 68.4,179.9 73.0,179.8 77.6,179.7 82.2,179.6 86.8,179.5 91.4,179.3 96.0,179.0 100.6,178.6 105.2,178.2 109.8,177.6 114.4,176.9 119.0,175.9 123.6,174.8 128.2,173.5 132.8,172.0 137.4,170.1 142.0,168.1 146.6,165.7 151.2,163.1 155.8,160.3 160.4,157.3 165.0,154.2 169.6,151.0 174.2,147.8 178.8,144.6 183.4,141.7 188.0,139.0 192.6,136.6 197.2,134.7 201.8,133.3 206.4,132.4 211.0,132.1 215.6,132.4 220.2,133.3 224.8,134.7 229.4,136.6 234.0,139.0 238.6,141.7 243.2,144.6 247.8,147.8 252.4,151.0 257.0,154.2 261.6,157.3 266.2,160.3 270.8,163.1 275.4,165.7 280.0,168.1 284.6,170.1 289.2,172.0 293.8,173.5 298.4,174.8 303.0,175.9 307.6,176.9 312.2,177.6 316.8,178.2 321.4,178.6 326.0,179.0" fill="none" stroke-width="2.5"/>
<line class="sD" x1="188" y1="40" x2="188" y2="180"/><line class="sD" x1="211" y1="40" x2="211" y2="180"/>
<text class="sT" x="540" y="22" text-anchor="middle">CUPED-adjusted: same gap, less noise</text>
<line class="sLm" x1="400" y1="180" x2="690" y2="180"/>
<polyline class="sLm" points="410.0,180.0 414.6,180.0 419.2,180.0 423.8,180.0 428.4,180.0 433.0,180.0 437.6,180.0 442.2,180.0 446.8,180.0 451.4,180.0 456.0,180.0 460.6,180.0 465.2,180.0 469.8,180.0 474.4,180.0 479.0,180.0 483.6,180.0 488.2,180.0 492.8,179.9 497.4,179.7 502.0,179.2 506.6,178.2 511.2,176.5 515.8,173.5 520.4,169.0 525.0,162.7 529.6,155.1 534.2,146.8 538.8,139.3 543.4,134.0 548.0,132.1 552.6,134.0 557.2,139.3 561.8,146.8 566.4,155.1 571.0,162.7 575.6,169.0 580.2,173.5 584.8,176.5 589.4,178.2 594.0,179.2 598.6,179.7 603.2,179.9 607.8,180.0 612.4,180.0 617.0,180.0 621.6,180.0 626.2,180.0 630.8,180.0 635.4,180.0 640.0,180.0 644.6,180.0 649.2,180.0 653.8,180.0 658.4,180.0 663.0,180.0 667.6,180.0 672.2,180.0 676.8,180.0 681.4,180.0 686.0,180.0" fill="none" stroke-width="2.5"/>
<polyline class="sLg" points="410.0,180.0 414.6,180.0 419.2,180.0 423.8,180.0 428.4,180.0 433.0,180.0 437.6,180.0 442.2,180.0 446.8,180.0 451.4,180.0 456.0,180.0 460.6,180.0 465.2,180.0 469.8,180.0 474.4,180.0 479.0,180.0 483.6,180.0 488.2,180.0 492.8,180.0 497.4,180.0 502.0,180.0 506.6,180.0 511.2,180.0 515.8,179.9 520.4,179.7 525.0,179.2 529.6,178.2 534.2,176.5 538.8,173.5 543.4,169.0 548.0,162.7 552.6,155.1 557.2,146.8 561.8,139.3 566.4,134.0 571.0,132.1 575.6,134.0 580.2,139.3 584.8,146.8 589.4,155.1 594.0,162.7 598.6,169.0 603.2,173.5 607.8,176.5 612.4,178.2 617.0,179.2 621.6,179.7 626.2,179.9 630.8,180.0 635.4,180.0 640.0,180.0 644.6,180.0 649.2,180.0 653.8,180.0 658.4,180.0 663.0,180.0 667.6,180.0 672.2,180.0 676.8,180.0 681.4,180.0 686.0,180.0" fill="none" stroke-width="2.5"/>
<line class="sD" x1="548" y1="40" x2="548" y2="180"/><line class="sD" x1="571" y1="40" x2="571" y2="180"/>
<text class="sC" x="180" y="204" text-anchor="middle">control (grey) vs treatment (green)</text><text class="sC" x="540" y="204" text-anchor="middle">Y′ = Y − θ (pre-period Y − its mean)</text>
<text class="sS" x="360" y="228" text-anchor="middle">removing what pre-experiment behaviour already predicts shrinks the variance, so the test needs fewer users</text>
</svg><figcaption>CUPED doesn't change the effect, only the noise around it. Less noise means a smaller sample for the same power.</figcaption></figure>

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

<figure class="dia"><svg viewBox="0 0 720 240" role="img" aria-label="Difference-in-differences: Cairo and Alexandria trend in parallel before a policy in Cairo; afterwards Cairo rises more, and the gap to Cairo's projected path, plus 6, is the effect">
<line class="sLm" x1="70" y1="210" x2="610" y2="210" marker-end="url(#ahm)"/><line class="sLm" x1="70" y1="210" x2="70" y2="40" marker-end="url(#ahm)"/>
<line class="sLr" x1="335" y1="40" x2="335" y2="210" stroke-dasharray="6 4"/><text class="sRt" x="335" y="34" text-anchor="middle">new fee policy (Cairo only)</text>
<polyline class="sLm" points="90.0,190.0 160.0,180.0 230.0,170.0 300.0,160.0 370.0,150.0 440.0,145.0 510.0,135.0 580.0,130.0" fill="none" stroke-width="2.5"/><polyline class="sL" points="90.0,140.0 160.0,130.0 230.0,120.0 300.0,110.0 370.0,80.0 440.0,70.0 510.0,60.0 580.0,50.0" fill="none" stroke-width="2.5"/>
<polyline class="sL" points="300.0,110.0 370.0,100.0 440.0,95.0 510.0,85.0 580.0,80.0" fill="none" stroke-width="2" stroke-dasharray="5 4" opacity=".6"/>
<text class="sT" x="588" y="54">Cairo</text><text class="sC" x="588" y="134">Alexandria</text><text class="sC" x="588" y="84">Cairo without it</text>
<path class="sLg" d="M570 50 H576 V80 H570" fill="none" stroke-width="2"/><text class="sGt" x="564" y="69" text-anchor="end">effect +6</text>
<text class="sC" x="90" y="228" text-anchor="middle">wk 1</text>
<text class="sC" x="160" y="228" text-anchor="middle">wk 2</text>
<text class="sC" x="230" y="228" text-anchor="middle">wk 3</text>
<text class="sC" x="300" y="228" text-anchor="middle">wk 4</text>
<text class="sC" x="370" y="228" text-anchor="middle">wk 5</text>
<text class="sC" x="440" y="228" text-anchor="middle">wk 6</text>
<text class="sC" x="510" y="228" text-anchor="middle">wk 7</text>
<text class="sC" x="580" y="228" text-anchor="middle">wk 8</text>
<text class="sC" x="195" y="80" text-anchor="middle">parallel before: the key assumption</text>
</svg><figcaption>The dashed line is Cairo's counterfactual, borrowed from Alexandria's change. The effect is the gap at the end.</figcaption></figure>

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

<figure class="dia"><svg viewBox="0 0 720 240" role="img" aria-label="Regression discontinuity: next-year spend rises smoothly with last year's spend except for a jump at the 5,000 pound Gold threshold, which estimates the effect of Gold status">
<line class="sLm" x1="60" y1="210" x2="670" y2="210" marker-end="url(#ahm)"/><line class="sLm" x1="60" y1="210" x2="60" y2="30" marker-end="url(#ahm)"/>
<circle class="sP" cx="59.8" cy="183.3" r="3.5"/>
<circle class="sP" cx="67.8" cy="169.0" r="3.5"/>
<circle class="sP" cx="77.0" cy="176.8" r="3.5"/>
<circle class="sP" cx="92.4" cy="185.0" r="3.5"/>
<circle class="sP" cx="100.3" cy="169.6" r="3.5"/>
<circle class="sP" cx="107.2" cy="174.5" r="3.5"/>
<circle class="sP" cx="121.2" cy="170.0" r="3.5"/>
<circle class="sP" cx="131.4" cy="175.8" r="3.5"/>
<circle class="sP" cx="138.4" cy="175.7" r="3.5"/>
<circle class="sP" cx="150.0" cy="152.5" r="3.5"/>
<circle class="sP" cx="160.5" cy="154.4" r="3.5"/>
<circle class="sP" cx="169.3" cy="153.6" r="3.5"/>
<circle class="sP" cx="177.6" cy="163.9" r="3.5"/>
<circle class="sP" cx="191.0" cy="150.1" r="3.5"/>
<circle class="sP" cx="199.5" cy="165.1" r="3.5"/>
<circle class="sP" cx="208.6" cy="160.3" r="3.5"/>
<circle class="sP" cx="218.7" cy="142.9" r="3.5"/>
<circle class="sP" cx="228.2" cy="139.1" r="3.5"/>
<circle class="sP" cx="242.3" cy="158.2" r="3.5"/>
<circle class="sP" cx="249.3" cy="145.5" r="3.5"/>
<circle class="sP" cx="257.1" cy="145.8" r="3.5"/>
<circle class="sP" cx="272.4" cy="151.1" r="3.5"/>
<circle class="sP" cx="280.6" cy="149.4" r="3.5"/>
<circle class="sP" cx="290.5" cy="127.5" r="3.5"/>
<circle class="sP" cx="298.2" cy="149.1" r="3.5"/>
<circle class="sP" cx="307.5" cy="133.6" r="3.5"/>
<circle class="sP" cx="317.1" cy="143.7" r="3.5"/>
<circle class="sP" cx="330.0" cy="119.6" r="3.5"/>
<circle class="sP" cx="339.5" cy="131.4" r="3.5"/>
<circle class="sP" cx="350.8" cy="137.3" r="3.5"/>
<circle class="sPg" cx="360.5" cy="113.4" r="3.5"/>
<circle class="sPg" cx="370.7" cy="91.1" r="3.5"/>
<circle class="sPg" cx="377.3" cy="100.4" r="3.5"/>
<circle class="sPg" cx="390.6" cy="108.5" r="3.5"/>
<circle class="sPg" cx="398.6" cy="85.1" r="3.5"/>
<circle class="sPg" cx="413.0" cy="105.1" r="3.5"/>
<circle class="sPg" cx="421.2" cy="82.0" r="3.5"/>
<circle class="sPg" cx="428.4" cy="89.6" r="3.5"/>
<circle class="sPg" cx="437.3" cy="94.3" r="3.5"/>
<circle class="sPg" cx="451.0" cy="86.0" r="3.5"/>
<circle class="sPg" cx="461.6" cy="97.1" r="3.5"/>
<circle class="sPg" cx="469.1" cy="75.5" r="3.5"/>
<circle class="sPg" cx="480.5" cy="84.2" r="3.5"/>
<circle class="sPg" cx="489.4" cy="68.6" r="3.5"/>
<circle class="sPg" cx="500.4" cy="91.8" r="3.5"/>
<circle class="sPg" cx="511.8" cy="81.6" r="3.5"/>
<circle class="sPg" cx="519.6" cy="83.2" r="3.5"/>
<circle class="sPg" cx="529.7" cy="78.5" r="3.5"/>
<circle class="sPg" cx="537.5" cy="69.1" r="3.5"/>
<circle class="sPg" cx="547.6" cy="63.2" r="3.5"/>
<circle class="sPg" cx="557.2" cy="61.6" r="3.5"/>
<circle class="sPg" cx="571.8" cy="66.2" r="3.5"/>
<circle class="sPg" cx="581.3" cy="71.0" r="3.5"/>
<circle class="sPg" cx="591.4" cy="64.5" r="3.5"/>
<circle class="sPg" cx="598.4" cy="49.2" r="3.5"/>
<circle class="sPg" cx="609.4" cy="62.6" r="3.5"/>
<circle class="sPg" cx="622.2" cy="60.3" r="3.5"/>
<circle class="sPg" cx="631.0" cy="63.9" r="3.5"/>
<circle class="sPg" cx="642.1" cy="59.6" r="3.5"/>
<circle class="sPg" cx="647.3" cy="40.0" r="3.5"/>
<polyline class="sLm" points="60.0,180.0 360.0,125.0" fill="none" stroke-width="2.5"/><polyline class="sLg" points="360.0,105.0 660.0,50.0" fill="none" stroke-width="2.5"/>
<line class="sLr" x1="360" y1="30" x2="360" y2="210" stroke-dasharray="6 4"/><text class="sRt" x="360" y="24" text-anchor="middle">Gold status from EGP 5,000</text>
<path class="sLw" d="M368 125 V105" stroke-width="3"/><text class="sWt" x="374" y="119">jump ≈ effect</text>
<text class="sC" x="60" y="228" text-anchor="middle">3,000</text>
<text class="sC" x="210" y="228" text-anchor="middle">4,000</text>
<text class="sC" x="360" y="228" text-anchor="middle">5,000</text>
<text class="sC" x="510" y="228" text-anchor="middle">6,000</text>
<text class="sC" x="660" y="228" text-anchor="middle">7,000</text>
<text class="sC" x="66" y="26">next year's spend</text>
</svg><figcaption>Customers at EGP 4,950 and 5,050 are alike in every way except the badge. The jump at the line is the effect, for customers near it.</figcaption></figure>

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

<figure class="dia"><svg viewBox="0 0 720 224" role="img" aria-label="Four customer types by behaviour with and without an offer: persuadables, lost causes, sure things and sleeping dogs; a churn model targets the top row while uplift targets persuadables">
<text class="sM" x="275" y="22" text-anchor="middle">with the offer</text><text class="sT" x="200" y="44" text-anchor="middle">stays</text><text class="sT" x="350" y="44" text-anchor="middle">churns</text>
<text class="sT" x="100" y="90" text-anchor="end">churns</text><text class="sT" x="100" y="170" text-anchor="end">stays</text><text class="sM" x="60" y="130" text-anchor="end">without</text>
<rect class="sG" x="125" y="54" width="146" height="74" rx="8"/><text class="sT" x="198" y="86" text-anchor="middle">persuadables</text><text class="sC" x="198" y="106" text-anchor="middle">target these</text>
<rect class="sN" x="275" y="54" width="146" height="74" rx="8"/><text class="sT" x="348" y="86" text-anchor="middle">lost causes</text><text class="sC" x="348" y="106" text-anchor="middle">wasted cost</text>
<rect class="sN" x="125" y="134" width="146" height="74" rx="8"/><text class="sT" x="198" y="166" text-anchor="middle">sure things</text><text class="sC" x="198" y="186" text-anchor="middle">wasted discount</text>
<rect class="sR" x="275" y="134" width="146" height="74" rx="8"/><text class="sT" x="348" y="166" text-anchor="middle">sleeping dogs</text><text class="sC" x="348" y="186" text-anchor="middle">the offer hurts</text>
<rect class="sN" x="116" y="50" width="310" height="82" rx="10" style="fill:none;stroke:var(--mid);stroke-width:2" stroke-dasharray="6 4"/>
<text class="sWt" x="450" y="76">a churn model ranks the top row</text><text class="sWt" x="450" y="94">(high risk without an offer)</text>
<text class="sGt" x="450" y="140">an uplift model ranks the</text><text class="sGt" x="450" y="158">green box only</text>
</svg><figcaption>Risk and responsiveness are different questions. Spending the retention budget on lost causes is the most common waste in CRM.</figcaption></figure>

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
