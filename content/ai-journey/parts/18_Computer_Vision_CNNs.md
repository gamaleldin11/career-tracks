# Part 18 — Computer Vision with Convolutional Neural Networks

<!-- nav -->
> [!example] 🧭 Step 17 of 26 · Stage 5 of 7: Deep learning
> ← [Part 17 · Training deep nets](17_Training_Deep_Neural_Networks.md) · [Part 19 · Time series & RNNs](19_Sequences_RNNs_and_Time_Series.md) → · [Course map](00_START_HERE.md)
<!-- /nav -->

**Source:** Géron, *Hands-On ML with Scikit-Learn and PyTorch* (2025), **Chapter 12** "Deep Computer Vision Using Convolutional Neural Networks". Vision *transformers* and multimodal models follow in Part 22 (Chapter 16), and generative image models in Part 23 (Chapter 18). **🔭 State of the art** boxes bring each topic up to 2025–26.

**Prerequisites:** Part 11 (the PyTorch loop), Part 17 (initialisation, BN, optimisers, transfer learning).

<!-- interview-focus -->

> [!tip] 🎯 Interview focus
> **Why it matters:** For general DS roles, CNNs are concept-level. They matter more for document AI (IDs, invoices), network-site imagery and retail analytics.
>
> | Level | What you should be able to do |
> |---|---|
> | 🟢 **Entry** | What a convolution and a pooling layer do; why CNNs beat MLPs on images; transfer learning in one sentence. |
> | 🟡 **Mid** | Output-size and parameter arithmetic; the ResNet skip-connection idea; a fine-tuning workflow with a pretrained backbone; IoU and mAP basics. |
> | 🔴 **Senior** | Detection and segmentation system design (YOLO/RT-DETR/SAM), GPU memory budgeting, edge deployment. |
>
> **⭐ Most-asked:** *What is a convolution? Why share weights?* · *Compute the output size / parameter count of a conv layer.* · *Why do residual connections help?* · *How would you fine-tune a pretrained CNN on 2,000 images?* · *What is IoU / mAP?*
>
> **⏱ Time:** 3 h  ·  **Short on time?** Read §18.2, §18.3, §18.5 (ResNet), §18.7.

**Legend:** 🟢 Entry (0–2 yrs) · 🟡 Mid (2–5 yrs) · 🔴 Senior / specialist · ⭐ frequently asked · 📖 Géron, *Hands-On ML with Scikit-Learn and PyTorch* (2025) pages

> [!abstract]- 🗺️ Section map — level and book pages
>
> | § | Section | Level | 📖 Book |
> |---|---|:---:|---|
> | 18.1 | Why convolutions? The biology and the arithmetic | 🟢 | Ch. 12 · p. 418 |
> | 18.2 | Convolutional layers | 🟡 ⭐ | Ch. 12 · pp. 419–429 |
> | 18.3 | Pooling layers | 🟡 | Ch. 12 · pp. 429–433 |
> | 18.4 | A first CNN: Fashion-MNIST at ~92% | 🟡 | Ch. 12 · p. 433 onward |
> | 18.5 | The architecture timeline — the story interviewers like | 🟡 ⭐ | Ch. 12 · pp. 433–454 |
> | 18.6 | GPU memory — why training is so much hungrier than inference | 🔴 | Ch. 12 · pp. 454–457 |
> | 18.7 | Transfer learning for vision — the everyday workflow | 🟡 ⭐ | Ch. 12 · pp. 458–464 |
> | 18.8 | Beyond classification: localisation, detection, tracking, segmentation | 🔴 | Ch. 12 · pp. 464–481 |
> | 18.9 | Real-world examples | 🟡 | — |
> | 18.10 | Interview drill — CNNs | 🟡 | Ch. 12 · p. 481 |
>

---

## 18.1 Why convolutions? The biology and the arithmetic 🟢

> [!info] 📖 Géron Ch. 12 · “The Architecture of the Visual Cortex” · p. 418

**Biology.** Hubel & Wiesel (1958–59, Nobel Prize 1981) found that visual-cortex neurons have small **local receptive fields**. Some respond only to lines of one orientation, and higher neurons combine lower ones into more complex patterns over larger fields. That inspired Fukushima's **neocognitron** (1980), then LeCun's **LeNet-5** (1998), which banks used to read handwritten digits on cheques.

**Arithmetic.** A fully connected layer on a 100×100 image with 1,000 neurons already has **10 million weights**, and a 150×100 RGB image producing 200 same-size feature maps would need **~135 billion** parameters as dense layers. CNNs replace this with two ideas:
1. **Local (partial) connectivity:** each neuron sees only a small receptive field.
2. **Weight sharing:** every neuron in a feature map uses the **same kernel**, so a pattern learned in one place is recognised **anywhere**. A dense network would have to relearn it at every position.

The hierarchy follows: edges → textures → parts → objects. **End-to-end learning** means one model maps raw pixels to the answer, unlike classical pipelines of hand-built modules.

---

## 18.2 Convolutional layers 🟡 ⭐

> [!info] 📖 Géron Ch. 12 · “Convolutional Layers” · pp. 419–429

![A 3×3 edge-detecting filter slides over the image to produce a feature map; pooling then downsamples it.](figures/fig18_convolution.png)
*A 3×3 edge-detecting filter slides over the image to produce a feature map; pooling then downsamples it.*

> [!quote] 💬 Say it in the interview
> “A convolution slides a small learned filter over the image. Weight sharing and local connectivity mean far fewer parameters than a dense layer and translation-equivariant features.”

### Receptive fields, padding and stride

A neuron at (i, j) in layer l sees rows i…i+f_h−1 and columns j…j+f_w−1 of layer l−1. With **stride** s, it sees rows i·s_h…i·s_h+f_h−1.

**Output size**, the formula to know for interviews:

> **out = ⌊(in + 2·padding − kernel) / stride⌋ + 1**

- `padding="valid"` (= 0, the PyTorch default): output shrinks by kernel − 1 (a 7×7 kernel loses 3 pixels per side).
- `padding="same"`: zero-pad so the output size equals the input size. Only allowed with stride 1 in PyTorch.
- Stride 2 roughly halves each spatial dimension.

### Filters and feature maps

A **filter (kernel)** is the neuron's weights, a tiny image. A vertical-line filter produces a **feature map** that lights up on vertical lines. Filters are **learned**, not hand-designed. A conv layer has **many** filters and outputs one feature map per filter, so its output is 3-D (channels × H × W). Each filter spans **all input channels**.

The neuron output (Géron's Equation 12-1):

> **z_{i,j,k} = b_k + Σ_u Σ_v Σ_{k'} x_{i·s_h+u, j·s_w+v, k'} · w_{u,v,k',k}**

(Technically this is a **cross-correlation**, but everyone calls it convolution.)

### In PyTorch

```python
import torch, torch.nn as nn
conv = nn.Conv2d(in_channels=3, out_channels=32, kernel_size=7, padding="same")
x = torch.rand(2, 3, 70, 120)                  # [batch, channels, H, W] (channels-first!)
fmaps = conv(x)                                # → [2, 32, 70, 120]
conv.weight.shape                              # [32, 3, 7, 7] = [out, in, kh, kw]
conv.bias.shape                                # [32]
```

- **Image height and width don't appear in the weight shape**, so the layer accepts images of any size (≥ the kernel) with the right number of channels.
- **Parameters** = (k_h · k_w · C_in + 1) · C_out. Here (7·7·3 + 1)·32 = **4,736**.
- **Always put an activation after a conv layer.** Stacked linear convolutions collapse into one.
- Default init is uniform ±1/√fan_in with fan_in = k_h·k_w·C_in. **Re-initialise with He** for ReLU networks (Part 17 §17.1).
- Images from PIL, NumPy or matplotlib are channels-**last** [H, W, C]. Convert with `x.permute(0, 3, 1, 2)` or TorchVision's `T.ToImage()`.

### Other convolution types

| Layer | What | Use |
|---|---|---|
| `nn.Conv1d` | Slides over one axis | Time series, audio, text (Part 19) |
| `nn.Conv3d` | Over volumes | CT/MRI scans, video |
| **Dilated (à-trous)** `dilation=2+` | Inserts holes in the filter | Larger receptive field at no extra cost (segmentation, WaveNet) |
| **Depthwise separable** | One spatial filter per channel (`groups=in_channels`) + a 1×1 pointwise conv | Far fewer parameters and FLOPs. Xception, MobileNet |
| **1×1 conv** | Mixes channels only | Bottlenecks (reduce channels), cross-channel patterns |
| **Transposed conv** `nn.ConvTranspose2d` | Upsampling (stretch with zeros, then convolve) | Segmentation, generators. "Deconvolution" is a misnomer |

```python
class SeparableConv2d(nn.Module):
    def __init__(self, c_in, c_out, k, stride=1, padding=0):
        super().__init__()
        self.depthwise = nn.Conv2d(c_in, c_in, k, stride=stride, padding=padding, groups=c_in)
        self.pointwise = nn.Conv2d(c_in, c_out, kernel_size=1)
    def forward(self, x):
        return self.pointwise(self.depthwise(x))
# Avoid right after layers with few channels (e.g. the RGB input).
```

---

## 18.3 Pooling layers 🟡

> [!info] 📖 Géron Ch. 12 · “Pooling Layers” · pp. 429–433

Pooling **subsamples**: less compute, less memory, fewer downstream parameters, less overfitting. It has **no weights**; it aggregates with max or mean.

```python
nn.MaxPool2d(kernel_size=2)            # stride defaults to the kernel size → halves H and W
nn.AvgPool2d(kernel_size=2)
nn.AdaptiveAvgPool2d(output_size=1)    # GLOBAL average pooling: one number per feature map
```

- **Max pooling** is usually preferred: it keeps the strongest signal and adds some **translation invariance** (and a little rotation and scale invariance). The cost is that it discards 75% of the values.
- **Invariance vs equivariance:** classification wants invariance (the label shouldn't change if the object shifts). **Segmentation wants equivariance**: shift the input and the mask should shift too. So aggressive pooling hurts dense-prediction tasks.
- **Global average pooling (GAP)** before the classifier replaced AlexNet's huge dense layers and cut parameters dramatically.
- **Depthwise max pooling** (pooling across channels) can learn invariance to rotation, thickness or colour. PyTorch has no built-in layer; Géron builds one with `F.max_pool1d` over the channel axis.

---

## 18.4 A first CNN: Fashion-MNIST at ~92% 🟡

> [!info] 📖 Géron Ch. 12 · “CNN Architectures” (first CNN) · p. 433 onward

```python
from functools import partial
DefaultConv2d = partial(nn.Conv2d, kernel_size=3, padding="same")

model = nn.Sequential(
    DefaultConv2d(1, 64, kernel_size=7), nn.ReLU(), nn.MaxPool2d(2),     # 28 → 14
    DefaultConv2d(64, 128), nn.ReLU(), DefaultConv2d(128, 128), nn.ReLU(),
    nn.MaxPool2d(2),                                                    # 14 → 7
    DefaultConv2d(128, 256), nn.ReLU(), DefaultConv2d(256, 256), nn.ReLU(),
    nn.MaxPool2d(2),                                                    # 7 → 3
    nn.Flatten(),                                                       # 256·3·3 = 2,304
    nn.Linear(2304, 128), nn.ReLU(), nn.Dropout(0.5),
    nn.Linear(128, 64), nn.ReLU(), nn.Dropout(0.5),
    nn.Linear(64, 10),                                                  # logits → CrossEntropyLoss
).to(device)
```

Design rules visible here:
- **Double the filters after each pooling layer** (64 → 128 → 256). The spatial size halves, so the compute stays balanced, and there are many more ways to combine low-level features.
- **Two 3×3 convs beat one 5×5**: fewer parameters, more non-linearity, the same receptive field. The exception is the first layer, where a big kernel (7×7, often stride 2) is cheap because there are only 3 input channels.
- **Can't work out `in_features`?** Use `nn.LazyLinear(128)`, or let it crash: the error message prints the right shape (`mat1 and mat2 shapes cannot be multiplied (32x2304 …)`).

It reaches **~92% test accuracy**, versus ~89% for the dense MLP in Part 11.

---

## 18.5 The architecture timeline — the story interviewers like 🟡 ⭐

> [!info] 📖 Géron Ch. 12 · “CNN Architectures” → “Choosing the Right CNN Architecture” · pp. 433–454

> [!quote] 💬 Say it in the interview
> “The key idea since 2015 is ResNet's skip connection: each block learns a residual F(x) + x, so gradients flow and networks can be 100+ layers deep.”

ImageNet ILSVRC has 1,000 classes (including ~120 dog breeds). The top-5 error fell from **>26% to <2.3% in six years.**

| Year | Architecture | Top-5 error | Key idea(s) |
|---|---|---|---|
| 1998 | **LeNet-5** | (MNIST) | Conv + avg-pool + tanh. Read bank cheques |
| 2012 | **AlexNet** (Krizhevsky, Sutskever, Hinton) | **17%** vs 26% for the runner-up | Big and deep, **stacked conv layers directly**, **ReLU**, **dropout 50%**, **data augmentation**, GPUs, LRN. *The moment deep learning took over vision* |
| 2013 | ZFNet | — | Tuned AlexNet; visualising what filters learn |
| 2014 | **GoogLeNet / Inception** | <7% | **Inception modules** (parallel 1×1, 3×3, 5×5 convs and pooling, concatenated); **1×1 bottlenecks**; **global average pooling**; **10× fewer parameters** than AlexNet (6M vs 60M) |
| 2014 | **VGGNet** (runner-up) | — | Radical simplicity: stacks of 3×3 convs (16–19 layers). Still a popular feature extractor |
| 2015 | **ResNet** (He et al.) | **<3.6%** | **Skip connections / residual learning**; 152 layers; BN; bottleneck units (1×1 → 3×3 → 1×1) |
| 2016 | Xception (Chollet) | — | **Depthwise separable convolutions** everywhere |
| 2016 | Inception-v4 / Inception-ResNet | ~3% | Inception + residuals |
| 2016–17 | ResNeXt, DenseNet | — | Grouped parallel paths; every layer feeds every later layer within a block |
| 2017 | **SENet** | **2.25%** | **Squeeze-and-Excitation**: channel-wise attention (GAP → FC bottleneck (÷16) → sigmoid → rescale channels) |
| 2017+ | **MobileNet**, SqueezeNet, ShuffleNet, MnasNet | — | Mobile efficiency |
| 2019 | **EfficientNet** (Tan & Le) | — | **Compound scaling** of depth, width and resolution; NAS-found baseline |
| 2022 | **ConvNeXt** | — | A ResNet modernised with ViT lessons: 7×7 kernels, fewer activations and norms, LayerNorm |

### Residual learning — why it matters most

A block learns **f(x) = h(x) − x**, and the output is **f(x) + x**.
- At initialisation (weights ≈ 0) the block ≈ **identity**. Networks start from "do nothing" and learn *corrections*, which is usually easy because the target is often close to the identity.
- The skip path is a **gradient highway**: the signal crosses many layers even before they have learned anything. This is what made 152-layer (and later 1,000-layer) networks trainable, and it is **inherited by every transformer** (Part 21).
- When the shape changes (stride 2, more channels), the skip uses a **1×1 conv with stride 2** to match.
- **Stochastic depth:** randomly drop whole residual units during training (`torchvision.ops.stochastic_depth`). Faster training, regularisation.

```python
import torch.nn.functional as F

class ResidualUnit(nn.Module):
    def __init__(self, c_in, c_out, stride=1):
        super().__init__()
        Conv = partial(nn.Conv2d, kernel_size=3, stride=1, padding=1, bias=False)
        self.main = nn.Sequential(
            Conv(c_in, c_out, stride=stride), nn.BatchNorm2d(c_out), nn.ReLU(),
            Conv(c_out, c_out), nn.BatchNorm2d(c_out))
        self.skip = (nn.Sequential(nn.Conv2d(c_in, c_out, 1, stride=stride, bias=False),
                                   nn.BatchNorm2d(c_out))
                     if stride > 1 else nn.Identity())
    def forward(self, x):
        return F.relu(self.main(x) + self.skip(x))

class ResNet34(nn.Module):
    def __init__(self, n_classes=10):
        super().__init__()
        layers = [nn.Conv2d(3, 64, 7, stride=2, padding=3, bias=False),
                  nn.BatchNorm2d(64), nn.ReLU(), nn.MaxPool2d(3, stride=2, padding=1)]
        prev = 64
        for f in [64] * 3 + [128] * 4 + [256] * 6 + [512] * 3:     # 3-4-6-3 units
            layers.append(ResidualUnit(prev, f, stride=1 if f == prev else 2))
            prev = f
        layers += [nn.AdaptiveAvgPool2d(1), nn.Flatten(), nn.LazyLinear(n_classes)]
        self.net = nn.Sequential(*layers)
    def forward(self, x):
        return self.net(x)
```

Géron: *"in just 45 lines of code, we can build the model that won the ILSVRC 2015 challenge."*

### EfficientNet's compound scaling

With a compute budget of 2^φ FLOPs, scale **depth by αᵠ, width by βᵠ, resolution by γᵠ**, with α·β²·γ² ≈ 2. A grid search at φ = 1 found **α = 1.2, β = 1.1, γ = 1.15**, which generated B0 → B7. Lesson: **scale all three dimensions together**, not just depth.

### Choosing an architecture (TorchVision ImageNet numbers, from Géron's Table 12-3)

| Model | Top-1 | Params | GFLOPs | Note |
|---|---|---|---|---|
| MobileNet v3 small | 67.7% | 2.5M | 0.1 | Phones |
| EfficientNet B0 | 77.7% | 5.3M | 0.4 | Efficient baseline |
| ResNet-34 | 73.3% | 21.8M | 3.7 | Classic |
| **EfficientNet v2 S** | **84.2%** | 21.5M | 8.4 | Best accuracy per parameter here |
| ConvNeXt Tiny | 82.6% | 28.6M | 4.5 | Modern CNN |
| ResNet-152 | 82.3% | 60.2M | 11.5 | |
| EfficientNet v2 L | 85.8% | 118.5M | 56.1 | |
| ConvNeXt Large | 84.4% | 197.8M | 34.4 | |

Choose by the constraint that actually binds: accuracy, model size (mobile), latency or energy.

---

## 18.6 GPU memory — why training is so much hungrier than inference 🔴

> [!info] 📖 Géron Ch. 12 · “GPU RAM Requirements: Inference Versus Training” · pp. 454–457

A conv layer with 200 5×5 filters on a 150×100 RGB image:
- **Parameters:** (5·5·3 + 1)·200 = **15,200** (tiny).
- **Compute:** 200 × 150 × 100 × 75 ≈ **225 million** multiplications.
- **Output activations:** 200 × 150 × 100 floats × 4 bytes = **12 MB per image.** With a batch of 100 that is **1.2 GB for this one layer**.

At **inference**, only ~2 consecutive layers' activations must live in memory at once. In **training**, *every* activation from the forward pass is kept for backprop, plus gradients and optimiser states. A 200M-parameter model can need ~5 GB per image at inference and much more in training.

**Out of memory? Try, in order:**
1. A smaller batch, with **gradient accumulation** (step the optimiser every k batches).
2. **Mixed precision** (bf16/fp16; Part 17 §17.7).
3. **Activation (gradient) checkpointing:** `torch.utils.checkpoint.checkpoint(module, x)` recomputes activations in the backward pass instead of storing them. Compute is traded for memory, and the forward pass must be deterministic.
4. Downsample earlier (stride), remove layers, use a smaller model.
5. Distribute across GPUs, or offload modules to the CPU.
6. **Reversible residual networks (RevNets):** y₁ = x₁ + f(x₂), y₂ = x₂ + g(y₁), which is exactly invertible (x₂ = y₂ − g(y₁), x₁ = y₁ − f(x₂)). No activations are stored, for ~33% extra compute. The idea behind the Reformer transformer.

---

## 18.7 Transfer learning for vision — the everyday workflow 🟡 ⭐

> [!info] 📖 Géron Ch. 12 · “Using TorchVision's Pretrained Models”, “Pretrained Models for Transfer Learning” · pp. 458–464

> [!quote] 💬 Say it in the interview
> “I start from a pretrained backbone (ResNet/ConvNeXt/ViT), replace the head, train it with the backbone frozen, then fine-tune the top blocks with augmentation and a low learning rate.”

**Don't train from scratch. Download a pretrained model.**

```python
import torchvision
weights = torchvision.models.ConvNeXt_Base_Weights.IMAGENET1K_V1
model = torchvision.models.convnext_base(weights=weights).to(device)   # 338 MB, cached
preprocess = weights.transforms()          # EXACT resize + normalisation used in training
model.eval()
with torch.no_grad():
    logits = model(preprocess(images).to(device))
weights.meta["categories"][logits.argmax(1)[0]]       # e.g. 'palace', 'daisy'
```

⚠️ **Always use the model's own preprocessing** (`weights.transforms()`). Wrong input size or wrong normalisation (ImageNet means [0.485, 0.456, 0.406], stds [0.229, 0.224, 0.225]) silently ruins accuracy. This is the vision version of training/serving skew.

**Fine-tuning on a new task** (Géron: Flowers102, only 10 images per class, 102 classes):

```python
model.classifier[2] = nn.Linear(1024, 102).to(device)      # new head
for p in model.parameters():
    p.requires_grad = False
for p in model.classifier.parameters():
    p.requires_grad = True
# train the head → ~90% accuracy already
# then unfreeze everything, LR ÷ 10 (or differential LRs via param groups), continue

import torchvision.transforms.v2 as T
train_tf = T.Compose([
    T.RandomHorizontalFlip(), T.RandomRotation(30),
    T.RandomResizedCrop(224, scale=(0.8, 1.0)),
    T.ColorJitter(0.2, 0.2, 0.2, 0.1),
    T.ToImage(), T.ToDtype(torch.float32, scale=True),
    T.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])])   # augment BEFORE normalising
```

**Data augmentation** creates realistic variants (shift, rotate, rescale, flip, lighting) that must be *learnable* (white noise isn't). Don't flip text or asymmetric objects. `T.AutoAugment` applies policies optimised on ImageNet. **Test-time augmentation (TTA):** average the predictions over several augmented copies at inference.

**Domain-specific pretrained models** beat ImageNet models far from its domain: **TorchGeo** (satellite and aerial imagery), **MONAI** (medical imaging), **AgML** (agriculture), plus **timm** (hundreds of pretrained backbones) and the **Hugging Face Hub**.

**Géron's improvement checklist:** try other backbones, get more labelled data, ensemble, **analyse failure cases** (shared texture or colour?), performance scheduling, **gradual unfreezing** or differential LRs, try other optimisers and regularisers.

---

## 18.8 Beyond classification: localisation, detection, tracking, segmentation 🔴

> [!info] 📖 Géron Ch. 12 · “Classification and Localization” → “Semantic Segmentation” · pp. 464–481

![Intersection over union decides whether a detection counts as a hit.](figures/fig18_iou.png)
*Intersection over union decides whether a detection counts as a hit.*

### Classification + localisation

Add a **regression head** that outputs 4 numbers (centre x, centre y, width, height) alongside the class head, and train with a weighted sum of losses (Part 11 §11.12).

**Labelling is often the real bottleneck.** Tools: Label Studio, CVAT, Labelme, VGG Image Annotator, Roboflow, LabelBox (many are AI-assisted now). For a few hundred to a few thousand images, label them yourself: it is fast with good tools, and you learn the data.

TorchVision's `tv_tensors.BoundingBoxes` are transformed consistently with the image by transforms v2. (Rotation enlarges the box to fit the rotated box, not the object.)

**Box losses and metrics:**
- **IoU (Jaccard)** = area(P ∩ T) / area(P ∪ T). The standard evaluation metric, but a bad loss: it is 0 with zero gradient when the boxes don't overlap.
- **GIoU** subtracts the empty fraction of the smallest enclosing box, which gives a gradient even without overlap.
- **CIoU** adds the centre distance and aspect-ratio consistency. It converges faster and is becoming the default (`torchvision.ops.complete_box_iou_loss`).
- Plain MSE penalises a 10-pixel error equally on big and small boxes. Taking the square root of width and height before the MSE helps.

### Object detection

Multiple objects, each with a class and a box.
1. **Sliding CNN + objectness score** ("is there an object centred here?", sigmoid + BCE). A separate objectness output works better than a "no-object" class.
2. **Non-max suppression (NMS):** drop low-objectness boxes; keep the highest-scoring box; remove the boxes overlapping it (IoU > ~0.6); repeat.
3. **Fully convolutional networks (FCN):** replace dense layers with convs (a dense layer of N units on 7×7×C maps ≡ N conv filters of 7×7, "valid" padding). The network then accepts **any image size** and computes all window predictions **in one pass**. A 448×448 input gives an 8×8 grid of predictions.
4. **YOLO** (Redmon et al., 2015): per grid cell, predict boxes whose *centre* falls in the cell (2 boxes per cell, each with objectness) plus a class distribution. One pass, real time. Later versions added **anchor priors** (typical box shapes per class), more boxes, multi-scale skip connections, and much more.

**mAP (mean Average Precision):** for each class, AP = the mean over recall levels (0, 0.1, …, 1) of the **maximum precision at ≥ that recall** (which smooths the PR curve's wiggles). Then average over classes. A detection counts only if **IoU ≥ a threshold**: **mAP@0.5** (PASCAL VOC), or **mAP@[.50:.05:.95]** (COCO, averaged over 10 IoU thresholds: *"a mean mean average"*). `torchmetrics.detection.MeanAveragePrecision`.

```python
from ultralytics import YOLO                     # pip install ultralytics
model = YOLO("yolov9m.pt")                       # pretrained on COCO (80 classes)
results = model(["https://homl.info/soccer.jpg"])
results[0].summary()[0]    # {'name': 'sports ball', 'confidence': 0.96, 'box': {...}}
model.train(data="my_dataset.yaml", epochs=50)   # fine-tune on your own classes
```

Other TorchVision detectors: **Faster R-CNN** (two-stage: region proposal network, then classify each proposal; accurate), **SSD / SSDlite** (single-stage; mobile), **RetinaNet** (**focal loss**, which down-weights easy negatives and helps small and rare objects), **FCOS** (anchor-free).

### Object tracking

**DeepSORT:** a **Kalman filter** predicts each track's position (constant velocity), a **deep appearance embedding** measures similarity, and the **Hungarian algorithm** optimally assigns detections to tracks. Géron's bouncing-balls example: position alone would swap two balls after a collision, and appearance fixes it. **BoT-SORT** (the Ultralytics default) adds camera-motion compensation.

```python
for frame in model.track(source="cars.mp4", stream=True, save=True):
    ids = [obj["track_id"] for obj in frame.summary()]
```

### Semantic and instance segmentation

- **Semantic segmentation:** a class per pixel (road, car, person). Objects of the same class merge. **The difficulty is that CNNs lose spatial resolution** (an overall stride of 32).
- **FCN** (Long et al., 2015) upsamples with **transposed convolutions** and **skip connections** from lower, higher-resolution layers (×2 + skip, ×2 + skip, ×8). Upsampling beyond the input size is **super-resolution**.
- **Instance segmentation:** separates each object. **Mask R-CNN** (He et al., 2017) = Faster R-CNN + a per-box pixel mask. Available pretrained in TorchVision (COCO).
- TorchVision transforms v2 handle **masks and videos** (`Mask`, `Video` TVTensors) consistently with the images.

> [!success] 🔭 State of the art — computer vision in 2025–26
> - **Backbones:** CNNs (**ConvNeXt V2, EfficientNetV2**) remain excellent and efficient, especially on edge devices. **Vision transformers** (ViT, Swin) and hybrids lead at scale (Part 22). For features, **self-supervised foundation backbones** such as **DINOv2** (Meta, 2023) give strong frozen features: often *linear probe + DINOv2* beats fine-tuning a small CNN.
> - **Detection:** the YOLO line continued through community and Ultralytics releases (YOLOv8 → YOLO11 and later). **Transformer detectors** (DETR family, **RT-DETR** for real time) removed hand-designed parts like NMS and anchors. **Open-vocabulary detection** (Grounding DINO, OWL-ViT) detects objects described in *text* without retraining.
> - **Segmentation:** **Segment Anything (SAM, 2023; SAM 2 for video, 2024)** from Meta segments any object from a click, box or prompt, zero-shot, and is widely used for **auto-labelling**. U-Net variants dominate medical segmentation (nnU-Net).
> - **Vision-language models** (Part 22) answer questions about images and extract data from documents and screenshots, which increasingly replaces custom OCR pipelines.
> - **Edge deployment:** INT8 or FP16 via TensorRT, ONNX Runtime, ExecuTorch, OpenVINO. YOLO-nano-class models run at video rates on phones and embedded boards.

---

## 18.9 Real-world examples 🟡

| Domain | Example | Technique |
|---|---|---|
| Banking | **LeNet-5 read handwritten cheque digits** in US banks in the 1990s | Early CNN in production |
| Healthcare | **IDx-DR (2018)**, the first FDA-authorised autonomous AI diagnostic, screens for diabetic retinopathy from retinal photos | CNN classification with strict validation |
| Manufacturing | Surface-defect detection on production lines; anomaly detection when defects are rare | Transfer learning, segmentation, autoencoders (Part 23) |
| Autonomous driving / ADAS | Detection + tracking + segmentation of cars, pedestrians, lanes | YOLO/DETR-style detectors, tracking, semantic segmentation |
| Retail | Shelf-stock monitoring, checkout-free stores, visual search | Detection, embeddings + similarity search |
| Agriculture / geospatial | Crop disease from leaf photos; building footprints from satellites | Domain backbones (TorchGeo, AgML), segmentation |
| **Telecom (e&-relevant)** | **Drone inspection of cell towers**: detect antennas and equipment, read labels, spot corrosion or damage; verify installations against the design; field-engineer photo QA; document and ID OCR in shop onboarding (KYC); satellite/aerial analysis for **site planning** and coverage; video analytics for smart-city / enterprise IoT offerings | Detection (YOLO), segmentation (SAM), OCR/VLMs, geo backbones |

---

> [!check] ✅ Key takeaways
> - Convolutions share small filters across the image → few parameters, translation-equivariant features.
> - Pooling (or strides) downsamples; feature maps grow deeper as they shrink spatially.
> - ResNet's skip connections made very deep networks trainable; modern backbones: ConvNeXt, EfficientNet, ViT.
> - Default workflow: pretrained backbone + new head + augmentation, then fine-tune.
> - Detection is measured with IoU and mAP; YOLO-family models are the practical default.
> - Training needs far more GPU memory than inference (activations are kept for backprop).

## 18.10 Interview drill — CNNs (Géron Ch. 12 exercises, answered) 🟡

> [!info] 📖 Géron Ch. 12 · Exercises · p. 481

**1. Advantages of a CNN over a dense DNN for images?** Local connectivity and weight sharing mean far fewer parameters (less overfitting, faster). Translation-equivariant features (a pattern learned once is detected anywhere). A hierarchical composition of features that matches the structure of images. It accepts variable image sizes (FCNs).

**2. Three conv layers (3×3, stride 2, "same"), with 100 → 200 → 400 maps, on 200×300 RGB input.**
- **Parameters:** (3·3·3+1)·100 = 2,800; (3·3·100+1)·200 = 180,200; (3·3·200+1)·400 = 720,400. **Total 903,400.**
- **Feature map sizes:** 100×150×100 = 1.5M; 50×75×200 = 750k; 25×38×400 = 380k values.
- **Inference RAM (one image, fp32):** roughly the largest two consecutive layers (1.5M + 0.75M) × 4 B ≈ **9 MB**, plus parameters (903k × 4 ≈ 3.6 MB) and the input (180k × 4 ≈ 0.7 MB): **≈ 13 MB**.
- **Training on 50 images:** all activations are kept: (1.5M + 0.75M + 0.38M) × 4 B × 50 ≈ **526 MB**, plus inputs (≈ 36 MB), parameters and gradients (≈ 7 MB), and optimiser states. **≈ 0.6 GB or more.**

**3. GPU out of memory: five fixes?** A smaller mini-batch (with gradient accumulation); mixed precision (fp16/bf16); larger strides or fewer or smaller layers; gradient checkpointing (or reversible layers); distribute across GPUs or offload to the CPU. Also: a smaller input resolution.

**4. Max pooling vs a conv with the same stride?** Pooling has no parameters (less compute and memory, less overfitting) and gives some translation invariance. A strided conv is learnable but costs parameters and compute.

**5. Key innovations?**

| Architecture | Key innovation |
|---|---|
| AlexNet | Stacked convs, ReLU, dropout, data augmentation, GPU training |
| GoogLeNet | Inception modules, 1×1 bottlenecks, global average pooling |
| ResNet | Skip connections, enabling very deep networks |
| SENet | Channel attention (feature recalibration) |
| Xception | Depthwise separable convolutions |
| EfficientNet | Compound scaling of depth, width and resolution |
| ConvNeXt | A modernised ResNet with transformer-era choices (large kernels, LayerNorm, fewer activations) |

**6. What is an FCN, and how do you convert a dense layer to a conv layer?** A network of only conv (and pooling) layers, so it accepts any input size and produces spatial maps of predictions. Replace a dense layer of N units that sits on k×k×C maps with N filters of size k×k and "valid" padding, and copy the weights.

**7. The main difficulty of semantic segmentation?** Strided layers destroy spatial resolution. Recover it with upsampling (transposed convs) plus skip connections from higher-resolution layers (FCN, U-Net), or with dilated convolutions.

**More that come up:**
- **"Receptive field of two stacked 3×3 convs?"** 5×5. Three give 7×7, with fewer parameters than one 7×7 (27C² vs 49C²).
- **"Why 1×1 convolutions?"** Channel mixing, bottlenecks (cheaper), and more non-linearity per spatial location.
- **"Precision vs recall in detection; what is mAP@0.5:0.95?"** §18.8.
- **"How would you detect a rare defect with only 50 labelled examples?"** A pretrained backbone with light fine-tuning plus heavy augmentation; anomaly detection trained on normal images (autoencoder reconstruction error, PatchCore-style feature distances); active learning to label more (Part 9 §9.17); SAM-assisted labelling.
- **"Your model is 98% accurate in validation but fails in the factory."** Data mismatch: lighting, camera, angle, background (Part 6 §6.10, train-dev set). Collect in-domain data, augment for the shifts, check preprocessing parity.

---

## Further reading and sources

**Book:** Géron Ch. 12 and notebook (https://homl.info/colab-p); PyTorch's *transfer learning* and *object detection fine-tuning* tutorials (Géron's exercises 9–10).

**Papers:** LeCun et al. (1998) LeNet · Krizhevsky et al. (2012) AlexNet · Simonyan & Zisserman (2014) VGG · Szegedy et al. (2015) GoogLeNet · He et al. (2015) ResNet and (2017) Mask R-CNN · Hu et al. (2018) SENet · Tan & Le (2019) EfficientNet · Liu et al. (2022) ConvNeXt · Redmon et al. (2016) YOLO · Ren et al. (2015) Faster R-CNN · Lin et al. (2017) Focal Loss · Long et al. (2015) FCN · Ronneberger et al. (2015) **U-Net** · Kirillov et al. (2023) **Segment Anything** · Oquab et al. (2023) **DINOv2**.

**Courses and tools:** **Stanford CS231n** (the classic CNN course; lecture notes are free) · **fast.ai *Practical Deep Learning for Coders*** · **timm** docs · **Ultralytics** docs · **Papers with Code / Hugging Face Papers** (trending research) · **Roboflow Universe** (public vision datasets).

---

<!-- nav -->
> [!example] 🧭 Step 17 of 26 · Stage 5 of 7: Deep learning
> ← [Part 17 · Training deep nets](17_Training_Deep_Neural_Networks.md) · [Part 19 · Time series & RNNs](19_Sequences_RNNs_and_Time_Series.md) → · [Course map](00_START_HERE.md)
<!-- /nav -->
