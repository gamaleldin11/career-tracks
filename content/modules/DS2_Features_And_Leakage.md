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

<figure class="dia"><svg viewBox="0 0 720 234" role="img" aria-label="Raw subscriber, recharge and complaint tables aggregated per subscriber as of a cut-off into one row of numeric features that the model reads">
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

<figure class="dia"><svg viewBox="0 0 720 218" role="img" aria-label="A subscriber's recharges over 90 days with 7, 30 and 90 day windows ending at the cut-off, and the recency, frequency, spend and trend features computed from them">
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

<figure class="dia"><svg viewBox="0 0 720 228" role="img" aria-label="The modelling workflow from raw data to test, with the points where target leakage, label overlap, temporal and group leakage, preprocessing contamination and tuning on the test set enter">
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

<figure class="dia"><svg viewBox="0 0 720 190" role="img" aria-label="A customer's plan history, Basic until March and Premium from April; a point-in-time join gives the February snapshot Basic, while joining today's value wrongly gives it Premium">
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
</svg><figcaption>Join slowly changing attributes as they were on each snapshot date: a valid-from / valid-to history table makes it a range join.</figcaption></figure>

> [!story]
> FinSight's forecasting used a **time shift**: forecasting from an earlier date and comparing against real data that arrived later. That's exactly the discipline of point-in-time evaluation, and a strong bridge from your engineering work to data science.

## DS2.7 Missing values and outliers in models 🟢

- Ask why values are missing; missingness is often a signal (no phone number given, no previous loan), so add a **missing indicator** (`add_indicator=True`).
- Impute inside the pipeline (median for skewed numerics, a constant "missing" category for categoricals).
- **Gradient-boosted trees** (XGBoost, LightGBM, HistGradientBoosting) handle missing values natively by learning which branch they go down.
- Outliers: investigate first (errors or genuine extremes?); then cap, transform, or use robust models and losses (MAE, Huber).

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
