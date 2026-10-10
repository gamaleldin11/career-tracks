# Product Analytics and Experiments — Events, Funnels, Retention, Attribution and A/B Tests in Practice

Analysts at app-based companies (delivery, fintech, e-commerce, ride-hailing) spend their days on product questions: did the new onboarding improve activation, which channel brings customers who stay, should we launch free delivery, did the test win? This module applies the statistics from [[S6]] and the SQL from [[DA3]] to those questions: tracking events properly, the AARRR framework, retention, attribution, running and reading experiments, and a worked product case of the kind interviewers love.

> [!focus]
> **Entry must:** read an event tracking plan; define activation and retention; analyse a funnel; interpret an A/B test result correctly; explain first-touch vs last-touch attribution.
> **Mid adds:** designing a tracking plan, retention curve types, experiment checks (SRM, novelty, guardrails), when you can't randomise, incrementality and ROAS, structured product-case answers.
> **Most asked:** *How would you measure the success of a new feature?* · *Activation vs retention?* · *The test shows +2% conversion with p = 0.04. Ship it?* · *Which marketing channel is best?* · *Should we launch free delivery?*
> **Time budget:** 3 hours.

## DA6.0 Foundations: how product data gets collected 🟢

Product analytics studies **behaviour**, and behaviour reaches you as **events**. How they're collected decides what you can trust:

- The **app or website** sends events through an SDK (Google Analytics, Mixpanel, Firebase). Some are always lost: ad blockers, closed tabs, flaky mobile networks, users who decline tracking.
- The **server** records business events (orders, payments) in its own database. That's the truth for money.
- A **pipeline** lands both in a warehouse, usually as an `events` table with one row per event: a timestamp, an ID and properties.
- **Identity stitching** joins the story: before login a visitor only has an `anonymous_id` (a device or cookie ID); when they log in, it's linked to their `user_id`, so the earlier browsing counts towards the same person.

So "orders this week" can differ between the analytics tool and the database, and both can be right about different things. Reconcile money against the server; use client events for behaviour.

<figure class="dia anim"><svg viewBox="0 0 720 252" role="img" aria-label="Animation: client events from the app and website go through an analytics tool into a warehouse events table, while server orders reach an orders table through a nightly ETL; some client events are lost to ad blockers">
<rect class="sB" x="14" y="20" width="130" height="50" rx="8"/><text class="sT" x="79" y="43" text-anchor="middle">mobile app</text><text class="sC" x="79" y="59" text-anchor="middle">Firebase SDK</text><rect class="sB" x="14" y="100" width="130" height="50" rx="8"/><text class="sT" x="79" y="123" text-anchor="middle">website</text><text class="sC" x="79" y="139" text-anchor="middle">GA4 tag</text><rect class="sA" x="14" y="190" width="130" height="50" rx="8"/><text class="sT" x="79" y="213" text-anchor="middle">API server</text><text class="sC" x="79" y="229" text-anchor="middle">orders, payments</text>
<rect class="sV" x="210" y="60" width="150" height="56" rx="8"/><text class="sT" x="285" y="86" text-anchor="middle">analytics tool</text><text class="sC" x="285" y="102" text-anchor="middle">GA4 · Mixpanel</text><rect class="sW" x="210" y="190" width="150" height="50" rx="8"/><text class="sT" x="285" y="213" text-anchor="middle">nightly ETL</text><text class="sC" x="285" y="229" text-anchor="middle">from the app DB</text>
<line class="sL" x1="144" y1="45" x2="206" y2="78" marker-end="url(#ah)"/><line class="sL" x1="144" y1="125" x2="206" y2="100" marker-end="url(#ah)"/><line class="sL" x1="144" y1="215" x2="206" y2="215" marker-end="url(#ah)"/>
<text class="sRt" x="150" y="168">✗ ad blocker, offline,</text><text class="sRt" x="150" y="184">  declined consent</text>
<rect class="sN" x="420" y="50" width="170" height="180" rx="10"/><text class="sT" x="505" y="72" text-anchor="middle">warehouse</text>
<rect class="sV" x="436" y="86" width="138" height="50" rx="6"/><text class="sT" x="505" y="108" text-anchor="middle">events</text><text class="sC" x="505" y="126" text-anchor="middle">behaviour</text>
<rect class="sA" x="436" y="156" width="138" height="50" rx="6"/><text class="sT" x="505" y="178" text-anchor="middle">orders</text><text class="sC" x="505" y="196" text-anchor="middle">the truth for money</text>
<line class="sL" x1="360" y1="88" x2="432" y2="108" marker-end="url(#ah)"/><line class="sL" x1="360" y1="215" x2="432" y2="185" marker-end="url(#ah)"/>
<line class="sL" x1="590" y1="140" x2="616" y2="140" marker-end="url(#ah)"/><rect class="sG" x="620" y="115" width="86" height="50" rx="8"/><text class="sT" x="663" y="138" text-anchor="middle">you</text><text class="sC" x="663" y="154" text-anchor="middle">SQL</text>
<circle class="sP" r="5"><animateMotion dur="3.5s" repeatCount="indefinite" path="M144 45 L210 80 H360 L436 108"/></circle><circle class="sPg" r="5"><animateMotion dur="3.5s" begin="1.2s" repeatCount="indefinite" path="M144 215 H360 L436 185"/></circle>
</svg><figcaption>Two roads into the warehouse. Client events describe behaviour but leak; server records are complete for money.</figcaption></figure>

<figure class="dia"><svg viewBox="0 0 720 208" role="img" aria-label="Identity stitching: events from an anonymous device ID before login are linked to the user ID after login, joining one person's journey">
<text class="sM" x="14" y="22">before stitching: two "people"</text>
<rect class="sB" x="14" y="30" width="160" height="46" rx="8"/><text class="sC" x="24" y="49" xml:space="preserve" style="white-space:pre">dev_77f</text><text class="sC" x="94" y="68" text-anchor="middle">item_viewed</text>
<line class="sLm" x1="174" y1="53" x2="188" y2="53" marker-end="url(#ahm)"/>
<rect class="sB" x="190" y="30" width="160" height="46" rx="8"/><text class="sC" x="200" y="49" xml:space="preserve" style="white-space:pre">dev_77f</text><text class="sC" x="270" y="68" text-anchor="middle">cart_viewed</text>
<line class="sLm" x1="350" y1="53" x2="364" y2="53" marker-end="url(#ahm)"/>
<rect class="sA" x="366" y="30" width="160" height="46" rx="8"/><text class="sC" x="376" y="49" xml:space="preserve" style="white-space:pre">u_8231</text><text class="sC" x="446" y="68" text-anchor="middle">logged_in</text>
<line class="sLm" x1="526" y1="53" x2="540" y2="53" marker-end="url(#ahm)"/>
<rect class="sA" x="542" y="30" width="160" height="46" rx="8"/><text class="sC" x="552" y="49" xml:space="preserve" style="white-space:pre">u_8231</text><text class="sC" x="622" y="68" text-anchor="middle">order_completed</text>
<text class="sM" x="14" y="108">after: one person, one journey</text>
<rect class="sA" x="14" y="116" width="160" height="46" rx="8"/><text class="sC" x="24" y="135" xml:space="preserve" style="white-space:pre">u_8231</text><text class="sC" x="94" y="154" text-anchor="middle">item_viewed</text>
<line class="sLm" x1="174" y1="139" x2="188" y2="139" marker-end="url(#ahm)"/>
<rect class="sA" x="190" y="116" width="160" height="46" rx="8"/><text class="sC" x="200" y="135" xml:space="preserve" style="white-space:pre">u_8231</text><text class="sC" x="270" y="154" text-anchor="middle">cart_viewed</text>
<line class="sLm" x1="350" y1="139" x2="364" y2="139" marker-end="url(#ahm)"/>
<rect class="sA" x="366" y="116" width="160" height="46" rx="8"/><text class="sC" x="376" y="135" xml:space="preserve" style="white-space:pre">u_8231</text><text class="sC" x="446" y="154" text-anchor="middle">logged_in</text>
<line class="sLm" x1="526" y1="139" x2="540" y2="139" marker-end="url(#ahm)"/>
<rect class="sA" x="542" y="116" width="160" height="46" rx="8"/><text class="sC" x="552" y="135" xml:space="preserve" style="white-space:pre">u_8231</text><text class="sC" x="622" y="154" text-anchor="middle">order_completed</text>
<text class="sS" x="360" y="196" text-anchor="middle">the login links the device's anonymous_id to the user_id, so the browsing before it counts too</text>
</svg><figcaption>Without stitching, every funnel undercounts: the view and the purchase look like two different people.</figcaption></figure>

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

<figure class="dia"><svg viewBox="0 0 720 200" role="img" aria-label="AARRR funnel: acquisition, activation, retention and revenue, with referral feeding back into acquisition">
<rect class="sB" x="14" y="40" width="160" height="56" rx="8"/><text class="sT" x="94" y="66" text-anchor="middle">Acquisition</text><text class="sC" x="94" y="82" text-anchor="middle">channels · CAC</text>
<line class="sLm" x1="174" y1="68" x2="188" y2="68" marker-end="url(#ahm)"/>
<rect class="sV" x="190" y="40" width="160" height="56" rx="8"/><text class="sT" x="270" y="66" text-anchor="middle">Activation</text><text class="sC" x="270" y="82" text-anchor="middle">first order in 7 days</text>
<line class="sLm" x1="350" y1="68" x2="364" y2="68" marker-end="url(#ahm)"/>
<rect class="sA" x="366" y="40" width="160" height="56" rx="8"/><text class="sT" x="446" y="66" text-anchor="middle">Retention</text><text class="sC" x="446" y="82" text-anchor="middle">ordering again, wk 2–4</text>
<line class="sLm" x1="526" y1="68" x2="540" y2="68" marker-end="url(#ahm)"/>
<rect class="sG" x="542" y="40" width="160" height="56" rx="8"/><text class="sT" x="622" y="66" text-anchor="middle">Revenue</text><text class="sC" x="622" y="82" text-anchor="middle">AOV · margin · LTV</text>
<rect class="sW" x="366" y="136" width="160" height="50" rx="8"/><text class="sT" x="446" y="159" text-anchor="middle">Referral</text><text class="sC" x="446" y="175" text-anchor="middle">invites · sign-ups</text>
<path class="sLw" d="M446 96 V134" marker-end="url(#ahw)"/><path class="sLw" d="M366 161 H94 V100" fill="none" marker-end="url(#ahw)"/>
<text class="sWt" x="220" y="154" text-anchor="middle">happy users bring new ones</text>
</svg><figcaption>Pirate metrics: one shared map of the customer life cycle, with a metric at each stage.</figcaption></figure>

> [!term] Activation and the "aha moment"
> Activation is the first experience of the product's core value. Teams look for the behaviour most predictive of long-term retention (for example "ordered twice in the first 14 days") and design onboarding to drive users to it. Finding that behaviour is a correlation analysis, so validate it with an experiment before treating it as causal.

## DA6.3 Retention, measured three ways 🟡 ⭐

| Type | Definition | Use |
|---|---|---|
| **N-day (classic)** | Active **on** day N (or in week N) after start | Products used on specific days |
| **Unbounded (on or after)** | Active **on or after** day N | Infrequent products (travel, insurance) |
| **Bracket / rolling** | Active within a window (days 7–13, 14–20…) | Weekly-use products |

<figure class="dia"><svg viewBox="0 0 720 208" role="img" aria-label="One user active on days 0, 3, 9, 16 and 24 judged by three retention definitions: not retained on exactly day 14, retained on or after day 14, retained in the day 14 to 20 bracket">
<line class="sLm" x1="120" y1="40" x2="606" y2="40" marker-end="url(#ahm)"/>
<circle class="sP" cx="120" cy="40" r="6"/>
<circle class="sP" cx="168" cy="40" r="6"/>
<circle class="sP" cx="264" cy="40" r="6"/>
<circle class="sP" cx="376" cy="40" r="6"/>
<circle class="sP" cx="504" cy="40" r="6"/>
<text class="sC" x="120" y="26" text-anchor="middle">day 0</text>
<text class="sC" x="232" y="26" text-anchor="middle">day 7</text>
<text class="sC" x="344" y="26" text-anchor="middle">day 14</text>
<text class="sC" x="456" y="26" text-anchor="middle">day 21</text>
<text class="sC" x="568" y="26" text-anchor="middle">day 28</text>
<text class="sM" x="110" y="44" text-anchor="end">one user</text>
<text class="sT" x="110" y="87" text-anchor="end">N-day</text><rect class="sW" x="336" y="70" width="16" height="24" rx="4" opacity=".55"/><text class="sRt" x="358" y="87">✗ not counted</text>
<text class="sT" x="110" y="125" text-anchor="end">unbounded</text><rect class="sW" x="336" y="108" width="272" height="24" rx="4" opacity=".55"/><text class="sGt" x="614" y="125">✓ counted</text>
<circle class="sPg" cx="376" cy="120" r="5"/>
<circle class="sPg" cx="504" cy="120" r="5"/>
<text class="sT" x="110" y="163" text-anchor="end">bracket</text><rect class="sW" x="336" y="146" width="112" height="24" rx="4" opacity=".55"/><text class="sGt" x="454" y="163">✓ counted</text>
<circle class="sPg" cx="376" cy="158" r="5"/>
<text class="sS" x="360" y="196" text-anchor="middle">same user, same data: "retained at day 14?" depends entirely on the definition</text>
</svg><figcaption>Pick the definition that matches how often people naturally use the product, then never change it silently.</figcaption></figure>

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

<figure class="dia"><svg viewBox="0 0 720 238" role="img" aria-label="Experiment results as intervals: the primary metric rises 9% with an interval from 2% to 16%, excluding zero; three guardrails have intervals around zero and outside the harm zone">
<rect class="sR" x="520" y="30" width="144" height="160" rx="0" opacity=".12"/><text class="sRt" x="592" y="26" text-anchor="middle">harm zone for guardrails</text>
<line class="sD" x1="400" y1="34" x2="400" y2="190"/>
<text class="sT" x="200" y="55" text-anchor="end">orders per user (primary)</text>
<line class="sLg" x1="424" y1="56" x2="592" y2="56" stroke-width="3"/><circle class="sPg" cx="508" cy="56" r="6"/>
<text class="sGt" x="200" y="71" text-anchor="end">+9% [+2%, +16%]</text>
<text class="sC" x="200" y="93" text-anchor="end">refund rate</text>
<line class="sLm" x1="328" y1="94" x2="520" y2="94" stroke-width="3"/><circle class="sP" cx="424" cy="94" r="6"/>
<text class="sC" x="200" y="109" text-anchor="end">+2% [-6%, +10%]</text>
<text class="sC" x="200" y="131" text-anchor="end">delivery time</text>
<line class="sLm" x1="376" y1="132" x2="448" y2="132" stroke-width="3"/><circle class="sP" cx="412" cy="132" r="6"/>
<text class="sC" x="200" y="147" text-anchor="end">+1% [-2%, +4%]</text>
<text class="sC" x="200" y="169" text-anchor="end">support tickets</text>
<line class="sLm" x1="304" y1="170" x2="568" y2="170" stroke-width="3"/><circle class="sP" cx="436" cy="170" r="6"/>
<text class="sC" x="200" y="185" text-anchor="end">+3% [-8%, +14%]</text>
<text class="sC" x="160" y="206" text-anchor="middle">-20%</text>
<text class="sC" x="280" y="206" text-anchor="middle">-10%</text>
<text class="sC" x="400" y="206" text-anchor="middle">0</text>
<text class="sC" x="520" y="206" text-anchor="middle">+10%</text>
<text class="sC" x="640" y="206" text-anchor="middle">+20%</text>
<text class="sC" x="400" y="226" text-anchor="middle">relative change, treatment vs control, with 95% confidence intervals</text>
</svg><figcaption>Read the interval, not just the point: the primary metric's whole interval is above zero, and no guardrail reaches the harm zone.</figcaption></figure>

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

<figure class="dia"><svg viewBox="0 0 720 238" role="img" aria-label="One customer journey from a Facebook ad to a Google search to an email to a purchase, with the EGP 1,000 credited differently by last-touch, first-touch, linear and position-based attribution">
<rect class="sB" x="14" y="14" width="160" height="34" rx="17"/><text class="sC" x="94" y="36" text-anchor="middle">Facebook ad</text>
<line class="sLm" x1="174" y1="31" x2="188" y2="31" marker-end="url(#ahm)"/>
<rect class="sV" x="190" y="14" width="160" height="34" rx="17"/><text class="sC" x="270" y="36" text-anchor="middle">Google search</text>
<line class="sLm" x1="350" y1="31" x2="364" y2="31" marker-end="url(#ahm)"/>
<rect class="sW" x="366" y="14" width="160" height="34" rx="17"/><text class="sC" x="446" y="36" text-anchor="middle">email</text>
<line class="sLm" x1="526" y1="31" x2="540" y2="31" marker-end="url(#ahm)"/>
<rect class="sG" x="542" y="14" width="160" height="34" rx="17"/><text class="sC" x="622" y="36" text-anchor="middle">purchase · EGP 1,000</text>
<text class="sT" x="180" y="88" text-anchor="end">last touch</text>
<rect class="sW" x="190" y="70" width="400" height="26" rx="3"/><text class="sC" x="390" y="88" text-anchor="middle">1000</text>
<text class="sT" x="180" y="124" text-anchor="end">first touch</text>
<rect class="sB" x="190" y="106" width="400" height="26" rx="3"/><text class="sC" x="390" y="124" text-anchor="middle">1000</text>
<text class="sT" x="180" y="160" text-anchor="end">linear</text>
<rect class="sB" x="190" y="142" width="133.2" height="26" rx="3"/><text class="sC" x="256.6" y="160" text-anchor="middle">333</text>
<rect class="sV" x="323.2" y="142" width="133.6" height="26" rx="3"/><text class="sC" x="390" y="160" text-anchor="middle">334</text>
<rect class="sW" x="456.8" y="142" width="133.2" height="26" rx="3"/><text class="sC" x="523.4" y="160" text-anchor="middle">333</text>
<text class="sT" x="180" y="196" text-anchor="end">position-based</text>
<rect class="sB" x="190" y="178" width="160" height="26" rx="3"/><text class="sC" x="270" y="196" text-anchor="middle">400</text>
<rect class="sV" x="350" y="178" width="80" height="26" rx="3"/><text class="sC" x="390" y="196" text-anchor="middle">200</text>
<rect class="sW" x="430" y="178" width="160" height="26" rx="3"/><text class="sC" x="510" y="196" text-anchor="middle">400</text>
<text class="sS" x="360" y="226" text-anchor="middle">none of these says what would have happened without the ad: only an experiment measures that</text>
</svg><figcaption>Same journey, four answers to "which channel earned this sale?". Attribution assigns credit; it doesn't prove cause.</figcaption></figure>

> [!term] Incrementality
> The conversions that happened **because of** a channel or campaign, beyond what would have happened anyway. Attribution models assign credit; only **experiments** (holdouts, geo tests, conversion-lift studies) measure incrementality. A retargeting campaign can show great last-touch ROAS while adding almost nothing, because those users were going to buy anyway.

**Metrics:** **ROAS** (revenue ÷ ad spend), **CAC** by channel, **CAC payback period** (months of margin to recover CAC), and LTV by acquisition channel (channels differ in the *quality* of customers, not just cost).

> [!say]
> "I'd judge channels on the lifetime value of the customers they bring relative to acquisition cost, not just on last-touch conversions, because last-touch over-credits channels that capture demand rather than create it. For big budget decisions I'd ask for a holdout or geo test to measure incrementality."

## DA6.6 Pricing and promotions 🟡

- **Promotion analysis:** compare sales during the promotion with a **baseline** (a forecast or a control region), then subtract **cannibalisation** (customers who'd have bought anyway, or switched from other products) and the **pull-forward** dip after it ends; add any **halo** on other products.
- **Price elasticity** (roughly the % change in quantity ÷ % change in price) needs variation in price that isn't driven by demand itself, ideally from experiments; naive regressions of sales on price are confounded.
- **Discount depth vs frequency:** constant discounts train customers to wait for them.

<figure class="dia"><svg viewBox="0 0 720 248" role="img" aria-label="Promotion analysis waterfall: 1,500 orders in the promo week minus 1,000 that would have happened anyway, minus 150 pulled forward from later weeks, minus 100 cannibalised from full-price products, leaving 250 incremental orders">
<line class="sLm" x1="60" y1="200" x2="680" y2="200"/>
<rect class="sB" x="80" y="20" width="80" height="180" rx="3"/><text class="sT" x="120" y="218" text-anchor="middle">promo week</text>
<text class="sC" x="120" y="14" text-anchor="middle">1,500</text>
<rect class="sN" x="202" y="20" width="80" height="120" rx="3"/><text class="sT" x="242" y="218" text-anchor="middle">would buy anyway</text>
<text class="sC" x="242" y="14" text-anchor="middle">−1,000</text>
<rect class="sW" x="324" y="140" width="80" height="18" rx="3"/><text class="sT" x="364" y="218" text-anchor="middle">pulled forward</text>
<text class="sC" x="364" y="134" text-anchor="middle">−150</text>
<rect class="sR" x="446" y="158" width="80" height="12" rx="3"/><text class="sT" x="486" y="218" text-anchor="middle">cannibalised</text>
<text class="sC" x="486" y="152" text-anchor="middle">−100</text>
<rect class="sG" x="568" y="170" width="80" height="30" rx="3"/><text class="sT" x="608" y="218" text-anchor="middle">incremental</text>
<text class="sC" x="608" y="164" text-anchor="middle">250</text>
<text class="sS" x="360" y="236" text-anchor="middle">only the last bar is what the promotion bought; compare its margin with the discount's cost</text>
</svg><figcaption>Promotions look best on the raw count and worst on the incremental one. Report the incremental.</figcaption></figure>

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

<figure class="dia"><svg viewBox="0 0 720 252" role="img" aria-label="Unit economics: contribution per order falls from 77 to 57 Egyptian pounds without the delivery fee, so orders must rise about 35% to keep total contribution the same">
<rect class="sB" x="14" y="18" width="330" height="92" rx="8"/><text class="sT" x="179" y="40" text-anchor="middle">per order today (EGP)</text><text class="sC" x="30" y="64" xml:space="preserve" style="white-space:pre">margin 100 − courier 35 − fees 8</text><text class="sC" x="30" y="86" xml:space="preserve" style="white-space:pre">+ delivery fee 20  =  77</text>
<rect class="sW" x="376" y="18" width="330" height="92" rx="8"/><text class="sT" x="541" y="40" text-anchor="middle">per order with free delivery</text><text class="sC" x="392" y="64" xml:space="preserve" style="white-space:pre">margin 100 − courier 35 − fees 8</text><text class="sC" x="392" y="86" xml:space="preserve" style="white-space:pre">+ delivery fee 0   =  57</text>
<text class="sC" x="250" y="149" text-anchor="end">today: 1,000 × 77</text><rect class="sB" x="260" y="132" width="385" height="24" rx="3"/><text class="sT" x="651" y="149">EGP 77k</text>
<text class="sC" x="250" y="181" text-anchor="end">free, same orders: 1,000 × 57</text><rect class="sR" x="260" y="164" width="285" height="24" rx="3"/><text class="sT" x="551" y="181">EGP 57k</text>
<text class="sC" x="250" y="213" text-anchor="end">free, break-even: 1,350 × 57</text><rect class="sG" x="260" y="196" width="385" height="24" rx="3"/><text class="sT" x="651" y="213">EGP 77k</text>
<text class="sS" x="360" y="240" text-anchor="middle">free delivery pays only if it lifts orders by about 35%, or brings in better customers</text>
</svg><figcaption>Turn the product question into arithmetic first. The break-even lift is the bar the experiment has to clear.</figcaption></figure>

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
