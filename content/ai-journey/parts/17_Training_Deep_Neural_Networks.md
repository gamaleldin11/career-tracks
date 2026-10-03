# Part 17 — Training Deep Neural Networks

<!-- nav -->
> [!example] 🧭 Step 16 of 26 · Stage 5 of 7: Deep learning
> ← [Part 13 · Capstone](13_Capstone_Road_Accidents.md) · [Part 18 · CNNs & vision](18_Computer_Vision_CNNs.md) → · [Course map](00_START_HERE.md)
<!-- /nav -->

**Source:** Géron, *Hands-On Machine Learning with Scikit-Learn and PyTorch* (O'Reilly, 2025), **Chapter 11** "Training Deep Neural Networks", **Appendix A** "Autodiff", and **Appendix B** "Mixed Precision and Quantization". Each section ends with a **🔭 State of the art** box that carries the topic forward to how large models are trained in 2025–2026.

**Where this sits:** Part 11 taught you what a neural network is and how to write a PyTorch training loop. This part is about what goes wrong when networks get **deep** and **large**, and the toolkit that fixes it. Every modern model uses it, from a 3-layer churn MLP to a 70-billion-parameter LLM.

Géron lists four problems with deep networks:
1. **Unstable gradients:** they vanish or explode as they flow backwards, so lower layers don't learn (§17.1).
2. **Not enough labelled data** for a big network (§17.2).
3. **Slow training** (§17.3–17.4, §17.7).
4. **Overfitting**, with millions or billions of parameters (§17.5).

<!-- interview-focus -->

> [!tip] 🎯 Interview focus
> **Why it matters:** "Your network isn't learning — what do you check?" is the classic deep-learning question. This part is the checklist.
>
> | Level | What you should be able to do |
> |---|---|
> | 🟢 **Entry** | Know the one-liners: vanishing gradients and why ReLU helps, Adam vs SGD, dropout, early stopping, transfer learning. |
> | 🟡 **Mid** | Initialisation (He/Glorot), BatchNorm vs LayerNorm, gradient clipping, LR schedules and warm-up, fine-tuning strategy, Géron's default configuration. |
> | 🔴 **Senior** | Mixed precision, quantisation (PTQ/QAT, 4-bit, QLoRA), memory/compute budgeting, debugging training at scale. |
>
> **⭐ Most-asked:** *What causes vanishing/exploding gradients, and how do you fix them?* · *Adam vs SGD with momentum?* · *BatchNorm vs LayerNorm?* · *How does dropout work — and why is it off at inference?* · *How do you fine-tune a pretrained model on a small dataset?*
>
> **⏱ Time:** 4 h  ·  **Short on time?** Read §17.1, §17.2, §17.3, §17.5, §17.6.

**Legend:** 🟢 Entry (0–2 yrs) · 🟡 Mid (2–5 yrs) · 🔴 Senior / specialist · ⭐ frequently asked · 📖 Géron, *Hands-On ML with Scikit-Learn and PyTorch* (2025) pages

> [!abstract]- 🗺️ Section map — level and book pages
>
> | § | Section | Level | 📖 Book |
> |---|---|:---:|---|
> | 17.1 | Vanishing and exploding gradients | 🟡 ⭐ | Ch. 11 · pp. 364–383 |
> | 17.2 | Reusing pretrained layers — transfer learning | 🟡 ⭐ | Ch. 11 · pp. 383–389 |
> | 17.3 | Faster optimisers | 🟡 ⭐ | Ch. 11 · pp. 389–398 |
> | 17.4 | Learning-rate scheduling | 🟡 | Ch. 11 · pp. 398–405 |
> | 17.5 | Regularisation for deep networks | 🟡 ⭐ | Ch. 11 · pp. 405–413 |
> | 17.6 | Géron's default configuration (memorise this table) | 🟡 ⭐ | Ch. 11 · pp. 413–414 |
> | 17.7 | Mixed precision and quantization (Appendix B) | 🔴 | Appendix B · p. 795 onward |
> | 17.8 | Autodiff — how `loss.backward()` really works (Appendix A) | 🟡 | Appendix A · p. 787 onward |
> | 17.9 | Real-world examples | 🟡 | — |
> | 17.10 | Interview drill — training deep networks | 🟡 ⭐ | Ch. 11 · p. 414 |
>

---

## 17.1 Vanishing and exploding gradients 🟡 ⭐

> [!info] 📖 Géron Ch. 11 · “The Vanishing/Exploding Gradients Problems” → “Gradient Clipping” · pp. 364–383

![Gradients multiply layer by layer. Slopes below 1 vanish; slopes above 1 explode.](figures/fig17_vanishing_gradients.png)
*Gradients multiply layer by layer. Slopes below 1 vanish; slopes above 1 explode.*

![ReLU-family activations keep a slope of 1 for positive inputs.](figures/fig11_activations.png)
*ReLU-family activations keep a slope of 1 for positive inputs.*

> [!quote] 💬 Say it in the interview
> “Gradients multiply through layers, so they vanish or explode. The fixes: He/Glorot initialisation, ReLU-family activations, batch or layer normalisation, residual connections and gradient clipping.”

### What happens

Backprop multiplies local derivatives layer by layer (the chain rule, §17.8). If each factor is < 1, the product **shrinks exponentially** with depth (vanishing). If each is
> 1, it **grows exponentially** (exploding, especially in RNNs, Part 19). The lower layers
then barely change, or training diverges into NaN. Different layers learn at wildly different speeds.

This is **why deep networks were largely abandoned in the early 2000s**. Glorot & Bengio (2010) identified the culprits: the **sigmoid** activation plus the then-standard **𝒩(0, 1) initialisation**. The variance of the outputs grew layer after layer until the sigmoids **saturated** at 0 or 1, where their derivative is ≈ 0, so almost no gradient flowed back. The sigmoid's mean of 0.5 (not 0) made it worse.

### Fix 1 — Initialisation that preserves variance

The goal: the **variance of each layer's outputs ≈ the variance of its inputs**, forwards *and* backwards. Géron's analogy is a chain of microphone amplifiers, each of which must output at the level it received, or the voice either fades or distorts.

With fan_in = number of inputs, fan_out = number of outputs, fan_avg = (fan_in + fan_out)/2:

| Initialisation | Activations | Normal variance σ² | Uniform range ±r |
|---|---|---|---|
| **Xavier / Glorot** (2010) | None, tanh, sigmoid, softmax | 1 / fan_avg | r = √(3σ²) = √(3/fan_avg) |
| **He / Kaiming** (2015) | **ReLU and variants**: Leaky ReLU, ELU, GELU, Swish, Mish, SwiGLU, ReLU² | **2 / fan_in** | √(6/fan_in) |
| **LeCun** (1990s) | SELU | 1 / fan_in | √(3/fan_in) |

```python
import torch, torch.nn as nn

def use_he_init(module):
    if isinstance(module, nn.Linear):
        nn.init.kaiming_uniform_(module.weight)      # nonlinearity="relu" by default
        nn.init.zeros_(module.bias)                  # zero biases are fine (symmetry is
                                                     # already broken by the random weights)
model = nn.Sequential(nn.Linear(50, 40), nn.ReLU(), nn.Linear(40, 1))
model.apply(use_he_init)                             # .apply() visits every submodule
```

Details worth knowing:
- ⚠️ PyTorch's `nn.Linear` default init is Kaiming-uniform **scaled down by √6**, a historical choice that is optimal for no common activation (PyTorch issue #18182, open since 2019). For deep ReLU networks, initialise explicitly.
- For Leaky ReLU, pass the slope: `nn.init.kaiming_uniform_(w, a=0.2, nonlinearity="leaky_relu")`.
- **Orthogonal init** (`nn.init.orthogonal_`, Saxe et al. 2014) preserves vector norms. It is useful for RNNs and GANs.
- **Scale down the output layer at init** (e.g. ÷10) in classifiers. Smaller initial logits mean less confident early predictions, which avoids huge early losses and gradients.

### Fix 2 — Better activation functions

| Function | Formula | Pros | Cons / notes |
|---|---|---|---|
| ReLU | max(0, z) | Fast, no saturation for z > 0, sparse | **Dying ReLU**: a neuron whose input is negative for every training instance outputs 0 forever |
| Leaky ReLU | max(αz, z) | Never dies ("long coma"). Xu et al. (2015): α = 0.2 beat 0.01 | Kink at 0 |
| RReLU / PReLU | Random α / learned α | PReLU strong on large image data | PReLU can overfit small data |
| ELU | α(eᶻ − 1) for z < 0 | Negative outputs give a mean near 0; smooth if α = 1 | Slower (exponential) |
| SELU | ≈1.05·ELU, α ≈ 1.67 | **Self-normalising** plain MLPs | Needs standardised inputs, LeCun-normal init, a plain dense stack, and no BN/dropout/ℓ₁/ℓ₂ (use alpha dropout). Rarely used now |
| **GELU** | z·Φ(z) ≈ z·σ(1.702z) | Smooth, non-monotonic. Standard in BERT/GPT-2-era transformers | More compute |
| **Swish / SiLU** | z·σ(βz) | Often beats ReLU on complex tasks. β can be learned | More compute |
| **SwiGLU** | Swish(z₁) ⊗ z₂ (split a doubled linear output) | **Gating**: learns to switch features off or amplify them. **Standard in modern LLMs** (Llama, Mistral, Qwen…) | ~1.5× the FFN parameters for the same width |
| Mish | z·tanh(softplus(z)) | Marginal gains over Swish/GELU | Compute |
| ReLU² | max(0, z)² | Found by Google's Primer search. Great for sparse models | Can be less stable |
| Hard-* | Piecewise-linear approximations | Fast on mobile (`nn.Hardswish`) | Slight accuracy cost |

**Géron's advice:** ReLU is still a good default (fast, hardware-optimised). Swish for complex tasks. SwiGLU/Mish if you can afford the compute. Leaky ReLU or ReLU² when latency matters.

```python
import torch.nn.functional as F
class SwiGLU(nn.Module):
    def __init__(self, d_in, d_hidden):
        super().__init__()
        self.proj = nn.Linear(d_in, 2 * d_hidden)      # doubled output
    def forward(self, x):
        z1, z2 = self.proj(x).chunk(2, dim=-1)
        return F.silu(z1) * z2                          # gate × value
```

### Fix 3 — Batch Normalization (BN)

Ioffe & Szegedy (2015). For each mini-batch, per feature:

> μ_B = mean, σ²_B = variance over the batch → x̂ = (x − μ_B)/√(σ²_B + ε) → **z = γ ⊗ x̂ + β**

- **γ (scale) and β (shift) are learned** by backprop. The layer learns the best scale and mean for each input.
- **Inference problem:** there may be no batch, or a tiny one. So BN keeps **running averages** of μ and σ² during training (the buffers `running_mean` and `running_var`) and uses them in `eval()` mode. **Forgetting `model.eval()` is one of the most common PyTorch bugs.**
- **Results reported in the paper:** the same accuracy in **14× fewer steps**, much less sensitivity to initialisation, much larger learning rates, even sigmoid/tanh became trainable, and an ensemble reached 4.9% top-5 ImageNet error, better than human raters. It also **regularises** (per-batch noise).
- **Inference cost can be removed:** after training, fuse BN into the preceding layer: W′ = γ⊗W/σ, b′ = γ⊗(b − μ)/σ + β. `torch.jit.optimize_for_inference` and `torch.ao.quantization.fuse_modules` do this.
- Before or after the activation? The paper says before. It is debated, so try both. If BN comes right after a Linear layer, set that layer's `bias=False` (BN already has β).
- **Momentum gotcha:** in PyTorch BN, `momentum` is the weight of the **new** batch (default 0.1). That is the opposite of the usual convention. Use ~0.01 for small batches.
- **1d / 2d / 3d:** `BatchNorm1d` takes [N, C] or [N, C, L]. Sequences arrive as [N, L, C], so permute them. `BatchNorm2d` normalises images per channel over (N, H, W). `BatchNorm3d` handles volumes (CT scans).
- **Weaknesses:** it depends on batch composition (bad with small or non-IID batches) and is awkward in RNNs. Hence…

### Fix 4 — Layer Normalization (LN)

Ba et al. (2016). Normalise **across the features of each instance**, not across the batch. There are no running statistics, it behaves **identically in training and inference**, it works with batch size 1, and it suits sequences.

```python
x = torch.randn(32, 3, 100, 200)
ln = nn.LayerNorm([3, 100, 200])   # normalise over the last dims, per instance
```

LN is the normaliser of **transformers**, and it is increasingly used in CNNs and diffusion models.

### Fix 5 — Gradient clipping

Pascanu et al. (2013). Mostly for RNNs and transformers:

```python
loss.backward()
nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)   # preserves the direction
optimizer.step(); optimizer.zero_grad()
```

`clip_grad_value_` clips each component and can **change the direction**: [0.9, 100] → [0.9, 1.0]. Norm clipping keeps the direction: → [0.009, 0.99995]. **Norm clipping at 1.0 is the near-universal LLM default.** Log the gradient norm: spikes are an early warning of instability.

> [!success] 🔭 State of the art — normalisation and architecture (2025–26)
> - **RMSNorm** (Zhang & Sennrich, 2019) drops the mean-centring and β, dividing by the root-mean-square only. It is cheaper and works as well. **Used by Llama, Mistral, Qwen, Gemma** and most open LLMs.
> - **Pre-norm** (normalise *before* each sub-layer, inside the residual branch) trains deep transformers far more stably than the original *post-norm*, so it is the default now. Some models add **QK-norm** (normalising queries and keys) to prevent attention logit blow-ups.
> - **Residual (skip) connections** (ResNet, Part 18) are the single biggest reason very deep networks train at all: gradients get an identity "highway". Every modern deep architecture has them.
> - **Init tricks for depth:** scale residual-branch output layers by 1/√(2·n_layers) (GPT-2), or use µP (*maximal update parametrisation*), so that hyperparameters tuned on a small model transfer to a large one. Used in several frontier labs' scaling work.

---

## 17.2 Reusing pretrained layers — transfer learning 🟡 ⭐

> [!info] 📖 Géron Ch. 11 · “Reusing Pretrained Layers” · pp. 383–389

> [!quote] 💬 Say it in the interview
> “With little data I reuse a pretrained network: freeze it, train a new head, then unfreeze the top layers with a lower learning rate.”

> *It is generally not a good idea to train a very large DNN from scratch without first trying to find an existing neural network that accomplishes a similar task.*

**Recipe:**
1. Take a network trained on a large, related task. **Replace the output layer.**
2. **Freeze** the reused layers (`requires_grad = False`) and train only the new head for a few epochs, so its random initial errors don't wreck the pretrained weights.
3. **Unfreeze** the top layers (or all of them), **lower the learning rate**, and fine-tune.
4. More similar tasks justify reusing more layers. More labelled data justifies unfreezing more.
5. Transfer works best when **low-level features match**. Phone photos → phone photos, yes. Phone photos → satellite or medical images, much less.

```python
import copy
reused = copy.deepcopy(model_A[:-1])                  # everything but the output layer
model_B = nn.Sequential(*reused, nn.Linear(100, 1)).to(device)
for layer in model_B[:-1]:
    for p in layer.parameters():
        p.requires_grad = False                        # freeze
# train a few epochs → unfreeze → lower LR → continue.
# Parameter groups give the new head a higher LR than the reused body:
opt = torch.optim.AdamW([{"params": model_B[:-1].parameters(), "lr": 1e-4},
                         {"params": model_B[-1].parameters(),  "lr": 1e-3}])
```

**Géron's honesty lesson.** His Fashion-MNIST transfer demo jumped from 71.6% to 92.5% accuracy, and then he admits he **"cheated"**: he tried many configurations and seeds until one looked good. Change the seed and the gain shrinks, vanishes or reverses. That is **p-hacking** (*"torturing the data until it confesses"*), and it is part of the reproducibility crisis. Transfer learning genuinely works with **deep CNNs and transformers** (Parts 18 and 21), not with small dense networks. Interview takeaway: **report results across several seeds and say how many configurations you tried.**

**Unsupervised pretraining:** plenty of unlabelled data, few labels, and no similar model available? Pretrain an autoencoder (Part 23), reuse its encoder, and fine-tune. Hinton's 2006 **greedy layer-wise pretraining** with RBMs revived deep learning. Today the whole model is pretrained in one shot.

**Pretraining on an auxiliary task:** train on a task with cheap labels, then reuse the layers. Face recognition with few photos per person → first train a "same person?" network on a big face dataset (VGGFace2). ⚠️ Géron notes that scraping faces from the web is likely **illegal**: copyright, platform terms, and consent laws in 40+ countries. For NLP, mask words and predict them. That is **self-supervised learning**, exactly how LLMs are pretrained (Part 21).

> [!success] 🔭 State of the art — transfer is now the default.
> Practically nobody trains vision or language models from scratch. You start from a **foundation model**: DINOv2 or CLIP for images, BERT or ModernBERT for text encoders, Llama, Qwen, Mistral or Gemma for generative text, Whisper for speech, TimesFM or Chronos for time series. Then you either use frozen embeddings with a small head, or fine-tune with **parameter-efficient fine-tuning (PEFT)**: LoRA or QLoRA (§17.7, Part 21). In Hugging Face this is a few lines (`AutoModel.from_pretrained(...)`). *Real example:* your own SER thesis fine-tuned HuBERT, a self-supervised speech model, which is exactly this pattern.

---

## 17.3 Faster optimisers 🟡 ⭐

> [!info] 📖 Géron Ch. 11 · “Faster Optimizers” · pp. 389–398

> [!quote] 💬 Say it in the interview
> “Adam adapts per-parameter learning rates using momentum and squared-gradient averages and converges fast. AdamW decouples weight decay and is the default for transformers. SGD with momentum sometimes generalises better for CNNs.”

Plain SGD crawls along gentle slopes and zig-zags in ravines. The upgrades:

| Optimiser | Idea | Update (simplified) | Notes |
|---|---|---|---|
| **Momentum** (Polyak 1964) | The gradient is an *acceleration*, not a speed. A rolling ball | m ← βm − η∇J; θ ← θ + m | β = 0.9 gives up to **10×** the speed (terminal velocity ∝ 1/(1−β)). Escapes plateaus; may overshoot |
| **Nesterov (NAG)** (1983) | Measure the gradient *ahead*, at θ + βm | m ← βm − η∇J(θ+βm) | Almost always faster than plain momentum; less oscillation. `SGD(momentum=0.9, nesterov=True)` |
| AdaGrad (2011) | Per-parameter LR, scaled down by accumulated squared gradients | s ← s + g²; θ ← θ − ηg/√(s+ε) | Great for convex/sparse problems; **stops too early** on deep nets |
| **RMSProp** (Hinton 2012) | Only *recent* squared gradients (decay ρ = 0.9) | s ← ρs + (1−ρ)g² | Fixes AdaGrad. Famously cited as "slide 29, lecture 6e" |
| **Adam** (Kingma & Ba 2014) | Momentum (1st moment) + RMSProp (2nd moment) + bias correction | m ← β₁m + (1−β₁)g; s ← β₂s + (1−β₂)g²; m̂ = m/(1−β₁ᵗ); ŝ = s/(1−β₂ᵗ); θ ← θ − ηm̂/(√ŝ+ε) | Defaults β₁ = 0.9, β₂ = 0.999, ε = 1e-8, η = 1e-3. Little LR tuning |
| AdaMax | Adam with the ℓ∞ norm instead of ℓ₂ | — | Sometimes more stable |
| NAdam | Adam + Nesterov | — | Often slightly faster than Adam |
| **AdamW** (Loshchilov & Hutter 2017) | **Decoupled weight decay** | θ ← θ − η(adam_step + λθ) | ℓ₂ ≠ weight decay under Adam. AdamW does it right. **The default for transformers** |

Key nuances:
- **Why the bias correction?** m and s start at 0, so early estimates are biased toward
  0. Dividing by (1 − βᵗ) fixes the first steps.
- **ℓ₂ vs weight decay:** identical for SGD, **not** for Adam (the adaptive scaling also rescales the ℓ₂ gradient). Adam + ℓ₂ tends to generalise worse, and AdamW fixes that.
- **Adaptive optimisers can generalise worse** on some datasets (Wilson et al., 2017). If results disappoint, try **SGD with Nesterov momentum**, still common for training CNNs from scratch.
- **Second-order methods** (Newton: the Hessian has n² entries) don't scale. Approximations such as **Shampoo** exist (the `torch_optimizer` library).
- **Sparse models:** train normally with ℓ₁, then prune with `torch.nn.utils.prune.l1_unstructured` (weights) or `ln_structured` (whole neurons or channels, which gives a real speed-up).

> [!success] 🔭 State of the art — optimisers.
> **AdamW remains the workhorse** for LLMs and ViTs. Distributed Shampoo was reported (2024) to win the AlgoPerf training-speed benchmark. **Muon** (orthogonalised momentum for 2-D weight matrices, 2024) drew wide attention after speed-running GPT-2-size training records and being used at larger scale in 2025. Memory-light options include **8-bit Adam** (bitsandbytes) and **Adafactor**. A practical rule for your work: AdamW with weight decay ~0.01–0.1, warm-up plus cosine or WSD decay (§17.4), and gradient clipping at 1.0. Only explore exotic optimisers when training cost dominates.

---

## 17.4 Learning-rate scheduling 🟡

> [!info] 📖 Géron Ch. 11 · “Learning Rate Scheduling” · pp. 398–405

![Common learning-rate schedules. Warm-up + cosine and WSD are the LLM defaults.](figures/fig17_lr_schedules.png)
*Common learning-rate schedules. Warm-up + cosine and WSD are the LLM defaults.*

A constant LR is a compromise: high converges fast but "dances" around the optimum; low is precise but slow and can get stuck. **Start high, end low**, and optionally **warm up** at the start.

| Schedule | Shape | PyTorch | When |
|---|---|---|---|
| Exponential | ×γ per epoch (γ = 0.9 → 35% after 10 epochs) | `ExponentialLR` | Simple baseline |
| **Cosine annealing** | η_t = η_min + ½(η_max − η_min)(1 + cos(πt/T)) | `CosineAnnealingLR` | Stays high longer, then settles. Needs T known in advance |
| **Performance (plateau)** | ×factor when the validation metric stalls for `patience` epochs | `ReduceLROnPlateau(mode="max", patience=2, factor=0.1)`, then `scheduler.step(val_metric)` | **Géron's usual favourite.** No need to know T |
| **Warm-up** | Ramp from ~0 up to η_max over a few epochs or steps | `LinearLR(start_factor=0.1, total_iters=3)` or `LambdaLR` | Unstable starts: RNNs, transformers, **large batches** |
| Cosine with warm restarts (SGDR) | Repeated cosines, each cycle ×T_mult longer | `CosineAnnealingWarmRestarts(T_0=2, T_mult=2)` | Escaping plateaus and local optima |
| **1cycle** (Smith 2018) | Linear warm-up to η₁ halfway, linear decay, then a final drop. Momentum inversely 0.95 → 0.85 → 0.95 | `OneCycleLR` | Fast training: CIFAR-10 at **91.9% in 100 epochs vs 90.3% in 800** ("super-convergence") |

Géron's intuition for warm-up: the early loss landscape is like the **Himalayas**. A big step jumps between spiky peaks, while small steps walk down into flatter valleys where a large LR is then safe.

```python
opt = torch.optim.AdamW(model.parameters(), lr=3e-4, weight_decay=0.05)
sched = torch.optim.lr_scheduler.OneCycleLR(opt, max_lr=3e-3,
                                            total_steps=n_epochs * len(train_loader))
for epoch in range(n_epochs):
    for X, y in train_loader:
        ...; loss.backward(); opt.step(); opt.zero_grad()
        sched.step()                      # OneCycleLR steps PER BATCH
```

Note which schedulers step per **batch** (OneCycle, and warm-up measured in steps) and which per **epoch** (Exponential, Plateau with a validation metric).

> [!success] 🔭 State of the art — LLM schedules.
> Standard is **linear warm-up (hundreds to a few thousand steps) + cosine decay to ~10% of peak**. Increasingly popular is **Warmup-Stable-Decay (WSD / "trapezoidal")**: warm up, hold the LR constant for most of training, then decay quickly at the end. You can branch and decay from any checkpoint, which makes it easy to continue training. Tools such as the LR range test (Part 11 §11.9) or small-scale sweeps with µP are used to choose the peak LR.

---

## 17.5 Regularisation for deep networks 🟡 ⭐

> [!info] 📖 Géron Ch. 11 · “Avoiding Overfitting Through Regularization” · pp. 405–413

![Dropout trains a different thinned network at every step.](figures/fig17_dropout.png)
*Dropout trains a different thinned network at every step.*

> [!quote] 💬 Say it in the interview
> “Dropout randomly zeroes activations during training, so the network can't rely on any single neuron — like an ensemble. At inference it is off; `model.eval()` handles that.”

> *"With four parameters I can fit an elephant, and with five I can make him wiggle his trunk."* — von Neumann (via Fermi). With millions you can fit the whole zoo.

The toolkit: **early stopping** (Part 7 §7.18), **BN/LN** (partly), and the following.

### ℓ₁ / ℓ₂ and weight decay, done properly

```python
decay, no_decay = [], []
for name, p in model.named_parameters():
    (no_decay if ("bias" in name or "bn" in name or "norm" in name) else decay).append(p)
optimizer = torch.optim.AdamW([{"params": decay, "weight_decay": 0.05},
                               {"params": no_decay, "weight_decay": 0.0}], lr=1e-3)
# ℓ₁ has no built-in helper:  loss = main_loss + 1e-4 * sum(p.abs().sum() for p in decay)
```

Excluding biases and normalisation parameters from weight decay is standard practice. Penalising them adds little regularisation and can hurt.

### Dropout

Hinton et al. (2012), Srivastava et al. (2014). At each training step, every neuron (except the outputs) is dropped with probability p. Typical p: **10–50%** (20–30% for RNNs, 40–50% for CNN dense heads). Survivors are scaled by 1/(1 − p) (inverted dropout), so nothing changes at inference.

**Why it works:** neurons can't co-adapt, and must be individually useful and robust. It is equivalent to training an **ensemble of 2ᴺ weight-sharing sub-networks**. Géron's company analogy: if employees flipped a coin each morning to decide whether to come in, no single person could be the only one who knows the coffee machine, and the organisation would become resilient.

Practical notes:
- A 1–2% accuracy gain at 95% accuracy means the **error drops by ~40%** (5% → 3%).
- Apply it to the **top layers** first. Never drop outputs.
- The training loss is computed **with** dropout, so compare training and validation losses **without** it to diagnose overfitting.
- It slows convergence. Tune p: raise it if overfitting, lower it if underfitting.
- SELU networks need `nn.AlphaDropout`.

### Monte Carlo (MC) dropout — free uncertainty estimates

Gal & Ghahramani (2016) showed dropout training ≈ approximate **Bayesian inference** (a deep Gaussian process). **Keep dropout ON at inference**, predict 100 times, and average the probabilities:

```python
class McDropout(nn.Dropout):
    def forward(self, x):
        return F.dropout(x, self.p, training=True)       # always on

with torch.no_grad():
    X_rep = X_new.repeat_interleave(100, dim=0)
    probas = F.softmax(model(X_rep), dim=-1).reshape(len(X_new), 100, -1)
    mean, std = probas.mean(dim=1), probas.std(dim=1)
```

- Average the **probabilities**, not the logits. Averaging logits is overconfident.
- The **std** is an uncertainty signal. Géron's third image: MC gives 41% / 23% / 23% instead of one overconfident class, with std 0.17.
- **Real use:** risk-sensitive systems (medical, credit, fraud). Act only when the probability is high *and* the std is low; route uncertain cases to humans.

### Max-norm regularisation

Constrain each neuron's incoming weight vector to ‖w‖₂ ≤ r, rescaling after every optimiser step. It also helps with unstable gradients when there is no normalisation layer.

```python
def apply_max_norm(model, max_norm=2, eps=1e-8, dim=1):
    with torch.no_grad():
        for name, p in model.named_parameters():
            if "bias" not in name:
                n = p.norm(p=2, dim=dim, keepdim=True)
                p *= torch.clamp(n, 0, max_norm) / (eps + n)
# call after optimizer.step();  use dim=[1, 2, 3] for conv kernels
```

> [!success] 🔭 State of the art — regularisation at scale.
> Large-model pretraining often uses **little or no dropout** (data is plentiful and each example is seen ~once) and relies on weight decay plus data scale. Fine-tuning on small data re-adds dropout (e.g. LoRA dropout). In vision: **data augmentation** (RandAugment, **Mixup/CutMix**; Part 18), **stochastic depth** (randomly skip residual blocks), **label smoothing** (Part 11 §11.9), and an **EMA of weights** (average parameters over training steps for a smoother final model). For uncertainty in production, **deep ensembles** (5 independently trained models) usually beat MC dropout, and **conformal prediction** gives distribution-free prediction sets with guaranteed coverage (the `MAPIE` library for sklearn models).

---

## 17.6 Géron's default configuration (memorise this table) 🟡 ⭐

> [!info] 📖 Géron Ch. 11 · “Practical Guidelines” · pp. 413–414

> [!quote] 💬 Say it in the interview
> “Géron's defaults (Table 11-3): He initialisation; ReLU if shallow, Swish if deep; batch- or layer-norm only if deep; early stopping plus weight decay if needed; Nesterov SGD or AdamW; performance scheduling or 1cycle. And reuse a pretrained network whenever one exists.”

| Hyperparameter | Default |
|---|---|
| Kernel initialiser | **He** |
| Activation | **ReLU** if shallow; **Swish** if deep |
| Normalisation | None if shallow; **BN or LN** if deep |
| Regularisation | **Early stopping**; weight decay if needed |
| Optimiser | **Nesterov** SGD or **AdamW** |
| LR schedule | **Performance scheduling** or **1cycle** |

Plus: **reuse a pretrained network** if one exists; unsupervised pretraining if you have lots of unlabelled data; auxiliary-task pretraining if you have lots of labels for a related task.

**Exceptions:**
- **Sparse model:** ℓ₁ + magnitude pruning.
- **Low latency:** fewer layers, a fast activation (ReLU, LeakyReLU, Hardswish), fold BN into the previous layer, sparsity, and **lower precision** (§17.7).
- **Risk-sensitive or latency-tolerant:** MC dropout for better probabilities and uncertainty.

---

## 17.7 Mixed precision and quantization (Appendix B) 🔴

> [!info] 📖 Géron Appendix B · “Mixed Precision and Quantization” · p. 795 onward

### Why it matters: memory arithmetic

1B parameters in fp32 = **4 GB** for the weights alone. Training with Adam adds 2 states per parameter (+8 GB), plus gradients (+4 GB), plus the activations. So a 7B model needs ≈ 7 × 16 = **112 GB** just for weights, gradients and Adam states in fp32, before any activations. That is why precision matters.

### Number formats

| Format | Bits (sign/exp/fraction) | Range | Use |
|---|---|---|---|
| fp32 | 1/8/23 | ±3.4e38, tiny values to 1.4e-45 | Default master weights |
| **fp16** | 1/5/10 | Max **65,504**; smallest ~6e-8 | Inference, mixed-precision training (needs loss scaling) |
| **bf16** | 1/8/7 | **Same range as fp32**, less precision | **Default for modern training** (no loss scaling needed) |
| fp8 (E4M3/E5M2) | 1/4/3 or 1/5/2 | Small | Training and inference on H100/Blackwell-class GPUs |
| int8 | integers | −128…127 | Quantised inference |
| int4 / NF4 | 4 bits (2 per byte) | 16 levels | LLM inference, QLoRA |
| Ternary | {−1, 0, +1}, 5 per byte (3⁵ = 243 < 256), ~1.6 bits | — | Research (BitNet-style models) |

**fp16 vs bf16 trade-off:** fp16 **underflows** tiny gradients (< 6e-8 → 0) and **overflows** above 65,504 (→ inf → NaN). bf16 has fp32's range, but only 7 fraction bits, so tiny updates to large weights vanish: 123 + 0.045 → 123 in bf16, but 123.0625 in fp16.

### Mixed-precision training (Micikevicius et al., 2017)

Keep **fp32 master weights**, use a **16-bit copy** for the forward and backward passes, **scale the loss** up to avoid underflow, unscale the gradients in fp32, and update the fp32 weights. You get ~2× speed and roughly half the activation memory. **Most large transformers are trained this way.**

```python
from torch.amp import GradScaler
scaler = GradScaler(device="cuda")          # dynamic loss scaling (skip step on inf/NaN)
for X, y in train_loader:
    X, y = X.to("cuda"), y.to("cuda")
    with torch.autocast(device_type="cuda", dtype=torch.float16):   # or torch.bfloat16
        loss = criterion(model(X), y)
    scaler.scale(loss).backward()
    scaler.step(optimizer); scaler.update(); optimizer.zero_grad()
# With bf16, GradScaler is usually unnecessary.
# Hugging Face Trainer: TrainingArguments(bf16=True) or fp16=True.
```

`autocast` runs matmuls and convolutions in 16-bit but keeps sensitive reductions (sums, softmax internals) in fp32.

### Quantization

**Linear (affine) quantization** maps floats to n-bit integers:

> Asymmetric: q = round(w/s + z), s = (max − min)/(2ⁿ − 1), z = −round(min/s) Symmetric: q = round(w/s), s = max|w| / (2ⁿ⁻¹ − 1), zero point 0

- 0.0 maps **exactly** to an integer. That matters for sparse weights and ReLU zeros.
- Symmetric is usually used for **weights**; asymmetric for **activations** (ReLU outputs are ≥ 0).
- **Per-channel** or **per-block** scales give better precision for a few extra bytes.
- Size: an int8 conv layer of 18,432 weights drops from 73,728 bytes to 18,432 (+8 bytes for s and z). **~4× smaller.** On phones, int8 math is **2–4× faster** and uses **5–10× less energy** than fp32.

| Technique | How | Best for |
|---|---|---|
| **Dynamic PTQ** | Weights int8 ahead of time; activations quantised per batch on the fly | MLPs, RNNs, transformers on CPU (`quantize_dynamic(model, {nn.Linear}, dtype=torch.qint8)`) |
| **Static PTQ** | Calibrate activation ranges on representative data (observers), then convert | CNNs, maximum speed, **microcontrollers without an FPU** |
| **QAT** | Fake-quantise during training (straight-through estimator for gradients) | When PTQ loses too much accuracy; ≤ 4 bits |
| **bitsandbytes NF4** | 4-bit *NormalFloat*: levels at the quantiles of a normal distribution (denser near 0). Weights dequantised on the fly to bf16 | Running or fine-tuning LLMs on one GPU |
| **GPTQ** | Layer-by-layer optimisation of 4-bit weights to minimise output MSE | Weight-only LLM inference |
| **AWQ** | Protects the ~1% of *salient* weights (large activations) by rescaling | Accurate 4-bit LLM inference |
| **GGUF (llama.cpp)** | File format with block quantisation (Q4_K_M…) + tokenizer + metadata | **Running LLMs on laptops and CPUs** (llama.cpp, Ollama, LM Studio) |

```python
from transformers import AutoModelForCausalLM, BitsAndBytesConfig
bnb = BitsAndBytesConfig(load_in_4bit=True, bnb_4bit_quant_type="nf4",
                         bnb_4bit_compute_dtype=torch.bfloat16)
model = AutoModelForCausalLM.from_pretrained("TinyLlama/TinyLlama-1.1B-Chat-v1.0",
                                             device_map="auto", quantization_config=bnb)
```

**QLoRA** (Dettmers et al., 2023) = NF4 frozen base model + **LoRA** adapters trained in 16-bit + activation checkpointing + **paged optimisers** (CPU↔GPU paging for memory spikes) + **double quantisation**. It fine-tuned a **65B model on a single 48 GB GPU**, and it is how most individuals and small teams fine-tune LLMs today.

**Other compression tools** (Géron's list):
- **Pruning:** magnitude, structured channels, attention heads.
- **Distillation:** a big teacher trains a small student. DistilBERT is ~40% smaller and retains ~97% of BERT's performance (Part 21).
- **Layer fusion:** Conv/Linear + BN → one layer. Fuse *before* quantising.
- **Low-rank factorisation:** `Linear(10_000, 20_000)` (200M parameters) ≈ `Linear(10_000, 100)` + `Linear(100, 20_000)` (3M parameters). That is the idea behind LoRA.
- **Architecture choices:** fewer or narrower layers, weight sharing (ALBERT).

**Deployment runtimes:** ExecuTorch (PyTorch mobile/edge), ONNX Runtime (cross-platform, including .NET), TFLite/LiteRT, TVM, TensorRT (NVIDIA), **TorchAO** (PyTorch's newer quantisation library: int4 weights, per-block, growing GPU support).

> [!success] 🔭 State of the art — efficiency (2025–26).
> - **FP8 training** is used in production at large scale. DeepSeek-V3's technical report (Dec 2024) describes FP8 mixed-precision training of a 671B-parameter MoE model. NVIDIA's Blackwell GPUs add **FP4 (NVFP4/MXFP4)** formats for inference.
> - **4-bit weight-only inference** (AWQ/GPTQ/GGUF) is standard for local LLMs, and **KV-cache quantisation** is used for long contexts.
> - **Serving engines:** vLLM (PagedAttention), SGLang, TensorRT-LLM and llama.cpp handle batching, quantisation and caching for you.
> - Memory tricks for training: **activation (gradient) checkpointing** (recompute instead of storing activations), **FSDP / DeepSpeed ZeRO** (shard parameters, gradients and optimiser states across GPUs), **FlashAttention** (Part 21).

---

## 17.8 Autodiff — how `loss.backward()` really works (Appendix A) 🟡

> [!info] 📖 Géron Appendix A · “Autodiff” · p. 787 onward

Take f(x, y) = x²y + y + 2, with ∂f/∂x = 2xy and ∂f/∂y = x² + 1. At (3, 4) these give 24 and 10.

| Method | How | Cost for n parameters | Accuracy | Use |
|---|---|---|---|---|
| Manual | Calculus on paper | — | Exact | Tedious, error-prone |
| **Finite differences** | (f(x+ε) − f(x))/ε | **n + 1** evaluations | Approximate (24.00004) | **Gradient checking** your implementations |
| Forward-mode autodiff | Propagate derivatives inputs → outputs (dual numbers a + bε, ε² = 0) | **n passes** (one per input) | Exact | Few inputs, many outputs |
| **Reverse-mode autodiff** | Forward pass stores values; backward pass applies the **chain rule** from the output down | **2 passes per output**, whatever n is | Exact | **Neural networks** (1 loss, millions of parameters). What PyTorch does |

**Dual numbers:** h(a + bε) = h(a) + b·h′(a)·ε, so a single evaluation gives the value *and* the derivative.

**Reverse mode, step by step:** ∂f/∂n₇ = 1 at the output. Each node multiplies the incoming gradient by its local derivative (∂f/∂nᵢ = ∂f/∂nⱼ · ∂nⱼ/∂nᵢ) and passes it down, summing over paths. PyTorch builds the graph **dynamically** during the forward pass (each tensor's `grad_fn`), which is why loops and `if` statements just work.

**Exercise that makes this click:** build a tiny autodiff engine (a `Value` class with `+`, `*`, `tanh` and a `backward()` doing a topological sort). Andrej Karpathy's **micrograd** video walks through exactly this in about 2 hours. It is one of the best learning investments in the field.

---

## 17.9 Real-world examples 🟡

| Example | Technique | Lesson |
|---|---|---|
| **ImageNet 2015**: Inception + BN reached 4.9% top-5 error, 14× fewer steps | Batch norm | Normalisation made deep CNNs practical |
| **ResNet-152** (2015) trains 152 layers; plain networks got *worse* with depth | Residual connections + BN + He init | Depth needs gradient highways (Part 18) |
| **GPT-3 / Llama family** | AdamW, warm-up + cosine, grad clip 1.0, pre-norm (Llama: RMSNorm + SwiGLU), bf16 | The "boring" recipe scales |
| **QLoRA / Guanaco** (2023): a 65B model fine-tuned on one 48 GB GPU | NF4 + LoRA + paged optimisers | Quantisation democratised fine-tuning |
| **llama.cpp / Ollama**: 7–8B chat models running on a laptop CPU | GGUF 4-bit quantisation | Local, private LLMs, relevant for data that can't leave a company |
| **On-device ML** (keyboard prediction, camera, voice wake-words) | int8 static quantisation, pruning, distillation | Latency, battery and privacy drive compression |
| Medical and financial risk systems | MC dropout, deep ensembles, conformal prediction | Know when the model doesn't know |

---

> [!check] ✅ Key takeaways
> - Vanishing/exploding gradients → He/Glorot init, ReLU-family activations, BN/LN, residuals, gradient clipping.
> - Transfer learning: reuse a pretrained network, freeze, train the head, then fine-tune with a lower learning rate.
> - AdamW (or Nesterov SGD) with a learning-rate schedule (warm-up + cosine, 1cycle, or performance scheduling).
> - Regularise with early stopping, weight decay and dropout; MC dropout gives uncertainty.
> - Géron's defaults (Table 11-3) are a strong starting point.
> - Mixed precision and quantisation make training and serving cheaper (QLoRA for LLMs).

## 17.10 Interview drill — training deep networks (Géron Ch. 11 exercises, answered) 🟡 ⭐

> [!info] 📖 Géron Ch. 11 · Exercises · p. 414

**1. What problem do Glorot and He initialisation fix?** Unstable (vanishing or exploding) gradients at the start of training. They keep the output variance of each layer ≈ its input variance, forwards and backwards.

**2. Is it OK to set all weights to the same value, even one chosen randomly with He init?** No. All neurons in a layer stay identical (symmetry), so the layer acts like one neuron. The weights must be sampled independently.

**3. Is it OK to initialise the biases to 0?** Yes. The random weights already break symmetry. (Biases can also be initialised like weights; it barely matters.)

**4. When would you use each activation?** ReLU: the default and fastest. Leaky ReLU/PReLU: to avoid dying neurons, cheaply. ELU/SELU: smooth; SELU only for plain deep MLPs under its constraints. GELU/Swish/Mish: complex tasks, transformers. SwiGLU: LLM feed-forward blocks. Tanh: RNN outputs in [−1, 1]. Sigmoid: binary or multilabel outputs. Softmax: multiclass outputs. Hard-*: mobile.

**5. Momentum too close to 1 (0.99999)?** Almost no friction. The optimiser picks up enormous speed, overshoots, and oscillates for a long time, so convergence is slower.

**6. Three ways to produce a sparse model?** Magnitude pruning after training (optionally with fine-tuning); ℓ₁ regularisation during training; structured pruning of channels or heads (`torch.nn.utils.prune`). Also: sparsity-inducing initialisation.

**7. Does dropout slow training? Inference? MC dropout?** It slows convergence during training (more epochs). No effect on inference (it's off). MC dropout makes inference ~k× slower (k stochastic passes).

**More that come up in deep-learning interviews:**
- **"BatchNorm vs LayerNorm?"** BN normalises each feature across the batch, needs running statistics, and depends on batch size. LN normalises each instance across its features, behaves the same in training and inference, and suits sequences and transformers. (And RMSNorm drops the mean-centring and the bias.)
- **"Why AdamW rather than Adam + L2?"** With adaptive LRs the ℓ₂ gradient gets rescaled per parameter, so large-gradient weights are under-regularised. Decoupled decay applies a uniform shrinkage.
- **"Your loss goes NaN after 1,000 steps. What do you check?"** LR too high (warm up, lower the peak); exploding gradients (clip, log the grad norm); fp16 overflow (use bf16 or loss scaling); bad data (inf/NaN inputs, division by zero in features); log(0) in a custom loss (use the `…WithLogits` losses); a dying-activation cascade.
- **"How would you fit a 13B model for fine-tuning on a 24 GB GPU?"** QLoRA: 4-bit NF4 base (~7 GB) + LoRA adapters + gradient checkpointing + a paged 8-bit optimiser + small micro-batches with gradient accumulation.
- **"How do you know a model's uncertainty?"** MC dropout, deep ensembles, calibration (temperature scaling), conformal prediction.
- **"PTQ vs QAT?"** PTQ quantises after training (fast, some accuracy loss, may need calibration data). QAT simulates quantisation during training with the straight-through estimator, so the model adapts; better at low bit-widths, more costly.

---

## Further reading and sources

**From the book:** Géron Ch. 11, Appendices A–B, and the notebooks at https://homl.info/colab-p (exercise 8: a 20-layer DNN on CIFAR-10 with BN, SELU, MC dropout and 1cycle, the best hands-on consolidation of this part).

**Papers (classic → current):**
- Glorot & Bengio (2010), *Understanding the difficulty of training deep feedforward networks*
- He et al. (2015), *Delving Deep into Rectifiers*
- Ioffe & Szegedy (2015), *Batch Normalization*; Ba et al. (2016), *Layer Normalization*; Zhang & Sennrich (2019), *Root Mean Square Layer Normalization*
- Srivastava et al. (2014), *Dropout*; Gal & Ghahramani (2016), *Dropout as a Bayesian Approximation*
- Kingma & Ba (2014), *Adam*; Loshchilov & Hutter (2017), *Decoupled Weight Decay (AdamW)* and *SGDR*
- Smith (2018), *A Disciplined Approach to Neural Network Hyper-Parameters* (1cycle)
- Shazeer (2020), *GLU Variants Improve Transformer* (SwiGLU)
- Micikevicius et al. (2017), *Mixed Precision Training*; Dettmers et al. (2023), *QLoRA*; Frantar et al. (2022), *GPTQ*; Lin et al. (2023), *AWQ*

**Practical guides (current):**
- Google's **Deep Learning Tuning Playbook** (GitHub, google-research/tuning_playbook)
- Andrej Karpathy, **"A Recipe for Training Neural Networks"** (2019) and the **"Neural Networks: Zero to Hero"** series (micrograd → GPT)
- **Hugging Face docs:** "Efficient training on a single GPU", PEFT, bitsandbytes, quantization
- **PyTorch docs:** AMP (`torch.amp`), `torch.compile`, FSDP, TorchAO
- **Stas Bekman, *Machine Learning Engineering*** (open book on GitHub): the practical bible for large-scale training and debugging

---

<!-- nav -->
> [!example] 🧭 Step 16 of 26 · Stage 5 of 7: Deep learning
> ← [Part 13 · Capstone](13_Capstone_Road_Accidents.md) · [Part 18 · CNNs & vision](18_Computer_Vision_CNNs.md) → · [Course map](00_START_HERE.md)
<!-- /nav -->
