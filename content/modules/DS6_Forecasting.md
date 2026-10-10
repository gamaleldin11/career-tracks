# Forecasting — Baselines, Seasonality, ML Models, Foundation Models and Honest Backtests

Forecasting is one of the most common data-science jobs in practice (demand, staffing, cash flow, network traffic, sales targets) and one of your strongest stories: FinSight produced **90-day cash-flow forecasts with Nixtla's TimeGPT**, on top of a daily aggregation layer you built because real transactions were sparse. This module gives you the full toolkit around that experience: framing, seasonality (including Ramadan's moving dates), baselines, statistical and machine-learning models, foundation models, and how to evaluate forecasts honestly. *AI Journey* Part 19 has the theory of ARIMA and RNNs with figures.

> [!focus]
> **Entry must:** frame a forecast (what, at what level, how far ahead, for which decision); decompose trend and seasonality; beat naive and seasonal-naive baselines; evaluate with a rolling backtest and MAE/WAPE.
> **Mid adds:** exponential smoothing and ARIMA basics, global gradient-boosting models with lag features, direct vs recursive multi-step forecasting, prediction intervals and their coverage, holidays and moving festivals, foundation models (TimeGPT, Chronos, TimesFM) and when they help, intermittent and hierarchical series.
> **Most asked:** *How would you forecast daily demand?* · *What baseline would you use?* · *How do you validate a forecast?* · *ARIMA vs ML models?* · *How do you handle holidays and Ramadan?* · *Tell me about your TimeGPT work.*
> **Time budget:** 3.5 hours.

## DS6.0 Foundations: why time series are different 🟢

Most of [[DS2]]–[[DS4]] assumes rows are independent. A time series breaks that on purpose: **today looks like yesterday and like the same day last week**. That dependence (autocorrelation) is what makes forecasting possible, and it changes three habits:

- **Order matters.** You may only learn from the past and test on the future; shuffling rows leaks tomorrow into today's features ([[DS6.7]]).
- **The past is the main feature.** Recent values, values one season ago and calendar effects carry most of the signal.
- **Uncertainty grows with the horizon.** Tomorrow is fairly predictable; a day two weeks out much less so. A good forecast says how sure it is, and decisions (staffing, stock) use a percentile, not just the middle line.

<figure class="dia"><svg viewBox="0 0 720 250" role="img" aria-label="A daily series with weekly seasonality and a two-week forecast whose 50% and 90% prediction intervals widen with the horizon">
<line class="sLm" x1="40" y1="220" x2="678" y2="220" marker-end="url(#ahm)"/>
<polygon class="sA" opacity="0.18" points="445.0,143.6 460.0,108.6 475.0,82.7 490.0,72.4 505.0,80.5 520.0,96.9 535.0,105.8 550.0,97.3 565.0,75.0 580.0,52.8 595.0,44.8 610.0,54.6 625.0,72.4 640.0,82.4 655.0,74.9 655.0,209.0 640.0,212.4 625.0,198.0 610.0,175.7 595.0,161.2 580.0,164.1 565.0,181.0 550.0,197.8 535.0,200.2 520.0,184.8 505.0,161.1 490.0,144.8 475.0,145.4 460.0,158.6 445.0,162.8"/><polygon class="sA" opacity="0.35" points="445.0,148.4 460.0,122.1 475.0,99.7 490.0,92.2 505.0,102.5 520.0,121.0 535.0,131.7 550.0,125.0 565.0,104.2 580.0,83.5 595.0,77.0 610.0,88.1 625.0,107.1 640.0,118.4 655.0,112.0 655.0,171.9 640.0,176.4 625.0,163.3 610.0,142.3 595.0,129.1 580.0,133.4 565.0,151.8 550.0,170.1 535.0,174.3 520.0,160.6 505.0,139.0 490.0,125.0 475.0,128.3 460.0,145.1 445.0,158.0"/>
<polyline class="sLm" points="40.0,155.7 55.0,133.5 70.0,134.0 85.0,140.9 100.0,157.3 115.0,172.8 130.0,160.0 145.0,156.1 160.0,130.4 175.0,129.9 190.0,142.6 205.0,158.8 220.0,168.4 235.0,161.7 250.0,141.5 265.0,110.9 280.0,114.3 295.0,142.2 310.0,150.7 325.0,168.2 340.0,162.1 355.0,130.8 370.0,121.1 385.0,126.7 400.0,124.4 415.0,148.3 430.0,166.1 445.0,159.1" fill="none" stroke-width="2.2"/><polyline class="sL" points="445.0,153.2 460.0,133.6 475.0,114.0 490.0,108.6 505.0,120.8 520.0,140.8 535.0,153.0 550.0,147.6 565.0,128.0 580.0,108.4 595.0,103.0 610.0,115.2 625.0,135.2 640.0,147.4 655.0,142.0" fill="none" stroke-width="2.5" stroke-dasharray="6 4"/>
<line class="sD" x1="445" y1="30" x2="445" y2="220.0"/><text class="sC" x="445" y="24" text-anchor="middle">today</text>
<text class="sC" x="235" y="24" text-anchor="middle">history: each day resembles last week</text><text class="sC" x="565" y="40" text-anchor="middle">50% and 90% intervals</text>
<text class="sC" x="40" y="238" text-anchor="middle">4 weeks ago</text>
<text class="sC" x="655" y="238" text-anchor="middle">+2 weeks</text>
</svg><figcaption>A forecast is a distribution, not a number. The further ahead, the wider it gets, and decisions should use the right part of it.</figcaption></figure>

## DS6.1 Framing a forecast 🟢 ⭐

| Question | Example (a grocery delivery app) |
|---|---|
| **Decision** | How many couriers to schedule per zone per hour; how much stock to order per product per dark store |
| **Target and level** | Orders per zone per hour; units per product per store per day |
| **Horizon** | Next 7 days for staffing; next 14 days for stock (supplier lead time) |
| **Update frequency** | Daily, after midnight |
| **Uncertainty needed?** | **Yes**: staffing for the 90th percentile of demand, stock to a service level |
| **Known future inputs** | Calendar, holidays, planned promotions, prices |
| **Error costs** | Under-forecast → late deliveries, stock-outs; over-forecast → idle couriers, waste of perishables |

> [!say]
> "I'd start from the decision: forecasting courier demand per zone and hour for the next week, with a 90th-percentile forecast because under-staffing costs more than over-staffing. That tells me the level, the horizon, and that I need prediction intervals, not just a single number."

## DS6.2 What a series is made of 🟢 ⭐

- **Trend:** long-term growth or decline.
- **Seasonality:** repeating patterns of fixed period: daily (lunch and dinner peaks), **weekly** (Friday is different in Egypt), yearly (summer, back-to-school, year-end).
- **Holidays and events:** Eid al-Fitr, Eid al-Adha, Sham el-Nessim, national holidays, White Friday sales, football matches.
- **Moving festivals:** **Ramadan follows the Islamic (lunar) calendar, so it starts about 11 days earlier each Gregorian year.** "Same week last year" doesn't line up with Ramadan; model it with explicit Ramadan-day features (days into Ramadan, the last ten days, Eid) rather than calendar-month seasonality.
- **Promotions and prices**, and external drivers (weather, exchange-rate shocks, fuel prices).
- **Noise.**

**STL decomposition** (seasonal-trend decomposition using LOESS) separates trend, seasonal and remainder components, a good first look at any series.

<figure class="dia"><svg viewBox="0 0 720 244" role="img" aria-label="An observed daily series decomposed into an upward trend, a weekly seasonal pattern and an irregular remainder">
<text class="sT" x="110" y="44" text-anchor="end">observed</text><rect class="sN" x="118" y="18" width="586" height="46" rx="4"/>
<polyline class="sL" points="120.0,54.3 130.4,44.3 140.8,44.5 151.2,47.6 161.6,55.0 172.0,62.0 182.4,56.2 192.8,54.5 203.2,42.9 213.6,42.7 224.0,48.4 234.4,55.7 244.8,60.0 255.2,57.0 265.6,47.9 276.0,34.1 286.4,35.6 296.8,48.2 307.2,52.1 317.6,59.9 328.0,57.2 338.4,43.1 348.8,38.7 359.2,41.2 369.6,40.2 380.0,51.0 390.4,59.0 400.8,55.8 411.2,46.1 421.6,35.6 432.0,34.3 442.4,38.4 452.8,42.3 463.2,55.4 473.6,53.0 484.0,42.5 494.4,29.8 504.8,32.6 515.2,31.9 525.6,48.8 536.0,53.5 546.4,48.3 556.8,41.8 567.2,32.3 577.6,26.7 588.0,31.4 598.4,42.2 608.8,48.8 619.2,41.7 629.6,35.6 640.0,28.6 650.4,22.0 660.8,33.6 671.2,39.5 681.6,43.6 692.0,43.1" fill="none" stroke-width="1.8"/>
<text class="sT" x="712" y="70" text-anchor="end">=</text>
<text class="sT" x="110" y="96" text-anchor="end">trend</text><rect class="sN" x="118" y="70" width="586" height="46" rx="4"/>
<polyline class="sLw" points="120.0,103.2 130.4,102.8 140.8,102.5 151.2,102.2 161.6,101.8 172.0,101.5 182.4,101.2 192.8,100.8 203.2,100.5 213.6,100.2 224.0,99.8 234.4,99.5 244.8,99.2 255.2,98.8 265.6,98.5 276.0,98.2 286.4,97.8 296.8,97.5 307.2,97.2 317.6,96.8 328.0,96.5 338.4,96.2 348.8,95.8 359.2,95.5 369.6,95.2 380.0,94.8 390.4,94.5 400.8,94.2 411.2,93.8 421.6,93.5 432.0,93.2 442.4,92.8 452.8,92.5 463.2,92.2 473.6,91.8 484.0,91.5 494.4,91.2 504.8,90.8 515.2,90.5 525.6,90.2 536.0,89.8 546.4,89.5 556.8,89.2 567.2,88.8 577.6,88.5 588.0,88.2 598.4,87.8 608.8,87.5 619.2,87.2 629.6,86.8 640.0,86.5 650.4,86.2 660.8,85.8 671.2,85.5 681.6,85.2 692.0,84.8" fill="none" stroke-width="1.8"/>
<text class="sT" x="712" y="122" text-anchor="end">+</text>
<text class="sT" x="110" y="148" text-anchor="end">weekly season</text><rect class="sN" x="118" y="122" width="586" height="46" rx="4"/>
<polyline class="sLg" points="120.0,146.0 130.4,130.0 140.8,126.0 151.2,137.1 161.6,154.9 172.0,166.0 182.4,162.0 192.8,146.0 203.2,130.0 213.6,126.0 224.0,137.1 234.4,154.9 244.8,166.0 255.2,162.0 265.6,146.0 276.0,130.0 286.4,126.0 296.8,137.1 307.2,154.9 317.6,166.0 328.0,162.0 338.4,146.0 348.8,130.0 359.2,126.0 369.6,137.1 380.0,154.9 390.4,166.0 400.8,162.0 411.2,146.0 421.6,130.0 432.0,126.0 442.4,137.1 452.8,154.9 463.2,166.0 473.6,162.0 484.0,146.0 494.4,130.0 504.8,126.0 515.2,137.1 525.6,154.9 536.0,166.0 546.4,162.0 556.8,146.0 567.2,130.0 577.6,126.0 588.0,137.1 598.4,154.9 608.8,166.0 619.2,162.0 629.6,146.0 640.0,130.0 650.4,126.0 660.8,137.1 671.2,154.9 681.6,166.0 692.0,162.0" fill="none" stroke-width="1.8"/>
<text class="sT" x="712" y="174" text-anchor="end">+</text>
<text class="sT" x="110" y="200" text-anchor="end">remainder</text><rect class="sN" x="118" y="174" width="586" height="46" rx="4"/>
<polyline class="sLm" points="120.0,199.0 130.4,194.9 140.8,203.8 151.2,196.0 161.6,190.5 172.0,195.4 182.4,184.4 192.8,207.8 203.2,198.7 213.6,206.1 224.0,206.8 234.4,201.1 244.8,197.2 255.2,195.3 265.6,194.5 276.0,178.0 286.4,191.1 296.8,214.6 307.2,197.4 317.6,205.3 328.0,204.3 338.4,186.9 348.8,201.5 359.2,218.0 369.6,196.4 380.0,202.1 390.4,210.6 400.8,208.2 411.2,205.3 421.6,199.6 432.0,203.4 442.4,198.7 452.8,181.8 463.2,207.0 473.6,207.1 484.0,201.7 494.4,188.9 504.8,206.1 515.2,185.6 525.6,211.9 536.0,209.2 546.4,199.9 556.8,207.6 567.2,205.3 577.6,195.0 588.0,192.4 598.4,198.3 608.8,202.0 619.2,186.5 629.6,195.5 640.0,201.6 650.4,187.7 660.8,208.0 671.2,197.8 681.6,193.0 692.0,199.5" fill="none" stroke-width="1.8"/>
<text class="sS" x="410" y="232" text-anchor="middle">STL splits a series into a slow trend, a repeating pattern and what's left over</text>
</svg><figcaption>Decompose before you model: it shows what any forecast must capture, and how much is noise no model will.</figcaption></figure>

<figure class="dia"><svg viewBox="0 0 720 228" role="img" aria-label="Ramadan's approximate start moving from 11 March 2024 to 28 January 2028, about eleven days earlier each Gregorian year, followed by Eid al-Fitr">
<line class="sD" x1="120" y1="26" x2="120" y2="196"/><text class="sC" x="126" y="20">Jan</text>
<line class="sD" x1="263" y1="26" x2="263" y2="196"/><text class="sC" x="268.6" y="20">Feb</text>
<line class="sD" x1="391" y1="26" x2="391" y2="196"/><text class="sC" x="397.4" y="20">Mar</text>
<line class="sD" x1="534" y1="26" x2="534" y2="196"/><text class="sC" x="540" y="20">Apr</text>
<text class="sT" x="110" y="50" text-anchor="end">2024</text><rect class="sG" x="442" y="34" width="135.7" height="22" rx="4"/><text class="sC" x="510" y="50" text-anchor="middle">Ramadan</text><rect class="sW" x="580" y="34" width="13.8" height="22" rx="3"/>
<text class="sT" x="110" y="82" text-anchor="end">2025</text><rect class="sG" x="391.4" y="66" width="135.7" height="22" rx="4"/><text class="sC" x="459.4" y="82" text-anchor="middle">Ramadan</text><rect class="sW" x="529.4" y="66" width="13.8" height="22" rx="3"/>
<text class="sT" x="110" y="114" text-anchor="end">2026</text><rect class="sG" x="340.8" y="98" width="135.7" height="22" rx="4"/><text class="sC" x="408.8" y="114" text-anchor="middle">Ramadan</text><rect class="sW" x="478.8" y="98" width="13.8" height="22" rx="3"/>
<text class="sT" x="110" y="146" text-anchor="end">2027</text><rect class="sG" x="294.8" y="130" width="135.7" height="22" rx="4"/><text class="sC" x="362.8" y="146" text-anchor="middle">Ramadan</text><rect class="sW" x="432.8" y="130" width="13.8" height="22" rx="3"/>
<text class="sT" x="110" y="178" text-anchor="end">2028</text><rect class="sG" x="244.2" y="162" width="135.7" height="22" rx="4"/><text class="sC" x="312.2" y="178" text-anchor="middle">Ramadan</text><rect class="sW" x="382.2" y="162" width="13.8" height="22" rx="3"/>
<text class="sC" x="700" y="116" text-anchor="end">about 11 days</text><text class="sC" x="700" y="134" text-anchor="end">earlier each year</text><text class="sWt" x="700" y="176" text-anchor="end">amber: Eid al-Fitr</text>
<text class="sC" x="410" y="216" text-anchor="middle">approximate start dates; the exact day depends on the moon sighting</text>
</svg><figcaption>Why "same week last year" fails for Egyptian demand. Model Ramadan and Eid from a Hijri calendar table instead.</figcaption></figure>

## DS6.3 Baselines you must beat 🟢 ⭐

| Baseline | Forecast | Strong when |
|---|---|---|
| **Naive** | The last observed value | Random-walk-like series (prices) |
| **Seasonal naive** | The value one season ago (same weekday last week) | Strong, stable seasonality |
| **Moving average** | Mean of the last k periods | Noisy, level-only series |
| **Drift** | Last value plus the average historical change | A steady trend |

A surprising number of sophisticated models fail to beat seasonal naive on real data. Report it every time.

<figure class="dia"><svg viewBox="0 0 720 246" role="img" aria-label="Naive and seasonal naive forecasts for next week against what actually happened: the seasonal naive repeats last week's shape and tracks the actuals far better">
<line class="sLm" x1="50" y1="200" x2="646" y2="200" marker-end="url(#ahm)"/>
<polyline class="sLm" points="50.0,113.1 71.0,121.6 92.0,129.7 113.0,157.0 134.0,151.9 155.0,130.2 176.0,103.8 197.0,109.6 218.0,108.1 239.0,143.4 260.0,153.1 281.0,142.2 302.0,128.7 323.0,108.9 344.0,97.4 365.0,107.1 386.0,129.6 407.0,143.3 428.0,128.5 449.0,115.8 470.0,101.3" fill="none" stroke-width="2.2"/>
<polyline class="sLm" points="470.0,101.3 491.0,87.5 512.0,111.6 533.0,124.0 554.0,132.5 575.0,131.4 596.0,116.4 617.0,92.6" fill="none" stroke-width="2" stroke-dasharray="2 4"/>
<polyline class="sLr" points="470.0,101.3 491.0,101.3 512.0,101.3 533.0,101.3 554.0,101.3 575.0,101.3 596.0,101.3 617.0,101.3" fill="none" stroke-width="2.2"/>
<polyline class="sLg" points="470.0,101.3 491.0,97.4 512.0,107.1 533.0,129.6 554.0,143.3 575.0,128.5 596.0,115.8 617.0,101.3" fill="none" stroke-width="2.2"/>
<line class="sD" x1="470" y1="30" x2="470" y2="200.0"/>
<text class="sC" x="260" y="26" text-anchor="middle">last three weeks</text><text class="sC" x="554" y="26" text-anchor="middle">next week</text>
<text class="sC" x="40" y="234">dotted: what happened</text><text class="sRt" x="250" y="234">red: naive (last value)</text><text class="sGt" x="470" y="234">green: seasonal naive</text>
</svg><figcaption>Seasonal naive costs one line of code and is surprisingly hard to beat. Every forecast report should show it.</figcaption></figure>

## DS6.4 Statistical models 🟢 🟡

| Model | Idea | Notes |
|---|---|---|
| **Exponential smoothing (ETS)**, Holt-Winters | Weighted averages with more weight on recent data, with level, trend and seasonal components | Fast, robust, good for many series; automatic selection with `AutoETS` |
| **ARIMA / SARIMA** | Regression on its own past values (AR), differencing to remove trend (I), and past errors (MA); seasonal terms for SARIMA | Needs a stationary series (after differencing); choose orders from ACF/PACF plots or automatically (`AutoARIMA`); exogenous regressors in ARIMAX |
| **Prophet** | An additive model of trend, seasonalities and holidays | Easy holidays and changepoints; often beaten by tuned alternatives but quick to explain |
| **Theta**, **TBATS** | Robust benchmarks; TBATS handles multiple and non-integer seasonalities | Useful for hourly data with daily and weekly cycles |

Nixtla's **statsforecast** fits these at scale (thousands of series) in Python; `statsmodels` has the classic implementations.

> [!term] Stationarity
> A stationary series has a constant mean and variance over time and an autocorrelation that depends only on the lag. ARIMA assumes it after differencing. The ADF and KPSS tests check it; differencing (and seasonal differencing) or a log transform usually achieve it.

## DS6.5 Machine-learning forecasting 🟡 ⭐

The approach that wins most practical competitions (for example the **M5** Walmart competition in 2020, where gradient-boosting models dominated the top) is a **global model**: one gradient-boosted model trained across **all** series, with features describing each series' recent history and the calendar.

```python
import pandas as pd
df = df.sort_values(["store_id", "item_id", "date"])
g = df.groupby(["store_id", "item_id"])["units"]
for lag in (7, 14, 28):
    df[f"lag_{lag}"] = g.shift(lag)                                   # only past values
df["roll_mean_7"]  = g.transform(lambda s: s.shift(1).rolling(7).mean())
df["roll_mean_28"] = g.transform(lambda s: s.shift(1).rolling(28).mean())
df["dow"] = df["date"].dt.dayofweek
df["days_into_ramadan"] = ...          # from a calendar table with Hijri-date flags
df["is_eid"], df["promo"], df["price_rel"] = ..., ..., ...
# then LightGBM on rows up to the forecast origin; validate on the following 14 days (rolling origin)
```

<figure class="dia"><svg viewBox="0 0 720 230" role="img" aria-label="A daily series turned into a supervised table with lag-1, lag-2 and a shifted three-day mean as features for each day's value">
<rect class="sN" x="80" y="20" width="90" height="24" rx="0"/><text class="sT" x="125" y="37" text-anchor="middle">date</text>
<rect class="sN" x="170" y="20" width="70" height="24" rx="0"/><text class="sT" x="205" y="37" text-anchor="middle">y</text>
<rect class="sN" x="240" y="20" width="80" height="24" rx="0"/><text class="sT" x="280" y="37" text-anchor="middle">lag_1</text>
<rect class="sN" x="320" y="20" width="80" height="24" rx="0"/><text class="sT" x="360" y="37" text-anchor="middle">lag_2</text>
<rect class="sN" x="400" y="20" width="130" height="24" rx="0"/><text class="sT" x="465" y="37" text-anchor="middle">mean of last 3</text>
<rect class="sN" x="80" y="44" width="90" height="22" rx="0"/><text class="sC" x="125" y="59" text-anchor="middle">day 1</text>
<rect class="sA" x="170" y="44" width="70" height="22" rx="0" opacity=".5"/><text class="sC" x="205" y="59" text-anchor="middle">120</text>
<rect class="sN" x="240" y="44" width="80" height="22" rx="0"/><text class="sC" x="280" y="59" text-anchor="middle">—</text>
<rect class="sN" x="320" y="44" width="80" height="22" rx="0"/><text class="sC" x="360" y="59" text-anchor="middle">—</text>
<rect class="sN" x="400" y="44" width="130" height="22" rx="0"/><text class="sC" x="465" y="59" text-anchor="middle">—</text>
<rect class="sN" x="80" y="66" width="90" height="22" rx="0"/><text class="sC" x="125" y="81" text-anchor="middle">day 2</text>
<rect class="sA" x="170" y="66" width="70" height="22" rx="0" opacity=".5"/><text class="sC" x="205" y="81" text-anchor="middle">98</text>
<rect class="sV" x="240" y="66" width="80" height="22" rx="0" opacity=".5"/><text class="sC" x="280" y="81" text-anchor="middle">120</text>
<rect class="sN" x="320" y="66" width="80" height="22" rx="0"/><text class="sC" x="360" y="81" text-anchor="middle">—</text>
<rect class="sN" x="400" y="66" width="130" height="22" rx="0"/><text class="sC" x="465" y="81" text-anchor="middle">—</text>
<rect class="sN" x="80" y="88" width="90" height="22" rx="0"/><text class="sC" x="125" y="103" text-anchor="middle">day 3</text>
<rect class="sA" x="170" y="88" width="70" height="22" rx="0" opacity=".5"/><text class="sC" x="205" y="103" text-anchor="middle">104</text>
<rect class="sV" x="240" y="88" width="80" height="22" rx="0" opacity=".5"/><text class="sC" x="280" y="103" text-anchor="middle">98</text>
<rect class="sV" x="320" y="88" width="80" height="22" rx="0" opacity=".5"/><text class="sC" x="360" y="103" text-anchor="middle">120</text>
<rect class="sN" x="400" y="88" width="130" height="22" rx="0"/><text class="sC" x="465" y="103" text-anchor="middle">—</text>
<rect class="sN" x="80" y="110" width="90" height="22" rx="0"/><text class="sC" x="125" y="125" text-anchor="middle">day 4</text>
<rect class="sA" x="170" y="110" width="70" height="22" rx="0" opacity=".5"/><text class="sC" x="205" y="125" text-anchor="middle">131</text>
<rect class="sV" x="240" y="110" width="80" height="22" rx="0" opacity=".5"/><text class="sC" x="280" y="125" text-anchor="middle">104</text>
<rect class="sV" x="320" y="110" width="80" height="22" rx="0" opacity=".5"/><text class="sC" x="360" y="125" text-anchor="middle">98</text>
<rect class="sV" x="400" y="110" width="130" height="22" rx="0" opacity=".5"/><text class="sC" x="465" y="125" text-anchor="middle">107</text>
<rect class="sN" x="80" y="132" width="90" height="22" rx="0"/><text class="sC" x="125" y="147" text-anchor="middle">day 5</text>
<rect class="sA" x="170" y="132" width="70" height="22" rx="0" opacity=".5"/><text class="sC" x="205" y="147" text-anchor="middle">142</text>
<rect class="sV" x="240" y="132" width="80" height="22" rx="0" opacity=".5"/><text class="sC" x="280" y="147" text-anchor="middle">131</text>
<rect class="sV" x="320" y="132" width="80" height="22" rx="0" opacity=".5"/><text class="sC" x="360" y="147" text-anchor="middle">104</text>
<rect class="sV" x="400" y="132" width="130" height="22" rx="0" opacity=".5"/><text class="sC" x="465" y="147" text-anchor="middle">111</text>
<rect class="sN" x="80" y="154" width="90" height="22" rx="0"/><text class="sC" x="125" y="169" text-anchor="middle">day 6</text>
<rect class="sA" x="170" y="154" width="70" height="22" rx="0" opacity=".5"/><text class="sC" x="205" y="169" text-anchor="middle">117</text>
<rect class="sV" x="240" y="154" width="80" height="22" rx="0" opacity=".5"/><text class="sC" x="280" y="169" text-anchor="middle">142</text>
<rect class="sV" x="320" y="154" width="80" height="22" rx="0" opacity=".5"/><text class="sC" x="360" y="169" text-anchor="middle">131</text>
<rect class="sV" x="400" y="154" width="130" height="22" rx="0" opacity=".5"/><text class="sC" x="465" y="169" text-anchor="middle">126</text>
<rect class="sN" x="80" y="176" width="90" height="22" rx="0"/><text class="sC" x="125" y="191" text-anchor="middle">day 7</text>
<rect class="sA" x="170" y="176" width="70" height="22" rx="0" opacity=".5"/><text class="sC" x="205" y="191" text-anchor="middle">101</text>
<rect class="sV" x="240" y="176" width="80" height="22" rx="0" opacity=".5"/><text class="sC" x="280" y="191" text-anchor="middle">117</text>
<rect class="sV" x="320" y="176" width="80" height="22" rx="0" opacity=".5"/><text class="sC" x="360" y="191" text-anchor="middle">142</text>
<rect class="sV" x="400" y="176" width="130" height="22" rx="0" opacity=".5"/><text class="sC" x="465" y="191" text-anchor="middle">130</text>
<rect class="sN" x="80" y="198" width="90" height="22" rx="0"/><text class="sC" x="125" y="213" text-anchor="middle">day 8</text>
<rect class="sA" x="170" y="198" width="70" height="22" rx="0" opacity=".5"/><text class="sC" x="205" y="213" text-anchor="middle">125</text>
<rect class="sV" x="240" y="198" width="80" height="22" rx="0" opacity=".5"/><text class="sC" x="280" y="213" text-anchor="middle">101</text>
<rect class="sV" x="320" y="198" width="80" height="22" rx="0" opacity=".5"/><text class="sC" x="360" y="213" text-anchor="middle">117</text>
<rect class="sV" x="400" y="198" width="130" height="22" rx="0" opacity=".5"/><text class="sC" x="465" y="213" text-anchor="middle">120</text>
<line class="sLw" x1="185" y1="121" x2="260" y2="143" marker-end="url(#ahw)"/>
<text class="sC" x="548" y="70">predict y from</text><text class="sC" x="548" y="88">only earlier values</text><text class="sWt" x="548" y="120">shift(1) first:</text><text class="sWt" x="548" y="138">today never sees itself</text>
</svg><figcaption>Lag features turn a time series into an ordinary table, which is why gradient boosting can forecast. The shift is the leakage guard.</figcaption></figure>

| Multi-step strategy | How | Trade-off |
|---|---|---|
| **Recursive** | Predict t+1, feed it back as a lag to predict t+2, … | One model; errors compound |
| **Direct** | A separate model (or a horizon feature) for each step ahead | No compounding; more models |
| **Lags ≥ horizon** | Use only lags at least as long as the horizon (lag 14+ for a 14-day forecast) | Simple, no feedback, a common practical choice |

**Why global models work:** they share patterns across thousands of related series (new products borrow strength from similar ones), and they take promotions, prices and calendar effects as features naturally.

## DS6.6 Deep learning and foundation models 🟡 ⭐

| Family | Examples | When |
|---|---|---|
| Deep forecasting models | DeepAR, N-BEATS, N-HiTS, Temporal Fusion Transformer (TFT), PatchTST | Many related series, rich covariates, enough data to train |
| **Time-series foundation models** | **TimeGPT** (Nixtla), **Chronos** (Amazon), **TimesFM** (Google), Moirai (Salesforce) | **Zero-shot** forecasts for new or short series, quick strong baselines, many series without per-series tuning |

> [!term] Time-series foundation model
> A large model pre-trained on huge collections of time series, which produces forecasts (and often prediction intervals) for a **new** series without training on it. Like an LLM for sequences of numbers. Fine-tuning and covariates are supported by some.

> [!story]
> FinSight sent each company's daily cash-flow series to **TimeGPT** for **90-day forecasts**. The interview-worthy parts: (1) real transactions were **sparse** (weekend and holiday gaps), and the model needed a **continuous daily series**, so you built the `DailyAggregatedTransaction` layer to fill gaps; (2) you added a **time shift** so you could forecast from an earlier date and compare against real data that came later, which is a backtest; (3) re-forecasting ran in the background after uploads or payments. Add what a data scientist would ask next: "how did it compare with a seasonal-naive baseline on the backtest, and were the intervals well calibrated?". If you haven't measured that, it's a cheap, impressive addition.

> [!say]
> "For short or new series, a foundation model like TimeGPT or Chronos gives a strong zero-shot forecast with intervals and no per-series tuning, which suited FinSight's many small companies. But I always backtest it against seasonal naive and a tuned statistical or gradient-boosting model on our own data, because foundation models don't automatically win, especially when we know promotions or holidays that drive demand."

## DS6.7 Evaluating forecasts honestly 🟢 ⭐

**Backtest with a rolling origin** ([[DS4.2]]): pick several forecast origins in the past; for each, train on data up to the origin, forecast the horizon, and score against what actually happened. Average across origins and horizons, and look at error **by horizon** (day 1 vs day 14).

| Metric | Use |
|---|---|
| **MAE** | Typical error in units |
| **RMSE** | When large misses are costly |
| **WAPE** | Many series of different sizes; stable near zero ([[DS4.7]]) |
| **MASE** | MAE divided by the in-sample MAE of the seasonal-naive forecast: below 1 means you beat seasonal naive; comparable across series |
| **Bias** (mean error) | Systematic over- or under-forecasting, which matters a lot for stock |
| **Interval coverage** | Does the 90% interval contain about 90% of actuals? Too narrow is overconfident |
| **Pinball loss** | Quality of a specific quantile forecast (the 90th percentile for staffing) |

> [!mistake] Evaluating on a random split
> Shuffled train/test splits let the model see the future (later lags in training). Forecasts must be evaluated forward in time, with features computed only from data before each origin.

## DS6.8 Special cases 🟡

- **Intermittent demand** (many zeros: slow-moving spare parts, niche products): Croston's method and its variants, or forecasting the probability of demand and its size separately; evaluate with metrics that handle zeros.
- **Hierarchies** (country → region → store, category → product): forecasts at different levels must add up. **Reconciliation** methods (bottom-up, top-down, MinT optimal reconciliation) make them coherent.

<figure class="dia"><svg viewBox="0 0 720 226" role="img" aria-label="A forecast hierarchy from Egypt to regions to stores where independently forecast levels do not add up and must be reconciled">
<rect class="sB" x="290" y="14" width="140" height="46" rx="8"/><text class="sT" x="360" y="35" text-anchor="middle">Egypt</text><text class="sC" x="360" y="51" text-anchor="middle">forecast 1,040</text>
<line class="sLm" x1="360" y1="60" x2="150" y2="90"/><rect class="sA" x="80" y="92" width="140" height="46" rx="8"/><text class="sT" x="150" y="113" text-anchor="middle">Cairo</text><text class="sC" x="150" y="129" text-anchor="middle">600</text>
<line class="sLm" x1="360" y1="60" x2="360" y2="90"/><rect class="sA" x="290" y="92" width="140" height="46" rx="8"/><text class="sT" x="360" y="113" text-anchor="middle">Alexandria</text><text class="sC" x="360" y="129" text-anchor="middle">250</text>
<line class="sLm" x1="360" y1="60" x2="570" y2="90"/><rect class="sA" x="500" y="92" width="140" height="46" rx="8"/><text class="sT" x="570" y="113" text-anchor="middle">Delta</text><text class="sC" x="570" y="129" text-anchor="middle">150</text>
<line class="sLm" x1="150" y1="138" x2="80" y2="168"/><rect class="sV" x="20" y="170" width="120" height="42" rx="8"/><text class="sT" x="80" y="189" text-anchor="middle">store 1</text><text class="sC" x="80" y="205" text-anchor="middle">350</text>
<line class="sLm" x1="150" y1="138" x2="220" y2="168"/><rect class="sV" x="160" y="170" width="120" height="42" rx="8"/><text class="sT" x="220" y="189" text-anchor="middle">store 2</text><text class="sC" x="220" y="205" text-anchor="middle">250</text>
<rect class="sR" x="450" y="160" width="256" height="56" rx="8" opacity=".85"/><text class="sT" x="578" y="182" text-anchor="middle">regions add to 1,000, not 1,040</text><text class="sC" x="578" y="202" text-anchor="middle">reconcile: bottom-up, top-down, MinT</text>
</svg><figcaption>Forecast every level independently and the numbers disagree. Reconciliation makes the plan coherent from national budget to store order.</figcaption></figure>

- **Cold start** (new products, stores): global models with product attributes, borrowing from similar items, or foundation models.
- **Structural breaks** (COVID, a currency devaluation, a new competitor): down-weight or exclude affected periods, add regime features, and shorten training windows; communicate the uncertainty.
- **Sparse or irregular data** (FinSight's case): aggregate to a regular frequency, fill true zeros explicitly, and distinguish "no sales" from "no data".

## DS6.9 Forecasts in production 🟡

- Retrain on a schedule (weekly or daily) and **monitor accuracy** as actuals arrive: alert when error or bias drifts ([[DS8]]).
- Store every forecast with its **origin date and model version**, so you can backtest what was actually predicted.
- Combine forecasts with **human overrides** (planned promotions, supply issues) through a documented process; track whether overrides improve accuracy.
- Deliver what the decision needs: quantiles for staffing and stock, not only a point forecast.

> [!lab] Backtest TimeGPT the way a data scientist would
> Take FinSight's daily aggregated series for a few demo companies (or the Superstore daily sales). Run a rolling-origin backtest over the last 12 weeks comparing: seasonal naive, AutoETS (statsforecast), a LightGBM global model with lags and calendar features, and TimeGPT (or the open Chronos model if you don't have API access). Report MAE, WAPE, MASE and 80% interval coverage by horizon in one table, and write what you'd deploy and why. That converts your FinSight forecasting story into a data-science result.

## DS6.10 Interview drill 🟢 ⭐

| Question | Strong short answer |
|---|---|
| How do you frame a forecasting problem? | Decision, target and level, horizon, update frequency, need for intervals, known future inputs, error costs. |
| What baselines do you use? | Naive, seasonal naive, moving average, drift: and report whether the model beats them. |
| How do you validate a forecast? | A rolling-origin backtest forward in time, scored by horizon. |
| What's MASE? | MAE scaled by seasonal-naive in-sample MAE; below 1 beats the baseline. |
| ARIMA vs gradient boosting for forecasting? | ARIMA/ETS model each series' own dynamics well; global boosting models learn across many series and use covariates like promotions and holidays. |
| Recursive vs direct multi-step? | Feeding predictions back as inputs (errors compound) vs separate models or horizon features per step. |
| How do you handle Ramadan? | Explicit Hijri-calendar features (days into Ramadan, last ten days, Eid), since it moves about 11 days earlier each year. |
| What is stationarity? | Constant mean, variance and lag-dependent autocorrelation; ARIMA needs it after differencing. |
| What are time-series foundation models? | Pre-trained models (TimeGPT, Chronos, TimesFM) that forecast new series zero-shot. |
| Why prediction intervals? | Decisions like staffing and stock need quantiles; check their coverage. |
| How do you forecast intermittent demand? | Croston-type methods, or separate models for occurrence and size, with zero-tolerant metrics. |
| What did you do with TimeGPT? | 90-day cash-flow forecasts per company, a gap-filled daily aggregation layer for sparse data, a time-shifted backtest, background re-forecasting. |

## Key takeaways

> [!check]
> - Frame from the decision; forecast quantiles when costs are asymmetric.
> - Always beat seasonal naive in a rolling-origin backtest before claiming success.
> - Global gradient-boosting models with lags and calendar features are the practical workhorse; foundation models are strong zero-shot baselines.
> - Model Ramadan and Eid explicitly; they move every year.
> - Your TimeGPT work is a strong story; add a baseline comparison and interval coverage to make it a data-science result.

## Sources

- Rob Hyndman and George Athanasopoulos, [*Forecasting: Principles and Practice*, 3rd ed.](https://otexts.com/fpp3/) (free online): baselines, ETS, ARIMA, evaluation, hierarchies.
- Spyros Makridakis, Evangelos Spiliotis and Vassilios Assimakopoulos, "M5 accuracy competition: Results, findings, and conclusions" (*International Journal of Forecasting*, 2022).
- Rob Hyndman and Anne Koehler, "Another look at measures of forecast accuracy" (*IJF*, 2006): MASE.
- Nixtla: [TimeGPT documentation](https://docs.nixtla.io/), [statsforecast](https://nixtlaverse.nixtla.io/statsforecast/); Azul Garza et al., "TimeGPT-1" (2023).
- Abdul Fatir Ansari et al., "Chronos: Learning the Language of Time Series" (2024), [amazon-science/chronos-forecasting](https://github.com/amazon-science/chronos-forecasting); Abhimanyu Das et al., "A decoder-only foundation model for time-series forecasting" (ICML 2024), [google-research/timesfm](https://github.com/google-research/timesfm).
- Your *AI Journey* Part 19 (time series and RNNs).
