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
