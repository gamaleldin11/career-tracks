# Product Analytics and Experiments — Events, Funnels, Retention, Attribution and A/B Tests in Practice

Analysts at app-based companies (delivery, fintech, e-commerce, ride-hailing) spend their days on product questions: did the new onboarding improve activation, which channel brings customers who stay, should we launch free delivery, did the test win? This module applies the statistics from [[S6]] and the SQL from [[DA3]] to those questions: tracking events properly, the AARRR framework, retention, attribution, running and reading experiments, and a worked product case of the kind interviewers love.

> [!focus]
> **Entry must:** read an event tracking plan; define activation and retention; analyse a funnel; interpret an A/B test result correctly; explain first-touch vs last-touch attribution.
> **Mid adds:** designing a tracking plan, retention curve types, experiment checks (SRM, novelty, guardrails), when you can't randomise, incrementality and ROAS, structured product-case answers.
> **Most asked:** *How would you measure the success of a new feature?* · *Activation vs retention?* · *The test shows +2% conversion with p = 0.04. Ship it?* · *Which marketing channel is best?* · *Should we launch free delivery?*
> **Time budget:** 3 hours.

## DA6.1 Event tracking: the raw material 🟢 ⭐

Product analytics runs on **events**: things users do, recorded with a timestamp, a user or device ID, and **properties**.

```json
{ "event": "order_completed", "user_id": "u_8231", "anonymous_id": "dev_77f…", "timestamp": "2026-10-03T18:42:11Z",
  "properties": { "order_id": "o_99120", "amount_egp": 845.00, "items": 3, "payment_method": "wallet",
                  "city": "Giza", "app_version": "5.2.0", "platform": "android" } }
```

> [!term] Tracking plan
> The specification of every tracked event: its name, when exactly it fires, its properties and their types, and who owns it. Without one, teams end up with `OrderComplete`, `order_completed` and `purchase` meaning slightly different things, and every analysis starts with archaeology.

**Good practice:** a consistent naming convention (`object_action` in the past tense: `cart_viewed`, `order_completed`); fire key business events (orders, payments) from the **server**, not the client, because ad blockers and flaky networks drop client events; link anonymous and logged-in identities at sign-up or login; version the plan and validate events in CI or a schema registry.

**Tools you'll meet:** Google Analytics 4 (event-based, with a free export to BigQuery), Mixpanel, Amplitude, PostHog (open source), Firebase for mobile, and the company's own warehouse tables.

## DA6.2 The AARRR funnel 🟢 ⭐

"Pirate metrics" (Dave McClure) give a shared vocabulary for the customer life cycle:

| Stage | Question | Example metrics (delivery app) |
|---|---|---|
| **Acquisition** | How do people find us? | Installs and sign-ups by channel, CAC |
| **Activation** | Do they get value in the first session or week? | % who place a first order within 7 days of sign-up |
| **Retention** | Do they come back? | % ordering again in weeks 2–4; cohort curves |
| **Referral** | Do they bring others? | Invites sent, referral sign-ups |
| **Revenue** | Do we make money? | AOV, orders per user, contribution margin, LTV |

> [!term] Activation and the "aha moment"
> Activation is the first experience of the product's core value. Teams look for the behaviour most predictive of long-term retention (for example "ordered twice in the first 14 days") and design onboarding to drive users to it. Finding that behaviour is a correlation analysis, so validate it with an experiment before treating it as causal.

## DA6.3 Retention, measured three ways 🟡 ⭐

| Type | Definition | Use |
|---|---|---|
| **N-day (classic)** | Active **on** day N (or in week N) after start | Products used on specific days |
| **Unbounded (on or after)** | Active **on or after** day N | Infrequent products (travel, insurance) |
| **Bracket / rolling** | Active within a window (days 7–13, 14–20…) | Weekly-use products |

Always define **active** (opened the app? placed an order?), the start event, and the time zone. Plot retention curves by cohort ([[DA3.4]]); a curve that flattens means a retained core.

**Churn for non-subscription products** must be defined by inactivity ("no order in 60 days"); choose the window from the data (most returning users come back within X days).

## DA6.4 Running and reading experiments, as an analyst 🟢 🟡 ⭐

The theory is in [[S6.9]]. In practice, analysts **design**, **check** and **interpret**:

**Before launch:** one primary metric (orders per user in 14 days), guardrails (refund rate, support tickets, delivery time), the randomisation unit (user), the sample size and duration (whole weeks; avoid Ramadan or White Friday unless it's the point), and the segments you'll look at, written down.

**During:** no peeking-driven stopping; watch only guardrails for harm.

**After, in this order:**

1. **Sample ratio mismatch?** Check the split with a chi-square test. A mismatch means stop and debug.
2. **Primary metric:** the effect, its **confidence interval**, and its p-value.
3. **Guardrails:** anything worse?
4. **Pre-planned segments** (new vs returning, platform), treating unplanned segment "wins" as hypotheses for a new test, not conclusions.
5. **Practical significance:** is the lift worth its cost? ([[S6.10]])

```python
# Analysing a conversion test in Python
from statsmodels.stats.proportion import proportions_ztest, confint_proportions_2indep
conv = [1320, 1210]; n = [10_000, 10_000]               # treatment, control
z, p = proportions_ztest(conv, n)
low, high = confint_proportions_2indep(conv[0], n[0], conv[1], n[1], compare="diff")
print(f"lift = {conv[0]/n[0] - conv[1]/n[1]:.3%}, 95% CI [{low:.3%}, {high:.3%}], p = {p:.3f}")
```

> [!say]
> "Conversion went from 12.1% to 13.2%, a lift of 1.1 points with a 95% interval of roughly 0.2 to 2.0 points and p of about 0.02. So the improvement is very likely real, though it could be as small as 0.2 points. Guardrails are flat and the sample ratio is fine. Given the change is cheap to maintain, I'd ship it, and keep a small holdout for a month to confirm the effect persists."

**Experiment types you'll hear:** A/B/n (several variants), **holdout groups** (a share of users never gets a feature, to measure its long-term effect), **switchback** tests (alternating treatment by time window, for marketplace or delivery-dispatch changes where users affect each other), and **geo experiments** (by city or region).

**When you can't randomise** (a city-wide price change, a TV campaign), compare against a **control group** that wasn't exposed and use **difference-in-differences**, or a synthetic control ([[DS5]]). A naive before-and-after comparison confuses the change with seasonality and trends.

## DA6.5 Marketing analytics and attribution 🟡 ⭐

**UTM parameters** (`utm_source`, `utm_medium`, `utm_campaign`) on links tell you where a visit came from.

| Attribution model | Credit goes to | Bias |
|---|---|---|
| **Last touch** | The final touchpoint before conversion | Over-credits bottom-funnel channels (branded search, retargeting) |
| **First touch** | The first touchpoint | Over-credits awareness channels |
| **Linear / time-decay / position-based** | Shared by a rule | Rules are arbitrary |
| **Data-driven** (GA4's default) | Shared by a model of conversion paths | A black box; needs volume |

> [!term] Incrementality
> The conversions that happened **because of** a channel or campaign, beyond what would have happened anyway. Attribution models assign credit; only **experiments** (holdouts, geo tests, conversion-lift studies) measure incrementality. A retargeting campaign can show great last-touch ROAS while adding almost nothing, because those users were going to buy anyway.

**Metrics:** **ROAS** (revenue ÷ ad spend), **CAC** by channel, **CAC payback period** (months of margin to recover CAC), and LTV by acquisition channel (channels differ in the *quality* of customers, not just cost).

> [!say]
> "I'd judge channels on the lifetime value of the customers they bring relative to acquisition cost, not just on last-touch conversions, because last-touch over-credits channels that capture demand rather than create it. For big budget decisions I'd ask for a holdout or geo test to measure incrementality."

## DA6.6 Pricing and promotions 🟡

- **Promotion analysis:** compare sales during the promotion with a **baseline** (a forecast or a control region), then subtract **cannibalisation** (customers who'd have bought anyway, or switched from other products) and the **pull-forward** dip after it ends; add any **halo** on other products.
- **Price elasticity** (roughly the % change in quantity ÷ % change in price) needs variation in price that isn't driven by demand itself, ideally from experiments; naive regressions of sales on price are confounded.
- **Discount depth vs frequency:** constant discounts train customers to wait for them.

## DA6.7 Simple forecasting for analysts 🟢

Before any model, establish baselines ([[DS6]] goes deeper):

- **Naive:** next period = this period.
- **Seasonal naive:** next Monday = last Monday; next Ramadan = last Ramadan (moved by the calendar shift).
- **Moving average** and **year-over-year growth applied to last year**.
- Excel's **Forecast Sheet** (exponential smoothing) for quick, explainable forecasts with intervals.

State the assumptions and show a range, not a single number.

## DA6.8 A worked product case: "Should we launch free delivery?" 🟡 ⭐

A typical 30-minute case. Structure your answer:

**1. Clarify the goal.** Grow orders? Retention? Win back churned users? Compete with a rival's offer? Free for everyone, above a minimum basket, or for subscribers?

**2. Frame the economics** (a metric tree, [[DA1.4]]): contribution per order = AOV × margin − delivery cost − payment fees. Free delivery removes the fee revenue (or adds a subsidy), so it pays off only if it raises **order frequency**, **conversion** or **basket size** (with a minimum basket threshold) enough, or improves **retention** and LTV.

**3. Use existing data first:** how does conversion vary with the delivery fee shown at checkout (natural variation by distance)? What happened in past free-delivery promotions (with cannibalisation and pull-forward)? What share of carts are abandoned at the fee step?

**4. Propose a test:** randomise by user (or by city with switchback for courier capacity effects); variants: free delivery over EGP X vs control; primary metric: contribution margin per user over 4 weeks; guardrails: delivery time (couriers may be overloaded), refund rate, basket size; plus a check on the minimum-basket effect (do people add items to qualify?).

**5. Decide:** roll out if margin per user rises with acceptable confidence and guardrails hold; consider targeting (only for at-risk or low-frequency users) if the overall effect is negative but some segments benefit, and validate that segment in a follow-up test.

> [!say]
> "I'd first clarify the goal, then frame it as unit economics: free delivery costs the fee on every order, so it only pays if it lifts frequency, conversion or basket size enough. I'd check what past promotions and checkout abandonment tell us, then run a four-week test with a minimum basket, measuring contribution margin per user, with delivery time and refunds as guardrails. If it loses money overall but works for lapsed users, I'd test a targeted version."

> [!lab] Analyse a public experiment
> Kaggle has public A/B test datasets (for example landing-page tests and the Cookie Cats mobile-game retention test). Pick one: check sample ratio mismatch, compute the lift with a confidence interval in Python, check a guardrail or second metric, and write a five-sentence decision memo in the style of the "say it" box above. Add it to your analyst portfolio.

## DA6.9 Interview drill 🟢 ⭐

| Question | Strong short answer |
|---|---|
| What is a tracking plan? | The specification of events, when they fire, their properties and owners, so data is consistent. |
| Why track orders server-side? | Client events are lost to ad blockers and network failures; business-critical events need to be reliable. |
| What is AARRR? | Acquisition, activation, retention, referral, revenue: the customer life-cycle funnel. |
| Activation vs retention? | Activation is the first experience of core value; retention is coming back afterwards. |
| N-day vs unbounded retention? | Active exactly on day N vs active on or after day N. |
| What do you check first in an A/B result? | Sample ratio mismatch, then the primary metric with its confidence interval, then guardrails. |
| p = 0.04 and +2%. Ship? | Check the CI, guardrails and SRM, and whether the lift is worth the cost; then decide, possibly with a holdout. |
| What if you can't randomise? | A comparison group with difference-in-differences or a synthetic control, not a naive before-after. |
| Last-touch vs first-touch attribution? | Credit to the final vs the first touchpoint; each biases toward bottom- or top-funnel channels. |
| What is incrementality? | Conversions caused by a channel beyond what would happen anyway, measured with experiments. |
| How do you evaluate a promotion? | Sales vs a baseline, minus cannibalisation and pull-forward, plus halo, against its cost. |
| How would you decide on free delivery? | Frame the unit economics, use existing data, test with a minimum basket on margin per user with delivery-time and refund guardrails. |

## Key takeaways

> [!check]
> - Good analysis needs good events: a tracking plan, consistent names, server-side business events.
> - AARRR gives structure; define activation and "active" precisely.
> - Read experiments in order: SRM, primary effect with CI, guardrails, planned segments, practical value.
> - Attribution assigns credit; experiments measure incrementality.
> - Product cases: goal, unit economics, existing data, a well-designed test, a decision rule.

## Sources

- Ron Kohavi, Diane Tang and Ya Xu, *Trustworthy Online Controlled Experiments* (Cambridge University Press, 2020).
- Dave McClure, "Startup Metrics for Pirates: AARRR!" (2007 talk); Alistair Croll and Benjamin Yoskovitz, *Lean Analytics* (2013).
- Google: [GA4 events](https://support.google.com/analytics/answer/9322688), [GA4 attribution models](https://support.google.com/analytics/answer/10596866), [BigQuery export for GA4](https://support.google.com/analytics/answer/9358801).
- Amplitude, [Retention analytics playbook](https://amplitude.com/books/mastering-retention) (free); Segment, [Tracking plan best practices](https://segment.com/docs/protocols/tracking-plan/best-practices/).
- statsmodels: [proportion tests and confidence intervals](https://www.statsmodels.org/stable/stats.html#proportion).
- Kaggle: [Mobile Games A/B Testing (Cookie Cats)](https://www.kaggle.com/datasets/yufengsui/mobile-games-ab-testing).
