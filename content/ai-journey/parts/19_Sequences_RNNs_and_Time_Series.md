# Part 19 — Sequences, RNNs and Time-Series Forecasting

<!-- nav -->
> [!example] 🧭 Step 18 of 26 · Stage 5 of 7: Deep learning
> ← [Part 18 · CNNs & vision](18_Computer_Vision_CNNs.md) · [Part 20 · NLP + attention](20_NLP_RNNs_HuggingFace_and_Attention.md) → · [Course map](00_START_HERE.md)
<!-- /nav -->

**Source:** Géron, *Hands-On ML with Scikit-Learn and PyTorch* (2025), **Chapter 13** "Processing Sequences Using RNNs and CNNs". This part also extends the time-series primer in Part 16 §16.4 and closes the "time series" gap from Part 14. It is directly relevant to **FinSight** (cash-flow forecasting) and to telecom traffic and capacity forecasting. **🔭 State of the art** boxes cover the 2024–26 forecasting landscape.

<!-- interview-focus -->

> [!tip] 🎯 Interview focus
> **Why it matters:** Forecasting (traffic, capacity, demand, revenue) is one of the most common telecom DS tasks, and it is asked even at entry level.
>
> | Level | What you should be able to do |
> |---|---|
> | 🟢 **Entry** | Trend and seasonality; naive and seasonal-naive baselines; time-based train/test split; MAE/MAPE; why you can't shuffle time series. |
> | 🟡 **Mid** | Backtesting (rolling origin), lag/rolling features with gradient boosting, ARIMA/SARIMA basics, RNN/LSTM/GRU concepts, multi-step strategies, MASE. |
> | 🔴 **Senior** | Hierarchical forecasting and reconciliation, probabilistic forecasts and intervals, foundation models (TimesFM/Chronos), forecast governance. |
>
> **⭐ Most-asked:** *How would you forecast daily traffic per cell for the next 90 days?* · *Why can't you use random k-fold on time series?* · *What baseline would you use?* · *LSTM vs GRU vs gradient boosting with lags?* · *MAPE's weaknesses?*
>
> **⏱ Time:** 4 h  ·  **Short on time?** Read §19.2, §19.4, §19.6 (playbook), §19.8.

**Legend:** 🟢 Entry (0–2 yrs) · 🟡 Mid (2–5 yrs) · 🔴 Senior / specialist · ⭐ frequently asked · 📖 Géron, *Hands-On ML with Scikit-Learn and PyTorch* (2025) pages

> [!abstract]- 🗺️ Section map — level and book pages
>
> | § | Section | Level | 📖 Book |
> |---|---|:---:|---|
> | 19.1 | Recurrent neurons — networks with memory | 🟡 | Ch. 13 · pp. 484–490 |
> | 19.2 | Forecasting a real time series: Chicago transit ridership | 🟢 ⭐ | Ch. 13 · pp. 490–498 |
> | 19.3 | Preparing sequences for neural networks | 🟡 | Ch. 13 · pp. 498–500 |
> | 19.4 | From a linear model to RNNs: Géron's leaderboard | 🟡 ⭐ | Ch. 13 · pp. 500–511 |
> | 19.5 | Long sequences: two problems and their fixes | 🟡 | Ch. 13 · pp. 511–523 |
> | 19.6 | The practitioner's forecasting playbook (beyond the book) | 🟢 ⭐ | — |
> | 19.7 | Real-world examples | 🟡 | — |
> | 19.8 | Interview drill — sequences and forecasting | 🟡 ⭐ | Ch. 13 · p. 523 |
>

---

## 19.1 Recurrent neurons — networks with memory 🟡

> [!info] 📖 Géron Ch. 13 · “Recurrent Neurons and Layers” → “Training RNNs” · pp. 484–490

![An RNN unrolled through time: the same cell and weights at every step.](figures/fig19_rnn_unrolled.png)
*An RNN unrolled through time: the same cell and weights at every step.*

A feed-forward network maps a fixed-size input to an output. A **recurrent neural network (RNN)** also has connections pointing *backwards*. At each time step t, a recurrent layer receives the input **x₍ₜ₎** *and its own previous output (state)* **h₍ₜ₋₁₎**:

> **ŷ₍ₜ₎ = h₍ₜ₎ = φ(W_xᵀ x₍ₜ₎ + W_hᵀ h₍ₜ₋₁₎ + b)**   (h₍₋₁₎ = 0)

**Unrolling through time:** draw the same layer once per time step. It is one set of weights reused T times, like a very deep network with shared weights.

- **Memory cell:** any part of a network that preserves state across time steps. A basic RNN cell remembers only about **~10 steps**.
- **Output feedback vs state feedback:** Jordan (1986) fed back outputs; Elman (1990) fed back the hidden state, which is today's norm. In fancier cells the output and the state differ.
- The activation is usually **tanh**. It saturates, which is useful here: with ReLU, a small increase repeated at every time step can make the outputs explode.

### Four input/output shapes

| Type | Example | Telecom example |
|---|---|---|
| **Sequence → sequence** | Forecast a shifted series | Hourly cell traffic → next-hour traffic at every step |
| **Sequence → vector** | Review → sentiment | 90 days of usage → churn probability |
| **Vector → sequence** | Image → caption | Customer profile → sequence of recommended offers |
| **Encoder → decoder** | Translation | Arabic complaint → English summary (Part 20) |

An **encoder–decoder** beats word-by-word seq-to-seq for translation because the end of a sentence can change how its beginning should be translated.

<figure class="dia"><svg viewBox="0 0 720 200" role="img" aria-label="Four RNN shapes: sequence to sequence, sequence to vector, vector to sequence, and encoder to decoder, each drawn as an unrolled chain of cells with inputs and outputs">
<text class="sT" x="94" y="20" text-anchor="middle">sequence → sequence</text><text class="sC" x="94" y="36" text-anchor="middle">hourly traffic → next hour</text>
<rect class="sV" x="28" y="90" width="26" height="26" rx="5"/>
<line class="sLm" x1="54" y1="103" x2="62" y2="103" marker-end="url(#ahm)"/>
<circle class="sP" cx="41" cy="150" r="7"/><line class="sLm" x1="41" y1="143" x2="41" y2="118" marker-end="url(#ahm)"/>
<line class="sLg" x1="41" y1="90" x2="41" y2="66" marker-end="url(#ahg)"/><circle class="sPg" cx="41" cy="58" r="7"/>
<rect class="sV" x="64" y="90" width="26" height="26" rx="5"/>
<line class="sLm" x1="90" y1="103" x2="98" y2="103" marker-end="url(#ahm)"/>
<circle class="sP" cx="77" cy="150" r="7"/><line class="sLm" x1="77" y1="143" x2="77" y2="118" marker-end="url(#ahm)"/>
<line class="sLg" x1="77" y1="90" x2="77" y2="66" marker-end="url(#ahg)"/><circle class="sPg" cx="77" cy="58" r="7"/>
<rect class="sV" x="100" y="90" width="26" height="26" rx="5"/>
<line class="sLm" x1="126" y1="103" x2="134" y2="103" marker-end="url(#ahm)"/>
<circle class="sP" cx="113" cy="150" r="7"/><line class="sLm" x1="113" y1="143" x2="113" y2="118" marker-end="url(#ahm)"/>
<line class="sLg" x1="113" y1="90" x2="113" y2="66" marker-end="url(#ahg)"/><circle class="sPg" cx="113" cy="58" r="7"/>
<rect class="sV" x="136" y="90" width="26" height="26" rx="5"/>
<circle class="sP" cx="149" cy="150" r="7"/><line class="sLm" x1="149" y1="143" x2="149" y2="118" marker-end="url(#ahm)"/>
<line class="sLg" x1="149" y1="90" x2="149" y2="66" marker-end="url(#ahg)"/><circle class="sPg" cx="149" cy="58" r="7"/>
<text class="sT" x="271" y="20" text-anchor="middle">sequence → vector</text><text class="sC" x="271" y="36" text-anchor="middle">90 days → churn risk</text>
<rect class="sV" x="205" y="90" width="26" height="26" rx="5"/>
<line class="sLm" x1="231" y1="103" x2="239" y2="103" marker-end="url(#ahm)"/>
<circle class="sP" cx="218" cy="150" r="7"/><line class="sLm" x1="218" y1="143" x2="218" y2="118" marker-end="url(#ahm)"/>
<rect class="sV" x="241" y="90" width="26" height="26" rx="5"/>
<line class="sLm" x1="267" y1="103" x2="275" y2="103" marker-end="url(#ahm)"/>
<circle class="sP" cx="254" cy="150" r="7"/><line class="sLm" x1="254" y1="143" x2="254" y2="118" marker-end="url(#ahm)"/>
<rect class="sV" x="277" y="90" width="26" height="26" rx="5"/>
<line class="sLm" x1="303" y1="103" x2="311" y2="103" marker-end="url(#ahm)"/>
<circle class="sP" cx="290" cy="150" r="7"/><line class="sLm" x1="290" y1="143" x2="290" y2="118" marker-end="url(#ahm)"/>
<rect class="sV" x="313" y="90" width="26" height="26" rx="5"/>
<circle class="sP" cx="326" cy="150" r="7"/><line class="sLm" x1="326" y1="143" x2="326" y2="118" marker-end="url(#ahm)"/>
<line class="sLg" x1="326" y1="90" x2="326" y2="66" marker-end="url(#ahg)"/><circle class="sPg" cx="326" cy="58" r="7"/>
<text class="sT" x="448" y="20" text-anchor="middle">vector → sequence</text><text class="sC" x="448" y="36" text-anchor="middle">profile → offers</text>
<rect class="sV" x="382" y="90" width="26" height="26" rx="5"/>
<line class="sLm" x1="408" y1="103" x2="416" y2="103" marker-end="url(#ahm)"/>
<circle class="sP" cx="395" cy="150" r="7"/><line class="sLm" x1="395" y1="143" x2="395" y2="118" marker-end="url(#ahm)"/>
<line class="sLg" x1="395" y1="90" x2="395" y2="66" marker-end="url(#ahg)"/><circle class="sPg" cx="395" cy="58" r="7"/>
<rect class="sV" x="418" y="90" width="26" height="26" rx="5"/>
<line class="sLm" x1="444" y1="103" x2="452" y2="103" marker-end="url(#ahm)"/>
<line class="sLg" x1="431" y1="90" x2="431" y2="66" marker-end="url(#ahg)"/><circle class="sPg" cx="431" cy="58" r="7"/>
<rect class="sV" x="454" y="90" width="26" height="26" rx="5"/>
<line class="sLm" x1="480" y1="103" x2="488" y2="103" marker-end="url(#ahm)"/>
<line class="sLg" x1="467" y1="90" x2="467" y2="66" marker-end="url(#ahg)"/><circle class="sPg" cx="467" cy="58" r="7"/>
<rect class="sV" x="490" y="90" width="26" height="26" rx="5"/>
<line class="sLg" x1="503" y1="90" x2="503" y2="66" marker-end="url(#ahg)"/><circle class="sPg" cx="503" cy="58" r="7"/>
<text class="sT" x="625" y="20" text-anchor="middle">encoder → decoder</text><text class="sC" x="625" y="36" text-anchor="middle">Arabic → English</text>
<rect class="sV" x="559" y="90" width="26" height="26" rx="5"/>
<line class="sLm" x1="585" y1="103" x2="593" y2="103" marker-end="url(#ahm)"/>
<circle class="sP" cx="572" cy="150" r="7"/><line class="sLm" x1="572" y1="143" x2="572" y2="118" marker-end="url(#ahm)"/>
<rect class="sV" x="595" y="90" width="26" height="26" rx="5"/>
<line class="sLm" x1="621" y1="103" x2="629" y2="103" marker-end="url(#ahm)"/>
<circle class="sP" cx="608" cy="150" r="7"/><line class="sLm" x1="608" y1="143" x2="608" y2="118" marker-end="url(#ahm)"/>
<rect class="sA" x="631" y="90" width="26" height="26" rx="5"/>
<line class="sLm" x1="657" y1="103" x2="665" y2="103" marker-end="url(#ahm)"/>
<line class="sLg" x1="644" y1="90" x2="644" y2="66" marker-end="url(#ahg)"/><circle class="sPg" cx="644" cy="58" r="7"/>
<rect class="sA" x="667" y="90" width="26" height="26" rx="5"/>
<line class="sLg" x1="680" y1="90" x2="680" y2="66" marker-end="url(#ahg)"/><circle class="sPg" cx="680" cy="58" r="7"/>
<text class="sS" x="360" y="188" text-anchor="middle">blue: inputs fed in · green: outputs used · the same cell (and weights) at every step</text>
</svg><figcaption>Which steps take an input and which produce a used output is the whole difference between the four shapes.</figcaption></figure>

### Training: backpropagation through time (BPTT)

Unroll, run the forward pass, compute the loss on the outputs that matter (all of them for seq2seq, only the last for seq2vec), backprop through the unrolled graph, and **sum each shared weight's gradients over the time steps**. PyTorch does all of this automatically.

---

## 19.2 Forecasting a real time series: Chicago transit ridership 🟢 ⭐

> [!info] 📖 Géron Ch. 13 · “Forecasting a Time Series”, “The ARMA Model Family” · pp. 490–498

![Trend + weekly seasonality. The seasonal-naive forecast is the baseline to beat.](figures/fig19_timeseries.png)
*Trend + weekly seasonality. The seasonal-naive forecast is the baseline to beat.*

> [!quote] 💬 Say it in the interview
> “I start with naive and seasonal-naive baselines, split by time, and evaluate with MAE or MASE over a rolling backtest. Any model must beat seasonal naive to be worth deploying.”

Géron's scenario: you are a data scientist at the **Chicago Transit Authority**. Forecast **tomorrow's rail ridership** from daily data since 2001.

```python
import pandas as pd
df = pd.read_csv(path, parse_dates=["service_date"])
df.columns = ["date", "day_type", "bus", "rail", "total"]
df = df.sort_values("date").set_index("date").drop("total", axis=1).drop_duplicates()
# day_type: W = weekday, A = Saturday, U = Sunday/holiday
```

### Look first: seasonality, trend, autocorrelation

- **Multivariate** time series: several values per step (bus, rail). **Univariate:** one.
- Tasks: forecasting (the main one), imputation, classification, anomaly detection.
- A strong **weekly seasonality** means the series is **autocorrelated** with itself at lag 7.
- **Yearly seasonality** and **long-term trends** show up in a 12-month rolling mean of monthly averages.
- **Differencing** (value(t) − value(t−7), or t−12 for monthly data) removes seasonality *and* linear trends, making the series closer to **stationary** (constant statistical properties over time).

```python
diff_7 = df[["bus", "rail"]].diff(7)["2019-03":"2019-05"]
df_monthly = df.select_dtypes("number").resample("ME").mean()
df_monthly.rolling(window=12).mean()           # long-term trend
df_monthly.diff(12)                            # removes yearly seasonality and trend
```

**Data snooping, again:** Géron deliberately looks only at 2001–2019 before deciding anything, keeping later data untouched.

### Baseline 1: seasonal naive forecasting

Forecast tomorrow = the same day last week. On March–May 2019: **MAE ≈ 42,143 (rail)**, **MAPE ≈ 9.0%**. Bus: MAE 43,916, MAPE 8.3%. MAE says rail looks better; MAPE says bus does. Bus volumes are larger, so **choose the metric that matches the business question**. The big errors at the end of May were a **holiday** (Memorial Day), and `day_type` can fix that later.

### Baseline 2: the ARMA family

**ARMA(p, q)** (Wold, 1930s): a weighted sum of the last p values (**autoregressive**) plus a weighted sum of the last q forecast errors (**moving average**). It assumes **stationarity**.

- **Differencing d times** removes polynomial trends of degree d: [3, 5, 7, 9] → [2, 2, 2]; quadratic [1, 4, 9, 16, 25] needs d = 2. That is the **I** in **ARIMA** (Box & Jenkins, 1970).
- **SARIMA(p, d, q)(P, D, Q)ₛ** adds the same machinery at the seasonal lag s (7 for weekly).

```python
from statsmodels.tsa.arima.model import ARIMA
rail = df.loc["2019-01-01":"2019-05-31"]["rail"].asfreq("D")     # set the frequency
model = ARIMA(rail, order=(1, 0, 0), seasonal_order=(0, 1, 1, 7)).fit()
model.forecast()                                                  # tomorrow
```

One day's forecast was 12.9% off, worse than naive. But **backtesting** (re-fitting each day over March–May and forecasting the next day) gives **MAE ≈ 32,041**, clearly better than naive. **Never judge a forecaster on a single point.**

Choosing orders: a grid search (p, q, P, Q usually 0–2; d, D usually 0–1; s = the main period), or ACF/PACF analysis, or minimising AIC/BIC (Part 9 §9.19).

---

## 19.3 Preparing sequences for neural networks 🟡

> [!info] 📖 Géron Ch. 13 · “Preparing the Data for Machine Learning Models” · pp. 498–500

**Sliding windows:** every past window of 56 days is a training input, and the next value is its target.

<figure class="dia anim" data-rest="3"><svg viewBox="0 0 720 238" role="img" aria-label="Animation: a seven-day input window and its next-day target slide along a daily series, each position giving one training example">
<rect class="sB" x="30" y="117" width="20" height="63" rx="2" opacity=".6"/>
<rect class="sB" x="57" y="94.6905" width="20" height="85.3095" rx="2" opacity=".6"/>
<rect class="sB" x="84" y="88.2769" width="20" height="91.7231" rx="2" opacity=".6"/>
<rect class="sB" x="111" y="101.685" width="20" height="78.3149" rx="2" opacity=".6"/>
<rect class="sB" x="138" y="123.915" width="20" height="56.0851" rx="2" opacity=".6"/>
<rect class="sB" x="165" y="137.323" width="20" height="42.6769" rx="2" opacity=".6"/>
<rect class="sB" x="192" y="130.909" width="20" height="49.0905" rx="2" opacity=".6"/>
<rect class="sB" x="219" y="108.6" width="20" height="71.4" rx="2" opacity=".6"/>
<rect class="sB" x="246" y="86.2905" width="20" height="93.7095" rx="2" opacity=".6"/>
<rect class="sB" x="273" y="79.8769" width="20" height="100.123" rx="2" opacity=".6"/>
<rect class="sB" x="300" y="93.2851" width="20" height="86.7149" rx="2" opacity=".6"/>
<rect class="sB" x="327" y="115.515" width="20" height="64.4851" rx="2" opacity=".6"/>
<rect class="sB" x="354" y="128.923" width="20" height="51.0769" rx="2" opacity=".6"/>
<rect class="sB" x="381" y="122.509" width="20" height="57.4905" rx="2" opacity=".6"/>
<rect class="sB" x="408" y="100.2" width="20" height="79.8" rx="2" opacity=".6"/>
<rect class="sB" x="435" y="77.8905" width="20" height="102.109" rx="2" opacity=".6"/>
<rect class="sB" x="462" y="71.4769" width="20" height="108.523" rx="2" opacity=".6"/>
<rect class="sB" x="489" y="84.8851" width="20" height="95.1149" rx="2" opacity=".6"/>
<rect class="sB" x="516" y="107.115" width="20" height="72.8851" rx="2" opacity=".6"/>
<rect class="sB" x="543" y="120.523" width="20" height="59.4769" rx="2" opacity=".6"/>
<rect class="sB" x="570" y="114.109" width="20" height="65.8905" rx="2" opacity=".6"/>
<rect class="sB" x="597" y="91.8" width="20" height="88.2" rx="2" opacity=".6"/>
<rect class="sB" x="624" y="69.4905" width="20" height="110.509" rx="2" opacity=".6"/>
<rect class="sB" x="651" y="63.0769" width="20" height="116.923" rx="2" opacity=".6"/>
<line class="sLm" x1="30" y1="180" x2="690" y2="180"/>
<g><animateTransform attributeName="transform" type="translate" values="0 0;27 0;54 0;81 0;108 0;135 0;162 0;189 0;216 0;243 0;270 0;297 0;324 0;351 0;378 0" keyTimes="0.0000;0.0667;0.1333;0.2000;0.2667;0.3333;0.4000;0.4667;0.5333;0.6000;0.6667;0.7333;0.8000;0.8667;0.9333" dur="9s" calcMode="discrete" repeatCount="indefinite"/><rect class="sA" x="27" y="30" width="189" height="160" rx="6" opacity=".18" style="stroke-width:2"/><text class="sC" x="121" y="24" text-anchor="middle">input window (7 days)</text><rect class="sG" x="216" y="30" width="27" height="160" rx="6" opacity=".35"/><text class="sGt" x="229" y="204" text-anchor="middle">target</text></g>
<text class="sS" x="360" y="226" text-anchor="middle">every position of the window is one training example: (7 past values → the next one)</text>
</svg><figcaption>Sliding windows turn one long series into thousands of supervised examples. Géron uses 56-day windows for ridership.</figcaption></figure>

```python
import torch
from torch.utils.data import Dataset, DataLoader

class TimeSeriesDataset(Dataset):
    def __init__(self, series, window_length):
        self.series, self.window_length = series, window_length
    def __len__(self):
        return len(self.series) - self.window_length
    def __getitem__(self, idx):
        if idx >= len(self):
            raise IndexError("dataset index out of range")
        end = idx + self.window_length
        return self.series[idx:end], self.series[end]

# split BY TIME; scale down (÷1e6) so values sit near 0–1
rail_train = torch.FloatTensor(df[["rail"]]["2016-01":"2018-12"].values / 1e6)
rail_valid = torch.FloatTensor(df[["rail"]]["2019-01":"2019-05"].values / 1e6)
rail_test  = torch.FloatTensor(df[["rail"]]["2019-06":].values / 1e6)
train_loader = DataLoader(TimeSeriesDataset(rail_train, 56), batch_size=32, shuffle=True)
```

- RNN inputs are **3-D: [batch, time steps, features]** (with `batch_first=True`). A univariate series still needs a trailing dimension of 1.
- **Shuffle the windows, not their contents.** GD wants IID batches; each window keeps its internal order.
- **Split by time.** Splitting across entities (companies, cells) gives a longer training history, but correlated entities in train and test make the test estimate optimistic.

---

## 19.4 From a linear model to RNNs: Géron's leaderboard 🟡 ⭐

> [!info] 📖 Géron Ch. 13 · “Forecasting Using a Linear Model” → “Sequence-to-Sequence” · pp. 500–511

> [!quote] 💬 Say it in the interview
> “In Géron's ridership example each step down the leaderboard had to beat the one above: naive → SARIMA → linear → RNN → deep RNN → multivariate RNN.”

| Model | Validation MAE (rail) | Notes |
|---|---:|---|
| Seasonal naive (lag 7) | 42,143 | The baseline to beat |
| Linear model on a 56-day window (`Flatten` + `Linear`, Huber loss) | 37,726 | Beats naive |
| **SARIMA(1,0,0)(0,1,1)₇**, refitted daily | 32,041 | Strong classical baseline |
| Simple RNN (1 layer, 32 units) | 30,659 | Beats SARIMA with no manual detrending |
| Deep RNN (3 layers) | 29,273 | |
| **Multivariate RNN** (rail + bus + **next day's type**, one-hot) | **23,227** | **Known-future covariates matter most** |
| Multitask RNN (rail and bus jointly) | 26,441 / 26,178 | Slightly worse than dedicated models here |
| Seq2seq RNN, t+1 forecast | 23,350 | t+14 MAE: 35,315 |

**Lessons that generalise:**
1. **Always have baselines** (naive, seasonal naive, SARIMA/ETS). Many "AI" forecasts don't beat them.
2. **Exogenous and calendar features** (holidays, day type, promotions, known-future events) often help more than a fancier architecture: 29k → 23k here.
3. Neural networks work **without manual detrending**, but making the series more stationary can still help.
4. **Géron's post-2020 warning:** the best models performed **much worse on the test period starting in 2020**, because COVID-19 changed transit behaviour. Models assume the past continues. **Validate on recent data and monitor after deployment.** The same applied to telecom traffic, which shifted from offices to homes in 2020.

### The simple RNN, by hand and with `nn.RNN`

```python
import torch.nn as nn

class SimpleRnnModel(nn.Module):
    def __init__(self, input_size, hidden_size, output_size):
        super().__init__()
        self.rnn = nn.RNN(input_size, hidden_size, batch_first=True)  # tanh, cuDNN-optimised
        self.output = nn.Linear(hidden_size, output_size)             # map state → forecast
    def forward(self, X):                         # X: [batch, time, features]
        outputs, last_state = self.rnn(X)         # outputs: [batch, time, hidden]
        return self.output(outputs[:, -1])        # sequence-to-vector: last step only
```

- `outputs` holds the top layer's hidden state at every step. `last_state` is [num_layers, batch, hidden].
- A final `Linear` is needed because the hidden size (32) ≠ the target size (1), and tanh can't output values > 1.
- **Deep RNN:** `nn.RNN(..., num_layers=3)`.
- **Multivariate:** just set `input_size=5`. Neural networks handle multivariate inputs with almost no code change.

### Forecasting several steps ahead — three strategies

1. **Recursive (autoregressive):** predict t+1, append it to the input, predict t+2, and so on. Simple, but **errors accumulate**. Use it only for a few steps.
2. **Direct multi-output:** a sequence-to-vector model outputs all 14 future values at once (`output_size=14`, targets = the next 14 values). No error accumulation.
3. **Sequence-to-sequence:** at *every* time step, predict the next 14 values (`self.output(outputs)` applied to all steps; targets built with `tensor.unfold(dimension=0, size=14, step=1)`). There is a loss term at every step, so gradients are more stable and training faster, and the model sees varying effective lengths. At inference, keep only the last step's output. It is still **causal**: at each step the RNN sees only the past.

A 3-D input to `nn.Linear` works because `torch.matmul` broadcasts over the leading dimensions: [batch, time, 32] @ [32, 14] → [batch, time, 14].

<figure class="dia"><svg viewBox="0 0 720 196" role="img" aria-label="Two multi-step forecasting strategies: recursive prediction feeds each forecast back as an input, compounding errors; direct prediction outputs every horizon at once">
<text class="sM" x="14" y="24">recursive: predict one, feed it back</text>
<rect class="sB" x="14" y="34" width="52" height="26" rx="4"/><text class="sC" x="40" y="52" text-anchor="middle">t−3</text>
<rect class="sB" x="74" y="34" width="52" height="26" rx="4"/><text class="sC" x="100" y="52" text-anchor="middle">t−2</text>
<rect class="sB" x="134" y="34" width="52" height="26" rx="4"/><text class="sC" x="160" y="52" text-anchor="middle">t−1</text>
<rect class="sB" x="194" y="34" width="52" height="26" rx="4"/><text class="sC" x="220" y="52" text-anchor="middle">t</text>
<rect class="sW" x="270" y="34" width="60" height="26" rx="4"/><text class="sC" x="300" y="52" text-anchor="middle">ŷ t+1</text>
<rect class="sW" x="350" y="34" width="60" height="26" rx="4"/><text class="sC" x="380" y="52" text-anchor="middle">ŷ t+2</text>
<path class="sLw" d="M380 60 Q 330 92 310 62" fill="none" marker-end="url(#ahw)"/>
<rect class="sW" x="430" y="34" width="60" height="26" rx="4"/><text class="sC" x="460" y="52" text-anchor="middle">ŷ t+3</text>
<path class="sLw" d="M460 60 Q 410 92 390 62" fill="none" marker-end="url(#ahw)"/>
<text class="sRt" x="520" y="52">errors compound</text>
<text class="sM" x="14" y="124">direct: one model outputs all horizons at once</text>
<rect class="sB" x="14" y="134" width="52" height="26" rx="4"/><text class="sC" x="40" y="152" text-anchor="middle">t−3</text>
<rect class="sB" x="74" y="134" width="52" height="26" rx="4"/><text class="sC" x="100" y="152" text-anchor="middle">t−2</text>
<rect class="sB" x="134" y="134" width="52" height="26" rx="4"/><text class="sC" x="160" y="152" text-anchor="middle">t−1</text>
<rect class="sB" x="194" y="134" width="52" height="26" rx="4"/><text class="sC" x="220" y="152" text-anchor="middle">t</text>
<line class="sL" x1="250" y1="147" x2="290" y2="147" marker-end="url(#ah)"/><rect class="sV" x="294" y="130" width="100" height="34" rx="8"/><text class="sT" x="344" y="152" text-anchor="middle">model</text>
<line class="sLm" x1="394" y1="147" x2="430" y2="120" marker-end="url(#ahm)"/><rect class="sG" x="434" y="108" width="60" height="24" rx="4"/><text class="sC" x="464" y="125" text-anchor="middle">ŷ t+1</text>
<line class="sLm" x1="394" y1="147" x2="430" y2="147" marker-end="url(#ahm)"/><rect class="sG" x="434" y="135" width="60" height="24" rx="4"/><text class="sC" x="464" y="152" text-anchor="middle">ŷ t+2</text>
<line class="sLm" x1="394" y1="147" x2="430" y2="174" marker-end="url(#ahm)"/><rect class="sG" x="434" y="162" width="60" height="24" rx="4"/><text class="sC" x="464" y="179" text-anchor="middle">ŷ t+3</text>
<text class="sGt" x="520" y="152">no feedback, no compounding</text>
</svg><figcaption>For 14 days ahead, Géron's direct model beats the recursive one for exactly this reason.</figcaption></figure>

---

## 19.5 Long sequences: two problems and their fixes 🟡

> [!info] 📖 Géron Ch. 13 · “Handling Long Sequences” · pp. 511–523

### Problem 1 — unstable gradients

An unrolled RNN over T steps is a T-layer-deep network. Fixes (Part 17):
- Good initialisation (orthogonal for recurrent weights), a smaller learning rate, and a **saturating activation** (tanh) inside the recurrence.
- **Gradient clipping** (monitor the gradient norm).
- **BatchNorm doesn't suit recurrence.** Laurent et al. (2015) found it only helped *between* recurrent layers, not across time. **LayerNorm works better within the cell**, applied before the activation at every step. `nn.RNN` doesn't support it, so write the loop yourself with `nn.RNNCell` / `nn.LSTMCell` + `nn.LayerNorm`.
- Dropout: `nn.RNN(..., dropout=0.2)` adds it *between* layers. Recurrent (per-step) dropout needs a custom loop.
- **MC dropout** (Part 17 §17.5) gives forecast **error bars**.

### Problem 2 — short-term memory ("Dory the fish")

Information decays at every step. Gated cells fix this.

**LSTM** (Hochreiter & Schmidhuber, 1997). The state splits into a **short-term h₍ₜ₎** and a **long-term c₍ₜ₎**:

```
i = σ(W_xi x + W_hi h₍ₜ₋₁₎ + b_i)     input gate:  what to write
f = σ(W_xf x + W_hf h₍ₜ₋₁₎ + b_f)     forget gate: what to erase from c
o = σ(W_xo x + W_ho h₍ₜ₋₁₎ + b_o)     output gate: what to read out
g = tanh(W_xg x + W_hg h₍ₜ₋₁₎ + b_g)  candidate memory
c₍ₜ₎ = f ⊗ c₍ₜ₋₁₎ + i ⊗ g              long-term state: forget some, add some
h₍ₜ₎ = y₍ₜ₎ = o ⊗ tanh(c₍ₜ₎)
```

The long-term state flows through with only multiplication by the forget gate and an addition, a near-linear path for both memory and gradients (like ResNet's skip connections). The cell learns **to recognise important inputs, store them, keep them as long as needed, and read them when useful**, all differentiably. `nn.LSTM` is a drop-in replacement for `nn.RNN`.

<figure class="dia"><svg viewBox="0 0 720 226" role="img" aria-label="An LSTM cell: the long-term state c runs along the top and is only multiplied by the forget gate and added to by the input gate times the candidate; the output gate reads tanh of c into the new short-term state h">
<line class="sLg" x1="40" y1="40" x2="680" y2="40" marker-end="url(#ahg)" stroke-width="4"/><text class="sGt" x="30" y="44" text-anchor="end">c</text><text class="sGt" x="690" y="44">c′</text>
<text class="sGt" x="360" y="16" text-anchor="middle">long-term state: only a multiply and an add per step (a gradient highway)</text>
<circle class="sR" cx="160" cy="40" r="14"/><text class="sT" x="160" y="45" text-anchor="middle">×</text><circle class="sA" cx="370" cy="40" r="14"/><text class="sT" x="370" y="45" text-anchor="middle">+</text>
<line class="sL" x1="40" y1="190" x2="680" y2="190" marker-end="url(#ah)" stroke-width="2.5"/><text class="sT" x="30" y="194" text-anchor="end">h</text><text class="sT" x="690" y="194">h′</text>
<text class="sC" x="80" y="214" text-anchor="middle">x (input)</text><line class="sLm" x1="80" y1="204" x2="80" y2="194"/>
<rect class="sR" x="100" y="110" width="120" height="44" rx="6"/><text class="sT" x="160" y="128" text-anchor="middle">forget f</text><text class="sC" x="160" y="146" text-anchor="middle">σ: what to erase</text><line class="sLm" x1="160" y1="188" x2="160" y2="156" marker-end="url(#ahm)"/>
<rect class="sA" x="236" y="110" width="120" height="44" rx="6"/><text class="sT" x="296" y="128" text-anchor="middle">input i</text><text class="sC" x="296" y="146" text-anchor="middle">σ: what to write</text><line class="sLm" x1="296" y1="188" x2="296" y2="156" marker-end="url(#ahm)"/>
<rect class="sV" x="384" y="110" width="120" height="44" rx="6"/><text class="sT" x="444" y="128" text-anchor="middle">candidate g</text><text class="sC" x="444" y="146" text-anchor="middle">tanh: new content</text><line class="sLm" x1="444" y1="188" x2="444" y2="156" marker-end="url(#ahm)"/>
<rect class="sW" x="530" y="110" width="120" height="44" rx="6"/><text class="sT" x="590" y="128" text-anchor="middle">output o</text><text class="sC" x="590" y="146" text-anchor="middle">σ: what to read</text><line class="sLm" x1="590" y1="188" x2="590" y2="156" marker-end="url(#ahm)"/>
<line class="sLr" x1="160" y1="108" x2="160" y2="56" marker-end="url(#ahr)"/>
<circle class="sV" cx="370" cy="80" r="12"/><text class="sT" x="370" y="85" text-anchor="middle">×</text><line class="sLm" x1="296" y1="108" x2="360" y2="86"/><line class="sLm" x1="444" y1="108" x2="380" y2="86"/><line class="sLm" x1="370" y1="68" x2="370" y2="56" marker-end="url(#ahm)"/>
<circle class="sW" cx="590" cy="80" r="12"/><text class="sT" x="590" y="85" text-anchor="middle">×</text><line class="sLm" x1="590" y1="108" x2="590" y2="94"/><line class="sLm" x1="540" y1="40" x2="580" y2="72" marker-end="url(#ahm)"/><text class="sC" x="534" y="66" text-anchor="end">tanh(c′)</text><line class="sLm" x1="602" y1="86" x2="650" y2="186" marker-end="url(#ahm)"/>
</svg><figcaption>An LSTM in one picture. Gates are small sigmoid layers deciding what to forget, write and read; the top line is why it remembers.</figcaption></figure>

**GRU** (Cho et al., 2014) is a simplified LSTM that often performs as well:
- One state vector h.
- One gate z controls **both** forgetting and writing (erase first, then store).
- No output gate. A reset gate r controls how much of the old state feeds the candidate.

```
z = σ(...),  r = σ(...),  g = tanh(W_xg x + W_hg (r ⊗ h₍ₜ₋₁₎) + b_g),
h₍ₜ₎ = z ⊗ h₍ₜ₋₁₎ + (1 − z) ⊗ g
```

Greff et al. (2017), *"LSTM: A Search Space Odyssey"*, found LSTM variants perform roughly the same. Even so, LSTMs and GRUs struggle beyond **~100 steps**.

### Shortening sequences: 1D convolutions

`nn.Conv1d` slides kernels along time. Strided or "valid" convs **shorten sequences**, so a following GRU can see longer history (Géron doubles the window to 112 days). Watch the shapes: `Conv1d` wants [batch, **channels**, time], so **permute** before and after. Crop and downsample the targets to match (kernel 4 → drop the first 3 targets; stride 2 → take every 2nd).

### WaveNet: dilated causal convolutions

DeepMind (van den Oord et al., 2016). Stack 1D convs with **dilation 1, 2, 4, 8, …, 512** so the receptive field doubles per layer. Ten layers act like a kernel of 1,024 steps with far fewer parameters. **Causal** left-padding means no peeking at the future. It produced state-of-the-art text-to-speech and even generated music, handling **tens of thousands of time steps** that LSTMs can't.

<figure class="dia"><svg viewBox="0 0 720 214" role="img" aria-label="WaveNet's dilated causal convolutions: four layers with dilations 1, 2, 4 and 8 give the top output a receptive field of 16 past time steps without looking at the future">
<circle class="sP" cx="40" cy="200" r="5" opacity=".7"/>
<circle class="sP" cx="80" cy="200" r="5" opacity=".7"/>
<circle class="sP" cx="120" cy="200" r="5" opacity=".7"/>
<circle class="sP" cx="160" cy="200" r="5" opacity=".7"/>
<circle class="sP" cx="200" cy="200" r="5" opacity=".7"/>
<circle class="sP" cx="240" cy="200" r="5" opacity=".7"/>
<circle class="sP" cx="280" cy="200" r="5" opacity=".7"/>
<circle class="sP" cx="320" cy="200" r="5" opacity=".7"/>
<circle class="sP" cx="360" cy="200" r="5" opacity=".7"/>
<circle class="sP" cx="400" cy="200" r="5" opacity=".7"/>
<circle class="sP" cx="440" cy="200" r="5" opacity=".7"/>
<circle class="sP" cx="480" cy="200" r="5" opacity=".7"/>
<circle class="sP" cx="520" cy="200" r="5" opacity=".7"/>
<circle class="sP" cx="560" cy="200" r="5" opacity=".7"/>
<circle class="sP" cx="600" cy="200" r="5" opacity=".7"/>
<circle class="sP" cx="640" cy="200" r="5" opacity=".7"/>
<text class="sC" x="706" y="204" text-anchor="end">input</text>
<circle class="sPv" cx="40" cy="158" r="5"/>
<circle class="sPv" cx="80" cy="158" r="5"/>
<circle class="sPv" cx="120" cy="158" r="5"/>
<circle class="sPv" cx="160" cy="158" r="5"/>
<circle class="sPv" cx="200" cy="158" r="5"/>
<circle class="sPv" cx="240" cy="158" r="5"/>
<circle class="sPv" cx="280" cy="158" r="5"/>
<circle class="sPv" cx="320" cy="158" r="5"/>
<circle class="sPv" cx="360" cy="158" r="5"/>
<circle class="sPv" cx="400" cy="158" r="5"/>
<circle class="sPv" cx="440" cy="158" r="5"/>
<circle class="sPv" cx="480" cy="158" r="5"/>
<circle class="sPv" cx="520" cy="158" r="5"/>
<circle class="sPv" cx="560" cy="158" r="5"/>
<circle class="sPv" cx="600" cy="158" r="5"/>
<circle class="sPv" cx="640" cy="158" r="5"/>
<text class="sC" x="706" y="162" text-anchor="end">dilation 1</text>
<circle class="sPv" cx="40" cy="116" r="5"/>
<circle class="sPv" cx="80" cy="116" r="5"/>
<circle class="sPv" cx="120" cy="116" r="5"/>
<circle class="sPv" cx="160" cy="116" r="5"/>
<circle class="sPv" cx="200" cy="116" r="5"/>
<circle class="sPv" cx="240" cy="116" r="5"/>
<circle class="sPv" cx="280" cy="116" r="5"/>
<circle class="sPv" cx="320" cy="116" r="5"/>
<circle class="sPv" cx="360" cy="116" r="5"/>
<circle class="sPv" cx="400" cy="116" r="5"/>
<circle class="sPv" cx="440" cy="116" r="5"/>
<circle class="sPv" cx="480" cy="116" r="5"/>
<circle class="sPv" cx="520" cy="116" r="5"/>
<circle class="sPv" cx="560" cy="116" r="5"/>
<circle class="sPv" cx="600" cy="116" r="5"/>
<circle class="sPv" cx="640" cy="116" r="5"/>
<text class="sC" x="706" y="120" text-anchor="end">dilation 2</text>
<circle class="sPv" cx="40" cy="74" r="5"/>
<circle class="sPv" cx="80" cy="74" r="5"/>
<circle class="sPv" cx="120" cy="74" r="5"/>
<circle class="sPv" cx="160" cy="74" r="5"/>
<circle class="sPv" cx="200" cy="74" r="5"/>
<circle class="sPv" cx="240" cy="74" r="5"/>
<circle class="sPv" cx="280" cy="74" r="5"/>
<circle class="sPv" cx="320" cy="74" r="5"/>
<circle class="sPv" cx="360" cy="74" r="5"/>
<circle class="sPv" cx="400" cy="74" r="5"/>
<circle class="sPv" cx="440" cy="74" r="5"/>
<circle class="sPv" cx="480" cy="74" r="5"/>
<circle class="sPv" cx="520" cy="74" r="5"/>
<circle class="sPv" cx="560" cy="74" r="5"/>
<circle class="sPv" cx="600" cy="74" r="5"/>
<circle class="sPv" cx="640" cy="74" r="5"/>
<text class="sC" x="706" y="78" text-anchor="end">dilation 4</text>
<circle class="sPg" cx="40" cy="32" r="5"/>
<circle class="sPg" cx="80" cy="32" r="5"/>
<circle class="sPg" cx="120" cy="32" r="5"/>
<circle class="sPg" cx="160" cy="32" r="5"/>
<circle class="sPg" cx="200" cy="32" r="5"/>
<circle class="sPg" cx="240" cy="32" r="5"/>
<circle class="sPg" cx="280" cy="32" r="5"/>
<circle class="sPg" cx="320" cy="32" r="5"/>
<circle class="sPg" cx="360" cy="32" r="5"/>
<circle class="sPg" cx="400" cy="32" r="5"/>
<circle class="sPg" cx="440" cy="32" r="5"/>
<circle class="sPg" cx="480" cy="32" r="5"/>
<circle class="sPg" cx="520" cy="32" r="5"/>
<circle class="sPg" cx="560" cy="32" r="5"/>
<circle class="sPg" cx="600" cy="32" r="5"/>
<circle class="sPg" cx="640" cy="32" r="5"/>
<text class="sC" x="706" y="36" text-anchor="end">dilation 8</text>
<line class="sLg" x1="640" y1="37" x2="640" y2="69" stroke-width="2"/><line class="sLg" x1="640" y1="79" x2="640" y2="111" stroke-width="2"/><line class="sLg" x1="640" y1="121" x2="640" y2="153" stroke-width="2"/><line class="sLg" x1="640" y1="163" x2="640" y2="195" stroke-width="2"/><line class="sLg" x1="640" y1="163" x2="600" y2="195" stroke-width="2"/><line class="sLg" x1="640" y1="121" x2="560" y2="153" stroke-width="2"/><line class="sLg" x1="560" y1="163" x2="560" y2="195" stroke-width="2"/><line class="sLg" x1="560" y1="163" x2="520" y2="195" stroke-width="2"/><line class="sLg" x1="640" y1="79" x2="480" y2="111" stroke-width="2"/><line class="sLg" x1="480" y1="121" x2="480" y2="153" stroke-width="2"/><line class="sLg" x1="480" y1="163" x2="480" y2="195" stroke-width="2"/><line class="sLg" x1="480" y1="163" x2="440" y2="195" stroke-width="2"/><line class="sLg" x1="480" y1="121" x2="400" y2="153" stroke-width="2"/><line class="sLg" x1="400" y1="163" x2="400" y2="195" stroke-width="2"/><line class="sLg" x1="400" y1="163" x2="360" y2="195" stroke-width="2"/><line class="sLg" x1="640" y1="37" x2="320" y2="69" stroke-width="2"/><line class="sLg" x1="320" y1="79" x2="320" y2="111" stroke-width="2"/><line class="sLg" x1="320" y1="121" x2="320" y2="153" stroke-width="2"/><line class="sLg" x1="320" y1="163" x2="320" y2="195" stroke-width="2"/><line class="sLg" x1="320" y1="163" x2="280" y2="195" stroke-width="2"/><line class="sLg" x1="320" y1="121" x2="240" y2="153" stroke-width="2"/><line class="sLg" x1="240" y1="163" x2="240" y2="195" stroke-width="2"/><line class="sLg" x1="240" y1="163" x2="200" y2="195" stroke-width="2"/><line class="sLg" x1="320" y1="79" x2="160" y2="111" stroke-width="2"/><line class="sLg" x1="160" y1="121" x2="160" y2="153" stroke-width="2"/><line class="sLg" x1="160" y1="163" x2="160" y2="195" stroke-width="2"/><line class="sLg" x1="160" y1="163" x2="120" y2="195" stroke-width="2"/><line class="sLg" x1="160" y1="121" x2="80" y2="153" stroke-width="2"/><line class="sLg" x1="80" y1="163" x2="80" y2="195" stroke-width="2"/><line class="sLg" x1="80" y1="163" x2="40" y2="195" stroke-width="2"/>
<text class="sGt" x="320" y="20" text-anchor="middle">one output sees 16 past steps after 4 layers; 10 layers see 1,024</text>
</svg><figcaption>Dilations double the reach with every layer, and causal padding means no output ever peeks at a future step.</figcaption></figure>

```python
import torch.nn.functional as F

class CausalConv1d(nn.Conv1d):
    def forward(self, X):
        padding = (self.kernel_size[0] - 1) * self.dilation[0]
        return super().forward(F.pad(X, (padding, 0)))      # pad the LEFT only

class WavenetModel(nn.Module):
    def __init__(self, input_size, hidden_size, output_size):
        super().__init__()
        layers = []
        for dilation in (1, 2, 4, 8) * 2:
            layers += [CausalConv1d(input_size, hidden_size, kernel_size=2,
                                    dilation=dilation), nn.ReLU()]
            input_size = hidden_size
        self.convs = nn.Sequential(*layers)
        self.output = nn.Linear(hidden_size, output_size)
    def forward(self, X):
        Z = self.convs(X.permute(0, 2, 1)).permute(0, 2, 1)
        return self.output(Z)
```

---

## 19.6 The practitioner's forecasting playbook (beyond the book) 🟢 ⭐

> [!quote] 💬 Say it in the interview
> “For many series my default is a global LightGBM on lag, rolling and calendar features, compared against seasonal naive and a foundation model like TimesFM or Chronos.”

Géron teaches the models. Here is how forecasting is done in industry, the level a mid-level interview expects.

### Framing questions (always ask)

1. **Horizon** (next hour? next quarter?) and **granularity** (per cell? per region?).
2. **Point or probabilistic?** Capacity planning needs a **P90/P95 quantile**, not the mean. Inventory and staffing need intervals.
3. **Which covariates are known in the future** (calendar, holidays, Ramadan and Eid dates, planned promotions, price changes, network rollouts)? And which are only known in the past (actual usage, weather)?
4. **How many series?** One (use classical models) or 50,000 cells (use one **global** model across them).
5. **Hierarchy:** cell → site → governorate → national. Forecasts should **reconcile** (sum up consistently): bottom-up, top-down, or optimal reconciliation (MinT).

<figure class="dia"><svg viewBox="0 0 720 248" role="img" aria-label="A cell, site and national hierarchy: independent forecasts at each level do not add up, while bottom-up reconciliation sums the cell forecasts so every parent equals the sum of its children">
<text class="sM" x="14" y="22">independently forecast at each level (left) vs reconciled bottom-up (right of each)</text>
<rect class="sN" x="270" y="34" width="180" height="44" rx="8"/><text class="sT" x="360" y="52" text-anchor="middle">national</text><text class="sRt" x="330" y="70" text-anchor="middle">base 160</text><text class="sGt" x="392" y="70" text-anchor="middle">→ 156</text>
<line class="sLm" x1="170" y1="104" x2="360" y2="78"/><rect class="sN" x="90" y="104" width="160" height="44" rx="8"/><text class="sT" x="170" y="122" text-anchor="middle">site 1</text><text class="sRt" x="144" y="140" text-anchor="middle">base 81</text><text class="sGt" x="206" y="140" text-anchor="middle">→ 77</text>
<line class="sLm" x1="90" y1="174" x2="170" y2="148"/><rect class="sB" x="30" y="174" width="120" height="40" rx="8"/><text class="sC" x="90" y="192" text-anchor="middle">cell A</text><text class="sT" x="90" y="207" text-anchor="middle">42</text>
<line class="sLm" x1="250" y1="174" x2="170" y2="148"/><rect class="sB" x="190" y="174" width="120" height="40" rx="8"/><text class="sC" x="250" y="192" text-anchor="middle">cell B</text><text class="sT" x="250" y="207" text-anchor="middle">35</text>
<line class="sLm" x1="530" y1="104" x2="360" y2="78"/><rect class="sN" x="450" y="104" width="160" height="44" rx="8"/><text class="sT" x="530" y="122" text-anchor="middle">site 2</text><text class="sRt" x="504" y="140" text-anchor="middle">base 74</text><text class="sGt" x="566" y="140" text-anchor="middle">→ 79</text>
<line class="sLm" x1="450" y1="174" x2="530" y2="148"/><rect class="sB" x="390" y="174" width="120" height="40" rx="8"/><text class="sC" x="450" y="192" text-anchor="middle">cell C</text><text class="sT" x="450" y="207" text-anchor="middle">28</text>
<line class="sLm" x1="610" y1="174" x2="530" y2="148"/><rect class="sB" x="550" y="174" width="120" height="40" rx="8"/><text class="sC" x="610" y="192" text-anchor="middle">cell D</text><text class="sT" x="610" y="207" text-anchor="middle">51</text>
<text class="sS" x="360" y="236" text-anchor="middle">base forecasts disagree: sites sum to 155, cells to 156, national says 160; bottom-up makes every level add up</text>
</svg><figcaption>Reconciliation in one picture: the network planner and the finance team must see numbers that add up.</figcaption></figure>

### Validation: rolling-origin backtesting

```
|---- train ----|-- h --|
|------ train ------|-- h --|
|--------- train ---------|-- h --|     ← expanding window, as Géron did with SARIMA
```

`sklearn.model_selection.TimeSeriesSplit(n_splits=5, test_size=h, gap=g)`. The **gap** covers the delay before data becomes available. **Never shuffle across time. Never fit scalers or target encoders on future data.**

### Metrics

| Metric | Use | Pitfall |
|---|---|---|
| MAE / RMSE | Same units as the series | Not comparable across series of different scales |
| MAPE | Business-friendly % | Explodes near 0; penalises over-forecasts more |
| **WAPE** = Σ\|e\| / Σ\|y\| | Aggregate %; robust to zeros in individual points | — |
| **MASE** | Error ÷ in-sample seasonal-naive error; < 1 beats naive | The best "did we beat the baseline?" metric |
| **Pinball (quantile) loss, CRPS** | Probabilistic forecasts | — |
| **Coverage** | Does the P90 interval contain ~90% of actuals? | Many models are over-confident |

<figure class="dia"><svg viewBox="0 0 720 246" role="img" aria-label="Hourly traffic with one near-zero night hour: absolute percentage errors are small except at 02:00, where an error of 6 units on an actual of 2 is 300 percent, pulling MAPE to about 50 percent while WAPE stays near 9 percent">
<rect class="sB" x="60" y="169.333" width="44" height="10.6667" rx="3" opacity=".75"/><text class="sS" x="82" y="163.333" text-anchor="middle">8%</text>
<text class="sS" x="82" y="196" text-anchor="middle">18:00</text><text class="sS" x="82" y="212" text-anchor="middle">120 vs 110</text>
<rect class="sB" x="124" y="173.263" width="44" height="6.73684" rx="3" opacity=".75"/><text class="sS" x="146" y="167.263" text-anchor="middle">5%</text>
<text class="sS" x="146" y="196" text-anchor="middle">20:00</text><text class="sS" x="146" y="212" text-anchor="middle">95 vs 100</text>
<rect class="sB" x="188" y="164" width="44" height="16" rx="3" opacity=".75"/><text class="sS" x="210" y="158" text-anchor="middle">12%</text>
<text class="sS" x="210" y="196" text-anchor="middle">22:00</text><text class="sS" x="210" y="212" text-anchor="middle">80 vs 70</text>
<rect class="sR" x="252" y="52" width="44" height="128" rx="3" opacity=".75"/><text class="sS" x="274" y="46" text-anchor="middle">300%</text>
<text class="sS" x="274" y="196" text-anchor="middle">02:00</text><text class="sS" x="274" y="212" text-anchor="middle">2 vs 8</text>
<rect class="sB" x="316" y="167.2" width="44" height="12.8" rx="3" opacity=".75"/><text class="sS" x="338" y="161.2" text-anchor="middle">10%</text>
<text class="sS" x="338" y="196" text-anchor="middle">06:00</text><text class="sS" x="338" y="212" text-anchor="middle">60 vs 66</text>
<rect class="sB" x="380" y="168.364" width="44" height="11.6364" rx="3" opacity=".75"/><text class="sS" x="402" y="162.364" text-anchor="middle">9%</text>
<text class="sS" x="402" y="196" text-anchor="middle">08:00</text><text class="sS" x="402" y="212" text-anchor="middle">110 vs 100</text>
<rect class="sB" x="444" y="172.123" width="44" height="7.87692" rx="3" opacity=".75"/><text class="sS" x="466" y="166.123" text-anchor="middle">6%</text>
<text class="sS" x="466" y="196" text-anchor="middle">10:00</text><text class="sS" x="466" y="212" text-anchor="middle">130 vs 122</text>
<line class="sLm" x1="50" y1="180" x2="510" y2="180"/><text class="sM" x="14" y="18">absolute % error per hour (capped at 100% for display)</text>
<rect class="sN" x="530" y="40" width="176" height="130" rx="8"/>
<text class="sRt" x="618" y="64" text-anchor="middle">MAPE = 50%</text><text class="sS" x="618" y="82" text-anchor="middle">one quiet hour dominates</text>
<text class="sGt" x="618" y="116" text-anchor="middle">WAPE = 9.2%</text><text class="sS" x="618" y="134" text-anchor="middle">Σ|error| / Σ actual</text>
<text class="sS" x="618" y="158" text-anchor="middle">02:00: 6 units off = 300%</text>
<text class="sS" x="360" y="234" text-anchor="middle">MAPE divides by each actual, so near-zero hours explode it; WAPE weights errors by volume</text>
</svg><figcaption>Same forecast, two percentage metrics, computed: prefer WAPE (or MASE) when series touch zero.</figcaption></figure>

### Model families, in the order to try them

1. **Naive / seasonal naive / moving average.** Always.
2. **ETS / Theta / (S)ARIMA(X)**: `statsforecast` (Nixtla, very fast) or `statsmodels`. Strong with one or a few series. **Prophet** is quick for business series with holidays, though often beaten by tuned ETS or GBMs.
3. **Global gradient boosting** (LightGBM) on **lag, rolling, calendar and holiday features**, with one model across thousands of series (Part 16 §16.4 code; `mlforecast`, `skforecast`, `darts`). **This won the M5 competition** (Walmart sales, 2020), and it is the industry workhorse for retail and telecom-scale forecasting.
4. **Deep learning:** DeepAR (probabilistic RNN), **N-BEATS / N-HiTS**, **Temporal Fusion Transformer (TFT)**, **PatchTST**, TiDE (`neuralforecast`, `darts`, PyTorch-Forecasting). Worth it with many long related series and rich covariates.
5. **Foundation models (zero-shot):** **TimeGPT** (Nixtla), **Chronos** (Amazon), **TimesFM** (Google), **Moirai** (Salesforce), Lag-Llama. Pretrained on huge corpora of series; they forecast new series with no training. Excellent **quick baselines**. Always backtest them against seasonal naive and a tuned GBM before trusting them. This is exactly the check Part 14 recommended for FinSight.

**Uncertainty:** quantile regression (LightGBM `objective="quantile"`), MC dropout, distributional heads (DeepAR), or **conformal prediction** (`MAPIE`, and Nixtla's conformal intervals). Conformal gives coverage guarantees under mild assumptions.

> [!success] 🔭 State of the art — sequence models (2025–26)
> - For NLP and most sequence tasks, **transformers replaced RNNs** (Part 21). RNNs remain useful for small, low-latency streaming problems and on-device models.
> - **State-space models** (S4, **Mamba**, 2023) and modern recurrent designs (RWKV, xLSTM, 2024) process long sequences in linear time with recurrent-style inference. They are used in some long-context and hybrid LLMs (for example, hybrid Mamba– transformer models such as Jamba).
> - Forecasting benchmarks (e.g. **GIFT-Eval**) now compare foundation models with statistical and GBM baselines. Results vary a lot by domain. **No model family wins everywhere**, which is the No Free Lunch theorem again (Part 6 §6.10).
> - **Competitions to know:** M4 (2018) was won by Slawek Smyl's **ES-RNN hybrid** (exponential smoothing + LSTM); M5 (2020) by **LightGBM-based** solutions. Hybrids and GBMs beat pure deep learning on business data.

---

## 19.7 Real-world examples 🟡

| Organisation / domain | Problem | What works |
|---|---|---|
| **Chicago Transit Authority** (Géron's case) | Daily ridership | Seasonal naive < SARIMA < RNN with calendar covariates; a regime change broke everything in 2020 |
| **Walmart (M5 competition)** | 42,840 hierarchical sales series | Global LightGBM with lag, price and event features |
| **Uber** | Demand forecasting for marketplace balancing, extreme events | LSTM-based models with uncertainty; published research on holiday and event forecasting |
| **Amazon** | Millions of products | DeepAR (a probabilistic RNN, 2017), later Chronos (a foundation model, 2024) |
| **Energy utilities** | Load forecasting (hourly, with weather) | GBMs and deep models with temperature covariates; quantile forecasts for reserves |
| **Telecom (e&-relevant)** | Busy-hour traffic per cell (capacity upgrades); data growth by governorate; call-centre volume (staffing); network KPI anomaly detection (residual vs forecast); revenue and recharge forecasting; FinSight-style cash-flow forecasting | Hierarchical, global GBMs with calendar features (Ramadan, Eid, school terms, football matches), P90 quantiles for capacity, foundation models as baselines, backtests with MASE |

**Anomaly detection with forecasts:** forecast the expected KPI (per cell, per hour-of-week) and alert when the actual value falls outside the prediction interval. This is more robust than a fixed threshold and naturally seasonal (Part 12 P12, Part 9 §9.20).

---

> [!check] ✅ Key takeaways
> - Always start with naive and seasonal-naive baselines and a time-ordered split.
> - Evaluate with MAE/MASE on a rolling backtest; avoid MAPE near zero.
> - Géron's ladder: naive → SARIMA → linear → RNN → deep RNN → multivariate — each must beat the last.
> - LSTM/GRU gates fight short-term memory; 1D convs and WaveNet handle long sequences.
> - In practice, a global LightGBM with lag/rolling/calendar features is a strong default.
> - Foundation models (TimesFM, Chronos) give good zero-shot baselines.

## 19.8 Interview drill — sequences and forecasting (Géron Ch. 13 exercises, answered) 🟡 ⭐

> [!info] 📖 Géron Ch. 13 · Exercises · p. 523

**1. Applications of each RNN type?** Seq→seq: forecasting, part-of-speech tagging, transcription (with an encoder–decoder), translation. Seq→vector: sentiment or intent classification, churn from usage sequences, predicting the next value. Vector→seq: image captioning, generating a playlist or offer sequence from a profile. Encoder–decoder: translation, summarisation.

**2. Input and output dimensions of an RNN layer?** Inputs are 3-D: [batch, time steps, features] with `batch_first=True` (otherwise time first). Outputs: [batch, time steps, hidden size] for all steps, plus the final hidden state [num_layers(×2 if bidirectional), batch, hidden].

**3. A deep seq2seq RNN in PyTorch?** `nn.RNN/LSTM/GRU(..., num_layers=k, batch_first=True)`, then apply a `Linear` to the full `outputs` tensor, not just the last step.

**4. Daily univariate series, forecast the next 7 days?** A seq2vec RNN (or GBM, or a linear model) that outputs 7 values at once, or a seq2seq model trained to predict the next 7 values at every step. Compare with seasonal naive and ETS.

**5. The main difficulties training RNNs?** Unstable gradients (fix: clipping, a smaller LR, saturating activations, layer norm, good init) and short memory (fix: LSTM/GRU, convolutional downsampling, WaveNet-style dilation, attention or transformers).

**6. Sketch the LSTM cell.** Four layers: forget, input and output gates (sigmoid) and a candidate (tanh). c = f⊗c_prev + i⊗g; h = o⊗tanh(c). See §19.5.

**7. Why use 1D convs in an RNN model?** To detect local patterns cheaply, downsample long sequences so the recurrent layers see longer contexts, and parallelise (convs are fast).

**8. What architecture for video classification?** A per-frame CNN (or ViT) for features, then an RNN or temporal transformer over the frame embeddings. Or 3D convs. Or a pretrained video transformer (VideoMAE, Part 22).

**Forecasting questions interviewers love:**
- **"Why can't you use random K-fold on time series?"** It leaks the future into training (look-ahead bias) and breaks autocorrelation structure. Use rolling-origin or expanding-window backtests.
- **"What is stationarity and why does it matter?"** Constant mean, variance and autocorrelation over time. ARIMA-type models assume it. Test with ADF/KPSS; fix with differencing or log transforms.
- **"Your forecast MAPE is 4%. Is that good?"** Compare with seasonal naive (MASE), check the forecast bias (a sum of signed errors), look at performance on holidays and promotions and not just the average, and check interval coverage.
- **"How do you forecast 20,000 cells' traffic?"** One global LightGBM (or N-HiTS/TFT) over all cells with cell-level features (technology, region, site type), lag, rolling and calendar features, quantile objectives for P90, hierarchical reconciliation to regional totals, and a rolling backtest. Monitor drift, and retrain weekly.
- **"The forecast broke after a sudden event (COVID, a price change). What now?"** Detect the regime change (monitoring), add intervention or step variables, shorten the training window or downweight old data, and involve domain experts for scenario-based forecasts.

---

## Further reading and sources

**Book:** Géron Ch. 13 + notebook (exercise 10: generate Bach chorales; exercise 12: yes/no speech RNN with torchaudio mel-spectrograms).

**Classic papers:** Hochreiter & Schmidhuber (1997) LSTM · Cho et al. (2014) GRU/encoder– decoder · van den Oord et al. (2016) WaveNet · Salinas et al. (2017) DeepAR · Oreshkin et al. (2019) N-BEATS · Lim et al. (2019) Temporal Fusion Transformer · Nie et al. (2022) PatchTST · Gu & Dao (2023) Mamba · Ansari et al. (2024) Chronos · Das et al. (2024) TimesFM.

**Books and courses:**
- **Hyndman & Athanasopoulos, *Forecasting: Principles and Practice* (3rd ed., free online at otexts.com/fpp3; a Python edition is in progress).** The best forecasting book there is.
- **Nixtla's docs** (`statsforecast`, `mlforecast`, `neuralforecast`, TimeGPT). Practical and fast, and relevant to FinSight.
- **Chris Olah, "Understanding LSTM Networks"** (colah.github.io). The famous visual explanation.
- Makridakis et al., **M4 and M5 competition papers** (International Journal of Forecasting). What actually wins.
- Andrej Karpathy, **"The Unreasonable Effectiveness of Recurrent Neural Networks"** (2015 blog post): char-RNNs, and a bridge to Part 20.

---

<!-- nav -->
> [!example] 🧭 Step 18 of 26 · Stage 5 of 7: Deep learning
> ← [Part 18 · CNNs & vision](18_Computer_Vision_CNNs.md) · [Part 20 · NLP + attention](20_NLP_RNNs_HuggingFace_and_Attention.md) → · [Course map](00_START_HERE.md)
<!-- /nav -->
