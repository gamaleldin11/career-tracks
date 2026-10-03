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
- **TPE** (Tree-structured Parzen Estimator) is *sequential model-based optimisation*: it starts random, then concentrates on promising regions. It beats random search for the same budget.
- **Pruning** (`MedianPruner`): stop trials performing below the median of earlier trials at the same epoch. That saves much of the compute.
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
