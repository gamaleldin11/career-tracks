# Forecasting — Baselines, Seasonality, ML Models, Foundation Models and Honest Backtests

Forecasting is one of the most common data-science jobs in practice (demand, staffing, cash flow, network traffic, sales targets) and one of your strongest stories: FinSight produced **90-day cash-flow forecasts with Nixtla's TimeGPT**, on top of a daily aggregation layer you built because real transactions were sparse. This module gives you the full toolkit around that experience: framing, seasonality (including Ramadan's moving dates), baselines, statistical and machine-learning models, foundation models, and how to evaluate forecasts honestly. *AI Journey* Part 19 has the theory of ARIMA and RNNs with figures.

> [!focus]
> **Entry must:** frame a forecast (what, at what level, how far ahead, for which decision); decompose trend and seasonality; beat naive and seasonal-naive baselines; evaluate with a rolling backtest and MAE/WAPE.
> **Mid adds:** exponential smoothing and ARIMA basics, global gradient-boosting models with lag features, direct vs recursive multi-step forecasting, prediction intervals and their coverage, holidays and moving festivals, foundation models (TimeGPT, Chronos, TimesFM) and when they help, intermittent and hierarchical series.
> **Most asked:** *How would you forecast daily demand?* · *What baseline would you use?* · *How do you validate a forecast?* · *ARIMA vs ML models?* · *How do you handle holidays and Ramadan?* · *Tell me about your TimeGPT work.*
> **Time budget:** 3.5 hours.

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

## DS6.3 Baselines you must beat 🟢 ⭐

| Baseline | Forecast | Strong when |
|---|---|---|
| **Naive** | The last observed value | Random-walk-like series (prices) |
| **Seasonal naive** | The value one season ago (same weekday last week) | Strong, stable seasonality |
| **Moving average** | Mean of the last k periods | Noisy, level-only series |
| **Drift** | Last value plus the average historical change | A steady trend |

A surprising number of sophisticated models fail to beat seasonal naive on real data. Report it every time.

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
