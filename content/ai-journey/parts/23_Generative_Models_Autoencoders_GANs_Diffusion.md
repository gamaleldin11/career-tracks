# Part 23 — Generative Models: Autoencoders, GANs and Diffusion

<!-- nav -->
> [!example] 🧭 Step 22 of 26 · Stage 6 of 7: Modern AI
> ← [Part 22 · ViT & multimodal](22_Vision_and_Multimodal_Transformers.md) · [Part 24 · RL & bandits](24_Reinforcement_Learning.md) → · [Course map](00_START_HERE.md)
<!-- /nav -->

**Source:** Géron, *Hands-On ML with Scikit-Learn and PyTorch* (2025), **Chapter 18** "Autoencoders, GANs, and Diffusion Models". **🔭 State of the art** boxes cover 2025–26 generative AI, plus the practical uses that matter to a data scientist: **anomaly detection, representation learning and synthetic data**.

**Three families, one goal (learning the data's structure):**

| Family | Core idea | Strength | Weakness |
|---|---|---|---|
| **Autoencoders** (incl. VAEs) | Copy the input to the output **under a constraint** (bottleneck, noise, sparsity) and learn **latent codings** as a by-product | Compression, features, **anomaly detection**, pretraining; VAEs generate | VAE samples are blurry |
| **GANs** | A **generator** and a **discriminator** compete (counterfeiter vs police) | Very sharp images, **fast** generation | Unstable training, **mode collapse** |
| **Diffusion models** | Learn to **remove noise** step by step; generate by denoising pure noise | Best quality and **diversity**, stable training, easy conditioning (text-to-image) | **Slow** sampling (many steps) |

<!-- interview-focus -->

> [!tip] 🎯 Interview focus
> **Why it matters:** For DS roles the practical parts are autoencoders for anomaly detection and synthetic data; GANs and diffusion are concept-level.
>
> | Level | What you should be able to do |
> |---|---|
> | 🟢 **Entry** | What an autoencoder is (compress → reconstruct) and how reconstruction error flags anomalies. |
> | 🟡 **Mid** | VAE vs plain autoencoder; the GAN game and mode collapse; diffusion in one paragraph; validating synthetic data (fidelity, utility, privacy). |
> | 🔴 **Senior** | Latent diffusion and flow matching; conditioning and guidance; generative-AI governance (C2PA, IP, privacy). |
>
> **⭐ Most-asked:** *How can an autoencoder detect anomalies?* · *VAE vs GAN vs diffusion?* · *What is mode collapse?* · *When would you use synthetic data, and how do you validate it?*
>
> **⏱ Time:** 2–3 h  ·  **Short on time?** Read §23.1, §23.5 (telecom recipe), §23.6.

**Legend:** 🟢 Entry (0–2 yrs) · 🟡 Mid (2–5 yrs) · 🔴 Senior / specialist · ⭐ frequently asked · 📖 Géron, *Hands-On ML with Scikit-Learn and PyTorch* (2025) pages

> [!abstract]- 🗺️ Section map — level and book pages
>
> | § | Section | Level | 📖 Book |
> |---|---|:---:|---|
> | 23.1 | Autoencoders — efficient representations | 🟡 ⭐ | Ch. 18 · pp. 697–715 |
> | 23.2 | Variational Autoencoders (VAEs) — generative autoencoders | 🔴 | Ch. 18 · pp. 715–724 |
> | 23.3 | Generative Adversarial Networks (GANs) | 🟡 | Ch. 18 · pp. 724–730 |
> | 23.4 | Diffusion models | 🔴 | Ch. 18 · pp. 730–739 |
> | 23.5 | Real-world examples | 🟡 | — |
> | 23.6 | Interview drill — generative models | 🔴 | Ch. 18 · p. 739 |
>

---

## 23.1 Autoencoders — efficient representations 🟡 ⭐

> [!info] 📖 Géron Ch. 18 · “Efficient Data Representations” → “Sparse Autoencoders” · pp. 697–715

![An autoencoder squeezes the data through a bottleneck; large reconstruction error means an unusual record.](figures/fig23_autoencoder.png)
*An autoencoder squeezes the data through a bottleneck; large reconstruction error means an unusual record.*

> [!quote] 💬 Say it in the interview
> “An autoencoder compresses inputs through a bottleneck and reconstructs them. Trained on normal data, it reconstructs anomalies badly, so reconstruction error becomes an anomaly score.”

Géron's intuition: the sequence 50, 48, 46, …, 14 is easier to memorise than ten random numbers once you spot the **pattern**. Chase & Simon (1973) found that chess masters memorise real positions after 5 seconds, but not random ones. **Constraints force pattern discovery.**

An autoencoder = **encoder** (recognition network: input → codings) + **decoder** (generative network: codings → **reconstruction**). The loss is a **reconstruction loss** (MSE, or BCE for pixels in [0, 1]).

- **Undercomplete:** codings are smaller than the input, so the model is forced to compress.
- **Linear autoencoder + MSE ≈ PCA.** It finds the same best-fitting subspace (Part 9).

```python
encoder, decoder = nn.Linear(3, 2), nn.Linear(2, 3)
autoencoder = nn.Sequential(encoder, decoder)          # train with targets = inputs
train_set = TensorDataset(X_train, X_train)
codings = encoder(X_train)                             # 3-D → 2-D, like PCA
```

This is **self-supervised learning**: the labels are the inputs.

### Stacked (deep) autoencoders

A symmetric "sandwich": 784 → 128 → **32** → 128 → 784, with ReLU hidden layers and a **sigmoid** output (pixels in [0, 1]).

```python
stacked_encoder = nn.Sequential(nn.Flatten(), nn.Linear(784, 128), nn.ReLU(),
                                nn.Linear(128, 32), nn.ReLU())
stacked_decoder = nn.Sequential(nn.Linear(32, 128), nn.ReLU(), nn.Linear(128, 784),
                                nn.Sigmoid(), nn.Unflatten(1, (1, 28, 28)))
stacked_ae = nn.Sequential(stacked_encoder, stacked_decoder)
```

⚠️ **Too powerful is bad.** An encoder that maps each input to one arbitrary number reconstructs perfectly and learns nothing useful.

**Uses:**
1. **Anomaly detection:** out-of-distribution inputs reconstruct badly. Flag inputs whose reconstruction error exceeds a threshold. MNIST digits fed to a Fashion-MNIST autoencoder come out garbled.
2. **Visualisation of big datasets:** autoencoder to ~32-D, then t-SNE or UMAP to 2-D.
3. **Unsupervised pretraining:** train on all the (mostly unlabelled) data, then reuse the encoder in a classifier trained on the few labels (Part 17 §17.2).

**Training tricks:**
- **Tied weights:** decoder weights = the transposed encoder weights (W_L = W_{N−L+1}ᵀ). Half the parameters, often better reconstruction.
- **Greedy layer-wise training:** train one shallow autoencoder at a time and stack them. This is historically how deep learning restarted (Hinton 2006; Bengio 2007).

### Convolutional, denoising and sparse autoencoders

- **Convolutional autoencoder:** a CNN encoder (conv + pool, deeper and smaller) and a **transposed-conv** decoder. Use it for images.
- **Denoising autoencoder** (Vincent et al., 2008/2010): corrupt the input (Gaussian noise or dropout masking) and reconstruct the **clean** original. Good features, and a real **denoiser**. It is the conceptual ancestor of BERT's MLM *and* of diffusion.
- **Sparse autoencoder:** a large coding layer with a penalty that keeps only a few units active. Use either ℓ₁ on the codings, or better, a **KL divergence between a target sparsity p (e.g. 10%) and each unit's mean activation q**: D_KL(p‖q) = p log(p/q) + (1−p) log((1−p)/(1−q)). It has stronger gradients than MSE. The codings become **interpretable features**.

```python
def mse_plus_sparsity_loss(y_pred, y_target, target_sparsity=0.1, kl_weight=1e-3, eps=1e-8):
    p = torch.tensor(target_sparsity, device=y_pred.codings.device)
    q = torch.clamp(y_pred.codings.mean(dim=0), eps, 1 - eps)     # mean activation per unit
    kl = p * torch.log(p / q) + (1 - p) * torch.log((1 - p) / (1 - q))
    return F.mse_loss(y_pred.output, y_target) + kl_weight * kl.sum()
```

> [!success] 🔭 Sparse autoencoders are central to LLM interpretability research
> (2023–25). Anthropic, OpenAI and others train SAEs on transformer activations to extract millions of human-interpretable "features" (concepts). It is the same idea Géron teaches, applied to look inside LLMs.

---

## 23.2 Variational Autoencoders (VAEs) — generative autoencoders 🔴

> [!info] 📖 Géron Ch. 18 · “Variational Autoencoders”, “Discrete VAEs” · pp. 715–724

Kingma & Welling (2013). **Probabilistic** (random even after training) and **generative** (sample new data).

- The encoder outputs a **mean μ and log-variance γ = log σ²** per latent dimension, not a single coding.
- A coding is **sampled** from 𝒩(μ, σ²). The decoder reconstructs from it.
- **Reparameterisation trick:** sampling isn't differentiable, so compute **z = μ + σ ⊙ ε**, with ε ~ 𝒩(0, 1). Gradients flow through μ and σ.
- **Loss = reconstruction + latent (KL) loss** pushing the codings toward 𝒩(0, I): **ℒ_latent = −½ Σᵢ (1 + γᵢ − exp(γᵢ) − μᵢ²)**.
- Result: a smooth, dense latent space. To **generate**, sample z ~ 𝒩(0, I) and decode.

<figure class="dia"><svg viewBox="0 0 720 244" role="img" aria-label="A variational autoencoder: the encoder outputs a mean and log-variance, a latent code is sampled as mu plus sigma times noise, and the decoder reconstructs the image; the loss adds reconstruction error and a KL term">
<rect class="sB" x="14" y="80" width="80" height="50" rx="8"/><text class="sT" x="54" y="103" text-anchor="middle">x</text><text class="sC" x="54" y="119" text-anchor="middle">image</text>
<line class="sL" x1="94" y1="105" x2="116" y2="105" marker-end="url(#ah)"/><polygon class="sV" points="120,60 230,82 230,128 120,150"/><text class="sT" x="175" y="110" text-anchor="middle">encoder</text>
<line class="sL" x1="230" y1="92" x2="262" y2="72" marker-end="url(#ah)"/><rect class="sA" x="266" y="52" width="80" height="40" rx="8"/><text class="sT" x="306" y="77" text-anchor="middle">μ</text><line class="sL" x1="230" y1="118" x2="262" y2="138" marker-end="url(#ah)"/><rect class="sA" x="266" y="118" width="80" height="40" rx="8"/><text class="sT" x="306" y="143" text-anchor="middle">log σ²</text>
<rect class="sW" x="372" y="80" width="156" height="50" rx="25"/><text class="sT" x="450" y="102" text-anchor="middle">z = μ + σ ⊙ ε</text><text class="sC" x="450" y="120" text-anchor="middle">differentiable sample</text>
<line class="sLm" x1="346" y1="72" x2="384" y2="92" marker-end="url(#ahm)"/><line class="sLm" x1="346" y1="138" x2="384" y2="120" marker-end="url(#ahm)"/>
<rect class="sN" x="390" y="168" width="120" height="36" rx="8"/><text class="sT" x="450" y="191" text-anchor="middle">ε ~ 𝒩(0, 1)</text><line class="sLm" x1="450" y1="168" x2="450" y2="134" marker-end="url(#ahm)"/>
<line class="sL" x1="520" y1="105" x2="542" y2="105" marker-end="url(#ah)"/><polygon class="sV" points="546,82 646,60 646,150 546,128"/><text class="sT" x="596" y="110" text-anchor="middle">decoder</text>
<line class="sL" x1="646" y1="105" x2="666" y2="105" marker-end="url(#ah)"/><text class="sT" x="690" y="110" text-anchor="middle">x̂</text>
<text class="sS" x="360" y="232" text-anchor="middle">loss = reconstruction(x, x̂) + KL(𝒩(μ, σ²) ‖ 𝒩(0, I)): good copies, and a smooth latent space to sample from</text>
</svg><figcaption>The reparameterisation trick moves the randomness into ε, so gradients can flow through μ and σ. To generate, sample z from 𝒩(0, I) and decode.</figcaption></figure>

```python
class VAE(nn.Module):
    def __init__(self, codings_dim=32):
        super().__init__()
        self.codings_dim = codings_dim
        self.encoder = nn.Sequential(nn.Flatten(), nn.Linear(784, 128), nn.ReLU(),
                                     nn.Linear(128, 2 * codings_dim))     # μ and logvar
        self.decoder = nn.Sequential(nn.Linear(codings_dim, 128), nn.ReLU(),
                                     nn.Linear(128, 784), nn.Sigmoid(),
                                     nn.Unflatten(1, (1, 28, 28)))
    def forward(self, X):
        mean, logvar = self.encoder(X).chunk(2, dim=-1)
        z = mean + torch.randn_like(mean) * torch.exp(0.5 * logvar)       # reparameterisation
        return self.decoder(z), mean, logvar

def vae_loss(y_pred, y_target, kl_weight=1.0):
    output, mean, logvar = y_pred
    kl = -0.5 * torch.sum(1 + logvar - logvar.exp() - mean.square(), dim=-1)
    return F.mse_loss(output, y_target) + kl_weight * kl.mean() / 784    # match the scales

# generate:  vae.decoder(torch.randn(21, 32))
# semantic interpolation:  decode(torch.lerp(z_a, z_b, torch.linspace(0, 1, 7)[:, None]))
```

- **Semantic interpolation:** interpolate between two *codings*, not two images, and you morph smoothly from one item to another.
- VAE samples are often **blurry** (MSE averages over possibilities). Convolutional VAEs and more training help.

### Discrete VAEs (dVAE) and VQ-VAE — tokenising images

- **Gumbel-softmax dVAE:** the encoder outputs logits of shape [d codes × k categories]; a differentiable **Gumbel-softmax** approximates categorical sampling (`F.gumbel_softmax(logits, tau, hard=True)`), with the temperature annealed 1 → 0.1. The KL term is against a uniform prior.
- **VQ-VAE** (van den Oord et al., 2017): map each encoder embedding to its **nearest codebook vector** and backprop with the **straight-through estimator** (as in QAT, Part 17).
- **Why it matters:** discrete codes turn images (or audio) into **token sequences**. Then a **transformer learns the "grammar"** over the dVAE's "vocabulary". Condition it on text and you get **DALL·E 1** (Part 22). BEiT's targets are dVAE tokens. Hierarchical VAEs stack several levels.

---

## 23.3 Generative Adversarial Networks (GANs) 🟡

> [!info] 📖 Géron Ch. 18 · “Generative Adversarial Networks”, “Difficulties of Training GANs” · pp. 724–730

Goodfellow et al. (2014). A **generator** G (random coding → image, like a VAE decoder) and a **discriminator** D (image → probability it is real). **Adversarial training** alternates two phases per iteration:

1. **Train D:** a batch of real images (label 1) + fake images `G(z).detach()` (label 0); a BCE step updates only D.
2. **Train G:** new fakes, **all labelled 1** ("fool D"). **D is frozen**; the gradients flow through D into G. G never sees a real image; it learns from D's gradients.

<figure class="dia steps" data-start="1"><svg viewBox="0 0 720 250" role="img" aria-label="GAN training alternates: first the discriminator learns to label real images 1 and generated images 0; then, with the discriminator frozen, the generator is updated so its fakes are classified as real">
<rect class="sB" x="14" y="30" width="120" height="46" rx="8"/><text class="sT" x="74" y="51" text-anchor="middle">real images</text><text class="sC" x="74" y="67" text-anchor="middle">label 1</text><rect class="sN" x="14" y="150" width="120" height="46" rx="8"/><text class="sT" x="74" y="178" text-anchor="middle">noise z</text>
<line class="sL" x1="134" y1="173" x2="186" y2="173" marker-end="url(#ah)"/><rect class="sV" x="190" y="146" width="130" height="54" rx="8"/><text class="sT" x="255" y="178" text-anchor="middle">generator G</text>
<rect class="sA" x="430" y="86" width="140" height="54" rx="8"/><text class="sT" x="500" y="111" text-anchor="middle">discriminator D</text><text class="sC" x="500" y="127" text-anchor="middle">real or fake?</text>
<line class="sL" x1="320" y1="173" x2="426" y2="126" marker-end="url(#ah)"/><line class="sL" x1="134" y1="53" x2="426" y2="100" marker-end="url(#ah)"/>
<line class="sL" x1="570" y1="113" x2="606" y2="113" marker-end="url(#ah)"/><rect class="sR" x="610" y="90" width="96" height="46" rx="8"/><text class="sT" x="658" y="118" text-anchor="middle">BCE loss</text>
<g data-s="1-1"><text class="sC" x="260" y="128" text-anchor="middle">fakes, label 0, G.detach()</text><path class="sLr" d="M658 136 V170 H500 V144" fill="none" stroke-dasharray="5 4" marker-end="url(#ahr)"/><text class="sRt" x="580" y="186" text-anchor="middle">update D only</text><text class="sT" x="360" y="224" text-anchor="middle">step 1: teach D to tell real (1) from fake (0)</text></g>
<g data-s="2-2"><text class="sC" x="260" y="128" text-anchor="middle">fakes, labelled 1: "fool D"</text><rect class="sN" x="424" y="80" width="152" height="66" rx="8" style="fill:none;stroke:var(--ink-3);stroke-width:2" stroke-dasharray="4 3"/><text class="sC" x="500" y="74" text-anchor="middle">D frozen</text><path class="sLr" d="M658 136 V214 H255 V204" fill="none" stroke-dasharray="5 4" marker-end="url(#ahr)"/><text class="sRt" x="460" y="210" text-anchor="middle">gradients flow through D into G</text><text class="sT" x="360" y="238" text-anchor="middle">step 2: update G so D calls its fakes real; G never sees a real image</text></g>
</svg><ol class="dia-steps">
<li>Train the discriminator: real images labelled 1, generated images (detached from G) labelled 0. Only D's weights change.</li>
<li>Train the generator: new fakes labelled 1, D frozen. The loss gradient flows back through D into G. Repeat, and the two improve against each other.</li>
</ol><figcaption>Two networks, one game. When it balances, the fakes are good; when it doesn't, you get mode collapse and oscillation.</figcaption></figure>

```python
def train_gan(G, D, loader, codings_dim, n_epochs=20, g_lr=1e-3, d_lr=5e-4):
    bce = nn.BCELoss()
    g_opt = torch.optim.NAdam(G.parameters(), lr=g_lr)
    d_opt = torch.optim.NAdam(D.parameters(), lr=d_lr)
    for epoch in range(n_epochs):
        for real, _ in loader:
            real = real.to(device)
            ones = torch.ones(real.size(0), 1, device=device)
            zeros = torch.zeros_like(ones)
            fake = G(torch.randn(real.size(0), codings_dim, device=device)).detach()
            d_loss = bce(D(real), ones) + bce(D(fake), zeros)             # phase 1
            d_opt.zero_grad(); d_loss.backward(); d_opt.step()
            for p in D.parameters():
                p.requires_grad = False                                   # phase 2
            g_loss = bce(D(G(torch.randn(real.size(0), codings_dim, device=device))), ones)
            g_opt.zero_grad(); g_loss.backward(); g_opt.step()
            for p in D.parameters():
                p.requires_grad = True
```

### Why GANs are hard

- It is a **zero-sum game**. The unique **Nash equilibrium** is a perfect generator with D guessing 50/50, but **nothing guarantees convergence**.
- **Mode collapse:** G gets good at one class (shoes), keeps producing shoes, D adapts, G hops to shirts… it cycles, never covering the diversity of the data.
- **Oscillation and instability**, and strong **hyperparameter sensitivity**.
- **Fixes:** alternative losses (the Wasserstein GAN family; a large 2018 Google study found most losses perform similarly with enough tuning), **experience replay** (train D on past fakes too), **mini-batch discrimination** (D sees batch diversity, which punishes collapse), spectral normalisation, and architecture advances: **DCGAN** (convolutional), **Progressive GAN** (grow the resolution), **StyleGAN** (style-based control; the thispersondoesnotexist.com faces).

GANs were used for super-resolution, colourisation, image editing and inpainting, sketch→photo (pix2pix, CycleGAN), data augmentation, and time series and text. Since the early 2020s, **diffusion models have largely replaced GANs** for image generation. GANs remain useful where **very fast generation** matters (single forward pass).

---

## 23.4 Diffusion models 🔴

> [!info] 📖 Géron Ch. 18 · “Diffusion Models” · pp. 730–739

![Forward diffusion gradually destroys the signal; the model learns to reverse it.](figures/fig23_diffusion.png)
*Forward diffusion gradually destroys the signal; the model learns to reverse it.*

Sohl-Dickstein et al. (2015) introduced the idea (like milk diffusing in tea; learn to un-mix it). **DDPM** (Ho et al., 2020) made it work; **Improved DDPM** (Nichol & Dhariwal, 2021) **beat GANs**, with easier training and more diverse, higher-quality images. The downside: slow sampling.

### The forward process (fixed; adds noise)

At each step t = 1…T (T = 1,000 in DDPM, 4,000 in Improved DDPM), scale the image by √(1 − βₜ) and add Gaussian noise of variance βₜ:

> **q(xₜ | xₜ₋₁) = 𝒩( √(1−βₜ) · xₜ₋₁ ,  βₜ I )**

**Shortcut** (jump straight to step t), with αₜ = 1 − βₜ and ᾱₜ = α₁·α₂·…·αₜ:

> **q(xₜ | x₀) = 𝒩( √ᾱₜ · x₀ ,  (1 − ᾱₜ) I )**, i.e. **xₜ = √ᾱₜ x₀ + √(1−ᾱₜ) ε**

The **cosine schedule** (Improved DDPM) sets ᾱₜ = f(t)/f(0) with f(t) = cos²(((t/T + s)/(1+s))·π/2), s = 0.008, βₜ clipped at 0.999. The signal fades slowly at the start and the end.

```python
def variance_schedule(T, s=0.008, max_beta=0.999):
    t = torch.linspace(0, T, T + 1)
    f = torch.cos((t / T + s) / (1 + s) * torch.pi / 2) ** 2
    alpha_bars = f / f[0]
    betas = torch.cat([torch.zeros(1), (1 - f[1:] / f[:-1]).clamp(max=max_beta)])
    return 1 - betas, betas, alpha_bars

def forward_diffusion(x0, t):
    eps = torch.randn_like(x0)                          # the TARGET the model must predict
    return alpha_bars[t].sqrt() * x0 + (1 - alpha_bars[t]).sqrt() * eps, eps
```

### Training (learn to reverse)

Sample an image x₀ (scaled to [−1, 1]) and a random step t; make xₜ; train a network **ε_θ(xₜ, t) to predict the noise ε**, not the clean image. Predicting noise is more stable, and the KL between Gaussians reduces to a squared distance, so an MSE, MAE or Huber loss works. The network is usually a **U-Net** (Part 18's FCN idea: down/up-sampling with skip connections), with **sinusoidal time-step embeddings** (like transformer positional encodings) and **attention** layers.

### Sampling (generate)

- **DDPM:** start from xₜ ~ 𝒩(0, I) and apply **xₜ₋₁ = (1/√αₜ)·(xₜ − (βₜ/√(1−ᾱₜ))·ε_θ(xₜ, t)) + σₜz** for **all T steps** (4,000 network calls, which is slow). It is stochastic.
- **DDIM** (Song et al., 2020): the same trained model, but it can **jump many steps at once** (e.g. 50–500 total), with η ∈ [0, 1] controlling randomness (0 = deterministic). Seconds instead of minutes.

```python
def generate_ddim(model, batch_size=32, num_steps=50, eta=0.85):
    model.eval()
    with torch.no_grad():
        xt = torch.randn(batch_size, 1, 28, 28, device=device)
        times = torch.linspace(T - 1, 0, steps=num_steps + 1).long().tolist()
        for t, t_prev in zip(times[:-1], times[1:]):
            eps = model(DiffusionSample(xt, torch.full((batch_size, 1), t, device=device)))
            x0 = (xt - (1 - alpha_bars[t]).sqrt() * eps) / alpha_bars[t].sqrt()
            var = eta * (1 - alpha_bars[t_prev]) / (1 - alpha_bars[t]) * betas[t]
            xt = (alpha_bars[t_prev].sqrt() * x0 +
                  (1 - alpha_bars[t_prev] - var).sqrt() * eps + var.sqrt() * torch.randn_like(xt))
    return torch.clamp((xt + 1) / 2, 0, 1)
```

### Latent diffusion and Stable Diffusion

**Latent diffusion** (Rombach et al., 2021): run diffusion in the **compressed latent space of an autoencoder**, not in pixels. It is much faster and cheaper, with outstanding quality. **Conditioning** (text through a text encoder and cross-attention; images; masks) enables text-to-image, **inpainting** (fill holes), **outpainting** (extend borders) and image-to-image. **Stable Diffusion** (open-sourced August 2022 by LMU Munich, Stability AI and Runway, with support from EleutherAI and LAION) put this on everyone's laptop.

<figure class="dia anim"><svg viewBox="0 0 720 230" role="img" aria-label="Animation: latent diffusion; a text prompt is encoded and conditions a denoiser that turns pure noise into a clean latent over many steps, which a VAE decoder turns into an image">
<rect class="sB" x="14" y="30" width="150" height="46" rx="8"/><text class="sT" x="89" y="51" text-anchor="middle">prompt</text><text class="sC" x="89" y="67" text-anchor="middle">"orangutan reading"</text><line class="sL" x1="164" y1="53" x2="196" y2="53" marker-end="url(#ah)"/><rect class="sV" x="200" y="30" width="130" height="46" rx="8"/><text class="sT" x="265" y="51" text-anchor="middle">text encoder</text><text class="sC" x="265" y="67" text-anchor="middle">CLIP / T5</text>
<line class="sLm" x1="265" y1="76" x2="265" y2="106" marker-end="url(#ahm)"/><text class="sC" x="275" y="96">conditioning</text>
<rect class="sA" x="120" y="116" width="13" height="13" rx="1" opacity="0.26"/><rect class="sA" x="134" y="116" width="13" height="13" rx="1" opacity="0.83"/><rect class="sA" x="148" y="116" width="13" height="13" rx="1" opacity="0.76"/><rect class="sA" x="162" y="116" width="13" height="13" rx="1" opacity="0.35"/><rect class="sA" x="120" y="130" width="13" height="13" rx="1" opacity="0.55"/><rect class="sA" x="134" y="130" width="13" height="13" rx="1" opacity="0.51"/><rect class="sA" x="148" y="130" width="13" height="13" rx="1" opacity="0.67"/><rect class="sA" x="162" y="130" width="13" height="13" rx="1" opacity="0.78"/><rect class="sA" x="120" y="144" width="13" height="13" rx="1" opacity="0.23"/><rect class="sA" x="134" y="144" width="13" height="13" rx="1" opacity="0.17"/><rect class="sA" x="148" y="144" width="13" height="13" rx="1" opacity="0.82"/><rect class="sA" x="162" y="144" width="13" height="13" rx="1" opacity="0.50"/><rect class="sA" x="120" y="158" width="13" height="13" rx="1" opacity="0.76"/><rect class="sA" x="134" y="158" width="13" height="13" rx="1" opacity="0.15"/><rect class="sA" x="148" y="158" width="13" height="13" rx="1" opacity="0.51"/><rect class="sA" x="162" y="158" width="13" height="13" rx="1" opacity="0.73"/><text class="sC" x="148" y="194" text-anchor="middle">pure noise</text>
<line class="sLm" x1="180" y1="144" x2="216" y2="144" marker-end="url(#ahm)"/>
<rect class="sA" x="220" y="116" width="13" height="13" rx="1" opacity="0.35"/><rect class="sA" x="234" y="116" width="13" height="13" rx="1" opacity="0.84"/><rect class="sA" x="248" y="116" width="13" height="13" rx="1" opacity="0.87"/><rect class="sA" x="262" y="116" width="13" height="13" rx="1" opacity="0.23"/><rect class="sA" x="220" y="130" width="13" height="13" rx="1" opacity="0.29"/><rect class="sA" x="234" y="130" width="13" height="13" rx="1" opacity="0.65"/><rect class="sA" x="248" y="130" width="13" height="13" rx="1" opacity="0.77"/><rect class="sA" x="262" y="130" width="13" height="13" rx="1" opacity="0.50"/><rect class="sA" x="220" y="144" width="13" height="13" rx="1" opacity="0.46"/><rect class="sA" x="234" y="144" width="13" height="13" rx="1" opacity="0.46"/><rect class="sA" x="248" y="144" width="13" height="13" rx="1" opacity="0.29"/><rect class="sA" x="262" y="144" width="13" height="13" rx="1" opacity="0.46"/><rect class="sA" x="220" y="158" width="13" height="13" rx="1" opacity="0.47"/><rect class="sA" x="234" y="158" width="13" height="13" rx="1" opacity="0.57"/><rect class="sA" x="248" y="158" width="13" height="13" rx="1" opacity="0.47"/><rect class="sA" x="262" y="158" width="13" height="13" rx="1" opacity="0.35"/><text class="sC" x="248" y="194" text-anchor="middle">step 12</text>
<line class="sLm" x1="280" y1="144" x2="316" y2="144" marker-end="url(#ahm)"/>
<rect class="sA" x="320" y="116" width="13" height="13" rx="1" opacity="0.36"/><rect class="sA" x="334" y="116" width="13" height="13" rx="1" opacity="0.57"/><rect class="sA" x="348" y="116" width="13" height="13" rx="1" opacity="0.63"/><rect class="sA" x="362" y="116" width="13" height="13" rx="1" opacity="0.28"/><rect class="sA" x="320" y="130" width="13" height="13" rx="1" opacity="0.73"/><rect class="sA" x="334" y="130" width="13" height="13" rx="1" opacity="0.73"/><rect class="sA" x="348" y="130" width="13" height="13" rx="1" opacity="0.53"/><rect class="sA" x="362" y="130" width="13" height="13" rx="1" opacity="0.46"/><rect class="sA" x="320" y="144" width="13" height="13" rx="1" opacity="0.91"/><rect class="sA" x="334" y="144" width="13" height="13" rx="1" opacity="0.61"/><rect class="sA" x="348" y="144" width="13" height="13" rx="1" opacity="0.44"/><rect class="sA" x="362" y="144" width="13" height="13" rx="1" opacity="0.64"/><rect class="sA" x="320" y="158" width="13" height="13" rx="1" opacity="0.56"/><rect class="sA" x="334" y="158" width="13" height="13" rx="1" opacity="0.67"/><rect class="sA" x="348" y="158" width="13" height="13" rx="1" opacity="0.88"/><rect class="sA" x="362" y="158" width="13" height="13" rx="1" opacity="0.44"/><text class="sC" x="348" y="194" text-anchor="middle">step 25</text>
<line class="sLm" x1="380" y1="144" x2="416" y2="144" marker-end="url(#ahm)"/>
<rect class="sA" x="420" y="116" width="13" height="13" rx="1" opacity="0.50"/><rect class="sA" x="434" y="116" width="13" height="13" rx="1" opacity="0.64"/><rect class="sA" x="448" y="116" width="13" height="13" rx="1" opacity="0.75"/><rect class="sA" x="462" y="116" width="13" height="13" rx="1" opacity="0.45"/><rect class="sA" x="420" y="130" width="13" height="13" rx="1" opacity="0.69"/><rect class="sA" x="434" y="130" width="13" height="13" rx="1" opacity="0.86"/><rect class="sA" x="448" y="130" width="13" height="13" rx="1" opacity="0.43"/><rect class="sA" x="462" y="130" width="13" height="13" rx="1" opacity="0.63"/><rect class="sA" x="420" y="144" width="13" height="13" rx="1" opacity="0.70"/><rect class="sA" x="434" y="144" width="13" height="13" rx="1" opacity="0.38"/><rect class="sA" x="448" y="144" width="13" height="13" rx="1" opacity="0.67"/><rect class="sA" x="462" y="144" width="13" height="13" rx="1" opacity="0.77"/><rect class="sA" x="420" y="158" width="13" height="13" rx="1" opacity="0.36"/><rect class="sA" x="434" y="158" width="13" height="13" rx="1" opacity="0.62"/><rect class="sA" x="448" y="158" width="13" height="13" rx="1" opacity="0.83"/><rect class="sA" x="462" y="158" width="13" height="13" rx="1" opacity="0.46"/><text class="sC" x="448" y="194" text-anchor="middle">step 37</text>
<line class="sLm" x1="480" y1="144" x2="516" y2="144" marker-end="url(#ahm)"/>
<rect class="sA" x="520" y="116" width="13" height="13" rx="1" opacity="0.39"/><rect class="sA" x="534" y="116" width="13" height="13" rx="1" opacity="0.63"/><rect class="sA" x="548" y="116" width="13" height="13" rx="1" opacity="0.87"/><rect class="sA" x="562" y="116" width="13" height="13" rx="1" opacity="0.39"/><rect class="sA" x="520" y="130" width="13" height="13" rx="1" opacity="0.63"/><rect class="sA" x="534" y="130" width="13" height="13" rx="1" opacity="0.87"/><rect class="sA" x="548" y="130" width="13" height="13" rx="1" opacity="0.39"/><rect class="sA" x="562" y="130" width="13" height="13" rx="1" opacity="0.63"/><rect class="sA" x="520" y="144" width="13" height="13" rx="1" opacity="0.87"/><rect class="sA" x="534" y="144" width="13" height="13" rx="1" opacity="0.39"/><rect class="sA" x="548" y="144" width="13" height="13" rx="1" opacity="0.63"/><rect class="sA" x="562" y="144" width="13" height="13" rx="1" opacity="0.87"/><rect class="sA" x="520" y="158" width="13" height="13" rx="1" opacity="0.39"/><rect class="sA" x="534" y="158" width="13" height="13" rx="1" opacity="0.63"/><rect class="sA" x="548" y="158" width="13" height="13" rx="1" opacity="0.87"/><rect class="sA" x="562" y="158" width="13" height="13" rx="1" opacity="0.39"/><text class="sC" x="548" y="194" text-anchor="middle">clean latent</text>
<text class="sC" x="365" y="216" text-anchor="middle">the denoiser predicts and removes noise, step by step, in a small latent space</text>
<line class="sL" x1="620" y1="144" x2="650" y2="144" marker-end="url(#ah)"/><rect class="sG" x="654" y="120" width="60" height="48" rx="8"/><text class="sT" x="684" y="142" text-anchor="middle">VAE</text><text class="sC" x="684" y="158" text-anchor="middle">decode</text>
<text class="sGt" x="684" y="186" text-anchor="middle">image</text>
<circle class="sP" r="5"><animateMotion dur="5s" repeatCount="indefinite" path="M148 144 H620"/></circle>
</svg><figcaption>Stable Diffusion in one line: denoise in a compressed latent space, guided by the text, then decode once to pixels.</figcaption></figure>

```python
from diffusers import AutoPipelineForText2Image
pipe = AutoPipelineForText2Image.from_pretrained("stabilityai/sd-turbo", variant="fp16",
                                                 dtype=torch.float16).to(device)
image = pipe(prompt="A closeup photo of an orangutan reading a book",
             num_inference_steps=1, guidance_scale=0.0).images[0]   # turbo: 1 step
```

**Classifier-free guidance** (the `guidance_scale` knob in most pipelines): combine the conditional and unconditional noise predictions to follow the prompt more strongly, at the cost of diversity. Distilled "turbo"/"lightning" models need 1–4 steps.

> [!success] 🔭 State of the art — generative models (2025–26).
> - **Diffusion transformers (DiT)** replaced U-Nets in many top models (e.g. Stable Diffusion 3, FLUX), and **flow matching / rectified flow** training objectives are now common. They are simpler and allow few-step sampling.
> - **Video generation:** OpenAI **Sora** (2024), Google **Veo** (Veo 3 in 2025, with audio), plus open models. They are diffusion (transformer) models over spatio-temporal latents.
> - **Autoregressive image generation** returned inside multimodal LLMs, which generate and edit images natively in chat.
> - **Provenance and safety:** content credentials (**C2PA**), invisible watermarks (e.g. Google's SynthID), and deepfake detection. Deepfake fraud (voice cloning in "CEO fraud", fake-ID onboarding) is a real risk for telecom and fintech KYC.
> - **Synthetic tabular data** for privacy-preserving analytics and testing: CTGAN/TVAE (`SDV` library), diffusion-based tabular generators. Evaluate it on **fidelity** (statistical similarity), **utility** (train on synthetic, test on real) and **privacy** (membership-inference and nearest-neighbour distance checks). Synthetic data is *not* automatically anonymous.

---

## 23.5 Real-world examples 🟡

| Example | Model family | Note |
|---|---|---|
| Credit-card and network-intrusion anomaly detection | Autoencoder reconstruction error | Train on normal data; alert on high error |
| **Manufacturing visual inspection** with few defect examples | Convolutional or denoising autoencoders, feature-embedding methods | Defects are rare, so learn "normal" |
| Photo denoising and super-resolution in phone cameras | Denoising autoencoders, GANs, diffusion | Real-time constraints favour fast models |
| **thispersondoesnotexist.com** | StyleGAN | Photorealism and a deepfake warning |
| **Stable Diffusion, Midjourney, DALL·E 3, Imagen** | (Latent) diffusion | Creative tools, marketing assets |
| AlphaFold 3 (2024) | A diffusion module for 3D structure | Diffusion beyond images |
| Drug and material design | VAEs, diffusion over molecules | Generative science |
| **Telecom (e&-relevant)** | **Network KPI anomaly detection** (autoencoders or VAEs over multivariate cell-KPI vectors; alert on reconstruction error, then root-cause analysis); **fraud** (autoencoder scores on CDR behaviour profiles as features for supervised models); **synthetic subscriber data** for sharing with vendors or testing without exposing PII (SDV/CTGAN, validated for privacy); **marketing creatives** in Arabic and English generated with diffusion (with brand and legal review); **deepfake-resistant KYC** (liveness detection) | Unsupervised → semi-supervised pipelines; governance of generated content |

**Autoencoder anomaly detection — a practical recipe:**
1. Train only on a period believed to be normal. Scale the features (fit on train only).
2. Pick the threshold on validation data: a percentile of reconstruction error (e.g. P99), or tuned against the few known incidents for precision@k.
3. Monitor drift: seasonality shifts "normal". Retrain on rolling windows or model the seasonal baseline first (Part 19).
4. Explain alerts with **per-feature reconstruction error** (which KPIs deviated).
5. Compare against Isolation Forest and seasonal-residual baselines (Part 9 §9.20).

---

> [!check] ✅ Key takeaways
> - Autoencoders compress through a bottleneck; reconstruction error is a practical anomaly score.
> - VAEs learn a smooth latent space you can sample from; GANs are sharp but unstable (mode collapse).
> - Diffusion models learn to remove noise step by step — best quality, slower sampling (DDIM, latent diffusion help).
> - Synthetic data must be checked for fidelity, utility and privacy.

## 23.6 Interview drill — generative models (Géron Ch. 18 exercises, answered) 🔴

> [!info] 📖 Géron Ch. 18 · Exercises · p. 739

**1. Main tasks autoencoders are used for?** Dimensionality reduction and visualisation, feature extraction, unsupervised pretraining, anomaly detection, denoising, and (VAEs) generation; discrete VAEs for tokenising images and audio.

**2. Plenty of unlabelled data, a few thousand labels: how can autoencoders help?** Train an (ideally denoising or convolutional) autoencoder on *all* the data, then reuse its encoder as the lower layers of a classifier trained on the labelled subset. Freeze first, then fine-tune. Compare against training from scratch.

**3. Is perfect reconstruction good? How do you evaluate an autoencoder?** Not necessarily: it may just have learned the identity (overcomplete, no useful features). Judge it by reconstruction error on *validation* data, and above all by downstream usefulness (classifier accuracy with the encoder, anomaly-detection precision/recall, sample quality for generative models).

**4. Undercomplete vs overcomplete, and the risks?** Undercomplete: codings smaller than the input. If *too* small, it can't reconstruct (underfits, loses information). Overcomplete: codings ≥ the input. Risk: it copies the input without learning structure, unless constrained (noise, sparsity).

**5. How and why tie weights?** Set each decoder layer's weight matrix to the transpose of the mirrored encoder layer (with separate biases). It halves the parameters, speeds up training and reduces overfitting.

**6. What is a generative model? A generative autoencoder?** A model that can sample new instances resembling the training data (it models the data distribution). The variational autoencoder (and dVAE/VQ-VAE).

**7. What is a GAN, and where does it shine?** A generator vs discriminator trained adversarially. Photorealistic image synthesis, super-resolution, colourisation, image editing and inpainting, image-to-image translation, data augmentation, and fast generation.

**8. The main difficulties training GANs?** Mode collapse, oscillation and instability, no convergence guarantee, hyperparameter sensitivity. Hard to evaluate (use FID/IS plus human review).

**9. What are diffusion models good at, and their main limitation?** High-quality, diverse generation with stable training and flexible conditioning (text, image, masks). The limitation is slow sampling (many denoising steps), mitigated by DDIM, latent diffusion, distillation and few-step flow models.

**More that come up:**
- **"Explain the reparameterisation trick."** Write z = μ + σ ⊙ ε with ε ~ 𝒩(0, I), so the randomness sits in ε and gradients flow through μ and σ.
- **"Why does a diffusion model predict noise instead of the image?"** It is empirically more stable, and with Gaussian noise the objective simplifies to an MSE between the predicted and true noise.
- **"How would you evaluate synthetic data?"** Fidelity (distribution and correlation similarity), utility (train on synthetic, test on real (TSTR) vs train on real), and privacy (membership inference, distance to the closest real record, no rare-record memorisation).
- **"Autoencoder vs Isolation Forest for anomalies?"** An autoencoder captures complex, non-linear, multivariate structure (images, many correlated KPIs) but needs tuning and data. Isolation Forest is fast, a good tabular baseline, and has fewer knobs. Try both, and evaluate on labelled incidents.

---

## Further reading and sources

**Book:** Géron Ch. 18 + notebook (exercises 10–13: denoising-autoencoder pretraining with 500 labels, a VAE, a DCGAN with experience replay, a **class-conditional diffusion model** on Flowers102).

**Papers:** Kingma & Welling (2013) VAE · Vincent et al. (2008/2010) denoising AE · Goodfellow et al. (2014) GAN · Radford et al. (2015) DCGAN · Karras et al. (2018–2020) ProGAN/StyleGAN · Arjovsky et al. (2017) WGAN · Lucic et al. (2018) "Are GANs Created Equal?" · van den Oord et al. (2017) VQ-VAE · Jang et al. / Maddison et al. (2016) Gumbel-softmax · Sohl-Dickstein et al. (2015) · **Ho et al. (2020) DDPM** · Nichol & Dhariwal (2021) · Song et al. (2020) DDIM · **Rombach et al. (2021) latent diffusion** · Ho & Salimans (2022) classifier-free guidance · Peebles & Xie (2022) DiT · Lipman et al. (2022) flow matching.

**Resources:** Lilian Weng, *"What are Diffusion Models?"* and her VAE/GAN posts · Hugging Face **Diffusion Models Course** and the `diffusers` docs · Carl Doersch, *Tutorial on Variational Autoencoders* (2016) · the **SDV (Synthetic Data Vault)** docs for tabular synthetic data · Anthropic's *"Scaling Monosemanticity"* (sparse autoencoders for interpretability).

---

<!-- nav -->
> [!example] 🧭 Step 22 of 26 · Stage 6 of 7: Modern AI
> ← [Part 22 · ViT & multimodal](22_Vision_and_Multimodal_Transformers.md) · [Part 24 · RL & bandits](24_Reinforcement_Learning.md) → · [Course map](00_START_HERE.md)
<!-- /nav -->
