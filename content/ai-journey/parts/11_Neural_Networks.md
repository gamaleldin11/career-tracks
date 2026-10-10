# Part 11 — Neural Networks

<!-- nav -->
> [!example] 🧭 Step 14 of 26 · Stage 4 of 7: Applied ML
> ← [Part 10 · NLP & Arabic](10_NLP.md) · [Part 13 · Capstone](13_Capstone_Road_Accidents.md) → · [Course map](00_START_HERE.md)
<!-- /nav -->

**Source:** `code/Assignments/ANN/` — `README.md`, `main.py`, `preprocess.py`, `train.py`, `experminet.ipynb`, `requirement.txt`, `artifacts/{model.keras, preprocessor.joblib, metrics.txt}`

This assignment is the only deep-learning content in the course, and it is notable for a different reason: **it is the only piece of work that is a proper Python project rather than a notebook.** Separate modules, an entry point, environment configuration, saved artifacts, TensorBoard logging. Given your software background, this is the shape all your ML work should take once it leaves the exploration phase.

> # Churn Prediction using ANN (Keras)
>
> Steps:
> - load churn dataset
> - Preprocess data (Numerical + Categorical)
> - Train ANN using Keras
> - Use EarlyStopping + TensorBoard
> - Save Artifacts

<!-- interview-focus -->

> [!tip] 🎯 Interview focus
> **Why it matters:** Entry roles ask for concepts (neurons, activations, backprop, overfitting controls); mid roles expect you to write a PyTorch training loop.
>
> | Level | What you should be able to do |
> |---|---|
> | 🟢 **Entry** | The perceptron → MLP, activation functions, backprop in plain words, loss functions, dropout and early stopping, when not to use a neural network on tabular data. |
> | 🟡 **Mid** | Write the PyTorch loop from memory (`train()`/`eval()`, `zero_grad`, `backward`, `step`); DataLoaders; correct metric aggregation; Optuna tuning; saving and loading. |
> | 🔴 **Senior** | Custom architectures (Wide & Deep, multi-task), `torch.compile`, deployment formats (TorchScript/ONNX), training at scale. |
>
> **⭐ Most-asked:** *Why do we need non-linear activations?* · *Explain backpropagation.* · *Walk me through a PyTorch training step.* · *Why does `CrossEntropyLoss` take logits?* · *Neural network vs gradient boosting on tabular churn data?*
>
> **⏱ Time:** 5 h  ·  **Short on time?** Read §11.7, §11.9, §11.11, §11.13, §11.16.

**Legend:** 🟢 Entry (0–2 yrs) · 🟡 Mid (2–5 yrs) · 🔴 Senior / specialist · ⭐ frequently asked · 📖 Géron, *Hands-On ML with Scikit-Learn and PyTorch* (2025) pages

> [!abstract]- 🗺️ Section map — level and book pages
>
> | § | Section | Level | 📖 Book |
> |---|---|:---:|---|
> | 11.1 | The project structure | 🟢 | — |
> | 11.2 | `main.py` — the orchestration | 🟢 | — |
> | 11.3 | `preprocess.py` | 🟢 | — |
> | 11.4 | `train.py` — the network | 🟢 ⭐ | Ch. 11, Ch. 4 · p. 407, p. 166 |
> | 11.5 | Training | 🟢 ⭐ | — |
> | 11.6 | Evaluation and the results | 🟢 ⭐ | — |
> | 11.7 | When to use a neural network on tabular data | 🟡 ⭐ | — |
> | 11.8 | Keras vs PyTorch | 🟢 | — |
> | 11.9 | Neural networks from first principles | 🟢 ⭐ | Ch. 9 · pp. 285–313 |
> | 11.10 | PyTorch fundamentals | 🟡 | Ch. 10 · pp. 318–327 |
> | 11.11 | From linear regression to an MLP in PyTorch | 🟡 ⭐ | Ch. 10 · pp. 327–340 |
> | 11.12 | Custom modules: Wide & Deep, multiple inputs and outputs | 🟡 | Ch. 10 · pp. 340–346 |
> | 11.13 | Classification in PyTorch, and the loss functions | 🟡 ⭐ | Ch. 10 · pp. 346–352 |
> | 11.14 | Hyperparameter tuning with Optuna | 🟡 | Ch. 10 · pp. 352–356 |
> | 11.15 | Saving, loading and compiling PyTorch models | 🟡 | Ch. 10 · pp. 356–360 |
> | 11.16 | Interview drill — neural networks and PyTorch | 🟢 ⭐ | Ch. 9, Ch. 10 · p. 313, p. 360 |
>

---

## 11.1 The project structure 🟢

```
ANN/
├── README.md            # setup instructions
├── requirement.txt      # pinned dependencies
├── __init__.py          # makes it a package
├── main.py              # entry point: orchestration only
├── preprocess.py        # builds the sklearn ColumnTransformer
├── train.py             # model definition + training + evaluation
├── data/                # Churn_Modelling.csv
└── artifacts/
    ├── model.keras
    ├── preprocessor.joblib
    └── metrics.txt
```

**Why this matters more than the model.** A notebook is a scratchpad: hidden state, out-of-order execution, no reuse, no tests, terrible diffs in git. A module structure gives you importable functions, a reproducible entry point, and code review that works.

The separation is also principled — each module has one job:

- `preprocess.py` — **data → features.** Knows nothing about models.
- `train.py` — **features → trained model.** Knows nothing about CSVs.
- `main.py` — **orchestration.** Wires them together and owns the I/O.

That is the same layering you would use for a service: repository, domain logic, controller.

```bash
conda create -n churn_ann python==3.10 -y
conda activate churn_ann
pip install -r requirements.txt
```

A dedicated environment per project. Deep learning stacks are notoriously version-sensitive — TensorFlow, CUDA, cuDNN and NumPy all have to agree — and a shared global environment will eventually break.

---

## 11.2 `main.py` — the orchestration 🟢

```python
import os, joblib, pandas as pd
from dotenv import load_dotenv
from sklearn.model_selection import train_test_split
from preprocess import preprocessor_func
from train import train_and_evaluate

load_dotenv()
DATA_PATH = os.getenv("DATA_PATH", "data/Churn_Modelling.csv")
```

**Configuration via environment variables with a sane fallback.** `python-dotenv` reads a `.env` file, so paths and secrets are not hard-coded. This is standard practice in web development and rare in ML code — a good habit brought across.

(For your FinSight work this pattern matters more: `.env` for API keys, `.env` in `.gitignore`, and a `.env.example` committed as documentation. See the note in `06_Sensitive_Files.md` of the device catalog about `credentials.md` sitting in plain text.)

```python
if not os.path.exists(DATA_PATH):
    raise FileNotFoundError(f"DATA_PATH not found: {DATA_PATH}")

df = pd.read_csv(DATA_PATH)

if "Exited" not in df.columns:
    raise KeyError("Target column 'Exited' not found in dataset.")
```

**Defensive checks that fail loudly and early**, with messages that say what went wrong. Note this uses `raise`, not `assert` — correct, per §1.3, because a missing file is an expected runtime condition, not an impossible internal state.

```python
drop_cols = [c for c in ["RowNumber", "CustomerId", "Surname"] if c in df.columns]
if drop_cols:
    df = df.drop(columns=drop_cols)

target = "Exited"          # Exited = 1 means churn
X = df.drop(columns=[target])
y = df[target].astype(int)
```

Identifiers dropped, for the reasons in §7.3. The list comprehension guards against a column already being absent.

### The three-way split

```python
X_trainval, X_test, y_trainval, y_test = train_test_split(
    X, y, test_size=0.15, random_state=42, stratify=y)

X_train, X_val, y_train, y_val = train_test_split(
    X_trainval, y_trainval, test_size=0.1765,   # ~15% of full dataset
    random_state=42, stratify=y_trainval)
```

70 / 15 / 15, with `stratify` at both levels. The `0.1765` is deliberate: 0.1765 × 0.85 ≈ 0.15 of the original.

<figure class="dia"><svg viewBox="0 0 720 252" role="img" aria-label="Splitting 10,000 rows 70 / 15 / 15: the first split seals 1,500 test rows, the second takes 17.65 percent of the remaining 8,500, which is 1,500 validation rows, leaving 7,000 for training">
<text class="sM" x="14" y="22">Churn_Modelling: 10,000 rows</text>
<rect class="sN" x="30" y="30" width="660" height="30" rx="4"/><text class="sC" x="360" y="50" text-anchor="middle">all rows</text>
<text class="sS" x="14" y="84">split 1: test_size=0.15</text>
<rect class="sB" x="30" y="92" width="561" height="30" rx="4"/><text class="sC" x="310.5" y="112" text-anchor="middle">train + val  8,500</text>
<rect class="sR" x="591" y="92" width="99" height="30" rx="4" opacity=".7"/><text class="sT" x="640.5" y="112" text-anchor="middle">test 1,500</text>
<text class="sS" x="14" y="146">split 2 on the 8,500: test_size=0.1765</text>
<rect class="sG" x="30" y="154" width="462" height="30" rx="4" opacity=".7"/><text class="sT" x="261" y="174" text-anchor="middle">train 7,000 (70%)</text>
<rect class="sW" x="492" y="154" width="99" height="30" rx="4" opacity=".7"/><text class="sT" x="541.5" y="174" text-anchor="middle">val 1,500</text>
<rect class="sR" x="591" y="154" width="99" height="30" rx="4" opacity=".35"/><text class="sS" x="640.5" y="174" text-anchor="middle">sealed</text>
<text class="sGt" x="261" y="204" text-anchor="middle">fits the weights, every batch</text>
<text class="sWt" x="541.5" y="204" text-anchor="middle">every epoch</text><text class="sWt" x="541.5" y="220" text-anchor="middle">early stopping</text>
<text class="sRt" x="640.5" y="204" text-anchor="middle">once, at the end</text>
<text class="sS" x="360" y="240" text-anchor="middle">0.1765 × 8,500 ≈ 1,500: the second split takes 15% of the original from what is left; stratify=y at both levels</text>
</svg><figcaption>The three-way split behind §11.2, computed: who touches which set, and how often.</figcaption></figure>

**Why three sets here, when the other notebooks used two?** Because neural networks need a validation set *during* training — for early stopping and for watching the loss curves. That set is consulted every epoch, so it cannot also serve as the final honest estimate. The test set stays sealed until the end. See §4.5.

### Fit on train only

```python
preprocessor = preprocessor_func(X_train)
X_train_p = preprocessor.fit_transform(X_train)
X_val_p   = preprocessor.transform(X_val)
X_test_p  = preprocessor.transform(X_test)
```

`fit_transform` on train, `transform` on the other two. The leakage rule, applied correctly.

```python
if hasattr(X_train_p, "toarray"):
    X_train_p = X_train_p.toarray()
    X_val_p   = X_val_p.toarray()
    X_test_p  = X_test_p.toarray()
```

`OneHotEncoder` returns a sparse matrix; Keras wants dense. The `hasattr` check makes this work whether the encoder returned sparse or dense — a small defensive touch.

```python
os.makedirs("artifacts", exist_ok=True)
joblib.dump(preprocessor, "artifacts/preprocessor.joblib")
```

⚠️ **Note the one structural weakness of this project**: the preprocessor and the model are saved as *two separate artifacts*. Unlike the sklearn projects in Parts 7–9, they are not one pipeline object, so at inference time you must load both and apply them in the right order. That is the exact drift risk §7.12 warned about.

The fix, if you revisit this: `scikeras` wraps a Keras model in the sklearn estimator API, letting you put it inside a real `Pipeline`. Or wrap the two loads in a single `Predictor` class with one `predict()` method.

---

## 11.3 `preprocess.py` 🟢

```python
def preprocessor_func(x: pd.DataFrame) -> ColumnTransformer:
    """
    - Numeric : impute median + scale
    - Catg : impute most_frequent + OH
    """
    numeric_cols = x.select_dtypes(include='number').columns.tolist()
    catg_cols = x.select_dtypes(include=['object', 'category', 'bool']).columns.tolist()

    num_pipe = Pipeline(steps=[
        ('imputer', SimpleImputer(strategy='median')),
        ('scaler',  StandardScaler())
    ])

    cat_pipe = Pipeline(steps=[
        ('imputer', SimpleImputer(strategy='most_frequent')),
        ('onehot',  OneHotEncoder(handle_unknown='ignore'))
    ])

    preprocessor = ColumnTransformer(transformers=[
        ('num', num_pipe, numeric_cols),
        ('cat', cat_pipe, catg_cols)
    ], remainder='drop')

    return preprocessor
```

The same `ColumnTransformer` from Part 4, extracted into a typed, documented function. Nothing new — which is the point. **The preprocessing does not change because the model changed.**

`StandardScaler` is not optional here. Neural networks are gradient-based, and unscaled inputs produce the ill-conditioned loss surface described in §6.3. An unscaled network will train slowly, or not at all.

---

## 11.4 `train.py` — the network 🟢 ⭐

> [!info] 📖 Géron Ch. 11 · “Dropout” p. 407; Ch. 4 · “Early Stopping” p. 166

```python
import tensorflow as tf
keras = tf.keras

def ann_keras(input_dim: int):
    '''
    Simple ANN:
        I/P --> Dense(64) --> Dropout --> Dense(32) --> Dropout --> O/P(Sigmoid)
    '''
    model = keras.Sequential([
        keras.layers.Input(shape=(input_dim,)),
        keras.layers.Dense(64, activation='relu'),
        keras.layers.Dropout(0.25),
        keras.layers.Dense(32, activation='relu'),
        keras.layers.Dropout(0.25),
        keras.layers.Dense(1, activation='sigmoid')
    ])

    model.compile(
        optimizer=keras.optimizers.Adam(learning_rate=0.001),
        loss="binary_crossentropy",
        metrics=[keras.metrics.BinaryAccuracy(name='accuracy'),
                 keras.metrics.AUC(name='auc')]
    )
    return model
```

### What a Dense layer is

A `Dense(64)` layer computes:

> **output = activation(W·x + b)**

<figure class="dia"><svg viewBox="0 0 720 224" role="img" aria-label="One neuron: three inputs multiplied by weights, summed with a bias, passed through ReLU to give the output">
<rect class="sB" x="14" y="34" width="130" height="40" rx="6"/><text class="sC" x="79" y="51" text-anchor="middle">tenure</text><text class="sT" x="79" y="67" text-anchor="middle">x = 0.8</text>
<line class="sLm" x1="144" y1="54" x2="296" y2="110" marker-end="url(#ahm)"/><text class="sWt" x="214" y="75.2" text-anchor="middle">w = -0.6</text>
<rect class="sB" x="14" y="94" width="130" height="40" rx="6"/><text class="sC" x="79" y="111" text-anchor="middle">complaints</text><text class="sT" x="79" y="127" text-anchor="middle">x = 2.0</text>
<line class="sLm" x1="144" y1="114" x2="296" y2="110" marker-end="url(#ahm)"/><text class="sWt" x="214" y="108.2" text-anchor="middle">w = 0.9</text>
<rect class="sB" x="14" y="154" width="130" height="40" rx="6"/><text class="sC" x="79" y="171" text-anchor="middle">spend</text><text class="sT" x="79" y="187" text-anchor="middle">x = -0.5</text>
<line class="sLm" x1="144" y1="174" x2="296" y2="110" marker-end="url(#ahm)"/><text class="sWt" x="214" y="141.2" text-anchor="middle">w = 0.4</text>
<rect class="sV" x="300" y="80" width="120" height="60" rx="30"/><text class="sT" x="360" y="106" text-anchor="middle">Σ wx + b</text><text class="sC" x="360" y="124" text-anchor="middle">z = 0.82</text>
<text class="sWt" x="360" y="162" text-anchor="middle">b = -0.3</text>
<line class="sL" x1="420" y1="110" x2="466" y2="110" marker-end="url(#ah)"/><rect class="sA" x="470" y="86" width="110" height="48" rx="8"/><text class="sT" x="525" y="108" text-anchor="middle">ReLU</text><text class="sC" x="525" y="124" text-anchor="middle">max(0, z)</text>
<line class="sL" x1="580" y1="110" x2="616" y2="110" marker-end="url(#ah)"/><rect class="sG" x="620" y="86" width="86" height="48" rx="8"/><text class="sT" x="663" y="115" text-anchor="middle">0.82</text>
<text class="sS" x="360" y="212" text-anchor="middle">a Dense(64) layer is 64 of these side by side: one weight row each, all computed as one matrix product</text>
</svg><figcaption>One neuron, with numbers: 0.8×(−0.6) + 2.0×0.9 + (−0.5)×0.4 − 0.3 = 0.82, and ReLU keeps it.</figcaption></figure>

where `W` is a `(input_dim, 64)` weight matrix and `b` a length-64 bias vector. That is 64 dot products — §2.8 again, at scale. Every "neuron" is one row of `W` producing one number.

The parameter count for this network, given say 12 input features after encoding:

| Layer | Weights | Biases | Total |
|---|---:|---:|---:|
| Dense(64) | 12 × 64 = 768 | 64 | 832 |
| Dense(32) | 64 × 32 = 2,048 | 32 | 2,080 |
| Dense(1) | 32 × 1 = 32 | 1 | 33 |
| **Total** | | | **2,945** |

`model.summary()` prints this. Worth running: it makes the model concrete, and parameter count relative to dataset size is your first overfitting warning.

### ReLU

> **ReLU(x) = max(0, x)**

**Why an activation function at all?** Without one, stacking linear layers is pointless — the composition of linear maps is itself linear, so a 10-layer linear network has exactly the expressive power of a single layer. **The non-linearity is what makes depth mean something.**

**Why ReLU specifically**, over the sigmoid or tanh that older networks used:

- Its derivative is 1 for positive inputs — no *vanishing gradient*. Sigmoid saturates at both ends, where the derivative approaches 0 and learning stalls. This was the practical barrier to deep networks before ~2011.
- It is trivially cheap: a comparison and a select.
- It produces sparse activations (all negatives become exactly 0), which helps.

Its failure mode is the **dying ReLU**: a neuron whose weights push it permanently negative outputs 0 forever and its gradient is 0, so it never recovers. Variants (LeakyReLU, ELU, GELU) address this with a small negative slope. GELU is what transformers use.

### Sigmoid on the output

One output neuron with a sigmoid gives `P(churn) ∈ (0,1)` — identical to logistic regression's final step (§8.5). Indeed **a network with no hidden layers and a sigmoid output *is* logistic regression.** The hidden layers are what add the ability to learn non-linear feature interactions.

The output layer is determined by the task:

| Task | Output layer | Loss |
|---|---|---|
| Binary classification | `Dense(1, activation='sigmoid')` | `binary_crossentropy` |
| Multi-class (k classes) | `Dense(k, activation='softmax')` | `categorical_crossentropy` |
| Regression | `Dense(1)` — no activation | `mse` or `mae` |

Getting this pairing wrong is the most common beginner error in Keras.

### Dropout

```python
keras.layers.Dropout(0.25)
```

During **training only**, randomly set 25% of the layer's outputs to zero on each forward pass. At inference, nothing is dropped (activations are scaled to compensate).

**Why this regularises.** The network cannot rely on any single neuron always being present, so it must learn redundant, distributed representations. It is also interpretable as training an exponentially large ensemble of sub-networks that share weights and averaging them at test time.

<figure class="dia"><svg viewBox="0 0 720 244" role="img" aria-label="Dropout: on each training step a different random subset of hidden units is switched off; at inference every unit is used">
<text class="sM" x="114" y="22" text-anchor="middle">training step 1</text><circle class="sB" cx="44" cy="46" r="10"/><circle class="sB" cx="44" cy="76" r="10"/><circle class="sB" cx="44" cy="106" r="10"/><circle class="sB" cx="44" cy="136" r="10"/><circle class="sB" cx="44" cy="166" r="10"/><circle class="sB" cx="44" cy="196" r="10"/><circle class="sV" cx="184" cy="46" r="10"/><line class="sLm" x1="54" y1="46" x2="174" y2="46" opacity=".35"/><line class="sLm" x1="54" y1="76" x2="174" y2="46" opacity=".35"/><line class="sLm" x1="54" y1="106" x2="174" y2="46" opacity=".35"/><line class="sLm" x1="54" y1="136" x2="174" y2="46" opacity=".35"/><line class="sLm" x1="54" y1="166" x2="174" y2="46" opacity=".35"/><line class="sLm" x1="54" y1="196" x2="174" y2="46" opacity=".35"/><circle class="sN" cx="184" cy="76" r="10"/><text class="sRt" x="184" y="81" text-anchor="middle">×</text><circle class="sV" cx="184" cy="106" r="10"/><line class="sLm" x1="54" y1="46" x2="174" y2="106" opacity=".35"/><line class="sLm" x1="54" y1="76" x2="174" y2="106" opacity=".35"/><line class="sLm" x1="54" y1="106" x2="174" y2="106" opacity=".35"/><line class="sLm" x1="54" y1="136" x2="174" y2="106" opacity=".35"/><line class="sLm" x1="54" y1="166" x2="174" y2="106" opacity=".35"/><line class="sLm" x1="54" y1="196" x2="174" y2="106" opacity=".35"/><circle class="sV" cx="184" cy="136" r="10"/><line class="sLm" x1="54" y1="46" x2="174" y2="136" opacity=".35"/><line class="sLm" x1="54" y1="76" x2="174" y2="136" opacity=".35"/><line class="sLm" x1="54" y1="106" x2="174" y2="136" opacity=".35"/><line class="sLm" x1="54" y1="136" x2="174" y2="136" opacity=".35"/><line class="sLm" x1="54" y1="166" x2="174" y2="136" opacity=".35"/><line class="sLm" x1="54" y1="196" x2="174" y2="136" opacity=".35"/><circle class="sN" cx="184" cy="166" r="10"/><text class="sRt" x="184" y="171" text-anchor="middle">×</text><circle class="sV" cx="184" cy="196" r="10"/><line class="sLm" x1="54" y1="46" x2="174" y2="196" opacity=".35"/><line class="sLm" x1="54" y1="76" x2="174" y2="196" opacity=".35"/><line class="sLm" x1="54" y1="106" x2="174" y2="196" opacity=".35"/><line class="sLm" x1="54" y1="136" x2="174" y2="196" opacity=".35"/><line class="sLm" x1="54" y1="166" x2="174" y2="196" opacity=".35"/><line class="sLm" x1="54" y1="196" x2="174" y2="196" opacity=".35"/>
<text class="sM" x="350" y="22" text-anchor="middle">training step 2</text><circle class="sB" cx="280" cy="46" r="10"/><circle class="sB" cx="280" cy="76" r="10"/><circle class="sB" cx="280" cy="106" r="10"/><circle class="sB" cx="280" cy="136" r="10"/><circle class="sB" cx="280" cy="166" r="10"/><circle class="sB" cx="280" cy="196" r="10"/><circle class="sN" cx="420" cy="46" r="10"/><text class="sRt" x="420" y="51" text-anchor="middle">×</text><circle class="sV" cx="420" cy="76" r="10"/><line class="sLm" x1="290" y1="46" x2="410" y2="76" opacity=".35"/><line class="sLm" x1="290" y1="76" x2="410" y2="76" opacity=".35"/><line class="sLm" x1="290" y1="106" x2="410" y2="76" opacity=".35"/><line class="sLm" x1="290" y1="136" x2="410" y2="76" opacity=".35"/><line class="sLm" x1="290" y1="166" x2="410" y2="76" opacity=".35"/><line class="sLm" x1="290" y1="196" x2="410" y2="76" opacity=".35"/><circle class="sV" cx="420" cy="106" r="10"/><line class="sLm" x1="290" y1="46" x2="410" y2="106" opacity=".35"/><line class="sLm" x1="290" y1="76" x2="410" y2="106" opacity=".35"/><line class="sLm" x1="290" y1="106" x2="410" y2="106" opacity=".35"/><line class="sLm" x1="290" y1="136" x2="410" y2="106" opacity=".35"/><line class="sLm" x1="290" y1="166" x2="410" y2="106" opacity=".35"/><line class="sLm" x1="290" y1="196" x2="410" y2="106" opacity=".35"/><circle class="sN" cx="420" cy="136" r="10"/><text class="sRt" x="420" y="141" text-anchor="middle">×</text><circle class="sV" cx="420" cy="166" r="10"/><line class="sLm" x1="290" y1="46" x2="410" y2="166" opacity=".35"/><line class="sLm" x1="290" y1="76" x2="410" y2="166" opacity=".35"/><line class="sLm" x1="290" y1="106" x2="410" y2="166" opacity=".35"/><line class="sLm" x1="290" y1="136" x2="410" y2="166" opacity=".35"/><line class="sLm" x1="290" y1="166" x2="410" y2="166" opacity=".35"/><line class="sLm" x1="290" y1="196" x2="410" y2="166" opacity=".35"/><circle class="sV" cx="420" cy="196" r="10"/><line class="sLm" x1="290" y1="46" x2="410" y2="196" opacity=".35"/><line class="sLm" x1="290" y1="76" x2="410" y2="196" opacity=".35"/><line class="sLm" x1="290" y1="106" x2="410" y2="196" opacity=".35"/><line class="sLm" x1="290" y1="136" x2="410" y2="196" opacity=".35"/><line class="sLm" x1="290" y1="166" x2="410" y2="196" opacity=".35"/><line class="sLm" x1="290" y1="196" x2="410" y2="196" opacity=".35"/>
<text class="sM" x="586" y="22" text-anchor="middle">inference: all on</text><circle class="sB" cx="516" cy="46" r="10"/><circle class="sB" cx="516" cy="76" r="10"/><circle class="sB" cx="516" cy="106" r="10"/><circle class="sB" cx="516" cy="136" r="10"/><circle class="sB" cx="516" cy="166" r="10"/><circle class="sB" cx="516" cy="196" r="10"/><circle class="sV" cx="656" cy="46" r="10"/><line class="sLm" x1="526" y1="46" x2="646" y2="46" opacity=".35"/><line class="sLm" x1="526" y1="76" x2="646" y2="46" opacity=".35"/><line class="sLm" x1="526" y1="106" x2="646" y2="46" opacity=".35"/><line class="sLm" x1="526" y1="136" x2="646" y2="46" opacity=".35"/><line class="sLm" x1="526" y1="166" x2="646" y2="46" opacity=".35"/><line class="sLm" x1="526" y1="196" x2="646" y2="46" opacity=".35"/><circle class="sV" cx="656" cy="76" r="10"/><line class="sLm" x1="526" y1="46" x2="646" y2="76" opacity=".35"/><line class="sLm" x1="526" y1="76" x2="646" y2="76" opacity=".35"/><line class="sLm" x1="526" y1="106" x2="646" y2="76" opacity=".35"/><line class="sLm" x1="526" y1="136" x2="646" y2="76" opacity=".35"/><line class="sLm" x1="526" y1="166" x2="646" y2="76" opacity=".35"/><line class="sLm" x1="526" y1="196" x2="646" y2="76" opacity=".35"/><circle class="sV" cx="656" cy="106" r="10"/><line class="sLm" x1="526" y1="46" x2="646" y2="106" opacity=".35"/><line class="sLm" x1="526" y1="76" x2="646" y2="106" opacity=".35"/><line class="sLm" x1="526" y1="106" x2="646" y2="106" opacity=".35"/><line class="sLm" x1="526" y1="136" x2="646" y2="106" opacity=".35"/><line class="sLm" x1="526" y1="166" x2="646" y2="106" opacity=".35"/><line class="sLm" x1="526" y1="196" x2="646" y2="106" opacity=".35"/><circle class="sV" cx="656" cy="136" r="10"/><line class="sLm" x1="526" y1="46" x2="646" y2="136" opacity=".35"/><line class="sLm" x1="526" y1="76" x2="646" y2="136" opacity=".35"/><line class="sLm" x1="526" y1="106" x2="646" y2="136" opacity=".35"/><line class="sLm" x1="526" y1="136" x2="646" y2="136" opacity=".35"/><line class="sLm" x1="526" y1="166" x2="646" y2="136" opacity=".35"/><line class="sLm" x1="526" y1="196" x2="646" y2="136" opacity=".35"/><circle class="sV" cx="656" cy="166" r="10"/><line class="sLm" x1="526" y1="46" x2="646" y2="166" opacity=".35"/><line class="sLm" x1="526" y1="76" x2="646" y2="166" opacity=".35"/><line class="sLm" x1="526" y1="106" x2="646" y2="166" opacity=".35"/><line class="sLm" x1="526" y1="136" x2="646" y2="166" opacity=".35"/><line class="sLm" x1="526" y1="166" x2="646" y2="166" opacity=".35"/><line class="sLm" x1="526" y1="196" x2="646" y2="166" opacity=".35"/><circle class="sV" cx="656" cy="196" r="10"/><line class="sLm" x1="526" y1="46" x2="646" y2="196" opacity=".35"/><line class="sLm" x1="526" y1="76" x2="646" y2="196" opacity=".35"/><line class="sLm" x1="526" y1="106" x2="646" y2="196" opacity=".35"/><line class="sLm" x1="526" y1="136" x2="646" y2="196" opacity=".35"/><line class="sLm" x1="526" y1="166" x2="646" y2="196" opacity=".35"/><line class="sLm" x1="526" y1="196" x2="646" y2="196" opacity=".35"/>
<text class="sS" x="360" y="232" text-anchor="middle">a different 25–50% of units switched off on every training step; none switched off at prediction time</text>
</svg><figcaption>Dropout forces redundancy: no unit can count on any particular neighbour being there.</figcaption></figure>

Typical rates: 0.2–0.5. Higher for large networks on small data. The 0.25 here is conservative and appropriate for a 3,000-parameter model on 10,000 rows.

⚠️ Dropout behaves differently in training and inference mode. Keras handles this automatically; if you ever write a manual PyTorch loop, forgetting `model.eval()` is a classic bug that makes your validation scores mysteriously noisy.

### Adam

```python
optimizer=keras.optimizers.Adam(learning_rate=0.001)
```

**Adaptive Moment Estimation** — gradient descent (§6.3) with two refinements:

1. **Momentum** — it accumulates an exponentially-weighted average of past gradients, so it keeps moving through flat regions and damps oscillation in ravines.
2. **Per-parameter learning rates** — it tracks the average squared gradient per parameter and scales each step accordingly. Parameters with consistently small gradients get larger steps.

The practical effect is that Adam works well with almost no tuning, which is why it is the default choice. `0.001` is its standard learning rate and a sensible starting point.

(SGD with momentum and a tuned schedule can beat Adam on large vision models. For tabular data of this size, Adam is right.)

### Binary cross-entropy

> **L = −(1/n) Σ [ yᵢ log(ŷᵢ) + (1 − yᵢ) log(1 − ŷᵢ) ]**

Same loss as logistic regression, for the same reason (§8.5): it is convex in the output layer, and its gradient does not vanish when the model is confidently wrong.

### Tracking AUC as a metric

```python
metrics=[keras.metrics.BinaryAccuracy(name='accuracy'),
         keras.metrics.AUC(name='auc')]
```

Tracking AUC alongside accuracy is a deliberate, correct choice for this dataset — the churn classes are roughly 80/20, so accuracy alone would be misleading. And it sets up the early-stopping criterion below.

---

## 11.5 Training 🟢 ⭐

```python
def train_and_evaluate(x_train, y_train, x_val, y_val, x_test, y_test, run_name='run_1'):
    os.makedirs('artifacts', exist_ok=True)
    os.makedirs('runs', exist_ok=True)

    input_dim = x_train.shape[1]
    model = ann_keras(input_dim)
    log_dir = os.path.join('runs', run_name)

    callbacks = [
        keras.callbacks.TensorBoard(log_dir=log_dir),
        keras.callbacks.EarlyStopping(
            monitor='val_auc',
            patience=7,
            restore_best_weights=True,
            mode='max'
        )
    ]

    model.fit(x_train, y_train,
              validation_data=(x_val, y_val),
              epochs=50, batch_size=64,
              callbacks=callbacks, verbose=2)
```

### Early stopping — the most important callback

Neural networks overfit with training time. Typically training loss falls monotonically while validation loss falls, bottoms out, and then rises. Early stopping watches the validation metric and halts when it stops improving.

Each argument:

| Argument | Meaning |
|---|---|
| `monitor='val_auc'` | Watch validation **AUC** — the right choice here, not accuracy, given the imbalance |
| `patience=7` | Allow 7 epochs of no improvement before stopping. Validation metrics are noisy; stopping on the first bad epoch is too twitchy |
| `restore_best_weights=True` | **Roll back to the best epoch's weights.** Without this you keep the final, worse model |
| `mode='max'` | Higher AUC is better. (Would be `'min'` for loss) |

`restore_best_weights=True` is the one people forget, and without it early stopping does half its job.

<figure class="dia"><svg viewBox="0 0 720 228" role="img" aria-label="Early stopping: training loss keeps falling while validation loss reaches a minimum and rises; training stops after seven epochs without improvement and the best weights are restored">
<line class="sLm" x1="70" y1="200" x2="678" y2="200" marker-end="url(#ahm)"/><line class="sLm" x1="70" y1="200" x2="70" y2="18" marker-end="url(#ahm)"/>
<polyline class="sL" points="70.0,18.0 82.0,30.9 94.0,42.7 106.0,53.7 118.0,63.7 130.0,72.9 142.0,81.4 154.0,89.2 166.0,96.4 178.0,103.1 190.0,109.1 202.0,114.7 214.0,119.9 226.0,124.6 238.0,129.0 250.0,133.0 262.0,136.7 274.0,140.1 286.0,143.2 298.0,146.1 310.0,148.8 322.0,151.2 334.0,153.4 346.0,155.5 358.0,157.4 370.0,159.1 382.0,160.7 394.0,162.2 406.0,163.6 418.0,164.8 430.0,166.0 442.0,167.0 454.0,168.0 466.0,168.9 478.0,169.7 490.0,170.5 502.0,171.2 514.0,171.8 526.0,172.4 538.0,172.9 550.0,173.4 562.0,173.9 574.0,174.3 586.0,174.7 598.0,175.1 610.0,175.4 622.0,175.7 634.0,176.0 646.0,176.2 658.0,176.5 670.0,176.7" fill="none" stroke-width="2.5"/><polyline class="sLr" points="70.0,12.8 82.0,25.7 94.0,37.5 106.0,48.5 118.0,58.5 130.0,67.7 142.0,76.2 154.0,84.0 166.0,91.2 178.0,97.9 190.0,103.9 202.0,109.5 214.0,114.7 226.0,119.4 238.0,123.8 250.0,127.8 262.0,131.5 274.0,134.9 286.0,138.0 298.0,140.9 310.0,143.6 322.0,146.0 334.0,148.1 346.0,150.1 358.0,151.8 370.0,153.3 382.0,154.7 394.0,155.9 406.0,156.9 418.0,157.7 430.0,158.4 442.0,159.0 454.0,159.4 466.0,159.7 478.0,159.9 490.0,160.0 502.0,160.0 514.0,159.9 526.0,159.6 538.0,159.3 550.0,158.9 562.0,158.4 574.0,157.8 586.0,157.1 598.0,156.4 610.0,155.6 622.0,154.7 634.0,153.7 646.0,152.7 658.0,151.6 670.0,150.4" fill="none" stroke-width="2.5"/>
<line class="sLg" x1="490" y1="200" x2="490" y2="34" stroke-dasharray="5 4"/><text class="sGt" x="490" y="28" text-anchor="middle">best epoch 35: weights restored</text>
<rect class="sW" x="490" y="44" width="84" height="156" rx="0" opacity=".18"/><text class="sWt" x="532" y="190.8" text-anchor="middle">patience 7</text>
<text class="sC" x="658" y="192.701" text-anchor="end">training loss</text><text class="sRt" x="658" y="142.441" text-anchor="end">validation loss</text>
<text class="sC" x="370" y="218" text-anchor="middle">epochs</text>
</svg><figcaption>Early stopping watches the validation curve, waits out the patience window, then rolls back to the best epoch.</figcaption></figure>

🐛 The code comment says `# 'min' because we want to minimize loss` while the argument is `mode='max'`. The code is right — you maximise AUC — and the comment is a leftover from a version that monitored loss. Worth noting, since a stale comment is worse than none.

### TensorBoard

```python
keras.callbacks.TensorBoard(log_dir=log_dir)
# tensorboard --logdir runs
```

Logs loss and metrics per epoch to disk, viewable in a browser. **Look at the curves, not just the final number.** They tell you which failure you have:

| Curve shape | Diagnosis |
|---|---|
| Train ↓, val ↓, converging together | Healthy |
| Train ↓, val ↑ after epoch N | Overfitting from epoch N — early stopping should catch it |
| Both flat and high | Underfitting — bigger model, better features, higher learning rate |
| Loss spikes to NaN | Learning rate far too high |
| Very noisy validation curve | Batch or validation set too small |

Naming runs (`run_name='churn_ann_demo'`) puts them in separate subdirectories so TensorBoard can overlay several experiments on one axis. That is how you compare hyperparameters honestly.

### Epochs and batch size

- **`epochs=50`** — up to 50 passes over the training data. Early stopping usually cuts it short, so setting this generously is correct.
- **`batch_size=64`** — mini-batch gradient descent (§6.3). Larger batches give smoother gradients and better hardware utilisation; smaller batches add regularising noise and use less memory. Powers of two by convention (32, 64, 128, 256).

One epoch here is ⌈7000/64⌉ ≈ 110 gradient updates.

---

## 11.6 Evaluation and the results 🟢 ⭐

```python
y_prob = model.predict(x_test).reshape(-1)
y_pred = (y_prob >= 0.5).astype(int)

auc    = roc_auc_score(y_test, y_prob)
cm     = confusion_matrix(y_test, y_pred)
report = classification_report(y_test, y_pred)

model.save('artifacts/model.keras')
with open('artifacts/metrics.txt', 'w', encoding='utf-8') as f:
    f.write(f'Test ROC-AUC: {auc:.2f}\n')
    f.write(f'Confusion Matrix: {cm}\n')
    f.write(f'Classification Report: {report}\n')
```

Note `(y_prob >= 0.5).astype(int)` — the threshold made **explicit**, rather than hidden inside a `predict()` call. That is better style, and it makes it obvious where you would change it.

### The actual results

```
Test ROC-AUC: 0.86
Confusion Matrix: [[1153   41]
                   [ 161  145]]
              precision    recall  f1-score   support
           0       0.88      0.97      0.92      1194
           1       0.78      0.47      0.59       306
    accuracy                           0.87      1500
   macro avg       0.83      0.72      0.75      1500
weighted avg       0.86      0.87      0.85      1500
```

<figure class="dia"><svg viewBox="0 0 720 266" role="img" aria-label="The churn model's confusion matrix: 1,153 true negatives, 41 false positives, 161 missed churners and 145 caught, so recall is 0.47; a threshold sweep simulated at the same AUC and class balance shows recall rising to about 0.75 when the threshold is lowered, at the cost of precision">
<text class="sS" x="128" y="24" text-anchor="middle">predicted</text><text class="sS" x="89" y="42" text-anchor="middle">stay</text><text class="sS" x="167" y="42" text-anchor="middle">churn</text>
<text class="sS" x="42" y="93" text-anchor="end">stay</text><text class="sS" x="42" y="171" text-anchor="end">churn</text>
<rect class="sB" x="50" y="50" width="74" height="74" rx="6" opacity=".7"/><text class="sT" x="87" y="85" text-anchor="middle">1,153</text><text class="sS" x="87" y="103" text-anchor="middle">TN</text>
<rect class="sW" x="128" y="50" width="74" height="74" rx="6" opacity=".7"/><text class="sT" x="165" y="85" text-anchor="middle">41</text><text class="sS" x="165" y="103" text-anchor="middle">FP</text>
<rect class="sR" x="50" y="128" width="74" height="74" rx="6" opacity=".7"/><text class="sT" x="87" y="163" text-anchor="middle">161</text><text class="sS" x="87" y="181" text-anchor="middle">FN</text>
<rect class="sG" x="128" y="128" width="74" height="74" rx="6" opacity=".7"/><text class="sT" x="165" y="163" text-anchor="middle">145</text><text class="sS" x="165" y="181" text-anchor="middle">TP</text>
<text class="sRt" x="128" y="224" text-anchor="middle">recall 0.47 · precision 0.78</text>
<text class="sS" x="128" y="240" text-anchor="middle">accuracy 0.87 vs baseline 0.796</text>
<line class="sLm" x1="300" y1="200" x2="680" y2="200"/><line class="sLm" x1="300" y1="200" x2="300" y2="34"/>
<polyline class="sLg" points="300.0,40.5 301.5,40.5 303.0,40.5 304.6,41.0 306.1,41.0 307.6,41.0 309.1,41.0 310.6,41.0 312.2,41.0 313.7,41.0 315.2,41.0 316.7,41.0 318.2,41.0 319.8,41.0 321.3,41.0 322.8,41.0 324.3,41.0 325.8,41.0 327.4,41.6 328.9,41.6 330.4,42.1 331.9,42.1 333.4,42.1 335.0,42.1 336.5,42.1 338.0,42.1 339.5,42.1 341.0,43.1 342.6,43.1 344.1,43.1 345.6,43.1 347.1,43.1 348.6,43.1 350.2,43.1 351.7,43.1 353.2,43.1 354.7,43.7 356.2,43.7 357.8,43.7 359.3,43.7 360.8,43.7 362.3,43.7 363.8,44.2 365.4,44.2 366.9,44.7 368.4,44.7 369.9,44.7 371.4,44.7 373.0,44.7 374.5,44.7 376.0,44.7 377.5,44.7 379.0,44.7 380.6,45.2 382.1,45.8 383.6,45.8 385.1,45.8 386.6,45.8 388.2,45.8 389.7,45.8 391.2,47.3 392.7,47.3 394.2,47.3 395.8,47.8 397.3,48.4 398.8,48.4 400.3,48.4 401.8,48.9 403.4,49.4 404.9,49.9 406.4,49.9 407.9,49.9 409.4,50.5 411.0,51.0 412.5,51.5 414.0,51.5 415.5,51.5 417.0,51.5 418.6,52.0 420.1,53.1 421.6,53.1 423.1,53.1 424.6,53.6 426.2,54.6 427.7,55.7 429.2,55.7 430.7,55.7 432.2,56.2 433.8,56.7 435.3,58.3 436.8,58.8 438.3,59.9 439.8,60.9 441.4,60.9 442.9,62.0 444.4,62.5 445.9,64.1 447.4,65.1 449.0,65.6 450.5,66.1 452.0,67.2 453.5,67.7 455.0,68.2 456.6,69.8 458.1,70.3 459.6,70.3 461.1,70.8 462.6,71.4 464.2,71.9 465.7,72.4 467.2,72.9 468.7,73.5 470.2,74.5 471.8,75.6 473.3,76.6 474.8,77.1 476.3,78.2 477.8,79.2 479.4,79.7 480.9,80.8 482.4,82.4 483.9,83.9 485.4,85.0 487.0,85.5 488.5,87.1 490.0,87.6 491.5,89.2 493.0,91.2 494.6,92.8 496.1,93.9 497.6,94.4 499.1,94.4 500.6,95.4 502.2,95.9 503.7,97.0 505.2,99.1 506.7,99.6 508.2,101.2 509.8,102.7 511.3,104.3 512.8,105.4 514.3,105.4 515.8,106.4 517.4,106.4 518.9,108.0 520.4,109.0 521.9,109.5 523.4,111.1 525.0,112.2 526.5,113.2 528.0,114.2 529.5,114.8 531.0,115.3 532.6,116.9 534.1,116.9 535.6,117.9 537.1,120.5 538.6,120.5 540.2,121.6 541.7,122.6 543.2,123.1 544.7,124.2 546.2,125.2 547.8,125.2 549.3,127.8 550.8,128.4 552.3,130.5 553.8,131.5 555.4,132.0 556.9,133.6 558.4,134.6 559.9,137.3 561.4,137.8 563.0,139.3 564.5,140.4 566.0,141.4 567.5,143.5 569.0,144.6 570.6,146.1 572.1,146.1 573.6,149.3 575.1,149.8 576.6,151.9 578.2,152.4 579.7,152.4 581.2,154.0 582.7,155.6 584.2,155.6 585.8,156.1 587.3,158.2 588.8,158.2 590.3,159.2 591.8,159.2 593.4,160.3 594.9,160.8 596.4,162.4 597.9,163.4 599.4,163.9 601.0,164.4 602.5,165.5 604.0,166.0 605.5,167.6 607.0,169.2 608.6,169.2 610.1,169.2 611.6,170.7 613.1,172.3 614.6,172.8 616.2,174.9 617.7,175.9 619.2,176.5 620.7,177.5 622.2,177.5 623.8,178.0 625.3,178.0 626.8,178.6 628.3,178.6 629.8,179.1 631.4,179.1 632.9,179.1 634.4,179.6 635.9,179.6 637.4,179.6 639.0,181.2 640.5,181.7 642.0,181.7 643.5,182.2 645.0,184.3 646.6,184.3 648.1,184.8 649.6,186.9 651.1,188.5 652.6,188.5 654.2,188.5 655.7,188.5 657.2,188.5 658.7,189.5 660.2,190.1 661.8,191.1 663.3,191.6 664.8,193.2 666.3,193.2 667.8,193.2 669.4,193.7 670.9,193.7 672.4,194.2 673.9,194.2 675.4,194.8 677.0,195.3 678.5,195.3" style="stroke-width:2.2"/>
<polyline class="sLv" points="300.0,165.6 301.5,165.5 303.0,165.5 304.6,165.5 306.1,165.4 307.6,165.3 309.1,165.3 310.6,165.2 312.2,165.0 313.7,164.9 315.2,164.7 316.7,164.6 318.2,164.6 319.8,164.5 321.3,164.3 322.8,164.3 324.3,164.1 325.8,163.9 327.4,163.8 328.9,163.6 330.4,163.6 331.9,163.5 333.4,163.3 335.0,163.2 336.5,163.0 338.0,162.8 339.5,162.6 341.0,162.6 342.6,162.5 344.1,162.4 345.6,162.2 347.1,161.9 348.6,161.7 350.2,161.5 351.7,161.2 353.2,161.0 354.7,160.9 356.2,160.9 357.8,160.6 359.3,160.3 360.8,160.1 362.3,159.9 363.8,159.8 365.4,159.7 366.9,159.5 368.4,159.1 369.9,158.9 371.4,158.6 373.0,158.4 374.5,158.1 376.0,157.8 377.5,157.5 379.0,157.3 380.6,157.0 382.1,156.8 383.6,156.4 385.1,156.1 386.6,155.4 388.2,155.2 389.7,154.7 391.2,154.7 392.7,154.3 394.2,153.9 395.8,153.6 397.3,153.3 398.8,152.9 400.3,152.4 401.8,152.3 403.4,151.7 404.9,151.3 406.4,150.7 407.9,150.1 409.4,149.8 411.0,149.1 412.5,148.7 414.0,148.0 415.5,147.2 417.0,146.7 418.6,146.7 420.1,146.2 421.6,145.8 423.1,145.3 424.6,144.6 426.2,144.1 427.7,143.7 429.2,143.0 430.7,142.3 432.2,142.1 433.8,141.9 435.3,142.0 436.8,141.7 438.3,140.8 439.8,140.7 441.4,140.1 442.9,139.6 444.4,138.9 445.9,138.6 447.4,138.0 449.0,137.3 450.5,136.6 452.0,136.1 453.5,135.7 455.0,135.0 456.6,134.7 458.1,134.2 459.6,132.9 461.1,132.1 462.6,131.9 464.2,130.6 465.7,129.8 467.2,128.8 468.7,127.6 470.2,127.0 471.8,126.6 473.3,125.7 474.8,124.5 476.3,123.8 477.8,121.5 479.4,120.7 480.9,120.7 482.4,119.8 483.9,118.5 485.4,118.5 487.0,117.4 488.5,116.5 490.0,115.9 491.5,115.8 493.0,115.5 494.6,114.8 496.1,114.5 497.6,113.1 499.1,112.2 500.6,110.6 502.2,109.5 503.7,107.8 505.2,107.5 506.7,105.8 508.2,103.7 509.8,102.1 511.3,99.4 512.8,98.4 514.3,96.6 515.8,95.5 517.4,93.5 518.9,92.5 520.4,92.5 521.9,92.3 523.4,90.3 525.0,89.4 526.5,88.9 528.0,89.3 529.5,87.6 531.0,87.3 532.6,86.9 534.1,85.4 535.6,83.2 537.1,83.1 538.6,82.5 540.2,81.8 541.7,80.4 543.2,80.0 544.7,78.5 546.2,78.3 547.8,77.0 549.3,75.3 550.8,74.0 552.3,71.8 553.8,69.8 555.4,69.2 556.9,68.1 558.4,66.7 559.9,66.7 561.4,66.9 563.0,66.5 564.5,64.9 566.0,63.2 567.5,61.8 569.0,62.1 570.6,61.5 572.1,61.5 573.6,62.7 575.1,60.4 576.6,61.1 578.2,61.3 579.7,60.0 581.2,57.8 582.7,58.3 584.2,58.3 585.8,58.5 587.3,57.8 588.8,57.8 590.3,58.2 591.8,58.2 593.4,56.9 594.9,55.4 596.4,54.2 597.9,54.5 599.4,54.7 601.0,54.9 602.5,53.3 604.0,53.5 605.5,54.1 607.0,50.2 608.6,50.2 610.1,50.2 611.6,50.7 613.1,51.2 614.6,51.4 616.2,52.3 617.7,49.8 619.2,50.0 620.7,50.4 622.2,43.6 623.8,43.7 625.3,43.7 626.8,43.8 628.3,43.8 629.8,43.9 631.4,40.0 632.9,40.0 634.4,40.0 635.9,40.0 637.4,40.0 639.0,40.0 640.5,40.0 642.0,40.0 643.5,40.0 645.0,40.0 646.6,40.0 648.1,40.0 649.6,40.0 651.1,40.0 652.6,40.0 654.2,40.0 655.7,40.0 657.2,40.0 658.7,40.0 660.2,40.0 661.8,40.0 663.3,40.0 664.8,40.0 666.3,40.0 667.8,40.0 669.4,40.0 670.9,40.0 672.4,40.0 673.9,40.0 675.4,40.0 677.0,40.0 678.5,40.0" style="stroke-width:2.2"/>
<line class="sLg" x1="520" y1="20" x2="540" y2="20"/><text class="sGt" x="546" y="24">recall</text><line class="sLv" x1="600" y1="20" x2="620" y2="20"/><text class="sC" x="626" y="24">precision</text>
<line class="sD" x1="544.72" y1="34" x2="544.72" y2="200"/><circle class="sPg" cx="544.7" cy="124.2" r="4.5"/><circle class="sPv" cx="544.7" cy="78.5" r="4.5"/>
<text class="sRt" x="544.72" y="216" text-anchor="middle">today: R 0.47 · P 0.76</text>
<line class="sD" x1="479.36" y1="34" x2="479.36" y2="200"/><circle class="sPg" cx="479.4" cy="79.7" r="4.5"/><circle class="sPv" cx="479.4" cy="120.7" r="4.5"/>
<text class="sGt" x="479.36" y="232" text-anchor="middle">lowered: R 0.75 · P 0.50</text>
<text class="sS" x="490" y="254" text-anchor="middle">threshold on the model score → (lower = flag more customers)</text>
</svg><figcaption>Left: the reported results. Right: the same AUC (0.86) and class balance, simulated, to show what moving the threshold buys. No retraining needed.</figcaption></figure>

**Read this properly, because it is a textbook case.**

- **Accuracy 0.87** looks good. It is not, on its own — the majority class is 79.6% of the data, so a "predict everyone stays" baseline scores 0.796. The model adds 7 points.
- **AUC 0.86** is genuinely decent. The *ranking* of churn risk is good.
- **The class-1 row is the problem.** Precision 0.78, **recall 0.47**. Of 306 customers who actually churned, the model caught 145 and **missed 161 — more than half.**
- **Macro F1 0.75 vs weighted F1 0.85.** That 10-point gap is the majority class propping up the weighted number (§6.6).

**What this means in business terms:** the model is right about most of the people it flags (78%), but it misses over half the churners. For a retention campaign, recall is what matters — a missed churner is a lost customer, while a false positive costs one unnecessary discount email. **This model is optimised for the wrong thing.**

### How you would fix it — a concrete exercise

1. **Lower the threshold.** The AUC of 0.86 says the ranking is good; 0.5 is just a bad cut point. Sweep it and pick where recall is acceptable:

   ```python
   from sklearn.metrics import precision_recall_curve
   prec, rec, thr = precision_recall_curve(y_test, y_prob)
   # find the threshold where recall >= 0.75, report the precision there
   ```

   **This is the highest-value change and it requires no retraining at all.**

2. **Class weights in the loss:**

   ```python
   model.fit(..., class_weight={0: 1.0, 1: 3.9})   # ≈ 1194/306
   ```

3. **Monitor a recall-sensitive metric** in early stopping — `val_auc` optimises ranking, not the operating point.

4. **Compare against a gradient-boosting baseline.** On 10,000 rows of tabular data, LightGBM or `HistGradientBoostingClassifier` will very likely match or beat this network in a fraction of the time — which is the honest conclusion for most tabular problems.

---

## 11.7 When to use a neural network on tabular data 🟡 ⭐

> [!quote] 💬 Say it in the interview
> “On tabular data, gradient boosting usually beats neural nets with less tuning. I use neural nets for images, text, audio, very large data, or embeddings of high-cardinality IDs.”

The honest answer: **usually you should not.**

| Data | Best tool |
|---|---|
| **Tabular** (rows and columns) | **Gradient boosting** — XGBoost, LightGBM, CatBoost |
| Images | CNNs, Vision Transformers |
| Text | Transformers |
| Audio | CNNs/transformers on spectrograms (as in your own SER thesis) |
| Sequences / time series | LSTMs, temporal CNNs, transformers |

This is not folklore; it is the consistent finding of benchmark studies (see Grinsztajn et al., 2022, "Why do tree-based models still outperform deep learning on tabular data?"). Trees handle mixed types, missing values, monotone transformations and irrelevant features natively; networks need all of that engineered away first.

**So why learn this?** Because the *concepts* — layers, activations, loss, optimisers, dropout, early stopping, the training loop — are the entry point to everything in the Images/Text/Audio rows. And that is where your own graduation project already lives: the HuBERT model in your SER thesis is a transformer with a classifier head, which is structurally the same idea as `Dense(64) → Dense(32) → Dense(1)`, only with a pretrained feature extractor in front.

---

## 11.8 Keras vs PyTorch 🟢

| | Keras/TensorFlow | PyTorch |
|---|---|---|
| Style | Declarative — `compile` then `fit` | Imperative — you write the training loop |
| Learning curve | Gentler | Steeper, more transparent |
| Research use | Declining | **Dominant** |
| Production | TF Serving, TFLite | TorchServe, ONNX, ExecuTorch |
| Ecosystem | | Hugging Face is PyTorch-first |

**PyTorch is the current default** for new work, particularly anything touching Hugging Face — which includes your SER project (`facebook/hubert-base-ls960` loaded via `AutoModel`). Keras 3 now runs on a TensorFlow, PyTorch or JAX backend, which softens the choice.

If you continue with deep learning, learn PyTorch. The concepts transfer directly; only the syntax of the training loop changes, and writing that loop yourself makes the mechanics (forward, loss, `backward()`, `optimizer.step()`, `zero_grad()`) concrete in a way that `fit()` hides.

§11.10–11.15 below do exactly that, following Géron's PyTorch chapter.

---

## 11.9 Neural networks from first principles (Géron, Ch. 9) 🟢 ⭐

> [!info] 📖 Géron Ch. 9 · “From Biological to Artificial Neurons” → “Hyperparameter Tuning Guidelines” · pp. 285–313

![A multilayer perceptron: the forward pass computes the prediction, the backward pass computes gradients.](figures/fig11_mlp.png)
*A multilayer perceptron: the forward pass computes the prediction, the backward pass computes gradients.*

![Activation functions and their derivatives. The flat regions of sigmoid/tanh cause vanishing gradients.](figures/fig11_activations.png)
*Activation functions and their derivatives. The flat regions of sigmoid/tanh cause vanishing gradients.*

> [!quote] 💬 Say it in the interview
> “A neuron computes a weighted sum plus bias through a non-linearity; stacking layers lets the network learn non-linear functions. Backprop applies the chain rule backwards to get every weight's gradient.”

> [!note] 📘 From the book
> Sections 11.9–11.16 add material from Géron's *Hands-On Machine Learning with Scikit-Learn and PyTorch* (2025), Chapter 9 "Introduction to Artificial Neural Networks" and Chapter 10 "Building Neural Networks with PyTorch". The 2025 edition switched from Keras to PyTorch, and this is where your course's Keras knowledge maps onto it.

### A short history, useful for context questions

| Year | Milestone |
|---|---|
| 1943 | **McCulloch & Pitts**: artificial neurons with binary inputs and outputs that can compute any logical proposition (AND, OR, NOT) |
| 1957 | **Rosenblatt's perceptron**: threshold logic units (TLUs) trained with a Hebbian-style rule |
| 1969 | **Minsky & Papert**, *Perceptrons*: a single layer cannot solve **XOR**, and funding dries up ("AI winter") |
| 1970 | **Linnainmaa**: reverse-mode automatic differentiation |
| 1985/86 | **Rumelhart, Hinton & Williams** popularise **backpropagation** for MLPs |
| 1990s | SVMs outperform NNs; another quiet period |
| 2010s | Big data + GPUs + better training tricks lead to deep learning |
| 2017 | **The Transformer** processes any modality, scales well, and enables foundation models, transfer learning, in-context learning, few-shot learning and chain-of-thought |

Géron's reasons "this time is different": far more data, far more compute (GPUs, thanks to gaming), better training algorithms, local optima turning out to be benign in large networks, and the Transformer.

### The perceptron and why it wasn't enough

A **TLU** computes z = **wᵀx + b** and outputs **step(z)** (Heaviside: 0 if z < 0, else 1). A **perceptron** is one layer of TLUs, all fully connected to the inputs (a *dense* layer). For a whole batch:

> **Ŷ = φ(XW + b)**   X: [batch, n_inputs], W: [n_inputs, n_neurons], b: [n_neurons]

The + b is **broadcast** to every row (Part 2 §2.9). φ is the activation function.

**Perceptron learning rule:** **wᵢ,ⱼ ← wᵢ,ⱼ + η(yⱼ − ŷⱼ)xᵢ**. It strengthens connections that would have produced the right answer ("cells that fire together, wire together"). It converges if the data is **linearly separable** (the perceptron convergence theorem). `sklearn.linear_model.Perceptron` ≡ `SGDClassifier(loss="perceptron", learning_rate="constant", eta0=1, penalty=None)`.

**Why logistic regression is usually preferred over a perceptron** (a book exercise): a perceptron outputs no probabilities, has no regularisation by default, and stops as soon as the training set is separated, so it generalises worse. To make a perceptron equivalent to logistic regression, replace the step function with a sigmoid and train it with gradient descent on log-loss.

**Stack perceptrons and XOR becomes solvable.** That is the **multilayer perceptron (MLP)**: an input layer, one or more **hidden layers**, and an output layer. The signal only flows forward, so it is a **feed-forward neural network (FNN)**. With many hidden layers it is a **deep neural network (DNN)**.

<figure class="dia"><svg viewBox="0 0 720 240" role="img" aria-label="XOR: the two classes sit on opposite corners, so no single straight line separates them; two hidden units draw two lines and the output combines them">
<text class="sRt" x="170" y="24" text-anchor="middle">one line can't separate XOR</text>
<rect class="sN" x="60" y="36" width="220" height="194" rx="6"/>
<circle class="sPr" cx="80" cy="210" r="10"/><text class="sX" x="80" y="215" text-anchor="middle">0</text>
<circle class="sPr" cx="260" cy="50" r="10"/><text class="sX" x="260" y="55" text-anchor="middle">0</text>
<circle class="sPg" cx="80" cy="50" r="10"/><text class="sX" x="80" y="55" text-anchor="middle">1</text>
<circle class="sPg" cx="260" cy="210" r="10"/><text class="sX" x="260" y="215" text-anchor="middle">1</text>
<line class="sLw" x1="62" y1="114" x2="278" y2="66" stroke-dasharray="6 4"/><text class="sRt" x="170" y="128" text-anchor="middle">?</text>
<text class="sGt" x="530" y="24" text-anchor="middle">two hidden units: two lines, then combine</text>
<rect class="sN" x="420" y="36" width="220" height="194" rx="6"/>
<circle class="sPr" cx="440" cy="210" r="10"/><text class="sX" x="440" y="215" text-anchor="middle">0</text>
<circle class="sPr" cx="620" cy="50" r="10"/><text class="sX" x="620" y="55" text-anchor="middle">0</text>
<circle class="sPg" cx="440" cy="50" r="10"/><text class="sX" x="440" y="55" text-anchor="middle">1</text>
<circle class="sPg" cx="620" cy="210" r="10"/><text class="sX" x="620" y="215" text-anchor="middle">1</text>
<line class="sLg" x1="422" y1="114" x2="548" y2="226" stroke-width="2"/><line class="sLg" x1="512" y1="34" x2="638" y2="146" stroke-width="2"/>
<text class="sGt" x="530" y="128" text-anchor="middle">green between the lines</text>
</svg><figcaption>The reason hidden layers exist: each neuron draws one boundary, and the next layer combines boundaries into shapes no single line can make.</figcaption></figure>

### Backpropagation, precisely

Géron's definition: **backpropagation = reverse-mode autodiff + gradient descent.**

For each mini-batch:
1. **Forward pass:** compute every layer's output, like prediction, but *keep all the intermediate results*.
2. **Compute the loss** on the output.
3. **Backward pass:** use the **chain rule** to compute how much each output-layer parameter contributed to the error, then propagate those error gradients **backwards layer by layer** to the input. You get one gradient per parameter in just two passes, however many parameters there are.
4. **Gradient descent step** on every weight and bias.
5. Repeat for every mini-batch. One full pass over the data is an **epoch**.

Géron's analogy: shooting a basketball. Throw (forward), see it miss right (error), reason back from the arm to the torso to the feet about how to adjust (backward), adjust (GD step).

**Reverse-mode autodiff** is efficient when there are *many inputs* (millions of parameters) and *few outputs* (one loss). That is exactly the neural-network case.

<figure class="dia steps" data-start="1"><svg viewBox="0 0 720 262" role="img" aria-label="Backpropagation on a two-input, two-hidden, one-output network with real numbers: the forward pass, the loss, gradients for the output weights, gradients propagated to the first layer, and the update that raises the prediction">
<line class="sLm" x1="106" y1="70" x2="304" y2="70"/>
<line class="sLm" x1="106" y1="70" x2="304" y2="170"/>
<line class="sLm" x1="356" y1="70" x2="552" y2="120"/>
<line class="sLm" x1="106" y1="170" x2="304" y2="70"/>
<line class="sLm" x1="106" y1="170" x2="304" y2="170"/>
<line class="sLm" x1="356" y1="170" x2="552" y2="120"/>
<circle class="sB" cx="80" cy="70" r="26"/><text class="sT" x="80" y="75" text-anchor="middle">x₁</text><text class="sC" x="80" y="116" text-anchor="middle">x₁ = 1.0</text>
<circle class="sB" cx="80" cy="170" r="26"/><text class="sT" x="80" y="175" text-anchor="middle">x₂</text><text class="sC" x="80" y="216" text-anchor="middle">x₂ = 0.5</text>
<circle class="sV" cx="330" cy="70" r="26"/><text class="sT" x="330" y="75" text-anchor="middle">h1</text>
<circle class="sV" cx="330" cy="170" r="26"/><text class="sT" x="330" y="175" text-anchor="middle">h2</text>
<circle class="sA" cx="580" cy="120" r="28"/><text class="sT" x="580" y="125" text-anchor="middle">ŷ</text>
<text class="sM" x="205" y="52" text-anchor="middle">W1</text><text class="sM" x="455" y="82" text-anchor="middle">w2</text>
<g data-s="1-1"><text class="sGt" x="330" y="34" text-anchor="middle">h1 = ReLU(0.30) = 0.30</text><text class="sGt" x="330" y="222" text-anchor="middle">h2 = ReLU(0.70) = 0.70</text><text class="sGt" x="580" y="76" text-anchor="middle">ŷ = σ(-0.07) = 0.483</text><text class="sT" x="360" y="250" text-anchor="middle">forward pass: compute and remember every intermediate value</text></g>
<g data-s="2-2"><text class="sC" x="580" y="76" text-anchor="middle">ŷ = 0.483, target y = 1</text><text class="sRt" x="580" y="176" text-anchor="middle">loss = −log ŷ = 0.729</text><text class="sT" x="360" y="250" text-anchor="middle">loss: how wrong was the prediction?</text></g>
<g data-s="3-3"><text class="sRt" x="580" y="176" text-anchor="middle">∂L/∂z = ŷ − y = -0.517</text><text class="sRt" x="455" y="102" text-anchor="middle">∂L/∂w2 = (-0.155, -0.362)</text><text class="sT" x="360" y="250" text-anchor="middle">backward: the output error gives each w2 its gradient (error × input)</text></g>
<g data-s="4-4"><text class="sRt" x="330" y="34" text-anchor="middle">∂h1 = -0.310</text><text class="sRt" x="330" y="222" text-anchor="middle">∂h2 = 0.259</text><text class="sRt" x="205" y="120" text-anchor="middle">chain rule: error × w2 × ReLU′</text><text class="sT" x="360" y="250" text-anchor="middle">propagate the error back through w2 and the ReLUs to get W1's gradients</text></g>
<g data-s="5-5"><text class="sGt" x="455" y="102" text-anchor="middle">w2 → (0.68, -0.32)</text><text class="sGt" x="205" y="120" text-anchor="middle">W1 row 1 → (0.56, 0.17)</text><text class="sGt" x="580" y="176" text-anchor="middle">new ŷ = 0.565 (was 0.483)</text><text class="sT" x="360" y="250" text-anchor="middle">step: w ← w − 0.5 × gradient. One step closer to y = 1</text></g>
</svg><ol class="dia-steps">
<li><b>Forward pass.</b> Inputs (1.0, 0.5) flow through W1 and ReLU to the hidden units, then through w2 and a sigmoid: ŷ = 0.483. Every intermediate value is kept.</li>
<li><b>Loss.</b> The target is 1, so binary cross-entropy is −log ŷ = 0.729.</li>
<li><b>Backward, last layer.</b> For sigmoid + cross-entropy, ∂L/∂z is simply ŷ − y = -0.517. Each output weight's gradient is that error times the hidden value feeding it.</li>
<li><b>Backward, first layer.</b> The chain rule sends the error back through w2 and through each ReLU's derivative (1 if it was active, 0 if not), giving W1's gradients. This reuse of the forward values is why it's efficient.</li>
<li><b>Update.</b> Gradient descent moves every weight a little against its gradient (learning rate 0.5). Running the forward pass again gives ŷ = 0.565: closer to the target. Training repeats this millions of times.</li>
</ol><figcaption>Backpropagation, with every number computed for this figure. Frameworks do exactly this, automatically, for millions of weights.</figcaption></figure>

**Two design facts that made backprop work:**
- **Random initialisation is mandatory.** With all-zero weights, every neuron in a layer computes the same thing and receives the same gradient, so they stay identical forever: a layer of 100 neurons acts like one. Random weights **break the symmetry**.
- **Replace the step function with a differentiable activation.** The step function is flat everywhere, so its gradient is 0 and gradient descent cannot move. Rumelhart et al. used the **sigmoid**.

### Activation functions

| Function | Formula | Range | Notes |
|---|---|---|---|
| **Sigmoid** | 1/(1+e⁻ᶻ) | (0, 1) | Saturates at both ends, so gradients vanish. Used for binary/multilabel **outputs** |
| **tanh** | 2σ(2z) − 1 | (−1, 1) | Zero-centred outputs, which speeds up convergence compared with sigmoid. Also saturates |
| **ReLU** | max(0, z) | [0, ∞) | Default for hidden layers (except transformers). Fast, no saturation for z > 0. Not differentiable at 0; gradient 0 for z < 0 (**dying ReLU**) |
| Softplus | log(1 + eᶻ) | (0, ∞) | Smooth ReLU. Use on a regression output that must be positive |
| Leaky ReLU / ELU / GELU / Swish | — | — | Fix dying ReLU. GELU is standard in transformers |
| **Softmax** | eᶻᵏ/Σeᶻʲ | Probabilities summing to 1 | Multiclass **output** layer |

**Why non-linearity at all?** Composing linear functions gives a linear function: f(x) = 2x + 3 and g(x) = 5x − 1 give f(g(x)) = 10x + 1. Without activations, a 100-layer network equals one linear layer. With them, a large enough network can approximate any continuous function (the **universal approximation theorem**).

### Regression and classification MLPs — the recipes

| | Regression | Binary clf | Multilabel binary | Multiclass |
|---|---|---|---|---|
| Hidden layers | 1–5 typical | 1–5 | 1–5 | 1–5 |
| Neurons/hidden layer | 10–100 typical | same | same | same |
| **Output neurons** | 1 per target dimension | **1** | **1 per label** | **1 per class** |
| **Output activation** | **None**; ReLU/softplus if positive; sigmoid/tanh if bounded (scale the target) | **Sigmoid** | **Sigmoid** (probabilities need not sum to 1) | **Softmax** |
| **Loss** | **MSE**, or **Huber** if outliers | Binary cross-entropy | Binary cross-entropy | Cross-entropy |

**Huber loss**: quadratic for |error| < δ (precise, fast convergence), linear beyond it (robust to outliers). It combines the strengths of MSE and MAE.

**Example (Géron's exercise 7):** spam/ham → 1 output neuron with sigmoid. MNIST → 10 neurons with softmax. House price → 1 neuron with no activation.

### MLPs in scikit-learn

```python
from sklearn.neural_network import MLPRegressor, MLPClassifier
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler, MinMaxScaler

mlp_reg = MLPRegressor(hidden_layer_sizes=[50, 50, 50], early_stopping=True,
                       verbose=True, random_state=42)
pipeline = make_pipeline(StandardScaler(), mlp_reg)   # scaling: GD needs it
pipeline.fit(X_train, y_train)          # Adam, MSE, tiny ℓ₂ (alpha=1e-4)
# stops at epoch 45 · validation R² ≈ 0.79 · test RMSE ≈ 0.53 (≈ a random forest)

mlp_clf = MLPClassifier(hidden_layer_sizes=[300, 100], early_stopping=True,
                        random_state=42)
pipeline = make_pipeline(MinMaxScaler(), mlp_clf)   # images: MinMax, not Standard
# Fashion MNIST: ~89.7% best validation, 87.1% test accuracy
```

Details worth quoting:
- `early_stopping=True` holds out `validation_fraction=0.1` and stops after `n_iter_no_change=10` epochs without improvement.
- **Why `MinMaxScaler` for images?** Edge pixels barely vary. `StandardScaler` would blow them up to unit variance and give them more importance than they deserve.
- The first hidden layer here has 784 × 300 + 300 = **235,500 parameters**. Many parameters mean flexibility, and therefore overfitting risk.
- sklearn MLPs have **no GPU support**, no custom output activations, and only MSE for regression. That is why the book moves to PyTorch.

⚠️ **Neural networks are overconfident.** Géron's Fashion MNIST model is 100% confident in a *wrong* prediction (a sneaker called a bag). Across 10,000 test images, only 16 had confidence below 99.9%, despite only ~87% test accuracy. Fixes: **label smoothing** (target 0.9 for the true class, the rest spread over the others; `nn.CrossEntropyLoss(label_smoothing=0.05)`), calibration (temperature scaling), and not over-training.

### Hyperparameter tuning guidelines

**Number of hidden layers.** One hidden layer can in theory model any function, but **deep networks are exponentially more parameter-efficient**. They compose features hierarchically (lines → shapes → parts → objects), converge faster, and **transfer**: you can reuse lower layers trained on a related task (transfer learning). Start with 1–2 layers (>97% on MNIST with one layer of a few hundred neurons, >98% with two), and add layers until you overfit. For big tasks, **reuse a pretrained network** rather than training from scratch.

**Neurons per layer.** The old **pyramid** convention (300 → 200 → 100) has largely been abandoned. The **same size in every hidden layer** works as well or better and leaves one hyperparameter to tune. Sometimes a slightly larger first layer helps. Use the **"stretch pants" approach** (Vincent Vanhoucke): build a network slightly bigger than needed and let early stopping and regularisation shrink it to fit. Avoid **bottleneck layers** that throw away information: Fashion MNIST needs 187 PCA dimensions for 95% variance, so a first layer of about 200 neurons won't bottleneck. **"You will get more bang for your buck by increasing the number of layers rather than the number of neurons per layer."**

**Learning rate: the most important hyperparameter.** The optimum is roughly **half the maximum stable rate**. To find it, train for a few hundred iterations while increasing the LR exponentially from 10⁻⁵ to 10, plot loss against LR on a log scale, and pick about **10× lower than where the loss starts climbing**. Then reinitialise and train normally. **Retune the LR whenever you change another hyperparameter, especially batch size.**

**Batch size.** Large batches use GPUs efficiently, but can be unstable early and may generalise worse. Yann LeCun: *"Friends don't let friends use mini-batches larger than 32"*. Other work (Goyal et al., 2017) trained with batches of 8,192 using **learning-rate warm-up**. The practical rule: try a large batch with warm-up, and fall back to a small batch if training is unstable or results disappoint.

**Other knobs:** optimizer (Adam, SGD with momentum…), activation (ReLU default), number of epochs (don't tune it; **use early stopping**). Further reading: Leslie Smith (2018), the *Deep Learning Tuning Playbook*, Andrew Ng's *Machine Learning Yearning*.

**TensorFlow Playground** (playground.tensorflow.org), Géron's exercise 1. An hour there teaches, among other things:
- ReLU gives piecewise-linear boundaries.
- Networks that are too small (2 neurons) always underfit.
- Larger networks (8 neurons) rarely get stuck in bad local minima.
- Deep, narrow networks on the spiral dataset show **vanishing gradients**: the top layers learn faster than the bottom ones.

---

## 11.10 PyTorch fundamentals (Géron, Ch. 10) 🟡

> [!info] 📖 Géron Ch. 10 · “PyTorch Fundamentals” · pp. 318–327

**Why PyTorch:** Meta's library (2016), now under the Linux Foundation. It uses **dynamic computation graphs** ("define-by-run"): the graph is built as Python executes, so ordinary `if`/`for` statements and a debugger work. It dominates research, and industry followed.

### Tensors = NumPy arrays + GPU + autograd

```python
import torch
X = torch.tensor([[1.0, 4.0, 7.0], [2.0, 3.0, 6.0]])
X.shape, X.dtype                  # torch.Size([2, 3]), torch.float32
X[:, 1]                           # indexing like NumPy
X.max(dim=0)                      # PyTorch prefers `dim` (also accepts `axis`)
X @ X.T                           # matrix multiplication
X.numpy(); torch.tensor(np_array, dtype=torch.float32)
```

- **Default float is 32-bit** (NumPy's is 64). Deep learning doesn't need float64: half the memory, faster. Convert with `dtype=torch.float32` or `torch.FloatTensor(...)`.
- `torch.tensor()` / `FloatTensor()` **copy**. `torch.from_numpy()` **shares memory**, so changing one changes the other.
- **In-place operations end in `_`**: `relu_()`, `abs_()`, `zero_()`. `X.exp()` returns a new tensor; `X.exp_()` overwrites X.

### Hardware acceleration

```python
device = ("cuda" if torch.cuda.is_available()
          else "mps" if torch.backends.mps.is_available() else "cpu")
M = torch.rand((1000, 1000), device=device)   # create on the GPU, or ...
M = torch.rand((1000, 1000)).to(device)       # ... copy it there
```

A 1000×1000 matmul is about **26× faster** on a free Colab T4 than on the CPU, but only ~2× at 100×100. GPUs win by parallelising *big* operations, and CPU↔GPU **transfer is often the bottleneck**, so keep data and operations on the same device.

### Autograd

```python
x = torch.tensor(5.0, requires_grad=True)   # track operations on x
f = x ** 2                                   # f = 25, f.grad_fn = <PowBackward0>
f.backward()                                 # backprop through the recorded graph
x.grad                                       # tensor(10.)  = f'(5) = 2·5

learning_rate = 0.1
with torch.no_grad():                        # don't record the update itself
    x -= learning_rate * x.grad              # 5.0 → 4.0
x.grad.zero_()                               # !!! gradients ACCUMULATE otherwise
```

<figure class="dia steps"><svg viewBox="0 0 720 228" role="img" aria-label="Autograd on f equals x squared: the forward pass records a PowBackward0 node; backward gives x.grad of 10; the update under no_grad moves x to 4; a second backward without zeroing adds 8 to the stale 10, giving 18 instead of 8">
<rect class="sB" x="30" y="64" width="130" height="56" rx="8"/><text class="sT" x="95" y="86" text-anchor="middle">x  (leaf)</text><text class="sS" x="95" y="104" text-anchor="middle">requires_grad=True</text>
<g data-s="1-2"><text class="sT" x="95" y="140" text-anchor="middle">x = 5.0</text></g>
<g data-s="3-4"><text class="sGt" x="95" y="140" text-anchor="middle">x = 4.0</text></g>
<line class="sL" x1="162" y1="92" x2="226" y2="92" marker-end="url(#ah)"/><rect class="sV" x="230" y="66" width="140" height="52" rx="26"/><text class="sT" x="300" y="88" text-anchor="middle">PowBackward0</text><text class="sS" x="300" y="106" text-anchor="middle">saved: x</text>
<line class="sL" x1="372" y1="92" x2="436" y2="92" marker-end="url(#ah)"/><rect class="sA" x="440" y="64" width="90" height="56" rx="8"/><text class="sT" x="485" y="86" text-anchor="middle">f</text><text class="sS" x="485" y="104" text-anchor="middle">grad_fn set</text>
<g data-s="1-3"><text class="sT" x="485" y="140" text-anchor="middle">f = 25</text></g>
<g data-s="4-4"><text class="sT" x="485" y="140" text-anchor="middle">f = 16</text></g>
<g data-s="2-2"><line class="sLr" x1="470" y1="172" x2="312" y2="172" marker-end="url(#ahr)"/><text class="sRt" x="392" y="166" text-anchor="middle">∂f/∂f = 1</text><line class="sLr" x1="288" y1="172" x2="112" y2="172" marker-end="url(#ahr)"/><text class="sRt" x="200" y="166" text-anchor="middle">× 2x = 10</text></g>
<g data-s="4-4"><line class="sLr" x1="470" y1="172" x2="312" y2="172" marker-end="url(#ahr)"/><text class="sRt" x="392" y="166" text-anchor="middle">∂f/∂f = 1</text><line class="sLr" x1="288" y1="172" x2="112" y2="172" marker-end="url(#ahr)"/><text class="sRt" x="200" y="166" text-anchor="middle">× 2x = 8</text></g>
<rect class="sN" x="556" y="50" width="150" height="110" rx="8"/><text class="sT" x="631" y="72" text-anchor="middle">x.grad</text>
<g data-s="1-1"><text class="sS" x="631" y="108" text-anchor="middle">None</text></g>
<g data-s="2-3"><text class="sGt" x="631" y="108" text-anchor="middle">10</text></g>
<g data-s="4-4"><text class="sRt" x="631" y="102" text-anchor="middle">10 + 8 = 18</text><text class="sS" x="631" y="124" text-anchor="middle">should be 8</text><text class="sS" x="631" y="142" text-anchor="middle">gradients accumulate</text></g>
<g data-s="1-1"><text class="sC" x="30" y="212" xml:space="preserve" style="white-space:pre">f = x ** 2                # forward: the graph is recorded</text></g>
<g data-s="2-2"><text class="sC" x="30" y="212" xml:space="preserve" style="white-space:pre">f.backward()              # walk the graph backwards</text></g>
<g data-s="3-3"><text class="sC" x="30" y="212" xml:space="preserve" style="white-space:pre">with torch.no_grad(): x -= 0.1 * x.grad   # no graph</text></g>
<g data-s="4-4"><text class="sC" x="30" y="212" xml:space="preserve" style="white-space:pre">f = x ** 2; f.backward()  # forgot x.grad.zero_()</text></g>
</svg><ol class="dia-steps">
<li>Forward pass: every operation on a tensor with requires_grad records a node. f = 25 and f.grad_fn is PowBackward0, which saved x for later.</li>
<li>backward() walks the recorded graph from f to the leaves, multiplying local derivatives: df/dx = 2x = 10, stored in x.grad.</li>
<li>The update runs inside torch.no_grad(), so it is not recorded. x becomes 4.0; x.grad still holds 10.</li>
<li>The next forward and backward add the new gradient (8) to the old one: x.grad = 18. Call zero_grad() (or x.grad.zero_()) before every backward.</li>
</ol><figcaption>The autograd example above, run in PyTorch step by step, including what happens when you forget to zero the gradient.</figcaption></figure>

- The graph is rebuilt on **every forward pass**, which is why dynamic models with loops and conditionals work.
- ⚠️ **`backward()` accumulates into `.grad`.** Forgetting `zero_grad()` produces silently wrong updates, sometimes NaNs, and no error message.
- Three ways to compute without autograd: a `torch.no_grad()` context, `tensor.detach()` (a new tensor sharing memory, outside the graph), or tensors that never had `requires_grad=True`. Use `torch.inference_mode()` for pure inference.
- ⚠️ **In-place operations and autograd:** you can't modify a leaf that requires grad in place (`x += 1` raises an error). You also can't modify in place a tensor that autograd saved for the backward pass: `z = t.exp(); z += 1; z.backward()` fails because `exp` saves its *output*. `cos`, `abs` and `log` save their *inputs*; `max`, `std` and `norm` save both; `sum` and `mean` save neither. Rule: write without in-place ops first and optimise later.
- Reproducibility: `torch.manual_seed(42)`. Results can still differ across versions, hardware and GPU parallel reductions. `torch.use_deterministic_algorithms(True)` helps, but is slower.

---

## 11.11 From linear regression to an MLP in PyTorch 🟡 ⭐

> [!info] 📖 Géron Ch. 10 · “Implementing Linear Regression” → “Model Evaluation” · pp. 327–340

> [!quote] 💬 Say it in the interview
> “Each step: forward pass, compute the loss, `optimizer.zero_grad()`, `loss.backward()`, `optimizer.step()`. `model.train()` and `model.eval()` switch dropout and batch-norm behaviour.”

### Level 1 — raw tensors and autograd

```python
X_train = torch.FloatTensor(X_train)
means = X_train.mean(dim=0, keepdims=True)
stds  = X_train.std(dim=0, keepdims=True)
X_train = (X_train - means) / stds                     # scale with TRAIN stats
X_valid = (torch.FloatTensor(X_valid) - means) / stds
y_train = torch.FloatTensor(y_train).reshape(-1, 1)    # column vector

torch.manual_seed(42)
w = torch.randn((n_features, 1), requires_grad=True)
b = torch.tensor(0., requires_grad=True)

for epoch in range(20):                                # batch gradient descent
    y_pred = X_train @ w + b
    loss = ((y_pred - y_train) ** 2).mean()            # MSE
    loss.backward()
    with torch.no_grad():
        b -= 0.4 * b.grad
        w -= 0.4 * w.grad
        b.grad.zero_(); w.grad.zero_()
```

### Level 2 — `nn.Linear`, an optimizer and a criterion

```python
import torch.nn as nn

model = nn.Linear(in_features=n_features, out_features=1)  # weight [1, n], bias [1]
optimizer = torch.optim.SGD(model.parameters(), lr=0.4)
mse = nn.MSELoss()                                          # the "criterion"

def train_bgd(model, optimizer, criterion, X_train, y_train, n_epochs):
    for epoch in range(n_epochs):
        y_pred = model(X_train)          # calls forward(); never call forward() directly
        loss = criterion(y_pred, y_train)
        loss.backward()
        optimizer.step()                 # the parameter update (handles no_grad itself)
        optimizer.zero_grad()            # reset gradients
```

Notes:
- `nn.Linear` stores its weight as **[out_features, in_features]**, the transpose of Géron's Equation 9-2, and computes `X @ W.T + b`.
- Parameters are `nn.Parameter` objects (a Tensor subclass). `model.parameters()` and `named_parameters()` iterate over them recursively. A plain tensor attribute is **not** a parameter, even with `requires_grad=True`.
- A *linear* module used as a function computes the prediction, and `grad_fn` shows autograd tracking it.

### Level 3 — an MLP with `nn.Sequential`, mini-batches and a GPU

```python
from torch.utils.data import TensorDataset, DataLoader

model = nn.Sequential(
    nn.Linear(n_features, 50), nn.ReLU(),
    nn.Linear(50, 40), nn.ReLU(),          # a layer's input size = the previous output size
    nn.Linear(40, 1),                       # output size = target dimension
).to(device)
optimizer = torch.optim.SGD(model.parameters(), lr=0.02)   # create AFTER .to(device)
mse = nn.MSELoss()

train_loader = DataLoader(TensorDataset(X_train, y_train), batch_size=32,
                          shuffle=True, pin_memory=True)     # num_workers=… to prefetch

def train(model, optimizer, criterion, train_loader, n_epochs):
    model.train()                                   # training mode (dropout, batchnorm)
    for epoch in range(n_epochs):
        total_loss = 0.
        for X_batch, y_batch in train_loader:
            X_batch, y_batch = X_batch.to(device), y_batch.to(device)
            y_pred = model(X_batch)
            loss = criterion(y_pred, y_batch)
            total_loss += loss.item()               # .item(): a Python float, no graph
            loss.backward()
            optimizer.step()
            optimizer.zero_grad()
        print(f"Epoch {epoch+1}: {total_loss / len(train_loader):.4f}")
```

**The five-line heart of every PyTorch training loop.** Recite it in interviews: **forward → loss → `backward()` → `step()` → `zero_grad()`.**

<figure class="dia anim"><svg viewBox="0 0 720 250" role="img" aria-label="Animation: the PyTorch training loop for each mini-batch: forward pass, loss, backward to fill gradients, optimizer step to update parameters, zero the gradients, then the next batch">
<rect class="sB" x="70" y="60" width="160" height="56" rx="8"/><text class="sT" x="150" y="84" text-anchor="middle">forward</text><text class="sS" x="82" y="104" xml:space="preserve" style="white-space:pre">y_pred = model(X)</text>
<rect class="sW" x="290" y="60" width="160" height="56" rx="8"/><text class="sT" x="370" y="84" text-anchor="middle">loss</text><text class="sS" x="302" y="104" xml:space="preserve" style="white-space:pre">criterion(y_pred, y)</text>
<rect class="sV" x="510" y="60" width="160" height="56" rx="8"/><text class="sT" x="590" y="84" text-anchor="middle">backward</text><text class="sS" x="522" y="104" xml:space="preserve" style="white-space:pre">loss.backward()</text>
<rect class="sG" x="510" y="160" width="160" height="56" rx="8"/><text class="sT" x="590" y="184" text-anchor="middle">step</text><text class="sS" x="522" y="204" xml:space="preserve" style="white-space:pre">optimizer.step()</text>
<rect class="sN" x="290" y="160" width="160" height="56" rx="8"/><text class="sT" x="370" y="184" text-anchor="middle">zero_grad</text><text class="sS" x="302" y="204" xml:space="preserve" style="white-space:pre">optimizer.zero_grad()</text>
<line class="sL" x1="230" y1="88" x2="286" y2="88" marker-end="url(#ah)"/><line class="sL" x1="450" y1="88" x2="506" y2="88" marker-end="url(#ah)"/><line class="sL" x1="590" y1="116" x2="590" y2="156" marker-end="url(#ah)"/><line class="sL" x1="510" y1="188" x2="454" y2="188" marker-end="url(#ah)"/>
<path class="sL" d="M 290 188 H 150 V 120" marker-end="url(#ah)"/>
<text class="sS" x="150" y="152" text-anchor="end">next batch</text>
<text class="sS" x="378" y="40" text-anchor="middle">scalar</text><text class="sS" x="598" y="40" text-anchor="middle">.grad filled on every parameter</text><text class="sS" x="678" y="140" text-anchor="end">θ ← θ − η·grad</text>
<text class="sS" x="370" y="238" text-anchor="middle">grads accumulate by design, so zero them every batch; with torch.no_grad() at evaluation time, none of this graph is built</text>
<circle class="sP" r="5"><animateMotion dur="5s" repeatCount="indefinite" path="M 150 88 H 590 V 188 H 150 V 88"/></circle>
<rect class="sA" x="14" y="60" width="46" height="56" rx="8"/><text class="sC" x="37" y="84" text-anchor="middle">X, y</text><text class="sS" x="37" y="102" text-anchor="middle">batch</text><line class="sL" x1="60" y1="88" x2="66" y2="88" marker-end="url(#ah)"/>
</svg><figcaption>The five-line heart of every PyTorch training loop, drawn as the cycle it is.</figcaption></figure>

<figure class="dia"><svg viewBox="0 0 720 244" role="img" aria-label="A batch of 32 rows with 8 features flows through Linear 8 to 50, Linear 50 to 40 and Linear 40 to 1, changing shape from 32 by 8 to 32 by 50, 32 by 40 and 32 by 1, with 2,531 parameters in total">
<rect class="sA" x="54" y="129.6" width="80" height="40.8" rx="6"/><text class="sC" x="94" y="155" text-anchor="middle">(32, 8)</text>
<text class="sT" x="94" y="22" text-anchor="middle">input</text>
<rect class="sB" x="230" y="75" width="80" height="150" rx="6"/><text class="sC" x="270" y="155" text-anchor="middle">(32, 50)</text>
<text class="sT" x="270" y="22" text-anchor="middle">Linear(8, 50) + ReLU</text>
<text class="sS" x="270" y="40" text-anchor="middle">8×50 + 50 = 450 params</text>
<line class="sLm" x1="134" y1="150" x2="226" y2="150" marker-end="url(#ahm)"/>
<rect class="sB" x="406" y="88" width="80" height="124" rx="6"/><text class="sC" x="446" y="155" text-anchor="middle">(32, 40)</text>
<text class="sT" x="446" y="22" text-anchor="middle">Linear(50, 40) + ReLU</text>
<text class="sS" x="446" y="40" text-anchor="middle">50×40 + 40 = 2,040 params</text>
<line class="sLm" x1="310" y1="150" x2="402" y2="150" marker-end="url(#ahm)"/>
<rect class="sB" x="582" y="138.7" width="80" height="22.6" rx="6"/><text class="sC" x="622" y="155" text-anchor="middle">(32, 1)</text>
<text class="sT" x="622" y="22" text-anchor="middle">Linear(40, 1)</text>
<text class="sS" x="622" y="40" text-anchor="middle">40×1 + 1 = 41 params</text>
<line class="sLm" x1="486" y1="150" x2="578" y2="150" marker-end="url(#ahm)"/>
<text class="sGt" x="360" y="232" text-anchor="middle">total 2,531 trainable parameters; the batch size 32 passes through untouched, only the last dimension changes</text>
</svg><figcaption>Read a Sequential as shapes: each layer's input size must equal the previous output size. Parameter counts computed for 8 input features (California housing).</figcaption></figure>

Speed-ups:
- `pin_memory=True` (page-locked RAM enables direct GPU transfers).
- `num_workers>0` (prefetch the next batches on the CPU while the GPU computes; `persistent_workers=True` on Windows, where spawning workers is slow).

Why create the optimizer **after** `model.to(device)`? Some optimizers (Adam, momentum) keep internal state tensors, which are allocated on the parameters' device.

### Evaluation

```python
def evaluate(model, data_loader, metric_fn, aggregate_fn=torch.mean):
    model.eval()                                    # evaluation mode
    metrics = []
    with torch.no_grad():
        for X_batch, y_batch in data_loader:
            X_batch, y_batch = X_batch.to(device), y_batch.to(device)
            metrics.append(metric_fn(model(X_batch), y_batch))
    return aggregate_fn(torch.stack(metrics))

evaluate(model, valid_loader, mse,
         aggregate_fn=lambda m: torch.sqrt(torch.mean(m)))   # correct RMSE
```

⚠️ **The mean of per-batch RMSEs is not the RMSE** (Géron got 0.5668 against the correct 0.6388 = √0.4080). Average the MSE, then take the root. Or use **TorchMetrics** *streaming* metrics (`metric.update(y_pred, y)` per batch, then `metric.compute()`): `torchmetrics.MeanSquaredError(squared=False)`, `torchmetrics.Accuracy(task="multiclass", num_classes=10)`, `AUROC`, `F1Score`.

**`model.train()` vs `model.eval()`:** layers such as `nn.Dropout` and `nn.BatchNorm1d` behave differently in training and inference. Forgetting `eval()` gives noisy, pessimistic validation scores, and it is one of the most common PyTorch bugs. It is the same point Part 11 §11.4 made about Keras.

---

## 11.12 Custom modules: Wide & Deep, multiple inputs and outputs 🟡

> [!info] 📖 Géron Ch. 10 · “Building Nonsequential Models Using Custom Modules” · pp. 340–346

Subclass `nn.Module`: create layers in `__init__` (after `super().__init__()`) and wire them in `forward()`.

```python
class WideAndDeep(nn.Module):
    """Cheng et al. 2016: a deep path learns complex patterns; a wide (short) path
    passes raw or engineered features straight to the output, so simple rules
    aren't distorted by the deep stack."""
    def __init__(self, n_features):
        super().__init__()
        self.deep_stack = nn.Sequential(
            nn.Linear(n_features, 50), nn.ReLU(),
            nn.Linear(50, 40), nn.ReLU())
        self.output_layer = nn.Linear(40 + n_features, 1)
        self.aux_output_layer = nn.Linear(40, 1)           # auxiliary head

    def forward(self, X_wide, X_deep):                      # multiple inputs
        deep_output = self.deep_stack(X_deep)
        wide_and_deep = torch.concat([X_wide, deep_output], dim=1)
        return self.output_layer(wide_and_deep), self.aux_output_layer(deep_output)

# training step with multiple outputs: a weighted sum of the losses
y_pred, y_pred_aux = model(X_wide=xw, X_deep=xd)
loss = 0.8 * criterion(y_pred, y) + 0.2 * criterion(y_pred_aux, y)   # the weights are a hyperparameter
```

<figure class="dia"><svg viewBox="0 0 720 240" role="img" aria-label="Wide and Deep: the deep input passes through two linear and ReLU layers, the wide input skips them, both are concatenated into the main output, and an auxiliary output reads the deep features alone; the loss is a weighted sum of both outputs">
<rect class="sA" x="14" y="30" width="120" height="44" rx="8"/><text class="sT" x="74" y="50" text-anchor="middle">X_wide</text><text class="sC" x="74" y="66" text-anchor="middle">(batch, 8)</text>
<rect class="sB" x="14" y="150" width="120" height="44" rx="8"/><text class="sT" x="74" y="170" text-anchor="middle">X_deep</text><text class="sC" x="74" y="186" text-anchor="middle">(batch, 8)</text>
<rect class="sB" x="170" y="150" width="120" height="44" rx="8"/><text class="sT" x="230" y="170" text-anchor="middle">Linear + ReLU</text><text class="sC" x="230" y="186" text-anchor="middle">8 → 50</text>
<rect class="sB" x="320" y="150" width="120" height="44" rx="8"/><text class="sT" x="380" y="170" text-anchor="middle">Linear + ReLU</text><text class="sC" x="380" y="186" text-anchor="middle">50 → 40</text>
<line class="sL" x1="134" y1="172" x2="166" y2="172" marker-end="url(#ah)"/><line class="sL" x1="290" y1="172" x2="316" y2="172" marker-end="url(#ah)"/>
<rect class="sN" x="470" y="84" width="110" height="44" rx="8"/><text class="sT" x="525" y="104" text-anchor="middle">concat</text><text class="sC" x="525" y="120" text-anchor="middle">(batch, 48)</text>
<path class="sL" d="M 134 52 H 520 V 80" fill="none" marker-end="url(#ah)"/><text class="sS" x="330" y="44" text-anchor="middle">wide path: raw features skip the stack</text>
<line class="sL" x1="440" y1="164" x2="500" y2="132" marker-end="url(#ah)"/>
<rect class="sG" x="606" y="84" width="100" height="44" rx="8"/><text class="sT" x="656" y="104" text-anchor="middle">output</text><text class="sC" x="656" y="120" text-anchor="middle">48 → 1</text>
<line class="sL" x1="580" y1="106" x2="602" y2="106" marker-end="url(#ah)"/>
<rect class="sW" x="606" y="160" width="100" height="44" rx="8"/><text class="sT" x="656" y="180" text-anchor="middle">aux output</text><text class="sC" x="656" y="196" text-anchor="middle">40 → 1</text>
<line class="sLw" x1="440" y1="180" x2="602" y2="182" marker-end="url(#ahw)"/>
<text class="sGt" x="560" y="226" text-anchor="middle">loss = 0.8 · loss(output) + 0.2 · loss(aux)</text>
<text class="sS" x="220" y="226" text-anchor="middle">parameters: 2,580</text>
</svg><figcaption>The WideAndDeep module above as a graph, with tensor shapes for 8 input features. The auxiliary head forces the deep stack to be useful on its own.</figcaption></figure>

- **Multiple inputs:** return several tensors from the Dataset (`for *X_inputs, y in loader: model(*X_inputs)`), or better, a **dict of named inputs** from a custom `Dataset` with `__len__` and `__getitem__`, then call `model(**inputs)`. That prevents order mix-ups.
- **Multiple outputs, and why:** the task needs it (locate *and* classify an object); **multitask learning** (one network, several related tasks, shared features); or an **auxiliary output for regularisation** (the deep stack must be useful on its own).
- Use `nn.ModuleList` / `nn.ModuleDict` (and `nn.ParameterList`/`Dict`) for variable numbers of submodules. A plain Python list hides them from `parameters()`, so they would never train.
- **Telecom example:** a wide & deep churn model. The wide path carries interpretable engineered flags (`contract_ends_30d`, `complaint_last_7d`); the deep path carries embeddings of handset model, governorate and usage sequences.

---

## 11.13 Classification in PyTorch, and the loss functions 🟡 ⭐

> [!info] 📖 Géron Ch. 10 · “Building an Image Classifier with PyTorch” · pp. 346–352

> [!quote] 💬 Say it in the interview
> “`CrossEntropyLoss` combines log-softmax and NLL, so it expects raw logits — applying softmax first double-counts and is numerically unstable.”

```python
class ImageClassifier(nn.Module):
    def __init__(self, n_inputs, n_hidden1, n_hidden2, n_classes):
        super().__init__()
        self.mlp = nn.Sequential(
            nn.Flatten(),                           # [32, 1, 28, 28] → [32, 784]
            nn.Linear(n_inputs, n_hidden1), nn.ReLU(),
            nn.Linear(n_hidden1, n_hidden2), nn.ReLU(),
            nn.Linear(n_hidden2, n_classes))        # NO softmax: outputs logits

    def forward(self, X):
        return self.mlp(X)

model = ImageClassifier(28 * 28, 300, 100, 10).to(device)
xentropy = nn.CrossEntropyLoss()                    # takes LOGITS + class indices
# ≈ 92.8% train / 87.2% validation accuracy on Fashion MNIST → slight overfitting
```

**Which loss? A standard interview question:**

| Task | Output layer | Loss | Probabilities at inference |
|---|---|---|---|
| Multiclass | K logits (no activation) | **`nn.CrossEntropyLoss`** (applies log-softmax internally; stable and fast) | `F.softmax(logits, dim=1)` |
| Multiclass (alternative) | `nn.LogSoftmax` | `nn.NLLLoss` | `exp(log_probs)` |
| Binary | 1 logit | **`nn.BCEWithLogitsLoss`** (applies sigmoid internally, stable) | `torch.sigmoid(logit)` |
| Binary (alternative, less stable) | `nn.Sigmoid` | `nn.BCELoss` | the output itself |
| Multilabel | 1 logit per label | `nn.BCEWithLogitsLoss` | sigmoid per label |
| Regression | 1 per target | `nn.MSELoss`, `nn.HuberLoss`, `nn.L1Loss` | — |

**Why no softmax in the model?** Computing cross-entropy straight from logits skips exponentials and logs that cancel out, and is more numerically stable (the **log-sum-exp** trick). The price is that you must apply softmax or sigmoid yourself when you want probabilities.

<figure class="dia"><svg viewBox="0 0 720 240" role="img" aria-label="Logits 2, 0.5 and minus 1 become softmax probabilities 0.786, 0.175 and 0.039; with true class 0 the cross-entropy loss is 0.241, the same as logsumexp minus the true logit. A naive softmax of logits 1000 and 999 in float32 overflows to NaN, while subtracting the maximum first gives 0.731 and 0.269">
<text class="sM" x="14" y="18">one example, true class = 0</text>
<text class="sC" x="70" y="58" text-anchor="end">class 0</text>
<rect class="sB" x="80" y="40" width="90" height="26" rx="4"/><text class="sC" x="125" y="58" text-anchor="middle">z = 2</text>
<line class="sLm" x1="170" y1="53" x2="196" y2="53" marker-end="url(#ahm)"/>
<rect class="sG" x="200" y="44" width="94.2716" height="18" rx="3"/><text class="sC" x="300.272" y="58">p = 0.786</text>
<text class="sC" x="70" y="92" text-anchor="end">class 1</text>
<rect class="sB" x="80" y="74" width="90" height="26" rx="4"/><text class="sC" x="125" y="92" text-anchor="middle">z = 0.5</text>
<line class="sLm" x1="170" y1="87" x2="196" y2="87" marker-end="url(#ahm)"/>
<rect class="sN" x="200" y="78" width="21.0348" height="18" rx="3"/><text class="sC" x="227.035" y="92">p = 0.175</text>
<text class="sC" x="70" y="126" text-anchor="end">class 2</text>
<rect class="sB" x="80" y="108" width="90" height="26" rx="4"/><text class="sC" x="125" y="126" text-anchor="middle">z = -1</text>
<line class="sLm" x1="170" y1="121" x2="196" y2="121" marker-end="url(#ahm)"/>
<rect class="sN" x="200" y="112" width="4.69351" height="18" rx="3"/><text class="sC" x="210.694" y="126">p = 0.039</text>
<text class="sS" x="125" y="36" text-anchor="middle">logits</text><text class="sS" x="260" y="36" text-anchor="middle">softmax</text>
<text class="sGt" x="14" y="160">CrossEntropyLoss = −log p₀ = 0.241</text>
<text class="sC" x="14" y="180">= logsumexp(z) − z₀ = 2.241 − 2</text><text class="sS" x="14" y="198">computed straight from the logits</text>
<rect class="sN" x="390" y="30" width="316" height="176" rx="8"/><text class="sT" x="548" y="52" text-anchor="middle">logits [1000, 999] in float32</text>
<text class="sS" x="402" y="82" xml:space="preserve" style="white-space:pre">exp(z) / exp(z).sum()</text><text class="sRt" x="694" y="82" text-anchor="end">→ nan, nan</text>
<text class="sS" x="402" y="100">exp(1000) overflows to inf; inf / inf = nan</text>
<text class="sS" x="402" y="134" xml:space="preserve" style="white-space:pre">exp(z − max z) / sum</text><text class="sGt" x="694" y="134" text-anchor="end">→ 0.731, 0.269</text>
<text class="sS" x="402" y="152">the log-sum-exp shift: same answer, no overflow</text>
<text class="sS" x="402" y="180">class weights for 900 / 700 / 400 rows:</text><text class="sC" x="402" y="196">0.2205, 0.2835, 0.4961</text>
<text class="sS" x="360" y="228" text-anchor="middle">so the model ends in plain Linear (logits) and the loss does softmax + log + NLL in one stable step</text>
</svg><figcaption>Why CrossEntropyLoss wants raw logits: the maths is the same, the numerics are not. Computed with NumPy.</figcaption></figure>

**Imbalanced classes:** `nn.CrossEntropyLoss(weight=torch.tensor([...]))`. Géron's example with classes of 900/700/400: weights ∝ 2000/900, 2000/700, 2000/400, normalised to **[0.2205, 0.2835, 0.4961]**. For binary: `nn.BCEWithLogitsLoss(pos_weight=torch.tensor([neg/pos]))`.

**Top-k predictions:** `torch.topk(logits, k=4, dim=1)`, then softmax on the values.

**TorchVision data loading:** `torchvision.datasets.FashionMNIST(..., transform=T.Compose( [T.ToImage(), T.ToDtype(torch.float32, scale=True)]))`, then `torch.utils.data.random_split(data, [55_000, 5_000])` for train/validation. PyTorch uses **channels-first** images: [C, H, W].

---

## 11.14 Hyperparameter tuning with Optuna 🟡

> [!info] 📖 Géron Ch. 10 · “Fine-Tuning NN Hyperparameters with Optuna” · pp. 352–356

Grid search is too expensive for neural networks. You *could* wrap the model for sklearn (**skorch**), but a dedicated tuner usually does better: **Optuna**, Ray Tune or Hyperopt.

```python
import optuna

def objective(trial, train_loader, valid_loader):
    learning_rate = trial.suggest_float("learning_rate", 1e-5, 1e-1, log=True)  # log scale
    n_hidden = trial.suggest_int("n_hidden", 20, 300)
    model = ImageClassifier(28 * 28, n_hidden, n_hidden, 10).to(device)
    optimizer = torch.optim.SGD(model.parameters(), lr=learning_rate)
    for epoch in range(n_epochs):
        ...                                           # train one epoch
        val_acc = ...                                 # evaluate
        trial.report(val_acc, epoch)                  # enables pruning
        if trial.should_prune():
            raise optuna.TrialPruned()
    return val_acc

from functools import partial
study = optuna.create_study(direction="maximize",
                            sampler=optuna.samplers.TPESampler(seed=42),
                            pruner=optuna.pruners.MedianPruner(n_startup_trials=5,
                                                               n_warmup_steps=0,
                                                               interval_steps=1))
study.optimize(partial(objective, train_loader=train_loader,
                       valid_loader=valid_loader), n_trials=50)
study.best_params, study.best_value
```

- **`log=True`** for scale-type hyperparameters (learning rate, regularisation). A uniform distribution would almost never try tiny values.

<figure class="dia"><svg viewBox="0 0 720 188" role="img" aria-label="Forty learning rates sampled between 1e-5 and 1e-1: uniform sampling puts nearly all of them between 1e-2 and 1e-1, while log-uniform sampling spreads them evenly across the four decades">
<text class="sT" x="70" y="54" text-anchor="end">uniform</text><line class="sLm" x1="80" y1="50" x2="640" y2="50"/>
<circle class="sPw" cx="612.6" cy="54.1" r="3.5" opacity=".8"/>
<circle class="sPw" cx="560.4" cy="50.0" r="3.5" opacity=".8"/>
<circle class="sPw" cx="445.9" cy="50.5" r="3.5" opacity=".8"/>
<circle class="sPw" cx="390.9" cy="54.6" r="3.5" opacity=".8"/>
<circle class="sPw" cx="627.4" cy="48.6" r="3.5" opacity=".8"/>
<circle class="sPw" cx="634.5" cy="53.8" r="3.5" opacity=".8"/>
<circle class="sPw" cx="609.6" cy="53.4" r="3.5" opacity=".8"/>
<circle class="sPw" cx="620.8" cy="56.9" r="3.5" opacity=".8"/>
<circle class="sPw" cx="602.9" cy="43.8" r="3.5" opacity=".8"/>
<circle class="sPw" cx="635.9" cy="53.7" r="3.5" opacity=".8"/>
<circle class="sPw" cx="627.6" cy="56.8" r="3.5" opacity=".8"/>
<circle class="sPw" cx="283.4" cy="57.5" r="3.5" opacity=".8"/>
<circle class="sPw" cx="630.6" cy="42.2" r="3.5" opacity=".8"/>
<circle class="sPw" cx="433.8" cy="55.8" r="3.5" opacity=".8"/>
<circle class="sPw" cx="620.8" cy="57.7" r="3.5" opacity=".8"/>
<circle class="sPw" cx="534.3" cy="57.3" r="3.5" opacity=".8"/>
<circle class="sPw" cx="631.1" cy="44.4" r="3.5" opacity=".8"/>
<circle class="sPw" cx="602.7" cy="57.6" r="3.5" opacity=".8"/>
<circle class="sPw" cx="566.8" cy="56.2" r="3.5" opacity=".8"/>
<circle class="sPw" cx="587.7" cy="55.2" r="3.5" opacity=".8"/>
<circle class="sPw" cx="423.5" cy="49.7" r="3.5" opacity=".8"/>
<circle class="sPw" cx="513.3" cy="45.7" r="3.5" opacity=".8"/>
<circle class="sPw" cx="615.7" cy="54.8" r="3.5" opacity=".8"/>
<circle class="sPw" cx="613.5" cy="56.8" r="3.5" opacity=".8"/>
<circle class="sPw" cx="610.5" cy="46.3" r="3.5" opacity=".8"/>
<circle class="sPw" cx="581.8" cy="50.6" r="3.5" opacity=".8"/>
<circle class="sPw" cx="639.8" cy="49.1" r="3.5" opacity=".8"/>
<circle class="sPw" cx="638.8" cy="56.9" r="3.5" opacity=".8"/>
<circle class="sPw" cx="617.0" cy="42.6" r="3.5" opacity=".8"/>
<circle class="sPw" cx="613.9" cy="53.7" r="3.5" opacity=".8"/>
<circle class="sPw" cx="617.3" cy="51.8" r="3.5" opacity=".8"/>
<circle class="sPw" cx="582.6" cy="42.5" r="3.5" opacity=".8"/>
<circle class="sPw" cx="518.3" cy="53.5" r="3.5" opacity=".8"/>
<circle class="sPw" cx="620.2" cy="42.3" r="3.5" opacity=".8"/>
<circle class="sPw" cx="600.9" cy="54.1" r="3.5" opacity=".8"/>
<circle class="sPw" cx="568.9" cy="50.2" r="3.5" opacity=".8"/>
<circle class="sPw" cx="596.1" cy="56.9" r="3.5" opacity=".8"/>
<circle class="sPw" cx="632.9" cy="43.1" r="3.5" opacity=".8"/>
<circle class="sPw" cx="635.9" cy="55.5" r="3.5" opacity=".8"/>
<circle class="sPw" cx="577.5" cy="43.1" r="3.5" opacity=".8"/>
<text class="sRt" x="706" y="54" text-anchor="end">2% below 1e-3</text>
<text class="sT" x="70" y="114" text-anchor="end">log=True</text><line class="sLm" x1="80" y1="110" x2="640" y2="110"/>
<circle class="sPg" cx="400.1" cy="107.5" r="3.5" opacity=".8"/>
<circle class="sPg" cx="260.2" cy="108.9" r="3.5" opacity=".8"/>
<circle class="sPg" cx="412.8" cy="117.5" r="3.5" opacity=".8"/>
<circle class="sPg" cx="269.2" cy="111.0" r="3.5" opacity=".8"/>
<circle class="sPg" cx="299.3" cy="106.1" r="3.5" opacity=".8"/>
<circle class="sPg" cx="578.6" cy="105.9" r="3.5" opacity=".8"/>
<circle class="sPg" cx="207.2" cy="116.2" r="3.5" opacity=".8"/>
<circle class="sPg" cx="429.0" cy="105.6" r="3.5" opacity=".8"/>
<circle class="sPg" cx="127.0" cy="104.0" r="3.5" opacity=".8"/>
<circle class="sPg" cx="546.3" cy="106.6" r="3.5" opacity=".8"/>
<circle class="sPg" cx="520.8" cy="111.4" r="3.5" opacity=".8"/>
<circle class="sPg" cx="214.0" cy="110.9" r="3.5" opacity=".8"/>
<circle class="sPg" cx="570.8" cy="115.0" r="3.5" opacity=".8"/>
<circle class="sPg" cx="112.8" cy="111.0" r="3.5" opacity=".8"/>
<circle class="sPg" cx="268.2" cy="106.6" r="3.5" opacity=".8"/>
<circle class="sPg" cx="164.2" cy="108.6" r="3.5" opacity=".8"/>
<circle class="sPg" cx="332.2" cy="115.1" r="3.5" opacity=".8"/>
<circle class="sPg" cx="525.9" cy="112.0" r="3.5" opacity=".8"/>
<circle class="sPg" cx="209.2" cy="117.3" r="3.5" opacity=".8"/>
<circle class="sPg" cx="109.1" cy="107.9" r="3.5" opacity=".8"/>
<circle class="sPg" cx="306.5" cy="110.8" r="3.5" opacity=".8"/>
<circle class="sPg" cx="191.2" cy="111.5" r="3.5" opacity=".8"/>
<circle class="sPg" cx="130.8" cy="115.6" r="3.5" opacity=".8"/>
<circle class="sPg" cx="405.0" cy="104.3" r="3.5" opacity=".8"/>
<circle class="sPg" cx="247.3" cy="108.5" r="3.5" opacity=".8"/>
<circle class="sPg" cx="456.3" cy="116.6" r="3.5" opacity=".8"/>
<circle class="sPg" cx="191.7" cy="102.7" r="3.5" opacity=".8"/>
<circle class="sPg" cx="607.6" cy="115.2" r="3.5" opacity=".8"/>
<circle class="sPg" cx="284.5" cy="108.6" r="3.5" opacity=".8"/>
<circle class="sPg" cx="139.1" cy="115.3" r="3.5" opacity=".8"/>
<circle class="sPg" cx="432.3" cy="102.2" r="3.5" opacity=".8"/>
<circle class="sPg" cx="599.2" cy="107.8" r="3.5" opacity=".8"/>
<circle class="sPg" cx="326.6" cy="103.3" r="3.5" opacity=".8"/>
<circle class="sPg" cx="614.6" cy="112.4" r="3.5" opacity=".8"/>
<circle class="sPg" cx="359.9" cy="106.4" r="3.5" opacity=".8"/>
<circle class="sPg" cx="318.1" cy="113.2" r="3.5" opacity=".8"/>
<circle class="sPg" cx="427.3" cy="117.1" r="3.5" opacity=".8"/>
<circle class="sPg" cx="637.3" cy="104.0" r="3.5" opacity=".8"/>
<circle class="sPg" cx="611.4" cy="115.8" r="3.5" opacity=".8"/>
<circle class="sPg" cx="337.6" cy="103.0" r="3.5" opacity=".8"/>
<text class="sGt" x="706" y="114" text-anchor="end">57% below 1e-3</text>
<text class="sS" x="80" y="150" text-anchor="middle">1e-5</text><line class="sLm" x1="80" y1="36" x2="80" y2="140" opacity=".2"/>
<text class="sS" x="220" y="150" text-anchor="middle">1e-4</text><line class="sLm" x1="220" y1="36" x2="220" y2="140" opacity=".2"/>
<text class="sS" x="360" y="150" text-anchor="middle">1e-3</text><line class="sLm" x1="360" y1="36" x2="360" y2="140" opacity=".2"/>
<text class="sS" x="500" y="150" text-anchor="middle">1e-2</text><line class="sLm" x1="500" y1="36" x2="500" y2="140" opacity=".2"/>
<text class="sS" x="640" y="150" text-anchor="middle">1e-1</text><line class="sLm" x1="640" y1="36" x2="640" y2="140" opacity=".2"/>
<text class="sM" x="360" y="22" text-anchor="middle">40 sampled learning rates on a log axis</text>
<text class="sS" x="360" y="176" text-anchor="middle">uniform sampling spends almost every trial in the top decade; log=True gives each decade equal attention</text>
</svg><figcaption>Why suggest_float(..., log=True) for learning rates: the interesting range spans orders of magnitude. Sampled with NumPy.</figcaption></figure>

- **TPE** (Tree-structured Parzen Estimator) is *sequential model-based optimisation*: it starts random, then concentrates on promising regions. It beats random search for the same budget.
- **Pruning** (`MedianPruner`): stop trials performing below the median of earlier trials at the same epoch. That saves much of the compute.

<figure class="dia"><svg viewBox="0 0 720 238" role="img" aria-label="Twelve simulated training curves with median pruning: after the first five trials, any trial whose validation accuracy falls below the median of earlier trials at the same epoch is stopped, saving a large share of epochs while the best trial still runs to completion">
<line class="sLm" x1="70" y1="190" x2="520" y2="190"/><line class="sLm" x1="70" y1="190" x2="70" y2="24"/>
<text class="sS" x="64" y="155.905" text-anchor="end">0.6</text>
<text class="sS" x="64" y="117.81" text-anchor="end">0.7</text>
<text class="sS" x="64" y="79.7143" text-anchor="end">0.8</text>
<text class="sS" x="64" y="41.619" text-anchor="end">0.9</text>
<text class="sS" x="70" y="206" text-anchor="middle">epoch 1</text>
<text class="sS" x="265.556" y="206" text-anchor="middle">epoch 5</text>
<text class="sS" x="510" y="206" text-anchor="middle">epoch 10</text>
<polyline class="sL" points="70.0,163.1 118.9,143.2 167.8,127.7 216.7,124.6 265.6,119.0 314.4,112.5 363.3,114.3 412.2,111.3 461.1,107.5 510.0,107.5" style="stroke-width:1.4" opacity="1"/>
<polyline class="sL" points="70.0,155.3 118.9,132.1 167.8,126.3 216.7,108.7 265.6,107.6 314.4,105.7 363.3,99.0 412.2,96.6 461.1,98.3 510.0,99.2" style="stroke-width:1.4" opacity="1"/>
<polyline class="sLg" points="70.0,135.3 118.9,102.5 167.8,79.4 216.7,69.0 265.6,63.1 314.4,56.7 363.3,57.1 412.2,57.2 461.1,52.8 510.0,52.3" style="stroke-width:2.6" opacity="1"/>
<polyline class="sL" points="70.0,137.1 118.9,108.7 167.8,89.8 216.7,86.8 265.6,74.4 314.4,71.9 363.3,75.2 412.2,70.4 461.1,72.3 510.0,68.1" style="stroke-width:1.4" opacity="1"/>
<polyline class="sL" points="70.0,170.1 118.9,150.2 167.8,134.2 216.7,124.6 265.6,126.1 314.4,118.0 363.3,113.1 412.2,113.1 461.1,106.6 510.0,111.9" style="stroke-width:1.4" opacity="1"/>
<polyline class="sL" points="70.0,147.8 118.9,125.3 167.8,103.7 216.7,97.1 265.6,91.7 314.4,91.0 363.3,80.8 412.2,81.5 461.1,80.6 510.0,79.1" style="stroke-width:1.4" opacity="1"/>
<polyline class="sL" points="70.0,145.3 118.9,120.8 167.8,104.8 216.7,94.8 265.6,83.7 314.4,86.5 363.3,82.2 412.2,80.2 461.1,78.1 510.0,76.8" style="stroke-width:1.4" opacity="1"/>
<polyline class="sLr" points="70.0,166.6" style="stroke-width:1.4" opacity="0.8"/>
<circle class="sPr" cx="70.0" cy="166.6" r="3.5"/>
<polyline class="sLr" points="70.0,162.5" style="stroke-width:1.4" opacity="0.8"/>
<circle class="sPr" cx="70.0" cy="162.5" r="3.5"/>
<polyline class="sLr" points="70.0,153.5 118.9,130.0" style="stroke-width:1.4" opacity="0.8"/>
<circle class="sPr" cx="118.9" cy="130.0" r="3.5"/>
<polyline class="sLr" points="70.0,153.7 118.9,136.6" style="stroke-width:1.4" opacity="0.8"/>
<circle class="sPr" cx="118.9" cy="136.6" r="3.5"/>
<polyline class="sLr" points="70.0,151.6 118.9,129.2 167.8,114.4" style="stroke-width:1.4" opacity="0.8"/>
<circle class="sPr" cx="167.8" cy="114.4" r="3.5"/>
<rect class="sN" x="540" y="40" width="166" height="140" rx="8"/>
<text class="sT" x="623" y="62" text-anchor="middle">12 trials, 10 epochs each</text>
<text class="sRt" x="623" y="88" text-anchor="middle">5 pruned early (red)</text>
<text class="sC" x="623" y="108" text-anchor="middle">79 of 120 epochs run</text>
<text class="sGt" x="623" y="128" text-anchor="middle">34% of compute saved</text>
<text class="sGt" x="623" y="160" text-anchor="middle">best trial kept (green)</text>
<text class="sS" x="360" y="226" text-anchor="middle">validation accuracy per epoch; from trial 6 on, a trial below the median of earlier trials is stopped</text>
</svg><figcaption>MedianPruner on simulated learning curves: weak trials stop early and the compute goes to promising ones.</figcaption></figure>

- **Parallel and persistent:** `create_study(storage="sqlite:///optuna.db", study_name="churn", load_if_exists=True)`, then run the same script on several machines, each with a different seed.
- After tuning, **retrain on train + validation** and evaluate once on test.
- Use the same Optuna pattern for **LightGBM and XGBoost** (Part 8B).

---

## 11.15 Saving, loading and compiling PyTorch models 🟡

> [!info] 📖 Géron Ch. 10 · “Saving and Loading”, “Compiling and Optimizing” · pp. 356–360

```python
# 1. The whole object: simple but fragile and INSECURE (pickle)
torch.save(model, "model.pt")
loaded = torch.load("model.pt", weights_only=False)   # custom classes must be importable

# 2. RECOMMENDED: the weights (state_dict) + the hyperparameters to rebuild the architecture
torch.save({"model_state_dict": model.state_dict(),
            "model_hyperparameters": {"n_inputs": 784, "n_hidden1": 300,
                                      "n_hidden2": 100, "n_classes": 10}},
           "model.pt")
data = torch.load("model.pt", weights_only=True)      # only tensors and plain data: safe
new_model = ImageClassifier(**data["model_hyperparameters"])
new_model.load_state_dict(data["model_state_dict"])
new_model.eval()                                       # !!! before inference
```

<figure class="dia"><svg viewBox="0 0 720 244" role="img" aria-label="The state_dict of an ImageClassifier with layers 784 to 300 to 100 to 10: six named tensors, weights and biases of three linear layers, about 266 thousand parameters, saved as roughly a megabyte of float32 data alongside the hyperparameters needed to rebuild the model">
<text class="sM" x="14" y="22">model.state_dict() for ImageClassifier(784, 300, 100, 10)</text>
<rect class="sN" x="14" y="32" width="420" height="22" rx="0"/><text class="sT" x="24" y="47">key</text><text class="sT" x="270" y="47">shape</text><text class="sT" x="424" y="47" text-anchor="end">values</text>
<rect class="sB" x="14" y="54" width="420" height="22" rx="0" opacity=".5"/><text class="sS" x="24" y="69" xml:space="preserve" style="white-space:pre">mlp.1.weight</text><text class="sS" x="270" y="69" xml:space="preserve" style="white-space:pre">[300, 784]</text><text class="sS" x="424" y="69" text-anchor="end">235,200</text>
<rect class="sA" x="14" y="76" width="420" height="22" rx="0" opacity=".5"/><text class="sS" x="24" y="91" xml:space="preserve" style="white-space:pre">mlp.1.bias</text><text class="sS" x="270" y="91" xml:space="preserve" style="white-space:pre">[300]</text><text class="sS" x="424" y="91" text-anchor="end">300</text>
<rect class="sB" x="14" y="98" width="420" height="22" rx="0" opacity=".5"/><text class="sS" x="24" y="113" xml:space="preserve" style="white-space:pre">mlp.3.weight</text><text class="sS" x="270" y="113" xml:space="preserve" style="white-space:pre">[100, 300]</text><text class="sS" x="424" y="113" text-anchor="end">30,000</text>
<rect class="sA" x="14" y="120" width="420" height="22" rx="0" opacity=".5"/><text class="sS" x="24" y="135" xml:space="preserve" style="white-space:pre">mlp.3.bias</text><text class="sS" x="270" y="135" xml:space="preserve" style="white-space:pre">[100]</text><text class="sS" x="424" y="135" text-anchor="end">100</text>
<rect class="sB" x="14" y="142" width="420" height="22" rx="0" opacity=".5"/><text class="sS" x="24" y="157" xml:space="preserve" style="white-space:pre">mlp.5.weight</text><text class="sS" x="270" y="157" xml:space="preserve" style="white-space:pre">[10, 100]</text><text class="sS" x="424" y="157" text-anchor="end">1,000</text>
<rect class="sA" x="14" y="164" width="420" height="22" rx="0" opacity=".5"/><text class="sS" x="24" y="179" xml:space="preserve" style="white-space:pre">mlp.5.bias</text><text class="sS" x="270" y="179" xml:space="preserve" style="white-space:pre">[10]</text><text class="sS" x="424" y="179" text-anchor="end">10</text>
<text class="sT" x="424" y="204" text-anchor="end">total 266,610 parameters</text>
<rect class="sN" x="460" y="40" width="246" height="150" rx="8"/>
<text class="sC" x="583" y="62" text-anchor="middle">torch.save({...}, "model.pt")</text>
<text class="sGt" x="583" y="86" text-anchor="middle">1,044 KB on disk (float32)</text>
<text class="sS" x="583" y="114" text-anchor="middle">just named tensors + a dict of</text><text class="sS" x="583" y="130" text-anchor="middle">hyperparameters: safe to load</text><text class="sS" x="583" y="146" text-anchor="middle">with weights_only=True</text>
<text class="sS" x="583" y="166" text-anchor="middle">keys skip 0, 2, 4: Flatten and ReLU</text><text class="sS" x="583" y="182" text-anchor="middle">own no parameters</text>
<text class="sS" x="360" y="232" text-anchor="middle">rebuild the class from the hyperparameters, then load_state_dict: no pickled code ever runs</text>
</svg><figcaption>What the recommended save actually writes, from a real PyTorch model: parameter tensors by name, nothing executable.</figcaption></figure>

- **Why not pickle the whole model?** Pickle can **execute arbitrary code on load** (the same warning as `joblib` in Part 7 §7.12). It is also brittle across Python versions and folder layouts. `state_dict` (parameters plus **buffers**, e.g. batch-norm running statistics) with `weights_only=True` is data only.
- To **resume training**, also save the optimizer's `state_dict`, the epoch and the loss history.
- Hugging Face's **`safetensors`** format is another safe option.

**Speed and portability:**

| Tool | What it does | Notes |
|---|---|---|
| `torch.jit.trace(model, example)` | Runs the model once and records the operations | Only captures the branch and loop iterations actually executed |
| `torch.jit.script(model)` | Parses the Python into TorchScript | Supports `if`/`while` on tensors; a restricted Python subset |
| `torch.jit.optimize_for_inference` | Fusion, constant folding | Inference only. TorchScript runs in **C++ (LibTorch)**. Maintenance mode now |
| **`torch.compile(model)`** | JIT compilation via **TorchDynamo** (bytecode capture) + **TorchInductor** (Triton GPU kernels / OpenMP CPU) | The PyTorch 2.x way. One line |
| `torch.onnx.export` | Exports to the **ONNX** standard | Run with ONNX Runtime in many environments, **including .NET** (`Microsoft.ML.OnnxRuntime`), which matters given your ASP.NET background |

---

> [!check] ✅ Key takeaways
> - A neuron = weighted sum + bias + non-linearity; without non-linear activations, depth adds nothing.
> - Backpropagation = the chain rule applied backwards to get every weight's gradient.
> - The PyTorch step: forward → loss → `zero_grad` → `backward` → `step`; switch `train()`/`eval()`.
> - `CrossEntropyLoss` takes raw logits; average MSE over batches, then take the root for RMSE.
> - Control overfitting with early stopping, dropout and weight decay; tune with Optuna.
> - On tabular data, gradient boosting usually beats an MLP — say so in interviews.

## 11.16 Interview drill — neural networks and PyTorch (Géron Ch. 9–10 exercises, answered) 🟢 ⭐

> [!info] 📖 Géron Ch. 9 · Exercises p. 313; Ch. 10 · Exercises p. 360

**1. Why was the sigmoid key to training the first MLPs?** The step function has zero gradient almost everywhere, so gradient descent can't move. The sigmoid is differentiable with a non-zero derivative everywhere, which made backprop possible.

**2. Three popular activation functions?** Sigmoid, tanh, ReLU (plus softmax for outputs, and GELU/Leaky ReLU).

**3. MLP with 10 inputs, a hidden layer of 50 ReLU neurons and 3 ReLU outputs. Shapes?** X: **[m, 10]**. W_h: **[10, 50]**, b_h: **[50]**. W_o: **[50, 3]**, b_o: **[3]**. Y: **[m, 3]**. **Y = ReLU(ReLU(X W_h + b_h) W_o + b_o)**. Parameters: 10·50+50 + 50·3+3 = **703**. (In PyTorch's `nn.Linear` the weight is stored transposed: [50, 10] and [3, 50].)

**4. What is backpropagation, and how does it differ from reverse-mode autodiff?** Autodiff is the *gradient computation* (one forward and one reverse pass). Backprop is the whole *training algorithm*: autodiff to get the gradients, then gradient-descent steps, repeated over mini-batches and epochs.

**5. Hyperparameters of a basic MLP, and what to change if it overfits?** Number of layers, neurons per layer, activations, initialisation, optimizer, learning rate (and schedule), batch size, epochs, regularisation (ℓ₂/weight decay, dropout), early stopping. If it overfits: fewer layers or neurons, more dropout or weight decay, early stopping, more data or augmentation.

**6. What does PyTorch add to NumPy?** GPU and other accelerator support, autograd, and a neural-network toolkit (`nn` modules, losses, optimizers, data loaders).

**7. `torch.exp()` vs `torch.exp_()`?** The underscore version is in place: it modifies the tensor instead of returning a new one.

**8. Two ways to create a tensor on the GPU?** `torch.tensor(..., device="cuda")`, or create it on the CPU and call `.to("cuda")` / `.cuda()`.

**9. Three ways to compute without autograd?** `with torch.no_grad():` (or `torch.inference_mode()`), `tensor.detach()`, and tensors with `requires_grad=False`.

**10. `nn.Linear(100, 200)`: neurons and shapes?** 200 neurons. weight **[200, 100]**, bias **[200]**. Input [batch, 100] → output [batch, 200]. 20,200 parameters.

**11. Main steps of a PyTorch training loop?** For each epoch: `model.train()`, then for each batch: move it to the device → forward → loss → `backward()` → `optimizer.step()` → `optimizer.zero_grad()`. Then evaluate with `model.eval()` and `torch.no_grad()`, track metrics, and early-stop or checkpoint.

**12. Why `model.train()` / `model.eval()`?** Dropout and batch-norm behave differently in the two modes. The wrong mode silently corrupts training or evaluation.

**13. Main classification losses?** `CrossEntropyLoss` (multiclass, logits), `BCEWithLogitsLoss` (binary and multilabel, logits), `NLLLoss` (after `LogSoftmax`), `BCELoss` (after `Sigmoid`, less stable).

**14. `torch.jit.trace` vs `torch.jit.script`?** Tracing records the operations executed for one example input, so data-dependent control flow is frozen. Scripting compiles the Python source, so control flow is preserved but the language is restricted.

**15. Compute ∇ sin(x²y) at (1.2, 3.4) with autograd.**
```python
x = torch.tensor(1.2, requires_grad=True); y = torch.tensor(3.4, requires_grad=True)
f = torch.sin(x**2 * y); f.backward(); x.grad, y.grad
# ∂f/∂x = 2xy·cos(x²y),  ∂f/∂y = x²·cos(x²y)
```

**More, frequently asked:**

- **"What are vanishing and exploding gradients?"** Gradients shrink (or grow) multiplicatively as they propagate back through many layers, especially with saturating activations (sigmoid/tanh) or poor initialisation. So early layers learn very slowly, or training diverges. Fixes: ReLU-family activations, He/Xavier initialisation, batch or layer normalisation, residual connections, gradient clipping, careful learning rates.
- **"Dropout: what does it do at train vs test time?"** In training it zeroes each activation with probability p and scales the survivors by 1/(1−p) (inverted dropout). At test time it does nothing. It effectively trains an ensemble of sub-networks.
- **"Batch normalisation?"** It normalises each layer's inputs over the mini-batch, then applies a learned scale and shift. It stabilises and speeds up training and allows higher learning rates. It keeps running mean/variance **buffers** for inference, which is why `eval()` matters.
- **"Adam vs SGD?"** Adam uses per-parameter adaptive learning rates plus momentum. It converges fast with little tuning. SGD with momentum and a good schedule sometimes generalises better on large vision models. AdamW (decoupled weight decay) is the modern default for transformers.
- **"When would you *not* use a neural network?"** Small or medium tabular data (gradient boosting wins, §11.7 and Part 8B), when strict interpretability is required, when latency or compute is tight, or when there is little data and no pretrained model to transfer from.
- **"How do you debug a network that won't learn?"** Overfit a single small batch first (it should reach ~0 loss); check that the data and labels line up; check that the scale and normalisation are right; check the output activation and loss pairing; check `zero_grad()`; sweep the learning rate; inspect gradient norms (NaN or zero); start from a simple baseline (Karpathy's "recipe").

---

## Further reading

- **Deep Learning with Python**, François Chollet (2nd ed.) — by the creator of Keras. The best introduction to the field, and it uses exactly this API.
- **Hands-On Machine Learning with Scikit-Learn and PyTorch**, Aurélien Géron (2025) — you already have three copies in `code/Assignments/AI_Project/`. Part II covers neural networks from scratch. The current edition uses PyTorch, which makes it doubly relevant.
- **Neural Networks and Deep Learning**, Michael Nielsen — free at http://neuralnetworksanddeeplearning.com/ — builds backpropagation from first principles. The chapter on why gradients vanish is the clearest explanation available.
- **3Blue1Brown, *Neural Networks*** (YouTube, 4 episodes) — the visual intuition for what backpropagation actually does.
- **PyTorch 60-Minute Blitz** — https://pytorch.org/tutorials/beginner/deep_learning_60min_blitz.html
- **Grinsztajn, Oyallon & Varoquaux (2022)**, *"Why do tree-based models still outperform deep learning on typical tabular data?"*, NeurIPS — the empirical case for §11.7.
- **Andrej Karpathy, "A Recipe for Training Neural Networks"** — https://karpathy.github.io/2019/04/25/recipe/ — practical debugging wisdom you will not find in textbooks.

---

<!-- nav -->
> [!example] 🧭 Step 14 of 26 · Stage 4 of 7: Applied ML
> ← [Part 10 · NLP & Arabic](10_NLP.md) · [Part 13 · Capstone](13_Capstone_Road_Accidents.md) → · [Course map](00_START_HERE.md)
<!-- /nav -->
