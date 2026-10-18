# Features and Leakage — Building Inputs That Help, Without Cheating

On tabular business data, **features matter more than the choice of algorithm**, and **leakage** is the most common way a model that looked brilliant offline fails in production. Interviewers probe both: "what features would you build for churn?" and "your validation AUC is 0.99. What's wrong?". Your *AI Journey* Part 4 covers cleaning and preprocessing mechanics in depth; this module focuses on feature design for real business problems and on leakage in all its forms.

> [!focus]
> **Entry must:** encode categoricals and scale numerics appropriately; build features as of a prediction time; explain data leakage with examples; use scikit-learn pipelines so preprocessing is fitted on training data only; handle class imbalance sensibly.
> **Mid adds:** target encoding without leakage, temporal and group leakage, point-in-time joins, time-based and grouped validation, feature selection with permutation importance, recognising leakage from suspicious results.
> **Most asked:** *What is data leakage?* · *How do you encode a high-cardinality categorical?* · *Do trees need scaling?* · *How do you handle imbalance?* · *Why use a pipeline?* · *Your model scores 0.99 AUC. What do you check?*
> **Time budget:** 3 hours.

## DS2.0 Foundations: a model only ever sees a table 🟢

Whatever the source (transactions, call records, text), a classic ML model receives a **table of numbers**: one row per example, one column per **feature**, the same columns in the same order every time. Feature engineering is the work of turning raw, many-table data into that table:

- **Aggregate** events into per-entity numbers: recharges in the last 30 days, days since the last order.
- **Encode** categories as numbers: a city becomes 0/1 columns, or a learned statistic.
- **Transform** scales and skew where the model needs it.

<figure class="dia anim"><svg viewBox="0 0 720 234" role="img" aria-label="Animation: raw subscriber, recharge and complaint tables aggregated per subscriber as of a cut-off into one row of numeric features that the model reads">
<rect class="sB" x="14" y="20" width="150" height="54" rx="6"/><text class="sT" x="89" y="44" text-anchor="middle">subscribers</text><text class="sC" x="89" y="62" text-anchor="middle">1 row each</text>
<line class="sLm" x1="164" y1="47" x2="216" y2="115" marker-end="url(#ahm)"/>
<rect class="sB" x="14" y="90" width="150" height="54" rx="6"/><text class="sT" x="89" y="114" text-anchor="middle">recharges</text><text class="sC" x="89" y="132" text-anchor="middle">many rows each</text>
<line class="sLm" x1="164" y1="117" x2="216" y2="115" marker-end="url(#ahm)"/>
<rect class="sB" x="14" y="160" width="150" height="54" rx="6"/><text class="sT" x="89" y="184" text-anchor="middle">complaints</text><text class="sC" x="89" y="202" text-anchor="middle">many rows each</text>
<line class="sLm" x1="164" y1="187" x2="216" y2="115" marker-end="url(#ahm)"/>
<rect class="sV" x="220" y="86" width="170" height="60" rx="8"/><text class="sT" x="305" y="114" text-anchor="middle">aggregate per subscriber</text><text class="sC" x="305" y="130" text-anchor="middle">as of the cut-off</text>
<line class="sL" x1="390" y1="116" x2="430" y2="116" marker-end="url(#ah)"/>
<rect class="sA" x="434" y="22" width="160" height="28" rx="4"/><text class="sC" x="442" y="41">tenure_days</text><text class="sT" x="588" y="41" text-anchor="end">412</text>
<rect class="sA" x="434" y="54" width="160" height="28" rx="4"/><text class="sC" x="442" y="73">city (one-hot)</text><text class="sT" x="588" y="73" text-anchor="end">0 1 0</text>
<rect class="sA" x="434" y="86" width="160" height="28" rx="4"/><text class="sC" x="442" y="105">recharges_30d</text><text class="sT" x="588" y="105" text-anchor="end">4</text>
<rect class="sA" x="434" y="118" width="160" height="28" rx="4"/><text class="sC" x="442" y="137">spend_30d</text><text class="sT" x="588" y="137" text-anchor="end">210</text>
<rect class="sA" x="434" y="150" width="160" height="28" rx="4"/><text class="sC" x="442" y="169">days_since_recharge</text><text class="sT" x="588" y="169" text-anchor="end">3</text>
<rect class="sA" x="434" y="182" width="160" height="28" rx="4"/><text class="sC" x="442" y="201">complaints_30d</text><text class="sT" x="588" y="201" text-anchor="end">1</text>
<line class="sL" x1="594" y1="116" x2="630" y2="116" marker-end="url(#ah)"/><rect class="sG" x="634" y="91" width="72" height="50" rx="8"/><text class="sT" x="670" y="121" text-anchor="middle">model</text>
<text class="sC" x="514" y="222" text-anchor="middle">one row of numbers, same columns every time</text>
<circle class="sP" r="4" opacity="0"><animateMotion dur="9s" repeatCount="indefinite" calcMode="linear" keyPoints="0;0;1;1" keyTimes="0;0.000;0.120;1" path="M164 47 L216 115"/><animate attributeName="opacity" dur="9s" repeatCount="indefinite" values="0;0;1;1;0;0" keyTimes="0;0.000;0.002;0.120;0.122;1"/></circle>
<circle class="sPw" r="3" opacity="0"><animateMotion dur="9s" repeatCount="indefinite" calcMode="linear" keyPoints="0;0;1;1" keyTimes="0;0.030;0.130;1" path="M164 117 L216 115"/><animate attributeName="opacity" dur="9s" repeatCount="indefinite" values="0;0;1;1;0;0" keyTimes="0;0.028;0.032;0.130;0.132;1"/></circle>
<circle class="sPw" r="3" opacity="0"><animateMotion dur="9s" repeatCount="indefinite" calcMode="linear" keyPoints="0;0;1;1" keyTimes="0;0.090;0.190;1" path="M164 117 L216 115"/><animate attributeName="opacity" dur="9s" repeatCount="indefinite" values="0;0;1;1;0;0" keyTimes="0;0.088;0.092;0.190;0.192;1"/></circle>
<circle class="sPw" r="3" opacity="0"><animateMotion dur="9s" repeatCount="indefinite" calcMode="linear" keyPoints="0;0;1;1" keyTimes="0;0.150;0.250;1" path="M164 117 L216 115"/><animate attributeName="opacity" dur="9s" repeatCount="indefinite" values="0;0;1;1;0;0" keyTimes="0;0.148;0.152;0.250;0.252;1"/></circle>
<circle class="sPr" r="3" opacity="0"><animateMotion dur="9s" repeatCount="indefinite" calcMode="linear" keyPoints="0;0;1;1" keyTimes="0;0.050;0.170;1" path="M164 187 L216 115"/><animate attributeName="opacity" dur="9s" repeatCount="indefinite" values="0;0;1;1;0;0" keyTimes="0;0.048;0.052;0.170;0.172;1"/></circle>
<circle class="sPr" r="3" opacity="0"><animateMotion dur="9s" repeatCount="indefinite" calcMode="linear" keyPoints="0;0;1;1" keyTimes="0;0.130;0.250;1" path="M164 187 L216 115"/><animate attributeName="opacity" dur="9s" repeatCount="indefinite" values="0;0;1;1;0;0" keyTimes="0;0.128;0.132;0.250;0.252;1"/></circle>
<circle class="sPg" r="4" opacity="0"><animateMotion dur="9s" repeatCount="indefinite" calcMode="linear" keyPoints="0;0;1;1" keyTimes="0;0.360;0.440;1" path="M390 116 L430 116"/><animate attributeName="opacity" dur="9s" repeatCount="indefinite" values="0;0;1;1;0;0" keyTimes="0;0.358;0.362;0.440;0.442;1"/></circle>
<circle class="sPg" r="4" opacity="0"><animateMotion dur="9s" repeatCount="indefinite" calcMode="linear" keyPoints="0;0;1;1" keyTimes="0;0.560;0.640;1" path="M594 116 L630 116"/><animate attributeName="opacity" dur="9s" repeatCount="indefinite" values="0;0;1;1;0;0" keyTimes="0;0.558;0.562;0.640;0.642;1"/></circle>
</svg><figcaption>Feature engineering turns many messy tables into one tidy row per example. The model never sees anything else.</figcaption></figure>

Two rules govern everything that follows. Each row may only use information available **at its prediction time** ([[DS1.3]]). And anything **learned from data** (an imputation median, a scaling factor, a category's average target) must be learned from the **training rows only**, then reused unchanged on validation, test and production data. Break either rule and you have leakage ([[DS2.4]]).

## DS2.1 What good features look like 🟢 ⭐

A good feature carries signal about the target, is **available at prediction time**, is computed the **same way** in training and in production, and is robust to small data changes.

For churn-like problems, the strongest features usually describe **behaviour over time, relative to the customer's own history**:

| Family | Examples (as of the prediction time) |
|---|---|
| **Recency** | Days since last recharge, last order, last login |
| **Frequency** | Orders in the last 7, 30 and 90 days |
| **Monetary** | Spend in the last 30 days; average order value |
| **Trend** | Spend last 30 days ÷ spend previous 30 days; slope of weekly activity |
| **Engagement** | Distinct services used; app sessions per week |
| **Experience** | Complaints, failed payments, late deliveries, dropped calls in the last 30 days |
| **Tenure and lifecycle** | Days since sign-up; plan changes |
| **Context** | Region, device, acquisition channel, plan type |

<figure class="dia anim"><svg viewBox="0 0 720 218" role="img" aria-label="Animation: a subscriber's recharges over 90 days with 7, 30 and 90 day windows ending at the cut-off, and the recency, frequency, spend and trend features computed from them">
<line class="sLm" x1="46.8" y1="150" x2="480" y2="150" marker-end="url(#ahm)"/>
<circle class="sP" cx="102" cy="150" r="5.0"/>
<circle class="sP" cx="185" cy="150" r="5.0"/>
<circle class="sP" cx="263" cy="150" r="7.0"/>
<circle class="sP" cx="318" cy="150" r="5.0"/>
<circle class="sP" cx="350" cy="150" r="7.0"/>
<circle class="sP" cx="378" cy="150" r="5.0"/>
<circle class="sP" cx="415" cy="150" r="5.0"/>
<circle class="sP" cx="429" cy="150" r="3.8"/>
<circle class="sP" cx="447" cy="150" r="3.8"/>
<circle class="sP" cx="456" cy="150" r="3.8"/>
<text class="sC" x="56" y="172" text-anchor="middle">-90 d</text>
<text class="sC" x="194" y="172" text-anchor="middle">-60 d</text>
<text class="sC" x="332" y="172" text-anchor="middle">-30 d</text>
<text class="sC" x="470" y="172" text-anchor="middle">cut-off</text>
<rect class="sB" x="56" y="104" width="414" height="22" rx="4" opacity=".55"/><text class="sC" x="62" y="119">last 90 days</text>
<rect class="sA" x="332" y="74" width="138" height="22" rx="4" opacity=".55"/><text class="sC" x="338" y="89">last 30 days</text>
<rect class="sG" x="437.8" y="44" width="32.2" height="22" rx="4" opacity=".55"/><text class="sC" x="443.8" y="59">last 7 days</text>
<line class="sLr" x1="470" y1="30" x2="470" y2="160" stroke-width="2"/>
<rect class="sN" x="510" y="30" width="196" height="150" rx="8"/><text class="sT" x="608" y="50" text-anchor="middle">features at the cut-off</text>
<text class="sC" x="522" y="76">recency: 3 days</text>
<text class="sC" x="522" y="98">7d: 2 · 30d: 5 · 90d: 10</text>
<text class="sC" x="522" y="120">spend 30d: 260</text>
<text class="sC" x="522" y="142">trend: 260 ÷ 400 = 0.65</text>
<text class="sGt" x="522" y="164">→ slowing down</text>
<text class="sS" x="360" y="206" text-anchor="middle">dot size = recharge amount; each window ends exactly at the cut-off</text>
<circle class="sP" r="4" opacity="0"><animateMotion dur="12s" repeatCount="indefinite" calcMode="linear" keyPoints="0;0;1;1" keyTimes="0;0.030;0.300;1" path="M56 115 L470 115"/><animate attributeName="opacity" dur="12s" repeatCount="indefinite" values="0;0;1;1;0;0" keyTimes="0;0.028;0.032;0.300;0.302;1"/></circle>
<circle class="sPw" r="4" opacity="0"><animateMotion dur="12s" repeatCount="indefinite" calcMode="linear" keyPoints="0;0;1;1" keyTimes="0;0.350;0.500;1" path="M332 85 L470 85"/><animate attributeName="opacity" dur="12s" repeatCount="indefinite" values="0;0;1;1;0;0" keyTimes="0;0.348;0.352;0.500;0.502;1"/></circle>
<circle class="sPg" r="4" opacity="0"><animateMotion dur="12s" repeatCount="indefinite" calcMode="linear" keyPoints="0;0;1;1" keyTimes="0;0.550;0.620;1" path="M437.8 55 L470 55"/><animate attributeName="opacity" dur="12s" repeatCount="indefinite" values="0;0;1;1;0;0" keyTimes="0;0.548;0.552;0.620;0.622;1"/></circle>
</svg><figcaption>Several windows of the same behaviour, plus a ratio between them, capture "who is drifting away" better than any single total.</figcaption></figure>

> [!say]
> "For churn I'd build recency, frequency and spend features over several windows, ratios that capture a change in behaviour, like this month's usage compared with the previous month, and experience features like complaints or failed payments, all computed as of the prediction date so nothing from the future leaks in."

## DS2.2 Numeric features 🟢

| Technique | When |
|---|---|
| **Scaling** (standardisation, min-max) | Distance- and gradient-based models: k-NN, SVM, linear/logistic regression with regularisation, neural networks, PCA, k-means. **Trees and gradient-boosted trees don't need it** |
| **Log or Box-Cox transform** | Right-skewed money and count data, for linear models |
| **Robust scaling / clipping (winsorising)** | Outliers that would dominate a linear model |
| **Binning** | Explainability (age bands in a scorecard); otherwise often loses information |
| **Ratios and differences** | Domain knowledge: debt-to-income, usage change, price relative to category average |
| **Interactions** | For linear models; tree ensembles find many interactions themselves |

<figure class="dia anim"><svg viewBox="0 0 720 238" role="img" aria-label="Animation: a log transform, computed on 5,000 simulated monthly spends: the raw values have a long right tail with skewness 4.6; after log1p the distribution is a symmetric bump with skewness close to 0">
<text class="sM" x="180" y="22" text-anchor="middle">monthly spend: skewness 4.6</text>
<text class="sM" x="540" y="22" text-anchor="middle">log1p(spend): skewness 0.02</text>
<rect class="sW" x="30" y="92.8077" width="9" height="97.1923" rx="1" opacity=".85"/>
<rect class="sW" x="40" y="50" width="9" height="140" rx="1" opacity=".85"/>
<rect class="sW" x="50" y="87.2885" width="9" height="102.712" rx="1" opacity=".85"/>
<rect class="sW" x="60" y="114.346" width="9" height="75.6538" rx="1" opacity=".85"/>
<rect class="sW" x="70" y="138.038" width="9" height="51.9615" rx="1" opacity=".85"/>
<rect class="sW" x="80" y="147.058" width="9" height="42.9423" rx="1" opacity=".85"/>
<rect class="sW" x="90" y="156.346" width="9" height="33.6538" rx="1" opacity=".85"/>
<rect class="sW" x="100" y="168.462" width="9" height="21.5385" rx="1" opacity=".85"/>
<rect class="sW" x="110" y="171.019" width="9" height="18.9808" rx="1" opacity=".85"/>
<rect class="sW" x="120" y="174.115" width="9" height="15.8846" rx="1" opacity=".85"/>
<rect class="sW" x="130" y="179.769" width="9" height="10.2308" rx="1" opacity=".85"/>
<rect class="sW" x="140" y="179.365" width="9" height="10.6346" rx="1" opacity=".85"/>
<rect class="sW" x="150" y="183.538" width="9" height="6.46154" rx="1" opacity=".85"/>
<rect class="sW" x="160" y="183.673" width="9" height="6.32692" rx="1" opacity=".85"/>
<rect class="sW" x="170" y="184.75" width="9" height="5.25" rx="1" opacity=".85"/>
<rect class="sW" x="180" y="185.962" width="9" height="4.03846" rx="1" opacity=".85"/>
<rect class="sW" x="190" y="185.962" width="9" height="4.03846" rx="1" opacity=".85"/>
<rect class="sW" x="200" y="186.769" width="9" height="3.23077" rx="1" opacity=".85"/>
<rect class="sW" x="210" y="187.442" width="9" height="2.55769" rx="1" opacity=".85"/>
<rect class="sW" x="220" y="188.519" width="9" height="1.48077" rx="1" opacity=".85"/>
<rect class="sW" x="230" y="187.846" width="9" height="2.15385" rx="1" opacity=".85"/>
<rect class="sW" x="240" y="188.788" width="9" height="1.21154" rx="1" opacity=".85"/>
<rect class="sW" x="250" y="189.058" width="9" height="0.942308" rx="1" opacity=".85"/>
<rect class="sW" x="260" y="188.385" width="9" height="1.61538" rx="1" opacity=".85"/>
<rect class="sW" x="270" y="188.923" width="9" height="1.07692" rx="1" opacity=".85"/>
<rect class="sW" x="280" y="188.923" width="9" height="1.07692" rx="1" opacity=".85"/>
<rect class="sW" x="290" y="188.923" width="9" height="1.07692" rx="1" opacity=".85"/>
<rect class="sW" x="300" y="189.327" width="9" height="0.673077" rx="1" opacity=".85"/>
<rect class="sW" x="310" y="188.788" width="9" height="1.21154" rx="1" opacity=".85"/>
<rect class="sW" x="320" y="189.327" width="9" height="0.673077" rx="1" opacity=".85"/>
<line class="sLm" x1="30" y1="190" x2="330" y2="190"/>
<rect class="sG" x="390" y="190" width="9" height="0" rx="1" opacity=".85"/>
<rect class="sG" x="400" y="189.415" width="9" height="0.584551" rx="1" opacity=".85"/>
<rect class="sG" x="410" y="188.246" width="9" height="1.75365" rx="1" opacity=".85"/>
<rect class="sG" x="420" y="187.662" width="9" height="2.3382" rx="1" opacity=".85"/>
<rect class="sG" x="430" y="185.031" width="9" height="4.96868" rx="1" opacity=".85"/>
<rect class="sG" x="440" y="176.263" width="9" height="13.737" rx="1" opacity=".85"/>
<rect class="sG" x="450" y="173.34" width="9" height="16.6597" rx="1" opacity=".85"/>
<rect class="sG" x="460" y="155.219" width="9" height="34.7808" rx="1" opacity=".85"/>
<rect class="sG" x="470" y="146.159" width="9" height="43.8413" rx="1" opacity=".85"/>
<rect class="sG" x="480" y="127.453" width="9" height="62.547" rx="1" opacity=".85"/>
<rect class="sG" x="490" y="113.716" width="9" height="76.2839" rx="1" opacity=".85"/>
<rect class="sG" x="500" y="94.1336" width="9" height="95.8664" rx="1" opacity=".85"/>
<rect class="sG" x="510" y="73.6743" width="9" height="116.326" rx="1" opacity=".85"/>
<rect class="sG" x="520" y="69.2902" width="9" height="120.71" rx="1" opacity=".85"/>
<rect class="sG" x="530" y="59.3528" width="9" height="130.647" rx="1" opacity=".85"/>
<rect class="sG" x="540" y="50" width="9" height="140" rx="1" opacity=".85"/>
<rect class="sG" x="550" y="71.9207" width="9" height="118.079" rx="1" opacity=".85"/>
<rect class="sG" x="560" y="67.8288" width="9" height="122.171" rx="1" opacity=".85"/>
<rect class="sG" x="570" y="87.4113" width="9" height="102.589" rx="1" opacity=".85"/>
<rect class="sG" x="580" y="110.501" width="9" height="79.499" rx="1" opacity=".85"/>
<rect class="sG" x="590" y="126.868" width="9" height="63.1315" rx="1" opacity=".85"/>
<rect class="sG" x="600" y="148.497" width="9" height="41.5031" rx="1" opacity=".85"/>
<rect class="sG" x="610" y="159.896" width="9" height="30.1044" rx="1" opacity=".85"/>
<rect class="sG" x="620" y="173.925" width="9" height="16.0752" rx="1" opacity=".85"/>
<rect class="sG" x="630" y="176.848" width="9" height="13.1524" rx="1" opacity=".85"/>
<rect class="sG" x="640" y="183.57" width="9" height="6.43006" rx="1" opacity=".85"/>
<rect class="sG" x="650" y="187.077" width="9" height="2.92276" rx="1" opacity=".85"/>
<rect class="sG" x="660" y="187.37" width="9" height="2.63048" rx="1" opacity=".85"/>
<rect class="sG" x="670" y="188.831" width="9" height="1.1691" rx="1" opacity=".85"/>
<rect class="sG" x="680" y="189.708" width="9" height="0.292276" rx="1" opacity=".85"/>
<line class="sLm" x1="390" y1="190" x2="690" y2="190"/>
<text class="sC" x="30" y="206">0</text>
<text class="sC" x="330" y="206" text-anchor="end">EGP 2,500</text>
<text class="sC" x="390" y="206">log 2</text>
<text class="sC" x="690" y="206" text-anchor="end">log 9</text>
<text class="sS" x="360" y="228" text-anchor="middle">a long right tail squeezed into a symmetric bump: linear models and distances behave far better</text>
<circle class="sPw" r="3" opacity="0"><animateMotion dur="9s" repeatCount="indefinite" calcMode="linear" keyPoints="0;0;1;1" keyTimes="0;0.000;0.400;1" path="M30 196 L330 196"/><animate attributeName="opacity" dur="9s" repeatCount="indefinite" values="0;0;1;1;0;0" keyTimes="0;0.000;0.002;0.400;0.402;1"/></circle>
<circle class="sPg" r="3" opacity="0"><animateMotion dur="9s" repeatCount="indefinite" calcMode="linear" keyPoints="0;0;1;1" keyTimes="0;0.500;0.900;1" path="M390 196 L690 196"/><animate attributeName="opacity" dur="9s" repeatCount="indefinite" values="0;0;1;1;0;0" keyTimes="0;0.498;0.502;0.900;0.902;1"/></circle>
</svg><figcaption>Simulated with NumPy. Trees do not care about monotonic transforms; linear models, k-NN and neural networks do.</figcaption></figure>

## DS2.3 Categorical encoding 🟢 🟡 ⭐

| Encoding | How | Use | Watch out |
|---|---|---|---|
| **One-hot** | A 0/1 column per category | Low cardinality (city, plan type) | Explodes with many categories; handle unknown categories at prediction |
| **Ordinal** | Map ordered categories to integers | Ordered levels (bronze < silver < gold); fine for trees with any category | Implies an order for linear models |
| **Frequency / count** | Replace a category with how often it appears | High cardinality | Different categories with equal counts collide |
| **Target (mean) encoding** | Replace a category with the mean target for it | High cardinality (merchant ID, postcode) | **Leaks** unless computed out-of-fold and smoothed |
| **Native categorical support** | LightGBM, CatBoost and scikit-learn's HistGradientBoosting handle categories directly | Tree ensembles | CatBoost uses ordered target statistics to avoid leakage |
| **Embeddings** | Learned dense vectors | Very high cardinality in neural models | Needs data and training |

```python
from sklearn.preprocessing import TargetEncoder        # scikit-learn 1.3+: cross-fitted internally
enc = TargetEncoder(smooth="auto", cv=5)                # fit_transform uses out-of-fold means on the training data
```

> [!mistake] Target encoding fitted on all the data
> If each row's category mean includes **that row's own target**, the feature quietly contains the answer; validation scores soar and production disappoints. Use out-of-fold (cross-fitted) encoding with smoothing, and fit it only on training folds.

<figure class="dia"><svg viewBox="0 0 720 204" role="img" aria-label="One-hot encoding turns a city column into three 0/1 columns; target encoding replaces a merchant with its mean fraud rate, which leaks unless computed out of fold">
<text class="sM" x="172" y="20" text-anchor="middle">one-hot: a column per category</text>
<rect class="sN" x="14" y="30" width="70" height="24" rx="0"/><text class="sT" x="49" y="47" text-anchor="middle">city</text>
<rect class="sN" x="120" y="30" width="70" height="24" rx="0"/><text class="sT" x="155" y="47" text-anchor="middle">Cairo</text>
<rect class="sN" x="190" y="30" width="70" height="24" rx="0"/><text class="sT" x="225" y="47" text-anchor="middle">Giza</text>
<rect class="sN" x="260" y="30" width="70" height="24" rx="0"/><text class="sT" x="295" y="47" text-anchor="middle">Alex</text>
<rect class="sB" x="14" y="54" width="70" height="24" rx="0" opacity=".6"/><text class="sC" x="49" y="71" text-anchor="middle">Cairo</text>
<rect class="sA" x="120" y="54" width="70" height="24" rx="0" opacity=".6"/><text class="sT" x="155" y="71" text-anchor="middle">1</text>
<rect class="sN" x="190" y="54" width="70" height="24" rx="0"/><text class="sC" x="225" y="71" text-anchor="middle">0</text>
<rect class="sN" x="260" y="54" width="70" height="24" rx="0"/><text class="sC" x="295" y="71" text-anchor="middle">0</text>
<rect class="sB" x="14" y="78" width="70" height="24" rx="0" opacity=".6"/><text class="sC" x="49" y="95" text-anchor="middle">Giza</text>
<rect class="sN" x="120" y="78" width="70" height="24" rx="0"/><text class="sC" x="155" y="95" text-anchor="middle">0</text>
<rect class="sA" x="190" y="78" width="70" height="24" rx="0" opacity=".6"/><text class="sT" x="225" y="95" text-anchor="middle">1</text>
<rect class="sN" x="260" y="78" width="70" height="24" rx="0"/><text class="sC" x="295" y="95" text-anchor="middle">0</text>
<rect class="sB" x="14" y="102" width="70" height="24" rx="0" opacity=".6"/><text class="sC" x="49" y="119" text-anchor="middle">Alex</text>
<rect class="sN" x="120" y="102" width="70" height="24" rx="0"/><text class="sC" x="155" y="119" text-anchor="middle">0</text>
<rect class="sN" x="190" y="102" width="70" height="24" rx="0"/><text class="sC" x="225" y="119" text-anchor="middle">0</text>
<rect class="sA" x="260" y="102" width="70" height="24" rx="0" opacity=".6"/><text class="sT" x="295" y="119" text-anchor="middle">1</text>
<rect class="sB" x="14" y="126" width="70" height="24" rx="0" opacity=".6"/><text class="sC" x="49" y="143" text-anchor="middle">Giza</text>
<rect class="sN" x="120" y="126" width="70" height="24" rx="0"/><text class="sC" x="155" y="143" text-anchor="middle">0</text>
<rect class="sA" x="190" y="126" width="70" height="24" rx="0" opacity=".6"/><text class="sT" x="225" y="143" text-anchor="middle">1</text>
<rect class="sN" x="260" y="126" width="70" height="24" rx="0"/><text class="sC" x="295" y="143" text-anchor="middle">0</text>
<line class="sL" x1="86" y1="100" x2="116" y2="100" marker-end="url(#ah)"/>
<text class="sC" x="172" y="172" text-anchor="middle">explodes with 10,000 merchants</text>
<line class="sD" x1="350" y1="12" x2="350" y2="200"/>
<text class="sM" x="540" y="20" text-anchor="middle">target encoding: a category's mean label</text>
<rect class="sN" x="380" y="30" width="74" height="24" rx="0"/><text class="sT" x="417" y="47" text-anchor="middle">merchant</text>
<rect class="sN" x="454" y="30" width="56" height="24" rx="0"/><text class="sT" x="482" y="47" text-anchor="middle">fraud</text>
<rect class="sN" x="510" y="30" width="76" height="24" rx="0"/><text class="sT" x="548" y="47" text-anchor="middle">naive</text>
<rect class="sN" x="586" y="30" width="92" height="24" rx="0"/><text class="sT" x="632" y="47" text-anchor="middle">out-of-fold</text>
<rect class="sB" x="380" y="54" width="74" height="24" rx="0" opacity=".5"/><text class="sC" x="417" y="71" text-anchor="middle">M7</text>
<rect class="sB" x="454" y="54" width="56" height="24" rx="0" opacity=".5"/><text class="sC" x="482" y="71" text-anchor="middle">1</text>
<rect class="sR" x="510" y="54" width="76" height="24" rx="0" opacity=".5"/><text class="sC" x="548" y="71" text-anchor="middle">0.67</text>
<rect class="sG" x="586" y="54" width="92" height="24" rx="0" opacity=".5"/><text class="sC" x="632" y="71" text-anchor="middle">0.50</text>
<rect class="sB" x="380" y="78" width="74" height="24" rx="0" opacity=".5"/><text class="sC" x="417" y="95" text-anchor="middle">M7</text>
<rect class="sB" x="454" y="78" width="56" height="24" rx="0" opacity=".5"/><text class="sC" x="482" y="95" text-anchor="middle">0</text>
<rect class="sR" x="510" y="78" width="76" height="24" rx="0" opacity=".5"/><text class="sC" x="548" y="95" text-anchor="middle">0.67</text>
<rect class="sG" x="586" y="78" width="92" height="24" rx="0" opacity=".5"/><text class="sC" x="632" y="95" text-anchor="middle">1.00</text>
<rect class="sB" x="380" y="102" width="74" height="24" rx="0" opacity=".5"/><text class="sC" x="417" y="119" text-anchor="middle">M9</text>
<rect class="sB" x="454" y="102" width="56" height="24" rx="0" opacity=".5"/><text class="sC" x="482" y="119" text-anchor="middle">1</text>
<rect class="sR" x="510" y="102" width="76" height="24" rx="0" opacity=".5"/><text class="sC" x="548" y="119" text-anchor="middle">1.00</text>
<rect class="sG" x="586" y="102" width="92" height="24" rx="0" opacity=".5"/><text class="sC" x="632" y="119" text-anchor="middle">prior</text>
<rect class="sB" x="380" y="126" width="74" height="24" rx="0" opacity=".5"/><text class="sC" x="417" y="143" text-anchor="middle">M7</text>
<rect class="sB" x="454" y="126" width="56" height="24" rx="0" opacity=".5"/><text class="sC" x="482" y="143" text-anchor="middle">1</text>
<rect class="sR" x="510" y="126" width="76" height="24" rx="0" opacity=".5"/><text class="sC" x="548" y="143" text-anchor="middle">0.67</text>
<rect class="sG" x="586" y="126" width="92" height="24" rx="0" opacity=".5"/><text class="sC" x="632" y="143" text-anchor="middle">0.50</text>
<text class="sRt" x="540" y="172" text-anchor="middle">naive: each row's own label is inside its feature</text><text class="sGt" x="540" y="192" text-anchor="middle">out-of-fold: computed without it, shrunk to a prior</text>
</svg><figcaption>Encoding categories. Target encoding is powerful for high-cardinality columns and the easiest place to leak the label.</figcaption></figure>

## DS2.4 Data leakage, in all its forms ⭐

> [!term] Data leakage
> When information that **won't be available at prediction time** (often the answer itself, or data from the future, or from the test set) gets into training or evaluation. Offline scores look excellent; the deployed model performs much worse.

| Type | Example | Prevention |
|---|---|---|
| **Target leakage** | A churn model uses "cancellation reason", "account closed date" or "number of retention calls", which only exist **because** the customer churned | Ask for every feature: "would I know this at the prediction time?" Build features from data timestamped before the cut-off |
| **Train-test contamination** | Scaling, imputation, encoding or SMOTE **fitted on the full data** before splitting | Fit all preprocessing **inside a pipeline** on training folds only |
| **Temporal leakage** | A random split on time-ordered data: the model trains on December and is tested on November | **Time-based splits**: train on the past, validate on the future |
| **Group leakage** | The same customer (or patient, device, store) appears in both train and test, so the model memorises the entity | **Group k-fold** by customer ID |
| **Duplicate leakage** | Near-identical rows in train and test | Deduplicate before splitting |
| **Label-definition leakage** | The target window overlaps the feature window | Features end at the cut-off; the target window starts after it |
| **Tuning on the test set** | Choosing hyperparameters by test score | Tune on validation (cross-validation); touch the test set once |

**Signs of leakage:** a suspiciously high score (AUC 0.99 on a hard problem); one feature dominates importance; performance drops sharply on a later time period; a feature's meaning involves the outcome.

<figure class="dia anim"><svg viewBox="0 0 720 228" role="img" aria-label="Animation: the modelling workflow from raw data to test, with the points where target leakage, label overlap, temporal and group leakage, preprocessing contamination and tuning on the test set enter">
<rect class="sB" x="10" y="96" width="92" height="40" rx="8"/><text class="sT" x="56" y="121" text-anchor="middle">raw data</text>
<line class="sLm" x1="102" y1="116" x2="110" y2="116" marker-end="url(#ahm)"/>
<rect class="sB" x="111" y="96" width="92" height="40" rx="8"/><text class="sT" x="157" y="121" text-anchor="middle">features</text>
<line class="sLm" x1="203" y1="116" x2="211" y2="116" marker-end="url(#ahm)"/>
<rect class="sV" x="212" y="96" width="92" height="40" rx="8"/><text class="sT" x="258" y="121" text-anchor="middle">split</text>
<line class="sLm" x1="304" y1="116" x2="312" y2="116" marker-end="url(#ahm)"/>
<rect class="sV" x="313" y="96" width="92" height="40" rx="8"/><text class="sT" x="359" y="121" text-anchor="middle">preprocess</text>
<line class="sLm" x1="405" y1="116" x2="413" y2="116" marker-end="url(#ahm)"/>
<rect class="sA" x="414" y="96" width="92" height="40" rx="8"/><text class="sT" x="460" y="121" text-anchor="middle">train</text>
<line class="sLm" x1="506" y1="116" x2="514" y2="116" marker-end="url(#ahm)"/>
<rect class="sA" x="515" y="96" width="92" height="40" rx="8"/><text class="sT" x="561" y="121" text-anchor="middle">tune</text>
<line class="sLm" x1="607" y1="116" x2="615" y2="116" marker-end="url(#ahm)"/>
<rect class="sA" x="616" y="96" width="92" height="40" rx="8"/><text class="sT" x="662" y="121" text-anchor="middle">test</text>
<line class="sLr" x1="125" y1="62" x2="157" y2="94" marker-end="url(#ahr)"/><rect class="sR" x="15" y="16" width="220" height="44" rx="6" opacity=".85"/><text class="sT" x="125" y="34" text-anchor="middle">target leakage</text><text class="sC" x="125" y="51" text-anchor="middle">a cause-of-churn field</text>
<line class="sLr" x1="360" y1="62" x2="258" y2="94" marker-end="url(#ahr)"/><rect class="sR" x="250" y="16" width="220" height="44" rx="6" opacity=".85"/><text class="sT" x="360" y="34" text-anchor="middle">bad split</text><text class="sC" x="360" y="51" text-anchor="middle">time, customers or copies</text>
<line class="sLr" x1="125" y1="172" x2="157" y2="138" marker-end="url(#ahr)"/><rect class="sR" x="15" y="174" width="220" height="44" rx="6" opacity=".85"/><text class="sT" x="125" y="192" text-anchor="middle">label overlap</text><text class="sC" x="125" y="209" text-anchor="middle">windows cross the cut-off</text>
<line class="sLr" x1="360" y1="172" x2="359" y2="138" marker-end="url(#ahr)"/><rect class="sR" x="250" y="174" width="220" height="44" rx="6" opacity=".85"/><text class="sT" x="360" y="192" text-anchor="middle">contamination</text><text class="sC" x="360" y="209" text-anchor="middle">scaler fitted on all rows</text>
<line class="sLr" x1="595" y1="172" x2="561" y2="138" marker-end="url(#ahr)"/><rect class="sR" x="485" y="174" width="220" height="44" rx="6" opacity=".85"/><text class="sT" x="595" y="192" text-anchor="middle">tuning on test</text><text class="sC" x="595" y="209" text-anchor="middle">test score picks settings</text>
<circle class="sP" r="3" opacity="0"><animateMotion dur="10s" repeatCount="indefinite" calcMode="linear" keyPoints="0;0;1;1" keyTimes="0;0.000;0.850;1" path="M10 90 L708 90"/><animate attributeName="opacity" dur="10s" repeatCount="indefinite" values="0;0;1;1;0;0" keyTimes="0;0.000;0.002;0.850;0.852;1"/></circle>
<circle class="sPr" r="3" opacity="0"><animateMotion dur="10s" repeatCount="indefinite" calcMode="linear" keyPoints="0;0;1;1" keyTimes="0;0.080;0.150;1" path="M125 62 L157 94"/><animate attributeName="opacity" dur="10s" repeatCount="indefinite" values="0;0;1;1;0;0" keyTimes="0;0.078;0.082;0.150;0.152;1"/></circle>
<circle class="sPr" r="3" opacity="0"><animateMotion dur="10s" repeatCount="indefinite" calcMode="linear" keyPoints="0;0;1;1" keyTimes="0;0.280;0.350;1" path="M360 62 L258 94"/><animate attributeName="opacity" dur="10s" repeatCount="indefinite" values="0;0;1;1;0;0" keyTimes="0;0.278;0.282;0.350;0.352;1"/></circle>
<circle class="sPr" r="3" opacity="0"><animateMotion dur="10s" repeatCount="indefinite" calcMode="linear" keyPoints="0;0;1;1" keyTimes="0;0.420;0.490;1" path="M360 172 L359 138"/><animate attributeName="opacity" dur="10s" repeatCount="indefinite" values="0;0;1;1;0;0" keyTimes="0;0.418;0.422;0.490;0.492;1"/></circle>
<circle class="sPr" r="3" opacity="0"><animateMotion dur="10s" repeatCount="indefinite" calcMode="linear" keyPoints="0;0;1;1" keyTimes="0;0.660;0.730;1" path="M595 172 L561 138"/><animate attributeName="opacity" dur="10s" repeatCount="indefinite" values="0;0;1;1;0;0" keyTimes="0;0.658;0.662;0.730;0.732;1"/></circle>
<circle class="sPr" r="3" opacity="0"><animateMotion dur="10s" repeatCount="indefinite" calcMode="linear" keyPoints="0;0;1;1" keyTimes="0;0.120;0.190;1" path="M125 172 L157 138"/><animate attributeName="opacity" dur="10s" repeatCount="indefinite" values="0;0;1;1;0;0" keyTimes="0;0.118;0.122;0.190;0.192;1"/></circle>
</svg><figcaption>Each kind of leakage enters at a specific step. Knowing where makes the prevention obvious.</figcaption></figure>

> [!say]
> "Leakage is when the model sees information it won't have at prediction time, like a cancellation reason in a churn model, preprocessing fitted on the whole dataset, or future rows in a random split of time data. I prevent it by building features strictly before a cut-off date, putting all preprocessing inside a pipeline fitted on training folds, and validating on later time periods and with grouped splits by customer."

> [!story]
> Your capstone used imbalanced-learn and SMOTE. A sharp interviewer will ask **where** SMOTE was applied. The correct answer is inside the pipeline, on the training folds only (`imblearn.pipeline.Pipeline`), never on the full dataset before splitting; otherwise synthetic points built from test-set neighbours leak into training. *AI Journey* Part 4 covers this, and its "fit on train, transform everything" idea is the core of this module.

## DS2.5 Pipelines: preprocessing that can't leak 🟢 ⭐

```python
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import cross_val_score, TimeSeriesSplit

numeric = ["days_since_last_recharge", "spend_30d", "spend_change_ratio", "complaints_30d", "tenure_days"]
categorical = ["region", "plan_type", "device_os"]

preprocess = ColumnTransformer([
    ("num", Pipeline([("impute", SimpleImputer(strategy="median", add_indicator=True)),
                      ("scale", StandardScaler())]), numeric),
    ("cat", OneHotEncoder(handle_unknown="infrequent_if_exist", min_frequency=50), categorical),
])
model = Pipeline([("prep", preprocess), ("clf", LogisticRegression(max_iter=1000, class_weight="balanced"))])

scores = cross_val_score(model, X, y, cv=TimeSeriesSplit(n_splits=5), scoring="average_precision")
```

The **pipeline** is what you cross-validate, tune, save and deploy, so production applies exactly the same transformations, fitted on training data ([[DS8]]).

<figure class="dia steps"><svg viewBox="0 0 720 208" role="img" aria-label="A preprocessing pipeline fitted on the training split only and applied unchanged to the test split, contrasted with fitting on all rows before splitting">
<rect class="sN" x="14" y="30" width="692" height="28" rx="6"/><text class="sT" x="360" y="49" text-anchor="middle">10,000 rows</text>
<g data-s="1"><rect class="sA" x="14" y="30" width="500" height="28" rx="6"/><text class="sT" x="264" y="49" text-anchor="middle">train: 8,000</text><rect class="sR" x="524" y="30" width="182" height="28" rx="6" opacity=".8"/><text class="sT" x="615" y="49" text-anchor="middle">test: 2,000</text></g>
<g data-s="2"><line class="sLm" x1="264" y1="58" x2="264" y2="82" marker-end="url(#ahm)"/><rect class="sV" x="144" y="84" width="240" height="44" rx="6"/><text class="sC" x="264" y="102" text-anchor="middle">fit: median 42, mean 120, std 35</text><text class="sC" x="264" y="120" text-anchor="middle">learned from train rows only</text></g>
<g data-s="3"><line class="sLm" x1="144" y1="106" x2="90" y2="106" marker-end="url(#ahm)"/><rect class="sA" x="14" y="86" width="76" height="40" rx="8"/><text class="sT" x="52" y="111" text-anchor="middle">train'</text></g>
<g data-s="4"><line class="sLg" x1="384" y1="106" x2="610" y2="106" marker-end="url(#ahg)"/><line class="sLm" x1="615" y1="58" x2="615" y2="84" marker-end="url(#ahm)"/><rect class="sR" x="574" y="86" width="82" height="40" rx="8"/><text class="sT" x="615" y="111" text-anchor="middle">test'</text><text class="sGt" x="497" y="98" text-anchor="middle">same numbers, no refit</text></g>
<g data-s="5"><rect class="sR" x="14" y="150" width="692" height="46" rx="8" opacity=".3"/><text class="sRt" x="360" y="170" text-anchor="middle">✗ the wrong way: fit on all 10,000 rows, then split</text><text class="sC" x="360" y="188" text-anchor="middle">the mean and std now contain the test set: a small, real leak</text></g>
</svg><ol class="dia-steps">
<li>Split first. The test rows are locked away and stand in for future, unseen data.</li>
<li><code>fit</code> learns the preprocessing statistics (an imputation median, a scaling mean and standard deviation) from the training rows only.</li>
<li><code>transform</code> applies them to the training data.</li>
<li>The test data is transformed with the <b>same</b> learned numbers. Nothing is refitted on it, exactly as in production, where each new row arrives alone.</li>
<li>Fitting on everything before splitting lets test-set information shape the features. A <code>Pipeline</code> inside cross-validation makes this mistake impossible.</li>
</ol><figcaption>fit on train, transform everything. A scikit-learn Pipeline enforces it for every fold and every deployment.</figcaption></figure>

## DS2.6 Temporal features and point-in-time correctness 🟡 ⭐

Build a training table with **one row per entity per prediction date** (a "snapshot"), with features computed from data **before** that date and the label from **after** it:

```sql
-- One row per subscriber per weekly cut-off; features from the past 30/90 days, label from the next 30
WITH cutoffs AS (SELECT generate_series('2026-01-04'::date, '2026-06-28'::date, interval '7 days')::date AS cutoff)
SELECT s.subscriber_id, c.cutoff,
       COUNT(*) FILTER (WHERE r.recharge_at >= c.cutoff - 30 AND r.recharge_at < c.cutoff)          AS recharges_30d,
       SUM(r.amount) FILTER (WHERE r.recharge_at >= c.cutoff - 30 AND r.recharge_at < c.cutoff)     AS spend_30d,
       c.cutoff - MAX(r.recharge_at::date) FILTER (WHERE r.recharge_at < c.cutoff)                  AS days_since_last,
       (NOT EXISTS (SELECT 1 FROM activity a WHERE a.subscriber_id = s.subscriber_id
                    AND a.active_on >= c.cutoff AND a.active_on < c.cutoff + 30))::int              AS churned_next_30d
FROM subscribers s CROSS JOIN cutoffs c
LEFT JOIN recharges r ON r.subscriber_id = s.subscriber_id AND r.recharge_at < c.cutoff + 30
WHERE s.activated_at < c.cutoff
GROUP BY s.subscriber_id, c.cutoff;
```

Every feature filter ends at `< c.cutoff`; the label looks at `[cutoff, cutoff + 30)`.

> [!term] Point-in-time join
> Joining a slowly changing attribute (a customer's plan, a credit limit, a price) **as it was** at each snapshot date, not as it is today. Using today's value for past rows is quiet temporal leakage. Warehouses keep history with slowly changing dimensions ([[DE2.5]]); **feature stores** (Feast, Databricks Feature Store, Azure ML managed feature store) automate point-in-time correct joins and serve the same features online.

<figure class="dia anim"><svg viewBox="0 0 720 190" role="img" aria-label="Animation: a customer's plan history, Basic until March and Premium from April; a point-in-time join gives the February snapshot Basic, while joining today's value wrongly gives it Premium">
<text class="sT" x="185" y="24" text-anchor="middle">Jan</text>
<text class="sT" x="275" y="24" text-anchor="middle">Feb</text>
<text class="sT" x="365" y="24" text-anchor="middle">Mar</text>
<text class="sT" x="455" y="24" text-anchor="middle">Apr</text>
<text class="sT" x="545" y="24" text-anchor="middle">May</text>
<text class="sT" x="635" y="24" text-anchor="middle">Jun</text>
<text class="sC" x="130" y="50" text-anchor="end">plan history</text><rect class="sB" x="140" y="36" width="268" height="24" rx="4"/><text class="sT" x="275" y="53" text-anchor="middle">Basic</text><rect class="sV" x="410" y="36" width="270" height="24" rx="4"/><text class="sT" x="545" y="53" text-anchor="middle">Premium (upgraded 1 Apr)</text>
<line class="sLr" x1="230" y1="30" x2="230" y2="130" stroke-dasharray="4 3"/><text class="sRt" x="230" y="146" text-anchor="middle">snapshot 1 Feb</text>
<line class="sLr" x1="500" y1="30" x2="500" y2="130" stroke-dasharray="4 3"/><text class="sRt" x="500" y="146" text-anchor="middle">snapshot 1 May</text>
<text class="sC" x="130" y="90" text-anchor="end">as of each date</text><rect class="sG" x="170" y="76" width="120" height="22" rx="4"/><text class="sC" x="230" y="92" text-anchor="middle">Basic ✓</text><rect class="sG" x="440" y="76" width="120" height="22" rx="4"/><text class="sC" x="500" y="92" text-anchor="middle">Premium ✓</text>
<text class="sC" x="130" y="124" text-anchor="end">today's value</text><rect class="sR" x="170" y="110" width="120" height="22" rx="4"/><text class="sC" x="230" y="126" text-anchor="middle">Premium ✗</text><rect class="sG" x="440" y="110" width="120" height="22" rx="4" opacity=".6"/><text class="sC" x="500" y="126" text-anchor="middle">Premium</text>
<text class="sS" x="400" y="178" text-anchor="middle">the February row would learn from an upgrade that hadn't happened yet</text>
<circle class="sPw" r="3" opacity="0"><animateMotion dur="10s" repeatCount="indefinite" calcMode="linear" keyPoints="0;0;1;1" keyTimes="0;0.000;0.850;1" path="M140 30 L680 30"/><animate attributeName="opacity" dur="10s" repeatCount="indefinite" values="0;0;1;1;0;0" keyTimes="0;0.000;0.002;0.850;0.852;1"/></circle>
<circle class="sPg" r="4" opacity="0"><animateMotion dur="10s" repeatCount="indefinite" calcMode="linear" keyPoints="0;0;1;1" keyTimes="0;0.150;0.250;1" path="M230 60 L230 76"/><animate attributeName="opacity" dur="10s" repeatCount="indefinite" values="0;0;1;1;0;0" keyTimes="0;0.148;0.152;0.250;0.252;1"/></circle>
<circle class="sPr" r="4" opacity="0"><animateMotion dur="10s" repeatCount="indefinite" calcMode="linear" keyPoints="0;0;1;1" keyTimes="0;0.300;0.400;1" path="M230 98 L230 110"/><animate attributeName="opacity" dur="10s" repeatCount="indefinite" values="0;0;1;1;0;0" keyTimes="0;0.298;0.302;0.400;0.402;1"/></circle>
</svg><figcaption>Join slowly changing attributes as they were on each snapshot date: a valid-from / valid-to history table makes it a range join.</figcaption></figure>

> [!story]
> FinSight's forecasting used a **time shift**: forecasting from an earlier date and comparing against real data that arrived later. That's exactly the discipline of point-in-time evaluation, and a strong bridge from your engineering work to data science.

## DS2.7 Missing values and outliers in models 🟢

- Ask why values are missing; missingness is often a signal (no phone number given, no previous loan), so add a **missing indicator** (`add_indicator=True`).
- Impute inside the pipeline (median for skewed numerics, a constant "missing" category for categoricals).
- **Gradient-boosted trees** (XGBoost, LightGBM, HistGradientBoosting) handle missing values natively by learning which branch they go down.
- Outliers: investigate first (errors or genuine extremes?); then cap, transform, or use robust models and losses (MAE, Huber).

<figure class="dia anim"><svg viewBox="0 0 720 232" role="img" aria-label="Animation: imputing with a missing indicator: two missing incomes are filled with the median, 6,900, and a new 0 or 1 column income_missing records which rows were missing so the model can still use that fact">
<text class="sM" x="110" y="22" text-anchor="middle">income (raw)</text>
<text class="sM" x="380" y="22" text-anchor="middle">income (imputed)</text>
<text class="sM" x="600" y="22" text-anchor="middle">income_missing</text>
<rect class="sN" x="40" y="32" width="140" height="26" rx="3"/><text class="sC" x="110" y="50" text-anchor="middle">8,200</text>
<rect class="sN" x="310" y="32" width="140" height="26" rx="3"/><text class="sC" x="380" y="50" text-anchor="middle">8,200</text>
<rect class="sN" x="540" y="32" width="120" height="26" rx="3"/><text class="sC" x="600" y="50" text-anchor="middle">0</text>
<rect class="sR" x="40" y="62" width="140" height="26" rx="3"/><text class="sC" x="110" y="80" text-anchor="middle">NaN</text>
<rect class="sW" x="310" y="62" width="140" height="26" rx="3"/><text class="sC" x="380" y="80" text-anchor="middle">6,900</text>
<rect class="sV" x="540" y="62" width="120" height="26" rx="3"/><text class="sC" x="600" y="80" text-anchor="middle">1</text>
<rect class="sN" x="40" y="92" width="140" height="26" rx="3"/><text class="sC" x="110" y="110" text-anchor="middle">5,100</text>
<rect class="sN" x="310" y="92" width="140" height="26" rx="3"/><text class="sC" x="380" y="110" text-anchor="middle">5,100</text>
<rect class="sN" x="540" y="92" width="120" height="26" rx="3"/><text class="sC" x="600" y="110" text-anchor="middle">0</text>
<rect class="sR" x="40" y="122" width="140" height="26" rx="3"/><text class="sC" x="110" y="140" text-anchor="middle">NaN</text>
<rect class="sW" x="310" y="122" width="140" height="26" rx="3"/><text class="sC" x="380" y="140" text-anchor="middle">6,900</text>
<rect class="sV" x="540" y="122" width="120" height="26" rx="3"/><text class="sC" x="600" y="140" text-anchor="middle">1</text>
<rect class="sN" x="40" y="152" width="140" height="26" rx="3"/><text class="sC" x="110" y="170" text-anchor="middle">12,400</text>
<rect class="sN" x="310" y="152" width="140" height="26" rx="3"/><text class="sC" x="380" y="170" text-anchor="middle">12,400</text>
<rect class="sN" x="540" y="152" width="120" height="26" rx="3"/><text class="sC" x="600" y="170" text-anchor="middle">0</text>
<text class="sWt" x="245" y="196" text-anchor="middle">median</text>
<text class="sC" x="495" y="196" text-anchor="middle">flag</text>
<text class="sS" x="360" y="222" text-anchor="middle">the model keeps the fact that it was missing, which is often a signal in itself</text>
<circle class="sPw" r="4" opacity="0"><animateMotion dur="12s" repeatCount="indefinite" calcMode="linear" keyPoints="0;0;1;1" keyTimes="0;0.200;0.320;1" path="M180 75 L308 75"/><animate attributeName="opacity" dur="12s" repeatCount="indefinite" values="0;0;1;1;0;0" keyTimes="0;0.198;0.202;0.320;0.322;1"/></circle>
<circle class="sPv" r="4" opacity="0"><animateMotion dur="12s" repeatCount="indefinite" calcMode="linear" keyPoints="0;0;1;1" keyTimes="0;0.400;0.520;1" path="M450 75 L538 75"/><animate attributeName="opacity" dur="12s" repeatCount="indefinite" values="0;0;1;1;0;0" keyTimes="0;0.398;0.402;0.520;0.522;1"/></circle>
<circle class="sPw" r="4" opacity="0"><animateMotion dur="12s" repeatCount="indefinite" calcMode="linear" keyPoints="0;0;1;1" keyTimes="0;0.400;0.520;1" path="M180 135 L308 135"/><animate attributeName="opacity" dur="12s" repeatCount="indefinite" values="0;0;1;1;0;0" keyTimes="0;0.398;0.402;0.520;0.522;1"/></circle>
<circle class="sPv" r="4" opacity="0"><animateMotion dur="12s" repeatCount="indefinite" calcMode="linear" keyPoints="0;0;1;1" keyTimes="0;0.600;0.720;1" path="M450 135 L538 135"/><animate attributeName="opacity" dur="12s" repeatCount="indefinite" values="0;0;1;1;0;0" keyTimes="0;0.598;0.602;0.720;0.722;1"/></circle>
</svg><figcaption><code>SimpleImputer(strategy="median", add_indicator=True)</code>, fitted inside the pipeline on training rows only.</figcaption></figure>

## DS2.8 Imbalanced classes 🟢 ⭐

With 2% fraud or 5% churn, a model predicting "no" always is 95–98% accurate and useless.

<figure class="dia"><svg viewBox="0 0 720 160" role="img" aria-label="One hundred transactions with two frauds; a model that always predicts not fraud is 98 percent accurate and catches none">
<circle class="sP" cx="30" cy="30" r="6" opacity=".35"/>
<circle class="sP" cx="50" cy="30" r="6" opacity=".35"/>
<circle class="sP" cx="70" cy="30" r="6" opacity=".35"/>
<circle class="sP" cx="90" cy="30" r="6" opacity=".35"/>
<circle class="sP" cx="110" cy="30" r="6" opacity=".35"/>
<circle class="sP" cx="130" cy="30" r="6" opacity=".35"/>
<circle class="sP" cx="150" cy="30" r="6" opacity=".35"/>
<circle class="sP" cx="170" cy="30" r="6" opacity=".35"/>
<circle class="sP" cx="190" cy="30" r="6" opacity=".35"/>
<circle class="sP" cx="210" cy="30" r="6" opacity=".35"/>
<circle class="sP" cx="230" cy="30" r="6" opacity=".35"/>
<circle class="sP" cx="250" cy="30" r="6" opacity=".35"/>
<circle class="sP" cx="270" cy="30" r="6" opacity=".35"/>
<circle class="sP" cx="290" cy="30" r="6" opacity=".35"/>
<circle class="sP" cx="310" cy="30" r="6" opacity=".35"/>
<circle class="sP" cx="330" cy="30" r="6" opacity=".35"/>
<circle class="sP" cx="350" cy="30" r="6" opacity=".35"/>
<circle class="sP" cx="370" cy="30" r="6" opacity=".35"/>
<circle class="sP" cx="390" cy="30" r="6" opacity=".35"/>
<circle class="sP" cx="410" cy="30" r="6" opacity=".35"/>
<circle class="sP" cx="30" cy="52" r="6" opacity=".35"/>
<circle class="sP" cx="50" cy="52" r="6" opacity=".35"/>
<circle class="sP" cx="70" cy="52" r="6" opacity=".35"/>
<circle class="sP" cx="90" cy="52" r="6" opacity=".35"/>
<circle class="sP" cx="110" cy="52" r="6" opacity=".35"/>
<circle class="sP" cx="130" cy="52" r="6" opacity=".35"/>
<circle class="sP" cx="150" cy="52" r="6" opacity=".35"/>
<circle class="sPr" cx="170" cy="52" r="7"/>
<circle class="sP" cx="190" cy="52" r="6" opacity=".35"/>
<circle class="sP" cx="210" cy="52" r="6" opacity=".35"/>
<circle class="sP" cx="230" cy="52" r="6" opacity=".35"/>
<circle class="sP" cx="250" cy="52" r="6" opacity=".35"/>
<circle class="sP" cx="270" cy="52" r="6" opacity=".35"/>
<circle class="sP" cx="290" cy="52" r="6" opacity=".35"/>
<circle class="sP" cx="310" cy="52" r="6" opacity=".35"/>
<circle class="sP" cx="330" cy="52" r="6" opacity=".35"/>
<circle class="sP" cx="350" cy="52" r="6" opacity=".35"/>
<circle class="sP" cx="370" cy="52" r="6" opacity=".35"/>
<circle class="sP" cx="390" cy="52" r="6" opacity=".35"/>
<circle class="sP" cx="410" cy="52" r="6" opacity=".35"/>
<circle class="sP" cx="30" cy="74" r="6" opacity=".35"/>
<circle class="sP" cx="50" cy="74" r="6" opacity=".35"/>
<circle class="sP" cx="70" cy="74" r="6" opacity=".35"/>
<circle class="sP" cx="90" cy="74" r="6" opacity=".35"/>
<circle class="sP" cx="110" cy="74" r="6" opacity=".35"/>
<circle class="sP" cx="130" cy="74" r="6" opacity=".35"/>
<circle class="sP" cx="150" cy="74" r="6" opacity=".35"/>
<circle class="sP" cx="170" cy="74" r="6" opacity=".35"/>
<circle class="sP" cx="190" cy="74" r="6" opacity=".35"/>
<circle class="sP" cx="210" cy="74" r="6" opacity=".35"/>
<circle class="sP" cx="230" cy="74" r="6" opacity=".35"/>
<circle class="sP" cx="250" cy="74" r="6" opacity=".35"/>
<circle class="sP" cx="270" cy="74" r="6" opacity=".35"/>
<circle class="sP" cx="290" cy="74" r="6" opacity=".35"/>
<circle class="sP" cx="310" cy="74" r="6" opacity=".35"/>
<circle class="sP" cx="330" cy="74" r="6" opacity=".35"/>
<circle class="sP" cx="350" cy="74" r="6" opacity=".35"/>
<circle class="sP" cx="370" cy="74" r="6" opacity=".35"/>
<circle class="sP" cx="390" cy="74" r="6" opacity=".35"/>
<circle class="sP" cx="410" cy="74" r="6" opacity=".35"/>
<circle class="sP" cx="30" cy="96" r="6" opacity=".35"/>
<circle class="sP" cx="50" cy="96" r="6" opacity=".35"/>
<circle class="sP" cx="70" cy="96" r="6" opacity=".35"/>
<circle class="sP" cx="90" cy="96" r="6" opacity=".35"/>
<circle class="sP" cx="110" cy="96" r="6" opacity=".35"/>
<circle class="sP" cx="130" cy="96" r="6" opacity=".35"/>
<circle class="sP" cx="150" cy="96" r="6" opacity=".35"/>
<circle class="sP" cx="170" cy="96" r="6" opacity=".35"/>
<circle class="sP" cx="190" cy="96" r="6" opacity=".35"/>
<circle class="sP" cx="210" cy="96" r="6" opacity=".35"/>
<circle class="sP" cx="230" cy="96" r="6" opacity=".35"/>
<circle class="sP" cx="250" cy="96" r="6" opacity=".35"/>
<circle class="sP" cx="270" cy="96" r="6" opacity=".35"/>
<circle class="sPr" cx="290" cy="96" r="7"/>
<circle class="sP" cx="310" cy="96" r="6" opacity=".35"/>
<circle class="sP" cx="330" cy="96" r="6" opacity=".35"/>
<circle class="sP" cx="350" cy="96" r="6" opacity=".35"/>
<circle class="sP" cx="370" cy="96" r="6" opacity=".35"/>
<circle class="sP" cx="390" cy="96" r="6" opacity=".35"/>
<circle class="sP" cx="410" cy="96" r="6" opacity=".35"/>
<circle class="sP" cx="30" cy="118" r="6" opacity=".35"/>
<circle class="sP" cx="50" cy="118" r="6" opacity=".35"/>
<circle class="sP" cx="70" cy="118" r="6" opacity=".35"/>
<circle class="sP" cx="90" cy="118" r="6" opacity=".35"/>
<circle class="sP" cx="110" cy="118" r="6" opacity=".35"/>
<circle class="sP" cx="130" cy="118" r="6" opacity=".35"/>
<circle class="sP" cx="150" cy="118" r="6" opacity=".35"/>
<circle class="sP" cx="170" cy="118" r="6" opacity=".35"/>
<circle class="sP" cx="190" cy="118" r="6" opacity=".35"/>
<circle class="sP" cx="210" cy="118" r="6" opacity=".35"/>
<circle class="sP" cx="230" cy="118" r="6" opacity=".35"/>
<circle class="sP" cx="250" cy="118" r="6" opacity=".35"/>
<circle class="sP" cx="270" cy="118" r="6" opacity=".35"/>
<circle class="sP" cx="290" cy="118" r="6" opacity=".35"/>
<circle class="sP" cx="310" cy="118" r="6" opacity=".35"/>
<circle class="sP" cx="330" cy="118" r="6" opacity=".35"/>
<circle class="sP" cx="350" cy="118" r="6" opacity=".35"/>
<circle class="sP" cx="370" cy="118" r="6" opacity=".35"/>
<circle class="sP" cx="390" cy="118" r="6" opacity=".35"/>
<circle class="sP" cx="410" cy="118" r="6" opacity=".35"/>
<rect class="sN" x="440" y="22" width="266" height="90" rx="8"/><text class="sT" x="573" y="44" text-anchor="middle">model: always "not fraud"</text><text class="sGt" x="573" y="68" text-anchor="middle">accuracy 98%</text><text class="sRt" x="573" y="92" text-anchor="middle">recall 0%: catches nothing</text>
<text class="sC" x="220" y="148" text-anchor="middle">2 frauds in 100 transactions</text>
</svg><figcaption>With rare positives, accuracy rewards doing nothing. Measure what the business needs: frauds caught at a tolerable false-alarm rate.</figcaption></figure>

| Approach | Notes |
|---|---|
| **Use the right metrics** | PR-AUC (average precision), recall at a fixed precision, precision@k, cost-based metrics ([[DS4]]) |
| **Class weights** (`class_weight="balanced"`, `scale_pos_weight` in XGBoost) | Simple, often enough; keeps all data |
| **Threshold tuning** | The default 0.5 is rarely right; choose from costs or the action budget |
| **Resampling** (random undersampling, oversampling, **SMOTE**) | Only inside cross-validation on training folds; it can distort probabilities, so recalibrate if you need them |
| **More positive examples** | Longer history, better labels, sometimes worth more than any technique |

> [!say]
> "I start by choosing metrics that reflect the imbalance, like PR-AUC and recall at the precision we need, then use class weights and tune the decision threshold from the business costs. Resampling such as SMOTE only goes inside the pipeline on training folds, and if the business uses the probabilities, I recalibrate afterwards."

## DS2.9 Feature selection 🟡

- **Start from domain logic**; too many weak features add noise and maintenance cost.
- **Permutation importance** on a validation set: how much the score drops when a feature is shuffled. More reliable than tree "gain" importance, which favours high-cardinality features.
- **SHAP values** for direction and size of effects, globally and per prediction ([[DS4.6]]).
- **Correlated features** split importance between them; **VIF** checks multicollinearity for linear models (which your capstone used).
- L1 regularisation (Lasso) for sparse linear models; recursive feature elimination when features are expensive.
- Drop features that are unstable over time, unavailable in production, or legally sensitive.

<figure class="dia anim"><svg viewBox="0 0 720 232" role="img" aria-label="Animation: permutation importance computed for a gradient-boosting churn model: shuffling days since recharge costs 0.182 of AUC, tenure 0.030, complaints 0.023, while monthly spend and a random-noise column each cost only 0.008, so spend carries no more signal than noise">
<text class="sM" x="360" y="22" text-anchor="middle">permutation importance: AUC lost when one column is shuffled</text>
<text class="sC" x="200" y="58" text-anchor="end">days_since_recharge</text><rect class="sG" x="210" y="40" width="437.981" height="24" rx="3" opacity=".85"/><text class="sC" x="653.981" y="58">0.182</text>
<text class="sC" x="200" y="92" text-anchor="end">tenure_months</text><rect class="sG" x="210" y="74" width="70.9361" height="24" rx="3" opacity=".85"/><text class="sC" x="286.936" y="92">0.030</text>
<text class="sC" x="200" y="126" text-anchor="end">complaints_30d</text><rect class="sG" x="210" y="108" width="55.8593" height="24" rx="3" opacity=".85"/><text class="sC" x="271.859" y="126">0.023</text>
<text class="sC" x="200" y="160" text-anchor="end">monthly_spend</text><rect class="sN" x="210" y="142" width="18.4352" height="24" rx="3" opacity=".85"/><text class="sC" x="234.435" y="160">0.008</text>
<text class="sC" x="200" y="194" text-anchor="end">random_noise</text><rect class="sN" x="210" y="176" width="18.2353" height="24" rx="3" opacity=".85"/><text class="sC" x="234.235" y="194">0.008</text>
<text class="sS" x="360" y="222" text-anchor="middle">monthly spend scores the same as pure noise: it carries no signal here, so it is a candidate to drop</text>
<circle class="sPw" r="3" opacity="0"><animateMotion dur="10s" repeatCount="indefinite" calcMode="linear" keyPoints="0;0;1;1" keyTimes="0;0.050;0.170;1" path="M210 52 L647.9814376039062 52"/><animate attributeName="opacity" dur="10s" repeatCount="indefinite" values="0;0;1;1;0;0" keyTimes="0;0.048;0.052;0.170;0.172;1"/></circle>
<circle class="sPw" r="3" opacity="0"><animateMotion dur="10s" repeatCount="indefinite" calcMode="linear" keyPoints="0;0;1;1" keyTimes="0;0.200;0.320;1" path="M210 86 L280.9361050385517 86"/><animate attributeName="opacity" dur="10s" repeatCount="indefinite" values="0;0;1;1;0;0" keyTimes="0;0.198;0.202;0.320;0.322;1"/></circle>
<circle class="sPw" r="3" opacity="0"><animateMotion dur="10s" repeatCount="indefinite" calcMode="linear" keyPoints="0;0;1;1" keyTimes="0;0.350;0.470;1" path="M210 120 L265.8592853433869 120"/><animate attributeName="opacity" dur="10s" repeatCount="indefinite" values="0;0;1;1;0;0" keyTimes="0;0.348;0.352;0.470;0.472;1"/></circle>
<circle class="sPw" r="3" opacity="0"><animateMotion dur="10s" repeatCount="indefinite" calcMode="linear" keyPoints="0;0;1;1" keyTimes="0;0.500;0.620;1" path="M210 154 L228.4351559738713 154"/><animate attributeName="opacity" dur="10s" repeatCount="indefinite" values="0;0;1;1;0;0" keyTimes="0;0.498;0.502;0.620;0.622;1"/></circle>
<circle class="sPw" r="3" opacity="0"><animateMotion dur="10s" repeatCount="indefinite" calcMode="linear" keyPoints="0;0;1;1" keyTimes="0;0.650;0.770;1" path="M210 188 L228.23530695151698 188"/><animate attributeName="opacity" dur="10s" repeatCount="indefinite" values="0;0;1;1;0;0" keyTimes="0;0.648;0.652;0.770;0.772;1"/></circle>
</svg><figcaption>Computed with scikit-learn on synthetic data where churn depends on recharge recency, complaints and tenure only. Score importance on held-out data, and add a random column as a reference line.</figcaption></figure>

## DS2.10 Other feature types, briefly 🟢

- **Dates:** day of week, month, holidays and Ramadan flags, days to payday or month end (in Egypt, many salaries arrive near month end), cyclical encoding (sine and cosine) for linear models.
- **Geography:** governorate or zone; distances (to the nearest store, branch or hub); population density; avoid raw latitude/longitude in linear models.
- **Text:** TF-IDF or embeddings of complaint text and product descriptions ([[DS7]]).
- **Aggregations over related entities:** a merchant's fraud rate (out-of-fold!), a store's average basket.

> [!lab] Find the leak
> Build a churn snapshot table from any subscription dataset (the Telco Customer Churn dataset on Kaggle is common, or simulate with the snapshot SQL above). Train a gradient-boosted model twice: (1) with a deliberately leaky feature (something only known after churn) and preprocessing fitted on all data with a random split; (2) properly, with a pipeline, cut-off features and a time-based split. Compare the scores and the feature importances, and write down how you'd have spotted the leak. That's a memorable interview story.

## DS2.11 Interview drill 🟢 ⭐

| Question | Strong short answer |
|---|---|
| What is data leakage? | Information unavailable at prediction time reaching training or evaluation, inflating offline scores. |
| Give three kinds of leakage. | Target leakage (post-outcome features), contamination (preprocessing fitted on all data), temporal (random splits on time data); also group leakage. |
| How do you prevent leakage? | Features strictly before a cut-off, preprocessing inside a pipeline fitted on training folds, time-based and grouped validation. |
| Your AUC is 0.99. What do you check? | Features that encode the outcome, preprocessing fitted on all data, time or group leakage, duplicates; look at the top features. |
| Do tree models need scaling? | No. Splits depend on order, not scale. |
| How do you encode a high-cardinality categorical? | Out-of-fold, smoothed target encoding; frequency encoding; native categorical handling in LightGBM or CatBoost; embeddings for neural nets. |
| Why use pipelines? | Preprocessing is fitted only on training data in each fold, and the same transformations ship to production. |
| How do you handle imbalance? | Proper metrics, class weights, threshold tuning; resampling only inside CV; recalibrate if probabilities matter. |
| What's a point-in-time join? | Joining attributes as they were at each snapshot date, not today's values. |
| Permutation vs gain importance? | Permutation measures the score drop on validation data; gain is biased toward high-cardinality features. |
| What features would you build for churn? | Recency, frequency, monetary over several windows, behaviour change ratios, experience signals, tenure and context. |

## Key takeaways

> [!check]
> - Ask of every feature: would I know this at prediction time?
> - Build snapshot tables: features before the cut-off, labels after it.
> - All preprocessing, encoding and resampling lives inside the pipeline.
> - Validate the way the model will be used: by time and by entity.
> - Behavioural features relative to a customer's own history usually beat raw attributes.

## Sources

- scikit-learn user guide: [Common pitfalls and recommended practices (data leakage)](https://scikit-learn.org/stable/common_pitfalls.html), [Pipelines and composite estimators](https://scikit-learn.org/stable/modules/compose.html), [TargetEncoder](https://scikit-learn.org/stable/modules/preprocessing.html#target-encoder), [Permutation importance](https://scikit-learn.org/stable/modules/permutation_importance.html), [Cross-validation iterators (TimeSeriesSplit, GroupKFold)](https://scikit-learn.org/stable/modules/cross_validation.html#cross-validation-iterators).
- imbalanced-learn: [Pipeline and resampling](https://imbalanced-learn.org/stable/common_pitfalls.html).
- Shachar Kaufman et al., "Leakage in Data Mining: Formulation, Detection, and Avoidance" (*ACM TKDD*, 2012).
- Feast: [Point-in-time joins](https://docs.feast.dev/getting-started/concepts/point-in-time-joins).
- Kaggle: [Telco Customer Churn](https://www.kaggle.com/datasets/blastchar/telco-customer-churn).
- Your *AI Journey* Part 4 (cleaning, preprocessing, leakage-free pipelines).
